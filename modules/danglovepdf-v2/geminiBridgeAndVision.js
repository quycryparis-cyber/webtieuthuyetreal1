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
  const DEFAULT_VISION_MODELS = Object.freeze(['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash']);

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
  // 1. QUẢN LÝ API KEY DÙNG CHUNG (LOCALSTORAGE + STORAGE EVENT CROSS-TAB)
  // ==========================================================================
  function getApiKey() {
    try {
      const direct = String(global.localStorage?.getItem(API_STORAGE_KEY) || '').trim();
      if (direct) return direct;
      const fromDom = String(global.document?.getElementById?.('api-key-input')?.value || '').trim();
      return fromDom;
    } catch (_e) {
      return '';
    }
  }

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

  function setApiKey(rawKey) {
    const clean = String(rawKey || '').trim();
    try {
      if (clean) global.localStorage?.setItem(API_STORAGE_KEY, clean);
      else global.localStorage?.removeItem(API_STORAGE_KEY);
    } catch (_eLs) {}
    notifyKeyListeners(clean);
    return clean;
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
          <div class="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" class="text-amber-300 hover:underline font-bold">🔑 Lấy API Key miễn phí tại Google AI Studio ↗</a>
            ${current ? '<span class="text-emerald-400 font-bold">● Đang có Key đã lưu</span>' : '<span class="text-zinc-400">○ Chưa có Key</span>'}
          </div>
        </div>
        <div class="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <button type="button" id="noir-gkey-clear" class="px-3 py-2 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold cursor-pointer">🗑️ Xóa Key</button>
          <div class="flex items-center gap-2">
            <button type="button" id="noir-gkey-cancel" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer">Hủy</button>
            <button type="button" id="noir-gkey-save" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">💾 Lưu &amp; Đồng bộ ngay</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const inp = modal.querySelector('#noir-gkey-input');
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
    modal.querySelector('#noir-gkey-save')?.addEventListener('click', () => {
      const val = String(inp?.value || '').trim();
      if (!val || val.length < 12) {
        NS.utils?.showToast?.('Vui lòng nhập Gemini API Key hợp lệ (bắt đầu bằng AIza...).', 'warning', 3200);
        inp?.focus();
        return;
      }
      setApiKey(val);
      NS.utils?.showToast?.('✅ Đã lưu & đồng bộ Gemini API Key toàn ứng dụng!', 'success', 3200);
      close();
      if (typeof onSaved === 'function') onSaved(val);
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

  async function runGeminiVisionDeepRead(fileObj, opts = {}) {
    const {
      ensurePdfJs,
      apiKey = getApiKey(),
      onProgress = () => {},
      signal = null,
      maxPages = 30,
    } = opts;

    if (!apiKey) throw new Error('Chưa có Gemini API Key để chạy Gemini Vision.');
    if (typeof ensurePdfJs !== 'function') throw new Error('Thiếu ensurePdfJs để render trang PDF.');
    if (typeof document === 'undefined') throw new Error('Gemini Vision yêu cầu môi trường trình duyệt có Canvas.');

    const pdfjsLib = await ensurePdfJs();
    const bytesCopy = fileObj?.bytes?.slice ? fileObj.bytes.slice(0) : fileObj.bytes;
    const pdfDoc = await pdfjsLib.getDocument({ data: bytesCopy }).promise;
    const totalP = Math.min(pdfDoc.numPages || 1, maxPages);

    const batches = [];
    for (let p = 1; p <= totalP; p += 2) {
      batches.push(p + 1 <= totalP ? [p, p + 1] : [p]);
    }

    const mdChunks = [];
    for (let bi = 0; bi < batches.length; bi++) {
      if (signal?.aborted) throw new Error('Đã dừng Gemini Vision.');
      const pageNums = batches[bi];
      const pct = Math.min(90, Math.round(((bi + 0.3) / batches.length) * 85) + 5);
      onProgress(pct, `Gemini Vision đang đọc trang ${pageNums.join('-')} / ${totalP}...`);

      const imgs = await renderPdfPageBatchToJpegBase64(pdfDoc, pageNums, 1.8);
      const batchPrompt = [
        PROMPT_CHINH_TIEU_DE_CHUAN,
        '',
        `Đây là trang ${pageNums.join(' và ')} trong tổng số ${totalP} trang của tài liệu "${fileObj.name || 'document.pdf'}".`,
        'Hãy trích xuất chính xác 100% nội dung trên các ảnh trang này sang Markdown chuẩn. Nếu có bảng bị cắt ở mép cuối trang đầu và tiếp tục ở đầu trang sau, chèn đúng 1 dòng `<!-- CONTINUE_TABLE -->` ở điểm nối. Không thêm lời bình mở đầu/kết thúc.',
      ].join('\n');

      const parts = [
        { text: batchPrompt },
        ...imgs.map((im) => ({ inlineData: { mimeType: im.mimeType, data: im.base64 } })),
      ];

      const mdOut = await callGeminiGenerateContent({
        parts,
        apiKey,
        temperature: 0.15,
        maxOutputTokens: 8192,
        signal,
        onRetry: ({ modelName, waitMs }) => {
          onProgress(pct, `API giới hạn tốc độ (${modelName}), đang chờ ${(waitMs / 1000).toFixed(1)}s thử lại...`);
        },
      });
      mdChunks.push(mdOut);
    }

    onProgress(94, 'Đang khâu bảng vắt trang & dựng Document AST...');
    const rawCombined = mdChunks.join('\n\n');
    const stitchedMd = stitchContinueTables(rawCombined);

    const parsers = global.NoirStructuredParsers || NS.structuredParsers;
    const astLib = global.NoirDocAst || NS.docAst;
    if (!parsers || !astLib) {
      throw new Error('Thiếu structuredParsers.js hoặc documentAst.js để phân tích kết quả Vision.');
    }
    const ast = parsers.parseMarkdownToAst(stitchedMd, {
      filename: fileObj?.name || 'vision_doc.pdf',
      sourceFormat: 'pdf-vision',
    });
    const blocks = astLib.astToLegacyBlocks(ast);
    onProgress(100, `Gemini Vision hoàn tất (${totalP} trang)!`);
    return { markdown: stitchedMd, ast, blocks, pageCount: totalP };
  }

  const exported = Object.freeze({
    API_STORAGE_KEY,
    PROMPT_CHINH_TIEU_DE_CHUAN,
    DEFAULT_VISION_MODELS,
    getApiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
    copyTextToClipboard,
    copyStandardPrompt,
    openPromptPreviewModal,
    openApiKeyQuickModal,
    watchClipboardReturn,
    callGeminiGenerateContent,
    callGeminiText,
    stitchContinueTables,
    runGeminiVisionDeepRead,
  });

  NS.geminiBridge = exported;
  global.NoirGeminiBridge = exported;
})(typeof window !== 'undefined' ? window : globalThis);
