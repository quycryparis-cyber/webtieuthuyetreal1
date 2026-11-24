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
            <input id="inp-mod46-pv-page" type="number" min="1" max="1" value="1" inputmode="numeric" aria-label="Số trang hiện tại" class="w-12 px-1 py-0.5 rounded-lg bg-zinc-900 border border-amber-400/50 text-center text-xs font-black text-amber-300 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-400" />
            <span id="mod46-pv-page-total" class="text-zinc-300 font-bold">/ ...</span>
          </span>
          <button type="button" id="btn-mod46-pv-next" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer">Sau ▶</button>
          <button type="button" id="btn-mod46-pv-zoom-out" class="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-black cursor-pointer" title="Thu nhỏ">➖</button>
          <span id="mod46-pv-zoom-val" class="text-[11px] font-bold text-zinc-300 w-10 text-center">100%</span>
          <button type="button" id="btn-mod46-pv-zoom-in" class="px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-black cursor-pointer" title="Phóng to">➕</button>
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
          <a href="${resItem.url}" download="${escHtml(resItem.name)}" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black">⬇️ Tải</a>
          <button type="button" id="btn-mod46-pv-close" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer">✕ Đóng</button>
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
    const prevBtn = pv.querySelector('#btn-mod46-pv-prev');
    const nextBtn = pv.querySelector('#btn-mod46-pv-next');
    const searchInput = pv.querySelector('#inp-mod46-pv-search');
    const regexChk = pv.querySelector('#chk-mod46-pv-regex');
    const searchStat = pv.querySelector('#mod46-pv-search-stat');

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
      if (pageTotalEl) {
        pageTotalEl.textContent =
          layoutMode === 'spread' && currentPage < total
            ? `–${currentPage + 1} / ${total}`
            : `/ ${total}`;
      }
      if (zoomValEl) zoomValEl.textContent = `${Math.round(zoomFactor * 100)}%`;
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const renderScale = Math.max(0.55, Math.min(3.5, fitScale * zoomFactor));
      const cssW = Math.round(baseVp.width * renderScale);
      const cssH = Math.round(baseVp.height * renderScale);
      return { renderScale, dpr, cssW, cssH };
    }

    async function paintPageIntoContainer(pageNo, wrap, isFirstPrimary, expectedToken) {
      if (isClosed || !pdfDoc || expectedToken !== renderToken) return;
      const page = await pdfDoc.getPage(pageNo);
      if (isClosed || !pdfDoc || expectedToken !== renderToken) return;
      const rot = (page.rotate + viewRot) % 360;
      const baseVp = page.getViewport({ scale: 1, rotation: rot });
      const { renderScale, dpr, cssW, cssH } = computePageDimensions(baseVp);
      const vp = page.getViewport({ scale: renderScale * dpr, rotation: rot });

      wrap.style.width = `${cssW}px`;
      wrap.style.height = `${cssH}px`;
      wrap.style.filter = darkInvert ? 'invert(0.9) hue-rotate(180deg) contrast(0.95)' : '';
      wrap.innerHTML = '';

      // Layer 1: HiDPI Bitmap Canvas
      const canvas = document.createElement('canvas');
      if (isFirstPrimary) canvas.id = 'mod46-preview-pdf-canvas';
      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.className = 'block';
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      wrap.appendChild(canvas);

      try {
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
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
      pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;

      prevBtn?.addEventListener('click', () => goToPage(currentPage - (layoutMode === 'spread' ? 2 : 1), { smooth: true }));
      nextBtn?.addEventListener('click', () => goToPage(currentPage + (layoutMode === 'spread' ? 2 : 1), { smooth: true }));
      pv.querySelector('#btn-mod46-pv-zoom-out')?.addEventListener('click', () => {
        zoomFactor = Math.max(0.5, Number((zoomFactor - 0.2).toFixed(2)));
        rebuildCurrentLayout(currentPage);
      });
      pv.querySelector('#btn-mod46-pv-zoom-in')?.addEventListener('click', () => {
        zoomFactor = Math.min(3.0, Number((zoomFactor + 0.2).toFixed(2)));
        rebuildCurrentLayout(currentPage);
      });
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

        if (thumbsList) {
          thumbsList.innerHTML = '';
          const limit = Math.min(pdfDoc.numPages, 50);
          for (let i = 1; i <= limit; i++) {
            if (isClosed || !pdfDoc || !pv.isConnected) break;
            try {
              const pg = await pdfDoc.getPage(i);
              if (isClosed || !pdfDoc) break;
              const tvp = pg.getViewport({ scale: 0.25 });
              const tc = document.createElement('canvas');
              tc.width = tvp.width;
              tc.height = tvp.height;
              await pg.render({ canvasContext: tc.getContext('2d'), viewport: tvp }).promise;
              if (isClosed || !pv.isConnected) { tc.width = tc.height = 0; break; }
              const itemBtn = document.createElement('button');
              itemBtn.type = 'button';
              itemBtn.setAttribute('data-thumb-page', String(i));
              const isCur = i === currentPage;
              itemBtn.className = `w-full p-1.5 rounded-xl border ${isCur ? 'border-amber-400 ring-1 ring-amber-400' : 'border-zinc-700'} hover:border-emerald-400 bg-zinc-950 flex flex-col items-center gap-1 cursor-pointer`;
              itemBtn.innerHTML = `<img src="${tc.toDataURL('image/jpeg', 0.7)}" class="w-full rounded bg-white" /><span class="text-[10px] font-bold text-zinc-300">Trang ${i}</span>`;
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
      this.fontSize = 14;
      this.measureScale = 5; // 1 cm = 5 m
      this.stampLabel = 'ĐÃ DUYỆT';
      this.pendingImgDataUrl = '';
      this.pageScale = 1;
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

          <!-- Thanh thuộc tính nhanh + Điều hướng trang -->
          <div class="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px]">
            <div class="flex flex-wrap items-center gap-2">
              <label class="flex items-center gap-1">Màu: <input id="inp-mod46-ed-color" type="color" value="#dc2626" class="w-6 h-6 rounded bg-transparent border border-zinc-600" /></label>
              <label class="flex items-center gap-1">Cỡ chữ: <input id="inp-mod46-ed-fsize" type="number" min="8" max="48" value="14" class="w-12 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-center" /></label>
              <label class="flex items-center gap-1">Dấu:
                <select id="sel-mod46-ed-stamp" class="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700">
                  <option value="ĐÃ DUYỆT">ĐÃ DUYỆT</option>
                  <option value="BẢO MẬT">BẢO MẬT</option>
                  <option value="BẢN NHÁP">BẢN NHÁP</option>
                  <option value="ĐÃ KIỂM TRA">ĐÃ KIỂM TRA</option>
                </select>
              </label>
              <span id="mod46-ed-hint" class="text-emerald-300 font-bold">💡 Bấm trực tiếp vào bất kỳ dòng chữ gốc nào (viền nét đứt xanh) để sửa ngay!</span>
            </div>
            <div class="flex items-center gap-1.5">
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
      this.pdfDoc = await pdfjsLib.getDocument({ data: fileRec.bytes.slice() }).promise;
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
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        const sc = this.pageScale;
        const objs = this.getPageObjects(this.currentPage);

        for (const o of objs) {
          if (o.type === 'replace_text') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(o.x * sc - 2, o.y * sc - 2, o.w * sc + 4, o.h * sc + 4);
            ctx.fillStyle = o.color || '#0f172a';
            ctx.font = `600 ${Math.max(10, o.fontSize * sc)}px "Segoe UI", Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(o.text, o.x * sc, o.y * sc);
          } else if (o.type === 'add_text') {
            ctx.fillStyle = o.color || '#dc2626';
            ctx.font = `700 ${Math.max(10, o.fontSize * sc)}px "Segoe UI", Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(o.text, o.x * sc, o.y * sc);
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
              ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
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
            ctx.font = `900 ${Math.max(10, 12 * sc)}px "Segoe UI", Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(o.text, (o.x + 8) * sc, (o.y + 7) * sc);
            ctx.font = `600 ${Math.max(8, 9 * sc)}px "Segoe UI", Arial, sans-serif`;
            ctx.fillText(o.subText || '', (o.x + 8) * sc, (o.y + 24) * sc);
            ctx.restore();
          } else if (o.type === 'image' && o._imgEl) {
            ctx.drawImage(o._imgEl, o.x * sc, o.y * sc, o.w * sc, o.h * sc);
          }
        }
        updateSummary();
      };

      // Bộ gõ trực tiếp NGAY TRÊN TRANG PDF (KHÔNG bật popup window.prompt!)
      const openInlinePdfTextEditor = ({ x, y, w, h, initialText, fontSize, onCommit }) => {
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
          'line-height:1.25',
          'padding:1px 5px',
          'background:#ffffff',
          'color:#0f172a',
          'border:2px solid #10b981',
          'border-radius:4px',
          'box-shadow:0 4px 16px rgba(16,185,129,0.35)',
          'outline:none',
          'z-index:40',
          'font-family:"Segoe UI",Arial,sans-serif',
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
          b.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const existingReplaced = [...this.getPageObjects(this.currentPage)]
              .reverse()
              .find((o) => o.type === 'replace_text' && Math.abs(o.x - blk.x) < 3 && Math.abs(o.y - blk.y) < 3);
            const startText = existingReplaced ? existingReplaced.text : blk.text;
            openInlinePdfTextEditor({
              x: blk.x,
              y: blk.y,
              w: blk.w,
              h: blk.h,
              initialText: startText,
              fontSize: Math.max(9, Math.round(blk.fontSize || 12)),
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
                  fontSize: Math.max(9, Math.round(blk.fontSize || 12)),
                  color: this.color === '#dc2626' ? '#0f172a' : this.color,
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
        const maxW = Math.min(920, Math.max(320, container.clientWidth - 28));
        this.pageScale = maxW / Math.max(1, baseVp.width);
        const vp = page.getViewport({ scale: this.pageScale });

        pdfCanvas.width = overlayCanvas.width = Math.round(vp.width);
        pdfCanvas.height = overlayCanvas.height = Math.round(vp.height);
        stage.style.width = `${Math.round(vp.width)}px`;
        stage.style.height = `${Math.round(vp.height)}px`;

        const pCtx = pdfCanvas.getContext('2d');
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, pdfCanvas.width, pdfCanvas.height);
        await page.render({ canvasContext: pCtx, viewport: vp }).promise;

        // Trích xuất & gom cụm các dòng chữ gốc thành khối có thể bấm sửa trực tiếp
        if (!this.extractedBlocksByPage[this.currentPage]) {
          const tc = await page.getTextContent();
          const lineMap = new Map();
          for (const it of tc.items) {
            const s = String(it.str || '').trim();
            if (!s) continue;
            const x = it.transform[4];
            const yPdf = it.transform[5];
            const fSize = Math.max(8, Math.hypot(it.transform[0], it.transform[1]));
            const yTop = this.baseHeight - yPdf - fSize * 0.9;
            const bucket = Math.round(yTop / 7) * 7;
            if (!lineMap.has(bucket)) lineMap.set(bucket, []);
            lineMap.get(bucket).push({ x, y: yTop, w: it.width || s.length * fSize * 0.55, h: fSize * 1.25, text: s, fontSize: fSize });
          }
          const blocks = [];
          lineMap.forEach((arr) => {
            arr.sort((a, b) => a.x - b.x);
            const minX = arr[0].x;
            const minY = Math.min(...arr.map((a) => a.y));
            const maxX = Math.max(...arr.map((a) => a.x + a.w));
            const maxH = Math.max(...arr.map((a) => a.h));
            blocks.push({
              x: minX,
              y: minY,
              w: Math.max(30, maxX - minX),
              h: maxH,
              fontSize: arr[0].fontSize,
              text: arr.map((a) => a.text).join(' '),
            });
          });
          this.extractedBlocksByPage[this.currentPage] = blocks;
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
          openInlinePdfTextEditor({
            x: p.x,
            y: p.y,
            w: 160,
            h: this.fontSize * 1.5,
            initialText: '',
            fontSize: this.fontSize,
            onCommit: (txt) => {
              if (!txt || !txt.trim()) return;
              this._pushUndo();
              this.getPageObjects(this.currentPage).push({ type: 'add_text', x: p.x, y: p.y, text: txt, fontSize: this.fontSize, color: this.color });
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

      container.querySelector('#inp-mod46-ed-color')?.addEventListener('input', (ev) => { this.color = ev.target.value; });
      container.querySelector('#inp-mod46-ed-fsize')?.addEventListener('change', (ev) => { this.fontSize = Math.max(8, Number(ev.target.value) || 14); });
      container.querySelector('#sel-mod46-ed-stamp')?.addEventListener('change', (ev) => { this.stampLabel = ev.target.value; });
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

      await renderPage(1);
    }

    async exportToPdfBlob(fileRec, helpers) {
      const { ensurePdfLib, renderVietnameseTextToPngBytes, prog } = helpers;
      const { PDFDocument, rgb } = await ensurePdfLib();
      const doc = await PDFDocument.load(fileRec.bytes, { ignoreEncryption: true });
      const pages = doc.getPages();

      const hexToRgb = (hex) => {
        const m = String(hex || '#dc2626').replace('#', '');
        return rgb(
          parseInt(m.slice(0, 2), 16) / 255 || 0,
          parseInt(m.slice(2, 4), 16) / 255 || 0,
          parseInt(m.slice(4, 6), 16) / 255 || 0
        );
      };

      const editedPageNums = Object.keys(this.objectsByPage).map(Number).filter((n) => this.objectsByPage[n]?.length);
      for (let idx = 0; idx < editedPageNums.length; idx++) {
        const pNo = editedPageNums[idx];
        const pg = pages[pNo - 1];
        if (!pg) continue;
        prog(20 + ((idx + 1) / Math.max(1, editedPageNums.length)) * 70, `Đang ghi chỉnh sửa trang ${pNo}...`);
        const { height } = pg.getSize();

        for (const o of this.objectsByPage[pNo]) {
          if (o.type === 'replace_text') {
            pg.drawRectangle({ x: o.x - 2, y: height - o.y - o.h - 2, width: o.w + 6, height: o.h + 4, color: rgb(1, 1, 1) });
            if (o.text.trim()) {
              const png = renderVietnameseTextToPngBytes(o.text, { fontSize: o.fontSize || 12, color: o.color || '#0f172a', bold: false, padX: 2, padY: 1 });
              const img = await doc.embedPng(png.bytes);
              pg.drawImage(img, { x: o.x, y: height - o.y - png.heightPt, width: png.widthPt, height: png.heightPt });
            }
          } else if (o.type === 'add_text') {
            const png = renderVietnameseTextToPngBytes(o.text, { fontSize: o.fontSize || 14, color: o.color || '#dc2626', bold: true, padX: 4, padY: 2 });
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
