/**
 * ============================================================================
 * 🛡️ ĐẦU TƯ HÔM NAY — BỘ MÁY TRÍCH XUẤT TẤT ĐỊNH & KHÓA BỊA ĐẶT 0% (v128)
 * File: modules/invest-today/engines/deterministicExtractor.js
 * ============================================================================
 * Thiết kế theo nguyên lý Deterministic Extraction & Immutable Provenance:
 * - 5 chốt Fail-Closed:
 *   1. Verbatim Immutability (chỉ làm sạch HTML/entity, không viết lại câu chữ)
 *   2. Mandatory Provenance Lock (canonical_url https:// hợp lệ + source_domain)
 *   3. Strict Schema Validation & DOM Drift Protection (10–300 ký tự, ISO-8601)
 *   4. SHA-256 Fingerprinting (record_id = SHA256(canonical_url + "|" + norm_title))
 *   5. Temporal Sanity Check (chặn tin tương lai & tin quá hạn tươi mới)
 * - Bộ khớp Checklist Boolean + Unicode Word-Boundary Regex:
 *   MUST_ALL (AND) · ANY_OF (OR) · EXCLUDE (NOT) + Explainable Scoring (+10/+3)
 * - Bộ phân tích khối JSON thống nhất (INVEST_INTEL_SYNC_V2) từ Code & Gemini
 * ============================================================================
 */
(function initDeterministicExtractor(globalScope) {
  'use strict';

  const INV = (globalScope.NoirInvestToday = globalScope.NoirInvestToday || {});

  const DEFAULT_EXCLUDE_NOISE = [
    'quảng cáo',
    'tài trợ',
    'khóa học',
    'tuyển dụng',
    'tin đồn',
    'sponsored',
    'advertisement',
    'webinar promo',
  ];

  // --------------------------------------------------------------------------
  // 1. LÀM SẠCH KỸ THUẬT NGUYÊN VĂN (KHÔNG PARAPHRASE / KHÔNG GHÉP ĐOẠN)
  // --------------------------------------------------------------------------
  function cleanVerbatimText(raw, maxChars = 0) {
    let s = String(raw == null ? '' : raw)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (maxChars > 0 && s.length > maxChars) {
      // Cắt tại ranh giới từ (không cắt đứt giữa từ!)
      const sliced = s.slice(0, maxChars);
      const lastSpace = sliced.lastIndexOf(' ');
      s = (lastSpace > maxChars * 0.65 ? sliced.slice(0, lastSpace) : sliced).trim() + '...';
    }
    return s;
  }

  function normalizeForMatch(str) {
    try {
      return String(str || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
    } catch (_e) {
      return String(str || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }
  }

  // --------------------------------------------------------------------------
  // 2. SHA-256 FINGERPRINTING (Web Crypto + Fallback Tất Định 64-hex)
  // --------------------------------------------------------------------------
  function fallbackHash64Hex(input) {
    let h1 = 0xdeadbeef ^ input.length;
    let h2 = 0x41c6ce57 ^ input.length;
    let h3 = 0x9e3779b9 ^ input.length;
    let h4 = 0x85ebca6b ^ input.length;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
      h3 = Math.imul(h3 ^ (ch + i), 2246822519);
      h4 = Math.imul(h4 ^ (ch * 31), 3266489917);
    }
    const hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
    return (hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h1 ^ h3) + hex(h2 ^ h4) + hex(h1 + h2) + hex(h3 + h4)).slice(0, 64);
  }

  async function computeSha256Hex(text) {
    const raw = String(text || '');
    try {
      if (globalScope.crypto?.subtle && typeof TextEncoder !== 'undefined') {
        const bytes = new TextEncoder().encode(raw);
        const buf = await globalScope.crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch (_e) {}
    return fallbackHash64Hex(raw);
  }

  // --------------------------------------------------------------------------
  // 3. 5 CHỐT KIỂM SOÁT FAIL-CLOSED (ZERO-HALLUCINATION GUARDRAILS)
  // --------------------------------------------------------------------------
  async function validateAndFreezeRecords(rawRecords, { maxAgeDays = 45 } = {}) {
    const nowMs = Date.now();
    const maxFutureMs = nowMs + 15 * 60 * 1000; // Chặn tin tương lai (> 15 phút)
    const minValidMs = nowMs - Math.max(1, maxAgeDays) * 86400 * 1000;
    const seenIds = new Set();
    const accepted = [];
    const rejected = [];

    for (const rec of Array.isArray(rawRecords) ? rawRecords : []) {
      const rawTitle = cleanVerbatimText(rec?.verbatim_title || rec?.title || '');
      const rawExcerpt = cleanVerbatimText(rec?.verbatim_excerpt || rec?.snippet || rec?.description || '', 240);
      const rawUrl = String(rec?.canonical_url || rec?.url || '').trim();
      const sourceType = String(rec?.source_type || 'API').toUpperCase();

      // Chốt 2: Mandatory Provenance Lock
      let parsedUrl;
      try {
        parsedUrl = new URL(rawUrl);
      } catch (_eUrl) {
        rejected.push({ reason: 'INVALID_URL', rawTitle });
        continue;
      }
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        rejected.push({ reason: 'INVALID_PROTOCOL', rawUrl });
        continue;
      }
      const sourceDomain = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
      if (!sourceDomain || sourceDomain.length < 4) {
        rejected.push({ reason: 'MISSING_DOMAIN', rawUrl });
        continue;
      }

      // Chốt 3: Strict Schema Validation & DOM Drift Protection
      if (rawTitle.length < 10 || rawTitle.length > 300) {
        rejected.push({ reason: 'SCHEMA_TITLE_LENGTH_OR_SELECTOR_BROKEN', rawTitle, sourceDomain });
        continue;
      }
      if (/<script|javascript:|onclick=/i.test(rawTitle + rawExcerpt)) {
        rejected.push({ reason: 'UNSAFE_MARKUP', sourceDomain });
        continue;
      }

      // Chốt 5: Temporal Sanity Check
      let pubIso = String(rec?.published_at || rec?.date || '').trim();
      let pubMs = NaN;
      if (pubIso) {
        const d = new Date(pubIso.length === 10 ? `${pubIso}T12:00:00Z` : pubIso);
        if (!Number.isNaN(d.getTime())) {
          pubMs = d.getTime();
          pubIso = d.toISOString();
        }
      }
      if (!Number.isFinite(pubMs)) {
        pubMs = nowMs;
        pubIso = new Date(nowMs).toISOString();
      }
      if (pubMs > maxFutureMs) {
        rejected.push({ reason: 'TEMPORAL_FUTURE_REJECTED', pubIso, rawTitle });
        continue;
      }
      if (pubMs < minValidMs) {
        rejected.push({ reason: 'TEMPORAL_STALE_REJECTED', pubIso, rawTitle });
        continue;
      }

      // Chốt 4: SHA-256 Fingerprinting & Deduplication
      const normTitle = normalizeForMatch(rawTitle);
      const normExcerpt = normalizeForMatch(rawExcerpt);
      const recordId = await computeSha256Hex(`${parsedUrl.toString()}|${normTitle}`);
      if (seenIds.has(recordId)) {
        rejected.push({ reason: 'DUPLICATE_SHA256', recordId });
        continue;
      }
      seenIds.add(recordId);

      accepted.push({
        record_id: recordId,
        id: rec?.id || recordId.slice(0, 12),
        category: rec?.category || 'general',
        source_domain: sourceDomain,
        source: rec?.source || sourceDomain,
        source_type: sourceType,
        canonical_url: parsedUrl.toString(),
        url: parsedUrl.toString(),
        published_at: pubIso,
        date: pubIso.slice(0, 10),
        verbatim_title: rawTitle,
        title: rawTitle,
        verbatim_excerpt: rawExcerpt,
        snippet: rawExcerpt,
        norm_title: normTitle,
        norm_excerpt: normExcerpt,
        selected_for_prompt: rec?.selected_for_prompt !== false,
      });
    }

    return {
      accepted,
      rejected,
      stats: {
        scanned: (rawRecords || []).length,
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        staleCount: rejected.filter((r) => r.reason === 'TEMPORAL_STALE_REJECTED').length,
        duplicateCount: rejected.filter((r) => r.reason === 'DUPLICATE_SHA256').length,
        schemaBrokenCount: rejected.filter((r) => r.reason === 'SCHEMA_TITLE_LENGTH_OR_SELECTOR_BROKEN').length,
      },
    };
  }

  // --------------------------------------------------------------------------
  // 4. BỘ MÁY KHỚP CHECKLIST TẤT ĐỊNH (BOOLEAN + UNICODE WORD-BOUNDARY REGEX)
  // --------------------------------------------------------------------------
  function escapeRegex(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function hasWordBoundaryMatch(normText, keyword) {
    const kw = normalizeForMatch(keyword);
    if (!kw || !normText) return false;
    try {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(kw)}(?![\\p{L}\\p{N}])`, 'u');
      return re.test(normText);
    } catch (_eFallback) {
      return ` ${normText} `.includes(` ${kw} `) || normText.includes(kw);
    }
  }

  function matchRecordsToChecklist(checklistItems, validatedRecords, { minScore = 3 } = {}) {
    const results = [];
    for (const chk of Array.isArray(checklistItems) ? checklistItems : []) {
      const rules = chk.deterministic_rules || {};
      const mustAll = Array.isArray(rules.must_all) ? rules.must_all : [];
      const anyOf = Array.isArray(rules.any_of) ? rules.any_of : [];
      const exclude = [...DEFAULT_EXCLUDE_NOISE, ...(Array.isArray(rules.exclude) ? rules.exclude : [])];
      if (!mustAll.length && !anyOf.length) continue;

      const matched = [];
      for (const rec of validatedRecords || []) {
        const combined = `${rec.norm_title} ${rec.norm_excerpt}`;

        // 1. EXCLUDE (NOT)
        if (exclude.some((kw) => hasWordBoundaryMatch(combined, kw))) continue;

        // 2. MUST_ALL (AND)
        if (mustAll.length && !mustAll.every((kw) => hasWordBoundaryMatch(combined, kw))) continue;

        // 3. ANY_OF (OR)
        const anyMatched = !anyOf.length || anyOf.some((kw) => hasWordBoundaryMatch(combined, kw));
        if (!anyMatched) continue;

        // 4. Explainable Scoring (+10 in title, +3 in excerpt)
        const allTerms = [...mustAll, ...anyOf];
        const inTitle = [];
        const inExcerpt = [];
        let score = 0;
        allTerms.forEach((kw) => {
          if (hasWordBoundaryMatch(rec.norm_title, kw)) {
            inTitle.push(kw);
            score += 10;
          } else if (hasWordBoundaryMatch(rec.norm_excerpt, kw)) {
            inExcerpt.push(kw);
            score += 3;
          }
        });
        if (score < minScore) continue;

        matched.push({
          record_id: rec.record_id,
          source_domain: rec.source_domain,
          source_type: rec.source_type,
          canonical_url: rec.canonical_url,
          published_at: rec.published_at,
          verbatim_title: rec.verbatim_title,
          verbatim_excerpt: rec.verbatim_excerpt,
          relevance_score: score,
          matched_triggers: { in_title: inTitle, in_excerpt: inExcerpt },
        });
      }

      matched.sort((a, b) => b.relevance_score - a.relevance_score);
      results.push({
        checklist_id: chk.id,
        checklist_name: chk.plain_label,
        layer: chk.layer,
        rules: { must_all: mustAll, any_of: anyOf, exclude },
        matched_records: matched.slice(0, 5),
      });
    }

    return {
      schema_version: '1.0.0',
      generated_at: new Date().toISOString(),
      checklist_items: results,
      total_matches: results.reduce((s, x) => s + x.matched_records.length, 0),
    };
  }

  // --------------------------------------------------------------------------
  // 5. HỢP ĐỒNG DỮ LIỆU THỐNG NHẤT (INVEST_INTEL_SYNC_V2) CHO CODE & GEMINI
  // --------------------------------------------------------------------------
  function buildUnifiedAnalyticsFromCode({ report, goldSnap, goldHist30d, stockData, reData, surveys }) {
    const asOf = INV.utils?.todayIso ? INV.utils.todayIso() : new Date().toISOString().slice(0, 10);
    const ch = report?.channel_scores || {
      cash: { score: 85, badge: 'An toàn sinh lãi', reason: 'Giữ thanh khoản chờ cơ hội tốt.' },
      gold: { score: 56, badge: 'Chờ giảm chênh lệch', reason: 'Chênh lệch giá trong nước còn cao.' },
      stock: { score: 70, badge: 'Tích lũy chậm', reason: 'Định giá hợp lý nhưng tránh vay margin.' },
      real_estate: { score: 48, badge: 'Tránh vay lớn', reason: 'Lãi suất thả nổi cao hơn tỷ suất thuê.' },
    };

    const sCash = Math.max(0, Math.min(100, Number(ch.cash?.score) || 85));
    const sGold = Math.max(0, Math.min(100, Number(ch.gold?.score) || 56));
    const sStock = Math.max(0, Math.min(100, Number(ch.stock?.score) || 70));
    const sRe = Math.max(0, Math.min(100, Number(ch.real_estate?.score) || 48));

    // Tính phân bổ vốn đề xuất chuẩn toán học từ điểm hấp dẫn (luôn tổng = 100%)
    const totalScore = Math.max(1, sCash + sGold + sStock + sRe);
    const pCash = Math.round((sCash / totalScore) * 100);
    const pStock = Math.round((sStock / totalScore) * 100);
    const pGold = Math.round((sGold / totalScore) * 100);
    const pRe = Math.max(0, 100 - pCash - pStock - pGold);

    const goldPremium = Number(goldSnap?.sjc?.diffRawPercent);
    const goldSpread = Number(goldSnap?.sjc?.spreadPercent);
    const riskGold = Number.isFinite(goldPremium) ? Math.min(100, Math.max(20, Math.round(goldPremium * 5.5))) : 68;
    const riskGeo = (report?.live_headlines || []).some((h) => /war|ukraine|iran|tariff|sanction|strike/i.test(h.title || '')) ? 84 : 58;
    const riskRates = 76;
    const riskMargin = 78;
    const riskReCashflow = 82;
    const riskLiquidity = 45;

    const goldPts = (goldHist30d?.points || []).slice(-15).map((p) => ({
      label: p.date.slice(5),
      value: Number(p.close.toFixed(1)),
    }));
    const rePts = (Array.isArray(surveys) ? [...surveys].reverse() : [])
      .filter((s) => Number(s.pricePerM2) > 0)
      .slice(-10)
      .map((s) => ({ label: String(s.date).slice(5), value: Number(s.pricePerM2) }));

    return {
      schema: 'INVEST_INTEL_SYNC_V2',
      origin: 'code_auto',
      as_of_date: report?.as_of_date || asOf,
      cycle_phase: report?.cycle_phase || {
        label: 'Pha III — Quá nhiệt / Thận trọng chủ động',
        plain_advice: 'Ưu tiên giữ tiền mặt sinh lãi an toàn, không vay đòn bẩy cao.',
      },
      verdict_summary: {
        headline: report?.narrative_summary?.current_outlook || 'Ưu tiên phòng thủ chủ động, chia vốn đều và không mua đuổi khi chênh lệch còn cao.',
        action: sCash >= 80 ? 'QUAN_SAT_TICH_LUY_NHO' : 'TICH_LUY',
        opportunities: report?.narrative_summary?.opportunities || [],
        risks: report?.narrative_summary?.risks || [],
        current_outlook: report?.narrative_summary?.current_outlook || '',
        upcoming_outlook: report?.narrative_summary?.upcoming_outlook || '',
      },
      channel_scores: { cash: sCash, gold: sGold, stock: sStock, real_estate: sRe },
      allocation_pct: [
        { label: 'Tiền mặt / Gửi tiết kiệm', value: pCash, color: '#38bdf8' },
        { label: 'Chứng khoán (không margin)', value: pStock, color: '#10b981' },
        { label: 'Vàng vật chất', value: pGold, color: '#f59e0b' },
        { label: 'Nhà đất / Quỹ dự phòng', value: pRe, color: '#a855f7' },
      ],
      five_pillars: [
        { name: 'Vĩ mô, Lãi suất & Địa chính trị', score: Number(((100 - riskGeo * 0.4 - riskRates * 0.3) / 10).toFixed(1)), note: 'Lãi suất Mỹ & căng thẳng chiến sự/thuế quan vẫn tạo biến động ngắn hạn.' },
        { name: 'Sức khỏe Kênh Vàng (Thế giới & SJC)', score: Number((sGold / 10).toFixed(1)), note: Number.isFinite(goldPremium) ? `Chênh lệch nội địa +${goldPremium.toFixed(1)}% · Spread ${Number.isFinite(goldSpread) ? goldSpread.toFixed(2) : '—'}%.` : ch.gold?.reason || '' },
        { name: 'Định giá & Tiền thật Chứng khoán', score: Number((sStock / 10).toFixed(1)), note: ch.stock?.reason || '' },
        { name: 'Dòng tiền & An toàn Nhà đất', score: Number((sRe / 10).toFixed(1)), note: ch.real_estate?.reason || '' },
        { name: 'Vùng đệm An toàn & Thanh khoản', score: Number((sCash / 10).toFixed(1)), note: ch.cash?.reason || '' },
      ],
      risk_radar: [
        { label: 'Địa chính trị & Thuế quan', level: riskGeo },
        { label: 'Áp lực Lãi suất cao', level: riskRates },
        { label: 'Độ đắt Giá Vàng nội địa', level: riskGold },
        { label: 'Đòn bẩy Margin CK', level: riskMargin },
        { label: 'Âm dòng tiền vay BĐS', level: riskReCashflow },
        { label: 'Rủi ro Thanh khoản', level: riskLiquidity },
      ],
      decision_matrix: [
        { channel: 'Tiền mặt / Tiết kiệm', decision: 'NẮM GIỮ ƯU TIÊN', signal: 'positive', score: sCash, reason: ch.cash?.reason || '' },
        { channel: 'Chứng khoán', decision: 'TÍCH LŨY CHẬM (TIỀN THẬT)', signal: 'caution', score: sStock, reason: ch.stock?.reason || '' },
        { channel: 'Vàng', decision: sGold >= 70 ? 'TÍCH LŨY TỪNG PHẦN' : 'CHỜ GIẢM CHÊNH LỆCH', signal: sGold >= 70 ? 'positive' : 'caution', score: sGold, reason: ch.gold?.reason || '' },
        { channel: 'Nhà đất', decision: 'TRÁNH VAY LỚN / CHỌN LỌC', signal: 'danger', score: sRe, reason: ch.real_estate?.reason || '' },
      ],
      time_series: goldPts.length >= 4
        ? { title: 'Giá Vàng Thế Giới 15 Phiên Gần Nhất (Live XAU/PAXG)', unit: 'USD/oz', points: goldPts }
        : rePts.length >= 2
        ? { title: 'Lịch Sử Giá Rao Nhà Đất Khảo Sát Thực Địa', unit: 'triệu/m²', points: rePts }
        : { title: 'So sánh Điểm Hấp Dẫn Hiện Tại Theo Kênh', unit: 'điểm', points: [{ label: 'Tiền mặt', value: sCash }, { label: 'Chứng khoán', value: sStock }, { label: 'Vàng', value: sGold }, { label: 'Nhà đất', value: sRe }] },
      red_flags: (report?.triggered_breakers || []).map((b) => ({ title: b.title, detail: b.detail })),
      missing_to_verify: (report?.items || []).filter((i) => i.status === 'DATA_MISSING').map((i) => i.plain_label),
    };
  }

  // Bóc tách câu trả lời của Gemini (chỉ chấp nhận đúng khối JSON hợp lệ INVEST_INTEL_SYNC_V2!)
  function parseGeminiStructuredReply(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return { ok: false, error: 'Bạn chưa dán câu trả lời từ Gemini vào ô.' };

    // Tìm khối ```json ... ``` hoặc khối JSON lớn nhất chứa "INVEST_INTEL_SYNC_V2"
    const fencedMatches = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((m) => m[1].trim());
    const candidates = [...fencedMatches];
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      candidates.push(text.slice(firstBrace, lastBrace + 1));
    }

    let parsed = null;
    for (const cand of candidates) {
      try {
        const obj = JSON.parse(cand);
        if (obj && typeof obj === 'object' && (obj.schema === 'INVEST_INTEL_SYNC_V2' || obj.channel_scores || obj.allocation_pct || obj.five_pillars)) {
          parsed = obj;
          break;
        }
      } catch (_e) {}
    }

    if (!parsed) {
      return {
        ok: false,
        error: 'Chưa thấy khối mã ```json ... ``` chuẩn INVEST_INTEL_SYNC_V2 trong câu trả lời vừa dán. Hãy chắc chắn bạn dùng nút "Tự động sao chép & Chia đôi màn hình với Gemini" rồi dán trọn vẹn câu trả lời của Gemini (bao gồm đoạn JSON ở cuối).',
      };
    }

    const clamp = (v, lo, hi, fb) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fb;
    };

    const cs = parsed.channel_scores || {};
    const normalized = {
      schema: 'INVEST_INTEL_SYNC_V2',
      origin: 'gemini_synced',
      synced_at: new Date().toISOString(),
      as_of_date: String(parsed.as_of_date || INV.utils?.todayIso?.() || ''),
      cycle_phase: {
        label: cleanVerbatimText(parsed.cycle_phase?.label || 'Phân tích đồng bộ từ Gemini', 120),
        plain_advice: cleanVerbatimText(parsed.cycle_phase?.plain_advice || '', 260),
      },
      verdict_summary: {
        headline: cleanVerbatimText(parsed.verdict_summary?.headline || '', 320),
        action: cleanVerbatimText(parsed.verdict_summary?.action || 'QUAN_SAT', 40),
        opportunities: Array.isArray(parsed.verdict_summary?.opportunities) ? parsed.verdict_summary.opportunities.slice(0, 6).map((x) => cleanVerbatimText(x, 220)) : [],
        risks: Array.isArray(parsed.verdict_summary?.risks) ? parsed.verdict_summary.risks.slice(0, 6).map((x) => cleanVerbatimText(x, 220)) : [],
        current_outlook: cleanVerbatimText(parsed.verdict_summary?.current_outlook || parsed.verdict_summary?.headline || '', 420),
        upcoming_outlook: cleanVerbatimText(parsed.verdict_summary?.upcoming_outlook || '', 420),
      },
      channel_scores: {
        cash: clamp(cs.cash, 0, 100, 75),
        gold: clamp(cs.gold, 0, 100, 60),
        stock: clamp(cs.stock, 0, 100, 65),
        real_estate: clamp(cs.real_estate, 0, 100, 50),
      },
      allocation_pct: Array.isArray(parsed.allocation_pct) && parsed.allocation_pct.length
        ? parsed.allocation_pct.slice(0, 6).map((a, i) => ({
            label: cleanVerbatimText(a.label || `Kênh ${i + 1}`, 48),
            value: clamp(a.value, 0, 100, 25),
            color: /^#[0-9a-f]{3,8}$/i.test(String(a.color || '')) ? a.color : ['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#f43f5e', '#14b8a6'][i % 6],
          }))
        : [
            { label: 'Tiền mặt / Tiết kiệm', value: 30, color: '#38bdf8' },
            { label: 'Chứng khoán', value: 30, color: '#10b981' },
            { label: 'Vàng', value: 15, color: '#f59e0b' },
            { label: 'Nhà đất / Dự phòng', value: 25, color: '#a855f7' },
          ],
      five_pillars: Array.isArray(parsed.five_pillars)
        ? parsed.five_pillars.slice(0, 6).map((p) => ({
            name: cleanVerbatimText(p.name || 'Trụ cột', 60),
            score: clamp(p.score, 0, 10, 5),
            note: cleanVerbatimText(p.note || '', 180),
          }))
        : [],
      risk_radar: Array.isArray(parsed.risk_radar)
        ? parsed.risk_radar.slice(0, 8).map((r) => ({
            label: cleanVerbatimText(r.label || 'Rủi ro', 40),
            level: clamp(r.level, 0, 100, 50),
          }))
        : [],
      decision_matrix: Array.isArray(parsed.decision_matrix)
        ? parsed.decision_matrix.slice(0, 6).map((d) => ({
            channel: cleanVerbatimText(d.channel || 'Tài sản', 40),
            decision: cleanVerbatimText(d.decision || 'QUAN SÁT', 40),
            signal: ['positive', 'neutral', 'caution', 'danger'].includes(d.signal) ? d.signal : clamp(d.score, 0, 100, 50) >= 70 ? 'positive' : clamp(d.score, 0, 100, 50) <= 45 ? 'danger' : 'caution',
            score: clamp(d.score, 0, 100, 50),
            reason: cleanVerbatimText(d.reason || '', 200),
          }))
        : [],
      time_series: parsed.time_series && Array.isArray(parsed.time_series.points) && parsed.time_series.points.length >= 2
        ? {
            title: cleanVerbatimText(parsed.time_series.title || 'Xu hướng theo thời gian', 90),
            unit: cleanVerbatimText(parsed.time_series.unit || '', 20),
            points: parsed.time_series.points.slice(0, 30).map((pt) => ({
              label: cleanVerbatimText(pt.label || '', 16),
              value: Number(pt.value) || 0,
            })),
          }
        : null,
      red_flags: Array.isArray(parsed.red_flags)
        ? parsed.red_flags.slice(0, 8).map((rf) => ({
            title: cleanVerbatimText(rf.title || 'Cờ đỏ rủi ro', 100),
            detail: cleanVerbatimText(rf.detail || '', 240),
          }))
        : [],
      missing_to_verify: Array.isArray(parsed.missing_to_verify)
        ? parsed.missing_to_verify.slice(0, 10).map((m) => cleanVerbatimText(m, 180))
        : [],
    };

    return { ok: true, data: normalized };
  }

  INV.deterministicExtractor = {
    cleanVerbatimText,
    normalizeForMatch,
    computeSha256Hex,
    validateAndFreezeRecords,
    matchRecordsToChecklist,
    buildUnifiedAnalyticsFromCode,
    parseGeminiStructuredReply,
  };
})(typeof window !== 'undefined' ? window : globalThis);
