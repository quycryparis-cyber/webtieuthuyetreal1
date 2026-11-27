/**
 * ============================================================================
 * 📐 AUTOTESTER v2.0 MODULE 2: MULTI-VIEWPORT, GEOMETRY & VISUAL REGRESSION
 * (autotester/modules/viewportAndGeometry.js — Spec Part 4 + Mobile/Desktop Audit)
 * ============================================================================
 * - 8 Standard Breakpoints: 320, 375, 414, 768, 1024, 1280, 1440, 1920px.
 * - Modal & Toolbar Close/Action Control Auditor (catches off-screen, clipped,
 *   or missing close/open/download buttons on every Mobile & Desktop screen!).
 * - Sweep-and-Prune AABB Element Collision Detection (O(n log n)).
 * - 5-Point Multi-Axis Hit-Testing (center + 4 corners inset 15%).
 * - Text Clipping, Single-Line Range Wrapping, Broken/Distorted Media & Fonts.
 * - 200% Text Zoom Resilience Audit.
 * - Client-Side Visual Regression Engine (Canvas + YIQ Perceptual Diff + IndexedDB).
 * ============================================================================
 */
(function initAutoTesterViewportGeometry(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  const VIEWPORT_MATRIX = Object.freeze([
    { id: 'mobile_xs', label: 'Mobile XS (320×568)', width: 320, height: 568, group: 'mobile' },
    { id: 'mobile_std', label: 'Mobile Std (375×812)', width: 375, height: 812, group: 'mobile' },
    { id: 'mobile_lg', label: 'Mobile Plus (414×896)', width: 414, height: 896, group: 'mobile' },
    { id: 'tablet_v', label: 'Tablet Portrait (768×1024)', width: 768, height: 1024, group: 'tablet' },
    { id: 'tablet_h', label: 'Tablet Landscape (1024×768)', width: 1024, height: 768, group: 'tablet' },
    { id: 'desktop_hd', label: 'Desktop HD (1280×800)', width: 1280, height: 800, group: 'desktop' },
    { id: 'desktop_wide', label: 'Desktop Wide (1440×900)', width: 1440, height: 900, group: 'desktop' },
    { id: 'desktop_fhd', label: 'Desktop FHD (1920×1080)', width: 1920, height: 1080, group: 'desktop' },
  ]);

  function selectorOf(el) {
    if (!el || !el.tagName) return 'unknown';
    if (el.getAttribute?.('data-at-id')) return `[data-at-id="${el.getAttribute('data-at-id')}"]`;
    if (el.id) return `#${el.id}`;
    const cls = String(el.className || '').trim().split(/\s+/).filter((c) => c && !/^(hover:|focus:|sm:|md:|lg:)/.test(c)).slice(0, 2).join('.');
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
  }

  function rectObj(r) {
    return {
      x: Math.round(r.left),
      y: Math.round(r.top),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  }

  function isVisibleEl(el, win) {
    if (!el || !el.isConnected) return false;
    if (el.closest?.('[data-autotester-ui="true"]')) return false;
    if (el.closest?.('.hidden, [hidden], .sr-only')) return false;
    const st = (win || globalScope).getComputedStyle(el);
    if (!st || st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  }

  // --------------------------------------------------------------------------
  // 1. MULTI-WIDTH EXTENSION FOR AT.viewportSim (Supports all 8 Breakpoints)
  // --------------------------------------------------------------------------
  function applyViewportWidth(width, height, label = '') {
    const sim = AT.viewportSim;
    if (!sim) return { width: window.innerWidth, height: window.innerHeight };
    const w = Math.max(320, Number(width) || 1280);
    const h = Math.max(480, Number(height) || 800);
    const baseMode = w < 768 ? 'mobile' : 'desktop';
    sim.apply(baseMode);
    sim._customWidth = w;
    sim._customHeight = h;
    sim._customLabel = label || `${w}x${h}`;

    // Override width/height getters & dynamic CSS box cleanly for exact breakpoint
    try {
      Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => w });
      Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => h });
    } catch (_e) {}

    let stEl = document.getElementById('at-sim-viewport-style');
    if (!stEl) {
      stEl = document.createElement('style');
      stEl.id = 'at-sim-viewport-style';
      stEl.setAttribute('data-autotester-ui', 'true');
      document.head.appendChild(stEl);
    }
    const borderColor = w < 768 ? '#10b981' : w < 1200 ? '#f59e0b' : '#38bdf8';
    stEl.textContent = `
      html[data-at-sim-viewport] {
        width: ${w}px !important; max-width: ${w}px !important; min-width: ${w}px !important;
        margin: 0 auto !important; outline: 3px solid ${borderColor} !important; overflow-x: clip !important;
      }
      html[data-at-sim-viewport] body {
        width: ${w}px !important; max-width: ${w}px !important; min-width: ${w}px !important;
        position: relative !important; contain: layout !important;
      }
      html[data-at-sim-viewport] .fixed:not([data-autotester-ui="true"]):not([data-autotester-ui="true"] *),
      html[data-at-sim-viewport] [role="dialog"]:not([data-autotester-ui="true"]) {
        width: ${w}px !important;
        max-width: ${w}px !important;
        left: 0 !important;
        right: 0 !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
    `;
    document.documentElement.setAttribute('data-at-sim-viewport', String(w));
    try { sim._syncCssMediaRules?.(w); } catch (_e) {}
    try { window.dispatchEvent(new Event('resize')); } catch (_e) {}
    return { width: w, height: h, mode: baseMode, label: sim._customLabel };
  }

  function restoreViewportWidth() {
    document.documentElement.removeAttribute('data-at-sim-viewport');
    document.getElementById('at-sim-viewport-style')?.remove();
    if (AT.viewportSim) {
      AT.viewportSim._customWidth = null;
      AT.viewportSim._customHeight = null;
      AT.viewportSim._customLabel = '';
      AT.viewportSim.restore();
    }
  }

  // --------------------------------------------------------------------------
  // 2. 5-POINT MULTI-AXIS HIT-TESTING (Spec §4.3)
  // --------------------------------------------------------------------------
  function multiPointHitTest(el, doc = document) {
    if (!el || !el.isConnected) return { ok: false, occludedPoints: 5, blocker: 'detached' };
    const win = doc.defaultView || globalScope;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return { ok: true, skipped: true, occludedPoints: 0, blocker: '' };

    const vw = AT.viewportSim?._customWidth || AT.viewportSim?.getWidth?.() || win.innerWidth || 1024;
    const vh = AT.viewportSim?._customHeight || AT.viewportSim?.getHeight?.() || win.innerHeight || 768;

    const ix = Math.max(1, rect.width * 0.15);
    const iy = Math.max(1, rect.height * 0.15);
    const pts = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + ix, rect.top + iy],
      [rect.right - ix, rect.top + iy],
      [rect.left + ix, rect.bottom - iy],
      [rect.right - ix, rect.bottom - iy],
    ];

    const restore = AT.hideAutotesterUiTemp ? AT.hideAutotesterUiTemp(doc) : () => {};
    let occluded = 0;
    let firstBlocker = '';
    let tested = 0;

    try {
      for (const [x, y] of pts) {
        if (x < 1 || y < 1 || x > vw - 1 || y > vh - 1) continue;
        tested += 1;
        const stack = typeof doc.elementsFromPoint === 'function'
          ? doc.elementsFromPoint(x, y)
          : (doc.elementFromPoint ? [doc.elementFromPoint(x, y)].filter(Boolean) : []);
        const top = stack.find((node) => node && !node.closest?.('[data-autotester-ui="true"]'));
        if (top && top !== el && !el.contains(top) && !top.contains(el)) {
          occluded += 1;
          if (!firstBlocker) firstBlocker = selectorOf(top);
        }
      }
    } finally {
      restore();
    }

    return {
      ok: occluded === 0 || (tested > 0 && occluded < tested && occluded <= 1),
      fullyOccluded: tested > 0 && occluded === tested,
      partiallyOccluded: occluded > 1 && occluded < tested,
      occludedPoints: occluded,
      testedPoints: tested,
      blocker: firstBlocker,
    };
  }

  // --------------------------------------------------------------------------
  // 3. MODAL & TOOLBAR MISSING / CLIPPED CLOSE-OPEN BUTTON AUDITOR
  //    (Directly prevents regressions like mobile clipped "✕ Đóng" / "⬇️ Tải PDF")
  // --------------------------------------------------------------------------
  function auditModalAndToolbarControls(doc = document, vwOverride = null, vhOverride = null, label = '') {
    const win = doc.defaultView || globalScope;
    const vw = vwOverride || AT.viewportSim?._customWidth || AT.viewportSim?.getWidth?.() || win.innerWidth || 1024;
    const vh = vhOverride || AT.viewportSim?._customHeight || AT.viewportSim?.getHeight?.() || win.innerHeight || 768;
    const rootLeft = doc.body?.getBoundingClientRect?.().left || 0;
    const issues = [];

    // A. Inspect every visible top-level modal/dialog/overlay (excluding full-screen onboarding gate & nested sub-bars)
    const modalSelector = '[role="dialog"], [aria-modal="true"], [id^="modal-"], [id$="-modal"], [id*="preview-modal"]';
    const modals = Array.from(doc.querySelectorAll(modalSelector)).filter((m) => {
      if (m.id === 'app-entry-connection-gate') return false;
      if (m.parentElement?.closest?.(modalSelector)) return false;
      if (!isVisibleEl(m, win)) return false;
      const r = m.getBoundingClientRect();
      return r.width >= 180 && r.height >= 120;
    });

    const closeNameRe = /(đóng|close|thoát|exit|hủy|cancel|✕|×|✖)/i;
    for (const modal of modals) {
      const mSel = selectorOf(modal);
      const buttons = Array.from(modal.querySelectorAll('button, a[href], [role="button"]')).filter((b) => isVisibleEl(b, win));
      const closeBtns = buttons.filter((b) => {
        const txt = `${b.textContent || ''} ${b.getAttribute('aria-label') || ''} ${b.id || ''} ${b.getAttribute('data-at-expect') || ''}`;
        return closeNameRe.test(txt) || /close|dismiss/i.test(b.id || '');
      });

      if (closeBtns.length === 0) {
        issues.push({
          code: 'ERR_MODAL_CONTROL_MISSING',
          severity: 'P0',
          pillar: 'visual',
          selector: mSel,
          rect: rectObj(modal.getBoundingClientRect()),
          techDetail: `${label || `${vw}x${vh}`}: Hộp thoại ${mSel} đang mở nhưng không có nút Đóng (✕) hiển thị trong vùng nhìn.`,
        });
      }

      // Check every action/close button inside modal header/controls is strictly unclipped inside [0, vw]
      for (const btn of buttons) {
        const br = btn.getBoundingClientRect();
        const relLeft = br.left - rootLeft;
        const relRight = br.right - rootLeft;
        const clippedByViewport = relRight > vw + 2 || relLeft < -2;

        // Check clipping by any ancestor with overflow-x: hidden/clip
        let clippedByAncestor = '';
        let p = btn.parentElement;
        while (p && p !== modal.parentElement && p !== doc.body) {
          const pst = win.getComputedStyle(p);
          if (/(hidden|clip)/.test(pst.overflowX)) {
            const pr = p.getBoundingClientRect();
            if (br.right > pr.right + 2 || br.left < pr.left - 2) {
              clippedByAncestor = selectorOf(p);
              break;
            }
          }
          p = p.parentElement;
        }

        if (clippedByViewport || clippedByAncestor) {
          issues.push({
            code: 'ERR_MODAL_CONTROL_CLIPPED',
            severity: 'P0',
            pillar: 'visual',
            selector: selectorOf(btn),
            rect: rectObj(br),
            techDetail: `${label || `${vw}x${vh}`}: Nút "${(btn.textContent || btn.id || '').trim().slice(0, 32)}" (${selectorOf(btn)}) trong ${mSel} bị cắt/vượt mép màn hình (right=${Math.round(relRight)}px / vw=${vw}px${clippedByAncestor ? `, bị cắt bởi ${clippedByAncestor}` : ''}).`,
          });
        }
      }
    }

    // B. Check primary page header/nav toggle & open/close buttons across viewport width
    const navButtons = Array.from(doc.querySelectorAll('header button, nav button, [data-s14-tab]')).filter((b) => isVisibleEl(b, win));
    for (const btn of navButtons) {
      const inScroll = btn.closest('.overflow-x-auto, [style*="overflow-x: auto"], [style*="overflow-x:auto"]');
      if (inScroll) continue;
      const br = btn.getBoundingClientRect();
      const relLeft = br.left - rootLeft;
      const relRight = br.right - rootLeft;
      if (relRight > vw + 3 || relLeft < -3) {
        issues.push({
          code: 'ERR_MODAL_CONTROL_CLIPPED',
          severity: 'P0',
          pillar: 'visual',
          selector: selectorOf(btn),
          rect: rectObj(br),
          techDetail: `${label || `${vw}x${vh}`}: Nút điều hướng "${(btn.textContent || btn.id || '').trim().slice(0, 28)}" (${selectorOf(btn)}) bị đẩy vượt khung hình (right=${Math.round(relRight)}px > ${vw}px).`,
        });
      }
    }

    return issues;
  }

  // --------------------------------------------------------------------------
  // 4. SWEEP-AND-PRUNE AABB ELEMENT COLLISION DETECTION (Spec §4.2)
  // --------------------------------------------------------------------------
  function sweepAndPruneCollisions(doc = document, vwOverride = null, vhOverride = null) {
    const win = doc.defaultView || globalScope;
    const vw = vwOverride || AT.viewportSim?._customWidth || AT.viewportSim?.getWidth?.() || win.innerWidth || 1024;
    const vh = vhOverride || AT.viewportSim?._customHeight || AT.viewportSim?.getHeight?.() || win.innerHeight || 768;

    // If an active fullscreen modal is open, only check elements inside the topmost modal to prevent false collisions with dimmed background
    const openModals = Array.from(doc.querySelectorAll('[role="dialog"], [aria-modal="true"]')).filter((m) => isVisibleEl(m, win));
    const scopeRoot = openModals.length ? openModals[openModals.length - 1] : doc;

    const raw = Array.from(scopeRoot.querySelectorAll('button, a[href], input:not([type="hidden"]), select, [role="button"], [role="tab"]'));
    const boxes = [];
    for (let i = 0; i < Math.min(raw.length, 320); i++) {
      const el = raw[i];
      if (!isVisibleEl(el, win)) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
      if (r.width < 8 || r.height < 8) continue;
      boxes.push({ el, top: r.top, bottom: r.bottom, left: r.left, right: r.right, area: r.width * r.height, rect: r });
    }

    // Sort by top edge for O(n log n) Sweep-and-Prune
    boxes.sort((a, b) => a.top - b.top);
    const active = [];
    const collisions = [];

    for (const cur of boxes) {
      // Prune ended Y intervals
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].bottom <= cur.top + 1) active.splice(i, 1);
      }
      for (const other of active) {
        if (cur.el.contains(other.el) || other.el.contains(cur.el)) continue;
        // Skip intentionally overlapping elements inside different fixed z-index layers unless both are fixed docks
        const ix = Math.min(cur.right, other.right) - Math.max(cur.left, other.left);
        const iy = Math.min(cur.bottom, other.bottom) - Math.max(cur.top, other.top);
        if (ix > 4 && iy > 4) {
          const interArea = ix * iy;
          const minArea = Math.min(cur.area, other.area);
          if (interArea >= 48 && interArea / Math.max(1, minArea) >= 0.18) {
            collisions.push({
              code: 'ERR_ELEMENT_COLLISION',
              severity: 'P1',
              pillar: 'visual',
              selector: `${selectorOf(other.el)}, ${selectorOf(cur.el)}`,
              rect: rectObj(cur.rect),
              overlapPx: `${Math.round(ix)}x${Math.round(iy)}px`,
              techDetail: `Va chạm AABB: ${selectorOf(other.el)} đè lên ${selectorOf(cur.el)} (${Math.round(ix)}×${Math.round(iy)}px).`,
            });
            if (collisions.length >= 12) return collisions;
          }
        }
      }
      active.push(cur);
    }
    return collisions;
  }

  // --------------------------------------------------------------------------
  // 5. TEXT CLIPPING, SINGLE-LINE RANGE WRAPPING & MEDIA/FONT AUDIT (Spec §4.3)
  // --------------------------------------------------------------------------
  function auditTextClippingAndMedia(doc = document) {
    const win = doc.defaultView || globalScope;
    const clippingIssues = [];
    const mediaIssues = [];
    const fontIssues = [];

    // Text clipping on overflow:hidden buttons/badges without tooltip/truncate title
    const candidates = doc.querySelectorAll('button, [role="button"], [role="tab"], h1, h2, h3');
    for (let i = 0; i < Math.min(candidates.length, 260); i++) {
      const el = candidates[i];
      if (!isVisibleEl(el, win)) continue;
      const st = win.getComputedStyle(el);
      if ((st.overflowX === 'hidden' || st.overflowX === 'clip') && el.clientWidth > 12 && el.scrollWidth > el.clientWidth + 6) {
        const hasTooltip = Boolean(el.getAttribute('title') || el.getAttribute('aria-label') || st.textOverflow === 'ellipsis');
        if (!hasTooltip) {
          clippingIssues.push({
            code: 'WARN_TEXT_CLIPPED',
            severity: 'P2',
            pillar: 'visual',
            selector: selectorOf(el),
            rect: rectObj(el.getBoundingClientRect()),
            techDetail: `Cắt chữ không có ellipsis/tooltip tại ${selectorOf(el)} (scrollWidth=${el.scrollWidth}px > clientWidth=${el.clientWidth}px).`,
          });
        }
      }

      // Single-line Range wrapping check on compact toolbar buttons
      if (el.tagName === 'BUTTON' && el.closest('header, nav') && st.whiteSpace !== 'nowrap' && el.firstChild?.nodeType === 3) {
        try {
          const txt = (el.textContent || '').trim();
          if (txt.length >= 2 && txt.length <= 24) {
            const range = doc.createRange();
            range.selectNodeContents(el);
            const rects = Array.from(range.getClientRects()).filter((r) => r.width > 2 && r.height > 2);
            const distinctLines = new Set(rects.map((r) => Math.round(r.top / 6)));
            if (distinctLines.size >= 3) {
              clippingIssues.push({
                code: 'WARN_TOOLBAR_LINE_WRAP',
                severity: 'P2',
                pillar: 'visual',
                selector: selectorOf(el),
                rect: rectObj(el.getBoundingClientRect()),
                techDetail: `Nút thanh công cụ "${txt}" gãy thành ${distinctLines.size} dòng gây méo thanh điều hướng.`,
              });
            }
          }
        } catch (_eRng) {}
      }
      if (clippingIssues.length >= 10) break;
    }

    // Broken & distorted images
    const imgs = doc.querySelectorAll('img');
    for (let i = 0; i < imgs.length; i++) {
      const im = imgs[i];
      if (!isVisibleEl(im, win)) continue;
      if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) {
        mediaIssues.push({
          code: 'ERR_BROKEN_IMAGE',
          severity: 'P1',
          pillar: 'visual',
          selector: selectorOf(im),
          rect: rectObj(im.getBoundingClientRect()),
          techDetail: `Ảnh hỏng (naturalWidth=0): ${String(im.getAttribute('src') || '').slice(0, 90)}`,
        });
      } else if (im.naturalWidth > 0 && im.naturalHeight > 0) {
        const st = win.getComputedStyle(im);
        if (!/cover|contain|scale-down/i.test(st.objectFit || '')) {
          const r = im.getBoundingClientRect();
          if (r.width >= 24 && r.height >= 24) {
            const natRatio = im.naturalWidth / im.naturalHeight;
            const renRatio = r.width / r.height;
            const distortion = Math.abs(natRatio - renRatio) / Math.max(0.01, natRatio);
            if (distortion > 0.18) {
              mediaIssues.push({
                code: 'WARN_DISTORTED_IMAGE',
                severity: 'P2',
                pillar: 'visual',
                selector: selectorOf(im),
                rect: rectObj(r),
                techDetail: `Ảnh biến dạng tỷ lệ ${Math.round(distortion * 100)}% (gốc ${im.naturalWidth}x${im.naturalHeight} vs vẽ ${Math.round(r.width)}x${Math.round(r.height)}).`,
              });
            }
          }
        }
      }
    }

    // Empty visible SVGs
    const svgs = doc.querySelectorAll('svg');
    let emptySvgCount = 0;
    for (let i = 0; i < svgs.length; i++) {
      const s = svgs[i];
      if (s.closest?.('[data-autotester-ui="true"]') || s.closest?.('.hidden')) continue;
      const st = win.getComputedStyle(s);
      if (st.display === 'none' || st.visibility === 'hidden') continue;
      const r = s.getBoundingClientRect();
      if (r.width === 0 && r.height === 0 && s.children.length === 0) emptySvgCount += 1;
    }
    if (emptySvgCount > 0) {
      mediaIssues.push({
        code: 'WARN_EMPTY_SVG',
        severity: 'P2',
        pillar: 'visual',
        selector: 'svg',
        techDetail: `Phát hiện ${emptySvgCount} phần tử SVG rỗng kích thước 0×0.`,
      });
    }

    // document.fonts status
    try {
      if (doc.fonts && typeof doc.fonts.forEach === 'function') {
        doc.fonts.forEach((f) => {
          if (f.status === 'error') {
            fontIssues.push({
              code: 'ERR_FONT_LOAD_FAILED',
              severity: 'P1',
              pillar: 'visual',
              selector: 'head',
              techDetail: `Phông chữ "${f.family}" (${f.weight}) không tải được (status=error).`,
            });
          }
        });
      }
    } catch (_eF) {}

    return { clippingIssues, mediaIssues, fontIssues };
  }

  // --------------------------------------------------------------------------
  // 6. 200% TEXT ZOOM RESILIENCE AUDIT (Spec §4.1)
  // --------------------------------------------------------------------------
  async function auditTextZoom200(doc = document) {
    const st = doc.createElement('style');
    st.id = 'at-zoom-200-probe-style';
    st.setAttribute('data-autotester-ui', 'true');
    st.textContent = 'html { font-size: 200% !important; }';
    doc.head.appendChild(st);
    await new Promise((r) => setTimeout(r, 45));
    try {
      const vw = AT.viewportSim?._customWidth || AT.viewportSim?.getWidth?.() || (doc.defaultView?.innerWidth || 1280);
      const docOverflow = (doc.documentElement?.scrollWidth || vw) - vw;
      const clippedModals = auditModalAndToolbarControls(doc, vw, doc.defaultView?.innerHeight || 800, `Zoom 200% (${vw}px)`);
      return {
        ok: docOverflow <= 24 && clippedModals.length === 0,
        overflowPx: Math.max(0, Math.round(docOverflow)),
        clippedCount: clippedModals.length,
        sample: clippedModals[0]?.techDetail || '',
      };
    } finally {
      st.remove();
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  // --------------------------------------------------------------------------
  // 7. FULL MULTI-VIEWPORT SWEEP (All Mobile & Desktop Breakpoints)
  // --------------------------------------------------------------------------
  async function runMultiViewportAudit(breakpoints = null, opts = {}) {
    const list = Array.isArray(breakpoints) && breakpoints.length
      ? breakpoints.map((b) => (typeof b === 'number' ? VIEWPORT_MATRIX.find((x) => x.width === b) || { id: `vp_${b}`, label: `${b}px`, width: b, height: b < 768 ? 812 : 900, group: b < 768 ? 'mobile' : 'desktop' } : b))
      : VIEWPORT_MATRIX;

    const prevMode = AT.viewportSim?.mode || 'real';
    const report = [];
    const allIssues = [];

    try {
      for (const bp of list) {
        applyViewportWidth(bp.width, bp.height, bp.label);
        await AT.sleep(opts.delayMs || 35);

        const visualFindings = AT.visualAuditor?.scanCurrentScreen ? AT.visualAuditor.scanCurrentScreen(bp.label) : [];
        const modalIssues = auditModalAndToolbarControls(document, bp.width, bp.height, bp.label);
        const collisions = sweepAndPruneCollisions(document, bp.width, bp.height);

        const bpIssues = [...modalIssues, ...collisions, ...visualFindings.map((f) => ({ ...f, viewport: bp.label }))];
        report.push({
          id: bp.id,
          label: bp.label,
          width: bp.width,
          height: bp.height,
          group: bp.group,
          issueCount: bpIssues.length,
          modalControlIssues: modalIssues.length,
          collisionIssues: collisions.length,
          overflowIssues: visualFindings.filter((x) => x.code === 'ERR_MOBILE_OVERFLOW').length,
        });
        allIssues.push(...bpIssues);
      }
    } finally {
      restoreViewportWidth();
      if (prevMode && prevMode !== 'real') AT.viewportSim?.apply?.(prevMode);
    }

    return {
      testedViewports: report.length,
      matrix: report,
      issues: allIssues,
      passedAll: allIssues.filter((i) => (i.severity || 'P1') === 'P0').length === 0,
    };
  }

  // --------------------------------------------------------------------------
  // 8. CLIENT-SIDE VISUAL REGRESSION ENGINE (YIQ Pixel Diff + IndexedDB — Spec §4.4)
  // --------------------------------------------------------------------------
  class ClientVisualRegressionEngine {
    constructor() {
      this.dbName = '__at_visual_baselines_v2__';
      this.storeName = 'snapshots';
    }

    _openDb() {
      return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') return resolve(null);
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    // Rasterize lightweight geometric layout map of visible blocks onto a 160×120 Canvas (100% CORS-safe, zero taint!)
    captureLayoutRaster(container = document.body, w = 160, h = 120) {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);

      const vw = AT.viewportSim?._customWidth || window.innerWidth || 1280;
      const vh = AT.viewportSim?._customHeight || window.innerHeight || 800;
      const sx = w / Math.max(1, vw);
      const sy = h / Math.max(1, vh);

      const els = (container || document.body).querySelectorAll('header, nav, section:not(.hidden), button, [role="dialog"]:not(.hidden), h1, h2, canvas');
      for (let i = 0; i < Math.min(els.length, 280); i++) {
        const el = els[i];
        if (!isVisibleEl(el, window)) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
        const st = getComputedStyle(el);
        ctx.fillStyle = st.backgroundColor && st.backgroundColor !== 'rgba(0, 0, 0, 0)' ? st.backgroundColor : '#27272a';
        ctx.fillRect(Math.max(0, r.left * sx), Math.max(0, r.top * sy), Math.max(1, r.width * sx), Math.max(1, r.height * sy));
        if (el.tagName === 'BUTTON' || el.tagName === 'H1' || el.tagName === 'H2') {
          ctx.strokeStyle = st.color || '#f4f4f5';
          ctx.strokeRect(Math.max(0, r.left * sx), Math.max(0, r.top * sy), Math.max(1, r.width * sx), Math.max(1, r.height * sy));
        }
      }
      return { width: w, height: h, data: Array.from(ctx.getImageData(0, 0, w, h).data) };
    }

    // YIQ Perceptual Color Space Pixel Diff with basic anti-aliasing threshold
    computeYiqDiff(snapA, snapB, threshold = 0.14) {
      if (!snapA || !snapB || snapA.width !== snapB.width || snapA.height !== snapB.height) {
        return { diffPixels: 0, totalPixels: 1, diffRatio: 0, diffBox: null };
      }
      const w = snapA.width;
      const h = snapA.height;
      const a = snapA.data;
      const b = snapB.data;
      const maxDelta = 35215 * threshold * threshold;
      let diffPixels = 0;
      let minX = w, minY = h, maxX = 0, maxY = 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const dr = a[i] - b[i];
          const dg = a[i + 1] - b[i + 1];
          const db = a[i + 2] - b[i + 2];
          if (dr === 0 && dg === 0 && db === 0) continue;
          const dy = dr * 0.29889531 + dg * 0.58662247 + db * 0.11448223;
          const di = dr * 0.59597799 - dg * 0.27417610 - db * 0.32180189;
          const dq = dr * 0.21147017 - dg * 0.52261711 + db * 0.31114694;
          const delta = 0.5053 * dy * dy + 0.299 * di * di + 0.1957 * dq * dq;
          if (delta > maxDelta) {
            diffPixels += 1;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      const totalPixels = w * h;
      const diffRatio = Number((diffPixels / Math.max(1, totalPixels)).toFixed(4));
      return {
        diffPixels,
        totalPixels,
        diffRatio,
        diffBox: diffPixels > 0 ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null,
      };
    }

    async saveBaseline(key, snap) {
      try {
        const db = await this._openDb();
        if (!db) return false;
        await new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          tx.objectStore(this.storeName).put({ key, snap, updatedAt: Date.now() });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
        db.close();
        return true;
      } catch (_e) {
        return false;
      }
    }

    async loadBaseline(key) {
      try {
        const db = await this._openDb();
        if (!db) return null;
        const rec = await new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, 'readonly');
          const req = tx.objectStore(this.storeName).get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
        db.close();
        return rec?.snap || null;
      } catch (_e) {
        return null;
      }
    }

    async compareWithBaseline(key = 'main_screen') {
      const current = this.captureLayoutRaster(document.body);
      if (!current) return { hasBaseline: false, diffRatio: 0, diffBox: null };
      const baseline = await this.loadBaseline(key);
      if (!baseline) {
        await this.saveBaseline(key, current);
        return { hasBaseline: false, initializedBaseline: true, diffRatio: 0, diffBox: null };
      }
      const diff = this.computeYiqDiff(baseline, current);
      return { hasBaseline: true, ...diff };
    }
  }

  AT.VIEWPORT_MATRIX = VIEWPORT_MATRIX;
  AT.viewportGeometry = {
    VIEWPORT_MATRIX,
    selectorOf,
    applyViewportWidth,
    restoreViewportWidth,
    multiPointHitTest,
    auditModalAndToolbarControls,
    sweepAndPruneCollisions,
    auditTextClippingAndMedia,
    auditTextZoom200,
    runMultiViewportAudit,
  };
  AT.visualRegression = new ClientVisualRegressionEngine();
})(typeof window !== 'undefined' ? window : globalThis);
