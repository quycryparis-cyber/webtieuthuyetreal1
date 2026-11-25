/**
 * ============================================================================
 * 🧠 20 PHÚT THÔNG THÁI MỖI NGÀY — INTERACTIVE GUIDED UI (v130.0)
 * ============================================================================
 * Luồng 4 bước rõ ràng, Zero-Idle RAM:
 *  1. Xác nhận Vị trí / Quốc gia (GPS chờ bấm xác nhận, hoặc chọn thủ công).
 *  2. Màn hình Đang quét tri thức & tin tức 5 hạng mục khoa học.
 *  3. Màn hình Trung tâm:
 *     - NÚT ĐẶC BIỆT NGAY Ở ĐẦU: "📰 Xem thông tin thô ngay (5 mục khoa học · Không cần Gemini)"
 *     - KHUNG 2 BƯỚC GEMINI bên dưới (Bước 1 Copy Prompt -> Bước 2 Dán & Đồng bộ -> đếm ngược 3s)
 *  4. Dashboard 3 Tab (Thông tin thô 5 mục | Bản tin 20 phút Gemini | Biểu đồ, Sơ đồ & Hình ảnh)
 *     kèm Đồng hồ bấm giờ 20:00 học sâu & nút "📍 Đổi vị trí" nổi bật (có pop-up cảnh báo Có/Không/✕).
 * ============================================================================
 */
(function initWisdom20UI(globalScope) {
  'use strict';

  const W20 = (globalScope.NoirWisdom20 = globalScope.NoirWisdom20 || {});
  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  const state = {
    hostEl: null,
    phase: 'location_gate', // 'location_gate' | 'scanning' | 'hub_2step' | 'dashboard'
    activeTab: 'raw', // 'raw' | 'briefing' | 'visuals'
    rawCategoryFilter: 'all',
    gpsStatus: 'idle', // 'idle' | 'detecting' | 'ready' | 'error'
    gpsError: '',
    pendingLocation: null,
    confirmedLocation: null,
    manualCountry: 'VN',
    manualCity: '',
    scanProgress: { pct: 0, label: 'Đang khởi tạo bộ quét tri thức...', detail: '' },
    scanLog: [],
    scanResult: null,
    focusMode: 'balanced_20m',
    customTopic: '',
    lastCopiedPrompt: '',
    geminiReplyRaw: '',
    geminiParsed: null,
    redirectCountdown: 0,
    redirectTimer: null,
    studySecondsLeft: 20 * 60,
    studyRunning: false,
    studyTimer: null,
    abortCtrl: null,
  };

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(msg, type = 'info', ms = 3000) {
    if (NS.utils?.showToast) {
      NS.utils.showToast(msg, type, ms);
    }
  }

  function clearTimersAndAbort() {
    if (state.abortCtrl) {
      try { state.abortCtrl.abort(); } catch (_e) {}
      state.abortCtrl = null;
    }
    if (state.redirectTimer) {
      clearInterval(state.redirectTimer);
      state.redirectTimer = null;
    }
    if (state.studyTimer) {
      clearInterval(state.studyTimer);
      state.studyTimer = null;
    }
    state.studyRunning = false;
    state.redirectCountdown = 0;
    document.getElementById('wis20-change-loc-modal')?.remove();
  }

  function formatMmSs(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function formatInlineMd(str) {
    return esc(str)
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0f2942;font-weight:800;">$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="padding:1px 6px;border-radius:5px;background:#e2e8f0;color:#0f2942;font-size:12px;">$1</code>');
  }

  /**
   * Trình kết xuất Báo Cáo Tài Chính / Tạp Chí Chuyên Nghiệp (Chuẩn Word / PDF):
   * - Xử lý sạch 100% tiêu đề #..###### thành dải màu xanh navy-teal (0 còn dấu ####!).
   * - Phân tích chuẩn bảng Markdown `| col | col |` thành bảng HTML có nền tiêu đề xanh đậm + kẻ sọc.
   * - Không bao giờ để sót dòng `---` hay `PHẦN 2 — KHỐI JSON` thừa!
   */
  function renderSimpleMarkdown(md) {
    const lines = String(md || '').split(/\r?\n/);
    const htmlParts = [];
    let i = 0;

    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();

      if (!trimmed || /^---+$/.test(trimmed) || /^===+$/.test(trimmed)) {
        i++;
        continue;
      }

      // 1. Bảng Markdown chuẩn `| a | b |`
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && /^\|\s*[-:]+/.test(lines[i + 1].trim())) {
        const parseRow = (ln) => ln.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        const headers = parseRow(trimmed);
        i += 2; // bỏ qua dòng header & dòng |---|---|
        const bodyRows = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          bodyRows.push(parseRow(lines[i]));
          i++;
        }
        htmlParts.push(`
          <div class="exec-table-wrap">
            <table class="exec-table">
              <thead><tr>${headers.map((h) => `<th>${formatInlineMd(h)}</th>`).join('')}</tr></thead>
              <tbody>
                ${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${formatInlineMd(cell)}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
        `);
        continue;
      }

      // 2. Tiêu đề các cấp (# đến ######)
      const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        const lvl = hMatch[1].length;
        const title = hMatch[2].replace(/\*\*/g, '').trim();
        if (lvl <= 2) {
          htmlParts.push(`<div class="exec-sec-banner">${esc(title)}</div>`);
        } else {
          htmlParts.push(`<div class="exec-subhead">${esc(title)}</div>`);
        }
        i++;
        continue;
      }

      // 3. Callout / Trích dẫn `>`
      if (trimmed.startsWith('>')) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        htmlParts.push(`<div class="exec-callout">${quoteLines.map(formatInlineMd).join('<br/>')}</div>`);
        continue;
      }

      // 4. Danh sách gạch đầu dòng (`-`, `*`, `•`)
      if (/^[-*•]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
          i++;
        }
        htmlParts.push(`<ul class="exec-bullet-list">${items.map((it) => `<li>${formatInlineMd(it)}</li>`).join('')}</ul>`);
        continue;
      }

      // 5. Đoạn văn bản thường (nếu là tiêu đề đánh số kiểu `1. Thế giới...` in đậm)
      if (/^\d+\.\s+/.test(trimmed) && trimmed.length < 95) {
        htmlParts.push(`<div class="exec-subhead">${formatInlineMd(trimmed)}</div>`);
      } else {
        htmlParts.push(`<p style="margin:6px 0 10px;color:#1e293b;">${formatInlineMd(trimmed)}</p>`);
      }
      i++;
    }

    return htmlParts.join('\n');
  }

  function getCountryOptionsHtml(selectedCode) {
    return Object.values(W20.COUNTRY_PROFILES || {})
      .map((p) => `<option value="${esc(p.code)}" ${p.code === selectedCode ? 'selected' : ''}>${esc(p.flag)} ${esc(p.name)} (${esc(p.currency)})</option>`)
      .join('');
  }

  async function runGpsDetection() {
    state.gpsStatus = 'detecting';
    state.gpsError = '';
    render();
    const ctrl = new AbortController();
    state.abortCtrl = ctrl;
    try {
      const loc = await W20.detectUserLocationByGps(ctrl.signal);
      if (ctrl.signal.aborted) return;
      state.pendingLocation = loc;
      state.manualCountry = loc.countryCode;
      state.manualCity = loc.cityLabel;
      state.gpsStatus = 'ready';
      render();
    } catch (err) {
      if (ctrl.signal.aborted) return;
      state.gpsStatus = 'error';
      state.gpsError = err?.message || 'Không lấy được vị trí GPS tự động — bạn có thể chọn Quốc gia thủ công bên dưới.';
      render();
    }
  }

  async function confirmLocationAndScan(locationObj) {
    clearTimersAndAbort();
    state.confirmedLocation = locationObj;
    state.phase = 'scanning';
    state.scanProgress = { pct: 8, label: 'Đang kết nối các nguồn tri thức xác thực...', detail: locationObj.fullAddress || locationObj.countryName };
    state.scanLog = [];
    state.geminiParsed = null;
    state.geminiReplyRaw = '';
    render();

    const ctrl = new AbortController();
    state.abortCtrl = ctrl;
    try {
      const result = await W20.scanDailyWisdom({
        location: locationObj,
        signal: ctrl.signal,
        onProgress: (info) => {
          if (ctrl.signal.aborted) return;
          state.scanProgress = info;
          state.scanLog.push(`✅ ${info.label} (${info.detail})`);
          const bar = state.hostEl?.querySelector('#wis20-scan-bar');
          const lbl = state.hostEl?.querySelector('#wis20-scan-label');
          const pctEl = state.hostEl?.querySelector('#wis20-scan-pct');
          const logEl = state.hostEl?.querySelector('#wis20-scan-log');
          if (bar) bar.style.width = `${info.pct}%`;
          if (lbl) lbl.textContent = info.label;
          if (pctEl) pctEl.textContent = `${info.pct}%`;
          if (logEl) {
            logEl.innerHTML = state.scanLog.map((x) => `<div class="text-[11px] opacity-85">${esc(x)}</div>`).join('');
          }
        },
      });
      if (ctrl.signal.aborted) return;
      state.scanResult = result;
      state.phase = 'hub_2step';
      render();
    } catch (err) {
      if (ctrl.signal.aborted) return;
      toast('⚠️ Lỗi khi quét tin hôm nay: ' + (err?.message || err), 'error', 3600);
      state.phase = 'location_gate';
      render();
    }
  }

  function openChangeLocationWarningModal() {
    document.getElementById('wis20-change-loc-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'wis20-change-loc-modal';
    modal.className = 'wis20-modal-overlay';
    modal.innerHTML = `
      <div class="wis20-modal-box space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            <h3 class="text-sm font-black">Xác nhận đổi vị trí & khu vực?</h3>
          </div>
          <button type="button" id="wis20-chg-x" class="w-7 h-7 rounded-lg border border-zinc-400/40 hover:bg-rose-500 hover:text-white font-black text-xs cursor-pointer">✕</button>
        </div>
        <p class="text-xs leading-relaxed opacity-85">
          Nếu bạn đổi vị trí ngay lúc này, toàn bộ dữ liệu tin tức khu vực, bản tin 20 phút và biểu đồ đã đồng bộ hiện tại sẽ được <b>xóa sạch để quét lại từ đầu</b> theo khu vực mới. Bạn có chắc chắn muốn đổi vị trí không?
        </p>
        <div class="flex items-center justify-end gap-2 pt-1">
          <button type="button" id="wis20-chg-no" class="wis20-btn">Không, giữ nguyên</button>
          <button type="button" id="wis20-chg-yes" class="wis20-btn wis20-btn-change-loc">✅ Có, đổi vị trí ngay</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closePopup = () => modal.remove();
    modal.addEventListener('click', (ev) => { if (ev.target === modal) closePopup(); });
    modal.querySelector('#wis20-chg-x')?.addEventListener('click', closePopup);
    modal.querySelector('#wis20-chg-no')?.addEventListener('click', closePopup);
    modal.querySelector('#wis20-chg-yes')?.addEventListener('click', () => {
      closePopup();
      clearTimersAndAbort();
      state.confirmedLocation = null;
      state.scanResult = null;
      state.geminiParsed = null;
      state.geminiReplyRaw = '';
      state.phase = 'location_gate';
      render();
    });
  }

  async function copyPromptAndOpenGemini() {
    if (!state.scanResult) return;
    const promptText = W20.buildGeminiWisdomPrompt(state.scanResult, {
      focusMode: state.focusMode,
      customTopic: state.customTopic,
    });
    state.lastCopiedPrompt = promptText;
    try {
      await globalScope.navigator?.clipboard?.writeText(promptText);
      toast('✅ Đã sao chép câu lệnh 20 phút thông thái (kèm chuẩn vẽ Biểu đồ & Sơ đồ)! Đang mở Gemini...', 'success', 3800);
    } catch (_eClip) {
      toast('ℹ️ Trình duyệt chặn tự copy — bấm "Xem trước câu lệnh" để copy thủ công.', 'warning', 3500);
    }
    try {
      globalScope.open('https://gemini.google.com/app', '_blank', 'noopener');
    } catch (_eOpen) {}
  }

  function syncGeminiReplyAndCountdown() {
    const textarea = state.hostEl?.querySelector('#wis20-gemini-paste-box');
    const raw = (textarea ? textarea.value : state.geminiReplyRaw || '').trim();
    if (!raw || raw.length < 30) {
      toast('⚠️ Vui lòng dán toàn bộ câu trả lời từ Gemini vào ô Bước 2 trước khi đồng bộ!', 'warning', 3400);
      textarea?.focus();
      return;
    }
    state.geminiReplyRaw = raw;
    state.geminiParsed = W20.parseGeminiWisdomReply(raw, state.scanResult);

    if (state.redirectTimer) clearInterval(state.redirectTimer);
    state.redirectCountdown = 3;
    render();

    state.redirectTimer = setInterval(() => {
      state.redirectCountdown -= 1;
      const cdEl = state.hostEl?.querySelector('#wis20-countdown-num');
      if (cdEl) cdEl.textContent = String(Math.max(0, state.redirectCountdown));
      if (state.redirectCountdown <= 0) {
        clearInterval(state.redirectTimer);
        state.redirectTimer = null;
        state.phase = 'dashboard';
        state.activeTab = 'briefing';
        render();
      }
    }, 1000);
  }

  function toggleStudyTimer() {
    if (state.studyRunning) {
      state.studyRunning = false;
      if (state.studyTimer) {
        clearInterval(state.studyTimer);
        state.studyTimer = null;
      }
      render();
      return;
    }
    if (state.studySecondsLeft <= 0) state.studySecondsLeft = 20 * 60;
    state.studyRunning = true;
    state.studyTimer = setInterval(() => {
      state.studySecondsLeft -= 1;
      const el = state.hostEl?.querySelector('#wis20-study-clock');
      if (el) el.textContent = formatMmSs(state.studySecondsLeft);
      if (state.studySecondsLeft <= 0) {
        clearInterval(state.studyTimer);
        state.studyTimer = null;
        state.studyRunning = false;
        toast('🎉 Chúc mừng! Bạn đã hoàn thành trọn vẹn 20 phút thông thái hôm nay!', 'success', 5000);
        render();
      }
    }, 1000);
    render();
  }

  // ==========================================================================
  // RENDER PHASES
  // ==========================================================================
  function renderLocationGateHtml() {
    const pLoc = state.pendingLocation;
    return `
      <div class="wis20-root">
        <div class="wis20-card text-center space-y-4 py-5">
          <div class="text-4xl">🧠</div>
          <div class="space-y-1">
            <h3 class="text-base sm:text-lg font-black">20 Phút Thông Thái Mỗi Ngày — Xác nhận Vị trí & Khu vực</h3>
            <p class="text-xs opacity-80 max-w-xl mx-auto">
              Hệ thống sẽ quét tin tức & tri thức xác thực hôm nay (Thế giới, Công nghệ/AI, Kinh tế, Khu vực của bạn & Tri thức nền) theo đúng quốc gia bạn đang ở.
              Bạn có thể đọc <b>Thông tin thô (5 mục khoa học)</b> ngay lập tức hoặc đồng bộ <b>Gemini</b> để vẽ Biểu đồ & Sơ đồ Nhân Quả!
            </p>
          </div>

          <div class="max-w-lg mx-auto space-y-3">
            ${state.gpsStatus === 'ready' && pLoc ? `
              <div class="p-3.5 rounded-2xl border-2 border-emerald-500/60 bg-emerald-500/10 space-y-2.5 text-left">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">📡 Đã dò thấy vị trí GPS của bạn</span>
                  <span class="wis20-badge">${esc(pLoc.flag)} ${esc(pLoc.countryName)}</span>
                </div>
                <div class="text-sm font-black">${esc(pLoc.fullAddress)}</div>
                <div class="flex flex-wrap gap-2 pt-1">
                  <button type="button" id="wis20-btn-confirm-gps" class="wis20-btn wis20-btn-primary flex-1">✅ Xác nhận vị trí này &amp; Quét tin hôm nay</button>
                  <button type="button" id="wis20-btn-retry-gps" class="wis20-btn">🔄 Dò lại GPS</button>
                </div>
              </div>
            ` : `
              <div class="space-y-2">
                <button type="button" id="wis20-btn-detect-gps" class="wis20-btn wis20-btn-primary w-full py-2.5" ${state.gpsStatus === 'detecting' ? 'disabled' : ''}>
                  ${state.gpsStatus === 'detecting' ? '⏳ Đang xin quyền Vị trí (GPS) &amp; nhận diện khu vực...' : '📡 Tự động dò vị trí (GPS)'}
                </button>
                ${state.gpsStatus === 'error' ? `<div class="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">⚠️ ${esc(state.gpsError)}</div>` : ''}
              </div>
            `}

            <div class="pt-3 border-t border-zinc-300/60 dark:border-zinc-700/70 space-y-2.5 text-left">
              <div class="text-xs font-extrabold opacity-80">Hoặc chọn Quốc gia &amp; Thành phố thủ công:</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select id="wis20-manual-country" class="wis20-select">${getCountryOptionsHtml(state.manualCountry)}</select>
                <input id="wis20-manual-city" type="text" class="wis20-input" placeholder="Tùy chọn: Hà Nội, Đà Nẵng, Tokyo..." value="${esc(state.manualCity)}" />
              </div>
              <button type="button" id="wis20-btn-confirm-manual" class="wis20-btn w-full py-2.5 border-emerald-500/50">
                🚀 Xác nhận Quốc gia &amp; Quét 20 phút thông thái hôm nay
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderScanningHtml() {
    return `
      <div class="wis20-root">
        <div class="wis20-card py-7 px-4 text-center space-y-4">
          <div class="text-4xl animate-pulse">🌍</div>
          <div class="space-y-1">
            <h3 class="text-base font-black">Đang tổng hợp Tri thức &amp; Tin tức Xác thực Hôm nay...</h3>
            <p id="wis20-scan-label" class="text-xs font-bold text-emerald-600 dark:text-emerald-400">${esc(state.scanProgress.label)}</p>
          </div>
          <div class="max-w-md mx-auto space-y-1.5">
            <div class="wis20-progress-bar">
              <div id="wis20-scan-bar" class="wis20-progress-fill" style="width:${state.scanProgress.pct}%"></div>
            </div>
            <div class="flex justify-between text-[11px] font-bold opacity-75">
              <span>📍 ${esc(state.confirmedLocation?.flag || '🌍')} ${esc(state.confirmedLocation?.fullAddress || state.confirmedLocation?.countryName || '')}</span>
              <span id="wis20-scan-pct">${state.scanProgress.pct}%</span>
            </div>
          </div>
          <div id="wis20-scan-log" class="max-w-md mx-auto text-left p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/70 border border-zinc-300/50 dark:border-zinc-800 space-y-1 min-h-[76px]">
            ${state.scanLog.map((x) => `<div class="text-[11px] opacity-85">${esc(x)}</div>`).join('') || '<div class="text-[11px] opacity-60">Đang mở kết nối trực tiếp tới Wikipedia, DEV.to, Hacker News, GitHub, Binance &amp; World Bank...</div>'}
          </div>
        </div>
      </div>
    `;
  }

  function renderHeaderLocationBarHtml(showStudyTimer = false) {
    const loc = state.confirmedLocation || {};
    const res = state.scanResult;
    return `
      <div class="wis20-card flex flex-wrap items-center justify-between gap-2.5 py-2.5 px-3.5">
        <div class="min-w-0 flex flex-wrap items-center gap-2">
          <span class="wis20-badge">${esc(loc.flag || '🌍')} ${esc(loc.fullAddress || loc.countryName || 'Việt Nam')}</span>
          <span class="text-[11px] font-bold opacity-75">📅 ${esc(res?.dateLabel || '')} · ${res?.totalItems || 0} mục đã xác thực</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          ${showStudyTimer ? `
            <span class="wis20-timer-pill" title="Đồng hồ đếm ngược 20 phút đọc sâu mỗi ngày">
              ⏱️ <span id="wis20-study-clock" class="tabular-nums">${formatMmSs(state.studySecondsLeft)}</span>
              <button type="button" id="wis20-btn-timer-toggle" class="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black cursor-pointer">${state.studyRunning ? '⏸️ Dừng' : '▶️ Chạy'}</button>
              <button type="button" id="wis20-btn-timer-reset" class="px-1 py-0.5 rounded-md border border-emerald-500/40 text-[10px] font-black cursor-pointer" title="Đặt lại 20:00">🔄</button>
            </span>
          ` : ''}
          <button type="button" id="wis20-btn-export-pdf" class="wis20-btn wis20-btn-pdf text-xs py-1.5">📄 Xuất Báo Cáo PDF</button>
          <button type="button" id="wis20-btn-rescan" class="wis20-btn text-xs py-1.5">🔄 Quét lại tin mới</button>
          <button type="button" id="wis20-btn-change-loc" class="wis20-btn wis20-btn-change-loc text-xs py-1.5">📍 Đổi vị trí</button>
        </div>
      </div>
    `;
  }

  function renderHub2StepHtml() {
    const res = state.scanResult;
    const catChips = (W20.CATEGORIES || []).map((c) => {
      const cnt = res?.categoriesData?.[c.id]?.length || 0;
      return `<span class="wis20-badge">${c.icon} ${esc(c.title.replace(/^\d+\.\s*/, '').split('&')[0].trim())}: <b>${cnt}</b></span>`;
    }).join('');

    return `
      <div class="wis20-root">
        ${renderHeaderLocationBarHtml(false)}

        <!-- NÚT ĐẶC BIỆT ĐẶT NGAY Ở ĐẦU: XEM THÔNG TIN THÔ (8 TRỤ CỘT KHOA HỌC, KHÔNG CẦN GEMINI) -->
        <div class="wis20-raw-hero space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">⚡ Đọc nhanh tức thì · Bao phủ đủ 8 trụ cột tri thức người trưởng thành</div>
              <h3 class="text-base sm:text-lg font-black">📰 Xem Thông Tin Thô Hôm Nay (Đã tự chia 8 mục khoa học)</h3>
              <p class="text-sm opacity-90">
                Đọc ngay <b>${res?.totalItems || 0} tin tức mới nhất, công trình y khoa PubMed, chỉ số kinh tế &amp; mô hình tư duy</b> — đã lọc sạch tin cũ, kèm link gốc 100%, không cần qua Gemini!
              </p>
            </div>
            <div class="flex flex-wrap gap-2 shrink-0">
              <button type="button" id="wis20-btn-open-raw-now" class="wis20-btn wis20-btn-primary px-4 py-2.5 text-sm">
                📰 Xem thông tin thô ngay ➔
              </button>
              <button type="button" id="wis20-btn-export-pdf-hub" class="wis20-btn wis20-btn-pdf px-4 py-2.5 text-sm">
                📄 Xuất PDF ngay
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 pt-1">${catChips}</div>
        </div>

        <!-- KHUNG 2 BƯỚC GEMINI: KHOA HỌC HƠN NỮA VỚI BIỂU ĐỒ, SƠ ĐỒ NHÂN QUẢ & HÌNH ẢNH -->
        <div class="wis20-gemini-card space-y-3.5">
          <div class="space-y-1">
            <div class="text-xs font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">✨ Nâng cấp khoa học hơn nữa với Gemini (Miễn phí · 0 API key)</div>
            <h3 class="text-sm sm:text-base font-black">🤖 Đồng bộ Gemini để Tổng hợp Bản tin 20 Phút + Vẽ Biểu đồ &amp; Sơ đồ Nhân Quả</h3>
            <p class="text-xs opacity-80">
              Thực hiện 2 bước gọn nhẹ dưới đây để Gemini phân tích toàn bộ dữ liệu thật vừa quét, rút ra <b>Mô hình Tư duy</b> và tự động vẽ <b>Biểu đồ 20 phút, Cột tác động, Sơ đồ Mindmap SVG &amp; Dòng thời gian</b>!
            </p>
          </div>

          <!-- BƯỚC 1 -->
          <div class="p-3 rounded-xl bg-white/75 dark:bg-zinc-950/65 border border-violet-500/35 space-y-2.5">
            <div class="text-xs font-black text-violet-700 dark:text-violet-300">Bước 1: Chọn góc nhìn &amp; Sao chép câu lệnh sang Gemini</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select id="wis20-focus-mode" class="wis20-select">
                ${(W20.FOCUS_MODES || []).map((m) => `<option value="${esc(m.id)}" ${m.id === state.focusMode ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}
              </select>
              <input id="wis20-custom-topic" type="text" class="wis20-input" placeholder="Tùy chọn: Chủ đề muốn ưu tiên (VD: AI Agent, năng lượng xanh, giá dầu...)" value="${esc(state.customTopic)}" />
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" id="wis20-btn-copy-gemini" class="wis20-btn wis20-btn-gemini flex-1 py-2.5">
                📋 Tự động sao chép &amp; Mở Gemini
              </button>
              <button type="button" id="wis20-btn-preview-prompt" class="wis20-btn py-2.5">
                👁️ Xem trước câu lệnh
              </button>
            </div>
            <div id="wis20-prompt-preview-box" class="hidden">
              <textarea readonly rows="6" class="wis20-textarea text-[11px] font-mono"></textarea>
            </div>
          </div>

          <!-- BƯỚC 2 -->
          <div class="p-3 rounded-xl bg-white/75 dark:bg-zinc-950/65 border border-sky-500/35 space-y-2.5">
            <div class="text-xs font-black text-sky-700 dark:text-sky-300">Bước 2: Dán câu trả lời từ Gemini vào đây để vẽ Biểu đồ &amp; Sơ đồ</div>
            <div class="wis20-copy-mockup text-[11px]">
              <span>💡 Ở cuối câu trả lời trên Gemini, hãy bấm nút <b>Sao chép phản hồi</b> như hình minh họa bên cạnh rồi dán (Ctrl+V) vào ô dưới:</span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white font-bold shrink-0 text-[10.5px]">📋 Sao chép</span>
            </div>
            <textarea id="wis20-gemini-paste-box" rows="5" class="wis20-textarea" placeholder="Dán toàn bộ câu trả lời của Gemini (bao gồm cả khối JSON WISDOM_20MIN_SYNC_V1 ở cuối) vào đây...">${esc(state.geminiReplyRaw)}</textarea>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" id="wis20-btn-sync-gemini" class="wis20-btn wis20-btn-primary flex-1 py-2.5">
                ✨ Đồng bộ Bản tin 20 phút, Biểu đồ &amp; Sơ đồ ngay
              </button>
              ${state.redirectCountdown > 0 ? `
                <button type="button" id="wis20-btn-skip-cd" class="wis20-btn wis20-btn-gemini py-2.5">
                  ✅ Đang mở Dashboard sau <span id="wis20-countdown-num">${state.redirectCountdown}</span>s (Mở ngay ➔)
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderRawTabHtml() {
    const res = state.scanResult;
    if (!res) return '';
    const filter = state.rawCategoryFilter || 'all';
    const m = res.liveMetrics || {};
    const profile = res.profile || W20.getCountryProfile('VN');

    const metricStrip = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="wis20-kpi-card wis20-kpi-sky">
          <div class="text-xs font-extrabold opacity-90">💱 Tỷ giá USD / ${esc(m.localCurrency || 'VND')}</div>
          <div class="text-lg sm:text-xl font-black tracking-tight">${m.usdToLocal ? Number(m.usdToLocal).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '—'}</div>
        </div>
        <div class="wis20-kpi-card wis20-kpi-amber">
          <div class="text-xs font-extrabold opacity-90">🥇 Vàng Thế giới (PAXG)</div>
          <div class="text-lg sm:text-xl font-black tracking-tight">${m.goldUsdOz ? '$' + m.goldUsdOz.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'} <span class="text-xs font-bold opacity-95">${m.gold24hPct != null ? (m.gold24hPct >= 0 ? '▲+' : '▼') + m.gold24hPct.toFixed(1) + '%' : ''}</span></div>
        </div>
        <div class="wis20-kpi-card wis20-kpi-violet">
          <div class="text-xs font-extrabold opacity-90">₿ Bitcoin (24/7)</div>
          <div class="text-lg sm:text-xl font-black tracking-tight">${m.btcUsd ? '$' + m.btcUsd.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'} <span class="text-xs font-bold opacity-95">${m.btc24hPct != null ? (m.btc24hPct >= 0 ? '▲+' : '▼') + m.btc24hPct.toFixed(1) + '%' : ''}</span></div>
        </div>
        <div class="wis20-kpi-card wis20-kpi-emerald">
          <div class="text-xs font-extrabold opacity-90">📈 GDP ${esc(profile.name)} (${esc(m.countryGdpYear || 'WB')})</div>
          <div class="text-lg sm:text-xl font-black tracking-tight">${m.countryGdpPct != null ? m.countryGdpPct + '%' : '—'}</div>
        </div>
      </div>
    `;

    const filterBtns = `
      <div class="flex flex-wrap gap-1.5">
        <button type="button" data-raw-cat="all" class="wis20-subtab text-xs py-1.5 ${filter === 'all' ? 'is-active' : ''}">📋 Tất cả 8 trụ cột (${res.totalItems})</button>
        ${(W20.CATEGORIES || []).map((c) => {
          const cnt = res.categoriesData?.[c.id]?.length || 0;
          return `<button type="button" data-raw-cat="${c.id}" class="wis20-subtab text-xs py-1.5 ${filter === c.id ? 'is-active' : ''}">${c.icon} ${esc(c.title.replace(/^\d+\.\s*/, '').split('&')[0].trim())} (${cnt})</button>`;
        }).join('')}
      </div>
    `;

    const visibleCats = (W20.CATEGORIES || []).filter((c) => filter === 'all' || filter === c.id);
    const sectionsHtml = visibleCats.map((c) => {
      const items = res.categoriesData?.[c.id] || [];
      return `
        <div class="wis20-card space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300/50 dark:border-zinc-700/60 pb-2">
            <div>
              <h4 class="text-xs sm:text-sm font-black">${c.icon} ${esc(c.title)}</h4>
              <p class="text-[11px] opacity-75">${esc(c.desc)}</p>
            </div>
            <span class="wis20-badge" style="border-color:${c.color}; color:${c.color}">⏱️ Gợi ý ${c.minutes} phút · ${items.length} mục</span>
          </div>
          ${items.length ? `
            <div class="wis20-news-grid">
              ${items.map((it) => `
                <article class="wis20-news-item">
                  ${it.imageUrl ? `<img src="${esc(it.imageUrl)}" alt="${esc(it.title)}" loading="lazy" referrerpolicy="no-referrer" class="wis20-news-thumb" onerror="this.style.display='none'" />` : ''}
                  <div class="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div class="space-y-1">
                      <div class="flex items-center justify-between gap-1 text-[10px] opacity-70 font-bold">
                        <span class="truncate">${esc(it.source)}</span>
                        <span class="shrink-0 font-mono" title="Mã dấu vân tay xác thực nguồn (SHA-256)">#${esc(it.sha256 || '')}</span>
                      </div>
                      <h5 class="text-xs font-extrabold leading-snug">${esc(it.title)}</h5>
                      <p class="text-[11.5px] leading-relaxed opacity-80">${esc(it.summary)}</p>
                    </div>
                    <div class="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/80 text-[11px]">
                      <span class="opacity-65">⏱️ ~${it.readMinutes || 1} phút</span>
                      <a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer" class="font-extrabold text-sky-600 dark:text-sky-400 hover:underline">↗️ Mở nguồn gốc</a>
                    </div>
                  </div>
                </article>
              `).join('')}
            </div>
          ` : '<div class="text-xs opacity-70">Không có mục mới trong nhóm này lúc này.</div>'}
          ${c.id === 'local_region' && Array.isArray(profile.newsLinks) && profile.newsLinks.length ? `
            <div class="pt-2 border-t border-zinc-300/50 dark:border-zinc-700/60 flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] font-bold opacity-80">📰 Báo chí chính thống tại ${esc(profile.name)}:</span>
              ${profile.newsLinks.map((lnk) => `
                <a href="${esc(lnk.url)}" target="_blank" rel="noopener noreferrer" class="wis20-badge hover:underline text-emerald-700 dark:text-emerald-300">↗️ ${esc(lnk.label)}</a>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="space-y-3">
        ${metricStrip}
        ${filterBtns}
        ${sectionsHtml}
      </div>
    `;
  }

  function renderBriefingTabHtml() {
    if (!state.geminiParsed) {
      return `
        <div class="wis20-gemini-card text-center py-6 space-y-3">
          <div class="text-3xl">🤖</div>
          <h4 class="text-sm sm:text-base font-black">Bạn đang ở chế độ Thông tin Thô (chưa đồng bộ Gemini)</h4>
          <p class="text-xs opacity-80 max-w-lg mx-auto">
            Bạn hoàn toàn có thể đọc trọn vẹn 5 mục khoa học ở tab <b>📰 Thông tin thô</b>.
            Nếu muốn Gemini tóm tắt 60 giây, rút ra <b>Mô hình Tư duy</b> và vẽ <b>Sơ đồ Nhân Quả chuyên sâu</b>, bấm nút bên dưới để quay lại Bước 1–2 nhé!
          </p>
          <button type="button" id="wis20-btn-goto-gemini-hub" class="wis20-btn wis20-btn-gemini px-4 py-2.5">
            ✨ Mở Bước 1–2 Đồng bộ Gemini ngay
          </button>
        </div>
      `;
    }

    const sync = state.geminiParsed.syncData || {};
    const models = Array.isArray(sync.mental_models) ? sync.mental_models : [];
    return `
      <div class="space-y-3">
        ${sync.headline ? `
          <div class="wis20-raw-hero">
            <div class="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300">🧠 Tiêu điểm 20 Phút Thông Thái Hôm nay</div>
            <div class="text-sm sm:text-base font-black mt-0.5">${esc(sync.headline)}</div>
          </div>
        ` : ''}

        ${models.length ? `
          <div class="wis20-card space-y-2">
            <h4 class="text-xs sm:text-sm font-black">💡 Mô Hình Tư Duy &amp; Bài Học Áp Dụng Hôm Nay</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${models.map((mm) => `
                <div class="p-2.5 rounded-xl border border-violet-500/35 bg-violet-500/10">
                  <div class="text-xs font-black text-violet-700 dark:text-violet-300">⚡ ${esc(mm.title || '')}</div>
                  <div class="text-xs opacity-85 mt-0.5">${esc(mm.lesson || '')}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- BÁO CÁO CHÍNH THEO GIAO DIỆN TÀI CHÍNH / PDF-WORD CHUYÊN NGHIỆP -->
        <div class="exec-report-paper">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding-bottom:12px;margin-bottom:14px;border-bottom:2px solid #0f2942;">
            <div>
              <div style="font-size:11px;font-weight:900;letter-spacing:0.06em;color:#0d9488;text-transform:uppercase;">BÁO CÁO TRI THỨC CHÍNH THỐNG · 20 PHÚT THÔNG THÁI MỖI NGÀY</div>
              <div style="font-size:18px;font-weight:900;color:#0f2942;margin-top:2px;">${esc(sync.headline || `Bản tin 8 Trụ cột — ${state.scanResult?.dateLabel || ''}`)}</div>
            </div>
            <span style="padding:4px 10px;border-radius:999px;background:#0f2942;color:#ffffff;font-size:11px;font-weight:800;">📅 ${esc(state.scanResult?.dateLabel || '')}</span>
          </div>
          ${renderSimpleMarkdown(state.geminiParsed.markdownBody)}
        </div>

        <!-- PHẦN 2: SƠ ĐỒ & BIỂU ĐỒ BẢN TIN 20 PHÚT (HIỂN THỊ TRỰC TIẾP NGAY TRONG BÁO CÁO!) -->
        <div class="wis20-card space-y-3">
          <div class="exec-sec-banner" style="margin-top:0;">PHẦN 2 — SƠ ĐỒ, BIỂU ĐỒ &amp; HÌNH ẢNH BẢN TIN 20 PHÚT</div>
          ${W20.charts.renderAllChartsHtml(sync, state.scanResult)}
        </div>

        <div class="flex flex-wrap justify-end gap-2">
          <button type="button" id="wis20-btn-goto-gemini-hub" class="wis20-btn">🔄 Đổi góc nhìn / Dán lại bản Gemini khác</button>
        </div>
      </div>
    `;
  }

  function renderDashboardHtml() {
    const syncData = state.geminiParsed?.syncData || W20.buildDefaultChartDataFromRaw(state.scanResult);
    return `
      <div class="wis20-root">
        ${renderHeaderLocationBarHtml(true)}

        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap gap-1.5">
            <button type="button" data-wis20-tab="raw" class="wis20-subtab ${state.activeTab === 'raw' ? 'is-active' : ''}">📰 Thông tin thô (8 trụ cột)</button>
            <button type="button" data-wis20-tab="briefing" class="wis20-subtab ${state.activeTab === 'briefing' ? 'is-active' : ''}">🧠 Bản tin 20 phút (Gemini)${state.geminiParsed ? ' ✅' : ''}</button>
            <button type="button" data-wis20-tab="visuals" class="wis20-subtab ${state.activeTab === 'visuals' ? 'is-active' : ''}">📊 Biểu đồ, Sơ đồ &amp; Hình ảnh</button>
          </div>
          ${!state.geminiParsed ? `
            <button type="button" id="wis20-btn-top-sync-gemini" class="wis20-btn wis20-btn-gemini text-[11px] py-1.5">
              🤖 Đồng bộ Gemini (Khoa học hơn nữa)
            </button>
          ` : ''}
        </div>

        <div>
          ${state.activeTab === 'raw' ? renderRawTabHtml() : ''}
          ${state.activeTab === 'briefing' ? renderBriefingTabHtml() : ''}
          ${state.activeTab === 'visuals' ? W20.charts.renderAllChartsHtml(syncData, state.scanResult) : ''}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // BIND EVENTS & RENDER LOOP
  // ==========================================================================
  function bindEvents() {
    const root = state.hostEl;
    if (!root) return;

    // Phase 1 events
    root.querySelector('#wis20-btn-detect-gps')?.addEventListener('click', () => runGpsDetection());
    root.querySelector('#wis20-btn-retry-gps')?.addEventListener('click', () => runGpsDetection());
    root.querySelector('#wis20-btn-confirm-gps')?.addEventListener('click', () => {
      if (state.pendingLocation) confirmLocationAndScan(state.pendingLocation);
    });
    root.querySelector('#wis20-manual-country')?.addEventListener('change', (ev) => {
      state.manualCountry = ev.target.value || 'VN';
    });
    root.querySelector('#wis20-manual-city')?.addEventListener('input', (ev) => {
      state.manualCity = ev.target.value || '';
    });
    root.querySelector('#wis20-btn-confirm-manual')?.addEventListener('click', () => {
      const code = root.querySelector('#wis20-manual-country')?.value || state.manualCountry || 'VN';
      const city = (root.querySelector('#wis20-manual-city')?.value || state.manualCity || '').trim();
      const prof = W20.getCountryProfile(code);
      confirmLocationAndScan({
        source: 'manual',
        countryCode: prof.code,
        countryName: prof.name,
        flag: prof.flag,
        cityLabel: city || prof.defaultCity,
        fullAddress: city ? `${city}, ${prof.name}` : prof.name,
      });
    });

    // Shared header buttons
    const triggerExportPdf = async (btnEl) => {
      if (!state.scanResult || typeof W20.exportWisdomReportPdf !== 'function') return;
      const oldTxt = btnEl?.textContent || '';
      if (btnEl) { btnEl.disabled = true; btnEl.textContent = '⏳ Đang dựng PDF bìa & biểu đồ...'; }
      try {
        const res = await W20.exportWisdomReportPdf(state.scanResult, state.geminiParsed);
        toast(`✅ Đã xuất Báo cáo PDF sắc nét (${res.pages} trang · gồm Trang Bìa + Biểu đồ + 8 Trụ cột)!`, 'success', 4200);
      } catch (err) {
        toast('⚠️ Lỗi xuất PDF: ' + (err?.message || err), 'error', 3600);
      } finally {
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = oldTxt; }
      }
    };
    root.querySelector('#wis20-btn-export-pdf')?.addEventListener('click', (ev) => triggerExportPdf(ev.currentTarget));
    root.querySelector('#wis20-btn-export-pdf-hub')?.addEventListener('click', (ev) => triggerExportPdf(ev.currentTarget));
    root.querySelector('#wis20-btn-change-loc')?.addEventListener('click', () => openChangeLocationWarningModal());
    root.querySelector('#wis20-btn-rescan')?.addEventListener('click', () => {
      if (state.confirmedLocation) confirmLocationAndScan(state.confirmedLocation);
    });
    root.querySelector('#wis20-btn-timer-toggle')?.addEventListener('click', () => toggleStudyTimer());
    root.querySelector('#wis20-btn-timer-reset')?.addEventListener('click', () => {
      state.studySecondsLeft = 20 * 60;
      const el = root.querySelector('#wis20-study-clock');
      if (el) el.textContent = formatMmSs(state.studySecondsLeft);
    });

    // Phase 3 (Hub 2-Step + Raw Hero Button)
    root.querySelector('#wis20-btn-open-raw-now')?.addEventListener('click', () => {
      state.phase = 'dashboard';
      state.activeTab = 'raw';
      render();
    });
    root.querySelector('#wis20-focus-mode')?.addEventListener('change', (ev) => {
      state.focusMode = ev.target.value || 'balanced_20m';
    });
    root.querySelector('#wis20-custom-topic')?.addEventListener('input', (ev) => {
      state.customTopic = ev.target.value || '';
    });
    root.querySelector('#wis20-btn-copy-gemini')?.addEventListener('click', () => copyPromptAndOpenGemini());
    root.querySelector('#wis20-btn-preview-prompt')?.addEventListener('click', () => {
      const box = root.querySelector('#wis20-prompt-preview-box');
      if (!box || !state.scanResult) return;
      const ta = box.querySelector('textarea');
      if (ta) {
        ta.value = W20.buildGeminiWisdomPrompt(state.scanResult, {
          focusMode: state.focusMode,
          customTopic: state.customTopic,
        });
      }
      box.classList.toggle('hidden');
    });
    root.querySelector('#wis20-gemini-paste-box')?.addEventListener('input', (ev) => {
      state.geminiReplyRaw = ev.target.value || '';
    });
    root.querySelector('#wis20-btn-sync-gemini')?.addEventListener('click', () => syncGeminiReplyAndCountdown());
    root.querySelector('#wis20-btn-skip-cd')?.addEventListener('click', () => {
      if (state.redirectTimer) { clearInterval(state.redirectTimer); state.redirectTimer = null; }
      state.redirectCountdown = 0;
      state.phase = 'dashboard';
      state.activeTab = 'briefing';
      render();
    });

    // Phase 4 (Dashboard tabs & filters)
    root.querySelectorAll('[data-wis20-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-wis20-tab') || 'raw';
        render();
      });
    });
    root.querySelectorAll('[data-raw-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.rawCategoryFilter = btn.getAttribute('data-raw-cat') || 'all';
        render();
      });
    });
    root.querySelector('#wis20-btn-goto-gemini-hub')?.addEventListener('click', () => {
      state.phase = 'hub_2step';
      render();
    });
    root.querySelector('#wis20-btn-top-sync-gemini')?.addEventListener('click', () => {
      state.phase = 'hub_2step';
      render();
    });
  }

  function render() {
    if (!state.hostEl || !state.hostEl.isConnected) return;
    if (state.phase === 'location_gate') {
      state.hostEl.innerHTML = renderLocationGateHtml();
    } else if (state.phase === 'scanning') {
      state.hostEl.innerHTML = renderScanningHtml();
    } else if (state.phase === 'hub_2step') {
      state.hostEl.innerHTML = renderHub2StepHtml();
    } else {
      state.hostEl.innerHTML = renderDashboardHtml();
    }
    bindEvents();
    NS.i18n?.translateElement?.(state.hostEl);
  }

  W20.mountIntoContainer = async function mountIntoContainer(hostEl) {
    if (!hostEl) return;
    state.hostEl = hostEl;
    render();
    // Tự động dò GPS nhẹ nhàng ngay khi mở lần đầu (nhưng KHÔNG bỏ qua nút xác nhận!)
    if (state.phase === 'location_gate' && state.gpsStatus === 'idle' && !state.pendingLocation) {
      runGpsDetection();
    }
  };

  W20.destroy = function destroy() {
    clearTimersAndAbort();
    if (state.hostEl) {
      state.hostEl.innerHTML = '';
      state.hostEl = null;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
