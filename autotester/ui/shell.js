/**
 * ============================================================================
 * 🎨 AUTOTESTER FRONT-END SHELL ("BÁC SĨ APP" — 100% TIẾNG VIỆT ĐỜI THƯỜNG)
 * ============================================================================
 * - Laptop: Side Drawer gọn bên phải (368px) + Viên thuốc thu gọn kéo thả tự do.
 * - Điện thoại: Bottom Sheet 3 nấc (8% / 46% / 92%).
 * - Đúng 2 Tab: (1) Kết quả khám & (2) Chọn bài kiểm tra (4 cụm đóng kín mặc định).
 * - Không một từ chuyên ngành nào trên nút bấm & thẻ hiển thị chính.
 * ============================================================================
 */
(function initAutoTesterShell(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class AutoTesterShell {
    constructor(controller) {
      this.ctrl = controller;
      this.rootEl = null;
      this.minimized = false;
      this.mobileSnap = 'mid'; // 'mini' | 'mid' | 'full'
      this.activeTab = 'results'; // 'results' | 'suites'
      this.settingsOpen = false;
      this.passedExpanded = false;
      this.openGroups = new Set(); // Mặc định 4 cụm đều đóng kín!
      this.enabledTestIds = new Set(AT.SUITE_GROUPS.flatMap((g) => g.tests.map((t) => t.id)));
      this.speedMode = 'fast'; // 'fast' | 'visual'
      this.chaosEnabled = true;
      this.recordings = [];
      this._spotlightTimer = null;
    }

    mount() {
      if (this.rootEl) return;
      const root = document.createElement('div');
      root.id = 'at-root-container';
      root.className = 'at-root';
      root.setAttribute('data-autotester-ui', 'true');
      document.body.appendChild(root);
      this.rootEl = root;
      this.refreshRecordings().then(() => this.render());
      this.render();
    }

    unmount() {
      this.clearSpotlight();
      if (this.rootEl) {
        this.rootEl.remove();
        this.rootEl = null;
      }
    }

    async refreshRecordings() {
      this.recordings = (await AT.recorder.listRecordings()) || [];
    }

    clearSpotlight() {
      if (this._spotlightTimer) {
        clearTimeout(this._spotlightTimer);
        this._spotlightTimer = null;
      }
      document.querySelectorAll('.at-spotlight-box').forEach((el) => el.remove());
    }

    highlightTargetOnPage(selector, labelText = 'Chỗ cần xem ở đây!') {
      this.clearSpotlight();
      if (!selector) {
        this.ctrl.notify('Không có vị trí nút cụ thể để chỉ trên màn hình này.');
        return;
      }
      const firstSel = String(selector).split(',')[0].trim();
      let el = null;
      try {
        el = document.querySelector(firstSel);
      } catch (_e) {}
      if (!el) {
        this.ctrl.notify('Phần tử đang nằm ở màn hình hoặc hộp thoại khác — hãy mở đúng màn hình đó rồi bấm lại nhé.');
        return;
      }
      // Tự thu gọn xuống nấc nhỏ để lộ rõ chỗ bị lỗi
      if (window.innerWidth < 768) {
        this.mobileSnap = 'mini';
      } else {
        this.minimized = true;
      }
      this.render();

      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } catch (_e) {}

      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        const box = document.createElement('div');
        box.className = 'at-spotlight-box';
        box.setAttribute('data-autotester-ui', 'true');
        box.style.left = `${Math.max(4, rect.left - 4)}px`;
        box.style.top = `${Math.max(4, rect.top - 4)}px`;
        box.style.width = `${Math.max(28, rect.width + 8)}px`;
        box.style.height = `${Math.max(28, rect.height + 8)}px`;
        box.innerHTML = `<div class="at-spotlight-tag">🎯 ${escHtml(labelText)}</div>`;
        document.body.appendChild(box);
        this._spotlightTimer = setTimeout(() => {
          box.remove();
          this._spotlightTimer = null;
        }, 4200);
      }, 220);
    }

    render() {
      if (!this.rootEl) return;
      const isRunning = this.ctrl.isRunning;
      const report = this.ctrl.lastReport;
      const prog = this.ctrl.progress;

      // Chế độ thu gọn thành viên thuốc nổi trên Laptop
      if (this.minimized && window.innerWidth >= 768) {
        const badge = report ? `${report.totalScore}/100` : isRunning ? `${prog.pct}%` : 'Sẵn sàng';
        this.rootEl.innerHTML = `
          <div id="at-min-pill" class="at-minimized-pill" title="Bấm để mở lại bảng Bác sĩ App">
            <span>🩺 Bác sĩ App</span>
            <span style="padding:2px 8px;border-radius:999px;background:rgba(16,185,129,0.22);color:#6ee7b7;">${escHtml(badge)}</span>
          </div>
        `;
        this.rootEl.querySelector('#at-min-pill')?.addEventListener('click', () => {
          this.minimized = false;
          this.render();
        });
        return;
      }

      const snapClass = `at-snap-${this.mobileSnap}`;

      this.rootEl.innerHTML = `
        <div class="at-panel ${snapClass}">
          <!-- Thanh kéo 3 nấc cho điện thoại -->
          <div class="at-sheet-handle-row">
            <button type="button" class="at-snap-btn" data-at-snap="mini">Nhỏ (8%)</button>
            <div class="at-sheet-pill"></div>
            <button type="button" class="at-snap-btn" data-at-snap="mid">Vừa (46%)</button>
            <button type="button" class="at-snap-btn" data-at-snap="full">Mở rộng (92%)</button>
          </div>

          <!-- Header gọn 1 dòng -->
          <div class="at-header">
            <div class="at-brand">
              <span>🩺</span>
              <span>Bác sĩ App</span>
              ${report && this.mobileSnap === 'mini' ? `<span style="font-size:12px;color:#fbbf24;">(${report.totalScore}/100)</span>` : ''}
            </div>
            <div class="at-header-actions">
              <button type="button" id="at-btn-power-off" class="at-power-toggle" title="Gạt sang Tắt để đóng hoàn toàn và dọn sạch bộ nhớ">● BẬT · Tắt</button>
              <button type="button" id="at-btn-settings" class="at-icon-btn" title="Cài đặt phụ">⚙️</button>
              <button type="button" id="at-btn-minimize" class="at-icon-btn" title="Thu gọn bảng">▼</button>
            </div>
          </div>

          <!-- Hộp Cài đặt phụ (thu gọn mặc định) -->
          ${this.settingsOpen ? this._renderSettingsHtml() : ''}

          <!-- 3 Nút bấm chính (cao >= 48px) -->
          <div class="at-primary-actions">
            ${
              isRunning
                ? `<button type="button" id="at-btn-stop" class="at-btn-big at-btn-red">⏹ Dừng ngay</button>`
                : `
                  <button type="button" id="at-btn-run-all" class="at-btn-big at-btn-green">▶ Khám tổng quát</button>
                  <button type="button" id="at-btn-run-current" class="at-btn-big at-btn-blue">⚡ Kiểm tra trang này</button>
                `
            }
          </div>

          <!-- Thanh tiến độ khi đang chạy -->
          ${
            isRunning || prog.text
              ? `
            <div class="at-progress-wrap">
              <div class="at-progress-track"><div class="at-progress-fill" style="width:${prog.pct}%"></div></div>
              <div class="at-progress-text">${escHtml(prog.text || 'Đang chuẩn bị...')}</div>
            </div>`
              : ''
          }

          <!-- Đúng 2 Tab chuyển mục -->
          <div class="at-tabs">
            <button type="button" class="at-tab-btn ${this.activeTab === 'results' ? 'at-active' : ''}" data-at-tab="results">📋 Kết quả khám</button>
            <button type="button" class="at-tab-btn ${this.activeTab === 'suites' ? 'at-active' : ''}" data-at-tab="suites">☑️ Chọn bài kiểm tra</button>
          </div>

          <!-- Thân nội dung -->
          <div class="at-body">
            ${this.activeTab === 'results' ? this._renderResultsTabHtml(report) : this._renderSuitesTabHtml()}
          </div>
        </div>
      `;

      this._bindEvents();
    }

    _renderSettingsHtml() {
      return `
        <div class="at-settings-popover">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <span style="font-weight:800;">Tốc độ chạy khám:</span>
            <select id="at-sel-speed" style="background:#18181b;color:#f4f4f5;border:1px solid #52525b;border-radius:8px;padding:4px 8px;font-size:11.5px;">
              <option value="fast" ${this.speedMode === 'fast' ? 'selected' : ''}>Siêu nhanh</option>
              <option value="visual" ${this.speedMode === 'visual' ? 'selected' : ''}>Vừa phải để mắt kịp nhìn</option>
            </select>
          </div>
          <label class="at-check-row">
            <input type="checkbox" id="at-chk-chaos" ${this.chaosEnabled ? 'checked' : ''} />
            <span>Bật chế độ Thử bấm phá &amp; nạp file hỏng</span>
          </label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" id="at-btn-export-json" class="at-small-btn">⬇️ Tải báo cáo (.json)</button>
            <button type="button" id="at-btn-clear-hist" class="at-small-btn">🗑️ Xóa lịch sử khám cũ</button>
          </div>
        </div>
      `;
    }

    _renderResultsTabHtml(report) {
      if (!report) {
        return `
          <div class="at-score-card" style="text-align:center;padding:20px 14px;">
            <div style="font-size:32px;">🩺</div>
            <div style="font-weight:900;font-size:14px;color:#ecfdf5;margin-top:6px;">Bác sĩ App đã sẵn sàng!</div>
            <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">
              Bấm nút xanh <strong>▶ Khám tổng quát</strong> để tự động kiểm tra toàn bộ ứng dụng, độ mượt, giao diện điện thoại và khả năng chống sập.
            </div>
            <div style="font-size:11px;color:#6ee7b7;margin-top:8px;">
              🛡️ Bảo vệ tuyệt đối bản thảo &amp; Story Bible thật của bạn.
            </div>
          </div>
        `;
      }

      const scoreCls = report.totalScore >= 85 ? 'at-score-good' : report.totalScore >= 65 ? 'at-score-warn' : 'at-score-bad';
      const deltaTxt =
        report.runNumber > 1
          ? report.scoreDelta > 0
            ? `▲ Tăng ${report.scoreDelta} điểm`
            : report.scoreDelta < 0
              ? `▼ Giảm ${Math.abs(report.scoreDelta)} điểm`
              : 'Giữ nguyên điểm'
          : 'Lần khám đầu tiên';

      const pillarColors = { functional: '#10b981', smoothness: '#38bdf8', visual: '#a855f7', resilience: '#f59e0b' };
      const pillarsHtml = Object.entries(report.pillars)
        .map(([k, p]) => {
          const pct = Math.round((p.score / p.max) * 100);
          return `
            <div>
              <div class="at-pillar-label"><span>${escHtml(p.label)}</span><span>${p.score}/${p.max}</span></div>
              <div class="at-pillar-bar"><div class="at-pillar-fill" style="width:${pct}%;background:${pillarColors[k]}"></div></div>
            </div>
          `;
        })
        .join('');

      const regHtml = report.regressions.length
        ? `<div class="at-regression-banner">⚠️ ${escHtml(AT.PLAIN_VI_MAP.regressionTitle)}: ${report.regressions.map((r) => escHtml(r.plainTitle)).join(', ')}</div>`
        : '';

      const issuesHtml = report.issues.length
        ? report.issues
            .map((it, idx) => {
              const sevTag =
                it.severity === 'P0'
                  ? AT.PLAIN_VI_MAP.sevP0
                  : it.severity === 'P1'
                    ? AT.PLAIN_VI_MAP.sevP1
                    : AT.PLAIN_VI_MAP.sevP2;
              const sevCls = it.severity === 'P0' ? '' : it.severity === 'P1' ? 'at-sev-p1' : 'at-sev-p2';
              return `
                <div class="at-issue-card ${sevCls}">
                  <div style="font-size:10.5px;font-weight:900;opacity:0.9;margin-bottom:2px;">${sevTag}</div>
                  <div class="at-issue-title">${escHtml(it.plainTitle)}</div>
                  <div class="at-issue-desc">${escHtml(it.plainDesc)}</div>
                  <div class="at-issue-actions">
                    ${it.selector ? `<button type="button" class="at-small-btn at-small-btn-target" data-at-highlight="${escHtml(it.selector)}" data-at-hlabel="${escHtml(it.plainTitle)}">🎯 Chỉ chỗ bị lỗi</button>` : ''}
                    <button type="button" class="at-small-btn" data-at-toggle-dev="dev-${idx}">Xem chi tiết cho lập trình viên ▼</button>
                  </div>
                  <div id="at-dev-${idx}" class="at-dev-details at-hidden">Mã: ${escHtml(it.code)}
Tệp: ${escHtml(it.moduleRef || 'app')}
Selector: ${escHtml(it.selector || '(không có)')}
Chi tiết: ${escHtml(it.techDetail || '')}
Đề xuất: ${escHtml(it.fixAdvice || '')}</div>
                </div>
              `;
            })
            .join('')
        : `<div class="at-score-card" style="border-color:rgba(16,185,129,0.55);color:#a7f3d0;font-weight:800;text-align:center;">🎉 Tuyệt vời! Không phát hiện lỗi nào trên màn hình vừa khám!</div>`;

      const passedCount = report.passed.length;
      const totalCount = report.passed.length + report.issues.length;
      const passedHtml = `
        <div>
          <button type="button" id="at-btn-toggle-passed" class="at-passed-summary">
            <span>✅ ${passedCount}/${totalCount} mục chạy ngon</span>
            <span>${this.passedExpanded ? 'Thu gọn ▲' : 'Bấm xem thêm ▼'}</span>
          </button>
          ${
            this.passedExpanded
              ? `<div class="at-passed-list">
                  ${report.passed
                    .map((p) => `<div class="at-passed-item">✅ <strong>${escHtml(p.plainTitle)}</strong><div style="font-size:11px;color:#a1a1aa;">${escHtml(p.plainDesc)}</div></div>`)
                    .join('')}
                </div>`
              : ''
          }
        </div>
      `;

      const crumbsHtml = report.breadcrumbs.length
        ? `
          <details style="font-size:11.5px;color:#a1a1aa;">
            <summary style="cursor:pointer;font-weight:700;color:#d4d4d8;">🕒 ${escHtml(AT.PLAIN_VI_MAP.breadcrumbsBtn)} (${report.breadcrumbs.length})</summary>
            <div style="margin-top:6px;display:flex;flex-direction:column;gap:3px;padding-left:6px;">
              ${report.breadcrumbs.map((b, i) => `<div>${i + 1}. [${escHtml(b.time)}] ${escHtml(b.action)}</div>`).join('')}
            </div>
          </details>
        `
        : '';

      return `
        <div class="at-score-card">
          <div class="at-score-top">
            <div>
              <div style="font-size:11px;color:#a1a1aa;font-weight:700;">ĐIỂM SỨC KHỎE ỨNG DỤNG</div>
              <div class="at-score-num ${scoreCls}">${report.totalScore}<span style="font-size:15px;color:#71717a;">/100</span></div>
            </div>
            <div style="text-align:right;">
              <span class="at-delta-pill">${escHtml(deltaTxt)}</span>
              <div style="font-size:10.5px;color:#a1a1aa;margin-top:4px;">Vòng #${report.runNumber} · ${escHtml(report.viewport)}</div>
            </div>
          </div>
          <div class="at-pillars">${pillarsHtml}</div>
          ${regHtml}
          <button type="button" id="at-btn-copy-rx" class="at-btn-copy-rx">${escHtml(AT.PLAIN_VI_MAP.copyRxBtn)}</button>
        </div>
        ${issuesHtml}
        ${passedHtml}
        ${crumbsHtml}
      `;
    }

    _renderSuitesTabHtml() {
      const recActive = AT.recorder.recording;
      const recCount = AT.recorder.currentSteps.length;

      const groupsHtml = AT.SUITE_GROUPS.map((g) => {
        const isOpen = this.openGroups.has(g.id);
        const checkedInGroup = g.tests.filter((t) => this.enabledTestIds.has(t.id)).length;
        return `
          <div class="at-group-box">
            <button type="button" class="at-group-head" data-at-group="${g.id}">
              <span>${g.icon} ${escHtml(g.title)} <span style="font-size:11px;color:#6ee7b7;">(${checkedInGroup}/${g.tests.length})</span></span>
              <span>${isOpen ? '▲' : '▼'}</span>
            </button>
            ${
              isOpen
                ? `<div class="at-group-body">
                    ${g.tests
                      .map(
                        (t) => `
                      <label class="at-check-row">
                        <input type="checkbox" data-at-test-id="${t.id}" ${this.enabledTestIds.has(t.id) ? 'checked' : ''} />
                        <span>${escHtml(t.label)}</span>
                      </label>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
        `;
      }).join('');

      const savedRecsHtml = this.recordings.length
        ? `<div style="margin-top:8px;display:flex;flex-direction:column;gap:5px;">
            ${this.recordings
              .map(
                (r) => `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 8px;border-radius:8px;background:rgba(9,9,11,0.8);border:1px solid rgba(63,63,70,0.6);">
                <span style="font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🎬 ${escHtml(r.name)} (${r.steps?.length || 0} bước)</span>
                <div style="display:flex;gap:4px;flex-shrink:0;">
                  <button type="button" class="at-small-btn" data-at-replay-rec="${escHtml(r.id)}">▶ Chạy</button>
                  <button type="button" class="at-small-btn" data-at-del-rec="${escHtml(r.id)}">✕</button>
                </div>
              </div>`
              )
              .join('')}
          </div>`
        : '';

      return `
        ${groupsHtml}
        <div class="at-score-card">
          <div style="font-weight:900;font-size:12.5px;color:#fecaca;margin-bottom:6px;">🎬 ${escHtml(AT.PLAIN_VI_MAP.recorder)}</div>
          <div style="font-size:11.5px;color:#a1a1aa;margin-bottom:8px;">Tự bấm các nút trên trang web như bình thường — Bác sĩ App sẽ ghi lại thành kịch bản để lần sau tự bấm lặp lại giúp bạn.</div>
          <button type="button" id="at-btn-toggle-record" class="at-small-btn" style="width:100%;padding:9px;font-weight:900;background:${recActive ? '#dc2626' : 'rgba(239,68,68,0.2)'};border-color:#ef4444;color:#fff;">
            ${recActive ? `⏹ Dừng & Lưu kịch bản mẫu (đã ghi ${recCount} bước)` : '🔴 Quay mẫu mới'}
          </button>
          ${savedRecsHtml}
        </div>
      `;
    }

    _bindEvents() {
      const r = this.rootEl;
      if (!r) return;

      r.querySelector('#at-btn-power-off')?.addEventListener('click', () => this.ctrl.closeAndCleanup());
      r.querySelector('#at-btn-settings')?.addEventListener('click', () => {
        this.settingsOpen = !this.settingsOpen;
        this.render();
      });
      r.querySelector('#at-btn-minimize')?.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          this.mobileSnap = this.mobileSnap === 'mini' ? 'mid' : 'mini';
        } else {
          this.minimized = true;
        }
        this.render();
      });

      r.querySelectorAll('[data-at-snap]').forEach((b) => {
        b.addEventListener('click', () => {
          this.mobileSnap = b.dataset.atSnap;
          this.render();
        });
      });

      r.querySelector('#at-btn-run-all')?.addEventListener('click', () => this.ctrl.runAllSelected());
      r.querySelector('#at-btn-run-current')?.addEventListener('click', () => this.ctrl.runCurrentScreenOnly());
      r.querySelector('#at-btn-stop')?.addEventListener('click', () => this.ctrl.abortRun());

      r.querySelectorAll('[data-at-tab]').forEach((b) => {
        b.addEventListener('click', () => {
          this.activeTab = b.dataset.atTab;
          this.render();
        });
      });

      r.querySelector('#at-sel-speed')?.addEventListener('change', (e) => {
        this.speedMode = e.target.value;
      });
      r.querySelector('#at-chk-chaos')?.addEventListener('change', (e) => {
        this.chaosEnabled = Boolean(e.target.checked);
      });
      r.querySelector('#at-btn-clear-hist')?.addEventListener('click', () => {
        AT.loopEngine.clearHistory();
        this.ctrl.notify('🗑️ Đã xóa sạch lịch sử khám cũ.');
      });
      r.querySelector('#at-btn-export-json')?.addEventListener('click', () => this.ctrl.exportReportJson());

      r.querySelector('#at-btn-copy-rx')?.addEventListener('click', () => this.ctrl.copyAiPrescription());
      r.querySelector('#at-btn-toggle-passed')?.addEventListener('click', () => {
        this.passedExpanded = !this.passedExpanded;
        this.render();
      });

      r.querySelectorAll('[data-at-highlight]').forEach((b) => {
        b.addEventListener('click', () => this.highlightTargetOnPage(b.dataset.atHighlight, b.dataset.atHlabel));
      });
      r.querySelectorAll('[data-at-toggle-dev]').forEach((b) => {
        b.addEventListener('click', () => {
          const box = r.querySelector(`#at-${b.dataset.atToggleDev}`);
          box?.classList.toggle('at-hidden');
        });
      });

      r.querySelectorAll('[data-at-group]').forEach((b) => {
        b.addEventListener('click', () => {
          const gid = b.dataset.atGroup;
          if (this.openGroups.has(gid)) this.openGroups.delete(gid);
          else this.openGroups.add(gid);
          this.render();
        });
      });
      r.querySelectorAll('[data-at-test-id]').forEach((chk) => {
        chk.addEventListener('change', (e) => {
          const id = e.target.dataset.atTestId;
          if (e.target.checked) this.enabledTestIds.add(id);
          else this.enabledTestIds.delete(id);
        });
      });

      r.querySelector('#at-btn-toggle-record')?.addEventListener('click', async () => {
        if (AT.recorder.recording) {
          const saved = await AT.recorder.stopAndSave();
          await this.refreshRecordings();
          this.ctrl.notify(saved ? `💾 Đã lưu kịch bản mẫu (${saved.steps.length} bước)!` : 'Chưa ghi nhận thao tác nào.');
        } else {
          AT.recorder.start(() => this.render());
          this.ctrl.notify('🔴 Đang quay thao tác mẫu — hãy bấm các nút trên web như bình thường rồi bấm Dừng & Lưu!');
        }
        this.render();
      });

      r.querySelectorAll('[data-at-replay-rec]').forEach((b) => {
        b.addEventListener('click', () => this.ctrl.replayRecording(b.dataset.atReplayRec));
      });
      r.querySelectorAll('[data-at-del-rec]').forEach((b) => {
        b.addEventListener('click', async () => {
          await AT.recorder.deleteRecording(b.dataset.atDelRec);
          await this.refreshRecordings();
          this.render();
        });
      });
    }
  }

  AT.AutoTesterShell = AutoTesterShell;
})(typeof window !== 'undefined' ? window : globalThis);
