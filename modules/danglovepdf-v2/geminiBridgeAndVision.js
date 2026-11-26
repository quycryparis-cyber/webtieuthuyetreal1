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
  const API_COOKIE_NAME = 'noir_gemini_api_key_ck';
  const IDB_BACKUP_KEY = '__noir_persist_api_key_v1';
  const DEFAULT_VISION_MODELS = Object.freeze([
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
  ]);

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
    const clean = String(rawKey || '').trim();
    const fetchImpl = opts.fetchImpl || global.fetch?.bind(global);
    if (!clean) {
      return { ok: false, message: 'Vui lòng nhập mã Gemini API Key.' };
    }
    if (!/^AIza[0-9A-Za-z_-]{20,}$/.test(clean)) {
      return { ok: false, message: 'Định dạng API Key không hợp lệ (Gemini API Key thật luôn bắt đầu bằng "AIza" và dài ~39 ký tự).' };
    }
    if (global.__NOIR_TEST_BYPASS_KEY_VERIFY === true) {
      return { ok: true, modelEndpoint: 'gemini-2.5-flash-lite', message: 'Key hợp lệ (chế độ test).' };
    }
    // Ưu tiên tái sử dụng trình xác minh thật của màn hình chính (mod15) nếu đang ở Web gốc
    if (!opts.forceDirect && NS.apiClient && typeof NS.apiClient.verifyKeyWithLowestFlashLite === 'function') {
      try {
        const res = await NS.apiClient.verifyKeyWithLowestFlashLite(clean, { autoSave: false, emitEvents: true });
        if (res?.ok || res?.verified) {
          return {
            ok: true,
            modelEndpoint: res.modelEndpoint || 'gemini-2.5-flash-lite',
            message: `Đã xác minh thành công với Google Gemini (${res.modelEndpoint || 'Flash-Lite'})!`,
          };
        }
        return { ok: false, message: res?.message || 'API Key không hợp lệ hoặc đã bị vô hiệu hóa trên Google AI Studio.' };
      } catch (_eMod15) {
        // fallback sang kiểm tra trực tiếp bên dưới
      }
    }
    if (typeof fetchImpl !== 'function') {
      return { ok: false, message: 'Trình duyệt không hỗ trợ kết nối mạng để xác minh API Key.' };
    }

    // Bước 1: Kiểm tra tồn tại Key qua danh sách model thật từ Google
    let discoveredFlash = [];
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=25&key=${encodeURIComponent(clean)}`;
      const listRes = await fetchImpl(listUrl, { method: 'GET' });
      if (!listRes.ok) {
        const errText = await listRes.text().catch(() => '');
        if (listRes.status === 400 || listRes.status === 401 || listRes.status === 403) {
          return {
            ok: false,
            status: listRes.status,
            message: `API Key không hợp lệ hoặc không có quyền truy cập (HTTP ${listRes.status}). Hãy kiểm tra lại trên Google AI Studio.`,
          };
        }
        return { ok: false, status: listRes.status, message: `Lỗi kết nối Google API (HTTP ${listRes.status}): ${errText.slice(0, 120)}` };
      }
      const listJson = await listRes.json().catch(() => ({}));
      const modelsArr = Array.isArray(listJson?.models) ? listJson.models : [];
      discoveredFlash = modelsArr
        .map((m) => String(m?.name || '').replace(/^models\//, ''))
        .filter((n) => /gemini-2\.[05]-flash/i.test(n) && !/image|tts|audio|live|thinking/i.test(n));
    } catch (netErr) {
      return { ok: false, message: `Không thể kết nối tới Google Gemini (${netErr?.message || 'Mất mạng'}). Vui lòng kiểm tra Internet.` };
    }

    // Bước 2: Ping thử 8 token với model nhẹ nhất để chắc chắn Key gọi generateContent sống 100%
    const probeChain = Array.from(new Set([...discoveredFlash, 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash']));
    let lastStatus = 0;
    for (const ep of probeChain.slice(0, 4)) {
      try {
        const pingUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(ep)}:generateContent?key=${encodeURIComponent(clean)}`;
        const pingRes = await fetchImpl(pingUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'OK' }] }],
            generationConfig: { maxOutputTokens: 4, temperature: 0 },
          }),
        });
        if (pingRes.ok) {
          return { ok: true, modelEndpoint: ep, message: `Xác minh thành công (${ep}) — Key đang hoạt động tốt!` };
        }
        lastStatus = pingRes.status;
        if (pingRes.status === 429) {
          // 429 nghĩa là Key TỒN TẠI & HỢP LỆ nhưng tạm chạm giới hạn RPM
          return { ok: true, modelEndpoint: ep, rateLimited: true, message: `Key hợp lệ (${ep}, đang tạm chạm giới hạn phút — hệ thống sẽ tự chờ thử lại khi chạy).` };
        }
        if (pingRes.status === 400 || pingRes.status === 401 || pingRes.status === 403) {
          const eTxt = await pingRes.text().catch(() => '');
          if (/API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(eTxt)) {
            return { ok: false, status: pingRes.status, message: 'API Key bị Google từ chối (Key không tồn tại hoặc đã bị thu hồi).' };
          }
        }
      } catch (_ePing) {}
    }
    if (discoveredFlash.length > 0) {
      return { ok: true, modelEndpoint: discoveredFlash[0], message: `Đã xác minh API Key tồn tại (${discoveredFlash[0]})!` };
    }
    return { ok: false, status: lastStatus, message: `Không thể xác minh API Key với Gemini (HTTP ${lastStatus || 'ERR'}). Hãy tạo lại Key mới tại Google AI Studio.` };
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
              <input id="noir-gkey-input" type="password" autocomplete="off" placeholder="AIzaSy..." class="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs font-mono" />
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
      models = DEFAULT_VISION_MODELS,
      temperature = 0.2,
      maxOutputTokens = 8192,
      useGoogleSearch = false,
      signal = null,
      fetchImpl = global.fetch?.bind(global),
      onRetry = null,
    } = opts;

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

    for (const modelName of models) {
      for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
        if (signal?.aborted) throw new Error('Đã hủy yêu cầu Gemini API.');
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        try {
          const res = await fetchImpl(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
              throw lastErr; // Lỗi key / payload không thử lặp lại vô ích
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
          return textOut;
        } catch (err) {
          if (signal?.aborted) throw err;
          lastErr = err;
          if (/HTTP 40[013]/.test(String(err?.message || ''))) throw err;
          break;
        }
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
      models = DEFAULT_VISION_MODELS,
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

    const modelList = Array.isArray(models) && models.length ? models : DEFAULT_VISION_MODELS;
    // Nếu useGoogleSearch = true, thử trước CÓ Google Search; nếu toàn bộ bị từ chối/HTTP 400/429 thì tự động hạ cấp KHÔNG tools để đảm bảo vẫn chạy thành công 100%!
    const searchPasses = useGoogleSearch ? [true, false] : [false];
    let lastErr = null;
    for (const trySearch of searchPasses) {
      const bodyPayload = buildPayload(trySearch);
      for (let mi = 0; mi < modelList.length; mi++) {
        const model = modelList[mi];
        for (let attempt = 0; attempt < 2; attempt++) {
          if (signal && signal.aborted) {
            throw new Error('ABORTED');
          }
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cleanKey)}`;
            const res = await fetchImpl(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
              if (res.status === 401 || (res.status === 400 && /API_KEY_INVALID|API key not valid/i.test(errTxt))) {
                throw new Error('API Key không hợp lệ hoặc đã bị thu hồi! Hãy bấm Đổi API Key và xác minh lại.');
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
            return { text, groundingUrls, model, usedGrounding: trySearch, raw: json };
          } catch (err) {
            if (err?.name === 'AbortError' || signal?.aborted || /API Key không hợp lệ/i.test(err?.message || '')) throw err;
            lastErr = err;
            if (attempt === 0) {
              await new Promise((r) => setTimeout(r, 650));
              continue;
            }
          }
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
        if (spinEl) spinEl.style.display = 'none';
        if (titleEl) { titleEl.style.color = '#fda4af'; titleEl.textContent = String(errTitle || '⚠️ AI gặp lỗi khi xử lý'); }
        if (subEl) { subEl.style.color = '#fecdd3'; subEl.textContent = String(errDetail || 'Vui lòng kiểm tra lại API Key hoặc kết nối mạng.'); }
        if (barEl) barEl.style.background = '#f43f5e';
        if (actEl) {
          actEl.style.display = 'flex';
          actEl.innerHTML = '';
          const mkBtn = (txt, bg, cb) => {
            const b = doc.createElement('button');
            b.type = 'button';
            b.textContent = txt;
            b.style.cssText = `padding:9px 14px;border-radius:11px;border:none;background:${bg};color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;`;
            b.addEventListener('click', cb);
            actEl.appendChild(b);
          };
          if (typeof handlers.onRetry === 'function') {
            mkBtn('🔄 Thử lại ngay', '#059669', () => { overlay.remove(); handlers.onRetry(); });
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
        <input id="noir-upsell-api-input" type="password" autocomplete="off" placeholder="Dán mã API Key (AIzaSy...) vào đây" style="width:100%;padding:11px 13px;margin-bottom:10px;border-radius:12px;border:1px solid rgba(148,163,184,0.35);background:#090d16;color:#f8fafc;font-size:13px;box-sizing:border-box;" />
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

  const exported = Object.freeze({
    API_STORAGE_KEY,
    PROMPT_CHINH_TIEU_DE_CHUAN,
    DEFAULT_VISION_MODELS,
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
