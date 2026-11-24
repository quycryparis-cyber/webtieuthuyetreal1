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
      if (!el || !el.isConnected) return { ok: false, reason: 'Element detached' };
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return { ok: false, reason: 'Kích thước bằng 0' };

      const cx = Math.min(window.innerWidth - 2, Math.max(2, rect.left + rect.width / 2));
      const cy = Math.min(window.innerHeight - 2, Math.max(2, rect.top + rect.height / 2));

      const atNodes = Array.from(document.querySelectorAll('[data-autotester-ui="true"]'));
      const savedVis = atNodes.map((n) => n.style.visibility);
      const savedPtr = atNodes.map((n) => n.style.pointerEvents);
      try {
        atNodes.forEach((n) => {
          n.style.visibility = 'hidden';
          n.style.pointerEvents = 'none';
        });
        const topEl = document.elementFromPoint(cx, cy);
        if (!topEl) return { ok: true, topEl: null };
        const isHit = el === topEl || el.contains(topEl) || topEl.contains(el);
        return {
          ok: isHit,
          blocker: isHit ? '' : topEl.id ? `#${topEl.id}` : `${topEl.tagName.toLowerCase()}.${String(topEl.className || '').split(/\s+/)[0] || ''}`,
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
  AT.virtualClock = new VirtualClockEngine();
  AT.geoMock = new GeolocationMockController();
  AT.clipboard = new ClipboardInterceptor();
  AT.causal = new CausalDeadButtonDetector();
  AT.driver = new SelfHealingDriver();
  AT.dsl = new KeywordDslInterpreter();
  AT.fixtures = FixtureFactory;
  AT.interceptors = new TestInterceptors();
  AT.recorder = new ZeroCodeRecorder();
})(typeof window !== 'undefined' ? window : globalThis);
