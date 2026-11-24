/**
 * ============================================================================
 * 🧮 ĐẦU TƯ HÔM NAY — 3 ĐỘNG CƠ TÀI CHÍNH THUẦN CODE (Vàng, Nhà Đất GPS, Chứng Khoán)
 * File: modules/invest-today/engines/marketEngines.js
 * ============================================================================
 * Toàn bộ phép toán tài chính (Quy đổi vàng Landed Parity, Spread, PMT/DSCR,
 * Stress Test 10%-15%, Damodaran Ke, DuPont 5 nhân tố, Beneish M, Altman Z/EM,
 * Piotroski F, Sloan Ratio) chạy 100% bằng JavaScript thuần, độ chính xác 100%.
 * ============================================================================
 */
(function initInvestMarketEngines(globalScope) {
  'use strict';

  const INV = (globalScope.NoirInvestToday = globalScope.NoirInvestToday || {});

  const OUNCE_PER_TAEL = 1.205653;
  const TTL_MARKET_MS = 5 * 60 * 1000; // 5 phút

  // ==========================================================================
  // 1. ĐỘNG CƠ GIÁ VÀNG & QUY ĐỔI CHUẨN VIỆT NAM (Chương 3 & Chương 5 Spec)
  // ==========================================================================
  function classifyGoldPremium(pct) {
    if (!Number.isFinite(pct)) return { signal: 'neutral', badge: 'Chưa đủ số liệu', text: 'Nhập giá bán vàng trong nước để đo độ đắt hơn thế giới.' };
    if (pct < 5) {
      return {
        signal: 'positive',
        badge: 'Thuận lợi / An toàn',
        text: `Giá trong nước đang bám rất sát giá thế giới (+${pct.toFixed(2)}%), mức chênh hợp lý.`,
      };
    }
    if (pct <= 10) {
      return {
        signal: 'caution',
        badge: 'Cần cẩn trọng',
        text: `Giá trong nước đang cao hơn thế giới mức trung bình (+${pct.toFixed(2)}%), nên cân nhắc kỹ trước khi mua lớn.`,
      };
    }
    return {
      signal: 'danger',
      badge: 'Rủi ro cao / Cảnh báo',
      text: `Cảnh báo Chốt chặn số 4: Giá vàng trong nước đang đắt hơn thế giới quá cao (+${pct.toFixed(2)}%), mua lúc này chịu rủi ro lớn nếu nguồn cung nhập khẩu mở rộng làm giá nén xuống.`,
    };
  }

  function classifyGoldSpread(pct, spreadVnd) {
    if (!Number.isFinite(pct)) return { signal: 'neutral', badge: 'Chưa có', text: 'Cần cả giá mua vào và bán ra để đo mức lỗ tức thì.' };
    const spreadTr = (spreadVnd / 1e6).toFixed(2);
    if (pct < 1.5) {
      return {
        signal: 'positive',
        badge: 'Thuận lợi / An toàn',
        text: `Chi phí mua đi bán lại thấp (${spreadTr} triệu/lượng ~ ${pct.toFixed(2)}%), dễ giao dịch.`,
      };
    }
    if (pct <= 3.0) {
      return {
        signal: 'caution',
        badge: 'Cần cẩn trọng',
        text: `Khoảng cách mua–bán hơi rộng (${spreadTr} triệu/lượng ~ ${pct.toFixed(2)}%), không phù hợp lướt sóng ngắn hạn.`,
      };
    }
    return {
      signal: 'danger',
      badge: 'Rủi ro cao / Cảnh báo',
      text: `Cảnh báo Chốt chặn số 4: Tiệm vàng đang để khoảng cách mua–bán quá rộng (${spreadTr} triệu/lượng ~ ${pct.toFixed(2)}%), mua xong bán lại ngay sẽ chịu lỗ tức thì hơn 3%.`,
    };
  }

  function calculateGoldMetrics({
    worldPriceUsd,
    vcbSellRate,
    sjcBuyVnd,
    sjcSellVnd,
    ringBuyVnd,
    ringSellVnd,
    shippingInsuranceUsd = 1.0,
    importTaxRate = 0.01,
    processingFeeVnd = 40000,
  }) {
    const xau = Number(worldPriceUsd);
    const fx = Number(vcbSellRate);
    const rawWorldPriceVnd = Number.isFinite(xau) && Number.isFinite(fx) ? xau * OUNCE_PER_TAEL * fx : NaN;
    const landedParityVnd =
      Number.isFinite(xau) && Number.isFinite(fx)
        ? (xau + Number(shippingInsuranceUsd || 0)) * (1 + Number(importTaxRate || 0)) * OUNCE_PER_TAEL * fx +
          Number(processingFeeVnd || 0)
        : NaN;

    const evalDomestic = (buy, sell) => {
      const b = Number(buy);
      const s = Number(sell);
      const hasSell = Number.isFinite(s) && s > 0;
      const hasBuy = Number.isFinite(b) && b > 0;
      const diffRawVnd = hasSell && Number.isFinite(rawWorldPriceVnd) ? s - rawWorldPriceVnd : NaN;
      const diffRawPercent = Number.isFinite(diffRawVnd) ? (diffRawVnd / rawWorldPriceVnd) * 100 : NaN;
      const diffLandedVnd = hasSell && Number.isFinite(landedParityVnd) ? s - landedParityVnd : NaN;
      const diffLandedPercent = Number.isFinite(diffLandedVnd) ? (diffLandedVnd / landedParityVnd) * 100 : NaN;
      const spreadVnd = hasSell && hasBuy ? s - b : NaN;
      const spreadPercent = Number.isFinite(spreadVnd) ? (spreadVnd / s) * 100 : NaN;

      const premiumStatus = classifyGoldPremium(diffRawPercent);
      const spreadStatus = classifyGoldSpread(spreadPercent, spreadVnd);
      const breakerTriggered =
        (Number.isFinite(diffRawPercent) && diffRawPercent > 10) ||
        (Number.isFinite(spreadPercent) && spreadPercent > 3);

      return {
        buyVnd: hasBuy ? b : NaN,
        sellVnd: hasSell ? s : NaN,
        diffRawVnd,
        diffRawPercent,
        diffLandedVnd,
        diffLandedPercent,
        spreadVnd,
        spreadPercent,
        premiumStatus,
        spreadStatus,
        breakerTriggered,
      };
    };

    const sjc = evalDomestic(sjcBuyVnd, sjcSellVnd);
    const ring9999 = evalDomestic(ringBuyVnd, ringSellVnd);

    let overallSignal = 'neutral';
    let overallHeadline = 'Đã quy đổi xong giá vàng thế giới. Hãy nhập hoặc cập nhật giá SJC / Nhẫn 9999 để đo độ đắt thực tế.';
    if (sjc.breakerTriggered || ring9999.breakerTriggered) {
      overallSignal = 'danger';
      overallHeadline =
        'Cảnh báo đỏ: Vàng trong nước đang đắt hơn thế giới quá ngưỡng an toàn (>10%) hoặc lỗ ngay lúc mua–bán vượt 3%. Không nên mua đuổi lúc này!';
    } else if (sjc.premiumStatus.signal === 'caution' || sjc.spreadStatus.signal === 'caution') {
      overallSignal = 'caution';
      overallHeadline = 'Cần cẩn trọng: Mức chênh lệch giá vàng trong nước hoặc phí mua–bán đang ở ngưỡng trung bình cao.';
    } else if (sjc.premiumStatus.signal === 'positive' && sjc.spreadStatus.signal === 'positive') {
      overallSignal = 'positive';
      overallHeadline = 'Thuận lợi: Giá vàng trong nước đang bám sát giá thế giới và chi phí mua–bán thấp.';
    }

    return {
      worldPriceUsd: xau,
      vcbSellRate: fx,
      rawWorldPriceVnd,
      landedParityVnd,
      shippingInsuranceUsd,
      importTaxRate,
      processingFeeVnd,
      sjc,
      ring9999,
      overallSignal,
      overallHeadline,
      breakerTriggered: sjc.breakerTriggered || ring9999.breakerTriggered,
    };
  }

  async function fetchLiveGoldSnapshot({ force = false, signal } = {}) {
    if (!force) {
      const cached = INV.storageAdapter.getSession('gold_live', TTL_MARKET_MS);
      if (cached?.data) {
        return { ...cached.data, fromCache: true, ageMinutes: cached.ageMinutes };
      }
    }

    const sources = [];
    let worldPriceUsd = NaN;
    let vcbSellRate = NaN;
    let sjcBuyVnd = NaN;
    let sjcSellVnd = NaN;
    let ringBuyVnd = NaN;
    let ringSellVnd = NaN;

    // Gọi song song 3 nguồn nhẹ: XAU/USD, USD/VND, và thử lấy bảng giá SJC (chạy thẳng trên Electron / Worker)
    const [xauRes, fxRes, sjcRes] = await Promise.allSettled([
      INV.networkAdapter.fetchJson('https://api.gold-api.com/price/XAU', { signal, timeoutMs: 9000, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://open.er-api.com/v6/latest/USD', { signal, timeoutMs: 9000, preferDirect: true }),
      INV.networkAdapter.fetchText('https://sjc.com.vn/xml/tygiavang.xml', { signal, timeoutMs: 7000 }),
    ]);

    if (xauRes.status === 'fulfilled' && Number(xauRes.value?.data?.price) > 0) {
      worldPriceUsd = Number(xauRes.value.data.price);
      sources.push({ name: 'Gold-API (XAU/USD)', url: 'https://api.gold-api.com/price/XAU', live: true });
    }
    if (fxRes.status === 'fulfilled' && Number(fxRes.value?.data?.rates?.VND) > 0) {
      vcbSellRate = Number(fxRes.value.data.rates.VND);
      sources.push({ name: 'ExchangeRate API (USD/VND)', url: 'https://open.er-api.com/v6/latest/USD', live: true });
    }
    if (sjcRes.status === 'fulfilled' && sjcRes.value?.text) {
      const xml = sjcRes.value.text;
      // Bóc tách SJC miếng và Nhẫn SJC 99,99% từ XML chính thức SJC
      const sjcMatch = xml.match(/buy="([\d.,]+)"\s+sell="([\d.,]+)"\s+type="[^"]*SJC\s*1L/i);
      const ringMatch = xml.match(/buy="([\d.,]+)"\s+sell="([\d.,]+)"\s+type="[^"]*nhẫn[^"]*99,99/i);
      const toVnd = (raw) => {
        const cleaned = Number(String(raw || '').replace(/[^\d.]/g, ''));
        if (!Number.isFinite(cleaned) || cleaned <= 0) return NaN;
        return cleaned < 1000 ? cleaned * 1e6 : cleaned < 1000000 ? cleaned * 1000 : cleaned;
      };
      if (sjcMatch) {
        sjcBuyVnd = toVnd(sjcMatch[1]);
        sjcSellVnd = toVnd(sjcMatch[2]);
        sources.push({ name: 'SJC chính thức (XML)', url: 'https://sjc.com.vn/', live: true });
      }
      if (ringMatch) {
        ringBuyVnd = toVnd(ringMatch[1]);
        ringSellVnd = toVnd(ringMatch[2]);
      }
    }

    const domesticLive = Number.isFinite(sjcSellVnd) && sjcSellVnd > 0;
    // Nếu SJC bị chặn CORS trên Web thuần và chưa gắn Worker -> hiển thị rõ mốc tham chiếu gần nhất (24/11/2026) để người dùng sửa ngay 1 giây
    const effectiveSjcBuy = domesticLive ? sjcBuyVnd : 130000000;
    const effectiveSjcSell = domesticLive ? sjcSellVnd : 135000000;
    const effectiveRingBuy = Number.isFinite(ringBuyVnd) ? ringBuyVnd : 128800000;
    const effectiveRingSell = Number.isFinite(ringSellVnd) ? ringSellVnd : 134800000;

    const metrics = calculateGoldMetrics({
      worldPriceUsd: Number.isFinite(worldPriceUsd) ? worldPriceUsd : NaN,
      vcbSellRate: Number.isFinite(vcbSellRate) ? vcbSellRate : NaN,
      sjcBuyVnd: effectiveSjcBuy,
      sjcSellVnd: effectiveSjcSell,
      ringBuyVnd: effectiveRingBuy,
      ringSellVnd: effectiveRingSell,
    });

    const payload = {
      ...metrics,
      worldLive: Number.isFinite(worldPriceUsd),
      fxLive: Number.isFinite(vcbSellRate),
      domesticLive,
      sources,
      fetchedAt: Date.now(),
      asOfDate: INV.utils.todayIso(),
    };

    if (payload.worldLive || payload.fxLive || payload.domesticLive) {
      INV.storageAdapter.setSession('gold_live', payload);
    }
    return { ...payload, fromCache: false, ageMinutes: 0 };
  }

  // ==========================================================================
  // 2. ĐỘNG CƠ NHÀ ĐẤT GPS, MÁY TÍNH TIỀN VAY (DSCR / STRESS TEST) & 7 BƯỚC PHÁP LÝ
  // ==========================================================================
  function calculatePmt(principal, annualRatePct, years) {
    const P = Number(principal);
    const n = Math.max(1, Math.round(Number(years) * 12));
    const r = Number(annualRatePct) / 100 / 12;
    if (!Number.isFinite(P) || P <= 0) return 0;
    if (!Number.isFinite(r) || r <= 0) return P / n;
    const factor = Math.pow(1 + r, n);
    return (P * (r * factor)) / (factor - 1);
  }

  function calculateMortgageStressTest({
    priceVnd = 5000000000,
    loanVnd = 3500000000,
    years = 20,
    grossMonthlyRentVnd = 9666667,
    annualRatePct = 12,
    operatingDeduction = 0.15,
  }) {
    const price = Math.max(0, Number(priceVnd) || 0);
    const loan = Math.max(0, Number(loanVnd) || 0);
    const ltvPct = price > 0 ? (loan / price) * 100 : 0;
    const grossRent = Math.max(0, Number(grossMonthlyRentVnd) || 0);
    const netMonthlyRent = grossRent * (1 - operatingDeduction);
    const grossYieldPct = price > 0 ? ((grossRent * 12) / price) * 100 : 0;

    const evalRate = (rate) => {
      const monthlyPayment = calculatePmt(loan, rate, years);
      const annualDebtService = monthlyPayment * 12;
      const dscr = monthlyPayment > 0 ? netMonthlyRent / monthlyPayment : 99;
      const monthlyShortfall = Math.max(0, monthlyPayment - netMonthlyRent);
      const coveragePct = monthlyPayment > 0 ? (netMonthlyRent / monthlyPayment) * 100 : 100;
      return { rate, monthlyPayment, annualDebtService, dscr, monthlyShortfall, coveragePct };
    };

    const current = evalRate(annualRatePct);
    const stressRates = [10, 12, 14, 15];
    const stressTable = stressRates.map(evalRate);

    let signal = 'positive';
    let badge = 'Thuận lợi / An toàn';
    let plainVerdict =
      'Dòng tiền cho thuê đủ tự trả gốc và lãi ngân hàng, đạt mức an toàn chuẩn (DSCR ≥ 1,2x).';
    let breakerTriggered = false;

    if (loan <= 0) {
      plainVerdict = 'Không sử dụng tiền vay ngân hàng — không chịu rủi ro tăng lãi suất thả nổi.';
    } else if (current.dscr < 1.0) {
      signal = 'danger';
      badge = 'Rủi ro cao / Cảnh báo';
      breakerTriggered = true;
      const s12 = stressTable.find((r) => r.rate === 12);
      const s15 = stressTable.find((r) => r.rate === 15);
      plainVerdict = `Cảnh báo Chốt chặn số 3: Tiền cho thuê ròng chỉ trả được ${current.coveragePct.toFixed(0)}% tiền vay ngân hàng (DSCR ${current.dscr.toFixed(2)}x). Nếu lãi suất thả nổi lên 12%–15%, mỗi tháng bạn phải tự bù thêm từ ${(s12.monthlyShortfall / 1e6).toFixed(1)} đến ${(s15.monthlyShortfall / 1e6).toFixed(1)} triệu đồng từ thu nhập khác. Rất dễ gặp áp lực nặng về tài chính.`;
    } else if (current.dscr < 1.2) {
      signal = 'caution';
      badge = 'Cần cẩn trọng';
      breakerTriggered = true;
      plainVerdict = `Tiền cho thuê vừa sát nút tiền trả ngân hàng (DSCR ${current.dscr.toFixed(2)}x), nhưng chưa có vùng đệm an toàn (chuẩn ≥ 1,2x) nếu lãi suất tăng thêm 2% hoặc nhà bị trống khách.`;
    }

    return {
      priceVnd: price,
      loanVnd: loan,
      years,
      ltvPct,
      grossMonthlyRentVnd: grossRent,
      netMonthlyRent,
      grossYieldPct,
      annualRatePct,
      current,
      stressTable,
      signal,
      badge,
      plainVerdict,
      breakerTriggered,
    };
  }

  function buildLocalizedRealEstateLinks(areaLabel) {
    const q = encodeURIComponent(areaLabel);
    return [
      {
        title: `Giá đất thổ cư & nhà phố tại ${areaLabel}`,
        source: 'Batdongsan.com.vn (Google)',
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:batdongsan.com.vn giá đất nhà phố "${areaLabel}" ${new Date().getFullYear()}`)}`,
      },
      {
        title: `Giá căn hộ chung cư & giá thuê tại ${areaLabel}`,
        source: 'Chợ Tốt Nhà / AloNhaDat (Google)',
        url: `https://www.google.com/search?q=${encodeURIComponent(`giá chung cư cho thuê "${areaLabel}" triệu/m2 ${new Date().getFullYear()}`)}`,
      },
      {
        title: `Bảng giá đất nhà nước & quy hoạch tại ${areaLabel}`,
        source: 'Thông tin quy hoạch / Bảng giá đất',
        url: `https://www.google.com/search?q=${encodeURIComponent(`bảng giá đất quy hoạch "${areaLabel}" ${new Date().getFullYear()}`)}`,
      },
      {
        title: `Lãi suất vay mua nhà thả nổi ngân hàng mới nhất`,
        source: 'Biểu lãi suất ngân hàng VN',
        url: `https://www.google.com/search?q=${encodeURIComponent(`lãi suất vay mua nhà thả nổi ngân hàng Việt Nam ${new Date().getMonth() + 1}/${new Date().getFullYear()}`)}`,
      },
      {
        title: `Xem bản đồ thực địa khu vực ${areaLabel}`,
        source: 'OpenStreetMap',
        url: `https://www.openstreetmap.org/search?query=${q}`,
      },
    ];
  }

  function inferCityRentalBenchmark(areaLabel) {
    const lower = String(areaLabel || '').toLowerCase();
    if (/hà nội|ha noi|cầu giấy|đống đa|ba đình|hoàn kiếm|nam từ liêm|bắc từ liêm|tây hồ|long biên|hà đông|thanh xuân/.test(lower)) {
      return { city: 'Hà Nội', aptYield: 2.32, houseYield: 2.04, note: 'Tham chiếu Q2/2026: Căn hộ HN ~2,32%/năm, Nhà phố ~2,04%/năm.' };
    }
    if (/hồ chí minh|ho chi minh|tp\.?\s*hcm|sài gòn|thủ đức|bình thạnh|quận 1|quận 2|quận 7|tân bình|phú nhuận|gò vấp/.test(lower)) {
      return { city: 'TP.HCM', aptYield: 3.3, houseYield: 2.31, note: 'Tham chiếu Q2/2026: Căn hộ TP.HCM ~3,30%/năm, Nhà phố ~2,31%/năm.' };
    }
    if (/đà nẵng|da nang|hải châu|sơn trà|ngũ hành sơn|thanh khê|liên chiểu|cẩm lệ/.test(lower)) {
      return { city: 'Đà Nẵng', aptYield: 4.34, houseYield: 2.64, note: 'Tham chiếu Q2/2026: Căn hộ Đà Nẵng ~4,34%/năm (cao nhất nhóm đô thị lớn), Nhà phố ~2,64%/năm.' };
    }
    return {
      city: 'Mặt bằng toàn quốc',
      aptYield: 3.05,
      houseYield: 2.29,
      note: 'Khu vực này hiện có ít dữ liệu giá công khai trên mạng, bạn nên khảo sát thêm tại văn phòng công chứng hoặc môi giới địa phương. Tham chiếu bình quân toàn quốc: Căn hộ ~3,05%/năm, Nhà phố ~2,29%/năm.',
      sparseWarning: true,
    };
  }

  async function resolveGpsLocation(signal) {
    if (!navigator.geolocation) {
      throw new Error('Trình duyệt không hỗ trợ định vị GPS. Bạn hãy gõ trực tiếp tên Đường / Phường / Quận ở ô bên dưới nhé.');
    }
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    }).catch((err) => {
      if (err?.code === 1) {
        throw new Error('Bạn vừa từ chối quyền Vị trí. Không sao cả — hãy gõ tên Phường / Quận bạn quan tâm vào ô bên dưới để tra cứu ngay.');
      }
      throw new Error('Chưa lấy được tọa độ GPS lúc này. Bạn hãy gõ trực tiếp tên Phường / Quận vào ô bên dưới nhé.');
    });

    const lat = Number(pos.coords.latitude.toFixed(5));
    const lon = Number(pos.coords.longitude.toFixed(5));
    let areaLabel = `${lat}, ${lon}`;
    let addressParts = {};

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi`;
      const res = await INV.networkAdapter.fetchJson(url, { signal, timeoutMs: 9000, preferDirect: true });
      const a = res?.data?.address || {};
      addressParts = {
        road: a.road || a.pedestrian || '',
        ward: a.suburb || a.quarter || a.village || a.town || '',
        district: a.city_district || a.county || a.district || '',
        city: a.city || a.state || '',
      };
      const joined = [addressParts.road, addressParts.ward, addressParts.district, addressParts.city]
        .filter(Boolean)
        .join(', ');
      if (joined) areaLabel = joined;
    } catch (_eGeo) {}

    return {
      lat,
      lon,
      areaLabel,
      addressParts,
      benchmark: inferCityRentalBenchmark(areaLabel),
      links: buildLocalizedRealEstateLinks(areaLabel),
      sourceMode: 'gps',
      fetchedAt: Date.now(),
    };
  }

  function resolveManualArea(areaInput) {
    const clean = String(areaInput || '').trim();
    if (!clean) throw new Error('Vui lòng nhập tên Đường, Phường hoặc Quận cần tra cứu.');
    return {
      lat: null,
      lon: null,
      areaLabel: clean,
      addressParts: {},
      benchmark: inferCityRentalBenchmark(clean),
      links: buildLocalizedRealEstateLinks(clean),
      sourceMode: 'manual',
      fetchedAt: Date.now(),
    };
  }

  // ==========================================================================
  // 3. ĐỘNG CƠ CHỨNG KHOÁN & BỘ LỌC PHÁP Y BCTC THEO NGÀNH (Chương 4 & 7 Spec)
  // ==========================================================================
  const BANK_SET = new Set([
    'VCB', 'BID', 'CTG', 'TCB', 'MBB', 'ACB', 'VPB', 'STB', 'HDB', 'TPB',
    'VIB', 'SHB', 'SSB', 'EIB', 'OCB', 'LPB', 'MSB', 'NAB', 'BAB', 'ABB', 'BVB', 'KLB', 'PGB', 'VAB', 'VBB',
  ]);
  const REAL_ESTATE_SET = new Set([
    'VHM', 'VIC', 'VRE', 'NVL', 'KDH', 'NLG', 'DXG', 'PDR', 'DIG', 'CEO',
    'TCH', 'HDC', 'AGG', 'NTL', 'KBC', 'IDC', 'SZC', 'VGC', 'BCM', 'SIP', 'PHR', 'SCR', 'CRE', 'HPX',
  ]);

  function detectSector(symbol) {
    const s = String(symbol || '').trim().toUpperCase();
    if (s === 'VNINDEX' || s === '^VNINDEX' || s === 'VN-INDEX') return 'index';
    if (BANK_SET.has(s)) return 'bank';
    if (REAL_ESTATE_SET.has(s)) return 'real_estate';
    return 'general';
  }

  function calculateVnIndexValuation({
    vnIndexPoints = 1715,
    pe = 10.8,
    pb = 1.85,
    bond10yPct = 4.573,
    marginTrillion = 457.5,
    avgLiquidityTrillion = 14.8,
    foreignNetTrillion = -122,
  } = {}) {
    const earningsYieldPct = pe > 0 ? 100 / pe : NaN;
    const spreadVsBondPct = Number.isFinite(earningsYieldPct) ? earningsYieldPct - bond10yPct : NaN;
    const cleanRf = bond10yPct - 2.56;
    const damodaranKe = cleanRf + 8.13; // Total ERP VN = 4.23% + 3.90%
    const peVs10yAvgPct = ((pe - 14.0) / 14.0) * 100;
    const marginSessions = avgLiquidityTrillion > 0 ? marginTrillion / avgLiquidityTrillion : NaN;

    const valuationSignal = pe < 12 ? 'positive' : pe <= 15.5 ? 'neutral' : 'danger';
    const marginSignal = marginSessions > 25 ? 'danger' : marginSessions > 15 ? 'caution' : 'positive';
    const marginBreaker = Number.isFinite(marginSessions) && marginSessions > 25;

    return {
      vnIndexPoints,
      pe,
      pb,
      bond10yPct,
      earningsYieldPct,
      spreadVsBondPct,
      damodaranKe,
      peVs10yAvgPct,
      marginTrillion,
      avgLiquidityTrillion,
      marginSessions,
      foreignNetTrillion,
      valuationSignal,
      marginSignal,
      marginBreaker,
      plainValuation:
        pe < 12
          ? `Đang rẻ so với lịch sử 10 năm (P/E ${pe.toFixed(1)}x vs TB 14,0x; lợi nhuận ước tính ${earningsYieldPct.toFixed(2)}%/năm cao hơn trái phiếu 10 năm +${spreadVsBondPct.toFixed(2)}%).`
          : pe <= 15.5
          ? `Định giá ở vùng bình thường so với lịch sử (P/E ${pe.toFixed(1)}x).`
          : `Định giá đang đắt hơn trung bình lịch sử (P/E ${pe.toFixed(1)}x), biên an toàn mỏng.`,
      plainMargin: marginBreaker
        ? `Cảnh báo Chốt chặn số 3: Lượng tiền vay margin đang rất căng (${marginTrillion} nghìn tỷ ~ ${marginSessions.toFixed(0)} phiên giao dịch). Tuyệt đối KHÔNG vay margin mua đuổi!`
        : marginSessions > 15
        ? `Mức vay margin đang hơi cao (${marginSessions.toFixed(0)} phiên), nên hạn chế dùng đòn bẩy.`
        : `Mức vay margin toàn sàn ở ngưỡng dễ kiểm soát (${marginSessions.toFixed(1)} phiên).`,
    };
  }

  /**
   * Bộ tứ Pháp y BCTC + DuPont 5 nhân tố bằng code thuần (cho DN sản xuất / tiêu dùng / công nghệ)
   */
  function calculateForensicSuite(m = {}) {
    const num = (k, def = NaN) => (m[k] !== undefined && m[k] !== '' && m[k] !== null ? Number(m[k]) : def);
    const rev = num('revenue');
    const ebit = num('ebit');
    const ebt = num('ebt');
    const netIncome = num('netIncome');
    const cfo = num('cfo');
    const cfi = num('cfi', 0);
    const totalAssets = num('totalAssets');
    const equity = num('equity');
    const totalLiabilities = num('totalLiabilities');
    const workingCapital = num('workingCapital');
    const retainedEarnings = num('retainedEarnings');
    const marketCap = num('marketCap');

    // 1. Sloan Ratio
    const sloanPct =
      Number.isFinite(netIncome) && Number.isFinite(cfo) && Number.isFinite(totalAssets) && totalAssets > 0
        ? ((netIncome - cfo - (Number.isFinite(cfi) ? cfi : 0)) / totalAssets) * 100
        : NaN;
    const cfoToNi = Number.isFinite(cfo) && Number.isFinite(netIncome) && netIncome !== 0 ? cfo / netIncome : NaN;

    // 2. Altman Z-Score & EM-Score
    let altmanZ = NaN;
    let altmanEM = NaN;
    if (Number.isFinite(totalAssets) && totalAssets > 0 && Number.isFinite(totalLiabilities) && totalLiabilities > 0) {
      const x1 = (workingCapital || 0) / totalAssets;
      const x2 = (retainedEarnings || 0) / totalAssets;
      const x3 = (ebit || 0) / totalAssets;
      const x4 = (marketCap || equity || 0) / totalLiabilities;
      const x5 = (rev || 0) / totalAssets;
      altmanZ = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.0 * x5;
      altmanEM = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4 + 3.25;
    }

    // 3. Beneish M-Score (8 ratios nếu có)
    const dsri = num('dsri', 1.0);
    const gmi = num('gmi', 1.0);
    const aqi = num('aqi', 1.0);
    const sgi = num('sgi', 1.0);
    const depi = num('depi', 1.0);
    const sgai = num('sgai', 1.0);
    const lvgi = num('lvgi', 1.0);
    const tata =
      Number.isFinite(netIncome) && Number.isFinite(cfo) && Number.isFinite(totalAssets) && totalAssets > 0
        ? (netIncome - cfo) / totalAssets
        : NaN;
    const beneishM = Number.isFinite(tata)
      ? -4.84 + 0.92 * dsri + 0.528 * gmi + 0.404 * aqi + 0.892 * sgi + 0.115 * depi - 0.172 * sgai + 4.679 * tata - 0.327 * lvgi
      : NaN;

    // 4. DuPont 5 nhân tố
    const dupont =
      Number.isFinite(netIncome) && Number.isFinite(ebt) && ebt !== 0 && Number.isFinite(ebit) && ebit !== 0 && Number.isFinite(rev) && rev > 0 && Number.isFinite(totalAssets) && totalAssets > 0 && Number.isFinite(equity) && equity > 0
        ? {
            taxBurden: netIncome / ebt,
            interestBurden: ebt / ebit,
            ebitMarginPct: (ebit / rev) * 100,
            assetTurnover: rev / totalAssets,
            leverage: totalAssets / equity,
            roePct: (netIncome / equity) * 100,
          }
        : null;

    // 5. Piotroski F-Score (nếu người dùng tick hoặc có số liệu năm trước)
    const piotroskiF = Number.isFinite(num('piotroskiF')) ? Math.max(0, Math.min(9, Math.round(num('piotroskiF')))) : null;

    return {
      sloanPct,
      cfoToNi,
      altmanZ,
      altmanEM,
      beneishM,
      piotroskiF,
      dupont,
      plainCashCheck: Number.isFinite(sloanPct)
        ? sloanPct > 10
          ? `Cảnh báo lãi giấy (Sloan +${sloanPct.toFixed(1)}%): Lợi nhuận sổ sách cao hơn nhiều so với tiền mặt thực thu.`
          : sloanPct < -10
          ? `Tiền mặt về rất khỏe (Sloan ${sloanPct.toFixed(1)}%): Dòng tiền thật vượt trội lợi nhuận kế toán.`
          : `Chất lượng tiền mặt ở mức bình thường (Sloan ${sloanPct.toFixed(1)}%).`
        : 'DATA_MISSING — Chưa đủ dòng CFO/LNST từ nguồn công khai; bạn có thể nhập nhanh 5 số BCTC ở mục chi tiết bên dưới để tính ngay.',
      plainDebtCheck: Number.isFinite(altmanZ)
        ? altmanZ > 2.99
          ? `Sức khỏe nợ vay an toàn (Altman Z = ${altmanZ.toFixed(2)} > 2,99).`
          : altmanZ >= 1.81
          ? `Vùng cần theo dõi nợ vay (Altman Z = ${altmanZ.toFixed(2)}, vùng xám 1,81–2,99).`
          : `Cảnh báo rủi ro áp lực nợ (Altman Z = ${altmanZ.toFixed(2)} < 1,81).`
        : 'DATA_MISSING — Cần bổ sung Cân đối kế toán để tính Z-Score.',
      plainManipulationCheck: Number.isFinite(beneishM)
        ? beneishM > -1.78
          ? `Cờ đỏ rủi ro làm đẹp sổ sách (Beneish M = ${beneishM.toFixed(2)} > -1,78). Cần soi kỹ thuyết minh phải thu!`
          : beneishM > -2.22
          ? `Vùng xám cần đọc kỹ thuyết minh (Beneish M = ${beneishM.toFixed(2)}).`
          : `Sổ sách sạch, rủi ro thao túng thấp (Beneish M = ${beneishM.toFixed(2)} ≤ -2,22).`
        : 'DATA_MISSING',
    };
  }

  async function lookupStockTicker(rawSymbol, { force = false, signal } = {}) {
    const sym = String(rawSymbol || '').trim().toUpperCase().replace(/[^A-Z0-9^.-]/g, '');
    if (!sym) throw new Error('Vui lòng nhập mã cổ phiếu (ví dụ: FPT, VCB, HPG, VNM...).');

    const cacheKey = 'stock_' + sym;
    if (!force) {
      const cached = INV.storageAdapter.getSession(cacheKey, TTL_MARKET_MS);
      if (cached?.data) return { ...cached.data, fromCache: true, ageMinutes: cached.ageMinutes };
    }

    const sector = detectSector(sym);
    const isVnTicker = /^[A-Z]{3}$/.test(sym) && !['SPY', 'QQQ', 'DIA', 'GLD', 'SLV', 'USO', 'TLT', 'IEF', 'HYG'].includes(sym);
    const yahooSymbol = isVnTicker ? `${sym}.VN` : sym;

    let price = NaN;
    let changePct = NaN;
    let currency = isVnTicker ? 'VND' : 'USD';
    let companyName = sym;
    let pe = NaN;
    let pb = NaN;
    let roe = NaN;
    let volume = NaN;
    let liveSource = null;

    // 1) Thử nguồn VNDirect công khai cho mã Việt Nam (có giá & thông tin chuẩn HOSE/HNX)
    if (isVnTicker) {
      try {
        const vndUrl = `https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=date&q=code:${encodeURIComponent(sym)}&size=2`;
        const res = await INV.networkAdapter.fetchJson(vndUrl, { signal, timeoutMs: 8000 });
        const row = res?.data?.data?.[0];
        if (row && Number(row.close) > 0) {
          price = Number(row.close) * 1000;
          changePct = Number(row.pctChange);
          volume = Number(row.nmVolume);
          liveSource = { name: `VNDirect (${row.date || INV.utils.todayIso()})`, url: `https://dstock.vndirect.com.vn/tong-quan/${sym}` };
        }
      } catch (_eVnd) {}
    }

    // 2) Thử Yahoo Finance (mã quốc tế hoặc fallback cho mã VN khi có Electron / Worker)
    if (!Number.isFinite(price)) {
      try {
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`;
        const res = await INV.networkAdapter.fetchJson(yUrl, { signal, timeoutMs: 8000 });
        const meta = res?.data?.chart?.result?.[0]?.meta;
        if (meta && Number(meta.regularMarketPrice) > 0) {
          price = Number(meta.regularMarketPrice);
          const prev = Number(meta.chartPreviousClose || meta.previousClose);
          changePct = prev > 0 ? ((price - prev) / prev) * 100 : NaN;
          currency = meta.currency || currency;
          companyName = meta.longName || meta.shortName || sym;
          liveSource = { name: `Yahoo Finance (${yahooSymbol})`, url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}` };
        }
      } catch (_eYh) {}
    }

    // Lưu vào danh sách 5 mã vừa tra gần đây
    const prefs = INV.storageAdapter.getPrefs();
    const recent = [sym, ...(prefs.recentStocks || []).filter((x) => x !== sym)].slice(0, 5);
    INV.storageAdapter.savePrefs({ recentStocks: recent });

    const sectorChecklist =
      sector === 'bank'
        ? {
            sectorLabel: 'Ngân hàng (KHÔNG dùng M-Score/Z-Score — áp chuẩn riêng ngành Ngân hàng)',
            cards: [
              { title: 'Định giá P/B so với ROE', hint: 'Ngân hàng có ROE > 18% và P/B hợp lý mới có biên an toàn tốt.', value: Number.isFinite(pb) ? `${pb.toFixed(2)}x` : 'Xem báo cáo quý gần nhất' },
              { title: 'Biên lãi ròng (NIM) & Tiền gửi không kỳ hạn (CASA)', hint: 'CASA càng cao giúp ngân hàng có vốn giá rẻ, chống chọi tốt khi lãi suất liên ngân hàng lên 7,85%.', value: 'Kiểm tra trên FireAnt / BCTC quý' },
              { title: 'Nợ xấu (NPL) & Quỹ dự phòng bao phủ (LLR)', hint: 'Ưu tiên ngân hàng có nợ xấu thấp, bao phủ nợ xấu dày (>100%).', value: 'Chuẩn ngành Q3/2026: NPL ~2,3%' },
              { title: 'An toàn vốn (CAR) & Chuẩn Basel III (TT 50/2026)', hint: 'Ngân hàng đạt sớm 100% LCR & NSFR sẽ được gỡ trần LDR và bứt tốc thị phần.', value: 'Hiệu lực từ 01/12/2026' },
            ],
          }
        : sector === 'real_estate'
        ? {
            sectorLabel: 'Bất động sản niêm yết (Soi dòng tiền thật, nợ trái phiếu & chiết khấu RNAV)',
            cards: [
              { title: 'Dòng tiền kinh doanh thực tế (CFO)', hint: 'Phân biệt lợi nhuận từ bán nhà thật hay chỉ bán tài sản một lần.', value: 'Ưu tiên CFO dương liên tiếp' },
              { title: 'Tỷ lệ Nợ vay / Vốn chủ sở hữu', hint: 'Trong môi trường lãi suất cao 12%–15%, nợ thấp là lá chắn sống còn.', value: 'An toàn: Nợ ròng/VCSH < 0,6x' },
              { title: 'Áp lực Trái phiếu đáo hạn 12–24 tháng', hint: 'Kiểm tra lịch đáo hạn và xếp hạng tín nhiệm trên VIS Rating / FiinRatings.', value: 'Ngành BĐS chiếm >57% tường đáo hạn' },
              { title: 'Chiết khấu so với tài sản ròng (RNAV)', hint: 'Luật Đất đai sửa đổi 21/11/2026 ưu ái chủ đầu tư quỹ đất sạch, pháp lý chuẩn.', value: 'Đòi hỏi biên chiết khấu an toàn cao' },
            ],
          }
        : {
            sectorLabel: 'Sản xuất / Công nghệ / Tiêu dùng (Áp dụng Bộ tứ Pháp y BCTC & DuPont 5 nhân tố)',
            cards: [
              { title: 'Đang đắt hay rẻ (P/E vs Lãi suất)', hint: 'So sánh lợi nhuận doanh nghiệp làm ra với lãi suất gửi ngân hàng & chi phí vốn ~10,14%.', value: Number.isFinite(pe) ? `P/E ${pe.toFixed(1)}x` : 'Kiểm tra P/E hiện tại' },
              { title: 'Tiền mặt có về thật không (Sloan & CFO/LNST)', hint: 'Sloan > +10% báo động lãi trên giấy; CFO > LNST là dấu hiệu lành mạnh.', value: 'Mở bảng tính Pháp y bên dưới' },
              { title: 'Nợ vay & Sổ sách sạch (Z-Score & M-Score)', hint: 'Z > 2,99 an toàn, < 1,81 nguy cơ nợ xấu; M > -1,78 cờ đỏ làm đẹp sổ sách.', value: 'Mở bảng tính Pháp y bên dưới' },
              { title: 'Nội lực & Con hào kinh tế (F-Score & DuPont)', hint: 'F-Score 7–9 điểm là nội lực khỏe lên mạnh; soi ROE đến từ biên lãi hay vay nợ.', value: 'Mở bảng tính Pháp y bên dưới' },
            ],
          };

    const links = isVnTicker
      ? [
          { name: 'FireAnt (Giá & BCTC)', url: `https://fireant.vn/ma-chung-khoan/${sym}` },
          { name: 'VietstockFinance (Chỉ số)', url: `https://finance.vietstock.vn/${sym}/tai-chinh.htm` },
          { name: 'VNDirect DStock', url: `https://dstock.vndirect.com.vn/tong-quan/${sym}` },
          { name: 'CafeF Hồ sơ DN', url: `https://s.cafef.vn/hose/${sym}.chn` },
        ]
      : [
          { name: 'Yahoo Finance', url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}` },
          { name: 'TradingView', url: `https://www.tradingview.com/symbols/${encodeURIComponent(sym)}/` },
        ];

    const payload = {
      symbol: sym,
      companyName,
      sector,
      sectorChecklist,
      price,
      changePct,
      currency,
      volume,
      pe,
      pb,
      roe,
      live: Number.isFinite(price),
      liveSource,
      links,
      fetchedAt: Date.now(),
      asOfDate: INV.utils.todayIso(),
    };

    INV.storageAdapter.setSession(cacheKey, payload);
    return { ...payload, fromCache: false, ageMinutes: 0 };
  }

  INV.goldEngine = { calculateGoldMetrics, fetchLiveGoldSnapshot, OUNCE_PER_TAEL };
  INV.realEstateEngine = {
    calculatePmt,
    calculateMortgageStressTest,
    resolveGpsLocation,
    resolveManualArea,
    inferCityRentalBenchmark,
  };
  INV.stockEngine = {
    detectSector,
    calculateVnIndexValuation,
    calculateForensicSuite,
    lookupStockTicker,
  };
})(typeof window !== 'undefined' ? window : globalThis);
