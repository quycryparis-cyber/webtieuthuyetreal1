/**
 * ============================================================================
 * 🔬 AUTOTESTER AUDITORS
 * (ErrorAndChaosAuditor + SmoothnessAndRamAuditor + VisualAndMobileAuditor)
 * ============================================================================
 * Tương thích trọn vẹn Safari iOS (kiểm tra an toàn trước khi gọi API Chromium).
 * ============================================================================
 */
(function initAutoTesterAuditors(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  // --------------------------------------------------------------------------
  // 1. ERROR & CONSOLE AUDITOR (window.onerror, unhandledrejection, console.error)
  // --------------------------------------------------------------------------
  class ErrorAuditor {
    constructor() {
      this.errors = [];
      this._active = false;
      this._origConsoleError = null;
      this._boundOnError = null;
      this._boundRejection = null;
    }

    start() {
      if (this._active) return;
      this._active = true;
      this.errors = [];

      this._boundOnError = (ev) => {
        const msg = ev?.message || String(ev?.error || 'Lỗi kịch bản không xác định');
        this.errors.push({
          source: 'window.onerror',
          message: msg,
          file: ev?.filename ? `${ev.filename.split('/').pop()}:${ev.lineno || 0}` : '',
          at: Date.now(),
        });
      };
      this._boundRejection = (ev) => {
        const msg = ev?.reason?.message || String(ev?.reason || 'Promise từ chối chưa xử lý');
        // Bỏ qua ping hit-counter ngoài mạng bị chặn
        if (/abacus\.jasoncameron\.dev|Failed to fetch \(AutoTester/i.test(msg)) return;
        this.errors.push({
          source: 'unhandledrejection',
          message: msg,
          file: '',
          at: Date.now(),
        });
      };

      globalScope.addEventListener('error', this._boundOnError);
      globalScope.addEventListener('unhandledrejection', this._boundRejection);

      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        this._origConsoleError = console.error;
        const self = this;
        console.error = function wrappedConsoleError(...args) {
          const text = args.map((a) => (a && a.message ? a.message : String(a))).join(' ');
          if (!/abacus\.jasoncameron\.dev|AutoTester Offline/i.test(text)) {
            self.errors.push({
              source: 'console.error',
              message: text.slice(0, 260),
              file: '',
              at: Date.now(),
            });
          }
          return self._origConsoleError.apply(console, args);
        };
      }
    }

    stop() {
      if (!this._active) return;
      this._active = false;
      if (this._boundOnError) globalScope.removeEventListener('error', this._boundOnError);
      if (this._boundRejection) globalScope.removeEventListener('unhandledrejection', this._boundRejection);
      if (this._origConsoleError) {
        console.error = this._origConsoleError;
        this._origConsoleError = null;
      }
      this._boundOnError = null;
      this._boundRejection = null;
    }
  }

  // --------------------------------------------------------------------------
  // 2. SMOOTHNESS & RAM AUDITOR (FPS, Long Tasks >100ms, CLS, Blob Leaks, RAM)
  // --------------------------------------------------------------------------
  class SmoothnessAndRamAuditor {
    constructor() {
      this._active = false;
      this._rafId = null;
      this._longTaskObs = null;
      this._clsObs = null;
      this._origCreateBlob = null;
      this._origRevokeBlob = null;
      this.activeBlobs = new Set();
      this.stats = this._emptyStats();
    }

    _emptyStats() {
      return {
        avgFps: 60,
        minFps: 60,
        longTasks: 0,
        maxLongTaskMs: 0,
        cls: 0,
        unrevokedBlobs: 0,
        ramMb: null,
      };
    }

    start() {
      if (this._active) return;
      this._active = true;
      this.stats = this._emptyStats();
      this.activeBlobs.clear();

      // Theo dõi FPS
      let frames = 0;
      let lastSample = performance.now();
      const fpsSamples = [];
      const tick = (now) => {
        if (!this._active) return;
        frames += 1;
        const dt = now - lastSample;
        if (dt >= 400) {
          const fps = Math.round((frames * 1000) / dt);
          fpsSamples.push(fps);
          this.stats.minFps = Math.min(this.stats.minFps, fps);
          this.stats.avgFps = Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length);
          frames = 0;
          lastSample = now;
        }
        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);

      // Safari iOS-safe PerformanceObserver('longtask')
      try {
        if (
          typeof PerformanceObserver === 'function' &&
          Array.isArray(PerformanceObserver.supportedEntryTypes) &&
          PerformanceObserver.supportedEntryTypes.includes('longtask')
        ) {
          this._longTaskObs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 100) {
                this.stats.longTasks += 1;
                this.stats.maxLongTaskMs = Math.max(this.stats.maxLongTaskMs, Math.round(entry.duration));
              }
            }
          });
          this._longTaskObs.observe({ entryTypes: ['longtask'] });
        }
      } catch (_eLt) {}

      // Safari iOS-safe Layout Shift (CLS)
      try {
        if (
          typeof PerformanceObserver === 'function' &&
          Array.isArray(PerformanceObserver.supportedEntryTypes) &&
          PerformanceObserver.supportedEntryTypes.includes('layout-shift')
        ) {
          this._clsObs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                this.stats.cls = Number((this.stats.cls + (entry.value || 0)).toFixed(3));
              }
            }
          });
          this._clsObs.observe({ type: 'layout-shift', buffered: false });
        }
      } catch (_eCls) {}

      // Đếm URL.createObjectURL tạo ra mà quên revokeObjectURL
      try {
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          this._origCreateBlob = URL.createObjectURL;
          this._origRevokeBlob = URL.revokeObjectURL;
          const self = this;
          URL.createObjectURL = function trackedCreateObjectURL(obj) {
            const url = self._origCreateBlob.call(URL, obj);
            self.activeBlobs.add(url);
            self.stats.unrevokedBlobs = self.activeBlobs.size;
            return url;
          };
          URL.revokeObjectURL = function trackedRevokeObjectURL(url) {
            self.activeBlobs.delete(url);
            self.stats.unrevokedBlobs = self.activeBlobs.size;
            return self._origRevokeBlob.call(URL, url);
          };
        }
      } catch (_eBlob) {}
    }

    snapshot() {
      try {
        // Chỉ đọc performance.memory trên Chromium (bỏ qua an toàn trên Safari iOS)
        const mem = globalScope.performance?.memory;
        if (mem && Number(mem.usedJSHeapSize) > 0) {
          this.stats.ramMb = Number((mem.usedJSHeapSize / (1024 * 1024)).toFixed(1));
        }
      } catch (_eMem) {}
      this.stats.unrevokedBlobs = this.activeBlobs.size;
      return { ...this.stats };
    }

    stop() {
      if (!this._active) return;
      this._active = false;
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
      try { this._longTaskObs?.disconnect?.(); } catch (_e) {}
      try { this._clsObs?.disconnect?.(); } catch (_e) {}
      this._longTaskObs = null;
      this._clsObs = null;
      if (this._origCreateBlob) {
        URL.createObjectURL = this._origCreateBlob;
        URL.revokeObjectURL = this._origRevokeBlob;
        this._origCreateBlob = null;
        this._origRevokeBlob = null;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 3. VISUAL & MOBILE AUDITOR (Tràn ngang, Nút bé, Thanh nổi đè nhau, Lệch tọa độ)
  // --------------------------------------------------------------------------
  const VisualAndMobileAuditor = {
    scanCurrentScreen(screenLabel = 'Màn hình hiện tại') {
      const findings = [];
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768;

      // 1. Kiểm tra tràn khung ngang (Horizontal Overflow)
      const docOverflow = document.documentElement.scrollWidth - vw;
      if (docOverflow > 4) {
        let offenderSel = 'body';
        let maxRight = vw;
        const nodes = document.querySelectorAll('section:not(.hidden) *, header *, main *');
        for (let i = 0; i < Math.min(nodes.length, 400); i++) {
          const n = nodes[i];
          if (n.closest('[data-autotester-ui="true"]')) continue;
          const r = n.getBoundingClientRect();
          if (r.width > 0 && r.right > maxRight + 3) {
            maxRight = r.right;
            offenderSel = n.id ? `#${n.id}` : `${n.tagName.toLowerCase()}.${String(n.className || '').split(/\s+/)[0] || ''}`;
          }
        }
        findings.push({
          code: 'ERR_MOBILE_OVERFLOW',
          selector: offenderSel,
          techDetail: `${screenLabel}: scrollWidth=${document.documentElement.scrollWidth}px > viewport=${vw}px (dư +${Math.round(docOverflow)}px tại ${offenderSel})`,
        });
      }

      // 2. Kiểm tra 3 thanh nổi góc dưới (Pomodoro, Âm nhạc, Bi Số 8) có đè lên nhau không
      const docks = [
        { id: '#s15-floating-pomodoro-pill', name: 'Thanh Pomodoro nổi' },
        { id: '#s15-floating-audio-pill', name: 'Thanh Âm nhạc nổi' },
        { id: '#s11-mascot-bi-corner', name: 'Linh vật Bi Số 8' },
      ]
        .map((d) => {
          const el = document.querySelector(d.id);
          if (!el) return null;
          const st = getComputedStyle(el);
          if (st.display === 'none' || st.visibility === 'hidden') return null;
          const rect = el.getBoundingClientRect();
          if (rect.width < 4 || rect.height < 4) return null;
          return { ...d, rect };
        })
        .filter(Boolean);

      for (let i = 0; i < docks.length; i++) {
        for (let j = i + 1; j < docks.length; j++) {
          const a = docks[i].rect;
          const b = docks[j].rect;
          const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          if (overlapX > 6 && overlapY > 6) {
            findings.push({
              code: 'ERR_FLOATING_OVERLAP',
              selector: `${docks[i].id}, ${docks[j].id}`,
              techDetail: `${docks[i].name} đè lên ${docks[j].name} (${Math.round(overlapX)}x${Math.round(overlapY)}px trên ${vw}x${vh})`,
            });
          }
        }
      }

      // 3. Trên màn hình điện thoại: kiểm tra nút bấm chính quá nhỏ (<34px) dễ bấm trượt
      if (isMobile) {
        const tinyButtons = [];
        const btns = document.querySelectorAll('section:not(.hidden) button:not(.hidden)');
        for (let i = 0; i < Math.min(btns.length, 120); i++) {
          const b = btns[i];
          if (b.closest('[data-autotester-ui="true"]') || b.closest('.hidden')) continue;
          const r = b.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh) {
            if (r.height < 28 && r.width < 28) {
              tinyButtons.push({
                sel: b.id ? `#${b.id}` : (b.textContent || '').trim().slice(0, 20),
                size: `${Math.round(r.width)}x${Math.round(r.height)}px`,
              });
            }
          }
        }
        if (tinyButtons.length >= 3) {
          findings.push({
            code: 'WARN_SMALL_TOUCH_TARGET',
            selector: tinyButtons[0].sel,
            techDetail: `Phát hiện ${tinyButtons.length} nút nhỏ dưới 28px trên màn hình ${vw}px (vd: ${tinyButtons.slice(0, 3).map((x) => `${x.sel} ${x.size}`).join(', ')})`,
          });
        }
      }

      // 4. Lưu & đối chiếu Layout Snapshot Diff (so với lần chạy trước cùng kích thước màn hình)
      try {
        const keyIds = ['mobile-bottom-nav', 's15-floating-pomodoro-pill', 's15-floating-audio-pill', 's11-mascot-bi-corner'];
        const curSnap = { vw };
        keyIds.forEach((id) => {
          const el = document.getElementById(id);
          if (el && getComputedStyle(el).display !== 'none') {
            const r = el.getBoundingClientRect();
            curSnap[id] = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
          }
        });
        const prevRaw = localStorage.getItem(AT.SNAPSHOT_KEY);
        if (prevRaw) {
          const prev = JSON.parse(prevRaw);
          if (prev && Math.abs((prev.vw || 0) - vw) <= 20) {
            for (const id of keyIds) {
              if (prev[id] && curSnap[id]) {
                const dy = Math.abs(prev[id].y - curSnap[id].y);
                const dx = Math.abs(prev[id].x - curSnap[id].x);
                if (dy > 90 || dx > 120) {
                  findings.push({
                    code: 'WARN_VISUAL_SHIFT',
                    selector: `#${id}`,
                    techDetail: `#${id} dịch chuyển đột ngột dx=${dx}px, dy=${dy}px so với lần khám chuẩn trước.`,
                  });
                }
              }
            }
          }
        }
        localStorage.setItem(AT.SNAPSHOT_KEY, JSON.stringify(curSnap));
      } catch (_eSnap) {}

      return findings;
    },
  };

  AT.errorAuditor = new ErrorAuditor();
  AT.smoothAuditor = new SmoothnessAndRamAuditor();
  AT.visualAuditor = VisualAndMobileAuditor;
})(typeof window !== 'undefined' ? window : globalThis);
