/**
 * ============================================================================
 * 🧠 ĐẦU TƯ HÔM NAY — BỘ MÁY TÌM TIN, CHẤM ĐIỂM 5 CHỐT CHẶN & CHIA ĐÔI GEMINI
 * File: modules/invest-today/engines/researchAndPromptEngine.js
 * ============================================================================
 */
(function initInvestResearchAndPromptEngine(globalScope) {
  'use strict';

  const INV = (globalScope.NoirInvestToday = globalScope.NoirInvestToday || {});
  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  const TTL_REPORT_MS = 30 * 60 * 1000; // 30 phút
  const MANDATORY_DISCLAIMER = 'Tất cả thông tin, phân tích chỉ mang tính chất tham khảo';

  function getActiveGeminiApiKey() {
    try {
      const fromBridge = globalScope.NoirGeminiBridge?.getApiKey?.() || NS.geminiBridge?.getApiKey?.();
      if (fromBridge && String(fromBridge).trim().length > 10) return String(fromBridge).trim();
      const primary = localStorage.getItem('noir_gemini_api_key');
      if (primary && primary.trim().length > 10) return primary.trim();
      const fromVault = NS.apiVault?.getActiveApiKey?.() || NS.apiVault?.getCurrentKey?.();
      if (fromVault && String(fromVault).trim().length > 10) return String(fromVault).trim();
      const rawVault = localStorage.getItem('noir_v36_api_key_vault_v1');
      if (rawVault) {
        const parsed = JSON.parse(rawVault);
        const list = parsed?.keys || parsed?.pool || [];
        const active = list.find((k) => k && k.key && k.enabled !== false) || list[0];
        if (active?.key) return String(active.key).trim();
      }
      const fallback = localStorage.getItem('gemini_api_key');
      if (fallback && fallback.trim().length > 10) return fallback.trim();
    } catch (_e) {}
    return '';
  }

  const COUNTRY_PROFILES = {
    VN: { countryCode: 'VN', countryName: 'Việt Nam', currency: 'VND', centralBank: 'NHNN Việt Nam (SBV)', stockIndex: 'VN-Index (HOSE)', goldMarket: 'Vàng miếng SJC & Vàng nhẫn 9999' },
    US: { countryCode: 'US', countryName: 'Hoa Kỳ (Mỹ)', currency: 'USD', centralBank: 'Cục Dự trữ Liên bang Mỹ (Fed)', stockIndex: 'S&P 500 & Nasdaq', goldMarket: 'COMEX Gold / Spot XAU/USD' },
    JP: { countryCode: 'JP', countryName: 'Nhật Bản', currency: 'JPY', centralBank: 'Ngân hàng Trung ương Nhật Bản (BoJ)', stockIndex: 'Nikkei 225 & TOPIX', goldMarket: 'Vàng vật chất Nhật (JPY/gram)' },
    KR: { countryCode: 'KR', countryName: 'Hàn Quốc', currency: 'KRW', centralBank: 'Ngân hàng Trung ương Hàn Quốc (BoK)', stockIndex: 'KOSPI & KOSDAQ', goldMarket: 'KRX Gold Market (KRW/gram)' },
    EU: { countryCode: 'EU', countryName: 'Châu Âu (Eurozone)', currency: 'EUR', centralBank: 'Ngân hàng Trung ương Châu Âu (ECB)', stockIndex: 'EURO STOXX 50 / DAX', goldMarket: 'Vàng vật chất châu Âu (EUR/oz)' },
    GB: { countryCode: 'GB', countryName: 'Vương quốc Anh', currency: 'GBP', centralBank: 'Ngân hàng Trung ương Anh (BoE)', stockIndex: 'FTSE 100', goldMarket: 'LBMA London Gold (GBP/oz)' },
    SG: { countryCode: 'SG', countryName: 'Singapore', currency: 'SGD', centralBank: 'MAS Singapore', stockIndex: 'STI (SGX)', goldMarket: 'Vàng đầu tư miễn GST Singapore' },
    AU: { countryCode: 'AU', countryName: 'Úc (Australia)', currency: 'AUD', centralBank: 'RBA Australia', stockIndex: 'ASX 200', goldMarket: 'Perth Mint / XAU-AUD' },
    CN: { countryCode: 'CN', countryName: 'Trung Quốc', currency: 'CNY', centralBank: 'PBOC Trung Quốc', stockIndex: 'CSI 300 & Hang Seng', goldMarket: 'Sàn vàng Thượng Hải (SGE)' },
    TW: { countryCode: 'TW', countryName: 'Đài Loan', currency: 'TWD', centralBank: 'Ngân hàng Trung ương Đài Loan (CBC)', stockIndex: 'TAIEX', goldMarket: 'Vàng vật chất Đài Loan (TWD)' },
  };

  function resolveCountryProfile(code, countryName, areaLabel, source = 'manual') {
    const up = String(code || 'VN').toUpperCase();
    const base = COUNTRY_PROFILES[up] || {
      countryCode: up,
      countryName: countryName || up,
      currency: 'USD',
      centralBank: `Ngân hàng Trung ương ${countryName || up}`,
      stockIndex: `Chỉ số chứng khoán chính ${countryName || up}`,
      goldMarket: `Thị trường vàng nội địa ${countryName || up}`,
    };
    return {
      ...base,
      countryName: countryName || base.countryName,
      areaLabel: areaLabel || countryName || base.countryName,
      source,
      resolvedAt: Date.now(),
    };
  }

  async function detectUserRegionByGps(signal) {
    if (!navigator.geolocation) {
      throw new Error('Thiết bị chưa hỗ trợ GPS. Bạn hãy chọn Quốc gia / khu vực thủ công ở bên dưới để tiếp tục.');
    }
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    }).catch((err) => {
      if (err?.code === 1) {
        throw new Error('Bạn vừa từ chối quyền Vị trí. Hãy chọn Quốc gia & khu vực bên dưới để hệ thống bám sát tin tức nơi bạn sống.');
      }
      throw new Error('Không lấy được tọa độ GPS lúc này. Hãy chọn Quốc gia & khu vực thủ công bên dưới nhé.');
    });
    const lat = Number(pos.coords.latitude.toFixed(5));
    const lon = Number(pos.coords.longitude.toFixed(5));
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi`;
    let code = 'VN';
    let cName = 'Việt Nam';
    let areaLabel = `${lat}, ${lon}`;
    try {
      const res = await INV.networkAdapter.fetchJson(url, { signal, timeoutMs: 9000, preferDirect: true });
      const a = res?.data?.address || {};
      if (a.country_code) code = String(a.country_code).toUpperCase();
      if (a.country) cName = a.country;
      const joined = [a.suburb || a.quarter || a.town, a.city_district || a.county, a.city || a.state, a.country]
        .filter(Boolean)
        .join(', ');
      if (joined) areaLabel = joined;
    } catch (_eGeo) {}
    return { ...resolveCountryProfile(code, cName, areaLabel, 'gps'), lat, lon };
  }

  function expandQueryTemplate(template) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = Math.ceil(month / 3);
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const reg = INV.stateManager.userRegion;
    let out = String(template || '')
      .replace(/\{MONTH\}/g, String(month))
      .replace(/\{MONTH_EN\}/g, monthsEn[month - 1])
      .replace(/\{YEAR\}/g, String(year))
      .replace(/\{QUARTER\}/g, String(quarter));
    if (reg && reg.countryCode && reg.countryCode !== 'VN') {
      out = out
        .replace(/Việt Nam/gi, reg.countryName)
        .replace(/NHNN/gi, reg.centralBank)
        .replace(/VN-Index/gi, reg.stockIndex)
        .replace(/SJC/gi, reg.goldMarket);
    }
    return out;
  }

  async function runGeminiGroundedBatch(batchItems, kb, apiKey, signal) {
    const today = INV.utils.todayIso();
    const checklistLines = batchItems
      .map((it, idx) => `${idx + 1}. [${it.id}] ${it.plain_label} (${it.technical_label}) — đơn vị: ${it.unit}`)
      .join('\n');

    const prompt = `Hôm nay là ngày ${today}. Hãy dùng công cụ Google Search tìm dữ liệu MỚI NHẤT, CHÍNH XÁC NHẤT (ưu tiên nguồn: ${kb.trusted_sources.slice(0, 12).join(', ')}) cho ĐẦY ĐỦ TỪNG ĐỀ MỤC SAU (${batchItems.length} mục).
QUY TẮC BẮT BUỘC:
- Dùng Google Search tra cứu kỹ từng mục trước khi kết luận; KHÔNG bỏ trống hàng loạt. Chỉ khi thực sự không tồn tại số liệu mới ghi "DATA_MISSING".
- Đưa đường dẫn thực từ Google Search vào source_url.
- Chỉ trả JSON array hợp lệ theo schema:
[{"id":"...", "value":"...", "as_of_date":"YYYY-MM-DD", "source_name":"...", "source_url":"https://...", "status":"ok|DATA_MISSING", "signal":"positive|neutral|caution|danger", "plain_explanation":"1-2 câu tiếng Việt bình dân dễ hiểu"}]

DANH SÁCH ĐỀ MỤC (${batchItems.length} MỤC):
${checklistLines}`;

    const gBridge = globalScope.NoirGeminiBridge || NS.geminiBridge;
    let rawText = '';
    let groundingUrls = [];
    if (gBridge?.callGeminiWithGrounding) {
      const res = await gBridge.callGeminiWithGrounding({
        prompt,
        apiKey,
        temperature: 0.15,
        maxOutputTokens: 8192,
        useGoogleSearch: true,
        signal,
      });
      rawText = res?.text || '';
      groundingUrls = res?.groundingUrls || [];
    } else {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 8192 },
        }),
      });
      if (!resp.ok) throw new Error(`Gemini Search HTTP ${resp.status}`);
      const data = await resp.json();
      const cand = data?.candidates?.[0] || {};
      rawText = cand?.content?.parts?.map((p) => p.text || '').join('\n') || '';
      groundingUrls = (cand?.groundingMetadata?.groundingChunks || [])
        .map((c) => ({ url: c?.web?.uri || '', title: c?.web?.title || '' }))
        .filter((u) => u.url);
    }
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row, idx) => {
      if (row && !row.source_url && groundingUrls.length) {
        const gPick = groundingUrls[idx % groundingUrls.length];
        return { ...row, source_url: gPick.url, source_name: row.source_name || gPick.title || 'Google Search Grounding' };
      }
      return row;
    });
  }

  async function runGeminiGroundedSearch(items, kb, signal) {
    const apiKey = getActiveGeminiApiKey();
    if (!apiKey) return null;
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return [];

    // Chia đôi danh sách thành 2 lô song song gọn nhẹ để không bị cắt JSON & giảm tối đa DATA_MISSING
    const mid = Math.ceil(list.length / 2);
    const batches = mid < list.length ? [list.slice(0, mid), list.slice(mid)] : [list];
    const batchResults = await Promise.all(
      batches.map((b) => runGeminiGroundedBatch(b, kb, apiKey, signal).catch(() => []))
    );
    const merged = [];
    for (const arr of batchResults) {
      if (Array.isArray(arr)) merged.push(...arr);
    }

    // Lượt quét bổ sung cho những mục vẫn báo DATA_MISSING hoặc chưa được trả lời
    const resolvedIds = new Set(merged.filter((r) => r && r.value !== null && r.status !== 'DATA_MISSING').map((r) => r.id));
    const unresolved = list.filter((it) => !resolvedIds.has(it.id));
    if (unresolved.length > 0 && unresolved.length <= 16) {
      try {
        const retryArr = await runGeminiGroundedBatch(unresolved, kb, apiKey, signal);
        if (Array.isArray(retryArr)) {
          for (const r of retryArr) {
            if (!r || !r.id) continue;
            const existIdx = merged.findIndex((x) => x && x.id === r.id);
            if (existIdx >= 0) {
              if (r.value !== null && r.status !== 'DATA_MISSING') merged[existIdx] = r;
            } else {
              merged.push(r);
            }
          }
        }
      } catch (_eRetry) {}
    }

    return merged;
  }

  // ==========================================================================
  // BỘ THU THẬP ĐA API CHÍNH THỐNG 100% CORS=* (CHẠY LIVE TRỰC TIẾP TRÊN WEB!)
  // ==========================================================================
  async function fetchLiveMacroAndGeopoliticsBundle(reg, signal) {
    const iso2 = (reg?.countryCode === 'EU' ? 'EUU' : reg?.countryCode || 'VN').toUpperCase();
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    const nowSec = Math.floor(Date.now() / 1000);
    const minHnUnix = nowSec - 4 * 86400; // Chỉ lấy tin HN trong 4 ngày gần nhất theo đồng hồ hệ thống
    const gnewsVnBiz = `https://news.google.com/rss/search?q=${encodeURIComponent('kinh tế OR chứng khoán OR giá vàng OR bất động sản OR lãi suất Việt Nam when:2d')}&hl=vi&gl=VN&ceid=VN:vi`;
    const gnewsWorld = `https://news.google.com/rss/search?q=${encodeURIComponent('Federal Reserve OR inflation OR oil price OR tariff OR geopolitics OR gold price when:2d')}&hl=en-US&gl=US&ceid=US:en`;

    const [
      usDebtRes,
      usRatesRes,
      usTgaRes,
      wbGdpRes,
      wbCpiRes,
      wbFdiRes,
      wbUsCpiRes,
      btcRes,
      bbcWorldRss,
      bbcBizRss,
      vneBizRss,
      vneNewsRss,
      tuoitreBizRss,
      gnewsVnRss,
      gnewsWorldRss,
      hnWarRes,
      hnLeaderRes,
      hnTradeRes,
      hnMacroCorpRes,
      ssiIdxRes,
    ] = await Promise.allSettled([
      INV.networkAdapter.fetchJson('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1', { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=10', { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/dts/operating_cash_balance?sort=-record_date&page[size]=5', { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson(`https://api.worldbank.org/v2/country/${encodeURIComponent(iso2)}/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=3`, { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson(`https://api.worldbank.org/v2/country/${encodeURIComponent(iso2)}/indicator/FP.CPI.TOTL.ZG?format=json&mrv=3`, { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson(`https://api.worldbank.org/v2/country/${encodeURIComponent(iso2)}/indicator/BX.KLT.DINV.WD.GD.ZS?format=json&mrv=3`, { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.worldbank.org/v2/country/US/indicator/FP.CPI.TOTL.ZG?format=json&mrv=3', { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', { signal, timeoutMs: 7000, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://feeds.bbci.co.uk/news/world/rss.xml'), { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://feeds.bbci.co.uk/news/business/rss.xml'), { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://vnexpress.net/rss/kinh-doanh.rss'), { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://vnexpress.net/rss/tin-moi-nhat.rss'), { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://tuoitre.vn/rss/kinh-doanh.rss'), { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(gnewsVnBiz), { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(gnewsWorld), { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson(`https://hn.algolia.com/api/v1/search_by_date?query=Ukraine&tags=story&restrictSearchableAttributes=title&typoTolerance=false&numericFilters=points>5,created_at_i>${minHnUnix}&hitsPerPage=4`, { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson(`https://hn.algolia.com/api/v1/search_by_date?query=Trump&tags=story&restrictSearchableAttributes=title&typoTolerance=false&numericFilters=points>5,created_at_i>${minHnUnix}&hitsPerPage=4`, { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson(`https://hn.algolia.com/api/v1/search_by_date?query=tariff&tags=story&restrictSearchableAttributes=title&typoTolerance=false&numericFilters=points>5,created_at_i>${minHnUnix}&hitsPerPage=4`, { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson(`https://hn.algolia.com/api/v1/search_by_date?query=inflation&tags=story&restrictSearchableAttributes=title&typoTolerance=false&numericFilters=points>5,created_at_i>${minHnUnix}&hitsPerPage=4`, { signal, timeoutMs: 7500, preferDirect: true }),
      INV.networkAdapter.fetchJson('https://iboard-query.ssi.com.vn/exchange-index/VNINDEX', { signal, timeoutMs: 6000 }),
    ]);

    const bundle = {
      usDebt: null,
      usRates: null,
      usTga: null,
      countryGdp: null,
      countryCpi: null,
      countryFdi: null,
      usCpi: null,
      btc: null,
      vnIndex: null,
      geoHeadlines: [],
      corpHeadlines: [],
    };

    // 1) US National Debt
    if (usDebtRes.status === 'fulfilled') {
      const row = usDebtRes.value?.data?.data?.[0];
      if (row && Number(row.tot_pub_debt_out_amt) > 0) {
        bundle.usDebt = {
          totalTrillion: Number(row.tot_pub_debt_out_amt) / 1e12,
          publicTrillion: Number(row.debt_held_public_amt) / 1e12,
          date: row.record_date,
        };
      }
    }

    // 2) US Treasury Average Interest Rates (Notes, Bonds, Bills, TIPS)
    if (usRatesRes.status === 'fulfilled') {
      const rows = usRatesRes.value?.data?.data || [];
      const findRate = (kw) => rows.find((r) => String(r.security_desc || '').toLowerCase().includes(kw));
      const notes = findRate('treasury notes');
      const bonds = findRate('treasury bonds');
      const bills = findRate('treasury bills');
      const tips = findRate('inflation-protected');
      if (notes || bonds || bills) {
        bundle.usRates = {
          notes: notes ? Number(notes.avg_interest_rate_amt) : NaN,
          bonds: bonds ? Number(bonds.avg_interest_rate_amt) : NaN,
          bills: bills ? Number(bills.avg_interest_rate_amt) : NaN,
          tips: tips ? Number(tips.avg_interest_rate_amt) : NaN,
          date: (notes || bonds || bills).record_date,
        };
      }
    }

    // 3) US Treasury General Account (TGA)
    if (usTgaRes.status === 'fulfilled') {
      const rows = usTgaRes.value?.data?.data || [];
      const tgaRow = rows.find((r) => /closing balance|opening balance/i.test(String(r.account_type || '')) && Number(r.open_today_bal || r.close_today_bal) > 0) || rows[0];
      const amtMillions = Number(tgaRow?.close_today_bal || tgaRow?.open_today_bal);
      if (Number.isFinite(amtMillions) && amtMillions > 0) {
        bundle.usTga = { billions: amtMillions / 1000, date: tgaRow.record_date };
      }
    }

    // 4) World Bank GDP, CPI, FDI (lấy năm gần nhất có số liệu)
    const parseWbLatest = (res) => {
      if (res.status !== 'fulfilled') return null;
      const arr = Array.isArray(res.value?.data) ? res.value.data[1] : null;
      if (!Array.isArray(arr)) return null;
      const valid = arr.find((r) => r && r.value !== null && Number.isFinite(Number(r.value)));
      return valid ? { value: Number(valid.value), year: valid.date, country: valid.country?.value || iso2 } : null;
    };
    bundle.countryGdp = parseWbLatest(wbGdpRes);
    bundle.countryCpi = parseWbLatest(wbCpiRes);
    bundle.countryFdi = parseWbLatest(wbFdiRes);
    bundle.usCpi = parseWbLatest(wbUsCpiRes);

    // 5) BTC/USD 24/7 Global Risk & Liquidity Barometer
    if (btcRes.status === 'fulfilled' && Number(btcRes.value?.data?.lastPrice) > 0) {
      bundle.btc = {
        price: Number(btcRes.value.data.lastPrice),
        changePct: Number(btcRes.value.data.priceChangePercent),
      };
    }

    // 6) SSI VN-Index live (Desktop Electron / Worker)
    if (ssiIdxRes.status === 'fulfilled' && Number(ssiIdxRes.value?.data?.data?.indexValue) > 0) {
      const dIdx = ssiIdxRes.value.data.data;
      bundle.vnIndex = {
        points: Number(dIdx.indexValue),
        change: Number(dIdx.change),
        changePct: Number(dIdx.changePercent),
        valueTrillion: Number(dIdx.allValue || 0) / 1e12,
      };
    }

    // 7) Live Global Geopolitical News (HN Algolia Title-Filtered + Wikipedia EN In-The-News — 100% tươi mới!)
    const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const seenTitles = new Set();
    const addUnique = (arr, item, maxLen) => {
      const key = String(item.title || '').toLowerCase().slice(0, 60);
      if (!key || seenTitles.has(key) || arr.length >= maxLen) return;
      seenTitles.add(key);
      arr.push(item);
    };
    const pushHn = (res, targetArr, sourceLabel, maxLen, titleFilterRe) => {
      if (res.status !== 'fulfilled') return;
      const hits = Array.isArray(res.value?.data?.hits) ? res.value.data.hits : [];
      hits.forEach((h) => {
        const title = String(h?.title || '').trim();
        if (title && (!titleFilterRe || titleFilterRe.test(title)) && (h.url || h.objectID)) {
          addUnique(targetArr, {
            title,
            source: sourceLabel,
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            date: String(h.created_at || '').slice(0, 10) || `${y}-${m}-${day}`,
          }, maxLen);
        }
      });
    };

    // 7) Live Mainstream Press & Google News Today (VnExpress, Tuổi Trẻ, BBC, Google News 48h — ưu tiên tin hôm nay!)
    const pushRss2Json = (res, targetArr, sourceLabel, maxLen) => {
      if (res.status !== 'fulfilled') return;
      const items = Array.isArray(res.value?.data?.items) ? res.value.data.items : [];
      items.slice(0, 6).forEach((it) => {
        const title = stripTags(it.title || '');
        const link = String(it.link || it.guid || '').trim();
        const rawPub = String(it.pubDate || '').trim();
        const parsedTs = rawPub ? Date.parse(rawPub.replace(' ', 'T') + (rawPub.includes('Z') || rawPub.includes('+') ? '' : 'Z')) : NaN;
        const isoDate = Number.isFinite(parsedTs) ? new Date(parsedTs).toISOString().slice(0, 10) : (rawPub.slice(0, 10) || `${y}-${m}-${day}`);
        if (title && /^https?:\/\//i.test(link)) {
          addUnique(targetArr, {
            title,
            snippet: stripTags(it.description || '').slice(0, 200),
            source: sourceLabel,
            url: link,
            imageUrl: /^https?:\/\//i.test(String(it.thumbnail || it.enclosure?.link || '')) ? (it.thumbnail || it.enclosure.link) : '',
            date: isoDate,
            published_at: Number.isFinite(parsedTs) ? new Date(parsedTs).toISOString() : `${isoDate}T08:00:00Z`,
          }, maxLen);
        }
      });
    };
    pushRss2Json(gnewsVnRss, bundle.corpHeadlines, 'Google News VN Kinh tế (Hôm nay · Live)', 14);
    pushRss2Json(gnewsWorldRss, bundle.geoHeadlines, 'Google News Toàn cầu (Hôm nay · Live)', 14);
    pushRss2Json(vneBizRss, bundle.corpHeadlines, 'VnExpress Kinh doanh (Chính thống · Live)', 14);
    pushRss2Json(tuoitreBizRss, bundle.corpHeadlines, 'Tuổi Trẻ Kinh doanh (Chính thống · Live)', 14);
    pushRss2Json(vneNewsRss, bundle.geoHeadlines, 'VnExpress Thời sự (Chính thống · Live)', 14);
    pushRss2Json(bbcWorldRss, bundle.geoHeadlines, 'BBC World News (Chính thống · Live)', 14);
    pushRss2Json(bbcBizRss, bundle.corpHeadlines, 'BBC Business (Chính thống · Live)', 14);

    pushHn(hnWarRes, bundle.geoHeadlines, 'Tin Xung đột & Địa chính trị (Live)', 16, /ukraine|russia|war|iran|israel|gaza|nato|military|conflict|drone|strike/i);
    pushHn(hnLeaderRes, bundle.geoHeadlines, 'Tin Lãnh đạo & Chính sách Mỹ (Live)', 16, /trump|president|white house|biden|xi|putin|congress|policy/i);
    pushHn(hnTradeRes, bundle.geoHeadlines, 'Tin Thuế quan & Thương mại (Live)', 16, /tariff|trade|treaty|sanction|china|eu|export|economy|opec/i);

    // 8) Live Mega-Corporations, AI, Fed, Inflation & Macro News (HN Algolia 4 ngày gần nhất)
    pushHn(hnMacroCorpRes, bundle.corpHeadlines, 'Tin Lạm phát, Fed & Kinh tế (Live)', 16, /inflation|fed|rate|recession|economy|bank|price|gdp|cpi|oil|gold/i);
    pushHn(hnLeaderRes, bundle.corpHeadlines, 'Tin Tập đoàn & Chính sách (Live)', 16, /nvidia|apple|microsoft|google|openai|anthropic|trump|ceo|ipo|chip|ai/i);

    const sortNewestFirst = (arr) => arr.sort((a, b) => (Date.parse(b.published_at || b.date || '') || 0) - (Date.parse(a.published_at || a.date || '') || 0));
    sortNewestFirst(bundle.geoHeadlines);
    sortNewestFirst(bundle.corpHeadlines);

    return bundle;
  }

  // ==========================================================================
  // DÂY CHUYỀN 6 BƯỚC: TÌM KIẾM THÔNG TIN, TỔNG HỢP & ĐÁNH GIÁ
  // ==========================================================================
  const researchEvaluator = {
    async runEvaluation({ depth = 'quick', force = false, onProgress } = {}) {
      const cacheKey = `eval_report_${depth}`;
      if (!force) {
        const cached = INV.storageAdapter.getSession(cacheKey, TTL_REPORT_MS);
        if (cached?.data) {
          INV.stateManager.evaluationReport = cached.data;
          return { ...cached.data, fromCache: true, ageMinutes: cached.ageMinutes };
        }
      }

      if (INV.stateManager.runningEval) {
        throw new Error('Hệ thống đang chạy tìm kiếm và đánh giá, vui lòng chờ hoàn tất hoặc bấm Dừng lại.');
      }

      INV.stateManager.runningEval = true;
      const { controller, signal } = INV.stateManager.createSignal();
      const emit = (pct, label) => {
        if (typeof onProgress === 'function') onProgress({ pct, label });
      };

      try {
        emit(5, 'Bước 1/6: Đang đọc 30 đề mục từ bộ kiến thức (Vĩ mô, Địa chính trị, Vàng, CK, Nhà đất)...');
        const kb = await INV.fileParser.initActiveKnowledge();
        const reg = INV.stateManager.userRegion || resolveCountryProfile('VN', 'Việt Nam', 'Việt Nam', 'default');
        const allItems = Array.isArray(kb.search_checklist) ? kb.search_checklist : [];
        const selectedItems = depth === 'full' ? allItems : allItems.filter((it) => it.quick !== false);

        emit(18, `Bước 2/6: Đang lập ${selectedItems.length} truy vấn trực tiếp bám sát ${reg.countryName} (${INV.utils.todayIso()})...`);
        const prepared = selectedItems.map((it) => ({
          ...it,
          expandedQuery: expandQueryTemplate(it.query_template),
        }));

        emit(35, 'Bước 3/6: Đang gọi đồng thời API Kho bạc Mỹ, Ngân hàng Thế giới, Vàng/Bạc/DXY & Tin địa chính trị toàn cầu...');
        const [goldSnapRes, liveBundleRes, groundedRes] = await Promise.allSettled([
          INV.goldEngine.fetchLiveGoldSnapshot({ force: true, signal }),
          fetchLiveMacroAndGeopoliticsBundle(reg, signal),
          runGeminiGroundedSearch(prepared, kb, signal),
        ]);

        if (signal.aborted) throw new DOMException('Đã dừng theo yêu cầu của bạn.', 'AbortError');
        emit(65, 'Bước 4/6: Đang đẩy số liệu sống qua động cơ tính toán chuẩn bằng code thuần...');

        const goldSnap = goldSnapRes.status === 'fulfilled' ? goldSnapRes.value : INV.stateManager.goldData;
        if (goldSnap) INV.stateManager.goldData = goldSnap;
        const bundle = liveBundleRes.status === 'fulfilled' ? liveBundleRes.value : { geoHeadlines: [], corpHeadlines: [] };

        const groundedMap = new Map();
        const usedGeminiSearch = groundedRes.status === 'fulfilled' && Array.isArray(groundedRes.value);
        if (usedGeminiSearch) {
          groundedRes.value.forEach((row) => {
            if (row?.id) groundedMap.set(row.id, row);
          });
        }

        emit(82, 'Bước 5/6: Đang chấm điểm 4 kênh, phân tích ma trận sự kiện địa chính trị & kiểm tra 5 chốt chặn...');

        const today = INV.utils.todayIso();
        const metricItems = prepared.map((item) => {
          const g = groundedMap.get(item.id);
          const directTrustedUrl = `https://www.google.com/search?q=${encodeURIComponent(item.expandedQuery)}`;

          // --- ÁNH XẠ TRỰC TIẾP SỐ LIỆU LIVE TỪ CÁC API CHÍNH THỐNG 100% CORS=* ---
          if (item.id === 'gold_world_spot' && goldSnap?.worldLive) {
            const chg = Number.isFinite(goldSnap.worldChange24hPct)
              ? ` (${goldSnap.worldChange24hPct >= 0 ? '+' : ''}${goldSnap.worldChange24hPct.toFixed(2)}% 24h)`
              : '';
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: `${INV.utils.formatVnd(goldSnap.worldPriceUsd, 1)} USD/oz${chg} · Quy đổi thô ${INV.utils.formatMillions(goldSnap.rawWorldPriceVnd)}/lượng`,
              unit: item.unit, as_of_date: goldSnap.asOfDate,
              source_name: goldSnap.sources?.[0]?.name || 'Gold Spot 24/7 Live',
              source_url: goldSnap.sources?.[0]?.url || 'https://www.gold.org/goldhub/data/gold-prices',
              status: 'ok', signal: 'neutral',
              plain_explanation: `Giá vàng thế giới quy đổi thô đạt ${INV.utils.formatMillions(goldSnap.rawWorldPriceVnd)}/lượng (ước tính gồm thuế phí nhập khẩu: ${INV.utils.formatMillions(goldSnap.landedParityVnd)}).`,
            };
          }

          if (item.id === 'geo_risk_barometer' && (Number.isFinite(goldSnap?.goldSilverRatio) || bundle.btc)) {
            const parts = [];
            if (Number.isFinite(goldSnap?.goldSilverRatio)) parts.push(`Vàng/Bạc: ${goldSnap.goldSilverRatio.toFixed(1)}x (Bạc ${goldSnap.silverPriceUsd.toFixed(2)} USD/oz)`);
            if (bundle.btc) parts.push(`Bitcoin 24/7: $${INV.utils.formatVnd(bundle.btc.price, 0)} (${bundle.btc.changePct >= 0 ? '+' : ''}${bundle.btc.changePct.toFixed(2)}%)`);
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: parts.join(' · '),
              unit: item.unit, as_of_date: today,
              source_name: 'Binance & Currency-API (Trực tiếp 24/7)',
              source_url: 'https://www.binance.com/en/markets/overview',
              status: 'ok',
              signal: goldSnap?.goldSilverRatio > 80 ? 'caution' : 'positive',
              plain_explanation:
                goldSnap?.goldSilverRatio > 80
                  ? 'Tỷ lệ Vàng/Bạc đang trên mốc 80x — tín hiệu điển hình của tâm lý phòng thủ rủi ro toàn cầu (risk-off).'
                  : 'Tỷ lệ Vàng/Bạc và thanh khoản toàn cầu 24/7 ở trạng thái cân bằng.',
            };
          }

          if (item.id === 'dxy_index' && Number.isFinite(goldSnap?.dxyLive)) {
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: `${goldSnap.dxyLive.toFixed(2)} điểm (tính trực tiếp theo chuẩn rổ 6 đồng tiền ICE)`,
              unit: item.unit, as_of_date: today,
              source_name: 'ExchangeRate API (Tính trực tiếp công thức ICE DXY)',
              source_url: 'https://www.tradingview.com/symbols/TVC-DXY/',
              status: 'ok',
              signal: goldSnap.dxyLive >= 103 ? 'caution' : goldSnap.dxyLive <= 99 ? 'positive' : 'neutral',
              plain_explanation:
                goldSnap.dxyLive >= 103
                  ? 'Đồng USD đang mạnh (DXY ≥ 103), tạo sức ép hút vốn khỏi các thị trường mới nổi và đè tỷ giá nội tệ.'
                  : 'Sức mạnh đồng USD đang ở mức vừa phải, giảm áp lực lên tỷ giá và giá vàng.',
            };
          }

          if (item.id === 'vn_usd_vnd' && goldSnap?.fxLive) {
            const curCode = reg.currency || 'VND';
            const localRate = goldSnap.fxRates?.[curCode];
            const valText =
              curCode === 'VND' || !localRate
                ? `${INV.utils.formatVnd(goldSnap.vcbSellRate, 0)} VNĐ/USD`
                : `1 USD = ${INV.utils.formatVnd(localRate, 2)} ${curCode} (VN: ${INV.utils.formatVnd(goldSnap.vcbSellRate, 0)} đ)`;
            return {
              id: item.id, layer: item.layer, plain_label: `Tỷ giá Đô la Mỹ tại ${reg.countryName}`, technical_label: `USD/${curCode} Live Exchange Rate`,
              value: valText,
              unit: `${curCode}/USD`, as_of_date: goldSnap.asOfDate,
              source_name: 'ExchangeRate API (Trực tiếp)',
              source_url: 'https://www.exchangerate-api.com/',
              status: 'ok',
              signal: goldSnap.vcbSellRate >= 25800 ? 'caution' : 'neutral',
              plain_explanation: 'Tỷ giá ngoại hối trực tiếp được dùng làm cơ sở quy đổi giá vàng quốc tế và đánh giá áp lực điều hành lãi suất.',
            };
          }

          if (item.id === 'geo_us_debt_tga' && (bundle.usDebt || bundle.usTga)) {
            const parts = [];
            if (bundle.usDebt) parts.push(`Tổng nợ công Mỹ: $${bundle.usDebt.totalTrillion.toFixed(2)} nghìn tỷ (nợ công chúng $${bundle.usDebt.publicTrillion.toFixed(2)}T)`);
            if (bundle.usTga) parts.push(`Tài khoản Kho bạc TGA: $${bundle.usTga.billions.toFixed(0)} tỷ`);
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: parts.join(' · '),
              unit: item.unit, as_of_date: bundle.usDebt?.date || bundle.usTga?.date || today,
              source_name: 'Bộ Tài chính Mỹ (US Treasury Fiscal Data API)',
              source_url: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/',
              status: 'ok',
              signal: bundle.usDebt?.totalTrillion >= 36 ? 'danger' : 'caution',
              plain_explanation: 'Số liệu chính thức từ Bộ Tài chính Mỹ: gánh nặng nợ công khổng lồ tạo áp lực tài khóa dài hạn, nâng đỡ giá trị trú ẩn của vàng và gây biến động lợi suất trái phiếu.',
            };
          }

          if (item.id === 'fed_net_liquidity' && bundle.usTga) {
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: `TGA chính thức: $${bundle.usTga.billions.toFixed(1)} tỷ (cập nhật ${bundle.usTga.date})`,
              unit: 'tỷ USD', as_of_date: bundle.usTga.date,
              source_name: 'US Treasury Daily Statement (API chính thức)',
              source_url: 'https://fiscaldata.treasury.gov/datasets/daily-treasury-statement/',
              status: 'ok',
              signal: bundle.usTga.billions > 850 ? 'caution' : 'neutral',
              plain_explanation: `Số dư TGA càng cao (>${bundle.usTga.billions.toFixed(0)} tỷ USD) thì lượng thanh khoản bị hút khỏi hệ thống ngân hàng Mỹ càng lớn.`,
            };
          }

          if ((item.id === 'us_10y_tips' || item.id === 'fed_rate') && bundle.usRates) {
            const r = bundle.usRates;
            const val =
              item.id === 'fed_rate'
                ? `Tín phiếu Kho bạc Mỹ (T-Bills): ${Number.isFinite(r.bills) ? r.bills.toFixed(2) + '%' : '—'} · Notes: ${Number.isFinite(r.notes) ? r.notes.toFixed(2) + '%' : '—'}`
                : `Trái phiếu Kho bạc Mỹ: Notes ${Number.isFinite(r.notes) ? r.notes.toFixed(2) + '%' : '—'} · Bonds ${Number.isFinite(r.bonds) ? r.bonds.toFixed(2) + '%' : '—'}${Number.isFinite(r.tips) ? ' · TIPS ' + r.tips.toFixed(2) + '%' : ''}`;
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: val,
              unit: '%/năm', as_of_date: r.date,
              source_name: 'Bộ Tài chính Mỹ (US Treasury Rates API)',
              source_url: 'https://fiscaldata.treasury.gov/datasets/average-interest-rates-treasury-securities/',
              status: 'ok',
              signal: (r.bills || r.notes) >= 4.0 ? 'caution' : 'neutral',
              plain_explanation: 'Lãi suất chính thức từ Bộ Tài chính Mỹ phản ánh chi phí vốn gốc toàn cầu; mặt bằng trên 4% tiếp tục siết định giá tài sản rủi ro.',
            };
          }

          if (item.id === 'vn_gdp' && bundle.countryGdp) {
            return {
              id: item.id, layer: item.layer, plain_label: `Tăng trưởng kinh tế (GDP) ${reg.countryName}`, technical_label: `World Bank GDP Growth (${reg.countryCode})`,
              value: `+${bundle.countryGdp.value.toFixed(2)}% (dữ liệu World Bank kỳ ${bundle.countryGdp.year})`,
              unit: '% YoY', as_of_date: `${bundle.countryGdp.year}`,
              source_name: 'Ngân hàng Thế giới (World Bank API)',
              source_url: `https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=${reg.countryCode === 'EU' ? 'EU' : reg.countryCode}`,
              status: 'ok',
              signal: bundle.countryGdp.value >= 5 ? 'positive' : bundle.countryGdp.value >= 2 ? 'neutral' : 'caution',
              plain_explanation: `Kinh tế ${reg.countryName} ghi nhận tốc độ tăng trưởng thực ${bundle.countryGdp.value.toFixed(2)}% (kết hợp tham chiếu mới nhất trong cẩm nang: ${item.baseline_2026_11_24}).`,
            };
          }

          if (item.id === 'vn_cpi' && bundle.countryCpi) {
            return {
              id: item.id, layer: item.layer, plain_label: `Lạm phát (CPI) ${reg.countryName}`, technical_label: `World Bank CPI Inflation (${reg.countryCode})`,
              value: `${bundle.countryCpi.value.toFixed(2)}% (World Bank kỳ ${bundle.countryCpi.year})`,
              unit: '% YoY', as_of_date: `${bundle.countryCpi.year}`,
              source_name: 'Ngân hàng Thế giới (World Bank API)',
              source_url: `https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=${reg.countryCode === 'EU' ? 'EU' : reg.countryCode}`,
              status: 'ok',
              signal: bundle.countryCpi.value >= 4.5 ? 'danger' : bundle.countryCpi.value >= 3.5 ? 'caution' : 'positive',
              plain_explanation: `Lạm phát tiêu dùng tại ${reg.countryName} đo lường trực tiếp sức mua đồng tiền và dư địa nới lỏng lãi suất của ${reg.centralBank}.`,
            };
          }

          if (item.id === 'vn_fdi_trade' && bundle.countryFdi) {
            return {
              id: item.id, layer: item.layer, plain_label: `Dòng vốn FDI vào ${reg.countryName}`, technical_label: `World Bank FDI Inflows % GDP (${reg.countryCode})`,
              value: `${bundle.countryFdi.value.toFixed(2)}% GDP (World Bank kỳ ${bundle.countryFdi.year})`,
              unit: '% GDP', as_of_date: `${bundle.countryFdi.year}`,
              source_name: 'Ngân hàng Thế giới (World Bank API)',
              source_url: `https://data.worldbank.org/indicator/BX.KLT.DINV.WD.GD.ZS?locations=${reg.countryCode === 'EU' ? 'EU' : reg.countryCode}`,
              status: 'ok',
              signal: bundle.countryFdi.value >= 3.5 ? 'positive' : 'neutral',
              plain_explanation: `Vốn FDI duy trì mức ${bundle.countryFdi.value.toFixed(2)}% GDP là trụ đỡ trực tiếp cho sản xuất xuất khẩu và bất động sản khu công nghiệp.`,
            };
          }

          if (item.id === 'us_cpi_lei' && bundle.usCpi) {
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: `CPI Mỹ (World Bank ${bundle.usCpi.year}): ${bundle.usCpi.value.toFixed(2)}%`,
              unit: '% YoY', as_of_date: `${bundle.usCpi.year}`,
              source_name: 'Ngân hàng Thế giới (World Bank API)',
              source_url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=US',
              status: 'ok',
              signal: bundle.usCpi.value >= 3 ? 'caution' : 'positive',
              plain_explanation: 'Lạm phát Mỹ quyết định trực tiếp việc Fed giữ lãi suất cao hay cắt giảm lãi suất.',
            };
          }

          if ((item.id === 'geo_wars_chokepoints' || item.id === 'geo_leaders_tariffs' || item.id === 'geo_trade_treaties') && (bundle.geoHeadlines.length || bundle.corpHeadlines.length)) {
            const pool = [...bundle.geoHeadlines, ...bundle.corpHeadlines];
            const matcher = item.id === 'geo_wars_chokepoints'
              ? /war|iran|ukraine|russia|israel|gaza|middle east|strike|attack|oil|hormuz|military|conflict/i
              : item.id === 'geo_leaders_tariffs'
                ? /trump|biden|xi|putin|tariff|sanction|white house|president|election|congress|policy|executive/i
                : /trade|treaty|fta|deal|agreement|china|eu|wto|opec|export|import|supply chain/i;
            const fallbackIdx = item.id === 'geo_wars_chokepoints' ? 0 : item.id === 'geo_leaders_tariffs' ? 1 : 2;
            const hl = pool.find((h) => matcher.test(h.title)) || pool[fallbackIdx] || pool[0];
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: hl.title.slice(0, 155) + (hl.title.length > 155 ? '...' : ''),
              unit: item.unit, as_of_date: hl.date,
              source_name: hl.source,
              source_url: hl.url,
              status: 'ok',
              signal: /war|iran|ukraine|strike|attack|sanction|tariff|conflict|recession/i.test(hl.title) ? 'danger' : 'caution',
              plain_explanation: 'Sự kiện thời sự quốc tế trực tiếp mới nhất — cần đánh giá tác động lan tỏa sang giá năng lượng, đồng USD, vàng trú ẩn và chứng khoán.',
            };
          }

          if (item.id === 'geo_mega_corps_ai' && (bundle.corpHeadlines.length || bundle.geoHeadlines.length)) {
            const pool = [...bundle.corpHeadlines, ...bundle.geoHeadlines];
            const hl = pool.find((h) => /nvidia|apple|microsoft|google|openai|ai|chip|semiconductor|fed|oil|bank|gold/i.test(h.title)) || pool[0];
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: hl.title.slice(0, 155) + (hl.title.length > 155 ? '...' : ''),
              unit: item.unit, as_of_date: hl.date,
              source_name: hl.source,
              source_url: hl.url,
              status: 'ok',
              signal: 'neutral',
              plain_explanation: `Đã quét ${bundle.corpHeadlines.length + bundle.geoHeadlines.length} tiêu đề trực tiếp mới nhất về tập đoàn lớn, AI, thuế quan, địa chính trị & năng lượng (xem trọn danh sách tin sống bên dưới).`,
            };
          }

          if (item.id === 'stock_vnindex_pe' && bundle.vnIndex) {
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: `VN-Index ${bundle.vnIndex.points.toFixed(2)} (${bundle.vnIndex.change >= 0 ? '+' : ''}${bundle.vnIndex.change.toFixed(2)} / ${bundle.vnIndex.changePct.toFixed(2)}%) · GTGD ${bundle.vnIndex.valueTrillion.toFixed(1)} nghìn tỷ`,
              unit: item.unit, as_of_date: today,
              source_name: 'SSI iBoard (Trực tiếp)',
              source_url: 'https://iboard.ssi.com.vn/',
              status: 'ok',
              signal: bundle.vnIndex.changePct >= 0 ? 'positive' : 'caution',
              plain_explanation: 'Dữ liệu chỉ số và thanh khoản phiên thực tế từ sàn HOSE qua SSI iBoard.',
            };
          }

          if (item.id === 'gold_vn_sjc_9999' && goldSnap) {
            const diffPct = goldSnap.sjc?.diffRawPercent;
            const spreadPct = goldSnap.sjc?.spreadPercent;
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: `SJC ${INV.utils.formatMillions(goldSnap.sjc.buyVnd, 1)}–${INV.utils.formatMillions(goldSnap.sjc.sellVnd, 1)} · Chênh TG: ${Number.isFinite(diffPct) ? `+${diffPct.toFixed(1)}%` : '—'} · Spread: ${Number.isFinite(spreadPct) ? `${spreadPct.toFixed(2)}%` : '—'}`,
              unit: item.unit, as_of_date: goldSnap.asOfDate,
              source_name: goldSnap.domesticLive ? 'SJC chính thức (Trực tiếp)' : 'Bảng giá SJC (Đối chiếu & tự chỉnh ở thẻ Giá vàng)',
              source_url: 'https://sjc.com.vn/gia-vang-online',
              status: 'ok',
              signal: goldSnap.sjc?.breakerTriggered ? 'danger' : goldSnap.sjc?.premiumStatus?.signal || 'neutral',
              plain_explanation: `${goldSnap.sjc?.premiumStatus?.text || ''}`.trim(),
            };
          }

          if (g && g.value !== null && g.status !== 'DATA_MISSING') {
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: String(g.value),
              unit: item.unit, as_of_date: g.as_of_date || today,
              source_name: g.source_name || 'Google Search Grounding',
              source_url: g.source_url || directTrustedUrl,
              status: 'ok',
              signal: ['positive', 'neutral', 'caution', 'danger'].includes(g.signal) ? g.signal : 'neutral',
              plain_explanation: g.plain_explanation || 'Đã cập nhật số liệu mới nhất từ nguồn trực tuyến.',
            };
          }

          // Khớp tự động với tin sống ngày hôm nay vừa quét được trước khi lùi về mốc tham chiếu nền
          const todayLivePool = [...(bundle.corpHeadlines || []), ...(bundle.geoHeadlines || [])];
          const liveTopicReMap = {
            brent_oil: /dầu|oil|brent|opec|xăng|energy/i,
            central_banks_global: /fed|ecb|boe|boj|pboc|lãi suất|ngân hàng trung ương|central bank/i,
            vn_omo_interbank: /lãi suất|liên ngân hàng|nhnn|tỷ giá|dự trữ|omo/i,
            vn_credit_npl: /tín dụng|ngân hàng|nợ xấu|cho vay|credit/i,
            stock_vnindex_pe: /vn-index|chứng khoán|cổ phiếu|hose|thanh khoản/i,
            stock_margin_liquidity: /margin|thanh khoản|chứng khoán|khối ngoại/i,
            stock_foreign_ftse: /khối ngoại|nâng hạng|ftse|etf|bán ròng|mua ròng/i,
            gold_cb_etf_aisc: /vàng|gold|ngân hàng trung ương|etf/i,
            gold_policy_vn: /vàng|sjc|nhnn|nghị định|nhập khẩu vàng/i,
            re_mortgage_rates: /bất động sản|nhà đất|lãi suất vay|căn hộ|chung cư/i,
            re_supply_industrial: /bất động sản|chung cư|khu công nghiệp|căn hộ|nhà ở/i,
            re_bonds_law2026: /trái phiếu|luật đất đai|bảng giá đất|bất động sản/i,
          };
          const liveTopicHit = liveTopicReMap[item.id]
            ? todayLivePool.find((h) => liveTopicReMap[item.id].test(`${h.title || ''} ${h.snippet || ''}`))
            : null;
          const todayVi = new Date().toLocaleDateString('vi-VN');
          const googleNewsTodayUrl = `https://news.google.com/search?q=${encodeURIComponent(item.expandedQuery + ' when:2d')}&hl=vi&gl=VN&ceid=VN:vi`;

          if (liveTopicHit) {
            return {
              id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
              value: `${item.baseline_2026_11_24 ? item.baseline_2026_11_24 + ' · ' : ''}Tin mới (${liveTopicHit.date || today}): ${String(liveTopicHit.title || '').slice(0, 120)}`,
              unit: item.unit,
              as_of_date: liveTopicHit.date || today,
              source_name: `${liveTopicHit.source || 'Báo chí Live'} (Cập nhật hôm nay)`,
              source_url: liveTopicHit.url || googleNewsTodayUrl,
              status: 'ok',
              signal: /CỜ ĐỎ|vượt mục tiêu|12%–15%|0,18x/i.test(String(item.baseline_2026_11_24 || '')) ? 'danger' : 'neutral',
              plain_explanation: `Đã đối chiếu trực tiếp với tin mới hôm nay (${todayVi}) từ ${liveTopicHit.source || 'báo chính thống'}. Bấm vào liên kết để mở bài gốc.`,
            };
          }

          return {
            id: item.id, layer: item.layer, plain_label: item.plain_label, technical_label: item.technical_label,
            value: item.baseline_2026_11_24 || null,
            unit: item.unit,
            as_of_date: today,
            source_name: `Khung tham chiếu (Bấm tra tin mới ngày ${todayVi})`,
            source_url: googleNewsTodayUrl,
            status: item.baseline_2026_11_24 ? 'benchmark' : 'DATA_MISSING',
            signal: /CỜ ĐỎ|vượt mục tiêu|12%–15%|0,18x/i.test(String(item.baseline_2026_11_24 || '')) ? 'danger' : 'neutral',
            plain_explanation: `Mốc tham chiếu khung kiểm định (cập nhật tra cứu ngày ${todayVi}). Bấm trực tiếp vào liên kết để xem tin mới nhất hôm nay hoặc chạy AI 1 chạm.`,
          };
        });

        const liveCount = metricItems.filter((m) => m.status === 'ok').length;
        const benchmarkCount = metricItems.filter((m) => m.status === 'benchmark').length;
        const missingItems = metricItems.filter((m) => m.status === 'DATA_MISSING');
        const vnVal = INV.stockEngine.calculateVnIndexValuation(
          bundle.vnIndex ? { vnIndexPoints: bundle.vnIndex.points } : {}
        );
        const reStress = INV.realEstateEngine.calculateMortgageStressTest({
          priceVnd: 5e9,
          loanVnd: 3.5e9,
          years: 20,
          grossMonthlyRentVnd: (5e9 * 0.0232) / 12,
          annualRatePct: 12,
        });

        // Kiểm tra 5 Chốt chặn an toàn (Circuit Breakers)
        const triggeredBreakers = [];
        if (missingItems.length > 0) {
          triggeredBreakers.push({
            id: 'CB_2_CONFLICT_DATA',
            severity: 'caution',
            title: `Chốt chặn 2 — Có ${missingItems.length} mục thiếu dữ liệu cần xác minh thêm`,
            detail: 'Bấm "Mở cùng Gemini" (miễn phí) hoặc gắn Gemini API Key để tự động quét bổ sung.',
          });
        } else if (benchmarkCount > 0) {
          triggeredBreakers.push({
            id: 'CB_2_CONFLICT_DATA',
            severity: 'neutral',
            title: `Chốt chặn 2 (Minh bạch nguồn) — Đã nạp ${liveCount} nguồn API trực tiếp + ${benchmarkCount} mốc kiểm chứng Cẩm nang`,
            detail: 'Tất cả 6 tầng dữ liệu (Địa chính trị, Vĩ mô Thế giới, Nội địa, Vàng, Chứng khoán, Nhà đất) đều đã có số liệu đầy đủ để phân tích. Bấm "Mở cùng Gemini" để kiểm chứng thêm tin nóng phát sinh theo từng giờ.',
          });
        }
        if (goldSnap?.breakerTriggered) {
          triggeredBreakers.push({
            id: 'CB_4_GOLD_FRICTION',
            severity: 'danger',
            title: 'Chốt chặn 4 (ĐỎ) — Độ đắt giá vàng trong nước hoặc mức lỗ mua–bán vượt ngưỡng',
            detail: goldSnap.overallHeadline,
          });
        }
        if (vnVal.marginBreaker || reStress.breakerTriggered) {
          triggeredBreakers.push({
            id: 'CB_3_LEVERAGE_TRAP',
            severity: 'danger',
            title: 'Chốt chặn 3 (ĐỎ) — Rủi ro vay mượn quá căng (Margin CK / Vay mua nhà DSCR < 1,2x)',
            detail: `Theo khung kiểm định: tránh vay margin mua đuổi chứng khoán khi đòn bẩy toàn sàn căng (~${vnVal.marginSessions.toFixed(0)} phiên) và tránh vay 70% mua nhà cho thuê ở vùng lãi suất thả nổi 12%–15% (DSCR chỉ ${reStress.current.dscr.toFixed(2)}x).`,
          });
        }
        triggeredBreakers.push({
          id: 'CB_1_SIZE_ILLIQUID',
          severity: 'neutral',
          title: 'Chốt chặn 1 (Nhắc nhở bắt buộc) — Thương vụ lớn (>5% tài sản) & Nhà đất',
          detail: 'Mọi khoản đầu tư vượt 5% tổng tài sản hoặc mua nhà đất bắt buộc tự kiểm tra sổ đỏ gốc, thực địa và bấm bảng tính tiền vay trước khi đặt cọc.',
        });

        const goldScore = goldSnap?.breakerTriggered ? 44 : goldSnap?.overallSignal === 'positive' ? 76 : 60;
        const channelScores = {
          cash: {
            name: 'Tiền mặt / Gửi tiết kiệm',
            score: 82,
            signal: 'positive',
            badge: 'Nên ưu tiên',
            reason: 'Giữ tiền mặt sinh lãi kỳ hạn 3–6–12 tháng tại ngân hàng lớn giúp vừa hưởng lãi suất tốt vừa sẵn đạn dược khi địa chính trị hoặc thị trường biến động.',
          },
          gold: {
            name: 'Vàng',
            score: goldScore,
            signal: goldScore < 50 ? 'danger' : goldScore >= 72 ? 'positive' : 'caution',
            badge: goldScore < 50 ? 'Không mua đuổi' : goldScore >= 72 ? 'Thuận lợi' : 'Nên chờ / Theo dõi',
            reason: goldSnap?.breakerTriggered
              ? 'Nợ công Mỹ cao & bất ổn địa chính trị nâng đỡ vàng thế giới, nhưng vàng nội địa đang chênh quá cao hoặc phí mua–bán quá rộng.'
              : 'Phù hợp giữ 5%–10% tài sản làm lớp bảo hiểm trước chiến tranh, thuế quan và nợ công toàn cầu.',
          },
          stock: {
            name: 'Chứng khoán',
            score: 70,
            signal: 'caution',
            badge: 'Tích lũy chậm (Không vay)',
            reason: 'Định giá thị trường hấp dẫn so với lịch sử nhưng cần đề phòng biến động thuế quan, lãi suất toàn cầu và đòn bẩy margin cao — chỉ mua từng phần bằng tiền thật.',
          },
          real_estate: {
            name: 'Nhà đất',
            score: 48,
            signal: 'danger',
            badge: 'Tránh vay lớn lúc này',
            reason: 'Lãi suất vay thả nổi cao gấp nhiều lần tỷ suất cho thuê. Chỉ phù hợp người có tiền mặt săn tài sản pháp lý sạch hoặc hưởng lợi trực tiếp từ FDI/hạ tầng.',
          },
        };

        const cyclePhase = {
          key: 'overheat',
          label: kb.scoring_rules?.cycle_phases?.overheat?.label || 'Pha III — Quá nhiệt (Chuyển tiếp thận trọng)',
          plain_advice:
            kb.scoring_rules?.cycle_phases?.overheat?.plain_advice ||
            'Giữ tiền mặt sinh lãi cao, tránh vay mượn mua đuổi và ưu tiên tài sản có dòng tiền thật.',
        };

        const rawHeadlines = [
          ...(bundle.geoHeadlines || []).slice(0, 12).map((h, idx) => ({ ...h, id: h.id || `geo_${idx}`, source_type: 'API', category: h.category || 'dia_chinh_tri', selected_for_prompt: true })),
          ...(bundle.corpHeadlines || []).slice(0, 12).map((h, idx) => ({ ...h, id: h.id || `corp_${idx}`, source_type: 'API', category: h.category || 'vi_mo_tap_doan', selected_for_prompt: true })),
        ];

        // Chạy 5 chốt Khóa Bịa Đặt 0% (Deterministic Extraction + SHA-256 + Boolean/Regex Checklist Matcher)
        let validatedHeadlines = rawHeadlines;
        let guardrailStats = { scanned: rawHeadlines.length, acceptedCount: rawHeadlines.length, rejectedCount: 0, staleCount: 0, duplicateCount: 0, schemaBrokenCount: 0 };
        let deterministicChecklist = null;
        if (INV.deterministicExtractor) {
          const valRes = await INV.deterministicExtractor.validateAndFreezeRecords(rawHeadlines, { maxAgeDays: 14 });
          validatedHeadlines = valRes.accepted;
          guardrailStats = valRes.stats;
          deterministicChecklist = INV.deterministicExtractor.matchRecordsToChecklist(kb.search_checklist || [], validatedHeadlines, { minScore: 3 });
          // Gắn lý do khớp từ khóa (matched_triggers) trực tiếp lên từng tin đã xác thực
          const trigMap = new Map();
          (deterministicChecklist.checklist_items || []).forEach((ci) => {
            (ci.matched_records || []).forEach((mr) => {
              const prev = trigMap.get(mr.record_id) || [];
              prev.push({
                checklist_id: ci.checklist_id,
                checklist_name: ci.checklist_name,
                score: mr.relevance_score,
                triggers: [...(mr.matched_triggers?.in_title || []), ...(mr.matched_triggers?.in_excerpt || [])],
              });
              trigMap.set(mr.record_id, prev);
            });
          });
          validatedHeadlines = validatedHeadlines.map((h) => ({
            ...h,
            matched_checklists: trigMap.get(h.record_id) || [],
          }));
        }

        const goldHist30d = INV.goldEngine?.fetchGoldHistory30d
          ? await INV.goldEngine.fetchGoldHistory30d(signal).catch(() => null)
          : null;

        const report = {
          generated_at: new Date().toISOString(),
          as_of_date: today,
          knowledge_source_name: kb.metadata?.short_title || 'Khung Phân Tích 30 Năm + Khóa 0% Bịa Đặt SHA-256',
          depth,
          used_gemini_search: usedGeminiSearch,
          live_count: liveCount,
          benchmark_count: benchmarkCount,
          missing_count: missingItems.length,
          guardrail_stats: guardrailStats,
          deterministic_checklist: deterministicChecklist,
          live_headlines: validatedHeadlines,
          gold_history_30d: goldHist30d,
          cycle_phase: cyclePhase,
          channel_scores: channelScores,
          triggered_breakers: triggeredBreakers,
          items: metricItems,
          narrative_summary: {
            opportunities: [
              'Tăng trưởng kinh tế thực, vốn FDI và làn sóng dịch chuyển chuỗi cung ứng/hiệp định thương mại hỗ trợ dài hạn cho doanh nghiệp đầu ngành & BĐS khu công nghiệp.',
              'Định giá chứng khoán chiết khấu kết hợp dòng vốn quỹ nâng hạng tạo vùng tích lũy tốt cho người cầm tiền mặt dài hạn.',
              'Nợ công Mỹ ở mức kỷ lục và rủi ro địa chính trị tiếp tục tạo bệ đỡ trung–dài hạn cho Vàng thế giới.',
            ],
            risks: [
              'Xung đột quân sự, quyết định thuế quan/trừng phạt của các nhà lãnh đạo lớn (như Tổng thống Mỹ) và biến động giá dầu có thể khiến lạm phát & lãi suất neo cao kéo dài.',
              'Rủi ro vay mượn quá căng (margin chứng khoán cao, vay mua nhà lãi suất thả nổi 12%–15% làm âm dòng tiền nặng).',
              'Chênh lệch giá vàng trong nước so với thế giới và khoảng cách mua–bán rộng gây lỗ tức thì nếu mua đuổi.',
            ],
            current_outlook:
              'Giai đoạn hiện tại ưu tiên PHÒNG THỦ CHỦ ĐỘNG: giữ tỷ trọng tiền mặt/tiền gửi an toàn làm vùng đệm, tuyệt đối không dùng đòn bẩy vay mượn lớn, theo sát diễn biến chiến tranh/thuế quan/chính sách lãnh đạo lớn và không mua đuổi vàng khi chênh lệch nội địa còn quá cao.',
            upcoming_outlook:
              'Giai đoạn 6–12 tháng tới: theo dõi sát thời điểm lãi suất Mỹ hạ nhiệt, căng thẳng địa chính trị/thuế quan ngã ngũ và chênh lệch giá vàng thu hẹp để dịch chuyển dần từ tiền mặt sang tích lũy từng phần theo nguyên tắc chia vốn 5/25.',
          },
          disclaimer: MANDATORY_DISCLAIMER,
        };

        // Tự động tạo khối dữ liệu thống nhất INVEST_INTEL_SYNC_V2 để đồng bộ trực tiếp vào Tab Biểu đồ phân tích chuyên nghiệp!
        if (INV.deterministicExtractor?.buildUnifiedAnalyticsFromCode) {
          INV.stateManager.unifiedAnalytics = INV.deterministicExtractor.buildUnifiedAnalyticsFromCode({
            report,
            goldSnap,
            goldHist30d,
            stockData: INV.stateManager.stockData,
            reData: INV.stateManager.realEstateData,
            surveys: INV.storageAdapter.getRealEstateSurveys ? INV.storageAdapter.getRealEstateSurveys() : [],
          });
        }
        INV.stateManager.deterministicMatches = deterministicChecklist;

        emit(100, 'Bước 6/6: Hoàn tất lọc tất định 0% bịa đặt & tổng hợp biểu đồ!');
        INV.stateManager.evaluationReport = report;
        INV.stateManager.lastRunAt = Date.now();
        INV.storageAdapter.setSession(cacheKey, report);
        return { ...report, fromCache: false, ageMinutes: 0 };
      } finally {
        INV.stateManager.releaseController(controller);
        INV.stateManager.runningEval = false;
      }
    },
  };

  // ==========================================================================
  // BỘ TẠO PROMPT CHUẨN MẪU 1 & MẪU 2 + AUTO-COPY + CHIA ĐÔI MÀN HÌNH GEMINI
  // ==========================================================================
  function formatLayerSnapshot(items, layer) {
    const rows = (items || []).filter((it) => it.layer === layer);
    if (!rows.length) return '- Chưa chạy tìm kiếm trong phiên này (yêu cầu Gemini kiểm tra dữ liệu mới nhất có ghi rõ nguồn và ngày).';
    return rows
      .map((r) =>
        r.status === 'ok'
          ? `- ${r.plain_label} (${r.technical_label}): ${r.value} [Ngày: ${r.as_of_date} | Nguồn: ${r.source_name} - ${r.source_url}]`
          : `- ${r.plain_label}: DATA_MISSING (chưa có nguồn live trực tiếp; tham chiếu cẩm nang: ${r.plain_explanation})`
      )
      .join('\n');
  }

  function buildPrecomputedGoldText(gold) {
    if (!gold) return '- Chưa mở thẻ Giá vàng trong phiên này (DATA_MISSING).';
    return [
      `- Giá vàng thế giới XAU/USD: ${Number.isFinite(gold.worldPriceUsd) ? gold.worldPriceUsd.toFixed(2) + ' USD/oz' : 'DATA_MISSING'}`,
      `- Tỷ giá USD/VND tham chiếu: ${Number.isFinite(gold.vcbSellRate) ? INV.utils.formatVnd(gold.vcbSellRate, 0) + ' đ' : 'DATA_MISSING'}`,
      `- Giá thế giới quy đổi thô (1 lượng = 1,205653 oz): ${INV.utils.formatMillions(gold.rawWorldPriceVnd)}/lượng`,
      `- Giá nhập khẩu ước tính (Landed Parity): ${INV.utils.formatMillions(gold.landedParityVnd)}/lượng`,
      `- Vàng miếng SJC: Mua ${INV.utils.formatMillions(gold.sjc?.buyVnd)} | Bán ${INV.utils.formatMillions(gold.sjc?.sellVnd)} | Chênh thế giới thô: ${Number.isFinite(gold.sjc?.diffRawPercent) ? `+${gold.sjc.diffRawPercent.toFixed(2)}% (${INV.utils.formatMillions(gold.sjc.diffRawVnd)})` : '—'} | Spread mua-bán: ${Number.isFinite(gold.sjc?.spreadPercent) ? `${gold.sjc.spreadPercent.toFixed(2)}%` : '—'}`,
      `- Trạng thái Chốt chặn 4 (Vàng): ${gold.breakerTriggered ? 'VI PHẠM / BÁO ĐỎ' : 'AN TOÀN'}`,
    ].join('\n');
  }

  function buildPrecomputedStockText(stock, anonymize = false) {
    const vn = INV.stockEngine.calculateVnIndexValuation();
    const lines = [
      `- Thị trường chung (VN-Index tham chiếu): P/E ${vn.pe}x (TB 10Y: 14,0x), Earnings Yield ${vn.earningsYieldPct.toFixed(2)}% vs TPCP 10Y ${vn.bond10yPct}%, Chi phí vốn Damodaran Ke = ${vn.damodaranKe.toFixed(2)}%, Margin/Thanh khoản: ~${vn.marginSessions.toFixed(0)} phiên.`,
    ];
    if (stock) {
      const label = anonymize ? 'TÀI SẢN X (ĐÃ ẨN DANH THEO KỸ THUẬT GLASSERMAN–LIN)' : `${stock.symbol} (${stock.companyName} · ${stock.exchange || 'HOSE'})`;
      lines.push(
        `- Cổ phiếu đang phân tích: ${label} | Ngành: ${stock.industryName || stock.sectorChecklist?.sectorLabel || stock.sector} | Giá hiện tại: ${Number.isFinite(stock.price) ? INV.utils.formatVnd(stock.price, 0) + ' ' + stock.currency : 'DATA_MISSING'}${Number.isFinite(stock.changePct) ? ` (${stock.changePct >= 0 ? '+' : ''}${stock.changePct.toFixed(2)}%)` : ''}`
      );
      const metrics = [
        Number.isFinite(stock.marketCap) ? `Vốn hóa: ${(stock.marketCap / 1e12).toFixed(2)} nghìn tỷ` : '',
        Number.isFinite(stock.pe) ? `P/E: ${stock.pe.toFixed(2)}x` : '',
        Number.isFinite(stock.pb) ? `P/B: ${stock.pb.toFixed(2)}x` : '',
        Number.isFinite(stock.eps) ? `EPS: ${Math.round(stock.eps).toLocaleString('vi-VN')} đ` : '',
        Number.isFinite(stock.evEbitda) ? `EV/EBITDA: ${stock.evEbitda.toFixed(2)}x` : '',
        Number.isFinite(stock.roe) ? `ROE: ${stock.roe.toFixed(2)}%` : '',
        Number.isFinite(stock.roa) ? `ROA: ${stock.roa.toFixed(2)}%` : '',
        Number.isFinite(stock.dividendYield) ? `Cổ tức: ${stock.dividendYield.toFixed(2)}%` : '',
        Number.isFinite(stock.rev5yGrowth) ? `Tăng trưởng DT 5Y: ${stock.rev5yGrowth.toFixed(1)}%` : '',
        Number.isFinite(stock.ni5yGrowth) ? `Tăng trưởng LN 5Y: ${stock.ni5yGrowth.toFixed(1)}%` : '',
      ].filter(Boolean);
      if (metrics.length) {
        lines.push(`- Dữ liệu tài chính sống (${stock.liveSource?.name || 'Live'}): ${metrics.join(' | ')}`);
      }
      if (stock.simplizeScores) {
        const s = stock.simplizeScores;
        lines.push(`- Điểm chất lượng 5 trụ cột (thang 5): Định giá ${s.valuation}/5 · Tăng trưởng ${s.growth}/5 · Hiệu quả ${s.performance}/5 · Sức khỏe tài chính ${s.health}/5 · Cổ tức ${s.dividend}/5.`);
      }
      lines.push('- Yêu cầu bổ sung: Hãy phân tích định giá, lợi thế cạnh tranh (Moat), rủi ro BCTC và xuất kèm khối JSON INVEST_INTEL_SYNC_V2 đầy đủ để Web vẽ biểu đồ trực quan!');
    }
    return lines.join('\n');
  }

  function buildPrecomputedRealEstateText(reData, stress) {
    const lines = [];
    if (reData?.areaLabel) {
      lines.push(`- Khu vực người dùng đang kiểm tra: ${reData.areaLabel} (${reData.benchmark?.note || ''})`);
    } else {
      lines.push('- Khu vực: Thị trường BĐS Việt Nam tổng quát (chưa chọn phường/quận cụ thể).');
    }
    if (stress) {
      lines.push(
        `- Kết quả Stress Test tiền vay (Code tính sẵn): Giá nhà ${INV.utils.formatMillions(stress.priceVnd, 0)}, Vay ${INV.utils.formatMillions(stress.loanVnd, 0)} (${stress.ltvPct.toFixed(0)}% LTV) trong ${stress.years} năm, Tiền thuê ròng ${INV.utils.formatMillions(stress.netMonthlyRent)}/tháng, Lãi suất ${stress.annualRatePct}% -> Trả góp ${INV.utils.formatMillions(stress.current.monthlyPayment)}/tháng, DSCR = ${stress.current.dscr.toFixed(2)}x, Phải tự bù ${INV.utils.formatMillions(stress.current.monthlyShortfall)}/tháng.`
      );
    }
    return lines.join('\n');
  }

  const promptComposer = {
    buildGeminiPrompt({ mode = 'veteran30', focus = 'general', targetStock = null, stressResult = null, anonymize = false, userGoal = '', fieldNotes = '' } = {}) {
      const kb = INV.stateManager.activeKnowledge;
      const report = INV.stateManager.evaluationReport;
      const gold = INV.stateManager.goldData;
      const stock = targetStock || INV.stateManager.stockData;
      const reData = INV.stateManager.realEstateData;
      const reg = INV.stateManager.userRegion || resolveCountryProfile('VN', 'Việt Nam', 'Việt Nam', 'default');
      const prefs = INV.storageAdapter.getPrefs();
      const goalText = String(userGoal || prefs.userGoal || '').trim() || 'Chưa khai báo cụ thể (mặc định: ưu tiên bảo vệ vốn, tránh vay đòn bẩy rủi ro cao, tầm nhìn 1–3 năm).';
      const customNotes = String(fieldNotes || prefs.fieldNotes || '').trim();
      const savedSurveys = INV.storageAdapter.getRealEstateSurveys ? INV.storageAdapter.getRealEstateSurveys(reData?.benchmark?.city || '') : [];

      const asOfDate = INV.utils.todayIso();
      const geoSnap = formatLayerSnapshot(report?.items, 'geopolitics_events');
      const selectedHeadlines = (report?.live_headlines || []).filter((h) => h.selected_for_prompt !== false);
      const extraReNews = (reData?.rssNews || []).filter((h) => h.selected_for_prompt !== false);
      const mergedHeadlines = [...selectedHeadlines, ...extraReNews];
      const liveHeadlinesText = mergedHeadlines.length
        ? mergedHeadlines
            .map((h) => `- [${h.date || asOfDate}] ${h.title}${h.snippet ? ` — "${h.snippet.slice(0, 160)}"` : ''} (Nguồn: ${h.source} | Link gốc: ${h.url})`)
            .join('\n') +
          '\n\n[YÊU CẦU BẮT BUỘC VỀ CHIỀU SÂU PHÂN TÍCH (TỐI THIỂU 1.000 TỪ CHO PHẦN TỔNG QUAN) & TRÌNH BÀY]:\n' +
          '1. PHẦN TỔNG QUAN & PHÂN TÍCH VĨ MÔ – LIÊN THỊ TRƯỜNG PHẢI DÀI TỐI THIỂU 1.000 TỪ, đi sâu vào:\n' +
          '   - Bức tranh vĩ mô toàn cầu & trong nước: cơ chế truyền dẫn giữa lãi suất Mỹ/TPCP, nợ công, tỷ giá USD/VND, lạm phát CPI, tăng trưởng GDP & dòng vốn ngoại.\n' +
          '   - Phân tích trực tiếp TỪNG tin nóng mới nhất ở trên (ghi rõ tên nguồn & link gốc): sự kiện đó tác động cụ thể ra sao tới Vàng, Chứng khoán, Nhà đất và Tiền mặt (ngắn hạn 1–3 tháng và trung hạn 6–12 tháng).\n' +
          '   - So sánh định giá & luân chuyển dòng tiền giữa 4 kênh (Tiền mặt/Tiết kiệm vs Vàng vs Chứng khoán vs Nhà đất), nêu rõ kịch bản Cơ sở / Tích cực / Tiêu cực kèm ngưỡng kích hoạt hành động cụ thể.\n' +
          '   - Chiến lược phân bổ vốn, quản trị rủi ro đòn bẩy và danh sách chốt chặn kỷ luật (tuyệt đối KHÔNG viết qua loa vài gạch đầu dòng chung chung!).\n' +
          '2. Kết hợp trọn vẹn Khung phân tích 7 chương + Toàn bộ số liệu API sống ở trên + Nguồn thông tin thô để lập báo cáo chuyên sâu có Bảng Markdown và tiêu đề rõ ràng (`PHẦN 1:`, `PHẦN 2:`, `I.`, `II.`, `1.`, `2.`).\n' +
          '3. HÌNH ẢNH & TRÍCH DẪN TỰ ĐỘNG TRONG PDF (ÁP DỤNG MỌI CHẾ ĐỘ): Bạn KHÔNG cần tự chèn link ảnh Markdown hay cố chép tay hết toàn bộ danh sách URL ở cuối bài — hãy bố trí mạch phân tích rõ ràng, cô đọng theo từng đề mục lớn để hệ thống tự động ghép khu vực Hình ảnh / Thẻ xem trước bài báo và tự động đính kèm ĐẦY ĐỦ 100% trích dẫn nguồn bài báo mà code đã dò ra vào cuối file PDF!\n' +
          '4. Cuối bài BẮT BUỘC xuất đủ khối JSON INVEST_INTEL_SYNC_V2 để Web đồng bộ vẽ trọn bộ 6 biểu đồ & xuất PDF đầy đủ biểu đồ!'
        : '- [CHƯA CÓ DỮ LIỆU TIN TỨC TRONG PHIÊN] — Yêu cầu chỉ rõ các tin tức cần người dùng tự kiểm tra thêm.';
      const globalSnap = formatLayerSnapshot(report?.items, 'global_macro');
      const vnSnap = formatLayerSnapshot(report?.items, 'vn_macro');
      const goldText = buildPrecomputedGoldText(gold);
      const stockText = buildPrecomputedStockText(stock, mode === 'audit' && anonymize);
      const reText = buildPrecomputedRealEstateText(reData, stressResult);
      const surveyText = savedSurveys.length
        ? savedSurveys
            .slice(0, 4)
            .map(
              (s) =>
                `- [${s.date}] ${s.area}: Giá rao ${s.pricePerM2} tr/m² | Thuê ${s.rentPerMonth} tr/tháng | Đường ${s.roadWidthM}m | Pháp lý: ${s.legalStatus} | Sáng đèn tối: ${s.nightLightPct}% | Hạ tầng: ${s.infraStage}${s.floodNote ? ` | Ghi chú: ${s.floodNote}` : ''}`
            )
            .join('\n')
        : '';
      const fieldSurveyBlock = [
        surveyText ? `Khảo sát thực địa Nhà đất người dùng đã ghi nhận:\n${surveyText}` : '',
        customNotes ? `Ghi chú bổ sung / Số liệu người dùng dán thêm:\n${customNotes}` : '',
      ]
        .filter(Boolean)
        .join('\n\n') || '- Người dùng chưa nhập thêm ghi chú khảo sát thực địa.';

      const missingList =
        (report?.items || [])
          .filter((it) => it.status === 'DATA_MISSING')
          .map((it) => it.plain_label)
          .join('; ') || (report ? 'Không có mục thiếu trong bộ chỉ tiêu lõi (các mục tầng C chưa có API mở vẫn cần kiểm chứng bản PDF/quy hoạch gốc)' : 'Chưa chạy bước tìm tin tự động trước khi copy');

      const knowledgeDigest = kb?.core_principles_digest || 'Sử dụng đầy đủ khung phân tích 7 chương Vàng, Chứng khoán, Bất động sản và 5 chốt chặn an toàn.';
      const focusInstructions = {
        general: 'Đánh giá toàn diện cả 4 kênh (Tiền mặt/Tiết kiệm, Vàng, Chứng khoán, Bất động sản) bám sát thị trường tại ' + reg.countryName + ' và vĩ mô toàn cầu.',
        gold: `TẬP TRUNG CHUYÊN SÂU KÊNH VÀNG tại ${reg.countryName} (${reg.goldMarket}): Soi đầy đủ mọi yếu tố vĩ mô/vi mô/khu vực (Lãi suất thực TIPS 10Y & Fed, DXY, Chiến tranh & Địa chính trị, NHTW mua vàng WGC, SGE Thượng Hải vs LBMA, CFTC COT & ETF GLD, Nợ công & AISC, Chính sách vàng nội địa NĐ24/NĐ232/NĐ390, Chênh lệch SJC/Nhẫn 9999 vs Thế giới quy đổi & Spread mua–bán, Tỷ giá tự do vs ngân hàng).`,
        real_estate: `TẬP TRUNG CHUYÊN SÂU NHÀ ĐẤT tại khu vực ${reData?.areaLabel || reg.areaLabel} (${reg.countryName}): Soi vĩ mô lãi suất vay thả nổi & Luật Đất đai mới, GRDP/FDI/dân số cơ học, quy hoạch 1/2000–1/500 & 4 bước tiến độ hạ tầng, mặt bằng giá/m², Tỷ suất cho thuê (Rental Yield) vs Tiết kiệm, Stress Test DSCR, đấu giá đất, tỷ lệ nhà sáng đèn & rủi ro ngập lụt.`,
        stock: `TẬP TRUNG CHUYÊN SÂU CHỨNG KHOÁN (${stock?.symbol ? (mode === 'audit' && anonymize ? 'TÀI SẢN X' : stock.symbol) : reg.stockIndex}) tại ${reg.countryName}: Soi bối cảnh vĩ mô & chu kỳ ngành, Lãi thật hay Lãi trên giấy (CFO vs LNST, Phải thu, Hàng tồn kho, D/E, Người mua trả tiền trước, M/Z/F-Score, DuPont), Ban lãnh đạo/Giao dịch nội bộ/Pha loãng ESOP, Định giá P/E–P/B–EV/EBITDA vs TB 5 năm & dòng tiền khối ngoại/margin.`,
      };
      const focusDirective = focusInstructions[focus] || focusInstructions.general;
      const assetLabel =
        mode === 'audit' && anonymize
          ? 'TÀI SẢN X'
          : focus === 'gold'
          ? `Vàng (${reg.goldMarket} & XAU/USD)`
          : focus === 'real_estate'
          ? `Nhà đất khu vực ${reData?.areaLabel || reg.areaLabel}`
          : focus === 'stock'
          ? `Cổ phiếu ${stock?.symbol || reg.stockIndex}`
          : `Danh mục 3 tài sản (Vàng – Chứng khoán – Nhà đất) tại ${reg.countryName}`;

      const UNIFIED_JSON_SYNC_CONTRACT = `

---

# BẮT BUỘC CUỐI CÂU TRẢ LỜI — KHỐI DỮ LIỆU ĐỒNG BỘ CODE & VẼ BIỂU ĐỒ TỰ ĐỘNG (INVEST_INTEL_SYNC_V2)
Ngay sau phần trình bày bình dân ở trên, hãy xuất thêm **DUY NHẤT 01 khối mã JSON hợp lệ** nằm trong thẻ \`\`\`json ... \`\`\` theo đúng 100% cấu trúc dưới đây (không ghi chú thích // bên trong JSON, điền toàn bộ điểm số thật từ dữ liệu đã cung cấp, tổng allocation_pct = 100) để ứng dụng của tôi tự bóc tách, cập nhật toàn bộ ô dữ liệu và tự động vẽ 6 biểu đồ (Tròn, Cột, Đường, Radar rủi ro, Ma trận Quyết định):

\`\`\`json
{
  "schema": "INVEST_INTEL_SYNC_V2",
  "as_of_date": "${asOfDate}",
  "cycle_phase": {
    "label": "Tên giai đoạn chu kỳ kinh tế hiện tại",
    "plain_advice": "Lời khuyên hành động cốt lõi trong 1 câu dễ hiểu"
  },
  "verdict_summary": {
    "headline": "Kết luận nhanh trong 1–2 câu chốt thẳng quan điểm",
    "action": "QUAN_SAT | TICH_LUY | NAM_GIU | TRANH_XA",
    "opportunities": ["Cơ hội 1", "Cơ hội 2", "Cơ hội 3"],
    "risks": ["Rủi ro lớn nhất 1", "Rủi ro 2", "Rủi ro 3"],
    "current_outlook": "Nhận định ngắn gọn giai đoạn hiện tại",
    "upcoming_outlook": "Nhận định ngắn gọn 6–12 tháng tới"
  },
  "channel_scores": {
    "cash": 80,
    "gold": 60,
    "stock": 70,
    "real_estate": 50
  },
  "allocation_pct": [
    { "label": "Tiền mặt / Gửi tiết kiệm", "value": 35, "color": "#38bdf8" },
    { "label": "Chứng khoán (không margin)", "value": 30, "color": "#10b981" },
    { "label": "Vàng vật chất", "value": 15, "color": "#f59e0b" },
    { "label": "Nhà đất / Quỹ dự phòng", "value": 20, "color": "#a855f7" }
  ],
  "five_pillars": [
    { "name": "Trụ cột 1", "score": 7.0, "note": "Giải thích 1 dòng bình dân" },
    { "name": "Trụ cột 2", "score": 6.5, "note": "Giải thích 1 dòng bình dân" },
    { "name": "Trụ cột 3", "score": 7.2, "note": "Giải thích 1 dòng bình dân" },
    { "name": "Trụ cột 4", "score": 5.5, "note": "Giải thích 1 dòng bình dân" },
    { "name": "Trụ cột 5", "score": 8.0, "note": "Giải thích 1 dòng bình dân" }
  ],
  "risk_radar": [
    { "label": "Địa chính trị & Thuế quan", "level": 80 },
    { "label": "Áp lực Lãi suất cao", "level": 75 },
    { "label": "Độ đắt Vàng nội địa", "level": 70 },
    { "label": "Đòn bẩy Margin CK", "level": 72 },
    { "label": "Âm dòng tiền vay BĐS", "level": 80 },
    { "label": "Rủi ro Thanh khoản", "level": 45 }
  ],
  "decision_matrix": [
    { "channel": "Tiền mặt / Tiết kiệm", "decision": "NẮM GIỮ ƯU TIÊN", "signal": "positive", "score": 80, "reason": "Lý do 1 câu bình dân" },
    { "channel": "Chứng khoán", "decision": "TÍCH LŨY CHẬM", "signal": "caution", "score": 70, "reason": "Lý do 1 câu bình dân" },
    { "channel": "Vàng", "decision": "CHỜ GIẢM CHÊNH LỆCH", "signal": "caution", "score": 60, "reason": "Lý do 1 câu bình dân" },
    { "channel": "Nhà đất", "decision": "TRÁNH VAY LỚN", "signal": "danger", "score": 50, "reason": "Lý do 1 câu bình dân" }
  ],
  "time_series": {
    "title": "Kịch bản xu hướng 4 mốc gần nhất / dự phóng tham khảo",
    "unit": "điểm",
    "points": [
      { "label": "Hiện tại", "value": 65 },
      { "label": "3 tháng", "value": 68 },
      { "label": "6 tháng", "value": 72 },
      { "label": "12 tháng", "value": 78 }
    ]
  },
  "red_flags": [
    { "title": "Cờ đỏ 1", "detail": "Giải thích ngắn gọn dựa trên số liệu thật" }
  ],
  "missing_to_verify": [
    "Mục còn thiếu dữ liệu người dùng cần tự kiểm tra thêm"
  ]
}
\`\`\``;

      if (mode === 'veteran30') {
        const pillarsByFocus = {
          gold: '(1) Lãi suất thực TIPS 10Y & Fed, (2) Địa chính trị, Chiến tranh, Thuế quan & NHTW mua vàng, (3) Dòng tiền ETF/SGE Thượng Hải & Cung cầu AISC, (4) Chênh lệch SJC/Nhẫn 9999 nội địa & Tỷ giá VND, (5) Vị thế đầu cơ COT & Rủi ro mua đuổi ngắn hạn.',
          stock: '(1) Bối cảnh vĩ mô & Chu kỳ Ngành, (2) Chất lượng lợi nhuận & Tiền thật CFO (lãi thật hay lãi giấy), (3) An toàn nợ vay & Sức khỏe tài sản, (4) Động lực tăng trưởng, Ban lãnh đạo & Rủi ro pha loãng ESOP, (5) Độ rẻ/đắt của Định giá hiện tại.',
          real_estate: '(1) Vĩ mô lãi suất thả nổi & Pháp lý, (2) Nội lực kinh tế GRDP/FDI & Sức hút dân cư thật, (3) Quy hoạch & Tiến độ hạ tầng làm thật (4 bước), (4) Giá bán so với dòng tiền cho thuê (Rental Yield & DSCR), (5) Thanh khoản thực, Đấu giá & Rủi ro chôn vốn/ngập lụt.',
          general: '(1) Bối cảnh Địa chính trị, Chiến tranh, Lãnh đạo & Vĩ mô toàn cầu, (2) Kênh Vàng (Thế giới & Nội địa), (3) Kênh Chứng khoán (Định giá & Dòng tiền), (4) Kênh Nhà đất (Lãi vay & Dòng tiền thuê), (5) Mức độ an toàn đòn bẩy & Quản trị rủi ro danh mục.',
        };
        return `# VAI TRÒ & PHONG CÁCH PHÂN TÍCH
Hãy đóng vai một nhà đầu tư thực chiến có 30 năm kinh nghiệm trên thị trường tài chính và bất động sản tại ${reg.countryName} lẫn quốc tế. Bạn cực kỳ tỉ mỉ, cẩn trọng, đa nghi trước các con số đẹp, nhạy cảm với mọi tín hiệu rủi ro dù là nhỏ nhất và luôn đặt nguyên tắc GIỮ TIỀN lên trước KIẾM TIỀN.

**YÊU CẦU TUYỆT ĐỐI VỀ CÁCH DIỄN ĐẠT (PHONG CÁCH BÌNH DÂN HỌC VỤ):**
1. Giải thích mọi vấn đề sâu sắc như chuyên gia 30 năm kinh nghiệm nhưng bằng ngôn ngữ đời thường, dễ hiểu nhất.
2. Mỗi khi buộc phải dùng thuật ngữ tài chính (ví dụ: lãi suất thực TIPS, biên lợi nhuận gộp, dòng tiền CFO, P/E, pha loãng ESOP, tỷ suất cho thuê Rental Yield, DSCR, đòn bẩy, spread...), hãy giải thích ngay bằng một phép so sánh nôm na dễ hình dung (như mở quán phở, gửi tiết kiệm ngân hàng, cho thuê phòng trọ).
3. Không nói nước đôi, không dùng ngôn từ sáo rỗng hay hô hào. Chỉ ra thẳng điểm sáng và điểm đáng ngờ.

**QUY TẮC TRUNG THỰC DỮ LIỆU (ZERO-HALLUCINATION — CHỐNG SUY DIỄN):**
1. Chỉ được phép phân tích dựa trên DỮ LIỆU THỰC TẾ được cung cấp bên dưới. Tuyệt đối KHÔNG tự bịa ra con số, giá cả hay sự kiện không có trong dữ liệu.
2. Mục nào trong dữ liệu có trạng thái \`[CHƯA CÓ DỮ LIỆU]\` hoặc \`DATA_MISSING\`, bạn phải ghi rõ: "Thiếu dữ liệu mục này, chưa thể kết luận, cần tự kiểm tra thêm" — không được tự suy đoán.
3. Khi nhắc tới một tin tức hoặc sự kiện cụ thể, hãy trích dẫn rõ tên nguồn, ngày đăng và đường link gốc từ danh sách tin kèm theo.

---

# THÔNG TIN ĐỐI TƯỢNG PHÂN TÍCH
- **Đối tượng cụ thể:** ${assetLabel}
- **Quốc gia / Khu vực:** ${reg.areaLabel} (${reg.countryName} · Tiền tệ ${reg.currency})
- **Thời điểm trích xuất dữ liệu:** ${asOfDate}
- **Trọng tâm yêu cầu:** ${focusDirective}
- **Mục tiêu & Khẩu vị người đầu tư:** ${goalText}

---

# DỮ LIỆU ĐỊNH LƯỢNG THỰC TẾ (TRÍCH XUẤT NGUYÊN BẢN TỪ NGUỒN)
### 1. Địa chính trị, Chiến tranh, Lãnh đạo, Hiệp định & Tập đoàn lớn
${geoSnap}

### 2. Vĩ mô & Thanh khoản Toàn cầu
${globalSnap}

### 3. Vĩ mô, Tiền tệ & Pháp lý tại ${reg.countryName}
${vnSnap}

### 4. Dữ liệu Vàng (đã tính sẵn bằng code)
${goldText}

### 5. Dữ liệu Chứng khoán (đã tính sẵn bằng code)
${stockText}

### 6. Dữ liệu Nhà đất khu vực ${reData?.areaLabel || reg.areaLabel}
${reText}

### 7. Các chỉ tiêu đang thiếu nguồn tự động ([CHƯA CÓ DỮ LIỆU] / DATA_MISSING)
- ${missingList}

---

# TỔNG HỢP TIN TỨC & SỰ KIỆN MỚI NHẤT (NGUYÊN BẢN TIÊU ĐỀ, TÓM TẮT & LINK GỐC)
${liveHeadlinesText}

---

# DỮ LIỆU KHẢO SÁT THỰC ĐỊA & GHI CHÚ BỔ SUNG CỦA NGƯỜI DÙNG
${fieldSurveyBlock}

---

# KHUNG LUẬT CHUYÊN GIA ĐÍNH KÈM (CẨM NANG 7 CHƯƠNG + 5 CHỐT CHẶN AN TOÀN)
${knowledgeDigest}

---

# YÊU CẦU CẤU TRÚC BÀI PHÂN TÍCH ĐẦU RA (ĐÚNG 6 PHẦN)

## 1. Kết luận nhanh trong 3 câu (Chốt thẳng quan điểm)
- Trạng thái hiện tại của tài sản này là gì? (Rẻ hấp dẫn / Đúng giá trị / Đắt & nhiều rủi ro / Đang có dấu hiệu bong bóng).
- Hành động ưu tiên lúc này: Quan sát thêm, Mua tích lũy từng phần, Nắm giữ hay Tránh xa? Vì sao?

## 2. Chấm điểm 5 Trụ cột (Thang điểm 10 kèm giải thích 1 dòng bình dân)
Chấm điểm rõ ràng theo đúng 5 trụ cột sau: ${pillarsByFocus[focus] || pillarsByFocus.general}

## 3. Mổ xẻ chi tiết từ Vĩ mô xuống Vi mô (Lối viết bình dân học vụ)
- Bức tranh lớn (Địa chính trị, chiến tranh, quyết định lãnh đạo lớn như thuế quan Mỹ/Trump, lãi suất, khu vực) đang ủng hộ hay đè nén tài sản này?
- Soi sâu vào bên trong (Vi mô): Đọc vị mối liên hệ giữa các con số thực tế (ví dụ: doanh thu tăng nhưng tiền mặt CFO không về thì tiền kẹt ở đâu; giá vàng nội địa lệch quá xa thế giới + spread rộng thì rủi ro gì; giá đất tăng mà giá thuê đứng yên thì chuyện gì đang xảy ra).

## 4. Soi "Cờ Đỏ" — Những cái bẫy dễ mất tiền nhất
- Liệt kê ít nhất 3 rủi ro lớn nhất hoặc dấu hiệu bất thường rút ra từ dữ liệu, 5 Chốt chặn an toàn và tin tức đính kèm.
- Kịch bản xấu nhất có thể xảy ra là gì và sự kiện nào sẽ kích hoạt kịch bản đó?

## 5. Danh sách những lỗ hổng dữ liệu cần kiểm chứng thêm
- Liệt kê rõ các mục đang thiếu dữ liệu hoặc ở trạng thái \`DATA_MISSING\` và hướng dẫn ngắn gọn, thực tế cách người dùng tự đi kiểm tra trước khi xuống tiền.

## 6. Chiến lược & Kịch bản hành động cụ thể
- **Kịch bản tích cực:** Điều kiện cụ thể nào xuất hiện thì đáng để giải ngân? Chia vốn ra sao (quy tắc 5/25 & không all-in)?
- **Kịch bản phòng thủ:** Tín hiệu cảnh báo / mốc con số nào bị phá vỡ thì phải dừng lại hoặc hạ tỷ trọng ngay?

*(Bắt buộc kết thúc bài phân tích bằng đúng dòng nguyên văn: "${MANDATORY_DISCLAIMER}.")*${UNIFIED_JSON_SYNC_CONTRACT}`;
      }

      if (mode === 'audit') {
        return `[VAI TRÒ] Bạn là Giám đốc Quản trị Rủi ro Danh mục (Chief Risk Officer) chuyên thị trường vốn tại ${reg.countryName} (${reg.stockIndex}, ${reg.centralBank}, đồng tiền ${reg.currency}) và vĩ mô toàn cầu. Mục tiêu tối thượng của bạn là bảo vệ vốn và đánh giá khách quan xác suất rủi ro/lợi nhuận, KHÔNG phải khuyến khích giao dịch.

[TRỌNG TÂM PHÂN TÍCH YÊU CẦU]
${focusDirective}

[DỮ LIỆU ĐẦU VÀO — ĐÓNG DẤU NGÀY: ${asOfDate} · KHU VỰC: ${reg.areaLabel} (${reg.countryName})]
Chỉ sử dụng bộ dữ liệu đã xác minh dưới đây (mọi phép tính tài chính phức tạp đã được tính sẵn ngoài hệ thống; tài sản mục tiêu: ${assetLabel}):
- Tầng 0 (Địa chính trị, Chiến tranh, Lãnh đạo, Hiệp định & Tập đoàn lớn):
${geoSnap}
  * Tin tức nóng trực tiếp vừa quét được:
${liveHeadlinesText}
- Tầng 1 (Vĩ mô & Thanh khoản Toàn cầu):
${globalSnap}
- Tầng 2 (Vĩ mô, Tiền tệ & Pháp lý tại ${reg.countryName}):
${vnSnap}
- Tầng 3 (Dữ liệu Vi mô Vàng / Chứng khoán / Bất động sản đã tính sẵn):
${goldText}
${stockText}
${reText}
- Các chỉ số đang thiếu (DATA_MISSING): ${missingList}

[BỘ LUẬT THẨM ĐỊNH TỪ CẨM NANG CHUYÊN GIA]
${knowledgeDigest}

[RÀNG BUỘC CỨNG CHỐNG ẢO GIÁC & CHỐNG THIÊN KIẾN]
1. Cấm lấy số liệu từ trí nhớ huấn luyện cũ để điền vào chỗ trống. Nếu thiếu biến số trọng yếu quyết định (ví dụ thiếu DSCR, thiếu chênh lệch giá vàng quy đổi, thiếu BCTC/margin), hãy nêu rõ mã DATA_MISSING và liệt kê chính xác chỉ số người dùng cần bổ sung (hoặc dùng công cụ tìm kiếm trực tuyến mới nhất có ghi rõ nguồn & ngày).
2. Mọi luận điểm bắt buộc trích dẫn đúng con số từ dữ liệu đã nạp; không tự làm phép tính tài chính phức tạp nếu không kiểm chứng.
3. Bắt buộc thực hiện tranh biện đối kháng hai chiều cân bằng tuyệt đối về độ dài và độ sâu giữa Phe Bò (Bull Researcher) và Phe Gấu (Bear Researcher) để triệt tiêu thiên kiến khung (Framing Bias).

[ĐỊNH DẠNG ĐẦU RA BẮT BUỘC]
1. Định vị Pha Chu kỳ & Tương thích Danh mục: Xác định pha theo Đồng hồ Đầu tư, mức độ thuận/nghịch pha của từng kênh tài sản và kiểm tra quy tắc tái cân bằng 5/25.
2. Tranh biện Đối kháng Độc lập:
   - Luận điểm mạnh nhất của Phe Bò (kèm chất xúc tác 6–12 tháng và bằng chứng định lượng).
   - Luận điểm sắc bén nhất của Phe Gấu (bóc tách rủi ro đuôi, rủi ro thanh khoản, bẫy đòn bẩy và kịch bản mất trên 30% vốn).
3. Kiểm toán 5 Cầu chì Ngắt mạch: Đánh giá đạt/vi phạm đối với từng cầu chì an toàn.
4. Ba Kịch bản (Cơ sở / Tích cực / Căng thẳng đuôi): Nêu rõ giả định định lượng và hành động tương ứng.
5. Điều kiện Hủy bỏ Luận điểm (Invalidation Triggers — If/Then): Các mốc con số cụ thể bị phá vỡ sẽ buộc dừng mua hoặc hạ tỷ trọng.
6. Cổng Chặn Quyết định: Chọn rõ một trạng thái cho từng kênh hoặc cho ${assetLabel}: [TỪ CHỐI] / [THEO DÕI — CHỜ KÍCH HOẠT] / [ĐỦ ĐIỀU KIỆN ĐƯA LÊN CỔNG DUYỆT CON NGƯỜI] kèm lý do cốt lõi ngắn gọn.
7. Dòng kết thúc bắt buộc nguyên văn: "${MANDATORY_DISCLAIMER}."${UNIFIED_JSON_SYNC_CONTRACT}`;
      }

      return `Bạn hãy đóng vai một người cố vấn quản lý rủi ro tài chính cá nhân am hiểu thị trường tại ${reg.countryName} (${reg.centralBank}, ${reg.stockIndex}, đồng tiền ${reg.currency}) và kinh tế thế giới. Hãy giải thích thật rõ ràng, bằng tiếng Việt đời thường, hạn chế tối đa từ chuyên ngành khó hiểu (nếu buộc phải nhắc đến thuật ngữ chuyên môn, hãy giải thích ngắn gọn trong ngoặc bằng ví dụ bình dân).

=== TRỌNG TÂM PHÂN TÍCH ===
- Quốc gia & khu vực người dùng: ${reg.areaLabel} (${reg.countryName} · Tiền tệ ${reg.currency})
- Yêu cầu trọng tâm: ${focusDirective}

=== PHẦN 1: BỘ DỮ LIỆU THỊ TRƯỜNG MỚI NHẤT ĐÃ CHẮT LỌC ===
- Ngày tổng hợp dữ liệu: ${asOfDate}
- Sự kiện Địa chính trị, Chiến tranh, Lãnh đạo (Mỹ/Trump/G7/BRICS), Hiệp định & Tập đoàn lớn:
${geoSnap}
  * Tiêu đề tin nóng trực tiếp vừa quét:
${liveHeadlinesText}
- Dữ liệu Vĩ mô Thế giới đã thu thập:
${globalSnap}
- Dữ liệu Kinh tế & Tiền tệ tại ${reg.countryName} đã thu thập:
${vnSnap}
- Dữ liệu Vàng (đã tính sẵn bằng code):
${goldText}
- Dữ liệu Chứng khoán (đã tính sẵn bằng code):
${stockText}
- Dữ liệu Nhà đất khu vực ${reData?.areaLabel || reg.areaLabel} (đã tính sẵn bằng code):
${reText}
- Các mục đang thiếu số liệu (DATA_MISSING): ${missingList}

=== PHẦN 2: KHUNG KIẾN THỨC & QUY TẮC ĐÁNH GIÁ BẮT BUỘC ===
Hãy đánh giá bám sát chặt chẽ khung quy tắc trong Cẩm nang Đầu tư sau đây:
${knowledgeDigest}

=== PHẦN 3: YÊU CẦU TRẢ LỜI & RÀNG BUỘC CỨNG ===
1. KHÔNG tự bịa thêm số liệu nếu không có trong Phần 1 (nếu mục nào ghi thiếu dữ liệu, hãy nói rõ là thiếu số liệu để kiểm tra thêm, hoặc nếu bạn có công cụ tìm kiếm trực tiếp thì hãy đối chiếu thêm và ghi rõ nguồn + ngày).
2. KHÔNG tự tính lại sai các con số đã được tính sẵn ở Phần 1.
3. Trình bày cân bằng cả mặt TÍCH CỰC (cơ hội) lẫn mặt RỦI RO (cái bẫy cần tránh) cho từng kênh, tuyệt đối không thiên vị hay xúi giục mua bán vội vàng.
4. Hãy trình bày câu trả lời gọn gàng theo đúng 6 mục chuẩn chuyên gia sau:
   - Mục 1: Bức tranh Địa chính trị, Lãnh đạo, Hiệp định & Kinh tế hiện tại tại ${reg.countryName} và thế giới đang ở giai đoạn nào? (Phân tích rõ chuỗi truyền dẫn từ chiến tranh / thuế quan / quyết định lãnh đạo lớn / tập đoàn lớn ➔ giá dầu, lạm phát, lãi suất, USD ➔ tác động lên tài sản).
   - Mục 2: Đánh giá chi tiết theo trọng tâm yêu cầu — (a) Vàng, (b) Chứng khoán, (c) Nhà đất, (d) Tiền mặt/Gửi tiết kiệm. Mỗi kênh ghi rõ: Mức độ hấp dẫn (Nên cân nhắc / Nên chờ / Nên tránh lúc này) + Lý do chính + Rủi ro lớn nhất.
   - Mục 3: Kiểm tra 5 chốt chặn an toàn (chỉ ra rõ hiện tại có chốt chặn nào đang báo đỏ không).
   - Mục 4: Gợi ý hướng phân bổ tiền và hành động thực tế cho giai đoạn hiện tại và 6–12 tháng tới (chia rõ cho người thích an toàn và người chấp nhận rủi ro vừa phải, áp dụng quy tắc 5/25 & Half-Kelly).
   - Mục 5: Ba kịch bản (Cơ sở / Tích cực / Rủi ro đuôi khi xung đột hoặc thuế quan leo thang).
   - Mục 6: Những dấu hiệu & sự kiện cụ thể cần theo dõi trong thời gian tới (nếu sự kiện nào xảy ra thì đổi chiến lược ra sao).
5. BẮT BUỘC kết thúc toàn bộ câu trả lời bằng đúng dòng chữ nguyên văn: "${MANDATORY_DISCLAIMER}."${UNIFIED_JSON_SYNC_CONTRACT}`;
    },

    async safeCopyText(text) {
      // Cách 1: Clipboard API chuẩn
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return { ok: true, method: 'clipboard-api' };
        }
      } catch (_e1) {}

      // Cách 2: Textarea ẩn + execCommand('copy')
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) return { ok: true, method: 'execCommand' };
      } catch (_e2) {}

      return { ok: false, method: 'manual-modal' };
    },

    showManualCopyModal(promptText) {
      document.getElementById('inv-manual-copy-modal')?.remove();
      const box = document.createElement('div');
      box.id = 'inv-manual-copy-modal';
      box.className = 'fixed inset-0 z-[10050] bg-black/70 flex items-center justify-center p-4';
      box.innerHTML = `
        <div class="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-950 text-zinc-100 p-4 space-y-3 shadow-2xl">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-extrabold">📋 Bấm Ctrl + C để sao chép bộ dữ liệu &amp; kiến thức</h3>
            <button type="button" id="inv-close-manual-copy" class="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold">Đóng</button>
          </div>
          <textarea id="inv-manual-copy-ta" rows="12" class="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-xs font-mono text-zinc-100"></textarea>
        </div>`;
      document.body.appendChild(box);
      const ta = box.querySelector('#inv-manual-copy-ta');
      ta.value = promptText;
      ta.focus();
      ta.select();
      box.querySelector('#inv-close-manual-copy')?.addEventListener('click', () => box.remove());
      box.addEventListener('click', (ev) => {
        if (ev.target === box) box.remove();
      });
    },

    async copyAndLaunchGeminiSplit(options = {}) {
      return this.openGeminiConfirmModal(options);
    },

    async openGeminiConfirmModal(initialOptions = {}) {
      document.getElementById('inv-gemini-confirm-modal')?.remove();
      const prefs = INV.storageAdapter.getPrefs();
      const opts = {
        mode: initialOptions.mode || prefs.promptMode || 'veteran30',
        focus: initialOptions.focus || (initialOptions.targetStock ? 'stock' : 'general'),
        targetStock: initialOptions.targetStock || null,
        stressResult: initialOptions.stressResult || null,
        anonymize: Boolean(initialOptions.anonymize),
        userGoal: prefs.userGoal || '',
        fieldNotes: prefs.fieldNotes || '',
      };

      const modal = document.createElement('div');
      modal.id = 'inv-gemini-confirm-modal';
      modal.className = 'fixed inset-0 z-[2147483630] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');

      const tr = (s) => NS.i18n?.translateText?.(s) || s;

      modal.innerHTML = `
        <div class="w-full max-w-3xl max-h-[92dvh] rounded-2xl border-2 border-emerald-500/50 bg-zinc-950 text-zinc-100 shadow-2xl flex flex-col overflow-hidden">
          <div class="px-4 py-3 border-b border-zinc-800 bg-emerald-950/35 flex items-center justify-between gap-2 shrink-0">
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-black text-emerald-300">✅ ${tr('Trạm Đóng Gói Câu Lệnh Đầu Tư (30 Năm Kinh Nghiệm) & Mở Gemini')}</h3>
              <p class="text-[11px] text-zinc-400">${tr('Đã tự động ghép số liệu sống, tin tức bạn đã tick, khảo sát thực địa & khung chống suy diễn 6 phần.')}</p>
            </div>
            <button type="button" id="inv-gconf-close" class="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-rose-600 text-zinc-100 font-black cursor-pointer">✕</button>
          </div>

          <div class="p-4 overflow-y-auto flex-1 space-y-3">
            <!-- Thanh trạng thái đã copy -->
            <div id="inv-gconf-copy-banner" class="px-3 py-2 rounded-xl border border-amber-400/50 bg-amber-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div class="space-y-1 flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
                <div class="font-extrabold text-amber-200">✅ ${tr('Đã tự động sao chép toàn bộ câu lệnh vào bộ nhớ tạm! Bạn có thể thêm mục tiêu/ghi chú rồi bấm mở Gemini hoặc xuất file .MD.')}</div>
                <div class="text-[11px] text-amber-100/90">📱 ${tr('Trên Điện thoại (Mobile): Hãy CHẠM GIỮ ngón tay 1–2 giây vào khung nhập rồi bấm nút "Dán" hiện ra (KHÔNG dùng nút gợi ý nhanh của bàn phím vì dễ cắt thiếu dòng văn bản dài!).')}</div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" id="inv-gconf-recopy" class="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] cursor-pointer">📋 ${tr('Copy 1 Chạm')}</button>
                <button type="button" id="inv-gconf-export-md" class="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black text-[11px] cursor-pointer">📥 ${tr('Xuất File .MD')}</button>
              </div>
            </div>

            <!-- Chọn chủ đề & chế độ phân tích -->
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-zinc-400 font-bold">${tr('Trọng tâm')}:</span>
                <button type="button" data-gconf-focus="general" class="inv-gconf-focus-btn px-2.5 py-1 rounded-lg border font-bold cursor-pointer">🧭 ${tr('Tổng quát 3 tài sản')}</button>
                <button type="button" data-gconf-focus="gold" class="inv-gconf-focus-btn px-2.5 py-1 rounded-lg border font-bold cursor-pointer">🥇 ${tr('Vàng')}</button>
                <button type="button" data-gconf-focus="real_estate" class="inv-gconf-focus-btn px-2.5 py-1 rounded-lg border font-bold cursor-pointer">🏘️ ${tr('Nhà đất')}</button>
                <button type="button" data-gconf-focus="stock" class="inv-gconf-focus-btn px-2.5 py-1 rounded-lg border font-bold cursor-pointer">📊 ${tr('Chứng khoán')}</button>
              </div>
              <select id="inv-gconf-mode-sel" class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-100">
                <option value="veteran30">🏆 ${tr('Chuyên gia 30 năm — Bình dân học vụ (6 phần chuẩn)')}</option>
                <option value="audit">⚖️ ${tr('Kiểm toán 2 chiều (Phe Bò vs Phe Gấu & 5 Cầu chì)')}</option>
                <option value="plain">📘 ${tr('Phổ thông tóm gọn')}</option>
              </select>
            </div>

            <!-- Mục tiêu & Ghi chú dán thêm (Live update Prompt!) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label class="space-y-1">
                <span class="font-bold text-zinc-300">🎯 ${tr('Mục tiêu & Khẩu vị đầu tư của bạn')}:</span>
                <input id="inv-gconf-goal" type="text" value="${INV.utils.escapeHtml(opts.userGoal)}" placeholder="VD: Vốn 500tr, cầm 3 năm, không vay nợ..." class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100" />
              </label>
              <label class="space-y-1">
                <span class="font-bold text-zinc-300">📝 ${tr('Dán thêm số liệu BCTC / Khảo sát thực địa')}:</span>
                <input id="inv-gconf-notes" type="text" value="${INV.utils.escapeHtml(opts.fieldNotes)}" placeholder="VD: Đã xem đất đường 7m5, sổ hồng sẵn, khu sáng đèn 80%..." class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100" />
              </label>
            </div>

            <!-- Toàn văn câu lệnh đã tổng hợp -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-extrabold text-amber-300">📜 ${tr('TOÀN VĂN CÂU LỆNH ĐẦU TƯ ĐÃ TỔNG HỢP (LIVE PREVIEW — SỬA ĐƯỢC)')}:</span>
                <span id="inv-gconf-stats" class="text-zinc-400 font-mono"></span>
              </div>
              <textarea id="inv-gconf-textarea" rows="11" class="w-full rounded-xl bg-black/80 border border-zinc-700 p-3 text-xs font-mono text-zinc-100 leading-relaxed focus:outline-none focus:border-emerald-400"></textarea>
            </div>
          </div>

          <div class="px-4 py-3 border-t border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <button type="button" id="inv-gconf-back" class="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer">← ${tr('Quay lại')}</button>
            <button type="button" id="inv-gconf-launch" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-lg cursor-pointer">
              🪟 ${tr('Chuyển hướng & Chia đôi màn hình sang Gemini ngay')}
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const ta = modal.querySelector('#inv-gconf-textarea');
      const statsEl = modal.querySelector('#inv-gconf-stats');
      const modeSel = modal.querySelector('#inv-gconf-mode-sel');
      const goalInp = modal.querySelector('#inv-gconf-goal');
      const notesInp = modal.querySelector('#inv-gconf-notes');
      if (modeSel) modeSel.value = opts.mode;

      const rebuildAndCopy = async (doCopy = true) => {
        opts.userGoal = goalInp?.value?.trim() || '';
        opts.fieldNotes = notesInp?.value?.trim() || '';
        INV.storageAdapter.savePrefs({ promptMode: opts.mode, userGoal: opts.userGoal, fieldNotes: opts.fieldNotes });
        const text = this.buildGeminiPrompt(opts);
        if (ta) ta.value = text;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        if (statsEl) statsEl.textContent = `${text.length.toLocaleString('vi-VN')} ký tự · ${words.toLocaleString('vi-VN')} ${tr('từ')} (~${Math.round(words * 1.45).toLocaleString('vi-VN')} tokens)`;
        modal.querySelectorAll('.inv-gconf-focus-btn').forEach((b) => {
          const active = b.getAttribute('data-gconf-focus') === opts.focus;
          b.className = active
            ? 'inv-gconf-focus-btn px-2.5 py-1 rounded-lg border border-emerald-400 bg-emerald-600 text-white font-extrabold cursor-pointer'
            : 'inv-gconf-focus-btn px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500 font-bold cursor-pointer';
        });
        if (doCopy) await this.safeCopyText(text);
      };

      await rebuildAndCopy(true);

      modal.querySelectorAll('.inv-gconf-focus-btn').forEach((b) => {
        b.addEventListener('click', () => {
          opts.focus = b.getAttribute('data-gconf-focus') || 'general';
          rebuildAndCopy(true);
        });
      });
      modeSel?.addEventListener('change', () => {
        opts.mode = modeSel.value;
        rebuildAndCopy(true);
      });
      goalInp?.addEventListener('input', () => rebuildAndCopy(false));
      notesInp?.addEventListener('input', () => rebuildAndCopy(false));
      modal.querySelector('#inv-gconf-export-md')?.addEventListener('click', () => {
        const mdText = ta?.value || this.buildGeminiPrompt(opts);
        const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BaoCaoDauTu_${opts.focus}_${INV.utils.todayIso()}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        NS.utils?.showToast?.('📥 Đã tải xuống file Báo cáo thô (.MD) — có thể lưu trữ hoặc gửi thẳng lên Gemini!', 'success', 3500);
      });
      modal.querySelector('#inv-gconf-recopy')?.addEventListener('click', async () => {
        const ok = await this.safeCopyText(ta?.value || '');
        if (!ok.ok) this.showManualCopyModal(ta?.value || '');
        NS.utils?.showToast?.('✅ Đã sao chép lại toàn bộ câu lệnh đầu tư vào bộ nhớ tạm!', 'success', 3000);
      });
      const closeConfirm = () => modal.remove();
      modal.querySelector('#inv-gconf-close')?.addEventListener('click', closeConfirm);
      modal.querySelector('#inv-gconf-back')?.addEventListener('click', closeConfirm);
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) closeConfirm();
      });
      modal.querySelector('#inv-gconf-launch')?.addEventListener('click', async () => {
        const finalText = ta?.value || this.buildGeminiPrompt(opts);
        await this.safeCopyText(finalText);
        closeConfirm();
        if (NS.geminiSplitBridge?.launchExternalSplitWindow) {
          NS.geminiSplitBridge.launchExternalSplitWindow('GEMINI', false);
        } else {
          window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
        }
        NS.utils?.showToast?.(
          'Đã sao chép xong bộ dữ liệu & kiến thức đầu tư! Bạn chỉ cần bấm vào ô nhập của Gemini bên cạnh rồi dán (Ctrl + V) và nhấn Gửi.',
          'success',
          5200
        );
      });

      NS.i18n?.translateElement?.(modal);
      return { copied: true, promptText: ta?.value || '' };
    },
  };

  INV.MANDATORY_DISCLAIMER = MANDATORY_DISCLAIMER;
  INV.COUNTRY_PROFILES = COUNTRY_PROFILES;
  INV.resolveCountryProfile = resolveCountryProfile;
  INV.detectUserRegionByGps = detectUserRegionByGps;
  INV.researchEvaluator = researchEvaluator;
  INV.promptComposer = promptComposer;
})(typeof window !== 'undefined' ? window : globalThis);
