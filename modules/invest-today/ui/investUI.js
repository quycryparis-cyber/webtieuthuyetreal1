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
  };

  function resetUiState() {
    uiState = {
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
      { key: 'global_macro', title: '🌍 Tình hình thế giới (Dòng tiền, Lãi suất & Giá dầu)' },
      { key: 'vn_macro', title: '🇻🇳 Tình hình Việt Nam (Tăng trưởng, Lạm phát, Tỷ giá & Ngân hàng)' },
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
              <div class="text-[11px] opacity-80">Ngày chốt: ${esc(report.as_of_date)} · ${report.live_count} mục live / ${report.missing_count} mục cần đối chiếu thêm</div>
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

        <!-- Khối 2: Khu vực hành động trung tâm (2 nút rõ ràng, không rối) -->
        <div class="inv-card text-center space-y-3">
          <div class="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span class="text-zinc-500 dark:text-zinc-400">Mức độ quét tin:</span>
            <label class="inline-flex items-center gap-1 cursor-pointer font-bold">
              <input type="radio" name="inv-depth" value="quick" ${prefs.scanDepth !== 'full' ? 'checked' : ''} /> Nhanh (15 mục chính)
            </label>
            <label class="inline-flex items-center gap-1 cursor-pointer font-bold">
              <input type="radio" name="inv-depth" value="full" ${prefs.scanDepth === 'full' ? 'checked' : ''} /> Toàn diện (24 mục)
            </label>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <button type="button" id="inv-btn-run-eval" class="inv-primary-btn" ${isRunning ? 'disabled' : ''}>
              ${isRunning ? '⏳ Đang tìm tin &amp; tổng hợp...' : '🔍 Tìm kiếm thông tin, tổng hợp và đánh giá'}
            </button>
            ${
              isRunning
                ? '<button type="button" id="inv-btn-stop-eval" class="inv-secondary-btn text-rose-600 border-rose-500/40">⏹ Dừng lại</button>'
                : ''
            }
          </div>
          <p class="text-[11.5px] text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Bấm để tự động tìm số liệu mới nhất, tính toán bằng code thuần theo file kiến thức và chấm điểm 4 kênh cho hiện tại &amp; sắp tới.
          </p>

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

          <div class="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-col items-center gap-2">
            <div class="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span class="text-zinc-500 dark:text-zinc-400">Chế độ hỏi Gemini:</span>
              <label class="inline-flex items-center gap-1 cursor-pointer font-bold">
                <input type="radio" name="inv-prompt-mode" value="plain" ${prefs.promptMode !== 'audit' ? 'checked' : ''} /> Phổ thông dễ hiểu
              </label>
              <label class="inline-flex items-center gap-1 cursor-pointer font-bold">
                <input type="radio" name="inv-prompt-mode" value="audit" ${prefs.promptMode === 'audit' ? 'checked' : ''} /> Kiểm toán 2 chiều (Phe Bò vs Phe Gấu)
              </label>
            </div>
            <button type="button" id="inv-btn-gemini-split" class="inv-gemini-btn">
              🪟 Tự động sao chép &amp; Chia đôi màn hình với Gemini
            </button>
            <span class="text-[11px] text-zinc-500 dark:text-zinc-400">
              100% miễn phí không tốn API — tự gói dữ liệu mới + khung kiến thức vào bộ nhớ tạm, mở sẵn Gemini bên cạnh để bạn bấm dán (Ctrl + V).
            </span>
          </div>
        </div>

        <!-- Khối 3: Báo cáo kết quả -->
        ${reportHtml}

        <!-- Cài đặt nâng cao & Nhật ký kiểm toán (đóng gọn mặc định) -->
        <details class="inv-details inv-card-soft">
          <summary class="flex items-center justify-between text-xs font-extrabold">
            <span>⚙️ Nhật ký theo dõi quyết định (IndexedDB) &amp; Cài đặt nguồn mạng Web</span>
            <span class="text-zinc-500">▼ Mở rộng</span>
          </summary>
          <div class="mt-3 space-y-3 text-xs">
            <div class="space-y-1.5">
              <div class="font-bold">🌐 Trạng thái kết nối dữ liệu: ${
                INV.networkAdapter.isDesktopElectron()
                  ? '<span class="text-emerald-600 dark:text-emerald-400">Bản Desktop Electron (Gọi trực tiếp không bị chặn CORS)</span>'
                  : '<span>Bản Web trình duyệt (Hỗ trợ gắn thêm Cloudflare Worker miễn phí để đọc trực tiếp SJC/VNDirect)</span>'
              }</div>
              ${
                !INV.networkAdapter.isDesktopElectron()
                  ? `<div class="flex flex-wrap gap-2">
                      <input type="url" id="inv-inp-proxy-url" value="${esc(prefs.proxyUrl || '')}" placeholder="Tùy chọn: https://your-worker.workers.dev" class="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs" />
                      <button type="button" id="inv-btn-save-proxy" class="inv-secondary-btn text-xs">Lưu đường dẫn</button>
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
            <input type="text" id="inv-inp-stock-sym" value="${esc(uiState.stockInput || st?.symbol || '')}" placeholder="Nhập mã cổ phiếu cần xem (ví dụ: FPT, VNM, VCB, HPG...)" class="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold uppercase" />
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
            <button type="button" id="inv-btn-gps-re" class="inv-primary-btn shrink-0" ${uiState.reLoading ? 'disabled' : ''}>
              ${uiState.reLoading ? '⏳ Đang định vị...' : '📍 Bật vị trí để xem giá nhà đất quanh tôi'}
            </button>
          </div>

          <div class="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-wrap gap-2">
            <input type="text" id="inv-inp-manual-area" value="${esc(uiState.reManualInput || re?.areaLabel || '')}" placeholder="Hoặc tự gõ tên Đường / Phường / Quận bạn quan tâm (vd: Phường Mỹ An, Ngũ Hành Sơn, Đà Nẵng)" class="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs" />
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
  // RENDER TỔNG KHUNG & GẮN SỰ KIỆN
  // --------------------------------------------------------------------------
  function render() {
    const host = INV.stateManager.hostEl;
    if (!host || !host.isConnected) return;

    const tab = INV.stateManager.activeTab;
    let bodyHtml = '';
    if (tab === 'gold') bodyHtml = renderGoldTab();
    else if (tab === 'stock') bodyHtml = renderStockTab();
    else if (tab === 'realestate') bodyHtml = renderRealEstateTab();
    else bodyHtml = renderOverviewTab();

    host.innerHTML = `
      <div class="inv-root space-y-4">
        <!-- Header gọn nhẹ -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 class="text-base font-black tracking-tight flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600 dark:text-emerald-400"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              <span>Đầu tư hôm nay</span>
            </h3>
            <p class="text-[11.5px] text-zinc-500 dark:text-zinc-400">Tra cứu nhanh khi cần — Không chạy ngầm tốn máy</p>
          </div>
          <button type="button" id="inv-btn-header-gemini" class="inv-gemini-btn text-xs py-2 px-3">
            🪟 Mở cùng Gemini
          </button>
        </div>

        <!-- 4 Thẻ điều hướng lớn -->
        <div class="inv-tab-bar" role="tablist">
          <button type="button" data-inv-tab="overview" class="inv-tab-btn ${tab === 'overview' ? 'is-active' : ''}">🧭 Tổng quan &amp; Đánh giá</button>
          <button type="button" data-inv-tab="gold" class="inv-tab-btn ${tab === 'gold' ? 'is-active' : ''}">🥇 Giá vàng</button>
          <button type="button" data-inv-tab="stock" class="inv-tab-btn ${tab === 'stock' ? 'is-active' : ''}">📊 Chứng khoán</button>
          <button type="button" data-inv-tab="realestate" class="inv-tab-btn ${tab === 'realestate' ? 'is-active' : ''}">🏘️ Nhà đất quanh đây</button>
        </div>

        <!-- Nội dung thẻ hiện tại -->
        <div id="inv-tab-content">${bodyHtml}</div>
      </div>`;

    bindEvents(host);
    NS.i18n?.translateElement?.(host);
  }

  async function triggerGoldFetch(force = false) {
    if (uiState.goldLoading) return;
    uiState.goldLoading = true;
    uiState.goldError = '';
    render();
    const { controller, signal } = INV.stateManager.createSignal();
    try {
      const data = await INV.goldEngine.fetchLiveGoldSnapshot({ force, signal });
      if (!signal.aborted) {
        INV.stateManager.goldData = data;
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

    // Nút mở nhanh cùng Gemini trên Header
    host.querySelector('#inv-btn-header-gemini')?.addEventListener('click', () => {
      const prefs = INV.storageAdapter.getPrefs();
      INV.promptComposer.copyAndLaunchGeminiSplit({
        mode: prefs.promptMode || 'plain',
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

    host.querySelector('#inv-btn-save-proxy')?.addEventListener('click', () => {
      const val = host.querySelector('#inv-inp-proxy-url')?.value || '';
      INV.storageAdapter.savePrefs({ proxyUrl: val.trim() });
      NS.utils?.showToast?.('✅ Đã lưu đường dẫn cổng trung chuyển CORS.', 'success', 2800);
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
    const applyManualArea = () => {
      try {
        uiState.reError = '';
        uiState.reManualInput = manualAreaInp?.value || '';
        INV.stateManager.realEstateData = INV.realEstateEngine.resolveManualArea(uiState.reManualInput);
        render();
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
    INV.stateManager.activeTab = 'overview'; // Mặc định mở màn hình Tổng quan siêu nhẹ — 0 gọi mạng!
    await INV.fileParser.initActiveKnowledge();
    // Khôi phục báo cáo ngắn hạn trong phiên nếu mới tắt chưa quá 30 phút
    const prefs = INV.storageAdapter.getPrefs();
    const cachedRep = INV.storageAdapter.getSession(`eval_report_${prefs.scanDepth || 'quick'}`, 30 * 60 * 1000);
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
