/**
 * ============================================================================
 * 🤝 AUTOTESTER v2.0 MODULE 5: CO-EVOLUTION, SURFACE DELTA, DELEGATION & BRIDGE
 * (autotester/modules/bridgeAndCoEvolution.js — Spec Parts 8, 9 & 10)
 * ============================================================================
 * - Declarative HTML Contract Reader (data-at-id, data-at-expect, data-at-safe, data-at-flow)
 * - Surface Registry & Surface Delta Engine (added/modified/removed + Sync Requests)
 * - Internal Capabilities Manifest (Bucket 1 & 2 declarations)
 * - AI Delegation Registry (Bucket 3) with Smart Trigger Functions & Scoped Evidence
 * - Token Budget Cap Engine (omits passed details, clusters duplicates, sorts P0->P4,
 *   caps to max 15 critical bugs, strictly < ~2,000 tokens!)
 * - Single-Call Pull-Based Bridge: window.__AUTOTESTER__
 * ============================================================================
 */
(function initAutoTesterBridgeAndCoEvolution(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});
  const SURFACE_REG_KEY = '__at_surface_registry_v2__';

  // --------------------------------------------------------------------------
  // 1. INTERNAL CAPABILITIES MANIFEST (Bucket 1 & Bucket 2 Autonomous Coverage)
  // --------------------------------------------------------------------------
  const CAPABILITIES_MANIFEST = Object.freeze({
    version: '2.0.0',
    architecture: 'Micro-kernel + 3-Bucket Hybrid Co-Evolution',
    bucket1AutonomousPillars: [
      'smart_auto_wait_5_checks',
      'dom_network_animation_settle',
      'two_beat_deterministic_retry',
      'snapshot_rollback_sandbox',
      'autonomous_dom_crawler_shadow_root',
      'ui_invariant_and_data_integrity',
      'four_channel_dead_click_and_fuzzing',
      'seeded_mulberry32_chaos',
      'spa_history_and_async_race',
      'multi_viewport_8_breakpoints_320_to_1920',
      'modal_toolbar_clipped_close_button_audit',
      'sweep_and_prune_aabb_collision',
      'five_point_hit_testing',
      'text_clipping_wrapping_media_font_audit',
      'text_zoom_200_resilience',
      'client_side_yiq_visual_regression',
      'deep_security_xss_secret_postmessage_proto_sri_csp',
      'cwv_lcp_cls_inp_longtask_fps_cyclic_leak_profiler',
      'five_edge_state_resilience_probes',
      'alpha_compositing_wcag_contrast_and_a11y',
      'i18n_mojibake_pseudoloc_35pct_and_seo_pwa',
    ],
    bucket2LogicLayer: [
      'declarative_html_contract_data_at',
      'declarative_assertion_spec_runner',
      'client_side_unit_harness',
      'surface_registry_and_delta_engine',
    ],
    prohibitedManualChecksForAI: [
      'manual_button_clicking_for_dead_clicks',
      'manual_responsive_resizing_320_to_1920',
      'manual_console_or_network_error_scanning',
      'manual_solid_background_wcag_contrast',
      'manual_xss_or_noopener_or_seo_meta_checks',
    ],
  });

  // --------------------------------------------------------------------------
  // 2. DECLARATIVE HTML CONTRACT READER (data-at-* — Spec §8.1)
  // --------------------------------------------------------------------------
  function scanDeclarativeContracts(doc = document) {
    const els = Array.from(doc.querySelectorAll('[data-at-id], [data-at-expect], [data-at-safe], [data-at-flow]'))
      .filter((el) => !el.closest?.('[data-autotester-ui="true"]'));

    return els.map((el) => ({
      atId: el.getAttribute('data-at-id') || '',
      expect: el.getAttribute('data-at-expect') || '',
      safe: el.getAttribute('data-at-safe') !== 'false',
      flow: el.getAttribute('data-at-flow') || '',
      tag: el.tagName.toLowerCase(),
      selector: el.id ? `#${el.id}` : (el.getAttribute('data-at-id') ? `[data-at-id="${el.getAttribute('data-at-id')}"]` : el.tagName.toLowerCase()),
    }));
  }

  // --------------------------------------------------------------------------
  // 3. SURFACE REGISTRY & SURFACE DELTA ENGINE (Spec §8.2)
  // --------------------------------------------------------------------------
  function captureCurrentSurfaces(doc = document) {
    const surfaces = {};
    const nodes = AT.crawler?.discoverInteractiveElements
      ? AT.crawler.discoverInteractiveElements(doc.body, 500)
      : Array.from(doc.querySelectorAll('button, a[href], [role="dialog"], section[id]'));

    for (const el of nodes) {
      if (!el || el.closest?.('[data-autotester-ui="true"]')) continue;
      const key = el.getAttribute('data-at-id') || (el.id ? `#${el.id}` : '');
      if (!key) continue;
      surfaces[key] = {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        hasContract: Boolean(el.getAttribute('data-at-id') || el.getAttribute('data-at-expect')),
        expect: el.getAttribute('data-at-expect') || '',
        label: String(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
      };
    }
    return surfaces;
  }

  function loadSurfaceRegistry() {
    try {
      const raw = localStorage.getItem(SURFACE_REG_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_e) {
      return null;
    }
  }

  function saveSurfaceRegistry(surfaces = null) {
    const snap = surfaces || captureCurrentSurfaces();
    const payload = { updatedAt: Date.now(), count: Object.keys(snap).length, surfaces: snap };
    try {
      localStorage.setItem(SURFACE_REG_KEY, JSON.stringify(payload));
    } catch (_e) {}
    return payload;
  }

  function computeSurfaceDelta() {
    const current = captureCurrentSurfaces();
    const saved = loadSurfaceRegistry();
    if (!saved || !saved.surfaces) {
      saveSurfaceRegistry(current);
      return {
        initialized: true,
        totalSurfaces: Object.keys(current).length,
        added: [],
        modified: [],
        removed: [],
        syncRequests: [],
      };
    }

    const prev = saved.surfaces;
    const added = [];
    const modified = [];
    const removed = [];
    const syncRequests = [];

    Object.keys(current).forEach((k) => {
      if (!prev[k]) {
        added.push(k);
        if (!current[k].hasContract) {
          syncRequests.push({
            surfaceId: k,
            label: current[k].label,
            reason: 'New interactive surface lacks data-at-* contract / Bucket 2 assertion',
            action: 'Add data-at-id/data-at-expect or register Bucket 2 unit/spec',
          });
        }
      } else if (prev[k].tag !== current[k].tag || prev[k].role !== current[k].role || prev[k].expect !== current[k].expect) {
        modified.push(k);
      }
    });

    Object.keys(prev).forEach((k) => {
      if (!current[k]) removed.push(k);
    });

    return {
      initialized: false,
      totalSurfaces: Object.keys(current).length,
      added: added.slice(0, 20),
      modified: modified.slice(0, 20),
      removed: removed.slice(0, 20),
      syncRequests: syncRequests.slice(0, 10),
    };
  }

  // --------------------------------------------------------------------------
  // 4. AI DELEGATION REGISTRY (Bucket 3) WITH SMART TRIGGER FUNCTIONS (Spec §9 & §10.1)
  // --------------------------------------------------------------------------
  const AI_DELEGATION_REGISTRY = [
    {
      id: 'b3_text_over_complex_bg',
      category: 'visual_aesthetic',
      title: 'Kiểm định độ rõ chữ trên ảnh nền / gradient đa điểm dừng',
      smartTrigger: (ctx) => {
        const list = ctx.a11y?.complexBgDelegations || [];
        if (list.length === 0) return null;
        return {
          triggered: true,
          count: list.length,
          evidence: list.slice(0, 3),
          instruction: 'Chụp đúng tọa độ rect để xác minh mắt người đọc rõ chữ trên nền ảnh/gradient.',
        };
      },
    },
    {
      id: 'b3_exported_file_verification',
      category: 'os_sandbox_boundary',
      title: 'Xác minh tệp PDF / DOCX / XLSX thật xuất ra ổ cứng',
      smartTrigger: (ctx) => {
        const exportBtns = Array.from(document.querySelectorAll('[id*="export-pdf"], [id*="pv-download"], [data-at-expect^="download:"]'))
          .filter((b) => !b.closest?.('[data-autotester-ui="true"]'));
        const deltaTouched = (ctx.surfaceDelta?.added?.length || 0) + (ctx.surfaceDelta?.modified?.length || 0) > 0;
        if (exportBtns.length === 0 || (!deltaTouched && !ctx.forceExportCheck)) return null;
        const first = exportBtns[0];
        const r = first.getBoundingClientRect();
        return {
          triggered: true,
          count: exportBtns.length,
          evidence: [{ selector: AT.viewportGeometry?.selectorOf?.(first) || `#${first.id}`, rect: { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) } }],
          instruction: 'Tải file xuất thật để kiểm tra ngắt trang bảng biểu, font tiếng Việt & hyperlink PDF.',
        };
      },
    },
    {
      id: 'b3_visual_aesthetic_delta',
      category: 'visual_aesthetic',
      title: 'Đánh giá thẩm mỹ trực quan khối giao diện mới / biến động > 15%',
      smartTrigger: (ctx) => {
        const diffRatio = ctx.visualDiff?.diffRatio || 0;
        const addedCount = ctx.surfaceDelta?.added?.length || 0;
        if (diffRatio <= 0.15 && addedCount === 0) return null;
        return {
          triggered: true,
          diffRatio,
          addedSurfaces: (ctx.surfaceDelta?.added || []).slice(0, 5),
          evidence: ctx.visualDiff?.diffBox ? [{ diffBox: ctx.visualDiff.diffBox }] : [],
          instruction: 'Đánh giá bố cục, cân đối khoảng trắng và màu sắc đúng tại vùng thay đổi.',
        };
      },
    },
    {
      id: 'b3_semantic_copy_review',
      category: 'semantic_language',
      title: 'Thẩm định ngữ nghĩa văn bản mới / đầu ra AI sinh ra',
      smartTrigger: (ctx) => {
        const aiOut = document.getElementById('tab3-rich-output-editor');
        const txt = String(aiOut?.innerText || '').trim();
        if (txt.length < 40 && (ctx.surfaceDelta?.added?.length || 0) === 0) return null;
        return {
          triggered: true,
          evidence: [{ selector: '#tab3-rich-output-editor', snippet: txt.slice(0, 180) }],
          instruction: 'Kiểm tra ngữ nghĩa tự nhiên, chính tả và tính logic của nội dung hiển thị.',
        };
      },
    },
    {
      id: 'b3_os_file_picker_and_cross_origin',
      category: 'os_sandbox_boundary',
      title: 'Tương tác hộp thoại tệp hệ điều hành / iframe khác nguồn gốc',
      smartTrigger: () => {
        const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).filter((n) => !n.closest?.('[data-autotester-ui="true"]'));
        const crossIframes = Array.from(document.querySelectorAll('iframe[src^="http"]')).filter((f) => {
          try { return new URL(f.src).origin !== globalScope.location.origin; } catch (_e) { return true; }
        });
        if (fileInputs.length === 0 && crossIframes.length === 0) return null;
        return {
          triggered: true,
          fileInputCount: fileInputs.length,
          crossOriginIframeCount: crossIframes.length,
          evidence: [
            ...(fileInputs[0] ? [{ selector: AT.viewportGeometry?.selectorOf?.(fileInputs[0]) || 'input[type="file"]' }] : []),
            ...(crossIframes[0] ? [{ selector: AT.viewportGeometry?.selectorOf?.(crossIframes[0]) || 'iframe', src: String(crossIframes[0].src || '').slice(0, 80) }] : []),
          ],
          instruction: 'Dùng trình điều khiển ngoài hộp cát nếu cần nạp file OS thật hoặc kiểm tra iframe bên thứ ba.',
        };
      },
    },
  ];

  function buildDelegationQueue(ctx = {}) {
    const queue = [];
    for (const entry of AI_DELEGATION_REGISTRY) {
      try {
        const res = entry.smartTrigger(ctx);
        if (res && res.triggered) {
          queue.push({
            id: entry.id,
            category: entry.category,
            title: entry.title,
            ...res,
          });
        }
      } catch (_e) {}
    }
    return queue;
  }

  // --------------------------------------------------------------------------
  // 5. TOKEN BUDGET CAP ENGINE (< 2,000 Tokens — Deduplicate, Cluster, Top 15)
  // --------------------------------------------------------------------------
  const SEV_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };

  function normalizeClusterKey(issue) {
    const code = issue.code || issue.id || 'UNKNOWN';
    const sel = String(issue.selector || '').replace(/#[a-zA-Z0-9_-]+/, '#ID').split(',')[0].trim().slice(0, 40);
    return `${code}::${sel}`;
  }

  function buildTokenCappedPayload(fullReport, extraCtx = {}) {
    const rawIssues = Array.isArray(fullReport?.issues) ? fullReport.issues : [];
    const passedCount = Array.isArray(fullReport?.passed) ? fullReport.passed.length : 0;

    // 1. Deduplicate & cluster identical errors
    const clusterMap = new Map();
    for (const it of rawIssues) {
      const ck = normalizeClusterKey(it);
      if (!clusterMap.has(ck)) {
        clusterMap.set(ck, {
          code: it.code || it.id,
          severity: it.severity || 'P1',
          pillar: it.pillar || 'functional',
          confirmedHardBug: it.confirmedHardBug !== false,
          affectedCount: Number(it.affectedCount) || 1,
          sampleSelector: String(it.selector || '').slice(0, 80),
          moduleRef: String(it.moduleRef || 'app').slice(0, 60),
          summary: String(it.plainTitle || it.techDetail || '').slice(0, 110),
          detail: String(it.techDetail || '').slice(0, 180),
          ...(it.rect ? { rect: it.rect } : {}),
        });
      } else {
        const existing = clusterMap.get(ck);
        existing.affectedCount += Number(it.affectedCount) || 1;
      }
    }

    // 2. Sort P0 -> P4 and hard-cap to top 15 critical issues
    const clustered = Array.from(clusterMap.values()).sort((a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3));
    const topHardBugs = clustered.slice(0, 15);

    const surfaceDelta = extraCtx.surfaceDelta || computeSurfaceDelta();
    const delegationQueue = extraCtx.delegationQueue || buildDelegationQueue({
      a11y: extraCtx.a11y,
      surfaceDelta,
      visualDiff: extraCtx.visualDiff,
      forceExportCheck: extraCtx.forceExportCheck,
    });

    const payload = {
      schema: 'autotester-antigravity-bridge/v2.0',
      timestamp: new Date().toISOString(),
      viewport: fullReport?.viewport || `${window.innerWidth}x${window.innerHeight}`,
      score: fullReport?.totalScore ?? null,
      summary: {
        passedCount,
        hardBugCount: topHardBugs.length,
        totalRawIssues: rawIssues.length,
        truncatedIssues: Math.max(0, clustered.length - 15),
        flakyCount: AT.retryVerifier?.flakyWarnings?.length || 0,
        unitTestsPassed: extraCtx.unitSummary?.passed ?? null,
        unitTestsTotal: extraCtx.unitSummary?.total ?? null,
      },
      autonomousCoverage: {
        version: CAPABILITIES_MANIFEST.version,
        bucket1Pillars: CAPABILITIES_MANIFEST.bucket1AutonomousPillars.length,
        skipManualChecks: CAPABILITIES_MANIFEST.prohibitedManualChecksForAI,
      },
      hardBugs: topHardBugs,
      flakyWarnings: (AT.retryVerifier?.flakyWarnings || []).slice(0, 5),
      surfaceDelta: {
        total: surfaceDelta.totalSurfaces,
        added: surfaceDelta.added.slice(0, 10),
        modified: surfaceDelta.modified.slice(0, 10),
        removed: surfaceDelta.removed.slice(0, 10),
        syncRequests: surfaceDelta.syncRequests.slice(0, 6),
      },
      aiDelegationQueue: delegationQueue.slice(0, 6),
    };

    // Enforce hard char budget (< ~7,200 chars ≈ < 1,800 tokens)
    let json = JSON.stringify(payload);
    if (json.length > 7200) {
      payload.hardBugs = payload.hardBugs.map((b) => ({ ...b, detail: b.detail.slice(0, 90) }));
      payload.aiDelegationQueue = payload.aiDelegationQueue.slice(0, 4);
      json = JSON.stringify(payload);
    }
    payload.estimatedTokens = Math.ceil(json.length / 4);
    return payload;
  }

  // --------------------------------------------------------------------------
  // 6. SINGLE-CALL PULL-BASED BRIDGE: window.__AUTOTESTER__ (Spec §10.2)
  // --------------------------------------------------------------------------
  const bridgeApi = {
    version: '2.0.0',

    getCapabilities() {
      return {
        ...CAPABILITIES_MANIFEST,
        registeredUnitTests: (AT.bucket2?.unitTests || []).map((u) => u.id),
        registeredBusinessSpecs: (AT.bucket2?.businessSpecs || []).map((s) => s.id),
        declarativeContractsCount: scanDeclarativeContracts().length,
      };
    },

    getSurfaceDelta() {
      return computeSurfaceDelta();
    },

    getDelegationQueue(extraCtx = {}) {
      const a11y = extraCtx.a11y || AT.a11yAuditorV2?.runWcagAndA11yAudit?.();
      const surfaceDelta = extraCtx.surfaceDelta || computeSurfaceDelta();
      return buildDelegationQueue({ ...extraCtx, a11y, surfaceDelta });
    },

    async updateBaselines() {
      const surf = saveSurfaceRegistry();
      let visualSaved = false;
      if (AT.visualRegression) {
        const snap = AT.visualRegression.captureLayoutRaster(document.body);
        visualSaved = await AT.visualRegression.saveBaseline('main_screen', snap);
      }
      return { ok: true, surfacesSaved: surf.count, visualSaved };
    },

    registerUnitTest(def) {
      AT.bucket2?.registerUnitTest?.(def);
      return true;
    },

    registerBusinessSpec(spec) {
      AT.bucket2?.registerBusinessSpec?.(spec);
      return true;
    },

    async auditViewports(widths = [320, 375, 414, 768, 1024, 1280, 1440, 1920]) {
      return AT.viewportGeometry.runMultiViewportAudit(widths);
    },

    exportTokenCappedReport(extraCtx = {}) {
      const ctrl = globalScope.NoirAutoTester;
      if (ctrl?.lastReport) {
        return buildTokenCappedPayload(ctrl.lastReport, extraCtx);
      }
      // Quick zero-wait live audit fallback if runFullAudit hasn't run yet
      const modalIssues = AT.viewportGeometry?.auditModalAndToolbarControls?.() || [];
      const uiInv = AT.logicAndEdge?.scanUiInvariants?.() || { violations: [] };
      const a11y = AT.a11yAuditorV2?.runWcagAndA11yAudit?.() || { issues: [], complexBgDelegations: [] };
      return buildTokenCappedPayload(
        {
          totalScore: modalIssues.length || uiInv.violations.length ? 75 : 95,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          passed: [],
          issues: [...modalIssues, ...uiInv.violations, ...(a11y.issues || [])],
        },
        { ...extraCtx, a11y }
      );
    },

    async runFullAudit(opts = {}) {
      const ctrl = globalScope.NoirAutoTester;
      if (ctrl && typeof ctrl.runAllSelected === 'function' && !opts.quickOnly) {
        if (!ctrl.isOpen()) {
          // Run headlessly without needing visible HUD if called by Antigravity
          ctrl.shell.enabledTestIds = new Set(AT.SUITE_GROUPS.flatMap((g) => g.tests.map((t) => t.id)));
        }
        await ctrl.runAllSelected();
      }

      const unitSummary = AT.bucket2 ? await AT.bucket2.runAll() : null;
      const a11y = AT.a11yAuditorV2 ? AT.a11yAuditorV2.runWcagAndA11yAudit() : null;
      const visualDiff = AT.visualRegression ? await AT.visualRegression.compareWithBaseline('main_screen') : null;
      const surfaceDelta = computeSurfaceDelta();

      const report = ctrl?.lastReport || {
        totalScore: 100,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        passed: [],
        issues: [],
      };
      return buildTokenCappedPayload(report, {
        unitSummary,
        a11y,
        visualDiff,
        surfaceDelta,
        forceExportCheck: Boolean(opts.forceExportCheck),
      });
    },
  };

  AT.coEvolution = {
    CAPABILITIES_MANIFEST,
    scanDeclarativeContracts,
    captureCurrentSurfaces,
    saveSurfaceRegistry,
    computeSurfaceDelta,
    buildDelegationQueue,
    buildTokenCappedPayload,
  };
  globalScope.__AUTOTESTER__ = bridgeApi;
})(typeof window !== 'undefined' ? window : globalThis);
