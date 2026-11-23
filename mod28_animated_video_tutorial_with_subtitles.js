/**
 * ============================================================================
 * NOIR STUDIO v38.0 — MODULE 28: VIDEO HƯỚNG DẪN TƯƠNG TÁC CÓ PHỤ ĐỀ CHI TIẾT,
 * SƠ ĐỒ TÍNH NĂNG A-Z, NHẬT KÝ ĐẠI TU & CẨM NANG MÔ HÌNH AI MỚI NHẤT
 * ============================================================================
 * Nhiệm vụ:
 *  - Xây dựng Trình phát Video Hoạt Họa 60FPS trực tiếp bằng HTML5 Canvas
 *    minh họa trực quan từng màn hình, quy trình 2 bước AI, Chế độ 5 vẽ sơ đồ,
 *    Google Docs Diff Review, Pomodoro đồng bộ 2 chiều & Kho Phiên Bản Tab 6.
 *  - Đồng bộ Phụ Đề Tiếng Việt theo từng giây (cùng Bảng Lời Thoại Có Thể Bấm
 *    Để Tua Nhanh đến đúng giây cần xem), tùy chỉnh tốc độ 0.75x - 1.5x.
 *  - Cung cấp Nhật ký Đại tu v38.0 chi tiết từng bản vá lỗi, Bảng đối chiếu
 *    các dòng mô hình Gemini mới nhất & Bộ phím tắt tối ưu cho Desktop/Mobile.
 * ============================================================================
 */
(function initMod28TutorialAndChangelog(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  /**
   * Danh sách 28 phân đoạn video chi tiết (~14:00) bao quát toàn bộ 45 Module & tính năng mới nhất (Mod 01 -> Mod 45).
   */
  const VIDEO_TUTORIAL_CHAPTERS_DATA = Object.freeze([
    {
      id: 'CHAP_01_ENTRY_GATE_AND_ARCHITECTURE',
      index: 1,
      title: '1. Cổng Kết Nối Đầu Vào, Ủng Hộ Đăng, Tải App PWA & 6 Màn Hình (Mod 01-05, 29, 30, 35)',
      durationSec: 30,
      startSec: 0,
      endSec: 30,
      accentColor: '#10b981',
      badgeLabel: 'CỔNG KẾT NỐI · TẢI APP PWA · MOD 01-05 · MOD 29-30',
      sceneType: 'SIX_SCREENS_MAP',
      summary:
        'Giới thiệu cụm nút đầu cổng ("Web do Mai Hải Đăng (Bi) phát triển", nút to nổi bật "Ủng hộ Đăng để Đăng có động lực phát triển web :D", nút "Tải App về thiết bị ngay"), xác thực API Key 3 tầng & 6 Tab.',
      keyActionSteps: [
        'Ngay phía trên Cổng Kết Nối An Toàn là cụm nút tác giả Mai Hải Đăng (Bi), nút "☕ Ủng hộ Đăng để Đăng có động lực phát triển web :D" nổi bật và nút "📲 Tải App về thiết bị ngay".',
        'Dán Gemini API Key (bấm Xác thực Flash-Lite) & Chọn thư mục ổ cứng thật (Mod 04-05) hoặc dùng trên Mobile PWA để bật sao lưu 3 tầng.',
        'Chọn gói Standard / Pro / Ultra tương ứng AI và chuyển nhanh giữa 6 Tab độc lập bằng phím Alt+1..6 hoặc thanh đáy điện thoại.',
      ],
    },
    {
      id: 'CHAP_02_TAB1_EDITOR_DIFF_SENSORY',
      index: 2,
      title: '2. Tab 1: Soạn Thảo, Tạo Chương Nhanh, Diff AI Google Docs & Ngũ Quan (Mod 11, 22-25)',
      durationSec: 30,
      startSec: 30,
      endSec: 60,
      accentColor: '#14b8a6',
      badgeLabel: 'TAB 1 · MOD 11 · MOD 22 · MOD 23 · MOD 24 · MOD 25',
      sceneType: 'TAB1_DIFF_REVIEW',
      summary:
        'Bàn viết chuẩn trang sách, tạo chương 1 chạm, chuẩn hóa ngoặc thoại Việt (Mod 23), duyệt chữ AI theo từng cụm màu kiểu Google Docs (Mod 11), Ngũ quan, Anti-Cliché & Lore Whisper (Mod 24-25).',
      keyActionSteps: [
        'Bấm "➕ Tạo Chương Mới" ngay trên thanh đầu Tab 1 hoặc mở thanh công cụ bổ trợ khi cần soát từ sáo rỗng AI (Mod 24).',
        'Khi AI bổ sung văn bản, từng đoạn AI thêm hiện màu riêng kiểu Google Docs để bạn bấm Chấp nhận hoặc Từ chối từng cụm (Mod 11).',
        'Mở Từ điển Ngũ quan & Lời tác giả, thanh Lore Whisper tự hiện nhẹ khi gõ tên nhân vật + mục tiêu chữ hằng ngày (Mod 25).',
      ],
    },
    {
      id: 'CHAP_03_TAB2_CHAPTERS_IMPORT_BM25',
      index: 3,
      title: '3. Tab 2: Lọc Nháp/Duyệt, Nạp Hàng Loạt DOCX/PDF/TXT & Tìm BM25 0 Token (Mod 06-09)',
      durationSec: 30,
      startSec: 60,
      endSec: 90,
      accentColor: '#f59e0b',
      badgeLabel: 'TAB 2 · MOD 06 · MOD 07 · MOD 08 · MOD 09',
      sceneType: 'TAB2_CHAPTER_RAG',
      summary:
        'Lọc chính xác chương Nháp / Đã duyệt / Tất cả, nút Duyệt bên trái tiện bấm, nạp tách chương từ DOCX/PDF/TXT (Mod 06) & tra cứu ký ức cũ BM25 0 đồng Token (Mod 07).',
      keyActionSteps: [
        'Bấm nút lọc "Nháp" chỉ hiện chương Nháp, "Đã duyệt" chỉ hiện chương Đã duyệt, "Tất cả" hiện toàn bộ và đổi tên chương trực tiếp (Mod 08).',
        'Mở "Công cụ & Lọc" để nạp hàng loạt tệp .DOCX, .PDF, .TXT tự tách từng chương vào kho IndexedDB (Mod 06).',
        'Tra cứu kỷ vật, lời hứa hay tình tiết trăm chương trước trong 0.1 giây bằng công cụ BM25 hoàn toàn miễn phí 0 Token API (Mod 07).',
      ],
    },
    {
      id: 'CHAP_04_TAB3_AI_STUDIO_HYDROGEN4',
      index: 4,
      title: '4. Tab 3: Gemini 4 Hydrogen (#1), Tư Duy XHIGH, Quotas & Hộp Lệnh Thu Phóng (Mod 02, 15, 17)',
      durationSec: 32,
      startSec: 90,
      endSec: 122,
      accentColor: '#22d3ee',
      badgeLabel: 'TAB 3 · GEMINI 4 HYDROGEN · MOD 02 · MOD 15 · MOD 17',
      sceneType: 'TWO_STEP_PROMPT',
      summary:
        'Gemini 4 Hydrogen đứng đầu danh sách khuyến nghị với 4 mức tư duy LOW/MEDIUM/HIGH/XHIGH, bộ đếm hạn mức 5h/tuần, tự lọc ký tự Markdown & cửa sổ lệnh Mở to / Thu nhỏ.',
      keyActionSteps: [
        'Chọn ngay Gemini 4 Hydrogen (đề xuất #1) cùng mức tư duy XHIGH / Cao / Trung bình / Thấp tùy độ phức tạp cảnh truyện (Mod 02 & Mod 15).',
        'Trong Hộp Lệnh AI, bấm nút "⛶ Mở to / 🗗 Thu nhỏ" và đóng mở từng ngăn thông số gọn gàng; nhấn Enter để xác nhận chạy (Mod 16).',
        'Hệ thống tự xóa sạch ký tự **, ###, --- thừa khỏi đầu ra AI và phát thông báo khi viết xong để bạn bấm Xem Bản Mới Nhất Ngay (Mod 17).',
      ],
    },
    {
      id: 'CHAP_05_TAB3_FIVE_MODES_DISTINCT',
      index: 5,
      title: '5. Tab 3: 5 Chế Độ Tách Biệt & Chế Độ 5 Vẽ Sơ Đồ Cốt Truyện SVG (Mod 13-14, 16, 18)',
      durationSec: 32,
      startSec: 122,
      endSec: 154,
      accentColor: '#818cf8',
      badgeLabel: '5 CHẾ ĐỘ ĐỘC LẬP · MOD 13 · MOD 14 · MOD 16 · MOD 18',
      sceneType: 'MODE5_PLOT_GRAPH',
      summary:
        'Chế độ 1 là chế độ duy nhất tổng hợp Story Bible + Mốc POV + Dàn ý Mode 2 + Câu lệnh viết chương; Chế độ 2, 3, 4, 5 chạy thẳng câu lệnh chuyên biệt độc lập.',
      keyActionSteps: [
        'Chế độ 1 (Viết truyện): Duy nhất chạy Prompt Tổng Hợp hai bước; nếu Mode 2 chưa có gợi ý diễn biến, hệ thống nhắc bạn nhảy sang Mode 2 trước.',
        'Chế độ 2 (Gợi ý cốt truyện): Kết hợp luật viết & đối chiếu Story Bible để brainstorm mạch truyện mạch lạc rồi tự động đưa vào Chế độ 1.',
        'Chế độ 3 (Soi Logic), Chế độ 4 (Độc giả khó tính) & Chế độ 5 (Vẽ Sơ đồ SVG Timeline xuất PNG/SVG - Mod 18) hoạt động tách biệt gọn nhẹ.',
      ],
    },
    {
      id: 'CHAP_06_TAB4_BIBLE_NOTEBOOKLM',
      index: 6,
      title: '6. Tab 4: Hỏi Cập Nhật Bible Sau Duyệt, NotebookLM & Flash Bóc Tách (Mod 12, 19)',
      durationSec: 32,
      startSec: 154,
      endSec: 186,
      accentColor: '#ec4899',
      badgeLabel: 'TAB 4 · STORY BIBLE · NOTEBOOKLM · MOD 12 · MOD 19',
      sceneType: 'TAB4_BIBLE_MATRIX',
      summary:
        'Mở song song Khung Mẫu (Box 1) & Bible Chính Thức (Box 2), hộp thoại xác nhận cập nhật Bible lũy tiến sau khi duyệt chương kèm chỉ dẫn Google NotebookLM.',
      keyActionSteps: [
        'Ngay sau khi duyệt chương mới, hộp thoại hỏi bạn có muốn cập nhật Story Bible từ đầu tới chương mới nhất hay mở Google NotebookLM đồng bộ.',
        'Dùng 2 link gạch chân bấm trực tiếp để tải PDF gộp toàn truyện lên NotebookLM, copy prompt chuẩn rồi dán ngược kết quả vào Box 2.',
        'Gemini Flash tự động bóc tách cập nhật Hồ sơ Nhân vật Đa Chiều, Ma trận Ai Biết Gì, Sổ cái Phục bút & Manh mối ngay bên dưới (Mod 12).',
      ],
    },
    {
      id: 'CHAP_07_TAB5_POMODORO_AUDIO_TYPO',
      index: 7,
      title: '7. Tab 5 Mục 1–3: Nút Thu Gọn/Mở Rộng Rõ Ràng, Điểm Danh, Pomodoro & Nhạc A-B (Mod 20-22, 38)',
      durationSec: 30,
      startSec: 186,
      endSec: 216,
      accentColor: '#f97316',
      badgeLabel: 'TAB 5 MỤC 1-3 · MOD 20 · MOD 21 · MOD 22 · MOD 38',
      sceneType: 'POMODORO_TWO_WAY_SYNC',
      summary:
        '5 ô lớn ở Tab 5 nâng cấp thành nút bấm chữ rõ ràng ("Đang thu gọn, bấm vào để mở rộng" / "Đang mở rộng, bấm vào để thu gọn"), kèm Điểm danh, Pomodoro 2 chiều & Nhạc A-B.',
      keyActionSteps: [
        'Chú ý nút trạng thái rõ nét ở góc mỗi mục lớn Tab 5: bấm để chuyển đổi giữa "Đang thu gọn, bấm vào để mở rộng" và "Đang mở rộng, bấm vào để thu gọn".',
        'Mục Điểm danh & Pomodoro (Mod 20, 38): Chạy, Tạm dừng hoặc Reset ở Tab 5 hay trên thanh Pomodoro nổi đều đồng bộ chung 1 bộ đếm.',
        'Mục Nhạc & Chữ (Mod 21-22): Pha 7 âm thanh tự nhiên, phát MP3 lặp đoạn A-B, chỉnh Font Light Novel & đèn vàng 3400K dịu mắt.',
      ],
    },
    {
      id: 'CHAP_08_TAB5_BACKDROP_MOD32',
      index: 8,
      title: '8. Tab 5 Mục 4: 8 Nền Nghệ Thuật (Đen/Trắng OLED), Tải Ảnh/Video & Mod 32 Kính Mờ',
      durationSec: 30,
      startSec: 216,
      endSec: 246,
      accentColor: '#a855f7',
      badgeLabel: 'TAB 5 MỤC 4 · MODULE 32 · INDEXEDDB',
      sceneType: 'ARGON_WEB_AND_AMBIENT_STAGE',
      summary:
        '6 tranh nền tự sinh 0MB + Nền Đen Tối Giản OLED & Nền Trắng Tối Giản, giữ nút "Soi Rõ Nền 100%" và lưu ảnh/video nền bền vững trong IndexedDB.',
      keyActionSteps: [
        'Chọn nhanh 1 trong 6 bức tranh thủy mặc 0MB, Nền Đen OLED kịt hoặc Nền Trắng tinh khôi, hoặc tải tệp ảnh/video riêng của bạn.',
        'Bảng Module 32 tinh chỉnh Độ trong kính (88% / 72% / 58%), độ mờ và độ sáng để chữ viết luôn nổi bật trên nền nghệ thuật.',
        'Hiệu ứng Hạt ánh sáng, Mưa rơi trên kính, Đèn lồng hay Đom đóm (Mod 22) kết hợp hòa quyện sau lớp kính mờ xuyên sáng.',
      ],
    },
    {
      id: 'CHAP_09_TAB5_YOUTUBE_MOD39',
      index: 9,
      title: '9. Tab 5 Ô #5 (Mod 39 & 40): Thanh Tìm Kiếm Lớn, Khóa Loop Livestream & Crop Nền Video Tùy Chỉnh',
      durationSec: 36,
      startSec: 246,
      endSec: 282,
      accentColor: '#ef4444',
      badgeLabel: 'TAB 5 Ô #5 · HERO SEARCH · KHÓA LIVE LOOP · CROP NỀN MOD 40',
      sceneType: 'ARGON_WEB_AND_AMBIENT_STAGE',
      summary:
        'Thanh tìm kiếm YouTube cực lớn đặt nổi bật ngay dưới Ô Lớn #5 cùng nút Tìm/Phát & Dán Link (gọn gàng không trùng tiêu đề). Tự khóa Loop cho Livestream và hỗ trợ Căn chỉnh/Crop vùng nền Video tùy chọn Có/Không ép full-screen!',
      keyActionSteps: [
        'Gõ từ khóa hoặc bấm "📋 Dán Link" ngay tại thanh Hero Search cực lớn dưới Ô Lớn #5 — phát sạch KHÔNG QUẢNG CÁO qua youtube-nocookie.com.',
        'Video thường đủ Toàn màn hình, Repeat, Lặp A–B, Tốc độ, Tua ±10s; riêng luồng phát trực tiếp (Livestream) tự khóa Repeat & A–B kèm chỉ dẫn rõ ràng.',
        'Đặt làm Background web không còn nút che ở giữa; bấm "✂️ Căn chỉnh / Crop vùng nền" rồi chọn Có (tự ép tràn full-screen) hoặc Không (giữ đúng khung crop + viền đen).',
      ],
    },
    {
      id: 'CHAP_10_ARGON4_WEB_20K_BRIDGE',
      index: 10,
      title: '10. Cầu Nối 20.000+ Từ: Copy Prompt Tổng & Chạy Gemini Web Argon 4 / Carbon 4 (Mod 32)',
      durationSec: 28,
      startSec: 282,
      endSec: 310,
      accentColor: '#34d399',
      badgeLabel: 'MOD 32 · ARGON 4 PRO · CARBON 4 ULTRA',
      sceneType: 'TWO_STEP_PROMPT',
      summary:
        'Trên cả hộp thoại Duyệt Prompt lẫn Màn hình Đang Chạy AI, bấm đường link bôi đậm gạch chân để chép trọn Prompt Tổng và mở thẳng Gemini Web.',
      keyActionSteps: [
        'Cần viết đại tự sự sâu trên 20.000+ từ một mạch? Hãy bấm thẳng dòng link gạch chân "ấn vào đây để copy toàn bộ prompt tổng hợp".',
        'Ngay kế bên là link bôi đậm gạch chân dẫn thẳng tới Gemini Web (hoặc ứng dụng Gemini của bạn) để dán prompt chạy liền tay.',
        'Lưu ý gói Google AI: Nâng cấp gói Pro để mở khóa Argon 4, và gói Ultra để chạy Carbon 4 với chiều sâu phân tích tối đa (Mod 33).',
      ],
    },
    {
      id: 'CHAP_11_MASCOT_BI8_DUAL_CHAT',
      index: 11,
      title: '11. Linh Vật Viên Bi Số 8 (3D Cute) & Trợ Lý Chat Kép Flash-Lite (Mod 27)',
      durationSec: 28,
      startSec: 310,
      endSec: 338,
      accentColor: '#6366f1',
      badgeLabel: 'MOD 27 · LINH VẬT BI SỐ 8 · FLASH-LITE',
      sceneType: 'SIX_SCREENS_MAP',
      summary:
        'Viên Bi Số 8 bản vẽ 3D long lanh góc dưới phải (có nút X nhỏ ở góc trái để đóng), mặc định Flash-Lite tiết kiệm quota và tích hợp 2 chế độ hỗ trợ.',
      keyActionSteps: [
        'Khi thu gọn, góc màn hình chỉ hiển thị hình Viên Bi Số 8 cười rạng rỡ với nút X nhỏ trên góc trái; chạm vào Viên Bi để mở khung Chat.',
        'Trợ lý mặc định dùng Gemini 3.5 Flash-Lite giúp phản hồi siêu nhanh & tiết kiệm quota mà không làm thay đổi model viết chương Tab 3.',
        'Dùng Chế độ 1 (Tìm nút & phóng sáng chỉ đường trong web) hoặc Chế độ 2 (Lắc Bi Tiên Tri, Đặt tên, Bẻ lái Plot Twist, Tạo nhân vật 3D).',
      ],
    },
    {
      id: 'CHAP_12_TAB6_EXPORT_PDF_DOCX_VERSIONS',
      index: 12,
      title: '12. Tab 6: Bảo Chứng Kết Nối, Time-Machine Preview, Xuất PDF/DOCX/EPUB & JSON (Mod 10, 26, 33)',
      durationSec: 32,
      startSec: 338,
      endSec: 370,
      accentColor: '#38bdf8',
      badgeLabel: 'TAB 6 · MOD 10 · MOD 26 · MOD 33',
      sceneType: 'VERSION_VAULT_AND_PDF',
      summary:
        'Giao diện Tab 6 chia khối đóng mở gọn; kiểm tra API Key & Folder 6 tầng (Mod 33), khôi phục bản cũ bằng Diff Preview (Mod 10) & xuất sách chuyên nghiệp (Mod 26).',
      keyActionSteps: [
        'Ô "Trạng thái kết nối API và thư mục gốc": Xác nhận thực chất API Key, thư mục ổ cứng và nút Kiểm định 6 tầng không bao giờ báo sai (Mod 33).',
        'Ô "Xuất PDF / DOCX & Kho Phiên Bản": Soi lại bản thảo quá khứ qua Preview toàn màn hình (Mod 10) và xuất .DOCX/.PDF chọn Font, cỡ pt, tên sách, bút danh (Mod 26).',
        'Hỗ trợ Đồng bộ sang máy khác bằng tệp gói .ZIP / .JSON hoặc Google Drive giữ trọn truyện, Story Bible và cài đặt cá nhân.',
      ],
    },
    {
      id: 'CHAP_13_TAB6_ENCYCLOPEDIA_VIDEO_AI_BAR',
      index: 13,
      title: '13. Tab 6: Bách Khoa 45 Module (Mod 31), Video Toàn Màn Hình & Giọng AI 6 Ngôn Ngữ (Mod 28, 33)',
      durationSec: 28,
      startSec: 370,
      endSec: 398,
      accentColor: '#10b981',
      badgeLabel: 'MOD 28 · MOD 31 · MOD 33 · 45 MODULE',
      sceneType: 'SIX_SCREENS_MAP',
      summary:
        'Tra cứu mọi tính năng của cả 45 Module kèm nút "Đi tới & Làm nổi bật", xem Video phóng to Toàn màn hình với phụ đề nằm riêng dưới khung video & giọng AI 6 ngôn ngữ (Neural + Google Dịch TTS).',
      keyActionSteps: [
        'Bách khoa toàn thư (Mod 31): Gõ từ khóa bất kỳ để tìm trong toàn bộ 45 Module và bấm 1 chạm nhảy thẳng tới đúng nút trên giao diện.',
        'Video Hướng Dẫn (Mod 28): Bấm Xem Toàn Màn Hình, phụ đề luôn nằm tách rời dưới khung video, không bao giờ che hình ảnh.',
        'Động cơ Giọng AI 6 Ngôn Ngữ (Mod 33): Hỗ trợ trọn vẹn Việt, Anh, Trung Giản/Phồn, Hàn, Nhật qua Neural & Google Dịch TTS miễn phí, tắt tiếng dứt điểm khi Mute.',
      ],
    },
    {
      id: 'CHAP_14_TAB6_BUG_RELAY_CREDITS_SHIELD',
      index: 14,
      title: '14. Tab 6: Báo Lỗi Google Sheets (Mod 34), QR Donate (Mod 35) & Sức Khỏe 3 Tầng Portrait (Mod 09)',
      durationSec: 28,
      startSec: 398,
      endSec: 426,
      accentColor: '#fbbf24',
      badgeLabel: 'MOD 09 PORTRAIT · MOD 34 · MOD 35 VIETQR · MOD 36–38',
      sceneType: 'VERSION_VAULT_AND_PDF',
      summary:
        'Nút Báo lỗi gọn sạch, nút Mai Hải Đăng ("Bi") & VietQR "MỌI NGƯỜI TÙY TÂM NHA 😇" tối ưu cả Mobile/Offline, cùng bảng Sức Khỏe 3 Tầng mở rộng hiển thị chân dung tác giả "đang theo dõi bạn :))"!',
      keyActionSteps: [
        'Báo cáo Bug (Mod 34) gửi gọn về Google Sheets; cụm góc phải có Author Credits, nút Ủng hộ Đăng cà phê ☕ (QR căn giữa chuẩn cả trên Mobile) và nút Chuyển Ngôn Ngữ ngay bên dưới.',
        'Bấm cụm trạng thái góc trái thanh Header để mở bảng Sức Khỏe Hệ Thống Tự Lưu 3 Tầng (Mod 09) cỡ lớn kèm chân dung Mai Hải Đăng + mũi tên "Tác giả Đăng đẹp trai đang theo dõi bạn :))".',
        'Mod 36 (Khiên Chống Reload 7 tầng) và Mod 37–38 chạy âm thầm bảo vệ toàn vẹn dữ liệu, không gây vướng víu giao diện.',
      ],
    },
    {
      id: 'CHAP_15_GUEST_MODE_AND_JSON_PERSISTENCE',
      index: 15,
      title: '15. Guest Mode (Nhảy Thẳng Tab 5 & Nhấp Nháy 4s YouTube/MP3) + Lưu Trạng Thái JSON (Mod 41)',
      durationSec: 32,
      startSec: 426,
      endSec: 458,
      accentColor: '#facc15',
      badgeLabel: 'GUEST MODE · MOD 41 · NHẢY THẲNG TAB 5 · SPOTLIGHT 4 GIÂY',
      sceneType: 'SIX_SCREENS_MAP',
      summary:
        'Bấm Guest Mode là vào thẳng Tab 5 và nhấp nháy nổi bật 4 giây đúng 2 khung Xem YouTube & Phát MP3 (không cần API hay Thư mục), an toàn tuyệt đối trên RAM & dùng đủ 5 chế độ AI mô phỏng!',
      keyActionSteps: [
        'Tại Cổng Kết Nối, bấm nút xám Guest Mode ("Dành cho các bạn xem youtube, nghe nhạc hoặc set background nền...").',
        'Hệ thống điều hướng thẳng tới Tab 5 và làm nổi bật nhấp nháy trong 4 giây 2 chức năng Phát Nhạc MP3 & Tìm/Xem YouTube sạch quảng cáo.',
        'Khi dùng kho thật trên ổ cứng, tệp _studio_workspace_state.json tự động lưu trạng thái hiện tại của trang web (tab, cài đặt, nền, đồng hồ) để lần sau mở lại khôi phục nguyên vẹn.',
      ],
    },
    {
      id: 'CHAP_16_WORLD_CLOCK_TIMEZONE_ALARM',
      index: 16,
      title: '16. Khung Giờ Quốc Tế Đầu Trang, Định Dạng Ngày Giờ & Báo Thức MP3 / Hệ Thống (Mod 42)',
      durationSec: 32,
      startSec: 458,
      endSec: 490,
      accentColor: '#fb923c',
      badgeLabel: 'MOD 42 · ĐỒNG HỒ SỐNG · MÚI GIỜ · BÁO THỨC MP3',
      sceneType: 'WEATHER_CLOCK_ALARM_STAGE',
      summary:
        'Đồng hồ trực tiếp nằm gọn dưới tên trang web (có link gạch chân mở nhanh cả ở màn hình Cổng Kết Nối lẫn thanh đầu trang), hỗ trợ chọn múi giờ quốc tế, đổi định dạng & đặt báo thức MP3.',
      keyActionSteps: [
        'Bấm dòng chữ gạch chân "Bấm vào đây để chỉnh múi giờ, đặt báo thức và xem thời tiết" ngay trên thanh đầu trang hoặc dưới khung Cổng Kết Nối.',
        'Đổi múi giờ thế giới (Hà Nội GMT+7, Tokyo, London, New York...) và tùy chỉnh kiểu hiển thị 24h/12h hay định dạng ngày tháng.',
        'Trong thẻ Báo Thức, đặt giờ/phút (ô giây có thể bỏ trống mặc định :00), chọn chuông hệ thống hoặc dùng MP3 riêng (kể cả lấy trực tiếp từ Tab 5!).',
      ],
    },
    {
      id: 'CHAP_17_REALTIME_WEATHER_SKY_60FPS',
      index: 17,
      title: '17. Động Cơ Thời Tiết Thời Gian Thực & Bầu Trời 60FPS (6 Khung Giờ × 28 WMO) (Mod 43)',
      durationSec: 34,
      startSec: 490,
      endSec: 524,
      accentColor: '#38bdf8',
      badgeLabel: 'MOD 43 · THỜI TIẾT REAL-TIME · 168 BIẾN THỂ BẦU TRỜI',
      sceneType: 'WEATHER_CLOCK_ALARM_STAGE',
      summary:
        'Cập nhật thời tiết thật theo vị trí GPS/thành phố, đồng bộ bình minh/hoàng hôn Open-Meteo qua 6 khung giờ ánh sáng và mô phỏng 28 mã thời tiết WMO mượt mà 60FPS phủ nền toàn trang web.',
      keyActionSteps: [
        'Khung Thời Tiết hiển thị nhiệt độ, gió, độ ẩm hiện tại kèm màn hình mô phỏng 60FPS trực quan (mưa phùn, sấm sét, tuyết rơi, sương mù, 90 sao đêm...).',
        'Chọn "🌦️ Background Thời Tiết Hiện Tại (Real-Time)" để nền web tự biến đổi theo thời tiết thực tế & 6 khung giờ (Bình minh -> Đêm).',
        'Hoặc chọn tùy chỉnh bất kỳ trong 168 tổ hợp (6 khung giờ × 28 WMO), nạp thư mục backgrounds/ riêng và kéo thanh Độ rõ / Độ mờ / Độ sáng / Xuyên thấu chữ.',
      ],
    },
    {
      id: 'CHAP_18_MOBILE_BACKGROUND_AUDIO_MINI_SCREEN',
      index: 18,
      title: '18. Phát Nhạc & YouTube Trong Nền Điện Thoại/App + Màn Hình Thu Nhỏ Kéo Thả Về Tab 5 (Mod 21, 39, 40)',
      durationSec: 30,
      startSec: 524,
      endSec: 554,
      accentColor: '#f43f5e',
      badgeLabel: 'PHÁT TRONG NỀN · MEDIA SESSION · MÀN HÌNH THU NHỎ KÉO THẢ',
      sceneType: 'MINI_PLAYER_AND_TRAFFIC_STAGE',
      summary:
        'Tối ưu đặc biệt cho điện thoại và bản App tải về: tắt màn hình điện thoại, chuyển app khác vẫn nghe trọn MP3 & âm thanh YouTube via MediaSession; kéo thả màn hình thu nhỏ khắp màn hình & chạm để quay lại Tab 5!',
      keyActionSteps: [
        'Khi phát MP3 hay video YouTube ở Tab 5, kích hoạt Phát Trong Nền giúp điện thoại tắt màn hình hoặc rời khỏi web/app vẫn phát liên tục kèm điều khiển khóa màn hình (MediaSession).',
        'Khi chuyển sang Tab viết truyện khác hoặc đóng bớt khung, một Màn Hình Thu Nhỏ (YouTube / Nền / Nhạc) nổi gọn gàng trên màn hình.',
        'Bạn có thể giữ và kéo di chuyển Màn Hình Thu Nhỏ đi bất kỳ đâu trên cả Laptop lẫn Điện thoại; bấm vào màn hình thu nhỏ để quay ngay về đúng mục tương ứng ở Tab 5!',
      ],
    },
    {
      id: 'CHAP_19_PWA_APP_INSTALL_AND_PORTRAIT_ICONS',
      index: 19,
      title: '19. Cài App PWA 1-Chạm 4 Thẻ Thiết Bị, Bộ Icon Chân Dung & QR Donate Mobile (Mod 29, 35, 37)',
      durationSec: 20,
      startSec: 554,
      endSec: 574,
      accentColor: '#2dd4bf',
      badgeLabel: 'PWA 4 THẺ TRỰC TIẾP · ICON CHÂN DUNG · MOD 29 · MOD 37',
      sceneType: 'MINI_PLAYER_AND_TRAFFIC_STAGE',
      summary:
        'Bấm thẳng vào 1 trong 4 lựa chọn thiết bị (Laptop/PC, Mở từ thư mục, Android, Safari iOS) để cài hoặc tải tệp App ngay lập tức với trọn bộ icon chân dung sắc nét.',
      keyActionSteps: [
        'Trong cửa sổ Tải App, có thể bấm trực tiếp vào cả 4 thẻ thiết bị (Laptop/PC, Laptop file://, Android, iPhone/iPad Safari) để kích hoạt cài đặt / tải về ngay.',
        'Toàn bộ biểu tượng app, favicon trình duyệt, thẻ tác giả và khung Sức Khỏe 3 Tầng dùng thống nhất ảnh chân dung "Web viết tiểu thuyết và giải trí".',
        'Cửa sổ QR "MỌI NGƯỜI TÙY TÂM NHA 😇" tự nạp ảnh nội bộ khi ngoại tuyến và căn chuẩn hoàn hảo trên màn hình điện thoại.',
      ],
    },
    {
      id: 'CHAP_20_MOD44_TRAFFIC_BOX_SUMMARY',
      index: 20,
      title: '20. Thống Kê Truy Cập Đồng Bộ Toàn Cầu v3 (Mod 44) & Bộ 6 Ngôn Ngữ Quốc Tế (5 File JS)',
      durationSec: 18,
      startSec: 574,
      endSec: 592,
      accentColor: '#22d3ee',
      badgeLabel: 'MOD 44 GLOBAL V3 · 6 NGÔN NGỮ (EN/简体/繁體/KO/JA) · 45 MODULE',
      sceneType: 'MINI_PLAYER_AND_TRAFFIC_STAGE',
      summary:
        'Thống kê truy cập đồng bộ toàn cầu chuẩn xác mọi thiết bị từ gốc v3, cùng nút Đổi 6 Ngôn Ngữ (Tiếng Việt + Anh/Trung Giản/Đài Loan/Hàn/Nhật) đặt ngay dưới nút Ủng hộ Đăng & đầu trang Mobile/Desktop!',
      keyActionSteps: [
        'Ô Thống Kê Truy Cập Tab 6 dùng máy chủ đếm chung (bi-novel-quycry-v3) nên Toàn lịch sử, Năm, Tháng, Tuần, Hôm nay & Đang truy cập thống nhất chuẩn xác giữa mọi máy.',
        'Bấm nút "🌐 Tiếng Việt ▾" ngay dưới nút "Ủng hộ Đăng cà phê ☕", ở góc phải thanh Header (Desktop & Mobile) hoặc đầu Cổng để đổi sang EN, 简体中文, 繁體中文, 한국어 hoặc 日本語 mà không ảnh hưởng nội dung truyện.',
        'Toàn hệ sinh thái 45 Module + 5 module ngôn ngữ vận hành mượt mà responsive trên mọi thiết bị Desktop, Mobile & App PWA!',
      ],
    },
    {
      id: 'CHAP_21_V46_STREAM_FONTSCALE_MISC',
      index: 21,
      title: '21. Luồng Phát Trực Tiếp / PiP, Đồng Bộ Nền YouTube, Cỡ Chữ Toàn Web & Mục #5 Linh Tinh (v46)',
      durationSec: 30,
      startSec: 592,
      endSec: 622,
      accentColor: '#a855f7',
      badgeLabel: 'NATIVE PIP · BG VIDEO SYNC · SYSTEM FONT SCALE · CHỨC NĂNG LINH TINH',
      sceneType: 'MINI_PLAYER_AND_TRAFFIC_STAGE',
      summary:
        'Nâng cấp phát YouTube mượt mà trên cả Mobile & Desktop (Repeat/A-B không đen màn hình, đồng bộ phát/dừng/tua sang Background, System PiP), Cỡ Chữ Hệ Thống 4 mức & Mục #5 Chức Năng Linh Tinh + Chuỗi điểm danh!',
      keyActionSteps: [
        'Khi bấm Lặp video (Repeat) hoặc Lặp đoạn A–B trên YouTube, trình phát giữ nguyên luồng đang chạy không bị đen hay gián đoạn; Video Background tự động khớp Tạm dừng / Phát tiếp / Tua theo khung chính.',
        'Đổi Cỡ Chữ Toàn Web (Nhỏ · Bình thường · To · Rất to) trực tiếp trên Thanh Header hoặc Tab 5/Tab 6; giữ chuỗi Điểm danh 7/21/90/365 ngày nhận huy hiệu Tiểu thuyết gia.',
        'Khám phá Ô #5 "Chức năng linh tinh" ở Tab 6 (giữa Ô 4 và Tải App) với SaLưới mini game, kỷ niệm đời đầu & chế độ đa ngôn ngữ đầy đủ kể cả khung Prompt và định dạng ngày giờ bản địa!',
      ],
    },
    {
      id: 'CHAP_22_YT_MP3_BACKGROUND_SYNC',
      index: 22,
      title: '22. YouTube Tự Động Nối Hạ Tầng MP3 Mục 3 Để Phát Nền & Hộp Thoại Ưu Tiên Âm Thanh (Mod 39 & 21)',
      durationSec: 30,
      startSec: 622,
      endSec: 652,
      accentColor: '#10b981',
      badgeLabel: 'MỤC 5 ➔ MỤC 3 MP3 NỀN · ĐỒNG BỘ 2 CHIỀU · XUNG ĐỘT THÔNG MINH',
      sceneType: 'MINI_PLAYER_AND_TRAFFIC_STAGE',
      summary:
        'Mặc định phát âm thanh YouTube qua hạ tầng MP3 Mục 3 để thoát trình duyệt/tắt màn hình vẫn nghe ổn định; đồng bộ Tạm dừng/Phát/Tua 2 chiều, tự dừng bài cũ khi đổi video & hỏi xác nhận khi bật MP3 máy.',
      keyActionSteps: [
        'Chọn bất kỳ video YouTube nào ở Tab 5 Ô #5: khung hình lên ngay đồng thời luồng tiếng tự động nối thẳng sang động cơ MP3 Mục 3 (nghe nền cực ổn định khi chuyển ứng dụng hoặc khóa màn hình).',
        'Mọi thao tác Dừng / Phát tiếp / Tua ±10s / Kéo thanh thời gian đều đồng bộ 2 chiều theo thời gian thực giữa khung hình YouTube và âm thanh Mục 3; đổi sang video khác sẽ tự tắt tiếng video cũ.',
        'Nếu bạn đang mở video YouTube mà bấm nghe một bản nhạc MP3 riêng trên máy tại Mục 3, hộp thoại sẽ hỏi xác nhận có tắt YouTube để chuyển sang nghe bản nhạc đó hay không.',
      ],
    },
    {
      id: 'CHAP_23_AUTOSAVE_EVERY_2S_AND_UI_STATE',
      index: 23,
      title: '23. Tự Động Lưu 3 Tầng Mỗi 2 Giây & Khi Đổi Trạng Thái: Văn Bản, Gấp/Mở Mục, Nhạc & Tab',
      durationSec: 30,
      startSec: 652,
      endSec: 682,
      accentColor: '#38bdf8',
      badgeLabel: 'TỰ LƯU MỖI 2 GIÂY · LƯU GẤP/MỞ KHỐI · LƯU TAB & VỊ TRÍ CUỘN',
      sceneType: 'VERSION_VAULT_AND_PDF',
      summary:
        'Mọi thay đổi như gõ/xóa chữ, thu gọn hay mở rộng bảng, dừng/tắt YouTube hay MP3, chọn ngôn ngữ/cỡ chữ và vị trí Tab cuối đều tự lưu sau tối đa 2 giây & lúc rời trang.',
      keyActionSteps: [
        'Gõ hoặc xóa chữ trong bản thảo Tab 1: bộ tự lưu 3 tầng (IndexedDB + Két sắt + Thư mục máy tính) cập nhật tự động sau 2 giây và lưu ngay trước khi đóng tab.',
        'Mọi thao tác Thu gọn / Mở rộng các bảng chức năng ở Tab 1, 2, 5, 6 đều được ghi nhớ y nguyên cho lần mở lại kế tiếp.',
        'Trạng thái đang phát hoặc đã tắt Video YouTube / Nhạc MP3, cũng như Tab đang mở & vị trí cuộn cuối cùng trước khi rời trang đều được khôi phục chính xác.',
      ],
    },
    {
      id: 'CHAP_24_SIMPLIFIED_ENTRY_GATE_AND_NOTICES',
      index: 24,
      title: '24. Cổng Khởi Đầu Tinh Gọn 2 Bước, Cuộn Mượt PC/Mobile & Bảng Thông Báo Từ Google Sheet (Mod 34)',
      durationSec: 30,
      startSec: 682,
      endSec: 712,
      accentColor: '#f59e0b',
      badgeLabel: 'CỔNG VÀO GỌN SẠCH · CUỘN MƯỢT PC/MOBILE · POPUP THÔNG BÁO GOOGLE SHEET',
      sceneType: 'VERSION_VAULT_AND_PDF',
      summary:
        'Rút gọn nút "Mở Google Studio lấy mã", lược bỏ phần chọn thư mục thừa, cuộn trọn từ trên xuống dưới trên laptop & điện thoại cùng popup thông báo từ Google Sheet sau khi vào.',
      keyActionSteps: [
        'Tại Cổng Kết Nối trên cả Laptop và Điện thoại, thanh cuộn mượt tới tận đáy để nhập API Key ("Mở Google Studio lấy mã") và bấm chọn Thư mục làm việc một bước duy nhất.',
        'Các nút điều khiển YouTube được tối ưu chống rung giật/nháy sáng khi đang chạy hay đồng bộ.',
        'Sau khi vào trang (kể cả Chế Độ Khách hay Chế Độ Đầy Đủ), bảng Thông Báo Bảo Trì / Tin Nhắn Admin từ Google Sheet tự động bật đúng lịch hẹn giờ & thời lượng quy định.',
      ],
    },
    {
      id: 'CHAP_25_MOBILE_FULLSCREEN_UI_NO_TOP_CLIP',
      index: 25,
      title: '25. Giao Diện Mobile Không Cắt Đỉnh & Rạp Video Toàn Màn Hình Tương Thích Cả Mobile/Desktop',
      durationSec: 30,
      startSec: 712,
      endSec: 742,
      accentColor: '#a855f7',
      badgeLabel: 'MOBILE KHÔNG MẤT ĐỈNH · POPUP AN TOÀN · FULLSCREEN VIDEO MOB/PC',
      sceneType: 'MINI_PLAYER_AND_TRAFFIC_STAGE',
      summary:
        'Cố định chiều cao thực VisualViewport giúp thanh trên cùng & mọi popup không bao giờ bị mất mép trên khi bật bàn phím hay thu phóng chữ; rạp Video Hướng Dẫn Tab 6 phóng to vừa khít cả điện thoại dọc/ngang và máy tính!',
      keyActionSteps: [
        'Trên điện thoại Android/iOS (Brave, Chrome, Safari), thanh Header đỉnh & phần trên các Tab 1–6 luôn hiển thị trọn vẹn, tuyệt đối không bị tụt hay cắt mất phần trên khi đổi Tab hoặc mở bàn phím.',
        'Tất cả cửa sổ popup, hộp Mở to / Thu nhỏ AI, Crop video & Lịch sử đều cuộn mượt từ đỉnh xuống đáy, không bao giờ che khuất nút "✕ Đóng".',
        'Ngay trong Rạp Video Hướng Dẫn Tab 6 này, nút "⛶ Xem toàn màn hình" tự căn tỷ lệ 16:9 khít khung trên cả Điện thoại dọc, Điện thoại ngang lẫn Desktop kèm đầy đủ phụ đề & thanh tua phía dưới!',
      ],
    },
    {
      id: 'CHAP_26_FOCUS_MODE_TREE_SPLIT_HIERARCHY',
      index: 26,
      title: '26. Viết Tập Trung, Cây Chương Nhanh, Thanh AI Bôi Đen, Chia Cột Split & Kéo Thả Quyển/Chương/Cảnh (Mod 08, 11, 23, 25)',
      durationSec: 32,
      startSec: 742,
      endSec: 774,
      accentColor: '#10b981',
      badgeLabel: 'VIẾT TẬP TRUNG · CÂY CHƯƠNG · THANH AI BÔI ĐEN · PHÂN CẤP QUYỂN/CẢNH',
      sceneType: 'TAB1_DIFF_REVIEW',
      summary:
        'Bàn viết Tab 1 bổ sung chế độ 🎯 Viết Tập Trung, thanh trượt 📚 Cây Chương chuyển nhanh, ⚡ Split đối chiếu 2 màn hình, Thanh AI Bôi Đen sửa văn tại chỗ và Tab 2 kéo thả Quyển → Chương → Cảnh!',
      keyActionSteps: [
        'Trên Tab 1, bấm 🎯 Viết Tập Trung để ẩn toàn bộ thanh phụ, hoặc mở 📚 Cây Chương / ⚡ Split để vừa xem dàn ý & Story Bible song song khi gõ.',
        'Bôi đen bất kỳ đoạn văn nào trên Tab 1 để hiện ngay Thanh AI Bôi Đen: viết tiếp, tả sâu ngũ quan, rút gọn câu hay kiểm tra sáo ngữ trong 1 chạm.',
        'Tại Tab 2 (Mod 08), gom chương vào từng Quyển / Phần và chia nhỏ Cảnh (Scene), hỗ trợ kéo thả sắp xếp trực quan kèm lọc trạng thái chính xác.',
      ],
    },
    {
      id: 'CHAP_27_DESKTOP_YT_SPEED4X_WEATHER24H_LOCAL',
      index: 27,
      title: '27. Desktop YouTube Trực Tiếp (0.25x–4x, Cửa Sổ Nổi, YTSave), Thời Tiết 24h Cấp Phường & Xuất Sách 100% Nội Bộ (Mod 26, 39, 42, 43)',
      durationSec: 32,
      startSec: 774,
      endSec: 806,
      accentColor: '#06b6d4',
      badgeLabel: 'DESKTOP YOUTUBE 0.25x-4x · CỬA SỔ NỔI · YTSAVE · 24H CẤP PHƯỜNG · LOCAL-FIRST',
      sceneType: 'WEATHER_CLOCK_ALARM_STAGE',
      summary:
        'Desktop & App Desktop phát thẳng youtube-nocookie.com siêu mượt với tốc độ 0.25x–4x, Cửa sổ nổi, Mobile tự nhảy dấu : khi nhập A–B, popup YTSave mới, dự báo 24h từng giờ cấp phường & xuất PDF/DOCX/EPUB 100% nội bộ!',
      keyActionSteps: [
        'Trên Desktop/App Desktop, YouTube phát thẳng mượt mà không cần dò luồng công cộng; chọn tốc độ 0.25x–4x, bấm 🖼️ Cửa sổ nổi, nhập A–B trên điện thoại tự nhảy qua dấu : sau 2 chữ số và tải video nhanh qua hộp hướng dẫn YTSave.',
        'Thời tiết (Mod 43) dự báo ngắn hạn đủ 24 giờ gần nhất theo từng giờ (00:00 → 23:00) kèm định vị rõ tới cấp Phường/Xã; tab Múi giờ (Mod 42) tách gọn chỉ quản lý giờ & định dạng.',
        'Xuất sách PDF / DOCX / EPUB (Mod 26), tìm kiếm BM25 & mọi công cụ xử lý văn bản đều chạy 100% trực tiếp trên máy người dùng (kiểu Local-First tốc độ tức thì không gửi file lên server).',
      ],
    },
    {
      id: 'CHAP_28_MOD45_CASIO_DESMOS_VOICE6LANG',
      index: 28,
      title: '28. Module 45: Casio fx-570VN PLUS & Đồ Thị Desmos Local + AI Nói 6 Ngôn Ngữ (Google Dịch TTS) (Mod 09, 28, 33, 45)',
      durationSec: 34,
      startSec: 806,
      endSec: 840,
      accentColor: '#f59e0b',
      badgeLabel: 'MODULE 45 CASIO FX-570VN+ & DESMOS · AI NÓI 6 THỨ TIẾNG · 45 MODULE',
      sceneType: 'MINI_PLAYER_AND_TRAFFIC_STAGE',
      summary:
        'Ra mắt Module 45 (Tab 6 Mục #5 Linh Tinh & Credit): Máy tính Casio fx-570VN PLUS đầy đủ SHIFT/ALPHA/SOLVE/Tích phân/Ma trận + Đồ thị Desmos 100% Local, cùng giọng đọc AI 6 thứ tiếng (Google Dịch TTS) & Tự lưu 2 giây toàn diện!',
      keyActionSteps: [
        'Vào Tab 6 → Ô #5 "Chức năng linh tinh" → Mục 6 "Máy tính đồ thị" (hoặc nút trong Credit) để dùng Casio fx-570VN PLUS đầy đủ phép toán khoa học + bấm "Tạo hàm đồ thị" vẽ đồ thị tương tác kiểu Desmos 100% nội bộ không cần mạng!',
        'Chọn bất kỳ trong 6 ngôn ngữ giọng đọc AI (Tiếng Việt, English, 中文 简体, 中文 繁體, 한국어, 日本語) ngay trên Rạp Video Hướng Dẫn hoặc Trợ lý AI — tự động phát mượt qua Neural Voice hoặc Google Dịch TTS!',
        'Trọn bộ 45 Module + Tự lưu mỗi 2 giây ghi nhớ mọi trạng thái người dùng (bản thảo, con trỏ, tab, nhạc, cài đặt) sẵn sàng đồng hành cùng tác giả trên Desktop, Mobile & App PWA!',
      ],
    },
  ]);

  /**
   * Hệ thống Phụ Đề Song Ngữ Việt / Anh đồng bộ 100% toàn bộ 20 phân đoạn video (54 câu chi tiết, 09:52).
   */
  const SYNCHRONIZED_SUBTITLE_TRACK_V38 = Object.freeze([
    {
      id: 'SUB_01',
      chapterId: 'CHAP_01_ENTRY_GATE_AND_ARCHITECTURE',
      startSec: 0,
      endSec: 10.0,
      speaker: 'Cổng Kết Nối & Nút Ủng Hộ Đăng',
      speakerEn: 'Entry Gate & Creator Bar',
      text: 'Chào mừng bạn tới Web Viết Tiểu Thuyết Của Bi với bộ biểu tượng chân dung mới! Ngay đầu cổng là nút Mai Hải Đăng (Bi), nút to Ủng hộ Đăng và nút Tải App về thiết bị ngay.',
      textEn: 'Welcome to Bi’s Light Novel Studio with the new portrait icon set! Right at the top sit Mai Hai Dang credits, the prominent Support Dang button, and the Install App button.',
    },
    {
      id: 'SUB_02',
      chapterId: 'CHAP_01_ENTRY_GATE_AND_ARCHITECTURE',
      startSec: 10.0,
      endSec: 20.0,
      speaker: 'Mod 01-05 & Liên Kết Nhanh',
      speakerEn: 'Kernel & Quick Utility',
      text: 'Dán Gemini API Key, chọn thư mục ổ cứng để bật lưu 3 tầng, chọn gói Standard/Pro/Ultra và bấm link ngay dưới để chỉnh múi giờ, đặt báo thức, xem thời tiết.',
      textEn: 'Link your Gemini API Key and local folder for 3-tier backup, pick Standard/Pro/Ultra, or click the quick link right below for timezone, alarm, and weather.',
    },
    {
      id: 'SUB_03',
      chapterId: 'CHAP_01_ENTRY_GATE_AND_ARCHITECTURE',
      startSec: 20.0,
      endSec: 30.0,
      speaker: '6 Màn Hình Tách Biệt (Mod 29-30)',
      speakerEn: '6-Screen Architecture',
      text: 'Bên trong chia gọn 6 Tab độc lập cho Web & App PWA; nhấn Alt cộng 1 đến 6 trên máy tính hoặc chạm thanh đáy trên điện thoại để chuyển Tab tức thì.',
      textEn: 'Inside, 6 clean dedicated tabs keep Desktop & Mobile PWA crisp; press Alt+1..6 on keyboard or tap the bottom bar on phones to switch instantly.',
    },
    {
      id: 'SUB_04',
      chapterId: 'CHAP_02_TAB1_EDITOR_DIFF_SENSORY',
      startSec: 30.0,
      endSec: 40.0,
      speaker: 'Tab 1 Bàn Viết (Mod 22-23)',
      speakerEn: 'Tab 1 Book Editor',
      text: 'Tại Tab 1, bấm "Tạo Chương Mới" ngay thanh đầu, gõ trên khung sách êm mắt và tự động chuẩn hóa ngoặc thoại kiểu tiểu thuyết chỉ với 1 chạm.',
      textEn: 'In Tab 1, click New Chapter right in the top bar, write in a calm book-like canvas, and auto-format Light Novel dialogue quotes with one click.',
    },
    {
      id: 'SUB_05',
      chapterId: 'CHAP_02_TAB1_EDITOR_DIFF_SENSORY',
      startSec: 40.0,
      endSec: 50.0,
      speaker: 'Duyệt AI Kiểu Google Docs (Mod 11)',
      speakerEn: 'Google Docs AI Diff',
      text: 'Khi AI viết tiếp hoặc biên tập chương, từng đoạn AI sửa được tô màu riêng biệt để bạn bấm Chấp nhận hoặc Từ chối từng cụm giống hệt Google Docs.',
      textEn: 'When AI expands or revises prose, new lines render in distinct diff colors so you can Accept or Reject each hunk just like Google Docs.',
    },
    {
      id: 'SUB_06',
      chapterId: 'CHAP_02_TAB1_EDITOR_DIFF_SENSORY',
      startSec: 50.0,
      endSec: 60.0,
      speaker: 'Ngũ Quan & Lore Whisper (Mod 24-25)',
      speakerEn: 'Sensory & Lore Whisper',
      text: 'Khung công cụ bổ trợ có Từ điển Ngũ quan gợi tả sinh động, máy quét sáo ngữ AI và thanh Lore Whisper tự nhắc hồ sơ khi bạn gõ tên nhân vật.',
      textEn: 'Open the helper tools for the Sensory Dictionary, Anti-Cliché Scanner, daily word goals, and Lore Whisper surfacing character facts as you type.',
    },
    {
      id: 'SUB_07',
      chapterId: 'CHAP_03_TAB2_CHAPTERS_IMPORT_BM25',
      startSec: 60.0,
      endSec: 70.0,
      speaker: 'Tab 2 Chương & Bộ Lọc (Mod 08)',
      speakerEn: 'Tab 2 Smart Filters',
      text: 'Sang Tab 2, nút Duyệt & Chốt nằm gọn bên trái; bấm lọc Nháp chỉ hiện chương Nháp, bấm Đã duyệt chỉ hiện chương Đã duyệt và đổi tên chương trực tiếp.',
      textEn: 'In Tab 2, the Approve button sits cleanly on the left; filter Draft, Approved, or All chapters accurately and rename any chapter inline.',
    },
    {
      id: 'SUB_08',
      chapterId: 'CHAP_03_TAB2_CHAPTERS_IMPORT_BM25',
      startSec: 70.0,
      endSec: 80.0,
      speaker: 'Nạp Hàng Loạt & BM25 (Mod 06-07)',
      speakerEn: 'Batch Import & BM25 RAG',
      text: 'Nạp hàng loạt tệp DOCX, PDF, TXT để tự tách chương chuẩn xác; ô tìm kiếm BM25 tra cứu ký ức trăm chương trước trong 0.1 giây với giá 0 đồng Token.',
      textEn: 'Batch-import DOCX, PDF, or TXT files with smart chapter splitting, and search hundreds of chapters via local BM25 at zero API token cost.',
    },
    {
      id: 'SUB_09',
      chapterId: 'CHAP_03_TAB2_CHAPTERS_IMPORT_BM25',
      startSec: 80.0,
      endSec: 90.0,
      speaker: 'Đồng Bộ 3 Tầng An Toàn (Mod 05 & 09)',
      speakerEn: '3-Tier Folder Sync',
      text: 'Mọi bản thảo đều được lưu song song 3 tầng: LocalStorage, IndexedDB và tệp TXT/JSON thật trong thư mục ổ cứng của bạn.',
      textEn: 'Every chapter change syncs continuously across LocalStorage, IndexedDB, and real TXT/JSON files inside your linked folder.',
    },
    {
      id: 'SUB_10',
      chapterId: 'CHAP_04_TAB3_AI_STUDIO_HYDROGEN4',
      startSec: 90.0,
      endSec: 101.0,
      speaker: 'Gemini 4 Hydrogen #1 (Mod 02 & 15)',
      speakerEn: 'Gemini 4 Hydrogen',
      text: 'Tại Tab 3 AI Command, mô hình Gemini 4 Hydrogen đứng top 1 ưu tiên cho cả 5 chế độ kèm 4 mức tư duy Thấp, Trung bình, Cao và Siêu Cao XHIGH.',
      textEn: 'In Tab 3 AI Studio, Gemini 4 Hydrogen ranks #1 across all 5 modes alongside 4 thinking budgets from LOW up to XHIGH.',
    },
    {
      id: 'SUB_11',
      chapterId: 'CHAP_04_TAB3_AI_STUDIO_HYDROGEN4',
      startSec: 101.0,
      endSec: 112.0,
      speaker: 'Mở To / Thu Nhỏ & Quotas (Mod 15-16)',
      speakerEn: 'Resizable Modal & Quotas',
      text: 'Cửa sổ Hộp Lệnh AI hỗ trợ bấm Mở to / Thu nhỏ và thu gọn từng ngăn thông số, đồng thời đếm sát hạn mức gọi AI theo 5 giờ và theo tuần.',
      textEn: 'Toggle the AI Command dialog between expanded and compact sizes, collapse drawers neatly, and track live 5-hour and weekly quota usage.',
    },
    {
      id: 'SUB_12',
      chapterId: 'CHAP_04_TAB3_AI_STUDIO_HYDROGEN4',
      startSec: 112.0,
      endSec: 122.0,
      speaker: 'Sạch Markdown & Chuông Báo (Mod 17)',
      speakerEn: 'Markdown Cleanup & Alert',
      text: 'Nhấn Enter chạy ngay tức thì; hệ thống tự dọn sạch dấu sao, dấu thăng thừa của AI và phát thông báo mời bạn bấm Xem Bản Mới Nhất Ngay.',
      textEn: 'Press Enter to execute immediately; outputs strip raw markdown clutter automatically and pop an alert to review the latest draft right away.',
    },
    {
      id: 'SUB_13',
      chapterId: 'CHAP_05_TAB3_FIVE_MODES_DISTINCT',
      startSec: 122.0,
      endSec: 133.0,
      speaker: 'Chế Độ 1 Độc Lập (Mod 14 & 16)',
      speakerEn: 'Exclusive Mode 1',
      text: 'Duy nhất Chế độ 1 Viết Truyện tổng hợp toàn bộ Story Bible, Mốc cảnh, Luật viết và Dàn ý Chế độ 2 thành Prompt Tổng Hợp hoàn chỉnh.',
      textEn: 'Only Mode 1 Drafting runs the full Master Synthesizer uniting Story Bible, scene markers, writing rules, and Mode 2 outline.',
    },
    {
      id: 'SUB_14',
      chapterId: 'CHAP_05_TAB3_FIVE_MODES_DISTINCT',
      startSec: 133.0,
      endSec: 144.0,
      speaker: 'Chế Độ 2 -> 4 Chuyên Biệt',
      speakerEn: 'Specialist Modes 2-4',
      text: 'Chế độ 2 Gợi ý cốt truyện tự chuyển kết quả sang Chế độ 1; Chế độ 3 Soi Logic và Chế độ 4 Độc giả khó tính chạy thẳng prompt chuyên môn cực nhanh.',
      textEn: 'Mode 2 Plot Brainstorm feeds seamlessly into Mode 1, while Mode 3 Logic Audit and Mode 4 Beta Review run direct specialist prompts.',
    },
    {
      id: 'SUB_15',
      chapterId: 'CHAP_05_TAB3_FIVE_MODES_DISTINCT',
      startSec: 144.0,
      endSec: 154.0,
      speaker: 'Chế Độ 5 Sơ Đồ SVG (Mod 18)',
      speakerEn: 'Mode 5 Plot Diagram',
      text: 'Chế độ 5 vẽ Sơ đồ Cốt Truyện & Timeline SVG trực quan từ các chương hoặc Story Bible để soi hổng thời gian và xuất ảnh PNG/SVG sắc nét.',
      textEn: 'Mode 5 renders interactive SVG Plot Diagrams and Timelines from chapters or Story Bible to catch timeline holes and export PNG/SVG.',
    },
    {
      id: 'SUB_16',
      chapterId: 'CHAP_06_TAB4_BIBLE_NOTEBOOKLM',
      startSec: 154.0,
      endSec: 165.0,
      speaker: 'Xác Nhận Sau Duyệt Chương (Mod 19)',
      speakerEn: 'Post-Approval Confirm',
      text: 'Ngay sau khi duyệt chương mới, bảng hỏi xuất hiện để xác nhận cập nhật Story Bible lũy tiến từ chương 1 tới hiện tại hoặc mở NotebookLM.',
      textEn: 'Right after approving a chapter, a confirmation dialog asks to update your cumulative Story Bible from Chapter 1 or open Google NotebookLM.',
    },
    {
      id: 'SUB_17',
      chapterId: 'CHAP_06_TAB4_BIBLE_NOTEBOOKLM',
      startSec: 165.0,
      endSec: 176.0,
      speaker: 'Mẹo NotebookLM 200+ Chương',
      speakerEn: 'NotebookLM Companion',
      text: 'Bấm 2 link gạch chân trong Tab 4 để tải PDF gộp toàn truyện lên Google NotebookLM kèm Prompt chuẩn, rồi dán ngược bản tóm tắt vào Box 2 Chính Thức.',
      textEn: 'Use the 2 underlined links in Tab 4 to upload a merged manuscript PDF to Google NotebookLM and paste the summary into Official Story Bible.',
    },
    {
      id: 'SUB_18',
      chapterId: 'CHAP_06_TAB4_BIBLE_NOTEBOOKLM',
      startSec: 176.0,
      endSec: 186.0,
      speaker: 'Flash Bóc Tách Tự Động (Mod 12)',
      speakerEn: 'Auto Bible Matrix',
      text: 'Khung Mẫu đặt song song Chính Thức; lưu xong là Gemini Flash tự cập nhật Hồ sơ Nhân vật Đa Chiều, Ma trận Ai Biết Gì, Phục bút & Manh mối.',
      textEn: 'Template and Official Bible sit side by side; upon saving, Gemini Flash auto-extracts Character Dossiers, Knowledge Matrix, Foreshadowing & Clues.',
    },
    {
      id: 'SUB_19',
      chapterId: 'CHAP_07_TAB5_POMODORO_AUDIO_TYPO',
      startSec: 186.0,
      endSec: 196.0,
      speaker: 'Nút Thu Gọn/Mở Rộng Rõ Ràng (Tab 5)',
      speakerEn: 'Explicit Collapse/Expand Buttons',
      text: 'Cả 5 ô lớn ở Tab 5 đều dùng nút bấm chữ rõ ràng "Đang thu gọn, bấm vào để mở rộng" hoặc "Đang mở rộng, bấm vào để thu gọn" dễ thao tác mọi lúc.',
      textEn: 'All 5 large Tab 5 cards now show clear button labels ("Collapsed, click to expand" / "Expanded, click to collapse") instead of tiny arrows.',
    },
    {
      id: 'SUB_20',
      chapterId: 'CHAP_07_TAB5_POMODORO_AUDIO_TYPO',
      startSec: 196.0,
      endSec: 206.0,
      speaker: 'Điểm Danh, Pomodoro 2 Chiều & Nhạc MP3',
      speakerEn: 'Streaks, Pomodoro & MP3',
      text: 'Mục 1 theo dõi chuỗi ngày viết và Pomodoro đồng bộ 2 chiều với thanh nổi góc trên; Mục 2 phát MP3 cá nhân lặp A–B hòa cùng 7 âm thanh tự nhiên.',
      textEn: 'Section 1 tracks writing streaks and 2-way synced Pomodoro timer; Section 2 mixes 7 ambient sounds with your local MP3 A–B loop player.',
    },
    {
      id: 'SUB_21',
      chapterId: 'CHAP_07_TAB5_POMODORO_AUDIO_TYPO',
      startSec: 206.0,
      endSec: 216.0,
      speaker: 'Font Light Novel & Đèn 3400K (Mod 22)',
      speakerEn: 'Typography & Eye Care',
      text: 'Mục 3 đổi nhanh bộ chữ Light Novel dễ đọc, điều chỉnh cỡ chữ thoải mái và bật đèn vàng ấm 3400K chống mỏi mắt khi sáng tác ban đêm.',
      textEn: 'Section 3 switches crisp Light Novel font presets, adjusts comfortable text sizes, and toggles warm 3400K eye-care tint for night writing.',
    },
    {
      id: 'SUB_22',
      chapterId: 'CHAP_08_TAB5_BACKDROP_MOD32',
      startSec: 216.0,
      endSec: 231.0,
      speaker: '8 Nền Nghệ Thuật & Media Cá Nhân',
      speakerEn: '8 Backdrops & Custom Media',
      text: 'Mục 4 Tab 5 tích hợp 6 tranh thủy mặc 0MB, Nền Đen Tối Giản OLED, Nền Trắng tinh khôi, plus tải ảnh hoặc video cá nhân lưu bền vững trong IndexedDB.',
      textEn: 'Tab 5 Section 4 includes 6 0MB procedural art backdrops, Pure Black OLED, Pure White, plus custom photo/video uploads persisted safely in IndexedDB.',
    },
    {
      id: 'SUB_23',
      chapterId: 'CHAP_08_TAB5_BACKDROP_MOD32',
      startSec: 231.0,
      endSec: 246.0,
      speaker: 'Kính Mờ Mod 32 & Soi Nền 100%',
      speakerEn: 'Mod 32 Frosted Stage',
      text: 'Thanh Module 32 điều chỉnh độ trong kính, độ mờ nền, độ sáng và giữ nút "Soi Rõ Nền 100%" đi kèm hạt sáng hay mưa trên kính lung linh (Mod 22).',
      textEn: 'Module 32 controls frosted transparency, blur, brightness, and Hold to Peek Background 100%, paired with fireflies or window rain FX.',
    },
    {
      id: 'SUB_24',
      chapterId: 'CHAP_09_TAB5_YOUTUBE_MOD39',
      startSec: 246.0,
      endSec: 258.0,
      speaker: 'Thanh Tìm Kiếm Khổng Lồ Tab 5 Ô #5 (Mod 39)',
      speakerEn: 'Tab 5 Hero Search Bar & Ad-Free Player',
      text: 'Ngay dưới Ô Lớn #5 là thanh tìm kiếm to rõ kèm nút Tìm/Phát và Dán Link (không còn tiêu đề trùng lặp gây rối mắt), phát sạch hoàn toàn không quảng cáo YouTube!',
      textEn: 'Right below Feature Box #5 sits the prominent Hero Search Bar with Search/Play and Paste URL buttons for clean, completely ad-free YouTube playback!',
    },
    {
      id: 'SUB_25',
      chapterId: 'CHAP_09_TAB5_YOUTUBE_MOD39',
      startSec: 258.0,
      endSec: 270.0,
      speaker: 'Khóa Loop Livestream & Phát Trong Nền',
      speakerEn: 'Livestream Loop Lock & Background Audio',
      text: 'Video đang phát trực tiếp (Livestream) sẽ tự động khóa nút Repeat và Lặp đoạn A–B kèm chỉ dẫn rõ; còn Tua, Âm lượng, Toàn màn hình và Phát trong nền vẫn chạy mượt mà.',
      textEn: 'YouTube Livestreams automatically lock Repeat and A-B Loop with a clear notice, while Seek, Volume, Fullscreen, and Background Audio keep running smoothly.',
    },
    {
      id: 'SUB_26',
      chapterId: 'CHAP_09_TAB5_YOUTUBE_MOD39',
      startSec: 270.0,
      endSec: 282.0,
      speaker: 'Nền Video Sạch Nút Che & Crop Tùy Chỉnh (Mod 40)',
      speakerEn: 'Borderless Wallpaper & 2-Step Custom Crop',
      text: 'Nền video không bị nút bấm che giữa hình; bấm Crop vùng nền để cắt khung hình bạn thích rồi chọn Có (ép full-screen) hoặc Không (giữ đúng khung crop trên nền đen).',
      textEn: 'Wallpapers have zero center button clutter; open Custom Crop to frame any region and choose Yes (fit fullscreen) or No (preserve exact crop with black bars).',
    },
    {
      id: 'SUB_27',
      chapterId: 'CHAP_10_ARGON4_WEB_20K_BRIDGE',
      startSec: 282.0,
      endSec: 296.0,
      speaker: 'Cầu Nối 20.000+ Từ (Mod 32)',
      speakerEn: 'Argon 4 Web Bridge',
      text: 'Cần viết chương siêu dài trên 20.000 từ? Ngay trên hộp thoại duyệt Prompt và màn hình chờ AI có sẵn link gạch chân copy trọn Prompt Tổng mở Gemini Web.',
      textEn: 'Writing a mega 20,000+ word chapter? Both Prompt review and waiting overlays include underlined links to copy the Master Prompt and launch Gemini Web.',
    },
    {
      id: 'SUB_28',
      chapterId: 'CHAP_10_ARGON4_WEB_20K_BRIDGE',
      startSec: 296.0,
      endSec: 310.0,
      speaker: 'Lưu Ý Gói Pro & Ultra Gemini Web',
      speakerEn: 'Pro & Ultra Tier Note',
      text: 'Mẹo nhỏ để dùng model cao cấp nhất trên Gemini Web: nâng cấp gói Google AI Pro cho Argon 4 và gói Google AI Ultra cho Carbon 4 nhé!',
      textEn: 'Quick tip: upgrade to Google AI Pro to unlock Argon 4, or Google AI Ultra to unlock Carbon 4 on Gemini Web!',
    },
    {
      id: 'SUB_29',
      chapterId: 'CHAP_11_MASCOT_BI8_DUAL_CHAT',
      startSec: 310.0,
      endSec: 324.0,
      speaker: 'Linh Vật Viên Bi Số 8 (3D Cute)',
      speakerEn: '3D 8-Ball Mascot UI',
      text: 'Linh vật Viên Bi Số 8 3D mắt sao má hồng nằm gọn góc dưới phải; lúc thu gọn có dấu X nhỏ góc trái để ẩn tạm và chạm vào để mở khung Chat.',
      textEn: 'Our glossy 3D 8-Ball mascot sits neatly at bottom-right with a compact X close toggle; tap anytime to expand its assistant chat drawer.',
    },
    {
      id: 'SUB_30',
      chapterId: 'CHAP_11_MASCOT_BI8_DUAL_CHAT',
      startSec: 324.0,
      endSec: 338.0,
      speaker: 'Chat Kép Flash-Lite (Mod 27)',
      speakerEn: 'Flash-Lite Dual Chat',
      text: 'Trợ lý mặc định chạy Gemini 3.5 Flash-Lite tiết kiệm quota với 2 chế độ: tìm nút & rọi sáng chỉ đường trong web hoặc lắc bi tiên tri & gợi ý plot twist.',
      textEn: 'Assistant defaults to quota-saving Gemini 3.5 Flash-Lite with UI Spotlight navigation help plus Fortune 8-Ball and twist brainstorming.',
    },
    {
      id: 'SUB_31',
      chapterId: 'CHAP_12_TAB6_EXPORT_PDF_DOCX_VERSIONS',
      startSec: 338.0,
      endSec: 349.0,
      speaker: 'Tab 6 Bảo Chứng Kết Nối 6 Tầng (Mod 33)',
      speakerEn: 'Tab 6 Connection Guard',
      text: 'Tại Tab 6, khối đầu kiểm định xác thực API Key Gemini & thư mục ổ cứng qua Bộ bảo vệ 6 tầng chuẩn xác 100%, không bao giờ báo ảo.',
      textEn: 'In Tab 6, the Connection Guard runs a real 6-layer verification on your Gemini API Key and local folder without false positives.',
    },
    {
      id: 'SUB_32',
      chapterId: 'CHAP_12_TAB6_EXPORT_PDF_DOCX_VERSIONS',
      startSec: 349.0,
      endSec: 360.0,
      speaker: 'Time Machine & Kho Phiên Bản (Mod 10)',
      speakerEn: 'Time-Machine Snapshots',
      text: 'Cỗ máy Thời gian tự ghi lại mọi cột mốc bản thảo để xem Diff toàn màn hình trước khi khôi phục, kèm đóng gói .ZIP / .JSON chuyển sang máy khác.',
      textEn: 'The Time Machine tracks draft snapshots with full-screen Preview diffing before restoring, plus portable .ZIP / .JSON transfers across devices.',
    },
    {
      id: 'SUB_33',
      chapterId: 'CHAP_12_TAB6_EXPORT_PDF_DOCX_VERSIONS',
      startSec: 360.0,
      endSec: 370.0,
      speaker: 'Xuất Sách PDF / DOCX / EPUB (Mod 26)',
      speakerEn: 'DOCX, EPUB & Book PDF',
      text: 'Xuất Word .DOCX chuẩn OOXML, sách điện tử .EPUB hoặc in PDF tùy chỉnh Font, cỡ pt, tên sách và bút danh ở đầu trang siêu sắc nét.',
      textEn: 'Export genuine OOXML .DOCX documents, .EPUB e-books, or custom-formatted PDFs with running headers, book titles, and pen names.',
    },
    {
      id: 'SUB_34',
      chapterId: 'CHAP_13_TAB6_ENCYCLOPEDIA_VIDEO_AI_BAR',
      startSec: 370.0,
      endSec: 384.0,
      speaker: 'Bách Khoa 45 Module & Video Toàn Màn Hình',
      speakerEn: '45-Mod Guide & Fullscreen Video',
      text: 'Bách khoa toàn thư (Mod 31) tra cứu trọn bộ 45 Module và bấm nhảy thẳng tới nút tương ứng; Video Hướng Dẫn hỗ trợ phóng to Toàn màn hình sắc nét.',
      textEn: 'Search every capability across all 45 Modules in the Encyclopedia and jump directly to its control, or watch this Video Tutorial in crisp Fullscreen.',
    },
    {
      id: 'SUB_35',
      chapterId: 'CHAP_13_TAB6_ENCYCLOPEDIA_VIDEO_AI_BAR',
      startSec: 384.0,
      endSec: 398.0,
      speaker: 'Phụ Đề Tách Rời & Giọng Việt Tự Nhiên',
      speakerEn: 'Clean Subtitle & Natural Voice',
      text: 'Thanh phụ đề song ngữ Việt/Anh luôn nằm riêng bên dưới khung video không che hình; giọng Việt Neural đọc tự nhiên và im lặng tức thì khi bấm Mute.',
      textEn: 'Bilingual subtitles stay neatly positioned beneath the canvas; our Neural voice reader prevents broken fallbacks and obeys Mute instantaneously.',
    },
    {
      id: 'SUB_36',
      chapterId: 'CHAP_14_TAB6_BUG_RELAY_CREDITS_SHIELD',
      startSec: 398.0,
      endSec: 412.0,
      speaker: 'Credits "Bi", QR Mobile & Chân Dung Mod 09',
      speakerEn: 'Credits, Donate QR & Mod 09 Portrait',
      text: 'Tab 6 có mã QR "MỌI NGƯỜI TÙY TÂM NHA 😇" tối ưu cả Mobile/Offline; còn bấm trạng thái đầu trang sẽ mở bảng Sức Khỏe 3 Tầng kèm ảnh tác giả Đăng đang theo dõi bạn :))!',
      textEn: 'Tab 6 hosts mobile-centered QR Donate with offline fallback, while the top-left pill opens our enlarged 3-Tier Health modal with Author Dang watching your draft! :))',
    },
    {
      id: 'SUB_37',
      chapterId: 'CHAP_14_TAB6_BUG_RELAY_CREDITS_SHIELD',
      startSec: 412.0,
      endSec: 426.0,
      speaker: 'Khiên Chống Reload 7 Tầng (Mod 36-38)',
      speakerEn: '7-Layer Silent Armor',
      text: 'Bộ ba Mod 36–38 bảo vệ âm thầm mọi nét chữ: chặn Backspace hay reload nhầm làm mất bài, giữ nguyên vị trí con trỏ và đồng bộ chuỗi ngày viết.',
      textEn: 'Mods 36–38 silently shield every keystroke against accidental Backspace/reloads, preserve caret positions, and sync writing streaks.',
    },
    {
      id: 'SUB_38',
      chapterId: 'CHAP_15_GUEST_MODE_AND_JSON_PERSISTENCE',
      startSec: 426.0,
      endSec: 437.0,
      speaker: 'Guest Mode Mở Thẳng Tab 5 & Nhấp Nháy 4 Giây (Mod 41)',
      speakerEn: 'Guest Mode Direct Tab 5 & 4s Spotlight',
      text: 'Bấm nút xám Guest Mode là hệ thống nhảy thẳng sang Tab 5 và nhấp nháy nổi bật 4 giây đúng 2 khung Xem YouTube sạch quảng cáo & Phát MP3 để bạn dùng thử ngay!',
      textEn: 'Clicking Guest Mode jumps straight to Tab 5 and spotlights both Ad-Free YouTube and the MP3 Player with a 4-second pulsing glow so you can start listening instantly!',
    },
    {
      id: 'SUB_39',
      chapterId: 'CHAP_15_GUEST_MODE_AND_JSON_PERSISTENCE',
      startSec: 437.0,
      endSec: 448.0,
      speaker: 'Cô Lập 5 Chế Độ AI Mô Phỏng',
      speakerEn: '100% Isolated Trial',
      text: 'Guest Mode vào Studio ngay không cần API Key hay Thư mục, chạy thử đủ 5 chế độ AI mô phỏng mà hoàn toàn cô lập, không bao giờ ghi đè truyện thật.',
      textEn: 'Enter the studio instantly with zero API Key or folder required to test all 5 simulated AI modes in complete isolation from real manuscripts.',
    },
    {
      id: 'SUB_40',
      chapterId: 'CHAP_15_GUEST_MODE_AND_JSON_PERSISTENCE',
      startSec: 448.0,
      endSec: 458.0,
      speaker: 'Tệp _studio_workspace_state.json Tự Lưu Trạng Thái',
      speakerEn: 'JSON Workspace State Persistence',
      text: 'Khi nối thư mục thật, tệp _studio_workspace_state.json trong thư mục bạn tự lưu trạng thái web (tab đang mở, nền, đồng hồ, cài đặt) để lần sau mở đúng nguyên như cũ!',
      textEn: 'When linked to a local folder, _studio_workspace_state.json automatically saves your live web state so reopening restores everything identically!',
    },
    {
      id: 'SUB_41',
      chapterId: 'CHAP_16_WORLD_CLOCK_TIMEZONE_ALARM',
      startSec: 458.0,
      endSec: 469.0,
      speaker: 'Liên Kết Giờ & Thời Tiết Ở Cả Cổng & Đầu Trang (Mod 42)',
      speakerEn: 'Quick Clock & Weather Links',
      text: 'Cả ở đầu Cổng Kết Nối lẫn ngay dưới tên web góc trái trên đều có nút "Bấm vào đây để chỉnh múi giờ, đặt báo thức và xem thời tiết" mở bảng điều khiển Mod 42.',
      textEn: 'Both the Entry Gate and top-left header include the direct link to edit timezone, set alarms, and view weather in Module 42.',
    },
    {
      id: 'SUB_42',
      chapterId: 'CHAP_16_WORLD_CLOCK_TIMEZONE_ALARM',
      startSec: 469.0,
      endSec: 480.0,
      speaker: 'Múi Giờ Quốc Tế & Định Dạng Ngày Giờ',
      speakerEn: 'World Timezones & Formats',
      text: 'Đồng hồ sống chạy chuẩn từng giây, cho phép đổi múi giờ Hà Nội, Tokyo, London, New York... kèm chọn kiểu 24h hoặc 12h AM/PM và thứ tự ngày tháng.',
      textEn: 'The live clock ticks every second with instant switching between Hanoi, Tokyo, London, New York timezones plus 24h/12h and date formats.',
    },
    {
      id: 'SUB_43',
      chapterId: 'CHAP_16_WORLD_CLOCK_TIMEZONE_ALARM',
      startSec: 480.0,
      endSec: 490.0,
      speaker: 'Báo Thức MP3 Riêng & Báo Thức Nhanh',
      speakerEn: 'Custom MP3 & System Alarms',
      text: 'Đặt nhiều mốc báo thức linh hoạt (ô giây có thể bỏ trống tự mặc định 00); chọn chuông hệ thống hay nhạc MP3 riêng (lấy thẳng từ Tab 5) báo đúng giờ dù đang viết.',
      textEn: 'Schedule multiple alarms (blank seconds default to :00) using crisp system chimes or custom MP3 tracks linked straight from Tab 5.',
    },
    {
      id: 'SUB_44',
      chapterId: 'CHAP_17_REALTIME_WEATHER_SKY_60FPS',
      startSec: 490.0,
      endSec: 502.0,
      speaker: 'Thời Tiết Thật & Khung Mô Phỏng 60FPS (Mod 43)',
      speakerEn: 'Live Weather & 60FPS Sky Engine',
      text: 'Module 43 lấy thời tiết thật theo thành phố/GPS (nhiệt độ, gió, bình minh, hoàng hôn Open-Meteo) kết hợp màn hình bầu trời 60FPS mưa, sét, tuyết, mây, 90 sao đêm.',
      textEn: 'Module 43 fetches live city/GPS weather and sunrise/sunset via Open-Meteo, animating 60FPS rain, lightning, snow, clouds, and 90 stars.',
    },
    {
      id: 'SUB_45',
      chapterId: 'CHAP_17_REALTIME_WEATHER_SKY_60FPS',
      startSec: 502.0,
      endSec: 513.0,
      speaker: '168 Biến Thể Thời Gian × Thời Tiết Toàn Web',
      speakerEn: '168 Sky Combinations (6×28 WMO)',
      text: 'Đặt nền Real-Time theo đúng thời tiết bên ngoài hoặc tự chọn 1 trong 168 tổ hợp (6 khung giờ từ Bình minh tới Đêm × 28 mã thời tiết WMO) phủ nền cả trang web.',
      textEn: 'Enable Real-Time Weather Sky or manually pick any of 168 combinations (6 day phases × 28 WMO weather codes) as your full-site backdrop.',
    },
    {
      id: 'SUB_46',
      chapterId: 'CHAP_17_REALTIME_WEATHER_SKY_60FPS',
      startSec: 513.0,
      endSec: 524.0,
      speaker: 'Tùy Chỉnh Ảnh Theo Khung & Thanh Xuyên Thấu',
      speakerEn: 'Custom Folders & Visibility Sliders',
      text: 'Hỗ trợ nạp thư mục backgrounds/ riêng và kéo mượt 4 thanh Độ rõ nền, Độ mờ blur, Độ sáng và Độ xuyên thấu khung chữ để đọc dễ mọi lúc.',
      textEn: 'Drop custom photos per time/weather folder and fine-tune clarity, blur, brightness, and text transparency sliders effortlessly.',
    },
    {
      id: 'SUB_47',
      chapterId: 'CHAP_18_MOBILE_BACKGROUND_AUDIO_MINI_SCREEN',
      startSec: 524.0,
      endSec: 534.0,
      speaker: 'Phát Nhạc MP3 & YouTube Trong Nền Mobile / App',
      speakerEn: 'Mobile/App Background MediaSession',
      text: 'Trình phát MP3 và YouTube được tối ưu cho cả Điện thoại lẫn App tải về qua MediaSession API: tắt màn hình hay thoát ra ứng dụng khác vẫn phát âm thanh liên tục!',
      textEn: 'MP3 and YouTube audio optimize Mobile & installed PWA playback via MediaSession: keep listening seamlessly when locking the screen or switching apps!',
    },
    {
      id: 'SUB_48',
      chapterId: 'CHAP_18_MOBILE_BACKGROUND_AUDIO_MINI_SCREEN',
      startSec: 534.0,
      endSec: 544.0,
      speaker: 'Màn Hình Thu Nhỏ Kéo Thả Khắp Mọi Nơi',
      speakerEn: 'Draggable Floating Mini Screen',
      text: 'Khi nghe nhạc hoặc xem YouTube rồi chuyển sang Tab viết truyện, một Màn Hình Thu Nhỏ gọn xinh xuất hiện để bạn giữ kéo di chuyển đi bất kỳ góc nào trên Desktop & Mobile.',
      textEn: 'Switch to writing tabs without interrupting media: a sleek floating Mini Screen appears that you can drag anywhere around Laptop and Mobile viewports.',
    },
    {
      id: 'SUB_49',
      chapterId: 'CHAP_18_MOBILE_BACKGROUND_AUDIO_MINI_SCREEN',
      startSec: 544.0,
      endSec: 554.0,
      speaker: 'Chạm Màn Hình Thu Nhỏ Quay Lại Đúng Mục Tab 5',
      speakerEn: 'One-Tap Return to Tab 5 Section',
      text: 'Bấm trực tiếp vào Màn Hình Thu Nhỏ là web tự chuyển sang Tab 5, tự mở đúng mục Nhạc hoặc YouTube tương ứng và cuộn mượt tới trình phát ngay tức thì!',
      textEn: 'Tap the floating Mini Screen anytime to jump straight to Tab 5, auto-expand the exact Audio or YouTube section, and scroll right into view!',
    },
    {
      id: 'SUB_50',
      chapterId: 'CHAP_19_PWA_APP_INSTALL_AND_PORTRAIT_ICONS',
      startSec: 554.0,
      endSec: 564.0,
      speaker: 'Cài App 1-Chạm Cả 4 Thẻ Thiết Bị (Mod 29)',
      speakerEn: '1-Click 4-Device PWA Install Cards',
      text: 'Bấm trực tiếp vào bất kỳ thẻ thiết bị nào trong 4 mục (Laptop/PC, Mở thư mục file://, Android hay iOS Safari) là tự động cài đặt App hoặc tải tệp khởi chạy ngay!',
      textEn: 'Click directly on any of the 4 device options (Laptop/PC, local file launcher, Android, or iOS Safari) to install or download your standalone responsive app immediately!',
    },
    {
      id: 'SUB_51',
      chapterId: 'CHAP_19_PWA_APP_INSTALL_AND_PORTRAIT_ICONS',
      startSec: 564.0,
      endSec: 574.0,
      speaker: 'Trọn Bộ Icon Chân Dung "Web Viết Tiểu Thuyết & Giải Trí"',
      speakerEn: 'Portrait Web & App Icons',
      text: 'Toàn bộ icon ứng dụng cài đặt, favicon tab trình duyệt, ảnh đầu cổng, thanh header và hộp giới thiệu Mai Hải Đăng đều đồng bộ bộ ảnh chân dung mới sắc nét.',
      textEn: 'All installed app icons, browser favicons, entry gate emblems, header logo, and creator banners now display the crisp new portrait icon set.',
    },
    {
      id: 'SUB_52',
      chapterId: 'CHAP_20_MOD44_TRAFFIC_BOX_SUMMARY',
      startSec: 574.0,
      endSec: 580.0,
      speaker: 'Thống Kê Truy Cập Toàn Cầu Đồng Nhất v3 (Mod 44)',
      speakerEn: 'Mod 44 Unified Global Traffic v3',
      text: 'Ô Thống Kê Truy Cập Tab 6 nay đồng bộ thống nhất qua máy chủ v3, đảm bảo số Đang truy cập, Hôm nay, Tuần, Tháng, Năm & Toàn lịch sử chuẩn khớp giữa mọi thiết bị.',
      textEn: 'Tab 6’s single traffic card syncs against global v3 storage so Active Online, Today, Week, Month, Year, and All-Time History match across all browsers and devices.',
    },
    {
      id: 'SUB_53',
      chapterId: 'CHAP_20_MOD44_TRAFFIC_BOX_SUMMARY',
      startSec: 580.0,
      endSec: 586.0,
      speaker: '5 Module Ngôn Ngữ Quốc Tế (EN / 简体 / 繁體 / 한국어 / 日本語)',
      speakerEn: '6 UI Languages Switcher (Preserves Novels)',
      text: 'Bấm "🌐 Tiếng Việt ▾" ngay dưới nút Ủng hộ ở Tab 6, góc phải Header (PC & Mobile) hoặc đầu Cổng để đổi toàn bộ giao diện qua 6 ngôn ngữ mà vẫn giữ nguyên truyện bạn viết!',
      textEn: 'Tap the language switcher right under Donate in Tab 6, in the Desktop/Mobile top-right header, or at the Entry Gate to switch across 6 UI languages safely.',
    },
    {
      id: 'SUB_54',
      chapterId: 'CHAP_20_MOD44_TRAFFIC_BOX_SUMMARY',
      startSec: 586.0,
      endSec: 592.0,
      speaker: '45 Module + 5 Ngôn Ngữ — Sáng Tác Mượt Trên Mọi Màn Hình!',
      speakerEn: '45 Modules + 5 i18n Packs Complete',
      text: 'Cả 45 Module và 5 file ngôn ngữ đã được kiểm định responsive toàn diện trên Desktop, Mobile lẫn App PWA. Chúc bạn sáng tác thăng hoa cùng Web Viết Tiểu Thuyết Của Bi!',
      textEn: 'All 45 Modules and 5 language packs are verified responsive across Desktop, Mobile, and PWA Apps. Enjoy writing and relaxing in Bi’s Novel Writing Studio!',
    },
    {
      id: 'SUB_55',
      chapterId: 'CHAP_21_V46_STREAM_FONTSCALE_MISC',
      startSec: 592.0,
      endSec: 602.0,
      speaker: 'Repeat / A–B Loop Mượt Mà & Đồng Bộ Nền YouTube (Mod 39/40)',
      speakerEn: 'Seamless Loop & Background Sync',
      text: 'Bấm Lặp video hoặc Lặp đoạn A–B nay giữ nguyên khung phát không đen màn hình, đồng thời Video Background luôn Dừng/Chạy/Tua đồng bộ tức thì theo trình phát chính.',
      textEn: 'Toggling Repeat or A–B Loop keeps the player smooth without blanking out, while Background Video stays synced on Pause, Play, and Seek.',
    },
    {
      id: 'SUB_56',
      chapterId: 'CHAP_21_V46_STREAM_FONTSCALE_MISC',
      startSec: 602.0,
      endSec: 612.0,
      speaker: 'Cỡ Chữ Toàn Web (4 Mức) & Chuỗi Điểm Danh Huy Hiệu',
      speakerEn: 'System Font Scale & Streak Badges',
      text: 'Tùy chỉnh Cỡ chữ hệ thống (Nhỏ / Bình thường / To / Rất to) đồng bộ Header, Tab 5 & Tab 6; điểm danh giữ chuỗi 7, 21, 90 và 365 ngày để mở khóa các huy hiệu Tiểu thuyết gia.',
      textEn: 'Adjust System Font Scale (Small to Extra Large) synced across Header, Tab 5 & Tab 6, and maintain daily check-in streaks at 7, 21, 90, and 365 days for badges.',
    },
    {
      id: 'SUB_57',
      chapterId: 'CHAP_21_V46_STREAM_FONTSCALE_MISC',
      startSec: 612.0,
      endSec: 622.0,
      speaker: 'Mục #5 Chức Năng Linh Tinh & Đa Ngôn Ngữ Toàn Diện',
      speakerEn: 'Tab 6 Box #5 & Complete Localization',
      text: 'Khám phá Ô #5 Chức năng linh tinh ở Tab 6, video hướng dẫn tràn khung chuẩn Mobile/Desktop, cùng dịch đầy đủ 6 ngôn ngữ cho mọi thông báo, khung Prompt & ngày giờ bản địa!',
      textEn: 'Explore Tab 6’s Box #5 Miscellaneous Fun Hub, full-frame responsive Mobile/Desktop tutorial video, and complete 6-language localization including Prompt Frames & local dates!',
    },
    {
      id: 'SUB_58',
      chapterId: 'CHAP_22_YT_MP3_BACKGROUND_SYNC',
      startSec: 622.0,
      endSec: 632.0,
      speaker: 'YouTube Mục 5 Tự Nối Hạ Tầng MP3 Mục 3',
      speakerEn: 'Auto Background Audio Bridge',
      text: 'Mỗi khi chọn video YouTube ở Mục 5, khung hình phát ngay đồng thời âm thanh tự động nối sang bộ máy MP3 Mục 3 để chạy nền siêu ổn định ngay cả khi bạn thoát ra ứng dụng khác!',
      textEn: 'Whenever you pick a YouTube video in Section 5, the picture plays right away while audio automatically routes through Section 3’s MP3 engine so switching apps never cuts off sound!',
    },
    {
      id: 'SUB_59',
      chapterId: 'CHAP_22_YT_MP3_BACKGROUND_SYNC',
      startSec: 632.0,
      endSec: 642.0,
      speaker: 'Đồng Bộ 2 Chiều & Chuyển Video Mượt',
      speakerEn: 'Strict 2-Way Sync & Clean Switching',
      text: 'Mọi thao tác Dừng, Phát tiếp, Tua nhanh hay tốc độ phát giữa YouTube và Mục 3 luôn khớp từng giây; chuyển qua video mới sẽ tự động tắt hẳn âm thanh của video cũ.',
      textEn: 'Pause, Play, Seek, and playback speed remain locked in real-time two-way sync between YouTube and Section 3; switching to another video cleanly stops the previous audio.',
    },
    {
      id: 'SUB_60',
      chapterId: 'CHAP_22_YT_MP3_BACKGROUND_SYNC',
      startSec: 642.0,
      endSec: 652.0,
      speaker: 'Hộp Thoại Xác Nhận Ưu Tiên Âm Thanh',
      speakerEn: 'Audio Priority Confirmation Popup',
      text: 'Khi đang xem YouTube mà bạn mở thêm file MP3 cá nhân trên máy tại Mục 3, popup thông minh sẽ hỏi xác nhận có dừng video YouTube để nhường cho bản nhạc riêng không!',
      textEn: 'If a YouTube video is active and you launch a personal local MP3 in Section 3, a smart popup asks whether to stop YouTube before playing your local track!',
    },
    {
      id: 'SUB_61',
      chapterId: 'CHAP_23_AUTOSAVE_EVERY_2S_AND_UI_STATE',
      startSec: 652.0,
      endSec: 662.0,
      speaker: 'Tự Lưu 3 Tầng Mỗi 2 Giây & Khi Sửa Chữ',
      speakerEn: '3-Tier Autosave Every 2 Seconds',
      text: 'Từ lúc bạn gõ thêm câu mới hay xóa bớt chữ trong bản thảo, cơ chế tự lưu 3 tầng tự động đồng bộ về IndexedDB, Két sắt khẩn cấp và Thư mục máy trong vòng 2 giây.',
      textEn: 'Whether writing new paragraphs or deleting text in the manuscript, 3-tier autosave commits automatically to IndexedDB, Emergency Vault, and your disk folder within 2 seconds.',
    },
    {
      id: 'SUB_62',
      chapterId: 'CHAP_23_AUTOSAVE_EVERY_2S_AND_UI_STATE',
      startSec: 662.0,
      endSec: 672.0,
      speaker: 'Ghi Nhớ Đóng / Mở Từng Mục Chức Năng',
      speakerEn: 'Persistent Accordion & Collapse State',
      text: 'Mọi lựa chọn thu gọn hoặc mở rộng của các thanh công cụ, khung Tab 5 hay khối xếp gọn ở Tab 6 đều được lưu tức thì để lần sau mở web lên giữ đúng bố cục bạn thích.',
      textEn: 'Every collapsed or expanded panel across tabs, including toolbars, Tab 5 music/backdrop boxes, and Tab 6 cards, is saved immediately and restored exactly on next visit.',
    },
    {
      id: 'SUB_63',
      chapterId: 'CHAP_23_AUTOSAVE_EVERY_2S_AND_UI_STATE',
      startSec: 672.0,
      endSec: 682.0,
      speaker: 'Lưu Vị Trí Tab Cuối & Trạng Thái Phát',
      speakerEn: 'Last Tab, Scroll & Media State Restore',
      text: 'Vị trí Tab đang làm việc, độ cuộn từng màn hình cũng như trạng thái vừa tắt nhạc MP3 hay dừng video YouTube đều lưu trọn vẹn trước khi bạn thoát trang!',
      textEn: 'Your last active tab, scroll offsets, and stopped or paused YouTube/MP3 media state are all captured automatically before leaving!',
    },
    {
      id: 'SUB_64',
      chapterId: 'CHAP_24_SIMPLIFIED_ENTRY_GATE_AND_NOTICES',
      startSec: 682.0,
      endSec: 692.0,
      speaker: 'Cổng Kết Nối Gọn Gàng Cuộn Mượt PC/Mobile',
      speakerEn: 'Streamlined 2-Step Entry Gate',
      text: 'Màn hình đầu vào trên cả Laptop lẫn Điện thoại cho phép cuộn mượt xuống tận dưới để lấy API Key qua nút "Mở Google Studio lấy mã" và chọn Thư mục làm việc chỉ 1 bước!',
      textEn: 'On both Desktop and Mobile, the Entry Gate scrolls smoothly all the way down to paste your API Key via Google AI Studio and link your workspace folder in a single step!',
    },
    {
      id: 'SUB_65',
      chapterId: 'CHAP_24_SIMPLIFIED_ENTRY_GATE_AND_NOTICES',
      startSec: 692.0,
      endSec: 702.0,
      speaker: 'Loại Bỏ Rung Giật Nút Điều Khiển YouTube',
      speakerEn: 'Flicker-Free Media Controls',
      text: 'Loại bỏ hoàn toàn hiện tượng rung nháy trên các nút Tạm dừng, Phát tiếp và Tua ±10s của trình phát YouTube khi làm việc lâu trên trình duyệt.',
      textEn: 'Flickering on YouTube Play/Pause and Seek ±10s controls has been completely eliminated for distraction-free viewing.',
    },
    {
      id: 'SUB_66',
      chapterId: 'CHAP_24_SIMPLIFIED_ENTRY_GATE_AND_NOTICES',
      startSec: 702.0,
      endSec: 712.0,
      speaker: 'Popup Thông Báo Hệ Thống Từ Google Sheet',
      speakerEn: 'Scheduled Google Sheet Notice Popup',
      text: 'Sau khi bước qua cổng (dù ở Chế Độ Khách hay Đầy Đủ), mọi thông báo hẹn giờ mới từ Google Sheet Admin tự động hiện popup rõ ràng theo đúng khung giờ quy định.',
      textEn: 'Right after entering the studio (whether Guest Mode or Full Mode), scheduled announcements from the Google Sheet backend pop up accurately on time.',
    },
    {
      id: 'SUB_67',
      chapterId: 'CHAP_25_MOBILE_FULLSCREEN_UI_NO_TOP_CLIP',
      startSec: 712.0,
      endSec: 722.0,
      speaker: 'Khóa Đỉnh Giao Diện Mobile Không Cắt Mép Trên',
      speakerEn: 'Top-Locked Mobile Viewport Architecture',
      text: 'Sửa triệt để lỗi mất mép trên giao diện và kẹt thanh Header trên Brave/Chrome Mobile ở mọi Tab 1–6: mọi nút trên cùng luôn hiện rõ và cuộn mượt lên xuống.',
      textEn: 'Top-edge clipping across Mobile browsers on Tabs 1–6 is completely eliminated: the header and top controls always remain accessible and scrollable.',
    },
    {
      id: 'SUB_68',
      chapterId: 'CHAP_25_MOBILE_FULLSCREEN_UI_NO_TOP_CLIP',
      startSec: 722.0,
      endSec: 732.0,
      speaker: 'Mọi Popup, Mở To/Thu Nhỏ & Crop Luôn Thấy Nút Đóng',
      speakerEn: 'Safe Scrollable Popups & Expanded Windows',
      text: 'Tất cả popup, cửa sổ Mở to AI, bảng Cài đặt, Crop nền Video & Hỏi đáp luôn tự căn lề đỉnh khi màn hình thấp, đảm bảo nút Đóng và tiêu đề không bao giờ bị khuất!',
      textEn: 'Every modal, maximized AI Command Hub, Crop dialog, and Settings window dynamically aligns safely on short viewports so close buttons never vanish off-top!',
    },
    {
      id: 'SUB_69',
      chapterId: 'CHAP_25_MOBILE_FULLSCREEN_UI_NO_TOP_CLIP',
      startSec: 732.0,
      endSec: 742.0,
      speaker: 'Rạp Video Hướng Dẫn Toàn Màn Hình Chuẩn Mọi Thiết Bị',
      speakerEn: 'Cross-Device Responsive Tutorial Fullscreen',
      text: 'Rạp video Tab 6 nay phóng to Toàn màn hình sắc nét trên cả Điện thoại dọc, Điện thoại ngang lẫn Laptop với tỷ lệ 16:9 chuẩn, phụ đề song ngữ và thanh tua đầy đủ phía dưới!',
      textEn: 'The Tab 6 Tutorial Theater now enters clean 16:9 Fullscreen across Portrait Phone, Landscape Phone, and Desktop with readable bilingual subtitles and controls below!',
    },
    {
      id: 'SUB_70',
      chapterId: 'CHAP_26_FOCUS_MODE_TREE_SPLIT_HIERARCHY',
      startSec: 742.0,
      endSec: 752.0,
      speaker: 'Tab 1: Viết Tập Trung, Cây Chương Nhanh & Chia Cột Split',
      speakerEn: 'Tab 1 Focus Mode, Chapter Tree & Split View',
      text: 'Trên bàn viết Tab 1, bấm Viết Tập Trung để gõ không sao nhãng, mở nhanh Cây Chương hoặc Chia Cột Split để vừa viết vừa đối chiếu dàn ý và Story Bible song song!',
      textEn: 'In Tab 1, toggle Focus Writing Mode for distraction-free drafting, open the quick Chapter Tree, or use Split View to reference your outline and Story Bible side by side!',
    },
    {
      id: 'SUB_71',
      chapterId: 'CHAP_26_FOCUS_MODE_TREE_SPLIT_HIERARCHY',
      startSec: 752.0,
      endSec: 763.0,
      speaker: 'Thanh AI Bôi Đen Sửa Văn Tại Chỗ & Soát Sáo Ngữ',
      speakerEn: 'Inline AI Selection Bar & Cliché Polish',
      text: 'Chỉ cần bôi đen bất kỳ đoạn văn nào trên Tab 1, Thanh AI Bôi Đen sẽ hiện lên để viết tiếp, tả sâu ngũ quan, cô đọng câu văn hoặc quét từ sáo ngữ ngay tại chỗ.',
      textEn: 'Highlight any passage in Tab 1 to summon the Inline AI Selection Bar for instant continuation, sensory deepening, tightening, or cliché cleanup right in place.',
    },
    {
      id: 'SUB_72',
      chapterId: 'CHAP_26_FOCUS_MODE_TREE_SPLIT_HIERARCHY',
      startSec: 763.0,
      endSec: 774.0,
      speaker: 'Tab 2: Kéo Thả Phân Cấp Quyển → Chương → Cảnh (Mod 08)',
      speakerEn: 'Tab 2 Volume → Chapter → Scene Drag & Drop',
      text: 'Tại Tab 2, bạn có thể tổ chức truyện thành từng Quyển, Chương và Cảnh con, kéo thả sắp xếp trực quan và kết hợp Gemini 4 Neon lọc đúng mô hình theo hạng API Key!',
      textEn: 'In Tab 2, organize your novel into Volumes, Chapters, and Scenes with drag-and-drop reordering, paired with Gemini 4 Neon and smart API key tier auto-fallback!',
    },
    {
      id: 'SUB_73',
      chapterId: 'CHAP_27_DESKTOP_YT_SPEED4X_WEATHER24H_LOCAL',
      startSec: 774.0,
      endSec: 785.0,
      speaker: 'Desktop YouTube Trực Tiếp (0.25x–4x), Cửa Sổ Nổi & Mobile A–B',
      speakerEn: 'Desktop Direct YouTube (0.25x–4x), Floating Window & Mobile A–B',
      text: 'Trên Desktop và App Desktop, YouTube phát thẳng mượt mà không cần dò luồng công cộng, hỗ trợ tốc độ 0.25x tới 4x, Cửa sổ nổi, và trên điện thoại nhập 2 số A–B tự nhảy qua dấu hai chấm!',
      textEn: 'On Desktop and Desktop PWA, YouTube streams directly without public probing, supporting 0.25x to 4x speed, Floating Window, and auto-jump past the colon after 2 digits on Mobile A–B!',
    },
    {
      id: 'SUB_74',
      chapterId: 'CHAP_27_DESKTOP_YT_SPEED4X_WEATHER24H_LOCAL',
      startSec: 785.0,
      endSec: 795.0,
      speaker: 'Hộp Hướng Dẫn Tải YTSave & Thời Tiết 24 Giờ Cấp Phường (Mod 43)',
      speakerEn: 'YTSave Helper & 24-Hour Ward-Level Weather',
      text: 'Nút tải video YouTube mở cửa sổ mô phỏng YTSave kèm tùy chọn điều hướng thẳng lần sau; bảng Thời Tiết dự báo đủ 24 giờ gần nhất từng tiếng và định vị rõ tới cấp Phường/Xã.',
      textEn: 'The YouTube Download button opens the YTSave guide popup with an optional direct-redirect toggle; Weather displays a rolling 24-hour hourly forecast with ward-level GPS location.',
    },
    {
      id: 'SUB_75',
      chapterId: 'CHAP_27_DESKTOP_YT_SPEED4X_WEATHER24H_LOCAL',
      startSec: 795.0,
      endSec: 806.0,
      speaker: 'Kiến Trúc Xử Lý 100% Nội Bộ Siêu Nhanh (Local-First)',
      speakerEn: '100% Local-First Instant Processing',
      text: 'Xuất sách PDF, DOCX, EPUB, tìm kiếm BM25, so sánh Diff và xử lý ảnh/nhạc đều chạy trực tiếp trên máy người dùng như iHatePDF, gần như tức thì và không gửi bản thảo lên máy chủ!',
      textEn: 'PDF, DOCX, EPUB exports, BM25 search, Diff comparison, and media tools run 100% locally on your device for near-instant speed without uploading manuscripts to external servers!',
    },
    {
      id: 'SUB_76',
      chapterId: 'CHAP_28_MOD45_CASIO_DESMOS_VOICE6LANG',
      startSec: 806.0,
      endSec: 817.0,
      speaker: 'Module 45 Mới: Máy Tính Casio fx-570VN PLUS & Đồ Thị Desmos Local',
      speakerEn: 'New Module 45: Casio fx-570VN PLUS & Local Desmos Graphing',
      text: 'Ra mắt Module 45 ở Tab 6 Mục #5 Linh Tinh và Credit: giả lập đầy đủ Casio fx-570VN PLUS kèm nút Tạo hàm đồ thị tương tác kiểu Desmos chạy 100% nội bộ trên máy!',
      textEn: 'Introducing Module 45 in Tab 6 Misc Fun Hub & Credits: a full Casio fx-570VN PLUS scientific calculator paired with an interactive 100% local Desmos-style Graphing Plotter!',
    },
    {
      id: 'SUB_77',
      chapterId: 'CHAP_28_MOD45_CASIO_DESMOS_VOICE6LANG',
      startSec: 817.0,
      endSec: 828.0,
      speaker: 'Giọng Đọc AI 6 Ngôn Ngữ (Neural + Google Dịch TTS Miễn Phí)',
      speakerEn: '6-Language AI Voice Narration (Neural + Google Translate TTS)',
      text: 'Động cơ giọng nói AI nay đọc mượt cả 6 thứ tiếng Việt, Anh, Trung Giản, Trung Phồn, Hàn và Nhật qua Neural Voice hoặc Google Dịch TTS tích hợp sẵn cho cả Video lẫn Trợ lý AI!',
      textEn: 'The AI voice engine now narrates fluently across all 6 languages—Vietnamese, English, Simplified/Traditional Chinese, Korean, and Japanese—using Neural Voices or built-in Google Translate TTS!',
    },
    {
      id: 'SUB_78',
      chapterId: 'CHAP_28_MOD45_CASIO_DESMOS_VOICE6LANG',
      startSec: 828.0,
      endSec: 840.0,
      speaker: 'Hoàn Thiện 45 Module & Tự Lưu 2 Giây Mọi Trạng Thái!',
      speakerEn: 'All 45 Modules Complete with Full 2-Second Autosave!',
      text: 'Cả 45 Module kết hợp cơ chế Tự Lưu mỗi 2 giây ghi nhớ trọn vẹn văn bản, vị trí con trỏ, tab và cài đặt đang dùng. Chúc tác giả sáng tác bùng nổ cùng Web Viết Tiểu Thuyết Của Bi!',
      textEn: 'All 45 Modules work together with full 2-second autosave preserving your manuscript, cursor, active tab, and settings. Happy writing with Bi’s Novel Writing Studio!',
    },
  ]);

  /**
   * Nhật ký nâng cấp hệ thống & danh sách chi tiết các cải tiến lớn qua từng phiên bản.
   */
  const SYSTEM_CHANGELOG_V38 = Object.freeze([
    {
      version: 'v105.0 — Bản Đại Tu Cuối Cùng: 6 Chế Độ AI (Thêm Chế Độ 6 Tạo Bìa), Tự Copy + Chia Đôi Màn Hình Gemini & NotebookLM, Story Bible Giàu Định Dạng Kiểu Word + File PDF & Quy Trình 4 Bước Tab 1',
      date: '23/11/2026',
      dateLabel: 'Mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'Tự Động Copy Prompt & Chia Đôi Màn Hình Gemini / NotebookLM (Tab 1, 2, 3, 4): Mọi Chế độ 1–6 tự động copy sẵn câu lệnh tổng hợp, nhắc rõ Mô hình & Mức tư duy mong muốn (Hydrogen / Neon / Argon / Carbon luôn hiện đủ) và mở cửa sổ chia đôi 50/50 với Gemini Web/App (hoặc Google NotebookLM cho Chế độ 3, 4, 5 & Tab 4).',
        'Cảnh Báo Thông Minh Khi Chương Truyện Thay Đổi: Tự phát hiện sửa/thêm chương để nhắc cập nhật Tham mưu cốt truyện (Chế độ 2) và Story Bible trước khi chạy Chế độ 1/Chế độ 2 (có ô "Không hiện cảnh báo này cho lần sau") và hiện nhắc nhở trực tiếp ngay cạnh Story Bible ở Tab 4.',
        'Chế Độ 6 Mới — Tạo Bìa Truyện Bằng AI (10+ Phong Cách + Tự Nhập Tự Do): Kết hợp Story Bible & nhân vật để sinh câu lệnh vẽ bìa chuẩn, kèm hình mô phỏng chỉ đúng nút "+ → 🖼️ Tạo hình ảnh" trên Gemini.',
        'Story Bible Kiểu Word/Google Docs + File Story Bible + Quy Trình 4 Bước Tab 1: Soạn/dán giữ trọn Bảng, Icon, Emoji, Hình ảnh; xuất PDF Story Bible tự lưu bản sao vào thư mục con "Story Bible/" & liên kết tự động cho toàn bộ Chế độ 1–6; thanh quy trình 4 bước gạch chân ngay trên Tab 1 bấm nhảy thẳng tới đúng chế độ!',
      ],
    },
    {
      version: 'v104.0 — Hoàn Thiện 45 Module: Casio fx-570VN+ & Desmos (Mod 45), Desktop YouTube Trực Tiếp (0.25x–4x, Cửa Sổ Nổi, YTSave), Mobile A–B Auto-Jump & AI Nói 6 Ngôn Ngữ (Google Dịch TTS)',
      date: '22/11/2026',
      dateLabel: 'Mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'Desktop & App Desktop YouTube Trực Tiếp (Mod 39 & Mod 21): Bỏ dò luồng công cộng trên Desktop, phát thẳng youtube-nocookie.com mượt trong nền với tốc độ mở rộng 0.25x / 0.5x / 0.75x / 1x / 1.25x / 1.5x / 1.75x / 2x / 3x / 4x, đổi tên & nâng cấp "🖼️ Cửa sổ nổi" (Document PiP + Cửa sổ kéo thả mọi Tab).',
        'Mobile A–B Tự Nhảy Qua Dấu ":" & Popup YTSave Mới: Nhập 2 chữ số phút trên điện thoại tự nhảy sang giây (03 → 03: → 03:38); hộp tải YTSave chỉ mô phỏng ô dán link + nút Download nhấp nháy kèm nút "Điều hướng thẳng tới YTSave (không hiện lại)" và nút "🚀 Mở YTSave Ngay ↗" nhấp nháy nổi bật nhất.',
        'Module 45 (Tab 6 Mục #5 & Credit): Máy tính khoa học Casio fx-570VN PLUS đầy đủ chức năng + Nút "Tạo hàm đồ thị" tương tác kiểu Desmos 100% nội bộ, kèm Dự báo Thời Tiết 24 giờ từng tiếng cấp Phường (Mod 43), Khắc phục triệt để liệt nút PWA/Tab thường (SW v104) & Tự Lưu 2 giây mọi trạng thái (Mod 09).',
        'Giọng Đọc AI 6 Ngôn Ngữ (Mod 28, Mod 33, Mod 27): Hỗ trợ đầy đủ Tiếng Việt, English, 中文 (简体), 中文 (繁體), 한국어, 日本語 qua Neural Voice và tự động dùng Google Dịch TTS dự phòng cho cả Video Hướng Dẫn 28 mốc (đủ 45 Module) lẫn Trợ lý AI!',
      ],
    },
    {
      version: 'v52.0 — Nối Âm Thanh YouTube ➔ MP3 Nền Mục 3, Tự Lưu 2s Toàn Diện, Cổng Gọn & Sửa Triệt Để Responsive Mobile + Fullscreen Video Tab 6',
      date: '17/11/2026',
      dateLabel: 'Mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'Mục 5 YouTube tự động chạy nền qua hạ tầng Mục 3 MP3 (Mod 39 & Mod 21): Hiện video ngay khi chọn, đồng bộ 2 chiều Phát/Dừng/Tua, tự ngắt tiếng bài cũ khi đổi video và hỏi xác nhận khi bật MP3 máy lúc YouTube đang chạy.',
        'Tự động lưu 3 tầng mỗi 2 giây & mọi đổi trạng thái (Mod 09/29/36): Lưu đủ từ gõ/xóa chữ, thu gọn/mở rộng các khối, tắt nhạc/video, cỡ chữ, ngôn ngữ, đồng hồ & vị trí Tab/cuộn cuối trước khi thoát.',
        'Cổng Kết Nối 2 bước tinh gọn & ổn định giao diện: Sửa lỗi không cuộn tới đáy trên PC, lược nút rườm rà, hết rung giật nút YouTube & hỗ trợ popup thông báo lịch từ Google Sheet (Mod 34).',
        'Sửa triệt để lỗi mất mép trên (Top-Clip) Mobile ở toàn bộ 6 Tab & mọi Popup + Rạp Video Tab 6 (~12:22, 25 mốc): Tự tính tỷ lệ khung 16:9 khít màn hình Fullscreen trên cả Điện thoại dọc/ngang và Desktop.',
      ],
    },
    {
      version: 'v46.0 — Sửa Repeat/A–B Không Đen Video & Đồng Bộ Nền Chặt (Mod 39/40), Cỡ Chữ Toàn Web, Chuỗi Điểm Danh, Ô #5 Linh Tinh & Video Tràn Khung Mobile',
      date: '15/11/2026',
      dateLabel: 'Mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'Sửa triệt để YouTube Repeat/A–B & Đồng bộ Video Nền (Mod 39/40 + nativePlayer): Không phá hủy hay làm đen iframe khi bật Lặp toàn video / A–B; Video nền đồng bộ tức thì Tạm dừng / Phát / Tua theo cả iframe lẫn luồng HTML5 trực tiếp.',
        'Video Hướng Dẫn Hiển Thị Trọn Khung Trên Mobile & Fullscreen (Mod 28 + Mod 33): Gỡ triệt để lỗi co góc trên-trái trên điện thoại dọc & cập nhật thêm Phân đoạn #21 (~10:22) bao phủ mọi tính năng mới.',
        'Cỡ Chữ Toàn Trang 4 Mức (Nhỏ -> Rất to), Mốc Huy Hiệu Điểm Danh (7/21/90/365 ngày) & Ô #5 Chức Năng Linh Tinh tại Tab 6 tối ưu responsive trên mọi kích thước màn hình.',
        'Hoàn Thiện Đa Ngôn Ngữ 6 Thứ Tiếng (EN / 简体 / 繁體 / KO / JA / VI): Bao gồm cả Prompt Khung 5 Chế độ, thông báo góc thu/mở, thẻ trạng thái & định dạng ngày giờ thực tế từng quốc gia (YY/MM/DD, MM/DD/YY, dd/mm/yy).',
      ],
    },
    {
      version: 'v45.0 — Bộ 5 Module Ngôn Ngữ Quốc Tế, Guest Mode -> Tab 5 Nhấp Nháy 4s, Mod 44 Toàn Cầu v3, YouTube Hero Search + Crop & Chân Dung Mod 09',
      date: '14/11/2026',
      dateLabel: 'Mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'Hệ Thống 5 File Ngôn Ngữ Quốc Tế (i18n_lang_en / zh_cn / zh_tw / ko / ja.js): Đổi mượt toàn bộ giao diện qua Tiếng Anh, Trung Giản Thể, Trung Phồn Thể (Đài Loan), Hàn & Nhật (kèm khôi phục nguyên bản Tiếng Việt) tại góc phải trên Đầu Trang (Desktop & Mobile), Đầu Cổng và ngay dưới nút Ủng hộ ở Tab 6 — bảo toàn 100% chữ tiểu thuyết.',
        'Guest Mode Cải Tiến (Mod 41): Bấm vào nút Guest Mode nay điều hướng thẳng tới Tab 5 và làm nổi bật, nhấp nháy 4 giây đúng 2 khung Xem YouTube & Phát MP3 (tối ưu responsive không tràn viền Mobile).',
        'Mod 44 Toàn Cầu v3 & Sức Khỏe 3 Tầng Portrait (Mod 09): Đồng nhất số liệu Đang truy cập / Ngày / Tuần / Tháng / Năm / Toàn lịch sử trên máy chủ v3; mở rộng bảng Sức Khỏe Tự Lưu 3 Tầng với khung ảnh vuông Mai Hải Đăng lớn ở góc phải trên cùng mũi tên "Tác giả Đăng đẹp trai đang theo dõi bạn :))".',
        'YouTube Hero Search + Livestream Loop Lock + Crop Nền 2 Bước (Mod 39 & 40) + QR & PWA 1-Chạm (Mod 29 & 35): Thanh tìm kiếm lớn nổi bật dưới Ô Lớn #5, khóa Loop video phát trực tiếp, crop vùng khung hình Video tùy chọn Có/Không ép tràn màn hình, 4 thẻ cài App bấm trực tiếp và mã QR offline/mobile căn chuẩn đẹp.',
      ],
    },
    {
      version: 'v44.0 — Ô Thống Kê Truy Cập Tab 6 (Mod 44), Bộ Icon Chân Dung Mới, Phát Trong Nền & Màn Hình Thu Nhỏ Kéo Thả + Video ~10 Phút',
      date: '14/11/2026',
      dateLabel: 'Mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'Module 44 Mới (Tab 6 — Ô Thống Kê Truy Cập Duy Nhất): Nằm gọn ở khoảng trống giữa hàng đầu Tab 6 trên Desktop (và ngay dưới 2 nút góc trên trên Mobile/Tablet), hiển thị trực quan số người Đang truy cập cùng tổng lượt truy cập Hôm nay, Tuần này, Tháng này, Năm này và Toàn lịch sử theo múi giờ Việt Nam (GMT+7).',
        'Bộ Biểu Tượng Chân Dung Mới Đồng Bộ 100%: Thay toàn bộ favicon, bộ icon cài App PWA (Desktop, Android Maskable, iOS Apple Touch), logo đầu Cổng Kết Nối, thanh Header, Tab 6 PWA Status và Thẻ Giới Thiệu Tác Giả bằng ảnh chân dung "Web viết tiểu thuyết và giải trí" sắc nét.',
        'Video Hướng Dẫn Toàn Diện 20 Mốc (~09:52) & Spotlight Thật Mod 33: Mở rộng chi tiết lên 20 phân đoạn + 54 phụ đề song ngữ Việt/Anh bao quát đủ 44 Module gồm Đồng hồ Múi giờ & Báo thức MP3 (Mod 42), Thời tiết Real-Time 60FPS (Mod 43), Phát nhạc/YouTube trong nền + Màn hình thu nhỏ kéo thả, Guest Mode, Tải App PWA và Mod 44.',
        'Trải Nghiệm Đa Thiết Bị Hoàn Thiện: Giữ nguyên Khiên Chống Reload 7 tầng (Mod 36), Lưu trạng thái tệp _studio_workspace_state.json (Mod 41), 5 nút Thu gọn/Mở rộng rõ chữ ở Tab 5, YouTube không quảng cáo & phát trong nền cùng responsive sạch 100% cả Web lẫn App PWA.',
      ],
    },
    {
      version: 'v39.0 — Module 39 YouTube Sạch Quảng Cáo + Video Background, Video Hướng Dẫn Toàn Màn Hình & Viên Bi Số 8 3D',
      date: '13/11/2026',
      dateLabel: 'Mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'Module 39 Mới (Tab 5 Mục 5 — Xem Video YouTube hoặc Cài Video YouTube Làm Background): Hướng dẫn copy link YouTube chi tiết PC/Mobile, dán link mở trình phát sạch quảng cáo với Toàn màn hình, Lặp lại, Lặp đoạn A-B, Tốc độ, Tua ±10s, Âm lượng & cài video YouTube làm background xuyên suốt trang web.',
        'Video Hướng Dẫn & Giọng Đọc Việt Tự Nhiên (Mod 28 / Mod 33): Nâng cấp rạp video lớn hơn kèm nút Xem Toàn Màn Hình, đặt thanh Phụ đề Song ngữ VI/EN tách rời DƯỚI khung video (không che hình ảnh), cập nhật đủ 14 phân đoạn bao quát toàn bộ 39 Module, sửa dứt điểm lỗi Tắt tiếng (Mute) ở cả Video & Chatbot, đồng thời chặn fallback giọng Anh khi đọc Tiếng Việt.',
        'Linh Vật Viên Bi Số 8 Bản Vẽ 3D Cute (Mod 27): Thiết kế lại hình ảnh Bi Số 8 3D long lanh mắt sao má hồng giống nhân vật mẫu; khi thu gọn góc dưới phải chỉ hiện riêng Viên Bi Số 8 kèm dấu X đóng ở góc trái trên.',
        'Tab 3 AI 5 Chế Độ Tách Biệt & Gemini 4 Hydrogen #1 (Mod 02 / 14 / 15 / 16): Đặt Gemini 4 Hydrogen làm mô hình ưu tiên số 1 cho cả 5 chế độ; Chế độ 1 chạy độc quyền Prompt Tổng Hợp từ Story Bible & Dàn ý Chế độ 2, còn Chế độ 2–5 tách biệt gọn nhẹ kèm nút Mở to / Thu nhỏ Hộp Lệnh AI.',
        'Tab 2 & Mod 19 Hộp Xác Nhận Cập Nhật Story Bible Sau Duyệt + Mod 34 Google Sheets Sạch: Sau khi duyệt chương mới sẽ hỏi cập nhật Story Bible lũy tiến + gợi ý NotebookLM; báo lỗi gửi về Google Sheet nay chỉ ghi ngắn gọn đúng nội dung bug người dùng nhập.',
      ],
    },
    {
      version: 'v38.6 — Phủ Sóng Toàn Diện Gemini 4 Hydrogen + Tư Duy XHIGH & Tôn Vinh Author Credits / Biệt Danh "Bi" Tab 6',
      date: '13/11/2026',
      dateLabel: 'Mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'AI Model Catalog & Router (Mod 02 / Mod 15): Bổ sung chính thức 🧪 Gemini 4 Hydrogen (1M ngữ cảnh) kèm trọn bộ 4 mức tư duy LOW / MEDIUM / HIGH / Siêu Cao (XHIGH) — tự động chuẩn hóa tham số API riêng giữa Gemini 4 (LOW..XHIGH, chống gửi nhầm MINIMAL gây lỗi 400) và Gemini 3.x / 2.5.',
        'Đồng bộ đồng loạt tới MỌI chức năng AI: Trung tâm điều khiển Tab 3 + 4 nút pill Tư duy (Thấp / Trung bình / Cao / XHIGH), Cổng Xác nhận Bước 2, Chế độ 5 Biểu đồ (#mode5-thinking-level-select), Chatbot Viên Bi Số 8 (Mod 27), Tab 4 Đồng bộ AI Story Bible (sửa lỗi truyền tham số mod12 & bổ sung bộ chọn mô hình/tư duy), và Cửa sổ Duyệt & Chốt Bản Thảo (Mod 19).',
        'Tab 6 Author Credits (Mod 35): Nâng cấp khung vinh danh tác giả Mai Hải Đăng nổi bật rực rỡ với viền ánh kim/tím, huy hiệu Spotlight và dòng giải thích ấm áp về nickname ở nhà "Bi" — nguồn gốc tên gọi Web Viết Tiểu Thuyết Của Bi.'
      ],
    },
    {
      version: 'v38.5 — Tab 2 Header & Bộ Lọc Chuẩn Xác, Dẫn Hướng Chế Độ 1 -> 2, Khử Ký Tự Markdown AI, Tab 5 Select Đậm Đen & Bộ 3 Module 34-35-36',
      date: '13/11/2026',
      dateLabel: 'Bản phát hành ổn định',
      badgeTone: 'emerald',
      highlights: [
        'Tab 2 — Chống chồng chữ thanh trên & Đưa nút "✅ Duyệt & Chốt Bản Thảo" sang bên TRÁI; tối ưu flex-wrap để badge trạng thái không bao giờ chui xuống sau bảng thống kê từ.',
        'Tab 2 — Sửa bộ lọc chương: bấm "Nháp" chỉ hiện chương Nháp, bấm "Đã duyệt" chỉ hiện chương Đã duyệt, bấm "Tất cả" mới hiện toàn bộ danh sách.',
        'Tab 3 — 5 Chế độ AI (Mod 14/16/17): thêm chữ dẫn xám riêng cho từng chế độ (Chế độ 2 gợi mở "Bạn có thể liệt kê dàn ý thô ở đây..."), nhắc thân thiện nhảy thẳng sang Chế độ 2 nếu chạy Chế độ 1 khi chưa có gợi ý diễn biến, và tự động dệt kết quả Chế độ 2 vào Prompt tổng hợp của Chế độ 1.',
        'Lọc sạch Markdown/ký tự thô (**, *, ###, ---, ```) khỏi mọi Prompt lẫn đầu ra AI ở 5 Chế độ, Diff Review (Mod 11), Chatbot Viên Bi Số 8 (Mod 27) và Niên biểu Chế độ 5 (Mod 18).',
        'Tab 5 — Sửa toàn bộ hộp chọn <select> sang nền đen chữ trắng tương phản chuẩn mực; bổ sung "Web do Mai Hải Đăng phát triển" ở Cổng kết nối và "Tác giả web: Mai Hải Đăng" ở bảng Kiểm tra sức khỏe Autosave 3 tầng.',
        'Ra mắt Mod 34 (Tab 6 Báo lỗi sạch mật khẩu cho người dùng), Mod 35 (Bảng Author Credits cuộn dọc tri ân tác giả duy nhất Mai Hải Đăng + Gmail/Facebook) và Mod 36 (Khiên Chống Reload ngăn rớt trang khi gõ, Backspace, Ctrl+Z hay sao lưu).'
      ],
    },
    {
      version: 'v38.4 — Tab 5 Nền Đơn Sắc & Thu Gọn, Tab 4 Box 1 Khuôn Mẫu & Bóc Tách Gemini Flash, Tab 1 Tạo Chương Mới & Lá Chắn Chống Reload',
      date: '13/11/2026',
      dateLabel: 'Bản phát hành hoàn thiện',
      badgeTone: 'emerald',
      highlights: [
        'Tab 5 — Nền Đơn Sắc & Thu Gọn: Bổ sung 2 lựa chọn Nền Đen Tối Giản (OLED pitch-black #000000) và Nền Trắng Tối Giản (#ffffff giấy in chữ tương phản cao) vào Kho Tranh Nền Nghệ Thuật 0MB; thêm thanh điều khiển nhanh "⏫ Thu gọn hết Tab 5" và "⏬ Mở rộng tất cả Tab 5" giúp tối ưu front-end gọn gàng.',
        'Tab 4 — Khung Story Bible Mẫu (Box 1) hiển thị song song Box 2: Sửa triệt để tình trạng Box 1 bị thu gọn để trống khoảng trắng lớn; mặc định mở rộng song song Khung Cấu Trúc Mẫu và Nội dung Story Bible chính thức.',
        'Tab 4 — Hướng dẫn dán ngược từ NotebookLM & Gemini Flash tự động bóc tách: Bổ sung chỉ dẫn chi tiết dán Story Bible từ NotebookLM vào ô Box 2; tích hợp nút "⚡ Đồng Bộ Gemini Flash" và sự kiện tự động kích hoạt mô hình Gemini Flash liên kết API Key để bóc tách cập nhật vào Hồ sơ nhân vật đa chiều, Ma trận "Ai biết gì" và Sổ cái phục bút.',
        'Tab 1 — Nút Tạo Chương Mới: Bổ sung nút "➕ Tạo Chương Mới" ngay cạnh bộ chọn chương ở Bàn viết Tab 1, bấm 1 cú nhấp là khởi tạo chương mới và bắt đầu gõ ngay mà không phải chuyển sang Tab 2.',
        'Lá Chắn Chống Tải Lại Trang (Anti-Reload Guard): Cấu hình bỏ qua tệp bản thảo trong VS Code Live Server (.vscode/settings.json) và cô lập ghi đĩa ngầm, đảm bảo quá trình gõ chữ và tự động sao lưu 3 tầng (RAM + IDB + Thư mục ổ cứng) diễn ra hoàn toàn êm đềm, không bao giờ tự động reload trang hay nhảy về màn hình Cổng kết nối.'
      ],
    },
    {
      version: 'v38.3 — Module 33: Bảo Chứng API/Thư Mục/Pro-Ultra, Giọng Neural VI/EN & Video Giao Diện Web Thật',
      date: '12/11/2026',
      dateLabel: 'Cập nhật trước',
      badgeTone: 'cyan',
      highlights: [
        'Sửa dứt điểm lỗi Tab 6 (Mod 31) báo sai "Chưa nối Key / Chưa gắn thư mục": đồng bộ thực tế 100% từ Router, Flash-Lite Verification Seal, Thư mục ổ cứng thật và bộ chọn Gói Tài Khoản (Standard / Pro -> Argon 4 / Ultra -> Carbon 4).',
        'Tab 4 Mẹo Chống Quên NotebookLM nâng cấp sang đường link bôi đậm gạch chân bấm trực tiếp ngay trong câu: tải PDF gộp toàn truyện, mở sổ tay NotebookLM và copy câu lệnh chuẩn chỉ 1 chạm.',
        'Chatbot Trợ Lý Viên Bi Số 8 (Mod 27) mặc định luôn chọn mô hình Gemini 3.5 Flash-Lite để phản hồi tức thì và tiết kiệm tối đa hạn mức dài hạn mà không làm ảnh hưởng mô hình viết văn sâu ở Tab 3.',
        'Video Hướng Dẫn chiếu chính xác giao diện thật của chính trang web đang chạy (#mod33-real-dom-stage không trùng DOM ID) kết hợp Động cơ Giọng Nói Neural Song Ngữ Việt/Anh (tách cụm nhịp thở, chuẩn hóa từ điển kỹ thuật, chọn giọng HoaiMy/NamMinh/Aria Neural).',
        'Tối ưu Front-end Tab 6: hiển thị Cụm Mục Nổi Bật Nhất ở trên cùng, rút gọn mặc định toàn bộ các khối phụ bên dưới kèm nút "Thu gọn hết các mục" / "Mở rộng tất cả" và ma trận tự kiểm tra 6 tầng.',
      ],
    },
    {
      version: 'v38.2 — Module 32: Sân Khấu Nền Đa Tầng Kính Mờ & Cầu Nối Gemini Web Argon 4 / Carbon 4',
      date: '12/11/2026',
      highlights: [
        'Vá triệt để lỗi đen đặc nền web khi chọn Kho Tranh Nghệ Thuật hoặc Tải Ảnh/Video nền: sửa selector CSS từ body.dark sang html.dark / html:not(.dark), bổ sung canvas vẽ tranh chuyên biệt #mod32-procedural-art-canvas (z-[2]) và lưu trữ nhị phân IndexedDB bền vững qua F5.',
        'Bảng điều khiển Module 32 trong Tab 5 (#mod32-backdrop-stage-panel): chọn nhanh Preset độ trong suốt kính (Rõ Nét 88%, Cân Bằng 72%, Phim Đêm 58%), nút "Soi Rõ Nền 100%" giữ chuột xem toàn bộ nền, bộ lọc màu rạp phim (Vignette, Glow) và tự động kiểm định live getComputedStyle.',
        'Cầu nối Gemini Web Argon 4 / Carbon 4 (20.000+ từ): tích hợp trực tiếp ở cả Màn hình Duyệt Prompt Tổng (#modal-confirm-synthesized-prompt) và Màn hình Đang Chạy AI (#global-ai-blocking-loader) với 2 đường link bôi đậm gạch chân ("ấn vào đây để copy toàn bộ prompt tổng hợp" + link thẳng tới gemini.google.com/app) và ghi chú rõ ràng cần nâng cấp Pro cho Argon 4, Ultra cho Carbon 4.',
        'Đồng bộ Video Hướng Dẫn Cảnh 9 (28 giây, phụ đề song ngữ Việt/Anh & giọng đọc AI) + Danh bạ tính năng Tab 3 & Tab 5 trong Module 31.',
      ],
    },
    {
      version: 'v38.0 — Đại Tu Kiến Trúc 30 Module Độc Lập & Giao Diện Người Thật',
      dateLabel: 'Cập nhật mới nhất',
      badgeTone: 'emerald',
      highlights: [
        'Hợp nhất thành 1 file HTML sạch và 30 tệp JavaScript chuyên biệt, xóa bỏ hoàn toàn tình trạng gắn trùng sự kiện hoặc xung đột trạng thái.',
        'Dọn gọn Tab 3: bỏ 4 nút chế độ bên phải, bỏ thanh phụ dư thừa và khung dưới; tích hợp trọn vẹn Chèn nối tiếp / Thay thế / Sao chép / Cấu hình Prompt lên thanh đầu.',
        'Bỏ link Google Studio thừa và bảng thông số model rườm rà trong bảng chọn mô hình (API Key đã liên kết trực tiếp từ Két Sắt Tab 6).',
        'Khung soạn lệnh AI mặc định mở ở kích thước siêu rộng, tự động sửa dứt điểm lỗi báo thiếu câu lệnh khi người dùng đã gõ lệnh.',
        'Quy trình chạy AI chia 2 bước tường minh: (1) Ghép Story Bible + Mốc chuyển cảnh/POV + RAG BM25 + Câu lệnh -> (2) Hộp thoại xác nhận chọn lại mô hình kèm cảnh báo tránh dùng Flash-Lite cho chương chính.',
        'Bổ sung Chế độ 5 (Mode 5): AI phân tích diễn biến nhiều chương tự chọn và vẽ Biểu đồ Cốt Truyện SVG + Niên biểu chống mâu thuẫn.',
        'Duyệt & Chốt Bản Thảo: gỡ bỏ cửa sổ đầu ra dư thừa, giữ màn hình chờ gọn gàng và tự động trích xuất cập nhật Story Bible + mở khóa trạng thái Đã duyệt.',
        'Google Docs AI Diff Review tại Tab 1: đoạn chữ AI thêm vào hiển thị màu riêng biệt để tác giả bấm Chấp nhận hoặc Không chấp nhận từng cụm.',
        'Pomodoro Đồng Bộ 2 Chiều: sử dụng chung 1 kho trạng thái cho cả Tab 5 và thanh nổi Pomodoro.',
        'Kho Phiên Bản Time-Machine tại Tab 6: lưu snapshot liên tục, xem trước Preview phiên bản cũ toàn màn hình, so sánh Diff và khôi phục an toàn.',
        'Xuất PDF nâng cao: bổ sung lựa chọn Font chữ, Cỡ chữ (pt), giãn dòng và khung Preview trực tiếp trước khi in PDF.',
        'Xóa ô Chương 2 dư thừa tại Tab 1 và trau chuốt lại toàn bộ từ ngữ nút bấm, thông báo thân thiện, tự nhiên.',
      ],
    },
    {
      version: 'v37.5 — Gói Tính Năng Bổ Trợ WebNovel & Tự Động Khôi Phục Khẩn Cấp',
      dateLabel: 'Bản nâng cấp nền tảng',
      badgeTone: 'indigo',
      highlights: [
        'Bổ sung Từ điển Ngũ quan (Thị giác, Thính giác, Khứu giác, Xúc giác, Nội tâm) kèm công cụ viết Lời Tác Giả đầu/cuối chương.',
        'Ra mắt Lore Whisper (nhắc ngầm hồ sơ nhân vật ngay khi đang gõ tên) và thanh theo dõi Mục tiêu chữ hằng ngày.',
        'Tích hợp Quét từ sáo rỗng AI (Anti-Cliché), Đường cong cảm xúc SVG, So sánh nhịp độ mở/cao trào/kết chương.',
        'Khóa lưu 3 tầng (LocalStorage tức thời + IndexedDB + Đồng bộ thư mục ổ cứng thật File System Access API).',
      ],
    },
    {
      version: 'v37.0 — Tối Ưu Hóa Điện Thoại (Mobile PWA) & Âm Thanh Ngoại Tuyến',
      dateLabel: 'Chuẩn hóa đa thiết bị',
      badgeTone: 'amber',
      highlights: [
        'Thiết kế thanh 6 Tab cố định dưới đáy cho điện thoại màn hình dọc kết hợp thanh chèn nhanh ngoặc thoại 「 」, — , ***.',
        'Trình phát nhạc MP3 tích hợp bộ lặp đoạn A-B chuẩn xác từng mili-giây và 7 hiệu ứng âm thanh WebAudio ngoại tuyến.',
        'Cảnh nền hạt sáng 60FPS tối ưu tiết kiệm pin trên điện thoại và chế độ Đèn lồng / Mưa / Đom đóm êm mắt.',
      ],
    },
  ]);

  /**
   * Bảng hướng dẫn chọn mô hình Gemini mới nhất & chiến lược giữ chất lượng văn chương.
   */
  const UP_TO_DATE_MODEL_STRATEGY_GUIDE = Object.freeze([
    {
      tier: 'THẾ HỆ GEMINI 4 — SIÊU SUY LUẬN XHIGH & ĐẠI TỰ SỰ',
      models: ['gemini-4-hydrogen', 'gemini-4-argon', 'gemini-4-carbon'],
      badge: 'GEMINI 4 (XHIGH / Pro / Ultra)',
      toneClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
      advice:
        'Gemini 4 Hydrogen cân bằng mượt giữa tốc độ & suy luận đa tầng Story Bible (hỗ trợ đầy đủ LOW / MEDIUM / HIGH / XHIGH); Argon 4 & Carbon 4 chuyên sâu đại tự sự và tâm lý chiến.'
    },
    {
      tier: 'CẤP ĐỘ CAO NHẤT — ĐỀ XUẤT VIẾT CHƯƠNG CHÍNH & PHỤC BÚT DÀI HƠI',
      models: ['gemini-3.1-pro-preview', 'gemini-pro-latest', 'gemini-2.5-pro'],
      badge: 'PRO TIER (Tư duy Cao)',
      toneClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      advice:
        'Giàu chiều sâu tâm lý, giữ giọng văn tự nhiên như tác giả người thật, kiểm soát mạch phục bút dài 30–100 chương và rất hợp khi bật Mức độ tư duy Trung bình/Cao.'
    },
    {
      tier: 'CẤP ĐỘ CÂN BẰNG TỐC ĐỘ — ĐỀ XUẤT VIẾT MỞ RỘNG & ĐỐI THOẠI NHANH',
      models: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3-flash-preview'],
      badge: 'FLASH TIER (Khuyên dùng)',
      toneClass: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
      advice:
        'Phản hồi nhanh, hạn mức rộng (Free/Tier đều mượt), tự động trượt sang alias live của Key và giữ câu văn ít sáo ngữ.'
    },
    {
      tier: 'CẤP ĐỘ NHẸ — CHỈ DÙNG GỢI Ý NHANH HOẶC XÁC THỰC KẾT NỐI',
      models: ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite-preview'],
      badge: 'CẢNH BÁO FLASH-LITE',
      toneClass: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      advice:
        'Rất tiết kiệm hạn mức ngắn hạn (RPM) & dài hạn (RPD), nhưng văn phong dễ tóm lược ngắn khi viết chương dài. Nên dùng Flash trở lên để viết tiểu thuyết.'
    }
  ]);

  /**
   * Danh sách phím tắt giúp thao tác nhanh như trình soạn thảo chuyên nghiệp.
   */
  const STUDIO_SHORTCUTS_CHEATSHEET = Object.freeze([
    { keys: 'Alt + 1 .. 6', action: 'Chuyển nhanh giữa 6 màn hình (Bàn Viết, Chương, AI, Bible, Nhạc, Cài đặt)' },
    { keys: 'Ctrl + S', action: 'Lưu cưỡng bức 3 tầng & tạo điểm mốc an toàn ngay lập tức' },
    { keys: 'Ctrl + F', action: 'Mở/Đóng thanh Tìm kiếm & Thay thế ngay trong Tab 1' },
    { keys: 'F11 (hoặc nút 🧘)', action: 'Bật/Tắt chế độ Tập Trung Toàn Màn Hình (Zen Mode)' },
    { keys: 'Ctrl + Shift + L', action: 'Quét nhanh sáo ngữ AI & phân tích nhịp độ đoạn văn' },
    { keys: 'Esc', action: 'Đóng hộp thoại hoặc thanh công cụ nổi đang mở trên cùng' },
  ]);

  /**
   * Trình phát âm thanh WebAudio nhẹ khi chuyển phân đoạn hướng dẫn (tắt mặc định để không làm phiền).
   */
  class TutorialTransitionChimeSynth {
    constructor() {
      this.audioCtx = null;
      this.enabled = false;
    }

    setEnabled(flag) {
      this.enabled = Boolean(flag);
    }

    playSoftTransitionTone(pitchHz = 528) {
      if (!this.enabled) return;
      try {
        const AudioCtx = globalScope.AudioContext || globalScope.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitchHz, now);
        osc.frequency.exponentialRampToValueAtTime(pitchHz * 1.18, now + 0.14);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } catch (_err) {
        // Bỏ qua nếu trình duyệt chặn AudioContext trước khi có tương tác
      }
    }
  }

  /**
   * Trình đọc thuyết minh AI tự nhiên & dễ thương (Tiếng Việt / Tiếng Anh) đồng bộ theo phụ đề.
   */
  class TutorialAiVoiceNarrator {
    constructor() {
      this.enabled = false;
      this.language = 'vi-VN'; // 'vi-VN' | 'en-US'
      this.lastSpokenCueKey = '';
      this.playbackRate = 1.0;
      this.isPlayerPlayingFn = () => false;
    }

    isSupported() {
      return typeof globalScope !== 'undefined' && 'speechSynthesis' in globalScope && typeof globalScope.SpeechSynthesisUtterance === 'function';
    }

    setEnabled(flag) {
      this.enabled = Boolean(flag);
      if (!this.enabled) {
        this.stop();
      } else {
        this.lastSpokenCueKey = '';
      }
      return this.enabled;
    }

    setLanguage(lang) {
      const nv = globalScope.NoirStudio?.neuralVoice;
      this.language =
        typeof nv?.normalizeLangCode === 'function'
          ? nv.normalizeLangCode(lang)
          : ['vi-VN', 'en-US', 'zh-CN', 'zh-TW', 'ko-KR', 'ja-JP'].includes(lang)
            ? lang
            : 'vi-VN';
      this.lastSpokenCueKey = '';
      this.stop();
      return this.language;
    }

    setPlaybackRate(rate) {
      this.playbackRate = Math.max(0.7, Math.min(1.6, Number(rate || 1)));
    }

    pickBestCuteVoice(langCode) {
      if (!this.isSupported()) return null;
      const nv = globalScope.NoirStudio?.neuralVoice;
      if (nv && typeof nv.pickBestNaturalVoice === 'function') {
        const picked = nv.pickBestNaturalVoice(langCode);
        if (picked && !picked.isGoogleTranslateTts) return picked;
      }
      const voices = globalScope.speechSynthesis.getVoices?.() || [];
      if (!voices.length) return null;
      const prefix = String(langCode || 'vi-VN').split('-')[0].toLowerCase();
      return voices.find((v) => String(v.lang || '').toLowerCase().startsWith(prefix)) || null;
    }

    resolveLocalizedCueText(cue, langCode) {
      if (!cue) return '';
      if (langCode === 'vi-VN') return cue.text || cue.textEn || '';
      if (langCode === 'en-US') return cue.textEn || cue.text || '';
      if (cue.textByLang && cue.textByLang[langCode]) return cue.textByLang[langCode];
      const i18nMap = {
        'zh-CN': 'zh-CN',
        'zh-TW': 'zh-TW',
        'ko-KR': 'ko',
        'ja-JP': 'ja',
      };
      const targetI18n = i18nMap[langCode];
      const i18nInst = globalScope.NoirStudio?.i18n || globalScope.NoirNovel?.i18n;
      if (targetI18n && i18nInst && typeof i18nInst.translateText === 'function') {
        const translated = i18nInst.translateText(cue.text || '', targetI18n);
        if (translated && translated !== cue.text) return translated;
      }
      return cue.textEn || cue.text || '';
    }

    speakCueIfNeeded(cue, isPlaying) {
      if (!this.enabled || !isPlaying || !cue) return;
      const cueKey = `${cue.id}_${this.language}`;
      if (this.lastSpokenCueKey === cueKey) return;
      this.lastSpokenCueKey = cueKey;

      const textToRead = this.resolveLocalizedCueText(cue, this.language);
      if (!textToRead) return;

      const neuralVoice = globalScope.NoirStudio?.neuralVoice;
      if (neuralVoice && typeof neuralVoice.speakText === 'function') {
        const spoken = neuralVoice.speakText(textToRead, this.language, {
          source: 'VIDEO',
          suppressInstallModal: true,
          rate: Math.min(1.32, Math.max(0.88, this.playbackRate * 1.0)),
          pitch: 1.0,
          isAllowedFn: () => Boolean(this.enabled && this.isPlayerPlayingFn()),
        });
        if (spoken || neuralVoice.lastFailureReason === 'NO_VI_VOICE') {
          return;
        }
      }

      if (!this.isSupported()) return;
      try {
        const bestVoice = this.pickBestCuteVoice(this.language);
        if (this.language === 'vi-VN' && !bestVoice) {
          return;
        }
        globalScope.speechSynthesis.pause?.();
        globalScope.speechSynthesis.cancel();
        const utter = new globalScope.SpeechSynthesisUtterance(textToRead);
        utter.lang = bestVoice?.lang || this.language;
        if (bestVoice) utter.voice = bestVoice;
        utter.pitch = 1.0;
        utter.rate = Math.min(1.32, Math.max(0.88, this.playbackRate * 1.0));
        utter.volume = 0.95;
        globalScope.speechSynthesis.speak(utter);
      } catch (_err) {
        // Bỏ qua an toàn nếu trình duyệt chưa cấp quyền SpeechSynthesis
      }
    }

    stop() {
      this.lastSpokenCueKey = '';
      globalScope.NoirStudio?.neuralVoice?.stopAll?.();
      globalScope.NoirStudio?.neuralVoice?.stop?.();
      if (!this.isSupported()) return;
      try {
        globalScope.speechSynthesis.pause?.();
        globalScope.speechSynthesis.cancel();
      } catch (_err) {}
    }
  }

  /**
   * Công cụ vẽ trình diễn Video Hoạt Họa 60FPS bằng HTML5 Canvas cho 8 phân đoạn hướng dẫn.
   * Hỗ trợ phát/tạm dừng, tua thanh trượt, marker từng chức năng, giọng đọc AI VI/EN & phụ đề song ngữ.
   */
  class AnimatedCanvasTutorialPlayer {
    constructor(options = {}) {
      this.chapters = Array.isArray(options.chapters) ? options.chapters : VIDEO_TUTORIAL_CHAPTERS_DATA;
      this.subtitles = Array.isArray(options.subtitles) ? options.subtitles : SYNCHRONIZED_SUBTITLE_TRACK_V38;
      this.totalDurationSec = this.chapters.reduce((acc, ch) => Math.max(acc, ch.endSec), 190);
      this.currentTimeSec = 0;
      this.playbackRate = 1.0;
      this.isPlaying = false;
      this.subtitlesVisible = true;
      this.subtitleLangMode = 'BOTH'; // 'BOTH' | 'VI' | 'EN'
      this.subtitleFontScale = 1.0;
      this.lastFrameTimestampMs = 0;
      this.rafId = null;
      this.activeChapterId = this.chapters[0]?.id || 'CHAP_01_ENTRY_GATE_AND_ARCHITECTURE';
      this.lastCueId = '';
      this.chimeSynth = new TutorialTransitionChimeSynth();
      this.voiceNarrator = new TutorialAiVoiceNarrator();
      this.voiceNarrator.isPlayerPlayingFn = () => Boolean(this.isPlaying);
      this.canvasEl = null;
      this.ctx = null;
      this.canvasResizeObserver = null;
      this.deferredResizeRafId = null;
      this.deferredResizeTimerId = null;
      this.onTickCallbacks = new Set();
    }

    attachCanvas(canvasElement) {
      this.clearCanvasObservers();
      this.canvasEl = canvasElement || null;
      this.ctx = this.canvasEl ? this.canvasEl.getContext('2d') : null;
      this.resizeCanvasToContainer();
      this.renderCurrentFrame();

      if (this.canvasEl && typeof window !== 'undefined') {
        const resyncCanvas = () => {
          if (!this.canvasEl) return;
          if (this.resizeCanvasToContainer()) {
            this.renderCurrentFrame();
          }
        };
        if (typeof window.ResizeObserver === 'function') {
          this.canvasResizeObserver = new window.ResizeObserver(() => resyncCanvas());
          this.canvasResizeObserver.observe(this.canvasEl);
          if (this.canvasEl.parentElement) {
            this.canvasResizeObserver.observe(this.canvasEl.parentElement);
          }
        }
        if (typeof window.requestAnimationFrame === 'function') {
          this.deferredResizeRafId = window.requestAnimationFrame(() => {
            this.deferredResizeRafId = null;
            resyncCanvas();
          });
        }
        this.deferredResizeTimerId = window.setTimeout(() => {
          this.deferredResizeTimerId = null;
          resyncCanvas();
        }, 60);
      }
    }

    clearCanvasObservers() {
      if (this.canvasResizeObserver) {
        try {
          this.canvasResizeObserver.disconnect();
        } catch (_e) {}
        this.canvasResizeObserver = null;
      }
      if (this.deferredResizeRafId && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(this.deferredResizeRafId);
      }
      this.deferredResizeRafId = null;
      if (this.deferredResizeTimerId && typeof window !== 'undefined') {
        window.clearTimeout(this.deferredResizeTimerId);
      }
      this.deferredResizeTimerId = null;
    }

    detachCanvas() {
      this.pause();
      this.clearCanvasObservers();
      this.canvasEl = null;
      this.ctx = null;
    }

    subscribeTick(callback) {
      if (typeof callback === 'function') {
        this.onTickCallbacks.add(callback);
      }
      return () => this.onTickCallbacks.delete(callback);
    }

    notifyTickListeners() {
      const state = this.getPlaybackSnapshot();
      this.onTickCallbacks.forEach((cb) => {
        try {
          cb(state);
        } catch (_err) {
          // Không để lỗi callback UI làm đứng vòng lặp dựng hình
        }
      });
    }

    resizeCanvasToContainer() {
      if (!this.canvasEl || typeof window === 'undefined') return false;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = this.canvasEl.getBoundingClientRect();
      const parentRect = this.canvasEl.parentElement?.getBoundingClientRect?.();
      const measuredWidth = Math.max(rect?.width || 0, parentRect?.width || 0);
      const targetCssWidth = Math.max(240, Math.round(measuredWidth || 720));
      const targetCssHeight = Math.round(targetCssWidth * (9 / 16));
      const nextBackingW = Math.round(targetCssWidth * dpr);
      const nextBackingH = Math.round(targetCssHeight * dpr);
      const changed =
        this.canvasEl.width !== nextBackingW ||
        this.canvasEl.height !== nextBackingH;
      if (changed) {
        this.canvasEl.width = nextBackingW;
        this.canvasEl.height = nextBackingH;
      }
      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return changed;
    }

    getCurrentChapter() {
      const t = this.currentTimeSec;
      for (const ch of this.chapters) {
        if (t >= ch.startSec && t < ch.endSec) return ch;
      }
      return this.chapters[this.chapters.length - 1] || this.chapters[0];
    }

    getCurrentSubtitleCue() {
      const t = this.currentTimeSec;
      for (const cue of this.subtitles) {
        if (t >= cue.startSec && t < cue.endSec) return cue;
      }
      return this.subtitles[this.subtitles.length - 1] || null;
    }

    getPlaybackSnapshot() {
      const chapter = this.getCurrentChapter();
      const cue = this.getCurrentSubtitleCue();
      return {
        currentTimeSec: this.currentTimeSec,
        totalDurationSec: this.totalDurationSec,
        progressPct: Math.min(100, Math.max(0, (this.currentTimeSec / this.totalDurationSec) * 100)),
        isPlaying: this.isPlaying,
        playbackRate: this.playbackRate,
        subtitlesVisible: this.subtitlesVisible,
        subtitleFontScale: this.subtitleFontScale,
        chapter,
        cue,
      };
    }

    formatSecToMmSs(sec) {
      const safe = Math.max(0, Math.floor(Number(sec || 0)));
      const mm = Math.floor(safe / 60);
      const ss = safe % 60;
      return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }

    play() {
      if (this.isPlaying) return;
      if (this.currentTimeSec >= this.totalDurationSec - 0.15) {
        this.currentTimeSec = 0;
      }
      this.isPlaying = true;
      this.lastFrameTimestampMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.voiceNarrator.speakCueIfNeeded(this.getCurrentSubtitleCue(), true);
      this.scheduleNextAnimationFrame();
      this.notifyTickListeners();
    }

    pause() {
      this.isPlaying = false;
      this.voiceNarrator.stop();
      if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.renderCurrentFrame();
      this.notifyTickListeners();
    }

    togglePlayPause() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    seekToSeconds(seconds, autoPlay = false) {
      const clamped = Math.max(0, Math.min(this.totalDurationSec - 0.05, Number(seconds || 0)));
      this.currentTimeSec = clamped;
      this.voiceNarrator.lastSpokenCueKey = '';
      const chap = this.getCurrentChapter();
      if (chap && chap.id !== this.activeChapterId) {
        this.activeChapterId = chap.id;
        this.chimeSynth.playSoftTransitionTone(480 + chap.index * 36);
      }
      this.renderCurrentFrame();
      this.notifyTickListeners();
      if (autoPlay && !this.isPlaying) {
        this.play();
      } else if (this.isPlaying) {
        this.voiceNarrator.speakCueIfNeeded(this.getCurrentSubtitleCue(), true);
      }
    }

    jumpToChapterById(chapterId, autoPlay = true) {
      const target = this.chapters.find((c) => c.id === chapterId);
      if (!target) return false;
      this.seekToSeconds(target.startSec + 0.05, autoPlay);
      return true;
    }

    stepChapter(delta) {
      const cur = this.getCurrentChapter();
      const curIdx = this.chapters.findIndex((c) => c.id === cur?.id);
      const nextIdx = Math.max(0, Math.min(this.chapters.length - 1, curIdx + delta));
      const target = this.chapters[nextIdx];
      if (target) {
        this.seekToSeconds(target.startSec + 0.05, this.isPlaying);
      }
    }

    setPlaybackRate(rate) {
      const num = Number(rate || 1);
      this.playbackRate = Math.max(0.5, Math.min(2.0, num));
      this.voiceNarrator.setPlaybackRate(this.playbackRate);
      this.notifyTickListeners();
    }

    setSubtitleLangMode(mode) {
      this.subtitleLangMode = ['BOTH', 'VI', 'EN'].includes(mode) ? mode : 'BOTH';
      this.renderCurrentFrame();
      this.notifyTickListeners();
      return this.subtitleLangMode;
    }

    toggleSubtitlesVisible() {
      this.subtitlesVisible = !this.subtitlesVisible;
      this.renderCurrentFrame();
      this.notifyTickListeners();
      return this.subtitlesVisible;
    }

    scheduleNextAnimationFrame() {
      if (!this.isPlaying || typeof requestAnimationFrame !== 'function') return;
      this.rafId = requestAnimationFrame((nowMs) => {
        if (!this.isPlaying) return;
        const deltaSec = Math.min(0.1, Math.max(0.001, (nowMs - this.lastFrameTimestampMs) / 1000));
        this.lastFrameTimestampMs = nowMs;
        this.currentTimeSec += deltaSec * this.playbackRate;

        const curChap = this.getCurrentChapter();
        if (curChap && curChap.id !== this.activeChapterId) {
          this.activeChapterId = curChap.id;
          this.chimeSynth.playSoftTransitionTone(460 + curChap.index * 34);
        }

        const curCue = this.getCurrentSubtitleCue();
        if (curCue && curCue.id !== this.lastCueId) {
          this.lastCueId = curCue.id;
          this.voiceNarrator.speakCueIfNeeded(curCue, true);
          this.notifyTickListeners();
        }

        if (this.currentTimeSec >= this.totalDurationSec) {
          this.currentTimeSec = this.totalDurationSec;
          this.pause();
          return;
        }

        // Resize được xử lý bởi ResizeObserver — không gọi layout reflow mỗi khung hình 60FPS
        this.renderCurrentFrame();
        this.notifyTickListeners();
        this.scheduleNextAnimationFrame();
      });
    }

    drawRoundedRect(ctx, x, y, w, h, radius) {
      const r = Math.min(radius, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    drawAnimatedPointer(ctx, x, y, pulseRatio, accentHex) {
      ctx.save();
      const ringRadius = 8 + pulseRatio * 14;
      ctx.strokeStyle = accentHex;
      ctx.globalAlpha = Math.max(0.1, 0.75 - pulseRatio * 0.65);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 12, y + 10);
      ctx.lineTo(x + 6, y + 11);
      ctx.lineTo(x + 4, y + 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    renderCurrentFrame() {
      if (!this.ctx || !this.canvasEl) return;
      const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
      const w = this.canvasEl.width / dpr;
      const h = this.canvasEl.height / dpr;
      const ctx = this.ctx;
      const chap = this.getCurrentChapter() || this.chapters[0];
      const cue = this.getCurrentSubtitleCue();
      const sceneDuration = Math.max(1, chap.endSec - chap.startSec);
      const localSec = Math.max(0, this.currentTimeSec - chap.startSec);
      const localProgress = Math.min(1, localSec / sceneDuration);

      ctx.clearRect(0, 0, w, h);

      const domMirror = globalScope.NoirStudio?.liveDomVideoMirror;
      if (domMirror && domMirror.enabled) {
        domMirror.syncMirrorForChapter(chap.id, false);
        if (domMirror.isMirrorActiveAndMounted()) {
          const cue = this.getCurrentSubtitleCue();
          domMirror.drawTransparentLiveDomOverlay(this, ctx, w, h, chap, cue, localProgress);
          return;
        }
      }

      // Nền Studio tối mịn với quầng sáng động theo màu từng phân đoạn
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#090d14');
      bgGrad.addColorStop(1, '#111827');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w * 0.78, h * 0.22, 12, w * 0.78, h * 0.22, w * 0.65);
      radial.addColorStop(0, `${chap.accentColor}2e`);
      radial.addColorStop(1, 'transparent');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);

      // Lưới tọa độ siêu mờ tạo chiều sâu kỹ thuật
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 36) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 36) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      ctx.restore();

      // Thanh tiêu đề giao diện THẬT của Web viết tiểu thuyết của Bi (6 Tab + Trạng thái lưu)
      this.drawRoundedRect(ctx, 14, 10, w - 28, 38, 10);
      ctx.fillStyle = 'rgba(10, 12, 16, 0.94)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
      ctx.stroke();

      // Logo Web tiểu thuyết của Bi
      this.drawRoundedRect(ctx, 20, 16, 128, 26, 7);
      ctx.fillStyle = '#052e16';
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 9.5px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('● ✍️ Web tiểu thuyết', 26, 29);

      // 6 Nút Tab mô phỏng đúng giao diện thật
      const activeTabMap = {
        CHAP_01_SIX_SCREENS: 0,
        CHAP_02_TAB1_DIFF_AND_SENSES: 0,
        CHAP_03_TAB2_RAG_IMPORT: 1,
        CHAP_04_TAB3_TWO_STEP_AI: 2,
        CHAP_05_MODE5_TIMELINE_DIAGRAM: 2,
        CHAP_06_TAB4_SMART_APPROVAL: 3,
        CHAP_07_TAB5_POMODORO_SYNC: 4,
        CHAP_08_TAB6_TIME_MACHINE_PDF: 5,
        CHAP_09_MOD32_STAGE_AND_ARGON_BRIDGE: 4,
      };
      const hotTab = activeTabMap[chap.id] ?? 0;
      const realTabs = ['1. Viết', '2. Chương', '3. AI 5 Chế Độ', '4. Bible', '5. Nhạc & Nền', '6. Cài Đặt'];
      const tabsStartX = 156;
      const tabsAvailW = Math.max(180, w - tabsStartX - 96);
      const pillW = Math.floor(tabsAvailW / 6) - 4;
      realTabs.forEach((lbl, idx) => {
        const px = tabsStartX + idx * (pillW + 4);
        const isOn = idx === hotTab;
        this.drawRoundedRect(ctx, px, 17, pillW, 24, 6);
        ctx.fillStyle = isOn ? '#059669' : 'rgba(24, 24, 27, 0.95)';
        ctx.fill();
        ctx.strokeStyle = isOn ? '#34d399' : 'rgba(63, 63, 70, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isOn ? '#ffffff' : '#a1a1aa';
        ctx.font = `bold ${Math.max(8, Math.min(9.5, pillW * 0.12))}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(lbl, px + pillW / 2, 29);
      });

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10.5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${this.formatSecToMmSs(this.currentTimeSec)} / ${this.formatSecToMmSs(this.totalDurationSec)}`,
        w - 22,
        29
      );

      // Khu vực dựng hoạt cảnh mô phỏng sát giao diện website
      const stageX = 18;
      const stageY = 56;
      const stageW = w - 36;
      const subBoxH = this.subtitlesVisible ? (this.subtitleLangMode === 'BOTH' ? 76 : 56) : 0;
      const stageH = this.subtitlesVisible ? h - subBoxH - 76 : h - 68;
      this.drawSceneStage(ctx, chap.sceneType, stageX, stageY, stageW, stageH, localProgress, chap.accentColor);

      // Thanh nổi thu gọn mô phỏng ở góc dưới sân khấu (🍅 Pomodoro | 🎵 Nhạc | 🤖 AI & 💬 Chat Bi)
      if (!this.subtitlesVisible || stageH > 130) {
        const dockY = stageY + stageH - 22;
        this.drawRoundedRect(ctx, stageX + 8, dockY, 152, 18, 9);
        ctx.fillStyle = 'rgba(9, 13, 20, 0.92)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
        ctx.stroke();
        ctx.fillStyle = '#fdba74';
        ctx.font = 'bold 8.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🍅 25:00  •  🎵 Mưa Đêm', stageX + 16, dockY + 9);

        this.drawRoundedRect(ctx, stageX + stageW - 156, dockY, 148, 18, 9);
        ctx.fillStyle = 'rgba(9, 13, 20, 0.92)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.stroke();
        ctx.fillStyle = '#6ee7b7';
        ctx.textAlign = 'right';
        ctx.fillText('🤖 AI 5 Chế Độ · 🎱 Bi #8', stageX + stageW - 14, dockY + 9);
      }

      // Khung Canvas giờ giữ sạch 100% hình ảnh video hướng dẫn;
      // Phụ đề song ngữ VI/EN nằm riêng hoàn toàn bên dưới khung video (#mod28-subtitle-theater-bar).
    }

    drawWrappedSubtitleText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
      const words = String(text || '').split(/\s+/);
      const lines = [];
      let currentLine = '';
      for (const word of words) {
        const probe = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(probe).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
          if (lines.length >= maxLines) break;
        } else {
          currentLine = probe;
        }
      }
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
      lines.forEach((line, idx) => {
        ctx.fillText(line, x, y + idx * lineHeight);
      });
    }

    drawSceneStage(ctx, sceneType, x, y, w, h, t, accent) {
      switch (sceneType) {
        case 'SIX_SCREENS_MAP':
          this.renderSceneSixScreensMap(ctx, x, y, w, h, t, accent);
          break;
        case 'TAB1_DIFF_REVIEW':
          this.renderSceneTab1DiffReview(ctx, x, y, w, h, t, accent);
          break;
        case 'TAB2_CHAPTER_RAG':
          this.renderSceneTab2ChapterRag(ctx, x, y, w, h, t, accent);
          break;
        case 'TWO_STEP_PROMPT':
          this.renderSceneTwoStepPrompt(ctx, x, y, w, h, t, accent);
          break;
        case 'MODE5_PLOT_GRAPH':
          this.renderSceneMode5PlotGraph(ctx, x, y, w, h, t, accent);
          break;
        case 'TAB4_BIBLE_MATRIX':
          this.renderSceneTab4BibleMatrix(ctx, x, y, w, h, t, accent);
          break;
        case 'POMODORO_TWO_WAY_SYNC':
          this.renderScenePomodoroSync(ctx, x, y, w, h, t, accent);
          break;
        case 'ARGON_WEB_AND_AMBIENT_STAGE':
          this.renderSceneArgonWebAndAmbientStage(ctx, x, y, w, h, t, accent);
          break;
        case 'WEATHER_CLOCK_ALARM_STAGE':
          this.renderSceneWeatherClockAlarm(ctx, x, y, w, h, t, accent);
          break;
        case 'MINI_PLAYER_AND_TRAFFIC_STAGE':
          this.renderSceneMiniPlayerAndTraffic(ctx, x, y, w, h, t, accent);
          break;
        case 'VERSION_VAULT_AND_PDF':
        default:
          this.renderSceneVersionVaultAndPdf(ctx, x, y, w, h, t, accent);
          break;
      }
    }
  }

  // =========================================================================
  // BỘ DỰNG HOẠT CẢNH 8 PHÂN ĐOẠN VIDEO CHI TIẾT TRÊN HTML5 CANVAS
  // =========================================================================
  Object.assign(AnimatedCanvasTutorialPlayer.prototype, {
    renderSceneSixScreensMap(ctx, x, y, w, h, t, accent) {
      const tabs = [
        { code: '1. Viết', desc: 'Soạn thảo & Diff AI' },
        { code: '2. Chương', desc: 'Nguồn & BM25 RAG' },
        { code: '3. AI 5 Chế Độ', desc: 'Prompt Tổng & SVG' },
        { code: '4. Story Bible', desc: 'Hồ sơ & Duyệt' },
        { code: '5. Nhạc & Pomo', desc: 'MP3 A-B & Pomodoro' },
        { code: '6. Phiên Bản', desc: 'Time-Machine & PDF' },
      ];
      const activeIdx = Math.floor((t * 6) % 6);
      const cols = 3;
      const gap = 12;
      const cardW = (w - gap * (cols + 1)) / cols;
      const cardH = (h - 62) / 2;

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('SƠ ĐỒ 6 MÀN HÌNH ĐỘC LẬP — TƯƠNG THÍCH DESKTOP & MOBILE BOTTOM NAV', x + 12, y + 6);

      tabs.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx = x + gap + col * (cardW + gap);
        const cy = y + 28 + row * (cardH + 10);
        const isHot = idx === activeIdx;

        this.drawRoundedRect(ctx, cx, cy, cardW, cardH, 10);
        ctx.fillStyle = isHot ? `${accent}22` : 'rgba(15, 23, 42, 0.82)';
        ctx.fill();
        ctx.strokeStyle = isHot ? accent : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = isHot ? 2 : 1;
        ctx.stroke();

        ctx.fillStyle = isHot ? accent : '#e2e8f0';
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.code, cx + 12, cy + 12);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.fillText(item.desc, cx + 12, cy + 32);

        if (isHot) {
          this.drawAnimatedPointer(ctx, cx + cardW - 28, cy + cardH - 22, (t * 6) % 1, accent);
        }
      });

      // Thanh Mobile Bottom Nav mô phỏng ở cạnh dưới
      const mobBarY = y + h - 22;
      this.drawRoundedRect(ctx, x + 12, mobBarY, w - 24, 20, 8);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📱 Mobile Bottom Nav 6 nút + Đã xóa ô Chương 2 dư thừa tại Tab 1', x + w / 2, mobBarY + 10);
    },

    renderSceneTab1DiffReview(ctx, x, y, w, h, t, accent) {
      const leftW = w * 0.62;
      const rightX = x + leftW + 14;
      const rightW = w - leftW - 14;

      // Khung trang giấy bản thảo bên trái
      this.drawRoundedRect(ctx, x, y, leftW, h, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('📄 BẢN THẢO TAB 1 — PHÂN BIỆT MÀU CHỮ AI VIẾT (GOOGLE DOCS DIFF)', x + 14, y + 12);

      // Đoạn tác giả viết
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px Georgia, serif';
      ctx.fillText('Tác giả: Tiếng mưa rả rích gõ lên mái tôn cũ kỹ...', x + 14, y + 40);

      // Đoạn AI mới chèn vào có nền màu khác biệt rõ ràng
      const revealAlpha = Math.min(1, t * 2.2);
      ctx.save();
      ctx.globalAlpha = revealAlpha;
      this.drawRoundedRect(ctx, x + 12, y + 66, leftW - 24, 58, 8);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.stroke();

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillText('+ ĐOẠN AI ĐỀ XUẤT BỔ SUNG (CỤM #1)', x + 22, y + 74);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'italic 11.5px Georgia, serif';
      ctx.fillText('Ánh đèn hành lang chớp tắt, hắt lên vệt bùn mới cạnh bậc cửa.', x + 22, y + 92);

      // Nút Chấp nhận / Từ chối bên dưới cụm diff
      const clickedAccept = t > 0.65;
      this.drawRoundedRect(ctx, x + 22, y + 132, 118, 26, 7);
      ctx.fillStyle = clickedAccept ? '#10b981' : '#059669';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10.5px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clickedAccept ? '✓ Đã Chấp Nhận' : '✓ Chấp nhận cụm này', x + 81, y + 145);

      this.drawRoundedRect(ctx, x + 150, y + 132, 110, 26, 7);
      ctx.fillStyle = 'rgba(225, 29, 72, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
      ctx.stroke();
      ctx.fillStyle = '#fda4af';
      ctx.fillText('✕ Từ chối', x + 205, y + 145);
      ctx.restore();

      // Khung phải: Ngũ quan & Lore Whisper
      this.drawRoundedRect(ctx, rightX, y, rightW, h, 12);
      ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.45)';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('✨ LORE WHISPER & NGŨ QUAN', rightX + 12, y + 12);

      const senses = ['👁️ Thị giác: bóng đổ, vệt mờ', '👂 Thính giác: tiếng kim giây', '🌫️ Khứu giác: mùi mưa ẩm', '💓 Nội tâm: ngón tay lạnh'];
      senses.forEach((s, i) => {
        const sy = y + 40 + i * 30;
        this.drawRoundedRect(ctx, rightX + 12, sy, rightW - 24, 24, 6);
        ctx.fillStyle = 'rgba(20, 184, 166, 0.12)';
        ctx.fill();
        ctx.fillStyle = '#ccfbf1';
        ctx.font = '10.5px Inter, system-ui, sans-serif';
        ctx.fillText(s, rightX + 20, sy + 6);
      });

      this.drawAnimatedPointer(ctx, x + 95, y + 146, (t * 4) % 1, accent);
    },

    renderSceneTab2ChapterRag(ctx, x, y, w, h, t, accent) {
      const colW = (w - 16) / 2;
      this.drawRoundedRect(ctx, x, y, colW, h, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('📂 CÂY CHƯƠNG & NẠP .DOCX/.PDF/.TXT', x + 12, y + 12);

      const chapItems = [
        'Chương 1: Khởi Đầu Trong Mưa [Đã Duyệt ✓]',
        'Chương 2: Vết Nứt Hành Lang [Đã Duyệt ✓]',
        'Chương 3: Tín Hiệu Lúc Nửa Đêm [Nháp]',
      ];
      chapItems.forEach((label, idx) => {
        const iy = y + 40 + idx * 38;
        const active = Math.floor(t * 3) === idx;
        this.drawRoundedRect(ctx, x + 12, iy, colW - 24, 30, 8);
        ctx.fillStyle = active ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.75)';
        ctx.fill();
        ctx.strokeStyle = active ? '#f59e0b' : 'transparent';
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10.5px Inter, system-ui, sans-serif';
        ctx.fillText(label, x + 20, iy + 9);
      });

      const rx = x + colW + 16;
      this.drawRoundedRect(ctx, rx, y, colW, h, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('🔍 BM25 CỤC BỘ (0 TOKEN API)', rx + 12, y + 12);

      this.drawRoundedRect(ctx, rx + 12, y + 36, colW - 24, 28, 7);
      ctx.fillStyle = '#020617';
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px monospace';
      ctx.fillText('Từ khóa: "chiếc đồng hồ bạc"', rx + 20, y + 44);

      this.drawRoundedRect(ctx, rx + 12, y + 76, colW - 24, 68, 8);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.fill();
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 10.5px Inter, system-ui, sans-serif';
      ctx.fillText('Kết quả Chương 1 (Độ khớp 98%):', rx + 20, y + 84);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10.5px Georgia, serif';
      ctx.fillText('"...mặt sau chiếc đồng hồ bạc khắc chữ A.K..."', rx + 20, y + 104);

      this.drawAnimatedPointer(ctx, rx + colW * 0.55, y + 50, (t * 5) % 1, accent);
    },

    renderSceneTwoStepPrompt(ctx, x, y, w, h, t, accent) {
      const boxW = (w - 44) / 3;
      const stepPhase = Math.floor(t * 3);

      // Bước 0: Khung đầu vào
      const x1 = x;
      this.drawRoundedRect(ctx, x1, y + 8, boxW, h - 16, 12);
      ctx.fillStyle = stepPhase === 0 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(15, 23, 42, 0.88)';
      ctx.fill();
      ctx.strokeStyle = stepPhase === 0 ? accent : 'rgba(148, 163, 184, 0.25)';
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('NHẬP LỆNH SIÊU RỘNG', x1 + 12, y + 18);
      const inputs = ['✓ Câu lệnh tác giả', '✓ Story Bible Tab 4', '✓ Mốc chuyển POV', '✓ Ký ức BM25 RAG'];
      inputs.forEach((lbl, idx) => {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10.5px Inter, system-ui, sans-serif';
        ctx.fillText(lbl, x1 + 12, y + 46 + idx * 24);
      });

      // Bước 1: Tổng hợp Prompt Tổng
      const x2 = x + boxW + 22;
      this.drawRoundedRect(ctx, x2, y + 8, boxW, h - 16, 12);
      ctx.fillStyle = stepPhase === 1 ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.88)';
      ctx.fill();
      ctx.strokeStyle = stepPhase === 1 ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)';
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('BƯỚC 1: PROMPT TỔNG HỢP', x2 + 12, y + 18);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10.5px Inter, system-ui, sans-serif';
      ctx.fillText('Ghép 100% dữ kiện thành', x2 + 12, y + 46);
      ctx.fillText('1 kịch bản chặt chẽ trước', x2 + 12, y + 64);
      ctx.fillText('khi viết bản chính thức.', x2 + 12, y + 82);

      // Bước 2: Cổng Xác Nhận & Chọn Model
      const x3 = x + (boxW + 22) * 2;
      this.drawRoundedRect(ctx, x3, y + 8, boxW, h - 16, 12);
      ctx.fillStyle = stepPhase === 2 ? 'rgba(245, 158, 11, 0.14)' : 'rgba(15, 23, 42, 0.88)';
      ctx.fill();
      ctx.strokeStyle = stepPhase === 2 ? '#f59e0b' : 'rgba(148, 163, 184, 0.25)';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('BƯỚC 2: CHỌN MÔ HÌNH', x3 + 12, y + 18);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 10.5px Inter, system-ui, sans-serif';
      ctx.fillText('Khuyên dùng: Flash / Pro', x3 + 12, y + 48);
      ctx.fillStyle = '#fca5a5';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillText('(!) Cảnh báo nếu chọn Lite', x3 + 12, y + 70);

      // Mũi tên nối 3 bước
      ctx.fillStyle = accent;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('➔', x1 + boxW + 4, y + h * 0.45);
      ctx.fillText('➔', x2 + boxW + 4, y + h * 0.45);

      const px = x + 36 + t * (w - 90);
      this.drawAnimatedPointer(ctx, px, y + h * 0.65, (t * 4) % 1, accent);
    },

    renderSceneMode5PlotGraph(ctx, x, y, w, h, t, accent) {
      this.drawRoundedRect(ctx, x, y, w, h, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
      ctx.stroke();

      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('📊 CHẾ ĐỘ 5: BIỂU ĐỒ DIỄN BIẾN CỐT TRUYỆN SVG & PHÁT HIỆN MÂU THUẪN', x + 14, y + 12);

      const nodes = [
        { nx: x + w * 0.16, ny: y + h * 0.46, label: 'Ch.1: Biến mất', sub: '21:15 Thứ Sáu' },
        { nx: x + w * 0.42, ny: y + h * 0.34, label: 'Ch.4: Chiếc nhẫn', sub: 'Manh mối #2' },
        { nx: x + w * 0.68, ny: y + h * 0.56, label: 'Ch.7: Đối chất', sub: 'Kiểm tra POV' },
        { nx: x + w * 0.88, ny: y + h * 0.42, label: 'Ch.9: Cao trào', sub: 'Khớp logic ✓' },
      ];

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      nodes.forEach((n, idx) => {
        if (idx === 0) ctx.moveTo(n.nx, n.ny);
        else ctx.lineTo(n.nx, n.ny);
      });
      ctx.stroke();

      const activeNode = Math.floor((t * 4) % nodes.length);
      nodes.forEach((n, idx) => {
        const hot = idx === activeNode;
        ctx.beginPath();
        ctx.arc(n.nx, n.ny, hot ? 17 : 13, 0, Math.PI * 2);
        ctx.fillStyle = hot ? '#818cf8' : '#1e1b4b';
        ctx.fill();
        ctx.strokeStyle = '#c7d2fe';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(idx + 1), n.nx, n.ny - 5);

        ctx.fillStyle = hot ? '#e0e7ff' : '#94a3b8';
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        ctx.fillText(n.label, n.nx, n.ny + 22);
        ctx.fillStyle = '#64748b';
        ctx.font = '9.5px Inter, system-ui, sans-serif';
        ctx.fillText(n.sub, n.nx, n.ny + 35);
      });

      this.drawAnimatedPointer(ctx, nodes[activeNode].nx + 12, nodes[activeNode].ny + 10, (t * 4) % 1, '#818cf8');
    },

    renderSceneTab4BibleMatrix(ctx, x, y, w, h, t, accent) {
      const leftW = w * 0.56;
      this.drawRoundedRect(ctx, x, y, leftW, h, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('🏛️ MA TRẬN STORY BIBLE & KHÓA KHUNG MẪU', x + 12, y + 12);

      const pills = ['👤 Nhân vật: 4 hồ sơ khóa', '🧠 Ai Biết Gì: 6 bí mật', '🪡 Phục bút: 3 nút thắt mở', '🚫 Từ cấm AI: Đã bật'];
      pills.forEach((p, idx) => {
        const py = y + 38 + idx * 32;
        this.drawRoundedRect(ctx, x + 12, py, leftW - 24, 24, 7);
        ctx.fillStyle = 'rgba(236, 72, 153, 0.14)';
        ctx.fill();
        ctx.fillStyle = '#fbcfe8';
        ctx.font = '10.5px Inter, system-ui, sans-serif';
        ctx.fillText(p, x + 20, py + 6);
      });

      const rx = x + leftW + 14;
      const rw = w - leftW - 14;
      this.drawRoundedRect(ctx, rx, y, rw, h, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('✅ DUYỆT & CHỐT BẢN THẢO', rx + 12, y + 12);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10.5px Inter, system-ui, sans-serif';
      ctx.fillText('• Đã bỏ khung đầu ra dư thừa', rx + 12, y + 40);
      ctx.fillText('• Chạy Prompt tổng hợp ngầm', rx + 12, y + 60);
      ctx.fillText('• Tự cập nhật Bible & báo xong', rx + 12, y + 80);

      this.drawRoundedRect(ctx, rx + 14, y + 112, rw - 28, 30, 8);
      ctx.fillStyle = t > 0.55 ? '#10b981' : '#059669';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t > 0.55 ? '✓ Chốt Duyệt Thành Công!' : '🚀 Chốt Chương & Cập Nhật Bible', rx + rw / 2, y + 121);
      this.drawAnimatedPointer(ctx, rx + rw / 2 + 24, y + 128, (t * 4) % 1, accent);
    },

    renderScenePomodoroSync(ctx, x, y, w, h, t, accent) {
      const leftW = w * 0.46;
      const rightW = w * 0.46;
      const rx = x + w - rightW;
      const secsLeft = Math.max(1200, 1500 - Math.floor(t * 260));
      const timeTxt = this.formatSecToMmSs(secsLeft);
      const isRunning = t > 0.25;

      // Đồng hồ bên trái (Tab 5)
      this.drawRoundedRect(ctx, x, y + 10, leftW, h - 20, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = isRunning ? '#f97316' : 'rgba(148, 163, 184, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#fdba74';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('TAB 5 — ĐỒNG HỒ POMODORO', x + leftW / 2, y + 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(timeTxt, x + leftW / 2, y + 58);
      ctx.fillStyle = isRunning ? '#4ade80' : '#94a3b8';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText(isRunning ? '● ĐANG CHẠY ĐỒNG BỘ' : '❚❚ SẴN SÀNG', x + leftW / 2, y + 102);

      // Đồng hồ bên phải (Thanh Nổi Pomodoro Pill)
      this.drawRoundedRect(ctx, rx, y + 10, rightW, h - 20, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = isRunning ? '#f97316' : 'rgba(148, 163, 184, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#fdba74';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('THANH NỔI POMODORO PILL', rx + rightW / 2, y + 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(timeTxt, rx + rightW / 2, y + 58);
      ctx.fillStyle = isRunning ? '#4ade80' : '#94a3b8';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText(isRunning ? '● KHỚP TỪNG GIÂY 100%' : '❚❚ CHỜ BẤM', rx + rightW / 2, y + 102);

      // Mũi tên đồng bộ 2 chiều giữa 2 khung
      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('⇄', x + w / 2, y + h / 2 - 8);
      this.drawAnimatedPointer(ctx, x + leftW * 0.5, y + 114, (t * 4) % 1, accent);
    },

    renderSceneVersionVaultAndPdf(ctx, x, y, w, h, t, accent) {
      const halfW = (w - 16) / 2;

      // Trái: Tab 6 Time-Machine Preview
      this.drawRoundedRect(ctx, x, y, halfW, h, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('🕒 TAB 6: KHO PHIÊN BẢN & PREVIEW CŨ', x + 12, y + 12);

      const snapshots = ['v3 • 10:42 • Chốt Chương 2', 'v2 • 10:28 • Sửa thoại chính', 'v1 • 10:05 • Điểm mở đầu'];
      snapshots.forEach((snap, idx) => {
        const sy = y + 38 + idx * 32;
        const selected = idx === Math.floor(t * 3) % snapshots.length;
        this.drawRoundedRect(ctx, x + 12, sy, halfW - 24, 26, 7);
        ctx.fillStyle = selected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(30, 41, 59, 0.7)';
        ctx.fill();
        ctx.fillStyle = selected ? '#e0f2fe' : '#94a3b8';
        ctx.font = '10.5px Inter, system-ui, sans-serif';
        ctx.fillText(snap, x + 20, sy + 7);
      });
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 10.5px Inter, system-ui, sans-serif';
      ctx.fillText('👁️ Preview bản thảo & Khôi phục 1 chạm', x + 14, y + h - 24);

      // Phải: Xuất PDF Chọn Font & Cỡ Chữ
      const rx = x + halfW + 16;
      this.drawRoundedRect(ctx, rx, y, halfW, h, 12);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('📤 XUẤT PDF: CHỌN FONT & CỠ CHỮ', rx + 12, y + 12);
      const specs = ['Font: Merriweather / Times / Lora', 'Cỡ chữ in: 11pt • 13pt • 15pt', 'Giãn dòng: 1.65 • Khổ A5 / A4', 'Xem trước trang in tức thì ✓'];
      specs.forEach((sp, i) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10.5px Inter, system-ui, sans-serif';
        ctx.fillText(sp, rx + 14, y + 42 + i * 24);
      });

      this.drawAnimatedPointer(ctx, x + halfW * 0.6, y + 84, (t * 4) % 1, accent);
    },

    renderSceneArgonWebAndAmbientStage(ctx, x, y, w, h, t, accent) {
      const halfW = (w - 16) / 2;

      // Trái: Cầu nối Argon 4 / Carbon 4 (20.000+ từ qua Gemini Web)
      this.drawRoundedRect(ctx, x, y, halfW, h, 12);
      ctx.fillStyle = 'rgba(24, 16, 48, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.stroke();

      ctx.fillStyle = '#d8b4fe';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('💎 CẦU NỐI GEMINI WEB (20.000+ TỪ)', x + 12, y + 12);

      // Link gạch chân 1: Copy toàn bộ Prompt tổng
      const pulseCopy = 0.72 + 0.28 * Math.sin(t * Math.PI * 4);
      this.drawRoundedRect(ctx, x + 12, y + 38, halfW - 24, 28, 8);
      ctx.fillStyle = `rgba(124, 58, 237, ${(0.22 * pulseCopy).toFixed(2)})`;
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.stroke();
      ctx.fillStyle = '#f5d0fe';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillText('📋 Ấn vào đây để copy toàn bộ Prompt tổng', x + 20, y + 47);

      // Link gạch chân 2: Mở Gemini Web Argon 4
      this.drawRoundedRect(ctx, x + 12, y + 74, halfW - 24, 28, 8);
      ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('🌐 Bấm vào đây mở Gemini Web (Argon 4)', x + 20, y + 83);

      // Lưu ý gói Pro / Ultra
      this.drawRoundedRect(ctx, x + 12, y + 110, halfW - 24, 34, 8);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 9.5px Inter, system-ui, sans-serif';
      ctx.fillText('⚡ Lưu ý: Nâng cấp Pro → Argon 4', x + 20, y + 116);
      ctx.fillText('   Nâng cấp Ultra → Carbon 4 nha!', x + 20, y + 130);

      // Phải: Sân Khấu Nền Đa Tầng Module 32 (Hết đen đặc)
      const rx = x + halfW + 16;
      this.drawRoundedRect(ctx, rx, y, halfW, h, 12);
      const gradBg = ctx.createLinearGradient(rx, y, rx + halfW, y + h);
      gradBg.addColorStop(0, '#0f172a');
      gradBg.addColorStop(0.55, '#1e1b4b');
      gradBg.addColorStop(1, '#064e3b');
      ctx.fillStyle = gradBg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
      ctx.stroke();

      // Vẽ ánh trăng & đường chân trời minh họa tranh tự sinh
      ctx.beginPath();
      ctx.arc(rx + halfW - 36, y + 48, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(253, 230, 138, 0.72)';
      ctx.fill();

      // Thẻ kính mờ đè lên tranh cho thấy hiệu ứng xuyên sáng
      this.drawRoundedRect(ctx, rx + 14, y + 36, halfW - 28, h - 52, 10);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.52)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.stroke();

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('🖼️ MODULE 32: KÍNH MỜ XUYÊN NỀN', rx + 12, y + 12);
      const stageNotes = [
        '✔ html.dark Frosted Glass (Xuyên nền)',
        '✔ Canvas Tranh z-[2] + IndexedDB F5',
        '✔ Preset: Rõ Nét 88% / Soi Nền 100%',
      ];
      stageNotes.forEach((line, idx) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillText(line, rx + 24, y + 50 + idx * 24);
      });

      this.drawAnimatedPointer(ctx, x + halfW * 0.45, y + 52 + Math.sin(t * 6) * 20, (t * 4) % 1, accent);
    },

    renderSceneWeatherClockAlarm(ctx, x, y, w, h, t, accent) {
      const halfW = (w - 16) / 2;

      // Trái: Mod 42 — Đồng hồ Múi giờ & Báo thức MP3
      this.drawRoundedRect(ctx, x, y, halfW, h, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
      ctx.stroke();

      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('⏰ MOD 42: MÚI GIỜ & BÁO THỨC MP3', x + 12, y + 12);

      this.drawRoundedRect(ctx, x + 12, y + 36, halfW - 24, 48, 9);
      ctx.fillStyle = 'rgba(251, 146, 60, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)';
      ctx.stroke();

      const secTick = Math.floor((t * 10) % 60);
      const secStr = String(secTick).padStart(2, '0');
      ctx.fillStyle = '#fed7aa';
      ctx.font = 'bold 17px monospace';
      ctx.fillText(`21:08:${secStr} · GMT+7`, x + 22, y + 46);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillText('Hà Nội · Tokyo · London · Định dạng 24h/12h', x + 22, y + 67);

      const pulseAlarm = 0.72 + Math.sin(t * 8) * 0.28;
      this.drawRoundedRect(ctx, x + 12, y + 94, halfW - 24, 54, 9);
      ctx.fillStyle = `rgba(245, 158, 11, ${(0.12 * pulseAlarm).toFixed(2)})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillText('🔔 Báo thức 06:30 (ô giây để trống = :00)', x + 22, y + 104);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillText('🎵 Chuông hệ thống hoặc MP3 riêng từ Tab 5', x + 22, y + 124);

      // Phải: Mod 43 — Động cơ Thời Tiết 60FPS & 168 Khung Cảnh (6 x 28 WMO)
      const rx = x + halfW + 16;
      this.drawRoundedRect(ctx, rx, y, halfW, h, 12);
      const skyGrad = ctx.createLinearGradient(rx, y, rx, y + h);
      skyGrad.addColorStop(0, '#0c4a6e');
      skyGrad.addColorStop(0.6, '#1e1b4b');
      skyGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = skyGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.stroke();

      // Hạt sao + mưa chuyển động 60FPS minh họa
      for (let i = 0; i < 9; i++) {
        const sx = rx + 24 + ((i * 29) % Math.max(40, halfW - 48));
        const sy = y + 36 + ((i * 19 + t * 55) % Math.max(30, h - 68));
        ctx.fillStyle = i % 3 === 0 ? 'rgba(253, 224, 71, 0.78)' : 'rgba(125, 211, 252, 0.65)';
        ctx.fillRect(sx, sy, 2, i % 3 === 0 ? 2 : 9);
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('🌦️ MOD 43: THỜI TIẾT REAL-TIME 60FPS', rx + 12, y + 12);

      this.drawRoundedRect(ctx, rx + 14, y + 38, halfW - 28, h - 52, 10);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.68)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.stroke();

      const weatherLines = [
        '• 26°C · Open-Meteo (GPS / Thành phố)',
        '• 6 Khung giờ ánh sáng × 28 mã WMO = 168',
        '• Nền toàn web + backgrounds/ + Độ xuyên thấu',
      ];
      weatherLines.forEach((line, idx) => {
        ctx.fillStyle = '#e0f2fe';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillText(line, rx + 22, y + 52 + idx * 26);
      });

      this.drawAnimatedPointer(
        ctx,
        rx + halfW * 0.35 + Math.cos(t * 4) * 35,
        y + 82 + Math.sin(t * 5) * 18,
        (t * 3.5) % 1,
        accent
      );
    },

    renderSceneMiniPlayerAndTraffic(ctx, x, y, w, h, t, accent) {
      const halfW = (w - 16) / 2;

      // Trái: Phát nền Mobile/PWA MediaSession + Màn hình thu nhỏ kéo thả + PWA Icon Chân dung
      this.drawRoundedRect(ctx, x, y, halfW, h, 12);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
      ctx.stroke();

      ctx.fillStyle = '#fda4af';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('🎧 PHÁT NỀN MOBILE + MINI SCREEN + PWA', x + 12, y + 12);

      this.drawRoundedRect(ctx, x + 12, y + 36, halfW - 24, 42, 8);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
      ctx.fill();
      ctx.fillStyle = '#fecdd3';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillText('🔒 Khóa màn hình Mobile/App vẫn phát MP3 & YT', x + 20, y + 45);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9.5px Inter, system-ui, sans-serif';
      ctx.fillText('MediaSession · Không quảng cáo · Chạm mở lại Tab 5', x + 20, y + 61);

      // Màn hình thu nhỏ đang kéo thả lơ lửng
      const dragX = x + 20 + Math.sin(t * 2.5) * 26;
      const dragY = y + 92 + Math.cos(t * 2.1) * 10;
      const miniW = Math.min(188, halfW - 44);
      this.drawRoundedRect(ctx, dragX, dragY, miniW, 48, 10);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.fill();
      ctx.strokeStyle = '#fb7185';
      ctx.stroke();
      ctx.fillStyle = '#fff1f2';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillText('📺 Màn Hình Thu Nhỏ (Kéo Thả)', dragX + 10, dragY + 11);
      ctx.fillStyle = '#5eead4';
      ctx.font = '9.5px Inter, system-ui, sans-serif';
      ctx.fillText('Bấm vào ➔ Quay về đúng mục Tab 5', dragX + 10, dragY + 28);

      // Phải: Mod 44 — Ô Thống Kê Truy Cập Duy Nhất Trên Tab 6
      const rx = x + halfW + 16;
      this.drawRoundedRect(ctx, rx, y, halfW, h, 12);
      ctx.fillStyle = '#09090b';
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.58)';
      ctx.stroke();

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText('📊 MOD 44: Ô THỐNG KÊ TAB 6 (1 Ô DUY NHẤT)', rx + 12, y + 12);

      // Mô phỏng hàng 3 khối trên Tab 6: Báo lỗi | Ô Mod 44 | Mai Hải Đăng
      this.drawRoundedRect(ctx, rx + 12, y + 36, halfW - 24, h - 50, 10);
      ctx.fillStyle = 'rgba(6, 78, 59, 0.24)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.stroke();

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 10.5px Inter, system-ui, sans-serif';
      ctx.fillText('🟢 Đang truy cập: Real-Time Multi-Tab', rx + 22, y + 48);

      const counters = [
        'Hôm nay · Tuần này (GMT+7)',
        'Tháng này · Năm này · Toàn lịch sử',
        'Hòa hợp giữa Báo cáo lỗi & Mai Hải Đăng',
      ];
      counters.forEach((line, idx) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillText(`• ${line}`, rx + 22, y + 72 + idx * 24);
      });

      this.drawAnimatedPointer(ctx, dragX + miniW * 0.6, dragY + 24, (t * 4) % 1, accent);
    },
  });

  /**
   * Bộ điều phối giao diện Cẩm nang A-Z, Video Hướng Dẫn Có Phụ Đề & Nhật ký v38.0 trong Modal #modal-tutorial-changelog-az.
   */
  class TutorialAndChangelogController {
    constructor() {
      this.hasInitialized = false;
      this.activeSubTab = 'VIDEO';
      this.transcriptFilterText = '';
      this.player = new AnimatedCanvasTutorialPlayer({
        chapters: VIDEO_TUTORIAL_CHAPTERS_DATA,
        subtitles: SYNCHRONIZED_SUBTITLE_TRACK_V38,
      });
      this.unsubscribeTick = null;
      this.resizeHandler = null;
    }

    init() {
      if (this.hasInitialized) return this;
      this.hasInitialized = true;
      this.bindCoreModalTriggers();
      this.unsubscribeTick = this.player.subscribeTick((state) => this.syncLivePlayerDom(state));
      if (!this._i18nBound) {
        this._i18nBound = true;
        const onLangChanged = () => {
          const modalEl = document.getElementById('modal-tutorial-changelog-az');
          if (modalEl && !modalEl.classList.contains('hidden')) {
            this.renderModalBody();
            if (this.activeSubTab === 'VIDEO') {
              this.mountVideoCanvasInDom();
            }
          }
        };
        NS.bus?.on?.('i18n:changed', onLangChanged);
        if (typeof window !== 'undefined' && window.addEventListener) {
          window.addEventListener('noir:i18n:changed', onLangChanged);
        }
      }
      return this;
    }

    bindCoreModalTriggers() {
      if (typeof document === 'undefined') return;
      const openBtn = document.getElementById('btn-s6-card-tutorial');
      const closeBtn = document.getElementById('btn-close-tutorial-modal');
      const modalEl = document.getElementById('modal-tutorial-changelog-az');

      const registerClick = (el, key, handler) => {
        if (!el) return;
        if (typeof NS.bindOnce === 'function') {
          NS.bindOnce(el, 'click', handler, key);
        } else if (!el.dataset[key]) {
          el.dataset[key] = '1';
          el.addEventListener('click', handler);
        }
      };

      registerClick(openBtn, 'mod28OpenTutorial', () => this.openModal('VIDEO'));
      registerClick(closeBtn, 'mod28CloseTutorial', () => this.closeModal());

      if (modalEl && !modalEl.dataset.mod28BackdropBound) {
        modalEl.dataset.mod28BackdropBound = '1';
        modalEl.addEventListener('click', (ev) => {
          if (ev.target === modalEl) {
            this.closeModal();
          }
        });
      }

      if (!this.resizeHandler && typeof window !== 'undefined') {
        this.resizeHandler = () => {
          if (!modalEl || modalEl.classList.contains('hidden')) return;
          if (this.isTheaterFullscreen) {
            this.syncTheaterFullscreenLayout();
          }
          globalScope.NoirStudio?.liveDomVideoMirror?.updateViewportScaleToFit?.();
          this.player.resizeCanvasToContainer();
          this.player.renderCurrentFrame();
        };
        window.addEventListener('resize', this.resizeHandler, { passive: true });
        window.addEventListener('orientationchange', () => {
          setTimeout(() => this.resizeHandler?.(), 100);
        });
        window.visualViewport?.addEventListener?.('resize', this.resizeHandler, { passive: true });
      }

      if (typeof document !== 'undefined' && !document.body?.dataset?.mod28FsBound) {
        if (document.body) document.body.dataset.mod28FsBound = '1';
        document.addEventListener('fullscreenchange', () => {
          const theaterEl = document.getElementById('mod28-theater-stage');
          if (document.fullscreenElement === theaterEl) {
            this._nativeFullscreenEntered = true;
            if (!this.isTheaterFullscreen) {
              this.setTheaterFullscreen(true);
            } else {
              this.syncTheaterFullscreenLayout();
            }
          } else if (!document.fullscreenElement && this.isTheaterFullscreen && this._nativeFullscreenEntered) {
            this._nativeFullscreenEntered = false;
            this.setTheaterFullscreen(false);
          } else if (this.isTheaterFullscreen) {
            this.syncTheaterFullscreenLayout();
          }
        });
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape' && this.isTheaterFullscreen) {
            ev.stopImmediatePropagation?.();
            ev.preventDefault?.();
            this.setTheaterFullscreen(false);
          }
        }, true);
      }
    }

    openModal(initialTab = 'VIDEO') {
      const modalEl = document.getElementById('modal-tutorial-changelog-az');
      if (!modalEl) return false;
      this.activeSubTab = ['VIDEO', 'CHANGELOG', 'MODELS', 'SHORTCUTS'].includes(initialTab)
        ? initialTab
        : 'VIDEO';
      modalEl.classList.remove('hidden');
      if (NS.modalStack?.register) {
        NS.modalStack.register('modal-tutorial-changelog-az', () => this.closeModal());
      }
      globalScope.NoirStudio?.neuralVoice?.tryAutoActivatePendingVoice?.();
      this.renderModalBody();
      if (this.activeSubTab === 'VIDEO') {
        this.mountVideoCanvasInDom();
      }
      return true;
    }

    syncVoiceControlsUI(isOn) {
      const active = Boolean(isOn);
      const tr = globalScope.NoirStudio?.i18n?.translateText || ((s) => s);
      const mainBtn = document.getElementById('mod28-btn-toggle-voice');
      if (mainBtn) {
        mainBtn.textContent = tr(active ? '🎙️ Giọng đọc AI Cute: BẬT' : '🔇 Giọng đọc AI Cute: TẮT');
        mainBtn.classList.toggle('border-pink-500/60', active);
        mainBtn.classList.toggle('bg-pink-500/20', active);
        mainBtn.classList.toggle('text-pink-200', active);
      }
      const fsVoiceBtn = document.getElementById('mod28-fs-btn-voice');
      if (fsVoiceBtn) {
        fsVoiceBtn.textContent = tr(active ? '🎙️ Giọng Việt: BẬT' : '🔇 Giọng Việt: TẮT');
      }
    }

    closeModal() {
      this.setTheaterFullscreen(false);
      this.player.voiceNarrator.stop();
      this.player.detachCanvas();
      globalScope.NoirStudio?.neuralVoice?.closeVoiceInstallGuideModal?.('VIDEO');
      const modalEl = document.getElementById('modal-tutorial-changelog-az');
      if (modalEl) {
        modalEl.classList.add('hidden');
      }
      if (NS.modalStack?.unregister) {
        NS.modalStack.unregister('modal-tutorial-changelog-az');
      }
    }

    escapeHtmlSafe(value) {
      if (NS.uiUtils?.escapeHtml) return NS.uiUtils.escapeHtml(value);
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    switchSubTab(tabKey) {
      this.activeSubTab = tabKey;
      if (tabKey !== 'VIDEO') {
        this.setTheaterFullscreen(false);
        this.player.voiceNarrator.stop();
        this.player.detachCanvas();
      }
      this.renderModalBody();
      if (tabKey === 'VIDEO') {
        this.mountVideoCanvasInDom();
      }
    }

    syncTheaterFullscreenLayout() {
      const theaterEl = document.getElementById('mod28-theater-stage');
      const slotEl = document.getElementById('mod28-video-slot');
      const frameWrap = document.getElementById('mod28-video-frame-wrap');
      if (!theaterEl || !frameWrap) return;

      if (!this.isTheaterFullscreen) {
        frameWrap.style.width = '100%';
        frameWrap.style.height = '';
        frameWrap.style.maxWidth = '';
        frameWrap.style.maxHeight = '';
        frameWrap.style.marginLeft = '';
        frameWrap.style.marginRight = '';
        frameWrap.style.aspectRatio = '16 / 9';
        return;
      }

      const vv = typeof window !== 'undefined' ? window.visualViewport : null;
      const vw = (vv && vv.width) || (typeof window !== 'undefined' ? window.innerWidth : 720) || 720;
      const vh = (vv && vv.height) || (typeof window !== 'undefined' ? window.innerHeight : 540) || 540;
      const slotRect = slotEl ? slotEl.getBoundingClientRect() : null;
      const availW = Math.max(240, Math.floor((slotRect && slotRect.width) || vw - 16));
      const availH = Math.max(135, Math.floor((slotRect && slotRect.height) || Math.max(160, vh - 185)));
      const fitW = Math.max(240, Math.floor(Math.min(availW, availH * (16 / 9))));
      const fitH = Math.max(135, Math.floor(fitW * (9 / 16)));

      frameWrap.style.width = `${fitW}px`;
      frameWrap.style.height = `${fitH}px`;
      frameWrap.style.maxWidth = '100%';
      frameWrap.style.maxHeight = '100%';
      frameWrap.style.marginLeft = 'auto';
      frameWrap.style.marginRight = 'auto';
      frameWrap.style.aspectRatio = '16 / 9';
    }

    setTheaterFullscreen(shouldEnter) {
      const modalEl = document.getElementById('modal-tutorial-changelog-az');
      const dialogEl = document.getElementById('tutorial-changelog-dialog') || modalEl?.querySelector(':scope > div');
      const theaterEl = document.getElementById('mod28-theater-stage');
      const frameWrap = document.getElementById('mod28-video-frame-wrap');
      const fsBtn = document.getElementById('mod28-btn-fullscreen');
      const fsQuickBar = document.getElementById('mod28-fullscreen-quick-controls');
      this.isTheaterFullscreen = Boolean(shouldEnter);

      if (modalEl) {
        modalEl.classList.toggle('mod28-fs-active', this.isTheaterFullscreen);
      }
      if (dialogEl) {
        dialogEl.classList.toggle('mod28-fs-dialog-expanded', this.isTheaterFullscreen);
      }

      if (theaterEl) {
        if (this.isTheaterFullscreen) {
          this._nativeFullscreenEntered = false;
          theaterEl.classList.add(
            'mod28-theater-fullscreen',
            'fixed',
            'inset-0',
            'z-[140]',
            'bg-black',
            'p-1.5',
            'sm:p-3',
            'flex',
            'flex-col',
            'justify-between',
            'gap-1.5'
          );
          theaterEl.classList.remove('rounded-2xl', 'border', 'border-emerald-500/40');
          if (fsQuickBar) fsQuickBar.classList.remove('hidden');
          this.syncTheaterFullscreenLayout();
          if (document.fullscreenEnabled && !document.fullscreenElement) {
            try {
              const p = theaterEl.requestFullscreen?.();
              if (p && typeof p.then === 'function') {
                p.then(() => {
                  this._nativeFullscreenEntered = true;
                  this.syncTheaterFullscreenLayout();
                }).catch(() => {});
              }
            } catch (_e) {}
          }
        } else {
          this._nativeFullscreenEntered = false;
          theaterEl.classList.remove(
            'mod28-theater-fullscreen',
            'fixed',
            'inset-0',
            'z-[140]',
            'bg-black',
            'p-1.5',
            'sm:p-3',
            'p-2',
            'sm:p-4',
            'flex',
            'flex-col',
            'justify-between',
            'gap-1.5',
            'gap-2'
          );
          theaterEl.classList.add('rounded-2xl', 'border', 'border-emerald-500/40');
          if (fsQuickBar) fsQuickBar.classList.add('hidden');
          this.syncTheaterFullscreenLayout();
          if (document.fullscreenElement === theaterEl) {
            try {
              const p = document.exitFullscreen?.();
              if (p && typeof p.catch === 'function') p.catch(() => {});
            } catch (_e) {}
          }
        }
      } else if (frameWrap) {
        this.syncTheaterFullscreenLayout();
      }
      if (fsQuickBar) {
        fsQuickBar.classList.toggle('hidden', !this.isTheaterFullscreen);
      }
      if (fsBtn) {
        const tr = globalScope.NoirStudio?.i18n?.translateText || ((s) => s);
        fsBtn.textContent = tr(this.isTheaterFullscreen ? '🗗 Thoát toàn màn hình' : '⛶ Xem toàn màn hình');
      }
      const resync = () => {
        this.syncTheaterFullscreenLayout();
        globalScope.NoirStudio?.liveDomVideoMirror?.updateViewportScaleToFit?.();
        this.player.resizeCanvasToContainer();
        this.player.renderCurrentFrame();
      };
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(resync);
      }
      setTimeout(resync, 60);
      setTimeout(resync, 240);
    }

    mountVideoCanvasInDom() {
      const canvasEl = document.getElementById('mod28-tutorial-canvas');
      if (!canvasEl) return;
      const domMirror = globalScope.NoirStudio?.liveDomVideoMirror;
      if (domMirror && typeof domMirror.syncMirrorForChapter === 'function') {
        domMirror.syncMirrorForChapter(this.player.activeChapterId || 'CHAP_01_ENTRY_GATE_AND_ARCHITECTURE', true);
      }
      globalScope.NoirStudio?.neuralVoice?.syncVoicePickerUI?.(this.player.voiceNarrator?.language || 'vi-VN');
      this.player.attachCanvas(canvasEl);
      this.syncLivePlayerDom(this.player.getPlaybackSnapshot());
    }

    renderModalBody() {
      const bodyEl = document.getElementById('tutorial-changelog-body');
      if (!bodyEl) return;

      const tabs = [
        { key: 'VIDEO', label: '🎬 Video Hướng Dẫn (Có Phụ Đề Tiếng Việt)' },
        { key: 'CHANGELOG', label: '📜 Nhật Ký Đại Tu & Vá Lỗi v38.0' },
        { key: 'MODELS', label: '🤖 Chọn Mô Hình Gemini Up-to-Date' },
        { key: 'SHORTCUTS', label: '⌨️ Phím Tắt & Mẹo Điện Thoại / PC' },
      ];

      const tabsBarHtml = `
        <div class="flex flex-wrap items-center gap-2 border-b border-studioLightBorder dark:border-zinc-800 pb-3">
          ${tabs
            .map((t) => {
              const active = t.key === this.activeSubTab;
              return `<button type="button" data-tut-tab="${t.key}" class="mod28-tut-tab-btn px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                active
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }">${this.escapeHtmlSafe(t.label)}</button>`;
            })
            .join('')}
        </div>
      `;

      let contentHtml = '';
      if (this.activeSubTab === 'VIDEO') {
        contentHtml = this.buildVideoPlayerTabHtml();
      } else if (this.activeSubTab === 'CHANGELOG') {
        contentHtml = this.buildChangelogTabHtml();
      } else if (this.activeSubTab === 'MODELS') {
        contentHtml = this.buildModelStrategyTabHtml();
      } else {
        contentHtml = this.buildShortcutsAndTipsTabHtml();
      }

      bodyEl.innerHTML = `${tabsBarHtml}<div class="pt-2">${contentHtml}</div>`;
      this.bindRenderedTabControls(bodyEl);
      globalScope.NoirStudio?.i18n?.translateElement?.(
        bodyEl.closest?.('#modal-tutorial-changelog-az') || bodyEl
      );
    }

    buildVideoPlayerTabHtml() {
      const snap = this.player.getPlaybackSnapshot();
      const curChap = snap.chapter || VIDEO_TUTORIAL_CHAPTERS_DATA[0];
      const curCue = snap.cue;
      const neuralVoice = globalScope.NoirStudio?.neuralVoice;
      const hasViVoice = Boolean(neuralVoice?.hasVoiceForLanguage?.('vi-VN'));
      const voiceDownloadUrl =
        neuralVoice?.getDirectVoiceDownloadInfo?.()?.primaryUrl ||
        'https://www.microsoft.com/vi-vn/edge/download';

      const segmentsBarHtml = VIDEO_TUTORIAL_CHAPTERS_DATA.map((ch) => {
        const widthPct = (((ch.endSec - ch.startSec) / this.player.totalDurationSec) * 100).toFixed(2);
        const isCurrent = ch.id === curChap.id;
        return `<button type="button" data-tut-seek="${ch.startSec}" title="${this.escapeHtmlSafe(ch.title)}" style="width:${widthPct}%; background:${isCurrent ? ch.accentColor : `${ch.accentColor}55`}" class="mod28-timeline-seg h-3 rounded-sm hover:opacity-100 transition-opacity cursor-pointer"></button>`;
      }).join('');

      const chaptersListHtml = VIDEO_TUTORIAL_CHAPTERS_DATA.map((ch) => {
        const isCurrent = ch.id === curChap.id;
        return `
          <button type="button" data-tut-chapter="${ch.id}" class="mod28-chapter-jump-btn w-full text-left p-2.5 rounded-xl border transition ${
            isCurrent
              ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-200'
              : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 text-zinc-300'
          }">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-[11px] leading-snug">${this.escapeHtmlSafe(ch.title)}</span>
              <span class="font-monoCode text-[10px] text-emerald-400 shrink-0">${this.player.formatSecToMmSs(ch.startSec)}</span>
            </div>
            <div class="text-[10px] text-zinc-400 mt-1 line-clamp-2">${this.escapeHtmlSafe(ch.summary)}</div>
          </button>
        `;
      }).join('');

      const subBarHiddenCls = snap.subtitlesVisible ? '' : 'hidden';

      return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div class="lg:col-span-8 space-y-3">
            <!-- RẠP CHIẾU VIDEO + PHỤ ĐỀ TÁCH RỜI BÊN DƯỚI KHUNG HÌNH (HỖ TRỢ FULLSCREEN) -->
            <div id="mod28-theater-stage" class="rounded-2xl border border-emerald-500/40 bg-black overflow-hidden shadow-2xl flex flex-col">
              <div id="mod28-video-slot" class="relative flex-1 min-h-0 flex items-center justify-center bg-black w-full" style="width:100%;">
                <div id="mod28-video-frame-wrap" class="relative w-full aspect-video max-h-full bg-black overflow-hidden" style="width:100%;aspect-ratio:16/9;">
                  <canvas id="mod28-tutorial-canvas" class="relative z-[3] w-full h-full block aspect-video cursor-pointer" style="width:100%;height:100%;display:block;"></canvas>
                  <button type="button" id="mod28-btn-fullscreen" class="absolute top-2.5 right-2.5 z-[5] px-2.5 py-1.5 rounded-xl bg-black/80 hover:bg-emerald-600/90 border border-white/25 text-white font-extrabold text-[11px] shadow-lg backdrop-blur-sm transition">
                    ⛶ Xem toàn màn hình
                  </button>
                </div>
              </div>

              <!-- Dải Phụ Đề Song Ngữ VI/EN Nằm Riêng Biệt Ngay Dưới Video (Tuyệt đối không che khung hình) -->
              <div id="mod28-subtitle-theater-bar" class="shrink-0 w-full px-3.5 sm:px-5 py-2.5 border-t border-teal-500/35 bg-zinc-950/95 space-y-1 ${subBarHiddenCls}">
                <div class="flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase text-teal-400">
                  <span id="mod28-live-sub-speaker">${this.escapeHtmlSafe(curCue?.speaker || 'Viên Bi Số 8')} • ${this.escapeHtmlSafe(curCue?.speakerEn || 'Bi Guide')}</span>
                  <span id="mod28-live-chap-badge" class="px-2 py-0.5 rounded bg-teal-950/70 border border-teal-500/30">${this.escapeHtmlSafe(curChap.badgeLabel)}</span>
                </div>
                <p id="mod28-live-sub-text" class="text-xs sm:text-sm font-semibold text-zinc-100 leading-relaxed${this.player.subtitleLangMode === 'EN' ? ' hidden' : ''}">
                  🇻🇳 ${this.escapeHtmlSafe(curCue?.text || curChap.summary)}
                </p>
                <p id="mod28-live-sub-text-en" class="text-[11px] sm:text-xs font-medium text-cyan-300 leading-relaxed${this.player.subtitleLangMode === 'VI' ? ' hidden' : ''}">
                  🇬🇧 ${this.escapeHtmlSafe(curCue?.textEn || '')}
                </p>
              </div>

              <!-- Thanh điều khiển nhanh khi đang Toàn Màn Hình -->
              <div id="mod28-fullscreen-quick-controls" class="hidden shrink-0 w-full px-3 sm:px-4 py-2 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button type="button" id="mod28-fs-btn-play" class="px-2.5 sm:px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs">
                    ${snap.isPlaying ? '⏸ Tạm dừng' : '▶ Phát'}
                  </button>
                  <span id="mod28-fs-time-current" class="font-monoCode text-[11px] sm:text-xs text-emerald-400">${this.player.formatSecToMmSs(snap.currentTimeSec)} / ${this.player.formatSecToMmSs(snap.totalDurationSec)}</span>
                </div>
                <input id="mod28-fs-seek-slider" type="range" min="0" max="${this.player.totalDurationSec}" step="0.2" value="${snap.currentTimeSec}" class="flex-1 min-w-[75px] sm:min-w-[140px] accent-emerald-500 cursor-pointer" />
                <div class="flex items-center gap-1.5 shrink-0">
                  <button type="button" id="mod28-fs-btn-voice" class="px-2 sm:px-2.5 py-1 rounded-xl border border-zinc-700 bg-zinc-900 text-[11px] sm:text-xs font-bold text-zinc-200">
                    ${this.player.voiceNarrator.enabled ? '🎙️ Giọng Việt: BẬT' : '🔇 Giọng Việt: TẮT'}
                  </button>
                  <button type="button" id="mod28-fs-btn-exit" class="px-2.5 sm:px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] sm:text-xs">
                    🗗 Thu nhỏ (Esc)
                  </button>
                </div>
              </div>
            </div>

            <!-- Thanh Trượt Thời Gian & Bảng Điều Khiển Phát Video Sạch Gọn (Đã bỏ chip nhỏ & cột phụ đề thừa) -->
            <div id="mod28-playback-scrubber-panel" class="p-3 rounded-2xl border border-studioLightBorder dark:border-zinc-800 bg-zinc-950/90 space-y-2.5">
              <div id="mod28-timeline-markers-track" class="space-y-1">
                <div class="flex items-center gap-0.5 w-full" title="Bấm trực tiếp vào từng phân đoạn màu để tua tới tính năng tương ứng">${segmentsBarHtml}</div>
              </div>

              <div class="flex items-center gap-2">
                <span id="mod28-time-current" class="font-monoCode text-[11px] text-emerald-400 w-11">${this.player.formatSecToMmSs(snap.currentTimeSec)}</span>
                <input id="mod28-seek-slider" type="range" min="0" max="${this.player.totalDurationSec}" step="0.2" value="${snap.currentTimeSec}" class="flex-1 accent-emerald-500 cursor-pointer" />
                <span id="mod28-time-total" class="font-monoCode text-[11px] text-zinc-400 w-11 text-right">${this.player.formatSecToMmSs(snap.totalDurationSec)}</span>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  <button type="button" id="mod28-btn-prev-chap" class="px-2.5 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-bold text-[11px] shrink-0">⏮ Trước</button>
                  <button type="button" id="mod28-btn-play-pause" class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow shrink-0">${snap.isPlaying ? '⏸ Tạm dừng' : '▶ Phát Video'}</button>
                  <button type="button" id="mod28-btn-next-chap" class="px-2.5 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-bold text-[11px] shrink-0">Tiếp ⏭</button>
                  <span id="mod28-voice-install-inline-hint" class="${hasViVoice ? 'hidden ' : ''}italic text-[11px] text-amber-300/95 leading-snug ml-1">
                    Bạn muốn AI có giọng nói, <a id="mod28-inline-voice-download-link" href="${this.escapeHtmlSafe(voiceDownloadUrl)}" target="_blank" rel="noopener noreferrer" class="underline font-bold text-cyan-300 hover:text-cyan-200 cursor-pointer">bấm vào đây để tải về</a>, tải về xong reload trang là dùng được
                  </span>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" id="mod28-btn-toggle-voice" class="px-2.5 py-1.5 rounded-xl border ${
                    this.player.voiceNarrator.enabled
                      ? 'border-pink-500/60 bg-pink-500/20 text-pink-200'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300'
                  } font-bold text-[11px]">
                    ${this.player.voiceNarrator.enabled ? '🎙️ Giọng đọc AI Cute: BẬT' : '🔇 Giọng đọc AI Cute: TẮT'}
                  </button>
                  <select id="mod28-voice-lang-select" title="Chọn ngôn ngữ giọng thuyết minh AI 6 thứ tiếng (Neural / Google Dịch TTS)" class="px-2 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-[11px] font-bold text-pink-200">
                    <option value="vi-VN"${this.player.voiceNarrator.language === 'vi-VN' ? ' selected' : ''}>🇻🇳 Tiếng Việt (AI / Google Dịch)</option>
                    <option value="en-US"${this.player.voiceNarrator.language === 'en-US' ? ' selected' : ''}>🇬🇧 English (AI / Google TTS)</option>
                    <option value="zh-CN"${this.player.voiceNarrator.language === 'zh-CN' ? ' selected' : ''}>🇨🇳 中文 简体 (AI / Google 翻译)</option>
                    <option value="zh-TW"${this.player.voiceNarrator.language === 'zh-TW' ? ' selected' : ''}>🇹🇼 中文 繁體 (AI / Google 翻譯)</option>
                    <option value="ko-KR"${this.player.voiceNarrator.language === 'ko-KR' ? ' selected' : ''}>🇰🇷 한국어 (AI / Google 번역)</option>
                    <option value="ja-JP"${this.player.voiceNarrator.language === 'ja-JP' ? ' selected' : ''}>🇯🇵 日本語 (AI / Google 翻訳)</option>
                  </select>
                  <button type="button" id="mod33-btn-toggle-mirror-mode" class="px-2.5 py-1.5 rounded-xl border border-cyan-500/45 bg-cyan-500/15 text-cyan-200 font-bold text-[11px]" title="Chuyển giữa chế độ chiếu Giao diện Web Thật và Sơ đồ">
                    ${globalScope.NoirStudio?.liveDomVideoMirror?.enabled !== false ? '🖥️ Web Thật: BẬT' : '🎨 Sơ đồ: BẬT'}
                  </button>
                  <select id="mod28-sub-lang-select" title="Chọn ngôn ngữ hiển thị phụ đề" class="px-2 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-[11px] font-bold text-cyan-300">
                    <option value="BOTH"${this.player.subtitleLangMode === 'BOTH' ? ' selected' : ''}>💬 Phụ đề: Song ngữ VI + EN</option>
                    <option value="VI"${this.player.subtitleLangMode === 'VI' ? ' selected' : ''}>🇻🇳 Chỉ Tiếng Việt</option>
                    <option value="EN"${this.player.subtitleLangMode === 'EN' ? ' selected' : ''}>🇬🇧 English Only</option>
                  </select>
                  <select id="mod28-speed-select" class="px-2 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-[11px] font-bold text-zinc-200">
                    <option value="0.75"${snap.playbackRate === 0.75 ? ' selected' : ''}>0.75x</option>
                    <option value="1"${snap.playbackRate === 1 ? ' selected' : ''}>1.0x</option>
                    <option value="1.25"${snap.playbackRate === 1.25 ? ' selected' : ''}>1.25x</option>
                    <option value="1.5"${snap.playbackRate === 1.5 ? ' selected' : ''}>1.5x</option>
                  </select>
                  <button type="button" id="mod28-btn-toggle-subs" class="px-2.5 py-1.5 rounded-xl border border-teal-500/40 bg-teal-500/15 text-teal-300 font-bold text-[11px]">
                    ${snap.subtitlesVisible ? '💬 Phụ đề: BẬT' : '💬 Phụ đề: TẮT'}
                  </button>
                  <button type="button" id="mod28-btn-toggle-chime" class="px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 font-bold text-[11px]">
                    ${this.player.chimeSynth.enabled ? '🔔 Chuông chuyển: BẬT' : '🔕 Chuông chuyển: TẮT'}
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/80 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap w-full sm:w-auto sm:flex-1 min-w-0">
                  <select id="mod33-voice-select" title="Chọn giọng đọc Neural/hệ thống mượt nhất" class="w-full sm:w-auto sm:flex-1 min-w-0 sm:min-w-[170px] max-w-full sm:max-w-[320px] px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 text-[10.5px] font-semibold text-zinc-200"></select>
                  <button type="button" id="mod33-btn-test-voice" class="px-2.5 py-1 rounded-lg border border-pink-500/45 bg-pink-500/15 hover:bg-pink-500/25 text-pink-200 font-bold text-[10.5px] transition shrink-0">
                    🎙️ Nghe thử giọng
                  </button>
                </div>
                <span id="mod33-voice-quality-pill" class="text-[10px] font-semibold text-emerald-300 truncate max-w-full">
                  ✨ Đang tải bộ giọng Neural...
                </span>
              </div>
            </div>

            <!-- Các bước thao tác trọng tâm của phân đoạn đang phát -->
            <div class="p-3.5 rounded-2xl border border-studioLightBorder dark:border-zinc-800 bg-zinc-950/70 space-y-2">
              <div class="text-[11px] font-extrabold uppercase text-emerald-400">📌 Hướng Dẫn Từng Bước Trong Chức Năng Này:</div>
              <ul id="mod28-active-steps-list" class="space-y-1.5 text-[11px] text-zinc-300 list-disc pl-4">
                ${curChap.keyActionSteps.map((st) => `<li>${this.escapeHtmlSafe(st)}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-3 flex flex-col">
            <div class="p-3 rounded-2xl border border-studioLightBorder dark:border-zinc-800 bg-zinc-950/70 space-y-2">
              <div class="font-extrabold uppercase text-[11px] text-amber-400">📑 25 Mốc Chức Năng Chi Tiết (~12+ Phút) · Toàn Bộ Tính Năng Mới (Chạm Để Tua Tới)</div>
              <div class="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">${chaptersListHtml}</div>
            </div>
          </div>
        </div>
      `;
    }

    buildChangelogTabHtml() {
      return `
        <div class="space-y-4">
          <div class="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/25">
            <div class="text-sm font-extrabold text-emerald-400">🚀 Tổng Kết Đại Tu Hệ Thống Noir Studio v38.0 (30 Module Thuần Khiết)</div>
            <p class="text-zinc-300 mt-1 text-xs">
              Toàn bộ ứng dụng đã được chuẩn hóa về 1 tệp HTML thống nhất cùng 30 module JavaScript tách biệt trách nhiệm, loại bỏ triệt để xung đột DOM/sự kiện và tối ưu cho cả máy tính lẫn điện thoại.
            </p>
          </div>
          ${SYSTEM_CHANGELOG_V38.map((release) => {
            const borderCls =
              release.badgeTone === 'emerald'
                ? 'border-emerald-500/40'
                : release.badgeTone === 'indigo'
                  ? 'border-indigo-500/40'
                  : 'border-amber-500/40';
            return `
              <div class="p-4 rounded-2xl border ${borderCls} bg-zinc-950/80 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h4 class="font-extrabold text-sm text-white">${this.escapeHtmlSafe(release.version)}</h4>
                  <span class="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold">${this.escapeHtmlSafe(release.dateLabel)}</span>
                </div>
                <ul class="space-y-1.5 text-xs text-zinc-300 list-disc pl-5">
                  ${release.highlights.map((h) => `<li>${this.escapeHtmlSafe(h)}</li>`).join('')}
                </ul>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    buildModelStrategyTabHtml() {
      const router = NS.geminiRouter;
      const activeId = router?.selectedModelId || NS.state?.selectedModelId || 'gemini-3.8-flash';
      const thinkingLabel = router?.getThinkingLevelLabel?.() || 'Trung bình (Cân bằng)';
      const liveList = router?.liveProbe?.getCachedOrLiveModels?.() || [];
      return `
        <div class="space-y-4">
          <div class="p-4 rounded-2xl border border-sky-500/40 bg-sky-950/20 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-sm font-extrabold text-sky-300">🤖 Mô Hình Kích Hoạt: <span class="font-monoCode text-white">${this.escapeHtmlSafe(activeId)}</span> · 🧠 Tư duy: <span class="text-cyan-300">${this.escapeHtmlSafe(thinkingLabel)}</span></div>
              <p class="text-xs text-zinc-400 mt-1">
                API Key liên kết đồng bộ thời gian thực tại cả Trung tâm AI, Chat Bi Số 8, Mode 5 và tự động phát hiện ${liveList.length} điểm cuối live trên tài khoản của bạn.
              </p>
              <div class="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                <a href="https://ai.google.dev/gemini-api/docs/models" target="_blank" rel="noopener noreferrer" class="underline text-sky-300 hover:text-sky-200 font-bold">🌐 Danh sách Model Gemini Live ↗</a>
                <a href="https://aistudio.google.com/rate-limit" target="_blank" rel="noopener noreferrer" class="underline text-emerald-300 hover:text-emerald-200 font-bold">📊 Kiểm tra Hạn mức AI Studio ↗</a>
                <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" class="underline text-indigo-300 hover:text-indigo-200 font-bold">💬 Mở Gemini Web (Khi cần dự phòng) ↗</a>
              </div>
            </div>
            <button type="button" id="mod28-btn-open-apikey-vault" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow">
              🔑 Kiểm Tra API Key Ngay
            </button>
          </div>
          <div class="grid grid-cols-1 gap-3">
            ${UP_TO_DATE_MODEL_STRATEGY_GUIDE.map((item) => `
              <div class="p-4 rounded-2xl border ${item.toneClass} space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-extrabold text-xs">${this.escapeHtmlSafe(item.tier)}</span>
                  <span class="px-2 py-0.5 rounded-full bg-black/40 font-monoCode text-[10px] font-bold">${this.escapeHtmlSafe(item.badge)}</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  ${item.models.map((m) => `<span class="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 font-monoCode text-[11px] font-bold">${this.escapeHtmlSafe(m)}</span>`).join('')}
                </div>
                <p class="text-xs text-zinc-200 leading-relaxed">${this.escapeHtmlSafe(item.advice)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    buildShortcutsAndTipsTabHtml() {
      return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-3">
            <h4 class="font-extrabold text-sm text-emerald-400">⌨️ Bảng Phím Tắt Nhanh Trên Máy Tính</h4>
            <div class="space-y-2">
              ${STUDIO_SHORTCUTS_CHEATSHEET.map((sc) => `
                <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <kbd class="px-2 py-1 rounded-lg bg-zinc-950 border border-emerald-500/40 text-emerald-300 font-monoCode font-bold text-[11px] shrink-0">${this.escapeHtmlSafe(sc.keys)}</kbd>
                  <span class="text-xs text-zinc-300 text-right">${this.escapeHtmlSafe(sc.action)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-3">
            <h4 class="font-extrabold text-sm text-amber-400">📱 Mẹo Viết Nhanh Trên Điện Thoại & PWA</h4>
            <ul class="space-y-2 text-xs text-zinc-300 list-disc pl-4 leading-relaxed">
              <li><strong>Cài thành App độc lập:</strong> Trên Chrome (Android) hoặc Safari (iPhone), chọn <em>Thêm vào Màn hình chính</em> để ẩn thanh địa chỉ và mở toàn màn hình như ứng dụng thật.</li>
              <li><strong>Thanh chèn ký tự nhanh:</strong> Ngay dưới ô soạn thảo trên điện thoại có sẵn các nút chèn ngoặc thoại <code>「 」</code>, dấu lửng <code>…</code>, gạch nối <code>——</code> và dấu ngắt cảnh <code>***</code> bằng 1 chạm.</li>
              <li><strong>Khôi phục phòng sự cố:</strong> Trước khi đóng tab trên điện thoại, chạm nút Lưu hoặc để chế độ Auto-Save 3 tầng ghi tự động vào IndexedDB & Kho Phiên Bản Tab 6.</li>
            </ul>
          </div>
        </div>
      `;
    }

    bindRenderedTabControls(containerEl) {
      containerEl.querySelectorAll('.mod28-tut-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetTab = btn.getAttribute('data-tut-tab') || 'VIDEO';
          this.switchSubTab(targetTab);
        });
      });

      const canvasEl = document.getElementById('mod28-tutorial-canvas');
      if (canvasEl) {
        canvasEl.addEventListener('click', () => this.player.togglePlayPause());
      }

      const playPauseBtn = document.getElementById('mod28-btn-play-pause');
      if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => this.player.togglePlayPause());
      }

      const prevBtn = document.getElementById('mod28-btn-prev-chap');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.player.stepChapter(-1));
      }

      const nextBtn = document.getElementById('mod28-btn-next-chap');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.player.stepChapter(1));
      }

      const sliderEl = document.getElementById('mod28-seek-slider');
      if (sliderEl) {
        sliderEl.addEventListener('input', () => {
          this.player.seekToSeconds(parseFloat(sliderEl.value) || 0, false);
        });
      }

      const fsSliderEl = document.getElementById('mod28-fs-seek-slider');
      if (fsSliderEl) {
        fsSliderEl.addEventListener('input', () => {
          this.player.seekToSeconds(parseFloat(fsSliderEl.value) || 0, false);
        });
      }

      const fsBtn = document.getElementById('mod28-btn-fullscreen');
      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          this.setTheaterFullscreen(!this.isTheaterFullscreen);
        });
      }

      const fsExitBtn = document.getElementById('mod28-fs-btn-exit');
      if (fsExitBtn) {
        fsExitBtn.addEventListener('click', () => {
          this.setTheaterFullscreen(false);
        });
      }

      const fsPlayBtn = document.getElementById('mod28-fs-btn-play');
      if (fsPlayBtn) {
        fsPlayBtn.addEventListener('click', () => {
          this.player.togglePlayPause();
        });
      }

      const speedEl = document.getElementById('mod28-speed-select');
      if (speedEl) {
        speedEl.addEventListener('change', () => {
          this.player.setPlaybackRate(parseFloat(speedEl.value) || 1);
        });
      }

      const subsToggleBtn = document.getElementById('mod28-btn-toggle-subs');
      if (subsToggleBtn) {
        subsToggleBtn.addEventListener('click', () => {
          const on = this.player.toggleSubtitlesVisible();
          subsToggleBtn.textContent = on ? '💬 Phụ đề: BẬT' : '💬 Phụ đề: TẮT';
          const barEl = document.getElementById('mod28-subtitle-theater-bar');
          if (barEl) barEl.classList.toggle('hidden', !on);
        });
      }

      const chimeBtn = document.getElementById('mod28-btn-toggle-chime');
      if (chimeBtn) {
        chimeBtn.addEventListener('click', () => {
          const next = !this.player.chimeSynth.enabled;
          this.player.chimeSynth.setEnabled(next);
          chimeBtn.textContent = next ? '🔔 Chuông chuyển: BẬT' : '🔕 Chuông chuyển: TẮT';
        });
      }

      const inlineVoiceDlLink = document.getElementById('mod28-inline-voice-download-link');
      if (inlineVoiceDlLink) {
        inlineVoiceDlLink.addEventListener('click', () => {
          globalScope.NoirStudio?.neuralVoice?.markPendingVoiceInstall?.({
            video: true,
            chat: true,
            source: 'VIDEO_INLINE_LINK',
          });
        });
      }

      const syncVoiceButtonsUI = (isOn) => {
        this.syncVoiceControlsUI(isOn);
      };

      const toggleVoiceState = () => {
        const next = this.player.voiceNarrator.setEnabled(!this.player.voiceNarrator.enabled);
        syncVoiceButtonsUI(next);
        if (!next) {
          // Dừng dứt điểm toàn bộ giọng đọc và bộ đếm hẹn giờ ngay lập tức
          this.player.voiceNarrator.stop();
        } else {
          const neuralVoice = globalScope.NoirStudio?.neuralVoice;
          const activeLang = this.player.voiceNarrator.language || 'vi-VN';
          if (
            activeLang === 'vi-VN' &&
            neuralVoice &&
            typeof neuralVoice.hasVoiceForLanguage === 'function' &&
            !neuralVoice.hasVoiceForLanguage('vi-VN')
          ) {
            neuralVoice.markPendingVoiceInstall?.({
              video: true,
              chat: true,
              source: 'VIDEO',
            });
            neuralVoice.openVoiceInstallGuideModal?.({
              source: 'VIDEO',
              lang: 'vi-VN',
            });
          } else if (this.player.isPlaying) {
            this.player.voiceNarrator.speakCueIfNeeded(this.player.getCurrentSubtitleCue(), true);
          }
        }
        this.player.renderCurrentFrame();
      };

      const voiceToggleBtn = document.getElementById('mod28-btn-toggle-voice');
      if (voiceToggleBtn) {
        voiceToggleBtn.addEventListener('click', toggleVoiceState);
      }

      const fsVoiceBtn = document.getElementById('mod28-fs-btn-voice');
      if (fsVoiceBtn) {
        fsVoiceBtn.addEventListener('click', toggleVoiceState);
      }

      const voiceLangSel = document.getElementById('mod28-voice-lang-select');
      if (voiceLangSel) {
        voiceLangSel.addEventListener('change', () => {
          this.player.voiceNarrator.setLanguage(voiceLangSel.value);
          globalScope.NoirStudio?.neuralVoice?.syncVoicePickerUI?.(voiceLangSel.value);
          if (this.player.voiceNarrator.enabled && this.player.isPlaying) {
            this.player.voiceNarrator.speakCueIfNeeded(this.player.getCurrentSubtitleCue(), true);
          }
          this.player.renderCurrentFrame();
        });
      }

      const mod33VoiceSel = document.getElementById('mod33-voice-select');
      if (mod33VoiceSel) {
        mod33VoiceSel.addEventListener('change', () => {
          const lang = document.getElementById('mod28-voice-lang-select')?.value || 'vi-VN';
          globalScope.NoirStudio?.neuralVoice?.setPreferredVoice?.(lang, mod33VoiceSel.value);
          globalScope.NoirStudio?.neuralVoice?.syncVoicePickerUI?.(lang);
        });
      }

      const mod33TestVoiceBtn = document.getElementById('mod33-btn-test-voice');
      if (mod33TestVoiceBtn) {
        mod33TestVoiceBtn.addEventListener('click', () => {
          const lang = document.getElementById('mod28-voice-lang-select')?.value || 'vi-VN';
          const samplesByLang = {
            'vi-VN': 'Xin chào tác giả Bi! Video hướng dẫn nay chiếu trực tiếp giao diện thật của 45 Module với giọng đọc AI tự nhiên.',
            'en-US': 'Hello author Bi! Welcome to Noir Studio, where all 45 modules and your live Light Novel workspace guide every step smoothly.',
            'zh-CN': '你好作者 Bi！欢迎来到小说创作工作室，45个完整模块和语音向导将助你流畅创作每一章故事。',
            'zh-TW': '你好作者 Bi！歡迎來到小說創作工作室，45個完整模組與語音導覽將助你流暢創作每一章故事。',
            'ko-KR': '안녕하세요 Bi 작가님! 45개 모듈이 모두 갖춰진 소설 스튜디오에 오신 것을 환영합니다.',
            'ja-JP': 'こんにちは、Bi作家さん！45個のモジュールを備えた小説執筆スタジオへようこそ。',
          };
          const sample = samplesByLang[lang] || samplesByLang['vi-VN'];
          globalScope.NoirStudio?.neuralVoice?.speakText?.(sample, lang, {
            source: 'VIDEO_TEST',
            rate: this.player.playbackRate || 0.98,
            pitch: 1.0,
          });
        });
      }

      const mod33MirrorToggleBtn = document.getElementById('mod33-btn-toggle-mirror-mode');
      if (mod33MirrorToggleBtn) {
        mod33MirrorToggleBtn.addEventListener('click', () => {
          const domMirror = globalScope.NoirStudio?.liveDomVideoMirror;
          if (!domMirror) return;
          const next = domMirror.setEnabled(!domMirror.enabled);
          mod33MirrorToggleBtn.textContent = next ? '🖥️ Web Thật: BẬT' : '🎨 Sơ đồ: BẬT';
          this.player.renderCurrentFrame();
        });
      }

      const subLangSel = document.getElementById('mod28-sub-lang-select');
      if (subLangSel) {
        subLangSel.addEventListener('change', () => {
          this.player.setSubtitleLangMode(subLangSel.value);
        });
      }

      containerEl.querySelectorAll('.mod28-chapter-jump-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cid = btn.getAttribute('data-tut-chapter');
          if (cid) this.player.jumpToChapterById(cid, true);
        });
      });

      containerEl.querySelectorAll('.mod28-timeline-seg').forEach((btn) => {
        btn.addEventListener('click', () => {
          const sec = parseFloat(btn.getAttribute('data-tut-seek') || '0');
          this.player.seekToSeconds(sec + 0.05, true);
        });
      });

      const openVaultBtn = document.getElementById('mod28-btn-open-apikey-vault');
      if (openVaultBtn) {
        openVaultBtn.addEventListener('click', () => {
          this.closeModal();
          document.getElementById('btn-s6-card-apikey')?.click();
        });
      }
    }

    syncLivePlayerDom(snap) {
      if (!snap || this.activeSubTab !== 'VIDEO') return;
      const curTimeEl = document.getElementById('mod28-time-current');
      const sliderEl = document.getElementById('mod28-seek-slider');
      const playPauseBtn = document.getElementById('mod28-btn-play-pause');
      const fsTimeEl = document.getElementById('mod28-fs-time-current');
      const fsSliderEl = document.getElementById('mod28-fs-seek-slider');
      const fsPlayBtn = document.getElementById('mod28-fs-btn-play');
      const subBarEl = document.getElementById('mod28-subtitle-theater-bar');
      const subTextEl = document.getElementById('mod28-live-sub-text');
      const subTextEnEl = document.getElementById('mod28-live-sub-text-en');
      const subSpeakerEl = document.getElementById('mod28-live-sub-speaker');
      const chapBadgeEl = document.getElementById('mod28-live-chap-badge');
      const stepsEl = document.getElementById('mod28-active-steps-list');

      const i18n = globalScope.NoirStudio?.i18n;
      const tr = (s) => (i18n?.translateText ? i18n.translateText(String(s || '')) : String(s || ''));
      const curLang = i18n?.getLanguage ? i18n.getLanguage() : 'vi';

      if (curTimeEl) curTimeEl.textContent = this.player.formatSecToMmSs(snap.currentTimeSec);
      if (sliderEl) sliderEl.value = String(snap.currentTimeSec);
      if (playPauseBtn) playPauseBtn.textContent = tr(snap.isPlaying ? '⏸ Tạm dừng' : '▶ Phát Video');
      if (fsTimeEl) fsTimeEl.textContent = `${this.player.formatSecToMmSs(snap.currentTimeSec)} / ${this.player.formatSecToMmSs(snap.totalDurationSec)}`;
      if (fsSliderEl) fsSliderEl.value = String(snap.currentTimeSec);
      if (fsPlayBtn) fsPlayBtn.textContent = tr(snap.isPlaying ? '⏸ Tạm dừng' : '▶ Phát');
      if (subBarEl) subBarEl.classList.toggle('hidden', !snap.subtitlesVisible);
      if (subTextEl && snap.cue) {
        subTextEl.textContent = tr(`🇻🇳 ${snap.cue.text}`);
        subTextEl.classList.toggle('hidden', this.player.subtitleLangMode === 'EN');
      }
      if (subTextEnEl && snap.cue) {
        subTextEnEl.textContent = `🇬🇧 ${snap.cue.textEn || ''}`;
        subTextEnEl.classList.toggle('hidden', this.player.subtitleLangMode === 'VI');
      }
      if (subSpeakerEl && snap.cue) {
        const combinedSpeaker = `${snap.cue.speaker} • ${snap.cue.speakerEn || 'Bi Guide'}`;
        const translatedCombined = tr(combinedSpeaker);
        subSpeakerEl.textContent =
          translatedCombined !== combinedSpeaker
            ? translatedCombined
            : `${tr(snap.cue.speaker)} • ${snap.cue.speakerEn || 'Bi Guide'}`;
      }
      if (chapBadgeEl && snap.chapter) chapBadgeEl.textContent = tr(snap.chapter.badgeLabel);

      if (
        stepsEl &&
        snap.chapter &&
        (stepsEl.dataset.renderedChapterId !== snap.chapter.id || stepsEl.dataset.renderedLang !== curLang)
      ) {
        stepsEl.dataset.renderedChapterId = snap.chapter.id;
        stepsEl.dataset.renderedLang = curLang;
        stepsEl.innerHTML = snap.chapter.keyActionSteps
          .map((st) => `<li>${this.escapeHtmlSafe(st)}</li>`)
          .join('');
        i18n?.translateElement?.(stepsEl);
      }

      document.querySelectorAll('.mod28-chapter-jump-btn').forEach((btn) => {
        const cid = btn.getAttribute('data-tut-chapter');
        const active = snap.chapter && cid === snap.chapter.id;
        btn.classList.toggle('border-emerald-500/70', Boolean(active));
        btn.classList.toggle('bg-emerald-500/15', Boolean(active));
      });
    }
  }

  const tutorialController = new TutorialAndChangelogController();

  NS.TUTORIAL_CHAPTERS_V38 = VIDEO_TUTORIAL_CHAPTERS_DATA;
  NS.TUTORIAL_SUBTITLES_V38 = SYNCHRONIZED_SUBTITLE_TRACK_V38;
  NS.CHANGELOG_ENTRIES_V38 = SYSTEM_CHANGELOG_V38;
  NS.MODEL_STRATEGY_GUIDE_V38 = UP_TO_DATE_MODEL_STRATEGY_GUIDE;
  NS.SHORTCUTS_CHEATSHEET_V38 = STUDIO_SHORTCUTS_CHEATSHEET;
  NS.AnimatedCanvasTutorialPlayer = AnimatedCanvasTutorialPlayer;
  NS.TutorialAndChangelogController = TutorialAndChangelogController;
  NS.tutorialAndChangelog = tutorialController;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod28', tutorialController);
  }

  if (typeof globalScope !== 'undefined' && typeof globalScope.addEventListener === 'function') {
    globalScope.addEventListener('i18n:languageChanged', (ev) => {
      const nv = globalScope.NoirStudio?.neuralVoice;
      const nextLangCode =
        typeof nv?.normalizeLangCode === 'function'
          ? nv.normalizeLangCode(ev?.detail?.lang || globalScope.NoirStudio?.i18n?.getLanguage?.() || 'vi')
          : 'vi-VN';
      tutorialController.player?.voiceNarrator?.setLanguage?.(nextLangCode);
      const sel = document.getElementById('mod28-voice-lang-select');
      if (sel && sel.value !== nextLangCode) {
        sel.value = nextLangCode;
      }
      nv?.syncVoicePickerUI?.(nextLangCode);
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!tutorialController.hasInitialized) tutorialController.init();
      });
    } else {
      tutorialController.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
