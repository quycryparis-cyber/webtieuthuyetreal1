/**
 * ============================================================================
 * 📄 ĐẦU TƯ HÔM NAY — EXECUTIVE FINANCIAL REPORT PDF EXPORTER (v134.0)
 * ============================================================================
 * - 4 chế độ xuất chuyên biệt:
 *   1) overview    — Báo cáo Phân tích Đầu tư Tổng quát (4 kênh + Biểu đồ + Gemini)
 *   2) gold        — Báo cáo Phân tích Giá Vàng (Thế giới, SJC, Chênh lệch & Khuyến nghị)
 *   3) stock       — Báo cáo Phân tích Chứng khoán (Chỉ số sống Simplize + Pháp y BCTC)
 *   4) real_estate — Báo cáo Phân tích Nhà đất theo khu vực thực tế + Stress Test lãi vay
 * - Thiết kế Báo Cáo Tài Chính Xanh Navy–Teal chuẩn Mod 50, tùy chỉnh Phông chữ, 4 Cỡ chữ & Nền Sáng/Tối.
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
  const SIZE_SCALE = { md: 0.92, lg: 1.04, xl: 1.16, xxl: 1.28 };

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

  function wrapText(ctx, text, maxW) {
    const words = String(text || '').replace(/\*/g, '').replace(/`/g, '').trim().split(/\s+/).filter(Boolean);
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

    rr(ctx, 84, 110, 440, 48, 24);
    ctx.fillStyle = 'rgba(20,184,166,0.22)';
    ctx.fill();
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#5eead4';
    ctx.font = `800 20px ${ff}`;
    ctx.fillText('BÁO CÁO PHÂN TÍCH ĐẦU TƯ CHUYÊN GIA', 110, 123);

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 54px ${ff}`;
    let ty = 215;
    wrapText(ctx, modeMeta.title, W - 180).forEach((ln) => {
      ctx.fillText(ln, 84, ty);
      ty += 68;
    });

    ctx.fillStyle = '#cbd5e1';
    ctx.font = `600 26px ${ff}`;
    wrapText(ctx, subtitle, W - 180).slice(0, 3).forEach((ln) => {
      ctx.fillText(ln, 84, ty + 16);
      ty += 38;
    });

    // Metric cards on cover
    const cardTop = Math.max(540, ty + 64);
    const colW = 516;
    metrics.slice(0, 6).forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 84 + col * (colW + 40);
      const y = cardTop + row * 176;
      rr(ctx, x, y, colW, 148, 18);
      ctx.fillStyle = 'rgba(15,23,42,0.58)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(45,212,191,0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = `700 19px ${ff}`;
      ctx.fillText(String(m.label || ''), x + 26, y + 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 32px ${ff}`;
      wrapText(ctx, String(m.value || '—'), colW - 52).slice(0, 1).forEach((vln) => {
        ctx.fillText(vln, x + 26, y + 60);
      });
      ctx.fillStyle = '#5eead4';
      ctx.font = `600 17px ${ff}`;
      wrapText(ctx, String(m.note || ''), colW - 52).slice(0, 1).forEach((nln) => {
        ctx.fillText(nln, x + 26, y + 106);
      });
    });

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = `600 20px ${ff}`;
    ctx.fillText(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} · Sổ Tay Tiểu Thuyết Của Bi — Đầu Tư Hôm Nay (v134)`, 84, H - 96);
    return canvas;
  }

  function drawSectionsToPages(headerTitle, sections, opts) {
    const pages = [];
    const dark = opts.paperTheme === 'dark';
    const ff = FONT_MAP[opts.font] || FONT_MAP.sans;
    const sc = SIZE_SCALE[opts.size] || 1.04;
    const bodyPx = Math.round(21 * sc);
    const lineH = Math.round(bodyPx * 1.48);
    const maxW = 1096;
    const minY = 128;
    const maxY = 1650;

    let cur = createA4(dark);
    let y = minY;

    const paintHeader = (ctx) => {
      ctx.fillStyle = '#0f2942';
      ctx.fillRect(0, 0, 1240, 96);
      ctx.fillStyle = '#14b8a6';
      ctx.fillRect(0, 92, 1240, 4);
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 28px ${ff}`;
      ctx.textBaseline = 'middle';
      ctx.fillText(headerTitle, 72, 48);
      ctx.textBaseline = 'top';
    };
    paintHeader(cur.ctx);

    const ensure = (h) => {
      if (y + h > maxY) {
        pages.push(cur.canvas);
        cur = createA4(dark);
        paintHeader(cur.ctx);
        y = minY;
      }
    };

    for (const sec of sections) {
      ensure(80);
      y += 8;
      const g = cur.ctx.createLinearGradient(72, y, 72 + maxW, y);
      g.addColorStop(0, '#0b2239');
      g.addColorStop(0.7, '#163b63');
      g.addColorStop(1, '#0f4c68');
      rr(cur.ctx, 72, y, maxW, 52, 9);
      cur.ctx.fillStyle = g;
      cur.ctx.fill();
      cur.ctx.fillStyle = '#14b8a6';
      cur.ctx.fillRect(72, y, 10, 52);
      cur.ctx.fillStyle = '#ffffff';
      cur.ctx.font = `900 23px ${ff}`;
      cur.ctx.fillText(String(sec.heading || '').replace(/\*/g, ''), 96, y + 13);
      y += 66;

      if (Array.isArray(sec.bars) && sec.bars.length) {
        for (const b of sec.bars) {
          ensure(54);
          const pct = Math.max(0, Math.min(100, Number(b.value) || 0));
          cur.ctx.fillStyle = dark ? '#e2e8f0' : '#0f172a';
          cur.ctx.font = `800 ${Math.round(19 * sc)}px ${ff}`;
          cur.ctx.fillText(`${b.label}`, 72, y);
          cur.ctx.fillStyle = b.color || '#0d9488';
          cur.ctx.fillText(`${pct}/100`, 1080, y);
          rr(cur.ctx, 72, y + 26, 980, 16, 8);
          cur.ctx.fillStyle = dark ? '#1e293b' : '#e2e8f0';
          cur.ctx.fill();
          rr(cur.ctx, 72, y + 26, Math.round((pct / 100) * 980), 16, 8);
          cur.ctx.fillStyle = b.color || '#0d9488';
          cur.ctx.fill();
          y += 54;
        }
      }

      if (Array.isArray(sec.tableRows) && sec.tableRows.length) {
        const cols = sec.tableHeaders || ['Chỉ tiêu', 'Giá trị', 'Nhận định'];
        const colW = Math.floor(maxW / cols.length);
        const drawHead = () => {
          ensure(50);
          cur.ctx.fillStyle = '#1b365d';
          cur.ctx.fillRect(72, y, maxW, 44);
          cur.ctx.fillStyle = '#ffffff';
          cur.ctx.font = `800 ${Math.round(18 * sc)}px ${ff}`;
          cols.forEach((h, ci) => cur.ctx.fillText(String(h), 84 + ci * colW, y + 11));
          y += 44;
        };
        drawHead();
        sec.tableRows.forEach((row, ri) => {
          cur.ctx.font = `600 ${Math.round(17.5 * sc)}px ${ff}`;
          const cellLines = cols.map((_, ci) => wrapText(cur.ctx, String(row[ci] ?? '—'), colW - 22));
          const rowH = Math.max(40, Math.max(...cellLines.map((a) => a.length)) * Math.round(23 * sc) + 16);
          if (y + rowH > maxY) {
            pages.push(cur.canvas);
            cur = createA4(dark);
            paintHeader(cur.ctx);
            y = minY;
            drawHead();
          }
          cur.ctx.fillStyle = ri % 2 === 0 ? (dark ? '#1e293b' : '#f8fafc') : (dark ? '#0f172a' : '#ffffff');
          cur.ctx.fillRect(72, y, maxW, rowH);
          cur.ctx.strokeStyle = dark ? '#334155' : '#cbd5e1';
          cur.ctx.strokeRect(72, y, maxW, rowH);
          cur.ctx.fillStyle = dark ? '#e2e8f0' : '#1e293b';
          cellLines.forEach((lines, ci) => {
            lines.forEach((ln, li) => {
              cur.ctx.fillText(ln, 84 + ci * colW, y + 9 + li * Math.round(23 * sc));
            });
          });
          y += rowH;
        });
        y += 14;
      }

      if (Array.isArray(sec.paragraphs)) {
        cur.ctx.font = `500 ${bodyPx}px ${ff}`;
        for (const p of sec.paragraphs) {
          const clean = String(p || '').replace(/\*/g, '').replace(/`/g, '').trim();
          if (!clean) continue;
          const lines = wrapText(cur.ctx, clean, maxW);
          for (const ln of lines) {
            ensure(lineH + 6);
            cur.ctx.fillStyle = dark ? '#e2e8f0' : '#1e293b';
            cur.ctx.font = `500 ${bodyPx}px ${ff}`;
            cur.ctx.fillText(ln, 72, y);
            y += lineH;
          }
          y += 8;
        }
      }
    }

    pages.push(cur.canvas);
    return pages;
  }

  async function exportInvestPdf(mode = 'overview', opts = {}) {
    const jsPDF = await ensureJsPdf();
    const report = INV.stateManager.evaluationReport;
    const gold = INV.stateManager.goldData;
    const stock = INV.stateManager.stockData;
    const re = INV.stateManager.realEstateData;
    const reg = INV.stateManager.userRegion;
    const unified = INV.stateManager.unifiedAnalytics;
    const prose = INV.stateManager.geminiReportProse || '';

    const readerOpts = {
      font: opts.font || 'sans',
      size: opts.size || 'lg',
      paperTheme: opts.paperTheme || 'light',
    };

    let modeMeta = { title: 'BÁO CÁO ĐẦU TƯ TỔNG QUÁT', slug: 'Tong_Quat' };
    let subtitle = `Khu vực: ${reg?.areaLabel || re?.areaLabel || 'Việt Nam'} · Ngày chốt: ${report?.as_of_date || new Date().toLocaleDateString('vi-VN')}`;
    const coverMetrics = [];
    const sections = [];

    if (mode === 'gold') {
      modeMeta = { title: 'BÁO CÁO PHÂN TÍCH GIÁ VÀNG CHUYÊN SÂU', slug: 'Gia_Vang' };
      coverMetrics.push(
        { label: 'Giá vàng thế giới (XAU/USD)', value: gold?.worldPriceUsd ? `$${Number(gold.worldPriceUsd).toFixed(1)}/oz` : 'Đang cập nhật', note: 'Chuẩn quốc tế' },
        { label: 'Vàng miếng SJC bán ra', value: gold?.sjcSellVnd ? `${(gold.sjcSellVnd / 1e6).toFixed(2)} tr/lượng` : 'Tham chiếu', note: 'Thị trường nội địa' },
        { label: 'Chênh lệch nội – ngoại', value: Number.isFinite(gold?.sjcEval?.diffRawPercent) ? `${gold.sjcEval.diffRawPercent.toFixed(2)}%` : 'Theo dõi', note: gold?.sjcEval?.premiumStatus?.badge || '' },
        { label: 'Tỷ giá USD/VND', value: gold?.vcbSellRate ? `${Math.round(gold.vcbSellRate).toLocaleString('vi-VN')} đ` : 'Tham chiếu', note: 'Quy đổi quy chuẩn' }
      );
      sections.push({
        heading: '1. BẢNG ĐỐI CHIẾU GIÁ VÀNG THẾ GIỚI & NỘI ĐỊA',
        tableHeaders: ['Chỉ tiêu', 'Số liệu hiện tại', 'Đánh giá'],
        tableRows: [
          ['Vàng thế giới (XAU/USD)', gold?.worldPriceUsd ? `$${Number(gold.worldPriceUsd).toFixed(2)}/oz` : '—', gold?.overallHeadline || 'Theo dõi xu hướng'],
          ['Vàng miếng SJC (Bán ra)', gold?.sjcSellVnd ? `${(gold.sjcSellVnd / 1e6).toFixed(2)} triệu/lượng` : '—', gold?.sjcEval?.premiumStatus?.text || ''],
          ['Chênh lệch Mua – Bán (Spread)', Number.isFinite(gold?.sjcEval?.spreadPercent) ? `${gold.sjcEval.spreadPercent.toFixed(2)}%` : '—', gold?.sjcEval?.spreadStatus?.text || ''],
        ],
      });
    } else if (mode === 'stock') {
      if (!stock || !stock.symbol) {
        throw new Error('Bạn chưa chọn mã chứng khoán và chạy quét thông tin! Hãy vào tab Chứng khoán, nhập mã (vd: FPT) và bấm kiểm tra trước.');
      }
      modeMeta = { title: `BÁO CÁO PHÂN TÍCH CỔ PHIẾU ${stock.symbol}`, slug: `Chung_Khoan_${stock.symbol}` };
      subtitle = `${stock.companyName || stock.symbol} (${stock.exchange || 'HOSE'}) · Ngành: ${stock.industryName || stock.sector}`;
      coverMetrics.push(
        { label: `Thị giá ${stock.symbol}`, value: Number.isFinite(stock.price) ? `${Math.round(stock.price).toLocaleString('vi-VN')} ${stock.currency}` : '—', note: Number.isFinite(stock.changePct) ? `Biến động: ${stock.changePct >= 0 ? '+' : ''}${stock.changePct.toFixed(2)}%` : '' },
        { label: 'Định giá P/E · P/B', value: `${Number.isFinite(stock.pe) ? stock.pe.toFixed(2) + 'x' : '—'} · ${Number.isFinite(stock.pb) ? stock.pb.toFixed(2) + 'x' : '—'}`, note: Number.isFinite(stock.eps) ? `EPS: ${Math.round(stock.eps).toLocaleString('vi-VN')} đ` : '' },
        { label: 'Hiệu quả ROE · ROA', value: `${Number.isFinite(stock.roe) ? stock.roe.toFixed(1) + '%' : '—'} · ${Number.isFinite(stock.roa) ? stock.roa.toFixed(1) + '%' : '—'}`, note: Number.isFinite(stock.dividendYield) ? `Cổ tức tiền mặt: ${stock.dividendYield.toFixed(2)}%` : '' },
        { label: 'Tăng trưởng 5 năm (DT / LN)', value: `${Number.isFinite(stock.rev5yGrowth) ? stock.rev5yGrowth.toFixed(1) + '%' : '—'} / ${Number.isFinite(stock.ni5yGrowth) ? stock.ni5yGrowth.toFixed(1) + '%' : '—'}`, note: Number.isFinite(stock.marketCap) ? `Vốn hóa: ${(stock.marketCap / 1e12).toFixed(2)} nghìn tỷ` : '' }
      );
      sections.push({
        heading: `1. CHỈ SỐ TÀI CHÍNH SỐNG CỦA ${stock.symbol}`,
        tableHeaders: ['Chỉ tiêu tài chính', 'Giá trị thực tế', 'Ghi chú'],
        tableRows: [
          ['Giá hiện tại', Number.isFinite(stock.price) ? `${Math.round(stock.price).toLocaleString('vi-VN')} ${stock.currency}` : '—', stock.liveSource?.name || ''],
          ['Vốn hóa thị trường', Number.isFinite(stock.marketCap) ? `${(stock.marketCap / 1e12).toFixed(2)} nghìn tỷ VND` : '—', stock.exchange || ''],
          ['P/E & P/B', `${Number.isFinite(stock.pe) ? stock.pe.toFixed(2) + 'x' : '—'} / ${Number.isFinite(stock.pb) ? stock.pb.toFixed(2) + 'x' : '—'}`, Number.isFinite(stock.evEbitda) ? `EV/EBITDA: ${stock.evEbitda.toFixed(2)}x` : ''],
          ['ROE & ROA', `${Number.isFinite(stock.roe) ? stock.roe.toFixed(2) + '%' : '—'} / ${Number.isFinite(stock.roa) ? stock.roa.toFixed(2) + '%' : '—'}`, 'Hiệu suất sinh lời trên vốn'],
          ['Tăng trưởng 5 năm (DT / LNST)', `${Number.isFinite(stock.rev5yGrowth) ? stock.rev5yGrowth.toFixed(1) + '%' : '—'} / ${Number.isFinite(stock.ni5yGrowth) ? stock.ni5yGrowth.toFixed(1) + '%' : '—'}`, 'CAGR 5 năm gần nhất'],
        ],
      });
      if (stock.sectorChecklist?.cards?.length) {
        sections.push({
          heading: '2. BỘ LỌC PHÁP Y BCTC & CHECKLIST NGÀNH',
          tableHeaders: ['Hạng mục kiểm tra', 'Giá trị / Mốc', 'Ý nghĩa phân tích'],
          tableRows: stock.sectorChecklist.cards.map((c) => [c.title, c.value, c.hint]),
        });
      }
    } else if (mode === 'real_estate') {
      const area = re?.areaLabel || reg?.areaLabel || 'Việt Nam';
      modeMeta = { title: 'BÁO CÁO PHÂN TÍCH NHÀ ĐẤT THEO KHU VỰC', slug: 'Nha_Dat' };
      subtitle = `Khu vực phân tích: ${area}`;
      coverMetrics.push(
        { label: 'Khu vực khảo sát', value: area.slice(0, 34), note: re?.sourceMode === 'gps' ? 'Định vị GPS' : 'Chọn khu vực' },
        { label: 'Mặt bằng giá bán', value: re?.liveStats ? `${re.liveStats.medianPpm2.toFixed(1)} tr/m²` : (re?.benchmark?.priceRangeM2 || '45 – 95 tr/m²'), note: 'Tham chiếu khu vực' },
        { label: 'Tỷ suất cho thuê', value: `${re?.benchmark?.aptYield || 3.2}%/năm`, note: re?.benchmark?.rentRangeMo || '10 – 18 tr/tháng' },
        { label: 'Lãi suất vay thả nổi', value: re?.benchmark?.mortgageRange || '12%–15%/năm', note: 'Cần kiểm tra sức chịu đựng dòng tiền' }
      );
      sections.push({
        heading: `1. MẶT BẰNG GIÁ & DÒNG TIỀN TẠI ${area.toUpperCase()}`,
        paragraphs: [
          `Khu vực phân tích: ${area}.`,
          re?.benchmark?.note || 'Luôn đối chiếu quy hoạch 1/500, sổ hồng riêng và kiểm tra sức chịu đựng dòng tiền khi hết ưu đãi lãi vay thả nổi 12%–15%/năm.',
        ],
      });
    } else {
      // overview
      const ch = report?.channel_scores || {};
      const scores = [
        { label: 'Tiền mặt / Tiết kiệm', value: ch.cash?.score ?? 65, color: '#0ea5e9', badge: ch.cash?.badge || 'Theo dõi' },
        { label: 'Vàng', value: ch.gold?.score ?? 65, color: '#f59e0b', badge: ch.gold?.badge || 'Theo dõi' },
        { label: 'Chứng khoán', value: ch.stock?.score ?? 60, color: '#8b5cf6', badge: ch.stock?.badge || 'Theo dõi' },
        { label: 'Nhà đất', value: ch.real_estate?.score ?? 55, color: '#10b981', badge: ch.real_estate?.badge || 'Theo dõi' },
      ];
      scores.forEach((s) => coverMetrics.push({ label: s.label, value: `${s.value}/100`, note: s.badge }));
      sections.push({
        heading: '1. BIỂU ĐỒ CHẤM ĐIỂM HẤP DẪN 4 KÊNH ĐẦU TƯ (THANG 100)',
        bars: scores,
      });
      if (report?.narrative_summary) {
        sections.push({
          heading: '2. CƠ HỘI, RỦI RO & TRIỂN VỌNG CHU KỲ',
          paragraphs: [
            `Pha chu kỳ hiện tại: ${report.cycle_phase?.label || ''} — ${report.cycle_phase?.plain_advice || ''}`,
            ...(report.narrative_summary.opportunities || []).map((t) => `• Cơ hội: ${t}`),
            ...(report.narrative_summary.risks || []).map((t) => `• Rủi ro: ${t}`),
            report.narrative_summary.current_outlook ? `Hiện tại: ${report.narrative_summary.current_outlook}` : '',
            report.narrative_summary.upcoming_outlook ? `6–12 tháng tới: ${report.narrative_summary.upcoming_outlook}` : '',
          ],
        });
      }
      if (unified?.risk_radar?.length) {
        sections.push({
          heading: '3. BẢN ĐỒ 6 MỨC ĐỘ RỦI RO (THANG 0–100)',
          bars: unified.risk_radar.map((r) => ({
            label: r.label,
            value: Number(r.level) || 50,
            color: Number(r.level) >= 75 ? '#f43f5e' : Number(r.level) >= 50 ? '#f59e0b' : '#10b981',
          })),
        });
      }
    }

    if (prose) {
      sections.push({
        heading: 'PHÂN TÍCH CHUYÊN SÂU TỪ GEMINI',
        paragraphs: prose.split(/\r?\n/).filter((l) => l.trim() && !/^[-|:\s]+$/.test(l)),
      });
    }

    const coverCanvas = drawCoverPage(modeMeta, subtitle, coverMetrics, readerOpts);
    const contentPages = drawSectionsToPages(modeMeta.title, sections, readerOpts);
    const allPages = [coverCanvas, ...contentPages];

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    allPages.forEach((cv, idx) => {
      if (idx > 0) pdf.addPage();
      pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
    });
    const stamp = new Date().toISOString().slice(0, 10);
    pdf.save(`DauTuHomNay_${modeMeta.slug}_${stamp}.pdf`);
    return { ok: true, pages: allPages.length, mode };
  }

  INV.pdfExporter = { exportInvestPdf };
})(typeof window !== 'undefined' ? window : globalThis);
