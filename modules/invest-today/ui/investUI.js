/**
 * ============================================================================
 * 🎨 ĐẦU TƯ HÔM NAY — GIAO DIỆN 4 THẺ BÌNH DÂN, KHÔNG ĐẶC NÚT & DỌN RAM TRIỆT ĐỂ
 * File: modules/invest-today/ui/investUI.js
 * ============================================================================
 */
(function initInvestTodayUI(globalScope) {
  'use strict';

  const INV = (globalScope.NoirInvestToday = globalScope.NoirInvestToday || {});
  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  function signalBadgeHtml(signal, label) {
    const map = {
      positive: { cls: 'inv-sig-positive', icon: '🟢', text: label || 'Thuận lợi / An toàn' },
      neutral: { cls: 'inv-sig-neutral', icon: '🔵', text: label || 'Bình thường / Trung lập' },
      caution: { cls: 'inv-sig-caution', icon: '🟠', text: label || 'Cần cẩn trọng' },
      danger: { cls: 'inv-sig-danger', icon: '🔴', text: label || 'Rủi ro cao / Cảnh báo' },
    };
    const m = map[signal] || map.neutral;
    return `<span class="inv-pill ${m.cls}">${m.icon} ${INV.utils.escapeHtml(m.text)}</span>`;
  }

  function disclaimerFooterHtml() {
    return `
      <div class="inv-disclaimer-footer" data-inv-disclaimer="true">
        <span>⚠️</span>
        <span><strong>Lưu ý:</strong> ${INV.utils.escapeHtml(INV.MANDATORY_DISCLAIMER)}.</span>
      </div>`;
  }

  function meterColor(signal) {
    if (signal === 'positive') return '#10b981';
    if (signal === 'caution') return '#f59e0b';
    if (signal === 'danger') return '#f43f5e';
    return '#3b82f6';
  }

  // Trạng thái nhập liệu cục bộ của máy tính tiền vay & pháp y (nhỏ gọn, xóa khi destroy)
  let uiState = {
    gateLoading: false,
    gateStatus: '',
    gateError: '',
    gateCountry: 'VN',
    gateAreaInput: '',
    pendingGpsRegion: null,
    wizardStage: 'location_gate', // 'location_gate' | 'loading_full_scan' | 'two_step_setup' | 'dashboard'
    loadingPct: 0,
    loadingLabel: '',
    loadingDone: false,
    w2Focus: 'general',
    w2Mode: 'veteran30',
    w2AutoMergeNotice: '',
    w2SyncCountdown: null, // { sec, msg }
    w2CountdownTimerId: null,
    evalProgress: null,
    goldLoading: false,
    goldError: '',
    stockLoading: false,
    stockError: '',
    stockInput: '',
    showVnIndex: false,
    reLoading: false,
    reError: '',
    reManualInput: '',
    mortgageInputs: {
      priceBillion: 5,
      loanBillion: 3.5,
      years: 20,
      grossRentMillion: 9.67,
      ratePct: 12,
    },
    forensicInputs: {
      revenue: '',
      ebit: '',
      ebt: '',
      netIncome: '',
      cfo: '',
      totalAssets: '',
      equity: '',
      totalLiabilities: '',
      workingCapital: '',
      retainedEarnings: '',
      marketCap: '',
    },
    forensicResult: null,
    anonymizeGemini: true,
    auditLogs: null,
    showChecklistModal: false,
    goldHistory30d: null,
    healthChecks: null,
    healthLoading: false,
    surveyDraft: {
      pricePerM2: '',
      rentPerMonth: '',
      roadWidthM: '5.5',
      legalStatus: 'Sổ hồng/đỏ riêng',
      nightLightPct: '75',
      infraStage: 'Đang thi công',
      floodNote: '',
    },
  };

  function resetUiState() {
    if (uiState.w2CountdownTimerId) {
      clearInterval(uiState.w2CountdownTimerId);
    }
    uiState = {
      gateLoading: false,
      gateStatus: '',
      gateError: '',
      gateCountry: 'VN',
      gateAreaInput: '',
      pendingGpsRegion: null,
      wizardStage: 'location_gate',
      loadingPct: 0,
      loadingLabel: '',
      loadingDone: false,
      w2Focus: 'general',
      w2Mode: 'veteran30',
      w2AutoMergeNotice: '',
      w2SyncCountdown: null,
      w2CountdownTimerId: null,
      evalProgress: null,
      goldLoading: false,
      goldError: '',
      stockLoading: false,
      stockError: '',
      stockInput: '',
      showVnIndex: false,
      reLoading: false,
      reError: '',
      reManualInput: '',
      mortgageInputs: {
        priceBillion: 5,
        loanBillion: 3.5,
        years: 20,
        grossRentMillion: 9.67,
        ratePct: 12,
      },
      forensicInputs: {
        revenue: '',
        ebit: '',
        ebt: '',
        netIncome: '',
        cfo: '',
        totalAssets: '',
        equity: '',
        totalLiabilities: '',
        workingCapital: '',
        retainedEarnings: '',
        marketCap: '',
      },
      forensicResult: null,
      anonymizeGemini: true,
      auditLogs: null,
      showChecklistModal: false,
      goldHistory30d: null,
      healthChecks: null,
      healthLoading: false,
      surveyDraft: {
        pricePerM2: '',
        rentPerMonth: '',
        roadWidthM: '5.5',
        legalStatus: 'Sổ hồng/đỏ riêng',
        nightLightPct: '75',
        infraStage: 'Đang thi công',
        floodNote: '',
      },
    };
  }

  // --------------------------------------------------------------------------
  // RENDER TỪNG THẺ (4 THẺ CHÍNH)
  // --------------------------------------------------------------------------
  function renderOverviewTab() {
    const esc = INV.utils.escapeHtml;
    const kb = INV.stateManager.activeKnowledge;
    const prefs = INV.storageAdapter.getPrefs();
    const report = INV.stateManager.evaluationReport;
    const isRunning = INV.stateManager.runningEval;
    const prog = uiState.evalProgress;

    const layersMeta = [
      { key: 'geopolitics_events', title: '🌐 Địa chính trị, Chiến tranh, Lãnh đạo, Hiệp định & Tập đoàn lớn' },
      { key: 'global_macro', title: '🌍 Tình hình thế giới (Dòng tiền, Lãi suất, Nợ công & DXY)' },
      { key: 'vn_macro', title: '🏳️ Tình hình kinh tế & tiền tệ tại Quốc gia của bạn (GDP, CPI, Tỷ giá & FDI)' },
      { key: 'gold', title: '🥇 Kênh Vàng (Thế giới, SJC/9999 & Chính sách)' },
      { key: 'stock', title: '📊 Kênh Chứng khoán (Định giá, Margin & Khối ngoại)' },
      { key: 'real_estate', title: '🏘️ Kênh Nhà đất (Lãi vay, Tiền thuê, KCN & Luật mới)' },
    ];

    const checklistPreviewHtml = uiState.showChecklistModal && kb
      ? `<div class="inv-card-soft mt-3 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="text-xs font-extrabold">📋 Danh sách ${(kb.search_checklist || []).length} đề mục kiểm tra từ: ${esc(kb.metadata?.source_file || 'File kiến thức')}</div>
            <button type="button" id="inv-btn-close-checklist" class="text-[11px] font-bold text-rose-600 dark:text-rose-400 underline">Thu gọn</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
            ${(kb.search_checklist || [])
              .map(
                (it, i) => `
              <div class="text-[11.5px] p-2 rounded-lg bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800">
                <div class="font-bold">${i + 1}. ${esc(it.plain_label)}</div>
                <div class="text-[10.5px] text-zinc-500 dark:text-zinc-400">Tham chiếu: ${esc(it.baseline_2026_11_24 || it.technical_label)}</div>
              </div>`
              )
              .join('')}
          </div>
        </div>`
      : '';

    let reportHtml = '';
    if (report) {
      const channels = Object.values(report.channel_scores || {});
      reportHtml = `
        <div class="space-y-4">
          <!-- Tóm tắt pha chu kỳ + trạng thái -->
          <div class="inv-card inv-sig-neutral">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-xs font-extrabold uppercase tracking-wide">🧭 Giai đoạn kinh tế hiện tại</div>
              <div class="text-[11px] opacity-80">Ngày chốt: ${esc(report.as_of_date)} · ✅ ${report.live_count} nguồn API trực tiếp${report.benchmark_count ? ` · 📘 ${report.benchmark_count} mốc Cẩm nang` : ''}</div>
            </div>
            <div class="text-sm font-extrabold mt-1">${esc(report.cycle_phase?.label || '')}</div>
            <p class="text-xs mt-1 opacity-90">${esc(report.cycle_phase?.plain_advice || '')}</p>
          </div>

          <!-- 4 ô tóm tắt 5 giây -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${channels
              .map(
                (ch) => `
              <div class="inv-card flex flex-col justify-between gap-2">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-extrabold">${esc(ch.name)}</span>
                    <span class="inv-num text-xs font-black">${ch.score}/100</span>
                  </div>
                  <div class="inv-meter-track mt-1.5">
                    <div class="inv-meter-fill" style="width:${Math.max(5, Math.min(100, ch.score))}%; background:${meterColor(ch.signal)}"></div>
                  </div>
                  <div class="mt-2">${signalBadgeHtml(ch.signal, ch.badge)}</div>
                </div>
                <p class="text-[11.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">${esc(ch.reason)}</p>
              </div>`
              )
              .join('')}
          </div>

          <!-- Cảnh báo 5 Chốt chặn an toàn -->
          ${
            (report.triggered_breakers || []).length
              ? `<div class="inv-card space-y-2 border-rose-500/40 bg-rose-500/5">
                  <div class="text-xs font-extrabold text-rose-700 dark:text-rose-300">🛡️ Kiểm tra 5 Chốt chặn an toàn bắt buộc</div>
                  ${report.triggered_breakers
                    .map(
                      (b) => `
                    <div class="p-2.5 rounded-xl border ${b.severity === 'danger' ? 'inv-sig-danger' : b.severity === 'caution' ? 'inv-sig-caution' : 'inv-sig-neutral'} text-xs">
                      <div class="font-extrabold">${esc(b.title)}</div>
                      <div class="mt-0.5 opacity-90">${esc(b.detail)}</div>
                    </div>`
                    )
                    .join('')}
                </div>`
              : ''
          }

          <!-- Trạm Tin tức Nguyên bản (có Checkbox chọn đưa vào Prompt + Link bài báo gốc) -->
          ${
            (report.live_headlines || []).length
              ? `<div class="inv-card space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="text-xs font-extrabold text-sky-700 dark:text-sky-300">🌐 Tin nóng Địa chính trị, Lãnh đạo, Thuế quan &amp; Vĩ mô Nguyên bản (${report.live_headlines.filter((x) => x.selected_for_prompt !== false).length}/${report.live_headlines.length} tin đang đưa vào Prompt)</div>
                    ${
                      report.guardrail_stats
                        ? `<span class="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">🛡️ Khóa 0% bịa đặt SHA-256: Hợp lệ ${report.guardrail_stats.acceptedCount}/${report.guardrail_stats.scanned} · Loại ${report.guardrail_stats.rejectedCount} tin trùng/lỗi</span>`
                        : '<span class="text-[10.5px] text-zinc-500">Tick chọn bài báo muốn AI đọc kỹ</span>'
                    }
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                    ${report.live_headlines
                      .map(
                        (h, idx) => {
                          const topMatch = Array.isArray(h.matched_checklists) && h.matched_checklists[0];
                          return `
                      <div class="p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:border-emerald-500 transition text-xs flex items-start gap-2">
                        <input type="checkbox" data-inv-news-chk="${idx}" ${h.selected_for_prompt !== false ? 'checked' : ''} class="mt-0.5 accent-emerald-600 cursor-pointer shrink-0" title="Đưa bài báo này vào câu lệnh Gemini" />
                        <a href="${esc(h.url)}" target="_blank" rel="noopener noreferrer" class="min-w-0 flex-1 space-y-0.5 block">
                          <div class="font-bold line-clamp-2">${esc(h.title)}</div>
                          ${
                            topMatch
                              ? `<div class="text-[10px] font-bold text-amber-600 dark:text-amber-300 truncate">🎯 Khớp: ${esc(topMatch.checklist_name)} [${esc((topMatch.triggers || []).slice(0, 3).join(', '))}] (+${topMatch.score}đ)</div>`
                              : ''
                          }
                          <div class="text-[10.5px] text-zinc-500 flex justify-between gap-2">
                            <span class="truncate">${esc(h.source)} · ${esc(h.date || '')}</span>
                            <span class="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">Nguồn gốc ↗</span>
                          </div>
                        </a>
                      </div>`;
                        }
                      )
                      .join('')}
                  </div>
                </div>`
              : ''
          }

          <!-- Nhận xét cân bằng 2 chiều -->
          <div class="inv-card space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-sm font-extrabold">💡 Nhận xét tổng hợp cho hiện tại &amp; 6–12 tháng tới</div>
              <button type="button" id="inv-btn-save-audit" class="inv-secondary-btn text-xs">💾 Lưu vào nhật ký theo dõi</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="p-3 rounded-xl inv-sig-positive text-xs space-y-1.5">
                <div class="font-extrabold">✨ Điểm sáng &amp; Cơ hội</div>
                <ul class="list-disc pl-4 space-y-1">
                  ${(report.narrative_summary?.opportunities || []).map((t) => `<li>${esc(t)}</li>`).join('')}
                </ul>
              </div>
              <div class="p-3 rounded-xl inv-sig-danger text-xs space-y-1.5">
                <div class="font-extrabold">⚠️ Rủi ro &amp; Cái bẫy cần tránh</div>
                <ul class="list-disc pl-4 space-y-1">
                  ${(report.narrative_summary?.risks || []).map((t) => `<li>${esc(t)}</li>`).join('')}
                </ul>
              </div>
            </div>
            <div class="inv-card-soft text-xs space-y-1.5">
              <div><strong>Hiện tại:</strong> ${esc(report.narrative_summary?.current_outlook || '')}</div>
              <div><strong>Giai đoạn tới (6–12 tháng):</strong> ${esc(report.narrative_summary?.upcoming_outlook || '')}</div>
              <div class="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                📌 <strong>Nguyên tắc chia vốn an toàn:</strong> Thận trọng (40% Tiền / 20% CK / 10% Vàng / 30% BĐS) · Cân bằng (25% / 35% / 10% / 30%) · Chủ động (15% / 45% / 10% / 30%). Tái cân bằng theo dải 5/25 bằng dòng tiền tiết kiệm mới.
              </div>
            </div>
          </div>

          <!-- Bảng chi tiết từng đề mục đã tìm kiếm (gập mở gọn gàng) -->
          <details class="inv-details inv-card">
            <summary class="flex items-center justify-between text-xs font-extrabold">
              <span>🔎 Xem chi tiết ${(report.items || []).length} đề mục đã kiểm tra &amp; nguồn đối chiếu</span>
              <span class="text-emerald-600 dark:text-emerald-400">▼ Mở rộng</span>
            </summary>
            <div class="mt-3 space-y-3">
              ${layersMeta
                .map((grp) => {
                  const rows = (report.items || []).filter((it) => it.layer === grp.key);
                  if (!rows.length) return '';
                  return `
                  <div class="space-y-1.5">
                    <div class="text-xs font-extrabold text-zinc-700 dark:text-zinc-200">${grp.title}</div>
                    <div class="space-y-1.5">
                      ${rows
                        .map(
                          (it) => `
                        <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 text-xs space-y-1">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="font-bold">${esc(it.plain_label)}</span>
                            ${signalBadgeHtml(it.signal, it.status === 'DATA_MISSING' ? 'Thiếu nguồn live' : undefined)}
                          </div>
                          <div class="inv-num font-extrabold text-zinc-900 dark:text-white">
                            ${it.value ? esc(it.value) : '<span class="text-amber-600 dark:text-amber-300">Chưa có nguồn live trực tiếp (DATA_MISSING)</span>'}
                          </div>
                          <div class="text-[11.5px] text-zinc-600 dark:text-zinc-300">${esc(it.plain_explanation)}</div>
                          <div class="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-zinc-500">
                            <span>Ngày: ${esc(it.as_of_date)}</span>
                            <a href="${esc(it.source_url)}" target="_blank" rel="noopener noreferrer" class="text-emerald-600 dark:text-emerald-400 font-bold underline">🔗 ${esc(it.source_name)}</a>
                          </div>
                        </div>`
                        )
                        .join('')}
                    </div>
                  </div>`;
                })
                .join('')}
            </div>
          </details>
        </div>`;
    }

    return `
      <div class="space-y-4">
        <!-- Khối 1: Trạng thái File Kiến Thức Chuyên Gia -->
        <div class="inv-card-soft">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs">
              <span class="font-extrabold text-emerald-700 dark:text-emerald-400">📘 Đã nạp bộ kiến thức chuẩn:</span>
              <span class="font-semibold">${esc(kb?.metadata?.short_title || 'Khung Phân Tích Đầu Tư (7 chương)')}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-[11.5px]">
              <button type="button" id="inv-btn-toggle-checklist" class="font-bold text-sky-600 dark:text-sky-400 underline cursor-pointer">Xem các mục kiểm tra</button>
              <label class="font-bold text-emerald-700 dark:text-emerald-400 underline cursor-pointer">
                Đổi file khác (.docx/.pdf)
                <input type="file" id="inv-inp-upload-kb" accept=".docx,.pdf,.md,.txt,.json" class="hidden" />
              </label>
              ${
                INV.stateManager.isCustomKnowledge
                  ? '<button type="button" id="inv-btn-restore-kb" class="font-bold text-amber-600 dark:text-amber-300 underline cursor-pointer">Khôi phục mặc định</button>'
                  : ''
              }
            </div>
          </div>
          ${checklistPreviewHtml}
        </div>

        <!-- Khối 2: KHUNG NỔI BẬT SÁNG NHẤP NHÁY — BƯỚC 1 (TRA CỨU TOÀN DIỆN) -> BƯỚC 2 (GỬI GEMINI) -> BƯỚC 3 (DÁN ĐỒNG BỘ BIỂU ĐỒ) -->
        <div class="inv-card inv-workflow-glow-card text-center space-y-3.5">
          <!-- BƯỚC 1 -->
          <div class="space-y-2">
            <div class="flex flex-wrap items-center justify-center gap-2">
              <span class="inv-step-badge">⚡ BƯỚC 1: TRA CỨU THÔNG TIN TOÀN DIỆN (0% BỊA ĐẶT · KHÓA NGUỒN SHA-256)</span>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-3 text-xs">
              <span class="text-zinc-500 dark:text-zinc-400 font-semibold">Mức độ quét tin:</span>
              <label class="inline-flex items-center gap-1 cursor-pointer font-extrabold text-emerald-700 dark:text-emerald-300">
                <input type="radio" name="inv-depth" value="full" ${(prefs.scanDepth || 'full') === 'full' ? 'checked' : ''} /> Toàn diện (${(kb?.search_checklist || []).length || 34} mục — Mặc định)
              </label>
              <label class="inline-flex items-center gap-1 cursor-pointer font-bold">
                <input type="radio" name="inv-depth" value="quick" ${prefs.scanDepth === 'quick' ? 'checked' : ''} /> Nhanh (15 mục chính)
              </label>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-3">
              <button type="button" id="inv-btn-run-eval" class="inv-primary-btn shadow-lg" ${isRunning ? 'disabled' : ''}>
                ${isRunning ? '⏳ Đang quét nguồn chính thống &amp; lọc 0% bịa đặt...' : '🔍 Tra cứu thông tin toàn diện, lọc chuẩn &amp; tổng hợp'}
              </button>
              ${
                isRunning
                  ? '<button type="button" id="inv-btn-stop-eval" class="inv-secondary-btn text-rose-600 border-rose-500/40">⏹ Dừng lại</button>'
                  : ''
              }
            </div>
            <p class="text-[11.5px] text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
              Trích xuất nguyên văn từ các nguồn chính thống (Bộ Tài chính Mỹ, World Bank, Binance/Coinbase, ExchangeRate DXY, báo tài chính &amp; RSS) qua <strong>5 chốt khóa bịa đặt 0%</strong> rồi tự động đổ vào bảng số liệu &amp; Tab <strong>Biểu đồ phân tích chuyên nghiệp</strong>.
            </p>
          </div>

          ${
            isRunning && prog
              ? `<div class="max-w-lg mx-auto text-left space-y-1.5 pt-1">
                  <div class="flex justify-between text-[11.5px] font-bold">
                    <span>${esc(prog.label)}</span>
                    <span class="inv-num">${prog.pct}%</span>
                  </div>
                  <div class="inv-meter-track">
                    <div class="inv-meter-fill bg-emerald-500" style="width:${prog.pct}%"></div>
                  </div>
                </div>`
              : ''
          }

          <!-- BƯỚC 2 -->
          <div class="pt-3 border-t border-emerald-500/25 flex flex-col items-center gap-2">
            <span class="inv-step-badge" style="background:rgba(124,58,237,0.18);color:#c4b5fd;border-color:rgba(139,92,246,0.45);">🤖 BƯỚC 2: TỔNG HỢP CÂU LỆNH ĐỒNG BỘ CODE &amp; HỎI GEMINI</span>
            <div class="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span class="text-zinc-500 dark:text-zinc-400">Chế độ hỏi Gemini:</span>
              <label class="inline-flex items-center gap-1 cursor-pointer font-bold">
                <input type="radio" name="inv-prompt-mode" value="veteran30" ${(prefs.promptMode || 'veteran30') === 'veteran30' ? 'checked' : ''} /> 🏆 Chuyên gia 30 năm (Bình dân 6 phần)
              </label>
              <label class="inline-flex items-center gap-1 cursor-pointer font-bold">
                <input type="radio" name="inv-prompt-mode" value="audit" ${prefs.promptMode === 'audit' ? 'checked' : ''} /> ⚖️ Kiểm toán 2 chiều (Bò vs Gấu)
              </label>
              <label class="inline-flex items-center gap-1 cursor-pointer font-bold">
                <input type="radio" name="inv-prompt-mode" value="plain" ${prefs.promptMode === 'plain' ? 'checked' : ''} /> 📘 Tóm gọn
              </label>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2">
              <button type="button" id="inv-btn-gemini-split" class="inv-gemini-btn">
                🪟 Tự động sao chép &amp; Chia đôi màn hình với Gemini
              </button>
              <button type="button" id="inv-btn-gemini-api-direct" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg cursor-pointer transition">
                ⚡ Gọi Gemini API Trực Tiếp (1 chạm)
              </button>
            </div>
            <span class="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xl">
              100% miễn phí — câu lệnh yêu cầu Gemini trả lời dễ hiểu kèm khối cấu trúc chuẩn <code>INVEST_INTEL_SYNC_V2</code> để Web đọc hiểu &amp; vẽ trọn bộ 6 biểu đồ chuyên nghiệp!
            </span>
            <div class="p-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-900 dark:text-amber-200 max-w-xl text-left">
              📱 <b>Mẹo riêng trên Điện thoại (Mobile):</b> Khi dán văn bản dài sang Gemini hoặc dán lại vào Bước 3, hãy <b>CHẠM GIỮ ngón tay 1–2 giây vào khung nhập → bấm nút "Dán"</b> hiện ra <i>(tránh bấm vào gợi ý nhanh trên bàn phím điện thoại vì dễ cắt thiếu dòng!)</i>.
            </div>
          </div>

          <!-- BƯỚC 3 -->
          <details class="inv-details pt-2.5 border-t border-emerald-500/20 text-left">
            <summary class="flex flex-wrap items-center justify-center gap-2 text-xs font-extrabold text-sky-600 dark:text-sky-300 cursor-pointer">
              <span>📥 BƯỚC 3 (Tùy chọn): Dán câu trả lời Gemini vào đây → Web tự cập nhật mọi ô dữ liệu &amp; vẽ 6 Biểu đồ chuyên nghiệp</span>
              <span class="underline">▼ Mở ô dán</span>
            </summary>
            <div class="mt-2.5 space-y-2 max-w-2xl mx-auto">
              <div class="p-2 rounded-lg border border-sky-500/35 bg-sky-500/10 text-[11px] text-sky-900 dark:text-sky-200">
                📱 <b>Trên Điện thoại:</b> Chạm giữ <b>1–2 giây</b> vào khung dưới rồi bấm đúng nút <b>"Dán"</b> (không dùng nút dán gợi ý trên bàn phím để tránh thiếu dòng).
              </div>
              <textarea id="inv-inp-gemini-paste-ov" rows="4" placeholder="PC: nhấn Ctrl + V | Mobile: CHẠM GIỮ 1–2 giây vào ô này rồi bấm nút 'Dán'..." class="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950 text-xs font-mono"></textarea>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] text-zinc-500">Web chỉ đọc đúng cấu trúc chuẩn <code>INVEST_INTEL_SYNC_V2</code> — an toàn, không làm sai lệch số liệu.</span>
                <button type="button" id="inv-btn-sync-gemini-ov" class="inv-primary-btn py-1.5 px-3.5 text-xs">⚡ Đồng bộ dữ liệu &amp; Mở Biểu đồ chuyên nghiệp</button>
              </div>
            </div>
          </details>
        </div>

        <!-- Khối 3: Báo cáo kết quả -->
        ${reportHtml}

        <!-- Cài đặt Nguồn API, Kiểm tra Sức khỏe Hệ thống & Nhật ký Kiểm toán (đóng gọn mặc định) -->
        <details class="inv-details inv-card-soft">
          <summary class="flex items-center justify-between text-xs font-extrabold">
            <span>⚙️ Cài đặt Nguồn Dữ liệu (API Keys / Worker), Sức khỏe API &amp; Nhật ký Quyết định</span>
            <span class="text-zinc-500">▼ Mở rộng</span>
          </summary>
          <div class="mt-3 space-y-3 text-xs">
            <div class="space-y-2">
              <div class="font-bold">🌐 Trạng thái kết nối dữ liệu: ${
                INV.networkAdapter.isDesktopElectron()
                  ? '<span class="text-emerald-600 dark:text-emerald-400">Bản Desktop Electron (Gọi trực tiếp RSS / SJC / SSI / Chợ Tốt không bị chặn CORS)</span>'
                  : '<span>Bản Web trình duyệt (10+ API CORS=* chạy thẳng; gắn thêm Cloudflare Worker miễn phí để mở khóa thêm RSS/SJC/SSI)</span>'
              }</div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label class="space-y-1">
                  <span class="text-[11px] text-zinc-500">Cloudflare Worker URL (tùy chọn bản Web):</span>
                  <input type="url" id="inv-inp-proxy-url" value="${esc(prefs.proxyUrl || '')}" placeholder="https://your-worker.workers.dev" class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs" />
                </label>
                <label class="space-y-1">
                  <span class="text-[11px] text-zinc-500">FRED API Key (tùy chọn — TIPS 10Y DFII10):</span>
                  <input type="password" id="inv-inp-fred-key" value="${esc(prefs.fredApiKey || '')}" placeholder="Miễn phí tại fred.stlouisfed.org" class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs" />
                </label>
                <label class="space-y-1">
                  <span class="text-[11px] text-zinc-500">TCBS OpenAPI Key (tùy chọn):</span>
                  <input type="password" id="inv-inp-tcbs-key" value="${esc(prefs.tcbsApiKey || '')}" placeholder="Khóa cá nhân TCBS (nếu có)" class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs" />
                </label>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" id="inv-btn-save-proxy" class="inv-secondary-btn text-xs font-extrabold">💾 Lưu cấu hình nguồn API</button>
                <button type="button" id="inv-btn-check-health" class="inv-secondary-btn text-xs font-extrabold" ${uiState.healthLoading ? 'disabled' : ''}>${uiState.healthLoading ? '⏳ Đang đo các nguồn API...' : '🩺 Kiểm tra sức khỏe các nguồn API ngay'}</button>
              </div>
              ${
                Array.isArray(uiState.healthChecks)
                  ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      ${uiState.healthChecks
                        .map(
                          (c) => `
                        <div class="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 flex items-center justify-between gap-2 text-[11px]">
                          <span class="font-bold truncate">${c.status === 'ok' ? '🟢' : c.status === 'partial' ? '🟡' : '🔴'} ${esc(c.name)}</span>
                          <span class="text-zinc-500 shrink-0">${c.ms ? `${c.ms}ms` : esc(c.note || c.error || '')}</span>
                        </div>`
                        )
                        .join('')}
                    </div>`
                  : ''
              }
            </div>

            <div class="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold">📒 Nhật ký Kiểm toán Quyết định (tối đa 30 bản lưu trên máy)</span>
                <button type="button" id="inv-btn-load-logs" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Tải danh sách</button>
              </div>
              <div id="inv-audit-logs-box" class="space-y-1.5">
                ${
                  Array.isArray(uiState.auditLogs)
                    ? uiState.auditLogs.length
                      ? uiState.auditLogs
                          .map(
                            (lg) => `
                          <div class="p-2 rounded-lg bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                            <div class="min-w-0">
                              <div class="font-bold truncate">${esc(lg.asOfDate)} — ${esc(lg.title || 'Bản đánh giá đầu tư')}</div>
                              <div class="text-[11px] text-zinc-500 truncate">${esc(lg.summary || '')}</div>
                            </div>
                            <button type="button" data-inv-del-log="${esc(lg.id)}" class="text-rose-500 font-bold text-[11px] shrink-0">Xóa</button>
                          </div>`
                          )
                          .join('')
                      : '<div class="text-zinc-500">Chưa có bản ghi nhật ký nào. Sau khi chạy đánh giá, bấm "Lưu vào nhật ký theo dõi" để lưu lại đối chiếu sau 6–12 tháng.</div>'
                    : '<div class="text-zinc-500">Bấm "Tải danh sách" để mở lịch sử (chỉ đọc IndexedDB khi bạn cần).</div>'
                }
              </div>
            </div>
          </div>
        </details>

        ${disclaimerFooterHtml()}
      </div>`;
  }

  function renderGoldTab() {
    const esc = INV.utils.escapeHtml;
    const fmtM = INV.utils.formatMillions;
    const fmtV = INV.utils.formatVnd;
    const g = INV.stateManager.goldData;

    if (uiState.goldLoading && !g) {
      return `
        <div class="inv-card text-center py-8 space-y-2">
          <div class="text-sm font-extrabold">⏳ Đang cập nhật giá vàng thế giới, tỷ giá ngân hàng &amp; quy đổi...</div>
          <div class="text-xs text-zinc-500">Chỉ tải dữ liệu khi bạn bấm vào thẻ Giá vàng — không chạy ngầm tốn máy.</div>
        </div>`;
    }

    const renderDomesticCard = (title, obj, prefix) => {
      if (!obj) return '';
      const diffSign = obj.diffRawVnd >= 0 ? '+' : '';
      return `
        <div class="inv-card space-y-2.5">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-sm font-extrabold">${title}</h4>
            ${signalBadgeHtml(obj.breakerTriggered ? 'danger' : obj.premiumStatus.signal)}
          </div>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div class="inv-card-soft">
              <div class="text-[11px] text-zinc-500">Tiệm mua vào</div>
              <div class="inv-num text-base font-black text-emerald-700 dark:text-emerald-400">${fmtM(obj.buyVnd)}</div>
            </div>
            <div class="inv-card-soft">
              <div class="text-[11px] text-zinc-500">Tiệm bán ra</div>
              <div class="inv-num text-base font-black text-rose-700 dark:text-rose-400">${fmtM(obj.sellVnd)}</div>
            </div>
          </div>
          <div class="text-xs space-y-1">
            <div class="flex justify-between gap-2">
              <span class="text-zinc-600 dark:text-zinc-400">Đang đắt hơn thế giới:</span>
              <span class="inv-num font-extrabold ${obj.diffRawPercent > 10 ? 'text-rose-600 dark:text-rose-400' : ''}">
                ${Number.isFinite(obj.diffRawVnd) ? `${diffSign}${fmtM(obj.diffRawVnd)} (${diffSign}${obj.diffRawPercent.toFixed(2)}%)` : '—'}
              </span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-zinc-600 dark:text-zinc-400">Mua xong bán lại mất ngay:</span>
              <span class="inv-num font-extrabold ${obj.spreadPercent > 3 ? 'text-rose-600 dark:text-rose-400' : ''}">
                ${Number.isFinite(obj.spreadVnd) ? `${fmtM(obj.spreadVnd)} (${obj.spreadPercent.toFixed(2)}%)` : '—'}
              </span>
            </div>
          </div>
          <p class="text-[11.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">${esc(obj.premiumStatus.text)}</p>
        </div>`;
    };

    return `
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-xs text-zinc-500 dark:text-zinc-400">
            ${
              g
                ? `Cập nhật ${g.fromCache ? `cách đây ${g.ageMinutes} phút (bộ nhớ tạm)` : 'mới nhất vừa xong'} · ${g.domesticLive ? 'Giá SJC trực tiếp' : 'Giá thế giới & tỷ giá live (có thể chỉnh tay giá tiệm vàng bên dưới)'}`
                : 'Chưa có dữ liệu giá vàng.'
            }
          </div>
          <button type="button" id="inv-btn-refresh-gold" class="inv-secondary-btn text-xs" ${uiState.goldLoading ? 'disabled' : ''}>
            ${uiState.goldLoading ? '⏳ Đang tải...' : '🔄 Cập nhật giá mới'}
          </button>
        </div>

        ${
          uiState.goldError
            ? `<div class="inv-card inv-sig-caution text-xs">⚠️ ${esc(uiState.goldError)}</div>`
            : ''
        }

        ${
          g
            ? `
          <!-- Thanh trạng thái 3 giây -->
          <div class="inv-card ${g.overallSignal === 'danger' ? 'inv-sig-danger' : g.overallSignal === 'caution' ? 'inv-sig-caution' : g.overallSignal === 'positive' ? 'inv-sig-positive' : 'inv-sig-neutral'}">
            <div class="text-sm font-extrabold">${esc(g.overallHeadline)}</div>
          </div>

          <!-- 2 thẻ SJC & Nhẫn 9999 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${renderDomesticCard('🏅 Vàng miếng SJC (1 lượng)', g.sjc, 'sjc')}
            ${renderDomesticCard('💍 Vàng nhẫn trơn 9999 (1 lượng)', g.ring9999, 'ring')}
          </div>

          <!-- Hàng phụ giá thế giới & tỷ giá -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
            <div class="inv-card-soft">
              <div class="text-[11px] text-zinc-500">Giá vàng thế giới (XAU/USD)</div>
              <div class="inv-num text-sm font-black">${Number.isFinite(g.worldPriceUsd) ? fmtV(g.worldPriceUsd, 2) + ' USD/oz' : 'Chưa lấy được'}</div>
            </div>
            <div class="inv-card-soft">
              <div class="text-[11px] text-zinc-500">Tỷ giá bán USD tham chiếu</div>
              <div class="inv-num text-sm font-black">${Number.isFinite(g.vcbSellRate) ? fmtV(g.vcbSellRate, 0) + ' đ' : 'Chưa lấy được'}</div>
            </div>
            <div class="inv-card-soft">
              <div class="text-[11px] text-zinc-500">Giá thế giới quy đổi sang tiền Việt</div>
              <div class="inv-num text-sm font-black text-sky-700 dark:text-sky-400">${fmtM(g.rawWorldPriceVnd)}/lượng</div>
            </div>
          </div>

          <!-- Chỉnh nhanh số tiệm vàng thực tế (khi cần so sánh giá SJC/DOJI/PNJ/BTMC ngay tại tiệm) -->
          <details class="inv-details inv-card-soft">
            <summary class="flex items-center justify-between text-xs font-extrabold">
              <span>🧮 Tự nhập giá tiệm vàng gần bạn để tính độ đắt &amp; mức lỗ tức thì (và xem công thức Landed Parity)</span>
              <span class="text-emerald-600 dark:text-emerald-400">▼ Mở rộng</span>
            </summary>
            <div class="mt-3 space-y-3 text-xs">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label class="space-y-1">
                  <span class="text-[11px] text-zinc-500">Thế giới (USD/oz)</span>
                  <input type="number" step="0.1" id="inv-gold-in-xau" value="${Number.isFinite(g.worldPriceUsd) ? g.worldPriceUsd.toFixed(1) : '3638'}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
                </label>
                <label class="space-y-1">
                  <span class="text-[11px] text-zinc-500">Tỷ giá USD/VND</span>
                  <input type="number" step="10" id="inv-gold-in-fx" value="${Number.isFinite(g.vcbSellRate) ? Math.round(g.vcbSellRate) : '25990'}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
                </label>
                <label class="space-y-1">
                  <span class="text-[11px] text-zinc-500">SJC Mua (triệu/lượng)</span>
                  <input type="number" step="0.1" id="inv-gold-in-sjc-buy" value="${Number.isFinite(g.sjc?.buyVnd) ? (g.sjc.buyVnd / 1e6).toFixed(2) : '130'}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
                </label>
                <label class="space-y-1">
                  <span class="text-[11px] text-zinc-500">SJC Bán (triệu/lượng)</span>
                  <input type="number" step="0.1" id="inv-gold-in-sjc-sell" value="${Number.isFinite(g.sjc?.sellVnd) ? (g.sjc.sellVnd / 1e6).toFixed(2) : '135'}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
                </label>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] text-zinc-500">Giá nhập khẩu ước tính (Landed Parity gồm VC+BH $1, thuế 1%, gia công 40k): <strong class="inv-num">${fmtM(g.landedParityVnd)}/lượng</strong></span>
                <button type="button" id="inv-btn-recalc-gold" class="inv-primary-btn py-1.5 px-3 text-xs">Tính lại ngay</button>
              </div>
              <div class="flex flex-wrap gap-2 pt-1 text-[11px]">
                <a href="https://sjc.com.vn/gia-vang-online" target="_blank" rel="noopener noreferrer" class="underline text-emerald-600 dark:text-emerald-400 font-bold">🔗 Bảng giá SJC</a>
                <a href="https://giavang.doji.vn/" target="_blank" rel="noopener noreferrer" class="underline text-emerald-600 dark:text-emerald-400 font-bold">🔗 DOJI</a>
                <a href="https://www.pnj.com.vn/site/gia-vang" target="_blank" rel="noopener noreferrer" class="underline text-emerald-600 dark:text-emerald-400 font-bold">🔗 PNJ</a>
                <a href="https://btmc.vn/" target="_blank" rel="noopener noreferrer" class="underline text-emerald-600 dark:text-emerald-400 font-bold">🔗 Bảo Tín Minh Châu</a>
              </div>
            </div>
          </details>

          <!-- Biểu đồ Trực quan Vàng 30 ngày + So sánh Thế giới quy đổi vs Nội địa -->
          ${INV.charts?.renderGoldChartsHtml ? INV.charts.renderGoldChartsHtml(g, uiState.goldHistory30d) : ''}

          <!-- Bộ nguồn đối chiếu 30 năm kinh nghiệm cho Vàng (Tầng C) -->
          <div class="inv-card space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-xs font-extrabold text-amber-600 dark:text-amber-300">🧭 Nguồn đối chiếu gốc chuyên gia 30 năm cho Vàng (NHTW · TIPS 10Y · COT · ETF GLD · SJC)</div>
              <button type="button" id="inv-btn-gold-to-gemini" class="inv-gemini-btn text-xs py-1 px-3">🪟 Hỏi sâu chuyên gia 30 năm về Vàng</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
              ${(INV.goldEngine.buildGoldDeepLinks ? INV.goldEngine.buildGoldDeepLinks() : [])
                .map(
                  (lk) => `
                <a href="${esc(lk.url)}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:border-amber-500 transition flex items-center justify-between gap-2">
                  <span class="font-bold truncate">${esc(lk.label)}</span>
                  <span class="text-amber-600 dark:text-amber-400 font-extrabold shrink-0">Mở ↗</span>
                </a>`
                )
                .join('')}
            </div>
          </div>

          <div class="text-[11.5px] px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-800 dark:text-sky-200">
            ⚖️ <strong>Nhắc nhở pháp lý (Nghị định 390/2026/NĐ-CP):</strong> Giao dịch mua bán vàng cộng dồn từ <strong>5 triệu đồng/ngày</strong> trở lên bắt buộc thanh toán chuyển khoản không dùng tiền mặt (không chia nhỏ hóa đơn để tránh bị xử phạt).
          </div>`
            : ''
        }

        ${disclaimerFooterHtml()}
      </div>`;
  }

  function renderStockTab() {
    const esc = INV.utils.escapeHtml;
    const prefs = INV.storageAdapter.getPrefs();
    const recent = prefs.recentStocks || ['FPT', 'VCB', 'HPG', 'VNM', 'VHM'];
    const st = INV.stateManager.stockData;
    const vn = uiState.showVnIndex ? INV.stockEngine.calculateVnIndexValuation() : null;
    const fRes = uiState.forensicResult;

    return `
      <div class="space-y-4">
        <!-- Thanh tìm kiếm mã gọn gàng -->
        <div class="inv-card space-y-3">
          <div class="flex flex-wrap gap-2">
            <input type="text" id="inv-inp-stock-sym" value="${esc(uiState.stockInput || st?.symbol || '')}" placeholder="Nhập mã cổ phiếu cần xem (ví dụ: FPT, VNM, VCB, HPG...)" class="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px] px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold uppercase" />
            <button type="button" id="inv-btn-lookup-stock" class="inv-primary-btn" ${uiState.stockLoading ? 'disabled' : ''}>
              ${uiState.stockLoading ? '⏳ Đang tra...' : '🔍 Tra cứu'}
            </button>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span class="text-zinc-500">Tra nhanh:</span>
              ${recent
                .map(
                  (s) => `<button type="button" data-inv-pick-stock="${esc(s)}" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 font-bold text-xs cursor-pointer">${esc(s)}</button>`
                )
                .join('')}
            </div>
            <button type="button" id="inv-btn-toggle-vnindex" class="inv-secondary-btn text-xs">
              ${uiState.showVnIndex ? '▲ Ẩn sức khỏe chung VN-Index' : '📊 Xem sức khỏe chung thị trường (VN-Index)'}
            </button>
          </div>
        </div>

        ${
          uiState.stockError
            ? `<div class="inv-card inv-sig-caution text-xs">⚠️ ${esc(uiState.stockError)}</div>`
            : ''
        }

        <!-- Sức khỏe chung thị trường VN-Index (chỉ hiện khi bấm) -->
        ${
          vn
            ? `<div class="inv-card space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-sm font-extrabold">📈 Sức khỏe chung thị trường (VN-Index &amp; Đòn bẩy toàn sàn)</div>
                  ${signalBadgeHtml(vn.marginBreaker ? 'danger' : vn.valuationSignal)}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div class="inv-card-soft">
                    <div class="text-[11px] text-zinc-500">Mức đắt – rẻ chung (P/E vs TB 10 năm)</div>
                    <div class="inv-num text-base font-black">${vn.pe.toFixed(1)}x <span class="text-xs font-normal text-zinc-500">(TB 14,0x)</span></div>
                    <div class="text-[11px] mt-1">${esc(vn.plainValuation)}</div>
                  </div>
                  <div class="inv-card-soft">
                    <div class="text-[11px] text-zinc-500">So với lãi suất trái phiếu &amp; chi phí vốn</div>
                    <div class="inv-num text-base font-black">${vn.earningsYieldPct.toFixed(2)}% / năm</div>
                    <div class="text-[11px] mt-1">Cao hơn TPCP 10Y (${vn.bond10yPct}%) là +${vn.spreadVsBondPct.toFixed(2)}%; sát chuẩn Damodaran (${vn.damodaranKe.toFixed(2)}%).</div>
                  </div>
                  <div class="inv-card-soft ${vn.marginBreaker ? 'inv-sig-danger' : ''}">
                    <div class="text-[11px] opacity-80">Mức độ vay mượn (Margin toàn sàn)</div>
                    <div class="inv-num text-base font-black">${vn.marginSessions.toFixed(0)} phiên giao dịch</div>
                    <div class="text-[11px] mt-1">${esc(vn.plainMargin)}</div>
                  </div>
                </div>
              </div>`
            : ''
        }

        <!-- Kết quả tra cứu mã cổ phiếu -->
        ${
          st
            ? `<div class="inv-card space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div class="text-base font-black">${esc(st.symbol)} <span class="text-xs font-semibold text-zinc-500">· ${esc(st.companyName)}</span></div>
                    <div class="text-[11.5px] text-emerald-700 dark:text-emerald-400 font-bold">${esc(st.sectorChecklist?.sectorLabel || '')}</div>
                  </div>
                  <div class="text-right">
                    <div class="inv-num text-lg font-black">${st.live ? `${INV.utils.formatVnd(st.price, st.currency === 'VND' ? 0 : 2)} ${esc(st.currency)}` : 'Mở link đối chiếu giá trực tiếp'}</div>
                    ${
                      Number.isFinite(st.changePct)
                        ? `<div class="inv-num text-xs font-extrabold ${st.changePct >= 0 ? 'text-emerald-600' : 'text-rose-500'}">${st.changePct >= 0 ? '+' : ''}${st.changePct.toFixed(2)}%</div>`
                        : ''
                    }
                  </div>
                </div>

                <!-- Bảng chỉ số tài chính sống từ Simplize (CORS=*) -->
                ${
                  st.live && (Number.isFinite(st.pe) || Number.isFinite(st.roe) || Number.isFinite(st.marketCap))
                    ? `<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div class="inv-card-soft"><div class="text-[11px] text-zinc-500">Vốn hóa (${esc(st.exchange || 'HOSE')})</div><div class="inv-num font-black">${Number.isFinite(st.marketCap) ? `${(st.marketCap / 1e12).toFixed(2)} nghìn tỷ` : '—'}</div></div>
                        <div class="inv-card-soft"><div class="text-[11px] text-zinc-500">Định giá P/E · P/B</div><div class="inv-num font-black text-sky-600 dark:text-sky-400">${Number.isFinite(st.pe) ? `${st.pe.toFixed(2)}x` : '—'} · ${Number.isFinite(st.pb) ? `${st.pb.toFixed(2)}x` : '—'}</div></div>
                        <div class="inv-card-soft"><div class="text-[11px] text-zinc-500">ROE · ROA · Cổ tức</div><div class="inv-num font-black text-emerald-600 dark:text-emerald-400">${Number.isFinite(st.roe) ? `${st.roe.toFixed(1)}%` : '—'} · ${Number.isFinite(st.roa) ? `${st.roa.toFixed(1)}%` : '—'} · ${Number.isFinite(st.dividendYield) ? `${st.dividendYield.toFixed(1)}%` : '—'}</div></div>
                        <div class="inv-card-soft"><div class="text-[11px] text-zinc-500">Tăng trưởng 5Y (DT / LN)</div><div class="inv-num font-black text-violet-600 dark:text-violet-400">${Number.isFinite(st.rev5yGrowth) ? `${st.rev5yGrowth.toFixed(1)}%` : '—'} / ${Number.isFinite(st.ni5yGrowth) ? `${st.ni5yGrowth.toFixed(1)}%` : '—'}</div></div>
                      </div>`
                    : ''
                }

                <!-- 4 ô kiểm tra sức khỏe đúng theo đặc thù ngành -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  ${(st.sectorChecklist?.cards || [])
                    .map(
                      (c) => `
                    <div class="inv-card-soft space-y-1">
                      <div class="text-xs font-extrabold">${esc(c.title)}</div>
                      <div class="text-xs font-bold text-emerald-700 dark:text-emerald-400">${esc(c.value)}</div>
                      <div class="text-[11px] text-zinc-600 dark:text-zinc-400">${esc(c.hint)}</div>
                    </div>`
                    )
                    .join('')}
                </div>

                <!-- Link BCTC chính thống -->
                <div class="flex flex-wrap items-center gap-2 text-xs">
                  <span class="text-zinc-500 font-semibold">Nguồn số liệu chính:</span>
                  ${(st.links || [])
                    .map((lk) => `<a href="${esc(lk.url)}" target="_blank" rel="noopener noreferrer" class="underline font-bold text-sky-600 dark:text-sky-400">🔗 ${esc(lk.name)}</a>`)
                    .join('')}
                </div>

                <!-- Máy tính Pháp y BCTC (chỉ hiển thị cho ngành phi tài chính — KHÔNG dùng nhầm cho Ngân hàng!) -->
                ${
                  st.sector === 'general'
                    ? `<details class="inv-details inv-card-soft">
                        <summary class="flex items-center justify-between text-xs font-extrabold">
                          <span>🔬 Xem &amp; Tự bấm kiểm tra Bộ tứ Pháp y BCTC (Sloan, Beneish M, Altman Z/EM, DuPont 5 nhân tố)</span>
                          <span class="text-emerald-600 dark:text-emerald-400">▼ Mở rộng</span>
                        </summary>
                        <div class="mt-3 space-y-3 text-xs">
                          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            ${[
                              ['revenue', 'Doanh thu (tỷ)'],
                              ['ebit', 'Lãi trước thuế & lãi (EBIT)'],
                              ['ebt', 'Lãi trước thuế (EBT)'],
                              ['netIncome', 'Lãi sau thuế (LNST)'],
                              ['cfo', 'Tiền mặt HĐKD (CFO)'],
                              ['totalAssets', 'Tổng tài sản'],
                              ['equity', 'Vốn chủ sở hữu'],
                              ['totalLiabilities', 'Tổng nợ phải trả'],
                            ]
                              .map(
                                ([k, lbl]) => `
                              <label class="space-y-1">
                                <span class="text-[11px] text-zinc-500">${lbl}</span>
                                <input type="number" step="0.1" data-inv-forensic="${k}" value="${esc(uiState.forensicInputs[k] || '')}" class="inv-num w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
                              </label>`
                              )
                              .join('')}
                          </div>
                          <button type="button" id="inv-btn-run-forensic" class="inv-secondary-btn text-xs font-extrabold">🧮 Chạy kiểm tra độ sạch sổ sách bằng code thuần</button>
                          ${
                            fRes
                              ? `<div class="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                  <div><strong>Tiền mặt thật (Sloan):</strong> ${esc(fRes.plainCashCheck)}</div>
                                  <div><strong>Rủi ro nợ (Altman Z):</strong> ${esc(fRes.plainDebtCheck)}</div>
                                  <div><strong>Độ sạch sổ sách (Beneish M):</strong> ${esc(fRes.plainManipulationCheck)}</div>
                                  ${
                                    fRes.dupont
                                      ? `<div><strong>DuPont 5 nhân tố:</strong> ROE ${fRes.dupont.roePct.toFixed(1)}% = Biên EBIT ${fRes.dupont.ebitMarginPct.toFixed(1)}% × Vòng quay TS ${fRes.dupont.assetTurnover.toFixed(2)}x × Đòn bẩy ${fRes.dupont.leverage.toFixed(2)}x.</div>`
                                      : ''
                                  }
                                  ${INV.charts?.renderStockForensicChartHtml ? INV.charts.renderStockForensicChartHtml(uiState.forensicInputs) : ''}
                                </div>`
                              : ''
                          }
                        </div>
                      </details>`
                    : ''
                }

                <!-- Đẩy đúng mã sang Gemini chia đôi màn hình (kèm tùy chọn ẩn danh Glasserman–Lin) -->
                <div class="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <label class="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" id="inv-chk-anonymize-stock" ${uiState.anonymizeGemini ? 'checked' : ''} />
                    <span>Ẩn danh thành <strong>TÀI SẢN X</strong> để AI phân tích khách quan hơn</span>
                  </label>
                  <button type="button" id="inv-btn-stock-to-gemini" class="inv-gemini-btn text-xs">
                    🪟 Đưa mã ${esc(st.symbol)} sang hỏi sâu cùng Gemini
                  </button>
                </div>
              </div>`
            : `<div class="inv-card-soft text-center text-xs text-zinc-500 py-6">
                Nhập mã cổ phiếu hoặc bấm nút chọn nhanh ở trên — hệ thống chỉ gọi mạng khi bạn bấm <strong>Tra cứu</strong>.
              </div>`
        }

        ${disclaimerFooterHtml()}
      </div>`;
  }

  function renderRealEstateTab() {
    const esc = INV.utils.escapeHtml;
    const fmtM = INV.utils.formatMillions;
    const re = INV.stateManager.realEstateData;
    const kb = INV.stateManager.activeKnowledge;
    const prefs = INV.storageAdapter.getPrefs();
    const legalChecks = prefs.legalChecks || {};
    const mIn = uiState.mortgageInputs;

    const stress = INV.realEstateEngine.calculateMortgageStressTest({
      priceVnd: Number(mIn.priceBillion) * 1e9,
      loanVnd: Number(mIn.loanBillion) * 1e9,
      years: Number(mIn.years) || 20,
      grossMonthlyRentVnd: Number(mIn.grossRentMillion) * 1e6,
      annualRatePct: Number(mIn.ratePct) || 12,
    });

    const legalList = kb?.legal_checklist_7 || [];
    const checkedCount = legalList.filter((it) => legalChecks[it.id]).length;

    return `
      <div class="space-y-4">
        <!-- Khu vực xin quyền GPS minh bạch + Ô nhập tay dự phòng -->
        <div class="inv-card space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-extrabold">📍 Tra mặt bằng giá nhà đất theo vị trí thực</h4>
              <p class="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                Ứng dụng chỉ dùng tọa độ ngay lúc bạn bấm để tìm tên đường/phường gần bạn và tra mặt bằng giá khu vực đó — không lưu hay theo dõi vị trí.
              </p>
            </div>
            <button type="button" id="inv-btn-gps-re" class="inv-primary-btn w-full sm:w-auto shrink-0" ${uiState.reLoading ? 'disabled' : ''}>
              ${uiState.reLoading ? '⏳ Đang định vị...' : '📍 Bật vị trí để xem giá nhà đất quanh tôi'}
            </button>
          </div>

          <div class="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-wrap gap-2">
            <input type="text" id="inv-inp-manual-area" value="${esc(uiState.reManualInput || re?.areaLabel || '')}" placeholder="Hoặc tự gõ tên Đường / Phường / Quận bạn quan tâm (vd: Phường Mỹ An, Ngũ Hành Sơn, Đà Nẵng)" class="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[220px] px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs" />
            <button type="button" id="inv-btn-manual-area" class="inv-secondary-btn text-xs font-extrabold">Tra cứu khu vực này</button>
          </div>
        </div>

        ${
          uiState.reError
            ? `<div class="inv-card inv-sig-caution text-xs">⚠️ ${esc(uiState.reError)}</div>`
            : ''
        }

        <!-- Kết quả khu vực vừa tra -->
        ${
          re
            ? `<div class="inv-card space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div class="text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400">${re.sourceMode === 'gps' ? '📡 Đã định vị qua GPS' : '🗺️ Khu vực bạn chọn'}</div>
                    <div class="text-sm font-extrabold">${esc(re.areaLabel)}</div>
                  </div>
                  <span class="inv-pill inv-sig-neutral">Tỷ suất thuê tham chiếu: ${re.benchmark?.aptYield || 3.05}%/năm</span>
                </div>

                <!-- Số liệu mặt bằng giá & lãi suất hiển thị TRỰC TIẾP trên màn hình -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div class="inv-card-soft space-y-0.5">
                    <div class="text-[11px] text-zinc-500">${re.liveStats ? `Giá rao thực tế (${re.liveStats.sampleCount} tin gần đây)` : 'Mặt bằng giá bán tham chiếu'}</div>
                    <div class="inv-num font-black text-emerald-700 dark:text-emerald-400">
                      ${re.liveStats ? `TB ${re.liveStats.medianPpm2.toFixed(1)} tr/m² (${re.liveStats.minPpm2.toFixed(0)}–${re.liveStats.maxPpm2.toFixed(0)} tr/m²)` : esc(re.benchmark?.priceRangeM2 || '45 – 95 triệu/m²')}
                    </div>
                  </div>
                  <div class="inv-card-soft space-y-0.5">
                    <div class="text-[11px] text-zinc-500">Mặt bằng giá thuê &amp; Tỷ suất</div>
                    <div class="inv-num font-black text-sky-700 dark:text-sky-400">
                      ${re.liveStats && Number.isFinite(re.liveStats.avgRentMo) ? `~${(re.liveStats.avgRentMo / 1e6).toFixed(1)} tr/tháng` : esc(re.benchmark?.rentRangeMo || '10 – 18 triệu/tháng')} · ${re.benchmark?.aptYield || 3.05}%/năm
                    </div>
                  </div>
                  <div class="inv-card-soft space-y-0.5">
                    <div class="text-[11px] text-zinc-500">Mặt bằng lãi suất vay mua nhà</div>
                    <div class="inv-num font-black text-rose-600 dark:text-rose-400">${esc(re.benchmark?.mortgageRange || '12%–15%/năm (thả nổi)')}</div>
                  </div>
                </div>

                ${
                  (re.liveAds || []).length
                    ? `<div class="space-y-1.5">
                        <div class="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">🏘️ Tin rao thực tế mới quét quanh khu vực:</div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          ${re.liveAds
                            .map(
                              (ad) => `
                            <a href="${esc(ad.url)}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:border-emerald-500 text-xs block">
                              <div class="font-bold truncate">${esc(ad.title)}</div>
                              <div class="text-[11px] text-emerald-700 dark:text-emerald-400 font-extrabold">${esc(ad.price)} ${ad.size ? `· ${esc(ad.size)}` : ''} ${ad.ppm2 ? `(${esc(ad.ppm2)})` : ''}</div>
                            </a>`
                            )
                            .join('')}
                        </div>
                      </div>`
                    : ''
                }

                <p class="text-xs ${re.benchmark?.sparseWarning ? 'inv-sig-caution p-2.5 rounded-xl border' : 'text-zinc-600 dark:text-zinc-300'}">${esc(re.benchmark?.note || '')}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  ${(re.links || [])
                    .map(
                      (lk) => `
                    <a href="${esc(lk.url)}" target="_blank" rel="noopener noreferrer" class="inv-card-soft hover:border-emerald-500 transition flex items-center justify-between gap-2 text-xs">
                      <span class="font-bold">${esc(lk.title)}</span>
                      <span class="text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0">Mở ↗</span>
                    </a>`
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }

        <!-- Công cụ Thử tính tiền vay mua nhà hàng tháng (DSCR & Stress Test 10%-15%) -->
        <details class="inv-details inv-card" open>
          <summary class="flex items-center justify-between text-sm font-extrabold">
            <span>🧮 Thử tính tiền vay mua nhà hàng tháng (Kiểm tra sức chịu đựng khi hết ưu đãi lãi vay)</span>
            <span class="text-emerald-600 dark:text-emerald-400 text-xs">▼ Thu/Mở</span>
          </summary>
          <div class="mt-3 space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <label class="space-y-1">
                <span class="text-[11px] text-zinc-500">Giá nhà (tỷ đồng)</span>
                <input type="number" step="0.1" id="inv-mort-price" value="${mIn.priceBillion}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold" />
              </label>
              <label class="space-y-1">
                <span class="text-[11px] text-zinc-500">Tiền vay (tỷ đồng)</span>
                <input type="number" step="0.1" id="inv-mort-loan" value="${mIn.loanBillion}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold" />
              </label>
              <label class="space-y-1">
                <span class="text-[11px] text-zinc-500">Thời gian vay (năm)</span>
                <input type="number" step="1" id="inv-mort-years" value="${mIn.years}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold" />
              </label>
              <label class="space-y-1">
                <span class="text-[11px] text-zinc-500">Tiền thuê gộp (tr/tháng)</span>
                <input type="number" step="0.1" id="inv-mort-rent" value="${mIn.grossRentMillion}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold" />
              </label>
              <label class="space-y-1">
                <span class="text-[11px] text-zinc-500">Lãi thả nổi (%/năm)</span>
                <input type="number" step="0.5" id="inv-mort-rate" value="${mIn.ratePct}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold" />
              </label>
            </div>

            <div class="p-3 rounded-xl border ${stress.signal === 'danger' ? 'inv-sig-danger' : stress.signal === 'caution' ? 'inv-sig-caution' : 'inv-sig-positive'} text-xs space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-extrabold">Kết quả kiểm tra (Vay ${stress.ltvPct.toFixed(0)}% giá nhà · Đã trừ 15% chi phí bảo trì/trống phòng)</span>
                ${signalBadgeHtml(stress.signal, stress.badge)}
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 inv-num">
                <div>Trả ngân hàng mỗi tháng: <strong>${fmtM(stress.current.monthlyPayment)}</strong></div>
                <div>Tiền thuê ròng mỗi tháng: <strong>${fmtM(stress.netMonthlyRent)}</strong></div>
                <div>Phải tự móc túi bù thêm: <strong>${fmtM(stress.current.monthlyShortfall)}/tháng</strong></div>
              </div>
              <p class="pt-1 leading-relaxed">${esc(stress.plainVerdict)}</p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse inv-num">
                <thead>
                  <tr class="border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500">
                    <th class="py-1.5 pr-2">Mốc lãi suất</th>
                    <th class="py-1.5 pr-2">Trả góp/tháng</th>
                    <th class="py-1.5 pr-2">Tiền thuê bù được</th>
                    <th class="py-1.5">Phải tự bù thêm/tháng</th>
                  </tr>
                </thead>
                <tbody>
                  ${stress.stressTable
                    .map(
                      (row) => `
                    <tr class="border-b border-zinc-200/50 dark:border-zinc-800/60">
                      <td class="py-1.5 pr-2 font-bold">${row.rate}%/năm</td>
                      <td class="py-1.5 pr-2">${fmtM(row.monthlyPayment)}</td>
                      <td class="py-1.5 pr-2 font-bold ${row.dscr < 1 ? 'text-rose-600 dark:text-rose-400' : row.dscr < 1.2 ? 'text-amber-600' : 'text-emerald-600'}">${row.coveragePct.toFixed(0)}% (DSCR ${row.dscr.toFixed(2)}x)</td>
                      <td class="py-1.5 font-extrabold">${fmtM(row.monthlyShortfall)}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </details>

        <!-- Biểu đồ Lợi suất Cho thuê vs Tiết kiệm vs Vay thả nổi + Lịch sử khảo sát thực địa -->
        ${(() => {
          const surveys = INV.storageAdapter.getRealEstateSurveys ? INV.storageAdapter.getRealEstateSurveys(re?.benchmark?.city || '') : [];
          const estYield = re?.benchmark?.aptYield || (mIn.priceBillion > 0 ? ((mIn.grossRentMillion * 12) / (mIn.priceBillion * 1000)) * 100 : 3.3);
          const chartsHtml = INV.charts?.renderRealEstateChartsHtml ? INV.charts.renderRealEstateChartsHtml(estYield, mIn.ratePct, surveys) : '';
          const sd = uiState.surveyDraft;
          return `
            ${chartsHtml}
            <details class="inv-details inv-card">
              <summary class="flex items-center justify-between text-sm font-extrabold">
                <span>📝 Khảo sát Thực địa 6 chỉ số &amp; Lưu lịch sử giá khu vực (${surveys.length} mốc đã lưu)</span>
                <span class="text-emerald-600 dark:text-emerald-400 text-xs">▼ Mở rộng</span>
              </summary>
              <div class="mt-3 space-y-3 text-xs">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label class="space-y-1"><span class="text-[11px] text-zinc-500">Giá rao thực tế (triệu/m²):</span><input id="inv-srv-price" type="number" step="0.5" value="${esc(sd.pricePerM2)}" placeholder="VD: 85" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" /></label>
                  <label class="space-y-1"><span class="text-[11px] text-zinc-500">Giá cho thuê (triệu/tháng):</span><input id="inv-srv-rent" type="number" step="0.5" value="${esc(sd.rentPerMonth)}" placeholder="VD: 12" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" /></label>
                  <label class="space-y-1"><span class="text-[11px] text-zinc-500">Độ rộng đường trước nhà (m):</span><input id="inv-srv-road" type="number" step="0.5" value="${esc(sd.roadWidthM)}" placeholder="VD: 5.5" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" /></label>
                  <label class="space-y-1"><span class="text-[11px] text-zinc-500">Tình trạng pháp lý:</span>
                    <select id="inv-srv-legal" class="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                      <option value="Sổ hồng/đỏ riêng" ${sd.legalStatus === 'Sổ hồng/đỏ riêng' ? 'selected' : ''}>Sổ hồng/đỏ riêng</option>
                      <option value="Hợp đồng mua bán (chờ sổ)" ${sd.legalStatus === 'Hợp đồng mua bán (chờ sổ)' ? 'selected' : ''}>Hợp đồng mua bán (chờ sổ)</option>
                      <option value="Đất nông nghiệp / Vi bằng (Rủi ro cao)" ${sd.legalStatus === 'Đất nông nghiệp / Vi bằng (Rủi ro cao)' ? 'selected' : ''}>Đất nông nghiệp / Vi bằng (Rủi ro)</option>
                    </select>
                  </label>
                  <label class="space-y-1"><span class="text-[11px] text-zinc-500">Tỷ lệ nhà sáng đèn buổi tối (%):</span><input id="inv-srv-light" type="number" min="0" max="100" value="${esc(sd.nightLightPct)}" class="inv-num w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" /></label>
                  <label class="space-y-1"><span class="text-[11px] text-zinc-500">Tiến độ hạ tầng khu vực (4 bước):</span>
                    <select id="inv-srv-infra" class="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                      <option value="Mới đề xuất chủ trương" ${sd.infraStage === 'Mới đề xuất chủ trương' ? 'selected' : ''}>1. Mới đề xuất chủ trương</option>
                      <option value="Đã duyệt vốn" ${sd.infraStage === 'Đã duyệt vốn' ? 'selected' : ''}>2. Đã duyệt vốn</option>
                      <option value="Đang giải phóng mặt bằng" ${sd.infraStage === 'Đang giải phóng mặt bằng' ? 'selected' : ''}>3. Đang giải phóng mặt bằng</option>
                      <option value="Đang thi công / Sắp thông xe" ${sd.infraStage === 'Đang thi công / Sắp thông xe' ? 'selected' : ''}>4. Đang thi công / Sắp thông xe</option>
                    </select>
                  </label>
                </div>
                <input id="inv-srv-flood" type="text" value="${esc(sd.floodNote)}" placeholder="Ghi chú thực địa: ngập lụt mùa mưa, tiện ích chợ/trường, có tin cắt lỗ, đấu giá đất..." class="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs" />
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <button type="button" id="inv-btn-save-survey" class="inv-primary-btn py-1.5 px-3 text-xs">💾 Lưu khảo sát vào lịch sử khu vực &amp; đưa vào Prompt</button>
                  <button type="button" id="inv-btn-re-to-gemini" class="inv-gemini-btn py-1.5 px-3 text-xs">🪟 Hỏi sâu chuyên gia 30 năm về khu vực này</button>
                </div>
                ${
                  surveys.length
                    ? `<div class="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        ${surveys
                          .slice(0, 6)
                          .map(
                            (s) => `
                          <div class="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 flex items-center justify-between gap-2 text-[11px]">
                            <div class="min-w-0">
                              <strong>[${esc(s.date)}] ${esc(s.area)}</strong> — ${s.pricePerM2} tr/m² · Thuê ${s.rentPerMonth} tr/th · Đường ${s.roadWidthM}m · Sáng đèn ${s.nightLightPct}% · ${esc(s.infraStage)}
                              ${s.floodNote ? `<div class="text-zinc-500 truncate">${esc(s.floodNote)}</div>` : ''}
                            </div>
                            <button type="button" data-inv-del-survey="${esc(s.id)}" class="text-rose-500 font-bold shrink-0">Xóa</button>
                          </div>`
                          )
                          .join('')}
                      </div>`
                    : ''
                }
              </div>
            </details>`;
        })()}

        <!-- 7 bước pháp lý bắt buộc trước khi đặt cọc -->
        <details class="inv-details inv-card">
          <summary class="flex items-center justify-between text-sm font-extrabold">
            <span>🛡️ 7 việc bắt buộc kiểm tra trước khi đặt cọc nhà đất (Đã đạt ${checkedCount}/${legalList.length})</span>
            <span class="text-emerald-600 dark:text-emerald-400 text-xs">▼ Mở rộng</span>
          </summary>
          <div class="mt-3 space-y-2 text-xs">
            ${legalList
              .map(
                (item) => `
              <label class="flex items-start gap-2.5 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 cursor-pointer">
                <input type="checkbox" data-inv-legal-chk="${esc(item.id)}" ${legalChecks[item.id] ? 'checked' : ''} class="mt-0.5 accent-emerald-600" />
                <div>
                  <div class="font-extrabold">${esc(item.title)}</div>
                  <div class="text-[11.5px] text-zinc-600 dark:text-zinc-400 mt-0.5">${esc(item.detail)}</div>
                </div>
              </label>`
              )
              .join('')}
          </div>
        </details>

        ${disclaimerFooterHtml()}
      </div>`;
  }

  // --------------------------------------------------------------------------
  // TAB 5: BIỂU ĐỒ PHÂN TÍCH CHUYÊN NGHIỆP (NGÔN NGỮ BÌNH DÂN DỄ HIỂU)
  // --------------------------------------------------------------------------
  function renderExecutiveMarkdown(mdText) {
    const esc = INV.utils.escapeHtml;
    const raw = String(mdText || '')
      .replace(/```json[\s\S]*?```/gi, '')
      .replace(/INVEST_INTEL_SYNC_V2[\s\S]*$/i, '')
      .replace(/^#{1,6}\s*(PHẦN\s*2|KHỐI\s*JSON)[^\n]*$/gim, '')
      .trim();
    if (!raw) return '';
    const formatInline = (s) =>
      esc(s)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')\]]+?)(?=&(?:quot|lt|gt);|[.,;:!?]*(?:\s|$))/g, (_m, lbl, mdUrl, bareUrl) => {
          const u = mdUrl || bareUrl || '';
          const label = lbl || u;
          return `<a href="${u}" target="_blank" rel="noopener noreferrer" class="text-teal-700 dark:text-teal-400 underline font-semibold">${label} ↗</a>`;
        })
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[11.5px]">$1</code>');

    const lines = raw.split(/\r?\n/);
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || /^[-*_]{3,}$/.test(line)) {
        i += 1;
        continue;
      }
      // Markdown table detection
      if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1].trim())) {
        const parseRow = (r) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        const headers = parseRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().includes('|') && !/^#{1,6}\s/.test(lines[i].trim())) {
          rows.push(parseRow(lines[i].trim()));
          i += 1;
        }
        out.push(
          `<div class="inv-exec-table-wrap"><table class="inv-exec-table"><thead><tr>${headers
            .map((h) => `<th>${formatInline(h)}</th>`)
            .join('')}</tr></thead><tbody>${rows
            .map((r) => `<tr>${headers.map((_, ci) => `<td>${formatInline(r[ci] || '')}</td>`).join('')}</tr>`)
            .join('')}</tbody></table></div>`
        );
        continue;
      }
      const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        const lvl = hMatch[1].length;
        const title = hMatch[2].replace(/\*\*/g, '').trim();
        if (lvl <= 2) {
          out.push(`<div class="inv-exec-banner">${formatInline(title)}</div>`);
        } else {
          out.push(`<h4 class="inv-exec-subhead">${formatInline(title)}</h4>`);
        }
        i += 1;
        continue;
      }
      if (/^>\s*/.test(line)) {
        const qLines = [];
        while (i < lines.length && /^>\s*/.test(lines[i].trim())) {
          qLines.push(formatInline(lines[i].trim().replace(/^>\s*/, '')));
          i += 1;
        }
        out.push(`<div class="inv-exec-callout">${qLines.join('<br/>')}</div>`);
        continue;
      }
      if (/^[-•*+]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && (/^[-•*+]\s+/.test(lines[i].trim()) || /^\d+[.)]\s+/.test(lines[i].trim()))) {
          items.push(formatInline(lines[i].trim().replace(/^([-•*+]|\d+[.)])\s+/, '')));
          i += 1;
        }
        out.push(`<ul class="inv-exec-list">${items.map((it) => `<li>${it}</li>`).join('')}</ul>`);
        continue;
      }
      out.push(`<p class="my-1.5">${formatInline(line)}</p>`);
      i += 1;
    }
    return out.join('\n');
  }

  function renderChartsTab() {
    const esc = INV.utils.escapeHtml;
    const report = INV.stateManager.evaluationReport;
    const goldSnap = INV.stateManager.goldData;
    const goldHist30d = uiState.goldHistory30d || report?.gold_history_30d || null;
    const re = INV.stateManager.realEstateData;
    const mIn = uiState.mortgageInputs;
    const surveys = INV.storageAdapter.getRealEstateSurveys ? INV.storageAdapter.getRealEstateSurveys(re?.benchmark?.city || '') : [];
    const reYieldPct = re?.benchmark?.aptYield || (mIn.priceBillion > 0 ? ((mIn.grossRentMillion * 12) / (mIn.priceBillion * 1000)) * 100 : 3.3);

    // Tự dựng dữ liệu thống nhất nếu người dùng mở thẳng Tab Biểu đồ sau khi đã quét
    if (!INV.stateManager.unifiedAnalytics && report && INV.deterministicExtractor?.buildUnifiedAnalyticsFromCode) {
      INV.stateManager.unifiedAnalytics = INV.deterministicExtractor.buildUnifiedAnalyticsFromCode({
        report,
        goldSnap,
        goldHist30d,
        stockData: INV.stateManager.stockData,
        reData: re,
        surveys,
      });
    }
    const unified = INV.stateManager.unifiedAnalytics;

    return `
      <div class="space-y-4">
        <!-- Thanh đồng bộ 2 nguồn (Code Tự động & Dán Câu trả lời Gemini) -->
        <div class="inv-card space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-sm font-black">📈 Biểu đồ phân tích chuyên nghiệp (Dễ đọc · Không dùng từ khó hiểu)</div>
              <div class="text-[11.5px] text-zinc-500 dark:text-zinc-400">Hiển thị đồng bộ 6 loại biểu đồ (Tròn, Radar rủi ro, Cột, 5 Trụ cột, Đường thời gian, Ma trận Quyết định) từ dữ liệu quét Bước 1 hoặc câu trả lời bạn dán từ Gemini.</div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" id="inv-btn-charts-rebuild-code" class="inv-secondary-btn text-xs">🔄 Dựng lại từ Code Bước 1</button>
              <button type="button" id="inv-btn-charts-to-gemini" class="inv-gemini-btn text-xs py-1.5 px-3">🪟 Hỏi Gemini lấy dữ liệu biểu đồ</button>
            </div>
          </div>

          <div class="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
            <label class="text-xs font-extrabold text-sky-600 dark:text-sky-300 block">📥 Dán câu trả lời từ Gemini vào đây để tự cập nhật tất cả ô dữ liệu &amp; 6 biểu đồ bên dưới:</label>
            <div class="flex flex-col sm:flex-row gap-2">
              <textarea id="inv-inp-gemini-paste-ch" rows="2" placeholder="Dán toàn bộ câu trả lời của Gemini (kèm khối JSON INVEST_INTEL_SYNC_V2 ở cuối) rồi bấm Đồng bộ..." class="flex-1 p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono"></textarea>
              <button type="button" id="inv-btn-sync-gemini-ch" class="inv-primary-btn text-xs shrink-0 self-stretch sm:self-center">⚡ Đồng bộ &amp; Vẽ biểu đồ</button>
            </div>
          </div>
        </div>

        ${
          INV.stateManager.geminiReportProse
            ? `<div class="inv-exec-paper space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b-2 border-teal-600/50">
                  <div>
                    <div class="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">📊 BÁO CÁO PHÂN TÍCH ĐẦU TƯ — ĐỊNH DẠNG CHUYÊN GIA</div>
                    <div class="text-base font-black text-slate-900 dark:text-white">Tổng hợp chuyên sâu từ Gemini (${esc(unified?.as_of_date || report?.as_of_date || '')})</div>
                  </div>
                </div>
                <div>${renderExecutiveMarkdown(INV.stateManager.geminiReportProse)}</div>
              </div>`
            : ''
        }

        <!-- Toàn bộ 6 Biểu đồ Chuyên nghiệp -->
        ${
          INV.charts?.renderProAnalyticsDashboardHtml
            ? INV.charts.renderProAnalyticsDashboardHtml(unified, {
                goldSnap,
                goldHist30d,
                reYieldPct,
                reMortgagePct: mIn.ratePct,
                surveys,
              })
            : ''
        }

        ${disclaimerFooterHtml()}
      </div>`;
  }

  // --------------------------------------------------------------------------
  // POP-UP CẢNH BÁO KHI BẤM ĐỔI VỊ TRÍ (CÓ / KHÔNG / NÚT ✕ ĐÓNG)
  // --------------------------------------------------------------------------
  function openChangeRegionConfirmModal() {
    document.getElementById('inv-change-region-confirm-modal')?.remove();
    const tr = (s) => NS.i18n?.translateText?.(s) || s;
    const modal = document.createElement('div');
    modal.id = 'inv-change-region-confirm-modal';
    modal.className = 'fixed inset-0 z-[2147483635] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border-2 border-amber-400/70 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        <div class="px-4 py-3 border-b border-zinc-800 bg-amber-500/15 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 text-sm font-black text-amber-300">
            <span>⚠️</span>
            <span>${tr('Xác nhận đổi vị trí đầu tư')}</span>
          </div>
          <button type="button" id="inv-chg-loc-x" class="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-rose-600 text-zinc-100 font-black cursor-pointer" title="${tr('Đóng')}">✕</button>
        </div>
        <div class="p-4 space-y-3 text-xs sm:text-sm leading-relaxed text-zinc-200">
          <p>${tr('Nếu bạn đổi vị trí (Thủ công hoặc tự động qua GPS) thì đều cần phân tích lại để có số liệu chính xác nhất, bạn chắc chứ?')}</p>
        </div>
        <div class="px-4 py-3 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-end gap-2">
          <button type="button" id="inv-chg-loc-no" class="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold cursor-pointer">❌ ${tr('Không')}</button>
          <button type="button" id="inv-chg-loc-yes" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black shadow-lg cursor-pointer">✅ ${tr('Có, đổi vị trí & phân tích lại')}</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const closeIt = () => modal.remove();
    modal.querySelector('#inv-chg-loc-x')?.addEventListener('click', closeIt);
    modal.querySelector('#inv-chg-loc-no')?.addEventListener('click', closeIt);
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeIt();
    });
    modal.querySelector('#inv-chg-loc-yes')?.addEventListener('click', () => {
      closeIt();
      if (uiState.w2CountdownTimerId) {
        clearInterval(uiState.w2CountdownTimerId);
        uiState.w2CountdownTimerId = null;
      }
      INV.stateManager.abortAll();
      INV.stateManager.userRegion = null;
      INV.stateManager.evaluationReport = null;
      INV.stateManager.unifiedAnalytics = null;
      INV.stateManager.deterministicMatches = null;
      INV.stateManager.goldData = null;
      INV.stateManager.realEstateData = null;
      INV.storageAdapter.clearSession('user_region');
      INV.storageAdapter.clearSession('eval_report_quick');
      INV.storageAdapter.clearSession('eval_report_full');
      INV.storageAdapter.clearSession('wizard_stage');
      uiState.pendingGpsRegion = null;
      uiState.w2SyncCountdown = null;
      uiState.wizardStage = 'location_gate';
      render();
    });
    NS.i18n?.translateElement?.(modal);
  }

  // --------------------------------------------------------------------------
  // PHA A: MÀN HÌNH CỔNG XÁC ĐỊNH VỊ TRÍ & CHỜ NGƯỜI DÙNG XÁC NHẬN
  // --------------------------------------------------------------------------
  function renderLocationGateScreen() {
    const esc = INV.utils.escapeHtml;
    const countries = Object.values(INV.COUNTRY_PROFILES || {});
    const pendingGps = uiState.pendingGpsRegion;
    return `
      <div class="inv-root space-y-4">
        <div class="inv-card text-center space-y-4 py-6">
          <div class="text-4xl">🌍</div>
          <div class="space-y-1.5 max-w-xl mx-auto">
            <h3 class="text-base sm:text-lg font-black">Xác định Quốc gia &amp; Khu vực trước khi vào Đầu tư hôm nay</h3>
            <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Hãy dò vị trí (GPS) hoặc chọn thủ công. Sau khi bạn bấm <strong>Xác nhận</strong>, hệ thống sẽ tự động tra cứu thông tin toàn diện (34 chỉ tiêu) và chuẩn bị sẵn câu lệnh 2 bước cho Gemini!
            </p>
          </div>

          <div class="flex flex-col items-center gap-2.5">
            ${(() => {
          const gBridge = globalScope.NoirGeminiBridge || NS.geminiBridge;
          const hasGKey = Boolean(gBridge?.hasApiKey?.() || INV.researchEngine?.getActiveGeminiApiKey?.());
          return hasGKey
            ? `<div id="inv-gate-ai-status" class="max-w-lg mx-auto px-3.5 py-2 rounded-xl border border-emerald-500/45 bg-emerald-950/35 text-emerald-300 text-xs font-bold mb-2">
                 ✅ Đã liên kết Gemini API Key — Chế độ AI 1 chạm tự động xuất PDF đã sẵn sàng!
               </div>`
            : `<div id="inv-gate-ai-status" class="max-w-lg mx-auto mb-2">
                 <button type="button" id="inv-gate-btn-connect-ai" class="noir-ai-blink-btn w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold cursor-pointer shadow-lg">
                   🔗 Kết nối AI của bạn (Mở khóa tự động xuất PDF 1 chạm)
                 </button>
               </div>`;
        })()}
        <button type="button" id="inv-gate-btn-gps" class="inv-primary-btn" ${uiState.gateLoading ? 'disabled' : ''}>
              ${uiState.gateLoading ? '⏳ Đang dò vị trí GPS của bạn...' : '📍 Cho phép truy cập Vị trí (GPS)'}
            </button>
            ${uiState.gateStatus ? `<div class="text-xs font-bold text-emerald-600 dark:text-emerald-400">${esc(uiState.gateStatus)}</div>` : ''}
            ${uiState.gateError ? `<div class="text-xs font-bold text-amber-600 dark:text-amber-300 max-w-md">${esc(uiState.gateError)}</div>` : ''}

            ${
              pendingGps
                ? `<div class="w-full max-w-lg p-3.5 rounded-2xl border-2 border-emerald-400/70 bg-emerald-500/12 space-y-2.5 shadow-lg">
                    <div class="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">✅ Đã dò ra vị trí của bạn qua GPS:</div>
                    <div class="text-sm font-black text-zinc-900 dark:text-white">📍 ${esc(pendingGps.areaLabel)} (${esc(pendingGps.countryName)} · ${esc(pendingGps.currency)})</div>
                    <button type="button" id="inv-gate-btn-confirm-gps" class="inv-primary-btn w-full text-xs sm:text-sm">
                      🚀 Xác nhận vị trí này &amp; Bắt đầu tra cứu toàn diện
                    </button>
                  </div>`
                : ''
            }
          </div>

          <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800 max-w-lg mx-auto space-y-2.5 text-left">
            <div class="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">Hoặc chọn Quốc gia &amp; khu vực thủ công (khi máy tính không có GPS):</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select id="inv-gate-country-sel" class="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold">
                ${countries
                  .map(
                    (c) => `<option value="${esc(c.countryCode)}" ${uiState.gateCountry === c.countryCode ? 'selected' : ''}>${esc(c.countryName)} (${esc(c.currency)})</option>`
                  )
                  .join('')}
              </select>
              <input type="text" id="inv-gate-area-inp" value="${esc(uiState.gateAreaInput)}" placeholder="Tùy chọn: Thành phố / Quận / Bang..." class="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs" />
            </div>
            <button type="button" id="inv-gate-btn-manual" class="inv-secondary-btn w-full text-xs font-extrabold" ${uiState.gateLoading ? 'disabled' : ''}>
              🚀 Xác nhận Quốc gia &amp; Bắt đầu tra cứu toàn diện
            </button>
          </div>
        </div>
        ${disclaimerFooterHtml()}
      </div>`;
  }

  // --------------------------------------------------------------------------
  // PHA B: MÀN HÌNH CHỜ LOADING TRA CỨU TOÀN DIỆN & TỔNG HỢP PROMPT
  // --------------------------------------------------------------------------
  function renderFullScanLoadingScreen() {
    const esc = INV.utils.escapeHtml;
    const reg = INV.stateManager.userRegion;
    const pct = Math.max(5, Math.min(100, Math.round(uiState.loadingPct || 10)));
    return `
      <div class="inv-root space-y-4">
        <div class="inv-card inv-workflow-glow-card text-center py-10 px-4 space-y-4">
          <div class="flex justify-center">
            ${
              uiState.loadingDone
                ? '<div class="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl">✅</div>'
                : '<div class="w-14 h-14 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin"></div>'
            }
          </div>
          <div class="space-y-1.5 max-w-lg mx-auto">
            <h3 class="text-base sm:text-lg font-black ${uiState.loadingDone ? 'text-emerald-600 dark:text-emerald-300' : ''}">
              ${uiState.loadingDone ? 'Tra cứu & Tổng hợp thông tin toàn diện thành công!' : 'Đang tra cứu thông tin toàn diện & chuẩn bị câu lệnh Gemini...'}
            </h3>
            <p class="text-xs text-zinc-600 dark:text-zinc-300">
              Khu vực: <strong>${esc(reg?.areaLabel || 'Việt Nam')} (${esc(reg?.countryName || 'Việt Nam')})</strong> · Tự động quét 34 chỉ tiêu, lọc 5 chốt 0% bịa đặt SHA-256 &amp; tổng hợp sẵn câu lệnh.
            </p>
          </div>
          <div class="max-w-md mx-auto space-y-1.5">
            <div class="flex justify-between text-xs font-bold">
              <span>${esc(uiState.loadingLabel || 'Đang kết nối các nguồn API chính thống...')}</span>
              <span class="inv-num text-emerald-500">${pct}%</span>
            </div>
            <div class="inv-meter-track" style="height:10px;">
              <div class="inv-meter-fill bg-gradient-to-r from-emerald-500 to-sky-500" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
        ${disclaimerFooterHtml()}
      </div>`;
  }

  // --------------------------------------------------------------------------
  // PHA C: MÀN HÌNH 2 BƯỚC RẤT NGẮN GỌN (TRƯỚC KHI VÀO CÁC BẢNG PHÂN TÍCH)
  // --------------------------------------------------------------------------
  function renderTwoStepSetupScreen() {
    const esc = INV.utils.escapeHtml;
    const reg = INV.stateManager.userRegion;
    const prefs = INV.storageAdapter.getPrefs();
    const rep = INV.stateManager.evaluationReport;
    const curMode = uiState.w2Mode || prefs.promptMode || 'veteran30';
    const curFocus = uiState.w2Focus || 'general';
    const countdown = uiState.w2SyncCountdown;

    const previewPrompt = INV.promptComposer.buildGeminiPrompt({
      mode: curMode,
      focus: curFocus,
      userGoal: prefs.userGoal || '',
      fieldNotes: prefs.fieldNotes || '',
    });
    const wordCount = previewPrompt.trim().split(/\s+/).filter(Boolean).length;

    return `
      <div class="inv-root space-y-4">
        <!-- Thanh vị trí + Nút Đổi vị trí NỔI BẬT -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-black">📈 Đầu tư hôm nay</span>
            <span class="inv-pill inv-sig-positive text-[11px]">🌍 ${esc(reg?.areaLabel || '')} (${esc(reg?.currency || 'VND')})</span>
            <button type="button" id="inv-btn-change-region" class="inv-change-loc-btn">📍 Đổi vị trí</button>
          </div>
          <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            ✅ Đã tra cứu xong ${rep?.items?.length || 34} chỉ tiêu (${rep?.live_count || 0} API sống · 0% bịa đặt)
          </span>
        </div>

        <!-- Màn hình 2 Bước gọn gàng -->
        <div class="inv-card inv-workflow-glow-card space-y-4">
          <!-- BƯỚC 1: TRA CỨU GEMINI (3 CHẾ ĐỘ x 4 TRỌNG TÂM + TỰ GHÉP KHẨU VỊ/BCTC) -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="inv-step-badge">⚡ BƯỚC 1: TRA CỨU &amp; GỬI CÂU LỆNH SANG GEMINI</span>
              <span class="text-[11px] font-mono text-zinc-500">${wordCount.toLocaleString('vi-VN')} từ · Khung ${curMode === 'veteran30' ? '30 năm 6 phần' : curMode === 'audit' ? 'Kiểm toán Bò/Gấu' : 'Tóm gọn'}</span>
            </div>

            <!-- 3 chế độ hỏi (3 khung prompt riêng) -->
            <div class="space-y-1.5">
              <div class="text-xs font-extrabold text-zinc-700 dark:text-zinc-200">1. Chọn chế độ phân tích (mỗi chế độ 1 khung câu lệnh riêng):</div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                ${[
                  ['veteran30', '🏆 Chuyên gia 30 năm', 'Bình dân học vụ · 6 phần chuẩn'],
                  ['audit', '⚖️ Kiểm toán 2 chiều', 'Tranh biện Phe Bò vs Phe Gấu'],
                  ['plain', '📘 Phổ thông tóm gọn', 'Ngắn gọn, đi thẳng trọng tâm'],
                ]
                  .map(
                    ([val, title, sub]) => `
                  <button type="button" data-w2-mode="${val}" class="p-2 rounded-xl border text-left transition cursor-pointer ${
                      curMode === val
                        ? 'border-emerald-400 bg-emerald-600/20 ring-1 ring-emerald-400'
                        : 'border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 hover:border-emerald-500'
                    }">
                    <div class="font-extrabold">${title}</div>
                    <div class="text-[10.5px] text-zinc-500 dark:text-zinc-400">${sub}</div>
                  </button>`
                  )
                  .join('')}
              </div>
            </div>

            <!-- 4 trọng tâm (từng trọng tâm có khung câu lệnh riêng) -->
            <div class="space-y-1.5">
              <div class="text-xs font-extrabold text-zinc-700 dark:text-zinc-200">2. Chọn trọng tâm tài sản:</div>
              <div class="flex flex-wrap gap-1.5 text-xs">
                ${[
                  ['general', '🧭 Tổng quát 3 tài sản'],
                  ['gold', '🥇 Riêng kênh Vàng'],
                  ['real_estate', '🏘️ Riêng Nhà đất khu vực'],
                  ['stock', '📊 Riêng Chứng khoán'],
                ]
                  .map(
                    ([val, lbl]) => `
                  <button type="button" data-w2-focus="${val}" class="px-3 py-1.5 rounded-xl border font-extrabold transition cursor-pointer ${
                      curFocus === val
                        ? 'border-sky-400 bg-sky-600 text-white shadow'
                        : 'border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/70 hover:border-sky-400'
                    }">${lbl}</button>`
                  )
                  .join('')}
              </div>
            </div>

            <!-- Khẩu vị, mục tiêu & số liệu BCTC/thực địa (tự động ghép khi nhập xong & rời ô!) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label class="space-y-1">
                <span class="font-bold text-zinc-700 dark:text-zinc-300">🎯 Khẩu vị &amp; Mục tiêu đầu tư (tự ghép vào prompt khi rời ô):</span>
                <input id="inv-w2-goal" type="text" value="${esc(prefs.userGoal || '')}" placeholder="VD: Vốn 500tr, cầm 3 năm, không vay đòn bẩy..." class="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs" />
              </label>
              <label class="space-y-1">
                <span class="font-bold text-zinc-700 dark:text-zinc-300">📝 Số liệu BCTC / Khảo sát thực địa bổ sung (tùy chọn):</span>
                <input id="inv-w2-notes" type="text" value="${esc(prefs.fieldNotes || '')}" placeholder="VD: Mã FPT / Đất đường 7m5, sổ hồng sẵn, giá 85tr/m²..." class="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs" />
              </label>
            </div>
            ${uiState.w2AutoMergeNotice ? `<div class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">${esc(uiState.w2AutoMergeNotice)}</div>` : ''}
            ${curFocus === 'stock' ? `
              <div class="max-w-md mx-auto text-left space-y-1">
                <label class="text-xs font-bold text-sky-700 dark:text-sky-300">📊 Mã cổ phiếu muốn AI phân tích sâu (tùy chọn):</label>
                <input id="inv-w2-stock-ticker" type="text" value="${esc(uiState.stockInput || INV.stateManager.stockData?.symbol || '')}" placeholder="VD: FPT, VCB, HPG, NVDA, AAPL..." class="w-full px-3 py-2 rounded-xl border border-sky-400/50 bg-white dark:bg-zinc-950 text-xs uppercase font-bold" />
              </div>
            ` : ''}

            ${(() => {
              const gBridge = globalScope.NoirGeminiBridge || NS.geminiBridge;
              const hasGKey = Boolean(gBridge?.hasApiKey?.() || INV.researchEngine?.getActiveGeminiApiKey?.());
              if (hasGKey) {
                return `
                  <div class="p-4 rounded-2xl border-2 border-emerald-500/55 bg-emerald-500/10 space-y-2.5 max-w-2xl mx-auto">
                    <div class="text-xs font-bold text-emerald-700 dark:text-emerald-300">✅ Đã liên kết Gemini API Key — Không cần Copy/Paste thủ công nữa!</div>
                    <button type="button" id="inv-w2-btn-full-auto-ai" class="noir-ai-blink-btn w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-sm sm:text-base shadow-xl cursor-pointer transition">
                      🚀 Tự động hoàn toàn với AI
                    </button>
                    <p class="text-[11px] text-zinc-600 dark:text-zinc-300">1 chạm: Tạo Prompt chuẩn + Chạy Gemini AI &amp; Google Search + Đồng bộ 6 biểu đồ + Mở thẳng Báo cáo PDF!</p>
                  </div>
                `;
              }
              return `
                <div class="max-w-2xl mx-auto pb-1">
                  <button type="button" id="inv-w2-btn-connect-ai" class="noir-ai-blink-btn w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg cursor-pointer transition">
                    🔗 Kết nối AI của bạn (Mở khóa nút Tự động hoàn toàn với AI 1 chạm)
                  </button>
                </div>
              `;
            })()}

            ${(() => {
              const gBridge = globalScope.NoirGeminiBridge || NS.geminiBridge;
              const hasGKey = Boolean(gBridge?.hasApiKey?.() || INV.researchEngine?.getActiveGeminiApiKey?.());
              const manualInner = `
            <!-- Nút chính Bước 1: Copy sẵn & Chuyển hướng sang Gemini ngay -->
            <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button type="button" id="inv-w2-btn-launch-gemini" class="inv-gemini-btn text-xs sm:text-sm py-2.5 px-5">
                🪟 Copy sẵn câu lệnh &amp; Chuyển hướng sang Gemini ngay
              </button>
              <button type="button" id="inv-w2-btn-preview-prompt" class="inv-secondary-btn text-xs">👁️ Xem câu lệnh / Tải .MD</button>
            </div>
            <div class="p-2.5 rounded-xl border border-amber-500/45 bg-amber-500/10 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200 text-left max-w-2xl mx-auto">
              📱 <b>Lưu ý riêng cho Điện thoại (Mobile):</b> Vì văn bản câu lệnh dài, khi sang Gemini (hoặc khi dán kết quả về Bước 2), bạn hãy <b>CHẠM GIỮ ngón tay 1–2 giây vào khung nhập → bấm nút "Dán"</b> hiện ra trên màn hình <i>(KHÔNG bấm vào thanh gợi ý nhanh của bàn phím vì điện thoại hay copy/dán thiếu dòng!)</i>.
            </div>
          </div>

          <!-- BƯỚC 2: DÁN CÂU TRẢ LỜI GEMINI + HÌNH MÔ PHỎNG NÚT SAO CHÉP + ĐẾM NGƯỢC 3 GIÂY -->
          <div class="pt-4 border-t border-emerald-500/30 space-y-3">
            <span class="inv-step-badge" style="background:rgba(56,189,248,0.18);color:#38bdf8;border-color:rgba(56,189,248,0.45);">📥 BƯỚC 2: DÁN CÂU TRẢ LỜI GEMINI ĐỂ TỰ CẬP NHẬT BIỂU ĐỒ &amp; DỮ LIỆU</span>

            <!-- Màn hình mô phỏng nút Sao chép ở cuối câu trả lời hoàn chỉnh của Gemini -->
            <div class="rounded-2xl border border-zinc-700 bg-zinc-950 text-zinc-200 p-3 space-y-2 text-left max-w-2xl mx-auto shadow-inner">
              <div class="flex items-center justify-between text-[10.5px] text-zinc-400">
                <span class="font-extrabold text-sky-300">✨ Mô phỏng màn hình kết quả của Gemini (cuộn xuống cuối câu trả lời)</span>
                <span class="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">Hướng dẫn trực quan</span>
              </div>
              <div class="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 space-y-1 font-mono">
                <div class="text-emerald-300 font-bold">## 1. Kết luận nhanh trong 3 câu ... ## 6. Chiến lược hành động</div>
                <div class="text-zinc-400">\`\`\`json { "schema": "INVEST_INTEL_SYNC_V2", "channel_scores": {...}, "allocation_pct": [...] } \`\`\`</div>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div class="flex items-center gap-2 text-zinc-400 text-xs">
                  <span class="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800">👍</span>
                  <span class="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800">👎</span>
                  <span class="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800">🔄</span>
                  <span class="inv-gemini-copy-demo-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs border border-emerald-300">
                    📋 Sao chép (Copy)
                  </span>
                </div>
                <span class="text-[11px] font-extrabold text-amber-300">👈 Bấm đúng nút Sao chép này ở cuối bài Gemini rồi dán xuống dưới!</span>
              </div>
            </div>

            <!-- Ô dán câu trả lời Gemini + Nút Đồng bộ -->
            <div class="space-y-2 max-w-2xl mx-auto">
              <div class="p-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 text-[11px] text-sky-900 dark:text-sky-200 text-left">
                📱 <b>Cách Dán đúng 100% trên Điện thoại:</b> Chạm giữ ngón tay <b>1–2 giây</b> vào khung dưới cho đến khi hiện nút chữ <b>"Dán"</b> rồi mới bấm — giúp giữ nguyên toàn bộ dòng phân tích và khối JSON ở cuối!
              </div>
              <textarea id="inv-w2-gemini-paste" rows="4" placeholder="PC: nhấn Ctrl + V | Mobile: CHẠM GIỮ 1–2 giây vào ô này rồi bấm nút 'Dán'..." class="w-full p-3 rounded-xl border-2 border-sky-500/45 bg-white dark:bg-zinc-950 text-xs font-mono focus:outline-none focus:border-emerald-400"></textarea>

              ${
                countdown
                  ? `<div class="p-3.5 rounded-2xl border-2 border-emerald-400 bg-emerald-500/18 text-center space-y-2">
                      <div class="text-sm font-black text-emerald-700 dark:text-emerald-300">✅ ${esc(countdown.msg)}</div>
                      <div class="text-xs font-extrabold text-amber-600 dark:text-amber-300">
                        ⏳ Tự động chuyển sang trang Phân tích, Biểu đồ, Báo chí &amp; Link chính thức sau <span class="text-base font-black">${countdown.sec}</span> giây...
                      </div>
                      <button type="button" id="inv-w2-btn-enter-now" class="inv-primary-btn py-1.5 px-4 text-xs">👉 Vào xem ngay bây giờ</button>
                    </div>`
                  : `<div class="flex flex-wrap items-center justify-center gap-2">
                      <button type="button" id="inv-w2-btn-sync" class="inv-primary-btn text-xs sm:text-sm py-2.5 px-6">
                        ⚡ Đồng bộ câu trả lời Gemini &amp; Tổng hợp biểu đồ
                      </button>
                    </div>`
              }
            </div>
          </div>`;
              if (hasGKey) {
                return `<details class="max-w-2xl mx-auto text-left rounded-xl border border-zinc-300/60 dark:border-zinc-700/70 p-2.5"><summary class="text-xs font-bold text-zinc-500 dark:text-zinc-400 cursor-pointer">⚙️ Tùy chọn nâng cao (Copy Prompt / Dán kết quả thủ công)</summary><div class="pt-3 space-y-3">${manualInner}</div></details>`;
              }
              return `<div>${manualInner}</div>`;
            })()}

          <div class="pt-2 text-center">
            <button type="button" id="inv-w2-btn-skip-to-dashboard" class="text-[11px] text-zinc-500 hover:text-emerald-500 underline cursor-pointer">
              Hoặc bỏ qua Gemini — xem ngay phân tích &amp; 6 biểu đồ từ dữ liệu Code vừa quét →
            </button>
          </div>
        </div>
        ${disclaimerFooterHtml()}
      </div>`;
  }

  // --------------------------------------------------------------------------
  // BỘ TÙY CHỈNH CỠ CHỮ (4 MỨC — MẶC ĐỊNH RẤT RÕ), PHÔNG CHỮ & NỀN SÁNG/TỐI
  // + POP-UP XUẤT PDF CHUYÊN NGHIỆP 4 CHẾ ĐỘ (TỔNG QUÁT / VÀNG / CHỨNG KHOÁN / NHÀ ĐẤT)
  // --------------------------------------------------------------------------
  const INV_READER_KEY = 'bi_inv49_reader_prefs_v1';
  const INV_SIZES = Object.freeze({
    md: { label: 'Vừa', px: 15 },
    lg: { label: 'Lớn', px: 17.5 },
    xl: { label: 'Rất lớn', px: 20 },
    xxl: { label: 'Cực đại', px: 23 },
  });
  const INV_FONTS = Object.freeze({
    sans: { label: 'Hiện đại (Sans)', css: '"Segoe UI", system-ui, -apple-system, sans-serif' },
    serif: { label: 'Báo chí (Serif)', css: 'Georgia, "Times New Roman", serif' },
    classic: { label: 'Sách in (Classic)', css: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
    mono: { label: 'Kỹ thuật (Mono)', css: '"Cascadia Mono", Consolas, monospace' },
  });

  function loadInvReaderPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(INV_READER_KEY) || '{}');
      return {
        size: INV_SIZES[raw.size] ? raw.size : 'lg',
        font: INV_FONTS[raw.font] ? raw.font : 'sans',
        paperTheme: raw.paperTheme === 'dark' ? 'dark' : 'light',
      };
    } catch (_e) {
      return { size: 'lg', font: 'sans', paperTheme: 'light' };
    }
  }

  function saveInvReaderPrefs(p) {
    try { localStorage.setItem(INV_READER_KEY, JSON.stringify(p)); } catch (_e) {}
  }

  function renderInvReaderBarHtml() {
    const p = loadInvReaderPrefs();
    return `
      <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 mb-3 rounded-xl border border-zinc-300/60 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-900/80 text-xs">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="font-extrabold opacity-80">🔤 Cỡ chữ:</span>
          ${Object.entries(INV_SIZES).map(([k, v]) => `
            <button type="button" data-inv-rsize="${k}" class="px-2.5 py-1 rounded-lg font-extrabold cursor-pointer transition ${p.size === k ? 'bg-emerald-600 text-white shadow' : 'bg-zinc-200/80 dark:bg-zinc-800 hover:bg-emerald-500/20'}">${v.label}</button>
          `).join('')}
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <select id="inv-rfont-sel" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold text-xs cursor-pointer">
            ${Object.entries(INV_FONTS).map(([k, v]) => `<option value="${k}" ${p.font === k ? 'selected' : ''}>Kiểu: ${v.label}</option>`).join('')}
          </select>
          <button type="button" id="inv-rtheme-toggle" class="px-2.5 py-1 rounded-lg font-extrabold cursor-pointer border border-zinc-400/50 ${p.paperTheme === 'dark' ? 'bg-slate-900 text-amber-300' : 'bg-white text-slate-900'}">
            ${p.paperTheme === 'dark' ? '🌙 Nền báo cáo: Tối' : '☀️ Nền báo cáo: Sáng'}
          </button>
        </div>
      </div>
    `;
  }

  function applyInvReaderStyles(host) {
    if (!host) return;
    const p = loadInvReaderPrefs();
    const sz = INV_SIZES[p.size]?.px || 17.5;
    const ff = INV_FONTS[p.font]?.css || INV_FONTS.sans.css;
    host.setAttribute('data-reader-size', p.size);
    host.setAttribute('data-reader-font', p.font);
    host.style.fontSize = `${sz}px`;
    host.style.fontFamily = ff;
    host.querySelectorAll('.inv-exec-paper').forEach((paper) => {
      paper.style.fontSize = `${sz}px`;
      paper.style.fontFamily = ff;
      paper.style.background = p.paperTheme === 'dark' ? '#0f172a' : '#ffffff';
      paper.style.color = p.paperTheme === 'dark' ? '#f1f5f9' : '#1e293b';
    });
  }

  function bindInvReaderEvents(host) {
    if (!host) return;
    host.querySelectorAll('[data-inv-rsize]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = loadInvReaderPrefs();
        p.size = btn.getAttribute('data-inv-rsize') || 'lg';
        saveInvReaderPrefs(p);
        render();
      });
    });
    host.querySelector('#inv-rfont-sel')?.addEventListener('change', (ev) => {
      const p = loadInvReaderPrefs();
      p.font = ev.target.value || 'sans';
      saveInvReaderPrefs(p);
      applyInvReaderStyles(host);
    });
    host.querySelector('#inv-rtheme-toggle')?.addEventListener('click', () => {
      const p = loadInvReaderPrefs();
      p.paperTheme = p.paperTheme === 'dark' ? 'light' : 'dark';
      saveInvReaderPrefs(p);
      render();
    });
    host.querySelector('#inv-btn-open-pdf-export-modal')?.addEventListener('click', () => {
      uiState.highlightExportPdfCta = false;
      openInvestPdfExportModal();
    });
  }

  function openInvestPdfExportModal() {
    document.getElementById('inv-pdf-export-modal')?.remove();
    const esc = INV.utils.escapeHtml;
    const st = INV.stateManager.stockData;
    const hasStock = Boolean(st && st.symbol);
    const areaLabel = INV.stateManager.realEstateData?.areaLabel || INV.stateManager.userRegion?.areaLabel || 'Chưa chọn khu vực';
    const p = loadInvReaderPrefs();

    const modal = document.createElement('div');
    modal.id = 'inv-pdf-export-modal';
    modal.className = 'fixed inset-0 z-[2147483640] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4';
    modal.innerHTML = `
      <div class="w-full max-w-2xl rounded-2xl border-2 border-emerald-400/70 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div class="px-5 py-3.5 bg-gradient-to-r from-[#0b2239] via-[#163b63] to-[#0f4c68] border-b border-teal-500/40 flex items-center justify-between gap-2">
          <div>
            <div class="text-sm sm:text-base font-black text-white">📄 Xuất Báo Cáo PDF Chuyên Nghiệp (4 Chế Độ)</div>
            <div class="text-xs text-teal-200/90">Định dạng Báo Cáo Tài Chính Navy–Teal có trang bìa, bảng số liệu &amp; biểu đồ</div>
          </div>
          <button type="button" id="inv-pdf-m-close" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer">✕ Đóng</button>
        </div>

        <div class="p-4 sm:p-5 space-y-4 overflow-y-auto text-sm">
          <!-- Tùy chỉnh kiểu chữ, 4 cỡ chữ & nền PDF -->
          <div class="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 flex flex-wrap items-center gap-2 text-xs">
            <span class="font-extrabold text-teal-300">🎨 Tùy chỉnh PDF:</span>
            <select id="inv-pdf-opt-size" class="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 font-bold">
              ${Object.entries(INV_SIZES).map(([k, v]) => `<option value="${k}" ${p.size === k ? 'selected' : ''}>Cỡ chữ: ${v.label}</option>`).join('')}
            </select>
            <select id="inv-pdf-opt-font" class="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 font-bold">
              ${Object.entries(INV_FONTS).map(([k, v]) => `<option value="${k}" ${p.font === k ? 'selected' : ''}>Phông: ${v.label}</option>`).join('')}
            </select>
            <select id="inv-pdf-opt-theme" class="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 font-bold">
              <option value="light" ${p.paperTheme === 'light' ? 'selected' : ''}>☀️ Nền giấy trắng (In đẹp)</option>
              <option value="dark" ${p.paperTheme === 'dark' ? 'selected' : ''}>🌙 Nền tối (Đọc màn hình)</option>
            </select>
          </div>

          <!-- 4 lựa chọn xuất file -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" data-inv-pdf-mode="overview" class="text-left p-4 rounded-xl border-2 border-emerald-500/60 bg-emerald-950/35 hover:bg-emerald-900/45 transition cursor-pointer space-y-1">
              <div class="text-sm font-black text-emerald-300">1. 📊 Xuất file phân tích Tổng quát</div>
              <div class="text-xs text-zinc-300">Toàn cảnh 4 kênh, biểu đồ điểm hấp dẫn, Radar rủi ro &amp; bài phân tích Gemini.</div>
            </button>

            <button type="button" data-inv-pdf-mode="gold" class="text-left p-4 rounded-xl border-2 border-amber-500/60 bg-amber-950/35 hover:bg-amber-900/45 transition cursor-pointer space-y-1">
              <div class="text-sm font-black text-amber-300">2. 🥇 Xuất file phân tích Giá Vàng</div>
              <div class="text-xs text-zinc-300">Giá XAU/USD, SJC nội địa, độ chênh lệch nội–ngoại, spread &amp; cảnh báo chốt chặn.</div>
            </button>

            <div class="text-left p-4 rounded-xl border-2 ${hasStock ? 'border-sky-500/60 bg-sky-950/35' : 'border-sky-500/45 bg-sky-950/20'} transition space-y-2">
              <button type="button" data-inv-pdf-mode="stock" class="w-full text-left cursor-pointer space-y-1">
                <div class="text-sm font-bold text-sky-300">3. 📈 Xuất file phân tích Chứng khoán ${hasStock ? `(${esc(st.symbol)})` : '(Tự quét nhanh ngay tại đây!)'}</div>
                <div class="text-xs text-zinc-300">
                  ${hasStock ? `Đã sẵn sàng dữ liệu sống của ${esc(st.symbol)} (${esc(st.companyName)}) — P/E, P/B, ROE, Tăng trưởng 5Y.` : 'Nhập mã cổ phiếu (VD: FPT, VCB, NVDA) vào ô bên dưới rồi bấm để quét &amp; xuất PDF ngay:'}
                </div>
              </button>
              <input id="inv-pdf-quick-stock-inp" type="text" value="${esc(hasStock ? st.symbol : (uiState.stockInput || ''))}" placeholder="Nhập mã cổ phiếu (VD: FPT, HPG, VCB, AAPL...)" class="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-sky-500/45 text-xs text-white uppercase font-bold" />
            </div>

            <div class="p-4 rounded-xl border-2 border-teal-500/60 bg-teal-950/35 space-y-2">
              <button type="button" data-inv-pdf-mode="real_estate" class="w-full text-left cursor-pointer space-y-1">
                <div class="text-sm font-black text-teal-300">4. 🏠 Xuất file phân tích Nhà đất</div>
                <div class="text-xs text-zinc-300">Khu vực hiện tại: <strong class="text-white">${esc(areaLabel)}</strong></div>
              </button>
              <button type="button" id="inv-pdf-change-re-area" class="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black cursor-pointer">📍 Đổi khu vực nhà đất</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeIt = () => modal.remove();
    modal.querySelector('#inv-pdf-m-close')?.addEventListener('click', closeIt);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) closeIt(); });
    modal.querySelector('#inv-pdf-change-re-area')?.addEventListener('click', () => {
      closeIt();
      openChangeRegionConfirmModal();
    });
    modal.querySelectorAll('[data-inv-pdf-mode]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        const mode = btn.getAttribute('data-inv-pdf-mode') || 'overview';
        const opts = {
          size: modal.querySelector('#inv-pdf-opt-size')?.value || p.size,
          font: modal.querySelector('#inv-pdf-opt-font')?.value || p.font,
          paperTheme: modal.querySelector('#inv-pdf-opt-theme')?.value || p.paperTheme,
        };
        btn.disabled = true;
        const oldHtml = btn.innerHTML;
        try {
          if (mode === 'stock') {
            const inpTicker = String(modal.querySelector('#inv-pdf-quick-stock-inp')?.value || '').trim().toUpperCase();
            if (inpTicker && INV.stateManager.stockData?.symbol?.toUpperCase() !== inpTicker) {
              btn.innerHTML = `<div class="text-sm font-bold text-sky-300">⏳ Đang quét dữ liệu cổ phiếu ${esc(inpTicker)}...</div>`;
              const stSnap = await INV.stockEngine.lookupStockSnapshot(inpTicker);
              if (stSnap) INV.stateManager.stockData = stSnap;
            }
            if (!INV.stateManager.stockData?.symbol) {
              btn.disabled = false;
              btn.innerHTML = oldHtml;
              NS.utils?.showToast?.('⚠️ Vui lòng nhập mã cổ phiếu (VD: FPT, VCB, NVDA) trước khi xuất PDF Chứng khoán!', 'warning', 3200);
              modal.querySelector('#inv-pdf-quick-stock-inp')?.focus();
              return;
            }
          }
          btn.innerHTML = '<div class="text-sm font-bold text-emerald-300">⏳ Đang dựng file PDF sắc nét...</div>';
          const res = await INV.pdfExporter.exportInvestPdf(mode, opts);
          NS.utils?.showToast?.(`✅ Đã xuất Báo cáo PDF (${res.pages} trang) thành công!`, 'success', 4000);
          closeIt();
        } catch (err) {
          NS.utils?.showToast?.('⚠️ ' + (err?.message || err), 'error', 4200);
          btn.disabled = false;
          btn.innerHTML = oldHtml;
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // RENDER TỔNG KHUNG & GẮN SỰ KIỆN
  // --------------------------------------------------------------------------
  function render() {
    const host = INV.stateManager.hostEl;
    if (!host || !host.isConnected) return;

    // Pha A: Cổng xác định vị trí & chờ xác nhận (có sẵn thanh chỉnh cỡ chữ 4 mức ngay màn hình đầu!)
    if (!INV.stateManager.userRegion || uiState.wizardStage === 'location_gate') {
      host.innerHTML = `${renderInvReaderBarHtml()}${renderLocationGateScreen()}`;
      bindLocationGateEvents(host);
      bindInvReaderEvents(host);
      applyInvReaderStyles(host);
      NS.i18n?.translateElement?.(host);
      return;
    }

    // Pha B: Màn hình chờ Loading tra cứu toàn diện
    if (uiState.wizardStage === 'loading_full_scan') {
      host.innerHTML = `${renderInvReaderBarHtml()}${renderFullScanLoadingScreen()}`;
      bindInvReaderEvents(host);
      applyInvReaderStyles(host);
      NS.i18n?.translateElement?.(host);
      return;
    }

    // Pha C: Màn hình 2 Bước gọn gàng trước khi vào phân tích chi tiết
    if (uiState.wizardStage === 'two_step_setup') {
      host.innerHTML = `${renderInvReaderBarHtml()}${renderTwoStepSetupScreen()}`;
      bindTwoStepEvents(host);
      bindInvReaderEvents(host);
      applyInvReaderStyles(host);
      NS.i18n?.translateElement?.(host);
      return;
    }

    // Pha D: Bảng Phân tích 5 Tab đầy đủ (sau khi xong 2 bước)
    const reg = INV.stateManager.userRegion;
    const esc = INV.utils.escapeHtml;
    const tab = INV.stateManager.activeTab;
    let bodyHtml = '';
    if (tab === 'gold') bodyHtml = renderGoldTab();
    else if (tab === 'stock') bodyHtml = renderStockTab();
    else if (tab === 'realestate') bodyHtml = renderRealEstateTab();
    else if (tab === 'charts') bodyHtml = renderChartsTab();
    else bodyHtml = renderOverviewTab();

    host.innerHTML = `
      ${renderInvReaderBarHtml()}
      <div class="inv-root space-y-4">
        <!-- Header gọn nhẹ + Nút Đổi vị trí + Nút Xuất PDF Nổi bật Nhấp nháy -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 class="text-base font-black tracking-tight flex items-center gap-2 flex-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600 dark:text-emerald-400"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              <span>Đầu tư hôm nay</span>
              <span class="inv-pill inv-sig-positive text-[10.5px]">🌍 ${esc(reg.areaLabel)} (${esc(reg.currency)})</span>
              <button type="button" id="inv-btn-change-region" class="inv-change-loc-btn">📍 Đổi vị trí</button>
            </h3>
            <p class="text-[11.5px] text-zinc-500 dark:text-zinc-400">Tra cứu nhanh khi cần — Không chạy ngầm tốn máy · Bám sát ${esc(reg.countryName)} (${esc(reg.centralBank)}, ${esc(reg.stockIndex)})</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" id="inv-btn-open-pdf-export-modal" class="inv-gemini-copy-demo-btn px-4 py-2.5 rounded-xl font-black text-sm text-white cursor-pointer shadow-xl border-2 border-amber-300 ${uiState.highlightExportPdfCta ? 'animate-pulse ring-4 ring-amber-400/95 shadow-[0_0_28px_rgba(251,191,36,0.85)]' : ''}" style="background:linear-gradient(135deg,#059669 0%,#0d9488 50%,#0284c7 100%);">
              📄 Xuất Báo Cáo PDF (4 Chế Độ)${uiState.highlightExportPdfCta ? ' 👇 Bấm ngay!' : ''}
            </button>
            <button type="button" id="inv-btn-back-to-2steps" class="inv-secondary-btn text-xs py-1.5 px-3">🔁 Màn hình 2 Bước</button>
            <button type="button" id="inv-btn-header-gemini" class="inv-gemini-btn text-xs py-2 px-3">
              🪟 Mở cùng Gemini
            </button>
          </div>
        </div>

        <!-- 5 Thẻ điều hướng lớn (Tab Biểu đồ phân tích chuyên nghiệp nằm ngay bên phải Nhà đất quanh đây) -->
        <div class="inv-tab-bar" role="tablist">
          <button type="button" data-inv-tab="overview" class="inv-tab-btn ${tab === 'overview' ? 'is-active' : ''}">🧭 Tổng quan &amp; Đánh giá</button>
          <button type="button" data-inv-tab="gold" class="inv-tab-btn ${tab === 'gold' ? 'is-active' : ''}">🥇 Giá vàng</button>
          <button type="button" data-inv-tab="stock" class="inv-tab-btn ${tab === 'stock' ? 'is-active' : ''}">📊 Chứng khoán</button>
          <button type="button" data-inv-tab="realestate" class="inv-tab-btn ${tab === 'realestate' ? 'is-active' : ''}">🏘️ Nhà đất quanh đây</button>
          <button type="button" data-inv-tab="charts" class="inv-tab-btn ${tab === 'charts' ? 'is-active' : ''}">📈 Biểu đồ phân tích chuyên nghiệp</button>
        </div>

        <!-- Nội dung thẻ hiện tại -->
        <div id="inv-tab-content">${bodyHtml}</div>
      </div>`;

    bindEvents(host);
    bindInvReaderEvents(host);
    applyInvReaderStyles(host);
    NS.i18n?.translateElement?.(host);
  }

  async function completeRegionEntry(regionObj) {
    INV.stateManager.userRegion = regionObj;
    INV.storageAdapter.setSession('user_region', regionObj);
    if (regionObj.areaLabel) {
      INV.stateManager.realEstateData = INV.realEstateEngine.resolveManualArea(regionObj.areaLabel);
      uiState.reManualInput = regionObj.areaLabel;
    }

    // Chuyển ngay sang Pha B: Màn hình chờ Loading tra cứu thông tin toàn diện!
    uiState.gateLoading = false;
    uiState.gateStatus = '';
    uiState.gateError = '';
    uiState.pendingGpsRegion = null;
    uiState.wizardStage = 'loading_full_scan';
    uiState.loadingDone = false;
    uiState.loadingPct = 12;
    uiState.loadingLabel = `Đang tra cứu thông tin toàn diện cho ${regionObj.areaLabel} (${regionObj.countryName})...`;
    render();

    const { controller, signal } = INV.stateManager.createSignal();
    try {
      const [rep, goldSnap, hist30d] = await Promise.all([
        INV.researchEvaluator.runEvaluation({
          depth: 'full',
          force: true,
          onProgress: (p) => {
            uiState.loadingPct = Math.max(12, Math.min(92, p.pct || 50));
            uiState.loadingLabel = p.label || 'Đang tổng hợp dữ liệu...';
            render();
          },
        }),
        INV.goldEngine.fetchLiveGoldSnapshot({ force: false, signal }).catch(() => null),
        INV.goldEngine.fetchGoldHistory30d ? INV.goldEngine.fetchGoldHistory30d(signal).catch(() => null) : Promise.resolve(null),
      ]);
      if (goldSnap) INV.stateManager.goldData = goldSnap;
      if (hist30d) uiState.goldHistory30d = hist30d;
      if (rep && INV.deterministicExtractor?.buildUnifiedAnalyticsFromCode) {
        INV.stateManager.unifiedAnalytics = INV.deterministicExtractor.buildUnifiedAnalyticsFromCode({
          report: rep,
          goldSnap: INV.stateManager.goldData,
          goldHist30d: uiState.goldHistory30d || rep.gold_history_30d,
          stockData: INV.stateManager.stockData,
          reData: INV.stateManager.realEstateData,
          surveys: INV.storageAdapter.getRealEstateSurveys ? INV.storageAdapter.getRealEstateSurveys() : [],
        });
      }
    } catch (_eInitEval) {
    } finally {
      INV.stateManager.releaseController(controller);
    }

    uiState.loadingPct = 100;
    uiState.loadingDone = true;
    uiState.loadingLabel = '✅ Đã tra cứu thông tin toàn diện & tổng hợp sẵn câu lệnh Gemini!';
    render();
    NS.utils?.showToast?.('✅ Đã tra cứu xong dữ liệu toàn diện! Mời bạn thực hiện 2 bước ngắn gọn tiếp theo.', 'success', 3400);

    setTimeout(() => {
      if (!INV.stateManager.hostEl || !INV.stateManager.userRegion) return;
      uiState.wizardStage = 'two_step_setup';
      INV.storageAdapter.setSession('wizard_stage', 'two_step_setup');
      render();
    }, 750);
  }

  function bindLocationGateEvents(host) {
    try {
      (globalScope.NoirGeminiBridge || NS.geminiBridge)?.maybeShowWelcomeApiUpsellModal?.('mod49', () => render());
    } catch (_eUp) {}
    host.querySelector('#inv-gate-btn-connect-ai')?.addEventListener('click', () => {
      (globalScope.NoirGeminiBridge || NS.geminiBridge)?.openApiKeyQuickModal?.({ onSaved: () => render() });
    });
    const sel = host.querySelector('#inv-gate-country-sel');
    const inp = host.querySelector('#inv-gate-area-inp');
    sel?.addEventListener('change', () => { uiState.gateCountry = sel.value; });
    inp?.addEventListener('input', () => { uiState.gateAreaInput = inp.value; });

    host.querySelector('#inv-gate-btn-gps')?.addEventListener('click', async () => {
      if (uiState.gateLoading) return;
      uiState.gateLoading = true;
      uiState.gateError = '';
      uiState.pendingGpsRegion = null;
      uiState.gateStatus = '📡 Đang xin quyền Vị trí (GPS) và nhận diện khu vực của bạn...';
      render();
      const { controller, signal } = INV.stateManager.createSignal();
      try {
        const reg = await INV.detectUserRegionByGps(signal);
        if (signal.aborted) return;
        // Dò vị trí xong -> DỪNG LẠI CHỜ NGƯỜI DÙNG BẤM XÁC NHẬN!
        uiState.gateLoading = false;
        uiState.gateStatus = '';
        uiState.pendingGpsRegion = reg;
        render();
      } catch (err) {
        uiState.gateLoading = false;
        uiState.gateStatus = '';
        uiState.gateError = err?.message || 'Chưa lấy được vị trí GPS.';
        render();
      } finally {
        INV.stateManager.releaseController(controller);
      }
    });

    host.querySelector('#inv-gate-btn-confirm-gps')?.addEventListener('click', async () => {
      if (!uiState.pendingGpsRegion) return;
      await completeRegionEntry(uiState.pendingGpsRegion);
    });

    host.querySelector('#inv-gate-btn-manual')?.addEventListener('click', async () => {
      if (uiState.gateLoading) return;
      uiState.gateError = '';
      const code = sel?.value || uiState.gateCountry || 'VN';
      const area = (inp?.value || uiState.gateAreaInput || '').trim();
      const profile = INV.resolveCountryProfile(code, undefined, area || undefined, 'manual');
      await completeRegionEntry(profile);
    });
  }

  function bindTwoStepEvents(host) {
    host.querySelector('#inv-btn-change-region')?.addEventListener('click', openChangeRegionConfirmModal);

    host.querySelectorAll('[data-w2-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.w2Mode = btn.getAttribute('data-w2-mode') || 'veteran30';
        INV.storageAdapter.savePrefs({ promptMode: uiState.w2Mode });
        render();
      });
    });

    host.querySelectorAll('[data-w2-focus]').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.w2Focus = btn.getAttribute('data-w2-focus') || 'general';
        render();
      });
    });

    const goalEl = host.querySelector('#inv-w2-goal');
    const notesEl = host.querySelector('#inv-w2-notes');
    const autoMergeInputs = () => {
      const gVal = (goalEl?.value || '').trim();
      const nVal = (notesEl?.value || '').trim();
      INV.storageAdapter.savePrefs({ userGoal: gVal, fieldNotes: nVal });
      if (gVal || nVal) {
        uiState.w2AutoMergeNotice = '✅ Đã tự động kết hợp Khẩu vị / Số liệu BCTC & thực địa vào câu lệnh Gemini!';
      } else {
        uiState.w2AutoMergeNotice = '';
      }
      render();
    };
    goalEl?.addEventListener('blur', autoMergeInputs);
    notesEl?.addEventListener('blur', autoMergeInputs);

    host.querySelector('#inv-w2-btn-connect-ai')?.addEventListener('click', () => {
      (globalScope.NoirGeminiBridge || NS.geminiBridge)?.openApiKeyQuickModal?.({ onSaved: () => render() });
    });

    host.querySelector('#inv-w2-btn-full-auto-ai')?.addEventListener('click', async () => {
      const runFullAutoInvest = async () => {
        const gBridge = globalScope.NoirGeminiBridge || NS.geminiBridge;
        const apiKey = gBridge?.getApiKey?.() || INV.researchEngine?.getActiveGeminiApiKey?.();
        if (!apiKey) {
          gBridge?.openApiKeyQuickModal?.({ onSaved: () => render() });
          return;
        }
        const gVal = (goalEl?.value || '').trim();
        const nVal = (notesEl?.value || '').trim();
        const tickerVal = (host.querySelector('#inv-w2-stock-ticker')?.value || '').trim().toUpperCase();
        INV.storageAdapter.savePrefs({ promptMode: uiState.w2Mode, userGoal: gVal, fieldNotes: nVal });

        const loader = gBridge?.showAiFullLoadingOverlay?.(
          '🚀 Đang chạy quy trình Đầu Tư AI → PDF...',
          'Bước 1/4: Kiểm tra dữ liệu thị trường, bài báo & link nguồn thật'
        );
        let builtPromptText = '';
        const applyInvestReplyAndExport = async (replyText, groundingUrls = []) => {
          const parsed = INV.deterministicExtractor?.parseGeminiStructuredReply
            ? INV.deterministicExtractor.parseGeminiStructuredReply(replyText)
            : { ok: false };
          const prevRep = INV.stateManager.evaluationReport || { items: [], triggered_breakers: [], live_headlines: [] };
          if (parsed.ok && parsed.data) {
            const synced = parsed.data;
            INV.stateManager.unifiedAnalytics = synced;
            const mkChannel = (key, name, fb) => {
              const dm = (synced.decision_matrix || []).find((d) => String(d?.channel || '').toLowerCase().includes(fb)) || {};
              const sc = synced.channel_scores?.[key] ?? 60;
              return {
                name,
                score: sc,
                signal: dm.signal || (sc >= 72 ? 'positive' : sc <= 48 ? 'danger' : 'caution'),
                badge: dm.decision || (sc >= 72 ? 'Thuận lợi' : sc <= 48 ? 'Thận trọng cao' : 'Theo dõi'),
                reason: dm.reason || prevRep.channel_scores?.[key]?.reason || '',
              };
            };
            INV.stateManager.evaluationReport = {
              ...prevRep,
              as_of_date: synced.as_of_date || prevRep.as_of_date,
              cycle_phase: synced.cycle_phase || prevRep.cycle_phase,
              channel_scores: {
                cash: mkChannel('cash', 'Tiền mặt / Tiết kiệm', 'tiền'),
                gold: mkChannel('gold', 'Vàng', 'vàng'),
                stock: mkChannel('stock', 'Chứng khoán', 'chứng'),
                real_estate: mkChannel('real_estate', 'Nhà đất', 'đất'),
              },
              narrative_summary: {
                opportunities: synced.verdict_summary?.opportunities?.length ? synced.verdict_summary.opportunities : prevRep.narrative_summary?.opportunities || [],
                risks: synced.verdict_summary?.risks?.length ? synced.verdict_summary.risks : prevRep.narrative_summary?.risks || [],
                current_outlook: synced.verdict_summary?.current_outlook || prevRep.narrative_summary?.current_outlook || '',
                upcoming_outlook: synced.verdict_summary?.upcoming_outlook || prevRep.narrative_summary?.upcoming_outlook || '',
              },
            };
          }
          if (INV.stateManager.evaluationReport) {
            INV.stateManager.evaluationReport.gemini_raw_note = String(replyText || '').slice(0, 8000);
            if (Array.isArray(groundingUrls) && groundingUrls.length) {
              const existing = INV.stateManager.evaluationReport.live_headlines || [];
              const extraLinks = groundingUrls.map((g) => ({
                title: g.title || g.url,
                source: 'Google Search Grounding',
                url: g.url,
                selected_for_prompt: true,
              }));
              INV.stateManager.evaluationReport.live_headlines = [...existing, ...extraLinks];
            }
          }
          const focusToPdfMode = uiState.w2Focus === 'gold'
            ? 'gold'
            : uiState.w2Focus === 'real_estate'
              ? 'real_estate'
              : (uiState.w2Focus === 'stock' && INV.stateManager.stockData?.symbol ? 'stock' : 'overview');
          INV.storageAdapter.setSession('wizard_stage', 'dashboard');
          uiState.wizardStage = 'dashboard';
          INV.stateManager.activeTab = 'overview';
          uiState.highlightExportPdfCta = true;
          render();
          const pdfRes = await INV.pdfExporter.exportInvestPdf(focusToPdfMode, loadInvReaderPrefs());
          NS.utils?.showToast?.(`✅ Đã hoàn tất AI & xuất thẳng Báo cáo PDF (${pdfRes.pages} trang — đủ 100% trích dẫn & biểu đồ)!`, 'success', 5000);
          return pdfRes;
        };

        try {
          if (!INV.stateManager.evaluationReport?.items?.length) {
            loader?.update?.('🔍 Bước 1/4: Đang quét 34 chỉ tiêu vĩ mô & báo chí chính thống...', 16);
            loader?.addLog?.('⏳ Đang chạy bộ quét dữ liệu vĩ mô & báo chí...', 'info');
            await INV.researchEvaluator.runEvaluation({ depth: 'full', force: false }).catch(() => null);
          }
          const rep0 = INV.stateManager.evaluationReport || {};
          const itemCnt = rep0.items?.length || 0;
          const newsCnt = rep0.live_headlines?.length || 0;
          loader?.addLog?.(`✅ Bước 1: Code đã thu thập ${itemCnt} chỉ tiêu + ${newsCnt} bài báo có link nguồn gốc.`, 'ok');

          if (uiState.w2Focus === 'stock' && tickerVal && INV.stockEngine?.lookupStockSnapshot) {
            loader?.update?.(`📊 Đang quét báo cáo tài chính mã ${tickerVal}...`, 26);
            uiState.stockInput = tickerVal;
            const st = await INV.stockEngine.lookupStockSnapshot(tickerVal).catch(() => null);
            if (st) {
              INV.stateManager.stockData = st;
              loader?.addLog?.(`✅ Đã lấy dữ liệu cổ phiếu ${st.symbol} (${st.companyName || ''}).`, 'ok');
            }
          }

          builtPromptText = INV.promptComposer.buildGeminiPrompt({
            mode: uiState.w2Mode || 'veteran30',
            focus: uiState.w2Focus || 'general',
            userGoal: gVal,
            fieldNotes: nVal,
          });
          loader?.update?.('🧠 Bước 2/4: Đang gửi Prompt + Dữ liệu sang Gemini AI...', 44);
          loader?.setSub?.(`Đã đóng gói ${builtPromptText.length.toLocaleString('vi-VN')} ký tự dữ liệu & lệnh phân tích`);
          loader?.addLog?.(`📤 Bước 2: Đã gửi Prompt đầy đủ (${builtPromptText.length.toLocaleString('vi-VN')} ký tự) tới Gemini API...`, 'info');

          const aiRes = await gBridge.callGeminiWithGrounding({
            prompt: builtPromptText,
            apiKey,
            taskType: 'deep_analysis',
            temperature: 0.2,
            maxOutputTokens: 8192,
            useGoogleSearch: true,
          });
          const reply = String(aiRes?.text || '').trim();
          if (!reply) throw new Error('Gemini trả về phản hồi rỗng.');
          loader?.addLog?.(
            `✅ Bước 3: Gemini (${aiRes.model}${aiRes.usedGrounding ? ' + Google Search' : ''}) đã hoàn tất (${reply.length.toLocaleString('vi-VN')} ký tự, ${aiRes.groundingUrls?.length || 0} nguồn bổ sung).`,
            'ok'
          );

          loader?.update?.('📄 Bước 4/4: Đang đồng bộ 6 biểu đồ & xuất thẳng Báo cáo PDF...', 88);
          loader?.addLog?.('📄 Bước 4: Đang dựng file PDF kèm đầy đủ biểu đồ & trích dẫn...', 'info');
          await applyInvestReplyAndExport(reply, aiRes?.groundingUrls || []);
          loader?.close?.();
        } catch (err) {
          loader?.addLog?.(`❌ Lỗi: ${err?.message || err}`, 'err');
          if (!builtPromptText) {
            try {
              builtPromptText = INV.promptComposer.buildGeminiPrompt({
                mode: uiState.w2Mode || 'veteran30',
                focus: uiState.w2Focus || 'general',
                userGoal: gVal,
                fieldNotes: nVal,
              });
            } catch (_ePr) {}
          }
          loader?.showError?.(
            '⚠️ Không thể hoàn tất luồng Đầu Tư AI tự động',
            String(err?.message || err),
            {
              onRetry: () => runFullAutoInvest(),
              onChangeKey: () => render(),
              manualFallback: builtPromptText
                ? {
                    taskTitle: 'Đầu Tư Hôm Nay — Dán kết quả Gemini Web → Xuất PDF ngay',
                    promptText: builtPromptText,
                    applyBtnLabel: '✅ Đồng bộ 6 Biểu đồ & Xuất thẳng PDF ngay',
                    onApplyPasted: async (pasted) => {
                      await applyInvestReplyAndExport(pasted, []);
                    },
                  }
                : null,
            }
          );
        }
      };
      await runFullAutoInvest();
    });

    // Bước 1: Copy sẵn câu lệnh (đúng chế độ + trọng tâm + khẩu vị/BCTC) & chuyển hướng thẳng sang Gemini!
    host.querySelector('#inv-w2-btn-launch-gemini')?.addEventListener('click', async () => {
      const gVal = (goalEl?.value || '').trim();
      const nVal = (notesEl?.value || '').trim();
      INV.storageAdapter.savePrefs({ promptMode: uiState.w2Mode, userGoal: gVal, fieldNotes: nVal });
      const promptText = INV.promptComposer.buildGeminiPrompt({
        mode: uiState.w2Mode || 'veteran30',
        focus: uiState.w2Focus || 'general',
        userGoal: gVal,
        fieldNotes: nVal,
      });
      const copied = await INV.promptComposer.safeCopyText(promptText);
      if (!copied.ok) INV.promptComposer.showManualCopyModal(promptText);
      if (NS.geminiSplitBridge?.launchExternalSplitWindow) {
        NS.geminiSplitBridge.launchExternalSplitWindow('GEMINI', false);
      } else {
        window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
      }
      NS.utils?.showToast?.(
        '✅ Đã copy sẵn toàn bộ câu lệnh đầu tư! Trên Điện thoại: CHẠM GIỮ 1–2 giây vào ô nhập Gemini rồi bấm "Dán" (tránh gợi ý bàn phím hay cắt thiếu dòng!).',
        'success',
        6000
      );
    });

    host.querySelector('#inv-w2-btn-preview-prompt')?.addEventListener('click', () => {
      const gVal = (goalEl?.value || '').trim();
      const nVal = (notesEl?.value || '').trim();
      INV.storageAdapter.savePrefs({ promptMode: uiState.w2Mode, userGoal: gVal, fieldNotes: nVal });
      INV.promptComposer.openGeminiConfirmModal({
        mode: uiState.w2Mode || 'veteran30',
        focus: uiState.w2Focus || 'general',
      });
    });

    const focusExportPdfButtonNow = () => {
      uiState.highlightExportPdfCta = true;
      requestAnimationFrame(() => {
        const pdfBtn = host.querySelector('#inv-btn-open-pdf-export-modal');
        if (pdfBtn) {
          try { pdfBtn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_e) {}
          try { pdfBtn.focus({ preventScroll: true }); } catch (_e2) {}
        }
      });
    };

    const enterDashboardNow = (highlightPdf = false) => {
      if (uiState.w2CountdownTimerId) {
        clearInterval(uiState.w2CountdownTimerId);
        uiState.w2CountdownTimerId = null;
      }
      uiState.w2SyncCountdown = null;
      uiState.wizardStage = 'dashboard';
      INV.storageAdapter.setSession('wizard_stage', 'dashboard');
      INV.stateManager.activeTab = 'overview';
      if (highlightPdf) uiState.highlightExportPdfCta = true;
      render();
      if (highlightPdf) focusExportPdfButtonNow();
    };

    host.querySelector('#inv-w2-btn-enter-now')?.addEventListener('click', () => enterDashboardNow(true));
    host.querySelector('#inv-w2-btn-skip-to-dashboard')?.addEventListener('click', () => enterDashboardNow(false));

    // Bước 2: Dán câu trả lời Gemini & Bấm Đồng bộ -> Thông báo xong + Đếm ngược 3 giây tự chuyển qua Phân tích & Báo chí!
    host.querySelector('#inv-w2-btn-sync')?.addEventListener('click', () => {
      const raw = (host.querySelector('#inv-w2-gemini-paste')?.value || '').trim();
      if (!raw) {
        NS.utils?.showToast?.('⚠️ Bạn hãy dán câu trả lời của Gemini vào ô trước khi bấm Đồng bộ nhé!', 'warning', 3200);
        host.querySelector('#inv-w2-gemini-paste')?.focus();
        return;
      }
      const parsed = INV.deterministicExtractor?.parseGeminiStructuredReply
        ? INV.deterministicExtractor.parseGeminiStructuredReply(raw)
        : { ok: false };

      let successMsg = 'Đã tổng hợp thông tin & cập nhật toàn bộ 6 biểu đồ từ Gemini thành công!';
      if (parsed.ok && parsed.data) {
        const synced = parsed.data;
        INV.stateManager.unifiedAnalytics = synced;
        const prevRep = INV.stateManager.evaluationReport || { items: [], triggered_breakers: [], live_headlines: [], as_of_date: synced.as_of_date };
        const mkChannel = (key, name, fb) => {
          const dm = (synced.decision_matrix || []).find((d) => d.channel.toLowerCase().includes(fb)) || {};
          const sc = synced.channel_scores?.[key] ?? 60;
          return {
            name,
            score: sc,
            signal: dm.signal || (sc >= 72 ? 'positive' : sc <= 48 ? 'danger' : 'caution'),
            badge: dm.decision || (sc >= 72 ? 'Thuận lợi' : sc <= 48 ? 'Thận trọng cao' : 'Theo dõi'),
            reason: dm.reason || prevRep.channel_scores?.[key]?.reason || '',
          };
        };
        INV.stateManager.evaluationReport = {
          ...prevRep,
          as_of_date: synced.as_of_date || prevRep.as_of_date,
          cycle_phase: synced.cycle_phase || prevRep.cycle_phase,
          channel_scores: {
            cash: mkChannel('cash', 'Tiền mặt / Tiết kiệm', 'tiền'),
            gold: mkChannel('gold', 'Vàng', 'vàng'),
            stock: mkChannel('stock', 'Chứng khoán', 'chứng'),
            real_estate: mkChannel('real_estate', 'Nhà đất', 'đất'),
          },
          narrative_summary: {
            opportunities: synced.verdict_summary?.opportunities?.length ? synced.verdict_summary.opportunities : prevRep.narrative_summary?.opportunities || [],
            risks: synced.verdict_summary?.risks?.length ? synced.verdict_summary.risks : prevRep.narrative_summary?.risks || [],
            current_outlook: synced.verdict_summary?.current_outlook || prevRep.narrative_summary?.current_outlook || '',
            upcoming_outlook: synced.verdict_summary?.upcoming_outlook || prevRep.narrative_summary?.upcoming_outlook || '',
          },
        };
      } else {
        // Fallback an toàn: vẫn lưu tóm tắt văn bản Gemini & dùng dữ liệu API sống để dựng trọn bộ biểu đồ
        successMsg = 'Đã tổng hợp xong thông tin (ghi nhận câu trả lời Gemini & kết hợp toàn bộ số liệu API sống để dựng 6 biểu đồ)!';
        if (INV.stateManager.evaluationReport) {
          INV.stateManager.evaluationReport.gemini_raw_note = raw.slice(0, 4000);
        }
      }

      NS.utils?.showToast?.(`✅ ${successMsg}`, 'success', 3800);
      if (uiState.w2CountdownTimerId) clearInterval(uiState.w2CountdownTimerId);
      uiState.w2SyncCountdown = { sec: 3, msg: successMsg };
      render();
      uiState.w2CountdownTimerId = setInterval(() => {
        if (!uiState.w2SyncCountdown) {
          clearInterval(uiState.w2CountdownTimerId);
          uiState.w2CountdownTimerId = null;
          return;
        }
        uiState.w2SyncCountdown.sec -= 1;
        if (uiState.w2SyncCountdown.sec <= 0) {
          enterDashboardNow(true);
        } else {
          render();
        }
      }, 1000);
    });
  }

  async function triggerGoldFetch(force = false) {
    if (uiState.goldLoading) return;
    uiState.goldLoading = true;
    uiState.goldError = '';
    render();
    const { controller, signal } = INV.stateManager.createSignal();
    try {
      const [data, hist30d] = await Promise.all([
        INV.goldEngine.fetchLiveGoldSnapshot({ force, signal }),
        INV.goldEngine.fetchGoldHistory30d ? INV.goldEngine.fetchGoldHistory30d(signal) : Promise.resolve(null),
      ]);
      if (!signal.aborted) {
        INV.stateManager.goldData = data;
        if (hist30d) uiState.goldHistory30d = hist30d;
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        uiState.goldError =
          'Không kết nối được nguồn dữ liệu giá vàng lúc này. Bạn có thể bấm Cập nhật giá mới, tự nhập giá tiệm vàng bên dưới, hoặc bấm Mở cùng Gemini để Gemini tra cứu giúp.';
      }
    } finally {
      INV.stateManager.releaseController(controller);
      uiState.goldLoading = false;
      render();
    }
  }

  async function triggerStockLookup(symbol, force = false) {
    const clean = String(symbol || '').trim();
    if (!clean) {
      uiState.stockError = 'Vui lòng nhập mã cổ phiếu cần tra (ví dụ: FPT, VCB, HPG...).';
      render();
      return;
    }
    uiState.stockInput = clean.toUpperCase();
    uiState.stockLoading = true;
    uiState.stockError = '';
    uiState.forensicResult = null;
    render();
    const { controller, signal } = INV.stateManager.createSignal();
    try {
      const data = await INV.stockEngine.lookupStockTicker(clean, { force, signal });
      if (!signal.aborted) {
        INV.stateManager.stockData = data;
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        uiState.stockError = err?.message || 'Chưa tải được dữ liệu mã cổ phiếu lúc này.';
      }
    } finally {
      INV.stateManager.releaseController(controller);
      uiState.stockLoading = false;
      render();
    }
  }

  function bindEvents(host) {
    // Chuyển tab (hủy các request cũ đang treo nếu chuyển tab khác)
    host.querySelectorAll('[data-inv-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextTab = btn.getAttribute('data-inv-tab') || 'overview';
        if (nextTab === INV.stateManager.activeTab) return;
        if (!INV.stateManager.runningEval) INV.stateManager.abortAll();
        INV.stateManager.activeTab = nextTab;
        render();
        // CHỈ khi người dùng bấm chọn thẻ Giá vàng mới tự cập nhật giá vàng (đúng Spec Chương 3.2 & 5.1)
        if (nextTab === 'gold' && !INV.stateManager.goldData) {
          triggerGoldFetch(false);
        }
      });
    });

    // Đổi vị trí / quốc gia -> Bật pop-up cảnh báo Có / Không / ✕ trước khi reset phân tích
    host.querySelector('#inv-btn-change-region')?.addEventListener('click', openChangeRegionConfirmModal);
    host.querySelector('#inv-btn-back-to-2steps')?.addEventListener('click', () => {
      uiState.wizardStage = 'two_step_setup';
      INV.storageAdapter.setSession('wizard_stage', 'two_step_setup');
      render();
    });

    // Nút mở nhanh cùng Gemini trên Header (tự nhận trọng tâm theo thẻ đang mở + hiện màn hình xác nhận trước khi chuyển hướng!)
    host.querySelector('#inv-btn-header-gemini')?.addEventListener('click', () => {
      const prefs = INV.storageAdapter.getPrefs();
      const curTab = INV.stateManager.activeTab;
      const focusMap = { gold: 'gold', stock: 'stock', realestate: 'real_estate', overview: 'general' };
      INV.promptComposer.openGeminiConfirmModal({
        mode: prefs.promptMode || 'plain',
        focus: focusMap[curTab] || 'general',
        anonymize: uiState.anonymizeGemini,
      });
    });

    // --- SỰ KIỆN THẺ TỔNG QUAN & ĐÁNH GIÁ ---
    host.querySelector('#inv-btn-toggle-checklist')?.addEventListener('click', () => {
      uiState.showChecklistModal = !uiState.showChecklistModal;
      render();
    });
    host.querySelector('#inv-btn-close-checklist')?.addEventListener('click', () => {
      uiState.showChecklistModal = false;
      render();
    });

    host.querySelector('#inv-inp-upload-kb')?.addEventListener('change', async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        NS.utils?.showToast?.(`⏳ Đang đọc và tách đề mục từ "${file.name}"...`, 'info', 2600);
        const kb = await INV.fileParser.parseAndActivateFile(file);
        INV.stateManager.evaluationReport = null;
        INV.storageAdapter.clearSession('eval_report_quick');
        INV.storageAdapter.clearSession('eval_report_full');
        uiState.showChecklistModal = true;
        NS.utils?.showToast?.(`✅ Đã nạp bộ kiến thức mới: ${kb.metadata?.short_title}`, 'success', 4000);
        render();
      } catch (err) {
        NS.utils?.showToast?.('⚠️ ' + (err?.message || err), 'error', 4800);
      }
    });

    host.querySelector('#inv-btn-restore-kb')?.addEventListener('click', async () => {
      await INV.fileParser.restoreDefaultKnowledge();
      INV.stateManager.evaluationReport = null;
      NS.utils?.showToast?.('✅ Đã khôi phục về bộ kiến thức mặc định Khung Phân Tích Đầu Tư (7 chương).', 'success', 3500);
      render();
    });

    host.querySelectorAll('input[name="inv-depth"]').forEach((r) => {
      r.addEventListener('change', () => {
        INV.storageAdapter.savePrefs({ scanDepth: r.value });
      });
    });

    host.querySelectorAll('input[name="inv-prompt-mode"]').forEach((r) => {
      r.addEventListener('change', () => {
        INV.storageAdapter.savePrefs({ promptMode: r.value });
      });
    });

    host.querySelector('#inv-btn-run-eval')?.addEventListener('click', async () => {
      const prefs = INV.storageAdapter.getPrefs();
      uiState.evalProgress = { pct: 5, label: 'Đang khởi động dây chuyền đánh giá...' };
      render();
      try {
        await INV.researchEvaluator.runEvaluation({
          depth: prefs.scanDepth || 'quick',
          force: true,
          onProgress: (p) => {
            uiState.evalProgress = p;
            render();
          },
        });
      } catch (err) {
        if (err?.name === 'AbortError') {
          NS.utils?.showToast?.('⏹ Đã dừng quá trình tìm kiếm theo yêu cầu.', 'info', 2800);
        } else {
          NS.utils?.showToast?.('⚠️ ' + (err?.message || err), 'error', 4200);
        }
      } finally {
        uiState.evalProgress = null;
        render();
      }
    });

    host.querySelector('#inv-btn-stop-eval')?.addEventListener('click', () => {
      INV.stateManager.abortAll();
      uiState.evalProgress = null;
      render();
    });

    host.querySelector('#inv-btn-gemini-split')?.addEventListener('click', () => {
      const prefs = INV.storageAdapter.getPrefs();
      INV.promptComposer.copyAndLaunchGeminiSplit({
        mode: prefs.promptMode || 'plain',
        anonymize: uiState.anonymizeGemini,
      });
    });

    host.querySelector('#inv-btn-gemini-api-direct')?.addEventListener('click', async () => {
      const bridge = globalScope.NoirGeminiBridge || NS.geminiBridge;
      if (!bridge) return;
      const runDirect = async () => {
        const btn = host.querySelector('#inv-btn-gemini-api-direct');
        const origHtml = btn ? btn.innerHTML : '';
        try {
          if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Đang gọi Gemini API...';
          }
          const prefs = INV.storageAdapter.getPrefs();
          const promptText = INV.promptComposer.buildGeminiPrompt({
            mode: prefs.promptMode || 'veteran30',
            anonymize: uiState.anonymizeGemini,
          });
          const reply = await bridge.callGeminiText(promptText);
          const ovTa = host.querySelector('#inv-inp-gemini-paste-ov');
          if (ovTa) ovTa.value = reply;
          handleSyncGeminiReply(reply, true);
        } catch (err) {
          NS.utils?.showToast?.('⚠️ ' + (err?.message || err), 'error', 4200);
        } finally {
          if (btn && btn.isConnected) {
            btn.disabled = false;
            btn.innerHTML = origHtml || '⚡ Gọi Gemini API Trực Tiếp (1 chạm)';
          }
        }
      };
      if (!bridge.hasApiKey()) {
        bridge.openApiKeyQuickModal({ onSaved: () => runDirect() });
        return;
      }
      await runDirect();
    });

    host.querySelector('#inv-btn-save-audit')?.addEventListener('click', async () => {
      const rep = INV.stateManager.evaluationReport;
      if (!rep) return;
      await INV.storageAdapter.addAuditLog({
        title: `Đánh giá 4 kênh (${rep.depth === 'full' ? 'Toàn diện' : 'Nhanh'}) — ${rep.cycle_phase?.label || ''}`,
        summary: rep.narrative_summary?.current_outlook || '',
        scores: rep.channel_scores,
      });
      uiState.auditLogs = await INV.storageAdapter.getAuditLogs();
      NS.utils?.showToast?.('💾 Đã lưu bản đánh giá vào Nhật ký Kiểm toán cục bộ (IndexedDB).', 'success', 3500);
      render();
    });

    host.querySelectorAll('[data-inv-news-chk]').forEach((chk) => {
      chk.addEventListener('change', () => {
        const idx = Number(chk.getAttribute('data-inv-news-chk'));
        const list = INV.stateManager.evaluationReport?.live_headlines;
        if (Array.isArray(list) && list[idx]) {
          list[idx].selected_for_prompt = Boolean(chk.checked);
          render();
        }
      });
    });

    host.querySelector('#inv-btn-save-proxy')?.addEventListener('click', () => {
      const proxyUrl = (host.querySelector('#inv-inp-proxy-url')?.value || '').trim();
      const fredApiKey = (host.querySelector('#inv-inp-fred-key')?.value || '').trim();
      const tcbsApiKey = (host.querySelector('#inv-inp-tcbs-key')?.value || '').trim();
      INV.storageAdapter.savePrefs({ proxyUrl, fredApiKey, tcbsApiKey });
      NS.utils?.showToast?.('✅ Đã lưu cấu hình Worker & khóa API cá nhân cục bộ trên máy.', 'success', 3000);
    });

    host.querySelector('#inv-btn-check-health')?.addEventListener('click', async () => {
      if (!INV.intelHelpers?.checkSourcesHealth) return;
      uiState.healthLoading = true;
      render();
      const { controller, signal } = INV.stateManager.createSignal();
      try {
        uiState.healthChecks = await INV.intelHelpers.checkSourcesHealth(signal);
      } finally {
        INV.stateManager.releaseController(controller);
        uiState.healthLoading = false;
        render();
      }
    });

    host.querySelector('#inv-btn-gold-to-gemini')?.addEventListener('click', () => {
      INV.promptComposer.copyAndLaunchGeminiSplit({
        mode: INV.storageAdapter.getPrefs().promptMode || 'veteran30',
        focus: 'gold',
      });
    });

    host.querySelector('#inv-btn-load-logs')?.addEventListener('click', async () => {
      uiState.auditLogs = await INV.storageAdapter.getAuditLogs();
      render();
    });

    host.querySelectorAll('[data-inv-del-log]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await INV.storageAdapter.deleteAuditLog(btn.getAttribute('data-inv-del-log'));
        uiState.auditLogs = await INV.storageAdapter.getAuditLogs();
        render();
      });
    });

    // --- SỰ KIỆN THẺ GIÁ VÀNG ---
    host.querySelector('#inv-btn-refresh-gold')?.addEventListener('click', () => triggerGoldFetch(true));
    host.querySelector('#inv-btn-recalc-gold')?.addEventListener('click', () => {
      const xau = Number(host.querySelector('#inv-gold-in-xau')?.value);
      const fx = Number(host.querySelector('#inv-gold-in-fx')?.value);
      const sjcBuy = Number(host.querySelector('#inv-gold-in-sjc-buy')?.value) * 1e6;
      const sjcSell = Number(host.querySelector('#inv-gold-in-sjc-sell')?.value) * 1e6;
      const prev = INV.stateManager.goldData || {};
      const next = INV.goldEngine.calculateGoldMetrics({
        worldPriceUsd: xau,
        vcbSellRate: fx,
        sjcBuyVnd: sjcBuy,
        sjcSellVnd: sjcSell,
        ringBuyVnd: prev.ring9999?.buyVnd || 128.8e6,
        ringSellVnd: prev.ring9999?.sellVnd || 134.8e6,
      });
      INV.stateManager.goldData = {
        ...prev,
        ...next,
        worldLive: true,
        fxLive: true,
        domesticLive: true,
        asOfDate: INV.utils.todayIso(),
      };
      render();
    });

    // --- SỰ KIỆN THẺ CHỨNG KHOÁN ---
    const symInput = host.querySelector('#inv-inp-stock-sym');
    host.querySelector('#inv-btn-lookup-stock')?.addEventListener('click', () => {
      triggerStockLookup(symInput?.value || '');
    });
    symInput?.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        triggerStockLookup(symInput.value);
      }
    });
    host.querySelectorAll('[data-inv-pick-stock]').forEach((chip) => {
      chip.addEventListener('click', () => triggerStockLookup(chip.getAttribute('data-inv-pick-stock')));
    });
    host.querySelector('#inv-btn-toggle-vnindex')?.addEventListener('click', () => {
      uiState.showVnIndex = !uiState.showVnIndex;
      render();
    });
    host.querySelectorAll('[data-inv-forensic]').forEach((inp) => {
      inp.addEventListener('input', () => {
        uiState.forensicInputs[inp.getAttribute('data-inv-forensic')] = inp.value;
      });
    });
    host.querySelector('#inv-btn-run-forensic')?.addEventListener('click', () => {
      uiState.forensicResult = INV.stockEngine.calculateForensicSuite(uiState.forensicInputs);
      render();
    });
    host.querySelector('#inv-chk-anonymize-stock')?.addEventListener('change', (ev) => {
      uiState.anonymizeGemini = Boolean(ev.target.checked);
    });
    host.querySelector('#inv-btn-stock-to-gemini')?.addEventListener('click', () => {
      INV.promptComposer.copyAndLaunchGeminiSplit({
        mode: 'audit',
        targetStock: INV.stateManager.stockData,
        anonymize: uiState.anonymizeGemini,
      });
    });

    // --- SỰ KIỆN THẺ NHÀ ĐẤT QUANH ĐÂY ---
    host.querySelector('#inv-btn-gps-re')?.addEventListener('click', async () => {
      uiState.reLoading = true;
      uiState.reError = '';
      render();
      const { controller, signal } = INV.stateManager.createSignal();
      try {
        const data = await INV.realEstateEngine.resolveGpsLocation(signal);
        if (!signal.aborted) {
          INV.stateManager.realEstateData = data;
          uiState.reManualInput = data.areaLabel;
        }
      } catch (err) {
        uiState.reError = err?.message || 'Chưa định vị được GPS lúc này.';
        setTimeout(() => host.querySelector('#inv-inp-manual-area')?.focus(), 80);
      } finally {
        INV.stateManager.releaseController(controller);
        uiState.reLoading = false;
        render();
      }
    });

    const manualAreaInp = host.querySelector('#inv-inp-manual-area');
    const applyManualArea = async () => {
      try {
        uiState.reError = '';
        uiState.reManualInput = manualAreaInp?.value || '';
        const base = INV.realEstateEngine.resolveManualArea(uiState.reManualInput);
        INV.stateManager.realEstateData = base;
        render();
        const { controller, signal } = INV.stateManager.createSignal();
        try {
          const enriched = await INV.realEstateEngine.enrichRealEstateLiveMetrics(base, signal);
          if (!signal.aborted) {
            INV.stateManager.realEstateData = enriched;
            render();
          }
        } finally {
          INV.stateManager.releaseController(controller);
        }
      } catch (err) {
        uiState.reError = err?.message || '';
        render();
      }
    };
    host.querySelector('#inv-btn-manual-area')?.addEventListener('click', applyManualArea);
    manualAreaInp?.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        applyManualArea();
      }
    });

    // Máy tính tiền vay phản hồi tức thì
    const mortBindings = [
      ['#inv-mort-price', 'priceBillion'],
      ['#inv-mort-loan', 'loanBillion'],
      ['#inv-mort-years', 'years'],
      ['#inv-mort-rent', 'grossRentMillion'],
      ['#inv-mort-rate', 'ratePct'],
    ];
    mortBindings.forEach(([sel, key]) => {
      host.querySelector(sel)?.addEventListener('change', (ev) => {
        const v = Number(ev.target.value);
        if (Number.isFinite(v) && v >= 0) {
          uiState.mortgageInputs[key] = v;
          render();
        }
      });
    });

    // Khảo sát Thực địa Nhà đất 6 chỉ số (lưu lịch sử & đưa vào Prompt)
    host.querySelector('#inv-btn-save-survey')?.addEventListener('click', () => {
      const areaLabel = INV.stateManager.realEstateData?.areaLabel || INV.stateManager.userRegion?.areaLabel || 'Khu vực của tôi';
      const draft = {
        pricePerM2: host.querySelector('#inv-srv-price')?.value || '',
        rentPerMonth: host.querySelector('#inv-srv-rent')?.value || '',
        roadWidthM: host.querySelector('#inv-srv-road')?.value || '5.5',
        legalStatus: host.querySelector('#inv-srv-legal')?.value || 'Sổ hồng/đỏ riêng',
        nightLightPct: host.querySelector('#inv-srv-light')?.value || '75',
        infraStage: host.querySelector('#inv-srv-infra')?.value || 'Đang thi công / Sắp thông xe',
        floodNote: host.querySelector('#inv-srv-flood')?.value || '',
      };
      uiState.surveyDraft = draft;
      if (!Number(draft.pricePerM2)) {
        NS.utils?.showToast?.('⚠️ Vui lòng nhập ít nhất Giá rao thực tế (triệu/m²) trước khi lưu khảo sát.', 'warning', 2800);
        return;
      }
      INV.storageAdapter.saveRealEstateSurvey({ ...draft, area: areaLabel });
      NS.utils?.showToast?.('💾 Đã lưu mốc khảo sát thực địa vào lịch sử khu vực & tự động nạp vào Prompt Gemini!', 'success', 3400);
      render();
    });
    host.querySelectorAll('[data-inv-del-survey]').forEach((btn) => {
      btn.addEventListener('click', () => {
        INV.storageAdapter.deleteRealEstateSurvey(btn.getAttribute('data-inv-del-survey'));
        render();
      });
    });
    host.querySelector('#inv-btn-re-to-gemini')?.addEventListener('click', () => {
      const mIn = uiState.mortgageInputs;
      const stress = INV.realEstateEngine.calculateMortgageStressTest({
        priceVnd: mIn.priceBillion * 1e9,
        loanVnd: mIn.loanBillion * 1e9,
        years: mIn.years,
        grossMonthlyRentVnd: mIn.grossRentMillion * 1e6,
        annualRatePct: mIn.ratePct,
      });
      INV.promptComposer.copyAndLaunchGeminiSplit({
        mode: INV.storageAdapter.getPrefs().promptMode || 'veteran30',
        focus: 'real_estate',
        stressResult: stress,
      });
    });

    // Đồng bộ câu trả lời Gemini (INVEST_INTEL_SYNC_V2) -> Cập nhật toàn bộ ô dữ liệu & vẽ 6 biểu đồ!
    const handleSyncGeminiReply = (rawText, jumpToCharts = false) => {
      if (!INV.deterministicExtractor?.parseGeminiStructuredReply) return;
      const res = INV.deterministicExtractor.parseGeminiStructuredReply(rawText);
      if (!res.ok) {
        NS.utils?.showToast?.(`⚠️ ${res.error}`, 'warning', 5200);
        return;
      }
      const synced = res.data;
      INV.stateManager.unifiedAnalytics = synced;
      INV.stateManager.geminiReportProse = String(rawText || '')
        .replace(/```json[\s\S]*?```/gi, '')
        .replace(/INVEST_INTEL_SYNC_V2[\s\S]*$/i, '')
        .trim();
      // Cập nhật đồng bộ các ô điểm số, nhận xét & pha chu kỳ ngay trên báo cáo Tổng quan!
      const prevRep = INV.stateManager.evaluationReport || { items: [], triggered_breakers: [], live_headlines: [], as_of_date: synced.as_of_date };
      const mkChannel = (key, name, fb) => {
        const dm = (synced.decision_matrix || []).find((d) => d.channel.toLowerCase().includes(fb)) || {};
        const sc = synced.channel_scores?.[key] ?? 60;
        return {
          name,
          score: sc,
          signal: dm.signal || (sc >= 72 ? 'positive' : sc <= 48 ? 'danger' : 'caution'),
          badge: dm.decision || (sc >= 72 ? 'Thuận lợi' : sc <= 48 ? 'Thận trọng cao' : 'Theo dõi'),
          reason: dm.reason || prevRep.channel_scores?.[key]?.reason || '',
        };
      };
      INV.stateManager.evaluationReport = {
        ...prevRep,
        as_of_date: synced.as_of_date || prevRep.as_of_date,
        cycle_phase: synced.cycle_phase || prevRep.cycle_phase,
        channel_scores: {
          cash: mkChannel('cash', 'Tiền mặt / Tiết kiệm', 'tiền'),
          gold: mkChannel('gold', 'Vàng', 'vàng'),
          stock: mkChannel('stock', 'Chứng khoán', 'chứng'),
          real_estate: mkChannel('real_estate', 'Nhà đất', 'đất'),
        },
        narrative_summary: {
          opportunities: synced.verdict_summary?.opportunities?.length ? synced.verdict_summary.opportunities : prevRep.narrative_summary?.opportunities || [],
          risks: synced.verdict_summary?.risks?.length ? synced.verdict_summary.risks : prevRep.narrative_summary?.risks || [],
          current_outlook: synced.verdict_summary?.current_outlook || prevRep.narrative_summary?.current_outlook || '',
          upcoming_outlook: synced.verdict_summary?.upcoming_outlook || prevRep.narrative_summary?.upcoming_outlook || '',
        },
      };
      if (jumpToCharts) INV.stateManager.activeTab = 'charts';
      uiState.highlightExportPdfCta = true;
      NS.utils?.showToast?.('✅ Đã đồng bộ cấu trúc Gemini (INVEST_INTEL_SYNC_V2) vào toàn bộ bảng dữ liệu & 6 biểu đồ chuyên nghiệp!', 'success', 4200);
      render();
      requestAnimationFrame(() => {
        const pdfBtn = host.querySelector('#inv-btn-open-pdf-export-modal');
        if (pdfBtn) {
          try { pdfBtn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_e) {}
          try { pdfBtn.focus({ preventScroll: true }); } catch (_e2) {}
        }
      });
    };

    host.querySelector('#inv-btn-sync-gemini-ov')?.addEventListener('click', () => {
      handleSyncGeminiReply(host.querySelector('#inv-inp-gemini-paste-ov')?.value || '', true);
    });
    host.querySelector('#inv-btn-sync-gemini-ch')?.addEventListener('click', () => {
      handleSyncGeminiReply(host.querySelector('#inv-inp-gemini-paste-ch')?.value || '', false);
    });
    host.querySelector('#inv-btn-charts-rebuild-code')?.addEventListener('click', () => {
      if (!INV.stateManager.evaluationReport) {
        INV.stateManager.activeTab = 'overview';
        render();
        NS.utils?.showToast?.('💡 Hãy bấm Bước 1: Tra cứu thông tin toàn diện trước để có dữ liệu mới nhất!', 'info', 3400);
        return;
      }
      INV.stateManager.unifiedAnalytics = INV.deterministicExtractor.buildUnifiedAnalyticsFromCode({
        report: INV.stateManager.evaluationReport,
        goldSnap: INV.stateManager.goldData,
        goldHist30d: uiState.goldHistory30d || INV.stateManager.evaluationReport?.gold_history_30d,
        stockData: INV.stateManager.stockData,
        reData: INV.stateManager.realEstateData,
        surveys: INV.storageAdapter.getRealEstateSurveys ? INV.storageAdapter.getRealEstateSurveys() : [],
      });
      NS.utils?.showToast?.('🔄 Đã dựng lại toàn bộ 6 biểu đồ từ số liệu API sống của Code Bước 1!', 'success', 3000);
      render();
    });
    host.querySelector('#inv-btn-charts-to-gemini')?.addEventListener('click', () => {
      INV.promptComposer.copyAndLaunchGeminiSplit({
        mode: INV.storageAdapter.getPrefs().promptMode || 'veteran30',
        focus: 'general',
      });
    });

    // Checklist 7 bước pháp lý
    host.querySelectorAll('[data-inv-legal-chk]').forEach((chk) => {
      chk.addEventListener('change', () => {
        const id = chk.getAttribute('data-inv-legal-chk');
        const cur = INV.storageAdapter.getPrefs().legalChecks || {};
        cur[id] = Boolean(chk.checked);
        INV.storageAdapter.savePrefs({ legalChecks: cur });
        render();
      });
    });
  }

  // --------------------------------------------------------------------------
  // ĐIỂM VÀO CHÍNH & HỦY DỌN RAM TRIỆT ĐỂ
  // --------------------------------------------------------------------------
  INV.mountIntoContainer = async function mountIntoContainer(hostEl) {
    INV.stateManager.hostEl = hostEl;
    INV.stateManager.activeTab = 'overview';
    await INV.fileParser.initActiveKnowledge();
    // Khôi phục quốc gia/khu vực & bước wizard đã xác nhận trong phiên (30 phút)
    const cachedRegion = INV.storageAdapter.getSession('user_region', 30 * 60 * 1000);
    if (cachedRegion?.data) {
      INV.stateManager.userRegion = cachedRegion.data;
      const cachedStage = INV.storageAdapter.getSession('wizard_stage', 30 * 60 * 1000)?.data;
      uiState.wizardStage = cachedStage || 'two_step_setup';
    } else {
      uiState.wizardStage = 'location_gate';
    }
    const prefs = INV.storageAdapter.getPrefs();
    const cachedRep = INV.storageAdapter.getSession(`eval_report_${prefs.scanDepth || 'full'}`, 30 * 60 * 1000);
    if (cachedRep?.data) {
      INV.stateManager.evaluationReport = cachedRep.data;
    }
    render();
  };

  INV.destroy = function destroyInvestModule() {
    INV.stateManager.resetTransientMemory();
    resetUiState();
  };
})(typeof window !== 'undefined' ? window : globalThis);
