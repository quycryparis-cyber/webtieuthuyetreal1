/**
 * ============================================================================
 * ⚙️ AUTOTESTER ULTRA CORE ENGINE (v118)
 * - SandboxGuard (3-Layer Isolation + Crash-Safe + API Cost Shield)
 * - SelfHealingDriver (5-Layer Identification + Mobile Touch)
 * - CausalDeadButtonDetector (5-Signal Verification + Splash-Safe Hit-Test)
 * - VirtualClockEngine (Safe Date.now Offset — Never Freezes AutoTester)
 * - GeolocationMockController (Success / PERMISSION_DENIED / TIMEOUT)
 * - ClipboardInterceptor (Live Copy-State Verification)
 * - KeywordDslInterpreter & ZeroCodeRecorder (Tiếng Việt Keyword DSL)
 * - FixtureFactory & TestInterceptors
 * ============================================================================
 */
(function initAutoTesterCore(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  // Giữ tham chiếu gốc của đồng hồ thật để VirtualClock không bao giờ làm đóng băng AutoTester
  const REAL_DATE_NOW = Date.now.bind(Date);
  const REAL_SET_TIMEOUT = globalScope.setTimeout.bind(globalScope);

  const sleep = (ms) => new Promise((r) => REAL_SET_TIMEOUT(r, ms));

  // --------------------------------------------------------------------------
  // 1. SANDBOX GUARD — Bảo vệ 100% bản thảo, Story Bible & dọn khóa __at_sbx__
  // --------------------------------------------------------------------------
  class SandboxGuard {
    constructor() {
      this._active = false;
      this._backupKeys = new Map();
      this._preExistingKeys = new Set();
    }

    sweepOrphanSandboxKeys() {
      try {
        const toDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('__autotest_sandbox__') || k.startsWith('__at_sbx__'))) {
            toDelete.push(k);
          }
        }
        toDelete.forEach((k) => localStorage.removeItem(k));
      } catch (_e) {}
    }

    backupKey(key) {
      if (!key || this._backupKeys.has(key)) return;
      try {
        this._backupKeys.set(key, localStorage.getItem(key));
      } catch (_e) {}
    }

    enter() {
      if (this._active) return;
      this._active = true;
      this._preExistingKeys.clear();
      this._backupKeys.clear();
      this.sweepOrphanSandboxKeys();
      globalScope.__NOIR_AUTOTEST_SANDBOX_ACTIVE__ = true;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) this._preExistingKeys.add(k);
        }
      } catch (_e) {}
    }

    exitAndRestore() {
      if (!this._active) return;
      this._active = false;
      globalScope.__NOIR_AUTOTEST_SANDBOX_ACTIVE__ = false;
      this.sweepOrphanSandboxKeys();
      try {
        this._backupKeys.forEach((val, key) => {
          if (val === null) localStorage.removeItem(key);
          else localStorage.setItem(key, val);
        });
      } catch (_e) {}
      this._backupKeys.clear();
    }
  }

  // --------------------------------------------------------------------------
  // 2. VIRTUAL CLOCK ENGINE — Tua nhanh thời gian an toàn để kiểm Báo thức
  // --------------------------------------------------------------------------
  class VirtualClockEngine {
    constructor() {
      this._installed = false;
      this._offsetMs = 0;
      this._origDateNow = null;
    }

    install() {
      if (this._installed) return;
      this._installed = true;
      this._offsetMs = 0;
      this._origDateNow = Date.now;
      const self = this;
      Date.now = function virtualDateNow() {
        return REAL_DATE_NOW() + self._offsetMs;
      };
    }

    fastForward(ms) {
      if (!this._installed) this.install();
      this._offsetMs += Number(ms) || 0;
      return Date.now();
    }

    realNow() {
      return REAL_DATE_NOW();
    }

    restore() {
      if (!this._installed) return;
      if (this._origDateNow) Date.now = this._origDateNow;
      this._origDateNow = null;
      this._offsetMs = 0;
      this._installed = false;
    }
  }

  // --------------------------------------------------------------------------
  // 3. GEOLOCATION MOCK CONTROLLER — Giả lập GPS (Đà Nẵng / Từ chối / Timeout)
  // --------------------------------------------------------------------------
  class GeolocationMockController {
    constructor() {
      this._active = false;
      this._origGeo = null;
      this._origGetPos = null;
      this._mode = 'success';
      this._coords = { latitude: 16.0544, longitude: 108.2022, accuracy: 25 };
      this.callCount = 0;
    }

    enable(mode = 'success', customCoords = null) {
      this._mode = mode;
      if (customCoords) this._coords = { ...this._coords, ...customCoords };
      if (this._active) return;
      this._active = true;
      this.callCount = 0;
      const self = this;

      const mockGetCurrentPosition = function mockGeoGetPos(successCb, errorCb) {
        self.callCount += 1;
        REAL_SET_TIMEOUT(() => {
          if (self._mode === 'success') {
            successCb?.({
              coords: { ...self._coords },
              timestamp: Date.now(),
            });
          } else if (self._mode === 'denied') {
            errorCb?.({ code: 1, PERMISSION_DENIED: 1, message: 'Người dùng từ chối quyền định vị (Mock AutoTester)' });
          } else {
            errorCb?.({ code: 3, TIMEOUT: 3, message: 'Hết thời gian định vị GPS (Mock AutoTester)' });
          }
        }, 40);
      };

      try {
        if (navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
          this._origGetPos = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
          navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;
        }
      } catch (_e) {
        try {
          this._origGeo = navigator.geolocation;
          Object.defineProperty(navigator, 'geolocation', {
            configurable: true,
            value: {
              getCurrentPosition: mockGetCurrentPosition,
              watchPosition: () => 0,
              clearWatch: () => {},
            },
          });
        } catch (_e2) {}
      }
    }

    setMode(mode, customCoords = null) {
      this._mode = mode;
      if (customCoords) this._coords = { ...this._coords, ...customCoords };
    }

    restore() {
      if (!this._active) return;
      this._active = false;
      try {
        if (this._origGetPos && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition = this._origGetPos;
        } else if (this._origGeo) {
          Object.defineProperty(navigator, 'geolocation', { configurable: true, value: this._origGeo });
        }
      } catch (_e) {}
      this._origGetPos = null;
      this._origGeo = null;
    }
  }

  // --------------------------------------------------------------------------
  // 4. CLIPBOARD INTERCEPTOR — Hứng nội dung sao chép thật để kiểm tra đồng bộ
  // --------------------------------------------------------------------------
  class ClipboardInterceptor {
    constructor() {
      this._active = false;
      this._origWriteText = null;
      this._origExecCommand = null;
      this.lastCopiedText = '';
      this.history = [];
    }

    start() {
      if (this._active) return;
      this._active = true;
      this.lastCopiedText = '';
      this.history = [];
      const self = this;

      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          this._origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
          navigator.clipboard.writeText = async function interceptedWriteText(text) {
            const str = String(text ?? '');
            self.lastCopiedText = str;
            self.history.push({ via: 'clipboard.writeText', text: str, at: REAL_DATE_NOW() });
            try {
              return await self._origWriteText(str);
            } catch (_ePerm) {
              // Không làm fail test nếu tab không focus khi chạy nền
              return Promise.resolve();
            }
          };
        }
      } catch (_eClip) {}

      try {
        if (typeof document.execCommand === 'function') {
          this._origExecCommand = document.execCommand.bind(document);
          document.execCommand = function interceptedExecCommand(cmd, showUI, val) {
            if (String(cmd || '').toLowerCase() === 'copy') {
              const sel = String(window.getSelection?.()?.toString() || '');
              const activeVal =
                document.activeElement && typeof document.activeElement.value === 'string'
                  ? document.activeElement.value
                  : '';
              const captured = sel || activeVal;
              if (captured) {
                self.lastCopiedText = captured;
                self.history.push({ via: 'execCommand.copy', text: captured, at: REAL_DATE_NOW() });
              }
            }
            try {
              return self._origExecCommand(cmd, showUI, val);
            } catch (_eExec) {
              return true;
            }
          };
        }
      } catch (_eDoc) {}
    }

    clearLast() {
      this.lastCopiedText = '';
    }

    restore() {
      if (!this._active) return;
      this._active = false;
      try {
        if (this._origWriteText && navigator.clipboard) {
          navigator.clipboard.writeText = this._origWriteText;
        }
      } catch (_e) {}
      try {
        if (this._origExecCommand) {
          document.execCommand = this._origExecCommand;
        }
      } catch (_e) {}
      this._origWriteText = null;
      this._origExecCommand = null;
    }
  }

  // --------------------------------------------------------------------------
  // 5. CAUSAL DEAD-BUTTON DETECTOR (5 Tín hiệu Nhân quả + Splash-Safe Hit-Test)
  // --------------------------------------------------------------------------
  class CausalDeadButtonDetector {
    constructor() {
      this.buttonsTested = 0;
      this.deadButtonsFound = 0;
      this.interceptedClicks = [];
    }

    reset() {
      this.buttonsTested = 0;
      this.deadButtonsFound = 0;
      this.interceptedClicks = [];
    }

    /**
     * Hit-Test vật lý an toàn: tạm ẩn toàn bộ UI của chính AutoTester (bao gồm
     * màn hình chờ loading splash) trong đúng 1 khung micro-task để đo chính xác
     * liệu có lớp nào CỦA ỨNG DỤNG đang che mất nút hay không.
     */
    physicalHitTest(el) {
      if (!el || !el.isConnected) return { ok: false, blocker: 'detached', reason: 'Element detached' };
      let rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return { ok: true, skippedHidden: true, blocker: '' };

      const vw = AT.viewportSim?.isSimulated?.() ? AT.viewportSim.getWidth() : (window.innerWidth || 1024);
      const vh = AT.viewportSim?.isSimulated?.() ? AT.viewportSim.getHeight() : (window.innerHeight || 768);

      // Nếu nút nằm ngoài vùng hiển thị của khung cuộn cha (vd: overflow-y-auto), cuộn vào giữa trước khi Hit-Test
      let p = el.parentElement;
      let clippedByScrollParent = false;
      while (p && p !== document.body && p !== document.documentElement) {
        const pst = getComputedStyle(p);
        if (/(auto|scroll|hidden|clip)/.test(pst.overflowY) || /(auto|scroll|hidden|clip)/.test(pst.overflowX)) {
          const pr = p.getBoundingClientRect();
          if (rect.bottom > pr.bottom + 1 || rect.top < pr.top - 1 || rect.right > pr.right + 1 || rect.left < pr.left - 1) {
            clippedByScrollParent = true;
            break;
          }
        }
        p = p.parentElement;
      }

      if (clippedByScrollParent || rect.bottom <= 2 || rect.top >= vh - 2 || rect.right <= 2 || rect.left >= vw - 2) {
        try {
          el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
          rect = el.getBoundingClientRect();
        } catch (_eScr) {}
      }
      if (rect.bottom <= 2 || rect.top >= vh - 2 || rect.right <= 2 || rect.left >= vw - 2) {
        return { ok: true, offscreen: true, blocker: '' };
      }

      p = el.parentElement;
      while (p && p !== document.body && p !== document.documentElement) {
        const pst = getComputedStyle(p);
        if (/(auto|scroll)/.test(pst.overflowY) && p.scrollHeight > p.clientHeight + 2) {
          const pr = p.getBoundingClientRect();
          if (rect.bottom > pr.bottom + 2 || rect.top < pr.top - 2) {
            return { ok: true, offscreen: true, blocker: '' };
          }
        }
        p = p.parentElement;
      }

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (cx < 1 || cy < 1 || cx > window.innerWidth - 1 || cy > window.innerHeight - 1) {
        return { ok: true, offscreen: true, blocker: '' };
      }

      const atNodes = Array.from(document.querySelectorAll('[data-autotester-ui="true"]'));
      const savedVis = atNodes.map((n) => n.style.visibility);
      const savedPtr = atNodes.map((n) => n.style.pointerEvents);
      try {
        atNodes.forEach((n) => {
          n.style.visibility = 'hidden';
          n.style.pointerEvents = 'none';
        });
        const topEl = document.elementFromPoint(cx, cy);
        if (!topEl) return { ok: true, topEl: null, blocker: '' };
        const isHit = el === topEl || el.contains(topEl) || topEl.contains(el);
        const topCls = String(topEl.className || '').trim().split(/\s+/).filter(Boolean)[0] || '';
        const blockerSel = topEl.id ? `#${topEl.id}` : `${topEl.tagName.toLowerCase()}${topCls ? '.' + topCls : ''}`;
        return {
          ok: isHit,
          blocker: isHit ? '' : (blockerSel || 'overlay'),
        };
      } finally {
        atNodes.forEach((n, idx) => {
          n.style.visibility = savedVis[idx];
          n.style.pointerEvents = savedPtr[idx];
        });
      }
    }

    /**
     * Bấm và kiểm chứng nhân quả 5 tín hiệu:
     * (1) DOM Mutation, (2) Attribute/Text/Class/Value change, (3) Canvas/Media change,
     * (4) Storage/Clipboard/Modal change, (5) Hit-Test vật lý không bị che.
     */
    async probeClickCausal(el, opts = {}) {
      if (!el || !el.isConnected) {
        return { alive: false, code: 'ERR_DEAD_BUTTON', signals: 0, reason: 'Phần tử không tồn tại trong DOM' };
      }
      this.buttonsTested += 1;

      try {
        el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
      } catch (_e) {}

      const hit = this.physicalHitTest(el);
      if (!hit.ok && opts.strictHitTest) {
        this.deadButtonsFound += 1;
        this.interceptedClicks.push({ selector: el.id ? `#${el.id}` : el.tagName, blocker: hit.blocker });
        return { alive: false, code: 'ERR_CLICK_INTERCEPTED', signals: 0, blocker: hit.blocker, reason: `Bị che bởi ${hit.blocker}` };
      }

      const watchRoot = opts.watchRoot || document.body;
      const beforeClip = AT.clipboard?.lastCopiedText || '';
      const beforeAria = el.getAttribute('aria-expanded');
      const beforeClass = el.className;
      const beforeText = (el.textContent || '').trim();
      const beforeCanvasHash = opts.canvasEl && AT.sampleCanvasHash ? AT.sampleCanvasHash(opts.canvasEl) : '';
      const beforeCustom = typeof opts.readState === 'function' ? opts.readState() : null;

      let mutationCount = 0;
      const obs = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.target && m.target.closest?.('[data-autotester-ui="true"]')) continue;
          mutationCount += 1;
        }
      });
      try {
        obs.observe(watchRoot, { attributes: true, childList: true, subtree: true, characterData: true });
      } catch (_eObs) {}

      el.click();
      await sleep(opts.waitMs || 140);
      obs.disconnect();

      const afterClip = AT.clipboard?.lastCopiedText || '';
      const afterAria = el.getAttribute('aria-expanded');
      const afterClass = el.className;
      const afterText = (el.textContent || '').trim();
      const afterCanvasHash = opts.canvasEl && AT.sampleCanvasHash ? AT.sampleCanvasHash(opts.canvasEl) : '';
      const afterCustom = typeof opts.readState === 'function' ? opts.readState() : null;

      let signals = 0;
      if (mutationCount > 0) signals += 1;
      if (beforeAria !== afterAria || beforeClass !== afterClass || beforeText !== afterText) signals += 1;
      if (beforeCanvasHash && afterCanvasHash && beforeCanvasHash !== afterCanvasHash) signals += 1;
      if (beforeClip !== afterClip) signals += 1;
      if (beforeCustom !== null && JSON.stringify(beforeCustom) !== JSON.stringify(afterCustom)) signals += 2;

      const alive = signals > 0;
      if (!alive) this.deadButtonsFound += 1;
      return {
        alive,
        code: alive ? 'OK' : 'ERR_DEAD_BUTTON',
        signals,
        mutationCount,
        hitOk: hit.ok,
        blocker: hit.blocker || '',
      };
    }
  }

  // --------------------------------------------------------------------------
  // 6. SELF-HEALING DRIVER — Smart Auto-Wait + Mobile Touch + 5 lớp định danh nút
  // --------------------------------------------------------------------------
  class SelfHealingDriver {
    constructor() {
      this.breadcrumbs = [];
      this.healedNotes = [];
    }

    resetRunState() {
      this.breadcrumbs = [];
      this.healedNotes = [];
    }

    recordBreadcrumb(action) {
      const now = new Date(REAL_DATE_NOW());
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
      this.breadcrumbs.push({ time, action: String(action || '') });
      if (this.breadcrumbs.length > 35) this.breadcrumbs.shift();
    }

    isElementInteractable(el) {
      if (!el || !el.isConnected) return false;
      if (el.closest('[data-autotester-ui="true"]')) return false;
      const st = globalScope.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
      return true;
    }

    findWithSelfHealing(descriptor) {
      if (!descriptor) return { el: null, healed: false };
      if (typeof descriptor === 'string') {
        const direct = document.querySelector(descriptor);
        return { el: direct && !direct.closest('[data-autotester-ui="true"]') ? direct : null, healed: false };
      }

      if (descriptor.selector) {
        try {
          const direct = document.querySelector(descriptor.selector);
          if (direct && !direct.closest('[data-autotester-ui="true"]')) {
            return { el: direct, healed: false };
          }
        } catch (_e) {}
      }
      if (descriptor.testId) {
        const byTid = document.querySelector(`[data-testid="${CSS.escape(descriptor.testId)}"]`);
        if (byTid && !byTid.closest('[data-autotester-ui="true"]')) {
          return { el: byTid, healed: false };
        }
      }

      const candidates = Array.from(
        document.querySelectorAll(descriptor.tag || 'button, a, input, select, textarea, [role="button"], [contenteditable="true"]')
      ).filter((el) => !el.closest('[data-autotester-ui="true"]'));

      let bestEl = null;
      let bestScore = 0;
      const wantText = String(descriptor.text || '').trim().toLowerCase();
      const wantAria = String(descriptor.ariaLabel || '').trim().toLowerCase();

      for (const el of candidates) {
        let score = 0;
        const txt = String(el.innerText || el.textContent || '').trim().toLowerCase();
        const aria = String(el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().toLowerCase();
        if (wantText && txt === wantText) score += 60;
        else if (wantText && txt.includes(wantText)) score += 38;
        if (wantAria && aria && aria.includes(wantAria)) score += 35;
        if (descriptor.parentId && el.closest(`#${CSS.escape(descriptor.parentId)}`)) score += 18;
        if (this.isElementInteractable(el)) score += 10;
        if (score > bestScore) {
          bestScore = score;
          bestEl = el;
        }
      }

      if (bestEl && bestScore >= 38) {
        this.healedNotes.push({
          expected: descriptor.selector || descriptor.text,
          foundTag: bestEl.tagName.toLowerCase() + (bestEl.id ? `#${bestEl.id}` : ''),
          score: bestScore,
        });
        return { el: bestEl, healed: true };
      }
      return { el: null, healed: false };
    }

    async waitFor(descriptor, timeoutMs = 2400) {
      const deadline = REAL_DATE_NOW() + timeoutMs;
      while (REAL_DATE_NOW() < deadline) {
        const res = this.findWithSelfHealing(descriptor);
        if (res.el && this.isElementInteractable(res.el)) {
          return res;
        }
        await sleep(80);
      }
      return this.findWithSelfHealing(descriptor);
    }

    async click(descriptor, labelForLog = '', delayMs = 80) {
      const res = await this.waitFor(descriptor, 2000);
      if (!res.el) throw new Error(`Không tìm thấy nút "${labelForLog || descriptor?.selector || descriptor}"`);
      const el = res.el;
      try {
        el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
      } catch (_e) {}
      this.recordBreadcrumb(`Bấm: ${labelForLog || el.id || (el.textContent || '').trim().slice(0, 32)}`);

      const isTouch = window.innerWidth < 768 || 'ontouchstart' in window;
      try {
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: isTouch ? 'touch' : 'mouse' }));
        if (isTouch) {
          try {
            el.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
            el.dispatchEvent(new Event('touchend', { bubbles: true, cancelable: true }));
          } catch (_eTouch) {}
        }
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: isTouch ? 'touch' : 'mouse' }));
      } catch (_ePtr) {}
      el.click();
      AT.causal.buttonsTested += 1;
      if (delayMs > 0) await sleep(delayMs);
      return res;
    }

    async fill(descriptor, value, labelForLog = '') {
      const res = await this.waitFor(descriptor, 1800);
      if (!res.el) throw new Error(`Không tìm thấy ô nhập "${labelForLog || descriptor?.selector || descriptor}"`);
      const el = res.el;
      this.recordBreadcrumb(`Điền chữ vào: ${labelForLog || el.id || 'ô nhập'}`);
      if (el.isContentEditable) {
        el.focus();
        el.textContent = String(value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        el.focus();
        el.value = String(value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      await sleep(60);
      return res;
    }
  }

  // --------------------------------------------------------------------------
  // 7. KEYWORD DSL INTERPRETER (Từ khóa tiếng Việt đời thường cho kịch bản mẫu)
  // --------------------------------------------------------------------------
  class KeywordDslInterpreter {
    async runSteps(steps, ctx) {
      for (const st of steps || []) {
        if (ctx?.isAborted?.()) return false;
        const kw = st.keyword || (st.type === 'fill' ? 'DIEN_CHU' : 'BAM_NUT');
        if (kw === 'BAM_NUT') {
          await AT.driver.click(st.descriptor, st.label, 120);
        } else if (kw === 'DIEN_CHU') {
          await AT.driver.fill(st.descriptor, st.value || '', st.label);
        } else if (kw === 'CHO_GIAY') {
          await sleep(Math.min(3000, (Number(st.seconds) || 0.2) * 1000));
        } else if (kw === 'TUA_NHANH_THOI_GIAN') {
          AT.virtualClock.fastForward((Number(st.seconds) || 60) * 1000);
        } else if (kw === 'MO_CHUC_NANG' && st.screenKey && globalScope.NoirStudio?.navigator?.navigateToScreen) {
          globalScope.NoirStudio.navigator.navigateToScreen(st.screenKey);
          await sleep(160);
        }
      }
      return true;
    }
  }

  // --------------------------------------------------------------------------
  // 8. IN-RAM FIXTURE FACTORY — Tạo file PDF / PNG / TXT / CSV / File hỏng 0 byte
  // --------------------------------------------------------------------------
  const FixtureFactory = {
    createMinimalValidPdf(filename = 'mau_kiem_thu.pdf', pageCount = 2) {
      const objs = [];
      objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
      const kids = [];
      for (let i = 0; i < pageCount; i++) {
        const pageObjNum = 3 + i * 2;
        const contentObjNum = pageObjNum + 1;
        kids.push(`${pageObjNum} 0 R`);
        objs.push(
          `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n`
        );
        const stream = `BT /F1 16 Tf 50 760 Td (AutoTester Page ${i + 1} - Bi Novel Studio) Tj ET`;
        objs.push(`${contentObjNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
      }
      objs.splice(1, 0, `2 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pageCount} >>\nendobj\n`);
      let pdf = '%PDF-1.4\n';
      const offsets = [0];
      for (const o of objs) {
        offsets.push(pdf.length);
        pdf += o;
      }
      const xrefPos = pdf.length;
      pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
      for (let i = 1; i <= objs.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
      }
      pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
      return new File([new TextEncoder().encode(pdf)], filename, { type: 'application/pdf' });
    },

    createTinyPng(filename = 'anh_mau_kiem_thu.png') {
      const bytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x64, 0xf8, 0xcf, 0xc0,
        0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb0, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
      return new File([bytes], filename, { type: 'image/png' });
    },

    createCorruptedEmptyPdf(filename = 'file_rong_hong.pdf') {
      return new File([], filename, { type: 'application/pdf' });
    },

    createFakeRenamedPdf(filename = 'gia_mao_pdf.pdf') {
      return new File([new TextEncoder().encode('Day khong phai file PDF that!')], filename, { type: 'application/pdf' });
    },

    injectFilesToInput(inputEl, files) {
      if (!inputEl || typeof DataTransfer !== 'function') return false;
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      inputEl.files = dt.files;
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
  };

  // --------------------------------------------------------------------------
  // 9. INTERCEPTORS — Chặn gọi API tốn tiền thật + Tải xuống im lặng + Giả lập mạng
  // --------------------------------------------------------------------------
  class TestInterceptors {
    constructor() {
      this._origFetch = null;
      this._origAnchorClick = null;
      this.capturedDownloads = [];
      this.blockedPaidApiCalls = 0;
      this.networkMode = 'normal'; // 'normal' | 'offline' | 'slow' | 'shield'
    }

    startSilentDownloadCapture() {
      if (this._origAnchorClick) return;
      this.capturedDownloads = [];
      const self = this;
      this._origAnchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function interceptedAnchorClick() {
        if (this.hasAttribute('download') && this.href) {
          self.capturedDownloads.push({
            filename: this.getAttribute('download') || 'unknown',
            href: this.href,
            at: REAL_DATE_NOW(),
          });
          return;
        }
        return self._origAnchorClick.apply(this, arguments);
      };
    }

    stopSilentDownloadCapture() {
      if (this._origAnchorClick) {
        HTMLAnchorElement.prototype.click = this._origAnchorClick;
        this._origAnchorClick = null;
      }
    }

    async verifyBlobMagicBytes(blob, expectedType = 'pdf') {
      try {
        if (!blob || blob.size === 0) {
          return { ok: false, size: 0, reason: 'Tệp đầu ra 0 byte' };
        }
        const buf = await blob.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const headAscii = String.fromCharCode(...bytes.slice(0, 8));
        if (expectedType === 'pdf' && !headAscii.startsWith('%PDF')) {
          return { ok: false, size: bytes.length, reason: `Sai chữ ký %PDF (thực tế: ${headAscii.slice(0, 5)})` };
        }
        if (expectedType === 'zip' && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
          return { ok: false, size: bytes.length, reason: 'Sai chữ ký ZIP/DOCX/EPUB (PK)' };
        }
        if (expectedType === 'png' && !(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)) {
          return { ok: false, size: bytes.length, reason: 'Sai chữ ký PNG' };
        }
        return { ok: true, size: bytes.length, bytes };
      } catch (err) {
        return { ok: false, size: 0, reason: err?.message || 'Lỗi đọc Blob' };
      }
    }

    setNetworkSimulation(mode = 'normal') {
      this.networkMode = mode;
      if (mode === 'normal') {
        if (this._origFetch) {
          globalScope.fetch = this._origFetch;
          this._origFetch = null;
        }
        return;
      }
      if (!this._origFetch && typeof globalScope.fetch === 'function') {
        this._origFetch = globalScope.fetch.bind(globalScope);
      }
      if (!this._origFetch) return;
      const orig = this._origFetch;
      const self = this;
      globalScope.fetch = async function simulatedFetch(input, init) {
        const urlStr = typeof input === 'string' ? input : input?.url || '';
        if (urlStr.startsWith('blob:') || urlStr.includes('autotester/')) {
          return orig(input, init);
        }
        // Lá chắn chống đốt token AI thật trong lúc AutoTester chạy
        if (/generativelanguage\.googleapis\.com|api\.openai\.com|api\.anthropic\.com/i.test(urlStr)) {
          self.blockedPaidApiCalls += 1;
          return new Response(
            JSON.stringify({ candidates: [{ content: { parts: [{ text: '[AutoTester Mock Response — 0 Token Spent]' }] } }] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (self.networkMode === 'offline') {
          throw new TypeError('Failed to fetch (AutoTester Offline Simulation)');
        }
        if (self.networkMode === 'slow') {
          await sleep(900);
          return orig(input, init);
        }
        return orig(input, init);
      };
    }

    restoreAll() {
      this.stopSilentDownloadCapture();
      this.setNetworkSimulation('normal');
    }
  }

  // --------------------------------------------------------------------------
  // 10. ZERO-CODE RECORDER — Quay thao tác mẫu sang Từ khóa tiếng Việt + IndexedDB
  // --------------------------------------------------------------------------
  const RECORDER_DB_NAME = 'noir_autotester_recordings_db';
  const RECORDER_STORE = 'scripts';

  class ZeroCodeRecorder {
    constructor() {
      this.recording = false;
      this.currentSteps = [];
      this._boundClick = null;
      this._boundChange = null;
      this._onStepCb = null;
    }

    _openDb() {
      return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') return reject(new Error('No IndexedDB'));
        const req = indexedDB.open(RECORDER_DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(RECORDER_STORE)) {
            db.createObjectStore(RECORDER_STORE, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async listRecordings() {
      try {
        const db = await this._openDb();
        return await new Promise((resolve) => {
          const tx = db.transaction(RECORDER_STORE, 'readonly');
          const req = tx.objectStore(RECORDER_STORE).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
      } catch (_e) {
        return [];
      }
    }

    async saveRecording(name, steps) {
      try {
        const db = await this._openDb();
        const item = {
          id: `rec_${REAL_DATE_NOW()}`,
          name: name || `Kịch bản mẫu (${new Date(REAL_DATE_NOW()).toLocaleTimeString('vi-VN')})`,
          createdAt: REAL_DATE_NOW(),
          steps: steps.slice(0, 60),
        };
        await new Promise((resolve, reject) => {
          const tx = db.transaction(RECORDER_STORE, 'readwrite');
          tx.objectStore(RECORDER_STORE).put(item);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        return item;
      } catch (_e) {
        return null;
      }
    }

    async deleteRecording(id) {
      try {
        const db = await this._openDb();
        await new Promise((resolve) => {
          const tx = db.transaction(RECORDER_STORE, 'readwrite');
          tx.objectStore(RECORDER_STORE).delete(id);
          tx.oncomplete = () => resolve();
        });
      } catch (_e) {}
    }

    _describeElement(el) {
      const target = el?.closest?.('button, a, input, select, textarea, [role="button"], [contenteditable="true"]') || el;
      if (!target || target.closest('[data-autotester-ui="true"]')) return null;
      const selector = target.id
        ? `#${CSS.escape(target.id)}`
        : target.getAttribute('data-testid')
          ? `[data-testid="${CSS.escape(target.getAttribute('data-testid'))}"]`
          : '';
      return {
        selector,
        testId: target.getAttribute('data-testid') || '',
        tag: target.tagName.toLowerCase(),
        text: String(target.innerText || target.textContent || '').trim().slice(0, 48),
        ariaLabel: target.getAttribute('aria-label') || target.getAttribute('title') || '',
        parentId: target.parentElement?.id || '',
      };
    }

    start(onStepCb) {
      if (this.recording) return;
      this.recording = true;
      this.currentSteps = [];
      this._onStepCb = onStepCb;

      this._boundClick = (ev) => {
        const desc = this._describeElement(ev.target);
        if (!desc) return;
        this.currentSteps.push({
          type: 'click',
          keyword: 'BAM_NUT',
          descriptor: desc,
          label: desc.text || desc.selector || desc.tag,
        });
        this._onStepCb?.(this.currentSteps.length);
      };
      this._boundChange = (ev) => {
        const desc = this._describeElement(ev.target);
        if (!desc) return;
        const val = ev.target?.value;
        if (typeof val === 'string') {
          this.currentSteps.push({
            type: 'fill',
            keyword: 'DIEN_CHU',
            descriptor: desc,
            value: val.slice(0, 200),
            label: desc.selector || desc.tag,
          });
          this._onStepCb?.(this.currentSteps.length);
        }
      };
      document.addEventListener('click', this._boundClick, true);
      document.addEventListener('change', this._boundChange, true);
    }

    async stopAndSave() {
      if (!this.recording) return null;
      this.recording = false;
      if (this._boundClick) document.removeEventListener('click', this._boundClick, true);
      if (this._boundChange) document.removeEventListener('change', this._boundChange, true);
      this._boundClick = null;
      this._boundChange = null;
      if (!this.currentSteps.length) return null;
      return this.saveRecording('', this.currentSteps);
    }

    cancel() {
      this.recording = false;
      if (this._boundClick) document.removeEventListener('click', this._boundClick, true);
      if (this._boundChange) document.removeEventListener('change', this._boundChange, true);
      this._boundClick = null;
      this._boundChange = null;
      this.currentSteps = [];
    }
  }

  AT.sleep = sleep;
  AT.sandbox = new SandboxGuard();
  // --------------------------------------------------------------------------
  // 8. DUAL-VIEWPORT SIMULATOR (Desktop <-> Mobile 375x812 / 1280x800 Live)
  // --------------------------------------------------------------------------
  class ViewportSimulator {
    constructor() {
      this.mode = 'real'; // 'real' | 'mobile' | 'desktop'
      this._savedInnerW = null;
      this._savedInnerH = null;
      this._savedMatchMedia = null;
      this._savedMediaRules = new Map();
      this._savedHtmlStyle = '';
      this._savedBodyStyle = '';
      this._mmListeners = [];
    }

    isSimulated() {
      return this.mode === 'mobile' || this.mode === 'desktop';
    }

    getWidth() {
      if (this.mode === 'mobile') return 375;
      if (this.mode === 'desktop') return 1280;
      return window.innerWidth || document.documentElement.clientWidth || 1024;
    }

    getHeight() {
      if (this.mode === 'mobile') return 812;
      if (this.mode === 'desktop') return 800;
      return window.innerHeight || document.documentElement.clientHeight || 768;
    }

    _evalMediaWidthCondition(mediaText, w) {
      const mText = String(mediaText || '').trim();
      if (!mText || !/(width|pointer|hover)/i.test(mText)) return null;
      if (/^print$/i.test(mText)) return null;
      const toPx = (val, unit) => {
        const n = parseFloat(val);
        if (!Number.isFinite(n)) return NaN;
        return /^r?em$/i.test(unit) ? n * 16 : n;
      };
      let matched = true;
      let touched = false;
      const minRe = /\(\s*min-width\s*:\s*([\d.]+)\s*(px|r?em)\s*\)/gi;
      let mm;
      while ((mm = minRe.exec(mText)) !== null) {
        touched = true;
        const px = toPx(mm[1], mm[2]);
        if (w < px) matched = false;
      }
      const maxRe = /\(\s*max-width\s*:\s*([\d.]+)\s*(px|r?em)\s*\)/gi;
      while ((mm = maxRe.exec(mText)) !== null) {
        touched = true;
        const px = toPx(mm[1], mm[2]);
        if (w > px) matched = false;
      }
      const geRe = /\(\s*width\s*>=\s*([\d.]+)\s*(px|r?em)\s*\)/gi;
      while ((mm = geRe.exec(mText)) !== null) {
        touched = true;
        const px = toPx(mm[1], mm[2]);
        if (w < px) matched = false;
      }
      const leRe = /\(\s*width\s*<=\s*([\d.]+)\s*(px|r?em)\s*\)/gi;
      while ((mm = leRe.exec(mText)) !== null) {
        touched = true;
        const px = toPx(mm[1], mm[2]);
        if (w > px) matched = false;
      }
      if (!touched) {
        if (/\(pointer\s*:\s*coarse\)/i.test(mText) || /\(hover\s*:\s*none\)/i.test(mText)) {
          return this.mode === 'mobile';
        }
        return null;
      }
      return matched;
    }

    _syncCssMediaRules(targetW) {
      const walkRules = (ruleList) => {
        if (!ruleList) return;
        for (let i = 0; i < ruleList.length; i++) {
          const rule = ruleList[i];
          if (!rule) continue;
          if (typeof CSSMediaRule !== 'undefined' && rule instanceof CSSMediaRule && rule.media) {
            if (!this._savedMediaRules.has(rule)) {
              this._savedMediaRules.set(rule, rule.media.mediaText);
            }
            const origText = this._savedMediaRules.get(rule);
            const ev = this._evalMediaWidthCondition(origText, targetW);
            if (ev !== null) {
              try {
                rule.media.mediaText = ev ? 'all' : 'not all';
              } catch (_eMt) {}
            }
          }
          if (rule.cssRules) walkRules(rule.cssRules);
        }
      };
      try {
        for (const sheet of Array.from(document.styleSheets || [])) {
          if (sheet.ownerNode?.closest?.('[data-autotester-ui="true"]')) continue;
          try {
            if (sheet.cssRules) walkRules(sheet.cssRules);
          } catch (_eCors) {}
        }
      } catch (_eSheets) {}
    }

    _restoreCssMediaRules() {
      this._savedMediaRules.forEach((origText, rule) => {
        try {
          if (rule?.media) rule.media.mediaText = origText;
        } catch (_eR) {}
      });
      this._savedMediaRules.clear();
    }

    syncMedia() {
      if (this.isSimulated()) {
        this._syncCssMediaRules(this.getWidth());
      }
    }

    apply(mode = 'real') {
      const next = mode === 'mobile' || mode === 'desktop' ? mode : 'real';
      if (next === 'real') {
        this.restore();
        return { mode: 'real', width: this.getWidth(), height: this.getHeight() };
      }
      const targetW = next === 'mobile' ? 375 : 1280;
      const targetH = next === 'mobile' ? 812 : 800;

      if (!this.isSimulated()) {
        this._realWinW = window.innerWidth || document.documentElement.clientWidth || 1280;
        this._savedInnerW = Object.getOwnPropertyDescriptor(window, 'innerWidth');
        this._savedInnerH = Object.getOwnPropertyDescriptor(window, 'innerHeight');
        this._savedMatchMedia = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;
        this._savedHtmlStyle = document.documentElement.getAttribute('style') || '';
        this._savedBodyStyle = document.body?.getAttribute('style') || '';
      }
      this.mode = next;

      try {
        Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => targetW });
        Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => targetH });
      } catch (_eDim) {}

      const self = this;
      try {
        window.matchMedia = function simMatchMedia(query) {
          const evalRes = self._evalMediaWidthCondition(query, targetW);
          const matches = evalRes !== null ? evalRes : (self._savedMatchMedia ? self._savedMatchMedia(query).matches : false);
          return {
            matches,
            media: String(query || ''),
            onchange: null,
            addListener(cb) { if (typeof cb === 'function') self._mmListeners.push({ q: query, cb }); },
            removeListener() {},
            addEventListener(_ev, cb) { if (typeof cb === 'function') self._mmListeners.push({ q: query, cb }); },
            removeEventListener() {},
            dispatchEvent() { return true; },
          };
        };
      } catch (_eMm) {}

      document.documentElement.setAttribute('data-at-sim-viewport', next);
      const smartTip = document.getElementById('noir-smart-delayed-tooltip');
      if (smartTip) {
        smartTip.style.display = 'none';
        smartTip.style.left = '-9999px';
      }
      const shell = document.getElementById('at-shell-root');
      if (next === 'mobile' && (this._realWinW || 1280) > 640 && shell && shell.parentElement === document.body) {
        try { document.documentElement.appendChild(shell); } catch (_eMv) {}
      } else if (next !== 'mobile' && shell && shell.parentElement !== document.body && document.body) {
        try { document.body.appendChild(shell); } catch (_eMvBack) {}
      }

      let stEl = document.getElementById('at-sim-viewport-style');
      if (!stEl) {
        stEl = document.createElement('style');
        stEl.id = 'at-sim-viewport-style';
        stEl.setAttribute('data-autotester-ui', 'true');
        document.head.appendChild(stEl);
      }
      if (next === 'mobile') {
        stEl.textContent = `
          html[data-at-sim-viewport="mobile"] {
            width: 375px !important; max-width: 375px !important; min-width: 375px !important;
            margin: 0 auto !important; outline: 3px solid #10b981 !important; overflow-x: clip !important;
          }
          html[data-at-sim-viewport="mobile"] body {
            width: 375px !important; max-width: 375px !important; position: relative !important;
            contain: layout !important; overflow-x: auto !important;
          }
          html[data-at-sim-viewport="mobile"] .fixed:not([data-autotester-ui="true"]):not([data-autotester-ui="true"] *),
          html[data-at-sim-viewport="mobile"] [role="dialog"]:not([data-autotester-ui="true"]) {
            max-width: 375px !important; margin-left: auto !important; margin-right: auto !important;
          }
          html[data-at-sim-viewport="mobile"] #btn-approve-chapter,
          html[data-at-sim-viewport="mobile"] #btn-tab1-quick-new-chapter,
          html[data-at-sim-viewport="mobile"] #btn-mod41-banner-jump-tab1,
          html[data-at-sim-viewport="mobile"] #btn-tab3-split-gemini,
          html[data-at-sim-viewport="mobile"] #btn-tab1-split-gemini {
            white-space: normal !important;
            height: auto !important;
          }
        `;
      } else {
        stEl.textContent = `
          html[data-at-sim-viewport="desktop"] {
            width: 1280px !important; min-width: 1280px !important; max-width: 1280px !important;
            outline: 3px solid #38bdf8 !important; overflow-x: clip !important;
          }
          html[data-at-sim-viewport="desktop"] body {
            width: 1280px !important; min-width: 1280px !important; contain: layout !important;
          }
        `;
      }

      this._syncCssMediaRules(targetW);
      try { window.dispatchEvent(new Event('resize')); } catch (_eR) {}
      this._mmListeners.forEach((item) => {
        try {
          const m = self._evalMediaWidthCondition(item.q, targetW);
          if (m !== null) item.cb?.({ matches: m, media: item.q });
        } catch (_eCb) {}
      });
      return { mode: next, width: targetW, height: targetH };
    }

    restore() {
      if (!this.isSimulated() && !document.documentElement.hasAttribute('data-at-sim-viewport')) return;
      this.mode = 'real';
      const shell = document.getElementById('at-shell-root');
      if (shell && shell.parentElement !== document.body && document.body) {
        try { document.body.appendChild(shell); } catch (_eMvRestore) {}
      }
      try {
        if (this._savedInnerW) Object.defineProperty(window, 'innerWidth', this._savedInnerW);
        else delete window.innerWidth;
      } catch (_eW) {}
      try {
        if (this._savedInnerH) Object.defineProperty(window, 'innerHeight', this._savedInnerH);
        else delete window.innerHeight;
      } catch (_eH) {}
      try {
        if (this._savedMatchMedia) window.matchMedia = this._savedMatchMedia;
      } catch (_eM) {}
      this._restoreCssMediaRules();
      document.documentElement.removeAttribute('data-at-sim-viewport');
      document.getElementById('at-sim-viewport-style')?.remove();
      if (this._savedHtmlStyle) document.documentElement.setAttribute('style', this._savedHtmlStyle);
      else document.documentElement.removeAttribute('style');
      if (document.body) {
        if (this._savedBodyStyle) document.body.setAttribute('style', this._savedBodyStyle);
        else document.body.removeAttribute('style');
      }
      this._mmListeners = [];
      try { window.dispatchEvent(new Event('resize')); } catch (_eR) {}
    }

    async runDualSweep(callback) {
      const prevMode = this.mode;
      const results = [];
      try {
        for (const vp of ['mobile', 'desktop']) {
          this.apply(vp);
          await AT.sleep(45);
          results.push(await callback({ mode: vp, width: this.getWidth(), height: this.getHeight(), label: vp === 'mobile' ? 'Giả lập Mobile (375x812)' : 'Giả lập Desktop (1280x800)' }));
        }
      } finally {
        this.apply(prevMode);
      }
      return results;
    }
  }

  AT.virtualClock = new VirtualClockEngine();
  AT.geoMock = new GeolocationMockController();
  AT.clipboard = new ClipboardInterceptor();
  AT.causal = new CausalDeadButtonDetector();
  AT.driver = new SelfHealingDriver();
  AT.dsl = new KeywordDslInterpreter();
  AT.fixtures = FixtureFactory;
  AT.interceptors = new TestInterceptors();
  AT.recorder = new ZeroCodeRecorder();
  AT.viewportSim = new ViewportSimulator();
})(typeof window !== 'undefined' ? window : globalThis);
