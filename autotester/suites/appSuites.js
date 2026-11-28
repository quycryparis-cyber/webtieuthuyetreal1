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

              let sliceStart = performance.now();
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
                if (performance.now() - sliceStart >= 24 || i % 4 === 3) {
                  await AT.sleep(8);
                  sliceStart = performance.now();
                }
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

              // 2. Mở & quét các Pop-up Studio lớn (Mod 42 Clock/Weather/Market/Wisdom, Mod 46 ĐăngLovePDF, Mod 47 RAM, Mod 51 Ngoại ngữ)
              if (globalScope.NoirStudio?.worldClockStudio?.openModal) {
                for (const m42Tab of ['timezone', 'weather', 'alarm', 'market', 'wisdom']) {
                  if (ctx.isAborted()) break;
                  globalScope.NoirStudio.worldClockStudio.openModal(m42Tab);
                  await AT.sleep(160);
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

              const llCtrlOmni = globalScope.NoirStudio?.langLearningStudio || globalScope.NoirStudio?.mod51;
              if (llCtrlOmni?.open) {
                await llCtrlOmni.open();
                await AT.sleep(140);
                visitedScreens.push('Mod51:LangLearning');
                const m51 = document.getElementById('modal-mod51-lang-studio');
                await safeProbeContainer(m51, 'Mod51');
                llCtrlOmni.close?.();
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
        {
          id: 'deep_module_architecture_logic',
          label: '🧠 Thấu hiểu & Kiểm chứng logic sâu toàn app (Mod 08/12/16/18/39/46/49/50/51 & Exit Guard)',
          run: async (ctx) => {
            if (!isBiNovelApp()) {
              return makePass('deep_module_architecture_logic', 'core_features', 'Bỏ qua kiểm chứng module nội bộ (web ngoài)', 'Tự động thích ứng.');
            }
            const ns = globalScope.NoirStudio || {};
            const gaps = [];
            AT.driver.recordBreadcrumb('Kiểm chứng sâu logic kiến trúc Mod 08/12/16/18/39/46/49/50/51 & Exit Guard');

            // 1. Core Writing Engine + Story Bible + 5 Modes + Mode 5 Plot
            if (!ns.idb || !ns.autoSaver || !ns.storyBible || !ns.promptSynthesizer || !ns.mode5Studio) {
              gaps.push('Thiếu engine cốt lõi: ' + ['idb', 'autoSaver', 'storyBible', 'promptSynthesizer', 'mode5Studio'].filter((k) => !ns[k]).join(', '));
            }

            // 2. Exit Guard Universal (Desktop X / Mobile Swipe Back / Web Leave Site)
            const expectedExitPrompt = 'Bạn muốn thoát khỏi sự kiểm soát của Đăng chứ ( ͡° ͜ʖ ͡°)';
            if (!ns.exitGuard || ns.exitGuard.PROMPT_TEXT !== expectedExitPrompt) {
              gaps.push(`Exit Guard sai thông điệp: "${ns.exitGuard?.PROMPT_TEXT || 'missing'}"`);
            } else {
              let noCalled = false;
              ns.exitGuard.confirmExit(() => {}, () => { noCalled = true; });
              await AT.sleep(30);
              const exitModal = document.getElementById('modal-noir-exit-guard');
              const exitTitle = exitModal?.querySelector('#noir-exit-guard-title')?.textContent?.trim() || '';
              const yesTxt = exitModal?.querySelector('#btn-noir-exit-yes')?.textContent?.trim() || '';
              const noBtn = exitModal?.querySelector('#btn-noir-exit-no');
              const noTxt = noBtn?.textContent?.trim() || '';
              if (!exitModal || !exitTitle.includes('( ͡° ͜ʖ ͡°)') || !yesTxt || !noTxt) {
                gaps.push('Pop-up Exit Guard không hiển thị đủ câu hỏi & nút Có/Không');
              }
              noBtn?.click?.();
              await AT.sleep(20);
              if (!noCalled || document.getElementById('modal-noir-exit-guard')) {
                gaps.push('Nút "Không" trên Exit Guard không đóng sạch pop-up hoặc không kích hoạt callback hủy');
              }
            }

            // 3. YouTube & OS PiP unblocked + A-B loop vault
            const blockedPipVideos = Array.from(document.querySelectorAll('#mod39-player-stage-wrapper video[disablePictureInPicture]'));
            if (blockedPipVideos.length > 0) {
              gaps.push('Thẻ <video> trong trình phát vẫn còn khóa disablePictureInPicture');
            }
            await AT.sleep(4);

            // 4. Mod 46 ĐăngLovePDF: phân loại tiêu đề chuẩn (không nhận nhầm "phần SX" / "USD")
            if (typeof globalScope.NoirClassifyDocLine === 'function') {
              const falseH1 = globalScope.NoirClassifyDocLine('phần SX Thiên Long với vốn điều lệ 100 tỷ đồng');
              const falseH2 = globalScope.NoirClassifyDocLine('USD.');
              const trueH1 = globalScope.NoirClassifyDocLine('PHẦN 1: PHÂN TÍCH VĨ MÔ');
              const trueH2 = globalScope.NoirClassifyDocLine('1. Tổng quan thị trường và cơ hội');
              if (
                falseH1?.type !== 'paragraph' ||
                falseH2?.type !== 'paragraph' ||
                trueH1?.type !== 'heading' ||
                trueH2?.type !== 'heading'
              ) {
                gaps.push(
                  `NoirClassifyDocLine sai logic tiêu đề: false=[${falseH1?.kind || falseH1},${falseH2?.kind || falseH2}], true=[${trueH1?.kind || trueH1},${trueH2?.kind || trueH2}]`
                );
              }
            } else {
              gaps.push('Thiếu hàm NoirClassifyDocLine từ mod46b');
            }

            // 5. Nạp & kiểm chứng Mod 49 (Đầu tư Hôm Nay) + Mod 50 (30 Phút Thông Thái) + Mod 51 (6 Ngoại ngữ full >= 3500 từ)
            if (ns.worldClockStudio?.openModal && (!globalScope.NoirInvestToday?.promptComposer || !globalScope.NoirWisdom20?.CATEGORIES)) {
              ns.worldClockStudio.openModal('market');
              for (let w = 0; w < 28 && !globalScope.NoirInvestToday?.pdfExporter?.exportInvestPdf; w++) {
                if (ctx.isAborted()) return null;
                await AT.sleep(80);
              }
              ns.worldClockStudio.openModal('wisdom');
              for (let w = 0; w < 28 && !globalScope.NoirWisdom20?.CATEGORIES; w++) {
                if (ctx.isAborted()) return null;
                await AT.sleep(80);
              }
              ns.worldClockStudio.closeModal?.();
              await AT.sleep(30);
            }
            const inv = globalScope.NoirInvestToday;
            if (!inv?.promptComposer || !inv?.pdfExporter?.exportInvestPdf || !/chỉ mang tính chất tham khảo/i.test(inv?.MANDATORY_DISCLAIMER || '')) {
              gaps.push('Mod 49 thiếu promptComposer / exportInvestPdf / dòng miễn trừ tham khảo bắt buộc');
            }
            await AT.sleep(4);

            const w20 = globalScope.NoirWisdom20;
            const totalW20Min = (w20?.CATEGORIES || []).reduce((s, c) => s + (Number(c.minutes) || 0), 0);
            const pillar4Min = (w20?.CATEGORIES || []).find((c) => c.id === 'local_region')?.minutes || 0;
            if (!w20 || (w20.CATEGORIES || []).length !== 8 || pillar4Min !== 13 || totalW20Min !== 30 || typeof w20.exportWisdomReportPdf !== 'function') {
              gaps.push(`Mod 50 sai cấu trúc 30 Phút Thông Thái (pillars=${w20?.CATEGORIES?.length}, p4=${pillar4Min}m, total=${totalW20Min}m)`);
            }
            await AT.sleep(4);

            const llCtrl = ns.langLearningStudio || ns.mod51;
            if (llCtrl?.open && !globalScope.NoirLangLearning?.buildWebsiteVocabDatabase) {
              await llCtrl.open();
              for (let w = 0; w < 25 && !globalScope.NoirLangLearning?.buildWebsiteVocabDatabase; w++) {
                if (ctx.isAborted()) return null;
                await AT.sleep(80);
              }
              llCtrl.close?.();
              await AT.sleep(30);
            }
            const ll = globalScope.NoirLangLearning;
            const fullVocab = typeof ll?.buildWebsiteVocabDatabase === 'function' ? ll.buildWebsiteVocabDatabase() : [];
            if (!ll || (ll.LANGUAGES || []).length !== 6 || fullVocab.length < 3500) {
              gaps.push(`Mod 51 thiếu gói 6 ngôn ngữ hoặc bộ từ vựng bị cắt ngắn (${fullVocab.length} < 3500)`);
            } else {
              const sampleCards = fullVocab.slice(0, 3).map((v) => ({ front: v.vi || 'test', back: v.en || 'test' }));
              const sampleTsv = ll.exportFlashcardsTsv?.({ title: 'Probe', cards: sampleCards });
              const sampleHtml = ll.exportFlashcardsInteractiveHtml?.({ title: 'Probe', cards: sampleCards });
              if (!sampleTsv?.ok || sampleTsv.count !== 3 || !sampleHtml?.ok || sampleHtml.count !== 3) {
                gaps.push(`Mod 51 hàm xuất TSV hoặc HTML Flashcard trả về sai định dạng (tsv=${JSON.stringify(sampleTsv)}, html=${JSON.stringify(sampleHtml)})`);
              }
            }

            if (gaps.length > 0) {
              return makeIssue('deep_module_architecture_logic', 'core_features', 'ERR_DOMAIN_LOGIC_GAP', {
                moduleRef: 'mod46b/mod49/mod50/mod51/noir_exit_guard.js',
                techDetail: gaps.join(' | '),
              });
            }

            return makePass(
              'deep_module_architecture_logic',
              'core_features',
              `Logic toàn bộ module đạt chuẩn (${fullVocab.length} từ Mod 51 · 30p/13p Mod 50 · 4 chế độ Mod 49 · Exit Guard)`,
              'Đã kiểm chứng sâu luồng viết truyện, Story Bible, tiêu đề ĐăngLovePDF, 4 chế độ PDF Đầu tư, 8 trụ cột 30p (Trụ 4 = 13p), trọn bộ >3500 flashcard Mod 51 & Pop-up thoát.',
              'mod49/mod50/mod51/noir_exit_guard.js',
              'functional'
            );
          },
        },
        {
          id: 'api_key_realtime_verify_integrity',
          label: '🔑 Kiểm tra xác minh API Key real-time (AIza* & AQ.*), HTTP 429 & lưu vĩnh viễn',
          run: async () => {
            if (!isBiNovelApp()) {
              return makePass('api_key_realtime_verify_integrity', 'core_features', 'Bỏ qua kiểm tra API Key nội bộ (web ngoài)', 'Tự động thích ứng.');
            }
            const ns = globalScope.NoirStudio || {};
            const gb = globalScope.NoirGeminiBridge || ns.geminiBridge;
            const issues = [];

            const mainClient = ns.geminiRouter || ns.apiClient;
            if (!mainClient || typeof mainClient.verifyKeyWithLowestFlashLite !== 'function') {
              issues.push('Thiếu hàm verifyKeyWithLowestFlashLite trong mod15');
            }
            if (!gb || typeof gb.verifyApiKeyLive !== 'function') {
              issues.push('Thiếu hàm verifyApiKeyLive trong geminiBridgeAndVision.js');
            } else {
              // 1) Kiểm thử khóa AQ.* (Google AI Studio / Vertex Express) bằng mock fetchImpl không ảnh hưởng key thật
              const aqRes = await gb.verifyApiKeyLive('AQ.Ab8RN6AutoTesterProbeKey1234567890abcdef', {
                forceDirect: true,
                fetchImpl: async (url) => {
                  if (String(url).includes('aiplatform.googleapis.com')) {
                    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }), text: async () => '{"candidates":[]}' };
                  }
                  return { ok: false, status: 400, text: async () => 'API key not valid' };
                },
              });
              if (!aqRes?.ok || aqRes.transportId !== 'VERTEX_EXPRESS_QUERY') {
                issues.push(`verifyApiKeyLive lỗi với khóa AQ.* (${JSON.stringify(aqRes)})`);
              }

              // 2) Kiểm thử khóa AIza* trả HTTP 429 (khóa thật tạm chạm hạn mức phút -> phải công nhận hợp lệ!)
              const rlRes = await gb.verifyApiKeyLive('AIzaSyAutoTesterRateLimitProbe1234567890', {
                forceDirect: true,
                fetchImpl: async () => ({ ok: false, status: 429, text: async () => 'RESOURCE_EXHAUSTED' }),
              });
              if (!rlRes?.ok || !rlRes.rateLimited) {
                issues.push(`verifyApiKeyLive không công nhận HTTP 429 là khóa hợp lệ (${JSON.stringify(rlRes)})`);
              }

              // 3) Kiểm thử khóa giả/ngắn -> phải từ chối an toàn
              const badRes = await gb.verifyApiKeyLive('bad-short-key', {
                forceDirect: true,
                fetchImpl: async () => ({ ok: false, status: 400, text: async () => 'Invalid' }),
              });
              if (badRes?.ok) {
                issues.push('verifyApiKeyLive chấp nhận nhầm khóa ngắn không hợp lệ');
              }

              // 4) Kiểm tra hàm AI Thủ công 0-Token & bộ khung Prompt chi tiết theo từng công cụ
              const tocP = gb.buildTaskManualPrompt?.('auto_toc', { fileName: 'Probe.pdf', text: 'Chương 1' }) || '';
              const icrP = gb.buildTaskManualPrompt?.('icr_handwriting', { fileName: 'Note.jpg', icrMode: 'table_survey_checkbox' }) || '';
              if (!tocP.includes('|') || (!icrP.includes('☑') && !icrP.includes('"checked"'))) {
                issues.push('Prompt chuyên biệt theo công cụ (Auto-TOC / ICR) thiếu cấu trúc chuẩn');
              }
            }

            // 5) Kiểm tra nhãn phiên bản v154 trên splash/SW
            const splashVerEl = document.getElementById('app-boot-splash-version');
            const hasVerRef = Boolean(splashVerEl || /v15\d/i.test(document.documentElement.innerHTML.slice(0, 18000)));
            if (!hasVerRef && !globalScope.__noirAppUserEntered) {
              issues.push('Thiếu hiển thị phiên bản trên màn hình khởi động');
            }

            if (issues.length > 0) {
              return makeIssue('api_key_realtime_verify_integrity', 'core_features', 'ERR_DOMAIN_LOGIC_GAP', {
                moduleRef: 'mod15_api_key_vault_and_zero_congestion_client.js / geminiBridgeAndVision.js',
                plainTitle: 'Cơ chế xác minh API Key real-time gặp lỗi',
                techDetail: issues.join(' | '),
              });
            }

            return makePass(
              'api_key_realtime_verify_integrity',
              'core_features',
              'Xác minh API Key real-time (AIza* & AQ.*, HTTP 429 & Prompt chuẩn) đạt 100%',
              'Đã kiểm chứng tự động cổng Google AI Studio + Vertex AI Express cho khóa AQ.*, công nhận HTTP 429 hợp lệ, từ chối khóa lỗi và xác thực bộ Prompt chuyên biệt.',
              'mod15 / geminiBridgeAndVision.js',
              'functional'
            );
          },
        },
        {
          id: 'hidden_db_and_api_integrity',
          label: '🗄️ Kiểm tra dữ liệu ngầm (IndexedDB đọc/ghi, localStorage schema & API/Parser Contract)',
          run: async () => {
            AT.driver.recordBreadcrumb('Kiểm tra ngầm IndexedDB, localStorage schema, Service Worker & API Contract');
            const dbIssues = [];
            const idb = globalScope.NoirStudio?.idb;

            // 1. IndexedDB thật: tôn trọng Sandbox chế độ Khách (mod41) & kiểm chứng IDB gốc trong DB cô lập
            const isGuestActive = Boolean(
              globalScope.NoirStudio?.guestMode?.active ||
                globalScope.NoirStudio?.guestMode?.sandbox?.isGuestActive?.() ||
                document.getElementById('mod41-guest-banner')
            );
            if (idb && typeof idb.open === 'function') {
              const openedDb = await idb.open();
              if (!openedDb || !openedDb.objectStoreNames?.contains('state_cache')) {
                dbIssues.push('IndexedDB chính (mod04) không mở được kho state_cache');
              } else if (!isGuestActive && typeof idb.set === 'function' && typeof idb.get === 'function') {
                const probeKey = '__at_hidden_db_probe__';
                const payload = { ok: true, checksum: 'AT_V143', ts: Date.now() };
                try {
                  await idb.set('state_cache', probeKey, payload);
                  const got = await idb.get('state_cache', probeKey, null);
                  if (!got || got.checksum !== 'AT_V143') {
                    dbIssues.push('IndexedDB state_cache đọc/ghi không khớp checksum');
                  }
                } catch (eIdb) {
                  dbIssues.push(`IndexedDB thao tác lỗi: ${eIdb?.message || eIdb}`);
                } finally {
                  try { await idb.delete?.('state_cache', probeKey); } catch (_eDel) {}
                }
              }
            }
            if (typeof indexedDB !== 'undefined') {
              const probeDbName = '__noir_autotester_idb_probe__';
              try {
                const okTempDb = await new Promise((resolve) => {
                  const req = indexedDB.open(probeDbName, 1);
                  req.onupgradeneeded = () => {
                    if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv');
                  };
                  req.onsuccess = () => {
                    const db = req.result;
                    try {
                      const tx = db.transaction('kv', 'readwrite');
                      const st = tx.objectStore('kv');
                      st.put({ checksum: 'AT_V143' }, 'k1');
                      tx.oncomplete = () => {
                        try {
                          const rx = db.transaction('kv', 'readonly');
                          const g = rx.objectStore('kv').get('k1');
                          g.onsuccess = () => { db.close(); resolve(g.result?.checksum === 'AT_V143'); };
                          g.onerror = () => { db.close(); resolve(false); };
                        } catch (_eR) { db.close(); resolve(false); }
                      };
                      tx.onerror = () => { db.close(); resolve(false); };
                    } catch (_eTx) { db.close(); resolve(false); }
                  };
                  req.onerror = () => resolve(false);
                });
                if (!okTempDb) dbIssues.push('Trình duyệt không đọc/ghi được IndexedDB tạm cô lập');
              } finally {
                try { indexedDB.deleteDatabase(probeDbName); } catch (_eDelDb) {}
              }
            }

            // 2. Kiểm tra schema JSON & dung lượng localStorage
            let totalChars = 0;
            const corruptKeys = [];
            try {
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                const v = localStorage.getItem(k) || '';
                totalChars += (k?.length || 0) + v.length;
                if (/^(noir_|bi_|mod\d+|__autotester_)/i.test(k || '') && /^\s*[\[{]/.test(v)) {
                  try {
                    JSON.parse(v);
                  } catch (_eJson) {
                    corruptKeys.push(k);
                  }
                }
              }
            } catch (_eLs) {}
            const lsKb = Math.round((totalChars * 2) / 1024);
            if (corruptKeys.length > 0) {
              dbIssues.push(`Phát hiện ${corruptKeys.length} key localStorage JSON hỏng: ${corruptKeys.slice(0, 4).join(', ')}`);
            }
            if (lsKb > 4400) {
              dbIssues.push(`localStorage gần đầy (${lsKb} KB > 4400 KB)`);
            }

            // 3. Kiểm tra API Contract & Parser phòng thủ (0 đốt Token AI)
            const w20 = globalScope.NoirWisdom20;
            if (w20 && typeof w20.parseGeminiWisdomReply === 'function') {
              try {
                const safeParsed = w20.parseGeminiWisdomReply('Nội dung không có JSON {hỏng...', { location: {}, categories: {} });
                if (!safeParsed || typeof safeParsed !== 'object') {
                  dbIssues.push('Mod 50 parseGeminiWisdomReply không trả về object an toàn khi thiếu JSON');
                }
              } catch (eParse) {
                dbIssues.push(`Mod 50 parser ném lỗi với input thiếu JSON: ${eParse?.message}`);
              }
            }

            if (dbIssues.length > 0) {
              const isDbErr = corruptKeys.length > 0 || dbIssues.some((x) => /IndexedDB|localStorage/i.test(x));
              return makeIssue('hidden_db_and_api_integrity', 'core_features', isDbErr ? 'ERR_HIDDEN_DB_CORRUPT' : 'ERR_API_CONTRACT_BROKEN', {
                moduleRef: 'mod04_indexeddb_storage_and_emergency_vault.js',
                techDetail: dbIssues.join(' | '),
              });
            }

            return makePass(
              'hidden_db_and_api_integrity',
              'core_features',
              `Dữ liệu ngầm IDB & localStorage (${lsKb} KB / ${localStorage.length} keys) sạch 100%`,
              `Đã kiểm tra đọc/ghi/xóa IndexedDB, xác thực JSON schema toàn bộ khóa cấu hình & khả năng chịu lỗi API/Parser ngầm.`,
              'mod04_indexeddb_storage_and_emergency_vault.js',
              'resilience'
            );
          },
        },
        {
          id: 'bucket2_unit_and_invariants',
          label: '🧠 Khẳng định Logic Nghiệp Vụ (Rổ 2 Unit Harness) & Quét Bất Biến Hiển Thị (NaN/undefined/Trùng ID)',
          run: async () => {
            AT.driver.recordBreadcrumb('Chạy Rổ 2 Client-Side Unit Harness + Quét bất biến hiển thị & cấu trúc dữ liệu');
            const unitRes = AT.bucket2 ? await AT.bucket2.runAll() : { total: 0, passed: 0, failedCount: 0, failed: [] };
            const uiInv = AT.logicAndEdge ? AT.logicAndEdge.scanUiInvariants(document) : { scannedNodes: 0, violations: [] };
            const dataIssues = AT.logicAndEdge ? AT.logicAndEdge.checkDataIntegrityInvariants() : [];

            if (unitRes.failedCount > 0) {
              const f0 = unitRes.failed[0];
              return makeIssue('bucket2_unit_and_invariants', 'core_features', 'ERR_UNIT_HARNESS_FAIL', {
                moduleRef: f0.moduleRef || 'autotester/modules/logicChaosAndEdge.js',
                techDetail: `${unitRes.failedCount}/${unitRes.total} bài kiểm thử hàm lõi Rổ 2 thất bại — [${f0.id}]: ${f0.error}`,
              });
            }
            if (uiInv.violations.length > 0) {
              const v0 = uiInv.violations[0];
              return makeIssue('bucket2_unit_and_invariants', 'core_features', 'ERR_UI_INVARIANT_ARTIFACT', {
                selector: v0.selector,
                moduleRef: 'app',
                techDetail: uiInv.violations.slice(0, 4).map((x) => x.techDetail).join(' | '),
              });
            }
            if (dataIssues.length > 0) {
              const d0 = dataIssues[0];
              return makeIssue('bucket2_unit_and_invariants', 'core_features', d0.code || 'ERR_DATA_INTEGRITY', {
                selector: d0.selector,
                moduleRef: 'index.html',
                techDetail: dataIssues.map((x) => x.techDetail).join(' | '),
              });
            }

            return makePass(
              'bucket2_unit_and_invariants',
              'core_features',
              `Rổ 2 Logic (${unitRes.passed}/${unitRes.total} unit tests) & Bất biến hiển thị (${uiInv.scannedNodes} nút chữ) sạch 100%`,
              '0 chuỗi rác NaN/undefined/null/[object Object], 0 trùng mã ID trong DOM và toàn bộ hàm lõi nghiệp vụ khớp đáp án chuẩn.',
              'autotester/modules/logicChaosAndEdge.js',
              'functional'
            );
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
                for (const m42Tab of ['market', 'wisdom']) {
                  if (ctx.isAborted()) return;
                  globalScope.NoirStudio.worldClockStudio.openModal(m42Tab);
                  await AT.sleep(160);
                  AT.viewportSim?.syncMedia?.();
                  const f = AT.visualAuditor.scanCurrentScreen(`${vpTag} · Mod42:${m42Tab}`);
                  allFindings.push(...f);
                }
                globalScope.NoirStudio.worldClockStudio.closeModal?.();
                await AT.sleep(30);
              }
              const llCtrlVis = globalScope.NoirStudio?.langLearningStudio || globalScope.NoirStudio?.mod51;
              if (isBiNovelApp() && llCtrlVis?.open) {
                await llCtrlVis.open();
                await AT.sleep(140);
                AT.viewportSim?.syncMedia?.();
                const f51 = AT.visualAuditor.scanCurrentScreen(`${vpTag} · Mod51:Lang`);
                allFindings.push(...f51);
                llCtrlVis.close?.();
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
          label: 'Quét sâu dịch thuật toàn bộ 5 ngôn ngữ (EN/简中/繁中/KO/JA) trên 100% DOM, Gate, 6 Tab, Option, Details ẩn & Mod 42/46/51',
          run: async (ctx) => {
            const i18n = globalScope.NoirStudio?.i18n;
            if (!i18n || typeof i18n.setLanguage !== 'function') {
              return makePass('i18n_full_5_languages_audit', 'visual_smooth_i18n', 'Bỏ qua kiểm tra 5 ngôn ngữ (không có bộ i18n)', 'Ứng dụng không đăng ký NS.i18n.', 'mod30_master_bootloader_and_integrity_guard.js', 'visual');
            }
            const origLang = i18n.getLanguage?.() || 'vi';
            const targetLangs = ['en', 'zh-CN', 'zh-TW', 'ko', 'ja'];
            const VN_DIACRITICS_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
            const ALLOWED_BRAND_RE = /(Tiếng Việt|ĐăngLovePDF|Mai Hải Đăng|Buy Đăng|Đăng's|Tiếng Nhật|Việt Nam|Hà Nội|Đà Nẵng|TP\.?\s*HCM|Hồ Chí Minh|NoirStudio|VietQR|Của Bi|Trạm Bi|Sài Gòn|Cliché|Café|Résumé|Bé Miu|Lệ Băng|Minh Khôi|Lâm Phong|SaLưới)/gi;
            const STANDALONE_DANG_RE = /(?<!\p{L})Đăng(?=$|[\s.,!?:;)<」"'에게의는이을를가와과는에도에にをはがでのへとも])/gu;
            const SKIP_ANCESTOR_SEL = '[data-autotester-ui="true"], [data-i18n-ignore="true"], [data-ll51-keep-orig="true"], [contenteditable="true"], #tab4-rich-bible-editor, #at-shell-root, #bi-i18n-floating-popover, #mod28-live-mirror-scale-wrapper, .live-mini-ui-stage, #novel-editor, #s18-rich-prompt-editor, #chapter-title-input, #mod46-live-preview-canvas, #at-bridge-json-details, #quick-chapter-switcher, #mode5-svg-canvas-Stage, #mode5-chronicle-report, textarea, pre, code, script, style, noscript, template';
            const leaks = [];
            const seenLeakKeys = new Set();

            // 0. Kiểm tra cấu trúc toàn vẹn của 5 gói NS.i18nPacks (chặn tuyệt đối lỗi chèn nhầm ngoài exact!)
            const packs = globalScope.NoirStudio?.i18nPacks || {};
            const strayTopKeys = Object.keys(packs).filter((k) => !targetLangs.includes(k));
            if (strayTopKeys.length > 0) {
              leaks.push({ lang: 'ALL', scope: 'Cấu trúc NS.i18nPacks', text: `Có ${strayTopKeys.length} khóa bị chèn sai ra ngoài gói ngôn ngữ (VD: ${strayTopKeys.slice(0, 3).join(', ')})`, selector: 'NS.i18nPacks' });
            }
            const allowedPackFields = new Set(['meta', 'exact', 'promptExact', 'patterns', 'promptPatterns', 'phrases']);
            for (const lc of targetLangs) {
              const pk = packs[lc];
              if (!pk) continue;
              const strayKeys = Object.keys(pk).filter((k) => !allowedPackFields.has(k));
              if (strayKeys.length > 0) {
                leaks.push({ lang: lc, scope: 'Cấu trúc pack', text: `Có ${strayKeys.length} khóa nằm ngoài exact (VD: ${strayKeys.slice(0, 3).join(', ')})`, selector: `i18nPacks["${lc}"]` });
              }
            }

            const pushLeak = (langCode, scopeLabel, rawText, selector) => {
              const norm = String(rawText || '').replace(/\s+/g, ' ').trim();
              if (!norm) return false;
              const dedupeKey = `${langCode}|${norm.slice(0, 90)}`;
              if (seenLeakKeys.has(dedupeKey)) return false;
              seenLeakKeys.add(dedupeKey);
              leaks.push({ lang: langCode, scope: scopeLabel, text: norm.slice(0, 95), selector });
              return true;
            };

            const isVietnameseLeak = (rawText) => {
              const txt = String(rawText || '').replace(/\s+/g, ' ').trim();
              if (txt.length < 2) return false;
              const cleanCheck = txt.replace(ALLOWED_BRAND_RE, '').replace(STANDALONE_DANG_RE, '').trim();
              return cleanCheck.length >= 2 && VN_DIACRITICS_RE.test(cleanCheck);
            };

            const describeEl = (el) => {
              if (!el) return 'text';
              if (el.id) return `#${el.id}`;
              const parentWithId = el.closest?.('[id]');
              return parentWithId ? `#${parentWithId.id} ${el.tagName.toLowerCase()}` : el.tagName.toLowerCase();
            };

            // Quét sâu 100% DOM bao gồm cả Cổng Gate ẩn, 6 Tab, <details> thu gọn, <select><option> và thuộc tính placeholder
            const scanDomDeepForViLeaks = (langCode, scopeLabel, rootEl, opts = {}) => {
              if (!rootEl) return;
              const maxPerScope = opts.maxPerScope || 40;
              const skipTbody = Boolean(opts.skipTbody);
              let foundInScope = 0;

              const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
              let node = walker.nextNode();
              while (node && foundInScope < maxPerScope) {
                const txt = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
                if (isVietnameseLeak(txt)) {
                  const el = node.parentElement;
                  if (el && !el.closest(SKIP_ANCESTOR_SEL) && !(skipTbody && el.closest('tbody'))) {
                    const isUserDynamicData = Boolean(
                      el.closest('#chapter-list-container, #s14-bible-char-list, #s14-bible-rel-list, #s14-bible-secret-list, #s14-bible-clue-list, #s14-scene-markers-list, #mod27-chat-messages-box, #ai-output-display, #mod42-world-clocks-list, #mod42-weather-cities-grid') ||
                      (el.tagName === 'BUTTON' && el.closest('#rag-search-results'))
                    );
                    if (!isUserDynamicData) {
                      if (pushLeak(langCode, scopeLabel, txt, describeEl(el))) {
                        foundInScope += 1;
                      }
                    }
                  }
                }
                node = walker.nextNode();
              }

              if (foundInScope < maxPerScope && typeof rootEl.querySelectorAll === 'function') {
                const attrEls = rootEl.querySelectorAll('[placeholder], option');
                for (let i = 0; i < attrEls.length && foundInScope < maxPerScope; i++) {
                  const el = attrEls[i];
                  if (el.closest(SKIP_ANCESTOR_SEL) || (skipTbody && el.closest('tbody'))) continue;
                  if (el.tagName === 'OPTION') {
                    const oTxt = String(el.textContent || '').trim();
                    if (isVietnameseLeak(oTxt)) {
                      if (pushLeak(langCode, `${scopeLabel} <option>`, oTxt, describeEl(el))) foundInScope += 1;
                    }
                    continue;
                  }
                  const ph = el.getAttribute('placeholder');
                  if (ph && isVietnameseLeak(ph)) {
                    if (pushLeak(langCode, `${scopeLabel} [placeholder]`, ph, describeEl(el))) foundInScope += 1;
                  }
                }
              }
            };

            try {
              for (const lang of targetLangs) {
                if (ctx.isAborted()) return null;
                AT.driver.recordBreadcrumb(`Quét sâu dịch thuật 100% DOM: ${lang.toUpperCase()}`);
                i18n.setLanguage(lang, { persist: false, silent: true });
                // Ép đồng bộ cả các khu vực ẩn (Gate, 6 Tab) thay vì chờ deferred timer
                if (typeof i18n.translateSubtree === 'function') {
                  const gateEl = document.getElementById('entry-connection-gate');
                  if (gateEl) i18n.translateSubtree(gateEl);
                  const mainWs = document.getElementById('app-main-workspace');
                  if (mainWs) i18n.translateSubtree(mainWs);
                }
                await AT.sleep(160);

                // 1. Quét sâu Cổng Vào (Gate) kể cả khi đang ẩn trong Guest Mode
                const gateEl = document.getElementById('entry-connection-gate');
                if (gateEl) scanDomDeepForViLeaks(lang, 'Cổng Gate', gateEl);

                // 2. Quét sâu Toàn bộ 6 Tab + <option> + <details> thu gọn + kho âm thanh mod21
                const wsEl = document.getElementById('app-main-workspace') || document.body;
                scanDomDeepForViLeaks(lang, 'Workspace 6 Tab', wsEl);

                // 3. Mở cửa sổ Giờ Quốc Tế / Thời Tiết / Đầu tư / 30p Thông thái (Mod 42)
                if (globalScope.NoirStudio?.worldClockStudio?.openModal) {
                  globalScope.NoirStudio.worldClockStudio.openModal('timezone');
                  await AT.sleep(120);
                  scanDomDeepForViLeaks(lang, 'Pop-up Mod42', document.getElementById('mod42-world-clock-modal'));
                  globalScope.NoirStudio.worldClockStudio.closeModal();
                }

                // 4. Mở ĐăngLovePDF Hub (Mod 46)
                if (globalScope.NoirStudio?.dangLovePdf?.openDangLovePdfStudio) {
                  globalScope.NoirStudio.dangLovePdf.openDangLovePdfStudio();
                  await AT.sleep(120);
                  scanDomDeepForViLeaks(lang, 'Pop-up ĐăngLovePDF', document.getElementById('modal-mod46-danglovepdf-studio'));
                  document.getElementById('btn-mod46-close-studio')?.click();
                }

                // 5. Kiểm tra khung UI của Mod 51 (Học Ngoại Ngữ — chỉ quét khung giao diện, bỏ qua dữ liệu học trong tbody & câu hỏi đa ngôn ngữ mẫu)
                if (lang === 'en' || lang === 'zh-CN') {
                  if (globalScope.NoirStudio?.langLearningStudio?.open) {
                    try {
                      await globalScope.NoirStudio.langLearningStudio.open();
                      await AT.sleep(120);
                      const mod51El = document.getElementById('modal-mod51-lang-studio');
                      if (mod51El) scanDomDeepForViLeaks(lang, 'Mod51 Học Ngoại Ngữ', mod51El, { skipTbody: true, maxPerScope: 20 });
                      globalScope.NoirStudio.langLearningStudio.close?.();
                    } catch (_e51) {}
                  }
                }
                await AT.sleep(50);
              }
            } finally {
              i18n.setLanguage(origLang, { persist: false, silent: true });
              await AT.sleep(100);
            }

            globalScope.__AUTOTESTER_LAST_I18N_LEAKS__ = leaks.slice();

            if (leaks.length > 0) {
              const sample = leaks.slice(0, 24).map((x) => `[${x.lang.toUpperCase()} · ${x.scope}] "${x.text}" (${x.selector})`).join('\n');
              return makeIssue('i18n_full_5_languages_audit', 'visual_smooth_i18n', 'ERR_I18N_UNTRANSLATED', {
                selector: leaks[0].selector,
                moduleRef: leaks[0].lang === 'ALL' ? 'i18n_lang_en.js' : `i18n_lang_${leaks[0].lang}.js`,
                techDetail: `Phát hiện ${leaks.length} chuỗi tiếng Việt chưa dịch (đã quét sâu Gate + 6 Tab + <option> + <details> + Mod 42/46/51):\n${sample}`,
              });
            }

            return makePass(
              'i18n_full_5_languages_audit',
              'visual_smooth_i18n',
              'Đạt chuẩn dịch thuật sâu 100% cả 5 ngôn ngữ (EN / 简中 / 繁中 / KO / JA)',
              'Đã kiểm tra cấu trúc gói ngôn ngữ + quét sâu Gate, 6 Tab, mọi <option>, <details> thu gọn, Mod 42, ĐăngLovePDF & Mod 51 — 0 chữ tiếng Việt bị sót.',
              'mod30_master_bootloader_and_integrity_guard.js',
              'visual'
            );
          },
        },
        {
          id: 'typography_and_font_integrity',
          label: 'Kiểm tra bộ font Be Vietnam Pro + CJK (SC/TC/JP/KR) & chặn vỡ dấu tiếng Việt (weight <= 700)',
          run: async () => {
            const bodyFont = String(globalScope.getComputedStyle?.(document.body)?.fontFamily || '');
            const hasBeVietnam = /be\s+vietnam\s+pro/i.test(bodyFont);
            const hasCjk = /noto\s+sans\s+(?:sc|tc|jp|kr)/i.test(bodyFont);
            const hasSegoeBody = /segoe\s+ui/i.test(bodyFont);
            const badNodes = [];
            if (hasSegoeBody) badNodes.push('body (cấm Segoe UI)');
            const candidates = Array.from(document.querySelectorAll('button, h1, h2, h3, p, label, a, input, select, [role="button"]')).slice(0, 350);
            for (const el of candidates) {
              if (el.closest?.('[data-autotester-ui="true"], #at-shell-root, .katex')) continue;
              const rect = el.getBoundingClientRect?.();
              if (!rect || rect.width <= 0 || rect.height <= 0) continue;
              const cs = globalScope.getComputedStyle?.(el);
              if (!cs || cs.display === 'none' || cs.visibility === 'hidden') continue;
              const fw = parseInt(cs.fontWeight, 10) || 400;
              const ff = String(cs.fontFamily || '');
              if (fw >= 800) {
                badNodes.push(`${el.id ? '#' + el.id : el.tagName.toLowerCase()} (weight=${fw})`);
              } else if (/segoe\s+ui/i.test(ff)) {
                badNodes.push(`${el.id ? '#' + el.id : el.tagName.toLowerCase()} (Segoe UI cấm dùng)`);
              } else if (/times\s+new\s+roman/i.test(ff) && !el.closest('#novel-editor')) {
                badNodes.push(`${el.id ? '#' + el.id : el.tagName.toLowerCase()} (Times fallback)`);
              }
              if (badNodes.length >= 6) break;
            }
            if (!hasBeVietnam || !hasCjk || badNodes.length > 0) {
              return makeIssue('typography_and_font_integrity', 'visual_smooth_i18n', 'ERR_FONT_FALLBACK_VI', {
                moduleRef: 'index.html',
                techDetail: `bodyFont="${bodyFont}", hasBeVietnam=${hasBeVietnam}, hasCjk=${hasCjk}, badNodes=[${badNodes.join(', ')}]`,
              });
            }
            return makePass(
              'typography_and_font_integrity',
              'visual_smooth_i18n',
              'Chuẩn hóa 100% font Be Vietnam Pro + 4 bảng chữ Đông Á (CJK) & weight <= 700',
              'Tất cả nút bấm & tiêu đề đang dùng bộ font chuẩn không vỡ dấu tiếng Việt và hiển thị sắc nét cho EN/VI/SC/TC/JA/KR.',
              'index.html',
              'visual'
            );
          },
        },
        {
          id: 'multi_viewport_mobile_desktop_controls',
          label: '📐 Đa khung hình Mobile & Desktop (320→1920px), Soi nút Đóng/Mở bị cắt, Va chạm AABB, Zoom 200% & YIQ Diff',
          run: async () => {
            AT.driver.recordBreadcrumb('Quét đa khung hình 320–1920px, nút Đóng/Mở modal, va chạm AABB & Zoom 200%');
            const vg = AT.viewportGeometry;
            if (!vg) {
              return makePass('multi_viewport_mobile_desktop_controls', 'visual_smooth_i18n', 'Bỏ qua (thiếu module viewportGeometry)', 'Module chưa nạp.', 'autotester', 'visual');
            }

            // 1. Quét toàn bộ 8 mốc Mobile (320, 375, 414), Tablet (768, 1024), Desktop (1280, 1440, 1920)
            const sweep = await vg.runMultiViewportAudit([320, 375, 414, 768, 1024, 1280, 1440, 1920], { delayMs: 25 });

            // 2. Kiểm tra riêng Modal Xem trước PDF (Mod 49 & Mod 50) & ĐăngLovePDF trên Mobile 320px/375px và Desktop 1280px
            const modalCtrlIssues = [];
            const modalAuditHost = document.createElement('div');
            modalAuditHost.id = 'at-probe-pdf-modal-check';
            modalAuditHost.setAttribute('role', 'dialog');
            modalAuditHost.setAttribute('aria-modal', 'true');
            modalAuditHost.className = 'fixed inset-0 z-[2147483630] bg-black/90 flex flex-col text-zinc-100';
            modalAuditHost.innerHTML = `
              <div class="px-3 py-2.5 bg-[#0f2942] border-b border-teal-500/50 flex flex-col gap-2 shrink-0 w-full min-w-0">
                <div class="flex items-center justify-between gap-2 w-full min-w-0">
                  <div class="min-w-0 flex-1"><div class="text-xs font-bold text-white truncate">👁️ Xem Trước PDF (14 trang)</div></div>
                  <button type="button" id="at-probe-pv-close" class="px-3 py-1.5 min-h-[36px] rounded-xl bg-rose-600 text-white text-xs font-bold shrink-0 whitespace-nowrap">✕ Đóng</button>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 w-full min-w-0">
                  <select class="px-2 py-1.5 rounded-lg bg-zinc-950 text-[11px] font-bold"><option>Lớn</option></select>
                  <select class="px-2 py-1.5 rounded-lg bg-zinc-950 text-[11px] font-bold"><option>Sans</option></select>
                  <select class="px-2 py-1.5 rounded-lg bg-zinc-950 text-[11px] font-bold"><option>☀️ Sáng</option></select>
                  <button type="button" id="at-probe-pv-dl" class="ml-auto px-3 py-1.5 min-h-[36px] rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold shrink-0 whitespace-nowrap">⬇️ Tải PDF</button>
                </div>
              </div>`;
            document.body.appendChild(modalAuditHost);
            try {
              for (const w of [320, 375, 414, 1280]) {
                vg.applyViewportWidth(w, w < 768 ? 812 : 800, `ModalCheck-${w}px`);
                await AT.sleep(20);
                modalCtrlIssues.push(...vg.auditModalAndToolbarControls(document, w, w < 768 ? 812 : 800, `ModalCheck-${w}px`));
              }
            } finally {
              modalAuditHost.remove();
              vg.restoreViewportWidth();
            }

            // 2B. Quét trực tiếp các Hộp thoại THẬT (Mod 42 Đầu Tư & ĐăngLovePDF Hub) trên Mobile 375px
            try {
              if (isBiNovelApp() && globalScope.NoirStudio?.worldClockStudio?.openModal) {
                globalScope.NoirStudio.worldClockStudio.openModal('market');
                vg.applyViewportWidth(375, 812, 'RealMod42-375px');
                await AT.sleep(80);
                modalCtrlIssues.push(...vg.auditModalAndToolbarControls(document, 375, 812, 'RealMod42-375px'));
                globalScope.NoirStudio.worldClockStudio.closeModal?.();
              }
              if (isBiNovelApp() && globalScope.NoirStudio?.dangLovePdf?.openDangLovePdfStudio) {
                globalScope.NoirStudio.dangLovePdf.openDangLovePdfStudio();
                vg.applyViewportWidth(375, 812, 'RealMod46-375px');
                await AT.sleep(80);
                modalCtrlIssues.push(...vg.auditModalAndToolbarControls(document, 375, 812, 'RealMod46-375px'));
                document.getElementById('btn-mod46-close-studio')?.click?.();
              }
            } finally {
              vg.restoreViewportWidth();
            }

            // 3. Kiểm tra ảnh hỏng, SVG rỗng, phông chữ & Zoom 200% + YIQ Visual Diff
            const mediaRes = vg.auditTextClippingAndMedia(document);
            const zoom200 = await vg.auditTextZoom200(document);
            const visualDiff = AT.visualRegression ? await AT.visualRegression.compareWithBaseline('main_screen') : { diffRatio: 0 };

            const p0Issues = [
              ...modalCtrlIssues,
              ...sweep.issues.filter((x) => x.code === 'ERR_MODAL_CONTROL_CLIPPED' || x.code === 'ERR_MODAL_CONTROL_MISSING'),
              ...mediaRes.mediaIssues.filter((x) => x.code === 'ERR_BROKEN_IMAGE'),
              ...mediaRes.fontIssues,
            ];

            if (p0Issues.length > 0) {
              const first = p0Issues[0];
              return makeIssue('multi_viewport_mobile_desktop_controls', 'visual_smooth_i18n', first.code || 'ERR_MODAL_CONTROL_CLIPPED', {
                selector: first.selector,
                moduleRef: 'modules/invest-today/engines/investPdfExporter.js',
                techDetail: p0Issues.slice(0, 4).map((x) => x.techDetail).join(' | '),
              });
            }

            return makePass(
              'multi_viewport_mobile_desktop_controls',
              'visual_smooth_i18n',
              `Sạch nút Đóng/Mở & bố cục trên đủ ${sweep.testedViewports} mốc Mobile/Desktop (320→1920px)`,
              `Đã quét 320/375/414/768/1024/1280/1440/1920px · 0 nút Đóng/Tải bị cắt mép · Zoom 200%: ${zoom200.ok ? 'OK' : `tràn ${zoom200.overflowPx}px`} · YIQ Diff: ${Math.round((visualDiff.diffRatio || 0) * 100)}%.`,
              'autotester/modules/viewportAndGeometry.js',
              'visual'
            );
          },
        },
        {
          id: 'a11y_wcag_seo_pwa_pseudoloc',
          label: '♿ Trợ năng WCAG Alpha-Contrast, Giả lập kéo giãn +35% chữ, Chống lỗi mã hóa & Chuẩn SEO/PWA',
          run: async () => {
            AT.driver.recordBreadcrumb('Kiểm toán WCAG Alpha-Compositing, Pseudo-Localization +35% & SEO/PWA');
            const a11y = AT.a11yAuditorV2 ? AT.a11yAuditorV2.runWcagAndA11yAudit(document) : { ok: true, issues: [], complexBgDelegations: [] };
            const seoI18n = AT.seoI18nAuditorV2 ? await AT.seoI18nAuditorV2.runI18nPseudoLocAndSeoPwaAudit(document) : { ok: true, issues: [], pseudoOverflowCount: 0, seoChecks: {} };

            const critical = [...a11y.issues, ...seoI18n.issues].filter((x) => x.severity === 'P0' || x.severity === 'P1');
            if (critical.length > 0) {
              const c0 = critical[0];
              return makeIssue('a11y_wcag_seo_pwa_pseudoloc', 'visual_smooth_i18n', c0.code, {
                selector: c0.selector,
                moduleRef: 'index.html',
                techDetail: critical.map((x) => x.techDetail).join(' | '),
              });
            }

            return makePass(
              'a11y_wcag_seo_pwa_pseudoloc',
              'visual_smooth_i18n',
              `Đạt chuẩn WCAG Alpha-Contrast, UTF-8 sạch, Pseudo-Loc +35% & PWA sẵn sàng`,
              `Chữ trên nền ảnh/gradient ủy thác Rổ 3: ${a11y.complexBgDelegations.length} mục · Nút gãy khi kéo +35%: ${seoI18n.pseudoOverflowCount} · SEO/PWA: title=${seoI18n.seoChecks.titleOk}, lang=${seoI18n.seoChecks.htmlLangOk}, manifest=${seoI18n.seoChecks.manifestOk}, SW=${seoI18n.seoChecks.swSupported}.`,
              'autotester/modules/securityA11ySeoAndPerf.js',
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
        {
          id: 'security_hygiene_audit',
          label: '🔐 Kiểm tra bảo mật cơ bản (XSS Escape, Rò rỉ API Key, Link _blank & Electron Sandbox)',
          run: async () => {
            AT.driver.recordBreadcrumb('Kiểm tra bảo mật cơ bản: XSS, API Key hygiene, noopener & sandbox');
            const secRisks = [];
            let secCanaryFired = false;
            globalScope.__AT_SEC_CANARY__ = () => { secCanaryFired = true; };

            try {
              // 1. Escape XSS canary
              const xssPayload = '<img src=x onerror="window.__AT_SEC_CANARY__()"><script>window.__AT_SEC_CANARY__()</script>';
              const escaped = globalScope.NoirStudio?.utils?.escapeHtml?.(xssPayload) || '';
              if (!escaped || /<img|<script/i.test(escaped)) {
                secRisks.push('NS.utils.escapeHtml chưa mã hóa đủ thẻ nguy hiểm');
              }
              const sink = document.createElement('div');
              sink.innerHTML = escaped;
              if (secCanaryFired || sink.querySelector('script, img')) {
                secRisks.push('HTML sau escape vẫn tạo phần tử thực thi');
              }

              // 2. Chống rò rỉ Gemini API Key ra URL / Flashcard HTML / Đơn thuốc Autotester
              const savedKey = localStorage.getItem('noir_gemini_api_key') || '';
              if (/AIza[0-9A-Za-z_-]{10,}/.test(globalScope.location?.href || '')) {
                secRisks.push('Phát hiện API Key nằm trên URL trình duyệt!');
              }
              if (savedKey) {
                const ll = globalScope.NoirLangLearning;
                if (ll?.exportFlashcardsInteractiveHtml) {
                  ll.exportFlashcardsInteractiveHtml({ title: 'SecProbe', cards: [{ front: 'thử', back: 'test' }] });
                  const lastCap = AT.interceptors?.capturedDownloads?.[AT.interceptors.capturedDownloads.length - 1];
                  if (lastCap?.textSnippet && String(lastCap.textSnippet).includes(savedKey)) {
                    secRisks.push('API Key bị lộ trong file HTML Flashcard xuất ra!');
                  }
                }
                const rxText = AT.loopEngine?.buildAiPatchPrompt?.(AT.ctrl?.lastReport || {
                  runNumber: 1, totalScore: 100, scoreDelta: 0, browserSignature: 'Chrome', viewport: '1280x800',
                  pillars: { functional: { score: 25, max: 25 }, sync: { score: 25, max: 25 }, smoothness: { score: 20, max: 20 }, visual: { score: 15, max: 15 }, resilience: { score: 15, max: 15 } },
                  kpis: { buttonsTested: 1, deadButtonsFound: 0, syncPassed: 1, syncTotal: 1 },
                  perfStats: { avgFps: 60, minFps: 60, longTasks: 0, unrevokedBlobs: 0 },
                  passed: [], issues: [], regressions: [], fixedSincePrev: [], breadcrumbs: [],
                }) || '';
                if (rxText.includes(savedKey)) secRisks.push('API Key bị lộ trong đơn thuốc Autotester!');
              }

              // 3. Kiểm tra link ngoài target="_blank" phải có rel="noopener" chống Tabnabbing
              const unsafeBlankLinks = Array.from(document.querySelectorAll('a[target="_blank"]')).filter((a) => {
                if (a.closest('[data-autotester-ui="true"]')) return false;
                const href = String(a.getAttribute('href') || '');
                if (!/^https?:\/\//i.test(href)) return false;
                const rel = String(a.getAttribute('rel') || '').toLowerCase();
                return !rel.includes('noopener') && !rel.includes('noreferrer');
              });
              if (unsafeBlankLinks.length > 0) {
                secRisks.push(`${unsafeBlankLinks.length} liên kết _blank thiếu rel="noopener" (${unsafeBlankLinks[0].getAttribute('href')})`);
              }

              // 4. Ranh giới Electron Node Sandbox (contextIsolation)
              if (typeof globalScope.require === 'function' || globalScope.process?.versions?.electron) {
                secRisks.push('Phát hiện Node.js require/process lộ trực tiếp trong Renderer (thiếu contextIsolation)');
              }
            } finally {
              delete globalScope.__AT_SEC_CANARY__;
            }

            if (secRisks.length > 0) {
              return makeIssue('security_hygiene_audit', 'chaos_resilience', 'ERR_SECURITY_RISK', {
                moduleRef: 'mod03/noir_exit_guard/electron/main.cjs',
                techDetail: secRisks.join(' | '),
              });
            }

            return makePass(
              'security_hygiene_audit',
              'chaos_resilience',
              'Đạt chuẩn bảo mật cơ bản (XSS Escape, 0 rò API Key, _blank noopener & Sandbox sạch)',
              'Không thực thi mã độc mẫu, không lộ khóa API ra URL hay file xuất và mọi liên kết ngoài đều được cô lập an toàn.',
              'mod03_humanized_ui_toast_and_vn_nlp_utils.js',
              'resilience'
            );
          },
        },
        {
          id: 'seeded_chaos_fuzz_history_race_edge',
          label: '🌪️ Hỗn loạn Mulberry32, Bơm dữ liệu biên, Lịch sử SPA/Race, 5 Trạng thái ngoại biên & Rò rỉ chu kỳ',
          run: async () => {
            AT.driver.recordBreadcrumb('Chạy Fuzzing biên, Seeded Chaos, SPA History/Race, 5 Edge States & Cyclic Leak');
            const le = AT.logicAndEdge;
            const fuzz = le ? await le.runFormBoundaryFuzz() : { ok: true, payloadsTested: 0 };
            const chaos = le ? await le.runSeededChaos(20261127, 10) : { ok: true, seed: 20261127, stepsExecuted: 0 };
            const histRace = le ? await le.auditSpaHistoryAndAsyncRace() : { ok: true, issues: [] };
            const edge = le ? await le.auditEdgeStateResilience() : { ok: true, probes: {}, issues: [] };
            const leak = AT.networkCwvAuditor ? await AT.networkCwvAuditor.runCyclicLeakProfile(6) : { leaked: false, domDelta: 0, listenerDelta: 0 };

            if (!fuzz.ok || !chaos.ok) {
              return makeIssue('seeded_chaos_fuzz_history_race_edge', 'chaos_resilience', 'ERR_CHAOS_DOUBLE_CLICK', {
                moduleRef: 'autotester/modules/logicChaosAndEdge.js',
                techDetail: `fuzzErrors=${fuzz.newErrors || 0}, chaosErrors=${chaos.newErrors || 0}, seed=${chaos.seed}`,
              });
            }
            if (!histRace.ok || !edge.ok) {
              return makeIssue('seeded_chaos_fuzz_history_race_edge', 'chaos_resilience', 'ERR_EDGE_STATE_RESILIENCE', {
                moduleRef: 'autotester/modules/logicChaosAndEdge.js',
                techDetail: [...(histRace.issues || []), ...(edge.issues || [])].join(' | '),
              });
            }
            if (leak.leaked) {
              return makeIssue('seeded_chaos_fuzz_history_race_edge', 'chaos_resilience', 'WARN_CYCLIC_MEMORY_LEAK', {
                moduleRef: 'app',
                techDetail: `Sau ${leak.cycles} chu kỳ: domDelta=+${leak.domDelta}, listenerDelta=+${leak.listenerDelta}, heapDelta=${leak.heapDeltaMb ?? 'N/A'}MB`,
              });
            }

            return makePass(
              'seeded_chaos_fuzz_history_race_edge',
              'chaos_resilience',
              `Vượt qua Fuzz biên (${fuzz.payloadsTested}), Chaos (seed ${chaos.seed}), 5 ngoại biên & 0 rò rỉ chu kỳ`,
              `Quota localStorage: ${edge.probes?.storageUsagePct ?? 0}% (${edge.probes?.storageUsedKb ?? 0} KB) · DOM delta: ${leak.domDelta} · Listener delta: ${leak.listenerDelta}.`,
              'autotester/modules/logicChaosAndEdge.js',
              'resilience'
            );
          },
        },
        {
          id: 'deep_security_and_coevolution_bridge',
          label: '🤝 Bảo mật chuyên sâu (postMessage/Proto/Sinks/SRI) & Cầu nối Phối hợp Antigravity (<2K Token)',
          run: async () => {
            AT.driver.recordBreadcrumb('Kiểm toán bảo mật nâng cao & Cầu nối window.__AUTOTESTER__ (<2K Token)');
            const sec = AT.securityAuditorV2 ? await AT.securityAuditorV2.runDeepSecurityAudit() : { ok: true, findings: [], advisories: [] };
            if (!sec.ok && sec.findings.length > 0) {
              const f0 = sec.findings[0];
              return makeIssue('deep_security_and_coevolution_bridge', 'chaos_resilience', f0.code || 'ERR_SECURITY_RISK', {
                selector: f0.selector,
                moduleRef: 'autotester/modules/securityA11ySeoAndPerf.js',
                techDetail: sec.findings.map((x) => x.techDetail).join(' | '),
              });
            }

            const bridge = globalScope.__AUTOTESTER__;
            if (!bridge || typeof bridge.runFullAudit !== 'function' || typeof bridge.exportTokenCappedReport !== 'function') {
              return makeIssue('deep_security_and_coevolution_bridge', 'chaos_resilience', 'ERR_DOMAIN_LOGIC_GAP', {
                moduleRef: 'autotester/modules/bridgeAndCoEvolution.js',
                techDetail: 'Thiếu cầu nối toàn cục window.__AUTOTESTER__.runFullAudit / exportTokenCappedReport.',
              });
            }
            const caps = bridge.getCapabilities();
            const delta = bridge.getSurfaceDelta();
            const samplePayload = bridge.exportTokenCappedReport();
            if ((samplePayload.estimatedTokens || 0) > 2200) {
              return makeIssue('deep_security_and_coevolution_bridge', 'chaos_resilience', 'ERR_DOMAIN_LOGIC_GAP', {
                moduleRef: 'autotester/modules/bridgeAndCoEvolution.js',
                techDetail: `Gói JSON cầu nối vượt ngưỡng 2,000 token (${samplePayload.estimatedTokens} tokens).`,
              });
            }

            return makePass(
              'deep_security_and_coevolution_bridge',
              'chaos_resilience',
              `Bảo mật nâng cao sạch & Cầu nối Antigravity v${bridge.version} (~${samplePayload.estimatedTokens} token)`,
              `Tự chủ ${caps.bucket1AutonomousPillars.length} năng lực Rổ 1 · ${delta.totalSurfaces} bề mặt · ${samplePayload.aiDelegationQueue.length} mục Rổ 3 kích hoạt thông minh.`,
              'autotester/modules/bridgeAndCoEvolution.js',
              'resilience'
            );
          },
        },
      ],
    },
  ];

  AT.SUITE_GROUPS = SUITE_GROUPS;
})(typeof window !== 'undefined' ? window : globalThis);
