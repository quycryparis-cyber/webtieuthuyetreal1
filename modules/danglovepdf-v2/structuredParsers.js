/**
 * ============================================================================
 * 📐 ĐĂNGLOVEPDF 2.0 — STRUCTURED INPUT PARSERS (Chương 3)
 * ============================================================================
 * 1. DOCX Native XML Parser: styles.xml + numbering.xml + merged tables
 *    (gridSpan/vMerge) + multi-paragraph cells + OMML (m:oMath) -> LaTeX + media
 * 2. XLSX Native Parser: formatted (.w) values + !merges + outer trim + banner
 *    lift + header detect + numeric right-align + >8 col Landscape warning
 * 3. Markdown + LaTeX + Currency-Safe Parser: Strict $28.40/$70tr Currency Guard,
 *    inline/display LaTeX, ragged/GFM tables + **Bảng X:** caption + *Nguồn:*
 * ============================================================================
 */
(function initNoirDangLovePdfStructuredParsers(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  function getAst() {
    const ast = global.NoirDocAst || NS.docAst;
    if (!ast) throw new Error('Thiếu modules/danglovepdf-v2/documentAst.js');
    return ast;
  }

  // ============================================================================
  // 0. UNIVERSAL XML PARSER (DOMParser trên Browser + Fallback chuẩn cho Node)
  // ============================================================================
  function decodeXmlEntities(str) {
    return String(str || '').replace(/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, (_m, ent) => {
      if (ent === 'amp') return '&';
      if (ent === 'lt') return '<';
      if (ent === 'gt') return '>';
      if (ent === 'quot') return '"';
      if (ent === 'apos') return "'";
      if (ent.startsWith('#x') || ent.startsWith('#X')) {
        const cp = parseInt(ent.slice(2), 16);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : '';
      }
      if (ent.startsWith('#')) {
        const cp = parseInt(ent.slice(1), 10);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : '';
      }
      return '';
    });
  }

  function parseXmlFallback(xmlStr) {
    const src = String(xmlStr || '').replace(/^\uFEFF/, '');
    const createNode = (nodeName, attrs = {}) => ({
      nodeType: 1,
      nodeName,
      localName: nodeName.includes(':') ? nodeName.split(':')[1] : nodeName,
      attributesMap: attrs,
      childNodes: [],
      getAttribute(key) {
        if (Object.prototype.hasOwnProperty.call(this.attributesMap, key)) return this.attributesMap[key];
        const shortKey = key.includes(':') ? key.split(':')[1] : key;
        for (const [k, v] of Object.entries(this.attributesMap)) {
          if (k === key || k.split(':').pop() === shortKey) return v;
        }
        return null;
      },
      getAttributeNS(_ns, local) {
        return this.getAttribute(local);
      },
      getElementsByTagName(name) {
        const out = [];
        const target = String(name || '').toLowerCase();
        const walk = (node) => {
          for (const ch of node.childNodes || []) {
            if (ch.nodeType === 1) {
              if (target === '*' || ch.nodeName.toLowerCase() === target || ch.localName.toLowerCase() === target) {
                out.push(ch);
              }
              walk(ch);
            }
          }
        };
        walk(this);
        return out;
      },
      get textContent() {
        return (this.childNodes || [])
          .map((ch) => (ch.nodeType === 3 ? ch.textContent : ch.textContent))
          .join('');
      },
    });

    const root = createNode('#document', {});
    const stack = [root];
    const tokenRe = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([A-Za-z_][\w:.-]*)([^>]*?)(\/?)>|([^<]+)/g;
    let m;
    while ((m = tokenRe.exec(src)) !== null) {
      const parent = stack[stack.length - 1];
      if (m[1] !== undefined) {
        parent.childNodes.push({ nodeType: 3, textContent: m[1] });
      } else if (m[3]) {
        const isClosing = m[2] === '/';
        const tagName = m[3];
        const attrRaw = m[4] || '';
        const selfClose = m[5] === '/';
        if (isClosing) {
          for (let si = stack.length - 1; si >= 1; si--) {
            if (stack[si].nodeName === tagName) {
              stack.length = si;
              break;
            }
          }
        } else {
          const attrs = {};
          const attrRe = /([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
          let am;
          while ((am = attrRe.exec(attrRaw)) !== null) {
            attrs[am[1]] = decodeXmlEntities(am[2] !== undefined ? am[2] : am[3]);
          }
          const el = createNode(tagName, attrs);
          parent.childNodes.push(el);
          if (!selfClose) stack.push(el);
        }
      } else if (m[6]) {
        parent.childNodes.push({ nodeType: 3, textContent: decodeXmlEntities(m[6]) });
      }
    }
    return root;
  }

  function parseXmlDoc(xmlStr) {
    if (!xmlStr) return null;
    if (typeof DOMParser !== 'undefined') {
      try {
        const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
        if (doc && !doc.getElementsByTagName('parsererror')?.length) return doc;
      } catch (_e) {}
    }
    return parseXmlFallback(xmlStr);
  }

  function lnOf(node) {
    const raw = String(node?.localName || node?.nodeName || '').toLowerCase();
    const idx = raw.indexOf(':');
    return idx >= 0 ? raw.slice(idx + 1) : raw;
  }

  function attrOf(node, name) {
    if (!node || typeof node.getAttribute !== 'function') return '';
    return (
      node.getAttribute(name) ??
      node.getAttribute(`w:${name}`) ??
      node.getAttribute(`m:${name}`) ??
      node.getAttribute(`r:${name}`) ??
      ''
    );
  }

  function directChildren(el, localName) {
    const list = Array.from(el?.childNodes || []);
    if (!localName) return list.filter((c) => c.nodeType === 1 || c.localName || c.nodeName);
    return list.filter((c) => lnOf(c) === localName);
  }

  function firstChild(el, localName) {
    return directChildren(el, localName)[0] || null;
  }

  // ============================================================================
  // 1. OMML (WORD OFFICE MATH XML) -> LATEX CONVERTER
  // ============================================================================
  const OMML_CHAR_LATEX = {
    '∑': '\\sum',
    '∫': '\\int',
    '∏': '\\prod',
    '×': '\\times ',
    '÷': '\\div ',
    '·': '\\cdot ',
    '±': '\\pm ',
    '≈': '\\approx ',
    '≠': '\\neq ',
    '≤': '\\leq ',
    '≥': '\\geq ',
    '∞': '\\infty ',
    '→': '\\to ',
    '⇒': '\\Rightarrow ',
    'α': '\\alpha ',
    'β': '\\beta ',
    'γ': '\\gamma ',
    'δ': '\\delta ',
    'Δ': '\\Delta ',
    'σ': '\\sigma ',
    'Σ': '\\Sigma ',
    'μ': '\\mu ',
    'λ': '\\lambda ',
    'π': '\\pi ',
    'θ': '\\theta ',
    'ρ': '\\rho ',
  };

  function mapOmmlText(txt) {
    let out = '';
    for (const ch of String(txt || '')) {
      out += OMML_CHAR_LATEX[ch] || ch;
    }
    return out;
  }

  function ommlNodeToLatex(node) {
    if (!node) return '';
    const nm = lnOf(node);
    if (nm === '#text') return mapOmmlText(node.textContent || '');

    if (nm === 'omathpara') {
      return directChildren(node, 'omath').map(ommlNodeToLatex).filter(Boolean).join(' \\\\ ');
    }
    if (nm === 'omath') {
      return Array.from(node.childNodes || []).map(ommlNodeToLatex).join('').trim();
    }
    if (nm === 'r') {
      const texts = directChildren(node, 't').map((t) => t.textContent || '').join('');
      return mapOmmlText(texts);
    }
    if (nm === 't') {
      return mapOmmlText(node.textContent || '');
    }
    if (nm === 'e' || nm === 'num' || nm === 'den' || nm === 'sub' || nm === 'sup' || nm === 'deg' || nm === 'fname') {
      return Array.from(node.childNodes || []).map(ommlNodeToLatex).join('').trim();
    }
    if (nm === 'f') {
      const num = ommlNodeToLatex(firstChild(node, 'num'));
      const den = ommlNodeToLatex(firstChild(node, 'den'));
      return `\\frac{${num}}{${den}}`;
    }
    if (nm === 'ssup') {
      const e = ommlNodeToLatex(firstChild(node, 'e'));
      const sup = ommlNodeToLatex(firstChild(node, 'sup'));
      return `${e}^{${sup}}`;
    }
    if (nm === 'ssub') {
      const e = ommlNodeToLatex(firstChild(node, 'e'));
      const sub = ommlNodeToLatex(firstChild(node, 'sub'));
      return `${e}_{${sub}}`;
    }
    if (nm === 'ssubsup') {
      const e = ommlNodeToLatex(firstChild(node, 'e'));
      const sub = ommlNodeToLatex(firstChild(node, 'sub'));
      const sup = ommlNodeToLatex(firstChild(node, 'sup'));
      return `${e}_{${sub}}^{${sup}}`;
    }
    if (nm === 'rad') {
      const deg = ommlNodeToLatex(firstChild(node, 'deg'));
      const e = ommlNodeToLatex(firstChild(node, 'e'));
      return deg ? `\\sqrt[${deg}]{${e}}` : `\\sqrt{${e}}`;
    }
    if (nm === 'nary') {
      const naryPr = firstChild(node, 'narypr');
      const chrNode = naryPr ? firstChild(naryPr, 'chr') : null;
      const chrVal = attrOf(chrNode, 'val') || '∑';
      const op = OMML_CHAR_LATEX[chrVal] || '\\sum';
      const sub = ommlNodeToLatex(firstChild(node, 'sub'));
      const sup = ommlNodeToLatex(firstChild(node, 'sup'));
      const e = ommlNodeToLatex(firstChild(node, 'e'));
      return `${op.trim()}${sub ? `_{${sub}}` : ''}${sup ? `^{${sup}}` : ''} ${e}`.trim();
    }
    if (nm === 'd') {
      const dPr = firstChild(node, 'dpr');
      const beg = attrOf(dPr ? firstChild(dPr, 'begchr') : null, 'val') || '(';
      const end = attrOf(dPr ? firstChild(dPr, 'endchr') : null, 'val') || ')';
      const sep = attrOf(dPr ? firstChild(dPr, 'sepchr') : null, 'val') || ', ';
      const inner = directChildren(node, 'e').map(ommlNodeToLatex).join(sep);
      return `\\left${beg}${inner}\\right${end}`;
    }
    if (nm === 'acc' || nm === 'bar') {
      const e = ommlNodeToLatex(firstChild(node, 'e'));
      if (nm === 'bar') return `\\overline{${e}}`;
      const accPr = firstChild(node, 'accpr');
      const ch = attrOf(accPr ? firstChild(accPr, 'chr') : null, 'val') || '^';
      if (ch === '\u2192') return `\\vec{${e}}`;
      if (ch === '\u00af' || ch === '_') return `\\bar{${e}}`;
      return `\\hat{${e}}`;
    }
    if (nm === 'func') {
      const fn = ommlNodeToLatex(firstChild(node, 'fname'));
      const e = ommlNodeToLatex(firstChild(node, 'e'));
      return `${fn}\\left(${e}\\right)`;
    }
    if (nm === 'm') {
      const rows = directChildren(node, 'mr').map((mr) => directChildren(mr, 'e').map(ommlNodeToLatex).join(' & '));
      return `\\begin{pmatrix} ${rows.join(' \\\\ ')} \\end{pmatrix}`;
    }
    if (nm.endsWith('pr')) return '';
    return Array.from(node.childNodes || []).map(ommlNodeToLatex).join('');
  }

  // ============================================================================
  // 2. DOCX NATIVE XML PARSER (styles + numbering + merged tables + OMML + media)
  // ============================================================================
  function formatNumCounter(num, numFmt) {
    const n = Math.max(1, Number(num) || 1);
    const fmt = String(numFmt || 'decimal').toLowerCase();
    if (fmt === 'bullet') return '•';
    if (fmt === 'upperroman' || fmt === 'lowerroman') {
      const tbl = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
      let rem = n;
      let res = '';
      for (const [v, sym] of tbl) { while (rem >= v) { res += sym; rem -= v; } }
      return fmt === 'lowerroman' ? res.toLowerCase() : res;
    }
    if (fmt === 'upperletter') return String.fromCharCode(65 + ((n - 1) % 26));
    if (fmt === 'lowerletter') return String.fromCharCode(97 + ((n - 1) % 26));
    return String(n);
  }

  function guessImageMime(pathStr) {
    const e = String(pathStr || '').split('.').pop().toLowerCase();
    if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
    if (e === 'webp') return 'image/webp';
    if (e === 'gif') return 'image/gif';
    if (e === 'svg') return 'image/svg+xml';
    return 'image/png';
  }

  async function parseDocxNativeToAst(fileObj, deps = {}) {
    const ast = getAst();
    const { ensureJsZip } = deps;
    if (typeof ensureJsZip !== 'function') throw new Error('Thiếu ensureJsZip để đọc .docx');
    const JSZip = await ensureJsZip();
    const zip = await JSZip.loadAsync(fileObj.bytes);

    // A. Rels
    const relsMap = new Map();
    const relsStr = await zip.file('word/_rels/document.xml.rels')?.async('string');
    if (relsStr) {
      const relDoc = parseXmlDoc(relsStr);
      Array.from(relDoc.getElementsByTagName('*'))
        .filter((n) => lnOf(n) === 'relationship')
        .forEach((rel) => {
          const id = attrOf(rel, 'Id');
          const tgt = attrOf(rel, 'Target');
          if (id && tgt) {
            const norm = tgt.replace(/^\/+/, '').replace(/^word\//i, '');
            relsMap.set(id, `word/${norm}`);
          }
        });
    }

    // B. Styles (styles.xml) + resolve basedOn
    const stylesMap = new Map();
    const stylesStr = await zip.file('word/styles.xml')?.async('string');
    if (stylesStr) {
      const sDoc = parseXmlDoc(stylesStr);
      Array.from(sDoc.getElementsByTagName('*'))
        .filter((n) => lnOf(n) === 'style' && attrOf(n, 'type') === 'paragraph')
        .forEach((st) => {
          const styleId = attrOf(st, 'styleId');
          if (!styleId) return;
          const nameNode = firstChild(st, 'name');
          const basedNode = firstChild(st, 'basedon');
          const pPr = firstChild(st, 'ppr');
          const rPr = firstChild(st, 'rpr');
          const outNode = pPr ? firstChild(pPr, 'outlinelvl') : null;
          const numPr = pPr ? firstChild(pPr, 'numpr') : null;
          const numIdNode = numPr ? firstChild(numPr, 'numid') : null;
          const ilvlNode = numPr ? firstChild(numPr, 'ilvl') : null;
          const szNode = rPr ? firstChild(rPr, 'sz') : null;
          const bNode = rPr ? firstChild(rPr, 'b') : null;

          const nameVal = attrOf(nameNode, 'val') || styleId;
          const outLvlRaw = outNode ? parseInt(attrOf(outNode, 'val'), 10) : NaN;
          const hMatch = `${styleId} ${nameVal}`.match(/(?:heading|tiêu đề|tieude)\s*([1-6])/i);
          const isTitle = /^(?:title)$/i.test(styleId) || /^(?:title)$/i.test(nameVal);
          const isSubtitle = /^(?:subtitle)$/i.test(styleId) || /^(?:subtitle)$/i.test(nameVal);
          const headingLevel = hMatch
            ? parseInt(hMatch[1], 10)
            : (isTitle ? 1 : isSubtitle ? 2 : (Number.isFinite(outLvlRaw) ? outLvlRaw + 1 : 0));

          stylesMap.set(styleId, {
            styleId,
            name: nameVal,
            basedOn: attrOf(basedNode, 'val') || '',
            outlineLvl: Number.isFinite(outLvlRaw) ? outLvlRaw : null,
            headingLevel,
            isHeading: headingLevel >= 1 && headingLevel <= 6,
            numId: numIdNode ? attrOf(numIdNode, 'val') : '',
            ilvl: ilvlNode ? parseInt(attrOf(ilvlNode, 'val'), 10) : 0,
            isBold: Boolean(bNode && attrOf(bNode, 'val') !== '0' && attrOf(bNode, 'val') !== 'false'),
            fontSize: szNode ? parseInt(attrOf(szNode, 'val'), 10) / 2 : 0,
          });
        });

      // Kế thừa thuộc tính basedOn tối đa 4 vòng
      for (const [, st] of stylesMap) {
        let curId = st.basedOn;
        for (let depth = 0; depth < 4 && curId && stylesMap.has(curId); depth++) {
          const parent = stylesMap.get(curId);
          if (!st.isHeading && parent.isHeading) {
            st.isHeading = true;
            st.headingLevel = parent.headingLevel;
          }
          if (!st.numId && parent.numId) { st.numId = parent.numId; st.ilvl = parent.ilvl; }
          if (!st.fontSize && parent.fontSize) st.fontSize = parent.fontSize;
          if (!st.isBold && parent.isBold) st.isBold = true;
          curId = parent.basedOn;
        }
      }
    }

    // C. Numbering (numbering.xml)
    const abstractMap = new Map();
    const numToAbstract = new Map();
    const numberingStr = await zip.file('word/numbering.xml')?.async('string');
    if (numberingStr) {
      const nDoc = parseXmlDoc(numberingStr);
      Array.from(nDoc.getElementsByTagName('*'))
        .filter((n) => lnOf(n) === 'abstractnum')
        .forEach((ab) => {
          const absId = attrOf(ab, 'abstractNumId');
          const lvls = {};
          directChildren(ab, 'lvl').forEach((lv) => {
            const ilvl = parseInt(attrOf(lv, 'ilvl') || '0', 10);
            const startN = firstChild(lv, 'start');
            const fmtN = firstChild(lv, 'numfmt');
            const txtN = firstChild(lv, 'lvltext');
            lvls[ilvl] = {
              start: startN ? parseInt(attrOf(startN, 'val') || '1', 10) : 1,
              numFmt: fmtN ? attrOf(fmtN, 'val') : 'decimal',
              lvlText: txtN ? attrOf(txtN, 'val') : `%${ilvl + 1}.`,
            };
          });
          abstractMap.set(absId, lvls);
        });
      Array.from(nDoc.getElementsByTagName('*'))
        .filter((n) => lnOf(n) === 'num')
        .forEach((nm) => {
          const numId = attrOf(nm, 'numId');
          const abRef = firstChild(nm, 'abstractnumid');
          if (numId && abRef) numToAbstract.set(numId, attrOf(abRef, 'val'));
        });
    }

    const countersByNum = new Map();
    const nextNumberingPrefix = (numId, ilvl = 0) => {
      if (!numId || !numToAbstract.has(numId)) return { prefix: '', isBullet: false };
      const absId = numToAbstract.get(numId);
      const lvls = abstractMap.get(absId) || {};
      const lvlCfg = lvls[ilvl] || { start: 1, numFmt: 'decimal', lvlText: `%${ilvl + 1}.` };
      if (String(lvlCfg.numFmt).toLowerCase() === 'bullet') return { prefix: '•', isBullet: true };

      const key = `${absId}:${numId}`;
      const state = countersByNum.get(key) || {};
      for (let d = 0; d < ilvl; d++) {
        if (state[d] === undefined) state[d] = lvls[d]?.start ?? 1;
      }
      state[ilvl] = state[ilvl] === undefined ? (lvlCfg.start ?? 1) : state[ilvl] + 1;
      for (const k of Object.keys(state)) {
        if (Number(k) > ilvl) delete state[k];
      }
      countersByNum.set(key, state);

      let out = String(lvlCfg.lvlText || `%${ilvl + 1}.`);
      out = out.replace(/%([1-9])/g, (_m, posStr) => {
        const idx = parseInt(posStr, 10) - 1;
        const val = state[idx] !== undefined ? state[idx] : (lvls[idx]?.start ?? 1);
        return formatNumCounter(val, lvls[idx]?.numFmt || 'decimal');
      });
      return { prefix: out.trim(), isBullet: false };
    };

    // D. Document body (word/document.xml)
    const xmlStr = await zip.file('word/document.xml')?.async('string');
    if (!xmlStr) throw new Error('File DOCX không chứa word/document.xml');
    const xmlDoc = parseXmlDoc(xmlStr);
    const body =
      Array.from(xmlDoc.getElementsByTagName('*')).find((n) => lnOf(n) === 'body') || xmlDoc;

    const rawNodes = [];
    const mediaCache = new Map();
    const readMediaDataUrl = async (rId) => {
      const mediaPath = relsMap.get(rId);
      if (!mediaPath || !zip.file(mediaPath)) return '';
      if (mediaCache.has(mediaPath)) return mediaCache.get(mediaPath);
      const b64 = await zip.file(mediaPath).async('base64');
      const durl = `data:${guessImageMime(mediaPath)};base64,${b64}`;
      mediaCache.set(mediaPath, durl);
      return durl;
    };

    const parseParagraphRuns = (pEl) => {
      const runs = [];
      let plainParts = [];
      let ommlBlocks = [];
      let hasBoldRun = false;
      let hasItalicRun = false;
      let explicitFontSize = 0;

      const walkInline = (node, ctxFormat = {}) => {
        const nm = lnOf(node);
        if (nm === 'omathpara' || nm === 'omath') {
          const ltx = ommlNodeToLatex(node);
          if (ltx) {
            if (nm === 'omathpara') ommlBlocks.push(ltx);
            runs.push(ast.makeInlineRun(ltx, { math: true }));
            plainParts.push(` $${ltx}$ `);
          }
          return;
        }
        if (nm === 't' || nm === 'deltext') {
          const txt = node.textContent || '';
          if (txt) {
            runs.push(ast.makeInlineRun(txt, { bold: ctxFormat.bold, italic: ctxFormat.italic }));
            plainParts.push(txt);
          }
          return;
        }
        if (nm === 'tab') { plainParts.push('\t'); return; }
        if (nm === 'br' || nm === 'cr') {
          if (attrOf(node, 'type') === 'page') ctxFormat.hasPageBreak = true;
          plainParts.push('\n');
          return;
        }
        if (nm === 'r') {
          const rPr = firstChild(node, 'rpr');
          const bN = rPr ? firstChild(rPr, 'b') : null;
          const iN = rPr ? firstChild(rPr, 'i') : null;
          const szN = rPr ? firstChild(rPr, 'sz') : null;
          const rBold = bN ? attrOf(bN, 'val') !== '0' && attrOf(bN, 'val') !== 'false' : Boolean(ctxFormat.bold);
          const rItal = iN ? attrOf(iN, 'val') !== '0' && attrOf(iN, 'val') !== 'false' : Boolean(ctxFormat.italic);
          if (rBold) hasBoldRun = true;
          if (rItal) hasItalicRun = true;
          if (szN) {
            const pt = parseInt(attrOf(szN, 'val'), 10) / 2;
            if (pt > explicitFontSize) explicitFontSize = pt;
          }
          for (const ch of Array.from(node.childNodes || [])) walkInline(ch, { bold: rBold, italic: rItal });
          return;
        }
        for (const ch of Array.from(node.childNodes || [])) walkInline(ch, ctxFormat);
      };

      walkInline(pEl, {});
      return {
        runs,
        rawText: plainParts.join(''),
        text: ast.normText(plainParts.join('').replace(/\n+/g, ' ')),
        multilineText: plainParts.join('').replace(/[ \t]+/g, ' ').replace(/\n+/g, '\n').trim(),
        ommlBlocks,
        hasBoldRun,
        hasItalicRun,
        explicitFontSize,
        hasPageBreak: Array.from(pEl.getElementsByTagName('*')).some((n) => lnOf(n) === 'br' && attrOf(n, 'type') === 'page'),
      };
    };

    const parseTableElement = (tblEl) => {
      const trs = directChildren(tblEl, 'tr');
      const gridRows = [];
      const headerRowFlags = [];
      let activeVmergeTop = []; // per visual grid col -> { rowIdx, cellIdx }

      trs.forEach((tr, rowIdx) => {
        const trPr = firstChild(tr, 'trpr');
        const isTblHeader = Boolean(trPr && firstChild(trPr, 'tblheader'));
        headerRowFlags.push(isTblHeader);

        const rowCells = [];
        let colCursor = 0;
        const tcs = directChildren(tr, 'tc');

        for (const tc of tcs) {
          const tcPr = firstChild(tc, 'tcpr');
          const gsNode = tcPr ? firstChild(tcPr, 'gridspan') : null;
          const colSpan = Math.max(1, parseInt(attrOf(gsNode, 'val') || '1', 10) || 1);
          const vmNode = tcPr ? firstChild(tcPr, 'vmerge') : null;
          const vmVal = vmNode ? (attrOf(vmNode, 'val') || 'continue').toLowerCase() : '';

          // Giữ nguyên nhiều đoạn <w:p> trong cùng 1 ô <w:tc>, KHÔNG tách thành dòng mới!
          const ps = directChildren(tc, 'p');
          const pTexts = ps.length
            ? ps.map((p) => parseParagraphRuns(p).text).filter(Boolean)
            : [ast.normText(tc.textContent || '')].filter(Boolean);
          const cellFullText = pTexts.join('\n');

          if (vmNode && vmVal !== 'restart') {
            const topAnchor = activeVmergeTop[colCursor];
            if (topAnchor && gridRows[topAnchor.rowIdx]?.[topAnchor.cellIdx]) {
              const anchorCell = gridRows[topAnchor.rowIdx][topAnchor.cellIdx];
              anchorCell.rowSpan += 1;
              if (cellFullText) {
                anchorCell.paragraphs.push(...pTexts);
                anchorCell.text = ast.normText(anchorCell.paragraphs.join(' '));
              }
            }
            for (let k = 0; k < colSpan; k++) {
              rowCells.push(ast.makeTableCell('', { spannedCovered: true, isHeader: isTblHeader }));
            }
          } else {
            const jcNode = tcPr ? firstChild(tcPr, 'jc') : null;
            const alignVal = attrOf(jcNode, 'val') || 'auto';
            const mappedAlign = alignVal === 'right' ? 'right' : alignVal === 'center' ? 'center' : alignVal === 'left' ? 'left' : 'auto';
            const cellObj = ast.makeTableCell(cellFullText, {
              colSpan,
              rowSpan: 1,
              align: mappedAlign,
              isHeader: isTblHeader,
            });
            cellObj.paragraphs = pTexts;
            const pushedIdx = rowCells.length;
            rowCells.push(cellObj);
            for (let k = 1; k < colSpan; k++) {
              rowCells.push(ast.makeTableCell('', { spannedCovered: true, isHeader: isTblHeader }));
            }
            if (vmNode && vmVal === 'restart') {
              for (let k = 0; k < colSpan; k++) activeVmergeTop[colCursor + k] = { rowIdx, cellIdx: pushedIdx };
            } else {
              for (let k = 0; k < colSpan; k++) activeVmergeTop[colCursor + k] = null;
            }
          }
          colCursor += colSpan;
        }
        gridRows.push(rowCells);
      });

      const nonEmptyRows = gridRows.filter((r) => r.some((c) => c.text !== '' || c.spannedCovered));
      if (!nonEmptyRows.length) return null;

      let hdrCount = 0;
      for (let i = 0; i < headerRowFlags.length; i++) {
        if (headerRowFlags[i]) hdrCount += 1;
        else break;
      }
      if (hdrCount === 0 && nonEmptyRows.length >= 2) hdrCount = 1;

      const headerRows = nonEmptyRows.slice(0, hdrCount);
      const bodyRows = nonEmptyRows.slice(hdrCount);
      return ast.nodes.table({ headerRows, bodyRows });
    };

    const bodyFontCounts = new Map();
    let prevEndedWithColon = false;
    let pendingListItems = null;
    const flushList = () => {
      if (pendingListItems && pendingListItems.items.length) {
        rawNodes.push(ast.nodes.list({ ordered: pendingListItems.ordered, items: pendingListItems.items }));
      }
      pendingListItems = null;
    };

    const walkBody = async (container) => {
      for (const child of Array.from(container.childNodes || [])) {
        const ln = lnOf(child);
        if (ln === 'tbl') {
          flushList();
          const tblNode = parseTableElement(child);
          if (tblNode) rawNodes.push(tblNode);
          prevEndedWithColon = false;
          continue;
        }
        if (ln === 'sdt' || ln === 'sdtcontent' || ln === 'customxml' || ln === 'txbxcontent') {
          await walkBody(child);
          continue;
        }
        if (ln !== 'p') continue;

        const allNodes = Array.from(child.getElementsByTagName('*'));
        for (const bl of allNodes.filter((n) => lnOf(n) === 'blip' || lnOf(n) === 'imagedata')) {
          const rId = attrOf(bl, 'embed') || attrOf(bl, 'id');
          if (rId) {
            const durl = await readMediaDataUrl(rId);
            if (durl) {
              flushList();
              rawNodes.push(ast.nodes.imageBlock({ dataUrl: durl }));
            }
          }
        }
        for (const nt of allNodes.filter((n) => lnOf(n) === 'tbl')) {
          flushList();
          const tblNode = parseTableElement(nt);
          if (tblNode) rawNodes.push(tblNode);
        }

        const pInfo = parseParagraphRuns(child);
        if (pInfo.hasPageBreak && !pInfo.text) {
          flushList();
          rawNodes.push(ast.nodes.pageBreak());
          prevEndedWithColon = false;
          continue;
        }

        // Đoạn chỉ chứa công thức OMML display -> mathBlock
        const nonMathText = pInfo.runs.filter((r) => !r.math).map((r) => r.text).join('').trim();
        const mathOnlyText = pInfo.runs.filter((r) => r.math).map((r) => r.text).join(' ').trim();
        if (pInfo.ommlBlocks.length || (mathOnlyText && !nonMathText)) {
          flushList();
          rawNodes.push(ast.nodes.mathBlock({ latex: pInfo.ommlBlocks[0] || mathOnlyText, source: 'omml' }));
          prevEndedWithColon = false;
          continue;
        }

        if (!pInfo.text) continue;

        const pPr = firstChild(child, 'ppr');
        const pStyleId = attrOf(pPr ? firstChild(pPr, 'pstyle') : null, 'val');
        const stInfo = pStyleId ? stylesMap.get(pStyleId) : null;
        const pOutNode = pPr ? firstChild(pPr, 'outlinelvl') : null;
        const pOutLvl = pOutNode ? parseInt(attrOf(pOutNode, 'val'), 10) : NaN;
        const pNumPr = pPr ? firstChild(pPr, 'numpr') : null;
        const pNumId = attrOf(pNumPr ? firstChild(pNumPr, 'numid') : null, 'val') || stInfo?.numId || '';
        const pIlvl = pNumPr
          ? parseInt(attrOf(firstChild(pNumPr, 'ilvl'), 'val') || '0', 10)
          : Number(stInfo?.ilvl || 0);

        const explicitHeading = Boolean(stInfo?.isHeading || Number.isFinite(pOutLvl));
        const explicitLvl = stInfo?.isHeading
          ? stInfo.headingLevel
          : (Number.isFinite(pOutLvl) ? pOutLvl + 1 : 0);

        let effectiveText = pInfo.text;
        let autoPrefix = '';
        let numMeta = { prefix: '', isBullet: false };
        if (pNumId) {
          numMeta = nextNumberingPrefix(pNumId, pIlvl);
          if (numMeta.prefix && !numMeta.isBullet && !effectiveText.startsWith(numMeta.prefix)) {
            autoPrefix = numMeta.prefix;
            effectiveText = `${autoPrefix} ${effectiveText}`.trim();
          }
        }

        const fSize = pInfo.explicitFontSize || stInfo?.fontSize || 11;
        if (!explicitHeading) {
          bodyFontCounts.set(fSize, (bodyFontCounts.get(fSize) || 0) + effectiveText.length);
        }

        // Heading có style Word thật hoặc phân loại tiêu đề 4 cấp
        if (explicitHeading) {
          flushList();
          const cls = ast.classifyHeadingCandidate(effectiveText, {
            explicitHeadingStyle: true,
            explicitLevel: Math.min(4, Math.max(1, explicitLvl)),
            isBold: pInfo.hasBoldRun || stInfo?.isBold,
            fontSize: fSize,
          }, { prevEndedWithColon });
          if (cls.isHeading) {
            rawNodes.push(ast.nodes.heading({
              level: cls.level,
              text: cls.cleanText,
              numberPrefix: autoPrefix || cls.numberPrefix,
              source: 'docx-style',
              includeInToc: cls.includeInToc,
            }));
          } else {
            rawNodes.push(ast.nodes.paragraph({ text: effectiveText, inlineRuns: pInfo.runs }));
          }
          prevEndedWithColon = /:\s*$/.test(effectiveText);
          continue;
        }

        // List từ numbering.xml (không phải heading)
        if (pNumId && numMeta.prefix) {
          const isOrd = !numMeta.isBullet;
          if (pendingListItems && pendingListItems.ordered !== isOrd) flushList();
          if (!pendingListItems) pendingListItems = { ordered: isOrd, items: [] };
          pendingListItems.items.push({
            text: pInfo.text,
            inlineRuns: pInfo.runs,
            level: pIlvl,
            marker: autoPrefix || numMeta.prefix,
          });
          prevEndedWithColon = false;
          continue;
        }

        flushList();
        const tagM = effectiveText.match(ast.ACADEMIC_TAG_CALLOUT_RE);
        if (tagM) {
          const label = tagM[1] || tagM[2] || 'Ghi chú';
          const bodyTxt = tagM[3] || '';
          const v = /quan\s+sát/i.test(label) ? 'observation' : /suy\s+luận/i.test(label) ? 'inference' : /đề\s+xuất/i.test(label) ? 'proposal' : /kết\s+luận/i.test(label) ? 'conclusion' : /bình\s+dân/i.test(label) ? 'plain' : 'pro';
          rawNodes.push(ast.nodes.callout({ variant: v, title: label.replace(/^\[|\]$/g, ''), text: bodyTxt || effectiveText }));
          prevEndedWithColon = /:\s*$/.test(effectiveText);
          continue;
        }

        const cls = ast.classifyHeadingCandidate(effectiveText, {
          isBold: pInfo.hasBoldRun,
          isItalic: pInfo.hasItalicRun && !pInfo.hasBoldRun,
          fontSize: fSize,
        }, { prevEndedWithColon });

        if (cls.isHeading) {
          rawNodes.push(ast.nodes.heading({
            level: cls.level,
            text: cls.cleanText,
            numberPrefix: cls.numberPrefix,
            source: 'docx-heuristic',
            includeInToc: cls.includeInToc,
          }));
        } else {
          rawNodes.push(ast.nodes.paragraph({ text: effectiveText, inlineRuns: pInfo.runs }));
        }
        prevEndedWithColon = /:\s*$/.test(effectiveText);
      }
    };

    await walkBody(body);
    flushList();

    // Hậu xử lý: gắn caption Bảng / Hình và Nguồn: vào node Table / Image liền kề
    const linked = linkCaptionsAndSources(rawNodes, ast);
    return ast.createDocumentAst({
      title: String(fileObj?.name || 'TaiLieu').replace(/\.[^.]+$/, ''),
      sourceFormat: 'docx',
      blocks: linked,
    });
  }

  function linkCaptionsAndSources(nodes = [], ast) {
    const out = [];
    for (let i = 0; i < nodes.length; i++) {
      const cur = nodes[i];
      const prev = out[out.length - 1];
      const tblCapRe = /^(?:Bảng|Table)\s+\d+(?:\.\d+)*\s*[:.\-–—]?\s*/i;
      const figCapRe = /^(?:Hình|Biểu\s+đồ|Figure|Fig\.?)\s+\d+(?:\.\d+)*\s*[:.\-–—]?\s*/i;
      const srcNoteRe = /^(?:Nguồn|Source|Ghi\s+chú)\s*:\s*\S+/i;

      if (cur.type === 'table' && prev && prev.type === 'paragraph' && tblCapRe.test(prev.text) && prev.text.length <= 160) {
        out[out.length - 1] = ast.nodes.table({ ...cur, caption: prev.text });
        continue;
      }
      if (cur.type === 'paragraph' && prev && prev.type === 'table' && srcNoteRe.test(cur.text) && cur.text.length <= 220 && !prev.sourceNote) {
        prev.sourceNote = cur.text;
        continue;
      }
      if (cur.type === 'imageBlock' && prev && prev.type === 'paragraph' && figCapRe.test(prev.text) && prev.text.length <= 160) {
        out[out.length - 1] = ast.nodes.imageBlock({ ...cur, caption: prev.text });
        continue;
      }
      if (cur.type === 'paragraph' && prev && prev.type === 'imageBlock' && figCapRe.test(cur.text) && !prev.caption && cur.text.length <= 160) {
        prev.caption = cur.text;
        continue;
      }
      out.push(cur);
    }
    return out;
  }

  // ============================================================================
  // 3. XLSX NATIVE PARSER (Trim + Merge + Banner Lift + Right-Align + >8 Cols)
  // ============================================================================
  async function parseXlsxNativeToAst(fileObj, deps = {}) {
    const ast = getAst();
    const { ensureXlsx } = deps;
    if (typeof ensureXlsx !== 'function') throw new Error('Thiếu ensureXlsx để đọc .xlsx/.xls');
    const XLSX = await ensureXlsx();
    const wb = XLSX.read(fileObj.bytes, { type: 'array', cellStyles: true });
    const blocks = [];
    const warnings = [];
    let anyWide = false;

    const cleanCellStr = (cell) => {
      if (!cell) return '';
      const raw = cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== ''
        ? String(cell.w)
        : (cell.v !== undefined && cell.v !== null ? String(cell.v) : '');
      return ast.normText(raw);
    };

    wb.SheetNames.forEach((sheetName, sIdx) => {
      const ws = wb.Sheets[sheetName];
      if (!ws || !ws['!ref']) return;
      const range = XLSX.utils.decode_range(ws['!ref']);
      const totalR = range.e.r - range.s.r + 1;
      const totalC = range.e.c - range.s.c + 1;
      if (totalR <= 0 || totalC <= 0) return;

      const matrix = Array.from({ length: totalR }, () =>
        Array.from({ length: totalC }, () => ({ text: '', colSpan: 1, rowSpan: 1, spannedCovered: false }))
      );

      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          matrix[r - range.s.r][c - range.s.c].text = cleanCellStr(ws[addr]);
        }
      }

      for (const mg of ws['!merges'] || []) {
        const sr = mg.s.r - range.s.r;
        const sc = mg.s.c - range.s.c;
        const er = mg.e.r - range.s.r;
        const ec = mg.e.c - range.s.c;
        if (sr < 0 || sc < 0 || er >= totalR || ec >= totalC) continue;
        matrix[sr][sc].colSpan = ec - sc + 1;
        matrix[sr][sc].rowSpan = er - sr + 1;
        for (let rr = sr; rr <= er; rr++) {
          for (let cc = sc; cc <= ec; cc++) {
            if (rr === sr && cc === sc) continue;
            matrix[rr][cc].spannedCovered = true;
            matrix[rr][cc].text = '';
          }
        }
      }

      // Cắt bỏ hàng rỗng / cột rỗng ở viền ngoài
      let rMin = totalR, rMax = -1, cMin = totalC, cMax = -1;
      for (let r = 0; r < totalR; r++) {
        for (let c = 0; c < totalC; c++) {
          if (matrix[r][c].text) {
            if (r < rMin) rMin = r;
            if (r > rMax) rMax = r;
            if (c < cMin) cMin = c;
            if (c > cMax) cMax = c;
          }
        }
      }
      if (rMax < rMin || cMax < cMin) return;

      const trimmed = [];
      for (let r = rMin; r <= rMax; r++) {
        const rowSlice = matrix[r].slice(cMin, cMax + 1);
        if (rowSlice.some((cell) => cell.text !== '' || cell.spannedCovered)) trimmed.push(rowSlice);
      }
      if (!trimmed.length) return;

      const sheetCols = cMax - cMin + 1;
      // Nâng các dòng Banner toàn chiều rộng ở đầu sheet ra ngoài thành Heading / Caption bảng
      const bannerTexts = [];
      while (trimmed.length >= 2) {
        const topRow = trimmed[0];
        const nonEmpty = topRow.filter((c) => c.text !== '');
        const isFullBanner =
          nonEmpty.length === 1 &&
          (nonEmpty[0].colSpan >= Math.max(2, Math.floor(sheetCols * 0.6)) || sheetCols >= 2);
        if (!isFullBanner) break;
        bannerTexts.push(nonEmpty[0].text);
        trimmed.shift();
      }

      // Bỏ dòng trống còn sót giữa banner và bảng
      while (trimmed.length && trimmed[0].every((c) => !c.text)) trimmed.shift();
      if (!trimmed.length) return;

      const sheetHeadingText = bannerTexts[0] || `PHẦN ${sIdx + 1}: ${sheetName}`;
      blocks.push(ast.nodes.heading({ level: 1, text: sheetHeadingText, source: 'xlsx' }));

      // Nhận diện hàng header (hàng đầu có >= 50% ô chữ, hoặc mặc định dòng 0)
      const isTextHeaderRow = (row) => {
        const filled = row.filter((c) => c.text !== '');
        if (!filled.length) return false;
        const textCells = filled.filter((c) => !/^[\s($₫€£¥+\-–—]*[\d.,%]+[\s)kKmMbBtrỷđ%]*$/.test(c.text));
        return textCells.length / filled.length >= 0.5;
      };
      const hdrCount = isTextHeaderRow(trimmed[0]) ? 1 : 1;
      const tblCap = bannerTexts[1] || `Bảng ${sIdx + 1}: Dữ liệu "${sheetName}"`;
      const tblNode = ast.nodes.table({
        caption: tblCap,
        headerRows: trimmed.slice(0, hdrCount),
        bodyRows: trimmed.slice(hdrCount),
      });
      if (tblNode.suggestLandscape) {
        anyWide = true;
        warnings.push(`Sheet "${sheetName}" có ${sheetCols} cột (> 8 cột) — nên chọn khổ giấy A4 Ngang (Landscape).`);
      }
      blocks.push(tblNode);
    });

    return ast.createDocumentAst({
      title: String(fileObj?.name || 'BangTinh').replace(/\.[^.]+$/, ''),
      sourceFormat: 'xlsx',
      blocks,
      meta: { suggestLandscape: anyWide, warnings },
    });
  }

  // ============================================================================
  // 4. MARKDOWN + LATEX + STRICT CURRENCY GUARD PARSER
  // ============================================================================
  const CURRENCY_TOKEN_RE =
    /^\d[\d.,]*(?:\s*(?:tr|triệu|tỷ|ty|k|K|M|B|bn|mn|USD|VND|EUR|đ|%|\/năm|\/tháng|\/cp))?(?=$|[\s.,;:!?)\]}–—-])/;
  const MATH_SIGNAL_RE = /\\[A-Za-z]+|[=^_{}\[\]<>≤≥≈×÷±∞+\-*/]/;

  function isValidInlineMathBody(inner) {
    const body = String(inner || '').trim();
    if (!body) return false;
    // Có dấu tiếng Việt + từ văn xuôi dài -> chắc chắn bị kẹp giữa 2 ký hiệu tiền tệ ($28.40 ... $70tr)
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(body) && !/\\text\s*\{/.test(body)) {
      return false;
    }
    if (/\s+[a-z]{3,}\s+[a-z]{3,}/i.test(body) && !/\\/.test(body)) return false;
    // Khớp số tiền thuần ($28.40, $70tr, $397,143) không có phép toán hay LaTeX
    if (/^\d[\d.,\s]*(?:tr|triệu|tỷ|k|m|b|bn|mn|usd|vnd|%|lần)?$/i.test(body)) return false;
    // Bắt đầu bằng chữ số nhưng không phải biểu thức toán (vd "28.40 tăng lên ")
    if (/^\d/.test(body) && !MATH_SIGNAL_RE.test(body)) return false;
    // Một biến/biểu thức hợp lệ hoặc có lệnh LaTeX/toán tử
    return MATH_SIGNAL_RE.test(body) || /^[A-Za-z][A-Za-z0-9_']{0,10}$/.test(body);
  }

  function parseInlineMarkdownRuns(rawText) {
    const ast = getAst();
    const s = String(rawText || '').replace(/\\\$/g, '\uE001'); // bảo vệ \$ literal
    const runs = [];
    let buf = '';
    const flushBuf = () => {
      if (buf) {
        runs.push(ast.makeInlineRun(buf.replace(/\uE001/g, '$')));
        buf = '';
      }
    };

    let i = 0;
    while (i < s.length) {
      // Inline LaTeX $...$ với Currency Guard
      if (s[i] === '$' && s[i + 1] !== '$' && s[i + 1] && !/\s/.test(s[i + 1])) {
        const afterOpen = s.slice(i + 1);
        const isCurrencyLookahead = /^\d[\d.,]*(?:\s*(?:tr|triệu|tỷ|k|m|b|bn|mn|usd|vnd|%|x|lần))?(?=$|[\s.,;:!?)\]}–—-])/i.test(afterOpen);
        if (!isCurrencyLookahead) {
          let closeIdx = -1;
          for (let j = i + 1; j < s.length; j++) {
            if (s[j] === '\\') { j++; continue; }
            if (s[j] === '$') { closeIdx = j; break; }
            if (s[j] === '\n') break;
          }
          if (closeIdx > i + 1 && !/\s/.test(s[closeIdx - 1])) {
            const inner = s.slice(i + 1, closeIdx);
            if (isValidInlineMathBody(inner)) {
              flushBuf();
              runs.push(ast.makeInlineRun(inner.replace(/\uE001/g, '$'), { math: true }));
              i = closeIdx + 1;
              continue;
            }
          }
        }
      }

      // Bold **...**
      if (s.startsWith('**', i)) {
        const end = s.indexOf('**', i + 2);
        if (end > i + 2) {
          flushBuf();
          runs.push(ast.makeInlineRun(s.slice(i + 2, end).replace(/\uE001/g, '$'), { bold: true }));
          i = end + 2;
          continue;
        }
      }

      // Inline code `...`
      if (s[i] === '`') {
        const end = s.indexOf('`', i + 1);
        if (end > i + 1) {
          flushBuf();
          runs.push(ast.makeInlineRun(s.slice(i + 1, end).replace(/\uE001/g, '$'), { code: true }));
          i = end + 1;
          continue;
        }
      }

      // Markdown link [label](url)
      if (s[i] === '[') {
        const linkM = s.slice(i).match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
        if (linkM) {
          flushBuf();
          runs.push(ast.makeInlineRun(linkM[1].replace(/\uE001/g, '$'), { url: linkM[2] }));
          i += linkM[0].length;
          continue;
        }
      }

      buf += s[i];
      i++;
    }
    flushBuf();
    return runs;
  }

  function stripMdInlineFormatting(text) {
    return parseInlineMarkdownRuns(text)
      .map((r) => (r.math ? r.text : r.text))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeMarkdownMathDelimiters(mdText) {
    const src = String(mdText || '').normalize('NFC').replace(/\r\n?/g, '\n');
    // Chuẩn hóa \[...\] -> $$...$$ và \(...\) -> $...$ ngoài fenced code blocks
    const parts = src.split(/(```[\s\S]*?```)/g);
    return parts
      .map((seg, idx) => {
        if (idx % 2 === 1) return seg;
        return seg
          .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `\n$$\n${inner.trim()}\n$$\n`)
          .replace(/\\\(([^)\n]*?)\\\)/g, (_m, inner) => `$${inner.trim()}$`);
      })
      .join('');
  }

  function splitPipeTableCells(line) {
    let s = String(line || '').trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map((c) => stripMdInlineFormatting(c.replace(/\*\*/g, '').replace(/`/g, '').trim()));
  }

  function isGfmSepLine(line) {
    const t = String(line || '').trim();
    if (!t.includes('|') || !t.includes('-')) return false;
    const cells = splitPipeTableCells(t);
    return cells.length >= 2 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
  }

  function parseMarkdownToAst(mdText, meta = {}) {
    const ast = getAst();
    const norm = normalizeMarkdownMathDelimiters(mdText);
    const lines = norm.split('\n');
    const blocks = [];
    let i = 0;
    let prevEndedWithColon = false;
    let pendingList = null;

    const flushList = () => {
      if (pendingList && pendingList.items.length) {
        blocks.push(ast.nodes.list({ ordered: pendingList.ordered, items: pendingList.items }));
      }
      pendingList = null;
    };

    while (i < lines.length) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        flushList();
        i++;
        continue;
      }

      if (/^<!--\s*PAGE_?BREAK\s*-->$/i.test(trimmed)) {
        flushList();
        blocks.push(ast.nodes.pageBreak());
        prevEndedWithColon = false;
        i++;
        continue;
      }

      if (/^(?:---+|\*\*\*+|===+)$/.test(trimmed)) {
        flushList();
        i++;
        continue;
      }

      // 1. Display Math Block $$...$$ (1 dòng hoặc nhiều dòng)
      if (trimmed.startsWith('$$')) {
        flushList();
        if (trimmed.endsWith('$$') && trimmed.length > 4) {
          blocks.push(ast.nodes.mathBlock({ latex: trimmed.slice(2, -2).trim(), source: 'latex' }));
          prevEndedWithColon = false;
          i++;
          continue;
        }
        const mLines = [trimmed.slice(2)];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().endsWith('$$')) {
          mLines.push(lines[j]);
          j++;
        }
        if (j < lines.length) {
          mLines.push(lines[j].trim().slice(0, -2));
          j++;
        }
        blocks.push(ast.nodes.mathBlock({ latex: mLines.join('\n').trim(), source: 'latex' }));
        prevEndedWithColon = false;
        i = j;
        continue;
      }

      // 2. Fenced Code Block
      if (trimmed.startsWith('```')) {
        flushList();
        const codeLines = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeLines.push(lines[j]);
          j++;
        }
        blocks.push(ast.nodes.callout({ variant: 'info', title: 'Mã / Dữ liệu', text: codeLines.join('\n') }));
        prevEndedWithColon = false;
        i = j + 1;
        continue;
      }

      // 3. Markdown Image ![alt](src)
      const imgM = trimmed.match(/^!\[([^\]]*)\]\(((?:data:image\/|https?:\/\/)[^)]+)\)/i);
      if (imgM) {
        flushList();
        blocks.push(ast.nodes.imageBlock({ dataUrl: imgM[2], caption: imgM[1] || '' }));
        prevEndedWithColon = false;
        i++;
        continue;
      }

      // 4. GFM Table (hỗ trợ cả thiếu pipe đầu/cuối miễn dòng 2 là --- | ---)
      if (trimmed.includes('|') && i + 1 < lines.length && isGfmSepLine(lines[i + 1])) {
        flushList();
        const headerTextCells = splitPipeTableCells(trimmed);
        const sepCells = splitPipeTableCells(lines[i + 1]);
        const mdAligns = sepCells.map((sc) => {
          const t = sc.trim();
          if (t.startsWith(':') && t.endsWith(':')) return 'center';
          if (t.endsWith(':')) return 'right';
          return 'auto';
        });
        const rawBodyRows = [];
        let j = i + 2;
        while (j < lines.length) {
          const rowLine = lines[j].trim();
          if (!rowLine || !rowLine.includes('|')) break;
          if (isGfmSepLine(rowLine)) { j++; continue; }
          rawBodyRows.push(splitPipeTableCells(rowLine));
          j++;
        }

        // Gắn caption **Bảng X:** ngay phía trước nếu có
        let tblCaption = '';
        const prevBlk = blocks[blocks.length - 1];
        if (prevBlk && prevBlk.type === 'paragraph' && /^(?:Bảng|Table)\s+\d+/i.test(prevBlk.text)) {
          tblCaption = prevBlk.text;
          blocks.pop();
        }
        // Gắn *Nguồn:...* ngay phía sau nếu có
        let tblSourceNote = '';
        if (j < lines.length) {
          const nextRaw = lines[j].trim().replace(/^\*+|\*+$/g, '').trim();
          if (/^(?:Nguồn|Source|Ghi\s+chú)\s*:/i.test(nextRaw)) {
            tblSourceNote = nextRaw;
            j++;
          }
        }

        blocks.push(ast.nodes.table({
          caption: tblCaption,
          sourceNote: tblSourceNote,
          headerRows: [headerTextCells],
          bodyRows: rawBodyRows,
          colAligns: mdAligns,
        }));
        prevEndedWithColon = false;
        i = j;
        continue;
      }

      // 5. Markdown Heading (#..####)
      const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        flushList();
        const rawH = stripMdInlineFormatting(hMatch[2]);
        const cls = ast.classifyHeadingCandidate(rawH, {
          explicitHeadingStyle: true,
          explicitLevel: Math.min(4, hMatch[1].length),
          fromMarkdown: true,
        }, { prevEndedWithColon });
        if (cls.isHeading) {
          blocks.push(ast.nodes.heading({
            level: cls.level,
            text: cls.cleanText,
            numberPrefix: cls.numberPrefix,
            source: 'markdown',
            includeInToc: cls.includeInToc,
          }));
        } else {
          blocks.push(ast.nodes.paragraph({ text: rawH, inlineRuns: parseInlineMarkdownRuns(hMatch[2]) }));
        }
        prevEndedWithColon = /:\s*$/.test(rawH);
        i++;
        continue;
      }

      // 6. Blockquote > ... hoặc Callout tag học thuật
      if (trimmed.startsWith('>')) {
        flushList();
        const qLines = [trimmed.replace(/^>\s*/, '')];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith('>')) {
          qLines.push(lines[j].trim().replace(/^>\s*/, ''));
          j++;
        }
        const fullQ = qLines.join(' ').trim();
        blocks.push(ast.nodes.callout({
          variant: 'info',
          text: stripMdInlineFormatting(fullQ),
          inlineRuns: parseInlineMarkdownRuns(fullQ),
        }));
        prevEndedWithColon = false;
        i = j;
        continue;
      }

      const strippedForCls = stripMdInlineFormatting(trimmed);
      const tagMatch = strippedForCls.match(ast.ACADEMIC_TAG_CALLOUT_RE);
      if (tagMatch) {
        flushList();
        const label = tagMatch[1] || tagMatch[2] || 'Lưu ý';
        const v = /quan\s+sát/i.test(label) ? 'observation' : /suy\s+luận/i.test(label) ? 'inference' : /đề\s+xuất/i.test(label) ? 'proposal' : /kết\s+luận/i.test(label) ? 'conclusion' : /bình\s+dân/i.test(label) ? 'plain' : 'pro';
        blocks.push(ast.nodes.callout({
          variant: v,
          title: label.replace(/^\[|\]$/g, ''),
          text: tagMatch[3] || strippedForCls,
          inlineRuns: parseInlineMarkdownRuns(trimmed),
        }));
        prevEndedWithColon = /:\s*$/.test(strippedForCls);
        i++;
        continue;
      }

      // 7. Heading heuristic từ plain line (CHƯƠNG 4, 4.1., Câu 1:) — chặn 1. EBIT = ...
      const isPlainBullet = /^(?:[-*•+])\s+(.+)$/.test(trimmed);
      const isPlainOrdered = /^(\d{1,3})\.\s+(.+)$/.test(trimmed);
      const clsPlain = !isPlainBullet
        ? ast.classifyHeadingCandidate(strippedForCls, {
            isBold: /^\*\*.+\*\*$/.test(trimmed),
            fromMarkdown: true,
          }, { prevEndedWithColon })
        : { isHeading: false };

      if (clsPlain.isHeading) {
        flushList();
        blocks.push(ast.nodes.heading({
          level: clsPlain.level,
          text: clsPlain.cleanText,
          numberPrefix: clsPlain.numberPrefix,
          source: 'markdown-heuristic',
          includeInToc: clsPlain.includeInToc,
        }));
        prevEndedWithColon = /:\s*$/.test(strippedForCls);
        i++;
        continue;
      }

      // 8. List (- / * / 1. ...)
      if (isPlainBullet || isPlainOrdered) {
        const isOrd = Boolean(isPlainOrdered);
        const itemBodyRaw = isOrd ? trimmed.replace(/^\d{1,3}\.\s+/, '') : trimmed.replace(/^[-*•+]\s+/, '');
        const indent = rawLine.match(/^(\s*)/)?.[1]?.length || 0;
        if (pendingList && pendingList.ordered !== isOrd) flushList();
        if (!pendingList) pendingList = { ordered: isOrd, items: [] };
        pendingList.items.push({
          text: stripMdInlineFormatting(itemBodyRaw),
          inlineRuns: parseInlineMarkdownRuns(itemBodyRaw),
          level: Math.min(3, Math.floor(indent / 2)),
          marker: isOrd ? trimmed.match(/^\d{1,3}\./)[0] : '•',
        });
        prevEndedWithColon = false;
        i++;
        continue;
      }

      // 9. Paragraph thường
      flushList();
      const runs = parseInlineMarkdownRuns(trimmed);
      blocks.push(ast.nodes.paragraph({ text: strippedForCls, inlineRuns: runs }));
      prevEndedWithColon = /:\s*$/.test(strippedForCls);
      i++;
    }

    flushList();
    const linked = linkCaptionsAndSources(blocks, ast);
    return ast.createDocumentAst({
      title: meta.title || String(meta.filename || 'TaiLieu').replace(/\.[^.]+$/, ''),
      sourceFormat: meta.sourceFormat || 'markdown',
      blocks: linked,
    });
  }

  const exported = Object.freeze({
    ommlNodeToLatex,
    parseDocxNativeToAst,
    parseXlsxNativeToAst,
    parseMarkdownToAst,
    parseInlineMarkdownRuns,
    normalizeMarkdownMathDelimiters,
  });

  NS.structuredParsers = exported;
  global.NoirStructuredParsers = exported;
})(typeof window !== 'undefined' ? window : globalThis);
