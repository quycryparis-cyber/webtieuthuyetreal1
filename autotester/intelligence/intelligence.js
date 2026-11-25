/**
 * ============================================================================
 * 🧠 AUTOTESTER ULTRA INTELLIGENCE LAYER (v118)
 * (PlainVietnameseDictionary + 30+ RuleKnowledgeBase + 5-Pillar LoopEngine)
 * ============================================================================
 * - 100% tiếng Việt đời thường trên giao diện (học sinh cấp 2 đọc hiểu ngay).
 * - Chấm điểm 5 Trụ cột: Chức năng (25) + Đồng bộ (25) + Độ mượt (20) + Giao diện (15) + Độ bền (15).
 * - Lưu 20 vòng lịch sử Delta, phát hiện Hồi quy (Regression) & xuất Đơn thuốc gửi AI.
 * ============================================================================
 */
(function initAutoTesterIntelligence(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  // 1. TỪ ĐIỂN BẮT BUỘC CHO FRONT-END (100% TIẾNG VIỆT ĐỜI THƯỜNG — CẤM TỪ CHUYÊN NGÀNH)
  const PLAIN_VI_MAP = Object.freeze({
    brand: 'Bác sĩ App',
    loadingTitle: 'Hệ thống đang tự kiểm tra, bạn chờ xíu nha...',
    loadingSub: 'Đang kiểm tra từng nút bấm, độ đồng bộ và độ mượt — bản thảo của bạn luôn được bảo vệ an toàn.',
    runAll: 'Khám tổng quát',
    runAllFull: 'Khám tổng quát toàn bộ app',
    testCurrent: 'Kiểm tra màn hình này',
    stop: 'Dừng ngay',
    recorder: 'Quay lại thao tác mẫu',
    selfHeal: 'Tự tìm nút nếu bị đổi chỗ',
    chaos: 'Thử bấm phá & nạp tệp hỏng',
    visualDiff: 'Soi giao diện bị lệch hình',
    smoothness: 'Độ mượt khi bấm & vuốt',
    memory: 'Độ nhẹ máy',
    overflowTouch: 'Khung hình & Độ dễ bấm',
    offlineSim: 'Thử lúc mất mạng & AI báo lỗi',
    regressionTitle: 'Cảnh báo: Sửa chỗ khác vô tình làm hỏng chỗ này!',
    sevP0: '🔴 Lỗi nặng (Sửa ngay)',
    sevP1: '🟠 Nên sửa sớm',
    sevP2: '🟡 Gợi ý cho mượt hơn',
    breadcrumbsBtn: 'Xem lại 15 bước trước khi hỏng',
    highlightBtn: '🎯 Chỉ thẳng chỗ bị lỗi',
    copyRxBtn: '📋 Chép đơn thuốc gửi AI sửa lỗi',
    devDetailsBtn: 'Xem chi tiết cho lập trình viên',
  });

  // 2. KHO TRI THỨC TỰ KÊ ĐƠN SỬA CODE (30+ QUY TẮC ÁNH XẠ ĐẦY ĐỦ)
  const RULE_KNOWLEDGE_BASE = Object.freeze({
    ERR_DEAD_BUTTON: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Có nút bấm bị liệt (bấm vào không ăn)',
      plainDesc: 'Bác sĩ App đã bấm thật vào nút nhưng màn hình, dữ liệu và tính năng không có phản ứng gì.',
      fixAdvice: 'Kiểm tra gắn sự kiện `addEventListener` (ưu tiên Event Delegation `closest("[data-action]")`) và kiểm tra điều kiện chặn sai trong hàm xử lý.',
    },
    ERR_I18N_UNTRANSLATED: {
      severity: 'P1',
      pillar: 'visual',
      plainTitle: 'Phát hiện chữ tiếng Việt chưa được dịch khi đổi sang 5 ngôn ngữ khác',
      plainDesc: 'Khi chuyển sang Tiếng Anh / Trung (Giản-Phồn) / Hàn / Nhật và mở các cửa sổ pop-up, vẫn còn dòng chữ tiếng Việt chưa dịch.',
      fixAdvice: 'Bổ sung các cụm chữ bị sót vào từ điển `exact` của cả 5 tệp `i18n_lang_en.js`, `i18n_lang_zh_cn.js`, `i18n_lang_zh_tw.js`, `i18n_lang_ko.js`, `i18n_lang_ja.js` và gọi `NS.i18n.translateElement(modalEl)` sau khi dựng DOM động.',
    },
    ERR_ZOMBIE_TOGGLE: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Công tắc giả (bật sáng đèn nhưng máy không chạy)',
      plainDesc: 'Nút có đổi màu khi bấm nhưng chức năng thật bên dưới không hề khởi động.',
      fixAdvice: 'Kiểm tra hàm nghiệp vụ gắn với công tắc để chắc chắn state nội bộ và engine (Audio/PiP/Canvas/Modal) thực sự được kích hoạt.',
    },
    ERR_CLICK_INTERCEPTED: {
      severity: 'P0',
      pillar: 'visual',
      plainTitle: 'Nút bấm bị khung hoặc lớp trong suốt khác che mất',
      plainDesc: 'Khi bấm vào tâm nút thì bị một lớp khác nằm đè lên trên chắn mất thao tác.',
      fixAdvice: 'Thêm `pointer-events: none` cho lớp phủ trang trí hoặc điều chỉnh lại `z-index` của phần tử đang che khuất.',
    },
    ERR_PIP_TIME_DESYNC: {
      severity: 'P0',
      pillar: 'sync',
      plainTitle: 'Cửa sổ nổi YouTube bị lệch giờ phát so với khung chính',
      plainDesc: 'Thời gian phát ở cửa sổ nổi và trình phát chính không khớp nhau hoặc nút điều khiển chưa đồng bộ.',
      fixAdvice: 'Đồng bộ Single Source of Truth `{ videoId, currentTime, isPlaying, playbackRate }` qua postMessage/hook trực tiếp giữa `mod39` và `yt_pip_frame.html`.',
    },
    ERR_DUAL_AUDIO_ECHO: {
      severity: 'P0',
      pillar: 'sync',
      plainTitle: 'Âm thanh bị phát vọng đôi từ cả 2 khung cùng lúc',
      plainDesc: 'Khi mở cửa sổ nổi mà khung gốc chưa tắt luồng phát làm 2 tiếng chồng lên nhau.',
      fixAdvice: 'Unmount hoặc chuyển `about:blank` / `mute` khung nguồn ngay khi cửa sổ nổi tiếp nhận luồng phát.',
    },
    ERR_BG_VIDEO_DESYNC: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Nền video chuyển động chưa đồng bộ với trình phát YouTube',
      plainDesc: 'Đổi trạng thái phát hoặc tắt nền video nhưng lớp nền phía sau chưa cập nhật kịp.',
      fixAdvice: 'Kiểm tra cầu nối đồng bộ giữa `mod39` và `mod40_youtube_motion_background_engine.js`, dừng hẳn rAF/iframe khi tắt nền.',
    },
    ERR_COLLAPSE_SINGLE_BROKEN: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Nút Thu gọn / Mở rộng đơn lẻ hoạt động chưa chuẩn',
      plainDesc: 'Bấm thu gọn một mục nhưng nội dung bên trong không ẩn đi hoặc không mở lại được.',
      fixAdvice: 'Đảm bảo click cập nhật đồng bộ cả class `.hidden` (chiều cao = 0) lẫn thuộc tính `aria-expanded` và mũi tên chỉ hướng.',
    },
    ERR_COLLAPSE_ALL_INCOMPLETE: {
      severity: 'P0',
      pillar: 'sync',
      plainTitle: 'Bấm "Thu gọn tất cả" vẫn còn sót mục chưa đóng',
      plainDesc: 'Một số mục con vẫn bị kẹt mở sau khi người dùng bấm nút Thu gọn tất cả.',
      fixAdvice: 'Quét đầy đủ tất cả khối có thể thu gọn trong tab/modal hiện tại và đặt đồng loạt trạng thái ẩn + `aria-expanded="false"`.',
    },
    ERR_EXPAND_ALL_INCOMPLETE: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Bấm "Mở rộng tất cả" vẫn còn mục bị ẩn chưa bung ra',
      plainDesc: 'Sau khi bấm Mở rộng tất cả vẫn còn ít nhất một mục không hiển thị nội dung.',
      fixAdvice: 'Cập nhật lại hàm Mở rộng tất cả để gỡ `.hidden` và đặt `aria-expanded="true"` cho 100% mục con.',
    },
    ERR_MASTER_TOGGLE_DESYNC: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Nút tổng Thu gọn/Mở rộng chưa tự đổi chữ khi đóng mở từng mục con',
      plainDesc: 'Đã tự tay đóng hết các mục con nhưng nút tổng vẫn ghi "Thu gọn tất cả", phải bấm 2 lần.',
      fixAdvice: 'Tính trạng thái nút tổng trực tiếp từ số mục con đang mở (`expandedCount === 0`) sau mỗi cú bấm đơn lẻ.',
    },
    ERR_MODE_CLIPBOARD_STALE: {
      severity: 'P0',
      pillar: 'sync',
      plainTitle: 'Chữ sao chép câu lệnh bị dính của chế độ cũ hoặc rỗng',
      plainDesc: 'Chuyển sang chế độ AI mới rồi bấm sao chép nhưng nội dung chép ra không khớp chế độ hiện tại.',
      fixAdvice: 'Đọc trực tiếp `activeMode` và nội dung sống từ DOM ngay lúc bấm nút Sao chép thay vì giữ biến cũ trong closure (`mod14`/`mod16`/`mod17`).',
    },
    ERR_PROMPT_STATE_DESYNC: {
      severity: 'P0',
      pillar: 'sync',
      plainTitle: 'Ô lệnh AI chưa đồng bộ với chữ mới vừa gõ',
      plainDesc: 'Vừa chỉnh sửa chữ xong nhưng bấm sao chép lại thiếu đoạn vừa thêm.',
      fixAdvice: 'Gọi đồng bộ `rich -> plain` trước khi sao chép hoặc tổng hợp Prompt tại `mod16`/`mod17`.',
    },
    ERR_CALC_DEAD_KEY: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Có phím trên máy tính Casio FX-570 bị liệt hoặc tính sai',
      plainDesc: 'Bấm thử phép tính chuẩn trên máy tính giả lập nhưng phím không ăn hoặc ra sai đáp số.',
      fixAdvice: 'Kiểm tra sự kiện bấm phím và bộ tính toán trong `mod45_scientific_fx570_and_desmos_graphing_calc.js`.',
    },
    ERR_DESMOS_CANVAS_STATIC: {
      severity: 'P1',
      pillar: 'functional',
      plainTitle: 'Khung vẽ đồ thị Desmos không có hình hoặc không phản ứng',
      plainDesc: 'Mở đồ thị hàm số nhưng khung vẽ vẫn trống trơn sau khi vẽ thử.',
      fixAdvice: 'Kiểm tra kích thước `<canvas>` (width/height > 0) và gọi lại `graph.render()` sau khi mở container trong `mod45`.',
    },
    ERR_POMO_SYNC_DRIFT: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Đồng hồ Pomodoro chính và thanh nổi góc màn hình bị lệch giờ',
      plainDesc: 'Hai chỗ hiển thị đồng hồ tập trung chạy không khớp nhau khi bấm Chạy/Tạm dừng.',
      fixAdvice: 'Đồng bộ chung 1 bộ đếm duy nhất trong `mod20_bidirectional_pomodoro_sync_engine.js` và cập nhật tức thì cả Tab 5 lẫn `#floating-pomo-time`.',
    },
    ERR_GEO_PERMISSION_STUCK: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Định vị vị trí bị kẹt vòng xoay khi từ chối quyền hoặc đổi tọa độ',
      plainDesc: 'Khi thử tắt quyền GPS, màn hình không dừng chờ hoặc không báo hướng dẫn rõ ràng.',
      fixAdvice: 'Bắt đủ mã lỗi `PERMISSION_DENIED (1)` và `TIMEOUT (3)` trong `mod42_world_clock_weather_and_alarm.js`, tắt trạng thái loading trong `finally`.',
    },
    ERR_WEATHER_SKY_DESYNC: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Nền bầu trời thời tiết 3D chưa khớp với trạng thái thời tiết',
      plainDesc: 'Đổi dữ liệu thời tiết nhưng nền bầu trời không đổi hiệu ứng tương ứng.',
      fixAdvice: 'Đảm bảo `mod42` bắn tín hiệu cập nhật sang `mod43_realtime_weather_sky_engine.js` mỗi khi thời tiết hoặc khung giờ thay đổi.',
    },
    ERR_ALARM_NOT_TRIGGERED: {
      severity: 'P0',
      pillar: 'sync',
      plainTitle: 'Đến giờ hẹn nhưng báo thức không tự kêu',
      plainDesc: 'Tua nhanh đồng hồ ảo tới đúng giờ hẹn mà báo thức không kích hoạt.',
      fixAdvice: 'Dùng so sánh mốc thời gian tuyệt đối `Date.now() >= alarm.triggerTimestamp` trong `mod42` thay vì chỉ đếm ngược tick.',
    },
    ERR_ZOMBIE_ALARM_RING: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Đã tắt báo thức nhưng chuông vẫn kêu lặp lại',
      plainDesc: 'Bấm tắt báo thức xong nhưng trạng thái hẹn giờ vẫn chưa dọn sạch.',
      fixAdvice: 'Gắn cờ `hasFired`, hủy sạch Audio/Oscillator và xóa lịch lặp khi bấm Dismiss trong `mod42`.',
    },
    ERR_CONSOLE_RUNTIME: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Có lỗi chạy ngầm khiến một phần tính năng có thể hỏng',
      plainDesc: 'Hệ thống phát hiện lỗi bất ngờ xảy ra bên dưới trong lúc bấm thao tác.',
      fixAdvice: 'Kiểm tra stack trace, bổ sung optional chaining (`?.`) và `try/catch` tại file phát sinh lỗi.',
    },
    ERR_MOBILE_OVERFLOW: {
      severity: 'P0',
      pillar: 'visual',
      plainTitle: 'Khung màn hình bị tràn ra ngoài mép phải',
      plainDesc: 'Có ô hoặc thanh nút rộng hơn màn hình khiến phải kéo ngang mới thấy hết.',
      fixAdvice: 'Thêm `min-w-0`, `max-w-full`, `overflow-x-hidden` hoặc `flex-wrap` cho phần tử vượt khung trên `@media (max-width: 768px)`.',
    },
    ERR_FLOATING_OVERLAP: {
      severity: 'P1',
      pillar: 'visual',
      plainTitle: 'Các thanh nổi góc màn hình đang đè lên nhau',
      plainDesc: 'Hai thanh công cụ nổi chạm vào nhau làm che mất nút bấm bên dưới.',
      fixAdvice: 'Tách tọa độ `bottom`/`left`/`right` riêng biệt trong `@media (max-width: 639px)` tại `index.html`.',
    },
    WARN_SMALL_TOUCH_TARGET: {
      severity: 'P2',
      pillar: 'visual',
      plainTitle: 'Có nút bấm hơi nhỏ trên điện thoại, dễ bấm trượt',
      plainDesc: 'Nút nhỏ hơn chuẩn chạm (< 28px hoặc < 32px trên Mobile 375px; < 20px trên Desktop) nên rất dễ bấm nhầm hoặc bị che chữ.',
      fixAdvice: 'Đảm bảo mọi nút tương tác trên Mobile đạt tối thiểu `32x32px` (khuyến nghị `44x44px`), font `>= 12px` và cách nút kế bên ít nhất `6–8px`.',
    },
    ERR_I18N_KEY_LEAK: {
      severity: 'P2',
      pillar: 'visual',
      plainTitle: 'Có dòng chữ bị sót mã lập trình chưa dịch',
      plainDesc: 'Phát hiện chuỗi dạng mã khóa hoặc dấu ngoặc chưa chuyển sang ngôn ngữ tự nhiên.',
      fixAdvice: 'Bổ sung chuỗi thiếu vào 5 file `i18n_lang_*.js` và kiểm tra hàm thay biến trong `mod30`.',
    },
    ERR_BROWSER_API_UNSAFE: {
      severity: 'P1',
      pillar: 'resilience',
      plainTitle: 'Một tính năng trình duyệt thiếu lớp bảo vệ cho Safari iPhone / Firefox',
      plainDesc: 'Kiểm tra năng lực đa trình duyệt phát hiện API đặc thù có thể thiếu phương án dự phòng.',
      fixAdvice: 'Bọc kiểm tra tồn tại API (`typeof ... !== "undefined"`) trước khi gọi PiP, File System Access, Wake Lock, SpeechRecognition hoặc `performance.memory`.',
    },
    WARN_MAIN_THREAD_JANK: {
      severity: 'P1',
      pillar: 'smoothness',
      plainTitle: 'Màn hình hơi bị khựng khi vuốt hoặc bấm',
      plainDesc: 'Tốc độ khung hình tụt thấp hoặc có thao tác làm máy đứng hình nhẹ trên 0.1 giây.',
      fixAdvice: 'Tách tác vụ nặng bằng `requestIdleCallback`, giảm mật độ hạt 60FPS trên di động và kích hoạt Mod 47 Auto-Sleep.',
    },
    WARN_UNREVOKED_BLOBS: {
      severity: 'P1',
      pillar: 'smoothness',
      plainTitle: 'Máy đang giữ tệp tạm trong bộ nhớ chưa dọn',
      plainDesc: 'Một số tệp ảnh hoặc PDF tạm tạo ra xong chưa được thu hồi lại RAM.',
      fixAdvice: 'Gọi `URL.revokeObjectURL(url)` trong khối `finally` ngay khi đóng xem trước hoặc chuyển tính năng.',
    },
    ERR_PDF_OUTPUT_INVALID: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Xuất hoặc nạp file PDF không thành công',
      plainDesc: 'Tệp kết quả bị rỗng hoặc sai chữ ký định dạng %PDF/ZIP/DOCX.',
      fixAdvice: 'Kiểm tra `mod46_danglovepdf_and_doc_converter.js` / `mod26` đảm bảo dung lượng > 0 byte, đúng chữ ký `%PDF` và giữ nguyên dấu tiếng Việt.',
    },
    ERR_PDF_PREVIEW_BROKEN: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Chức năng Xem trước PDF không hiển thị trang hoặc bị trắng trơn',
      plainDesc: 'Bấm Xem trước PDF sau khi xử lý nhưng khung xem trước không vẽ được hình trang PDF lên màn hình.',
      fixAdvice: 'Dùng bộ dựng PDF.js Canvas (`openInteractiveResultPreview` trong `mod46_danglovepdf_and_doc_converter.js`) thay vì `<iframe src="blob:...">` để chạy chuẩn trên cả Mobile lẫn Desktop.',
    },
    ERR_PDF_PAGE_COUNT_MISMATCH: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Số trang file PDF đầu ra bị sai lệch so với yêu cầu',
      plainDesc: 'Ví dụ gộp 2 file 2 trang nhưng kết quả không đủ đúng 4 trang hoặc tạo sổ mới bị thiếu trang.',
      fixAdvice: 'Kiểm tra vòng lặp `copyPages` / `addPage` trong `mod46_danglovepdf_and_doc_converter.js` và `mod46b_danglovepdf_pro_engines.js`.',
    },
    ERR_BENCHMARK_GAP: {
      severity: 'P1',
      pillar: 'functional',
      plainTitle: 'Còn thiếu hạng mục tiêu chuẩn so với các nền tảng lớn',
      plainDesc: 'Đối chiếu bộ chuẩn chức năng (iLovePDF, Smallpdf, Notion, Google Docs) phát hiện mục còn thiếu hoặc chưa sẵn sàng.',
      fixAdvice: 'Xem danh sách hạng mục chưa đạt trong chi tiết kỹ thuật và bổ sung vào module tương ứng.',
    },
    ERR_WORKER_CRASH: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Tiến trình xử lý nền (Web Worker) gặp sự cố đột ngột',
      plainDesc: 'Bộ xử lý chạy ngầm cho PDF hoặc OCR bị sập trong lúc vận hành.',
      fixAdvice: 'Kiểm tra đường dẫn `pdfJsWorker` / Tesseract Worker và bổ sung bắt lỗi `worker.onerror`.',
    },
    WARN_LOW_CONTRAST: {
      severity: 'P2',
      pillar: 'visual',
      plainTitle: 'Một số dòng chữ có màu quá giống màu nền, hơi khó đọc',
      plainDesc: 'Độ tương phản màu chữ so với nền thấp hơn ngưỡng dễ đọc trên màn hình.',
      fixAdvice: 'Tăng độ tương phản màu chữ/nền lên tối thiểu 4.5:1 (WCAG AA) cho cả chế độ Sáng và Tối.',
    },
    ERR_EDITOR_WORD_SYNC: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Bàn viết truyện hoặc Story Bible chưa cập nhật bộ đếm từ sau khi gõ',
      plainDesc: 'Gõ thử đoạn chữ mẫu vào trình soạn nhưng giao diện không phản ánh đúng thay đổi.',
      fixAdvice: 'Kiểm tra sự kiện `input` và hàm đồng bộ đếm từ tại `mod05` / `mod17`.',
    },
    ERR_CHAOS_BAD_FILE_CRASH: {
      severity: 'P1',
      pillar: 'resilience',
      plainTitle: 'Khi nạp file hỏng/rỗng app chưa báo lỗi lịch sự',
      plainDesc: 'Đưa file rỗng 0 byte vào mà app chưa từ chối rõ ràng hoặc phát sinh lỗi ngầm.',
      fixAdvice: 'Kiểm tra `file.size === 0` và Magic Bytes đầu file trước khi nạp parser, báo toast tiếng Việt rõ ràng.',
    },
    ERR_CHAOS_DOUBLE_CLICK: {
      severity: 'P1',
      pillar: 'resilience',
      plainTitle: 'Bấm đúp siêu nhanh có nguy cơ chạy trùng 2 lần',
      plainDesc: 'Thao tác bấm liên tiếp tạo ra lỗi hoặc kẹt trạng thái đóng/mở.',
      fixAdvice: 'Bổ sung cờ khóa `isBusy` hoặc debounce cho nút xử lý bất đồng bộ.',
    },
    ERR_OFFLINE_FREEZE: {
      severity: 'P1',
      pillar: 'resilience',
      plainTitle: 'Khi mất mạng hoặc máy chủ báo lỗi, giao diện chưa xử lý gọn',
      plainDesc: 'Giả lập rớt mạng hoặc lỗi API 429/500 gây lỗi không được bắt gọn.',
      fixAdvice: 'Bọc mọi lệnh `fetch()` bằng `try/catch` + `AbortController` timeout và hiện thông báo tiếng Việt thân thiện.',
    },
    ERR_XSS_UNESCAPED: {
      severity: 'P0',
      pillar: 'resilience',
      plainTitle: 'Ô nhập liệu có nguy cơ thực thi mã lạ khi dán chữ đặc biệt',
      plainDesc: 'Dán thử chuỗi thẻ kịch bản mẫu và phát hiện dấu hiệu thực thi ngoài ý muốn.',
      fixAdvice: 'Luôn escape HTML (`<`, `>`, `"`, `\'`) hoặc dùng `textContent` thay vì `innerHTML` cho dữ liệu người dùng nhập.',
    },
    ERR_CHATBOT_PINGPONG: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Trợ lý AI Viên Bi Số 8 trả lời chưa đúng ngữ cảnh trang web',
      plainDesc: 'Hỏi về tính năng trang web nhưng trợ lý lại từ chối hoặc đẩy qua chế độ khác.',
      fixAdvice: 'Kiểm tra `classifyChatMessageIntent` trong `mod27_mascot_bi_so_8_and_dual_chat_assistant.js`.',
    },
    ERR_MISSING_COPY_SELECT_ALL: {
      severity: 'P1',
      pillar: 'functional',
      plainTitle: 'Khung câu lệnh / Đầu ra / Story Bible thiếu nút Chọn tất cả hoặc Sao chép tất cả',
      plainDesc: 'Chưa thấy đủ cả 2 nút Chọn tất cả và Sao chép tất cả trên khung soạn thảo.',
      fixAdvice: 'Kiểm tra `V115WordRichEditorProSuite` trong `mod17_tab3_five_modes_output_controller.js`.',
    },
    WARN_VISUAL_SHIFT: {
      severity: 'P2',
      pillar: 'visual',
      plainTitle: 'Giao diện có khối bị lệch vị trí so với lần khám chuẩn trước',
      plainDesc: 'Một khung chính đã dịch chuyển mạnh so với lần chụp mẫu trước đó.',
      fixAdvice: 'Đối chiếu CSS bố cục tại phần tử bị dịch chuyển để tránh xô lệch ngoài ý muốn.',
    },
    WARN_SELF_HEAL_DRIFT: {
      severity: 'P2',
      pillar: 'functional',
      plainTitle: 'Một nút bấm đã đổi mã nhưng Bác sĩ App vẫn tự tìm được',
      plainDesc: 'Nút vẫn chạy bình thường, chỉ cần cập nhật lại mã định danh để kiểm tra nhanh hơn.',
      fixAdvice: 'Cập nhật lại selector hoặc `data-testid` của nút đã thay đổi.',
    },
    ERR_DOMAIN_LOGIC_GAP: {
      severity: 'P1',
      pillar: 'functional',
      plainTitle: 'Logic nghiệp vụ cốt lõi của một module chưa khớp yêu cầu thiết kế',
      plainDesc: 'Kiểm tra sâu nội bộ cho thấy công thức phân loại, bộ đếm phút, bộ từ vựng đầy đủ, liên kết báo chí hoặc hộp thoại thoát chưa khớp chuẩn.',
      fixAdvice: 'Kiểm tra lại logic module tương ứng (`mod12`/`mod16`/`mod18`/`mod39`/`mod46`/`mod49`/`mod50`/`mod51` hoặc `noir_exit_guard.js`).',
    },
    ERR_HIDDEN_DB_CORRUPT: {
      severity: 'P0',
      pillar: 'resilience',
      plainTitle: 'Dữ liệu lưu ngầm (IndexedDB / localStorage / Cache) bị hỏng hoặc nghẽn đọc ghi',
      plainDesc: 'Khi thử đọc/ghi kiểm chứng bộ nhớ ngầm hoặc phân tích JSON cấu hình, phát hiện dữ liệu lỗi hoặc gần cạn dung lượng lưu trữ.',
      fixAdvice: 'Kiểm tra `mod04_indexeddb_storage_and_emergency_vault.js`, bọc `JSON.parse` an toàn và dọn key tạm dư thừa.',
    },
    ERR_API_CONTRACT_BROKEN: {
      severity: 'P1',
      pillar: 'sync',
      plainTitle: 'Bộ đọc dữ liệu API / RSS / lá chắn Gemini xử lý sai định dạng ngầm',
      plainDesc: 'Khi nạp dữ liệu thiếu trường hoặc phản hồi bất thường từ API, bộ phân tích ngầm chưa trả về cấu trúc an toàn.',
      fixAdvice: 'Kiểm tra schema parser tại `mod49` (`researchAndPromptEngine.js`), `mod50` (`wisdomEngine.js`) và `interceptors` của Autotester.',
    },
    ERR_SECURITY_RISK: {
      severity: 'P0',
      pillar: 'resilience',
      plainTitle: 'Phát hiện rủi ro bảo mật cơ bản (XSS / Rò rỉ API Key / Link không an toàn)',
      plainDesc: 'Kiểm tra an toàn dữ liệu cho thấy nguy cơ thực thi HTML chưa escape, rò khóa API ra bản xuất, hoặc liên kết thiếu `noopener`.',
      fixAdvice: 'Dùng `NS.utils.escapeHtml()`, lọc URL chỉ cho phép `http(s):`, không chép khóa API vào file xuất và gắn `rel="noopener noreferrer"`.',
    },
  });

  // 3. ĐỘNG CƠ CHẤM ĐIỂM 5 TRỤ CỘT + LỊCH SỬ 20 VÒNG + PHÁT HIỆN HỒI QUY + ĐƠN THUỐC AI
  const HISTORY_KEY = '__autotester_history_v1__';
  const SNAPSHOT_KEY = '__autotester_layout_baseline_v1__';

  class ImprovementLoopEngine {
    loadHistory() {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (_e) {
        return [];
      }
    }

    saveRun(summary) {
      const hist = this.loadHistory();
      hist.push(summary);
      const trimmed = hist.slice(-20);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      } catch (_e) {}
      return trimmed;
    }

    clearHistory() {
      try {
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem(SNAPSHOT_KEY);
      } catch (_e) {}
    }

    computeReport(results, perfStats, breadcrumbs, kpis = {}) {
      const prevHist = this.loadHistory();
      const prevRun = prevHist.length ? prevHist[prevHist.length - 1] : null;
      const runNumber = (prevRun?.runNumber || 0) + 1;

      const passed = results.filter((r) => r.status === 'PASS');
      const issues = results.filter((r) => r.status !== 'PASS');

      // Chấm điểm 5 trụ cột theo đặc tả Ultra: Chức năng 25, Đồng bộ 25, Độ mượt 20, Giao diện 15, Độ bền 15
      let pFunc = 25;
      let pSync = 25;
      let pSmooth = 20;
      let pVisual = 15;
      let pResil = 15;

      for (const it of issues) {
        const sev = it.severity || 'P2';
        const pen = sev === 'P0' ? 9 : sev === 'P1' ? 5 : 2;
        if (it.pillar === 'functional') pFunc = Math.max(0, pFunc - pen);
        else if (it.pillar === 'sync') pSync = Math.max(0, pSync - pen);
        else if (it.pillar === 'smoothness') pSmooth = Math.max(0, pSmooth - pen);
        else if (it.pillar === 'visual') pVisual = Math.max(0, pVisual - pen);
        else if (it.pillar === 'resilience') pResil = Math.max(0, pResil - pen);
      }

      if (perfStats.minFps > 0 && perfStats.minFps < 30) pSmooth = Math.max(0, pSmooth - 4);
      if (perfStats.longTasks > 2) pSmooth = Math.max(0, pSmooth - 3);
      if (perfStats.unrevokedBlobs > 3) pSmooth = Math.max(0, pSmooth - 3);

      const totalScore = Math.max(0, Math.min(100, Math.round(pFunc + pSync + pSmooth + pVisual + pResil)));
      const scoreDelta = prevRun ? totalScore - Number(prevRun.totalScore || 0) : 0;

      const prevPassedIds = new Set(prevRun?.passedIds || []);
      const prevFailedIds = new Set(prevRun?.failedIds || []);
      const regressions = issues.filter((it) => prevPassedIds.has(it.id));
      const fixedSincePrev = passed.filter((it) => prevFailedIds.has(it.id));

      const sevRank = { P0: 0, P1: 1, P2: 2 };
      issues.sort((a, b) => (sevRank[a.severity] ?? 3) - (sevRank[b.severity] ?? 3));

      const report = {
        runNumber,
        timestamp: Date.now(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        isMobile: window.innerWidth < 768,
        browserSignature: this._detectBrowserSignature(),
        totalScore,
        scoreDelta,
        pillars: {
          functional: { score: pFunc, max: 25, label: 'Đúng chức năng' },
          sync: { score: pSync, max: 25, label: 'Đồng bộ' },
          smoothness: { score: pSmooth, max: 20, label: 'Độ mượt' },
          visual: { score: pVisual, max: 15, label: 'Dễ bấm' },
          resilience: { score: pResil, max: 15, label: 'Bền bỉ' },
        },
        kpis: {
          buttonsTested: kpis.buttonsTested || 0,
          deadButtonsFound: kpis.deadButtonsFound || 0,
          syncPassed: results.filter((r) => r.pillar === 'sync' && r.status === 'PASS').length,
          syncTotal: results.filter((r) => r.pillar === 'sync').length,
        },
        passed,
        issues,
        regressions,
        fixedSincePrev,
        perfStats,
        breadcrumbs: (breadcrumbs || []).slice(-15),
        passedIds: passed.map((x) => x.id),
        failedIds: issues.map((x) => x.id),
      };

      this.saveRun({
        runNumber: report.runNumber,
        timestamp: report.timestamp,
        totalScore: report.totalScore,
        viewport: report.viewport,
        passedCount: passed.length,
        issueCount: issues.length,
        passedIds: report.passedIds,
        failedIds: report.failedIds,
      });

      return report;
    }

    _detectBrowserSignature() {
      const ua = navigator.userAgent || '';
      const eng = /Edg\//i.test(ua)
        ? 'Edge'
        : /Firefox/i.test(ua)
          ? 'Firefox'
          : /Safari/i.test(ua) && !/Chrome|Chromium/i.test(ua)
            ? 'Safari'
            : 'Chrome';
      const dev = window.innerWidth < 768 ? 'Mobile' : 'Desktop';
      return `${eng}-${dev}`;
    }

    buildAiPatchPrompt(report) {
      if (!report) return 'Chưa có kết quả khám để xuất đơn thuốc.';
      const deltaTxt =
        report.runNumber > 1
          ? ` (${report.scoreDelta >= 0 ? '↑ +' : '↓ '}${report.scoreDelta} điểm so với Vòng #${String(report.runNumber - 1).padStart(2, '0')})`
          : '';
      const fixedTxt = report.fixedSincePrev.length
        ? report.fixedSincePrev.map((x) => `\`${x.id}\``).join(', ')
        : 'Vòng đầu tiên / giữ ổn định';
      const regTxt = report.regressions.length
        ? `⚠️ PHÁT HIỆN ${report.regressions.length} LỖI HỒI QUY: ` +
          report.regressions.map((x) => `\`${x.code || x.id}\` (${x.plainTitle})`).join('; ')
        : 'Không có lỗi mới tái phát.';

      const p0 = report.issues.filter((i) => i.severity === 'P0');
      const p1 = report.issues.filter((i) => i.severity === 'P1');
      const p2 = report.issues.filter((i) => i.severity === 'P2');

      const fmtGroup = (list) =>
        list.length
          ? list
              .map(
                (i, idx) =>
                  `### ${idx + 1}. ${i.plainTitle} (\`${i.code}\`)\n` +
                  `- **File liên quan:** \`${i.moduleRef || 'app'}\`\n` +
                  (i.selector ? `- **Phần tử / CSS Selector:** \`${i.selector}\`\n` : '') +
                  `- **Số liệu đo thật:** ${i.techDetail || i.plainDesc}\n` +
                  `- **Yêu cầu sửa code:** ${i.fixAdvice || RULE_KNOWLEDGE_BASE[i.code]?.fixAdvice || 'Kiểm tra và xử lý triệt để.'}`
              )
              .join('\n\n')
          : '- Không ghi nhận mục nào.';

      const p = report.pillars;
      const vpSimLabel = AT.viewportSim?.isSimulated?.() ? ` [Đang giả lập ${AT.viewportSim.mode === 'mobile' ? 'Mobile 375x812' : 'Desktop 1280x800'}]` : '';
      return [
        `# ĐƠN THUỐC SỬA LỖI & TỐI ƯU TỰ ĐỘNG TỪ AUTOTESTER ULTRA (VÒNG LẶP #${String(report.runNumber).padStart(2, '0')})`,
        `- **Môi trường kiểm thử:** ${report.browserSignature} (${report.viewport}px${vpSimLabel})`,
        `- **Điểm sức khỏe tổng:** ${report.totalScore}/100${deltaTxt}`,
        `- **5 Trụ cột:** Chức năng ${p.functional.score}/${p.functional.max} | Đồng bộ ${p.sync.score}/${p.sync.max} | Độ mượt ${p.smoothness.score}/${p.smoothness.max} | Giao diện ${p.visual.score}/${p.visual.max} | Độ bền ${p.resilience.score}/${p.resilience.max}`,
        `- **Chỉ số thật:** Nút đã kiểm: ${report.kpis.buttonsTested} (Liệt: ${report.kpis.deadButtonsFound}) · Đồng bộ đạt: ${report.kpis.syncPassed}/${report.kpis.syncTotal} · FPS TB ${report.perfStats.avgFps} (Thấp nhất ${report.perfStats.minFps}) · Long Tasks: ${report.perfStats.longTasks} · Blob chưa dọn: ${report.perfStats.unrevokedBlobs}${report.perfStats.ramMb ? ` · RAM: ${report.perfStats.ramMb} MB` : ''}`,
        `- **Tiến bộ từ vòng trước:** ${fixedTxt}`,
        `- **Cảnh báo hồi quy (Regression):** ${regTxt}`,
        '',
        '## [TIÊU CHUẨN ĐO LƯỜNG NGHIÊM NGẶT DÀNH CHO AI SỬA CODE]',
        '- **Ngưỡng Tràn Ngang (`ERR_MOBILE_OVERFLOW`):** Sai số `<= 2px` trên Mobile (`375px`), `<= 4px` trên Desktop; mọi nút/nhãn KHÔNG được vượt mép phải `viewport`, KHÔNG được cắt chữ (`scrollWidth > clientWidth + 6px` với `nowrap`).',
        '- **Ngưỡng Nút Bấm (`WARN_SMALL_TOUCH_TARGET` / `ERR_DEAD_BUTTON`):** Mọi nút Mobile phải rộng/cao `>= 28px` (chuẩn `>= 36–44px`), Desktop `>= 20px`; mọi nút kích hoạt an toàn đều phải phản ứng DOM/Trạng thái (`>= 1` tín hiệu nhân quả) & pass Hit-Test (`ERR_CLICK_INTERCEPTED`).',
        '- **Ngưỡng Độ Mượt & Bộ Nhớ (`WARN_MAIN_THREAD_JANK` / `WARN_UNREVOKED_BLOBS`):** `FPS TB >= 45 FPS`, `Long Tasks (>50ms) = 0`, `Blob chưa dọn = 0` (mọi PDF.js dùng `disableCreateObjectURL: true`, manifest/WAV dùng Data URI hoặc revoke trong `finally`).',
        '- **Ngưỡng Đa Ngôn Ngữ (`ERR_I18N_UNTRANSLATED`):** 0 chữ Việt sót lại trên 5 gói ngôn ngữ (`EN/zh-CN/zh-TW/KO/JA`), kể cả tiêu đề pop-up Mod 42/46/47/49/50/51.',
        '',
        '## [ƯU TIÊN 1 — P0: LỖI NẶNG, LIỆT NÚT & LỆCH ĐỒNG BỘ CẦN SỬA NGAY]',
        fmtGroup(p0),
        '',
        '## [ƯU TIÊN 2 — P1: TĂNG ĐỘ MƯỢT, ĐỒNG BỘ & ĐỘ BỀN]',
        fmtGroup(p1),
        '',
        '## [ƯU TIÊN 3 — P2: TỐI ƯU FRONT-END, MOBILE & ĐA NGÔN NGỮ]',
        fmtGroup(p2),
        '',
        '## [15 BƯỚC THAO TÁC GẦN NHẤT (BREADCRUMBS)]',
        ...(report.breadcrumbs.length
          ? report.breadcrumbs.map((b, idx) => `${idx + 1}. [${b.time}] ${b.action}`)
          : ['- Không có bước nào ghi nhận.']),
        '',
        `## TIÊU CHÍ NGHIỆM THU CHO VÒNG LẶP #${String(report.runNumber + 1).padStart(2, '0')}`,
        `1. Giữ nguyên toàn bộ ${report.passed.length} mục đang PASS (0 hồi quy).`,
        `2. Xử lý dứt điểm ${p0.length} lỗi P0 và ${p1.length} cảnh báo P1.`,
        '3. Nâng FPS tối thiểu >= 45 FPS, Long Tasks = 0, Blob chưa dọn = 0, 0 nút liệt, 0 lệch đồng bộ và 0 tràn ngang trên cả Mobile 375px lẫn Desktop 1280px.',
      ].join('\n');
    }
  }

  AT.PLAIN_VI_MAP = PLAIN_VI_MAP;
  AT.RULE_KNOWLEDGE_BASE = RULE_KNOWLEDGE_BASE;
  AT.DETECTION_STANDARDS = Object.freeze({
    MOBILE_OVERFLOW_TOLERANCE_PX: 2,
    DESKTOP_OVERFLOW_TOLERANCE_PX: 4,
    MOBILE_MIN_TOUCH_TARGET_PX: 28,
    MOBILE_IDEAL_TOUCH_TARGET_PX: 44,
    DESKTOP_MIN_TOUCH_TARGET_PX: 20,
    CLIPPED_TEXT_TOLERANCE_PX: 6,
    LONG_TASK_MS: 50,
    TARGET_FPS: 45,
    MAX_UNREVOKED_BLOBS: 0,
  });
  AT.SNAPSHOT_KEY = SNAPSHOT_KEY;
  AT.loopEngine = new ImprovementLoopEngine();
})(typeof window !== 'undefined' ? window : globalThis);
