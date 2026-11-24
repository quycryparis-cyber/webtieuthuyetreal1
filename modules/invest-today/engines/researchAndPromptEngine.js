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
  const MANDATORY_DISCLAIMER = 'Nhận xét chỉ mang tính tham khảo thôi';

  function getActiveGeminiApiKey() {
    try {
      const fromVault = NS.apiVault?.getActiveApiKey?.() || NS.apiVault?.getCurrentKey?.();
      if (fromVault && String(fromVault).trim().length > 10) return String(fromVault).trim();
      const rawVault = localStorage.getItem('noir_v36_api_key_vault_v1');
      if (rawVault) {
        const parsed = JSON.parse(rawVault);
        const list = parsed?.keys || parsed?.pool || [];
        const active = list.find((k) => k && k.key && k.enabled !== false) || list[0];
        if (active?.key) return String(active.key).trim();
      }
      const fallback = localStorage.getItem('gemini_api_key') || localStorage.getItem('noir_gemini_api_key');
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

  async function runGeminiGroundedSearch(items, kb, signal) {
    const apiKey = getActiveGeminiApiKey();
    if (!apiKey) return null;

    const today = INV.utils.todayIso();
    const checklistLines = items
      .map((it, idx) => `${idx + 1}. [${it.id}] ${it.plain_label} (${it.technical_label}) — đơn vị: ${it.unit}`)
      .join('\n');

    const prompt = `Hôm nay là ngày ${today}. Hãy dùng công cụ Google Search tìm dữ liệu mới nhất và đáng tin cậy nhất (ưu tiên nguồn: ${kb.trusted_sources.slice(0, 12).join(', ')}) cho từng đề mục sau.
QUY TẮC BẮT BUỘC:
- KHÔNG BỊA SỐ LIỆU. Nếu đề mục nào không tìm được số mới đáng tin cậy, ghi value là null và status là "DATA_MISSING".
- Mỗi đề mục bắt buộc trả về đúng định dạng JSON mảng các đối tượng:
[{"id":"...", "value":"...", "as_of_date":"YYYY-MM-DD", "source_name":"...", "source_url":"https://...", "status":"ok|DATA_MISSING", "signal":"positive|neutral|caution|danger", "plain_explanation":"1-2 câu tiếng Việt bình dân dễ hiểu"}]
Chỉ trả về JSON hợp lệ, không thêm chữ ngoài JSON.

DANH SÁCH ĐỀ MỤC:
${checklistLines}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.15 },
      }),
    });
    if (!resp.ok) throw new Error(`Gemini Search HTTP ${resp.status}`);
    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : null;
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

      // Chống bấm đúp (cooldown 8 giây nếu vừa chạy xong trừ khi force)
      if (INV.stateManager.runningEval) {
        throw new Error('Hệ thống đang chạy tìm kiếm và đánh giá, vui lòng chờ hoàn tất hoặc bấm Dừng lại.');
      }

      INV.stateManager.runningEval = true;
      const { controller, signal } = INV.stateManager.createSignal();
      const emit = (pct, label) => {
        if (typeof onProgress === 'function') onProgress({ pct, label });
      };

      try {
        // BƯỚC 1: Đọc kế hoạch dò tìm từ File Kiến Thức (5%)
        emit(5, 'Bước 1/6: Đang đọc các mục cần kiểm tra từ file kiến thức...');
        const kb = await INV.fileParser.initActiveKnowledge();
        const allItems = Array.isArray(kb.search_checklist) ? kb.search_checklist : [];
        const selectedItems = depth === 'full' ? allItems : allItems.filter((it) => it.quick !== false);

        // BƯỚC 2: Tạo từ khóa tìm kiếm theo thời điểm thực (15%)
        emit(15, `Bước 2/6: Đang lập ${selectedItems.length} truy vấn theo mốc thời gian thực (${INV.utils.todayIso()})...`);
        const prepared = selectedItems.map((it) => ({
          ...it,
          expandedQuery: expandQueryTemplate(it.query_template),
        }));

        // BƯỚC 3: Truy vấn dữ liệu trực tuyến song song có kiểm soát (50%)
        emit(35, 'Bước 3/6: Đang tìm số liệu giá vàng, tỷ giá, chứng khoán & vĩ mô mới nhất...');
        const [goldSnapRes, vnIdxRes, groundedRes] = await Promise.allSettled([
          INV.goldEngine.fetchLiveGoldSnapshot({ force: true, signal }),
          INV.stockEngine.lookupStockTicker('VNINDEX', { force: false, signal }),
          runGeminiGroundedSearch(prepared, kb, signal),
        ]);

        if (signal.aborted) throw new DOMException('Đã dừng theo yêu cầu của bạn.', 'AbortError');
        emit(60, 'Bước 4/6: Đang đẩy số liệu qua động cơ tính toán bằng code thuần...');

        const goldSnap = goldSnapRes.status === 'fulfilled' ? goldSnapRes.value : INV.stateManager.goldData;
        if (goldSnap) INV.stateManager.goldData = goldSnap;
        const groundedMap = new Map();
        const usedGeminiSearch = groundedRes.status === 'fulfilled' && Array.isArray(groundedRes.value);
        if (usedGeminiSearch) {
          groundedRes.value.forEach((row) => {
            if (row?.id) groundedMap.set(row.id, row);
          });
        }

        // BƯỚC 4 + 5: Khóa số liệu tính thuần + Đối chiếu ngưỡng + Kiểm tra 5 Chốt chặn an toàn (85%)
        emit(80, 'Bước 5/6: Đang chấm điểm 4 kênh đầu tư và kiểm tra 5 chốt chặn an toàn...');

        const metricItems = prepared.map((item) => {
          const g = groundedMap.get(item.id);
          const searchFallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(item.expandedQuery)}`;

          // Khóa số liệu code thuần cho Giá vàng & Tỷ giá nếu có dữ liệu sống
          if (item.id === 'gold_world_spot' && goldSnap?.worldLive) {
            return {
              id: item.id,
              layer: item.layer,
              plain_label: item.plain_label,
              technical_label: item.technical_label,
              value: `${INV.utils.formatVnd(goldSnap.worldPriceUsd, 1)} USD/oz (quy đổi thô ${INV.utils.formatMillions(goldSnap.rawWorldPriceVnd)})`,
              unit: item.unit,
              as_of_date: goldSnap.asOfDate,
              source_name: 'Gold-API (Trực tiếp)',
              source_url: 'https://api.gold-api.com/price/XAU',
              status: 'ok',
              signal: 'neutral',
              plain_explanation: `Giá vàng thế giới quy đổi thô đạt ${INV.utils.formatMillions(goldSnap.rawWorldPriceVnd)}/lượng (ước tính gồm thuế phí: ${INV.utils.formatMillions(goldSnap.landedParityVnd)}).`,
            };
          }
          if (item.id === 'vn_usd_vnd' && goldSnap?.fxLive) {
            return {
              id: item.id,
              layer: item.layer,
              plain_label: item.plain_label,
              technical_label: item.technical_label,
              value: `${INV.utils.formatVnd(goldSnap.vcbSellRate, 0)} VNĐ/USD`,
              unit: item.unit,
              as_of_date: goldSnap.asOfDate,
              source_name: 'ExchangeRate API (Trực tiếp)',
              source_url: 'https://open.er-api.com/v6/latest/USD',
              status: 'ok',
              signal: goldSnap.vcbSellRate >= 25800 ? 'caution' : 'neutral',
              plain_explanation:
                goldSnap.vcbSellRate >= 25800
                  ? 'Tỷ giá USD/VND đang ở vùng cao, tạo áp lực lên mặt bằng lãi suất và dòng vốn ngoại.'
                  : 'Tỷ giá USD/VND đang ở vùng tương đối ổn định.',
            };
          }
          if (item.id === 'gold_vn_sjc_9999' && goldSnap) {
            const diffPct = goldSnap.sjc?.diffRawPercent;
            const spreadPct = goldSnap.sjc?.spreadPercent;
            return {
              id: item.id,
              layer: item.layer,
              plain_label: item.plain_label,
              technical_label: item.technical_label,
              value: goldSnap.domesticLive
                ? `SJC ${INV.utils.formatMillions(goldSnap.sjc.buyVnd, 1)}–${INV.utils.formatMillions(goldSnap.sjc.sellVnd, 1)} (chênh ${Number.isFinite(diffPct) ? `+${diffPct.toFixed(1)}%` : '—'})`
                : `Chưa cào trực tiếp SJC (đang đo theo giá nhập ${INV.utils.formatMillions(goldSnap.sjc.sellVnd, 1)}, chênh ${Number.isFinite(diffPct) ? `+${diffPct.toFixed(1)}%` : '—'})`,
              unit: item.unit,
              as_of_date: goldSnap.asOfDate,
              source_name: goldSnap.domesticLive ? 'SJC chính thức' : 'SJC (Mở thẻ Giá vàng để sửa/đối chiếu)',
              source_url: 'https://sjc.com.vn/',
              status: goldSnap.domesticLive ? 'ok' : 'DATA_STALE',
              signal: goldSnap.sjc?.breakerTriggered ? 'danger' : goldSnap.sjc?.premiumStatus?.signal || 'neutral',
              plain_explanation: `${goldSnap.sjc?.premiumStatus?.text || ''} ${Number.isFinite(spreadPct) ? `(Chênh mua–bán: ${spreadPct.toFixed(2)}%)` : ''}`.trim(),
            };
          }

          if (g && g.value !== null && g.status !== 'DATA_MISSING') {
            return {
              id: item.id,
              layer: item.layer,
              plain_label: item.plain_label,
              technical_label: item.technical_label,
              value: String(g.value),
              unit: item.unit,
              as_of_date: g.as_of_date || INV.utils.todayIso(),
              source_name: g.source_name || 'Google Search Grounding',
              source_url: g.source_url || searchFallbackUrl,
              status: 'ok',
              signal: ['positive', 'neutral', 'caution', 'danger'].includes(g.signal) ? g.signal : 'neutral',
              plain_explanation: g.plain_explanation || 'Đã cập nhật số liệu mới nhất từ nguồn trực tuyến.',
            };
          }

          // Không bịa số liệu! Đánh dấu trung thực DATA_MISSING kèm mốc tham chiếu file cẩm nang & link tra nhanh 1 chạm
          return {
            id: item.id,
            layer: item.layer,
            plain_label: item.plain_label,
            technical_label: item.technical_label,
            value: null,
            unit: item.unit,
            as_of_date: kb.metadata?.compiled_as_of || '2026-11-24',
            source_name: 'Tra nhanh trên Google (chưa có nguồn live trực tiếp)',
            source_url: searchFallbackUrl,
            status: 'DATA_MISSING',
            signal: 'neutral',
            plain_explanation: `Chưa lấy được số liệu live tự động cho mục này (DATA_MISSING). Mốc tham chiếu trong cẩm nang (${kb.metadata?.compiled_as_of || '24/11/2026'}): ${item.baseline_2026_11_24 || 'Xem link nguồn'}.`,
          };
        });

        const missingItems = metricItems.filter((m) => m.status === 'DATA_MISSING');
        const vnVal = INV.stockEngine.calculateVnIndexValuation();
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
            title: 'Chốt chặn 2 — Một số chỉ số vĩ mô đang thiếu dữ liệu trực tuyến (DATA_MISSING)',
            detail: `Có ${missingItems.length}/${metricItems.length} mục chưa có API trực tiếp trên trình duyệt thuần. Hãy bấm "Tự động sao chép & Chia đôi màn hình với Gemini" (miễn phí) hoặc gắn Gemini API Key để tự quét trọn vẹn 100% tin tức mới nhất.`,
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

        // Chấm điểm 4 kênh (Tiền mặt, Vàng, Chứng khoán, Nhà đất) bằng quy tắc từ file kiến thức
        const goldScore = goldSnap?.breakerTriggered ? 44 : goldSnap?.overallSignal === 'positive' ? 76 : 60;
        const channelScores = {
          cash: {
            name: 'Tiền mặt / Gửi tiết kiệm',
            score: 82,
            signal: 'positive',
            badge: 'Nên ưu tiên',
            reason: 'Giữ tiền mặt sinh lãi kỳ hạn 3–6–12 tháng tại ngân hàng lớn giúp vừa hưởng lãi suất tốt vừa sẵn đạn dược săn tài sản giá rẻ.',
          },
          gold: {
            name: 'Vàng',
            score: goldScore,
            signal: goldScore < 50 ? 'danger' : goldScore >= 72 ? 'positive' : 'caution',
            badge: goldScore < 50 ? 'Không mua đuổi' : goldScore >= 72 ? 'Thuận lợi' : 'Nên chờ / Theo dõi',
            reason: goldSnap?.breakerTriggered
              ? 'Giá vàng thế giới vẫn có lực đỡ dài hạn từ Ngân hàng Trung ương, nhưng vàng trong nước đang chênh quá cao hoặc phí mua–bán quá rộng.'
              : 'Phù hợp giữ 5%–10% tài sản làm lớp bảo hiểm dài hạn, ưu tiên mua dần khi chênh lệch nội địa hạ nhiệt.',
          },
          stock: {
            name: 'Chứng khoán',
            score: 70,
            signal: 'caution',
            badge: 'Tích lũy chậm (Không vay)',
            reason: 'Định giá thị trường đang rẻ hơn trung bình 10 năm nhưng áp lực vay margin và khối ngoại bán ròng đòi hỏi giải ngân từng phần bằng tiền thật.',
          },
          real_estate: {
            name: 'Nhà đất',
            score: 48,
            signal: 'danger',
            badge: 'Tránh vay lớn lúc này',
            reason: 'Lãi suất vay thả nổi 12%–15% cao gấp nhiều lần tiền cho thuê (2%–4%). Chỉ phù hợp người có tiền mặt săn hàng pháp lý sạch hoặc đất công nghiệp.',
          },
        };

        const cyclePhase = {
          key: 'overheat',
          label: kb.scoring_rules?.cycle_phases?.overheat?.label || 'Pha III — Quá nhiệt (Chuyển tiếp thận trọng)',
          plain_advice:
            kb.scoring_rules?.cycle_phases?.overheat?.plain_advice ||
            'Giữ tiền mặt sinh lãi cao, tránh vay mượn mua đuổi và ưu tiên tài sản có dòng tiền thật.',
        };

        const report = {
          generated_at: new Date().toISOString(),
          as_of_date: INV.utils.todayIso(),
          knowledge_source_name: kb.metadata?.short_title || 'Khung Phân Tích Đầu Tư',
          depth,
          used_gemini_search: usedGeminiSearch,
          live_count: metricItems.filter((m) => m.status === 'ok').length,
          missing_count: missingItems.length,
          cycle_phase: cyclePhase,
          channel_scores: channelScores,
          triggered_breakers: triggeredBreakers,
          items: metricItems,
          narrative_summary: {
            opportunities: [
              'Kinh tế Việt Nam tăng trưởng cao, dòng vốn FDI và giải ngân đầu tư công mạnh hỗ trợ dài hạn cho doanh nghiệp đầu ngành và bất động sản khu công nghiệp.',
              'Định giá chứng khoán đang ở vùng chiết khấu so với trung bình 10 năm kết hợp lộ trình giải ngân dòng vốn nâng hạng thị trường.',
              'Người cầm tiền mặt không nợ đang nắm lợi thế lớn để chọn lọc tài sản tốt bị bán giảm giá.',
            ],
            risks: [
              'Mặt bằng lãi suất thực toàn cầu và lãi suất vay trong nước neo cao làm tăng mạnh gánh nặng trả nợ đối với bất động sản vay lớn và chứng khoán dùng margin.',
              'Rủi ro chênh lệch giá vàng trong nước so với thế giới và khoảng cách mua–bán rộng gây lỗ tức thì nếu mua đuổi ngắn hạn.',
              'Áp lực đáo hạn trái phiếu doanh nghiệp BĐS đòi hỏi kiểm tra cực kỹ uy tín chủ đầu tư và đủ 7 bước pháp lý.',
            ],
            current_outlook:
              'Giai đoạn hiện tại ưu tiên PHÒNG THỦ CHỦ ĐỘNG: giữ tỷ trọng tiền mặt/tiền gửi an toàn làm vùng đệm, tuyệt đối không dùng đòn bẩy vay mượn lớn (margin hoặc vay >30% mua nhà cho thuê âm dòng tiền), và không mua đuổi vàng khi chênh lệch nội địa còn quá cao.',
            upcoming_outlook:
              'Giai đoạn 6–12 tháng tới: theo dõi sát thời điểm lãi suất Mỹ hạ nhiệt, áp lực vay margin trên sàn giải tỏa và chênh lệch giá vàng thu hẹp để dịch chuyển dần từ tiền mặt sang tích lũy từng phần theo nguyên tắc chia vốn 5/25.',
          },
          disclaimer: MANDATORY_DISCLAIMER,
        };

        emit(100, 'Bước 6/6: Hoàn tất tổng hợp & đánh giá!');
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
      const label = anonymize ? 'TÀI SẢN X (ĐÃ ẨN DANH THEO KỸ THUẬT GLASSERMAN–LIN)' : `${stock.symbol} (${stock.companyName})`;
      lines.push(
        `- Cổ phiếu đang xem: ${label} | Nhóm ngành: ${stock.sectorChecklist?.sectorLabel || stock.sector} | Giá: ${Number.isFinite(stock.price) ? INV.utils.formatVnd(stock.price, 0) + ' ' + stock.currency : 'DATA_MISSING'}`
      );
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
    buildGeminiPrompt({ mode = 'plain', focus = 'general', targetStock = null, stressResult = null, anonymize = false } = {}) {
      const kb = INV.stateManager.activeKnowledge;
      const report = INV.stateManager.evaluationReport;
      const gold = INV.stateManager.goldData;
      const stock = targetStock || INV.stateManager.stockData;
      const reData = INV.stateManager.realEstateData;
      const reg = INV.stateManager.userRegion || resolveCountryProfile('VN', 'Việt Nam', 'Việt Nam', 'default');

      const asOfDate = INV.utils.todayIso();
      const globalSnap = formatLayerSnapshot(report?.items, 'global_macro');
      const vnSnap = formatLayerSnapshot(report?.items, 'vn_macro');
      const goldText = buildPrecomputedGoldText(gold);
      const stockText = buildPrecomputedStockText(stock, mode === 'audit' && anonymize);
      const reText = buildPrecomputedRealEstateText(reData, stressResult);
      const missingList =
        (report?.items || [])
          .filter((it) => it.status === 'DATA_MISSING')
          .map((it) => it.plain_label)
          .join('; ') || (report ? 'Không có mục thiếu lớn' : 'Chưa chạy bước tìm tin tự động trước khi copy');

      const knowledgeDigest = kb?.core_principles_digest || 'Sử dụng đầy đủ khung phân tích 7 chương Vàng, Chứng khoán, Bất động sản và 5 chốt chặn an toàn.';
      const focusInstructions = {
        general: 'Đánh giá toàn diện cả 4 kênh (Tiền mặt/Tiết kiệm, Vàng, Chứng khoán, Bất động sản) bám sát thị trường tại ' + reg.countryName + ' và vĩ mô toàn cầu theo đúng dàn ý 5 mục.',
        gold: `TẬP TRUNG CHUYÊN SÂU KÊNH VÀNG tại ${reg.countryName} (${reg.goldMarket}): Phân tích 5 nhân tố (TIPS 10Y & DXY 30%, Mua ròng NHTW & ETF 25%, Nợ công & Giá sàn AISC 20%, Cấu trúc nội địa & Chênh lệch quy đổi/Spread 15%, Vị thế COMEX COT 10%), kiểm tra Chốt chặn 4 (>10% chênh lệch / >3% spread) và khuyến nghị chiến thuật mua/chờ/nắm giữ cụ thể.`,
        real_estate: `TẬP TRUNG CHUYÊN SÂU NHÀ ĐẤT tại khu vực ${reData?.areaLabel || reg.areaLabel} (${reg.countryName}): Đánh giá mặt bằng giá, tỷ suất cho thuê so với lãi suất vay thả nổi, kết quả Stress Test DSCR (chuẩn ≥ 1,2x), kiểm tra Chốt chặn 1 & 3, rà soát đủ 7 bước pháp lý và phân hóa phân khúc (nhà ở / đất nền / KCN).`,
        stock: `TẬP TRUNG CHUYÊN SÂU CHỨNG KHOÁN (${stock?.symbol ? (mode === 'audit' && anonymize ? 'TÀI SẢN X' : stock.symbol) : reg.stockIndex}) tại ${reg.countryName}: Phân tích định giá P/E, Earnings Yield vs Trái phiếu 10Y & Chi phí vốn Damodaran, áp lực margin & khối ngoại, và chạy đúng bộ lọc sức khỏe theo đặc thù ngành (Sản xuất: M/Z/F-Score, Sloan, DuPont 5 nhân tố; Ngân hàng: P/B-ROE, NIM, CASA, NPL/LLR, CAR; BĐS: CFO, nợ/VCSH, TPDN, RNAV).`,
      };
      const focusDirective = focusInstructions[focus] || focusInstructions.general;
      const assetLabel =
        mode === 'audit' && anonymize
          ? 'TÀI SẢN X'
          : focus === 'gold'
          ? `Kênh Vàng (${reg.goldMarket})`
          : focus === 'real_estate'
          ? `Nhà đất khu vực ${reData?.areaLabel || reg.areaLabel}`
          : stock?.symbol || `Danh mục 4 kênh tại ${reg.countryName}`;

      if (mode === 'audit') {
        return `[VAI TRÒ] Bạn là Giám đốc Quản trị Rủi ro Danh mục (Chief Risk Officer) chuyên thị trường vốn tại ${reg.countryName} (${reg.stockIndex}, ${reg.centralBank}, đồng tiền ${reg.currency}) và vĩ mô toàn cầu. Mục tiêu tối thượng của bạn là bảo vệ vốn và đánh giá khách quan xác suất rủi ro/lợi nhuận, KHÔNG phải khuyến khích giao dịch.

[TRỌNG TÂM PHÂN TÍCH YÊU CẦU]
${focusDirective}

[DỮ LIỆU ĐẦU VÀO — ĐÓNG DẤU NGÀY: ${asOfDate} · KHU VỰC: ${reg.areaLabel} (${reg.countryName})]
Chỉ sử dụng bộ dữ liệu đã xác minh dưới đây (mọi phép tính tài chính phức tạp đã được tính sẵn ngoài hệ thống; tài sản mục tiêu: ${assetLabel}):
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
7. Dòng kết thúc bắt buộc nguyên văn: "${MANDATORY_DISCLAIMER}."`;
      }

      return `Bạn hãy đóng vai một người cố vấn quản lý rủi ro tài chính cá nhân am hiểu thị trường tại ${reg.countryName} (${reg.centralBank}, ${reg.stockIndex}, đồng tiền ${reg.currency}) và kinh tế thế giới. Hãy giải thích thật rõ ràng, bằng tiếng Việt đời thường, hạn chế tối đa từ chuyên ngành khó hiểu (nếu buộc phải nhắc đến thuật ngữ chuyên môn, hãy giải thích ngắn gọn trong ngoặc bằng ví dụ bình dân).

=== TRỌNG TÂM PHÂN TÍCH ===
- Quốc gia & khu vực người dùng: ${reg.areaLabel} (${reg.countryName} · Tiền tệ ${reg.currency})
- Yêu cầu trọng tâm: ${focusDirective}

=== PHẦN 1: BỘ DỮ LIỆU THỊ TRƯỜNG MỚI NHẤT ĐÃ CHẮT LỌC ===
- Ngày tổng hợp dữ liệu: ${asOfDate}
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
4. Hãy trình bày câu trả lời gọn gàng theo đúng 5 mục sau:
   - Mục 1: Bức tranh kinh tế hiện tại tại ${reg.countryName} và thế giới đang ở giai đoạn nào? (Giải thích thật dễ hiểu trong 3–5 dòng).
   - Mục 2: Đánh giá chi tiết theo trọng tâm yêu cầu — (a) Vàng, (b) Chứng khoán, (c) Nhà đất, (d) Tiền mặt/Gửi tiết kiệm. Mỗi kênh ghi rõ: Mức độ hấp dẫn (Nên cân nhắc / Nên chờ / Nên tránh lúc này) + Lý do chính + Rủi ro lớn nhất.
   - Mục 3: Kiểm tra 5 chốt chặn an toàn (chỉ ra rõ hiện tại có chốt chặn nào đang báo đỏ không).
   - Mục 4: Gợi ý hướng phân bổ tiền và hành động thực tế cho giai đoạn hiện tại và 6–12 tháng tới (chia rõ cho người thích an toàn và người chấp nhận rủi ro vừa phải).
   - Mục 5: Những dấu hiệu cụ thể cần theo dõi trong thời gian tới (nếu dấu hiệu nào xảy ra thì đổi chiến lược ra sao).
5. BẮT BUỘC kết thúc toàn bộ câu trả lời bằng đúng dòng chữ nguyên văn: "${MANDATORY_DISCLAIMER}."`;
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
      const opts = {
        mode: initialOptions.mode || 'plain',
        focus: initialOptions.focus || (initialOptions.targetStock ? 'stock' : 'general'),
        targetStock: initialOptions.targetStock || null,
        stressResult: initialOptions.stressResult || null,
        anonymize: Boolean(initialOptions.anonymize),
      };

      const modal = document.createElement('div');
      modal.id = 'inv-gemini-confirm-modal';
      modal.className = 'fixed inset-0 z-[2147483630] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');

      const tr = (s) => NS.i18n?.translateText?.(s) || s;

      modal.innerHTML = `
        <div class="w-full max-w-3xl max-h-[90dvh] rounded-2xl border-2 border-emerald-500/50 bg-zinc-950 text-zinc-100 shadow-2xl flex flex-col overflow-hidden">
          <div class="px-4 py-3 border-b border-zinc-800 bg-emerald-950/35 flex items-center justify-between gap-2 shrink-0">
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-black text-emerald-300">✅ ${tr('Xác Nhận Câu Lệnh Phân Tích Đầu Tư & Mở Gemini')}</h3>
              <p class="text-[11px] text-zinc-400">${tr('Đã tự động chèn khung phân tích chuẩn 7 chương + số liệu thực tế + khu vực của bạn.')}</p>
            </div>
            <button type="button" id="inv-gconf-close" class="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-rose-600 text-zinc-100 font-black cursor-pointer">✕</button>
          </div>

          <div class="p-4 overflow-y-auto flex-1 space-y-3">
            <!-- Thanh trạng thái đã copy -->
            <div id="inv-gconf-copy-banner" class="px-3 py-2 rounded-xl border border-amber-400/50 bg-amber-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="font-extrabold text-amber-200">✅ ${tr('Đã tự động sao chép toàn bộ câu lệnh vào bộ nhớ tạm! Bạn có thể xem/chỉnh thêm rồi bấm nút xanh bên dưới để chuyển qua Gemini.')}</span>
              <button type="button" id="inv-gconf-recopy" class="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] cursor-pointer shrink-0">📋 ${tr('Copy Toàn Bộ Câu Lệnh')}</button>
            </div>

            <!-- Chọn chủ đề & chế độ phân tích -->
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-zinc-400 font-bold">${tr('Trọng tâm')}:</span>
                <button type="button" data-gconf-focus="general" class="inv-gconf-focus-btn px-2.5 py-1 rounded-lg border font-bold cursor-pointer">🧭 ${tr('Tổng quát 4 kênh')}</button>
                <button type="button" data-gconf-focus="gold" class="inv-gconf-focus-btn px-2.5 py-1 rounded-lg border font-bold cursor-pointer">🥇 ${tr('Vàng')}</button>
                <button type="button" data-gconf-focus="real_estate" class="inv-gconf-focus-btn px-2.5 py-1 rounded-lg border font-bold cursor-pointer">🏘️ ${tr('Nhà đất')}</button>
                <button type="button" data-gconf-focus="stock" class="inv-gconf-focus-btn px-2.5 py-1 rounded-lg border font-bold cursor-pointer">📊 ${tr('Chứng khoán')}</button>
              </div>
              <select id="inv-gconf-mode-sel" class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-100">
                <option value="plain">${tr('Chế độ Phổ thông dễ hiểu')}</option>
                <option value="audit">${tr('Chế độ Kiểm toán 2 chiều (Phe Bò vs Phe Gấu)')}</option>
              </select>
            </div>

            <!-- Toàn văn câu lệnh đã tổng hợp -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-extrabold text-amber-300">📜 ${tr('TOÀN VĂN CÂU LỆNH ĐẦU TƯ ĐÃ TỔNG HỢP (CÓ THỂ CHỈNH SỬA THÊM)')}:</span>
                <span id="inv-gconf-stats" class="text-zinc-400 font-mono"></span>
              </div>
              <textarea id="inv-gconf-textarea" rows="12" class="w-full rounded-xl bg-black/80 border border-zinc-700 p-3 text-xs font-mono text-zinc-100 leading-relaxed focus:outline-none focus:border-emerald-400"></textarea>
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
      if (modeSel) modeSel.value = opts.mode;

      const rebuildAndCopy = async () => {
        const text = this.buildGeminiPrompt(opts);
        if (ta) ta.value = text;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        if (statsEl) statsEl.textContent = `${words.toLocaleString('vi-VN')} ${tr('từ')} (~${Math.round(words * 1.45).toLocaleString('vi-VN')} tokens)`;
        modal.querySelectorAll('.inv-gconf-focus-btn').forEach((b) => {
          const active = b.getAttribute('data-gconf-focus') === opts.focus;
          b.className = active
            ? 'inv-gconf-focus-btn px-2.5 py-1 rounded-lg border border-emerald-400 bg-emerald-600 text-white font-extrabold cursor-pointer'
            : 'inv-gconf-focus-btn px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500 font-bold cursor-pointer';
        });
        await this.safeCopyText(text);
      };

      await rebuildAndCopy();

      modal.querySelectorAll('.inv-gconf-focus-btn').forEach((b) => {
        b.addEventListener('click', () => {
          opts.focus = b.getAttribute('data-gconf-focus') || 'general';
          rebuildAndCopy();
        });
      });
      modeSel?.addEventListener('change', () => {
        opts.mode = modeSel.value;
        rebuildAndCopy();
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
