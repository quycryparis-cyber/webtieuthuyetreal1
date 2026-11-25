/**
 * ============================================================================
 * 📄 ĐẦU TƯ HÔM NAY — FULL EXECUTIVE PDF EXPORTER + LIVE SCROLL PREVIEW (v135.0)
 * ============================================================================
 * - 4 chế độ xuất chuyên sâu ĐẦY ĐỦ 100% biểu đồ, tin tức tác động & phân tích Gemini:
 *   1) overview    — Bìa + Trang Biểu đồ Chuyên nghiệp (Donut Chia Vốn + Radar 6 Rủi ro
 *                    + Cột 4 Kênh + Ma trận Quyết định) + Tin nóng Vĩ mô & Tác động
 *                    + Checklist 15–24 đề mục + Toàn văn phân tích Gemini.
 *   2) gold        — Bìa + Biểu đồ Giá Vàng 30 Ngày (kèm MA7) + Bảng Chênh lệch SJC/Thế giới
 *                    + Các yếu tố vĩ mô/tin tức tác động giá vàng + Phân tích Gemini.
 *   3) stock       — Bìa + Biểu đồ 5 Trụ cột Điểm Chất lượng (Simplize) + Bảng chỉ số sống
 *                    (Giá, Vốn hóa, P/E, P/B, ROE, ROA, EPS, EV/EBITDA, Tăng trưởng 5Y)
 *                    + Bộ lọc Pháp y BCTC + Tin thị trường & Phân tích chuyên sâu Gemini.
 *   4) real_estate — Bìa + Biểu đồ Stress Test Lãi suất vay 10%–15% & Dòng tiền cho thuê
 *                    + Mặt bằng khu vực & Tin rao thực tế + 7 bước pháp lý + Phân tích Gemini.
 * - Mở CỬA SỔ XEM TRƯỚC CUỘN DỌC TỪNG TRANG A4 trước khi tải file PDF (đổi cỡ chữ/phông/nền sống!).
 * ============================================================================
 */
(function initInvestPdfExporter(globalScope) {
  'use strict';

  const INV = (globalScope.NoirInvestToday = globalScope.NoirInvestToday || {});

  const FONT_MAP = {
    sans: '"Segoe UI", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    classic: '"Palatino Linotype", Georgia, serif',
    mono: 'Consolas, "Courier New", monospace',
  };
  const SIZE_SCALE = { md: 0.92, lg: 1.05, xl: 1.18, xxl: 1.32 };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Không tải được thư viện ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureJsPdf() {
    if (globalScope.jspdf?.jsPDF) return globalScope.jspdf.jsPDF;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    if (!globalScope.jspdf?.jsPDF) throw new Error('Không khởi tạo được jsPDF.');
    return globalScope.jspdf.jsPDF;
  }

  function createA4(darkPaper) {
    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = darkPaper ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'top';
    return { canvas, ctx };
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function cleanStr(s) {
    return String(s ?? '').replace(/\*/g, '').replace(/`/g, '').replace(/#+\s*/g, '').trim();
  }

  function wrapText(ctx, text, maxW) {
    const words = cleanStr(text).split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const lines = [];
    let cur = '';
    for (const w of words) {
      const cand = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(cand).width <= maxW) {
        cur = cand;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function paintHeader(ctx, title, ff) {
    ctx.fillStyle = '#0f2942';
    ctx.fillRect(0, 0, 1240, 96);
    ctx.fillStyle = '#14b8a6';
    ctx.fillRect(0, 92, 1240, 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 26px ${ff}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanStr(title).slice(0, 74), 72, 48);
    ctx.textBaseline = 'top';
  }

  function drawCoverPage(modeMeta, subtitle, metrics, opts) {
    const { canvas, ctx } = createA4(false);
    const W = canvas.width;
    const H = canvas.height;
    const ff = FONT_MAP[opts.font] || FONT_MAP.sans;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0b1e36');
    grad.addColorStop(0.55, '#13315c');
    grad.addColorStop(1, '#0d4f5c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#14b8a6';
    ctx.fillRect(0, 0, 18, H);

    rr(ctx, 84, 108, 490, 48, 24);
    ctx.fillStyle = 'rgba(20,184,166,0.22)';
    ctx.fill();
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#5eead4';
    ctx.font = `800 20px ${ff}`;
    ctx.fillText('BÁO CÁO PHÂN TÍCH ĐẦU TƯ CHUYÊN GIA', 110, 121);

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 52px ${ff}`;
    let ty = 205;
    wrapText(ctx, modeMeta.title, W - 180).forEach((ln) => {
      ctx.fillText(ln, 84, ty);
      ty += 66;
    });

    ctx.fillStyle = '#cbd5e1';
    ctx.font = `600 25px ${ff}`;
    wrapText(ctx, subtitle, W - 180).slice(0, 3).forEach((ln) => {
      ctx.fillText(ln, 84, ty + 14);
      ty += 36;
    });

    const cardTop = Math.max(520, ty + 54);
    const colW = 516;
    metrics.slice(0, 6).forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 84 + col * (colW + 40);
      const y = cardTop + row * 172;
      rr(ctx, x, y, colW, 146, 18);
      ctx.fillStyle = 'rgba(15,23,42,0.62)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(45,212,191,0.48)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = `700 18px ${ff}`;
      ctx.fillText(cleanStr(m.label), x + 24, y + 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 30px ${ff}`;
      wrapText(ctx, cleanStr(m.value || '—'), colW - 48).slice(0, 1).forEach((vln) => ctx.fillText(vln, x + 24, y + 58));
      ctx.fillStyle = '#5eead4';
      ctx.font = `600 16.5px ${ff}`;
      wrapText(ctx, cleanStr(m.note || ''), colW - 48).slice(0, 1).forEach((nln) => ctx.fillText(nln, x + 24, y + 104));
    });

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `600 20px ${ff}`;
    ctx.fillText(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} · Sổ Tay Tiểu Thuyết Của Bi — Đầu Tư Hôm Nay (v135)`, 84, H - 94);
    return canvas;
  }

  /**
   * TRANG BIỂU ĐỒ CHUYÊN NGHIỆP CHO BÁO CÁO TỔNG QUÁT (Donut Chia Vốn + Radar 6 Rủi ro + Cột 4 Kênh)
   */
  function drawOverviewChartsPage(report, unified, opts) {
    const dark = opts.paperTheme === 'dark';
    const ff = FONT_MAP[opts.font] || FONT_MAP.sans;
    const { canvas, ctx } = createA4(dark);
    paintHeader(ctx, 'PHẦN 1 — BỘ BIỂU ĐỒ PHÂN TÍCH CHUYÊN NGHIỆP (TRÒN · RADAR · CỘT)', ff);

    const cardBg = dark ? '#1e293b' : '#f8fafc';
    const cardBd = dark ? '#334155' : '#cbd5e1';
    const ink = dark ? '#f1f5f9' : '#0f172a';
    const muted = dark ? '#94a3b8' : '#475569';

    // 1. DONUT PHÂN BỔ VỐN (Trái trên)
    rr(ctx, 64, 126, 540, 490, 18);
    ctx.fillStyle = cardBg; ctx.fill(); ctx.strokeStyle = cardBd; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#0ea5e9'; ctx.font = `900 22px ${ff}`;
    ctx.fillText('1. Gợi Ý Phân Bổ Vốn An Toàn (%)', 88, 150);

    const alloc = unified?.allocation_pct || { cash: 35, gold: 25, stock: 25, real_estate: 15 };
    const slices = [
      { label: 'Tiền mặt / Tiết kiệm', val: Number(alloc.cash) || 30, color: '#0ea5e9' },
      { label: 'Vàng phòng thủ', val: Number(alloc.gold) || 25, color: '#f59e0b' },
      { label: 'Chứng khoán', val: Number(alloc.stock) || 25, color: '#8b5cf6' },
      { label: 'Nhà đất / BĐS', val: Number(alloc.real_estate) || 20, color: '#10b981' },
    ];
    const totalA = slices.reduce((s, x) => s + x.val, 0) || 100;
    let ang = -Math.PI / 2;
    const dcx = 230; const dcy = 345; const dr = 112;
    slices.forEach((s) => {
      const sw = (s.val / totalA) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(dcx, dcy, dr, ang, ang + sw);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 42;
      ctx.stroke();
      ang += sw;
    });
    ctx.fillStyle = ink; ctx.font = `900 30px ${ff}`; ctx.textAlign = 'center';
    ctx.fillText('100%', dcx, dcy - 18);
    ctx.fillStyle = muted; ctx.font = `700 15px ${ff}`;
    ctx.fillText('TỶ TRỌNG', dcx, dcy + 18);
    ctx.textAlign = 'left';

    slices.forEach((s, i) => {
      const ly = 240 + i * 54;
      ctx.fillStyle = s.color; ctx.fillRect(382, ly + 4, 18, 18);
      ctx.fillStyle = ink; ctx.font = `800 17px ${ff}`;
      ctx.fillText(`${Math.round((s.val / totalA) * 100)}%`, 410, ly);
      ctx.fillStyle = muted; ctx.font = `600 15px ${ff}`;
      ctx.fillText(s.label, 410, ly + 22);
    });

    // 2. RADAR 6 TRỤC RỦI RO (Phải trên)
    rr(ctx, 636, 126, 540, 490, 18);
    ctx.fillStyle = cardBg; ctx.fill(); ctx.strokeStyle = cardBd; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#f43f5e'; ctx.font = `900 22px ${ff}`;
    ctx.fillText('2. Biểu Đồ Radar 6 Mức Độ Rủi Ro', 660, 150);

    const radarAxes = (Array.isArray(unified?.risk_radar) && unified.risk_radar.length >= 3)
      ? unified.risk_radar.slice(0, 6)
      : [
          { label: 'Địa chính trị', level: 74 },
          { label: 'Lãi suất cao', level: 68 },
          { label: 'Chênh giá Vàng', level: 72 },
          { label: 'Margin CK', level: 65 },
          { label: 'Lãi vay BĐS', level: 78 },
          { label: 'Thanh khoản', level: 52 },
        ];
    const rcx = 906; const rcy = 384; const rMax = 122; const rn = radarAxes.length;
    const rPt = (i, ratio) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / rn;
      return [rcx + Math.cos(a) * rMax * ratio, rcy + Math.sin(a) * rMax * ratio];
    };
    [0.33, 0.66, 1].forEach((lv) => {
      ctx.beginPath();
      radarAxes.forEach((_, i) => {
        const [x, y] = rPt(i, lv);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = dark ? 'rgba(148,163,184,0.28)' : 'rgba(100,116,139,0.28)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.beginPath();
    radarAxes.forEach((ax, i) => {
      const [x, y] = rPt(i, Math.max(0.12, Math.min(1, (Number(ax.level) || 50) / 100)));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(244,63,94,0.24)'; ctx.fill();
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3; ctx.stroke();
    radarAxes.forEach((ax, i) => {
      const [dx, dy] = rPt(i, Math.max(0.12, Math.min(1, (Number(ax.level) || 50) / 100)));
      ctx.beginPath(); ctx.arc(dx, dy, 6, 0, Math.PI * 2);
      ctx.fillStyle = Number(ax.level) >= 75 ? '#f43f5e' : '#f59e0b'; ctx.fill();
      const [lx, ly] = rPt(i, 1.28);
      ctx.fillStyle = ink; ctx.font = `800 15px ${ff}`;
      ctx.textAlign = lx < rcx - 20 ? 'right' : lx > rcx + 20 ? 'left' : 'center';
      ctx.fillText(`${cleanStr(ax.label).slice(0, 18)} (${Math.round(Number(ax.level) || 0)})`, lx, ly - 8);
    });
    ctx.textAlign = 'left';

    // 3. BIỂU ĐỒ CỘT 4 KÊNH ĐẦU TƯ (Giữa)
    rr(ctx, 64, 646, 1112, 360, 18);
    ctx.fillStyle = cardBg; ctx.fill(); ctx.strokeStyle = cardBd; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#10b981'; ctx.font = `900 22px ${ff}`;
    ctx.fillText('3. Biểu Đồ Điểm Hấp Dẫn 4 Kênh Đầu Tư (Thang 100)', 88, 670);

    const ch = report?.channel_scores || {};
    const bars = [
      { label: 'Tiền mặt / Tiết kiệm', score: ch.cash?.score ?? unified?.channel_scores?.cash ?? 68, color: '#0ea5e9', badge: ch.cash?.badge || 'Phòng thủ' },
      { label: 'Vàng', score: ch.gold?.score ?? unified?.channel_scores?.gold ?? 70, color: '#f59e0b', badge: ch.gold?.badge || 'Trú ẩn' },
      { label: 'Chứng khoán', score: ch.stock?.score ?? unified?.channel_scores?.stock ?? 62, color: '#8b5cf6', badge: ch.stock?.badge || 'Chọn lọc' },
      { label: 'Nhà đất / BĐS', score: ch.real_estate?.score ?? unified?.channel_scores?.real_estate ?? 55, color: '#10b981', badge: ch.real_estate?.badge || 'Thận trọng' },
    ];
    bars.forEach((b, i) => {
      const by = 720 + i * 68;
      ctx.fillStyle = ink; ctx.font = `800 19px ${ff}`;
      ctx.fillText(`${b.label} — ${b.badge}`, 92, by);
      ctx.fillStyle = b.color; ctx.font = `900 20px ${ff}`;
      ctx.fillText(`${b.score}/100`, 1065, by);
      rr(ctx, 92, by + 28, 955, 22, 11);
      ctx.fillStyle = dark ? '#0f172a' : '#e2e8f0'; ctx.fill();
      rr(ctx, 92, by + 28, Math.max(24, Math.round((Math.min(100, b.score) / 100) * 955)), 22, 11);
      ctx.fillStyle = b.color; ctx.fill();
    });

    // 4. MA TRẬN QUYẾT ĐỊNH 4 KÊNH (Đáy)
    rr(ctx, 64, 1036, 1112, 620, 18);
    ctx.fillStyle = cardBg; ctx.fill(); ctx.strokeStyle = cardBd; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#0d9488'; ctx.font = `900 22px ${ff}`;
    ctx.fillText('4. Ma Trận Quyết Định Hành Động & Khuyến Nghị Chu Kỳ', 88, 1060);

    const dmList = Array.isArray(unified?.decision_matrix) && unified.decision_matrix.length
      ? unified.decision_matrix.slice(0, 4)
      : bars.map((b) => ({ channel: b.label, decision: b.badge, reason: ch[b.label.includes('Vàng') ? 'gold' : b.label.includes('Chứng') ? 'stock' : b.label.includes('Nhà') ? 'real_estate' : 'cash']?.reason || 'Theo dõi sát diễn biến lãi suất & vĩ mô.' }));
    let my = 1108;
    dmList.forEach((dm) => {
      rr(ctx, 88, my, 1064, 118, 12);
      ctx.fillStyle = dark ? '#0f172a' : '#ffffff'; ctx.fill();
      ctx.strokeStyle = cardBd; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#0d9488'; ctx.fillRect(88, my, 8, 118);
      ctx.fillStyle = ink; ctx.font = `900 19px ${ff}`;
      ctx.fillText(`${cleanStr(dm.channel)}  •  ${cleanStr(dm.decision)}`, 112, my + 14);
      ctx.fillStyle = muted; ctx.font = `600 17px ${ff}`;
      wrapText(ctx, dm.reason || '', 1016).slice(0, 3).forEach((ln, li) => {
        ctx.fillText(ln, 112, my + 46 + li * 23);
      });
      my += 132;
    });

    return canvas;
  }

  /**
   * BIỂU ĐỒ CHUYÊN BIỆT CHO VÀNG (30 ngày) / CHỨNG KHOÁN (5 trụ cột) / NHÀ ĐẤT (Stress Test 10%-15%)
   */
  function drawSpecializedChartPage(mode, dataObj, opts) {
    const dark = opts.paperTheme === 'dark';
    const ff = FONT_MAP[opts.font] || FONT_MAP.sans;
    const { canvas, ctx } = createA4(dark);
    const ink = dark ? '#f1f5f9' : '#0f172a';
    const muted = dark ? '#94a3b8' : '#475569';
    const cardBg = dark ? '#1e293b' : '#f8fafc';
    const cardBd = dark ? '#334155' : '#cbd5e1';

    if (mode === 'gold') {
      paintHeader(ctx, 'PHẦN 1 — BIỂU ĐỒ GIÁ VÀNG 30 NGÀY & ĐỐI CHIẾU NỘI – NGOẠI', ff);
      const pts = dataObj.goldHist?.points || [];
      rr(ctx, 64, 126, 1112, 620, 18);
      ctx.fillStyle = cardBg; ctx.fill(); ctx.strokeStyle = cardBd; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.font = `900 24px ${ff}`;
      ctx.fillText('📈 Xu Hướng Giá Vàng Thế Giới 30 Ngày (PAXG / XAU-USD)', 92, 154);

      if (pts.length >= 2) {
        const vals = pts.map((p) => Number(p.close || p.value) || 0);
        const minV = Math.min(...vals); const maxV = Math.max(...vals); const span = Math.max(1, maxV - minV);
        const px0 = 140; const py0 = 230; const pw = 980; const ph = 420;
        ctx.strokeStyle = cardBd; ctx.lineWidth = 1.5;
        for (let g = 0; g <= 4; g++) {
          const gy = py0 + (ph * g) / 4;
          ctx.beginPath(); ctx.moveTo(px0, gy); ctx.lineTo(px0 + pw, gy); ctx.stroke();
          ctx.fillStyle = muted; ctx.font = `700 16px ${ff}`;
          ctx.fillText(`$${Math.round(maxV - (span * g) / 4)}`, 76, gy - 8);
        }
        ctx.beginPath();
        pts.forEach((p, idx) => {
          const x = px0 + (idx / (pts.length - 1)) * pw;
          const y = py0 + ph - (((Number(p.close || p.value) - minV) / span) * ph);
          if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 5; ctx.stroke();
      } else {
        ctx.fillStyle = muted; ctx.font = `600 20px ${ff}`;
        ctx.fillText('Giá vàng hiện tại đang được cập nhật trực tiếp ở bảng đối chiếu bên dưới.', 92, 360);
      }
      return canvas;
    }

    if (mode === 'stock') {
      const st = dataObj.stock;
      paintHeader(ctx, `PHẦN 1 — BIỂU ĐỒ CHẤT LƯỢNG 5 TRỤ CỘT & ĐỊNH GIÁ ${st.symbol}`, ff);
      rr(ctx, 64, 126, 1112, 560, 18);
      ctx.fillStyle = cardBg; ctx.fill(); ctx.strokeStyle = cardBd; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#0ea5e9'; ctx.font = `900 24px ${ff}`;
      ctx.fillText(`📊 Điểm Chất Lượng 5 Trụ Cột Doanh Nghiệp — ${st.symbol} (${st.companyName})`, 92, 154);

      const sc = st.simplizeScores || { valuation: 3, growth: 3, performance: 3, health: 3, dividend: 3 };
      const rows = [
        { label: '1. Định giá (Valuation)', val: sc.valuation * 20, color: '#0ea5e9' },
        { label: '2. Tăng trưởng (Growth)', val: sc.growth * 20, color: '#8b5cf6' },
        { label: '3. Hiệu quả hoạt động (Performance)', val: sc.performance * 20, color: '#10b981' },
        { label: '4. Sức khỏe tài chính (Financial Health)', val: sc.health * 20, color: '#f59e0b' },
        { label: '5. Chính sách cổ tức (Dividend)', val: sc.dividend * 20, color: '#ec4899' },
      ];
      rows.forEach((r, idx) => {
        const ry = 225 + idx * 84;
        ctx.fillStyle = ink; ctx.font = `800 20px ${ff}`;
        ctx.fillText(r.label, 96, ry);
        ctx.fillStyle = r.color; ctx.font = `900 21px ${ff}`;
        ctx.fillText(`${(r.val / 20).toFixed(1)} / 5.0`, 1040, ry);
        rr(ctx, 96, ry + 32, 930, 24, 12);
        ctx.fillStyle = dark ? '#0f172a' : '#e2e8f0'; ctx.fill();
        rr(ctx, 96, ry + 32, Math.max(30, Math.round((r.val / 100) * 930)), 24, 12);
        ctx.fillStyle = r.color; ctx.fill();
      });
      return canvas;
    }

    // real_estate Stress Test Chart
    paintHeader(ctx, 'PHẦN 1 — BIỂU ĐỒ STRESS TEST LÃI SUẤT VAY NHÀ ĐẤT (10% – 15%)', ff);
    rr(ctx, 64, 126, 1112, 600, 18);
    ctx.fillStyle = cardBg; ctx.fill(); ctx.strokeStyle = cardBd; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#10b981'; ctx.font = `900 24px ${ff}`;
    ctx.fillText(`🏠 Áp Lực Trả Góp Hàng Tháng Theo Kịch Bản Lãi Suất (${dataObj.area})`, 92, 154);

    const rates = [9, 10.5, 12, 13.5, 15];
    const loan = 2.1e9; // 2.1 tỷ chuẩn minh họa nếu chưa nhập
    const months = 240;
    rates.forEach((rPct, idx) => {
      const rm = rPct / 100 / 12;
      const pmt = (loan * rm * Math.pow(1 + rm, months)) / (Math.pow(1 + rm, months) - 1);
      const tr = pmt / 1e6;
      const ry = 230 + idx * 88;
      const col = rPct >= 13.5 ? '#f43f5e' : rPct >= 12 ? '#f59e0b' : '#10b981';
      ctx.fillStyle = ink; ctx.font = `800 20px ${ff}`;
      ctx.fillText(`Lãi thả nổi ${rPct}%/năm (Vay mẫu 2,1 tỷ / 20 năm)`, 96, ry);
      ctx.fillStyle = col; ctx.font = `900 21px ${ff}`;
      ctx.fillText(`${tr.toFixed(1)} tr/tháng`, 1000, ry);
      rr(ctx, 96, ry + 34, 880, 24, 12);
      ctx.fillStyle = dark ? '#0f172a' : '#e2e8f0'; ctx.fill();
      rr(ctx, 96, ry + 34, Math.min(880, Math.round((tr / 35) * 880)), 24, 12);
      ctx.fillStyle = col; ctx.fill();
    });
    return canvas;
  }

  function extractLinkFromRaw(raw) {
    let foundUrl = '';
    const textWithoutMd = String(raw ?? '').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_m, label, u) => {
      if (!foundUrl) foundUrl = u.trim();
      return label;
    });
    if (!foundUrl) {
      const bm = textWithoutMd.match(/https?:\/\/[^\s<>)\]"']+/i);
      if (bm) foundUrl = bm[0].replace(/[.,;:!?]+$/, '');
    }
    return { text: cleanStr(textWithoutMd), url: foundUrl };
  }

  function isSmartInvestHeading(rawLine) {
    const t = cleanStr(rawLine);
    if (!t || t.length < 3 || t.length > 98) return false;
    if (typeof globalScope.NoirClassifyDocLine === 'function') {
      const cls = globalScope.NoirClassifyDocLine(t);
      if (cls?.kind === 'h1' || cls?.kind === 'h2' || cls?.kind === 'h3') return true;
      if (cls?.kind === 'paragraph' || cls?.kind === 'toc_item') return false;
    }
    if (/^[a-zà-ỹ]/.test(t)) return false; // tuyệt đối bỏ qua mảnh văn xuôi chữ thường ("phần SX-TM...")
    if (/^(USD|VND|EUR|JPY|GBP|LINK)\.?$/i.test(t)) return false;
    if (/^(MỤC\s+LỤC|DANH\s+MỤC|CHƯƠNG|PHẦN|MỤC|BÀI)\s*(?:[IVXLCDM]+|\d+)?(?:[\s.:–—-]|$)/i.test(t) && /^[A-ZĐÂĂÊÔƠƯ]/u.test(t) && !/\.\s*\.+\s*\d+\s*$/.test(t)) return true;
    if (/^[IVXLCDM]+\.\s+\S+/.test(t)) return true;
    if (/^\d+(?:\.\d+){0,3}\.?\s+\S+/.test(t) && !/^\d+\.\s*\d{3}/.test(t) && t.length <= 92) return true;
    const words = t.split(/\s+/);
    const alpha = t.replace(/[^a-zA-ZÀ-ỹ]/g, '');
    if (words.length >= 2 && alpha.length >= 6 && alpha === alpha.toUpperCase() && !/[.,;!?]$/.test(t)) return true;
    return false;
  }

  /**
   * PHÂN TÍCH MARKDOWN GEMINI THÀNH CÁC SECTION CHUẨN (Banner + Bảng thật + Callout + Đoạn văn sạch + Hyperlink thật)
   */
  function parseProseToSections(proseText, fallbackHeading) {
    const raw = String(proseText || '')
      .replace(/```json[\s\S]*?```/gi, '')
      .replace(/INVEST_INTEL_SYNC_V2[\s\S]*$/i, '')
      .trim();
    if (!raw) return [];
    const lines = raw.split(/\r?\n/);
    const secs = [];
    let cur = { heading: fallbackHeading, paragraphs: [], tables: [] };
    let i = 0;
    while (i < lines.length) {
      const ln = lines[i].trim();
      if (!ln || /^[-*_]{3,}$/.test(ln)) { i++; continue; }
      const hm = ln.match(/^(#{1,6})\s+(.+)$/);
      if (hm) {
        if (cur.paragraphs.length || cur.tables.length) secs.push(cur);
        const hEx = extractLinkFromRaw(hm[2]);
        cur = { heading: hEx.text, headingUrl: hEx.url || '', paragraphs: [], tables: [] };
        i++; continue;
      }
      if (!ln.includes('|') && isSmartInvestHeading(ln)) {
        if (cur.paragraphs.length || cur.tables.length) secs.push(cur);
        const hEx = extractLinkFromRaw(ln);
        cur = { heading: hEx.text, headingUrl: hEx.url || '', paragraphs: [], tables: [] };
        i++; continue;
      }
      if (ln.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1].trim())) {
        const parseR = (r) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => extractLinkFromRaw(c));
        const headers = parseR(ln).map((x) => x.text);
        i += 2;
        const rows = [];
        const rowUrls = [];
        while (i < lines.length && lines[i].trim().includes('|') && !/^#{1,6}\s/.test(lines[i].trim())) {
          const cells = parseR(lines[i].trim());
          rows.push(cells.map((x) => x.text));
          rowUrls.push((cells.find((x) => x.url) || {}).url || '');
          i++;
        }
        cur.tables.push({ headers, rows, rowUrls });
        continue;
      }
      const pEx = extractLinkFromRaw(ln.replace(/^[-•*]\s+/, '• '));
      cur.paragraphs.push(pEx.url ? { text: pEx.text, url: pEx.url } : pEx.text);
      i++;
    }
    if (cur.paragraphs.length || cur.tables.length) secs.push(cur);
    return secs;
  }

  function drawSectionsToPages(headerTitle, sections, opts) {
    const pages = [];
    const dark = opts.paperTheme === 'dark';
    const ff = FONT_MAP[opts.font] || FONT_MAP.sans;
    const sc = SIZE_SCALE[opts.size] || 1.05;
    const bodyPx = Math.round(20 * sc);
    const lineH = Math.round(bodyPx * 1.48);
    const maxW = 1096;
    const minY = 124;
    const maxY = 1656;

    let cur = createA4(dark);
    let y = minY;
    paintHeader(cur.ctx, headerTitle, ff);

    const ensure = (h) => {
      if (y + h > maxY) {
        pages.push(cur.canvas);
        cur = createA4(dark);
        paintHeader(cur.ctx, headerTitle, ff);
        y = minY;
      }
    };

    const drawTableBlock = (headers, rows, rowUrls = null) => {
      if (!rows.length) return;
      const cols = headers.length;
      const colW = Math.floor(maxW / cols);
      const drawHead = () => {
        ensure(48);
        cur.ctx.fillStyle = '#1b365d';
        cur.ctx.fillRect(72, y, maxW, 44);
        cur.ctx.fillStyle = '#ffffff';
        cur.ctx.font = `800 ${Math.round(17.5 * sc)}px ${ff}`;
        headers.forEach((h, ci) => cur.ctx.fillText(cleanStr(h).slice(0, 34), 84 + ci * colW, y + 11));
        y += 44;
      };
      drawHead();
      rows.forEach((row, ri) => {
        const linkUrl = Array.isArray(rowUrls) ? rowUrls[ri] : '';
        cur.ctx.font = `500 ${Math.round(17 * sc)}px ${ff}`;
        const cellLines = headers.map((_, ci) => wrapText(cur.ctx, String(row[ci] ?? '—'), colW - 22));
        const rowH = Math.max(40, Math.max(...cellLines.map((a) => a.length)) * Math.round(22 * sc) + (linkUrl ? 34 : 16));
        if (y + rowH > maxY) {
          pages.push(cur.canvas);
          cur = createA4(dark);
          paintHeader(cur.ctx, headerTitle, ff);
          y = minY;
          drawHead();
        }
        cur.ctx.fillStyle = ri % 2 === 0 ? (dark ? '#1e293b' : '#f8fafc') : (dark ? '#0f172a' : '#ffffff');
        cur.ctx.fillRect(72, y, maxW, rowH);
        cur.ctx.strokeStyle = dark ? '#334155' : '#cbd5e1';
        cur.ctx.strokeRect(72, y, maxW, rowH);
        cur.ctx.fillStyle = dark ? '#e2e8f0' : '#1e293b';
        cellLines.forEach((lines, ci) => {
          lines.forEach((ln, li) => cur.ctx.fillText(ln, 84 + ci * colW, y + 8 + li * Math.round(22 * sc)));
        });
        if (linkUrl && /^https?:\/\//i.test(linkUrl)) {
          cur.ctx.fillStyle = dark ? '#38bdf8' : '#0369a1';
          cur.ctx.font = `700 ${Math.round(14.5 * sc)}px ${ff}`;
          cur.ctx.fillText(`🔗 Bấm mở nguồn gốc: ${linkUrl.slice(0, 78)}`, 84, y + rowH - 24);
          if (!cur.canvas.__pdfLinks) cur.canvas.__pdfLinks = [];
          cur.canvas.__pdfLinks.push({ x: 72, y, w: maxW, h: rowH, url: linkUrl });
        }
        y += rowH;
      });
      y += 16;
    };

    for (const sec of sections) {
      if (sec.isDisclaimerBox) {
        ensure(96);
        y += 10;
        rr(cur.ctx, 72, y, maxW, 70, 12);
        cur.ctx.fillStyle = dark ? '#451a03' : '#fffbeb';
        cur.ctx.fill();
        cur.ctx.strokeStyle = '#f59e0b';
        cur.ctx.lineWidth = 2;
        cur.ctx.stroke();
        cur.ctx.fillStyle = dark ? '#fde68a' : '#92400e';
        cur.ctx.font = `800 ${Math.round(19 * sc)}px ${ff}`;
        cur.ctx.fillText(cleanStr(sec.paragraphs?.[0] || '⚠️ Tất cả thông tin, phân tích chỉ mang tính chất tham khảo.'), 94, y + 22);
        y += 84;
        continue;
      }
      ensure(76);
      y += 8;
      const g = cur.ctx.createLinearGradient(72, y, 72 + maxW, y);
      g.addColorStop(0, '#0b2239');
      g.addColorStop(0.7, '#163b63');
      g.addColorStop(1, '#0f4c68');
      rr(cur.ctx, 72, y, maxW, 50, 9);
      cur.ctx.fillStyle = g; cur.ctx.fill();
      cur.ctx.fillStyle = '#14b8a6'; cur.ctx.fillRect(72, y, 10, 50);
      cur.ctx.fillStyle = '#ffffff'; cur.ctx.font = `900 22px ${ff}`;
      cur.ctx.fillText(cleanStr(sec.heading).slice(0, 82), 96, y + 13);
      if (sec.headingUrl && /^https?:\/\//i.test(sec.headingUrl)) {
        if (!cur.canvas.__pdfLinks) cur.canvas.__pdfLinks = [];
        cur.canvas.__pdfLinks.push({ x: 72, y, w: maxW, h: 50, url: sec.headingUrl });
      }
      y += 64;

      if (sec.tableRows?.length) {
        drawTableBlock(sec.tableHeaders || ['Chỉ tiêu', 'Giá trị', 'Tác động / Nhận định'], sec.tableRows, sec.tableRowUrls || null);
      }
      if (Array.isArray(sec.tables)) {
        sec.tables.forEach((t) => drawTableBlock(t.headers, t.rows, t.rowUrls || null));
      }
      if (Array.isArray(sec.paragraphs)) {
        for (const p of sec.paragraphs) {
          const pObj = typeof p === 'object' && p !== null ? p : extractLinkFromRaw(p);
          const clean = cleanStr(pObj.text || '');
          const pUrl = /^https?:\/\//i.test(pObj.url || '') ? pObj.url : '';
          if (!clean) continue;
          cur.ctx.font = `500 ${bodyPx}px ${ff}`;
          const lines = wrapText(cur.ctx, clean, maxW);
          if (pUrl) ensure(lines.length * lineH + 34);
          const paraStartY = y;
          let paraStartPage = cur.canvas;
          for (const ln of lines) {
            ensure(lineH + 6);
            if (cur.canvas !== paraStartPage) {
              paraStartPage = cur.canvas;
            }
            cur.ctx.fillStyle = pUrl ? (dark ? '#38bdf8' : '#0369a1') : (dark ? '#e2e8f0' : '#1e293b');
            cur.ctx.font = `500 ${bodyPx}px ${ff}`;
            cur.ctx.fillText(ln, 72, y);
            y += lineH;
          }
          if (pUrl) {
            ensure(26);
            cur.ctx.fillStyle = dark ? '#38bdf8' : '#0369a1';
            cur.ctx.font = `700 ${Math.round(14.5 * sc)}px ${ff}`;
            cur.ctx.fillText(`🔗 Bấm mở nguồn: ${pUrl.slice(0, 82)}`, 72, y);
            y += 22;
            if (!cur.canvas.__pdfLinks) cur.canvas.__pdfLinks = [];
            cur.canvas.__pdfLinks.push({ x: 72, y: Math.min(paraStartY, y - 24), w: maxW, h: Math.max(30, y - paraStartY), url: pUrl });
          }
          y += 8;
        }
      }
    }
    pages.push(cur.canvas);
    return pages;
  }

  function loadCorsImageSafe(url, timeoutMs = 1100) {
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

  async function drawArticleVisualsPage(headlines, readerOpts) {
    if (!headlines || !headlines.length) return null;
    const featured = headlines.slice(0, 6);
    const loadedImgs = await Promise.all(
      featured.map((h) => loadCorsImageSafe(h.imageUrl || h.image || h.thumbnail || ''))
    );

    const { canvas, ctx } = createCanvas();
    const dark = readerOpts?.paperTheme === 'dark';
    const ff = resolveFontFamily(readerOpts?.font);
    ctx.fillStyle = dark ? '#0b1220' : '#ffffff';
    ctx.fillRect(0, 0, W, H);
    paintHeader(ctx, 'KHU VỰC HÌNH ẢNH & THẺ XEM TRƯỚC BÀI BÁO CHÍNH THỐNG', ff);

    ctx.fillStyle = dark ? '#94a3b8' : '#475569';
    ctx.font = `600 18px ${ff}`;
    ctx.fillText(`Tổng hợp trực quan ${featured.length} điểm tin tiêu biểu (bấm trực tiếp vào từng thẻ để mở bài báo gốc · danh mục đủ ${headlines.length} nguồn ở cuối báo cáo)`, 72, 114);

    canvas.__pdfLinks = canvas.__pdfLinks || [];
    const cardW = 532;
    const cardH = 468;
    const gapX = 32;
    const gapY = 26;
    const startY = 152;
    const accents = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#e11d48', '#0d9488'];

    featured.forEach((h, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 72 + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const accent = accents[idx % accents.length];

      rr(ctx, x, y, cardW, cardH, 16);
      ctx.fillStyle = dark ? '#111827' : '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = dark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Khung ảnh bài báo (nếu tải được ảnh thật thì vẽ cover-fit, nếu không thì dựng Banner Preview Tiêu đề sắc nét)
      const imgH = 216;
      ctx.save();
      rr(ctx, x + 2, y + 2, cardW - 4, imgH, 14);
      ctx.clip();
      const loaded = loadedImgs[idx];
      if (loaded) {
        try {
          const scale = Math.max((cardW - 4) / loaded.naturalWidth, imgH / loaded.naturalHeight);
          const dw = loaded.naturalWidth * scale;
          const dh = loaded.naturalHeight * scale;
          ctx.drawImage(loaded, x + 2 + (cardW - 4 - dw) / 2, y + 2 + (imgH - dh) / 2, dw, dh);
        } catch (_eImg) {
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
        ctx.font = `900 15px ${ff}`;
        ctx.fillText(`📰 ${(h.source || 'BÁO CHÍ CHÍNH THỐNG').toUpperCase().slice(0, 32)}`, x + 22, y + 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 22px ${ff}`;
        wrapText(ctx, cleanStr(h.title || ''), cardW - 48).slice(0, 4).forEach((ln, li) => {
          ctx.fillText(ln, x + 22, y + 66 + li * 31);
        });
      }
      ctx.restore();

      // Nội dung tiêu đề & tóm tắt bên dưới
      ctx.fillStyle = dark ? '#38bdf8' : '#0369a1';
      ctx.font = `800 14.5px ${ff}`;
      ctx.fillText(`${cleanStr(h.source || 'Nguồn chính thống').slice(0, 28)}  ·  ${cleanStr(h.date || '')}`, x + 18, y + imgH + 22);

      ctx.fillStyle = dark ? '#f8fafc' : '#0f172a';
      ctx.font = `900 19px ${ff}`;
      const titleLines = wrapText(ctx, cleanStr(h.title || ''), cardW - 36).slice(0, 3);
      titleLines.forEach((ln, li) => ctx.fillText(ln, x + 18, y + imgH + 50 + li * 26));

      const snipY = y + imgH + 56 + titleLines.length * 26;
      if (h.snippet) {
        ctx.fillStyle = dark ? '#cbd5e1' : '#475569';
        ctx.font = `500 15.5px ${ff}`;
        wrapText(ctx, cleanStr(h.snippet), cardW - 36).slice(0, 3).forEach((ln, li) => {
          ctx.fillText(ln, x + 18, snipY + li * 22);
        });
      }

      const rawUrl = String(h.url || h.link || h.official_url || '').trim();
      const normUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : (/^www\./i.test(rawUrl) ? `https://${rawUrl}` : '');
      if (normUrl) {
        ctx.fillStyle = dark ? '#34d399' : '#0d9488';
        ctx.font = `800 14.5px ${ff}`;
        ctx.fillText(`🔗 Bấm mở bài gốc: ${normUrl.slice(0, 44)}`, x + 18, y + cardH - 26);
        canvas.__pdfLinks.push({ x, y, w: cardW, h: cardH, url: normUrl });
      }
    });

    return canvas;
  }

  async function buildAllPagesForMode(mode, readerOpts) {
    const report = INV.stateManager.evaluationReport;
    const gold = INV.stateManager.goldData;
    const stock = INV.stateManager.stockData;
    const re = INV.stateManager.realEstateData;
    const reg = INV.stateManager.userRegion;
    const unified = INV.stateManager.unifiedAnalytics;
    const prose = INV.stateManager.geminiReportProse || '';

    // Hợp nhất 100% TẤT CẢ bài báo & trích dẫn mà code đã dò ra (KHÔNG cắt bớt!)
    const allDiscoveredRaw = [
      ...(report?.live_headlines || []),
      ...(re?.rssNews || []),
      ...(gold?.headlines || []),
      ...(stock?.news || []),
      ...(report?.items || [])
        .filter((it) => /^https?:\/\//i.test(String(it?.url || it?.official_url || '').trim()))
        .map((it) => ({
          title: it.title || it.plain_label || it.label || it.id,
          source: it.source || it.provider || 'Nguồn dữ liệu chính thống',
          date: it.as_of_date || report?.as_of_date || '',
          url: it.url || it.official_url,
          snippet: it.plain_explanation || it.impact || '',
        })),
    ];
    const seenHeadKeys = new Set();
    const headlines = [];
    for (const h of allDiscoveredRaw) {
      if (!h || !h.title) continue;
      const u = String(h.url || h.link || h.official_url || '').trim();
      const k = u ? u.toLowerCase() : String(h.title).trim().toLowerCase().slice(0, 80);
      if (seenHeadKeys.has(k)) continue;
      seenHeadKeys.add(k);
      headlines.push(h);
    }

    let modeMeta = { title: 'BÁO CÁO PHÂN TÍCH ĐẦU TƯ TỔNG QUÁT TOÀN DIỆN', slug: 'Tong_Quat' };
    let subtitle = `Khu vực: ${reg?.areaLabel || re?.areaLabel || 'Việt Nam'} · Ngày chốt: ${report?.as_of_date || new Date().toLocaleDateString('vi-VN')}`;
    const coverMetrics = [];
    const sections = [];
    const chartPages = [];

    if (mode === 'gold') {
      modeMeta = { title: 'BÁO CÁO PHÂN TÍCH GIÁ VÀNG CHUYÊN SÂU', slug: 'Gia_Vang' };
      coverMetrics.push(
        { label: 'Giá vàng thế giới (XAU/USD)', value: gold?.worldPriceUsd ? `$${Number(gold.worldPriceUsd).toFixed(1)}/oz` : 'Đang cập nhật', note: 'Chuẩn quốc tế' },
        { label: 'Vàng miếng SJC bán ra', value: gold?.sjcSellVnd ? `${(gold.sjcSellVnd / 1e6).toFixed(2)} tr/lượng` : 'Tham chiếu', note: 'Thị trường nội địa' },
        { label: 'Chênh lệch nội – ngoại', value: Number.isFinite(gold?.sjcEval?.diffRawPercent) ? `${gold.sjcEval.diffRawPercent.toFixed(2)}%` : 'Theo dõi', note: gold?.sjcEval?.premiumStatus?.badge || '' },
        { label: 'Tỷ giá USD/VND', value: gold?.vcbSellRate ? `${Math.round(gold.vcbSellRate).toLocaleString('vi-VN')} đ` : 'Tham chiếu', note: 'Quy đổi quy chuẩn' }
      );
      chartPages.push(drawSpecializedChartPage('gold', { gold, goldHist: report?.gold_history_30d }, readerOpts));
      sections.push({
        heading: '2. BẢNG ĐỐI CHIẾU GIÁ VÀNG THẾ GIỚI, SJC & CHỐT CHẶN RỦI RO',
        tableHeaders: ['Chỉ tiêu', 'Số liệu hiện tại', 'Tác động & Khuyến nghị'],
        tableRows: [
          ['Vàng thế giới (XAU/USD)', gold?.worldPriceUsd ? `$${Number(gold.worldPriceUsd).toFixed(2)}/oz` : '—', gold?.overallHeadline || 'Theo dõi lợi suất thực Mỹ & địa chính trị'],
          ['Vàng miếng SJC (Bán ra)', gold?.sjcSellVnd ? `${(gold.sjcSellVnd / 1e6).toFixed(2)} triệu/lượng` : '—', gold?.sjcEval?.premiumStatus?.text || 'Tránh mua đuổi khi chênh lệch nội-ngoại cao'],
          ['Spread Mua – Bán', Number.isFinite(gold?.sjcEval?.spreadPercent) ? `${gold.sjcEval.spreadPercent.toFixed(2)}%` : '—', gold?.sjcEval?.spreadStatus?.text || ''],
        ],
      });
    } else if (mode === 'stock') {
      if (!stock || !stock.symbol) {
        throw new Error('Bạn chưa chọn mã chứng khoán và chạy quét thông tin! Hãy vào tab Chứng khoán nhập mã (vd: FPT) và bấm kiểm tra trước.');
      }
      modeMeta = { title: `BÁO CÁO PHÂN TÍCH CỔ PHIẾU ${stock.symbol} CHUYÊN SÂU`, slug: `Chung_Khoan_${stock.symbol}` };
      subtitle = `${stock.companyName || stock.symbol} (${stock.exchange || 'HOSE'}) · Ngành: ${stock.industryName || stock.sector}`;
      coverMetrics.push(
        { label: `Thị giá ${stock.symbol}`, value: Number.isFinite(stock.price) ? `${Math.round(stock.price).toLocaleString('vi-VN')} ${stock.currency}` : '—', note: Number.isFinite(stock.changePct) ? `Biến động: ${stock.changePct >= 0 ? '+' : ''}${stock.changePct.toFixed(2)}%` : '' },
        { label: 'Định giá P/E · P/B', value: `${Number.isFinite(stock.pe) ? stock.pe.toFixed(2) + 'x' : '—'} · ${Number.isFinite(stock.pb) ? stock.pb.toFixed(2) + 'x' : '—'}`, note: Number.isFinite(stock.eps) ? `EPS: ${Math.round(stock.eps).toLocaleString('vi-VN')} đ` : '' },
        { label: 'Hiệu quả ROE · ROA', value: `${Number.isFinite(stock.roe) ? stock.roe.toFixed(1) + '%' : '—'} · ${Number.isFinite(stock.roa) ? stock.roa.toFixed(1) + '%' : '—'}`, note: Number.isFinite(stock.dividendYield) ? `Cổ tức: ${stock.dividendYield.toFixed(2)}%` : '' },
        { label: 'Tăng trưởng 5Y (DT / LN)', value: `${Number.isFinite(stock.rev5yGrowth) ? stock.rev5yGrowth.toFixed(1) + '%' : '—'} / ${Number.isFinite(stock.ni5yGrowth) ? stock.ni5yGrowth.toFixed(1) + '%' : '—'}`, note: Number.isFinite(stock.marketCap) ? `Vốn hóa: ${(stock.marketCap / 1e12).toFixed(2)} nghìn tỷ` : '' }
      );
      chartPages.push(drawSpecializedChartPage('stock', { stock }, readerOpts));
      sections.push({
        heading: `2. CHỈ SỐ TÀI CHÍNH SỐNG & PHÁP Y BCTC — ${stock.symbol}`,
        tableHeaders: ['Chỉ tiêu tài chính', 'Giá trị thực tế', 'Ý nghĩa đầu tư'],
        tableRows: [
          ['Giá & Vốn hóa', `${Number.isFinite(stock.price) ? Math.round(stock.price).toLocaleString('vi-VN') : '—'} ${stock.currency} · ${Number.isFinite(stock.marketCap) ? (stock.marketCap / 1e12).toFixed(2) + ' nghìn tỷ' : '—'}`, stock.liveSource?.name || ''],
          ['P/E · P/B · EV/EBITDA', `${Number.isFinite(stock.pe) ? stock.pe.toFixed(2) + 'x' : '—'} / ${Number.isFinite(stock.pb) ? stock.pb.toFixed(2) + 'x' : '—'} / ${Number.isFinite(stock.evEbitda) ? stock.evEbitda.toFixed(2) + 'x' : '—'}`, 'So sánh định giá với chi phí vốn & trung bình ngành'],
          ['ROE · ROA · Cổ tức', `${Number.isFinite(stock.roe) ? stock.roe.toFixed(2) + '%' : '—'} / ${Number.isFinite(stock.roa) ? stock.roa.toFixed(2) + '%' : '—'} / ${Number.isFinite(stock.dividendYield) ? stock.dividendYield.toFixed(2) + '%' : '—'}`, 'Chất lượng sinh lời & dòng tiền chia cổ đông'],
          ...(stock.sectorChecklist?.cards || []).map((c) => [c.title, c.value, c.hint]),
        ],
      });
    } else if (mode === 'real_estate') {
      const area = re?.areaLabel || reg?.areaLabel || 'Việt Nam';
      modeMeta = { title: 'BÁO CÁO PHÂN TÍCH NHÀ ĐẤT THEO KHU VỰC', slug: 'Nha_Dat' };
      subtitle = `Khu vực phân tích: ${area}`;
      coverMetrics.push(
        { label: 'Khu vực khảo sát', value: area.slice(0, 34), note: re?.sourceMode === 'gps' ? 'Định vị GPS' : 'Chọn khu vực' },
        { label: 'Mặt bằng giá bán', value: re?.liveStats ? `${re.liveStats.medianPpm2.toFixed(1)} tr/m²` : (re?.benchmark?.priceRangeM2 || '45 – 95 tr/m²'), note: 'Tham chiếu khu vực' },
        { label: 'Tỷ suất cho thuê', value: `${re?.benchmark?.aptYield || 3.2}%/năm`, note: re?.benchmark?.rentRangeMo || '10 – 18 tr/tháng' },
        { label: 'Lãi suất vay thả nổi', value: re?.benchmark?.mortgageRange || '12%–15%/năm', note: 'Kiểm tra sức chịu đựng dòng tiền' }
      );
      chartPages.push(drawSpecializedChartPage('real_estate', { re, area }, readerOpts));
      sections.push({
        heading: `2. MẶT BẰNG GIÁ, TIN RAO THỰC TẾ & CHECKLIST PHÁP LÝ TẠI ${area.toUpperCase()}`,
        paragraphs: [
          `Khu vực khảo sát: ${area}.`,
          re?.benchmark?.note || 'Kiểm tra quy hoạch 1/500, sổ hồng riêng, tỷ lệ vay không vượt quá 50% giá trị và đảm bảo dòng tiền dự phòng khi hết ưu đãi lãi vay thả nổi 12%–15%/năm.',
        ],
        tableHeaders: ['Tin rao / Hạng mục thực địa', 'Mức giá / Diện tích', 'Khu vực / Ghi chú'],
        tableRows: (re?.liveAds || []).length
          ? re.liveAds.map((a) => [a.title, `${a.price} ${a.size || ''}`, a.ppm2 || a.area || area])
          : [['Mặt bằng giá bán tham chiếu', re?.benchmark?.priceRangeM2 || '45 – 95 tr/m²', area], ['Mặt bằng giá thuê', re?.benchmark?.rentRangeMo || '10 – 18 tr/tháng', `Tỷ suất ~${re?.benchmark?.aptYield || 3.2}%/năm`]],
        tableRowUrls: (re?.liveAds || []).length
          ? re.liveAds.map((a) => /^https?:\/\//i.test(String(a.url || a.link || '').trim()) ? String(a.url || a.link).trim() : '')
          : null,
      });
    } else {
      // overview
      const ch = report?.channel_scores || {};
      const scores = [
        { label: 'Tiền mặt / Tiết kiệm', value: ch.cash?.score ?? 65, badge: ch.cash?.badge || 'Theo dõi' },
        { label: 'Vàng', value: ch.gold?.score ?? 65, badge: ch.gold?.badge || 'Theo dõi' },
        { label: 'Chứng khoán', value: ch.stock?.score ?? 60, badge: ch.stock?.badge || 'Theo dõi' },
        { label: 'Nhà đất', value: ch.real_estate?.score ?? 55, badge: ch.real_estate?.badge || 'Theo dõi' },
      ];
      scores.forEach((s) => coverMetrics.push({ label: s.label, value: `${s.value}/100`, note: s.badge }));
      chartPages.push(drawOverviewChartsPage(report, unified, readerOpts));
      const deepOverviewParagraphs = [
        `CHẨN ĐOÁN CHU KỲ & BỐI CẢNH VĨ MÔ HIỆN TẠI: ${report?.cycle_phase?.label || 'Đang chuyển pha thận trọng'} — ${report?.cycle_phase?.plain_advice || 'Thị trường đang đan xen giữa áp lực lãi suất thực duy trì ở mặt bằng cao, nợ công toàn cầu lập đỉnh và biến động địa chính trị khó lường. Trong bối cảnh này, nguyên tắc tối thượng là giữ kỷ luật bảo toàn sức mua, tránh dùng đòn bẩy cao và chỉ giải ngân vào tài sản có biên an toàn định giá rõ ràng.'}`,
        `1) CƠ CHẾ TRUYỀN DẪN DÒNG TIỀN LIÊN THỊ TRƯỜNG: Khi mặt bằng lãi suất thực và lợi suất trái phiếu chính phủ neo cao, chi phí vốn (Ke) của doanh nghiệp và chi phí vay mua bất động sản tăng mạnh, tạo lực cản trực tiếp lên nhóm tài sản tăng trưởng dựa vào đòn bẩy. Ngược lại, dòng tiền thông minh có xu hướng phân tầng: giữ một phần đệm Tiền mặt/Tiết kiệm (điểm hiện tại: ${ch.cash?.score ?? 65}/100 — ${ch.cash?.badge || 'Phòng thủ'}) để sẵn sàng chớp cơ hội khi thị trường điều chỉnh sâu, đồng thời sử dụng Vàng (${ch.gold?.score ?? 65}/100 — ${ch.gold?.badge || 'Trú ẩn'}) làm lớp bảo hiểm trước rủi ro tiền tệ và địa chính trị.`,
        `2) PHÂN TÍCH SÂU TỪNG KÊNH TÀI SẢN: • Tiền mặt / Tiết kiệm: ${ch.cash?.reason || 'Đóng vai trò vùng đệm thanh khoản thiết yếu, giúp nhà đầu tư không bao giờ bị ép bán tháo tài sản tốt trong nhịp rung lắc.'} • Vàng: ${ch.gold?.reason || 'Hưởng lợi từ nhu cầu trú ẩn của ngân hàng trung ương và rủi ro nợ công, nhưng cần kiểm soát chặt chênh lệch giá nội–ngoại SJC để tránh mua đuổi vùng đỉnh.'} • Chứng khoán (${ch.stock?.score ?? 60}/100): ${ch.stock?.reason || 'Chỉ nên chọn lọc doanh nghiệp đầu ngành có bảng cân đối sạch (nợ thấp, CFO > LNST, ROE bền vững) thay vì lướt sóng margin.'} • Nhà đất / BĐS (${ch.real_estate?.score ?? 55}/100): ${ch.real_estate?.reason || 'Ưu tiên tài sản pháp lý chuẩn 100% có dòng tiền cho thuê thực tế, tuyệt đối kiểm tra Stress Test khả năng trả nợ ở mức lãi suất thả nổi 12%–15%/năm.'}`,
        ...(report?.triggered_breakers || []).map((br) => `⚠️ CHỐT CHẶN RỦI RO ĐANG KÍCH HOẠT: ${br.title || br.name || ''} — ${br.detail || br.message || ''}`),
        ...(report?.narrative_summary?.opportunities || []).map((t) => `• Động lực & Cơ hội cốt lõi: ${t}`),
        ...(report?.narrative_summary?.risks || []).map((t) => `• Rủi ro trọng yếu cần kiểm soát: ${t}`),
        `3) KỊCH BẢN HÀNH ĐỘNG 6–12 THÁNG TỚI: Hiện tại: ${report?.narrative_summary?.current_outlook || 'Ưu tiên phòng thủ chủ động, giải ngân chia nhỏ từng phần (DCA) vào tài sản chất lượng cao.'} | Giai đoạn 6–12 tháng tới: ${report?.narrative_summary?.upcoming_outlook || 'Theo dõi sát tín hiệu hạ nhiệt lãi suất thực, mức thanh khoản toàn sàn và tiến độ phục hồi lợi nhuận doanh nghiệp để tăng tỷ trọng tài sản rủi ro đúng thời điểm.'}`,
      ].filter(Boolean);

      sections.push({
        heading: '2. PHÂN TÍCH TỔNG QUAN CHUYÊN SÂU: CHU KỲ VĨ MÔ, LIÊN THỊ TRƯỜNG & CHIẾN LƯỢC 4 KÊNH',
        paragraphs: deepOverviewParagraphs,
      });
      if ((report?.items || []).length) {
        const allAuditItems = report.items;
        sections.push({
          heading: `3. BẢNG KIỂM TOÁN ĐẦY ĐỦ ${allAuditItems.length} ĐỀ MỤC VĨ MÔ – VI MÔ ĐÃ QUÉT`,
          tableHeaders: ['Đề mục kiểm tra', 'Số liệu / Trạng thái', 'Tác động thị trường'],
          tableRows: allAuditItems.map((it) => [it.title || it.label || it.id, it.display_value || it.value || '—', it.plain_explanation || it.impact || '']),
          tableRowUrls: allAuditItems.map((it) => /^https?:\/\//i.test(String(it.url || it.official_url || '').trim()) ? String(it.url || it.official_url).trim() : ''),
        });
      }
    }

    const normalizeHttpUrl = (raw) => {
      const s = String(raw || '').trim();
      if (/^https?:\/\//i.test(s)) return s;
      if (/^www\./i.test(s)) return `https://${s}`;
      return '';
    };

    // TIN TỨC MỚI NHẤT & PHÂN TÍCH TÁC ĐỘNG (BẮT BUỘC CÓ Ở CẢ 4 CHẾ ĐỘ + CHÈN HYPERLINK BẤM TRỰC TIẾP!)
    if (headlines.length) {
      sections.push({
        heading: `TIN NÓNG VĨ MÔ, ĐỊA CHÍNH TRỊ & THỊ TRƯỜNG MỚI NHẤT (${headlines.length} NGUỒN BẤM MỞ TRỰC TIẾP)`,
        tableHeaders: ['Tin sự kiện mới nhất', 'Nguồn chính thống', 'Ngày & Phạm vi tác động'],
        tableRows: headlines.map((h) => [h.title, h.source || 'Báo chí chính thống', `${h.date || ''} · Tác động tâm lý dòng tiền & khẩu vị rủi ro`]),
        tableRowUrls: headlines.map((h) => normalizeHttpUrl(h.url || h.link || h.official_url || '')),
      });
    }

    // TOÀN VĂN BÀI PHÂN TÍCH CHUYÊN GIA GEMINI (Phân rã đầy đủ tiêu đề + bảng + đoạn văn!)
    if (prose) {
      const geminiSecs = parseProseToSections(prose, 'PHÂN TÍCH CHUYÊN SÂU TỪ CHUYÊN GIA GEMINI');
      geminiSecs.forEach((s) => sections.push(s));
    }

    // DÒNG LƯU Ý MIỄN TRỪ TRÁCH NHIỆM BẮT BUỘC Ở CUỐI MỌI BÁO CÁO
    sections.push({
      heading: 'LƯU Ý MIỄN TRỪ TRÁCH NHIỆM',
      isDisclaimerBox: true,
      paragraphs: ['⚠️ Tất cả thông tin, phân tích chỉ mang tính chất tham khảo.'],
    });

    const coverCanvas = drawCoverPage(modeMeta, subtitle, coverMetrics, readerOpts);
    const visualsPage = await drawArticleVisualsPage(headlines, readerOpts);
    const contentPages = drawSectionsToPages(modeMeta.title, sections, readerOpts);
    return { modeMeta, allPages: [coverCanvas, ...chartPages, ...(visualsPage ? [visualsPage] : []), ...contentPages] };
  }

  async function savePagesToPdf(allPages, slug) {
    const jsPDF = await ensureJsPdf();
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    allPages.forEach((cv, idx) => {
      if (idx > 0) pdf.addPage();
      pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
      // Gắn Hyperlink bấm được thật trên jsPDF cho từng bài báo nguồn!
      if (Array.isArray(cv.__pdfLinks)) {
        cv.__pdfLinks.forEach((lk) => {
          if (!lk?.url || !/^(https?:\/\/|mailto:)/i.test(String(lk.url))) return;
          const xPt = Math.max(0, (lk.x / 1240) * pw);
          const yPt = Math.max(0, (lk.y / 1754) * ph);
          const wPt = Math.min(pw - xPt, (lk.w / 1240) * pw);
          const hPt = Math.min(ph - yPt, (lk.h / 1754) * ph);
          if (wPt <= 2 || hPt <= 2) return;
          try { pdf.link(xPt, yPt, wPt, hPt, { url: String(lk.url) }); } catch (_eLk) {}
        });
      }
    });
    const stamp = new Date().toISOString().slice(0, 10);
    pdf.save(`DauTuHomNay_${slug}_${stamp}.pdf`);
  }

  /**
   * MỞ CỬA SỔ XEM TRƯỚC CUỘN DỌC TỪNG TRANG A4 TRƯỚC KHI TẢI PDF (ĐỔI CỠ CHỮ / PHÔNG / NỀN TRỰC TIẾP!)
   */
  async function previewAndExportInvestPdf(mode = 'overview', opts = {}) {
    let curOpts = {
      font: opts.font || 'sans',
      size: opts.size || 'lg',
      paperTheme: opts.paperTheme || 'light',
    };
    let built = await buildAllPagesForMode(mode, curOpts);

    document.getElementById('inv-pdf-live-preview-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'inv-pdf-live-preview-modal';
    modal.className = 'fixed inset-0 z-[2147483645] bg-black/90 backdrop-blur-md flex flex-col text-zinc-100';
    modal.innerHTML = `
      <div class="px-3 py-2.5 bg-[#0f2942] border-b border-teal-500/50 flex flex-wrap items-center justify-between gap-2 shrink-0 max-w-full overflow-x-hidden">
        <div class="min-w-0 flex-1">
          <div class="text-xs sm:text-base font-black text-white truncate">👁️ Xem Trước PDF (${built.allPages.length} trang) — ${built.modeMeta.title}</div>
          <div class="text-[11px] text-teal-200 truncate">Bìa · Biểu đồ · Tin tức bấm mở link trực tiếp · Phân tích chuyên sâu</div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5 shrink-0">
          <select id="inv-pv-size" class="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-600 text-[11px] font-bold">
            <option value="md" ${curOpts.size === 'md' ? 'selected' : ''}>Vừa</option>
            <option value="lg" ${curOpts.size === 'lg' ? 'selected' : ''}>Lớn</option>
            <option value="xl" ${curOpts.size === 'xl' ? 'selected' : ''}>Rất lớn</option>
            <option value="xxl" ${curOpts.size === 'xxl' ? 'selected' : ''}>Cực đại</option>
          </select>
          <select id="inv-pv-font" class="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-600 text-[11px] font-bold">
            <option value="sans" ${curOpts.font === 'sans' ? 'selected' : ''}>Sans</option>
            <option value="serif" ${curOpts.font === 'serif' ? 'selected' : ''}>Serif</option>
            <option value="classic" ${curOpts.font === 'classic' ? 'selected' : ''}>Classic</option>
            <option value="mono" ${curOpts.font === 'mono' ? 'selected' : ''}>Mono</option>
          </select>
          <select id="inv-pv-theme" class="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-600 text-[11px] font-bold">
            <option value="light" ${curOpts.paperTheme === 'light' ? 'selected' : ''}>☀️ Sáng</option>
            <option value="dark" ${curOpts.paperTheme === 'dark' ? 'selected' : ''}>🌙 Tối</option>
          </select>
          <button type="button" id="inv-pv-download" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-lg cursor-pointer">⬇️ Tải PDF</button>
          <button type="button" id="inv-pv-close" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer">✕ Đóng</button>
        </div>
      </div>
      <div id="inv-pv-pages-scroll" class="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5 flex flex-col items-center bg-zinc-950/95"></div>
    `;
    document.body.appendChild(modal);

    const renderPreviewSheets = () => {
      const box = modal.querySelector('#inv-pv-pages-scroll');
      if (!box) return;
      box.innerHTML = '';
      built.allPages.forEach((cv, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'w-full max-w-[820px] space-y-1.5';
        const lbl = document.createElement('div');
        lbl.className = 'text-xs font-extrabold text-teal-300 text-center';
        lbl.textContent = `— Trang ${idx + 1} / ${built.allPages.length} —`;
        const sheetBox = document.createElement('div');
        sheetBox.className = 'relative w-full overflow-hidden rounded-[10px] shadow-[0_14px_40px_rgba(0,0,0,0.65)]';
        cv.style.display = 'block';
        cv.style.width = '100%';
        cv.style.height = 'auto';
        sheetBox.appendChild(cv);
        if (Array.isArray(cv.__pdfLinks) && cv.__pdfLinks.length) {
          const linkLayer = document.createElement('div');
          linkLayer.className = 'absolute inset-0 pointer-events-none';
          cv.__pdfLinks.forEach((lk) => {
            if (!lk?.url || !/^(https?:\/\/|mailto:)/i.test(String(lk.url))) return;
            const a = document.createElement('a');
            a.href = String(lk.url);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.title = `Bấm để mở nguồn gốc: ${lk.url}`;
            a.setAttribute('aria-label', `Mở nguồn gốc ${lk.url}`);
            a.className = 'block pointer-events-auto cursor-pointer rounded transition-colors hover:bg-cyan-400/15 hover:ring-2 hover:ring-cyan-400/60 active:bg-cyan-400/25';
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
    };
    renderPreviewSheets();

    const rebuild = async () => {
      curOpts = {
        size: modal.querySelector('#inv-pv-size')?.value || 'lg',
        font: modal.querySelector('#inv-pv-font')?.value || 'sans',
        paperTheme: modal.querySelector('#inv-pv-theme')?.value || 'light',
      };
      built = await buildAllPagesForMode(mode, curOpts);
      renderPreviewSheets();
    };
    modal.querySelector('#inv-pv-size')?.addEventListener('change', rebuild);
    modal.querySelector('#inv-pv-font')?.addEventListener('change', rebuild);
    modal.querySelector('#inv-pv-theme')?.addEventListener('change', rebuild);
    modal.querySelector('#inv-pv-close')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#inv-pv-download')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      btn.disabled = true;
      btn.textContent = '⏳ Đang lưu file PDF...';
      try {
        await savePagesToPdf(built.allPages, built.modeMeta.slug);
        globalScope.NoirStudio?.utils?.showToast?.(`✅ Đã tải Báo cáo PDF (${built.allPages.length} trang) thành công!`, 'success', 4000);
        modal.remove();
      } catch (err) {
        globalScope.NoirStudio?.utils?.showToast?.('⚠️ ' + (err?.message || err), 'error', 4000);
        btn.disabled = false;
        btn.textContent = '⬇️ Tải File PDF Ngay';
      }
    });
    return { ok: true, pages: built.allPages.length, mode };
  }

  async function exportInvestPdf(mode = 'overview', opts = {}) {
    return previewAndExportInvestPdf(mode, opts);
  }

  INV.pdfExporter = { exportInvestPdf, previewAndExportInvestPdf };
})(typeof window !== 'undefined' ? window : globalThis);
