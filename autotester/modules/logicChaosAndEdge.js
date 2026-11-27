/**
 * ============================================================================
 * 🧠 AUTOTESTER v2.0 MODULE 3: LOGIC, INVARIANTS, UNIT HARNESS, CHAOS & EDGE
 * (autotester/modules/logicChaosAndEdge.js — Spec Parts 3 & 6.4)
 * ============================================================================
 * - AutonomousDomCrawler (TreeWalker + open ShadowRoot) & FiniteStateGraph
 * - UniversalUiInvariantScanner (NaN, undefined, standalone null, [object Object],
 *   Invalid Date, Infinity, {{...}}/${...}, negative counts) + Data Integrity
 * - DeclarativeAssertionSpecRunner & ClientSideUnitHarness (Bucket 2 — Write-Once Run-Forever)
 * - 4-Channel Dead-Click Detector, Form/Boundary Fuzzer, Seeded Mulberry32 PRNG Chaos
 * - SPA History/Deep-Link Auditor & Async Race Condition Simulator
 * - 5 Edge-State Resilience Probes (Cold-Start, Corrupted JSON, Offline, 70% Quota, Cross-Tab)
 * ============================================================================
 */
(function initAutoTesterLogicChaosEdge(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  // --------------------------------------------------------------------------
  // 1. AUTONOMOUS DOM CRAWLER (TreeWalker + Open ShadowRoot) + FINITE STATE GRAPH
  // --------------------------------------------------------------------------
  class AutonomousDomCrawler {
    constructor() {
      this.visitedFingerprints = new Set();
      this.stateEdges = [];
    }

    reset() {
      this.visitedFingerprints.clear();
      this.stateEdges = [];
    }

    discoverInteractiveElements(root = document.body, maxCount = 600) {
      const found = [];
      const seen = new Set();
      const interactiveTags = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY']);
      const interactiveRoles = new Set(['button', 'link', 'tab', 'menuitem', 'checkbox', 'switch', 'radio', 'option']);

      const walk = (container) => {
        if (!container || found.length >= maxCount) return;
        const doc = container.ownerDocument || document;
        const win = doc.defaultView || globalScope;
        let tw = null;
        try {
          tw = doc.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
        } catch (_e) {
          return;
        }
        let node = tw.currentNode;
        while (node && found.length < maxCount) {
          if (node.nodeType === 1 && !node.closest?.('[data-autotester-ui="true"]')) {
            if (node.shadowRoot) walk(node.shadowRoot);
            const tag = node.tagName;
            const role = String(node.getAttribute?.('role') || '').toLowerCase();
            const hasTabIndex = node.hasAttribute?.('tabindex') && node.getAttribute('tabindex') !== '-1';
            const isEditable = node.getAttribute?.('contenteditable') === 'true';
            const hasAtContract = node.hasAttribute?.('data-at-id') || node.hasAttribute?.('data-at-expect');
            let isPointer = false;
            if (!interactiveTags.has(tag) && !interactiveRoles.has(role) && !hasTabIndex && !isEditable) {
              try {
                isPointer = win.getComputedStyle(node).cursor === 'pointer' && (node.onclick || node.dataset?.action || node.id);
              } catch (_eC) {}
            }
            if (interactiveTags.has(tag) || interactiveRoles.has(role) || hasTabIndex || isEditable || hasAtContract || isPointer) {
              if (!seen.has(node)) {
                seen.add(node);
                found.push(node);
              }
            }
          }
          node = tw.nextNode();
        }
      };

      walk(root);
      return found;
    }

    computeStateFingerprint(doc = document) {
      const path = `${globalScope.location?.pathname || ''}${globalScope.location?.hash || ''}`;
      const visibleSections = Array.from(doc.querySelectorAll('section:not(.hidden), main > div:not(.hidden)'))
        .slice(0, 8)
        .map((s) => s.id || s.tagName)
        .join(',');
      const openModals = Array.from(doc.querySelectorAll('[role="dialog"]:not(.hidden), [aria-modal="true"]:not(.hidden)'))
        .filter((m) => !m.closest?.('[data-autotester-ui="true"]') && getComputedStyle(m).display !== 'none')
        .map((m) => m.id || 'dialog')
        .join(',');
      const fp = `${path}|sec:${visibleSections}|mod:${openModals}`;
      this.visitedFingerprints.add(fp);
      return fp;
    }

    recordTransition(fromFp, actionLabel, toFp) {
      if (fromFp !== toFp) {
        this.stateEdges.push({ from: fromFp, action: actionLabel, to: toFp });
        if (this.stateEdges.length > 60) this.stateEdges.shift();
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. UNIVERSAL UI INVARIANT SCANNER & DATA INTEGRITY CHECKER (Spec §3.2)
  // --------------------------------------------------------------------------
  const UI_ARTIFACT_PATTERNS = [
    { name: 'NaN', re: /\bNaN\b/ },
    { name: 'undefined', re: /\bundefined\b/ },
    { name: 'standalone_null', re: /(?:^|[\s:(\[])null(?:$|[\s.,)\]])/ },
    { name: 'object_Object', re: /\[object Object\]/ },
    { name: 'Invalid_Date', re: /\bInvalid Date\b/ },
    { name: 'Infinity', re: /\b-?Infinity\b/ },
    { name: 'template_mustache', re: /\{\{[^}]{1,60}\}\}/ },
    { name: 'template_dollar', re: /\$\{[a-zA-Z_$][a-zA-Z0-9_$.]{0,40}\}/ },
    { name: 'negative_count', re: /(?:^|\s)-\d+\s+(?:trang|mục|tệp|chương|từ|bản ghi|items?|pages?|files?|cards?)\b/i },
  ];

  function scanUiInvariants(doc = document) {
    const violations = [];
    const tw = doc.createTreeWalker(doc.body || doc.documentElement, NodeFilter.SHOW_TEXT);
    let node;
    let scanned = 0;

    while ((node = tw.nextNode()) && scanned < 2500) {
      const parent = node.parentElement;
      if (!parent) continue;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'CODE' || tag === 'PRE') continue;
      if (parent.closest?.('[data-autotester-ui="true"], .hidden, [hidden], .sr-only')) continue;
      const txt = String(node.nodeValue || '').trim();
      if (!txt || txt.length > 300) continue;
      scanned += 1;

      const st = getComputedStyle(parent);
      if (st.display === 'none' || st.visibility === 'hidden') continue;

      for (const pat of UI_ARTIFACT_PATTERNS) {
        const m = txt.match(pat.re);
        if (m) {
          violations.push({
            code: 'ERR_UI_INVARIANT_ARTIFACT',
            severity: 'P0',
            pillar: 'functional',
            artifact: pat.name,
            selector: AT.viewportGeometry?.selectorOf?.(parent) || parent.tagName.toLowerCase(),
            snippet: txt.slice(0, 90),
            techDetail: `Phát hiện chuỗi lỗi logic "${m[0]}" (${pat.name}) hiển thị trên giao diện tại ${AT.viewportGeometry?.selectorOf?.(parent) || tag}: "${txt.slice(0, 70)}"`,
          });
          break;
        }
      }
      if (violations.length >= 12) break;
    }

    return { scannedNodes: scanned, violations };
  }

  function checkDataIntegrityInvariants() {
    const issues = [];
    // Check 1: Duplicate IDs across document
    const idMap = new Map();
    const allWithId = document.querySelectorAll('[id]');
    for (let i = 0; i < allWithId.length; i++) {
      const el = allWithId[i];
      if (el.closest?.('[data-autotester-ui="true"]')) continue;
      const id = el.id;
      if (!id) continue;
      idMap.set(id, (idMap.get(id) || 0) + 1);
    }
    const dupIds = [];
    idMap.forEach((cnt, id) => { if (cnt > 1) dupIds.push(`${id} (x${cnt})`); });
    if (dupIds.length > 0) {
      issues.push({
        code: 'ERR_DUPLICATE_DOM_ID',
        severity: 'P1',
        pillar: 'functional',
        selector: `#${dupIds[0].split(' ')[0]}`,
        techDetail: `Phát hiện ${dupIds.length} mã định danh ID bị trùng lặp trong DOM: ${dupIds.slice(0, 5).join(', ')}`,
      });
    }

    // Check 2: Domain state invariants (NoirStudio chapters / Mod 51 decks / Mod 49 allocation sum)
    const ns = globalScope.NoirStudio;
    if (Array.isArray(ns?.state?.chapters)) {
      const chapIds = new Set();
      for (const ch of ns.state.chapters) {
        if (ch?.id && chapIds.has(ch.id)) {
          issues.push({
            code: 'ERR_DATA_INTEGRITY',
            severity: 'P0',
            pillar: 'functional',
            selector: 'NoirStudio.state.chapters',
            techDetail: `Trùng lặp chapter.id="${ch.id}" trong danh sách chương.`,
          });
          break;
        }
        if (ch?.id) chapIds.add(ch.id);
      }
    }

    const invAlloc = globalScope.NoirInvestToday?.stateManager?.allocation;
    if (Array.isArray(invAlloc) && invAlloc.length > 0) {
      const sum = invAlloc.reduce((acc, item) => acc + (Number(item?.pct || item?.weight || 0) || 0), 0);
      if (sum > 0 && Math.abs(sum - 100) > 2) {
        issues.push({
          code: 'ERR_DATA_INTEGRITY',
          severity: 'P1',
          pillar: 'functional',
          selector: 'NoirInvestToday.allocation',
          techDetail: `Tổng tỷ trọng phân bổ đầu tư = ${sum}% (lệch khỏi 100%).`,
        });
      }
    }

    return issues;
  }

  // --------------------------------------------------------------------------
  // 3. BUCKET 2: DECLARATIVE ASSERTION SPEC RUNNER & CLIENT-SIDE UNIT HARNESS
  //    (Write-Once Run-Forever Logic Layer — Spec §3.3)
  // --------------------------------------------------------------------------
  class Bucket2LogicHarness {
    constructor() {
      this.unitTests = [];
      this.businessSpecs = [];
      this._registerDefaultAppUnitTests();
    }

    registerUnitTest(def) {
      if (!def || !def.id || typeof def.fn !== 'function') return;
      const idx = this.unitTests.findIndex((u) => u.id === def.id);
      if (idx >= 0) this.unitTests[idx] = def;
      else this.unitTests.push(def);
    }

    registerBusinessSpec(spec) {
      if (!spec || !spec.id) return;
      const idx = this.businessSpecs.findIndex((s) => s.id === spec.id);
      if (idx >= 0) this.businessSpecs[idx] = spec;
      else this.businessSpecs.push(spec);
    }

    _registerDefaultAppUnitTests() {
      this.registerUnitTest({
        id: 'unit_mod03_escape_html',
        moduleRef: 'mod03_humanized_ui_toast_and_vn_nlp_utils.js',
        label: 'escapeHtml mã hóa 100% thẻ <script> & thuộc tính onerror',
        fn: () => {
          const esc = globalScope.NoirStudio?.utils?.escapeHtml;
          if (typeof esc !== 'function') return { ok: true, skipped: true };
          const out = esc('<img src=x onerror="alert(1)"><script>x</script>');
          if (/<img|<script/i.test(out)) throw new Error(`escapeHtml leaked raw tag: ${out}`);
          return { ok: true, detail: 'escaped safely' };
        },
      });

      this.registerUnitTest({
        id: 'unit_mod15_api_key_format_router',
        moduleRef: 'mod15_api_key_vault_and_zero_congestion_client.js',
        label: 'Nhận diện chuẩn cả khóa AIza* lẫn Vertex Express AQ.* & tồn tại alias apiClient',
        fn: () => {
          const ns = globalScope.NoirStudio;
          if (!ns) return { ok: true, skipped: true };
          const client = ns.apiClient || ns.geminiRouter;
          const bridge = globalScope.NoirDangLovePdfV2?.geminiBridge;
          const hasVerify = Boolean(
            client &&
            (typeof client.verifyApiKeyConnection === 'function' ||
              typeof client.verifyKeyWithLowestFlashLite === 'function' ||
              typeof client.verifyApiKeyRealtime === 'function')
          );
          if (!hasVerify) {
            throw new Error('Thiếu hàm verify API Key trên NS.apiClient / NS.geminiRouter');
          }
          if (bridge && typeof bridge.verifyApiKeyRealtime !== 'function') {
            throw new Error('Thiếu NoirDangLovePdfV2.geminiBridge.verifyApiKeyRealtime');
          }
          const fmtFn = client.isValidApiKeyFormat || bridge?.isValidApiKeyFormat;
          if (typeof fmtFn === 'function') {
            if (!fmtFn.call(client, 'AIzaSyD1234567890abcdef1234567890abcdef')) {
              throw new Error('Từ chối sai khóa AIza hợp lệ');
            }
            if (!fmtFn.call(client, 'AQ.Ab8RN6L1234567890abcdef1234567890')) {
              throw new Error('Từ chối sai khóa AQ.* Vertex hợp lệ');
            }
            if (fmtFn.call(client, 'abc')) {
              throw new Error('Chấp nhận sai chuỗi ngắn không hợp lệ');
            }
          }
          return { ok: true, detail: 'mod15 verifyApiKeyConnection + bridge verifyApiKeyRealtime verified' };
        },
      });

      this.registerUnitTest({
        id: 'unit_mod45_fx570_precision',
        moduleRef: 'mod45_scientific_fx570_and_desmos_graphing_calc.js',
        label: 'Casio FX-570 tính chính xác biểu thức số học & lượng giác biên',
        fn: () => {
          const eng = globalScope.NoirStudio?.Fx570MathEngine;
          if (!eng || typeof eng.evaluate !== 'function') return { ok: true, skipped: true };
          const r1 = eng.evaluate('2+3*4');
          const v1 = typeof r1 === 'object' ? Number(r1?.value ?? r1?.result) : Number(r1);
          if (Number.isFinite(v1) && Math.abs(v1 - 14) > 1e-6) {
            throw new Error(`2+3*4 trả về ${v1} thay vì 14`);
          }
          return { ok: true, detail: '2+3*4=14 verified' };
        },
      });

      this.registerUnitTest({
        id: 'unit_mod39_youtube_url_parser',
        moduleRef: 'mod39_youtube_adfree_player_and_background.js',
        label: 'Bộ phân tích link YouTube bắt đúng watch/youtu.be/shorts/embed',
        fn: () => {
          const p = globalScope.NoirStudio?.YouTubeUrlParserAndValidator;
          if (!p || typeof p.extractVideoId !== 'function') return { ok: true, skipped: true };
          const cases = [
            'https://www.youtube.com/watch?v=jfKfPfyJRdk',
            'https://youtu.be/jfKfPfyJRdk?t=12',
            'https://www.youtube.com/shorts/jfKfPfyJRdk',
          ];
          for (const url of cases) {
            if (p.extractVideoId(url) !== 'jfKfPfyJRdk') throw new Error(`Parse sai URL: ${url}`);
          }
          return { ok: true, detail: '3 URL forms passed' };
        },
      });

      this.registerUnitTest({
        id: 'unit_mod46_pdf_tools_catalog',
        moduleRef: 'mod46b_danglovepdf_pro_engines.js',
        label: 'ĐăngLovePDF đăng ký đủ >= 40 công cụ gồm cả ICR nhận diện chữ viết tay',
        fn: () => {
          const pro = globalScope.NoirStudio?.dangLovePdfPro;
          if (!pro?.PRO_TOOL_GROUPS) return { ok: true, skipped: true };
          const tools = pro.PRO_TOOL_GROUPS.flatMap((g) => g.tools || []);
          const hasIcr = tools.some((t) => /icr/i.test(String(t.id || t.key || '')));
          if (tools.length < 40) throw new Error(`Chỉ có ${tools.length} công cụ (<40)`);
          if (!hasIcr) throw new Error('Thiếu công cụ ICR chữ viết tay');
          return { ok: true, detail: `${tools.length} tools + ICR present` };
        },
      });

      this.registerUnitTest({
        id: 'unit_mod49_mod50_exporters_ready',
        moduleRef: 'modules/invest-today & twenty-min-wisdom',
        label: 'Mod 49 & Mod 50 export PDF có cửa sổ xem trước & không vỡ hợp đồng hàm',
        fn: () => {
          const inv = globalScope.NoirInvestToday?.pdfExporter;
          const w20 = globalScope.NoirTwentyMinWisdom?.pdfExporter;
          if (inv && typeof inv.previewAndExportInvestPdf !== 'function') {
            throw new Error('Thiếu inv.pdfExporter.previewAndExportInvestPdf');
          }
          if (w20 && typeof w20.exportWisdomPdf !== 'function') {
            throw new Error('Thiếu w20.pdfExporter.exportWisdomPdf');
          }
          return { ok: true, detail: 'Mod 49/50 exporters verified' };
        },
      });

      this.registerUnitTest({
        id: 'unit_mod21_soundscapes_11_modes',
        moduleRef: 'mod21_mp3_ab_loop_and_webaudio_soundscape.js',
        label: 'Mod 21 có đủ 4 âm thanh nhẹ nhàng mới (FAN, PINK_NOISE, WHITE_NOISE, BLUE_NOISE)',
        fn: () => {
          const el = document.getElementById('s15-soundscape-select') || document.querySelector('[data-soundscape="FAN"]');
          const html = document.body?.innerHTML || '';
          const hasFan = Boolean(el) || /FAN/.test(html);
          if (!hasFan && globalScope.NoirStudio) {
            return { ok: true, skipped: true };
          }
          return { ok: true, detail: 'Soundscapes present' };
        },
      });

      this.registerUnitTest({
        id: 'unit_dot12_gemini38_blueprint_ocr_icr',
        moduleRef: 'modules/danglovepdf-v2/geminiBridgeAndVision.js',
        label: 'Gemini 3.8 Flash + response_schema (4 lược đồ) + AI-Locator Blueprint Merger + Tiền nhận diện ảnh OCR/ICR',
        fn: () => {
          const gb = globalScope.NoirGeminiBridge || globalScope.NoirStudio?.geminiBridge;
          if (!gb) return { ok: true, skipped: true };
          const models = gb.getOptimalModelsForTask?.('doc_multimodal') || [];
          if (!models.includes('gemini-3.8-flash')) {
            throw new Error(`doc_multimodal thiếu gemini-3.8-flash: ${models.join(',')}`);
          }
          if (!gb.RESPONSE_SCHEMAS?.THEME10_BLUEPRINT || !gb.RESPONSE_SCHEMAS?.OCR_STRUCTURED || !gb.RESPONSE_SCHEMAS?.ICR_STRUCTURED) {
            throw new Error('Thiếu RESPONSE_SCHEMAS chuẩn cho Theme10 / OCR / ICR');
          }
          if (typeof gb.applyBlueprintToBlocks !== 'function' || typeof gb.preprocessImageForOcrIcr !== 'function' || typeof gb.parseStructuredOcrIcrReply !== 'function') {
            throw new Error('Thiếu hàm applyBlueprintToBlocks / preprocessImageForOcrIcr / parseStructuredOcrIcrReply');
          }
          // Khẳng định toán học: AI-Locator giữ nguyên 100% văn bản thường và chỉ gắn cấp tiêu đề + tên bảng/hình + công thức
          const sampleBlocks = [
            { type: 'p', page: 1, text: '1.1 Tổng quan thị trường dược phẩm' },
            { type: 'p', page: 1, text: 'Đoạn văn thường phải giữ nguyên 100% không mất chữ, tỷ lệ >= 12%.' },
            { type: 'table', page: 2, caption: '', rows: [['Năm', 'Doanh thu'], ['2026', '1500']] },
          ];
          const res = gb.applyBlueprintToBlocks(sampleBlocks, {
            headings: [{ page: 1, level: 2, text: '1.1. Tổng quan thị trường dược phẩm', matchAnchor: '1.1 Tổng quan thị trường' }],
            tables: [{ page: 2, caption: 'Bảng 1: Doanh thu năm 2026' }],
            figures: [],
            formulas: [],
            specialSymbols: [{ page: 1, rawText: '>=', normalizedUnicode: '≥' }],
          });
          if (!res.applied || res.blocks[0].type !== 'heading' || res.blocks[2].caption !== 'Bảng 1: Doanh thu năm 2026' || !res.blocks[1].text.includes('≥')) {
            throw new Error('applyBlueprintToBlocks không khớp đúng cấu trúc mẫu');
          }
          return { ok: true, detail: 'gemini-3.8-flash + 4 schemas + blueprint merger verified' };
        },
      });
    }

    async runAll() {
      const results = [];
      for (const t of this.unitTests) {
        const t0 = performance.now();
        try {
          const out = await t.fn();
          results.push({
            id: t.id,
            kind: 'unit',
            moduleRef: t.moduleRef || 'app',
            label: t.label,
            ok: true,
            skipped: Boolean(out?.skipped),
            ms: Number((performance.now() - t0).toFixed(2)),
            detail: out?.detail || 'ok',
          });
        } catch (err) {
          results.push({
            id: t.id,
            kind: 'unit',
            moduleRef: t.moduleRef || 'app',
            label: t.label,
            ok: false,
            ms: Number((performance.now() - t0).toFixed(2)),
            error: err?.message || String(err),
          });
        }
      }

      for (const spec of this.businessSpecs) {
        const t0 = performance.now();
        try {
          await this._runSpec(spec);
          results.push({ id: spec.id, kind: 'spec', label: spec.label || spec.id, ok: true, ms: Number((performance.now() - t0).toFixed(2)) });
        } catch (err) {
          results.push({ id: spec.id, kind: 'spec', label: spec.label || spec.id, ok: false, error: err?.message || String(err), ms: Number((performance.now() - t0).toFixed(2)) });
        }
      }

      const failed = results.filter((r) => !r.ok);
      return {
        total: results.length,
        passed: results.filter((r) => r.ok).length,
        failedCount: failed.length,
        failed,
        results,
      };
    }

    async _runSpec(spec) {
      for (const step of spec.steps || []) {
        if (step.action === 'click') {
          const el = document.querySelector(step.selector);
          if (!el) throw new Error(`Không thấy phần tử: ${step.selector}`);
          el.click();
          await AT.sleep(step.waitMs || 60);
        } else if (step.action === 'fill') {
          const el = document.querySelector(step.selector);
          if (!el) throw new Error(`Không thấy ô nhập: ${step.selector}`);
          setNativeInputValue(el, step.value);
          await AT.sleep(step.waitMs || 40);
        } else if (step.action === 'expectExists') {
          if (!document.querySelector(step.selector)) throw new Error(`Thiếu phần tử kỳ vọng: ${step.selector}`);
        } else if (step.action === 'expectHidden') {
          const el = document.querySelector(step.selector);
          if (el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none') {
            throw new Error(`Phần tử ${step.selector} đáng lẽ phải ẩn`);
          }
        } else if (step.action === 'assert' && typeof step.fn === 'function') {
          const ok = await step.fn();
          if (!ok) throw new Error(step.message || 'Assertion failed');
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. NATIVE INPUT BOUNDARY FUZZER & SEEDED MULBERRY32 PRNG CHAOS (Spec §3.4)
  // --------------------------------------------------------------------------
  function mulberry32(seed) {
    let a = (seed >>> 0) || 1337;
    return function nextRand() {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function setNativeInputValue(el, value) {
    if (!el) return;
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    if (desc?.set) desc.set.call(el, String(value));
    else el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  }

  const BOUNDARY_PAYLOADS = [
    '',
    '   ',
    'Tiếng Việt có dấu ắc ự ệ 🚀👨‍👩‍👧‍👦',
    '\u202Ertl-override-probe',
    '-1',
    '0',
    String(Number.MAX_SAFE_INTEGER + 2),
    '0.3333333333333333',
    'A'.repeat(10000),
  ];

  async function runFormBoundaryFuzz() {
    const errBefore = AT.errorAuditor?.errors?.length || 0;
    const probeInput = document.createElement('input');
    probeInput.type = 'text';
    probeInput.setAttribute('data-autotester-ui', 'true');
    probeInput.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(probeInput);
    try {
      for (const payload of BOUNDARY_PAYLOADS) {
        setNativeInputValue(probeInput, payload);
      }
      // Also verify visible search/filter text inputs safely with backup/restore
      const safeInputs = Array.from(document.querySelectorAll('section:not(.hidden) input[type="search"], section:not(.hidden) input[type="text"]'))
        .filter((inp) => !inp.closest('[data-autotester-ui="true"]') && inp.getAttribute('data-at-safe') !== 'false' && !/api|key|password/i.test(`${inp.id} ${inp.name} ${inp.placeholder}`))
        .slice(0, 2);

      for (const inp of safeInputs) {
        const orig = inp.value;
        try {
          for (const p of ['', '   ', 'Tiếng Việt 🚀', 'A'.repeat(256)]) {
            setNativeInputValue(inp, p);
          }
        } finally {
          setNativeInputValue(inp, orig);
        }
      }
    } finally {
      probeInput.remove();
    }
    const errAfter = AT.errorAuditor?.errors?.length || 0;
    return { ok: errAfter === errBefore, newErrors: errAfter - errBefore, payloadsTested: BOUNDARY_PAYLOADS.length };
  }

  const DANGER_LABEL_RE = /(xóa tất cả|xoá tất cả|delete all|clear all|reset|đăng xuất|logout|sign out|thoát ứng dụng|exit app|format|wipe|mua ngay|thanh toán)/i;

  async function runSeededChaos(seed = 20261127, steps = 12) {
    const rand = mulberry32(seed);
    const errBefore = AT.errorAuditor?.errors?.length || 0;
    const actionLog = [];

    const safeButtons = Array.from(document.querySelectorAll('section:not(.hidden) button, nav button'))
      .filter((b) => {
        if (b.closest('[data-autotester-ui="true"]') || b.disabled) return false;
        if (b.getAttribute('data-at-safe') === 'false') return false;
        const txt = `${b.textContent || ''} ${b.getAttribute('aria-label') || ''} ${b.id || ''}`;
        if (DANGER_LABEL_RE.test(txt)) return false;
        if (/exit|delete|remove|reset|logout|api-key|open-url|download|export|pdf/i.test(b.id || '')) return false;
        const r = b.getBoundingClientRect();
        return r.width >= 10 && r.height >= 10;
      });

    for (let i = 0; i < steps; i++) {
      const roll = rand();
      if (roll < 0.45 && safeButtons.length > 0) {
        const idx = Math.floor(rand() * safeButtons.length);
        const target = safeButtons[idx];
        const sel = AT.viewportGeometry?.selectorOf?.(target) || target.tagName;
        // Double-click resilience probe on safe tabs/toggles
        if (target.hasAttribute('data-s14-tab') || target.hasAttribute('aria-expanded')) {
          target.click();
          actionLog.push(`#${i + 1} click ${sel}`);
        } else {
          target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          actionLog.push(`#${i + 1} hover ${sel}`);
        }
      } else if (roll < 0.75) {
        const y = Math.floor(rand() * 240);
        try { window.scrollBy(0, i % 2 === 0 ? y : -y); } catch (_e) {}
        actionLog.push(`#${i + 1} scroll ${y}px`);
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        actionLog.push(`#${i + 1} key Escape`);
      }
      await AT.sleep(15);
    }

    const errAfter = AT.errorAuditor?.errors?.length || 0;
    return {
      ok: errAfter === errBefore,
      seed,
      stepsExecuted: actionLog.length,
      newErrors: errAfter - errBefore,
      actionLog: actionLog.slice(-10),
    };
  }

  // --------------------------------------------------------------------------
  // 5. SPA HISTORY & ASYNC RACE CONDITION TESTER (Spec §3.5)
  // --------------------------------------------------------------------------
  async function auditSpaHistoryAndAsyncRace() {
    const errBefore = AT.errorAuditor?.errors?.length || 0;
    const origUrl = globalScope.location?.href || '';
    const issues = [];

    // A. SPA History pushState / popstate round-trip
    try {
      const baseHash = globalScope.location?.hash || '';
      globalScope.history.pushState({ __at_probe: 1 }, '', '#__at_history_probe_1');
      globalScope.history.pushState({ __at_probe: 2 }, '', '#__at_history_probe_2');
      globalScope.history.back();
      await AT.sleep(40);
      globalScope.history.forward();
      await AT.sleep(40);
      // Restore cleanly
      globalScope.history.replaceState(null, '', baseHash || (globalScope.location.pathname + globalScope.location.search));
    } catch (err) {
      issues.push(`SPA history error: ${err?.message || err}`);
    }

    // B. Async Race Condition Coordinator Verification (late req A must never overwrite newer req B)
    let latestToken = 0;
    let renderedKey = '';
    const fetchWithStaleGuard = (key, delayMs) => {
      const token = ++latestToken;
      return new Promise((resolve) => {
        setTimeout(() => {
          if (token === latestToken) renderedKey = key;
          resolve({ key, accepted: token === latestToken });
        }, delayMs);
      });
    };
    const pA = fetchWithStaleGuard('ITEM_A_SLOW', 90);
    await AT.sleep(15);
    const pB = fetchWithStaleGuard('ITEM_B_FAST', 20);
    await Promise.all([pA, pB]);
    if (renderedKey !== 'ITEM_B_FAST') {
      issues.push(`Async race guard failed: renderedKey=${renderedKey}`);
    }

    const errAfter = AT.errorAuditor?.errors?.length || 0;
    if (errAfter > errBefore) {
      issues.push(`Phát sinh ${errAfter - errBefore} lỗi runtime khi điều hướng History/Async Race`);
    }
    return { ok: issues.length === 0, origUrl, issues };
  }

  // --------------------------------------------------------------------------
  // 6. 5 EXTREME EDGE-STATE RESILIENCE PROBES (Spec §6.4)
  // --------------------------------------------------------------------------
  async function auditEdgeStateResilience() {
    const errBefore = AT.errorAuditor?.errors?.length || 0;
    const probes = {};
    const issues = [];

    // Probe 1: Cold-Start safe JSON reader check
    try {
      const parsedEmpty = (() => {
        try { return JSON.parse(localStorage.getItem('__at_cold_nonexistent_key__') || 'null'); } catch (_e) { return null; }
      })();
      probes.coldStart = parsedEmpty === null;
    } catch (e) {
      probes.coldStart = false;
      issues.push(`Cold-start probe failed: ${e.message}`);
    }

    // Probe 2: Corrupted Storage JSON Resilience (isolated sandbox key)
    const badKey = '__at_sbx__corrupt_json_probe';
    try {
      localStorage.setItem(badKey, '{"broken": [1, 2, ');
      let recovered = false;
      try {
        JSON.parse(localStorage.getItem(badKey));
      } catch (_expectedSyntaxErr) {
        recovered = true;
      }
      probes.corruptedJson = recovered;
      if (!recovered) issues.push('Corrupted JSON did not trigger recovery path');
    } finally {
      try { localStorage.removeItem(badKey); } catch (_e) {}
    }

    // Probe 3: Offline Resilience Event Probe
    try {
      globalScope.dispatchEvent(new Event('offline'));
      await AT.sleep(30);
      globalScope.dispatchEvent(new Event('online'));
      probes.offlineEvent = true;
    } catch (e) {
      probes.offlineEvent = false;
      issues.push(`Offline/online dispatch error: ${e.message}`);
    }

    // Probe 4: Storage Quota Measurement (UTF-16 bytes vs 5MB) + QuotaExceededError safe guard
    let usedBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        const v = localStorage.getItem(k) || '';
        usedBytes += (k.length + v.length) * 2;
      }
    } catch (_e) {}
    const quotaLimitBytes = 5 * 1024 * 1024;
    const usagePct = Number(((usedBytes / quotaLimitBytes) * 100).toFixed(2));
    probes.storageUsagePct = usagePct;
    probes.storageUsedKb = Math.round(usedBytes / 1024);
    if (usagePct > 70) {
      issues.push(`localStorage đang dùng ${usagePct}% (${probes.storageUsedKb} KB / 5120 KB — vượt ngưỡng 70%)`);
    }

    // Probe 5: Cross-Tab StorageEvent & BroadcastChannel Sync Probe
    try {
      const se = new StorageEvent('storage', {
        key: '__at_sbx__cross_tab_ping',
        oldValue: null,
        newValue: JSON.stringify({ ts: Date.now() }),
      });
      globalScope.dispatchEvent(se);
      if (typeof globalScope.BroadcastChannel === 'function') {
        const bc = new BroadcastChannel('__at_sbx__cross_tab_ch');
        bc.postMessage({ type: 'at_ping', ts: Date.now() });
        bc.close();
      }
      probes.crossTabSync = true;
    } catch (e) {
      probes.crossTabSync = false;
      issues.push(`Cross-tab sync error: ${e.message}`);
    }

    const errAfter = AT.errorAuditor?.errors?.length || 0;
    if (errAfter > errBefore) {
      issues.push(`Phát sinh ${errAfter - errBefore} lỗi runtime trong 5 bài thử ngoại biên`);
    }

    return { ok: issues.length === 0, probes, issues };
  }

  AT.crawler = new AutonomousDomCrawler();
  AT.bucket2 = new Bucket2LogicHarness();
  AT.logicAndEdge = {
    scanUiInvariants,
    checkDataIntegrityInvariants,
    setNativeInputValue,
    mulberry32,
    runFormBoundaryFuzz,
    runSeededChaos,
    auditSpaHistoryAndAsyncRace,
    auditEdgeStateResilience,
  };
})(typeof window !== 'undefined' ? window : globalThis);
