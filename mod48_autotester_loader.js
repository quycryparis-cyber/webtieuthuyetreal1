/**
 * ============================================================================
 * 🩺 MODULE 48: CỔNG NẠP AUTOTESTER NỘI BỘ ("BÁC SĨ APP") — ZERO-OVERHEAD
 * (mod48_autotester_loader.js — v117.0)
 * ============================================================================
 * - Siêu nhẹ (~3 KB), KHÔNG nạp lõi kiểm thử & KHÔNG tốn RAM khi đang Tắt.
 * - Mở nhanh bằng 4 cách:
 *   1) Bấm nút "🩺 Autotester nội bộ" trong Tab 6 (dưới nút Viết Báo Lỗi)
 *   2) Laptop: nhấn Ctrl + Shift + Alt + T
 *   3) Điện thoại: chạm nhanh 5 lần vào biểu tượng / tên ứng dụng
 *   4) Mở đường dẫn có ?autotest=1
 * - Khi người dùng gạt TẮT trong bảng Bác sĩ App -> dọn sạch DOM, listener & RAM.
 * ============================================================================
 */
(function initMod48AutoTesterLoader(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});
  if (NS.__MOD48_AUTOTESTER_LOADER_READY__) return;
  NS.__MOD48_AUTOTESTER_LOADER_READY__ = true;

  // Crash-Safe Startup Sweep: dọn sạch mọi khóa sandbox mồ côi nếu lần kiểm thử trước bị tắt đột ngột
  try {
    const orphanKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('__at_sbx__') || k.startsWith('__autotest_sandbox__'))) orphanKeys.push(k);
    }
    orphanKeys.forEach((k) => localStorage.removeItem(k));
  } catch (_eSweep) {}

  const AUTOTESTER_SCRIPTS = [
    'autotester/intelligence/intelligence.js',
    'autotester/core/coreEngine.js',
    'autotester/auditors/auditors.js',
    'autotester/modules/stabilityAndSandbox.js',
    'autotester/modules/viewportAndGeometry.js',
    'autotester/modules/logicChaosAndEdge.js',
    'autotester/modules/securityA11ySeoAndPerf.js',
    'autotester/modules/bridgeAndCoEvolution.js',
    'autotester/suites/appSuites.js',
    'autotester/ui/shell.js',
    'autotester/main.js',
  ];

  let loadingPromise = null;
  let loaded = false;

  function loadStylesheetOnce(href) {
    if (document.getElementById('at-v117-styles-link')) return;
    const link = document.createElement('link');
    link.id = 'at-v117-styles-link';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScriptSeq(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-at-src="${src}"]`);
      if (existing) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.dataset.atSrc = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Không nạp được ${src}`));
      document.body.appendChild(s);
    });
  }

  async function ensureLoaded() {
    if (loaded && globalScope.NoirAutoTester) return globalScope.NoirAutoTester;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      loadStylesheetOnce('autotester/styles.css');
      for (const src of AUTOTESTER_SCRIPTS) {
        await loadScriptSeq(src);
      }
      loaded = true;
      return globalScope.NoirAutoTester;
    })().catch((err) => {
      loadingPromise = null;
      NS.utils?.showToast?.('⚠️ Không thể mở Bác sĩ App lúc này: ' + (err?.message || err), 'error', 3500);
      throw err;
    });

    return loadingPromise;
  }

  const loaderApi = {
    async open() {
      const engine = await ensureLoaded();
      engine?.open?.();
      return engine;
    },
    async toggle() {
      if (globalScope.NoirAutoTester?.isOpen?.()) {
        globalScope.NoirAutoTester.closeAndCleanup();
        return null;
      }
      return this.open();
    },
    close() {
      globalScope.NoirAutoTester?.closeAndCleanup?.();
    },
    isLoaded() {
      return loaded;
    },
  };

  NS.autoTesterLoader = loaderApi;

  // Lazy Single-Call Pull-Based Bridge Proxy (Spec §10.2):
  // Antigravity chỉ cần gọi `await window.__AUTOTESTER__.runFullAudit()` bất kỳ lúc nào -> tự động nạp lõi v2.0 & trả JSON < 2K token!
  if (!globalScope.__AUTOTESTER__) {
    globalScope.__AUTOTESTER__ = {
      version: '2.0.0-lazy-proxy',
      async runFullAudit(opts = {}) {
        await ensureLoaded();
        return globalScope.__AUTOTESTER__.runFullAudit(opts);
      },
      async auditViewports(widths) {
        await ensureLoaded();
        return globalScope.__AUTOTESTER__.auditViewports(widths);
      },
      async getCapabilities() {
        await ensureLoaded();
        return globalScope.__AUTOTESTER__.getCapabilities();
      },
      async getSurfaceDelta() {
        await ensureLoaded();
        return globalScope.__AUTOTESTER__.getSurfaceDelta();
      },
      async getDelegationQueue(ctx) {
        await ensureLoaded();
        return globalScope.__AUTOTESTER__.getDelegationQueue(ctx);
      },
      async exportTokenCappedReport(ctx) {
        await ensureLoaded();
        return globalScope.__AUTOTESTER__.exportTokenCappedReport(ctx);
      },
      async updateBaselines() {
        await ensureLoaded();
        return globalScope.__AUTOTESTER__.updateBaselines();
      },
    };
  }

  // 1. Lắng nghe bấm nút "🩺 Autotester nội bộ" ở bất kỳ đâu trên giao diện
  document.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('#btn-mod48-open-autotester, [data-open-autotester="true"]');
    if (!btn) return;
    ev.preventDefault();
    // Nếu đang nằm trong modal báo lỗi Mod 34 -> đóng gọn modal đó trước
    const bugModal = document.getElementById('modal-mod34-bug-report');
    if (bugModal && !bugModal.classList.contains('hidden')) {
      bugModal.classList.add('hidden');
    }
    loaderApi.open();
  });

  // 2. Phím tắt Laptop: Ctrl + Shift + Alt + T
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey && ev.shiftKey && ev.altKey && String(ev.key || '').toLowerCase() === 't') {
      ev.preventDefault();
      loaderApi.toggle();
    }
  });

  // 3. Chạm nhanh 5 lần vào biểu tượng / tên ứng dụng trên điện thoại
  let logoTapCount = 0;
  let logoLastTapMs = 0;
  document.addEventListener('click', (ev) => {
    const hit = ev.target?.closest?.('header img, header h1, #app-brand-logo, [data-autotest-logo-tap]');
    if (!hit) return;
    const now = Date.now();
    if (now - logoLastTapMs > 900) logoTapCount = 0;
    logoLastTapMs = now;
    logoTapCount += 1;
    if (logoTapCount >= 5) {
      logoTapCount = 0;
      loaderApi.open();
    }
  });

  // 4. Tự mở nếu URL có ?autotest=1 hoặc tự mở & chạy luôn 0-Token nếu ?autotest=auto
  try {
    const params = new URLSearchParams(globalScope.location?.search || '');
    const atMode = params.get('autotest');
    if (atMode === '1' || atMode === 'auto') {
      const boot = () => setTimeout(async () => {
        if (atMode === 'auto') {
          const gate = document.getElementById('app-entry-connection-gate');
          const gateVisible = gate && !gate.classList.contains('hidden') && getComputedStyle(gate).display !== 'none';
          if (gateVisible) {
            document.getElementById('btn-gate-enter-guest-mode')?.click?.();
            await new Promise((r) => setTimeout(r, 550));
            document.getElementById('noir-welcome-api-upsell-modal')?.remove?.();
          }
        }
        const engine = await loaderApi.open();
        if (atMode === 'auto' && engine && typeof engine.runAllSelected === 'function') {
          setTimeout(() => {
            if (!engine.isRunning) engine.runAllSelected();
          }, 300);
        }
      }, 650);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
      else boot();
    }
  } catch (_e) {}
})(typeof window !== 'undefined' ? window : globalThis);
