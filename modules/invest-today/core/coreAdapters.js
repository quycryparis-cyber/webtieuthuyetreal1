/**
 * ============================================================================
 * 🧩 ĐẦU TƯ HÔM NAY — CORE ADAPTERS (State, 3-Tier Storage, Network, File Parser)
 * File: modules/invest-today/core/coreAdapters.js
 * ============================================================================
 */
(function initInvestCoreAdapters(globalScope) {
  'use strict';

  const INV = (globalScope.NoirInvestToday = globalScope.NoirInvestToday || {});
  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  const SESSION_PREFIX = 'noir_inv_sess_v123_';
  const LOCAL_PREFS_KEY = 'noir_inv_prefs_v123';
  const IDB_NAME = 'NoirInvestTodayDB';
  const IDB_VERSION = 1;
  const MAX_AUDIT_LOGS = 30;
  const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

  const CDN_PARSERS = {
    mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
    pdfJs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatVnd(num, digits = 0) {
    const n = Number(num);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('vi-VN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function formatMillions(vnd, digits = 2) {
    const n = Number(vnd);
    if (!Number.isFinite(n)) return '—';
    return `${(n / 1e6).toLocaleString('vi-VN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })} triệu`;
  }

  function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // --------------------------------------------------------------------------
  // 1. STATE MANAGER + ABORT CONTROLLER REGISTRY (Zero-Idle RAM Teardown)
  // --------------------------------------------------------------------------
  const stateManager = {
    activeTab: 'overview',
    hostEl: null,
    userRegion: null, // { countryCode, countryName, areaLabel, currency, centralBank, stockIndex, source }
    defaultKnowledge: null,
    activeKnowledge: null,
    isCustomKnowledge: false,
    goldData: null,
    stockData: null,
    vnIndexData: null,
    realEstateData: null,
    evaluationReport: null,
    lastRunAt: 0,
    runningEval: false,
    _controllers: new Set(),

    createSignal() {
      const ctrl = new AbortController();
      this._controllers.add(ctrl);
      ctrl.signal.addEventListener(
        'abort',
        () => {
          this._controllers.delete(ctrl);
        },
        { once: true }
      );
      return { controller: ctrl, signal: ctrl.signal };
    },

    releaseController(ctrl) {
      if (ctrl) this._controllers.delete(ctrl);
    },

    abortAll() {
      this._controllers.forEach((ctrl) => {
        try {
          ctrl.abort();
        } catch (_e) {}
      });
      this._controllers.clear();
      this.runningEval = false;
    },

    resetTransientMemory() {
      this.abortAll();
      if (this.hostEl) {
        this.hostEl.innerHTML = '';
      }
      this.hostEl = null;
      this.goldData = null;
      this.stockData = null;
      this.vnIndexData = null;
      this.realEstateData = null;
      this.evaluationReport = null;
      this.defaultKnowledge = null;
      this.activeKnowledge = null;
      this.userRegion = null;
    },
  };

  // --------------------------------------------------------------------------
  // 2. 3-TIER STORAGE ADAPTER (sessionStorage TTL + IndexedDB + localStorage)
  // --------------------------------------------------------------------------
  const storageAdapter = {
    // Tier 1: sessionStorage with TTL
    getSession(key, ttlMs) {
      try {
        const raw = sessionStorage.getItem(SESSION_PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.savedAt !== 'number') return null;
        const ageMs = Date.now() - parsed.savedAt;
        if (ttlMs && ageMs > ttlMs) return null;
        return {
          data: parsed.data,
          savedAt: parsed.savedAt,
          ageMinutes: Math.max(0, Math.round(ageMs / 60000)),
        };
      } catch (_e) {
        return null;
      }
    },

    setSession(key, data) {
      try {
        sessionStorage.setItem(
          SESSION_PREFIX + key,
          JSON.stringify({ savedAt: Date.now(), data })
        );
      } catch (_e) {}
    },

    clearSession(key) {
      try {
        sessionStorage.removeItem(SESSION_PREFIX + key);
      } catch (_e) {}
    },

    // Tier 3: tiny localStorage prefs
    getPrefs() {
      const defaults = {
        recentStocks: ['FPT', 'VCB', 'HPG', 'VNM', 'VHM'],
        proxyUrl: '',
        legalChecks: {},
        promptMode: 'plain',
        scanDepth: 'quick',
        showAdvanced: false,
      };
      try {
        const raw = localStorage.getItem(LOCAL_PREFS_KEY);
        if (!raw) return defaults;
        return { ...defaults, ...JSON.parse(raw) };
      } catch (_e) {
        return defaults;
      }
    },

    savePrefs(patch) {
      const next = { ...this.getPrefs(), ...patch };
      try {
        localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(next));
      } catch (_e) {}
      return next;
    },

    // Tier 2: IndexedDB (always closes connection right after tx — 0 idle RAM)
    _openIdb() {
      return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          return reject(new Error('IndexedDB không khả dụng trên trình duyệt này.'));
        }
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('knowledge')) {
            db.createObjectStore('knowledge', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('audit_log')) {
            db.createObjectStore('audit_log', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Lỗi mở IndexedDB'));
      });
    },

    async _runIdb(storeName, mode, worker) {
      const db = await this._openIdb();
      try {
        return await new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, mode);
          const store = tx.objectStore(storeName);
          let out;
          try {
            out = worker(store);
          } catch (err) {
            return reject(err);
          }
          if (out && typeof out.onsuccess !== 'undefined') {
            out.onsuccess = () => resolve(out.result);
            out.onerror = () => reject(out.error);
          } else {
            tx.oncomplete = () => resolve(out);
            tx.onerror = () => reject(tx.error);
          }
        });
      } finally {
        try {
          db.close();
        } catch (_e) {}
      }
    },

    async getCustomKnowledge() {
      try {
        const rec = await this._runIdb('knowledge', 'readonly', (s) => s.get('custom_active'));
        return rec?.payload || null;
      } catch (_e) {
        return null;
      }
    },

    async saveCustomKnowledge(payload) {
      return this._runIdb('knowledge', 'readwrite', (s) =>
        s.put({ id: 'custom_active', savedAt: Date.now(), payload })
      );
    },

    async clearCustomKnowledge() {
      return this._runIdb('knowledge', 'readwrite', (s) => s.delete('custom_active'));
    },

    async getAuditLogs() {
      try {
        const list = await this._runIdb('audit_log', 'readonly', (s) => s.getAll());
        return Array.isArray(list) ? list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : [];
      } catch (_e) {
        return [];
      }
    },

    async addAuditLog(entry) {
      const record = {
        id: 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        createdAt: Date.now(),
        asOfDate: todayIso(),
        ...entry,
      };
      await this._runIdb('audit_log', 'readwrite', (s) => s.put(record));
      // Giới hạn tối đa 30 bản gần nhất, tự dọn bản cũ nhất
      const all = await this.getAuditLogs();
      if (all.length > MAX_AUDIT_LOGS) {
        const toDelete = all.slice(MAX_AUDIT_LOGS);
        await this._runIdb('audit_log', 'readwrite', (s) => {
          toDelete.forEach((item) => s.delete(item.id));
        });
      }
      return record;
    },

    async deleteAuditLog(id) {
      return this._runIdb('audit_log', 'readwrite', (s) => s.delete(id));
    },
  };

  // --------------------------------------------------------------------------
  // 3. NETWORK ADAPTER (Auto-detect Electron Native Fetch vs Web / CF Worker)
  // --------------------------------------------------------------------------
  const networkAdapter = {
    isDesktopElectron() {
      return Boolean(globalScope.NoirDesktopLocalEngine?.isDesktopElectron && globalScope.NoirDesktopLocalEngine?.investFetch);
    },

    getProxyUrl() {
      const p = storageAdapter.getPrefs().proxyUrl || '';
      return p.trim().replace(/\/+$/, '');
    },

    async fetchText(url, { signal, timeoutMs = 10000, preferDirect = false } = {}) {
      // 1) Bản Desktop Electron -> gọi thẳng từ Node main process (KHÔNG bị chặn CORS!)
      if (this.isDesktopElectron()) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const res = await globalScope.NoirDesktopLocalEngine.investFetch({ url, timeoutMs });
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        if (!res?.ok) throw new Error(res?.error || `HTTP ${res?.status || 0}`);
        return { text: res.text || '', status: res.status || 200, via: 'electron-native' };
      }

      // 2) Bản Web tĩnh: ưu tiên gọi trực tiếp với nguồn mở CORS, hoặc qua Cloudflare Worker nếu người dùng có nhập
      const proxyBase = !preferDirect ? this.getProxyUrl() : '';
      const targetUrl = proxyBase
        ? `${proxyBase}${proxyBase.includes('?') ? '&' : '?'}url=${encodeURIComponent(url)}`
        : url;

      const localCtrl = new AbortController();
      const timer = setTimeout(() => localCtrl.abort(), timeoutMs);
      const onParentAbort = () => localCtrl.abort();
      if (signal) {
        if (signal.aborted) {
          clearTimeout(timer);
          throw new DOMException('Aborted', 'AbortError');
        }
        signal.addEventListener('abort', onParentAbort, { once: true });
      }
      try {
        const resp = await fetch(targetUrl, { signal: localCtrl.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const text = await resp.text();
        return { text, status: resp.status, via: proxyBase ? 'cf-worker' : 'direct-web' };
      } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onParentAbort);
      }
    },

    async fetchJson(url, opts = {}) {
      const res = await this.fetchText(url, opts);
      return { data: JSON.parse(res.text), via: res.via };
    },
  };

  // --------------------------------------------------------------------------
  // 4. KNOWLEDGE BASE LOADER & RUNTIME .DOCX / .PDF / .MD / .TXT PARSER
  // --------------------------------------------------------------------------
  function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Không tải được thư viện đọc file (${src})`));
      document.head.appendChild(s);
    });
  }

  function extractStructuredKnowledgeFromText(rawText, fileName, defaultKb) {
    const clean = String(rawText || '').replace(/\r\n/g, '\n').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length < 100) {
      throw new Error(
        `Tệp chỉ tách được ${words.length} từ hợp lệ (cần tối thiểu 100 từ văn bản; tránh tệp hỏng hoặc chỉ toàn ảnh chụp). Bộ kiến thức hiện tại vẫn được giữ nguyên.`
      );
    }

    const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
    const chapters = [];
    const customChecklist = [];
    const thresholdNotes = [];

    const headingRe = /^(chương\s+\d+|phần\s+\d+|mục\s+\d+|#{1,3}\s+|\d+\.\d*\s+[A-ZÀ-Ỹ])/i;
    const thresholdRe = /([><=≥≤]\s*\d+[.,]?\d*\s*(%|x|triệu|tỷ|điểm|lần|phiên))/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/^#+\s*/, '').trim();
      if (line.length >= 6 && line.length <= 140 && headingRe.test(lines[i])) {
        if (chapters.length < 24 && !chapters.includes(line)) {
          chapters.push(line);
        }
        if (customChecklist.length < 28) {
          const lower = line.toLowerCase();
          let layer = 'global_macro';
          if (/vàng|sjc|aisc|xau|lượng/.test(lower)) layer = 'gold';
          else if (/chứng khoán|cổ phiếu|vn-index|margin|bctc|pháp y|ngân hàng/.test(lower)) layer = 'stock';
          else if (/bất động sản|nhà đất|đất đai|dscr|lãi vay|pháp lý|cho thuê/.test(lower)) layer = 'real_estate';
          else if (/việt nam|nhnn|tỷ giá|cpi|gdp|tín dụng|omo/.test(lower)) layer = 'vn_macro';
          customChecklist.push({
            id: 'custom_item_' + (customChecklist.length + 1),
            layer,
            quick: customChecklist.length < 14,
            plain_label: line,
            technical_label: line,
            unit: 'tin mới',
            freq: 'Theo file người dùng',
            query_template: `${line} mới nhất {MONTH}/{YEAR}`,
            baseline_2026_11_24: 'Trích từ file người dùng tải lên',
          });
        }
      }
      if (thresholdRe.test(line) && thresholdNotes.length < 18) {
        thresholdNotes.push(line.slice(0, 180));
      }
    }

    const digestText = clean.slice(0, 7500);
    return {
      ...defaultKb,
      metadata: {
        ...defaultKb.metadata,
        title: fileName.replace(/\.[^.]+$/, ''),
        short_title: `${fileName} (${chapters.length || 1} đề mục — ${words.length.toLocaleString('vi-VN')} từ)`,
        source_file: fileName,
        chapters_count: chapters.length || 1,
        compiled_as_of: todayIso(),
        chapters: chapters.length ? chapters : ['Nội dung tổng hợp từ tệp tải lên'],
      },
      search_checklist: customChecklist.length >= 4 ? customChecklist : defaultKb.search_checklist,
      extracted_thresholds: thresholdNotes,
      core_principles_digest: digestText,
      is_custom_file: true,
    };
  }

  const fileParser = {
    async loadDefaultKnowledge() {
      if (stateManager.defaultKnowledge) return stateManager.defaultKnowledge;
      const resp = await fetch('modules/invest-today/data/default_knowledge_base.json', { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} khi nạp bộ kiến thức mặc định.`);
      const json = await resp.json();
      stateManager.defaultKnowledge = json;
      return json;
    },

    async initActiveKnowledge() {
      const defKb = await this.loadDefaultKnowledge();
      const customKb = await storageAdapter.getCustomKnowledge();
      if (customKb && customKb.metadata) {
        stateManager.activeKnowledge = customKb;
        stateManager.isCustomKnowledge = true;
      } else {
        stateManager.activeKnowledge = defKb;
        stateManager.isCustomKnowledge = false;
      }
      return stateManager.activeKnowledge;
    },

    async parseAndActivateFile(file) {
      if (!file) throw new Error('Chưa chọn tệp nào.');
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error('Tệp vượt quá giới hạn 15 MB để bảo vệ RAM máy. Vui lòng chọn tệp gọn hơn.');
      }

      const ext = (file.name.split('.').pop() || '').toLowerCase();
      let text = '';

      if (ext === 'txt' || ext === 'md' || ext === 'json') {
        text = await file.text();
        if (ext === 'json') {
          try {
            const parsedJson = JSON.parse(text);
            if (parsedJson?.metadata && Array.isArray(parsedJson?.search_checklist)) {
              const defKb = await this.loadDefaultKnowledge();
              const merged = { ...defKb, ...parsedJson, is_custom_file: true };
              await storageAdapter.saveCustomKnowledge(merged);
              stateManager.activeKnowledge = merged;
              stateManager.isCustomKnowledge = true;
              return merged;
            }
          } catch (_e) {}
        }
      } else if (ext === 'docx') {
        const buf = await file.arrayBuffer();
        // Thử tải động mammoth.js chỉ khi người dùng thực sự tải file .docx lên
        if (!globalScope.mammoth) {
          try {
            await loadExternalScript(CDN_PARSERS.mammoth);
          } catch (_eCdn) {}
        }
        if (globalScope.mammoth?.extractRawText) {
          const res = await globalScope.mammoth.extractRawText({ arrayBuffer: buf });
          text = res?.value || '';
        } else if (NS.docImporter?.parseDocxFile) {
          // Fallback bộ đọc XML/ZIP nội bộ có sẵn của Studio (chạy cả khi offline!)
          const res = await NS.docImporter.parseDocxFile(file);
          text = res?.text || '';
        } else {
          throw new Error('Không thể nạp bộ đọc file .docx (kiểm tra kết nối mạng hoặc đổi sang .txt/.md).');
        }
      } else if (ext === 'pdf') {
        const buf = await file.arrayBuffer();
        if (!globalScope.pdfjsLib) {
          await loadExternalScript(CDN_PARSERS.pdfJs);
        }
        if (!globalScope.pdfjsLib) throw new Error('Không thể nạp bộ đọc file .pdf lúc này.');
        if (globalScope.pdfjsLib.GlobalWorkerOptions) {
          globalScope.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_PARSERS.pdfWorker;
        }
        const pdf = await globalScope.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
        const chunks = [];
        const maxPages = Math.min(pdf.numPages, 80);
        for (let p = 1; p <= maxPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          chunks.push((content.items || []).map((it) => it.str || '').join(' '));
        }
        text = chunks.join('\n');
      } else {
        throw new Error('Định dạng chưa hỗ trợ. Vui lòng chọn tệp .docx, .pdf, .md, .txt hoặc .json.');
      }

      const defKb = await this.loadDefaultKnowledge();
      const customKb = extractStructuredKnowledgeFromText(text, file.name, defKb);
      await storageAdapter.saveCustomKnowledge(customKb);
      stateManager.activeKnowledge = customKb;
      stateManager.isCustomKnowledge = true;
      return customKb;
    },

    async restoreDefaultKnowledge() {
      await storageAdapter.clearCustomKnowledge();
      const defKb = await this.loadDefaultKnowledge();
      stateManager.activeKnowledge = defKb;
      stateManager.isCustomKnowledge = false;
      return defKb;
    },
  };

  INV.utils = { escapeHtml, formatVnd, formatMillions, todayIso };
  INV.stateManager = stateManager;
  INV.storageAdapter = storageAdapter;
  INV.networkAdapter = networkAdapter;
  INV.fileParser = fileParser;
})(typeof window !== 'undefined' ? window : globalThis);
