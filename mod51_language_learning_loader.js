/**
 * ============================================================================
 * 🎓 MODULE 51: CỔNG NẠP LƯỜI "HỌC NGOẠI NGỮ QUA TRANG WEB" (ZERO-IDLE RAM — v131.0)
 * ============================================================================
 * - Siêu nhẹ (~2.5 KB), KHÔNG tải mã nguồn học ngoại ngữ hay Flashcard khi chưa bấm.
 * - Mở trực tiếp từ mục cuối cùng của bảng Chọn Ngôn Ngữ (6 thứ tiếng ngăn cách bởi /).
 * - Khi đóng pop-up -> gọi `destroy()` dừng SpeechSynthesis, gỡ DOM & giải phóng RAM.
 * ============================================================================
 */
(function initMod51LangLearningLoader(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});
  if (NS.__MOD51_LANG_LEARN_LOADER_READY__) return;
  NS.__MOD51_LANG_LEARN_LOADER_READY__ = true;

  const STYLE_ID = 'mod51-lang-learn-style';
  const STYLE_HREF = 'modules/lang-learning/styles/lang-learning.css';
  const SCRIPTS = [
    'modules/lang-learning/engines/langLearningEngine.js',
    'modules/lang-learning/ui/langLearningUI.js',
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
      if (document.querySelector(`script[data-mod51-src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.dataset.mod51Src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Không nạp được ${src}`));
      document.body.appendChild(s);
    });
  }

  async function ensureLoaded() {
    if (loaded && globalScope.NoirLangLearning?.open) return globalScope.NoirLangLearning;
    if (loadingPromise) return loadingPromise;
    loadingPromise = (async () => {
      ensureStylesheet();
      for (const src of SCRIPTS) await loadScriptOnce(src);
      loaded = true;
      return globalScope.NoirLangLearning;
    })().catch((err) => {
      loadingPromise = null;
      NS.utils?.showToast?.('⚠️ Không thể mở Học ngoại ngữ qua trang web: ' + (err?.message || err), 'error', 3500);
      throw err;
    });
    return loadingPromise;
  }

  const facade = {
    isLoaded: () => loaded,
    async open() {
      const mod = await ensureLoaded();
      return mod?.open?.();
    },
    close() {
      if (loaded && globalScope.NoirLangLearning?.close) {
        globalScope.NoirLangLearning.close();
      }
    },
  };

  NS.langLearningStudio = facade;
  NS.mod51 = facade;

  document.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('[data-open-lang-learning="true"]');
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    NS.i18n?.closePopover?.();
    facade.open();
  });
})(typeof window !== 'undefined' ? window : globalThis);
