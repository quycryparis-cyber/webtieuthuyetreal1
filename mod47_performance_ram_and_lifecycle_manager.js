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
              <span class="px-2.5 py-0.5 rounded-full bg-cyan-400 text-zinc-950 font-black text-[10px] tracking-wide">⚡ TỐI ƯU MƯỢT &amp; RAM</span>
              <h3 class="text-sm sm:text-base font-black text-cyan-200 uppercase">Quản Lý Hiệu Năng, Tự Ngủ (Auto-Sleep) &amp; Tắt/Bật Chức Năng (Mod 47)</h3>
            </div>
            <p class="text-[11px] text-zinc-300 mt-1">Tự ngắt tiến trình đồ họa thừa khi thoát để không tràn RAM — giữ nguyên nhạc nền, YouTube, Pomodoro &amp; tự lưu.</p>
          </div>
          <span class="noir-collapse-chevron px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-[11px] font-extrabold shrink-0">▼ Mở rộng</span>
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
      const chevronEl = card.querySelector('.noir-collapse-chevron');
      toggleBtn?.addEventListener('click', (ev) => {
        // Nếu hệ thống collapse toàn cục chưa gắn thì tự mở/đóng an toàn
        if (ev.defaultPrevented) return;
        const isHidden = bodyEl.classList.toggle('hidden');
        toggleBtn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
        if (chevronEl) chevronEl.textContent = isHidden ? '▼ Mở rộng' : '▲ Thu gọn';
        if (!isHidden) this.refreshPanelUI();
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

    refreshPanelUI() {
      const body = document.getElementById('tab6-perf-ram-body');
      if (!body) return;

      const essentials = this.getEssentialServicesStatus();
      const ramText = this.getRamBadgeText();
      const disabledCount = Object.values(this.prefs.disabledFeatures || {}).filter(Boolean).length;

      body.innerHTML = `
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
