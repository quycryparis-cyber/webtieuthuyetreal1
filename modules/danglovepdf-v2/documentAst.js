/**
 * ============================================================================
 * 📄 ĐĂNGLOVEPDF 2.0 — UNIFIED DOCUMENT AST & HEADING/TOC CLASSIFIER (Ch. 1 & 6)
 * ============================================================================
 * - Chuẩn hóa mọi đầu vào (DOCX, XLSX, Markdown, AI Text, PDF ở Nhịp 3) về
 *   1 cây tài liệu thống nhất (Unified Document AST) gồm 9 loại node chuẩn.
 * - Bộ phân loại Tiêu đề 4 cấp (CHƯƠNG / PHẦN / I. / 1.1. / 4.2.1. / Câu 1:)
 *   kèm ĐỦ 7 Luật Phủ Định Cứng (Hard Negative Rules) loại 100% rác Mục lục:
 *   ô bảng, phép tính `1. EBIT = ...`, bullet sau dấu `:`, câu văn dài, >150 ký tự.
 * ============================================================================
 */
(function initNoirDangLovePdfDocumentAst(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  const AST_NODE_TYPES = Object.freeze([
    'heading',
    'paragraph',
    'list',
    'table',
    'mathBlock',
    'mathImageBlock',
    'imageBlock',
    'callout',
    'pageBreak',
  ]);

  const VALID_ROMAN_RE = /^(?:X{0,3}(?:IX|IV|V?I{0,3})|I{1,3}|IV|VI{0,3}|IX|X)$/;
  const FRONT_BACK_MATTER_RE =
    /^(?:LỜI\s+(?:MỞ\s+ĐẦU|NÓI\s+ĐẦU|CẢM\s+ƠN|CAM\s+ĐOAN)|TÓM\s+TẮT(?:\s+(?:ĐIỀU\s+HÀNH|BÁO\s+CÁO))?|ABSTRACT|EXECUTIVE\s+SUMMARY|MỤC\s+LỤC(?:\s+BÁO\s+CÁO.*)?|DANH\s+MỤC\s+(?:BẢNG(?:\s+BIỂU)?|HÌNH(?:\s+ẢNH)?|BIỂU\s+ĐỒ|CHỮ\s+VIẾT\s+TẮT|TỪ\s+VIẾT\s+TẮT)|KẾT\s+LUẬN(?:\s+VÀ\s+KIẾN\s+NGHỊ)?|KIẾN\s+NGHỊ|TÀI\s+LIỆU\s+THAM\s+KHẢO|REFERENCES|BIBLIOGRAPHY|PHỤ\s+LỤC(?:\s+[A-Z0-9IVX]+(?:[:.\-–—]\s*.*)?)?)$/i;

  const SELF_TOC_TITLE_RE =
    /^(?:MỤC\s+LỤC(?:\s+BÁO\s+CÁO.*)?|TABLE\s+OF\s+CONTENTS|DANH\s+MỤC\s+(?:BẢNG(?:\s+BIỂU)?|HÌNH(?:\s+ẢNH)?|BIỂU\s+ĐỒ)(?:\s+DỮ\s+LIỆU)?)$/i;

  const CALC_STEP_RE =
    /^(?:\d+(?:\.\d+)*|[A-Za-z]\))?\s*(?:EBIT|EBITDA|EBT|EAT|NOPAT|FCF[0-9_]*|FCFF|FCFE|WACC|NPV|IRR|ROE|ROA|ROIC|EPS|P\/E|EV\/EBITDA|CAPM|Ke|Kd|Beta|V_\{?[A-Za-z0-9_]+\}?|Bước\s*\d+|Step\s*\d+|Công\s+thức|Thay\s+số|Ta\s+có|Suy\s+ra)\b.*(?:[=≈×÷≤≥]|->|=>)/i;

  const NUMERIC_EQ_RE = /(?:=|\u2248|\u00d7|\u00f7|\\frac|\\sum|\\int|\$\$|\d[\d.,]*\s*[=≈×÷]\s*[-+$]?\d)/;

  const ACADEMIC_TAG_CALLOUT_RE =
    /^(?:(\[(?:Quan\s+sát|Suy\s+luận|Đề\s+xuất|Kết\s+luận|Phân\s+tích|Lưu\s+ý|Cảnh\s+báo)\])|(Hiểu\s+kiểu\s+bình\s+dân|Chốt\s+ý\s+chuyên\s+môn|Tóm\s+tắt\s+nhanh|Lưu\s+ý\s+quan\s+trọng)\s*:)\s*(.*)$/i;

  function normText(s) {
    return String(s ?? '').normalize('NFC').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function makeInlineRun(text, opts = {}) {
    return {
      text: String(text ?? ''),
      bold: Boolean(opts.bold),
      italic: Boolean(opts.italic),
      code: Boolean(opts.code),
      math: Boolean(opts.math),
      tag: opts.tag || '',
      url: opts.url || '',
    };
  }

  function makeTableCell(input, opts = {}) {
    if (input && typeof input === 'object' && !Array.isArray(input) && Object.prototype.hasOwnProperty.call(input, 'text')) {
      return {
        text: normText(input.text),
        colSpan: Math.max(1, Number(input.colSpan || 1)),
        rowSpan: Math.max(1, Number(input.rowSpan || 1)),
        align: input.align || opts.align || 'left',
        isHeader: input.isHeader !== undefined ? Boolean(input.isHeader) : Boolean(opts.isHeader),
        paragraphs: Array.isArray(input.paragraphs) && input.paragraphs.length
          ? input.paragraphs.map((p) => String(p ?? '').trim()).filter(Boolean)
          : (normText(input.text) ? [normText(input.text)] : []),
        inlineRuns: Array.isArray(input.inlineRuns) ? input.inlineRuns : null,
        spannedCovered: Boolean(input.spannedCovered),
      };
    }
    const str = String(input ?? '').trim();
    const paras = str ? str.split(/\n+/).map((x) => x.trim()).filter(Boolean) : [];
    return {
      text: normText(str),
      colSpan: Math.max(1, Number(opts.colSpan || 1)),
      rowSpan: Math.max(1, Number(opts.rowSpan || 1)),
      align: opts.align || 'left',
      isHeader: Boolean(opts.isHeader),
      paragraphs: paras,
      inlineRuns: opts.inlineRuns || null,
      spannedCovered: Boolean(opts.spannedCovered),
    };
  }

  function inferColumnAlignments(headerRows = [], bodyRows = [], existingAligns = []) {
    const allRows = [...headerRows, ...bodyRows];
    const colCount = Math.max(
      existingAligns.length,
      ...allRows.map((r) => (Array.isArray(r) ? r.length : 0)),
      0
    );
    const sampleRows = bodyRows.length ? bodyRows : allRows.slice(1);
    const aligns = [];
    const numCellRe = /^[\s($₫€£¥+\-–—]*[\d.,]+(?:\s*(?:%|₫|USD|VND|tr|triệu|tỷ|k|K|M|B|bn|mn|x|lần|năm|tháng|đ))?\s*\)?$/i;

    for (let ci = 0; ci < colCount; ci++) {
      if (existingAligns[ci] && existingAligns[ci] !== 'auto') {
        aligns.push(existingAligns[ci]);
        continue;
      }
      let nonEmpty = 0;
      let numericHits = 0;
      for (const row of sampleRows) {
        const cell = row?.[ci];
        const txt = typeof cell === 'object' ? String(cell?.text || '').trim() : String(cell ?? '').trim();
        if (!txt || txt === '—' || txt === '-') continue;
        nonEmpty += 1;
        if (numCellRe.test(txt)) numericHits += 1;
      }
      if (nonEmpty >= 1 && numericHits / nonEmpty >= 0.6) {
        aligns.push('right');
      } else {
        aligns.push('left');
      }
    }
    return aligns;
  }

  const astNodes = {
    heading({ id, level = 1, text = '', numberPrefix = '', source = 'heuristic', includeInToc = true, pageNo = 1 } = {}) {
      const lvl = Math.min(4, Math.max(1, Number(level) || 1));
      const clean = normText(text);
      return {
        type: 'heading',
        id: id || '',
        level: lvl,
        text: clean,
        numberPrefix: normText(numberPrefix),
        source,
        includeInToc: Boolean(includeInToc) && !SELF_TOC_TITLE_RE.test(clean),
        pageNo: Number(pageNo) || 1,
      };
    },

    paragraph({ text = '', inlineRuns = null, align = 'justify', pageNo = 1 } = {}) {
      const clean = normText(text);
      return {
        type: 'paragraph',
        text: clean,
        inlineRuns: Array.isArray(inlineRuns) ? inlineRuns : (clean ? [makeInlineRun(clean)] : []),
        align: align || 'justify',
        pageNo: Number(pageNo) || 1,
      };
    },

    list({ ordered = false, items = [], pageNo = 1 } = {}) {
      const normalizedItems = (items || []).map((it) => {
        if (typeof it === 'string') {
          const clean = normText(it);
          return { text: clean, inlineRuns: [makeInlineRun(clean)], level: 0, marker: '' };
        }
        const clean = normText(it?.text || '');
        return {
          text: clean,
          inlineRuns: Array.isArray(it?.inlineRuns) ? it.inlineRuns : (clean ? [makeInlineRun(clean)] : []),
          level: Number(it?.level || 0),
          marker: String(it?.marker || ''),
        };
      }).filter((it) => it.text);
      return {
        type: 'list',
        ordered: Boolean(ordered),
        items: normalizedItems,
        pageNo: Number(pageNo) || 1,
      };
    },

    table({
      id = '',
      caption = '',
      sourceNote = '',
      headerRows = [],
      bodyRows = [],
      rows = null,
      colAligns = [],
      colWidths = [],
      hasMergedCells = false,
      pageNo = 1,
    } = {}) {
      let hdr = (headerRows || []).map((r) => r.map((c) => makeTableCell(c, { isHeader: true })));
      let bdy = (bodyRows || []).map((r) => r.map((c) => makeTableCell(c, { isHeader: false })));
      if (!hdr.length && !bdy.length && Array.isArray(rows) && rows.length) {
        hdr = [rows[0].map((c) => makeTableCell(c, { isHeader: true }))];
        bdy = rows.slice(1).map((r) => r.map((c) => makeTableCell(c, { isHeader: false })));
      }
      const allCellRows = [...hdr, ...bdy];
      const maxCols = Math.max(0, ...allCellRows.map((r) => r.length));
      const padRow = (r, isH) => {
        const out = r.slice();
        while (out.length < maxCols) out.push(makeTableCell('', { isHeader: isH }));
        return out;
      };
      hdr = hdr.map((r) => padRow(r, true));
      bdy = bdy.map((r) => padRow(r, false));

      const aligns = inferColumnAlignments(hdr, bdy, colAligns);
      const applyAligns = (r) => r.map((c, ci) => ({ ...c, align: c.align && c.align !== 'auto' ? c.align : (aligns[ci] || 'left') }));
      hdr = hdr.map(applyAligns);
      bdy = bdy.map(applyAligns);

      const detectedMerged =
        Boolean(hasMergedCells) ||
        [...hdr, ...bdy].some((r) => r.some((c) => c.colSpan > 1 || c.rowSpan > 1 || c.spannedCovered));
      const flatRows = [...hdr, ...bdy].map((r) => r.map((c) => c.text));

      return {
        type: 'table',
        id: id || '',
        caption: normText(caption),
        sourceNote: normText(sourceNote),
        headerRows: hdr,
        bodyRows: bdy,
        rows: flatRows,
        colAligns: aligns,
        colWidths: Array.isArray(colWidths) ? colWidths.slice() : [],
        hasMergedCells: detectedMerged,
        suggestLandscape: maxCols > 8,
        pageNo: Number(pageNo) || 1,
      };
    },

    mathBlock({ latex = '', displayText = '', source = 'latex', pageNo = 1 } = {}) {
      const cleanLatex = String(latex ?? '').trim();
      return {
        type: 'mathBlock',
        latex: cleanLatex,
        displayText: normText(displayText) || latexToReadablePlain(cleanLatex),
        source,
        pageNo: Number(pageNo) || 1,
      };
    },

    mathImageBlock({ dataUrl = '', width = 0, height = 0, altText = '', pageNo = 1 } = {}) {
      return {
        type: 'mathImageBlock',
        dataUrl: String(dataUrl || ''),
        width: Number(width) || 0,
        height: Number(height) || 0,
        altText: normText(altText),
        pageNo: Number(pageNo) || 1,
      };
    },

    imageBlock({ id = '', dataUrl = '', caption = '', width = 0, height = 0, pageNo = 1 } = {}) {
      return {
        type: 'imageBlock',
        id: id || '',
        dataUrl: String(dataUrl || ''),
        caption: normText(caption),
        width: Number(width) || 0,
        height: Number(height) || 0,
        pageNo: Number(pageNo) || 1,
      };
    },

    callout({ variant = 'info', title = '', text = '', inlineRuns = null, pageNo = 1 } = {}) {
      const clean = normText(text);
      return {
        type: 'callout',
        variant: variant || 'info',
        title: normText(title),
        text: clean,
        inlineRuns: Array.isArray(inlineRuns) ? inlineRuns : (clean ? [makeInlineRun(clean)] : []),
        pageNo: Number(pageNo) || 1,
      };
    },

    pageBreak() {
      return { type: 'pageBreak' };
    },
  };

  function latexToReadablePlain(latex) {
    let s = String(latex || '').trim();
    if (!s) return '';
    for (let i = 0; i < 4; i++) {
      s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
      s = s.replace(/\\sqrt(?:\[([^\]]+)\])?\s*\{([^{}]+)\}/g, (_m, deg, inner) => (deg ? `${deg}√(${inner})` : `√(${inner})`));
      s = s.replace(/\\text\s*\{([^{}]+)\}/g, '$1');
      s = s.replace(/\\(?:mathbf|mathrm|mathit|mathbb|mathcal)\s*\{([^{}]+)\}/g, '$1');
    }
    const symMap = [
      [/\\sum/g, '∑'],
      [/\\prod/g, '∏'],
      [/\\int/g, '∫'],
      [/\\times/g, '×'],
      [/\\div/g, '÷'],
      [/\\cdot/g, '·'],
      [/\\pm/g, '±'],
      [/\\approx/g, '≈'],
      [/\\neq|\\ne\b/g, '≠'],
      [/\\leq|\\le\b/g, '≤'],
      [/\\geq|\\ge\b/g, '≥'],
      [/\\infty/g, '∞'],
      [/\\alpha/g, 'α'],
      [/\\beta/g, 'β'],
      [/\\gamma/g, 'γ'],
      [/\\delta/g, 'δ'],
      [/\\Delta/g, 'Δ'],
      [/\\sigma/g, 'σ'],
      [/\\Sigma/g, 'Σ'],
      [/\\mu/g, 'μ'],
      [/\\lambda/g, 'λ'],
      [/\\pi/g, 'π'],
      [/\\theta/g, 'θ'],
      [/\\rho/g, 'ρ'],
      [/\\rightarrow|\\to\b/g, '→'],
      [/\\Rightarrow/g, '⇒'],
      [/\\left/g, ''],
      [/\\right/g, ''],
      [/\\%/g, '%'],
      [/\\_/g, '_'],
      [/\\\$/g, '$'],
    ];
    for (const [re, rep] of symMap) s = s.replace(re, rep);
    s = s.replace(/\^\{([^{}]+)\}/g, '^($1)').replace(/_\{([^{}]+)\}/g, '_$1');
    return s.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Bộ phân loại Tiêu đề 4 cấp kèm ĐỦ 7 Luật Phủ Định Cứng (Hard Negative Rules).
   * @param {string} rawText
   * @param {object} meta { inTable, explicitHeadingStyle, explicitLevel, isBold, isItalic, fontSize }
   * @param {object} context { prevEndedWithColon, bodyFontSize, prevText }
   */
  function classifyHeadingCandidate(rawText, meta = {}, context = {}) {
    const cleanText = normText(String(rawText || '').replace(/\*\*/g, '').replace(/`/g, ''));
    const fail = (reason) => ({
      isHeading: false,
      level: 0,
      numberPrefix: '',
      cleanText,
      reason,
      includeInToc: false,
    });

    if (!cleanText || cleanText.length < 2) return fail('empty');

    // Luật 1 (inTable): Mọi dòng nằm trong ô bảng TUYỆT ĐỐI KHÔNG làm heading/TOC
    if (meta.inTable === true) return fail('rule1_in_table');

    // Luật 2 (length/word cap): > 150 ký tự hoặc > 28 từ => KHÔNG phải heading
    const words = cleanText.split(/\s+/).filter(Boolean);
    if (cleanText.length > 150 || words.length > 28) return fail('rule2_too_long');

    // Bỏ qua các thẻ chú thích / tag học thuật / Nguồn / Chú thích bảng/hình / URL
    if (/^(?:Nguồn|Source|Ghi\s+chú|Note)\s*:/i.test(cleanText)) return fail('source_note');
    if (/^(?:Bảng|Table|Hình|Biểu\s+đồ|Figure|Fig\.?)\s+\d+(?:\.\d+)*(?:\s*[:.\-–—]|\s|$)/i.test(cleanText)) {
      return fail('caption_not_section_heading');
    }
    if (ACADEMIC_TAG_CALLOUT_RE.test(cleanText)) return fail('academic_tag_callout');
    if (/^https?:\/\/\S+$/i.test(cleanText)) return fail('url_only');

    // Luật 4 (math / calculation step guard): Phép tính / bước giải toán / công thức => CẤM vào TOC
    if (
      !meta.explicitHeadingStyle &&
      (NUMERIC_EQ_RE.test(cleanText) || CALC_STEP_RE.test(cleanText) || /[≈×÷≤≥]|=>|->/.test(cleanText))
    ) {
      return fail('rule4_math_or_calc_step');
    }
    if (meta.explicitHeadingStyle && CALC_STEP_RE.test(cleanText)) {
      return fail('rule4_calc_step_even_styled');
    }

    // Luật 3 (trailing punctuation & multi-sentence guard)
    if (!meta.explicitHeadingStyle) {
      if (/[,;!?]$/.test(cleanText)) return fail('rule3_trailing_punct');
      const bodyAfterNumPrefix = cleanText.replace(/^(?:(?:CHƯƠNG|PHẦN|PART|CHAPTER)\s+(?:[IVXLCDM]+|\d+)|[IVXLCDM]{1,6}|\d+(?:\.\d+)*|[A-Ha-h])\.\s+/i, '');
      if (/\.\s+[A-ZÀ-Ỹ]/.test(bodyAfterNumPrefix)) {
        return fail('rule3_multi_sentence');
      }
      if (/\.$/.test(cleanText) && words.length >= 6 && !/et\s+al\.$/i.test(cleanText)) {
        return fail('rule3_sentence_period');
      }
    }

    // Luật 5 (bold-lead-in & list-item-after-colon guard)
    const boldColonMatch = cleanText.match(/^([^:]{2,55}):\s+(.+)$/);
    if (
      boldColonMatch &&
      !/^(?:CHƯƠNG|PHẦN|PART|CHAPTER|MỤC|BÀI|CÂU|GIẢI\s+PHÁP|NHÓM\s+GIẢI\s+PHÁP|VẤN\s+ĐỀ|TRƯỜNG\s+HỢP|CASE|PHỤ\s+LỤC)\b/i.test(
        boldColonMatch[1].trim()
      ) &&
      boldColonMatch[2].length > 45 &&
      !meta.explicitHeadingStyle
    ) {
      return fail('rule5_bold_lead_in_paragraph');
    }

    // Nhận diện mẫu 4 cấp tiêu đề
    let level = 0;
    let numberPrefix = '';
    const explicitL1 = cleanText.match(/^(PHẦN|CHƯƠNG|PART|CHAPTER)\s+([IVXLCDM]+|\d+)(\s*[:.\-–—]\s*.*)?$/i);
    const frontBack = cleanText.length <= 64 && FRONT_BACK_MATTER_RE.test(cleanText);
    const mDec4 = cleanText.match(/^(\d{1,2}\.\d{1,2}\.\d{1,2}\.\d{1,2})\.?\s+(.+)$/);
    const mDec3 = !mDec4 && cleanText.match(/^(\d{1,2}\.\d{1,2}\.\d{1,2})\.?\s+(.+)$/);
    const mDec2 = !mDec4 && !mDec3 && cleanText.match(/^(\d{1,2}\.\d{1,2})\.?\s+(.+)$/);
    const mRoman = cleanText.match(/^([IVXLCDM]{1,6})\.\s+(.+)$/);
    const mExam = cleanText.match(/^(Câu|Bài|Mục|Giải\s+pháp|Nhóm\s+giải\s+pháp|Vấn\s+đề|Trường\s+hợp|Case|Question|Problem)\s+(\d+[a-z]?)(?:\s*[:.\-–—]\s*(.*))?$/i);
    const mDec1 = !mDec4 && !mDec3 && !mDec2 && cleanText.match(/^(\d{1,2})\.\s+(.+)$/);
    const mUpperAlpha = cleanText.match(/^([A-H])\.\s+(.+)$/);
    const mLowerAlpha = cleanText.match(/^([a-h])([).])\s+(.+)$/);

    if (explicitL1 || frontBack) {
      level = 1;
      numberPrefix = explicitL1 ? `${explicitL1[1]} ${explicitL1[2]}` : '';
    } else if (mRoman && VALID_ROMAN_RE.test(mRoman[1])) {
      level = 2;
      numberPrefix = mRoman[1];
    } else if (mDec2) {
      level = 2;
      numberPrefix = mDec2[1];
    } else if (mDec3) {
      level = 3;
      numberPrefix = mDec3[1];
    } else if (mExam) {
      level = 3;
      numberPrefix = `${mExam[1]} ${mExam[2]}`;
    } else if (mDec4) {
      level = 4;
      numberPrefix = mDec4[1];
    } else if (mDec1) {
      // Luật 5: Số 1. 2. 3. đứng ngay sau đoạn văn kết thúc bằng dấu ':' là danh sách, không phải heading
      if (context.prevEndedWithColon && !meta.explicitHeadingStyle) {
        return fail('rule5_list_after_colon');
      }
      // Luật 4 phụ: tránh nhận nhầm phép toán hay đơn vị tài chính như "1. 500 triệu"
      if (/^[\d.,%$]/.test(mDec1[2])) return fail('rule4_numeric_list_item');
      level = 2;
      numberPrefix = mDec1[1];
    } else if (mUpperAlpha) {
      if (context.prevEndedWithColon && !meta.explicitHeadingStyle) return fail('rule5_list_after_colon');
      level = 2;
      numberPrefix = mUpperAlpha[1];
    } else if (mLowerAlpha) {
      if (context.prevEndedWithColon && !meta.explicitHeadingStyle) return fail('rule5_list_after_colon');
      if (!meta.explicitHeadingStyle && !meta.isBold) return fail('rule6_lowercase_list_not_bold');
      level = 4;
      numberPrefix = `${mLowerAlpha[1]}${mLowerAlpha[2]}`;
    } else if (meta.explicitHeadingStyle) {
      level = Math.min(4, Math.max(1, Number(meta.explicitLevel || 1)));
    } else {
      // Toàn chữ HOA ngắn (ví dụ: TỔNG QUAN THỊ TRƯỜNG) hoặc tiêu đề bôi đậm lớn hơn body rõ rệt
      const letters = cleanText.replace(/[^a-zA-ZÀ-ỹ]/g, '');
      const isAllCaps = letters.length >= 6 && letters === letters.toUpperCase() && words.length <= 14;
      const bodySz = Number(context.bodyFontSize || 0);
      const isLargerFont = bodySz > 0 && Number(meta.fontSize || 0) >= bodySz * 1.14;
      if (isAllCaps && (meta.isBold || isLargerFont || meta.fromMarkdown !== false)) {
        level = 1;
      } else if (meta.isBold && isLargerFont && words.length <= 14 && !/[.,;]$/.test(cleanText)) {
        level = 2;
      } else {
        return fail('no_heading_pattern');
      }
    }

    // Luật 6 (Typographic consistency): khi biết fontSize của body, dòng số đơn `1. ...` / `A. ...` cỡ chữ thường + không đậm => KHÔNG phải heading
    const bodySz = Number(context.bodyFontSize || 0);
    const hasHardLevelMarker = Boolean(explicitL1 || frontBack || mDec2 || mDec3 || mDec4 || mExam);
    if (
      !meta.explicitHeadingStyle &&
      !hasHardLevelMarker &&
      (mDec1 || mUpperAlpha || mLowerAlpha) &&
      (meta.isItalic || (bodySz > 0 && Number(meta.fontSize || 0) <= bodySz * 1.04 && !meta.isBold) || (meta.fontSize === undefined && meta.isBold === false))
    ) {
      return fail('rule6_typographic_mismatch');
    }

    // Nếu heading có explicitLevel từ DOCX/MD thì tôn trọng thứ bậc trừ khi explicitL1 rõ ràng
    if (meta.explicitHeadingStyle && meta.explicitLevel) {
      level = explicitL1 ? 1 : Math.min(4, Math.max(1, Number(meta.explicitLevel)));
    }

    const includeInToc = !SELF_TOC_TITLE_RE.test(cleanText);
    return {
      isHeading: true,
      level,
      numberPrefix,
      cleanText,
      reason: 'matched',
      includeInToc,
    };
  }

  /**
   * Luật 7 (Hierarchy orphan post-pass):
   * Lọc các mục số đơn lẻ `3. ...` hoặc `4. ...` lạc lõng trong văn xuôi (không có `1.`/`2.` đi trước
   * và không có explicitHeadingStyle) để chuyển về paragraph hoặc bỏ khỏi TOC.
   */
  function applyHierarchySanityPass(nodes = []) {
    const seenSimpleTopNums = new Set();
    let hasChapterOrPart = false;
    for (const n of nodes) {
      if (n.type === 'heading' && /^(?:PHẦN|CHƯƠNG|PART|CHAPTER)\b/i.test(n.text)) {
        hasChapterOrPart = true;
        break;
      }
    }

    return nodes.map((n) => {
      if (n.type !== 'heading') return n;
      if (n.source === 'docx-style' || n.source === 'markdown') return n;

      const mSimple = n.text.match(/^(\d{1,2})\.\s+/);
      if (mSimple) {
        const num = parseInt(mSimple[1], 10);
        if (num >= 3 && !seenSimpleTopNums.has(num - 1) && !seenSimpleTopNums.has(1)) {
          return { ...n, includeInToc: false };
        }
        seenSimpleTopNums.add(num);
      }

      if (hasChapterOrPart && n.level === 1 && !/^(?:PHẦN|CHƯƠNG|PART|CHAPTER)\b/i.test(n.text) && !FRONT_BACK_MATTER_RE.test(n.text)) {
        return { ...n, level: 2 };
      }
      return n;
    });
  }

  function createDocumentAst({
    title = '',
    subtitle = '',
    author = 'Mai Hải Đăng',
    sourceFormat = 'unknown',
    blocks = [],
    meta = {},
  } = {}) {
    const cleaned = applyHierarchySanityPass(Array.isArray(blocks) ? blocks : []);
    const stats = {
      headings: cleaned.filter((b) => b.type === 'heading').length,
      tocHeadings: cleaned.filter((b) => b.type === 'heading' && b.includeInToc !== false).length,
      paragraphs: cleaned.filter((b) => b.type === 'paragraph').length,
      lists: cleaned.filter((b) => b.type === 'list').length,
      tables: cleaned.filter((b) => b.type === 'table').length,
      mathBlocks: cleaned.filter((b) => b.type === 'mathBlock' || b.type === 'mathImageBlock').length,
      images: cleaned.filter((b) => b.type === 'imageBlock').length,
      callouts: cleaned.filter((b) => b.type === 'callout').length,
    };
    const suggestLandscape = Boolean(meta.suggestLandscape) || cleaned.some((b) => b.type === 'table' && b.suggestLandscape);
    return {
      schemaVersion: '2.0',
      title: normText(title),
      subtitle: normText(subtitle),
      author: normText(author),
      sourceFormat: String(sourceFormat || 'unknown').toLowerCase(),
      blocks: cleaned,
      stats,
      meta: {
        ...meta,
        suggestLandscape,
        warnings: Array.isArray(meta.warnings) ? meta.warnings.slice() : [],
      },
    };
  }

  function buildTocFromAst(ast, opts = {}) {
    const mode = opts.mode || 'standard';
    const maxDepth = opts.maxDepth !== undefined
      ? Number(opts.maxDepth)
      : (mode === 'compact' ? 2 : mode === 'exam' ? 4 : 3);
    const blocks = Array.isArray(ast?.blocks) ? ast.blocks : [];
    const sections = [];
    const tables = [];
    const figures = [];
    let tblCount = 0;
    let figCount = 0;

    for (const b of blocks) {
      const pNo = b.pageNo || 1;
      if (b.type === 'heading') {
        if (b.includeInToc === false) continue;
        if (SELF_TOC_TITLE_RE.test(b.text || '')) continue;
        if ((b.level || 1) > maxDepth) continue;
        sections.push({
          id: b.id || '',
          level: b.level || 1,
          text: b.text,
          pageNo: pNo,
        });
      } else if (b.type === 'table') {
        tblCount += 1;
        const lbl = b.caption ? b.caption : `Bảng ${tblCount}: Dữ liệu phân tích`;
        tables.push({ label: lbl, pageNo: pNo });
      } else if (b.type === 'imageBlock') {
        figCount += 1;
        const lbl = b.caption ? b.caption : `Hình ${figCount}: Minh họa tài liệu`;
        if (!figures.some((x) => x.label === lbl && x.pageNo === pNo)) {
          figures.push({ label: lbl, pageNo: pNo });
        }
      }
    }

    const tocTextLines = sections.map((s) => `${'  '.repeat(Math.max(0, (s.level || 1) - 1))}${s.text} | ${s.pageNo}`);
    return { sections, tables, figures, tocTextLines, maxDepth };
  }

  function astToLegacyBlocks(ast) {
    const blocks = Array.isArray(ast?.blocks) ? ast.blocks : [];
    const legacy = [];

    for (const b of blocks) {
      if (b.type === 'heading') {
        const kind = b.level <= 1 ? 'h1' : (b.level === 2 ? 'h2' : 'h3');
        legacy.push({
          type: b.level <= 2 ? 'heading' : 'subheading',
          kind,
          level: b.level,
          text: b.text,
          numberPrefix: b.numberPrefix,
          includeInToc: b.includeInToc !== false,
          source: b.source,
          pageNo: b.pageNo || 1,
          _astNode: b,
        });
      } else if (b.type === 'table') {
        legacy.push({
          type: 'table',
          caption: b.caption || '',
          sourceNote: b.sourceNote || '',
          rows: b.rows || [],
          headerRows: b.headerRows || [],
          bodyRows: b.bodyRows || [],
          colAligns: b.colAligns || [],
          colWidths: b.colWidths || [],
          hasMergedCells: Boolean(b.hasMergedCells),
          suggestLandscape: Boolean(b.suggestLandscape),
          pageNo: b.pageNo || 1,
          _astNode: b,
        });
      } else if (b.type === 'mathBlock') {
        legacy.push({
          type: 'math_block',
          latex: b.latex,
          text: b.displayText || latexToReadablePlain(b.latex),
          source: b.source,
          pageNo: b.pageNo || 1,
          _astNode: b,
        });
      } else if (b.type === 'mathImageBlock') {
        legacy.push({
          type: 'image',
          dataUrl: b.dataUrl,
          caption: b.altText || '',
          isMathImage: true,
          width: b.width,
          height: b.height,
          pageNo: b.pageNo || 1,
          _astNode: b,
        });
      } else if (b.type === 'imageBlock') {
        legacy.push({
          type: 'image',
          dataUrl: b.dataUrl,
          caption: b.caption || '',
          width: b.width,
          height: b.height,
          pageNo: b.pageNo || 1,
          _astNode: b,
        });
      } else if (b.type === 'list') {
        legacy.push({
          type: 'list',
          ordered: Boolean(b.ordered),
          items: b.items || [],
          text: (b.items || []).map((it, idx) => `${b.ordered ? `${idx + 1}.` : '•'} ${it.text}`).join('\n'),
          pageNo: b.pageNo || 1,
          _astNode: b,
        });
      } else if (b.type === 'callout') {
        legacy.push({
          type: 'callout',
          variant: b.variant || 'info',
          title: b.title || '',
          text: b.title ? `${b.title}: ${b.text}` : b.text,
          inlineRuns: b.inlineRuns,
          pageNo: b.pageNo || 1,
          _astNode: b,
        });
      } else if (b.type === 'pageBreak') {
        legacy.push({ type: 'page_break', _astNode: b });
      } else if (b.type === 'paragraph') {
        legacy.push({
          type: 'paragraph',
          kind: 'paragraph',
          text: b.text,
          inlineRuns: b.inlineRuns,
          align: b.align || 'justify',
          pageNo: b.pageNo || 1,
          _astNode: b,
        });
      }
    }

    legacy.__ast = ast;
    return legacy;
  }

  const exported = Object.freeze({
    AST_NODE_TYPES,
    ACADEMIC_TAG_CALLOUT_RE,
    SELF_TOC_TITLE_RE,
    normText,
    makeInlineRun,
    makeTableCell,
    inferColumnAlignments,
    latexToReadablePlain,
    nodes: astNodes,
    classifyHeadingCandidate,
    applyHierarchySanityPass,
    createDocumentAst,
    buildTocFromAst,
    astToLegacyBlocks,
  });

  NS.docAst = exported;
  global.NoirDocAst = exported;
})(typeof window !== 'undefined' ? window : globalThis);
