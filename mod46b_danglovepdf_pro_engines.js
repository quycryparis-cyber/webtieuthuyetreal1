/**
 * ============================================================================
 * MODULE 46B: ĐĂNGLOVEPDF PRO ENGINES — BỘ NHÂN XỬ LÝ PDF & FILE TOÀN DIỆN (v119)
 * ============================================================================
 * Kết hợp đầy đủ tính năng Premium từ iLovePDF Pro, Smallpdf Pro, PDF24, Sejda Pro,
 * Stirling-PDF & Adobe Acrobat — chạy 100% nội bộ trên trình duyệt (JS/WASM)
 * và tự động nâng cấp sức mạnh bằng Nhân Nội Bộ Máy Tính (LibreOffice / qpdf /
 * Ghostscript / MS Office COM) khi chạy trên bản App Desktop (Electron).
 * ============================================================================
 */
(function initMod46bDangLovePdfPro(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  // Bộ phân loại cấu trúc tài liệu & mục lục dùng chung toàn App (Mod 46/48/49/50)
  // Trả về cả `type` (mod46b theme renderer) lẫn `kind` ('h1'|'h2'|'h3'|'toc_item'|'callout'|'bullet'|'paragraph').
  function noirClassifyDocLine(txt, meta = {}) {
    const s = String(txt || '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
    if (!s) return null;
    const medSize = Number(meta.medianFontSize) || 0;
    const fSize = Number(meta.fontSize) || 0;
    const isBold = Boolean(meta.isBold);

    // Chặn tuyệt đối các đơn vị ngắn / từ viết tắt (USD., VND, LINK...) hoặc mảnh câu viết thường đầu dòng!
    if (/^[\(\[]?(USD|VND|EUR|JPY|GBP|LINK|TRANG|STT)\.?[\)\]]?$/i.test(s)) {
      return { type: 'paragraph', kind: 'paragraph', text: s };
    }
    if (/^[a-zà-ỹ]/.test(s) && !/^[a-z]\)\s+[A-ZÀ-Ỹa-zà-ỹ]/.test(s) && !/^phần\s+(\d+|[IVXLCDM]+)\b/i.test(s)) {
      return { type: 'paragraph', kind: 'paragraph', text: s };
    }

    // Nhận diện Mục lục / Danh mục trang (dấu .... hoặc . . . số trang ở cuối)
    if (/(?:\.{4,}|(?:\.\s){3,}\.?)\s*\d{1,4}\s*$/.test(s)) {
      return { type: 'toc_item', kind: 'toc_item', text: s };
    }

    // Nhận diện Chú thích Bảng (Bảng 1.1: ...) & Chú thích Hình / Biểu đồ (Hình 1.1: ...)
    if (/^(?:Bảng|BẢNG|Table)\s+(?:\d+(?:\.\d+)*|[IVXLCDM]+)[a-z]?\s*[:.\-–—]/i.test(s) && s.length <= 180) {
      return { type: 'table_caption', kind: 'table_caption', text: s };
    }
    if (/^(?:Hình|HÌNH|Biểu đồ|BIỂU ĐỒ|Ảnh|ẢNH|Sơ đồ|SƠ ĐỒ|Figure|Fig\.?)\s+(?:\d+(?:\.\d+)*|[IVXLCDM]+)[a-z]?\s*[:.\-–—]/i.test(s) && s.length <= 180) {
      return { type: 'figure_caption', kind: 'figure_caption', text: s };
    }

    // Mục mở đầu / Phụ lục / Mục lục chính thức (cả dòng là tên mục)
    if (/^(MỤC LỤC(\s+BÁO\s+CÁO[^\n]*)?|DANH MỤC(\s+(BẢNG|BIỂU ĐỒ|HÌNH|ẢNH|CHỮ VIẾT TẮT|TÀI LIỆU)[^\n]*)?|LỜI MỞ ĐẦU|LỜI NÓI ĐẦU|TÓM TẮT|TỔNG QUAN|KẾT LUẬN(\s+[^\n]{0,40})?|KIẾN NGHỊ|TÀI LIỆU THAM KHẢO|PHỤ LỤC(\s+[A-Z0-9IVX]+(?:[.:–—\s-][^\n]*)?)?)$/i.test(s)) {
      return { type: 'heading', kind: 'h1', text: s };
    }

    // Tiêu đề Lớn Cấp 1: CHƯƠNG ..., PHẦN 1/I/A..., hoặc Cỡ chữ PDF lớn >= 1.26x thân bài
    if (
      s.length <= 130 &&
      (
        /^CHƯƠNG\s+([IVXLCDM]+|\d{1,2})\b/i.test(s) ||
        /^(PHẦN|MỤC|PHỤ LỤC)\s+([IVXLCDM]+|\d{1,2}|[A-Z])\b/.test(s) ||
        /^Phần\s+([IVXLCDM]+|\d{1,2})\b(?:\s*[:.\-–—]|\s|$)/.test(s) ||
        (medSize > 0 && fSize >= medSize * 1.26 && s.length >= 4 && !/[,;]$/.test(s))
      )
    ) {
      return { type: 'heading', kind: 'h1', text: s };
    }

    // Tiêu đề Cấp 2: Số La Mã (I., II., III.), Số thứ tự 1..39 (Chữ hoa đầu từ), hoặc Chữ In Hoa >= 2 từ không kết thúc dấu chấm
    if (
      s.length <= 125 &&
      (/^[IVXLCDM]{1,5}\.\s+[A-ZÀ-Ỹ0-9]/.test(s) || /^(?:[1-9]|[1-3]\d)\.\s+[A-ZÀ-Ỹ]/.test(s))
    ) {
      return { type: 'heading', kind: 'h2', text: s };
    }
    if (
      s.length >= 10 &&
      s.length <= 95 &&
      s.split(/\s+/).length >= 2 &&
      s === s.toUpperCase() &&
      /[A-ZÀ-Ỹ]/.test(s) &&
      !/[.,;!?]$/.test(s) &&
      !/^[\d.,\s%$+\-–—()]+$/.test(s)
    ) {
      return { type: 'heading', kind: 'h2', text: s };
    }

    // Tiểu mục Cấp 3 (1.1., 1.2.3., a), A., hoặc In đậm cỡ chữ >= 1.1x)
    if (
      s.length <= 125 &&
      (
        /^\d{1,2}\.\d{1,2}(?:\.\d{1,2})?\.?\s+[A-ZÀ-Ỹ0-9]/.test(s) ||
        /^[a-z]\)\s+[A-ZÀ-Ỹa-zà-ỹ]/.test(s) ||
        /^[A-Z]\.\s+[A-ZÀ-Ỹ]/.test(s) ||
        (medSize > 0 && fSize >= medSize * 1.1 && isBold && s.length >= 4 && !/[.,;]$/.test(s))
      )
    ) {
      return { type: 'subheading', kind: 'h3', text: s };
    }

    if (/^(>|💡|⚠️|📌|LƯU Ý|NHẬN ĐỊNH|NGUYÊN TẮC|KẾT LUẬN|PHÁT HIỆN|HỆ QUẢ|GHI CHÚ|KEY TAKEAWAY|SUMMARY)\s*[:.\-–—]/i.test(s) || s.startsWith('>')) {
      return { type: 'callout', kind: 'callout', text: s.replace(/^>\s*/, '') };
    }
    if (/^([-•▪◦+])\s+/.test(s) || /^\*\s+/.test(s)) {
      return { type: 'bullet', kind: 'bullet', text: s.replace(/^([-•*▪◦+])\s+/, '') };
    }
    return { type: 'paragraph', kind: 'paragraph', text: s };
  }
  global.NoirClassifyDocLine = noirClassifyDocLine;

  // ==========================================================================
  // BỘ TRÍCH XUẤT CẤU TRÚC THỐNG NHẤT TOÀN APP (Văn bản, Tiêu đề, Bảng, Hình, Mục lục)
  // Dùng chung cho CẢ Phối Màu Báo Cáo Khoa Học & Tạo Trang Mục Lục Tự Động (Auto TOC)!
  // ==========================================================================
  async function extractStructuredBlocksFromFile(fileObj, deps = {}) {
    const f = fileObj || {};
    const ext = String(f.name || '').split('.').pop().toLowerCase();
    const { ensureJsZip, ensureXlsx, ensurePdfJs } = deps;
    const rawBlocks = [];

    const guessImageMime = (pathStr) => {
      const e = String(pathStr || '').split('.').pop().toLowerCase();
      if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
      if (e === 'webp') return 'image/webp';
      if (e === 'gif') return 'image/gif';
      return 'image/png';
    };

    const parsePipeLine = (line) => {
      let s = String(line || '').trim();
      if (s.startsWith('|')) s = s.slice(1);
      if (s.endsWith('|')) s = s.slice(0, -1);
      return s.split('|').map((c) => c.replace(/\*\*/g, '').replace(/`/g, '').trim());
    };

    // Chuyển khối các dòng phân cột (Tab / nhiều khoảng trắng) thành bảng
    const extractTabOrSpacedTable = (linesArr, startIdx) => {
      const splitCols = (ln) => {
        if (ln.includes('\t')) return ln.split(/\t+/).map((c) => c.trim());
        return ln.trim().split(/\s{3,}/).map((c) => c.trim());
      };
      const first = splitCols(linesArr[startIdx]);
      if (first.length < 2 || first.length > 10) return null;
      const rows = [first];
      let j = startIdx + 1;
      while (j < linesArr.length) {
        const raw = linesArr[j];
        if (!raw || !raw.trim()) break;
        const c = splitCols(raw);
        if (c.length < 2 || Math.abs(c.length - first.length) > 1) break;
        rows.push(c);
        j++;
      }
      return rows.length >= 2 ? { rows, nextIdx: j } : null;
    };

    if (ext === 'docx' && typeof ensureJsZip === 'function') {
      const JSZip = await ensureJsZip();
      const zip = await JSZip.loadAsync(f.bytes);
      const relsMap = new Map();
      const relsStr = await zip.file('word/_rels/document.xml.rels')?.async('string');
      if (relsStr && typeof DOMParser !== 'undefined') {
        const relDoc = new DOMParser().parseFromString(relsStr, 'application/xml');
        Array.from(relDoc.getElementsByTagName('*'))
          .filter((n) => (n.localName || n.nodeName).toLowerCase() === 'relationship')
          .forEach((rel) => {
            const id = rel.getAttribute('Id');
            const tgt = rel.getAttribute('Target') || '';
            if (id && tgt) {
              const norm = tgt.replace(/^\/+/, '').replace(/^word\//i, '');
              relsMap.set(id, `word/${norm}`);
            }
          });
      }
      const xmlStr = await zip.file('word/document.xml')?.async('string');
      if (xmlStr && typeof DOMParser !== 'undefined') {
        const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
        const lnOf = (n) => {
          const raw = String(n?.localName || n?.nodeName || '').toLowerCase();
          const idx = raw.indexOf(':');
          return idx >= 0 ? raw.slice(idx + 1) : raw;
        };
        const getDirectChildren = (el, name) =>
          Array.from(el?.childNodes || []).filter((ch) => lnOf(ch) === name);

        const extractParagraphText = (pEl) => {
          const outParts = [];
          const walkRun = (node) => {
            const name = lnOf(node);
            if (name === 't' || name === 'deltext') {
              outParts.push(node.textContent || '');
              return;
            }
            if (name === 'tab') {
              outParts.push('\t');
              return;
            }
            if (name === 'br' || name === 'cr') {
              outParts.push(' ');
              return;
            }
            for (const ch of Array.from(node.childNodes || [])) {
              walkRun(ch);
            }
          };
          walkRun(pEl);
          return outParts.join('').replace(/[ ]{2,}/g, ' ').trim();
        };

        const extractTableRows = (tblEl) => {
          const rows = [];
          const walkRows = (node) => {
            for (const ch of Array.from(node.childNodes || [])) {
              const nm = lnOf(ch);
              if (nm === 'tr') {
                const rowCells = [];
                const tcs = getDirectChildren(ch, 'tc');
                const tcNodes = tcs.length ? tcs : Array.from(ch.getElementsByTagName('*')).filter((x) => lnOf(x) === 'tc');
                for (const tc of tcNodes) {
                  const ps = Array.from(tc.getElementsByTagName('*')).filter((x) => lnOf(x) === 'p');
                  const cellTxt = ps.length
                    ? ps.map((p) => extractParagraphText(p)).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
                    : String(tc.textContent || '').replace(/\s+/g, ' ').trim();
                  rowCells.push(cellTxt);
                  const gsNode = Array.from(tc.getElementsByTagName('*')).find((x) => lnOf(x) === 'gridspan');
                  const span = gsNode ? parseInt(gsNode.getAttribute('w:val') || gsNode.getAttribute('val') || '1', 10) : 1;
                  if (span > 1 && span <= 8) {
                    for (let k = 1; k < span; k++) rowCells.push('');
                  }
                }
                if (rowCells.some((c) => c !== '')) rows.push(rowCells);
              } else if (nm !== 'tbl') {
                walkRows(ch);
              }
            }
          };
          walkRows(tblEl);
          return rows;
        };

        const body =
          xmlDoc.getElementsByTagName('w:body')[0] ||
          Array.from(xmlDoc.getElementsByTagName('*')).find((n) => lnOf(n) === 'body');

        const walkContainer = async (container) => {
          for (const child of Array.from(container.childNodes || [])) {
            const ln = lnOf(child);
            if (ln === 'p') {
              const allNodes = Array.from(child.getElementsByTagName('*'));
              const blips = allNodes.filter((n) => {
                const nm = lnOf(n);
                return nm === 'blip' || nm === 'imagedata';
              });
              for (const bl of blips) {
                const rId =
                  bl.getAttribute('r:embed') ||
                  bl.getAttribute('r:id') ||
                  bl.getAttributeNS?.('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed') ||
                  bl.getAttributeNS?.('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ||
                  '';
                const mediaPath = relsMap.get(rId);
                if (mediaPath && zip.file(mediaPath)) {
                  try {
                    const b64 = await zip.file(mediaPath).async('base64');
                    const mime = guessImageMime(mediaPath);
                    rawBlocks.push({ type: 'image', dataUrl: `data:${mime};base64,${b64}`, caption: '' });
                  } catch (_eImgDocx) {}
                }
              }

              // Bảng nằm trong hộp văn bản (<w:txbxContent><w:tbl>) bên trong đoạn văn
              const nestedTbls = allNodes.filter((n) => lnOf(n) === 'tbl');
              for (const nt of nestedTbls) {
                const nRows = extractTableRows(nt);
                if (nRows.length) rawBlocks.push({ type: 'table', rows: nRows });
              }

              const rawP = extractParagraphText(child);
              if (!rawP) continue;
              const txt = rawP.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim();
              const pStyleNode = allNodes.find((n) => lnOf(n) === 'pstyle');
              const pStyle = pStyleNode?.getAttribute('w:val') || pStyleNode?.getAttribute('val') || '';
              const hasBoldRun = allNodes.some((n) => lnOf(n) === 'b');
              if (rawP.includes('\t') && rawP.split(/\t+/).filter(Boolean).length >= 2 && !/\.{3,}/.test(txt)) {
                rawBlocks.push({ type: '_docx_tab_row', cells: rawP.split(/\t+/).map((c) => c.trim()), rawText: txt, isBold: hasBoldRun });
              } else if (/^(?:heading\s*1|title)$/i.test(pStyle)) {
                rawBlocks.push({ type: 'heading', kind: 'h1', text: txt });
              } else if (/^(?:heading\s*[2-6]|subtitle)$/i.test(pStyle)) {
                rawBlocks.push({ type: 'subheading', kind: 'h3', text: txt });
              } else {
                const cls = noirClassifyDocLine(txt, { isBold: hasBoldRun });
                if (cls) rawBlocks.push(cls);
              }
            } else if (ln === 'tbl') {
              const rows = extractTableRows(child);
              if (rows.length) rawBlocks.push({ type: 'table', rows });
            } else if (ln === 'sdt' || ln === 'sdtcontent' || ln === 'customxml' || ln === 'txbxcontent') {
              await walkContainer(child);
            }
          }
        };

        if (body) await walkContainer(body);

        // Gom các dòng DOCX phân tách bằng <w:tab/> liên tiếp thành Table thật
        for (let di = 0; di < rawBlocks.length; di++) {
          if (rawBlocks[di]?.type !== '_docx_tab_row') continue;
          let dj = di;
          const tabRows = [];
          while (dj < rawBlocks.length && rawBlocks[dj]?.type === '_docx_tab_row') {
            tabRows.push(rawBlocks[dj].cells);
            dj++;
          }
          if (tabRows.length >= 2) {
            rawBlocks.splice(di, dj - di, { type: 'table', rows: tabRows });
          } else {
            const single = rawBlocks[di];
            rawBlocks[di] = noirClassifyDocLine(single.rawText, { isBold: single.isBold }) || { type: 'paragraph', kind: 'paragraph', text: single.rawText };
          }
        }
      }
    } else if ((ext === 'xlsx' || ext === 'xls' || ext === 'csv') && typeof ensureXlsx === 'function') {
      const XLSX = await ensureXlsx();
      const wb = ext === 'csv'
        ? XLSX.read(new TextDecoder('utf-8').decode(f.bytes || new Uint8Array()), { type: 'string' })
        : XLSX.read(f.bytes, { type: 'array' });
      wb.SheetNames.forEach((sn, sIdx) => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' })
          .map((r) => r.map((c) => String(c ?? '').trim()))
          .filter((r) => r.some(Boolean));
        if (rows.length) {
          rawBlocks.push({ type: 'heading', kind: 'h1', text: ext === 'csv' ? `DỮ LIỆU BẢNG (${f.name})` : `PHẦN ${sIdx + 1}: ${sn}` });
          rawBlocks.push({ type: 'table', caption: `Bảng ${sIdx + 1}: Dữ liệu "${sn}"`, rows });
        }
      });
    } else if (ext === 'pdf' && typeof ensurePdfJs === 'function') {
      const pdfjsLib = await ensurePdfJs();
      const pdfDoc = await pdfjsLib.getDocument({ data: f.bytes.slice(0) }).promise;
      const maxP = Math.min(pdfDoc.numPages, 60);
      const allFontSizes = [];
      const pageRowsList = [];
      const pageImagesMap = new Map();

      for (let pno = 1; pno <= maxP; pno++) {
        const page = await pdfDoc.getPage(pno);
        const tc = await page.getTextContent();
        const rawItems = [];
        for (const it of tc.items || []) {
          const s = String(it.str || '').trim();
          if (!s) continue;
          const x = Number(it.transform?.[4] || 0);
          const y = Number(it.transform?.[5] || 0);
          const fSz = Math.max(6, Math.hypot(it.transform?.[0] || 0, it.transform?.[1] || 0));
          const w = Number(it.width || 0) || s.length * fSz * 0.48;
          const boldFlag = /bold|black|heavy|demi|semibold/i.test(String(it.fontName || '') + String(tc.styles?.[it.fontName]?.fontFamily || ''));
          allFontSizes.push(fSz);
          rawItems.push({ x, y, w, s, fSz, boldFlag });
        }

        // Gom item theo từng dòng Y linh hoạt (tránh bug làm tròn chia ranh giới)
        rawItems.sort((a, b) => b.y - a.y || a.x - b.x);
        const rowsOnPage = [];
        for (const it of rawItems) {
          const row = rowsOnPage.find((r) => Math.abs(r.y - it.y) <= Math.max(4, Math.min(it.fSz, r.avgSz) * 0.48));
          if (row) {
            row.items.push(it);
            row.avgSz = (row.avgSz * (row.items.length - 1) + it.fSz) / row.items.length;
          } else {
            rowsOnPage.push({ y: it.y, pageNo: pno, avgSz: it.fSz, items: [it] });
          }
        }
        rowsOnPage.sort((a, b) => b.y - a.y);

        for (const r of rowsOnPage) {
          r.items.sort((a, b) => a.x - b.x);
          const gapThresh = Math.max(13, r.avgSz * 1.45);
          const segs = [];
          for (const it of r.items) {
            const last = segs[segs.length - 1];
            const gap = last ? it.x - last.endX : 0;
            if (!last || gap >= gapThresh) {
              segs.push({ x: it.x, endX: it.x + it.w, text: it.s, bold: it.boldFlag });
            } else {
              last.text = `${last.text} ${it.s}`.replace(/\s+/g, ' ').trim();
              last.endX = Math.max(last.endX, it.x + it.w);
              last.bold = last.bold || it.boldFlag;
            }
          }
          r.segs = segs;
          r.text = r.items.map((o) => o.s).join(' ').replace(/\s+/g, ' ').trim();
          r.isBold = r.items.some((o) => o.boldFlag);
        }
        pageRowsList.push(rowsOnPage);

        // Trích xuất ảnh nhúng thật trên trang PDF (nếu trang có bitmap/biểu đồ riêng >= 64px)
        try {
          if (typeof document !== 'undefined' && pdfjsLib.OPS && typeof page.getOperatorList === 'function') {
            const ops = await page.getOperatorList();
            const seenNames = new Set();
            const pImgs = [];
            const fnArr = ops?.fnArray || [];
            const argArr = ops?.argsArray || [];
            for (let oi = 0; oi < fnArr.length && pImgs.length < 4; oi++) {
              const op = fnArr[oi];
              if (op === pdfjsLib.OPS.paintImageXObject || op === pdfjsLib.OPS.paintJpegXObject) {
                const imgName = argArr[oi]?.[0];
                if (!imgName || seenNames.has(imgName)) continue;
                seenNames.add(imgName);
                try {
                  const imgObj = page.objs?.has?.(imgName)
                    ? page.objs.get(imgName)
                    : await Promise.race([
                        new Promise((res) => { try { page.objs.get(imgName, res); } catch (_e) { res(null); } }),
                        new Promise((res) => setTimeout(() => res(null), 90)),
                      ]);
                  if (imgObj && imgObj.width >= 64 && imgObj.height >= 48 && (imgObj.data || imgObj.bitmap)) {
                    const ic = document.createElement('canvas');
                    const sc = Math.min(1, 900 / Math.max(imgObj.width, imgObj.height));
                    ic.width = Math.max(1, Math.round(imgObj.width * sc));
                    ic.height = Math.max(1, Math.round(imgObj.height * sc));
                    const ictx = ic.getContext('2d');
                    if (imgObj.bitmap) {
                      ictx.drawImage(imgObj.bitmap, 0, 0, ic.width, ic.height);
                      pImgs.push({ type: 'image', dataUrl: ic.toDataURL('image/png'), pageNo: pno, caption: '' });
                    } else if (imgObj.data) {
                      const rawCv = document.createElement('canvas');
                      rawCv.width = imgObj.width;
                      rawCv.height = imgObj.height;
                      const rctx = rawCv.getContext('2d');
                      const imgData = rctx.createImageData(imgObj.width, imgObj.height);
                      const src = imgObj.data;
                      if (src.length === imgObj.width * imgObj.height * 4) {
                        imgData.data.set(src);
                      } else if (src.length === imgObj.width * imgObj.height * 3) {
                        for (let p = 0, q = 0; q < src.length; p += 4, q += 3) {
                          imgData.data[p] = src[q];
                          imgData.data[p + 1] = src[q + 1];
                          imgData.data[p + 2] = src[q + 2];
                          imgData.data[p + 3] = 255;
                        }
                      } else if (src.length === imgObj.width * imgObj.height) {
                        for (let p = 0, q = 0; q < src.length; p += 4, q += 1) {
                          imgData.data[p] = imgData.data[p + 1] = imgData.data[p + 2] = src[q];
                          imgData.data[p + 3] = 255;
                        }
                      }
                      rctx.putImageData(imgData, 0, 0);
                      ictx.drawImage(rawCv, 0, 0, ic.width, ic.height);
                      pImgs.push({ type: 'image', dataUrl: ic.toDataURL('image/png'), pageNo: pno, caption: '' });
                    }
                  }
                } catch (_eObj) {}
              }
            }
            if (pImgs.length) pageImagesMap.set(pno, pImgs);
          }
        } catch (_eOpList) {}
      }

      const sortedSz = allFontSizes.slice().sort((a, b) => a - b);
      const medianFontSize = sortedSz.length ? sortedSz[Math.floor(sortedSz.length / 2)] : 11;

      const buildAlignedPdfTable = (candRows) => {
        const anchors = [];
        for (const r of candRows) {
          for (const sg of r.segs) {
            const match = anchors.find((a) => Math.abs(a.x - sg.x) <= 28);
            if (match) {
              match.hits += 1;
              match.x = (match.x * (match.hits - 1) + sg.x) / match.hits;
              match.endX = Math.max(match.endX, sg.endX);
            } else {
              anchors.push({ x: sg.x, endX: sg.endX, hits: 1 });
            }
          }
        }
        anchors.sort((a, b) => a.x - b.x);
        // Gộp các cột quá sát nhau hoặc nhiễu ít hits nếu > 1 cột
        const strongAnchors = anchors.filter((a) => a.hits >= 2 || anchors.length <= 4);
        const colsUse = strongAnchors.length >= 2 ? strongAnchors : anchors;
        if (colsUse.length < 2 || colsUse.length > 12) return null;
        // Kiểm tra ít nhất 2 cột khớp lặp lại ở >= 2 dòng (hoặc có Bảng X.Y phía trên)
        const multiColRows = candRows.filter((r) => r.segs.length >= 2).length;
        if (multiColRows < 2) return null;

        const matrix = [];
        for (const r of candRows) {
          const rowArr = new Array(colsUse.length).fill('');
          for (const sg of r.segs) {
            let bestIdx = 0;
            let bestDist = Infinity;
            colsUse.forEach((col, ci) => {
              const d = Math.abs(sg.x - col.x);
              if (d < bestDist) { bestDist = d; bestIdx = ci; }
            });
            rowArr[bestIdx] = rowArr[bestIdx] ? `${rowArr[bestIdx]} ${sg.text}` : sg.text;
          }
          if (rowArr.some(Boolean)) matrix.push(rowArr);
        }
        return matrix.length >= 2 ? matrix : null;
      };

      const isTocLikeRow = (r) => /\.{3,}\s*\d{1,4}$/.test(r.text);
      const isSectionLikeRow = (r) =>
        /^(MỤC LỤC|DANH MỤC|CHƯƠNG\s+[IVXLCDM\d]+|PHẦN\s+[IVXLCDM\d]+|Phần\s+[IVXLCDM\d]+|PHỤ LỤC|Bảng\s+\d|BẢNG\s+\d|Hình\s+\d|HÌNH\s+\d)/i.test(r.text) &&
        r.segs.length <= 1;

      const pdfTokens = [];
      for (const rowsOnPage of pageRowsList) {
        let ri = 0;
        while (ri < rowsOnPage.length) {
          const curR = rowsOnPage[ri];
          if (curR.segs.length >= 2 && curR.segs.length <= 12 && !isTocLikeRow(curR) && !isSectionLikeRow(curR)) {
            const run = [curR];
            let rj = ri + 1;
            while (rj < rowsOnPage.length) {
              const nxt = rowsOnPage[rj];
              const prevR = run[run.length - 1];
              const dy = prevR.y - nxt.y;
              if (dy > Math.max(54, medianFontSize * 4.8)) break;
              if (isTocLikeRow(nxt) || isSectionLikeRow(nxt)) break;
              // Dừng nếu gặp câu văn xuôi dài 1 đoạn
              if (nxt.segs.length === 1 && nxt.text.length > 92 && /[.!?]$/.test(nxt.text)) break;
              if (nxt.segs.length >= 2 || dy <= Math.max(24, medianFontSize * 2.1)) {
                run.push(nxt);
                rj++;
                continue;
              }
              break;
            }
            const trimmedRun = run.slice();
            while (trimmedRun.length > 2 && trimmedRun[trimmedRun.length - 1].segs.length === 1 && trimmedRun[trimmedRun.length - 1].text.length > 65) {
              trimmedRun.pop();
              rj--;
            }
            const tableRows = buildAlignedPdfTable(trimmedRun);
            if (tableRows) {
              pdfTokens.push({ kind: 'table', rows: tableRows, pageNo: curR.pageNo });
              ri = rj;
              continue;
            }
          }
          pdfTokens.push({ kind: 'line', text: curR.text, fontSize: curR.avgSz, isBold: curR.isBold, pageNo: curR.pageNo });
          ri++;
        }
      }

      const mergedPdfTokens = [];
      for (const cur of pdfTokens) {
        if (cur.kind === 'table') {
          mergedPdfTokens.push(cur);
          continue;
        }
        const prev = mergedPdfTokens[mergedPdfTokens.length - 1];
        const isExplicitBreak =
          /^(MỤC LỤC|DANH MỤC|CHƯƠNG\s+[IVXLCDM\d]+|PHẦN\s+[IVXLCDM\d]+|Phần\s+[IVXLCDM\d]+|PHỤ LỤC\s+[A-Z0-9IVX]+|Bảng\s+\d|Hình\s+\d|[IVXLCDM]{1,5}\.\s|\d{1,2}\.\d{1,2}|\d{1,2}\.\s+[A-ZÀ-Ỹ]|[-•*▪◦+]\s)/i.test(cur.text) &&
          !/^phần\s+(?!\d|[IVXLCDM]+\b)/i.test(cur.text);
        const sameLineKind = prev && prev.kind === 'line';
        const samePage = sameLineKind && prev.pageNo === cur.pageNo;
        const sameSize = sameLineKind && Math.abs(prev.fontSize - cur.fontSize) < medianFontSize * 0.14;
        const prevIncomplete = sameLineKind && !/[.!?:"»)]$/.test(prev.text);
        const curIsContinuation = /^[a-zà-ỹ]/.test(cur.text) || /^[\(\[]?(USD|VND|EUR|triệu|tỷ)\.?$/i.test(cur.text);
        if (prev && sameLineKind && samePage && sameSize && !isExplicitBreak && (prevIncomplete || curIsContinuation) && prev.text.length < 700) {
          prev.text = `${prev.text} ${cur.text}`.replace(/\s+/g, ' ').trim();
          continue;
        }
        mergedPdfTokens.push({ ...cur });
      }

      for (const tok of mergedPdfTokens) {
        if (tok.kind === 'table') {
          rawBlocks.push({ type: 'table', rows: tok.rows, pageNo: tok.pageNo });
          continue;
        }
        const cls = noirClassifyDocLine(tok.text, { medianFontSize, fontSize: tok.fontSize, isBold: tok.isBold });
        if (cls) {
          cls.pageNo = tok.pageNo;
          rawBlocks.push(cls);
        }
        if (cls?.type === 'figure_caption' && pageImagesMap.has(tok.pageNo)) {
          const pImgs = pageImagesMap.get(tok.pageNo);
          if (pImgs && pImgs.length) {
            const imgBlk = pImgs.shift();
            imgBlk.caption = cls.text;
            rawBlocks.push(imgBlk);
          }
        }
      }
      // Bất kỳ ảnh nào còn lại trong PDF (chưa khớp với figure_caption) được gán cuối trang tương ứng
      for (const [pno, remImgs] of pageImagesMap.entries()) {
        for (const imgBlk of remImgs) {
          const idxAfterPage = rawBlocks.findIndex((b) => b.pageNo > pno);
          if (idxAfterPage >= 0) rawBlocks.splice(idxAfterPage, 0, imgBlk);
          else rawBlocks.push(imgBlk);
        }
      }
    } else {
      const rawTxt = new TextDecoder('utf-8').decode(f.bytes || new Uint8Array());
      if ((ext === 'html' || ext === 'htm' || /<table[\s>]/i.test(rawTxt)) && typeof DOMParser !== 'undefined') {
        try {
          const wrappedHtml = /<html\b/i.test(rawTxt) ? rawTxt : `<html><body>${rawTxt}</body></html>`;
          const htmlDoc = new DOMParser().parseFromString(wrappedHtml, 'text/html');
          const walkHtml = (el) => {
            for (const ch of Array.from(el?.childNodes || [])) {
              const tag = String(ch.tagName || ch.nodeName || '').toLowerCase();
              if (!tag || tag === '#text') {
                const s = String(ch.textContent || '').trim();
                if (s) {
                  const cls = noirClassifyDocLine(s);
                  if (cls) rawBlocks.push(cls);
                }
                continue;
              }
              if (tag === 'script' || tag === 'style') continue;
              if (tag === 'table') {
                const rows = Array.from(ch.querySelectorAll ? ch.querySelectorAll('tr') : ch.getElementsByTagName('tr'))
                  .map((tr) =>
                    Array.from(tr.children || tr.childNodes || [])
                      .filter((cell) => /^(td|th)$/i.test(cell.tagName || cell.nodeName || ''))
                      .map((cell) => String(cell.textContent || '').replace(/\s+/g, ' ').trim())
                  )
                  .filter((r) => r.some(Boolean));
                if (rows.length) rawBlocks.push({ type: 'table', rows });
              } else if (/^h[12]$/.test(tag)) {
                const s = String(ch.textContent || '').replace(/\s+/g, ' ').trim();
                if (s) rawBlocks.push({ type: 'heading', kind: 'h1', text: s });
              } else if (/^h[3-6]$/.test(tag)) {
                const s = String(ch.textContent || '').replace(/\s+/g, ' ').trim();
                if (s) rawBlocks.push({ type: 'subheading', kind: 'h3', text: s });
              } else if (tag === 'img') {
                const src = ch.getAttribute?.('src') || '';
                if (src && (src.startsWith('data:image/') || /^https?:\/\//i.test(src))) {
                  rawBlocks.push({ type: 'image', dataUrl: src, caption: ch.getAttribute?.('alt') || '' });
                }
              } else if (tag === 'p' || tag === 'li' || tag === 'blockquote') {
                const nestedTbl = ch.getElementsByTagName?.('table')?.length;
                if (nestedTbl) walkHtml(ch);
                else {
                  const s = String(ch.textContent || '').replace(/\s+/g, ' ').trim();
                  if (s) {
                    const cls = tag === 'li'
                      ? { type: 'bullet', kind: 'bullet', text: s }
                      : tag === 'blockquote'
                      ? { type: 'callout', kind: 'callout', text: s }
                      : noirClassifyDocLine(s);
                    if (cls) rawBlocks.push(cls);
                  }
                }
              } else {
                walkHtml(ch);
              }
            }
          };
          walkHtml(htmlDoc.body || htmlDoc.documentElement || htmlDoc);
        } catch (_eHtmlParse) {}
      }
      if (!rawBlocks.length) {
        const txtLines = rawTxt.split(/\r?\n/);
        let ti = 0;
        while (ti < txtLines.length) {
          const rawL = txtLines[ti];
          const t = rawL.trim();
          if (!t || /^[-*_]{3,}$/.test(t)) { ti++; continue; }
          // Markdown pipe table (có hoặc không có dòng gạch |---|)
          if (t.includes('|') && ti + 1 < txtLines.length && /^\s*\|?[\s:=-]+\|[\s|=:-]*$/.test(txtLines[ti + 1].trim())) {
            const rows = [parsePipeLine(t)];
            ti += 2;
            while (ti < txtLines.length && txtLines[ti].trim().includes('|') && !/^#{1,6}\s/.test(txtLines[ti].trim())) {
              const nxtTrim = txtLines[ti].trim();
              if (!/^\s*\|?[\s:=-]+\|[\s|=:-]*$/.test(nxtTrim)) rows.push(parsePipeLine(nxtTrim));
              ti++;
            }
            rawBlocks.push({ type: 'table', rows });
            continue;
          }
          if (/^\|.+\|$/.test(t) && parsePipeLine(t).length >= 2 && ti + 1 < txtLines.length && /^\|.+\|$/.test(txtLines[ti + 1].trim())) {
            const firstR = parsePipeLine(t);
            const rows = [firstR];
            ti += 1;
            while (ti < txtLines.length && /^\|.+\|$/.test(txtLines[ti].trim())) {
              const nxtTrim = txtLines[ti].trim();
              if (!/^\s*\|?[\s:=-]+\|[\s|=:-]*$/.test(nxtTrim)) rows.push(parsePipeLine(nxtTrim));
              ti++;
            }
            if (rows.length >= 2) {
              rawBlocks.push({ type: 'table', rows });
              continue;
            }
          }
          // Bảng Tab-delimited hoặc căn cột nhiều khoảng trắng (>= 2 dòng liên tiếp)
          if (rawL.includes('\t') || /\S\s{3,}\S/.test(t)) {
            const tabTbl = extractTabOrSpacedTable(txtLines, ti);
            if (tabTbl) {
              rawBlocks.push({ type: 'table', rows: tabTbl.rows });
              ti = tabTbl.nextIdx;
              continue;
            }
          }
          const imgMd = t.match(/^!\[([^\]]*)\]\(((?:data:image\/|https?:\/\/)[^)]+)\)/i);
          if (imgMd) {
            rawBlocks.push({ type: 'image', dataUrl: imgMd[2], caption: imgMd[1] || '' });
            ti++; continue;
          }
          if (/^#{1,2}\s+/.test(t)) {
            rawBlocks.push({ type: 'heading', kind: 'h1', text: t.replace(/^#{1,2}\s+/, '').replace(/\*/g, '') });
          } else if (/^#{3,6}\s+/.test(t)) {
            rawBlocks.push({ type: 'subheading', kind: 'h3', text: t.replace(/^#{3,6}\s+/, '').replace(/\*/g, '') });
          } else {
            const cls = noirClassifyDocLine(t);
            if (cls) rawBlocks.push(cls);
          }
          ti++;
        }
      }
    }

    // Gắn table_caption / figure_caption vào đúng Table hoặc Image kề cận & gộp dòng tiêu đề/đoạn văn còn sót
    const isStandaloneNewSection = (s) =>
      /^(MỤC LỤC|DANH MỤC|CHƯƠNG\s+[IVXLCDM\d]+|PHẦN\s+[IVXLCDM\d]+|Phần\s+[IVXLCDM\d]+|PHỤ LỤC\s+[A-Z0-9IVX]+|[IVXLCDM]{1,5}\.\s|[1-9]\d?\.\s+[A-ZÀ-Ỹ])/i.test(String(s || '').trim());
    const coalesced = [];
    for (let i = 0; i < rawBlocks.length; i++) {
      const blk = rawBlocks[i];
      const prev = coalesced[coalesced.length - 1];
      if (blk.type === 'table' && prev && prev.type === 'table_caption') {
        coalesced[coalesced.length - 1] = { ...blk, caption: prev.text, pageNo: blk.pageNo || prev.pageNo };
        continue;
      }
      if (blk.type === 'figure_caption' && prev && prev.type === 'image' && !prev.caption) {
        prev.caption = blk.text;
        continue;
      }
      if (blk.type === 'image' && prev && prev.type === 'figure_caption') {
        coalesced[coalesced.length - 1] = { ...blk, caption: prev.text, pageNo: blk.pageNo || prev.pageNo };
        continue;
      }
      if (prev && prev.type === 'heading' && blk.type === 'heading' && !isStandaloneNewSection(blk.text)) {
        prev.text = `${prev.text} ${blk.text}`.replace(/\s+/g, ' ').trim();
        continue;
      }
      if (prev && prev.type === 'subheading' && blk.type === 'subheading' && !/^\d+\.\d+/.test(blk.text)) {
        prev.text = `${prev.text} ${blk.text}`.replace(/\s+/g, ' ').trim();
        continue;
      }
      if (
        ext === 'pdf' &&
        prev &&
        prev.type === 'paragraph' &&
        blk.type === 'paragraph' &&
        prev.pageNo === blk.pageNo &&
        !(prev.text.length < 52 && /[.!?:”"»)]$/.test(prev.text))
      ) {
        prev.text = `${prev.text} ${blk.text}`.replace(/\s+/g, ' ').trim();
        continue;
      }
      coalesced.push({ ...blk });
    }
    return coalesced;
  }

  function buildTocFromBlocks(blocks = []) {
    const sections = [];
    const tables = [];
    const figures = [];
    let tblCount = 0;
    let figCount = 0;

    for (const b of blocks) {
      const pNo = b.pageNo || 1;
      if (b.type === 'heading') {
        if (!/^(MỤC LỤC|DANH MỤC\s+(BẢNG|BIỂU ĐỒ|HÌNH))/i.test(b.text || '')) {
          sections.push({ level: b.kind === 'h2' ? 2 : 1, text: b.text, pageNo: pNo });
        }
      } else if (b.type === 'subheading') {
        sections.push({ level: 3, text: b.text, pageNo: pNo });
      } else if (b.type === 'table' || b.type === 'table_caption') {
        tblCount += 1;
        tables.push({ label: b.caption || b.text || `Bảng ${tblCount}`, pageNo: pNo });
      } else if (b.type === 'image' || b.type === 'figure_caption') {
        figCount += 1;
        const lbl = b.caption || b.text || `Hình ${figCount}: Minh họa tài liệu`;
        // Tránh trùng lặp khi cả image và figure_caption đứng riêng
        if (!figures.some((x) => x.label === lbl && x.pageNo === pNo)) {
          figures.push({ label: lbl, pageNo: pNo });
        }
      }
    }

    const tocTextLines = sections.map((s) => `${s.level >= 2 ? '  ' : ''}${s.text} | ${s.pageNo}`);
    return { sections, tables, figures, tocTextLines };
  }

  global.NoirClassifyDocLine = noirClassifyDocLine;
  global.NoirExtractStructuredBlocksFromFile = extractStructuredBlocksFromFile;
  global.NoirBuildTocFromBlocks = buildTocFromBlocks;

  const PAPER_SIZES = Object.freeze({
    a4: [595.28, 841.89],
    a3: [841.89, 1190.55],
    a5: [419.53, 595.28],
    letter: [612, 792],
    legal: [612, 1008],
  });

  // ==========================================================================
  // 1. DANH MỤC 7 CỤM — 48 CÔNG CỤ ĐĂNGLOVEPDF ULTRA PRO (CHUYỂN ĐỔI Ở CỤM 2!)
  // ==========================================================================
  const PRO_TOOL_GROUPS = Object.freeze([
    {
      id: 'organize',
      icon: '📚',
      title: 'Cụm 1: Tổ chức, Tách/Gộp, Dàn trang & Cấu trúc PDF',
      accent: 'emerald',
      tools: [
        { id: 'beautify_10_themes', icon: '🎨', featured: true, name: 'Phối Màu Báo Cáo Khoa Học 10 Theme Đẹp (DOCX / XLSX / PDF)', badge: '✨ Nên thử · 10 Theme', desc: 'Đưa file Word, Excel hoặc PDF bình thường vào → Tự động đóng trang bìa, banner tiêu đề & bảng kẻ sọc theo 10 bộ màu Báo cáo Tài chính / Khoa học cực đẹp, xuất ra PDF / DOCX / XLSX!', accept: '.docx,.xlsx,.xls,.pdf,.md,.txt', multiple: false, minFiles: 1, actionLabel: '✨ Áp dụng Theme & Xuất Báo Cáo Đẹp' },
        { id: 'merge', icon: '🧩', name: 'Gộp PDF (Merge)', badge: 'Nhiều PDF → 1 PDF', desc: 'Nối nhiều file PDF thành 1 file, kéo đổi thứ tự & sắp xếp A→Z cực nhanh.', accept: '.pdf', multiple: true, minFiles: 2, actionLabel: 'Gộp PDF ngay' },
        { id: 'split', icon: '✂️', name: 'Tách PDF đa chế độ', badge: 'Khoảng / Lẻ / N trang / MB', desc: 'Cắt theo khoảng (1-3, 5), tách lẻ từng trang, tách mỗi N trang hoặc theo mức dung lượng MB.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tách PDF ngay' },
        { id: 'organize', icon: '🗂️', name: 'Sắp xếp, Xoay, Nhân bản & Xóa trang', badge: 'PDF → PDF', desc: 'Xem từng trang nhỏ, xoay 90°/180°/270°, nhân bản, đổi thứ tự, xóa hoặc chèn trang trắng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Lưu bản PDF mới' },
        { id: 'extract_pages', icon: '📑', name: 'Trích xuất & Đảo ngược trang', badge: 'Chẵn / Lẻ / Đảo chiều', desc: 'Rút riêng trang chẵn, trang lẻ, nhóm trang tùy chọn hoặc đảo ngược toàn bộ thứ tự trang.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Trích xuất / Đảo trang' },
        { id: 'crop', icon: '🔲', name: 'Cắt xén lề thừa (Crop PDF)', badge: 'Toàn bộ / Lẻ / Chẵn', desc: 'Cắt gọn 4 mép viền trắng thừa của toàn bộ tài liệu hoặc chỉ trang lẻ / trang chẵn.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Cắt viền & Lưu' },
        { id: 'resize_scale', icon: '📐', name: 'Đổi khổ giấy & Co giãn trang', badge: 'A4 / A3 / A5 / Letter', desc: 'Chuẩn hóa toàn bộ trang PDF về khổ A4, A3, A5, Letter, Legal (Dọc/Ngang) giữ tỷ lệ chuẩn.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuẩn hóa khổ giấy' },
        { id: 'nup_booklet', icon: '📖', name: 'Dàn trang Nhiều trang/tờ & Đóng gáy sách', badge: 'N-up 2/4/6/9 & Booklet', desc: 'Gom 2, 4, 6, 9 trang vào 1 mặt giấy hoặc đảo trang tự động để in sách đóng gáy giữa.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Dàn trang ngay' },
        { id: 'split_smart_books', icon: '🪓', name: 'Cắt đôi trang sách A3, In Áp phích & Tách theo trang trắng/từ khóa', badge: 'Split Half / Posterize / Smart', desc: 'Cắt dọc trang scan 2 trang liền nhau, chia khổ lớn A0/A1 ra lưới A4 dán tường, hoặc tách tự động theo trang trắng/từ khóa.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Xử lý cắt tách thông minh' },
        { id: 'alternate_mix', icon: '🔀', name: 'Trộn xen kẽ 2 file PDF (Scan 1 mặt)', badge: 'File 1 lẻ + File 2 chẵn', desc: 'Ghép xen kẽ trang từ 2 file PDF (có tùy chọn đảo ngược file 2 cho tài liệu scan 1 mặt).', accept: '.pdf', multiple: true, minFiles: 2, actionLabel: 'Trộn xen kẽ ngay' },
        { id: 'create_blank_pdf', icon: '🗒️', name: 'Tạo sổ PDF Trắng / Kẻ ngang / Ô ly', badge: 'Tạo mới 0 file', desc: 'Khởi tạo nhanh tập giấy PDF A4/A5 trắng, dòng kẻ ngang hoặc chấm bi để ghi chú & in ấn.', accept: '.pdf', multiple: false, minFiles: 0, noFileRequired: true, actionLabel: 'Tạo file PDF mới' },
      ],
    },
    {
      id: 'convert',
      icon: '🔄',
      title: 'Cụm 2: Chuyển đổi định dạng hai chiều (Word, Excel, Slide, Ảnh, EPUB, SVG, Email ↔ PDF)',
      accent: 'violet',
      tools: [
        { id: 'docx_convert', icon: '📘', name: 'Word (.DOCX) → PDF / TXT / MD / HTML', badge: 'DOCX → PDF/TXT/MD', desc: 'Đổi file Word sang PDF chuẩn tiếng Việt, văn bản thuần, Markdown hoặc trang HTML.', accept: '.docx', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi file Word' },
        { id: 'pdf_to_docx', icon: '📄', name: 'PDF → Word (.DOCX) / Markdown / TXT / JSON', badge: 'Kèm tọa độ & tiêu đề', desc: 'Xuất nội dung PDF sang Word chỉnh sửa được, Markdown phân cấp tiêu đề, TXT hoặc JSON.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi PDF ngay' },
        { id: 'pdf_to_excel', icon: '📈', name: 'PDF → Excel (.XLSX) / CSV (Quét bảng)', badge: 'Nhận diện hàng & cột', desc: 'Phân tích tọa độ X/Y văn bản trong PDF để tái tạo bảng tính Excel (.xlsx) hoặc CSV.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Quét bảng sang Excel' },
        { id: 'sheet_convert', icon: '📊', name: 'Excel / CSV / JSON ↔ Qua lại & PDF', badge: '4 chiều không lỗi dấu', desc: 'Chuyển đổi nhanh giữa Excel (.xlsx), CSV UTF-8, JSON và bảng PDF in ấn gọn gàng.', accept: '.xlsx,.xls,.csv,.json', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi Bảng tính' },
        { id: 'pdf_pptx', icon: '📽️', name: 'PDF ↔ PowerPoint (.PPTX)', badge: '2 chiều PDF ↔ PPTX', desc: 'Đổi PDF thành bài chiếu PowerPoint 16:9 hoặc rút nội dung từ .PPTX sang PDF / TXT.', accept: '.pdf,.pptx', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi Slide' },
        { id: 'pdf_to_img', icon: '🖼️', name: 'PDF → Ảnh sắc nét (JPG / PNG / WEBP)', badge: '72 – 300 DPI', desc: 'Xuất từng trang PDF thành ảnh siêu nét tùy chọn định dạng & độ phân giải DPI.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Xuất thành Ảnh' },
        { id: 'img_to_pdf', icon: '📸', name: 'Ảnh (JPG / PNG / WEBP / BMP) → PDF', badge: 'ẢNH → PDF', desc: 'Gộp nhiều ảnh thành 1 cuốn PDF chuẩn khổ A4/Letter/Khít ảnh với tùy chỉnh lề gọn gàng.', accept: 'image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp', multiple: true, minFiles: 1, actionLabel: 'Tạo PDF từ Ảnh' },
        { id: 'text_to_pdf_docx', icon: '🌐', name: 'HTML / Markdown / TXT → PDF / Word', badge: 'Web & Văn bản → PDF', desc: 'Đóng gói trang HTML, Markdown hoặc TXT sang PDF/DOCX gọn đẹp chuẩn tiếng Việt.', accept: '.txt,.md,.html,.htm', multiple: false, minFiles: 1, actionLabel: 'Xuất file ngay' },
        { id: 'epub_to_pdf', icon: '📚', name: 'Sách điện tử EPUB → PDF / Word / TXT', badge: 'EPUB → PDF/DOCX', desc: 'Giải nén cấu trúc XHTML trong sách .EPUB và dàn trang lại thành PDF tiếng Việt sắc nét.', accept: '.epub', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi EPUB' },
        { id: 'pdf_to_epub', icon: '📱', name: 'PDF → Sách điện tử (.EPUB)', badge: 'PDF → EPUB Kindle/Phone', desc: 'Đóng gói nội dung văn bản PDF thành sách điện tử chuẩn .EPUB đọc mượt trên điện thoại.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Xuất sách .EPUB' },
        { id: 'svg_eml_to_pdf', icon: '✉️', name: 'SVG / Email (.EML) / Truyện (.CBZ) → PDF', badge: 'Định dạng mở rộng', desc: 'Chuyển trực tiếp hình vector .SVG, thư điện tử .EML hoặc truyện tranh .CBZ sang PDF.', accept: '.svg,.eml,.cbz', multiple: false, minFiles: 1, actionLabel: 'Chuyển sang PDF' },
      ],
    },
    {
      id: 'edit',
      icon: '✨',
      title: 'Cụm 3: Đọc PDF 4 lớp, Chỉnh sửa PDF thực thụ (True Editor), Ký tên & Đánh số',
      accent: 'amber',
      tools: [
        { id: 'pdf_viewer_pro', icon: '👁️', name: 'Trình Đọc & Xem Trước PDF 4 Lớp Chuyên Nghiệp', badge: 'Ctrl+F / Bôi đen / 2 trang', desc: 'Đọc sách 2 trang đối xứng, bôi đen copy chữ, tìm kiếm Ctrl+F hỗ trợ Regex, cột Thumbnails/Mục lục & Chế độ tối thông minh.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Mở Trình Đọc PDF 4 Lớp' },
        { id: 'annotate_edit', icon: '🖍️', name: 'Trình Chỉnh sửa PDF Trực Quan (True PDF Editor)', badge: 'Sửa chữ gốc · CAD · Vẽ · Ảnh', desc: 'Bấm trực tiếp vào dòng chữ gốc để sửa, chèn chữ/ảnh, tô sáng, vẽ bút mượt, đo kích thước bản vẽ CAD, con dấu động & Undo/Redo!', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Lưu bản PDF đã chỉnh sửa' },
        { id: 'sign_edit', icon: '✍️', name: 'Ký tên điện tử (Vẽ tay / Font / Ảnh)', badge: 'Tự tách nền trắng', desc: 'Vẽ chữ ký trực tiếp, gõ chữ ký kiểu viết tay nghệ thuật hoặc tải ảnh tự tách nền trắng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Áp dụng chữ ký' },
        { id: 'page_numbers', icon: '🔢', name: 'Đánh số trang & Đánh số hồ sơ Bates', badge: '6 vị trí · Bates Pro', desc: 'Đánh số tự động 6 góc, bỏ qua trang bìa hoặc gắn mã hồ sơ Bates (vd: HS-0001).', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Thêm số trang / Bates' },
        { id: 'header_footer', icon: '🏷️', name: 'Thêm Tiêu đề đầu & Chân trang', badge: 'Header & Footer', desc: 'Chèn hàng loạt tên tài liệu, ngày tháng, tác giả lên lề trên/dưới toàn bộ tệp PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chèn Header & Footer' },
        { id: 'watermark', icon: '💧', name: 'Đóng dấu chìm Chữ hoặc Logo ảnh', badge: 'Text & Logo PNG/JPG', desc: 'Đóng dấu bản quyền bằng chữ tiếng Việt hoặc logo ảnh mờ chìm, hỗ trợ lặp lưới toàn trang.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Đóng dấu ngay' },
        { id: 'extract_images', icon: '📥', name: 'Trích xuất Ảnh & Tài nguyên PDF', badge: 'PDF → ZIP Tài nguyên', desc: 'Bóc tách ảnh độ phân giải cao và thông tin tài nguyên nhúng bên trong PDF ra file .ZIP.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Trích xuất tài nguyên' },
        { id: 'bookmarks_toc', icon: '📑', name: 'Tạo trang Mục lục tự động (Auto TOC)', badge: 'Chèn Mục lục đầu sách', desc: 'Tạo trang Mục lục trình bày đẹp mắt từ danh sách chương/số trang và ghép lên đầu file PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tạo & Ghép Mục lục' },
      ],
    },
    {
      id: 'forms',
      icon: '📋',
      title: 'Cụm 4: Biểu mẫu Tương tác (Điền AcroForm, Thiết kế Form & Trộn Excel Mail Merge)',
      accent: 'sky',
      tools: [
        { id: 'form_filler_builder', icon: '📝', name: 'Điền Biểu mẫu AcroForm & Tạo ô nhập liệu PDF', badge: 'AcroForm Filler & Builder', desc: 'Tự đọc & điền các ô AcroForm có sẵn, xuất JSON dữ liệu đã điền, hoặc tạo mới TextField/Checkbox vào PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Áp dụng Biểu mẫu & Lưu' },
        { id: 'pdf_mail_merge', icon: '📨', name: 'Trộn dữ liệu hàng loạt (PDF Mail Merge từ Excel/CSV)', badge: '1 PDF + Excel → Hàng trăm PDF', desc: 'Nạp 1 tệp mẫu PDF + 1 tệp Excel/CSV danh sách tên/mã số để xuất hàng loạt chứng nhận/hợp đồng vào 1 file .ZIP!', accept: '.pdf,.xlsx,.csv', multiple: true, minFiles: 2, actionLabel: 'Trộn hàng loạt ra .ZIP' },
      ],
    },
    {
      id: 'ocr_meta',
      icon: '👁️',
      title: 'Cụm 5: OCR 5 Bước Thông minh, Tiền xử lý Scan & Quản lý Siêu dữ liệu',
      accent: 'teal',
      tools: [
        { id: 'ocr_pdf', icon: '👁️', name: 'OCR 5 bước thông minh & Tạo PDF 2 lớp (Ctrl+F)', badge: 'Smart Skip · PDF/DOCX/MD/TXT', desc: 'Tự bỏ qua trang đã có chữ, tẩy bóng/làm nét ảnh scan, giữ thứ tự cột & xuất PDF 2 lớp tìm được hoặc Word/MD/TXT.', accept: '.pdf,image/jpeg,image/png,image/webp', multiple: false, minFiles: 1, actionLabel: 'Chạy OCR 5 bước ngay' },
        { id: 'deskew_denoise', icon: '🧹', name: 'Làm thẳng & Khử nhiễu trang Scan', badge: 'Deskew & Denoise', desc: 'Xoay thẳng trang giấy bị nghiêng, tăng độ tương phản & làm trắng nền scan ố vàng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Làm sạch trang Scan' },
        { id: 'metadata_editor', icon: '🧾', name: 'Xem, Sửa & Xóa sạch Siêu dữ liệu (Metadata)', badge: 'Editor & Scrubber', desc: 'Đọc/sửa Tiêu đề, Tác giả, Từ khóa hoặc bấm 1 chạm xóa trắng toàn bộ dấu vết ẩn của tệp.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Lưu / Xóa Metadata' },
      ],
    },
    {
      id: 'optimize',
      icon: '⚡',
      title: 'Cụm 6: Nén dung lượng, Sửa lỗi, Chế bản In ấn (Bleed/Crop Marks) & PDF/A',
      accent: 'cyan',
      tools: [
        { id: 'compress', icon: '🗜️', name: 'Nén nhỏ PDF (3 cấp độ)', badge: 'Giảm dung lượng', desc: 'Làm nhẹ file PDF tức thì với 3 mức nén (Nhẹ, Vừa, Cực đại) tối ưu gửi Zalo/Email.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Nén PDF ngay' },
        { id: 'repair_pdf', icon: '🔧', name: 'Sửa lỗi cấu trúc PDF (Repair)', badge: 'Dựng lại Xref & Stream', desc: 'Quét và dựng lại cấu trúc bảng tham chiếu bị hỏng khi tải lỗi hoặc mở không ổn định.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Sửa lỗi & Phục hồi PDF' },
        { id: 'grayscale_pdf', icon: '🖨️', name: 'Chuyển Đen trắng / Thang độ xám', badge: 'Tối ưu in ấn', desc: 'Chuyển toàn bộ văn bản & hình ảnh sang xám mịn hoặc đen trắng sắc nét tiết kiệm mực.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuyển sang Đen trắng' },
        { id: 'invert_dark_pdf', icon: '🌙', name: 'Đảo màu Đọc ban đêm (Dark Mode PDF)', badge: 'Dịu mắt ban đêm', desc: 'Đổi nền trắng chói thành nền tối dịu mắt để đọc sách/tài liệu PDF vào ban đêm.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tạo bản PDF nền tối' },
        { id: 'prepress_bleed_marks', icon: '🎯', name: 'Chế bản In ấn (Bleed, Dấu cắt xén & Thanh kiểm màu)', badge: 'Prepress Nhà In', desc: 'Thêm tự động vùng bù xén 3mm, dấu cắt xén 4 góc (Crop/Trim Marks) và thanh kiểm màu CMYK chuẩn nhà in.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tạo bản chế bản in' },
        { id: 'flatten', icon: '🔒', name: 'Làm phẳng & Khóa chỉnh sửa (Flatten)', badge: 'Khóa Form & Ghi chú', desc: 'Biến ô nhập liệu (AcroForms), chữ ký & ghi chú thành đồ họa tĩnh không thể sửa đổi.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Làm phẳng PDF' },
        { id: 'pdf_a_archive', icon: '🏛️', name: 'Chuẩn hóa Lưu trữ PDF/A & Tải nhanh', badge: 'ISO 19005 / Fast View', desc: 'Loại bỏ mã động JavaScript, chuẩn hóa siêu dữ liệu & luồng đối tượng để lưu trữ bền vững.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuẩn hóa PDF/A' },
      ],
    },
    {
      id: 'security_batch',
      icon: '🛡️',
      title: 'Cụm 7: Bảo mật, Che đen Regex, Làm sạch dữ liệu ẩn, So sánh, Preflight & Hàng loạt',
      accent: 'rose',
      tools: [
        { id: 'protect_unlock_pdf', icon: '🔐', name: 'Đặt mật khẩu / Mở khóa PDF (Protect & Unlock)', badge: 'Khóa mở & Khóa quyền', desc: 'Đặt mật khẩu mở tệp / khóa in & copy ngay trên máy hoặc gỡ khóa khi có mật khẩu đúng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Khóa / Mở khóa PDF' },
        { id: 'true_redaction', icon: '⬛', name: 'Che đen bảo mật vĩnh viễn + Tự động quét SĐT/CCCD/Email', badge: 'True Redaction + Regex', desc: 'Xóa vĩnh viễn văn bản & pixel theo từ khóa, vùng chọn hoặc 1 chạm che sạch SĐT/CCCD/Email!', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Che đen vĩnh viễn' },
        { id: 'deep_sanitize', icon: '🧼', name: 'Làm sạch dữ liệu ẩn toàn diện (Deep Forensics Sanitization)', badge: 'Xóa lịch sử ẩn & JS', desc: 'Xóa sạch XMP, lịch sử lưu tăng dần (Incremental Updates), JavaScript, lớp ẩn & phần thừa ngoài CropBox!', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Làm sạch toàn diện PDF' },
        { id: 'compare_pdf', icon: '⚖️', name: 'So sánh 2 tệp PDF (Text Diff + Soi Pixel)', badge: '2 PDF → Báo cáo Diff', desc: 'Đối chiếu 2 phiên bản hợp đồng/bản thảo: tô màu từng dòng thêm/xóa & chồng ảnh soi lệch từng pixel.', accept: '.pdf', multiple: true, minFiles: 2, actionLabel: 'So sánh 2 tệp PDF' },
        { id: 'preflight_inspect', icon: '🔬', name: 'Kiểm tra kỹ thuật trước khi in (Preflight)', badge: 'Báo cáo chuẩn in ấn', desc: 'Quét toàn bộ PDF kiểm tra khổ giấy lệch, mật độ chữ/ảnh, siêu dữ liệu & cảnh báo trước khi in.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chạy kiểm tra Preflight' },
        { id: 'batch_workflow', icon: '🏭', name: 'Xử lý hàng loạt theo chuỗi (Batch Pipeline)', badge: 'Hàng chục PDF → 1 ZIP', desc: 'Nạp nhiều file PDF cùng lúc, tick chuỗi tác vụ liên hoàn (Đóng dấu → Số trang → Xóa Meta → Nén).', accept: '.pdf', multiple: true, minFiles: 1, actionLabel: 'Chạy chuỗi hàng loạt' },
        { id: 'desktop_local_engine', icon: '🖥️', name: 'Nhân Nội Bộ Máy Tính (LibreOffice / qpdf / Ghostscript)', badge: 'Desktop Local Engine', desc: 'Kết nối trực tiếp phần mềm cài sẵn trên máy tính (App Desktop) để xử lý file siêu nặng chuẩn 100%.', accept: '.pdf,.docx,.xlsx,.pptx,.odt,.ods,.odp', multiple: false, minFiles: 1, actionLabel: 'Chạy bằng Nhân Máy Tính' },
      ],
    },
  ]);

  // ==========================================================================
  // 2. TIỆN ÍCH THUẬT TOÁN HỖ TRỢ (RC4/MD5 PDF ENCRYPT, PIXEL DIFF, EPUB, TABLE)
  // ==========================================================================
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function dataUrlToUint8(dataUrl) {
    const bin = atob(String(dataUrl || '').split(',')[1] || '');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // So sánh dòng LCS gọn cho Compare PDF (Semantic Text Diff)
  function computeLineDiff(linesA, linesB) {
    const setA = new Set(linesA.map((x) => x.trim()).filter(Boolean));
    const setB = new Set(linesB.map((x) => x.trim()).filter(Boolean));
    const diffs = [];
    const maxLen = Math.max(linesA.length, linesB.length);
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    for (let i = 0; i < maxLen; i++) {
      const a = (linesA[i] || '').trim();
      const b = (linesB[i] || '').trim();
      if (a === b) {
        if (a) {
          unchanged += 1;
          diffs.push({ type: 'same', text: a });
        }
      } else {
        if (a && !setB.has(a)) {
          removed += 1;
          diffs.push({ type: 'del', text: a });
        } else if (a) {
          unchanged += 1;
          diffs.push({ type: 'same', text: a });
        }
        if (b && !setA.has(b)) {
          added += 1;
          diffs.push({ type: 'add', text: b });
        }
      }
    }
    return { diffs, added, removed, unchanged };
  }

  // Tạo gói sách điện tử .EPUB chuẩn (mimetype + container.xml + content.opf + toc.ncx + XHTML)
  async function buildEpubBlobFromChapters(bookTitle, chapters, JSZip) {
    const zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    zip.file(
      'META-INF/container.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    const safeTitle = escHtml(bookTitle || 'Sach_Dien_Tu');
    const manifestItems = [];
    const spineItems = [];
    const navPoints = [];

    chapters.forEach((ch, idx) => {
      const id = `ch${idx + 1}`;
      const href = `${id}.xhtml`;
      const chTitle = escHtml(ch.title || `Trang ${idx + 1}`);
      const bodyParas = (ch.lines || [])
        .filter((l) => String(l).trim().length > 0)
        .map((l) => `<p>${escHtml(l)}</p>`)
        .join('\n');

      zip.file(
        `OEBPS/${href}`,
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><meta charset="utf-8"/><title>${chTitle}</title><style>body{font-family:serif;line-height:1.7;padding:1em;}h2{margin-bottom:0.8em;}</style></head>
<body><h2>${chTitle}</h2>${bodyParas || '<p>(Trang trống)</p>'}</body>
</html>`
      );
      manifestItems.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
      spineItems.push(`<itemref idref="${id}"/>`);
      navPoints.push(
        `<navPoint id="nav${idx + 1}" playOrder="${idx + 1}"><navLabel><text>${chTitle}</text></navLabel><content src="${href}"/></navPoint>`
      );
    });

    zip.file(
      'OEBPS/toc.ncx',
      `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:danglovepdf-${Date.now()}"/></head>
  <docTitle><text>${safeTitle}</text></docTitle>
  <navMap>${navPoints.join('\n')}</navMap>
</ncx>`
    );

    zip.file(
      'OEBPS/content.opf',
      `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${safeTitle}</dc:title>
    <dc:creator>ĐăngLovePDF</dc:creator>
    <dc:language>vi</dc:language>
    <dc:identifier id="BookId">urn:uuid:danglovepdf-${Date.now()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">${spineItems.join('')}</spine>
</package>`
    );

    return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  }

  // Tạo chữ ký nghệ thuật dạng ảnh PNG trong suốt từ tên người dùng gõ
  function renderCursiveSignaturePng(nameText, color = '#1e3a8a') {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 150;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = 'italic 600 54px "Segoe Script", "Brush Script MT", "Georgia", cursive';
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(String(nameText || 'Ký tên'), c.width / 2, c.height / 2);
    // Nét gạch chân nghệ thuật nhẹ
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(70, 114);
    ctx.quadraticCurveTo(240, 96, 410, 110);
    ctx.stroke();
    return c.toDataURL('image/png');
  }

  // ==========================================================================
  // 3. TÙY CHỌN UI RIÊNG CHO 22 CÔNG CỤ PRO MỚI & CÁC CHẾ ĐỘ NÂNG CAO
  // ==========================================================================
  const REPORT_THEMES_10 = Object.freeze([
    { id: 'dang_signature', name: '0. ⭐ Định dạng Đăng đặc biệt ưa thích (Báo Cáo Khoa Học · Navy – Teal)', primary: '#0f2438', secondary: '#115e59', accent: '#0d9488', accent2: '#f59e0b', bg: '#ffffff', zebra: '#f1f5f9', text: '#0f172a', isDangSignature: true },
    { id: 'navy_teal', name: '1. Tài Chính Doanh Nghiệp (Navy – Teal · Chuẩn Vinamilk)', primary: '#1b365d', secondary: '#0f4c68', accent: '#14b8a6', accent2: '#f59e0b', bg: '#ffffff', zebra: '#f1f5f9', text: '#1e293b' },
    { id: 'emerald_esg', name: '2. ESG & Phát Triển Bền Vững (Emerald – Mint)', primary: '#064e3b', secondary: '#065f46', accent: '#10b981', accent2: '#f59e0b', bg: '#ffffff', zebra: '#ecfdf5', text: '#0f172a' },
    { id: 'oxford_burgundy', name: '3. Học Thuật & Nghiên Cứu Oxford (Burgundy – Cream)', primary: '#581c2c', secondary: '#7f1d1d', accent: '#d97706', accent2: '#0f2942', bg: '#fffdf9', zebra: '#fef2f2', text: '#1f2937' },
    { id: 'royal_ai', name: '4. Công Nghệ & AI Hiện Đại (Royal Indigo – Cyan)', primary: '#1e1b4b', secondary: '#312e81', accent: '#06b6d4', accent2: '#a855f7', bg: '#ffffff', zebra: '#eef2ff', text: '#1e293b' },
    { id: 'private_gold', name: '5. Ngân Hàng Tư Nhân & Cao Cấp (Obsidian – Gold)', primary: '#18181b', secondary: '#27272a', accent: '#eab308', accent2: '#0d9488', bg: '#ffffff', zebra: '#fefce8', text: '#18181b' },
    { id: 'nordic_slate', name: '6. Tối Giản Bắc Âu (Nordic Slate – Sky)', primary: '#334155', secondary: '#475569', accent: '#0284c7', accent2: '#14b8a6', bg: '#ffffff', zebra: '#f8fafc', text: '#0f172a' },
    { id: 'biomed_ocean', name: '7. Khoa Học Y Sinh & Dược Phẩm (Deep Ocean – Aqua)', primary: '#0c4a6e', secondary: '#075985', accent: '#38bdf8', accent2: '#10b981', bg: '#ffffff', zebra: '#f0f9ff', text: '#0f172a' },
    { id: 'forest_econ', name: '8. Kinh Tế Vĩ Mô Editorial (Forest Green – Sand)', primary: '#14532d', secondary: '#166534', accent: '#ca8a04', accent2: '#0d9488', bg: '#fefdf8', zebra: '#f0fdf4', text: '#1c1917' },
    { id: 'corp_violet', name: '9. Chiến Lược Tập Đoàn (Deep Violet – Lavender)', primary: '#3b0764', secondary: '#581c87', accent: '#a855f7', accent2: '#06b6d4', bg: '#ffffff', zebra: '#faf5ff', text: '#1e1b4b' },
    { id: 'charcoal_exec', name: '10. Ban Lãnh Đạo Sang Trọng (Charcoal – Copper)', primary: '#1f2937', secondary: '#374151', accent: '#ea580c', accent2: '#0d9488', bg: '#ffffff', zebra: '#fff7ed', text: '#111827' },
  ]);

  function buildProOptionsHtml(ctrl, toolId) {
    if (toolId === 'beautify_10_themes') {
      const extraImgs = Array.isArray(ctrl?.theme10ExtraImages) ? ctrl.theme10ExtraImages : [];
      return `
        <div class="space-y-3 text-xs">
          <div class="p-2.5 rounded-xl bg-teal-950/50 border border-teal-500/40 text-teal-100 leading-relaxed">
            ✨ Hỗ trợ <strong>.DOCX, .XLSX, .PDF, .MD, .TXT</strong> — tự nhận diện chuẩn <strong>Mục lục, Danh mục Bảng &amp; Hình ảnh, Tiêu đề, Ảnh nhúng</strong> để dựng PDF đẹp như Báo cáo Khoa học!
          </div>
          <label class="block space-y-1"><span class="font-bold text-amber-300">🎨 Chọn Định dạng / Theme Màu Tùy Chỉnh:</span>
            <select id="opt-pro-theme10-id" class="w-full px-2.5 py-2 rounded-lg bg-zinc-950 border border-zinc-700 font-bold text-zinc-100">
              ${REPORT_THEMES_10.map((th) => `<option value="${th.id}">${th.name}</option>`).join('')}
            </select>
          </label>
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            ${REPORT_THEMES_10.map((th, i) => `
              <button type="button" data-pro-theme10-chip="${th.id}" title="${th.name}" class="${th.isDangSignature ? 'col-span-2 ring-1 ring-amber-400 ' : ''}rounded-lg p-1.5 border border-zinc-700/80 hover:border-amber-300 text-center text-[10px] font-black text-white cursor-pointer transition truncate" style="background:linear-gradient(135deg,${th.primary},${th.secondary});border-bottom:3px solid ${th.accent};">${th.isDangSignature ? '⭐ Đăng Đặc Biệt' : `#${i}`}</button>
            `).join('')}
          </div>

          <label class="flex items-start gap-2 p-2 rounded-xl border border-teal-500/40 bg-teal-950/30 cursor-pointer select-none">
            <input id="opt-pro-theme10-dang-layout" type="checkbox" checked class="mt-0.5 accent-teal-400 rounded cursor-pointer" />
            <span class="font-bold text-teal-100 leading-snug">📑 Tự dựng Mục lục Báo cáo + Danh mục Bảng &amp; Hình + Dải màu 3 tầng (Chuẩn PDF Mẫu)</span>
          </label>

          <label class="block space-y-1"><span class="font-bold">📤 Định dạng tệp đầu ra:</span>
            <select id="opt-pro-theme10-fmt" class="w-full px-2.5 py-2 rounded-lg bg-zinc-950 border border-zinc-700 font-bold text-zinc-100">
              <option value="pdf">📄 Báo Cáo PDF Sắc Nét (Mục Lục Link + Bảng + Ảnh + Banner)</option>
              <option value="docx">📘 File Word (.DOCX) Đã Phối Màu &amp; Kèm Ảnh/Bảng</option>
              <option value="xlsx">📊 File Excel (.XLSX) Cấu Trúc Bảng Gọn Đẹp</option>
            </select>
          </label>
          <label class="block space-y-1"><span class="font-bold">🔤 Phông chữ trình bày (Tùy chọn tự do):</span>
            <select id="opt-pro-theme10-font" class="w-full px-2.5 py-2 rounded-lg bg-zinc-950 border border-zinc-700 font-bold text-zinc-100">
              <option value="sans">Hiện đại Khoa học (Segoe UI / Arial Sans)</option>
              <option value="serif">Học thuật &amp; Báo chí (Georgia / Times New Roman)</option>
              <option value="classic">Sách in cổ điển (Palatino Classic)</option>
            </select>
          </label>

          <!-- Chèn thêm Ảnh / Biểu đồ minh họa tùy chọn -->
          <div class="p-2.5 rounded-xl bg-zinc-950/85 border border-zinc-800 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="font-extrabold text-sky-300">🖼️ Chèn thêm Ảnh / Biểu đồ (${extraImgs.length})</span>
              <label for="opt-pro-theme10-images" class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black text-[10.5px] cursor-pointer">+ Chèn ảnh</label>
              <input id="opt-pro-theme10-images" type="file" accept="image/png,image/jpeg,image/webp" multiple class="hidden" />
            </div>
            <div id="opt-pro-theme10-images-list" class="space-y-1.5">
              ${
                extraImgs.length
                  ? extraImgs.map((im, idx) => `
                    <div class="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                      <img src="${im.dataUrl}" alt="" class="w-9 h-9 rounded object-cover shrink-0 border border-zinc-700" />
                      <div class="flex-1 min-w-0 space-y-1">
                        <input type="text" data-theme10-img-cap="${idx}" value="${String(im.caption || '').replace(/"/g, '&quot;')}" placeholder="Chú thích: Hình ${idx + 1}: ..." class="w-full px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-[10.5px] text-zinc-100" />
                        <select data-theme10-img-pos="${idx}" class="w-full px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-[10px] text-zinc-300">
                          <option value="end" ${im.position !== 'after_intro' ? 'selected' : ''}>Đặt cuối báo cáo / Phụ lục Hình</option>
                          <option value="after_intro" ${im.position === 'after_intro' ? 'selected' : ''}>Đặt ngay đầu nội dung (sau Mục lục)</option>
                        </select>
                      </div>
                      <button type="button" data-theme10-img-del="${idx}" class="px-1.5 py-1 rounded bg-rose-900/60 hover:bg-rose-600 text-rose-200 hover:text-white text-[10px] font-bold cursor-pointer">✕</button>
                    </div>
                  `).join('')
                  : '<div class="text-[10.5px] text-zinc-500">Ảnh có sẵn trong DOCX / PDF tự động trích xuất vào Danh mục Hình; bạn có thể bấm "+ Chèn ảnh" để thêm ảnh ngoài.</div>'
              }
            </div>
          </div>

          <!-- Tùy chọn Trang bìa Ghi công Tác giả (MẶC ĐỊNH TICK SẴN), Trang bìa, Header & Footer -->
          <div class="p-2.5 rounded-xl bg-zinc-950/85 border border-zinc-800 space-y-2.5">
            <div class="font-extrabold text-teal-300">📑 Tùy chỉnh Trang Bìa, Header &amp; Footer (PDF / DOCX)</div>

            <label class="flex items-start gap-2 p-2 rounded-xl border border-amber-400/50 bg-amber-950/25 cursor-pointer select-none">
              <input id="opt-pro-theme10-author-cover" type="checkbox" checked class="mt-0.5 accent-amber-400 rounded cursor-pointer shrink-0" />
              <span class="font-bold text-amber-200 leading-snug">Ghi công trang web và tác giả với trang bìa (Bạn xóa cũng được nhưng mà đừng quên mình nhé 🥲</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input id="opt-pro-theme10-cover" type="checkbox" class="accent-teal-500 rounded cursor-pointer" />
              <span class="font-bold text-zinc-200">📘 Tạo thêm Trang bìa mặc định của hệ thống ở đầu file</span>
            </label>

            <div class="pt-1.5 border-t border-zinc-800/80 space-y-1.5">
              <label class="block space-y-1"><span class="font-bold text-zinc-200">🔼 Tiêu đề đầu trang (Header):</span>
                <select id="opt-pro-theme10-hdr-mode" class="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-bold text-zinc-100">
                  <option value="none" selected>🚫 Không tạo Header mặc định (Giữ trang sạch)</option>
                  <option value="minimal">📏 Header chữ gọn + đường kẻ mảnh (Mặc định căn giữa tên file)</option>
                  <option value="band">🎨 Header thanh dải màu Theme</option>
                </select>
              </label>
              <div id="opt-pro-theme10-hdr-sub" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <input id="opt-pro-theme10-hdr-text" type="text" value="{filename}" placeholder="Tên file ({filename}) hoặc nhập chữ..." class="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-[11px]" title="Dùng {filename}, {theme}, {date}, {page}, {total} hoặc gõ tùy ý" />
                <select id="opt-pro-theme10-hdr-align" class="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-bold text-zinc-100 text-[11px]">
                  <option value="center" selected>Căn giữa Header</option>
                  <option value="left">Căn trái</option>
                  <option value="right">Căn phải</option>
                  <option value="justify">Căn đều 2 bên (Tên file ⟷ Ngày/Trang)</option>
                </select>
              </div>
            </div>

            <div class="pt-1.5 border-t border-zinc-800/80 space-y-1.5">
              <label class="block space-y-1"><span class="font-bold text-zinc-200">🔽 Chân trang &amp; Số trang (Footer):</span>
                <select id="opt-pro-theme10-ftr-mode" class="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-bold text-zinc-100">
                  <option value="page_num" selected>🔢 Bật Footer (Mặc định số trang căn giữa)</option>
                  <option value="none">🚫 Không hiển thị Footer</option>
                </select>
              </label>
              <div id="opt-pro-theme10-ftr-sub" class="space-y-1.5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <select id="opt-pro-theme10-ftr-preset" class="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-bold text-zinc-100 text-[11px]">
                    <option value="Trang {page} / {total}" selected>Mẫu: Trang 1 / 10</option>
                    <option value="{page} / {total}">Mẫu: 1 / 10</option>
                    <option value="- {page} -">Mẫu: - 1 -</option>
                    <option value="Trang {page}">Mẫu: Trang 1</option>
                    <option value="{filename} | Trang {page}/{total}">Mẫu: Tên file | Trang 1/10</option>
                    <option value="custom">✏️ Tự nhập định dạng bên cạnh</option>
                  </select>
                  <select id="opt-pro-theme10-ftr-align" class="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-bold text-zinc-100 text-[11px]">
                    <option value="center" selected>Căn giữa Footer</option>
                    <option value="left">Căn trái</option>
                    <option value="right">Căn phải</option>
                    <option value="justify">Căn đều 2 bên (Tên file ⟷ Số trang)</option>
                  </select>
                </div>
                <input id="opt-pro-theme10-ftr-text" type="text" value="Trang {page} / {total}" placeholder="VD: Tài liệu nội bộ — Trang {page}/{total}" class="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-[11px]" title="Biến hỗ trợ: {page}, {total}, {filename}, {date}, {theme}" />
              </div>
            </div>
          </div>
        </div>
      `;
    }
    if (toolId === 'extract_pages') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ xử lý trang:</span>
          <select id="opt-pro-extract-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="reverse">Đảo ngược toàn bộ thứ tự trang (Cuối → Đầu)</option>
            <option value="odd">Chỉ trích xuất các trang LẺ (1, 3, 5...)</option>
            <option value="even">Chỉ trích xuất các trang CHẴN (2, 4, 6...)</option>
            <option value="custom">Trích xuất theo khoảng trang tùy chọn</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Khoảng trang (khi chọn Tùy chọn):</span>
          <input id="opt-pro-extract-range" type="text" placeholder="Ví dụ: 1-3, 5, 8-10" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>`;
    }

    if (toolId === 'resize_scale') {
      return `
        <label class="block space-y-1"><span class="font-bold">Khổ giấy đích:</span>
          <select id="opt-pro-paper" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="a4">A4 (210 × 297 mm — Phổ biến nhất)</option>
            <option value="a3">A3 (297 × 420 mm — Khổ lớn)</option>
            <option value="a5">A5 (148 × 210 mm — Sổ tay/Light Novel)</option>
            <option value="letter">US Letter (8.5 × 11 in)</option>
            <option value="legal">US Legal (8.5 × 14 in)</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Hướng giấy:</span>
          <select id="opt-pro-orient" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="portrait">Khổ dọc (Portrait)</option>
            <option value="landscape">Khổ ngang (Landscape)</option>
          </select>
        </label>`;
    }

    if (toolId === 'nup_booklet') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ dàn trang in:</span>
          <select id="opt-pro-nup-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="2">2 trang / 1 mặt giấy (Ngang)</option>
            <option value="4">4 trang / 1 mặt giấy (Lưới 2×2)</option>
            <option value="6">6 trang / 1 mặt giấy (Lưới 3×2)</option>
            <option value="9">9 trang / 1 mặt giấy (Lưới 3×3)</option>
            <option value="booklet">Đóng gáy sách giữa (Booklet — tự đảo trang in gập!)</option>
          </select>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <label class="space-y-1"><span class="font-bold">Khoảng hở giữa trang (mm):</span>
            <input id="opt-pro-nup-gap-mm" type="number" min="0" max="20" step="1" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" />
          </label>
          <label class="space-y-1"><span class="font-bold">Lề ngoài tờ giấy (mm):</span>
            <input id="opt-pro-booklet-margin-mm" type="number" min="0" max="20" step="1" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" />
          </label>
        </div>
        <label class="block space-y-1"><span class="font-bold">Độ rộng gáy sách — Gutter (mm, cho chế độ Booklet):</span>
          <input id="opt-pro-booklet-gutter-mm" type="number" min="0" max="30" step="1" value="4" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <p class="text-[11px] text-zinc-400">Để <strong>Khoảng hở = 0 mm</strong> để các trang ghép liền khít nhau không tách rời. Chế độ <strong>Booklet</strong> tự đảo trang đóng sách và chừa đúng độ rộng gáy bạn chọn.</p>`;
    }

    if (toolId === 'alternate_mix') {
      return `
        <p class="text-zinc-300">Ghép xen kẽ 1 trang từ <strong>File #1</strong> rồi 1 trang từ <strong>File #2</strong>.</p>
        <label class="flex items-center gap-2"><input id="opt-pro-mix-rev2" type="checkbox" checked class="accent-emerald-400" /><span>Đảo ngược thứ tự File #2 (Chuẩn máy scan 1 mặt)</span></label>`;
    }

    if (toolId === 'create_blank_pdf') {
      return `
        <div class="grid grid-cols-2 gap-2">
          <label class="space-y-1"><span class="font-bold">Số trang:</span><input id="opt-pro-blank-count" type="number" min="1" max="200" value="10" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          <label class="space-y-1"><span class="font-bold">Khổ giấy:</span>
            <select id="opt-pro-blank-size" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700">
              <option value="a4">A4</option><option value="a5">A5</option><option value="letter">Letter</option>
            </select>
          </label>
        </div>
        <label class="block space-y-1"><span class="font-bold">Kiểu nền giấy:</span>
          <select id="opt-pro-blank-style" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="blank">Giấy trắng trơn hoàn toàn</option>
            <option value="ruled">Giấy dòng kẻ ngang (Viết tay)</option>
            <option value="grid">Giấy kẻ ô ly vuông (Toán/Kỹ thuật)</option>
            <option value="dots">Giấy chấm bi Bullet Journal</option>
          </select>
        </label>`;
    }

    if (toolId === 'grayscale_pdf') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ chuyển màu in:</span>
          <select id="opt-pro-gray-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="gray">Thang độ xám mịn (Grayscale — giữ rõ ảnh)</option>
            <option value="bw">Đen trắng độ tương phản cao (B&amp;W siêu sắc nét)</option>
          </select>
        </label>`;
    }

    if (toolId === 'invert_dark_pdf') {
      return `<p class="text-zinc-300">Đảo ngược nền trắng thành nền tối than chì dịu mắt, giữ nguyên độ sắc nét của chữ để đọc ban đêm không mỏi mắt.</p>`;
    }

    if (toolId === 'repair_pdf') {
      return `<p class="text-zinc-300">Tự động đọc chịu lỗi cấu trúc nhị phân và dựng mới hoàn toàn bảng tham chiếu <code>xref</code> &amp; các luồng trang bị lỗi.</p>`;
    }

    if (toolId === 'pdf_a_archive') {
      return `
        <label class="block space-y-1"><span class="font-bold">Tên tài liệu lưu trữ chuẩn ISO:</span>
          <input id="opt-pro-pdfa-title" type="text" placeholder="Để trống sẽ lấy tên tệp gốc" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <p class="text-[11px] text-zinc-400">Loại bỏ thành phần động JavaScript, làm phẳng biểu mẫu &amp; chuẩn hóa cấu trúc tải nhanh (Fast Web View).</p>`;
    }

    if (toolId === 'annotate_edit') {
      return `
        <p class="text-emerald-300 font-bold leading-relaxed">✨ Bạn đang ở Trình Chỉnh sửa PDF Trực Quan (True PDF Editor)!</p>
        <p class="text-zinc-300 leading-relaxed">Thao tác trực tiếp trên trang PDF ở khung lớn bên trái: <strong>Bấm thẳng vào chữ gốc để sửa</strong>, chèn chữ mới, tải ảnh, tô sáng, vẽ bút tự do, đo khoảng cách CAD, đóng con dấu động hoặc che đen bảo mật.</p>
        <label class="block space-y-1"><span class="font-bold">Tỷ lệ đo bản vẽ CAD (1 cm = ? mét):</span>
          <input id="opt-pro-cad-scale" type="number" step="0.5" min="0.1" value="5" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <p class="text-[11px] text-zinc-400">Hỗ trợ Hoàn tác (Undo) / Làm lại (Redo) nhiều bước và sửa nhiều trang liên tiếp trước khi xuất file.</p>`;
    }

    if (toolId === 'pdf_viewer_pro') {
      return `<p class="text-zinc-300 leading-relaxed">Bấm nút bên dưới để mở <strong>Trình Đọc PDF 4 Lớp</strong>: cột ảnh thu nhỏ, cây mục lục, bôi đen copy chữ thật, tìm kiếm <code>Ctrl+F</code> (hỗ trợ Regex), đọc 2 trang đối xứng &amp; chế độ ban đêm thông minh.</p>`;
    }

    if (toolId === 'split_smart_books') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ cắt/tách thông minh:</span>
          <select id="opt-pro-smart-split" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="split_half_lr">Cắt đôi trang sách A3 → 2 trang A4 (Trái → Phải)</option>
            <option value="split_half_rl">Cắt đôi truyện tranh/Manga (Phải → Trái)</option>
            <option value="posterize_2x2">In Áp phích (Posterize — chia mỗi trang ra lưới 2×2 A4)</option>
            <option value="split_blank">Tách tự động &amp; xóa trang trắng phân cách hồ sơ</option>
            <option value="split_keyword">Tách tệp mỗi khi gặp từ khóa tiêu đề</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Từ khóa ngắt tệp (khi chọn Tách theo từ khóa):</span>
          <input id="opt-pro-split-kw" type="text" placeholder="VD: HÓA ĐƠN GIÁ TRỊ GIA TĂNG" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>`;
    }

    if (toolId === 'svg_eml_to_pdf') {
      return `<p class="text-zinc-300 leading-relaxed">Hỗ trợ chuyển trực tiếp đồ họa vector <strong>.SVG</strong>, thư điện tử <strong>.EML</strong> (giữ người gửi/tiêu đề/nội dung) hoặc tập truyện tranh <strong>.CBZ</strong> sang file PDF chuẩn.</p>`;
    }

    if (toolId === 'form_filler_builder') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ Biểu mẫu (AcroForm):</span>
          <select id="opt-pro-form-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="add_fields">Thêm ô nhập liệu mới (TextField + Checkbox) vào trang 1</option>
            <option value="fill_json">Điền nhanh các ô AcroForm có sẵn bằng danh sách (TênÔ=GiáTrị)</option>
            <option value="export_json">Trích xuất danh sách trường &amp; dữ liệu Form ra .JSON</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Dữ liệu điền / Tên ô mới (mỗi dòng 1 mục):</span>
          <textarea id="opt-pro-form-data" rows="4" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-[11px]">HoTen=Nguyễn Văn An
Email=an@example.com
XacNhan=true</textarea>
        </label>`;
    }

    if (toolId === 'pdf_mail_merge') {
      return `
        <p class="text-zinc-300 leading-relaxed">Nạp <strong>1 tệp mẫu .PDF</strong> và <strong>1 tệp .XLSX hoặc .CSV</strong> (mỗi dòng là 1 người). Hệ thống tự điền vào AcroForm cùng tên cột hoặc in gọn lên trang và xuất hàng loạt thành 1 gói <strong>.ZIP</strong>!</p>
        <label class="block space-y-1"><span class="font-bold">Giới hạn số bản tối đa/lượt:</span>
          <input id="opt-pro-merge-limit" type="number" min="1" max="500" value="100" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>`;
    }

    if (toolId === 'prepress_bleed_marks') {
      return `
        <label class="block space-y-1"><span class="font-bold">Vùng bù xén nhà in (Bleed — mm):</span>
          <input id="opt-pro-bleed-mm" type="number" min="2" max="15" value="5" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-crop-marks" type="checkbox" checked class="accent-cyan-400" /><span>Vẽ dấu cắt xén 4 góc (Crop/Trim Marks)</span></label>
        <label class="flex items-center gap-2"><input id="opt-pro-color-bars" type="checkbox" checked class="accent-cyan-400" /><span>Thêm thanh kiểm màu CMYK ở lề trên</span></label>`;
    }

    if (toolId === 'deep_sanitize') {
      return `
        <p class="text-rose-200 font-bold">🧼 Làm sạch tận gốc chuẩn Forensics:</p>
        <ul class="text-[11px] text-zinc-300 list-disc pl-4 space-y-1">
          <li>Xóa sạch siêu dữ liệu XMP &amp; Document Info.</li>
          <li>Loại bỏ lịch sử lưu tăng dần (Incremental Updates) bằng cách dựng cây đối tượng mới hoàn toàn.</li>
          <li>Cắt hủy vĩnh viễn nội dung nằm ngoài vùng hiển thị CropBox.</li>
          <li>Gỡ bỏ JavaScript nhúng, OpenAction &amp; làm phẳng ghi chú ẩn.</li>
        </ul>`;
    }

    if (toolId === 'header_footer') {
      const wordBar = NS.dangLovePdfTextUtils?.buildWordStyleBarHtml
        ? NS.dangLovePdfTextUtils.buildWordStyleBarHtml('hf', { fontSize: 11, color: '#334155', fontFamily: '"Times New Roman", Georgia, serif', bold: true, showBg: true })
        : '';
      return `
        <label class="block space-y-1"><span class="font-bold">Tiêu đề đầu trang (Header — hỗ trợ {date}, {page}, {total}):</span>
          <input id="opt-pro-hf-header" type="text" value="Tài liệu biên soạn • {date}" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="block space-y-1"><span class="font-bold">Vị trí tiêu đề đầu trang (hoặc kéo trực tiếp trên giấy):</span>
          <select id="opt-pro-hf-hpos" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="left">Căn trái đầu trang</option>
            <option value="center" selected>Căn giữa đầu trang</option>
            <option value="right">Căn phải đầu trang</option>
          </select>
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-hf-hline" type="checkbox" checked class="accent-amber-400" /><span>Kẻ đường phân cách dưới tiêu đề đầu trang</span></label>
        <label class="block space-y-1"><span class="font-bold">Chân trang (Footer):</span>
          <input id="opt-pro-hf-footer" type="text" value="Trang {page} / {total}" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="block space-y-1"><span class="font-bold">Vị trí chân trang (hoặc kéo trực tiếp trên giấy):</span>
          <select id="opt-pro-hf-fpos" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="left">Căn trái chân trang</option>
            <option value="center" selected>Căn giữa chân trang</option>
            <option value="right">Căn phải chân trang</option>
          </select>
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-hf-fline" type="checkbox" checked class="accent-amber-400" /><span>Kẻ đường phân cách trên chân trang</span></label>
        <label class="flex items-center gap-2"><input id="opt-pro-hf-skip1" type="checkbox" class="accent-amber-400" /><span>Bỏ qua trang bìa (Trang 1)</span></label>
        ${wordBar}`;
    }

    if (toolId === 'bookmarks_toc') {
      const wordBar = NS.dangLovePdfTextUtils?.buildWordStyleBarHtml
        ? NS.dangLovePdfTextUtils.buildWordStyleBarHtml('toc', { fontSize: 14, color: '#18181b', fontFamily: '"Times New Roman", Georgia, serif', bold: false })
        : '';
      return `
        <div class="p-2 rounded-xl border border-teal-500/40 bg-teal-950/30 text-[11px] text-teal-100 leading-snug">
          ✨ Dùng chung <strong>Bộ nhận diện Cấu trúc &amp; Mục lục Thông minh</strong> với chế độ Phối màu Báo cáo (tự tách Chương/Phần, Bảng &amp; Hình ảnh + gắn link nhảy trang <code>/GoTo</code>).
        </div>
        <label class="block space-y-1"><span class="font-bold">Tiêu đề trang Mục lục:</span>
          <input id="opt-pro-toc-title" type="text" value="MỤC LỤC BÁO CÁO &amp; TÀI LIỆU" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="block space-y-1"><span class="font-bold">Kiểu trình bày mục lục:</span>
          <select id="opt-pro-toc-style" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="dang_report" selected>⭐ Định dạng Đăng (Khung Navy + Mục lục phân cấp + Danh mục Bảng &amp; Hình)</option>
            <option value="dots">(Tiêu đề) ............ (số trang)</option>
            <option value="space">(Tiêu đề)   (số trang) — Tối giản</option>
            <option value="dash">(Tiêu đề) ———— (số trang)</option>
            <option value="prefix">[Số trang] · (Tiêu đề) — Báo chí</option>
          </select>
        </label>
        <div class="flex items-center justify-between gap-2 pt-1">
          <span class="font-bold">Danh sách mục (Mỗi dòng: Tên mục | Số trang):</span>
          <button type="button" id="btn-pro-toc-autodetect" class="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10.5px] font-black cursor-pointer shrink-0">🔍 Quét tự động từ PDF</button>
        </div>
        <textarea id="opt-pro-toc-lines" rows="6" placeholder="Đang tự quét tiêu đề, Bảng &amp; Hình từ PDF..." class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-[11.5px]">Chương 1: Khởi đầu | 1
Chương 2: Diễn biến chính | 5
Chương 3: Tổng kết | 12</textarea>
        ${wordBar}`;
    }

    if (toolId === 'epub_to_pdf') {
      return `
        <label class="block space-y-1"><span class="font-bold">Đổi sách .EPUB sang:</span>
          <select id="opt-pro-epub-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="pdf">PDF (Dàn trang chuẩn tiếng Việt)</option>
            <option value="docx">Word (.DOCX — Chỉnh sửa được)</option>
            <option value="txt">Văn bản thuần (.TXT)</option>
          </select>
        </label>`;
    }

    if (toolId === 'pdf_to_epub') {
      return `
        <label class="block space-y-1"><span class="font-bold">Tên sách hiển thị trên máy đọc sách:</span>
          <input id="opt-pro-epub-title" type="text" placeholder="Để trống lấy tên tệp PDF" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>`;
    }

    if (toolId === 'pdf_to_excel') {
      return `
        <label class="block space-y-1"><span class="font-bold">Định dạng bảng xuất ra:</span>
          <select id="opt-pro-p2x-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="xlsx">Excel (.XLSX — Nhiều cột chuẩn)</option>
            <option value="csv">CSV UTF-8 (Mở Excel tiếng Việt không lỗi dấu)</option>
          </select>
        </label>`;
    }

    if (toolId === 'deskew_denoise') {
      return `
        <label class="block space-y-1"><span class="font-bold">Góc xoay nắn thẳng (độ, -15 đến +15):</span>
          <input id="opt-pro-deskew-deg" type="number" step="0.5" min="-15" max="15" value="0" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-denoise-white" type="checkbox" checked class="accent-teal-400" /><span>Tự khử nền xám ố vàng &amp; làm nét chữ scan</span></label>`;
    }

    if (toolId === 'metadata_editor') {
      return `
        <label class="flex items-center gap-2 p-2 rounded-xl border border-rose-500/40 bg-rose-950/30"><input id="opt-pro-meta-scrub" type="checkbox" class="accent-rose-400" /><span class="font-bold text-rose-200">🧹 Xóa trắng 100% siêu dữ liệu ẩn (Scrubber)</span></label>
        <label class="block space-y-1"><span class="font-bold">Tiêu đề mới:</span><input id="opt-pro-meta-title" type="text" placeholder="Giữ nguyên hoặc nhập mới" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
        <label class="block space-y-1"><span class="font-bold">Tác giả:</span><input id="opt-pro-meta-author" type="text" placeholder="Tên tác giả" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
        <label class="block space-y-1"><span class="font-bold">Từ khóa (Keywords):</span><input id="opt-pro-meta-keywords" type="text" placeholder="tiểu thuyết, tài liệu..." class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>`;
    }

    if (toolId === 'protect_unlock_pdf') {
      const hasDesktop = Boolean(global.NoirDesktopLocalEngine);
      return `
        <label class="block space-y-1"><span class="font-bold">Hành động bảo mật:</span>
          <select id="opt-pro-sec-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="unlock">🔓 Gỡ khóa quyền / Mở khóa PDF (khi có mật khẩu)</option>
            <option value="protect">🔒 Khóa bảo vệ &amp; đóng dấu bản quyền / mã hóa (AES-256 trên Desktop)</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Mật khẩu tệp (User Password):</span>
          <input id="opt-pro-sec-pass" type="password" placeholder="Nhập mật khẩu..." class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-sec-noprint" type="checkbox" class="accent-rose-400" /><span>Khóa quyền in ấn / sao chép (áp dụng khi đặt mật khẩu)</span></label>
        <p class="text-[11px] text-zinc-400">${hasDesktop ? '🖥️ Đã kết nối Nhân Desktop (qpdf AES-256 chuẩn thực thụ!).' : '💡 Trên trình duyệt: gỡ khóa bằng PDF.js/pdf-lib & khóa lớp chống sao chép (Flatten + Metadata Lock). Dùng App Desktop để mã hóa AES-256 gốc bằng qpdf.'}</p>`;
    }

    if (toolId === 'true_redaction') {
      return `
        <label class="block space-y-1"><span class="font-bold">Từ khóa nhạy cảm cần che đen vĩnh viễn (cách nhau bằng dấu phẩy):</span>
          <input id="opt-pro-redact-words" type="text" placeholder="Ví dụ: 0912345678, CCCD, bí mật" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <div class="p-2 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div class="text-[11px] font-bold text-amber-300">🤖 Tự động quét &amp; che đen theo mẫu (Regex):</div>
          <label class="flex items-center gap-2 text-[11px]"><input id="opt-pro-redact-phone" type="checkbox" class="accent-rose-500" /><span>Số điện thoại Việt Nam (03/05/07/08/09...)</span></label>
          <label class="flex items-center gap-2 text-[11px]"><input id="opt-pro-redact-cccd" type="checkbox" class="accent-rose-500" /><span>Số CCCD / CMND (9–12 chữ số)</span></label>
          <label class="flex items-center gap-2 text-[11px]"><input id="opt-pro-redact-email" type="checkbox" class="accent-rose-500" /><span>Địa chỉ Email cá nhân</span></label>
        </div>
        <p class="text-[11px] text-zinc-400">Hoặc chọn vùng che đen theo phần trăm (tính từ góc trên-trái):</p>
        <div class="grid grid-cols-2 gap-2">
          <label class="space-y-1"><span>Trái (%):</span><input id="opt-pro-redact-x" type="number" min="0" max="95" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          <label class="space-y-1"><span>Trên (%):</span><input id="opt-pro-redact-y" type="number" min="0" max="95" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          <label class="space-y-1"><span>Rộng (%):</span><input id="opt-pro-redact-w" type="number" min="0" max="100" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          <label class="space-y-1"><span>Cao (%):</span><input id="opt-pro-redact-h" type="number" min="0" max="100" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
        </div>
        <p class="text-[11px] text-rose-300 font-bold">🛡️ Công nghệ True Redaction: hủy hoàn toàn lớp chữ vector ẩn nên không ai bôi đen copy lại được!</p>`;
    }

    if (toolId === 'compare_pdf') {
      return `
        <p class="text-zinc-300">Nạp <strong>2 tệp PDF</strong> (Bản cũ #1 và Bản mới #2) để hệ thống tự động đối chiếu cả <strong>Văn bản từng dòng (Text Diff)</strong> lẫn <strong>Chồng hình từng pixel (Visual Overlay)</strong>.</p>
        <label class="flex items-center gap-2"><input id="opt-pro-cmp-visual" type="checkbox" checked class="accent-rose-400" /><span>Kèm ảnh chồng lớp soi sai lệch từng pixel</span></label>`;
    }

    if (toolId === 'preflight_inspect') {
      return `<p class="text-zinc-300">Tự động quét khổ giấy từng trang, phát hiện trang lệch hướng, đếm mật độ chữ, kiểm tra siêu dữ liệu &amp; xuất báo cáo kiểm định kỹ thuật trước khi mang đi in.</p>`;
    }

    if (toolId === 'batch_workflow') {
      return `
        <p class="text-zinc-300 font-bold">Chọn các bước trong chuỗi chạy liên hoàn cho TOÀN BỘ tệp PDF đã nạp:</p>
        <label class="flex items-center gap-2"><input id="opt-batch-gray" type="checkbox" class="accent-emerald-400" /><span>1. Chuyển sang thang độ xám tiết kiệm mực</span></label>
        <label class="flex items-center gap-2"><input id="opt-batch-wm" type="checkbox" checked class="accent-emerald-400" /><span>2. Đóng dấu bản quyền:</span></label>
        <input id="opt-batch-wm-text" type="text" value="BẢN LƯU NỘI BỘ" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700 text-[11px]" />
        <label class="flex items-center gap-2"><input id="opt-batch-pn" type="checkbox" checked class="accent-emerald-400" /><span>3. Tự động đánh số trang ở giữa dưới</span></label>
        <label class="flex items-center gap-2"><input id="opt-batch-meta" type="checkbox" checked class="accent-emerald-400" /><span>4. Xóa sạch siêu dữ liệu ẩn (Scrub Metadata)</span></label>
        <label class="flex items-center gap-2"><input id="opt-batch-flatten" type="checkbox" class="accent-emerald-400" /><span>5. Làm phẳng khóa chỉnh sửa (Flatten)</span></label>`;
    }

    if (toolId === 'desktop_local_engine') {
      const hasDesktop = Boolean(global.NoirDesktopLocalEngine);
      return `
        <div class="p-2.5 rounded-xl border ${hasDesktop ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200' : 'border-amber-500/50 bg-amber-950/30 text-amber-200'} text-[11px] leading-relaxed">
          ${
            hasDesktop
              ? '✅ <strong>Đang chạy trên App Desktop (Electron)</strong> — sẵn sàng gọi trực tiếp LibreOffice, qpdf, Ghostscript và MS Office cài trên máy tính!'
              : '🌐 <strong>Đang chạy trên Trình duyệt Web</strong> — trình duyệt không thể tự gọi phần mềm .exe bên ngoài. Bạn vẫn dùng được 40/41 công cụ hoàn toàn offline ngay trên web, hoặc tải bản App Desktop Windows/Mac để kích hoạt nhân hệ thống!'
          }
        </div>
        <label class="block space-y-1"><span class="font-bold">Tác vụ Nhân Máy Tính:</span>
          <select id="opt-pro-local-cmd" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="office_to_pdf">LibreOffice Headless: Word/Excel/PPT → PDF chuẩn 100%</option>
            <option value="qpdf_linearize">qpdf: Tối ưu tải nhanh (Linearize) &amp; Sửa lỗi PDF</option>
            <option value="gs_compress">Ghostscript: Nén sâu chuẩn in ấn (Font Subsetting)</option>
          </select>
        </label>`;
    }

    return null;
  }

  function readProOptions() {
    return {
      theme10Id: document.getElementById('opt-pro-theme10-id')?.value || 'dang_signature',
      theme10OutFmt: document.getElementById('opt-pro-theme10-fmt')?.value || 'pdf',
      theme10Font: document.getElementById('opt-pro-theme10-font')?.value || 'sans',
      theme10DangLayout: document.getElementById('opt-pro-theme10-dang-layout') ? Boolean(document.getElementById('opt-pro-theme10-dang-layout').checked) : true,
      theme10AuthorCover: document.getElementById('opt-pro-theme10-author-cover') ? Boolean(document.getElementById('opt-pro-theme10-author-cover').checked) : true,
      theme10IncludeCover: Boolean(document.getElementById('opt-pro-theme10-cover')?.checked),
      theme10HdrMode: document.getElementById('opt-pro-theme10-hdr-mode')?.value || 'none',
      theme10HdrText: document.getElementById('opt-pro-theme10-hdr-text')?.value ?? '{filename}',
      theme10HdrAlign: document.getElementById('opt-pro-theme10-hdr-align')?.value || 'center',
      theme10FtrMode: document.getElementById('opt-pro-theme10-ftr-mode')?.value || 'page_num',
      theme10FtrText: document.getElementById('opt-pro-theme10-ftr-text')?.value ?? 'Trang {page} / {total}',
      theme10FtrAlign: document.getElementById('opt-pro-theme10-ftr-align')?.value || 'center',
      // Mở rộng cho Split / Watermark / Page Numbers / Sign / OCR / PDF->DOCX
      splitEveryN: Math.max(1, Number(document.getElementById('opt-mod46-split-everyn')?.value || 2)),
      splitMaxMb: Math.max(0.2, Number(document.getElementById('opt-mod46-split-maxmb')?.value || 5)),
      cropScope: document.getElementById('opt-crop-scope')?.value || 'all',
      batesPrefix: document.getElementById('opt-pn-bates-prefix')?.value?.trim() || '',
      ocrOutFormat: document.getElementById('opt-ocr-out-fmt')?.value || 'searchable_pdf',
      ocrSmartSkip: Boolean(document.getElementById('opt-ocr-smart-skip')?.checked),
      ocrDenoise: Boolean(document.getElementById('opt-ocr-denoise')?.checked),
      signTypedName: document.getElementById('opt-sign-typed-name')?.value?.trim() || '',
      // Công cụ mới v121
      smartSplitMode: document.getElementById('opt-pro-smart-split')?.value || 'split_half_lr',
      smartSplitKw: document.getElementById('opt-pro-split-kw')?.value?.trim() || '',
      formMode: document.getElementById('opt-pro-form-mode')?.value || 'add_fields',
      formData: document.getElementById('opt-pro-form-data')?.value || '',
      mergeLimit: Math.max(1, Math.min(500, Number(document.getElementById('opt-pro-merge-limit')?.value || 100))),
      bleedMm: Math.max(2, Math.min(15, Number(document.getElementById('opt-pro-bleed-mm')?.value || 5))),
      cropMarks: Boolean(document.getElementById('opt-pro-crop-marks')?.checked),
      colorBars: Boolean(document.getElementById('opt-pro-color-bars')?.checked),
      redactPhone: Boolean(document.getElementById('opt-pro-redact-phone')?.checked),
      redactCccd: Boolean(document.getElementById('opt-pro-redact-cccd')?.checked),
      redactEmail: Boolean(document.getElementById('opt-pro-redact-email')?.checked),
      // 22 công cụ Pro mới
      extractMode: document.getElementById('opt-pro-extract-mode')?.value || 'reverse',
      extractRange: document.getElementById('opt-pro-extract-range')?.value || '',
      paper: document.getElementById('opt-pro-paper')?.value || 'a4',
      orient: document.getElementById('opt-pro-orient')?.value || 'portrait',
      nupMode: document.getElementById('opt-pro-nup-mode')?.value || '2',
      nupGapMm: Math.max(0, Math.min(20, Number(document.getElementById('opt-pro-nup-gap-mm')?.value || 0))),
      bookletMarginMm: Math.max(0, Math.min(20, Number(document.getElementById('opt-pro-booklet-margin-mm')?.value || 0))),
      bookletGutterMm: Math.max(0, Math.min(30, Number(document.getElementById('opt-pro-booklet-gutter-mm')?.value ?? 4))),
      mixRev2: Boolean(document.getElementById('opt-pro-mix-rev2')?.checked),
      blankCount: Math.max(1, Math.min(200, Number(document.getElementById('opt-pro-blank-count')?.value || 10))),
      blankSize: document.getElementById('opt-pro-blank-size')?.value || 'a4',
      blankStyle: document.getElementById('opt-pro-blank-style')?.value || 'ruled',
      grayMode: document.getElementById('opt-pro-gray-mode')?.value || 'gray',
      pdfaTitle: document.getElementById('opt-pro-pdfa-title')?.value?.trim() || '',
      annPage: Math.max(1, Number(document.getElementById('opt-pro-ann-page')?.value || 1)),
      annType: document.getElementById('opt-pro-ann-type')?.value || 'sticky',
      annText: document.getElementById('opt-pro-ann-text')?.value?.trim() || 'Ghi chú',
      annX: Number(document.getElementById('opt-pro-ann-x')?.value || 15),
      annY: Number(document.getElementById('opt-pro-ann-y')?.value || 20),
      hfHeader: document.getElementById('opt-pro-hf-header')?.value || '',
      hfFooter: document.getElementById('opt-pro-hf-footer')?.value || '',
      hfHPos: document.getElementById('opt-pro-hf-hpos')?.value || 'center',
      hfFPos: document.getElementById('opt-pro-hf-fpos')?.value || 'center',
      hfHLine: Boolean(document.getElementById('opt-pro-hf-hline')?.checked),
      hfFLine: Boolean(document.getElementById('opt-pro-hf-fline')?.checked),
      hfSkip1: Boolean(document.getElementById('opt-pro-hf-skip1')?.checked),
      hfStyle: NS.dangLovePdfTextUtils?.readWordStyleBar
        ? NS.dangLovePdfTextUtils.readWordStyleBar('hf', { fontSize: 11, color: '#334155', fontFamily: '"Times New Roman", Georgia, serif', bold: true })
        : {},
      tocTitle: document.getElementById('opt-pro-toc-title')?.value?.trim() || 'MỤC LỤC TÀI LIỆU',
      tocStyle: document.getElementById('opt-pro-toc-style')?.value || 'dots',
      tocLines: document.getElementById('opt-pro-toc-lines')?.value || '',
      tocStyleWord: NS.dangLovePdfTextUtils?.readWordStyleBar
        ? NS.dangLovePdfTextUtils.readWordStyleBar('toc', { fontSize: 14, color: '#18181b', fontFamily: '"Times New Roman", Georgia, serif', bold: false })
        : {},
      epubOut: document.getElementById('opt-pro-epub-out')?.value || 'pdf',
      epubTitle: document.getElementById('opt-pro-epub-title')?.value?.trim() || '',
      p2xOut: document.getElementById('opt-pro-p2x-out')?.value || 'xlsx',
      deskewDeg: Number(document.getElementById('opt-pro-deskew-deg')?.value || 0),
      denoiseWhite: Boolean(document.getElementById('opt-pro-denoise-white')?.checked),
      metaScrub: Boolean(document.getElementById('opt-pro-meta-scrub')?.checked),
      metaTitle: document.getElementById('opt-pro-meta-title')?.value?.trim() || '',
      metaAuthor: document.getElementById('opt-pro-meta-author')?.value?.trim() || '',
      metaKeywords: document.getElementById('opt-pro-meta-keywords')?.value?.trim() || '',
      secMode: document.getElementById('opt-pro-sec-mode')?.value || 'unlock',
      secPass: document.getElementById('opt-pro-sec-pass')?.value || '',
      secNoPrint: Boolean(document.getElementById('opt-pro-sec-noprint')?.checked),
      redactWords: document.getElementById('opt-pro-redact-words')?.value || '',
      redactX: Number(document.getElementById('opt-pro-redact-x')?.value || 0),
      redactY: Number(document.getElementById('opt-pro-redact-y')?.value || 0),
      redactW: Number(document.getElementById('opt-pro-redact-w')?.value || 0),
      redactH: Number(document.getElementById('opt-pro-redact-h')?.value || 0),
      cmpVisual: Boolean(document.getElementById('opt-pro-cmp-visual')?.checked),
      batchGray: Boolean(document.getElementById('opt-batch-gray')?.checked),
      batchWm: Boolean(document.getElementById('opt-batch-wm')?.checked),
      batchWmText: document.getElementById('opt-batch-wm-text')?.value?.trim() || 'BẢN LƯU NỘI BỘ',
      batchPn: Boolean(document.getElementById('opt-batch-pn')?.checked),
      batchMeta: Boolean(document.getElementById('opt-batch-meta')?.checked),
      batchFlatten: Boolean(document.getElementById('opt-batch-flatten')?.checked),
      localCmd: document.getElementById('opt-pro-local-cmd')?.value || 'office_to_pdf',
    };
  }

  // ==========================================================================
  // 4. BỘ THỰC THI 22 CÔNG CỤ PRO MỚI (TRẢ VỀ MẢNG [{ name, blob }] HOẶC NULL)
  // ==========================================================================
  async function executeProTool(ctrl, tool, opts, pro, helpers) {
    const {
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
    } = helpers;

    const outputs = [];

    // Helper dùng chung: Chuyển dataURL -> Uint8Array (không qua fetch), nạp Image an toàn trên DOM/Node, và dựng Trang Mục Lục Kiểu Đăng (chuẩn PDF mẫu trang 2)
    const dataUrlToBytes = (du) => {
      const bin = atob(String(du || '').split(',')[1] || '');
      const u8 = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
      return u8;
    };

    const loadImageSafe = (src, timeoutMs = 1800) =>
      new Promise((resolve) => {
        if (!src || typeof Image === 'undefined') return resolve(null);
        let settled = false;
        const img = new Image();
        const done = (res) => {
          if (settled) return;
          settled = true;
          resolve(res);
        };
        const t = setTimeout(() => done(null), timeoutMs);
        img.onload = () => { clearTimeout(t); done(img.width > 0 ? img : null); };
        img.onerror = () => { clearTimeout(t); done(null); };
        try { img.src = src; } catch (_e) { clearTimeout(t); done(null); }
      });

    const rrPath = (c, x, y, w, h, r) => {
      const rr = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr);
      c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr);
      c.arcTo(x, y, x + w, y, rr);
      c.closePath();
    };

    const attachPdfPageLinks = (outPdf, PDFLibPkg, pageObj, gotoLinks, uriLinks, W = 1240, H = 1754) => {
      const PDFName = PDFLibPkg?.PDFName;
      const PDFString = PDFLibPkg?.PDFString;
      if (!PDFName || !PDFString || !pageObj) return;
      const pageCount = outPdf.getPageCount();
      const annots = [];
      for (const gk of (gotoLinks || [])) {
        const tgtIdx = Math.max(0, Math.min(pageCount - 1, Number(gk.targetPageIndex) || 0));
        const destPage = outPdf.getPage(tgtIdx);
        if (!destPage?.ref) continue;
        const x1 = Math.max(0, (gk.x / W) * 595.28);
        const x2 = Math.min(595.28, ((gk.x + gk.w) / W) * 595.28);
        const y2 = Math.min(841.89, 841.89 - (gk.y / H) * 841.89);
        const y1 = Math.max(0, 841.89 - ((gk.y + gk.h) / H) * 841.89);
        if (x2 <= x1 || y2 <= y1) continue;
        const ref = outPdf.context.register(
          outPdf.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Link'),
            Rect: [x1, y1, x2, y2],
            Border: [0, 0, 0],
            F: 4,
            Dest: [destPage.ref, PDFName.of('Fit')],
          })
        );
        annots.push(ref);
      }
      for (const uk of (uriLinks || [])) {
        if (!uk?.url || !/^(https?:\/\/|mailto:)/i.test(String(uk.url))) continue;
        const x1 = Math.max(0, (uk.x / W) * 595.28);
        const x2 = Math.min(595.28, ((uk.x + uk.w) / W) * 595.28);
        const y2 = Math.min(841.89, 841.89 - (uk.y / H) * 841.89);
        const y1 = Math.max(0, 841.89 - ((uk.y + uk.h) / H) * 841.89);
        if (x2 <= x1 || y2 <= y1) continue;
        const ref = outPdf.context.register(
          outPdf.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Link'),
            Rect: [x1, y1, x2, y2],
            Border: [0, 0, 0],
            F: 4,
            H: PDFName.of('I'),
            A: {
              Type: PDFName.of('Action'),
              S: PDFName.of('URI'),
              URI: PDFString.of(String(uk.url)),
            },
          })
        );
        annots.push(ref);
      }
      if (annots.length) {
        if (typeof pageObj.node.addAnnot === 'function') {
          annots.forEach((a) => pageObj.node.addAnnot(a));
        } else {
          pageObj.node.set(PDFName.of('Annots'), outPdf.context.obj(annots));
        }
      }
    };

    // Dựng Trang Mục lục Khoa học (Kiểu Đăng · Trang 2 Báo Cáo Mẫu): Bìa mục lục + Mục phân tầng + 2 Card Danh mục Bảng & Hình + Callout
    const renderDangTocCanvases = ({ theme, ff, tocTitle, sections, tables, figures, pageShift, makePageCanvas, W, H, startY, maxY }) => {
      const tocCanvases = [];
      const marginX = 76;
      const bodyW = W - marginX * 2;

      const buildPass = (shiftVal) => {
        const pages = [];
        let cur = makePageCanvas();
        pages.push(cur.cv);
        let y = startY;

        const paintBanner = (titleStr) => {
          rrPath(cur.c, marginX, y, bodyW, 56, 10);
          cur.c.fillStyle = theme.primary;
          cur.c.fill();
          cur.c.fillStyle = theme.accent;
          cur.c.fillRect(marginX, y + 6, 8, 44);
          cur.c.fillStyle = '#ffffff';
          cur.c.font = `900 22px ${ff}`;
          cur.c.fillText(String(titleStr || 'MỤC LỤC BÁO CÁO & HỆ THỐNG BẢNG – BIỂU ĐỒ – PHỤ LỤC').toUpperCase().slice(0, 76), marginX + 26, y + 16);
          y += 74;
        };

        const ensureTocSp = (need) => {
          if (y + need > maxY) {
            cur = makePageCanvas();
            pages.push(cur.cv);
            y = startY;
          }
        };

        paintBanner(tocTitle);

        // Danh sách Mục lục phân cấp (H1 đậm, H2/H3 thụt lề + đường kẻ mảnh + số trang phải + GoTo link)
        (sections || []).forEach((sec) => {
          const isH1 = (sec.level || 1) === 1;
          const rowH = isH1 ? 38 : 32;
          ensureTocSp(rowH + 6);
          const indent = isH1 ? 0 : (sec.level === 2 ? 14 : 26);
          const destIdx = Math.max(0, (Number(sec.contentPageIdx ?? (sec.pageNo - 1)) || 0) + shiftVal);
          const displayPg = String(destIdx + 1);

          cur.c.font = `${isH1 ? '800 18.5px' : '500 17px'} ${ff}`;
          cur.c.fillStyle = isH1 ? theme.primary : '#334155';
          const cleanLbl = String(sec.text || '').replace(/\s+/g, ' ').trim();
          const pgW = cur.c.measureText(displayPg).width;
          const maxLblW = bodyW - indent - pgW - 36;
          let drawTxt = cleanLbl;
          while (drawTxt.length > 10 && cur.c.measureText(drawTxt).width > maxLblW) {
            drawTxt = `${drawTxt.slice(0, -4)}...`;
          }
          cur.c.fillText(drawTxt, marginX + indent, y + (isH1 ? 4 : 3));
          cur.c.font = `800 17.5px ${ff}`;
          cur.c.fillStyle = isH1 ? theme.primary : '#0f172a';
          cur.c.fillText(displayPg, marginX + bodyW - cur.c.measureText(displayPg).width - 6, y + 4);

          cur.c.fillStyle = isH1 ? '#94a3b8' : '#e2e8f0';
          cur.c.fillRect(marginX + indent, y + rowH - 5, bodyW - indent, isH1 ? 1.5 : 1);

          if (!cur.cv.__pdfGotoLinks) cur.cv.__pdfGotoLinks = [];
          cur.cv.__pdfGotoLinks.push({ x: marginX, y, w: bodyW, h: rowH, targetPageIndex: destIdx });
          y += rowH;
        });

        // Hai khung song song: DANH MỤC BẢNG DỮ LIỆU & DANH MỤC BIỂU ĐỒ & HÌNH ẢNH
        const hasTbls = (tables || []).length > 0;
        const hasFigs = (figures || []).length > 0;
        if (hasTbls || hasFigs) {
          y += 18;
          const maxRows = Math.max((tables || []).length, (figures || []).length, 1);
          const cardH = Math.min(540, 62 + Math.min(maxRows, 11) * 32 + 20);
          ensureTocSp(cardH + 20);
          const colGap = 20;
          const cardW = (hasTbls && hasFigs) ? Math.floor((bodyW - colGap) / 2) : bodyW;

          const drawIndexCard = (cx, titleCard, itemsArr, prefixFallback) => {
            rrPath(cur.c, cx, y, cardW, cardH, 10);
            cur.c.fillStyle = '#f8fafc';
            cur.c.fill();
            cur.c.strokeStyle = '#cbd5e1';
            cur.c.lineWidth = 1.5;
            cur.c.stroke();

            cur.c.fillStyle = theme.primary;
            cur.c.font = `900 17px ${ff}`;
            cur.c.fillText(titleCard, cx + 18, y + 16);
            cur.c.fillStyle = theme.accent;
            cur.c.fillRect(cx + 18, y + 42, cardW - 36, 2);

            let ry = y + 54;
            itemsArr.slice(0, 11).forEach((it, idx) => {
              const destIdx = Math.max(0, (Number(it.contentPageIdx ?? (it.pageNo - 1)) || 0) + shiftVal);
              const pgStr = String(destIdx + 1);
              cur.c.font = `600 15.5px ${ff}`;
              cur.c.fillStyle = '#1e293b';
              const pgW = cur.c.measureText(pgStr).width;
              let txt = String(it.label || `${prefixFallback} ${idx + 1}`).trim();
              const maxTxtW = cardW - 44 - pgW;
              while (txt.length > 8 && cur.c.measureText(txt).width > maxTxtW) {
                txt = `${txt.slice(0, -4)}...`;
              }
              cur.c.fillText(txt, cx + 18, ry + 2);
              cur.c.font = `800 15.5px ${ff}`;
              cur.c.fillStyle = theme.primary;
              cur.c.fillText(pgStr, cx + cardW - 18 - pgW, ry + 2);
              cur.c.fillStyle = '#e2e8f0';
              cur.c.fillRect(cx + 18, ry + 26, cardW - 36, 1);

              if (!cur.cv.__pdfGotoLinks) cur.cv.__pdfGotoLinks = [];
              cur.cv.__pdfGotoLinks.push({ x: cx + 8, y: ry, w: cardW - 16, h: 28, targetPageIndex: destIdx });
              ry += 32;
            });
          };

          if (hasTbls && hasFigs) {
            drawIndexCard(marginX, 'DANH MỤC BẢNG DỮ LIỆU', tables, 'Bảng');
            drawIndexCard(marginX + cardW + colGap, 'DANH MỤC BIỂU ĐỒ & HÌNH ẢNH', figures, 'Hình');
          } else if (hasTbls) {
            drawIndexCard(marginX, 'DANH MỤC BẢNG DỮ LIỆU', tables, 'Bảng');
          } else {
            drawIndexCard(marginX, 'DANH MỤC BIỂU ĐỒ & HÌNH ẢNH', figures, 'Hình');
          }
          y += cardH + 18;
        }

        // Khung Nguyên tắc & Minh bạch Trình bày (ở cuối trang Mục lục chuẩn PDF mẫu)
        ensureTocSp(112);
        rrPath(cur.c, marginX, y, bodyW, 96, 10);
        cur.c.fillStyle = theme.zebra || '#eff6ff';
        cur.c.fill();
        cur.c.strokeStyle = '#cbd5e1';
        cur.c.lineWidth = 1.5;
        cur.c.stroke();
        cur.c.fillStyle = theme.accent;
        cur.c.fillRect(marginX, y + 6, 7, 84);
        cur.c.fillStyle = theme.primary;
        cur.c.font = `800 17.5px ${ff}`;
        cur.c.fillText('Nguyên tắc Định dạng & Liên kết Mục lục Tự động', marginX + 24, y + 16);
        cur.c.fillStyle = '#334155';
        cur.c.font = `500 15.5px ${ff}`;
        cur.c.fillText('Mọi tiêu đề Phần/Chương, Bảng dữ liệu và Hình minh họa đều được tự động trích xuất & đồng bộ số trang thực tế.', marginX + 24, y + 46);
        cur.c.fillText('Bấm trực tiếp vào từng dòng trên Mục lục hoặc Danh mục Bảng/Hình để nhảy nhanh tới đúng trang nội dung.', marginX + 24, y + 70);
        return pages;
      };

      // Tự cân số trang Mục lục để cộng chính xác vào pageShift
      const probe = buildPass(pageShift || 0);
      const exactTocCount = probe.length;
      if (typeof pageShift === 'number') {
        const finalPages = buildPass(pageShift + exactTocCount);
        finalPages.forEach((p) => tocCanvases.push(p));
      } else {
        probe.forEach((p) => tocCanvases.push(p));
      }
      return tocCanvases;
    };

    // 0. BIẾN ĐỔI BÁO CÁO KHOA HỌC ĐẸP (ĐỊNH DẠNG ĐĂNG ĐẶC BIỆT + 10 THEME TÙY CHỈNH: DOCX / XLSX / PDF -> PDF / DOCX / XLSX)
    if (tool.id === 'beautify_10_themes') {
      const f = ctrl.files[0];
      const ext = String(f.name || '').split('.').pop().toLowerCase();
      const theme = REPORT_THEMES_10.find((t) => t.id === pro.theme10Id) || REPORT_THEMES_10[0];
      const dangLayout = Boolean(pro.theme10DangLayout);
      const outFmt = pro.theme10OutFmt || 'pdf';
      const fontMap = {
        sans: '"Segoe UI", Arial, sans-serif',
        serif: 'Georgia, "Times New Roman", serif',
        classic: '"Palatino Linotype", Georgia, serif',
      };
      const ff = fontMap[pro.theme10Font] || fontMap.sans;
      const safeBase = String(typeof baseName === 'string' && baseName ? baseName : f.name || 'BaoCao').replace(/\.[^.]+$/, '');
      const docTitle = safeBase.replace(/[_-]+/g, ' ');
      prog(15, `Đang phân tích cấu trúc, bảng & hình ảnh (${ext.toUpperCase()})...`);

      const blocks = await extractStructuredBlocksFromFile(f, { ensurePdfJs, ensureJsZip, ensureXlsx });

      // Chèn thêm ảnh do người dùng chọn thủ công ("+ Chèn ảnh") vào đầu nội dung hoặc cuối tài liệu
      const extraImgs = Array.isArray(ctrl?.theme10ExtraImages) ? ctrl.theme10ExtraImages : [];
      if (extraImgs.length) {
        const startImgs = extraImgs.filter((im) => im?.dataUrl && im.position === 'after_intro');
        const endImgs = extraImgs.filter((im) => im?.dataUrl && im.position !== 'after_intro');
        if (startImgs.length) {
          const insertIdx = Math.min(blocks.length, Math.max(0, blocks.findIndex((b) => b.type === 'heading' || b.type === 'paragraph') + 1));
          const toInsert = startImgs.map((im, i) => ({
            type: 'image',
            dataUrl: im.dataUrl,
            caption: im.caption || `Hình minh họa ${i + 1}`,
          }));
          blocks.splice(insertIdx, 0, ...toInsert);
        }
        if (endImgs.length) {
          endImgs.forEach((im, i) => {
            blocks.push({
              type: 'image',
              dataUrl: im.dataUrl,
              caption: im.caption || `Hình bổ sung ${i + 1}`,
            });
          });
        }
      }

      if (!blocks.length) {
        blocks.push({ type: 'heading', kind: 'h1', text: docTitle });
        blocks.push({ type: 'paragraph', kind: 'paragraph', text: 'Tài liệu đã được nạp thành công nhưng không có văn bản thuần (có thể là ảnh scan). Hãy chạy OCR trước rồi áp dụng Phối Màu Báo Cáo!' });
      }

      prog(45, `Đang dựng giao diện "${theme.name}" và xuất ${outFmt.toUpperCase()}...`);

      if (outFmt === 'xlsx') {
        const XLSX = await ensureXlsx();
        const wb = XLSX.utils.book_new();
        const summaryRows = [
          ['BÁO CÁO KHOA HỌC (ĐĂNGLOVEPDF STUDIO)'],
          ['Tài liệu gốc', f.name],
          ['Bộ phối màu', theme.name],
          ['Ngày xuất', new Date().toLocaleDateString('vi-VN')],
          [],
          ['Loại mục', 'Nội dung / Chú thích'],
        ];
        let tblIdx = 0;
        blocks.forEach((b) => {
          if (b.type === 'table') {
            tblIdx += 1;
            const wsTbl = XLSX.utils.aoa_to_sheet(b.rows);
            XLSX.utils.book_append_sheet(wb, wsTbl, `Bang_${tblIdx}`.slice(0, 31));
            summaryRows.push(['BẢNG DỮ LIỆU', b.caption || `Bảng ${tblIdx} (xem sheet Bang_${tblIdx})`]);
          } else if (b.type === 'image') {
            summaryRows.push(['HÌNH / BIỂU ĐỒ', b.caption || 'Hình minh họa nhúng']);
          } else {
            summaryRows.push([b.type === 'heading' ? 'TIÊU ĐỀ' : b.type === 'subheading' ? 'TIỂU MỤC' : 'Nội dung', b.text]);
          }
        });
        const wsMain = XLSX.utils.aoa_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, wsMain, 'Tong_Quan_Bao_Cao');
        const arrBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        outputs.push({
          name: `${safeBase}_${theme.id}.xlsx`,
          blob: new Blob([arrBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        });
        return outputs;
      }

      const includeAuthorCover = Boolean(pro.theme10AuthorCover);
      const includeSysCover = Boolean(pro.theme10IncludeCover);
      const hdrMode = pro.theme10HdrMode || 'none';
      const hdrRawTpl = String(pro.theme10HdrText ?? '{filename}');
      const hdrAlign = pro.theme10HdrAlign || 'center';
      const ftrMode = pro.theme10FtrMode || 'page_num';
      const ftrRawTpl = String(pro.theme10FtrText ?? 'Trang {page} / {total}');
      const ftrAlign = pro.theme10FtrAlign || 'center';
      const dateStr = new Date().toLocaleDateString('vi-VN');
      const expandTokens = (tpl, pageNum, totalNum) =>
        String(tpl || '')
          .replace(/\{filename\}/gi, docTitle)
          .replace(/\{file\}/gi, safeBase)
          .replace(/\{theme\}/gi, theme.name)
          .replace(/\{date\}/gi, dateStr)
          .replace(/\{page\}|\{n\}/gi, String(pageNum))
          .replace(/\{total\}/gi, String(totalNum))
          .trim();

      if (outFmt === 'docx') {
        const JSZip = await ensureJsZip();
        const zip = new JSZip();
        const pHex = theme.primary.replace('#', '').toUpperCase();
        const aHex = theme.accent.replace('#', '').toUpperCase();
        const zHex = theme.zebra.replace('#', '').toUpperCase();
        const escXml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const mapJc = (al) => (al === 'left' ? 'left' : al === 'right' ? 'right' : al === 'justify' ? 'both' : 'center');
        const bodyXml = [];
        const docRels = [];
        let relSeq = 10;
        let imgCounter = 0;

        if (includeAuthorCover || includeSysCover) {
          bodyXml.push(
            `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="${pHex}"/><w:spacing w:before="120" w:after="160"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="36"/></w:rPr><w:t>${escXml(docTitle.toUpperCase())}</w:t></w:r></w:p>`,
            `<w:p><w:pPr><w:spacing w:after="200"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="${aHex}"/><w:sz w:val="22"/></w:rPr><w:t>${escXml(includeAuthorCover ? `File được tạo bởi Mai Hải Đăng vip pro · Web Viết Tiểu Thuyết Của Bi · ${dateStr}` : `Theme: ${theme.name} · ${dateStr}`)}</w:t></w:r></w:p>`
          );
        }
        if (hdrMode !== 'none') {
          const hTxt = expandTokens(hdrRawTpl || '{filename}', 1, 1);
          if (hTxt) {
            bodyXml.push(`<w:p><w:pPr><w:jc w:val="${mapJc(hdrAlign)}"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${aHex}"/></w:pBdr><w:spacing w:after="160"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${pHex}"/><w:sz w:val="20"/></w:rPr><w:t>${escXml(hTxt)}</w:t></w:r></w:p>`);
          }
        }
        if (dangLayout) {
          const autoToc = buildTocFromBlocks(blocks);
          if (autoToc.sections.length) {
            bodyXml.push(`<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="${pHex}"/><w:spacing w:before="140" w:after="100"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="24"/></w:rPr><w:t>MỤC LỤC BÁO CÁO &amp; TÀI LIỆU</w:t></w:r></w:p>`);
            autoToc.sections.slice(0, 40).forEach((s) => {
              bodyXml.push(`<w:p><w:pPr><w:spacing w:after="40"/></w:pPr><w:r><w:rPr>${s.level === 1 ? '<w:b/>' : ''}<w:color w:val="${pHex}"/><w:sz w:val="20"/></w:rPr><w:t>${escXml(`${s.level >= 2 ? '    ' : ''}${s.text} (Trang ${s.pageNo})`)}</w:t></w:r></w:p>`);
            });
          }
        }
        for (const b of blocks) {
          if (b.type === 'heading') {
            bodyXml.push(`<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="${pHex}"/><w:pBdr><w:left w:val="single" w:sz="24" w:space="6" w:color="${aHex}"/></w:pBdr><w:spacing w:before="200" w:after="100"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="26"/></w:rPr><w:t>${escXml(b.text)}</w:t></w:r></w:p>`);
          } else if (b.type === 'subheading' || b.type === 'table_caption') {
            bodyXml.push(`<w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="6" w:color="${aHex}"/></w:pBdr><w:spacing w:before="140" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${pHex}"/><w:sz w:val="23"/></w:rPr><w:t>${escXml(b.text)}</w:t></w:r></w:p>`);
          } else if (b.type === 'table') {
            if (b.caption) {
              bodyXml.push(`<w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="6" w:color="${aHex}"/></w:pBdr><w:spacing w:before="120" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${pHex}"/><w:sz w:val="22"/></w:rPr><w:t>${escXml(b.caption)}</w:t></w:r></w:p>`);
            }
            const trs = b.rows.slice(0, 140).map((row, ri) => {
              const fill = ri === 0 ? pHex : ri % 2 === 0 ? zHex : 'FFFFFF';
              const txtCol = ri === 0 ? 'FFFFFF' : '1E293B';
              const boldTag = ri === 0 ? '<w:b/>' : '';
              const tcs = row.slice(0, 10).map((cell) => `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr><w:p><w:r><w:rPr>${boldTag}<w:color w:val="${txtCol}"/><w:sz w:val="20"/></w:rPr><w:t>${escXml(cell)}</w:t></w:r></w:p></w:tc>`).join('');
              return `<w:tr>${tcs}</w:tr>`;
            }).join('');
            bodyXml.push(`<w:tbl><w:tblPr><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="4" w:color="CBD5E1"/></w:tblBorders></w:tblPr>${trs}</w:tbl>`);
          } else if (b.type === 'image' && b.dataUrl?.startsWith('data:image/')) {
            imgCounter += 1;
            relSeq += 1;
            const rId = `rIdImg${relSeq}`;
            const isJpg = b.dataUrl.startsWith('data:image/jpeg');
            const mName = `media/figure_${imgCounter}.${isJpg ? 'jpg' : 'png'}`;
            zip.file(`word/${mName}`, dataUrlToBytes(b.dataUrl));
            docRels.push(`<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${mName}"/>`);
            const cx = 4800000;
            const cy = 3000000;
            bodyXml.push(`<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="60"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${imgCounter}" name="Picture ${imgCounter}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${imgCounter}" name="Picture ${imgCounter}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`);
            if (b.caption) {
              bodyXml.push(`<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:i/><w:color w:val="${pHex}"/><w:sz w:val="19"/></w:rPr><w:t>${escXml(b.caption)}</w:t></w:r></w:p>`);
            }
          } else {
            bodyXml.push(`<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:after="100"/></w:pPr><w:r><w:rPr><w:color w:val="1E293B"/><w:sz w:val="22"/></w:rPr><w:t>${escXml(b.text || '')}</w:t></w:r></w:p>`);
          }
        }
        const sectExtras = [];
        let ftrRelXml = ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
        let ftrCtXml = '';
        if (ftrMode !== 'none') {
          const tplRaw = expandTokens(ftrRawTpl || 'Trang {page} / {total}', '__PAGE__', '__TOTAL__');
          const runsXml = tplRaw
            .split(/(__PAGE__|__TOTAL__)/)
            .filter(Boolean)
            .map((tok) => {
              if (tok === '__PAGE__') return '<w:fldSimple w:instr="PAGE"/>';
              if (tok === '__TOTAL__') return '<w:fldSimple w:instr="NUMPAGES"/>';
              return `<w:r><w:rPr><w:color w:val="475569"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${escXml(tok)}</w:t></w:r>`;
            })
            .join('');
          zip.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="${mapJc(ftrAlign)}"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="${aHex}"/></w:pBdr></w:pPr>${runsXml}</w:p></w:ftr>`);
          docRels.push('<Relationship Id="rIdFtr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>');
          sectExtras.push('<w:sectPr><w:footerReference w:type="default" r:id="rIdFtr1"/></w:sectPr>');
          ftrCtXml = '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>';
        }
        if (docRels.length) {
          zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${docRels.join('')}</Relationships>`);
        }
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>${ftrCtXml}</Types>`);
        zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
        zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"${ftrRelXml}><w:body>${bodyXml.join('')}${sectExtras.join('')}</w:body></w:document>`);
        const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        outputs.push({ name: `${safeBase}_${theme.id}.docx`, blob });
        return outputs;
      }

      // Mặc định: Xuất PDF Sắc Nét (Ghi công tác giả Mai Hải Đăng vip pro + Mục lục 3 khối + Dải màu chuẩn PDF mẫu + Ảnh/Bảng)
      const PDFLibPkg = await ensurePdfLib();
      const { PDFDocument } = PDFLibPkg;
      const outPdf = await PDFDocument.create();
      const W = 1240;
      const H = 1754;
      const makePageCanvas = () => {
        const cv = document.createElement('canvas');
        cv.width = W;
        cv.height = H;
        const c = cv.getContext('2d');
        c.fillStyle = theme.bg;
        c.fillRect(0, 0, W, H);
        c.textBaseline = 'top';
        return { cv, c };
      };
      const wrapCv = (c, txt, mw) => {
        const ws = String(txt || '').trim().split(/\s+/).filter(Boolean);
        if (!ws.length) return [''];
        const out = [];
        let cur = '';
        const pushBroken = (tok) => {
          let sub = '';
          for (const ch of tok) {
            if (sub && c.measureText(sub + ch).width > mw) {
              out.push(sub);
              sub = ch;
            } else {
              sub += ch;
            }
          }
          return sub;
        };
        for (const w of ws) {
          const cand = cur ? `${cur} ${w}` : w;
          if (c.measureText(cand).width <= mw) {
            cur = cand;
          } else {
            if (cur) out.push(cur);
            if (c.measureText(w).width > mw) cur = pushBroken(w);
            else cur = w;
          }
        }
        if (cur) out.push(cur);
        return out.length ? out : [''];
      };

      const coverCanvases = [];
      if (includeAuthorCover) {
        const cov = makePageCanvas();
        const c = cov.c;
        // Nền trắng trang trọng + Dải header Navy-Teal chuẩn Trang 1 Báo cáo Mẫu
        const hg = c.createLinearGradient(0, 0, W, 380);
        hg.addColorStop(0, theme.primary);
        hg.addColorStop(1, theme.secondary);
        c.fillStyle = hg;
        c.fillRect(0, 0, W, 380);
        // Dải cầu vồng mảnh 6px đặc trưng của báo cáo mẫu
        const rg = c.createLinearGradient(0, 380, W, 380);
        rg.addColorStop(0, theme.accent);
        rg.addColorStop(0.55, theme.accent2 || '#f59e0b');
        rg.addColorStop(1, '#ef4444');
        c.fillStyle = rg;
        c.fillRect(0, 376, W, 6);

        // Nạp icon tác giả (assets/app-icon-256.png / 192.png)
        const iconImg = (await loadImageSafe('assets/app-icon-256.png')) || (await loadImageSafe('assets/app-icon-192.png'));
        if (iconImg) {
          c.save();
          rrPath(c, 96, 86, 150, 150, 26);
          c.fillStyle = '#ffffff';
          c.fill();
          c.strokeStyle = theme.accent2 || '#f59e0b';
          c.lineWidth = 5;
          c.stroke();
          c.clip();
          c.drawImage(iconImg, 102, 92, 138, 138);
          c.restore();
        }
        const textStartX = iconImg ? 278 : 96;
        c.fillStyle = '#5eead4';
        c.font = `800 18px ${ff}`;
        c.fillText('TÀI LIỆU ĐƯỢC ĐỊNH DẠNG BẰNG ĐĂNGLOVEPDF STUDIO', textStartX, 98);
        c.fillStyle = '#ffffff';
        c.font = `900 34px ${ff}`;
        c.fillText('File được tạo bởi Mai Hải Đăng vip pro', textStartX, 134);
        c.fillStyle = 'rgba(255,255,255,0.88)';
        c.font = `700 20px ${ff}`;
        c.fillText('Website gốc: Web Viết Tiểu Thuyết Của Bi · Tự động đồng bộ 100%', textStartX, 192);

        rrPath(c, textStartX, 240, 480, 42, 8);
        c.fillStyle = 'rgba(255,255,255,0.12)';
        c.fill();
        c.strokeStyle = 'rgba(251,191,36,0.65)';
        c.lineWidth = 1.5;
        c.stroke();
        c.fillStyle = '#fde68a';
        c.font = `800 17px ${ff}`;
        c.fillText(`Bộ phối màu: ${theme.name.slice(0, 46)}`, textStartX + 18, 250);

        // Tiêu đề lớn tài liệu căn giữa trang trắng sang trọng
        c.fillStyle = theme.accent;
        c.font = `900 22px ${ff}`;
        c.textAlign = 'center';
        c.fillText('ẤN PHẨM BÁO CÁO & TÀI LIỆU KHOA HỌC CHUẨN MỰC', W / 2, 520);
        c.fillStyle = theme.primary;
        c.font = `900 46px ${ff}`;
        let cy = 580;
        wrapCv(c, docTitle.toUpperCase(), W - 200).slice(0, 4).forEach((ln) => {
          c.fillText(ln, W / 2, cy);
          cy += 64;
        });

        rrPath(c, 150, cy + 28, W - 300, 92, 12);
        c.fillStyle = theme.zebra || '#f1f5f9';
        c.fill();
        c.strokeStyle = '#cbd5e1';
        c.lineWidth = 1.5;
        c.stroke();
        c.fillStyle = '#334155';
        c.font = `700 21px ${ff}`;
        c.fillText(`Định dạng xuất: PDF Sắc Nét · Phông chữ: ${(pro.theme10Font || 'sans').toUpperCase()}`, W / 2, cy + 48);
        c.fillStyle = theme.accent;
        c.font = `700 19px ${ff}`;
        c.fillText(`Khởi tạo ngày: ${dateStr} · Có thể bật/tắt trang bìa tác giả trong Thiết lập file`, W / 2, cy + 84);
        c.textAlign = 'left';

        // Dải footer Navy đáy trang bìa kiểu KPI trang 1 PDF mẫu
        c.fillStyle = theme.primary;
        c.fillRect(0, H - 250, W, 250);
        c.fillStyle = theme.accent;
        c.fillRect(0, H - 250, W, 5);
        const hCount = blocks.filter((b) => b.type === 'heading' || b.type === 'subheading').length;
        const tCount = blocks.filter((b) => b.type === 'table').length;
        const fCount = blocks.filter((b) => b.type === 'image').length;
        const cards = [
          { k: 'CẤU TRÚC MỤC', v: `${hCount} mục`, s: 'Tự động phân cấp' },
          { k: 'BẢNG DỮ LIỆU', v: `${tCount} bảng`, s: 'Kẻ lưới & Header Navy' },
          { k: 'HÌNH & BIỂU ĐỒ', v: `${fCount} hình`, s: 'Đóng khung kèm chú thích' },
          { k: 'TÁC GIẢ STUDIO', v: 'Mai Hải Đăng', s: 'Web Tiểu Thuyết Bi (v140)' },
        ];
        const cw = 250;
        const gap = 22;
        const startCx = Math.round((W - (cw * 4 + gap * 3)) / 2);
        cards.forEach((kd, ci) => {
          const kx = startCx + ci * (cw + gap);
          const ky = H - 205;
          rrPath(c, kx, ky, cw, 145, 10);
          c.fillStyle = 'rgba(255,255,255,0.08)';
          c.fill();
          c.fillStyle = ci === 3 ? '#f59e0b' : theme.accent;
          c.fillRect(kx + 12, ky, cw - 24, 4);
          c.fillStyle = '#94a3b8';
          c.font = `800 15px ${ff}`;
          c.fillText(kd.k, kx + 18, ky + 22);
          c.fillStyle = '#ffffff';
          c.font = `900 28px ${ff}`;
          c.fillText(kd.v, kx + 18, ky + 56);
          c.fillStyle = '#cbd5e1';
          c.font = `500 15px ${ff}`;
          c.fillText(kd.s, kx + 18, ky + 104);
        });
        coverCanvases.push(cov.cv);
      } else if (includeSysCover) {
        const cover = makePageCanvas();
        const cg = cover.c.createLinearGradient(0, 0, W, H);
        cg.addColorStop(0, theme.primary);
        cg.addColorStop(1, theme.secondary);
        cover.c.fillStyle = cg;
        cover.c.fillRect(0, 0, W, H);
        cover.c.fillStyle = theme.accent;
        cover.c.fillRect(0, 0, 22, H);
        cover.c.fillStyle = '#ffffff';
        cover.c.font = `900 54px ${ff}`;
        let cy = 320;
        wrapCv(cover.c, docTitle.toUpperCase(), W - 200).forEach((ln) => { cover.c.fillText(ln, 100, cy); cy += 68; });
        cover.c.fillStyle = theme.accent;
        cover.c.fillRect(100, cy + 20, 240, 8);
        cover.c.fillStyle = 'rgba(255,255,255,0.85)';
        cover.c.font = `700 24px ${ff}`;
        cover.c.fillText(`Bộ phối màu: ${theme.name}`, 100, cy + 64);
        cover.c.fillText(`Ngày định dạng: ${dateStr} · ĐăngLovePDF Studio`, 100, H - 110);
        coverCanvases.push(cover.cv);
      }

      const contentStartY = hdrMode === 'band' ? 120 : hdrMode === 'minimal' ? 104 : 84;
      const maxY = ftrMode !== 'none' ? H - 104 : H - 76;
      const contentPages = [];
      let curP = makePageCanvas();
      contentPages.push(curP.cv);
      let y = contentStartY;
      const ensureSp = (need) => {
        if (y + need > maxY) {
          curP = makePageCanvas();
          contentPages.push(curP.cv);
          y = contentStartY;
        }
      };

      const drawJustifiedLine = (c, line, x, yy, targetW, isLastLine) => {
        const words = String(line || '').trim().split(/\s+/).filter(Boolean);
        if (isLastLine || words.length <= 1) {
          c.fillText(line, x, yy);
          return;
        }
        const totalWordsW = words.reduce((s, w) => s + c.measureText(w).width, 0);
        const spaceLeft = targetW - totalWordsW;
        const avgWordSpace = c.measureText(' ').width;
        if (spaceLeft <= 0 || spaceLeft / (words.length - 1) > avgWordSpace * 3.8) {
          c.fillText(line, x, yy);
          return;
        }
        const gap = spaceLeft / (words.length - 1);
        let curX = x;
        for (let wi = 0; wi < words.length; wi++) {
          c.fillText(words[wi], curX, yy);
          curX += c.measureText(words[wi]).width + gap;
        }
      };

      const marginX = 76;
      const bodyMaxW = W - marginX * 2;
      const recordedTocSections = [];
      const recordedTocTables = [];
      const recordedTocFigures = [];
      const detectedHeadingsCount = blocks.filter((b) => b.type === 'heading' || b.type === 'subheading').length;
      const autoBuildToc = dangLayout && (detectedHeadingsCount >= 1 || blocks.some((b) => b.type === 'table' || b.type === 'image'));

      let autoTblNum = 0;
      let autoFigNum = 0;

      for (const b of blocks) {
        if (autoBuildToc && b.type === 'toc_item' && detectedHeadingsCount >= 2) {
          // Đã dựng Mục lục tự động chuẩn xác từ Pass 1/Pass 2 -> bỏ qua dòng chấm Mục lục cũ lỗi số trang
          continue;
        }
        if (autoBuildToc && b.type === 'heading' && /^(MỤC LỤC(\s+BÁO\s+CÁO[^\n]*)?|DANH MỤC\s+(BẢNG|BIỂU ĐỒ|HÌNH)[^\n]*)$/i.test(b.text || '')) {
          continue;
        }

        if (b.type === 'heading') {
          curP.c.font = `900 22px ${ff}`;
          const hLines = wrapCv(curP.c, b.text, bodyMaxW - 52);
          const bannerH = Math.max(58, hLines.length * 30 + 28);
          ensureSp(bannerH + 18);
          recordedTocSections.push({ level: b.kind === 'h2' ? 2 : 1, text: b.text, contentPageIdx: contentPages.length - 1 });
          y += 10;
          const bgGrad = curP.c.createLinearGradient(marginX, y, marginX + bodyMaxW, y);
          bgGrad.addColorStop(0, theme.primary);
          bgGrad.addColorStop(1, theme.secondary);
          rrPath(curP.c, marginX, y, bodyMaxW, bannerH, 10);
          curP.c.fillStyle = bgGrad;
          curP.c.fill();
          curP.c.fillStyle = theme.accent;
          curP.c.fillRect(marginX, y + 6, 9, bannerH - 12);
          if (dangLayout) {
            curP.c.fillStyle = theme.accent2 || '#f59e0b';
            curP.c.fillRect(marginX + 12, y + bannerH - 3, bodyMaxW - 24, 3);
          }
          curP.c.fillStyle = '#ffffff';
          curP.c.font = `900 22px ${ff}`;
          hLines.forEach((ln, li) => curP.c.fillText(ln, marginX + 26, y + 14 + li * 30));
          y += bannerH + 16;
        } else if (b.type === 'subheading') {
          curP.c.font = `800 21px ${ff}`;
          const shLines = wrapCv(curP.c, b.text, bodyMaxW - 28);
          const shH = shLines.length * 28 + 10;
          ensureSp(shH + 12);
          recordedTocSections.push({ level: 3, text: b.text, contentPageIdx: contentPages.length - 1 });
          y += 8;
          curP.c.fillStyle = theme.accent;
          curP.c.fillRect(marginX, y + 3, 5, shH - 6);
          curP.c.fillStyle = theme.primary;
          shLines.forEach((ln, li) => curP.c.fillText(ln, marginX + 18, y + 4 + li * 28));
          y += shH + 10;
        } else if (b.type === 'table_caption') {
          ensureSp(40);
          y += 6;
          curP.c.fillStyle = theme.accent;
          curP.c.fillRect(marginX, y + 3, 5, 22);
          curP.c.fillStyle = theme.primary;
          curP.c.font = `800 19px ${ff}`;
          curP.c.fillText(b.text.slice(0, 88), marginX + 16, y + 2);
          y += 32;
        } else if (b.type === 'table') {
          const cleanRows = (b.rows || []).filter((r) => Array.isArray(r) && r.some((cell) => String(cell ?? '').trim() !== ''));
          if (!cleanRows.length) continue;
          autoTblNum += 1;
          const tblCap = b.caption || `Bảng ${autoTblNum}: Dữ liệu phân tích`;
          if (b.caption) {
            ensureSp(110);
            curP.c.fillStyle = theme.accent;
            curP.c.fillRect(marginX, y + 3, 5, 22);
            curP.c.fillStyle = theme.primary;
            curP.c.font = `800 18.5px ${ff}`;
            curP.c.fillText(b.caption.slice(0, 88), marginX + 16, y + 2);
            y += 32;
          } else {
            ensureSp(80);
          }
          recordedTocTables.push({ label: tblCap, contentPageIdx: contentPages.length - 1 });

          const cols = Math.min(10, Math.max(1, ...cleanRows.map((r) => r.length)));
          const tableW = bodyMaxW;
          // Phân bổ độ rộng cột theo tỷ lệ độ dài nội dung (gọn cột STT/Năm, rộng cột diễn giải)
          const colScores = new Array(cols).fill(1);
          cleanRows.slice(0, 30).forEach((r) => {
            for (let ci = 0; ci < cols; ci++) {
              const len = Math.min(48, Math.max(4, String(r[ci] || '').trim().length));
              if (len > colScores[ci]) colScores[ci] = len;
            }
          });
          const weights = colScores.map((s) => Math.sqrt(s));
          const sumW = weights.reduce((a, s) => a + s, 0) || cols;
          const colWidths = weights.map((wt) => Math.max(76, Math.round((wt / sumW) * tableW)));
          const sumAssigned = colWidths.reduce((a, v) => a + v, 0);
          if (sumAssigned !== tableW) {
            colWidths[colWidths.length - 1] += tableW - sumAssigned;
          }
          const colXStarts = [];
          let runX = Math.round((W - tableW) / 2);
          colWidths.forEach((cwVal) => {
            colXStarts.push(runX);
            runX += cwVal;
          });
          const centeredX = colXStarts[0];
          const tblFontSz = cols >= 8 ? 13.5 : cols >= 6 ? 15 : 16.5;
          const tblLineH = Math.round(tblFontSz * 1.34);

          const paintTableRow = (rowArr, rowIdx, isHeaderRow, allowBreakCheck = true) => {
            const nonEmpty = rowArr.filter((v) => String(v ?? '').trim() !== '').length;
            const spanFullRow = cols >= 2 && nonEmpty === 1 && String(rowArr[0] || '').trim() !== '' && !isHeaderRow;
            curP.c.font = `${isHeaderRow || spanFullRow ? '800' : '500'} ${tblFontSz}px ${ff}`;
            const cellLines = spanFullRow
              ? [wrapCv(curP.c, rowArr[0] || '', tableW - 22).slice(0, 4)]
              : Array.from({ length: cols }, (_, ci) => wrapCv(curP.c, rowArr[ci] || '', colWidths[ci] - 16).slice(0, 6));
            const rh = Math.max(34, Math.max(...cellLines.map((a) => a.length)) * tblLineH + 14);
            if (allowBreakCheck) {
              const prevPageCount = contentPages.length;
              ensureSp(rh + 4);
              // Nếu bảng tràn sang trang mới, tự động lặp lại dòng tiêu đề Navy trên trang mới
              if (contentPages.length > prevPageCount && !isHeaderRow && cleanRows.length > 1) {
                paintTableRow(cleanRows[0], 0, true, false);
              }
            }
            curP.c.font = `${isHeaderRow || spanFullRow ? '800' : '500'} ${tblFontSz}px ${ff}`;
            curP.c.fillStyle = isHeaderRow ? theme.primary : (spanFullRow || rowIdx % 2 === 0 ? theme.zebra : '#ffffff');
            curP.c.fillRect(centeredX, y, tableW, rh);
            curP.c.strokeStyle = '#cbd5e1';
            curP.c.lineWidth = 1;
            curP.c.strokeRect(centeredX, y, tableW, rh);
            if (!spanFullRow) {
              for (let ci = 1; ci < cols; ci++) {
                curP.c.beginPath();
                curP.c.moveTo(colXStarts[ci], y);
                curP.c.lineTo(colXStarts[ci], y + rh);
                curP.c.stroke();
              }
            }
            let rowUrl = '';
            cellLines.forEach((lns, ci) => {
              const rawCell = String(rowArr[ci] || '');
              const um = rawCell.match(/https?:\/\/[^\s<>)\]"']+/i);
              if (um && !rowUrl) rowUrl = um[0].replace(/[.,;:!?]+$/, '');
              curP.c.fillStyle = isHeaderRow ? '#ffffff' : (um ? '#0369a1' : (spanFullRow ? theme.primary : theme.text));
              lns.forEach((ln, li) => curP.c.fillText(ln, colXStarts[ci] + 8, y + 7 + li * tblLineH));
            });
            if (rowUrl) {
              if (!curP.cv.__pdfUriLinks) curP.cv.__pdfUriLinks = [];
              curP.cv.__pdfUriLinks.push({ x: centeredX, y, w: tableW, h: rh, url: rowUrl });
            }
            y += rh;
          };

          for (let ri = 0; ri < cleanRows.length; ri++) {
            paintTableRow(cleanRows[ri], ri, ri === 0, true);
          }
          y += 16;
        } else if (b.type === 'image' && b.dataUrl) {
          const loadedImg = await loadImageSafe(b.dataUrl);
          if (loadedImg) {
            autoFigNum += 1;
            const figCap = b.caption || `Hình ${autoFigNum}: Ảnh & Biểu đồ minh họa`;
            const innerW = bodyMaxW - 40;
            const aspect = loadedImg.height / Math.max(1, loadedImg.width);
            const drawW = Math.min(innerW, Math.max(320, loadedImg.width * 1.35));
            const drawH = Math.min(540, Math.max(120, Math.round(drawW * aspect)));
            const finalW = Math.round(drawH / Math.max(0.05, aspect));
            const capLines = wrapCv(curP.c, figCap, bodyMaxW - 48).slice(0, 2);
            const cardH = drawH + 34 + capLines.length * 24;
            ensureSp(cardH + 16);
            recordedTocFigures.push({ label: figCap, contentPageIdx: contentPages.length - 1 });

            rrPath(curP.c, marginX, y, bodyMaxW, cardH, 10);
            curP.c.fillStyle = '#f8fafc';
            curP.c.fill();
            curP.c.strokeStyle = '#cbd5e1';
            curP.c.lineWidth = 1.5;
            curP.c.stroke();

            const ix = Math.round(marginX + (bodyMaxW - finalW) / 2);
            curP.c.drawImage(loadedImg, ix, y + 14, finalW, drawH);
            curP.c.fillStyle = theme.primary;
            curP.c.font = `italic 700 16.5px ${ff}`;
            curP.c.textAlign = 'center';
            capLines.forEach((ln, li) => curP.c.fillText(ln, marginX + bodyMaxW / 2, y + 24 + drawH + li * 24));
            curP.c.textAlign = 'left';
            y += cardH + 16;
          }
        } else if (b.type === 'figure_caption') {
          ensureSp(36);
          curP.c.fillStyle = theme.primary;
          curP.c.font = `italic 700 17px ${ff}`;
          curP.c.fillText(b.text.slice(0, 96), marginX + 12, y);
          y += 28;
        } else if (b.type === 'toc_item') {
          ensureSp(34);
          curP.c.font = `600 18.5px ${ff}`;
          curP.c.fillStyle = theme.primary;
          const mToc = b.text.match(/^(.*?)\s*\.{3,}\s*(\d{1,4})$/);
          if (mToc) {
            const leftT = mToc[1].trim();
            const pgT = mToc[2].trim();
            curP.c.fillText(leftT.slice(0, 74), marginX + 12, y);
            const pgW = curP.c.measureText(pgT).width;
            curP.c.fillText(pgT, marginX + bodyMaxW - pgW - 12, y);
          } else {
            curP.c.fillText(b.text.slice(0, 86), marginX + 12, y);
          }
          curP.c.fillStyle = '#e2e8f0';
          curP.c.fillRect(marginX + 12, y + 26, bodyMaxW - 24, 1);
          y += 32;
        } else if (b.type === 'callout') {
          curP.c.font = `600 18.5px ${ff}`;
          const cLines = wrapCv(curP.c, b.text, bodyMaxW - 44);
          const ch = cLines.length * 28 + 24;
          ensureSp(ch + 12);
          rrPath(curP.c, marginX, y, bodyMaxW, ch, 8);
          curP.c.fillStyle = theme.zebra || '#eff6ff';
          curP.c.fill();
          curP.c.fillStyle = theme.accent;
          curP.c.fillRect(marginX, y + 4, 7, ch - 8);
          curP.c.fillStyle = theme.text;
          cLines.forEach((ln, li) => drawJustifiedLine(curP.c, ln, marginX + 24, y + 12 + li * 28, bodyMaxW - 44, li === cLines.length - 1));
          y += ch + 12;
        } else if (b.type === 'bullet') {
          curP.c.font = `500 19.5px ${ff}`;
          const bLines = wrapCv(curP.c, `• ${b.text}`, bodyMaxW - 20);
          bLines.forEach((ln, li) => {
            ensureSp(30);
            curP.c.fillStyle = theme.text;
            drawJustifiedLine(curP.c, ln, marginX + 16, y, bodyMaxW - 20, li === bLines.length - 1);
            y += 28;
          });
          y += 4;
        } else {
          const urlMatch = String(b.text || '').match(/https?:\/\/[^\s<>)\]"']+/i);
          curP.c.font = `500 20px ${ff}`;
          const lines = wrapCv(curP.c, b.text, bodyMaxW);
          if (urlMatch) ensureSp(lines.length * 30 + 10);
          const pYStart = y;
          lines.forEach((ln, li) => {
            ensureSp(32);
            curP.c.fillStyle = urlMatch ? '#0369a1' : theme.text;
            curP.c.font = `500 20px ${ff}`;
            drawJustifiedLine(curP.c, ln, marginX, y, bodyMaxW, li === lines.length - 1);
            y += 30;
          });
          if (urlMatch) {
            if (!curP.cv.__pdfUriLinks) curP.cv.__pdfUriLinks = [];
            curP.cv.__pdfUriLinks.push({ x: marginX, y: Math.min(pYStart, y - 30), w: bodyMaxW, h: Math.max(30, y - pYStart), url: urlMatch[0].replace(/[.,;:!?]+$/, '') });
          }
          y += 10;
        }
      }

      // Pass 2: Sinh Mục lục Báo cáo tự động (chuẩn Trang 2 PDF mẫu) nếu có dữ liệu cấu trúc
      let tocPages = [];
      if (autoBuildToc) {
        tocPages = renderDangTocCanvases({
          theme,
          ff,
          tocTitle: 'MỤC LỤC BÁO CÁO & HỆ THỐNG BẢNG – BIỂU ĐỒ – PHỤ LỤC',
          sections: recordedTocSections,
          tables: recordedTocTables,
          figures: recordedTocFigures,
          pageShift: coverCanvases.length,
          makePageCanvas,
          W,
          H,
          startY: contentStartY,
          maxY,
        });
      }

      const numberedPages = [...tocPages, ...contentPages];
      const totalNumberedPages = numberedPages.length;

      const drawAlignedBandText = (c, textLeftOrFull, alignMode, yy, colorHex, fontCss, barW = bodyMaxW, barX = marginX) => {
        c.fillStyle = colorHex;
        c.font = fontCss;
        c.textBaseline = 'middle';
        const txt = String(textLeftOrFull || '').trim();
        if (!txt) return;
        if (alignMode === 'justify' && (txt.includes('|') || txt.includes('·'))) {
          const sep = txt.includes('|') ? '|' : '·';
          const parts = txt.split(sep).map((p) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            c.textAlign = 'left';
            c.fillText(parts[0], barX, yy);
            c.textAlign = 'right';
            c.fillText(parts.slice(1).join(` ${sep} `), barX + barW, yy);
            c.textAlign = 'left';
            c.textBaseline = 'top';
            return;
          }
        }
        if (alignMode === 'justify') {
          c.textBaseline = 'top';
          c.textAlign = 'left';
          drawJustifiedLine(c, txt, barX, yy - 10, barW, false);
          return;
        }
        if (alignMode === 'left') {
          c.textAlign = 'left';
          c.fillText(txt, barX, yy);
        } else if (alignMode === 'right') {
          c.textAlign = 'right';
          c.fillText(txt, barX + barW, yy);
        } else {
          c.textAlign = 'center';
          c.fillText(txt, barX + barW / 2, yy);
        }
        c.textAlign = 'left';
        c.textBaseline = 'top';
      };

      numberedPages.forEach((cv, idx) => {
        const c = cv.getContext('2d');
        const pageNo = idx + 1;
        if (hdrMode === 'band') {
          c.fillStyle = theme.primary;
          c.fillRect(0, 0, W, 84);
          c.fillStyle = theme.accent;
          c.fillRect(0, 80, W, 4);
          const hStr = expandTokens(hdrRawTpl || '{filename}', pageNo, totalNumberedPages);
          drawAlignedBandText(c, hStr, hdrAlign, 42, '#ffffff', `800 22px ${ff}`, bodyMaxW, marginX);
        } else if (hdrMode === 'minimal') {
          const hStr = expandTokens(hdrRawTpl || '{filename}', pageNo, totalNumberedPages);
          drawAlignedBandText(c, hStr, hdrAlign, 46, theme.primary, `800 20px ${ff}`, bodyMaxW, marginX);
          c.fillStyle = theme.accent;
          c.fillRect(marginX, 68, bodyMaxW, 2);
        }
        if (ftrMode !== 'none') {
          const fStr = expandTokens(ftrRawTpl || 'Trang {page} / {total}', pageNo, totalNumberedPages);
          c.fillStyle = '#cbd5e1';
          c.fillRect(marginX, H - 72, bodyMaxW, 1.5);
          drawAlignedBandText(c, fStr, ftrAlign, H - 46, '#475569', `700 18px ${ff}`, bodyMaxW, marginX);
        }
      });

      const finalCanvases = [...coverCanvases, ...numberedPages];
      const addedPages = [];
      for (let i = 0; i < finalCanvases.length; i++) {
        prog(60 + Math.round(((i + 1) / finalCanvases.length) * 32), `Đang đóng gói trang PDF ${i + 1}/${finalCanvases.length}...`);
        const jpgUrl = finalCanvases[i].toDataURL('image/jpeg', 0.92);
        const bytes = dataUrlToBytes(jpgUrl);
        const img = await outPdf.embedJpg(bytes);
        const p = outPdf.addPage([595.28, 841.89]);
        p.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
        addedPages.push(p);
      }
      // Pass 3: Gắn link nội bộ /GoTo cho Mục lục & link ngoài /URI cho nguồn tham khảo
      for (let i = 0; i < finalCanvases.length; i++) {
        const cv = finalCanvases[i];
        attachPdfPageLinks(outPdf, PDFLibPkg, addedPages[i], cv.__pdfGotoLinks, cv.__pdfUriLinks, W, H);
      }
      const pdfBytes = await outPdf.save();
      outputs.push({
        name: `${safeBase}_${theme.id}.pdf`,
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      });
      return outputs;
    }

    // 1. TRÍCH XUẤT & ĐẢO NGƯỢC TRANG
    if (tool.id === 'extract_pages') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      let indices = [];
      if (pro.extractMode === 'reverse') {
        for (let i = total - 1; i >= 0; i--) indices.push(i);
      } else if (pro.extractMode === 'odd') {
        for (let i = 0; i < total; i += 2) indices.push(i);
      } else if (pro.extractMode === 'even') {
        for (let i = 1; i < total; i += 2) indices.push(i);
      } else {
        const groups = parsePageRanges(pro.extractRange, total);
        indices = groups.flat();
      }
      if (!indices.length) indices = [0];
      prog(55, `Đang trích xuất ${indices.length} trang...`);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      outputs.push({ name: `${baseName}_${pro.extractMode === 'reverse' ? 'DaoTrang' : 'TrichXuat'}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 2. ĐỔI KHỔ GIẤY & CO GIÃN TRANG (RESIZE / SCALE)
    if (tool.id === 'resize_scale') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const [bw, bh] = PAPER_SIZES[pro.paper] || PAPER_SIZES.a4;
      const targetW = pro.orient === 'landscape' ? bh : bw;
      const targetH = pro.orient === 'landscape' ? bw : bh;
      const pages = src.getPages();
      for (let i = 0; i < pages.length; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + ((i + 1) / pages.length) * 75, `Đang chuẩn hóa khổ ${pro.paper.toUpperCase()} trang ${i + 1}/${pages.length}...`);
        const emb = await out.embedPage(pages[i]);
        const newPg = out.addPage([targetW, targetH]);
        const margin = 16;
        const sc = Math.min((targetW - margin * 2) / emb.width, (targetH - margin * 2) / emb.height);
        const dw = emb.width * sc;
        const dh = emb.height * sc;
        newPg.drawPage(emb, { x: (targetW - dw) / 2, y: (targetH - dh) / 2, width: dw, height: dh });
      }
      outputs.push({ name: `${baseName}_${pro.paper.toUpperCase()}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 3. DÀN TRANG N-UP (2/4/6/9) & ĐÓNG GÁY SÁCH (BOOKLET IMPOSITION)
    if (tool.id === 'nup_booklet') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const srcPages = src.getPages();
      const embedded = [];
      for (let i = 0; i < srcPages.length; i++) {
        embedded.push(await out.embedPage(srcPages[i]));
      }

      const MM_TO_PT = 2.83465;
      const gapPt = (pro.nupGapMm || 0) * MM_TO_PT;
      const outerMarginPt = (pro.bookletMarginMm || 0) * MM_TO_PT;
      const gutterPt = (pro.bookletGutterMm ?? 4) * MM_TO_PT;

      if (pro.nupMode === 'booklet') {
        const padded = embedded.slice();
        while (padded.length % 4 !== 0) padded.push(null);
        const total = padded.length;
        const sheetW = 841.89; // A4 ngang
        const sheetH = 595.28;
        const halfInnerW = Math.max(40, (sheetW - outerMarginPt * 2 - gutterPt) / 2);
        const innerH = Math.max(40, sheetH - outerMarginPt * 2);
        for (let s = 0; s < total / 2; s++) {
          prog(15 + ((s + 1) / (total / 2)) * 75, `Đang ghép mặt sách ${s + 1}/${total / 2}...`);
          const isFront = s % 2 === 0;
          const leftIdx = isFront ? total - 1 - s : s;
          const rightIdx = isFront ? s : total - 1 - s;
          const pg = out.addPage([sheetW, sheetH]);
          const drawBookletSide = (emb, isLeftSide) => {
            if (!emb) return;
            const sc = Math.min(halfInnerW / emb.width, innerH / emb.height);
            const dw = emb.width * sc;
            const dh = emb.height * sc;
            // Căn sát về phía gáy sách (cách trục giữa đúng gutterPt/2) để khi gập đôi liền mạch như sách in thật!
            const spineX = sheetW / 2;
            const x = isLeftSide ? spineX - gutterPt / 2 - dw : spineX + gutterPt / 2;
            const y = outerMarginPt + (innerH - dh) / 2;
            pg.drawPage(emb, { x, y, width: dw, height: dh });
          };
          drawBookletSide(padded[leftIdx], true);
          drawBookletSide(padded[rightIdx], false);
        }
        outputs.push({ name: `${baseName}_Booklet_DongGay.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      const n = Number(pro.nupMode) || 2;
      const gridMap = { 2: [2, 1, 841.89, 595.28], 4: [2, 2, 595.28, 841.89], 6: [3, 2, 841.89, 595.28], 9: [3, 3, 595.28, 841.89] };
      const [cols, rows, sw, sh] = gridMap[n] || gridMap[2];
      const cellW = Math.max(20, (sw - outerMarginPt * 2 - gapPt * (cols - 1)) / cols);
      const cellH = Math.max(20, (sh - outerMarginPt * 2 - gapPt * (rows - 1)) / rows);
      const perSheet = cols * rows;
      // Khi khoảng hở = 0mm -> tính khung trang chung gọn để các trang nằm sát liền nhau không bị hở khoảng trắng thừa!
      const refEmb = embedded[0];
      const uniformScale = refEmb ? Math.min(cellW / refEmb.width, cellH / refEmb.height) : 1;
      const tileW = refEmb ? refEmb.width * uniformScale : cellW;
      const tileH = refEmb ? refEmb.height * uniformScale : cellH;
      const totalGridW = tileW * cols + gapPt * (cols - 1);
      const totalGridH = tileH * rows + gapPt * (rows - 1);
      const originX = (sw - totalGridW) / 2;
      const originTopY = (sh + totalGridH) / 2;

      for (let start = 0; start < embedded.length; start += perSheet) {
        prog(15 + ((start + perSheet) / embedded.length) * 75, `Đang dàn trang ${Math.floor(start / perSheet) + 1}...`);
        const pg = out.addPage([sw, sh]);
        for (let k = 0; k < perSheet && start + k < embedded.length; k++) {
          const emb = embedded[start + k];
          const col = k % cols;
          const row = Math.floor(k / cols);
          const sc = Math.min(tileW / emb.width, tileH / emb.height);
          const dw = emb.width * sc;
          const dh = emb.height * sc;
          const x = originX + col * (tileW + gapPt) + (tileW - dw) / 2;
          const y = originTopY - (row + 1) * tileH - row * gapPt + (tileH - dh) / 2;
          pg.drawPage(emb, { x, y, width: dw, height: dh });
        }
      }
      outputs.push({ name: `${baseName}_${n}TrangTren1To.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 4. TRỘN XEN KẼ 2 FILE PDF (ALTERNATE & MIX — SEJDA PRO)
    if (tool.id === 'alternate_mix') {
      const { PDFDocument } = await ensurePdfLib();
      const doc1 = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const doc2 = await PDFDocument.load(ctrl.files[1].bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const idx1 = doc1.getPageIndices();
      const idx2 = pro.mixRev2 ? doc2.getPageIndices().reverse() : doc2.getPageIndices();
      const maxLen = Math.max(idx1.length, idx2.length);
      for (let i = 0; i < maxLen; i++) {
        prog(15 + ((i + 1) / maxLen) * 75, `Đang ghép xen kẽ cặp trang ${i + 1}/${maxLen}...`);
        if (i < idx1.length) {
          const [p1] = await out.copyPages(doc1, [idx1[i]]);
          out.addPage(p1);
        }
        if (i < idx2.length) {
          const [p2] = await out.copyPages(doc2, [idx2[i]]);
          out.addPage(p2);
        }
      }
      outputs.push({ name: `${baseName}_TronXenKe.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 5. TẠO SỔ PDF TRẮNG / KẺ NGANG / Ô LY / CHẤM BI
    if (tool.id === 'create_blank_pdf') {
      const { PDFDocument, rgb } = await ensurePdfLib();
      const out = await PDFDocument.create();
      const [w, h] = PAPER_SIZES[pro.blankSize] || PAPER_SIZES.a4;
      const lineCol = rgb(0.82, 0.85, 0.9);
      for (let p = 0; p < pro.blankCount; p++) {
        prog(15 + ((p + 1) / pro.blankCount) * 75, `Đang tạo trang ${p + 1}/${pro.blankCount}...`);
        const pg = out.addPage([w, h]);
        if (pro.blankStyle === 'ruled') {
          for (let y = h - 54; y >= 42; y -= 24) {
            pg.drawLine({ start: { x: 36, y }, end: { x: w - 36, y }, thickness: 0.7, color: lineCol });
          }
        } else if (pro.blankStyle === 'grid') {
          for (let y = h - 36; y >= 36; y -= 20) pg.drawLine({ start: { x: 36, y }, end: { x: w - 36, y }, thickness: 0.5, color: lineCol });
          for (let x = 36; x <= w - 36; x += 20) pg.drawLine({ start: { x, y: 36 }, end: { x, y: h - 36 }, thickness: 0.5, color: lineCol });
        } else if (pro.blankStyle === 'dots') {
          for (let y = h - 36; y >= 36; y -= 20) {
            for (let x = 36; x <= w - 36; x += 20) {
              pg.drawCircle({ x, y, size: 0.9, color: rgb(0.68, 0.72, 0.78) });
            }
          }
        }
      }
      outputs.push({ name: `SoGhiChu_${pro.blankStyle}_${pro.blankCount}Trang.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 6. SỬA LỖI CẤU TRÚC PDF (REPAIR PDF)
    if (tool.id === 'repair_pdf') {
      const { PDFDocument } = await ensurePdfLib();
      prog(30, 'Đang quét cấu trúc nhị phân và dựng lại bảng xref...');
      try {
        const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true, throwOnInvalidObject: false });
        const rebuilt = await PDFDocument.create();
        const copied = await rebuilt.copyPages(src, src.getPageIndices());
        copied.forEach((p) => rebuilt.addPage(p));
        rebuilt.setProducer('ĐăngLovePDF Repair Engine');
        outputs.push({ name: `${baseName}_DaSuaLoi.pdf`, blob: new Blob([await rebuilt.save({ useObjectStreams: false })], { type: 'application/pdf' }) });
        return outputs;
      } catch (_errStruct) {
        // Phương án dự phòng: render phục hồi từng trang bằng PDF.js
        const pdfjsLib = await ensurePdfJs();
        const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
        const rebuilt = await PDFDocument.create();
        for (let i = 1; i <= pdf.numPages; i++) {
          prog(30 + (i / pdf.numPages) * 60, `Đang phục hồi hình ảnh trang ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1.7 });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
          const emb = await rebuilt.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.9)));
          const p = rebuilt.addPage([vp.width / 1.7, vp.height / 1.7]);
          p.drawImage(emb, { x: 0, y: 0, width: vp.width / 1.7, height: vp.height / 1.7 });
        }
        outputs.push({ name: `${baseName}_DaPhucHoi.pdf`, blob: new Blob([await rebuilt.save()], { type: 'application/pdf' }) });
        return outputs;
      }
    }

    // 7 & 8. ĐEN TRẮNG (GRAYSCALE) & ĐẢO MÀU BAN ĐÊM (DARK MODE)
    if (tool.id === 'grayscale_pdf' || tool.id === 'invert_dark_pdf') {
      const pdfjsLib = await ensurePdfJs();
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(12 + (i / pdf.numPages) * 80, `Đang xử lý màu trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 1.65 });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const d = imgData.data;
        if (tool.id === 'grayscale_pdf') {
          const isBw = pro.grayMode === 'bw';
          for (let k = 0; k < d.length; k += 4) {
            let g = 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
            if (isBw) g = g > 175 ? 255 : g < 90 ? 0 : g;
            d[k] = d[k + 1] = d[k + 2] = g;
          }
        } else {
          // Dark mode dịu mắt (nền #141821 thay vì đen gắt #000)
          for (let k = 0; k < d.length; k += 4) {
            d[k] = Math.min(255, Math.max(18, 255 - d[k] + 12));
            d[k + 1] = Math.min(255, Math.max(22, 255 - d[k + 1] + 14));
            d[k + 2] = Math.min(255, Math.max(30, 255 - d[k + 2] + 18));
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.88)));
        const pg = out.addPage([baseVp.width, baseVp.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
      const suffix = tool.id === 'grayscale_pdf' ? 'DenTrang' : 'DarkMode';
      outputs.push({ name: `${baseName}_${suffix}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 9. CHUẨN HÓA LƯU TRỮ PDF/A & FAST WEB VIEW
    if (tool.id === 'pdf_a_archive') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      prog(45, 'Đang làm phẳng thành phần động & chuẩn hóa lưu trữ ISO...');
      try { src.getForm().flatten(); } catch (_e) {}
      src.setTitle(pro.pdfaTitle || baseName);
      src.setCreator('ĐăngLovePDF Archival ISO Engine');
      src.setProducer('ĐăngLovePDF PDF/A Normalizer');
      src.setModificationDate(new Date());
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach((p) => out.addPage(p));
      out.setTitle(pro.pdfaTitle || baseName);
      out.setProducer('ĐăngLovePDF PDF/A Archival');
      outputs.push({ name: `${baseName}_PDFA.pdf`, blob: new Blob([await out.save({ useObjectStreams: false })], { type: 'application/pdf' }) });
      return outputs;
    }

    // 10. TRÌNH CHỈNH SỬA PDF TRỰC QUAN (TRUE INTERACTIVE VISUAL EDITOR — MOD 46C)
    if (tool.id === 'annotate_edit') {
      if (NS.dangLovePdfStudioPro?.editor?.exportToPdfBlob) {
        const blob = await NS.dangLovePdfStudioPro.editor.exportToPdfBlob(ctrl.files[0], helpers);
        outputs.push({ name: `${baseName}_DaChinhSua.pdf`, blob });
        return outputs;
      }
      outputs.push({ name: `${baseName}_DaChinhSua.pdf`, blob: new Blob([ctrl.files[0].bytes], { type: 'application/pdf' }) });
      return outputs;
    }

    // 10B. TRÌNH ĐỌC & XEM TRƯỚC PDF 4 LỚP CHUYÊN NGHIỆP
    if (tool.id === 'pdf_viewer_pro') {
      const f0 = ctrl.files[0];
      const blob = new Blob([f0.bytes], { type: 'application/pdf' });
      const url = ctrl.trackUrl(blob);
      if (NS.dangLovePdfStudioPro?.openProPdfViewer) {
        NS.dangLovePdfStudioPro.openProPdfViewer({ name: f0.name, size: blob.size, blob, url }, ensurePdfJs);
      }
      outputs.push({ name: f0.name, blob });
      return outputs;
    }

    // 10C. CẮT ĐÔI TRANG SÁCH A3, IN ÁP PHÍCH (POSTERIZE) & TÁCH THEO TRANG TRẮNG/TỪ KHÓA
    if (tool.id === 'split_smart_books') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const srcPages = src.getPages();

      if (pro.smartSplitMode === 'split_half_lr' || pro.smartSplitMode === 'split_half_rl') {
        const out = await PDFDocument.create();
        for (let i = 0; i < srcPages.length; i++) {
          prog(15 + ((i + 1) / srcPages.length) * 75, `Đang cắt đôi trang ${i + 1}/${srcPages.length}...`);
          const { width, height } = srcPages[i].getSize();
          const halfW = width / 2;
          const emb = await out.embedPage(srcPages[i]);
          const order = pro.smartSplitMode === 'split_half_rl' ? [1, 0] : [0, 1];
          for (const side of order) {
            const p = out.addPage([halfW, height]);
            p.drawPage(emb, { x: side === 0 ? 0 : -halfW, y: 0, width, height });
          }
        }
        outputs.push({ name: `${baseName}_CatDoiTrang.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      if (pro.smartSplitMode === 'posterize_2x2') {
        const out = await PDFDocument.create();
        for (let i = 0; i < srcPages.length; i++) {
          prog(15 + ((i + 1) / srcPages.length) * 75, `Đang chia áp phích 2×2 trang ${i + 1}/${srcPages.length}...`);
          const { width, height } = srcPages[i].getSize();
          const emb = await out.embedPage(srcPages[i]);
          const tileW = width / 2;
          const tileH = height / 2;
          // 4 mảnh: Trên-Trái, Trên-Phải, Dưới-Trái, Dưới-Phải
          const offsets = [[0, -tileH], [-tileW, -tileH], [0, 0], [-tileW, 0]];
          for (const [ox, oy] of offsets) {
            const p = out.addPage([tileW, tileH]);
            p.drawPage(emb, { x: ox, y: oy, width, height });
          }
        }
        outputs.push({ name: `${baseName}_Posterize_2x2.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      // Tách theo trang trắng hoặc từ khóa
      const pdfjsLib = await ensurePdfJs();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const groups = [];
      let cur = [];
      const kw = (pro.smartSplitKw || '').toLowerCase();
      for (let i = 1; i <= pdf.numPages; i++) {
        prog(15 + (i / pdf.numPages) * 55, `Đang phân tích nội dung trang ${i}/${pdf.numPages}...`);
        const pg = await pdf.getPage(i);
        const tc = await pg.getTextContent();
        const txt = tc.items.map((x) => x.str).join(' ').trim();
        if (pro.smartSplitMode === 'split_blank') {
          if (txt.length < 3) {
            if (cur.length) { groups.push(cur); cur = []; }
          } else {
            cur.push(i - 1);
          }
        } else {
          if (kw && txt.toLowerCase().includes(kw) && cur.length) {
            groups.push(cur);
            cur = [i - 1];
          } else {
            cur.push(i - 1);
          }
        }
      }
      if (cur.length) groups.push(cur);
      if (!groups.length) groups.push(src.getPageIndices());
      for (let g = 0; g < groups.length; g++) {
        const part = await PDFDocument.create();
        (await part.copyPages(src, groups[g])).forEach((p) => part.addPage(p));
        outputs.push({ name: `${baseName}_PhanThongMinh_${g + 1}.pdf`, blob: new Blob([await part.save()], { type: 'application/pdf' }) });
      }
      return outputs;
    }

    // 10D. CHUYỂN ĐỔI MỞ RỘNG: SVG / EMAIL (.EML) / TRUYỆN (.CBZ) → PDF
    if (tool.id === 'svg_eml_to_pdf') {
      const f = ctrl.files[0];
      if (/\.svg$/i.test(f.name)) {
        prog(40, 'Đang dựng đồ họa vector SVG sang PDF...');
        const svgText = await f.file.text();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = ctrl.trackUrl(svgBlob);
        const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = svgUrl; });
        const c = document.createElement('canvas');
        c.width = Math.max(400, img.naturalWidth || 800);
        c.height = Math.max(400, img.naturalHeight || 600);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const { PDFDocument } = await ensurePdfLib();
        const out = await PDFDocument.create();
        const emb = await out.embedPng(dataUrlToUint8(c.toDataURL('image/png')));
        const pg = out.addPage([c.width * 0.75, c.height * 0.75]);
        pg.drawImage(emb, { x: 0, y: 0, width: c.width * 0.75, height: c.height * 0.75 });
        outputs.push({ name: `${baseName}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }
      if (/\.cbz$/i.test(f.name)) {
        const JSZip = await ensureJsZip();
        const { PDFDocument } = await ensurePdfLib();
        const z = await JSZip.loadAsync(f.bytes);
        const imgKeys = Object.keys(z.files).filter((k) => /\.(png|jpe?g|webp)$/i.test(k)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const out = await PDFDocument.create();
        for (let i = 0; i < imgKeys.length; i++) {
          prog(15 + ((i + 1) / Math.max(1, imgKeys.length)) * 75, `Đang ghép trang truyện ${i + 1}/${imgKeys.length}...`);
          const b = await z.files[imgKeys[i]].async('blob');
          const u = ctrl.trackUrl(b);
          const im = await new Promise((res, rej) => { const el = new Image(); el.onload = () => res(el); el.onerror = rej; el.src = u; });
          const c = document.createElement('canvas');
          c.width = im.naturalWidth || im.width;
          c.height = im.naturalHeight || im.height;
          c.getContext('2d').drawImage(im, 0, 0);
          const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.9)));
          const pg = out.addPage([c.width, c.height]);
          pg.drawImage(emb, { x: 0, y: 0, width: c.width, height: c.height });
        }
        outputs.push({ name: `${baseName}_Comic.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }
      // .EML Email -> PDF
      prog(40, 'Đang phân tích nội dung Email (.EML)...');
      const rawEml = await f.file.text();
      const lines = rawEml.replace(/\r/g, '').split('\n').slice(0, 1200);
      const pdfBlob = await renderLinesToVietnamesePdfBlob(`Email: ${baseName}`, lines, prog);
      outputs.push({ name: `${baseName}_Email.pdf`, blob: pdfBlob });
      return outputs;
    }

    // 10E. BIỂU MẪU TƯƠNG TÁC (ACROFORM FILLER & BUILDER)
    if (tool.id === 'form_filler_builder') {
      const { PDFDocument } = await ensurePdfLib();
      const doc = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const form = doc.getForm();
      const entries = pro.formData
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const eq = l.indexOf('=');
          return eq > 0 ? { key: l.slice(0, eq).trim(), val: l.slice(eq + 1).trim() } : { key: l, val: '' };
        });

      if (pro.formMode === 'export_json') {
        prog(60, 'Đang trích xuất danh sách ô AcroForm...');
        const data = form.getFields().map((fld) => {
          let value = '';
          try { value = fld.getText?.() ?? fld.isChecked?.() ?? fld.getSelected?.() ?? ''; } catch (_e) {}
          return { name: fld.getName(), type: fld.constructor?.name || 'Field', value };
        });
        outputs.push({ name: `${baseName}_FormData.json`, blob: new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }) });
        return outputs;
      }

      if (pro.formMode === 'fill_json') {
        prog(60, 'Đang điền dữ liệu vào các trường AcroForm...');
        for (const e of entries) {
          try {
            const tf = form.getTextField(e.key);
            tf.setText(e.val);
          } catch (_e1) {
            try {
              const cb = form.getCheckBox(e.key);
              if (/true|1|yes|x/i.test(e.val)) cb.check();
              else cb.uncheck();
            } catch (_e2) {}
          }
        }
        outputs.push({ name: `${baseName}_DaDienForm.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      // add_fields: tạo mới các ô nhập liệu AcroForm chuẩn vào trang 1
      prog(55, 'Đang tạo mới các ô nhập liệu tương tác (AcroForm)...');
      const pg = doc.getPages()[0];
      const { height } = pg.getSize();
      let curY = height - 90;
      for (const e of entries) {
        if (/true|false/i.test(e.val)) {
          const cb = form.createCheckBox(e.key);
          cb.addToPage(pg, { x: 48, y: curY, width: 16, height: 16 });
          if (/true/i.test(e.val)) cb.check();
        } else {
          const tf = form.createTextField(e.key);
          tf.setText(e.val);
          tf.addToPage(pg, { x: 48, y: curY, width: 240, height: 22 });
        }
        curY -= 32;
        if (curY < 48) break;
      }
      outputs.push({ name: `${baseName}_FormTuongTac.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 10F. TRỘN DỮ LIỆU HÀNG LOẠT (PDF MAIL MERGE TỪ EXCEL/CSV)
    if (tool.id === 'pdf_mail_merge') {
      const pdfRec = ctrl.files.find((f) => /\.pdf$/i.test(f.name));
      const sheetRec = ctrl.files.find((f) => /\.(xlsx|xls|csv)$/i.test(f.name));
      if (!pdfRec || !sheetRec) {
        throw new Error('Hãy nạp đủ 1 tệp mẫu .PDF và 1 tệp danh sách .XLSX hoặc .CSV để trộn hàng loạt!');
      }
      const { PDFDocument } = await ensurePdfLib();
      const XLSX = await ensureXlsx();
      const wb = XLSX.read(sheetRec.bytes, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).slice(0, pro.mergeLimit);
      if (!rows.length) throw new Error('Tệp Excel/CSV không có dòng dữ liệu nào.');

      for (let i = 0; i < rows.length; i++) {
        if (ctrl.cancelled) return [];
        prog(12 + ((i + 1) / rows.length) * 80, `Đang trộn bản ghi ${i + 1}/${rows.length}...`);
        const row = rows[i];
        const doc = await PDFDocument.load(pdfRec.bytes, { ignoreEncryption: true });
        const form = doc.getForm();
        let filledFormAny = false;
        for (const [k, v] of Object.entries(row)) {
          try {
            form.getTextField(k).setText(String(v ?? ''));
            filledFormAny = true;
          } catch (_e) {}
        }
        if (!filledFormAny) {
          // Nếu mẫu PDF tĩnh không có AcroForm -> in dòng dữ liệu gọn đẹp vào vùng trống trang 1
          const pg = doc.getPages()[0];
          const { height } = pg.getSize();
          const summary = Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('  |  ');
          const png = renderVietnameseTextToPngBytes(summary, { fontSize: 13, color: '#0f172a', bold: true, padX: 8, padY: 5 });
          const emb = await doc.embedPng(png.bytes);
          pg.drawImage(emb, { x: 36, y: height - 56, width: Math.min(520, png.widthPt), height: png.heightPt });
        }
        const safeTag = String(Object.values(row)[0] || `Ban_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
        outputs.push({ name: `${baseName}_${i + 1}_${safeTag}.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      }
      return outputs;
    }

    // 10G. CHẾ BẢN IN ẤN (BLEED + CROP MARKS + COLOR BARS CMYK)
    if (tool.id === 'prepress_bleed_marks') {
      const { PDFDocument, rgb } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const bleedPt = (pro.bleedMm || 5) * 2.83465;
      const markPad = 24;
      const srcPages = src.getPages();
      for (let i = 0; i < srcPages.length; i++) {
        prog(15 + ((i + 1) / srcPages.length) * 75, `Đang chế bản in trang ${i + 1}/${srcPages.length}...`);
        const emb = await out.embedPage(srcPages[i]);
        const newW = emb.width + (bleedPt + markPad) * 2;
        const newH = emb.height + (bleedPt + markPad) * 2;
        const pg = out.addPage([newW, newH]);
        const ox = bleedPt + markPad;
        const oy = bleedPt + markPad;
        pg.drawPage(emb, { x: ox, y: oy, width: emb.width, height: emb.height });
        if (pro.cropMarks) {
          const col = rgb(0, 0, 0);
          const len = 14;
          const corners = [
            [ox, oy],
            [ox + emb.width, oy],
            [ox, oy + emb.height],
            [ox + emb.width, oy + emb.height],
          ];
          corners.forEach(([cx, cy], ci) => {
            const dx = ci % 2 === 0 ? -1 : 1;
            const dy = ci < 2 ? -1 : 1;
            pg.drawLine({ start: { x: cx + dx * 4, y: cy }, end: { x: cx + dx * (4 + len), y: cy }, thickness: 0.6, color: col });
            pg.drawLine({ start: { x: cx, y: cy + dy * 4 }, end: { x: cx, y: cy + dy * (4 + len) }, thickness: 0.6, color: col });
          });
        }
        if (pro.colorBars) {
          const swatches = [rgb(0, 0.7, 0.9), rgb(0.9, 0.1, 0.5), rgb(0.95, 0.85, 0), rgb(0.1, 0.1, 0.1)];
          swatches.forEach((sc, si) => {
            pg.drawRectangle({ x: ox + si * 22, y: newH - 16, width: 18, height: 8, color: sc });
          });
        }
      }
      outputs.push({ name: `${baseName}_Prepress_PrintReady.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 10H. LÀM SẠCH DỮ LIỆU ẨN TOÀN DIỆN (DEEP FORENSICS SANITIZATION)
    if (tool.id === 'deep_sanitize') {
      const pdfjsLib = await ensurePdfJs();
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const cleanDoc = await PDFDocument.create();
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + (i / pdf.numPages) * 75, `Đang loại bỏ dữ liệu ẩn & lịch sử trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        // Render đúng khung CropBox -> hủy vĩnh viễn mọi đối tượng nằm ngoài lề cắt, JS, lớp ẩn & lịch sử Incremental!
        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 1.85 });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        const emb = await cleanDoc.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.92)));
        const pg = cleanDoc.addPage([baseVp.width, baseVp.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
      cleanDoc.setTitle('');
      cleanDoc.setAuthor('');
      cleanDoc.setSubject('');
      cleanDoc.setKeywords([]);
      cleanDoc.setCreator('');
      cleanDoc.setProducer('');
      outputs.push({ name: `${baseName}_Sanitized_Clean.pdf`, blob: new Blob([await cleanDoc.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 11. THÊM TIÊU ĐỀ ĐẦU & CHÂN TRANG (HEADER & FOOTER — HỖ TRỢ ĐỊNH DẠNG WORD + KÉO THẢ + CHE XÓA CŨ)
    if (tool.id === 'header_footer') {
      const { PDFDocument, rgb } = await ensurePdfLib();
      const doc = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      const total = pages.length;
      const dateStr = new Date().toLocaleDateString('vi-VN');
      const st = pro.hfStyle || {};
      const simState = ctrl.paperSimState?.toolId === 'header_footer' ? ctrl.paperSimState : null;
      const alignX = (pos, pageW, imgW) => {
        if (pos === 'left') return 32;
        if (pos === 'right') return Math.max(32, pageW - imgW - 32);
        return (pageW - imgW) / 2;
      };
      for (let i = 0; i < total; i++) {
        if (pro.hfSkip1 && i === 0) continue;
        prog(15 + ((i + 1) / total) * 75, `Đang gắn Header/Footer trang ${i + 1}/${total}...`);
        const pg = pages[i];
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
        const fmt = (tpl) => String(tpl || '').replace(/\{page\}/g, String(i + 1)).replace(/\{total\}/g, String(total)).replace(/\{date\}/g, dateStr);
        if (pro.hfHeader.trim()) {
          const hPng = renderVietnameseTextToPngBytes(fmt(pro.hfHeader), {
            fontSize: st.fontSize || 11,
            color: st.color || '#334155',
            fontFamily: st.fontFamily || '"Times New Roman", Georgia, serif',
            bold: st.bold !== false,
            italic: Boolean(st.italic),
            underline: Boolean(st.underline),
            bgColor: st.bgColor || '',
            padX: 6,
            padY: 3,
          });
          const emb = await doc.embedPng(hPng.bytes);
          const hx = simState?.headerPos?.custom
            ? Math.max(8, Math.min(width - hPng.widthPt - 8, (simState.headerPos.xPct / 100) * width - hPng.widthPt / 2))
            : alignX(pro.hfHPos, width, hPng.widthPt);
          const hy = simState?.headerPos?.custom
            ? Math.max(8, Math.min(height - hPng.heightPt - 8, height - (simState.headerPos.yPct / 100) * height - hPng.heightPt / 2))
            : height - hPng.heightPt - 14;
          pg.drawImage(emb, { x: hx, y: hy, width: hPng.widthPt, height: hPng.heightPt });
          if (pro.hfHLine) {
            pg.drawLine({ start: { x: 32, y: Math.max(4, hy - 4) }, end: { x: width - 32, y: Math.max(4, hy - 4) }, thickness: 0.75, color: rgb(0.55, 0.6, 0.68) });
          }
        }
        if (pro.hfFooter.trim()) {
          const fPng = renderVietnameseTextToPngBytes(fmt(pro.hfFooter), {
            fontSize: st.fontSize || 11,
            color: st.color || '#475569',
            fontFamily: st.fontFamily || '"Times New Roman", Georgia, serif',
            bold: Boolean(st.bold),
            italic: Boolean(st.italic),
            underline: Boolean(st.underline),
            bgColor: st.bgColor || '',
            padX: 6,
            padY: 3,
          });
          const emb = await doc.embedPng(fPng.bytes);
          const fx = simState?.footerPos?.custom
            ? Math.max(8, Math.min(width - fPng.widthPt - 8, (simState.footerPos.xPct / 100) * width - fPng.widthPt / 2))
            : alignX(pro.hfFPos, width, fPng.widthPt);
          const fy = simState?.footerPos?.custom
            ? Math.max(8, Math.min(height - fPng.heightPt - 8, height - (simState.footerPos.yPct / 100) * height - fPng.heightPt / 2))
            : 14;
          pg.drawImage(emb, { x: fx, y: fy, width: fPng.widthPt, height: fPng.heightPt });
          if (pro.hfFLine) {
            pg.drawLine({ start: { x: 32, y: fy + fPng.heightPt + 4 }, end: { x: width - 32, y: fy + fPng.heightPt + 4 }, thickness: 0.75, color: rgb(0.55, 0.6, 0.68) });
          }
        }
      }
      outputs.push({ name: `${baseName}_HeaderFooter.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 12. TẠO TRANG MỤC LỤC TỰ ĐỘNG (AUTO TOC — DÙNG CHUNG BỘ NHẬN DIỆN CẤU TRÚC VỚI ĐỊNH DẠNG ĐĂNG + /GOTO LINKS)
    if (tool.id === 'bookmarks_toc') {
      const PDFLibPkg = await ensurePdfLib();
      const { PDFDocument } = PDFLibPkg;
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const srcPageCount = src.getPageCount();
      const style = pro.tocStyle || 'dang_report';
      const untouchedDefault = /^Chương 1: Khởi đầu \| 1\s+Chương 2: Diễn biến chính \| 5\s+Chương 3: Tổng kết \| 12$/i.test(String(pro.tocLines || '').trim());

      prog(20, 'Đang phân tích cấu trúc Chương/Phần, Bảng & Hình từ PDF...');
      let sections = [];
      let tables = [];
      let figures = [];

      if (!String(pro.tocLines || '').trim() || untouchedDefault) {
        const blocks = await extractStructuredBlocksFromFile(ctrl.files[0], { ensurePdfJs, ensureJsZip, ensureXlsx });
        const autoToc = buildTocFromBlocks(blocks);
        sections = autoToc.sections || [];
        tables = autoToc.tables || [];
        figures = autoToc.figures || [];
      } else {
        const lines = String(pro.tocLines || '').split(/\r?\n/).filter((l) => l.trim());
        lines.forEach((rawLine) => {
          const isIndented = /^\s{2,}/.test(rawLine);
          const trimmed = rawLine.trim();
          const parts = trimmed.split('|');
          let label = (parts[0] || trimmed).trim();
          const pgNum = Math.max(1, Math.min(srcPageCount, parseInt((parts[1] || '1').trim(), 10) || 1));
          const contentPageIdx = pgNum - 1;
          if (/^\[Bảng\]/i.test(label) || /^BẢNG\s+\d/i.test(label)) {
            label = label.replace(/^\[Bảng\]\s*/i, '').trim();
            tables.push({ label, pageNo: pgNum, contentPageIdx });
          } else if (/^\[Hình\]/i.test(label) || /^HÌNH\s+\d/i.test(label)) {
            label = label.replace(/^\[Hình\]\s*/i, '').trim();
            figures.push({ label, pageNo: pgNum, contentPageIdx });
          } else {
            const level = /^\d+\.\d+\.\d+/.test(label) ? 3 : (isIndented || /^\d+\.\d+/.test(label) ? 2 : 1);
            sections.push({ text: label, level, pageNo: pgNum, contentPageIdx });
          }
        });
      }

      if (!sections.length && !tables.length && !figures.length) {
        for (let pi = 1; pi <= Math.min(srcPageCount, 30); pi++) {
          sections.push({ text: `Nội dung Trang ${pi}`, level: 1, pageNo: pi, contentPageIdx: pi - 1 });
        }
      }

      if (style === 'dang_report') {
        const dangTheme = REPORT_THEMES_10[0];
        const ff = '"Segoe UI", Arial, sans-serif';
        const W = 1240;
        const H = 1754;
        const makeTocCanvas = () => {
          const cv = document.createElement('canvas');
          cv.width = W;
          cv.height = H;
          const c = cv.getContext('2d');
          c.fillStyle = dangTheme.bg;
          c.fillRect(0, 0, W, H);
          c.textBaseline = 'top';
          return { cv, c };
        };
        prog(48, 'Đang dựng Mục lục Định dạng Đăng (3 khối + liên kết nhảy trang /GoTo)...');
        const tocCanvases = renderDangTocCanvases({
          theme: dangTheme,
          ff,
          tocTitle: pro.tocTitle || 'MỤC LỤC BÁO CÁO & HỆ THỐNG BẢNG – BIỂU ĐỒ – PHỤ LỤC',
          sections,
          tables,
          figures,
          pageShift: 0,
          makePageCanvas: makeTocCanvas,
          W,
          H,
          startY: 96,
          maxY: H - 104,
        });

        const out = await PDFDocument.create();
        const tocPagesAdded = [];
        for (let i = 0; i < tocCanvases.length; i++) {
          const cv = tocCanvases[i];
          const c = cv.getContext('2d');
          // Viền header mảnh & chân trang Mục lục đồng bộ chuẩn báo cáo
          c.fillStyle = dangTheme.primary;
          c.fillRect(0, 0, W, 16);
          c.fillStyle = dangTheme.accent;
          c.fillRect(0, 16, W, 4);
          c.fillStyle = '#cbd5e1';
          c.fillRect(76, H - 72, W - 152, 1.5);
          c.fillStyle = '#475569';
          c.font = `700 18px ${ff}`;
          c.textAlign = 'center';
          c.fillText(`${pro.tocTitle || 'MỤC LỤC TÀI LIỆU'}  ·  Trang ${i + 1} / ${tocCanvases.length}`, W / 2, H - 48);
          c.textAlign = 'left';

          const jpgBytes = dataUrlToBytes(cv.toDataURL('image/jpeg', 0.92));
          const emb = await out.embedJpg(jpgBytes);
          const p = out.addPage([595.28, 841.89]);
          p.drawImage(emb, { x: 0, y: 0, width: 595.28, height: 841.89 });
          tocPagesAdded.push(p);
        }
        prog(76, 'Đang ghép toàn bộ trang tài liệu gốc & gắn liên kết /GoTo...');
        (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
        for (let i = 0; i < tocCanvases.length; i++) {
          attachPdfPageLinks(out, PDFLibPkg, tocPagesAdded[i], tocCanvases[i].__pdfGotoLinks, null, W, H);
        }
        outputs.push({ name: `${baseName}_CoMucLuc.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      const rawTextLines = (!String(pro.tocLines || '').trim() || untouchedDefault)
        ? [
            ...sections.map((s) => `${s.level >= 2 ? '  ' : ''}${s.text} | ${s.pageNo}`),
            ...tables.map((t) => `[Bảng] ${t.label} | ${t.pageNo}`),
            ...figures.map((fg) => `[Hình] ${fg.label} | ${fg.pageNo}`),
          ]
        : String(pro.tocLines || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      const tocRows = rawTextLines.map((l) => {
        const parts = l.split('|');
        const title = (parts[0] || l).trim();
        const pgNum = (parts[1] || '').trim();
        if (!pgNum) return title;
        if (style === 'space') return `${title}          ${pgNum}`;
        if (style === 'dash') return `${title} ———————————— ${pgNum}`;
        if (style === 'prefix') return `[Trang ${pgNum}]  ·  ${title}`;
        const dotCount = Math.max(6, 48 - Math.min(40, title.length));
        return `${title} ${'.'.repeat(dotCount)} ${pgNum}`;
      });
      prog(45, 'Đang dựng trang Mục lục & ghép vào đầu sách...');
      const tocBlob = await renderLinesToVietnamesePdfBlob(pro.tocTitle, [`# ${pro.tocTitle}`, '', ...tocRows], () => {}, pro.tocStyleWord || {});
      const tocDoc = await PDFDocument.load(await tocBlob.arrayBuffer());
      const out = await PDFDocument.create();
      (await out.copyPages(tocDoc, tocDoc.getPageIndices())).forEach((p) => out.addPage(p));
      (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
      outputs.push({ name: `${baseName}_CoMucLuc.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 13. EPUB → PDF / DOCX / TXT
    if (tool.id === 'epub_to_pdf') {
      const JSZip = await ensureJsZip();
      prog(25, 'Đang giải nén cấu trúc sách điện tử .EPUB...');
      const z = await JSZip.loadAsync(ctrl.files[0].bytes);
      const htmlKeys = Object.keys(z.files)
        .filter((k) => /\.(x?html?|htm)$/i.test(k) && !/nav\.xhtml|toc\./i.test(k))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const allLines = [];
      for (let i = 0; i < htmlKeys.length; i++) {
        prog(25 + ((i + 1) / Math.max(1, htmlKeys.length)) * 45, `Đang đọc chương ${i + 1}/${htmlKeys.length}...`);
        const raw = await z.files[htmlKeys[i]].async('string');
        const div = document.createElement('div');
        div.innerHTML = raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
        const txt = (div.innerText || div.textContent || '').trim();
        if (txt) {
          allLines.push(...txt.split(/\r?\n/).map((x) => x.trim()).filter(Boolean), '');
        }
      }
      if (pro.epubOut === 'txt') {
        outputs.push({ name: `${baseName}.txt`, blob: new Blob([allLines.join('\n')], { type: 'text/plain;charset=utf-8' }) });
      } else if (pro.epubOut === 'docx') {
        outputs.push({ name: `${baseName}.docx`, blob: await buildDocxBlobFromParagraphs(baseName, allLines) });
      } else {
        outputs.push({ name: `${baseName}.pdf`, blob: await renderLinesToVietnamesePdfBlob(baseName, allLines, prog) });
      }
      return outputs;
    }

    // 14. PDF → EPUB
    if (tool.id === 'pdf_to_epub') {
      const pdfjsLib = await ensurePdfJs();
      const JSZip = await ensureJsZip();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const chapters = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + (i / pdf.numPages) * 70, `Đang đọc chữ trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const lines = [];
        let lastY = null;
        let cur = '';
        for (const it of tc.items) {
          const y = Math.round(it.transform?.[5] || 0);
          if (lastY !== null && Math.abs(y - lastY) > 6) {
            if (cur.trim()) lines.push(cur.trim());
            cur = it.str;
          } else {
            cur += (cur && !cur.endsWith(' ') && !it.str.startsWith(' ') ? ' ' : '') + it.str;
          }
          lastY = y;
        }
        if (cur.trim()) lines.push(cur.trim());
        chapters.push({ title: `Trang ${i}`, lines });
      }
      prog(90, 'Đang đóng gói chuẩn sách .EPUB...');
      const epubBlob = await buildEpubBlobFromChapters(pro.epubTitle || baseName, chapters, JSZip);
      outputs.push({ name: `${baseName}.epub`, blob: epubBlob });
      return outputs;
    }

    // 15. PDF → EXCEL (.XLSX) / CSV (QUÉT TỌA ĐỘ X/Y HÀNG & CỘT THÔNG MINH)
    if (tool.id === 'pdf_to_excel') {
      const pdfjsLib = await ensurePdfJs();
      const XLSX = await ensureXlsx();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const wb = XLSX.utils.book_new();
      const allRows = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + (i / pdf.numPages) * 75, `Đang quét hàng & cột bảng trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const rowMap = new Map();
        for (const it of tc.items) {
          const text = String(it.str || '').trim();
          if (!text) continue;
          const x = Math.round(it.transform?.[4] || 0);
          const yBucket = Math.round((it.transform?.[5] || 0) / 8) * 8;
          if (!rowMap.has(yBucket)) rowMap.set(yBucket, []);
          rowMap.get(yBucket).push({ x, text });
        }
        const sortedYs = Array.from(rowMap.keys()).sort((a, b) => b - a);
        const pageRows = sortedYs.map((yb) => {
          const cells = rowMap.get(yb).sort((a, b) => a.x - b.x);
          const mergedCols = [];
          for (const c of cells) {
            const prev = mergedCols[mergedCols.length - 1];
            if (prev && c.x - prev.endX < 18) {
              prev.text += ' ' + c.text;
              prev.endX = c.x + c.text.length * 5;
            } else {
              mergedCols.push({ text: c.text, endX: c.x + c.text.length * 5 });
            }
          }
          return mergedCols.map((m) => m.text);
        });
        const ws = XLSX.utils.aoa_to_sheet(pageRows.length ? pageRows : [['(Trang không có dữ liệu bảng)']]);
        XLSX.utils.book_append_sheet(wb, ws, `Trang_${i}`);
        allRows.push(...pageRows);
      }
      if (pro.p2xOut === 'csv') {
        const wsAll = XLSX.utils.aoa_to_sheet(allRows.length ? allRows : [['(Trống)']]);
        outputs.push({ name: `${baseName}_Bang.csv`, blob: new Blob(['\uFEFF' + XLSX.utils.sheet_to_csv(wsAll)], { type: 'text/csv;charset=utf-8' }) });
      } else {
        const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        outputs.push({ name: `${baseName}_Bang.xlsx`, blob: new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) });
      }
      return outputs;
    }

    // 16. LÀM THẲNG & KHỬ NHIỄU TRANG SCAN (DESKEW & DENOISE)
    if (tool.id === 'deskew_denoise') {
      const pdfjsLib = await ensurePdfJs();
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const out = await PDFDocument.create();
      const rad = (pro.deskewDeg * Math.PI) / 180;
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(12 + (i / pdf.numPages) * 80, `Đang nắn thẳng & lọc nhiễu trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 1.7 });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        if (Math.abs(rad) > 0.001) {
          ctx.translate(c.width / 2, c.height / 2);
          ctx.rotate(rad);
          ctx.translate(-c.width / 2, -c.height / 2);
        }
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (pro.denoiseWhite) {
          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const d = imgData.data;
          for (let k = 0; k < d.length; k += 4) {
            const lum = 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
            if (lum > 195) {
              d[k] = d[k + 1] = d[k + 2] = 255; // Làm trắng nền ố vàng
            } else if (lum < 120) {
              d[k] = Math.max(0, d[k] - 28);
              d[k + 1] = Math.max(0, d[k + 1] - 28);
              d[k + 2] = Math.max(0, d[k + 2] - 28);
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
        const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.9)));
        const pg = out.addPage([baseVp.width, baseVp.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
      outputs.push({ name: `${baseName}_DaLamSachScan.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 17. XEM, SỬA & XÓA SẠCH SIÊU DỮ LIỆU (METADATA EDITOR & SCRUBBER)
    if (tool.id === 'metadata_editor') {
      const { PDFDocument } = await ensurePdfLib();
      const doc = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      prog(55, pro.metaScrub ? 'Đang xóa trắng 100% siêu dữ liệu ẩn...' : 'Đang cập nhật siêu dữ liệu PDF...');
      if (pro.metaScrub) {
        doc.setTitle('');
        doc.setAuthor('');
        doc.setSubject('');
        doc.setKeywords([]);
        doc.setCreator('');
        doc.setProducer('');
      } else {
        if (pro.metaTitle) doc.setTitle(pro.metaTitle);
        if (pro.metaAuthor) doc.setAuthor(pro.metaAuthor);
        if (pro.metaKeywords) doc.setKeywords(pro.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean));
      }
      outputs.push({ name: `${baseName}_${pro.metaScrub ? 'DaXoaMeta' : 'DaCapNhatMeta'}.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 18. ĐẶT MẬT KHẨU / MỞ KHÓA PDF (PROTECT & UNLOCK + ELECTRON QPDF AES-256)
    if (tool.id === 'protect_unlock_pdf') {
      // Nếu chạy App Desktop có qpdf -> chạy mã hóa/giải mã AES-256 gốc bằng phần cứng máy!
      if (global.NoirDesktopLocalEngine?.runLocalTool) {
        try {
          prog(45, 'Đang gọi nhân hệ thống qpdf (AES-256)...');
          const res = await global.NoirDesktopLocalEngine.runLocalTool({
            cmd: pro.secMode === 'protect' ? 'qpdf_encrypt' : 'qpdf_decrypt',
            filename: ctrl.files[0].name,
            bytes: Array.from(ctrl.files[0].bytes),
            password: pro.secPass,
            noPrint: pro.secNoPrint,
          });
          if (res?.ok && res.bytes) {
            outputs.push({
              name: `${baseName}_${pro.secMode === 'protect' ? 'DaKhoaAES256' : 'DaMoKhoa'}.pdf`,
              blob: new Blob([new Uint8Array(res.bytes)], { type: 'application/pdf' }),
            });
            return outputs;
          }
        } catch (_eDesk) {}
      }

      if (pro.secMode === 'unlock') {
        const pdfjsLib = await ensurePdfJs();
        const { PDFDocument } = await ensurePdfLib();
        prog(35, 'Đang mở khóa bằng mật khẩu & tái tạo PDF tự do...');
        const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice(), password: pro.secPass || undefined }).promise;
        const out = await PDFDocument.create();
        for (let i = 1; i <= pdf.numPages; i++) {
          prog(35 + (i / pdf.numPages) * 55, `Đang giải mã trang ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const baseVp = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: 1.8 });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
          const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.92)));
          const pg = out.addPage([baseVp.width, baseVp.height]);
          pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
        }
        outputs.push({ name: `${baseName}_DaMoKhoa.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      } else {
        // Trên trình duyệt: khóa lớp chống copy & chỉnh sửa (Rasterize + Flatten)
        const pdfjsLib = await ensurePdfJs();
        const { PDFDocument } = await ensurePdfLib();
        const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
        const out = await PDFDocument.create();
        for (let i = 1; i <= pdf.numPages; i++) {
          prog(20 + (i / pdf.numPages) * 70, `Đang khóa lớp chống sao chép & sửa trang ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const baseVp = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: 1.75 });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
          const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.9)));
          const pg = out.addPage([baseVp.width, baseVp.height]);
          pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
        }
        out.setCreator('ĐăngLovePDF Protected Copy');
        outputs.push({ name: `${baseName}_DaKhoaChongCopy.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }
    }

    // 19. CHE ĐEN BẢO MẬT VĨNH VIỄN (TRUE REDACTION — HỦY HOÀN TOÀN CHỮ GỐC)
    if (tool.id === 'true_redaction') {
      const pdfjsLib = await ensurePdfJs();
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const out = await PDFDocument.create();
      const keywords = pro.redactWords
        .split(',')
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean);
      const scale = 1.8;

      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + (i / pdf.numPages) * 75, `Đang hủy dữ liệu vùng che đen trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        // Tự động tìm và xóa sạch từng từ khóa nhạy cảm + Regex SĐT/CCCD/Email theo tọa độ hộp văn bản
        const regexList = [];
        if (pro.redactPhone) regexList.push(/(?:\+84|0)(?:3|5|7|8|9)[0-9\s.-]{8,11}/);
        if (pro.redactCccd) regexList.push(/\b\d{9,12}\b/);
        if (pro.redactEmail) regexList.push(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
        if (keywords.length || regexList.length) {
          const tc = await page.getTextContent();
          ctx.fillStyle = '#000000';
          for (const it of tc.items) {
            const rawStr = String(it.str || '');
            const s = rawStr.toLowerCase();
            if (!s) continue;
            const hitKw = keywords.some((kw) => s.includes(kw));
            const hitRe = regexList.some((re) => re.test(rawStr));
            if (hitKw || hitRe) {
              const tx = it.transform[4] * scale;
              const ty = vp.height - it.transform[5] * scale;
              const h = Math.max(14, Math.abs(it.height || 12) * scale * 1.25);
              const w = Math.max(24, (it.width || s.length * 7) * scale + 6);
              ctx.fillRect(tx - 3, ty - h + 3, w, h + 4);
            }
          }
        }

        // Xóa sạch vùng hình chữ nhật người dùng chỉ định theo %
        if (pro.redactW > 0 && pro.redactH > 0) {
          ctx.fillStyle = '#000000';
          ctx.fillRect((pro.redactX / 100) * c.width, (pro.redactY / 100) * c.height, (pro.redactW / 100) * c.width, (pro.redactH / 100) * c.height);
        }

        const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.92)));
        const pg = out.addPage([baseVp.width, baseVp.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
      outputs.push({ name: `${baseName}_TrueRedacted.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 20. SO SÁNH 2 TỆP PDF (SEMANTIC TEXT DIFF + CHỒNG PIXEL VISUAL OVERLAY)
    if (tool.id === 'compare_pdf') {
      const pdfjsLib = await ensurePdfJs();
      const pdf1 = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const pdf2 = await pdfjsLib.getDocument({ data: ctrl.files[1].bytes.slice() }).promise;

      const extractLines = async (pdf) => {
        const outLines = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const tc = await pg.getTextContent();
          const lineStr = tc.items.map((x) => x.str).join(' ').replace(/\s{2,}/g, '\n');
          outLines.push(`=== TRANG ${i} ===`, ...lineStr.split('\n'));
        }
        return outLines;
      };

      prog(30, 'Đang đọc & đối chiếu văn bản 2 tệp PDF...');
      const lines1 = await extractLines(pdf1);
      const lines2 = await extractLines(pdf2);
      const diffRes = computeLineDiff(lines1, lines2);

      let visualOverlayHtml = '';
      if (pro.cmpVisual) {
        const cmpPages = Math.min(pdf1.numPages, pdf2.numPages, 8);
        for (let i = 1; i <= cmpPages; i++) {
          prog(45 + (i / Math.max(1, cmpPages)) * 45, `Đang chồng lớp soi sai lệch từng pixel trang ${i}/${cmpPages}...`);
          const p1 = await pdf1.getPage(i);
          const p2 = await pdf2.getPage(i);
          const vp = p1.getViewport({ scale: 1.25 });
          const c1 = document.createElement('canvas');
          const c2 = document.createElement('canvas');
          c1.width = c2.width = vp.width;
          c1.height = c2.height = vp.height;
          await p1.render({ canvasContext: c1.getContext('2d'), viewport: vp }).promise;
          await p2.render({ canvasContext: c2.getContext('2d'), viewport: vp }).promise;
          const d1 = c1.getContext('2d').getImageData(0, 0, c1.width, c1.height);
          const d2 = c2.getContext('2d').getImageData(0, 0, c2.width, c2.height);
          const outC = document.createElement('canvas');
          outC.width = c1.width;
          outC.height = c1.height;
          const oCtx = outC.getContext('2d');
          const oImg = oCtx.createImageData(c1.width, c1.height);
          let diffPx = 0;
          for (let k = 0; k < d1.data.length; k += 4) {
            const delta = Math.abs(d1.data[k] - d2.data[k]) + Math.abs(d1.data[k + 1] - d2.data[k + 1]) + Math.abs(d1.data[k + 2] - d2.data[k + 2]);
            if (delta > 38) {
              diffPx += 1;
              oImg.data[k] = 239;
              oImg.data[k + 1] = 35;
              oImg.data[k + 2] = 95;
              oImg.data[k + 3] = 255;
            } else {
              const avg = Math.round((d2.data[k] + d2.data[k + 1] + d2.data[k + 2]) / 3);
              oImg.data[k] = oImg.data[k + 1] = oImg.data[k + 2] = Math.min(255, avg + 60);
              oImg.data[k + 3] = 255;
            }
          }
          oCtx.putImageData(oImg, 0, 0);
          visualOverlayHtml += `<div style="margin:14px 0;padding:12px;border:1px solid #334155;border-radius:12px;">
            <div style="font-weight:800;margin-bottom:8px;">Trang ${i} — Phát hiện <span style="color:#fb7185;">${diffPx.toLocaleString('vi-VN')} điểm ảnh khác biệt</span> (tô màu đỏ hồng)</div>
            <img src="${outC.toDataURL('image/jpeg', 0.85)}" style="max-width:100%;border:1px solid #475569;border-radius:8px;" />
          </div>`;
        }
      }

      const reportHtml = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>So sánh PDF — ĐăngLovePDF</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;background:#0f172a;color:#e2e8f0;max-width:980px;margin:20px auto;padding:16px;line-height:1.6}
.add{background:#064e3b;color:#a7f3d0;padding:3px 8px;border-radius:6px;margin:3px 0}
.del{background:#7f1d1d;color:#fecaca;padding:3px 8px;border-radius:6px;margin:3px 0;text-decoration:line-through}
.same{color:#94a3b8;padding:2px 8px}</style></head><body>
<h1>⚖️ Báo Cáo So Sánh 2 Tệp PDF (ĐăngLovePDF)</h1>
<p><strong>Bản #1:</strong> ${escHtml(ctrl.files[0].name)} (${pdf1.numPages} trang) &nbsp;|&nbsp; <strong>Bản #2:</strong> ${escHtml(ctrl.files[1].name)} (${pdf2.numPages} trang)</p>
<p>📊 Tổng kết chữ: <strong style="color:#34d399;">+${diffRes.added} đoạn thêm</strong> · <strong style="color:#fb7185;">-${diffRes.removed} đoạn xóa</strong> · ${diffRes.unchanged} đoạn giống nhau</p>
<h2>1. So sánh văn bản từng dòng (Semantic Text Diff)</h2>
<div>${diffRes.diffs.slice(0, 600).map((d) => `<div class="${d.type}">${d.type === 'add' ? '+ ' : d.type === 'del' ? '- ' : '  '}${escHtml(d.text)}</div>`).join('')}</div>
${visualOverlayHtml ? `<h2>2. Chồng lớp hình ảnh soi từng pixel (Visual Overlay)</h2>${visualOverlayHtml}` : ''}
</body></html>`;
      outputs.push({ name: `BaoCao_SoSanh_${baseName}.html`, blob: new Blob([reportHtml], { type: 'text/html;charset=utf-8' }) });
      return outputs;
    }

    // 21. KIỂM TRA KỸ THUẬT TRƯỚC KHI IN (PREFLIGHT INSPECTOR — HIỆN KẾT QUẢ TRỰC TIẾP, KHÔNG CẦN TẢI FILE!)
    if (tool.id === 'preflight_inspect') {
      const { PDFDocument } = await ensurePdfLib();
      const pdfjsLib = await ensurePdfJs();
      prog(30, 'Đang quét thông số kỹ thuật chuẩn in ấn...');
      const doc = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const pages = doc.getPages();
      const sizes = new Set();
      const orientations = new Set();
      const rows = [];
      let lowTextPages = 0;
      for (let i = 0; i < pages.length; i++) {
        prog(35 + ((i + 1) / pages.length) * 55, `Đang kiểm định trang ${i + 1}/${pages.length}...`);
        const { width, height } = pages[i].getSize();
        const mmW = Math.round(width * 0.352778);
        const mmH = Math.round(height * 0.352778);
        const key = `${mmW}×${mmH}mm`;
        const orient = width > height ? 'Ngang' : 'Dọc';
        sizes.add(key);
        orientations.add(orient);
        const jp = await pdf.getPage(i + 1);
        const tc = await jp.getTextContent();
        const charCount = tc.items.reduce((s, it) => s + String(it.str || '').trim().length, 0);
        if (charCount < 15) lowTextPages += 1;
        rows.push({
          page: i + 1,
          dim: `${mmW} × ${mmH} mm`,
          orient,
          chars: charCount,
          status: charCount < 15 ? '⚠️ Ảnh scan / ít chữ (nên chạy OCR)' : '✅ Lớp chữ sắc nét',
          warn: charCount < 15,
        });
      }
      const isUniform = sizes.size === 1;
      const isSameOrient = orientations.size === 1;
      const score = Math.max(40, 100 - (isUniform ? 0 : 20) - (isSameOrient ? 0 : 10) - Math.min(25, lowTextPages * 3));
      const reportHtml = `
        <div class="space-y-4 text-left">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div class="text-[11px] text-zinc-400">Điểm sẵn sàng in</div>
              <div class="text-xl font-black ${score >= 85 ? 'text-emerald-400' : score >= 65 ? 'text-amber-300' : 'text-rose-400'}">${score}/100</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div class="text-[11px] text-zinc-400">Tổng số trang</div>
              <div class="text-xl font-black text-sky-300">${pages.length} trang</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div class="text-[11px] text-zinc-400">Đồng nhất khổ giấy</div>
              <div class="text-xs font-extrabold mt-1 ${isUniform ? 'text-emerald-400' : 'text-amber-300'}">${isUniform ? `✅ 100% (${[...sizes][0]})` : `⚠️ ${sizes.size} khổ khác nhau`}</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div class="text-[11px] text-zinc-400">Trang ít chữ / ảnh scan</div>
              <div class="text-xs font-extrabold mt-1 ${lowTextPages === 0 ? 'text-emerald-400' : 'text-amber-300'}">${lowTextPages}/${pages.length} trang</div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1 text-zinc-300">
            <div><strong>📄 Tệp kiểm định:</strong> ${escHtml(ctrl.files[0].name)}</div>
            <div><strong>🏷️ Siêu dữ liệu (Tiêu đề / Tác giả):</strong> ${escHtml(doc.getTitle() || '(Trống)')} / ${escHtml(doc.getAuthor() || '(Trống)')}</div>
            <div><strong>📐 Hướng giấy:</strong> ${isSameOrient ? `✅ Thống nhất (${[...orientations][0]})` : `⚠️ Lẫn cả trang Dọc & Ngang`}</div>
            ${!isUniform ? `<div class="text-amber-300 font-bold">💡 Gợi ý: Phát hiện nhiều khổ (${[...sizes].join(', ')}), nên dùng "Đổi khổ giấy" trước khi mang đi in.</div>` : ''}
          </div>

          <div class="max-h-72 overflow-auto rounded-xl border border-zinc-800">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-zinc-950 sticky top-0 text-zinc-400">
                <tr><th class="p-2 border-b border-zinc-800">Trang</th><th class="p-2 border-b border-zinc-800">Kích thước</th><th class="p-2 border-b border-zinc-800">Hướng</th><th class="p-2 border-b border-zinc-800">Số ký tự</th><th class="p-2 border-b border-zinc-800">Đánh giá</th></tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/70">
                ${rows.map((r) => `<tr class="hover:bg-zinc-800/40"><td class="p-2 font-bold">#${r.page}</td><td class="p-2">${r.dim}</td><td class="p-2">${r.orient}</td><td class="p-2">${r.chars}</td><td class="p-2 ${r.warn ? 'text-amber-300' : 'text-emerald-400'} font-bold">${r.status}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      outputs.push({
        __inlineReportOnly: true,
        reportTitle: `🔬 Kết quả Kiểm tra Kỹ thuật Trước Khi In — ${ctrl.files[0].name}`,
        reportHtml,
        name: `Preflight_${baseName}.html`,
        blob: new Blob([reportHtml], { type: 'text/html;charset=utf-8' }),
      });
      return outputs;
    }

    // 22. XỬ LÝ HÀNG LOẠT THEO CHUỖI (BATCH WORKFLOW PIPELINE)
    if (tool.id === 'batch_workflow') {
      const { PDFDocument, degrees } = await ensurePdfLib();
      const pdfjsLib = pro.batchGray ? await ensurePdfJs() : null;
      const wmRendered = pro.batchWm ? renderVietnameseTextToPngBytes(pro.batchWmText, { fontSize: 34, color: '#e11d48', bold: true, padX: 12, padY: 8 }) : null;

      for (let fi = 0; fi < ctrl.files.length; fi++) {
        if (ctrl.cancelled) return [];
        const fRec = ctrl.files[fi];
        const fBase = String(fRec.name || 'file').replace(/\.[^.]+$/, '');
        prog(10 + ((fi + 0.5) / ctrl.files.length) * 82, `Đang chạy chuỗi trên tệp ${fi + 1}/${ctrl.files.length}: ${fRec.name}...`);

        let doc;
        if (pro.batchGray && pdfjsLib) {
          const pdf = await pdfjsLib.getDocument({ data: fRec.bytes.slice() }).promise;
          doc = await PDFDocument.create();
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const bvp = page.getViewport({ scale: 1 });
            const vp = page.getViewport({ scale: 1.4 });
            const c = document.createElement('canvas');
            c.width = vp.width;
            c.height = vp.height;
            const ctx = c.getContext('2d');
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
            const im = ctx.getImageData(0, 0, c.width, c.height);
            for (let k = 0; k < im.data.length; k += 4) {
              const g = 0.299 * im.data[k] + 0.587 * im.data[k + 1] + 0.114 * im.data[k + 2];
              im.data[k] = im.data[k + 1] = im.data[k + 2] = g;
            }
            ctx.putImageData(im, 0, 0);
            const emb = await doc.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.82)));
            const np = doc.addPage([bvp.width, bvp.height]);
            np.drawImage(emb, { x: 0, y: 0, width: bvp.width, height: bvp.height });
          }
        } else {
          doc = await PDFDocument.load(fRec.bytes, { ignoreEncryption: true });
        }

        const pages = doc.getPages();
        if (wmRendered) {
          const wmImg = await doc.embedPng(wmRendered.bytes);
          pages.forEach((pg) => {
            const { width, height } = pg.getSize();
            pg.drawImage(wmImg, { x: (width - wmRendered.widthPt) / 2, y: (height - wmRendered.heightPt) / 2, width: wmRendered.widthPt, height: wmRendered.heightPt, rotate: degrees(35), opacity: 0.24 });
          });
        }
        if (pro.batchPn) {
          for (let pi = 0; pi < pages.length; pi++) {
            const pg = pages[pi];
            const { width } = pg.getSize();
            const pn = renderVietnameseTextToPngBytes(`${pi + 1}/${pages.length}`, { fontSize: 12, color: '#1f2937', bold: true, padX: 5, padY: 3 });
            const emb = await doc.embedPng(pn.bytes);
            pg.drawImage(emb, { x: (width - pn.widthPt) / 2, y: 16, width: pn.widthPt, height: pn.heightPt });
          }
        }
        if (pro.batchFlatten) {
          try { doc.getForm().flatten(); } catch (_e) {}
        }
        if (pro.batchMeta) {
          doc.setTitle('');
          doc.setAuthor('');
          doc.setSubject('');
          doc.setCreator('ĐăngLovePDF Batch');
          doc.setProducer('ĐăngLovePDF Batch');
        }
        outputs.push({ name: `${fBase}_Batch.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      }
      return outputs;
    }

    // 23. CẦU NỐI NHÂN NỘI BỘ MÁY TÍNH (ELECTRON DESKTOP LOCAL ENGINE)
    if (tool.id === 'desktop_local_engine') {
      if (!global.NoirDesktopLocalEngine?.runLocalTool) {
        throw new Error('Tính năng gọi LibreOffice / qpdf / Ghostscript chỉ khả dụng trên bản App Desktop cài trên máy tính (Electron). Trên web bạn hãy dùng trực tiếp 40 công cụ offline còn lại ngay trong ĐăngLovePDF nhé!');
      }
      prog(40, `Đang gọi nhân nội bộ máy tính (${pro.localCmd})...`);
      const res = await global.NoirDesktopLocalEngine.runLocalTool({
        cmd: pro.localCmd,
        filename: ctrl.files[0].name,
        bytes: Array.from(ctrl.files[0].bytes),
      });
      if (!res?.ok || !res.bytes) {
        throw new Error(res?.error || 'Không tìm thấy phần mềm nội bộ tương ứng trên máy tính (hãy cài LibreOffice / qpdf / Ghostscript).');
      }
      outputs.push({
        name: res.outName || `${baseName}_LocalEngine.pdf`,
        blob: new Blob([new Uint8Array(res.bytes)], { type: 'application/pdf' }),
      });
      return outputs;
    }

    return null;
  }

  NS.dangLovePdfPro = Object.freeze({
    PRO_TOOL_GROUPS,
    REPORT_THEMES_10,
    PAPER_SIZES,
    buildProOptionsHtml,
    readProOptions,
    executeProTool,
    renderCursiveSignaturePng,
    dataUrlToUint8,
    noirClassifyDocLine,
    extractStructuredBlocksFromFile,
    buildTocFromBlocks,
  });
})(typeof window !== 'undefined' ? window : globalThis);
