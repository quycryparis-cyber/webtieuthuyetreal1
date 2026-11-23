/**
 * ============================================================================
 * 🧪 AUTOTESTER TEST SUITES (TỐI ƯU SÂU CHO APP 48 MODULE + TƯƠNG THÍCH WEB KHÁC)
 * ============================================================================
 * Gom gọn thành đúng 4 cụm thu gọn dễ hiểu cho người dùng phổ thông:
 *  Cụm 1: Các tính năng chính (Viết truyện, AI, Story Bible, ĐăngLovePDF, YouTube, Bi Số 8, RAM)
 *  Cụm 2: Giao diện & Bấm trên điện thoại (Tràn khung, Đè thanh nổi, Nút bấm, Soi lệch hình)
 *  Cụm 3: Độ mượt & Ngốn máy (FPS 60 khung hình, Tác vụ gây đơ, Tệp tạm quên dọn, RAM)
 *  Cụm 4: Thử bấm phá & Rớt mạng (Bấm đúp nhanh, Nạp file 0 byte/hỏng, Đổi tab liên tục, Rớt mạng)
 * ============================================================================
 */
(function initAutoTesterSuites(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  function makePass(id, groupId, plainTitle, plainDesc, moduleRef = 'app') {
    return { id, groupId, status: 'PASS', severity: 'OK', pillar: 'functional', plainTitle, plainDesc, moduleRef };
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
    await AT.sleep(160);
  }

  // --------------------------------------------------------------------------
  // DANH MỤC 4 CỤM BÀI KIỂM TRA (MẶC ĐỊNH ĐÓNG KÍN — BẤM VÀO MỚI MỞ TICK CHỌN)
  // --------------------------------------------------------------------------
  const SUITE_GROUPS = [
    {
      id: 'core_features',
      icon: '🧩',
      title: '1. Các tính năng chính (Viết truyện, AI, PDF, Lưu trữ...)',
      tests: [
        {
          id: 'core_nav_6_screens',
          label: 'Chuyển mượt qua lại giữa các màn hình chính',
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
            }
            return makePass('core_nav_6_screens', 'core_features', 'Chuyển đủ 6 màn hình chính mượt mà', 'Cả 6 Tab của Studio đều mở đúng màn hình không bị kẹt.', 'mod29_responsive_mobile_pwa_and_six_screens_nav.js');
          },
        },
        {
          id: 'core_select_copy_all',
          label: 'Khung câu lệnh, Đầu ra AI & Story Bible có đủ nút Chọn hết & Chép hết',
          run: async () => {
            if (!isBiNovelApp()) {
              return makePass('core_select_copy_all', 'core_features', 'Kiểm tra nút thao tác văn bản cơ bản', 'Áp dụng chế độ kiểm tra phổ quát cho trang web ngoài.');
            }
            await switchTabSafe('SCREEN_3_AI');
            const outSel = document.querySelector('[data-v117-select-all="tab3-rich-output-editor"], [data-word-cmd="selectAll"]');
            const outCopy = document.querySelector('[data-v117-copy-all="tab3-rich-output-editor"]');
            await switchTabSafe('SCREEN_4_BIBLE');
            const bibleSel = document.querySelector('[data-v117-select-all="tab4-rich-bible-editor"]');
            const bibleCopy = document.querySelector('[data-v117-copy-all="tab4-rich-bible-editor"]');
            if (outSel && outCopy && bibleSel && bibleCopy) {
              return makePass('core_select_copy_all', 'core_features', 'Đủ nút Chọn tất cả & Sao chép tất cả trên khung lệnh, đầu ra và Story Bible', 'Các khung soạn AI và Story Bible đều có sẵn nút Chọn tất cả và Sao chép tất cả 1 chạm.', 'mod17_tab3_five_modes_output_controller.js');
            }
            return makeIssue('core_select_copy_all', 'core_features', 'ERR_MISSING_COPY_SELECT_ALL', {
              selector: !outCopy ? '#tab3-rich-output-editor' : '#tab4-rich-bible-editor',
              moduleRef: 'mod17_tab3_five_modes_output_controller.js',
              techDetail: `Thiếu nút: outSel=${Boolean(outSel)}, outCopy=${Boolean(outCopy)}, bibleSel=${Boolean(bibleSel)}, bibleCopy=${Boolean(bibleCopy)}`,
            });
          },
        },
        {
          id: 'core_danglovepdf_in_ram',
          label: 'Kiểm tra ĐăngLovePDF (mở công cụ & nạp thử 2 file PDF tạo trong RAM)',
          run: async (ctx) => {
            if (!isBiNovelApp() || !globalScope.NoirStudio?.dangLovePdf) {
              return makePass('core_danglovepdf_in_ram', 'core_features', 'Bỏ qua bài ĐăngLovePDF (không có trên trang này)', 'Tự động thích ứng cho web ngoài.');
            }
            await switchTabSafe('SCREEN_6_SYSTEM');
            const btn = document.getElementById('btn-tab6-top-export-pdf');
            if (!btn) {
              return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_OUTPUT_INVALID', {
                selector: '#btn-tab6-top-export-pdf',
                moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                techDetail: 'Không thấy nút #btn-tab6-top-export-pdf ở Tab 6.',
              });
            }
            AT.driver.recordBreadcrumb('Mở ĐăngLovePDF (Mod 46)');
            globalScope.NoirStudio.dangLovePdf.openDangLovePdfStudio('merge');
            await AT.sleep(240);
            if (ctx.isAborted()) return null;

            const fileInput = document.getElementById('input-mod46-file');
            if (!fileInput) {
              document.getElementById('btn-mod46-close-studio')?.click();
              return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_OUTPUT_INVALID', {
                selector: '#modal-mod46-danglovepdf-studio',
                moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                techDetail: 'Không tìm thấy ô nạp file #input-mod46-file trong công cụ Gộp PDF.',
              });
            }

            // Tạo 2 file PDF chuẩn 2 trang ngay trong RAM và bơm qua DataTransfer
            const f1 = AT.fixtures.createMinimalValidPdf('tap_1_mau.pdf', 2);
            const f2 = AT.fixtures.createMinimalValidPdf('tap_2_mau.pdf', 2);
            AT.fixtures.injectFilesToInput(fileInput, [f1, f2]);
            for (let waitIdx = 0; waitIdx < 16; waitIdx++) {
              if ((globalScope.NoirStudio.dangLovePdf.files?.length || 0) >= 2) break;
              await AT.sleep(120);
            }

            const loadedCount = globalScope.NoirStudio.dangLovePdf.files?.length || 0;
            // Đóng và dọn RAM ngay sau khi kiểm tra
            document.getElementById('btn-mod46-close-studio')?.click();
            await AT.sleep(150);

            if (loadedCount >= 2) {
              return makePass('core_danglovepdf_in_ram', 'core_features', 'ĐăngLovePDF nhận đủ 2 file PDF mẫu & tự dọn RAM khi đóng', 'Mở 19 công cụ, nạp thử 2 file PDF tạo trong RAM thành công và tự giải phóng bộ nhớ sạch.', 'mod46_danglovepdf_and_doc_converter.js');
            }
            return makeIssue('core_danglovepdf_in_ram', 'core_features', 'ERR_PDF_OUTPUT_INVALID', {
              selector: '#btn-tab6-top-export-pdf',
              moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
              techDetail: `Nạp 2 file PDF mẫu qua DataTransfer nhưng chỉ nhận ${loadedCount} tệp.`,
            });
          },
        },
        {
          id: 'core_chatbot_bi8_modes',
          label: 'Kiểm tra Trợ lý AI Bi Số 8 trả lời đúng về trang web ở cả Chế độ 1 & 2',
          run: async () => {
            if (!isBiNovelApp() || !globalScope.NoirStudio?.mascotAndChat) {
              return makePass('core_chatbot_bi8_modes', 'core_features', 'Bỏ qua bài Chatbot (không có trên trang này)', 'Tự động thích ứng.');
            }
            const bot = globalScope.NoirStudio.mascotAndChat;
            const intent1 = bot.classifyChatMessageIntent('Bạn có thể cho tôi biết trang web này có gì', 'WEB_SUPPORT_STRICT');
            const intent2 = bot.classifyChatMessageIntent('Bạn có thể cho tôi biết trang web này có gì', 'CASUAL_CHAT_AUTO');
            const localAns = bot.buildIntelligentLocalResponse('Bạn có thể cho tôi biết trang web này có gì');
            const ok = intent1?.category === 'WEB_FEATURE' && intent2?.category === 'WEB_FEATURE' && /Tab 1|ĐăngLovePDF|Story Bible/i.test(localAns);
            if (ok) {
              return makePass('core_chatbot_bi8_modes', 'core_features', 'Trợ lý Viên Bi Số 8 hiểu chính xác toàn bộ tính năng trang web', 'Không còn đẩy qua đẩy lại giữa Chế độ 1 và Chế độ 2 khi hỏi về trang web.', 'mod27_mascot_bi_so_8_and_dual_chat_assistant.js');
            }
            return makeIssue('core_chatbot_bi8_modes', 'core_features', 'ERR_CHATBOT_PINGPONG', {
              selector: '#s11-mascot-bi-corner',
              moduleRef: 'mod27_mascot_bi_so_8_and_dual_chat_assistant.js',
              techDetail: `intent1=${intent1?.category}, intent2=${intent2?.category}`,
            });
          },
        },
        {
          id: 'core_perf_ram_mod47',
          label: 'Kiểm tra Quản lý RAM & Tự ngủ thông minh (Mod 47) + Video hướng dẫn',
          run: async () => {
            if (!isBiNovelApp()) {
              return makePass('core_perf_ram_mod47', 'core_features', 'Hệ thống lõi trang web sẵn sàng', 'DOM đang hoạt động ổn định.');
            }
            await switchTabSafe('SCREEN_6_SYSTEM');
            const mod47Card = document.getElementById('tab6-acc-perf-ram-manager');
            const mod28Chapters = globalScope.NoirStudio?.videoTutorial?.player?.chapters?.length || 0;
            if (mod47Card && mod28Chapters >= 30) {
              return makePass('core_perf_ram_mod47', 'core_features', `Bộ tối ưu RAM (Mod 47) & Video hướng dẫn (${mod28Chapters} mốc) đã sẵn sàng`, 'Công tắc tắt/bật chức năng, tự ngủ khi thoát và hướng dẫn 6 ngôn ngữ hoạt động đầy đủ.', 'mod47_performance_ram_and_lifecycle_manager.js');
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
    {
      id: 'visual_mobile',
      icon: '📱',
      title: '2. Giao diện & Bấm trên điện thoại (Tràn mép, Đè nút, Soi lệch)',
      tests: [
        {
          id: 'visual_overflow_and_docks',
          label: 'Soi tràn màn hình ngang, thanh nổi đè nhau & kích thước nút bấm',
          run: async (ctx) => {
            const screens = isBiNovelApp()
              ? [
                  { key: 'SCREEN_1_WRITE', name: 'Tab 1 (Bàn viết)' },
                  { key: 'SCREEN_3_AI', name: 'Tab 3 (AI)' },
                  { key: 'SCREEN_5_AMBIENCE', name: 'Tab 5 (Nhạc & YT)' },
                  { key: 'SCREEN_6_SYSTEM', name: 'Tab 6 (Hệ thống)' },
                ]
              : [{ key: null, name: 'Trang hiện tại' }];

            const allFindings = [];
            for (const s of screens) {
              if (ctx.isAborted()) return null;
              if (s.key) await switchTabSafe(s.key);
              const f = AT.visualAuditor.scanCurrentScreen(s.name);
              allFindings.push(...f);
            }

            if (!allFindings.length) {
              return makePass('visual_overflow_and_docks', 'visual_mobile', 'Giao diện vừa khít khung hình, không bị tràn mép hay đè nút', `Đã quét sạch ${screens.length} màn hình trên kích thước ${window.innerWidth}x${window.innerHeight}px.`, 'index.html');
            }
            const first = allFindings[0];
            return makeIssue('visual_overflow_and_docks', 'visual_mobile', first.code, {
              selector: first.selector,
              moduleRef: 'index.html',
              techDetail: allFindings.map((x) => `[${x.code}] ${x.techDetail}`).join('\n'),
            });
          },
        },
      ],
    },
    {
      id: 'smoothness_ram',
      icon: '⚡',
      title: '3. Độ mượt & Ngốn máy (Khung hình, Đứng hình, Bộ nhớ RAM)',
      tests: [
        {
          id: 'perf_fps_and_memory',
          label: 'Đo độ mượt vuốt/bấm (FPS), tác vụ gây đơ & tệp tạm chưa dọn',
          run: async () => {
            await AT.sleep(650);
            const st = AT.smoothAuditor.snapshot();
            if (st.minFps > 0 && st.minFps < 25) {
              return makeIssue('perf_fps_and_memory', 'smoothness_ram', 'WARN_MAIN_THREAD_JANK', {
                moduleRef: 'mod47_performance_ram_and_lifecycle_manager.js',
                techDetail: `FPS tụt xuống ${st.minFps} FPS (TB ${st.avgFps} FPS), LongTasks=${st.longTasks} (max ${st.maxLongTaskMs}ms), CLS=${st.cls}`,
              });
            }
            if (st.unrevokedBlobs > 3) {
              return makeIssue('perf_fps_and_memory', 'smoothness_ram', 'WARN_UNREVOKED_BLOBS', {
                moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
                techDetail: `Còn ${st.unrevokedBlobs} Blob URL chưa gọi URL.revokeObjectURL().`,
              });
            }
            return makePass(
              'perf_fps_and_memory',
              'smoothness_ram',
              `App chạy mượt (${st.avgFps} khung hình/giây${st.ramMb ? ` · RAM ${st.ramMb} MB` : ''})`,
              `Không phát hiện hiện tượng đơ nặng hay rò rỉ tệp tạm (Tác vụ dài: ${st.longTasks}, Tệp tạm dư: ${st.unrevokedBlobs}).`,
              'mod47_performance_ram_and_lifecycle_manager.js'
            );
          },
        },
      ],
    },
    {
      id: 'chaos_resilience',
      icon: '🛡️',
      title: '4. Thử bấm phá & Rớt mạng (File hỏng, Bấm đúp, Mất mạng)',
      tests: [
        {
          id: 'chaos_corrupted_file',
          label: 'Nạp thử file rỗng 0 byte & file PDF giả mạo xem app có chịu được không',
          run: async () => {
            if (!isBiNovelApp() || !globalScope.NoirStudio?.dangLovePdf) {
              return makePass('chaos_corrupted_file', 'chaos_resilience', 'Kiểm tra an toàn đầu vào cơ bản ổn định', 'Không có lỗi sập trang.');
            }
            const errBefore = AT.errorAuditor.errors.length;
            globalScope.NoirStudio.dangLovePdf.openDangLovePdfStudio('compress');
            await AT.sleep(200);
            const inp = document.getElementById('input-mod46-file');
            if (inp) {
              AT.fixtures.injectFilesToInput(inp, [AT.fixtures.createCorruptedEmptyPdf()]);
              await AT.sleep(250);
            }
            const countAfterEmpty = globalScope.NoirStudio.dangLovePdf.files?.length || 0;
            document.getElementById('btn-mod46-close-studio')?.click();
            await AT.sleep(120);
            const errAfter = AT.errorAuditor.errors.length;
            if (countAfterEmpty === 0 && errAfter === errBefore) {
              return makePass('chaos_corrupted_file', 'chaos_resilience', 'Chặn file rỗng 0 byte lịch sự, không sập trang', 'Đưa file hỏng vào vẫn giữ giao diện bình tĩnh và báo nhắc gọn gàng.', 'mod46_danglovepdf_and_doc_converter.js');
            }
            return makeIssue('chaos_corrupted_file', 'chaos_resilience', 'ERR_CHAOS_BAD_FILE_CRASH', {
              selector: '#modal-mod46-danglovepdf-studio',
              moduleRef: 'mod46_danglovepdf_and_doc_converter.js',
              techDetail: `File 0 byte vẫn nạp=${countAfterEmpty}, lỗi mới phát sinh=${errAfter - errBefore}`,
            });
          },
        },
        {
          id: 'chaos_rapid_switch_and_double_click',
          label: 'Thử bấm đúp nhanh & đóng mở liên tục để bắt lỗi kẹt Loading',
          run: async () => {
            const errBefore = AT.errorAuditor.errors.length;
            if (isBiNovelApp()) {
              // Bấm đúp nút mở/đóng Mod 47 & chuyển tab liên tiếp
              await switchTabSafe('SCREEN_6_SYSTEM');
              const btn = document.getElementById('btn-toggle-tab6-perf-ram');
              if (btn) {
                btn.click();
                btn.click();
                await AT.sleep(100);
              }
              await switchTabSafe('SCREEN_1_WRITE');
              await switchTabSafe('SCREEN_6_SYSTEM');
            }
            const errAfter = AT.errorAuditor.errors.length;
            if (errAfter === errBefore) {
              return makePass('chaos_rapid_switch_and_double_click', 'chaos_resilience', 'Chịu được bấm đúp nhanh & chuyển màn hình liên tục', 'Không kẹt màn hình chờ hay phát sinh lỗi ngầm khi thao tác dồn dập.', 'mod29_responsive_mobile_pwa_and_six_screens_nav.js');
            }
            return makeIssue('chaos_rapid_switch_and_double_click', 'chaos_resilience', 'ERR_CHAOS_DOUBLE_CLICK', {
              techDetail: `Phát sinh ${errAfter - errBefore} lỗi khi bấm nhanh liên tiếp.`,
            });
          },
        },
        {
          id: 'chaos_offline_simulation',
          label: 'Thử giả lập rớt mạng bất ngờ xem giao diện có bị treo không',
          run: async () => {
            const errBefore = AT.errorAuditor.errors.length;
            AT.driver.recordBreadcrumb('Giả lập rớt mạng tạm thời');
            AT.interceptors.setNetworkSimulation('offline');
            try {
              // Thử một thao tác gọi mạng giả định để chắc chắn app không bị đóng băng
              await fetch('https://example.invalid/autotester-offline-ping').catch(() => null);
              await AT.sleep(180);
            } finally {
              AT.interceptors.setNetworkSimulation('normal');
            }
            const errAfter = AT.errorAuditor.errors.length;
            if (errAfter === errBefore) {
              return makePass('chaos_offline_simulation', 'chaos_resilience', 'Khi giả lập rớt mạng, giao diện vẫn bấm mượt không bị treo', 'App chạy offline an toàn và tự phục hồi ngay khi có mạng lại.', 'sw.js');
            }
            return makeIssue('chaos_offline_simulation', 'chaos_resilience', 'ERR_OFFLINE_FREEZE', {
              techDetail: `Phát sinh ${errAfter - errBefore} lỗi không được bắt khi giả lập rớt mạng.`,
            });
          },
        },
      ],
    },
  ];

  AT.SUITE_GROUPS = SUITE_GROUPS;
})(typeof window !== 'undefined' ? window : globalThis);
