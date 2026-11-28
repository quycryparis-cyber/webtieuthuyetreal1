/**
 * ============================================================================
 * MODULE 46C: ĐĂNGLOVEPDF — PRO 4-LAYER PDF VIEWER & TRUE INTERACTIVE PDF EDITOR
 * (v121 — Không phụ thuộc React/Bundler, chạy mượt 100% Desktop & Mobile!)
 * ============================================================================
 * 1. PRO 4-LAYER INTERACTIVE PDF VIEWER (openProPdfViewer):
 *    - Cột ảnh thu nhỏ (Thumbnails) tải lười + Cây Mục lục (Outlines/Bookmarks)
 *    - Lớp chọn chữ thật (Text Selection Layer) bôi đen copy trực tiếp trên trang
 *    - Tìm kiếm Ctrl+F hỗ trợ Regex & đánh dấu vị trí khớp trên trang
 *    - Chế độ 1 trang / 2 trang đối xứng (Sách mở) / Cuộn liên tục (LRU Cache)
 *    - Đảo màu Đọc ban đêm thông minh (Smart Dark Mode), Zoom 50%–300%, Xoay góc nhìn
 * 2. TRUE INTERACTIVE VISUAL PDF EDITOR (mountTruePdfEditor + exportEditedPdf):
 *    - Tự động gom cụm đoạn chữ gốc trong PDF (Paragraph Reconstruction) -> Bấm thẳng
 *      vào đoạn chữ gốc để sửa trực tiếp tại chỗ (Direct Text Editing + Text Reflow)!
 *    - Đủ 10 công cụ tương tác trực tiếp trên trang: Sửa chữ gốc, Chèn chữ mới,
 *      Chèn ảnh/Logo, Tô sáng Highlight, Vẽ bút mượt Bezier, Vẽ khung/Mũi tên,
 *      Đo kích thước bản vẽ CAD có tỷ lệ, Con dấu động kèm ngày giờ, Che đen bảo mật,
 *      Di chuyển/Xóa đối tượng + Undo/Redo (Command Stack) nhiều trang!
 * ============================================================================
 */
(function initMod46cEditorAndViewer(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  // ==========================================================================
  // PHẦN 0A: UNIFIED HiDPI PDF RENDERER (CHỐNG MỜ CHỮ TOÀN DIỆN 2x–3x CHO 48 CÔNG CỤ)
  // ==========================================================================
  const activeRenderTasks = new WeakMap();

  const DangLovePDFRenderer = {
    getOutputScale(isThumbnail = false) {
      const dpr = Number(global.devicePixelRatio) || 1;
      return isThumbnail ? Math.min(Math.max(dpr, 1.5), 2) : Math.min(Math.max(dpr, 2), 3);
    },

    async renderPageToCanvas(page, canvas, optsOrScale = {}, extraOpts = {}) {
      if (!page || !canvas) return { cssW: 0, cssH: 0, outputScale: 2, viewport: null };
      const opts = typeof optsOrScale === 'number'
        ? { ...extraOpts, scale: optsOrScale }
        : (optsOrScale || {});
      const { scale = 1, rotation = 0, isThumbnail = false, bgColor = '#ffffff' } = opts;
      const prevTask = activeRenderTasks.get(canvas);
      if (prevTask && typeof prevTask.cancel === 'function') {
        try { prevTask.cancel(); } catch (_e) {}
      }

      const outputScale = this.getOutputScale(isThumbnail);
      const viewport = page.getViewport({ scale, rotation });
      const cssW = Math.max(1, Math.floor(viewport.width));
      const cssH = Math.max(1, Math.floor(viewport.height));
      const backingW = Math.max(1, Math.floor(viewport.width * outputScale));
      const backingH = Math.max(1, Math.floor(viewport.height * outputScale));

      canvas.width = backingW;
      canvas.height = backingH;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, backingW, backingH);
      ctx.restore();

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      const task = page.render({
        canvasContext: ctx,
        viewport,
        transform,
        intent: 'display',
      });
      activeRenderTasks.set(canvas, task);
      try {
        await task.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') throw err;
      } finally {
        if (activeRenderTasks.get(canvas) === task) activeRenderTasks.delete(canvas);
      }
      return { cssW, cssH, backingW, backingH, outputScale, viewport };
    },
  };
  global.DangLovePDFRenderer = DangLovePDFRenderer;

  // ==========================================================================
  // PHẦN 0B: 3-TIER FONT SYNCHRONIZATION ENGINE (ELECTRON / LOCAL / METRIC CDN + IDB)
  // ==========================================================================
  const FONT_IDB_NAME = 'DangLovePDF_FontCache';
  const FONT_CDN_URLS = {
    tinos: {
      regular: 'https://fonts.gstatic.com/s/tinos/v26/buE4poGnedXvwgX8.ttf',
      bold: 'https://fonts.gstatic.com/s/tinos/v26/buE1poGnedXvwj1AW0Fp.ttf',
      italic: 'https://fonts.gstatic.com/s/tinos/v26/buE2poGnedXvwjX-fmE.ttf',
      boldItalic: 'https://fonts.gstatic.com/s/tinos/v26/buEzpoGnedXvwjX-Rt1s0Co.ttf',
      label: 'Tinos (Khớp 1:1 Times New Roman)',
      cssFallback: '"Times New Roman", Georgia, serif',
    },
    arimo: {
      regular: 'https://fonts.gstatic.com/s/arimo/v36/P5sfzZCDf9_T_3cV7NCUECyoxNk37cxsBw.ttf',
      bold: 'https://fonts.gstatic.com/s/arimo/v36/P5sfzZCDf9_T_3cV7NCUECyoxNk3CstsBw.ttf',
      italic: 'https://fonts.gstatic.com/s/arimo/v36/P5sdzZCDf9_T_10c3i9MeUcyat4iJY-ERBrE.ttf',
      boldItalic: 'https://fonts.gstatic.com/s/arimo/v36/P5sdzZCDf9_T_10c3i9MeUcyat4iJY9jQxrE.ttf',
      label: 'Arimo (Khớp 1:1 Arial/Helvetica)',
      cssFallback: 'Arial, Helvetica, sans-serif',
    },
    cousine: {
      regular: 'https://fonts.gstatic.com/s/cousine/v31/d6lIkaiiRdih4SpPzSM.ttf',
      bold: 'https://fonts.gstatic.com/s/cousine/v31/d6lNkaiiRdih4SpP9Z8K6T4.ttf',
      italic: 'https://fonts.gstatic.com/s/cousine/v31/d6lKkaiiRdih4SpP_SEvyQ.ttf',
      boldItalic: 'https://fonts.gstatic.com/s/cousine/v31/d6lPkaiiRdih4SpP_SEXdTvM1w.ttf',
      label: 'Cousine (Khớp 1:1 Courier New)',
      cssFallback: '"Courier New", Consolas, monospace',
    },
    carlito: {
      regular: 'https://fonts.gstatic.com/s/carlito/v4/3Jn9SDPw3m-pk039PDA.ttf',
      bold: 'https://fonts.gstatic.com/s/carlito/v4/3Jn4SDPw3m-pk039BIykaX0.ttf',
      italic: 'https://fonts.gstatic.com/s/carlito/v4/3Jn_SDPw3m-pk039DDKBSQ.ttf',
      boldItalic: 'https://fonts.gstatic.com/s/carlito/v4/3Jn6SDPw3m-pk039DDK59XglVg.ttf',
      label: 'Carlito (Khớp 1:1 Calibri)',
      cssFallback: 'Calibri, "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif',
    },
    caladea: {
      regular: 'https://fonts.gstatic.com/s/caladea/v10/kJEzBugZ7AAjhybUjR8.ttf',
      bold: 'https://fonts.gstatic.com/s/caladea/v10/kJE2BugZ7AAjhybUtaNY39o.ttf',
      italic: 'https://fonts.gstatic.com/s/caladea/v10/kJExBugZ7AAjhybUvR19_w.ttf',
      boldItalic: 'https://fonts.gstatic.com/s/caladea/v10/kJE0BugZ7AAjhybUvR1FQ98SrA.ttf',
      label: 'Caladea (Khớp 1:1 Cambria)',
      cssFallback: 'Cambria, Georgia, serif',
    },
    notoserif: {
      regular: 'https://fonts.gstatic.com/s/notoserif/v33/ga6iaw1J5X9T9RW6j9bNVls-hfgvz8JcMofYTa32J4wsL2JAlAhZqFCjwA.ttf',
      bold: 'https://fonts.gstatic.com/s/notoserif/v33/ga6iaw1J5X9T9RW6j9bNVls-hfgvz8JcMofYTa32J4wsL2JAlAhZT1ejwA.ttf',
      italic: 'https://fonts.gstatic.com/s/notoserif/v33/ga6saw1J5X9T9RW6j9bNfFIMZhhWnFTyNZIQD1-_FXP0RgnaOg9MYBNLg8cP.ttf',
      boldItalic: 'https://fonts.gstatic.com/s/notoserif/v33/ga6saw1J5X9T9RW6j9bNfFIMZhhWnFTyNZIQD1-_FXP0RgnaOg9MYBOshMcP.ttf',
      label: 'Noto Serif (Khớp LaTeX / Học thuật)',
      cssFallback: '"Times New Roman", Cambria, Georgia, serif',
    },
    roboto: {
      regular: 'https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf',
      bold: 'https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammT.ttf',
      italic: 'https://fonts.gstatic.com/s/roboto/v51/KFOKCnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmOClHrs6ljXfMMLoHQiA8.ttf',
      boldItalic: 'https://fonts.gstatic.com/s/roboto/v51/KFOKCnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmOClHrs6ljXfMMLmbXiA8.ttf',
      label: 'Roboto (Chuẩn tiếng Việt)',
      cssFallback: 'Roboto, "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif',
    },
    notosans: {
      regular: 'https://fonts.gstatic.com/s/arimo/v36/P5sfzZCDf9_T_3cV7NCUECyoxNk37cxsBw.ttf',
      bold: 'https://fonts.gstatic.com/s/arimo/v36/P5sfzZCDf9_T_3cV7NCUECyoxNk3CstsBw.ttf',
      italic: 'https://fonts.gstatic.com/s/arimo/v36/P5sdzZCDf9_T_10c3i9MeUcyat4iJY-ERBrE.ttf',
      boldItalic: 'https://fonts.gstatic.com/s/arimo/v36/P5sdzZCDf9_T_10c3i9MeUcyat4iJY9jQxrE.ttf',
      label: 'Arimo / Sans (Đầy đủ dấu Việt)',
      cssFallback: '"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif',
    },
  };

  const DangLovePDFFontResolver = {
    _memCache: new Map(), // key -> { bytes: Uint8Array, dynamicFamily: string, badge: string, cssFallback: string }
    _localFontsCache: null,
    _fontkitPromise: null,

    async ensureFontkit() {
      if (global.fontkit) return global.fontkit;
      if (this._fontkitPromise) return this._fontkitPromise;
      this._fontkitPromise = new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js';
        s.async = true;
        s.onload = () => resolve(global.fontkit || null);
        s.onerror = () => resolve(null);
        document.head.appendChild(s);
      });
      return this._fontkitPromise;
    },

    cleanRawFontName(rawName) {
      return String(rawName || '')
        .replace(/^[A-Z]{6}\+/, '')
        .replace(/[,_]+/g, ' ')
        .trim();
    },

    classifyFontMeta(rawName, styleObj) {
      const clean = this.cleanRawFontName(rawName);
      const combo = `${clean} ${styleObj?.fontFamily || ''}`.toLowerCase();
      const isBold = /bold|black|heavy|semibold|demi|700|800|-b\b|bd\b/i.test(combo);
      const isItalic = /italic|oblique|slant|-i\b|it\b/i.test(combo);

      let canonicalKey = 'arimo';
      let displayFamily = clean || 'Sans-Serif';
      let genericCategory = 'sans';
      let cssFallback = 'Arial, Helvetica, sans-serif';

      if (/courier|consolas|mono|menlo|code|inconsolata/i.test(combo)) {
        canonicalKey = 'cousine';
        displayFamily = clean || 'Courier New';
        genericCategory = 'mono';
        cssFallback = '"Courier New", Consolas, monospace';
      } else if (/calibri|carlito/i.test(combo)) {
        canonicalKey = 'carlito';
        displayFamily = 'Calibri';
        genericCategory = 'sans';
        cssFallback = 'Calibri, "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      } else if (/cambria|caladea/i.test(combo)) {
        canonicalKey = 'caladea';
        displayFamily = 'Cambria';
        genericCategory = 'serif';
        cssFallback = 'Cambria, Georgia, serif';
      } else if (/cmr|cmbx|cmti|cmmi|lmr|lmbx|tex|stix|computer\s*modern|noto\s*serif/i.test(combo)) {
        canonicalKey = 'notoserif';
        displayFamily = 'Noto Serif (LaTeX/Times)';
        genericCategory = 'serif';
        cssFallback = '"Times New Roman", Cambria, Georgia, serif';
      } else if (/times|tinos|nimbus\s*roman|minion|garamond|georgia|palatino|serif|vn-?time/i.test(combo)) {
        canonicalKey = 'tinos';
        displayFamily = /georgia/i.test(combo) ? 'Georgia' : 'Times New Roman';
        genericCategory = 'serif';
        cssFallback = '"Times New Roman", Georgia, serif';
      } else if (/roboto/i.test(combo)) {
        canonicalKey = 'roboto';
        displayFamily = 'Roboto';
        genericCategory = 'sans';
        cssFallback = 'Roboto, "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      } else if (/arial|helvetica|arimo|inter|be\s*vietnam|open\s*sans|segoe|tahoma|verdana|sans/i.test(combo)) {
        canonicalKey = 'arimo';
        displayFamily = /segoe/i.test(combo) ? 'Be Vietnam Pro' : /tahoma/i.test(combo) ? 'Tahoma' : /verdana/i.test(combo) ? 'Verdana' : 'Arial';
        genericCategory = 'sans';
        cssFallback = 'Arial, Helvetica, sans-serif';
      } else if (styleObj?.fontFamily && /serif/i.test(styleObj.fontFamily) && !/sans/i.test(styleObj.fontFamily)) {
        canonicalKey = 'tinos';
        displayFamily = 'Times New Roman';
        genericCategory = 'serif';
        cssFallback = '"Times New Roman", Georgia, serif';
      }

      return {
        rawFontName: rawName || '',
        cleanFontFamily: displayFamily,
        canonicalKey,
        isBold,
        isItalic,
        genericCategory,
        cssFallback,
      };
    },

    async _idbGet(key) {
      if (typeof indexedDB === 'undefined') return null;
      return new Promise((resolve) => {
        try {
          const req = indexedDB.open(FONT_IDB_NAME, 1);
          req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains('fonts')) req.result.createObjectStore('fonts');
          };
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('fonts', 'readonly');
            const g = tx.objectStore('fonts').get(key);
            g.onsuccess = () => { db.close(); resolve(g.result || null); };
            g.onerror = () => { db.close(); resolve(null); };
          };
          req.onerror = () => resolve(null);
        } catch (_e) { resolve(null); }
      });
    },

    async _idbSet(key, bytes) {
      if (typeof indexedDB === 'undefined') return;
      return new Promise((resolve) => {
        try {
          const req = indexedDB.open(FONT_IDB_NAME, 1);
          req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains('fonts')) req.result.createObjectStore('fonts');
          };
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('fonts', 'readwrite');
            tx.objectStore('fonts').put(bytes, key);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); resolve(); };
          };
          req.onerror = () => resolve();
        } catch (_e) { resolve(); }
      });
    },

    async enableWebLocalFonts() {
      if (typeof global.queryLocalFonts !== 'function') return { ok: false, count: 0 };
      try {
        const list = await global.queryLocalFonts();
        this._localFontsCache = Array.isArray(list) ? list : [];
        return { ok: true, count: this._localFontsCache.length };
      } catch (_e) {
        return { ok: false, count: 0 };
      }
    },

    async _registerDynamicFontFace(cacheKey, bytes, meta = {}) {
      const dynFamily = `DL_Sync_${cacheKey.replace(/[^a-z0-9]/gi, '_')}`;
      try {
        if (typeof FontFace !== 'undefined' && document.fonts) {
          const descriptors = {
            weight: meta.isBold ? '700' : '400',
            style: meta.isItalic ? 'italic' : 'normal',
          };
          const ff = new FontFace(dynFamily, bytes.slice().buffer, descriptors);
          const loaded = await ff.load();
          document.fonts.add(loaded);
          await document.fonts.ready;
          return dynFamily;
        }
      } catch (_eFf) {}
      return '';
    },

    async resolveFontForBlock(meta) {
      const variant = meta.isBold && meta.isItalic ? 'boldItalic' : meta.isBold ? 'bold' : meta.isItalic ? 'italic' : 'regular';
      const cacheKey = `${meta.canonicalKey}_${meta.cleanFontFamily}_${variant}`.toLowerCase();
      if (this._memCache.has(cacheKey)) return this._memCache.get(cacheKey);

      let bytes = null;
      let badge = `Đồng bộ tương đương: ${meta.cleanFontFamily}`;

      // Tầng 1: Electron Native System Fonts (100% offline thật từ Windows/Mac)
      if (global.NoirDesktopLocalEngine?.resolveSystemFont) {
        try {
          const res = await global.NoirDesktopLocalEngine.resolveSystemFont({
            family: meta.cleanFontFamily,
            isBold: meta.isBold,
            isItalic: meta.isItalic,
          });
          if (res?.ok && res.base64) {
            const bin = atob(res.base64);
            bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            badge = `🎯 Khớp 100% Font máy: ${meta.cleanFontFamily}`;
          }
        } catch (_eElec) {}
      }

      // Tầng 2: Browser Local Font Access (nếu người dùng đã cấp quyền)
      if (!bytes && Array.isArray(this._localFontsCache) && this._localFontsCache.length) {
        try {
          const needle = meta.cleanFontFamily.toLowerCase();
          const match = this._localFontsCache.find((f) => {
            const fn = String(f.family || '').toLowerCase();
            const st = String(f.style || '').toLowerCase();
            if (!fn.includes(needle)) return false;
            const bOk = meta.isBold ? /bold|700/i.test(st) : !/bold|700/i.test(st);
            const iOk = meta.isItalic ? /italic|oblique/i.test(st) : !/italic|oblique/i.test(st);
            return bOk && iOk;
          });
          if (match && typeof match.blob === 'function') {
            const blob = await match.blob();
            bytes = new Uint8Array(await blob.arrayBuffer());
            badge = `🎯 Khớp 100% Font máy: ${match.family}`;
          }
        } catch (_eLoc) {}
      }

      // Tầng 3: Kho Font Metric-Compatible Tiếng Việt (IndexedDB Cache -> jsDelivr CDN)
      if (!bytes) {
        const idbKey = `cdn_${meta.canonicalKey}_${variant}`;
        const cachedBytes = await this._idbGet(idbKey);
        if (cachedBytes && cachedBytes.byteLength > 1000) {
          bytes = cachedBytes instanceof Uint8Array ? cachedBytes : new Uint8Array(cachedBytes);
          const entry = FONT_CDN_URLS[meta.canonicalKey] || FONT_CDN_URLS.arimo;
          badge = `🎯 Đồng bộ 1:1 (Cache): ${meta.cleanFontFamily} → ${entry.label}`;
        } else {
          const entry = FONT_CDN_URLS[meta.canonicalKey] || FONT_CDN_URLS.arimo;
          const url = entry[variant] || entry.regular;
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              bytes = new Uint8Array(await resp.arrayBuffer());
              if (bytes.byteLength > 1000) {
                await this._idbSet(idbKey, bytes);
                badge = `🎯 Đồng bộ 1:1: ${meta.cleanFontFamily} → ${entry.label}`;
              } else {
                bytes = null;
              }
            }
          } catch (_eCdn) {
            bytes = null;
          }
        }
      }

      const dynamicFamily = bytes ? await this._registerDynamicFontFace(cacheKey, bytes, meta) : '';
      // Tier 0 (Đỉnh cao): Ghép trực tiếp FontFace gốc PDF.js đã giải mã từ file PDF (embeddedLoadedName)
      // lên ĐẦU chuỗi ưu tiên, kế tiếp là Font Tiếng Việt 1:1 (Tinos/Arimo/Cousine/Carlito/Caladea/NotoSerif) cho ký tự mới gõ!
      const familyChain = [];
      if (meta.embeddedLoadedName) familyChain.push(`"${meta.embeddedLoadedName}"`);
      if (dynamicFamily) familyChain.push(`"${dynamicFamily}"`);
      familyChain.push(meta.cssFallback || '"Times New Roman", Georgia, serif');
      const result = {
        bytes,
        dynamicFamily,
        embeddedLoadedName: meta.embeddedLoadedName || '',
        cssFontFamily: familyChain.join(', '),
        badge: meta.embeddedLoadedName && bytes
          ? `🎯 Khớp 100% Font gốc PDF + Tiếng Việt: ${meta.cleanFontFamily}`
          : bytes
          ? badge
          : `🔤 Khớp họ font: ${meta.cleanFontFamily}`,
        isVectorReady: Boolean(bytes),
      };
      this._memCache.set(cacheKey, result);
      return result;
    },
  };
  global.DangLovePDFFontResolver = DangLovePDFFontResolver;

  // ==========================================================================
  // PHẦN 1: PRO 4-LAYER INTERACTIVE PDF VIEWER
  // ==========================================================================
  async function openProPdfViewer(resItem, ensurePdfJs) {
    document.getElementById('modal-mod46-interactive-preview')?.remove();

    const pv = document.createElement('div');
    pv.id = 'modal-mod46-interactive-preview';
    pv.className = 'fixed inset-0 z-[2147483625] backdrop-blur-md flex flex-col text-zinc-100 overflow-hidden';
    pv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100dvh;background:rgba(9,9,11,0.97);display:flex;flex-direction:column;';
    pv.setAttribute('role', 'dialog');
    pv.setAttribute('aria-modal', 'true');

    pv.innerHTML = `
      <!-- Thanh công cụ trên cùng -->
      <div class="px-2.5 sm:px-4 py-2 border-b border-zinc-800 bg-zinc-900/95 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <button type="button" id="btn-mod46-pv-sidebar" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer" title="Mở/Đóng cột Ảnh thu nhỏ & Mục lục">📑 Trang</button>
          <span class="text-xs sm:text-sm font-black text-sky-300 truncate max-w-[160px] sm:max-w-[260px]" title="${escHtml(resItem.name)}">👁️ ${escHtml(resItem.name)}</span>
          <span class="hidden md:inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold">${formatBytes(resItem.size)}</span>
        </div>

        <!-- Điều hướng trang & Zoom -->
        <div class="flex items-center gap-1 flex-wrap">
          <button type="button" id="btn-mod46-pv-prev" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer">◀ Trước</button>
          <span id="mod46-pv-page-info" class="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-950/90 border border-zinc-700 text-xs font-extrabold text-amber-300 whitespace-nowrap" title="Bấm vào số trang để nhập và nhảy thẳng tới trang bất kỳ">
            <span>Trang</span>
            <span id="mod46-pv-page-sr" class="sr-only">1</span>
            <input id="inp-mod46-pv-page" type="number" min="1" max="1" value="1" inputmode="numeric" aria-label="Số trang hiện tại" class="w-12 px-1 py-0.5 rounded-lg bg-zinc-900 border border-amber-400/50 text-center text-xs font-black text-amber-300 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-400" />
            <span id="mod46-pv-page-total" class="text-zinc-300 font-bold">/ ...</span>
          </span>
          <button type="button" id="btn-mod46-pv-next" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer">Sau ▶</button>
          <button type="button" id="btn-mod46-pv-zoom-out" class="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer" title="Thu nhỏ">➖</button>
          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-xl bg-zinc-950/90 border border-zinc-700" title="Nhập hoặc chọn % phóng to (25% – 400%)">
            <span id="mod46-pv-zoom-val" class="sr-only">100%</span>
            <input id="inp-mod46-pv-zoom-pct" type="number" min="25" max="400" step="5" value="100" inputmode="numeric" aria-label="Tỷ lệ phóng to (%)" class="w-12 bg-transparent text-center text-[11px] font-bold text-amber-300 focus:outline-none" />
            <span class="text-[10px] font-bold text-zinc-400">%</span>
            <select id="sel-mod46-pv-zoom-preset" aria-label="Chọn nhanh tỷ lệ phóng to" class="w-5 bg-zinc-900 text-zinc-300 text-[10px] font-bold rounded cursor-pointer focus:outline-none">
              <option value="50">50%</option>
              <option value="75">75%</option>
              <option value="100" selected>100%</option>
              <option value="125">125%</option>
              <option value="150">150%</option>
              <option value="200">200%</option>
              <option value="250">250%</option>
              <option value="300">300%</option>
            </select>
          </span>
          <button type="button" id="btn-mod46-pv-zoom-in" class="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer" title="Phóng to">➕</button>
          <button type="button" id="btn-mod46-pv-rotate" class="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer" title="Xoay góc nhìn 90°">↻</button>
          <select id="sel-mod46-pv-layout" class="px-2 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-100" title="Chọn chế độ hiển thị trang">
            <option value="scroll" selected>📜 Cuộn liên tục</option>
            <option value="spread">📖 2 trang sách</option>
            <option value="single">📄 1 trang đơn</option>
          </select>
          <button type="button" id="btn-mod46-pv-dark" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-indigo-600 text-xs font-bold cursor-pointer" title="Đảo màu đọc ban đêm thông minh">🌙</button>
        </div>

        <!-- Tìm kiếm Ctrl+F + Tải + Đóng -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <div class="flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-950 border border-zinc-700">
            <input id="inp-mod46-pv-search" type="text" placeholder="🔍 Tìm chữ (Ctrl+F)..." class="w-28 sm:w-36 bg-transparent text-xs text-zinc-100 focus:outline-none" />
            <label class="text-[10px] text-zinc-400 flex items-center gap-0.5 cursor-pointer" title="Tìm theo Regex"><input id="chk-mod46-pv-regex" type="checkbox" class="accent-amber-400" />.*</label>
            <span id="mod46-pv-search-stat" class="text-[10px] font-bold text-amber-300"></span>
            <button type="button" id="btn-mod46-pv-find-next" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-amber-600 text-[10px] font-bold cursor-pointer">▼</button>
          </div>
          <button type="button" id="btn-mod46-pv-ai-summary" class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer" title="AI tóm tắt nhanh nội dung tài liệu PDF này">🤖 Tóm tắt AI</button>
          <button type="button" id="btn-mod46-pv-ai-manual" class="px-2.5 py-1.5 rounded-xl border border-sky-500/55 bg-sky-950/45 hover:bg-sky-900/65 text-sky-200 text-xs font-bold cursor-pointer" title="Dùng AI Thủ công 0-Token không cần API Key">📋 AI Thủ công</button>
          <a href="${resItem.url}" download="${escHtml(resItem.name)}" class="px-3 py-1.5 min-h-[36px] inline-flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 whitespace-nowrap">⬇️ Tải</a>
          <button type="button" id="btn-mod46-pv-close" class="px-3 py-1.5 min-h-[36px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap">✕ Đóng</button>
        </div>
      </div>

      <!-- Khung thân chính: Sidebar trái (Thumbnails / Mục lục) + Sân khấu 4 lớp -->
      <div class="flex-1 min-h-0 w-full flex overflow-hidden" style="flex:1;min-height:0;width:100%;display:flex;">
        <aside id="mod46-pv-sidebar" class="hidden w-44 sm:w-56 border-r border-zinc-800 bg-zinc-900/95 flex-col shrink-0 overflow-hidden">
          <div class="grid grid-cols-2 border-b border-zinc-800 text-[11px] font-bold">
            <button type="button" data-pv-stab="thumbs" class="py-2 bg-zinc-800 text-emerald-300 cursor-pointer">🖼️ Trang nhỏ</button>
            <button type="button" data-pv-stab="outline" class="py-2 text-zinc-400 hover:text-white cursor-pointer">📑 Mục lục</button>
          </div>
          <div id="mod46-pv-thumbs-list" class="flex-1 overflow-y-auto p-2 space-y-2"></div>
          <div id="mod46-pv-outline-list" class="hidden flex-1 overflow-y-auto p-2 space-y-1 text-xs"></div>
        </aside>

        <div id="mod46-pv-stage" class="flex-1 min-w-0 min-h-0 w-full overflow-auto py-3 sm:py-5 px-2 sm:px-6 flex flex-col items-center gap-4 bg-zinc-950/95" style="flex:1;min-width:0;min-height:0;width:100%;">
          <div class="py-12 text-sm font-bold text-sky-300 animate-pulse">⏳ Đang khởi động nhân đọc PDF 4 lớp ngay trên máy...</div>
        </div>
      </div>
    `;
    document.body.appendChild(pv);
    NS.i18n?.translateElement?.(pv);

    let pdfDoc = null;
    let isClosed = false;
    let renderToken = 0;
    let currentPage = 1;
    let zoomFactor = 1.0;
    let viewRot = 0;
    let layoutMode = 'scroll'; // Mặc định cuộn liên tục mượt mà như trình đọc PDF chuẩn
    let darkInvert = false;
    let searchMatches = [];
    let searchIdx = -1;
    let scrollObserver = null;
    let scrollRafId = 0;
    let resizeDebounceTimer = null;
    let isProgrammaticScroll = false;
    let programmaticScrollTimer = null;
    const MAX_LIVE_CANVASES = 12;
    const renderedSlots = new Map(); // pageNo -> { slotEl, lastTouched }
    const renderingSlots = new Set(); // pageNo currently rendering
    const slotMap = new Map(); // pageNo -> slotEl

    const stage = pv.querySelector('#mod46-pv-stage');
    const sidebar = pv.querySelector('#mod46-pv-sidebar');
    const thumbsList = pv.querySelector('#mod46-pv-thumbs-list');
    const outlineList = pv.querySelector('#mod46-pv-outline-list');
    const pageInputEl = pv.querySelector('#inp-mod46-pv-page');
    const pageTotalEl = pv.querySelector('#mod46-pv-page-total');
    const zoomValEl = pv.querySelector('#mod46-pv-zoom-val');
    const zoomInputEl = pv.querySelector('#inp-mod46-pv-zoom-pct');
    const zoomPresetEl = pv.querySelector('#sel-mod46-pv-zoom-preset');
    const prevBtn = pv.querySelector('#btn-mod46-pv-prev');
    const nextBtn = pv.querySelector('#btn-mod46-pv-next');
    const searchInput = pv.querySelector('#inp-mod46-pv-search');
    const regexChk = pv.querySelector('#chk-mod46-pv-regex');
    const searchStat = pv.querySelector('#mod46-pv-search-stat');

    pv.querySelector('#btn-mod46-pv-ai-manual')?.addEventListener('click', async () => {
      const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
      if (!pdfDoc || !gBridge) return;
      const limit = Math.min(pdfDoc.numPages, 12);
      const chunks = [];
      for (let i = 1; i <= limit; i++) {
        const pg = await pdfDoc.getPage(i);
        const tc = await pg.getTextContent();
        chunks.push(`[Trang ${i}] ` + tc.items.map((it) => it.str).join(' '));
      }
      const promptTxt = gBridge.buildTaskManualPrompt('viewer_summary', { fileName: resItem?.name || 'PDF', text: chunks.join('\n') });
      gBridge.openManualAiAssistantModal?.({
        taskTitle: 'Trình Đọc PDF — Tóm tắt AI Thủ công (0-Token)',
        promptText: promptTxt,
        attachFileName: resItem?.name || '',
        applyBtnLabel: '✅ Hiển thị bản Tóm tắt ngay trên Trình Đọc',
        onApplyPasted: (pasted) => {
          pv.querySelector('#mod46-pv-ai-drawer')?.remove();
          const drawer = document.createElement('div');
          drawer.id = 'mod46-pv-ai-drawer';
          drawer.className = 'fixed right-4 top-16 z-[2147483645] w-[min(92vw,420px)] max-h-[75dvh] rounded-2xl border border-emerald-500/50 bg-zinc-900/98 text-zinc-100 shadow-2xl flex flex-col overflow-hidden';
          drawer.innerHTML = `
            <div class="px-3.5 py-2.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-emerald-300">🤖 Tóm tắt PDF (Gemini Thủ công)</span>
              <button type="button" id="btn-pv-ai-drawer-close" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-xs font-bold cursor-pointer">✕</button>
            </div>
            <div class="p-3.5 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-zinc-200"></div>
          `;
          drawer.querySelector('.overflow-y-auto').textContent = pasted;
          drawer.querySelector('#btn-pv-ai-drawer-close')?.addEventListener('click', () => drawer.remove());
          pv.appendChild(drawer);
        },
      });
    });

    pv.querySelector('#btn-mod46-pv-ai-summary')?.addEventListener('click', async () => {
      const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
      if (!gBridge?.hasApiKey?.()) {
        gBridge?.openApiKeyQuickModal?.({ onSaved: () => pv.querySelector('#btn-mod46-pv-ai-summary')?.click() });
        return;
      }
      if (!pdfDoc) return;
      const loader = gBridge.showAiFullLoadingOverlay?.('🤖 AI đang đọc & tóm tắt tài liệu PDF...', 'Tổng hợp ý chính, số liệu quan trọng và các điểm cần lưu ý');
      const showViewerSummaryDrawer = (summaryText) => {
        pv.querySelector('#mod46-pv-ai-drawer')?.remove();
        const drawer = document.createElement('div');
        drawer.id = 'mod46-pv-ai-drawer';
        drawer.className = 'fixed right-4 top-16 z-[2147483645] w-[min(92vw,420px)] max-h-[75dvh] rounded-2xl border border-emerald-500/50 bg-zinc-900/98 text-zinc-100 shadow-2xl flex flex-col overflow-hidden';
        drawer.innerHTML = `
          <div class="px-3.5 py-2.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-emerald-300">🤖 Tóm tắt nhanh bằng Gemini AI</span>
            <button type="button" id="btn-pv-ai-drawer-close" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-xs font-bold cursor-pointer">✕</button>
          </div>
          <div class="p-3.5 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-zinc-200"></div>
        `;
        drawer.querySelector('.overflow-y-auto').textContent = summaryText;
        drawer.querySelector('#btn-pv-ai-drawer-close')?.addEventListener('click', () => drawer.remove());
        pv.appendChild(drawer);
      };
      let promptTxt = '';
      try {
        const limit = Math.min(pdfDoc.numPages, 12);
        const chunks = [];
        for (let i = 1; i <= limit; i++) {
          const pg = await pdfDoc.getPage(i);
          const tc = await pg.getTextContent();
          chunks.push(`[Trang ${i}] ` + tc.items.map((it) => it.str).join(' '));
        }
        promptTxt = gBridge.buildTaskManualPrompt('viewer_summary', { fileName: resItem?.name || 'PDF', text: chunks.join('\n') });
        const summary = await gBridge.callGeminiText(promptTxt, { taskType: 'deep_analysis', temperature: 0.2, maxOutputTokens: 2048 });
        loader?.close?.();
        showViewerSummaryDrawer(summary);
      } catch (err) {
        loader?.showError?.('⚠️ Lỗi tóm tắt PDF bằng AI', String(err?.message || err), {
          manualFallback: promptTxt ? {
            taskTitle: 'Tóm tắt PDF — Dán kết quả từ Gemini Web',
            promptText: promptTxt,
            applyBtnLabel: '✅ Hiển thị bản Tóm tắt ngay',
            onApplyPasted: (pasted) => showViewerSummaryDrawer(pasted),
          } : null,
        });
      }
    });

    const cleanupScrollTracking = () => {
      if (scrollObserver) {
        try { scrollObserver.disconnect(); } catch (_e) {}
        scrollObserver = null;
      }
      if (scrollRafId) {
        cancelAnimationFrame(scrollRafId);
        scrollRafId = 0;
      }
      renderedSlots.clear();
      renderingSlots.clear();
      slotMap.clear();
    };

    const syncPageIndicator = (pageNo) => {
      if (!pdfDoc) return;
      const total = pdfDoc.numPages;
      currentPage = Math.max(1, Math.min(total, Number(pageNo) || 1));
      if (pageInputEl) {
        pageInputEl.max = String(total);
        if (document.activeElement !== pageInputEl) {
          pageInputEl.value = String(currentPage);
        }
      }
      const pageSrEl = pv.querySelector('#mod46-pv-page-sr');
      if (pageSrEl) pageSrEl.textContent = String(currentPage);
      if (pageTotalEl) {
        pageTotalEl.textContent =
          layoutMode === 'spread' && currentPage < total
            ? `–${currentPage + 1} / ${total}`
            : `/ ${total}`;
      }
      const pct = Math.round(zoomFactor * 100);
      if (zoomValEl) zoomValEl.textContent = `${pct}%`;
      if (zoomInputEl && document.activeElement !== zoomInputEl) zoomInputEl.value = String(pct);
      if (zoomPresetEl && Array.from(zoomPresetEl.options).some((o) => Number(o.value) === pct)) {
        zoomPresetEl.value = String(pct);
      }
      if (prevBtn) prevBtn.disabled = currentPage <= 1;
      if (nextBtn) nextBtn.disabled = currentPage >= total;
      // Tô sáng ảnh thu nhỏ đang xem ở cột trái
      if (thumbsList) {
        thumbsList.querySelectorAll('[data-thumb-page]').forEach((btn) => {
          const isCur = Number(btn.getAttribute('data-thumb-page')) === currentPage;
          btn.classList.toggle('border-amber-400', isCur);
          btn.classList.toggle('ring-1', isCur);
          btn.classList.toggle('ring-amber-400', isCur);
          btn.classList.toggle('border-zinc-700', !isCur);
        });
      }
    };

    const closePreview = () => {
      if (isClosed) return;
      isClosed = true;
      renderToken += 1;
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
      cleanupScrollTracking();
      stage?.removeEventListener('scroll', onStageScroll);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResizeViewer);
      pv.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0; });
      const docRef = pdfDoc;
      pdfDoc = null;
      pv.remove();
      try {
        const p = docRef?.destroy?.();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_e) {}
    };

    const onKeyDown = (ev) => {
      const tag = String(ev.target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';
      if ((ev.ctrlKey || ev.metaKey) && String(ev.key || '').toLowerCase() === 'f') {
        ev.preventDefault();
        searchInput?.focus();
      } else if (ev.key === 'Escape') {
        closePreview();
      } else if (!isTyping && ev.key === 'ArrowRight') {
        goToPage(currentPage + (layoutMode === 'spread' ? 2 : 1));
      } else if (!isTyping && ev.key === 'ArrowLeft') {
        goToPage(currentPage - (layoutMode === 'spread' ? 2 : 1));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    pv.querySelector('#btn-mod46-pv-close')?.addEventListener('click', closePreview);

    pv.querySelector('#btn-mod46-pv-sidebar')?.addEventListener('click', () => {
      sidebar?.classList.toggle('hidden');
      sidebar?.classList.toggle('flex');
      setTimeout(() => rebuildCurrentLayout(currentPage), 50);
    });
    const onResizeViewer = () => {
      if (isClosed || !pdfDoc) return;
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(() => {
        if (!isClosed && pdfDoc) rebuildCurrentLayout(currentPage);
      }, 160);
    };
    window.addEventListener('resize', onResizeViewer);
    pv.querySelectorAll('[data-pv-stab]').forEach((b) => {
      b.addEventListener('click', () => {
        const tab = b.getAttribute('data-pv-stab');
        pv.querySelectorAll('[data-pv-stab]').forEach((x) => x.classList.remove('bg-zinc-800', 'text-emerald-300'));
        b.classList.add('bg-zinc-800', 'text-emerald-300');
        thumbsList?.classList.toggle('hidden', tab !== 'thumbs');
        outlineList?.classList.toggle('hidden', tab !== 'outline');
      });
    });

    function computePageDimensions(baseVp) {
      const sidebarOpen = sidebar && !sidebar.classList.contains('hidden');
      const fallbackWinW = Math.max(320, (window.innerWidth || 1024) - (sidebarOpen ? 228 : 0));
      const measuredW = Math.max(stage.clientWidth || 0, fallbackWinW);
      const isMobileVw = (window.innerWidth || 1024) < 640;
      const maxCardW =
        layoutMode === 'spread'
          ? Math.max(260, (measuredW - 64) / 2)
          : isMobileVw
          ? Math.max(300, measuredW - 20)
          : Math.max(460, Math.min(measuredW - 56, 1180));
      const fitScale = maxCardW / Math.max(1, baseVp.width);
      const dpr = DangLovePDFRenderer.getOutputScale(false);
      const renderScale = Math.max(0.55, Math.min(3.5, fitScale * zoomFactor));
      const cssW = Math.floor(baseVp.width * renderScale);
      const cssH = Math.floor(baseVp.height * renderScale);
      return { renderScale, dpr, cssW, cssH };
    }

    async function paintPageIntoContainer(pageNo, wrap, isFirstPrimary, expectedToken) {
      if (isClosed || !pdfDoc || expectedToken !== renderToken) return;
      const page = await pdfDoc.getPage(pageNo);
      if (isClosed || !pdfDoc || expectedToken !== renderToken) return;
      const rot = (page.rotate + viewRot) % 360;
      const baseVp = page.getViewport({ scale: 1, rotation: rot });
      const { renderScale, cssW, cssH } = computePageDimensions(baseVp);

      wrap.style.width = `${cssW}px`;
      wrap.style.height = `${cssH}px`;
      wrap.style.filter = darkInvert ? 'invert(0.9) hue-rotate(180deg) contrast(0.95)' : '';
      wrap.innerHTML = '';

      // Layer 1: Unified HiDPI 2x–3x Canvas (chống mờ chữ hoàn toàn!)
      const canvas = document.createElement('canvas');
      if (isFirstPrimary) canvas.id = 'mod46-preview-pdf-canvas';
      canvas.className = 'block';
      wrap.appendChild(canvas);

      try {
        await DangLovePDFRenderer.renderPageToCanvas(page, canvas, {
          scale: renderScale,
          rotation: rot,
          isThumbnail: false,
        });
      } catch (_eRender) {
        return;
      }
      if (isClosed || !pdfDoc || expectedToken !== renderToken) return;

      // Layer 2 & 3: Lớp chọn chữ trong suốt (Text Selection Layer) + Highlight Tìm kiếm Ctrl+F
      const textLayer = document.createElement('div');
      textLayer.className = 'absolute inset-0 overflow-hidden';
      textLayer.style.userSelect = 'text';
      textLayer.style.webkitUserSelect = 'text';
      const queryRaw = (searchInput?.value || '').trim();
      let matcher = null;
      if (queryRaw) {
        try {
          matcher = regexChk?.checked ? new RegExp(queryRaw, 'gi') : new RegExp(queryRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        } catch (_eRe) {}
      }

      try {
        const tc = await page.getTextContent();
        if (isClosed || !pdfDoc || expectedToken !== renderToken) return;
        const cssVp = page.getViewport({ scale: renderScale, rotation: rot });
        for (const it of tc.items) {
          if (!it.str) continue;
          const tx = global.pdfjsLib.Util.transform(cssVp.transform, it.transform);
          const fontH = Math.max(8, Math.hypot(tx[2], tx[3]));
          const span = document.createElement('span');
          span.textContent = it.str;
          span.style.position = 'absolute';
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - fontH * 0.88}px`;
          span.style.fontSize = `${fontH}px`;
          span.style.lineHeight = '1';
          span.style.whiteSpace = 'pre';
          span.style.color = 'transparent';
          if (matcher && matcher.test(it.str)) {
            matcher.lastIndex = 0;
            span.style.background = 'rgba(251, 191, 36, 0.45)';
            span.style.borderRadius = '2px';
          }
          textLayer.appendChild(span);
        }
      } catch (_eTxt) {}
      wrap.appendChild(textLayer);

      // Layer 4: Annotation Link Overlay (giúp bấm thẳng liên kết trong file PDF)
      try {
        const annos = await page.getAnnotations({ intent: 'display' });
        if (isClosed || !pdfDoc || expectedToken !== renderToken) return;
        if (Array.isArray(annos) && annos.length > 0) {
          const linkVp = page.getViewport({ scale: renderScale, rotation: rot });
          const linkLayer = document.createElement('div');
          linkLayer.className = 'noir-pdf-link-layer absolute inset-0 pointer-events-none select-none';
          linkLayer.style.zIndex = '4';
          let linkCount = 0;
          for (const anno of annos) {
            if (!anno || anno.subtype !== 'Link' || !Array.isArray(anno.rect) || anno.rect.length < 4) continue;
            const rawUrl = String(anno.url || anno.unsafeUrl || '').trim();
            if (!/^(https?:\/\/|mailto:)/i.test(rawUrl)) continue;
            const vr = linkVp.convertToViewportRectangle(anno.rect);
            if (!Array.isArray(vr) || vr.length < 4) continue;
            const lx = Math.min(vr[0], vr[2]);
            const ty = Math.min(vr[1], vr[3]);
            const lw = Math.abs(vr[2] - vr[0]);
            const lh = Math.abs(vr[3] - vr[1]);
            if (lw < 4 || lh < 4) continue;
            const a = document.createElement('a');
            a.href = rawUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.title = `Mở liên kết: ${rawUrl}`;
            a.setAttribute('aria-label', `Mở liên kết ${rawUrl}`);
            a.className = 'noir-pdf-link-hitbox block pointer-events-auto cursor-pointer rounded transition-colors hover:bg-cyan-400/20 active:bg-cyan-400/30';
            a.style.position = 'absolute';
            a.style.left = `${lx.toFixed(1)}px`;
            a.style.top = `${ty.toFixed(1)}px`;
            a.style.width = `${lw.toFixed(1)}px`;
            a.style.height = `${lh.toFixed(1)}px`;
            a.addEventListener('click', (ev) => {
              ev.stopPropagation();
            });
            linkLayer.appendChild(a);
            linkCount++;
          }
          if (linkCount > 0) wrap.appendChild(linkLayer);
        }
      } catch (_eLink) {}

      // Nhãn số trang góc dưới
      const badge = document.createElement('div');
      badge.className = 'absolute bottom-1.5 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white pointer-events-none';
      badge.textContent = `Trang ${pageNo}`;
      wrap.appendChild(badge);
    }

    async function renderSinglePageCard(pageNo, isFirstPrimary, expectedToken) {
      const wrap = document.createElement('div');
      wrap.className = 'relative rounded-xl shadow-2xl border border-zinc-700 bg-white overflow-hidden shrink-0';
      wrap.dataset.pvPage = String(pageNo);
      await paintPageIntoContainer(pageNo, wrap, isFirstPrimary, expectedToken);
      return wrap;
    }

    function evictDistantScrollCanvases() {
      if (renderedSlots.size <= MAX_LIVE_CANVASES) return;
      const entries = Array.from(renderedSlots.entries())
        .filter(([pNo]) => Math.abs(pNo - currentPage) > 4)
        .sort((a, b) => Math.abs(b[0] - currentPage) - Math.abs(a[0] - currentPage));
      while (renderedSlots.size > MAX_LIVE_CANVASES && entries.length) {
        const [evictNo, info] = entries.shift();
        info.slotEl.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0; });
        info.slotEl.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400 select-none">Trang ${evictNo}</div>`;
        renderedSlots.delete(evictNo);
      }
    }

    async function ensureScrollSlotRendered(pageNo, expectedToken) {
      if (isClosed || !pdfDoc || expectedToken !== renderToken) return;
      if (renderedSlots.has(pageNo) || renderingSlots.has(pageNo)) return;
      const slot = slotMap.get(pageNo);
      if (!slot || !slot.isConnected) return;
      renderingSlots.add(pageNo);
      try {
        await paintPageIntoContainer(pageNo, slot, pageNo === 1, expectedToken);
        if (!isClosed && expectedToken === renderToken) {
          renderedSlots.set(pageNo, { slotEl: slot, lastTouched: Date.now() });
          evictDistantScrollCanvases();
        }
      } catch (_eSlot) {
      } finally {
        renderingSlots.delete(pageNo);
      }
    }

    function detectVisiblePageOnScroll() {
      if (isClosed || !pdfDoc || layoutMode !== 'scroll' || !slotMap.size) return;
      const stageRect = stage.getBoundingClientRect();
      const anchorY = stageRect.top + stageRect.height * 0.32;
      let bestPage = currentPage;
      let bestDist = Infinity;
      slotMap.forEach((slot, pNo) => {
        const r = slot.getBoundingClientRect();
        const mid = (r.top + r.bottom) / 2;
        const dist = Math.abs(mid - anchorY);
        if (r.top <= anchorY && r.bottom >= anchorY) {
          bestPage = pNo;
          bestDist = -1;
        } else if (bestDist >= 0 && dist < bestDist) {
          bestDist = dist;
          bestPage = pNo;
        }
      });
      if (bestPage !== currentPage) {
        syncPageIndicator(bestPage);
      }
    }

    function onStageScroll() {
      if (isClosed || layoutMode !== 'scroll' || isProgrammaticScroll) return;
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = 0;
        detectVisiblePageOnScroll();
      });
    }
    stage?.addEventListener('scroll', onStageScroll, { passive: true });

    async function rebuildContinuousScrollLayout(targetPageNo) {
      if (isClosed || !pdfDoc || !pv.isConnected) return;
      const myToken = ++renderToken;
      cleanupScrollTracking();
      const total = pdfDoc.numPages;
      const startPage = Math.max(1, Math.min(total, Number(targetPageNo) || 1));
      syncPageIndicator(startPage);

      // Dọn canvas cũ giải phóng RAM ngay lập tức
      stage.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0; });
      stage.innerHTML = '';

      // Đo kích thước chuẩn từ trang 1 để dựng sẵn khung cuộn mượt không bị nhảy trang
      const p1 = await pdfDoc.getPage(1);
      if (isClosed || myToken !== renderToken) return;
      const rot1 = (p1.rotate + viewRot) % 360;
      const baseVp1 = p1.getViewport({ scale: 1, rotation: rot1 });
      const { cssW: estW, cssH: estH } = computePageDimensions(baseVp1);

      const frag = document.createDocumentFragment();
      for (let i = 1; i <= total; i++) {
        const slot = document.createElement('div');
        slot.className = 'mod46-pv-page-slot relative rounded-xl shadow-2xl border border-zinc-700 bg-zinc-900 overflow-hidden shrink-0';
        slot.dataset.pvPage = String(i);
        slot.style.width = `${estW}px`;
        slot.style.height = `${estH}px`;
        if (darkInvert) slot.style.filter = 'invert(0.9) hue-rotate(180deg) contrast(0.95)';
        slot.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400 select-none">⏳ Đang dựng trang ${i} / ${total}...</div>`;
        slotMap.set(i, slot);
        frag.appendChild(slot);
      }
      stage.appendChild(frag);

      // Quan sát cuộn (tải trước vùng đệm 900px trên & dưới để lướt không bị khựng!)
      scrollObserver = new IntersectionObserver(
        (entries) => {
          if (isClosed || myToken !== renderToken) return;
          entries.forEach((en) => {
            if (en.isIntersecting) {
              const pNo = Number(en.target.getAttribute('data-pv-page'));
              if (pNo) ensureScrollSlotRendered(pNo, myToken);
            }
          });
        },
        { root: stage, rootMargin: '900px 0px', threshold: 0.01 }
      );
      slotMap.forEach((slot) => scrollObserver.observe(slot));

      // Cuộn ngay tới trang mục tiêu và vẽ ưu tiên trang mục tiêu + trang kế cận
      const targetSlot = slotMap.get(startPage);
      if (targetSlot) {
        isProgrammaticScroll = true;
        stage.scrollTop = Math.max(0, targetSlot.offsetTop - 12);
        if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
        programmaticScrollTimer = setTimeout(() => { isProgrammaticScroll = false; }, 180);
      }
      await ensureScrollSlotRendered(startPage, myToken);
      if (startPage + 1 <= total) ensureScrollSlotRendered(startPage + 1, myToken);
      if (startPage - 1 >= 1) ensureScrollSlotRendered(startPage - 1, myToken);
    }

    async function renderPagedView(targetPageNo) {
      if (isClosed || !pdfDoc || !pv.isConnected) return;
      const myToken = ++renderToken;
      cleanupScrollTracking();
      const total = pdfDoc.numPages;
      syncPageIndicator(targetPageNo);

      // Dọn canvas cũ giải phóng RAM ngay lập tức (LRU cleanup)
      stage.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0; });
      stage.innerHTML = '';

      const row = document.createElement('div');
      row.className = layoutMode === 'spread' ? 'flex flex-wrap justify-center items-start gap-3' : 'flex flex-col items-center';
      stage.appendChild(row);
      stage.scrollTop = 0;

      try {
        const card1 = await renderSinglePageCard(currentPage, true, myToken);
        if (isClosed || myToken !== renderToken) return;
        row.appendChild(card1);
        if (layoutMode === 'spread' && currentPage + 1 <= total) {
          const card2 = await renderSinglePageCard(currentPage + 1, false, myToken);
          if (isClosed || myToken !== renderToken) return;
          row.appendChild(card2);
        }
      } catch (_eView) {}
    }

    async function rebuildCurrentLayout(targetPageNo) {
      if (layoutMode === 'scroll') {
        await rebuildContinuousScrollLayout(targetPageNo);
      } else {
        await renderPagedView(targetPageNo);
      }
    }

    async function goToPage(targetPageNo, { smooth = false } = {}) {
      if (isClosed || !pdfDoc || !pv.isConnected) return;
      const total = pdfDoc.numPages;
      const clamped = Math.max(1, Math.min(total, Math.round(Number(targetPageNo) || 1)));
      if (layoutMode === 'scroll' && slotMap.size === total) {
        syncPageIndicator(clamped);
        const slot = slotMap.get(clamped);
        if (slot) {
          isProgrammaticScroll = true;
          const topPos = Math.max(0, slot.offsetTop - 12);
          try {
            stage.scrollTo({ top: topPos, behavior: smooth ? 'smooth' : 'auto' });
          } catch (_eScr) {
            stage.scrollTop = topPos;
          }
          if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
          programmaticScrollTimer = setTimeout(() => { isProgrammaticScroll = false; }, smooth ? 420 : 120);
        }
        const myToken = renderToken;
        await ensureScrollSlotRendered(clamped, myToken);
        if (clamped + 1 <= total) ensureScrollSlotRendered(clamped + 1, myToken);
        if (clamped - 1 >= 1) ensureScrollSlotRendered(clamped - 1, myToken);
      } else {
        await rebuildCurrentLayout(clamped);
      }
    }

    // Cho phép bấm trực tiếp vào số trang (ví dụ 14) sửa thành số khác rồi Enter để nhảy thẳng tới trang đó!
    const commitPageInputJump = () => {
      if (!pdfDoc || !pageInputEl) return;
      const raw = parseInt(String(pageInputEl.value || '').trim(), 10);
      if (!Number.isFinite(raw)) {
        pageInputEl.value = String(currentPage);
        return;
      }
      const clamped = Math.max(1, Math.min(pdfDoc.numPages, raw));
      pageInputEl.value = String(clamped);
      pageInputEl.blur();
      goToPage(clamped, { smooth: true });
    };
    pageInputEl?.addEventListener('focus', () => {
      try { pageInputEl.select(); } catch (_e) {}
    });
    pageInputEl?.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        commitPageInputJump();
      } else if (ev.key === 'Escape') {
        ev.stopPropagation();
        pageInputEl.value = String(currentPage);
        pageInputEl.blur();
      }
    });
    pageInputEl?.addEventListener('change', commitPageInputJump);

    async function runSearchAcrossPdf() {
      if (!pdfDoc) return;
      const q = (searchInput?.value || '').trim();
      searchMatches = [];
      searchIdx = -1;
      if (!q) {
        if (searchStat) searchStat.textContent = '';
        await rebuildCurrentLayout(currentPage);
        return;
      }
      let re;
      try {
        re = regexChk?.checked ? new RegExp(q, 'gi') : new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      } catch (_e) {
        if (searchStat) searchStat.textContent = 'Regex lỗi';
        return;
      }
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const pg = await pdfDoc.getPage(i);
        const tc = await pg.getTextContent();
        const fullStr = tc.items.map((x) => x.str).join(' ');
        if (re.test(fullStr)) {
          searchMatches.push(i);
          re.lastIndex = 0;
        }
      }
      if (searchMatches.length) {
        searchIdx = 0;
        if (searchStat) searchStat.textContent = `1/${searchMatches.length}`;
        await rebuildCurrentLayout(searchMatches[0]);
      } else {
        if (searchStat) searchStat.textContent = '0 kết quả';
        await rebuildCurrentLayout(currentPage);
      }
    }

    try {
      const pdfjsLib = await ensurePdfJs();
      const bytes = new Uint8Array(await resItem.blob.arrayBuffer());
      pdfDoc = await pdfjsLib.getDocument({ data: bytes, disableCreateObjectURL: true }).promise;

      prevBtn?.addEventListener('click', () => goToPage(currentPage - (layoutMode === 'spread' ? 2 : 1), { smooth: true }));
      nextBtn?.addEventListener('click', () => goToPage(currentPage + (layoutMode === 'spread' ? 2 : 1), { smooth: true }));
      const applyZoomPct = (rawPct) => {
        const parsed = parseInt(String(rawPct || '').replace(/[^\d]/g, ''), 10);
        const clamped = Number.isFinite(parsed) ? Math.max(25, Math.min(400, parsed)) : Math.round(zoomFactor * 100);
        zoomFactor = Number((clamped / 100).toFixed(2));
        if (zoomValEl) zoomValEl.textContent = `${clamped}%`;
        if (zoomInputEl) zoomInputEl.value = String(clamped);
        if (zoomPresetEl && Array.from(zoomPresetEl.options).some((o) => Number(o.value) === clamped)) {
          zoomPresetEl.value = String(clamped);
        }
        rebuildCurrentLayout(currentPage);
      };
      pv.querySelector('#btn-mod46-pv-zoom-out')?.addEventListener('click', () => {
        applyZoomPct(Math.round(zoomFactor * 100) - 20);
      });
      pv.querySelector('#btn-mod46-pv-zoom-in')?.addEventListener('click', () => {
        applyZoomPct(Math.round(zoomFactor * 100) + 20);
      });
      zoomInputEl?.addEventListener('focus', () => {
        try { zoomInputEl.select(); } catch (_e) {}
      });
      zoomInputEl?.addEventListener('change', () => applyZoomPct(zoomInputEl.value));
      zoomInputEl?.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          applyZoomPct(zoomInputEl.value);
          zoomInputEl.blur();
        } else if (ev.key === 'Escape') {
          ev.stopPropagation();
          zoomInputEl.value = String(Math.round(zoomFactor * 100));
          zoomInputEl.blur();
        }
      });
      zoomPresetEl?.addEventListener('change', (ev) => applyZoomPct(ev.target.value));
      pv.querySelector('#btn-mod46-pv-rotate')?.addEventListener('click', () => {
        viewRot = (viewRot + 90) % 360;
        rebuildCurrentLayout(currentPage);
      });
      pv.querySelector('#sel-mod46-pv-layout')?.addEventListener('change', (ev) => {
        layoutMode = ev.target.value;
        rebuildCurrentLayout(currentPage);
      });
      pv.querySelector('#btn-mod46-pv-dark')?.addEventListener('click', (ev) => {
        darkInvert = !darkInvert;
        ev.currentTarget.classList.toggle('bg-indigo-600', darkInvert);
        const filterVal = darkInvert ? 'invert(0.9) hue-rotate(180deg) contrast(0.95)' : '';
        stage.querySelectorAll('[data-pv-page]').forEach((el) => { el.style.filter = filterVal; });
      });
      searchInput?.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') runSearchAcrossPdf();
      });
      pv.querySelector('#btn-mod46-pv-find-next')?.addEventListener('click', () => {
        if (!searchMatches.length) return runSearchAcrossPdf();
        searchIdx = (searchIdx + 1) % searchMatches.length;
        if (searchStat) searchStat.textContent = `${searchIdx + 1}/${searchMatches.length}`;
        goToPage(searchMatches[searchIdx], { smooth: true });
      });

      await rebuildCurrentLayout(1);

      // Nạp bất đồng bộ Ảnh thu nhỏ (tối đa 50 trang đầu) & Cây mục lục (Outlines)
      (async () => {
        if (!pdfDoc || !pv.isConnected) return;
        try {
          const outlines = await pdfDoc.getOutline();
          if (outlineList) {
            if (outlines && outlines.length) {
              outlineList.innerHTML = outlines
                .map((o, idx) => `<button type="button" data-out-idx="${idx}" class="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 truncate cursor-pointer">🔖 ${escHtml(o.title || 'Mục')}</button>`)
                .join('');
              outlineList.querySelectorAll('[data-out-idx]').forEach((btn) => {
                btn.addEventListener('click', async () => {
                  const item = outlines[Number(btn.getAttribute('data-out-idx'))];
                  try {
                    const dest = typeof item.dest === 'string' ? await pdfDoc.getDestination(item.dest) : item.dest;
                    if (dest?.[0]) {
                      const pIdx = await pdfDoc.getPageIndex(dest[0]);
                      goToPage(pIdx + 1, { smooth: true });
                    }
                  } catch (_eDest) {}
                });
              });
            } else {
              outlineList.innerHTML = '<div class="p-3 text-zinc-500 text-center">Tệp PDF này chưa có cây mục lục (Bookmarks).</div>';
            }
          }
        } catch (_eOut) {}

        if (thumbsList && pdfDoc && !isClosed) {
          thumbsList.innerHTML = '';
          const limit = Math.min(pdfDoc?.numPages || 0, 50);
          for (let i = 1; i <= limit; i++) {
            if (isClosed || !pdfDoc || !pv.isConnected) break;
            try {
              const pg = await pdfDoc.getPage(i);
              if (isClosed || !pdfDoc) break;
              const tvp = pg.getViewport({ scale: 0.48 });
              const tc = document.createElement('canvas');
              tc.width = Math.round(tvp.width);
              tc.height = Math.round(tvp.height);
              await pg.render({ canvasContext: tc.getContext('2d'), viewport: tvp, intent: 'display' }).promise;
              if (isClosed || !pv.isConnected) { tc.width = tc.height = 0; break; }
              const itemBtn = document.createElement('button');
              itemBtn.type = 'button';
              itemBtn.setAttribute('data-thumb-page', String(i));
              const isCur = i === currentPage;
              itemBtn.className = `w-full p-1.5 rounded-xl border ${isCur ? 'border-amber-400 ring-1 ring-amber-400' : 'border-zinc-700'} hover:border-emerald-400 bg-zinc-950 flex flex-col items-center gap-1 cursor-pointer`;
              itemBtn.innerHTML = `<img src="${tc.toDataURL('image/jpeg', 0.86)}" class="w-full rounded bg-white" /><span class="text-[10px] font-bold text-zinc-300">Trang ${i}</span>`;
              tc.width = tc.height = 0;
              itemBtn.addEventListener('click', () => goToPage(i, { smooth: true }));
              thumbsList.appendChild(itemBtn);
            } catch (_eThumbCancel) {
              break;
            }
          }
        }
      })();
    } catch (err) {
      stage.innerHTML = `
        <div class="p-6 text-center space-y-3 max-w-md">
          <div class="text-3xl">⚠️</div>
          <div class="text-sm font-bold text-rose-300">Không dựng được xem trước trực tiếp: ${escHtml(err?.message || err)}</div>
          <a href="${resItem.url}" target="_blank" rel="noopener" class="inline-block px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-black">↗️ Mở trong tab mới</a>
        </div>
      `;
    }
  }

  // ==========================================================================
  // PHẦN 2: TRUE INTERACTIVE VISUAL PDF EDITOR (KHÔNG CHỈ STICKY NOTE!)
  // ==========================================================================
  class TrueInteractivePdfEditor {
    constructor() {
      this.pdfDoc = null;
      this.currentPage = 1;
      this.totalPages = 1;
      this.activeMode = 'edit_text'; // edit_text | add_text | highlight | ink | rect | arrow | measure | stamp | redact | image | select
      this.color = '#dc2626';
      this.colorTouched = false;
      this.fontSize = 14;
      this.fontFamily = 'auto'; // Ưu tiên tự động khớp font gốc xung quanh!
      this.bold = false;
      this.italic = false;
      this.underline = false;
      this.measureScale = 5; // 1 cm = 5 m
      this.stampLabel = 'ĐÃ DUYỆT';
      this.pendingImgDataUrl = '';
      this.pageScale = 1;
      this.zoomFactor = 1.0;
      this.outputScale = DangLovePDFRenderer.getOutputScale(false);
      this.baseWidth = 595;
      this.baseHeight = 842;
      this.objectsByPage = {}; // { pageNo: [ ...objects ] }
      this.undoStack = [];
      this.redoStack = [];
      this.extractedBlocksByPage = {};
      this._drawing = null;
    }

    reset() {
      try { this.pdfDoc?.destroy?.(); } catch (_e) {}
      this.pdfDoc = null;
      this.currentPage = 1;
      this.totalPages = 1;
      this.objectsByPage = {};
      this.undoStack = [];
      this.redoStack = [];
      this.extractedBlocksByPage = {};
    }

    _pushUndo() {
      this.undoStack.push(JSON.stringify(this.objectsByPage));
      if (this.undoStack.length > 40) this.undoStack.shift();
      this.redoStack = [];
    }

    undo(rerender) {
      if (!this.undoStack.length) return;
      this.redoStack.push(JSON.stringify(this.objectsByPage));
      this.objectsByPage = JSON.parse(this.undoStack.pop());
      rerender();
    }

    redo(rerender) {
      if (!this.redoStack.length) return;
      this.undoStack.push(JSON.stringify(this.objectsByPage));
      this.objectsByPage = JSON.parse(this.redoStack.pop());
      rerender();
    }

    getPageObjects(pageNo) {
      if (!this.objectsByPage[pageNo]) this.objectsByPage[pageNo] = [];
      return this.objectsByPage[pageNo];
    }

    async mount(container, fileRec, ensurePdfJs) {
      this.reset();
      container.innerHTML = `
        <div id="mod46-true-editor-wrap" class="space-y-2.5">
          <!-- Thanh 10 Công cụ Chỉnh sửa PDF thực thụ -->
          <div class="p-2 rounded-2xl border border-emerald-500/40 bg-zinc-950/90 flex flex-wrap items-center gap-1.5 text-[11px]">
            <button type="button" data-ed-tool="edit_text" class="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold cursor-pointer">🔤 Sửa chữ gốc</button>
            <button type="button" data-ed-tool="add_text" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold cursor-pointer">➕ Chèn chữ</button>
            <button type="button" data-ed-tool="highlight" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold cursor-pointer">🖍️ Tô sáng</button>
            <button type="button" data-ed-tool="ink" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold cursor-pointer">✏️ Bút vẽ</button>
            <button type="button" data-ed-tool="rect" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold cursor-pointer">⬜ Khung</button>
            <button type="button" data-ed-tool="arrow" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold cursor-pointer">↗️ Mũi tên</button>
            <button type="button" data-ed-tool="measure" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold cursor-pointer">📏 Đo CAD</button>
            <button type="button" data-ed-tool="stamp" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold cursor-pointer">🔖 Con dấu động</button>
            <button type="button" data-ed-tool="redact" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold cursor-pointer">⬛ Che đen</button>
            <label class="px-2.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold cursor-pointer">
              🖼️ Chèn ảnh
              <input type="file" id="inp-mod46-ed-img" accept="image/png,image/jpeg,image/webp" class="hidden" />
            </label>
            <button type="button" id="btn-mod46-ed-undo" class="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold cursor-pointer" title="Hoàn tác">↩️</button>
            <button type="button" id="btn-mod46-ed-redo" class="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold cursor-pointer" title="Làm lại">↪️</button>
            <button type="button" id="btn-mod46-ed-clear-page" class="px-2 py-1.5 rounded-xl bg-rose-900/70 hover:bg-rose-600 text-rose-100 font-bold cursor-pointer">🧹 Xóa trang này</button>
          </div>
          <!-- Thanh 6 Công cụ Trợ lý AI PDF Editor (1 chạm) -->
          <div class="p-2 rounded-2xl border border-cyan-500/35 bg-zinc-950/90 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span class="px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-bold">✨ Trợ lý AI (1 chạm):</span>
            <button type="button" id="btn-mod46-ai-ed-polish" class="px-2.5 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold cursor-pointer">✨ Sửa chính tả trang</button>
            <button type="button" id="btn-mod46-ai-ed-translate" class="px-2.5 py-1.5 rounded-xl bg-sky-700/80 hover:bg-sky-600 text-white font-bold cursor-pointer">🌐 Dịch trang AI</button>
            <button type="button" id="btn-mod46-ai-ed-redact" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-700 text-rose-200 font-bold border border-rose-500/40 cursor-pointer">🛡️ Che đen PII AI</button>
            <button type="button" id="btn-mod46-ai-ed-summary" class="px-2.5 py-1.5 rounded-xl bg-amber-700/80 hover:bg-amber-600 text-white font-bold cursor-pointer">📝 Tóm tắt &amp; Dán Note</button>
            <button type="button" id="btn-mod46-ai-ed-table" class="px-2.5 py-1.5 rounded-xl bg-teal-700/80 hover:bg-teal-600 text-white font-bold cursor-pointer">📊 Bóc bảng → Excel</button>
            <button type="button" id="btn-mod46-ai-ed-ocr" class="px-2.5 py-1.5 rounded-xl bg-violet-700/80 hover:bg-violet-600 text-white font-bold cursor-pointer">👁️ OCR AI trang Scan</button>
            <button type="button" id="btn-mod46-ai-ed-manual" class="px-2.5 py-1.5 rounded-xl border border-sky-400/60 bg-sky-950/60 hover:bg-sky-800 text-sky-100 font-bold cursor-pointer">📋 AI Thủ công (0-Token)</button>
          </div>

          <!-- Thanh thuộc tính kiểu Word + Điều hướng trang -->
          <div class="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px]">
            <div class="flex flex-wrap items-center gap-1.5">
              <label class="flex items-center gap-1">Phông:
                <select id="sel-mod46-ed-font" class="px-1.5 py-0.5 rounded bg-zinc-950 border border-emerald-500/50 text-emerald-200 font-bold max-w-[175px]" title="Mặc định ưu tiên khớp phông chữ gốc xung quanh trong PDF">
                  <option value="auto" selected>🎯 Tự khớp font gốc (Ưu tiên)</option>
                  <option value='"Times New Roman", Georgia, serif'>Times New Roman</option>
                  <option value='Arial, Helvetica, sans-serif'>Arial / Helvetica</option>
                  <option value='"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif'>Be Vietnam Pro / Hiện đại</option>
                  <option value='Georgia, "Times New Roman", serif'>Georgia (Sách)</option>
                  <option value='Tahoma, Verdana, sans-serif'>Tahoma / Verdana</option>
                  <option value='"Courier New", Consolas, monospace'>Courier New (Mã số)</option>
                </select>
              </label>
              <label class="flex items-center gap-1">Cỡ: <input id="inp-mod46-ed-fsize" type="number" min="7" max="72" value="14" class="w-12 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-center font-bold" /></label>
              <label class="flex items-center gap-1">Màu: <input id="inp-mod46-ed-color" type="color" value="#dc2626" class="w-6 h-6 rounded bg-transparent border border-zinc-600 cursor-pointer" /></label>
              <button type="button" id="btn-mod46-ed-bold" class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 font-black cursor-pointer" title="In đậm (Bold)">B</button>
              <button type="button" id="btn-mod46-ed-italic" class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 italic font-serif font-bold cursor-pointer" title="In nghiêng (Italic)">I</button>
              <button type="button" id="btn-mod46-ed-underline" class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 underline font-bold cursor-pointer" title="Gạch chân (Underline)">U</button>
              <label class="flex items-center gap-1">Dấu:
                <select id="sel-mod46-ed-stamp" class="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700">
                  <option value="ĐÃ DUYỆT">ĐÃ DUYỆT</option>
                  <option value="BẢO MẬT">BẢO MẬT</option>
                  <option value="BẢN NHÁP">BẢN NHÁP</option>
                  <option value="ĐÃ KIỂM TRA">ĐÃ KIỂM TRA</option>
                </select>
              </label>
              <span id="mod46-ed-font-badge" class="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">🎯 Sẵn sàng khớp font gốc 3 tầng</span>
              <button type="button" id="btn-mod46-ed-local-fonts" class="px-2 py-0.5 rounded-lg border border-sky-500/40 bg-sky-950/60 hover:bg-sky-700 text-sky-200 font-bold text-[10px] cursor-pointer" title="Cấp quyền đọc font thật cài trên Windows/Mac để đồng bộ 100%">🖥️ Font máy</button>
              <span id="mod46-ed-hint" class="text-emerald-300 font-bold">💡 Bấm trực tiếp vào bất kỳ dòng chữ gốc nào (viền nét đứt xanh) để sửa — tự ưu tiên khớp phông &amp; màu chữ xung quanh!</span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button type="button" id="btn-mod46-ed-zoom-out" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-black cursor-pointer" title="Thu nhỏ trang chỉnh sửa">➖</button>
              <span id="mod46-ed-zoom-val" class="text-[10.5px] font-bold text-zinc-300 w-9 text-center">100%</span>
              <button type="button" id="btn-mod46-ed-zoom-in" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-black cursor-pointer" title="Phóng to siêu nét để sửa chữ nhỏ">➕</button>
              <button type="button" id="btn-mod46-ed-prev" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold cursor-pointer">◀</button>
              <span id="mod46-ed-pg-info" class="inline-flex items-center gap-1 font-extrabold text-amber-300" title="Bấm vào số trang để nhập và nhảy thẳng tới trang muốn sửa">
                <span>Trang</span>
                <input id="inp-mod46-ed-page" type="number" min="1" max="1" value="1" inputmode="numeric" class="w-11 px-1 py-0.5 rounded bg-zinc-950 border border-amber-400/50 text-center text-[11px] font-black text-amber-300 focus:outline-none focus:border-amber-300" />
                <span id="mod46-ed-pg-total" class="text-zinc-300">/ 1</span>
              </span>
              <button type="button" id="btn-mod46-ed-next" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold cursor-pointer">▶</button>
            </div>
          </div>

          <!-- Sân khấu chỉnh sửa trực quan 3 lớp (Nền PDF + Khối chữ gốc bấm sửa + Lớp vector vẽ) -->
          <div class="overflow-auto max-h-[62vh] rounded-2xl border border-zinc-700 bg-zinc-950 p-3 flex justify-center">
            <div id="mod46-ed-stage" class="relative bg-white shadow-2xl select-none">
              <canvas id="mod46-ed-pdf-canvas" class="block"></canvas>
              <div id="mod46-ed-textblocks-layer" class="absolute inset-0"></div>
              <canvas id="mod46-ed-overlay-canvas" class="absolute inset-0 cursor-crosshair touch-none"></canvas>
            </div>
          </div>
          <div id="mod46-ed-summary" class="text-[11px] text-zinc-400">Chưa có thay đổi nào — bấm lên trang PDF ở trên để sửa chữ hoặc thêm đối tượng.</div>
        </div>
      `;

      const pdfjsLib = await ensurePdfJs();
      this.pdfDoc = await pdfjsLib.getDocument({ data: fileRec.bytes.slice(), disableCreateObjectURL: true }).promise;
      this.totalPages = this.pdfDoc.numPages;

      const stage = container.querySelector('#mod46-ed-stage');
      const pdfCanvas = container.querySelector('#mod46-ed-pdf-canvas');
      const blocksLayer = container.querySelector('#mod46-ed-textblocks-layer');
      const overlayCanvas = container.querySelector('#mod46-ed-overlay-canvas');
      const hintEl = container.querySelector('#mod46-ed-hint');
      const pgInfoEl = container.querySelector('#mod46-ed-pg-info');
      const summaryEl = container.querySelector('#mod46-ed-summary');

      const updateSummary = () => {
        const totalObjs = Object.values(this.objectsByPage).reduce((s, arr) => s + arr.length, 0);
        if (summaryEl) {
          summaryEl.textContent = totalObjs
            ? `✅ Đang có ${totalObjs} chỉnh sửa trực quan sẵn sàng ghi vào PDF (Bấm nút đỏ bên phải để xuất file!).`
            : 'Chưa có thay đổi nào — bấm lên trang PDF ở trên để sửa chữ hoặc thêm đối tượng.';
        }
      };

      const redrawOverlay = () => {
        const ctx = overlayCanvas.getContext('2d');
        const outSc = this.outputScale || DangLovePDFRenderer.getOutputScale(false);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        ctx.setTransform(outSc, 0, 0, outSc, 0, 0);
        const sc = this.pageScale;
        const objs = this.getPageObjects(this.currentPage);

        for (const o of objs) {
          if (o.type === 'replace_text') {
            const fam = o.fontFamily || 'Arial, Helvetica, sans-serif';
            const fPx = Math.max(8, (o.fontSize || 12) * sc);
            const maxDrawW = Math.max(40, (this.baseWidth - o.x - 18) * sc);
            ctx.fillStyle = o.bgColor || '#ffffff';
            ctx.fillRect(o.x * sc - 2, o.y * sc - 2, o.w * sc + 6, o.h * sc + 4);
            ctx.fillStyle = o.color || '#0f172a';
            ctx.font = `${o.italic ? 'italic ' : ''}${o.bold ? '700 ' : '400 '}${fPx}px ${fam}`;
            ctx.textBaseline = 'top';
            ctx.fillText(o.text, o.x * sc, o.y * sc, maxDrawW);
            if (o.underline && o.text) {
              const tw = Math.min(maxDrawW, ctx.measureText(o.text).width);
              ctx.strokeStyle = o.color || '#0f172a';
              ctx.lineWidth = Math.max(1, fPx * 0.07);
              ctx.beginPath(); ctx.moveTo(o.x * sc, o.y * sc + fPx * 1.05); ctx.lineTo(o.x * sc + tw, o.y * sc + fPx * 1.05); ctx.stroke();
            }
          } else if (o.type === 'add_text') {
            const fam = o.fontFamily || 'Arial, Helvetica, sans-serif';
            const fPx = Math.max(8, (o.fontSize || 14) * sc);
            const maxDrawW = Math.max(40, (this.baseWidth - o.x - 18) * sc);
            ctx.fillStyle = o.color || '#dc2626';
            ctx.font = `${o.italic ? 'italic ' : ''}${o.bold ? '700 ' : '500 '}${fPx}px ${fam}`;
            ctx.textBaseline = 'top';
            ctx.fillText(o.text, o.x * sc, o.y * sc, maxDrawW);
            if (o.underline && o.text) {
              const tw = Math.min(maxDrawW, ctx.measureText(o.text).width);
              ctx.strokeStyle = o.color || '#dc2626';
              ctx.lineWidth = Math.max(1, fPx * 0.07);
              ctx.beginPath(); ctx.moveTo(o.x * sc, o.y * sc + fPx * 1.05); ctx.lineTo(o.x * sc + tw, o.y * sc + fPx * 1.05); ctx.stroke();
            }
          } else if (o.type === 'highlight') {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.42)';
            ctx.fillRect(o.x * sc, o.y * sc, o.w * sc, o.h * sc);
          } else if (o.type === 'redact') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(o.x * sc, o.y * sc, o.w * sc, o.h * sc);
          } else if (o.type === 'rect') {
            ctx.strokeStyle = o.color || '#dc2626';
            ctx.lineWidth = 2.2;
            ctx.strokeRect(o.x * sc, o.y * sc, o.w * sc, o.h * sc);
          } else if (o.type === 'arrow' || o.type === 'measure') {
            ctx.strokeStyle = o.type === 'measure' ? '#0284c7' : (o.color || '#dc2626');
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(o.x1 * sc, o.y1 * sc);
            ctx.lineTo(o.x2 * sc, o.y2 * sc);
            ctx.stroke();
            const ang = Math.atan2((o.y2 - o.y1) * sc, (o.x2 - o.x1) * sc);
            const head = 10;
            ctx.beginPath();
            ctx.moveTo(o.x2 * sc, o.y2 * sc);
            ctx.lineTo(o.x2 * sc - head * Math.cos(ang - 0.45), o.y2 * sc - head * Math.sin(ang - 0.45));
            ctx.moveTo(o.x2 * sc, o.y2 * sc);
            ctx.lineTo(o.x2 * sc - head * Math.cos(ang + 0.45), o.y2 * sc - head * Math.sin(ang + 0.45));
            ctx.stroke();
            if (o.type === 'measure' && o.label) {
              const mx = ((o.x1 + o.x2) / 2) * sc;
              const my = ((o.y1 + o.y2) / 2) * sc - 14;
              ctx.fillStyle = '#0284c7';
              ctx.font = 'bold 12px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
              ctx.fillText(o.label, mx, my);
            }
          } else if (o.type === 'ink' && o.points?.length > 1) {
            ctx.strokeStyle = o.color || '#dc2626';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(o.points[0].x * sc, o.points[0].y * sc);
            for (let i = 1; i < o.points.length; i++) {
              ctx.lineTo(o.points[i].x * sc, o.points[i].y * sc);
            }
            ctx.stroke();
          } else if (o.type === 'stamp') {
            ctx.save();
            ctx.strokeStyle = o.color || '#dc2626';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(o.x * sc, o.y * sc, 180 * sc, 42 * sc);
            ctx.fillStyle = o.color || '#dc2626';
            ctx.font = `900 ${Math.max(10, 12 * sc)}px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(o.text, (o.x + 8) * sc, (o.y + 7) * sc);
            ctx.font = `600 ${Math.max(8, 9 * sc)}px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif`;
            ctx.fillText(o.subText || '', (o.x + 8) * sc, (o.y + 24) * sc);
            ctx.restore();
          } else if (o.type === 'image' && o._imgEl) {
            ctx.drawImage(o._imgEl, o.x * sc, o.y * sc, o.w * sc, o.h * sc);
          }
        }
        ctx.restore();
        updateSummary();
      };

      // Nhận diện phông chữ gốc thực thụ từ PDF.js page.commonObjs (kèm Tier-0 embeddedLoadedName) + tc.styles
      const detectPdfFontMeta = (page, fontName, styleObj) => {
        let realPdfFontName = fontName || '';
        let embeddedLoadedName = '';
        let objBold = false;
        let objItalic = false;
        try {
          if (page?.commonObjs?.has?.(fontName)) {
            const obj = page.commonObjs.get(fontName);
            if (obj?.name) realPdfFontName = obj.name;
            if (obj?.loadedName) embeddedLoadedName = obj.loadedName;
            if (obj?.bold) objBold = true;
            if (obj?.italic) objItalic = true;
          }
        } catch (_eCommon) {}
        const meta = DangLovePDFFontResolver.classifyFontMeta(realPdfFontName, styleObj);
        const isBold = meta.isBold || objBold;
        const isItalic = meta.isItalic || objItalic;
        const cssWithEmbedded = embeddedLoadedName ? `"${embeddedLoadedName}", ${meta.cssFallback}` : meta.cssFallback;
        return {
          ...meta,
          embeddedLoadedName,
          isBold,
          isItalic,
          fontFamily: cssWithEmbedded,
          bold: isBold,
          italic: isItalic,
        };
      };

      // Lấy mẫu màu mực chữ & màu nền trung vị (median outer-border) trên canvas HiDPI 2x–3x
      const sampleBlockColors = (ctx, bx, by, bw, bh, sc, outSc) => {
        const k = sc * outSc;
        const toHex = (r, g, b) =>
          `#${Math.max(0, Math.min(255, Math.round(r))).toString(16).padStart(2, '0')}${Math.max(0, Math.min(255, Math.round(g))).toString(16).padStart(2, '0')}${Math.max(0, Math.min(255, Math.round(b))).toString(16).padStart(2, '0')}`;
        let inkColor = '#0f172a';
        let bgColor = '#ffffff';
        try {
          const sx = Math.max(0, Math.floor(bx * k));
          const sy = Math.max(0, Math.floor(by * k));
          const sw = Math.max(4, Math.min(ctx.canvas.width - sx, Math.ceil(bw * k)));
          const sh = Math.max(4, Math.min(ctx.canvas.height - sy, Math.ceil(bh * k)));
          if (sw > 0 && sh > 0) {
            const data = ctx.getImageData(sx, sy, sw, sh).data;
            let rSum = 0, gSum = 0, bSum = 0, cnt = 0;
            const bgR = [], bgG = [], bgB = [];
            for (let i = 0; i < data.length; i += 16) {
              const r = data[i], g = data[i + 1], b = data[i + 2];
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              if (lum < 175) {
                rSum += r; gSum += g; bSum += b; cnt++;
              } else if (lum > 200) {
                bgR.push(r); bgG.push(g); bgB.push(b);
              }
            }
            if (cnt >= 3) inkColor = toHex(rSum / cnt, gSum / cnt, bSum / cnt);
            if (bgR.length >= 3) {
              bgR.sort((a, b) => a - b);
              bgG.sort((a, b) => a - b);
              bgB.sort((a, b) => a - b);
              const mid = Math.floor(bgR.length / 2);
              bgColor = toHex(bgR[mid], bgG[mid], bgB[mid]);
            }
          }
        } catch (_eCol) {}
        return { inkColor, bgColor };
      };

      // Bộ gõ trực tiếp NGAY TRÊN TRANG PDF (KHÔNG bật popup window.prompt, tự khớp font/màu gốc!)
      const openInlinePdfTextEditor = ({ x, y, w, h, initialText, fontSize, fontFamily, bold, italic, underline, color, onCommit }) => {
        stage.querySelectorAll('.mod46-inline-pdf-editor-box').forEach((el) => el.remove());
        const sc = this.pageScale;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = initialText || '';
        inp.className = 'mod46-inline-pdf-editor-box';
        inp.style.cssText = [
          'position:absolute',
          `left:${Math.max(0, x * sc - 2)}px`,
          `top:${Math.max(0, y * sc - 2)}px`,
          `min-width:${Math.max(110, (w || 140) * sc + 24)}px`,
          `max-width:${Math.max(160, Math.round(stage.clientWidth - x * sc - 6))}px`,
          `height:${Math.max(22, (h || fontSize * 1.45) * sc + 6)}px`,
          `font-size:${Math.max(11, Math.round((fontSize || 12) * sc))}px`,
          `font-family:${fontFamily || '"Times New Roman", Georgia, serif'}`,
          `font-weight:${bold ? '700' : '400'}`,
          `font-style:${italic ? 'italic' : 'normal'}`,
          `text-decoration:${underline ? 'underline' : 'none'}`,
          `color:${color || '#0f172a'}`,
          'line-height:1.25',
          'padding:1px 5px',
          'background:#ffffff',
          'border:2px solid #10b981',
          'border-radius:4px',
          'box-shadow:0 4px 16px rgba(16,185,129,0.35)',
          'outline:none',
          'z-index:40',
        ].join(';');
        stage.appendChild(inp);
        let settled = false;
        const finish = (save) => {
          if (settled) return;
          settled = true;
          const val = inp.value;
          inp.remove();
          if (save && typeof onCommit === 'function') onCommit(val);
        };
        inp.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            finish(true);
          } else if (ev.key === 'Escape') {
            ev.preventDefault();
            finish(false);
          }
          ev.stopPropagation();
        });
        inp.addEventListener('blur', () => finish(true));
        setTimeout(() => {
          inp.focus();
          inp.setSelectionRange(inp.value.length, inp.value.length);
        }, 0);
      };

      const renderEditableTextBlocks = () => {
        blocksLayer.innerHTML = '';
        const isEditText = this.activeMode === 'edit_text';
        overlayCanvas.style.pointerEvents = isEditText ? 'none' : 'auto';
        blocksLayer.style.pointerEvents = isEditText ? 'auto' : 'none';
        if (!isEditText) return;

        const blocks = this.extractedBlocksByPage[this.currentPage] || [];
        const sc = this.pageScale;
        blocks.forEach((blk) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.title = 'Bấm vào đây để gõ, Backspace xóa hoặc sửa chữ trực tiếp trên trang PDF';
          b.style.position = 'absolute';
          b.style.left = `${blk.x * sc}px`;
          b.style.top = `${blk.y * sc}px`;
          b.style.width = `${Math.max(24, blk.w * sc)}px`;
          b.style.height = `${Math.max(16, blk.h * sc)}px`;
          b.className = 'border border-dashed border-emerald-500/75 bg-emerald-400/10 hover:bg-emerald-400/25 rounded cursor-text transition';
          b.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const existingReplaced = [...this.getPageObjects(this.currentPage)]
              .reverse()
              .find((o) => o.type === 'replace_text' && Math.abs(o.x - blk.x) < 3 && Math.abs(o.y - blk.y) < 3);
            const startText = existingReplaced ? existingReplaced.text : blk.text;
            const autoMatch = this.fontFamily === 'auto';
            const fontBadgeEl = container.querySelector('#mod46-ed-font-badge');
            let resolvedFont = null;
            if (autoMatch && blk.fontMeta) {
              if (fontBadgeEl) fontBadgeEl.textContent = `⏳ Đang khớp font: ${blk.fontMeta.cleanFontFamily}...`;
              try {
                resolvedFont = await DangLovePDFFontResolver.resolveFontForBlock(blk.fontMeta);
                if (fontBadgeEl && resolvedFont?.badge) fontBadgeEl.textContent = resolvedFont.badge;
              } catch (_eFr) {}
            }
            const useFont = autoMatch
              ? (resolvedFont?.cssFontFamily || blk.fontFamily || 'Arial, Helvetica, sans-serif')
              : this.fontFamily;
            const useBold = autoMatch ? (this.bold || Boolean(blk.bold)) : this.bold;
            const useItalic = autoMatch ? (this.italic || Boolean(blk.italic)) : this.italic;
            const useUnderline = this.underline;
            const useSize = Math.max(8, Math.round(blk.fontSize || this.fontSize || 12));
            const useColor = this.colorTouched ? this.color : (blk.inkColor || '#0f172a');
            const useBgColor = blk.bgColor || '#ffffff';
            openInlinePdfTextEditor({
              x: blk.x,
              y: blk.y,
              w: blk.w,
              h: blk.h,
              initialText: startText,
              fontSize: useSize,
              fontFamily: useFont,
              bold: useBold,
              italic: useItalic,
              underline: useUnderline,
              color: useColor,
              onCommit: (edited) => {
                if (edited === startText) return;
                this._pushUndo();
                this.getPageObjects(this.currentPage).push({
                  type: 'replace_text',
                  x: blk.x,
                  y: blk.y,
                  w: blk.w,
                  h: blk.h,
                  text: edited,
                  fontSize: useSize,
                  fontFamily: useFont,
                  fontMeta: blk.fontMeta || null,
                  bold: useBold,
                  italic: useItalic,
                  underline: useUnderline,
                  color: useColor,
                  bgColor: useBgColor,
                });
                redrawOverlay();
              },
            });
          });
          blocksLayer.appendChild(b);
        });
      };

      const renderPage = async (pageNo) => {
        this.currentPage = Math.max(1, Math.min(this.totalPages, pageNo));
        const edPageInp = container.querySelector('#inp-mod46-ed-page');
        const edPageTotal = container.querySelector('#mod46-ed-pg-total');
        if (edPageInp) {
          edPageInp.max = String(this.totalPages);
          if (document.activeElement !== edPageInp) edPageInp.value = String(this.currentPage);
        }
        if (edPageTotal) edPageTotal.textContent = `/ ${this.totalPages}`;
        const page = await this.pdfDoc.getPage(this.currentPage);
        const baseVp = page.getViewport({ scale: 1 });
        this.baseWidth = baseVp.width;
        this.baseHeight = baseVp.height;
        const maxW = Math.min(960, Math.max(320, container.clientWidth - 28));
        this.pageScale = (maxW / Math.max(1, baseVp.width)) * (this.zoomFactor || 1);
        const zoomValEl = container.querySelector('#mod46-ed-zoom-val');
        if (zoomValEl) zoomValEl.textContent = `${Math.round((this.zoomFactor || 1) * 100)}%`;

        // Unified HiDPI 2x–3x Canvas Render (chống mờ chữ tuyệt đối trên Mobile & Laptop!)
        const rendered = await DangLovePDFRenderer.renderPageToCanvas(page, pdfCanvas, {
          scale: this.pageScale,
          rotation: 0,
          isThumbnail: false,
        });
        this.outputScale = rendered.outputScale;
        overlayCanvas.width = rendered.backingW;
        overlayCanvas.height = rendered.backingH;
        overlayCanvas.style.width = `${rendered.cssW}px`;
        overlayCanvas.style.height = `${rendered.cssH}px`;
        stage.style.width = `${rendered.cssW}px`;
        stage.style.height = `${rendered.cssH}px`;

        const pCtx = pdfCanvas.getContext('2d');

        // Trích xuất & gom cụm các dòng chữ gốc kèm nhận diện font thật từ page.commonObjs, màu mực & màu nền trung vị
        if (!this.extractedBlocksByPage[this.currentPage]) {
          const tc = await page.getTextContent();
          const lineMap = new Map();
          for (const it of tc.items) {
            const s = String(it.str || '').trim();
            if (!s) continue;
            const x = it.transform[4];
            const yPdf = it.transform[5];
            const fSize = Math.max(7.5, Math.hypot(it.transform[0], it.transform[1]));
            const yTop = this.baseHeight - yPdf - fSize * 0.9;
            const bucket = Math.round(yTop / Math.max(4, fSize * 0.45)) * Math.max(4, Math.round(fSize * 0.45));
            const meta = detectPdfFontMeta(page, it.fontName, tc.styles?.[it.fontName]);
            if (!lineMap.has(bucket)) lineMap.set(bucket, []);
            lineMap.get(bucket).push({
              x,
              y: yTop,
              w: it.width || s.length * fSize * 0.55,
              h: fSize * 1.25,
              text: s,
              fontSize: fSize,
              fontFamily: meta.fontFamily,
              fontMeta: meta,
              bold: meta.bold,
              italic: meta.italic,
            });
          }
          const blocks = [];
          lineMap.forEach((arr) => {
            arr.sort((a, b) => a.x - b.x);
            const minX = arr[0].x;
            const minY = Math.min(...arr.map((a) => a.y));
            const maxX = Math.max(...arr.map((a) => a.x + a.w));
            const maxH = Math.max(...arr.map((a) => a.h));
            const bw = Math.max(30, maxX - minX);
            const cols = sampleBlockColors(pCtx, minX, minY, bw, maxH, this.pageScale, this.outputScale);
            // Chọn chunk chiếm nhiều ký tự chữ nhất trong dòng (tránh lấy nhầm font của dấu đầu dòng "•" hay ký hiệu toán!)
            const dominant = arr.reduce((best, cur) => {
              const curScore = String(cur.text || '').replace(/[\s•◦▪\-–—·]/g, '').length;
              const bestScore = String(best.text || '').replace(/[\s•◦▪\-–—·]/g, '').length;
              return curScore > bestScore ? cur : best;
            }, arr[0]);
            blocks.push({
              x: minX,
              y: minY,
              w: bw,
              h: maxH,
              fontSize: dominant.fontSize,
              fontFamily: dominant.fontFamily,
              fontMeta: dominant.fontMeta,
              bold: arr[0].bold,
              italic: arr[0].italic,
              inkColor: cols.inkColor,
              bgColor: cols.bgColor,
              text: arr.map((a) => a.text).join(' '),
            });
          });
          // Nếu trang là ảnh scan / PDF xuất từ ảnh không có lớp chữ gốc -> tự động quét nhận diện các mảng chữ từ pixel canvas để vẫn sửa được từng mảng trực tiếp!
          if (!blocks.length) {
            try {
              const cw = pdfCanvas.width;
              const ch = pdfCanvas.height;
              const imgData = pCtx.getImageData(0, 0, cw, ch).data;
              const rowInk = new Uint32Array(ch);
              const stepX = Math.max(2, Math.floor(cw / 280));
              // Lấy màu nền đại diện ở góc mép trang
              const bgR = imgData[0] ?? 255;
              const bgG = imgData[1] ?? 255;
              const bgB = imgData[2] ?? 255;
              for (let py = 0; py < ch; py += 2) {
                let cnt = 0;
                for (let px = Math.floor(cw * 0.03); px < Math.floor(cw * 0.97); px += stepX) {
                  const idx = (py * cw + px) * 4;
                  const diff = Math.abs(imgData[idx] - bgR) + Math.abs(imgData[idx + 1] - bgG) + Math.abs(imgData[idx + 2] - bgB);
                  if (diff > 75) cnt += 1;
                }
                rowInk[py] = cnt;
                if (py + 1 < ch) rowInk[py + 1] = cnt;
              }
              const bands = [];
              let inBand = false;
              let bStart = 0;
              let emptyRun = 0;
              for (let py = 0; py < ch; py++) {
                if (rowInk[py] >= 3) {
                  if (!inBand) { inBand = true; bStart = py; }
                  emptyRun = 0;
                } else if (inBand) {
                  emptyRun += 1;
                  if (emptyRun >= Math.max(6, Math.round(ch * 0.006))) {
                    const bEnd = py - emptyRun;
                    if (bEnd - bStart >= Math.max(10, Math.round(ch * 0.008))) {
                      bands.push([bStart, bEnd]);
                    }
                    inBand = false;
                    emptyRun = 0;
                  }
                }
              }
              if (inBand && ch - bStart >= 10) bands.push([bStart, ch - 1]);
              const scaleFactor = this.pageScale * this.outputScale;
              for (const [y1, y2] of bands.slice(0, 48)) {
                let minX = cw;
                let maxX = 0;
                for (let py = y1; py <= y2; py += 2) {
                  for (let px = Math.floor(cw * 0.02); px < Math.floor(cw * 0.98); px += stepX) {
                    const idx = (py * cw + px) * 4;
                    const diff = Math.abs(imgData[idx] - bgR) + Math.abs(imgData[idx + 1] - bgG) + Math.abs(imgData[idx + 2] - bgB);
                    if (diff > 75) {
                      if (px < minX) minX = px;
                      if (px > maxX) maxX = px;
                    }
                  }
                }
                if (maxX - minX < 24) continue;
                const bx = Math.max(0, (minX - 6) / scaleFactor);
                const by = Math.max(0, (y1 - 3) / scaleFactor);
                const bw = Math.max(40, (maxX - minX + 12) / scaleFactor);
                const bh = Math.max(14, (y2 - y1 + 6) / scaleFactor);
                const cols = sampleBlockColors(pCtx, bx, by, bw, bh, this.pageScale, this.outputScale);
                blocks.push({
                  x: bx,
                  y: by,
                  w: bw,
                  h: bh,
                  fontSize: Math.max(11, Math.min(28, Math.round(bh * 0.72))),
                  fontFamily: 'sans-serif',
                  bold: bh > 22,
                  italic: false,
                  inkColor: cols.inkColor,
                  bgColor: cols.bgColor,
                  text: '[Bấm để sửa mảng chữ ảnh scan này]',
                  isVisualScanBlock: true,
                });
              }
            } catch (_eScanBlk) {}
          }
          this.extractedBlocksByPage[this.currentPage] = blocks;
          if (hintEl) {
            if (!blocks.length) {
              hintEl.textContent = '📄 Trang trắng hoặc chưa có mảng chữ — bạn có thể chọn "+ Chèn chữ" để gõ chữ trực tiếp vào bất kỳ vị trí nào!';
            } else if (blocks[0]?.isVisualScanBlock) {
              hintEl.textContent = `🔍 Trang ảnh scan không có lớp chữ gốc — đã tự động nhận diện ${blocks.length} mảng chữ (viền nét đứt xanh): bấm thẳng vào bất kỳ mảng nào để sửa đè chuẩn màu nền ngay!`;
            }
          }
        }

        renderEditableTextBlocks();
        redrawOverlay();
      };

      // Bắt sự kiện vẽ / kéo thả trên overlayCanvas
      const ptOf = (ev) => {
        const r = overlayCanvas.getBoundingClientRect();
        return {
          x: (ev.clientX - r.left) / this.pageScale,
          y: (ev.clientY - r.top) / this.pageScale,
        };
      };

      overlayCanvas.addEventListener('pointerdown', (ev) => {
        const p = ptOf(ev);
        if (this.activeMode === 'add_text') {
          // Khi ở chế độ Tự khớp font gốc, lấy font của khối chữ gần vị trí click nhất làm mặc định
          const nearby = (this.extractedBlocksByPage[this.currentPage] || []).reduce(
            (best, b) => {
              const d = Math.hypot(b.x - p.x, b.y - p.y);
              return d < best.d ? { d, b } : best;
            },
            { d: Infinity, b: null }
          ).b;
          const addFont = this.fontFamily === 'auto'
            ? (nearby?.fontFamily || '"Times New Roman", Georgia, serif')
            : this.fontFamily;
          const addColor = this.colorTouched ? this.color : (nearby?.inkColor || this.color);
          openInlinePdfTextEditor({
            x: p.x,
            y: p.y,
            w: 160,
            h: this.fontSize * 1.5,
            initialText: '',
            fontSize: this.fontSize,
            fontFamily: addFont,
            bold: this.bold,
            italic: this.italic,
            underline: this.underline,
            color: addColor,
            onCommit: (txt) => {
              if (!txt || !txt.trim()) return;
              this._pushUndo();
              this.getPageObjects(this.currentPage).push({
                type: 'add_text',
                x: p.x,
                y: p.y,
                text: txt,
                fontSize: this.fontSize,
                fontFamily: addFont,
                bold: this.bold,
                italic: this.italic,
                underline: this.underline,
                color: addColor,
              });
              redrawOverlay();
            },
          });
          return;
        }
        if (this.activeMode === 'stamp') {
          this._pushUndo();
          const nowStr = new Date().toLocaleString('vi-VN');
          this.getPageObjects(this.currentPage).push({ type: 'stamp', x: p.x, y: p.y, text: this.stampLabel, subText: nowStr, color: this.color });
          redrawOverlay();
          return;
        }
        if (this.activeMode === 'image' && this.pendingImgDataUrl) {
          const im = new Image();
          im.onload = () => {
            this._pushUndo();
            const w = 140;
            const h = (im.naturalHeight / Math.max(1, im.naturalWidth)) * w;
            this.getPageObjects(this.currentPage).push({ type: 'image', x: p.x, y: p.y, w, h, dataUrl: this.pendingImgDataUrl, _imgEl: im });
            redrawOverlay();
          };
          im.src = this.pendingImgDataUrl;
          return;
        }
        overlayCanvas.setPointerCapture(ev.pointerId);
        this._pushUndo();
        if (this.activeMode === 'ink') {
          const obj = { type: 'ink', color: this.color, points: [p] };
          this.getPageObjects(this.currentPage).push(obj);
          this._drawing = obj;
        } else if (this.activeMode === 'arrow' || this.activeMode === 'measure') {
          const obj = { type: this.activeMode, color: this.color, x1: p.x, y1: p.y, x2: p.x, y2: p.y, label: '' };
          this.getPageObjects(this.currentPage).push(obj);
          this._drawing = obj;
        } else {
          const obj = { type: this.activeMode, color: this.color, x: p.x, y: p.y, w: 10, h: 10 };
          this.getPageObjects(this.currentPage).push(obj);
          this._drawing = obj;
        }
      });

      overlayCanvas.addEventListener('pointermove', (ev) => {
        if (!this._drawing) return;
        const p = ptOf(ev);
        if (this._drawing.type === 'ink') {
          this._drawing.points.push(p);
        } else if (this._drawing.type === 'arrow' || this._drawing.type === 'measure') {
          this._drawing.x2 = p.x;
          this._drawing.y2 = p.y;
          if (this._drawing.type === 'measure') {
            const distPt = Math.hypot(p.x - this._drawing.x1, p.y - this._drawing.y1);
            const cm = (distPt / 28.3465).toFixed(2);
            const scaledM = (Number(cm) * this.measureScale).toFixed(2);
            this._drawing.label = `${cm} cm (Tỷ lệ: ${scaledM} m)`;
          }
        } else {
          this._drawing.w = p.x - this._drawing.x;
          this._drawing.h = p.y - this._drawing.y;
        }
        redrawOverlay();
      });

      const endDraw = () => { this._drawing = null; };
      overlayCanvas.addEventListener('pointerup', endDraw);
      overlayCanvas.addEventListener('pointercancel', endDraw);

      // Gắn nút toolbar
      const toolHints = {
        edit_text: '💡 Bấm trực tiếp vào bất kỳ dòng chữ gốc nào (viền nét đứt xanh) để sửa ngay!',
        add_text: '💡 Bấm vào bất kỳ vị trí nào trên trang để chèn chữ tiếng Việt mới.',
        highlight: '💡 Kéo chuột ngang qua dòng chữ muốn tô sáng màu vàng.',
        ink: '💡 Giữ chuột / ngón tay vẽ nét tự do lên trang PDF.',
        rect: '💡 Kéo tạo khung chữ nhật nhấn mạnh vùng quan trọng.',
        arrow: '💡 Kéo từ điểm đầu đến điểm cuối để vẽ mũi tên chỉ dẫn.',
        measure: '💡 Kéo giữa 2 điểm trên bản vẽ để đo khoảng cách cm & mét theo tỷ lệ.',
        stamp: '💡 Bấm vào trang để đóng con dấu động kèm ngày giờ hiện tại.',
        redact: '💡 Kéo vùng chữ nhật để che đen bảo mật nội dung nhạy cảm.',
        image: '💡 Bấm vào vị trí muốn đặt ảnh vừa tải lên trang.',
      };

      container.querySelectorAll('[data-ed-tool]').forEach((b) => {
        b.addEventListener('click', () => {
          this.activeMode = b.getAttribute('data-ed-tool');
          container.querySelectorAll('[data-ed-tool]').forEach((x) => {
            x.classList.remove('bg-emerald-600', 'text-white');
            x.classList.add('bg-zinc-800', 'text-zinc-100');
          });
          b.classList.remove('bg-zinc-800', 'text-zinc-100');
          b.classList.add('bg-emerald-600', 'text-white');
          if (hintEl) hintEl.textContent = toolHints[this.activeMode] || '';
          renderEditableTextBlocks();
        });
      });

      container.querySelector('#inp-mod46-ed-img')?.addEventListener('change', (ev) => {
        const f = ev.target.files?.[0];
        if (!f) return;
        const rdr = new FileReader();
        rdr.onload = () => {
          this.pendingImgDataUrl = String(rdr.result || '');
          this.activeMode = 'image';
          if (hintEl) hintEl.textContent = toolHints.image;
          renderEditableTextBlocks();
        };
        rdr.readAsDataURL(f);
      });

      container.querySelector('#sel-mod46-ed-font')?.addEventListener('change', (ev) => { this.fontFamily = ev.target.value; });
      container.querySelector('#inp-mod46-ed-color')?.addEventListener('input', (ev) => { this.color = ev.target.value; this.colorTouched = true; });
      container.querySelector('#inp-mod46-ed-fsize')?.addEventListener('change', (ev) => { this.fontSize = Math.max(7, Math.min(72, Number(ev.target.value) || 14)); });
      const bindToggle = (id, key) => {
        const el = container.querySelector(id);
        el?.addEventListener('click', () => {
          this[key] = !this[key];
          el.classList.toggle('bg-sky-600', this[key]);
          el.classList.toggle('text-white', this[key]);
          el.classList.toggle('bg-zinc-950', !this[key]);
        });
      };
      bindToggle('#btn-mod46-ed-bold', 'bold');
      bindToggle('#btn-mod46-ed-italic', 'italic');
      bindToggle('#btn-mod46-ed-underline', 'underline');
      container.querySelector('#sel-mod46-ed-stamp')?.addEventListener('change', (ev) => { this.stampLabel = ev.target.value; });
      container.querySelector('#btn-mod46-ed-zoom-out')?.addEventListener('click', () => {
        this.zoomFactor = Math.max(0.6, Number(((this.zoomFactor || 1) - 0.2).toFixed(2)));
        renderPage(this.currentPage);
      });
      container.querySelector('#btn-mod46-ed-zoom-in')?.addEventListener('click', () => {
        this.zoomFactor = Math.min(2.6, Number(((this.zoomFactor || 1) + 0.2).toFixed(2)));
        renderPage(this.currentPage);
      });
      container.querySelector('#btn-mod46-ed-local-fonts')?.addEventListener('click', async () => {
        const res = await DangLovePDFFontResolver.enableWebLocalFonts();
        const badgeEl = container.querySelector('#mod46-ed-font-badge');
        if (res.ok) {
          if (badgeEl) badgeEl.textContent = `🖥️ Đã nạp ${res.count} font thật từ máy tính!`;
        } else if (badgeEl) {
          badgeEl.textContent = '🌐 Trình duyệt dùng kho Font 1:1 Tiếng Việt tự động (Tinos/Arimo/Carlito)';
        }
      });
      container.querySelector('#btn-mod46-ed-prev')?.addEventListener('click', () => renderPage(this.currentPage - 1));
      container.querySelector('#btn-mod46-ed-next')?.addEventListener('click', () => renderPage(this.currentPage + 1));
      const edPageInput = container.querySelector('#inp-mod46-ed-page');
      const jumpEdPage = () => {
        if (!edPageInput) return;
        const n = parseInt(String(edPageInput.value || '').trim(), 10);
        if (!Number.isFinite(n)) { edPageInput.value = String(this.currentPage); return; }
        const clamped = Math.max(1, Math.min(this.totalPages, n));
        edPageInput.value = String(clamped);
        edPageInput.blur();
        renderPage(clamped);
      };
      edPageInput?.addEventListener('focus', () => { try { edPageInput.select(); } catch (_e) {} });
      edPageInput?.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); jumpEdPage(); }
        else if (ev.key === 'Escape') { edPageInput.value = String(this.currentPage); edPageInput.blur(); }
      });
      edPageInput?.addEventListener('change', jumpEdPage);
      container.querySelector('#btn-mod46-ed-undo')?.addEventListener('click', () => this.undo(redrawOverlay));
      container.querySelector('#btn-mod46-ed-redo')?.addEventListener('click', () => this.redo(redrawOverlay));
      container.querySelector('#btn-mod46-ed-clear-page')?.addEventListener('click', () => {
        this._pushUndo();
        this.objectsByPage[this.currentPage] = [];
        redrawOverlay();
      });

      // 6 NÚT TRỢ LÝ AI TRONG PDF EDITOR
      const requireAiBridge = (cb) => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        if (!gBridge?.hasApiKey?.()) {
          gBridge?.openApiKeyQuickModal?.({ onSaved: () => cb(gBridge) });
          return null;
        }
        return gBridge;
      };
      const notifyEditor = (msg) => {
        const badgeEl = container.querySelector('#mod46-ed-font-badge');
        if (badgeEl) badgeEl.textContent = msg;
      };

      // 1. Sửa chính tả & khoảng trắng tách chữ trên trang hiện tại
      container.querySelector('#btn-mod46-ai-ed-polish')?.addEventListener('click', async () => {
        const gBridge = requireAiBridge(() => container.querySelector('#btn-mod46-ai-ed-polish')?.click());
        if (!gBridge) return;
        const blocks = this.extractedBlocksByPage[this.currentPage] || [];
        if (!blocks.length) { notifyEditor('⚠️ Trang này chưa có lớp chữ gốc — hãy thử OCR AI trang Scan.'); return; }
        const loader = gBridge.showAiFullLoadingOverlay?.('✨ AI đang sửa chính tả trang PDF...', 'Đang chuẩn hóa từng dòng chữ gốc trên trang');
        const payload = blocks.slice(0, 80).map((b, i) => `[${i}] ${b.text}`).join('\n');
        const promptTxt = gBridge.buildTaskManualPrompt('editor_polish', { text: payload });
        const applyPolish = (raw) => {
          const m = String(raw || '').match(/\[[\s\S]*\]/);
          const edits = m ? JSON.parse(m[0]) : [];
          if (Array.isArray(edits) && edits.length) {
            this._pushUndo();
            let count = 0;
            for (const ed of edits) {
              const blk = blocks[Number(ed?.i)];
              const newTxt = String(ed?.t || '').trim();
              if (!blk || !newTxt || newTxt === blk.text) continue;
              this.getPageObjects(this.currentPage).push({
                type: 'replace_text',
                x: blk.x, y: blk.y, w: blk.w, h: blk.h,
                text: newTxt,
                fontSize: Math.max(8, Math.round(blk.fontSize || 12)),
                fontFamily: blk.fontFamily || '"Be Vietnam Pro", Arial, sans-serif',
                fontMeta: blk.fontMeta || null,
                bold: Boolean(blk.bold), italic: Boolean(blk.italic), underline: false,
                color: blk.inkColor || '#0f172a', bgColor: blk.bgColor || '#ffffff',
              });
              count++;
            }
            redrawOverlay();
            notifyEditor(`✅ AI đã sửa ${count} dòng chữ trên trang ${this.currentPage}!`);
          } else {
            notifyEditor(`✅ Trang ${this.currentPage} đã sạch chuẩn, không cần sửa thêm.`);
          }
        };
        try {
          const raw = await gBridge.callGeminiText(promptTxt, { taskType: 'fast_light', temperature: 0.1, maxOutputTokens: 4096 });
          applyPolish(raw);
          loader?.close?.();
        } catch (err) {
          loader?.showError?.('⚠️ Lỗi AI sửa chữ', String(err?.message || err), {
            manualFallback: { taskTitle: 'PDF Editor — Dán JSON sửa chính tả từ Gemini', promptText: promptTxt, applyBtnLabel: '✅ Áp dụng sửa chữ lên trang PDF', onApplyPasted: applyPolish },
          });
        }
      });

      // 2. Dịch toàn trang AI (EN <-> VI)
      container.querySelector('#btn-mod46-ai-ed-translate')?.addEventListener('click', async () => {
        const gBridge = requireAiBridge(() => container.querySelector('#btn-mod46-ai-ed-translate')?.click());
        if (!gBridge) return;
        const blocks = this.extractedBlocksByPage[this.currentPage] || [];
        if (!blocks.length) { notifyEditor('⚠️ Trang này chưa có văn bản để dịch.'); return; }
        const loader = gBridge.showAiFullLoadingOverlay?.('🌐 AI đang dịch trang PDF...', 'Tự động phát hiện ngôn ngữ & giữ bố cục gốc');
        const slice = blocks.slice(0, 75);
        const sampleTxt = slice.map((b) => b.text).join(' ');
        const hasVi = /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệóòỏõọốồổỗộớờởỡợúùủũụứừửữựíìỉĩịýỳỷỹỵ]/i.test(sampleTxt);
        const targetLang = hasVi ? 'English' : 'Tiếng Việt';
        const payload = slice.map((b, i) => `[${i}] ${b.text}`).join('\n');
        const promptTxt = gBridge.buildTaskManualPrompt('editor_translate', { text: payload, targetLang });
        const applyTrans = (raw) => {
          const m = String(raw || '').match(/\[[\s\S]*\]/);
          const edits = m ? JSON.parse(m[0]) : [];
          if (Array.isArray(edits) && edits.length) {
            this._pushUndo();
            for (const ed of edits) {
              const blk = slice[Number(ed?.i)];
              const tr = String(ed?.t || '').trim();
              if (!blk || !tr) continue;
              this.getPageObjects(this.currentPage).push({
                type: 'replace_text',
                x: blk.x, y: blk.y, w: blk.w, h: blk.h,
                text: tr,
                fontSize: Math.max(8, Math.round(blk.fontSize || 11)),
                fontFamily: blk.fontFamily || '"Be Vietnam Pro", Arial, sans-serif',
                fontMeta: blk.fontMeta || null,
                bold: Boolean(blk.bold), italic: Boolean(blk.italic), underline: false,
                color: blk.inkColor || '#0f172a', bgColor: blk.bgColor || '#ffffff',
              });
            }
            redrawOverlay();
            notifyEditor(`🌐 Đã dịch trang ${this.currentPage} sang ${targetLang}!`);
          }
        };
        try {
          const raw = await gBridge.callGeminiText(promptTxt, { taskType: 'doc_multimodal', temperature: 0.2, maxOutputTokens: 8192 });
          applyTrans(raw);
          loader?.close?.();
        } catch (err) {
          loader?.showError?.('⚠️ Lỗi AI dịch trang', String(err?.message || err), {
            manualFallback: { taskTitle: `PDF Editor — Dán JSON bản dịch (${targetLang}) từ Gemini`, promptText: promptTxt, applyBtnLabel: '✅ Áp dụng bản dịch lên trang PDF', onApplyPasted: applyTrans },
          });
        }
      });

      // 3. Tự động phát hiện & che đen PII nhạy cảm bằng AI
      container.querySelector('#btn-mod46-ai-ed-redact')?.addEventListener('click', async () => {
        const gBridge = requireAiBridge(() => container.querySelector('#btn-mod46-ai-ed-redact')?.click());
        if (!gBridge) return;
        const blocks = this.extractedBlocksByPage[this.currentPage] || [];
        if (!blocks.length) { notifyEditor('⚠️ Không có khối chữ trên trang.'); return; }
        const loader = gBridge.showAiFullLoadingOverlay?.('🛡️ AI đang quét dữ liệu nhạy cảm (PII)...', 'Tìm SĐT, CCCD, Email, Số tài khoản để che đen an toàn');
        const payload = blocks.slice(0, 120).map((b, i) => `[${i}] ${b.text}`).join('\n');
        const promptTxt = gBridge.buildTaskManualPrompt('editor_redact', { text: payload });
        const applyRedact = (raw) => {
          const m = String(raw || '').match(/\[[\s\S]*\]/);
          const idxs = m ? JSON.parse(m[0]) : [];
          if (Array.isArray(idxs) && idxs.length) {
            this._pushUndo();
            let redCount = 0;
            for (const id of idxs) {
              const blk = blocks[Number(id)];
              if (!blk) continue;
              this.getPageObjects(this.currentPage).push({ type: 'redact', x: blk.x, y: blk.y, w: Math.max(24, blk.w), h: Math.max(12, blk.h) });
              redCount++;
            }
            redrawOverlay();
            notifyEditor(`🛡️ AI đã che đen ${redCount} vùng nhạy cảm (Hoàn tác nếu cần).`);
          } else {
            notifyEditor(`✅ Không phát hiện dữ liệu PII nhạy cảm trên trang ${this.currentPage}.`);
          }
        };
        try {
          const raw = await gBridge.callGeminiText(promptTxt, { taskType: 'fast_light', temperature: 0.1, maxOutputTokens: 1024 });
          applyRedact(raw);
          loader?.close?.();
        } catch (err) {
          loader?.showError?.('⚠️ Lỗi quét PII AI', String(err?.message || err), {
            manualFallback: { taskTitle: 'PDF Editor — Dán mảng chỉ số PII từ Gemini', promptText: promptTxt, applyBtnLabel: '✅ Che đen ngay các vùng nhạy cảm', onApplyPasted: applyRedact },
          });
        }
      });

      // 4. Tóm tắt trang & dán hộp Sticky Note AI lên trang
      container.querySelector('#btn-mod46-ai-ed-summary')?.addEventListener('click', async () => {
        const gBridge = requireAiBridge(() => container.querySelector('#btn-mod46-ai-ed-summary')?.click());
        if (!gBridge) return;
        const blocks = this.extractedBlocksByPage[this.currentPage] || [];
        const txt = blocks.map((b) => b.text).join('\n').trim();
        if (!txt) { notifyEditor('⚠️ Trang này trống.'); return; }
        const loader = gBridge.showAiFullLoadingOverlay?.('📝 AI đang tóm tắt & tạo Ghi chú trang...', 'Tổng hợp ý chính cô đọng để gắn lên góc trang');
        const promptTxt = gBridge.buildTaskManualPrompt('editor_summary', { text: txt });
        const applySum = (sum) => {
          const lines = String(sum || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 3);
          if (lines.length) {
            this._pushUndo();
            const nx = Math.max(20, (this.baseWidth || 595) - 250);
            const ny = 18;
            this.getPageObjects(this.currentPage).push({ type: 'rect', x: nx, y: ny, w: 232, h: 24 + lines.length * 16, color: '#d97706' });
            lines.forEach((ln, li) => {
              this.getPageObjects(this.currentPage).push({
                type: 'add_text', x: nx + 8, y: ny + 6 + li * 16, text: ln.slice(0, 52),
                fontSize: 10, fontFamily: '"Be Vietnam Pro", Arial, sans-serif', bold: li === 0, italic: false, underline: false, color: '#92400e',
              });
            });
            redrawOverlay();
            notifyEditor('📝 Đã dán Ghi chú Tóm tắt AI ở góc trên-phải trang!');
          }
        };
        try {
          const sum = await gBridge.callGeminiText(promptTxt, { taskType: 'fast_light', temperature: 0.2, maxOutputTokens: 512 });
          applySum(sum);
          loader?.close?.();
        } catch (err) {
          loader?.showError?.('⚠️ Lỗi tóm tắt AI', String(err?.message || err), {
            manualFallback: { taskTitle: 'PDF Editor — Dán 3 dòng Tóm tắt từ Gemini', promptText: promptTxt, applyBtnLabel: '✅ Dán Sticky Note lên trang PDF', onApplyPasted: applySum },
          });
        }
      });

      // 5. Bóc bảng trang hiện tại sang CSV/Excel
      container.querySelector('#btn-mod46-ai-ed-table')?.addEventListener('click', async () => {
        const gBridge = requireAiBridge(() => container.querySelector('#btn-mod46-ai-ed-table')?.click());
        if (!gBridge) return;
        const blocks = this.extractedBlocksByPage[this.currentPage] || [];
        if (!blocks.length) { notifyEditor('⚠️ Trang này chưa có bảng để trích xuất.'); return; }
        const loader = gBridge.showAiFullLoadingOverlay?.('📊 AI đang bóc bảng trang PDF sang CSV/Excel...', 'Nhận diện hàng & cột và xuất file tải về');
        const payload = blocks.map((b) => `[x=${Math.round(b.x)},y=${Math.round(b.y)}] ${b.text}`).join('\n');
        const promptTxt = gBridge.buildTaskManualPrompt('editor_table', { text: payload });
        const applyTbl = (raw) => {
          const m = String(raw || '').match(/\[[\s\S]*\]/);
          const rows = m ? JSON.parse(m[0]) : [];
          if (Array.isArray(rows) && rows.length) {
            const csv = '\uFEFF' + rows.map((r) => (Array.isArray(r) ? r : [r]).map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(fileRec?.name || 'Bang').replace(/\.pdf$/i, '')}_Trang${this.currentPage}.csv`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            notifyEditor(`📊 Đã xuất bảng trang ${this.currentPage} (${rows.length} hàng) ra CSV mở bằng Excel!`);
          } else {
            notifyEditor('⚠️ Không tìm thấy cấu trúc bảng rõ ràng trên trang này.');
          }
        };
        try {
          const raw = await gBridge.callGeminiText(promptTxt, { taskType: 'doc_multimodal', temperature: 0.1, maxOutputTokens: 8192 });
          applyTbl(raw);
          loader?.close?.();
        } catch (err) {
          loader?.showError?.('⚠️ Lỗi bóc bảng AI', String(err?.message || err), {
            manualFallback: { taskTitle: 'PDF Editor — Dán mảng JSON 2D bảng từ Gemini', promptText: promptTxt, applyBtnLabel: '✅ Xuất ngay file CSV mở bằng Excel', onApplyPasted: applyTbl },
          });
        }
      });

      // 6. OCR AI trang Scan thành khối chữ chỉnh sửa được
      container.querySelector('#btn-mod46-ai-ed-ocr')?.addEventListener('click', async () => {
        const gBridge = requireAiBridge(() => container.querySelector('#btn-mod46-ai-ed-ocr')?.click());
        if (!gBridge) return;
        const loader = gBridge.showAiFullLoadingOverlay?.('👁️ Gemini Flash đang OCR trang Scan...', 'Nhận diện chữ từ ảnh canvas thành khối văn bản sửa được');
        const promptTxt = gBridge.buildTaskManualPrompt('editor_ocr', { fileName: `${fileRec?.name || 'Trang'}_P${this.currentPage}.jpg` });
        const applyOcr = (raw) => {
          const m = String(raw || '').match(/\[[\s\S]*\]/);
          const items = m ? JSON.parse(m[0]) : [];
          if (Array.isArray(items) && items.length) {
            const bw = this.baseWidth || 595;
            const bh = this.baseHeight || 842;
            const ocrBlocks = items.map((it) => ({
              x: (Number(it?.xPct || 8) / 100) * bw,
              y: (Number(it?.yPct || 8) / 100) * bh,
              w: Math.max(60, (Number(it?.wPct || 65) / 100) * bw),
              h: 16,
              text: String(it?.text || '').trim(),
              fontSize: 12,
              fontFamily: '"Be Vietnam Pro", Arial, sans-serif',
              fontMeta: null,
              bold: false, italic: false, inkColor: '#0f172a', bgColor: '#ffffff',
            })).filter((b) => b.text);
            if (ocrBlocks.length) {
              this.extractedBlocksByPage[this.currentPage] = ocrBlocks;
              renderEditableTextBlocks();
              notifyEditor(`👁️ OCR AI đã nhận diện ${ocrBlocks.length} dòng — bấm vào khung xanh để sửa trực tiếp!`);
            }
          }
        };
        const dataUrl = pdfCanvas.toDataURL('image/jpeg', 0.85);
        try {
          const b64 = dataUrl.split(',')[1] || '';
          const raw = await gBridge.callGeminiGenerateContent({
            taskType: 'doc_multimodal',
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: b64 } },
              { text: promptTxt },
            ],
            temperature: 0.1,
            maxOutputTokens: 8192,
          });
          applyOcr(raw);
          loader?.close?.();
        } catch (err) {
          let jpgBlob = null;
          try { jpgBlob = await (await fetch(dataUrl)).blob(); } catch (_eB) {}
          loader?.showError?.('⚠️ Lỗi OCR AI trang Scan', String(err?.message || err), {
            manualFallback: {
              taskTitle: 'PDF Editor OCR — Dán JSON dòng chữ từ Gemini',
              promptText: promptTxt,
              attachFileName: `Trang_${this.currentPage}_Scan.jpg`,
              attachFileBlob: jpgBlob,
              applyBtnLabel: '✅ Nạp khối chữ sửa trực tiếp lên trang',
              onApplyPasted: applyOcr,
            },
          });
        }
      });

      // 7. AI Thủ công 0-Token (chọn 1 trong 6 tác vụ PDF Editor mà không cần API Key!)
      container.querySelector('#btn-mod46-ai-ed-manual')?.addEventListener('click', () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        if (!gBridge) return;
        const blocks = this.extractedBlocksByPage[this.currentPage] || [];
        const oldPick = document.getElementById('mod46-ed-manual-ai-picker');
        if (oldPick) oldPick.remove();
        const pop = document.createElement('div');
        pop.id = 'mod46-ed-manual-ai-picker';
        pop.style.cssText = 'position:fixed;inset:0;z-index:2147483640;background:rgba(5,9,18,0.84);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';
        pop.innerHTML = `
          <div class="max-w-md w-full rounded-2xl border border-sky-500/50 bg-zinc-900 p-4 space-y-2.5 text-zinc-100 shadow-2xl">
            <div class="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div class="text-sm font-bold text-sky-300">📋 Chọn tác vụ AI Thủ công (0-Token · Trang ${this.currentPage})</div>
              <button type="button" id="ed-man-close" class="px-2 py-0.5 rounded bg-zinc-800 text-xs font-bold cursor-pointer">✕</button>
            </div>
            <div class="grid grid-cols-1 gap-2 text-xs">
              <button type="button" data-ed-man="polish" class="text-left p-2.5 rounded-xl bg-zinc-800 hover:bg-emerald-700 font-bold cursor-pointer">✨ 1. Sửa chính tả &amp; dính chữ trên trang này</button>
              <button type="button" data-ed-man="translate" class="text-left p-2.5 rounded-xl bg-zinc-800 hover:bg-sky-700 font-bold cursor-pointer">🌐 2. Dịch toàn trang (Việt ↔ Anh) giữ nguyên bố cục</button>
              <button type="button" data-ed-man="redact" class="text-left p-2.5 rounded-xl bg-zinc-800 hover:bg-rose-700 font-bold cursor-pointer">🛡️ 3. Quét &amp; Che đen PII nhạy cảm trên trang</button>
              <button type="button" data-ed-man="summary" class="text-left p-2.5 rounded-xl bg-zinc-800 hover:bg-amber-700 font-bold cursor-pointer">📝 4. Tóm tắt trang &amp; dán Ghi chú góc trên-phải</button>
              <button type="button" data-ed-man="table" class="text-left p-2.5 rounded-xl bg-zinc-800 hover:bg-teal-700 font-bold cursor-pointer">📊 5. Bóc bảng trang này xuất ra CSV/Excel</button>
              <button type="button" data-ed-man="ocr" class="text-left p-2.5 rounded-xl bg-zinc-800 hover:bg-violet-700 font-bold cursor-pointer">👁️ 6. OCR trang Scan thành khối chữ sửa trực tiếp</button>
            </div>
          </div>
        `;
        document.body.appendChild(pop);
        pop.querySelector('#ed-man-close')?.addEventListener('click', () => pop.remove());
        pop.addEventListener('click', (ev) => { if (ev.target === pop) pop.remove(); });
        pop.querySelectorAll('[data-ed-man]').forEach((b) => {
          b.addEventListener('click', async () => {
            const act = b.getAttribute('data-ed-man');
            pop.remove();
            if (act === 'polish') {
              const payload = blocks.slice(0, 80).map((bl, i) => `[${i}] ${bl.text}`).join('\n');
              gBridge.openManualAiAssistantModal({
                taskTitle: 'PDF Editor — Sửa chính tả (AI Thủ công 0-Token)',
                promptText: gBridge.buildTaskManualPrompt('editor_polish', { text: payload }),
                applyBtnLabel: '✅ Áp dụng sửa chữ lên trang PDF',
                onApplyPasted: (raw) => {
                  const m = String(raw || '').match(/\[[\s\S]*\]/);
                  const edits = m ? JSON.parse(m[0]) : [];
                  if (Array.isArray(edits) && edits.length) {
                    this._pushUndo();
                    for (const ed of edits) {
                      const blk = blocks[Number(ed?.i)];
                      if (!blk || !ed?.t) continue;
                      this.getPageObjects(this.currentPage).push({ type: 'replace_text', x: blk.x, y: blk.y, w: blk.w, h: blk.h, text: String(ed.t).trim(), fontSize: Math.max(8, Math.round(blk.fontSize || 12)), fontFamily: blk.fontFamily || '"Be Vietnam Pro", Arial, sans-serif', fontMeta: blk.fontMeta || null, bold: Boolean(blk.bold), italic: Boolean(blk.italic), underline: false, color: blk.inkColor || '#0f172a', bgColor: blk.bgColor || '#ffffff' });
                    }
                    redrawOverlay();
                    notifyEditor(`✅ Đã áp dụng ${edits.length} dòng sửa chữ từ Gemini!`);
                  }
                },
              });
            } else if (act === 'translate') {
              const slice = blocks.slice(0, 75);
              const hasVi = /[ăâđêôơưáàảãạ]/i.test(slice.map((x) => x.text).join(' '));
              const targetLang = hasVi ? 'English' : 'Tiếng Việt';
              const payload = slice.map((bl, i) => `[${i}] ${bl.text}`).join('\n');
              gBridge.openManualAiAssistantModal({
                taskTitle: `PDF Editor — Dịch trang sang ${targetLang} (AI Thủ công)`,
                promptText: gBridge.buildTaskManualPrompt('editor_translate', { text: payload, targetLang }),
                applyBtnLabel: '✅ Áp dụng bản dịch lên trang PDF',
                onApplyPasted: (raw) => {
                  const m = String(raw || '').match(/\[[\s\S]*\]/);
                  const edits = m ? JSON.parse(m[0]) : [];
                  if (Array.isArray(edits) && edits.length) {
                    this._pushUndo();
                    for (const ed of edits) {
                      const blk = slice[Number(ed?.i)];
                      if (!blk || !ed?.t) continue;
                      this.getPageObjects(this.currentPage).push({ type: 'replace_text', x: blk.x, y: blk.y, w: blk.w, h: blk.h, text: String(ed.t).trim(), fontSize: Math.max(8, Math.round(blk.fontSize || 11)), fontFamily: blk.fontFamily || '"Be Vietnam Pro", Arial, sans-serif', fontMeta: blk.fontMeta || null, bold: Boolean(blk.bold), italic: Boolean(blk.italic), underline: false, color: blk.inkColor || '#0f172a', bgColor: blk.bgColor || '#ffffff' });
                    }
                    redrawOverlay();
                    notifyEditor(`🌐 Đã dịch trang ${this.currentPage} sang ${targetLang}!`);
                  }
                },
              });
            } else if (act === 'redact') {
              const payload = blocks.slice(0, 120).map((bl, i) => `[${i}] ${bl.text}`).join('\n');
              gBridge.openManualAiAssistantModal({
                taskTitle: 'PDF Editor — Che đen PII (AI Thủ công)',
                promptText: gBridge.buildTaskManualPrompt('editor_redact', { text: payload }),
                applyBtnLabel: '✅ Che đen ngay các vùng nhạy cảm',
                onApplyPasted: (raw) => {
                  const m = String(raw || '').match(/\[[\s\S]*\]/);
                  const idxs = m ? JSON.parse(m[0]) : [];
                  if (Array.isArray(idxs) && idxs.length) {
                    this._pushUndo();
                    idxs.forEach((id) => { const blk = blocks[Number(id)]; if (blk) this.getPageObjects(this.currentPage).push({ type: 'redact', x: blk.x, y: blk.y, w: Math.max(24, blk.w), h: Math.max(12, blk.h) }); });
                    redrawOverlay();
                    notifyEditor(`🛡️ Đã che đen ${idxs.length} vùng nhạy cảm!`);
                  }
                },
              });
            } else if (act === 'summary') {
              const txt = blocks.map((bl) => bl.text).join('\n').trim();
              gBridge.openManualAiAssistantModal({
                taskTitle: 'PDF Editor — Tóm tắt & Dán Sticky Note (AI Thủ công)',
                promptText: gBridge.buildTaskManualPrompt('editor_summary', { text: txt }),
                applyBtnLabel: '✅ Dán Sticky Note lên trang PDF',
                onApplyPasted: (sum) => {
                  const lines = String(sum || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 3);
                  if (lines.length) {
                    this._pushUndo();
                    const nx = Math.max(20, (this.baseWidth || 595) - 250);
                    this.getPageObjects(this.currentPage).push({ type: 'rect', x: nx, y: 18, w: 232, h: 24 + lines.length * 16, color: '#d97706' });
                    lines.forEach((ln, li) => this.getPageObjects(this.currentPage).push({ type: 'add_text', x: nx + 8, y: 24 + li * 16, text: ln.slice(0, 52), fontSize: 10, fontFamily: '"Be Vietnam Pro", Arial, sans-serif', bold: li === 0, italic: false, underline: false, color: '#92400e' }));
                    redrawOverlay();
                    notifyEditor('📝 Đã dán Ghi chú Tóm tắt lên góc trang!');
                  }
                },
              });
            } else if (act === 'table') {
              const payload = blocks.map((bl) => `[x=${Math.round(bl.x)},y=${Math.round(bl.y)}] ${bl.text}`).join('\n');
              gBridge.openManualAiAssistantModal({
                taskTitle: 'PDF Editor — Bóc bảng sang Excel/CSV (AI Thủ công)',
                promptText: gBridge.buildTaskManualPrompt('editor_table', { text: payload }),
                applyBtnLabel: '✅ Xuất ngay file CSV mở bằng Excel',
                onApplyPasted: (raw) => {
                  const m = String(raw || '').match(/\[[\s\S]*\]/);
                  const rows = m ? JSON.parse(m[0]) : [];
                  if (Array.isArray(rows) && rows.length) {
                    const csv = '\uFEFF' + rows.map((r) => (Array.isArray(r) ? r : [r]).map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
                    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
                    const a = document.createElement('a'); a.href = url; a.download = `${(fileRec?.name || 'Bang').replace(/\.pdf$/i, '')}_Trang${this.currentPage}.csv`; a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                    notifyEditor(`📊 Đã xuất bảng trang ${this.currentPage} (${rows.length} hàng)!`);
                  }
                },
              });
            } else if (act === 'ocr') {
              const dUrl = pdfCanvas.toDataURL('image/jpeg', 0.85);
              let jpgBlob = null;
              try { jpgBlob = await (await fetch(dUrl)).blob(); } catch (_eB) {}
              gBridge.openManualAiAssistantModal({
                taskTitle: 'PDF Editor — OCR Trang Scan (AI Thủ công)',
                promptText: gBridge.buildTaskManualPrompt('editor_ocr', { fileName: `Trang_${this.currentPage}_Scan.jpg` }),
                attachFileName: `Trang_${this.currentPage}_Scan.jpg`,
                attachFileBlob: jpgBlob,
                applyBtnLabel: '✅ Nạp khối chữ sửa trực tiếp lên trang',
                onApplyPasted: (raw) => {
                  const m = String(raw || '').match(/\[[\s\S]*\]/);
                  const items = m ? JSON.parse(m[0]) : [];
                  if (Array.isArray(items) && items.length) {
                    const bw = this.baseWidth || 595, bh = this.baseHeight || 842;
                    this.extractedBlocksByPage[this.currentPage] = items.map((it) => ({ x: (Number(it?.xPct || 8) / 100) * bw, y: (Number(it?.yPct || 8) / 100) * bh, w: Math.max(60, (Number(it?.wPct || 65) / 100) * bw), h: 16, text: String(it?.text || '').trim(), fontSize: 12, fontFamily: '"Be Vietnam Pro", Arial, sans-serif', fontMeta: null, bold: false, italic: false, inkColor: '#0f172a', bgColor: '#ffffff' })).filter((x) => x.text);
                    renderEditableTextBlocks();
                    notifyEditor(`👁️ Đã nạp ${this.extractedBlocksByPage[this.currentPage].length} dòng OCR sửa trực tiếp!`);
                  }
                },
              });
            }
          });
        });
      });

      await renderPage(1);
      NS.i18n?.translateElement?.(container);
    }

    async exportToPdfBlob(fileRec, helpers) {
      const { ensurePdfLib, renderVietnameseTextToPngBytes, prog } = helpers;
      const { PDFDocument, rgb } = await ensurePdfLib();
      const doc = await PDFDocument.load(fileRec.bytes, { ignoreEncryption: true });
      const fontkitLib = await DangLovePDFFontResolver.ensureFontkit();
      if (fontkitLib && typeof doc.registerFontkit === 'function') {
        try { doc.registerFontkit(fontkitLib); } catch (_eFk) {}
      }
      const embeddedFontCache = new Map();
      const pages = doc.getPages();

      const hexToRgb = (hex) => {
        const m = String(hex || '#0f172a').replace('#', '');
        return rgb(
          parseInt(m.slice(0, 2), 16) / 255 || 0,
          parseInt(m.slice(2, 4), 16) / 255 || 0,
          parseInt(m.slice(4, 6), 16) / 255 || 0
        );
      };

      const resolveEmbeddedVectorFont = async (o) => {
        if (!fontkitLib) return null;
        const meta = o.fontMeta || DangLovePDFFontResolver.classifyFontMeta(o.fontFamily || 'Arial', null);
        const effMeta = { ...meta, isBold: Boolean(o.bold), isItalic: Boolean(o.italic) };
        const key = `${effMeta.canonicalKey}_${effMeta.cleanFontFamily}_${effMeta.isBold}_${effMeta.isItalic}`;
        if (embeddedFontCache.has(key)) return embeddedFontCache.get(key);
        try {
          const resolved = await DangLovePDFFontResolver.resolveFontForBlock(effMeta);
          if (resolved?.bytes) {
            const emb = await doc.embedFont(resolved.bytes, { subset: true });
            embeddedFontCache.set(key, emb);
            return emb;
          }
        } catch (_eEmb) {}
        embeddedFontCache.set(key, null);
        return null;
      };

      const editedPageNums = Object.keys(this.objectsByPage).map(Number).filter((n) => this.objectsByPage[n]?.length);
      for (let idx = 0; idx < editedPageNums.length; idx++) {
        const pNo = editedPageNums[idx];
        const pg = pages[pNo - 1];
        if (!pg) continue;
        prog(20 + ((idx + 1) / Math.max(1, editedPageNums.length)) * 70, `Đang ghi chỉnh sửa vector trang ${pNo}...`);
        const { width, height } = pg.getSize();

        for (const o of this.objectsByPage[pNo]) {
          if (o.type === 'replace_text') {
            pg.drawRectangle({
              x: o.x - 1.5,
              y: height - o.y - o.h - 1.5,
              width: o.w + 4,
              height: o.h + 3,
              color: hexToRgb(o.bgColor || '#ffffff'),
            });
            if (o.text.trim()) {
              const vecFont = await resolveEmbeddedVectorFont(o);
              if (vecFont) {
                let sz = o.fontSize || 12;
                const availW = Math.max(40, width - o.x - 18);
                try {
                  const tw = vecFont.widthOfTextAtSize(o.text, sz);
                  if (tw > availW) sz = Math.max(7, sz * (availW / tw));
                } catch (_eW) {}
                const baselineY = height - o.y - sz * 0.92;
                pg.drawText(o.text, { x: o.x, y: baselineY, size: sz, font: vecFont, color: hexToRgb(o.color || '#0f172a') });
                if (o.underline) {
                  const uw = Math.min(availW, vecFont.widthOfTextAtSize(o.text, sz));
                  pg.drawLine({ start: { x: o.x, y: baselineY - 1.5 }, end: { x: o.x + uw, y: baselineY - 1.5 }, thickness: Math.max(0.6, sz * 0.06), color: hexToRgb(o.color || '#0f172a') });
                }
              } else {
                const png = renderVietnameseTextToPngBytes(o.text, {
                  fontSize: o.fontSize || 12,
                  color: o.color || '#0f172a',
                  fontFamily: o.fontFamily || 'Arial, Helvetica, sans-serif',
                  bold: Boolean(o.bold),
                  italic: Boolean(o.italic),
                  underline: Boolean(o.underline),
                  padX: 2,
                  padY: 1,
                });
                const img = await doc.embedPng(png.bytes);
                const drawW = Math.min(png.widthPt, Math.max(40, width - o.x - 18));
                const drawH = png.heightPt * (drawW / Math.max(1, png.widthPt));
                pg.drawImage(img, { x: o.x, y: height - o.y - drawH, width: drawW, height: drawH });
              }
            }
          } else if (o.type === 'add_text') {
            const vecFont = await resolveEmbeddedVectorFont(o);
            if (vecFont && o.text.trim()) {
              let sz = o.fontSize || 14;
              const availW = Math.max(40, width - o.x - 18);
              try {
                const tw = vecFont.widthOfTextAtSize(o.text, sz);
                if (tw > availW) sz = Math.max(7, sz * (availW / tw));
              } catch (_eW2) {}
              const baselineY = height - o.y - sz * 0.92;
              pg.drawText(o.text, { x: o.x, y: baselineY, size: sz, font: vecFont, color: hexToRgb(o.color || '#dc2626') });
              continue;
            }
            const png = renderVietnameseTextToPngBytes(o.text, {
              fontSize: o.fontSize || 14,
              color: o.color || '#dc2626',
              fontFamily: o.fontFamily || 'Arial, Helvetica, sans-serif',
              bold: Boolean(o.bold),
              italic: Boolean(o.italic),
              underline: Boolean(o.underline),
              padX: 4,
              padY: 2,
            });
            const img = await doc.embedPng(png.bytes);
            pg.drawImage(img, { x: o.x, y: height - o.y - png.heightPt, width: png.widthPt, height: png.heightPt });
          } else if (o.type === 'highlight') {
            const rx = Math.min(o.x, o.x + o.w);
            const ry = Math.min(o.y, o.y + o.h);
            pg.drawRectangle({ x: rx, y: height - ry - Math.abs(o.h), width: Math.abs(o.w), height: Math.abs(o.h), color: rgb(0.98, 0.8, 0.08), opacity: 0.42 });
          } else if (o.type === 'redact') {
            const rx = Math.min(o.x, o.x + o.w);
            const ry = Math.min(o.y, o.y + o.h);
            pg.drawRectangle({ x: rx, y: height - ry - Math.abs(o.h), width: Math.abs(o.w), height: Math.abs(o.h), color: rgb(0, 0, 0) });
          } else if (o.type === 'rect') {
            const rx = Math.min(o.x, o.x + o.w);
            const ry = Math.min(o.y, o.y + o.h);
            pg.drawRectangle({ x: rx, y: height - ry - Math.abs(o.h), width: Math.abs(o.w), height: Math.abs(o.h), borderColor: hexToRgb(o.color), borderWidth: 2, opacity: 0 });
          } else if (o.type === 'arrow' || o.type === 'measure') {
            const col = o.type === 'measure' ? rgb(0.01, 0.52, 0.78) : hexToRgb(o.color);
            pg.drawLine({ start: { x: o.x1, y: height - o.y1 }, end: { x: o.x2, y: height - o.y2 }, thickness: 2, color: col });
            if (o.type === 'measure' && o.label) {
              const png = renderVietnameseTextToPngBytes(o.label, { fontSize: 11, color: '#0284c7', bold: true, padX: 4, padY: 2 });
              const img = await doc.embedPng(png.bytes);
              pg.drawImage(img, { x: (o.x1 + o.x2) / 2, y: height - (o.y1 + o.y2) / 2 + 4, width: png.widthPt, height: png.heightPt });
            }
          } else if (o.type === 'ink' && o.points?.length > 1) {
            const col = hexToRgb(o.color);
            for (let i = 1; i < o.points.length; i++) {
              pg.drawLine({
                start: { x: o.points[i - 1].x, y: height - o.points[i - 1].y },
                end: { x: o.points[i].x, y: height - o.points[i].y },
                thickness: 2,
                color: col,
              });
            }
          } else if (o.type === 'stamp') {
            pg.drawRectangle({ x: o.x, y: height - o.y - 42, width: 185, height: 42, borderColor: hexToRgb(o.color), borderWidth: 2, opacity: 0 });
            const png = renderVietnameseTextToPngBytes(`${o.text} • ${o.subText || ''}`, { fontSize: 11, color: o.color || '#dc2626', bold: true, padX: 6, padY: 4 });
            const img = await doc.embedPng(png.bytes);
            pg.drawImage(img, { x: o.x + 4, y: height - o.y - 32, width: Math.min(176, png.widthPt), height: png.heightPt });
          } else if (o.type === 'image' && o.dataUrl) {
            const bytes = NS.dangLovePdfPro?.dataUrlToUint8?.(o.dataUrl);
            if (bytes) {
              const emb = /png/i.test(o.dataUrl) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
              pg.drawImage(emb, { x: o.x, y: height - o.y - o.h, width: o.w, height: o.h });
            }
          }
        }
      }

      return new Blob([await doc.save()], { type: 'application/pdf' });
    }
  }

  NS.dangLovePdfStudioPro = Object.freeze({
    openProPdfViewer,
    editor: new TrueInteractivePdfEditor(),
  });
})(typeof window !== 'undefined' ? window : globalThis);
