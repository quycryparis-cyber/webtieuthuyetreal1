/**
 * ============================================================================
 * 🛡️ AUTOTESTER v2.0 MODULE 1: STABILITY, SMART AUTO-WAIT & SANDBOX ROLLBACK
 * (autotester/modules/stabilityAndSandbox.js — Spec Parts 1.3 & 2)
 * ============================================================================
 * - SmartAutoWaitEngine: 5 actionability checks (connected, visible > 0,
 *   2-frame stable bounding rect, not disabled, unblocked center hit-test).
 * - DomNetworkSettleSensor: MutationObserver debounce + in-flight fetch/XHR
 *   counter + non-infinite CSS animation settle check.
 * - DeterministicRetryVerifier: 2-beat retry separating hard bugs vs flaky warnings.
 * - SnapshotRollbackSandbox: Full localStorage + sessionStorage RAM backup/restore
 *   and same-origin isolated iframe harness helper.
 * ============================================================================
 */
(function initAutoTesterStabilityModule(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});
  const REAL_SET_TIMEOUT = globalScope.setTimeout.bind(globalScope);
  const REAL_RAF = typeof globalScope.requestAnimationFrame === 'function'
    ? globalScope.requestAnimationFrame.bind(globalScope)
    : (cb) => REAL_SET_TIMEOUT(() => cb(Date.now()), 16);

  const nextFrame = () => new Promise((resolve) => REAL_RAF(resolve));

  function hideAutotesterUiTemp(doc) {
    const nodes = Array.from((doc || document).querySelectorAll('[data-autotester-ui="true"]'));
    const saved = nodes.map((n) => n.style.cssText);
    nodes.forEach((n) => {
      n.style.setProperty('display', 'none', 'important');
      n.style.setProperty('visibility', 'hidden', 'important');
      n.style.setProperty('pointer-events', 'none', 'important');
    });
    return () => {
      nodes.forEach((n, i) => { n.style.cssText = saved[i]; });
    };
  }

  // --------------------------------------------------------------------------
  // 1. SMART AUTO-WAITING ENGINE (5 Actionability Checks — Spec §2.1)
  // --------------------------------------------------------------------------
  class SmartAutoWaitEngine {
    async waitForActionable(elOrSelector, opts = {}) {
      const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 1800;
      const doc = opts.doc || document;
      const start = Date.now();
      let prevRect = null;
      let stableFrames = 0;
      let lastReason = 'not_found';

      while (Date.now() - start <= timeoutMs) {
        const el = typeof elOrSelector === 'string' ? doc.querySelector(elOrSelector) : elOrSelector;
        if (!el || !el.isConnected) {
          lastReason = 'detached';
          prevRect = null;
          stableFrames = 0;
          await nextFrame();
          continue;
        }

        const win = doc.defaultView || globalScope;
        const st = win.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Check 1 & 2: Connected + Visible + Size > 0
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0 || rect.width < 1 || rect.height < 1) {
          lastReason = 'hidden_or_zero_size';
          prevRect = null;
          stableFrames = 0;
          await nextFrame();
          continue;
        }

        // Check 3: Stable coordinates across >= 2 consecutive animation frames
        if (
          prevRect &&
          Math.abs(rect.left - prevRect.left) <= 0.5 &&
          Math.abs(rect.top - prevRect.top) <= 0.5 &&
          Math.abs(rect.width - prevRect.width) <= 0.5 &&
          Math.abs(rect.height - prevRect.height) <= 0.5
        ) {
          stableFrames += 1;
        } else {
          stableFrames = 1;
        }
        prevRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        if (stableFrames < 2) {
          lastReason = 'animating_position';
          await nextFrame();
          continue;
        }

        // Check 4: Not disabled
        if (el.disabled || el.getAttribute('aria-disabled') === 'true' || st.pointerEvents === 'none') {
          lastReason = 'disabled_or_no_pointer_events';
          await nextFrame();
          continue;
        }

        // Check 5: Center hit-test receives pointer events (unblocked)
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const vw = win.innerWidth || doc.documentElement.clientWidth || 1024;
        const vh = win.innerHeight || doc.documentElement.clientHeight || 768;
        if (cx >= 0 && cy >= 0 && cx <= vw && cy <= vh && typeof doc.elementFromPoint === 'function') {
          const restore = hideAutotesterUiTemp(doc);
          let hitOk = true;
          let blocker = '';
          try {
            const topEl = doc.elementFromPoint(cx, cy);
            if (topEl && topEl !== el && !el.contains(topEl) && !topEl.contains(el)) {
              hitOk = false;
              blocker = topEl.id ? `#${topEl.id}` : topEl.tagName.toLowerCase();
            }
          } finally {
            restore();
          }
          if (!hitOk) {
            lastReason = `occluded_by:${blocker}`;
            await nextFrame();
            continue;
          }
        }

        return { ok: true, el, elapsedMs: Date.now() - start, checksPassed: 5 };
      }

      return { ok: false, el: null, reason: lastReason, elapsedMs: Date.now() - start };
    }
  }

  // --------------------------------------------------------------------------
  // 2. DOM SETTLE & NETWORK IDLE SENSOR (Spec §2.2)
  // --------------------------------------------------------------------------
  class DomNetworkSettleSensor {
    constructor() {
      this.inFlightCount = 0;
      this._tracking = false;
      this._origFetch = null;
      this._origXhrSend = null;
    }

    startNetworkTracking() {
      if (this._tracking) return;
      this._tracking = true;
      this.inFlightCount = 0;
      const self = this;

      if (typeof globalScope.fetch === 'function') {
        const origFetch = globalScope.fetch.bind(globalScope);
        this._origFetch = origFetch;
        globalScope.fetch = function trackedSettleFetch(...args) {
          if (!self._tracking) return origFetch(...args);
          self.inFlightCount += 1;
          return origFetch(...args).finally(() => {
            self.inFlightCount = Math.max(0, self.inFlightCount - 1);
          });
        };
      }

      if (typeof XMLHttpRequest !== 'undefined' && XMLHttpRequest.prototype?.send) {
        const origSend = XMLHttpRequest.prototype.send;
        this._origXhrSend = origSend;
        XMLHttpRequest.prototype.send = function trackedSettleXhrSend(...args) {
          if (!self._tracking) return origSend.apply(this, args);
          self.inFlightCount += 1;
          const done = () => {
            self.inFlightCount = Math.max(0, self.inFlightCount - 1);
            this.removeEventListener('loadend', done);
          };
          this.addEventListener('loadend', done);
          return origSend.apply(this, args);
        };
      }
    }

    stopNetworkTracking() {
      if (!this._tracking) return;
      this._tracking = false;
      if (this._origFetch) globalScope.fetch = this._origFetch;
      if (this._origXhrSend && typeof XMLHttpRequest !== 'undefined') XMLHttpRequest.prototype.send = this._origXhrSend;
      this._origFetch = null;
      this._origXhrSend = null;
      this.inFlightCount = 0;
    }

    _hasFiniteRunningAnimations(doc) {
      try {
        if (typeof doc.getAnimations !== 'function') return false;
        const anims = doc.getAnimations();
        for (const a of anims) {
          if (a.playState !== 'running') continue;
          const timing = a.effect?.getTiming?.();
          if (timing && timing.iterations === Infinity) continue;
          const target = a.effect?.target;
          if (target?.closest?.('[data-autotester-ui="true"]')) continue;
          return true;
        }
      } catch (_e) {}
      return false;
    }

    async waitForSettled(opts = {}) {
      const debounceMs = Number(opts.debounceMs) > 0 ? Number(opts.debounceMs) : 250;
      const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 1600;
      const doc = opts.doc || document;
      const root = opts.root || doc.body;
      const start = Date.now();
      let lastMutationAt = Date.now();
      let mutationCount = 0;

      let obs = null;
      if (typeof MutationObserver === 'function' && root) {
        obs = new MutationObserver((muts) => {
          for (const m of muts) {
            if (m.target?.closest?.('[data-autotester-ui="true"]')) continue;
            mutationCount += 1;
            lastMutationAt = Date.now();
          }
        });
        try {
          obs.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
        } catch (_e) {}
      }

      try {
        while (Date.now() - start < timeoutMs) {
          const quietMs = Date.now() - lastMutationAt;
          const netIdle = this.inFlightCount === 0;
          const animDone = !this._hasFiniteRunningAnimations(doc);
          if (quietMs >= debounceMs && netIdle && animDone) {
            return { settled: true, elapsedMs: Date.now() - start, mutationCount, inFlightCount: this.inFlightCount };
          }
          await new Promise((r) => REAL_SET_TIMEOUT(r, 40));
        }
      } finally {
        try { obs?.disconnect?.(); } catch (_e) {}
      }

      return { settled: false, elapsedMs: Date.now() - start, mutationCount, inFlightCount: this.inFlightCount };
    }
  }

  // --------------------------------------------------------------------------
  // 3. DETERMINISTIC 2-BEAT VERIFICATION RETRY (Spec §2.3)
  // --------------------------------------------------------------------------
  class DeterministicRetryVerifier {
    constructor() {
      this.flakyWarnings = [];
      this.hardBugCount = 0;
    }

    reset() {
      this.flakyWarnings = [];
      this.hardBugCount = 0;
    }

    async verifyTest(testItem, ctx, resetFn) {
      const first = await testItem.run(ctx);
      if (!first || first.status === 'PASS') return first;

      // Retry beat 2 to separate deterministic hard bugs from transient flakiness
      if (typeof resetFn === 'function') {
        try { await resetFn(); } catch (_e) {}
      }
      await new Promise((r) => REAL_SET_TIMEOUT(r, 90));

      let second = null;
      try {
        second = await testItem.run(ctx);
      } catch (err) {
        second = {
          ...first,
          techDetail: `${first.techDetail || ''}\n[Retry-2 Error] ${err?.message || err}`.trim(),
        };
      }

      if (second && second.status === 'PASS') {
        const flakyEntry = {
          id: testItem.id,
          code: first.code || 'WARN_FLAKY_TIMING',
          selector: first.selector || '',
          firstDetail: String(first.techDetail || first.plainDesc || '').slice(0, 220),
          diagnosis: 'Pass ở nhịp xác minh #2 — nghi ngờ dao động trễ thời gian/nhịp vẽ (Flaky Warning).',
        };
        this.flakyWarnings.push(flakyEntry);
        return {
          ...second,
          flakyWarning: true,
          flakyDetail: flakyEntry,
          plainDesc: `${second.plainDesc || ''} [Cảnh báo độ ổn định: nhịp #1 lỗi (${first.code || 'timing'}), nhịp #2 đạt chuẩn]`.trim(),
        };
      }

      this.hardBugCount += 1;
      const confirmed = second || first;
      return {
        ...confirmed,
        confirmedHardBug: true,
        verificationBeats: 2,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 4. FULL SNAPSHOT & ROLLBACK SANDBOX + ISOLATED IFRAME HARNESS (Spec §1.3)
  // --------------------------------------------------------------------------
  class SnapshotRollbackSandbox {
    constructor() {
      this._snapLocal = null;
      this._snapSession = null;
      this._active = false;
    }

    captureAll() {
      if (this._active) return;
      this._active = true;
      this._snapLocal = new Map();
      this._snapSession = new Map();
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) this._snapLocal.set(k, localStorage.getItem(k));
        }
      } catch (_eL) {}
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k) this._snapSession.set(k, sessionStorage.getItem(k));
        }
      } catch (_eS) {}
    }

    restoreAll(preserveKeys = ['__autotester_history_v1__', '__autotester_layout_baseline_v1__', '__at_surface_registry_v2__']) {
      if (!this._active) return;
      this._active = false;
      const keep = new Set(preserveKeys);
      try {
        const curKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) curKeys.push(k);
        }
        curKeys.forEach((k) => {
          if (keep.has(k)) return;
          if (!this._snapLocal.has(k)) localStorage.removeItem(k);
        });
        this._snapLocal.forEach((val, k) => {
          if (keep.has(k)) return;
          if (localStorage.getItem(k) !== val) localStorage.setItem(k, val);
        });
      } catch (_eL) {}
      try {
        sessionStorage.clear();
        this._snapSession.forEach((val, k) => {
          sessionStorage.setItem(k, val);
        });
      } catch (_eS) {}
      this._snapLocal = null;
      this._snapSession = null;
    }

    async withIsolatedIframe(width, height, callback, opts = {}) {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('data-autotester-ui', 'true');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = [
        'position:fixed',
        'left:-12000px',
        'top:0',
        `width:${Math.max(320, Number(width) || 375)}px`,
        `height:${Math.max(480, Number(height) || 812)}px`,
        'border:0',
        'visibility:hidden',
        'pointer-events:none',
      ].join(';');

      document.body.appendChild(iframe);
      try {
        if (opts.url) {
          await new Promise((resolve) => {
            const timer = REAL_SET_TIMEOUT(resolve, Number(opts.loadTimeoutMs) || 3000);
            iframe.onload = () => { clearTimeout(timer); resolve(); };
            iframe.onerror = () => { clearTimeout(timer); resolve(); };
            iframe.src = opts.url;
          });
        } else if (opts.html) {
          const d = iframe.contentDocument;
          if (d) {
            d.open();
            d.write(opts.html);
            d.close();
          }
          await nextFrame();
        }
        return await callback(iframe, iframe.contentDocument, iframe.contentWindow);
      } finally {
        try { iframe.remove(); } catch (_e) {}
      }
    }
  }

  AT.autoWait = new SmartAutoWaitEngine();
  AT.settleSensor = new DomNetworkSettleSensor();
  AT.retryVerifier = new DeterministicRetryVerifier();
  AT.fullSandbox = new SnapshotRollbackSandbox();
  AT.hideAutotesterUiTemp = hideAutotesterUiTemp;
})(typeof window !== 'undefined' ? window : globalThis);
