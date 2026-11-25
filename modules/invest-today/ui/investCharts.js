/**
 * ============================================================================
 * 📊 ĐẦU TƯ HÔM NAY — BỘ BIỂU ĐỒ SVG TRỰC QUAN (0 KB DEPENDENCY, ZERO-IDLE RAM)
 * File: modules/invest-today/ui/investCharts.js
 * ============================================================================
 * - Biểu đồ Vàng 30 ngày sống (XAU/USD + MA7/MA20 + RSI14) & So sánh SJC / Nhẫn / Thế giới
 * - Biểu đồ Chứng khoán Pháp y (Doanh thu vs LNST vs Dòng tiền thật CFO)
 * - Biểu đồ Nhà đất (Lợi suất thuê vs Tiết kiệm 12T vs Lãi vay thả nổi + Lịch sử khảo sát)
 * ============================================================================
 */
(function initInvestCharts(globalScope) {
  'use strict';

  const INV = (globalScope.NoirInvestToday = globalScope.NoirInvestToday || {});

  function esc(s) {
    return INV.utils?.escapeHtml ? INV.utils.escapeHtml(s) : String(s ?? '');
  }

  function renderGoldChartsHtml(goldSnap, hist30d) {
    const parts = [];

    // Chart 1: 30-day Live Gold XAU/USD Trend + MA7/MA20
    if (hist30d?.points?.length >= 5) {
      const pts = hist30d.points;
      const ind = hist30d.indicators || {};
      const closes = pts.map((p) => p.close);
      const minV = Math.min(...closes);
      const maxV = Math.max(...closes);
      const span = Math.max(1, maxV - minV);
      const W = 520;
      const H = 155;
      const padL = 46;
      const padR = 14;
      const padT = 16;
      const padB = 24;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      const xOf = (i) => padL + (i / Math.max(1, pts.length - 1)) * plotW;
      const yOf = (v) => padT + plotH - ((v - minV) / span) * plotH;

      const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.close).toFixed(1)}`).join(' ');
      const areaPath = `${linePath} L${xOf(pts.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${xOf(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

      // MA7 line
      const ma7Coords = [];
      for (let i = 6; i < pts.length; i++) {
        const avg = closes.slice(i - 6, i + 1).reduce((s, v) => s + v, 0) / 7;
        ma7Coords.push(`${ma7Coords.length === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(avg).toFixed(1)}`);
      }
      const chgPct = ind.changePeriodPct;
      const rsiTxt = Number.isFinite(ind.rsi14) ? `RSI(14): ${ind.rsi14.toFixed(0)} ${ind.rsi14 > 70 ? '(Quá mua!)' : ind.rsi14 < 30 ? '(Quá bán)' : '(Cân bằng)'}` : '';

      parts.push(`
        <div class="inv-card" style="padding:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
            <strong style="font-size:12.5px;">📈 Diễn biến Vàng thế giới 30 ngày gần nhất (Live XAU/PAXG)</strong>
            <span style="font-size:11px;font-weight:800;color:${chgPct >= 0 ? '#10b981' : '#f43f5e'};">
              30 ngày: ${Number.isFinite(chgPct) ? `${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%` : '—'} · ${esc(rsiTxt)}
            </span>
          </div>
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Biểu đồ giá vàng 30 ngày">
            <defs>
              <linearGradient id="invGoldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3" />
            <line x1="${padL}" y1="${padT + plotH / 2}" x2="${W - padR}" y2="${padT + plotH / 2}" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3" />
            <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="currentColor" stroke-opacity="0.2" />
            <path d="${areaPath}" fill="url(#invGoldAreaGrad)" />
            <path d="${linePath}" fill="none" stroke="#f59e0b" stroke-width="2.2" />
            ${ma7Coords.length ? `<path d="${ma7Coords.join(' ')}" fill="none" stroke="#38bdf8" stroke-width="1.4" stroke-dasharray="4 3" />` : ''}
            <text x="${padL - 5}" y="${padT + 4}" text-anchor="end" font-size="9.5" fill="currentColor" opacity="0.7">$${Math.round(maxV)}</text>
            <text x="${padL - 5}" y="${padT + plotH / 2 + 3}" text-anchor="end" font-size="9.5" fill="currentColor" opacity="0.7">$${Math.round((maxV + minV) / 2)}</text>
            <text x="${padL - 5}" y="${padT + plotH + 3}" text-anchor="end" font-size="9.5" fill="currentColor" opacity="0.7">$${Math.round(minV)}</text>
            <text x="${padL}" y="${H - 5}" font-size="9.5" fill="currentColor" opacity="0.65">${esc(pts[0].date.slice(5))}</text>
            <text x="${W - padR}" y="${H - 5}" text-anchor="end" font-size="9.5" fill="currentColor" opacity="0.65">${esc(pts[pts.length - 1].date.slice(5))}</text>
          </svg>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:10.5px;opacity:0.75;margin-top:4px;">
            <span><span style="color:#f59e0b;">━━</span> Giá đóng cửa ngày ($${ind.latest?.toFixed(1) || '—'}/oz)</span>
            <span><span style="color:#38bdf8;">╌╌</span> MA7 ($${ind.ma7?.toFixed(1) || '—'})</span>
            <span>MA20: $${ind.ma20?.toFixed(1) || '—'} · Cao/Thấp 30N: $${Math.round(maxV)} / $${Math.round(minV)}</span>
          </div>
        </div>
      `);
    }

    // Chart 2: Parity Comparison Bar (World Parity vs Ring 9999 vs SJC Sell)
    if (goldSnap && Number.isFinite(goldSnap.worldRawVnd)) {
      const bars = [
        { label: 'Thế giới quy đổi (thuần)', val: goldSnap.worldRawVnd / 1e6, color: '#38bdf8' },
        { label: 'Thế giới + thuế/phí (Parity)', val: (goldSnap.worldLandedVnd || goldSnap.worldRawVnd) / 1e6, color: '#0ea5e9' },
        { label: 'Vàng nhẫn 9999 (bán ra)', val: (goldSnap.ring9999?.sellVnd || 0) / 1e6, color: '#f59e0b' },
        { label: 'Vàng miếng SJC (bán ra)', val: (goldSnap.sjc?.sellVnd || 0) / 1e6, color: '#f43f5e' },
      ].filter((b) => b.val > 0);
      const maxBar = Math.max(...bars.map((b) => b.val), 1);

      parts.push(`
        <div class="inv-card" style="padding:12px;">
          <div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">⚖️ So sánh trực quan Giá Vàng Thế giới quy đổi vs Nội địa (triệu đồng / lượng)</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${bars
              .map(
                (b) => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:2px;">
                  <span>${esc(b.label)}</span>
                  <strong>${b.val.toFixed(2)} tr</strong>
                </div>
                <div style="height:10px;border-radius:999px;background:rgba(148,163,184,0.18);overflow:hidden;">
                  <div style="height:100%;width:${Math.max(8, Math.min(100, (b.val / maxBar) * 100)).toFixed(1)}%;background:${b.color};border-radius:999px;"></div>
                </div>
              </div>`
              )
              .join('')}
          </div>
          <div style="font-size:11px;opacity:0.75;margin-top:8px;">
            Chênh lệch SJC so với thế giới: <strong>${Number.isFinite(goldSnap.sjc?.diffRawPercent) ? `+${goldSnap.sjc.diffRawPercent.toFixed(1)}%` : '—'}</strong> ·
            Biên độ Mua–Bán SJC: <strong>${Number.isFinite(goldSnap.sjc?.spreadPercent) ? `${goldSnap.sjc.spreadPercent.toFixed(2)}%` : '—'}</strong>
          </div>
        </div>
      `);
    }

    return parts.join('');
  }

  function renderRealEstateChartsHtml(yieldPct, mortgageRatePct, surveys = []) {
    const safeYield = Number.isFinite(Number(yieldPct)) ? Number(yieldPct) : 3.3;
    const savingsRate = 5.5;
    const safeMortgage = Number.isFinite(Number(mortgageRatePct)) ? Number(mortgageRatePct) : 12.5;
    const maxR = Math.max(safeYield, savingsRate, safeMortgage, 15);

    const bars = [
      { label: 'Tỷ suất cho thuê nhà thực tế (Rental Yield)', val: safeYield, color: safeYield >= savingsRate ? '#10b981' : '#f59e0b' },
      { label: 'Lãi suất gửi tiết kiệm ngân hàng 12 tháng', val: savingsRate, color: '#38bdf8' },
      { label: 'Lãi suất vay mua nhà thả nổi (hết ưu đãi)', val: safeMortgage, color: '#f43f5e' },
    ];

    let historyHtml = '';
    if (Array.isArray(surveys) && surveys.length >= 2) {
      const ordered = [...surveys].reverse().filter((s) => Number(s.pricePerM2) > 0);
      if (ordered.length >= 2) {
        const vals = ordered.map((s) => Number(s.pricePerM2));
        const minV = Math.min(...vals) * 0.92;
        const maxV = Math.max(...vals) * 1.05;
        const span = Math.max(1, maxV - minV);
        const W = 460;
        const H = 120;
        const padL = 44;
        const padR = 14;
        const padT = 14;
        const padB = 22;
        const xOf = (i) => padL + (i / Math.max(1, ordered.length - 1)) * (W - padL - padR);
        const yOf = (v) => padT + (H - padT - padB) - ((v - minV) / span) * (H - padT - padB);
        const path = ordered.map((s, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(s.pricePerM2).toFixed(1)}`).join(' ');
        historyHtml = `
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(148,163,184,0.2);">
            <div style="font-size:12px;font-weight:800;margin-bottom:4px;">📈 Lịch sử Giá rao/m² từ các lần bạn khảo sát thực địa (${ordered.length} mốc)</div>
            <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;">
              <path d="${path}" fill="none" stroke="#10b981" stroke-width="2.4" />
              ${ordered
                .map(
                  (s, i) =>
                    `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(s.pricePerM2).toFixed(1)}" r="3.5" fill="#10b981" />
                     <text x="${xOf(i).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.7">${esc(String(s.date).slice(5))}</text>`
                )
                .join('')}
              <text x="${padL - 4}" y="${padT + 4}" text-anchor="end" font-size="9" fill="currentColor" opacity="0.7">${Math.round(maxV)}tr</text>
              <text x="${padL - 4}" y="${H - padB}" text-anchor="end" font-size="9" fill="currentColor" opacity="0.7">${Math.round(minV)}tr</text>
            </svg>
          </div>`;
      }
    }

    return `
      <div class="inv-card" style="padding:12px;">
        <div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">📊 So sánh Lợi suất Cho thuê Nhà vs Gửi Tiết kiệm vs Vay Ngân hàng (%/năm)</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${bars
            .map(
              (b) => `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:2px;">
                <span>${esc(b.label)}</span>
                <strong>${b.val.toFixed(2)}%/năm</strong>
              </div>
              <div style="height:10px;border-radius:999px;background:rgba(148,163,184,0.18);overflow:hidden;">
                <div style="height:100%;width:${Math.max(6, Math.min(100, (b.val / maxR) * 100)).toFixed(1)}%;background:${b.color};border-radius:999px;"></div>
              </div>
            </div>`
            )
            .join('')}
        </div>
        <div style="font-size:11px;opacity:0.78;margin-top:8px;">
          ${
            safeYield < savingsRate
              ? `⚠️ Tỷ suất cho thuê (${safeYield.toFixed(2)}%) đang thấp hơn gửi tiết kiệm (${savingsRate}%) — tuyệt đối tránh vay đòn bẩy cao mua nhà chờ tăng giá!`
              : `🟢 Tỷ suất cho thuê (${safeYield.toFixed(2)}%) cao hơn gửi tiết kiệm — dòng tiền cho thuê tương đối lành mạnh.`
          }
        </div>
        ${historyHtml}
      </div>`;
  }

  function renderStockForensicChartHtml(forensicInputs) {
    const rev = Number(forensicInputs?.revenue);
    const ni = Number(forensicInputs?.netIncome);
    const cfo = Number(forensicInputs?.cfo);
    if (!Number.isFinite(rev) && !Number.isFinite(ni) && !Number.isFinite(cfo)) return '';
    const items = [
      { label: 'Doanh thu thuần', val: Number.isFinite(rev) ? rev : 0, color: '#38bdf8' },
      { label: 'Lợi nhuận sau thuế (LNST)', val: Number.isFinite(ni) ? ni : 0, color: '#f59e0b' },
      { label: 'Tiền mặt thực thu (CFO)', val: Number.isFinite(cfo) ? cfo : 0, color: cfo >= ni ? '#10b981' : '#f43f5e' },
    ];
    const maxAbs = Math.max(...items.map((x) => Math.abs(x.val)), 1);
    return `
      <div class="inv-card" style="padding:12px;margin-top:10px;">
        <div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">💰 Biểu đồ Soi "Lãi Thật hay Lãi Trên Giấy" (Doanh thu · LNST · Tiền mặt CFO)</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${items
            .map(
              (it) => `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:2px;">
                <span>${esc(it.label)}</span>
                <strong>${it.val.toLocaleString('vi-VN')} tỷ</strong>
              </div>
              <div style="height:10px;border-radius:999px;background:rgba(148,163,184,0.18);overflow:hidden;">
                <div style="height:100%;width:${Math.max(4, Math.min(100, (Math.abs(it.val) / maxAbs) * 100)).toFixed(1)}%;background:${it.color};border-radius:999px;"></div>
              </div>
            </div>`
            )
            .join('')}
        </div>
        <div style="font-size:11px;opacity:0.8;margin-top:8px;">
          ${
            Number.isFinite(cfo) && Number.isFinite(ni) && ni > 0
              ? cfo >= ni
                ? `🟢 Tỷ lệ Tiền thật / Lãi sổ sách (CFO/LNST) = <strong>${(cfo / ni).toFixed(2)}x</strong> — Doanh nghiệp thu được tiền tươi thóc thật!`
                : `🔴 Cờ đỏ: Tiền thật CFO (${cfo}) thấp hơn Lãi trên giấy LNST (${ni}) (tỷ lệ <strong>${(cfo / ni).toFixed(2)}x</strong>) — Cần soi ngay Khoản phải thu & Hàng tồn kho!`
              : 'Nhập đủ Doanh thu, LNST và CFO để hệ thống so sánh tiền thật ngay.'
          }
        </div>
      </div>`;
  }

  // ==========================================================================
  // 4. BỘ 6 BIỂU ĐỒ CHUYÊN NGHIỆP (TRÒN · CỘT · ĐƯỜNG · RADAR · MA TRẬN QUYẾT ĐỊNH)
  //    ĐỌC TRỰC TIẾP HỢP ĐỒNG THỐNG NHẤT INVEST_INTEL_SYNC_V2 (TỪ CODE HOẶC GEMINI)
  // ==========================================================================
  function renderDonutAllocationSvg(slices) {
    const list = (Array.isArray(slices) ? slices : []).filter((s) => Number(s.value) > 0);
    const total = list.reduce((acc, s) => acc + Number(s.value), 0) || 100;
    const R = 56;
    const C = 2 * Math.PI * R;
    let offset = 0;
    const circles = list
      .map((s) => {
        const pct = (Number(s.value) / total) * 100;
        const dash = (pct / 100) * C;
        const seg = `<circle cx="75" cy="75" r="${R}" fill="none" stroke="${esc(s.color || '#10b981')}" stroke-width="22" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 75 75)" />`;
        offset += dash;
        return seg;
      })
      .join('');

    return `
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        <svg viewBox="0 0 150 150" style="width:142px;height:142px;flex-shrink:0;" role="img" aria-label="Biểu đồ tròn phân bổ vốn">
          <circle cx="75" cy="75" r="${R}" fill="none" stroke="currentColor" stroke-opacity="0.12" stroke-width="22" />
          ${circles}
          <text x="75" y="72" text-anchor="middle" font-size="13" font-weight="900" fill="currentColor">100%</text>
          <text x="75" y="87" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.72">Tỷ trọng vốn</text>
        </svg>
        <div style="flex:1;min-width:170px;display:flex;flex-direction:column;gap:6px;">
          ${list
            .map((s) => {
              const pct = ((Number(s.value) / total) * 100).toFixed(0);
              return `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;">
                <span style="display:inline-flex;align-items:center;gap:6px;">
                  <span style="width:10px;height:10px;border-radius:3px;background:${esc(s.color || '#10b981')};display:inline-block;"></span>
                  <span>${esc(s.label)}</span>
                </span>
                <strong>${pct}%</strong>
              </div>`;
            })
            .join('')}
        </div>
      </div>`;
  }

  function renderRadarRiskSvg(axes) {
    const items = (Array.isArray(axes) ? axes : []).slice(0, 8);
    if (items.length < 3) return '';
    const W = 440;
    const H = 268;
    const cx = 220;
    const cy = 134;
    const maxR = 72;
    const n = items.length;
    const pt = (idx, ratio) => {
      const ang = -Math.PI / 2 + (2 * Math.PI * idx) / n;
      return [cx + Math.cos(ang) * maxR * ratio, cy + Math.sin(ang) * maxR * ratio];
    };
    const rings = [0.33, 0.66, 1.0]
      .map((r) => {
        const coords = items.map((_, i) => pt(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');
        return `<polygon points="${coords}" fill="none" stroke="currentColor" stroke-opacity="0.16" stroke-width="1" />`;
      })
      .join('');
    const spokes = items
      .map((_, i) => {
        const [x, y] = pt(i, 1);
        return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity="0.16" stroke-width="1" />`;
      })
      .join('');
    const dataPoly = items
      .map((it, i) => pt(i, Math.max(0.1, Math.min(1, (Number(it.level) || 0) / 100))).map((v) => v.toFixed(1)).join(','))
      .join(' ');
    const dots = items
      .map((it, i) => {
        const [x, y] = pt(i, Math.max(0.1, Math.min(1, (Number(it.level) || 0) / 100)));
        const col = Number(it.level) >= 75 ? '#f43f5e' : Number(it.level) >= 50 ? '#f59e0b' : '#10b981';
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${col}" />`;
      })
      .join('');
    const labels = items
      .map((it, i) => {
        const [x, y] = pt(i, 1.24);
        const anchor = x < cx - 18 ? 'end' : x > cx + 18 ? 'start' : 'middle';
        const fullTxt = `${String(it.label || '').trim()} (${Math.round(Number(it.level) || 0)})`;
        const words = fullTxt.split(/\s+/);
        let l1 = fullTxt;
        let l2 = '';
        if (fullTxt.length > 18 && words.length >= 3) {
          const mid = Math.ceil(words.length / 2);
          l1 = words.slice(0, mid).join(' ');
          l2 = words.slice(mid).join(' ');
        }
        const adjY = y < cy - 55 ? y - 6 : y > cy + 55 ? y + 10 : y;
        if (l2) {
          return `<text x="${x.toFixed(1)}" y="${(adjY - 5).toFixed(1)}" text-anchor="${anchor}" font-size="10.2" font-weight="800" fill="currentColor" opacity="0.92"><tspan x="${x.toFixed(1)}" dy="0">${esc(l1)}</tspan><tspan x="${x.toFixed(1)}" dy="12.5">${esc(l2)}</tspan></text>`;
        }
        return `<text x="${x.toFixed(1)}" y="${adjY.toFixed(1)}" text-anchor="${anchor}" font-size="10.2" font-weight="800" fill="currentColor" opacity="0.92">${esc(l1)}</text>`;
      })
      .join('');

    return `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:440px;height:auto;margin:0 auto;display:block;overflow:visible;" role="img" aria-label="Biểu đồ Radar mức độ rủi ro">
        ${rings}
        ${spokes}
        <polygon points="${dataPoly}" fill="rgba(244,63,94,0.22)" stroke="#f43f5e" stroke-width="2" />
        ${dots}
        ${labels}
      </svg>`;
  }

  function renderTimeSeriesSvg(ts) {
    if (!ts || !Array.isArray(ts.points) || ts.points.length < 2) return '';
    const pts = ts.points;
    const vals = pts.map((p) => Number(p.value) || 0);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const span = Math.max(1, maxV - minV);
    const W = 500;
    const H = 155;
    const padL = 48;
    const padR = 16;
    const padT = 18;
    const padB = 26;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const xOf = (i) => padL + (i / Math.max(1, pts.length - 1)) * plotW;
    const yOf = (v) => padT + plotH - ((v - minV) / span) * plotH;
    const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(Number(p.value) || 0).toFixed(1)}`).join(' ');
    const areaD = `${lineD} L${xOf(pts.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${xOf(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

    return `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="${esc(ts.title)}">
        <defs>
          <linearGradient id="invTsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.32" />
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3" />
        <line x1="${padL}" y1="${padT + plotH / 2}" x2="${W - padR}" y2="${padT + plotH / 2}" stroke="currentColor" stroke-opacity="0.12" stroke-dasharray="3 3" />
        <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="currentColor" stroke-opacity="0.22" />
        <path d="${areaD}" fill="url(#invTsGrad)" />
        <path d="${lineD}" fill="none" stroke="#10b981" stroke-width="2.4" />
        ${pts
          .map(
            (p, i) => `
          <circle cx="${xOf(i).toFixed(1)}" cy="${yOf(Number(p.value) || 0).toFixed(1)}" r="3.4" fill="#10b981" />
          ${i === 0 || i === pts.length - 1 || pts.length <= 7 || i % Math.ceil(pts.length / 5) === 0
            ? `<text x="${xOf(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.72">${esc(p.label)}</text>`
            : ''}`
          )
          .join('')}
        <text x="${padL - 5}" y="${padT + 4}" text-anchor="end" font-size="9" fill="currentColor" opacity="0.7">${maxV.toLocaleString('vi-VN')}</text>
        <text x="${padL - 5}" y="${padT + plotH + 3}" text-anchor="end" font-size="9" fill="currentColor" opacity="0.7">${minV.toLocaleString('vi-VN')}</text>
      </svg>`;
  }

  function renderProAnalyticsDashboardHtml(unified, { goldSnap, goldHist30d, reYieldPct, reMortgagePct, surveys } = {}) {
    if (!unified) {
      return `
        <div class="inv-card text-center py-8 space-y-2">
          <div class="text-3xl">📊</div>
          <div class="text-sm font-black">Chưa có dữ liệu tổng hợp để vẽ biểu đồ</div>
          <p class="text-xs text-zinc-500 max-w-md mx-auto">
            Hãy bấm <strong>Bước 1: Tra cứu thông tin toàn diện</strong> ở tab Tổng quan (hoặc dán câu trả lời có khối JSON từ Gemini ngay khung phía trên) — toàn bộ 6 loại biểu đồ sẽ tự động dựng lên tức thì!
          </p>
        </div>`;
    }

    const cs = unified.channel_scores || { cash: 80, gold: 56, stock: 70, real_estate: 48 };
    const channelBars = [
      { label: '💵 Tiền mặt / Tiết kiệm', score: cs.cash, color: '#38bdf8' },
      { label: '📈 Chứng khoán', score: cs.stock, color: '#10b981' },
      { label: '🥇 Vàng', score: cs.gold, color: '#f59e0b' },
      { label: '🏘️ Nhà đất', score: cs.real_estate, color: '#a855f7' },
    ];
    const originBadge =
      unified.origin === 'gemini_synced'
        ? '<span class="inv-pill inv-sig-positive">🤖 Đã đồng bộ từ phân tích Gemini (INVEST_INTEL_SYNC_V2)</span>'
        : '<span class="inv-pill inv-sig-neutral">⚙️ Tự tổng hợp từ Code &amp; API sống (Bước 1)</span>';

    const sigColor = (sig) =>
      sig === 'positive' ? 'inv-sig-positive' : sig === 'danger' ? 'inv-sig-danger' : sig === 'caution' ? 'inv-sig-caution' : 'inv-sig-neutral';

    return `
      <div class="space-y-3">
        <!-- Dải tiêu đề nguồn dữ liệu & Kết luận nhanh -->
        <div class="inv-card space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-sm font-black">🎯 Giai đoạn chu kỳ: ${esc(unified.cycle_phase?.label || 'Đang cập nhật')}</div>
            ${originBadge}
          </div>
          ${unified.verdict_summary?.headline ? `<div class="text-xs font-bold leading-relaxed">${esc(unified.verdict_summary.headline)}</div>` : ''}
          ${unified.cycle_phase?.plain_advice ? `<div class="text-[11.5px] text-zinc-500 dark:text-zinc-400">💡 <strong>Hiểu đơn giản:</strong> ${esc(unified.cycle_phase.plain_advice)}</div>` : ''}
        </div>

        <!-- Hàng 1: Biểu đồ Tròn Phân bổ vốn + Biểu đồ Radar 6 trục rủi ro -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div class="inv-card space-y-2">
            <div class="text-xs font-extrabold text-sky-600 dark:text-sky-300">🍩 1. Biểu đồ Tròn — Gợi ý Chia Vốn An Toàn (%)</div>
            ${renderDonutAllocationSvg(unified.allocation_pct)}
            <div class="text-[11px] text-zinc-500 dark:text-zinc-400">Hiểu đơn giản: Không bỏ hết trứng vào 1 giỏ — giữ tỷ trọng tiền mặt làm vùng đệm để không bị ép bán tháo lúc thị trường rung lắc.</div>
          </div>

          <div class="inv-card space-y-2">
            <div class="text-xs font-extrabold text-rose-600 dark:text-rose-300">🕸️ 2. Biểu đồ Radar — Bản đồ 6 Mức Độ Rủi Ro (Càng rộng ra ngoài càng nguy hiểm)</div>
            ${renderRadarRiskSvg(unified.risk_radar)}
            <div class="text-[11px] text-zinc-500 dark:text-zinc-400">Hiểu đơn giản: Trục nào có điểm trên 75 (chấm đỏ) là nơi dễ mất tiền nhất lúc này — cần tránh đòn bẩy hoặc chờ điểm hạ nhiệt.</div>
          </div>
        </div>

        <!-- Hàng 2: Biểu đồ Cột 4 kênh + 5 Trụ cột Thẩm định (Thang 10) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div class="inv-card space-y-2.5">
            <div class="text-xs font-extrabold text-emerald-600 dark:text-emerald-300">📊 3. Biểu đồ Cột — Mức Độ Hấp Dẫn 4 Kênh Đầu Tư (Thang 100)</div>
            <div class="space-y-2.5">
              ${channelBars
                .map(
                  (b) => `
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="font-bold">${esc(b.label)}</span>
                    <strong class="inv-num">${Math.round(Number(b.score) || 0)} / 100 điểm</strong>
                  </div>
                  <div style="height:12px;border-radius:999px;background:rgba(148,163,184,0.18);overflow:hidden;">
                    <div style="height:100%;width:${Math.max(5, Math.min(100, Number(b.score) || 0))}%;background:${b.color};border-radius:999px;transition:width .35s;"></div>
                  </div>
                </div>`
                )
                .join('')}
            </div>
            <div class="text-[11px] text-zinc-500 dark:text-zinc-400">Hiểu đơn giản: Trên 70 điểm là vùng khá thuận lợi; dưới 55 điểm là vùng cần chậm lại, không vội vàng xuống tiền.</div>
          </div>

          <div class="inv-card space-y-2">
            <div class="text-xs font-extrabold text-amber-600 dark:text-amber-300">🏛️ 4. Biểu đồ Chấm Điểm 5 Trụ Cột Cốt Lõi (Thang 10)</div>
            <div class="space-y-2">
              ${(unified.five_pillars || [])
                .map((p) => {
                  const sc = Math.max(0, Math.min(10, Number(p.score) || 0));
                  const barCol = sc >= 7 ? '#10b981' : sc >= 5 ? '#f59e0b' : '#f43f5e';
                  return `
                  <div class="space-y-0.5">
                    <div class="flex justify-between text-xs gap-2">
                      <span class="font-bold">${esc(p.name)}</span>
                      <strong class="inv-num shrink-0" style="color:${barCol};">${sc.toFixed(1)} / 10</strong>
                    </div>
                    <div style="height:7px;border-radius:999px;background:rgba(148,163,184,0.18);overflow:hidden;">
                      <div style="height:100%;width:${(sc * 10).toFixed(0)}%;background:${barCol};border-radius:999px;"></div>
                    </div>
                    ${p.note ? `<div class="text-[10.5px] text-zinc-500 dark:text-zinc-400">${esc(p.note)}</div>` : ''}
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </div>

        <!-- Hàng 3: Biểu đồ Đường theo thời gian -->
        ${
          unified.time_series?.points?.length >= 2
            ? `<div class="inv-card space-y-1.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-xs font-extrabold text-emerald-600 dark:text-emerald-300">📈 5. Biểu đồ Đường Theo Thời Gian — ${esc(unified.time_series.title)}</div>
                  <span class="text-[11px] font-bold text-zinc-500">Đơn vị: ${esc(unified.time_series.unit || 'điểm')}</span>
                </div>
                ${renderTimeSeriesSvg(unified.time_series)}
              </div>`
            : ''
        }

        <!-- Hàng 4: Ma trận Quyết định Hành động -->
        <div class="inv-card space-y-2.5">
          <div class="text-xs font-extrabold text-indigo-600 dark:text-indigo-300">🧭 6. Ma Trận Quyết Định Hành Động (Rõ ràng — Không nói nước đôi)</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${(unified.decision_matrix || [])
              .map(
                (d) => `
              <div class="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 ${sigColor(d.signal)} space-y-1 text-xs">
                <div class="flex items-center justify-between gap-2">
                  <strong class="text-sm">${esc(d.channel)}</strong>
                  <span class="px-2 py-0.5 rounded-full bg-black/20 font-black text-[10.5px]">${esc(d.decision)} · ${Math.round(Number(d.score) || 0)}đ</span>
                </div>
                <div class="text-[11.5px] opacity-90">${esc(d.reason)}</div>
              </div>`
              )
              .join('')}
          </div>
        </div>

        <!-- Bổ sung biểu đồ chuyên sâu Vàng & Lợi suất Nhà đất nếu đã có số liệu -->
        ${goldSnap || goldHist30d ? renderGoldChartsHtml(goldSnap, goldHist30d) : ''}
        ${reYieldPct ? renderRealEstateChartsHtml(reYieldPct, reMortgagePct, surveys) : ''}
      </div>`;
  }

  INV.charts = {
    renderGoldChartsHtml,
    renderRealEstateChartsHtml,
    renderStockForensicChartHtml,
    renderProAnalyticsDashboardHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
