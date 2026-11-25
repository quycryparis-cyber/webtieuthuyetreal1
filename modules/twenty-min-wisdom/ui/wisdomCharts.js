/**
 * ============================================================================
 * 📊 20 PHÚT THÔNG THÁI MỖI NGÀY — PURE-SVG CHARTS, MINDMAP & VISUAL GALLERY (v130.0)
 * ============================================================================
 * - 0 thư viện ngoài, 100% Pure SVG sắc nét ở mọi DPR (Retina/Mobile/Desktop):
 *   1. Biểu đồ Tròn (Donut SVG): Phân bổ 20 phút đọc thông thái theo 5 chủ đề.
 *   2. Biểu đồ Cột ngang (Impact Bar SVG): Điểm tác động (0–100) từng sự kiện nóng.
 *   3. Sơ đồ Chuỗi Nhân Quả / Mindmap SVG: Nguyên nhân ➔ Cơ chế ➔ Hệ quả thực tế.
 *   4. Dòng thời gian (Timeline) + Thư viện Hình ảnh Sự kiện Thực tế từ nguồn gốc.
 * ============================================================================
 */
(function initWisdom20Charts(globalScope) {
  'use strict';

  const W20 = (globalScope.NoirWisdom20 = globalScope.NoirWisdom20 || {});

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function wrapLines(text, maxChars = 22, maxLines = 3) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= maxChars) {
        cur = (cur + ' ' + w).trim();
      } else {
        if (cur) lines.push(cur);
        cur = w;
        if (lines.length >= maxLines - 1) break;
      }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    if (!lines.length) lines.push('—');
    return lines;
  }

  /**
   * 1. Biểu đồ Tròn (Donut SVG) — Phân bổ 20 phút đọc thông thái
   */
  function renderReadingDonutSvg(planItems) {
    const palette = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];
    const items = (Array.isArray(planItems) && planItems.length ? planItems : [
      { label: 'Thế giới', minutes: 3, color: '#0ea5e9' },
      { label: 'Công nghệ & AI', minutes: 3, color: '#8b5cf6' },
      { label: 'Kinh tế', minutes: 3, color: '#f59e0b' },
      { label: 'Khu vực (Chuyên sâu 13p)', minutes: 13, color: '#10b981' },
      { label: 'Sức khỏe & Y học', minutes: 2, color: '#ef4444' },
      { label: 'Pháp luật & Xã hội', minutes: 2, color: '#06b6d4' },
      { label: 'Tâm lý & Quản trị', minutes: 2, color: '#a855f7' },
      { label: 'Tri thức & Vũ trụ', minutes: 2, color: '#ec4899' },
    ]).map((it, i) => ({
      label: String(it.label || `Mục ${i + 1}`),
      minutes: Math.max(1, Number(it.minutes) || 2),
      color: it.color || palette[i % palette.length],
    }));

    const total = items.reduce((s, x) => s + x.minutes, 0) || 20;
    const cx = 90;
    const cy = 90;
    const r = 64;
    const circ = 2 * Math.PI * r;
    let offset = 0;

    const slices = items.map((it) => {
      const len = (it.minutes / total) * circ;
      const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${esc(it.color)}" stroke-width="22" stroke-dasharray="${len.toFixed(2)} ${(circ - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" />`;
      offset += len;
      return seg;
    }).join('');

    const legend = items.map((it) => `
      <div class="flex items-center justify-between gap-2 text-xs">
        <span class="inline-flex items-center gap-1.5 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${esc(it.color)}"></span>
          <span class="truncate font-bold">${esc(it.label)}</span>
        </span>
        <span class="font-black tabular-nums shrink-0 opacity-85">${it.minutes} phút</span>
      </div>
    `).join('');

    return `
      <div class="wis20-chart-box space-y-3 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-sm font-black">⏱️ Biểu đồ Lộ trình 30 Phút Đọc Thông Thái</h4>
          <span class="wis20-badge">Tổng ${total} phút (Trụ cột 4: +10p)</span>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-4 min-w-0">
          <svg viewBox="0 0 180 180" class="w-36 h-36 sm:w-40 sm:h-40 shrink-0" role="img" aria-label="Biểu đồ phân bổ 30 phút đọc">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(113,113,122,0.18)" stroke-width="22" />
            ${slices}
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="currentColor" font-size="24" font-weight="900">${total}p</text>
            <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="currentColor" opacity="0.65" font-size="10" font-weight="700">MỖI NGÀY</text>
          </svg>
          <div class="flex-1 min-w-0 w-full space-y-2">${legend}</div>
        </div>
      </div>
    `;
  }

  /**
   * 2. Biểu đồ Cột ngang (Responsive HTML + Bar — Hỗ trợ đủ 8 sự kiện, 0% cắt chữ, 0% tràn viền!)
   */
  function renderImpactBarsSvg(impactScores) {
    const rows = (Array.isArray(impactScores) ? impactScores : []).slice(0, 8);
    if (!rows.length) {
      return '<div class="wis20-chart-box text-xs opacity-70">Chưa có dữ liệu điểm tác động.</div>';
    }
    const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#0ea5e9', '#10b981', '#ec4899', '#14b8a6', '#f97316'];

    const barsHtml = rows.map((r, idx) => {
      const score = Math.max(10, Math.min(100, Number(r.score) || 70));
      const col = colors[idx % colors.length];
      const label = String(r.topic || `Sự kiện ${idx + 1}`).replace(/\*/g, '').trim();
      const cat = String(r.category || '').replace(/\*/g, '').trim();
      return `
        <div class="space-y-1 min-w-0">
          <div class="flex items-start justify-between gap-2 text-xs sm:text-[13px] leading-snug">
            <span class="font-extrabold break-words min-w-0 flex-1">${esc(label)}</span>
            <span class="font-black tabular-nums shrink-0" style="color:${col}">${score}/100</span>
          </div>
          <div class="flex items-center gap-2 min-w-0">
            <div class="flex-1 h-2.5 rounded-full overflow-hidden" style="background:rgba(113,113,122,0.22);">
              <div class="h-full rounded-full" style="width:${score}%;background:${col};"></div>
            </div>
            ${cat ? `<span class="text-[11px] font-bold opacity-75 shrink-0 max-w-[42%] truncate">${esc(cat)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="wis20-chart-box space-y-3 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-sm font-black">📊 Biểu đồ Mức độ Tác động Sự kiện Hôm nay (${rows.length} sự kiện)</h4>
          <span class="wis20-badge">Thang 0–100</span>
        </div>
        <div class="space-y-3">${barsHtml}</div>
      </div>
    `;
  }

  /**
   * 3. Sơ đồ Chuỗi Nhân Quả / Mindmap (Responsive 3 cột — Hỗ trợ đủ 8 sự kiện, 0% cắt chữ, 0% tràn viền!)
   */
  function renderCausalMindmapSvg(mindmap) {
    const chains = Array.isArray(mindmap?.chains) ? mindmap.chains.slice(0, 8) : [];
    if (!chains.length) {
      return '<div class="wis20-chart-box text-xs opacity-70">Chưa có sơ đồ nhân quả.</div>';
    }

    const rowsHtml = chains.map((ch, idx) => `
      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-2">
        <div class="rounded-xl p-3 border border-sky-500/60 bg-sky-500/10 text-xs sm:text-[13px] font-bold leading-relaxed break-words">
          <div class="text-[10px] font-black uppercase text-sky-400 mb-1 md:hidden">⚡ Nguyên nhân #${idx + 1}</div>
          ${esc(String(ch.cause || '—').replace(/\*/g, ''))}
        </div>
        <div class="flex items-center justify-center text-violet-400 font-black text-base select-none">
          <span class="hidden md:inline">➔</span>
          <span class="md:hidden">↓</span>
        </div>
        <div class="rounded-xl p-3 border border-violet-500/60 bg-violet-500/10 text-xs sm:text-[13px] font-bold leading-relaxed break-words">
          <div class="text-[10px] font-black uppercase text-violet-400 mb-1 md:hidden">🔗 Cơ chế lan truyền</div>
          ${esc(String(ch.mechanism || '—').replace(/\*/g, ''))}
        </div>
        <div class="flex items-center justify-center text-emerald-400 font-black text-base select-none">
          <span class="hidden md:inline">➔</span>
          <span class="md:hidden">↓</span>
        </div>
        <div class="rounded-xl p-3 border border-emerald-500/60 bg-emerald-500/10 text-xs sm:text-[13px] font-bold leading-relaxed break-words">
          <div class="text-[10px] font-black uppercase text-emerald-400 mb-1 md:hidden">🎯 Hệ quả thực tế</div>
          ${esc(String(ch.effect || '—').replace(/\*/g, ''))}
        </div>
      </div>
    `).join('');

    return `
      <div class="wis20-chart-box space-y-3 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-sm font-black">🕸️ Sơ đồ Nhân Quả &amp; Tư duy Hệ thống: ${esc(mindmap?.center || 'Toàn cảnh hôm nay')} (${chains.length} chuỗi)</h4>
          <span class="wis20-badge">Responsive Mindmap</span>
        </div>
        <div class="hidden md:grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 text-center text-[11px] font-black uppercase tracking-wide">
          <div class="text-sky-400">⚡ SỰ KIỆN / NGUYÊN NHÂN GỐC</div>
          <div class="w-5"></div>
          <div class="text-violet-400">🔗 CƠ CHẾ LAN TRUYỀN</div>
          <div class="w-5"></div>
          <div class="text-emerald-400">🎯 HỆ QUẢ ĐỜI SỐNG &amp; CÔNG VIỆC</div>
        </div>
        <div class="space-y-3">${rowsHtml}</div>
      </div>
    `;
  }

  /**
   * 4. Dòng thời gian (Timeline) + Thư viện Hình ảnh Thực tế Hôm nay
   */
  function renderTimelineAndGalleryHtml(syncData, scanResult) {
    const timeline = Array.isArray(syncData?.timeline) ? syncData.timeline.slice(0, 6) : [];
    const gallery = Array.isArray(scanResult?.visualGallery) ? scanResult.visualGallery.slice(0, 6) : [];
    const visualQueries = Array.isArray(syncData?.visual_search_queries) ? syncData.visual_search_queries.slice(0, 4) : [];

    const timelineHtml = timeline.length ? `
      <div class="wis20-chart-box space-y-2.5">
        <h4 class="text-xs sm:text-sm font-black">🗓️ Dòng Thời Gian Sự Kiện & Mốc Đáng Chú Ý</h4>
        <div class="space-y-2 border-l-2 border-emerald-500/50 pl-3 ml-1.5">
          ${timeline.map((t) => `
            <div class="relative">
              <span class="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25"></span>
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[11px] font-black text-emerald-600 dark:text-emerald-400">${esc(t.time || 'Hôm nay')}</span>
                ${t.tag ? `<span class="wis20-badge">${esc(t.tag)}</span>` : ''}
              </div>
              <div class="text-xs font-semibold opacity-90 mt-0.5">${esc(t.event || '')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const galleryHtml = `
      <div class="wis20-chart-box space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-xs sm:text-sm font-black">🖼️ Hình ảnh Thực tế Minh họa Sự kiện Hôm nay</h4>
          <span class="wis20-badge">${gallery.length} ảnh xác thực nguồn</span>
        </div>
        ${gallery.length ? `
          <div class="wis20-gallery-grid">
            ${gallery.map((g) => `
              <a href="${esc(g.url)}" target="_blank" rel="noopener noreferrer" class="wis20-news-item no-underline text-inherit">
                <img src="${esc(g.imageUrl)}" alt="${esc(g.title)}" loading="lazy" referrerpolicy="no-referrer" class="wis20-news-thumb" onerror="this.style.display='none'" />
                <div class="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <span class="wis20-badge mb-1">${esc(g.tag || 'Ảnh sự kiện')}</span>
                    <div class="text-xs font-extrabold leading-snug line-clamp-2">${esc(g.title)}</div>
                    <div class="text-[11px] opacity-75 mt-0.5 line-clamp-2">${esc(g.caption)}</div>
                  </div>
                  <div class="text-[10.5px] font-bold text-sky-600 dark:text-sky-400 pt-1">↗️ Xem bài gốc</div>
                </div>
              </a>
            `).join('')}
          </div>
        ` : '<div class="text-xs opacity-70">Chưa có ảnh thumbnail trực tiếp từ đợt quét này.</div>'}
        ${visualQueries.length ? `
          <div class="pt-2 border-t border-zinc-300/50 dark:border-zinc-700/60 flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] font-bold opacity-75">🔍 Gợi ý tra ảnh/infographic từ Gemini:</span>
            ${visualQueries.map((q) => `
              <a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer" class="wis20-badge hover:underline text-sky-700 dark:text-sky-300">🖼️ ${esc(q)}</a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    return timelineHtml + galleryHtml;
  }

  function renderAllChartsHtml(syncData, scanResult) {
    const data = syncData || W20.buildDefaultChartDataFromRaw(scanResult);
    return `
      <div class="space-y-3">
        ${data.isFallbackFromRaw ? `
          <div class="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200">
            ℹ️ Đang hiển thị <b>Biểu đồ & Sơ đồ tự động dựng từ Thông tin thô</b>. Nếu bạn dán kết quả từ Gemini (Bước 1–2), biểu đồ và sơ đồ nhân quả sẽ được nâng cấp chi tiết hơn nữa!
          </div>
        ` : `
          <div class="p-3 rounded-xl border border-emerald-500/45 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
            ✅ Đã đồng bộ thành công chuẩn <b>WISDOM_20MIN_SYNC_V1</b> từ Gemini: <b>${esc(data.headline || '')}</b>
          </div>
        `}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          ${renderReadingDonutSvg(data.reading_plan_30m || data.reading_plan_20m)}
          ${renderImpactBarsSvg(data.impact_scores)}
        </div>
        ${renderCausalMindmapSvg(data.causal_mindmap)}
        ${renderTimelineAndGalleryHtml(data, scanResult)}
      </div>
    `;
  }

  W20.charts = {
    renderReadingDonutSvg,
    renderImpactBarsSvg,
    renderCausalMindmapSvg,
    renderTimelineAndGalleryHtml,
    renderAllChartsHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
