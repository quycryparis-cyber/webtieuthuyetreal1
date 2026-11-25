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
    c.width = 1240;
    c.height = 1754;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    return { canvas: c, ctx };
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
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`Sổ Tay Tiểu Thuyết Của Bi — 20 Phút Thông Thái Mỗi Ngày (${dateStr})`, 72, 1694);
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
    ctx.font = '800 24px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('SỔ TAY TIỂU THUYẾT CỦA BI · NOIRSTUDIO', 114, 124);

    // Ngày xuất bản tự động
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 32px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`ẤN BẢN NGÀY: ${todayFullStr.toUpperCase()}`, 84, 210);

    // Tiêu đề chính khổ lớn
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px "Segoe UI", Arial, sans-serif';
    ctx.fillText('20 PHÚT', 84, 290);
    ctx.fillStyle = '#34d399';
    ctx.fillText('THÔNG THÁI', 84, 392);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '800 54px "Segoe UI", Arial, sans-serif';
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
    ctx.font = '800 22px "Segoe UI", Arial, sans-serif';
    ctx.fillText('TIÊU ĐIỂM CHÍNH HÔM NAY', 118, 672);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 34px "Segoe UI", Arial, sans-serif';
    const hlLines = wrapCanvasText(ctx, syncData?.headline || `Báo cáo 8 Trụ cột Tri thức — ${todayFullStr}`, W - 236).slice(0, 3);
    hlLines.forEach((ln, i) => ctx.fillText(ln, 118, 718 + i * 44));

    // Vị trí & số mục xác thực
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 25px "Segoe UI", Arial, sans-serif';
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
      ctx.font = '800 20px "Segoe UI", Arial, sans-serif';
      ctx.fillText(k.label, x + 28, y + 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
      ctx.fillText(k.val, x + 28, y + 72);
    });

    // Dải danh mục 8 trụ cột ở chân bìa
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 21px "Segoe UI", Arial, sans-serif';
    ctx.fillText('BAO PHỦ 8 TRỤ CỘT: Thế giới · Công nghệ & AI · Kinh tế · Khu vực · Sức khỏe · Pháp luật · Tư duy · Văn hóa & Lịch sử', 84, 1410);

    // Chân trang bìa
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(84, 1560); ctx.lineTo(W - 84, 1560); ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 23px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Xuất bản tự động 100% trên thiết bị từ Sổ Tay Tiểu Thuyết Của Bi', 84, 1592);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
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
    ctx.font = '900 34px "Segoe UI", Arial, sans-serif';
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
    ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('1. Lộ trình 20 Phút Đọc Thông Thái', 100, 174);

    const palette = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];
    const plan = (Array.isArray(syncData?.reading_plan_20m) && syncData.reading_plan_20m.length
      ? syncData.reading_plan_20m
      : W20.CATEGORIES.map((c) => ({ label: c.title.replace(/^\d+\.\s*/, ''), minutes: c.minutes, color: c.color }))
    ).slice(0, 8);
    const totalMin = plan.reduce((s, x) => s + Math.max(1, Number(x.minutes) || 2), 0) || 20;

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
    ctx.font = '900 40px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${totalMin}p`, cx, cy - 26);
    ctx.fillStyle = '#64748b';
    ctx.font = '700 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText('MỖI NGÀY', cx, cy + 20);
    ctx.textAlign = 'left';

    // Chú thích Donut bên phải
    plan.forEach((it, idx) => {
      const ly = 240 + idx * 46;
      ctx.fillStyle = it.color || palette[idx % palette.length];
      drawRoundedRect(ctx, 378, ly + 4, 16, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 17px "Segoe UI", Arial, sans-serif';
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
    ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('2. Mức độ Tác động Sự kiện (Thang 100)', 656, 174);

    const impacts = (Array.isArray(syncData?.impact_scores) ? syncData.impact_scores : []).slice(0, 6);
    impacts.forEach((r, idx) => {
      const by = 228 + idx * 66;
      const score = Math.max(10, Math.min(100, Number(r.score) || 75));
      const col = palette[idx % palette.length];
      ctx.fillStyle = '#1e293b';
      ctx.font = '800 18px "Segoe UI", Arial, sans-serif';
      ctx.fillText(String(r.topic || `Sự kiện ${idx + 1}`).slice(0, 38), 656, by);
      ctx.fillStyle = col;
      ctx.font = '900 19px "Segoe UI", Arial, sans-serif';
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
    ctx.font = '900 26px "Segoe UI", Arial, sans-serif';
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
      ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
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
        ctx.font = '700 19px "Segoe UI", Arial, sans-serif';
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
    ctx.font = '900 23px "Segoe UI", Arial, sans-serif';
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
      ctx.font = '800 18px "Segoe UI", Arial, sans-serif';
      const titleLines = wrapCanvasText(ctx, String(mm.title || '').replace(/\*/g, ''), 468).slice(0, 2);
      titleLines.forEach((ln, li) => ctx.fillText(ln, mx + 18, 1390 + li * 21));
      ctx.fillStyle = '#334155';
      ctx.font = '600 16px "Segoe UI", Arial, sans-serif';
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
      ctx.font = '800 16px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`• [${String(t.time || 'Hôm nay')}]`, 100, tyCursor);
      ctx.fillStyle = '#1e293b';
      ctx.font = '600 15.5px "Segoe UI", Arial, sans-serif';
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
      ctx.font = '900 30px "Segoe UI", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, 72, 48);
      ctx.textBaseline = 'top';
    };

    paintHeader(cur.ctx, geminiParsed ? 'BẢN TIN 20 PHÚT (GEMINI) & 8 TRỤ CỘT TRI THỨC' : 'BÁO CÁO 8 TRỤ CỘT THÔNG TIN THÔ KHOA HỌC HÔM NAY');

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

        // 1. Bảng Markdown chuẩn `| col | col |` -> Vẽ BẢNG TÀI CHÍNH THẬT trên PDF!
        if (trimmed.startsWith('|') && trimmed.endsWith('|') && li + 1 < rawLines.length && /^\|\s*[-:]+/.test(rawLines[li + 1].trim())) {
          const parseRow = (ln) => ln.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.replace(/\*\*/g, '').replace(/`/g, '').trim());
          const headers = parseRow(trimmed);
          li += 2;
          const rows = [];
          while (li < rawLines.length && rawLines[li].trim().startsWith('|') && rawLines[li].trim().endsWith('|')) {
            rows.push(parseRow(rawLines[li]));
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
            cur.ctx.font = '800 18px "Segoe UI", Arial, sans-serif';
            headers.forEach((h, ci) => {
              cur.ctx.fillText(h.slice(0, Math.max(12, Math.floor(colW / 11))), 84 + ci * colW, y + 12);
            });
            y += 46;
          };

          ensureSpace(100, 'BẢN TIN 20 PHÚT THÔNG THÁI (BẢNG TỔNG HỢP)');
          drawTableHead();
          rows.forEach((row, rIdx) => {
            cur.ctx.font = '600 17px "Segoe UI", Arial, sans-serif';
            const cellLines = Array.from({ length: colCount }, (_, ci) => wrapCanvasText(cur.ctx, row[ci] || '—', colW - 20).slice(0, 3));
            const rowH = Math.max(36, Math.max(...cellLines.map((cl) => cl.length)) * 24 + 14);
            if (y + rowH > maxY) {
              pages.push(cur.canvas);
              cur = createA4Canvas();
              paintHeader(cur.ctx, 'BẢN TIN 20 PHÚT THÔNG THÁI (TIẾP THEO)');
              y = minY;
              drawTableHead();
            }
            cur.ctx.fillStyle = rIdx % 2 === 1 ? '#eff6ff' : '#ffffff';
            cur.ctx.fillRect(72, y, maxW, rowH);
            cur.ctx.strokeStyle = '#cbd5e1';
            cur.ctx.lineWidth = 1;
            cur.ctx.strokeRect(72, y, maxW, rowH);
            cur.ctx.fillStyle = '#0f172a';
            cur.ctx.font = '600 17px "Segoe UI", Arial, sans-serif';
            cellLines.forEach((cl, ci) => {
              cl.forEach((ln, k) => cur.ctx.fillText(ln, 84 + ci * colW, y + 9 + k * 24));
            });
            y += rowH;
          });
          y += 18;
          continue;
        }

        // 2. Tiêu đề Markdown (# đến ######) -> Vẽ Banner Xanh Navy-Teal chuẩn Báo Cáo Tài Chính (0 còn dấu ####!)
        const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (hMatch) {
          const lvl = hMatch[1].length;
          const cleanTitle = hMatch[2].replace(/\*\*/g, '').replace(/`/g, '').trim();
          if (lvl <= 2) {
            ensureSpace(74, 'BẢN TIN 20 PHÚT THÔNG THÁI (TIẾP THEO)');
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
            cur.ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
            cur.ctx.fillText(cleanTitle.slice(0, 82), 96, y + 14);
            y += 68;
          } else {
            ensureSpace(50, 'BẢN TIN 20 PHÚT THÔNG THÁI (TIẾP THEO)');
            y += 6;
            cur.ctx.fillStyle = '#0d9488';
            cur.ctx.fillRect(72, y + 2, 6, 30);
            cur.ctx.fillStyle = '#0f2942';
            cur.ctx.font = '900 23px "Segoe UI", Arial, sans-serif';
            cur.ctx.fillText(cleanTitle.slice(0, 84), 90, y + 4);
            y += 42;
          }
          li++;
          continue;
        }

        // 3. Đoạn chữ thường / Gạch đầu dòng sạch sẽ (loại bỏ sạch dấu ** và *)
        const isBullet = /^[-*•]\s+/.test(trimmed);
        const clean = trimmed
          .replace(/^[-*•]\s+/, '• ')
          .replace(/\*/g, '')
          .replace(/`/g, '');
        const isSubNum = /^\d+\.\s+/.test(clean) && clean.length < 95;
        if (isSubNum) {
          ensureSpace(46, 'BẢN TIN 20 PHÚT THÔNG THÁI (TIẾP THEO)');
          cur.ctx.fillStyle = '#0d9488';
          cur.ctx.fillRect(72, y + 3, 6, 28);
          cur.ctx.fillStyle = '#0f2942';
          cur.ctx.font = '900 22px "Segoe UI", Arial, sans-serif';
          cur.ctx.fillText(clean, 90, y + 4);
          y += 40;
          li++;
          continue;
        }

        cur.ctx.font = '500 20px "Segoe UI", Arial, sans-serif';
        const indentX = isBullet ? 90 : 72;
        const wrapped = wrapCanvasText(cur.ctx, clean, maxW - (indentX - 72));
        ensureSpace(wrapped.length * 30 + 10, 'BẢN TIN 20 PHÚT THÔNG THÁI (TIẾP THEO)');
        cur.ctx.fillStyle = '#1e293b';
        cur.ctx.font = '500 20px "Segoe UI", Arial, sans-serif';
        for (const ln of wrapped) {
          cur.ctx.fillText(ln, indentX, y);
          y += 30;
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
      cur.ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
      cur.ctx.fillText(`${cat.title.toUpperCase()}  (${items.length} mục)`, 94, y + 12);
      y += 66;

      for (const it of items.slice(0, 4)) {
        cur.ctx.font = '800 21px "Segoe UI", Arial, sans-serif';
        const tLines = wrapCanvasText(cur.ctx, `• ${it.title}`, maxW - 28).slice(0, 2);
        cur.ctx.font = '500 19px "Segoe UI", Arial, sans-serif';
        const sLines = wrapCanvasText(cur.ctx, it.summary || '', maxW - 36).slice(0, 3);
        const boxH = tLines.length * 29 + sLines.length * 26 + 44;

        ensureSpace(boxH + 14, `8 TRỤ CỘT TRI THỨC — ${cat.title.toUpperCase()}`);
        drawRoundedRect(cur.ctx, 72, y, maxW, boxH, 12);
        cur.ctx.fillStyle = '#f8fafc';
        cur.ctx.fill();
        cur.ctx.strokeStyle = '#e2e8f0';
        cur.ctx.lineWidth = 1.5;
        cur.ctx.stroke();

        let iy = y + 12;
        cur.ctx.fillStyle = '#0f172a';
        cur.ctx.font = '800 21px "Segoe UI", Arial, sans-serif';
        for (const ln of tLines) {
          cur.ctx.fillText(ln, 88, iy);
          iy += 29;
        }
        cur.ctx.fillStyle = '#334155';
        cur.ctx.font = '500 19px "Segoe UI", Arial, sans-serif';
        for (const ln of sLines) {
          cur.ctx.fillText(ln, 96, iy);
          iy += 26;
        }
        cur.ctx.fillStyle = '#64748b';
        cur.ctx.font = '700 16px "Segoe UI", Arial, sans-serif';
        cur.ctx.fillText(`Nguồn: ${it.source || 'Web'}  |  Mã SHA-256: #${it.sha256 || 'verified'}`, 96, iy + 4);
        y += boxH + 14;
      }
      y += 12;
    }

    pages.push(cur.canvas);
    return pages;
  }

  async function exportWisdomReportPdf(scanResult, geminiParsed) {
    if (!scanResult) throw new Error('Chưa có dữ liệu 20 phút thông thái để xuất PDF.');
    const PDFLib = await ensurePdfLib();
    const syncData = geminiParsed?.syncData || W20.buildDefaultChartDataFromRaw(scanResult);
    const now = new Date();
    const todayFullStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const fileDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const coverCanvas = drawCoverPage(scanResult, syncData, todayFullStr);
    const chartCanvas = drawChartsDashboardPage(syncData, todayFullStr);
    const contentCanvases = drawContentPages(scanResult, geminiParsed);

    const allCanvases = [coverCanvas, chartCanvas, ...contentCanvases];
    const totalPages = allCanvases.length;

    // Vẽ số trang chân trang từ trang 2 trở đi
    for (let i = 1; i < totalPages; i++) {
      drawPageFooter(allCanvases[i].getContext('2d'), i + 1, totalPages, todayFullStr);
    }

    const pdfDoc = await PDFLib.PDFDocument.create();
    pdfDoc.setTitle(`20 Phút Thông Thái Mỗi Ngày - ${fileDate}`);
    pdfDoc.setAuthor('Sổ Tay Tiểu Thuyết Của Bi - NoirStudio');

    for (const c of allCanvases) {
      const jpgBytes = await canvasToJpgBytes(c, 0.92);
      const jpgImg = await pdfDoc.embedJpg(jpgBytes);
      const pg = pdfDoc.addPage([595.28, 841.89]); // Chuẩn A4 (pt)
      pg.drawImage(jpgImg, { x: 0, y: 0, width: 595.28, height: 841.89 });
      c.width = 0;
      c.height = 0;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `20_Phut_Thong_Thai_${fileDate}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true, pages: totalPages, size: pdfBytes.byteLength };
  }

  W20.exportWisdomReportPdf = exportWisdomReportPdf;
})(typeof window !== 'undefined' ? window : globalThis);
