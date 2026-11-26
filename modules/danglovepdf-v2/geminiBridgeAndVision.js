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
    const bodyPayload = {
      contents: [{ role: 'user', parts: finalParts }],
      generationConfig: { temperature, maxOutputTokens },
    };
    if (systemInstruction) {
      bodyPayload.systemInstruction = { parts: [{ text: String(systemInstruction) }] };
    }
    if (useGoogleSearch) {
      bodyPayload.tools = [{ google_search: {} }];
    }

    const modelList = Array.isArray(models) && models.length ? models : DEFAULT_VISION_MODELS;
    let lastErr = null;
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
            lastErr = new Error(`HTTP ${res.status} (${model}): ${errTxt.slice(0, 200)}`);
            if ((res.status === 429 || res.status === 503) && attempt === 0) {
              if (typeof onRetry === 'function') onRetry({ model, attempt, status: res.status });
              await new Promise((r) => setTimeout(r, 900 + Math.floor(Math.random() * 500)));
              continue;
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
          return { text, groundingUrls, model, raw: json };
        } catch (err) {
          if (err?.name === 'AbortError' || signal?.aborted) throw err;
          lastErr = err;
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 700));
            continue;
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
      <div style="max-width:460px;width:100%;background:linear-gradient(145deg,#0f172a,#111827);border:1.5px solid rgba(52,211,153,0.45);border-radius:22px;padding:26px 24px;text-align:center;color:#f8fafc;box-shadow:0 24px 60px rgba(0,0,0,0.65);">
        <div style="width:58px;height:58px;margin:0 auto 14px;border-radius:50%;border:4px solid rgba(52,211,153,0.2);border-top-color:#34d399;animation:noirAiSpin 0.9s linear infinite;"></div>
        <div id="noir-ai-load-title" style="font-size:17px;font-weight:700;color:#6ee7b7;margin-bottom:8px;"></div>
        <div id="noir-ai-load-sub" style="font-size:13px;font-weight:400;color:#cbd5e1;line-height:1.5;margin-bottom:14px;"></div>
        <div style="width:100%;height:8px;border-radius:999px;background:rgba(148,163,184,0.2);overflow:hidden;margin-bottom:8px;">
          <div id="noir-ai-load-bar" style="width:14%;height:100%;background:linear-gradient(90deg,#10b981,#38bdf8);transition:width 0.35s ease;"></div>
        </div>
        <div id="noir-ai-load-pct" style="font-size:12px;font-weight:700;color:#38bdf8;">14%</div>
      </div>
    `;
    doc.body.appendChild(overlay);
    const titleEl = overlay.querySelector('#noir-ai-load-title');
    const subEl = overlay.querySelector('#noir-ai-load-sub');
    const barEl = overlay.querySelector('#noir-ai-load-bar');
    const pctEl = overlay.querySelector('#noir-ai-load-pct');
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
      close() {
        try { overlay.remove(); } catch (_) { /* ignore */ }
      },
    };
  }

  function maybeShowWelcomeApiUpsellModal(contextKey = 'global', onLinkedCallback = null) {
    const doc = global.document;
    if (!doc || global.__NOIR_SKIP_API_UPSELL === true) return false;
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
    modal.querySelector('#noir-upsell-save-btn')?.addEventListener('click', () => {
      const inp = modal.querySelector('#noir-upsell-api-input');
      const errEl = modal.querySelector('#noir-upsell-err');
      const val = String(inp?.value || '').trim();
      if (!val || val.length < 12) {
        if (errEl) {
          errEl.textContent = 'Vui lòng dán mã Gemini API Key hợp lệ (thường bắt đầu bằng AIza...).';
          errEl.style.display = 'block';
        }
        return;
      }
      setApiKey(val);
      syncApiKeyAcrossModules(val);
      try { global.sessionStorage?.setItem(dismissKey, '1'); } catch (_) { /* ignore */ }
      modal.remove();
      try {
        global.dispatchEvent(new CustomEvent('noir-api-key-changed', { detail: { hasKey: true, source: contextKey } }));
      } catch (_) { /* ignore */ }
      if (typeof onLinkedCallback === 'function') onLinkedCallback(val);
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
    syncApiKeyAcrossModules,
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
    runGeminiVisionDeepRead,
  });

  NS.geminiBridge = exported;
  global.NoirGeminiBridge = exported;
})(typeof window !== 'undefined' ? window : globalThis);
