/**
 * ============================================================================
 * MODULE 46: ĐĂNGLOVEPDF — TRÌNH XỬ LÝ PDF & CHUYỂN ĐỔI ĐỊNH DẠNG 100% NỘI BỘ
 * ============================================================================
 * - Chạy 100% trên trình duyệt (Client-Side Privacy-First: File không rời máy)
 * - Nút "📕 Xuất truyện qua PDF và dùng ĐăngLovePDF" nhấp nháy nổi bật với 2 lựa chọn:
 *   1) Xuất truyện đã viết qua PDF (#modal-s6-custom-exporter / Mod 26)
 *   2) ĐăngLovePDF (19 công cụ xử lý PDF & chuyển đổi định dạng chia thành 5 cụm rút gọn)
 * - Lazy-load thư viện ngoài qua CDN chỉ khi người dùng thực sự dùng công cụ (0ms khởi động)
 * - Luồng 4 trạng thái mượt mà: Danh mục (Hub) -> Nạp tệp -> Không gian chỉnh sửa -> Xử lý & Kết quả
 * - Hỗ trợ Workflow Chaining (đẩy thẳng file kết quả sang công cụ khác), Xem trước, Tải .ZIP & dọn RAM
 * ============================================================================
 */
(function (global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  const CDN_URLS = Object.freeze({
    pdfLib: 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    pdfJs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfJsWorker: (typeof global.location !== 'undefined' && /^https?:$/i.test(global.location.protocol))
      ? './assets/pdf.worker.shim.js'
      : 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    jsZip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
    xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    pptxGen: 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
    marked: 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
    turndown: 'https://cdn.jsdelivr.net/npm/turndown@7.1.3/dist/turndown.js'
  });

  // ==========================================================================
  // 1. DANH MỤC 5 CỤM CÔNG CỤ GỌN GÀNG, ÍT TỪ CHUYÊN NGÀNH
  // ==========================================================================
  const TOOL_GROUPS = Object.freeze([
    {
      id: 'organize',
      icon: '📚',
      title: 'Cụm 1: Gộp, Tách & Sắp xếp trang PDF',
      accent: 'emerald',
      tools: [
        { id: 'merge', icon: '🧩', name: 'Gộp PDF', badge: 'Nhiều PDF → 1 PDF', desc: 'Nối nhiều file PDF thành 1 file, kéo đổi thứ tự dễ dàng.', accept: '.pdf', multiple: true, minFiles: 2, actionLabel: 'Gộp PDF ngay' },
        { id: 'split', icon: '✂️', name: 'Tách PDF', badge: '1 PDF → Nhiều PDF', desc: 'Cắt theo khoảng trang (vd: 1-3, 5) hoặc tách lẻ từng trang.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tách PDF ngay' },
        { id: 'organize', icon: '🗂️', name: 'Sắp xếp, Xoay & Xóa trang', badge: 'PDF → PDF', desc: 'Xem từng trang nhỏ, xoay 90°, đổi thứ tự, xóa hoặc thêm trang trắng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Lưu bản PDF mới' },
        { id: 'crop', icon: '🔲', name: 'Cắt viền thừa PDF', badge: 'PDF → PDF', desc: 'Cắt gọn 4 mép lề trống xung quanh các trang PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Cắt viền & Lưu' }
      ]
    },
    {
      id: 'edit',
      icon: '✨',
      title: 'Cụm 2: Làm gọn, Đánh số, Đóng dấu & Ký tên',
      accent: 'amber',
      tools: [
        { id: 'compress', icon: '🗜️', name: 'Nén nhỏ PDF', badge: 'Giảm dung lượng', desc: 'Làm nhẹ file PDF với 3 mức nén (Nhẹ, Vừa, Mạnh).', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Nén PDF ngay' },
        { id: 'page_numbers', icon: '🔢', name: 'Đánh số trang', badge: 'PDF → PDF', desc: 'Tự động thêm số trang vào 6 vị trí trên/dưới cực gọn.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Thêm số trang' },
        { id: 'watermark', icon: '💧', name: 'Đóng dấu chữ / Logo', badge: 'PDF → PDF', desc: 'Đóng chữ bản quyền hoặc logo mờ chìm lên trang PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Đóng dấu ngay' },
        { id: 'sign_edit', icon: '✍️', name: 'Ký tên & Viết thêm', badge: 'PDF → PDF', desc: 'Vẽ chữ ký tay, chèn chữ mới hoặc khung che thông tin nhạy cảm.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Áp dụng & Xuất PDF' },
        { id: 'flatten', icon: '🔒', name: 'Khóa chỉnh sửa (Làm phẳng)', badge: 'PDF → PDF', desc: 'Khóa cứng ô nhập liệu & ghi chú để file không bị chỉnh sửa.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Làm phẳng PDF' }
      ]
    },
    {
      id: 'media',
      icon: '🖼️',
      title: 'Cụm 3: Ảnh & Slide ↔ PDF',
      accent: 'sky',
      tools: [
        { id: 'pdf_to_img', icon: '🖼️', name: 'PDF → Ảnh (JPG / PNG / WEBP)', badge: 'PDF → ẢNH', desc: 'Xuất từng trang PDF thành ảnh sắc nét theo độ phân giải chọn.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Xuất thành Ảnh' },
        { id: 'img_to_pdf', icon: '📸', name: 'Ảnh → PDF', badge: 'ẢNH → PDF', desc: 'Gộp nhiều ảnh JPG/PNG/WEBP thành 1 cuốn PDF chuẩn khổ A4.', accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp', multiple: true, minFiles: 1, actionLabel: 'Tạo PDF từ Ảnh' },
        { id: 'extract_images', icon: '📥', name: 'Tách ảnh từ PDF', badge: 'PDF → ZIP Ảnh', desc: 'Lưu nhanh hình ảnh chất lượng cao từ các trang PDF vào file .ZIP.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Trích xuất ảnh' },
        { id: 'pdf_pptx', icon: '📽️', name: 'PDF ↔ Slide PowerPoint', badge: 'PDF ↔ PPTX', desc: 'Đổi PDF thành bài chiếu .pptx hoặc rút chữ từ .pptx ra PDF/TXT.', accept: '.pdf,.pptx', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi ngay' }
      ]
    },
    {
      id: 'office',
      icon: '📝',
      title: 'Cụm 4: Word, Văn bản & Bảng tính ↔ PDF',
      accent: 'violet',
      tools: [
        { id: 'docx_convert', icon: '📘', name: 'Word (.DOCX) → PDF / TXT / MD', badge: 'DOCX → PDF/TXT/MD', desc: 'Đổi file Word sang PDF chuẩn tiếng Việt, văn bản thuần hoặc Markdown.', accept: '.docx', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi file Word' },
        { id: 'pdf_to_docx', icon: '📄', name: 'PDF → Word (.DOCX) / TXT', badge: 'PDF → DOCX/TXT', desc: 'Lấy nội dung từ file PDF sang file Word (.docx) hoặc .txt để sửa lại.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuyển sang Word / TXT' },
        { id: 'text_to_pdf_docx', icon: '✍️', name: 'Văn bản (TXT / MD / HTML) → PDF / Word', badge: 'TXT/MD/HTML → PDF/DOCX', desc: 'Đóng gói ghi chú, Markdown hoặc trang HTML sang PDF / Word sạch đẹp.', accept: '.txt,.md,.html,.htm', multiple: false, minFiles: 1, actionLabel: 'Xuất file ngay' },
        { id: 'sheet_convert', icon: '📊', name: 'Excel / CSV / JSON ↔ Qua lại & PDF', badge: 'XLSX ↔ CSV ↔ JSON ↔ PDF', desc: 'Đổi nhanh giữa Excel, CSV (không lỗi tiếng Việt), JSON và bảng PDF.', accept: '.xlsx,.xls,.csv,.json', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi Bảng tính' }
      ]
    },
    {
      id: 'security',
      icon: '🔐',
      title: 'Cụm 5: Đọc chữ từ ảnh (OCR) & Làm sạch PDF',
      accent: 'rose',
      tools: [
        { id: 'ocr_pdf', icon: '👁️', name: 'Đọc chữ từ PDF scan / Ảnh (OCR)', badge: 'PDF/ẢNH → TXT', desc: 'Tự nhận diện chữ Tiếng Việt & Tiếng Anh từ tài liệu chụp ảnh/scan.', accept: '.pdf,image/jpeg,image/png,image/webp', multiple: false, minFiles: 1, actionLabel: 'Quét nhận diện chữ' },
        { id: 'clean_meta', icon: '🛡️', name: 'Làm sạch & Kiểm tra bảo vệ PDF', badge: 'PDF → PDF Sạch', desc: 'Xóa thông tin tác giả/lịch sử ẩn và kiểm tra khóa mật khẩu của file PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Làm sạch & Lưu PDF' }
      ]
    }
  ]);

  const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.tools.map((t) => ({ ...t, groupId: g.id })));

  function getActiveToolGroups() {
    return NS.dangLovePdfPro?.PRO_TOOL_GROUPS || TOOL_GROUPS;
  }
  function getActiveAllTools() {
    return getActiveToolGroups().flatMap((g) => g.tools.map((t) => ({ ...t, groupId: g.id })));
  }

  // ==========================================================================
  // 2. BỘ NẠP THƯ VIỆN ON-DEMAND (CHỈ TẢI KHI DÙNG — 0MS KHI KHỞI ĐỘNG APP)
  // ==========================================================================
  const loadedScripts = new Map();

  function loadScriptOnce(url) {
    if (loadedScripts.has(url)) return loadedScripts.get(url);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => {
        loadedScripts.delete(url);
        reject(new Error(`Không tải được thư viện: ${url}`));
      };
      document.head.appendChild(s);
    });
    loadedScripts.set(url, p);
    return p;
  }

  async function ensurePdfLib() {
    if (!global.PDFLib) await loadScriptOnce(CDN_URLS.pdfLib);
    if (!global.PDFLib) throw new Error('Không thể khởi tạo bộ xử lý PDF (pdf-lib).');
    return global.PDFLib;
  }

  async function ensurePdfJs() {
    if (!global.pdfjsLib) await loadScriptOnce(CDN_URLS.pdfJs);
    if (!global.pdfjsLib) throw new Error('Không thể khởi tạo bộ đọc PDF (PDF.js).');
    try {
      if (global.pdfjsLib.GlobalWorkerOptions) {
        global.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_URLS.pdfJsWorker;
      }
    } catch (_eW) {}
    const lib = global.pdfjsLib;
    if (typeof Proxy === 'function' && typeof lib.getDocument === 'function') {
      return new Proxy(lib, {
        get(target, prop) {
          if (prop === 'getDocument') {
            return (src) => {
              if (src && typeof src === 'object' && !(src instanceof Uint8Array) && !Array.isArray(src)) {
                if (src.disableCreateObjectURL === undefined) {
                  src = { ...src, disableCreateObjectURL: true };
                }
              }
              return target.getDocument(src);
            };
          }
          const val = Reflect.get(target, prop, target);
          return val;
        }
      });
    }
    return lib;
  }

  async function ensureJsZip() {
    if (!global.JSZip) await loadScriptOnce(CDN_URLS.jsZip);
    if (!global.JSZip) throw new Error('Không thể khởi tạo bộ đóng gói .ZIP (JSZip).');
    return global.JSZip;
  }

  async function ensureMammoth() {
    if (!global.mammoth) await loadScriptOnce(CDN_URLS.mammoth);
    return global.mammoth;
  }

  async function ensureXlsx() {
    if (!global.XLSX) await loadScriptOnce(CDN_URLS.xlsx);
    return global.XLSX;
  }

  async function ensurePptxGen() {
    if (!global.PptxGenJS) await loadScriptOnce(CDN_URLS.pptxGen);
    return global.PptxGenJS;
  }

  async function ensureTesseract() {
    if (!global.Tesseract) await loadScriptOnce(CDN_URLS.tesseract);
    return global.Tesseract;
  }

  async function ensureMarked() {
    if (!global.marked) await loadScriptOnce(CDN_URLS.marked);
    return global.marked;
  }

  async function ensureTurndown() {
    if (!global.TurndownService) await loadScriptOnce(CDN_URLS.turndown);
    return global.TurndownService;
  }

  // ==========================================================================
  // 3. TIỆN ÍCH CHUNG: FORMAT, PARSE TRANG, VẼ CHỮ TIẾNG VIỆT & TẠO .DOCX
  // ==========================================================================
  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escXml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function parsePageRanges(rangeStr, totalPages) {
    const clean = String(rangeStr || '').trim();
    if (!clean) return [Array.from({ length: totalPages }, (_, i) => i)];
    const groups = [];
    const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('-')) {
        const [aRaw, bRaw] = part.split('-').map((x) => parseInt(x.trim(), 10));
        const a = Math.max(1, Math.min(totalPages, Number.isFinite(aRaw) ? aRaw : 1));
        const b = Math.max(1, Math.min(totalPages, Number.isFinite(bRaw) ? bRaw : totalPages));
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        const idxs = [];
        for (let i = start; i <= end; i++) idxs.push(i - 1);
        if (idxs.length) groups.push(idxs);
      } else {
        const single = parseInt(part, 10);
        if (Number.isFinite(single) && single >= 1 && single <= totalPages) {
          groups.push([single - 1]);
        }
      }
    }
    return groups;
  }

  const WORD_FONT_OPTIONS = [
    { label: 'Segoe UI / Hiện đại (Không chân)', value: '"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif' },
    { label: 'Times New Roman (Hành chính / Sách)', value: '"Times New Roman", Georgia, serif' },
    { label: 'Arial / Helvetica (Rõ nét)', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Georgia (Văn học / Cổ điển)', value: 'Georgia, "Times New Roman", serif' },
    { label: 'Tahoma / Verdana (Gọn gàng)', value: 'Tahoma, Verdana, sans-serif' },
    { label: 'Courier New (Mã số / Bảng biểu)', value: '"Courier New", Consolas, monospace' },
  ];

  function buildWordStyleBarHtml(prefix, { fontSize = 14, color = '#1f2937', fontFamily = '"Times New Roman", Georgia, serif', bold = true, italic = false, underline = false, showBg = false, showAngle = false, angle = 35 } = {}) {
    const fontOpts = WORD_FONT_OPTIONS.map(
      (f) => `<option value="${escHtml(f.value)}" ${f.value === fontFamily ? 'selected' : ''}>${escHtml(f.label)}</option>`
    ).join('');
    return `
      <div class="p-2.5 rounded-xl border border-sky-500/35 bg-zinc-950/90 space-y-2" data-word-style-bar="${prefix}">
        <div class="text-[11px] font-black text-sky-300">🔤 Định dạng kiểu Word (Phông, Cỡ, Màu, B / I / U):</div>
        <label class="block space-y-1">
          <span class="text-[11px] text-zinc-300 font-bold">Phông chữ:</span>
          <select id="opt-${prefix}-font" class="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100">${fontOpts}</select>
        </label>
        <div class="grid grid-cols-3 gap-1.5 items-end">
          <label class="space-y-1"><span class="text-[10.5px] text-zinc-300">Cỡ chữ (pt):</span><input id="opt-${prefix}-size" type="number" min="7" max="120" value="${fontSize}" class="w-full px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-center font-bold" /></label>
          <label class="space-y-1"><span class="text-[10.5px] text-zinc-300">Màu chữ:</span><input id="opt-${prefix}-color" type="color" value="${color}" class="w-full h-8 rounded-lg bg-zinc-900 border border-zinc-700 cursor-pointer" /></label>
          <div class="flex items-center gap-1">
            <label class="flex-1 flex items-center justify-center py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 cursor-pointer has-[:checked]:bg-sky-600 has-[:checked]:border-sky-400" title="In đậm (Bold)">
              <input id="opt-${prefix}-bold" type="checkbox" ${bold ? 'checked' : ''} class="sr-only" /><span class="font-black text-xs">B</span>
            </label>
            <label class="flex-1 flex items-center justify-center py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 cursor-pointer has-[:checked]:bg-sky-600 has-[:checked]:border-sky-400" title="In nghiêng (Italic)">
              <input id="opt-${prefix}-italic" type="checkbox" ${italic ? 'checked' : ''} class="sr-only" /><span class="italic font-serif font-bold text-xs">I</span>
            </label>
            <label class="flex-1 flex items-center justify-center py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 cursor-pointer has-[:checked]:bg-sky-600 has-[:checked]:border-sky-400" title="Gạch chân (Underline)">
              <input id="opt-${prefix}-underline" type="checkbox" ${underline ? 'checked' : ''} class="sr-only" /><span class="underline font-bold text-xs">U</span>
            </label>
          </div>
        </div>
        ${showAngle ? `
          <label class="block space-y-1"><span class="text-[10.5px] text-zinc-300">Góc xoay chữ (độ, -90 đến 90):</span>
            <input id="opt-${prefix}-angle" type="number" min="-90" max="90" value="${angle}" class="w-full px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs" />
          </label>
        ` : ''}
        ${showBg ? `
          <label class="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
            <input id="opt-${prefix}-whitebg" type="checkbox" class="accent-sky-400" />
            <span>Tô nền trắng sau chữ/số (tự che gọn chữ cũ bên dưới)</span>
          </label>
        ` : ''}
      </div>
    `;
  }

  function readWordStyleBar(prefix, fallback = {}) {
    return {
      fontFamily: document.getElementById(`opt-${prefix}-font`)?.value || fallback.fontFamily || '"Times New Roman", Georgia, serif',
      fontSize: Math.max(7, Math.min(120, Number(document.getElementById(`opt-${prefix}-size`)?.value || fallback.fontSize || 14))),
      color: document.getElementById(`opt-${prefix}-color`)?.value || fallback.color || '#1f2937',
      bold: document.getElementById(`opt-${prefix}-bold`) ? Boolean(document.getElementById(`opt-${prefix}-bold`).checked) : Boolean(fallback.bold),
      italic: document.getElementById(`opt-${prefix}-italic`) ? Boolean(document.getElementById(`opt-${prefix}-italic`).checked) : Boolean(fallback.italic),
      underline: document.getElementById(`opt-${prefix}-underline`) ? Boolean(document.getElementById(`opt-${prefix}-underline`).checked) : Boolean(fallback.underline),
      angle: Number(document.getElementById(`opt-${prefix}-angle`)?.value ?? fallback.angle ?? 35),
      bgColor: document.getElementById(`opt-${prefix}-whitebg`)?.checked ? '#ffffff' : (fallback.bgColor || ''),
    };
  }

  /**
   * Vẽ chuỗi chữ tiếng Việt (Unicode 100% không vỡ dấu!) thành ảnh PNG trong suốt
   * hỗ trợ đầy đủ định dạng kiểu Word: Font, Cỡ chữ, Màu, Đậm, Nghiêng, Gạch chân, Căn lề, Nền.
   */
  function renderVietnameseTextToPngBytes(text, { fontSize = 28, color = '#111827', fontFamily = '"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", sans-serif', bold = false, italic = false, underline = false, align = 'left', bgColor = '', padX = 12, padY = 8 } = {}) {
    const scale = 2;
    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext('2d');
    const fontStr = `${italic ? 'italic ' : ''}${bold ? '700 ' : '500 '}${fontSize * scale}px ${fontFamily}`;
    tmpCtx.font = fontStr;
    const lines = String(text || '').split(/\r?\n/);
    const lineWidths = lines.map((l) => Math.ceil(tmpCtx.measureText(l || ' ').width));
    const maxW = Math.max(24, ...lineWidths);
    const lineH = Math.ceil(fontSize * scale * 1.32);
    const w = maxW + padX * 2 * scale;
    const h = lines.length * lineH + padY * 2 * scale;

    tmpCanvas.width = w;
    tmpCanvas.height = h;
    const ctx = tmpCanvas.getContext('2d');
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.font = fontStr;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.textBaseline = 'top';
    lines.forEach((line, idx) => {
      const lw = lineWidths[idx] || 0;
      let drawX = padX * scale;
      if (align === 'center') drawX = padX * scale + (maxW - lw) / 2;
      else if (align === 'right') drawX = padX * scale + (maxW - lw);
      const drawY = padY * scale + idx * lineH;
      ctx.fillText(line, drawX, drawY);
      if (underline && line.trim()) {
        const uy = drawY + fontSize * scale * 1.06;
        ctx.lineWidth = Math.max(1.5, fontSize * scale * 0.065);
        ctx.beginPath();
        ctx.moveTo(drawX, uy);
        ctx.lineTo(drawX + lw, uy);
        ctx.stroke();
      }
    });
    const dataUrl = tmpCanvas.toDataURL('image/png');
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, widthPt: w / (scale * 1.35), heightPt: h / (scale * 1.35) };
  }

  NS.dangLovePdfTextUtils = {
    WORD_FONT_OPTIONS,
    buildWordStyleBarHtml,
    readWordStyleBar,
    renderVietnameseTextToPngBytes,
  };

  /**
   * Dựng các trang PDF A4 chuẩn tiếng Việt từ mảng đoạn văn/HTML sạch bằng Canvas + pdf-lib
   * (100% hỗ trợ dấu Tiếng Việt, bảng đơn giản, không vỡ font trên mọi thiết bị + hỗ trợ định dạng kiểu Word).
   */
  async function renderLinesToVietnamesePdfBlob(title, textLines, onProgress, styleOpts = {}) {
    const { PDFDocument } = await ensurePdfLib();
    const outDoc = await PDFDocument.create();
    const pageW = 595.28;
    const pageH = 841.89;
    const pxW = 1240;
    const pxH = 1754;
    const marginX = 95;
    const marginTop = 100;
    const marginBottom = 100;
    const maxTextW = pxW - marginX * 2;
    const fam = styleOpts.fontFamily || '"Be Vietnam Pro", "Noto Sans", Arial, sans-serif';
    const bodyPx = Math.round(Math.max(16, Math.min(54, (Number(styleOpts.fontSize) || 14) * 1.9)));
    const headPx = Math.round(bodyPx * 1.28);
    const bodyColor = styleOpts.color || '#18181b';
    const headColor = styleOpts.titleColor || (styleOpts.color && styleOpts.color !== '#18181b' ? styleOpts.color : '#065f46');
    const bodyWeight = styleOpts.bold ? '700' : '400';
    const bodyStyle = styleOpts.italic ? 'italic ' : '';
    const lineH = Math.round(bodyPx * 1.54);

    const canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext('2d');

    const wrapped = [];
    ctx.font = `${bodyStyle}${bodyWeight} ${bodyPx}px ${fam}`;
    if (title) {
      wrapped.push({ text: title, isHeading: true });
      wrapped.push({ text: '', isHeading: false });
    }
    for (const rawLine of textLines) {
      const line = String(rawLine || '').replace(/\t/g, '    ');
      if (!line.trim()) {
        wrapped.push({ text: '', isHeading: false });
        continue;
      }
      const isSmartHeading =
        /^#{1,3}\s+/.test(line) ||
        (/^(MỤC LỤC|DANH MỤC(\s+(BẢNG|BIỂU ĐỒ|HÌNH))?|LỜI MỞ ĐẦU|KẾT LUẬN|TÀI LIỆU THAM KHẢO|CHƯƠNG\s+[IVXLCDM\d]+|PHẦN\s+[IVXLCDM\d]+|Phần\s+[IVXLCDM\d]+|[IVXLCDM]{1,5}\.\s+[A-ZÀ-Ỹ0-9]|(?:[1-9]|[1-3]\d)\.\s+[A-ZÀ-Ỹ]|\d{1,2}\.\d{1,2}\.?\s+[A-ZÀ-Ỹ])/.test(line.trim()) && line.trim().length <= 120) ||
        (line.trim().length >= 10 && line.trim().length <= 90 && line.trim().split(/\s+/).length >= 2 && line.trim() === line.trim().toUpperCase() && /[A-ZÀ-Ỹ]/.test(line) && !/[.,;!?]$/.test(line.trim()));
      const isHeading = isSmartHeading;
      const cleanLine = isHeading ? line.replace(/^#{1,3}\s+/, '') : line;
      ctx.font = isHeading
        ? `${bodyStyle}700 ${headPx}px ${fam}`
        : `${bodyStyle}${bodyWeight} ${bodyPx}px ${fam}`;
      const words = cleanLine.split(/\s+/);
      let cur = '';
      for (const word of words) {
        const test = cur ? `${cur} ${word}` : word;
        if (ctx.measureText(test).width > maxTextW && cur) {
          wrapped.push({ text: cur, isHeading });
          cur = word;
        } else {
          cur = test;
        }
      }
      if (cur) wrapped.push({ text: cur, isHeading });
    }

    const linesPerPage = Math.max(8, Math.floor((pxH - marginTop - marginBottom) / lineH));
    const totalPages = Math.max(1, Math.ceil(wrapped.length / linesPerPage));

    for (let p = 0; p < totalPages; p++) {
      if (onProgress) onProgress(Math.round(((p + 1) / totalPages) * 90), `Đang tạo trang PDF ${p + 1}/${totalPages}...`);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pxW, pxH);
      let y = marginTop;
      const slice = wrapped.slice(p * linesPerPage, (p + 1) * linesPerPage);
      for (const item of slice) {
        if (item.text) {
          ctx.fillStyle = item.isHeading ? headColor : bodyColor;
          ctx.font = item.isHeading
            ? `${bodyStyle}700 ${headPx}px ${fam}`
            : `${bodyStyle}${bodyWeight} ${bodyPx}px ${fam}`;
          ctx.fillText(item.text, marginX, y);
          if (styleOpts.underline) {
            const tw = ctx.measureText(item.text).width;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = Math.max(1.5, (item.isHeading ? headPx : bodyPx) * 0.06);
            ctx.beginPath();
            ctx.moveTo(marginX, y + 6);
            ctx.lineTo(marginX + tw, y + 6);
            ctx.stroke();
          }
        }
        y += item.isHeading ? lineH + 10 : lineH;
      }
      ctx.fillStyle = '#71717a';
      ctx.font = '400 20px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
      ctx.fillText(`Trang ${p + 1} / ${totalPages}`, pxW - marginX - 130, pxH - 52);

      const jpegUrl = canvas.toDataURL('image/jpeg', 0.9);
      const bin = atob(jpegUrl.split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const jpg = await outDoc.embedJpg(bytes);
      const pg = outDoc.addPage([pageW, pageH]);
      pg.drawImage(jpg, { x: 0, y: 0, width: pageW, height: pageH });
    }

    const pdfBytes = await outDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  /**
   * Dựng file Word (.docx) chuẩn OOXML 100% nội bộ bằng JSZip (hỗ trợ đầy đủ tiếng Việt UTF-8).
   */
  async function buildDocxBlobFromParagraphs(title, paragraphs) {
    const JSZip = await ensureJsZip();
    const zip = new JSZip();

    const pXml = [];
    if (title) {
      pXml.push(`<w:p><w:pPr><w:spacing w:after="200"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr><w:t xml:space="preserve">${escXml(title)}</w:t></w:r></w:p>`);
    }
    for (const para of paragraphs) {
      const clean = String(para || '');
      const isHeading = /^#{1,3}\s+/.test(clean);
      const txt = isHeading ? clean.replace(/^#{1,3}\s+/, '') : clean;
      if (isHeading) {
        pXml.push(`<w:p><w:pPr><w:spacing w:before="200" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr><w:t xml:space="preserve">${escXml(txt)}</w:t></w:r></w:p>`);
      } else {
        pXml.push(`<w:p><w:pPr><w:spacing w:after="120" w:line="320" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr><w:t xml:space="preserve">${escXml(txt)}</w:t></w:r></w:p>`);
      }
    }

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pXml.join('\n')}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`);

    return await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }

  // ==========================================================================
  // 4. LỚP ĐIỀU KHIỂN CHÍNH ĐĂNGLOVEPDF STUDIO
  // ==========================================================================
  class DangLovePdfStudioController {
    constructor() {
      this.activeTool = null;
      this.files = []; // [{ id, file, name, size, bytes, pageCount, thumbUrl }]
      this.pagesState = []; // cho công cụ organize: [{ uid, pageIndex, rotation, isBlank, isDeleted, thumbUrl }]
      this.resultItems = []; // [{ name, blob, url, size }]
      this.resultZipItem = null;
      this.objectUrls = [];
      this.cancelled = false;
      this.collapsedGroups = {};
      this.allGroupsCollapsed = false;
      this.signatureDataUrl = '';
      this.theme10ExtraImages = [];
      this._initialized = false;
    }

    toast(msg, type = 'info', dur = 2800) {
      NS.utils?.showToast?.(msg, type, dur);
    }

    trackUrl(blob) {
      const u = URL.createObjectURL(blob);
      this.objectUrls.push(u);
      return u;
    }

    revokeAllUrls() {
      while (this.objectUrls.length) {
        const u = this.objectUrls.pop();
        try { URL.revokeObjectURL(u); } catch (_e) {}
      }
    }

    revokeResultUrls() {
      const urlsToRevoke = new Set();
      (this.resultItems || []).forEach((it) => { if (it?.url) urlsToRevoke.add(it.url); });
      if (this.resultZipItem?.url) urlsToRevoke.add(this.resultZipItem.url);
      urlsToRevoke.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch (_e) {}
        const idx = this.objectUrls.indexOf(u);
        if (idx >= 0) this.objectUrls.splice(idx, 1);
      });
      this.resultItems = [];
      this.resultZipItem = null;
    }

    resetWorkspaceState() {
      this.files = [];
      this.pagesState = [];
      this.resultItems = [];
      this.resultZipItem = null;
      this.theme10ExtraImages = [];
      this.theme10OverrideBlocks = null;
      this._theme10AnalyzedCache = null;
      this.cancelled = false;
      this.revokeAllUrls();
    }

    injectStylesOnce() {
      if (document.getElementById('mod46-danglovepdf-styles')) return;
      const st = document.createElement('style');
      st.id = 'mod46-danglovepdf-styles';
      st.textContent = `
        @keyframes mod46PdfBtnPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.72), 0 8px 20px rgba(244, 63, 94, 0.35);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 7px rgba(251, 146, 60, 0), 0 10px 26px rgba(244, 63, 94, 0.55);
            transform: scale(1.025);
          }
        }
        .noir-danglovepdf-glow-btn {
          background: linear-gradient(90deg, #ea580c 0%, #e11d48 52%, #f59e0b 100%) !important;
          border: 2px solid rgba(253, 186, 116, 0.9) !important;
          animation: mod46PdfBtnPulse 1.8s ease-in-out infinite;
        }
        .noir-danglovepdf-glow-btn:hover {
          filter: brightness(1.08);
        }
      `;
      document.head.appendChild(st);
    }

    // ------------------------------------------------------------------------
    // MÀN HÌNH CHỌN 2 LỰA CHỌN KHI BẤM "Xuất truyện qua PDF và dùng ĐăngLovePDF"
    // ------------------------------------------------------------------------
    openTwoChoiceChooserModal() {
      document.getElementById('modal-mod46-pdf-chooser')?.remove();
      const modal = document.createElement('div');
      modal.id = 'modal-mod46-pdf-chooser';
      modal.className = 'fixed inset-0 z-[2147483580] bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="w-full max-w-xl rounded-3xl border border-amber-400/50 bg-zinc-900 text-zinc-100 shadow-2xl overflow-hidden">
          <div class="px-5 py-4 border-b border-zinc-800 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-rose-950/60 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-black text-amber-200">📕 Xuất Truyện PDF &amp; ĐăngLovePDF</h2>
              <p class="text-xs text-zinc-300 mt-0.5">Chọn nhanh công cụ bạn muốn dùng ngay bên dưới:</p>
            </div>
            <button type="button" id="btn-mod46-chooser-close" class="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-rose-600 text-xs font-extrabold transition cursor-pointer">✕</button>
          </div>
          <div class="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" id="btn-mod46-choice-export-novel" class="group text-left p-4 rounded-2xl border-2 border-amber-500/50 hover:border-amber-300 bg-gradient-to-br from-amber-950/50 to-zinc-900 hover:from-amber-900/50 transition space-y-2 cursor-pointer shadow-lg">
              <div class="text-3xl">📖</div>
              <div class="text-sm font-black text-amber-200 group-hover:text-white">Xuất truyện đã viết qua PDF</div>
              <p class="text-[11.5px] text-zinc-300 leading-relaxed">Mở cửa sổ xuất truyện PDF &amp; Bản in (tùy chỉnh font sách in, bìa sách, mục lục, .DOCX / .TXT).</p>
            </button>
            <button type="button" id="btn-mod46-choice-danglovepdf" class="group text-left p-4 rounded-2xl border-2 border-rose-500/60 hover:border-rose-300 bg-gradient-to-br from-rose-950/60 to-zinc-900 hover:from-rose-900/50 transition space-y-2 cursor-pointer shadow-lg">
              <div class="flex items-center justify-between gap-2">
                <img src="assets/app-icon-192.png" alt="Logo ĐăngLovePDF" class="w-11 h-11 rounded-xl object-cover border-2 border-rose-300/80 shadow-md" />
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-extrabold">48 Công Cụ · 100% Trên Máy</span>
              </div>
              <div class="text-sm font-black text-rose-200 group-hover:text-white">ĐăngLovePDF ( ͡° ͜ʖ ͡°)</div>
              <p class="text-[11.5px] text-zinc-300 leading-relaxed">Đủ mọi tính năng Premium: Gộp, tách, nén, dàn trang sách, OCR 2 lớp, che đen vĩnh viễn, so sánh PDF, xử lý hàng loạt &amp; đổi mọi định dạng!</p>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const close = () => modal.remove();
      modal.querySelector('#btn-mod46-chooser-close')?.addEventListener('click', close);
      modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
      modal.querySelector('#btn-mod46-choice-export-novel')?.addEventListener('click', () => {
        close();
        if (NS.bookExporter?.openExportModal) {
          NS.bookExporter.openExportModal();
        } else {
          document.getElementById('modal-s6-custom-exporter')?.classList.remove('hidden');
        }
      });
      modal.querySelector('#btn-mod46-choice-danglovepdf')?.addEventListener('click', () => {
        close();
        this.openDangLovePdfStudio();
      });
    }

    // ------------------------------------------------------------------------
    // MỞ CỬA SỔ CHÍNH ĐĂNGLOVEPDF STUDIO
    // ------------------------------------------------------------------------
    openDangLovePdfStudio(initialToolId = null) {
      const isStandalone = Boolean(global.NOIR_DANGLOVEPDF_STANDALONE);
      let modal = document.getElementById('modal-mod46-danglovepdf-studio');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-mod46-danglovepdf-studio';
        modal.className = isStandalone
          ? 'fixed inset-0 z-[2147483590] bg-zinc-950 flex items-center justify-center p-0 overflow-hidden text-zinc-100'
          : 'fixed inset-0 z-[2147483590] bg-zinc-950/90 backdrop-blur-lg flex items-center justify-center p-1.5 sm:p-4 overflow-hidden text-zinc-100';
        modal.style.cssText = 'position:fixed;inset:0;width:100%;max-width:100vw;height:100dvh;align-items:center;justify-content:center;';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
          <div class="${isStandalone ? 'w-full h-[100dvh] rounded-none border-0' : 'w-full max-w-[1440px] h-[96dvh] sm:h-[94dvh] mx-auto rounded-2xl border border-zinc-700/80'} bg-zinc-950/98 shadow-2xl flex flex-col overflow-hidden">
            <!-- Header gọn gàng căn giữa đầy đủ (relative z-20 chống bị che phủ nút Đóng!) -->
            <div class="relative z-20 w-full px-3 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-900/95 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div class="flex items-center gap-2.5 min-w-0">
                <img src="assets/app-icon-192.png" alt="Logo ĐăngLovePDF" class="w-9 h-9 rounded-xl object-cover border-2 border-rose-400/80 shadow-md shrink-0" />
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-sm sm:text-base font-black text-rose-300 tracking-tight">ĐăngLovePDF <span class="whitespace-nowrap">( ͡° ͜ʖ ͡°)</span></h2>
                    <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 text-[10px] font-extrabold">🔒 49 Công cụ Premium · Xử lý 100% trên máy</span>
                    ${isStandalone ? '<span class="px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/50 text-teal-200 text-[10px] font-bold">🌐 Web Riêng · Tự động đồng bộ Web Gốc</span>' : ''}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <button type="button" id="btn-mod46-back-hub" class="hidden px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer">← Danh mục công cụ</button>
                <button type="button" id="btn-mod46-header-new-file" class="hidden px-3 py-1.5 rounded-xl border border-emerald-500/60 bg-emerald-500/15 hover:bg-emerald-600 text-emerald-200 hover:text-white text-xs font-extrabold cursor-pointer">🔄 Làm tệp mới</button>
                ${
                  isStandalone
                    ? `<button type="button" id="btn-mod46-copy-standalone-link" class="px-3 py-1.5 rounded-xl border border-sky-500/50 bg-sky-500/15 hover:bg-sky-600 text-sky-200 hover:text-white text-xs font-bold cursor-pointer">🔗 Chép Link</button>
                       <a href="index.html" data-noir-internal-nav="1" class="px-3 py-1.5 rounded-xl border border-amber-400/50 bg-amber-500/15 hover:bg-amber-600 text-amber-200 hover:text-white text-xs font-bold">📖 Web Tiểu Thuyết</a>
                       <button type="button" data-noir-exit-trigger="1" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer">🚪 Thoát</button>`
                    : `<a href="danglovepdf.html" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl border border-teal-500/50 bg-teal-500/15 hover:bg-teal-600 text-teal-200 hover:text-white text-xs font-bold" title="Mở trang web riêng chỉ dành cho ĐăngLovePDF (tự đồng bộ cập nhật)">🌐 Mở Web Riêng</a>
                       <button type="button" id="btn-mod46-close-studio" data-at-id="mod46-studio-close" data-at-expect="closes:#modal-mod46-danglovepdf-studio" class="px-3 py-1.5 min-h-[34px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap">✕ Đóng</button>`
                }
              </div>
            </div>

            <!-- Nội dung 4 trạng thái (rộng rãi, căn giữa chuẩn Responsive Desktop & Mobile) -->
            <div id="mod46-studio-body" class="w-full flex-1 min-h-0 overflow-y-auto p-3 sm:p-6"></div>
          </div>
        `;
        document.body.appendChild(modal);

        // Event delegation cấp root: Đóng / Làm tệp mới / Quay lại Danh mục KHÔNG BAO GIỜ bị liệt dù đang chạy tác vụ lỗi!
        const forceCloseStudio = () => {
          if (isStandalone) return;
          this.cancelled = true;
          modal.classList.add('hidden');
          modal.style.display = 'none';
          try { this.resetWorkspaceState(); } catch (_eReset) {}
        };
        modal.addEventListener('click', (ev) => {
          const copyBtn = ev.target?.closest?.('#btn-mod46-copy-standalone-link');
          if (copyBtn) {
            ev.preventDefault();
            try {
              global.navigator?.clipboard?.writeText?.(global.location.href);
              this.toast('✅ Đã sao chép link trang Web ĐăngLovePDF (luôn đồng bộ từ web gốc)!', 'success', 3200);
            } catch (_eCp) {}
            return;
          }
          const closeBtn = ev.target?.closest?.('#btn-mod46-close-studio');
          if (closeBtn) {
            ev.preventDefault();
            ev.stopPropagation();
            forceCloseStudio();
            return;
          }
          const newFileBtn = ev.target?.closest?.('#btn-mod46-header-new-file');
          if (newFileBtn) {
            ev.preventDefault();
            if (!this.activeTool) return;
            this.cancelled = true;
            try { this.resetWorkspaceState(); } catch (_eR) {}
            this.renderUploadOrWorkspaceScreen();
            return;
          }
          const backBtn = ev.target?.closest?.('#btn-mod46-back-hub');
          if (backBtn) {
            ev.preventDefault();
            this.cancelled = true;
            this.activeTool = null;
            try { this.resetWorkspaceState(); } catch (_eR2) {}
            this.renderHubScreen('', true);
          }
        });
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape' && !isStandalone && !modal.classList.contains('hidden') && modal.style.display !== 'none') {
            forceCloseStudio();
          }
        });
      }
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      try { NS.i18n?.translateElement?.(modal); } catch (_eTrModal) {}
      try {
        (global.NoirGeminiBridge || NS.geminiBridge)?.maybeShowWelcomeApiUpsellModal?.('danglovepdf', () => {
          if (this.activeTool) this.renderUploadOrWorkspaceScreen();
          else this.renderHubScreen();
        });
      } catch (_eUpsell) {}

      if (initialToolId) {
        const found = getActiveAllTools().find((t) => t.id === initialToolId);
        if (found) {
          this.selectTool(found);
          return;
        }
      }
      this.activeTool = null;
      this.resetWorkspaceState();
      this.renderHubScreen();
    }

    // ------------------------------------------------------------------------
    // MÀN HÌNH 1: TRANG CHỦ DANH MỤC CÔNG CỤ (7 CỤM RÚT GỌN + NÚT RÚT GỌN TỔNG)
    // ------------------------------------------------------------------------
    renderHubScreen(searchQuery = '', restoreScroll = false) {
      const body = document.getElementById('mod46-studio-body');
      const backBtn = document.getElementById('btn-mod46-back-hub');
      const newFileBtn = document.getElementById('btn-mod46-header-new-file');
      if (!body) return;
      backBtn?.classList.add('hidden');
      newFileBtn?.classList.add('hidden');

      const q = String(searchQuery || '').trim().toLowerCase();
      const activeGroups = getActiveToolGroups();
      const activeTools = getActiveAllTools();

      const accentBorder = {
        emerald: 'border-emerald-500/40 bg-emerald-950/20',
        cyan: 'border-cyan-500/40 bg-cyan-950/20',
        amber: 'border-amber-500/40 bg-amber-950/20',
        sky: 'border-sky-500/40 bg-sky-950/20',
        violet: 'border-violet-500/40 bg-violet-950/20',
        teal: 'border-teal-500/40 bg-teal-950/20',
        rose: 'border-rose-500/40 bg-rose-950/20'
      };

      const clustersHtml = activeGroups.map((grp, grpIdx) => {
        const visibleGroupTools = grp.tools.filter((t) => t.id !== 'preflight_inspect');
        const filteredTools = q
          ? visibleGroupTools.filter((t) =>
              `${t.name} ${t.desc} ${t.badge} ${grp.title}`.toLowerCase().includes(q)
            )
          : visibleGroupTools;
        if (!filteredTools.length) return '';

        const isCollapsed = !q && Boolean(this.collapsedGroups[grp.id]);
        const cards = filteredTools
          .map(
            (t) => `
          <button type="button" data-mod46-tool="${t.id}" class="text-left p-3 rounded-2xl border ${t.featured ? 'border-2 border-amber-400 bg-gradient-to-br from-teal-950/90 via-sky-950/90 to-indigo-950/90 shadow-[0_0_22px_rgba(251,191,36,0.38)] animate-pulse' : 'border-zinc-700/80 hover:border-rose-400/80 bg-zinc-900/90 hover:bg-zinc-800/90 shadow-sm'} transition flex items-start gap-3 cursor-pointer">
            <span class="text-2xl leading-none shrink-0 mt-0.5">${t.icon}</span>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center justify-between gap-1.5 flex-wrap">
                <span class="text-xs sm:text-[13px] font-black ${t.featured ? 'text-amber-200' : 'text-zinc-100'}">${escHtml(t.name)}</span>
                <span class="px-1.5 py-0.5 rounded-md ${t.featured ? 'bg-amber-400 text-zinc-950 font-black' : 'bg-zinc-950 border border-zinc-700 font-bold text-amber-300'} text-[9.5px] whitespace-nowrap">${escHtml(t.badge)}</span>
              </div>
              <p class="text-[11px] ${t.featured ? 'text-sky-100/90' : 'text-zinc-400'} leading-snug">${escHtml(t.desc)}</p>
            </div>
          </button>`
          )
          .join('');

        const vipPreflightBanner =
          grpIdx === 0 && (!q || 'kiểm tra kỹ thuật cho file pdf trước khi in preflight vip pro'.includes(q))
            ? `<div class="pt-1">
                <button type="button" data-mod46-tool="preflight_inspect" class="w-full py-3.5 px-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-violet-500/25 hover:from-amber-500/35 hover:to-violet-500/35 text-amber-200 font-black text-xs sm:text-sm shadow-[0_0_24px_rgba(251,191,36,0.35)] animate-pulse flex items-center justify-center gap-2 cursor-pointer transition">
                  <span>✨🔬</span>
                  <span>Kiểm tra kỹ thuật cho file PDF trước khi in (Vô cùng VIP Pro)</span>
                  <span class="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black">Xem kết quả ngay</span>
                </button>
              </div>`
            : '';

        return `
          <section class="rounded-2xl border ${accentBorder[grp.accent] || 'border-zinc-700'} overflow-hidden">
            <button type="button" data-mod46-toggle-group="${grp.id}" class="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-white/5 transition cursor-pointer">
              <span class="text-xs sm:text-sm font-black text-zinc-100 flex items-center gap-2">
                <span>${grp.icon}</span>
                <span>${escHtml(grp.title)}</span>
                <span class="text-[10.5px] font-bold text-zinc-400">(${filteredTools.length})</span>
              </span>
              <span class="px-2 py-0.5 rounded-lg border border-zinc-600 bg-zinc-900/90 text-[10.5px] font-bold text-zinc-200 whitespace-nowrap">
                ${isCollapsed ? 'Mở rộng ▾' : 'Thu gọn ▴'}
              </span>
            </button>
            <div class="${isCollapsed ? 'hidden ' : ''}p-3 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              ${cards}
            </div>
          </section>
          ${vipPreflightBanner}
        `;
      }).join('');

      body.innerHTML = `
        <div class="max-w-6xl mx-auto space-y-3.5">
          <!-- Thanh tìm kiếm & Nút rút gọn tổng -->
          <div class="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl border border-zinc-800 bg-zinc-900/80">
            <div class="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[220px] flex items-center gap-2">
              <input id="input-mod46-search" type="text" value="${escHtml(searchQuery)}" placeholder="🔍 Tìm nhanh: gộp, tách, nén, word, ảnh, excel, ký tên, ocr..." class="w-full px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-400" />
            </div>
            <button type="button" id="btn-mod46-toggle-all-groups" class="px-3.5 py-2 rounded-xl border border-amber-400/60 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-extrabold whitespace-nowrap cursor-pointer">
              ${this.allGroupsCollapsed ? '⏬ Mở rộng tất cả cụm' : '⏫ Rút gọn tất cả cụm'}
            </button>
          </div>

          <div class="space-y-3">
            ${clustersHtml || '<div class="text-center py-10 text-zinc-400 text-sm">Không tìm thấy công cụ phù hợp với từ khóa trên.</div>'}
          </div>
        </div>
      `;

      const searchInput = body.querySelector('#input-mod46-search');
      searchInput?.addEventListener('input', (ev) => {
        const val = ev.target.value;
        const pos = ev.target.selectionStart || val.length;
        this.renderHubScreen(val);
        const again = document.getElementById('input-mod46-search');
        if (again) {
          again.focus();
          again.setSelectionRange(pos, pos);
        }
      });

      body.querySelector('#btn-mod46-toggle-all-groups')?.addEventListener('click', () => {
        this.allGroupsCollapsed = !this.allGroupsCollapsed;
        activeGroups.forEach((g) => {
          this.collapsedGroups[g.id] = this.allGroupsCollapsed;
        });
        this.renderHubScreen(searchInput?.value || '');
      });

      body.querySelectorAll('[data-mod46-toggle-group]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const gid = btn.getAttribute('data-mod46-toggle-group');
          this.collapsedGroups[gid] = !this.collapsedGroups[gid];
          this.allGroupsCollapsed = activeGroups.every((g) => Boolean(this.collapsedGroups[g.id]));
          this.renderHubScreen(searchInput?.value || '');
        });
      });

      body.querySelectorAll('[data-mod46-tool]').forEach((btn) => {
        btn.addEventListener('click', () => {
          // Ghi nhớ chính xác vị trí đã lướt để khi bấm "← Danh mục công cụ" quay lại đúng chỗ!
          this.lastHubScrollTop = body.scrollTop || 0;
          const tid = btn.getAttribute('data-mod46-tool');
          const tool = activeTools.find((t) => t.id === tid);
          if (tool) this.selectTool(tool);
        });
      });

      if (restoreScroll && typeof this.lastHubScrollTop === 'number' && this.lastHubScrollTop > 0) {
        requestAnimationFrame(() => {
          body.scrollTop = this.lastHubScrollTop;
        });
      }
      NS.i18n?.translateElement?.(body);
    }

    selectTool(tool, preloadedFile = null) {
      this.activeTool = tool;
      this.resetWorkspaceState();
      this.sigCustomPos = null;
      document.getElementById('btn-mod46-header-new-file')?.classList.remove('hidden');
      if (preloadedFile) {
        this.ingestFiles([preloadedFile]);
      } else {
        this.renderUploadOrWorkspaceScreen();
      }
    }

    // ------------------------------------------------------------------------
    // MÀN HÌNH 2 & 3: NẠP TỆP & KHÔNG GIAN CẤU HÌNH (2 CỘT)
    // ------------------------------------------------------------------------
    async ingestFiles(fileList) {
      const tool = this.activeTool;
      if (!tool || !fileList || !fileList.length) return;
      const incoming = Array.from(fileList);
      const acceptedExts = String(tool.accept || '')
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);
      const IMAGE_EXT_RE = /\.(jpe?g|jfif|png|webp|bmp|gif|heic|heif|tiff?|avif)$/i;
      const MIME_TO_EXTS = {
        'image/jpeg': ['.jpg', '.jpeg', '.jfif'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'image/bmp': ['.bmp'],
        'image/gif': ['.gif'],
        'image/heic': ['.heic', '.heif'],
        'image/tiff': ['.tif', '.tiff'],
        'application/pdf': ['.pdf'],
      };
      const isFileAccepted = (f) => {
        if (!acceptedExts.length) return true;
        const nameLower = String(f.name || '').toLowerCase();
        const ext = nameLower.includes('.') ? '.' + nameLower.split('.').pop() : '';
        const mime = String(f.type || '').toLowerCase();
        return acceptedExts.some((a) => {
          if (a === '*/*') return true;
          if (a === 'image/*') return mime.startsWith('image/') || IMAGE_EXT_RE.test(nameLower);
          if (a === ext) return true;
          if ((a === '.jpg' && ext === '.jpeg') || (a === '.jpeg' && ext === '.jpg')) return true;
          if (a.includes('/')) {
            if (mime && mime === a) return true;
            const mapped = MIME_TO_EXTS[a];
            if (mapped && mapped.includes(ext)) return true;
          }
          return false;
        });
      };

      const showDropzoneFeedback = (msg) => {
        const dzErr = document.getElementById('mod46-dropzone-error');
        if (dzErr) {
          dzErr.textContent = msg;
          dzErr.classList.remove('hidden');
        }
      };

      const validFiles = [];
      for (const f of incoming) {
        if (!f || f.size === 0) {
          const msg = `⚠️ Tệp "${f?.name || 'trống'}" bị rỗng (0 KB) nên không thể nạp.`;
          this.toast(msg, 'warning', 3200);
          showDropzoneFeedback(msg);
          continue;
        }
        if (!isFileAccepted(f)) {
          const msg = `❌ Tệp "${f.name}" không đúng định dạng cho công cụ "${tool.name}" (chấp nhận: ${tool.accept}).`;
          this.toast(msg, 'error', 3600);
          showDropzoneFeedback(msg);
          continue;
        }
        validFiles.push(f);
      }
      if (!validFiles.length) return;

      if (!tool.multiple) {
        this.resetWorkspaceState();
      }

      for (const f of validFiles) {
        let bytes;
        try {
          const buf = await f.arrayBuffer();
          bytes = new Uint8Array(buf);
        } catch (readErr) {
          const msg = `⚠️ Không đọc được tệp "${f.name}": ${readErr?.message || readErr}`;
          this.toast(msg, 'error', 3600);
          showDropzoneFeedback(msg);
          continue;
        }
        const rec = {
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file: f,
          name: f.name,
          size: f.size,
          bytes,
          pageCount: 0,
          thumbUrl: ''
        };
        const isImgFile = String(f.type || '').toLowerCase().startsWith('image/') || IMAGE_EXT_RE.test(String(f.name || ''));
        if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
          const headStr = String.fromCharCode(...bytes.slice(0, 8));
          if (!headStr.includes('%PDF') && tool.id !== 'repair_pdf') {
            const msg = `⚠️ Tệp "${f.name}" không đúng ruột định dạng PDF thật (%PDF) nên đã tự động từ chối an toàn.`;
            this.toast(msg, 'warning', 3600);
            showDropzoneFeedback(msg);
            continue;
          }
          try {
            const { PDFDocument } = await ensurePdfLib();
            const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
            rec.pageCount = doc.getPageCount();
          } catch (err) {
            if (/encrypt/i.test(String(err?.message || err))) {
              this.toast(`🔒 Tệp "${f.name}" đang bị khóa mật khẩu! Hãy mở khóa bằng mật khẩu trước khi chỉnh sửa.`, 'warning', 4200);
            }
          }
        } else if (isImgFile) {
          rec.thumbUrl = this.trackUrl(f);
          rec.pageCount = 1;
        }
        this.files.push(rec);
      }
      if (!this.files.length) return;

      // Nếu là công cụ Sắp xếp / Xoay / Xóa trang -> dựng mảng trạng thái ảo từng trang
      if (tool.id === 'organize' && this.files[0]) {
        const total = Math.max(1, this.files[0].pageCount || 1);
        this.pagesState = Array.from({ length: total }, (_, i) => ({
          uid: `pg_${i}_${Date.now()}`,
          pageIndex: i,
          rotation: 0,
          isBlank: false,
          isDeleted: false,
          thumbUrl: ''
        }));
      }

      this.renderUploadOrWorkspaceScreen();
      // Render ảnh thu nhỏ PDF ngầm (Lazy, không làm đơ giao diện)
      this.renderPdfThumbnailsAsync();
      // Hiện pop-up 3 lựa chọn AI (AI 1 chạm / AI Thủ công 0-Token / Không cần AI) sau khi nạp tệp cho các công cụ có tích hợp AI!
      const AI_CHOICE_TOOLS = new Set([
        'beautify_10_themes', 'theme_report', 'icr_handwriting_pdf', 'ocr_pdf',
        'pdf_to_docx', 'pdf_to_excel', 'bookmarks_toc', 'true_redaction',
        'metadata_editor', 'split_smart_books', 'form_filler_builder',
      ]);
      if (
        AI_CHOICE_TOOLS.has(tool.id) &&
        this.files.length > 0 &&
        !this.pendingTheme10AiFormat &&
        !global.__NOIR_AUTOTESTER_RUNNING__ &&
        !this._suppressNextAiChoicePopup
      ) {
        setTimeout(() => this.openPostUploadAiChoiceModal(tool), 80);
      }
      this._suppressNextAiChoicePopup = false;
    }

    openPostUploadAiChoiceModal(tool) {
      if (!tool || !this.files.length || global.__NOIR_AUTOTESTER_RUNNING__) return;
      document.getElementById('mod46-post-upload-ai-choice-modal')?.remove();
      const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
      const hasKey = Boolean(gBridge?.hasApiKey?.());
      const f0 = this.files[0];
      const modal = document.createElement('div');
      modal.id = 'mod46-post-upload-ai-choice-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:2147483615;background:rgba(5,9,18,0.82);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:16px;';
      modal.innerHTML = `
        <div class="w-full max-w-lg rounded-3xl border border-emerald-500/45 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-3.5 text-center">
          <div class="flex items-center justify-between gap-2 text-left">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-2xl">${tool.icon || '✨'}</span>
              <div class="min-w-0">
                <div class="text-sm font-bold text-emerald-300 truncate">Đã nạp tệp: ${escHtml(f0?.name || '')}</div>
                <div class="text-[11px] text-zinc-400">Chọn cách xử lý cho "${escHtml(tool.name)}":</div>
              </div>
            </div>
            <button type="button" id="btn-mod46-choice-close" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold cursor-pointer shrink-0">✕</button>
          </div>
          <div class="space-y-2.5 pt-1">
            <button type="button" id="btn-mod46-choice-ai-auto" class="noir-ai-blink-btn w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-xl cursor-pointer transition">
              ${hasKey ? '✨ Định dạng & Xử lý chính xác bằng AI (1 chạm tự động)' : '🔗 Kết nối AI của bạn để xử lý chính xác 1 chạm'}
            </button>
            <button type="button" id="btn-mod46-choice-ai-manual" class="w-full py-3 px-4 rounded-xl border border-emerald-500/55 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 font-bold text-xs sm:text-sm cursor-pointer transition">
              📋 Dùng AI Thủ công (Không cần API Key · Copy Prompt + Gửi file lên Gemini → Dán kết quả)
            </button>
            <button type="button" id="btn-mod46-choice-no-ai" class="w-full py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition">
              Tôi không cần AI (Bạn bỏ qua AI, độ chính xác của file sẽ giảm đi đáng kể)
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      try { NS.i18n?.translateElement?.(modal); } catch (_eTrCh) {}
      const closeChoice = () => modal.remove();
      modal.querySelector('#btn-mod46-choice-close')?.addEventListener('click', closeChoice);
      modal.querySelector('#btn-mod46-choice-no-ai')?.addEventListener('click', closeChoice);
      modal.addEventListener('click', (ev) => { if (ev.target === modal) closeChoice(); });

      const manualBtnIdMap = {
        beautify_10_themes: '#btn-mod46-vision-manual-ai',
        theme_report: '#btn-mod46-vision-manual-ai',
        icr_handwriting_pdf: '#btn-pro-manual-ai-icr',
        ocr_pdf: '#btn-pro-manual-ai-ocr',
        pdf_to_docx: '#btn-pro-manual-ai-p2d',
        pdf_to_excel: '#btn-pro-manual-ai-p2x',
        compare_pdf: '#btn-pro-manual-ai-compare',
        bookmarks_toc: '#btn-pro-manual-ai-toc',
        true_redaction: '#btn-pro-manual-ai-pii',
        metadata_editor: '#btn-pro-manual-ai-meta',
        split_smart_books: '#btn-pro-manual-ai-split',
        form_filler_builder: '#btn-pro-manual-ai-form',
      };
      const autoBtnIdMap = {
        beautify_10_themes: '#btn-mod46-run-gemini-vision',
        theme_report: '#btn-mod46-run-gemini-vision',
        icr_handwriting_pdf: '#btn-mod46-run-primary',
        ocr_pdf: '#btn-mod46-ocr-ai-fast',
        pdf_to_docx: '#btn-mod46-tool-ai-fast',
        pdf_to_excel: '#btn-mod46-tool-ai-fast',
        compare_pdf: '#btn-mod46-tool-ai-fast',
        bookmarks_toc: '#btn-pro-ai-fast-toc',
        true_redaction: '#btn-pro-ai-scan-pii',
        metadata_editor: '#btn-pro-ai-gen-meta',
        split_smart_books: '#btn-pro-ai-split-kw',
        form_filler_builder: '#btn-pro-ai-fill-form',
      };

      modal.querySelector('#btn-mod46-choice-ai-auto')?.addEventListener('click', () => {
        closeChoice();
        const triggerAuto = () => {
          const targetBtn = document.querySelector(autoBtnIdMap[tool.id] || '#btn-mod46-run-primary');
          if (targetBtn) {
            targetBtn.click();
          } else if (tool.id === 'beautify_10_themes' || tool.id === 'theme_report') {
            this.pendingTheme10AiFormat = true;
            this.renderUploadOrWorkspaceScreen();
          }
        };
        if (!gBridge?.hasApiKey?.()) {
          gBridge?.openApiKeyQuickModal?.({ onSaved: () => { this.renderUploadOrWorkspaceScreen(); setTimeout(triggerAuto, 150); } });
        } else {
          triggerAuto();
        }
      });

      modal.querySelector('#btn-mod46-choice-ai-manual')?.addEventListener('click', () => {
        closeChoice();
        const manualSel = manualBtnIdMap[tool.id];
        const btn = manualSel ? document.querySelector(manualSel) : null;
        if (btn) {
          btn.click();
          return;
        }
        // Fallback trực tiếp cho Theme 10 nếu bản phân tích PDF chưa dựng xong v2Host
        const promptTxt = gBridge?.buildTaskManualPrompt?.('theme10_beautify', { fileName: f0?.name || 'Tai_lieu.pdf' }) || gBridge?.PROMPT_CHINH_TIEU_DE_CHUAN || '';
        gBridge?.openManualAiAssistantModal?.({
          taskTitle: `${tool.name} — AI Thủ công (0-Token)`,
          promptText: promptTxt,
          attachFileName: f0?.name || '',
          attachFileBlob: f0?.file || (f0?.bytes ? new Blob([f0.bytes]) : null),
          applyBtnLabel: '✅ Nạp Markdown vào 10 Theme & Xuất PDF đẹp',
          onApplyPasted: (md) => {
            const stitched = gBridge?.stitchContinueTables ? gBridge.stitchContinueTables(md) : md;
            const parsers = global.NoirStructuredParsers || NS.structuredParsers;
            const astLib = global.NoirDocAst || NS.docAst;
            if (parsers && astLib) {
              const ast = parsers.parseMarkdownToAst(stitched, { filename: f0?.name || 'ai_manual.md' });
              this.theme10OverrideBlocks = astLib.astToLegacyBlocks(ast);
              this._suppressNextAiChoicePopup = true;
              this.renderUploadOrWorkspaceScreen();
              this.toast('✅ Đã nạp xong nội dung chuẩn từ Gemini! Chọn màu Theme và bấm Xuất PDF đẹp.', 'success', 4000);
            }
          },
        });
      });
    }

    async renderPdfThumbnailsAsync() {
      const tool = this.activeTool;
      if (!tool || !this.files.length) return;
      const hasPdf = this.files.some((f) => /\.pdf$/i.test(f.name) || f.file.type === 'application/pdf');
      if (!hasPdf) return;
      try {
        const pdfjsLib = await ensurePdfJs();
        if (tool.id === 'organize' && this.files[0]) {
          const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
          this.files[0].pageCount = pdf.numPages;
          const limit = Math.min(pdf.numPages, 36);
          for (let i = 0; i < limit; i++) {
            if (this.activeTool?.id !== 'organize') return;
            const page = await pdf.getPage(i + 1);
            const vp = page.getViewport({ scale: 0.55 });
            const c = document.createElement('canvas');
            c.width = Math.round(vp.width);
            c.height = Math.round(vp.height);
            await page.render({ canvasContext: c.getContext('2d'), viewport: vp, intent: 'display' }).promise;
            const url = c.toDataURL('image/jpeg', 0.86);
            c.width = c.height = 0;
            const st = this.pagesState.find((p) => !p.isBlank && p.pageIndex === i);
            if (st) {
              st.thumbUrl = url;
              const imgEl = document.querySelector(`[data-mod46-page-thumb="${st.uid}"]`);
              if (imgEl) imgEl.src = url;
            }
          }
          return;
        }
        for (const rec of this.files) {
          if (!/\.pdf$/i.test(rec.name) && rec.file.type !== 'application/pdf') continue;
          const pdf = await pdfjsLib.getDocument({ data: rec.bytes.slice() }).promise;
          rec.pageCount = pdf.numPages;
          const page = await pdf.getPage(1);
          const vp = page.getViewport({ scale: tool.id === 'crop' || tool.id === 'sign_edit' ? 1.15 : 0.58 });
          const c = document.createElement('canvas');
          c.width = Math.round(vp.width);
          c.height = Math.round(vp.height);
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp, intent: 'display' }).promise;
          rec.thumbUrl = c.toDataURL('image/jpeg', 0.88);
          c.width = c.height = 0;
          const imgEl = document.querySelector(`[data-mod46-file-thumb="${rec.id}"]`);
          if (imgEl) imgEl.src = rec.thumbUrl;
          const pgEl = document.querySelector(`[data-mod46-file-pages="${rec.id}"]`);
          if (pgEl) pgEl.textContent = `${rec.pageCount} trang`;
        }
      } catch (_eThumb) {}
    }

    renderUploadOrWorkspaceScreen() {
      const body = document.getElementById('mod46-studio-body');
      const backBtn = document.getElementById('btn-mod46-back-hub');
      if (!body || !this.activeTool) return;
      backBtn?.classList.remove('hidden');

      const tool = this.activeTool;
      const isTheme10 = tool.id === 'beautify_10_themes' || tool.id === 'theme_report';

      const themeHeadingNoticeHtml =
        (tool.id === 'beautify_10_themes' || tool.id === 'auto_toc' || tool.id === 'theme_report')
          ? `<div id="mod46-theme-heading-notice" class="rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-950/75 via-rose-950/60 to-amber-950/75 px-4 py-3 text-left shadow-[0_0_24px_rgba(245,158,11,0.3)] animate-pulse">
               <div class="text-xs sm:text-sm font-black text-amber-200 leading-relaxed">
                 ✨ Lưu ý quan trọng để AI nhận diện &amp; lọc đề mục chuẩn 100%: Bạn phải có đề mục rõ ràng từ số La Mã như I. II. III. IV. tới 1. 1.1. 1.2. vân vân thì AI mới tạo đề mục, lọc đề mục chính xác; đề mục là Chương 1, Chương 2... hay Phần 1, Phần 2... thì cũng phải rõ ràng, cách dòng đầy đủ nha!
               </div>
             </div>`
          : '';

      // MÀN HÌNH 2: CHƯA CÓ FILE -> KHUNG KÉO THẢ LỚN DỄ DÙNG (trừ công cụ Tạo mới không cần nạp file)
      if (!this.files.length && !tool.noFileRequired) {
        const inputTab = isTheme10 ? (this.theme10InputTab || 'upload') : 'upload';
        const geminiBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const hasGKey = Boolean(geminiBridge?.hasApiKey?.());

        const aiHelperBarHtml = isTheme10
          ? `<div id="mod46-ai-helper-bar" class="rounded-2xl border ${hasGKey ? 'border-emerald-500/45 bg-emerald-950/25' : 'border-cyan-500/35 bg-zinc-900/85'} p-3 flex flex-wrap items-center justify-between gap-2">
               <div class="text-xs font-bold ${hasGKey ? 'text-emerald-300' : 'text-cyan-200'}">
                 ${hasGKey ? '✅ Đã liên kết Gemini API Key — Sẵn sàng tự động định dạng PDF chuẩn 1 chạm!' : '💡 Kết nối Gemini API Key miễn phí để tự động chuẩn hóa tiêu đề, bảng biểu & xuất PDF siêu đẹp!'}
               </div>
               <div class="flex flex-wrap items-center gap-2">
                 <button type="button" id="btn-mod46-view-std-prompt" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition">👁️ Xem Prompt chuẩn</button>
                 <button type="button" id="btn-mod46-gemini-key-pill" class="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${hasGKey ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300' : 'border-cyan-500/45 bg-cyan-950/40 text-cyan-200'}">
                   ${hasGKey ? '🔑 Đổi API Key' : '🔗 Kết nối AI của bạn'}
                 </button>
               </div>
             </div>`
          : '';

        const theme10CtaBelowDropzoneHtml = isTheme10
          ? `<div id="mod46-theme10-ai-cta-box" class="rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4 space-y-2.5 text-center">
               ${hasGKey
                 ? `<button type="button" id="btn-mod46-run-ai-beautify" class="noir-ai-blink-btn w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm sm:text-base shadow-xl cursor-pointer transition">
                      ✨ Định dạng văn bản chính xác bằng AI để xuất PDF đẹp
                    </button>`
                 : `<button type="button" id="btn-mod46-connect-ai" class="noir-ai-blink-btn w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl cursor-pointer transition">
                      🔗 Kết nối AI của bạn
                    </button>`}
               <button type="button" id="btn-mod46-theme10-manual-ai" class="w-full py-2.5 px-4 rounded-xl border border-emerald-500/55 bg-emerald-950/35 hover:bg-emerald-900/55 text-emerald-200 font-bold text-xs sm:text-sm cursor-pointer transition">
                 📋 Dùng AI Thủ công (Không cần API Key · Copy Prompt + Gửi file lên Gemini → Dán kết quả)
               </button>
               <button type="button" id="btn-mod46-skip-ai" class="w-full py-2 px-4 rounded-xl border border-zinc-700 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition">
                 Tôi không cần AI (Bạn bỏ qua AI, độ chính xác của file sẽ giảm đi đáng kể)
               </button>
             </div>`
          : '';

        body.innerHTML = `
          <div class="max-w-3xl mx-auto py-4 space-y-4">
            <div class="text-center space-y-1.5">
              <div class="text-4xl">${tool.icon}</div>
              <h3 class="text-lg sm:text-xl font-bold text-zinc-100">${escHtml(tool.name)}</h3>
              <p class="text-xs sm:text-sm text-zinc-400">${escHtml(tool.desc)}</p>
            </div>

            ${themeHeadingNoticeHtml}
            ${aiHelperBarHtml}

            <div id="mod46-dropzone" class="rounded-3xl border-2 border-dashed border-rose-400/60 hover:border-rose-300 bg-zinc-900/70 p-8 sm:p-12 text-center space-y-4 transition cursor-pointer">
              <div class="text-5xl">📂</div>
              <div class="text-sm sm:text-base font-bold text-zinc-200">Kéo thả tệp vào đây hoặc bấm nút bên dưới</div>
              <div>
                <input id="input-mod46-file-picker" type="file" accept="${escHtml(tool.accept)}" ${tool.multiple ? 'multiple' : ''} class="hidden" />
                <button type="button" id="btn-mod46-select-files" class="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl transition cursor-pointer">
                  📂 Chọn tệp từ máy tính
                </button>
              </div>
              <div class="text-[11px] text-zinc-400">Hỗ trợ: <span class="font-bold text-amber-300">${escHtml(tool.badge)}</span></div>
              <div id="mod46-dropzone-error" class="hidden mx-auto max-w-xl px-3.5 py-2 rounded-xl border border-rose-500/60 bg-rose-950/70 text-rose-200 text-xs font-bold"></div>
            </div>

            ${theme10CtaBelowDropzoneHtml}
          </div>
        `;
        if (isTheme10) {
          body.querySelector('#btn-mod46-view-std-prompt')?.addEventListener('click', () => geminiBridge?.openPromptPreviewModal?.());
          const openKeyModalAndRefresh = () => {
            geminiBridge?.openApiKeyQuickModal?.({ onSaved: () => this.renderUploadOrWorkspaceScreen() });
          };
          body.querySelector('#btn-mod46-gemini-key-pill')?.addEventListener('click', openKeyModalAndRefresh);
          body.querySelector('#btn-mod46-connect-ai')?.addEventListener('click', openKeyModalAndRefresh);
          body.querySelector('#btn-mod46-theme10-manual-ai')?.addEventListener('click', () => {
            const f0 = this.files[0];
            const promptTxt = geminiBridge?.buildTaskManualPrompt?.('theme10_beautify', { fileName: f0?.name || 'Tai_lieu_cua_ban.pdf' }) || geminiBridge?.PROMPT_CHINH_TIEU_DE_CHUAN || '';
            geminiBridge?.openManualAiAssistantModal?.({
              taskTitle: 'Phối Màu 10 Theme — AI Thủ công (0-Token)',
              promptText: promptTxt,
              attachFileName: f0?.name || 'Tệp DOCX / XLSX / PDF bạn muốn phối màu',
              attachFileBlob: f0?.file || (f0?.bytes ? new Blob([f0.bytes]) : null),
              applyBtnLabel: '✅ Nạp Markdown vào 10 Theme & Xuất PDF đẹp',
              onApplyPasted: (md) => {
                const stitched = geminiBridge?.stitchContinueTables ? geminiBridge.stitchContinueTables(md) : md;
                const bytes = new TextEncoder().encode(stitched);
                const docTitle = (f0?.name || 'Bao_Cao_AI_Thu_Cong').replace(/\.[^.]+$/, '');
                this.resetWorkspaceState();
                this.files = [{
                  id: `ai_manual_${Date.now()}`,
                  name: `${docTitle}.md`,
                  size: bytes.byteLength,
                  bytes,
                  text: stitched,
                  ext: 'md',
                  pageCount: 1,
                  thumbUrl: '',
                }];
                const parsers = global.NoirStructuredParsers || NS.structuredParsers;
                const astLib = global.NoirDocAst || NS.docAst;
                if (parsers && astLib) {
                  const ast = parsers.parseMarkdownToAst(stitched, { filename: `${docTitle}.md` });
                  this.theme10OverrideBlocks = astLib.astToLegacyBlocks(ast);
                }
                this.renderUploadOrWorkspaceScreen();
                this.toast('✅ Đã nạp nội dung cấu trúc từ Gemini! Chọn màu Theme và bấm Xuất PDF đẹp ngay.', 'success', 4000);
              },
            });
          });
          body.querySelector('#btn-mod46-skip-ai')?.addEventListener('click', () => {
            this.pendingTheme10AiFormat = false;
            this.toast('ℹ️ Đã chọn chế độ không dùng AI. Hãy chọn tệp để tiếp tục bằng thuật toán Code.', 'info', 2800);
            body.querySelector('#input-mod46-file-picker')?.click();
          });
          body.querySelector('#btn-mod46-run-ai-beautify')?.addEventListener('click', () => {
            if (!this.files.length) {
              const old = document.getElementById('mod46-need-file-popup');
              if (old) old.remove();
              const pop = document.createElement('div');
              pop.id = 'mod46-need-file-popup';
              pop.style.cssText = 'position:fixed;inset:0;z-index:2147483610;background:rgba(5,9,18,0.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';
              pop.innerHTML = `
                <div class="max-w-sm w-full rounded-2xl border border-amber-400/50 bg-zinc-900 p-5 text-center space-y-3 shadow-2xl">
                  <div class="text-3xl">📄</div>
                  <div class="text-sm font-bold text-amber-200 leading-relaxed">Bạn phải tải lên tệp bạn muốn chỉnh sửa đã</div>
                  <div class="flex gap-2 justify-center pt-1">
                    <button type="button" id="btn-mod46-pop-pick-ai" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">📂 Chọn tệp &amp; Chạy AI ngay</button>
                    <button type="button" id="btn-mod46-pop-close" class="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer">Đóng</button>
                  </div>
                </div>
              `;
              document.body.appendChild(pop);
              pop.querySelector('#btn-mod46-pop-close')?.addEventListener('click', () => pop.remove());
              pop.addEventListener('click', (ev) => { if (ev.target === pop) pop.remove(); });
              pop.querySelector('#btn-mod46-pop-pick-ai')?.addEventListener('click', () => {
                pop.remove();
                this.pendingTheme10AiFormat = true;
                body.querySelector('#input-mod46-file-picker')?.click();
              });
              return;
            }
          });
        }
        const picker = body.querySelector('#input-mod46-file-picker');
        const dz = body.querySelector('#mod46-dropzone');
        body.querySelector('#btn-mod46-select-files')?.addEventListener('click', (ev) => {
          ev.stopPropagation();
          picker?.click();
        });
        dz?.addEventListener('click', () => picker?.click());
        picker?.addEventListener('change', (ev) => {
          const fl = ev.target.files ? Array.from(ev.target.files) : [];
          try { ev.target.value = ''; } catch (_eReset) {}
          if (fl.length) this.ingestFiles(fl);
        });
        dz?.addEventListener('dragover', (ev) => {
          ev.preventDefault();
          dz.classList.add('border-emerald-400', 'bg-emerald-950/25');
        });
        dz?.addEventListener('dragleave', () => {
          dz.classList.remove('border-emerald-400', 'bg-emerald-950/25');
        });
        dz?.addEventListener('drop', (ev) => {
          ev.preventDefault();
          dz.classList.remove('border-emerald-400', 'bg-emerald-950/25');
          this.ingestFiles(ev.dataTransfer?.files);
        });
        return;
      }

      // MÀN HÌNH 3: KHÔNG GIAN LÀM VIỆC 2 CỘT (70% XEM TRƯỚC / 30% TÙY CHỌN)
      const totalBytes = this.files.reduce((s, f) => s + f.size, 0);
      const over300Mb = totalBytes > 300 * 1024 * 1024;
      const canRun = tool.noFileRequired || this.files.length >= (tool.minFiles || 1);
      const gBridge = global.NoirGeminiBridge || NS.geminiBridge;

      if (this.pendingTheme10AiFormat && isTheme10 && this.files[0] && gBridge?.hasApiKey?.()) {
        this.pendingTheme10AiFormat = false;
        setTimeout(async () => {
          const loader = gBridge.showAiFullLoadingOverlay?.(
            '✨ AI đang tự động đọc & chuẩn hóa tài liệu...',
            'Đang kết hợp thuật toán phân tích cấu trúc và Gemini API để tạo PDF đẹp nhất!'
          );
          try {
            const f0 = this.files[0];
            const isPdfF0 = /\.pdf$/i.test(f0.name || '');
            let formatted = null;
            if (isPdfF0 && f0.bytes && f0.bytes.byteLength <= 18 * 1024 * 1024 && typeof gBridge.runGeminiNativeFastRead === 'function') {
              loader?.update?.('⚡ Đang gửi trực tiếp file PDF gốc sang Gemini Flash (Siêu tốc 1 lượt)...', 24);
              const fastRes = await gBridge.runGeminiNativeFastRead(f0, {
                ensurePdfJs,
                ensurePdfLib,
                onProgress: (pct, msg) => loader?.update?.(msg, pct),
              });
              formatted = fastRes?.blocks || null;
            } else {
              const extractor = global.NoirExtractStructuredBlocksFromFile || NS.dangLovePdfPro?.extractStructuredBlocksFromFile;
              loader?.update?.('🔍 Đang trích xuất cấu trúc gốc từ tệp...', 20);
              const rawBlocks = extractor ? await extractor(f0, { ensurePdfJs, ensureJsZip, ensureXlsx }) : [];
              formatted = await gBridge.runAiFormatDocumentToAst?.(rawBlocks, {
                fileName: f0.name,
                onProgress: (pct, msg) => loader?.update?.(msg, pct),
              });
            }
            if (Array.isArray(formatted) && formatted.length) {
              this.theme10OverrideBlocks = formatted;
              loader?.update?.('✅ AI đã hoàn tất chuẩn hóa! Đang nạp vào bản xem trước...', 96);
            }
          } catch (err) {
            const f0 = this.files[0];
            const promptTxt = gBridge.buildTaskManualPrompt?.('theme10_beautify', { fileName: f0?.name || 'Tai_lieu' }) || gBridge.PROMPT_CHINH_TIEU_DE_CHUAN;
            loader?.showError?.(
              '⚠️ Không thể tự động định dạng bằng Gemini API',
              String(err?.message || err),
              {
                manualFallback: {
                  taskTitle: 'Phối Màu 10 Theme — Dán Markdown chuẩn từ Gemini Web',
                  promptText: promptTxt,
                  attachFileName: f0?.name || '',
                  attachFileBlob: f0?.file || (f0?.bytes ? new Blob([f0.bytes]) : null),
                  applyBtnLabel: '✅ Nạp Markdown vào 10 Theme & Xuất PDF đẹp',
                  onApplyPasted: (md) => {
                    const stitched = gBridge.stitchContinueTables(md);
                    const parsers = global.NoirStructuredParsers || NS.structuredParsers;
                    const astLib = global.NoirDocAst || NS.docAst;
                    if (parsers && astLib) {
                      const ast = parsers.parseMarkdownToAst(stitched, { filename: f0?.name || 'ai_manual.md' });
                      const blocks = astLib.astToLegacyBlocks(ast);
                      this.theme10OverrideBlocks = blocks;
                      this._theme10AnalyzedCache = { fileId: f0?.id, blocks, ast };
                      this.renderUploadOrWorkspaceScreen();
                      this.toast('✅ Đã nạp xong nội dung chuẩn từ Gemini! Bấm "Áp dụng Theme" để xuất PDF.', 'success', 4000);
                    }
                  },
                },
              }
            );
            return;
          }
          loader?.close?.();
          this.renderUploadOrWorkspaceScreen();
        }, 40);
      }

      body.innerHTML = `
        <div class="max-w-6xl mx-auto space-y-3">
          ${themeHeadingNoticeHtml}
          ${over300Mb ? `<div class="px-3.5 py-2 rounded-xl border border-amber-400/60 bg-amber-950/45 text-amber-200 text-xs font-bold">⚠️ Tổng dung lượng tệp (${formatBytes(totalBytes)}) vượt 300 MB — nên chia nhỏ để trình duyệt xử lý mượt nhất.</div>` : ''}

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <!-- CỘT TRÁI (70% -> 8/12): XEM TRƯỚC & THAO TÁC TRỰC QUAN -->
            <div class="lg:col-span-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                <div class="text-xs sm:text-sm font-black text-zinc-100 flex items-center gap-2">
                  <span>${tool.icon}</span>
                  <span>${escHtml(tool.name)}</span>
                  <span class="text-xs font-bold text-zinc-400">(${this.files.length} tệp · ${formatBytes(totalBytes)})</span>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <input id="input-mod46-add-more" type="file" accept="${escHtml(tool.accept)}" ${tool.multiple ? 'multiple' : ''} class="hidden" />
                  ${tool.multiple ? `<button type="button" id="btn-mod46-add-more" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer">+ Thêm tệp</button>` : ''}
                  ${tool.multiple && this.files.length > 1 ? `
                    <button type="button" id="btn-mod46-sort-az" class="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold cursor-pointer">A → Z</button>
                    <button type="button" id="btn-mod46-sort-za" class="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold cursor-pointer">Z → A</button>
                  ` : ''}
                  ${tool.id === 'organize' ? `<button type="button" id="btn-mod46-add-blank-page" class="px-2.5 py-1 rounded-lg border border-emerald-500/50 bg-emerald-500/15 text-emerald-200 text-[11px] font-bold cursor-pointer">+ Trang trắng</button>` : ''}
                  <button type="button" id="btn-mod46-clear-files" class="px-2.5 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-600 text-rose-200 hover:text-white text-[11px] font-bold cursor-pointer">🗑️ Xóa hết</button>
                </div>
              </div>

              <div id="mod46-preview-area">${this.buildPreviewAreaHtml()}</div>
              <div id="mod46-v2-toc-and-vision-host" class="hidden pt-2 border-t border-zinc-800 space-y-3"></div>
              <div id="mod46-fullpages-preview-host" class="hidden pt-2 border-t border-zinc-800 space-y-2"></div>
            </div>

            <!-- CỘT PHẢI (30% -> 4/12): TÙY CHỌN & NÚT THỰC HIỆN -->
            <div class="lg:col-span-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-4 lg:sticky lg:top-2">
              <div class="text-xs font-black uppercase tracking-wider text-amber-300 border-b border-zinc-800 pb-2">⚙️ Tùy chọn nhanh</div>
              <div id="mod46-options-panel" class="space-y-3 text-xs">${this.buildOptionsPanelHtml()}</div>
              <div class="pt-2 border-t border-zinc-800 space-y-2">
                <button type="button" id="btn-mod46-run-primary" ${canRun ? '' : 'disabled'} data-at-id="mod46-run-primary" class="w-full py-3 rounded-2xl font-bold text-sm shadow-xl transition ${canRun ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}">
                  🚀 ${escHtml(tool.actionLabel)}
                </button>
                ${tool.id === 'ocr_pdf' ? `
                  <button type="button" id="btn-mod46-ocr-ai-fast" ${canRun ? '' : 'disabled'} data-at-id="mod46-ocr-ai-fast" class="w-full py-2.5 px-3 rounded-2xl font-bold text-xs shadow-lg transition ${canRun ? 'bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 text-white cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}">
                    ⚡ Chạy OCR Siêu Tốc bằng AI (Gemini 3.8 Flash · JSON chuẩn)
                  </button>
                  <button type="button" id="btn-pro-manual-ai-ocr" data-at-id="mod46-ocr-manual-ai" class="w-full py-2 px-3 rounded-xl border border-sky-500/55 bg-sky-950/40 hover:bg-sky-900/60 text-sky-100 text-[11.5px] font-bold cursor-pointer">
                    📋 Nhập AI Thủ công OCR (0-Token · Copy Prompt + Gửi file → Dán kết quả)
                  </button>
                ` : ''}
                ${tool.id === 'compare_pdf' ? `
                  <button type="button" id="btn-mod46-tool-ai-fast" ${canRun ? '' : 'disabled'} data-at-id="mod46-compare-ai-fast" class="w-full py-2.5 px-3 rounded-2xl font-bold text-xs shadow-lg transition ${canRun ? 'bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 text-white cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}">
                    ⚡ AI Siêu Tốc · So sánh &amp; Tóm tắt khác biệt (Gemini 3.8 Flash)
                  </button>
                  <button type="button" id="btn-pro-manual-ai-compare" ${canRun ? '' : 'disabled'} data-at-id="mod46-compare-manual-ai" class="w-full py-2 px-3 rounded-xl border border-sky-500/55 bg-sky-950/40 hover:bg-sky-900/60 text-sky-100 text-[11.5px] font-bold cursor-pointer">
                    📋 AI Thủ Công · So sánh 2 PDF (0-Token · Copy Diff &amp; Dán tóm tắt)
                  </button>
                ` : ''}
                ${tool.id === 'pdf_to_excel' ? `
                  <button type="button" id="btn-mod46-tool-ai-fast" ${canRun ? '' : 'disabled'} data-at-id="mod46-p2x-ai-fast" class="w-full py-2.5 px-3 rounded-2xl font-bold text-xs shadow-lg transition ${canRun ? 'bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 text-white cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}">
                    ⚡ AI Siêu Tốc · Bóc bảng &amp; Chuẩn hóa Excel (Gemini 3.8 Flash)
                  </button>
                  <button type="button" id="btn-pro-manual-ai-p2x" ${canRun ? '' : 'disabled'} data-at-id="mod46-p2x-manual-ai" class="w-full py-2 px-3 rounded-xl border border-sky-500/55 bg-sky-950/40 hover:bg-sky-900/60 text-sky-100 text-[11.5px] font-bold cursor-pointer">
                    📋 AI Thủ Công · Bóc bảng → Excel (0-Token)
                  </button>
                ` : ''}
                ${tool.id === 'pdf_to_docx' ? `
                  <button type="button" id="btn-mod46-tool-ai-fast" ${canRun ? '' : 'disabled'} data-at-id="mod46-p2d-ai-fast" class="w-full py-2.5 px-3 rounded-2xl font-bold text-xs shadow-lg transition ${canRun ? 'bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 text-white cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}">
                    ⚡ AI Siêu Tốc · Chuẩn hóa sang Word / MD (Gemini 3.8 Flash)
                  </button>
                  <button type="button" id="btn-pro-manual-ai-p2d" ${canRun ? '' : 'disabled'} data-at-id="mod46-p2d-manual-ai" class="w-full py-2 px-3 rounded-xl border border-sky-500/55 bg-sky-950/40 hover:bg-sky-900/60 text-sky-100 text-[11.5px] font-bold cursor-pointer">
                    📋 AI Thủ Công · PDF → Word / MD (0-Token)
                  </button>
                ` : ''}
                ${!canRun ? `<div class="text-[11px] text-amber-300 text-center">Cần ít nhất ${tool.minFiles} tệp để thực hiện.</div>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

      this.bindWorkspaceInteractions(body);
      try { NS.i18n?.translateElement?.(body); } catch (_eTrBody) {}
    }

    buildPreviewAreaHtml() {
      const tool = this.activeTool;

      // Chế độ Sắp xếp / Xoay / Xóa từng trang PDF
      if (tool.id === 'organize') {
        const visiblePages = this.pagesState.filter((p) => !p.isDeleted);
        return `
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            ${visiblePages
              .map(
                (pg, idx) => `
              <div class="rounded-xl border border-zinc-700 bg-zinc-950 p-2 flex flex-col gap-1.5">
                <div class="relative aspect-[3/4] rounded-lg bg-zinc-900 overflow-hidden flex items-center justify-center">
                  ${pg.isBlank
                    ? '<div class="text-[11px] text-zinc-400 font-bold">Trang trắng</div>'
                    : `<img data-mod46-page-thumb="${pg.uid}" src="${pg.thumbUrl || ''}" alt="" class="max-w-full max-h-full object-contain transition-transform" style="transform:rotate(${pg.rotation}deg);" />`}
                  <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white">#${idx + 1}</span>
                </div>
                <div class="flex items-center justify-between gap-1 text-[10px]">
                  <button type="button" data-pg-act="left" data-pg-uid="${pg.uid}" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-bold" title="Đổi sang trái">◀</button>
                  <button type="button" data-pg-act="rot" data-pg-uid="${pg.uid}" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-amber-600 font-bold" title="Xoay 90°">↻</button>
                  <button type="button" data-pg-act="dup" data-pg-uid="${pg.uid}" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-emerald-600 font-bold" title="Nhân bản trang">📋</button>
                  <button type="button" data-pg-act="right" data-pg-uid="${pg.uid}" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-bold" title="Đổi sang phải">▶</button>
                  <button type="button" data-pg-act="del" data-pg-uid="${pg.uid}" class="px-1.5 py-0.5 rounded bg-rose-900/70 hover:bg-rose-600 font-bold" title="Xóa trang">✕</button>
                </div>
              </div>`
              )
              .join('')}
          </div>
        `;
      }

      // Chế độ True Interactive PDF Editor (Mod 46C)
      if (tool.id === 'annotate_edit' && this.files[0]) {
        return `<div id="mod46-true-editor-mount" class="min-h-[320px] flex items-center justify-center text-xs text-emerald-300 font-bold">⏳ Đang nạp Trình Chỉnh sửa PDF Trực Quan (Sửa chữ gốc, Vẽ, Ảnh, CAD)...</div>`;
      }

      // Chế độ Cắt xén lề thừa trực quan (Crop kéo khung trực tiếp + đồng bộ %)
      if (tool.id === 'crop' && this.files[0]) {
        return `
          <div class="space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="font-extrabold text-emerald-300">✂️ Kéo trực tiếp 4 cạnh khung màu xanh trên trang giấy hoặc nhập % bên phải:</span>
              <span id="mod46-crop-live-badge" class="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-[11px] font-bold text-amber-300">Trái 5% · Phải 5% · Trên 5% · Dưới 5%</span>
            </div>
            <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex justify-center overflow-auto">
              <div id="mod46-crop-stage" class="relative inline-block select-none touch-none bg-white shadow-2xl">
                <canvas id="canvas-mod46-crop-preview" class="block max-w-full"></canvas>
                <div id="mod46-crop-box" class="absolute border-2 border-emerald-400 bg-emerald-400/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.48)] cursor-move" style="left:5%;top:5%;right:5%;bottom:5%;">
                  <div data-crop-handle="l" class="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-8 rounded bg-emerald-400 border border-zinc-950 cursor-ew-resize"></div>
                  <div data-crop-handle="r" class="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-8 rounded bg-emerald-400 border border-zinc-950 cursor-ew-resize"></div>
                  <div data-crop-handle="t" class="absolute left-1/2 -top-2 -translate-x-1/2 w-8 h-4 rounded bg-emerald-400 border border-zinc-950 cursor-ns-resize"></div>
                  <div data-crop-handle="b" class="absolute left-1/2 -bottom-2 -translate-x-1/2 w-8 h-4 rounded bg-emerald-400 border border-zinc-950 cursor-ns-resize"></div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Chế độ Ký tên & Chọn vị trí đặt chữ ký trực quan ngay trên trang PDF
      if (tool.id === 'sign_edit') {
        const f0 = this.files[0];
        return `
          <div class="space-y-3">
            <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
              <div class="text-xs font-extrabold text-emerald-300">✍️ 1. Vẽ chữ ký bằng chuột / cảm ứng (hoặc gõ tên ở cột phải):</div>
              <canvas id="canvas-mod46-sig-pad" width="460" height="120" class="w-full h-28 rounded-xl bg-white border-2 border-emerald-500/50 cursor-crosshair touch-none"></canvas>
              <div class="flex flex-wrap items-center gap-2 text-[11px]">
                <button type="button" id="btn-mod46-sig-clear" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold cursor-pointer">🧹 Xóa nét vẽ</button>
                <label class="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold cursor-pointer">
                  📷 Tải ảnh chữ ký (tự xóa nền trắng)
                  <input type="file" id="input-mod46-sig-img" accept="image/*" class="hidden" />
                </label>
              </div>
            </div>

            <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span class="font-extrabold text-sky-300">📍 2. Bấm hoặc kéo thả khung chữ ký trực tiếp lên đúng chỗ muốn đặt trên trang PDF:</span>
                <span id="mod46-sig-pos-badge" class="text-[11px] font-bold text-amber-300">Trang 1</span>
              </div>
              <div class="flex justify-center overflow-auto">
                <div id="mod46-sig-page-stage" class="relative inline-block bg-white shadow-2xl select-none touch-none cursor-crosshair">
                  <canvas id="canvas-mod46-sig-page-preview" class="block max-w-full"></canvas>
                  <div id="mod46-sig-drag-box" class="absolute border-2 border-dashed border-rose-500 bg-rose-500/15 rounded-lg flex items-center justify-center cursor-move px-1" style="left:64%;top:80%;width:28%;height:10%;">
                    <img id="img-mod46-sig-live-preview" alt="" class="hidden max-w-full max-h-full object-contain pointer-events-none" />
                    <span id="lbl-mod46-sig-placeholder" class="text-[10px] font-black text-rose-700 pointer-events-none">✍️ Kéo thả chữ ký</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      if (['page_numbers', 'watermark', 'header_footer', 'bookmarks_toc'].includes(tool.id) && this.files.length) {
        const isToc = tool.id === 'bookmarks_toc';
        const isHf = tool.id === 'header_footer';
        return `
          <div class="rounded-2xl border border-sky-500/40 bg-zinc-950 p-3 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="font-black text-sky-300">📄 Mô phỏng trang giấy trực quan — ${isToc ? 'Xem trước trang Mục lục chuẩn A4' : 'Bấm / kéo thả chữ & số vào bất kỳ vị trí nào trên trang!'}</span>
              <span id="mod46-papersim-badge" class="px-2 py-0.5 rounded-full bg-zinc-800 text-[10.5px] font-bold text-amber-300">Sẵn sàng</span>
            </div>
            ${!isToc ? `
              <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                <button type="button" id="btn-papersim-mode-place" class="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-extrabold cursor-pointer">📍 Đặt / Kéo vị trí chữ &amp; số</button>
                <button type="button" id="btn-papersim-mode-erase" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-200 font-bold cursor-pointer">🧹 Kéo khung che xóa chữ/số cũ</button>
                <button type="button" id="btn-papersim-undo-erase" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold cursor-pointer" title="Bỏ khung che vừa vẽ">↩️ Hoàn tác che</button>
                <button type="button" id="btn-papersim-clear-erase" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold cursor-pointer" title="Xóa tất cả khung che trắng">🗑️ Xóa khung che</button>
                <label class="ml-auto flex items-center gap-1 text-zinc-400">Xem trang mẫu:
                  <input id="inp-papersim-page" type="number" min="1" value="1" class="w-12 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-center text-amber-300 font-bold" />
                </label>
              </div>
            ` : ''}
            <div class="flex justify-center overflow-auto bg-zinc-900/70 rounded-xl p-2.5 border border-zinc-800">
              <div id="mod46-paper-sim-stage" class="relative inline-block bg-white shadow-2xl select-none touch-none cursor-crosshair overflow-hidden">
                <canvas id="canvas-mod46-paper-sim" class="block max-w-full"></canvas>
                <div id="mod46-papersim-erase-layer" class="absolute inset-0 pointer-events-none"></div>
                ${isHf ? `
                  <div id="mod46-papersim-box-header" data-sim-drag="header" class="absolute border-2 border-dashed border-sky-500 bg-sky-500/10 rounded px-2 py-0.5 cursor-move whitespace-nowrap shadow" style="left:50%;top:4%;transform:translate(-50%,-50%);">Header</div>
                  <div id="mod46-papersim-box-footer" data-sim-drag="footer" class="absolute border-2 border-dashed border-emerald-500 bg-emerald-500/10 rounded px-2 py-0.5 cursor-move whitespace-nowrap shadow" style="left:50%;top:95%;transform:translate(-50%,-50%);">Footer</div>
                ` : !isToc ? `
                  <div id="mod46-papersim-box-main" data-sim-drag="main" class="absolute border-2 border-dashed border-rose-500 bg-rose-500/10 rounded px-2 py-0.5 cursor-move whitespace-nowrap shadow" style="left:50%;top:${tool.id === 'watermark' ? '50%' : '94%'};transform:translate(-50%,-50%);">Mẫu xem trước</div>
                ` : ''}
              </div>
            </div>
            <p class="text-[11px] text-zinc-400">${isToc ? '💡 Mọi thay đổi về Phông chữ, Cỡ chữ, Màu, Đậm/Nghiêng/Gạch chân và Kiểu mục lục bên cột phải sẽ cập nhật trực tiếp ngay trên tờ A4 mẫu ở trên.' : '💡 Mẹo: Chọn chế độ <strong>🧹 Kéo khung che xóa chữ/số cũ</strong> để khoanh trắng xóa số trang/tiêu đề cũ của file gốc, sau đó đặt số mới chuẩn xác vào vị trí mong muốn!'}</p>
          </div>
        `;
      }

      if (tool.id === 'create_blank_pdf') {
        const hasF = this.files.length > 0;
        return `
          <div class="rounded-2xl border border-emerald-500/40 bg-zinc-950 p-3.5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-xs font-bold text-emerald-300">
                🗒️ Xem trước trực tiếp ${hasF ? `— Phủ ô ly/dòng kẻ lên "${escHtml(this.files[0].name)}"` : '— Sổ ghi chú PDF mới'}
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <input id="input-mod46-blank-existing-pdf" type="file" accept=".pdf" class="hidden" />
                <button type="button" id="btn-mod46-blank-pick-pdf" data-at-id="mod46-blank-pick-pdf" class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold cursor-pointer">
                  ${hasF ? '🔄 Đổi tệp PDF cũ' : '📂 Chèn PDF cũ để phủ ô ly (Tùy chọn)'}
                </button>
              </div>
            </div>
            <div class="flex justify-center overflow-auto bg-zinc-900/75 rounded-xl p-3 border border-zinc-800">
              <canvas id="canvas-mod46-blank-preview" width="380" height="537" class="rounded-lg shadow-2xl border border-zinc-700 bg-white max-w-full h-auto block"></canvas>
            </div>
            <p class="text-[11px] text-zinc-400 text-center">Kéo thanh <strong>Độ đậm đường kẻ / ô ly</strong> hoặc đổi kiểu giấy bên phải — trang xem trước cập nhật tức thì!</p>
          </div>
        `;
      }

      if (tool.noFileRequired && !this.files.length) {
        return `
          <div class="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center space-y-2">
            <div class="text-4xl">${tool.icon}</div>
            <div class="text-sm font-black text-emerald-200">${escHtml(tool.name)}</div>
            <p class="text-xs text-zinc-300">Công cụ này khởi tạo trực tiếp tệp PDF mới ngay trong RAM — hãy chỉnh số trang &amp; kiểu giấy ở cột phải rồi bấm nút <strong>Tạo file PDF mới</strong>!</p>
          </div>
        `;
      }

      // Danh sách thẻ tệp mặc định (hỗ trợ xem trước + đổi thứ tự + xóa)
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          ${this.files
            .map(
              (f, idx) => `
            <div class="rounded-xl border border-zinc-700 bg-zinc-950 p-2.5 flex flex-col gap-2">
              <div class="relative aspect-[4/3] rounded-lg bg-zinc-900 overflow-hidden flex items-center justify-center">
                ${f.thumbUrl || /\.pdf$/i.test(f.name)
                  ? `<img data-mod46-file-thumb="${f.id}" src="${f.thumbUrl || ''}" alt="" class="max-w-full max-h-full object-contain" />`
                  : `<div class="text-3xl">${tool.icon}</div>`}
                <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-emerald-300">#${idx + 1}</span>
              </div>
              <div class="min-w-0">
                <div class="text-[11.5px] font-bold text-zinc-100 truncate" title="${escHtml(f.name)}">${escHtml(f.name)}</div>
                <div class="text-[10px] text-zinc-400 flex items-center justify-between mt-0.5">
                  <span>${formatBytes(f.size)}</span>
                  <span data-mod46-file-pages="${f.id}">${f.pageCount ? `${f.pageCount} trang` : ''}</span>
                </div>
              </div>
              <div class="flex items-center justify-between gap-1 text-[10.5px]">
                ${this.files.length > 1 ? `
                  <button type="button" data-file-act="up" data-file-id="${f.id}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-bold" title="Đưa lên trước">◀</button>
                  <button type="button" data-file-act="down" data-file-id="${f.id}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 font-bold" title="Đưa ra sau">▶</button>
                ` : '<span></span>'}
                <button type="button" data-file-act="del" data-file-id="${f.id}" class="px-2 py-0.5 rounded bg-rose-900/70 hover:bg-rose-600 text-rose-100 font-bold">🗑️ Xóa</button>
              </div>
            </div>`
            )
            .join('')}
        </div>
      `;
    }

    buildOptionsPanelHtml() {
      const id = this.activeTool.id;
      if (id === 'merge') {
        return `<p class="text-zinc-300 leading-relaxed">Các tệp sẽ được gộp theo đúng thứ tự đánh số <strong>#1, #2, #3...</strong> ở khung bên trái.</p>
          <label class="block space-y-1"><span class="font-bold text-zinc-300">Tên tệp sau khi gộp:</span>
          <input id="opt-mod46-outname" type="text" value="DangLovePDF_DaGop.pdf" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100" /></label>`;
      }
      if (id === 'split') {
        return `
          <label class="block space-y-1"><span class="font-bold text-zinc-300">Kiểu tách trang:</span>
            <select id="opt-mod46-split-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100">
              <option value="range">Tách theo khoảng trang tùy chọn</option>
              <option value="single">Tách lẻ từng trang thành nhiều PDF</option>
              <option value="every_n">Tách đều mỗi N trang 1 tệp</option>
              <option value="max_mb">Tách sao cho mỗi tệp không vượt quá (MB)</option>
            </select>
          </label>
          <label class="block space-y-1"><span class="font-bold text-zinc-300">Khoảng trang (vd: 1-3, 5, 7-9):</span>
            <input id="opt-mod46-split-ranges" type="text" placeholder="1-3, 5" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100" />
          </label>
          <div class="grid grid-cols-2 gap-2">
            <label class="space-y-1"><span>Mỗi N trang:</span><input id="opt-mod46-split-everyn" type="number" min="1" value="2" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
            <label class="space-y-1"><span>Tối đa (MB):</span><input id="opt-mod46-split-maxmb" type="number" step="0.5" min="0.5" value="5" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          </div>`;
      }
      if (id === 'organize') {
        return `<p class="text-zinc-300 leading-relaxed">Dùng các nút <strong>◀ / ▶</strong> để đổi chỗ, <strong>↻</strong> xoay 90°, <strong>📋</strong> nhân bản trang, <strong>✕</strong> bỏ trang thừa hoặc bấm <strong>+ Trang trắng</strong> ở trên.</p>`;
      }
      if (id === 'crop') {
        return `
          <p class="text-zinc-400">Chọn phần trăm viền muốn cắt gọn ở 4 cạnh:</p>
          <div class="grid grid-cols-2 gap-2">
            <label class="space-y-1"><span>Cắt Trái (%)</span><input id="opt-crop-l" type="number" min="0" max="40" value="5" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
            <label class="space-y-1"><span>Cắt Phải (%)</span><input id="opt-crop-r" type="number" min="0" max="40" value="5" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
            <label class="space-y-1"><span>Cắt Trên (%)</span><input id="opt-crop-t" type="number" min="0" max="40" value="5" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
            <label class="space-y-1"><span>Cắt Dưới (%)</span><input id="opt-crop-b" type="number" min="0" max="40" value="5" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          </div>
          <label class="block space-y-1"><span class="font-bold">Áp dụng cắt lề cho:</span>
            <select id="opt-crop-scope" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="all">Toàn bộ các trang</option>
              <option value="odd">Chỉ các trang LẺ (1, 3, 5...)</option>
              <option value="even">Chỉ các trang CHẴN (2, 4, 6...)</option>
            </select>
          </label>`;
      }
      if (id === 'compress') {
        return `
          <div class="space-y-2">
            <label class="flex items-start gap-2 p-2 rounded-xl border border-zinc-700 bg-zinc-950 cursor-pointer">
              <input type="radio" name="opt-compress-lvl" value="light" class="mt-0.5 accent-emerald-400" />
              <span><strong>Nén nhẹ (Đẹp rõ nét)</strong><br/><span class="text-zinc-400">Giữ hình sắc nét, giảm dung lượng vừa phải.</span></span>
            </label>
            <label class="flex items-start gap-2 p-2 rounded-xl border border-emerald-500/50 bg-zinc-950 cursor-pointer">
              <input type="radio" name="opt-compress-lvl" value="medium" checked class="mt-0.5 accent-emerald-400" />
              <span><strong>Nén vừa (Khuyên dùng)</strong><br/><span class="text-zinc-400">Cân bằng tốt giữa độ rõ chữ và dung lượng nhẹ.</span></span>
            </label>
            <label class="flex items-start gap-2 p-2 rounded-xl border border-zinc-700 bg-zinc-950 cursor-pointer">
              <input type="radio" name="opt-compress-lvl" value="strong" class="mt-0.5 accent-emerald-400" />
              <span><strong>Nén cực đại (Nhẹ nhất)</strong><br/><span class="text-zinc-400">Giảm dung lượng tối đa để dễ gửi Zalo/Email.</span></span>
            </label>
          </div>`;
      }
      if (id === 'page_numbers') {
        return `
          <label class="block space-y-1"><span class="font-bold">Vị trí nhanh (hoặc kéo tự do trên giấy):</span>
            <select id="opt-pn-pos" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="bottom-center">Giữa dưới trang</option>
              <option value="bottom-right">Góc dưới bên phải</option>
              <option value="bottom-left">Góc dưới bên trái</option>
              <option value="top-center">Giữa trên trang</option>
              <option value="top-right">Góc trên bên phải</option>
              <option value="top-left">Góc trên bên trái</option>
              <option value="custom">🎯 Tự do (theo vị trí kéo trên mô phỏng)</option>
            </select>
          </label>
          <label class="block space-y-1"><span class="font-bold">Kiểu hiển thị:</span>
            <select id="opt-pn-fmt" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="Trang {n}/{total}">Trang 1/10</option>
              <option value="{n}">1, 2, 3...</option>
              <option value="{n} / {total}">1 / 10</option>
              <option value="- {n} -">- 1 -</option>
            </select>
          </label>
          <div class="grid grid-cols-2 gap-2">
            <label class="space-y-1"><span>Từ trang:</span><input id="opt-pn-from" type="number" min="1" value="1" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
            <label class="space-y-1"><span>Số bắt đầu:</span><input id="opt-pn-start" type="number" min="1" value="1" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          </div>
          <label class="block space-y-1"><span class="font-bold">Tiền tố mã Bates (tùy chọn, vd: HS-):</span>
            <input id="opt-pn-bates-prefix" type="text" placeholder="Để trống nếu đánh số thường" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
          </label>
          ${buildWordStyleBarHtml('pn', { fontSize: 13, color: '#1f2937', fontFamily: '"Times New Roman", Georgia, serif', bold: true, showBg: true })}`;
      }
      if (id === 'watermark') {
        return `
          <label class="block space-y-1"><span class="font-bold">Nội dung đóng dấu chữ:</span>
            <input id="opt-wm-text" type="text" value="BẢN QUYỀN TÁC GIẢ" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
          </label>
          <label class="block space-y-1"><span class="font-bold">Hoặc tải Logo ảnh PNG/JPG (ưu tiên nếu có):</span>
            <input id="opt-wm-logo-file" type="file" accept="image/png,image/jpeg,image/webp" class="w-full text-[11px] text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-zinc-100" />
          </label>
          ${buildWordStyleBarHtml('wm', { fontSize: 38, color: '#e11d48', fontFamily: '"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif', bold: true, showAngle: true, angle: 35 })}
          <div class="grid grid-cols-2 gap-2">
            <label class="space-y-1"><span>Độ mờ (0.1 - 1):</span><input id="opt-wm-opacity" type="number" step="0.05" min="0.1" max="1" value="0.28" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
            <label class="flex items-center gap-2 pt-4"><input id="opt-wm-tile" type="checkbox" class="accent-rose-500" /><span>Lặp phủ toàn trang</span></label>
          </div>`;
      }
      if (id === 'sign_edit') {
        return `
          <label class="block space-y-1"><span class="font-bold">Hoặc gõ tên tạo chữ ký viết tay tự động:</span>
            <input id="opt-sign-typed-name" type="text" placeholder="Ví dụ: Mai Hải Đăng (tự tạo nét bút ký)" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
          </label>
          <label class="block space-y-1"><span class="font-bold">Chèn vào trang số:</span>
            <input id="opt-sign-page" type="number" min="1" value="1" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
          </label>
          <label class="block space-y-1"><span class="font-bold">Vị trí đặt chữ ký / ghi chú:</span>
            <select id="opt-sign-pos" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="bottom-right">Góc dưới bên phải</option>
              <option value="bottom-center">Giữa phía dưới</option>
              <option value="bottom-left">Góc dưới bên trái</option>
              <option value="center">Chính giữa trang</option>
            </select>
          </label>
          <label class="block space-y-1"><span class="font-bold">Ghi chú thêm (tùy chọn):</span>
            <input id="opt-sign-note" type="text" placeholder="Ví dụ: Đã ký xác nhận — Mai Hải Đăng" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
          </label>
          ${buildWordStyleBarHtml('sign', { fontSize: 14, color: '#0f172a', fontFamily: '"Times New Roman", Georgia, serif', bold: true, showBg: true })}`;
      }
      if (id === 'pdf_to_img') {
        return `
          <label class="block space-y-1"><span class="font-bold">Định dạng ảnh:</span>
            <select id="opt-img-fmt" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="image/jpeg">JPG (Nhẹ, phổ biến)</option>
              <option value="image/png">PNG (Sắc nét nhất)</option>
              <option value="image/webp">WEBP (Siêu nhẹ)</option>
            </select>
          </label>
          <label class="block space-y-1"><span class="font-bold">Độ nét ảnh:</span>
            <select id="opt-img-dpi" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="1.2">Chuẩn web (Nhanh)</option>
              <option value="2.0" selected>Sắc nét (Khuyên dùng)</option>
              <option value="3.0">Siêu nét in ấn (300 DPI)</option>
            </select>
          </label>`;
      }
      if (id === 'img_to_pdf') {
        return `
          <label class="block space-y-1"><span class="font-bold">Khổ trang PDF:</span>
            <select id="opt-i2p-size" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="a4">Khổ A4 chuẩn</option>
              <option value="fit">Vừa khít từng ảnh gốc</option>
            </select>
          </label>
          <label class="block space-y-1"><span class="font-bold">Lề trang:</span>
            <select id="opt-i2p-margin" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="0">Không lề (Tràn viền)</option>
              <option value="24" selected>Lề nhỏ gọn</option>
              <option value="48">Lề rộng</option>
            </select>
          </label>`;
      }
      if (id === 'docx_convert') {
        return `
          <label class="block space-y-1"><span class="font-bold">Đổi file Word sang:</span>
            <select id="opt-docx-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="pdf">PDF (Chuẩn tiếng Việt)</option>
              <option value="txt">Văn bản thuần (.TXT)</option>
              <option value="md">Markdown (.MD)</option>
              <option value="html">Trang Web (.HTML)</option>
            </select>
          </label>`;
      }
      if (id === 'pdf_to_docx') {
        return `
          <label class="block space-y-1"><span class="font-bold">Định dạng xuất ra:</span>
            <select id="opt-p2d-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="docx">Word (.DOCX — Chỉnh sửa được)</option>
              <option value="md">Markdown (.MD — Phân cấp tiêu đề tự động)</option>
              <option value="txt">Văn bản thuần (.TXT)</option>
              <option value="json">Dữ liệu JSON (.JSON kèm tọa độ &amp; cỡ chữ)</option>
            </select>
          </label>
          <p class="text-[11px] text-zinc-400">Nút đỏ chạy 100% thuật toán chuyển đổi nội bộ (0-Token). Muốn AI nối câu/chuẩn hóa văn bản hãy bấm 2 nút AI riêng bên dưới.</p>`;
      }
      if (id === 'text_to_pdf_docx') {
        return `
          <label class="block space-y-1"><span class="font-bold">Định dạng đích:</span>
            <select id="opt-t2p-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="pdf">File PDF (Chuẩn tiếng Việt)</option>
              <option value="docx">File Word (.DOCX)</option>
            </select>
          </label>`;
      }
      if (id === 'sheet_convert') {
        return `
          <label class="block space-y-1"><span class="font-bold">Đổi sang định dạng:</span>
            <select id="opt-sheet-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="pdf">PDF (Bảng in gọn gàng)</option>
              <option value="xlsx">Excel (.XLSX)</option>
              <option value="csv">CSV (Chuẩn UTF-8 cho Excel Việt)</option>
              <option value="json">Dữ liệu JSON (.JSON)</option>
            </select>
          </label>`;
      }
      if (id === 'pdf_pptx') {
        const isPpt = /\.pptx$/i.test(this.files[0]?.name || '');
        return isPpt
          ? `<label class="block space-y-1"><span class="font-bold">Xuất slide .PPTX sang:</span>
              <select id="opt-ppt-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
                <option value="pdf">PDF tóm tắt nội dung slide</option>
                <option value="txt">Văn bản (.TXT)</option>
              </select></label>`
          : `<p class="text-zinc-300">Mỗi trang PDF sẽ được chuyển thành 1 trang chiếu sắc nét trong file PowerPoint <strong>.PPTX</strong>.</p>`;
      }
      if (id === 'ocr_pdf') {
        const hasG = Boolean((global.NoirGeminiBridge || NS.geminiBridge)?.hasApiKey?.());
        return `
          <label class="block space-y-1"><span class="font-bold">Ngôn ngữ nhận diện (Đa ngôn ngữ):</span>
            <select id="opt-ocr-lang" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="vie+eng">Tiếng Việt + Tiếng Anh</option>
              <option value="vie">Chỉ Tiếng Việt</option>
              <option value="eng">Chỉ Tiếng Anh</option>
              <option value="chi_sim+eng">Tiếng Trung + Tiếng Anh</option>
              <option value="jpn+eng">Tiếng Nhật + Tiếng Anh</option>
            </select>
          </label>
          <label class="block space-y-1"><span class="font-bold">Định dạng kết quả OCR 5 bước:</span>
            <select id="opt-ocr-out-fmt" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
              <option value="searchable_pdf">PDF 2 lớp tìm &amp; copy được (Ctrl+F — Khuyên dùng)</option>
              <option value="docx">Word (.DOCX — Tái cấu trúc văn bản)</option>
              <option value="md">Markdown (.MD — Sạch gọn)</option>
              <option value="txt">Văn bản thuần (.TXT)</option>
            </select>
          </label>
          <label class="flex items-center gap-2"><input id="opt-ocr-smart-skip" type="checkbox" checked class="accent-teal-400" /><span>Smart Skip: Tự lấy chữ gốc với trang đã có lớp văn bản</span></label>
          <label class="flex items-center gap-2"><input id="opt-ocr-denoise" type="checkbox" checked class="accent-teal-400" /><span>✨ Tiền nhận diện ảnh thông minh (Cắt viền, tẩy nền ố vàng, khử bóng, tự nắn nghiêng &amp; làm nét chữ)</span></label>
          <label class="flex items-center gap-2"><input id="opt-ocr-ai-polish" type="checkbox" ${hasG ? 'checked' : ''} class="accent-emerald-400" /><span>🤖 Hậu kiểm OCR bằng Gemini 3.8 Flash (sửa lỗi dấu tiếng Việt &amp; tách từ sau khi Code quét xong)</span></label>
          <p class="text-[11px] text-zinc-400">Bấm nút đỏ <strong>🚀 Chạy OCR 5 bước ngay</strong> để chạy thuần Code trên CPU máy bạn, hoặc dùng <strong>⚡ OCR Siêu Tốc bằng AI</strong> / <strong>📋 AI Thủ công</strong> ngay bên dưới.</p>`;
      }
      const proOpt = NS.dangLovePdfPro?.buildProOptionsHtml?.(this, id);
      if (proOpt) return proOpt;
      return `<p class="text-zinc-300 leading-relaxed">Bấm nút bên dưới để xử lý tệp ngay trên máy của bạn.</p>`;
    }

    bindWorkspaceInteractions(body) {
      const addInput = body.querySelector('#input-mod46-add-more');
      body.querySelector('#btn-mod46-add-more')?.addEventListener('click', () => addInput?.click());
      addInput?.addEventListener('change', (ev) => this.ingestFiles(ev.target.files));

      body.querySelector('#btn-mod46-sort-az')?.addEventListener('click', () => {
        this.files.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        this.renderUploadOrWorkspaceScreen();
      });
      body.querySelector('#btn-mod46-sort-za')?.addEventListener('click', () => {
        this.files.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
        this.renderUploadOrWorkspaceScreen();
      });
      body.querySelector('#btn-mod46-clear-files')?.addEventListener('click', () => {
        this.resetWorkspaceState();
        this.renderUploadOrWorkspaceScreen();
      });

      // Các nút trợ lý AI 1 chạm trong Cột Tùy chọn Pro (ICR, Redact PII, Metadata, Form, Smart Split)
      const bindQuickProAi = (sel, handler) => {
        body.querySelector(sel)?.addEventListener('click', async () => {
          const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
          if (!gBridge?.hasApiKey?.()) {
            gBridge?.openApiKeyQuickModal?.({ onSaved: () => this.renderUploadOrWorkspaceScreen() });
            return;
          }
          await handler(gBridge);
        });
      };
      const extractQuickPdfSampleText = async (maxPages = 4) => {
        if (!this.files[0]) return '';
        const pdfjsLib = await ensurePdfJs();
        const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
        const n = Math.min(pdf.numPages, maxPages);
        const parts = [];
        for (let i = 1; i <= n; i++) {
          const pg = await pdf.getPage(i);
          const tc = await pg.getTextContent();
          parts.push(`[Trang ${i}] ` + tc.items.map((x) => x.str).join(' '));
        }
        return parts.join('\n').slice(0, 12000);
      };
      body.querySelector('#btn-pro-icr-connect-ai')?.addEventListener('click', () => {
        (global.NoirGeminiBridge || NS.geminiBridge)?.openApiKeyQuickModal?.({ onSaved: () => this.renderUploadOrWorkspaceScreen() });
      });

      // Các nút AI THỦ CÔNG (0-TOKEN — KHÔNG CẦN API KEY) cho mọi công cụ ĐăngLovePDF!
      const openManualToolPackageOutput = async (toolKey, title, attachFile, promptTxt, outKind) => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const f0 = attachFile || this.files[0];
        const baseN = String(f0?.name || 'TaiLieu').replace(/\.[^.]+$/, '');
        const inputBytes = this.files.reduce((s, f) => s + (f.size || 0), 0);
        gBridge?.openManualAiAssistantModal?.({
          taskTitle: title,
          promptText: promptTxt,
          attachFileName: f0?.name || '',
          attachFileBlob: f0?.file || (f0?.bytes ? new Blob([f0.bytes]) : null),
          applyBtnLabel: '✅ Đóng gói kết quả & Xuất file ngay',
          onApplyPasted: async (pastedText) => {
            const parsedStruct = gBridge?.parseStructuredOcrIcrReply ? gBridge.parseStructuredOcrIcrReply(pastedText, taskKey) : null;
            const cleanOut = String(parsedStruct?.isStructuredJson ? parsedStruct.fullText : (pastedText || '')).trim();
            const outs = [];
            if (outKind === 'xlsx' || outKind === 'csv') {
              const XLSX = await ensureXlsx();
              let rows = [];
              if (parsedStruct?.isStructuredJson && Array.isArray(parsedStruct.tables) && parsedStruct.tables.length) {
                parsedStruct.tables.forEach((tb) => {
                  if (tb.caption) rows.push([tb.caption]);
                  if (Array.isArray(tb.rows)) rows.push(...tb.rows);
                  rows.push([]);
                });
              }
              if (!rows.length) {
                try {
                  const jm = cleanOut.match(/\[[\s\S]*\]/);
                  if (jm) { const p = JSON.parse(jm[0]); if (Array.isArray(p) && Array.isArray(p[0])) rows = p; }
                } catch (_eJ) {}
              }
              if (!rows.length) {
                rows = cleanOut.split(/\r?\n/).filter((l) => l.trim() && !/^\|?[\s:|-]+\|?$/.test(l.trim())).map((l) => (l.includes('|') ? l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()) : [l.trim()]));
              }
              const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [[cleanOut]]);
              if (outKind === 'csv') {
                outs.push({ name: `${baseN}_AI.csv`, blob: new Blob(['\uFEFF' + XLSX.utils.sheet_to_csv(ws)], { type: 'text/csv;charset=utf-8' }) });
              } else {
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'KetQua_AI');
                outs.push({ name: `${baseN}_AI.xlsx`, blob: new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) });
              }
            } else if (outKind === 'pdf') {
              const parsers = global.NoirStructuredParsers || NS.structuredParsers;
              const astLib = global.NoirDocAst || NS.docAst;
              const themeEngine = global.NoirDangLovePdfPro || NS.dangLovePdfPro;
              if (parsers && astLib && typeof themeEngine?.renderTheme10BlocksToPdfBlob === 'function' && /(^|\n)(#{1,4}\s|\|.*\|)/m.test(cleanOut)) {
                const stitched = gBridge?.stitchContinueTables ? gBridge.stitchContinueTables(cleanOut) : cleanOut;
                const ast = parsers.parseMarkdownToAst(stitched, { filename: `${baseN}_AI.md` });
                const blocks = astLib.astToLegacyBlocks(ast);
                outs.push({ name: `${baseN}_AI.pdf`, blob: await themeEngine.renderTheme10BlocksToPdfBlob(blocks, { title: `${baseN} (AI)`, themeId: 'ocean_teal', ensurePdfLib }) });
              } else {
                outs.push({ name: `${baseN}_AI.pdf`, blob: await renderLinesToVietnamesePdfBlob(`${baseN} (AI)`, cleanOut.split(/\r?\n/), () => {}) });
              }
            } else if (outKind === 'md') {
              outs.push({ name: `${baseN}_AI.md`, blob: new Blob([cleanOut], { type: 'text/markdown;charset=utf-8' }) });
            } else if (outKind === 'txt') {
              outs.push({ name: `${baseN}_AI.txt`, blob: new Blob([cleanOut], { type: 'text/plain;charset=utf-8' }) });
            } else {
              const cleanDocxLines = cleanOut.split(/\r?\n/).map((l) => l.replace(/\*\*/g, '').replace(/^#{1,6}\s+/, '').trim());
              outs.push({ name: `${baseN}_AI.docx`, blob: await buildDocxBlobFromParagraphs(`${baseN}_AI`, cleanDocxLines) });
            }
            this.resultItems = outs.map((o) => ({ name: o.name, blob: o.blob, size: o.blob.size, url: this.trackUrl(o.blob) }));
            this.resultZipItem = null;
            this.renderResultScreen(inputBytes);
          },
        });
      };

      body.querySelector('#btn-pro-manual-ai-icr')?.addEventListener('click', () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const mode = body.querySelector('#opt-pro-icr-mode')?.value || 'handwriting_general';
        const out = body.querySelector('#opt-pro-icr-out')?.value || 'docx';
        const f0 = this.files[0];
        const promptTxt = gBridge?.buildTaskManualPrompt?.('icr_handwriting', { fileName: f0?.name || 'VietTay.jpg', icrMode: mode }) || '';
        openManualToolPackageOutput('icr_handwriting', `ICR Chữ Viết Tay (${mode}) — AI Thủ công 0-Token`, f0, promptTxt, out);
      });
      body.querySelector('#btn-pro-manual-ai-ocr')?.addEventListener('click', () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const out = body.querySelector('#opt-ocr-out-fmt')?.value === 'md' ? 'md' : (body.querySelector('#opt-ocr-out-fmt')?.value === 'txt' ? 'txt' : 'docx');
        const f0 = this.files[0];
        const promptTxt = gBridge?.buildTaskManualPrompt?.('ocr_fast', { fileName: f0?.name || 'Scan.pdf' }) || '';
        openManualToolPackageOutput('ocr_fast', 'OCR Nhận Diện Chữ — AI Thủ công 0-Token', f0, promptTxt, out);
      });

      // Nút ⚡ Chạy OCR Siêu Tốc bằng AI (Gemini 3.8 Flash + Tiền nhận diện ảnh + response_schema JSON) nằm DƯỚI nút Chạy OCR 5 bước ngay
      body.querySelector('#btn-mod46-ocr-ai-fast')?.addEventListener('click', async () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        if (!this.files.length) {
          this.toast('⚠️ Hãy chọn tệp PDF hoặc Ảnh scan trước khi chạy OCR AI.', 'warning', 3000);
          return;
        }
        if (!gBridge?.hasApiKey?.()) {
          gBridge?.openApiKeyQuickModal?.({ onSaved: () => this.renderUploadOrWorkspaceScreen() });
          return;
        }
        const f0 = this.files[0];
        const baseName = String(f0.name || 'OCR_AI').replace(/\.[^.]+$/, '');
        const outFmt = body.querySelector('#opt-ocr-out-fmt')?.value || 'docx';
        const doPre = body.querySelector('#opt-ocr-denoise')?.checked !== false;
        const loader = gBridge.showAiFullLoadingOverlay?.('⚡ OCR Siêu Tốc (Gemini 3.8 Flash + response_schema)', 'Đang tiền nhận diện ảnh & gửi Gemini 3.8 Flash...');
        try {
          let sendBytes = f0.bytes instanceof Uint8Array ? f0.bytes : new Uint8Array(f0.bytes || []);
          const isPdf0 = /\.pdf$/i.test(f0.name || '');
          let mime0 = isPdf0 ? 'application/pdf' : (/\.png$/i.test(f0.name || '') ? 'image/png' : /\.webp$/i.test(f0.name || '') ? 'image/webp' : 'image/jpeg');
          if (!isPdf0 && doPre && typeof gBridge.preprocessImageForOcrIcr === 'function') {
            loader?.setProgress?.(18, '🔬 Đang tiền nhận diện ảnh (cắt viền, khử bóng, nắn nghiêng, làm nét chữ)...');
            const im = await new Promise((resolve, reject) => {
              const el = new Image();
              el.onload = () => resolve(el);
              el.onerror = reject;
              el.src = this.trackUrl(f0.file || new Blob([sendBytes], { type: mime0 }));
            });
            const cv = document.createElement('canvas');
            const sc = Math.min(1, 2400 / Math.max(1, im.naturalWidth || im.width, im.naturalHeight || im.height));
            cv.width = Math.max(1, Math.round((im.naturalWidth || im.width) * sc));
            cv.height = Math.max(1, Math.round((im.naturalHeight || im.height) * sc));
            cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
            const pre = gBridge.preprocessImageForOcrIcr(cv, { mode: 'ocr_print', deskew: true, autoCrop: true });
            if (pre?.canvas && NS.dangLovePdfPro?.dataUrlToUint8) {
              sendBytes = NS.dangLovePdfPro.dataUrlToUint8(pre.canvas.toDataURL('image/png'));
              mime0 = 'image/png';
              loader?.addLog?.(`✅ Tiền xử lý xong: nắn ${pre.metrics?.deskewDeg || 0}°, độ nét ${pre.metrics?.sharpnessScore || 0}/100`);
            }
          }
          loader?.setProgress?.(46, '🤖 Đang gọi Gemini 3.8 Flash OCR với lược đồ JSON response_schema...');
          const rawOut = await gBridge.callGeminiGenerateContent({
            parts: [
              { text: 'Hãy OCR nhận diện CHÍNH XÁC 100% toàn bộ văn bản (tiếng Việt đầy đủ dấu, bảng biểu, số liệu, công thức) trong tài liệu sau theo đúng response_schema JSON.' },
              { inlineData: { mimeType: mime0, data: gBridge.uint8ToBase64(sendBytes) } },
            ],
            taskType: 'doc_multimodal',
            temperature: 0.1,
            maxOutputTokens: 32768,
            responseSchema: gBridge.RESPONSE_SCHEMAS?.OCR_STRUCTURED || null,
            responseMimeType: 'application/json',
          });
          loader?.setProgress?.(86, '📦 Code đang đọc JSON & xuất tệp hoàn chỉnh...');
          const parsed = gBridge.parseStructuredOcrIcrReply ? gBridge.parseStructuredOcrIcrReply(rawOut, 'ocr') : { fullText: String(rawOut || '').trim() };
          const textOut = String(parsed.fullText || rawOut || '').trim();
          const outs = [];
          if (outFmt === 'md') {
            outs.push({ name: `${baseName}_OCR_AI.md`, blob: new Blob([textOut], { type: 'text/markdown;charset=utf-8' }) });
          } else if (outFmt === 'txt') {
            outs.push({ name: `${baseName}_OCR_AI.txt`, blob: new Blob([textOut], { type: 'text/plain;charset=utf-8' }) });
          } else if (outFmt === 'searchable_pdf') {
            outs.push({ name: `${baseName}_OCR_AI.pdf`, blob: await renderLinesToVietnamesePdfBlob(`${baseName} (OCR AI)`, textOut.split(/\r?\n/), () => {}) });
            outs.push({ name: `${baseName}_OCR_AI.docx`, blob: await buildDocxBlobFromParagraphs(baseName, textOut.split(/\r?\n/)) });
          } else {
            outs.push({ name: `${baseName}_OCR_AI.docx`, blob: await buildDocxBlobFromParagraphs(baseName, textOut.split(/\r?\n/)) });
          }
          loader?.close?.();
          this.resultItems = outs.map((o) => ({ name: o.name, blob: o.blob, size: o.blob.size, url: this.trackUrl(o.blob) }));
          this.resultZipItem = null;
          this.renderResultScreen(f0.size || 0);
        } catch (err) {
          loader?.showError?.('⚠️ Lỗi OCR Siêu Tốc AI', String(err?.message || err), {
            onRetry: () => body.querySelector('#btn-mod46-ocr-ai-fast')?.click(),
            manualFallback: {
              taskTitle: 'OCR Nhận Diện Chữ — AI Thủ công (0-Token)',
              promptText: gBridge.buildTaskManualPrompt('ocr_fast', { fileName: f0?.name || 'Scan.pdf' }),
              attachFileName: f0?.name || '',
              attachFileBlob: f0?.file || (f0?.bytes ? new Blob([f0.bytes]) : null),
              applyBtnLabel: '✅ Nạp kết quả OCR & Xuất file',
              onApplyPasted: async (raw) => {
                const parsed = gBridge.parseStructuredOcrIcrReply ? gBridge.parseStructuredOcrIcrReply(raw, 'ocr') : { fullText: String(raw || '').trim() };
                const t = String(parsed.fullText || raw || '').trim();
                const blob = outFmt === 'md'
                  ? new Blob([t], { type: 'text/markdown;charset=utf-8' })
                  : (outFmt === 'txt' ? new Blob([t], { type: 'text/plain;charset=utf-8' }) : await buildDocxBlobFromParagraphs(baseName, t.split(/\r?\n/)));
                const ext = outFmt === 'md' ? 'md' : (outFmt === 'txt' ? 'txt' : 'docx');
                this.resultItems = [{ name: `${baseName}_OCR_AI.${ext}`, blob, size: blob.size, url: this.trackUrl(blob) }];
                this.resultZipItem = null;
                this.renderResultScreen(f0.size || 0);
              },
            },
          });
        }
      });

      // Live Preview & Nạp PDF cũ cho công cụ Tạo sổ PDF Trắng / Kẻ ngang / Ô ly / Cornell
      if (this.activeTool?.id === 'create_blank_pdf') {
        const blankPickInp = body.querySelector('#input-mod46-blank-existing-pdf');
        body.querySelector('#btn-mod46-blank-pick-pdf')?.addEventListener('click', () => blankPickInp?.click());
        blankPickInp?.addEventListener('change', (ev) => {
          const fl = ev.target.files ? Array.from(ev.target.files) : [];
          try { ev.target.value = ''; } catch (_e) {}
          if (fl.length) this.ingestFiles(fl);
        });

        let cachedPdfBgCanvas = null;
        const renderBlankLivePreview = async () => {
          const cv = body.querySelector('#canvas-mod46-blank-preview');
          if (!cv || !cv.isConnected) return;
          const style = body.querySelector('#opt-pro-blank-style')?.value || 'grid';
          const opacityPct = Math.max(10, Math.min(100, Number(body.querySelector('#opt-pro-blank-opacity')?.value || 45)));
          const spacingPt = Math.max(10, Math.min(48, Number(body.querySelector('#opt-pro-blank-spacing')?.value || 20)));
          const colorKey = body.querySelector('#opt-pro-blank-color')?.value || 'blue';
          const lblOp = body.querySelector('#lbl-pro-blank-opacity');
          if (lblOp) lblOp.textContent = `${opacityPct}%`;

          const ctx = cv.getContext('2d');
          const cw = cv.width;
          const ch = cv.height;
          ctx.clearRect(0, 0, cw, ch);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, cw, ch);

          if (this.files.length > 0 && this.files[0]?.bytes) {
            if (!cachedPdfBgCanvas) {
              try {
                const pdfjsLib = await ensurePdfJs();
                const pdfDoc = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
                const p1 = await pdfDoc.getPage(1);
                const bvp = p1.getViewport({ scale: 1 });
                const fit = cw / Math.max(1, bvp.width);
                const vp = p1.getViewport({ scale: fit });
                cv.height = Math.max(240, Math.min(620, Math.round(vp.height)));
                const bg = document.createElement('canvas');
                bg.width = cw;
                bg.height = cv.height;
                await p1.render({ canvasContext: bg.getContext('2d'), viewport: vp }).promise;
                cachedPdfBgCanvas = bg;
              } catch (_ePvPdf) {}
            }
            if (cachedPdfBgCanvas) {
              cv.height = cachedPdfBgCanvas.height;
              ctx.drawImage(cachedPdfBgCanvas, 0, 0);
            }
          }

          const colors = {
            blue: `rgba(61, 132, 220, ${opacityPct / 100})`,
            slate: `rgba(115, 133, 158, ${opacityPct / 100})`,
            dark: `rgba(46, 51, 61, ${opacityPct / 100})`,
            amber: `rgba(158, 112, 61, ${opacityPct / 100})`,
          };
          const strokeCol = colors[colorKey] || colors.blue;
          const hNow = cv.height;
          const scaleRatio = cw / 595.28;
          const stepPx = Math.max(6, spacingPt * scaleRatio);
          const marginPx = Math.round(32 * scaleRatio);

          ctx.strokeStyle = strokeCol;
          ctx.fillStyle = strokeCol;
          ctx.lineWidth = 1;
          if (style === 'ruled') {
            ctx.beginPath();
            for (let y = Math.round(48 * scaleRatio); y <= hNow - marginPx; y += stepPx) {
              ctx.moveTo(marginPx, y);
              ctx.lineTo(cw - marginPx, y);
            }
            ctx.stroke();
          } else if (style === 'grid') {
            ctx.beginPath();
            for (let y = marginPx; y <= hNow - marginPx; y += stepPx) {
              ctx.moveTo(marginPx, y);
              ctx.lineTo(cw - marginPx, y);
            }
            for (let x = marginPx; x <= cw - marginPx; x += stepPx) {
              ctx.moveTo(x, marginPx);
              ctx.lineTo(x, hNow - marginPx);
            }
            ctx.stroke();
          } else if (style === 'dots') {
            for (let y = marginPx; y <= hNow - marginPx; y += stepPx) {
              for (let x = marginPx; x <= cw - marginPx; x += stepPx) {
                ctx.beginPath();
                ctx.arc(x, y, 1.1, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          } else if (style === 'cornell') {
            const cueX = Math.round(cw * 0.28);
            const headY = Math.round(62 * scaleRatio);
            const sumY = Math.round(hNow * 0.82);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(marginPx, headY); ctx.lineTo(cw - marginPx, headY);
            ctx.moveTo(cueX, headY); ctx.lineTo(cueX, sumY);
            ctx.moveTo(marginPx, sumY); ctx.lineTo(cw - marginPx, sumY);
            ctx.stroke();
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            for (let y = headY + stepPx; y <= sumY - 4; y += stepPx) {
              ctx.moveTo(cueX + 4, y);
              ctx.lineTo(cw - marginPx, y);
            }
            ctx.stroke();
          }
        };

        ['#opt-pro-blank-style', '#opt-pro-blank-opacity', '#opt-pro-blank-spacing', '#opt-pro-blank-color'].forEach((sel) => {
          body.querySelector(sel)?.addEventListener('input', renderBlankLivePreview);
          body.querySelector(sel)?.addEventListener('change', renderBlankLivePreview);
        });
        renderBlankLivePreview();
      }
      body.querySelector('#btn-mod46-tool-ai-fast')?.addEventListener('click', async () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        if (!gBridge?.hasApiKey?.()) {
          gBridge?.openApiKeyQuickModal?.({ onSaved: () => this.renderUploadOrWorkspaceScreen() });
          return;
        }
        this._forceAiForRun = true;
        global.__MOD46_FORCE_AI_RUN__ = true;
        try {
          await this.runCurrentTool();
        } finally {
          this._forceAiForRun = false;
          global.__MOD46_FORCE_AI_RUN__ = false;
        }
      });

      body.querySelector('#btn-pro-manual-ai-compare')?.addEventListener('click', async () => {
        if (this.files.length < 2) {
          this.toast('⚠️ Hãy nạp đủ 2 tệp PDF (#1 và #2) để so sánh bằng AI Thủ công.', 'warning', 3000);
          return;
        }
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        try {
          const pdfjsLib = await ensurePdfJs();
          const readSnippet = async (f) => {
            const pdf = await pdfjsLib.getDocument({ data: f.bytes.slice() }).promise;
            const out = [];
            for (let i = 1; i <= Math.min(pdf.numPages, 8); i++) {
              const pg = await pdf.getPage(i);
              const tc = await pg.getTextContent();
              out.push(`[Trang ${i}] ` + tc.items.map((x) => x.str).join(' '));
            }
            return out.join('\n').slice(0, 5500);
          };
          const s1 = await readSnippet(this.files[0]);
          const s2 = await readSnippet(this.files[1]);
          const diffText = `=== BẢN CŨ (#1: ${this.files[0].name}) ===\n${s1}\n\n=== BẢN MỚI (#2: ${this.files[1].name}) ===\n${s2}`;
          const promptTxt = gBridge?.buildTaskManualPrompt?.('compare_diff', { text: diffText }) || '';
          gBridge?.openManualAiAssistantModal?.({
            taskTitle: 'So sánh 2 tệp PDF — AI Thủ công 0-Token',
            promptText: promptTxt,
            attachFileName: `${this.files[0].name} & ${this.files[1].name}`,
            applyBtnLabel: '✅ Ghép tóm tắt AI & Xuất báo cáo So sánh',
            onApplyPasted: (rawSummary) => {
              const sum = String(rawSummary || '').trim();
              const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>So sánh PDF + AI — ĐăngLovePDF</title><style>body{font-family:'Be Vietnam Pro',sans-serif;background:#0f172a;color:#e2e8f0;max-width:960px;margin:20px auto;padding:18px;line-height:1.65}</style></head><body><h1>⚖️ Báo Cáo So Sánh 2 Tệp PDF (AI Thủ Công 0-Token)</h1><p><strong>Bản #1:</strong> ${escHtml(this.files[0].name)} | <strong>Bản #2:</strong> ${escHtml(this.files[1].name)}</p><div style="padding:14px 16px;border:1.5px solid #10b981;border-radius:14px;background:#052e2b;white-space:pre-wrap;">${escHtml(sum)}</div></body></html>`;
              const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
              this.resultItems = [{ name: 'SoSanh_2PDF_AI_ThuCong.html', blob, size: blob.size, url: this.trackUrl(blob) }];
              this.resultZipItem = null;
              this.renderResultScreen((this.files[0].size || 0) + (this.files[1].size || 0));
            },
          });
        } catch (err) {
          this.toast(`❌ Không thể trích xuất nội dung so sánh: ${err?.message || err}`, 'error', 3500);
        }
      });

      body.querySelector('#btn-pro-manual-ai-p2d')?.addEventListener('click', () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const out = body.querySelector('#opt-p2d-out')?.value || 'docx';
        const f0 = this.files[0];
        const promptTxt = gBridge?.buildTaskManualPrompt?.('pdf_to_docx', { fileName: f0?.name || 'TaiLieu.pdf' }) || '';
        openManualToolPackageOutput('pdf_to_docx', 'PDF → Word / Markdown — AI Thủ công 0-Token', f0, promptTxt, out === 'json' ? 'txt' : out);
      });
      body.querySelector('#btn-pro-manual-ai-p2x')?.addEventListener('click', () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const out = body.querySelector('#opt-pro-p2x-out')?.value || 'xlsx';
        const f0 = this.files[0];
        const promptTxt = gBridge?.buildTaskManualPrompt?.('pdf_to_excel', { fileName: f0?.name || 'BangDuLieu.pdf' }) || '';
        openManualToolPackageOutput('pdf_to_excel', 'PDF → Excel / CSV — AI Thủ công 0-Token', f0, promptTxt, out);
      });
      body.querySelector('#btn-pro-manual-ai-toc')?.addEventListener('click', async () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const f0 = this.files[0];
        let skeletonOrSample = '';
        try {
          const extractor = global.NoirExtractStructuredBlocksFromFile || NS.dangLovePdfPro?.extractStructuredBlocksFromFile;
          if (f0 && extractor && typeof gBridge?.buildCompactSkeletonForAi === 'function') {
            const blocks = this._tocAnalyzedCache?.fileId === f0.id && this._tocAnalyzedCache.blocks
              ? this._tocAnalyzedCache.blocks
              : await extractor(f0, { ensurePdfJs, ensureJsZip, ensureXlsx });
            this._tocAnalyzedCache = { fileId: f0.id, blocks };
            skeletonOrSample = gBridge.buildCompactSkeletonForAi(blocks, { maxBlocks: 240, maxChars: 12000 }).skeletonText;
          }
        } catch (_eSk) {}
        if (!skeletonOrSample) skeletonOrSample = await extractQuickPdfSampleText(10).catch(() => '');
        const promptTxt = gBridge?.buildTaskManualPrompt?.('auto_toc', { fileName: f0?.name || 'TaiLieu.pdf', text: skeletonOrSample }) || '';
        gBridge?.openManualAiAssistantModal?.({
          taskTitle: 'Tạo Mục Lục Tự Động (Block-ID Pxx_Byy) — AI Thủ công 0-Token',
          promptText: promptTxt,
          attachFileName: f0?.name || '',
          attachFileBlob: f0?.file || (f0?.bytes ? new Blob([f0.bytes]) : null),
          applyBtnLabel: '✅ Nạp danh sách Mục lục vào khung ngay',
          onApplyPasted: (pasted) => {
            const ta = body.querySelector('#opt-pro-toc-lines');
            if (!ta) return;
            const parsed = gBridge?.parseAiStructuralPatchTolerant?.(pasted);
            const entries = Array.isArray(parsed?.data?.entries)
              ? parsed.data.entries
              : (Array.isArray(parsed?.data?.headings) ? parsed.data.headings : null);
            if (entries && entries.length) {
              const jsonLines = entries
                .map((it) => {
                  const t = String(it?.clean_title || it?.title || it?.text || '').replace(/\s+/g, ' ').trim();
                  const p = parseInt(it?.page, 10);
                  const lv = Math.max(1, Math.min(4, Number(it?.level || 1)));
                  if (!t || !Number.isFinite(p) || /\.{3,}\s*\d+/.test(t)) return '';
                  return `${lv >= 2 ? '  '.repeat(Math.min(2, lv - 1)) : ''}${t} | ${p}`;
                })
                .filter(Boolean);
              if (jsonLines.length) {
                ta.value = jsonLines.join('\n');
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                this.toast(`✅ Đã khớp ${jsonLines.length} mục từ JSON cấu trúc Gemini!`, 'success', 3200);
                return;
              }
            }
            const cleaned = String(pasted || '').replace(/```[^\n]*\n?|```/g, '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.includes('|') && !/\.{3,}\s*\d+/.test(l)).join('\n');
            ta.value = cleaned || String(pasted || '').trim();
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            this.toast('✅ Đã nạp danh sách Mục lục từ Gemini!', 'success', 3000);
          },
        });
      });
      body.querySelector('#btn-pro-manual-ai-pii')?.addEventListener('click', async () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const txt = await extractQuickPdfSampleText(8).catch(() => '');
        const promptTxt = gBridge?.buildTaskManualPrompt?.('redact_pii', { text: txt }) || '';
        gBridge?.openManualAiAssistantModal?.({
          taskTitle: 'Che Đen Bảo Mật PII — AI Thủ công 0-Token',
          promptText: promptTxt,
          applyBtnLabel: '✅ Điền ngay vào ô từ khóa Che đen',
          onApplyPasted: (raw) => {
            const inp = body.querySelector('#opt-pro-redact-words');
            if (inp) inp.value = String(raw || '').replace(/```[^\n]*\n?|```/g, '').replace(/\r?\n/g, ', ').trim();
            this.toast('✅ Đã điền danh sách từ khóa nhạy cảm!', 'success', 3000);
          },
        });
      });
      body.querySelector('#btn-pro-manual-ai-meta')?.addEventListener('click', async () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const txt = await extractQuickPdfSampleText(3).catch(() => '');
        const promptTxt = gBridge?.buildTaskManualPrompt?.('metadata_seo', { text: txt }) || '';
        gBridge?.openManualAiAssistantModal?.({
          taskTitle: 'Siêu dữ liệu Metadata — AI Thủ công 0-Token',
          promptText: promptTxt,
          applyBtnLabel: '✅ Điền Tiêu đề, Tác giả & Từ khóa ngay',
          onApplyPasted: (raw) => {
            const m = String(raw || '').match(/\{[\s\S]*\}/);
            if (m) {
              const obj = JSON.parse(m[0]);
              if (obj.title && body.querySelector('#opt-pro-meta-title')) body.querySelector('#opt-pro-meta-title').value = obj.title;
              if (obj.author && body.querySelector('#opt-pro-meta-author')) body.querySelector('#opt-pro-meta-author').value = obj.author;
              if (obj.keywords && body.querySelector('#opt-pro-meta-keywords')) body.querySelector('#opt-pro-meta-keywords').value = obj.keywords;
              this.toast('✅ Đã điền Tiêu đề, Tác giả & Từ khóa!', 'success', 3000);
            }
          },
        });
      });
      body.querySelector('#btn-pro-manual-ai-split')?.addEventListener('click', async () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const txt = await extractQuickPdfSampleText(6).catch(() => '');
        const promptTxt = gBridge?.buildTaskManualPrompt?.('split_keyword', { text: txt }) || '';
        gBridge?.openManualAiAssistantModal?.({
          taskTitle: 'Tách PDF Theo Từ Khóa — AI Thủ công 0-Token',
          promptText: promptTxt,
          applyBtnLabel: '✅ Điền từ khóa ngắt hồ sơ ngay',
          onApplyPasted: (raw) => {
            const inp = body.querySelector('#opt-pro-split-kw');
            const sel = body.querySelector('#opt-pro-smart-split');
            if (inp) inp.value = String(raw || '').split(/\r?\n/)[0].replace(/["'`]/g, '').trim();
            if (sel) sel.value = 'split_keyword';
            this.toast('✅ Đã chọn chế độ Tách theo từ khóa!', 'success', 3000);
          },
        });
      });
      body.querySelector('#btn-pro-manual-ai-form')?.addEventListener('click', () => {
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const ta = body.querySelector('#opt-pro-form-data');
        const userNote = String(ta?.value || '').trim();
        const promptTxt = gBridge?.buildTaskManualPrompt?.('form_fill', { text: userNote || 'Họ tên: ..., Email: ..., SĐT: ...' }) || '';
        gBridge?.openManualAiAssistantModal?.({
          taskTitle: 'Điền Biểu Mẫu AcroForm — AI Thủ công 0-Token',
          promptText: promptTxt,
          applyBtnLabel: '✅ Nạp cặp TenTruong=GiaTri vào ô ngay',
          onApplyPasted: (raw) => {
            if (ta) ta.value = String(raw || '').replace(/```[^\n]*\n?|```/g, '').trim();
            this.toast('✅ Đã nạp dữ liệu chuẩn AcroForm!', 'success', 3000);
          },
        });
      });
      bindQuickProAi('#btn-pro-ai-scan-pii', async (gBridge) => {
        const loader = gBridge.showAiFullLoadingOverlay?.('🛡️ AI đang quét dữ liệu nhạy cảm (PII)...', 'Tìm Họ tên, CCCD, SĐT, Email, STK, Địa chỉ để điền sẵn vào danh sách che đen');
        let promptTxt = '';
        const applyPii = (raw) => {
          const inp = body.querySelector('#opt-pro-redact-words');
          if (inp && raw) inp.value = String(raw).replace(/```[^\n]*\n?|```/g, '').replace(/\r?\n/g, ', ').trim();
          this.toast('✅ AI đã điền sẵn danh sách từ khóa nhạy cảm cần che đen!', 'success', 3200);
        };
        try {
          const txt = await extractQuickPdfSampleText(8);
          promptTxt = gBridge.buildTaskManualPrompt('redact_pii', { text: txt });
          const raw = await gBridge.callGeminiText(promptTxt, { taskType: 'fast_light', temperature: 0.1 });
          applyPii(raw);
          loader?.close?.();
        } catch (e) {
          loader?.showError?.('⚠️ Lỗi AI quét PII', String(e?.message || e), {
            manualFallback: promptTxt ? {
              taskTitle: 'Che Đen PII — Dán danh sách từ khóa nhạy cảm từ Gemini',
              promptText: promptTxt,
              applyBtnLabel: '✅ Điền ngay vào ô Che đen vĩnh viễn',
              onApplyPasted: applyPii,
            } : null,
          });
        }
      });
      bindQuickProAi('#btn-pro-ai-gen-meta', async (gBridge) => {
        const loader = gBridge.showAiFullLoadingOverlay?.('🧾 AI đang sinh Siêu dữ liệu PDF...', 'Đọc trang đầu để tạo Tiêu đề, Tác giả & Từ khóa chuẩn');
        let promptTxt = '';
        const applyMeta = (raw) => {
          const m = String(raw || '').match(/\{[\s\S]*\}/);
          if (m) {
            const obj = JSON.parse(m[0]);
            if (obj.title && body.querySelector('#opt-pro-meta-title')) body.querySelector('#opt-pro-meta-title').value = obj.title;
            if (obj.author && body.querySelector('#opt-pro-meta-author')) body.querySelector('#opt-pro-meta-author').value = obj.author;
            if (obj.keywords && body.querySelector('#opt-pro-meta-keywords')) body.querySelector('#opt-pro-meta-keywords').value = obj.keywords;
            this.toast('✅ AI đã điền sẵn Tiêu đề, Tác giả & Từ khóa!', 'success', 3000);
          }
        };
        try {
          const txt = await extractQuickPdfSampleText(3);
          promptTxt = gBridge.buildTaskManualPrompt('metadata_seo', { text: txt });
          const raw = await gBridge.callGeminiText(promptTxt, { taskType: 'fast_light', temperature: 0.1 });
          applyMeta(raw);
          loader?.close?.();
        } catch (e) {
          loader?.showError?.('⚠️ Lỗi AI tạo Metadata', String(e?.message || e), {
            manualFallback: promptTxt ? {
              taskTitle: 'Siêu dữ liệu PDF — Dán JSON Metadata từ Gemini',
              promptText: promptTxt,
              applyBtnLabel: '✅ Điền Tiêu đề, Tác giả & Từ khóa ngay',
              onApplyPasted: applyMeta,
            } : null,
          });
        }
      });
      bindQuickProAi('#btn-pro-ai-split-kw', async (gBridge) => {
        const loader = gBridge.showAiFullLoadingOverlay?.('🪓 AI đang phân tích điểm ngắt hồ sơ...', 'Tìm từ khóa tiêu đề lặp lại giữa các hồ sơ/hóa đơn');
        let promptTxt = '';
        const applySplitKw = (raw) => {
          const inp = body.querySelector('#opt-pro-split-kw');
          const sel = body.querySelector('#opt-pro-smart-split');
          if (inp && raw) inp.value = String(raw).split(/\r?\n/)[0].replace(/["'`]/g, '').trim();
          if (sel) sel.value = 'split_keyword';
          this.toast('✅ AI đã chọn chế độ Tách theo từ khóa & điền sẵn từ khóa!', 'success', 3000);
        };
        try {
          const txt = await extractQuickPdfSampleText(6);
          promptTxt = gBridge.buildTaskManualPrompt('split_keyword', { text: txt });
          const raw = await gBridge.callGeminiText(promptTxt, { taskType: 'fast_light', temperature: 0.1 });
          applySplitKw(raw);
          loader?.close?.();
        } catch (e) {
          loader?.showError?.('⚠️ Lỗi AI gợi ý từ khóa ngắt', String(e?.message || e), {
            manualFallback: promptTxt ? {
              taskTitle: 'Tách PDF Thông Minh — Dán từ khóa ngắt từ Gemini',
              promptText: promptTxt,
              applyBtnLabel: '✅ Điền từ khóa ngắt ngay',
              onApplyPasted: applySplitKw,
            } : null,
          });
        }
      });
      bindQuickProAi('#btn-pro-ai-fill-form', async (gBridge) => {
        const ta = body.querySelector('#opt-pro-form-data');
        const userNote = String(ta?.value || '').trim();
        if (!userNote) { this.toast('ℹ️ Hãy gõ hoặc dán thông tin cá nhân bất kỳ vào ô trên rồi bấm nút AI để chuẩn hóa thành TenO=GiaTri.', 'info', 3500); return; }
        const loader = gBridge.showAiFullLoadingOverlay?.('📝 AI đang ánh xạ dữ liệu vào Biểu mẫu...', 'Chuyển ghi chú tự do sang cặp TênÔ=GiáTrị chuẩn AcroForm');
        const promptTxt = gBridge.buildTaskManualPrompt('form_fill', { text: userNote });
        const applyForm = (raw) => {
          if (ta && raw) ta.value = String(raw).replace(/```[^\n]*\n?|```/g, '').trim();
          this.toast('✅ AI đã chuyển xong sang định dạng điền Form!', 'success', 2800);
        };
        try {
          const raw = await gBridge.callGeminiText(promptTxt, { taskType: 'fast_light', temperature: 0.1 });
          applyForm(raw);
          loader?.close?.();
        } catch (e) {
          loader?.showError?.('⚠️ Lỗi AI chuẩn hóa Form', String(e?.message || e), {
            manualFallback: {
              taskTitle: 'Điền Form AcroForm — Dán cặp TenTruong=GiaTri từ Gemini',
              promptText: promptTxt,
              applyBtnLabel: '✅ Nạp dữ liệu vào Biểu mẫu ngay',
              onApplyPasted: applyForm,
            },
          });
        }
      });
      body.querySelector('#btn-mod46-add-blank-page')?.addEventListener('click', () => {
        this.pagesState.push({
          uid: `blank_${Date.now()}`,
          pageIndex: -1,
          rotation: 0,
          isBlank: true,
          isDeleted: false,
          thumbUrl: ''
        });
        this.renderUploadOrWorkspaceScreen();
      });

      body.querySelectorAll('[data-file-act]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const act = btn.getAttribute('data-file-act');
          const fid = btn.getAttribute('data-file-id');
          const idx = this.files.findIndex((f) => f.id === fid);
          if (idx < 0) return;
          if (act === 'del') this.files.splice(idx, 1);
          else if (act === 'up' && idx > 0) [this.files[idx - 1], this.files[idx]] = [this.files[idx], this.files[idx - 1]];
          else if (act === 'down' && idx < this.files.length - 1) [this.files[idx + 1], this.files[idx]] = [this.files[idx], this.files[idx + 1]];
          this.renderUploadOrWorkspaceScreen();
        });
      });

      body.querySelectorAll('[data-pg-act]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const act = btn.getAttribute('data-pg-act');
          const uid = btn.getAttribute('data-pg-uid');
          const visible = this.pagesState.filter((p) => !p.isDeleted);
          const vIdx = visible.findIndex((p) => p.uid === uid);
          const realIdx = this.pagesState.findIndex((p) => p.uid === uid);
          if (realIdx < 0) return;
          if (act === 'rot') {
            this.pagesState[realIdx].rotation = (this.pagesState[realIdx].rotation + 90) % 360;
          } else if (act === 'dup') {
            const clone = { ...this.pagesState[realIdx], uid: `dup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
            this.pagesState.splice(realIdx + 1, 0, clone);
          } else if (act === 'del') {
            if (visible.length <= 1) {
              this.toast('⚠️ Phải giữ lại ít nhất 1 trang trong file PDF.', 'warning', 2000);
              return;
            }
            this.pagesState[realIdx].isDeleted = true;
          } else if (act === 'left' && vIdx > 0) {
            const prevIdx = this.pagesState.indexOf(visible[vIdx - 1]);
            [this.pagesState[prevIdx], this.pagesState[realIdx]] = [this.pagesState[realIdx], this.pagesState[prevIdx]];
          } else if (act === 'right' && vIdx < visible.length - 1) {
            const nextIdx = this.pagesState.indexOf(visible[vIdx + 1]);
            [this.pagesState[nextIdx], this.pagesState[realIdx]] = [this.pagesState[realIdx], this.pagesState[nextIdx]];
          }
          this.renderUploadOrWorkspaceScreen();
        });
      });

      // Gắn True Interactive Visual PDF Editor (Mod 46C) nếu đang mở annotate_edit
      const trueEdMount = body.querySelector('#mod46-true-editor-mount');
      if (trueEdMount && this.files[0] && NS.dangLovePdfStudioPro?.editor?.mount) {
        NS.dangLovePdfStudioPro.editor.mount(trueEdMount, this.files[0], ensurePdfJs);
        const cadInp = body.querySelector('#opt-pro-cad-scale');
        cadInp?.addEventListener('change', () => {
          NS.dangLovePdfStudioPro.editor.measureScale = Math.max(0.1, Number(cadInp.value) || 5);
        });
      }

      // Tương tác Cắt xén lề trực quan (Drag-to-Crop 2 chiều đồng bộ với 4 ô %)
      const cropCanvas = body.querySelector('#canvas-mod46-crop-preview');
      const cropBox = body.querySelector('#mod46-crop-box');
      const cropStage = body.querySelector('#mod46-crop-stage');
      if (cropCanvas && cropBox && cropStage && this.files[0]) {
        const inL = body.querySelector('#opt-crop-l');
        const inR = body.querySelector('#opt-crop-r');
        const inT = body.querySelector('#opt-crop-t');
        const inB = body.querySelector('#opt-crop-b');
        const badge = body.querySelector('#mod46-crop-live-badge');
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
        const syncBoxFromInputs = () => {
          const l = clamp(Number(inL?.value || 0), 0, 45);
          const r = clamp(Number(inR?.value || 0), 0, 45);
          const t = clamp(Number(inT?.value || 0), 0, 45);
          const b = clamp(Number(inB?.value || 0), 0, 45);
          cropBox.style.left = `${l}%`;
          cropBox.style.right = `${r}%`;
          cropBox.style.top = `${t}%`;
          cropBox.style.bottom = `${b}%`;
          if (badge) badge.textContent = `Trái ${l}% · Phải ${r}% · Trên ${t}% · Dưới ${b}%`;
        };
        [inL, inR, inT, inB].forEach((el) => el?.addEventListener('input', syncBoxFromInputs));
        syncBoxFromInputs();

        let activeHandle = null;
        cropStage.addEventListener('pointerdown', (ev) => {
          const h = ev.target?.getAttribute?.('data-crop-handle');
          if (!h) return;
          activeHandle = h;
          cropStage.setPointerCapture(ev.pointerId);
          ev.preventDefault();
        });
        cropStage.addEventListener('pointermove', (ev) => {
          if (!activeHandle) return;
          const rect = cropStage.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          const px = ((ev.clientX - rect.left) / rect.width) * 100;
          const py = ((ev.clientY - rect.top) / rect.height) * 100;
          if (activeHandle === 'l' && inL) inL.value = String(clamp(px, 0, 45));
          if (activeHandle === 'r' && inR) inR.value = String(clamp(100 - px, 0, 45));
          if (activeHandle === 't' && inT) inT.value = String(clamp(py, 0, 45));
          if (activeHandle === 'b' && inB) inB.value = String(clamp(100 - py, 0, 45));
          syncBoxFromInputs();
        });
        const stopCrop = () => { activeHandle = null; };
        cropStage.addEventListener('pointerup', stopCrop);
        cropStage.addEventListener('pointercancel', stopCrop);

        (async () => {
          try {
            const pdfjsLib = await ensurePdfJs();
            const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
            const pg = await pdf.getPage(1);
            const baseVp = pg.getViewport({ scale: 1 });
            const targetW = Math.min(540, Math.max(280, (body.clientWidth || 620) * 0.56));
            const cssScale = targetW / Math.max(1, baseVp.width);
            if (window.DangLovePDFRenderer?.renderPageToCanvas) {
              await window.DangLovePDFRenderer.renderPageToCanvas(pg, cropCanvas, cssScale, { key: 'mod46-crop-pv' });
            } else {
              const outSc = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
              const vp = pg.getViewport({ scale: cssScale });
              const cssW = Math.round(vp.width);
              const cssH = Math.round(vp.height);
              cropCanvas.width = Math.round(cssW * outSc);
              cropCanvas.height = Math.round(cssH * outSc);
              cropCanvas.style.width = `${cssW}px`;
              cropCanvas.style.height = `${cssH}px`;
              await pg.render({ canvasContext: cropCanvas.getContext('2d'), viewport: vp, transform: [outSc, 0, 0, outSc, 0, 0], intent: 'display' }).promise;
            }
          } catch (_eCropPv) {}
        })();
      }

      // Bảng vẽ chữ ký + Kéo thả chọn vị trí chữ ký trực quan ngay trên trang PDF
      const sigCanvas = body.querySelector('#canvas-mod46-sig-pad');
      if (sigCanvas) {
        const ctx = sigCanvas.getContext('2d');
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        let drawing = false;
        const sigLiveImg = body.querySelector('#img-mod46-sig-live-preview');
        const sigPlaceholder = body.querySelector('#lbl-mod46-sig-placeholder');
        const refreshLiveSigOverlay = () => {
          const typed = body.querySelector('#opt-sign-typed-name')?.value?.trim() || '';
          const url =
            this.signatureDataUrl ||
            (typed && NS.dangLovePdfPro?.renderCursiveSignaturePng
              ? NS.dangLovePdfPro.renderCursiveSignaturePng(typed)
              : '');
          if (sigLiveImg && sigPlaceholder) {
            if (url) {
              sigLiveImg.src = url;
              sigLiveImg.classList.remove('hidden');
              sigPlaceholder.classList.add('hidden');
            } else {
              sigLiveImg.classList.add('hidden');
              sigPlaceholder.classList.remove('hidden');
            }
          }
        };
        body.querySelector('#opt-sign-typed-name')?.addEventListener('input', refreshLiveSigOverlay);

        const getPt = (ev) => {
          const r = sigCanvas.getBoundingClientRect();
          return {
            x: ((ev.clientX - r.left) / r.width) * sigCanvas.width,
            y: ((ev.clientY - r.top) / r.height) * sigCanvas.height
          };
        };
        sigCanvas.addEventListener('pointerdown', (ev) => {
          drawing = true;
          sigCanvas.setPointerCapture(ev.pointerId);
          const p = getPt(ev);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        });
        sigCanvas.addEventListener('pointermove', (ev) => {
          if (!drawing) return;
          const p = getPt(ev);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          this.signatureDataUrl = sigCanvas.toDataURL('image/png');
          refreshLiveSigOverlay();
        });
        const stopDraw = () => { drawing = false; };
        sigCanvas.addEventListener('pointerup', stopDraw);
        sigCanvas.addEventListener('pointercancel', stopDraw);

        body.querySelector('#btn-mod46-sig-clear')?.addEventListener('click', () => {
          ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
          this.signatureDataUrl = '';
          refreshLiveSigOverlay();
        });
        body.querySelector('#input-mod46-sig-img')?.addEventListener('change', (ev) => {
          const file = ev.target.files?.[0];
          if (!file) return;
          const img = new Image();
          const u = this.trackUrl(file);
          img.onload = () => {
            ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            const scale = Math.min(sigCanvas.width / img.width, sigCanvas.height / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.drawImage(img, (sigCanvas.width - dw) / 2, (sigCanvas.height - dh) / 2, dw, dh);
            const imgData = ctx.getImageData(0, 0, sigCanvas.width, sigCanvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) d[i + 3] = 0;
            }
            ctx.putImageData(imgData, 0, 0);
            this.signatureDataUrl = sigCanvas.toDataURL('image/png');
            refreshLiveSigOverlay();
            this.toast('✅ Đã nạp ảnh chữ ký & tách nền trắng tự động!', 'success', 2000);
          };
          img.src = u;
        });

        // Dựng trang PDF đang chọn & cho phép kéo thả / bấm chọn tọa độ chữ ký trực quan
        const sigPageCanvas = body.querySelector('#canvas-mod46-sig-page-preview');
        const sigStage = body.querySelector('#mod46-sig-page-stage');
        const sigBox = body.querySelector('#mod46-sig-drag-box');
        const sigPageInp = body.querySelector('#opt-sign-page');
        const sigPosSel = body.querySelector('#opt-sign-pos');
        const sigPosBadge = body.querySelector('#mod46-sig-pos-badge');
        if (sigPageCanvas && sigStage && sigBox && this.files[0]) {
          this.sigCustomPos = this.sigCustomPos || { xPct: 64, yPct: 80, wPct: 28, hPct: 10 };
          const applySigBoxStyle = () => {
            sigBox.style.left = `${this.sigCustomPos.xPct}%`;
            sigBox.style.top = `${this.sigCustomPos.yPct}%`;
            sigBox.style.width = `${this.sigCustomPos.wPct}%`;
            sigBox.style.height = `${this.sigCustomPos.hPct}%`;
            if (sigPosBadge) {
              sigPosBadge.textContent = `Trang ${sigPageInp?.value || 1} · X:${Math.round(this.sigCustomPos.xPct)}% Y:${Math.round(this.sigCustomPos.yPct)}%`;
            }
          };
          applySigBoxStyle();
          sigPosSel?.addEventListener('change', () => {
            const v = sigPosSel.value;
            if (v === 'bottom-left') this.sigCustomPos = { xPct: 6, yPct: 80, wPct: 28, hPct: 10 };
            else if (v === 'bottom-center') this.sigCustomPos = { xPct: 36, yPct: 80, wPct: 28, hPct: 10 };
            else if (v === 'center') this.sigCustomPos = { xPct: 36, yPct: 45, wPct: 28, hPct: 10 };
            else this.sigCustomPos = { xPct: 64, yPct: 80, wPct: 28, hPct: 10 };
            applySigBoxStyle();
          });

          let draggingSig = false;
          const placeSigAtEvent = (ev) => {
            const rect = sigStage.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            const cx = ((ev.clientX - rect.left) / rect.width) * 100;
            const cy = ((ev.clientY - rect.top) / rect.height) * 100;
            this.sigCustomPos.xPct = Math.max(0, Math.min(100 - this.sigCustomPos.wPct, cx - this.sigCustomPos.wPct / 2));
            this.sigCustomPos.yPct = Math.max(0, Math.min(100 - this.sigCustomPos.hPct, cy - this.sigCustomPos.hPct / 2));
            applySigBoxStyle();
          };
          sigStage.addEventListener('pointerdown', (ev) => {
            draggingSig = true;
            sigStage.setPointerCapture(ev.pointerId);
            placeSigAtEvent(ev);
          });
          sigStage.addEventListener('pointermove', (ev) => {
            if (draggingSig) placeSigAtEvent(ev);
          });
          const endSigDrag = () => { draggingSig = false; };
          sigStage.addEventListener('pointerup', endSigDrag);
          sigStage.addEventListener('pointercancel', endSigDrag);

          const renderSignPagePreview = async (pgNo) => {
            try {
              const pdfjsLib = await ensurePdfJs();
              const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
              const safePg = Math.max(1, Math.min(pdf.numPages, Number(pgNo) || 1));
              const pg = await pdf.getPage(safePg);
              const baseVp = pg.getViewport({ scale: 1 });
              const targetW = Math.min(520, Math.max(280, (body.clientWidth || 620) * 0.56));
              const cssScale = targetW / Math.max(1, baseVp.width);
              if (window.DangLovePDFRenderer?.renderPageToCanvas) {
                await window.DangLovePDFRenderer.renderPageToCanvas(pg, sigPageCanvas, cssScale, { key: 'mod46-sign-pv' });
              } else {
                const outSc = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
                const vp = pg.getViewport({ scale: cssScale });
                const cssW = Math.round(vp.width);
                const cssH = Math.round(vp.height);
                sigPageCanvas.width = Math.round(cssW * outSc);
                sigPageCanvas.height = Math.round(cssH * outSc);
                sigPageCanvas.style.width = `${cssW}px`;
                sigPageCanvas.style.height = `${cssH}px`;
                await pg.render({ canvasContext: sigPageCanvas.getContext('2d'), viewport: vp, transform: [outSc, 0, 0, outSc, 0, 0], intent: 'display' }).promise;
              }
              applySigBoxStyle();
            } catch (_eSigPv) {}
          };
          renderSignPagePreview(sigPageInp?.value || 1);
          sigPageInp?.addEventListener('change', () => renderSignPagePreview(sigPageInp.value));
        }
      }

      // Mô phỏng trang giấy trực quan (kéo thả vị trí chữ/số + vẽ khung che xóa chữ/số cũ) cho page_numbers, watermark, header_footer, bookmarks_toc
      const simStage = body.querySelector('#mod46-paper-sim-stage');
      const simCanvas = body.querySelector('#canvas-mod46-paper-sim');
      if (simStage && simCanvas && this.files[0]) {
        const tid = this.activeTool.id;
        if (!this.paperSimState || this.paperSimState.toolId !== tid) {
          this.paperSimState = {
            toolId: tid,
            mode: 'place', // 'place' | 'erase'
            mainPos: tid === 'watermark' ? { xPct: 50, yPct: 50, custom: false } : { xPct: 50, yPct: 94, custom: false },
            headerPos: { xPct: 50, yPct: 4.5, custom: false },
            footerPos: { xPct: 50, yPct: 95.5, custom: false },
            eraseRects: [], // [{ xPct, yPct, wPct, hPct }]
          };
        }
        const simState = this.paperSimState;
        const simBadge = body.querySelector('#mod46-papersim-badge');
        const eraseLayer = body.querySelector('#mod46-papersim-erase-layer');
        const mainBox = body.querySelector('#mod46-papersim-box-main');
        const headerBox = body.querySelector('#mod46-papersim-box-header');
        const footerBox = body.querySelector('#mod46-papersim-box-footer');
        const btnPlace = body.querySelector('#btn-papersim-mode-place');
        const btnErase = body.querySelector('#btn-papersim-mode-erase');
        const pageInp = body.querySelector('#inp-papersim-page');

        const paintEraseBoxes = () => {
          if (!eraseLayer) return;
          eraseLayer.innerHTML = simState.eraseRects
            .map(
              (r, idx) =>
                `<div class="absolute bg-white/95 border-2 border-dashed border-rose-500 flex items-center justify-center text-[9px] font-black text-rose-600" style="left:${r.xPct}%;top:${r.yPct}%;width:${r.wPct}%;height:${r.hPct}%;">Che #${idx + 1}</div>`
            )
            .join('');
        };

        const renderTocPreviewSheet = () => {
          const st = readWordStyleBar('toc', { fontSize: 14, color: '#18181b', fontFamily: '"Times New Roman", Georgia, serif', bold: false });
          const tocTitle = body.querySelector('#opt-pro-toc-title')?.value?.trim() || 'MỤC LỤC BÁO CÁO & TÀI LIỆU';
          const tocStyle = body.querySelector('#opt-pro-toc-style')?.value || 'dang_report';
          const allRaw = (body.querySelector('#opt-pro-toc-lines')?.value || '').split(/\r?\n/).filter((l) => l.trim());
          simCanvas.width = 460;
          simCanvas.height = 650;
          const c = simCanvas.getContext('2d');
          c.fillStyle = '#ffffff';
          c.fillRect(0, 0, simCanvas.width, simCanvas.height);

          if (tocStyle === 'dang_report') {
            c.fillStyle = '#0f2438';
            c.fillRect(0, 0, simCanvas.width, 8);
            c.fillStyle = '#0d9488';
            c.fillRect(0, 8, simCanvas.width, 3);

            c.fillStyle = '#0f2438';
            c.fillRect(28, 28, simCanvas.width - 56, 32);
            c.fillStyle = '#0d9488';
            c.fillRect(28, 31, 5, 26);
            c.fillStyle = '#ffffff';
            c.font = '700 12px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
            c.fillText(tocTitle.toUpperCase().slice(0, 48), 42, 49);

            const secRows = [];
            const tblRows = [];
            const figRows = [];
            allRaw.forEach((line) => {
              const trimmed = line.trim();
              const parts = trimmed.split('|');
              const label = (parts[0] || trimmed).trim();
              const pg = (parts[1] || '1').trim();
              if (/^\[Bảng\]/i.test(label) || /^BẢNG\s+\d/i.test(label)) {
                tblRows.push({ label: label.replace(/^\[Bảng\]\s*/i, '').trim(), pg });
              } else if (/^\[Hình\]/i.test(label) || /^HÌNH\s+\d/i.test(label)) {
                figRows.push({ label: label.replace(/^\[Hình\]\s*/i, '').trim(), pg });
              } else {
                secRows.push({ label, pg, isSub: /^\s{2,}/.test(line) || /^\d+\.\d+/.test(label) });
              }
            });

            let y = 78;
            secRows.slice(0, 14).forEach((s) => {
              c.fillStyle = s.isSub ? '#334155' : '#0f2438';
              c.font = `${s.isSub ? '500 10.5px' : '700 11.5px'} "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif`;
              const indent = s.isSub ? 12 : 0;
              c.fillText(s.label.slice(0, 46), 30 + indent, y);
              c.fillStyle = '#0d9488';
              c.font = '700 11px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
              c.textAlign = 'right';
              c.fillText(s.pg, simCanvas.width - 30, y);
              c.textAlign = 'left';
              c.fillStyle = '#e2e8f0';
              c.fillRect(30 + indent, y + 6, simCanvas.width - 60 - indent, 1);
              y += 22;
            });

            if (tblRows.length || figRows.length) {
              const cardY = Math.max(y + 10, 415);
              const cardW = tblRows.length && figRows.length ? 194 : 404;
              const drawMiniCard = (cx, titleCard, rows) => {
                c.fillStyle = '#f8fafc';
                c.fillRect(cx, cardY, cardW, 175);
                c.strokeStyle = '#cbd5e1';
                c.strokeRect(cx, cardY, cardW, 175);
                c.fillStyle = '#0f2438';
                c.font = '700 9.5px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
                c.fillText(titleCard, cx + 10, cardY + 18);
                c.fillStyle = '#0d9488';
                c.fillRect(cx + 10, cardY + 24, cardW - 20, 1.5);
                rows.slice(0, 6).forEach((it, i) => {
                  const ry = cardY + 42 + i * 20;
                  c.fillStyle = '#1e293b';
                  c.font = '500 9px "Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
                  c.fillText(it.label.slice(0, 24), cx + 10, ry);
                  c.fillStyle = '#0f2438';
                  c.textAlign = 'right';
                  c.fillText(it.pg, cx + cardW - 10, ry);
                  c.textAlign = 'left';
                });
              };
              if (tblRows.length && figRows.length) {
                drawMiniCard(28, 'DANH MỤC BẢNG', tblRows);
                drawMiniCard(238, 'DANH MỤC HÌNH', figRows);
              } else if (tblRows.length) {
                drawMiniCard(28, 'DANH MỤC BẢNG DỮ LIỆU', tblRows);
              } else {
                drawMiniCard(28, 'DANH MỤC BIỂU ĐỒ & HÌNH', figRows);
              }
            }
            if (simBadge) simBadge.textContent = `Định dạng Đăng · ${secRows.length} mục · ${tblRows.length} bảng · ${figRows.length} hình`;
            return;
          }

          const rawLines = allRaw.map((l) => l.trim());
          const headSize = Math.max(14, Math.round(st.fontSize * 1.25));
          c.fillStyle = st.color === '#18181b' ? '#065f46' : st.color;
          c.font = `${st.italic ? 'italic ' : ''}700 ${headSize}px ${st.fontFamily}`;
          c.fillText(tocTitle, 36, 56);
          if (st.underline) {
            const hw = c.measureText(tocTitle).width;
            c.strokeStyle = c.fillStyle;
            c.lineWidth = 1.4;
            c.beginPath(); c.moveTo(36, 60); c.lineTo(36 + hw, 60); c.stroke();
          }
          c.fillStyle = st.color;
          c.font = `${st.italic ? 'italic ' : ''}${st.bold ? '700 ' : '400 '}${Math.max(10, st.fontSize)}px ${st.fontFamily}`;
          let y = 96;
          rawLines.slice(0, 18).forEach((l) => {
            const parts = l.split('|');
            const title = (parts[0] || l).trim();
            const pgNum = (parts[1] || '').trim();
            let row = title;
            if (pgNum) {
              if (tocStyle === 'space') row = `${title}     ${pgNum}`;
              else if (tocStyle === 'dash') row = `${title} ————— ${pgNum}`;
              else if (tocStyle === 'prefix') row = `[Trang ${pgNum}] · ${title}`;
              else row = `${title} ${'.'.repeat(Math.max(5, 34 - Math.min(28, title.length)))} ${pgNum}`;
            }
            c.fillText(row, 36, y, simCanvas.width - 72);
            if (st.underline) {
              const rw = Math.min(simCanvas.width - 72, c.measureText(row).width);
              c.strokeStyle = st.color;
              c.lineWidth = 1;
              c.beginPath(); c.moveTo(36, y + 3); c.lineTo(36 + rw, y + 3); c.stroke();
            }
            y += Math.max(18, Math.round(st.fontSize * 1.65));
          });
          if (simBadge) simBadge.textContent = `A4 · ${st.fontSize}pt · ${rawLines.length} mục`;
        };

        const syncVisualOverlays = () => {
          if (tid === 'bookmarks_toc') {
            renderTocPreviewSheet();
            return;
          }
          const applyTextStyle = (el, st, text, pos, extra = {}) => {
            if (!el) return;
            el.textContent = text || ' ';
            el.style.left = `${pos.xPct}%`;
            el.style.top = `${pos.yPct}%`;
            el.style.fontFamily = st.fontFamily;
            el.style.fontSize = `${Math.max(10, Math.min(34, Math.round(st.fontSize * 0.82)))}px`;
            el.style.color = st.color;
            el.style.fontWeight = st.bold ? '700' : '400';
            el.style.fontStyle = st.italic ? 'italic' : 'normal';
            el.style.textDecoration = st.underline ? 'underline' : 'none';
            el.style.backgroundColor = st.bgColor ? 'rgba(255,255,255,0.95)' : 'rgba(244,63,94,0.08)';
            el.style.opacity = String(extra.opacity ?? 1);
            el.style.transform = `translate(-50%, -50%) rotate(${-(extra.angle || 0)}deg)`;
          };

          if (tid === 'page_numbers') {
            const st = readWordStyleBar('pn', { fontSize: 13, color: '#1f2937', bold: true });
            const fmt = body.querySelector('#opt-pn-fmt')?.value || 'Trang {n}/{total}';
            const startN = Number(body.querySelector('#opt-pn-start')?.value || 1);
            const bates = body.querySelector('#opt-pn-bates-prefix')?.value?.trim() || '';
            const totalPg = this.files[0]?.pageCount || 10;
            const previewTxt = bates
              ? `${bates}${String(startN).padStart(4, '0')}`
              : fmt.replace('{n}', String(startN)).replace('{total}', String(totalPg));
            applyTextStyle(mainBox, st, previewTxt, simState.mainPos);
            if (simBadge) simBadge.textContent = `X:${Math.round(simState.mainPos.xPct)}% · Y:${Math.round(simState.mainPos.yPct)}% · ${st.fontSize}pt · ${simState.eraseRects.length} khung che`;
          } else if (tid === 'watermark') {
            const st = readWordStyleBar('wm', { fontSize: 38, color: '#e11d48', bold: true, angle: 35 });
            const wmTxt = body.querySelector('#opt-wm-text')?.value?.trim() || 'BẢN QUYỀN TÁC GIẢ';
            const op = Math.max(0.1, Math.min(1, Number(body.querySelector('#opt-wm-opacity')?.value || 0.28)));
            applyTextStyle(mainBox, st, wmTxt, simState.mainPos, { opacity: Math.max(0.2, op), angle: st.angle });
            if (simBadge) simBadge.textContent = `X:${Math.round(simState.mainPos.xPct)}% · Y:${Math.round(simState.mainPos.yPct)}% · Xoay ${st.angle}° · ${st.fontSize}pt`;
          } else if (tid === 'header_footer') {
            const st = readWordStyleBar('hf', { fontSize: 11, color: '#334155', bold: true });
            const dateStr = new Date().toLocaleDateString('vi-VN');
            const totalPg = this.files[0]?.pageCount || 10;
            const fmtHf = (s) => String(s || '').replace(/\{page\}/g, '1').replace(/\{total\}/g, String(totalPg)).replace(/\{date\}/g, dateStr);
            const hTxt = fmtHf(body.querySelector('#opt-pro-hf-header')?.value || '');
            const fTxt = fmtHf(body.querySelector('#opt-pro-hf-footer')?.value || '');
            if (headerBox) {
              headerBox.style.display = hTxt.trim() ? 'block' : 'none';
              applyTextStyle(headerBox, st, hTxt, simState.headerPos);
            }
            if (footerBox) {
              footerBox.style.display = fTxt.trim() ? 'block' : 'none';
              applyTextStyle(footerBox, st, fTxt, simState.footerPos);
            }
            if (simBadge) simBadge.textContent = `Đầu Y:${Math.round(simState.headerPos.yPct)}% · Chân Y:${Math.round(simState.footerPos.yPct)}% · ${st.fontSize}pt · ${simState.eraseRects.length} khung che`;
          }
          paintEraseBoxes();
        };

        const setSimMode = (m) => {
          simState.mode = m;
          btnPlace?.classList.toggle('bg-sky-600', m === 'place');
          btnPlace?.classList.toggle('text-white', m === 'place');
          btnPlace?.classList.toggle('bg-zinc-800', m !== 'place');
          btnErase?.classList.toggle('bg-rose-600', m === 'erase');
          btnErase?.classList.toggle('text-white', m === 'erase');
          btnErase?.classList.toggle('bg-zinc-800', m !== 'erase');
        };
        btnPlace?.addEventListener('click', () => setSimMode('place'));
        btnErase?.addEventListener('click', () => setSimMode('erase'));
        body.querySelector('#btn-papersim-undo-erase')?.addEventListener('click', () => {
          simState.eraseRects.pop();
          syncVisualOverlays();
        });
        body.querySelector('#btn-papersim-clear-erase')?.addEventListener('click', () => {
          simState.eraseRects = [];
          syncVisualOverlays();
        });

        // Đồng bộ preset vị trí với mô phỏng
        body.querySelector('#opt-pn-pos')?.addEventListener('change', (ev) => {
          const v = ev.target.value;
          if (v === 'custom') return;
          const map = {
            'bottom-center': { xPct: 50, yPct: 95 },
            'bottom-right': { xPct: 86, yPct: 95 },
            'bottom-left': { xPct: 14, yPct: 95 },
            'top-center': { xPct: 50, yPct: 5 },
            'top-right': { xPct: 86, yPct: 5 },
            'top-left': { xPct: 14, yPct: 5 },
          };
          if (map[v]) {
            simState.mainPos = { ...map[v], custom: false };
            syncVisualOverlays();
          }
        });
        body.querySelector('#opt-pro-hf-hpos')?.addEventListener('change', (ev) => {
          const v = ev.target.value;
          simState.headerPos.xPct = v === 'left' ? 18 : v === 'right' ? 82 : 50;
          syncVisualOverlays();
        });
        body.querySelector('#opt-pro-hf-fpos')?.addEventListener('change', (ev) => {
          const v = ev.target.value;
          simState.footerPos.xPct = v === 'left' ? 18 : v === 'right' ? 82 : 50;
          syncVisualOverlays();
        });

        // Bắt sự kiện thay đổi tất cả ô chữ, font, cỡ, màu, B/I/U ở cột phải để cập nhật mô phỏng tức thì
        body.querySelectorAll('#mod46-options-panel input, #mod46-options-panel select, #mod46-options-panel textarea').forEach((el) => {
          el.addEventListener('input', syncVisualOverlays);
          el.addEventListener('change', syncVisualOverlays);
        });

        if (tid === 'bookmarks_toc') {
          const updateTocConfBadge = (blocks) => {
            const badgeEl = body.querySelector('#mod46-toc-confidence-badge');
            const cm = blocks?.__ast?.meta?.confidenceMatrix;
            if (!badgeEl || !cm) return;
            badgeEl.classList.remove('hidden');
            badgeEl.textContent = `🎯 Độ tin cậy mã thuần (XY-Cut): ${cm.overallConfidence}% · ${cm.totalPages || '?'} trang${cm.profileCounts?.multiCol ? ` (${cm.profileCounts.multiCol} trang nhiều cột)` : ''}${cm.ambiguousHeadings?.length ? ` · ${cm.ambiguousHeadings.length} tiêu đề nhập nhằng (bấm ⚡ AI Siêu Tốc hoặc 📋 AI Thủ Công để chốt)` : ' · Xuất thẳng không cần AI!'}`;
          };
          const runAutoTocDetect = async (silent = false) => {
            const ta = body.querySelector('#opt-pro-toc-lines');
            if (!ta || !this.files[0]) return null;
            const extractor = global.NoirExtractStructuredBlocksFromFile || NS.dangLovePdfPro?.extractStructuredBlocksFromFile;
            const tocBuilder = global.NoirBuildTocFromBlocks || NS.dangLovePdfPro?.buildTocFromBlocks;
            if (!extractor || !tocBuilder) return null;
            try {
              const blocks = await extractor(this.files[0], { ensurePdfJs, ensureJsZip, ensureXlsx });
              this._tocAnalyzedCache = { fileId: this.files[0].id, blocks };
              if (!ta.isConnected) return blocks;
              updateTocConfBadge(blocks);
              const toc = tocBuilder(blocks);
              const lines = [
                ...(toc.sections || []).map((s) => `${s.level >= 2 ? '  ' : ''}${s.text} | ${s.pageNo}`),
                ...(toc.tables || []).map((t) => `[Bảng] ${t.label} | ${t.pageNo}`),
                ...(toc.figures || []).map((fg) => `[Hình] ${fg.label} | ${fg.pageNo}`),
              ];
              if (lines.length) {
                ta.value = lines.join('\n');
                renderTocPreviewSheet();
                if (!silent) {
                  this.toast(`🔍 Quét mã thuần (0-Token · XY-Cut): ${toc.sections.length} tiêu đề, ${toc.tables.length} bảng & ${toc.figures.length} hình!`, 'success', 2800);
                }
              } else if (!silent) {
                this.toast('Chưa phát hiện dòng mục lục tự động trong file PDF — bạn có thể bấm ⚡ AI Siêu Tốc hoặc 📋 AI Thủ Công.', 'info', 2800);
              }
              return blocks;
            } catch (_eToc) {
              if (!silent) this.toast('Không thể quét cấu trúc tự động từ tệp PDF này.', 'warning', 2500);
              return null;
            }
          };
          // Nút 1: Thuần Code (0-Token, không trộn AI!)
          body.querySelector('#btn-pro-toc-autodetect')?.addEventListener('click', async () => {
            const btn = body.querySelector('#btn-pro-toc-autodetect');
            const origTxt = btn?.textContent || '';
            if (btn) btn.textContent = '⏳ Đang quét mã thuần...';
            try {
              await runAutoTocDetect(false);
            } finally {
              if (btn) btn.textContent = origTxt;
            }
          });
          // Nút 2: AI Siêu Tốc riêng biệt (Block-ID Pxx_Byy + Gemini 3.8 Flash)
          body.querySelector('#btn-pro-ai-fast-toc')?.addEventListener('click', async () => {
            const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
            const btn = body.querySelector('#btn-pro-ai-fast-toc');
            const taEl = body.querySelector('#opt-pro-toc-lines');
            if (!gBridge || !this.files[0] || !taEl) return;
            const execFastToc = async () => {
              const origTxt = btn?.textContent || '';
              if (btn) { btn.disabled = true; btn.textContent = '⏳ AI đang định vị...'; }
              try {
                const blocks = this._tocAnalyzedCache?.fileId === this.files[0].id && this._tocAnalyzedCache.blocks
                  ? this._tocAnalyzedCache.blocks
                  : await runAutoTocDetect(true);
                if (blocks && typeof gBridge.runAiAndCodeAutoToc === 'function') {
                  const aiLines = await gBridge.runAiAndCodeAutoToc(blocks, {
                    codeTocBuilder: () => String(taEl.value || '').split(/\r?\n/).filter(Boolean),
                    maxPage: this.files[0].pageCount || 999,
                    fileName: this.files[0].name || 'Tai_lieu.pdf',
                  });
                  if (Array.isArray(aiLines) && aiLines.length) {
                    taEl.value = aiLines.join('\n');
                    renderTocPreviewSheet();
                    this.toast(`⚡ AI Siêu Tốc (Block-ID) đã chốt ${aiLines.length} đề mục chuẩn xác!`, 'success', 3200);
                  }
                }
              } catch (err) {
                this.toast(`⚠️ Lỗi AI Siêu Tốc Mục lục: ${err?.message || err}`, 'warning', 3500);
              } finally {
                if (btn) { btn.disabled = false; btn.textContent = origTxt; }
              }
            };
            if (!gBridge.hasApiKey?.()) {
              gBridge.openApiKeyQuickModal?.({ onSaved: () => execFastToc() });
              return;
            }
            await execFastToc();
          });
          const initialTaVal = body.querySelector('#opt-pro-toc-lines')?.value?.trim() || '';
          if (!initialTaVal || /^Chương 1: Khởi đầu \| 1\s+Chương 2: Diễn biến chính \| 5\s+Chương 3: Tổng kết \| 12$/i.test(initialTaVal)) {
            runAutoTocDetect(true);
          }
        }

        if (tid !== 'bookmarks_toc') {
          let dragTarget = null;
          let eraseDraft = null;
          const getPct = (ev) => {
            const rect = simStage.getBoundingClientRect();
            return {
              xPct: Math.max(2, Math.min(98, ((ev.clientX - rect.left) / Math.max(1, rect.width)) * 100)),
              yPct: Math.max(2, Math.min(98, ((ev.clientY - rect.top) / Math.max(1, rect.height)) * 100)),
            };
          };
          simStage.addEventListener('pointerdown', (ev) => {
            simStage.setPointerCapture(ev.pointerId);
            const pt = getPct(ev);
            if (simState.mode === 'erase') {
              eraseDraft = { startX: pt.xPct, startY: pt.yPct, rect: { xPct: pt.xPct, yPct: pt.yPct, wPct: 1, hPct: 1 } };
              simState.eraseRects.push(eraseDraft.rect);
              syncVisualOverlays();
              return;
            }
            const hitAttr = ev.target?.closest?.('[data-sim-drag]')?.getAttribute('data-sim-drag');
            if (tid === 'header_footer') {
              dragTarget = hitAttr || (pt.yPct < 50 ? 'header' : 'footer');
            } else {
              dragTarget = 'main';
            }
            if (dragTarget === 'header') simState.headerPos = { xPct: pt.xPct, yPct: pt.yPct, custom: true };
            else if (dragTarget === 'footer') simState.footerPos = { xPct: pt.xPct, yPct: pt.yPct, custom: true };
            else {
              simState.mainPos = { xPct: pt.xPct, yPct: pt.yPct, custom: true };
              const pnPosSel = body.querySelector('#opt-pn-pos');
              if (pnPosSel) pnPosSel.value = 'custom';
            }
            syncVisualOverlays();
          });
          simStage.addEventListener('pointermove', (ev) => {
            if (!dragTarget && !eraseDraft) return;
            const pt = getPct(ev);
            if (eraseDraft) {
              eraseDraft.rect.xPct = Math.min(eraseDraft.startX, pt.xPct);
              eraseDraft.rect.yPct = Math.min(eraseDraft.startY, pt.yPct);
              eraseDraft.rect.wPct = Math.max(2, Math.abs(pt.xPct - eraseDraft.startX));
              eraseDraft.rect.hPct = Math.max(1.5, Math.abs(pt.yPct - eraseDraft.startY));
              syncVisualOverlays();
              return;
            }
            if (dragTarget === 'header') simState.headerPos = { xPct: pt.xPct, yPct: pt.yPct, custom: true };
            else if (dragTarget === 'footer') simState.footerPos = { xPct: pt.xPct, yPct: pt.yPct, custom: true };
            else simState.mainPos = { xPct: pt.xPct, yPct: pt.yPct, custom: true };
            syncVisualOverlays();
          });
          const endSimPointer = () => { dragTarget = null; eraseDraft = null; };
          simStage.addEventListener('pointerup', endSimPointer);
          simStage.addEventListener('pointercancel', endSimPointer);

          const renderSimPdfPage = async (pgNo) => {
            try {
              const pdfjsLib = await ensurePdfJs();
              const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
              const safePg = Math.max(1, Math.min(pdf.numPages, Number(pgNo) || 1));
              if (pageInp) { pageInp.max = String(pdf.numPages); pageInp.value = String(safePg); }
              const pg = await pdf.getPage(safePg);
              const baseVp = pg.getViewport({ scale: 1 });
              const targetW = Math.min(540, Math.max(280, (body.clientWidth || 640) * 0.58));
              const cssScale = targetW / Math.max(1, baseVp.width);
              if (window.DangLovePDFRenderer?.renderPageToCanvas) {
                await window.DangLovePDFRenderer.renderPageToCanvas(pg, simCanvas, cssScale, { key: 'mod46-papersim-pv' });
              } else {
                const outSc = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
                const vp = pg.getViewport({ scale: cssScale });
                const cssW = Math.round(vp.width);
                const cssH = Math.round(vp.height);
                simCanvas.width = Math.round(cssW * outSc);
                simCanvas.height = Math.round(cssH * outSc);
                simCanvas.style.width = `${cssW}px`;
                simCanvas.style.height = `${cssH}px`;
                await pg.render({ canvasContext: simCanvas.getContext('2d'), viewport: vp, transform: [outSc, 0, 0, outSc, 0, 0], intent: 'display' }).promise;
              }
              syncVisualOverlays();
            } catch (_eSim) {
              simCanvas.width = 420;
              simCanvas.height = 594;
              const c = simCanvas.getContext('2d');
              c.fillStyle = '#ffffff';
              c.fillRect(0, 0, 420, 594);
              syncVisualOverlays();
            }
          };
          renderSimPdfPage(pageInp?.value || 1);
          pageInp?.addEventListener('change', () => renderSimPdfPage(pageInp.value));
        } else {
          syncVisualOverlays();
        }
      }

      body.querySelector('#btn-mod46-run-primary')?.addEventListener('click', () => {
        this.executeActiveTool();
      });

      // Tự động dựng trình XEM TRƯỚC CUỘN DỌC TỪNG TRANG sắc nét cho MỌI công cụ xử lý PDF + Preview sống 10 Theme!
      const fullHost = body.querySelector('#mod46-fullpages-preview-host');
      const firstPdf = this.files.find((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf');
      if (fullHost && firstPdf && !['annotate_edit', 'pdf_viewer_pro', 'organize'].includes(this.activeTool?.id)) {
        fullHost.classList.remove('hidden');
        fullHost.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs font-black text-sky-300">📖 Xem trước toàn bộ từng trang trong file (Cuộn dọc sắc nét)</div>
            <div class="flex items-center gap-1.5 text-[11px]">
              <span class="text-zinc-400">Nhảy tới trang:</span>
              <input id="mod46-jump-pg-inp" type="number" min="1" value="1" class="w-14 px-1.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-700 text-center font-bold text-zinc-100" />
              <span id="mod46-jump-pg-total" class="text-zinc-400 font-bold">/ ?</span>
            </div>
          </div>
          <div id="mod46-scroll-pages-box" class="max-h-[54vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 space-y-3">
            <div class="text-center text-xs text-zinc-400 py-4">⏳ Đang tải toàn bộ các trang PDF để bạn cuộn xem trực tiếp...</div>
          </div>
        `;
        (async () => {
          try {
            const pdfjsLib = await ensurePdfJs();
            const pdfDoc = await pdfjsLib.getDocument({ data: firstPdf.bytes.slice(0) }).promise;
            const totalP = pdfDoc.numPages;
            const totEl = fullHost.querySelector('#mod46-jump-pg-total');
            const jmpInp = fullHost.querySelector('#mod46-jump-pg-inp');
            const box = fullHost.querySelector('#mod46-scroll-pages-box');
            if (!box || !box.isConnected) return;
            if (totEl) totEl.textContent = `/ ${totalP}`;
            if (jmpInp) jmpInp.max = String(totalP);
            box.innerHTML = '';
            const placeholders = [];
            for (let p = 1; p <= totalP; p++) {
              const card = document.createElement('div');
              card.className = 'rounded-xl border border-zinc-800 bg-zinc-900/70 p-2 space-y-1.5';
              card.dataset.mod46PreviewPage = String(p);
              card.innerHTML = `
                <div class="flex items-center justify-between text-[11px] font-bold text-zinc-300 px-1">
                  <span>Trang ${p} / ${totalP}</span>
                  <span class="text-zinc-500">HiDPI Preview</span>
                </div>
                <div class="flex justify-center bg-zinc-950 rounded-lg overflow-hidden min-h-[160px] items-center">
                  <canvas class="max-w-full h-auto block"></canvas>
                </div>
              `;
              box.appendChild(card);
              placeholders.push(card);
            }
            const renderedSet = new Set();
            const renderPageCard = async (card) => {
              const pNum = Number(card.dataset.mod46PreviewPage);
              if (!pNum || renderedSet.has(pNum)) return;
              renderedSet.add(pNum);
              try {
                const page = await pdfDoc.getPage(pNum);
                const baseVp = page.getViewport({ scale: 1 });
                const targetW = Math.min(760, Math.max(320, (box.clientWidth || 560) - 36));
                const dpr = Math.min(2, window.devicePixelRatio || 1.5);
                const vp = page.getViewport({ scale: (targetW / baseVp.width) * dpr });
                const cv = card.querySelector('canvas');
                if (!cv) return;
                cv.width = Math.round(vp.width);
                cv.height = Math.round(vp.height);
                cv.style.width = `${Math.round(vp.width / dpr)}px`;
                cv.style.height = 'auto';
                await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
              } catch (_ePg) {}
            };
            if ('IntersectionObserver' in window) {
              const io = new IntersectionObserver(
                (entries) => {
                  entries.forEach((en) => {
                    if (en.isIntersecting) {
                      renderPageCard(en.target);
                      io.unobserve(en.target);
                    }
                  });
                },
                { root: box, rootMargin: '240px 0px' }
              );
              placeholders.forEach((c) => io.observe(c));
            } else {
              for (const c of placeholders.slice(0, 12)) await renderPageCard(c);
            }
            jmpInp?.addEventListener('change', () => {
              const idx = Math.max(1, Math.min(totalP, Number(jmpInp.value) || 1)) - 1;
              const targetCard = placeholders[idx];
              if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                renderPageCard(targetCard);
              }
            });
          } catch (_ePv) {
            if (fullHost) fullHost.classList.add('hidden');
          }
        })();
      }

      // Gắn sự kiện click trực tiếp cho 10+1 ô chọn màu Theme, Định dạng Đăng, Chèn ảnh & Live Preview cho beautify_10_themes
      if (this.activeTool?.id === 'beautify_10_themes') {
        const selEl = body.querySelector('#opt-pro-theme10-id');
        const dangLayoutChk = body.querySelector('#opt-pro-theme10-dang-layout');
        const authorCoverChk = body.querySelector('#opt-pro-theme10-author-cover');
        const fontEl = body.querySelector('#opt-pro-theme10-font');
        const coverChk = body.querySelector('#opt-pro-theme10-cover');
        const hdrModeEl = body.querySelector('#opt-pro-theme10-hdr-mode');
        const hdrSubEl = body.querySelector('#opt-pro-theme10-hdr-sub');
        const hdrTextEl = body.querySelector('#opt-pro-theme10-hdr-text');
        const hdrAlignEl = body.querySelector('#opt-pro-theme10-hdr-align');
        const ftrModeEl = body.querySelector('#opt-pro-theme10-ftr-mode');
        const ftrSubEl = body.querySelector('#opt-pro-theme10-ftr-sub');
        const ftrPresetEl = body.querySelector('#opt-pro-theme10-ftr-preset');
        const ftrAlignEl = body.querySelector('#opt-pro-theme10-ftr-align');
        const ftrTextEl = body.querySelector('#opt-pro-theme10-ftr-text');
        const imgInp = body.querySelector('#opt-pro-theme10-images');
        const imgListEl = body.querySelector('#opt-pro-theme10-images-list');
        const themes = NS.dangLovePdfPro?.REPORT_THEMES_10 || [];
        if (!Array.isArray(this.theme10ExtraImages)) this.theme10ExtraImages = [];

        const renderLiveThemeSample = () => {
          const th = themes.find((t) => t.id === selEl?.value) || themes[0];
          if (!th || !fullHost) return;
          fullHost.classList.remove('hidden');
          const rawFname = String(this.files[0]?.name || 'Bao_Cao_Cua_Ban').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
          const fname = escHtml(rawFname);
          const dateStr = new Date().toLocaleDateString('vi-VN');
          const expTok = (tpl) =>
            escHtml(
              String(tpl || '')
                .replace(/\{filename\}/gi, rawFname)
                .replace(/\{theme\}/gi, th.name)
                .replace(/\{date\}/gi, dateStr)
                .replace(/\{page\}|\{n\}/gi, '1')
                .replace(/\{total\}/gi, '12')
            );

          const hasAuthorCover = Boolean(authorCoverChk?.checked);
          const hasSysCover = Boolean(coverChk?.checked);
          const isDangLayout = Boolean(dangLayoutChk?.checked);
          const fontMap = {
            sans: '"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif',
            serif: 'Georgia, "Noto Serif SC", "Noto Serif TC", "Noto Serif JP", "Times New Roman", serif',
            classic: '"Palatino Linotype", Georgia, "Noto Serif SC", serif',
          };
          const pvFont = fontMap[fontEl?.value] || fontMap.sans;
          const hMode = hdrModeEl?.value || 'none';
          const hAlign = hdrAlignEl?.value || 'center';
          const fMode = ftrModeEl?.value || 'page_num';
          const fAlign = ftrAlignEl?.value || 'center';
          if (hdrSubEl) hdrSubEl.classList.toggle('hidden', hMode === 'none');
          if (ftrSubEl) ftrSubEl.classList.toggle('hidden', fMode === 'none');

          const cssAlign = (a) => (a === 'justify' ? 'justify' : a);
          const hdrPreviewHtml =
            hMode === 'band'
              ? `<div style="background:${th.primary};border-bottom:3px solid ${th.accent};padding:8px 16px;color:#fff;font-size:11.5px;font-weight: 700;text-align:${cssAlign(hAlign)};">${expTok(hdrTextEl?.value || '{filename}')}</div>`
              : hMode === 'minimal'
              ? `<div style="padding:8px 16px 6px;border-bottom:1.5px solid ${th.accent};color:${th.primary};font-size:11px;font-weight: 700;text-align:${cssAlign(hAlign)};">${expTok(hdrTextEl?.value || '{filename}')}</div>`
              : '';
          const ftrPreviewHtml =
            fMode !== 'none'
              ? `<div style="margin-top:8px;padding:7px 16px;border-top:1px solid #cbd5e1;color:#475569;font-size:10.5px;font-weight:700;text-align:${cssAlign(fAlign)};">${expTok(ftrTextEl?.value || 'Trang {page} / {total}')}</div>`
              : '';

          const authorCoverPreviewHtml = hasAuthorCover
            ? `<div style="background:linear-gradient(135deg,${th.primary},${th.secondary});border-bottom:4px solid ${th.accent};padding:12px 16px;color:#fff;display:flex;align-items:center;gap:12px;">
                 <img src="assets/app-icon-192.png" alt="Icon Đăng" style="width:48px;height:48px;border-radius:10px;border:2px solid #f59e0b;object-fit:cover;background:#fff;flex-shrink:0;" onerror="this.style.display='none'" />
                 <div style="min-width:0;">
                   <div style="font-size:9px;font-weight: 700;color:#5eead4;letter-spacing:0.06em;">TRANG BÌA GHI CÔNG TÁC GIẢ · ĐĂNGLOVEPDF STUDIO</div>
                   <div style="font-size:13.5px;font-weight: 700;margin-top:2px;">File được tạo bởi Mai Hải Đăng vip pro</div>
                   <div style="font-size:10px;color:rgba(255,255,255,0.85);">Tài liệu: <strong>${fname}</strong> · Web Viết Tiểu Thuyết Của Bi</div>
                 </div>
               </div>`
            : '';

          const sysCoverPreviewHtml = hasSysCover && !hasAuthorCover
            ? `<div style="background:linear-gradient(135deg,${th.primary},${th.secondary});border-left:8px solid ${th.accent};padding:12px 18px;color:#fff;border-bottom:2px dashed rgba(255,255,255,0.25);">
                 <div style="font-size:9.5px;font-weight: 700;letter-spacing:0.08em;color:${th.accent};">TRANG BÌA HỆ THỐNG (ĐÃ BẬT) · ĐĂNGLOVEPDF</div>
                 <div style="font-size:14px;font-weight: 700;margin-top:2px;">${fname.toUpperCase()}</div>
               </div>`
            : '';

          const dangTocPreviewHtml = isDangLayout
            ? `<div style="padding:8px 10px;margin-bottom:8px;border-radius:8px;border:1px solid #cbd5e1;background:#f8fafc;">
                 <div style="background:${th.primary};border-left:4px solid ${th.accent};color:#fff;padding:4px 8px;border-radius:4px;font-size:10.5px;font-weight: 700;margin-bottom:6px;">MỤC LỤC BÁO CÁO &amp; HỆ THỐNG BẢNG – BIỂU ĐỒ</div>
                 <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;color:${th.primary};border-bottom:1px solid #cbd5e1;padding-bottom:2px;margin-bottom:3px;"><span>PHẦN 1. TỔNG QUAN &amp; PHÂN TÍCH</span><span>3</span></div>
                 <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:5px;">
                   <div style="background:#fff;border:1px solid #cbd5e1;border-radius:5px;padding:4px 6px;font-size:9.5px;"><strong style="color:${th.primary};">DANH MỤC BẢNG</strong><div style="color:#334155;">Bảng 1.1: Số liệu... (4)</div></div>
                   <div style="background:#fff;border:1px solid #cbd5e1;border-radius:5px;padding:4px 6px;font-size:9.5px;"><strong style="color:${th.primary};">DANH MỤC HÌNH</strong><div style="color:#334155;">Hình 1.1: Biểu đồ... (5)</div></div>
                 </div>
               </div>`
            : '';

          const firstExtra = this.theme10ExtraImages[0];
          const extraImgPreviewHtml = firstExtra?.dataUrl
            ? `<div style="margin-top:8px;border:1px solid #cbd5e1;border-radius:6px;padding:6px;background:#fff;text-align:center;">
                 <img src="${firstExtra.dataUrl}" alt="" style="max-height:76px;margin:0 auto;border-radius:4px;object-fit:contain;" />
                 <div style="font-size:10px;font-weight:700;font-style:italic;color:${th.primary};margin-top:4px;">${escHtml(firstExtra.caption || 'Hình 1: Ảnh chèn thêm')} (${this.theme10ExtraImages.length} ảnh)</div>
               </div>`
            : '';

          fullHost.innerHTML = `
            <div class="text-xs font-black text-amber-300">🎨 Xem trước trực tiếp bố cục Theme đã chọn (${escHtml(th.name)}):</div>
            <div class="rounded-xl overflow-hidden border border-zinc-700 shadow-lg" style="background:${th.bg};color:${th.text};font-family:${pvFont};">
              ${authorCoverPreviewHtml}
              ${sysCoverPreviewHtml}
              ${hdrPreviewHtml}
              <div style="padding:12px 18px;font-size:12px;line-height:1.55;">
                ${dangTocPreviewHtml}
                <div style="background:${th.primary};border-left:5px solid ${th.accent};color:#fff;padding:7px 12px;border-radius:5px;font-weight: 700;margin-bottom:8px;">1. TIÊU ĐỀ PHẦN CHÍNH (TỰ NHẬN DIỆN TỪ FILE)</div>
                <p style="text-align:justify;margin:0 0 8px 0;">Văn bản căn đều hai bên trái–phải, lọc bỏ dòng giả (như “phần SX...”, “USD.”); bảng &amp; hình tự động vào Danh mục có link nhảy trang.</p>
                <div style="border-left:4px solid ${th.accent};padding-left:8px;font-weight: 700;font-size:11.5px;color:${th.primary};margin-bottom:4px;">Bảng 1.1: Tổng hợp dữ liệu chính</div>
                <table style="width:94%;margin:0 auto;border-collapse:collapse;font-size:11px;">
                  <thead><tr style="background:${th.primary};color:#fff;"><th style="padding:5px 8px;text-align:left;">Chỉ tiêu</th><th style="padding:5px 8px;text-align:left;">Giá trị</th></tr></thead>
                  <tbody>
                    <tr style="background:${th.zebra};"><td style="padding:5px 8px;">Nhận diện Bảng / Ảnh</td><td style="padding:5px 8px;">Chuẩn hóa lưới &amp; link /GoTo</td></tr>
                  </tbody>
                </table>
                ${extraImgPreviewHtml}
              </div>
              ${ftrPreviewHtml}
            </div>
          `;
        };

        const syncExtraImagesListDom = () => {
          if (!imgListEl) return;
          const imgs = this.theme10ExtraImages || [];
          imgListEl.innerHTML = imgs.length
            ? imgs.map((im, idx) => `
              <div class="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <img src="${im.dataUrl}" alt="" class="w-9 h-9 rounded object-cover shrink-0 border border-zinc-700" />
                <div class="flex-1 min-w-0 space-y-1">
                  <input type="text" data-theme10-img-cap="${idx}" value="${escHtml(im.caption || '')}" placeholder="Chú thích: Hình ${idx + 1}: ..." class="w-full px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-[10.5px] text-zinc-100" />
                  <select data-theme10-img-pos="${idx}" class="w-full px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-[10px] text-zinc-300">
                    <option value="end" ${im.position !== 'after_intro' ? 'selected' : ''}>Đặt cuối báo cáo / Phụ lục Hình</option>
                    <option value="after_intro" ${im.position === 'after_intro' ? 'selected' : ''}>Đặt ngay đầu nội dung (sau Mục lục)</option>
                  </select>
                </div>
                <button type="button" data-theme10-img-del="${idx}" class="px-1.5 py-1 rounded bg-rose-900/60 hover:bg-rose-600 text-rose-200 hover:text-white text-[10px] font-bold cursor-pointer">✕</button>
              </div>
            `).join('')
            : '<div class="text-[10.5px] text-zinc-500">Ảnh có sẵn trong DOCX / PDF tự động trích xuất vào Danh mục Hình; bạn có thể bấm "+ Chèn ảnh" để thêm ảnh ngoài.</div>';
          renderLiveThemeSample();
        };

        imgInp?.addEventListener('change', (ev) => {
          const filesArr = Array.from(ev.target?.files || []);
          if (!filesArr.length) return;
          filesArr.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
                const idxNext = this.theme10ExtraImages.length + 1;
                const cleanTitle = String(file.name || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
                this.theme10ExtraImages.push({
                  name: file.name,
                  dataUrl: reader.result,
                  caption: `Hình ${idxNext}: ${cleanTitle || 'Biểu đồ & Ảnh minh họa'}`,
                  position: 'end',
                });
                syncExtraImagesListDom();
              }
            };
            reader.readAsDataURL(file);
          });
          ev.target.value = '';
        });

        imgListEl?.addEventListener('input', (ev) => {
          const capIdx = ev.target?.getAttribute?.('data-theme10-img-cap');
          if (capIdx !== null && capIdx !== undefined && this.theme10ExtraImages[Number(capIdx)]) {
            this.theme10ExtraImages[Number(capIdx)].caption = ev.target.value;
            renderLiveThemeSample();
          }
        });
        imgListEl?.addEventListener('change', (ev) => {
          const posIdx = ev.target?.getAttribute?.('data-theme10-img-pos');
          if (posIdx !== null && posIdx !== undefined && this.theme10ExtraImages[Number(posIdx)]) {
            this.theme10ExtraImages[Number(posIdx)].position = ev.target.value;
            renderLiveThemeSample();
          }
        });
        imgListEl?.addEventListener('click', (ev) => {
          const delBtn = ev.target?.closest?.('[data-theme10-img-del]');
          if (!delBtn) return;
          const idx = Number(delBtn.getAttribute('data-theme10-img-del'));
          if (!Number.isNaN(idx)) {
            this.theme10ExtraImages.splice(idx, 1);
            syncExtraImagesListDom();
          }
        });

        body.querySelectorAll('[data-pro-theme10-chip]').forEach((chip) => {
          chip.addEventListener('click', () => {
            if (selEl) selEl.value = chip.getAttribute('data-pro-theme10-chip') || 'dang_signature';
            if (dangLayoutChk && selEl.value === 'dang_signature') dangLayoutChk.checked = true;
            renderLiveThemeSample();
          });
        });
        ftrPresetEl?.addEventListener('change', () => {
          if (ftrPresetEl.value !== 'custom' && ftrTextEl) {
            ftrTextEl.value = ftrPresetEl.value;
          }
          renderLiveThemeSample();
        });
        [selEl, dangLayoutChk, authorCoverChk, fontEl, coverChk, hdrModeEl, hdrAlignEl, ftrModeEl, ftrAlignEl].forEach((el) =>
          el?.addEventListener('change', renderLiveThemeSample)
        );
        [hdrTextEl, ftrTextEl].forEach((el) => el?.addEventListener('input', renderLiveThemeSample));
        renderLiveThemeSample();

        // ĐĂNGLOVEPDF 2.0 (Nhịp 4): Trình phân tích Cấu trúc, Đề xuất Gemini Vision & Trình chỉnh sửa Mục lục Tương tác
        const v2Host = body.querySelector('#mod46-v2-toc-and-vision-host');
        const primaryFile = this.files[0];
        if (v2Host && primaryFile) {
          v2Host.classList.remove('hidden');
          const geminiBridge = global.NoirGeminiBridge || NS.geminiBridge;
          const isPdfInput = /\.pdf$/i.test(primaryFile.name || '') || primaryFile.ext === 'pdf';

          const renderV2TocAndVision = (blocks, meta = {}) => {
            if (!v2Host.isConnected) return;
            this.theme10OverrideBlocks = blocks;
            const headingIndices = [];
            blocks.forEach((b, idx) => {
              if (b.type === 'heading' || b.type === 'subheading') headingIndices.push({ b, idx });
            });
            const comp = meta.complexity || blocks.__ast?.meta?.complexity || null;
            const cm = meta.confidenceMatrix || blocks.__ast?.meta?.confidenceMatrix || null;
            const suggestLandscape = Boolean(meta.suggestLandscape || blocks.__ast?.meta?.suggestLandscape);
            const curDepth = this.theme10TocDepth || 'standard';
            const curOrient = this.theme10Orient || (suggestLandscape ? 'landscape' : 'portrait');
            this.theme10Orient = curOrient;
            this.theme10TocDepth = curDepth;
            const hasKey = Boolean(geminiBridge?.hasApiKey?.());

            const confScore = cm?.overallConfidence ?? null;
            const confRec = cm?.recommendation || '';
            const confBadgeHtml = confScore !== null
              ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${confScore >= 88 ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300' : confScore >= 65 ? 'bg-amber-950/70 border border-amber-500/50 text-amber-200' : 'bg-rose-950/70 border border-rose-500/50 text-rose-200'}">🎯 Độ tin cậy mã thuần: ${confScore}%${confRec === 'CODE_READY' ? ' · Xuất đẹp ngay không cần AI' : confRec === 'AI_OPTIONAL' ? ' · Khuyên dùng AI chốt mục nhập nhằng' : ' · Nên dùng AI định vị'}</span>`
              : '';
            const profilePillsHtml = cm?.profileCounts
              ? `<div class="flex flex-wrap items-center gap-1.5 text-[10.5px] text-zinc-300">
                  <span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/80">📄 ${cm.totalPages || '?'} trang (Sạch: ${cm.profileCounts.clean || 0}${cm.profileCounts.multiCol ? ` · Nhiều cột XY-Cut: ${cm.profileCounts.multiCol}` : ''}${cm.profileCounts.hybrid ? ` · Ảnh+Chữ: ${cm.profileCounts.hybrid}` : ''}${cm.profileCounts.scanOrCorrupt ? ` · Scan/Lỗi font: ${cm.profileCounts.scanOrCorrupt}` : ''})</span>
                  ${cm.ambiguousHeadings?.length ? `<span class="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/40 text-amber-200">⚠️ ${cm.ambiguousHeadings.length} tiêu đề nhập nhằng</span>` : ''}
                  ${cm.lowConfidenceTables?.length ? `<span class="px-2 py-0.5 rounded bg-sky-950/50 border border-sky-500/40 text-sky-200">📊 ${cm.lowConfidenceTables.length} bảng cần AI tinh chỉnh</span>` : ''}
                  <span class="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/35 text-emerald-200">💾 Đã lưu AST (Đổi 10 Theme tức thì không cần quét lại)</span>
                </div>`
              : '';

            const visionCardHtml = `
              <div class="rounded-2xl border ${(comp?.recommendGeminiVision || confRec === 'AI_RECOMMENDED') ? 'border-amber-400/70 bg-amber-950/25' : 'border-cyan-500/35 bg-zinc-950/80'} p-3 space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-xs font-bold text-amber-200 flex flex-wrap items-center gap-1.5">
                    <span>🔬 Triage &amp; Đánh giá PDF: ${comp?.level === 'hard' ? '⚠️ Tài liệu khó (nhiều bảng/công thức/scan)' : comp?.level === 'medium' ? '🟡 Trung bình' : '✅ Chuẩn'}</span>
                    ${confBadgeHtml}
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <button type="button" id="btn-mod46-vision-key-pill" class="px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${hasKey ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' : 'border-zinc-700 bg-zinc-800 text-zinc-200'}">
                      ${hasKey ? '✅ API Key sẵn sàng' : '🔑 Gắn API Key'}
                    </button>
                    <button type="button" id="btn-mod46-run-gemini-vision" data-at-id="mod46-ai-fast-locator" class="px-3 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 text-white text-[11px] font-bold shadow cursor-pointer ${(comp?.recommendGeminiVision || confRec === 'AI_RECOMMENDED') ? 'animate-pulse' : ''}">
                      ⚡ AI Siêu Tốc · Định Vị Block-ID (Gemini 3.8 Flash)
                    </button>
                    <button type="button" id="btn-mod46-vision-manual-ai" data-at-id="mod46-vision-manual-ai" class="px-3 py-1 rounded-lg border border-sky-400/65 bg-sky-950/60 hover:bg-sky-800/80 text-sky-100 text-[11px] font-bold shadow cursor-pointer">
                      📋 AI Thủ công (0-Token · Block-ID)
                    </button>
                  </div>
                </div>
                ${profilePillsHtml}
                <div id="mod46-vision-status" class="text-[11px] text-cyan-300 hidden"></div>
              </div>`;

            const tocRowsHtml = headingIndices.length
              ? headingIndices.map(({ b, idx }) => `
                  <div class="flex items-center gap-1.5 py-1 border-b border-zinc-800/70 last:border-b-0">
                    <input type="checkbox" data-toc-edit-chk="${idx}" ${b.includeInToc !== false ? 'checked' : ''} class="accent-emerald-500 cursor-pointer shrink-0" title="Hiện trong Mục lục" />
                    <select data-toc-edit-lvl="${idx}" class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[11px] text-amber-300 font-bold shrink-0">
                      ${[1, 2, 3, 4].map((lv) => `<option value="${lv}" ${(b.level || (b.type === 'subheading' ? 3 : 1)) === lv ? 'selected' : ''}>Cấp ${lv}</option>`).join('')}
                    </select>
                    <input type="text" data-toc-edit-txt="${idx}" value="${escHtml(b.text || '')}" class="flex-1 min-w-0 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11.5px] text-zinc-100" />
                  </div>`).join('')
              : '<div class="text-[11px] text-zinc-400">Chưa phát hiện tiêu đề mục lục tự động (bạn có thể chọn tab Dán Văn Bản Từ AI kèm dấu # để chuẩn hóa).</div>';

            v2Host.innerHTML = `
              ${visionCardHtml}
              <div id="mod46-interactive-toc-editor" class="rounded-2xl border border-emerald-500/35 bg-zinc-950/75 p-3 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-xs font-bold text-emerald-300">🧭 Trình Chỉnh Sửa Mục Lục &amp; Khổ Giấy Tự Động (${headingIndices.filter((x) => x.b.includeInToc !== false).length}/${headingIndices.length} mục)</div>
                  <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <select id="opt-pro-theme10-toc-depth" class="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-bold">
                      <option value="compact" ${curDepth === 'compact' ? 'selected' : ''}>Mục lục: Gọn (Cấp 1–2)</option>
                      <option value="standard" ${curDepth === 'standard' ? 'selected' : ''}>Mục lục: Chuẩn (Cấp 1–3)</option>
                      <option value="exam" ${curDepth === 'exam' ? 'selected' : ''}>Mục lục: Đầy đủ / Đề thi (Cấp 1–4)</option>
                    </select>
                    <select id="opt-pro-theme10-orient" class="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-bold">
                      <option value="portrait" ${curOrient === 'portrait' ? 'selected' : ''}>📄 A4 Dọc (Portrait)</option>
                      <option value="landscape" ${curOrient === 'landscape' ? 'selected' : ''}>📐 A4 Ngang (Landscape)</option>
                    </select>
                  </div>
                </div>
                ${suggestLandscape ? '<div class="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-400/50 text-[11px] text-amber-200 font-bold">📐 Phát hiện bảng rộng (&gt; 8 cột) — hệ thống tự gợi ý khổ giấy A4 Ngang để không bị bóp cột!</div>' : ''}
                <div class="max-h-48 overflow-y-auto pr-1 space-y-0.5">${tocRowsHtml}</div>
              </div>
            `;

            v2Host.querySelector('#opt-pro-theme10-toc-depth')?.addEventListener('change', (ev) => {
              this.theme10TocDepth = ev.target.value || 'standard';
            });
            v2Host.querySelector('#opt-pro-theme10-orient')?.addEventListener('change', (ev) => {
              this.theme10Orient = ev.target.value || 'portrait';
            });
            v2Host.querySelectorAll('[data-toc-edit-chk]').forEach((chk) => {
              chk.addEventListener('change', () => {
                const bi = Number(chk.getAttribute('data-toc-edit-chk'));
                if (this.theme10OverrideBlocks?.[bi]) {
                  this.theme10OverrideBlocks[bi].includeInToc = Boolean(chk.checked);
                }
              });
            });
            v2Host.querySelectorAll('[data-toc-edit-lvl]').forEach((sel) => {
              sel.addEventListener('change', () => {
                const bi = Number(sel.getAttribute('data-toc-edit-lvl'));
                const lv = Math.min(4, Math.max(1, Number(sel.value) || 1));
                if (this.theme10OverrideBlocks?.[bi]) {
                  this.theme10OverrideBlocks[bi].level = lv;
                  this.theme10OverrideBlocks[bi].kind = lv <= 1 ? 'h1' : (lv === 2 ? 'h2' : 'h3');
                  this.theme10OverrideBlocks[bi].type = lv <= 2 ? 'heading' : 'subheading';
                }
              });
            });
            v2Host.querySelectorAll('[data-toc-edit-txt]').forEach((inp) => {
              inp.addEventListener('input', () => {
                const bi = Number(inp.getAttribute('data-toc-edit-txt'));
                if (this.theme10OverrideBlocks?.[bi]) {
                  this.theme10OverrideBlocks[bi].text = inp.value;
                }
              });
            });
            v2Host.querySelector('#btn-mod46-vision-key-pill')?.addEventListener('click', () => {
              geminiBridge?.openApiKeyQuickModal?.({ onSaved: () => renderV2TocAndVision(this.theme10OverrideBlocks, meta) });
            });
            const applyPastedBlueprintOrMd = (rawPasted) => {
              // Ưu tiên khớp JSON pdf_magic_v1 / Bản Đồ Cấu Trúc (Hợp nhất 3 tầng) lên 100% văn bản gốc do Code quét!
              const reconcileFn = geminiBridge?.reconcileAiPatchIntoBlocks || geminiBridge?.applyBlueprintToBlocks;
              if (reconcileFn && this.theme10OverrideBlocks?.length) {
                const merged = reconcileFn(this.theme10OverrideBlocks, rawPasted);
                if (merged.applied) {
                  this._theme10AnalyzedCache = { fileId: primaryFile.id, blocks: merged.blocks, ast: meta ? { meta } : null };
                  renderV2TocAndVision(merged.blocks, meta);
                  const st = merged.stats || {};
                  const truncNote = merged.parseMeta?.truncated
                    ? ` ⚠️ (JSON bị cắt cụt sau trang ${merged.parseMeta.lastCompletedPage || '?'} — đã khôi phục phần hoàn chỉnh!)`
                    : '';
                  this.toast(`✅ Hợp nhất 3 Tầng xong (${st.headingsApplied || 0} tiêu đề, xóa ${st.orphanTailsRemoved || 0} đuôi mồ côi/${st.droppedBlocks || 0} rác, ${st.tablesCaptioned || 0} bảng, nối ${st.tablesStitched || 0} bảng vắt trang, ${st.formulasFixed || 0} công thức)!${truncNote}`, merged.parseMeta?.truncated ? 'warning' : 'success', 5200);
                  return;
                }
              }
              const stitched = geminiBridge.stitchContinueTables ? geminiBridge.stitchContinueTables(rawPasted) : rawPasted;
              const parsers = global.NoirStructuredParsers || NS.structuredParsers;
              const astLib = global.NoirDocAst || NS.docAst;
              if (parsers && astLib) {
                const ast = parsers.parseMarkdownToAst(stitched, { filename: primaryFile?.name || 'ai_manual.md' });
                const blocks = astLib.astToLegacyBlocks(ast);
                this._theme10AnalyzedCache = { fileId: primaryFile.id, blocks, ast };
                renderV2TocAndVision(blocks, ast?.meta || {});
                this.toast('✅ Đã nạp nội dung cấu trúc từ Gemini Web! Bấm Áp dụng Theme để xuất PDF đẹp.', 'success', 4000);
              }
            };
            v2Host.querySelector('#btn-mod46-vision-manual-ai')?.addEventListener('click', () => {
              if (!geminiBridge) return;
              const skel = typeof geminiBridge.buildCompactSkeletonForAi === 'function'
                ? geminiBridge.buildCompactSkeletonForAi(this.theme10OverrideBlocks || [], { confidenceMatrix: cm })
                : { skeletonText: (this.theme10OverrideBlocks || []).slice(0, 140).map((b, i) => `[#${i}|P${b?.page || b?.pageNo || 1}|${b?.type || 'p'}] ${String(b?.caption || b?.text || '').slice(0, 100)}`).join('\n') };
              const promptTxt = geminiBridge.buildTaskManualPrompt('theme10_beautify', { fileName: primaryFile?.name || 'Tai_lieu.pdf', text: skel.skeletonText });
              geminiBridge.openManualAiAssistantModal?.({
                taskTitle: 'Định Vị Cấu Trúc PDF Magic v1 (Block-ID Pxx_Byy) — Thủ công 0-Token',
                promptText: promptTxt,
                attachFileName: primaryFile?.name || '',
                attachFileBlob: primaryFile?.file || (primaryFile?.bytes ? new Blob([primaryFile.bytes]) : null),
                applyBtnLabel: '✅ Hợp Nhất 3 Tầng vào 100% Văn Bản Gốc',
                onApplyPasted: applyPastedBlueprintOrMd,
              });
            });
            v2Host.querySelector('#btn-mod46-run-gemini-vision')?.addEventListener('click', async () => {
              if (!geminiBridge) return;
              const execVision = async () => {
                const stEl = v2Host.querySelector('#mod46-vision-status');
                const btnV = v2Host.querySelector('#btn-mod46-run-gemini-vision');
                try {
                  if (btnV) btnV.disabled = true;
                  const codeBlocks = this.theme10OverrideBlocks || [];
                  const codeChars = codeBlocks.reduce((acc, b) => acc + String(b?.text || '').length, 0);
                  // Kiến trúc AI-Locator + Code-Builder: nếu Code đã đọc được văn bản (>= 80 ký tự) -> AI chỉ lập Bản đồ Cấu trúc JSON!
                  if (codeChars >= 80 && typeof geminiBridge.runAiBlueprintLocator === 'function') {
                    if (stEl) { stEl.classList.remove('hidden'); stEl.textContent = '🧠 Gemini 3.8 Flash đang lập Bản đồ Cấu trúc JSON (response_schema)...'; }
                    const updatedBlocks = await geminiBridge.runAiBlueprintLocator(codeBlocks, {
                      fileBytes: isPdfInput ? primaryFile.bytes : null,
                      mimeType: isPdfInput ? 'application/pdf' : '',
                      fileName: primaryFile?.name || 'Tai_lieu',
                      onProgress: (pct, msg) => { if (stEl) stEl.textContent = `✨ [${pct}%] ${msg}`; },
                    });
                    this._theme10AnalyzedCache = { fileId: primaryFile.id, blocks: updatedBlocks, ast: meta ? { meta } : null };
                    renderV2TocAndVision(updatedBlocks, meta);
                    this.toast('✅ Gemini 3.8 Flash đã định vị chuẩn Tiêu đề/Bảng/Hình/Công thức — Code giữ 100% văn bản gốc!', 'success', 4000);
                  } else {
                    if (stEl) { stEl.classList.remove('hidden'); stEl.textContent = '⚡ Tài liệu scan ít chữ — đang gửi trực tiếp tới Gemini 3.8 Flash...'; }
                    const vRes = await geminiBridge.runGeminiVisionDeepRead(primaryFile, {
                      ensurePdfJs,
                      ensurePdfLib,
                      onProgress: (pct, msg) => {
                        if (stEl) stEl.textContent = `✨ [${pct}%] ${msg}`;
                      },
                    });
                    this._theme10AnalyzedCache = { fileId: primaryFile.id, blocks: vRes.blocks, ast: vRes.ast };
                    renderV2TocAndVision(vRes.blocks, vRes.ast?.meta || {});
                    this.toast(`✅ Gemini 3.8 Flash đã đọc sâu ${vRes.pageCount} trang & dựng lại AST sạch!`, 'success', 3600);
                  }
                } catch (err) {
                  if (stEl) { stEl.classList.remove('hidden'); stEl.textContent = '⚠️ ' + (err?.message || err); }
                  const errOv = geminiBridge.showAiFullLoadingOverlay?.('⚠️ Gemini 3.8 Flash gặp giới hạn', String(err?.message || err));
                  errOv?.showError?.('⚠️ Không thể đọc tự động qua API', String(err?.message || err), {
                    onRetry: () => execVision(),
                    manualFallback: {
                      taskTitle: 'Định Vị Cấu Trúc 10 Theme — Dán JSON/Markdown từ Gemini Web',
                      promptText: geminiBridge.buildTaskManualPrompt('theme10_beautify', { fileName: primaryFile?.name || 'Tai_lieu.pdf' }),
                      attachFileName: primaryFile?.name || '',
                      attachFileBlob: primaryFile?.file || (primaryFile?.bytes ? new Blob([primaryFile.bytes]) : null),
                      applyBtnLabel: '✅ Khớp Bản Đồ AI vào 100% Văn Bản Gốc',
                      onApplyPasted: applyPastedBlueprintOrMd,
                    },
                  });
                } finally {
                  if (btnV && btnV.isConnected) btnV.disabled = false;
                }
              };
              if (!geminiBridge.hasApiKey()) {
                geminiBridge.openApiKeyQuickModal({ onSaved: () => execVision() });
                return;
              }
              await execVision();
            });
          };

          if (this._theme10AnalyzedCache?.fileId === primaryFile.id && this._theme10AnalyzedCache.blocks) {
            renderV2TocAndVision(this._theme10AnalyzedCache.blocks, this._theme10AnalyzedCache.ast?.meta || {});
          } else if (typeof NS.dangLovePdfPro?.extractStructuredBlocksFromFile === 'function') {
            v2Host.innerHTML = '<div class="text-[11px] text-zinc-400 px-2 py-1">⏳ Đang phân tích Mục lục, Bảng biểu &amp; Công thức từ tệp...</div>';
            NS.dangLovePdfPro
              .extractStructuredBlocksFromFile(primaryFile, { ensurePdfJs, ensureJsZip, ensureXlsx })
              .then((parsedBlocks) => {
                if (!v2Host.isConnected || this.files[0]?.id !== primaryFile.id) return;
                this._theme10AnalyzedCache = { fileId: primaryFile.id, blocks: parsedBlocks, ast: parsedBlocks?.__ast };
                renderV2TocAndVision(parsedBlocks, parsedBlocks?.__ast?.meta || {});
              })
              .catch(() => {
                if (v2Host.isConnected) v2Host.classList.add('hidden');
              });
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // MÀN HÌNH 4A: ĐANG XỬ LÝ (PROGRESS BAR + NÚT HỦY)
    // ------------------------------------------------------------------------
    showProcessingView(pct, statusText) {
      const body = document.getElementById('mod46-studio-body');
      if (!body) return;
      let wrap = document.getElementById('mod46-processing-view');
      if (!wrap) {
        body.innerHTML = `
          <div id="mod46-processing-view" class="max-w-lg mx-auto py-16 text-center space-y-5">
            <div class="text-5xl animate-bounce">${this.activeTool?.icon || '⚙️'}</div>
            <div class="text-base font-black text-zinc-100">Đang xử lý ngay trên máy của bạn...</div>
            <div class="w-full h-3 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
              <div id="mod46-progress-fill" class="h-full bg-gradient-to-r from-emerald-400 to-rose-500 transition-all duration-200" style="width:0%"></div>
            </div>
            <div id="mod46-progress-text" class="text-xs font-bold text-emerald-300">Đang chuẩn bị...</div>
            <div>
              <button type="button" id="btn-mod46-cancel-job" class="px-4 py-2 rounded-xl border border-rose-500/50 bg-rose-950/50 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-extrabold cursor-pointer">✕ Hủy tác vụ</button>
            </div>
          </div>
        `;
        body.querySelector('#btn-mod46-cancel-job')?.addEventListener('click', () => {
          this.cancelled = true;
          this.toast('⏹️ Đã hủy tác vụ đang chạy.', 'info', 2000);
          this.renderUploadOrWorkspaceScreen();
        });
      }
      const fill = document.getElementById('mod46-progress-fill');
      const txt = document.getElementById('mod46-progress-text');
      if (fill) fill.style.width = `${Math.max(4, Math.min(100, Math.round(pct)))}%`;
      if (txt) txt.textContent = `${statusText} (${Math.round(pct)}%)`;
    }

    // ------------------------------------------------------------------------
    // THỰC THI TOÀN BỘ 19 CÔNG CỤ 100% CLIENT-SIDE
    // ------------------------------------------------------------------------
    async executeActiveTool() {
      const tool = this.activeTool;
      if (!tool || (!this.files.length && !tool.noFileRequired)) return;
      this.cancelled = false;
      this.revokeResultUrls();

      // Đọc toàn bộ tùy chọn từ DOM TRƯỚC khi chuyển sang màn hình Processing
      const wmLogoFile = document.getElementById('opt-wm-logo-file')?.files?.[0] || null;
      const pro = NS.dangLovePdfPro?.readProOptions ? NS.dangLovePdfPro.readProOptions() : {};
      const opts = {
        outName: document.getElementById('opt-mod46-outname')?.value?.trim() || '',
        splitMode: document.getElementById('opt-mod46-split-mode')?.value || 'range',
        splitRanges: document.getElementById('opt-mod46-split-ranges')?.value || '',
        cropL: Number(document.getElementById('opt-crop-l')?.value || 5),
        cropR: Number(document.getElementById('opt-crop-r')?.value || 5),
        cropT: Number(document.getElementById('opt-crop-t')?.value || 5),
        cropB: Number(document.getElementById('opt-crop-b')?.value || 5),
        compressLvl: document.querySelector('input[name="opt-compress-lvl"]:checked')?.value || 'medium',
        pnPos: document.getElementById('opt-pn-pos')?.value || 'bottom-center',
        pnFmt: document.getElementById('opt-pn-fmt')?.value || 'Trang {n}/{total}',
        pnFrom: Math.max(1, Number(document.getElementById('opt-pn-from')?.value || 1)),
        pnStart: Math.max(1, Number(document.getElementById('opt-pn-start')?.value || 1)),
        pnStyle: readWordStyleBar('pn', { fontSize: 13, color: '#1f2937', fontFamily: '"Times New Roman", Georgia, serif', bold: true }),
        wmText: document.getElementById('opt-wm-text')?.value?.trim() || 'BẢN QUYỀN TÁC GIẢ',
        wmStyle: readWordStyleBar('wm', { fontSize: 38, color: '#e11d48', fontFamily: '"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif', bold: true, angle: 35 }),
        wmColor: document.getElementById('opt-wm-color')?.value || '#e11d48',
        wmOpacity: Math.max(0.08, Math.min(1, Number(document.getElementById('opt-wm-opacity')?.value || 0.28))),
        wmTile: Boolean(document.getElementById('opt-wm-tile')?.checked),
        wmLogoFile,
        signPage: Math.max(1, Number(document.getElementById('opt-sign-page')?.value || 1)),
        signPos: document.getElementById('opt-sign-pos')?.value || 'bottom-right',
        signNote: document.getElementById('opt-sign-note')?.value?.trim() || '',
        signStyle: readWordStyleBar('sign', { fontSize: 14, color: '#0f172a', fontFamily: '"Times New Roman", Georgia, serif', bold: true }),
        imgFmt: document.getElementById('opt-img-fmt')?.value || 'image/jpeg',
        imgDpi: Number(document.getElementById('opt-img-dpi')?.value || 2.0),
        i2pSize: document.getElementById('opt-i2p-size')?.value || 'a4',
        i2pMargin: Number(document.getElementById('opt-i2p-margin')?.value || 24),
        docxOut: document.getElementById('opt-docx-out')?.value || 'pdf',
        p2dOut: document.getElementById('opt-p2d-out')?.value || 'docx',
        p2dAiPolish: Boolean(this._forceAiForRun),
        t2pOut: document.getElementById('opt-t2p-out')?.value || 'pdf',
        sheetOut: document.getElementById('opt-sheet-out')?.value || 'pdf',
        pptOut: document.getElementById('opt-ppt-out')?.value || 'pdf',
        ocrLang: document.getElementById('opt-ocr-lang')?.value || 'vie+eng',
        ocrAiPolish: Boolean(document.getElementById('opt-ocr-ai-polish')?.checked),
        ocrAiFastNative: Boolean(document.getElementById('opt-ocr-ai-fast-native')?.checked)
      };

      const inputTotalSize = this.files.reduce((s, f) => s + f.size, 0);
      const baseName = String(this.files[0]?.name || 'DangLovePDF').replace(/\.[^.]+$/, '');
      const prog = (pct, msg) => this.showProcessingView(pct, msg);
      prog(8, 'Đang nạp công cụ xử lý...');

      try {
        let outputs = []; // [{ name, blob }]

        // Ưu tiên kiểm tra 22+ công cụ Pro mở rộng tại mod46b_danglovepdf_pro_engines.js
        const proRes = NS.dangLovePdfPro?.executeProTool
          ? await NS.dangLovePdfPro.executeProTool(this, tool, opts, pro, {
              ensurePdfLib,
              ensurePdfJs,
              ensureJsZip,
              ensureXlsx,
              parsePageRanges,
              renderVietnameseTextToPngBytes,
              renderLinesToVietnamesePdfBlob,
              buildDocxBlobFromParagraphs,
              baseName,
              prog,
            })
          : null;

        if (Array.isArray(proRes)) {
          outputs = proRes;
        } else if (tool.id === 'merge') {
          const { PDFDocument } = await ensurePdfLib();
          const merged = await PDFDocument.create();
          for (let i = 0; i < this.files.length; i++) {
            if (this.cancelled) return;
            prog(15 + ((i + 1) / this.files.length) * 75, `Đang gộp tệp ${i + 1}/${this.files.length}...`);
            const src = await PDFDocument.load(this.files[i].bytes);
            const copied = await merged.copyPages(src, src.getPageIndices());
            copied.forEach((p) => merged.addPage(p));
          }
          const bytes = await merged.save();
          const finalName = opts.outName ? (opts.outName.endsWith('.pdf') ? opts.outName : `${opts.outName}.pdf`) : `${baseName}_DaGop.pdf`;
          outputs.push({ name: finalName, blob: new Blob([bytes], { type: 'application/pdf' }) });
        } else if (tool.id === 'split') {
          const { PDFDocument } = await ensurePdfLib();
          const src = await PDFDocument.load(this.files[0].bytes);
          const total = src.getPageCount();
          let groups = [];
          if (opts.splitMode === 'single') {
            groups = Array.from({ length: total }, (_, i) => [i]);
          } else if (opts.splitMode === 'every_n') {
            const step = Math.max(1, pro.splitEveryN || 2);
            for (let i = 0; i < total; i += step) {
              const g = [];
              for (let k = i; k < Math.min(total, i + step); k++) g.push(k);
              groups.push(g);
            }
          } else if (opts.splitMode === 'max_mb') {
            const maxBytes = Math.max(200 * 1024, (pro.splitMaxMb || 5) * 1024 * 1024);
            const avgPerPage = Math.max(1024, this.files[0].size / Math.max(1, total));
            const step = Math.max(1, Math.floor((maxBytes * 0.9) / avgPerPage));
            for (let i = 0; i < total; i += step) {
              const g = [];
              for (let k = i; k < Math.min(total, i + step); k++) g.push(k);
              groups.push(g);
            }
          } else {
            groups = parsePageRanges(opts.splitRanges, total);
          }
          for (let g = 0; g < groups.length; g++) {
            if (this.cancelled) return;
            prog(15 + ((g + 1) / groups.length) * 75, `Đang tách phần ${g + 1}/${groups.length}...`);
            const partDoc = await PDFDocument.create();
            const copied = await partDoc.copyPages(src, groups[g]);
            copied.forEach((p) => partDoc.addPage(p));
            const bytes = await partDoc.save();
            outputs.push({
              name: `${baseName}_Phan_${g + 1}.pdf`,
              blob: new Blob([bytes], { type: 'application/pdf' })
            });
          }
        } else if (tool.id === 'organize') {
          const { PDFDocument, degrees } = await ensurePdfLib();
          const src = await PDFDocument.load(this.files[0].bytes);
          const out = await PDFDocument.create();
          const activePages = this.pagesState.filter((p) => !p.isDeleted);
          for (let i = 0; i < activePages.length; i++) {
            if (this.cancelled) return;
            prog(15 + ((i + 1) / activePages.length) * 75, `Đang dựng trang ${i + 1}/${activePages.length}...`);
            const item = activePages[i];
            if (item.isBlank) {
              out.addPage([595.28, 841.89]);
            } else {
              const [copied] = await out.copyPages(src, [item.pageIndex]);
              if (item.rotation) {
                const curRot = copied.getRotation().angle || 0;
                copied.setRotation(degrees((curRot + item.rotation) % 360));
              }
              out.addPage(copied);
            }
          }
          outputs.push({ name: `${baseName}_DaSapXep.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        } else if (tool.id === 'crop') {
          const { PDFDocument } = await ensurePdfLib();
          const doc = await PDFDocument.load(this.files[0].bytes);
          const pages = doc.getPages();
          pages.forEach((pg, idx) => {
            const pageNo = idx + 1;
            if (pro.cropScope === 'odd' && pageNo % 2 === 0) return;
            if (pro.cropScope === 'even' && pageNo % 2 === 1) return;
            prog(20 + ((idx + 1) / pages.length) * 70, `Đang cắt viền trang ${pageNo}/${pages.length}...`);
            const { width, height } = pg.getSize();
            const x = width * (opts.cropL / 100);
            const y = height * (opts.cropB / 100);
            const w = Math.max(20, width * (1 - (opts.cropL + opts.cropR) / 100));
            const h = Math.max(20, height * (1 - (opts.cropT + opts.cropB) / 100));
            pg.setCropBox(x, y, w, h);
          });
          outputs.push({ name: `${baseName}_DaCatVien.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
        } else if (tool.id === 'compress') {
          const pdfjsLib = await ensurePdfJs();
          const { PDFDocument } = await ensurePdfLib();
          const scaleMap = { light: 1.45, medium: 1.05, strong: 0.72 };
          const qualMap = { light: 0.78, medium: 0.56, strong: 0.36 };
          const scale = scaleMap[opts.compressLvl] || 1.05;
          const quality = qualMap[opts.compressLvl] || 0.56;
          const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
          const outDoc = await PDFDocument.create();
          for (let i = 1; i <= pdf.numPages; i++) {
            if (this.cancelled) return;
            prog(12 + (i / pdf.numPages) * 80, `Đang nén trang ${i}/${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const baseVp = page.getViewport({ scale: 1 });
            const renderVp = page.getViewport({ scale });
            const c = document.createElement('canvas');
            c.width = renderVp.width;
            c.height = renderVp.height;
            await page.render({ canvasContext: c.getContext('2d'), viewport: renderVp }).promise;
            const jpgUrl = c.toDataURL('image/jpeg', quality);
            const bin = atob(jpgUrl.split(',')[1]);
            const jpgBytes = new Uint8Array(bin.length);
            for (let k = 0; k < bin.length; k++) jpgBytes[k] = bin.charCodeAt(k);
            const emb = await outDoc.embedJpg(jpgBytes);
            const p = outDoc.addPage([baseVp.width, baseVp.height]);
            p.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
          }
          outputs.push({ name: `${baseName}_DaNen.pdf`, blob: new Blob([await outDoc.save()], { type: 'application/pdf' }) });
        } else if (tool.id === 'page_numbers') {
          const { PDFDocument, rgb } = await ensurePdfLib();
          const doc = await PDFDocument.load(this.files[0].bytes);
          const pages = doc.getPages();
          const total = pages.length;
          const st = opts.pnStyle || {};
          const simState = this.paperSimState?.toolId === 'page_numbers' ? this.paperSimState : null;
          for (let i = 0; i < total; i++) {
            if (i + 1 < opts.pnFrom) continue;
            prog(15 + ((i + 1) / total) * 75, `Đang đánh số trang ${i + 1}/${total}...`);
            const pg = pages[i];
            const { width, height } = pg.getSize();
            // Che trắng các khung xóa số trang cũ người dùng đã khoanh trên mô phỏng trang giấy
            if (simState?.eraseRects?.length) {
              simState.eraseRects.forEach((r) => {
                const rx = (r.xPct / 100) * width;
                const rw = (r.wPct / 100) * width;
                const rh = (r.hPct / 100) * height;
                const ry = height - ((r.yPct + r.hPct) / 100) * height;
                pg.drawRectangle({ x: rx, y: Math.max(0, ry), width: rw, height: rh, color: rgb(1, 1, 1) });
              });
            }
            const nVal = opts.pnStart + (i + 1 - opts.pnFrom);
            const label = pro.batesPrefix
              ? `${pro.batesPrefix}${String(nVal).padStart(4, '0')}`
              : opts.pnFmt.replace('{n}', String(nVal)).replace('{total}', String(total));
            const rendered = renderVietnameseTextToPngBytes(label, {
              fontSize: st.fontSize || 13,
              color: st.color || '#1f2937',
              fontFamily: st.fontFamily || '"Times New Roman", Georgia, serif',
              bold: st.bold !== false,
              italic: Boolean(st.italic),
              underline: Boolean(st.underline),
              bgColor: st.bgColor || '',
              padX: 6,
              padY: 4,
            });
            const img = await doc.embedPng(rendered.bytes);
            let x = (width - rendered.widthPt) / 2;
            let y = 18;
            if (opts.pnPos === 'custom' && simState?.mainPos) {
              x = Math.max(4, Math.min(width - rendered.widthPt - 4, (simState.mainPos.xPct / 100) * width - rendered.widthPt / 2));
              y = Math.max(4, Math.min(height - rendered.heightPt - 4, height - (simState.mainPos.yPct / 100) * height - rendered.heightPt / 2));
            } else {
              if (opts.pnPos.includes('left')) x = 28;
              if (opts.pnPos.includes('right')) x = width - rendered.widthPt - 28;
              if (opts.pnPos.includes('top')) y = height - rendered.heightPt - 18;
            }
            pg.drawImage(img, { x, y, width: rendered.widthPt, height: rendered.heightPt });
          }
          outputs.push({ name: `${baseName}_DaDanhSo.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
        } else if (tool.id === 'watermark') {
          const { PDFDocument, degrees, rgb } = await ensurePdfLib();
          const doc = await PDFDocument.load(this.files[0].bytes);
          const st = opts.wmStyle || {};
          const simState = this.paperSimState?.toolId === 'watermark' ? this.paperSimState : null;
          const wmAngle = Number.isFinite(st.angle) ? st.angle : 35;
          let img = null;
          let wmW = 220;
          let wmH = 80;
          if (opts.wmLogoFile) {
            const logoBytes = new Uint8Array(await opts.wmLogoFile.arrayBuffer());
            img = /png/i.test(opts.wmLogoFile.type || opts.wmLogoFile.name) ? await doc.embedPng(logoBytes) : await doc.embedJpg(logoBytes);
            const sc = Math.min(240 / img.width, 160 / img.height);
            wmW = img.width * sc;
            wmH = img.height * sc;
          } else {
            const rendered = renderVietnameseTextToPngBytes(opts.wmText, {
              fontSize: st.fontSize || 38,
              color: st.color || opts.wmColor || '#e11d48',
              fontFamily: st.fontFamily || '"Be Vietnam Pro", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif',
              bold: st.bold !== false,
              italic: Boolean(st.italic),
              underline: Boolean(st.underline),
              padX: 14,
              padY: 10,
            });
            img = await doc.embedPng(rendered.bytes);
            wmW = rendered.widthPt;
            wmH = rendered.heightPt;
          }
          const pages = doc.getPages();
          pages.forEach((pg, idx) => {
            prog(15 + ((idx + 1) / pages.length) * 75, `Đang đóng dấu trang ${idx + 1}/${pages.length}...`);
            const { width, height } = pg.getSize();
            if (simState?.eraseRects?.length) {
              simState.eraseRects.forEach((r) => {
                pg.drawRectangle({
                  x: (r.xPct / 100) * width,
                  y: Math.max(0, height - ((r.yPct + r.hPct) / 100) * height),
                  width: (r.wPct / 100) * width,
                  height: (r.hPct / 100) * height,
                  color: rgb(1, 1, 1),
                });
              });
            }
            if (opts.wmTile) {
              for (let rx = 40; rx < width; rx += 260) {
                for (let ry = 80; ry < height; ry += 220) {
                  pg.drawImage(img, {
                    x: rx,
                    y: ry,
                    width: wmW * 0.65,
                    height: wmH * 0.65,
                    rotate: degrees(wmAngle),
                    opacity: opts.wmOpacity
                  });
                }
              }
            } else {
              const targetX = simState?.mainPos?.custom
                ? Math.max(8, Math.min(width - wmW - 8, (simState.mainPos.xPct / 100) * width - wmW / 2))
                : (width - wmW) / 2;
              const targetY = simState?.mainPos?.custom
                ? Math.max(8, Math.min(height - wmH - 8, height - (simState.mainPos.yPct / 100) * height - wmH / 2))
                : (height - wmH) / 2;
              pg.drawImage(img, {
                x: targetX,
                y: targetY,
                width: wmW,
                height: wmH,
                rotate: degrees(wmAngle),
                opacity: opts.wmOpacity
              });
            }
          });
          outputs.push({ name: `${baseName}_DaDongDau.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
        } else if (tool.id === 'sign_edit') {
          const { PDFDocument } = await ensurePdfLib();
          const doc = await PDFDocument.load(this.files[0].bytes);
          const pages = doc.getPages();
          const pgIdx = Math.max(0, Math.min(pages.length - 1, opts.signPage - 1));
          const pg = pages[pgIdx];
          const { width, height } = pg.getSize();
          prog(55, `Đang chèn chữ ký lên trang ${pgIdx + 1}...`);
          let sigW = 165;
          let sigH = 56;
          let x = width - 190;
          let y = 42;
          if (this.sigCustomPos) {
            sigW = Math.max(80, (this.sigCustomPos.wPct / 100) * width);
            sigH = Math.max(30, (this.sigCustomPos.hPct / 100) * height);
            x = (this.sigCustomPos.xPct / 100) * width;
            y = Math.max(8, height - ((this.sigCustomPos.yPct + this.sigCustomPos.hPct) / 100) * height);
          } else {
            if (opts.signPos === 'bottom-left') x = 36;
            else if (opts.signPos === 'bottom-center') x = (width - 160) / 2;
            else if (opts.signPos === 'center') { x = (width - 160) / 2; y = (height - 60) / 2; }
          }
          const activeSigUrl =
            this.signatureDataUrl ||
            (pro.signTypedName && NS.dangLovePdfPro?.renderCursiveSignaturePng
              ? NS.dangLovePdfPro.renderCursiveSignaturePng(pro.signTypedName)
              : '');
          if (activeSigUrl) {
            const bin = atob(activeSigUrl.split(',')[1]);
            const sigBytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) sigBytes[i] = bin.charCodeAt(i);
            const sigImg = await doc.embedPng(sigBytes);
            pg.drawImage(sigImg, { x, y, width: sigW, height: sigH });
          }
          if (opts.signNote) {
            const sSt = opts.signStyle || {};
            const notePng = renderVietnameseTextToPngBytes(opts.signNote, {
              fontSize: sSt.fontSize || 14,
              color: sSt.color || '#0f172a',
              fontFamily: sSt.fontFamily || '"Times New Roman", Georgia, serif',
              bold: sSt.bold !== false,
              italic: Boolean(sSt.italic),
              underline: Boolean(sSt.underline),
              bgColor: sSt.bgColor || '',
            });
            const nImg = await doc.embedPng(notePng.bytes);
            pg.drawImage(nImg, { x, y: Math.max(14, y - notePng.heightPt - 4), width: notePng.widthPt, height: notePng.heightPt });
          }
          outputs.push({ name: `${baseName}_DaKyTen.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
        } else if (tool.id === 'flatten' || tool.id === 'clean_meta') {
          const { PDFDocument } = await ensurePdfLib();
          const doc = await PDFDocument.load(this.files[0].bytes);
          prog(50, tool.id === 'flatten' ? 'Đang khóa cố định ô nhập liệu...' : 'Đang xóa thông tin ẩn & dựng lại PDF sạch...');
          try { doc.getForm().flatten(); } catch (_eFlat) {}
          if (tool.id === 'clean_meta') {
            doc.setTitle('');
            doc.setAuthor('');
            doc.setSubject('');
            doc.setCreator('ĐăngLovePDF');
            doc.setProducer('ĐăngLovePDF');
          }
          outputs.push({
            name: `${baseName}_${tool.id === 'flatten' ? 'DaKhoaForm' : 'DaLamSach'}.pdf`,
            blob: new Blob([await doc.save()], { type: 'application/pdf' })
          });
        } else if (tool.id === 'pdf_to_img' || tool.id === 'extract_images') {
          const pdfjsLib = await ensurePdfJs();
          const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
          const mime = tool.id === 'extract_images' ? 'image/png' : opts.imgFmt;
          const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
          const scale = tool.id === 'extract_images' ? 2.2 : opts.imgDpi;
          for (let i = 1; i <= pdf.numPages; i++) {
            if (this.cancelled) return;
            prog(10 + (i / pdf.numPages) * 82, `Đang xuất ảnh trang ${i}/${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale });
            const c = document.createElement('canvas');
            c.width = vp.width;
            c.height = vp.height;
            await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
            const blob = await new Promise((res) => c.toBlob(res, mime, 0.92));
            outputs.push({ name: `${baseName}_Trang_${i}.${ext}`, blob });
          }
        } else if (tool.id === 'img_to_pdf') {
          const { PDFDocument } = await ensurePdfLib();
          const outDoc = await PDFDocument.create();
          for (let i = 0; i < this.files.length; i++) {
            if (this.cancelled) return;
            prog(15 + ((i + 1) / this.files.length) * 75, `Đang ghép ảnh ${i + 1}/${this.files.length}...`);
            const f = this.files[i];
            const imgEl = await new Promise((res, rej) => {
              const im = new Image();
              im.onload = () => res(im);
              im.onerror = rej;
              im.src = this.trackUrl(f.file);
            });
            const c = document.createElement('canvas');
            c.width = imgEl.naturalWidth || imgEl.width;
            c.height = imgEl.naturalHeight || imgEl.height;
            c.getContext('2d').drawImage(imgEl, 0, 0);
            const jpgUrl = c.toDataURL('image/jpeg', 0.92);
            const bin = atob(jpgUrl.split(',')[1]);
            const jpgBytes = new Uint8Array(bin.length);
            for (let k = 0; k < bin.length; k++) jpgBytes[k] = bin.charCodeAt(k);
            const emb = await outDoc.embedJpg(jpgBytes);
            if (opts.i2pSize === 'fit') {
              const pg = outDoc.addPage([c.width, c.height]);
              pg.drawImage(emb, { x: 0, y: 0, width: c.width, height: c.height });
            } else {
              const pg = outDoc.addPage([595.28, 841.89]);
              const m = opts.i2pMargin;
              const availW = 595.28 - m * 2;
              const availH = 841.89 - m * 2;
              const sc = Math.min(availW / c.width, availH / c.height);
              const dw = c.width * sc;
              const dh = c.height * sc;
              pg.drawImage(emb, { x: (595.28 - dw) / 2, y: (841.89 - dh) / 2, width: dw, height: dh });
            }
          }
          outputs.push({ name: `${baseName}_TuAnh.pdf`, blob: new Blob([await outDoc.save()], { type: 'application/pdf' }) });
        } else if (tool.id === 'pdf_pptx') {
          if (/\.pptx$/i.test(this.files[0].name)) {
            const JSZip = await ensureJsZip();
            const z = await JSZip.loadAsync(this.files[0].bytes);
            const slideKeys = Object.keys(z.files).filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            const lines = [];
            for (let i = 0; i < slideKeys.length; i++) {
              prog(15 + ((i + 1) / Math.max(1, slideKeys.length)) * 55, `Đang đọc nội dung slide ${i + 1}/${slideKeys.length}...`);
              const xml = await z.files[slideKeys[i]].async('string');
              const texts = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)).map((m) => m[1]);
              lines.push(`# Slide ${i + 1}`, texts.join(' '), '');
            }
            if (opts.pptOut === 'txt') {
              outputs.push({ name: `${baseName}.txt`, blob: new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }) });
            } else {
              const pdfBlob = await renderLinesToVietnamesePdfBlob(baseName, lines, prog);
              outputs.push({ name: `${baseName}.pdf`, blob: pdfBlob });
            }
          } else {
            const pdfjsLib = await ensurePdfJs();
            const PptxGenJS = await ensurePptxGen();
            const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';
            for (let i = 1; i <= pdf.numPages; i++) {
              if (this.cancelled) return;
              prog(12 + (i / pdf.numPages) * 78, `Đang tạo Slide ${i}/${pdf.numPages}...`);
              const page = await pdf.getPage(i);
              const vp = page.getViewport({ scale: 1.6 });
              const c = document.createElement('canvas');
              c.width = vp.width;
              c.height = vp.height;
              await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
              const slide = pptx.addSlide();
              slide.addImage({ data: c.toDataURL('image/jpeg', 0.88), x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'contain', w: 10, h: 5.625 } });
            }
            const blob = await pptx.write({ outputType: 'blob' });
            outputs.push({ name: `${baseName}.pptx`, blob });
          }
        } else if (tool.id === 'docx_convert') {
          const mammoth = await ensureMammoth();
          prog(30, 'Đang đọc nội dung file Word...');
          if (opts.docxOut === 'txt') {
            const res = await mammoth.extractRawText({ arrayBuffer: this.files[0].bytes.buffer });
            outputs.push({ name: `${baseName}.txt`, blob: new Blob([res.value || ''], { type: 'text/plain;charset=utf-8' }) });
          } else if (opts.docxOut === 'html') {
            const res = await mammoth.convertToHtml({ arrayBuffer: this.files[0].bytes.buffer });
            const fullHtml = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${escHtml(baseName)}</title></head><body style="font-family:'Be Vietnam Pro','Noto Sans SC','Noto Sans TC','Noto Sans JP','Noto Sans KR',sans-serif;max-width:820px;margin:24px auto;line-height:1.7;">${res.value || ''}</body></html>`;
            outputs.push({ name: `${baseName}.html`, blob: new Blob([fullHtml], { type: 'text/html;charset=utf-8' }) });
          } else if (opts.docxOut === 'md') {
            const res = await mammoth.convertToHtml({ arrayBuffer: this.files[0].bytes.buffer });
            const TurndownService = await ensureTurndown();
            const md = new TurndownService().turndown(res.value || '');
            outputs.push({ name: `${baseName}.md`, blob: new Blob([md], { type: 'text/markdown;charset=utf-8' }) });
          } else {
            const res = await mammoth.extractRawText({ arrayBuffer: this.files[0].bytes.buffer });
            const lines = String(res.value || '').split(/\r?\n/);
            const pdfBlob = await renderLinesToVietnamesePdfBlob(baseName, lines, prog);
            outputs.push({ name: `${baseName}.pdf`, blob: pdfBlob });
          }
        } else if (tool.id === 'pdf_to_docx') {
          const pdfjsLib = await ensurePdfJs();
          const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
          const paragraphs = [];
          const mdLines = [];
          const jsonPages = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            if (this.cancelled) return;
            prog(12 + (i / pdf.numPages) * 75, `Đang trích chữ trang ${i}/${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const tc = await page.getTextContent();
            const pageItems = [];
            let lastY = null;
            let curLine = '';
            let curFontSize = 12;
            const flushLine = () => {
              const t = curLine.trim();
              if (!t) return;
              paragraphs.push(t);
              mdLines.push(curFontSize >= 18 ? `# ${t}` : curFontSize >= 14.5 ? `## ${t}` : t);
            };
            for (const item of tc.items) {
              const y = Math.round(item.transform?.[5] || 0);
              const x = Math.round(item.transform?.[4] || 0);
              const fSize = Math.round(Math.hypot(item.transform?.[0] || 12, item.transform?.[1] || 0));
              if (item.str.trim()) pageItems.push({ text: item.str, x, y, fontSize: fSize });
              if (lastY !== null && Math.abs(y - lastY) > 6) {
                flushLine();
                curLine = item.str;
                curFontSize = fSize;
              } else {
                curLine += (curLine && !curLine.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
                curFontSize = Math.max(curFontSize, fSize);
              }
              lastY = y;
            }
            flushLine();
            paragraphs.push('');
            mdLines.push('');
            jsonPages.push({ page: i, items: pageItems });
          }
          if (opts.p2dAiPolish && (global.NoirGeminiBridge || NS.geminiBridge)?.hasApiKey?.() && paragraphs.length) {
            try {
              prog(89, '🤖 AI đang nối câu & chuẩn hóa chính tả...');
              const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
              const sample = paragraphs.slice(0, 120).join('\n');
              const refined = await gBridge.callGeminiText(
                `Hãy chuẩn hóa chính tả, bỏ khoảng trắng thừa tách chữ, giữ nguyên cấu trúc đoạn văn sau và không tóm tắt:\n\n${sample}`,
                { temperature: 0.1, maxOutputTokens: 8192 }
              );
              if (refined && refined.trim().length > sample.length * 0.4) {
                const refLines = refined.split(/\r?\n/);
                paragraphs.splice(0, Math.min(120, paragraphs.length), ...refLines);
              }
            } catch (_eP2dAi) {}
          }
          if (opts.p2dOut === 'txt') {
            outputs.push({ name: `${baseName}.txt`, blob: new Blob([paragraphs.join('\n')], { type: 'text/plain;charset=utf-8' }) });
          } else if (opts.p2dOut === 'md') {
            outputs.push({ name: `${baseName}.md`, blob: new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' }) });
          } else if (opts.p2dOut === 'json') {
            outputs.push({ name: `${baseName}_Structured.json`, blob: new Blob([JSON.stringify({ file: this.files[0].name, pages: jsonPages }, null, 2)], { type: 'application/json;charset=utf-8' }) });
          } else {
            const docxBlob = await buildDocxBlobFromParagraphs(baseName, paragraphs);
            outputs.push({ name: `${baseName}.docx`, blob: docxBlob });
          }
        } else if (tool.id === 'text_to_pdf_docx') {
          const rawText = await this.files[0].file.text();
          let plainLines = [];
          if (/\.html?$/i.test(this.files[0].name)) {
            const tmp = document.createElement('div');
            tmp.innerHTML = rawText;
            plainLines = (tmp.innerText || tmp.textContent || '').split(/\r?\n/);
          } else if (/\.md$/i.test(this.files[0].name)) {
            await ensureMarked().catch(() => null);
            plainLines = rawText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').split(/\r?\n/);
          } else {
            plainLines = rawText.split(/\r?\n/);
          }
          if (opts.t2pOut === 'docx') {
            prog(60, 'Đang đóng gói file Word (.DOCX)...');
            const docxBlob = await buildDocxBlobFromParagraphs(baseName, plainLines);
            outputs.push({ name: `${baseName}.docx`, blob: docxBlob });
          } else {
            const pdfBlob = await renderLinesToVietnamesePdfBlob(baseName, plainLines, prog);
            outputs.push({ name: `${baseName}.pdf`, blob: pdfBlob });
          }
        } else if (tool.id === 'sheet_convert') {
          const XLSX = await ensureXlsx();
          prog(30, 'Đang đọc dữ liệu bảng tính...');
          let wb;
          if (/\.json$/i.test(this.files[0].name)) {
            const parsed = JSON.parse(await this.files[0].file.text());
            const rows = Array.isArray(parsed) ? parsed : [parsed];
            const ws = XLSX.utils.json_to_sheet(rows);
            wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          } else {
            wb = XLSX.read(this.files[0].bytes, { type: 'array' });
          }
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const rows2d = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          if (opts.sheetOut === 'xlsx') {
            const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            outputs.push({ name: `${baseName}.xlsx`, blob: new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) });
          } else if (opts.sheetOut === 'csv') {
            const csv = '\uFEFF' + XLSX.utils.sheet_to_csv(firstSheet);
            outputs.push({ name: `${baseName}.csv`, blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }) });
          } else if (opts.sheetOut === 'json') {
            const jsonArr = XLSX.utils.sheet_to_json(firstSheet);
            outputs.push({ name: `${baseName}.json`, blob: new Blob([JSON.stringify(jsonArr, null, 2)], { type: 'application/json;charset=utf-8' }) });
          } else {
            const lines = rows2d.map((r, idx) => (idx === 0 ? `# ${(r || []).join('  |  ')}` : (r || []).join('  |  ')));
            const pdfBlob = await renderLinesToVietnamesePdfBlob(baseName, lines, prog);
            outputs.push({ name: `${baseName}.pdf`, blob: pdfBlob });
          }
        } else if (tool.id === 'ocr_pdf') {
          // Nút chính "🚀 Chạy OCR 5 bước ngay" LUÔN chạy thuần Code (Smart Skip + Tiền nhận diện ảnh DSP + Tesseract + PNG 2 lớp)
          const gBridgeOcr = global.NoirGeminiBridge || NS.geminiBridge;
          const Tesseract = await ensureTesseract();
          const fullTextParts = [];
          const wantSearchablePdf = pro.ocrOutFormat === 'searchable_pdf';
          const outPdf = wantSearchablePdf ? await (await ensurePdfLib()).PDFDocument.create() : null;
          const stdFont = outPdf ? await outPdf.embedFont((await ensurePdfLib()).StandardFonts.Helvetica) : null;

          const appendSearchablePage = async (canvasEl, ocrData) => {
            if (!outPdf) return;
            const pngBytes = NS.dangLovePdfPro?.dataUrlToUint8
              ? NS.dangLovePdfPro.dataUrlToUint8(canvasEl.toDataURL('image/png'))
              : new Uint8Array();
            const emb = await outPdf.embedPng(pngBytes);
            const pw = 595.28;
            const ph = (canvasEl.height / Math.max(1, canvasEl.width)) * pw;
            const pg = outPdf.addPage([pw, ph]);
            // Lớp 1 (ẩn bên dưới): chữ ASCII/không dấu khớp tọa độ để hỗ trợ bôi đen & tìm kiếm Ctrl+F
            const words = ocrData?.words || [];
            const scaleX = pw / Math.max(1, canvasEl.width);
            const scaleY = ph / Math.max(1, canvasEl.height);
            for (const w of words) {
              const safeWord = String(w.text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '').trim();
              if (!safeWord || !w.bbox) continue;
              const bx = w.bbox.x0 * scaleX;
              const by = ph - w.bbox.y1 * scaleY;
              const bh = Math.max(6, (w.bbox.y1 - w.bbox.y0) * scaleY * 0.85);
              try {
                pg.drawText(safeWord, { x: bx, y: Math.max(2, by), size: Math.min(28, bh), font: stdFont, opacity: 0.01 });
              } catch (_eW) {}
            }
            // Lớp 2 (hiển thị phía trên): ảnh gốc PNG siêu nét không nén
            pg.drawImage(emb, { x: 0, y: 0, width: pw, height: ph });
          };

          const preprocessScanCanvas = (srcCanvas) => {
            if (!pro.ocrDenoise) return srcCanvas;
            if (typeof gBridgeOcr?.preprocessImageForOcrIcr === 'function') {
              const pre = gBridgeOcr.preprocessImageForOcrIcr(srcCanvas, { mode: 'ocr_print', deskew: true, autoCrop: false });
              if (pre?.canvas) return pre.canvas;
            }
            return srcCanvas;
          };

          if (/\.pdf$/i.test(this.files[0].name)) {
            const pdfjsLib = await ensurePdfJs();
            const pdf = await pdfjsLib.getDocument({ data: this.files[0].bytes.slice() }).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
              if (this.cancelled) return;
              const page = await pdf.getPage(i);
              let existingText = '';
              if (pro.ocrSmartSkip) {
                try {
                  const tc = await page.getTextContent();
                  existingText = tc.items.map((x) => x.str).join(' ').trim();
                } catch (_eTc) {}
              }
              if (pro.ocrSmartSkip && existingText.length >= 25 && !wantSearchablePdf) {
                prog(10 + (i / pdf.numPages) * 80, `⚡ Smart Skip trang ${i}/${pdf.numPages} (đã có lớp chữ gốc)...`);
                fullTextParts.push(`--- TRANG ${i} ---\n${existingText}`);
                continue;
              }
              prog(10 + ((i - 1) / pdf.numPages) * 80, `Đang tiền nhận diện ảnh & quét OCR trang ${i}/${pdf.numPages}...`);
              const vp = page.getViewport({ scale: 2.5 });
              const c = document.createElement('canvas');
              c.width = Math.round(vp.width);
              c.height = Math.round(vp.height);
              await page.render({ canvasContext: c.getContext('2d'), viewport: vp, intent: 'print' }).promise;
              const cleanForOcr = preprocessScanCanvas(c);
              const res = await Tesseract.recognize(cleanForOcr, opts.ocrLang);
              fullTextParts.push(`--- TRANG ${i} ---\n${res?.data?.text || ''}`);
              if (wantSearchablePdf) await appendSearchablePage(c, res?.data);
            }
          } else {
            prog(30, 'Đang tiền nhận diện ảnh & nhận diện chữ (OCR 5 bước)...');
            const im = await new Promise((resolve, reject) => {
              const el = new Image();
              el.onload = () => resolve(el);
              el.onerror = reject;
              el.src = this.trackUrl(this.files[0].file);
            });
            const c = document.createElement('canvas');
            c.width = im.naturalWidth || im.width;
            c.height = im.naturalHeight || im.height;
            c.getContext('2d').drawImage(im, 0, 0);
            const cleanForOcr = preprocessScanCanvas(c);
            const res = await Tesseract.recognize(cleanForOcr, opts.ocrLang);
            fullTextParts.push(res?.data?.text || '');
            if (wantSearchablePdf) await appendSearchablePage(c, res?.data);
          }
          let combinedText = fullTextParts.join('\n\n');
          if (opts.ocrAiPolish && gBridgeOcr?.hasApiKey?.() && combinedText.trim().length > 20) {
            try {
              prog(92, '🤖 Gemini 3.8 Flash đang hậu kiểm & sửa lỗi dấu tiếng Việt sau OCR...');
              const polished = await gBridgeOcr.callGeminiText(
                `Hãy sửa các lỗi nhận diện OCR (lỗi dấu tiếng Việt, ký tự vỡ, khoảng trắng thừa tách chữ) nhưng GIỮ NGUYÊN 100% nội dung & số liệu của văn bản sau:\n\n${combinedText.slice(0, 14000)}`,
                { temperature: 0.1, maxOutputTokens: 8192, taskType: 'doc_multimodal' }
              );
              if (polished && polished.trim().length > combinedText.slice(0, 14000).length * 0.4) {
                combinedText = polished + (combinedText.length > 14000 ? '\n\n' + combinedText.slice(14000) : '');
              }
            } catch (_eOcrAi) {}
          }
          if (wantSearchablePdf && outPdf) {
            outputs.push({ name: `${baseName}_OCR_Searchable.pdf`, blob: new Blob([await outPdf.save()], { type: 'application/pdf' }) });
          } else if (pro.ocrOutFormat === 'docx') {
            outputs.push({ name: `${baseName}_OCR.docx`, blob: await buildDocxBlobFromParagraphs(baseName, combinedText.split(/\r?\n/)) });
          } else if (pro.ocrOutFormat === 'md') {
            outputs.push({ name: `${baseName}_OCR.md`, blob: new Blob([combinedText], { type: 'text/markdown;charset=utf-8' }) });
          }
          outputs.push({ name: `${baseName}_OCR.txt`, blob: new Blob([combinedText], { type: 'text/plain;charset=utf-8' }) });
        }

        if (this.cancelled) return;

        // Đóng gói kết quả + giữ nguyên cờ báo cáo hiển thị trực tiếp (Preflight không cần tải file!)
        this.resultItems = outputs.map((o) => ({
          name: o.name,
          blob: o.blob,
          size: o.blob.size,
          url: this.trackUrl(o.blob),
          __inlineReportOnly: Boolean(o.__inlineReportOnly),
          reportTitle: o.reportTitle || '',
          reportHtml: o.reportHtml || '',
        }));
        if (this.resultItems.length >= 2) {
          prog(95, 'Đang nén gói .ZIP tải 1 lần...');
          const JSZip = await ensureJsZip();
          const z = new JSZip();
          this.resultItems.forEach((it) => z.file(it.name, it.blob));
          const zipBlob = await z.generateAsync({ type: 'blob' });
          this.resultZipItem = {
            name: `${baseName}_DangLovePDF.zip`,
            blob: zipBlob,
            size: zipBlob.size,
            url: this.trackUrl(zipBlob)
          };
        }

        prog(100, 'Hoàn tất!');
        this.renderResultScreen(inputTotalSize);
      } catch (err) {
        const msg = String(err?.message || err || 'Lỗi không xác định');
        const gBridge = global.NoirGeminiBridge || NS.geminiBridge;
        const aiManualTools = ['icr_handwriting_pdf', 'ocr_pdf', 'pdf_to_docx', 'pdf_to_excel'];
        if (gBridge && aiManualTools.includes(tool.id)) {
          this.renderUploadOrWorkspaceScreen();
          const f0 = this.files[0];
          const taskKey = tool.id === 'icr_handwriting_pdf' ? 'icr_handwriting' : (tool.id === 'ocr_pdf' ? 'ocr_fast' : tool.id);
          const promptTxt = gBridge.buildTaskManualPrompt(taskKey, { fileName: f0?.name || 'Tai_lieu', icrMode: pro.icrMode });
          const ov = gBridge.showAiFullLoadingOverlay?.('⚠️ Gemini API gặp giới hạn', msg);
          ov?.showError?.(`⚠️ Không thể chạy tự động ${tool.name}`, msg, {
            onRetry: () => this.executeActiveTool(),
            manualFallback: {
              taskTitle: `${tool.name} — Dán kết quả từ Gemini Web`,
              promptText: promptTxt,
              attachFileName: f0?.name || '',
              attachFileBlob: f0?.file || (f0?.bytes ? new Blob([f0.bytes]) : null),
              applyBtnLabel: '✅ Đóng gói kết quả & Xuất tệp ngay',
              onApplyPasted: async (pastedText) => {
                const cleanOut = String(pastedText || '').trim();
                const manualOuts = [];
                if (tool.id === 'pdf_to_excel' || (tool.id === 'icr_handwriting_pdf' && pro.icrOut === 'xlsx')) {
                  const XLSX = await ensureXlsx();
                  let rows = [];
                  try {
                    const jm = cleanOut.match(/\[[\s\S]*\]/);
                    if (jm) {
                      const p = JSON.parse(jm[0]);
                      if (Array.isArray(p) && Array.isArray(p[0])) rows = p;
                    }
                  } catch (_eJ) {}
                  if (!rows.length) {
                    rows = cleanOut.split(/\r?\n/).filter((l) => l.trim() && !/^\|?[\s:|-]+\|?$/.test(l.trim())).map((l) => (l.includes('|') ? l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()) : [l.trim()]));
                  }
                  const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [[cleanOut]]);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'KetQua_AI');
                  const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                  manualOuts.push({ name: `${baseName}_AI.xlsx`, blob: new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) });
                } else if (pro.icrOut === 'pdf') {
                  const pdfBlob = await renderLinesToVietnamesePdfBlob(`${baseName} (AI)`, cleanOut.split(/\r?\n/), () => {});
                  manualOuts.push({ name: `${baseName}_AI.pdf`, blob: pdfBlob });
                } else if (opts.p2dOut === 'md' || pro.icrOut === 'md' || pro.ocrOutFormat === 'md') {
                  manualOuts.push({ name: `${baseName}_AI.md`, blob: new Blob([cleanOut], { type: 'text/markdown;charset=utf-8' }) });
                } else if (opts.p2dOut === 'txt' || pro.icrOut === 'txt' || pro.ocrOutFormat === 'txt') {
                  manualOuts.push({ name: `${baseName}_AI.txt`, blob: new Blob([cleanOut], { type: 'text/plain;charset=utf-8' }) });
                } else {
                  const docxBlob = await buildDocxBlobFromParagraphs(`${baseName}_AI`, cleanOut.split(/\r?\n/));
                  manualOuts.push({ name: `${baseName}_AI.docx`, blob: docxBlob });
                }
                this.resultItems = manualOuts.map((o) => ({ name: o.name, blob: o.blob, size: o.blob.size, url: this.trackUrl(o.blob) }));
                this.resultZipItem = null;
                this.renderResultScreen(inputTotalSize);
              },
            },
          });
          return;
        }
        this.toast(`❌ Có lỗi khi xử lý: ${msg}`, 'error', 4500);
        this.renderUploadOrWorkspaceScreen();
      }
    }

    // ------------------------------------------------------------------------
    // MÀN HÌNH 4B: HOÀN TẤT, TẢI XUỐNG, XEM TRƯỚC & CHUYỂN TIẾP CÔNG CỤ
    // ------------------------------------------------------------------------
    renderResultScreen(inputTotalSize) {
      const body = document.getElementById('mod46-studio-body');
      if (!body) return;
      const primary = this.resultZipItem || this.resultItems[0];
      if (!primary) return;

      // Chế độ hiển thị kết quả kiểm định trực tiếp trên màn hình (Preflight — KHÔNG bắt tải file về!)
      if (this.resultItems.length === 1 && this.resultItems[0].__inlineReportOnly) {
        const rep = this.resultItems[0];
        body.innerHTML = `
          <div class="max-w-4xl mx-auto py-3 space-y-4">
            <div class="rounded-3xl border-2 border-amber-400/60 bg-zinc-900/95 p-5 space-y-4 shadow-2xl">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <h3 class="text-base sm:text-lg font-black text-amber-300">${escHtml(rep.reportTitle || '🔬 Kết quả Kiểm tra Kỹ thuật Trước Khi In')}</h3>
                <div class="flex items-center gap-2">
                  <button type="button" id="btn-mod46-do-another" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer">🔄 Kiểm tra tệp khác</button>
                </div>
              </div>
              ${rep.reportHtml}
            </div>
          </div>`;
        body.querySelector('#btn-mod46-do-another')?.addEventListener('click', () => {
          this.resetWorkspaceState();
          this.renderUploadOrWorkspaceScreen();
        });
        NS.i18n?.translateElement?.(body);
        return;
      }

      const canPreviewPrimary =
        this.resultItems.length === 1 &&
        /\.(pdf|html?|txt|md|json|csv|png|jpe?g|webp)$/i.test(this.resultItems[0].name);
      const isSinglePdf = this.resultItems.length === 1 && /\.pdf$/i.test(this.resultItems[0].name);
      const savedPct =
        this.activeTool?.id === 'compress' && inputTotalSize > 0
          ? Math.round(((inputTotalSize - primary.size) / inputTotalSize) * 100)
          : null;

      const chainTools = getActiveAllTools().filter((t) => t.accept.includes('.pdf') && !t.noFileRequired && t.id !== this.activeTool?.id);

      body.innerHTML = `
        <div class="max-w-2xl mx-auto py-4 space-y-4">
          <div class="rounded-3xl border-2 border-emerald-500/50 bg-zinc-900/90 p-6 text-center space-y-4 shadow-2xl">
            <div class="text-5xl">🎉</div>
            <div>
              <h3 class="text-lg font-black text-emerald-300">Xử lý hoàn tất 100% trên máy!</h3>
              <p class="text-xs text-zinc-300 mt-1 font-bold">${escHtml(primary.name)} · ${formatBytes(primary.size)}</p>
              ${savedPct !== null ? `<div class="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black">${savedPct >= 0 ? `Đã giảm ${savedPct}%` : 'Đã tối ưu'} (${formatBytes(inputTotalSize)} → ${formatBytes(primary.size)})</div>` : ''}
              ${this.lastPreFlightReport && this.activeTool?.id === 'beautify_10_themes' ? `
                <div id="mod46-preflight-badge" class="mt-2.5 mx-auto max-w-lg px-3 py-2 rounded-xl border ${this.lastPreFlightReport.ok ? 'border-emerald-500/45 bg-emerald-950/35 text-emerald-200' : 'border-amber-500/50 bg-amber-950/35 text-amber-200'} text-[11px] font-bold leading-relaxed">
                  🛡️ ${escHtml(this.lastPreFlightReport.summaryLine || '')}
                </div>` : ''}
            </div>

            <div class="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <a href="${primary.url}" download="${escHtml(primary.name)}" class="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl transition">
                ⬇️ ${this.resultZipItem ? 'Tải tất cả (.ZIP)' : 'Tải xuống tệp ngay'}
              </a>
              ${canPreviewPrimary ? `<button type="button" id="btn-mod46-preview-result" class="px-4 py-3 rounded-2xl border border-sky-400/60 bg-sky-500/15 hover:bg-sky-500/30 text-sky-200 font-extrabold text-xs cursor-pointer">👁️ ${isSinglePdf ? 'Xem trước PDF' : 'Xem trước kết quả'}</button>` : ''}
              <button type="button" id="btn-mod46-do-another" class="px-4 py-3 rounded-2xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-xs cursor-pointer">🔄 Làm tệp mới</button>
            </div>

            ${isSinglePdf ? `
              <div class="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span class="text-zinc-400 font-bold">✨ Tiếp tục xử lý tệp này với:</span>
                <select id="sel-mod46-chain-tool" class="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 font-bold">
                  ${chainTools.map((ct) => `<option value="${ct.id}">${ct.icon} ${escHtml(ct.name)}</option>`).join('')}
                </select>
                <button type="button" id="btn-mod46-chain-go" class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold cursor-pointer">Đi tới →</button>
              </div>` : ''}
          </div>

          ${this.resultItems.length > 1 ? `
            <div class="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 space-y-2">
              <div class="text-xs font-extrabold text-zinc-300">📂 Hoặc xem trước / tải lẻ từng tệp (${this.resultItems.length} tệp):</div>
              <div class="max-h-56 overflow-y-auto space-y-1.5">
                ${this.resultItems
                  .map(
                    (it, idx) => `
                  <div class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                    <span class="truncate text-zinc-200 font-semibold">${escHtml(it.name)} <span class="text-zinc-500">(${formatBytes(it.size)})</span></span>
                    <div class="flex items-center gap-1.5 shrink-0">
                      ${/\.(pdf|html?|txt|md|json|csv|png|jpe?g|webp)$/i.test(it.name) ? `<button type="button" data-mod46-preview-idx="${idx}" class="px-2 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-600 text-sky-100 font-bold cursor-pointer">👁️ Xem</button>` : ''}
                      <a href="${it.url}" download="${escHtml(it.name)}" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-100 font-bold">⬇️ Tải</a>
                    </div>
                  </div>`
                  )
                  .join('')}
              </div>
            </div>` : ''}
        </div>
      `;

      body.querySelector('#btn-mod46-do-another')?.addEventListener('click', () => {
        this.resetWorkspaceState();
        this.renderUploadOrWorkspaceScreen();
      });
      body.querySelector('#btn-mod46-preview-result')?.addEventListener('click', () => {
        const resItem = this.resultItems[0];
        if (resItem) this.openInteractiveResultPreview(resItem);
      });
      body.querySelectorAll('[data-mod46-preview-idx]').forEach((b) => {
        b.addEventListener('click', () => {
          const item = this.resultItems[Number(b.getAttribute('data-mod46-preview-idx'))];
          if (item) this.openInteractiveResultPreview(item);
        });
      });
      body.querySelector('#btn-mod46-chain-go')?.addEventListener('click', () => {
        const nextId = body.querySelector('#sel-mod46-chain-tool')?.value;
        const nextTool = getActiveAllTools().find((t) => t.id === nextId);
        const curItem = this.resultItems[0];
        if (!nextTool || !curItem) return;
        const nextFile = new File([curItem.blob], curItem.name, { type: curItem.blob.type || 'application/pdf' });
        this.selectTool(nextTool, nextFile);
      });
    }

    // ------------------------------------------------------------------------
    // TRÌNH XEM TRƯỚC TƯƠNG TÁC PDF.JS CANVAS (CHẠY MƯỢT 100% DESKTOP & MOBILE)
    // Không phụ thuộc <iframe> PDF plugin hay cài đặt trình duyệt!
    // ------------------------------------------------------------------------
    async openInteractiveResultPreview(resItem) {
      const isPdf = /\.pdf$/i.test(resItem.name) || resItem.blob?.type === 'application/pdf';
      // Ưu tiên dùng Pro 4-Layer PDF Viewer (Mod 46C: Thumbnails + Bookmarks + Text Selection + Ctrl+F Regex + 2-Page Spread + Dark Mode!)
      if (isPdf && NS.dangLovePdfStudioPro?.openProPdfViewer) {
        return NS.dangLovePdfStudioPro.openProPdfViewer(resItem, ensurePdfJs);
      }
      document.getElementById('modal-mod46-interactive-preview')?.remove();
      const pv = document.createElement('div');
      pv.id = 'modal-mod46-interactive-preview';
      pv.className = 'fixed inset-0 z-[2147483625] bg-zinc-950/95 backdrop-blur-md flex flex-col p-2.5 sm:p-4 text-zinc-100';
      pv.setAttribute('role', 'dialog');
      pv.setAttribute('aria-modal', 'true');

      const isHtml = /\.html?$/i.test(resItem.name);
      const isImg = /\.(png|jpe?g|webp|gif|bmp)$/i.test(resItem.name);

      pv.setAttribute('role', 'dialog');
      pv.setAttribute('aria-modal', 'true');
      pv.setAttribute('data-at-id', 'mod46-result-preview-modal');
      pv.innerHTML = `
        <div class="flex flex-col gap-2 pb-2.5 border-b border-zinc-800 shrink-0 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 w-full min-w-0">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-sm sm:text-base font-bold text-sky-300 truncate">👁️ Xem trước: ${escHtml(resItem.name)}</span>
              <span id="mod46-pv-meta" class="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10.5px] font-bold shrink-0">${formatBytes(resItem.size)}</span>
            </div>
            <button type="button" id="btn-mod46-pv-close" data-at-id="mod46-preview-close" data-at-expect="closes:#mod46-result-preview-modal" aria-label="Đóng xem trước" class="px-3 py-1.5 min-h-[36px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap">✕ Đóng</button>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap w-full min-w-0">
            ${isPdf ? `
              <button type="button" id="btn-mod46-pv-prev" class="px-2.5 py-1.5 min-h-[34px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer">◀ Trước</button>
              <span id="mod46-pv-page-info" class="px-2 py-1 text-xs font-bold text-amber-300">Đang dựng...</span>
              <button type="button" id="btn-mod46-pv-next" class="px-2.5 py-1.5 min-h-[34px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer">Sau ▶</button>
            ` : ''}
            <div class="inline-flex items-center gap-1 bg-zinc-900/90 border border-zinc-700 rounded-xl px-1.5 py-0.5">
              <button type="button" id="btn-mod46-pv-zoom-out" aria-label="Thu nhỏ" class="px-2 py-1 min-h-[30px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer" title="Thu nhỏ (-15%)">➖</button>
              <input id="inp-mod46-pv-zoom-pct" list="mod46-pv-zoom-presets" type="number" min="25" max="400" step="5" value="100" aria-label="Tỷ lệ phóng to (%)" class="w-14 px-1.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-center text-xs font-bold text-emerald-300" title="Nhập hoặc chọn % phóng to (25% – 400%)" />
              <span class="text-[11px] font-bold text-zinc-400">%</span>
              <datalist id="mod46-pv-zoom-presets">
                <option value="50"></option><option value="75"></option><option value="100"></option><option value="125"></option><option value="150"></option><option value="200"></option><option value="250"></option><option value="300"></option>
              </datalist>
              <select id="sel-mod46-pv-zoom-preset" aria-label="Chọn nhanh % phóng to" class="px-1.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-[11px] font-bold text-zinc-200 cursor-pointer">
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100" selected>100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
                <option value="200">200%</option>
                <option value="250">250%</option>
                <option value="300">300%</option>
              </select>
              <button type="button" id="btn-mod46-pv-zoom-in" aria-label="Phóng to" class="px-2 py-1 min-h-[30px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer" title="Phóng to (+15%)">➕</button>
            </div>
            <a href="${resItem.url}" download="${escHtml(resItem.name)}" data-at-id="mod46-preview-download" data-at-expect="download:file" class="ml-auto px-3 py-1.5 min-h-[36px] inline-flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap">⬇️ Tải</a>
          </div>
        </div>
        <div id="mod46-pv-stage" class="flex-1 min-h-0 overflow-auto py-4 px-2 flex flex-col items-center gap-4 bg-zinc-900/70 rounded-2xl mt-2 border border-zinc-800">
          <div class="py-12 text-sm font-bold text-sky-300 animate-pulse">⏳ Đang dựng hình xem trước sắc nét ngay trên máy...</div>
        </div>
      `;
      document.body.appendChild(pv);
      try { NS.i18n?.translateElement?.(pv); } catch (_eTrPv) {}

      let pdfDoc = null;
      const closePreview = () => {
        pv.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0; });
        pv.querySelectorAll('img').forEach((im) => { im.removeAttribute('src'); });
        try { pdfDoc?.destroy?.(); } catch (_e) {}
        pdfDoc = null;
        pv.remove();
      };
      pv.querySelector('#btn-mod46-pv-close')?.addEventListener('click', closePreview);

      const stage = pv.querySelector('#mod46-pv-stage');
      if (!stage) return;

      let zoomFactor = 1.0;
      const zoomInp = pv.querySelector('#inp-mod46-pv-zoom-pct');
      const zoomSel = pv.querySelector('#sel-mod46-pv-zoom-preset');
      let onZoomChanged = () => {};
      const setZoomPercent = (pct) => {
        const clamped = Math.max(25, Math.min(400, Math.round(Number(pct) || 100)));
        zoomFactor = Number((clamped / 100).toFixed(2));
        if (zoomInp) zoomInp.value = String(clamped);
        if (zoomSel && Array.from(zoomSel.options).some((o) => Number(o.value) === clamped)) {
          zoomSel.value = String(clamped);
        }
        onZoomChanged(zoomFactor, clamped);
      };
      pv.querySelector('#btn-mod46-pv-zoom-out')?.addEventListener('click', () => setZoomPercent(Math.round(zoomFactor * 100) - 15));
      pv.querySelector('#btn-mod46-pv-zoom-in')?.addEventListener('click', () => setZoomPercent(Math.round(zoomFactor * 100) + 15));
      zoomInp?.addEventListener('change', () => setZoomPercent(zoomInp.value));
      zoomInp?.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') setZoomPercent(zoomInp.value); });
      zoomSel?.addEventListener('change', () => setZoomPercent(zoomSel.value));

      try {
        if (isImg) {
          stage.innerHTML = `<img id="mod46-pv-img-el" src="${resItem.url}" alt="${escHtml(resItem.name)}" class="rounded-xl shadow-2xl border border-zinc-700 bg-white block transition-all" style="width:min(100%, 820px);height:auto;" />`;
          onZoomChanged = (zf) => {
            const im = stage.querySelector('#mod46-pv-img-el');
            if (im) im.style.width = `${Math.round(Math.min(stage.clientWidth - 28, 820) * zf)}px`;
          };
          return;
        }
        if (isHtml) {
          const htmlText = await resItem.blob.text();
          stage.innerHTML = `<iframe id="mod46-pv-html-frame" class="w-full h-full min-h-[70vh] rounded-xl border border-zinc-700 bg-white" style="transform-origin:top center;"></iframe>`;
          const ifr = stage.querySelector('#mod46-pv-html-frame');
          if (ifr) ifr.srcdoc = htmlText;
          onZoomChanged = (zf) => {
            if (ifr) {
              ifr.style.transform = `scale(${zf})`;
              ifr.style.width = `${Math.round(100 / Math.max(0.5, zf))}%`;
            }
          };
          return;
        }
        if (!isPdf) {
          const txt = await resItem.blob.text();
          stage.innerHTML = `<pre id="mod46-pv-pre-el" class="w-full max-w-4xl p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 whitespace-pre-wrap break-words font-mono">${escHtml(txt.slice(0, 60000))}</pre>`;
          onZoomChanged = (zf) => {
            const pre = stage.querySelector('#mod46-pv-pre-el');
            if (pre) pre.style.fontSize = `${Math.round(12 * zf)}px`;
          };
          return;
        }

        // PDF: Dựng bằng PDF.js Canvas trực tiếp (KHÔNG dùng iframe blob hay bị trắng trang trên Mobile/Edge!)
        const pdfjsLib = await ensurePdfJs();
        const bytes = new Uint8Array(await resItem.blob.arrayBuffer());
        pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
        const totalPages = pdfDoc.numPages;
        let currentPage = 1;

        const pageInfoEl = pv.querySelector('#mod46-pv-page-info');
        const prevBtn = pv.querySelector('#btn-mod46-pv-prev');
        const nextBtn = pv.querySelector('#btn-mod46-pv-next');

        const renderPage = async (pageNo) => {
          if (!pdfDoc || !pv.isConnected) return;
          currentPage = Math.max(1, Math.min(totalPages, pageNo));
          if (pageInfoEl) pageInfoEl.textContent = `Trang ${currentPage} / ${totalPages}`;
          if (prevBtn) prevBtn.disabled = currentPage <= 1;
          if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

          const page = await pdfDoc.getPage(currentPage);
          const baseVp = page.getViewport({ scale: 1 });
          const availW = Math.max(280, Math.min(stage.clientWidth - 28, 960));
          const fitScale = availW / Math.max(1, baseVp.width);
          const outSc = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
          const renderScale = Math.max(0.35, Math.min(4.0, fitScale * zoomFactor));

          stage.innerHTML = '';
          const canvas = document.createElement('canvas');
          canvas.id = 'mod46-preview-pdf-canvas';
          canvas.className = 'rounded-xl shadow-2xl border border-zinc-700 bg-white block';
          stage.appendChild(canvas);

          if (window.DangLovePDFRenderer?.renderPageToCanvas) {
            await window.DangLovePDFRenderer.renderPageToCanvas(page, canvas, renderScale, { key: 'mod46-fallback-pv' });
          } else {
            const vp = page.getViewport({ scale: renderScale });
            const cssW = Math.round(vp.width);
            const cssH = Math.round(vp.height);
            canvas.width = Math.round(cssW * outSc);
            canvas.height = Math.round(cssH * outSc);
            canvas.style.width = `${cssW}px`;
            canvas.style.height = `${cssH}px`;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport: vp, transform: [outSc, 0, 0, outSc, 0, 0], intent: 'display' }).promise;
          }
        };

        prevBtn?.addEventListener('click', () => renderPage(currentPage - 1));
        nextBtn?.addEventListener('click', () => renderPage(currentPage + 1));
        onZoomChanged = () => renderPage(currentPage);

        await renderPage(1);
      } catch (err) {
        stage.innerHTML = `
          <div class="p-6 text-center space-y-3 max-w-md">
            <div class="text-3xl">⚠️</div>
            <div class="text-sm font-bold text-rose-300">Không dựng được xem trước trực tiếp: ${escHtml(err?.message || err)}</div>
            <a href="${resItem.url}" target="_blank" rel="noopener" class="inline-block px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-black">↗️ Mở trong tab mới</a>
          </div>
        `;
      }
    }

    // ------------------------------------------------------------------------
    // NÂNG CẤP NÚT TAB 6 (CÓ ICON MEME) + NÚT VÀO NHANH DƯỚI CHẾ ĐỘ KHÁCH
    // ------------------------------------------------------------------------
    upgradeExportPdfButton() {
      const btn = document.getElementById('btn-tab6-top-export-pdf');
      if (btn) {
        btn.classList.add('noir-danglovepdf-glow-btn');
        btn.innerHTML = `<span class="inline-flex items-center gap-1.5"><img src="assets/app-icon-192.png" alt="" class="w-5 h-5 rounded-md object-cover border border-white/80 shrink-0" /><span>Xuất truyện qua PDF &amp; ĐăngLovePDF</span></span>`;
        btn.title = 'Chọn Xuất truyện đã viết qua PDF hoặc dùng bộ 41 công cụ ĐăngLovePDF (100% trên máy)';
      }

      if (!document.__mod46PdfChooserCaptureBound) {
        document.__mod46PdfChooserCaptureBound = true;
        document.addEventListener('click', (ev) => {
          const hit = ev.target?.closest?.('#btn-tab6-top-export-pdf');
          if (hit) {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            this.openTwoChoiceChooserModal();
            return;
          }
          // Nút "ĐăngLovePDF ( ͡° ͜ʖ ͡°)" ngay dưới nút Chế Độ Khách -> vào thẳng Guest Mode & mở Hub ĐăngLovePDF!
          const quickGateBtn = ev.target?.closest?.('#btn-gate-quick-danglovepdf');
          if (quickGateBtn) {
            ev.preventDefault();
            ev.stopPropagation();
            this.openQuickInGuestMode();
          }
        }, true);
      }
    }

    openQuickInGuestMode() {
      try {
        if (NS.guestMode?.enterGuestMode) {
          NS.guestMode.enterGuestMode({
            targetScreen: 'SCREEN_6_SYSTEM',
            skipDefaultTab5: true,
            customToast: '❤️ Đã vào Chế Độ Khách và mở ngay ĐăngLovePDF (41 công cụ 100% nội bộ)!',
          });
        } else {
          document.getElementById('btn-gate-enter-guest-mode')?.click();
        }
      } catch (_e) {}
      setTimeout(() => {
        this.openDangLovePdfStudio();
      }, 120);
    }

    init() {
      if (this._initialized) return this;
      this._initialized = true;
      this.injectStylesOnce();
      this.upgradeExportPdfButton();
      setTimeout(() => this.upgradeExportPdfButton(), 900);
      return this;
    }
  }

  const dangLovePdf = new DangLovePdfStudioController();
  NS.dangLovePdf = dangLovePdf;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => dangLovePdf.init());
    } else {
      dangLovePdf.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
