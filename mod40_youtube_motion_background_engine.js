/**
 * ============================================================================
 * MODULE 40: YOUTUBE MOTION BACKGROUND & PRIORITY STAGE COMPOSITOR ENGINE
 * ============================================================================
 * Vai trò cốt lõi:
 *  1. Tự động ưu tiên Video YouTube (Auto-Priority Engine) làm hình nền chuyển
 *     động toàn trang 16:9 phủ kín 100% viewport trên cả 6 Tab làm việc ngay
 *     khi người dùng chọn/phát video trong Tab 5 Ô Lớn #5.
 *  2. Khắc phục triệt để lỗi YouTube IFrame API (`YT.Player.destroy()` biến
 *     thẻ `<iframe>` thành `<div>` khiến các lần đổi video nền sau đó bị tịt):
 *     luôn kiểm tra `tagName === 'IFRAME'`, tái tạo DOM nguyên bản an toàn và
 *     tận dụng `loadVideoById()` mượt mà không nhấp nháy.
 *  3. Phân tầng Z-Index chuẩn xác trong `#ambient-backdrop-layer`:
 *     - Tạm ẩn nền tĩnh / video tải tay / canvas nghệ thuật (Mod 32) khi nền
 *       YouTube đang giữ quyền ưu tiên, đồng thời vẫn ghi nhớ lựa chọn cũ để
 *       khôi phục trọn vẹn khi tắt nền YouTube.
 *  4. Cung cấp bộ điều khiển trực quan chuyên sâu tại Ô #5 & mini-widget:
 *     - Độ rõ/mờ đục video (Opacity: 10%–100%)
 *     - Độ nhòe điện ảnh (Blur: 0px–24px)
 *     - Độ sáng khung hình (Brightness: 40%–180%)
 *     - Độ tối lớp phủ dịu mắt (Darkness Veil: 0%–90%)
 *     - Độ tương phản dịu nét (Contrast: 80%–135%)
 *     - Độ xuyên thấu thẻ chữ UI (Glass Transparency: 15%–95%)
 *     - Bật/Tắt & chỉnh Âm lượng nền riêng (Sound + Volume 0%–100%)
 *     - 4 Preset 1 chạm chuẩn thẩm mỹ viết truyện (Rõ Nét, Đêm Mưa, Sương Mù, Tối Sâu)
 *     - Phím tắt / nút Soi Nền Toàn Trang (Peek Mode) & Thanh Mini Nền nổi
 *
 * Tuân thủ 100% Kiến trúc Thuần Khiết Không Reload — Không đụng chạm máy chủ.
 * Tác giả kỹ thuật: Bi's Light Novel Studio Engineering (Mod 40).
 * ============================================================================
 */
(function initMod40YouTubeMotionBackgroundEngine(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  /**
   * Hằng số cấu hình, bảng Preset, dải thông số và mã định danh DOM bất biến
   * tương thích chéo với Module 39 & Module 32.
   */
  const MOD40_CONSTANTS = Object.freeze({
    MODULE_KEY: 'mod40',
    ENGINE_VERSION: '40.1.0',
    STORAGE_KEY: 'noir_v40_mod40_motion_bg_v1',
    LEGACY_MOD39_STORAGE_KEY: 'noir_v39_mod39_youtube_studio_v1',
    STYLE_ELEMENT_ID: 'mod40-motion-bg-styles',
    BACKDROP_HOST_ID: 'ambient-backdrop-layer',
    LEGACY_FROSTED_SHIELD_ID: 'ambient-frosted-shield',
    BG_LAYER_ID: 'mod39-youtube-bg-layer',
    BG_STAGE_WRAP_ID: 'mod39-youtube-bg-stage-wrap',
    BG_IFRAME_ID: 'mod39-youtube-bg-iframe',
    DARKNESS_VEIL_ID: 'mod40-youtube-darkness-veil',
    CONTROLS_MOUNT_ID: 'mod40-bg-controls-mount',
    BOX4_PANEL_ID: 's14-panel-typography-box',
    BOX4_PRIORITY_BANNER_ID: 'mod40-box4-priority-banner',
    FLOATING_PILL_ID: 'mod40-floating-bg-pill',
    PEEK_EXIT_BTN_ID: 'btn-mod39-exit-peek-floating',
    CROP_MODAL_ID: 'mod40-crop-modal',
    YOUTUBE_IFRAME_API_URL: 'https://www.youtube.com/iframe_api',
    BODY_CLASS_AMBIENT_ACTIVE: 'noir-ambient-active',
    BODY_CLASS_MOD39_ACTIVE: 'mod39-yt-bg-active',
    BODY_CLASS_MOD40_ACTIVE: 'mod40-motion-bg-active',
    BODY_CLASS_AMBIENT_PEEK: 'noir-ambient-peek-mode',
    BODY_CLASS_PEEK_MODE: 'mod39-bg-peek-mode',
    BODY_CLASS_SOUND_ON: 'mod40-bg-sound-enabled',
    LIMITS: Object.freeze({
      opacityPct: Object.freeze({ min: 10, max: 100, fallback: 90 }),
      blurPx: Object.freeze({ min: 0, max: 24, fallback: 1 }),
      brightnessPct: Object.freeze({ min: 40, max: 180, fallback: 96 }),
      darknessPct: Object.freeze({ min: 0, max: 90, fallback: 18 }),
      contrastPct: Object.freeze({ min: 80, max: 135, fallback: 102 }),
      uiGlassPct: Object.freeze({ min: 15, max: 95, fallback: 76 }),
      bgVolume: Object.freeze({ min: 0, max: 100, fallback: 45 }),
      aspectOverscan: 1.045,
      cropMinFrac: 0.12,
    }),
    DEFAULT_STATE: Object.freeze({
      enabled: false,
      autoPriority: true,
      showFloatingPill: false,
      videoKey: '',
      videoId: '',
      playlistId: '',
      title: '',
      author: '',
      watchUrl: '',
      thumbnailUrl: '',
      opacityPct: 90,
      blurPx: 1,
      brightnessPct: 96,
      darknessPct: 18,
      contrastPct: 102,
      uiGlassPct: 76,
      allowBgSound: false,
      bgVolume: 45,
      cropEnabled: false,
      cropX: 0,
      cropY: 0,
      cropW: 1,
      cropH: 1,
      cropFitMode: 'stretch',
      lastPresetId: 'CINEMA_CLEAR',
      activatedAt: 0,
      updatedAt: 0,
    }),
    PRESETS: Object.freeze([
      Object.freeze({
        id: 'CINEMA_CLEAR',
        label: '🎬 Điện Ảnh Rõ Nét',
        shortLabel: 'Rõ Nét',
        description: 'Hiển thị video nền sắc nét cân bằng với lớp phủ dịu nhẹ 20%.',
        opacityPct: 92,
        blurPx: 1,
        brightnessPct: 95,
        darknessPct: 20,
        contrastPct: 104,
        uiGlassPct: 72,
      }),
      Object.freeze({
        id: 'NIGHT_RAIN_COMFORT',
        label: '🌧️ Đêm Mưa Dịu Mắt',
        shortLabel: 'Đêm Mưa',
        description: 'Hạ sáng nhẹ, thêm lớp tối 38% bảo vệ thị lực khi viết ban đêm.',
        opacityPct: 84,
        blurPx: 4,
        brightnessPct: 76,
        darknessPct: 38,
        contrastPct: 98,
        uiGlassPct: 66,
      }),
      Object.freeze({
        id: 'FOG_FOCUS',
        label: '🌫️ Sương Mù Tập Trung',
        shortLabel: 'Sương Mù',
        description: 'Làm nhòe hậu cảnh 10px như kính mờ để nổi bật từng câu chữ.',
        opacityPct: 78,
        blurPx: 10,
        brightnessPct: 82,
        darknessPct: 32,
        contrastPct: 96,
        uiGlassPct: 58,
      }),
      Object.freeze({
        id: 'DEEP_DARK_READ',
        label: '🌑 Tối Sâu Chống Chói',
        shortLabel: 'Tối Sâu',
        description: 'Phủ tối 60% phù hợp các video nền sáng rực, anime màu gắt.',
        opacityPct: 70,
        blurPx: 6,
        brightnessPct: 64,
        darknessPct: 60,
        contrastPct: 100,
        uiGlassPct: 52,
      }),
    ]),
  });

  /**
   * Tiện ích an toàn thuần túy dùng chung trong toàn bộ Module 40.
   */
  const Mod40Utils = {
    clampNumber(value, min, max, fallback) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return fallback;
      if (numeric < min) return min;
      if (numeric > max) return max;
      return Math.round(numeric);
    },

    escapeHtml(rawText) {
      return String(rawText == null ? '' : rawText)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    isHttpOrigin() {
      try {
        return /^https?:$/i.test(String(global.location?.protocol || ''));
      } catch (_err) {
        return false;
      }
    },

    getSafeOrigin() {
      try {
        if (!Mod40Utils.isHttpOrigin()) return '';
        const origin = String(global.location.origin || '').trim();
        return origin && origin !== 'null' ? origin : '';
      } catch (_err) {
        return '';
      }
    },

    extractVideoIdFromInput(raw) {
      const text = String(raw || '').trim();
      if (!text) return '';
      if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
      const match = text.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|watch\?.+&v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
      );
      return match ? match[1] : '';
    },

    sanitizeCropRect(raw) {
      const minFrac = MOD40_CONSTANTS.LIMITS.cropMinFrac || 0.12;
      const src = raw && typeof raw === 'object' ? raw : {};
      let x = Number(src.cropX);
      let y = Number(src.cropY);
      let w = Number(src.cropW);
      let h = Number(src.cropH);
      if (!Number.isFinite(x)) x = 0;
      if (!Number.isFinite(y)) y = 0;
      if (!Number.isFinite(w)) w = 1;
      if (!Number.isFinite(h)) h = 1;
      x = Math.max(0, Math.min(1 - minFrac, x));
      y = Math.max(0, Math.min(1 - minFrac, y));
      w = Math.max(minFrac, Math.min(1 - x, w));
      h = Math.max(minFrac, Math.min(1 - y, h));
      const round4 = (n) => Math.round(n * 10000) / 10000;
      return {
        cropX: round4(x),
        cropY: round4(y),
        cropW: round4(w),
        cropH: round4(h),
      };
    },

    buildNoCookieBgEmbedUrl(videoId, playlistId, startSeconds, options = {}) {
      const safeVid = Mod40Utils.extractVideoIdFromInput(videoId);
      const safeList = String(playlistId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
      const base = safeVid
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(safeVid)}`
        : safeList
          ? 'https://www.youtube-nocookie.com/embed/videoseries'
          : '';
      if (!base) return '';

      const shouldAutoplay = options.autoplay !== false;
      const params = new URLSearchParams();
      params.set('enablejsapi', '1');
      params.set('autoplay', shouldAutoplay ? '1' : '0');
      params.set('mute', '1');
      params.set('controls', '0');
      params.set('disablekb', '1');
      params.set('fs', '0');
      params.set('modestbranding', '1');
      params.set('rel', '0');
      params.set('playsinline', '1');
      params.set('iv_load_policy', '3');
      // Chỉ bật loop+list khi phát nguyên Playlist; với video lẻ bỏ `playlist=` & `list=RD...`
      // để YouTube không kích hoạt Playlist Mode (tránh hiện cụm nút `|◀ ⏸ ▶|` và thẻ "More videos").
      // Vòng lặp video lẻ được Mod40YouTubeBackgroundPlayerHost xử lý mượt qua sự kiện ENDED.
      if (!safeVid && safeList) {
        params.set('loop', '1');
        params.set('list', safeList);
      }
      const startSec = Math.max(0, Math.floor(Number(startSeconds) || 0));
      if (startSec > 0) params.set('start', String(startSec));

      if (Mod40Utils.isHttpOrigin()) {
        const origin = Mod40Utils.getSafeOrigin();
        if (origin) params.set('origin', origin);
      }
      return `${base}?${params.toString()}`;
    },

    findPresetById(presetId) {
      const target = String(presetId || '').trim().toUpperCase();
      return MOD40_CONSTANTS.PRESETS.find((item) => item.id === target) || null;
    },

    isTextEntryElement(el) {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return Boolean(el.isContentEditable);
    },

    safeToast(message, variant = 'info') {
      try {
        if (typeof NS.showToast === 'function') {
          NS.showToast(String(message || ''), variant);
          return;
        }
        if (NS.ui && typeof NS.ui.toast === 'function') {
          NS.ui.toast(String(message || ''), variant);
        }
      } catch (_err) {
        // Bỏ qua nếu host toast chưa sẵn sàng
      }
    },

    computePresetSignature(state) {
      const s = state || MOD40_CONSTANTS.DEFAULT_STATE;
      const match = MOD40_CONSTANTS.PRESETS.find(
        (p) =>
          p.opacityPct === Number(s.opacityPct) &&
          p.blurPx === Number(s.blurPx) &&
          p.brightnessPct === Number(s.brightnessPct) &&
          p.darknessPct === Number(s.darknessPct) &&
          p.contrastPct === Number(s.contrastPct) &&
          p.uiGlassPct === Number(s.uiGlassPct)
      );
      return match ? match.id : 'CUSTOM';
    },
  };

  /**
   * Kho lưu trữ cấu hình bền vững của Module 40.
   * Tự động di trú (migrate) trạng thái nền cũ từ Mod 39 trong lần chạy đầu
   * tiên nếu có, giúp người dùng không bị mất cấu hình đã chỉnh trước đó.
   */
  class Mod40MotionBgVault {
    constructor() {
      this._memoryFallback = null;
      this.state = this._loadInitialState();
    }

    _sanitizeState(rawObj) {
      const raw = rawObj && typeof rawObj === 'object' ? rawObj : {};
      const L = MOD40_CONSTANTS.LIMITS;
      const D = MOD40_CONSTANTS.DEFAULT_STATE;
      const videoId = Mod40Utils.extractVideoIdFromInput(raw.videoId || raw.videoKey || '');
      const playlistId = String(raw.playlistId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
      const videoKey = String(raw.videoKey || videoId || playlistId || '').trim();

      const cropRect = Mod40Utils.sanitizeCropRect(raw);
      const sanitized = {
        enabled: Boolean(raw.enabled && (videoId || playlistId)),
        // Luôn mặc định ngầm bật tự động ưu tiên nền YouTube (không hiển thị công tắc rời trên UI)
        autoPriority: true,
        showFloatingPill: Boolean(raw.showFloatingPill),
        videoKey,
        videoId,
        playlistId,
        title: String(raw.title || '').trim().slice(0, 180),
        author: String(raw.author || '').trim().slice(0, 100),
        watchUrl: String(raw.watchUrl || '').trim().slice(0, 320),
        thumbnailUrl: String(raw.thumbnailUrl || '').trim().slice(0, 320),
        opacityPct: Mod40Utils.clampNumber(raw.opacityPct, L.opacityPct.min, L.opacityPct.max, D.opacityPct),
        blurPx: Mod40Utils.clampNumber(raw.blurPx, L.blurPx.min, L.blurPx.max, D.blurPx),
        brightnessPct: Mod40Utils.clampNumber(raw.brightnessPct, L.brightnessPct.min, L.brightnessPct.max, D.brightnessPct),
        darknessPct: Mod40Utils.clampNumber(raw.darknessPct, L.darknessPct.min, L.darknessPct.max, D.darknessPct),
        contrastPct: Mod40Utils.clampNumber(raw.contrastPct, L.contrastPct.min, L.contrastPct.max, D.contrastPct),
        uiGlassPct: Mod40Utils.clampNumber(raw.uiGlassPct, L.uiGlassPct.min, L.uiGlassPct.max, D.uiGlassPct),
        allowBgSound: Boolean(raw.allowBgSound),
        bgVolume: Mod40Utils.clampNumber(raw.bgVolume, L.bgVolume.min, L.bgVolume.max, D.bgVolume),
        cropEnabled: Boolean(raw.cropEnabled),
        cropX: cropRect.cropX,
        cropY: cropRect.cropY,
        cropW: cropRect.cropW,
        cropH: cropRect.cropH,
        cropFitMode: raw.cropFitMode === 'exact' ? 'exact' : 'stretch',
        lastPresetId: String(raw.lastPresetId || D.lastPresetId).trim().slice(0, 40),
        activatedAt: Number(raw.activatedAt) || 0,
        updatedAt: Number(raw.updatedAt) || 0,
      };
      if (!sanitized.lastPresetId) {
        sanitized.lastPresetId = Mod40Utils.computePresetSignature(sanitized);
      }
      return sanitized;
    }

    _readJsonStorage(key) {
      try {
        const text = global.localStorage ? global.localStorage.getItem(key) : null;
        if (!text) return null;
        return JSON.parse(text);
      } catch (_err) {
        return null;
      }
    }

    _loadInitialState() {
      const direct = this._readJsonStorage(MOD40_CONSTANTS.STORAGE_KEY);
      if (direct && typeof direct === 'object') {
        return this._sanitizeState(direct);
      }

      // Di trú mượt từ cấu hình nền web của Module 39 (nếu từng lưu)
      const legacy = this._readJsonStorage(MOD40_CONSTANTS.LEGACY_MOD39_STORAGE_KEY);
      if (legacy && legacy.webBg && typeof legacy.webBg === 'object') {
        const legBg = legacy.webBg;
        return this._sanitizeState({
          enabled: Boolean(legBg.enabled),
          autoPriority: true,
          videoKey: legBg.videoKey || legBg.videoId || legBg.playlistId || '',
          videoId: legBg.videoId || '',
          playlistId: legBg.playlistId || '',
          title: legBg.title || '',
          watchUrl: legBg.watchUrl || '',
          opacityPct: legBg.opacityPct,
          blurPx: legBg.blurPx,
          brightnessPct: legBg.brightnessPct,
          darknessPct: MOD40_CONSTANTS.DEFAULT_STATE.darknessPct,
          contrastPct: MOD40_CONSTANTS.DEFAULT_STATE.contrastPct,
          uiGlassPct: legBg.uiGlassPct,
          allowBgSound: legBg.allowBgSound,
          bgVolume: 45,
        });
      }

      return this._sanitizeState(MOD40_CONSTANTS.DEFAULT_STATE);
    }

    getState() {
      return { ...this.state };
    }

    patchState(partial, persist = true) {
      const merged = Object.assign({}, this.state, partial || {}, {
        updatedAt: Date.now(),
      });
      this.state = this._sanitizeState(merged);
      if (persist) {
        this.save();
      }
      return this.getState();
    }

    save() {
      this._memoryFallback = this.getState();
      try {
        if (global.localStorage) {
          global.localStorage.setItem(MOD40_CONSTANTS.STORAGE_KEY, JSON.stringify(this.state));
        }
        // Đồng bộ ngược trường webBg sang kho Mod 39 để không lệch nếu kiểm tra chéo
        const legacy = this._readJsonStorage(MOD40_CONSTANTS.LEGACY_MOD39_STORAGE_KEY);
        if (legacy && typeof legacy === 'object') {
          legacy.webBg = Object.assign({}, legacy.webBg || {}, {
            enabled: this.state.enabled,
            videoKey: this.state.videoKey,
            videoId: this.state.videoId,
            playlistId: this.state.playlistId,
            title: this.state.title,
            watchUrl: this.state.watchUrl,
            opacityPct: this.state.opacityPct,
            blurPx: this.state.blurPx,
            brightnessPct: this.state.brightnessPct,
            uiGlassPct: this.state.uiGlassPct,
            allowBgSound: this.state.allowBgSound,
          });
          global.localStorage.setItem(MOD40_CONSTANTS.LEGACY_MOD39_STORAGE_KEY, JSON.stringify(legacy));
        }
      } catch (_err) {
        // Fallback giữ trạng thái trên RAM nếu Safari/Edge chặn quota localStorage
      }
    }
  }

  /**
   * Bộ tổng hợp CSS toàn trang + Điều phối quyền ưu tiên lớp nền (Z-Index Arbiter).
   * Đảm bảo:
   *  - Lớp nền YouTube (`#mod39-youtube-bg-layer`, `z-index: 2`) và màn tối dịu mắt
   *    (`#mod40-youtube-darkness-veil`, `z-index: 4`) nằm ngay dưới lớp kính nổi
   *    của toàn bộ 6 Tab.
   *  - Lớp nền tĩnh / tranh phong thủy (Mod 32) / video tải tay (#ambient-bg-video)
   *    được nhường quyền hiển thị sạch sẽ khi nền YouTube đang bật.
   *  - Mọi khung nội dung lớn nhỏ ở Tab 1..6 (Sáng & Tối) tự chuyển sang nền kính
   *    trong suốt (`backdrop-filter: blur(...)`) theo thông số Độ xuyên thấu.
   */
  class Mod40StagePriorityArbiterAndCssCompositor {
    constructor(vault, diagLogger) {
      this.vault = vault;
      this.diag = diagLogger;
      this.mod32HooksWrapped = false;
      this._resizeScheduled = false;
      this._resizeBound = false;
      this._mutationObserver = null;
      this._peekEscapeHandler = null;
      this.lastSuspendedMod32Snapshot = null;
    }

    ensureStylesheetMounted() {
      // Gỡ stylesheet nền cũ của Mod 39 để tránh xung đột quy tắc `top: 50%; left: 50%`
      // khiến iframe nền bị lệch xuống góc dưới bên phải màn hình.
      ['mod39-stage-dynamic-styles', 'mod39-youtube-bg-styles'].forEach((staleId) => {
        const legacyStyle = global.document.getElementById(staleId);
        if (legacyStyle) {
          try {
            legacyStyle.remove();
          } catch (_err) {}
        }
      });

      let styleEl = global.document.getElementById(MOD40_CONSTANTS.STYLE_ELEMENT_ID);
      if (!styleEl) {
        styleEl = global.document.createElement('style');
        styleEl.id = MOD40_CONSTANTS.STYLE_ELEMENT_ID;
        global.document.head.appendChild(styleEl);
      }

      const cssText = `
        /* === MODULE 40: YOUTUBE MOTION BACKGROUND STAGE & TRANSLUCENCY SYSTEM === */
        :root {
          --mod40-bg-opacity: 0.90;
          --mod40-bg-blur: 1px;
          --mod40-bg-brightness: 96%;
          --mod40-bg-contrast: 102%;
          --mod40-darkness-alpha: 0.18;
          --mod40-ui-dark-pane-alpha: 0.24;
          --mod40-ui-dark-card-alpha: 0.28;
          --mod40-ui-dark-deep-alpha: 0.28;
          --mod40-ui-light-pane-alpha: 0.44;
          --mod40-ui-light-card-alpha: 0.42;
          --mod40-glass-blur: 8px;
        }

        #${MOD40_CONSTANTS.BACKDROP_HOST_ID} {
          position: fixed !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100dvh !important;
          height: calc(var(--studio-vh, 1dvh) * 100) !important;
          overflow: hidden !important;
          pointer-events: none !important;
        }

        #${MOD40_CONSTANTS.BG_LAYER_ID} {
          position: fixed !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100dvh !important;
          height: calc(var(--studio-vh, 1dvh) * 100) !important;
          z-index: 2 !important;
          overflow: hidden !important;
          pointer-events: none !important;
          margin: 0 !important;
          padding: 0 !important;
          opacity: 0;
          visibility: hidden;
          background: #04070d;
          transition: opacity 280ms ease, visibility 280ms ease;
        }

        body.${MOD40_CONSTANTS.BODY_CLASS_MOD39_ACTIVE} #${MOD40_CONSTANTS.BG_LAYER_ID},
        body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #${MOD40_CONSTANTS.BG_LAYER_ID} {
          opacity: var(--mod40-bg-opacity, 0.90) !important;
          visibility: visible !important;
        }

        body #${MOD40_CONSTANTS.BG_LAYER_ID}[data-mod40-play-state="error-paused"] {
          opacity: 0 !important;
          visibility: hidden !important;
        }

        #${MOD40_CONSTANTS.BG_STAGE_WRAP_ID} {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          right: auto !important;
          bottom: auto !important;
          transform: translate(-50%, -50%) !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
          will-change: transform, width, height;
        }

        #${MOD40_CONSTANTS.BG_IFRAME_ID} {
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          display: block !important;
          pointer-events: none !important;
          filter: blur(var(--mod40-bg-blur, 1px)) brightness(var(--mod40-bg-brightness, 96%)) contrast(var(--mod40-bg-contrast, 102%));
          transition: filter 180ms ease;
        }

        body:not([data-mod40-crop-active="1"]) #${MOD40_CONSTANTS.BG_IFRAME_ID} {
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
          right: auto !important;
          bottom: auto !important;
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          transform: translateZ(0) scale(1.02) !important;
        }

        body[data-mod40-crop-active="1"] #${MOD40_CONSTANTS.BG_IFRAME_ID} {
          position: absolute !important;
          right: auto !important;
          bottom: auto !important;
          min-width: 0 !important;
          min-height: 0 !important;
          max-width: none !important;
          max-height: none !important;
          transform-origin: 0 0 !important;
        }

        body[data-mod40-crop-active="1"][data-mod40-crop-fit="exact"] {
          background-color: #000000 !important;
        }

        body[data-mod40-crop-active="1"][data-mod40-crop-fit="exact"] #${MOD40_CONSTANTS.BG_LAYER_ID} {
          background: #000000 !important;
        }

        body[data-mod40-crop-active="1"][data-mod40-crop-fit="exact"] #${MOD40_CONSTANTS.DARKNESS_VEIL_ID} {
          background: rgba(0, 0, 0, var(--mod40-darkness-alpha, 0.24)) !important;
        }

        body[data-mod40-crop-active="1"][data-mod40-crop-fit="exact"] #ambient-bg-canvas {
          opacity: 0 !important;
          display: none !important;
        }

        #${MOD40_CONSTANTS.DARKNESS_VEIL_ID} {
          position: absolute;
          inset: 0;
          z-index: 4 !important;
          pointer-events: none !important;
          opacity: 0;
          visibility: hidden;
          background: rgba(4, 7, 14, var(--mod40-darkness-alpha, 0.24));
          transition: opacity 220ms ease, background-color 180ms ease;
        }

        body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #${MOD40_CONSTANTS.DARKNESS_VEIL_ID} {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Ưu tiên nền YouTube: Tạm ẩn các lớp nền đục của Mod 32 / Upload thủ công */
        body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #ambient-bg-video,
        body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #ambient-bg-image,
        body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #mod32-procedural-art-canvas {
          display: none !important;
          opacity: 0 !important;
        }

        /* Tránh double-darken từ shield mặc định của index.html */
        body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #${MOD40_CONSTANTS.LEGACY_FROSTED_SHIELD_ID} {
          background: transparent !important;
          opacity: 0 !important;
        }

        /* Cho phép hạt đom đóm/sao nhẹ ở ambient-bg-canvas hòa quyện tinh tế không che mờ video */
        body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #ambient-bg-canvas {
          z-index: 3 !important;
          opacity: 0.55;
        }

        /* Đảm bảo lớp app workspace nổi phía trên #ambient-backdrop-layer */
        body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} {
          background-color: #05070d !important;
        }

        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #app-root,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} main,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] {
          background-color: transparent !important;
        }

        /* Độ xuyên thấu kính mờ cho Dark Mode trên tất cả 6 Tab */
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-master-top-nav,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} header,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #mobile-bottom-nav,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #mobile-bottom-nav-bar,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #left-sidebar-pane,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #center-editor-pane,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #right-bible-pane,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #pane-left-beats,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #pane-right-manuscript,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #mode5-plot-diagram-studio,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-2-chapters,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-3-ai-assistant,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-4-story-bible,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-5-ambience,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-6-system {
          background-color: rgba(8, 12, 20, var(--noir-ambient-pane-dark, 0.29)) !important;
          background-image: none !important;
          backdrop-filter: blur(var(--mod40-glass-blur, 11px)) saturate(1.12) !important;
          -webkit-backdrop-filter: blur(var(--mod40-glass-blur, 11px)) saturate(1.12) !important;
        }

        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .bg-zinc-900,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .bg-zinc-950,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .bg-slate-900,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .bg-slate-950,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .dark\\:bg-zinc-900,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .dark\\:bg-zinc-950,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .dark\\:bg-slate-900,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .dark\\:bg-slate-950,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .rounded-2xl,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .rounded-xl,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-panel-"],
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #tab5-youtube-big-card,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-panel-youtube-box,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-panel-typography-box,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #mod39-empty-stage-card {
          background-color: rgba(14, 19, 29, var(--noir-ambient-card-dark, 0.28)) !important;
          background-image: none !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
        }

        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #main-editor,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #editor-container,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #ai-prompt-input,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-tab3-beats-input,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] textarea,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} .rounded-2xl.bg-zinc-900\\/95,
        html.dark body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} .rounded-xl.bg-zinc-950\\/90 {
          background-color: rgba(10, 14, 23, var(--noir-ambient-pane-dark, 0.29)) !important;
        }

        /* Độ xuyên thấu kính mờ cho Light Mode trên tất cả 6 Tab */
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #app-root,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} main,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] {
          background-color: transparent !important;
        }

        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-master-top-nav,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} header,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #mobile-bottom-nav,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #mobile-bottom-nav-bar,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #left-sidebar-pane,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #center-editor-pane,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #right-bible-pane,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #pane-left-beats,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #pane-right-manuscript,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #mode5-plot-diagram-studio,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-2-chapters,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-3-ai-assistant,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-4-story-bible,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-5-ambience,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-screen-6-system {
          background-color: rgba(248, 250, 252, var(--noir-ambient-pane-light, 0.44)) !important;
          background-image: none !important;
          backdrop-filter: blur(var(--mod40-glass-blur, 11px)) !important;
          -webkit-backdrop-filter: blur(var(--mod40-glass-blur, 11px)) !important;
        }

        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .bg-studioLightPanel,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .bg-white,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .rounded-2xl,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-screen-"] .rounded-xl,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} [id^="s14-panel-"],
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #tab5-youtube-big-card,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-panel-youtube-box,
        html:not(.dark) body.${MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE} #s14-panel-typography-box {
          background-color: rgba(255, 255, 255, var(--noir-ambient-card-light, 0.50)) !important;
          background-image: none !important;
        }

        /* Chế độ Soi Nền Toàn Trang (Peek Mode) */
        body.${MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE} #app-root,
        body.${MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK} #app-root,
        body.${MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK} main#app-main-workspace {
          opacity: 0.04 !important;
          pointer-events: none !important;
          transition: opacity 250ms ease;
        }
        body.${MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE} #${MOD40_CONSTANTS.DARKNESS_VEIL_ID},
        body.${MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK} #${MOD40_CONSTANTS.DARKNESS_VEIL_ID} {
          opacity: 0.12 !important;
        }
        body.${MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE} #${MOD40_CONSTANTS.BG_LAYER_ID},
        body.${MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK} #${MOD40_CONSTANTS.BG_LAYER_ID} {
          opacity: 1 !important;
        }
        body.${MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE} #${MOD40_CONSTANTS.BG_IFRAME_ID},
        body.${MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK} #${MOD40_CONSTANTS.BG_IFRAME_ID} {
          filter: blur(0px) brightness(100%) contrast(102%) !important;
        }

        #${MOD40_CONSTANTS.PEEK_EXIT_BTN_ID}.hidden {
          display: none !important;
        }

        /* Nút thoát Peek Mode nổi phía trên cùng */
        #${MOD40_CONSTANTS.PEEK_EXIT_BTN_ID} {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999 !important;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 13px;
          color: #ffffff;
          background: linear-gradient(135deg, rgba(225, 29, 72, 0.96), rgba(15, 23, 42, 0.94));
          border: 1px solid rgba(253, 164, 175, 0.65);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
          cursor: pointer;
          pointer-events: auto !important;
          transition: transform 150ms ease, filter 150ms ease;
        }
        #${MOD40_CONSTANTS.PEEK_EXIT_BTN_ID}:hover {
          transform: translateX(-50%) scale(1.04);
          filter: brightness(1.1);
        }

        /* Pill điều khiển nhanh nền video chuyển động (tùy chọn bật) */
        #${MOD40_CONSTANTS.FLOATING_PILL_ID} {
          position: fixed;
          bottom: 72px;
          right: 16px;
          z-index: 60;
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: calc(100vw - 32px);
          padding: 8px 12px;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.88);
          border: 1px solid rgba(244, 63, 94, 0.45);
          color: #f8fafc;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
          font-size: 12px;
        }
        @media (min-width: 768px) {
          #${MOD40_CONSTANTS.FLOATING_PILL_ID} {
            bottom: 20px;
            right: 20px;
          }
        }

        /* Modal căn chỉnh / Crop khung hình nền YouTube (Desktop + Mobile responsive) */
        #${MOD40_CONSTANTS.CROP_MODAL_ID} {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483000 !important;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
          overflow-x: hidden;
          padding: max(10px, env(safe-area-inset-top, 0px)) 10px max(10px, env(safe-area-inset-bottom, 0px));
          background: rgba(2, 6, 14, 0.86);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        #${MOD40_CONSTANTS.CROP_MODAL_ID} .mod40-crop-card {
          width: min(100%, 780px);
          margin-top: auto;
          margin-bottom: auto;
          max-height: calc(var(--studio-vh, 1dvh) * 94);
          overflow-y: auto;
          box-sizing: border-box;
        }
        #mod40-crop-stage {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #02040a;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }
        #mod40-crop-box {
          position: absolute;
          box-sizing: border-box;
          border: 2px solid #fb7185;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.68);
          cursor: move;
          touch-action: none;
        }
        .mod40-crop-grid-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px);
          background-size: 33.333% 33.333%;
        }
        .mod40-crop-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: none;
          z-index: 6;
        }
        .mod40-crop-handle::after {
          content: '';
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #f43f5e;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
        }
        .mod40-crop-handle[data-handle="nw"] { top: 0; left: 0; cursor: nwse-resize; }
        .mod40-crop-handle[data-handle="n"]  { top: 0; left: 50%; margin-left: -10px; cursor: ns-resize; }
        .mod40-crop-handle[data-handle="ne"] { top: 0; right: 0; cursor: nesw-resize; }
        .mod40-crop-handle[data-handle="e"]  { top: 50%; right: 0; margin-top: -10px; cursor: ew-resize; }
        .mod40-crop-handle[data-handle="se"] { bottom: 0; right: 0; cursor: nwse-resize; }
        .mod40-crop-handle[data-handle="s"]  { bottom: 0; left: 50%; margin-left: -10px; cursor: ns-resize; }
        .mod40-crop-handle[data-handle="sw"] { bottom: 0; left: 0; cursor: nesw-resize; }
        .mod40-crop-handle[data-handle="w"]  { top: 50%; left: 0; margin-top: -10px; cursor: ew-resize; }
      `;

      if (styleEl.textContent !== cssText) {
        styleEl.textContent = cssText;
      }
    }

    ensureBackdropLayersMounted() {
      this.ensureStylesheetMounted();

      let backdropHost = global.document.getElementById(MOD40_CONSTANTS.BACKDROP_HOST_ID);
      if (!backdropHost) {
        backdropHost = global.document.body;
      }

      let layer = global.document.getElementById(MOD40_CONSTANTS.BG_LAYER_ID);
      if (!layer) {
        layer = global.document.createElement('div');
        layer.id = MOD40_CONSTANTS.BG_LAYER_ID;
        layer.setAttribute('aria-hidden', 'true');
      }
      if (layer.parentElement !== backdropHost) {
        const shield = global.document.getElementById(MOD40_CONSTANTS.LEGACY_FROSTED_SHIELD_ID);
        if (shield && shield.parentElement === backdropHost) {
          backdropHost.insertBefore(layer, shield);
        } else {
          backdropHost.insertBefore(layer, backdropHost.firstChild);
        }
      }

      let stageWrap = global.document.getElementById(MOD40_CONSTANTS.BG_STAGE_WRAP_ID);
      if (!stageWrap) {
        stageWrap = global.document.createElement('div');
        stageWrap.id = MOD40_CONSTANTS.BG_STAGE_WRAP_ID;
        layer.appendChild(stageWrap);
      } else if (stageWrap.parentElement !== layer) {
        layer.appendChild(stageWrap);
      }

      let veil = global.document.getElementById(MOD40_CONSTANTS.DARKNESS_VEIL_ID);
      if (!veil) {
        veil = global.document.createElement('div');
        veil.id = MOD40_CONSTANTS.DARKNESS_VEIL_ID;
        veil.setAttribute('aria-hidden', 'true');
      }
      if (veil.parentElement !== backdropHost) {
        backdropHost.appendChild(veil);
      }

      this._bindResizeOnce();
      this.updateCoverGeometry();
      return { backdropHost, layer, stageWrap, veil };
    }

    /**
     * Đảm bảo phần tử `#mod39-youtube-bg-iframe` LUÔN là một thẻ `<iframe>` thật.
     * YouTube `YT.Player.destroy()` sẽ thay thế `<iframe>` bằng `<div>` mang cùng ID;
     * hàm này phát hiện và tái tạo `<iframe>` chuẩn ngay lập tức.
     */
    ensureBgIframeElement(forceRecreate = false) {
      const { stageWrap } = this.ensureBackdropLayersMounted();
      const existing = global.document.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
      if (existing && !forceRecreate && existing.tagName && existing.tagName.toUpperCase() === 'IFRAME') {
        if (existing.parentElement !== stageWrap) {
          stageWrap.appendChild(existing);
        }
        return existing;
      }

      if (existing) {
        try {
          existing.remove();
        } catch (_err) {
          if (existing.parentElement) existing.parentElement.removeChild(existing);
        }
      }

      const iframe = global.document.createElement('iframe');
      iframe.id = MOD40_CONSTANTS.BG_IFRAME_ID;
      iframe.title = 'Nền Video Chuyển Động YouTube Toàn Trang';
      iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.setAttribute('tabindex', '-1');
      iframe.setAttribute('aria-hidden', 'true');
      stageWrap.appendChild(iframe);
      this.updateCoverGeometry();
      return iframe;
    }

    clearBgIframeElement() {
      const node = global.document.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
      if (node) {
        if (node.tagName && node.tagName.toUpperCase() === 'IFRAME') {
          try {
            node.setAttribute('src', 'about:blank');
          } catch (_err) {}
        }
        try {
          node.remove();
        } catch (_err) {}
      }
    }

    updateCoverGeometry() {
      const wrap = global.document.getElementById(MOD40_CONSTANTS.BG_STAGE_WRAP_ID);
      if (!wrap) return;
      const layer = global.document.getElementById(MOD40_CONSTANTS.BG_LAYER_ID);
      const layerRect = layer && typeof layer.getBoundingClientRect === 'function' ? layer.getBoundingClientRect() : null;
      const vw = Math.max(
        global.innerWidth || 0,
        layerRect ? Math.round(layerRect.width) : 0,
        global.document.documentElement?.clientWidth || 0,
        320
      );
      const vh = Math.max(
        global.innerHeight || 0,
        layerRect ? Math.round(layerRect.height) : 0,
        global.document.documentElement?.clientHeight || 0,
        320
      );

      const s = this.vault.getState();
      const iframe = global.document.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
      const targetRatio = 16 / 9;

      if (s && s.cropEnabled) {
        const rect = Mod40Utils.sanitizeCropRect(s);
        const cx = rect.cropX;
        const cy = rect.cropY;
        const cw = rect.cropW;
        const ch = rect.cropH;
        const fitMode = s.cropFitMode === 'exact' ? 'exact' : 'stretch';
        const nativeW = 1600;
        const nativeH = 900;

        let destW;
        let destH;
        let scaleX;
        let scaleY;

        if (fitMode === 'exact') {
          let coverBaseW;
          let coverBaseH;
          if (vw / vh > targetRatio) {
            coverBaseW = vw;
            coverBaseH = vw / targetRatio;
          } else {
            coverBaseH = vh;
            coverBaseW = vh * targetRatio;
          }
          const rawW = coverBaseW * cw;
          const rawH = coverBaseH * ch;
          const clampScale = Math.min(1, vw / Math.max(1, rawW), vh / Math.max(1, rawH));
          const uScale = (coverBaseH / nativeH) * clampScale;
          destW = Math.max(48, Math.round(cw * nativeW * uScale));
          destH = Math.max(48, Math.round(ch * nativeH * uScale));
          scaleX = destW / (cw * nativeW);
          scaleY = destH / (ch * nativeH);
        } else {
          destW = vw;
          destH = vh;
          scaleX = destW / (cw * nativeW);
          scaleY = destH / (ch * nativeH);
        }

        wrap.style.position = 'absolute';
        wrap.style.top = '50%';
        wrap.style.left = '50%';
        wrap.style.right = 'auto';
        wrap.style.bottom = 'auto';
        wrap.style.overflow = 'hidden';
        wrap.style.transform = 'translate(-50%, -50%)';
        wrap.style.width = `${destW}px`;
        wrap.style.height = `${destH}px`;

        if (iframe) {
          const leftPx = -(cx * nativeW * scaleX);
          const topPx = -(cy * nativeH * scaleY);
          iframe.style.position = 'absolute';
          iframe.style.left = `${leftPx.toFixed(2)}px`;
          iframe.style.top = `${topPx.toFixed(2)}px`;
          iframe.style.width = `${nativeW}px`;
          iframe.style.height = `${nativeH}px`;
          iframe.style.minWidth = '0px';
          iframe.style.minHeight = '0px';
          iframe.style.maxWidth = 'none';
          iframe.style.maxHeight = 'none';
          iframe.style.transformOrigin = '0 0';
          iframe.style.transform = `scale(${scaleX.toFixed(5)}, ${scaleY.toFixed(5)}) translateZ(0)`;
        }
        return;
      }

      const overscan = MOD40_CONSTANTS.LIMITS.aspectOverscan;
      let coverW;
      let coverH;
      if (vw / vh > targetRatio) {
        coverW = Math.ceil(vw * overscan);
        coverH = Math.ceil((coverW * 9) / 16);
      } else {
        coverH = Math.ceil(vh * overscan);
        coverW = Math.ceil((coverH * 16) / 9);
      }

      wrap.style.position = 'absolute';
      wrap.style.top = '50%';
      wrap.style.left = '50%';
      wrap.style.right = 'auto';
      wrap.style.bottom = 'auto';
      wrap.style.overflow = 'hidden';
      wrap.style.transform = 'translate(-50%, -50%)';
      wrap.style.width = `${coverW}px`;
      wrap.style.height = `${coverH}px`;

      if (iframe) {
        iframe.style.position = 'relative';
        iframe.style.top = '0px';
        iframe.style.left = '0px';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.minWidth = '';
        iframe.style.minHeight = '';
        iframe.style.maxWidth = '';
        iframe.style.maxHeight = '';
        iframe.style.transformOrigin = '';
        iframe.style.transform = '';
      }
    }

    _bindResizeOnce() {
      if (this._resizeBound) return;
      this._resizeBound = true;
      global.addEventListener(
        'resize',
        () => {
          if (this._resizeScheduled) return;
          this._resizeScheduled = true;
          const raf = global.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
          raf(() => {
            this._resizeScheduled = false;
            this.updateCoverGeometry();
          });
        },
        { passive: true }
      );
    }

    applyVisualCssVariables() {
      const state = this.vault.getState();
      const root = global.document.documentElement;
      if (!root) return;

      const opacityDec = (Mod40Utils.clampNumber(state.opacityPct, 10, 100, 90) / 100).toFixed(2);
      const blurPx = Mod40Utils.clampNumber(state.blurPx, 0, 24, 1);
      const brightPct = Mod40Utils.clampNumber(state.brightnessPct, 40, 180, 96);
      const contrastPct = Mod40Utils.clampNumber(state.contrastPct, 80, 135, 102);
      const darkAlpha = (Mod40Utils.clampNumber(state.darknessPct, 0, 90, 18) / 100).toFixed(2);

      // Quy đổi slider "Độ rõ video qua thẻ chữ" (15..95):
      // giá trị càng cao => thẻ UI càng trong suốt hơn để lộ nền video nhiều hơn
      const glassPct = Mod40Utils.clampNumber(state.uiGlassPct, 15, 95, 76);
      const glassNorm = (glassPct - 15) / 80; // 0..1 (1 = tối đa xuyên thấu)
      const darkPaneAlpha = (0.62 - glassNorm * 0.50).toFixed(3); // 0.62 -> 0.12 (at 90 => ~0.15)
      const darkCardAlpha = (0.75 - glassNorm * 0.62).toFixed(3); // 0.75 -> 0.13 (at 90 => ~0.17 < 0.25)
      const darkDeepAlpha = (0.66 - glassNorm * 0.50).toFixed(3);
      const lightPaneAlpha = (0.78 - glassNorm * 0.52).toFixed(3);
      const lightCardAlpha = (0.74 - glassNorm * 0.50).toFixed(3);
      const uiBlurPx = Math.max(3, Math.round(14 - glassNorm * 8));

      root.style.setProperty('--mod40-bg-opacity', opacityDec);
      root.style.setProperty('--mod40-bg-blur', `${blurPx}px`);
      root.style.setProperty('--mod40-bg-brightness', `${brightPct}%`);
      root.style.setProperty('--mod40-bg-contrast', `${contrastPct}%`);
      root.style.setProperty('--mod40-darkness-alpha', darkAlpha);
      root.style.setProperty('--mod40-ui-dark-pane-alpha', darkPaneAlpha);
      root.style.setProperty('--mod40-ui-dark-card-alpha', darkCardAlpha);
      root.style.setProperty('--mod40-ui-dark-deep-alpha', darkDeepAlpha);
      root.style.setProperty('--mod40-ui-light-pane-alpha', lightPaneAlpha);
      root.style.setProperty('--mod40-ui-light-card-alpha', lightCardAlpha);
      root.style.setProperty('--mod40-glass-blur', `${uiBlurPx}px`);

      // Đồng bộ chuẩn 100% biến CSS --noir-ambient-* dùng trên index.html và Mod 32
      root.style.setProperty('--noir-ambient-pane-dark', darkPaneAlpha);
      root.style.setProperty('--noir-ambient-card-dark', darkCardAlpha);
      root.style.setProperty('--noir-ambient-pane-light', lightPaneAlpha);
      root.style.setProperty('--noir-ambient-card-light', lightCardAlpha);
      root.style.setProperty('--noir-ambient-pane-alpha', darkPaneAlpha);
      root.style.setProperty('--noir-ambient-card-alpha', darkCardAlpha);
      root.style.setProperty('--noir-ambient-pane-bg', `rgba(8, 12, 20, ${darkPaneAlpha})`);
      root.style.setProperty('--noir-ambient-card-bg', `rgba(14, 19, 29, ${darkCardAlpha})`);
      root.style.setProperty('--mod32-stage-blur', `${uiBlurPx}px`);

      const iframe = global.document.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
      if (iframe) {
        iframe.style.filter = `blur(${blurPx}px) brightness(${brightPct}%) contrast(${contrastPct}%)`;
      }
      const layer = global.document.getElementById(MOD40_CONSTANTS.BG_LAYER_ID);
      if (layer) {
        layer.classList.toggle('hidden', !state.enabled);
        layer.style.opacity = state.enabled ? opacityDec : '0';
      }
      const veil = global.document.getElementById(MOD40_CONSTANTS.DARKNESS_VEIL_ID);
      if (veil) {
        veil.style.backgroundColor = `rgba(4, 7, 14, ${darkAlpha})`;
      }
    }

    syncBodyActiveFlags(isActive, isSoundOn) {
      const body = global.document.body;
      if (!body) return;
      const layer = global.document.getElementById(MOD40_CONSTANTS.BG_LAYER_ID);
      if (layer) {
        layer.classList.toggle('hidden', !isActive);
      }
      const s = this.vault.getState();
      const cropActive = Boolean(isActive && s && s.cropEnabled);
      const cropFit = s && s.cropFitMode === 'exact' ? 'exact' : 'stretch';

      if (isActive) {
        body.classList.add(MOD40_CONSTANTS.BODY_CLASS_AMBIENT_ACTIVE);
        body.classList.add(MOD40_CONSTANTS.BODY_CLASS_MOD39_ACTIVE);
        body.classList.add(MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE);
        body.setAttribute('data-mod40-bg-active', 'true');
        if (cropActive) {
          body.setAttribute('data-mod40-crop-active', '1');
          body.setAttribute('data-mod40-crop-fit', cropFit);
        } else {
          body.removeAttribute('data-mod40-crop-active');
          body.removeAttribute('data-mod40-crop-fit');
        }
        this.suspendStaticMediaLayers();
      } else {
        body.classList.remove(MOD40_CONSTANTS.BODY_CLASS_AMBIENT_ACTIVE);
        body.classList.remove(MOD40_CONSTANTS.BODY_CLASS_MOD39_ACTIVE);
        body.classList.remove(MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE);
        body.classList.remove(MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK);
        body.classList.remove(MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE);
        body.removeAttribute('data-mod40-bg-active');
        body.removeAttribute('data-mod40-crop-active');
        body.removeAttribute('data-mod40-crop-fit');
        this.restoreStaticMediaLayers();
      }
      body.classList.toggle(MOD40_CONSTANTS.BODY_CLASS_SOUND_ON, Boolean(isActive && isSoundOn));
      this.syncFloatingPeekExitButton();
    }

    suspendStaticMediaLayers() {
      const bgVideo = global.document.getElementById('ambient-bg-video');
      if (bgVideo && !bgVideo.paused) {
        this.lastSuspendedMod32Snapshot = Object.assign({}, this.lastSuspendedMod32Snapshot || {}, {
          videoWasPlaying: true,
        });
        try {
          bgVideo.pause();
        } catch (_err) {}
      }
      const artCanvas = global.document.getElementById('mod32-procedural-art-canvas');
      if (artCanvas) {
        artCanvas.setAttribute('data-mod40-suspended', '1');
      }
    }

    restoreStaticMediaLayers() {
      const artCanvas = global.document.getElementById('mod32-procedural-art-canvas');
      if (artCanvas) {
        artCanvas.removeAttribute('data-mod40-suspended');
      }
      // Gọi lại đồng bộ chuẩn của Mod 32 để nền cũ (nếu có) tự hiện lại gọn gàng
      try {
        if (NS.ambientStage && NS.ambientStage.stageCompositor && typeof NS.ambientStage.stageCompositor.forceSyncAmbientBodyClass === 'function') {
          NS.ambientStage.stageCompositor.forceSyncAmbientBodyClass();
        }
        const bgVideo = global.document.getElementById('ambient-bg-video');
        if (bgVideo && this.lastSuspendedMod32Snapshot?.videoWasPlaying && !bgVideo.classList.contains('hidden') && bgVideo.src) {
          bgVideo.play().catch(() => {});
        }
      } catch (_err) {}
      this.lastSuspendedMod32Snapshot = null;
    }

    /**
     * Bọc (wrap) nhẹ nhàng các hàm đồng bộ nền của Mod 32 & Mod 22 để khi Mod 32
     * chạy async lúc khởi động (`restoreSavedCustomMediaFromIdb`), quyền ưu tiên
     * YouTube không bị tranh chiếm làm tối hay đè canvas lên video YouTube.
     */
    wrapMod32AndMod22PriorityHooks() {
      if (this.mod32HooksWrapped) return;
      this.mod32HooksWrapped = true;

      const wrapFn = (hostObj, methodName, wrapperFactory) => {
        if (!hostObj || typeof hostObj[methodName] !== 'function') return;
        const original = hostObj[methodName];
        if (original.__mod40Wrapped) return;
        const wrapped = wrapperFactory(original);
        wrapped.__mod40Wrapped = true;
        wrapped.__mod40Original = original;
        hostObj[methodName] = wrapped;
      };

      const compositor = NS.ambientStage && NS.ambientStage.stageCompositor;
      if (compositor) {
        wrapFn(compositor, 'forceSyncAmbientBodyClass', (orig) => {
          return function mod40GuardedSync() {
            const result = orig.apply(this, arguments);
            if (NS.youtubeMotionBg && NS.youtubeMotionBg.isActive()) {
              global.document.body?.classList.add(MOD40_CONSTANTS.BODY_CLASS_MOD39_ACTIVE);
              global.document.body?.classList.add(MOD40_CONSTANTS.BODY_CLASS_MOD40_ACTIVE);
            }
            return result;
          };
        });
      }

      const painter = NS.ambientStage && NS.ambientStage.artPainter;
      if (painter) {
        wrapFn(painter, 'paintWallpaper', (orig) => {
          return function mod40GuardedPaintWallpaper() {
            const result = orig.apply(this, arguments);
            if (NS.youtubeMotionBg && NS.youtubeMotionBg.isActive()) {
              NS.youtubeMotionBg.syncBox4PriorityBanner();
              if (typeof NS.youtubeMotionBg.applyVisualFilters === 'function') {
                NS.youtubeMotionBg.applyVisualFilters();
              }
            }
            return result;
          };
        });
      }

      // Quan sát lớp frosted-shield phòng trường hợp theme switcher sửa inline opacity
      const shield = global.document.getElementById(MOD40_CONSTANTS.LEGACY_FROSTED_SHIELD_ID);
      if (shield && typeof global.MutationObserver === 'function' && !this._mutationObserver) {
        this._mutationObserver = new global.MutationObserver(() => {
          if (NS.youtubeMotionBg && NS.youtubeMotionBg.isActive()) {
            shield.style.opacity = '0';
          }
        });
        this._mutationObserver.observe(shield, { attributes: true, attributeFilter: ['style', 'class'] });
      }
    }

    syncFloatingPeekExitButton() {
      const body = global.document.body;
      const isPeeking = Boolean(
        body &&
          (body.classList.contains(MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE) ||
            body.classList.contains(MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK))
      );
      let exitBtn = global.document.getElementById(MOD40_CONSTANTS.PEEK_EXIT_BTN_ID);

      if (!exitBtn && body) {
        exitBtn = global.document.createElement('button');
        exitBtn.id = MOD40_CONSTANTS.PEEK_EXIT_BTN_ID;
        exitBtn.type = 'button';
        exitBtn.className = 'hidden';
        exitBtn.innerHTML = '👁️ Hiện Lại Khung Chữ (Esc)';
        exitBtn.addEventListener('click', () => {
          if (NS.youtubeMotionBg) NS.youtubeMotionBg.exitPeekMode();
        });
        body.appendChild(exitBtn);
      }

      if (exitBtn) {
        const trPeek = (s) => (global.NoirStudio?.i18n?.translateText ? global.NoirStudio.i18n.translateText(s) : s);
        exitBtn.textContent = trPeek('👁️ Hiện Lại Khung Chữ (Esc)');
        exitBtn.classList.toggle('hidden', !isPeeking);
      }

      if (isPeeking && !this._peekEscapeHandler) {
        this._peekEscapeHandler = (evt) => {
          if (
            evt.key === 'Escape' &&
            (global.document.body?.classList.contains(MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE) ||
              global.document.body?.classList.contains(MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK))
          ) {
            if (NS.youtubeMotionBg) NS.youtubeMotionBg.exitPeekMode();
          }
        };
        global.document.addEventListener('keydown', this._peekEscapeHandler);
      }
    }
  }

  /**
   * Trình điều khiển YT.Player riêng cho Nền Web Chuyển Động.
   * Hỗ trợ 2 chế độ an toàn tuyệt đối:
   *  - HTTP/HTTPS (GitHub Pages / Local Web Server): nâng cấp qua `YT.Player` để
   *    chỉnh âm lượng nền chính xác 0%–100%, lặp vô hạn ngay khoảnh khắc ENDED,
   *    và đổi video tức thì qua `loadVideoById()` mà không hủy khung HTML.
   *  - `file://` hoặc khi YouTube IFrame API bị chặn bởi extension: vẫn nạp iframe
   *    `youtube-nocookie.com` trực tiếp (`autoplay=1&mute=1&loop=1`) làm nền động.
   */
  class Mod40YouTubeBackgroundPlayerHost {
    constructor(vault, compositor, diagLogger) {
      this.vault = vault;
      this.compositor = compositor;
      this.diag = diagLogger;
      this.ytPlayer = null;
      this.ytPlayerReady = false;
      this.activeVideoId = '';
      this.activePlaylistId = '';
      this._mountGeneration = 0;
      this._apiPollingTimer = null;
      this._apiScriptInjected = false;
      this._visibilityBound = false;
      this._onPlayerStateCallback = null;
      this.desiredPlayState = 'playing'; // 'playing' | 'paused' | 'error-paused' | 'stopped'
      this.playbackRate = 1;
      this.lastKnownBgTime = 0;
      this.lastKnownBgState = -1;
      this.targetSeekAnchor = null;
      this._lastBgTimeUpdatedAt = 0;
      this.lastBgSeekCmdAtMs = 0;
      this._bgIframeAcked = false;
      this._bgListeningTimer = null;
      this._bgListenersRegisteredGen = -1;
      this._liveFgStateGetter = null;
      this._boundBgMessageHandler = null;
      this._pauseGuardTimers = [];
      this._lastBgEndedLoopAt = 0;
    }

    _handleBgVideoEndedLoop(playerTarget = null) {
      if (this.isPlaybackPaused()) return;
      const now = Date.now();
      if (this._lastBgEndedLoopAt && now - this._lastBgEndedLoopAt < 700) return;
      this._lastBgEndedLoopAt = now;
      this.lastBgSeekCmdAtMs = now;
      this.lastKnownBgTime = 0;
      this._lastBgTimeUpdatedAt = now;
      if (playerTarget && typeof playerTarget.seekTo === 'function') {
        try {
          playerTarget.seekTo(0, true);
          playerTarget.playVideo?.();
          return;
        } catch (_err) {}
      }
      this.dispatchBgCommand('seekTo', [0, true]);
      this.dispatchBgCommand('playVideo', []);
    }

    setStateChangeListener(cb) {
      this._onPlayerStateCallback = typeof cb === 'function' ? cb : null;
    }

    isPlaybackPaused() {
      return this.desiredPlayState !== 'playing';
    }

    _syncPlayStateDomAttr() {
      const layer = global.document?.getElementById(MOD40_CONSTANTS.BG_LAYER_ID);
      if (layer) {
        layer.setAttribute('data-mod40-play-state', this.desiredPlayState || 'playing');
      }
      if (global.document?.body) {
        global.document.body.dataset.mod40BgPaused = this.isPlaybackPaused() ? 'true' : 'false';
      }
    }

    _clearPauseGuardTimers() {
      while (this._pauseGuardTimers.length > 0) {
        const tid = this._pauseGuardTimers.pop();
        global.clearTimeout(tid);
      }
    }

    _sendRawBgPostMessage(iframeEl, payloadObj) {
      if (!iframeEl || !iframeEl.contentWindow) return false;
      try {
        iframeEl.contentWindow.postMessage(JSON.stringify(payloadObj), '*');
        return true;
      } catch (_err) {
        return false;
      }
    }

    /**
     * Gửi lệnh điều khiển đồng thời qua `YT.Player` API và `postMessage` JSON bus
     * của riêng `#mod39-youtube-bg-iframe` để Pause/Play/Seek hoạt động trên cả
     * HTTP/HTTPS lẫn `file://` hoặc lúc API đang tải dở.
     */
    getAccurateBgTime() {
      const now = Date.now();
      let apiTime = null;
      try {
        if (this.ytPlayer && this.ytPlayerReady && typeof this.ytPlayer.getCurrentTime === 'function') {
          const t = Number(this.ytPlayer.getCurrentTime());
          if (Number.isFinite(t) && t >= 0) {
            apiTime = t;
          }
        }
      } catch (_err) {}

      if (apiTime !== null) {
        const justSeeked = this.lastBgSeekCmdAtMs && now - this.lastBgSeekCmdAtMs < 450;
        if (!(justSeeked && apiTime < 0.25 && this.lastKnownBgTime > 1.5)) {
          this.lastKnownBgTime = apiTime;
          this._lastBgTimeUpdatedAt = now;
          return Math.max(0, apiTime);
        }
      }

      let baseTime = Number(this.lastKnownBgTime) || 0;
      if (
        baseTime === 0 &&
        this.targetSeekAnchor &&
        this.targetSeekAnchor.videoId === this.activeVideoId &&
        !this._bgIframeAcked
      ) {
        return this._computeEffectiveAnchorTime(this.targetSeekAnchor);
      }

      if (!this.isPlaybackPaused() && this.lastKnownBgState === 1 && this._lastBgTimeUpdatedAt > 0) {
        const elapsedSec = Math.max(0, Math.min(45, (now - this._lastBgTimeUpdatedAt) / 1000));
        baseTime += elapsedSec * (Number(this.playbackRate) || 1);
      }
      return Math.max(0, baseTime);
    }

    _computeEffectiveAnchorTime(anchor) {
      if (!anchor || typeof anchor.timeSec !== 'number' || !Number.isFinite(anchor.timeSec)) {
        return 0;
      }
      let liveFg = null;
      try {
        if (typeof this._liveFgStateGetter === 'function') {
          liveFg = this._liveFgStateGetter();
        }
      } catch (_err) {}
      if (
        liveFg &&
        liveFg.videoId &&
        liveFg.videoId === anchor.videoId &&
        typeof liveFg.currentTime === 'number' &&
        Number.isFinite(liveFg.currentTime) &&
        liveFg.currentTime >= 0
      ) {
        return Math.max(0, liveFg.currentTime);
      }
      if (anchor.paused || this.isPlaybackPaused() || !anchor.setAtMs) {
        return Math.max(0, anchor.timeSec);
      }
      const elapsed = Math.max(0, Math.min(20, (Date.now() - anchor.setAtMs) / 1000));
      const rate = Number(anchor.rate || this.playbackRate || 1) || 1;
      return Math.max(0, anchor.timeSec + elapsed * rate);
    }

    _stopBgListeningHandshake() {
      if (this._bgListeningTimer) {
        try {
          global.clearInterval(this._bgListeningTimer);
        } catch (_err) {}
        this._bgListeningTimer = null;
      }
    }

    _registerBgIframeNativeListenersOnce(iframe, expectedGen) {
      if (!iframe || !iframe.contentWindow) return false;
      if (typeof expectedGen === 'number' && expectedGen !== this._mountGeneration) return false;
      if (this._bgListenersRegisteredGen === this._mountGeneration) return true;
      this._bgListenersRegisteredGen = this._mountGeneration;
      ['onReady', 'onStateChange', 'onPlaybackRateChange', 'onError'].forEach((evtName) => {
        this._sendRawBgPostMessage(iframe, {
          event: 'command',
          id: 2,
          channel: 'widget',
          func: 'addEventListener',
          args: [evtName],
        });
      });
      return true;
    }

    _startBgListeningHandshake(iframe, playerId = 2, expectedGen = this._mountGeneration) {
      this._stopBgListeningHandshake();
      if (!iframe || !iframe.contentWindow) return;
      const sendPulse = () => {
        if (expectedGen !== this._mountGeneration || !iframe.isConnected || !iframe.contentWindow) {
          this._stopBgListeningHandshake();
          return;
        }
        this._sendRawBgPostMessage(iframe, {
          event: 'listening',
          id: playerId,
          channel: 'widget',
        });
        this._registerBgIframeNativeListenersOnce(iframe, expectedGen);
      };
      sendPulse();
      let attempts = 0;
      this._bgListeningTimer = global.setInterval(() => {
        attempts += 1;
        if (
          this._bgIframeAcked ||
          attempts >= 24 ||
          expectedGen !== this._mountGeneration ||
          !iframe.isConnected
        ) {
          this._stopBgListeningHandshake();
          return;
        }
        sendPulse();
      }, 250);
    }

    _syncTargetSeekAnchorOnReady(bgIframe) {
      let liveFg = null;
      try {
        if (typeof this._liveFgStateGetter === 'function') {
          liveFg = this._liveFgStateGetter();
        }
      } catch (_err) {}

      if (
        liveFg &&
        liveFg.videoId &&
        this.activeVideoId &&
        liveFg.videoId === this.activeVideoId &&
        liveFg.paused &&
        !this.isPlaybackPaused()
      ) {
        this.pausePlayback('paused');
      }

      if (
        this.targetSeekAnchor &&
        (!this.activeVideoId || this.targetSeekAnchor.videoId === this.activeVideoId)
      ) {
        const anchorSec = this._computeEffectiveAnchorTime(this.targetSeekAnchor);
        const now = Date.now();
        const curBgTime = Number(this.lastKnownBgTime) || 0;
        const needReadySeek =
          (!this.targetSeekAnchor.appliedOnReady && anchorSec > 0.5) ||
          Math.abs(curBgTime - anchorSec) > 0.65;
        this.targetSeekAnchor.appliedOnReady = true;
        if (needReadySeek) {
          this.lastBgSeekCmdAtMs = now;
          this.lastKnownBgTime = anchorSec;
          this._lastBgTimeUpdatedAt = now;
          this.dispatchBgCommand('seekTo', [anchorSec, true]);
        }
      }

      if (this.isPlaybackPaused()) {
        this.dispatchBgCommand('pauseVideo', []);
      } else {
        this.syncAudioSettings();
        if (this.playbackRate && this.playbackRate !== 1) {
          this.dispatchBgCommand('setPlaybackRate', [this.playbackRate]);
        }
      }
      if (bgIframe) {
        this._registerBgIframeNativeListenersOnce(bgIframe, this._mountGeneration);
      }
    }

    dispatchBgCommand(funcName, args = []) {
      let apiDispatched = false;
      try {
        if (this.ytPlayer && this.ytPlayerReady && typeof this.ytPlayer[funcName] === 'function') {
          this.ytPlayer[funcName](...(Array.isArray(args) ? args : []));
          apiDispatched = true;
        }
      } catch (_err) {}

      let dispatched = apiDispatched;
      // Khi seekTo đã gọi trực tiếp qua YT.Player thành công thì không lặp lại postMessage seekTo
      // để tránh trình phát nền buffer 2 lần gây giật lệch nhịp; play/pause vẫn phát broadcast an toàn.
      if (!(funcName === 'seekTo' && apiDispatched)) {
        const bgIframe = global.document?.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
        if (bgIframe && bgIframe.contentWindow) {
          const okPm = this._sendRawBgPostMessage(bgIframe, {
            event: 'command',
            id: 2,
            channel: 'widget',
            func: funcName,
            args: Array.isArray(args) ? args : [],
          });
          dispatched = dispatched || okPm;
        }
      }
      return dispatched;
    }

    _ensureBgMessageBridgeAttached() {
      if (this._boundBgMessageHandler || typeof global.addEventListener !== 'function') return;
      this._boundBgMessageHandler = (event) => {
        if (!event || !event.data) return;
        const bgIframe = global.document?.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
        if (!bgIframe || !bgIframe.contentWindow || event.source !== bgIframe.contentWindow) {
          return;
        }
        const origin = String(event.origin || '');
        if (origin && !origin.includes('youtube.com') && !origin.includes('youtube-nocookie.com')) {
          return;
        }
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (_e) {
            return;
          }
        }
        if (!data || typeof data !== 'object') return;

        this._bgIframeAcked = true;
        this._stopBgListeningHandshake();
        this._registerBgIframeNativeListenersOnce(bgIframe, this._mountGeneration);

        if (data.event === 'infoDelivery' && data.info && typeof data.info === 'object') {
          const now = Date.now();
          if (typeof data.info.currentTime === 'number' && Number.isFinite(data.info.currentTime)) {
            const justSeeked = this.lastBgSeekCmdAtMs && now - this.lastBgSeekCmdAtMs < 350;
            if (!(justSeeked && data.info.currentTime < 0.25 && this.lastKnownBgTime > 1.5)) {
              this.lastKnownBgTime = data.info.currentTime;
              this._lastBgTimeUpdatedAt = now;
            }
          }
          if (
            typeof data.info.playbackRate === 'number' &&
            Number.isFinite(data.info.playbackRate) &&
            data.info.playbackRate > 0 &&
            this.playbackRate &&
            Math.abs(data.info.playbackRate - this.playbackRate) > 0.01
          ) {
            this.dispatchBgCommand('setPlaybackRate', [this.playbackRate]);
          }
          if (typeof data.info.playerState === 'number') {
            this.lastKnownBgState = data.info.playerState;
            // Nếu trình phát chính đang tạm dừng mà iframe nền tự chạy lại (do vừa buffer xong hoặc sau seek): ép dừng ngay!
            if (this.isPlaybackPaused() && data.info.playerState === 1) {
              this.dispatchBgCommand('pauseVideo', []);
            } else if (!this.isPlaybackPaused() && data.info.playerState === 0) {
              this._handleBgVideoEndedLoop();
            }
          }
        } else if (data.event === 'onStateChange' && typeof data.info === 'number') {
          this.lastKnownBgState = data.info;
          if (this.isPlaybackPaused() && data.info === 1) {
            this.dispatchBgCommand('pauseVideo', []);
          } else if (!this.isPlaybackPaused() && data.info === 0) {
            this._handleBgVideoEndedLoop();
          } else if (
            !this.isPlaybackPaused() &&
            data.info === 1 &&
            this.targetSeekAnchor &&
            !this.targetSeekAnchor.appliedOnReady &&
            this.targetSeekAnchor.videoId === this.activeVideoId
          ) {
            const anchorSec = this._computeEffectiveAnchorTime(this.targetSeekAnchor);
            const justSeeked = this.lastBgSeekCmdAtMs && Date.now() - this.lastBgSeekCmdAtMs < 450;
            if (!justSeeked && Math.abs(this.getAccurateBgTime() - anchorSec) > 0.85) {
              this.lastBgSeekCmdAtMs = Date.now();
              this.lastKnownBgTime = anchorSec;
              this._lastBgTimeUpdatedAt = Date.now();
              this.dispatchBgCommand('seekTo', [anchorSec, true]);
            }
            this.targetSeekAnchor.appliedOnReady = true;
          }
        } else if (data.event === 'onPlaybackRateChange' && typeof data.info === 'number') {
          if (this.playbackRate && Math.abs(data.info - this.playbackRate) > 0.01) {
            this.dispatchBgCommand('setPlaybackRate', [this.playbackRate]);
          }
        } else if (data.event === 'initialDelivery' || data.event === 'onReady') {
          if (data.info && typeof data.info === 'object') {
            if (typeof data.info.currentTime === 'number' && Number.isFinite(data.info.currentTime)) {
              this.lastKnownBgTime = data.info.currentTime;
              this._lastBgTimeUpdatedAt = Date.now();
            }
            if (typeof data.info.playerState === 'number') {
              this.lastKnownBgState = data.info.playerState;
            }
          }
          this._syncTargetSeekAnchorOnReady(bgIframe);
        } else if (data.event === 'onError' && typeof data.info === 'number') {
          const srcNow = String(bgIframe.getAttribute('src') || '');
          if (!this.activeVideoId || !srcNow || srcNow === 'about:blank' || srcNow.indexOf('youtube') === -1) {
            return;
          }
          this.diag.log('BG_YT_ERROR', `Mã lỗi YT nền #${data.info}. Video có thể bị chặn nhúng.`);
          if (this._onPlayerStateCallback) {
            this._onPlayerStateCallback({ type: 'error', code: data.info });
          }
        }
      };
      global.addEventListener('message', this._boundBgMessageHandler);
    }

    pausePlayback(mode = 'paused') {
      const safeMode =
        mode === 'error-paused' || mode === 'stopped' ? mode : 'paused';
      const curTime = this.getAccurateBgTime();
      const now = Date.now();
      this.desiredPlayState = safeMode;
      this.lastKnownBgState = 2;
      this._lastBgTimeUpdatedAt = now;
      if (this.activeVideoId) {
        if (
          this.targetSeekAnchor &&
          this.targetSeekAnchor.videoId === this.activeVideoId &&
          !this._bgIframeAcked &&
          curTime < 0.25 &&
          Number(this.targetSeekAnchor.timeSec) > 0
        ) {
          this.targetSeekAnchor.paused = true;
          this.targetSeekAnchor.setAtMs = now;
        } else {
          this.targetSeekAnchor = {
            videoId: this.activeVideoId,
            timeSec: curTime,
            paused: true,
            setAtMs: now,
            appliedOnReady: Boolean(this.targetSeekAnchor && this.targetSeekAnchor.appliedOnReady),
          };
        }
      }
      this._clearPauseGuardTimers();
      this._syncPlayStateDomAttr();

      const pausedCmd = this.dispatchBgCommand('pauseVideo', []);
      // Gửi nhắc lại đa tầng đề phòng YouTube iframe vừa load dở ở frame đầu tiên rồi mới buffer xong
      const genAtPause = this._mountGeneration;
      [120, 350, 750, 1400, 2300].forEach((delayMs) => {
        const tid = global.setTimeout(() => {
          if (genAtPause !== this._mountGeneration || !this.isPlaybackPaused()) return;
          this.dispatchBgCommand('pauseVideo', []);
        }, delayMs);
        this._pauseGuardTimers.push(tid);
      });
      return pausedCmd;
    }

    playPlayback() {
      const state = this.vault.getState();
      if (!state.enabled) return false;
      const curAccTime = this.getAccurateBgTime();
      const now = Date.now();
      this.desiredPlayState = 'playing';
      this.lastKnownBgState = 1;
      this._lastBgTimeUpdatedAt = now;
      this._clearPauseGuardTimers();
      this._syncPlayStateDomAttr();
      this.syncAudioSettings();

      if (this.targetSeekAnchor && this.targetSeekAnchor.videoId === this.activeVideoId) {
        const anchorSec = Number(this.targetSeekAnchor.timeSec) || 0;
        this.targetSeekAnchor.paused = false;
        this.targetSeekAnchor.setAtMs = now;
        if (anchorSec > 0 && Math.abs(curAccTime - anchorSec) > 0.75) {
          this.lastBgSeekCmdAtMs = now;
          this.lastKnownBgTime = anchorSec;
          this._lastBgTimeUpdatedAt = now;
          this.dispatchBgCommand('seekTo', [anchorSec, true]);
        }
      }

      const ok = this.dispatchBgCommand('playVideo', []);
      if (this.playbackRate && this.playbackRate !== 1) {
        this.dispatchBgCommand('setPlaybackRate', [this.playbackRate]);
      }
      return ok;
    }

    seekToSeconds(seconds, allowAhead = true) {
      const target = Math.max(0, Number(seconds) || 0);
      const now = Date.now();
      const wasPaused = this.isPlaybackPaused();
      this.lastKnownBgTime = target;
      this._lastBgTimeUpdatedAt = now;
      this.lastBgSeekCmdAtMs = now;
      this.targetSeekAnchor = {
        videoId: this.activeVideoId || '',
        timeSec: target,
        paused: wasPaused,
        setAtMs: now,
        appliedOnReady: Boolean(this._bgIframeAcked || this.ytPlayerReady),
      };
      const ok = this.dispatchBgCommand('seekTo', [target, Boolean(allowAhead)]);
      if (wasPaused) {
        this._clearPauseGuardTimers();
        this.dispatchBgCommand('pauseVideo', []);
        // Bảo vệ nhiều nhịp sau seekTo khi đang Pause vì seekTo của YouTube dễ tự kích hoạt phát lại sau buffer
        const genAtSeek = this._mountGeneration;
        [120, 350, 750].forEach((delayMs) => {
          const tid = global.setTimeout(() => {
            if (genAtSeek !== this._mountGeneration || !this.isPlaybackPaused()) return;
            this.dispatchBgCommand('pauseVideo', []);
          }, delayMs);
          this._pauseGuardTimers.push(tid);
        });
      }
      return ok;
    }

    setPlaybackRate(rate) {
      const cleanRate = Number.isFinite(Number(rate)) && Number(rate) > 0 ? Number(rate) : 1;
      this.playbackRate = cleanRate;
      return this.dispatchBgCommand('setPlaybackRate', [cleanRate]);
    }

    ensureYouTubeApiLoaded(onReadyCb) {
      if (!Mod40Utils.isHttpOrigin()) return;

      if (global.YT && typeof global.YT.Player === 'function') {
        if (typeof onReadyCb === 'function') onReadyCb();
        return;
      }

      // Hook nhẹ vào onYouTubeIframeAPIReady để không ghi đè callback của Mod 39
      if (!global.__mod40YtReadyHooked) {
        global.__mod40YtReadyHooked = true;
        const prevHandler = global.onYouTubeIframeAPIReady;
        global.onYouTubeIframeAPIReady = () => {
          try {
            if (typeof prevHandler === 'function') prevHandler();
          } catch (_err) {}
          global.dispatchEvent(new global.CustomEvent('mod40:yt-api-ready'));
        };
      }

      if (typeof onReadyCb === 'function') {
        const onceHandler = () => {
          global.removeEventListener('mod40:yt-api-ready', onceHandler);
          onReadyCb();
        };
        global.addEventListener('mod40:yt-api-ready', onceHandler);
      }

      const existingScript = global.document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript && !this._apiScriptInjected) {
        this._apiScriptInjected = true;
        const script = global.document.createElement('script');
        script.src = MOD40_CONSTANTS.YOUTUBE_IFRAME_API_URL;
        script.async = true;
        const firstScript = global.document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          global.document.head.appendChild(script);
        }
      }

      if (!this._apiPollingTimer) {
        let attempts = 0;
        this._apiPollingTimer = global.setInterval(() => {
          attempts += 1;
          if (global.YT && typeof global.YT.Player === 'function') {
            global.clearInterval(this._apiPollingTimer);
            this._apiPollingTimer = null;
            global.dispatchEvent(new global.CustomEvent('mod40:yt-api-ready'));
          } else if (attempts > 40) {
            global.clearInterval(this._apiPollingTimer);
            this._apiPollingTimer = null;
          }
        }, 250);
      }
    }

    mountVideo(videoId, playlistId, startSeconds = 0) {
      const safeVid = Mod40Utils.extractVideoIdFromInput(videoId);
      const safeList = safeVid ? '' : String(playlistId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safeVid && !safeList) {
        this.teardownPlayer();
        return false;
      }

      const targetStart = Math.max(0, Number(startSeconds) || 0);
      const now = Date.now();
      const mountGen = ++this._mountGeneration;
      this._ensureBgMessageBridgeAttached();
      this._bindVisibilityResumeOnce();
      const shouldAutoplay = this.desiredPlayState === 'playing';
      const embedUrl = Mod40Utils.buildNoCookieBgEmbedUrl(safeVid, safeList, targetStart, {
        autoplay: shouldAutoplay,
      });
      if (!embedUrl) return false;

      const isSameVideo =
        Boolean(this.activeVideoId) &&
        this.activeVideoId === safeVid &&
        this.activePlaylistId === safeList;
      const currentNode = global.document.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
      const currentSrc = currentNode ? String(currentNode.getAttribute('src') || '') : '';

      // Nếu đúng video đang gắn sẵn trên iframe hợp lệ thì đồng bộ đúng trạng thái Play/Pause và mốc thời gian hiện tại
      if (
        isSameVideo &&
        currentNode &&
        currentNode.tagName &&
        currentNode.tagName.toUpperCase() === 'IFRAME' &&
        safeVid &&
        currentSrc.includes(safeVid)
      ) {
        this.syncAudioSettings();
        this.compositor.updateCoverGeometry();
        this._syncPlayStateDomAttr();
        if (targetStart > 0 && Math.abs(this.getAccurateBgTime() - targetStart) > 0.75) {
          this.seekToSeconds(targetStart, true);
        }
        if (this.isPlaybackPaused()) {
          this.pausePlayback(this.desiredPlayState);
        } else {
          this.playPlayback();
        }
        return true;
      }

      // Khi chuyển sang video mới: hủy instance YT.Player cũ và tái tạo hoàn toàn <iframe> mới
      // (forceRecreate = true) để xóa sạch buffer khung hình video cũ.
      this._clearPauseGuardTimers();
      this._stopBgListeningHandshake();
      this._safeDestroyYtInstanceOnly();

      const iframe = this.compositor.ensureBgIframeElement(true);
      this.activeVideoId = safeVid;
      this.activePlaylistId = safeList;
      this._bgIframeAcked = false;
      this._bgListenersRegisteredGen = -1;
      this._lastBgTimeUpdatedAt = now;
      this.lastKnownBgTime = targetStart;
      this.lastKnownBgState = shouldAutoplay ? 1 : 2;
      this.targetSeekAnchor = {
        videoId: safeVid || safeList,
        timeSec: targetStart,
        paused: !shouldAutoplay,
        setAtMs: now,
        rate: Number(this.playbackRate) || 1,
        appliedOnReady: false,
      };
      this._syncPlayStateDomAttr();
      iframe.onload = () => {
        if (mountGen !== this._mountGeneration) return;
        this._startBgListeningHandshake(iframe, 2, mountGen);
        if (this.isPlaybackPaused()) {
          this.dispatchBgCommand('pauseVideo', []);
        }
      };
      iframe.setAttribute('src', embedUrl);
      this.compositor.updateCoverGeometry();
      this.compositor.applyVisualCssVariables();

      this.diag.log('BG_IFRAME_MOUNTED', `Đã gắn nền video mới ${safeVid || safeList} (gen=${mountGen}, start=${Math.round(targetStart)}s).`);

      if (Mod40Utils.isHttpOrigin()) {
        this.ensureYouTubeApiLoaded(() => {
          if (mountGen !== this._mountGeneration) return;
          const liveState = this.vault.getState();
          if (!liveState.enabled) return;
          const liveVid = Mod40Utils.extractVideoIdFromInput(liveState.videoId || liveState.watchUrl || '');
          if (safeVid && liveVid !== safeVid) return;
          this._attachYtPlayerOnIframe(safeVid, safeList, mountGen);
        });
      }
      return true;
    }

    _attachYtPlayerOnIframe(expectedVid, expectedList, mountGen) {
      if (!(global.YT && typeof global.YT.Player === 'function')) return;
      if (typeof mountGen === 'number' && mountGen !== this._mountGeneration) return;
      const iframe = global.document.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
      const srcNow = iframe ? String(iframe.getAttribute('src') || '') : '';
      if (!iframe || !iframe.tagName || iframe.tagName.toUpperCase() !== 'IFRAME' || !srcNow || srcNow === 'about:blank' || srcNow.indexOf('youtube') === -1) {
        return;
      }

      try {
        this._safeDestroyYtInstanceOnly();
        const iframeReverified = this.compositor.ensureBgIframeElement(false);
        this.ytPlayerReady = false;
        this.ytPlayer = new global.YT.Player(iframeReverified.id, {
          host: 'https://www.youtube-nocookie.com',
          events: {
            onReady: (evt) => {
              if (typeof mountGen === 'number' && mountGen !== this._mountGeneration) return;
              this.ytPlayerReady = true;
              const liveState = this.vault.getState();
              if (!liveState.enabled) return;
              let liveFg = null;
              try {
                if (typeof this._liveFgStateGetter === 'function') {
                  liveFg = this._liveFgStateGetter();
                }
              } catch (_err) {}
              if (
                liveFg &&
                liveFg.videoId &&
                expectedVid &&
                liveFg.videoId === expectedVid &&
                liveFg.paused &&
                !this.isPlaybackPaused()
              ) {
                this.pausePlayback('paused');
              }

              try {
                this.syncAudioSettings(evt.target);
                if (
                  this.targetSeekAnchor &&
                  (!expectedVid || this.targetSeekAnchor.videoId === expectedVid)
                ) {
                  const anchorSec = this._computeEffectiveAnchorTime(this.targetSeekAnchor);
                  let curApiTime = 0;
                  try {
                    const t = Number(evt.target.getCurrentTime?.());
                    if (Number.isFinite(t) && t >= 0) curApiTime = t;
                  } catch (_e) {}
                  const needReadySeek =
                    (!this.targetSeekAnchor.appliedOnReady && anchorSec > 0.5) ||
                    (anchorSec > 0.5 && Math.abs(curApiTime - anchorSec) > 0.75);
                  this.targetSeekAnchor.appliedOnReady = true;
                  if (needReadySeek) {
                    const seekNow = Date.now();
                    this.lastBgSeekCmdAtMs = seekNow;
                    this.lastKnownBgTime = anchorSec;
                    this._lastBgTimeUpdatedAt = seekNow;
                    evt.target.seekTo?.(anchorSec, true);
                  }
                }

                if (this.isPlaybackPaused()) {
                  evt.target.pauseVideo?.();
                  this.lastKnownBgState = 2;
                  this._lastBgTimeUpdatedAt = Date.now();
                } else {
                  if (this.playbackRate && this.playbackRate !== 1 && typeof evt.target.setPlaybackRate === 'function') {
                    evt.target.setPlaybackRate(this.playbackRate);
                  }
                  evt.target.playVideo();
                  this.lastKnownBgState = 1;
                  this._lastBgTimeUpdatedAt = Date.now();
                }
              } catch (_err) {}
              this.compositor.updateCoverGeometry();
              this._syncPlayStateDomAttr();
              this.diag.log('BG_YT_READY', `YT.Player nền sẵn sàng (${expectedVid || expectedList}, gen=${mountGen}).`);
              if (this._onPlayerStateCallback) this._onPlayerStateCallback({ type: 'ready' });
            },
            onStateChange: (evt) => {
              if (typeof mountGen === 'number' && mountGen !== this._mountGeneration) return;
              const YTState = global.YT && global.YT.PlayerState;
              if (!YTState) return;
              this.lastKnownBgState = evt.data;
              try {
                const curT = Number(evt.target?.getCurrentTime?.());
                const justSeeked = this.lastBgSeekCmdAtMs && Date.now() - this.lastBgSeekCmdAtMs < 400;
                if (Number.isFinite(curT) && curT >= 0 && !(justSeeked && curT < 0.25 && this.lastKnownBgTime > 1.5)) {
                  this.lastKnownBgTime = curT;
                  this._lastBgTimeUpdatedAt = Date.now();
                }
              } catch (_e) {}
              if (evt.data === YTState.ENDED) {
                this._handleBgVideoEndedLoop(evt.target);
              } else if (evt.data === YTState.PLAYING) {
                if (this.isPlaybackPaused()) {
                  try {
                    evt.target.pauseVideo?.();
                  } catch (_err) {}
                  return;
                }
                if (this.playbackRate && this.playbackRate !== 1 && typeof evt.target?.setPlaybackRate === 'function') {
                  try {
                    evt.target.setPlaybackRate(this.playbackRate);
                  } catch (_err) {}
                }
                this.syncAudioSettings(evt.target);
                if (this._onPlayerStateCallback) this._onPlayerStateCallback({ type: 'playing' });
              } else if (evt.data === YTState.PAUSED) {
                if (this._onPlayerStateCallback) this._onPlayerStateCallback({ type: 'paused' });
              }
            },
            onPlaybackRateChange: (evt) => {
              if (typeof mountGen === 'number' && mountGen !== this._mountGeneration) return;
              if (
                this.playbackRate &&
                typeof evt?.data === 'number' &&
                Number.isFinite(evt.data) &&
                Math.abs(evt.data - this.playbackRate) > 0.01
              ) {
                try {
                  evt.target?.setPlaybackRate?.(this.playbackRate);
                } catch (_err) {}
              }
            },
            onError: (evt) => {
              if (typeof mountGen === 'number' && mountGen !== this._mountGeneration) return;
              const liveBgEl = global.document.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
              const liveBgSrc = liveBgEl ? String(liveBgEl.getAttribute('src') || '') : '';
              if (!this.activeVideoId || !liveBgSrc || liveBgSrc === 'about:blank' || liveBgSrc.indexOf('youtube') === -1) return;
              this.diag.log('BG_YT_ERROR', `Mã lỗi YT nền #${evt?.data}. Video có thể bị chặn nhúng.`);
              if (this._onPlayerStateCallback) this._onPlayerStateCallback({ type: 'error', code: evt?.data });
            },
          },
        });
      } catch (err) {
        this.diag.log('BG_YT_ATTACH_ERR', `Không thể khởi tạo YT.Player nền: ${err?.message || err}`);
      }
    }

    syncAudioSettings(playerOverride = null) {
      const player = playerOverride || this.ytPlayer;
      const state = this.vault.getState();
      const targetVol = Mod40Utils.clampNumber(state.bgVolume, 0, 100, 45);
      if (!player) return;

      try {
        const mod21BridgeActive = NS.youtubeStudio?.playerCtrl?.activeEngine === 'MOD21_AUDIO';
        if (state.allowBgSound && targetVol > 0 && !mod21BridgeActive) {
          if (typeof player.unMute === 'function') player.unMute();
          if (typeof player.setVolume === 'function') player.setVolume(targetVol);
        } else {
          if (typeof player.mute === 'function') player.mute();
        }
      } catch (_err) {
        // Tránh throw khi player đang chuyển trạng thái buffering
      }
    }

    nudgePlayIfSuspended() {
      const state = this.vault.getState();
      if (!state.enabled || this.isPlaybackPaused()) return;
      try {
        if (this.ytPlayer && this.ytPlayerReady && typeof this.ytPlayer.playVideo === 'function') {
          this.ytPlayer.playVideo();
        }
      } catch (_err) {}
    }

    _bindVisibilityResumeOnce() {
      if (this._visibilityBound) return;
      this._visibilityBound = true;
      global.document.addEventListener('visibilitychange', () => {
        if (global.document.visibilityState === 'visible') {
          this.nudgePlayIfSuspended();
        }
      });
    }

    _safeDestroyYtInstanceOnly() {
      this.ytPlayerReady = false;
      if (this.ytPlayer) {
        try {
          if (typeof this.ytPlayer.destroy === 'function') {
            this.ytPlayer.destroy();
          }
        } catch (_err) {}
        this.ytPlayer = null;
      }
    }

    teardownPlayer() {
      this._mountGeneration += 1;
      this._clearPauseGuardTimers();
      this._stopBgListeningHandshake();
      this._safeDestroyYtInstanceOnly();
      this.activeVideoId = '';
      this.activePlaylistId = '';
      this.lastKnownBgTime = 0;
      this.lastKnownBgState = -1;
      this.targetSeekAnchor = null;
      this._lastBgTimeUpdatedAt = 0;
      this.lastBgSeekCmdAtMs = 0;
      this._bgIframeAcked = false;
      this._bgListenersRegisteredGen = -1;
      this.desiredPlayState = 'playing';
      this._syncPlayStateDomAttr();
      this.compositor.clearBgIframeElement();
    }
  }

  /**
   * Bộ ghi nhật ký vòng chuẩn đoán hoạt động của Nền Video Chuyển Động.
   * Lưu tối đa 60 sự kiện gần nhất phục vụ kiểm tra trạng thái khi cần.
   */
  class Mod40DiagnosticRingLogger {
    constructor(maxEntries = 60) {
      this.maxEntries = Math.max(10, Number(maxEntries) || 60);
      this.entries = [];
    }

    log(code, message, meta = null) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      this.entries.unshift({
        time: timeStr,
        timestamp: now.getTime(),
        code: String(code || 'EVENT').toUpperCase(),
        message: String(message || ''),
        meta: meta && typeof meta === 'object' ? { ...meta } : null,
      });
      if (this.entries.length > this.maxEntries) {
        this.entries.length = this.maxEntries;
      }
    }

    getRecentLogs(limit = 15) {
      const n = Math.max(1, Math.min(this.maxEntries, Number(limit) || 15));
      return this.entries.slice(0, n).map((item) => ({ ...item }));
    }

    clear() {
      this.entries.length = 0;
    }

    buildSummaryHtml(limit = 6) {
      const recent = this.getRecentLogs(limit);
      if (!recent.length) {
        return '<div class="text-[11px] text-zinc-500">Chưa có sự kiện điều phối nền nào trong phiên làm việc này.</div>';
      }
      return recent
        .map(
          (row) =>
            `<div class="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5 py-1 border-b border-zinc-800/60 last:border-b-0 text-[11px] min-w-0">` +
            `<span class="font-mono text-rose-300 shrink-0">[${Mod40Utils.escapeHtml(row.code)}]</span>` +
            `<span class="text-zinc-300 flex-1 min-w-0 break-all sm:break-words">${Mod40Utils.escapeHtml(row.message)}</span>` +
            `<span class="font-mono text-zinc-500 shrink-0">${Mod40Utils.escapeHtml(row.time)}</span>` +
            `</div>`
        )
        .join('');
    }
  }

  /**
   * Bộ điều khiển làm mịn & chống giật khi kéo nhanh các thanh trượt
   * (Opacity, Blur, Brightness, Darkness Veil, Contrast, UI Glass, Volume).
   * Cập nhật CSS ngay lập tức trong khung animation hiện tại và trì hoãn
   * ghi `localStorage` để không gây khựng gõ phím trên thiết bị cấu hình yếu.
   */
  class Mod40SmartFadeTransitionController {
    constructor(vault, compositor) {
      this.vault = vault;
      this.compositor = compositor;
      this._persistTimer = null;
      this._rafHandle = null;
    }

    scheduleCssAndSave(patchObj, immediatePersist = false) {
      if (patchObj && typeof patchObj === 'object') {
        const current = this.vault.getState();
        const candidate = Object.assign({}, current, patchObj);
        const signature = Mod40Utils.computePresetSignature(candidate);
        this.vault.patchState(
          Object.assign({}, patchObj, {
            lastPresetId: signature,
          }),
          false
        );
      }

      this.compositor.applyVisualCssVariables();

      if (immediatePersist) {
        if (this._persistTimer) {
          global.clearTimeout(this._persistTimer);
          this._persistTimer = null;
        }
        this.vault.save();
        return;
      }

      if (this._persistTimer) {
        global.clearTimeout(this._persistTimer);
      }
      this._persistTimer = global.setTimeout(() => {
        this._persistTimer = null;
        this.vault.save();
      }, 160);
    }

    evaluateReadabilityAdvice(state) {
      const s = state || this.vault.getState();
      if (!s.enabled) {
        return {
          level: 'idle',
          text: 'Chưa bật nền YouTube. Khi bật, video sẽ tự phủ toàn trang 16:9 dưới lớp kính chữ ở mọi Tab.',
        };
      }
      if (s.brightnessPct >= 145 && s.darknessPct <= 10) {
        return {
          level: 'warn',
          text: 'Độ sáng video đang cao và lớp phủ tối rất thấp — nên kéo "Độ tối phủ nền" lên 20%–40% để chữ luôn dễ đọc.',
        };
      }
      if (s.uiGlassPct >= 90 && s.darknessPct <= 15 && s.blurPx <= 1) {
        return {
          level: 'warn',
          text: 'Thẻ chữ đang rất trong suốt trên video rõ nét — có thể tăng nhẹ "Độ nhòe" (4–8px) nếu thấy rối mắt.',
        };
      }
      if (s.darknessPct >= 75 && s.opacityPct <= 35) {
        return {
          level: 'tip',
          text: 'Nền đang khá tối và mờ — hãy kéo "Độ rõ video" lên ~80% để cảm nhận chuyển động khung cảnh tốt hơn.',
        };
      }
      return {
        level: 'ok',
        text: 'Tỷ lệ tương phản nền & lớp kính chữ đang cân bằng, hiển thị mượt trên cả 6 Tab.',
      };
    }
  }

  /**
   * Trình dựng giao diện Điều Khiển Nền Video Chuyển Động tại:
   *  1. Tab 5 — Ô Lớn #5 (`#mod40-bg-controls-mount`)
   *  2. Tab 5 — Ô Lớn #4 (`#mod40-box4-priority-banner`) để cảnh báo rõ ràng
   *     khi nền YouTube đang giữ quyền ưu tiên trên toàn trang
   *  3. Pill điều khiển nổi gọn nhẹ góc màn hình (`#mod40-floating-bg-pill`)
   *     khi người dùng muốn chỉnh nhanh ở Tab 1..4 mà không phải chuyển về Tab 5.
   */
  class Mod40Tab5ControlsAndBox4BridgeRenderer {
    constructor(facade, vault, diagLogger, transitionCtrl) {
      this.facade = facade;
      this.vault = vault;
      this.diag = diagLogger;
      this.transitionCtrl = transitionCtrl;
      this._boundRootEl = null;
      this._box4ListenerBound = false;
    }

    mountInto(containerEl = null) {
      const target =
        containerEl || global.document.getElementById(MOD40_CONSTANTS.CONTROLS_MOUNT_ID);
      if (!target) return false;

      if (this._boundRootEl !== target || !target.querySelector('#slider-mod40-bg-darkness')) {
        target.innerHTML = this._buildControlsCardHtml();
        this._boundRootEl = target;
        this._bindControlsEvents(target);
      }

      this.syncControlsUi();
      this.syncBox4PriorityBanner();
      this.syncFloatingPill();
      return true;
    }

    _buildControlsCardHtml() {
      const L = MOD40_CONSTANTS.LIMITS;
      const s = this.vault.getState();

      const presetButtonsHtml = MOD40_CONSTANTS.PRESETS.map((preset) => {
        return (
          `<button type="button" id="${this._getPresetBtnId(preset.id)}" ` +
          `data-mod40-preset="${Mod40Utils.escapeHtml(preset.id)}" ` +
          `title="${Mod40Utils.escapeHtml(preset.description)}" ` +
          `class="px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition text-left ` +
          `bg-zinc-900/70 border-zinc-700/80 text-zinc-200 hover:border-rose-400/70 hover:bg-rose-950/35">` +
          `${Mod40Utils.escapeHtml(preset.label)}` +
          `</button>`
        );
      }).join('');

      return `
        <div id="mod40-motion-bg-control-card" class="rounded-2xl border border-rose-500/35 bg-studioLightPanel dark:bg-zinc-950/75 p-3.5 sm:p-4 space-y-3.5 shadow-lg">
          <!-- Tiêu đề + Trạng thái ưu tiên -->
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="space-y-0.5 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h4 class="text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-1.5">
                  <span>🌌</span>
                  <span>Nền Web Video Chuyển Động 16:9</span>
                </h4>
                <span id="mod40-bg-live-status-badge" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-zinc-700 bg-zinc-900 text-zinc-300">
                  Đang tắt
                </span>
              </div>
              <p id="mod40-bg-video-title-preview" class="text-[11px] text-zinc-400 truncate">
                Chọn bất kỳ video nào ở khung bên trái để tự động phát làm nền toàn trang.
              </p>
            </div>
          </div>

          <!-- Hàng nút hành động chính -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button type="button" id="btn-mod39-set-web-bg"
              class="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5">
              <span>🎬</span>
              <span>Cài Video Này Làm Nền</span>
            </button>
            <button type="button" id="btn-mod39-peek-bg"
              class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/70 text-zinc-100 font-semibold text-xs transition flex items-center justify-center gap-1.5">
              <span>👁️</span>
              <span>Soi Nền Toàn Trang</span>
            </button>
            <button type="button" id="btn-mod39-clear-web-bg"
              class="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-xs transition flex items-center justify-center gap-1.5">
              <span>🧹</span>
              <span>Tắt Nền YouTube</span>
            </button>
          </div>

          <!-- Thanh Thu gọn / Mở rộng Căn chỉnh Crop, Preset & 6 Thanh Trượt Nền -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
            <span class="text-[11px] font-extrabold text-zinc-300">🎛️ Căn Chỉnh Crop, Preset &amp; 6 Thanh Trượt Nền</span>
            <button type="button" id="btn-mod40-toggle-bg-advanced"
              class="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-[10.5px] font-bold text-zinc-200 transition shrink-0">
              ▼ Mở rộng
            </button>
          </div>

          <div id="mod40-bg-advanced-body" class="hidden space-y-3.5">
          <!-- Hàng căn chỉnh / Crop khung hình nền YouTube tùy chỉnh -->
          <div class="rounded-xl border border-amber-500/25 bg-zinc-900/65 px-3 py-2.5 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                <span>✂️</span>
                <span>Căn chỉnh / Crop khung hình nền tùy chỉnh</span>
              </span>
              <span id="mod40-crop-status-badge"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-700 bg-zinc-950 text-zinc-300">
                Toàn khung 16:9 (Mặc định)
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" id="btn-mod40-open-crop-modal"
                class="px-3 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5">
                <span>📐</span>
                <span>Căn chỉnh / Crop vùng nền</span>
              </button>
              <button type="button" id="btn-mod40-reset-crop"
                class="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-xs transition flex items-center justify-center gap-1.5">
                <span>↺</span>
                <span>Đặt lại toàn nền 16:9</span>
              </button>
            </div>
          </div>

          <!-- 4 Preset 1 chạm -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Chế độ phối nền nhanh (1 chạm)</span>
              <span id="mod40-active-preset-label" class="text-[11px] font-mono text-rose-300">Tùy chỉnh</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${presetButtonsHtml}
            </div>
          </div>

          <!-- Bộ 6 thanh trượt tinh chỉnh quang học & xuyên thấu -->
          <div class="space-y-2.5 pt-1 border-t border-zinc-800/80">
            <!-- Độ rõ / Opacity -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <label for="slider-mod39-bg-opacity" class="font-semibold text-zinc-200">🌫️ Độ rõ video nền (Opacity)</label>
                <span id="mod39-val-bg-opacity" class="font-mono text-rose-300">${s.opacityPct}%</span>
              </div>
              <input type="range" id="slider-mod39-bg-opacity" min="${L.opacityPct.min}" max="${L.opacityPct.max}" value="${s.opacityPct}"
                class="w-full accent-rose-500 cursor-pointer" />
            </div>

            <!-- Độ nhòe Blur -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <label for="slider-mod39-bg-blur" class="font-semibold text-zinc-200">🫧 Độ mờ nhòe video (Blur)</label>
                <span id="mod39-val-bg-blur" class="font-mono text-rose-300">${s.blurPx}px</span>
              </div>
              <input type="range" id="slider-mod39-bg-blur" min="${L.blurPx.min}" max="${L.blurPx.max}" value="${s.blurPx}"
                class="w-full accent-rose-500 cursor-pointer" />
            </div>

            <!-- Độ sáng video -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <label for="slider-mod39-bg-brightness" class="font-semibold text-zinc-200">☀️ Độ sáng khung hình (Brightness)</label>
                <span id="mod39-val-bg-brightness" class="font-mono text-amber-300">${s.brightnessPct}%</span>
              </div>
              <input type="range" id="slider-mod39-bg-brightness" min="${L.brightnessPct.min}" max="${L.brightnessPct.max}" value="${s.brightnessPct}"
                class="w-full accent-amber-400 cursor-pointer" />
            </div>

            <!-- Độ tối màn phủ dịu mắt (Darkness Veil) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <label for="slider-mod40-bg-darkness" class="font-semibold text-zinc-200">🌑 Độ tối lớp phủ dịu mắt (Darkness)</label>
                <span id="mod40-val-darkness" class="font-mono text-indigo-300">${s.darknessPct}%</span>
              </div>
              <input type="range" id="slider-mod40-bg-darkness" min="${L.darknessPct.min}" max="${L.darknessPct.max}" value="${s.darknessPct}"
                class="w-full accent-indigo-400 cursor-pointer" />
            </div>

            <!-- Độ tương phản -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <label for="slider-mod40-bg-contrast" class="font-semibold text-zinc-200">🎞️ Độ tương phản dịu nét (Contrast)</label>
                <span id="mod40-val-contrast" class="font-mono text-sky-300">${s.contrastPct}%</span>
              </div>
              <input type="range" id="slider-mod40-bg-contrast" min="${L.contrastPct.min}" max="${L.contrastPct.max}" value="${s.contrastPct}"
                class="w-full accent-sky-400 cursor-pointer" />
            </div>

            <!-- Độ xuyên thấu thẻ chữ -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <label for="slider-mod39-ui-glass" class="font-semibold text-zinc-200">🪟 Độ xuyên thấu thẻ chữ (Glass UI)</label>
                <span id="mod39-val-ui-glass" class="font-mono text-emerald-300">${s.uiGlassPct}%</span>
              </div>
              <input type="range" id="slider-mod39-ui-glass" min="${L.uiGlassPct.min}" max="${L.uiGlassPct.max}" value="${s.uiGlassPct}"
                class="w-full accent-emerald-400 cursor-pointer" />
            </div>
          </div>

          <!-- Âm thanh nền + Nút mini pill -->
          <div class="pt-2 border-t border-zinc-800/80 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <label for="toggle-mod39-bg-sound" class="inline-flex items-center gap-2 text-xs font-semibold text-zinc-200 cursor-pointer select-none">
                <input type="checkbox" id="toggle-mod39-bg-sound" ${s.allowBgSound ? 'checked' : ''}
                  class="w-4 h-4 accent-rose-500 rounded cursor-pointer" />
                <span>🔊 Phát âm thanh từ nền YouTube</span>
              </label>

              <label for="toggle-mod40-floating-pill" class="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 cursor-pointer select-none">
                <input type="checkbox" id="toggle-mod40-floating-pill" ${s.showFloatingPill ? 'checked' : ''}
                  class="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer" />
                <span>📌 Hiện pill chỉnh nhanh</span>
              </label>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <label for="slider-mod40-bg-volume" class="font-semibold text-zinc-300">🎚️ Âm lượng nền riêng</label>
                <span id="mod40-val-volume" class="font-mono text-rose-300">${s.bgVolume}%</span>
              </div>
              <input type="range" id="slider-mod40-bg-volume" min="${L.bgVolume.min}" max="${L.bgVolume.max}" value="${s.bgVolume}"
                class="w-full accent-rose-400 cursor-pointer" />
            </div>
          </div>

          <!-- Lời khuyên cân bằng tương phản + Nhật ký thu gọn -->
          <div id="mod40-readability-advice" class="text-[11px] rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-300 leading-relaxed"></div>

          <details class="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-[11px]">
            <summary class="cursor-pointer select-none font-semibold text-zinc-400 hover:text-zinc-200">
              🛠️ Nhật ký điều phối nền & ưu tiên tầng
            </summary>
            <div id="mod40-diag-log-list" class="mt-2 space-y-1 max-h-40 overflow-y-auto"></div>
          </details>
          </div>
        </div>
      `;
    }

    _getPresetBtnId(presetId) {
      switch (presetId) {
        case 'CINEMA_CLEAR':
          return 'btn-mod40-preset-cinema';
        case 'NIGHT_RAIN_COMFORT':
          return 'btn-mod40-preset-night-rain';
        case 'FOG_FOCUS':
          return 'btn-mod40-preset-fog-focus';
        case 'DEEP_DARK_READ':
          return 'btn-mod40-preset-deep-dark';
        default:
          return `btn-mod40-preset-${String(presetId || 'custom').toLowerCase()}`;
      }
    }

    _bindControlsEvents(rootEl) {
      const advBtn = rootEl.querySelector('#btn-mod40-toggle-bg-advanced');
      const advBody = rootEl.querySelector('#mod40-bg-advanced-body');
      if (advBtn && advBody) {
        advBtn.addEventListener('click', () => {
          const willOpen = advBody.classList.contains('hidden');
          advBody.classList.toggle('hidden', !willOpen);
          const lbl = willOpen ? '▲ Thu gọn' : '▼ Mở rộng';
          advBtn.textContent = NS.i18n?.translateText?.(lbl) || lbl;
        });
      }

      const bindSlider = (sliderId, fieldName, suffix, labelId) => {
        const el = rootEl.querySelector(`#${sliderId}`);
        if (!el) return;
        const handleUpdate = (commit) => {
          const val = Number(el.value);
          const lbl = rootEl.querySelector(`#${labelId}`);
          if (lbl) lbl.textContent = `${val}${suffix}`;
          this.transitionCtrl.scheduleCssAndSave({ [fieldName]: val }, commit);
          this._syncAdviceAndPresetHighlight(rootEl);
        };
        el.addEventListener('input', () => handleUpdate(false));
        el.addEventListener('change', () => handleUpdate(true));
      };

      bindSlider('slider-mod39-bg-opacity', 'opacityPct', '%', 'mod39-val-bg-opacity');
      bindSlider('slider-mod39-bg-blur', 'blurPx', 'px', 'mod39-val-bg-blur');
      bindSlider('slider-mod39-bg-brightness', 'brightnessPct', '%', 'mod39-val-bg-brightness');
      bindSlider('slider-mod40-bg-darkness', 'darknessPct', '%', 'mod40-val-darkness');
      bindSlider('slider-mod40-bg-contrast', 'contrastPct', '%', 'mod40-val-contrast');
      bindSlider('slider-mod39-ui-glass', 'uiGlassPct', '%', 'mod39-val-ui-glass');

      const volSlider = rootEl.querySelector('#slider-mod40-bg-volume');
      if (volSlider) {
        const handleVol = (commit) => {
          const vol = Number(volSlider.value);
          const lbl = rootEl.querySelector('#mod40-val-volume');
          if (lbl) lbl.textContent = `${vol}%`;
          this.facade.setBgVolume(vol, commit);
        };
        volSlider.addEventListener('input', () => handleVol(false));
        volSlider.addEventListener('change', () => handleVol(true));
      }

      const soundToggle = rootEl.querySelector('#toggle-mod39-bg-sound');
      if (soundToggle) {
        soundToggle.addEventListener('change', () => {
          this.facade.toggleBgSound(Boolean(soundToggle.checked));
        });
      }

      const pillToggle = rootEl.querySelector('#toggle-mod40-floating-pill');
      if (pillToggle) {
        pillToggle.addEventListener('change', () => {
          this.facade.toggleFloatingPill(Boolean(pillToggle.checked));
        });
      }

      const setBgBtn = rootEl.querySelector('#btn-mod39-set-web-bg');
      if (setBgBtn) {
        setBgBtn.addEventListener('click', () => {
          const ok = this.facade.promoteCurrentPlayerVideoToBackground();
          if (!ok) {
            Mod40Utils.safeToast('Hãy tìm và chọn một video YouTube ở khung phát trước khi cài làm nền nhé!', 'info');
          }
        });
      }

      const peekBtn = rootEl.querySelector('#btn-mod39-peek-bg');
      if (peekBtn) {
        peekBtn.addEventListener('click', () => {
          this.facade.togglePeekMode();
        });
      }

      const clearBgBtn = rootEl.querySelector('#btn-mod39-clear-web-bg');
      if (clearBgBtn) {
        clearBgBtn.addEventListener('click', () => {
          this.facade.clearWebBackground(false);
        });
      }

      const openCropBtn = rootEl.querySelector('#btn-mod40-open-crop-modal');
      if (openCropBtn) {
        openCropBtn.addEventListener('click', () => {
          this.facade.openCropModal();
        });
      }

      const resetCropBtn = rootEl.querySelector('#btn-mod40-reset-crop');
      if (resetCropBtn) {
        resetCropBtn.addEventListener('click', () => {
          this.facade.resetCrop(false);
        });
      }

      rootEl.querySelectorAll('[data-mod40-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const pid = btn.getAttribute('data-mod40-preset');
          if (pid) this.facade.setPreset(pid);
        });
      });
    }

    syncControlsUi() {
      const rootEl =
        this._boundRootEl || global.document.getElementById(MOD40_CONSTANTS.CONTROLS_MOUNT_ID);
      if (!rootEl || !rootEl.querySelector('#slider-mod40-bg-darkness')) return;

      const s = this.vault.getState();

      const setVal = (sel, prop, value) => {
        const el = rootEl.querySelector(sel);
        if (el) el[prop] = value;
      };
      setVal('#slider-mod39-bg-opacity', 'value', String(s.opacityPct));
      setVal('#mod39-val-bg-opacity', 'textContent', `${s.opacityPct}%`);
      setVal('#slider-mod39-bg-blur', 'value', String(s.blurPx));
      setVal('#mod39-val-bg-blur', 'textContent', `${s.blurPx}px`);
      setVal('#slider-mod39-bg-brightness', 'value', String(s.brightnessPct));
      setVal('#mod39-val-bg-brightness', 'textContent', `${s.brightnessPct}%`);
      setVal('#slider-mod40-bg-darkness', 'value', String(s.darknessPct));
      setVal('#mod40-val-darkness', 'textContent', `${s.darknessPct}%`);
      setVal('#slider-mod40-bg-contrast', 'value', String(s.contrastPct));
      setVal('#mod40-val-contrast', 'textContent', `${s.contrastPct}%`);
      setVal('#slider-mod39-ui-glass', 'value', String(s.uiGlassPct));
      setVal('#mod39-val-ui-glass', 'textContent', `${s.uiGlassPct}%`);
      setVal('#slider-mod40-bg-volume', 'value', String(s.bgVolume));
      setVal('#mod40-val-volume', 'textContent', `${s.bgVolume}%`);

      setVal('#toggle-mod39-bg-sound', 'checked', Boolean(s.allowBgSound));
      setVal('#toggle-mod40-floating-pill', 'checked', Boolean(s.showFloatingPill));

      const tr = (s) =>
        global.NoirStudio?.i18n?.translateText ? global.NoirStudio.i18n.translateText(String(s || '')) : String(s || '');
      const statusBadge = rootEl.querySelector('#mod40-bg-live-status-badge');
      const isHostPaused = Boolean(this.facade?.playerHost?.isPlaybackPaused?.());
      const hostPlayState = this.facade?.playerHost?.desiredPlayState || 'playing';
      if (statusBadge) {
        if (s.enabled && isHostPaused) {
          statusBadge.textContent = tr(
            hostPlayState === 'error-paused'
              ? '⚠️ TẠM DỪNG (VIDEO HẠN CHẾ NHÚNG)'
              : '⏸ TẠM DỪNG THEO TRÌNH PHÁT'
          );
          statusBadge.className =
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/50 bg-amber-950/35 text-amber-200';
        } else if (s.enabled) {
          statusBadge.textContent = tr('ĐANG ƯU TIÊN PHỦ 6 TAB');
          statusBadge.className =
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-400/60 bg-emerald-500/20 text-emerald-200';
        } else if (s.videoId || s.playlistId) {
          statusBadge.textContent = tr('Đã tạm dừng');
          statusBadge.className =
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/40 bg-amber-950/30 text-amber-200';
        } else {
          statusBadge.textContent = tr('Đang tắt');
          statusBadge.className =
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-zinc-700 bg-zinc-900 text-zinc-300';
        }
      }

      const titlePreview = rootEl.querySelector('#mod40-bg-video-title-preview');
      if (titlePreview) {
        if (s.enabled && isHostPaused && (s.title || s.videoId)) {
          const prefix = tr(
            hostPlayState === 'error-paused'
              ? 'Nền tạm dừng do trình phát báo lỗi video:'
              : 'Đang tạm dừng đồng bộ theo trình phát:'
          );
          titlePreview.textContent = `${prefix} ${s.title || s.videoId}`;
          titlePreview.className = 'text-[11px] text-amber-200 font-medium truncate';
        } else if (s.enabled && (s.title || s.videoId)) {
          titlePreview.textContent = `${tr('Đang chạy nền:')} ${s.title || s.videoId}`;
          titlePreview.className = 'text-[11px] text-rose-200 font-medium truncate';
        } else {
          titlePreview.textContent = tr(
            'Chọn hoặc tìm kiếm bất kỳ video YouTube nào ở khung trái — nền web sẽ tự chạy theo ngay.'
          );
          titlePreview.className = 'text-[11px] text-zinc-400 truncate';
        }
      }

      const peekBtn = rootEl.querySelector('#btn-mod39-peek-bg');
      if (peekBtn) {
        peekBtn.disabled = !s.enabled;
        peekBtn.classList.toggle('opacity-50', !s.enabled);
      }

      const clearBtn = rootEl.querySelector('#btn-mod39-clear-web-bg');
      if (clearBtn) {
        clearBtn.disabled = !s.enabled;
        clearBtn.classList.toggle('opacity-50', !s.enabled);
      }

      const hasVideoTarget = Boolean(s.videoId || s.playlistId || this.facade?._getActivePlayerVideoRecord?.());
      const openCropBtn = rootEl.querySelector('#btn-mod40-open-crop-modal');
      if (openCropBtn) {
        openCropBtn.classList.toggle('opacity-60', !hasVideoTarget);
      }

      const resetCropBtn = rootEl.querySelector('#btn-mod40-reset-crop');
      if (resetCropBtn) {
        resetCropBtn.disabled = !s.cropEnabled;
        resetCropBtn.classList.toggle('opacity-50', !s.cropEnabled);
      }

      const cropBadge = rootEl.querySelector('#mod40-crop-status-badge');
      if (cropBadge) {
        if (s.cropEnabled) {
          const pctW = Math.round((Number(s.cropW) || 1) * 100);
          const pctH = Math.round((Number(s.cropH) || 1) * 100);
          const fitTxt = s.cropFitMode === 'exact' ? 'Đúng kích thước (viền đen)' : 'Phóng kín toàn màn';
          cropBadge.textContent = tr(`Đã crop ${pctW}%×${pctH}% • ${fitTxt}`);
          cropBadge.className =
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-400/60 bg-amber-500/20 text-amber-200';
        } else {
          cropBadge.textContent = tr('Toàn khung 16:9 (Mặc định)');
          cropBadge.className =
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-700 bg-zinc-950 text-zinc-300';
        }
      }

      const diagList = rootEl.querySelector('#mod40-diag-log-list');
      if (diagList) {
        diagList.innerHTML = this.diag.buildSummaryHtml(8);
      }

      this._syncAdviceAndPresetHighlight(rootEl);
    }

    _syncAdviceAndPresetHighlight(rootEl) {
      const s = this.vault.getState();
      const sig = Mod40Utils.computePresetSignature(s);
      const matched = Mod40Utils.findPresetById(sig);

      const trAdv = (str) => (global.NoirStudio?.i18n?.translateText ? global.NoirStudio.i18n.translateText(String(str || '')) : String(str || ''));
      const presetLbl = rootEl.querySelector('#mod40-active-preset-label');
      if (presetLbl) {
        presetLbl.textContent = trAdv(matched ? matched.shortLabel : 'Tùy chỉnh');
      }

      rootEl.querySelectorAll('[data-mod40-preset]').forEach((btn) => {
        const pid = btn.getAttribute('data-mod40-preset');
        const active = pid === sig;
        btn.className = active
          ? 'px-2.5 py-2 rounded-xl border text-[11px] font-bold transition text-left bg-rose-600/25 border-rose-400 text-rose-100 shadow-sm'
          : 'px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition text-left bg-zinc-900/70 border-zinc-700/80 text-zinc-200 hover:border-rose-400/70 hover:bg-rose-950/35';
      });

      const adviceBox = rootEl.querySelector('#mod40-readability-advice');
      if (adviceBox) {
        const advice = this.transitionCtrl.evaluateReadabilityAdvice(s);
        adviceBox.textContent = trAdv(advice.text);
        if (advice.level === 'warn') {
          adviceBox.className =
            'text-[11px] rounded-xl border border-amber-500/45 bg-amber-950/30 px-3 py-2 text-amber-200 leading-relaxed';
        } else if (advice.level === 'ok') {
          adviceBox.className =
            'text-[11px] rounded-xl border border-emerald-500/35 bg-emerald-950/20 px-3 py-2 text-emerald-200 leading-relaxed';
        } else {
          adviceBox.className =
            'text-[11px] rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-300 leading-relaxed';
        }
      }
    }

    /**
     * Đồng bộ thông báo quyền ưu tiên bên trong Ô Lớn #4 (Hình nền tĩnh / Upload MP4)
     * để người dùng không bị bối rối tại sao chọn ảnh nền tĩnh nhưng nền YouTube
     * vẫn đang chạy đè lên khi YouTube đang bật.
     */
    syncBox4PriorityBanner() {
      const box4Panel = global.document.getElementById(MOD40_CONSTANTS.BOX4_PANEL_ID);
      if (!box4Panel) return;

      const s = this.vault.getState();
      let banner = global.document.getElementById(MOD40_CONSTANTS.BOX4_PRIORITY_BANNER_ID);

      if (!s.enabled) {
        if (banner) banner.remove();
        return;
      }

      if (!banner) {
        banner = global.document.createElement('div');
        banner.id = MOD40_CONSTANTS.BOX4_PRIORITY_BANNER_ID;
        box4Panel.insertBefore(banner, box4Panel.firstChild);
      }

      banner.className =
        'mb-3 rounded-xl border border-rose-500/45 bg-rose-950/35 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs';
      banner.innerHTML = `
        <div class="space-y-0.5">
          <div class="font-bold text-rose-200 flex items-center gap-1.5">
            <span>🎬</span>
            <span>Nền Video Chuyển Động YouTube đang được ưu tiên</span>
          </div>
          <p class="text-[11px] text-zinc-300 leading-relaxed">
            Đang phát nền: <strong class="text-white">${Mod40Utils.escapeHtml(s.title || s.videoId || 'Video YouTube')}</strong>.
            Các hình nền tĩnh/video tải tay bên dưới tạm nhường màn hình cho YouTube cho tới khi bạn tắt nền YouTube.
          </p>
        </div>
        <div class="w-full sm:w-auto flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          <button type="button" data-mod40-action="jump-tab5-yt"
            class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 text-[11px] font-semibold">
            🎛️ Chỉnh Mờ / Sáng / Tối
          </button>
          <button type="button" data-mod40-action="pause-yt-bg-for-box4"
            class="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold">
            🧹 Tắt nền YT để dùng ảnh tĩnh
          </button>
        </div>
      `;

      const jumpBtn = banner.querySelector('[data-mod40-action="jump-tab5-yt"]');
      if (jumpBtn) {
        jumpBtn.addEventListener('click', () => {
          this.facade.openTab5YouTubeBoxAndScroll();
        });
      }
      const pauseBtn = banner.querySelector('[data-mod40-action="pause-yt-bg-for-box4"]');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          this.facade.clearWebBackground(false);
        });
      }
    }

    syncFloatingPill() {
      const s = this.vault.getState();
      let pill = global.document.getElementById(MOD40_CONSTANTS.FLOATING_PILL_ID);
      if (!(s.enabled && s.showFloatingPill)) {
        if (pill) pill.remove();
        return;
      }

      if (!pill) {
        pill = global.document.createElement('div');
        pill.id = MOD40_CONSTANTS.FLOATING_PILL_ID;
        global.document.body.appendChild(pill);
      }

      const isHostPaused = Boolean(this.facade?.playerHost?.isPlaybackPaused?.());
      const soundIcon = s.allowBgSound ? '🔊' : '🔇';
      const leadIcon = isHostPaused ? '⏸️' : '🎬';
      pill.innerHTML = `
        <span data-floating-drag-handle="ytBg" title="Kéo thả di chuyển khung nền YouTube" class="touch-none cursor-grab active:cursor-grabbing select-none px-1 text-zinc-400 hover:text-rose-200 font-bold shrink-0">⠿</span>
        <button type="button" data-mod40-pill="tab5-title" class="truncate max-w-[140px] sm:max-w-[190px] font-semibold text-left hover:underline ${isHostPaused ? 'text-amber-200' : 'text-rose-200'}" title="${Mod40Utils.escapeHtml(s.title || s.videoId)} — Bấm để quay lại Tab 5">
          ${leadIcon} ${Mod40Utils.escapeHtml(s.title || s.videoId || 'Nền YT')}
        </button>
        <button type="button" data-mod40-pill="toggle-sound" title="Bật/Tắt âm nền"
          class="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-[11px] shrink-0">
          ${soundIcon}
        </button>
        <button type="button" data-mod40-pill="peek" title="Soi nền toàn trang"
          class="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-[11px] shrink-0">
          👁️
        </button>
        <button type="button" data-mod40-pill="tab5" title="Mở bảng chỉnh nền ở Tab 5"
          class="px-2 py-0.5 rounded-full bg-rose-600/80 hover:bg-rose-500 text-white text-[11px] font-bold shrink-0">
          🎛️
        </button>
        <button type="button" data-mod40-pill="close-bg" title="Tắt nền YouTube"
          class="px-1.5 py-0.5 rounded-full bg-zinc-900 hover:bg-zinc-700 text-zinc-300 text-[11px] shrink-0">
          ✕
        </button>
      `;

      pill.querySelector('[data-mod40-pill="toggle-sound"]')?.addEventListener('click', () => {
        const latest = this.vault.getState();
        this.facade.toggleBgSound(!latest.allowBgSound);
      });
      pill.querySelector('[data-mod40-pill="peek"]')?.addEventListener('click', () => {
        this.facade.togglePeekMode();
      });
      pill.querySelector('[data-mod40-pill="tab5-title"]')?.addEventListener('click', () => {
        this.facade.openTab5YouTubeBoxAndScroll();
      });
      pill.querySelector('[data-mod40-pill="tab5"]')?.addEventListener('click', () => {
        this.facade.openTab5YouTubeBoxAndScroll();
      });
      pill.querySelector('[data-mod40-pill="close-bg"]')?.addEventListener('click', () => {
        this.facade.clearWebBackground(false);
      });

      global.NoirStudio?.floatingBars?.syncDynamicBarPositionAndDrag?.('ytBg');
    }
  }

  /**
   * Hộp thoại 2 bước căn chỉnh & crop vùng khung hình YouTube cho nền toàn trang:
   * - Bước 1: Kéo thả/thay đổi kích thước vùng chọn trên khung preview 16:9 (hỗ trợ cả chuột & cảm ứng Mobile).
   * - Bước 2: Hỏi người dùng có muốn tự động tối ưu toàn màn hình (có thể méo) hay giữ nguyên kích thước trên nền đen.
   */
  class Mod40BackgroundCropModalController {
    constructor(facade, vault, diagLogger) {
      this.facade = facade;
      this.vault = vault;
      this.diag = diagLogger;
      this.modalEl = null;
      this.draft = { cropX: 0, cropY: 0, cropW: 1, cropH: 1 };
      this._escHandler = null;
      this._dragState = null;
      this._boundMove = null;
      this._boundUp = null;
    }

    open() {
      const s = this.vault.getState();
      const fgRecord = this.facade._getActivePlayerVideoRecord();
      const videoId = Mod40Utils.extractVideoIdFromInput(s.videoId || fgRecord?.videoId || '');
      const title = s.title || fgRecord?.title || videoId || 'Video nền YouTube';

      if (!videoId && !s.playlistId && !fgRecord) {
        Mod40Utils.safeToast('Hãy tìm và chọn một video YouTube ở khung phát trước khi căn chỉnh khung nền!', 'info');
        return false;
      }

      this.close();

      this.draft = s.cropEnabled
        ? Mod40Utils.sanitizeCropRect(s)
        : { cropX: 0.15, cropY: 0.08, cropW: 0.70, cropH: 0.84 };

      const modal = global.document.createElement('div');
      modal.id = MOD40_CONSTANTS.CROP_MODAL_ID;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Căn chỉnh vùng khung hình nền YouTube');

      const thumbUrl = videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : '';
      const escapedTitle = Mod40Utils.escapeHtml(title);

      modal.innerHTML = `
        <div class="mod40-crop-card rounded-2xl border border-rose-500/40 bg-zinc-950 text-zinc-100 shadow-2xl p-3 sm:p-5 space-y-3">
          <div class="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>✂️</span>
                <span>Căn chỉnh / Crop khung hình nền YouTube</span>
              </h3>
              <p class="text-[11px] text-zinc-400 truncate mt-0.5">${escapedTitle}</p>
            </div>
            <button type="button" id="btn-mod40-crop-close-x"
              class="shrink-0 w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center text-sm font-bold"
              title="Đóng">✕</button>
          </div>

          <!-- BƯỚC 1: Chọn khung hình crop -->
          <div id="mod40-crop-step-1" data-crop-step="1" class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span class="text-zinc-300">Kéo khung hoặc 8 chấm góc/cạnh để chọn đúng phần video muốn làm background:</span>
              <span id="mod40-crop-dim-readout" class="font-mono font-bold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-2 py-0.5"></span>
            </div>

            <div id="mod40-crop-stage">
              <div id="mod40-crop-stage-fallback" class="absolute inset-0 bg-gradient-to-br from-slate-900 via-zinc-900 to-rose-950/60 flex items-center justify-center p-4 text-center pointer-events-none">
                <div class="space-y-1 opacity-70">
                  <div class="text-lg sm:text-xl font-bold text-zinc-200 tracking-wide">16:9 YOUTUBE VIDEO STAGE</div>
                  <div class="text-[11px] text-zinc-400">${escapedTitle}</div>
                </div>
              </div>
              ${
                thumbUrl
                  ? `<img id="mod40-crop-preview-img" src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20640%20360%22%3E%3Crect%20width%3D%22640%22%20height%3D%22360%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.01%22%2F%3E%3C%2Fsvg%3E" data-target-src="${Mod40Utils.escapeHtml(thumbUrl)}" alt="${escapedTitle}"
                      class="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100" />`
                  : ''
              }
              <div id="mod40-crop-box">
                <div class="mod40-crop-grid-lines"></div>
                <div class="mod40-crop-handle" data-handle="nw"></div>
                <div class="mod40-crop-handle" data-handle="n"></div>
                <div class="mod40-crop-handle" data-handle="ne"></div>
                <div class="mod40-crop-handle" data-handle="e"></div>
                <div class="mod40-crop-handle" data-handle="se"></div>
                <div class="mod40-crop-handle" data-handle="s"></div>
                <div class="mod40-crop-handle" data-handle="sw"></div>
                <div class="mod40-crop-handle" data-handle="w"></div>
              </div>
            </div>

            <!-- Các tỷ lệ cắt nhanh -->
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] font-semibold text-zinc-400 mr-1">Mẫu cắt nhanh:</span>
              <button type="button" data-mod40-crop-preset="full"
                class="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-rose-400 text-[11px] font-semibold text-zinc-200">Toàn khung 100%</button>
              <button type="button" data-mod40-crop-preset="vertical"
                class="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-rose-400 text-[11px] font-semibold text-zinc-200">Cắt dọc giữa</button>
              <button type="button" data-mod40-crop-preset="left"
                class="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-rose-400 text-[11px] font-semibold text-zinc-200">Nửa trái</button>
              <button type="button" data-mod40-crop-preset="right"
                class="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-rose-400 text-[11px] font-semibold text-zinc-200">Nửa phải</button>
              <button type="button" data-mod40-crop-preset="center"
                class="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-rose-400 text-[11px] font-semibold text-zinc-200">Vùng giữa (60%)</button>
            </div>

            <!-- 4 thanh chỉnh chính xác đồng bộ 2 chiều -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-800/80 text-[11px]">
              <label class="space-y-1">
                <div class="flex justify-between text-zinc-400"><span>Vị trí trái (X)</span><span id="mod40-crop-val-x" class="font-mono text-zinc-200"></span></div>
                <input id="slider-mod40-crop-x" type="range" min="0" max="88" step="1" class="w-full accent-rose-500 cursor-pointer" />
              </label>
              <label class="space-y-1">
                <div class="flex justify-between text-zinc-400"><span>Vị trí trên (Y)</span><span id="mod40-crop-val-y" class="font-mono text-zinc-200"></span></div>
                <input id="slider-mod40-crop-y" type="range" min="0" max="88" step="1" class="w-full accent-rose-500 cursor-pointer" />
              </label>
              <label class="space-y-1">
                <div class="flex justify-between text-zinc-400"><span>Chiều rộng (W)</span><span id="mod40-crop-val-w" class="font-mono text-zinc-200"></span></div>
                <input id="slider-mod40-crop-w" type="range" min="12" max="100" step="1" class="w-full accent-amber-500 cursor-pointer" />
              </label>
              <label class="space-y-1">
                <div class="flex justify-between text-zinc-400"><span>Chiều cao (H)</span><span id="mod40-crop-val-h" class="font-mono text-zinc-200"></span></div>
                <input id="slider-mod40-crop-h" type="range" min="12" max="100" step="1" class="w-full accent-amber-500 cursor-pointer" />
              </label>
            </div>

            <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-zinc-800">
              <div class="flex items-center gap-2">
                <button type="button" id="btn-mod40-crop-cancel"
                  class="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300">
                  Hủy
                </button>
                <button type="button" id="btn-mod40-crop-stage-reset"
                  class="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200">
                  ↺ Đặt lại 100%
                </button>
              </div>
              <button type="button" id="btn-mod40-crop-next"
                class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg transition">
                Tiếp tục: Áp dụng khung hình đã cắt →
              </button>
            </div>
          </div>

          <!-- BƯỚC 2: Hỏi tối ưu toàn màn hình hay giữ đúng kích thước đã chọn -->
          <div id="mod40-crop-step-2" data-crop-step="2" class="hidden space-y-4 py-1">
            <div class="rounded-xl border border-zinc-800 bg-zinc-900/75 p-3 sm:p-4 space-y-2.5">
              <div id="mod40-crop-step2-summary" class="text-[11px] font-mono text-amber-300"></div>
              <h4 class="text-sm sm:text-base font-bold text-white leading-snug">
                Bạn muốn tự động tối ưu cái phần khung hình đã căn chỉnh cho toàn màn hình không?
              </h4>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Nếu bạn cắt dọc hoặc cắt hẹp 1 phần khung hình: chọn <strong>Có</strong> để máy tự ép giãn về chuẩn full-screen 100%, hoặc chọn <strong>Không</strong> để giữ đúng kích thước bạn đã chọn (phần trống xung quanh là khoảng đen).
              </p>
            </div>

            <div class="flex flex-col gap-2.5">
              <button type="button" id="btn-mod40-crop-fit-stretch"
                class="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg transition text-center">
                Có (Lưu ý ảnh có thể bị méo do máy tự căn chỉnh nhé)
              </button>
              <button type="button" id="btn-mod40-crop-fit-exact"
                class="w-full px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 font-bold text-xs sm:text-sm transition text-center">
                Không
              </button>
              <p class="text-[11px] text-zinc-400 text-center">
                (Ở lựa chọn <strong>Không</strong>: khung hình crop hiện lên đúng với kích thước đã chọn, phần trống còn lại là khoảng đen.)
              </p>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button type="button" id="btn-mod40-crop-back"
                class="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200">
                ← Quay lại chỉnh khung
              </button>
              <button type="button" id="btn-mod40-crop-cancel-step2"
                class="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs font-semibold text-zinc-400">
                Hủy
              </button>
            </div>
          </div>
        </div>
      `;

      global.document.body.appendChild(modal);
      this.modalEl = modal;
      if (thumbUrl) {
        const prevImg = modal.querySelector('#mod40-crop-preview-img');
        const fbEl = modal.querySelector('#mod40-crop-stage-fallback');
        if (prevImg) {
          const probe = new Image();
          probe.onload = () => {
            if (probe.naturalWidth > 0 && prevImg.isConnected) {
              prevImg.src = thumbUrl;
              if (fbEl) fbEl.style.display = 'none';
            }
          };
          probe.src = thumbUrl;
        }
      }
      this._bindModalEvents();
      this._renderDraft();
      global.NoirStudio?.i18n?.translateElement?.(modal);
      return true;
    }

    _syncDraft(nextRect) {
      this.draft = Mod40Utils.sanitizeCropRect(nextRect);
      this._renderDraft();
    }

    _renderDraft() {
      if (!this.modalEl) return;
      const d = this.draft;
      const xPct = Math.round(d.cropX * 100);
      const yPct = Math.round(d.cropY * 100);
      const wPct = Math.round(d.cropW * 100);
      const hPct = Math.round(d.cropH * 100);

      const box = this.modalEl.querySelector('#mod40-crop-box');
      if (box) {
        box.style.left = `${(d.cropX * 100).toFixed(2)}%`;
        box.style.top = `${(d.cropY * 100).toFixed(2)}%`;
        box.style.width = `${(d.cropW * 100).toFixed(2)}%`;
        box.style.height = `${(d.cropH * 100).toFixed(2)}%`;
      }

      const trCrop = (str) => (global.NoirStudio?.i18n?.translateText ? global.NoirStudio.i18n.translateText(String(str || '')) : String(str || ''));
      const readout = this.modalEl.querySelector('#mod40-crop-dim-readout');
      if (readout) {
        readout.textContent = trCrop(`X: ${xPct}% • Y: ${yPct}% • Rộng: ${wPct}% • Cao: ${hPct}%`);
      }

      const setSlider = (id, lblId, val) => {
        const input = this.modalEl.querySelector(`#${id}`);
        const lbl = this.modalEl.querySelector(`#${lblId}`);
        if (input && Number(input.value) !== val) input.value = String(val);
        if (lbl) lbl.textContent = `${val}%`;
      };
      setSlider('slider-mod40-crop-x', 'mod40-crop-val-x', xPct);
      setSlider('slider-mod40-crop-y', 'mod40-crop-val-y', yPct);
      setSlider('slider-mod40-crop-w', 'mod40-crop-val-w', wPct);
      setSlider('slider-mod40-crop-h', 'mod40-crop-val-h', hPct);
    }

    _bindModalEvents() {
      const m = this.modalEl;
      if (!m) return;

      m.addEventListener('click', (e) => {
        if (e.target === m) this.close();
      });

      m.querySelector('#btn-mod40-crop-close-x')?.addEventListener('click', () => this.close());
      m.querySelector('#btn-mod40-crop-cancel')?.addEventListener('click', () => this.close());
      m.querySelector('#btn-mod40-crop-cancel-step2')?.addEventListener('click', () => this.close());

      m.querySelector('#btn-mod40-crop-stage-reset')?.addEventListener('click', () => {
        this._syncDraft({ cropX: 0, cropY: 0, cropW: 1, cropH: 1 });
      });

      const presetMap = {
        full: { cropX: 0, cropY: 0, cropW: 1, cropH: 1 },
        vertical: { cropX: 0.32, cropY: 0, cropW: 0.36, cropH: 1 },
        left: { cropX: 0, cropY: 0, cropW: 0.5, cropH: 1 },
        right: { cropX: 0.5, cropY: 0, cropW: 0.5, cropH: 1 },
        center: { cropX: 0.2, cropY: 0.2, cropW: 0.6, cropH: 0.6 },
      };
      m.querySelectorAll('[data-mod40-crop-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-mod40-crop-preset');
          if (key && presetMap[key]) {
            this._syncDraft(presetMap[key]);
          }
        });
      });

      const bindRange = (id, key) => {
        const el = m.querySelector(`#${id}`);
        if (!el) return;
        el.addEventListener('input', () => {
          const frac = (Number(el.value) || 0) / 100;
          const next = { ...this.draft, [key]: frac };
          if (key === 'cropX' && next.cropX + next.cropW > 1) {
            next.cropW = Math.max(MOD40_CONSTANTS.LIMITS.cropMinFrac, 1 - next.cropX);
          } else if (key === 'cropY' && next.cropY + next.cropH > 1) {
            next.cropH = Math.max(MOD40_CONSTANTS.LIMITS.cropMinFrac, 1 - next.cropY);
          } else if (key === 'cropW' && next.cropX + next.cropW > 1) {
            next.cropX = Math.max(0, 1 - next.cropW);
          } else if (key === 'cropH' && next.cropY + next.cropH > 1) {
            next.cropY = Math.max(0, 1 - next.cropH);
          }
          this._syncDraft(next);
        });
      };
      bindRange('slider-mod40-crop-x', 'cropX');
      bindRange('slider-mod40-crop-y', 'cropY');
      bindRange('slider-mod40-crop-w', 'cropW');
      bindRange('slider-mod40-crop-h', 'cropH');

      // Kéo & resize khung crop bằng Pointer Events (hoạt động đồng nhất trên chuột Desktop & chạm Mobile)
      const stage = m.querySelector('#mod40-crop-stage');
      const box = m.querySelector('#mod40-crop-box');
      if (stage && box) {
        const startPointerDrag = (e, mode) => {
          e.preventDefault();
          e.stopPropagation();
          const rect = stage.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          this._dragState = {
            mode,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            stageW: rect.width,
            stageH: rect.height,
            init: { ...this.draft },
          };
        };

        box.addEventListener('pointerdown', (e) => {
          const handleEl = e.target?.closest?.('[data-handle]');
          const mode = handleEl ? handleEl.getAttribute('data-handle') : 'move';
          startPointerDrag(e, mode);
        });

        this._boundMove = (e) => {
          const ds = this._dragState;
          if (!ds || e.pointerId !== ds.pointerId) return;
          const dx = (e.clientX - ds.startX) / ds.stageW;
          const dy = (e.clientY - ds.startY) / ds.stageH;
          const minF = MOD40_CONSTANTS.LIMITS.cropMinFrac || 0.12;
          let { cropX: x, cropY: y, cropW: w, cropH: h } = ds.init;
          const right = ds.init.cropX + ds.init.cropW;
          const bottom = ds.init.cropY + ds.init.cropH;

          if (ds.mode === 'move') {
            x = Math.max(0, Math.min(1 - w, x + dx));
            y = Math.max(0, Math.min(1 - h, y + dy));
          } else {
            if (ds.mode.includes('w')) {
              const newX = Math.max(0, Math.min(right - minF, ds.init.cropX + dx));
              x = newX;
              w = right - newX;
            }
            if (ds.mode.includes('e')) {
              w = Math.max(minF, Math.min(1 - x, ds.init.cropW + dx));
            }
            if (ds.mode.includes('n')) {
              const newY = Math.max(0, Math.min(bottom - minF, ds.init.cropY + dy));
              y = newY;
              h = bottom - newY;
            }
            if (ds.mode.includes('s')) {
              h = Math.max(minF, Math.min(1 - y, ds.init.cropH + dy));
            }
          }
          this._syncDraft({ cropX: x, cropY: y, cropW: w, cropH: h });
        };

        this._boundUp = (e) => {
          if (this._dragState && e.pointerId === this._dragState.pointerId) {
            this._dragState = null;
          }
        };

        global.addEventListener('pointermove', this._boundMove);
        global.addEventListener('pointerup', this._boundUp);
        global.addEventListener('pointercancel', this._boundUp);
      }

      const step1 = m.querySelector('#mod40-crop-step-1');
      const step2 = m.querySelector('#mod40-crop-step-2');
      const summaryEl = m.querySelector('#mod40-crop-step2-summary');

      m.querySelector('#btn-mod40-crop-next')?.addEventListener('click', () => {
        if (step1) step1.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');
        if (summaryEl) {
          const wPct = Math.round(this.draft.cropW * 100);
          const hPct = Math.round(this.draft.cropH * 100);
          const xPct = Math.round(this.draft.cropX * 100);
          const yPct = Math.round(this.draft.cropY * 100);
          const trStep2 = (str) => (global.NoirStudio?.i18n?.translateText ? global.NoirStudio.i18n.translateText(String(str || '')) : String(str || ''));
          summaryEl.textContent = trStep2(`Vùng đã chọn: Rộng ${wPct}% × Cao ${hPct}% (tại X=${xPct}%, Y=${yPct}%)`);
        }
      });

      m.querySelector('#btn-mod40-crop-back')?.addEventListener('click', () => {
        if (step2) step2.classList.add('hidden');
        if (step1) step1.classList.remove('hidden');
      });

      const applyWithMode = (fitMode) => {
        const s = this.vault.getState();
        if (!s.enabled) {
          this.facade.promoteCurrentPlayerVideoToBackground();
        }
        const isFull =
          this.draft.cropX <= 0.005 &&
          this.draft.cropY <= 0.005 &&
          this.draft.cropW >= 0.995 &&
          this.draft.cropH >= 0.995;

        if (isFull && fitMode === 'stretch') {
          this.facade.resetCrop(false);
        } else {
          this.facade.setCropConfig({
            cropEnabled: true,
            cropX: this.draft.cropX,
            cropY: this.draft.cropY,
            cropW: this.draft.cropW,
            cropH: this.draft.cropH,
            cropFitMode: fitMode,
          });
          Mod40Utils.safeToast(
            fitMode === 'exact'
              ? '✂️ Đã áp dụng vùng crop đúng kích thước (phần trống màu đen).'
              : '✂️ Đã tối ưu vùng crop phủ toàn màn hình!',
            'success'
          );
        }
        this.close();
      };

      m.querySelector('#btn-mod40-crop-fit-stretch')?.addEventListener('click', () => applyWithMode('stretch'));
      m.querySelector('#btn-mod40-crop-fit-exact')?.addEventListener('click', () => applyWithMode('exact'));

      this._escHandler = (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      };
      global.document.addEventListener('keydown', this._escHandler);
    }

    close() {
      if (this._boundMove) {
        global.removeEventListener('pointermove', this._boundMove);
        this._boundMove = null;
      }
      if (this._boundUp) {
        global.removeEventListener('pointerup', this._boundUp);
        global.removeEventListener('pointercancel', this._boundUp);
        this._boundUp = null;
      }
      if (this._escHandler) {
        global.document.removeEventListener('keydown', this._escHandler);
        this._escHandler = null;
      }
      this._dragState = null;
      if (this.modalEl && this.modalEl.parentNode) {
        this.modalEl.parentNode.removeChild(this.modalEl);
      }
      this.modalEl = null;
    }
  }

  /**
   * Cầu nối sự kiện vòng đời ứng dụng (chuyển Tab, phím tắt tiện ích, sự kiện
   * từ Module 39 & đồng bộ đa tab `storage` event).
   */
  class Mod40KeyboardAndLifecycleBridge {
    constructor(facade, vault, compositor, uiRenderer) {
      this.facade = facade;
      this.vault = vault;
      this.compositor = compositor;
      this.uiRenderer = uiRenderer;
      this._bound = false;
      this._hotkeyHandler = null;
      this._storageHandler = null;
      this._tabClickHandler = null;
    }

    attachAll() {
      if (this._bound) return;
      this._bound = true;

      // Khi người dùng bấm chuyển Tab 1..6 trên thanh điều hướng, đảm bảo nền động
      // vẫn phủ mượt và giữ nguyên CSS translucency của cả 6 màn hình
      this._tabClickHandler = (evt) => {
        const target = evt.target && evt.target.closest ? evt.target.closest('[data-tab], .nav-tab-btn, #s14-card-youtube-btn, #s14-card-typography-btn') : null;
        if (!target) return;
        const raf = global.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
        raf(() => {
          if (this.facade.isActive()) {
            this.compositor.syncBodyActiveFlags(true, this.vault.getState().allowBgSound);
            this.compositor.applyVisualCssVariables();
          }
          this.uiRenderer.syncBox4PriorityBanner();
          this.uiRenderer.mountInto();
        });
      };
      global.document.addEventListener('click', this._tabClickHandler, { passive: true });

      // Lắng nghe sự kiện tùy chỉnh do Module 39 phát ra mỗi khi chọn / phát video mới
      global.addEventListener('mod39:video-loaded', (evt) => {
        const record = evt && evt.detail ? evt.detail : null;
        if (record) {
          this.facade.onVideoSelectedAndPlayed(record);
        }
      });

      // Phím tắt hữu ích (Alt+Shift+P: Soi nền toàn trang; Alt+Shift+B: Bật/Tắt nền nhanh)
      this._hotkeyHandler = (evt) => {
        if (!evt || !evt.altKey || !evt.shiftKey) return;
        if (Mod40Utils.isTextEntryElement(global.document.activeElement)) return;

        const key = String(evt.key || '').toUpperCase();
        if (key === 'P' && this.facade.isActive()) {
          evt.preventDefault();
          this.facade.togglePeekMode();
        } else if (key === 'B') {
          evt.preventDefault();
          if (this.facade.isActive()) {
            this.facade.clearWebBackground(false);
          } else {
            this.facade.resumeLastOrCurrentBackground();
          }
        }
      };
      global.document.addEventListener('keydown', this._hotkeyHandler);

      // Đồng bộ trạng thái nếu người dùng mở 2 cửa sổ trình duyệt cùng lúc
      this._storageHandler = (evt) => {
        if (!evt || evt.key !== MOD40_CONSTANTS.STORAGE_KEY) return;
        const reloaded = this.vault._loadInitialState();
        this.vault.state = reloaded;
        this.facade.reapplyCurrentStateFromVault();
      };
      global.addEventListener('storage', this._storageHandler);
    }

    detachAll() {
      if (!this._bound) return;
      this._bound = false;
      if (this._tabClickHandler) {
        global.document.removeEventListener('click', this._tabClickHandler);
        this._tabClickHandler = null;
      }
      if (this._hotkeyHandler) {
        global.document.removeEventListener('keydown', this._hotkeyHandler);
        this._hotkeyHandler = null;
      }
      if (this._storageHandler) {
        global.removeEventListener('storage', this._storageHandler);
        this._storageHandler = null;
      }
    }
  }

  /**
   * Facade công khai duy nhất của Module 40 (`NoirStudio.youtubeMotionBg` & `NoirStudio.mod40`).
   * Điều phối đồng thời:
   *  - Kết nối tương thích hai chiều vào `NoirStudio.youtubeStudio.bgStage` (Mod 39)
   *  - Tự động kích hoạt nền chuyển động khi chọn/phát video (`onVideoSelectedAndPlayed`)
   *  - Toàn bộ bộ lọc Độ rõ, Độ nhòe, Độ sáng, Độ tối, Tương phản, Kính mờ UI, Âm thanh
   */
  class Mod40YouTubeMotionBgFacade {
    constructor() {
      this.diag = new Mod40DiagnosticRingLogger(60);
      this.vault = new Mod40MotionBgVault();
      this.compositor = new Mod40StagePriorityArbiterAndCssCompositor(this.vault, this.diag);
      this.transitionCtrl = new Mod40SmartFadeTransitionController(this.vault, this.compositor);
      this.playerHost = new Mod40YouTubeBackgroundPlayerHost(this.vault, this.compositor, this.diag);
      this.uiRenderer = new Mod40Tab5ControlsAndBox4BridgeRenderer(
        this,
        this.vault,
        this.diag,
        this.transitionCtrl
      );
      this.lifecycleBridge = new Mod40KeyboardAndLifecycleBridge(
        this,
        this.vault,
        this.compositor,
        this.uiRenderer
      );
      this.cropModal = new Mod40BackgroundCropModalController(this, this.vault, this.diag);
      this._initialized = false;
    }

    init() {
      if (this._initialized) {
        this.uiRenderer.mountInto();
        return this;
      }
      this._initialized = true;

      this.compositor.ensureBackdropLayersMounted();
      this.compositor.wrapMod32AndMod22PriorityHooks();
      this.playerHost.setStateChangeListener((evt) => {
        if (!evt) return;
        if (evt.type === 'error' || evt.type === 'playing' || evt.type === 'paused' || evt.type === 'ready') {
          this.uiRenderer.syncControlsUi();
          this.uiRenderer.syncFloatingPill();
        }
      });

      this.bridgeWithMod39();
      this.lifecycleBridge.attachAll();

      // Dọn sạch mọi iframe nền cũ còn sót trước khi nạp trạng thái nền chuẩn của Mod 40
      this.compositor.clearBgIframeElement();

      // Nếu trình phát chính đã bị tạm dừng hoặc đang gặp lỗi #150/#101 ngay lúc khởi tạo -> đồng bộ giữ paused
      const fgBridge = NS.youtubeStudio?.bridge;
      if (fgBridge?.lastErrorCode) {
        this.playerHost.desiredPlayState = 'error-paused';
      } else if (fgBridge && (fgBridge.lastKnownState === 2 || fgBridge.lastKnownState === 0)) {
        this.playerHost.desiredPlayState = 'paused';
      }

      // Nếu đang bật tự động ưu tiên & trình phát Tab 5 đã mở sẵn một video khác video cũ trong vault,
      // ưu tiên đồng bộ nền theo video hiện tại của trình phát.
      const savedBg = this.vault.getState();
      const playerActive = NS.youtubeStudio?.playerCtrl?.activeVideo;
      if (
        savedBg.enabled &&
        savedBg.autoPriority &&
        playerActive &&
        playerActive.videoId &&
        playerActive.videoId !== savedBg.videoId
      ) {
        this.applyWebBackground(playerActive, {
          silent: true,
          source: 'boot-sync-active',
          initialPaused: this.playerHost.isPlaybackPaused(),
        });
      } else {
        this.reapplyCurrentStateFromVault();
      }
      this.uiRenderer.mountInto();
      if (!this._i18nBound) {
        this._i18nBound = true;
        const onLangChanged = () => {
          this.uiRenderer.syncControlsUi();
          this.uiRenderer.syncFloatingPill();
          const controlsEl = global.document.getElementById(MOD40_CONSTANTS.CONTROLS_MOUNT_ID);
          if (controlsEl) global.NoirStudio?.i18n?.translateElement?.(controlsEl);
        };
        NS.bus?.on?.('i18n:changed', onLangChanged);
        if (typeof global !== 'undefined' && global.addEventListener) {
          global.addEventListener('noir:i18n:changed', onLangChanged);
        }
      }
      this.diag.log('INIT_OK', `Khởi chạy Module 40 v${MOD40_CONSTANTS.ENGINE_VERSION} hoàn tất.`);
      return this;
    }

    /**
     * Đồng bộ tương thích chéo để bất kỳ lời gọi cũ nào qua `NS.youtubeStudio.bgStage`
     * (từ Mod 39 hoặc console) đều đi qua bộ xử lý chuẩn của Mod 40 mà không
     * tạo hai iframe nền chồng chéo nhau.
     */
    bridgeWithMod39() {
      const studio = NS.youtubeStudio;
      if (!studio) return;

      const facadeSelf = this;
      const adapter = {
        get state() {
          return facadeSelf.vault.getState();
        },
        applyWebBackground: (parsedOrMeta, options) => this.applyWebBackground(parsedOrMeta, options),
        clearWebBackground: (silent) => this.clearWebBackground(silent),
        applyVisualFilters: () => this.applyVisualFilters(),
        applyUiGlassTransparency: () => this.applyUiGlassTransparency(),
        toggleBgSound: (enabled) => this.toggleBgSound(enabled),
        setBgVolume: (vol, commit) => this.setBgVolume(vol, commit),
        enterPeekMode: () => this.enterPeekMode(),
        exitPeekMode: () => this.exitPeekMode(),
        togglePeekMode: () => this.togglePeekMode(),
        syncWithForegroundPlayback: (payload) => this.syncWithForegroundPlayback(payload),
        syncWithForegroundSeek: (sec, allowAhead) => this.syncWithForegroundSeek(sec, allowAhead),
        syncWithForegroundRate: (rate) => this.syncWithForegroundRate(rate),
        pausePlayback: (mode) => this.pausePlayback(mode),
        playPlayback: () => this.playPlayback(),
        isPlaybackPaused: () => this.playerHost.isPlaybackPaused(),
        getFrameSyncDiagnostics: () => this.getFrameSyncDiagnostics(),
        syncFloatingPeekExitButton: () => this.compositor.syncFloatingPeekExitButton(),
        updateCoverGeometry: () => this.compositor.updateCoverGeometry(),
        setUiSyncCallback: () => {},
        isWebBackgroundActive: () => this.isActive(),
        getActiveVideoKey: () => this.vault.getState().videoKey,
        isActive: () => this.isActive(),
        __poweredByMod40: true,
      };

      studio.bgStage = adapter;
      if (studio.viewRenderer) studio.viewRenderer.bgStage = adapter;
      if (studio.diagnostics) studio.diagnostics.bgStage = adapter;
      this.playerHost._liveFgStateGetter = () => {
        try {
          const activeRec = studio.playerCtrl && studio.playerCtrl.activeVideo ? studio.playerCtrl.activeVideo : null;
          const vid = Mod40Utils.extractVideoIdFromInput(
            (activeRec && (activeRec.videoId || activeRec.watchUrl)) || ''
          );
          const snap =
            studio.bridge && typeof studio.bridge.getCurrentPlaybackSnapshot === 'function'
              ? studio.bridge.getCurrentPlaybackSnapshot()
              : null;
          const curTime =
            snap && typeof snap.currentTime === 'number' && Number.isFinite(snap.currentTime)
              ? snap.currentTime
              : Number(studio.bridge && studio.bridge.lastKnownTime) || 0;
          const code =
            snap && typeof snap.playerState === 'number'
              ? snap.playerState
              : snap && typeof snap.state === 'number'
                ? snap.state
                : typeof (studio.bridge && studio.bridge.lastKnownState) === 'number'
                  ? studio.bridge.lastKnownState
                  : -1;
          const recentFgPlayIntent = Boolean(
            studio.playerCtrl &&
            studio.playerCtrl._userDesiredPaused === false &&
            studio.bridge?._lastPlayCommandAtMs &&
            Date.now() - studio.bridge._lastPlayCommandAtMs < 1800
          );
          return {
            videoId: vid,
            currentTime: Math.max(0, curTime),
            playerState: code,
            paused:
              !recentFgPlayIntent &&
              (code === 2 ||
                code === 0 ||
                code === 5 ||
                (code === -1 && !Boolean(studio.bridge && studio.bridge.assumedAutoplaying))),
          };
        } catch (_err) {
          return null;
        }
      };

      if (typeof studio.registerMotionBgEngine === 'function') {
        studio.registerMotionBgEngine(this);
      }
    }

    isActive() {
      const s = this.vault.getState();
      return Boolean(s.enabled && (s.videoId || s.playlistId));
    }

    isAutoPriorityEnabled() {
      return true;
    }

    reapplyCurrentStateFromVault() {
      const s = this.vault.getState();
      this.compositor.applyVisualCssVariables();

      if (s.enabled && (s.videoId || s.playlistId)) {
        this.compositor.syncBodyActiveFlags(true, s.allowBgSound);
        this.playerHost.mountVideo(s.videoId, s.playlistId, 0);
        this.compositor.updateCoverGeometry();
        this.diag.log('RESTORE_BG', `Khôi phục nền chuyển động: ${s.title || s.videoId}`);
      } else {
        this.compositor.syncBodyActiveFlags(false, false);
        this.compositor.updateCoverGeometry();
        this.playerHost.teardownPlayer();
      }
      this.uiRenderer.syncControlsUi();
      this.uiRenderer.syncBox4PriorityBanner();
      this.uiRenderer.syncFloatingPill();
    }

    /**
     * Điểm kích hoạt ưu tiên tự động quan trọng nhất:
     * Được Module 39 gọi ngay khi người dùng bấm chọn 1 video trong danh sách tìm kiếm,
     * bấm gợi ý chủ đề, hoặc nạp đường link YouTube vào trình phát Tab 5.
     */
    onVideoSelectedAndPlayed(record, options = {}) {
      if (!record || typeof record !== 'object') return false;
      const s = this.vault.getState();
      const forceActivate = Boolean(options.force);
      if (!s.autoPriority && !forceActivate) {
        this.diag.log('AUTO_SKIP', `Bỏ qua auto-background vì người dùng đang tắt tự động ưu tiên (${record.videoId || ''}).`);
        return false;
      }

      const applied = this.applyWebBackground(record, {
        silent: options.silent !== false,
        source: options.source || 'auto-priority',
      });
      if (applied) {
        this.diag.log(
          'BG_AUTO_PRIORITY',
          `Tự động ưu tiên nền 16:9 theo video đang chọn: ${record.title || record.videoId}`
        );
      }
      return applied;
    }

    applyWebBackground(videoMeta, options = {}) {
      const meta = videoMeta && typeof videoMeta === 'object' ? videoMeta : {};
      const extractedVid =
        Mod40Utils.extractVideoIdFromInput(meta.videoId) ||
        Mod40Utils.extractVideoIdFromInput(meta.watchUrl) ||
        Mod40Utils.extractVideoIdFromInput(meta.videoKey);
      const playlistId = String(meta.playlistId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');

      if (!extractedVid && !playlistId) {
        return false;
      }

      const videoKey = String(meta.videoKey || extractedVid || playlistId).trim();
      const effectivePlaylistId = extractedVid ? '' : playlistId;
      const cleanTitle = String(meta.title || meta.label || extractedVid || 'Video YouTube').trim();
      const startSec = Math.max(
        0,
        Number(meta.startSeconds) || Number(options.startSeconds) || 0
      );

      const fgSpeed =
        typeof options.playbackRate === 'number' && options.playbackRate > 0
          ? options.playbackRate
          : NS.youtubeStudio?.playerCtrl?.prefs?.speed;
      if (typeof fgSpeed === 'number' && Number.isFinite(fgSpeed) && fgSpeed > 0) {
        this.playerHost.playbackRate = fgSpeed;
      }

      const nextState = this.vault.patchState({
        enabled: true,
        videoKey,
        videoId: extractedVid,
        playlistId: effectivePlaylistId,
        title: cleanTitle,
        author: String(meta.author || '').trim(),
        watchUrl: String(meta.watchUrl || (extractedVid ? `https://www.youtube.com/watch?v=${extractedVid}` : '')),
        thumbnailUrl: String(meta.thumbnailUrl || ''),
        activatedAt: Date.now(),
      });

      this.compositor.ensureBackdropLayersMounted();
      this.compositor.wrapMod32AndMod22PriorityHooks();
      const initialPaused = Boolean(
        typeof options.initialPaused === 'boolean' ? options.initialPaused : meta.paused
      );
      this.playerHost.desiredPlayState = initialPaused ? 'paused' : 'playing';
      this.playerHost.targetSeekAnchor = {
        videoId: extractedVid || effectivePlaylistId,
        timeSec: startSec,
        paused: initialPaused,
        setAtMs: Date.now(),
        rate: Number(this.playerHost.playbackRate) || 1,
        appliedOnReady: false,
      };
      this.compositor.syncBodyActiveFlags(true, nextState.allowBgSound);
      this.compositor.applyVisualCssVariables();
      this.playerHost.mountVideo(extractedVid, effectivePlaylistId, startSec);

      this.uiRenderer.syncControlsUi();
      this.uiRenderer.syncBox4PriorityBanner();
      this.uiRenderer.syncFloatingPill();

      if (!options.silent) {
        Mod40Utils.safeToast(`🌌 Đã đặt "${cleanTitle}" làm nền chuyển động toàn trang!`, 'success');
      } else if (options.source === 'auto-priority') {
        Mod40Utils.safeToast(`🎬 Nền web đang tự chạy theo: ${cleanTitle}`, 'info');
      }
      return true;
    }

    promoteCurrentPlayerVideoToBackground() {
      const studio = NS.youtubeStudio;
      const activeRecord =
        (studio && typeof studio.getCurrentVideoRecord === 'function' && studio.getCurrentVideoRecord()) ||
        (studio && studio.playerCtrl && studio.playerCtrl.activeVideo) ||
        (studio && studio.playbackCtrl && studio.playbackCtrl.currentVideo) ||
        null;

      if (activeRecord && (activeRecord.videoId || activeRecord.playlistId)) {
        const snap =
          studio && studio.bridge && typeof studio.bridge.getCurrentPlaybackSnapshot === 'function'
            ? studio.bridge.getCurrentPlaybackSnapshot()
            : null;
        const curTime =
          snap && typeof snap.currentTime === 'number' && Number.isFinite(snap.currentTime)
            ? Math.max(0, snap.currentTime)
            : Math.max(0, Number(studio?.bridge?.lastKnownTime) || Number(activeRecord.startSeconds) || 0);
        const playerStateCode =
          snap && typeof snap.playerState === 'number'
            ? snap.playerState
            : snap && typeof snap.state === 'number'
              ? snap.state
              : typeof studio?.bridge?.lastKnownState === 'number'
                ? studio.bridge.lastKnownState
                : -1;
        const isFgPaused = Boolean(
          playerStateCode === 2 ||
          playerStateCode === 0 ||
          playerStateCode === 5 ||
          (playerStateCode === -1 && !studio?.bridge?.assumedAutoplaying)
        );
        const speed = Number(studio?.playerCtrl?.prefs?.speed) || 1;
        return this.applyWebBackground(
          { ...activeRecord, startSeconds: curTime },
          {
            silent: false,
            source: 'manual-button',
            initialPaused: isFgPaused,
            startSeconds: curTime,
            playbackRate: speed,
          }
        );
      }

      // Dự phòng nếu trước đó đã lưu 1 video nền trong vault
      const saved = this.vault.getState();
      if (saved.videoId || saved.playlistId) {
        return this.applyWebBackground(saved, { silent: false, source: 'manual-resume' });
      }
      return false;
    }

    resumeLastOrCurrentBackground() {
      if (this.promoteCurrentPlayerVideoToBackground()) return true;
      Mod40Utils.safeToast('Chưa có video YouTube nào được chọn để làm nền.', 'info');
      return false;
    }

    clearWebBackground(silent = false) {
      this.exitPeekMode();
      this.playerHost.teardownPlayer();
      this.vault.patchState({
        enabled: false,
      });
      this.compositor.syncBodyActiveFlags(false, false);
      this.compositor.applyVisualCssVariables();
      this.uiRenderer.syncControlsUi();
      this.uiRenderer.syncBox4PriorityBanner();
      this.uiRenderer.syncFloatingPill();
      this.diag.log('BG_CLEARED', 'Đã tắt nền video YouTube và trả lại nền mặc định cho Box #4.');

      if (!silent) {
        Mod40Utils.safeToast('🧹 Đã tắt nền video YouTube (đã khôi phục nền cũ nếu có).', 'info');
      }
      return true;
    }

    toggleAutoPriority() {
      // Luôn mặc định ngầm BẬT khi đã dùng hệ thống nền YouTube
      this.vault.patchState({ autoPriority: true });
      this.diag.log('AUTO_PRIORITY_TOGGLE', 'Chế độ tự động ưu tiên nền YouTube luôn được mặc định bật ngầm.');
      if (!this.isActive()) {
        // Nếu đang có video phát ở khung chính -> đồng bộ ngay
        const studio = NS.youtubeStudio;
        const current =
          (studio && typeof studio.getCurrentVideoRecord === 'function' && studio.getCurrentVideoRecord()) ||
          (studio && studio.playerCtrl && studio.playerCtrl.activeVideo) ||
          (studio && studio.playbackCtrl && studio.playbackCtrl.currentVideo) ||
          null;
        if (current && (current.videoId || current.playlistId)) {
          this.onVideoSelectedAndPlayed(current, { silent: true, source: 'auto-priority' });
        }
      }
      this.uiRenderer.syncControlsUi();
      return true;
    }

    toggleFloatingPill(enabled) {
      const flag = Boolean(enabled);
      this.vault.patchState({ showFloatingPill: flag });
      this.uiRenderer.syncControlsUi();
      this.uiRenderer.syncFloatingPill();
      return flag;
    }

    setPreset(presetId) {
      const preset = Mod40Utils.findPresetById(presetId);
      if (!preset) return false;

      this.vault.patchState({
        opacityPct: preset.opacityPct,
        blurPx: preset.blurPx,
        brightnessPct: preset.brightnessPct,
        darknessPct: preset.darknessPct,
        contrastPct: preset.contrastPct,
        uiGlassPct: preset.uiGlassPct,
        lastPresetId: preset.id,
      });

      this.compositor.applyVisualCssVariables();
      this.uiRenderer.syncControlsUi();
      this.diag.log('BG_PRESET', `Áp dụng preset "${preset.label}".`);
      return true;
    }

    applyVisualFilters() {
      this.compositor.applyVisualCssVariables();
    }

    applyUiGlassTransparency() {
      this.compositor.applyVisualCssVariables();
    }

    toggleBgSound(enabled) {
      const flag = Boolean(enabled);
      this.vault.patchState({ allowBgSound: flag });
      this.compositor.syncBodyActiveFlags(this.isActive(), flag);
      this.playerHost.syncAudioSettings();
      this.uiRenderer.syncControlsUi();
      this.uiRenderer.syncFloatingPill();
      this.diag.log('BG_SOUND', `Âm thanh nền YouTube: ${flag ? 'BẬT' : 'TẮT'}.`);
      return flag;
    }

    setBgVolume(vol, commit = true) {
      const L = MOD40_CONSTANTS.LIMITS.bgVolume;
      const safeVol = Mod40Utils.clampNumber(vol, L.min, L.max, L.fallback);
      this.vault.patchState({ bgVolume: safeVol }, Boolean(commit));
      this.playerHost.syncAudioSettings();
      if (commit) {
        this.uiRenderer.syncControlsUi();
      }
      return safeVol;
    }

    _getActivePlayerVideoRecord() {
      const studio = NS.youtubeStudio;
      const rec =
        (studio && typeof studio.getCurrentVideoRecord === 'function' && studio.getCurrentVideoRecord()) ||
        (studio && studio.playerCtrl && studio.playerCtrl.activeVideo) ||
        (studio && studio.playbackCtrl && studio.playbackCtrl.currentVideo) ||
        null;
      return rec && (rec.videoId || rec.playlistId) ? rec : null;
    }

    openCropModal() {
      return this.cropModal ? this.cropModal.open() : false;
    }

    setCropConfig(partial = {}) {
      const sanitized = Mod40Utils.sanitizeCropRect(partial);
      const cropFitMode = partial.cropFitMode === 'exact' ? 'exact' : 'stretch';
      const cropEnabled = partial.cropEnabled === undefined ? true : Boolean(partial.cropEnabled);
      this.vault.patchState({
        cropEnabled,
        cropX: sanitized.cropX,
        cropY: sanitized.cropY,
        cropW: sanitized.cropW,
        cropH: sanitized.cropH,
        cropFitMode,
      });
      this.compositor.syncBodyActiveFlags(this.isActive(), this.vault.getState().allowBgSound);
      this.compositor.updateCoverGeometry();
      this.uiRenderer.syncControlsUi();
      const modeLabel =
        cropFitMode === 'exact'
          ? 'Giữ nguyên kích thước khung hình đã cắt (viền đen)'
          : 'Tự động tối ưu phủ toàn màn hình (có thể méo)';
      this.diag.log(
        'BG_CROP_SET',
        `Cập nhật crop nền (${Math.round(sanitized.cropW * 100)}%×${Math.round(sanitized.cropH * 100)}%, ${modeLabel}).`
      );
      return this.vault.getState();
    }

    resetCrop(silent = false) {
      this.vault.patchState({
        cropEnabled: false,
        cropX: 0,
        cropY: 0,
        cropW: 1,
        cropH: 1,
        cropFitMode: 'stretch',
      });
      this.compositor.syncBodyActiveFlags(this.isActive(), this.vault.getState().allowBgSound);
      this.compositor.updateCoverGeometry();
      this.uiRenderer.syncControlsUi();
      this.diag.log('BG_CROP_RESET', 'Đã đặt lại vùng nền YouTube về toàn khung 16:9 mặc định.');
      if (!silent) {
        Mod40Utils.safeToast('↺ Đã đặt lại nền YouTube về toàn khung 16:9 mặc định.', 'info');
      }
      return this.vault.getState();
    }

    enterPeekMode() {
      if (!this.isActive()) return false;
      global.document.body?.classList.add(MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE);
      global.document.body?.classList.add(MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK);
      this.compositor.syncFloatingPeekExitButton();
      return true;
    }

    exitPeekMode() {
      global.document.body?.classList.remove(MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE);
      global.document.body?.classList.remove(MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK);
      this.compositor.syncFloatingPeekExitButton();
      return true;
    }

    togglePeekMode() {
      const isPeeking = Boolean(
        global.document.body?.classList.contains(MOD40_CONSTANTS.BODY_CLASS_PEEK_MODE) ||
          global.document.body?.classList.contains(MOD40_CONSTANTS.BODY_CLASS_AMBIENT_PEEK)
      );
      if (isPeeking) {
        return this.exitPeekMode();
      }
      return this.enterPeekMode();
    }

    mountControlsInto(containerEl) {
      return this.uiRenderer.mountInto(containerEl);
    }

    syncBox4PriorityBanner() {
      this.uiRenderer.syncBox4PriorityBanner();
    }

    updateCoverGeometry() {
      this.compositor.updateCoverGeometry();
    }

    pausePlayback(mode = 'paused') {
      if (!this.isActive()) return false;
      const ok = this.playerHost.pausePlayback(mode);
      this.uiRenderer.syncControlsUi();
      this.uiRenderer.syncBox4PriorityBanner();
      this.uiRenderer.syncFloatingPill();
      return ok;
    }

    playPlayback() {
      if (!this.isActive()) return false;
      const ok = this.playerHost.playPlayback();
      this.uiRenderer.syncControlsUi();
      this.uiRenderer.syncBox4PriorityBanner();
      this.uiRenderer.syncFloatingPill();
      return ok;
    }

    /**
     * Đồng bộ chặt trạng thái Phát / Tạm dừng / Kết thúc / Lỗi #150 của trình phát chính (Mod 39)
     * sang video chạy nền (Mod 40) để khi dừng ở trình phát thì nền web cũng dừng khớp tức thì.
     */
    syncWithForegroundPlayback(payload = {}) {
      if (!this.isActive()) return false;
      const info = payload && typeof payload === 'object' ? payload : {};
      const stateStr = String(info.state || '').toLowerCase();
      const code = typeof info.stateCode === 'number' ? info.stateCode : null;
      const errorCode = info.errorCode;
      const stateBefore = this.playerHost.desiredPlayState;
      const saved = this.vault.getState();
      const fgVid = Mod40Utils.extractVideoIdFromInput(
        info.videoId ||
          NS.youtubeStudio?.playerCtrl?.activeVideo?.videoId ||
          NS.youtubeStudio?.playerCtrl?.activeVideo?.watchUrl ||
          ''
      );
      const bgVid = Mod40Utils.extractVideoIdFromInput(saved.videoId || '');
      const hasValidTime =
        typeof info.currentTime === 'number' &&
        Number.isFinite(info.currentTime) &&
        info.currentTime >= 0;

      if (stateStr === 'error' || Boolean(errorCode)) {
        this.playerHost.pausePlayback('error-paused');
        if (stateBefore !== 'error-paused') {
          this.diag.log('BG_SYNC_FG_ERROR', `Tạm dừng nền vì trình phát báo lỗi video (#${errorCode || 'embed'}).`);
        }
        this.uiRenderer.syncControlsUi();
        this.uiRenderer.syncFloatingPill();
        return true;
      }

      if (stateStr === 'paused' || stateStr === 'ended' || stateStr === 'stopped' || code === 2 || code === 0) {
        const wasPaused = this.playerHost.isPlaybackPaused();
        this.playerHost.pausePlayback('paused');
        if (fgVid && bgVid && fgVid === bgVid && hasValidTime) {
          const bgAccTime = this.playerHost.getAccurateBgTime();
          const drift = Math.abs(info.currentTime - bgAccTime);
          if (info.forceSeekSync || drift > 0.35) {
            this.playerHost.seekToSeconds(info.currentTime, true);
          }
        }
        if (!wasPaused || info.forceNotify || info.forceSeekSync) {
          this.diag.log('BG_SYNC_FG_PAUSE', `Đã tạm dừng & đồng bộ vị trí video nền (${info.reason || stateStr || code}).`);
        }
        this.uiRenderer.syncControlsUi();
        this.uiRenderer.syncFloatingPill();
        return true;
      }

      if (stateStr === 'playing' || code === 1) {
        const wasPaused = this.playerHost.isPlaybackPaused();
        if (
          typeof info.speed === 'number' &&
          Number.isFinite(info.speed) &&
          info.speed > 0 &&
          Math.abs((this.playerHost.playbackRate || 1) - info.speed) > 0.01
        ) {
          this.playerHost.setPlaybackRate(info.speed);
        }
        this.playerHost.playPlayback();

        // Nếu đang chiếu đúng cùng video với trình phát chính, bắt khớp tức thì khi vừa tua/resume hoặc trôi > 1.25s
        if (fgVid && bgVid && fgVid === bgVid && hasValidTime) {
          const now = Date.now();
          const bgAccTime = this.playerHost.getAccurateBgTime();
          const drift = Math.abs(info.currentTime - bgAccTime);
          const justSeekedBg = this.playerHost.lastBgSeekCmdAtMs && now - this.playerHost.lastBgSeekCmdAtMs < 400;
          const forceImmediateSnap = Boolean(info.forceSeekSync || (wasPaused && drift > 0.55));
          const periodicDriftCatchup =
            drift > 1.25 && !justSeekedBg && now - (this._lastBgDriftSyncAt || 0) >= 1800;
          if (forceImmediateSnap || periodicDriftCatchup) {
            this._lastBgDriftSyncAt = now;
            const rate = Number(this.playerHost.playbackRate) || 1;
            const targetTime = info.forceSeekSync || wasPaused ? info.currentTime : info.currentTime + 0.12 * rate;
            this.playerHost.seekToSeconds(targetTime, true);
          }
        }

        if (wasPaused || info.forceNotify) {
          this.diag.log('BG_SYNC_FG_PLAY', `Đã phát tiếp video nền đồng bộ theo trình phát (${info.reason || 'playing'}).`);
        }
        this.uiRenderer.syncControlsUi();
        this.uiRenderer.syncFloatingPill();
        return true;
      }

      return false;
    }

    syncWithForegroundSeek(seconds, allowAhead = true) {
      if (!this.isActive()) return false;
      const saved = this.vault.getState();
      const fgVid = Mod40Utils.extractVideoIdFromInput(
        NS.youtubeStudio?.playerCtrl?.activeVideo?.videoId ||
          NS.youtubeStudio?.playerCtrl?.activeVideo?.watchUrl ||
          ''
      );
      const bgVid = Mod40Utils.extractVideoIdFromInput(saved.videoId || '');
      if (fgVid && bgVid && fgVid !== bgVid) return false;
      this._lastBgDriftSyncAt = Date.now();
      const ok = this.playerHost.seekToSeconds(seconds, allowAhead);
      this.uiRenderer.syncControlsUi();
      this.uiRenderer.syncFloatingPill();
      return ok;
    }

    syncWithForegroundRate(rate) {
      if (!this.isActive()) return false;
      return this.playerHost.setPlaybackRate(rate);
    }

    openTab5YouTubeBoxAndScroll() {
      try {
        if (global.NoirStudio?.navigator?.openTab5Section) {
          global.NoirStudio.navigator.openTab5Section(
            's14-panel-youtube-box',
            `#${MOD40_CONSTANTS.CONTROLS_MOUNT_ID}`
          );
          return;
        }
        if (typeof global.switchToTab === 'function') {
          global.switchToTab(5);
        } else {
          const tab5Btn = global.document.querySelector('[data-tab="5"], #nav-btn-tab-5');
          if (tab5Btn) tab5Btn.click();
        }
        const ytBtn = global.document.getElementById('s14-card-youtube-btn');
        const ytBox = global.document.getElementById('s14-panel-youtube-box');
        if (ytBtn && ytBox && ytBox.classList.contains('hidden')) {
          ytBtn.click();
        }
        const target =
          global.document.getElementById(MOD40_CONSTANTS.CONTROLS_MOUNT_ID) || ytBox || ytBtn;
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (_err) {}
    }

    getState() {
      return this.vault.getState();
    }

    getDiagnostics() {
      return this.diag.getRecentLogs(25);
    }

    getFrameSyncDiagnostics() {
      const s = this.vault.getState();
      const bgTime = Number(this.playerHost.getAccurateBgTime().toFixed(2));
      const liveFg =
        typeof this.playerHost._liveFgStateGetter === 'function'
          ? this.playerHost._liveFgStateGetter()
          : null;
      const fgTime =
        liveFg && typeof liveFg.currentTime === 'number' && Number.isFinite(liveFg.currentTime)
          ? Number(liveFg.currentTime.toFixed(2))
          : null;
      return {
        active: this.isActive(),
        bgVideoId: s.videoId || '',
        fgVideoId: liveFg?.videoId || '',
        desiredPlayState: this.playerHost.desiredPlayState,
        lastKnownBgState: this.playerHost.lastKnownBgState,
        bgAccurateTime: bgTime,
        fgAccurateTime: fgTime,
        fgDriftSec:
          fgTime !== null && (!liveFg?.videoId || liveFg.videoId === s.videoId)
            ? Number(Math.abs(fgTime - bgTime).toFixed(2))
            : null,
        targetSeekAnchor: this.playerHost.targetSeekAnchor
          ? { ...this.playerHost.targetSeekAnchor }
          : null,
        bgIframeAcked: Boolean(this.playerHost._bgIframeAcked),
        playbackRate: Number(this.playerHost.playbackRate) || 1,
      };
    }

    getHealthReport() {
      const s = this.vault.getState();
      const iframeNode = global.document.getElementById(MOD40_CONSTANTS.BG_IFRAME_ID);
      const syncDiag = this.getFrameSyncDiagnostics();
      return {
        module: MOD40_CONSTANTS.MODULE_KEY,
        version: MOD40_CONSTANTS.ENGINE_VERSION,
        initialized: this._initialized,
        active: this.isActive(),
        autoPriority: Boolean(s.autoPriority),
        playState: this.playerHost.desiredPlayState,
        isPlaybackPaused: this.playerHost.isPlaybackPaused(),
        videoId: s.videoId,
        iframeValid: Boolean(iframeNode && iframeNode.tagName?.toUpperCase() === 'IFRAME'),
        bgAccurateTime: syncDiag.bgAccurateTime,
        bgIframeAcked: syncDiag.bgIframeAcked,
        targetSeekAnchor: syncDiag.targetSeekAnchor,
        opacityPct: s.opacityPct,
        blurPx: s.blurPx,
        brightnessPct: s.brightnessPct,
        darknessPct: s.darknessPct,
        contrastPct: s.contrastPct,
        uiGlassPct: s.uiGlassPct,
        allowBgSound: s.allowBgSound,
        bgVolume: s.bgVolume,
        cropEnabled: Boolean(s.cropEnabled),
        cropFitMode: s.cropFitMode === 'exact' ? 'exact' : 'stretch',
        cropRect: {
          x: Number(s.cropX) || 0,
          y: Number(s.cropY) || 0,
          w: Number(s.cropW) || 1,
          h: Number(s.cropH) || 1,
        },
        presetId: Mod40Utils.computePresetSignature(s),
      };
    }

    destroy() {
      this.cropModal?.close?.();
      this.clearWebBackground(true);
      this.lifecycleBridge.detachAll();
      this._initialized = false;
    }
  }

  const engine = new Mod40YouTubeMotionBgFacade();

  NS.mod40 = engine;
  NS.youtubeMotionBg = engine;
  NS.Mod40YoutubeMotionBgConstants = MOD40_CONSTANTS;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule(MOD40_CONSTANTS.MODULE_KEY, engine);
  }

  const bootEngine = () => {
    try {
      engine.init();
    } catch (err) {
      if (global.console && typeof global.console.error === 'function') {
        global.console.error('[Mod40] Lỗi khởi tạo nền video chuyển động:', err);
      }
    }
  };

  if (global.document && global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', bootEngine, { once: true });
  } else {
    bootEngine();
  }
})(typeof window !== 'undefined' ? window : globalThis);
