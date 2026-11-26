/**
 * ============================================================================
 * 🤖 ĐĂNGLOVEPDF 2.0 — GEMINI 2-TRACK BRIDGE, VISION DEEP READ & API KEY SYNC
 * ============================================================================
 * Chương 2 + Chương 7:
 *  - Shared API Key (`noir_gemini_api_key`) đồng bộ tức thời giữa Web gốc (index.html),
 *    ĐăngLovePDF (danglovepdf.html), Mod 49 (Đầu tư) và Mod 50 (30 phút thông thái).
 *  - Luồng A (0-Token Copy/Paste 1 chạm):
 *      + `PROMPT_CHINH_TIEU_DE_CHUAN`: câu lệnh chuẩn hóa cấu trúc # / ## / Bảng GFM / LaTeX
 *        giữ nguyên 100% số liệu, văn phong & đơn vị tiền tệ `$28.40`, `$70tr`.
 *      + Nút Xem Prompt, Chép 1 chạm & theo dõi focus khi quay lại từ Gemini Web.
 *  - Luồng B (Direct Gemini Text & Gemini Vision Deep Read):
 *      + Render PDF theo batch 2 trang/lượt -> gọi `gemini-2.5-flash` -> backoff 429/503 ->
 *        khâu nối `<!-- CONTINUE_TABLE -->` -> parse AST & cập nhật Mục lục tức thì!
 * ============================================================================
 */
(function initNoirDangLovePdfGeminiBridge(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});
  const API_STORAGE_KEY = 'noir_gemini_api_key';
  const API_VERIFIED_STORAGE_KEY = 'noir_gemini_key_verified_v1';
  const API_TRANSPORT_STORAGE_KEY = 'noir_gemini_key_transport_v1';
  const API_COOKIE_NAME = 'noir_gemini_api_key_ck';
  const IDB_BACKUP_KEY = '__noir_persist_api_key_v1';

  const GEMINI_TRANSPORTS = Object.freeze({
    AI_STUDIO_QUERY: {
      id: 'AI_STUDIO_QUERY',
      isVertex: false,
      buildGenerateUrl: (m, k) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(k)}`,
      buildModelsUrl: (k) => `https://generativelanguage.googleapis.com/v1beta/models?pageSize=25&key=${encodeURIComponent(k)}`,
      buildHeaders: () => ({ 'Content-Type': 'application/json' }),
      buildGetHeaders: () => ({}),
    },
    AI_STUDIO_HEADER: {
      id: 'AI_STUDIO_HEADER',
      isVertex: false,
      buildGenerateUrl: (m) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,
      buildModelsUrl: () => `https://generativelanguage.googleapis.com/v1beta/models?pageSize=25`,
      buildHeaders: (k) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': k }),
      buildGetHeaders: (k) => ({ 'x-goog-api-key': k }),
    },
    VERTEX_EXPRESS_QUERY: {
      id: 'VERTEX_EXPRESS_QUERY',
      isVertex: true,
      buildGenerateUrl: (m, k) => `https://aiplatform.googleapis.com/v1/publishers/google/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(k)}`,
      buildModelsUrl: null,
      buildHeaders: () => ({ 'Content-Type': 'application/json' }),
      buildGetHeaders: null,
    },
    VERTEX_EXPRESS_HEADER: {
      id: 'VERTEX_EXPRESS_HEADER',
      isVertex: true,
      buildGenerateUrl: (m) => `https://aiplatform.googleapis.com/v1/publishers/google/models/${encodeURIComponent(m)}:generateContent`,
      buildModelsUrl: null,
      buildHeaders: (k) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': k }),
      buildGetHeaders: null,
    },
    VERTEX_EXPRESS_BETA_QUERY: {
      id: 'VERTEX_EXPRESS_BETA_QUERY',
      isVertex: true,
      buildGenerateUrl: (m, k) => `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(k)}`,
      buildModelsUrl: null,
      buildHeaders: () => ({ 'Content-Type': 'application/json' }),
      buildGetHeaders: null,
    },
  });

  function sanitizeApiKey(raw) {
    return String(raw || '')
      .replace(/[\u200B-\u200D\uFEFF\r\n\t\s]+/g, '')
      .replace(/^["'`]+|["'`]+$/g, '')
      .trim();
  }

  function saveVerifiedTransport(keyVal, transportId) {
    const clean = sanitizeApiKey(keyVal);
    if (!clean || !GEMINI_TRANSPORTS[transportId]) return;
    try {
      global.localStorage?.setItem(API_TRANSPORT_STORAGE_KEY, JSON.stringify({ fp: keyFingerprint(clean), transportId }));
    } catch (_eTr) {}
  }

  function getSavedTransport(keyVal) {
    const clean = sanitizeApiKey(keyVal);
    if (!clean) return '';
    try {
      const raw = global.localStorage?.getItem(API_TRANSPORT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.fp === keyFingerprint(clean) && GEMINI_TRANSPORTS[parsed.transportId]) {
          return parsed.transportId;
        }
      }
    } catch (_eTr) {}
    return '';
  }

  function getTransportsForKey(keyVal) {
    const clean = sanitizeApiKey(keyVal);
    const saved = getSavedTransport(clean);
    const base = /^AQ\./i.test(clean)
      ? ['VERTEX_EXPRESS_QUERY', 'AI_STUDIO_QUERY', 'AI_STUDIO_HEADER', 'VERTEX_EXPRESS_HEADER', 'VERTEX_EXPRESS_BETA_QUERY']
      : ['AI_STUDIO_QUERY', 'AI_STUDIO_HEADER', 'VERTEX_EXPRESS_QUERY'];
    return Array.from(new Set([saved, ...base].filter((id) => Boolean(id && GEMINI_TRANSPORTS[id]))));
  }
  const TASK_MODEL_PROFILES = Object.freeze({
    // Tác vụ nhẹ (Verify, Metadata, Split keyword, Form, PII, Auto-TOC, sửa chính tả) -> Ưu tiên Flash-Lite hạn mức cao nhất & < 1s
    fast_light: Object.freeze(['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash']),
    // Tác vụ đa phương thức tệp (10 Theme PDF gốc, OCR 1 lượt, ICR chữ viết tay, Bóc bảng Excel, Dịch trang) -> Flash chính xác nhất, tự lùi sang Flash-Lite khi 429
    doc_multimodal: Object.freeze(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']),
    // Tác vụ phân tích chuyên sâu dài (Mod 49 Đầu tư, Mod 50 30 phút thông thái, So sánh Diff, Tóm tắt PDF) -> Flash + tự xoay vòng Flash-Lite / Pro khi 429
    deep_analysis: Object.freeze(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash']),
  });

  const DEFAULT_VISION_MODELS = TASK_MODEL_PROFILES.doc_multimodal;

  function getOptimalModelsForTask(taskType = 'doc_multimodal') {
    return TASK_MODEL_PROFILES[taskType] || TASK_MODEL_PROFILES.doc_multimodal;
  }

  function isQuota429Error(errOrMsg) {
    const s = String(errOrMsg?.message || errOrMsg || '');
    return /\b429\b|quota|rate[\s-]*limit|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(s);
  }

  const PROMPT_CHINH_TIEU_DE_CHUAN = [
    'Bạn là chuyên gia biên tập và chuẩn hóa tài liệu học thuật / tài chính đa ngôn ngữ.',
    'Hãy đọc toàn bộ tài liệu dưới đây và TRẢ LẠI ĐẦY ĐỦ 100% NỘI DUNG bằng Markdown chuẩn (tuyệt đối KHÔNG tóm tắt bớt ý, KHÔNG bịa hoặc sửa bất kỳ số liệu, trích dẫn hay tên riêng nào):',
    '',
    '1. PHÂN CẤP TIÊU ĐỀ CHUẨN (4 CẤP):',
    '   - `# TIÊU ĐỀ CẤP 1` cho PHẦN, CHƯƠNG, TÓM TẮT, LỜI MỞ ĐẦU, KẾT LUẬN, TÀI LIỆU THAM KHẢO.',
    '   - `## TIÊU ĐỀ CẤP 2` cho I., II., 1.1., 2.1., A., B.',
    '   - `### TIÊU ĐỀ CẤP 3` cho 1.1.1., Câu 1:, Bài 1:, Giải pháp 1:.',
    '   - `#### TIÊU ĐỀ CẤP 4` cho 1.1.1.1., a), b).',
    '   - Mọi bước tính toán như `1. EBIT = 62.500` hoặc `2. FCF = $28.40` là nội dung bài toán, KHÔNG gắn `#`.',
    '',
    '2. BẢNG DỮ LIỆU CHUẨN GFM:',
    '   - Đặt tên bảng ngay phía trên theo mẫu: `**Bảng X: Tên bảng**`',
    '   - Kẻ bảng đầy đủ bằng Markdown `| Cột 1 | Cột 2 | ... |` kèm dòng `| :--- | ---: |`.',
    '   - Nếu 1 bảng kéo dài qua ranh giới trang, đặt thẻ `<!-- CONTINUE_TABLE -->` giữa hai phần để hệ thống ghép liền.',
    '   - Đặt nguồn ngay dưới bảng (nếu có) theo mẫu: `*Nguồn: ...*`',
    '',
    '3. CÔNG THỨC TOÁN & TIỀN TỆ:',
    '   - Mọi công thức toán/tài chính phải bọc bằng LaTeX `$...$` (cùng dòng) hoặc `$$...$$` (khối riêng).',
    '   - TUYỆT ĐỐI KHÔNG bọc các con số tiền tệ như `$28.40`, `$70tr`, `$397,143` bằng dấu `$` kiểu công thức — giữ nguyên là văn bản tiền tệ bình thường.',
    '',
    '4. THẺ ĐỊNH VỊ HỌC THUẬT:',
    '   - Giữ nguyên các nhãn `[Quan sát]`, `[Suy luận]`, `[Đề xuất]`, `[Kết luận]`, `Hiểu kiểu bình dân:`, `Chốt ý chuyên môn:` ở đầu đoạn nếu tài liệu có dùng.',
  ].join('\n');

  // ==========================================================================
  // 1. QUẢN LÝ API KEY DÙNG CHUNG (4 LỚP BỀN VỮNG + XÁC MINH THẬT VỚI GOOGLE)
  // ==========================================================================
  function readPersistCookie(name) {
    try {
      if (typeof document === 'undefined' || !document.cookie) return '';
      const prefix = `${encodeURIComponent(name)}=`;
      const parts = document.cookie.split(';');
      for (const p of parts) {
        const s = p.trim();
        if (s.startsWith(prefix)) return decodeURIComponent(s.slice(prefix.length)).trim();
      }
    } catch (_eCk) {}
    return '';
  }

  function writePersistCookie(name, value) {
    try {
      if (typeof document === 'undefined') return;
      if (global.location?.protocol === 'file:') return;
      if (value) {
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${365 * 86400}; path=/; SameSite=Lax`;
      } else {
        document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
      }
    } catch (_eCkW) {}
  }

  function keyFingerprint(k) {
    const s = String(k || '').trim();
    if (s.length < 12) return '';
    return `${s.slice(0, 8)}...${s.slice(-6)}:${s.length}`;
  }

  function markKeyVerified(keyVal, modelEndpoint = 'gemini-2.5-flash-lite') {
    const clean = String(keyVal || '').trim();
    if (!clean) return;
    try {
      global.localStorage?.setItem(
        API_VERIFIED_STORAGE_KEY,
        JSON.stringify({ fp: keyFingerprint(clean), modelEndpoint, verifiedAt: Date.now() })
      );
    } catch (_eV) {}
  }

  function clearKeyVerifiedRecord() {
    try { global.localStorage?.removeItem(API_VERIFIED_STORAGE_KEY); } catch (_eV) {}
  }

  function isApiKeyVerified(keyVal = getApiKey()) {
    const clean = String(keyVal || '').trim();
    if (!clean) return false;
    try {
      if (NS.apiClient?.isFlashLiteVerifiedForKey?.(clean)) return true;
      const raw = global.localStorage?.getItem(API_VERIFIED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.fp && parsed.fp === keyFingerprint(clean)) return true;
      }
    } catch (_eV) {}
    return false;
  }

  function getApiKey() {
    try {
      const direct = String(global.localStorage?.getItem(API_STORAGE_KEY) || '').trim();
      if (direct) return direct;
      const fromClient = String(NS.apiClient?.getEffectiveActiveKey?.() || '').trim();
      if (fromClient) {
        try { global.localStorage?.setItem(API_STORAGE_KEY, fromClient); } catch (_e) {}
        return fromClient;
      }
      const altLs = String(global.localStorage?.getItem('gemini_api_key') || '').trim();
      if (altLs) {
        try { global.localStorage?.setItem(API_STORAGE_KEY, altLs); } catch (_e) {}
        return altLs;
      }
      const fromCk = readPersistCookie(API_COOKIE_NAME);
      if (fromCk && fromCk.length >= 12) {
        try { global.localStorage?.setItem(API_STORAGE_KEY, fromCk); } catch (_e) {}
        return fromCk;
      }
      const fromDom = String(global.document?.getElementById?.('api-key-input')?.value || '').trim();
      return fromDom;
    } catch (_e) {
      return '';
    }
  }

  // Tự động khôi phục từ IndexedDB (nếu localStorage vừa bị xóa sạch)
  try {
    if (!getApiKey() && NS.idb && typeof NS.idb.get === 'function') {
      NS.idb.get('state_cache', IDB_BACKUP_KEY).then((saved) => {
        const clean = String(saved || '').trim();
        if (clean.length >= 12 && !getApiKey()) {
          try {
            global.localStorage?.setItem(API_STORAGE_KEY, clean);
            global.localStorage?.setItem('gemini_api_key', clean);
          } catch (_e) {}
          notifyKeyListeners(clean);
        }
      }).catch(() => {});
    }
  } catch (_eHydrate) {}

  function notifyKeyListeners(keyVal) {
    const hasKey = Boolean(String(keyVal || '').trim());
    try {
      const domInp = global.document?.getElementById?.('api-key-input');
      if (domInp && domInp.value !== keyVal) domInp.value = keyVal || '';
    } catch (_eDom) {}
    try {
      global.dispatchEvent?.(new CustomEvent('noir-gemini-key-changed', { detail: { hasKey } }));
    } catch (_eEvt) {}
  }

  function setApiKey(rawKey, opts = {}) {
    const clean = String(rawKey || '').trim();
    try {
      if (clean) {
        global.localStorage?.setItem(API_STORAGE_KEY, clean);
        global.localStorage?.setItem('gemini_api_key', clean);
        writePersistCookie(API_COOKIE_NAME, clean);
        if (opts.verified) markKeyVerified(clean, opts.modelEndpoint || 'gemini-2.5-flash');
        if (NS.apiClient && typeof NS.apiClient.saveApiKey === 'function') {
          try { NS.apiClient.saveApiKey(clean); } catch (_eMc) {}
        }
        if (NS.idb && typeof NS.idb.set === 'function') {
          NS.idb.set('state_cache', IDB_BACKUP_KEY, clean).catch(() => {});
        }
      } else {
        global.localStorage?.removeItem(API_STORAGE_KEY);
        global.localStorage?.removeItem('gemini_api_key');
        clearKeyVerifiedRecord();
        writePersistCookie(API_COOKIE_NAME, '');
        if (NS.idb && typeof NS.idb.delete === 'function') {
          NS.idb.delete('state_cache', IDB_BACKUP_KEY).catch(() => {});
        }
      }
    } catch (_eLs) {}
    notifyKeyListeners(clean);
    return clean;
  }

  async function verifyApiKeyLive(rawKey, opts = {}) {
    const clean = sanitizeApiKey(rawKey);
    const desktopFetch = global.NoirDesktopLocalEngine?.geminiFetch
      ? async (url, init = {}) => {
          const r = await global.NoirDesktopLocalEngine.geminiFetch({
            url,
            method: init.method || 'GET',
            headers: init.headers || {},
            body: init.body,
            timeoutMs: 14000,
          });
          if (!r || r.status === 0) throw new Error(r?.text || 'Desktop fetch error');
          return {
            ok: Boolean(r.ok),
            status: Number(r.status),
            text: async () => String(r.text || ''),
            json: async () => JSON.parse(String(r.text || '{}')),
          };
        }
      : null;
    const fetchImpl = opts.fetchImpl || desktopFetch || global.fetch?.bind(global);
    if (!clean) {
      return { ok: false, message: 'Vui lòng nhập mã Google / Gemini API Key (bắt đầu bằng AIza... hoặc AQ...).' };
    }
    if (clean.length < 20 || !/^[0-9A-Za-z._-]{20,}$/.test(clean)) {
      return { ok: false, message: 'Định dạng API Key không hợp lệ (hỗ trợ cả khóa AIza... và khóa AQ... mới của Google AI Studio / Vertex Express, tối thiểu 20 ký tự).' };
    }
    if (global.__NOIR_TEST_BYPASS_KEY_VERIFY === true) {
      return { ok: true, modelEndpoint: 'gemini-2.5-flash-lite', transportId: 'AI_STUDIO_QUERY', message: 'Key hợp lệ (chế độ test).' };
    }
    // Ưu tiên tái sử dụng trình xác minh thật của màn hình chính (mod15) nếu đang ở Web gốc
    const mainApiClient = NS.geminiRouter || NS.apiClient;
    if (!opts.forceDirect && mainApiClient && typeof mainApiClient.verifyKeyWithLowestFlashLite === 'function') {
      try {
        const res = await mainApiClient.verifyKeyWithLowestFlashLite(clean, { autoSave: false, emitEvents: true });
        if (res?.ok || res?.verified) {
          if (res.transportType) saveVerifiedTransport(clean, res.transportType);
          return {
            ok: true,
            modelEndpoint: res.modelEndpoint || 'gemini-2.5-flash-lite',
            transportId: res.transportType || getTransportsForKey(clean)[0],
            message: `Đã xác minh thành công với Google Gemini (${res.modelEndpoint || 'Flash-Lite'})!`,
          };
        }
        // Nếu mod15 chưa hỗ trợ transport của key này, tiếp tục kiểm tra đa cổng trực tiếp bên dưới
      } catch (_eMod15) {
        // fallback sang kiểm tra trực tiếp bên dưới
      }
    }
    if (typeof fetchImpl !== 'function') {
      return { ok: false, message: 'Trình duyệt không hỗ trợ kết nối mạng để xác minh API Key.' };
    }

    const transportOrder = getTransportsForKey(clean);
    let discoveredFlash = [];
    let bestErrStatus = 0;
    let bestErrDetail = '';

    // Bước 1: Thử dò danh sách model sống trên AI Studio (nếu là khóa AIza hoặc AQ hỗ trợ AI Studio)
    for (const tid of ['AI_STUDIO_QUERY', 'AI_STUDIO_HEADER']) {
      const tr = GEMINI_TRANSPORTS[tid];
      if (!tr?.buildModelsUrl) continue;
      try {
        const listRes = await fetchImpl(tr.buildModelsUrl(clean), {
          method: 'GET',
          headers: tr.buildGetHeaders ? tr.buildGetHeaders(clean) : {},
        });
        if (listRes.ok) {
          const listJson = await listRes.json().catch(() => ({}));
          const modelsArr = Array.isArray(listJson?.models) ? listJson.models : [];
          discoveredFlash = modelsArr
            .map((m) => String(m?.name || '').replace(/^models\//, ''))
            .filter((n) => /gemini-2\.[05]-flash/i.test(n) && !/image|tts|audio|live|thinking/i.test(n));
          break;
        }
        bestErrStatus = listRes.status;
        bestErrDetail = (await listRes.text().catch(() => '')).slice(0, 140);
      } catch (_eList) {}
    }

    // Bước 2: Real-time ping generateContent qua tất cả transport (AI Studio + Vertex Express cho AQ.*)
    const probeChain = Array.from(new Set([...discoveredFlash, 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-001']));
    for (const tid of transportOrder) {
      const tr = GEMINI_TRANSPORTS[tid];
      if (!tr) continue;
      for (const ep of probeChain.slice(0, 4)) {
        try {
          const pingRes = await fetchImpl(tr.buildGenerateUrl(ep, clean), {
            method: 'POST',
            headers: tr.buildHeaders(clean),
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'OK' }] }],
              generationConfig: { maxOutputTokens: 4, temperature: 0 },
            }),
          });
          if (pingRes.ok) {
            saveVerifiedTransport(clean, tid);
            return { ok: true, modelEndpoint: ep, transportId: tid, message: `Xác minh thời gian thực thành công (${ep} · ${tr.isVertex ? 'Vertex Express' : 'Google AI Studio'})!` };
          }
          if (pingRes.status === 429) {
            // HTTP 429 nghĩa là Google đã xác nhận Key TỒN TẠI & HỢP LỆ nhưng tạm chạm giới hạn phút
            saveVerifiedTransport(clean, tid);
            return { ok: true, modelEndpoint: ep, transportId: tid, rateLimited: true, message: `Xác minh Key hợp lệ (${ep}, đang tạm chạm hạn mức phút — vẫn lưu thành công và hỗ trợ chuyển AI thủ công nếu cần).` };
          }
          bestErrStatus = pingRes.status;
          bestErrDetail = (await pingRes.text().catch(() => '')).slice(0, 160);
          if (pingRes.status === 401 || pingRes.status === 403 || (pingRes.status === 400 && /API_KEY_INVALID|API key not valid/i.test(bestErrDetail))) {
            // Sai cổng (VD: khóa AQ. thử ở AI Studio bị 400 -> thoát sang thử Vertex Express ngay!)
            break;
          }
        } catch (_ePing) {
          // Lỗi CORS trên header transport -> thử transport kế tiếp ngay
          break;
        }
      }
    }

    if (discoveredFlash.length > 0) {
      saveVerifiedTransport(clean, 'AI_STUDIO_QUERY');
      return { ok: true, modelEndpoint: discoveredFlash[0], transportId: 'AI_STUDIO_QUERY', message: `Đã xác minh API Key tồn tại (${discoveredFlash[0]})!` };
    }
    return {
      ok: false,
      status: bestErrStatus,
      message: `Google từ chối xác minh API Key (HTTP ${bestErrStatus || 'ERR'}${bestErrDetail ? `: ${bestErrDetail}` : ''}). Hãy kiểm tra lại xem Key đã bật quyền Gemini/Vertex AI chưa hoặc tạo Key mới tại Google AI Studio.`,
    };
  }

  function clearApiKey() {
    return setApiKey('');
  }

  function hasApiKey() {
    return Boolean(getApiKey());
  }

  if (typeof global.addEventListener === 'function') {
    global.addEventListener('storage', (ev) => {
      if (ev && ev.key === API_STORAGE_KEY) {
        notifyKeyListeners(String(ev.newValue || '').trim());
      }
    });
  }

  // ==========================================================================
  // 2. TIỆN ÍCH CLIPBOARD + POPUP XEM PROMPT + POPUP GẮN API KEY NHANH
  // ==========================================================================
  async function copyTextToClipboard(text) {
    const str = String(text || '');
    if (!str) return false;
    try {
      if (global.navigator?.clipboard?.writeText) {
        await global.navigator.clipboard.writeText(str);
        return true;
      }
    } catch (_eClip) {}
    if (typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = str;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, str.length);
        const ok = document.execCommand('copy');
        ta.remove();
        return Boolean(ok);
      } catch (_eExec) {}
    }
    return false;
  }

  async function copyStandardPrompt() {
    const ok = await copyTextToClipboard(PROMPT_CHINH_TIEU_DE_CHUAN);
    NS.utils?.showToast?.(
      ok
        ? '✅ Đã sao chép Prompt chỉnh tiêu đề chuẩn! Bạn có thể mở Gemini và dán ngay.'
        : 'ℹ️ Trình duyệt chặn tự copy — hãy bấm "Xem Prompt" để sao chép thủ công.',
      ok ? 'success' : 'warning',
      3800
    );
    return ok;
  }

  function openPromptPreviewModal() {
    if (typeof document === 'undefined') return;
    document.getElementById('noir-std-prompt-preview-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'noir-std-prompt-preview-modal';
    modal.className = 'fixed inset-0 z-[2147483646] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5';
    modal.innerHTML = `
      <div class="w-full max-w-2xl rounded-2xl border border-amber-400/50 bg-zinc-900 text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[88dvh]">
        <div class="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div class="font-bold text-sm text-amber-300">👁️ Prompt Chỉnh Tiêu Đề &amp; Cấu Trúc Chuẩn (0 Token · Copy 1 chạm)</div>
          <button type="button" id="noir-std-prompt-close" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-100 text-xs font-bold cursor-pointer">✕</button>
        </div>
        <div class="p-4 overflow-y-auto space-y-3">
          <p class="text-xs text-zinc-300 leading-relaxed">
            Dán câu lệnh này cùng tài liệu của bạn vào <b>Gemini Web</b> (miễn phí 0 API Key), sau đó bấm Sao chép kết quả và dán lại vào tab <b>"Dán Văn Bản Từ AI"</b>.
          </p>
          <textarea id="noir-std-prompt-ta" readonly rows="13" class="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs font-mono text-emerald-200 leading-relaxed"></textarea>
        </div>
        <div class="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-end gap-2">
          <button type="button" id="noir-std-prompt-copy" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">📋 Sao chép Prompt</button>
          <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">🚀 Mở Gemini Web</a>
          <button type="button" id="noir-std-prompt-ok" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold cursor-pointer">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const ta = modal.querySelector('#noir-std-prompt-ta');
    if (ta) ta.value = PROMPT_CHINH_TIEU_DE_CHUAN;
    const close = () => modal.remove();
    modal.querySelector('#noir-std-prompt-close')?.addEventListener('click', close);
    modal.querySelector('#noir-std-prompt-ok')?.addEventListener('click', close);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
    modal.querySelector('#noir-std-prompt-copy')?.addEventListener('click', () => copyStandardPrompt());
  }

  function openApiKeyQuickModal(opts = {}) {
    if (typeof document === 'undefined') return;
    const { onSaved } = opts;
    document.getElementById('noir-gemini-key-quick-modal')?.remove();
    const current = getApiKey();
    const modal = document.createElement('div');
    modal.id = 'noir-gemini-key-quick-modal';
    modal.className = 'fixed inset-0 z-[2147483646] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5';
    modal.innerHTML = `
      <div class="w-full max-w-lg rounded-2xl border border-emerald-500/45 bg-zinc-900 text-zinc-100 shadow-2xl overflow-hidden">
        <div class="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div class="font-bold text-sm text-emerald-300">🔑 Kết nối Gemini API Key Dùng Chung (Đồng bộ toàn bộ App)</div>
          <button type="button" id="noir-gkey-close" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-100 text-xs font-bold cursor-pointer">✕</button>
        </div>
        <div class="p-4 space-y-3 text-xs">
          <div class="p-2.5 rounded-xl border border-cyan-500/35 bg-cyan-950/25 text-cyan-100 leading-relaxed">
            API Key được lưu cục bộ trên máy (<code>noir_gemini_api_key</code>) và tự động đồng bộ giữa <b>Web gốc</b>, <b>ĐăngLovePDF</b>, <b>Mod 49 Đầu tư</b> và <b>Mod 50 Thông thái</b>. Mọi cuộc gọi đi thẳng từ trình duyệt của bạn tới Google Gemini API.
          </div>
          <div class="space-y-1">
            <label for="noir-gkey-input" class="font-bold text-zinc-200 block">Nhập hoặc dán Google Gemini API Key:</label>
            <div class="flex items-center gap-1.5">
              <input id="noir-gkey-input" type="password" autocomplete="off" placeholder="AIzaSy... hoặc AQ..." class="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs font-mono" />
              <button type="button" id="noir-gkey-toggle-vis" class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold cursor-pointer" title="Hiện / Ẩn key">👁️</button>
            </div>
          </div>
          <div id="noir-gkey-status" class="hidden p-2.5 rounded-xl border text-xs font-bold leading-relaxed"></div>
          <div class="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" class="text-amber-300 hover:underline font-bold">🔑 Lấy API Key miễn phí tại Google AI Studio ↗</a>
            ${current ? (isApiKeyVerified(current) ? '<span class="text-emerald-400 font-bold">● Đã xác minh &amp; lưu bền vững trên máy</span>' : '<span class="text-amber-300 font-bold">● Đã lưu (Bấm Lưu để xác minh)</span>') : '<span class="text-zinc-400">○ Chưa có Key</span>'}
          </div>
        </div>
        <div class="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <button type="button" id="noir-gkey-clear" class="px-3 py-2 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold cursor-pointer">🗑️ Xóa Key</button>
          <div class="flex items-center gap-2">
            <button type="button" id="noir-gkey-cancel" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer">Hủy</button>
            <button type="button" id="noir-gkey-save" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">🔍 Xác minh &amp; Lưu vĩnh viễn</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const inp = modal.querySelector('#noir-gkey-input');
    const stBox = modal.querySelector('#noir-gkey-status');
    const saveBtn = modal.querySelector('#noir-gkey-save');
    if (inp) inp.value = current;
    const close = () => modal.remove();
    modal.querySelector('#noir-gkey-close')?.addEventListener('click', close);
    modal.querySelector('#noir-gkey-cancel')?.addEventListener('click', close);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
    modal.querySelector('#noir-gkey-toggle-vis')?.addEventListener('click', () => {
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
    });
    modal.querySelector('#noir-gkey-clear')?.addEventListener('click', () => {
      clearApiKey();
      NS.utils?.showToast?.('Đã xóa Gemini API Key khỏi bộ nhớ máy.', 'info', 2600);
      close();
    });
    saveBtn?.addEventListener('click', async () => {
      const val = String(inp?.value || '').trim();
      if (stBox) {
        stBox.className = 'p-2.5 rounded-xl border border-sky-500/45 bg-sky-950/40 text-sky-200 text-xs font-bold';
        stBox.textContent = '⏳ Đang xác minh API Key thật với Google Gemini...';
      }
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Đang xác minh...'; }
      try {
        const chk = await verifyApiKeyLive(val);
        if (!chk.ok) {
          if (stBox) {
            stBox.className = 'p-2.5 rounded-xl border border-rose-500/55 bg-rose-950/45 text-rose-200 text-xs font-bold';
            stBox.textContent = `❌ ${chk.message}`;
          }
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '🔍 Xác minh & Lưu vĩnh viễn'; }
          inp?.focus();
          return;
        }
        setApiKey(val, { verified: true, modelEndpoint: chk.modelEndpoint });
        NS.utils?.showToast?.(`✅ ${chk.message} Đã lưu vĩnh viễn vào máy!`, 'success', 3800);
        close();
        if (typeof onSaved === 'function') onSaved(val);
      } catch (err) {
        if (stBox) {
          stBox.className = 'p-2.5 rounded-xl border border-rose-500/55 bg-rose-950/45 text-rose-200 text-xs font-bold';
          stBox.textContent = `❌ Lỗi xác minh: ${err?.message || err}`;
        }
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '🔍 Xác minh & Lưu vĩnh viễn'; }
      }
    });
  }

  function watchClipboardReturn(onReturnFocus) {
    if (typeof global.addEventListener !== 'function') return () => {};
    let armed = true;
    const handler = () => {
      if (!armed) return;
      if (typeof onReturnFocus === 'function') onReturnFocus();
    };
    global.addEventListener('focus', handler);
    return () => {
      armed = false;
      global.removeEventListener?.('focus', handler);
    };
  }

  // ==========================================================================
  // 3. LUỒNG B: GỌI TRỰC TIẾP GEMINI API (TEXT + VISION 2 TRANG/LƯỢT + 429 BACKOFF)
  // ==========================================================================
  function sleepMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function callGeminiGenerateContent(opts = {}) {
    const {
      parts = [],
      systemInstruction = '',
      apiKey = getApiKey(),
      taskType = 'doc_multimodal',
      models = null,
      temperature = 0.2,
      maxOutputTokens = 8192,
      useGoogleSearch = false,
      signal = null,
      fetchImpl = global.fetch?.bind(global),
      onRetry = null,
    } = opts;
    const resolvedModels = Array.isArray(models) && models.length ? models : getOptimalModelsForTask(taskType);

    const cleanKey = String(apiKey || '').trim();
    if (!cleanKey) {
      throw new Error('Chưa có Gemini API Key. Hãy gắn API Key hoặc dùng luồng Copy/Paste 0 Token.');
    }
    if (typeof fetchImpl !== 'function') {
      throw new Error('Trình duyệt không hỗ trợ fetch() để gọi Gemini API.');
    }

    const bodyPayload = {
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature, maxOutputTokens },
    };
    if (systemInstruction) {
      bodyPayload.systemInstruction = { parts: [{ text: String(systemInstruction) }] };
    }
    if (useGoogleSearch) {
      bodyPayload.tools = [{ google_search: {} }];
    }

    let lastErr = null;
    const backoffDelays = [1500, 3500, 7000];
    const transportIds = getTransportsForKey(cleanKey);

    for (const tid of transportIds) {
      const tr = GEMINI_TRANSPORTS[tid];
      if (!tr) continue;
      let transportRejectedKey = false;
      for (const modelName of resolvedModels) {
        for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
          if (signal?.aborted) throw new Error('Đã hủy yêu cầu Gemini API.');
          const endpoint = tr.buildGenerateUrl(modelName, cleanKey);
          try {
            const res = await fetchImpl(endpoint, {
              method: 'POST',
              headers: tr.buildHeaders(cleanKey),
              body: JSON.stringify(bodyPayload),
              signal,
            });
            if (res.status === 429 || res.status === 503) {
              lastErr = new Error(`Gemini API quá tải/giới hạn tốc độ (HTTP ${res.status} - ${modelName})`);
              if (attempt < backoffDelays.length) {
                const waitMs = backoffDelays[attempt];
                if (typeof onRetry === 'function') onRetry({ modelName, status: res.status, waitMs, attempt: attempt + 1 });
                await sleepMs(waitMs);
                continue;
              }
              break; // Thử sang model dự phòng tiếp theo
            }
            if (!res.ok) {
              const errTxt = await res.text().catch(() => '');
              lastErr = new Error(`Gemini API lỗi HTTP ${res.status} (${modelName}): ${errTxt.slice(0, 180)}`);
              if (res.status === 400 || res.status === 401 || res.status === 403) {
                transportRejectedKey = true;
                break; // Thử transport khác (VD: AQ. từ AI Studio -> Vertex Express)
              }
              break;
            }
            const json = await res.json();
            const candParts = json?.candidates?.[0]?.content?.parts || [];
            const textOut = candParts.map((p) => p?.text || '').join('').trim();
            if (!textOut) {
              const blockReason = json?.promptFeedback?.blockReason || json?.candidates?.[0]?.finishReason || 'EMPTY';
              throw new Error(`Gemini trả về rỗng (${blockReason}).`);
            }
            saveVerifiedTransport(cleanKey, tid);
            return textOut;
          } catch (err) {
            if (signal?.aborted) throw err;
            lastErr = err;
            break;
          }
        }
        if (transportRejectedKey) break;
      }
    }
    throw lastErr || new Error('Không thể nhận phản hồi từ Gemini API.');
  }

  async function callGeminiText(promptText, opts = {}) {
    return callGeminiGenerateContent({
      ...opts,
      parts: [{ text: String(promptText || '') }],
    });
  }

  function isGfmSepRow(line) {
    const s = String(line || '').trim();
    if (!s.includes('|') || !s.includes('-')) return false;
    const clean = s.replace(/^\|/, '').replace(/\|$/, '');
    const cols = clean.split('|').map((c) => c.trim());
    return cols.length >= 2 && cols.every((c) => /^:?-{2,}:?$/.test(c));
  }

  /**
   * Ghép liền 2 bảng GFM bị cắt qua trang / batch khi có marker <!-- CONTINUE_TABLE -->.
   * Tự động bỏ hàng header & dòng gạch phân tách bị lặp lại ở phần nối tiếp.
   */
  function stitchContinueTables(markdownText) {
    const norm = String(markdownText || '').replace(/\r\n?/g, '\n');
    const lines = norm.split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const trimmed = lines[i].trim();
      if (/^<!--\s*CONTINUE_TABLE\s*-->$/i.test(trimmed)) {
        // Kiểm tra xem ngay phía trước trong `out` có kết thúc bằng dòng bảng GFM không
        let backIdx = out.length - 1;
        while (backIdx >= 0 && !out[backIdx].trim()) backIdx -= 1;
        const prevIsTable = backIdx >= 0 && out[backIdx].trim().includes('|');

        // Bỏ các dòng trắng sau CONTINUE_TABLE
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++;

        if (prevIsTable && j < lines.length && lines[j].trim().includes('|')) {
          out.length = backIdx + 1; // Xóa dòng trống giữa 2 phần bảng
          // Nếu ngay sau CONTINUE_TABLE là header + `| --- |` lặp lại -> bỏ 2 dòng đầu đó
          if (j + 1 < lines.length && isGfmSepRow(lines[j + 1])) {
            j += 2;
          } else if (isGfmSepRow(lines[j])) {
            j += 1;
          }
          i = j;
          continue;
        }
        i++;
        continue;
      }
      out.push(lines[i]);
      i++;
    }
    return out.join('\n').trim();
  }

  async function renderPdfPageBatchToJpegBase64(pdfDoc, pageNumbers, scale = 1.8) {
    const images = [];
    for (const pno of pageNumbers) {
      const page = await pdfDoc.getPage(pno);
      const vp = page.getViewport({ scale });
      const cv = document.createElement('canvas');
      cv.width = Math.round(vp.width);
      cv.height = Math.round(vp.height);
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const durl = cv.toDataURL('image/jpeg', 0.84);
      images.push({
        pageNo: pno,
        base64: durl.split(',')[1] || '',
        mimeType: 'image/jpeg',
      });
    }
    return images;
  }

  function uint8ToBase64(u8) {
    const bytes = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8 || []);
    let bin = '';
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(bytes.length, i + step)));
    }
    return typeof btoa === 'function' ? btoa(bin) : Buffer.from(bytes).toString('base64');
  }

  /**
   * ĐỌC TÀI LIỆU SIÊU TỐC BẰNG GEMINI 2.5 FLASH NATIVE PDF (nhanh gấp 6–10× so với render ảnh 2 trang/lượt!).
   * - Gửi thẳng byte PDF gốc (`inlineData: application/pdf`) trong 1 lượt (<= 18 MB & <= 25 trang)
   *   hoặc cắt lô 10 trang PDF gốc bằng pdf-lib (chạy song song 2 lô).
   * - Chỉ fallback sang ảnh JPEG từng trang nếu native PDF thất bại.
   */
  async function runGeminiNativeFastRead(fileObj, opts = {}) {
    const {
      ensurePdfJs,
      ensurePdfLib,
      apiKey = getApiKey(),
      onProgress = () => {},
      signal = null,
      maxPages = 40,
    } = opts;

    if (!apiKey) throw new Error('Chưa có Gemini API Key để chạy Gemini Flash.');
    const rawBytes = fileObj?.bytes instanceof Uint8Array ? fileObj.bytes : new Uint8Array(fileObj?.bytes || []);
    const isPdf = /\.pdf$/i.test(fileObj?.name || '') || (rawBytes[0] === 0x25 && rawBytes[1] === 0x50);
    const mdChunks = [];

    if (isPdf && rawBytes.byteLength > 0 && rawBytes.byteLength <= 18 * 1024 * 1024) {
      let pageCount = fileObj?.pageCount || 1;
      if (typeof ensurePdfLib === 'function') {
        try {
          const { PDFDocument } = await ensurePdfLib();
          const srcDoc = await PDFDocument.load(rawBytes.slice(0), { ignoreEncryption: true });
          pageCount = srcDoc.getPageCount();
          if (pageCount <= 22) {
            onProgress(22, `⚡ Đang gửi trực tiếp file PDF gốc (${pageCount} trang) tới Gemini Flash trong 1 lượt...`);
            const b64 = uint8ToBase64(rawBytes);
            const mdOut = await callGeminiGenerateContent({
              parts: [
                {
                  text: `${PROMPT_CHINH_TIEU_DE_CHUAN}\n\nHãy trích xuất ĐẦY ĐỦ 100% nội dung tài liệu PDF "${fileObj.name || 'document.pdf'}" (${pageCount} trang) sang Markdown chuẩn (giữ trọn vẹn bảng biểu, công thức LaTeX, chú thích nguồn, không tóm tắt).`,
                },
                { inlineData: { mimeType: 'application/pdf', data: b64 } },
              ],
              apiKey,
              temperature: 0.15,
              maxOutputTokens: 32768,
              signal,
            });
            mdChunks.push(mdOut);
          } else {
            // Cắt lô 10 trang PDF gốc và chạy song song 2 lô/lần (giảm 15 lượt xuống còn 2-3 lượt siêu tốc!)
            const limitP = Math.min(pageCount, maxPages);
            const ranges = [];
            for (let s = 0; s < limitP; s += 10) {
              ranges.push([s, Math.min(limitP - 1, s + 9)]);
            }
            for (let i = 0; i < ranges.length; i += 2) {
              const pair = ranges.slice(i, i + 2);
              const pct = Math.min(88, Math.round(((i + 0.5) / ranges.length) * 80) + 10);
              onProgress(pct, `⚡ Gemini Flash đang đọc song song PDF gốc trang ${pair[0][0] + 1}–${pair[pair.length - 1][1] + 1} / ${limitP}...`);
              const pairOut = await Promise.all(
                pair.map(async ([s, e]) => {
                  const sub = await PDFDocument.create();
                  const copied = await sub.copyPages(srcDoc, Array.from({ length: e - s + 1 }, (_, k) => s + k));
                  copied.forEach((pg) => sub.addPage(pg));
                  const subBytes = await sub.save();
                  return callGeminiGenerateContent({
                    parts: [
                      {
                        text: `${PROMPT_CHINH_TIEU_DE_CHUAN}\n\nĐây là trang ${s + 1}–${e + 1}/${limitP} của "${fileObj.name}". Trích xuất ĐẦY ĐỦ 100% sang Markdown chuẩn, chèn \`<!-- CONTINUE_TABLE -->\` nếu bảng vắt trang.`,
                      },
                      { inlineData: { mimeType: 'application/pdf', data: uint8ToBase64(subBytes) } },
                    ],
                    apiKey,
                    temperature: 0.15,
                    maxOutputTokens: 16384,
                    signal,
                  });
                })
              );
              mdChunks.push(...pairOut);
            }
          }
        } catch (_eNativeChunk) {
          mdChunks.length = 0;
        }
      } else {
        try {
          onProgress(28, `⚡ Đang gửi trực tiếp file PDF gốc tới Gemini Flash (1 lượt siêu tốc)...`);
          const mdOut = await callGeminiGenerateContent({
            parts: [
              {
                text: `${PROMPT_CHINH_TIEU_DE_CHUAN}\n\nHãy trích xuất ĐẦY ĐỦ 100% nội dung tài liệu PDF "${fileObj.name || 'document.pdf'}" sang Markdown chuẩn.`,
              },
              { inlineData: { mimeType: 'application/pdf', data: uint8ToBase64(rawBytes) } },
            ],
            apiKey,
            temperature: 0.15,
            maxOutputTokens: 32768,
            signal,
          });
          mdChunks.push(mdOut);
        } catch (_eDirectPdf) {
          mdChunks.length = 0;
        }
      }
    }

    // Fallback sang batch ảnh (4 trang/lượt, scale 1.45) CHỈ KHI file quá 18MB hoặc Native PDF bị từ chối
    if (!mdChunks.length && typeof ensurePdfJs === 'function' && typeof document !== 'undefined') {
      const pdfjsLib = await ensurePdfJs();
      const bytesCopy = fileObj?.bytes?.slice ? fileObj.bytes.slice(0) : fileObj.bytes;
      const pdfDoc = await pdfjsLib.getDocument({ data: bytesCopy }).promise;
      const totalP = Math.min(pdfDoc.numPages || 1, maxPages);
      const batches = [];
      for (let p = 1; p <= totalP; p += 4) {
        batches.push(Array.from({ length: Math.min(4, totalP - p + 1) }, (_, k) => p + k));
      }
      for (let bi = 0; bi < batches.length; bi++) {
        if (signal?.aborted) throw new Error('Đã dừng đọc AI.');
        const pageNums = batches[bi];
        const pct = Math.min(90, Math.round(((bi + 0.3) / batches.length) * 85) + 5);
        onProgress(pct, `⚡ Gemini Flash đang đọc lô trang ${pageNums[0]}–${pageNums[pageNums.length - 1]} / ${totalP}...`);
        const imgs = await renderPdfPageBatchToJpegBase64(pdfDoc, pageNums, 1.45);
        const batchPrompt = [
          PROMPT_CHINH_TIEU_DE_CHUAN,
          '',
          `Đây là trang ${pageNums.join(', ')} / ${totalP} của "${fileObj.name || 'document.pdf'}". Trích xuất 100% sang Markdown chuẩn, chèn \`<!-- CONTINUE_TABLE -->\` ở bảng vắt trang.`,
        ].join('\n');
        const mdOut = await callGeminiGenerateContent({
          parts: [{ text: batchPrompt }, ...imgs.map((im) => ({ inlineData: { mimeType: im.mimeType, data: im.base64 } }))],
          apiKey,
          temperature: 0.15,
          maxOutputTokens: 16384,
          signal,
        });
        mdChunks.push(mdOut);
      }
    }

    if (!mdChunks.length) {
      throw new Error('Không thể đọc tài liệu bằng Gemini Flash. Vui lòng kiểm tra dung lượng tệp hoặc API Key.');
    }

    onProgress(94, 'Đang khâu bảng vắt trang & dựng Document AST...');
    const rawCombined = mdChunks.join('\n\n');
    const stitchedMd = stitchContinueTables(rawCombined);

    const parsers = global.NoirStructuredParsers || NS.structuredParsers;
    const astLib = global.NoirDocAst || NS.docAst;
    if (!parsers || !astLib) {
      throw new Error('Thiếu structuredParsers.js hoặc documentAst.js để phân tích kết quả AI.');
    }
    const ast = parsers.parseMarkdownToAst(stitchedMd, {
      filename: fileObj?.name || 'gemini_fast_doc.pdf',
      sourceFormat: 'gemini-flash-native',
    });
    const blocks = astLib.astToLegacyBlocks(ast);
    onProgress(100, '✅ Gemini Flash đã đọc siêu tốc xong 100% tài liệu!');
    return { markdown: stitchedMd, ast, blocks };
  }

  async function runGeminiVisionDeepRead(fileObj, opts = {}) {
    return runGeminiNativeFastRead(fileObj, opts);
  }

  function syncApiKeyAcrossModules(keyVal) {
    const clean = String(keyVal || '').trim();
    try {
      if (clean) {
        global.localStorage?.setItem(API_STORAGE_KEY, clean);
        global.localStorage?.setItem('gemini_api_key', clean);
      }
    } catch (_) { /* ignore */ }
    return clean;
  }

  async function callGeminiWithGrounding(opts = {}) {
    const {
      prompt = '',
      parts = null,
      systemInstruction = '',
      apiKey = getApiKey(),
      taskType = 'deep_analysis',
      models = null,
      temperature = 0.2,
      maxOutputTokens = 8192,
      useGoogleSearch = true,
      signal = null,
      fetchImpl = global.fetch?.bind(global),
      onRetry = null,
    } = opts;

    const cleanKey = String(apiKey || '').trim();
    if (!cleanKey) {
      throw new Error('NO_API_KEY: Chưa liên kết Gemini API Key.');
    }
    if (typeof fetchImpl !== 'function') {
      throw new Error('FETCH_UNAVAILABLE: Trình duyệt không hỗ trợ fetch.');
    }

    const finalParts = Array.isArray(parts) && parts.length ? parts : [{ text: String(prompt || '') }];
    const buildPayload = (withSearch) => {
      const p = {
        contents: [{ role: 'user', parts: finalParts }],
        generationConfig: { temperature, maxOutputTokens },
      };
      if (systemInstruction) {
        p.systemInstruction = { parts: [{ text: String(systemInstruction) }] };
      }
      if (withSearch) {
        p.tools = [{ google_search: {} }];
      }
      return p;
    };

    const modelList = Array.isArray(models) && models.length ? models : getOptimalModelsForTask(taskType);
    const transportIds = getTransportsForKey(cleanKey);
    const searchPasses = useGoogleSearch ? [true, false] : [false];
    let lastErr = null;
    for (const trySearch of searchPasses) {
      const bodyPayload = buildPayload(trySearch);
      for (const tid of transportIds) {
        const tr = GEMINI_TRANSPORTS[tid];
        if (!tr) continue;
        let transportRejectedKey = false;
        for (let mi = 0; mi < modelList.length; mi++) {
          const model = modelList[mi];
          for (let attempt = 0; attempt < 2; attempt++) {
            if (signal && signal.aborted) {
              throw new Error('ABORTED');
            }
            try {
              const url = tr.buildGenerateUrl(model, cleanKey);
              const res = await fetchImpl(url, {
                method: 'POST',
                headers: tr.buildHeaders(cleanKey),
                body: JSON.stringify(bodyPayload),
                signal,
              });
              if (!res.ok) {
                const errTxt = await res.text().catch(() => '');
                lastErr = new Error(`HTTP ${res.status} (${model}${trySearch ? '+Search' : ''}): ${errTxt.slice(0, 220)}`);
                if ((res.status === 429 || res.status === 503) && attempt === 0) {
                  if (typeof onRetry === 'function') onRetry({ model, attempt, status: res.status });
                  await new Promise((r) => setTimeout(r, 900 + Math.floor(Math.random() * 500)));
                  continue;
                }
                if (res.status === 401 || res.status === 403 || (res.status === 400 && /API_KEY_INVALID|API key not valid/i.test(errTxt))) {
                  transportRejectedKey = true;
                  break;
                }
                break;
              }
              const json = await res.json();
              const cand = json?.candidates?.[0] || {};
              const candParts = cand?.content?.parts || [];
              const text = candParts.map((p) => p?.text || '').join('').trim();
              const rawChunks = cand?.groundingMetadata?.groundingChunks || [];
              const seenUrl = new Set();
              const groundingUrls = [];
              for (const ch of rawChunks) {
                const u = String(ch?.web?.uri || '').trim();
                if (!u || seenUrl.has(u)) continue;
                seenUrl.add(u);
                groundingUrls.push({ url: u, title: String(ch?.web?.title || '').trim() });
              }
              if (!text) {
                lastErr = new Error(`EMPTY_RESPONSE (${model})`);
                break;
              }
              saveVerifiedTransport(cleanKey, tid);
              return { text, groundingUrls, model, usedGrounding: trySearch, transportId: tid, raw: json };
            } catch (err) {
              if (err?.name === 'AbortError' || signal?.aborted) throw err;
              lastErr = err;
              if (attempt === 0) {
                await new Promise((r) => setTimeout(r, 650));
                continue;
              }
            }
          }
          if (transportRejectedKey) break;
        }
      }
    }
    throw lastErr || new Error('GEMINI_GROUNDING_FAILED');
  }

  function showAiFullLoadingOverlay(initialTitle = 'AI đang xử lý tài liệu...', initialSub = 'Đang kết hợp thuật toán chuẩn hóa và Gemini AI') {
    const doc = global.document;
    if (!doc) {
      return { update() {}, close() {} };
    }
    const existing = doc.getElementById('noir-ai-full-loading-overlay');
    if (existing) existing.remove();

    const styleId = 'noir-ai-full-loading-style';
    if (!doc.getElementById(styleId)) {
      const st = doc.createElement('style');
      st.id = styleId;
      st.textContent = `
        @keyframes noirAiSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes noirAiPulseBtn { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); transform: scale(1); } 50% { box-shadow: 0 0 22px 4px rgba(16,185,129,0.75); transform: scale(1.015); } }
        .noir-ai-blink-btn { animation: noirAiPulseBtn 1.55s ease-in-out infinite; }
      `;
      doc.head?.appendChild(st);
    }

    const overlay = doc.createElement('div');
    overlay.id = 'noir-ai-full-loading-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483635;background:rgba(7,11,20,0.92);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:"Be Vietnam Pro",system-ui,-apple-system,sans-serif;';
    overlay.innerHTML = `
      <div style="max-width:520px;width:100%;background:linear-gradient(145deg,#0f172a,#111827);border:1.5px solid rgba(52,211,153,0.45);border-radius:22px;padding:24px 22px;text-align:center;color:#f8fafc;box-shadow:0 24px 60px rgba(0,0,0,0.65);">
        <div id="noir-ai-load-spinner" style="width:54px;height:54px;margin:0 auto 12px;border-radius:50%;border:4px solid rgba(52,211,153,0.2);border-top-color:#34d399;animation:noirAiSpin 0.9s linear infinite;"></div>
        <div id="noir-ai-load-title" style="font-size:17px;font-weight:700;color:#6ee7b7;margin-bottom:6px;"></div>
        <div id="noir-ai-load-sub" style="font-size:13px;font-weight:400;color:#cbd5e1;line-height:1.5;margin-bottom:12px;"></div>
        <div style="width:100%;height:8px;border-radius:999px;background:rgba(148,163,184,0.2);overflow:hidden;margin-bottom:6px;">
          <div id="noir-ai-load-bar" style="width:14%;height:100%;background:linear-gradient(90deg,#10b981,#38bdf8);transition:width 0.35s ease;"></div>
        </div>
        <div id="noir-ai-load-pct" style="font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:10px;">14%</div>
        <div id="noir-ai-load-log" style="display:none;text-align:left;max-height:155px;overflow-y:auto;background:rgba(2,6,23,0.75);border:1px solid rgba(148,163,184,0.22);border-radius:12px;padding:9px 11px;font-size:11.5px;line-height:1.55;color:#e2e8f0;margin-bottom:10px;"></div>
        <div id="noir-ai-load-actions" style="display:none;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;"></div>
      </div>
    `;
    doc.body.appendChild(overlay);
    const spinEl = overlay.querySelector('#noir-ai-load-spinner');
    const titleEl = overlay.querySelector('#noir-ai-load-title');
    const subEl = overlay.querySelector('#noir-ai-load-sub');
    const barEl = overlay.querySelector('#noir-ai-load-bar');
    const pctEl = overlay.querySelector('#noir-ai-load-pct');
    const logEl = overlay.querySelector('#noir-ai-load-log');
    const actEl = overlay.querySelector('#noir-ai-load-actions');
    if (titleEl) titleEl.textContent = String(initialTitle);
    if (subEl) subEl.textContent = String(initialSub);

    return {
      update(stepText, pct) {
        if (titleEl && stepText) titleEl.textContent = String(stepText);
        if (typeof pct === 'number' && Number.isFinite(pct)) {
          const clamped = Math.max(5, Math.min(100, Math.round(pct)));
          if (barEl) barEl.style.width = `${clamped}%`;
          if (pctEl) pctEl.textContent = `${clamped}%`;
        }
      },
      setSub(subText) {
        if (subEl && subText) subEl.textContent = String(subText);
      },
      addLog(lineText, tone = 'ok') {
        if (!logEl || !lineText) return;
        logEl.style.display = 'block';
        const row = doc.createElement('div');
        row.style.color = tone === 'err' ? '#fda4af' : tone === 'info' ? '#7dd3fc' : '#86efac';
        row.textContent = String(lineText);
        logEl.appendChild(row);
        logEl.scrollTop = logEl.scrollHeight;
      },
      showError(errTitle, errDetail, handlers = {}) {
        const is429 = isQuota429Error(errDetail);
        if (spinEl) spinEl.style.display = 'none';
        if (titleEl) {
          titleEl.style.color = is429 ? '#fcd34d' : '#fda4af';
          titleEl.textContent = is429
            ? '⚡ API Key tạm hết hạn mức miễn phí (HTTP 429)'
            : String(errTitle || '⚠️ AI gặp lỗi khi xử lý');
        }
        if (subEl) {
          subEl.style.color = is429 ? '#fef3c7' : '#fecdd3';
          subEl.textContent = is429
            ? 'Google giới hạn số lượt gọi API miễn phí/phút hoặc ngày. Bạn có thể chuyển ngay sang chế độ Gemini Web 0-Token (Miễn phí 100%) bằng nút nổi bật bên dưới!'
            : String(errDetail || 'Vui lòng kiểm tra lại API Key hoặc kết nối mạng.');
        }
        if (barEl) barEl.style.background = is429 ? 'linear-gradient(90deg,#f59e0b,#10b981)' : '#f43f5e';
        if (actEl) {
          actEl.style.display = 'flex';
          actEl.innerHTML = '';
          const mkBtn = (txt, bg, cb, fullWidth = false, pulse = false) => {
            const b = doc.createElement('button');
            b.type = 'button';
            b.textContent = txt;
            if (pulse) b.className = 'noir-ai-blink-btn';
            b.style.cssText = `${fullWidth ? 'width:100%;padding:12px 16px;font-size:13.5px;' : 'padding:9px 14px;font-size:12.5px;'}border-radius:12px;border:none;background:${bg};color:#fff;font-weight:700;cursor:pointer;`;
            b.addEventListener('click', cb);
            actEl.appendChild(b);
          };
          if (handlers.manualFallback && handlers.manualFallback.promptText) {
            const mf = handlers.manualFallback;
            const fileTip = mf.attachFileName
              ? ` (Kèm gửi tệp "${mf.attachFileName}")`
              : '';
            mkBtn(
              `📋 Copy Prompt thủ công & Mở Gemini ngay (0-Token)${fileTip}`,
              'linear-gradient(90deg,#10b981,#0284c7)',
              async () => {
                await copyTextToClipboard(mf.promptText);
                try {
                  if (NS.geminiSplitBridge?.launchExternalSplitWindow) {
                    NS.geminiSplitBridge.launchExternalSplitWindow('GEMINI', false);
                  } else {
                    global.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
                  }
                } catch (_eOpen) {}
                overlay.remove();
                openManualPasteResultModal(mf);
              },
              true,
              true
            );
          }
          if (typeof handlers.onRetry === 'function') {
            mkBtn('🔄 Thử lại API', '#059669', () => { overlay.remove(); handlers.onRetry(); });
          }
          mkBtn('🔑 Kiểm tra / Đổi API Key', '#0284c7', () => {
            overlay.remove();
            openApiKeyQuickModal({ onSaved: handlers.onChangeKey || handlers.onRetry });
          });
          mkBtn('Đóng', '#334155', () => overlay.remove());
        }
      },
      close() {
        try { overlay.remove(); } catch (_) { /* ignore */ }
      },
    };
  }

  function maybeShowWelcomeApiUpsellModal(contextKey = 'global', onLinkedCallback = null) {
    const doc = global.document;
    if (!doc || global.__NOIR_SKIP_API_UPSELL === true || global.__NOIR_AUTOTESTER_RUNNING__ === true || global.NoirAutoTester?.isRunning === true) return false;
    // Sync across possible storage keys before checking
    if (!hasApiKey()) {
      try {
        let alt = global.localStorage?.getItem('gemini_api_key') || '';
        if (!alt) {
          const rawVault = global.localStorage?.getItem('noir_v36_api_key_vault_v1');
          if (rawVault && rawVault.trim().startsWith('{')) {
            const parsed = JSON.parse(rawVault);
            const list = parsed?.keys || parsed?.pool || [];
            const active = list.find((k) => k && k.key && k.enabled !== false) || list[0];
            if (active?.key) alt = String(active.key).trim();
          }
        }
        if (alt && alt.trim().length > 10) setApiKey(alt.trim());
      } catch (_) { /* ignore */ }
    }
    if (hasApiKey()) return false;

    const dismissKey = `noir_welcome_api_upsell_dismissed_${String(contextKey || 'global')}`;
    try {
      if (global.sessionStorage?.getItem(dismissKey) === '1') return false;
    } catch (_) { /* ignore */ }

    const existing = doc.getElementById('noir-welcome-api-upsell-modal');
    if (existing) existing.remove();

    const modal = doc.createElement('div');
    modal.id = 'noir-welcome-api-upsell-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2147483620;background:rgba(5,9,18,0.86);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Be Vietnam Pro",system-ui,-apple-system,sans-serif;';
    modal.innerHTML = `
      <div style="max-width:480px;width:100%;background:linear-gradient(160deg,#0f172a,#1e1b4b 130%);border:1.5px solid rgba(52,211,153,0.5);border-radius:22px;padding:22px;color:#f8fafc;box-shadow:0 24px 64px rgba(0,0,0,0.65);position:relative;">
        <button type="button" id="noir-upsell-close-x" aria-label="Đóng" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(148,163,184,0.3);background:rgba(15,23,42,0.8);color:#cbd5e1;font-size:15px;font-weight:700;cursor:pointer;">✕</button>
        <div style="font-size:28px;margin-bottom:6px;">🚀</div>
        <h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#6ee7b7;line-height:1.35;">Bạn muốn nâng tối đa trải nghiệm của mình không?</h3>
        <p style="margin:0 0 14px;font-size:13px;color:#cbd5e1;line-height:1.55;">
          Hãy liên kết API miễn phí ở ngay dưới đây để mở khóa AI 1 chạm tự động chuẩn hóa tài liệu, đọc bảng biểu chính xác, quét mục lục thông minh và xuất báo cáo PDF hoàn chỉnh!
        </p>
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:10px 14px;margin-bottom:12px;border-radius:12px;background:rgba(56,189,248,0.16);border:1px solid rgba(56,189,248,0.5);color:#7dd3fc;font-size:13px;font-weight:700;text-decoration:none;box-sizing:border-box;">
          🔗 Lấy Gemini API Key miễn phí (Google AI Studio — 1 chạm)
        </a>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
          <input id="noir-upsell-api-input" type="password" autocomplete="off" placeholder="Dán mã API Key (AIzaSy... hoặc AQ...) vào đây" style="flex:1;padding:11px 13px;border-radius:12px;border:1px solid rgba(148,163,184,0.35);background:#090d16;color:#f8fafc;font-size:13px;box-sizing:border-box;font-family:ui-monospace,Consolas,monospace;" />
          <button type="button" id="noir-upsell-toggle-vis" title="Hiện / Ẩn API Key" aria-label="Hiện hoặc ẩn API Key" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,0.35);background:#1e293b;color:#f8fafc;font-size:14px;font-weight:700;cursor:pointer;flex-shrink:0;">👁️</button>
        </div>
        <div id="noir-upsell-err" style="display:none;font-size:12px;color:#fda4af;margin-bottom:8px;"></div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button type="button" id="noir-upsell-save-btn" style="width:100%;padding:11px 14px;border-radius:12px;border:none;background:linear-gradient(90deg,#10b981,#059669);color:#ffffff;font-size:13.5px;font-weight:700;cursor:pointer;">
            ✅ Lưu & Kích hoạt AI ngay
          </button>
          <button type="button" id="noir-upsell-later-btn" style="width:100%;padding:9px 14px;border-radius:12px;border:1px solid rgba(148,163,184,0.28);background:rgba(30,41,59,0.65);color:#cbd5e1;font-size:12.5px;font-weight:600;cursor:pointer;">
            Để sau (Tiếp tục không cần AI)
          </button>
        </div>
      </div>
    `;
    doc.body.appendChild(modal);

    const dismiss = () => {
      try { global.sessionStorage?.setItem(dismissKey, '1'); } catch (_) { /* ignore */ }
      modal.remove();
    };
    modal.querySelector('#noir-upsell-close-x')?.addEventListener('click', dismiss);
    modal.querySelector('#noir-upsell-later-btn')?.addEventListener('click', dismiss);
    modal.querySelector('#noir-upsell-toggle-vis')?.addEventListener('click', () => {
      const inp = modal.querySelector('#noir-upsell-api-input');
      const eyeBtn = modal.querySelector('#noir-upsell-toggle-vis');
      if (!inp) return;
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      if (eyeBtn) eyeBtn.textContent = show ? '🙈' : '👁️';
    });
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) dismiss();
    });
    modal.querySelector('#noir-upsell-save-btn')?.addEventListener('click', async () => {
      const inp = modal.querySelector('#noir-upsell-api-input');
      const errEl = modal.querySelector('#noir-upsell-err');
      const saveBtn = modal.querySelector('#noir-upsell-save-btn');
      const val = String(inp?.value || '').trim();
      if (errEl) {
        errEl.style.color = '#7dd3fc';
        errEl.textContent = '⏳ Đang xác minh API Key thật với Google Gemini...';
        errEl.style.display = 'block';
      }
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Đang xác minh...'; }
      try {
        const chk = await verifyApiKeyLive(val);
        if (!chk.ok) {
          if (errEl) {
            errEl.style.color = '#fda4af';
            errEl.textContent = `❌ ${chk.message}`;
            errEl.style.display = 'block';
          }
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '✅ Lưu & Kích hoạt AI ngay'; }
          inp?.focus();
          return;
        }
        setApiKey(val, { verified: true, modelEndpoint: chk.modelEndpoint });
        syncApiKeyAcrossModules(val);
        try { global.sessionStorage?.setItem(dismissKey, '1'); } catch (_) { /* ignore */ }
        modal.remove();
        NS.utils?.showToast?.(`✅ ${chk.message} Đã lưu vĩnh viễn vào máy!`, 'success', 3800);
        try {
          global.dispatchEvent(new CustomEvent('noir-api-key-changed', { detail: { hasKey: true, verified: true, source: contextKey } }));
        } catch (_) { /* ignore */ }
        if (typeof onLinkedCallback === 'function') onLinkedCallback(val);
      } catch (err) {
        if (errEl) {
          errEl.style.color = '#fda4af';
          errEl.textContent = `❌ Lỗi xác minh: ${err?.message || err}`;
          errEl.style.display = 'block';
        }
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '✅ Lưu & Kích hoạt AI ngay'; }
      }
    });
    return true;
  }

  function extractJsonArrayFromText(raw) {
    const str = String(raw || '').trim();
    if (!str) return null;
    const fenced = str.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : str;
    const firstBracket = candidate.indexOf('[');
    const lastBracket = candidate.lastIndexOf(']');
    if (firstBracket === -1 || lastBracket <= firstBracket) return null;
    try {
      const parsed = JSON.parse(candidate.slice(firstBracket, lastBracket + 1));
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  async function runAiFormatDocumentToAst(rawBlocks, opts = {}) {
    const {
      apiKey = getApiKey(),
      onProgress = null,
      fileName = 'Tai_lieu',
    } = opts;
    const cleanKey = String(apiKey || '').trim();
    if (!cleanKey) {
      throw new Error('NO_API_KEY');
    }
    const sourceBlocks = Array.isArray(rawBlocks) ? rawBlocks : [];
    const textEntries = [];
    for (let i = 0; i < sourceBlocks.length; i++) {
      const b = sourceBlocks[i];
      if (!b) continue;
      if (b.type === 'table' && Array.isArray(b.rows)) {
        textEntries.push({ idx: i, isTable: true, block: b });
      } else {
        const txt = String(b.text || '').trim();
        if (txt) textEntries.push({ idx: i, isTable: false, text: txt, block: b });
      }
    }

    const CHUNK_SIZE = 70;
    const resultBlocks = [];
    const textOnly = textEntries.filter((e) => !e.isTable);
    const roleMap = new Map();

    const totalBatches = Math.max(1, Math.ceil(textOnly.length / CHUNK_SIZE));
    for (let bi = 0; bi < totalBatches; bi++) {
      const slice = textOnly.slice(bi * CHUNK_SIZE, (bi + 1) * CHUNK_SIZE);
      if (!slice.length) continue;
      if (typeof onProgress === 'function') {
        onProgress(25 + Math.round(((bi + 0.5) / totalBatches) * 55), `AI đang phân tích & chuẩn hóa cấu trúc (Đợt ${bi + 1}/${totalBatches})...`);
      }
      const promptLines = slice.map((item) => `[${item.idx}] ${item.text.slice(0, 600)}`).join('\n');
      const sysPrompt =
        'Bạn là bộ chuẩn hóa cấu trúc tài liệu tiếng Việt & đa ngôn ngữ chuyên nghiệp.\n' +
        'Hãy phân loại từng dòng [idx] thành JSON array KHÔNG THÊM CHỮ NGOÀI JSON.\n' +
        'Schema mỗi phần tử: {"idx": number, "role": "h1"|"h2"|"h3"|"p"|"bullet"|"caption"|"quote", "text": "nội dung đã sửa lỗi dính chữ/tách dấu nếu có, giữ nguyên 100% số liệu & trích dẫn"}.\n' +
        'Quy tắc heading: CHƯƠNG/PHẦN -> h1; I., II., 1., 2., 1.1 -> h2; 1.1.1, a), b) -> h3; Dòng bảng biểu/chú thích Hình/Bảng -> caption; Không biến dòng mục lục có dấu chấm .....55 thành heading.';
      const userPrompt = `Tệp: ${fileName}\nDanh sách đoạn văn:\n${promptLines}\n\nTrả về JSON array chuẩn:`;
      try {
        const rawOut = await callGeminiGenerateContent({
          parts: [{ text: userPrompt }],
          systemInstruction: sysPrompt,
          apiKey: cleanKey,
          temperature: 0.1,
          maxOutputTokens: 8192,
        });
        const arr = extractJsonArrayFromText(rawOut);
        if (arr) {
          for (const obj of arr) {
            const idNum = Number(obj?.idx);
            if (Number.isFinite(idNum) && obj?.text) {
              roleMap.set(idNum, {
                type: ['h1', 'h2', 'h3', 'p', 'bullet', 'caption', 'quote'].includes(obj.role) ? obj.role : 'p',
                text: String(obj.text).trim(),
              });
            }
          }
        }
      } catch (_) {
        // Fallback gracefully to original blocks for this chunk
      }
    }

    for (let i = 0; i < sourceBlocks.length; i++) {
      const orig = sourceBlocks[i];
      if (!orig) continue;
      if (orig.type === 'table') {
        resultBlocks.push(orig);
        continue;
      }
      const aiHit = roleMap.get(i);
      if (aiHit && aiHit.text) {
        resultBlocks.push({ ...orig, type: aiHit.type, text: aiHit.text, aiFormatted: true });
      } else {
        resultBlocks.push(orig);
      }
    }
    return resultBlocks;
  }

  async function runAiAndCodeAutoToc(blocks, opts = {}) {
    const {
      apiKey = getApiKey(),
      codeTocBuilder = null,
      maxPage = 999,
    } = opts;
    const srcBlocks = Array.isArray(blocks) ? blocks : [];
    const codeLines = typeof codeTocBuilder === 'function' ? (codeTocBuilder(srcBlocks) || []) : [];

    const cleanKey = String(apiKey || '').trim();
    if (!cleanKey) {
      return codeLines;
    }

    // Collect concise heading-like candidates for Gemini verification + restoration of broken titles
    const candidateLines = [];
    for (let i = 0; i < srcBlocks.length && candidateLines.length < 180; i++) {
      const b = srcBlocks[i];
      const txt = String(b?.text || '').replace(/\s+/g, ' ').trim();
      if (!txt || txt.length < 2 || txt.length > 150) continue;
      if (/\.{3,}\s*\d{1,4}\s*$/.test(txt)) continue; // Hard code guard against dotted TOC rows
      const looksHeading =
        b?.type === 'h1' ||
        b?.type === 'h2' ||
        b?.type === 'h3' ||
        /^(CHƯƠNG|PHẦN|MỤC|CHAPTER|PART|SECTION|[IVX]+\.|[0-9]+(?:\.[0-9]+){0,3}[\.)]?)\s+/i.test(txt) ||
        (b?.bold && txt.length <= 90);
      if (looksHeading) {
        candidateLines.push(`[P${b?.page || 1}] ${txt}`);
      }
    }
    if (!candidateLines.length && !codeLines.length) return [];

    try {
      const prompt =
        'Bạn là bộ trích xuất Mục Lục (Table of Contents) kết hợp Code + AI.\n' +
        'Dưới đây là kết quả sơ bộ của Code và các ứng viên tiêu đề kèm số trang [P<n>]:\n' +
        '--- KẾT QUẢ CODE ---\n' + codeLines.slice(0, 80).join('\n') + '\n' +
        '--- ỨNG VIÊN TRONG VĂN BẢN ---\n' + candidateLines.join('\n') + '\n\n' +
        'Nhiệm vụ:\n' +
        '1. Chỉ giữ lại ĐÚNG các đề mục chương/mục thật sự (Chương, Phần, I, II, 1., 1.1, 1.1.1...).\n' +
        '2. LOẠI BỎ dòng rác (tiêu đề bảng "Bảng 1...", "Hình 2...", dòng mục lục có dấu chấm .....55, đoạn văn thường).\n' +
        '3. Sửa tiêu đề bị ngắt dòng nếu cần và trả về JSON array duy nhất: [{"title": "Tên mục", "page": 1}]. Không viết giải thích.';
      const rawOut = await callGeminiGenerateContent({
        parts: [{ text: prompt }],
        apiKey: cleanKey,
        temperature: 0.1,
        maxOutputTokens: 4096,
      });
      const arr = extractJsonArrayFromText(rawOut);
      if (arr && arr.length) {
        const finalOut = [];
        const seen = new Set();
        for (const item of arr) {
          const title = String(item?.title || '').replace(/\s+/g, ' ').trim();
          const pg = parseInt(item?.page, 10);
          if (!title || /\.{3,}\s*\d{1,4}\s*$/.test(title)) continue;
          if (!Number.isFinite(pg) || pg < 1 || pg > Math.max(1, maxPage)) continue;
          const sig = `${title.toLowerCase()}|${pg}`;
          if (seen.has(sig)) continue;
          seen.add(sig);
          finalOut.push(`${title} | ${pg}`);
        }
        if (finalOut.length) return finalOut;
      }
    } catch (_) {
      // Fallback safely to strict codeLines
    }
    return codeLines;
  }

  /**
   * BỘ KHUNG PROMPT CHI TIẾT THEO TỪNG TÁC VỤ (để Gemini Web hiểu chuẩn 100% định dạng code của trang web)
   */
  function buildTaskManualPrompt(taskId, ctx = {}) {
    const fileName = ctx.fileName || 'Tai_lieu';
    const rawText = String(ctx.text || '').trim();
    switch (taskId) {
      case 'theme10_beautify':
        return [
          PROMPT_CHINH_TIEU_DE_CHUAN,
          '',
          `TỆP ĐÍNH KÈM: "${fileName}".`,
          'HƯỚNG DẪN ĐẶC BIỆT CHO TRÌNH PHỐI MÀU 10 THEME (ĐĂNGLOVEPDF):',
          '- Hãy đọc ĐẦY ĐỦ 100% nội dung từ tệp tôi đính kèm (từ trang đầu đến trang cuối, kể cả bảng biểu, công thức & tài liệu tham khảo).',
          '- Trả kết quả bằng Markdown chuẩn (#, ##, ###, ####, bảng GFM có `<!-- CONTINUE_TABLE -->` nếu bảng vắt trang, LaTeX `$...$` / `$$...$$`, giữ nguyên tiền tệ `$28.40` không bọc LaTeX).',
          '- Không thêm lời chào mở đầu hay lời kết; chỉ xuất đúng nội dung Markdown hoàn chỉnh để tôi dán trực tiếp về trang web xuất PDF đẹp!',
          rawText ? `\n--- VĂN BẢN THAM CHIẾU ĐÃ TRÍCH ---\n${rawText.slice(0, 12000)}` : '',
        ].filter(Boolean).join('\n');

      case 'auto_toc':
        return [
          'Bạn là bộ tạo Mục Lục tự động (Auto TOC) của hệ thống ĐăngLovePDF.',
          `Tệp: "${fileName}".`,
          'YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (để code trang web nhận diện tức thì):',
          '- Mỗi dòng là đúng 1 đề mục theo cấu trúc: `Tên mục | Số trang` (ví dụ: `CHƯƠNG 1. MỞ ĐẦU | 3`).',
          '- Giữ đúng phân cấp Chương, Phần, I., II., 1., 1.1., 1.1.1.',
          '- TUYỆT ĐỐI LOẠI BỎ các dòng mục lục cũ có dấu chấm kéo dài (như `KHẢO........55`), tên Bảng/Hình và đoạn văn thường.',
          '- Không giải thích thêm, chỉ xuất danh sách `Tên mục | Số trang`.',
          rawText ? `\n--- CÁC ỨNG VIÊN TIÊU ĐỀ TRONG TỆP ---\n${rawText.slice(0, 12000)}` : '',
        ].filter(Boolean).join('\n');

      case 'icr_handwriting': {
        const modeDesc = {
          handwriting_general: 'Đọc chính xác 100% chữ viết tay tiếng Việt & Anh, giữ đúng đề mục, gạch đầu dòng, ngày tháng.',
          table_survey_checkbox: 'Đọc toàn bộ phiếu khảo sát/bảng viết tay, đánh dấu ô đã tick là `[☑]` và ô chưa tick là `[☐]`. Kẻ mọi bảng bằng Markdown GFM `| Cột 1 | Cột 2 |`.',
          medical_rx_form: 'Đọc kỹ đơn thuốc, tên thuốc, liều lượng, ghi chú bác sĩ hoặc hóa đơn viết tay. Chữ quá mờ đánh dấu `[cần đối chiếu]`.',
          math_notes_latex: 'Chuyển toàn bộ công thức Toán/Tài chính viết tay sang LaTeX `$...$` và `$$...$$` kèm lời giải chữ viết tay.',
        };
        return [
          'Bạn là chuyên gia ICR (Intelligent Character Recognition) đọc chữ viết tay của hệ thống ĐăngLovePDF.',
          `Tệp viết tay tôi đính kèm: "${fileName}".`,
          `CHẾ ĐỘ: ${modeDesc[ctx.icrMode] || modeDesc.handwriting_general}`,
          'QUY TẮC: Không tóm tắt, không bỏ sót bất kỳ chữ nào. Chỉ trả về văn bản/bảng đã số hóa sạch để trang web đóng gói thẳng sang Word/Excel/PDF.',
        ].join('\n');
      }

      case 'ocr_fast':
        return [
          'Bạn là động cơ OCR siêu chính xác của ĐăngLovePDF.',
          `Hãy đọc toàn bộ tệp PDF/Ảnh scan tôi đính kèm ("${fileName}") và trích xuất CHÍNH XÁC 100% toàn bộ văn bản (tiếng Việt đầy đủ dấu, giữ nguyên phân đoạn, tiêu đề, bảng biểu GFM và số liệu).`,
          'Không thêm lời bình mở đầu/kết thúc; chỉ trả nội dung đã nhận diện để tôi dán về trang web xuất file ngay.',
        ].join('\n');

      case 'pdf_to_docx':
        return [
          'Bạn là bộ chuyển đổi PDF → Word/Markdown chuẩn hóa của ĐăngLovePDF.',
          `Hãy đọc tệp "${fileName}" tôi đính kèm (hoặc văn bản bên dưới), nối liền các dòng bị ngắt sai, sửa lỗi tách dấu/dính chữ tiếng Việt, giữ chuẩn đề mục # / ## / ### và bảng GFM.`,
          'Tuyệt đối KHÔNG tóm tắt hay làm mất số liệu. Chỉ xuất nội dung hoàn chỉnh.',
          rawText ? `\n--- VĂN BẢN THÔ TỪ PDF ---\n${rawText.slice(0, 12000)}` : '',
        ].filter(Boolean).join('\n');

      case 'pdf_to_excel':
        return [
          'Bạn là bộ bóc bảng PDF → Excel của ĐăngLovePDF.',
          `Hãy đọc tất cả bảng dữ liệu trong tệp "${fileName}" tôi đính kèm (hoặc dữ liệu bên dưới).`,
          'QUY TẮC QUAN TRỌNG: Gộp gọn các ô bị xuống dòng lẻ thành 1 ô duy nhất cùng hàng; giữ nguyên 100% số liệu.',
          'ĐỊNH DẠNG TRẢ VỀ: Bảng Markdown GFM `| Cột 1 | Cột 2 | ... |` HOẶC mảng JSON 2D `[["Cột 1","Cột 2"],...]`. Không giải thích thêm.',
          rawText ? `\n--- DỮ LIỆU THÔ QUÉT TỪ PDF ---\n${rawText.slice(0, 12000)}` : '',
        ].filter(Boolean).join('\n');

      case 'redact_pii':
        return [
          'Bạn là trợ lý Che Đen Bảo Mật (True Redaction PII) của ĐăngLovePDF.',
          'Hãy liệt kê CHÍNH XÁC các chuỗi thông tin cá nhân nhạy cảm (SĐT, CCCD/CMND, Email, Số tài khoản, Địa chỉ nhà riêng, Tên/Lương bí mật) có trong văn bản dưới đây.',
          'ĐỊNH DẠNG BẮT BUỘC: 1 dòng duy nhất, các chuỗi ngăn cách bởi dấu phẩy `, ` (VD: `0912345678, 079099001234, an@gmail.com`). Không giải thích thêm.',
          `\n--- VĂN BẢN PDF ---\n${rawText.slice(0, 12000)}`,
        ].join('\n');

      case 'metadata_seo':
        return [
          'Bạn là trợ lý tạo Siêu dữ liệu PDF (Metadata) của ĐăngLovePDF.',
          'Từ nội dung trang đầu tài liệu dưới đây, hãy trả về ĐÚNG 1 đối tượng JSON duy nhất:',
          '{"title": "Tiêu đề chuẩn gọn", "author": "Tác giả hoặc Tổ chức", "keywords": "từ khóa 1, từ khóa 2, từ khóa 3"}',
          `\n--- NỘI DUNG TRANG ĐẦU ---\n${rawText.slice(0, 10000)}`,
        ].join('\n');

      case 'split_keyword':
        return [
          'Bạn là trợ lý Tách PDF thông minh theo từ khóa của ĐăngLovePDF.',
          'Hãy tìm 1 cụm từ khóa tiêu đề ngắn xuất hiện lặp lại ở đầu mỗi hồ sơ/hóa đơn/chương trong văn bản sau để hệ thống tự động tách tệp.',
          'Chỉ trả về ĐÚNG cụm từ khóa đó trên 1 dòng duy nhất, không dấu ngoặc kép, không giải thích.',
          `\n--- VĂN BẢN PDF ---\n${rawText.slice(0, 10000)}`,
        ].join('\n');

      case 'form_fill':
        return [
          'Bạn là trợ lý Điền Biểu Mẫu AcroForm của ĐăngLovePDF.',
          'Hãy chuyển đoạn ghi chú thông tin cá nhân sau thành danh sách các dòng chuẩn `TenTruong=GiaTri` (TenTruong viết liền không dấu, mỗi dòng 1 mục, không giải thích):',
          `\n--- GHI CHÚ ---\n${rawText.slice(0, 8000)}`,
        ].join('\n');

      case 'compare_diff':
        return [
          'Bạn là chuyên gia đối chiếu hợp đồng & tài liệu của ĐăngLovePDF.',
          'Hãy tóm tắt ngắn gọn thành gạch đầu dòng các điểm thay đổi QUAN TRỌNG NHẤT (số liệu, giá tiền, điều khoản pháp lý, thời hạn, tên riêng) giữa Bản cũ (#1) và Bản mới (#2):',
          `\n--- DANH SÁCH THAY ĐỔI ---\n${rawText.slice(0, 12000)}`,
        ].join('\n');

      case 'viewer_summary':
        return [
          `Bạn là trợ lý đọc hiểu PDF của ĐăngLovePDF. Hãy tóm tắt cô đọng, dễ hiểu tài liệu "${fileName}" theo đúng 3 mục:`,
          '1. Tổng quan nhanh (2 câu)',
          '2. 5 điểm / số liệu cốt lõi nhất',
          '3. Kết luận & Hành động gợi ý',
          rawText ? `\n--- NỘI DUNG TÀI LIỆU ---\n${rawText.slice(0, 14000)}` : '',
        ].filter(Boolean).join('\n');

      case 'editor_polish':
        return [
          'Bạn là trợ lý sửa chính tả trực tiếp trên PDF Editor của ĐăngLovePDF.',
          'Sửa lỗi dính chữ/tách dấu/chính tả cho từng dòng có chỉ số `[i]`. CHỈ trả về JSON array `[{"i": 0, "t": "chuỗi đã sửa"}]` cho các dòng cần sửa:',
          `\n${rawText.slice(0, 12000)}`,
        ].join('\n');

      case 'editor_translate':
        return [
          `Bạn là trợ lý dịch thuật PDF Editor của ĐăngLovePDF. Hãy dịch tự nhiên, gọn gàng từng dòng \`[i]\` sang ${ctx.targetLang || 'English'} sao cho vừa khung trang PDF.`,
          'CHỈ trả về JSON array `[{"i": 0, "t": "bản dịch"}]`:',
          `\n${rawText.slice(0, 12000)}`,
        ].join('\n');

      case 'editor_redact':
        return [
          'Bạn là trợ lý Che Đen PII trên PDF Editor của ĐăngLovePDF.',
          'Tìm chỉ số các dòng `[i]` chứa thông tin nhạy cảm (SĐT, CCCD, Email, STK, Địa chỉ nhà, Lương bí mật). CHỈ trả về JSON array các chỉ số, VD `[2, 5]`:',
          `\n${rawText.slice(0, 12000)}`,
        ].join('\n');

      case 'editor_summary':
        return [
          'Tóm tắt trang tài liệu sau thành TỐI ĐA 3 dòng ngắn (mỗi dòng <= 48 ký tự, bắt đầu bằng `• `) để dán Sticky Note lên góc trang PDF:',
          `\n${rawText.slice(0, 8000)}`,
        ].join('\n');

      case 'editor_table':
        return [
          'Trích xuất toàn bộ bảng biểu từ các mảnh chữ có tọa độ `[x=...,y=...]` sau thành JSON array 2D `[["Cột 1","Cột 2"],...]`. Gộp các ô bị xuống dòng về cùng hàng:',
          `\n${rawText.slice(0, 12000)}`,
        ].join('\n');

      case 'editor_ocr':
        return [
          `Tôi đính kèm ảnh/trang scan của tệp "${fileName}". Hãy đọc toàn bộ dòng chữ từ trên xuống dưới và trả về JSON array duy nhất:`,
          '[{"yPct": 5, "xPct": 10, "wPct": 70, "text": "nội dung dòng"}] (tọa độ ước lượng theo % từ 0 đến 100).',
        ].join('\n');

      default:
        return rawText || PROMPT_CHINH_TIEU_DE_CHUAN;
    }
  }

  /**
   * MÀN HÌNH DÁN KẾT QUẢ THỦ CÔNG CHUYÊN BIỆT (Tự động chuyển tới ngay khi người dùng bấm "Copy Prompt thủ công & Mở Gemini")
   * Hỗ trợ đầy đủ: Mod 49, Mod 50 & mọi công cụ ĐăngLovePDF!
   */
  function openManualPasteResultModal(opts = {}) {
    const doc = global.document;
    if (!doc) return null;
    doc.getElementById('noir-manual-paste-result-modal')?.remove();

    const {
      taskTitle = 'Dùng AI Thủ công (0-Token · Không cần API Key)',
      promptText = '',
      attachFileName = '',
      attachFileBlob = null,
      alreadyCopied = true,
      pastePlaceholder = 'PC: nhấn Ctrl + V | Mobile: CHẠM GIỮ 1–2 giây vào khung này rồi bấm "Dán"...',
      applyBtnLabel = '✅ Áp dụng kết quả & Hoàn tất ngay',
      onApplyPasted = null,
    } = opts;

    const modal = doc.createElement('div');
    modal.id = 'noir-manual-paste-result-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2147483642;background:rgba(5,9,18,0.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:14px;font-family:"Be Vietnam Pro",system-ui,-apple-system,sans-serif;';
    modal.innerHTML = `
      <div style="max-width:680px;width:100%;max-height:92dvh;display:flex;flex-direction:column;background:linear-gradient(155deg,#0f172a,#111827);border:1.5px solid rgba(52,211,153,0.55);border-radius:22px;color:#f8fafc;box-shadow:0 26px 70px rgba(0,0,0,0.75);overflow:hidden;">
        <div style="padding:14px 18px;background:#090d16;border-bottom:1px solid rgba(148,163,184,0.2);display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="font-size:15px;font-weight:700;color:#6ee7b7;">📋 ${String(taskTitle).replace(/</g, '&lt;')}</div>
          <button type="button" id="noir-mp-close" style="padding:5px 10px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#f8fafc;font-size:12px;font-weight:700;cursor:pointer;">✕ Đóng</button>
        </div>

        <div style="padding:16px 18px;overflow-y:auto;display:flex;flex-direction:column;gap:11px;font-size:12.5px;">
          ${alreadyCopied ? `
            <div style="padding:10px 12px;border-radius:12px;background:rgba(16,185,129,0.14);border:1px solid rgba(52,211,153,0.45);color:#a7f3d0;line-height:1.5;">
              <b>✅ Đã tự động sao chép câu lệnh đầy đủ &amp; mở Gemini!</b><br/>
              Sang tab Gemini → <b>Dán (Ctrl+V / chạm giữ → Dán)</b> → Gửi → Cuối câu trả lời bấm nút <b>📋 Sao chép phản hồi</b> rồi quay lại đây dán vào ô dưới!
            </div>
          ` : `
            <div style="padding:11px 13px;border-radius:14px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.45);display:flex;flex-direction:column;gap:8px;">
              <div style="font-weight:700;color:#7dd3fc;">Bước 1: Copy câu lệnh cấu trúc chuẩn &amp; Mở thẳng sang Gemini (Miễn phí 0-Token)</div>
              <button type="button" id="noir-mp-copy-and-go" class="noir-ai-blink-btn" style="width:100%;padding:12px 16px;border-radius:12px;border:none;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#fff;font-size:13.5px;font-weight:700;cursor:pointer;">
                🚀 Copy sẵn câu lệnh &amp; Điều hướng sang Gemini ngay
              </button>
              <button type="button" id="noir-mp-toggle-prompt-view" style="align-self:flex-start;padding:5px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.35);background:#1e293b;color:#cbd5e1;font-size:11.5px;font-weight:700;cursor:pointer;">👁️ Xem khung câu lệnh chuẩn sẽ gửi</button>
              <textarea id="noir-mp-prompt-preview" readonly rows="5" style="display:none;width:100%;padding:9px;border-radius:10px;border:1px solid rgba(148,163,184,0.3);background:#090d16;color:#94a3b8;font-size:11px;font-family:ui-monospace,Consolas,monospace;box-sizing:border-box;"></textarea>
            </div>
          `}

          ${attachFileName ? `
            <div class="noir-ai-blink-btn" style="padding:12px 14px;border-radius:14px;background:linear-gradient(90deg,rgba(245,158,11,0.28),rgba(244,63,94,0.24));border:2px solid #fbbf24;color:#fef3c7;line-height:1.55;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;box-shadow:0 0 22px rgba(251,191,36,0.38);">
              <span>🚨 <b>LƯU Ý BẮT BUỘC TRÊN GEMINI:</b> Sau khi bấm mở Gemini, hãy <b>bấm dấu (+)</b> trong khung chat để <b>NẠP TỆP "${String(attachFileName).replace(/</g, '&lt;')}"</b> của bạn lên cùng câu lệnh vừa copy thì Gemini mới đọc được đúng tài liệu!</span>
              ${attachFileBlob ? '<button type="button" id="noir-mp-dl-file" style="padding:7px 11px;border-radius:9px;border:none;background:#d97706;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;">⬇️ Tải bản sao tệp</button>' : ''}
            </div>
          ` : ''}

          <div id="noir-mp-return-banner" style="display:none;padding:9px 12px;border-radius:12px;background:rgba(56,189,248,0.16);border:1px solid rgba(56,189,248,0.55);color:#bae6fd;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span>✨ Bạn vừa quay lại từ Gemini! Bấm nút bên cạnh để dán nhanh kết quả:</span>
            <button type="button" id="noir-mp-quick-paste-btn" style="padding:6px 12px;border-radius:8px;border:none;background:#0284c7;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">📋 Dán nhanh ngay</button>
          </div>

          <div style="font-weight:700;color:#6ee7b7;margin-top:2px;">Bước 2: Dán câu trả lời từ Gemini vào khung dưới để trang web tự đọc &amp; thực hiện:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <button type="button" id="noir-mp-paste-clip" style="padding:8px 12px;border-radius:10px;border:none;background:#0284c7;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">📋 Dán từ Clipboard</button>
            <button type="button" id="noir-mp-recopy" style="padding:8px 12px;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:#1e293b;color:#e2e8f0;font-size:12px;font-weight:700;cursor:pointer;">🔁 Chép lại Prompt</button>
            <button type="button" id="noir-mp-reopen-gemini" style="padding:8px 12px;border-radius:10px;border:1px solid rgba(167,139,250,0.45);background:#4c1d95;color:#ede9fe;font-size:12px;font-weight:700;cursor:pointer;">🚀 Mở lại Gemini</button>
          </div>

          <textarea id="noir-manual-paste-input" rows="7" placeholder="${String(pastePlaceholder).replace(/"/g, '&quot;')}" style="width:100%;padding:12px;border-radius:14px;border:1.5px solid rgba(56,189,248,0.45);background:#090d16;color:#f8fafc;font-size:12.5px;font-family:ui-monospace,Consolas,monospace;line-height:1.5;box-sizing:border-box;resize:vertical;"></textarea>
          <div id="noir-mp-err" style="display:none;color:#fda4af;font-size:12px;font-weight:700;"></div>
        </div>

        <div style="padding:12px 18px;background:#090d16;border-top:1px solid rgba(148,163,184,0.2);display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;">
          <button type="button" id="noir-mp-cancel" style="padding:10px 14px;border-radius:12px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#cbd5e1;font-size:12.5px;font-weight:700;cursor:pointer;">Hủy</button>
          <button type="button" id="noir-manual-paste-apply" class="noir-ai-blink-btn" style="padding:10px 18px;border-radius:12px;border:none;background:linear-gradient(90deg,#10b981,#059669);color:#fff;font-size:13.5px;font-weight:700;cursor:pointer;">${String(applyBtnLabel).replace(/</g, '&lt;')}</button>
        </div>
      </div>
    `;
    doc.body.appendChild(modal);

    const pvTa = modal.querySelector('#noir-mp-prompt-preview');
    if (pvTa) pvTa.value = String(promptText || '');
    modal.querySelector('#noir-mp-toggle-prompt-view')?.addEventListener('click', () => {
      if (!pvTa) return;
      pvTa.style.display = pvTa.style.display === 'none' ? 'block' : 'none';
    });
    modal.querySelector('#noir-mp-copy-and-go')?.addEventListener('click', async () => {
      await copyTextToClipboard(promptText);
      NS.utils?.showToast?.('✅ Đã copy sẵn toàn bộ câu lệnh! Đang mở Gemini...', 'success', 3400);
      if (NS.geminiSplitBridge?.launchExternalSplitWindow) {
        NS.geminiSplitBridge.launchExternalSplitWindow('GEMINI', false);
      } else {
        global.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
      }
    });

    const ta = modal.querySelector('#noir-manual-paste-input');
    const errEl = modal.querySelector('#noir-mp-err');
    const applyBtn = modal.querySelector('#noir-manual-paste-apply');
    const retBanner = modal.querySelector('#noir-mp-return-banner');
    let unwatch = null;

    const closeModal = () => {
      try { unwatch?.(); } catch (_eU) {}
      modal.remove();
    };
    unwatch = watchClipboardReturn(() => {
      if (retBanner && modal.isConnected) retBanner.style.display = 'flex';
    });

    const pasteFromClip = async () => {
      try {
        const clip = await global.navigator?.clipboard?.readText?.();
        if (clip && ta) {
          ta.value = clip;
          if (errEl) errEl.style.display = 'none';
          NS.utils?.showToast?.('✅ Đã dán kết quả từ Clipboard!', 'success', 2400);
        } else {
          ta?.focus();
          NS.utils?.showToast?.('ℹ️ Hãy bấm Ctrl+V (hoặc chạm giữ → Dán trên điện thoại) vào ô văn bản.', 'info', 3000);
        }
      } catch (_eCl) {
        ta?.focus();
        NS.utils?.showToast?.('ℹ️ Hãy bấm Ctrl+V (hoặc chạm giữ → Dán trên điện thoại) vào ô văn bản.', 'info', 3000);
      }
    };

    modal.querySelector('#noir-mp-close')?.addEventListener('click', closeModal);
    modal.querySelector('#noir-mp-cancel')?.addEventListener('click', closeModal);
    modal.querySelector('#noir-mp-paste-clip')?.addEventListener('click', pasteFromClip);
    modal.querySelector('#noir-mp-quick-paste-btn')?.addEventListener('click', pasteFromClip);
    modal.querySelector('#noir-mp-recopy')?.addEventListener('click', async () => {
      await copyTextToClipboard(promptText);
      NS.utils?.showToast?.('✅ Đã sao chép lại toàn bộ Prompt!', 'success', 2400);
    });
    modal.querySelector('#noir-mp-reopen-gemini')?.addEventListener('click', () => {
      if (NS.geminiSplitBridge?.launchExternalSplitWindow) {
        NS.geminiSplitBridge.launchExternalSplitWindow('GEMINI', false);
      } else {
        global.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
      }
    });
    modal.querySelector('#noir-mp-dl-file')?.addEventListener('click', () => {
      if (!attachFileBlob) return;
      try {
        const u = URL.createObjectURL(attachFileBlob);
        const a = doc.createElement('a');
        a.href = u;
        a.download = attachFileName || 'document';
        a.click();
        setTimeout(() => URL.revokeObjectURL(u), 8000);
      } catch (_eDl) {}
    });

    applyBtn?.addEventListener('click', async () => {
      const val = String(ta?.value || '').trim();
      if (!val || val.length < 3) {
        if (errEl) {
          errEl.textContent = '⚠️ Vui lòng dán kết quả câu trả lời từ Gemini vào khung trên trước khi áp dụng!';
          errEl.style.display = 'block';
        }
        ta?.focus();
        return;
      }
      if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = '⏳ Đang xử lý kết quả...'; }
      try {
        if (typeof onApplyPasted === 'function') {
          await onApplyPasted(val);
        }
        closeModal();
      } catch (applyErr) {
        if (errEl) {
          errEl.textContent = `❌ Lỗi áp dụng kết quả: ${applyErr?.message || applyErr}`;
          errEl.style.display = 'block';
        }
        if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = applyBtnLabel; }
      }
    });

    return { close: closeModal };
  }

  const exported = Object.freeze({
    API_STORAGE_KEY,
    PROMPT_CHINH_TIEU_DE_CHUAN,
    TASK_MODEL_PROFILES,
    DEFAULT_VISION_MODELS,
    getOptimalModelsForTask,
    isQuota429Error,
    buildTaskManualPrompt,
    openManualPasteResultModal,
    openManualAiAssistantModal: (o) => openManualPasteResultModal({ ...o, alreadyCopied: false }),
    sanitizeApiKey,
    getTransportsForKey,
    getApiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
    isApiKeyVerified,
    verifyApiKeyLive,
    syncApiKeyAcrossModules,
    uint8ToBase64,
    copyTextToClipboard,
    copyStandardPrompt,
    openPromptPreviewModal,
    openApiKeyQuickModal,
    watchClipboardReturn,
    callGeminiGenerateContent,
    callGeminiText,
    callGeminiWithGrounding,
    showAiFullLoadingOverlay,
    maybeShowWelcomeApiUpsellModal,
    runAiFormatDocumentToAst,
    runAiAndCodeAutoToc,
    stitchContinueTables,
    runGeminiNativeFastRead,
    runGeminiVisionDeepRead,
  });

  NS.geminiBridge = exported;
  global.NoirGeminiBridge = exported;
})(typeof window !== 'undefined' ? window : globalThis);
