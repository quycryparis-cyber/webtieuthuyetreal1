/**
 * ============================================================================
 * 🔬 AUTOTESTER ULTRA AUDITORS (v118)
 * - ErrorAuditor (window.onerror, unhandledrejection, console.error)
 * - SmoothnessAndRamAuditor (FPS, Long Tasks, CLS, Unrevoked Blobs, RAM)
 * - VisualAndMobileAuditor (Overflow, Floating Docks Overlap, Touch Targets, Layout Diff, i18n Key Leaks)
 * - BrowserCapabilityMatrixAuditor (10 Browser APIs + Safari/Firefox/Mobile Safety)
 * - CanvasPixelSampler (16-Point RGB Hash for Desmos & Weather Sky Canvas Liveness)
 * ============================================================================
 */
(function initAutoTesterAuditors(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  // --------------------------------------------------------------------------
  // 1. ERROR & CONSOLE AUDITOR
  // --------------------------------------------------------------------------
  class ErrorAuditor {
    constructor() {
      this.errors = [];
      this._active = false;
      this._origConsoleError = null;
      this._origWorker = null;
      this._boundOnError = null;
      this._boundRejection = null;
    }

    start() {
      if (this._active) return;
      this._active = true;
      this.errors = [];

      this._boundOnError = (ev) => {
        const msg = ev?.message || String(ev?.error || 'Lỗi kịch bản không xác định');
        if (/ResizeObserver loop/i.test(msg)) return;
        this.errors.push({
          source: 'window.onerror',
          message: msg,
          file: ev?.filename ? `${ev.filename.split('/').pop()}:${ev.lineno || 0}` : '',
          at: Date.now(),
        });
      };
      this._boundRejection = (ev) => {
        const msg = ev?.reason?.message || String(ev?.reason || 'Promise từ chối chưa xử lý');
        if (/abacus\.jasoncameron\.dev|Failed to fetch \(AutoTester|open-meteo|geocoding-api/i.test(msg)) return;
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
          if (!/abacus\.jasoncameron\.dev|AutoTester Offline|Mock AutoTester/i.test(text)) {
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
      // Bắt lỗi Web Worker ngầm (Spec §3.10 — Safari/Chrome an toàn)
      try {
        if (typeof globalScope.Worker === 'function' && !this._origWorker) {
          this._origWorker = globalScope.Worker;
          const OrigWorker = this._origWorker;
          const self = this;
          globalScope.Worker = function TrackedAutoTesterWorker(url, options) {
            const w = new OrigWorker(url, options);
            w.addEventListener('error', (ev) => {
              self.errors.push({
                source: 'Worker.onerror',
                message: ev?.message || 'Web Worker gặp lỗi chạy ngầm',
                file: String(url || '').split('/').pop(),
                at: Date.now(),
              });
            });
            return w;
          };
          globalScope.Worker.prototype = OrigWorker.prototype;
        }
      } catch (_eW) {}
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
      if (this._origWorker) {
        globalScope.Worker = this._origWorker;
        this._origWorker = null;
      }
      this._boundOnError = null;
      this._boundRejection = null;
    }
  }

  // --------------------------------------------------------------------------
  // 2. SMOOTHNESS & RAM AUDITOR (Safari iOS Safe)
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
      this.blobOrigins = new Map();
      this._pauseCls = false;

      this._frames = 0;
      this._lastSample = performance.now();
      this._fpsSamples = [];
      const tick = (now) => {
        if (!this._active) return;
        this._frames += 1;
        const dt = now - this._lastSample;
        if (dt >= 250) {
          const occluded = Boolean(document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus()));
          if (!occluded || dt < 450) {
            const fps = Math.min(120, Math.round((this._frames * 1000) / dt));
            this._fpsSamples.push(fps);
            this.stats.minFps = Math.min(this.stats.minFps, fps);
            this.stats.avgFps = Math.round(this._fpsSamples.reduce((a, b) => a + b, 0) / this._fpsSamples.length);
          }
          this._frames = 0;
          this._lastSample = now;
        }
        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);

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

      try {
        if (
          typeof PerformanceObserver === 'function' &&
          Array.isArray(PerformanceObserver.supportedEntryTypes) &&
          PerformanceObserver.supportedEntryTypes.includes('layout-shift')
        ) {
          this._clsObs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput && !this._pauseCls) {
                this.stats.cls = Number((this.stats.cls + (entry.value || 0)).toFixed(3));
              }
            }
          });
          this._clsObs.observe({ type: 'layout-shift', buffered: false });
        }
      } catch (_eCls) {}

      try {
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          this._origCreateBlob = URL.createObjectURL;
          this._origRevokeBlob = URL.revokeObjectURL;
          const self = this;
          URL.createObjectURL = function trackedCreateObjectURL(obj) {
            const url = self._origCreateBlob.call(URL, obj);
            self.activeBlobs.add(url);
            try {
              const stackLines = String(new Error().stack || '').split('\n').slice(1, 5).map((s) => s.trim()).filter(Boolean).join(' <- ');
              self.blobOrigins?.set(url, `${obj?.type || typeof obj} (${obj?.size || 0}B) @ ${stackLines.slice(0, 140)}`);
            } catch (_eSt) {}
            self.stats.unrevokedBlobs = self.activeBlobs.size;
            return url;
          };
          URL.revokeObjectURL = function trackedRevokeObjectURL(url) {
            self.activeBlobs.delete(url);
            self.blobOrigins?.delete(url);
            self.stats.unrevokedBlobs = self.activeBlobs.size;
            return self._origRevokeBlob.call(URL, url);
          };
        }
      } catch (_eBlob) {}
    }

    setPauseCls(v) {
      this._pauseCls = Boolean(v);
    }

    resetFpsWindow() {
      this._frames = 0;
      this._lastSample = performance.now();
      this._fpsSamples = [];
      this.stats.avgFps = 60;
      this.stats.minFps = 60;
      this.stats.longTasks = 0;
      this.stats.maxLongTaskMs = 0;
      this.stats.cls = 0;
    }

    snapshot() {
      try {
        const mem = globalScope.performance?.memory;
        if (mem && Number(mem.usedJSHeapSize) > 0) {
          this.stats.ramMb = Number((mem.usedJSHeapSize / (1024 * 1024)).toFixed(1));
        }
      } catch (_eMem) {}
      this.stats.unrevokedBlobs = this.activeBlobs.size;
      const origins = [];
      this.blobOrigins?.forEach((v) => { if (origins.length < 6) origins.push(v); });
      return { ...this.stats, blobOrigins: origins };
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
  // 3. CANVAS 16-POINT PIXEL SAMPLER (Kiểm tra Canvas vẽ đồ thị / bầu trời sống thật)
  // --------------------------------------------------------------------------
  function sampleCanvasHash(canvasEl) {
    if (!canvasEl || canvasEl.tagName !== 'CANVAS') return '';
    try {
      const w = canvasEl.width || 0;
      const h = canvasEl.height || 0;
      if (w < 4 || h < 4) return 'EMPTY_DIM';
      const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
      if (!ctx) return 'NON_2D_CTX';
      const samples = [];
      for (let gx = 1; gx <= 4; gx++) {
        for (let gy = 1; gy <= 4; gy++) {
          const x = Math.min(w - 1, Math.floor((w * gx) / 5));
          const y = Math.min(h - 1, Math.floor((h * gy) / 5));
          const d = ctx.getImageData(x, y, 1, 1).data;
          samples.push(`${d[0]},${d[1]},${d[2]},${d[3]}`);
        }
      }
      return samples.join('|');
    } catch (_e) {
      return 'TAINTED_OR_WEBGL';
    }
  }

  // --------------------------------------------------------------------------
  // 4. BROWSER CAPABILITY MATRIX AUDITOR (10 API trình duyệt & Độ an toàn Safari/Firefox)
  // --------------------------------------------------------------------------
  const BrowserCapabilityMatrixAuditor = {
    audit() {
      const matrix = [
        { name: 'Document PiP', supported: Boolean(globalScope.documentPictureInPicture?.requestWindow), fallback: 'Cửa sổ nổi HTML trong trang' },
        { name: 'File System Access', supported: typeof globalScope.showDirectoryPicker === 'function', fallback: 'Chọn tệp chuẩn & tải xuống' },
        { name: 'Screen Wake Lock', supported: Boolean(navigator.wakeLock?.request), fallback: 'Hoạt động bình thường không cần khóa sáng' },
        { name: 'BroadcastChannel', supported: typeof globalScope.BroadcastChannel === 'function', fallback: 'Đồng bộ qua storage event' },
        { name: 'Clipboard API', supported: Boolean(navigator.clipboard?.writeText), fallback: 'Sao chép qua vùng chọn textarea' },
        { name: 'Web Audio API', supported: Boolean(globalScope.AudioContext || globalScope.webkitAudioContext), fallback: 'Âm thanh HTML5 Audio' },
        { name: 'Service Worker PWA', supported: Boolean(navigator.serviceWorker), fallback: 'Chạy trực tuyến bình thường' },
        { name: 'VisualViewport', supported: Boolean(globalScope.visualViewport), fallback: 'window.innerHeight chuẩn' },
        { name: 'Speech Recognition', supported: Boolean(globalScope.SpeechRecognition || globalScope.webkitSpeechRecognition), fallback: 'Nhập văn bản trực tiếp' },
        { name: 'Performance Memory', supported: Boolean(globalScope.performance?.memory), fallback: 'Ẩn nhẹ thông số RAM trên Safari/Firefox' },
      ];
      const supportedCount = matrix.filter((m) => m.supported).length;
      return {
        total: matrix.length,
        supportedCount,
        matrix,
        summaryText: `Hỗ trợ ${supportedCount}/${matrix.length} năng lực trình duyệt hiện đại (mọi mục thiếu đều có phương án dự phòng an toàn).`,
      };
    },
  };

  // --------------------------------------------------------------------------
  // 4B. INDUSTRY BENCHMARK AUDITOR (Đối chiếu chuẩn các nền tảng lớn)
  // --------------------------------------------------------------------------
  const BenchmarkComplianceAuditor = {
    auditAppBenchmarks() {
      const ns = globalScope.NoirStudio || {};
      const checks = [
        {
          key: 'pdf_pro_41_tools',
          label: 'Bộ công cụ PDF & File đầy đủ (>= 35 công cụ chuẩn iLovePDF/Smallpdf/Sejda)',
          ok: (ns.dangLovePdfPro?.PRO_TOOL_GROUPS?.flatMap((g) => g.tools).length || 0) >= 35,
        },
        {
          key: 'pdf_canvas_preview',
          label: 'Xem trước PDF bằng Canvas PDF.js (không dùng iframe hay bị trắng trên Mobile)',
          ok: typeof ns.dangLovePdf?.openInteractiveResultPreview === 'function',
        },
        {
          key: 'pdf_guest_quick_entry',
          label: 'Nút vào nhanh ĐăngLovePDF kèm icon ở Cổng kết nối Chế Độ Khách',
          ok: Boolean(document.getElementById('btn-gate-quick-danglovepdf')),
        },
        {
          key: 'book_exporter_mod26',
          label: 'Xuất sách PDF / DOCX / TXT có xem thử trực tiếp tiếng Việt chuẩn (Mod 26)',
          ok: Boolean(ns.bookExporter || document.getElementById('modal-s6-custom-exporter')),
        },
        {
          key: 'story_bible_select_copy',
          label: 'Story Bible & Đầu ra AI có nút Chọn tất cả + Sao chép tất cả 1 chạm',
          ok: Boolean(document.querySelector('[data-v117-copy-all]') && document.querySelector('[data-v117-select-all]')),
        },
        {
          key: 'youtube_pip_and_bg',
          label: 'YouTube + Cửa sổ nổi Desktop + Nền video chuyển động đồng bộ 1 luồng tiếng',
          ok: Boolean(ns.youtubeStudio && (ns.youtubeMotionBg || ns.mod40)),
        },
        {
          key: 'scientific_calc_and_pomo',
          label: 'Máy tính Casio FX-570 / Desmos + Pomodoro 2 chiều + Đồng hồ/Báo thức/Thời tiết',
          ok: Boolean(ns.Fx570MathEngine && ns.pomodoro && ns.worldClockStudio),
        },
        {
          key: 'chatbot_dual_mode',
          label: 'Trợ lý AI Bi Số 8 hoạt động cả Chế Độ Khách & không đẩy qua lại 2 chế độ',
          ok: Boolean(ns.mascotAndChat?.buildIntelligentLocalResponse),
        },
        {
          key: 'ram_autosleep_mod47',
          label: 'Quản lý RAM, Tự ngủ đồ họa & Công tắc tắt/bật từng chức năng (Mod 47)',
          ok: Boolean(ns.perfManager && document.getElementById('tab6-acc-perf-ram-manager')),
        },
        {
          key: 'pwa_i18n_6_langs',
          label: 'Hỗ trợ Offline PWA Service Worker + 6 ngôn ngữ + Video hướng dẫn >= 30 mốc',
          ok: Boolean((ns.TUTORIAL_CHAPTERS_V38?.length || 0) >= 30 && navigator.serviceWorker),
        },
      ];
      const passedCount = checks.filter((c) => c.ok).length;
      const missing = checks.filter((c) => !c.ok);
      return { total: checks.length, passedCount, missing, checks };
    },
  };

  // Hàm tính độ tương phản WCAG giữa 2 màu rgba()
  function parseRgb(str) {
    const m = String(str || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
  }
  function relLum(c) {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function contrastRatio(c1, c2) {
    const l1 = relLum(c1);
    const l2 = relLum(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  // --------------------------------------------------------------------------
  // 5. VISUAL, MOBILE, CONTRAST & I18N AUDITOR
  // --------------------------------------------------------------------------
  const VisualAndMobileAuditor = {
    scanI18nKeyLeaks() {
      const leaks = [];
      const nodes = document.querySelectorAll('section:not(.hidden) button, section:not(.hidden) h1, section:not(.hidden) h2, section:not(.hidden) h3, section:not(.hidden) label');
      const leakPat = /(\{\{[^}]+\}\}|\bi18n\.[a-z0-9_.]+\b|\bbtn_[a-z0-9_]{4,}\b)/i;
      for (let i = 0; i < Math.min(nodes.length, 300); i++) {
        const n = nodes[i];
        if (n.closest('[data-autotester-ui="true"]') || n.closest('.hidden')) continue;
        const txt = String(n.textContent || '').trim();
        if (!txt || txt.length > 140) continue;
        const m = txt.match(leakPat);
        if (m) {
          leaks.push({
            selector: n.id ? `#${n.id}` : n.tagName.toLowerCase(),
            token: m[0],
          });
        }
      }
      return leaks;
    },

    scanCurrentScreen(screenLabel = 'Màn hình hiện tại') {
      const findings = [];
      const isSim = Boolean(AT.viewportSim?.isSimulated?.());
      const vw = isSim ? AT.viewportSim.getWidth() : window.innerWidth;
      const vh = isSim ? AT.viewportSim.getHeight() : window.innerHeight;
      const isMobile = vw < 768;
      const tol = isMobile ? 2 : 4;
      const rootMeasureEl = isSim && document.body ? document.body : document.documentElement;
      const rootRect = rootMeasureEl.getBoundingClientRect();

      // 1. Tràn ngang cấp trang & từng nút/thẻ (Horizontal Overflow & Element Clipping)
      const docOverflow = rootMeasureEl.scrollWidth - vw;
      const overflowOffenders = [];
      const nodes = document.querySelectorAll('body > *, section:not(.hidden) *, header *, main *, nav *, [role="dialog"]:not(.hidden) *, [id*="modal"]:not(.hidden) *');
      let maxOverflowPx = Math.max(0, docOverflow);

      const describeEl = (el) => {
        if (!el) return 'body';
        if (el.id) return `#${el.id}`;
        const cls = String(el.className || '').trim().split(/\s+/).filter(Boolean)[0] || '';
        return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
      };

      for (let i = 0; i < Math.min(nodes.length, 2200); i++) {
        const n = nodes[i];
        if (n instanceof SVGElement && n.tagName.toLowerCase() !== 'svg') continue;
        if (n.closest('[data-autotester-ui="true"]') || n.closest('.hidden') || n.id === 'ambient-backdrop-layer' || n.classList?.contains('sr-only')) continue;
        const st = getComputedStyle(n);
        if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;
        const r = n.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) continue;

        // Cho phép bảng cuộn ngang có chủ đích (.overflow-x-auto / .ll51-table-wrap)
        const inScrollWrap = n.closest('.overflow-x-auto, .ll51-table-wrap, [style*="overflow-x: auto"], [style*="overflow-x:auto"]');
        if (inScrollWrap && n !== inScrollWrap) continue;

        const relRight = r.right - rootRect.left;
        const relLeft = r.left - rootRect.left;
        const overRight = relRight - vw;
        const overLeft = -relLeft;
        if (overRight > tol || overLeft > tol) {
          const px = Math.round(Math.max(overRight, overLeft));
          if (px > maxOverflowPx) maxOverflowPx = px;
          overflowOffenders.push(`${describeEl(n)} (+${px}px)`);
        } else if (
          (n.tagName === 'BUTTON' || n.tagName === 'A' || n.getAttribute('role') === 'button' || n.classList.contains('inv-pill')) &&
          st.whiteSpace === 'nowrap' &&
          n.scrollWidth > n.clientWidth + 6 &&
          n.clientWidth > 0
        ) {
          overflowOffenders.push(`${describeEl(n)} (cắt chữ ${n.scrollWidth}/${n.clientWidth}px)`);
        }
        if (overflowOffenders.length >= 6) break;
      }

      if (docOverflow > tol || overflowOffenders.length > 0) {
        const uniq = Array.from(new Set(overflowOffenders));
        const firstSel = uniq[0] ? uniq[0].split(' ')[0] : 'body';
        findings.push({
          code: 'ERR_MOBILE_OVERFLOW',
          selector: firstSel,
          techDetail: `${screenLabel} (${vw}x${vh}px): scrollWidth=${rootMeasureEl.scrollWidth}px (${docOverflow > 0 ? `+${Math.round(docOverflow)}px` : 'cắt phần tử'}) — Tràn/cắt tại: ${uniq.slice(0, 4).join(', ') || 'body'}`,
        });
      }

      // 2. 3 thanh nổi góc dưới có đè nhau không
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

      // 3. Quét mã ngôn ngữ i18n chưa dịch
      const leaks = this.scanI18nKeyLeaks();
      if (leaks.length > 0) {
        findings.push({
          code: 'ERR_I18N_KEY_LEAK',
          selector: leaks[0].selector,
          techDetail: `${screenLabel}: phát hiện ${leaks.length} chuỗi chưa dịch (${leaks.slice(0, 3).map((x) => x.token).join(', ')})`,
        });
      }

      // 3B. Kiểm tra độ tương phản chữ/nền tối thiểu trên nút bấm chính đang hiển thị (WCAG)
      let lowContrastCount = 0;
      let firstLowContrastSel = '';
      const primaryEls = document.querySelectorAll('section:not(.hidden) button:not(.hidden)');
      for (let i = 0; i < Math.min(primaryEls.length, 60); i++) {
        const el = primaryEls[i];
        if (el.closest('[data-autotester-ui="true"]') || el.closest('.hidden')) continue;
        const st = getComputedStyle(el);
        const fg = parseRgb(st.color);
        const bg = parseRgb(st.backgroundColor);
        if (fg && bg && bg.a >= 0.85) {
          const ratio = contrastRatio(fg, bg);
          if (ratio < 2.4) {
            lowContrastCount += 1;
            if (!firstLowContrastSel) firstLowContrastSel = el.id ? `#${el.id}` : (el.textContent || '').trim().slice(0, 24);
          }
        }
      }
      if (lowContrastCount >= 4) {
        findings.push({
          code: 'WARN_LOW_CONTRAST',
          selector: firstLowContrastSel,
          techDetail: `${screenLabel}: phát hiện ${lowContrastCount} nút có độ tương phản màu chữ/nền thấp (<2.4:1, vd: ${firstLowContrastSel}).`,
        });
      }

      // 4. Nút quá nhỏ theo chuẩn thiết bị (Mobile < 28x28px / 22px; Desktop < 18px)
      {
        const tinyButtons = [];
        const btns = document.querySelectorAll('section:not(.hidden) button, header button, nav button, [role="dialog"]:not(.hidden) button, [id*="modal"]:not(.hidden) button, [role="button"]');
        for (let i = 0; i < Math.min(btns.length, 240); i++) {
          const b = btns[i];
          if (b.closest('[data-autotester-ui="true"]') || b.closest('.hidden')) continue;
          const st = getComputedStyle(b);
          if (st.display === 'none' || st.visibility === 'hidden') continue;
          const r = b.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh) {
            const tooTiny = isMobile
              ? (r.height < 28 && r.width < 28) || r.height < 22 || r.width < 22
              : (r.width < 18 || r.height < 18);
            if (tooTiny) {
              tinyButtons.push({
                sel: b.id ? `#${b.id}` : (b.textContent || '').trim().slice(0, 22) || b.tagName.toLowerCase(),
                size: `${Math.round(r.width)}x${Math.round(r.height)}px`,
              });
            }
          }
        }
        if (tinyButtons.length >= 1) {
          findings.push({
            code: 'WARN_SMALL_TOUCH_TARGET',
            selector: tinyButtons[0].sel,
            techDetail: `${screenLabel} (${vw}px): Phát hiện ${tinyButtons.length} nút nhỏ dưới chuẩn (vd: ${tinyButtons.slice(0, 4).map((x) => `${x.sel} ${x.size}`).join(', ')})`,
          });
        }
      }

      // 5. Layout Snapshot Diff
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
  AT.browserMatrix = BrowserCapabilityMatrixAuditor;
  AT.benchmarkAuditor = BenchmarkComplianceAuditor;
  AT.sampleCanvasHash = sampleCanvasHash;
})(typeof window !== 'undefined' ? window : globalThis);
