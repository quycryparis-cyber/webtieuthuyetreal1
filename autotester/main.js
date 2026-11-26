/**
 * ============================================================================
 * 🩺 AUTOTESTER ULTRA MAIN CONTROLLER (v118)
 * Khởi tạo, điều phối màn hình chờ xoay %, bảo vệ 3 lớp Sandbox & dọn sạch RAM
 * ============================================================================
 */
(function initAutoTesterMain(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  class NoirAutoTesterController {
    constructor() {
      this._open = false;
      this.isRunning = false;
      this._aborted = false;
      this.lastReport = null;
      this.progress = { pct: 0, text: '' };
      this.shell = new AT.AutoTesterShell(this);
    }

    isOpen() {
      return this._open;
    }

    notify(msg, tone = 'info') {
      try {
        if (globalScope.NoirStudio?.utils?.showToast) {
          globalScope.NoirStudio.utils.showToast(msg, tone, 3200);
          return;
        }
      } catch (_e) {}
      console.info('[Bác sĩ App]', msg);
    }

    open() {
      this._open = true;
      this.shell.minimized = false;
      this.shell.mount();
      this.shell.render();
    }

    abortRun() {
      if (!this.isRunning) return;
      this._aborted = true;
      this.progress.text = '⏹ Đang dừng khẩn cấp và khôi phục dữ liệu an toàn...';
      this.shell.render();
    }

    closeAndCleanup() {
      this._aborted = true;
      this.isRunning = false;
      window.__NOIR_AUTOTESTER_RUNNING__ = false;
      this._open = false;
      try { AT.recorder.cancel(); } catch (_e) {}
      try { AT.errorAuditor.stop(); } catch (_e) {}
      try { AT.smoothAuditor.stop(); } catch (_e) {}
      try { AT.clipboard.restore(); } catch (_e) {}
      try { AT.geoMock.restore(); } catch (_e) {}
      try { AT.virtualClock.restore(); } catch (_e) {}
      try { AT.interceptors.restoreAll(); } catch (_e) {}
      try { AT.sandbox.exitAndRestore(); } catch (_e) {}
      this.shell.unmount();
      this.notify('🩺 Đã tắt Bác sĩ App và dọn sạch bộ nhớ.', 'info');
    }

    async _executeTests(testsList, runLabel = 'Khám tổng quát') {
      if (this.isRunning) return;
      this.isRunning = true;
      window.__NOIR_AUTOTESTER_RUNNING__ = true;
      try { document.getElementById('noir-welcome-api-upsell-modal')?.remove(); } catch (_eUpRm) {}
      this._aborted = false;
      this.progress = { pct: 4, text: `Đang khởi động: ${runLabel}...` };
      this.shell.activeTab = 'results';
      if (window.innerWidth < 768) this.shell.mobileSnap = 'mid';
      this.shell.render();

      AT.sandbox.enter();
      AT.driver.resetRunState();
      AT.causal.reset();
      AT.clipboard.start();
      AT.errorAuditor.start();
      AT.smoothAuditor.start();
      AT.interceptors.startSilentDownloadCapture();
      AT.interceptors.setNetworkSimulation('shield'); // Lá chắn 0 đốt Token AI thật

      const results = [];
      const ctx = {
        isAborted: () => this._aborted,
        speedDelay: () => (this.shell.speedMode === 'visual' ? 320 : 55),
      };

      try {
        for (let i = 0; i < testsList.length; i++) {
          if (this._aborted) break;
          const t = testsList[i];
          this.progress = {
            pct: Math.min(95, Math.round(((i + 0.35) / Math.max(1, testsList.length)) * 90) + 5),
            text: `(${i + 1}/${testsList.length}) ${t.label}...`,
          };
          this.shell.render();

          try {
            const res = await t.run(ctx);
            if (res) results.push(res);
          } catch (err) {
            results.push({
              id: t.id,
              groupId: t.groupId || 'core_features',
              code: 'ERR_CONSOLE_RUNTIME',
              status: 'FAIL',
              severity: 'P0',
              pillar: 'functional',
              plainTitle: `Mục "${t.label}" gặp sự cố khi chạy`,
              plainDesc: 'Có lỗi bất ngờ xảy ra khiến mục kiểm tra này dừng giữa chừng.',
              techDetail: err?.message || String(err),
              moduleRef: 'app',
            });
          }

          this.progress = {
            pct: Math.min(98, Math.round(((i + 1) / Math.max(1, testsList.length)) * 92) + 5),
            text: `Xong (${i + 1}/${testsList.length}): ${t.label}`,
          };
          this.shell.render();
          await AT.sleep(ctx.speedDelay());
        }

        if (AT.errorAuditor.errors.length > 0) {
          results.push({
            id: 'global_runtime_errors',
            groupId: 'core_features',
            code: 'ERR_CONSOLE_RUNTIME',
            status: 'FAIL',
            severity: 'P0',
            pillar: 'functional',
            plainTitle: `Phát hiện ${AT.errorAuditor.errors.length} lỗi chạy ngầm trong phiên khám`,
            plainDesc: AT.RULE_KNOWLEDGE_BASE.ERR_CONSOLE_RUNTIME.plainDesc,
            fixAdvice: AT.RULE_KNOWLEDGE_BASE.ERR_CONSOLE_RUNTIME.fixAdvice,
            moduleRef: AT.errorAuditor.errors[0]?.file || 'runtime',
            techDetail: AT.errorAuditor.errors.slice(0, 4).map((e) => `[${e.source}] ${e.message}`).join('\n'),
          });
        }

        if (AT.driver.healedNotes.length > 0) {
          results.push({
            id: 'self_healing_drift',
            groupId: 'core_features',
            code: 'WARN_SELF_HEAL_DRIFT',
            status: 'FAIL',
            severity: 'P2',
            pillar: 'functional',
            plainTitle: AT.RULE_KNOWLEDGE_BASE.WARN_SELF_HEAL_DRIFT.plainTitle,
            plainDesc: AT.RULE_KNOWLEDGE_BASE.WARN_SELF_HEAL_DRIFT.plainDesc,
            fixAdvice: AT.RULE_KNOWLEDGE_BASE.WARN_SELF_HEAL_DRIFT.fixAdvice,
            techDetail: AT.driver.healedNotes.map((h) => `Expected ${h.expected} -> Found ${h.foundTag} (score ${h.score})`).join('\n'),
          });
        }

        if (!this._aborted) {
          this.progress = { pct: 100, text: '✅ Hoàn tất 100%! Đang tổng hợp điểm sức khỏe 5 trụ cột...' };
          this.shell.render();
          await AT.sleep(220);
        }
      } finally {
        const perfStats = AT.smoothAuditor.snapshot();
        AT.errorAuditor.stop();
        AT.smoothAuditor.stop();
        AT.clipboard.restore();
        AT.geoMock.restore();
        AT.virtualClock.restore();
        AT.interceptors.restoreAll();
        AT.sandbox.exitAndRestore();

        const kpis = {
          buttonsTested: AT.causal.buttonsTested,
          deadButtonsFound: AT.causal.deadButtonsFound,
        };
        this.lastReport = AT.loopEngine.computeReport(results, perfStats, AT.driver.breadcrumbs, kpis);
        this.isRunning = false;
        window.__NOIR_AUTOTESTER_RUNNING__ = false;
        this.progress = {
          pct: 100,
          text: this._aborted
            ? '⏹ Đã dừng và khôi phục an toàn.'
            : `✅ Khám xong! Điểm sức khỏe: ${this.lastReport.totalScore}/100`,
        };
        if (window.innerWidth < 768 && !this._aborted) this.shell.mobileSnap = 'full';
        this.shell.render();
      }
    }

    async runAllSelected() {
      const selected = [];
      for (const g of AT.SUITE_GROUPS) {
        if (g.id === 'chaos_resilience' && !this.shell.chaosEnabled) continue;
        for (const t of g.tests) {
          if (this.shell.enabledTestIds.has(t.id)) {
            selected.push({ ...t, groupId: g.id });
          }
        }
      }
      if (!selected.length) {
        this.notify('Bạn hãy tick chọn ít nhất 1 bài kiểm tra ở tab Chọn bài kiểm tra nhé!', 'warning');
        return;
      }
      await this._executeTests(selected, 'Khám tổng quát toàn bộ app');
    }

    async runCurrentScreenOnly() {
      const perfSuite = AT.SUITE_GROUPS.find((g) => g.id === 'visual_smooth_i18n')?.tests.find((t) => t.id === 'perf_fps_and_memory');
      const simW = AT.viewportSim?.getWidth?.() || window.innerWidth;
      const simH = AT.viewportSim?.getHeight?.() || window.innerHeight;
      const quickTests = [
        {
          id: 'current_screen_visual',
          groupId: 'visual_smooth_i18n',
          label: 'Soi tràn mép, đè thanh nổi, mã chữ chưa dịch & nút bấm trên màn hình đang mở',
          run: async () => {
            const findings = AT.visualAuditor.scanCurrentScreen('Màn hình đang mở');
            const cap = AT.browserMatrix.audit();
            if (!findings.length) {
              return {
                id: 'current_screen_visual',
                groupId: 'visual_smooth_i18n',
                status: 'PASS',
                severity: 'OK',
                pillar: 'visual',
                plainTitle: 'Màn hình đang mở hiển thị gọn đẹp, không bị cắt hay tràn mép',
                plainDesc: `Đã kiểm tra sạch trên khung hình ${simW}x${simH}px${AT.viewportSim?.isSimulated?.() ? ` (Giả lập ${AT.viewportSim.mode})` : ''}. ${cap.summaryText}`,
              };
            }
            const first = findings[0];
            const kb = AT.RULE_KNOWLEDGE_BASE[first.code] || {};
            return {
              id: 'current_screen_visual',
              groupId: 'visual_smooth_i18n',
              code: first.code,
              status: 'FAIL',
              severity: kb.severity || 'P1',
              pillar: 'visual',
              plainTitle: kb.plainTitle || 'Phát hiện lệch giao diện',
              plainDesc: kb.plainDesc || '',
              fixAdvice: kb.fixAdvice || '',
              selector: first.selector,
              techDetail: findings.map((x) => `[${x.code}] ${x.techDetail}`).join('\n'),
            };
          },
        },
        ...(perfSuite ? [{ ...perfSuite, groupId: 'visual_smooth_i18n' }] : []),
      ];
      await this._executeTests(quickTests, 'Kiểm tra màn hình đang mở');
    }

    async replayRecording(recId) {
      const rec = this.shell.recordings.find((x) => x.id === recId);
      if (!rec || !rec.steps?.length) return;
      const customTest = {
        id: `replay_${rec.id}`,
        groupId: 'chaos_resilience',
        label: `Chạy lại kịch bản mẫu "${rec.name}"`,
        run: async (ctx) => {
          await AT.dsl.runSteps(rec.steps, ctx);
          return {
            id: `replay_${rec.id}`,
            groupId: 'chaos_resilience',
            status: 'PASS',
            severity: 'OK',
            pillar: 'functional',
            plainTitle: `Chạy lặp lại thành công kịch bản "${rec.name}"`,
            plainDesc: `Đã thực thi đủ ${rec.steps.length} thao tác mẫu không gặp lỗi.`,
          };
        },
      };
      await this._executeTests([customTest], rec.name);
    }

    async copyAiPrescription() {
      const text = AT.loopEngine.buildAiPatchPrompt(this.lastReport);
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        this.notify('📋 Đã chép đơn thuốc gửi AI sửa lỗi vào bộ nhớ tạm! Bạn chỉ cần dán (Ctrl+V) vào khung chat.', 'success');
      } catch (_e) {
        this.notify('⚠️ Trình duyệt chặn tự chép — hãy mở tải báo cáo JSON trong nút Cài đặt ⚙️.', 'warning');
      }
    }

    exportReportJson() {
      if (!this.lastReport) {
        this.notify('Chưa có kết quả khám để tải về.', 'warning');
        return;
      }
      const blob = new Blob([JSON.stringify(this.lastReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao_cao_bac_si_app_vong_${this.lastReport.runNumber}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  }

  globalScope.NoirAutoTester = new NoirAutoTesterController();
})(typeof window !== 'undefined' ? window : globalThis);
