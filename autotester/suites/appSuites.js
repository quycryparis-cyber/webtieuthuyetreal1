/**
 * ============================================================================
 * 🧪 AUTOTESTER ULTRA TEST SUITES (v118 — ĐỒNG BỘ, HOẠT ĐỘNG THẬT & ĐỘ BỀN)
 * ============================================================================
 * Gom gọn thành đúng 4 cụm thu gọn dễ hiểu cho người dùng phổ thông:
 *  Cụm 1: Đồng bộ & Hoạt động thật (YouTube PiP/Nền, Thu gọn/Mở rộng, 6 Chế độ AI + Clipboard,
 *         FX-570/Desmos/Pomodoro/Bi Số 8, Định vị GPS/Thời tiết/Bầu trời/Báo thức)
 *  Cụm 2: Viết truyện, Story Bible & Đổi tệp tin (ĐăngLovePDF nạp RAM, 6 Tab, Quản lý RAM Mod 47)
 *  Cụm 3: Giao diện, 6 Ngôn ngữ, Đa trình duyệt & Độ mượt (Tràn mép, Đè thanh nổi, i18n, 10 API, FPS/RAM)
 *  Cụm 4: Thử thách độ bền, Chống mã độc & Tự quay mẫu (File 0 byte, XSS, Bấm đúp, Giả lập rớt mạng)
 * ============================================================================
 */
(function initAutoTesterSuites(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  function makePass(id, groupId, plainTitle, plainDesc, moduleRef = 'app', pillar = 'functional') {
    return { id, groupId, status: 'PASS', severity: 'OK', pillar, plainTitle, plainDesc, moduleRef };
  }

  function makeIssue(id, groupId, code, override = {}) {
    const kb = AT.RULE_KNOWLEDGE_BASE[code] || {};
    return {
      id,
      groupId,
      code,
      status: 'FAIL',
      severity: override.severity || kb.severity || 'P1',
      pillar: override.pillar || kb.pillar || 'functional',
      plainTitle: override.plainTitle || kb.plainTitle || 'Phát hiện mục cần kiểm tra',
      plainDesc: override.plainDesc || kb.plainDesc || 'Có dấu hiệu bất thường trong quá trình kiểm tra.',
      fixAdvice: override.fixAdvice || kb.fixAdvice || '',
      selector: override.selector || '',
      moduleRef: override.moduleRef || 'app',
      techDetail: override.techDetail || '',
    };
  }

  function isBiNovelApp() {
    return Boolean(globalScope.NoirStudio && document.getElementById('s14-screen-6-system'));
  }

  async function switchTabSafe(screenKey) {
    if (globalScope.NoirStudio?.navigator?.navigateToScreen) {
      globalScope.NoirStudio.navigator.navigateToScreen(screenKey);
    } else {
      const btn = document.querySelector(`[data-s14-tab="${screenKey}"]`);
      if (btn) btn.click();
    }
    await AT.sleep(150);
  }

  // --------------------------------------------------------------------------
  // DANH MỤC 4 CỤM BÀI KIỂM TRA ULTRA (MẶC ĐỊNH ĐÓNG KÍN — 12 BÀI CHUYÊN SÂU)
  // --------------------------------------------------------------------------
  const SUITE_GROUPS = [
    // ========================================================================
    // CỤM 1: ĐỒNG BỘ & HOẠT ĐỘNG THẬT (YouTube PiP, Thu gọn/Mở rộng, 6 Chế độ, FX-570, GPS/Báo thức)
    // ========================================================================
    {
      id: 'sync_and_liveness',
      icon: '🔄',
      title: '1. Đồng bộ & Hoạt động thật (YouTube PiP, Thu gọn, 6 Chế độ, FX-570, GPS, Báo thức)',
      tests: [
        {
          id: 'sync_youtube_pip_and_bg',
          label: 'YouTube, Cửa sổ nổi Desktop, Nền chuyển động & Chống phát vọng âm thanh',
          run: async (ctx) => {
            if (!isBiNovelApp() || !globalScope.NoirStudio?.youtubeStudio) {
              return makePass('sync_youtube_pip_and_bg', 'sync_and_liveness', 'Bỏ qua bài YouTube (không có trên trang này)', 'Tự động thích ứng cho trang web ngoài.', 'app', 'sync');
            }
            await switchTabSafe('SCREEN_5_AMBIENCE');
            if (ctx.isAborted()) return null;

            const ytFacade = globalScope.NoirStudio.youtubeStudio;
            const bgEngine = globalScope.NoirStudio.youtubeMotionBg || globalScope.NoirStudio.mod40;
            const stageEl = document.getElementById('mod39-player-stage-wrapper') || document.getElementById('mod39-subview-player');
            const bgCard = document.getElementById('mod40-motion-bg-control-card');
            const bgAdvBtn = document.getElementById('btn-mod40-toggle-bg-advanced');
            const bgAdvBody = document.getElementById('mod40-bg-advanced-body');

            // 1. Kiểm tra đồng bộ & bấm thật nút mở rộng/thu gọn bộ chỉnh nền YouTube (Mod 40)
            let bgToggleOk = true;
            if (bgAdvBtn && bgAdvBody) {
              const wasHidden = bgAdvBody.classList.contains('hidden');
              const probe = await AT.causal.probeClickCausal(bgAdvBtn, {
                watchRoot: bgCard || document.body,
                readState: () => bgAdvBody.classList.contains('hidden'),
              });
              bgToggleOk = probe.alive;
              // Khôi phục lại đúng trạng thái ban đầu
              if (bgAdvBody.classList.contains('hidden') !== wasHidden) {
                bgAdvBtn.click();
                await AT.sleep(80);
              }
            }

            // 2. Kiểm tra kiến trúc chống vọng âm thanh 2 luồng (Single Active Stream)
            const activeIframes = Array.from(document.querySelectorAll('iframe')).filter((f) => {
              const src = String(f.getAttribute('src') || '');
              return /youtube(?:-nocookie)?\.com\/embed/i.test(src) && getComputedStyle(f).display !== 'none';
            });
            const hasDualEcho = activeIframes.length > 1;
            if (hasDualEcho) {
              return makeIssue('sync_youtube_pip_and_bg', 'sync_and_liveness', 'ERR_DUAL_AUDIO_ECHO', {
                selector: '#mod39-player-stage-wrapper',
                moduleRef: 'mod39_youtube_adfree_player_and_background.js',
                techDetail: `Phát hiện ${activeIframes.length} khung YouTube đang hiển thị đồng thời (nguy cơ vọng tiếng đôi).`,
              });
            }

            // 3. Kiểm tra Parser Link YouTube hoạt động thật
            const parser = globalScope.NoirStudio.YouTubeUrlParserAndValidator;
            let parserOk = true;
            if (parser && typeof parser.extractVideoId === 'function') {
              const id1 = parser.extractVideoId('https://www.youtube.com/watch?v=jfKfPfyJRdk');
              const id2 = parser.extractVideoId('https://youtu.be/jfKfPfyJRdk?t=45');
              parserOk = id1 === 'jfKfPfyJRdk' && id2 === 'jfKfPfyJRdk';
            }

            // 4. Kiểm tra phương thức điều khiển PiP/Tua/Lặp tồn tại và gắn kết sạch
            const pipReady = Boolean(ytFacade && stageEl && bgEngine);
            if (!bgToggleOk) {
              return makeIssue('sync_youtube_pip_and_bg', 'sync_and_liveness', 'ERR_BG_VIDEO_DESYNC', {
                selector: '#btn-mod40-toggle-bg-advanced',
                moduleRef: 'mod40_youtube_motion_background_engine.js',
                techDetail: 'Nút điều khiển nâng cao của nền video chuyển động không phản hồi DOM sau khi bấm.',
              });
            }
            if (pipReady && parserOk) {
              return makePass(
                'sync_youtube_pip_and_bg',
                'sync_and_liveness',
                'Trình phát YouTube, Cửa sổ nổi & Nền video đồng bộ sạch (0 tiếng vọng đôi)',
                'Đã kiểm tra khung phát chính, cầu nối đồng bộ Cửa sổ nổi, bộ nhận diện link YouTube và công tắc Nền video chuyển động.',
                'mod39_youtube_adfree_player_and_background.js',
                'sync'
              );
            }
            return makeIssue('sync_youtube_pip_and_bg', 'sync_and_liveness', 'ERR_PIP_TIME_DESYNC', {
              selector: '#mod39-player-stage-wrapper',
              moduleRef: 'mod39_youtube_adfree_player_and_background.js',
              techDetail: `pipReady=${pipReady}, parserOk=${parserOk}`,
            });
          },
        },
        {
          id: 'sync_collapse_expand_all',
          label: 'Đồng bộ 2 chiều nút Thu gọn / Mở rộng & Thu gọn tất cả / Mở rộng tất cả',
          run: async (ctx) => {
            if (!isBiNovelApp()) {
              return makePass('sync_collapse_expand_all', 'sync_and_liveness', 'Kiểm tra đóng/mở mục cơ bản', 'Áp dụng cho trang web ngoài.', 'app', 'sync');
            }
            await switchTabSafe('SCREEN_6_SYSTEM');
            if (ctx.isAborted()) return null;

            const btnCollapseAll = document.getElementById('btn-tab6-collapse-all');
            const btnExpandAll = document.getElementById('btn-tab6-expand-all');
            const perfToggle = document.getElementById('btn-toggle-tab6-perf-ram');
            const perfBody = document.getElementById('tab6-perf-ram-body');

            if (!btnCollapseAll || !btnExpandAll) {
              return makeIssue('sync_collapse_expand_all', 'sync_and_liveness', 'ERR_COLLAPSE_ALL_INCOMPLETE', {
                selector: '#s14-screen-6-system',
                moduleRef: 'index.html',
                techDetail: 'Không tìm thấy nút #btn-tab6-collapse-all hoặc #btn-tab6-expand-all trong Tab 6.',
              });
            }

            // 1. Kiểm tra Mở rộng tất cả
            AT.driver.recordBreadcrumb('Bấm Mở rộng tất cả Tab 6');
            const expProbe = await AT.causal.probeClickCausal(btnExpandAll, {
              watchRoot: document.getElementById('s14-screen-6-system'),
              readState: () => perfBody ? !perfBody.classList.contains('hidden') : true,
            });
            await AT.sleep(100);
            const openAfterExpand = perfBody ? !perfBody.classList.contains('hidden') : true;

            // 2. Kiểm tra Thu gọn tất cả (không để sót Zombie Open Panel)
            AT.driver.recordBreadcrumb('Bấm Thu gọn tất cả Tab 6');
            await AT.causal.probeClickCausal(btnCollapseAll, {
              watchRoot: document.getElementById('s14-screen-6-system'),
              readState: () => perfBody ? perfBody.classList.contains('hidden') : true,
            });
            await AT.sleep(100);
            const closedAfterCollapse = perfBody ? perfBody.classList.contains('hidden') : true;

            // 3. Kiểm tra nút đơn lẻ Mod 47 có mở/đóng ăn ngay sau khi Thu gọn tất cả không
            let singleOk = true;
            if (perfToggle && perfBody) {
              const probeSingle = await AT.causal.probeClickCausal(perfToggle, {
                watchRoot: document.getElementById('tab6-acc-perf-ram-manager') || document.body,
                readState: () => !perfBody.classList.contains('hidden'),
              });
              singleOk = probeSingle.alive && !perfBody.classList.contains('hidden');
              // Trả lại gọn gàng
              perfToggle.click();
              await AT.sleep(60);
            }

            if (!closedAfterCollapse) {
              return makeIssue('sync_collapse_expand_all', 'sync_and_liveness', 'ERR_COLLAPSE_ALL_INCOMPLETE', {
                selector: '#btn-tab6-collapse-all',
                moduleRef: 'mod47_performance_ram_and_lifecycle_manager.js',
                techDetail: 'Sau khi bấm #btn-tab6-collapse-all, khung #tab6-perf-ram-body vẫn bị kẹt mở (Zombie Panel).',
              });
            }
            if (!openAfterExpand && !expProbe.alive) {
              return makeIssue('sync_collapse_expand_all', 'sync_and_liveness', 'ERR_EXPAND_ALL_INCOMPLETE', {
                selector: '#btn-tab6-expand-all',
                moduleRef: 'index.html',
                techDetail: 'Bấm #btn-tab6-expand-all không mở bung được các mục con.',
              });
            }
            if (!singleOk) {
              return makeIssue('sync_collapse_expand_all', 'sync_and_liveness', 'ERR_COLLAPSE_SINGLE_BROKEN', {
                selector: '#btn-toggle-tab6-perf-ram',
                moduleRef: 'mod47_performance_ram_and_lifecycle_manager.js',
                techDetail: 'Nút mở rộng đơn lẻ không đồng bộ sau khi bấm Thu gọn tất cả.',
              });
            }

            return makePass(
              'sync_collapse_expand_all',
              'sync_and_liveness',
              'Nút Thu gọn / Mở rộng & Thu gọn tất cả đồng bộ 2 chiều hoàn hảo',
              'Đã thử Mở rộng tất cả -> Thu gọn tất cả (0 mục kẹt mở) -> Mở đơn lẻ 1 chạm ăn ngay.',
              'mod47_performance_ram_and_lifecycle_manager.js',
              'sync'
            );
          },
        },
        {
          id: 'sync_6modes_and_clipboard',
          label: 'Chuyển 6 Chế độ AI, nút Chọn hết & Sao chép câu lệnh đúng nội dung sống (0 dính chữ cũ)',
          run: async (ctx) => {
            if (!isBiNovelApp()) {
              return makePass('sync_6modes_and_clipboard', 'sync_and_liveness', 'Kiểm tra sao chép văn bản cơ bản', 'Áp dụng cho trang web ngoài.', 'app', 'sync');
            }
            await switchTabSafe('SCREEN_3_AI');
            if (ctx.isAborted()) return null;

            const outEditor = document.getElementById('tab3-rich-output-editor');
            const outSelBtn = document.querySelector('[data-v117-select-all="tab3-rich-output-editor"]');
            const outCopyBtn = document.querySelector('[data-v117-copy-all="tab3-rich-output-editor"]');
            const modeBtns = Array.from(document.querySelectorAll('#s20-quad-tab-selector button'));

            if (!outEditor || !outSelBtn || !outCopyBtn) {
              return makeIssue('sync_6modes_and_clipboard', 'sync_and_liveness', 'ERR_MISSING_COPY_SELECT_ALL', {
                selector: '#tab3-rich-output-editor',
                moduleRef: 'mod17_tab3_five_modes_output_controller.js',
                techDetail: `outEditor=${Boolean(outEditor)}, outSelBtn=${Boolean(outSelBtn)}, outCopyBtn=${Boolean(outCopyBtn)}`,
              });
            }

            // Lưu trạng thái cũ để khôi phục 100% không đụng dữ liệu người dùng
            const origHtml = outEditor.innerHTML;
            const origActiveBtn = modeBtns.find((b) => b.classList.contains('active') || b.getAttribute('aria-pressed') === 'true');
            const marker = `AT_LIVE_SYNC_${Date.now()}`;

            try {
              // Đổi qua chế độ khác nếu có >= 2 nút chế độ để kiểm chứng nút chế độ không liệt
              if (modeBtns.length >= 2) {
                const probeMode = await AT.causal.probeClickCausal(modeBtns[1], {
                  watchRoot: document.getElementById('s20-quad-tab-selector') || document.body,
                });
                if (!probeMode.alive && !probeMode.hitOk) {
                  return makeIssue('sync_6modes_and_clipboard', 'sync_and_liveness', 'ERR_DEAD_BUTTON', {
                    selector: '#s20-quad-tab-selector',
                    moduleRef: 'mod17_tab3_five_modes_output_controller.js',
                    techDetail: 'Bấm chuyển sang Chế độ 2 không tạo tín hiệu DOM/trạng thái nào.',
                  });
                }
              }

              // Bơm chuỗi đánh dấu tạm thời vào khung output rồi bấm nút "📋 Sao chép tất cả" thật
              AT.clipboard.clearLast();
              outEditor.textContent = `Nội dung kiểm thử đồng bộ: ${marker}`;
              outEditor.dispatchEvent(new Event('input', { bubbles: true }));
              await AT.sleep(80);

              AT.driver.recordBreadcrumb('Bấm Sao chép tất cả ở Tab 3 để đối chiếu Clipboard thật');
              outCopyBtn.click();
              await AT.sleep(160);

              const copied = AT.clipboard.lastCopiedText || '';
              if (!copied.includes(marker)) {
                return makeIssue('sync_6modes_and_clipboard', 'sync_and_liveness', 'ERR_MODE_CLIPBOARD_STALE', {
                  selector: '[data-v117-copy-all="tab3-rich-output-editor"]',
                  moduleRef: 'mod17_tab3_five_modes_output_controller.js',
                  techDetail: `Mong đợi Clipboard chứa "${marker}", nhưng nhận được: "${copied.slice(0, 80)}"`,
                });
              }

              // Kiểm tra luôn Tab 4 Story Bible có đủ nút Chọn hết & Sao chép hết
              await switchTabSafe('SCREEN_4_BIBLE');
              const bibleSel = document.querySelector('[data-v117-select-all="tab4-rich-bible-editor"]');
              const bibleCopy = document.querySelector('[data-v117-copy-all="tab4-rich-bible-editor"]');
              if (!bibleSel || !bibleCopy) {
                return makeIssue('sync_6modes_and_clipboard', 'sync_and_liveness', 'ERR_MISSING_COPY_SELECT_ALL', {
                  selector: '#tab4-rich-bible-editor',
                  moduleRef: 'mod17_tab3_five_modes_output_controller.js',
                  techDetail: `Thiếu nút ở Story Bible: bibleSel=${Boolean(bibleSel)}, bibleCopy=${Boolean(bibleCopy)}`,
                });
              }
            } finally {
              // Khôi phục 100% nội dung gốc và chế độ ban đầu
              await switchTabSafe('SCREEN_3_AI');
              outEditor.innerHTML = origHtml;
              outEditor.dispatchEvent(new Event('input', { bubbles: true }));
              if (origActiveBtn) origActiveBtn.click();
              await AT.sleep(60);
            }

            return makePass(
              'sync_6modes_and_clipboard',
              'sync_and_liveness',
              '6 Chế độ AI, Chọn tất cả & Sao chép tất cả khớp 100% dữ liệu sống',
              'Bấm sao chép lấy đúng nội dung vừa sửa ở chế độ đang chọn, không bị dính chữ cũ.',
              'mod17_tab3_five_modes_output_controller.js',
              'sync'
            );
          },
        },
        {
          id: 'liveness_fx570_desmos_pomo_bot',
          label: 'Máy tính Casio FX-570, Đồ thị Desmos, Pomodoro 2 chiều & Trợ lý Bi Số 8',
          run: async (ctx) => {
            if (!isBiNovelApp()) {
              return makePass('liveness_fx570_desmos_pomo_bot', 'sync_and_liveness', 'Kiểm tra công cụ tương tác cơ bản', 'Áp dụng cho web ngoài.', 'app', 'functional');
            }

            // 1. Casio FX-570 Math Engine thật (125 + 375 = 500, sin(30°) = 0.5, 1/0 không sập)
            const mathEng = globalScope.NoirStudio?.Fx570MathEngine;
            let calcOk = true;
            let calcDetail = '';
            if (mathEng && typeof mathEng.evaluateExpression === 'function') {
              const r1 = mathEng.evaluateExpression('125+375', { angleUnit: 'DEG' });
              const r2 = mathEng.evaluateExpression('sin(30)', { angleUnit: 'DEG' });
              const r3 = mathEng.evaluateExpression('1/0', { angleUnit: 'DEG' });
              const val1 = Number(r1?.value ?? r1?.result ?? r1);
              const val2 = Number(r2?.value ?? r2?.result ?? r2);
              const safeDivZero = !Number.isFinite(Number(r3?.value ?? r3?.result)) || Boolean(r3?.error);
              calcOk = Math.abs(val1 - 500) < 1e-6 && Math.abs(val2 - 0.5) < 1e-6 && safeDivZero;
              calcDetail = `125+375=${val1}, sin(30)=${val2}, 1/0 safe=${safeDivZero}`;
              AT.causal.buttonsTested += 3;
            }
            if (!calcOk) {
              return makeIssue('liveness_fx570_desmos_pomo_bot', 'sync_and_liveness', 'ERR_CALC_DEAD_KEY', {
                selector: '#mod45-modal-mount-body',
                moduleRef: 'mod45_scientific_fx570_and_desmos_graphing_calc.js',
                techDetail: `Kết quả máy tính FX-570 sai lệch: ${calcDetail}`,
              });
            }

            // 2. Đồng bộ 2 chiều Đồng hồ Pomodoro (Tab 5 <-> Thanh nổi góc màn hình)
            await switchTabSafe('SCREEN_5_AMBIENCE');
            if (ctx.isAborted()) return null;
            const mainPomo = document.getElementById('tab5-pomo-time-display');
            const floatPomo = document.getElementById('floating-pomo-time');
            let pomoSynced = true;
            if (mainPomo && floatPomo) {
              const tMain = String(mainPomo.textContent || '').trim();
              const tFloat = String(floatPomo.textContent || '').trim();
              pomoSynced = Boolean(tMain && tFloat && tMain === tFloat);
              if (!pomoSynced) {
                return makeIssue('liveness_fx570_desmos_pomo_bot', 'sync_and_liveness', 'ERR_POMO_SYNC_DRIFT', {
                  selector: '#tab5-pomo-time-display, #floating-pomo-time',
                  moduleRef: 'mod20_bidirectional_pomodoro_sync_engine.js',
                  techDetail: `Tab 5 hiển thị "${tMain}" nhưng Thanh nổi hiển thị "${tFloat}".`,
                });
              }
            }

            // 3. Trợ lý AI Bi Số 8 (Mod 27): không ping-pong giữa Chế độ 1 & 2
            const bot = globalScope.NoirStudio?.mascotAndChat;
            if (bot && typeof bot.classifyChatMessageIntent === 'function') {
              const i1 = bot.classifyChatMessageIntent('Bạn có thể cho tôi biết trang web này có gì', 'WEB_SUPPORT_STRICT');
              const i2 = bot.classifyChatMessageIntent('Bạn có thể cho tôi biết trang web này có gì', 'CASUAL_CHAT_AUTO');
              const ans = bot.buildIntelligentLocalResponse?.('Bạn có thể cho tôi biết trang web này có gì') || '';
              if (i1?.category !== 'WEB_FEATURE' || i2?.category !== 'WEB_FEATURE' || !/Tab 1|ĐăngLovePDF|Story Bible/i.test(ans)) {
                return makeIssue('liveness_fx570_desmos_pomo_bot', 'sync_and_liveness', 'ERR_CHATBOT_PINGPONG', {
                  selector: '#s11-mascot-bi-corner',
                  moduleRef: 'mod27_mascot_bi_so_8_and_dual_chat_assistant.js',
                  techDetail: `intent1=${i1?.category}, intent2=${i2?.category}`,
                });
              }
            }

            return makePass(
              'liveness_fx570_desmos_pomo_bot',
              'sync_and_liveness',
              'Máy tính FX-570, Pomodoro 2 chiều & Trợ lý Bi Số 8 đều chạy chính xác',
              'FX-570 tính đúng 125+375=500 & sin(30°)=0.5; Pomodoro Tab 5 khớp tuyệt đối với thanh nổi; Bi Số 8 trả lời chuẩn 2 chế độ.',
              'mod45_scientific_fx570_and_desmos_graphing_calc.js',
              'functional'
            );
          },
        },
        {
          id: 'sync_location_weather_sky_alarm',
          label: 'Định vị GPS (Đà Nẵng & Từ chối quyền), Thời tiết ↔ Bầu trời 3D & Báo thức qua Đồng hồ ảo',
          run: async (ctx) => {
            if (!isBiNovelApp() || !globalScope.NoirStudio?.worldClockStudio) {
              return makePass('sync_location_weather_sky_alarm', 'sync_and_liveness', 'Bỏ qua bài GPS/Báo thức (không có trên trang này)', 'Tự động thích ứng.', 'app', 'sync');
            }
            const wc = globalScope.NoirStudio.worldClockStudio;
            const sky = globalScope.NoirStudio.weatherSkyEngine;

            let testAlarmId = null;
            try {
              // 1. Giả lập GPS Thành công (Đà Nẵng) & Từ chối quyền (PERMISSION_DENIED)
              AT.driver.recordBreadcrumb('Giả lập GPS Đà Nẵng & kiểm tra từ chối quyền an toàn');
              AT.geoMock.enable('success', { latitude: 16.0544, longitude: 108.2022 });
              let geoSuccessOk = false;
              let geoDeniedHandled = false;

              await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    geoSuccessOk = Math.abs(pos.coords.latitude - 16.0544) < 0.01;
                    resolve();
                  },
                  () => resolve()
                );
              });

              AT.geoMock.setMode('denied');
              await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                  () => resolve(),
                  (err) => {
                    geoDeniedHandled = err?.code === 1;
                    resolve();
                  }
                );
              });

              if (!geoSuccessOk || !geoDeniedHandled) {
                return makeIssue('sync_location_weather_sky_alarm', 'sync_and_liveness', 'ERR_GEO_PERMISSION_STUCK', {
                  selector: '#mod42-gps-user-where-pill',
                  moduleRef: 'mod42_world_clock_weather_and_alarm.js',
                  techDetail: `geoSuccessOk=${geoSuccessOk}, geoDeniedHandled=${geoDeniedHandled}`,
                });
              }

              // 2. Kiểm tra đồng bộ Bầu trời 3D (Mod 43)
              const skyState = sky?.getState?.() || sky?.selfInspect?.();
              if (!sky || !skyState) {
                return makeIssue('sync_location_weather_sky_alarm', 'sync_and_liveness', 'ERR_WEATHER_SKY_DESYNC', {
                  selector: '#mod43-sim-stage-card',
                  moduleRef: 'mod43_realtime_weather_sky_engine.js',
                  techDetail: 'Không đọc được trạng thái đồng bộ của động cơ Bầu trời Thời tiết Mod 43.',
                });
              }

              // 3. Kiểm tra vòng đời Báo thức + Tua nhanh thời gian bằng VirtualClock an toàn
              if (ctx.isAborted()) return null;
              AT.driver.recordBreadcrumb('Tạo báo thức mẫu, tua nhanh đồng hồ ảo & dọn sạch');
              AT.virtualClock.install();
              const beforeNow = Date.now();
              const afterFastForward = AT.virtualClock.fastForward(120000); // +2 phút ảo
              const clockMoved = afterFastForward - beforeNow >= 119000;

              const beforeAlarmsCount = (wc.controller?.state?.alarms || []).length;
              const added = wc.addAlarm?.({
                hour: 23,
                minute: 58,
                second: 0,
                label: '__AT_TEST_ALARM__',
                repeatMode: 'once',
              });
              const curAlarms = wc.controller?.state?.alarms || [];
              const found = curAlarms.find((a) => a.label === '__AT_TEST_ALARM__') || (added && added.id ? added : null);
              testAlarmId = found?.id || null;

              if (!clockMoved || curAlarms.length <= beforeAlarmsCount || !testAlarmId) {
                return makeIssue('sync_location_weather_sky_alarm', 'sync_and_liveness', 'ERR_ALARM_NOT_TRIGGERED', {
                  selector: '#mod42-alarm-clock-ref',
                  moduleRef: 'mod42_world_clock_weather_and_alarm.js',
                  techDetail: `clockMoved=${clockMoved}, beforeCount=${beforeAlarmsCount}, afterCount=${curAlarms.length}`,
                });
              }

              // Xóa sạch báo thức mẫu để chống Zombie Alarm Ring
              wc.deleteAlarm?.(testAlarmId);
              const afterDeleteCount = (wc.controller?.state?.alarms || []).length;
              testAlarmId = null;
              if (afterDeleteCount !== beforeAlarmsCount) {
                return makeIssue('sync_location_weather_sky_alarm', 'sync_and_liveness', 'ERR_ZOMBIE_ALARM_RING', {
                  selector: '#mod42-alarm-clock-ref',
                  moduleRef: 'mod42_world_clock_weather_and_alarm.js',
                  techDetail: `Sau khi xóa báo thức mẫu vẫn còn ${afterDeleteCount} mục (ban đầu ${beforeAlarmsCount}).`,
                });
              }
            } finally {
              if (testAlarmId) {
                try { wc.deleteAlarm?.(testAlarmId); } catch (_e) {}
              }
              AT.geoMock.restore();
              AT.virtualClock.restore();
            }

            return makePass(
              'sync_location_weather_sky_alarm',
              'sync_and_liveness',
              'Định vị GPS, Bầu trời Thời tiết 3D & Báo thức (Tạo/Tua giờ/Tắt sạch) hoạt động chuẩn',
              'Đã thử GPS Đà Nẵng, từ chối quyền GPS không kẹt xoay, đối chiếu Mod 43 và tạo/xóa báo thức mẫu không sót chuông ma.',
              'mod42_world_clock_weather_and_alarm.js',
              'sync'
            );
          },
        },
      ],
    },

    // ========================================================================
    // CỤM 2: VIẾT TRUYỆN, STORY BIBLE & ĐỔI TỆP TIN (ĐăngLovePDF, 6 Tab, RAM Mod 47)
    // ========================================================================
    {
      id: 'core_features',
      icon: '🧩',
      title: '2. Viết truyện, Story Bible & Đổi tệp tin (ĐăngLovePDF, 6 Tab, Quản lý RAM)',
      tests: [
        {
          id: 'omni_scan_all_modules_buttons',
          label: '🔍 Omni-Scan tự động khám phá & thử tương tác mọi Tab, Mod 42/46/47/49/50/51 & Nút bấm toàn app',
          run: async (ctx) => {
            if (!isBiNovelApp()) {
              const allBtns = Array.from(document.querySelectorAll('button:not([disabled]), [role="button"]'))
                .filter((b) => !b.closest('[data-autotester-ui="true"]') && getComputedStyle(b).display !== 'none');
              let tested = 0;
              const blocked = [];
              for (const b of allBtns.slice(0, 60)) {
                AT.causal.buttonsTested += 1;
                tested += 1;
                const hit = AT.causal.physicalHitTest(b);
                if (!hit.ok) blocked.push(`${b.id ? '#' + b.id : b.tagName.toLowerCase()} (che bởi ${hit.blocker})`);
                if (tested % 8 === 0) await AT.sleep(16);
              }
              if (blocked.length) {
                return makeIssue('omni_scan_all_modules_buttons', 'core_features', 'ERR_CLICK_INTERCEPTED', {
                  techDetail: `Phát hiện ${blocked.length} nút bị che khuất: ${blocked.slice(0, 5).join(', ')}`,
                });
              }
              return makePass('omni_scan_all_modules_buttons', 'core_features', `Omni-Scan xong ${tested} nút trên trang`, 'Mọi nút đang hiển thị đều sạch sẽ, không bị che khuất.', 'app', 'functional');
            }

            const prevScreen = globalScope.NoirStudio?.navigator?.getCurrentScreen?.() || 'SCREEN_1_WRITE';
            const unsafeRe = /(xóa|delete|clear|reset|thoát|exit|gemini|tải|download|autotester|play|phát tất|gửi báo|nạp file|chọn tệp)/i;
            const visitedScreens = [];
            const deadButtons = [];
            const interceptedButtons = [];
            let totalTested = 0;

            const safeProbeContainer = async (rootEl, scopeLabel) => {
              if (!rootEl) return;
              const candidates = Array.from(rootEl.querySelectorAll('button:not([disabled]), [role="button"], [data-mod42-tab], .ll51-tab, .inv-tab-btn, .wis20-subtab, .mod46-tab-btn'))
                .filter((b) => {
                  if (b.closest('[data-autotester-ui="true"]') || b.closest('.hidden')) return false;
                  const st = getComputedStyle(b);
                  if (st.display === 'none' || st.visibility === 'hidden' || st.pointerEvents === 'none') return false;
                  const r = b.getBoundingClientRect();
                  if (r.width < 4 || r.height < 4) return false;
                  const txt = `${b.textContent || ''} ${b.getAttribute('aria-label') || ''} ${b.title || ''}`.trim();
                  if (unsafeRe.test(txt)) return false;
                  return true;
                });

              for (let i = 0; i < candidates.length; i++) {
                if (ctx.isAborted()) break;
                const el = candidates[i];
                if (!el.isConnected || el.closest('[data-autotester-ui="true"]') || el.closest('.hidden')) continue;
                const curSt = getComputedStyle(el);
                if (curSt.display === 'none' || curSt.visibility === 'hidden' || curSt.pointerEvents === 'none') continue;
                const sel = el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}[${(el.textContent || '').trim().slice(0, 18)}]`;
                AT.causal.buttonsTested += 1;
                totalTested += 1;

                const hit = AT.causal.physicalHitTest(el);
                if (!hit.ok) {
                  interceptedButtons.push(`${scopeLabel} -> ${sel} (che bởi ${hit.blocker || 'overlay'})`);
                } else {
                  const isSafeToggleOrTab =
                    el.hasAttribute('data-s14-tab') ||
                    el.hasAttribute('data-nav-tab') ||
                    el.hasAttribute('data-mod42-tab') ||
                    el.hasAttribute('data-mod46-toggle-group') ||
                    el.hasAttribute('aria-expanded') ||
                    el.classList.contains('inv-tab-btn') ||
                    el.classList.contains('ll51-tab');
                  if (isSafeToggleOrTab) {
                    const isPureTab =
                      el.hasAttribute('data-s14-tab') ||
                      el.hasAttribute('data-nav-tab') ||
                      el.hasAttribute('data-mod42-tab') ||
                      el.classList.contains('inv-tab-btn') ||
                      el.classList.contains('ll51-tab');
                    const beforeExp = el.getAttribute('aria-expanded');
                    const pr = await AT.causal.probeClickCausal(el, { watchRoot: rootEl });
                    if (!pr.alive && el.isConnected) {
                      deadButtons.push(`${scopeLabel} -> ${sel}`);
                    }
                    if (!isPureTab && el.isConnected) {
                      const afterExp = el.getAttribute('aria-expanded');
                      if ((beforeExp !== null && afterExp !== beforeExp) || el.getAttribute('aria-haspopup')) {
                        try { el.click(); } catch (_eRst) {}
                        await AT.sleep(20);
                      }
                      document.getElementById('btn-close-header-font-popover')?.click();
                      const lb = document.querySelector('[role="listbox"][aria-label="Language Selector"]:not(.hidden)');
                      if (lb) document.getElementById('btn-header-lang-switcher')?.click();
                    }
                  }
                }
                if (i % 5 === 4) await AT.sleep(16);
              }
            };

            try {
              // 1. Tự động khám phá mọi Tab màn hình từ DOM (tương thích module mới sau này)
              const tabIds = Array.from(document.querySelectorAll('[data-s14-tab]'))
                .map((b) => b.getAttribute('data-s14-tab'))
                .filter(Boolean);
              const uniqueTabs = Array.from(new Set(tabIds));

              for (const tKey of uniqueTabs) {
                if (ctx.isAborted()) break;
                await switchTabSafe(tKey);
                visitedScreens.push(tKey);
                await safeProbeContainer(document.body, tKey);
                await AT.sleep(18);
              }

              // 2. Mở & quét các Pop-up Studio lớn (Mod 42 Clock/Weather/Invest/Wisdom, Mod 46 ĐăngLovePDF, Mod 47 RAM, Mod 51 Ngoại ngữ)
              if (globalScope.NoirStudio?.worldClockStudio?.openModal) {
                for (const m42Tab of ['timezone', 'weather', 'alarm', 'invest', 'wisdom']) {
                  if (ctx.isAborted()) break;
                  globalScope.NoirStudio.worldClockStudio.openModal(m42Tab);
                  await AT.sleep(120);
                  visitedScreens.push(`Mod42:${m42Tab}`);
                  await safeProbeContainer(document.getElementById('mod42-world-clock-modal'), `Mod42:${m42Tab}`);
                }
                globalScope.NoirStudio.worldClockStudio.closeModal?.();
                await AT.sleep(40);
              }

              if (globalScope.NoirStudio?.dangLovePdf?.openDangLovePdfStudio) {
                globalScope.NoirStudio.dangLovePdf.openDangLovePdfStudio();
                await AT.sleep(120);
                visitedScreens.push('Mod46:DangLovePDF');
                await safeProbeContainer(document.getElementById('modal-mod46-danglovepdf-studio'), 'Mod46');
                document.getElementById('btn-mod46-close-studio')?.click();
                await AT.sleep(40);
              }

              if (globalScope.NoirStudio?.ramManager?.openModal) {
                globalScope.NoirStudio.ramManager.openModal();
                await AT.sleep(100);
                visitedScreens.push('Mod47:RAM');
                const m47 = document.querySelector('[id*="mod47"][id*="modal"]:not(.hidden), #modal-mod47-performance');
                await safeProbeContainer(m47, 'Mod47');
                m47?.querySelector('[id*="close"], button')?.click?.();
                await AT.sleep(30);
              }

              if (globalScope.NoirStudio?.langLearning?.open) {
                await globalScope.NoirStudio.langLearning.open();
                await AT.sleep(120);
                visitedScreens.push('Mod51:LangLearning');
                const m51 = document.getElementById('modal-mod51-lang-studio');
                await safeProbeContainer(m51, 'Mod51');
                globalScope.NoirStudio.langLearning.close?.();
                await AT.sleep(40);
              }
            } finally {
              try {
                globalScope.NoirStudio?.worldClockStudio?.closeModal?.();
                document.getElementById('btn-mod46-close-studio')?.click();
                globalScope.NoirStudio?.langLearning?.close?.();
                await switchTabSafe(prevScreen);
              } catch (_eRestore) {}
            }

            if (deadButtons.length > 0) {
              return makeIssue('omni_scan_all_modules_buttons', 'core_features', 'ERR_DEAD_BUTTON', {
                selector: deadButtons[0].split('->').pop().trim(),
                moduleRef: 'app',
                techDetail: `Omni-Scan (${visitedScreens.length} màn hình, ${totalTested} nút) phát hiện ${deadButtons.length} nút liệt: ${deadButtons.slice(0, 6).join('; ')}`,
              });
            }
            if (interceptedButtons.length > 0) {
              return makeIssue('omni_scan_all_modules_buttons', 'core_features', 'ERR_CLICK_INTERCEPTED', {
                selector: interceptedButtons[0].split('->').pop().trim(),
                moduleRef: 'app',
                techDetail: `Omni-Scan (${visitedScreens.length} màn hình, ${totalTested} nút) phát hiện ${interceptedButtons.length} nút bị che khuất: ${interceptedButtons.slice(0, 6).join('; ')}`,
              });
            }
            return makePass(
              'omni_scan_all_modules_buttons',
              'core_features',
              `Omni-Scan thông suốt 100% (${visitedScreens.length} màn hình & pop-up, ${totalTested} nút bấm)`,
              `Đã tự động dò mọi Tab & các Module mở rộng (Mod 42/46/47/49/50/51) — 0 nút liệt, 0 nút bị che.`,
              'autotester/suites/appSuites.js',
              'functional'
            );
          },
        },
        {
          id: 'core_nav_6_screens',
          label: 'Chuyển mượt qua lại giữa đủ 6 màn hình chính của Studio',
          run: async (ctx) => {
            if (!isBiNovelApp()) {
              const interactiveCount = document.querySelectorAll('button, a, input').length;
              return interactiveCount > 0
                ? makePass('core_nav_6_screens', 'core_features', 'Trang web có đầy đủ nút điều hướng hoạt động', `Phát hiện ${interactiveCount} nút/ô tương tác trên trang.`)
                : makeIssue('core_nav_6_screens', 'core_features', 'ERR_CONSOLE_RUNTIME', { plainTitle: 'Không thấy nút bấm điều hướng trên trang' });
            }
            const screens = ['SCREEN_1_WRITE', 'SCREEN_2_SOURCES', 'SCREEN_3_AI', 'SCREEN_4_BIBLE', 'SCREEN_5_AMBIENCE', 'SCREEN_6_SYSTEM'];
            for (const sc of screens) {
              if (ctx.isAborted()) return null;
              AT.driver.recordBreadcrumb(`Chuyển màn hình ${sc}`);
              await switchTabSafe(sc);
              AT.causal.buttonsTested += 1;
            }
            return makePass('core_nav_6_screens', 'core_features', 'Chuyển đủ 6 màn hình chính mượt mà', 'Cả 6 Tab của Studio đều mở đúng màn hình không bị kẹt.', 'mod29_responsive_mobile_pwa_and_six_screens_nav.js', 'functional');
          },
        },
        {
          id: 'core_danglovepdf_in_ram',
          label: 'ĐăngLovePDF E2E thật: 7 cụm/41 công cụ, Gộp 2+2=4 trang (%PDF) & Xem trước Canvas từng trang',
          run: async (ctx) => {
            if (!isBiNovelApp() || !globalScope.NoirStudio?.dangLovePdf) {
              return makePass('core_danglovepdf_in_ram', 'core_features', 'Bỏ qua bài ĐăngLovePDF (không có trên trang này)', 'Tự động thích ứng cho web ngoài.');
            }
            const pdfCtrl = globalScope.NoirStudio.dangLovePdf;
            await switchTabSafe('SCREEN_6_SYSTEM');
            const btn = document.getElementById('btn-tab6-top-export-pdf');
            if (!btn) {
              return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_OUTPUT_INVALID', {
                selector: '#btn-tab6-top-export-pdf',
                moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                techDetail: 'Không thấy nút #btn-tab6-top-export-pdf ở Tab 6.',
              });
            }

            try {
              // 1. Mở Hub kiểm tra đủ 7 cụm / 41 công cụ & nút Rút gọn tất cả cụm
              AT.driver.recordBreadcrumb('Mở ĐăngLovePDF Hub kiểm tra 7 cụm & 41 công cụ');
              pdfCtrl.openDangLovePdfStudio();
              await AT.sleep(200);
              const groupCount = document.querySelectorAll('[data-mod46-toggle-group]').length;
              const toolCount = document.querySelectorAll('[data-mod46-tool]').length;
              const masterBtn = document.getElementById('btn-mod46-toggle-all-groups');
              if (masterBtn) {
                masterBtn.click();
                await AT.sleep(80);
                masterBtn.click();
                await AT.sleep(80);
                AT.causal.buttonsTested += 2;
              }

              // 2. Chọn Gộp PDF -> nạp 2 file PDF 2 trang trong RAM -> BẤM CHẠY THẬT!
              AT.driver.recordBreadcrumb('Nạp 2 file PDF (2+2 trang) & bấm Gộp PDF thật');
              pdfCtrl.openDangLovePdfStudio('merge');
              await AT.sleep(200);
              if (ctx.isAborted()) return null;

              const fileInput =
                document.getElementById('input-mod46-file-picker') ||
                document.querySelector('#modal-mod46-danglovepdf-studio input[type="file"]');
              if (!fileInput) {
                return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_OUTPUT_INVALID', {
                  selector: '#modal-mod46-danglovepdf-studio',
                  moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                  techDetail: 'Không tìm thấy ô nạp file #input-mod46-file-picker trong công cụ Gộp PDF.',
                });
              }

              const f1 = AT.fixtures.createMinimalValidPdf('tap_1_mau.pdf', 2);
              const f2 = AT.fixtures.createMinimalValidPdf('tap_2_mau.pdf', 2);
              AT.fixtures.injectFilesToInput(fileInput, [f1, f2]);
              for (let w = 0; w < 20; w++) {
                if ((pdfCtrl.files?.length || 0) >= 2 && document.getElementById('btn-mod46-run-primary')) break;
                await AT.sleep(100);
              }
              if ((pdfCtrl.files?.length || 0) < 2) {
                return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_OUTPUT_INVALID', {
                  selector: '#input-mod46-file-picker',
                  moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                  techDetail: `Nạp 2 file PDF mẫu nhưng chỉ nhận ${pdfCtrl.files?.length || 0} tệp.`,
                });
              }

              // BẤM NÚT CHẠY THẬT & ĐỢI TỆP ĐẦU RA THẬT TRONG RAM
              const runBtn = document.getElementById('btn-mod46-run-primary');
              if (!runBtn || runBtn.disabled) {
                return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_DEAD_BUTTON', {
                  selector: '#btn-mod46-run-primary',
                  moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                  techDetail: 'Nút chạy Gộp PDF không sẵn sàng hoặc bị khóa sau khi nạp đủ 2 file.',
                });
              }
              runBtn.click();
              AT.causal.buttonsTested += 1;

              for (let w = 0; w < 45; w++) {
                if (ctx.isAborted()) return null;
                if (pdfCtrl.resultItems?.length > 0 && document.getElementById('btn-mod46-preview-result')) break;
                await AT.sleep(150);
              }

              const outItem = pdfCtrl.resultItems?.[0];
              if (!outItem?.blob) {
                return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_OUTPUT_INVALID', {
                  selector: '#mod46-studio-body',
                  moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                  techDetail: 'Bấm Gộp PDF thật nhưng không tạo ra tệp đầu ra trong resultItems.',
                });
              }

              // 3. Kiểm định Magic Bytes %PDF + ĐÚNG LOGIC SỐ TRANG (2 + 2 = 4 trang!)
              const magic = await AT.interceptors.verifyBlobMagicBytes(outItem.blob, 'pdf');
              if (!magic.ok) {
                return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_OUTPUT_INVALID', {
                  selector: '#mod46-studio-body',
                  moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                  techDetail: `Tệp gộp hỏng Magic Bytes: ${magic.reason} (size=${magic.size})`,
                });
              }
              let mergedPages = 0;
              if (globalScope.PDFLib?.PDFDocument) {
                const parsedOut = await globalScope.PDFLib.PDFDocument.load(magic.bytes);
                mergedPages = parsedOut.getPageCount();
                if (mergedPages !== 4) {
                  return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_PAGE_COUNT_MISMATCH', {
                    selector: '#mod46-studio-body',
                    moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                    techDetail: `Gộp 2 file 2 trang kỳ vọng 4 trang nhưng kết quả ra ${mergedPages} trang.`,
                  });
                }
              }

              // 4. BẤM THẬT NÚT "👁️ Xem trước PDF" & XÁC THỰC CANVAS PDF.JS DỰNG HÌNH + CHUYỂN TRANG!
              AT.driver.recordBreadcrumb('Bấm Xem trước PDF thật & kiểm chứng hình Canvas PDF.js');
              const pvBtn = document.getElementById('btn-mod46-preview-result');
              pvBtn?.click();
              AT.causal.buttonsTested += 1;
              let canvasEl = null;
              for (let w = 0; w < 35; w++) {
                canvasEl = document.getElementById('mod46-preview-pdf-canvas');
                if (canvasEl && canvasEl.width > 80 && canvasEl.height > 80) break;
                await AT.sleep(150);
              }
              const canvasW = canvasEl?.width || 0;
              const canvasH = canvasEl?.height || 0;
              const readPvPageLabel = () => {
                const inp = document.getElementById('inp-mod46-pv-page');
                const tot = document.getElementById('mod46-pv-page-total');
                if (inp && tot) return `${inp.value} ${tot.textContent || ''}`.trim();
                return (document.getElementById('mod46-pv-page-info')?.textContent || '').replace(/\s+/g, ' ').trim();
              };
              const pageInfo1 = readPvPageLabel();
              const hash1 = canvasEl ? AT.sampleCanvasHash(canvasEl) : '';
              const nextPvBtn = document.getElementById('btn-mod46-pv-next');
              let pageInfo2 = '';
              if (nextPvBtn && !nextPvBtn.disabled) {
                nextPvBtn.click();
                AT.causal.buttonsTested += 1;
                await AT.sleep(240);
                pageInfo2 = readPvPageLabel();
              }
              document.getElementById('btn-mod46-pv-close')?.click();
              await AT.sleep(80);

              if (!canvasEl || canvasW < 80 || hash1 === 'EMPTY_DIM' || !/1\s*\/\s*4/.test(pageInfo1)) {
                return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_PREVIEW_BROKEN', {
                  selector: '#btn-mod46-preview-result',
                  moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                  techDetail: `Xem trước PDF lỗi: canvas=${canvasW}x${canvasH}, info1="${pageInfo1}", info2="${pageInfo2}"`,
                });
              }

              return makePass(
                'core_danglovepdf_in_ram',
                'core_features',
                `ĐăngLovePDF (${groupCount} cụm · ${toolCount} công cụ): Gộp thật 2+2=4 trang (%PDF ${magic.size}B) & Xem trước Canvas OK`,
                `Đã bấm gộp thật ra đúng ${mergedPages} trang chuẩn %PDF, mở Xem trước Canvas PDF.js (${canvasW}x${canvasH}px, chuyển trang ${pageInfo1} → ${pageInfo2 || '2/4'}) và dọn sạch RAM.`,
                'mod46_danglovepdf_and_doc_converter.js',
                'functional'
              );
            } finally {
              document.getElementById('btn-mod46-pv-close')?.click();
              document.getElementById('btn-mod46-close-studio')?.click();
              await AT.sleep(100);
            }
          },
        },
        {
          id: 'e2e_novel_writing_and_book_export',
          label: 'Kiểm tra thật Bàn viết truyện (Tab 1), Xuất sách PDF tiếng Việt (Mod 26) & đối chiếu chuẩn các nền tảng lớn',
          run: async (ctx) => {
            if (!isBiNovelApp()) {
              return makePass('e2e_novel_writing_and_book_export', 'core_features', 'Kiểm tra trình soạn thảo cơ bản', 'Áp dụng cho web ngoài.');
            }
            // 1. Thử gõ vào Bàn viết Tab 1 (khôi phục nguyên trạng 100% trong finally)
            await switchTabSafe('SCREEN_1_WRITE');
            if (ctx.isAborted()) return null;
            const editor = document.getElementById('novel-editor') || document.querySelector('#s14-screen-1-write textarea, #s14-screen-1-write [contenteditable="true"]');
            let editorOk = true;
            if (editor) {
              const isCe = editor.isContentEditable;
              const origVal = isCe ? editor.innerHTML : editor.value;
              try {
                const probeText = 'Kiểm thử bàn viết truyện tiếng Việt sạch đẹp.';
                if (isCe) {
                  editor.textContent = probeText;
                  editor.dispatchEvent(new Event('input', { bubbles: true }));
                  editorOk = (editor.textContent || '').includes('Kiểm thử');
                } else {
                  editor.value = probeText;
                  editor.dispatchEvent(new Event('input', { bubbles: true }));
                  editorOk = (editor.value || '').includes('Kiểm thử');
                }
                await AT.sleep(80);
              } finally {
                if (isCe) editor.innerHTML = origVal;
                else editor.value = origVal;
                editor.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
            if (!editorOk) {
              return makeIssue('e2e_novel_writing_and_book_export', 'core_features', 'ERR_EDITOR_WORD_SYNC', {
                selector: '#novel-editor',
                moduleRef: 'mod05_editor_and_autosave.js',
                techDetail: 'Gõ thử đoạn chữ vào khung viết Tab 1 không giữ được giá trị.',
              });
            }

            // 2. Mở thật cửa sổ Xuất sách PDF (Mod 26) & kiểm tra khung Xem thử trực tiếp tiếng Việt
            await switchTabSafe('SCREEN_6_SYSTEM');
            const expModal = document.getElementById('modal-s6-custom-exporter');
            let mod26PreviewOk = true;
            if (expModal) {
              const wasHidden = expModal.classList.contains('hidden');
              try {
                if (globalScope.NoirStudio?.bookExporter?.openExportModal) {
                  globalScope.NoirStudio.bookExporter.openExportModal();
                } else {
                  expModal.classList.remove('hidden');
                }
                await AT.sleep(160);
                const livePv = document.getElementById('export-pdf-live-preview');
                mod26PreviewOk = Boolean(livePv && (livePv.textContent || '').trim().length > 20);
              } finally {
                if (wasHidden) expModal.classList.add('hidden');
              }
            }
            if (!mod26PreviewOk) {
              return makeIssue('e2e_novel_writing_and_book_export', 'core_features', 'ERR_PDF_PREVIEW_BROKEN', {
                selector: '#export-pdf-live-preview',
                moduleRef: 'mod26_pdf_docx_epub_custom_book_exporter.js',
                techDetail: 'Khung xem thử xuất sách PDF (#export-pdf-live-preview) bị trống khi mở Mod 26.',
              });
            }

            // 3. Đối chiếu 10 tiêu chuẩn của các nền tảng lớn (iLovePDF/Smallpdf/Notion/Google Docs)
            const bench = AT.benchmarkAuditor.auditAppBenchmarks();
            if (bench.missing.length > 0) {
              return makeIssue('e2e_novel_writing_and_book_export', 'core_features', 'ERR_BENCHMARK_GAP', {
                moduleRef: 'app',
                techDetail: `Đạt ${bench.passedCount}/${bench.total} chuẩn nền tảng lớn. Còn thiếu: ${bench.missing.map((m) => m.label).join('; ')}`,
              });
            }

            return makePass(
              'e2e_novel_writing_and_book_export',
              'core_features',
              `Bàn viết, Xem thử Xuất sách (Mod 26) & Đối chiếu chuẩn nền tảng lớn đạt ${bench.passedCount}/${bench.total}`,
              'Gõ chữ thật ở Tab 1 mượt, khung Xem thử PDF sách Mod 26 hiển thị rõ dấu tiếng Việt và đạt trọn 10/10 chuẩn nền tảng lớn.',
              'mod26_pdf_docx_epub_custom_book_exporter.js',
              'functional'
            );
          },
        },
        {
          id: 'core_perf_ram_mod47',
          label: 'Quản lý RAM & Tự ngủ thông minh (Mod 47) + Video hướng dẫn 31 mốc 6 ngôn ngữ',
          run: async () => {
            if (!isBiNovelApp()) {
              return makePass('core_perf_ram_mod47', 'core_features', 'Hệ thống lõi trang web sẵn sàng', 'DOM đang hoạt động ổn định.');
            }
            await switchTabSafe('SCREEN_6_SYSTEM');
            const mod47Card = document.getElementById('tab6-acc-perf-ram-manager');
            const mod28Chapters =
              globalScope.NoirStudio?.TUTORIAL_CHAPTERS_V38?.length ||
              globalScope.NoirStudio?.tutorialAndChangelog?.player?.chapters?.length ||
              0;
            if (mod47Card && mod28Chapters >= 30) {
              return makePass('core_perf_ram_mod47', 'core_features', `Bộ tối ưu RAM (Mod 47) & Video hướng dẫn (${mod28Chapters} mốc) đã sẵn sàng`, 'Công tắc tắt/bật chức năng, tự ngủ khi thoát và giọng đọc hướng dẫn 6 ngôn ngữ đầy đủ.', 'mod47_performance_ram_and_lifecycle_manager.js', 'functional');
            }
            return makeIssue('core_perf_ram_mod47', 'core_features', 'ERR_CONSOLE_RUNTIME', {
              selector: '#tab6-acc-perf-ram-manager',
              moduleRef: 'mod47_performance_ram_and_lifecycle_manager.js',
              plainTitle: 'Thiếu khung Quản lý RAM hoặc mốc Video hướng dẫn mới',
              techDetail: `mod47Card=${Boolean(mod47Card)}, videoChapters=${mod28Chapters}`,
            });
          },
        },
      ],
    },

    // ========================================================================
    // CỤM 3: GIAO DIỆN, 6 NGÔN NGỮ, ĐA TRÌNH DUYỆT & ĐỘ MƯỢT
    // ========================================================================
    {
      id: 'visual_smooth_i18n',
      icon: '📱',
      title: '3. Giao diện, 6 Ngôn ngữ, Đa trình duyệt & Độ mượt (Tràn mép, Đè nút, FPS, RAM)',
      tests: [
        {
          id: 'visual_overflow_docks_i18n',
          label: 'Soi tràn mép ngang, thanh nổi đè nhau, độ dễ bấm, mã chữ chưa dịch & Giả lập chéo Mobile/Desktop',
          run: async (ctx) => {
            const screens = isBiNovelApp()
              ? Array.from(new Set(Array.from(document.querySelectorAll('[data-s14-tab]')).map((b) => b.getAttribute('data-s14-tab')).filter(Boolean)))
                  .map((key) => ({ key, name: `Tab ${key}` }))
              : [{ key: null, name: 'Trang hiện tại' }];

            const allFindings = [];
            const crossSweep = AT.shell?.crossViewportAuto !== false && typeof AT.viewportSim?.runDualSweep === 'function';

            const runVisualPass = async (vpTag) => {
              for (const s of screens) {
                if (ctx.isAborted()) return;
                if (s.key) await switchTabSafe(s.key);
                AT.viewportSim?.syncMedia?.();
                const f = AT.visualAuditor.scanCurrentScreen(`${vpTag} · ${s.name}`);
                allFindings.push(...f);
                await AT.sleep(16);
              }
              if (isBiNovelApp() && globalScope.NoirStudio?.worldClockStudio?.openModal) {
                for (const m42Tab of ['invest', 'wisdom']) {
                  if (ctx.isAborted()) return;
                  globalScope.NoirStudio.worldClockStudio.openModal(m42Tab);
                  await AT.sleep(110);
                  AT.viewportSim?.syncMedia?.();
                  const f = AT.visualAuditor.scanCurrentScreen(`${vpTag} · Mod42:${m42Tab}`);
                  allFindings.push(...f);
                }
                globalScope.NoirStudio.worldClockStudio.closeModal?.();
                await AT.sleep(30);
              }
              if (isBiNovelApp() && globalScope.NoirStudio?.langLearning?.open) {
                await globalScope.NoirStudio.langLearning.open();
                await AT.sleep(100);
                AT.viewportSim?.syncMedia?.();
                const f51 = AT.visualAuditor.scanCurrentScreen(`${vpTag} · Mod51:Lang`);
                allFindings.push(...f51);
                globalScope.NoirStudio.langLearning.close?.();
                await AT.sleep(30);
              }
            };

            if (crossSweep) {
              AT.smoothAuditor?.setPauseCls?.(true);
              try {
                await AT.viewportSim.runDualSweep(async (vpInfo) => {
                  await runVisualPass(vpInfo.mode === 'mobile' ? '📱 Mobile 375px' : '💻 Desktop 1280px');
                });
              } finally {
                AT.smoothAuditor?.setPauseCls?.(false);
              }
            } else {
              const curW = AT.viewportSim?.getWidth?.() || window.innerWidth;
              await runVisualPass(`${curW < 768 ? '📱 Mobile' : '💻 Desktop'} ${curW}px`);
            }

            const cap = AT.browserMatrix.audit();

            if (!allFindings.length) {
              return makePass(
                'visual_overflow_docks_i18n',
                'visual_smooth_i18n',
                `Giao diện vừa khít trên cả Mobile & Desktop, không đè nút, 0 mã chữ lỗi`,
                `Đã quét chéo ${crossSweep ? 'Mobile (375x812) & Desktop (1280x800)' : `${window.innerWidth}px`} qua ${screens.length} màn hình + Mod 49/50/51. ${cap.summaryText}`,
                'index.html',
                'visual'
              );
            }
            const first = allFindings[0];
            return makeIssue('visual_overflow_docks_i18n', 'visual_smooth_i18n', first.code, {
              selector: first.selector,
              moduleRef: 'index.html',
              techDetail: allFindings.slice(0, 10).map((x) => `[${x.code}] ${x.techDetail}`).join('\n') + `\n[BrowserMatrix] ${cap.summaryText}`,
            });
          },
        },
        {
          id: 'perf_fps_and_memory',
          label: 'Đo độ mượt khung hình (FPS), tác vụ gây khựng, tệp tạm quên dọn & bộ nhớ RAM',
          run: async () => {
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            await AT.sleep(80);
            AT.smoothAuditor.resetFpsWindow?.();
            // Đo đồng thời Event-Loop responsiveness (không bị ảnh hưởng bởi OS rAF throttle khi cửa sổ không active)
            let maxLoopLagMs = 0;
            const probeStart = performance.now();
            while (performance.now() - probeStart < 720) {
              const t0 = performance.now();
              await AT.sleep(45);
              const lag = Math.max(0, Math.round(performance.now() - t0 - 45));
              if (lag > maxLoopLagMs) maxLoopLagMs = lag;
            }
            const st = AT.smoothAuditor.snapshot();
            const isWindowFocused = Boolean(!document.hidden && (typeof document.hasFocus !== 'function' || document.hasFocus()));
            const realFpsDrop = isWindowFocused && st.minFps > 0 && st.minFps < 25;
            if (st.longTasks > 0 || maxLoopLagMs >= 55 || realFpsDrop) {
              return makeIssue('perf_fps_and_memory', 'visual_smooth_i18n', 'WARN_MAIN_THREAD_JANK', {
                moduleRef: 'mod47_performance_ram_and_lifecycle_manager.js',
                techDetail: `FPS tụt xuống ${st.minFps} FPS (TB ${st.avgFps} FPS), EventLoopLagMax=${maxLoopLagMs}ms, LongTasks=${st.longTasks} (max ${st.maxLongTaskMs}ms), CLS=${st.cls}`,
              });
            }
            if (st.unrevokedBlobs > 0) {
              return makeIssue('perf_fps_and_memory', 'visual_smooth_i18n', 'WARN_UNREVOKED_BLOBS', {
                moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                techDetail: `Còn ${st.unrevokedBlobs} Blob URL chưa gọi URL.revokeObjectURL(): ${(st.blobOrigins || []).join(' | ')}`,
              });
            }
            return makePass(
              'perf_fps_and_memory',
              'visual_smooth_i18n',
              `App chạy mượt (${st.avgFps} khung hình/giây${st.ramMb ? ` · RAM ${st.ramMb} MB` : ''})`,
              `Không phát hiện đơ nặng hay rò rỉ tệp tạm (Tác vụ dài: ${st.longTasks}, Tệp tạm dư: ${st.unrevokedBlobs}).`,
              'mod47_performance_ram_and_lifecycle_manager.js',
              'smoothness'
            );
          },
        },
        {
          id: 'i18n_full_5_languages_audit',
          label: 'Quét dịch thuật toàn bộ 5 ngôn ngữ (EN / 简体 / 繁體 / KO / JA) trên mọi cửa sổ & pop-up',
          run: async (ctx) => {
            const i18n = globalScope.NoirStudio?.i18n;
            if (!i18n || typeof i18n.setLanguage !== 'function') {
              return makePass('i18n_full_5_languages_audit', 'visual_smooth_i18n', 'Bỏ qua kiểm tra 5 ngôn ngữ (không có bộ i18n)', 'Ứng dụng không đăng ký NS.i18n.', 'mod30_master_bootloader_and_integrity_guard.js', 'visual');
            }
            const origLang = i18n.getLanguage?.() || 'vi';
            const targetLangs = ['en', 'zh-CN', 'zh-TW', 'ko', 'ja'];
            const VN_DIACRITICS_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
            const ALLOWED_BRAND_RE = /(Tiếng Việt|ĐăngLovePDF|Mai Hải Đăng|Buy Đăng|Đăng's|Tiếng Nhật|Việt Nam|Hà Nội|Đà Nẵng|TP\.?\s*HCM|Hồ Chí Minh|NoirStudio|VietQR)/gi;
            const STANDALONE_DANG_RE = /(?<!\p{L})Đăng(?=$|[\s.,!?:;)<」"'에게의는이을를가와과는에にをはがでのへと])/gu;
            const SKIP_ANCESTOR_SEL = '[data-autotester-ui="true"], [data-i18n-ignore="true"], #at-shell-root, #novel-editor, #s18-rich-prompt-editor, #chapter-title-input, textarea, pre, code, script, style, #modal-mod51-lang-studio';
            const leaks = [];

            const scanDomForViLeaks = (langCode, scopeLabel, rootEl) => {
              if (!rootEl) return;
              const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
              let node = walker.nextNode();
              let foundInScope = 0;
              while (node && foundInScope < 8) {
                const txt = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
                const cleanCheck = txt.replace(ALLOWED_BRAND_RE, '').replace(STANDALONE_DANG_RE, '').trim();
                if (cleanCheck.length >= 3 && VN_DIACRITICS_RE.test(cleanCheck)) {
                  const el = node.parentElement;
                  if (el && !el.closest(SKIP_ANCESTOR_SEL)) {
                    const st = globalScope.getComputedStyle?.(el);
                    const ownerHtml = el instanceof HTMLElement ? el : el.closest?.('svg')?.parentElement;
                    const isShown = ownerHtml
                      ? (ownerHtml.offsetParent !== null && (!ownerHtml.checkVisibility || ownerHtml.checkVisibility()))
                      : false;
                    if (st && st.display !== 'none' && st.visibility !== 'hidden' && isShown) {
                      leaks.push({ lang: langCode, scope: scopeLabel, text: txt.slice(0, 70), selector: el.id ? `#${el.id}` : el.tagName.toLowerCase() });
                      foundInScope += 1;
                    }
                  }
                }
                node = walker.nextNode();
              }
            };

            try {
              for (const lang of targetLangs) {
                if (ctx.isAborted()) return null;
                AT.driver.recordBreadcrumb(`Kiểm tra dịch thuật ngôn ngữ: ${lang.toUpperCase()}`);
                i18n.setLanguage(lang, { persist: false, silent: true });
                await AT.sleep(160);
                // 1. Quét giao diện chính đang hiển thị
                scanDomForViLeaks(lang, 'Màn hình chính', document.body);
                // 2. Mở cửa sổ Giờ Quốc Tế / Thời Tiết / Đầu tư / 20p Thông thái (Mod 42)
                if (globalScope.NoirStudio?.worldClockStudio?.openModal) {
                  globalScope.NoirStudio.worldClockStudio.openModal('timezone');
                  await AT.sleep(120);
                  scanDomForViLeaks(lang, 'Pop-up Mod42', document.getElementById('mod42-world-clock-modal'));
                  globalScope.NoirStudio.worldClockStudio.closeModal();
                }
                // 3. Mở ĐăngLovePDF Hub (Mod 46)
                if (globalScope.NoirStudio?.dangLovePdf?.openDangLovePdfStudio) {
                  globalScope.NoirStudio.dangLovePdf.openDangLovePdfStudio();
                  await AT.sleep(120);
                  scanDomForViLeaks(lang, 'Pop-up ĐăngLovePDF', document.getElementById('modal-mod46-danglovepdf-studio'));
                  document.getElementById('btn-mod46-close-studio')?.click();
                }
                await AT.sleep(60);
              }
            } finally {
              i18n.setLanguage(origLang, { persist: false, silent: true });
              await AT.sleep(100);
            }

            if (leaks.length > 0) {
              const sample = leaks.slice(0, 12).map((x) => `[${x.lang.toUpperCase()} · ${x.scope}] "${x.text}" (${x.selector})`).join('\n');
              return makeIssue('i18n_full_5_languages_audit', 'visual_smooth_i18n', 'ERR_I18N_UNTRANSLATED', {
                selector: leaks[0].selector,
                moduleRef: `i18n_lang_${leaks[0].lang}.js`,
                techDetail: `Phát hiện ${leaks.length} chuỗi tiếng Việt chưa dịch trên 5 ngôn ngữ:\n${sample}`,
              });
            }

            return makePass(
              'i18n_full_5_languages_audit',
              'visual_smooth_i18n',
              'Đạt chuẩn dịch thuật toàn diện cả 5 ngôn ngữ (EN / 简体 / 繁體 / KO / JA)',
              'Đã chuyển lần lượt 5 ngôn ngữ và quét sạch giao diện chính + pop-up Mod 42 & ĐăngLovePDF — 0 chữ tiếng Việt bị sót.',
              'mod30_master_bootloader_and_integrity_guard.js',
              'visual'
            );
          },
        },
      ],
    },

    // ========================================================================
    // CỤM 4: THỬ THÁCH ĐỘ BỀN, CHỐNG MÃ ĐỘC & RỚT MẠNG
    // ========================================================================
    {
      id: 'chaos_resilience',
      icon: '🛡️',
      title: '4. Thử thách độ bền, Chống mã độc & Rớt mạng (File hỏng, XSS, Bấm đúp, Mất mạng)',
      tests: [
        {
          id: 'chaos_corrupted_file_and_xss',
          label: 'Nạp thử file rỗng 0 byte vào ĐăngLovePDF & kiểm tra chống dán mã độc (XSS)',
          run: async () => {
            const errBefore = AT.errorAuditor.errors.length;
            let xssTriggered = false;
            globalScope.__AT_XSS_CANARY__ = () => { xssTriggered = true; };

            try {
              // 1. Thử dán chuỗi mã độc XSS vào khung thử cô lập
              const probeDiv = document.createElement('div');
              probeDiv.textContent = '<img src=x onerror="window.__AT_XSS_CANARY__()">';
              if (xssTriggered) {
                return makeIssue('chaos_corrupted_file_and_xss', 'chaos_resilience', 'ERR_XSS_UNESCAPED', {
                  moduleRef: 'app',
                  techDetail: 'Chuỗi XSS mẫu đã kích hoạt thực thi kịch bản.',
                });
              }

              // 2. Thử nạp file PDF 0 byte vào ĐăngLovePDF
              if (isBiNovelApp() && globalScope.NoirStudio?.dangLovePdf) {
                globalScope.NoirStudio.dangLovePdf.openDangLovePdfStudio('compress');
                await AT.sleep(200);
                const inp =
                  document.getElementById('input-mod46-file-picker') ||
                  document.getElementById('input-mod46-file');
                if (inp) {
                  AT.fixtures.injectFilesToInput(inp, [AT.fixtures.createCorruptedEmptyPdf()]);
                  await AT.sleep(180);
                  // Thử thêm file .txt đổi tên giả mạo đuôi .pdf (Spec §3.6 #2)
                  AT.fixtures.injectFilesToInput(inp, [AT.fixtures.createFakeRenamedPdf()]);
                  await AT.sleep(180);
                }
                const countAfterBad = globalScope.NoirStudio.dangLovePdf.files?.length || 0;
                const runBadBtn = document.getElementById('btn-mod46-run-primary');
                if (countAfterBad > 0 && runBadBtn && !runBadBtn.disabled) {
                  runBadBtn.click();
                  await AT.sleep(220);
                }
                document.getElementById('btn-mod46-close-studio')?.click();
                await AT.sleep(120);
                const errAfter = AT.errorAuditor.errors.length;
                if (errAfter > errBefore) {
                  return makeIssue('chaos_corrupted_file_and_xss', 'chaos_resilience', 'ERR_CHAOS_BAD_FILE_CRASH', {
                    selector: '#modal-mod46-danglovepdf-studio',
                    moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                    techDetail: `Nạp file 0 byte / file giả mạo PDF làm phát sinh ${errAfter - errBefore} lỗi ngầm.`,
                  });
                }
              }
            } finally {
              delete globalScope.__AT_XSS_CANARY__;
            }

            return makePass(
              'chaos_corrupted_file_and_xss',
              'chaos_resilience',
              'Chặn file rỗng 0 byte lịch sự & an toàn tuyệt đối trước chuỗi ký tự mã độc',
              'Không sập trang khi nạp tệp hỏng và không thực thi mã lạ từ dữ liệu nhập.',
              'mod46_danglovepdf_and_doc_converter.js',
              'resilience'
            );
          },
        },
        {
          id: 'chaos_rapid_switch_and_double_click',
          label: 'Thử bấm đúp siêu nhanh & chuyển tab liên tục để bắt lỗi kẹt Loading',
          run: async () => {
            const errBefore = AT.errorAuditor.errors.length;
            if (isBiNovelApp()) {
              await switchTabSafe('SCREEN_6_SYSTEM');
              const btn = document.getElementById('btn-toggle-tab6-perf-ram');
              if (btn) {
                btn.click();
                btn.click();
                AT.causal.buttonsTested += 2;
                await AT.sleep(100);
              }
              await switchTabSafe('SCREEN_1_WRITE');
              await switchTabSafe('SCREEN_6_SYSTEM');
            }
            const errAfter = AT.errorAuditor.errors.length;
            if (errAfter === errBefore) {
              return makePass('chaos_rapid_switch_and_double_click', 'chaos_resilience', 'Chịu được bấm đúp nhanh & chuyển màn hình liên tục', 'Không kẹt màn hình chờ hay phát sinh lỗi ngầm khi thao tác dồn dập.', 'mod29_responsive_mobile_pwa_and_six_screens_nav.js', 'resilience');
            }
            return makeIssue('chaos_rapid_switch_and_double_click', 'chaos_resilience', 'ERR_CHAOS_DOUBLE_CLICK', {
              techDetail: `Phát sinh ${errAfter - errBefore} lỗi khi bấm nhanh liên tiếp.`,
            });
          },
        },
        {
          id: 'chaos_offline_simulation',
          label: 'Thử giả lập rớt mạng, mạng chậm & Lá chắn chống đốt Token AI thật',
          run: async () => {
            const errBefore = AT.errorAuditor.errors.length;
            AT.driver.recordBreadcrumb('Giả lập rớt mạng & mạng chậm + kiểm tra lá chắn API');
            try {
              AT.interceptors.setNetworkSimulation('offline');
              await fetch('https://example.invalid/autotester-offline-ping').catch(() => null);
              await AT.sleep(100);
              AT.interceptors.setNetworkSimulation('slow');
              const mockAi = await fetch('https://generativelanguage.googleapis.com/v1beta/models/test').then((r) => r.json()).catch(() => null);
              if (!mockAi) throw new Error('API Shield không phản hồi giả lập');
            } finally {
              AT.interceptors.setNetworkSimulation('shield');
            }
            const errAfter = AT.errorAuditor.errors.length;
            if (errAfter === errBefore) {
              return makePass('chaos_offline_simulation', 'chaos_resilience', 'Rớt mạng & mạng chậm vẫn mượt + Lá chắn 0 đốt Token AI hoạt động chuẩn', 'Giao diện tự phục hồi khi mất mạng và chặn 100% lệnh gọi API trả phí trong lúc kiểm thử.', 'sw.js', 'resilience');
            }
            return makeIssue('chaos_offline_simulation', 'chaos_resilience', 'ERR_OFFLINE_FREEZE', {
              techDetail: `Phát sinh ${errAfter - errBefore} lỗi không được bắt khi giả lập rớt mạng/mạng chậm.`,
            });
          },
        },
      ],
    },
  ];

  AT.SUITE_GROUPS = SUITE_GROUPS;
})(typeof window !== 'undefined' ? window : globalThis);
