/**
 * ============================================================================
 * 📈 MODULE 49: CỔNG NẠP LƯỜI "ĐẦU TƯ HÔM NAY" (ZERO-IDLE RAM LOADER — v123.0)
 * ============================================================================
 * - Siêu nhẹ (~3 KB), KHÔNG tải mã nguồn phân hệ đầu tư, KHÔNG mở IndexedDB,
 *   KHÔNG gọi API giá vàng/chứng khoán/GPS và KHÔNG tạo setInterval khi chưa bấm.
 * - Chỉ nạp động `modules/invest-today/*` đúng thời điểm người dùng bấm mở
 *   tab/nút "📈 Đầu tư hôm nay".
 * - Khi người dùng đóng cửa sổ -> gọi `destroy()` hủy mọi AbortController,
 *   gỡ DOM & giải phóng RAM ngay lập tức.
 * ============================================================================
 */
(function initMod49InvestTodayLoader(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});
  if (NS.__MOD49_INVEST_LOADER_READY__) return;
  NS.__MOD49_INVEST_LOADER_READY__ = true;

  const STYLE_ID = 'inv-today-v123-style';
  const STYLE_HREF = 'modules/invest-today/styles/invest-today.css';
  const SCRIPTS = [
    'modules/invest-today/core/coreAdapters.js',
    'modules/invest-today/engines/deterministicExtractor.js',
    'modules/invest-today/engines/marketEngines.js',
    'modules/invest-today/engines/researchAndPromptEngine.js',
    'modules/invest-today/ui/investCharts.js',
    'modules/invest-today/ui/investUI.js',
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
      if (document.querySelector(`script[data-inv-src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.dataset.invSrc = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Không nạp được tệp ${src}`));
      document.body.appendChild(s);
    });
  }

  async function ensureEngineLoaded() {
    if (loaded && globalScope.NoirInvestToday?.mountIntoContainer) {
      return globalScope.NoirInvestToday;
    }
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      ensureStylesheet();
      for (const src of SCRIPTS) {
        await loadScriptOnce(src);
      }
      loaded = true;
      return globalScope.NoirInvestToday;
    })().catch((err) => {
      loadingPromise = null;
      NS.utils?.showToast?.('⚠️ Không thể mở Đầu tư hôm nay lúc này: ' + (err?.message || err), 'error', 3600);
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
          '<div class="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">⏳ Đang nạp giao diện Đầu tư hôm nay...</div>';
      }
      try {
        const mod = await ensureEngineLoaded();
        if (!hostEl.isConnected) return;
        await mod.mountIntoContainer(hostEl);
      } catch (err) {
        if (hostEl.isConnected) {
          hostEl.innerHTML = `<div class="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300">⚠️ Không nạp được phân hệ Đầu tư hôm nay (${err?.message || err}). Vui lòng tải lại trang rồi thử lại.</div>`;
        }
      }
    },

    onModalClosed() {
      if (loaded && globalScope.NoirInvestToday?.destroy) {
        globalScope.NoirInvestToday.destroy();
      }
    },

    openFromAnywhere() {
      if (NS.worldClockStudio?.openModal) {
        NS.worldClockStudio.openModal('market');
      }
    },
  };

  NS.marketAdvisor = facade;
  NS.mod49 = facade;

  // Lắng nghe nút mở nhanh "📈 Đầu tư hôm nay" trên thanh đầu trang (nếu có)
  document.addEventListener('click', (ev) => {
    const trigger = ev.target?.closest?.('#btn-mod49-header-invest-today, [data-open-invest-today="true"]');
    if (!trigger) return;
    ev.preventDefault();
    ev.stopPropagation();
    facade.openFromAnywhere();
  });
})(typeof window !== 'undefined' ? window : globalThis);
