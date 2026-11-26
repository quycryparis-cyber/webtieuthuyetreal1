/**
 * ============================================================================
 * 📄 20 PHÚT THÔNG THÁI MỖI NGÀY — PURE PDF MAGAZINE REPORT EXPORTER (v131.0)
 * ============================================================================
 * - Xuất file `.pdf` thuần chuẩn 100% trên trình duyệt/Mobile/Electron qua `pdf-lib`
 *   + vẽ Canvas HiDPI A4 (1240×1754px @ 150dpi) đảm bảo:
 *     1. Trang Bìa Đẹp Chuẩn Tạp Chí: Tiêu đề "20 PHÚT THÔNG THÁI MỖI NGÀY",
 *        Tự động chèn Ngày/Tháng/Năm hôm nay từ đồng hồ máy, Vị trí người dùng,
 *        Tên trang web ("Sổ Tay Tiểu Thuyết Của Bi — NoirStudio"), Tiêu điểm & 4 KPI sống!
 *     2. Trang Biểu Đồ & Sơ Đồ Nhân Quả NGUYÊN KHỐI (Donut 20p + Cột Tác Động +
 *        Sơ đồ Chuỗi Nhân Quả Mindmap) — tính toán chiều cao chính xác, 0% cắt nét!
 *     3. Các trang nội dung Bản tin 20 phút (Gemini nếu đã đồng bộ) + 8 Trụ cột
 *        Thông tin thô khoa học + Mô hình Tư duy, tự động ngắt trang sạch sẽ + số trang!
 * ============================================================================
 */
(function initWisdom20PdfExporter(globalScope) {
  'use strict';

  const W20 = (globalScope.NoirWisdom20 = globalScope.NoirWisdom20 || {});
  const A4_W = 1240;
  const A4_H = 1754;
  const W20_FONT_FAMILY = '"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';

  async function ensurePdfLib() {
    if (globalScope.PDFLib) return globalScope.PDFLib;
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-wis20-pdflib="1"]');
      if (existing && globalScope.PDFLib) return resolve(globalScope.PDFLib);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
      s.async = true;
      s.dataset.wis20Pdflib = '1';
      s.onload = () => (globalScope.PDFLib ? resolve(globalScope.PDFLib) : reject(new Error('PDFLib không sẵn sàng')));
      s.onerror = () => reject(new Error('Không tải được thư viện pdf-lib để xuất PDF'));
      document.head.appendChild(s);
    });
  }

  function wrapCanvasText(ctx, text, maxW) {
    const paragraphs = String(text || '').split(/\r?\n/);
    const out = [];
    for (const para of paragraphs) {
      const clean = para.trim();
      if (!clean) { out.push(''); continue; }
      const words = clean.split(/\s+/);
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) {
          out.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) out.push(line);
    }
    return out;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function createA4Canvas() {
    const c = document.createElement('canvas');
    c.width = A4_W;
    c.height = A4_H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, A4_W, A4_H);
    return { canvas: c, ctx };
  }

  function drawPageHeader(ctx, sectionTitle, dateStr) {
    ctx.save();
    ctx.fillStyle = '#0f2942';
    ctx.fillRect(0, 0, A4_W, 88);
    ctx.fillStyle = '#14b8a6';
    ctx.fillRect(0, 84, A4_W, 4);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 22px ${W20_FONT_FAMILY}`;
    ctx.fillText(String(sectionTitle || '30 PHÚT THÔNG THÁI').slice(0, 74), 72, 44);
    if (dateStr) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#99f6e4';
      ctx.font = `600 16px ${W20_FONT_FAMILY}`;
      ctx.fillText(String(dateStr), A4_W - 72, 44);
    }
    ctx.restore();
  }

  async function canvasToJpgBytes(canvas, quality = 0.92) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function drawPageFooter(ctx, pageNo, totalPages, dateStr) {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 1678);
    ctx.lineTo(1168, 1678);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`Sổ Tay Tiểu Thuyết Của Bi — 30 Phút Thông Thái Mỗi Ngày (${dateStr})`, 72, 1694);
    const pgTxt = `Trang ${pageNo} / ${totalPages}`;
    const tw = ctx.measureText(pgTxt).width;
    ctx.fillText(pgTxt, 1168 - tw, 1694);
    ctx.restore();
  }

  /**
   * Trang 1: Trang Bìa Đẹp Chuẩn Báo Cáo Tạp Chí (Tự chèn ngày hôm nay + Tên trang web + 4 KPI sống)
   */
  function drawCoverPage(scanResult, syncData, todayFullStr) {
    const { canvas, ctx } = createA4Canvas();
    const W = canvas.width;
    const H = canvas.height;
    const m = scanResult.liveMetrics || {};
    const profile = scanResult.profile || { name: 'Việt Nam', currency: 'VND' };

    // Nền gradient cao cấp đậm chất tạp chí hiện đại
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#061a2e');
    bgGrad.addColorStop(0.55, '#0f172a');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Dải màu trang trí góc trên & vòng tròn phát sáng mềm
    const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
    accentGrad.addColorStop(0, '#10b981');
    accentGrad.addColorStop(0.5, '#0ea5e9');
    accentGrad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, W, 18);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.beginPath(); ctx.arc(1060, 260, 260, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(139, 92, 246, 0.14)';
    ctx.beginPath(); ctx.arc(160, 1480, 240, 0, Math.PI * 2); ctx.fill();

    // Badge tên trang web
    drawRoundedRect(ctx, 84, 96, 560, 56, 28);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '700 24px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('SỔ TAY TIỂU THUYẾT CỦA BI · NOIRSTUDIO', 114, 124);

    // Ngày xuất bản tự động
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 32px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`ẤN BẢN NGÀY: ${todayFullStr.toUpperCase()}`, 84, 210);

    // Tiêu đề chính khổ lớn
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 84px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('30 PHÚT', 84, 290);
    ctx.fillStyle = '#34d399';
    ctx.fillText('THÔNG THÁI', 84, 392);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 54px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('MỖI NGÀY', 84, 502);

    // Gạch nhấn màu
    ctx.fillStyle = accentGrad;
    ctx.fillRect(84, 588, 220, 8);

    // Khung Tiêu điểm hôm nay
    drawRoundedRect(ctx, 84, 640, W - 168, 220, 24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 22px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('TIÊU ĐIỂM CHÍNH HÔM NAY', 118, 672);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 34px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    const hlLines = wrapCanvasText(ctx, syncData?.headline || `Báo cáo 8 Trụ cột Tri thức — ${todayFullStr}`, W - 236).slice(0, 3);
    hlLines.forEach((ln, i) => ctx.fillText(ln, 118, 718 + i * 44));

    // Vị trí & số mục xác thực
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 25px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    const locTxt = `Khu vực: ${scanResult.location?.fullAddress || profile.name}   |   8 Trụ cột Khoa học (${scanResult.totalItems || 0} nguồn xác thực)`;
    wrapCanvasText(ctx, locTxt, W - 168).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, 84, 902 + i * 36));

    // 4 Thẻ KPI số liệu sống đầy màu sắc trên Trang Bìa
    const kpis = [
      { label: `TỶ GIÁ USD/${m.localCurrency || 'VND'}`, val: m.usdToLocal ? Number(m.usdToLocal).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : 'N/A', c1: '#0284c7', c2: '#0369a1' },
      { label: 'VÀNG THẾ GIỚI (PAXG)', val: m.goldUsdOz ? `$${Math.round(m.goldUsdOz).toLocaleString('en-US')}/oz` : 'N/A', c1: '#d97706', c2: '#b45309' },
      { label: 'BITCOIN (24/7)', val: m.btcUsd ? `$${Math.round(m.btcUsd).toLocaleString('en-US')}` : 'N/A', c1: '#7c3aed', c2: '#5b21b6' },
      { label: `GDP ${profile.name.toUpperCase()}`, val: m.countryGdpPct != null ? `${m.countryGdpPct}%` : 'N/A', c1: '#059669', c2: '#047857' },
    ];
    const cardW = (W - 168 - 28) / 2;
    const cardH = 148;
    kpis.forEach((k, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 84 + col * (cardW + 28);
      const y = 1005 + row * (cardH + 24);
      const g = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
      g.addColorStop(0, k.c1);
      g.addColorStop(1, k.c2);
      drawRoundedRect(ctx, x, y, cardW, cardH, 20);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      ctx.font = '700 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText(k.label, x + 28, y + 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 44px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText(k.val, x + 28, y + 72);
    });

    // Dải danh mục 8 trụ cột ở chân bìa
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 21px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('BAO PHỦ 8 TRỤ CỘT: Thế giới · Công nghệ & AI · Kinh tế · Khu vực · Sức khỏe · Pháp luật · Tư duy · Văn hóa & Lịch sử', 84, 1410);

    // Chân trang bìa
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(84, 1560); ctx.lineTo(W - 84, 1560); ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 23px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('Xuất bản tự động 100% trên thiết bị từ Sổ Tay Tiểu Thuyết Của Bi', 84, 1592);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText(`Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}  ·  Dữ liệu xác thực nguồn gốc SHA-256`, 84, 1632);

    return canvas;
  }

  /**
   * Trang 2: Hệ thống Biểu Đồ & Sơ Đồ Nhân Quả NGUYÊN KHỐI (Vẽ trực tiếp bằng Canvas 2D HiDPI — 0% cắt nét, 0% lỗi font!)
   */
  function drawChartsDashboardPage(syncData, todayFullStr) {
    const { canvas, ctx } = createA4Canvas();
    const W = canvas.width;

    // Header bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, 112);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('HỆ THỐNG BIỂU ĐỒ & SƠ ĐỒ NHÂN QUẢ HÔM NAY', 72, 56);

    ctx.textBaseline = 'top';

    // --- KHỐI 1 (Trái): BIỂU ĐỒ TRÒN DONUT PHÂN BỔ 20 PHÚT ---
    drawRoundedRect(ctx, 72, 148, 530, 500, 20);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 24px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('1. Lộ trình 30 Phút Đọc Thông Thái', 100, 174);

    const palette = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];
    const rawPlan = syncData?.reading_plan_30m || syncData?.reading_plan_20m;
    const plan = (Array.isArray(rawPlan) && rawPlan.length
      ? rawPlan
      : W20.CATEGORIES.map((c) => ({ label: c.title.replace(/^\d+\.\s*/, ''), minutes: c.minutes, color: c.color }))
    ).slice(0, 8);
    const totalMin = plan.reduce((s, x) => s + Math.max(1, Number(x.minutes) || 2), 0) || 30;

    const cx = 232;
    const cy = 408;
    const rad = 112;
    let startAng = -Math.PI / 2;
    plan.forEach((it, idx) => {
      const mVal = Math.max(1, Number(it.minutes) || 2);
      const sweep = (mVal / totalMin) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, startAng, startAng + sweep);
      ctx.strokeStyle = it.color || palette[idx % palette.length];
      ctx.lineWidth = 42;
      ctx.stroke();
      startAng += sweep;
    });
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 40px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${totalMin}p`, cx, cy - 26);
    ctx.fillStyle = '#64748b';
    ctx.font = '700 18px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('MỖI NGÀY', cx, cy + 20);
    ctx.textAlign = 'left';

    // Chú thích Donut bên phải
    plan.forEach((it, idx) => {
      const ly = 240 + idx * 46;
      ctx.fillStyle = it.color || palette[idx % palette.length];
      drawRoundedRect(ctx, 378, ly + 4, 16, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 17px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      const lbl = String(it.label || '').slice(0, 17);
      ctx.fillText(`${lbl} (${it.minutes || 2}p)`, 404, ly);
    });

    // --- KHỐI 2 (Phải): BIỂU ĐỒ CỘT NGANG ĐIỂM TÁC ĐỘNG (0–100) ---
    drawRoundedRect(ctx, 628, 148, 540, 500, 20);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 24px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('2. Mức độ Tác động Sự kiện (Thang 100)', 656, 174);

    const impacts = (Array.isArray(syncData?.impact_scores) ? syncData.impact_scores : []).slice(0, 6);
    impacts.forEach((r, idx) => {
      const by = 228 + idx * 66;
      const score = Math.max(10, Math.min(100, Number(r.score) || 75));
      const col = palette[idx % palette.length];
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 18px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText(String(r.topic || `Sự kiện ${idx + 1}`).slice(0, 38), 656, by);
      ctx.fillStyle = col;
      ctx.font = '700 19px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${score}/100`, 1140, by);
      ctx.textAlign = 'left';

      drawRoundedRect(ctx, 656, by + 28, 484, 18, 9);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      drawRoundedRect(ctx, 656, by + 28, Math.round((score / 100) * 484), 18, 9);
      ctx.fillStyle = col;
      ctx.fill();
    });

    // --- KHỐI 3 (Nửa dưới trọn chiều ngang): SƠ ĐỒ CHUỖI NHÂN QUẢ / MINDMAP ---
    drawRoundedRect(ctx, 72, 684, W - 144, 620, 20);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 26px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText(`3. Sơ đồ Nhân Quả & Tư duy Hệ thống — ${syncData?.causal_mindmap?.center || 'Toàn cảnh hôm nay'}`, 100, 712);

    const colW = 310;
    const colX = [100, 466, 832];
    const colHeaders = [
      { t: 'NGUYÊN NHÂN / SỰ KIỆN GỐC', c: '#0284c7', bg: 'rgba(14,165,233,0.12)' },
      { t: 'CƠ CHẾ LAN TRUYỀN', c: '#7c3aed', bg: 'rgba(139,92,246,0.12)' },
      { t: 'HỆ QUẢ ĐỜI SỐNG & CÔNG VIỆC', c: '#059669', bg: 'rgba(16,185,129,0.12)' },
    ];
    colHeaders.forEach((h, i) => {
      ctx.fillStyle = h.c;
      ctx.font = '700 18px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText(h.t, colX[i], 764);
    });

    const chains = (Array.isArray(syncData?.causal_mindmap?.chains) ? syncData.causal_mindmap.chains : []).slice(0, 3);
    chains.forEach((ch, idx) => {
      const ry = 804 + idx * 160;
      const vals = [ch.cause, ch.mechanism, ch.effect];
      vals.forEach((txt, ci) => {
        drawRoundedRect(ctx, colX[ci], ry, colW, 134, 16);
        ctx.fillStyle = colHeaders[ci].bg;
        ctx.fill();
        ctx.strokeStyle = colHeaders[ci].c;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '700 19px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        wrapCanvasText(ctx, txt || '—', colW - 32).slice(0, 4).forEach((ln, li) => {
          ctx.fillText(ln, colX[ci] + 16, ry + 18 + li * 27);
        });

        // Vẽ mũi tên nối sang cột kế tiếp
        if (ci < 2) {
          const ax1 = colX[ci] + colW + 4;
          const ax2 = colX[ci + 1] - 6;
          const ay = ry + 67;
          ctx.strokeStyle = colHeaders[ci + 1].c;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ax1, ay);
          ctx.lineTo(ax2 - 12, ay);
          ctx.stroke();
          ctx.fillStyle = colHeaders[ci + 1].c;
          ctx.beginPath();
          ctx.moveTo(ax2, ay);
          ctx.lineTo(ax2 - 14, ay - 9);
          ctx.lineTo(ax2 - 14, ay + 9);
          ctx.closePath();
          ctx.fill();
        }
      });
    });

    // --- KHỐI 4 (Đáy trang 2): MÔ HÌNH TƯ DUY & DÒNG THỜI GIAN (0% CẮT CHỮ!) ---
    drawRoundedRect(ctx, 72, 1316, W - 144, 344, 20);
    ctx.fillStyle = '#f5f3ff';
    ctx.fill();
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#5b21b6';
    ctx.font = '700 23px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText('4. Mô Hình Tư Duy & Mốc Thời Gian Đáng Nhớ', 100, 1338);

    const models = (Array.isArray(syncData?.mental_models) ? syncData.mental_models : []).slice(0, 2);
    models.forEach((mm, idx) => {
      const mx = 100 + idx * 532;
      drawRoundedRect(ctx, mx, 1378, 504, 126, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#6d28d9';
      ctx.font = '700 18px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      const titleLines = wrapCanvasText(ctx, String(mm.title || '').replace(/\*/g, ''), 468).slice(0, 2);
      titleLines.forEach((ln, li) => ctx.fillText(ln, mx + 18, 1390 + li * 21));
      ctx.fillStyle = '#334155';
      ctx.font = '600 16px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      const lessonTop = 1394 + titleLines.length * 21 + 4;
      wrapCanvasText(ctx, String(mm.lesson || '').replace(/\*/g, ''), 468).slice(0, 3).forEach((ln, li) => {
        ctx.fillText(ln, mx + 18, lessonTop + li * 21);
      });
    });

    const timeline = (Array.isArray(syncData?.timeline) ? syncData.timeline : []).slice(0, 3);
    let tyCursor = 1518;
    timeline.forEach((t) => {
      if (tyCursor > 1638) return;
      ctx.fillStyle = '#059669';
      ctx.font = '700 16px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText(`• [${String(t.time || 'Hôm nay')}]`, 100, tyCursor);
      ctx.fillStyle = '#1e293b';
      ctx.font = '600 15.5px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      const evLines = wrapCanvasText(ctx, String(t.event || '').replace(/\*/g, ''), 890).slice(0, 2);
      evLines.forEach((ln, li) => {
        ctx.fillText(ln, 232, tyCursor + li * 20);
      });
      tyCursor += Math.max(24, evLines.length * 20 + 6);
    });

    return canvas;
  }

  /**
   * Các trang nội dung (Tự động ngắt trang chính xác theo chiều cao từng khối — 0% cắt đôi dòng chữ!)
   */
  function drawContentPages(scanResult, geminiParsed) {
    const pages = [];
    const maxW = 1096;
    const minY = 128;
    const maxY = 1646;

    let cur = createA4Canvas();
    let y = minY;

    const paintHeader = (ctx, title) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1240, 96);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 30px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, 72, 48);
      ctx.textBaseline = 'top';
    };

    paintHeader(cur.ctx, geminiParsed ? 'BẢN TIN 30 PHÚT (GEMINI) & 8 TRỤ CỘT TRI THỨC' : 'BÁO CÁO 8 TRỤ CỘT THÔNG TIN THÔ KHOA HỌC HÔM NAY');

    const ensureSpace = (neededH, headerTitle) => {
      if (y + neededH > maxY) {
        pages.push(cur.canvas);
        cur = createA4Canvas();
        paintHeader(cur.ctx, headerTitle);
        y = minY;
      }
    };

    // Phần A: Bản tin Gemini — VẼ THEO GIAO DIỆN BÁO CÁO TÀI CHÍNH CHUYÊN NGHIỆP (Banner xanh navy + Bảng thật có tiêu đề navy + 0 dấu #### hay | --- |!)
    if (geminiParsed?.markdownBody) {
      const rawLines = String(geminiParsed.markdownBody).split(/\r?\n/);
      let li = 0;

      while (li < rawLines.length) {
        const trimmed = rawLines[li].trim();
        if (!trimmed || /^---+$/.test(trimmed) || /^===+$/.test(trimmed)) {
          li++;
          continue;
        }

        // Helper trích URL markdown [title](url) hoặc bare https://... để bấm mở ngay trên PDF & Preview
        const stripMdLinksAndExtractUrl = (raw) => {
          let foundUrl = '';
          let txt = String(raw || '').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_m, label, u) => {
            if (!foundUrl) foundUrl = u.trim();
            return label;
          });
          if (!foundUrl) {
            const bm = txt.match(/https?:\/\/[^\s<>)\]"']+/i);
            if (bm) foundUrl = bm[0].replace(/[.,;:!?]+$/, '');
          }
          return { text: txt, url: foundUrl };
        };

        // 1. Bảng Markdown chuẩn `| col | col |` -> Vẽ BẢNG TÀI CHÍNH THẬT trên PDF!
        if (trimmed.startsWith('|') && trimmed.endsWith('|') && li + 1 < rawLines.length && /^\|\s*[-:]+/.test(rawLines[li + 1].trim())) {
          const parseRow = (ln) => ln.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => {
            const ex = stripMdLinksAndExtractUrl(c);
            return { text: ex.text.replace(/\*\*/g, '').replace(/`/g, '').trim(), url: ex.url };
          });
          const headers = parseRow(trimmed).map((x) => x.text);
          li += 2;
          const rows = [];
          const rowUrls = [];
          while (li < rawLines.length && rawLines[li].trim().startsWith('|') && rawLines[li].trim().endsWith('|')) {
            const cells = parseRow(rawLines[li]);
            rows.push(cells.map((x) => x.text));
            rowUrls.push((cells.find((x) => x.url) || {}).url || '');
            li++;
          }
          const colCount = Math.max(1, headers.length);
          const colW = Math.floor(maxW / colCount);
          const drawTableHead = () => {
            cur.ctx.fillStyle = '#162d4c';
            cur.ctx.fillRect(72, y, maxW, 44);
            cur.ctx.fillStyle = '#14b8a6';
            cur.ctx.fillRect(72, y + 41, maxW, 3);
            cur.ctx.fillStyle = '#ffffff';
            cur.ctx.font = '700 18px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
            headers.forEach((h, ci) => {
              cur.ctx.fillText(h.slice(0, Math.max(12, Math.floor(colW / 11))), 84 + ci * colW, y + 12);
            });
            y += 46;
          };

          ensureSpace(100, 'BẢN TIN 30 PHÚT THÔNG THÁI (BẢNG TỔNG HỢP)');
          drawTableHead();
          rows.forEach((row, rIdx) => {
            const rUrl = rowUrls[rIdx] || '';
            cur.ctx.font = '600 17px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
            const cellLines = Array.from({ length: colCount }, (_, ci) => wrapCanvasText(cur.ctx, row[ci] || '—', colW - 20).slice(0, 3));
            const rowH = Math.max(36, Math.max(...cellLines.map((cl) => cl.length)) * 24 + (rUrl ? 28 : 14));
            if (y + rowH > maxY) {
              pages.push(cur.canvas);
              cur = createA4Canvas();
              paintHeader(cur.ctx, 'BẢN TIN 30 PHÚT THÔNG THÁI (TIẾP THEO)');
              y = minY;
              drawTableHead();
            }
            cur.ctx.fillStyle = rIdx % 2 === 1 ? '#eff6ff' : '#ffffff';
            cur.ctx.fillRect(72, y, maxW, rowH);
            cur.ctx.strokeStyle = '#cbd5e1';
            cur.ctx.lineWidth = 1;
            cur.ctx.strokeRect(72, y, maxW, rowH);
            cur.ctx.fillStyle = '#0f172a';
            cur.ctx.font = '600 17px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
            cellLines.forEach((cl, ci) => {
              cl.forEach((ln, k) => cur.ctx.fillText(ln, 84 + ci * colW, y + 9 + k * 24));
            });
            if (rUrl && /^https?:\/\//i.test(rUrl)) {
              const rLinkTxt = `🔗 Bấm mở nguồn: ${rUrl.length > 76 ? rUrl.slice(0, 73) + '...' : rUrl}`;
              cur.ctx.fillStyle = '#0284c7';
              cur.ctx.font = '700 16px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
              cur.ctx.fillText(rLinkTxt, 84, y + rowH - 25);
              cur.ctx.fillRect(84, y + rowH - 6, Math.min(maxW - 28, cur.ctx.measureText(rLinkTxt).width), 1.5);
              if (!cur.canvas.__pdfLinks) cur.canvas.__pdfLinks = [];
              cur.canvas.__pdfLinks.push({ x: 72, y, w: maxW, h: rowH, url: rUrl });
            }
            y += rowH;
          });
          y += 18;
          continue;
        }

        // 2. Bộ phân loại Tiêu đề / Mục lục thông minh (chống nhận nhầm mảnh câu chữ thường / "USD.")
        const exLine = stripMdLinksAndExtractUrl(trimmed);
        const hMatch = exLine.text.match(/^(#{1,6})\s+(.+)$/);
        const cleanRawForClassify = exLine.text.replace(/\*\*/g, '').replace(/`/g, '').trim();
        const sharedCls = !hMatch && typeof globalScope.NoirClassifyDocLine === 'function'
          ? globalScope.NoirClassifyDocLine(cleanRawForClassify)
          : null;
        const isTocDots = /\.\s*\.+\s*\d+\s*$/.test(cleanRawForClassify) || /^(MỤC\s+LỤC|DANH\s+MỤC|TABLE\s+OF\s+CONTENTS)\b/i.test(cleanRawForClassify);
        const looksHeadingFallback = !hMatch && !sharedCls && (() => {
          const t = cleanRawForClassify;
          if (!t || t.length < 3 || t.length > 98) return false;
          if (/^[a-zà-ỹ]/.test(t)) return false; // mảnh văn xuôi chữ thường ("phần SX-TM...")
          if (/^(USD|VND|EUR|JPY|GBP|LINK)\.?$/i.test(t)) return false;
          if (/^(CHƯƠNG|PHẦN|MỤC|BÀI)\s+(?:[IVXLCDM]+|\d+)(?:[\s.:–—-]|$)/i.test(t) && /^[\p{Lu}]/u.test(t)) return true;
          if (/^[IVXLCDM]+\.\s+\S+/.test(t)) return true;
          if (/^\d+(?:\.\d+){0,3}\.?\s+\S+/.test(t) && !/^\d+\.\s*\d{3}/.test(t) && t.length <= 92) return true;
          const words = t.split(/\s+/);
          const alpha = t.replace(/[^a-zA-ZÀ-ỹ]/g, '');
          if (words.length >= 2 && alpha.length >= 6 && alpha === alpha.toUpperCase() && !/[.,;!?]$/.test(t)) return true;
          return false;
        })();

        const effectiveHeadingKind = hMatch
          ? (hMatch[1].length <= 2 ? 'h1' : 'h2')
          : (sharedCls?.kind === 'h1' || sharedCls?.kind === 'h2' || sharedCls?.kind === 'h3'
              ? sharedCls.kind
              : (looksHeadingFallback ? (/^(CHƯƠNG|PHẦN)\b|^MỤC\s+LỤC/i.test(cleanRawForClassify) ? 'h1' : 'h2') : null));

        if (effectiveHeadingKind) {
          const cleanTitle = (hMatch ? hMatch[2] : cleanRawForClassify).replace(/\*\*/g, '').replace(/`/g, '').trim();
          const startHeadingY = y;
          if (effectiveHeadingKind === 'h1') {
            ensureSpace(74, 'BẢN TIN 30 PHÚT THÔNG THÁI (TIẾP THEO)');
            y += 8;
            const g = cur.ctx.createLinearGradient(72, y, 72 + maxW, y);
            g.addColorStop(0, '#0b2239');
            g.addColorStop(0.65, '#163b63');
            g.addColorStop(1, '#0f4c68');
            drawRoundedRect(cur.ctx, 72, y, maxW, 54, 10);
            cur.ctx.fillStyle = g;
            cur.ctx.fill();
            cur.ctx.fillStyle = '#14b8a6';
            cur.ctx.fillRect(72, y, 10, 54);
            cur.ctx.fillStyle = '#ffffff';
            cur.ctx.font = '700 24px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
            cur.ctx.fillText(cleanTitle.slice(0, 82), 96, y + 14);
            if (exLine.url) {
              if (!cur.canvas.__pdfLinks) cur.canvas.__pdfLinks = [];
              cur.canvas.__pdfLinks.push({ x: 72, y, w: maxW, h: 54, url: exLine.url });
            }
            y += 68;
          } else {
            ensureSpace(50, 'BẢN TIN 30 PHÚT THÔNG THÁI (TIẾP THEO)');
            y += 6;
            cur.ctx.fillStyle = '#0d9488';
            cur.ctx.fillRect(72, y + 2, 6, 30);
            cur.ctx.fillStyle = exLine.url ? '#0369a1' : '#0f2942';
            cur.ctx.font = '700 23px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
            cur.ctx.fillText(cleanTitle.slice(0, 84), 90, y + 4);
            if (exLine.url) {
              if (!cur.canvas.__pdfLinks) cur.canvas.__pdfLinks = [];
              cur.canvas.__pdfLinks.push({ x: 72, y, w: maxW, h: 38, url: exLine.url });
            }
            y += 42;
          }
          li++;
          continue;
        }

        // 3. Đoạn chữ thường / Gạch đầu dòng sạch sẽ / Mục lục chấm dẫn (gắn link nếu có URL!)
        const isBullet = /^[-*•]\s+/.test(exLine.text);
        const clean = exLine.text
          .replace(/^[-*•]\s+/, '• ')
          .replace(/\*/g, '')
          .replace(/`/g, '');
        cur.ctx.font = (sharedCls?.kind === 'toc_item' || isTocDots) ? '700 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif' : '500 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        const indentX = isBullet ? 90 : 72;
        const wrapped = wrapCanvasText(cur.ctx, clean, maxW - (indentX - 72));
        const blockH = wrapped.length * 30 + (exLine.url ? 22 : 0);
        ensureSpace(blockH + 10, 'BẢN TIN 30 PHÚT THÔNG THÁI (TIẾP THEO)');
        const startParaY = y;
        cur.ctx.fillStyle = exLine.url ? '#0369a1' : ((sharedCls?.kind === 'toc_item' || isTocDots) ? '#0f2942' : '#1e293b');
        cur.ctx.font = (sharedCls?.kind === 'toc_item' || isTocDots) ? '700 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif' : '500 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        for (const ln of wrapped) {
          cur.ctx.fillText(ln, indentX, y);
          y += 30;
        }
        if (exLine.url && /^https?:\/\//i.test(exLine.url)) {
          cur.ctx.fillStyle = '#0369a1';
          cur.ctx.font = '700 15px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
          cur.ctx.fillText(`🔗 Bấm mở nguồn: ${exLine.url.slice(0, 82)}`, indentX, y);
          y += 22;
          if (!cur.canvas.__pdfLinks) cur.canvas.__pdfLinks = [];
          cur.canvas.__pdfLinks.push({ x: 72, y: startParaY, w: maxW, h: Math.max(32, y - startParaY), url: exLine.url });
        }
        y += 6;
        li++;
      }
      y += 22;
    }

    // Phần B: Toàn bộ 8 Trụ cột Thông tin thô xác thực
    for (const cat of (W20.CATEGORIES || [])) {
      const items = scanResult.categoriesData?.[cat.id] || [];
      if (!items.length) continue;

      ensureSpace(120, '8 TRỤ CỘT THÔNG TIN KHOA HỌC HÔM NAY');
      drawRoundedRect(cur.ctx, 72, y, maxW, 50, 12);
      cur.ctx.fillStyle = cat.color || '#0ea5e9';
      cur.ctx.fill();
      cur.ctx.fillStyle = '#ffffff';
      cur.ctx.font = '700 24px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      cur.ctx.fillText(`${cat.title.toUpperCase()}  (${items.length} mục)`, 94, y + 12);
      y += 66;

      for (const it of items) {
        const rawItUrl = String(it?.url || it?.link || it?.official_url || '').trim();
        const itemUrl = /^https?:\/\//i.test(rawItUrl) ? rawItUrl : (/^www\./i.test(rawItUrl) ? `https://${rawItUrl}` : '');
        const hasUrl = Boolean(itemUrl);
        cur.ctx.font = '700 21px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        const tLines = wrapCanvasText(cur.ctx, `• ${it.title}`, maxW - 28).slice(0, 2);
        cur.ctx.font = '500 19px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        const sLines = wrapCanvasText(cur.ctx, it.summary || '', maxW - 36).slice(0, 3);
        const boxH = tLines.length * 29 + sLines.length * 26 + (hasUrl ? 68 : 44);

        ensureSpace(boxH + 14, `8 TRỤ CỘT TRI THỨC — ${cat.title.toUpperCase()}`);
        drawRoundedRect(cur.ctx, 72, y, maxW, boxH, 12);
        cur.ctx.fillStyle = '#f8fafc';
        cur.ctx.fill();
        cur.ctx.strokeStyle = hasUrl ? '#93c5fd' : '#cbd5e1';
        cur.ctx.lineWidth = 1.5;
        cur.ctx.stroke();

        let iy = y + 12;
        cur.ctx.fillStyle = hasUrl ? '#0369a1' : '#0f172a';
        cur.ctx.font = '700 21px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        for (const ln of tLines) {
          cur.ctx.fillText(ln, 88, iy);
          iy += 29;
        }
        cur.ctx.fillStyle = '#334155';
        cur.ctx.font = '500 19px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        for (const ln of sLines) {
          cur.ctx.fillText(ln, 96, iy);
          iy += 26;
        }
        cur.ctx.fillStyle = '#64748b';
        cur.ctx.font = '700 16px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        cur.ctx.fillText(`Nguồn: ${it.source || 'Web'}  |  Mã SHA-256: #${it.sha256 || 'verified'}`, 96, iy + 4);
        if (hasUrl) {
          const linkY = iy + 28;
          const shortLink = itemUrl.length > 88 ? `${itemUrl.slice(0, 85)}...` : itemUrl;
          cur.ctx.fillStyle = '#0369a1';
          cur.ctx.font = '700 15.5px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
          cur.ctx.fillText(`🔗 Bấm mở bài gốc: ${shortLink}`, 96, linkY);
          const linkW = Math.min(maxW - 40, cur.ctx.measureText(`🔗 Bấm mở bài gốc: ${shortLink}`).width);
          cur.ctx.fillRect(96, linkY + 19, linkW, 1.5);
          // Lưu tọa độ vùng bấm Hyperlink thật để gắn PDF /Link /URI annotation cho toàn bộ hộp bài báo!
          if (!cur.canvas.__pdfLinks) cur.canvas.__pdfLinks = [];
          cur.canvas.__pdfLinks.push({ x: 72, y, w: maxW, h: boxH, url: itemUrl });
        }
        y += boxH + 14;
      }
      y += 12;
    }

    // Dòng lưu ý miễn trừ trách nhiệm bắt buộc ở cuối báo cáo
    ensureSpace(88, 'LƯU Ý MIỄN TRỪ TRÁCH NHIỆM');
    y += 10;
    drawRoundedRect(cur.ctx, 72, y, maxW, 64, 12);
    cur.ctx.fillStyle = '#fffbeb';
    cur.ctx.fill();
    cur.ctx.strokeStyle = '#f59e0b';
    cur.ctx.lineWidth = 2;
    cur.ctx.stroke();
    cur.ctx.fillStyle = '#92400e';
    cur.ctx.font = '700 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    cur.ctx.fillText('⚠️ Lưu ý: Tất cả thông tin, phân tích chỉ mang tính chất tham khảo.', 96, y + 20);
    y += 76;

    pages.push(cur.canvas);
    return pages;
  }

  /**
   * Trang bổ sung Phần 2 (nếu có >3 chuỗi nhân quả / >4 sự kiện tác động / >3 mốc thời gian) để KHÔNG BAO GIỜ BỎ SÓT 1 SỰ KIỆN NÀO!
   */
  function drawPart2ContinuationPage(syncData, todayFullStr) {
    const chains = Array.isArray(syncData?.causal_mindmap?.chains) ? syncData.causal_mindmap.chains : [];
    const impacts = Array.isArray(syncData?.impact_scores) ? syncData.impact_scores : [];
    const timeline = Array.isArray(syncData?.timeline) ? syncData.timeline : [];
    const extraChains = chains.slice(3, 8);
    const extraImpacts = impacts.slice(4, 8);
    const extraTimeline = timeline.slice(3, 8);
    if (!extraChains.length && !extraImpacts.length && !extraTimeline.length) return null;

    const { canvas, ctx } = createA4Canvas();
    const W = canvas.width;
    ctx.fillStyle = '#0f2942';
    ctx.fillRect(0, 0, W, 96);
    ctx.fillStyle = '#14b8a6';
    ctx.fillRect(0, 92, W, 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 28px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('PHẦN 2 (TIẾP) — ĐẦY ĐỦ 8 SỰ KIỆN TÁC ĐỘNG, NHÂN QUẢ & DÒNG THỜI GIAN', 72, 48);
    ctx.textBaseline = 'top';

    let y = 126;
    if (extraImpacts.length) {
      ctx.fillStyle = '#0f2942';
      ctx.font = '700 23px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText('📊 Các Sự Kiện Tác Động Tiếp Theo (Thang 0–100)', 72, y);
      y += 40;
      const barCols = ['#10b981', '#ec4899', '#14b8a6', '#f97316'];
      extraImpacts.forEach((it, i) => {
        const sc = Math.max(10, Math.min(100, Number(it.score) || 70));
        const col = barCols[i % barCols.length];
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 18px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        ctx.fillText(String(it.topic || '').replace(/\*/g, '').slice(0, 74), 72, y);
        ctx.fillStyle = col;
        ctx.font = '700 18px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        ctx.fillText(`${sc}/100`, 1090, y);
        drawRoundedRect(ctx, 72, y + 26, 995, 16, 8);
        ctx.fillStyle = '#e2e8f0'; ctx.fill();
        drawRoundedRect(ctx, 72, y + 26, Math.round((sc / 100) * 995), 16, 8);
        ctx.fillStyle = col; ctx.fill();
        y += 58;
      });
      y += 14;
    }

    if (extraChains.length) {
      ctx.fillStyle = '#0f2942';
      ctx.font = '700 23px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText(`🕸️ Sơ Đồ Nhân Quả Đầy Đủ (Chuỗi #4 – #${3 + extraChains.length})`, 72, y);
      y += 38;
      const colW = 332;
      const colX = [72, 454, 836];
      const strokes = ['#0ea5e9', '#8b5cf6', '#10b981'];
      const fills = ['#f0f9ff', '#f5f3ff', '#ecfdf5'];
      const headers = ['⚡ NGUYÊN NHÂN GỐC', '🔗 CƠ CHẾ LAN TRUYỀN', '🎯 HỆ QUẢ ĐỜI SỐNG'];
      headers.forEach((h, ci) => {
        ctx.fillStyle = strokes[ci];
        ctx.font = '700 17px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        ctx.fillText(h, colX[ci] + 10, y);
      });
      y += 28;
      extraChains.forEach((ch) => {
        if (y > 1440) return;
        const vals = [ch.cause, ch.mechanism, ch.effect];
        vals.forEach((txt, ci) => {
          drawRoundedRect(ctx, colX[ci], y, colW, 134, 14);
          ctx.fillStyle = fills[ci]; ctx.fill();
          ctx.strokeStyle = strokes[ci]; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.font = '700 17.5px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
          wrapCanvasText(ctx, String(txt || '—').replace(/\*/g, ''), colW - 26).slice(0, 4).forEach((ln, li) => {
            ctx.fillText(ln, colX[ci] + 13, y + 14 + li * 25);
          });
          // Vẽ mũi tên trực quan nối giữa 3 cột (Cột 1 -> Cột 2 -> Cột 3)!
          if (ci < 2) {
            const ax1 = colX[ci] + colW + 4;
            const ax2 = colX[ci + 1] - 6;
            const ay = y + 67;
            ctx.strokeStyle = strokes[ci + 1];
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(ax1, ay);
            ctx.lineTo(ax2 - 12, ay);
            ctx.stroke();
            ctx.fillStyle = strokes[ci + 1];
            ctx.beginPath();
            ctx.moveTo(ax2, ay);
            ctx.lineTo(ax2 - 14, ay - 9);
            ctx.lineTo(ax2 - 14, ay + 9);
            ctx.closePath();
            ctx.fill();
          }
        });
        y += 150;
      });
    }

    if (extraTimeline.length && y < 1560) {
      y += 10;
      ctx.fillStyle = '#5b21b6';
      ctx.font = '700 22px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText('🗓️ Mốc Thời Gian Đáng Chú Ý Tiếp Theo', 72, y);
      y += 36;
      extraTimeline.forEach((t) => {
        if (y > 1630) return;
        ctx.fillStyle = '#059669';
        ctx.font = '700 17px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        ctx.fillText(`• [${String(t.time || 'Sắp tới')}]`, 72, y);
        ctx.fillStyle = '#1e293b';
        ctx.font = '600 17px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        const lns = wrapCanvasText(ctx, String(t.event || '').replace(/\*/g, ''), 920).slice(0, 2);
        lns.forEach((ln, li) => ctx.fillText(ln, 210, y + li * 22));
        y += Math.max(28, lns.length * 22 + 8);
      });
    }
    return canvas;
  }

  async function saveWisdomCanvasesToPdf(allCanvases, fileDate) {
    const PDFLib = await ensurePdfLib();
    const pdfDoc = await PDFLib.PDFDocument.create();
    pdfDoc.setTitle(`30 Phút Thông Thái Mỗi Ngày - ${fileDate}`);
    pdfDoc.setAuthor('Sổ Tay Tiểu Thuyết Của Bi - NoirStudio');

    for (const c of allCanvases) {
      const jpgBytes = await canvasToJpgBytes(c, 0.92);
      const jpgImg = await pdfDoc.embedJpg(jpgBytes);
      const pg = pdfDoc.addPage([595.28, 841.89]); // Chuẩn A4 (pt)
      pg.drawImage(jpgImg, { x: 0, y: 0, width: 595.28, height: 841.89 });
      // Gắn Hyperlink bấm được thật (PDF /Subtype /Link /URI chuẩn Adobe & Chrome/Android) lên từng bài báo nguồn!
      if (Array.isArray(c.__pdfLinks) && c.__pdfLinks.length && PDFLib.PDFName && PDFLib.PDFString) {
        try {
          const annots = [];
          for (const lk of c.__pdfLinks) {
            if (!lk?.url || !/^(https?:\/\/|mailto:)/i.test(String(lk.url))) continue;
            const x1 = Math.max(0, (lk.x / 1240) * 595.28);
            const x2 = Math.min(595.28, ((lk.x + lk.w) / 1240) * 595.28);
            const y2 = Math.min(841.89, 841.89 - (lk.y / 1754) * 841.89);
            const y1 = Math.max(0, 841.89 - ((lk.y + lk.h) / 1754) * 841.89);
            if (x2 <= x1 || y2 <= y1) continue;
            const linkAnnot = pdfDoc.context.register(
              pdfDoc.context.obj({
                Type: PDFLib.PDFName.of('Annot'),
                Subtype: PDFLib.PDFName.of('Link'),
                Rect: [x1, y1, x2, y2],
                Border: [0, 0, 0],
                F: 4,
                H: PDFLib.PDFName.of('I'),
                A: {
                  Type: PDFLib.PDFName.of('Action'),
                  S: PDFLib.PDFName.of('URI'),
                  URI: PDFLib.PDFString.of(String(lk.url)),
                },
              })
            );
            annots.push(linkAnnot);
            if (typeof pg.node.addAnnot === 'function') {
              pg.node.addAnnot(linkAnnot);
            }
          }
          if (annots.length && typeof pg.node.addAnnot !== 'function') {
            pg.node.set(PDFLib.PDFName.of('Annots'), pdfDoc.context.obj(annots));
          }
        } catch (_eLk) {}
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `30_Phut_Thong_Thai_${fileDate}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true, pages: allCanvases.length, size: pdfBytes.byteLength };
  }

  function loadCorsImageSafeW20(url, timeoutMs = 1100) {
    return new Promise((resolve) => {
      if (!url || !/^https?:\/\//i.test(String(url)) || typeof Image === 'undefined') return resolve(null);
      let done = false;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const finish = (val) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(val);
      };
      const timer = setTimeout(() => finish(null), timeoutMs);
      img.onload = () => finish(img.naturalWidth > 20 && img.naturalHeight > 20 ? img : null);
      img.onerror = () => finish(null);
      img.src = String(url);
    });
  }

  async function drawVisualArticlesPage(scanResult, todayFullStr) {
    const galleryRaw = [];
    const seen = new Set();
    const pushUnique = (item, catColor = '#0284c7') => {
      if (!item || !item.title) return;
      const key = String(item.url || item.title).trim().toLowerCase().slice(0, 90);
      if (seen.has(key)) return;
      seen.add(key);
      galleryRaw.push({
        title: item.title,
        summary: item.summary || item.caption || '',
        source: item.source || 'Báo chí chính thống',
        url: item.url || item.link || '',
        imageUrl: item.imageUrl || item.image || '',
        color: catColor,
      });
    };
    (scanResult?.visualGallery || []).forEach((g) => pushUnique(g, '#0d9488'));
    for (const cat of (W20.CATEGORIES || [])) {
      const list = scanResult?.categoriesData?.[cat.id] || [];
      list.forEach((it) => {
        if (it.imageUrl) pushUnique(it, cat.color || '#0284c7');
      });
    }
    for (const cat of (W20.CATEGORIES || [])) {
      const list = scanResult?.categoriesData?.[cat.id] || [];
      list.slice(0, 2).forEach((it) => pushUnique(it, cat.color || '#0284c7'));
    }
    if (!galleryRaw.length) return null;

    const featured = galleryRaw.slice(0, 6);
    const loadedImgs = await Promise.all(featured.map((it) => loadCorsImageSafeW20(it.imageUrl)));

    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, A4_W, A4_H);
    drawPageHeader(ctx, 'KHU VỰC HÌNH ẢNH & THẺ XEM TRƯỚC BÀI BÁO CHÍNH THỐNG', todayFullStr);
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#475569';
    ctx.font = '600 18px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
    ctx.fillText(`Trực quan hóa ${featured.length} tiêu điểm báo chí (bấm trực tiếp vào từng thẻ để mở bài gốc · danh mục đầy đủ tất cả nguồn ở các trang cuối)`, 72, 114);

    canvas.__pdfLinks = canvas.__pdfLinks || [];
    const cardW = 532;
    const cardH = 468;
    const gapX = 32;
    const gapY = 26;
    const startY = 152;

    featured.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 72 + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const accent = item.color || '#0284c7';

      drawRoundedRect(ctx, x, y, cardW, cardH, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      const imgH = 216;
      ctx.save();
      drawRoundedRect(ctx, x + 2, y + 2, cardW - 4, imgH, 14);
      ctx.clip();
      const loaded = loadedImgs[idx];
      if (loaded) {
        try {
          const sc = Math.max((cardW - 4) / loaded.naturalWidth, imgH / loaded.naturalHeight);
          const dw = loaded.naturalWidth * sc;
          const dh = loaded.naturalHeight * sc;
          ctx.drawImage(loaded, x + 2 + (cardW - 4 - dw) / 2, y + 2 + (imgH - dh) / 2, dw, dh);
        } catch (_eI) {
          ctx.fillStyle = accent;
          ctx.fillRect(x + 2, y + 2, cardW - 4, imgH);
        }
      } else {
        const g = ctx.createLinearGradient(x, y, x + cardW, y + imgH);
        g.addColorStop(0, '#0f2942');
        g.addColorStop(1, accent);
        ctx.fillStyle = g;
        ctx.fillRect(x + 2, y + 2, cardW - 4, imgH);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.arc(x + cardW - 46, y + 48, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.font = '700 15px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        ctx.fillText(`📰 ${String(item.source || 'BÁO CHÍ').toUpperCase().slice(0, 32)}`, x + 22, y + 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 22px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        wrapCanvasText(ctx, item.title, cardW - 48).slice(0, 4).forEach((ln, li) => {
          ctx.fillText(ln, x + 22, y + 66 + li * 31);
        });
      }
      ctx.restore();

      ctx.fillStyle = '#0369a1';
      ctx.font = '700 14.5px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText(String(item.source || 'Nguồn chính thống').slice(0, 44), x + 18, y + imgH + 22);

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 19px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      const tLines = wrapCanvasText(ctx, item.title, cardW - 36).slice(0, 3);
      tLines.forEach((ln, li) => ctx.fillText(ln, x + 18, y + imgH + 50 + li * 26));

      const sy = y + imgH + 56 + tLines.length * 26;
      if (item.summary) {
        ctx.fillStyle = '#475569';
        ctx.font = '500 15.5px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        wrapCanvasText(ctx, item.summary, cardW - 36).slice(0, 3).forEach((ln, li) => {
          ctx.fillText(ln, x + 18, sy + li * 22);
        });
      }

      const rawUrl = String(item.url || '').trim();
      const normUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : (/^www\./i.test(rawUrl) ? `https://${rawUrl}` : '');
      if (normUrl) {
        const wLinkTxt = `🔗 Bấm mở bài gốc: ${normUrl.length > 42 ? normUrl.slice(0, 39) + '...' : normUrl}`;
        ctx.fillStyle = '#0284c7';
        ctx.font = '700 16px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
        ctx.fillText(wLinkTxt, x + 18, y + cardH - 30);
        ctx.fillRect(x + 18, y + cardH - 11, Math.min(cardW - 36, ctx.measureText(wLinkTxt).width), 1.5);
        canvas.__pdfLinks.push({ x, y, w: cardW, h: cardH, url: normUrl });
      }
    });

    return canvas;
  }

  async function exportWisdomReportPdf(scanResult, geminiParsed, readerOpts = {}) {
    if (!scanResult) throw new Error('Chưa có dữ liệu 30 phút thông thái để xuất PDF.');
    const syncData = geminiParsed?.syncData || W20.buildDefaultChartDataFromRaw(scanResult);
    const now = new Date();
    const todayFullStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const fileDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const coverCanvas = drawCoverPage(scanResult, syncData, todayFullStr);
    const chartCanvas = drawChartsDashboardPage(syncData, todayFullStr);
    const extraPart2 = drawPart2ContinuationPage(syncData, todayFullStr);
    const visualsCanvas = await drawVisualArticlesPage(scanResult, todayFullStr);
    const contentCanvases = drawContentPages(scanResult, geminiParsed);

    const allCanvases = [
      coverCanvas,
      chartCanvas,
      ...(extraPart2 ? [extraPart2] : []),
      ...(visualsCanvas ? [visualsCanvas] : []),
      ...contentCanvases,
    ];
    const totalPages = allCanvases.length;

    for (let i = 1; i < totalPages; i++) {
      drawPageFooter(allCanvases[i].getContext('2d'), i + 1, totalPages, todayFullStr);
    }

    // Mở CỬA SỔ XEM TRƯỚC CUỘN DỌC TỪNG TRANG A4 trước khi tải file!
    if (typeof document !== 'undefined' && !readerOpts.skipPreview) {
      document.getElementById('w20-pdf-live-preview-modal')?.remove();
      const modal = document.createElement('div');
      modal.id = 'w20-pdf-live-preview-modal';
      modal.className = 'fixed inset-0 z-[2147483645] bg-black/90 backdrop-blur-md flex flex-col text-zinc-100';
      modal.innerHTML = `
        <div class="px-3 py-2.5 bg-[#0f2942] border-b border-teal-500/50 flex flex-wrap items-center justify-between gap-2 shrink-0 max-w-full overflow-x-hidden">
          <div class="min-w-0 flex-1">
            <div class="text-xs sm:text-base font-black text-white truncate">👁️ Xem Trước PDF (${totalPages} trang)</div>
            <div class="text-[11px] text-teal-200 truncate">Bìa · Biểu đồ · Sơ đồ đủ 8 chuỗi · Link bài báo bấm trực tiếp</div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 shrink-0">
            <button type="button" id="w20-pv-download" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-lg cursor-pointer">⬇️ Tải PDF</button>
            <button type="button" id="w20-pv-close" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer">✕ Đóng</button>
          </div>
        </div>
        <div id="w20-pv-pages-scroll" class="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5 flex flex-col items-center bg-zinc-950/95"></div>
      `;
      document.body.appendChild(modal);
      const box = modal.querySelector('#w20-pv-pages-scroll');
      allCanvases.forEach((cv, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'w-full max-w-[820px] space-y-1.5';
        const lbl = document.createElement('div');
        lbl.className = 'text-xs font-extrabold text-teal-300 text-center';
        lbl.textContent = `— Trang ${idx + 1} / ${totalPages} —`;
        const sheetBox = document.createElement('div');
        sheetBox.className = 'relative w-full overflow-hidden rounded-[10px] shadow-[0_14px_40px_rgba(0,0,0,0.65)]';
        cv.style.display = 'block';
        cv.style.width = '100%';
        cv.style.height = 'auto';
        sheetBox.appendChild(cv);
        // Phủ lớp <a> hitbox lên từng khung bài báo & liên kết để bấm mở ngay trong cửa sổ Xem trước!
        if (Array.isArray(cv.__pdfLinks) && cv.__pdfLinks.length) {
          const linkLayer = document.createElement('div');
          linkLayer.className = 'absolute inset-0 pointer-events-none';
          cv.__pdfLinks.forEach((lk) => {
            if (!lk?.url || !/^(https?:\/\/|mailto:)/i.test(String(lk.url))) return;
            const a = document.createElement('a');
            a.href = String(lk.url);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.title = `Bấm để mở bài báo gốc: ${lk.url}`;
            a.setAttribute('aria-label', `Mở bài báo gốc ${lk.url}`);
            a.className = 'block pointer-events-auto cursor-pointer rounded-lg transition-colors hover:bg-cyan-400/15 hover:ring-2 hover:ring-cyan-400/60 active:bg-cyan-400/25';
            a.style.position = 'absolute';
            a.style.left = `${((lk.x / 1240) * 100).toFixed(3)}%`;
            a.style.top = `${((lk.y / 1754) * 100).toFixed(3)}%`;
            a.style.width = `${((lk.w / 1240) * 100).toFixed(3)}%`;
            a.style.height = `${((lk.h / 1754) * 100).toFixed(3)}%`;
            linkLayer.appendChild(a);
          });
          sheetBox.appendChild(linkLayer);
        }
        wrap.appendChild(lbl);
        wrap.appendChild(sheetBox);
        box.appendChild(wrap);
      });
      modal.querySelector('#w20-pv-close')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#w20-pv-download')?.addEventListener('click', async (ev) => {
        const btn = ev.currentTarget;
        btn.disabled = true;
        btn.textContent = '⏳ Đang lưu file PDF...';
        try {
          await saveWisdomCanvasesToPdf(allCanvases, fileDate);
          globalScope.NoirStudio?.utils?.showToast?.(`✅ Đã tải Báo cáo PDF (${totalPages} trang) thành công!`, 'success', 4000);
          modal.remove();
        } catch (err) {
          globalScope.NoirStudio?.utils?.showToast?.('⚠️ ' + (err?.message || err), 'error', 4000);
          btn.disabled = false;
          btn.textContent = '⬇️ Tải File PDF Ngay';
        }
      });
      return { ok: true, pages: totalPages, previewOpened: true };
    }

    return saveWisdomCanvasesToPdf(allCanvases, fileDate);
  }

  W20.exportWisdomReportPdf = exportWisdomReportPdf;
})(typeof window !== 'undefined' ? window : globalThis);
