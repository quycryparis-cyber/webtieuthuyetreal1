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

  const AUTOTESTER_SCRIPTS = [
    'autotester/intelligence/intelligence.js',
    'autotester/core/coreEngine.js',
    'autotester/auditors/auditors.js',
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

  // 4. Tự mở nếu URL có ?autotest=1
  try {
    const params = new URLSearchParams(globalScope.location?.search || '');
    if (params.get('autotest') === '1') {
      const boot = () => setTimeout(() => loaderApi.open(), 600);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
      else boot();
    }
  } catch (_e) {}
})(typeof window !== 'undefined' ? window : globalThis);
