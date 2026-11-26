/**
 * ============================================================================
 * 📐 ĐĂNGLOVEPDF 2.0 — LOCAL PDF GEOMETRY ENGINE (Chương 4 & Chương 5)
 * ============================================================================
 * Kiến trúc 7 tầng phân tích PDF hình học 100% nội bộ (không cần server):
 *   1. Chuẩn hóa NFC + khâu dấu tiếng Việt tách mảnh + nối chữ theo gap hình học
 *   2. Lọc Header/Footer lặp theo không gian (10% mép) & boilerplate in web (1/13, URL, User prompt:)
 *   3. Dò bảng 2 lớp: (A) Đường kẻ vector getOperatorList + (B) Chiếu khoảng trắng 1D
 *      kèm Bộ bảo vệ MathAntiTableGuard 5 luật chặn nhầm công thức thành bảng
 *   4. Bảo vệ Header 2 dòng, gom ô nhiều dòng theo Key-Column, nối bảng vắt trang,
 *      gắn đúng Caption ("Bảng 13: ...") & Nguồn ("Nguồn: ...")
 *   5. Bộ tách đoạn văn Anti-Swallow 6 luật + tách Run-in Heading cùng dòng (vd: 4.1.)
 *   6. Cắt ảnh công thức HiDPI 3x nền trong suốt (mathImageBlock) + giữ ảnh biểu đồ thật
 *   7. Đánh giá độ phức tạp tài liệu ("Tài liệu khó" -> đề xuất Gemini Vision)
 * ============================================================================
 */
(function initNoirDangLovePdfGeometryEngine(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  function getAst() {
    const ast = global.NoirDocAst || NS.docAst;
    if (!ast) throw new Error('Thiếu modules/danglovepdf-v2/documentAst.js');
    return ast;
  }

  const COMBINING_MARK_RE = /^[\u0300-\u036f\u02c6\u02c7\u02d8-\u02dd\u1ab0-\u1aff\u1dc0-\u1dff]+$/;
  const MATH_FONT_RE = /(?:cmmi|cmsy|cmex|cmr\d|cambria\s*math|stix|symbol|latin\s*modern\s*math|asana|euler|mathjax)/i;
  const MATH_CHAR_RE = /[=≈∑∫√±×÷≤≥→⇒∈∉∀∃∂∇∞αβγδΔθλμπρσΣφψωΩ]/g;
  const CALC_EQUATION_RE =
    /(?:^|\b)(?:EBIT|EBITDA|EBT|EAT|NOPAT|FCF[0-9_]*|FCFF|FCFE|WACC|NPV|IRR|ROE|ROA|EPS|V_\{?[a-z0-9]+\}?|Step\s*\d|Bước\s*\d)\s*[=≈]/i;

  function normNfc(s) {
    return String(s ?? '').normalize('NFC');
  }

  // ============================================================================
  // TẦNG 1: KHÂU DẤU TIẾNG VIỆT & NỐI CHỮ THEO HÌNH HỌC X/Y
  // ============================================================================
  function joinPdfItemsByGeometry(items) {
    if (!items || !items.length) return '';
    const sorted = items.slice().sort((a, b) => a.x - b.x || b.y - a.y);

    // Gộp các mảnh chỉ chứa dấu thanh tổ hợp (accent-only item) vào ký tự ngay trước nó
    const stitched = [];
    for (const it of sorted) {
      if (COMBINING_MARK_RE.test(it.s) && stitched.length) {
        const prev = stitched[stitched.length - 1];
        if (it.x <= prev.endX + prev.fSz * 0.65) {
          prev.s = normNfc(prev.s + it.s);
          prev.endX = Math.max(prev.endX, it.endX);
          prev.hasTrailingSpace = prev.hasTrailingSpace || it.hasTrailingSpace;
          continue;
        }
      }
      stitched.push({ ...it });
    }

    let out = stitched[0].s;
    let prev = stitched[0];
    for (let k = 1; k < stitched.length; k++) {
      const cur = stitched[k];
      const gap = cur.x - prev.endX;
      const refSize = Math.min(prev.fSz, cur.fSz);
      const spaceThresh = Math.max(1.2, refSize * 0.22);
      const curStartsPunct = /^[.,;:!?)\]}»”’%]/.test(cur.s);
      const prevEndsOpen = /[(\[{«“‘\/-]$/.test(out);
      const needsSpace =
        !COMBINING_MARK_RE.test(cur.s) &&
        !curStartsPunct &&
        !prevEndsOpen &&
        (prev.hasTrailingSpace || cur.hasLeadingSpace || gap > spaceThresh);
      out += (needsSpace ? ' ' : '') + cur.s;
      prev = cur;
    }
    return normNfc(out).replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function extractPageVisualRows(tc, pageNo, pageWidth, pageHeight) {
    const rawItems = [];
    for (const it of tc?.items || []) {
      const rawStr = normNfc(it.str || '');
      const s = rawStr.trim();
      if (!s) continue;
      const x = Number(it.transform?.[4] || 0);
      const y = Number(it.transform?.[5] || 0);
      const fSz = Math.max(6, Math.hypot(it.transform?.[0] || 0, it.transform?.[1] || 0));
      const w = Number(it.width || 0) || s.length * fSz * 0.48;
      const fontMeta = `${it.fontName || ''} ${tc.styles?.[it.fontName]?.fontFamily || ''}`;
      const boldFlag = /bold|black|heavy|demi|semibold|(?:^|[-_])bd\b/i.test(fontMeta);
      const italicFlag = /italic|oblique|(?:^|[-_])it\b/i.test(fontMeta);
      const isMathFont = MATH_FONT_RE.test(fontMeta);

      rawItems.push({
        x,
        y,
        w,
        endX: x + w,
        s,
        fSz,
        boldFlag,
        italicFlag,
        isMathFont,
        hasLeadingSpace: /^\s/.test(rawStr),
        hasTrailingSpace: /\s$/.test(rawStr),
      });
    }

    rawItems.sort((a, b) => b.y - a.y || a.x - b.x);

    const rowsOnPage = [];
    for (const it of rawItems) {
      const isMark = COMBINING_MARK_RE.test(it.s);
      const row = rowsOnPage.find((r) => {
        const tol = isMark ? Math.max(5, r.avgSz * 0.72) : Math.max(3.5, Math.min(it.fSz, r.avgSz) * 0.46);
        return Math.abs(r.y - it.y) <= tol;
      });
      if (row) {
        row.items.push(it);
        if (!isMark) {
          row.avgSz = (row.avgSz * row.szCount + it.fSz) / (row.szCount + 1);
          row.szCount += 1;
        }
      } else {
        rowsOnPage.push({
          y: it.y,
          pageNo,
          pageWidth,
          pageHeight,
          avgSz: it.fSz,
          szCount: 1,
          items: [it],
        });
      }
    }
    rowsOnPage.sort((a, b) => b.y - a.y);

    for (const r of rowsOnPage) {
      r.items.sort((a, b) => a.x - b.x);
      const gapThresh = Math.max(12, r.avgSz * 1.42);
      const segs = [];
      for (const it of r.items) {
        const last = segs[segs.length - 1];
        const gap = last ? it.x - last.endX : 0;
        const isMarkOverlap = COMBINING_MARK_RE.test(it.s) && last && it.x <= last.endX + r.avgSz * 0.65;
        if (!last || (!isMarkOverlap && gap >= gapThresh)) {
          segs.push({
            x: it.x,
            endX: it.endX,
            yMin: it.y,
            yMax: it.y + it.fSz,
            items: [it],
            text: it.s,
            bold: it.boldFlag,
            italic: it.italicFlag,
            isMathFont: it.isMathFont,
          });
        } else {
          last.items.push(it);
          last.endX = Math.max(last.endX, it.endX);
          last.yMin = Math.min(last.yMin, it.y);
          last.yMax = Math.max(last.yMax, it.y + it.fSz);
          last.bold = last.bold || it.boldFlag;
          last.italic = last.italic || it.italicFlag;
          last.isMathFont = last.isMathFont || it.isMathFont;
        }
      }
      for (const sg of segs) {
        sg.text = joinPdfItemsByGeometry(sg.items);
      }
      r.segs = segs.filter((sg) => sg.text);
      r.text = r.segs.map((sg) => sg.text).join(' ').replace(/\s+/g, ' ').trim();
      r.xMin = r.items.length ? Math.min(...r.items.map((o) => o.x)) : 0;
      r.xMax = r.items.length ? Math.max(...r.items.map((o) => o.endX)) : 0;
      r.isBold = r.items.some((o) => o.boldFlag);
      r.allBold = r.items.length > 0 && r.items.every((o) => o.boldFlag);
      r.isItalic = r.items.length > 0 && r.items.every((o) => o.italicFlag);
      r.hasMathFont = r.items.some((o) => o.isMathFont);
      r.consumed = false;
    }

    return {
      rows: rowsOnPage.filter((r) => r.text),
      rawItems,
    };
  }

  // ============================================================================
  // TẦNG 2: LỌC HEADER / FOOTER LẶP & BOILERPLATE IN WEB
  // ============================================================================
  const WEB_BOILERPLATE_EDGE_RE =
    /^(?:(?:Trang|Page)\s*\d{1,4}(?:\s*(?:\/|of)\s*\d{1,4})?|\d{1,4}\s*\/\s*\d{1,4}|\d{1,4}|\d{1,2}\/\d{1,2}\/\d{2,4}(?:,?\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)?|https?:\/\/\S+|(?:Gemini|ChatGPT|Claude|Perplexity)\s*[-–|·].*|User\s+prompt\s*:?|System\s+prompt\s*:?)$/i;

  function stripHeadersFootersAndBoilerplate(pageDataList) {
    const totalPages = pageDataList.length;
    const freqMap = new Map();
    let strippedCount = 0;

    if (totalPages >= 2) {
      for (const pd of pageDataList) {
        const edgeSeenOnPage = new Set();
        for (const r of pd.rows) {
          const inTop = r.y >= pd.pageHeight * 0.89;
          const inBottom = r.y <= pd.pageHeight * 0.11;
          if (!inTop && !inBottom) continue;
          const normKey = `${inTop ? 'T' : 'B'}:${r.text.replace(/\d+/g, '#').toLowerCase()}`;
          if (!edgeSeenOnPage.has(normKey)) {
            edgeSeenOnPage.add(normKey);
            freqMap.set(normKey, (freqMap.get(normKey) || 0) + 1);
          }
        }
      }
    }

    const minRepeat = totalPages >= 2 ? Math.max(2, Math.ceil(totalPages * 0.45)) : Infinity;

    for (const pd of pageDataList) {
      const kept = [];
      for (const r of pd.rows) {
        const inTop = r.y >= pd.pageHeight * 0.89;
        const inBottom = r.y <= pd.pageHeight * 0.11;
        const normKey = `${inTop ? 'T' : 'B'}:${r.text.replace(/\d+/g, '#').toLowerCase()}`;
        const isFreqRepeat = (inTop || inBottom) && (freqMap.get(normKey) || 0) >= minRepeat;
        const isEdgeBoilerplate = (inTop || inBottom) && WEB_BOILERPLATE_EDGE_RE.test(r.text);
        const isInlinePromptLabel = /^(?:User\s+prompt|Prompt\s+người\s+dùng)\s*:?\s*$/i.test(r.text);

        if (isFreqRepeat || isEdgeBoilerplate || isInlinePromptLabel) {
          strippedCount += 1;
          continue;
        }
        kept.push(r);
      }
      pd.rows = kept;
    }

    return strippedCount;
  }

  // ============================================================================
  // TẦNG 3A: DÒ BẢNG TỪ ĐƯỜNG KẺ VECTOR (page.getOperatorList)
  // ============================================================================
  function mulMat(m1, m2) {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
  }

  function applyMat(m, x, y) {
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }

  function clusterCoords1D(vals, tol = 2.8) {
    if (!vals.length) return [];
    const sorted = vals.slice().sort((a, b) => a - b);
    const groups = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      const lastG = groups[groups.length - 1];
      if (sorted[i] - lastG[lastG.length - 1] <= tol) lastG.push(sorted[i]);
      else groups.push([sorted[i]]);
    }
    return groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
  }

  function extractVectorTablesFromOps(ops, pdfjsLib, pageItems, pageNo, ast) {
    const OPS = pdfjsLib?.OPS || {};
    const fnArr = ops?.fnArray || [];
    const argsArr = ops?.argsArray || [];
    if (!fnArr.length) return { tables: [], bitmapImages: [] };

    const hSegs = [];
    const vSegs = [];
    const ctmStack = [[1, 0, 0, 1, 0, 0]];
    let ctm = [1, 0, 0, 1, 0, 0];
    let pendingPath = [];
    let curX = 0;
    let curY = 0;

    const pushSeg = (x1, y1, x2, y2) => {
      if (Math.abs(y1 - y2) <= 1.5 && Math.abs(x1 - x2) >= 18) {
        hSegs.push({ y: (y1 + y2) / 2, x1: Math.min(x1, x2), x2: Math.max(x1, x2) });
      } else if (Math.abs(x1 - x2) <= 1.5 && Math.abs(y1 - y2) >= 14) {
        vSegs.push({ x: (x1 + x2) / 2, y1: Math.min(y1, y2), y2: Math.max(y1, y2) });
      }
    };

    const pushRect = (x, y, w, h) => {
      const [px1, py1] = applyMat(ctm, x, y);
      const [px2, py2] = applyMat(ctm, x + w, y + h);
      const rx1 = Math.min(px1, px2);
      const rx2 = Math.max(px1, px2);
      const ry1 = Math.min(py1, py2);
      const ry2 = Math.max(py1, py2);
      if (rx2 - rx1 < 8 || ry2 - ry1 < 8) return;
      // Bỏ qua khung nền toàn trang
      if (rx2 - rx1 > 540 && ry2 - ry1 > 740) return;
      hSegs.push({ y: ry1, x1: rx1, x2: rx2 }, { y: ry2, x1: rx1, x2: rx2 });
      vSegs.push({ x: rx1, y1: ry1, y2: ry2 }, { x: rx2, y1: ry1, y2: ry2 });
    };

    const consumePathOp = (subOp, args, idxRef) => {
      if (subOp === OPS.moveTo) {
        const [tx, ty] = applyMat(ctm, args[idxRef.i++], args[idxRef.i++]);
        curX = tx;
        curY = ty;
      } else if (subOp === OPS.lineTo) {
        const [tx, ty] = applyMat(ctm, args[idxRef.i++], args[idxRef.i++]);
        pendingPath.push([curX, curY, tx, ty]);
        curX = tx;
        curY = ty;
      } else if (subOp === OPS.rectangle) {
        const x = args[idxRef.i++];
        const y = args[idxRef.i++];
        const w = args[idxRef.i++];
        const h = args[idxRef.i++];
        pushRect(x, y, w, h);
      } else if (subOp === OPS.curveTo) {
        idxRef.i += 6;
      } else if (subOp === OPS.curveTo2 || subOp === OPS.curveTo3) {
        idxRef.i += 4;
      }
    };

    for (let i = 0; i < fnArr.length; i++) {
      const op = fnArr[i];
      const args = argsArr[i] || [];
      if (op === OPS.save) {
        ctmStack.push(ctm.slice());
      } else if (op === OPS.restore) {
        if (ctmStack.length > 1) ctm = ctmStack.pop();
      } else if (op === OPS.transform && args.length >= 6) {
        ctm = mulMat(ctm, args);
      } else if (op === OPS.constructPath && Array.isArray(args[0])) {
        const subOps = args[0];
        const coords = args[1] || [];
        const idxRef = { i: 0 };
        for (const sop of subOps) consumePathOp(sop, coords, idxRef);
      } else if (op === OPS.moveTo || op === OPS.lineTo || op === OPS.rectangle) {
        consumePathOp(op, args, { i: 0 });
      } else if (
        op === OPS.stroke ||
        op === OPS.closeStroke ||
        op === OPS.fill ||
        op === OPS.eoFill ||
        op === OPS.fillStroke ||
        op === OPS.closeFillStroke
      ) {
        for (const seg of pendingPath) pushSeg(seg[0], seg[1], seg[2], seg[3]);
        pendingPath = [];
      } else if (op === OPS.endPath) {
        pendingPath = [];
      }
    }
    for (const seg of pendingPath) pushSeg(seg[0], seg[1], seg[2], seg[3]);

    if (hSegs.length < 3 || vSegs.length < 3) return { tables: [] };

    // Gom các grid kín (tối thiểu 2 cột = 3 vLines, 2 hàng = 3 hLines)
    const yClusters = clusterCoords1D(hSegs.map((s) => s.y), 3.0).sort((a, b) => b - a);
    const xClusters = clusterCoords1D(vSegs.map((s) => s.x), 3.0).sort((a, b) => a - b);
    if (yClusters.length < 3 || xClusters.length < 3) return { tables: [] };

    // Tách vùng nếu có khoảng trống lớn không có vLine giao cắt
    const tableRegions = [];
    const buildRegion = (xs, ys) => {
      const xMin = xs[0];
      const xMax = xs[xs.length - 1];
      const yMax = ys[0];
      const yMin = ys[ys.length - 1];
      if (xs.length < 3 || ys.length < 3 || xMax - xMin < 60 || yMax - yMin < 28) return;

      // Xác nhận có item chữ nằm trong lưới
      const insideItems = pageItems.filter((it) => {
        const cx = (it.x + it.endX) / 2;
        const cy = it.y + it.fSz * 0.35;
        return cx >= xMin - 4 && cx <= xMax + 4 && cy >= yMin - 4 && cy <= yMax + 4;
      });
      if (insideItems.length < 4) return;

      const nRows = ys.length - 1;
      const nCols = xs.length - 1;
      const cellItems = Array.from({ length: nRows }, () => Array.from({ length: nCols }, () => []));

      for (const it of insideItems) {
        const cx = (it.x + it.endX) / 2;
        const cy = it.y + it.fSz * 0.35;
        let ri = nRows - 1;
        for (let r = 0; r < nRows; r++) {
          if (cy <= ys[r] + 3 && cy >= ys[r + 1] - 3) { ri = r; break; }
        }
        let ci = nCols - 1;
        for (let c = 0; c < nCols; c++) {
          if (cx >= xs[c] - 3 && cx <= xs[c + 1] + 3) { ci = c; break; }
        }
        cellItems[ri][ci].push(it);
      }

      const matrix = [];
      for (let r = 0; r < nRows; r++) {
        const rowTexts = [];
        for (let c = 0; c < nCols; c++) {
          const cIts = cellItems[r][c];
          if (!cIts.length) {
            rowTexts.push('');
            continue;
          }
          // Gom dòng bên trong 1 ô theo Y rồi nối hình học -> giữ nguyên multi-line cell
          cIts.sort((a, b) => b.y - a.y || a.x - b.x);
          const subLines = [];
          for (const it of cIts) {
            const sl = subLines.find((l) => Math.abs(l.y - it.y) <= Math.max(3, it.fSz * 0.45));
            if (sl) sl.items.push(it);
            else subLines.push({ y: it.y, items: [it] });
          }
          rowTexts.push(subLines.map((sl) => joinPdfItemsByGeometry(sl.items)).filter(Boolean).join('\n'));
        }
        if (rowTexts.some((t) => t !== '')) matrix.push(rowTexts);
      }

      if (matrix.length >= 2 && nCols <= 12) {
        const hdrRow = matrix[0];
        const bdyRows = mergeTableContinuationRows(matrix.slice(1), ast);
        if (bdyRows.length) {
          tableRegions.push({
            xMin,
            xMax,
            yMin,
            yMax,
            colCount: nCols,
            node: ast.nodes.table({
              headerRows: [hdrRow],
              bodyRows: bdyRows,
              pageNo,
            }),
          });
        }
      }
    };

    // Gom nhóm yClusters liên kết bởi vSegs
    const yGroups = [];
    let curGroup = [yClusters[0]];
    for (let yi = 1; yi < yClusters.length; yi++) {
      const yPrev = curGroup[curGroup.length - 1];
      const yCur = yClusters[yi];
      const bridged = vSegs.some((vs) => vs.y2 >= yPrev - 4 && vs.y1 <= yCur + 4);
      if (bridged) {
        curGroup.push(yCur);
      } else {
        yGroups.push(curGroup);
        curGroup = [yCur];
      }
    }
    yGroups.push(curGroup);

    for (const yg of yGroups) {
      if (yg.length < 3) continue;
      const ygTop = yg[0];
      const ygBot = yg[yg.length - 1];
      const relevantXs = clusterCoords1D(
        vSegs.filter((vs) => vs.y2 >= ygBot - 4 && vs.y1 <= ygTop + 4).map((vs) => vs.x),
        3.0
      ).sort((a, b) => a - b);
      buildRegion(relevantXs, yg);
    }

    return { tables: tableRegions };
  }

  // ============================================================================
  // TẦNG 3B: MATH ANTI-TABLE GUARD (5 LUẬT) + BORDERLESS WHITESPACE PROJECTION
  // ============================================================================
  function isMathRegionNotTable(candRows, medianFontSize) {
    if (!candRows || !candRows.length) return { reject: false, isMath: false };
    const allItems = candRows.flatMap((r) => r.items || []);
    const joinedText = candRows.map((r) => r.text).join('\n');
    const nonSpace = joinedText.replace(/\s+/g, '');
    const mathCharHits = (nonSpace.match(MATH_CHAR_RE) || []).length;
    const eqLines = candRows.filter((r) => /[=≈≤≥]/.test(r.text)).length;

    // Luật 1: Mật độ ký hiệu toán học >= 25% hoặc >= 2 dòng có '=' / '≈'
    const rule1Density =
      (nonSpace.length > 0 && mathCharHits / nonSpace.length >= 0.16 && mathCharHits >= 2) ||
      (eqLines >= 2 && candRows.every((r) => r.segs.length <= 4));

    // Luật 2: >= 20% item dùng Math font
    const mathFontCount = allItems.filter((it) => it.isMathFont).length;
    const rule2MathFont = allItems.length > 0 && mathFontCount / allItems.length >= 0.2;

    // Luật 3: Phân số dọc / sub-superscript (2 dòng kề sát dy < 0.95 * fontSize, token ngắn căn giữa)
    let stackedFractionHits = 0;
    for (let i = 1; i < candRows.length; i++) {
      const dy = candRows[i - 1].y - candRows[i].y;
      if (dy > 0 && dy < medianFontSize * 0.98 && candRows[i - 1].text.length <= 28 && candRows[i].text.length <= 28) {
        stackedFractionHits += 1;
      }
    }
    const rule3Fraction = stackedFractionHits >= 1 && (mathCharHits >= 1 || rule2MathFont || /\^|_|\+|-|\//.test(joinedText));

    // Luật 4: Bước tính toán / công thức dạng EBIT = ..., V_op = ..., 1. EBIT = ...
    const calcRows = candRows.filter((r) => CALC_EQUATION_RE.test(r.text) || /^\d+\.\s*[A-Za-z_]+\s*=/.test(r.text)).length;
    const rule4CalcStep = calcRows >= 1 && (eqLines >= 1 || mathCharHits >= 1);

    // Luật 5: Độ thẳng cột bảng kém
    const alignedRowCount = candRows.filter((r) => r.segs.length >= 2).length;
    const rule5WeakCols = alignedRowCount < 2;

    const isMath = Boolean(rule1Density || rule2MathFont || rule3Fraction || rule4CalcStep);
    return {
      reject: isMath || rule5WeakCols,
      isMath,
    };
  }

  function extractWhitespaceProjectionTables(rowsOnPage, pageIdxStart, medianFontSize, medianLineGap, ast) {
    const tokensOut = [];
    const total = rowsOnPage.length;
    const isTocLikeRow = (r) => /\.{3,}\s*\d{1,4}$/.test(r.text);
    const isSectionOrCapRow = (r) =>
      r.segs.length <= 1 &&
      /^(?:MỤC LỤC|DANH MỤC|CHƯƠNG\s+[IVXLCDM\d]+|PHẦN\s+[IVXLCDM\d]+|PHỤ LỤC|Bảng\s+\d|BẢNG\s+\d|Hình\s+\d|HÌNH\s+\d|Nguồn\s*:|Source\s*:)/i.test(
        r.text
      );

    let ri = 0;
    while (ri < total) {
      const curR = rowsOnPage[ri];
      if (curR.consumed) { ri++; continue; }

      if (curR.segs.length >= 2 && curR.segs.length <= 12 && !isTocLikeRow(curR) && !isSectionOrCapRow(curR)) {
        const run = [curR];
        let rj = ri + 1;

        // Kéo tối đa 2 dòng ngay phía trên nếu là phần đầu của Header 2 dòng bị tách (vd: "Thứ tự và giải ..." trên "pháp ...")
        let backStart = ri;
        while (backStart > 0 && ri - backStart < 2) {
          const prevCand = rowsOnPage[backStart - 1];
          if (prevCand.consumed || isTocLikeRow(prevCand) || isSectionOrCapRow(prevCand)) break;
          if (tokensOut.some((t) => t.sourceRows?.includes(prevCand))) break;
          const dyBack = prevCand.y - run[0].y;
          if (dyBack <= 0 || dyBack > Math.max(36, medianFontSize * 3.0)) break;
          if (prevCand.segs.length >= 2 || prevCand.isBold) {
            run.unshift(prevCand);
            backStart -= 1;
          } else {
            break;
          }
        }

        while (rj < total) {
          const nxt = rowsOnPage[rj];
          if (nxt.consumed) break;
          const prevR = run[run.length - 1];
          const dy = prevR.y - nxt.y;
          if (dy > Math.max(54, medianFontSize * 4.8)) break;
          if (isTocLikeRow(nxt) || isSectionOrCapRow(nxt)) break;
          if (nxt.segs.length === 1 && nxt.text.length > 88 && /[.!?]$/.test(nxt.text)) break;
          if (nxt.segs.length >= 2 || dy <= Math.max(24, medianFontSize * 2.1)) {
            run.push(nxt);
            rj++;
            continue;
          }
          break;
        }

        const trimmedRun = run.slice();
        while (
          trimmedRun.length > 2 &&
          trimmedRun[trimmedRun.length - 1].segs.length === 1 &&
          trimmedRun[trimmedRun.length - 1].text.length > 62
        ) {
          trimmedRun.pop();
          rj--;
        }

        // Kiểm tra 5-Rule MathAntiTableGuard trước khi dựng bảng
        const mathCheck = isMathRegionNotTable(trimmedRun, medianFontSize);
        if (mathCheck.reject) {
          if (mathCheck.isMath) {
            // Đánh dấu Math Region để Tầng 6 cắt ảnh công thức / giữ mathBlock
            const allIts = trimmedRun.flatMap((r) => r.items || []);
            const xMin = allIts.length ? Math.min(...allIts.map((o) => o.x)) : 40;
            const xMax = allIts.length ? Math.max(...allIts.map((o) => o.endX)) : 520;
            const yMin = allIts.length ? Math.min(...allIts.map((o) => o.y)) : trimmedRun[trimmedRun.length - 1].y;
            const yMax = allIts.length ? Math.max(...allIts.map((o) => o.y + o.fSz)) : trimmedRun[0].y + 14;
            trimmedRun.forEach((r) => { r.consumed = true; });
            // Thu hồi nếu đã lỡ push các backStart lines vào tokensOut trước đó
            while (tokensOut.length && trimmedRun.includes(tokensOut[tokensOut.length - 1].rawRow)) {
              tokensOut.pop();
            }
            tokensOut.push({
              kind: 'math_region',
              pageNo: curR.pageNo,
              xMin,
              yMin,
              xMax,
              yMax,
              fallbackText: trimmedRun.map((r) => r.text).join(' '),
            });
            ri = rj;
            continue;
          }
          // Không phải math và cũng không đủ cột -> rơi xuống dòng thường
          if (!curR.consumed) {
            tokensOut.push({ kind: 'line', rawRow: curR, ...rowToLineMeta(curR) });
          }
          ri++;
          continue;
        }

        // Chiếu 1D occupancy để tìm ranh giới cột sạch
        const built = reconstructAlignedTable(trimmedRun, medianFontSize, medianLineGap, ast);
        if (built) {
          // Xóa các dòng backStart nếu trước đó đã được đưa vào tokensOut dạng line
          while (tokensOut.length && trimmedRun.includes(tokensOut[tokensOut.length - 1].rawRow)) {
            tokensOut.pop();
          }
          trimmedRun.forEach((r) => { r.consumed = true; });
          tokensOut.push({
            kind: 'table',
            tableNode: built,
            pageNo: curR.pageNo,
            pageHeight: curR.pageHeight,
            yTop: trimmedRun[0].y,
            yBottom: trimmedRun[trimmedRun.length - 1].y,
            sourceRows: trimmedRun,
          });
          ri = rj;
          continue;
        }
      }

      if (!curR.consumed) {
        tokensOut.push({ kind: 'line', rawRow: curR, ...rowToLineMeta(curR) });
      }
      ri++;
    }

    return tokensOut;
  }

  function rowToLineMeta(r) {
    return {
      text: r.text,
      fontSize: r.avgSz,
      isBold: r.isBold,
      allBold: r.allBold,
      isItalic: r.isItalic,
      x: r.xMin,
      y: r.y,
      pageNo: r.pageNo,
      pageHeight: r.pageHeight,
      items: r.items,
      hasMathFont: r.hasMathFont,
    };
  }

  function reconstructAlignedTable(candRows, medianFontSize, medianLineGap, ast) {
    const anchors = [];
    for (const r of candRows) {
      for (const sg of r.segs) {
        const match = anchors.find((a) => Math.abs(a.x - sg.x) <= 26);
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
    const strongAnchors = anchors.filter((a) => a.hits >= 2 || anchors.length <= 4);
    const colsUse = strongAnchors.length >= 2 ? strongAnchors : anchors;
    if (colsUse.length < 2 || colsUse.length > 12) return null;

    const multiColRows = candRows.filter((r) => r.segs.length >= 2).length;
    if (multiColRows < 2) return null;

    // Gán từng segment vào đúng cột gần nhất + lưu metadata y & key-column
    const rawGrid = [];
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
      if (rowArr.some(Boolean)) {
        rawGrid.push({ cells: rowArr, y: r.y, isBold: r.isBold, segCount: r.segs.length });
      }
    }
    if (rawGrid.length < 2) return null;

    // 1. Bảo vệ Header 2 dòng: nếu dòng 0 và dòng 1 là 2 mảnh của tiêu đề cột -> gộp thành 1 dòng Header
    const looksNewKeyCell = (txt) =>
      /^(?:\d{1,2}\.\s+\S|GP\d+\b|STT\b|Nhóm\b|Tiêu\s+chí\b|Chỉ\s+tiêu\b|[A-Z]\.\s+\S)/i.test(String(txt || '').trim());

    let bodyStartIdx = 1;
    let mergedHeaderCells = rawGrid[0].cells.slice();
    if (rawGrid.length >= 3) {
      const r0 = rawGrid[0];
      const r1 = rawGrid[1];
      const r1LooksLikeDataKey = looksNewKeyCell(r1.cells[0]);
      const r1HasHeaderFragments =
        !r1LooksLikeDataKey &&
        ((r0.isBold && r1.isBold) ||
          r1.cells.some((c, ci) => c && /^[a-zà-ỹ]/.test(c) && Boolean(r0.cells[ci])) ||
          r1.cells.filter(Boolean).length < colsUse.length);
      if (r1HasHeaderFragments && r0.y - r1.y <= Math.max(28, medianFontSize * 2.4)) {
        mergedHeaderCells = mergedHeaderCells.map((h, ci) =>
          [h, r1.cells[ci]].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
        );
        bodyStartIdx = 2;
      }
    }

    // 2. Gom ô nhiều dòng theo Key-Column cho phần Body (chặn rách 1 ô thành nhiều hàng!)
    const bodyLogicalRows = [];
    for (let i = bodyStartIdx; i < rawGrid.length; i++) {
      const cur = rawGrid[i];
      const prev = bodyLogicalRows[bodyLogicalRows.length - 1];
      const col0 = String(cur.cells[0] || '').trim();
      const otherColsNonEmpty = cur.cells.slice(1).some((c) => String(c || '').trim() !== '');
      const dy = prev ? prev.lastY - cur.y : Infinity;

      const isContinuationByEmptyKey = prev && !col0 && otherColsNonEmpty;
      const isContinuationByLowercaseWrap =
        prev &&
        col0 &&
        !looksNewKeyCell(col0) &&
        /^[a-zà-ỹ,(]/.test(col0) &&
        dy <= Math.max(medianLineGap * 1.48, medianFontSize * 1.85);

      if (isContinuationByEmptyKey || isContinuationByLowercaseWrap) {
        prev.cells = prev.cells.map((v, ci) =>
          [v, cur.cells[ci]].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
        );
        prev.lastY = cur.y;
      } else {
        bodyLogicalRows.push({ cells: cur.cells.slice(), lastY: cur.y });
      }
    }

    if (!bodyLogicalRows.length) return null;
    const cleanedBody = mergeTableContinuationRows(
      bodyLogicalRows.map((r) => r.cells),
      ast
    );
    return ast.nodes.table({
      headerRows: [mergedHeaderCells],
      bodyRows: cleanedBody,
      pageNo: candRows[0].pageNo,
    });
  }

  // ============================================================================
  // TẦNG 5: ANTI-SWALLOW PARAGRAPH SPLITTER (6 LUẬT) & RUN-IN HEADING SPLIT
  // ============================================================================
  function trySplitRunInBoldHeading(lineTok, ast, bodyFontSize) {
    const items = lineTok.items;
    if (!items || items.length < 2) return null;

    // Tìm ranh giới đầu tiên nơi chuỗi item in đậm (cùng đầu dòng) chuyển sang chữ thường dài
    let splitIdx = -1;
    for (let i = 0; i < items.length; i++) {
      if (!items[i].boldFlag) {
        splitIdx = i;
        break;
      }
    }
    if (splitIdx <= 0 || splitIdx >= items.length) return null;
    const boldPart = joinPdfItemsByGeometry(items.slice(0, splitIdx));
    const regularPart = joinPdfItemsByGeometry(items.slice(splitIdx));
    if (boldPart.length < 6 || regularPart.length < 20) return null;

    const cls = ast.classifyHeadingCandidate(
      boldPart,
      { isBold: true, fontSize: lineTok.fontSize },
      { bodyFontSize, prevEndedWithColon: false }
    );
    if (!cls.isHeading) return null;

    return [
      { ...lineTok, text: boldPart, isBold: true, allBold: true, items: items.slice(0, splitIdx) },
      { ...lineTok, text: regularPart, isBold: false, allBold: false, items: items.slice(splitIdx) },
    ];
  }

  function isHardHeadingStart(text, fontSize, isBold, ast, bodyFontSize, prevEndedWithColon) {
    if (/^(?:MỤC\s+LỤC|DANH\s+MỤC|Bảng\s+\d|BẢNG\s+\d|Hình\s+\d|HÌNH\s+\d|Nguồn\s*:|Source\s*:)/i.test(text)) {
      return true;
    }
    const cls = ast.classifyHeadingCandidate(
      text,
      { fontSize, isBold },
      { bodyFontSize, prevEndedWithColon }
    );
    return cls.isHeading;
  }

  function mergeAndEmitPageProse(tokens, medianFontSize, medianLineGap, ast) {
    // Tách Run-in Bold Headings trước (vd: "**4.1. Nguyên tắc** Báo cáo được thực hiện...")
    const expanded = [];
    for (const tok of tokens) {
      if (tok.kind === 'line') {
        const splitPair = trySplitRunInBoldHeading(tok, ast, medianFontSize);
        if (splitPair) {
          expanded.push({ kind: 'line', ...splitPair[0] }, { kind: 'line', ...splitPair[1] });
          continue;
        }
      }
      expanded.push(tok);
    }

    // Gộp các dòng liên tiếp theo 6 Luật Anti-Swallow
    const leftMargin = expanded
      .filter((t) => t.kind === 'line' && Number.isFinite(t.x))
      .reduce((minX, t) => Math.min(minX, t.x), Infinity);

    const outTokens = [];
    for (const cur of expanded) {
      if (cur.kind !== 'line') {
        outTokens.push(cur);
        continue;
      }

      const prev = outTokens[outTokens.length - 1];
      if (!prev || prev.kind !== 'line' || prev.pageNo !== cur.pageNo) {
        outTokens.push({ ...cur });
        continue;
      }

      const prevEndedColon = /:\s*$/.test(prev.text);
      // Luật 1: Dòng hiện tại là tiêu đề / caption / nguồn
      const r1HeadingStart = isHardHeadingStart(cur.text, cur.fontSize, cur.isBold, ast, medianFontSize, prevEndedColon);
      // Luật 2: Dòng trước ĐÃ là tiêu đề và dòng hiện tại chuyển sang văn xuôi
      const prevWasHeading = ast.classifyHeadingCandidate(
        prev.text,
        { fontSize: prev.fontSize, isBold: prev.isBold },
        { bodyFontSize: medianFontSize, prevEndedWithColon: false }
      ).isHeading;
      const r2HeadingEnd =
        prevWasHeading &&
        (prev.isBold !== cur.isBold ||
          Math.abs(prev.fontSize - cur.fontSize) >= medianFontSize * 0.08 ||
          /^\d+\.\d+/.test(prev.text) ||
          /^(?:CHƯƠNG|PHẦN|Câu|Bài)\b/i.test(prev.text));
      // Luật 3: Đổi kích thước chữ hoặc in đậm -> thường đột ngột
      const r3FontShift =
        Math.abs(prev.fontSize - cur.fontSize) >= medianFontSize * 0.12 ||
        (prev.allBold && !cur.allBold && prev.text.length <= 120);
      // Luật 4: Khoảng cách dòng lớn (ngắt đoạn)
      const dy = prev.y - cur.y;
      const r4VertGap = dy > Math.max(medianLineGap * 1.48, medianFontSize * 1.75);
      // Luật 5: Thụt đầu dòng đoạn văn mới sau dấu ngắt câu
      const r5Indent =
        Number.isFinite(leftMargin) &&
        cur.x - leftMargin >= medianFontSize * 1.1 &&
        /[.!?:”"»)]$/.test(prev.text);
      // Luật 6: Gạch đầu dòng / thẻ học thuật / Nguồn & công thức độc lập không bị gộp lẫn
      const r6ListOrTag =
        /^(?:[-•*▪◦+]|\d{1,2}[).])\s+\S/.test(cur.text) ||
        ast.ACADEMIC_TAG_CALLOUT_RE.test(cur.text) ||
        /^(?:Nguồn|Source|Ghi\s+chú)\s*:/i.test(prev.text) ||
        CALC_EQUATION_RE.test(cur.text) ||
        /^[A-Za-z][A-Za-z0-9_]*\s*[=≈]\s*.+/.test(cur.text);

      if (r1HeadingStart || r2HeadingEnd || r3FontShift || r4VertGap || r5Indent || r6ListOrTag) {
        outTokens.push({ ...cur });
        continue;
      }

      const prevIncomplete = !/[.!?:"»)]$/.test(prev.text);
      const curContinuation = /^[a-zà-ỹ]/.test(cur.text) || /^[\(\[]?(?:USD|VND|EUR|triệu|tỷ)\.?$/i.test(cur.text);
      if ((prevIncomplete || curContinuation) && prev.text.length < 900) {
        prev.text = `${prev.text} ${cur.text}`.replace(/\s+/g, ' ').trim();
        prev.y = cur.y;
      } else {
        outTokens.push({ ...cur });
      }
    }

    return outTokens;
  }

  // ============================================================================
  // TẦNG 6: CẮT ẢNH CÔNG THỨC 3X DPI NỀN TRONG SUỐT & TRÍCH ẢNH NHÚNG
  // ============================================================================
  async function cropMathRegionToTransparentPng(page, region, pageCache) {
    if (typeof document === 'undefined' || typeof page?.render !== 'function' || typeof page?.getViewport !== 'function') {
      return null;
    }
    try {
      const vp1 = page.getViewport({ scale: 1.0 });
      const scale = Math.min(3.0, Math.max(1.5, 3200 / Math.max(500, vp1.width)));
      let fullCanvas = pageCache.get(region.pageNo);
      if (!fullCanvas) {
        const vp = page.getViewport({ scale });
        fullCanvas = document.createElement('canvas');
        fullCanvas.width = Math.round(vp.width);
        fullCanvas.height = Math.round(vp.height);
        const fctx = fullCanvas.getContext('2d');
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(0, 0, fullCanvas.width, fullCanvas.height);
        await page.render({ canvasContext: fctx, viewport: vp }).promise;
        pageCache.set(region.pageNo, fullCanvas);
      }

      const vpScale = page.getViewport({ scale });
      const pad = 6;
      const [vx1, vyTop] = vpScale.convertToViewportPoint
        ? vpScale.convertToViewportPoint(Math.max(0, region.xMin - pad), Math.min(vp1.height, region.yMax + pad))
        : [(region.xMin - pad) * scale, (vp1.height - (region.yMax + pad)) * scale];
      const [vx2, vyBot] = vpScale.convertToViewportPoint
        ? vpScale.convertToViewportPoint(Math.min(vp1.width, region.xMax + pad), Math.max(0, region.yMin - pad))
        : [(region.xMax + pad) * scale, (vp1.height - (region.yMin - pad)) * scale];

      const sx = Math.max(0, Math.floor(Math.min(vx1, vx2)));
      const sy = Math.max(0, Math.floor(Math.min(vyTop, vyBot)));
      const sw = Math.min(fullCanvas.width - sx, Math.max(24, Math.ceil(Math.abs(vx2 - vx1))));
      const sh = Math.min(fullCanvas.height - sy, Math.max(18, Math.ceil(Math.abs(vyBot - vyTop))));
      if (sw < 16 || sh < 12) return null;

      const cropCv = document.createElement('canvas');
      cropCv.width = sw;
      cropCv.height = sh;
      const cctx = cropCv.getContext('2d');
      cctx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

      // Chuyển nền trắng (R>242, G>242, B>242) thành trong suốt
      const imgData = cctx.getImageData(0, 0, sw, sh);
      const d = imgData.data;
      for (let p = 0; p < d.length; p += 4) {
        if (d[p] > 242 && d[p + 1] > 242 && d[p + 2] > 242) {
          d[p + 3] = 0;
        }
      }
      cctx.putImageData(imgData, 0, 0);
      return {
        dataUrl: cropCv.toDataURL('image/png'),
        width: Math.round(sw / scale),
        height: Math.round(sh / scale),
      };
    } catch (_eCrop) {
      return null;
    }
  }

  async function extractEmbeddedBitmapImages(page, pdfjsLib, ops, pageNo, ast) {
    if (typeof document === 'undefined' || !pdfjsLib?.OPS || !ops) return [];
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
            }
            pImgs.push(ast.nodes.imageBlock({ dataUrl: ic.toDataURL('image/png'), pageNo, caption: '' }));
          }
        } catch (_eObj) {}
      }
    }
    return pImgs;
  }

  // ============================================================================
  // TẦNG 4B: GOM Ô NỐI TIẾP TRỐNG CỘT KHÓA + NỐI BẢNG VẮT TRANG + GẮN CAPTION
  // ============================================================================
  function isContinuationRowPair(prevCells, curCells) {
    if (!prevCells || !curCells || !curCells.length) return false;
    const cellTxt = (c) => normNfc(c?.text ?? c ?? '').replace(/\s+/g, ' ').trim();
    const col0 = cellTxt(curCells[0]);
    const otherNonEmpty = curCells.slice(1).some((c) => cellTxt(c) !== '');
    const looksNewKey = /^(?:\d{1,3}\.\s+\S|GP\d+\b|STT\b|Bước\s*\d+|Nhóm\b|Tiêu\s+chí\b|Chỉ\s+tiêu\b|[A-Z]\.\s+\S)/i.test(col0);
    if (!col0 && otherNonEmpty) return true;
    if (col0 && !looksNewKey && /^[a-zà-ỹ,(]/.test(col0)) return true;
    return false;
  }

  function mergeTwoTableRows(prevCells, curCells, ast) {
    const len = Math.max(prevCells.length, curCells.length);
    const out = [];
    const cellTxt = (c) => normNfc(c?.text ?? c ?? '').replace(/\s+/g, ' ').trim();
    for (let ci = 0; ci < len; ci++) {
      const a = prevCells[ci];
      const b = curCells[ci];
      const ta = cellTxt(a);
      const tb = cellTxt(b);
      const mergedStr = [ta, tb].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      if (a && typeof a === 'object' && Object.prototype.hasOwnProperty.call(a, 'text')) {
        out.push(ast.makeTableCell(mergedStr, { ...a, align: a.align, isHeader: a.isHeader }));
      } else {
        out.push(mergedStr);
      }
    }
    return out;
  }

  function mergeTableContinuationRows(rows = [], ast) {
    const out = [];
    for (const r of rows) {
      if (!Array.isArray(r) || !r.some((c) => normNfc(c?.text ?? c ?? '').trim() !== '')) continue;
      const prev = out[out.length - 1];
      if (prev && isContinuationRowPair(prev, r)) {
        out[out.length - 1] = mergeTwoTableRows(prev, r, ast);
      } else {
        out.push(r.slice());
      }
    }
    return out;
  }

  function headerSimilarity(rowA = [], rowB = []) {
    const a = rowA.map((c) => normNfc(c?.text ?? c).toLowerCase()).filter(Boolean);
    const b = rowB.map((c) => normNfc(c?.text ?? c).toLowerCase()).filter(Boolean);
    if (!a.length || !b.length) return 0;
    let matches = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i] || (a[i].length >= 4 && b[i].includes(a[i])) || (b[i].length >= 4 && a[i].includes(b[i]))) {
        matches += 1;
      }
    }
    return matches / Math.max(a.length, b.length);
  }

  function mergeCrossPageTablesAndBindCaptions(nodes, ast) {
    const out = [];
    const tblCapRe = /^(?:Bảng|Table)\s+\d+(?:\.\d+)*\s*[:.\-–—]?\s*/i;
    const figCapRe = /^(?:Hình|Biểu\s+đồ|Figure|Fig\.?)\s+\d+(?:\.\d+)*\s*[:.\-–—]?\s*/i;
    const srcNoteRe = /^(?:Nguồn|Source|Ghi\s+chú)\s*:\s*\S+/i;

    for (let i = 0; i < nodes.length; i++) {
      const cur = nodes[i];
      const prev = out[out.length - 1];

      // Gắn Caption Bảng nếu ngay trước đó là "Bảng X: ..."
      if (cur.type === 'table' && prev && prev.type === 'paragraph' && tblCapRe.test(prev.text) && prev.text.length <= 165) {
        out[out.length - 1] = ast.nodes.table({ ...cur, caption: prev.text });
        continue;
      }

      // Nối bảng vắt trang: cur là table ở đầu trang p+1, prev là table kết thúc cuối trang p (cùng số cột +/-1)
      if (
        cur.type === 'table' &&
        prev &&
        prev.type === 'table' &&
        cur.pageNo === prev.pageNo + 1 &&
        !cur.caption &&
        Math.abs((prev.colAligns?.length || 0) - (cur.colAligns?.length || 0)) <= 1
      ) {
        const hdr1 = prev.headerRows?.[0] || [];
        const hdr2 = cur.headerRows?.[0] || [];
        const sim = headerSimilarity(hdr1, hdr2);
        const appendRows = sim >= 0.55 ? cur.bodyRows : [...cur.headerRows, ...cur.bodyRows];
        const mergedBody = mergeTableContinuationRows([...prev.bodyRows, ...appendRows], ast);
        const merged = ast.nodes.table({
          caption: prev.caption,
          sourceNote: cur.sourceNote || prev.sourceNote,
          headerRows: prev.headerRows,
          bodyRows: mergedBody,
          pageNo: prev.pageNo,
        });
        out[out.length - 1] = merged;
        continue;
      }

      // Gắn Nguồn: / Source: ngay sau Table
      if (cur.type === 'paragraph' && prev && prev.type === 'table' && srcNoteRe.test(cur.text) && cur.text.length <= 220 && !prev.sourceNote) {
        prev.sourceNote = cur.text;
        continue;
      }

      // Gắn Caption Hình ảnh
      if (cur.type === 'imageBlock' && prev && prev.type === 'paragraph' && figCapRe.test(prev.text) && prev.text.length <= 165) {
        out[out.length - 1] = ast.nodes.imageBlock({ ...cur, caption: prev.text });
        continue;
      }
      if (cur.type === 'paragraph' && prev && prev.type === 'imageBlock' && figCapRe.test(cur.text) && !prev.caption && cur.text.length <= 165) {
        prev.caption = cur.text;
        continue;
      }

      out.push(cur);
    }
    return out;
  }

  // ============================================================================
  // TẦNG 7: ĐÁNH GIÁ ĐỘ PHỨC TẠP TÀI LIỆU ("TÀI LIỆU KHÓ")
  // ============================================================================
  function evaluatePdfComplexity({ numPages, lowTextPages, mathRegionCount, tableCount, borderlessTableCount }) {
    let score = 0;
    const reasons = [];
    if (lowTextPages > 0) {
      score += 45;
      reasons.push(`Có ${lowTextPages} trang PDF scan / ít văn bản (nên dùng Gemini Vision hoặc OCR)`);
    }
    if (mathRegionCount > 0) {
      score += Math.min(40, mathRegionCount * 14);
      reasons.push(`Phát hiện ${mathRegionCount} vùng công thức toán / ký hiệu định lượng phức tạp`);
    }
    if (borderlessTableCount >= 2) {
      score += 20;
      reasons.push(`Có ${borderlessTableCount} bảng không kẻ viền phức tạp`);
    } else if (tableCount >= 4) {
      score += 12;
      reasons.push(`Mật độ bảng dữ liệu cao (${tableCount} bảng)`);
    }
    if (numPages >= 25) {
      score += 10;
      reasons.push(`Tài liệu dài (${numPages} trang)`);
    }
    score = Math.min(100, score);
    const level = score >= 55 ? 'hard' : score >= 25 ? 'medium' : 'easy';
    return {
      level,
      score,
      reasons,
      recommendGeminiVision: lowTextPages > 0 || mathRegionCount >= 3 || score >= 55,
    };
  }

  // ============================================================================
  // ĐIỂM VÀO CHÍNH: parsePdfGeometryToAst(fileObj, { ensurePdfJs })
  // ============================================================================
  async function parsePdfGeometryToAst(fileObj, deps = {}) {
    const ast = getAst();
    const { ensurePdfJs } = deps;
    if (typeof ensurePdfJs !== 'function') throw new Error('Thiếu ensurePdfJs để đọc .pdf');
    const pdfjsLib = await ensurePdfJs();
    const bytesCopy = fileObj?.bytes?.slice ? fileObj.bytes.slice(0) : fileObj.bytes;
    const pdfDoc = await pdfjsLib.getDocument({ data: bytesCopy }).promise;
    const maxP = Math.min(pdfDoc.numPages || 1, 80);

    const pageDataList = [];
    const allFontSizes = [];
    const allLineGaps = [];
    const pageCache = new Map();

    for (let pno = 1; pno <= maxP; pno++) {
      const page = await pdfDoc.getPage(pno);
      const viewport = typeof page.getViewport === 'function'
        ? page.getViewport({ scale: 1.0 })
        : { width: 595.28, height: 841.89 };
      const tc = await page.getTextContent();
      const { rows, rawItems } = extractPageVisualRows(tc, pno, viewport.width || 595.28, viewport.height || 841.89);

      for (const it of rawItems) {
        if (!COMBINING_MARK_RE.test(it.s)) allFontSizes.push(it.fSz);
      }
      for (let i = 1; i < rows.length; i++) {
        const dy = rows[i - 1].y - rows[i].y;
        if (dy > 4 && dy < 40) allLineGaps.push(dy);
      }

      let ops = null;
      try {
        if (typeof page.getOperatorList === 'function') ops = await page.getOperatorList();
      } catch (_eOps) {}

      const vectorRes = ops ? extractVectorTablesFromOps(ops, pdfjsLib, rawItems, pno, ast) : { tables: [] };
      const embeddedImgs = ops ? await extractEmbeddedBitmapImages(page, pdfjsLib, ops, pno, ast) : [];

      pageDataList.push({
        pageNo: pno,
        page,
        pageWidth: viewport.width || 595.28,
        pageHeight: viewport.height || 841.89,
        rows,
        vectorTables: vectorRes.tables || [],
        embeddedImgs,
      });
    }

    const sortedSz = allFontSizes.slice().sort((a, b) => a - b);
    const medianFontSize = sortedSz.length ? sortedSz[Math.floor(sortedSz.length / 2)] : 11;
    const sortedGaps = allLineGaps.slice().sort((a, b) => a - b);
    const medianLineGap = sortedGaps.length ? sortedGaps[Math.floor(sortedGaps.length / 2)] : medianFontSize * 1.35;

    // Tầng 2: Lọc Header/Footer lặp & Boilerplate
    const strippedHeadersFooters = stripHeadersFootersAndBoilerplate(pageDataList);

    // Đánh dấu các dòng nằm trong bảng vector (Layer A) trước khi chạy Layer B
    const allStageTokens = [];
    let mathRegionCount = 0;
    let borderlessTableCount = 0;
    let vectorTableCount = 0;
    let lowTextPages = 0;

    for (const pd of pageDataList) {
      const charCount = pd.rows.reduce((sum, r) => sum + r.text.length, 0);
      if (charCount < 40 && pd.embeddedImgs.length >= 0) lowTextPages += 1;

      const vectorEvents = [];
      for (const vt of pd.vectorTables) {
        pd.rows.forEach((r) => {
          const cx = (r.xMin + r.xMax) / 2;
          if (r.y <= vt.yMax + 4 && r.y >= vt.yMin - 4 && cx >= vt.xMin - 8 && cx <= vt.xMax + 8) {
            r.consumed = true;
          }
        });
        vectorTableCount += 1;
        vectorEvents.push({
          kind: 'table',
          tableNode: vt.node,
          yTop: vt.yMax,
          pageNo: pd.pageNo,
        });
      }

      const layerBTokens = extractWhitespaceProjectionTables(pd.rows, 0, medianFontSize, medianLineGap, ast);
      for (const tok of layerBTokens) {
        if (tok.kind === 'table') borderlessTableCount += 1;
        if (tok.kind === 'math_region') mathRegionCount += 1;
      }

      // Chèn Vector Table đúng thứ tự Y từ trên xuống dưới
      const combined = [...layerBTokens, ...vectorEvents].sort((a, b) => {
        const ya = a.yTop ?? a.y ?? 0;
        const yb = b.yTop ?? b.y ?? 0;
        return yb - ya;
      });

      const splitMerged = mergeAndEmitPageProse(combined, medianFontSize, medianLineGap, ast);

      // Cắt ảnh 3x DPI cho math_region hoặc fallback mathBlock
      for (const tok of splitMerged) {
        tok.pageRef = pd.page;
        allStageTokens.push(tok);
      }

      for (const imgBlk of pd.embeddedImgs) {
        allStageTokens.push({ kind: 'embedded_image', imageNode: imgBlk, pageNo: pd.pageNo });
      }
    }

    // Chuyển đổi tokens -> AST nodes sơ bộ
    const preliminaryNodes = [];
    let pendingList = null;
    let prevEndedWithColon = false;
    const flushList = () => {
      if (pendingList && pendingList.items.length) {
        preliminaryNodes.push(ast.nodes.list({ ordered: pendingList.ordered, items: pendingList.items, pageNo: pendingList.pageNo }));
      }
      pendingList = null;
    };

    for (const tok of allStageTokens) {
      if (tok.kind === 'table') {
        flushList();
        preliminaryNodes.push(tok.tableNode);
        prevEndedWithColon = false;
        continue;
      }
      if (tok.kind === 'embedded_image') {
        flushList();
        preliminaryNodes.push(tok.imageNode);
        prevEndedWithColon = false;
        continue;
      }
      if (tok.kind === 'math_region') {
        flushList();
        const cropped = await cropMathRegionToTransparentPng(tok.pageRef, tok, pageCache);
        if (cropped?.dataUrl) {
          preliminaryNodes.push(ast.nodes.mathImageBlock({
            dataUrl: cropped.dataUrl,
            width: cropped.width,
            height: cropped.height,
            altText: tok.fallbackText,
            pageNo: tok.pageNo,
          }));
        } else {
          preliminaryNodes.push(ast.nodes.mathBlock({
            latex: tok.fallbackText,
            displayText: tok.fallbackText,
            source: 'pdf-math-guard',
            pageNo: tok.pageNo,
          }));
        }
        prevEndedWithColon = false;
        continue;
      }

      const txt = tok.text;
      if (!txt) continue;

      // List bullet / numbered item sau dấu ':'
      const mBullet = txt.match(/^[-•*▪◦+]\s+(.+)$/);
      const mNumAfterColon = prevEndedWithColon && txt.match(/^(\d{1,2}[).])\s+(.+)$/);
      if (mBullet || mNumAfterColon) {
        const isOrd = Boolean(mNumAfterColon);
        if (pendingList && pendingList.ordered !== isOrd) flushList();
        if (!pendingList) pendingList = { ordered: isOrd, items: [], pageNo: tok.pageNo };
        pendingList.items.push({
          text: isOrd ? mNumAfterColon[2] : mBullet[1],
          marker: isOrd ? mNumAfterColon[1] : '•',
          level: 0,
        });
        prevEndedWithColon = false;
        continue;
      }

      flushList();

      const tagM = txt.match(ast.ACADEMIC_TAG_CALLOUT_RE);
      if (tagM) {
        const label = tagM[1] || tagM[2] || 'Lưu ý';
        const v = /quan\s+sát/i.test(label) ? 'observation' : /suy\s+luận/i.test(label) ? 'inference' : /đề\s+xuất/i.test(label) ? 'proposal' : /kết\s+luận/i.test(label) ? 'conclusion' : /bình\s+dân/i.test(label) ? 'plain' : 'pro';
        preliminaryNodes.push(ast.nodes.callout({
          variant: v,
          title: label.replace(/^\[|\]$/g, ''),
          text: tagM[3] || txt,
          pageNo: tok.pageNo,
        }));
        prevEndedWithColon = /:\s*$/.test(txt);
        continue;
      }

      const cls = ast.classifyHeadingCandidate(
        txt,
        { fontSize: tok.fontSize, isBold: tok.isBold, isItalic: tok.isItalic },
        { bodyFontSize: medianFontSize, prevEndedWithColon }
      );
      if (cls.isHeading) {
        preliminaryNodes.push(ast.nodes.heading({
          level: cls.level,
          text: cls.cleanText,
          numberPrefix: cls.numberPrefix,
          source: 'pdf-geometry',
          includeInToc: cls.includeInToc,
          pageNo: tok.pageNo,
        }));
      } else {
        preliminaryNodes.push(ast.nodes.paragraph({ text: txt, pageNo: tok.pageNo }));
      }
      prevEndedWithColon = /:\s*$/.test(txt);
    }
    flushList();

    // Tầng 4B: Nối bảng vắt trang + Gắn Caption & Nguồn thật
    const linkedNodes = mergeCrossPageTablesAndBindCaptions(preliminaryNodes, ast);

    const complexity = evaluatePdfComplexity({
      numPages: maxP,
      lowTextPages,
      mathRegionCount,
      tableCount: vectorTableCount + borderlessTableCount,
      borderlessTableCount,
    });

    return ast.createDocumentAst({
      title: String(fileObj?.name || 'TaiLieuPDF').replace(/\.[^.]+$/, ''),
      sourceFormat: 'pdf',
      blocks: linkedNodes,
      meta: {
        complexity,
        strippedHeadersFooters,
        medianFontSize,
        medianLineGap,
        numPages: maxP,
      },
    });
  }

  const exported = Object.freeze({
    joinPdfItemsByGeometry,
    extractVectorTablesFromOps,
    mergeTableContinuationRows,
    isMathRegionNotTable,
    evaluatePdfComplexity,
    parsePdfGeometryToAst,
  });

  NS.pdfGeometryEngine = exported;
  global.NoirPdfGeometryEngine = exported;
})(typeof window !== 'undefined' ? window : globalThis);
