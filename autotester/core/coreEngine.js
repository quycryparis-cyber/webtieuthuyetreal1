/**
 * ============================================================================
 * ⚙️ AUTOTESTER CORE ENGINE
 * (SandboxGuard + SelfHealingDriver + ZeroCodeRecorder + FixtureFactory + Interceptors)
 * ============================================================================
 */
(function initAutoTesterCore(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // --------------------------------------------------------------------------
  // 1. SANDBOX GUARD — Bảo vệ 100% dữ liệu bản thảo, Story Bible & localStorage thật
  // --------------------------------------------------------------------------
  class SandboxGuard {
    constructor() {
      this._active = false;
      this._backupKeys = new Map();
      this._preExistingKeys = new Set();
    }

    enter() {
      if (this._active) return;
      this._active = true;
      this._preExistingKeys.clear();
      this._backupKeys.clear();
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
      try {
        // Xóa mọi khóa tạm sinh ra mang tiền tố __autotest_sandbox__
        const toDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('__autotest_sandbox__')) toDelete.push(k);
        }
        toDelete.forEach((k) => localStorage.removeItem(k));
        this._backupKeys.forEach((val, key) => {
          if (val === null) localStorage.removeItem(key);
          else localStorage.setItem(key, val);
        });
      } catch (_e) {}
      this._backupKeys.clear();
    }
  }

  // --------------------------------------------------------------------------
  // 2. SELF-HEALING DRIVER — Smart Auto-Wait + Mobile Touch + 5 lớp định danh nút
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
      const now = new Date();
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
      this.breadcrumbs.push({ time, action: String(action || '') });
      if (this.breadcrumbs.length > 30) this.breadcrumbs.shift();
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

    /**
     * 5 lớp nhận dạng tự chữa lành:
     * (1) ID, (2) data-testid, (3) text hiển thị, (4) aria-label/title, (5) vị trí thẻ cha
     */
    findWithSelfHealing(descriptor) {
      if (!descriptor) return { el: null, healed: false };
      if (typeof descriptor === 'string') {
        const direct = document.querySelector(descriptor);
        return { el: direct && !direct.closest('[data-autotester-ui="true"]') ? direct : null, healed: false };
      }

      // Lớp 1 & 2: Selector trực tiếp (ID / data-testid)
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

      // Lớp 3, 4, 5: Tính điểm tương đồng để tự chữa lành nếu nút đổi ID/class
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
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
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

      // Giả lập chuỗi chạm tự nhiên trên Mobile (pointerdown -> touchstart -> touchend -> click)
      const isTouch = window.innerWidth < 768 || 'ontouchstart' in window;
      try {
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: isTouch ? 'touch' : 'mouse' }));
        if (isTouch && typeof TouchEvent === 'function') {
          try {
            el.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
            el.dispatchEvent(new Event('touchend', { bubbles: true, cancelable: true }));
          } catch (_eTouch) {}
        }
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: isTouch ? 'touch' : 'mouse' }));
      } catch (_ePtr) {}
      el.click();
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
  // 3. IN-RAM FIXTURE FACTORY — Tạo file PDF / PNG / TXT / CSV / File hỏng 0 byte trong RAM
  // --------------------------------------------------------------------------
  const FixtureFactory = {
    createMinimalValidPdf(filename = 'mau_kiem_thu.pdf', pageCount = 2) {
      // Tạo nhị phân PDF 1.4 chuẩn có đủ số trang yêu cầu & chữ ký %PDF-1.4
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
        objs.push(
          `${contentObjNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
        );
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
      // 1x1 PNG hợp lệ có chữ ký Magic Bytes 89 50 4E 47
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

    createTxtFile(filename = 'chuong_mau_tieng_viet.txt') {
      const content = 'Chương 1: Đêm Mưa Phố Cổ\n\nÁnh đèn vàng hắt xuống mặt đường ướt lấp lánh.\n- Chúng ta bắt đầu kiểm thử thôi! (Bi)';
      return new File([new TextEncoder().encode(content)], filename, { type: 'text/plain;charset=utf-8' });
    },

    createCsvFile(filename = 'bang_mau.csv') {
      const content = '\uFEFFNhân vật,Vai trò,Ghi chú\nTrần Minh Khôi,Thám tử,Cổ tay có vết sẹo\nLệ Băng,Người giữ khóa,Bí ẩn';
      return new File([new TextEncoder().encode(content)], filename, { type: 'text/csv;charset=utf-8' });
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
  // 4. INTERCEPTORS — Hứng tải xuống im lặng kiểm tra Magic Bytes + Giả lập rớt mạng
  // --------------------------------------------------------------------------
  class TestInterceptors {
    constructor() {
      this._origFetch = null;
      this._origAnchorClick = null;
      this.capturedDownloads = [];
      this.networkMode = 'normal'; // 'normal' | 'offline' | 'slow'
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
            at: Date.now(),
          });
          return; // Chặn hộp thoại tải xuống thật khi đang test
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

    async verifyBlobUrlMagicBytes(url, expectedType) {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        if (bytes.length === 0) return { ok: false, size: 0, reason: 'Tệp đầu ra 0 byte' };
        const headAscii = String.fromCharCode(...bytes.slice(0, 8));
        if (expectedType === 'pdf' && !headAscii.startsWith('%PDF')) {
          return { ok: false, size: bytes.length, reason: 'Không đúng chữ ký đầu file %PDF' };
        }
        if (expectedType === 'zip' && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
          return { ok: false, size: bytes.length, reason: 'Không đúng chữ ký ZIP/DOCX (PK)' };
        }
        if (expectedType === 'png' && !(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)) {
          return { ok: false, size: bytes.length, reason: 'Không đúng chữ ký PNG' };
        }
        return { ok: true, size: bytes.length };
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
        // Không chặn blob: hoặc tải file nội bộ của chính AutoTester
        if (urlStr.startsWith('blob:') || urlStr.includes('autotester/')) {
          return orig(input, init);
        }
        if (self.networkMode === 'offline') {
          throw new TypeError('Failed to fetch (AutoTester Offline Simulation)');
        }
        if (self.networkMode === 'slow') {
          await sleep(1200);
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
  // 5. ZERO-CODE RECORDER — Quay thao tác mẫu của người dùng & lưu vào IndexedDB
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
          id: `rec_${Date.now()}`,
          name: name || `Kịch bản mẫu (${new Date().toLocaleTimeString('vi-VN')})`,
          createdAt: Date.now(),
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
        this.currentSteps.push({ type: 'click', descriptor: desc, label: desc.text || desc.selector || desc.tag });
        this._onStepCb?.(this.currentSteps.length);
      };
      this._boundChange = (ev) => {
        const desc = this._describeElement(ev.target);
        if (!desc) return;
        const val = ev.target?.value;
        if (typeof val === 'string') {
          this.currentSteps.push({ type: 'fill', descriptor: desc, value: val.slice(0, 200), label: desc.selector || desc.tag });
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
  AT.driver = new SelfHealingDriver();
  AT.fixtures = FixtureFactory;
  AT.interceptors = new TestInterceptors();
  AT.recorder = new ZeroCodeRecorder();
})(typeof window !== 'undefined' ? window : globalThis);
