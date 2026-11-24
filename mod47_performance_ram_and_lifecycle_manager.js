/**
 * ============================================================================
 * ⚡ MODULE 47: QUẢN LÝ HIỆU NĂNG, DỌN RAM & TỰ NGỦ THÔNG MINH (AUTO-SLEEP)
 * (mod47_performance_ram_and_lifecycle_manager.js — v116.0)
 * ============================================================================
 * Nhiệm vụ:
 *  1. Tự động nhận biết khi người dùng rời khỏi cửa sổ / chuyển Tab / ẩn trình duyệt
 *     để TẠM NGỦ các tiến trình đồ họa & dọn RAM (Canvas 60FPS, Video Tutorial,
 *     Desmos Graphing, ĐăngLovePDF Blob URLs, Traffic Heartbeat...) tránh tràn RAM & lag.
 *  2. BẢO VỆ TUYỆT ĐỐI các dịch vụ chạy ngầm thiết yếu khi người dùng đang bật:
 *     - Nhạc MP3 & Âm thanh không gian nền (Mod 21)
 *     - YouTube phát nền / Cửa sổ nổi PiP (Mod 39)
 *     - Đồng hồ tập trung Pomodoro (Mod 20)
 *     - Đồng hồ & Báo thức hẹn giờ (Mod 42)
 *     - Tự lưu 3 tầng & Khiên chống mất dữ liệu (Mod 09, Mod 36)
 *  3. Cung cấp Bảng Công Tắc Tắt / Bật từng Module & Chức năng ngay trong Tab 6
 *     cùng chế độ 1 chạm "Tiết Kiệm RAM Tối Đa" và nút "Dọn RAM Ngay".
 *  4. Kiến trúc 100% hướng sự kiện (Event-Driven — KHÔNG dùng vòng lặp nền rAF/setInterval).
 * ============================================================================
 */
(function initMod47PerformanceAndLifecycleManager(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});
  if (NS.__MOD47_PERF_MANAGER_LOADED__) return;
  NS.__MOD47_PERF_MANAGER_LOADED__ = true;

  const STORAGE_KEY = 'noir_v116_perf_lifecycle_prefs_v1';

  const DEFAULT_PREFS = Object.freeze({
    preset: 'balanced', // 'balanced' | 'ultra_lite' | 'full'
    autoSleepOnHidden: true,
    autoCleanupOnModalClose: true,
    disabledFeatures: {
      ambient_particles: false,
      weather_sky_3d: false,
      yt_motion_bg: false,
      mascot_bi8: false,
      traffic_analytics: false,
      keyboard_asmr: false,
    },
  });

  const TOGGLEABLE_MODULES = Object.freeze([
    {
      key: 'ambient_particles',
      icon: '✨',
      name: 'Hạt ánh sáng, Mưa rơi & Lấp lánh nền 60FPS (Mod 22 & 32)',
      desc: 'Tắt nếu muốn tiết kiệm GPU/PIN tối đa khi viết truyện dài trên máy yếu hoặc điện thoại.',
    },
    {
      key: 'weather_sky_3d',
      icon: '🌤️',
      name: 'Bầu trời Thời tiết 3D 60FPS theo giờ thực (Mod 43)',
      desc: 'Tắt hiệu ứng mây, mưa, sao trời phủ nền để giảm tải vẽ lại khung hình.',
    },
    {
      key: 'yt_motion_bg',
      icon: '🎬',
      name: 'Nền Video YouTube Chuyển Động 16:9 (Mod 40)',
      desc: 'Tắt lớp video YouTube chạy phủ phía sau chữ (không ảnh hưởng khung phát nhạc YouTube chính).',
    },
    {
      key: 'mascot_bi8',
      icon: '🎱',
      name: 'Linh vật Viên Bi Số 8 nổi góc màn hình (Mod 27)',
      desc: 'Ẩn bong bóng Viên Bi Số 8 khi không dùng để giao diện thoáng sạch hơn.',
    },
    {
      key: 'traffic_analytics',
      icon: '📊',
      name: 'Bộ đếm lượt truy cập & nhịp tim thống kê (Mod 44)',
      desc: 'Ngừng gửi nhịp tim thống kê định kỳ để tiết kiệm kết nối mạng và CPU nền.',
    },
    {
      key: 'keyboard_asmr',
      icon: '⌨️',
      name: 'Âm thanh gõ phím cơ ASMR khi soạn thảo (Mod 21)',
      desc: 'Tắt bộ tổng hợp âm gõ phím để giảm thao tác WebAudio trên từng phím bấm.',
    },
  ]);

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class PerformanceAndLifecycleManager {
    constructor() {
      this.prefs = this.loadPrefs();
      this._sleepingVisuals = false;
      this._lastCleanupCount = 0;
      this._lastCleanupAt = 0;
      this._initialized = false;
      this._activeSubTab = 'perf'; // 'perf' | 'speed' | 'storage'
      this._speedState = { running: false, progress: 0, status: '', result: null };
      this._storageState = {
        scanning: false,
        scanned: false,
        platformLabel: '',
        isGuestWeb: false,
        hasDiskFolder: false,
        diskFolderName: '',
        systemBytes: 0,
        userBytes: 0,
        quotaBytes: 0,
        files: [], // { id, source: 'disk'|'idb'|'ls', folder, name, size, modifiedAt, parentHandle, dbName, storeName, keyName }
        selectedIds: new Set(),
        folderFilter: 'all',
        sortBy: 'size_desc', // 'date_desc' | 'date_asc' | 'size_desc' | 'size_asc' | 'name_asc'
      };
    }

    loadPrefs() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return this._cloneDefaults();
        const parsed = JSON.parse(raw);
        return {
          preset: ['balanced', 'ultra_lite', 'full'].includes(parsed?.preset)
            ? parsed.preset
            : 'balanced',
          autoSleepOnHidden: parsed?.autoSleepOnHidden !== false,
          autoCleanupOnModalClose: parsed?.autoCleanupOnModalClose !== false,
          disabledFeatures: {
            ...DEFAULT_PREFS.disabledFeatures,
            ...(parsed?.disabledFeatures || {}),
          },
        };
      } catch (_e) {
        return this._cloneDefaults();
      }
    }

    _cloneDefaults() {
      return {
        preset: DEFAULT_PREFS.preset,
        autoSleepOnHidden: DEFAULT_PREFS.autoSleepOnHidden,
        autoCleanupOnModalClose: DEFAULT_PREFS.autoCleanupOnModalClose,
        disabledFeatures: { ...DEFAULT_PREFS.disabledFeatures },
      };
    }

    savePrefs() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
      } catch (_e) {}
    }

    isFeatureDisabled(featureKey) {
      return Boolean(this.prefs?.disabledFeatures?.[featureKey]);
    }

    setFeatureEnabled(featureKey, enabled) {
      if (!this.prefs.disabledFeatures) this.prefs.disabledFeatures = {};
      this.prefs.disabledFeatures[featureKey] = !enabled;
      this.prefs.preset = 'balanced';
      this.savePrefs();
      this.applyAllFeatureStates();
      this.refreshPanelUI();
    }

    applyPreset(presetId) {
      if (presetId === 'ultra_lite') {
        this.prefs.preset = 'ultra_lite';
        this.prefs.autoSleepOnHidden = true;
        this.prefs.autoCleanupOnModalClose = true;
        this.prefs.disabledFeatures = {
          ambient_particles: true,
          weather_sky_3d: true,
          yt_motion_bg: true,
          mascot_bi8: false,
          traffic_analytics: true,
          keyboard_asmr: true,
        };
      } else if (presetId === 'full') {
        this.prefs.preset = 'full';
        this.prefs.autoSleepOnHidden = true;
        this.prefs.autoCleanupOnModalClose = true;
        this.prefs.disabledFeatures = {
          ambient_particles: false,
          weather_sky_3d: false,
          yt_motion_bg: false,
          mascot_bi8: false,
          traffic_analytics: false,
          keyboard_asmr: false,
        };
      } else {
        this.prefs.preset = 'balanced';
        this.prefs.autoSleepOnHidden = true;
        this.prefs.autoCleanupOnModalClose = true;
        this.prefs.disabledFeatures = { ...DEFAULT_PREFS.disabledFeatures };
      }
      this.savePrefs();
      this.applyAllFeatureStates();
      if (presetId === 'ultra_lite') {
        this.runCleanupNow(true);
      }
      this.refreshPanelUI();
      this.toast(
        presetId === 'ultra_lite'
          ? '🪶 Đã bật Chế độ Tiết Kiệm RAM Tối Đa — đã tạm tắt hiệu ứng 60FPS & giữ nguyên nhạc nền, YouTube, Pomodoro!'
          : presetId === 'full'
            ? '✨ Đã bật Đầy Đủ Hiệu Ứng & Công Cụ!'
            : '⚡ Đã chuyển sang chế độ Cân Bằng Thông Minh (Tự ngủ khi thoát)!',
        'success'
      );
    }

    toast(msg, tone = 'info') {
      try {
        if (NS.utils && typeof NS.utils.showToast === 'function') {
          NS.utils.showToast(msg, tone, 3200);
        }
      } catch (_e) {}
    }

    /**
     * Áp dụng trạng thái Bật / Tắt cho từng tính năng không thiết yếu
     * (Tuyệt đối KHÔNG ngắt nhạc MP3 nền, YouTube nền/PiP, Pomodoro, Báo thức hay Tự lưu!)
     */
    applyAllFeatureStates() {
      const dis = this.prefs.disabledFeatures || {};

      // 1. Hạt ánh sáng & Mưa rơi 60FPS (Mod 22) + Shimmer (Mod 32)
      try {
        const particleCanvas = document.getElementById('ambient-particle-canvas');
        if (dis.ambient_particles) {
          NS.ambientCanvas?.stop?.();
          NS.typographyEngine?.ambientCanvas?.stop?.();
          if (particleCanvas) particleCanvas.style.display = 'none';
        } else if (!this._sleepingVisuals) {
          if (particleCanvas) particleCanvas.style.display = '';
        }
      } catch (_e) {}

      // 2. Bầu trời thời tiết 3D 60FPS (Mod 43)
      try {
        const skyCanvas = document.getElementById('mod43-weather-sky-canvas');
        if (dis.weather_sky_3d) {
          NS.weatherSkyEngine?.stop?.();
          NS.weatherSkyEngine?.pause?.();
          if (skyCanvas) skyCanvas.style.display = 'none';
        } else if (!this._sleepingVisuals) {
          if (skyCanvas) skyCanvas.style.display = '';
        }
      } catch (_e) {}

      // 3. Nền Video YouTube 16:9 (Mod 40) — chỉ tắt lớp phủ nền, giữ nguyên rạp phát & âm thanh chính Mod 39
      try {
        if (dis.yt_motion_bg) {
          NS.youtubeMotionBg?.clearBackground?.();
        }
      } catch (_e) {}

      // 4. Linh vật Viên Bi Số 8 nổi (Mod 27)
      try {
        const mascotFab =
          document.getElementById('s11-mascot-bi-corner') ||
          document.getElementById('mascot-bi8-fab-container') ||
          document.getElementById('btn-mascot-bi8-trigger');
        if (mascotFab) {
          mascotFab.style.display = dis.mascot_bi8 ? 'none' : '';
        }
      } catch (_e) {}

      // 5. Âm thanh gõ phím cơ ASMR (Mod 21)
      try {
        if (dis.keyboard_asmr) {
          const sel = document.getElementById('select-typing-asmr');
          if (sel && sel.value !== 'off') {
            sel.value = 'off';
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      } catch (_e) {}
    }

    /**
     * Tạm ngủ các vòng lặp đồ họa khi ẩn trang / chuyển cửa sổ
     * (Giữ nguyên nhạc nền, YouTube PiP/Audio, Pomodoro, Báo thức!)
     */
    handleVisibilityChange() {
      if (!this.prefs.autoSleepOnHidden) return;
      const hidden = Boolean(document.hidden);
      this._sleepingVisuals = hidden;
      if (hidden) {
        // Dừng Video Tutorial nếu đang phát (tránh chạy canvas & đọc ngầm khi ẩn tab)
        try {
          if (NS.videoTutorial?.player?.isPlaying) {
            NS.videoTutorial.player.pause?.();
          }
        } catch (_e) {}
        // Dừng vòng lặp slider Desmos (Mod 45)
        try {
          NS.scientificCalc?.pauseBackgroundActivity?.();
        } catch (_e) {}
        // Tạm dừng hiệu ứng hạt / thời tiết khi trình duyệt ẩn
        try {
          NS.ambientCanvas?.pause?.();
          NS.weatherSkyEngine?.pause?.();
        } catch (_e) {}
      } else {
        this.applyAllFeatureStates();
      }
      this.refreshPanelUI();
    }

    /**
     * Tự ngủ & dọn tiến trình phụ khi người dùng chuyển sang Tab khác
     */
    handleScreenChange(nextScreenId) {
      if (!this.prefs.autoCleanupOnModalClose) return;
      // Rời Tab 6 -> dừng Video Tutorial + giọng đọc & dừng slider đồ thị Desmos
      if (nextScreenId && nextScreenId !== 'SCREEN_6_SYSTEM') {
        try {
          if (NS.videoTutorial?.player?.isPlaying) {
            NS.videoTutorial.player.pause?.();
          }
          NS.neuralVoice?.stop?.();
        } catch (_e) {}
        try {
          NS.scientificCalc?.pauseBackgroundActivity?.();
        } catch (_e) {}
      }
      this.refreshPanelUI();
    }

    /**
     * Dọn RAM tức thì: giải phóng bộ đệm file PDF/ảnh đã đóng, dừng tiến trình đồ họa thừa
     */
    runCleanupNow(silent = false) {
      let cleaned = 0;

      // 1. Giải phóng bộ đệm ĐăngLovePDF nếu cửa sổ đang đóng
      try {
        const pdfModal = document.getElementById('modal-mod46-danglovepdf-studio');
        if ((!pdfModal || pdfModal.classList.contains('hidden')) && NS.dangLovePdf?.resetWorkspaceState) {
          NS.dangLovePdf.resetWorkspaceState();
          cleaned += 1;
        }
      } catch (_e) {}

      // 2. Dừng Video Tutorial & giải phóng hàng đợi giọng đọc nếu không xem
      try {
        const tab6 = document.getElementById('s14-screen-6-system');
        const tab6Hidden = !tab6 || tab6.classList.contains('hidden');
        if (tab6Hidden && NS.videoTutorial?.player?.isPlaying) {
          NS.videoTutorial.player.pause?.();
          cleaned += 1;
        }
      } catch (_e) {}

      // 3. Dừng vòng lặp đồ thị Desmos nếu không mở máy tính
      try {
        NS.scientificCalc?.pauseBackgroundActivity?.();
        cleaned += 1;
      } catch (_e) {}

      // 4. Thu gọn bớt lịch sử Undo dư thừa trong bộ nhớ nếu quá dài
      try {
        if (Array.isArray(NS.autosave?.undoStack) && NS.autosave.undoStack.length > 40) {
          NS.autosave.undoStack = NS.autosave.undoStack.slice(-40);
          cleaned += 1;
        }
      } catch (_e) {}

      // 5. Đảm bảo trạng thái tắt/bật module được áp dụng chuẩn
      this.applyAllFeatureStates();

      this._lastCleanupCount = cleaned;
      this._lastCleanupAt = Date.now();
      this.refreshPanelUI();

      if (!silent) {
        this.toast(
          '🧹 Đã dọn dẹp RAM & dừng toàn bộ tiến trình đồ họa thừa! (Nhạc nền, YouTube, Pomodoro & Tự lưu vẫn hoạt động bình thường)',
          'success'
        );
      }
      return cleaned;
    }

    getEssentialServicesStatus() {
      const mp3Playing = Boolean(
        NS.audioEngine?.isPlaying ||
        document.querySelector('#mp3-audio-el')?.paused === false
      );
      const ytPlaying = Boolean(
        NS.youtubePlayer?.playerCtrl?.isPlaying ||
        NS.youtubePlayer?.playerCtrl?._activePipSyncSid
      );
      const pomoRunning = Boolean(
        NS.pomodoro?.isRunning || NS.pomodoroEngine?.isRunning
      );
      const alarmArmed = Boolean(
        NS.worldClockAlarm?.alarms?.some?.((a) => a && a.enabled)
      );
      return [
        { icon: '🎵', label: 'Nhạc MP3 & Âm thanh nền (Mod 21)', active: mp3Playing },
        { icon: '📺', label: 'YouTube Nền & Cửa sổ nổi PiP (Mod 39)', active: ytPlaying },
        { icon: '🍅', label: 'Đồng hồ Pomodoro tập trung (Mod 20)', active: pomoRunning },
        { icon: '⏰', label: 'Báo thức & Giờ quốc tế (Mod 42)', active: alarmArmed },
        { icon: '🛡️', label: 'Tự lưu 3 tầng & Chống mất bài (Mod 09/36)', active: true },
      ];
    }

    getRamBadgeText() {
      try {
        const mem = globalScope.performance?.memory;
        if (mem && Number(mem.usedJSHeapSize) > 0) {
          const usedMb = (mem.usedJSHeapSize / (1024 * 1024)).toFixed(1);
          const limitMb = (mem.jsHeapSizeLimit / (1024 * 1024)).toFixed(0);
          return `RAM trình duyệt: ${usedMb} MB / ${limitMb} MB`;
        }
      } catch (_e) {}
      return 'Chế độ tối ưu RAM tự động: Đang hoạt động';
    }

    mountTab6Card() {
      if (document.getElementById('tab6-acc-perf-ram-manager')) {
        this.refreshPanelUI();
        return;
      }
      const fontBar = document.getElementById('tab6-system-font-scale-bar');
      const tab6 =
        document.getElementById('s14-screen-6-system') ||
        fontBar?.parentElement ||
        null;
      if (!tab6) return;
      const card = document.createElement('div');
      card.id = 'tab6-acc-perf-ram-manager';
      card.className =
        'rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-950/45 via-zinc-900 to-slate-950/75 p-4 sm:p-5 shadow-xl space-y-3';
      card.innerHTML = `
        <button type="button" id="btn-toggle-tab6-perf-ram" data-noir-collapse-target="tab6-perf-ram-body" data-noir-collapse-key="tab6_acc_perf_ram" aria-expanded="false" class="noir-collapse-toggle w-full text-left flex flex-wrap items-center justify-between gap-2 cursor-pointer">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-cyan-400 text-zinc-950 font-black text-[10px] tracking-wide">⚡ HIỆU NĂNG · DUNG LƯỢNG · MẠNG</span>
              <h3 class="text-sm sm:text-base font-black text-cyan-200 uppercase">Quản lý hiệu năng, dung lượng app và test tốc độ mạng (Mod 47)</h3>
            </div>
            <p class="text-[11px] text-zinc-300 mt-1">Theo dõi RAM &amp; Tự ngủ thông minh, kiểm tra tốc độ mạng thực tế (Ping/Download) và quản lý dung lượng tệp hệ thống / dữ liệu người dùng.</p>
          </div>
          <span class="noir-collapse-chevron px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-[11px] font-extrabold shrink-0"><span class="noir-collapse-arrow">▾</span> <span class="noir-collapse-state-label">Mở rộng</span></span>
        </button>
        <div id="tab6-perf-ram-body" class="hidden pt-3 border-t border-cyan-500/25 space-y-4"></div>
      `;

      if (fontBar && fontBar.parentElement) {
        fontBar.insertAdjacentElement('afterend', card);
      } else {
        tab6.appendChild(card);
      }

      const toggleBtn = card.querySelector('#btn-toggle-tab6-perf-ram');
      const bodyEl = card.querySelector('#tab6-perf-ram-body');
      const stateLblEl = card.querySelector('.noir-collapse-state-label');
      const arrowEl = card.querySelector('.noir-collapse-arrow');
      const syncToggleUi = () => {
        if (!bodyEl || !toggleBtn) return;
        const isHidden = bodyEl.classList.contains('hidden');
        toggleBtn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
        if (stateLblEl) stateLblEl.textContent = isHidden ? 'Mở rộng' : 'Thu gọn';
        if (arrowEl) arrowEl.textContent = isHidden ? '▾' : '▴';
        if (!isHidden) this.refreshPanelUI();
      };
      if (toggleBtn) {
        // Đánh dấu đã gắn bộ lắng nghe chuẩn để mod29.refreshBindings() không gắn trùng click gây tự triệt tiêu
        toggleBtn.dataset.mod29CollapseBound = '1';
        toggleBtn.addEventListener('click', (ev) => {
          ev.stopImmediatePropagation();
          if (!bodyEl) return;
          bodyEl.classList.toggle('hidden');
          syncToggleUi();
        });
      }
      // Đồng bộ nhãn mũi tên mỗi khi người dùng bấm "Thu gọn tất cả" hoặc "Mở rộng tất cả" ở Tab 6
      document.getElementById('btn-tab6-collapse-all')?.addEventListener('click', () => {
        bodyEl?.classList.add('hidden');
        syncToggleUi();
      });
      document.getElementById('btn-tab6-expand-all')?.addEventListener('click', () => {
        bodyEl?.classList.remove('hidden');
        syncToggleUi();
      });

      this.refreshPanelUI();
    }

    openPerfManagerPanel() {
      try {
        if (NS.navigator?.navigateToScreen) {
          NS.navigator.navigateToScreen('SCREEN_6_SYSTEM');
        } else {
          document.querySelector('[data-s14-tab="SCREEN_6_SYSTEM"]')?.click?.();
        }
      } catch (_e) {}
      this.mountTab6Card();
      const bodyEl = document.getElementById('tab6-perf-ram-body');
      const toggleBtn = document.getElementById('btn-toggle-tab6-perf-ram');
      if (bodyEl && bodyEl.classList.contains('hidden')) {
        bodyEl.classList.remove('hidden');
        toggleBtn?.setAttribute('aria-expanded', 'true');
        const ch = toggleBtn?.querySelector('.noir-collapse-chevron');
        if (ch) ch.textContent = '▲ Thu gọn';
      }
      this.refreshPanelUI();
      document.getElementById('tab6-acc-perf-ram-manager')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    formatSize(bytes) {
      const b = Math.max(0, Number(bytes) || 0);
      if (b < 1024) return `${Math.round(b)} B`;
      if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
      if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
      return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    formatDate(ts) {
      if (!ts) return '—';
      try {
        return new Date(ts).toLocaleString('vi-VN', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
      } catch (_e) {
        return '—';
      }
    }

    detectPlatformInfo() {
      const isElectron = Boolean(globalScope.NoirDesktopLocalEngine || /Electron/i.test(navigator.userAgent || ''));
      const isCapacitor = Boolean(globalScope.Capacitor?.isNativePlatform?.());
      const isStandalonePwa = Boolean(globalScope.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone);
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      const isGuest = Boolean(NS.guestMode?.isGuestModeActive?.() || document.body?.classList?.contains('noir-guest-demo-active'));
      const dirHandle = NS.localFs?.rootDirHandle || NS.fsEngine?.rootDirHandle || null;

      let label = '🌐 Bản Web Trình Duyệt';
      if (isElectron) label = '🖥️ Bản Ứng Dụng Desktop (Electron)';
      else if (isCapacitor) label = '📱 Bản Ứng Dụng Mobile Cài Đặt (Capacitor)';
      else if (isStandalonePwa) label = isMobile ? '📱 Bản Ứng Dụng PWA trên Điện Thoại' : '🖥️ Bản Ứng Dụng PWA trên Máy Tính';
      else if (isMobile) label = '📱 Bản Web trên Điện Thoại';
      else label = '💻 Bản Web trên Máy Tính';
      if (isGuest) label += ' · Chế độ Khách (Dùng thử)';

      return { isElectron, isCapacitor, isStandalonePwa, isMobile, isGuest, dirHandle, label };
    }

    // ------------------------------------------------------------------------
    // BÀI TEST TỐC ĐỘ MẠNG THỰC TẾ (PING / JITTER / DOWNLOAD MBPS / ỔN ĐỊNH)
    // ------------------------------------------------------------------------
    async runNetworkSpeedTest() {
      if (this._speedState.running) return;
      this._speedState = { running: true, progress: 8, status: '⏳ Bước 1/3: Đang đo độ trễ (Ping & Jitter)...', result: null };
      this.refreshPanelUI();

      const updateStep = (progress, status) => {
        this._speedState.progress = progress;
        this._speedState.status = status;
        const bar = document.getElementById('mod47-speed-bar');
        const lbl = document.getElementById('mod47-speed-status');
        if (bar) bar.style.width = `${progress}%`;
        if (lbl) lbl.textContent = status;
      };

      try {
        // 1. Đo Ping & Jitter (5 lần gửi yêu cầu nhẹ không dùng cache)
        const pings = [];
        for (let i = 0; i < 5; i++) {
          const t0 = performance.now();
          try {
            await fetch(`https://speed.cloudflare.com/__down?bytes=0&t=${Date.now()}_${i}`, { cache: 'no-store' });
            pings.push(Math.max(1, Math.round(performance.now() - t0)));
          } catch (_eP) {
            try {
              const t1 = performance.now();
              await fetch(`https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/package.json?t=${Date.now()}_${i}`, { cache: 'no-store' });
              pings.push(Math.max(1, Math.round(performance.now() - t1)));
            } catch (_eP2) {}
          }
          updateStep(12 + i * 5, `⏳ Bước 1/3: Đang đo Ping lần ${i + 1}/5...`);
        }
        pings.sort((a, b) => a - b);
        const pingMs = pings.length ? pings[Math.floor(pings.length / 2)] : null;
        let jitterMs = 0;
        if (pings.length >= 2) {
          let diffSum = 0;
          for (let i = 1; i < pings.length; i++) diffSum += Math.abs(pings[i] - pings[i - 1]);
          jitterMs = Math.round(diffSum / (pings.length - 1));
        }

        // 2. Đo Tốc độ Tải xuống (Download Mbps — tải dần 3 gói 350KB -> 1MB -> 2MB)
        const dlSamples = [];
        const sizes = [350000, 1000000, 2000000];
        for (let i = 0; i < sizes.length; i++) {
          const sz = sizes[i];
          updateStep(40 + i * 16, `⏳ Bước 2/3: Đang đo tốc độ tải xuống (${Math.round(sz / 1000)} KB)...`);
          const t0 = performance.now();
          let gotBytes = 0;
          try {
            const resp = await fetch(`https://speed.cloudflare.com/__down?bytes=${sz}&t=${Date.now()}_${i}`, { cache: 'no-store' });
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              gotBytes = buf.byteLength;
            }
          } catch (_eCf) {
            try {
              const resp2 = await fetch(`https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js?t=${Date.now()}_${i}`, { cache: 'no-store' });
              if (resp2.ok) {
                const buf2 = await resp2.arrayBuffer();
                gotBytes = buf2.byteLength;
              }
            } catch (_eJs) {}
          }
          const sec = Math.max(0.01, (performance.now() - t0) / 1000);
          if (gotBytes > 10000) {
            const mbps = (gotBytes * 8) / (sec * 1e6);
            dlSamples.push(mbps);
            // Nếu mạng chậm (< 3 Mbps), dừng sớm không tải gói 2MB tránh chờ lâu
            if (mbps < 3 && i >= 1) break;
          }
        }
        const downloadMbps = dlSamples.length
          ? Number((dlSamples.reduce((a, b) => a + b, 0) / dlSamples.length).toFixed(2))
          : 0;

        // 3. Đánh giá tốc độ phản hồi tải lên & thông số đường truyền thiết bị
        updateStep(92, '⏳ Bước 3/3: Đang phân tích chất lượng đường truyền...');
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
        const estUploadMbps = downloadMbps > 0 ? Number(Math.max(0.5, downloadMbps * 0.42).toFixed(2)) : 0;
        let grade = '🔴 Mạng yếu hoặc ngoại tuyến';
        let advice = 'Nên bật chế độ "Tiết Kiệm RAM Tối Đa" và hạn chế tải tài liệu lớn.';
        if (downloadMbps >= 40 && (pingMs == null || pingMs < 80)) {
          grade = '🟢 Siêu nhanh · Tuyệt vời cho AI, YouTube 4K & Đồng bộ Drive';
          advice = 'Đường truyền rất khỏe, mọi tính năng AI, PDF & Video chạy mượt tối đa.';
        } else if (downloadMbps >= 12) {
          grade = '🔵 Tốt · Mượt cho Viết truyện, YouTube HD & Quét tin';
          advice = 'Kết nối ổn định, đáp ứng tốt toàn bộ tính năng của Studio.';
        } else if (downloadMbps >= 3) {
          grade = '🟡 Trung bình · Đủ dùng cơ bản';
          advice = 'Nên tắt nền Video YouTube 60FPS để ưu tiên băng thông cho AI & lưu trữ.';
        }

        this._speedState = {
          running: false,
          progress: 100,
          status: '✅ Hoàn tất kiểm tra tốc độ mạng!',
          result: {
            testedAt: new Date().toLocaleTimeString('vi-VN'),
            online: navigator.onLine !== false,
            pingMs,
            jitterMs,
            downloadMbps,
            estUploadMbps,
            effectiveType: conn?.effectiveType ? String(conn.effectiveType).toUpperCase() : 'Wi-Fi / LAN',
            grade,
            advice,
          },
        };
      } catch (err) {
        this._speedState = {
          running: false,
          progress: 0,
          status: '⚠️ Không thể đo tốc độ mạng lúc này: ' + (err?.message || err),
          result: null,
        };
      }
      this.refreshPanelUI();
    }

    // ------------------------------------------------------------------------
    // QUÉT DUNG LƯỢNG HỆ THỐNG VS DỮ LIỆU NGƯỜI DÙNG & QUẢN LÝ TỆP TRONG THƯ MỤC TỔNG
    // ------------------------------------------------------------------------
    _isHiddenSystemEntry(name, isDir) {
      const n = String(name || '');
      const lower = n.toLowerCase();
      if (lower.startsWith('.')) return true;
      const sysDirs = new Set([
        'node_modules', 'electron', 'scripts', 'modules', 'autotester', 'assets',
        'dist-app', 'release', 'android', 'ios', '.git', '.github', '.vscode', '__pycache__',
      ]);
      if (isDir) return sysDirs.has(lower);
      const sysFiles = new Set([
        'index.html', 'yt_pip_frame.html', 'sw.js', 'manifest.json', 'favicon.ico',
        'package.json', 'package-lock.json', 'capacitor.config.json', 'streamfetcher.js',
        'nativeplayer.js', 'systemfontscale.js', 'miscfunhub.js',
      ]);
      if (sysFiles.has(lower)) return true;
      if (/^(mod\d+|i18n_lang_)/i.test(lower)) return true;
      if (/\.(js|cjs|mjs|css|ts|map|bat|cmd|ps1|sh)$/i.test(lower)) return true;
      return false;
    }

    async scanDeviceStorageAndFiles() {
      if (this._storageState.scanning) return;
      this._storageState.scanning = true;
      this.refreshPanelUI();

      const plat = this.detectPlatformInfo();
      const files = [];
      let systemBytes = 0;
      let userBytes = 0;
      let quotaBytes = 0;

      // 1. Đo dung lượng Lõi Hệ Thống (Service Worker Core Caches — không thể xóa)
      try {
        if (globalScope.caches?.keys) {
          const cacheNames = await globalScope.caches.keys();
          for (const cname of cacheNames) {
            const cache = await globalScope.caches.open(cname);
            const reqs = await cache.keys();
            for (const req of reqs) {
              try {
                const resp = await cache.match(req);
                const cl = Number(resp?.headers?.get?.('content-length') || 0);
                if (cl > 0) systemBytes += cl;
                else if (resp) {
                  const blob = await resp.clone().blob();
                  systemBytes += blob.size || 0;
                }
              } catch (_eCm) {}
            }
          }
        }
      } catch (_eCache) {}

      // Ước tính tối thiểu lõi hệ thống nếu trình duyệt chưa kích hoạt SW cache (VD: localhost dev)
      if (systemBytes < 500000) {
        systemBytes = Math.max(systemBytes, 14.2 * 1024 * 1024); // ~14.2 MB mã nguồn + icon + tài nguyên hệ thống
      }

      // 2. Đo dung lượng Bộ nhớ trình duyệt (navigator.storage.estimate + localStorage + IndexedDB)
      try {
        if (navigator.storage?.estimate) {
          const est = await navigator.storage.estimate();
          quotaBytes = Number(est.quota || 0);
          const totalBrowserUsage = Number(est.usage || 0);
          const estIdb = Math.max(0, totalBrowserUsage - (est.usageDetails?.caches || 0));
          if (estIdb > 0) userBytes += estIdb;
        }
      } catch (_eEst) {}

      // Đo localStorage (dữ liệu cài đặt & lịch sử người dùng)
      let lsBytes = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          const v = localStorage.getItem(k) || '';
          lsBytes += (k.length + v.length) * 2;
        }
      } catch (_eLs) {}
      if (lsBytes > 0) {
        files.push({
          id: 'ls_user_prefs',
          source: 'ls',
          folder: 'Bộ nhớ Trình duyệt (Cài đặt & Từ vựng)',
          name: 'Cài đặt giao diện, Flashcard & lịch sử cục bộ (localStorage)',
          size: lsBytes,
          modifiedAt: Date.now(),
          deletable: false,
        });
      }

      // 3. Quét tệp thật trong Thư mục làm việc trên máy (File System Access API — BỎ QUA ở Chế độ Khách bản web!)
      let diskBytes = 0;
      const walkDirHandle = async (dirHandle, relFolder, depth = 0) => {
        if (!dirHandle || depth > 4 || files.length > 500) return;
        try {
          for await (const [name, entry] of dirHandle.entries()) {
            const isDir = entry.kind === 'directory';
            if (this._isHiddenSystemEntry(name, isDir)) continue;
            if (isDir) {
              await walkDirHandle(entry, relFolder ? `${relFolder}/${name}` : name, depth + 1);
            } else {
              try {
                const f = await entry.getFile();
                diskBytes += f.size || 0;
                files.push({
                  id: `disk_${relFolder}_${name}_${f.lastModified}`,
                  source: 'disk',
                  folder: relFolder || 'Thư mục gốc',
                  name,
                  size: f.size || 0,
                  modifiedAt: f.lastModified || Date.now(),
                  parentHandle: dirHandle,
                  deletable: true,
                });
              } catch (_eF) {}
            }
          }
        } catch (_eDir) {}
      };

      if (!plat.isGuest && plat.dirHandle) {
        await walkDirHandle(plat.dirHandle, '', 0);
        userBytes += diskBytes;
      }

      // 4. Quét các tệp dữ liệu lớn người dùng lưu trong IndexedDB (Ảnh nền, Video nền, Nhạc MP3, Bản sao lưu, Truyện)
      try {
        if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
          const dbs = await indexedDB.databases();
          for (const dbInfo of (dbs || []).slice(0, 8)) {
            const dbName = dbInfo?.name;
            if (!dbName || /DangLovePDF_FontCache/i.test(dbName)) continue;
            await new Promise((resolve) => {
              try {
                const req = indexedDB.open(dbName);
                req.onsuccess = () => {
                  const db = req.result;
                  const stores = Array.from(db.objectStoreNames || []);
                  if (!stores.length) { db.close(); return resolve(); }
                  let pending = stores.length;
                  const doneStore = () => { if (--pending <= 0) { db.close(); resolve(); } };
                  stores.forEach((storeName) => {
                    try {
                      const tx = db.transaction(storeName, 'readonly');
                      const st = tx.objectStore(storeName);
                      const curReq = st.openCursor();
                      let count = 0;
                      curReq.onsuccess = (ev) => {
                        const cursor = ev.target.result;
                        if (!cursor || count >= 40) return doneStore();
                        count++;
                        const val = cursor.value;
                        let sz = 0;
                        let displayName = String(cursor.key || `item_${count}`);
                        let modAt = Date.now();
                        if (val instanceof Blob) {
                          sz = val.size;
                          displayName = val.name || displayName;
                          modAt = val.lastModified || modAt;
                        } else if (val && typeof val === 'object') {
                          if (val.blob instanceof Blob) sz += val.blob.size;
                          else if (val.file instanceof Blob) sz += val.file.size;
                          else {
                            try { sz = new Blob([JSON.stringify(val)]).size; } catch (_eS) { sz = 512; }
                          }
                          displayName = val.name || val.title || val.fileName || displayName;
                          modAt = val.updatedAt || val.savedAt || val.createdAt || modAt;
                        } else if (typeof val === 'string') {
                          sz = val.length * 2;
                        }
                        if (sz >= 2048) {
                          files.push({
                            id: `idb_${dbName}_${storeName}_${String(cursor.key)}`,
                            source: 'idb',
                            folder: `Kho App (${dbName} / ${storeName})`,
                            name: String(displayName).slice(0, 90),
                            size: sz,
                            modifiedAt: typeof modAt === 'number' ? modAt : Date.parse(modAt) || Date.now(),
                            dbName,
                            storeName,
                            keyName: cursor.key,
                            deletable: true,
                          });
                        }
                        cursor.continue();
                      };
                      curReq.onerror = doneStore;
                    } catch (_eTx) { doneStore(); }
                  });
                };
                req.onerror = () => resolve();
              } catch (_eOpen) { resolve(); }
            });
          }
        }
      } catch (_eIdb) {}

      if (userBytes === 0) {
        userBytes = files.reduce((s, f) => s + (f.size || 0), 0);
      }

      this._storageState = {
        ...this._storageState,
        scanning: false,
        scanned: true,
        platformLabel: plat.label,
        isGuestWeb: plat.isGuest && !plat.isElectron && !plat.isCapacitor,
        hasDiskFolder: Boolean(!plat.isGuest && plat.dirHandle),
        diskFolderName: plat.dirHandle?.name || '',
        systemBytes,
        userBytes,
        quotaBytes,
        files,
        selectedIds: new Set(),
      };
      this.refreshPanelUI();
    }

    async deleteSelectedStorageFiles() {
      const sel = this._storageState.selectedIds;
      if (!sel || sel.size === 0) return;
      const targets = this._storageState.files.filter((f) => f.deletable && sel.has(f.id));
      if (!targets.length) return;

      const totalSz = targets.reduce((s, f) => s + (f.size || 0), 0);
      const ok = globalScope.confirm(
        `⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${targets.length} tệp đã chọn (giải phóng ${this.formatSize(totalSz)})?\n(Tệp lõi hệ thống không bao giờ bị ảnh hưởng.)`
      );
      if (!ok) return;

      let deletedCount = 0;
      for (const f of targets) {
        try {
          if (f.source === 'disk' && f.parentHandle && typeof f.parentHandle.removeEntry === 'function') {
            await f.parentHandle.removeEntry(f.name);
            deletedCount++;
          } else if (f.source === 'idb' && f.dbName && f.storeName) {
            await new Promise((resolve) => {
              const req = indexedDB.open(f.dbName);
              req.onsuccess = () => {
                const db = req.result;
                try {
                  const tx = db.transaction(f.storeName, 'readwrite');
                  tx.objectStore(f.storeName).delete(f.keyName);
                  tx.oncomplete = () => { db.close(); deletedCount++; resolve(); };
                  tx.onerror = () => { db.close(); resolve(); };
                } catch (_eD) { db.close(); resolve(); }
              };
              req.onerror = () => resolve();
            });
          }
        } catch (_eDel) {}
      }

      NS.utils?.showToast?.(`🗑️ Đã xóa thành công ${deletedCount}/${targets.length} tệp người dùng!`, 'success', 3200);
      await this.scanDeviceStorageAndFiles();
    }

    _getFilteredSortedStorageFiles() {
      const st = this._storageState;
      let arr = (st.files || []).filter((f) => st.folderFilter === 'all' || f.folder === st.folderFilter);
      const sort = st.sortBy || 'size_desc';
      arr = arr.slice().sort((a, b) => {
        if (sort === 'size_desc') return (b.size || 0) - (a.size || 0);
        if (sort === 'size_asc') return (a.size || 0) - (b.size || 0);
        if (sort === 'date_desc') return (b.modifiedAt || 0) - (a.modifiedAt || 0);
        if (sort === 'date_asc') return (a.modifiedAt || 0) - (b.modifiedAt || 0);
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
      return arr;
    }

    _renderSpeedTabHtml() {
      const sp = this._speedState;
      const r = sp.result;
      return `
        <div class="space-y-3">
          <div class="p-4 rounded-2xl bg-zinc-950/85 border border-sky-500/40 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="text-sm font-black text-sky-300">📶 Kiểm Tra Tốc Độ Mạng Thực Tế (Ping · Jitter · Tải xuống)</div>
                <div class="text-xs text-zinc-400">Đo trực tiếp qua máy chủ biên toàn cầu (Cloudflare Edge) — chỉ chạy khi bạn bấm nút.</div>
              </div>
              <button type="button" id="btn-mod47-run-speedtest" ${sp.running ? 'disabled' : ''} class="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-lg cursor-pointer">
                ${sp.running ? '⏳ Đang đo tốc độ...' : '🚀 Chạy kiểm tra tốc độ mạng ngay'}
              </button>
            </div>
            ${sp.running || sp.status ? `
              <div class="space-y-1.5">
                <div class="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div id="mod47-speed-bar" class="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 transition-all" style="width:${sp.progress}%"></div>
                </div>
                <div id="mod47-speed-status" class="text-xs font-bold text-cyan-300">${escHtml(sp.status)}</div>
              </div>
            ` : ''}
          </div>

          ${r ? `
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div class="p-3 rounded-xl bg-gradient-to-br from-emerald-950/70 to-zinc-950 border border-emerald-500/45">
                <div class="text-[11px] font-bold text-emerald-300">⬇️ Tốc độ Tải xuống</div>
                <div class="text-xl font-black text-white mt-0.5">${r.downloadMbps} <span class="text-xs font-bold text-emerald-300">Mbps</span></div>
              </div>
              <div class="p-3 rounded-xl bg-gradient-to-br from-sky-950/70 to-zinc-950 border border-sky-500/45">
                <div class="text-[11px] font-bold text-sky-300">📡 Độ trễ (Ping)</div>
                <div class="text-xl font-black text-white mt-0.5">${r.pingMs ?? '—'} <span class="text-xs font-bold text-sky-300">ms</span></div>
              </div>
              <div class="p-3 rounded-xl bg-gradient-to-br from-violet-950/70 to-zinc-950 border border-violet-500/45">
                <div class="text-[11px] font-bold text-violet-300">〰️ Dao động (Jitter)</div>
                <div class="text-xl font-black text-white mt-0.5">${r.jitterMs} <span class="text-xs font-bold text-violet-300">ms</span></div>
              </div>
              <div class="p-3 rounded-xl bg-gradient-to-br from-amber-950/70 to-zinc-950 border border-amber-500/45">
                <div class="text-[11px] font-bold text-amber-300">⬆️ Tải lên (ước tính)</div>
                <div class="text-xl font-black text-white mt-0.5">~${r.estUploadMbps} <span class="text-xs font-bold text-amber-300">Mbps</span></div>
              </div>
            </div>
            <div class="p-3.5 rounded-xl bg-zinc-950/85 border border-emerald-500/35 space-y-1 text-xs">
              <div class="font-black text-white">${escHtml(r.grade)}</div>
              <div class="text-zinc-300">${escHtml(r.advice)}</div>
              <div class="text-[11px] text-zinc-400">Loại mạng thiết bị báo: <b>${escHtml(r.effectiveType)}</b> · Đo lúc: ${escHtml(r.testedAt)}</div>
            </div>
          ` : ''}
        </div>
      `;
    }

    _renderStorageTabHtml() {
      const st = this._storageState;
      const totalUsed = Math.max(1, (st.systemBytes || 0) + (st.userBytes || 0));
      const sysPct = Math.round(((st.systemBytes || 0) / totalUsed) * 100);
      const usrPct = Math.max(0, 100 - sysPct);
      const folders = ['all', ...new Set((st.files || []).map((f) => f.folder))];
      const visibleFiles = this._getFilteredSortedStorageFiles();
      const deletableVisible = visibleFiles.filter((f) => f.deletable);

      return `
        <div class="space-y-3.5">
          <div class="p-4 rounded-2xl bg-zinc-950/85 border border-emerald-500/40 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="text-sm font-black text-emerald-300">💾 Quản Lý Dung Lượng Thiết Bị &amp; Tệp Người Dùng</div>
                <div class="text-xs text-zinc-300 mt-0.5">${escHtml(st.platformLabel || this.detectPlatformInfo().label)}</div>
              </div>
              <button type="button" id="btn-mod47-scan-storage" ${st.scanning ? 'disabled' : ''} class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow cursor-pointer">
                ${st.scanning ? '⏳ Đang quét dung lượng...' : st.scanned ? '🔄 Quét lại dung lượng & tệp' : '🔍 Phân tích dung lượng thiết bị ngay'}
              </button>
            </div>

            ${st.scanned ? `
              <!-- Biểu đồ thanh phân tách 2 phần rõ ràng: Lõi hệ thống (không thể xóa) vs Dữ liệu người dùng -->
              <div class="space-y-2 pt-1">
                <div class="w-full h-3.5 rounded-full bg-zinc-800 overflow-hidden flex">
                  <div style="width:${sysPct}%" class="h-full bg-sky-500" title="Dung lượng Lõi Hệ Thống (Bắt buộc)"></div>
                  <div style="width:${usrPct}%" class="h-full bg-amber-400" title="Dung lượng Dữ Liệu Người Dùng"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  <div class="p-3 rounded-xl bg-sky-950/35 border border-sky-500/40 space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-black text-sky-300">🔒 Lõi Hệ Thống (Bắt buộc · Không thể xóa)</span>
                      <span class="font-black text-white">${this.formatSize(st.systemBytes)}</span>
                    </div>
                    <p class="text-[11px] text-zinc-300 leading-relaxed">
                      Bao gồm mã nguồn vận hành, biểu tượng ứng dụng, hình nền mặc định và bộ đệm ngoại tuyến do hệ thống cung cấp sẵn để web/app chạy ổn định.
                    </p>
                  </div>
                  <div class="p-3 rounded-xl bg-amber-950/35 border border-amber-500/45 space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-black text-amber-300">👤 Dữ Liệu Người Dùng (Có thể dọn dẹp)</span>
                      <span class="font-black text-white">${this.formatSize(st.userBytes)}</span>
                    </div>
                    <p class="text-[11px] text-zinc-300 leading-relaxed">
                      Bao gồm bản thảo, tệp xuất PDF/DOCX, ảnh/video nền bạn tải lên, nhạc MP3 &amp; dữ liệu trong thư mục làm việc ${st.hasDiskFolder ? `("${escHtml(st.diskFolderName)}")` : '(lưu trên trình duyệt)'}.
                    </p>
                  </div>
                </div>
              </div>

              ${st.isGuestWeb ? `
                <div class="p-3 rounded-xl bg-zinc-900/90 border border-zinc-700 text-xs text-zinc-300">
                  ℹ️ Bạn đang ở <b>Chế độ Khách (Bản Web)</b> nên không liên kết thư mục ổ cứng trên máy. Danh sách dưới chỉ hiển thị bộ nhớ tạm trên trình duyệt (nếu có).
                </div>
              ` : ''}

              <!-- Trình quản lý Tệp trong Thư mục Tổng (Ẩn hoàn toàn thư mục mã nguồn hệ thống!) -->
              <div class="space-y-2.5 pt-2 border-t border-zinc-800">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-xs font-black text-cyan-300 uppercase">🗂️ Tệp trong Thư mục Tổng (${visibleFiles.length} tệp · Đã ẩn toàn bộ thư mục mã nguồn)</div>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <select id="sel-mod47-folder-filter" class="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100">
                      ${folders.map((f) => `<option value="${escHtml(f)}" ${f === st.folderFilter ? 'selected' : ''}>${f === 'all' ? '📂 Tất cả thư mục' : '📁 ' + escHtml(f)}</option>`).join('')}
                    </select>
                    <select id="sel-mod47-file-sort" class="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100">
                      <option value="size_desc" ${st.sortBy === 'size_desc' ? 'selected' : ''}>📊 Dung lượng: Lớn → Nhỏ</option>
                      <option value="size_asc" ${st.sortBy === 'size_asc' ? 'selected' : ''}>📊 Dung lượng: Nhỏ → Lớn</option>
                      <option value="date_desc" ${st.sortBy === 'date_desc' ? 'selected' : ''}>🕒 Ngày thêm: Mới nhất</option>
                      <option value="date_asc" ${st.sortBy === 'date_asc' ? 'selected' : ''}>🕒 Ngày thêm: Cũ nhất</option>
                      <option value="name_asc" ${st.sortBy === 'name_asc' ? 'selected' : ''}>🔤 Tên tệp: A → Z</option>
                    </select>
                  </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <button type="button" id="btn-mod47-sel-all-files" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[11px] font-bold cursor-pointer">☑️ Chọn tất cả (${deletableVisible.length})</button>
                    <button type="button" id="btn-mod47-desel-files" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold cursor-pointer">⬜ Bỏ chọn</button>
                  </div>
                  <button type="button" id="btn-mod47-delete-sel-files" ${st.selectedIds.size === 0 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${st.selectedIds.size > 0 ? 'bg-rose-600 hover:bg-rose-500 text-white shadow' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}">
                    🗑️ Xóa tệp đã chọn (${st.selectedIds.size})
                  </button>
                </div>

                ${visibleFiles.length ? `
                  <div class="max-h-72 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/90">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead class="sticky top-0 bg-zinc-900 text-zinc-300">
                        <tr>
                          <th class="p-2 w-8">✓</th>
                          <th class="p-2">Tệp &amp; Thư mục chứa</th>
                          <th class="p-2 whitespace-nowrap">Ngày thêm / Sửa</th>
                          <th class="p-2 text-right whitespace-nowrap">Dung lượng</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${visibleFiles.slice(0, 150).map((f) => `
                          <tr class="border-t border-zinc-800/80 hover:bg-zinc-900/70">
                            <td class="p-2">
                              ${f.deletable ? `<input type="checkbox" data-mod47-file-chk="${escHtml(f.id)}" ${st.selectedIds.has(f.id) ? 'checked' : ''} class="w-4 h-4 accent-rose-500 cursor-pointer" />` : '<span title="Hệ thống bảo vệ">🔒</span>'}
                            </td>
                            <td class="p-2 min-w-0">
                              <div class="font-bold text-zinc-100 truncate max-w-[260px] sm:max-w-[380px]" title="${escHtml(f.name)}">${escHtml(f.name)}</div>
                              <div class="text-[10.5px] text-cyan-400/90">📁 ${escHtml(f.folder)}</div>
                            </td>
                            <td class="p-2 text-[11px] text-zinc-400 whitespace-nowrap">${escHtml(this.formatDate(f.modifiedAt))}</td>
                            <td class="p-2 text-right font-mono font-bold text-amber-300 whitespace-nowrap">${this.formatSize(f.size)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : '<div class="p-4 text-center text-xs text-zinc-400 rounded-xl border border-zinc-800">Không tìm thấy tệp dữ liệu người dùng nào trong thư mục này.</div>'}
              </div>
            ` : `
              <div class="p-4 text-center text-xs text-zinc-400 rounded-xl bg-zinc-900/60 border border-zinc-800">
                Bấm nút xanh <b>"🔍 Phân tích dung lượng thiết bị ngay"</b> ở trên để xem chi tiết phần dung lượng Lõi hệ thống (bắt buộc) vs Dữ liệu người dùng và quản lý/xóa tệp trong thư mục tổng.
              </div>
            `}
          </div>
        </div>
      `;
    }

    refreshPanelUI() {
      const body = document.getElementById('tab6-perf-ram-body');
      if (!body) return;

      const essentials = this.getEssentialServicesStatus();
      const ramText = this.getRamBadgeText();
      const disabledCount = Object.values(this.prefs.disabledFeatures || {}).filter(Boolean).length;
      const tab = this._activeSubTab || 'perf';

      const subTabsHtml = `
        <div class="flex flex-wrap gap-1.5 pb-1 border-b border-zinc-800">
          <button type="button" data-mod47-subtab="perf" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${tab === 'perf' ? 'bg-cyan-500 text-zinc-950 shadow' : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-cyan-400'}">⚡ Hiệu năng, RAM &amp; Tự ngủ</button>
          <button type="button" data-mod47-subtab="speed" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${tab === 'speed' ? 'bg-sky-500 text-zinc-950 shadow' : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-sky-400'}">📶 Test tốc độ mạng</button>
          <button type="button" data-mod47-subtab="storage" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${tab === 'storage' ? 'bg-emerald-500 text-zinc-950 shadow' : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-emerald-400'}">💾 Dung lượng app &amp; Quản lý tệp</button>
        </div>
      `;

      const perfTabHtml = `
        <!-- Thanh trạng thái & Nút 1 chạm -->
        <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <div class="space-y-0.5 text-xs">
            <div class="font-extrabold text-emerald-300">📊 ${escHtml(ramText)}</div>
            <div class="text-[11px] text-zinc-400">Đang tắt ${disabledCount}/${TOGGLEABLE_MODULES.length} hiệu ứng phụ · Tự ngủ khi thoát: <strong class="text-cyan-300">${this.prefs.autoSleepOnHidden ? 'ĐANG BẬT' : 'ĐANG TẮT'}</strong></div>
          </div>
          <button type="button" id="btn-mod47-cleanup-ram-now" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition cursor-pointer">
            🧹 Dọn RAM &amp; Dừng Tiến Trình Thừa Ngay
          </button>
        </div>

        <!-- 3 Chế độ hiệu năng 1 chạm -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button type="button" data-mod47-preset="balanced" class="p-3 rounded-xl border text-left transition cursor-pointer ${this.prefs.preset === 'balanced' ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100' : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-600'}">
            <div class="font-black text-xs">⚡ Cân Bằng Thông Minh</div>
            <div class="text-[11px] opacity-80 mt-0.5">Tự ngủ khi thoát/ẩn tab, mượt mà mọi chức năng.</div>
          </button>
          <button type="button" data-mod47-preset="ultra_lite" class="p-3 rounded-xl border text-left transition cursor-pointer ${this.prefs.preset === 'ultra_lite' ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100' : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-600'}">
            <div class="font-black text-xs">🪶 Tiết Kiệm RAM Tối Đa</div>
            <div class="text-[11px] opacity-80 mt-0.5">Tắt hạt 60FPS, bầu trời 3D, nền video; siêu nhẹ cho máy yếu.</div>
          </button>
          <button type="button" data-mod47-preset="full" class="p-3 rounded-xl border text-left transition cursor-pointer ${this.prefs.preset === 'full' ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-600'}">
            <div class="font-black text-xs">✨ Đầy Đủ Hiệu Ứng</div>
            <div class="text-[11px] opacity-80 mt-0.5">Bật tất cả hiệu ứng đồ họa &amp; công cụ hỗ trợ.</div>
          </button>
        </div>

        <!-- Quy tắc tự ngủ thông minh -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <label class="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/75 border border-zinc-800 cursor-pointer">
            <input type="checkbox" id="chk-mod47-autosleep-hidden" class="mt-0.5 accent-cyan-400" ${this.prefs.autoSleepOnHidden ? 'checked' : ''} />
            <span>
              <strong class="text-zinc-100 block">💤 Tự ngủ đồ họa khi ẩn trình duyệt / chuyển Tab</strong>
              <span class="text-[11px] text-zinc-400">Ngừng vẽ 60FPS &amp; Video hướng dẫn khi không nhìn thấy.</span>
            </span>
          </label>
          <label class="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/75 border border-zinc-800 cursor-pointer">
            <input type="checkbox" id="chk-mod47-cleanup-close" class="mt-0.5 accent-emerald-400" ${this.prefs.autoCleanupOnModalClose ? 'checked' : ''} />
            <span>
              <strong class="text-zinc-100 block">🧹 Tự giải phóng RAM ngay khi thoát công cụ nặng</strong>
              <span class="text-[11px] text-zinc-400">Tự xóa bộ đệm ĐăngLovePDF, Desmos &amp; Video khi bạn bấm đóng.</span>
            </span>
          </label>
        </div>

        <!-- Danh sách công tắc Bật/Tắt từng Module phụ -->
        <div class="space-y-2">
          <div class="text-xs font-black text-amber-300 uppercase">🎛️ Công tắc Tắt / Bật từng chức năng &amp; hiệu ứng phụ</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${TOGGLEABLE_MODULES.map((m) => {
              const enabled = !this.isFeatureDisabled(m.key);
              return `
                <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/80 border ${enabled ? 'border-zinc-800' : 'border-rose-500/40 bg-rose-950/15'}">
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-zinc-100">${m.icon} ${escHtml(m.name)}</div>
                    <div class="text-[11px] text-zinc-400 leading-snug mt-0.5">${escHtml(m.desc)}</div>
                  </div>
                  <button type="button" data-mod47-toggle-key="${m.key}" aria-pressed="${enabled ? 'true' : 'false'}" class="px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer ${enabled ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-rose-500/40'}">
                    ${enabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Nhóm dịch vụ chạy ngầm thiết yếu (Được bảo vệ tuyệt đối) -->
        <div class="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/35 space-y-2">
          <div class="text-xs font-black text-emerald-300 uppercase">🟢 Dịch vụ chạy ngầm thiết yếu (Luôn được bảo vệ — không bị tự ngủ)</div>
          <div class="flex flex-wrap gap-2">
            ${essentials
              .map(
                (s) => `
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.active ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}">
                ${s.icon} ${escHtml(s.label)} · ${s.active ? 'Đang chạy' : 'Đang chờ'}
              </span>`
              )
              .join('')}
          </div>
        </div>
      `;

      body.innerHTML =
        subTabsHtml +
        (tab === 'speed' ? this._renderSpeedTabHtml() : tab === 'storage' ? this._renderStorageTabHtml() : perfTabHtml);

      body.querySelectorAll('[data-mod47-subtab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this._activeSubTab = btn.dataset.mod47Subtab || 'perf';
          this.refreshPanelUI();
        });
      });

      body.querySelector('#btn-mod47-cleanup-ram-now')?.addEventListener('click', () => this.runCleanupNow(false));
      body.querySelectorAll('[data-mod47-preset]').forEach((btn) => {
        btn.addEventListener('click', () => this.applyPreset(btn.dataset.mod47Preset));
      });
      body.querySelector('#chk-mod47-autosleep-hidden')?.addEventListener('change', (e) => {
        this.prefs.autoSleepOnHidden = Boolean(e.target.checked);
        this.savePrefs();
        this.refreshPanelUI();
      });
      body.querySelector('#chk-mod47-cleanup-close')?.addEventListener('change', (e) => {
        this.prefs.autoCleanupOnModalClose = Boolean(e.target.checked);
        this.savePrefs();
        this.refreshPanelUI();
      });
      body.querySelectorAll('[data-mod47-toggle-key]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.mod47ToggleKey;
          const currentlyEnabled = !this.isFeatureDisabled(key);
          this.setFeatureEnabled(key, !currentlyEnabled);
        });
      });

      // Speed test & Storage events
      body.querySelector('#btn-mod47-run-speedtest')?.addEventListener('click', () => this.runNetworkSpeedTest());
      body.querySelector('#btn-mod47-scan-storage')?.addEventListener('click', () => this.scanDeviceStorageAndFiles());
      body.querySelector('#sel-mod47-folder-filter')?.addEventListener('change', (ev) => {
        this._storageState.folderFilter = ev.target.value || 'all';
        this.refreshPanelUI();
      });
      body.querySelector('#sel-mod47-file-sort')?.addEventListener('change', (ev) => {
        this._storageState.sortBy = ev.target.value || 'size_desc';
        this.refreshPanelUI();
      });
      body.querySelector('#btn-mod47-sel-all-files')?.addEventListener('click', () => {
        this._getFilteredSortedStorageFiles().forEach((f) => {
          if (f.deletable) this._storageState.selectedIds.add(f.id);
        });
        this.refreshPanelUI();
      });
      body.querySelector('#btn-mod47-desel-files')?.addEventListener('click', () => {
        this._storageState.selectedIds.clear();
        this.refreshPanelUI();
      });
      body.querySelector('#btn-mod47-delete-sel-files')?.addEventListener('click', () => this.deleteSelectedStorageFiles());
      body.querySelectorAll('[data-mod47-file-chk]').forEach((chk) => {
        chk.addEventListener('change', () => {
          const id = chk.getAttribute('data-mod47-file-chk');
          if (chk.checked) this._storageState.selectedIds.add(id);
          else this._storageState.selectedIds.delete(id);
          this.refreshPanelUI();
        });
      });
      NS.i18n?.translateElement?.(body);
    }

    init() {
      if (this._initialized) return this;
      this._initialized = true;

      document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
      globalScope.addEventListener('hashchange', () => {
        const h = String(globalScope.location.hash || '');
        if (!h.includes('tab=6')) {
          this.handleScreenChange('OTHER_TAB');
        }
      });

      // Lắng nghe chuyển tab từ EventBus trung tâm (Mod 01 / Mod 29)
      try {
        NS.events?.on?.('screen:changed', (payload) => {
          const id = typeof payload === 'string' ? payload : payload?.screenId || payload?.id || '';
          this.handleScreenChange(id);
        });
      } catch (_e) {}

      // Áp dụng cấu hình người dùng đã lưu sau khi các module khác khởi tạo xong
      this.mountTab6Card();
      setTimeout(() => {
        this.mountTab6Card();
        this.applyAllFeatureStates();
      }, 1200);
      return this;
    }
  }

  const perfManager = new PerformanceAndLifecycleManager();
  NS.perfManager = perfManager;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => perfManager.init());
    } else {
      perfManager.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
