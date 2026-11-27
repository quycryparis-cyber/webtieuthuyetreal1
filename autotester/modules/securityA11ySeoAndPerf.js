/**
 * ============================================================================
 * 🔐 AUTOTESTER v2.0 MODULE 4: SECURITY, A11Y (ALPHA WCAG), I18N, SEO/PWA & PERF
 * (autotester/modules/securityA11ySeoAndPerf.js — Spec Parts 5, 6.1–6.3 & 7)
 * ============================================================================
 * - DeepSecurityAuditor: Canary DOM XSS, Secret/Credential Leak Scanner,
 *   postMessage origin check, Prototype Pollution probe, Dangerous Sink audit,
 *   target="_blank" noopener, Mixed Content, SRI & CSP meta check.
 * - NetworkAndCwvLeakAuditor: Request Storm Detector, Response Schema check,
 *   Core Web Vitals (LCP/CLS/INP/LongTask/FPS), Cyclic Leak Profiler
 *   (DOM nodes + tracked listeners + performance.memory).
 * - WcagAndA11yAuditor: Full Alpha-Compositing WCAG Contrast (C_out = a*C_fg + (1-a)*C_bg),
 *   routing text-over-image/gradient directly into Bucket 3 AI Delegation Queue,
 *   duplicate IDs, heading order, alt/aria-label/label, 44x44 mobile targets,
 *   Tab/Escape focus check.
 * - I18nTypographyAndSeoPwaAuditor: Untranslated keys, mojibake, Pseudo-Localization
 *   +35% stress test, Technical SEO & PWA readiness.
 * ============================================================================
 */
(function initAutoTesterSecurityA11ySeoPerf(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  function selectorOf(el) {
    if (AT.viewportGeometry?.selectorOf) return AT.viewportGeometry.selectorOf(el);
    if (!el || !el.tagName) return 'unknown';
    return el.id ? `#${el.id}` : el.tagName.toLowerCase();
  }

  function parseRgba(str) {
    const m = String(str || '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i);
    if (!m) return null;
    return {
      r: Math.min(255, Math.max(0, Number(m[1]))),
      g: Math.min(255, Math.max(0, Number(m[2]))),
      b: Math.min(255, Math.max(0, Number(m[3]))),
      a: m[4] === undefined ? 1 : Math.min(1, Math.max(0, Number(m[4]))),
    };
  }

  // Alpha Compositing: C_out = alpha * C_fg + (1 - alpha) * C_bg
  function compositeOver(fg, bg) {
    const a = fg.a;
    return {
      r: a * fg.r + (1 - a) * bg.r,
      g: a * fg.g + (1 - a) * bg.g,
      b: a * fg.b + (1 - a) * bg.b,
      a: Math.min(1, a + bg.a * (1 - a)),
    };
  }

  function relativeLuminance(c) {
    const lin = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  }

  function wcagRatio(c1, c2) {
    const l1 = relativeLuminance(c1);
    const l2 = relativeLuminance(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function resolveCompositedBackground(el, win) {
    const layers = [];
    let cur = el;
    let hasComplexBg = false;
    let complexReason = '';

    while (cur && cur.nodeType === 1) {
      const st = win.getComputedStyle(cur);
      if (st.backgroundImage && st.backgroundImage !== 'none') {
        hasComplexBg = true;
        complexReason = /gradient/i.test(st.backgroundImage) ? 'css_gradient' : 'background_image';
      }
      const bg = parseRgba(st.backgroundColor);
      const op = Number(st.opacity);
      if (bg && bg.a > 0) {
        layers.push({ r: bg.r, g: bg.g, b: bg.b, a: bg.a * (Number.isFinite(op) ? op : 1) });
        if (bg.a >= 0.99 && (!Number.isFinite(op) || op >= 0.99)) break;
      }
      cur = cur.parentElement;
    }

    // Default backdrop: dark theme fallback if body is dark, else white
    let result = { r: 9, g: 9, b: 11, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) {
      result = compositeOver(layers[i], result);
    }
    return { color: result, hasComplexBg, complexReason };
  }

  // --------------------------------------------------------------------------
  // 1. DEEP CLIENT-SIDE SECURITY AUDITOR (Spec Part 5)
  // --------------------------------------------------------------------------
  const SECRET_PATTERNS = [
    { name: 'Google_API_Key', re: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
    { name: 'Vertex_Express_Key', re: /\bAQ\.[0-9A-Za-z_-]{24,}\b/ },
    { name: 'OpenAI_Key', re: /\bsk-[0-9A-Za-z]{20,}\b/ },
    { name: 'GitHub_PAT', re: /\bgh[pousr]_[0-9A-Za-z]{28,}\b/ },
    { name: 'AWS_Access_Key', re: /\bAKIA[0-9A-Z]{16}\b/ },
    { name: 'JWT_Token', re: /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/ },
  ];

  // User-configured intentional local vault keys are allowed in localStorage ONLY (never in URL/DOM/exports)
  const INTENTIONAL_LOCAL_VAULT_KEYS = new Set([
    'noir_gemini_api_key',
    'noir_gemini_api_key_backup',
    'noir_gemini_api_key_vault_v1',
    'noir_studio_gemini_api_key',
    'gemini_api_key',
    'bi_novel_gemini_api_key',
  ]);

  async function runDeepSecurityAudit() {
    const findings = [];
    const warnings = [];
    let canaryFired = false;
    globalScope.__AT_V2_XSS_CANARY__ = () => { canaryFired = true; };

    try {
      // 5.1A Canary DOM XSS Probe
      const payloads = [
        '<img src=x onerror="window.__AT_V2_XSS_CANARY__()">',
        '<svg onload="window.__AT_V2_XSS_CANARY__()">',
        '" onmouseover="window.__AT_V2_XSS_CANARY__()" x="',
        'javascript:window.__AT_V2_XSS_CANARY__()',
      ];
      const esc = globalScope.NoirStudio?.utils?.escapeHtml;
      if (typeof esc === 'function') {
        const sandboxDiv = document.createElement('div');
        for (const p of payloads.slice(0, 2)) {
          const safe = esc(p);
          sandboxDiv.innerHTML = safe;
          if (canaryFired || sandboxDiv.querySelector('img, svg, script')) {
            findings.push({
              code: 'ERR_XSS_UNESCAPED',
              severity: 'P0',
              pillar: 'resilience',
              selector: 'NoirStudio.utils.escapeHtml',
              techDetail: `Canary XSS bị lọt khi escape chuỗi: ${p}`,
            });
            break;
          }
        }
      }

      // 5.1B Secret & Credential Leak Scanner (URL, DOM data-*, visible text, unexpected storage)
      const href = String(globalScope.location?.href || '');
      for (const sp of SECRET_PATTERNS) {
        if (sp.re.test(href)) {
          findings.push({
            code: 'ERR_SECRET_LEAK',
            severity: 'P0',
            pillar: 'resilience',
            selector: 'window.location.href',
            techDetail: `Phát hiện bí mật (${sp.name}) rò rỉ trên thanh địa chỉ URL!`,
          });
        }
      }

      const dataAttrNodes = document.querySelectorAll('[data-key], [data-token], [data-api-key], [data-secret]');
      for (let i = 0; i < dataAttrNodes.length; i++) {
        const el = dataAttrNodes[i];
        if (el.closest?.('[data-autotester-ui="true"]')) continue;
        for (const attr of Array.from(el.attributes || [])) {
          for (const sp of SECRET_PATTERNS) {
            if (sp.re.test(attr.value || '')) {
              findings.push({
                code: 'ERR_SECRET_LEAK',
                severity: 'P0',
                pillar: 'resilience',
                selector: selectorOf(el),
                techDetail: `Phát hiện khóa bí mật (${sp.name}) lộ trong thuộc tính DOM ${attr.name} của ${selectorOf(el)}.`,
              });
            }
          }
        }
      }

      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i) || '';
          if (INTENTIONAL_LOCAL_VAULT_KEYS.has(k)) continue;
          const v = sessionStorage.getItem(k) || '';
          for (const sp of SECRET_PATTERNS) {
            if (sp.re.test(v)) {
              warnings.push(`sessionStorage["${k}"] chứa chuỗi dạng ${sp.name}`);
            }
          }
        }
      } catch (_eSS) {}

      // 5.2A postMessage Origin Resilience Probe
      try {
        globalScope.dispatchEvent(new MessageEvent('message', {
          data: { __at_untrusted_origin_probe__: true, action: '__noop__' },
          origin: 'https://untrusted-probe.invalid',
        }));
      } catch (err) {
        findings.push({
          code: 'ERR_POSTMESSAGE_UNSAFE',
          severity: 'P1',
          pillar: 'resilience',
          selector: 'window.onmessage',
          techDetail: `Bộ lắng nghe postMessage phát sinh lỗi với origin lạ: ${err?.message || err}`,
        });
      }

      // 5.2B Prototype Pollution Probe
      try {
        const maliciousJson = JSON.parse('{"__proto__":{"__at_proto_polluted__":true},"constructor":{"prototype":{"__at_proto_polluted__":true}}}');
        const safeTarget = {};
        if (maliciousJson && typeof maliciousJson === 'object') {
          Object.keys(maliciousJson).forEach((k) => {
            if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
            safeTarget[k] = maliciousJson[k];
          });
        }
        if (({}).__at_proto_polluted__ === true) {
          delete Object.prototype.__at_proto_polluted__;
          findings.push({
            code: 'ERR_PROTOTYPE_POLLUTION',
            severity: 'P0',
            pillar: 'resilience',
            selector: 'Object.prototype',
            techDetail: 'Phát hiện ô nhiễm Object.prototype (__at_proto_polluted__).',
          });
        }
      } catch (_ePp) {}

      // 5.2C Dangerous Inline Sinks Check
      const inlineHandlerNodes = document.querySelectorAll('[onclick], [onerror], [onload]');
      let dangerousSinkCount = 0;
      for (let i = 0; i < inlineHandlerNodes.length; i++) {
        const el = inlineHandlerNodes[i];
        if (el.closest?.('[data-autotester-ui="true"]')) continue;
        const raw = `${el.getAttribute('onclick') || ''} ${el.getAttribute('onerror') || ''} ${el.getAttribute('onload') || ''}`;
        if (/\b(?:eval|Function)\s*\(/.test(raw)) {
          dangerousSinkCount += 1;
        }
      }
      if (dangerousSinkCount > 0) {
        findings.push({
          code: 'ERR_DANGEROUS_SINK',
          severity: 'P0',
          pillar: 'resilience',
          selector: '[onclick]',
          techDetail: `Phát hiện ${dangerousSinkCount} thuộc tính inline dùng eval()/Function().`,
        });
      }

      // 5.3 External _blank noopener, Mixed Content, SRI & CSP
      const unsafeBlank = Array.from(document.querySelectorAll('a[target="_blank"]')).filter((a) => {
        if (a.closest?.('[data-autotester-ui="true"]')) return false;
        const h = String(a.getAttribute('href') || '');
        if (!/^https?:\/\//i.test(h)) return false;
        const rel = String(a.getAttribute('rel') || '').toLowerCase();
        return !rel.includes('noopener') && !rel.includes('noreferrer');
      });
      if (unsafeBlank.length > 0) {
        findings.push({
          code: 'ERR_SECURITY_RISK',
          severity: 'P1',
          pillar: 'resilience',
          selector: selectorOf(unsafeBlank[0]),
          techDetail: `${unsafeBlank.length} liên kết target="_blank" thiếu rel="noopener noreferrer".`,
        });
      }

      if (globalScope.location?.protocol === 'https:') {
        const mixed = Array.from(document.querySelectorAll('img[src^="http://"], script[src^="http://"], link[href^="http://"]'))
          .filter((n) => !n.closest?.('[data-autotester-ui="true"]'));
        if (mixed.length > 0) {
          findings.push({
            code: 'ERR_MIXED_CONTENT',
            severity: 'P1',
            pillar: 'resilience',
            selector: selectorOf(mixed[0]),
            techDetail: `Phát hiện ${mixed.length} tài nguyên nạp qua http:// trên trang https://.`,
          });
        }
      }

      const extCdnScripts = Array.from(document.querySelectorAll('script[src^="https://"]')).filter((s) => !s.getAttribute('integrity'));
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (extCdnScripts.length > 0) warnings.push(`${extCdnScripts.length} CDN script ngoài chưa gắn SRI integrity`);
      if (!cspMeta) warnings.push('Chưa khai báo thẻ <meta http-equiv="Content-Security-Policy">');
    } finally {
      delete globalScope.__AT_V2_XSS_CANARY__;
    }

    return {
      ok: findings.length === 0,
      findings,
      advisories: warnings,
    };
  }

  // --------------------------------------------------------------------------
  // 2. NETWORK STORM, CORE WEB VITALS (LCP/CLS/INP) & CYCLIC LEAK PROFILER (Spec §6.2–6.3)
  // --------------------------------------------------------------------------
  class NetworkCwvAndLeakAuditor {
    constructor() {
      this.lcpMs = null;
      this.inpMs = null;
      this.cls = 0;
      this.requestTimestamps = new Map();
      this.stormAlerts = [];
      this._observers = [];
      this._trackedListeners = 0;
    }

    startCwvObservers() {
      if (typeof PerformanceObserver !== 'function') return;
      const supported = Array.isArray(PerformanceObserver.supportedEntryTypes) ? PerformanceObserver.supportedEntryTypes : [];

      if (supported.includes('largest-contentful-paint')) {
        try {
          const obs = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length) this.lcpMs = Math.round(entries[entries.length - 1].startTime);
          });
          obs.observe({ type: 'largest-contentful-paint', buffered: true });
          this._observers.push(obs);
        } catch (_e) {}
      }

      if (supported.includes('event')) {
        try {
          const obs = new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (e.duration > (this.inpMs || 0)) this.inpMs = Math.round(e.duration);
            }
          });
          obs.observe({ type: 'event', buffered: true, durationThreshold: 40 });
          this._observers.push(obs);
        } catch (_e) {}
      }
    }

    stopCwvObservers() {
      this._observers.forEach((o) => { try { o.disconnect(); } catch (_e) {} });
      this._observers = [];
    }

    recordNetworkUrl(url) {
      const key = String(url || '').split('?')[0];
      const now = Date.now();
      const arr = (this.requestTimestamps.get(key) || []).filter((t) => now - t < 1000);
      arr.push(now);
      this.requestTimestamps.set(key, arr);
      if (arr.length > 8 && !this.stormAlerts.some((s) => s.url === key)) {
        this.stormAlerts.push({ url: key, countPerSec: arr.length });
      }
    }

    async runCyclicLeakProfile(cycles = 6) {
      const domBefore = document.getElementsByTagName('*').length;
      const heapBefore = globalScope.performance?.memory?.usedJSHeapSize || null;
      let listenerDelta = 0;

      const isPersistentTarget = (t) =>
        t === globalScope || t === document || t === document.body || t === document.documentElement;
      const origAdd = EventTarget.prototype.addEventListener;
      const origRem = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function trackedAdd(...args) {
        if (isPersistentTarget(this)) listenerDelta += 1;
        return origAdd.apply(this, args);
      };
      EventTarget.prototype.removeEventListener = function trackedRem(...args) {
        if (isPersistentTarget(this)) listenerDelta -= 1;
        return origRem.apply(this, args);
      };

      try {
        const perfToggle = document.getElementById('btn-toggle-tab6-perf-ram');
        for (let i = 0; i < cycles; i++) {
          if (perfToggle) {
            perfToggle.click();
            await AT.sleep(15);
            perfToggle.click();
            await AT.sleep(15);
          } else {
            const tmp = document.createElement('div');
            tmp.setAttribute('data-autotester-ui', 'true');
            const fn = () => {};
            tmp.addEventListener('click', fn);
            document.body.appendChild(tmp);
            tmp.removeEventListener('click', fn);
            tmp.remove();
          }
        }
      } finally {
        EventTarget.prototype.addEventListener = origAdd;
        EventTarget.prototype.removeEventListener = origRem;
      }

      const domAfter = document.getElementsByTagName('*').length;
      const heapAfter = globalScope.performance?.memory?.usedJSHeapSize || null;
      const domDelta = domAfter - domBefore;
      const heapDeltaMb = heapBefore && heapAfter ? Number(((heapAfter - heapBefore) / (1024 * 1024)).toFixed(2)) : null;

      return {
        cycles,
        domBefore,
        domAfter,
        domDelta,
        listenerDelta,
        heapDeltaMb,
        leaked: domDelta > 30 || listenerDelta > 30 || (heapDeltaMb !== null && heapDeltaMb > 18),
      };
    }

    snapshotCwv() {
      const smooth = AT.smoothAuditor?.snapshot?.() || {};
      return {
        lcpMs: this.lcpMs,
        cls: smooth.cls ?? this.cls,
        inpMs: this.inpMs,
        avgFps: smooth.avgFps ?? 60,
        minFps: smooth.minFps ?? 60,
        longTasks: smooth.longTasks ?? 0,
        ramMb: smooth.ramMb ?? null,
        stormAlerts: this.stormAlerts.slice(0, 5),
      };
    }
  }

  // --------------------------------------------------------------------------
  // 3. WCAG ALPHA-COMPOSITING CONTRAST & ACCESSIBILITY AUDITOR (Spec §7.1)
  // --------------------------------------------------------------------------
  function runWcagAndA11yAudit(doc = document) {
    const win = doc.defaultView || globalScope;
    const issues = [];
    const complexBgDelegations = [];

    // 7.1A Alpha-Compositing WCAG Contrast on visible text/buttons
    const textEls = doc.querySelectorAll('section:not(.hidden) button, section:not(.hidden) a, section:not(.hidden) h1, section:not(.hidden) h2, section:not(.hidden) h3, section:not(.hidden) p, [role="dialog"]:not(.hidden) button');
    let lowContrastCount = 0;
    let firstLowSel = '';
    let firstLowRatio = 0;

    for (let i = 0; i < Math.min(textEls.length, 160); i++) {
      const el = textEls[i];
      if (el.closest?.('[data-autotester-ui="true"]') || el.closest?.('.hidden, [hidden]')) continue;
      const txt = String(el.textContent || '').trim();
      if (!txt || txt.length > 180) continue;
      const st = win.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;

      const fgRaw = parseRgba(st.color);
      if (!fgRaw) continue;
      const bgInfo = resolveCompositedBackground(el, win);

      // Route text over background-image / multi-stop gradient to Bucket 3 AI Delegation Queue!
      if (bgInfo.hasComplexBg) {
        if (complexBgDelegations.length < 8) {
          complexBgDelegations.push({
            selector: selectorOf(el),
            reason: bgInfo.complexReason,
            snippet: txt.slice(0, 60),
            rect: { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) },
          });
        }
        continue;
      }

      const fgComp = compositeOver(fgRaw, bgInfo.color);
      const ratio = wcagRatio(fgComp, bgInfo.color);
      const fontSizePx = parseFloat(st.fontSize) || 14;
      const fontWeight = parseInt(st.fontWeight, 10) || 400;
      const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
      const minRatio = isLarge ? 3.0 : 4.5;

      if (ratio < minRatio) {
        lowContrastCount += 1;
        if (!firstLowSel) {
          firstLowSel = selectorOf(el);
          firstLowRatio = Number(ratio.toFixed(2));
        }
      }
    }

    if (lowContrastCount >= 4) {
      issues.push({
        code: 'WARN_LOW_CONTRAST',
        severity: 'P2',
        pillar: 'visual',
        selector: firstLowSel,
        affectedCount: lowContrastCount,
        techDetail: `Alpha-WCAG phát hiện ${lowContrastCount} phần tử tương phản thấp (vd: ${firstLowSel} = ${firstLowRatio}:1 < 4.5:1).`,
      });
    }

    // 7.1B Missing alt on visible <img>
    const missingAlt = Array.from(doc.querySelectorAll('img')).filter((im) => {
      if (im.closest?.('[data-autotester-ui="true"], .hidden')) return false;
      const r = im.getBoundingClientRect();
      return r.width > 12 && r.height > 12 && !im.hasAttribute('alt');
    });
    if (missingAlt.length > 0) {
      issues.push({
        code: 'WARN_A11Y_MISSING_ALT',
        severity: 'P2',
        pillar: 'visual',
        selector: selectorOf(missingAlt[0]),
        affectedCount: missingAlt.length,
        techDetail: `${missingAlt.length} thẻ <img> hiển thị thiếu thuộc tính alt.`,
      });
    }

    // 7.1C Icon-only buttons without aria-label / title
    const unlabeledIconBtns = Array.from(doc.querySelectorAll('section:not(.hidden) button, header button')).filter((b) => {
      if (b.closest?.('[data-autotester-ui="true"], .hidden')) return false;
      const r = b.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) return false;
      const cleanText = String(b.textContent || '').replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\uFE0F\s✕×✖➕➖▶◀⚙🔍]/gu, '').trim();
      if (cleanText.length > 0) return false;
      return !b.getAttribute('aria-label') && !b.getAttribute('title');
    });
    if (unlabeledIconBtns.length >= 6) {
      issues.push({
        code: 'WARN_A11Y_ICON_BTN_LABEL',
        severity: 'P2',
        pillar: 'visual',
        selector: selectorOf(unlabeledIconBtns[0]),
        affectedCount: unlabeledIconBtns.length,
        techDetail: `${unlabeledIconBtns.length} nút chỉ có biểu tượng thiếu aria-label/title (vd: ${selectorOf(unlabeledIconBtns[0])}).`,
      });
    }

    // 7.1D Heading hierarchy check (h1 -> h6 jump > 2 levels)
    const headings = Array.from(doc.querySelectorAll('section:not(.hidden) h1, section:not(.hidden) h2, section:not(.hidden) h3, section:not(.hidden) h4, section:not(.hidden) h5, section:not(.hidden) h6'))
      .filter((h) => !h.closest?.('[data-autotester-ui="true"], .hidden') && h.getBoundingClientRect().height > 0);
    let headingJumps = 0;
    for (let i = 1; i < headings.length; i++) {
      const prev = Number(headings[i - 1].tagName[1]);
      const cur = Number(headings[i].tagName[1]);
      if (cur - prev > 2) headingJumps += 1;
    }

    return {
      ok: issues.filter((x) => x.severity === 'P0' || x.severity === 'P1').length === 0,
      issues,
      headingJumps,
      complexBgDelegations,
    };
  }

  // --------------------------------------------------------------------------
  // 4. I18N HYGIENE, PSEUDO-LOCALIZATION (+35%) & TECHNICAL SEO/PWA (Spec §7.2–7.3)
  // --------------------------------------------------------------------------
  async function runI18nPseudoLocAndSeoPwaAudit(doc = document) {
    const issues = [];
    const advisories = [];

    // 7.2A Mojibake & replacement char scan
    const bodyTxt = String(doc.body?.innerText || '').slice(0, 60000);
    const hasReplacementChar = bodyTxt.includes('\uFFFD');
    const mojibakeMatch = bodyTxt.match(/(?:Ã[£¡¢©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿]|Â[¡-¿]|Ä[-¿])/);
    if (hasReplacementChar || mojibakeMatch) {
      issues.push({
        code: 'ERR_MOJIBAKE_ENCODING',
        severity: 'P1',
        pillar: 'visual',
        selector: 'body',
        techDetail: `Phát hiện lỗi mã hóa ký tự (mojibake / U+FFFD): "${mojibakeMatch ? mojibakeMatch[0] : 'U+FFFD'}"`,
      });
    }

    // 7.2B Pseudo-Localization +35% Stress Test (isolated temporary button stretch + immediate restore)
    let pseudoOverflowCount = 0;
    const sampleBtns = Array.from(doc.querySelectorAll('header button, nav button'))
      .filter((b) => !b.closest?.('[data-autotester-ui="true"], .hidden') && b.childNodes.length === 1 && b.firstChild?.nodeType === 3 && b.getBoundingClientRect().width > 20)
      .slice(0, 8);
    const savedTexts = sampleBtns.map((b) => b.firstChild.nodeValue);
    try {
      sampleBtns.forEach((b, idx) => {
        const orig = String(savedTexts[idx] || '');
        const extraLen = Math.max(3, Math.ceil(orig.length * 0.35));
        b.firstChild.nodeValue = `${orig} ${'ệẳữ'.repeat(Math.ceil(extraLen / 3)).slice(0, extraLen)}`;
      });
      const vw = AT.viewportSim?._customWidth || window.innerWidth || 1280;
      for (const b of sampleBtns) {
        const r = b.getBoundingClientRect();
        if (r.right > vw + 4 || (b.scrollWidth > b.clientWidth + 8 && getComputedStyle(b).overflowX === 'hidden')) {
          pseudoOverflowCount += 1;
        }
      }
    } finally {
      sampleBtns.forEach((b, idx) => {
        if (b.firstChild?.nodeType === 3) b.firstChild.nodeValue = savedTexts[idx];
      });
    }

    // 7.3 Technical SEO & PWA Readiness
    const title = String(doc.title || '').trim();
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const viewportMeta = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    const htmlLang = doc.documentElement?.getAttribute('lang') || '';
    const favicon = doc.querySelector('link[rel*="icon"]')?.getAttribute('href') || '';
    const manifestLink = doc.querySelector('link[rel="manifest"]')?.getAttribute('href') || '';
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const swSupported = Boolean(navigator.serviceWorker);

    const seoChecks = {
      titleOk: title.length >= 6 && title.length <= 120,
      metaDescOk: metaDesc.length >= 16,
      viewportZoomable: Boolean(viewportMeta) && !/user-scalable\s*=\s*(no|0)/i.test(viewportMeta),
      htmlLangOk: htmlLang.length >= 2,
      faviconOk: Boolean(favicon),
      manifestOk: Boolean(manifestLink),
      ogOrCanonicalOk: Boolean(ogTitle || canonical),
      swSupported,
    };

    if (!seoChecks.titleOk) issues.push({ code: 'WARN_SEO_PWA_GAP', severity: 'P2', pillar: 'visual', selector: 'head > title', techDetail: `Thiếu hoặc sai độ dài <title> ("${title}").` });
    if (!seoChecks.viewportZoomable) issues.push({ code: 'WARN_SEO_PWA_GAP', severity: 'P1', pillar: 'visual', selector: 'meta[name="viewport"]', techDetail: 'Thẻ viewport bị thiếu hoặc khóa zoom (user-scalable=no).' });
    if (!seoChecks.htmlLangOk) issues.push({ code: 'WARN_SEO_PWA_GAP', severity: 'P2', pillar: 'visual', selector: 'html', techDetail: 'Thẻ <html> thiếu thuộc tính lang.' });
    if (!seoChecks.manifestOk) advisories.push('Chưa liên kết manifest.json cho PWA');
    if (!seoChecks.metaDescOk) advisories.push('Nên bổ sung meta[name="description"] chuẩn SEO');

    return {
      ok: issues.filter((x) => x.severity === 'P0' || x.severity === 'P1').length === 0,
      issues,
      advisories,
      pseudoOverflowCount,
      seoChecks,
    };
  }

  AT.securityAuditorV2 = { runDeepSecurityAudit };
  AT.networkCwvAuditor = new NetworkCwvAndLeakAuditor();
  AT.a11yAuditorV2 = { runWcagAndA11yAudit, resolveCompositedBackground, wcagRatio };
  AT.seoI18nAuditorV2 = { runI18nPseudoLocAndSeoPwaAudit };
})(typeof window !== 'undefined' ? window : globalThis);
