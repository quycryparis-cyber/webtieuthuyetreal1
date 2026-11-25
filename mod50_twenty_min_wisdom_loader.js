/**
 * ============================================================================
 * 🧠 MODULE 50: CỔNG NẠP LƯỜI "20 PHÚT THÔNG THÁI MỖI NGÀY" (ZERO-IDLE RAM — v130.0)
 * ============================================================================
 * - Siêu nhẹ (~3 KB), KHÔNG tải mã nguồn phân hệ, KHÔNG gọi API tin tức/GPS,
 *   KHÔNG tạo setInterval khi người dùng chưa bấm mở tab.
 * - Chỉ nạp động `modules/twenty-min-wisdom/*` đúng lúc bấm "🧠 20 phút thông thái".
 * - Khi đóng cửa sổ hoặc chuyển tab -> gọi `destroy()` hủy mọi AbortController,
 *   dừng đồng hồ 20 phút, gỡ DOM & giải phóng RAM ngay lập tức.
 * ============================================================================
 */
(function initMod50TwentyMinWisdomLoader(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});
  if (NS.__MOD50_WISDOM_LOADER_READY__) return;
  NS.__MOD50_WISDOM_LOADER_READY__ = true;

  const STYLE_ID = 'wis20-v130-style';
  const STYLE_HREF = 'modules/twenty-min-wisdom/styles/twenty-min-wisdom.css';
  const SCRIPTS = [
    'modules/twenty-min-wisdom/engines/wisdomEngine.js',
    'modules/twenty-min-wisdom/engines/wisdomPdfExporter.js',
    'modules/twenty-min-wisdom/ui/wisdomCharts.js',
    'modules/twenty-min-wisdom/ui/wisdomUI.js',
  ];

  let loadingPromise = null;
  let loaded = false;

  function ensureStylesheet() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    document.head.appendChild(link);
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-wis20-src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.dataset.wis20Src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Không nạp được tệp ${src}`));
      document.body.appendChild(s);
    });
  }

  async function ensureEngineLoaded() {
    if (loaded && globalScope.NoirWisdom20?.mountIntoContainer) {
      return globalScope.NoirWisdom20;
    }
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      ensureStylesheet();
      for (const src of SCRIPTS) {
        await loadScriptOnce(src);
      }
      loaded = true;
      return globalScope.NoirWisdom20;
    })().catch((err) => {
      loadingPromise = null;
      NS.utils?.showToast?.('⚠️ Không thể mở 30 phút thông thái lúc này: ' + (err?.message || err), 'error', 3600);
      throw err;
    });

    return loadingPromise;
  }

  const facade = {
    isLoaded() {
      return loaded;
    },

    async mountIntoContainer(hostEl) {
      if (!hostEl) return;
      if (!loaded) {
        hostEl.innerHTML =
          '<div class="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">⏳ Đang nạp giao diện 30 phút thông thái mỗi ngày...</div>';
      }
      try {
        const mod = await ensureEngineLoaded();
        if (!hostEl.isConnected) return;
        await mod.mountIntoContainer(hostEl);
      } catch (err) {
        if (hostEl.isConnected) {
          hostEl.innerHTML = `<div class="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300">⚠️ Không nạp được phân hệ 30 phút thông thái (${err?.message || err}). Vui lòng tải lại trang rồi thử lại.</div>`;
        }
      }
    },

    onModalClosed() {
      if (loaded && globalScope.NoirWisdom20?.destroy) {
        globalScope.NoirWisdom20.destroy();
      }
    },

    openFromAnywhere() {
      if (NS.worldClockStudio?.openModal) {
        NS.worldClockStudio.openModal('wisdom');
      }
    },
  };

  NS.twentyMinWisdom = facade;
  NS.mod50 = facade;

  document.addEventListener('click', (ev) => {
    const trigger = ev.target?.closest?.('#btn-mod50-header-wisdom, [data-open-wisdom-20="true"]');
    if (!trigger) return;
    ev.preventDefault();
    ev.stopPropagation();
    facade.openFromAnywhere();
  });
})(typeof window !== 'undefined' ? window : globalThis);
