/**
 * ============================================================================
 * NATIVE HTML5 UNIFIED MEDIA PLAYER ENGINE (#core-media-player)
 * ============================================================================
 * Kiến trúc lõi thống nhất trên MỘT thẻ <video id="core-media-player" playsinline>:
 *  1. Chế độ Xem Video thường (Direct MP4 / HLS stream gắn trong #mod39-native-video-host).
 *  2. Chế độ Chỉ Audio Nền (Background Audio-Only): giữ savedTime, chuyển src sang
 *     audioStreamUrl, ẩn khung hình bằng opacity:0 & 1x1px (TUYỆT ĐỐI không dùng
 *     display:none để Safari iOS / Chrome Android không đình chỉ luồng âm thanh).
 *  3. Chế độ Màn Hình Thu Nhỏ Ngoài Trình Duyệt (OS System Native PiP):
 *     - Video PiP API chuẩn (Chrome / Edge / Android / Samsung Internet)
 *     - WebKit Presentation Mode PiP (Safari iOS / macOS)
 *     - Document Picture-in-Picture (Desktop Chrome/Edge khi dùng iframe fallback).
 *  4. Tích hợp đầy đủ MediaSession API (Metadata, Action Handlers, setPositionState).
 * ============================================================================
 */
(function initNoirStudioNativePlayer(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});
  const CORE_PLAYER_ID = 'core-media-player';
  const SILENT_GESTURE_WAV_URI =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

  const YT_STATES = Object.freeze({
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5
  });

  function clampNum(val, min, max, fallback) {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  class UnifiedNativeMediaPlayer {
    constructor() {
      this.videoEl = null;
      this.companionAudioEl = null;
      this.companionAudioActive = false;
      this.stageHostEl = null;
      this.active = false;
      this.mode = 'idle'; // idle | video | audio-only
      this.isInSystemPiP = false;
      this.docPipWindow = null;
      this._docPipPlaceholder = null;
      this._docPipStageParent = null;

      this.currentStreamInfo = null; // { videoId, title, videoStreamUrl, muxedVideoUrl, adaptiveVideoUrl, audioStreamUrl, requiresPairedAudio, hlsUrl, isLive, thumbnailUrl, sourceHost }
      this.playbackStateCode = YT_STATES.UNSTARTED;
      this.lastKnownTime = 0;
      this.lastKnownDuration = 0;
      this.pendingSeekTime = null;
      this.pendingBgSeekTime = null;
      this._bgAudioHandoffActive = false;
      this._provisionalStageTakeover = false;
      this._prewarmedAudioReadyUrl = '';
      this._failedMediaUrls = new Set();
      this._ignorePauseEvent = false;
      this._lastMediaPosSyncMs = 0;
      this._gestureUnlockBound = false;
      this._gestureUnlocked = false;
      this._prefs = { speed: 1, volume: 85, muted: false };

      this.listeners = {
        stateChange: [],
        timeUpdate: [],
        durationChange: [],
        ended: [],
        error: [],
        bgAudioError: [],
        modeChange: [],
        pipChange: []
      };
    }

    on(eventName, handler) {
      if (this.listeners[eventName] && typeof handler === 'function') {
        this.listeners[eventName].push(handler);
      }
    }

    emit(eventName, payload) {
      const list = this.listeners[eventName] || [];
      for (let i = 0; i < list.length; i++) {
        try {
          list[i](payload);
        } catch (_err) {}
      }
    }

    ensureVideoElement() {
      if (typeof document === 'undefined' || !document.body) return null;
      if (this.videoEl && document.contains(this.videoEl)) return this.videoEl;

      let el = document.getElementById(CORE_PLAYER_ID);
      if (!el || String(el.tagName || '').toUpperCase() !== 'VIDEO') {
        if (el) el.remove();
        el = document.createElement('video');
        el.id = CORE_PLAYER_ID;
        el.setAttribute('data-ns-id', 'ns-native-yt-video');
        el.setAttribute('data-unified-player-id', 'ns-yt-unified-player');
        el.setAttribute('playsinline', '');
        el.setAttribute('webkit-playsinline', '');
        el.removeAttribute('autopictureinpicture');
        el.removeAttribute('crossorigin');
        el.removeAttribute('controls');
        el.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
        el.setAttribute('x-webkit-airplay', 'allow');
        el.playsInline = true;
        el.disablePictureInPicture = true;
        el.disableRemotePlayback = true;
        if ('autoPictureInPicture' in el) el.autoPictureInPicture = false;
        el.preload = 'metadata';
        el.controls = false;
        this._applyAudioOnlySafeStyles(el);
        document.body.appendChild(el);
      } else {
        el.setAttribute('data-ns-id', 'ns-native-yt-video');
        el.setAttribute('data-unified-player-id', 'ns-yt-unified-player');
        el.setAttribute('playsinline', '');
        el.setAttribute('webkit-playsinline', '');
        el.removeAttribute('autopictureinpicture');
        el.removeAttribute('crossorigin');
        el.removeAttribute('controls');
        el.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
        el.playsInline = true;
        el.disablePictureInPicture = true;
        el.disableRemotePlayback = true;
        el.controls = false;
        if ('autoPictureInPicture' in el) el.autoPictureInPicture = false;
      }

      if (el.dataset.noirNativeBound !== '1') {
        el.dataset.noirNativeBound = '1';
        this._bindVideoElementEvents(el);
      }
      this.videoEl = el;
      return el;
    }

    setAudioSessionPlayback() {
      try {
        if (typeof global.navigator !== 'undefined' && global.navigator.audioSession) {
          if (global.navigator.audioSession.type !== 'playback') {
            global.navigator.audioSession.type = 'playback';
          }
        }
      } catch (_e) {}
    }

    installGlobalPlaybackUnlock() {
      if (this._gestureUnlockBound || typeof document === 'undefined') return;
      this._gestureUnlockBound = true;
      const onFirstGesture = () => {
        this.setAudioSessionPlayback();
        this.unlockPlaybackGesture();
        NS.audioBackgroundBridge?.unlockOnGesture?.();
      };
      ['pointerdown', 'touchstart', 'click', 'keydown'].forEach((evt) => {
        document.addEventListener(evt, onFirstGesture, { passive: true, capture: true, once: true });
      });
    }

    _canPlayNativeHls(el) {
      if (!el || typeof el.canPlayType !== 'function') return false;
      try {
        return Boolean(
          el.canPlayType('application/vnd.apple.mpegurl') ||
          el.canPlayType('application/x-mpegURL')
        );
      } catch (_e) {
        return false;
      }
    }

    _markMediaUrlFailed(url) {
      const clean = String(url || '').trim();
      if (!clean || /^data:|^blob:/i.test(clean)) return;
      this._failedMediaUrls.add(clean);
    }

    _isHlsUrl(url) {
      return /\.m3u8(?:$|\?)/i.test(String(url || '').trim());
    }

    _canPlayWebm(el) {
      if (!el || typeof el.canPlayType !== 'function') return true;
      try {
        return Boolean(el.canPlayType('video/webm'));
      } catch (_e) {
        return true;
      }
    }

    _isUrlPlayableOnVideo(url, el) {
      const clean = String(url || '').trim();
      if (!clean) return false;
      if (this._isHlsUrl(clean) && !this._canPlayNativeHls(el)) return false;
      if (/\.webm(?:$|\?)|mime=video%2Fwebm/i.test(clean) && !this._canPlayWebm(el)) return false;
      return true;
    }

    _pickAudioCandidates(streamInfo) {
      if (!streamInfo) return [];
      const canHls = this._canPlayNativeHls(this.videoEl || this.companionAudioEl);
      const raw = [
        streamInfo.audioStreamUrl,
        streamInfo.muxedVideoUrl,
        !streamInfo.requiresPairedAudio ? streamInfo.videoStreamUrl : '',
        streamInfo.proxyVideoStreamUrl,
        streamInfo.directVideoStreamUrl
      ];
      const uniq = [];
      for (let i = 0; i < raw.length; i++) {
        const u = String(raw[i] || '').trim();
        if (u && (canHls || !this._isHlsUrl(u)) && uniq.indexOf(u) === -1) uniq.push(u);
      }
      const healthy = uniq.filter((u) => !this._failedMediaUrls.has(u));
      return healthy.length ? healthy : uniq;
    }

    _pickPlayableTarget(streamInfo, audioOnly, el) {
      if (!streamInfo) return { url: '', needsCompanionAudio: false };
      const canHls = this._canPlayNativeHls(el);
      const safeHls = canHls && streamInfo.hlsUrl ? streamInfo.hlsUrl : '';
      const pickHealthy = (list) => {
        const clean = list
          .map((u) => String(u || '').trim())
          .filter((u) => u && (canHls || !this._isHlsUrl(u)));
        const ok = clean.filter((u) => !this._failedMediaUrls.has(u));
        return ok[0] || clean[0] || '';
      };
      if (audioOnly) {
        return {
          url: pickHealthy([
            streamInfo.audioStreamUrl,
            streamInfo.muxedVideoUrl,
            !streamInfo.requiresPairedAudio ? streamInfo.videoStreamUrl : '',
            safeHls
          ]),
          needsCompanionAudio: false
        };
      }
      const muxed = pickHealthy([
        streamInfo.muxedVideoUrl,
        ...(Array.isArray(streamInfo.alternateMuxedUrls) ? streamInfo.alternateMuxedUrls : []),
        !streamInfo.requiresPairedAudio ? streamInfo.videoStreamUrl : '',
        !streamInfo.requiresPairedAudio ? streamInfo.proxyVideoStreamUrl : '',
        !streamInfo.requiresPairedAudio ? streamInfo.directVideoStreamUrl : ''
      ]);
      if (muxed && !this._failedMediaUrls.has(muxed)) {
        return { url: muxed, needsCompanionAudio: false };
      }
      if (streamInfo.isLive && safeHls) {
        return { url: safeHls, needsCompanionAudio: false };
      }
      if (safeHls) {
        return { url: safeHls, needsCompanionAudio: false };
      }
      const adaptVid = pickHealthy([
        streamInfo.adaptiveVideoUrl,
        ...(Array.isArray(streamInfo.alternateAdaptiveVideoUrls) ? streamInfo.alternateAdaptiveVideoUrls : []),
        streamInfo.videoStreamUrl,
        streamInfo.proxyVideoStreamUrl,
        streamInfo.directVideoStreamUrl
      ]);
      if (adaptVid) {
        const hasAudioPair = Boolean(streamInfo.audioStreamUrl && streamInfo.audioStreamUrl !== adaptVid);
        return {
          url: adaptVid,
          needsCompanionAudio: !this.visualMutedCompanion && Boolean(hasAudioPair && (streamInfo.requiresPairedAudio || adaptVid === streamInfo.adaptiveVideoUrl))
        };
      }
      return { url: muxed || pickHealthy([streamInfo.audioStreamUrl]), needsCompanionAudio: false };
    }

    _ensureCompanionAudioElement() {
      if (typeof document === 'undefined' || !document.body) return null;
      if (this.companionAudioEl && document.contains(this.companionAudioEl)) return this.companionAudioEl;
      let aEl = document.getElementById('core-media-audio-companion');
      if (!aEl) {
        aEl = document.createElement('audio');
        aEl.id = 'core-media-audio-companion';
        aEl.setAttribute('aria-hidden', 'true');
        aEl.setAttribute('playsinline', '');
        aEl.setAttribute('webkit-playsinline', '');
        aEl.playsInline = true;
        aEl.preload = 'auto';
        aEl.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:-8px;left:-8px;';
        document.body.appendChild(aEl);
      }
      if (!aEl.dataset.coreSyncBound) {
        aEl.dataset.coreSyncBound = '1';
        const resumeIfVideoPlaying = () => {
          if (!this.active || !this.companionAudioActive) return;
          if (this._bgAudioHandoffActive) {
            if (!this._userExplicitlyPaused && aEl.paused && !aEl.ended && aEl.src && aEl.src !== SILENT_GESTURE_WAV_URI) {
              this._syncCompanionPrefs();
              if (typeof this.pendingBgSeekTime === 'number' && this.pendingBgSeekTime > 0) {
                try { aEl.currentTime = this.pendingBgSeekTime; } catch (_eS) {}
                this.pendingBgSeekTime = null;
              }
              aEl.play().catch(() => {});
            }
            return;
          }
          if (!this.videoEl) return;
          if (!this.videoEl.paused && aEl.paused && aEl.src && aEl.src !== SILENT_GESTURE_WAV_URI) {
            this._syncCompanionPrefs();
            try {
              if (Math.abs((aEl.currentTime || 0) - (this.videoEl.currentTime || 0)) > 0.35) {
                aEl.currentTime = this.videoEl.currentTime || 0;
              }
              aEl.play().catch(() => {});
            } catch (_eSync) {}
          }
        };
        const onAudioReady = () => {
          const readyUrl = String(aEl.currentSrc || aEl.src || '').trim();
          if (readyUrl && readyUrl !== SILENT_GESTURE_WAV_URI) {
            this._prewarmedAudioReadyUrl = readyUrl;
          }
          resumeIfVideoPlaying();
        };
        aEl.addEventListener('canplay', onAudioReady);
        aEl.addEventListener('loadeddata', onAudioReady);
        aEl.addEventListener('error', () => {
          const badUrl = String(aEl.currentSrc || aEl.src || '').trim();
          if (!badUrl || badUrl === SILENT_GESTURE_WAV_URI) return;
          this._markMediaUrlFailed(badUrl);
          if (this._prewarmedAudioReadyUrl === badUrl) this._prewarmedAudioReadyUrl = '';
          if (this._bgAudioHandoffActive && this.active && this.currentStreamInfo) {
            const cands = this._pickAudioCandidates(this.currentStreamInfo).filter((u) => !this._failedMediaUrls.has(u));
            const nextUrl = cands[0] || '';
            if (nextUrl && nextUrl !== badUrl) {
              this.pendingBgSeekTime = this.lastKnownTime > 0 ? this.lastKnownTime : null;
              aEl.src = nextUrl;
              try { aEl.load(); } catch (_eL) {}
              if (!this._userExplicitlyPaused) {
                aEl.play().catch(() => {});
              }
              return;
            }
            this._bgAudioHandoffActive = false;
            this.emit('bgAudioError', { src: badUrl, videoId: this.currentStreamInfo?.videoId || '' });
          }
        });
        aEl.addEventListener('loadedmetadata', () => {
          if (this._bgAudioHandoffActive && typeof this.pendingBgSeekTime === 'number' && this.pendingBgSeekTime > 0) {
            const rawTarget = this.pendingBgSeekTime;
            this.pendingBgSeekTime = null;
            const dur = Number(aEl.duration);
            const target =
              Number.isFinite(dur) && dur > 0.3 && rawTarget >= dur - 0.2
                ? Math.max(0, dur - 0.25)
                : rawTarget;
            try {
              if (target > 0) {
                aEl.currentTime = target;
                this.lastKnownTime = target;
              }
            } catch (_eMetaSeek) {}
          }
        });
        aEl.addEventListener('timeupdate', () => {
          if (!this.active || !this._bgAudioHandoffActive) return;
          const cur = Number(aEl.currentTime);
          const dur = Number(aEl.duration);
          if (Number.isFinite(cur) && cur >= 0) this.lastKnownTime = cur;
          if (Number.isFinite(dur) && dur > 0) this.lastKnownDuration = dur;
          this.playbackStateCode = aEl.paused ? YT_STATES.PAUSED : YT_STATES.PLAYING;
          this.emit('timeUpdate', {
            currentTime: this.lastKnownTime,
            duration: this.lastKnownDuration,
            state: this.playbackStateCode,
            isLive: Boolean(this.currentStreamInfo?.isLive)
          });
          const now = Date.now();
          if (now - (this._lastMediaPosSyncMs || 0) >= 950) {
            this._lastMediaPosSyncMs = now;
            this.syncMediaSession(aEl.paused ? 'paused' : 'playing', { positionOnly: true });
          }
        });
        aEl.addEventListener('pause', () => {
          if (!this.active || !this._bgAudioHandoffActive) return;
          const recentlyHidden = Date.now() - (this._lastVisibilityChangeMs || 0) < 1200;
          if (!this._userExplicitlyPaused && !aEl.ended && typeof document !== 'undefined' && (document.hidden || recentlyHidden)) {
            aEl.play().catch(() => {});
            this.syncMediaSession('playing', { forcePosition: true });
            return;
          }
          this.playbackStateCode = YT_STATES.PAUSED;
          this.syncMediaSession('paused', { forcePosition: true });
          this.emit('stateChange', YT_STATES.PAUSED);
        });
        aEl.addEventListener('ended', () => {
          if (!this.active || !this._bgAudioHandoffActive) return;
          this.playbackStateCode = YT_STATES.ENDED;
          this.syncMediaSession('paused', { forcePosition: true });
          this.emit('stateChange', YT_STATES.ENDED);
          this.emit('ended', { currentTime: this.lastKnownTime, duration: this.lastKnownDuration });
        });
      }
      this.companionAudioEl = aEl;
      return aEl;
    }

    _teardownCompanionAudio() {
      this.companionAudioActive = false;
      const aEl = this.companionAudioEl;
      if (!aEl) return;
      try {
        aEl.pause();
        aEl.removeAttribute('src');
        aEl.load();
      } catch (_e) {}
    }

    _syncCompanionPrefs() {
      const aEl = this.companionAudioEl;
      if (!aEl || !this.companionAudioActive) return;
      aEl.playbackRate = this._prefs.speed;
      aEl.muted = this._prefs.muted;
      aEl.volume = clampNum(this._prefs.volume / 100, 0, 1, 0.85);
    }

    /**
     * Khởi động quyền phát trên cả thẻ <video> và <audio> đồng hành ngay trong user-gesture
     * để luồng tải bất đồng bộ sau đó (kể cả PiP & âm thanh nền) không bị iOS/Android chặn tiếng.
     */
    unlockPlaybackGesture() {
      this.setAudioSessionPlayback();
      NS.audioBackgroundBridge?.unlockOnGesture?.();
      const el = this.ensureVideoElement();
      const aEl = this._ensureCompanionAudioElement();
      if (!el) return false;
      try {
        el.muted = Boolean(this._prefs?.muted);
        el.volume = clampNum((this._prefs?.volume ?? 85) / 100, 0.05, 1, 1.0);
        el.removeAttribute('autopictureinpicture');
        el.disablePictureInPicture = true;
        if ('autoPictureInPicture' in el) el.autoPictureInPicture = false;
      } catch (_vErr) {}
      if (this.active) return true;
      if (typeof global.navigator !== 'undefined' && global.navigator.webdriver) return false;
      try {
        this._gestureUnlocked = true;
        if (!el.src || el.src === SILENT_GESTURE_WAV_URI) {
          el.src = SILENT_GESTURE_WAV_URI;
          const p = el.play();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              if (!this.active && el.src === SILENT_GESTURE_WAV_URI) {
                el.pause();
              }
            }).catch(() => {});
          }
        }
        if (aEl && (!aEl.src || aEl.src === SILENT_GESTURE_WAV_URI)) {
          aEl.src = SILENT_GESTURE_WAV_URI;
          const ap = aEl.play();
          if (ap && typeof ap.then === 'function') {
            ap.then(() => {
              if (!this.companionAudioActive && aEl.src === SILENT_GESTURE_WAV_URI) {
                aEl.pause();
              }
            }).catch(() => {});
          }
        }
        return true;
      } catch (_err) {
        return false;
      }
    }

    _applyAudioOnlySafeStyles(el) {
      if (!el) return;
      el.setAttribute('aria-hidden', 'true');
      el.controls = false;
      el.removeAttribute('autopictureinpicture');
      el.disablePictureInPicture = true;
      if ('autoPictureInPicture' in el) el.autoPictureInPicture = false;
      el.className = '';
      // Quan trọng: không dùng display:none / visibility:hidden để giữ tiến trình audio nền trên iOS & Android
      el.style.cssText =
        'position:fixed;width:2px;height:2px;opacity:0.001;pointer-events:none;bottom:0;left:0;z-index:-1;display:block;';
    }

    _applyVisibleStageStyles(el) {
      if (!el) return;
      el.removeAttribute('aria-hidden');
      el.removeAttribute('crossorigin');
      el.removeAttribute('controls');
      el.controls = false;
      el.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
      el.disableRemotePlayback = true;
      if (this.visualMutedCompanion) {
        el.muted = true;
        el.defaultMuted = true;
        el.volume = 0;
      }
      el.removeAttribute('autopictureinpicture');
      el.disablePictureInPicture = true;
      if ('autoPictureInPicture' in el) el.autoPictureInPicture = false;
      const inMini = Boolean(this.stageHostEl && this.stageHostEl.id === 'mod39-mini-video-host');
      el.style.cssText = inMini
        ? 'width:100%;height:100%;aspect-ratio:16/9;object-fit:contain;background:#000;display:block !important;cursor:pointer;'
        : 'width:100%;height:100%;min-height:220px;aspect-ratio:16/9;object-fit:contain;background:#000;display:block !important;cursor:pointer;';
    }

    _bindVideoElementEvents(el) {
      el.addEventListener('loadedmetadata', () => {
        if (!this.active) return;
        const dur = Number(el.duration);
        if (Number.isFinite(dur) && dur > 0) {
          this.lastKnownDuration = dur;
          this.emit('durationChange', dur);
        }
        if (typeof this.pendingSeekTime === 'number' && this.pendingSeekTime > 0) {
          const target = this.pendingSeekTime;
          this.pendingSeekTime = null;
          try {
            el.currentTime = target;
            this.lastKnownTime = target;
          } catch (_e) {}
        }
        this.applyPrefs(this._prefs);
        this.syncMediaSession(el.paused ? 'paused' : 'playing', { forcePosition: true });
      });

      el.addEventListener('durationchange', () => {
        if (!this.active) return;
        const dur = Number(el.duration);
        if (Number.isFinite(dur) && dur > 0) {
          this.lastKnownDuration = dur;
          this.emit('durationChange', dur);
        }
      });

      el.addEventListener('play', () => {
        if (!this.active) return;
        this._lastActivePlayingAtMs = Date.now();
        this.setAudioSessionPlayback();
        this.playbackStateCode = YT_STATES.PLAYING;
        NS.audioBackgroundBridge?.activateKeepAlive?.('youtube');
        if (this.companionAudioActive && this.companionAudioEl) {
          this._syncCompanionPrefs();
          try {
            if (Math.abs((this.companionAudioEl.currentTime || 0) - (el.currentTime || 0)) > 0.28) {
              this.companionAudioEl.currentTime = el.currentTime || 0;
            }
            if (this.companionAudioEl.paused) {
              this.companionAudioEl.play().catch(() => {});
            }
          } catch (_ce) {}
        }
        this.syncMediaSession('playing', { forcePosition: true });
        this.emit('stateChange', YT_STATES.PLAYING);
      });

      el.addEventListener('playing', () => {
        if (!this.active) return;
        this._userExplicitlyPaused = false;
        this._lastActivePlayingAtMs = Date.now();
        this.playbackStateCode = YT_STATES.PLAYING;
        if (this.companionAudioActive && this.companionAudioEl) {
          this._syncCompanionPrefs();
          if (this._companionPausedForVideoWait || Math.abs((this.companionAudioEl.currentTime || 0) - (el.currentTime || 0)) > 0.25) {
            this._companionPausedForVideoWait = false;
            this._lastCompanionHardSeekMs = Date.now();
            try { this.companionAudioEl.currentTime = el.currentTime || 0; } catch (_ce) {}
          }
          if (this.companionAudioEl.paused) {
            this.companionAudioEl.play().catch(() => {});
          }
        }
        this.emit('stateChange', YT_STATES.PLAYING);
      });

      el.addEventListener('waiting', () => {
        if (!this.active) return;
        this.playbackStateCode = YT_STATES.BUFFERING;
        // Tạm giữ âm thanh đồng hành khi khung hình đang nạp keyframe (tránh tiếng chạy trước hình trên video dài)
        if (this.companionAudioActive && this.companionAudioEl && !this.companionAudioEl.paused && !this._bgAudioHandoffActive) {
          this._companionPausedForVideoWait = true;
          try { this.companionAudioEl.pause(); } catch (_ceWait) {}
        }
        this.emit('stateChange', YT_STATES.BUFFERING);
      });

      if (typeof document !== 'undefined' && !this._bgVisibilityListenerBound) {
        this._bgVisibilityListenerBound = true;
        const markVisTransition = () => {
          this._lastVisibilityChangeMs = Date.now();
          if (this.visualMutedCompanion) {
            if (document.hidden && el && !el.paused && !document.pictureInPictureElement) {
              this._ignorePauseEvent = true;
              try { el.pause(); } catch (_eVp) {}
              Promise.resolve().then(() => { this._ignorePauseEvent = false; });
            }
            return;
          }
          if (document.hidden && this.active && !this._provisionalStageTakeover && !this._userExplicitlyPaused && el && !el.ended) {
            this.enterBackgroundAudioHandoff();
          } else if (!document.hidden && this.active && !this._provisionalStageTakeover && this._bgAudioHandoffActive) {
            this.restoreForegroundVideoFromBgAudio();
          }
        };
        document.addEventListener('visibilitychange', markVisTransition, { passive: true });
        if (typeof window !== 'undefined') {
          window.addEventListener('pagehide', () => {
            if (this.visualMutedCompanion) return;
            if (this.active && !this._provisionalStageTakeover && !this._userExplicitlyPaused && el && !el.ended) {
              this.enterBackgroundAudioHandoff();
            }
          }, { passive: true });
        }
      }

      el.addEventListener('volumechange', () => {
        if (this.visualMutedCompanion && (!el.muted || el.volume !== 0)) {
          el.muted = true;
          el.defaultMuted = true;
          el.volume = 0;
        }
      });

      el.addEventListener('seeked', () => {
        if (!this.active) return;
        const curT = Number(el.currentTime) || 0;
        if (this.companionAudioActive && this.companionAudioEl && !this._bgAudioHandoffActive) {
          this._lastCompanionHardSeekMs = Date.now();
          this._companionPausedForVideoWait = false;
          try {
            if (Math.abs((this.companionAudioEl.currentTime || 0) - curT) > 0.12) {
              this.companionAudioEl.currentTime = curT;
            }
            this._syncCompanionPrefs();
            if (!el.paused && this.companionAudioEl.paused) {
              this.companionAudioEl.play().catch(() => {});
            }
          } catch (_ceSeeked) {}
        }
        this.emit('seeked', { currentTime: curT, paused: Boolean(el.paused) });
      });

      el.addEventListener('pause', () => {
        if (!this.active || this._provisionalStageTakeover || this._ignorePauseEvent || this._bgAudioHandoffActive) return;
        const recentlyTransitionedBg =
          Date.now() - (this._lastVisibilityChangeMs || 0) < 1200;
        if (this.visualMutedCompanion) {
          this.playbackStateCode = YT_STATES.PAUSED;
          if (typeof document !== 'undefined' && (document.hidden || recentlyTransitionedBg)) {
            return;
          }
          this.emit('stateChange', YT_STATES.PAUSED);
          return;
        }
        // Nếu vừa chuyển sang nền ẩn mà chưa kịp handoff, tự động giữ phát nền qua <audio>
        if (
          !this._userExplicitlyPaused &&
          !el.ended &&
          typeof document !== 'undefined' &&
          (document.hidden || recentlyTransitionedBg)
        ) {
          this.enterBackgroundAudioHandoff();
          return;
        }
        this.playbackStateCode = YT_STATES.PAUSED;
        if (this.companionAudioActive && this.companionAudioEl && !this.companionAudioEl.paused) {
          try { this.companionAudioEl.pause(); } catch (_ce) {}
        }
        this.syncMediaSession('paused', { forcePosition: true });
        this.emit('stateChange', YT_STATES.PAUSED);
      });

      el.addEventListener('timeupdate', () => {
        if (!this.active || this._bgAudioHandoffActive) return;
        if (!el.paused) {
          this._lastActivePlayingAtMs = Date.now();
        }
        const cur = Number(el.currentTime);
        const dur = Number(el.duration);
        if (Number.isFinite(cur) && cur >= 0) this.lastKnownTime = cur;
        if (Number.isFinite(dur) && dur > 0) this.lastKnownDuration = dur;

        if (this.companionAudioActive && this.companionAudioEl && !el.paused && !el.seeking) {
          const baseSpd = Number(this._prefs?.speed) || 1;
          const aCur = Number(this.companionAudioEl.currentTime) || 0;
          const drift = (cur || 0) - aCur;
          const absDrift = Math.abs(drift);
          const nowSync = Date.now();
          const sinceSeek = nowSync - (this._lastCompanionHardSeekMs || 0);
          if (absDrift > 1.4 && sinceSeek >= 1200) {
            this._lastCompanionHardSeekMs = nowSync;
            try {
              this.companionAudioEl.playbackRate = baseSpd;
              this.companionAudioEl.currentTime = cur || 0;
            } catch (_ce) {}
          } else if (absDrift > 0.14 && absDrift <= 1.4 && sinceSeek >= 500) {
            const nudge = drift > 0 ? Math.min(1.08, 1 + absDrift * 0.08) : Math.max(0.92, 1 - absDrift * 0.08);
            const nextRate = Number((baseSpd * nudge).toFixed(3));
            if (Math.abs((this.companionAudioEl.playbackRate || 1) - nextRate) > 0.01) {
              try { this.companionAudioEl.playbackRate = nextRate; } catch (_ceR) {}
            }
          } else if (Math.abs((this.companionAudioEl.playbackRate || 1) - baseSpd) > 0.01) {
            try { this.companionAudioEl.playbackRate = baseSpd; } catch (_ceR2) {}
          }
          if (this.companionAudioEl.paused && el.readyState >= 3 && !this._companionPausedForVideoWait) {
            this.companionAudioEl.play().catch(() => {});
          }
        }

        this.emit('timeUpdate', {
          currentTime: this.lastKnownTime,
          duration: this.lastKnownDuration,
          state: this.playbackStateCode,
          isLive: Boolean(this.currentStreamInfo?.isLive)
        });

        const now = Date.now();
        if (now - this._lastMediaPosSyncMs >= 950) {
          this._lastMediaPosSyncMs = now;
          this.syncMediaSession(el.paused ? 'paused' : 'playing', { positionOnly: true });
        }
      });

      el.addEventListener('ratechange', () => {
        if (!this.active) return;
        this.emit('playbackRateChange', Number(el.playbackRate) || 1);
        this.syncMediaSession(el.paused ? 'paused' : 'playing', { forcePosition: true });
      });

      el.addEventListener('ended', () => {
        if (!this.active) return;
        this.playbackStateCode = YT_STATES.ENDED;
        this.syncMediaSession('paused', { forcePosition: true });
        this.emit('stateChange', YT_STATES.ENDED);
        this.emit('ended', { currentTime: this.lastKnownTime, duration: this.lastKnownDuration });
      });

      const handleReturnFromSystemPiP = (kind) => {
        this.handleReturnFromSystemPiP = handleReturnFromSystemPiP;
        this.isInSystemPiP = false;
        this._syncPipStageOverlay(false);
        const shouldRestorePlaying = Boolean(!this._userExplicitlyPaused);
        if (this.active || this.mode === 'audio-only' || this.currentStreamInfo) {
          this.active = true;
          this.mode = 'video';
          if (typeof document !== 'undefined') {
            const hostEl = this.stageHostEl || document.getElementById('mod39-native-video-host');
            if (hostEl) {
              this.stageHostEl = hostEl;
              hostEl.classList.remove('hidden');
            }
            document.getElementById('mod39-empty-stage-card')?.classList.add('hidden');
          }
          this.setModeLayout('video');
          this.applyPrefs(this._prefs);
          if (this.companionAudioActive && this.companionAudioEl && this.currentStreamInfo?.audioStreamUrl) {
            try {
              if (!this.companionAudioEl.src || this.companionAudioEl.src === SILENT_GESTURE_WAV_URI) {
                this.companionAudioEl.src = this.currentStreamInfo.audioStreamUrl;
              }
              if (Number.isFinite(el.currentTime)) {
                this.companionAudioEl.currentTime = el.currentTime;
              }
            } catch (_eA) {}
          }
          this.emit('modeChange', {
            active: true,
            mode: 'video',
            streamInfo: this.currentStreamInfo
          });
          if (shouldRestorePlaying) {
            if (el.paused) {
              this.play().catch(() => {});
            }
            setTimeout(() => {
              if (this.active && !this._userExplicitlyPaused && el.paused && !el.ended) {
                this.play().catch(() => {});
              }
            }, 80);
          } else if (!el.paused && this.companionAudioActive && this.companionAudioEl?.paused) {
            this.companionAudioEl.play().catch(() => {});
          }
        }
        this.emit('pipChange', { active: false, kind });
      };
      this.handleReturnFromSystemPiP = handleReturnFromSystemPiP;

      el.addEventListener('enterpictureinpicture', () => {
        this.isInSystemPiP = true;
        this._lastActivePlayingAtMs = Date.now();
        this._syncPipStageOverlay(true);
        this.emit('pipChange', { active: true, kind: 'video-pip' });
      });

      el.addEventListener('leavepictureinpicture', () => {
        handleReturnFromSystemPiP('video-pip');
      });

      el.addEventListener('webkitpresentationmodechanged', () => {
        const mode = typeof el.webkitPresentationMode === 'string' ? el.webkitPresentationMode : '';
        const active = mode === 'picture-in-picture';
        if (this.isInSystemPiP !== active) {
          if (active) {
            this.isInSystemPiP = true;
            this._lastActivePlayingAtMs = Date.now();
            this._syncPipStageOverlay(true);
            this.emit('pipChange', { active: true, kind: 'webkit-pip' });
          } else {
            handleReturnFromSystemPiP('webkit-pip');
          }
        }
      });

      el.addEventListener('error', () => {
        if (!this.active) return;
        const currentUrl = String(el.currentSrc || el.src || '');
        this._markMediaUrlFailed(currentUrl);
        const info = this.currentStreamInfo || {};
        const altPool = [
          info.muxedVideoUrl || '',
          ...(Array.isArray(info.alternateMuxedUrls) ? info.alternateMuxedUrls : []),
          info.adaptiveVideoUrl || '',
          ...(Array.isArray(info.alternateAdaptiveVideoUrls) ? info.alternateAdaptiveVideoUrls : []),
          info.videoStreamUrl || '',
          info.directVideoStreamUrl || '',
          info.proxyVideoStreamUrl || ''
        ].filter((u, idx, arr) =>
          u &&
          u !== currentUrl &&
          arr.indexOf(u) === idx &&
          !this._failedMediaUrls.has(u) &&
          this._isUrlPlayableOnVideo(u, el)
        );
        const altCandidate = altPool[0] || '';
        const retriesSoFar = Number(this._retryCountForCurrentLoad) || 0;
        if (altCandidate && retriesSoFar < 6 && !this._provisionalStageTakeover) {
          this._retryCountForCurrentLoad = retriesSoFar + 1;
          this._retriedAlternateMuxedUrl = true;
          this.pendingSeekTime = this.lastKnownTime > 0 ? this.lastKnownTime : null;
          el.removeAttribute('crossorigin');
          el.src = altCandidate;
          try { el.load(); } catch (_eL) {}
          if (!this._userExplicitlyPaused) {
            el.play().catch(() => {});
          }
          return;
        }
        const mediaErr = el.error;
        const code = mediaErr ? mediaErr.code : 0;
        this.emit('error', {
          code,
          videoId: this.currentStreamInfo?.videoId || '',
          currentTime: this.lastKnownTime,
          src: currentUrl
        });
      });
    }

    _syncPipStageOverlay(active) {
      if (typeof document === 'undefined') return;
      const host = document.getElementById('mod39-native-video-host');
      if (!host) return;
      let badge = document.getElementById('mod39-pip-active-overlay');
      if (!active) {
        if (badge) badge.classList.add('hidden');
        if (this.videoEl && this.mode === 'video') {
          this._applyVisibleStageStyles(this.videoEl);
        }
        return;
      }
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'mod39-pip-active-overlay';
        badge.className =
          'pointer-events-none absolute inset-x-3 bottom-3 z-20 px-3 py-1.5 rounded-xl border border-emerald-400/50 bg-zinc-950/85 text-emerald-200 text-[11px] font-bold text-center shadow-lg';
        const tr = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(s) : s);
        badge.textContent = tr('🖼️ Đang phát trong cửa sổ nổi (PiP) — đóng cửa sổ nổi để xem tiếp tại đây');
        host.appendChild(badge);
      } else {
        badge.classList.remove('hidden');
      }
    }

    _reparentVideoSynchronously(targetParent, wasPlaying) {
      const el = this.videoEl;
      if (!el || !targetParent) return;
      if (el.parentElement !== targetParent) {
        this._ignorePauseEvent = true;
        targetParent.appendChild(el);
        this._applyVisibleStageStyles(el);
        if (wasPlaying && el.paused && !el.ended) {
          el.play().catch(() => {});
        }
        Promise.resolve().then(() => {
          this._ignorePauseEvent = false;
          if (wasPlaying && this.videoEl && this.videoEl.paused && !this.videoEl.ended) {
            this.videoEl.play().catch(() => {});
          }
        });
      } else {
        this._applyVisibleStageStyles(el);
      }
    }

    attachStageHost(hostEl) {
      this.stageHostEl = hostEl || null;
      if (this.active && this.mode === 'video' && this.videoEl && this.stageHostEl && !this._provisionalStageTakeover) {
        const wasPlaying = !this.videoEl.paused && !this._userExplicitlyPaused;
        this._reparentVideoSynchronously(this.stageHostEl, wasPlaying);
      }
    }

    setModeLayout(targetMode) {
      const el = this.ensureVideoElement();
      if (!el) return;
      if (targetMode === 'video' && this.stageHostEl && !this._provisionalStageTakeover) {
        const wasPlaying = !el.paused && !this._userExplicitlyPaused;
        this._reparentVideoSynchronously(this.stageHostEl, wasPlaying);
      } else {
        if (typeof document !== 'undefined' && document.body && el.parentElement !== document.body) {
          this._ignorePauseEvent = true;
          document.body.appendChild(el);
          Promise.resolve().then(() => {
            this._ignorePauseEvent = false;
          });
        }
        this._applyAudioOnlySafeStyles(el);
      }
    }

    applyPrefs(prefs = {}) {
      this._prefs = {
        speed: clampNum(prefs.speed, 0.25, 2.5, this._prefs.speed || 1),
        volume: clampNum(prefs.volume, 0, 100, this._prefs.volume ?? 85),
        muted: Boolean(prefs.muted)
      };
      const el = this.videoEl;
      if (!el) return;
      el.playbackRate = this._prefs.speed;
      if (this.visualMutedCompanion) {
        el.muted = true;
        el.defaultMuted = true;
        el.volume = 0;
        return;
      }
      el.muted = this.companionAudioActive ? true : this._prefs.muted;
      el.volume = clampNum(this._prefs.volume / 100, 0, 1, 0.85);
      this._syncCompanionPrefs();
    }

    async loadStream(streamInfo, options = {}) {
      const el = this.ensureVideoElement();
      if (!el || !streamInfo) return false;

      const audioOnly = Boolean(options.audioOnly);
      const targetMode = audioOnly ? 'audio-only' : 'video';
      this.visualMutedCompanion = Boolean(options.visualMutedCompanion);
      if (options.stageHostEl) {
        this.stageHostEl = options.stageHostEl;
      }
      const picked = this._pickPlayableTarget(streamInfo, audioOnly, el);
      const targetUrl = picked.url;

      if (!targetUrl) return false;

      this.setAudioSessionPlayback();
      this._bgAudioHandoffActive = false;
      this._provisionalStageTakeover = Boolean(options.deferStageTakeover);
      this.pendingBgSeekTime = null;
      this.currentStreamInfo = { ...streamInfo };
      this._retriedAlternateMuxedUrl = false;
      this._retryCountForCurrentLoad = 0;
      el.removeAttribute('crossorigin');
      this._userExplicitlyPaused =
        options.userIntentPaused !== undefined
          ? Boolean(options.userIntentPaused)
          : options.autoplay === false;
      this.active = true;
      this.mode = targetMode;
      this.lastKnownTime = Math.max(0, Number(options.startTimeSec) || 0);
      this.lastKnownDuration = Math.max(0, Number(streamInfo.durationSec) || 0);
      this.pendingSeekTime = this.lastKnownTime > 0 ? this.lastKnownTime : null;
      this.playbackStateCode = options.autoplay !== false ? YT_STATES.BUFFERING : YT_STATES.CUED;

      try {
        el.removeAttribute('autopictureinpicture');
        el.disablePictureInPicture = true;
        if ('autoPictureInPicture' in el) el.autoPictureInPicture = false;
      } catch (_pipAttrErr) {}

      if (!this.visualMutedCompanion && picked.needsCompanionAudio && streamInfo.audioStreamUrl) {
        const aEl = this._ensureCompanionAudioElement();
        if (aEl) {
          this.companionAudioActive = true;
          if (aEl.src !== streamInfo.audioStreamUrl) {
            aEl.src = streamInfo.audioStreamUrl;
            try { aEl.load(); } catch (_e) {}
          }
          if (this.lastKnownTime > 0) {
            try { aEl.currentTime = this.lastKnownTime; } catch (_e) {}
          }
        }
      } else {
        this._teardownCompanionAudio();
      }

      this.setModeLayout(targetMode);
      if (options.prefs) {
        this.applyPrefs(options.prefs);
      } else {
        this.applyPrefs(this._prefs);
      }

      if (el.src !== targetUrl) {
        el.src = targetUrl;
        try {
          el.load();
        } catch (_e) {}
      } else if (this.pendingSeekTime !== null) {
        try {
          el.currentTime = this.pendingSeekTime;
          this.pendingSeekTime = null;
        } catch (_e) {}
      }

      this.emit('modeChange', {
        active: true,
        mode: this.mode,
        provisional: this._provisionalStageTakeover,
        streamInfo: this.currentStreamInfo
      });
      if (!this._provisionalStageTakeover) {
        this.syncMediaSession(options.autoplay !== false ? 'playing' : 'paused', { forcePosition: true });
      }

      if (options.autoplay !== false) {
        try {
          await el.play();
          if (this.companionAudioActive && this.companionAudioEl) {
            this.companionAudioEl.play().catch(() => {});
          }
        } catch (_playErr) {
          // Trình duyệt có thể giữ trạng thái sẵn sàng chờ chạm khi chưa có user gesture
          this.playbackStateCode = YT_STATES.PAUSED;
          this.syncMediaSession('paused', { forcePosition: true });
          this.emit('stateChange', YT_STATES.PAUSED);
        }
      }
      return true;
    }

    confirmProvisionalTakeover(prefs = null, targetHostEl = null) {
      if (!this.active || !this.videoEl) return false;
      this._provisionalStageTakeover = false;
      if (targetHostEl) {
        this.stageHostEl = targetHostEl;
      }
      if (prefs) {
        this.applyPrefs(prefs);
      }
      this.setModeLayout(this.mode);
      if (this.mode === 'video' && this.videoEl && !this._userExplicitlyPaused && this.videoEl.paused && !this.videoEl.ended) {
        this.videoEl.play().catch(() => {});
      }
      this.emit('modeChange', {
        active: true,
        mode: this.mode,
        provisional: false,
        streamInfo: this.currentStreamInfo
      });
      this.syncMediaSession(this.videoEl.paused ? 'paused' : 'playing', { forcePosition: true });
      return true;
    }

    async switchMode(audioOnly, options = {}) {
      const el = this.ensureVideoElement();
      if (!el || !this.active || !this.currentStreamInfo) return false;

      const targetMode = audioOnly ? 'audio-only' : 'video';
      const picked = this._pickPlayableTarget(this.currentStreamInfo, audioOnly, el);
      const targetUrl = picked.url;

      if (!targetUrl) return false;

      const savedTime = Number.isFinite(el.currentTime) && el.currentTime > 0
        ? el.currentTime
        : this.lastKnownTime;
      const shouldResume = options.forcePlay === true || (!el.paused && !el.ended);

      this.setAudioSessionPlayback();
      this.mode = targetMode;
      this.setModeLayout(targetMode);

      if (picked.needsCompanionAudio && this.currentStreamInfo.audioStreamUrl) {
        const aEl = this._ensureCompanionAudioElement();
        if (aEl) {
          this.companionAudioActive = true;
          if (aEl.src !== this.currentStreamInfo.audioStreamUrl) {
            aEl.src = this.currentStreamInfo.audioStreamUrl;
            try { aEl.load(); } catch (_e) {}
          }
          if (savedTime > 0) {
            try { aEl.currentTime = savedTime; } catch (_e) {}
          }
        }
      } else {
        this._teardownCompanionAudio();
      }

      if (el.src !== targetUrl) {
        this._ignorePauseEvent = true;
        this.pendingSeekTime = savedTime > 0 ? savedTime : null;
        el.src = targetUrl;
        try {
          el.load();
        } catch (_e) {}
        if (savedTime > 0) {
          try {
            el.currentTime = savedTime;
          } catch (_e) {}
        }
        this._ignorePauseEvent = false;
      }

      this.applyPrefs(this._prefs);
      this.emit('modeChange', {
        active: true,
        mode: this.mode,
        streamInfo: this.currentStreamInfo
      });

      if (shouldResume) {
        try {
          await el.play();
          if (this.companionAudioActive && this.companionAudioEl) {
            this.companionAudioEl.play().catch(() => {});
          }
        } catch (_e) {}
      }
      this.syncMediaSession(shouldResume ? 'playing' : 'paused', { forcePosition: true });
      return true;
    }

    deactivate(keepStreamMetadata = false, options = {}) {
      const preservePiP = Boolean(options && options.preservePiP);
      const docPipStillOpen = Boolean(this.docPipWindow && !this.docPipWindow.closed);
      const sysPipStillOpen = Boolean(
        typeof document !== 'undefined' && this.videoEl && document.pictureInPictureElement === this.videoEl
      );
      if (this.isInSystemPiP && !(preservePiP && (docPipStillOpen || sysPipStillOpen))) {
        this.exitSystemPictureInPicture().catch(() => {});
      }
      this._teardownCompanionAudio();
      const el = this.videoEl;
      if (el) {
        this._ignorePauseEvent = true;
        try {
          el.pause();
          if (!(preservePiP && sysPipStillOpen)) {
            el.removeAttribute('src');
            el.load();
          }
        } catch (_e) {}
        this._ignorePauseEvent = false;
        if (!(preservePiP && sysPipStillOpen)) {
          this._applyAudioOnlySafeStyles(el);
          if (typeof document !== 'undefined' && document.body && el.parentElement !== document.body) {
            document.body.appendChild(el);
          }
        }
      }
      this.active = false;
      this.mode = 'idle';
      this.visualMutedCompanion = false;
      this._bgAudioHandoffActive = false;
      this._provisionalStageTakeover = false;
      this.pendingBgSeekTime = null;
      this.pendingSeekTime = null;
      if (!keepStreamMetadata) {
        this.currentStreamInfo = null;
      }
      this.playbackStateCode = YT_STATES.UNSTARTED;
      this.emit('modeChange', { active: false, mode: 'idle', streamInfo: this.currentStreamInfo });
    }

    prewarmCompanionAudio(streamInfo = null) {
      const info = streamInfo || this.currentStreamInfo;
      const candidates = this._pickAudioCandidates(info);
      const audioUrl = candidates[0] || '';
      if (!audioUrl) return false;
      const aEl = this._ensureCompanionAudioElement();
      if (!aEl) return false;
      if (this._bgAudioHandoffActive && aEl.src && !aEl.paused) {
        return true;
      }
      try {
        if (aEl.src !== audioUrl) {
          this._prewarmedAudioReadyUrl = '';
          aEl.preload = 'auto';
          aEl.src = audioUrl;
          try { aEl.load(); } catch (_eLoad) {}
        }
        return true;
      } catch (_e) {
        return false;
      }
    }

    enterBackgroundAudioHandoff() {
      const el = this.videoEl;
      if (!this.active || this._userExplicitlyPaused || !el || el.ended) return false;
      const candidates = this._pickAudioCandidates(this.currentStreamInfo);
      const audioUrl = candidates[0] || (el.src && !this._failedMediaUrls.has(el.src) ? el.src : '');
      const aEl = this._ensureCompanionAudioElement();
      if (!aEl || !audioUrl) return false;

      const savedTime =
        this._bgAudioHandoffActive && Number.isFinite(aEl.currentTime)
          ? aEl.currentTime
          : Number.isFinite(el.currentTime) && el.currentTime > 0
            ? el.currentTime
            : this.lastKnownTime || 0;

      this.setAudioSessionPlayback();
      NS.audioBackgroundBridge?.activateKeepAlive?.('youtube');
      this._bgAudioHandoffActive = true;
      this.companionAudioActive = true;

      if (!el.paused) {
        this._ignorePauseEvent = true;
        try { el.pause(); } catch (_eP) {}
        this._ignorePauseEvent = false;
      }

      aEl.playbackRate = this._prefs.speed;
      aEl.muted = this._prefs.muted;
      aEl.volume = clampNum(this._prefs.volume / 100, 0, 1, 0.85);

      if (aEl.src !== audioUrl) {
        this.pendingBgSeekTime = savedTime > 0 ? savedTime : null;
        aEl.src = audioUrl;
        try { aEl.load(); } catch (_eL) {}
      } else if (savedTime > 0 && Math.abs((aEl.currentTime || 0) - savedTime) > 0.35) {
        if (aEl.readyState >= 1) {
          try { aEl.currentTime = savedTime; } catch (_eS) {}
        } else {
          this.pendingBgSeekTime = savedTime;
        }
      }

      const playPromise = aEl.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(
          () => {
            if (!this._bgAudioHandoffActive) return;
            this.syncMediaSession('playing', { forcePosition: true });
          },
          () => {
            if (!this._bgAudioHandoffActive) return;
            this._markMediaUrlFailed(audioUrl);
            const fallbackUrl = this._pickAudioCandidates(this.currentStreamInfo).find(
              (u) => u && u !== audioUrl && !this._failedMediaUrls.has(u)
            );
            if (fallbackUrl) {
              this.pendingBgSeekTime = this.lastKnownTime > 0 ? this.lastKnownTime : null;
              aEl.src = fallbackUrl;
              try { aEl.load(); } catch (_eL2) {}
              aEl.play().catch(() => {
                this._bgAudioHandoffActive = false;
                this.emit('bgAudioError', { src: fallbackUrl, videoId: this.currentStreamInfo?.videoId || '' });
              });
            } else {
              this._bgAudioHandoffActive = false;
              this.emit('bgAudioError', { src: audioUrl, videoId: this.currentStreamInfo?.videoId || '' });
            }
          }
        );
      }
      this.syncMediaSession('playing', { forcePosition: true });
      this.emit('modeChange', {
        active: true,
        mode: this.mode,
        backgroundAudioOnly: true,
        streamInfo: this.currentStreamInfo
      });
      return true;
    }

    async verifyAndStartBackgroundAudio(streamInfo, options = {}) {
      if (!streamInfo) return false;
      const aEl = this._ensureCompanionAudioElement();
      if (!aEl) return false;
      const candidates = this._pickAudioCandidates(streamInfo);
      if (!candidates.length) return false;

      const startSec = Math.max(0, Number(options.startTimeSec) || 0);
      const prefs = options.prefs || this._prefs || {};
      this.setAudioSessionPlayback();
      NS.audioBackgroundBridge?.activateKeepAlive?.('youtube');

      for (let i = 0; i < candidates.length; i++) {
        const candidateUrl = candidates[i];
        this.currentStreamInfo = { ...streamInfo };
        this.active = true;
        this.mode = options.keepModeVideo ? 'video' : 'audio-only';
        this._bgAudioHandoffActive = true;
        this.companionAudioActive = true;
        this._userExplicitlyPaused = false;
        this.lastKnownTime = startSec;
        this.lastKnownDuration = Math.max(0, Number(streamInfo.durationSec) || 0);
        this.pendingBgSeekTime = startSec > 0 ? startSec : null;

        aEl.playbackRate = clampNum(prefs.speed, 0.25, 2.5, 1);
        aEl.muted = Boolean(prefs.muted);
        aEl.volume = clampNum((prefs.volume ?? 85) / 100, 0, 1, 0.85);

        if (aEl.src !== candidateUrl) {
          aEl.preload = 'auto';
          aEl.src = candidateUrl;
          try { aEl.load(); } catch (_eL) {}
        } else if (startSec > 0 && aEl.readyState >= 1) {
          const dur = Number(aEl.duration);
          const safeSeek =
            Number.isFinite(dur) && dur > 0.3 && startSec >= dur - 0.2
              ? Math.max(0, dur - 0.25)
              : startSec;
          try {
            if (safeSeek > 0) aEl.currentTime = safeSeek;
            this.pendingBgSeekTime = null;
          } catch (_eSeek) {}
        }

        const playAttempt = await new Promise((resolveStart) => {
          let settled = false;
          const finish = (started, gestureBlocked = false) => {
            if (settled) return;
            settled = true;
            aEl.removeEventListener('error', onErr);
            clearTimeout(timer);
            resolveStart({ started, gestureBlocked });
          };
          const onErr = () => finish(false, false);
          const timer = setTimeout(() => {
            finish(Boolean(!aEl.paused && !aEl.error), false);
          }, 2200);
          aEl.addEventListener('error', onErr, { once: true });
          const p = aEl.play();
          if (p && typeof p.then === 'function') {
            p.then(
              () => finish(Boolean(!aEl.paused && !aEl.error), false),
              (playErr) => finish(false, playErr?.name === 'NotAllowedError')
            );
          } else {
            finish(Boolean(!aEl.paused && !aEl.error), false);
          }
        });

        if (playAttempt.started) {
          this.syncMediaSession('playing', { forcePosition: true });
          this.emit('modeChange', {
            active: true,
            mode: this.mode,
            backgroundAudioOnly: true,
            streamInfo: this.currentStreamInfo
          });
          return true;
        }
        if (playAttempt.gestureBlocked) {
          break;
        }
        this._markMediaUrlFailed(candidateUrl);
      }

      this._bgAudioHandoffActive = false;
      this.companionAudioActive = false;
      return false;
    }

    restoreForegroundVideoFromBgAudio() {
      if (!this._bgAudioHandoffActive) return false;
      const el = this.videoEl;
      const aEl = this.companionAudioEl;
      const resumeTime =
        aEl && Number.isFinite(aEl.currentTime) && aEl.currentTime >= 0
          ? aEl.currentTime
          : this.lastKnownTime || 0;
      const wasPlaying = Boolean(!this._userExplicitlyPaused && (aEl ? !aEl.paused && !aEl.ended : true));
      this._bgAudioHandoffActive = false;
      this.pendingBgSeekTime = null;

      if (!this.active || !el || this.mode === 'audio-only') return false;

      const picked = this.currentStreamInfo
        ? this._pickPlayableTarget(this.currentStreamInfo, false, el)
        : { needsCompanionAudio: false };
      if (!picked.needsCompanionAudio && aEl && aEl !== el) {
        this.companionAudioActive = false;
        try { aEl.pause(); } catch (_ePa) {}
      }

      if (el.readyState >= 1) {
        try {
          if (Math.abs((el.currentTime || 0) - resumeTime) > 0.3) {
            el.currentTime = resumeTime;
          }
          this.lastKnownTime = resumeTime;
        } catch (_eSeek) {}
      } else {
        this.pendingSeekTime = resumeTime > 0 ? resumeTime : null;
      }

      if (this.mode === 'video' && this.stageHostEl) {
        this.setModeLayout('video');
      }
      this.applyPrefs(this._prefs);
      if (wasPlaying && !el.ended) {
        this.play().catch(() => {});
      }
      this.emit('modeChange', {
        active: true,
        mode: this.mode,
        backgroundAudioOnly: false,
        streamInfo: this.currentStreamInfo
      });
      return true;
    }

    play() {
      if (!this.active || !this.videoEl) return Promise.resolve(false);
      this._userExplicitlyPaused = false;
      this.setAudioSessionPlayback();
      if (this._bgAudioHandoffActive && this.companionAudioEl) {
        this._syncCompanionPrefs();
        return this.companionAudioEl.play().then(() => true, () => false);
      }
      return this.videoEl.play().then(
        () => {
          if (this.companionAudioActive && this.companionAudioEl && this.companionAudioEl.paused) {
            this.companionAudioEl.play().catch(() => {});
          }
          return true;
        },
        () => false
      );
    }

    pause() {
      if (!this.active || !this.videoEl) return;
      this._userExplicitlyPaused = true;
      try {
        this.videoEl.pause();
        if (this.companionAudioActive && this.companionAudioEl) {
          this.companionAudioEl.pause();
        }
      } catch (_e) {}
    }

    seekTo(seconds) {
      if (!this.active || !this.videoEl) return;
      const target = Math.max(0, Number(seconds) || 0);
      this.lastKnownTime = target;
      this._lastCompanionHardSeekMs = Date.now();
      try {
        if (this.videoEl.readyState >= 1) {
          this.videoEl.currentTime = target;
        } else {
          this.pendingSeekTime = target;
        }
        if (this.companionAudioActive && this.companionAudioEl) {
          if (this.companionAudioEl.readyState >= 1) {
            this.companionAudioEl.currentTime = target;
          } else if (this._bgAudioHandoffActive) {
            this.pendingBgSeekTime = target;
          }
          if (!this._bgAudioHandoffActive && !this.videoEl.paused && this.videoEl.readyState < 3 && !this.companionAudioEl.paused) {
            this._companionPausedForVideoWait = true;
            this.companionAudioEl.pause();
          }
        }
      } catch (_e) {}
      const pausedNow = this._bgAudioHandoffActive && this.companionAudioEl ? this.companionAudioEl.paused : this.videoEl.paused;
      this.syncMediaSession(pausedNow ? 'paused' : 'playing', { forcePosition: true });
    }

    setPlaybackRate(rate) {
      this.applyPrefs({ ...this._prefs, speed: rate });
    }

    setVolume(volumePct) {
      this.applyPrefs({ ...this._prefs, volume: volumePct });
    }

    setMuted(muted) {
      this.applyPrefs({ ...this._prefs, muted: Boolean(muted) });
    }

    isActive() {
      return Boolean(
        this.active &&
        !this._provisionalStageTakeover &&
        ((this.videoEl && this.videoEl.src) ||
          (this._bgAudioHandoffActive && this.companionAudioEl && this.companionAudioEl.src))
      );
    }

    getSnapshot() {
      const useBgAudio = Boolean(this._bgAudioHandoffActive && this.companionAudioEl && this.companionAudioEl.src);
      const el = useBgAudio ? this.companionAudioEl : this.videoEl;
      const dur =
        el && Number.isFinite(el.duration) && el.duration > 0
          ? el.duration
          : this.lastKnownDuration || 0;
      const cur =
        el && Number.isFinite(el.currentTime) && el.currentTime >= 0
          ? el.currentTime
          : this.lastKnownTime || 0;
      let state = this.playbackStateCode;
      if (el && this.active) {
        if (el.ended) state = YT_STATES.ENDED;
        else if (!el.paused) state = el.readyState >= 3 ? YT_STATES.PLAYING : YT_STATES.BUFFERING;
        else if (state === YT_STATES.PLAYING) state = YT_STATES.PAUSED;
      }
      return {
        currentTime: cur,
        duration: dur,
        state,
        isLive: Boolean(this.currentStreamInfo?.isLive)
      };
    }

    getPiPCapabilities() {
      const hasDoc = typeof document !== 'undefined';
      const standardVideoPiP = Boolean(
        hasDoc &&
        document.pictureInPictureEnabled &&
        typeof HTMLVideoElement !== 'undefined' &&
        typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function'
      );
      const webkitVideoPiP = Boolean(
        typeof HTMLVideoElement !== 'undefined' &&
        typeof HTMLVideoElement.prototype.webkitSetPresentationMode === 'function'
      );
      return {
        standardVideoPiP,
        webkitVideoPiP,
        videoPiP: standardVideoPiP || webkitVideoPiP,
        documentPiP: false,
        anySupported: standardVideoPiP || webkitVideoPiP
      };
    }

    async enterSystemPictureInPicture() {
      const el = this.videoEl;
      if (!this.active || this.mode !== 'video' || !el) {
        return { ok: false, reason: 'requires-video-playback-mode' };
      }
      const caps = this.getPiPCapabilities();
      if (!caps.anySupported) {
        return { ok: false, reason: 'unsupported' };
      }
      try {
        el.removeAttribute('autopictureinpicture');
        if ('autoPictureInPicture' in el) el.autoPictureInPicture = false;
        el.disablePictureInPicture = false;
        if (caps.standardVideoPiP && typeof el.requestPictureInPicture === 'function') {
          if (typeof document !== 'undefined' && document.pictureInPictureElement === el) {
            await document.exitPictureInPicture();
            el.disablePictureInPicture = true;
            return { ok: true, exited: true, kind: 'video-pip' };
          }
          await el.requestPictureInPicture();
          return { ok: true, active: true, kind: 'video-pip' };
        }
        if (caps.webkitVideoPiP && typeof el.webkitSetPresentationMode === 'function') {
          const nextMode = el.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture';
          el.webkitSetPresentationMode(nextMode);
          return { ok: true, active: nextMode === 'picture-in-picture', kind: 'webkit-pip' };
        }
      } catch (err) {
        el.disablePictureInPicture = true;
        return { ok: false, reason: String(err?.message || 'pip-rejected') };
      }
      return { ok: false, reason: 'unsupported' };
    }

    async exitSystemPictureInPicture() {
      try {
        if (typeof document !== 'undefined' && document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        }
        if (
          this.videoEl &&
          typeof this.videoEl.webkitSetPresentationMode === 'function' &&
          this.videoEl.webkitPresentationMode === 'picture-in-picture'
        ) {
          this.videoEl.webkitSetPresentationMode('inline');
        }
        if (this.docPipWindow && !this.docPipWindow.closed) {
          this.docPipWindow.close();
        }
        this.isInSystemPiP = false;
        return true;
      } catch (_err) {
        return false;
      }
    }

    async openStageDocumentPiP() {
      return { ok: false, reason: 'disabled-by-design-inweb-mini-and-bg-audio' };
    }

    registerExtraMediaSessionHandlers(handlers = {}) {
      if (typeof navigator === 'undefined' || !navigator.mediaSession) return;
      const bindOne = (action, fn) => {
        if (typeof fn !== 'function') return;
        try {
          navigator.mediaSession.setActionHandler(action, fn);
        } catch (_err) {}
      };
      bindOne('previoustrack', handlers.previoustrack);
      bindOne('nexttrack', handlers.nexttrack);
    }

    syncMediaSession(forcedState = null, opts = {}) {
      const info = this.currentStreamInfo;
      if (!this.active || !info || this.visualMutedCompanion) return;

      const useBgAudio = Boolean(this._bgAudioHandoffActive && this.companionAudioEl && this.companionAudioEl.src);
      const el = useBgAudio ? this.companionAudioEl : this.videoEl;
      const dur =
        !info.isLive && el && Number.isFinite(el.duration) && el.duration > 0
          ? el.duration
          : !info.isLive && this.lastKnownDuration > 0
            ? this.lastKnownDuration
            : 0;
      const rawPos =
        el && Number.isFinite(el.currentTime) && el.currentTime >= 0
          ? el.currentTime
          : this.lastKnownTime;
      const safePos = dur > 0 ? Math.min(dur, Math.max(0, rawPos)) : Math.max(0, rawPos);
      const state = forcedState || (el && !el.paused ? 'playing' : 'paused');
      const rate = clampNum(el?.playbackRate || this._prefs.speed || 1, 0.25, 2.5, 1);

      if (NS.audioBackgroundBridge && typeof NS.audioBackgroundBridge.syncMediaSession === 'function') {
        if (!opts.positionOnly) {
          NS.audioBackgroundBridge.syncMediaSession({
            sourceType: 'youtube',
            title: info.title || `YouTube (${info.videoId || 'Stream'})`,
            artist: 'YouTube Direct Stream • Web Tiểu Thuyết Bi',
            album: info.isLive
              ? '🔴 Trực tiếp (LIVE)'
              : this.mode === 'audio-only' || useBgAudio
                ? '🎧 Audio Nền YouTube'
                : '🎬 Video YouTube Trong Web',
            artworkUrl:
              info.thumbnailUrl ||
              (info.videoId ? `https://i.ytimg.com/vi/${info.videoId}/hqdefault.jpg` : '') ||
              NS.getPortraitArtworkUrl?.() ||
              './assets/app-icon-192.png',
            state,
            duration: dur,
            position: safePos,
            playbackRate: rate
          });
        }
      }

      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaSession &&
        typeof navigator.mediaSession.setPositionState === 'function' &&
        !info.isLive &&
        Number.isFinite(dur) &&
        dur > 0 &&
        Number.isFinite(safePos) &&
        safePos >= 0 &&
        safePos <= dur
      ) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: rate > 0 ? rate : 1,
            position: safePos
          });
        } catch (_err) {}
      }
    }
  }

  NS.nativePlayer = new UnifiedNativeMediaPlayer();
  NS.nativePlayer.installGlobalPlaybackUnlock();
  NS.UnifiedNativeMediaPlayer = UnifiedNativeMediaPlayer;
})(typeof window !== 'undefined' ? window : globalThis);
