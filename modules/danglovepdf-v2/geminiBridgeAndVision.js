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
    // Tác vụ nhẹ (Verify, Metadata, Split keyword, Form, PII, Auto-TOC, sửa chính tả) -> Ưu tiên Flash 3.5-Lite / 3.8 Flash mới nhất
    fast_light: Object.freeze(['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite']),
    // Tác vụ đa phương thức tệp (10 Theme Blueprint, OCR, ICR, Bóc bảng Excel, Dịch trang) -> Ưu tiên Gemini 3.8 Flash (thay thế 2.5 sắp ngừng)
    doc_multimodal: Object.freeze(['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash']),
    // Tác vụ phân tích chuyên sâu dài (Mod 49 Đầu tư, Mod 50 30 phút thông thái, So sánh Diff, Tóm tắt PDF)
    deep_analysis: Object.freeze(['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash']),
  });

  // Bộ lược đồ JSON chuẩn (response_schema) ép Gemini trả JSON đúng 100% cấu trúc Code tiêu thụ
  const RESPONSE_SCHEMAS = Object.freeze({
    THEME10_BLUEPRINT: Object.freeze({
      type: 'OBJECT',
      properties: {
        schema_version: { type: 'STRING' },
        title: { type: 'STRING' },
        subtitle: { type: 'STRING' },
        document_meta: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            subtitle: { type: 'STRING' },
            language: { type: 'STRING' },
            has_toc_pages: { type: 'ARRAY', items: { type: 'INTEGER' } },
          },
        },
        headings: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              page: { type: 'INTEGER' },
              level: { type: 'INTEGER' },
              block_ids: { type: 'ARRAY', items: { type: 'STRING' } },
              text: { type: 'STRING' },
              clean_title: { type: 'STRING' },
              matchAnchor: { type: 'STRING' },
              anchor_text: { type: 'STRING' },
            },
            required: ['page', 'level'],
          },
        },
        tables: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              table_id: { type: 'STRING' },
              page: { type: 'INTEGER' },
              caption_block: { type: 'STRING' },
              caption: { type: 'STRING' },
              start_block: { type: 'STRING' },
              end_block: { type: 'STRING' },
              startAnchor: { type: 'STRING' },
              header_rows: { type: 'INTEGER' },
              continued_from_prev: { type: 'BOOLEAN' },
              headers: { type: 'ARRAY', items: { type: 'STRING' } },
              columnCount: { type: 'INTEGER' },
              matrix: { type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'STRING' } } },
            },
            required: ['page'],
          },
        },
        figures: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              page: { type: 'INTEGER' },
              block_id: { type: 'STRING' },
              caption: { type: 'STRING' },
              nearAnchor: { type: 'STRING' },
            },
            required: ['page', 'caption'],
          },
        },
        formulas: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              page: { type: 'INTEGER' },
              block_id: { type: 'STRING' },
              mode: { type: 'STRING' },
              latex: { type: 'STRING' },
              rawAnchor: { type: 'STRING' },
              anchor_text: { type: 'STRING' },
            },
            required: ['page', 'latex'],
          },
        },
        specialSymbols: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              page: { type: 'INTEGER' },
              rawText: { type: 'STRING' },
              normalizedUnicode: { type: 'STRING' },
            },
            required: ['page', 'rawText', 'normalizedUnicode'],
          },
        },
        drop_blocks: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['headings', 'tables', 'figures', 'formulas'],
    }),
    OCR_STRUCTURED: Object.freeze({
      type: 'OBJECT',
      properties: {
        detectedLanguage: { type: 'STRING' },
        pages: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              pageNumber: { type: 'INTEGER' },
              confidence: { type: 'NUMBER' },
              blocks: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    type: { type: 'STRING' },
                    text: { type: 'STRING' },
                    latex: { type: 'STRING' },
                  },
                  required: ['type', 'text'],
                },
              },
              fullText: { type: 'STRING' },
            },
            required: ['pageNumber', 'fullText'],
          },
        },
      },
      required: ['pages'],
    }),
    ICR_STRUCTURED: Object.freeze({
      type: 'OBJECT',
      properties: {
        documentType: { type: 'STRING' },
        pages: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              pageNumber: { type: 'INTEGER' },
              confidence: { type: 'NUMBER' },
              items: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    type: { type: 'STRING' },
                    text: { type: 'STRING' },
                    checkboxState: { type: 'STRING' },
                    latex: { type: 'STRING' },
                    uncertainNote: { type: 'STRING' },
                  },
                  required: ['type', 'text'],
                },
              },
              tables: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    caption: { type: 'STRING' },
                    rows: {
                      type: 'ARRAY',
                      items: { type: 'ARRAY', items: { type: 'STRING' } },
                    },
                  },
                  required: ['rows'],
                },
              },
              fullText: { type: 'STRING' },
            },
            required: ['pageNumber', 'fullText'],
          },
        },
      },
      required: ['pages'],
    }),
    AUTO_TOC: Object.freeze({
      type: 'OBJECT',
      properties: {
        entries: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              level: { type: 'INTEGER' },
              page: { type: 'INTEGER' },
              kind: { type: 'STRING' },
            },
            required: ['title', 'page'],
          },
        },
      },
      required: ['entries'],
    }),
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
      responseSchema = null,
      responseMimeType = '',
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

    const generationConfig = { temperature, maxOutputTokens };
    if (responseSchema && typeof responseSchema === 'object') {
      generationConfig.responseMimeType = responseMimeType || 'application/json';
      generationConfig.responseSchema = responseSchema;
    } else if (responseMimeType) {
      generationConfig.responseMimeType = responseMimeType;
    }

    const bodyPayload = {
      contents: [{ role: 'user', parts }],
      generationConfig,
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
        let schemaDowngraded = false;
        for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
          if (signal?.aborted) throw new Error('Đã hủy yêu cầu Gemini API.');
          const endpoint = tr.buildGenerateUrl(modelName, cleanKey);
          const payloadToSend = schemaDowngraded
            ? {
                ...bodyPayload,
                generationConfig: {
                  temperature,
                  maxOutputTokens,
                  ...(generationConfig.responseMimeType ? { responseMimeType: generationConfig.responseMimeType } : {}),
                },
              }
            : bodyPayload;
          try {
            const res = await fetchImpl(endpoint, {
              method: 'POST',
              headers: tr.buildHeaders(cleanKey),
              body: JSON.stringify(payloadToSend),
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
              // Nếu model từ chối responseSchema (400 schema), tự hạ nhẹ giữ responseMimeType JSON và thử lại 1 lần
              if (res.status === 400 && responseSchema && !schemaDowngraded && /schema|responseSchema|generationConfig/i.test(errTxt)) {
                schemaDowngraded = true;
                continue;
              }
              if (res.status === 404) {
                break; // Model ID không tồn tại trên endpoint này -> chuyển sang model dự phòng kế tiếp ngay
              }
              if (res.status === 400 || res.status === 401 || res.status === 403) {
                transportRejectedKey = true;
                break; // Thử transport khác (VD: Vertex 403 Agent Platform API -> AI Studio hoặc ngược lại)
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

  function tagBlocksWithDeterministicIds(sourceBlocks) {
    const perPage = new Map();
    return (Array.isArray(sourceBlocks) ? sourceBlocks : []).map((b) => {
      if (!b || typeof b !== 'object') return b;
      const pg = Math.max(1, Number(b.pageNo || b.page || 1));
      const seq = (perPage.get(pg) || 0) + 1;
      perPage.set(pg, seq);
      const blockId = b.blockId || `P${String(pg).padStart(2, '0')}_B${String(seq).padStart(2, '0')}`;
      return { ...b, pageNo: pg, page: pg, blockId };
    });
  }

  /**
   * TẠO KHUNG XƯƠNG TÓM LƯỢC NÉN (COMPACT SKELETON) ĐÍNH KÈM BLOCK ID Pxx_Byy:
   * Giảm 70–85% token gửi cho AI bằng cách cắt gọn đoạn văn xuôi dài về mẫu neo đầu...cuối,
   * trong khi giữ trọn vẹn 100% Tiêu đề, ứng viên nhập nhằng, Bảng, Hình & Công thức!
   */
  function buildCompactSkeletonForAi(sourceBlocks, opts = {}) {
    const tagged = tagBlocksWithDeterministicIds(sourceBlocks);
    const maxBlocks = Math.max(40, Number(opts.maxBlocks || 360));
    const maxChars = Math.max(4000, Number(opts.maxChars || 18000));
    const focusPages = Array.isArray(opts.focusPages) && opts.focusPages.length ? new Set(opts.focusPages) : null;
    const cm = opts.confidenceMatrix || sourceBlocks?.__ast?.meta?.confidenceMatrix || null;

    const lines = [];
    if (cm) {
      lines.push(
        `# META_CODE: pages=${cm.totalPages || '?'} | code_confidence=${cm.overallConfidence}% | scan_pages=[${(cm.scanPages || []).join(',')}] | multi_col=[${(cm.multiColumnPages || []).join(',')}] | old_toc_pages=[${(cm.oldTocPages || []).join(',')}]`
      );
    }

    let charTotal = lines.join('\n').length;
    for (let i = 0; i < tagged.length && i < maxBlocks; i++) {
      const b = tagged[i];
      if (!b) continue;
      if (focusPages && !focusPages.has(b.pageNo) && b.type === 'paragraph' && (b.confidence === undefined || b.confidence >= 85)) {
        continue;
      }
      const id = b.blockId;
      const szTag = b.fontSize ? `sz:${Math.round(b.fontSize)}` : '';
      const boldTag = b.isBold ? 'bold' : '';
      const confTag = typeof b.confidence === 'number' ? `conf:${b.confidence}` : '';
      const roleTag =
        b.type === 'heading' ? `H${b.level || 1}` :
        b.type === 'subheading' ? `H${b.level || 3}` :
        b.type === 'table' ? `TABLE(${b.rows?.length || 0}x${b.rows?.[0]?.length || 0})` :
        b.type === 'image' ? (b.isMathImage ? 'MATH_IMG' : 'IMAGE') :
        b.type === 'math_block' ? 'MATH' :
        b.type === 'toc_item' ? 'OLD_TOC?' :
        'P';
      const metaStr = [id, szTag, boldTag, `guess:${roleTag}`, confTag].filter(Boolean).join(' | ');

      let snippet = '';
      if (b.type === 'table') {
        const hdr = Array.isArray(b.rows?.[0]) ? b.rows[0].slice(0, 8).join(' | ') : '';
        snippet = `${b.caption ? `[Cap: ${b.caption}] ` : ''}Headers: ${hdr}`.slice(0, 180);
      } else if (b.type === 'image') {
        snippet = b.caption || '(Hình/biểu đồ chưa có chú thích)';
      } else {
        const cleanTxt = String(b.text || '').replace(/\s+/g, ' ').trim();
        if (b.type === 'paragraph' && cleanTxt.length > 130 && (b.confidence === undefined || b.confidence >= 85)) {
          const words = cleanTxt.split(/\s+/);
          snippet = words.length > 18
            ? `${words.slice(0, 10).join(' ')} [...] ${words.slice(-5).join(' ')}`
            : cleanTxt.slice(0, 130);
        } else {
          snippet = cleanTxt.slice(0, 190);
        }
      }

      const rowStr = `[${metaStr}] "${snippet.replace(/"/g, "'")}"`;
      if (charTotal + rowStr.length + 1 > maxChars) {
        lines.push(`... (đã nén tới khối ${id}, tổng ${tagged.length} khối)`);
        break;
      }
      lines.push(rowStr);
      charTotal += rowStr.length + 1;
    }

    return {
      taggedBlocks: tagged,
      skeletonText: lines.join('\n'),
      blockCount: tagged.length,
    };
  }

  /**
   * BỘ PHÂN TÍCH JSON CHỊU LỖI CHUYÊN DỤNG CHO LATEX & AI THỦ CÔNG (FAULT-TOLERANT PARSER):
   * 1. Gỡ markdown fence, lời dẫn ngoài JSON, dấu ngoặc kép cong (“/”), dấu phẩy thừa cuối mảng/object.
   * 2. Tự động bảo vệ chuỗi lệnh LaTeX bị AI quên nhân đôi gạch chéo (VD: \frac, \times, \beta, \right, \text, \sum, \sqrt, \cdot, \alpha, \Delta...)
   *    — cực kỳ quan trọng vì \f, \t, \b, \r trong JSON sẽ biến thành ký tự điều khiển làm hỏng công thức!
   * 3. Phát hiện JSON bị cắt cụt giữa chừng (truncated: true) & báo trang hoàn tất gần nhất (`lastCompletedPage`) để gợi ý quét tiếp!
   */
  const LATEX_CMD_SINGLE_SLASH_RE =
    /(^|[^\\])\\(frac|forall|beta|bar|binom|big|bmatrix|times|text|theta|tau|to|tilde|triangle|right|rho|neq|nabla|nu|not|left|leq|le\b|lambda|lim|ln|log|cdot|cos|cup|cap|sum|sqrt|sigma|sin|alpha|approx|gamma|delta|Delta|pm|pi|prod|partial|mu|infty|int|in\b|div|geq|ge\b|mathbf|mathrm|mathit|mathbb|mathcal|overline|underline|hat|vec|quad|qquad|Omega|omega|phi|psi|epsilon|varepsilon|eta|zeta|xi|chi|equiv|sim|propto|subset|supset|cup|cap)/g;

  function repairJsonStringForLatexAndChatter(rawStr) {
    let s = String(rawStr || '').trim();
    if (!s) return '';
    // Bóc code fence ```json ... ```
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) s = fenced[1].trim();
    // Chuyển dấu ngoặc kép thông minh thành chuẩn ASCII chỉ ở ngoài chuỗi hoặc thay đồng loạt an toàn
    s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    const firstBrace = s.indexOf('{');
    if (firstBrace === -1) return '';
    const lastBrace = s.lastIndexOf('}');
    s = lastBrace > firstBrace ? s.slice(firstBrace, lastBrace + 1) : s.slice(firstBrace);

    // Xử lý từng string literal bên trong JSON: nhân đôi `\` trước lệnh LaTeX hoặc ký tự escape không hợp lệ
    let out = '';
    let inStr = false;
    let strBuf = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (!inStr) {
        if (ch === '"') {
          inStr = true;
          strBuf = '';
          out += '"';
        } else {
          out += ch;
        }
      } else {
        if (ch === '\\') {
          const next = s[i + 1];
          if (next === undefined) {
            strBuf += '\\\\';
            continue;
          }
          // Nếu là `\"` hoặc `\\` -> giữ nguyên escape chuẩn
          if (next === '"' || next === '\\') {
            strBuf += ch + next;
            i += 1;
            continue;
          }
          // Kiểm tra xem sau `\` có phải lệnh LaTeX bắt đầu bằng f/t/b/r/n hay ký tự khác không
          const tailSlice = s.slice(i, i + 18);
          if (/^\\(?:frac|forall|beta|bar|binom|big|bmatrix|times|text|theta|tau|to\b|tilde|triangle|right|rho|neq|nabla|nu\b|not\b|left|leq|le\b|lambda|lim|ln\b|log|cdot|cos|cup|cap|sum|sqrt|sigma|sin|alpha|approx|gamma|delta|Delta|pm|pi|prod|partial|mu|infty|int|in\b|div|geq|ge\b|mathbf|mathrm|mathit|mathbb|mathcal|overline|underline|hat|vec|quad|qquad|Omega|omega|phi|psi|epsilon|varepsilon|eta|zeta|xi|chi|equiv|sim|propto|subset|supset)/i.test(tailSlice)) {
            strBuf += '\\\\';
            continue;
          }
          if (/[\/bfnrtu]/.test(next)) {
            strBuf += ch + next;
            i += 1;
            continue;
          }
          // Ký tự escape bất hợp lệ trong JSON (vd \_, \%, \$, \{, \}) -> nhân đôi `\\`
          strBuf += '\\\\';
          continue;
        }
        if (ch === '"') {
          inStr = false;
          // Bảo vệ xuống dòng thô nằm trong string JSON
          out += strBuf.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '"';
        } else {
          strBuf += ch;
        }
      }
    }
    if (inStr) out += strBuf + '"';
    // Xóa dấu phẩy thừa trước `}` hoặc `]`
    out = out.replace(/,\s*([}\]])/g, '$1');
    return out;
  }

  function parseAiStructuralPatchTolerant(raw) {
    const str = String(raw || '').trim();
    if (!str) return { ok: false, data: null, truncated: false, lastCompletedPage: 0, error: 'Empty input' };

    const repaired = repairJsonStringForLatexAndChatter(str);
    if (!repaired) {
      return { ok: false, data: null, truncated: false, lastCompletedPage: 0, error: 'No JSON object found' };
    }

    try {
      const parsed = JSON.parse(repaired);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ok: true, data: parsed, truncated: false, lastCompletedPage: 0, repairedLatex: repaired !== str };
      }
    } catch (firstErr) {
      // Thử thêm 1 pass ép double-escape LaTeX còn sót
      try {
        const pass2 = repaired.replace(LATEX_CMD_SINGLE_SLASH_RE, '$1\\\\$2');
        const parsed2 = JSON.parse(pass2);
        if (parsed2 && typeof parsed2 === 'object' && !Array.isArray(parsed2)) {
          return { ok: true, data: parsed2, truncated: false, lastCompletedPage: 0, repairedLatex: true };
        }
      } catch (_e2) {}

      // Kiểm tra JSON bị cắt cụt giữa chừng (AI hết max_output_tokens)
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openArr = (repaired.match(/\[/g) || []).length;
      const closeArr = (repaired.match(/\]/g) || []).length;
      const isTruncated = openBraces > closeBraces || openArr > closeArr;
      const pageMatches = Array.from(repaired.matchAll(/"page"\s*:\s*(\d+)/g)).map((m) => Number(m[1]));
      const lastCompletedPage = pageMatches.length ? Math.max(...pageMatches) : 0;

      // Thử khôi phục mềm bằng cách cắt tới dấu `}` hợp lệ cuối cùng rồi đóng ngoặc còn thiếu
      if (isTruncated) {
        const lastCompleteObj = repaired.lastIndexOf('}');
        if (lastCompleteObj > 20) {
          let candidate = repaired.slice(0, lastCompleteObj + 1).replace(/,\s*$/, '');
          const ob = (candidate.match(/\{/g) || []).length;
          const cb = (candidate.match(/\}/g) || []).length;
          const oa = (candidate.match(/\[/g) || []).length;
          const ca = (candidate.match(/\]/g) || []).length;
          if (oa > ca) candidate += ']'.repeat(oa - ca);
          if (ob > cb) candidate += '}'.repeat(ob - cb);
          try {
            const partialObj = JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
            if (partialObj && typeof partialObj === 'object') {
              return {
                ok: true,
                data: partialObj,
                truncated: true,
                lastCompletedPage,
                warning: `JSON bị cắt cụt sau trang ${lastCompletedPage || '?'} — đã khôi phục phần hoàn chỉnh.`,
              };
            }
          } catch (_eRec) {}
        }
      }

      return {
        ok: false,
        data: null,
        truncated: isTruncated,
        lastCompletedPage,
        error: String(firstErr?.message || firstErr),
      };
    }

    return { ok: false, data: null, truncated: false, lastCompletedPage: 0, error: 'Invalid JSON root' };
  }

  function extractJsonObjectFromText(raw) {
    const res = parseAiStructuralPatchTolerant(raw);
    return res.ok ? res.data : null;
  }

  function normalizeAnchorText(s) {
    return String(s || '')
      .normalize('NFC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  /**
   * ĐỘNG CƠ HỢP NHẤT 3 TẦNG (3-TIER AST RECONCILIATION ENGINE — PDF MAGIC V1 + LEGACY BLUEPRINT):
   * - Tầng 1 (Exact Block ID): Tra trực tiếp `block_id` / `block_ids[]` (`P04_B02`) — gộp tiêu đề vỡ nhiều dòng thành 1 khối duy nhất, triệt tiêu 100% đuôi mồ côi!
   * - Tầng 2 (Fuzzy Page-Bounded Anchor): Khi không có `block_id` hoặc lệch nhẹ, khớp mờ `anchor_text`/`matchAnchor` trong phạm vi ±1 trang + xóa đuôi mồ côi.
   * - Tầng 3 (Structural Patch): Xóa `drop_blocks[]`, bỏ trang mục lục cũ `has_toc_pages[]`, nối bảng vắt trang `continued_from_prev: true`, thay `matrix` bảng sửa lỗi, gắn `formulas[]` (display/inline) & `specialSymbols[]`.
   * - Bất biến bảo toàn văn bản: 100% văn xuôi thường do Code trích xuất được giữ nguyên vẹn không thất thoát!
   */
  function reconcileAiPatchIntoBlocks(sourceBlocks, blueprintOrRawText) {
    let parseMeta = { truncated: false, lastCompletedPage: 0 };
    let bp = blueprintOrRawText;
    if (typeof blueprintOrRawText === 'string') {
      const parsed = parseAiStructuralPatchTolerant(blueprintOrRawText);
      parseMeta = { truncated: Boolean(parsed.truncated), lastCompletedPage: parsed.lastCompletedPage || 0, warning: parsed.warning || '' };
      bp = parsed.ok ? parsed.data : null;
    }

    const blocks = tagBlocksWithDeterministicIds(sourceBlocks);
    if (!bp || typeof bp !== 'object') {
      return {
        applied: false,
        blocks,
        parseMeta,
        stats: { headingsApplied: 0, orphanTailsRemoved: 0, droppedBlocks: 0, tablesCaptioned: 0, tablesStitched: 0, figuresCaptioned: 0, formulasFixed: 0, symbolsFixed: 0 },
      };
    }

    const stats = {
      headingsApplied: 0,
      orphanTailsRemoved: 0,
      droppedBlocks: 0,
      tablesCaptioned: 0,
      tablesStitched: 0,
      figuresCaptioned: 0,
      formulasFixed: 0,
      symbolsFixed: 0,
    };
    const consumedIndices = new Set();

    // Index O(1) theo blockId (Pxx_Byy)
    const idToIdx = new Map();
    blocks.forEach((b, idx) => {
      if (b?.blockId) idToIdx.set(String(b.blockId).toUpperCase(), idx);
    });

    // 0A. Xử lý `drop_blocks[]` (xóa rác lặp/header/watermark do AI đánh dấu đích danh)
    const dropIds = Array.isArray(bp.drop_blocks) ? bp.drop_blocks : [];
    for (const rawId of dropIds) {
      const key = String(rawId || '').trim().toUpperCase();
      if (!key || !idToIdx.has(key)) continue;
      const idx = idToIdx.get(key);
      consumedIndices.add(idx);
      stats.droppedBlocks += 1;
    }

    // 0B. Xử lý `document_meta.has_toc_pages[]` (loại bỏ các dòng mục lục chấm cũ trên trang mục lục cũ)
    const oldTocPages = new Set(
      (Array.isArray(bp.document_meta?.has_toc_pages) ? bp.document_meta.has_toc_pages : [])
        .map((p) => Number(p))
        .filter((p) => Number.isFinite(p) && p > 0)
    );
    if (oldTocPages.size > 0) {
      blocks.forEach((b, idx) => {
        if (consumedIndices.has(idx) || !b || !oldTocPages.has(Number(b.pageNo || b.page || 0))) return;
        const txt = String(b.text || '').trim();
        if (b.type === 'toc_item' || /\.{3,}\s*\d{1,4}\s*$/.test(txt) || /^(?:MỤC\s+LỤC|TABLE\s+OF\s+CONTENTS|DANH\s+MỤC\s+(?:BẢNG|HÌNH))/i.test(txt)) {
          consumedIndices.add(idx);
          stats.droppedBlocks += 1;
        }
      });
    }

    // 1. TẦNG 1 & TẦNG 2: Áp dụng danh sách Tiêu đề chính xác từ AI (ưu tiên block_ids[] -> fallback fuzzy anchor)
    const aiHeadings = Array.isArray(bp.headings) ? bp.headings : [];
    for (const h of aiHeadings) {
      const hText = String(h?.clean_title || h?.text || '').trim();
      if (!hText) continue;
      const lvl = Math.max(1, Math.min(4, Number(h?.level) || 1));
      const hNorm = normalizeAnchorText(hText);
      const targetPage = Number(h?.page) || 0;

      // Tầng 1: Khớp chính xác theo mảng `block_ids[]` hoặc `block_id`
      const idList = Array.isArray(h?.block_ids) && h.block_ids.length
        ? h.block_ids
        : (h?.block_id ? [h.block_id] : []);
      const resolvedIndices = idList
        .map((id) => idToIdx.get(String(id || '').trim().toUpperCase()))
        .filter((idx) => idx !== undefined && !consumedIndices.has(idx));

      let hitIdx = -1;
      if (resolvedIndices.length > 0) {
        hitIdx = resolvedIndices[0];
        // Các block_id thứ 2, 3... (phần bị gãy dòng của cùng 1 tiêu đề) bị nuốt sạch!
        for (let ri = 1; ri < resolvedIndices.length; ri++) {
          consumedIndices.add(resolvedIndices[ri]);
          stats.orphanTailsRemoved += 1;
        }
      } else {
        // Tầng 2: Khớp mờ theo `anchor_text` / `matchAnchor` trên đúng trang (±1)
        const needle = normalizeAnchorText(h?.anchor_text || h?.matchAnchor || hText);
        if (!needle) continue;
        for (let i = 0; i < blocks.length; i++) {
          if (consumedIndices.has(i)) continue;
          const b = blocks[i];
          if (!b || b.type === 'table' || b.type === 'image') continue;
          const bNorm = normalizeAnchorText(b.text || '');
          if (!bNorm) continue;
          const pageOk = !targetPage || !b.page || Math.abs(Number(b.page) - targetPage) <= 1;
          if (pageOk && (bNorm === needle || bNorm.includes(needle) || (needle.length >= 12 && needle.includes(bNorm) && bNorm.length >= 8) || (hNorm.length >= 14 && hNorm.startsWith(bNorm) && bNorm.length >= 8))) {
            hitIdx = i;
            break;
          }
        }
      }

      if (hitIdx >= 0) {
        const origNorm = normalizeAnchorText(blocks[hitIdx].text || '');
        blocks[hitIdx] = {
          ...blocks[hitIdx],
          type: lvl <= 2 ? 'heading' : 'subheading',
          kind: lvl === 1 ? 'h1' : (lvl === 2 ? 'h2' : 'h3'),
          level: lvl,
          text: hText,
          includeInToc: true,
          aiLocated: true,
          confidence: 98,
        };
        stats.headingsApplied += 1;

        // Quét sạch thêm 1-2 block đuôi mồ côi liền sau nếu vẫn còn sót mảnh tiêu đề
        let accNorm = origNorm;
        for (let k = hitIdx + 1; k <= Math.min(blocks.length - 1, hitIdx + 2); k++) {
          if (consumedIndices.has(k)) continue;
          const nb = blocks[k];
          if (!nb || nb.type === 'table' || nb.type === 'image') break;
          const nbTxt = String(nb.text || '').trim();
          const nbNorm = normalizeAnchorText(nbTxt);
          if (!nbNorm || nbTxt.length > 110) break;
          const isExactTail = hNorm.endsWith(nbNorm) && nbNorm.length >= 3 && nbNorm.length < hNorm.length;
          const isJoinedMatch = `${accNorm} ${nbNorm}`.replace(/\s+/g, ' ').trim() === hNorm || hNorm.startsWith(`${accNorm} ${nbNorm}`.replace(/\s+/g, ' ').trim());
          const isContainedSuffix = nbNorm.length >= 4 && hNorm.indexOf(nbNorm) >= Math.floor(hNorm.length * 0.35);
          if (isExactTail || isJoinedMatch || isContainedSuffix) {
            consumedIndices.add(k);
            accNorm = `${accNorm} ${nbNorm}`.replace(/\s+/g, ' ').trim();
            stats.orphanTailsRemoved += 1;
          } else {
            break;
          }
        }
      }
    }

    // 2. TẦNG 3A: Áp dụng vị trí Bảng, Caption, Headers, Matrix & Nối bảng vắt trang (`continued_from_prev`)
    const aiTables = Array.isArray(bp.tables) ? bp.tables : [];
    let tableCursor = 0;
    let lastTableIdx = -1;
    for (let tIdx = 0; tIdx < aiTables.length; tIdx++) {
      const tbl = aiTables[tIdx];
      const cap = String(tbl?.caption || '').trim();
      const targetPage = Number(tbl?.page) || 0;
      let matchedIdx = -1;

      // Ưu tiên khớp theo start_block / block_id
      const startKey = String(tbl?.start_block || tbl?.block_id || '').trim().toUpperCase();
      if (startKey && idToIdx.has(startKey) && blocks[idToIdx.get(startKey)]?.type === 'table') {
        matchedIdx = idToIdx.get(startKey);
      }
      if (matchedIdx < 0) {
        for (let i = tableCursor; i < blocks.length; i++) {
          if (consumedIndices.has(i) || blocks[i]?.type !== 'table') continue;
          const pgOk = !targetPage || !blocks[i].page || Math.abs(Number(blocks[i].page) - targetPage) <= 1;
          if (pgOk) {
            matchedIdx = i;
            tableCursor = i + 1;
            break;
          }
        }
      }

      // Gắn tên bảng từ caption_block (và nuốt block caption rời khỏi luồng để không vẽ lặp 2 lần)
      const capBlockKey = String(tbl?.caption_block || '').trim().toUpperCase();
      let resolvedCap = cap;
      if (capBlockKey && idToIdx.has(capBlockKey)) {
        const capIdx = idToIdx.get(capBlockKey);
        if (!resolvedCap && blocks[capIdx]?.text) resolvedCap = String(blocks[capIdx].text).trim();
        if (matchedIdx >= 0 && capIdx !== matchedIdx) {
          consumedIndices.add(capIdx);
        }
      }

      if (matchedIdx >= 0) {
        // Nếu có `matrix` 2D chuẩn từ AI (cứu bảng cực khó)
        if (Array.isArray(tbl?.matrix) && tbl.matrix.length >= 2 && tbl.matrix.every((r) => Array.isArray(r))) {
          blocks[matchedIdx].rows = tbl.matrix.map((r) => r.map((c) => String(c ?? '').trim()));
          if (Number(tbl.header_rows) > 0) {
            blocks[matchedIdx].headerRows = blocks[matchedIdx].rows.slice(0, Number(tbl.header_rows));
          }
        }
        // Nối bảng vắt trang (`continued_from_prev: true`) vào bảng trước đó!
        // Nếu AI chỉ trả mảnh bảng nối tiếp mà không liệt kê bảng đầu trong `bp.tables`, tự dò ngược về bảng liền trước trong `blocks`!
        let prevTableTargetIdx = lastTableIdx;
        if (tbl?.continued_from_prev === true && (prevTableTargetIdx < 0 || prevTableTargetIdx === matchedIdx || consumedIndices.has(prevTableTargetIdx))) {
          for (let back = matchedIdx - 1; back >= 0; back--) {
            if (!consumedIndices.has(back) && blocks[back]?.type === 'table') {
              prevTableTargetIdx = back;
              break;
            }
          }
        }
        if (tbl?.continued_from_prev === true && prevTableTargetIdx >= 0 && prevTableTargetIdx !== matchedIdx && Array.isArray(blocks[prevTableTargetIdx]?.rows) && Array.isArray(blocks[matchedIdx]?.rows)) {
          const prevRows = blocks[prevTableTargetIdx].rows;
          const curRows = blocks[matchedIdx].rows;
          const skipHdr = Math.max(0, Number(tbl.header_rows ?? 1));
          const prevHdrNorm = normalizeAnchorText((prevRows[0] || []).join(' '));
          const curHdrNorm = normalizeAnchorText((curRows[0] || []).join(' '));
          const shouldSkipFirst = skipHdr > 0 && curRows.length > 1 && prevHdrNorm && curHdrNorm && (prevHdrNorm === curHdrNorm || curHdrNorm.includes(prevHdrNorm.slice(0, 18)));
          const appendSlice = shouldSkipFirst ? curRows.slice(skipHdr) : curRows;
          blocks[prevTableTargetIdx].rows = [...prevRows, ...appendSlice];
          consumedIndices.add(matchedIdx);
          lastTableIdx = prevTableTargetIdx;
          stats.tablesStitched += 1;
          continue;
        }

        if (resolvedCap && !blocks[matchedIdx].caption) {
          blocks[matchedIdx].caption = resolvedCap;
          stats.tablesCaptioned += 1;
        }
        if (Array.isArray(tbl?.headers) && tbl.headers.length && Array.isArray(blocks[matchedIdx].rows) && blocks[matchedIdx].rows.length) {
          if (blocks[matchedIdx].rows[0].length === tbl.headers.length) {
            blocks[matchedIdx].aiHeaders = tbl.headers;
            blocks[matchedIdx].rows[0] = tbl.headers.slice();
            const hdrJoinedNorm = normalizeAnchorText(tbl.headers.join(' '));
            while (blocks[matchedIdx].rows.length >= 3) {
              const r1 = blocks[matchedIdx].rows[1];
              const c0 = String(r1?.[0] || '').trim();
              const r1Joined = normalizeAnchorText((r1 || []).join(' '));
              if (!c0 && r1Joined && hdrJoinedNorm.includes(r1Joined.slice(0, Math.min(20, r1Joined.length)))) {
                blocks[matchedIdx].rows.splice(1, 1);
                stats.orphanTailsRemoved += 1;
              } else {
                break;
              }
            }
          }
        }
        lastTableIdx = matchedIdx;
      }
    }

    // 3. Áp dụng vị trí Hình & Tự gắn tên Hình (nếu tài liệu gốc chưa có tên hình)
    const aiFigures = Array.isArray(bp.figures) ? bp.figures : [];
    let figCursor = 0;
    for (let fIdx = 0; fIdx < aiFigures.length; fIdx++) {
      const fig = aiFigures[fIdx];
      const cap = String(fig?.caption || '').trim();
      const targetPage = Number(fig?.page) || 0;
      if (!cap) continue;
      let matchedIdx = -1;
      const figIdKey = String(fig?.block_id || '').trim().toUpperCase();
      if (figIdKey && idToIdx.has(figIdKey) && blocks[idToIdx.get(figIdKey)]?.type === 'image') {
        matchedIdx = idToIdx.get(figIdKey);
      }
      if (matchedIdx < 0) {
        for (let i = figCursor; i < blocks.length; i++) {
          if (consumedIndices.has(i) || blocks[i]?.type !== 'image') continue;
          const pgOk = !targetPage || !blocks[i].pageNo || Math.abs(Number(blocks[i].pageNo) - targetPage) <= 1;
          if (pgOk) {
            matchedIdx = i;
            figCursor = i + 1;
            break;
          }
        }
      }
      if (matchedIdx >= 0 && !blocks[matchedIdx].caption) {
        blocks[matchedIdx].caption = cap;
        stats.figuresCaptioned += 1;
      }
    }

    // 4. TẦNG 3B: Áp dụng Công thức Toán/Tài chính LaTeX theo `block_id` (ưu tiên) hoặc `anchor_text`/`rawAnchor`
    const aiFormulas = Array.isArray(bp.formulas) ? bp.formulas : [];
    const astLib = global.NoirDocAst || NS.docAst;
    for (const fm of aiFormulas) {
      const latex = String(fm?.latex || '').trim();
      if (!latex) continue;
      const mode = String(fm?.mode || '').toLowerCase();
      const rawAnchor = String(fm?.anchor_text || fm?.rawAnchor || '').trim();
      const bidKey = String(fm?.block_id || '').trim().toUpperCase();
      const readable = astLib?.latexToReadablePlain ? astLib.latexToReadablePlain(latex) : latex;

      if (bidKey && idToIdx.has(bidKey)) {
        const idx = idToIdx.get(bidKey);
        if (!consumedIndices.has(idx) && blocks[idx]) {
          if (mode === 'display' || blocks[idx].type === 'math_block' || (!rawAnchor && String(blocks[idx].text || '').length <= 140)) {
            blocks[idx] = {
              ...blocks[idx],
              type: 'math_block',
              latex,
              text: readable,
              aiLocated: true,
            };
          } else if (rawAnchor && typeof blocks[idx].text === 'string' && blocks[idx].text.includes(rawAnchor)) {
            const wrapped = /^\$/.test(latex) ? latex : `$${latex}$`;
            blocks[idx].text = blocks[idx].text.replace(rawAnchor, wrapped);
          } else if (typeof blocks[idx].text === 'string') {
            blocks[idx].latex = latex;
          }
          stats.formulasFixed += 1;
          continue;
        }
      }

      if (!rawAnchor) continue;
      for (let i = 0; i < blocks.length; i++) {
        if (consumedIndices.has(i)) continue;
        const b = blocks[i];
        if (!b || typeof b.text !== 'string') continue;
        if (b.text.includes(rawAnchor)) {
          if (mode === 'display' && b.text.trim() === rawAnchor) {
            blocks[i] = { ...b, type: 'math_block', latex, text: readable, aiLocated: true };
          } else {
            const wrapped = /^\$/.test(latex) ? latex : `$${latex}$`;
            blocks[i].text = b.text.replace(rawAnchor, wrapped);
          }
          stats.formulasFixed += 1;
          break;
        }
      }
    }

    // 5. Chuẩn hóa Ký tự đặc biệt bị vỡ font Unicode
    const aiSymbols = Array.isArray(bp.specialSymbols) ? bp.specialSymbols : [];
    for (const sym of aiSymbols) {
      const raw = String(sym?.rawText || '').trim();
      const uni = String(sym?.normalizedUnicode || '').trim();
      if (!raw || !uni || raw === uni) continue;
      for (let i = 0; i < blocks.length; i++) {
        if (consumedIndices.has(i)) continue;
        const b = blocks[i];
        if (!b || typeof b.text !== 'string') continue;
        if (b.text.includes(raw)) {
          blocks[i].text = b.text.split(raw).join(uni);
          stats.symbolsFixed += 1;
        }
      }
    }

    const finalBlocks = blocks.filter((_, idx) => !consumedIndices.has(idx));
    if (sourceBlocks?.__ast) finalBlocks.__ast = sourceBlocks.__ast;
    return { applied: true, blocks: finalBlocks, blueprint: bp, parseMeta, stats };
  }

  function applyBlueprintToBlocks(sourceBlocks, blueprintOrRawText) {
    return reconcileAiPatchIntoBlocks(sourceBlocks, blueprintOrRawText);
  }

  /**
   * TIỀN NHẬN DIỆN ẢNH THÔNG MINH CHO OCR & ICR (PURE CLIENT-SIDE DSP PIPELINE):
   * 1) Smart Auto-Crop cắt viền tối thừa quanh tài liệu chụp điện thoại
   * 2) Illumination / Shadow Normalization tẩy bóng & nền giấy ố vàng
   * 3) Auto-Deskew (±4° Projection Profile Variance) nắn thẳng trang nghiêng
   * 4) Percentile Local Contrast Stretch + 3x3 Unsharp Mask sắc nét dấu tiếng Việt & ô tick ☑/☐
   */
  function preprocessImageForOcrIcr(srcCanvas, opts = {}) {
    if (!srcCanvas || !srcCanvas.width || !srcCanvas.height) {
      return { canvas: srcCanvas, metrics: { deskewDeg: 0, cropped: false, sharpnessScore: 0 } };
    }
    const mode = opts.mode || 'ocr_print'; // 'ocr_print' | 'icr_handwriting'
    const enableDeskew = opts.deskew !== false;
    const enableAutoCrop = opts.autoCrop !== false;

    const w0 = srcCanvas.width;
    const h0 = srcCanvas.height;
    const work = document.createElement('canvas');
    work.width = w0;
    work.height = h0;
    const wctx = work.getContext('2d', { willReadFrequently: true });
    wctx.drawImage(srcCanvas, 0, 0);

    const img = wctx.getImageData(0, 0, w0, h0);
    const d = img.data;
    const nPx = w0 * h0;

    // Bước 1: Tính ảnh độ sáng xám + histogram phân vị 2%..98%
    const gray = new Uint8Array(nPx);
    const hist = new Uint32Array(256);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      gray[p] = g;
      hist[g] += 1;
    }

    // Bước 2: Ước lượng nền chiếu sáng cục bộ (Illumination Map 16x16) để khử bóng chụp nghiêng & nền vàng
    const bgW = 16;
    const bgH = 16;
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = bgW;
    bgCanvas.height = bgH;
    const bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true });
    bgCtx.drawImage(srcCanvas, 0, 0, bgW, bgH);
    const bgExpand = document.createElement('canvas');
    bgExpand.width = w0;
    bgExpand.height = h0;
    const bgExCtx = bgExpand.getContext('2d', { willReadFrequently: true });
    bgExCtx.imageSmoothingEnabled = true;
    bgExCtx.imageSmoothingQuality = 'high';
    bgExCtx.drawImage(bgCanvas, 0, 0, w0, h0);
    const bgData = bgExCtx.getImageData(0, 0, w0, h0).data;

    // Chuẩn hóa chiếu sáng: norm = (gray / max(localBg, 64)) * 248
    const normGray = new Uint8Array(nPx);
    const normHist = new Uint32Array(256);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const bgL = Math.max(70, Math.round(0.299 * bgData[i] + 0.587 * bgData[i + 1] + 0.114 * bgData[i + 2]));
      const val = Math.min(255, Math.max(0, Math.round((gray[p] / bgL) * 246)));
      normGray[p] = val;
      normHist[val] += 1;
    }

    // Bước 3: Percentile Contrast Stretch (2%..96%)
    let acc = 0;
    let lo = 15;
    let hi = 245;
    const loTarget = Math.floor(nPx * 0.015);
    const hiTarget = Math.floor(nPx * 0.96);
    for (let v = 0; v < 256; v++) {
      acc += normHist[v];
      if (acc >= loTarget && lo === 15) lo = v;
      if (acc >= hiTarget) { hi = Math.max(lo + 24, v); break; }
    }
    const span = Math.max(24, hi - lo);
    const stretched = new Uint8Array(nPx);
    for (let p = 0; p < nPx; p++) {
      let s = Math.round(((normGray[p] - lo) / span) * 255);
      if (mode === 'ocr_print') {
        s = s > 214 ? 255 : s < 118 ? Math.max(0, Math.round(s * 0.72)) : s;
      } else {
        // ICR chữ viết tay: giữ sắc thái nét mực nhẹ & ô tick không làm đứt nét
        s = s > 224 ? 255 : Math.max(0, Math.min(255, s));
      }
      stretched[p] = s;
    }

    // Bước 4: 3x3 Unsharp Mask nhẹ làm sắc dấu tiếng Việt & đo độ nét (Laplacian energy)
    const sharpAmt = mode === 'ocr_print' ? 0.65 : 0.45;
    let lapSum = 0;
    let lapCount = 0;
    for (let y = 1; y < h0 - 1; y++) {
      const row = y * w0;
      for (let x = 1; x < w0 - 1; x++) {
        const idx = row + x;
        const c = stretched[idx];
        const avg = (stretched[idx - 1] + stretched[idx + 1] + stretched[idx - w0] + stretched[idx + w0]) * 0.25;
        const diff = c - avg;
        const out = Math.min(255, Math.max(0, Math.round(c + diff * sharpAmt)));
        const di = idx * 4;
        d[di] = d[di + 1] = d[di + 2] = out;
        d[di + 3] = 255;
        if ((x & 3) === 0 && (y & 3) === 0) {
          lapSum += Math.abs(diff);
          lapCount += 1;
        }
      }
    }
    wctx.putImageData(img, 0, 0);
    const sharpnessScore = Math.min(100, Math.round((lapSum / Math.max(1, lapCount)) * 4.5));

    // Bước 5: Auto-Deskew nhẹ (±3.5°, bước 0.7°) qua phương sai hình chiếu ngang trên ảnh thu nhỏ 200px
    let bestAngle = 0;
    let outCanvas = work;
    if (enableDeskew && w0 >= 240 && h0 >= 240) {
      const sw = 180;
      const sh = Math.max(120, Math.round((h0 / w0) * sw));
      const probe = document.createElement('canvas');
      probe.width = sw;
      probe.height = sh;
      const pctx = probe.getContext('2d', { willReadFrequently: true });
      let bestVar = -1;
      for (let deg = -3.5; deg <= 3.51; deg += 0.7) {
        pctx.fillStyle = '#ffffff';
        pctx.fillRect(0, 0, sw, sh);
        pctx.save();
        pctx.translate(sw / 2, sh / 2);
        pctx.rotate((deg * Math.PI) / 180);
        pctx.drawImage(work, -sw / 2, -sh / 2, sw, sh);
        pctx.restore();
        const pd = pctx.getImageData(0, 0, sw, sh).data;
        let sum = 0;
        let sumSq = 0;
        for (let y = 8; y < sh - 8; y++) {
          let rowInk = 0;
          for (let x = 8; x < sw - 8; x++) {
            if (pd[(y * sw + x) * 4] < 160) rowInk += 1;
          }
          sum += rowInk;
          sumSq += rowInk * rowInk;
        }
        const rowsN = Math.max(1, sh - 16);
        const mean = sum / rowsN;
        const variance = sumSq / rowsN - mean * mean;
        if (variance > bestVar) {
          bestVar = variance;
          bestAngle = Number(deg.toFixed(1));
        }
      }
      if (Math.abs(bestAngle) >= 0.7) {
        const rot = document.createElement('canvas');
        rot.width = w0;
        rot.height = h0;
        const rctx = rot.getContext('2d');
        rctx.fillStyle = '#ffffff';
        rctx.fillRect(0, 0, w0, h0);
        rctx.translate(w0 / 2, h0 / 2);
        rctx.rotate((bestAngle * Math.PI) / 180);
        rctx.drawImage(work, -w0 / 2, -h0 / 2);
        outCanvas = rot;
      }
    }

    // Bước 6: Smart Auto-Crop viền trống thừa (giữ lại lề an toàn 14px)
    let cropped = false;
    if (enableAutoCrop && outCanvas.width >= 300 && outCanvas.height >= 300) {
      const octx = outCanvas.getContext('2d', { willReadFrequently: true });
      const od = octx.getImageData(0, 0, outCanvas.width, outCanvas.height).data;
      let minX = outCanvas.width, minY = outCanvas.height, maxX = 0, maxY = 0;
      const step = 4;
      for (let y = 0; y < outCanvas.height; y += step) {
        for (let x = 0; x < outCanvas.width; x += step) {
          if (od[(y * outCanvas.width + x) * 4] < 210) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      const pad = 16;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(outCanvas.width - 1, maxX + pad);
      maxY = Math.min(outCanvas.height - 1, maxY + pad);
      const cw = maxX - minX + 1;
      const ch = maxY - minY + 1;
      const areaRatio = (cw * ch) / Math.max(1, outCanvas.width * outCanvas.height);
      if (cw > 180 && ch > 180 && areaRatio >= 0.35 && areaRatio <= 0.90) {
        const cropCv = document.createElement('canvas');
        cropCv.width = cw;
        cropCv.height = ch;
        cropCv.getContext('2d').drawImage(outCanvas, minX, minY, cw, ch, 0, 0, cw, ch);
        outCanvas = cropCv;
        cropped = true;
      }
    }

    return {
      canvas: outCanvas,
      metrics: {
        deskewDeg: bestAngle,
        cropped,
        sharpnessScore,
        width: outCanvas.width,
        height: outCanvas.height,
      },
    };
  }

  /**
   * Chuẩn hóa phản hồi OCR / ICR từ JSON response_schema HOẶC văn bản/Markdown dán thủ công
   */
  function parseStructuredOcrIcrReply(rawReply, mode = 'ocr') {
    const rawStr = String(rawReply || '').trim();
    const obj = extractJsonObjectFromText(rawStr);
    if (obj && Array.isArray(obj.pages) && obj.pages.length > 0) {
      const pageTexts = [];
      const allTables = [];
      for (const pg of obj.pages) {
        const pNo = pg.pageNumber || (pageTexts.length + 1);
        const lines = [];
        if (pg.fullText && String(pg.fullText).trim()) {
          lines.push(String(pg.fullText).trim());
        } else if (Array.isArray(pg.blocks)) {
          pg.blocks.forEach((b) => {
            if (b?.latex) lines.push(`$$${b.latex}$$`);
            else if (b?.text) lines.push(String(b.text).trim());
          });
        } else if (Array.isArray(pg.items)) {
          pg.items.forEach((it) => {
            const cb = it?.checkboxState === 'checked' ? '[☑] ' : it?.checkboxState === 'unchecked' ? '[☐] ' : '';
            const note = it?.uncertainNote ? ` [${it.uncertainNote}]` : '';
            if (it?.latex) lines.push(`${cb}$${it.latex}$${note}`);
            else if (it?.text) lines.push(`${cb}${String(it.text).trim()}${note}`);
          });
        }
        if (Array.isArray(pg.tables)) {
          pg.tables.forEach((tb) => {
            if (Array.isArray(tb?.rows) && tb.rows.length) {
              allTables.push({ page: pNo, caption: tb.caption || '', rows: tb.rows });
            }
          });
        }
        pageTexts.push(obj.pages.length > 1 ? `--- TRANG ${pNo} ---\n${lines.join('\n')}` : lines.join('\n'));
      }
      return {
        isStructuredJson: true,
        detectedLanguage: obj.detectedLanguage || obj.documentType || mode,
        pages: obj.pages,
        tables: allTables,
        fullText: pageTexts.join('\n\n').trim(),
      };
    }
    return {
      isStructuredJson: false,
      detectedLanguage: mode,
      pages: [{ pageNumber: 1, fullText: rawStr }],
      tables: [],
      fullText: rawStr,
    };
  }

  /**
   * GỌI AI CHỈ ĐỂ ĐỊNH VỊ BẢN ĐỒ CẤU TRÚC (BLUEPRINT LOCATOR) VỚI response_schema JSON
   * AI không viết lại văn bản thường -> Nhanh gấp 5 lần, 0 mất chữ, 0 lỗi mục lục/bảng/hình/công thức!
   */
  async function runAiBlueprintLocator(sourceBlocks, opts = {}) {
    const {
      apiKey = getApiKey(),
      fileBytes = null,
      mimeType = '',
      fileName = 'Tai_lieu',
      confidenceMatrix = null,
      onProgress = null,
    } = opts;
    const cleanKey = String(apiKey || '').trim();
    if (!cleanKey) throw new Error('NO_API_KEY');

    if (typeof onProgress === 'function') {
      onProgress(28, '🧠 Gemini 3.8 Flash đang lập Bản đồ Cấu trúc Block-ID (pdf_magic_v1)...');
    }

    const skel = buildCompactSkeletonForAi(sourceBlocks, {
      confidenceMatrix: confidenceMatrix || sourceBlocks?.__ast?.meta?.confidenceMatrix || null,
      maxBlocks: 340,
      maxChars: 17500,
    });

    const prompt = buildTaskManualPrompt('theme10_beautify', { fileName, text: skel.skeletonText });
    const parts = [{ text: prompt }];
    if (fileBytes && fileBytes.byteLength > 0 && fileBytes.byteLength <= 18 * 1024 * 1024 && mimeType) {
      parts.push({ inlineData: { mimeType, data: uint8ToBase64(fileBytes) } });
    }

    const rawJson = await callGeminiGenerateContent({
      parts,
      apiKey: cleanKey,
      taskType: 'doc_multimodal',
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseSchema: RESPONSE_SCHEMAS.THEME10_BLUEPRINT,
      responseMimeType: 'application/json',
    });

    if (typeof onProgress === 'function') {
      onProgress(82, '⚙️ Bộ Hợp nhất 3 Tầng đang khớp Block-ID Pxx_Byy lên 100% văn bản gốc...');
    }
    const merged = reconcileAiPatchIntoBlocks(skel.taggedBlocks, rawJson);
    if (merged.applied && merged.blocks) {
      merged.blocks.__reconcileStats = merged.stats;
      merged.blocks.__parseMeta = merged.parseMeta;
      return merged.blocks;
    }
    return skel.taggedBlocks;
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
      fileName = 'Tai_lieu.pdf',
    } = opts;
    const tagged = tagBlocksWithDeterministicIds(Array.isArray(blocks) ? blocks : []);
    const codeLines = typeof codeTocBuilder === 'function' ? (codeTocBuilder(tagged) || []) : [];

    const cleanKey = String(apiKey || '').trim();
    if (!cleanKey) {
      return codeLines;
    }

    const skel = buildCompactSkeletonForAi(tagged, {
      confidenceMatrix: blocks?.__ast?.meta?.confidenceMatrix || null,
      maxBlocks: 280,
      maxChars: 14000,
    });
    if (!skel.skeletonText && !codeLines.length) return [];

    try {
      const prompt = buildTaskManualPrompt('auto_toc', {
        fileName,
        text: `--- KẾT QUẢ MÃ THUẦN (CODE) ---\n${codeLines.slice(0, 80).join('\n')}\n\n--- KHUNG XƯƠNG BLOCK-ID (Pxx_Byy) ---\n${skel.skeletonText}`,
      });
      const rawOut = await callGeminiGenerateContent({
        parts: [{ text: prompt }],
        apiKey: cleanKey,
        taskType: 'fast_light',
        temperature: 0.1,
        maxOutputTokens: 4096,
        responseSchema: RESPONSE_SCHEMAS.AUTO_TOC,
        responseMimeType: 'application/json',
      });
      const parsed = parseAiStructuralPatchTolerant(rawOut);
      const list = Array.isArray(parsed.data?.entries)
        ? parsed.data.entries
        : (Array.isArray(parsed.data?.headings) ? parsed.data.headings : extractJsonArrayFromText(rawOut));
      if (Array.isArray(list) && list.length) {
        const finalOut = [];
        const seen = new Set();
        for (const item of list) {
          const title = String(item?.clean_title || item?.title || item?.text || '').replace(/\s+/g, ' ').trim();
          const pg = parseInt(item?.page, 10);
          const lvl = Math.max(1, Math.min(4, Number(item?.level || 1)));
          if (!title || /\.{3,}\s*\d{1,4}\s*$/.test(title)) continue;
          if (!Number.isFinite(pg) || pg < 1 || pg > Math.max(1, maxPage)) continue;
          const sig = `${title.toLowerCase()}|${pg}`;
          if (seen.has(sig)) continue;
          seen.add(sig);
          const indent = lvl >= 2 ? '  '.repeat(Math.min(2, lvl - 1)) : '';
          finalOut.push(`${indent}${title} | ${pg}`);
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
          'BẠN LÀ BỘ ĐỊNH VỊ CẤU TRÚC TÀI LIỆU (AI-LOCATOR · PDF MAGIC V1) PHỐI HỢP VỚI CODE CỦA ĐĂNGLOVEPDF.',
          '⚠️ QUY TẮC SỐNG CÒN: TUYỆT ĐỐI KHÔNG viết lại toàn bộ văn bản từ A đến Z! Code đã trích xuất nguyên vẹn 100% văn xuôi và gắn mã định danh khối `[Pxx_Byy]` cho từng dòng.',
          'Bạn CHỈ trả về ĐÚNG 1 đối tượng JSON chuẩn (`pdf_magic_v1`) chứa chỉ mục định vị chính xác theo mã khối `Pxx_Byy` để Bộ Hợp Nhất 3 Tầng của Code dựng PDF không vỡ:',
          '',
          `TỆP ĐÍNH KÈM: "${fileName}".`,
          'HÃY TRẢ VỀ ĐÚNG 1 KHỐI JSON THEO SCHEMA SAU (KHÔNG thêm văn bản giải thích ngoài JSON):',
          '```json',
          '{',
          '  "schema_version": "pdf_magic_v1",',
          '  "document_meta": { "title": "Tên tài liệu chính", "subtitle": "Phụ đề/Tổ chức (nếu có)", "language": "vi", "has_toc_pages": [2] },',
          '  "headings": [',
          '    { "page": 1, "level": 1, "block_ids": ["P01_B01"], "anchor_text": "6-10 từ đầu gốc", "clean_title": "CHƯƠNG 1. ..." },',
          '    { "page": 4, "level": 2, "block_ids": ["P04_B02", "P04_B03"], "anchor_text": "2.1 Phân tích...", "clean_title": "2.1. Phân tích đa chiều (gộp đủ 2 dòng bị gãy thành 1 tiêu đề sạch)" }',
          '  ],',
          '  "tables": [',
          '    { "table_id": "T1", "page": 5, "caption_block": "P05_B04", "caption": "Bảng 1: Tên bảng (tự đặt chuẩn khoa học nếu gốc chưa có)", "start_block": "P05_B05", "header_rows": 1, "continued_from_prev": false, "headers": ["Cột 1", "Cột 2"] }',
          '  ],',
          '  "figures": [',
          '    { "page": 6, "block_id": "P06_B03", "caption": "Hình 1: Tên hình/biểu đồ (tự đặt nếu chưa có)", "nearAnchor": "đoạn ngay sát hình" }',
          '  ],',
          '  "formulas": [',
          '    { "page": 4, "block_id": "P04_B08", "mode": "display", "anchor_text": "chuỗi công thức thô bị vỡ", "latex": "WACC = \\\\frac{E}{V} R_e + \\\\frac{D}{V} R_d (1 - T_c)" }',
          '  ],',
          '  "specialSymbols": [',
          '    { "page": 4, "rawText": "chuỗi ký tự vỡ font", "normalizedUnicode": "≥ / ≤ / × / → / Δ / ±" }',
          '  ],',
          '  "drop_blocks": ["P02_B01", "P03_B19"]',
          '}',
          '```',
          '- Quy tắc bắt buộc:',
          '  1. Nếu 1 tiêu đề bị gãy thành 2-3 khối liên tiếp (VD `P04_B02` + `P04_B03`), liệt kê TẤT CẢ vào `block_ids[]` và ghi tên đầy đủ vào `clean_title` để Code tự gộp & xóa sạch dòng đuôi mồ côi!',
          '  2. Nếu 1 bảng kéo dài sang trang sau, đánh `"continued_from_prev": true` ở mảnh trang sau để Code nối liền 1 bảng duy nhất.',
          '  3. Đưa mã khối rác (số trang cũ, watermark, dòng mục lục chấm `.....55`) vào `drop_blocks[]` và số trang mục lục cũ vào `has_toc_pages[]`.',
          '  4. KHÔNG biến các bước tính số (`1. EBIT = 62.500`) thành heading; giữ nguyên tiền tệ `$28.40` (không đưa vào `formulas`).',
          rawText ? `\n--- KHUNG XƯƠNG TÀI LIỆU KÈM MÃ KHỐI Pxx_Byy DO CODE ĐÃ QUÉT ---\n${rawText.slice(0, 17500)}` : '',
        ].filter(Boolean).join('\n');

      case 'auto_toc':
        return [
          'Bạn là bộ tạo Mục Lục tự động (Auto TOC · Block-ID Pxx_Byy) của hệ thống ĐăngLovePDF.',
          `Tệp: "${fileName}".`,
          'YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (chọn 1 trong 2 định dạng chuẩn sau để code đọc tức thì):',
          '- Ưu tiên 1 (JSON chuẩn): `{"entries": [{"title": "CHƯƠNG 1. MỞ ĐẦU", "level": 1, "page": 3}, {"title": "1.1. Bối cảnh", "level": 2, "page": 4}]}`',
          '- Hoặc dạng dòng: `Tên mục | Số trang` (ví dụ: `CHƯƠNG 1. MỞ ĐẦU | 3`).',
          '- Gộp trọn vẹn các tiêu đề bị gãy xuống 2 dòng thành 1 tên mục hoàn chỉnh; giữ đúng phân cấp Chương, Phần, I., II., 1., 1.1., 1.1.1.',
          '- TUYỆT ĐỐI LOẠI BỎ các dòng mục lục cũ có dấu chấm kéo dài (như `KHẢO........55`), tên Bảng/Hình, số trang và đoạn văn thường.',
          '- Không viết giải thích ngoài danh sách/JSON.',
          rawText ? `\n--- KHUNG XƯƠNG ỨNG VIÊN TIÊU ĐỀ (Pxx_Byy) ---\n${rawText.slice(0, 14000)}` : '',
        ].filter(Boolean).join('\n');

      case 'icr_handwriting': {
        const modeDesc = {
          handwriting_general: 'Đọc chính xác 100% chữ viết tay tiếng Việt & Anh, giữ đúng đề mục, gạch đầu dòng, ngày tháng.',
          table_survey_checkbox: 'Đọc toàn bộ phiếu khảo sát/bảng viết tay, đánh dấu checkboxState là "checked" (☑) hoặc "unchecked" (☐), tách bảng vào mảng tables[].rows[][].',
          medical_rx_form: 'Đọc kỹ đơn thuốc, tên thuốc, liều lượng, ghi chú bác sĩ hoặc hóa đơn viết tay. Chữ quá mờ ghi rõ trong uncertainNote.',
          math_notes_latex: 'Chuyển toàn bộ công thức Toán/Tài chính viết tay sang trường latex chuẩn kèm lời giải chữ viết tay.',
        };
        return [
          'Bạn là chuyên gia ICR (Intelligent Character Recognition) đọc chữ viết tay phối hợp với Code của ĐăngLovePDF.',
          `Tệp viết tay tôi đính kèm: "${fileName}".`,
          `CHẾ ĐỘ: ${modeDesc[ctx.icrMode] || modeDesc.handwriting_general}`,
          'ĐỊNH DẠNG BẮT BUỘC (JSON chuẩn để Code đọc thẳng vào DOCX / XLSX / PDF):',
          '```json',
          '{ "documentType": "handwriting", "pages": [{ "pageNumber": 1, "confidence": 0.98, "items": [{ "type": "heading|paragraph|checkbox|formula", "text": "...", "checkboxState": "checked|unchecked|none", "latex": "", "uncertainNote": "" }], "tables": [{ "caption": "Bảng 1", "rows": [["Cột 1", "Cột 2"]] }], "fullText": "Toàn văn đã số hóa đầy đủ dấu tiếng Việt" }] }',
          '```',
          'QUY TẮC: Không tóm tắt, không bỏ sót bất kỳ chữ nào. Chỉ trả đúng khối JSON trên.',
        ].join('\n');
      }

      case 'ocr_fast':
        return [
          'Bạn là động cơ OCR siêu chính xác phối hợp với Code của ĐăngLovePDF.',
          `Hãy đọc toàn bộ tệp PDF/Ảnh scan tôi đính kèm ("${fileName}") và trả về ĐÚNG 1 khối JSON chuẩn (response_schema) để Code tự dựng DOCX / MD / TXT / PDF 2 lớp:`,
          '```json',
          '{ "detectedLanguage": "vi", "pages": [{ "pageNumber": 1, "confidence": 0.99, "blocks": [{ "type": "heading|paragraph|table|formula", "text": "...", "latex": "" }], "fullText": "Toàn văn trang 1 đầy đủ dấu tiếng Việt, giữ bảng GFM" }] }',
          '```',
          'Không thêm lời giải thích ngoài JSON; giữ nguyên 100% số liệu & dấu tiếng Việt.',
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
    RESPONSE_SCHEMAS,
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
    tagBlocksWithDeterministicIds,
    buildCompactSkeletonForAi,
    parseAiStructuralPatchTolerant,
    reconcileAiPatchIntoBlocks,
    extractJsonObjectFromText,
    applyBlueprintToBlocks,
    runAiBlueprintLocator,
    preprocessImageForOcrIcr,
    parseStructuredOcrIcrReply,
    runAiFormatDocumentToAst,
    runAiAndCodeAutoToc,
    stitchContinueTables,
    runGeminiNativeFastRead,
    runGeminiVisionDeepRead,
  });

  NS.geminiBridge = exported;
  global.NoirGeminiBridge = exported;
})(typeof window !== 'undefined' ? window : globalThis);
