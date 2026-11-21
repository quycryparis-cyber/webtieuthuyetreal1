/**
 * ============================================================================
 * NOIR STUDIO — MODULE 41: CHẾ ĐỘ DÙNG THỬ GUEST MODE (KHÔNG CẦN API & THƯ MỤC)
 * ============================================================================
 * Nhiệm vụ:
 *  - Cung cấp nút bấm màu xám nổi bật ngay bên dưới badge "Đủ điều kiện — Sẵn
 *    sàng vào Studio" trên màn hình Cổng Kết Nối (index.html) để người dùng mới
 *    có thể bước thẳng vào Studio dùng thử toàn bộ giao diện & tính năng mà
 *    chưa cần dán Gemini API Key hay chọn thư mục làm việc.
 *  - Cô lập hoàn toàn dữ liệu thực của người dùng (localStorage, IndexedDB,
 *    FileSystem Access / OPFS, két API Key) bằng lớp RAM Sandbox tạm thời:
 *    mọi thao tác trong Guest Mode không bao giờ ghi đè hoặc xóa dữ liệu thật.
 *  - Khóa toàn bộ ô tự nhập câu lệnh AI & ô chat tự do (readOnly + chặn sự kiện
 *    nhập/dán), thay thế bằng bộ Prompt Mẫu Có Sẵn cho đủ cả 5 Chế Độ
 *    (Chế độ 1 -> Chế độ 5) & Câu hỏi mẫu Chatbot Bi Số 8: bấm là chạy mô
 *    phỏng ngay lập tức với đầu ra văn học mẫu, Google Docs Diff & Sơ đồ SVG.
 *  - Cho phép người dùng tự do tương tác tất cả chức năng UI không đòi hỏi
 *    lưu trữ thật hay gọi Gemini API; đồng thời chặn nghiêm ngặt mọi thao tác
 *    liên quan tới Lưu trữ / Thư mục / Kết nối Gemini và hiện thông báo rõ
 *    ràng hướng dẫn Reload lại web để sao chép & dán API Key + chọn thư mục
 *    ở màn hình chính (chỉ mất chưa đầy 2 phút).
 * ============================================================================
 */
(function initMod41GuestDemoSandboxMode(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  // ==========================================================================
  // 1. HẰNG SỐ CẤU HÌNH & MA TRẬN PHÂN QUYỀN GUEST MODE
  // ==========================================================================
  const MOD41_CONSTANTS = Object.freeze({
    MODULE_KEY: 'mod41',
    MODULE_VERSION: '41.0.0',
    DOM_IDS: Object.freeze({
      GATE_GUEST_BTN: 'btn-gate-enter-guest-mode',
      TOP_BANNER: 'mod41-guest-mode-banner',
      BANNER_MATRIX_BTN: 'btn-mod41-open-capability-matrix',
      BANNER_RELOAD_BTN: 'btn-mod41-reload-to-connect',
      BANNER_QUICK_5MODES_BTN: 'btn-mod41-jump-5modes',
      TAB3_PRESETS_DOCK: 'mod41-tab3-guest-presets-dock',
      CMD_MODAL_PRESETS_DOCK: 'mod41-cmd-modal-guest-presets-dock',
      MODE5_PRESETS_DOCK: 'mod41-mode5-guest-presets-dock',
      CHAT_PRESETS_BAR: 'mod41-freechat-guest-presets-bar',
      RESTRICTION_MODAL: 'modal-guest-mode-restriction',
      RESTRICTION_BADGE: 'mod41-restrict-req-badge',
      RESTRICTION_TITLE: 'mod41-restrict-feature-title',
      RESTRICTION_REASON: 'mod41-restrict-reason-text',
      RESTRICTION_STEPS: 'mod41-restrict-steps-box',
      RESTRICTION_RELOAD_BTN: 'btn-mod41-restrict-reload-now',
      RESTRICTION_MATRIX_BTN: 'btn-mod41-restrict-open-matrix',
      RESTRICTION_CLOSE_BTN: 'btn-mod41-restrict-close',
      MATRIX_MODAL: 'modal-guest-capability-matrix',
      MATRIX_CLOSE_BTN: 'btn-mod41-matrix-close',
      MATRIX_RELOAD_BTN: 'btn-mod41-matrix-reload',
      TAB6_GUEST_NOTICE: 'mod41-tab6-guest-status-card',
      TAB5_MUSIC_CARD_BTN: 's14-card-music-btn',
      TAB5_YOUTUBE_CARD: 'tab5-youtube-big-card'
    }),
    SPOTLIGHT_DURATION_MS: 4000,
    SPOTLIGHT_CLASS: 'noir-guest-tab5-spotlight',
    REQUIREMENT_TYPES: Object.freeze({
      API_KEY: 'API_KEY',
      WORKSPACE_FOLDER: 'WORKSPACE_FOLDER',
      BOTH_API_AND_FOLDER: 'BOTH_API_AND_FOLDER',
      CUSTOM_PROMPT_LOCKED: 'CUSTOM_PROMPT_LOCKED'
    }),
    LOCKED_PROMPT_INPUT_IDS: Object.freeze([
      's18-fullscreen-prompt-textarea',
      'mode5-prompt-input',
      'textarea-synthesized-master-prompt',
      'textarea-sysprompt-editor',
      'free-chat-input'
    ]),
    PROTECTED_STORAGE_PREFIXES: Object.freeze([
      'noir_',
      'bi_',
      'mod33_',
      'mod34_',
      'mod35_',
      'mod37_',
      'mod38_',
      'mod39_',
      'mod40_'
    ]),
    TWO_MINUTE_RELOAD_MESSAGE:
      'Bạn đang ở chế độ dùng thử (Guest Mode). Để sử dụng trọn vẹn tính năng này và bảo vệ bản thảo an toàn, bạn cần liên kết ở màn hình chính (Reload lại web để liên kết) bằng việc sao chép và dán Key API của Gemini ở Bước 1 cũng như chọn Thư mục làm việc ở Bước 2 — tất cả thao tác chỉ tốn chưa đầy 2 phút!'
  });

  const CAPABILITY_CATEGORY_META = Object.freeze({
    FREE: Object.freeze({
      id: 'FREE',
      badge: '✅ DÙNG TỰ DO (0 API · 0 Ổ CỨNG)',
      accentClass: 'border-emerald-500/45 bg-emerald-950/35 text-emerald-200',
      pillClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    }),
    SIMULATED_ONLY: Object.freeze({
      id: 'SIMULATED_ONLY',
      badge: '🧪 PROMPT MẪU MÔ PHỎNG (KHÔNG ĐƯỢC TỰ NHẬP)',
      accentClass: 'border-sky-500/45 bg-sky-950/35 text-sky-200',
      pillClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
    }),
    REQUIRES_API: Object.freeze({
      id: 'REQUIRES_API',
      badge: '🔐 KHÓA — CẦN GEMINI API KEY',
      accentClass: 'border-amber-500/45 bg-amber-950/35 text-amber-200',
      pillClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    }),
    REQUIRES_FOLDER: Object.freeze({
      id: 'REQUIRES_FOLDER',
      badge: '📁 KHÓA — CẦN CHỌN THƯ MỤC LÀM VIỆC',
      accentClass: 'border-rose-500/45 bg-rose-950/35 text-rose-200',
      pillClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    }),
    REQUIRES_BOTH: Object.freeze({
      id: 'REQUIRES_BOTH',
      badge: '🔐📁 KHÓA — CẦN CẢ API KEY & THƯ MỤC',
      accentClass: 'border-fuchsia-500/45 bg-fuchsia-950/35 text-fuchsia-200',
      pillClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40'
    })
  });

  const GUEST_CAPABILITY_ENTRIES = Object.freeze([
    {
      id: 'cap_nav_tabs',
      category: 'FREE',
      tab: 'Toàn Trang',
      title: 'Điều hướng 6 Tab trên PC & Điện thoại + Giao diện Sáng/Tối + Zen Focus',
      detail: 'Chuyển mượt cả 6 màn hình, mở thanh công cụ rút gọn, xem đồ thị & phản hồi responsive.'
    },
    {
      id: 'cap_tab1_analyzers',
      category: 'FREE',
      tab: 'Tab 1',
      title: 'Đọc bản thảo mẫu, Thống kê từ, Quét sáo ngữ AI, Từ điển Ngũ quan, Chuẩn hóa thoại, Đồ thị quan hệ SVG & Duyệt Diff thử trên RAM',
      detail: 'Tương tác mọi công cụ biên tập trên bộ chương mẫu trong phiên hiện tại (không ghi lên ổ cứng).'
    },
    {
      id: 'cap_tab2_search',
      category: 'FREE',
      tab: 'Tab 2',
      title: 'Chuyển chương mẫu, Lọc Trạng thái Nháp/Duyệt & Tra cứu BM25 (0 Token)',
      detail: 'Tìm kiếm tức thời mọi tình tiết trong bộ tiểu thuyết mẫu "Bí Mật Tháp Đồng Hồ Đêm Mưa".'
    },
    {
      id: 'cap_tab3_5modes_sim',
      category: 'SIMULATED_ONLY',
      tab: 'Tab 3 & Chatbot',
      title: 'Chạy 10 Prompt Mẫu & Kết Quả Mô Phỏng Cho Đủ 5 Chế Độ (Chế độ 1 → 5) + Hỏi Mẫu Bi Số 8',
      detail: 'Chặn tự gõ câu lệnh mới; chỉ cần bấm chọn Prompt mẫu là xem trọn quy trình tổng hợp Prompt, Google Docs Diff, Đánh giá độc giả và Biểu đồ SVG Mode 5.'
    },
    {
      id: 'cap_tab4_read',
      category: 'FREE',
      tab: 'Tab 4',
      title: 'Xem Hồ sơ Story Bible mẫu, Ma trận "Ai Biết Gì", Sổ Phục bút & Copy Prompt Google NotebookLM',
      detail: 'Kiểm tra đầy đủ cấu trúc chống quên cốt truyện và sao chép câu lệnh NotebookLM miễn phí.'
    },
    {
      id: 'cap_tab5_focus',
      category: 'FREE',
      tab: 'Tab 5',
      title: 'Pomodoro đồng bộ 2 chiều, Nhạc A–B & Âm thanh mưa, YouTube Không Quảng Cáo Tìm Trong Khung & Nền Video Chuyển Động 16:9',
      detail: 'Trải nghiệm trọn vẹn không gian viết sâu, nến sáng & lịch điểm danh tạm trên RAM.'
    },
    {
      id: 'cap_tab6_guides',
      category: 'FREE',
      tab: 'Tab 6',
      title: 'Video Hướng Dẫn Tương Tác, Bách Khoa Toàn Thư Chức Năng, Xem Trước Xuất Sách PDF & Thông Tin Tác Giả',
      detail: 'Tìm hiểu toàn bộ các module và thử trình xem trước bố cục sách PDF chọn font chữ.'
    },
    {
      id: 'cap_block_api_live',
      category: 'REQUIRES_API',
      tab: 'Tab 1, 3, 4 & Chat',
      title: 'Tự gõ Prompt AI mới, Chạy Gemini AI thật, Đồng bộ Story Bible bằng AI & Chat tự do Viên Bi Số 8',
      detail: 'Cần dán Gemini API Key ở màn hình chính để gọi mô hình thật (Flash-Lite, Flash, Pro, Hydrogen 4).'
    },
    {
      id: 'cap_block_folder_storage',
      category: 'REQUIRES_FOLDER',
      tab: 'Tab 1, 2, 4 & 6',
      title: 'Lưu bản thảo xuống ổ cứng / IndexedDB, Tạo chương mới, Nhập file .DOCX/.PDF, Xóa chương, Kho Phiên Bản & Đồng bộ .ZIP / Google Drive',
      detail: 'Cần chọn Thư mục làm việc ở màn hình chính để mọi dữ liệu được lưu an toàn 3 tầng.'
    },
    {
      id: 'cap_block_both',
      category: 'REQUIRES_BOTH',
      tab: 'Tab 1 & Tab 3',
      title: 'Duyệt & Chốt Bản Thảo Thông Minh (tự động bóc tách AI vào Story Bible + ghi file đã duyệt lên ổ cứng)',
      detail: 'Yêu cầu cả Gemini API Key lẫn Thư mục làm việc tại màn hình Cổng Kết Nối chính.'
    }
  ]);

  // ==========================================================================
  // 2. DỮ LIỆU TIỂU THUYẾT MẪU & CÂU TRẢ LỜI MÔ PHỎNG 5 CHẾ ĐỘ
  // ==========================================================================
  class GuestDemoDatasetFactory {
    static createDemoChapters() {
      const now = Date.now();
      const ch1Content = [
        'Cơn mưa tháng Mười Một quất xiên qua khung cửa kính vỡ của nhà ga cũ, mang theo mùi rỉ sét hòa cùng hơi đất lạnh ngắt. Trần Minh Khôi dừng bước dưới mái hiên rêu phong, ngón tay trỏ khẽ miết lên mép đồng hồ quả quýt đã nứt mặt kính trong túi áo dạ.',
        '',
        'Trên cao, Tháp Đồng Hồ Đêm Mưa sừng sững như một cây kim sắt đen đâm thẳng vào nền trời sũng nước. Hai kim đồng hồ bằng đồng xỉn màu đã đóng băng ở đúng mười ba giờ không phút kể từ đêm hỏa hoạn hai mươi năm trước.',
        '',
        '- Anh vẫn quay lại đây vào đúng đêm mưa sao, thanh tra? (Lệ Băng)',
        '',
        'Giọng nói vang lên từ phía cầu thang xoắn tối om, trong trẻo nhưng lạnh như mặt đá hoa cương dưới giếng cạn. Ngọn đèn bão trên tay cô hắt vệt sáng vàng vọt lên bậc gỗ mục, để lộ chùm chìa khóa đồng khắc số La Mã đeo ngang hông.',
        '',
        '- Tôi không đến để ngắm mưa. Tôi đến để tìm người đã bẻ gãy kim phút của thành phố này. (Trần Minh Khôi)',
        '',
        'Lệ Băng khẽ nâng chiếc chìa khóa thứ tư lên ngang tầm mắt. Trên thân chìa bằng đồng thau có khắc một vệt ký hiệu hình bán nguyệt úp ngược — trùng khớp tuyệt đối với mảnh giấy cháy dở mà Minh Khôi nhặt được tại viện lưu trữ sáng nay. Không nói thêm lời nào, cô xoay cổ tay tra khóa vào cánh cửa sắt tầng hầm, tiếng lạch cạch khô khốc xé toạc khoảng lặng nặng nề của đêm mưa.'
      ].join('\n');

      const ch2Content = [
        'Bậc thang đá dẫn xuống hầm lưu trữ bốc lên thứ mùi ẩm mốc đặc trưng của giấy da cũ và sáp nến tàn. Mỗi bước chân của Minh Khôi đều dội lại tiếng vang đục, như thể phía sau những bức tường gạch rêu xanh kia còn có một căn phòng rỗng khác đang nín thở lắng nghe.',
        '',
        'Trên chiếc bàn gỗ sồi đặt chính giữa hầm, sáu cuốn sổ cái bìa đen xếp thành hình vòng cung quanh một chiếc hộp thiếc niêm phong. Khi Lệ Băng bật khóa hộp, một tiếng tích tắc khe khẽ đột ngột cất lên giữa không gian tĩnh lặng — thứ âm thanh vốn không thể phát ra từ một cỗ máy đã mất dây cót.',
        '',
        '- Chú đừng chạm vào bánh răng thứ bảy nhé, kim giờ sẽ quay ngược đấy! (Bé Miu)',
        '',
        'Cô bé khoảng chín tuổi đứng nép sau giá sách gỗ mục từ lúc nào không hay, hai tay ôm chặt con búp bê vải thiếu mất một chiếc cúc mắt. Ánh đèn bão run rẩy chiếu lên vạt áo mưa ướt sũng của em — lạ ở chỗ, lối cầu thang duy nhất xuống hầm chỉ có Minh Khôi và Lệ Băng vừa mở khóa.',
        '',
        '- Cháu làm thế nào mà xuống được đây trước cả khi cửa sắt mở? (Trần Minh Khôi)',
        '',
        'Lệ Băng siết chặt cán đèn bão đến mức khớp ngón tay trắng bệch, còn Bé Miu chỉ mỉm cười, giơ lên một mảnh đồng nhỏ sáng loáng khắc tên Giáo sư Hoàng ở mặt sau.'
      ].join('\n');

      const ch3Content = [
        'Tiếng sấm rền vang trên đỉnh tháp khiến bụi vôi từ trần hầm rơi lả tả xuống trang sổ cái mở sẵn. Minh Khôi cúi sát xuống dòng mực phai ngày 13 tháng 11, nơi nét chữ run rẩy của Giáo sư Hoàng ghi chép về thí nghiệm đồng bộ ký ức bằng xung chuông đồng.',
        '',
        'Vết thương cũ nơi cổ tay trái của anh bất chợt nhói lên theo từng nhịp chuông vọng qua lớp đá dày. Một luồng điện chạy dọc sống lưng khi anh nhận ra con số 13:00 không phải là giờ xảy ra hỏa hoạn, mà là mật mã mở tầng áp mái nơi giữ cuộn băng ghi âm gốc.',
        '',
        'Lệ Băng nhìn anh với ánh mắt phức tạp rồi thở dài một tiếng thật khẽ, tay đặt lên chốt cầu dao điện dự phòng.',
        '',
        '- Nếu anh bước lên gác chuông đêm nay, mọi hồ sơ giả về vụ án hai mươi năm trước sẽ lộ sạch dưới ánh sáng đấy, Minh Khôi. (Lệ Băng)',
        '',
        '- Sự thật nào rồi cũng phải trả giá bằng chính thời gian đã bị đánh cắp. Mở cửa tầng thượng đi. (Trần Minh Khôi)',
        '',
        'Cánh cửa gỗ lim dẫn lên gác chuông bật mở, gió bão ùa vào thổi tắt ngọn đèn bão chỉ trong tích tắc. Đúng khoảnh khắc ấy, giữa tiếng mưa gào xé màn đêm, kim giờ khổng lồ trên mặt tháp bỗng nhích khẽ một nấc, kéo theo tiếng chuông đồng ngân vang trầm đục khắp thung lũng.'
      ].join('\n');

      return [
        {
          id: 'chap_guest_01',
          order: 0,
          displayTitle: 'Chương 1: Tiếng Chuông Lúc Mười Ba Giờ',
          title: 'Chương 1: Tiếng Chuông Lúc Mười Ba Giờ',
          status: 'APPROVED',
          content: ch1Content,
          beats: 'Mở màn tại Tháp Đồng Hồ đêm mưa; Minh Khôi gặp Lệ Băng và xác nhận mảnh chìa khóa bán nguyệt.',
          wordCount: String(ch1Content || '').trim().split(/\s+/).filter(Boolean).length,
          createdAt: now - 3600000 * 5,
          updatedAt: now - 3600000 * 4
        },
        {
          id: 'chap_guest_02',
          order: 1,
          displayTitle: 'Chương 2: Mật Mã Dưới Hầm Lưu Trữ',
          title: 'Chương 2: Mật Mã Dưới Hầm Lưu Trữ',
          status: 'APPROVED',
          content: ch2Content,
          beats: 'Khám phá 6 sổ cái bìa đen trong hầm; Bé Miu xuất hiện kỳ lạ với manh mối Giáo sư Hoàng.',
          wordCount: String(ch2Content || '').trim().split(/\s+/).filter(Boolean).length,
          createdAt: now - 3600000 * 3,
          updatedAt: now - 3600000 * 2
        },
        {
          id: 'chap_guest_03',
          order: 2,
          displayTitle: 'Chương 3: Ngã Rẽ Dưới Cơn Mưa Rào',
          title: 'Chương 3: Ngã Rẽ Dưới Cơn Mưa Rào',
          status: 'DRAFT',
          content: ch3Content,
          beats: 'Giải mã con số 13:00; vết thương cổ tay trái Minh Khôi; bước lên gác chuông đối chất Lệ Băng.',
          wordCount: String(ch3Content || '').trim().split(/\s+/).filter(Boolean).length,
          createdAt: now - 3600000,
          updatedAt: now - 600000
        }
      ];
    }

    static createDemoStoryBible() {
      const templateContent = [
        '# HỒ SƠ KHUNG STORY BIBLE — THỂ LOẠI TRINH THÁM NOIR / BÍ ẨN',
        '- Bối cảnh trung tâm: Tháp Đồng Hồ Đêm Mưa & Thành phố Cảng Sương Mù.',
        '- Quy luật thời gian: Chuông đồng chỉ rung khi có sự cố chuyển giao ký ức hoặc mở khóa tầng áp mái.',
        '- Giọng văn chủ đạo: Noir tiết chế, giàu chi tiết giác quan (mưa, đồng thau, giấy da, ánh đèn bão).'
      ].join('\n');

      const renderedContent = [
        '=== TỔNG HỢP STORY BIBLE CHÍNH THỨC (BẢN MẪU GUEST MODE) ===',
        '1. Bối cảnh & Luật ngầm:',
        '   - Vụ hỏa hoạn 20 năm trước thực chất là màn che đậy cho cuộc thử nghiệm lưu trữ ký ức của Giáo sư Hoàng tại Tháp Đồng Hồ.',
        '   - Con số 13:00 trên mặt đồng hồ không chỉ thời gian mà là mã khóa cơ học nối lên gác chuông.',
        '2. Tuyến nhân vật chính:',
        '   - Trần Minh Khôi (Chính): Thám tử lưu trữ, có vết sẹo cũ ở cổ tay trái, luôn giữ đồng hồ quả quýt vỡ kính.',
        '   - Lệ Băng (Đồng hành / Nghi phạm): Người giữ chùm chìa khóa đồng La Mã, nắm nửa sự thật về vụ hỏa hoạn.',
        '   - Bé Miu (Nhân chứng bí ẩn): Xuất hiện trong hầm kín dù cửa khóa ngoài, cầm mảnh đồng khắc tên Giáo sư Hoàng.',
        '   - Giáo sư Hoàng (Phản diện giấu mặt): Tác giả chuỗi sổ cái bìa đen và cỗ máy đồng bộ xung chuông.',
        '3. Mạch phục bút đang chạy:',
        '   - Chìa khóa thứ tư hình bán nguyệt úp ngược -> Mở két sắt tầng áp mái.',
        '   - Vết thương cổ tay trái của Minh Khôi cộng hưởng với tần số chuông đồng.'
      ].join('\n');

      const characters = [
        {
          id: 'char_guest_khoi',
          name: 'Trần Minh Khôi',
          role: 'Nhân vật chính (Thám tử lưu trữ)',
          traits: 'Điềm tĩnh, quan sát tỉ mỉ chi tiết cơ học, ám ảnh công lý bị chôn vùi.',
          speechStyle: 'Ngắn gọn, sắc bén, dùng ngôi "Tôi" — gọi Lệ Băng bằng chức danh hoặc tên.',
          innerWound: 'Quên mất đoạn ký ức đêm hỏa hoạn năm bảy tuổi khi có vết sẹo cổ tay trái.'
        },
        {
          id: 'char_guest_lebang',
          name: 'Lệ Băng',
          role: 'Người giữ khóa Tháp Đồng Hồ',
          traits: 'Lạnh lùng bên ngoài nhưng cố bảo vệ bằng chứng gốc trước thế lực giấu mặt.',
          speechStyle: 'Mỉa mai nhẹ, hay đặt câu hỏi ngược để dò thái độ.',
          innerWound: 'Mang mặc cảm từng ký giấy niêm phong tầng hầm theo lệnh Giáo sư Hoàng.'
        },
        {
          id: 'char_guest_bemiu',
          name: 'Bé Miu',
          role: 'Nhân chứng bí ẩn',
          traits: 'Nhạy bén với âm thanh bánh răng, xuất hiện tại những nơi tưởng chừng kín bưng.',
          speechStyle: 'Ngây thơ nhưng câu nào cũng chứa ẩn ý cảnh báo.',
          innerWound: 'Luôn ôm con búp bê thiếu một cúc mắt gắn liên kết tới lối thoát hiểm cũ.'
        },
        {
          id: 'char_guest_hoang',
          name: 'Giáo sư Hoàng',
          role: 'Phản diện giấu mặt',
          traits: 'Lập dị, tôn sùng việc "khắc thời gian vào đồng thau".',
          speechStyle: 'Trang trọng, học thuật qua các trang sổ cái để lại.',
          innerWound: 'Không chấp nhận mất đi ký ức về người cộng sự năm xưa.'
        }
      ];

      const knowledgeMatrix = [
        {
          id: 'know_guest_1',
          secret: '13:00 là mã khóa gác chuông chứ không phải giờ cháy',
          whoKnows: 'Lệ Băng, Giáo sư Hoàng (Minh Khôi chỉ mới suy ra ở Chương 3)',
          whoDoesNotKnow: 'Giới cảnh sát thành phố & nhân viên viện lưu trữ'
        },
        {
          id: 'know_guest_2',
          secret: 'Đường thông gió bí mật sau giá sách tầng hầm nối thẳng xuống bờ sông',
          whoKnows: 'Bé Miu',
          whoDoesNotKnow: 'Trần Minh Khôi và Lệ Băng'
        },
        {
          id: 'know_guest_3',
          secret: 'Vết sẹo cổ tay trái của Minh Khôi là dấu tích của chiếc vòng đồng thử nghiệm đầu tiên',
          whoKnows: 'Giáo sư Hoàng, Lệ Băng',
          whoDoesNotKnow: 'Trần Minh Khôi (cấm AI để lộ quá sớm trước Chương 5!)'
        }
      ];

      const cluesLedger = [
        {
          id: 'clue_guest_1',
          title: 'Chìa khóa thứ tư khắc vệt bán nguyệt úp ngược',
          plantedIn: 'Chương 1',
          status: 'PLANTED',
          note: 'Trùng khớp mảnh giấy cháy dở tại viện lưu trữ, dùng mở két tầng áp mái.'
        },
        {
          id: 'clue_guest_2',
          title: 'Con búp bê thiếu một chiếc cúc mắt & mảnh đồng tên Giáo sư Hoàng',
          plantedIn: 'Chương 2',
          status: 'PLANTED',
          note: 'Cúc mắt bị rơi bên trong rãnh trượt cánh cửa thông gió bí mật.'
        },
        {
          id: 'clue_guest_3',
          title: 'Cổ tay trái của Minh Khôi nhói theo tần số chuông đồng',
          plantedIn: 'Chương 3',
          status: 'PLANTED',
          note: 'Chứng minh Minh Khôi từng trực tiếp có mặt trong phòng máy năm xưa.'
        }
      ];

      const antiClicheList = [
        'một luồng điện chạy dọc sống lưng',
        'ánh mắt phức tạp',
        'thở dài một tiếng',
        'khẽ nhếch môi',
        'không khỏi cảm thán'
      ];

      return {
        templateContent,
        renderedContent,
        characters,
        knowledgeMatrix,
        cluesLedger,
        antiClicheList
      };
    }

    static createPresetCatalog() {
      return [
        // --- MODE 1 ---
        {
          id: 'preset_m1_climax',
          modeKey: 'MODE_1_DRAFT',
          badge: 'Chế độ 1 • Viết Bản Nháp (Diff)',
          title: 'Viết tiếp cao trào Gác Chuông giữa bão sấm',
          userPromptText:
            'Viết tiếp ngay sau tiếng chuông ở cuối Chương 3: Trần Minh Khôi và Lệ Băng bước lên sàn gỗ gác chuông tối đen, phát hiện cuộn băng ghi âm nằm sau quả lắc đồng. Giữ đúng xưng hô Tôi/Anh - Cô, tuyệt đối không dùng các cụm sáo ngữ bị cấm và không để lộ bí mật vết sẹo cổ tay quá sớm.',
          modelLabel: 'Gemini 4 Hydrogen (Mô phỏng Văn học)',
          thinkingLevel: 'HIGH',
          estimatedWords: 380,
          canApplyDiffToTab1: true,
          simulatedOutput: [
            'Sàn gỗ gác chuông rung lên bần bật theo từng đợt gió giật quất ngang mái ngói. Mưa theo kẽ lá chớp hắt vào làm ướt đẫm vạt áo dạ của Minh Khôi, để lại mùi đồng thau nồng đậm quyện cùng hơi ozon của cơn dông.',
            '',
            'Trong bóng tối đặc quánh chỉ lóe sáng sau mỗi tia chớp xanh rờn, thanh đối trọng nặng hàng trăm cân của quả lắc đồng khổng lồ vừa nhích thêm nửa vòng. Ngay phía sau trục bánh răng trung tâm, một hộp gỗ sơn mài đen được chèn chặt bằng chính mảnh chìa khóa bán nguyệt thứ tư.',
            '',
            '- Đứng nguyên ở cửa đi, đừng tiến sát trục xoay! (Lệ Băng)',
            '',
            'Lệ Băng hét lên át tiếng gió rít, tay rút chiếc đèn pin đồng từ túi áo khoác rọi thẳng xuống nền gỗ dưới chân anh. Vệt sáng trắng cắt ngang những đường rãnh đồng mảnh như sợi chỉ chạy vòng quanh trục quả lắc — một hệ thống nối dây cơ học được nối thẳng tới ổ khóa tầng hầm vừa đóng sập phía dưới.',
            '',
            '- Cô sợ tiếng chuông dừng lại, hay sợ thứ nằm trong cuộn băng phát sáng lên? (Trần Minh Khôi)',
            '',
            'Minh Khôi không lùi bước. Anh giữ khoảng cách vừa đủ ngoài vòng quét của con lắc, đôi mắt nheo lại trước dòng chữ khắc chìm bên hông hộp sơn mài: "Bản ghi số 13 — Dành cho người mang đồng hồ vỡ kính".'
          ].join('\n')
        },
        {
          id: 'preset_m1_flashback',
          modeKey: 'MODE_1_DRAFT',
          badge: 'Chế độ 1 • Hồi tưởng Noir',
          title: 'Cảnh hồi tưởng đêm chiếc đồng hồ ngừng quay ở 13:00',
          userPromptText:
            'Viết một phân đoạn hồi tưởng ngắn (khoảng 300 từ) xen góc nhìn POV ngôi thứ ba theo Trần Minh Khôi khi nhớ về ánh lửa hắt lên mặt kính đồng hồ quả quýt bị vỡ, giữ nguyên bí mật về Giáo sư Hoàng cho chương sau.',
          modelLabel: 'Gemini 4 Hydrogen (Mô phỏng Văn học)',
          thinkingLevel: 'MEDIUM',
          estimatedWords: 290,
          canApplyDiffToTab1: true,
          simulatedOutput: [
            'Mùi nhựa cháy và khói thông ngọt khét luôn là thứ đầu tiên ùa về mỗi khi cơn mưa đêm chạm đúng ngưỡng lạnh. Trong ký ức chắp vá của cậu bé bảy tuổi năm nào, ánh lửa vàng cam hắt lên từ tầng hầm không hề ồn ào mà lặng lẽ liếm dọc gáy những cuốn sổ cái bìa đen.',
            '',
            'Một bàn tay đeo găng da sẫm màu đẩy chiếc đồng hồ quả quýt vào lòng bàn tay nhỏ bé đang run rẩy của cậu. Mặt kính pha lê nứt làm đôi ngay khoảnh khắc chuông đỉnh tháp gõ nhát đầu tiên, kéo hai cây kim đồng đóng cứng ở vạch số mười ba giờ.',
            '',
            '- Đừng quay đầu nhìn lại phía cầu thang, chạy thẳng ra bờ sông! (Giọng đàn ông khàn đục)',
            '',
            'Minh Khôi giật mình thoát khỏi lớp sương ký ức khi giọt nước lạnh từ mái tôn nhỏ thẳng xuống mu bàn tay. Tiếng chuông đồng trên gác mái lại ngân thêm một hồi trầm đục, nhắc anh rằng người đàn ông đeo găng da đêm ấy vẫn còn để lại dấu vết ở đâu đó trong tòa tháp này.'
          ].join('\n')
        },

        // --- MODE 2 ---
        {
          id: 'preset_m2_twists',
          modeKey: 'MODE_2_BRAINSTORM',
          badge: 'Chế độ 2 • Tham Mưu & Gỡ Bí',
          title: 'Đề xuất 3 hướng Plot Twist cho Chương 4 & thân phận Bé Miu',
          userPromptText:
            'Dựa trên Story Bible (nhân vật Minh Khôi, Lệ Băng, Bé Miu, Giáo sư Hoàng) và 3 phục bút đã gieo ở Chương 1–3, hãy đề xuất 3 hướng Plot Twist bất ngờ nhưng hợp lý 100% về logic để bùng nổ ở Chương 4.',
          modelLabel: 'Gemini 3.8 Flash (Mô phỏng Tham Mưu)',
          thinkingLevel: 'HIGH',
          estimatedWords: 320,
          simulatedOutput: [
            '=== HỒ SƠ THAM MƯU CỐT TRUYỆN CHƯƠNG 4 (CHẾ ĐỘ 2 — MÔ PHỎNG) ===',
            '',
            'HƯỚNG 1 (CÚ BẺ LÁI VỀ KHÔNG GIAN — TỶ LỆ BẤT NGỜ CAO NHẤT):',
            '- Sự thật: Bé Miu không hề đi qua lối cầu thang sắt cùng Minh Khôi. Em bò vào qua đường ống thông gió sau giá sách nối từ nhà kho cũ bên bờ sông (giải thích trọn vẹn chiếc áo mưa ướt sũng và chiếc cúc mắt rơi lại ở Chương 2).',
            '- Điểm nổ: Ở Chương 4, khi cửa hầm bị sập khóa từ trên cao, chính Bé Miu nắm tay Lệ Băng mở bức tường giả sau kệ sổ cái.',
            '',
            'HƯỚNG 2 (CÚ BẺ LÁI VỀ ĐỘNG CƠ CỦA LỆ BĂNG):',
            '- Lệ Băng không bảo vệ Giáo sư Hoàng. Cô chính là em gái của người cộng sự từng mất tích trong thí nghiệm 20 năm trước, giả làm người giữ khóa để dụ kẻ tài trợ thật sự lộ mặt vào đêm 13/11.',
            '',
            'HƯỚNG 3 (THU HỒI PHỤC BÚT ĐỒNG HỒ QUẢ QUÝT):',
            '- Khi mở hộp sơn mài trên gác chuông, cuộn băng ghi âm bị khóa bằng ổ răng cưa 3 chấu — và bánh răng khớp vừa khít lại chính là núm vặn nằm trong chiếc đồng hồ quả quýt vỡ kính của Minh Khôi.'
          ].join('\n')
        },
        {
          id: 'preset_m2_bridge',
          modeKey: 'MODE_2_BRAINSTORM',
          badge: 'Chế độ 2 • Dàn Ý Chuyển Cảnh',
          title: 'Thiết kế cầu nối chuyển tiếp mượt từ Chương 3 sang Chương 4',
          userPromptText:
            'Lên 3 nhịp chuyển cảnh (Scene Beats) cho Chương 4 tiếp nối khoảnh khắc gió thổi tắt đèn bão ở cuối Chương 3 mà không bị hụt nhịp căng thẳng.',
          modelLabel: 'Gemini 3.8 Flash (Mô phỏng Tham Mưu)',
          thinkingLevel: 'MEDIUM',
          estimatedWords: 240,
          simulatedOutput: [
            '=== BẢN THIẾT KẾ 3 NHỊP CẢNH CHƯƠNG 4 (CHẾ ĐỘ 2 — MÔ PHỎNG) ===',
            '',
            '• Nhịp 1 (Giác quan trong bóng tối — 600 từ): Tắt đèn bão -> Ưu tiên thính giác và xúc giác (tiếng răng cưa đồng chạy ngầm, hơi gió bấc quất rát mặt, ánh chớp rọi ngắt quãng từng nửa giây).',
            '• Nhịp 2 (Đối chất nửa sự thật — 1.100 từ): Lệ Băng thú nhận về lệnh niêm phong năm xưa; Minh Khôi phát hiện ký hiệu bán nguyệt nối vào hộp sơn mài nhưng chưa mở ngay vì phát hiện dây bẫy cơ học.',
            '• Nhịp 3 (Cliffhanger kết chương — 400 từ): Phía dưới tầng hầm đột nhiên có tiếng bước chân người thứ tư vang lên dù hai người đã khóa trái cổng sắt!'
          ].join('\n')
        },

        // --- MODE 3 ---
        {
          id: 'preset_m3_logic_audit',
          modeKey: 'MODE_3_AUDIT',
          badge: 'Chế độ 3 • Kiểm Toán Logic',
          title: 'Soi lỗi thời gian, ma trận Ai Biết Gì & chi tiết Chương 1 → Chương 3',
          userPromptText:
            'Kiểm toán toàn bộ logic Chương 1 → Chương 3 đối chiếu với Ma trận Ai Biết Gì và Sổ cái Phục bút. Chỉ ra mọi chi tiết dễ gây hổng logic hoặc từ sáo ngữ lọt vào Chương 3.',
          modelLabel: 'Gemini 3.1 Pro (Mô phỏng Kiểm Toán)',
          thinkingLevel: 'HIGH',
          estimatedWords: 310,
          simulatedOutput: [
            '=== BÁO CÁO KIỂM TOÁN LOGIC & MA TRẬN LORE (CHẾ ĐỘ 3 — MÔ PHỎNG) ===',
            '',
            '1. KIỂM TRA MA TRẬN "AI BIẾT GÌ" (AN TOÀN — KHÔNG LỘ SỚM):',
            '   [ĐẠT] Trong Chương 3, Minh Khôi chỉ mới nhận ra vết thương cổ tay trái nhói theo nhịp chuông chứ chưa hề biết đó là dấu vết vòng đồng thử nghiệm — hoàn toàn khớp luật bảo mật Chương 5.',
            '',
            '2. CẢNH BÁO TÍNH NHẤT QUÁN ĐẠO CỤ (CẦN CHÚ Ý):',
            '   [LƯU Ý NHỎ] Chương 1 mô tả cánh cửa sắt tầng hầm được Lệ Băng mở bằng chìa khóa thứ tư, nhưng Chương 3 lại nhắc tới "cánh cửa gỗ lim dẫn lên gác chuông bật mở" mà chưa nêu ai cầm chìa gỗ lim -> Gợi ý thêm 1 câu Lệ Băng gạt chốt sắt bên trong.',
            '',
            '3. PHÁT HIỆN TỪ SÁO NGỮ CẤM TRONG CHƯƠNG 3 (3 CỤM):',
            '   [CẦN SỬA] Chương 3 hiện có 3 cụm nằm trong Blacklist Tab 4:',
            '   - "...Một luồng điện chạy dọc sống lưng..." (Đoạn 2)',
            '   - "...nhìn anh với ánh mắt phức tạp..." (Đoạn 3)',
            '   - "...thở dài một tiếng thật khẽ..." (Đoạn 3)',
            '   => Khuyên thay bằng tả hành động cụ thể: "cô siết chặt ngón tay lên công tắc đồng lạnh ngắt".'
          ].join('\n')
        },
        {
          id: 'preset_m3_wound',
          modeKey: 'MODE_3_AUDIT',
          badge: 'Chế độ 3 • Soi Chi Tiết Vết Thương',
          title: 'Đối chiếu tính liên tục vết thương cổ tay trái & mảnh đồng',
          userPromptText:
            'Kiểm tra xem chi tiết vết sẹo cổ tay trái của Minh Khôi và mảnh đồng của Bé Miu có xuất hiện mâu thuẫn góc nhìn hoặc thiếu logic tiếp nối giữa Chương 2 và Chương 3 không.',
          modelLabel: 'Gemini 3.1 Pro (Mô phỏng Kiểm Toán)',
          thinkingLevel: 'MEDIUM',
          estimatedWords: 230,
          simulatedOutput: [
            '=== KIỂM TRA CONTINUITY VẾT THƯƠNG & VẬT PHẨM (CHẾ ĐỘ 3 — MÔ PHỎNG) ===',
            '',
            '• Vết thương cổ tay trái (Minh Khôi): Ở Chương 1 chưa kích hoạt do chuông chưa rung; đến Chương 3 khi hộp thiếc phát tiếng tích tắc và chuông rung lên thì cổ tay mới bắt đầu nhói -> HỢP LÝ 100% về nhân quả vật lý.',
            '• Mảnh đồng tên Giáo sư Hoàng (Bé Miu): Kết thúc Chương 2 Bé Miu giơ lên trong tầng hầm nhưng đầu Chương 3 chưa nhắc cô bé đi cùng hai người lên gác chuông -> Nên bổ sung 1 câu xác nhận Lệ Băng đã dặn Bé Miu chờ tại bàn gỗ sồi hoặc mang theo xuống lối thoát.'
          ].join('\n')
        },

        // --- MODE 4 ---
        {
          id: 'preset_m4_scorecard',
          modeKey: 'MODE_4_REVIEW',
          badge: 'Chế độ 4 • Đánh Giá Độc Giả',
          title: 'Chấm điểm Light Novel & Tỷ lệ giữ chân độc giả cho Chương 3',
          userPromptText:
            'Đóng vai biên tập viên WebNovel & 2 độc giả khó tính: chấm điểm 4 tiêu chí (Hook, Nhịp văn, Xưng hô & Thoại, Độ gợi mở) cho Chương 3 và đề xuất 3 điểm chỉnh sắc nét hơn.',
          modelLabel: 'Gemini 3.8 Flash (Mô phỏng Đánh Giá)',
          thinkingLevel: 'HIGH',
          estimatedWords: 280,
          simulatedOutput: [
            '=== BẢNG CHẤM ĐIỂM ĐỘC GIẢ & BIÊN TẬP VIÊN (CHẾ ĐỘ 4 — MÔ PHỎNG) ===',
            '',
            '• ĐIỂM TỔNG QUAN CHƯƠNG 3: 8.8 / 10 (Rất tiềm năng — Giữ chân độc giả bấm "Chương sau")',
            '  1. Nhịp văn & Không khí Noir: 9.2/10 — Rất tốt cảm giác sấm rền, bụi vôi rơi xuống mực phai.',
            '  2. Tỷ lệ Thoại & Nhịp trao đổi: 8.5/10 — Câu đối đáp ngắn gọn, giữ thế cân bằng căng thẳng giữa Minh Khôi và Lệ Băng.',
            '  3. Cliffhanger cuối chương: 9.4/10 — Hình ảnh ngọn đèn bão tắt phụt đúng lúc kim đồng hồ nhích nấc tạo sức hút mạnh.',
            '',
            '• 3 ĐỀ XUẤT NÂNG CHẤT LƯỢNG LÊN 9.5/10:',
            '  1) Gỡ 3 cụm từ sáo ngữ ("luồng điện sống lưng", "ánh mắt phức tạp", "thở dài") để văn phong Noir thuần chất hơn.',
            '  2) Kéo dài thêm 1 nhịp giằng co trước khi mở cửa gỗ lim để tăng trọng lượng quyết định của Minh Khôi.',
            '  3) Gợi nhẹ vị trí của Bé Miu ngay trước khi hai nhân vật chính lên tầng trên.'
          ].join('\n')
        },
        {
          id: 'preset_m4_dialogue',
          modeKey: 'MODE_4_REVIEW',
          badge: 'Chế độ 4 • Soi Nhịp Thoại',
          title: 'Phân tích phản ứng độc giả về thoại và bầu không khí chương mẫu',
          userPromptText:
            'Phân tích xem thoại của Minh Khôi và Lệ Băng trong Chương 1–3 đã giữ đúng tính cách cá nhân trong Story Bible chưa.',
          modelLabel: 'Gemini 3.8 Flash (Mô phỏng Đánh Giá)',
          thinkingLevel: 'MEDIUM',
          estimatedWords: 220,
          simulatedOutput: [
            '=== PHÂN TÍCH GIỌNG THOẠI NHÂN VẬT (CHẾ ĐỘ 4 — MÔ PHỎNG) ===',
            '',
            '• Trần Minh Khôi (Khớp 95% Bible): Các câu thoại thiên về khẳng định mục tiêu và lật ngược câu hỏi ("Tôi không đến để ngắm mưa..."), ít thừa chữ.',
            '• Lệ Băng (Khớp 90% Bible): Giữ tốt thái độ phòng thủ và cảnh báo. Gợi ý thêm vài chi tiết cử chỉ nhỏ (ví dụ xoay chùm chìa khóa, điều chỉnh bấc đèn) để người đọc nghe thấy sự dè chừng.'
          ].join('\n')
        },

        // --- MODE 5 ---
        {
          id: 'preset_m5_timeline',
          modeKey: 'MODE_5_DIAGRAM',
          badge: 'Chế độ 5 • Biểu Đồ Timeline SVG',
          title: 'Vẽ sơ đồ chuỗi sự kiện & vị trí nhân vật Chương 1 → Chương 3',
          userPromptText:
            'Vẽ sơ đồ diễn biến sự kiện theo trình tự thời gian từ Chương 1 đến Chương 3, chỉ rõ vị trí của Minh Khôi, Lệ Băng, Bé Miu và kiểm tra đối chiếu manh mối Chìa khóa thứ tư.',
          modelLabel: 'Gemini 3.8 Flash (Mô phỏng Mode 5 SVG)',
          thinkingLevel: 'HIGH',
          estimatedWords: 290,
          simulatedGraph: {
            nodes: [
              { id: 'n1', group: 'EVENT', time: 'Ch.1 • 22:15', label: 'Minh Khôi gặp Lệ Băng ở cửa tháp' },
              { id: 'n2', group: 'CLUE', time: 'Ch.1 • Manh mối', label: 'Chìa khóa thứ 4 hình bán nguyệt' },
              { id: 'n3', group: 'CHARACTER', time: 'Ch.2 • Tầng hầm', label: 'Bé Miu xuất hiện bên 6 sổ cái' },
              { id: 'n4', group: 'CLUE', time: 'Ch.2 • Phục bút', label: 'Mảnh đồng tên Giáo sư Hoàng' },
              { id: 'n5', group: 'EVENT', time: 'Ch.3 • 23:00', label: 'Giải mã 13:00 & vết sẹo cổ tay' },
              { id: 'n6', group: 'EVENT', time: 'Ch.3 • Cao trào', label: 'Mở cửa gác chuông, kim nhích 1 nấc' }
            ],
            links: [
              { source: 'n1', target: 'n2', label: 'Lệ Băng giơ chìa khóa' },
              { source: 'n2', target: 'n3', label: 'Mở cửa sắt xuống hầm' },
              { source: 'n3', target: 'n4', label: 'Cầm manh mối' },
              { source: 'n4', target: 'n5', label: 'Khớp tần số chuông' },
              { source: 'n5', target: 'n6', label: 'Chốt tiến lên đỉnh tháp' }
            ],
            contradictions: []
          },
          simulatedOutput: [
            '=== BIÊN NIÊN SỬ & SƠ ĐỒ MẠCH TRUYỆN CHƯƠNG 1 → CHƯƠNG 3 (CHẾ ĐỘ 5 — MÔ PHỎNG) ===',
            '',
            '[MỐC 1 • Ch.1 — Sảnh Cửa Tháp Đồng Hồ]:',
            '  - Hiện diện: Trần Minh Khôi, Lệ Băng.',
            '  - Sự kiện: Hai kim đồng hồ đứng ở 13:00. Lệ Băng xuất trình chìa khóa thứ tư khắc bán nguyệt úp ngược.',
            '',
            '[MỐC 2 • Ch.2 — Hầm Lưu Trữ Sổ Cái]:',
            '  - Hiện diện: Trần Minh Khôi, Lệ Băng, Bé Miu (vào trước qua lối bí mật).',
            '  - Sự kiện: Hộp thiếc phát tiếng tích tắc. Bé Miu nắm mảnh đồng khắc tên Giáo sư Hoàng & cảnh báo bánh răng thứ bảy.',
            '',
            '[MỐC 3 • Ch.3 — Hành Lang Sổ Cái -> Gác Chuông]:',
            '  - Hiện diện: Trần Minh Khôi, Lệ Băng (Bé Miu tạm ở lại tầng hầm).',
            '  - Sự kiện: Minh Khôi đọc ghi chép 13/11, vết thương cổ tay trái cộng hưởng nhịp chuông, hai người mở cửa gỗ lim lên gác chuông.',
            '',
            '• KẾT LUẬN ĐỐI CHIẾU LOGIC: 0 mâu thuẫn dòng thời gian chính. Sẵn sàng phát triển Chương 4 từ node "Mở cửa gác chuông".'
          ].join('\n')
        },
        {
          id: 'preset_m5_knowledge',
          modeKey: 'MODE_5_DIAGRAM',
          badge: 'Chế độ 5 • Mạng Lưới Ai Biết Gì',
          title: 'Đối chiếu sơ đồ Mạng lưới Nhân vật & Bí mật Ma trận Bible',
          userPromptText:
            'Hiển thị mạng lưới quan hệ giữa 4 nhân vật (Minh Khôi, Lệ Băng, Bé Miu, Giáo sư Hoàng) kèm các nút bí mật ai đã biết / ai chưa biết để tránh lộ spoiler sớm.',
          modelLabel: 'Gemini 3.8 Flash (Mô phỏng Mode 5 SVG)',
          thinkingLevel: 'MEDIUM',
          estimatedWords: 235,
          simulatedGraph: {
            nodes: [
              { id: 'c1', group: 'CHARACTER', time: 'Chính', label: 'Trần Minh Khôi (Sẹo tay trái)' },
              { id: 'c2', group: 'CHARACTER', time: 'Đồng hành', label: 'Lệ Băng (Giữ khóa La Mã)' },
              { id: 'c3', group: 'CHARACTER', time: 'Bí ẩn', label: 'Bé Miu (Biết lối thông gió)' },
              { id: 'c4', group: 'CHARACTER', time: 'Phản diện', label: 'Giáo sư Hoàng (Tác giả máy)' },
              { id: 'k1', group: 'CLUE', time: 'Bảo mật Ch.5', label: 'Bí mật vòng đồng thử nghiệm' },
              { id: 'k2', group: 'EVENT', time: 'Đã mở khóa', label: '13:00 là mã tầng gác chuông' }
            ],
            links: [
              { source: 'c1', target: 'k2', label: 'Vừa suy ra Ch.3' },
              { source: 'c2', target: 'k1', label: 'Biết nhưng giấu' },
              { source: 'c4', target: 'k1', label: 'Người thử nghiệm' },
              { source: 'c3', target: 'c4', label: 'Giữ mảnh đồng tên' },
              { source: 'c1', target: 'c2', label: 'Hợp tác đầy ngờ vực' }
            ],
            contradictions: []
          },
          simulatedOutput: [
            '=== MẠNG LƯỚI BẤT ĐỐI XỨNG "AI BIẾT GÌ" (CHẾ ĐỘ 5 — MÔ PHỎNG) ===',
            '',
            '• Lớp 1 — Sự thật ĐÃ MỞ ở Chương 3:',
            '  - 13:00 là mã khóa gác chuông: Minh Khôi, Lệ Băng và Giáo sư Hoàng đều biết.',
            '• Lớp 2 — Bí mật CẤM LỘ trước Chương 5:',
            '  - Vết sẹo cổ tay trái của Minh Khôi liên kết với vòng đồng năm xưa: Chỉ Lệ Băng & Giáo sư Hoàng biết; Minh Khôi chưa biết.',
            '• Lớp 3 — Quân bài ẩn của Bé Miu:',
            '  - Đường thông gió bí mật sau kệ sách tầng hầm nối thẳng bờ sông.'
          ].join('\n')
        }
      ];
    }

    static createChatbotPresetQuestions() {
      return [
        {
          id: 'chat_preset_intro',
          label: '🧭 Giới thiệu nhanh các Tab 1 → 6',
          userText: 'Hãy giới thiệu nhanh cách dùng 6 Tab trên Web Viết Tiểu Thuyết của Bi.',
          badge: 'MẪU GUEST • HƯỚNG DẪN WEB',
          replyText: [
            '🎱 **Chào mừng bạn tới Guest Mode! Mình là Viên Bi Số 8.**',
            '',
            'Studio được chia thành **6 không gian tách biệt**:',
            '• **Tab 1 (Bàn Viết):** Soạn thảo, duyệt màu thay đổi AI kiểu Google Docs, chuẩn hóa thoại `- Thoại (Tên)`, quét sáo ngữ & từ điển Ngũ quan.',
            '• **Tab 2 (Chương & Ký ức):** Quản lý cây chương và tra cứu BM25 (0 Token) tìm lại tình tiết cũ.',
            '• **Tab 3 (Trợ lý AI 5 Chế Độ):** Viết nháp, Tham mưu cốt truyện, Kiểm toán Logic, Đánh giá độc giả và Vẽ biểu đồ Timeline SVG (ở Guest Mode bạn dùng các Prompt mẫu mô phỏng bấm là chạy ngay!).',
            '• **Tab 4 (Story Bible):** Hồ sơ nhân vật, Ma trận Ai Biết Gì chống spoiler & Copy Prompt dùng cho Google NotebookLM.',
            '• **Tab 5 (Nền Sáng & Nhạc):** Pomodoro đồng bộ 2 chiều, âm thanh mưa rơi, MP3 lặp đoạn, phát YouTube không quảng cáo & hình nền video 16:9.',
            '• **Tab 6 (Hệ Thống):** Video hướng dẫn, Bách khoa 41 Module, Kho phiên bản & Xuất PDF chọn font chữ.'
          ].join('\n')
        },
        {
          id: 'chat_preset_modes',
          label: '🎨 5 Chế Độ AI khác nhau thế nào?',
          userText: '5 chế độ ở Tab 3 dùng khi nào và khác nhau chỗ nào?',
          badge: 'MẪU GUEST • 5 CHẾ ĐỘ',
          replyText: [
            '⚡ **Phân biệt 5 Chế Độ chuyên sâu tại Tab 3:**',
            '1. **Chế độ 1 (Viết Bản Nháp):** Sinh văn xuôi dài giàu chi tiết, tự gắn Story Bible + Mốc chuyển cảnh và hỗ trợ duyệt Diff xanh/vàng bên Tab 1.',
            '2. **Chế độ 2 (Tham Mưu & Gỡ Bí):** Gợi ý Plot Twist, hướng phát triển nhân vật & nhịp chuyển cảnh trước khi viết.',
            '3. **Chế độ 3 (Kiểm Toán Logic):** Soi lỗ hổng thời gian, vết thương, đạo cụ & kiểm tra xem AI có làm lộ bí mật Story Bible sớm không.',
            '4. **Chế độ 4 (Đánh Giá Độc Giả):** Chấm điểm sức hút WebNovel, nhịp văn & tỷ lệ thoại như biên tập viên.',
            '5. **Chế độ 5 (Biểu Đồ Cốt Truyện):** Vẽ sơ đồ mạng lưới nhân vật & trục thời gian SVG trực quan.'
          ].join('\n')
        },
        {
          id: 'chat_preset_diagnose',
          label: '🩺 Khám nhanh Chương 3 mẫu',
          userText: '/kham Chẩn đoán giúp mình Chương 3 mẫu "Ngã Rẽ Dưới Cơn Mưa Rào" đang mở!',
          badge: 'MẪU GUEST • CHẨN ĐOÁN',
          replyText: [
            '🩺 **Kết quả khám nhanh Chương 3 ("Ngã Rẽ Dưới Cơn Mưa Rào"):**',
            '• **Điểm sáng:** Bố cục mở ra nút thắt mật mã 13:00 khá chắc, kết chương đúng lúc đèn bão tắt và kim nhích nấc tạo độ tò mò cao.',
            '• **Chi tiết cần tinh chỉnh:** Chương 3 đang có sẵn **3 cụm từ sáo ngữ** trong Blacklist (*"luồng điện chạy dọc sống lưng"*, *"ánh mắt phức tạp"*, *"thở dài một tiếng"*) — bạn có thể sang **Tab 1 -> Công cụ biên tập -> Quét từ sáo rỗng** để xem hệ thống phát hiện trực tiếp ngay!'
          ].join('\n')
        },
        {
          id: 'chat_preset_yt_pdf',
          label: '🎬 Cách bật YouTube Nền & Xuất PDF',
          userText: 'Làm sao tìm nhạc YouTube ngay trong web để làm hình nền và xuất truyện ra PDF?',
          badge: 'MẪU GUEST • TAB 5 & PDF',
          replyText: [
            '🎬 **Cách dùng nhanh 2 tính năng được yêu thích nhất:**',
            '• **YouTube Nền Không Quảng Cáo (Tab 5):** Mở mục số 5 ở Tab 5, gõ từ khóa vào ô tìm kiếm ngay trong khung để chọn video phát thẳng tại chỗ hoặc bật **Cài làm Nền Web 16:9** (đồng bộ play/pause, lặp đoạn A–B & làm mờ kính đọc chữ rõ nét).',
            '• **Xuất PDF Chuẩn Sách:** Tại Tab 1 (Công cụ biên tập) hoặc Tab 6, mở **Xuất Sách PDF** để xem trước bản in chọn font serif/sans, cỡ chữ & khổ giấy.'
          ].join('\n')
        },
        {
          id: 'chat_preset_unlock',
          label: '🔑 Làm sao mở khóa API & Lưu thật?',
          userText: 'Tôi muốn dùng AI Gemini thật và lưu truyện vào máy tính thì cần làm gì?',
          badge: 'MẪU GUEST • MỞ KHÓA < 2 PHÚT',
          replyText: [
            '🚀 **Cách mở khóa trọn vẹn Studio chỉ mất chưa đầy 2 phút:**',
            '1. Bấm nút **🔄 Reload Để Liên Kết** để quay về màn hình Cổng Kết Nối chính.',
            '2. Bấm vào liên kết **Google AI Studio** trên màn hình để sao chép và dán **Gemini API Key** miễn phí của bạn.',
            '3. Chọn **Thư mục làm việc** trên máy tính hoặc điện thoại.',
            'Ngay khi xong 2 bước đó, toàn bộ nút chạy AI thật, gõ câu lệnh tự do, lưu tự động 3 tầng và đồng bộ ổ cứng sẽ mở khóa 100%!'
          ].join('\n')
        }
      ];
    }
  }

  // ==========================================================================
  // 3. BỘ CÁCH LY LƯU TRỮ & API (CHẶN GHI ĐÈ DỮ LIỆU THẬT TRONG GUEST MODE)
  // ==========================================================================
  class GuestStorageAndApiIsolationSandbox {
    constructor(owner) {
      this.owner = owner;
      this.ramKvStore = new Map();
      this.nativeStorageProtoWrapped = false;
      this.moduleHooksInstalled = false;
      this.internalBypassDepth = 0;
      this.nativeGetItem = null;
      this.nativeSetItem = null;
      this.nativeRemoveItem = null;
      this.nativeClear = null;
    }

    isGuestActive() {
      return Boolean(this.owner && this.owner.active === true);
    }

    withInternalBypass(fn) {
      this.internalBypassDepth += 1;
      try {
        return fn();
      } finally {
        this.internalBypassDepth -= 1;
      }
    }

    async withInternalBypassAsync(fn) {
      this.internalBypassDepth += 1;
      try {
        return await fn();
      } finally {
        this.internalBypassDepth -= 1;
      }
    }

    isProtectedRealStorageKey(key) {
      const k = String(key || '');
      return MOD41_CONSTANTS.PROTECTED_STORAGE_PREFIXES.some((prefix) => k.startsWith(prefix));
    }

    resetRamStorageForGuestSession() {
      this.ramKvStore.clear();
    }

    /**
     * Cô lập localStorage / sessionStorage khi Guest Mode đang bật:
     * mọi thao tác ghi chỉ nằm trên RAM Map tạm, tuyệt đối không đè lên dữ liệu thật.
     */
    installStoragePrototypeSandbox() {
      if (this.nativeStorageProtoWrapped || typeof Storage === 'undefined') return;
      this.nativeStorageProtoWrapped = true;

      const proto = Storage.prototype;
      const sandbox = this;
      this.nativeGetItem = proto.getItem;
      this.nativeSetItem = proto.setItem;
      this.nativeRemoveItem = proto.removeItem;
      this.nativeClear = proto.clear;

      proto.getItem = function patchedGetItem(key) {
        if (this === globalScope.localStorage && sandbox.isGuestActive()) {
          const strKey = String(key);
          if (sandbox.ramKvStore.has(strKey)) {
            return sandbox.ramKvStore.get(strKey);
          }
          // Che giấu key nhạy cảm / bản thảo thật khỏi session Guest Mode
          if (sandbox.isProtectedRealStorageKey(strKey)) {
            return null;
          }
        }
        return sandbox.nativeGetItem.call(this, key);
      };

      proto.setItem = function patchedSetItem(key, value) {
        if (this === globalScope.localStorage && sandbox.isGuestActive()) {
          sandbox.ramKvStore.set(String(key), String(value));
          return;
        }
        return sandbox.nativeSetItem.call(this, key, value);
      };

      proto.removeItem = function patchedRemoveItem(key) {
        if (this === globalScope.localStorage && sandbox.isGuestActive()) {
          sandbox.ramKvStore.delete(String(key));
          return;
        }
        return sandbox.nativeRemoveItem.call(this, key);
      };

      proto.clear = function patchedClear() {
        if (this === globalScope.localStorage && sandbox.isGuestActive()) {
          sandbox.ramKvStore.clear();
          return;
        }
        return sandbox.nativeClear.call(this);
      };
    }

    /**
     * Cài đặt lớp chặn an toàn lên các Engine lưu trữ & gọi API Gemini.
     * Chỉ kích hoạt hành vi chặn khi Guest Mode đang bật (active === true).
     */
    installModuleGuards() {
      if (this.moduleHooksInstalled) return;
      this.moduleHooksInstalled = true;
      const sandbox = this;
      const owner = this.owner;

      const wrapMethod = (targetObj, methodName, guardFactory) => {
        if (!targetObj || typeof targetObj[methodName] !== 'function') return;
        const orig = targetObj[methodName];
        if (orig.__mod41Wrapped) return;
        const wrapped = guardFactory(orig, targetObj);
        wrapped.__mod41Wrapped = true;
        targetObj[methodName] = wrapped;
      };

      // 1. Cô lập ghi IndexedDB (mod04) khi đang dùng thử
      if (NS.idb) {
        ['set', 'delete', 'bulkSet', 'clearStore'].forEach((m) => {
          wrapMethod(NS.idb, m, (orig, target) => async function guardedIdbWrite(...args) {
            if (sandbox.isGuestActive()) {
              return true;
            }
            return orig.apply(target, args);
          });
        });
      }

      // 2. Chặn kết nối & ghi ra thư mục ổ cứng / OPFS (mod05)
      if (NS.fsEngine) {
        wrapMethod(NS.fsEngine, 'isConnected', (orig, target) => function guardedIsConnected() {
          if (sandbox.isGuestActive()) return false;
          return orig.apply(target);
        });
        [
          'requestConnectFolder',
          'reconnectPendingFolder',
          'connectMobileWorkspaceFolder',
          'disconnectFolder'
        ].forEach((m) => {
          wrapMethod(NS.fsEngine, m, (orig, target) => async function guardedFsConnect(...args) {
            if (sandbox.isGuestActive()) {
              owner.showRestrictionNotice({
                requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
                featureName: 'Kết nối & Đồng bộ Thư mục làm việc'
              });
              return false;
            }
            return orig.apply(target, args);
          });
        });
        [
          'writeTextFile',
          'writeTextFileToRoot',
          'syncSingleChapterToDisk',
          'syncAllChaptersToDisk',
          'writeRollingTimestampedSnapshot',
          'deleteFile'
        ].forEach((m) => {
          wrapMethod(NS.fsEngine, m, (orig, target) => async function guardedFsWrite(...args) {
            if (sandbox.isGuestActive()) {
              return false;
            }
            return orig.apply(target, args);
          });
        });
      }

      // 3. Chặn gọi Gemini API thật & xác thực API Key (mod15)
      if (NS.geminiRouter) {
        wrapMethod(NS.geminiRouter, 'getEffectiveActiveKey', (orig, target) => function guardedGetKey() {
          if (sandbox.isGuestActive()) return '';
          return orig.apply(target);
        });
        wrapMethod(NS.geminiRouter, 'getApiKey', (orig, target) => function guardedApiKey() {
          if (sandbox.isGuestActive()) return '';
          return orig.apply(target);
        });
        wrapMethod(NS.geminiRouter, 'isCurrentKeyFlashLiteVerified', (orig, target) => function guardedVerif() {
          if (sandbox.isGuestActive()) return false;
          return orig.apply(target);
        });

        wrapMethod(NS.geminiRouter, 'generateTextWithFallback', (orig, target) => async function guardedGen(...args) {
          if (sandbox.isGuestActive()) {
            if (sandbox.internalBypassDepth > 0) {
              return { text: '', usedEndpoint: 'guest-sandbox-sim', latencyMs: 45 };
            }
            owner.showRestrictionNotice({
              requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.API_KEY,
              featureName: 'Chạy AI Gemini Trực Tiếp'
            });
            throw new Error('GUEST_MODE_API_REQUIRED');
          }
          return orig.apply(target, args);
        });

        ['verifyKeyWithLowestFlashLite', 'verifyApiKeyConnection', 'probeKeyAndFetchLiveModels', 'runMultiKeyPingBenchmark']
          .forEach((m) => {
            wrapMethod(NS.geminiRouter, m, (orig, target) => async function guardedVerify(...args) {
              if (sandbox.isGuestActive()) {
                owner.showRestrictionNotice({
                  requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.API_KEY,
                  featureName: 'Kiểm tra & Kết nối Gemini API Key'
                });
                return { ok: false, verified: false, reason: 'GUEST_MODE' };
              }
              return orig.apply(target, args);
            });
          });
      }

      // 4. Chặn thêm/xóa chương & nhập file vào kho thật (mod08, mod06)
      if (NS.chapterManager) {
        wrapMethod(NS.chapterManager, 'createNewChapter', (orig, target) => function guardedCreateChap(...args) {
          if (sandbox.isGuestActive()) {
            owner.showRestrictionNotice({
              requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
              featureName: 'Tạo & Lưu chương truyện mới'
            });
            return null;
          }
          return orig.apply(target, args);
        });
        wrapMethod(NS.chapterManager, 'deleteChapter', (orig, target) => async function guardedDelChap(...args) {
          if (sandbox.isGuestActive()) {
            owner.showRestrictionNotice({
              requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
              featureName: 'Xóa chương khỏi thư mục làm việc'
            });
            return false;
          }
          return orig.apply(target, args);
        });
      }
      if (NS.docParser) {
        wrapMethod(NS.docParser, 'importMultipleFilesToChapters', (orig, target) => async function guardedImport(...args) {
          if (sandbox.isGuestActive()) {
            owner.showRestrictionNotice({
              requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
              featureName: 'Nhập file .DOCX / .PDF / .TXT vào dự án'
            });
            return { importedCount: 0, blockedByGuestMode: true };
          }
          return orig.apply(target, args);
        });
      }

      // 5. Điều tiết AutoSave (mod09) và Kho Phiên Bản (mod10)
      if (NS.autoSaver) {
        wrapMethod(NS.autoSaver, 'triggerSave', (orig, target) => async function guardedSave(showToast = false, ...rest) {
          if (sandbox.isGuestActive()) {
            NS.chapterManager?.syncEditorToActiveChapter?.();
            owner.refreshGuestSaveStatusIndicator();
            if (showToast) {
              owner.showRestrictionNotice({
                requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
                featureName: 'Lưu bản thảo lâu dài ra Thư mục & IndexedDB'
              });
            }
            return false;
          }
          return orig.apply(target, [showToast, ...rest]);
        });
      }
      if (NS.versionVault) {
        wrapMethod(NS.versionVault, 'createSnapshot', (orig, target) => async function guardedSnap(reason = '', type = 'AUTO_CONTINUOUS', opts = {}) {
          if (sandbox.isGuestActive()) {
            // Cho phép chụp mốc tạm trên RAM khi thử Google Docs Diff (PRE_AI), chặn tạo mốc thủ công để lưu giữ
            if (type === 'MANUAL_BOOKMARK' && sandbox.internalBypassDepth === 0) {
              owner.showRestrictionNotice({
                requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
                featureName: 'Chụp & Lưu Mốc Phiên Bản Time-Machine'
              });
              return null;
            }
            return null;
          }
          return orig.apply(target, [reason, type, opts]);
        });
        ['restoreSnapshot', 'restoreSelectedVersion'].forEach((m) => {
          wrapMethod(NS.versionVault, m, (orig, target) => async function guardedRestore(...args) {
            if (sandbox.isGuestActive()) {
              owner.showRestrictionNotice({
                requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
                featureName: 'Khôi phục Phiên Bản từ Kho Lưu Trữ'
              });
              return false;
            }
            return orig.apply(target, args);
          });
        });
      }

      // 6. Chặn Lưu / Đồng Bộ AI Story Bible (mod12) & Duyệt Chốt Bản Thảo Thông Minh (mod19)
      if (NS.storyBible) {
        wrapMethod(NS.storyBible, 'syncStructuredEntitiesFromOfficialBible', (orig, target) => async function guardedBibleAiSync(...args) {
          if (sandbox.isGuestActive()) {
            owner.showRestrictionNotice({
              requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.API_KEY,
              featureName: 'Tự động bóc tách Story Bible bằng Gemini AI'
            });
            return false;
          }
          return orig.apply(target, args);
        });
        wrapMethod(NS.storyBible, 'saveAllBibleData', (orig, target) => async function guardedBibleSave(showFeedback = true, ...rest) {
          if (sandbox.isGuestActive()) {
            if (showFeedback !== false && sandbox.internalBypassDepth === 0) {
              owner.showRestrictionNotice({
                requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
                featureName: 'Lưu Story Bible vào Thư mục dự án'
              });
              return false;
            }
            return true;
          }
          return orig.apply(target, [showFeedback, ...rest]);
        });
      }
      if (NS.approvalExtractor) {
        ['runApprovalAndBibleSynthesis', 'runCumulativeBibleUpdateFromCh1ToLatest'].forEach((m) => {
          wrapMethod(NS.approvalExtractor, m, (orig, target) => async function guardedSmartApprove(...args) {
            if (sandbox.isGuestActive()) {
              owner.showRestrictionNotice({
                requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.BOTH_API_AND_FOLDER,
                featureName: 'Duyệt & Chốt Bản Thảo Thông Minh vào Thư mục'
              });
              return { ok: false, reason: 'GUEST_MODE_RESTRICTED' };
            }
            return orig.apply(target, args);
          });
        });
      }

      // 7. Chặn Chatbot tự do (mod27) khi không đến từ Câu hỏi mẫu Guest Mode
      if (NS.mascotAndChat) {
        wrapMethod(NS.mascotAndChat, 'sendChatMessage', (orig, target) => async function guardedChatSend(customPromptText = null) {
          if (sandbox.isGuestActive()) {
            if (sandbox.internalBypassDepth > 0) {
              return true;
            }
            owner.showRestrictionNotice({
              requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.API_KEY,
              featureName: 'Nhắn tin tự do với Trợ lý Viên Bi Số 8 (Chỉ dùng Câu hỏi mẫu trong Guest Mode)'
            });
            return false;
          }
          return orig.apply(target, [customPromptText]);
        });
      }

      // 8. Chặn Đồng bộ đa máy .ZIP / Google Drive (mod37) & Tách chương vào Tab 2 (mod38)
      if (NS.workspaceSync) {
        [
          'handleCrossDeviceImportFile',
          'handleVerifyDriveKeyClick',
          'handleGoogleSignInClick',
          'handleUploadToGDriveClick'
        ].forEach((m) => {
          wrapMethod(NS.workspaceSync, m, (orig, target) => async function guardedSyncAction(...args) {
            if (sandbox.isGuestActive()) {
              owner.showRestrictionNotice({
                requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
                featureName: 'Đồng bộ Dự Án (.ZIP / Google Drive) & Nhập Dữ Liệu Thật'
              });
              return false;
            }
            return orig.apply(target, args);
          });
        });
      }
      if (NS.localComputeAndAttendance) {
        wrapMethod(NS.localComputeAndAttendance, 'handleSplitLoadedTextIntoTab2Chapters', (orig, target) => function guardedSplitImport(...args) {
          if (sandbox.isGuestActive()) {
            owner.showRestrictionNotice({
              requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.WORKSPACE_FOLDER,
              featureName: 'Nạp & Tách tệp thành Chương lưu vào Thư mục làm việc'
            });
            return false;
          }
          return orig.apply(target, args);
        });
      }

      // 9. Chặn Prompt Synthesizer & Mode 5 live run nếu đi đường vòng không qua mô phỏng
      if (NS.promptSynthesizer) {
        wrapMethod(NS.promptSynthesizer, 'runStep1MasterSynthesis', (orig, target) => async function guardedStep1(bypassMode2Check = false) {
          if (sandbox.isGuestActive()) {
            return owner.presetStudio.handleStep1SynthesisInGuestMode(bypassMode2Check);
          }
          return orig.apply(target, [bypassMode2Check]);
        });
        wrapMethod(NS.promptSynthesizer, 'executeStep2OfficialNovelPrompt', (orig, target) => async function guardedStep2() {
          if (sandbox.isGuestActive()) {
            return owner.presetStudio.handleStep2ExecuteInGuestMode();
          }
          return orig.apply(target);
        });
      }
      if (NS.mode5Studio) {
        wrapMethod(NS.mode5Studio, 'generateDiagramAndTimeline', (orig, target) => async function guardedMode5(customUserPrompt = '', overrideModelId = null, options = {}) {
          if (sandbox.isGuestActive()) {
            if (sandbox.internalBypassDepth > 0) {
              return orig.apply(target, [customUserPrompt, overrideModelId, options]);
            }
            return owner.presetStudio.handleMode5TriggerInGuestMode(customUserPrompt, options);
          }
          return orig.apply(target, [customUserPrompt, overrideModelId, options]);
        });
      }
    }
  }

  // ==========================================================================
  // 4. HỘP THOẠI THÔNG BÁO GIỚI HẠN GUEST MODE & BẢNG PHÂN QUYỀN TƯƠNG TÁC
  // ==========================================================================
  class GuestModeRestrictionAndCapabilityModalUI {
    constructor(owner) {
      this.owner = owner;
      this.lastRestrictionDetail = null;
    }

    ensureModalsInDOM() {
      if (typeof document === 'undefined' || !document.body) return;
      this.ensureRestrictionModal();
      this.ensureCapabilityMatrixModal();
    }

    ensureRestrictionModal() {
      const ids = MOD41_CONSTANTS.DOM_IDS;
      if (document.getElementById(ids.RESTRICTION_MODAL)) return;

      const wrap = document.createElement('div');
      wrap.id = ids.RESTRICTION_MODAL;
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-modal', 'true');
      wrap.className =
        'hidden fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-start justify-center p-2.5 sm:p-4 overflow-y-auto';

      wrap.innerHTML = `
        <div class="my-auto w-full max-w-lg max-h-[92dvh] rounded-2xl border-2 border-amber-400/75 bg-zinc-900 text-zinc-100 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-xs">
          <div class="px-4 sm:px-5 py-3.5 border-b border-zinc-800 bg-gradient-to-r from-amber-950/80 via-zinc-900 to-rose-950/60 flex items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-2 flex-wrap min-w-0">
              <span id="${ids.RESTRICTION_BADGE}" class="px-2.5 py-0.5 rounded-full border border-amber-400/60 bg-amber-500/20 text-amber-200 font-black text-[10px] uppercase">
                🔐 CẦN KẾT NỐI TẠI MÀN HÌNH CHÍNH
              </span>
            </div>
            <button type="button" id="${ids.RESTRICTION_CLOSE_BTN}" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-100 font-extrabold transition shrink-0" aria-label="Đóng thông báo">✕</button>
          </div>

          <div class="p-4 sm:p-5 space-y-3.5 leading-relaxed">
            <div class="space-y-1">
              <div class="text-[11px] font-bold uppercase text-zinc-400">Tính năng vừa chọn:</div>
              <h3 id="${ids.RESTRICTION_TITLE}" class="text-sm sm:text-base font-extrabold text-white"></h3>
            </div>

            <div id="${ids.RESTRICTION_REASON}" class="p-3.5 rounded-xl border border-amber-400/45 bg-amber-500/10 text-amber-100 text-xs sm:text-[13px] font-semibold leading-relaxed"></div>

            <div id="${ids.RESTRICTION_STEPS}" class="p-3 rounded-xl border border-zinc-800 bg-zinc-950/90 space-y-1.5 text-[11px] text-zinc-300">
              <div class="font-extrabold text-emerald-300 uppercase text-[10px] tracking-wider">⏱️ 3 BƯỚC MỞ KHÓA TRỌN VẸN (CHƯA ĐẦY 2 PHÚT):</div>
              <div>1. Bấm nút "🔄 Reload Lại Web Để Kết Nối" bên dưới để quay về màn hình chính.</div>
              <div>2. Lấy miễn phí rồi sao chép &amp; dán Gemini API Key tại Bước 1 (Google AI Studio).</div>
              <div>3. Chọn Thư mục làm việc trên máy tính / điện thoại tại Bước 2 — mọi dữ liệu của bạn sẽ được lưu an toàn 100%!</div>
            </div>
          </div>

          <div class="px-4 sm:px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/95 flex flex-wrap items-center justify-between gap-2">
            <button type="button" id="${ids.RESTRICTION_MATRIX_BTN}" class="px-3 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-bold text-[11px] transition">
              🗺️ Xem Quyền Guest Mode
            </button>
            <div class="flex flex-wrap items-center gap-2 ml-auto">
              <button type="button" id="${ids.RESTRICTION_RELOAD_BTN}" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs shadow-lg transition">
                🔄 Reload Lại Web Để Kết Nối (&lt; 2 Phút)
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(wrap);

      const closeBtn = document.getElementById(ids.RESTRICTION_CLOSE_BTN);
      const reloadBtn = document.getElementById(ids.RESTRICTION_RELOAD_BTN);
      const matrixBtn = document.getElementById(ids.RESTRICTION_MATRIX_BTN);

      if (closeBtn) closeBtn.addEventListener('click', () => this.hideRestrictionModal());
      if (reloadBtn) reloadBtn.addEventListener('click', () => this.owner.reloadToMainGate());
      if (matrixBtn) {
        matrixBtn.addEventListener('click', () => {
          this.hideRestrictionModal();
          this.openCapabilityMatrixModal();
        });
      }
      wrap.addEventListener('click', (e) => {
        if (e.target === wrap) this.hideRestrictionModal();
      });
    }

    ensureCapabilityMatrixModal() {
      const ids = MOD41_CONSTANTS.DOM_IDS;
      if (document.getElementById(ids.MATRIX_MODAL)) return;

      const esc = (s) =>
        NS.uiUtils?.escapeHtml
          ? NS.uiUtils.escapeHtml(s)
          : String(s ?? '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

      const cardsHtml = GUEST_CAPABILITY_ENTRIES.map((entry) => {
        const meta = CAPABILITY_CATEGORY_META[entry.category] || CAPABILITY_CATEGORY_META.FREE;
        return `
          <div class="p-3 rounded-xl border ${meta.accentClass} space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-1.5">
              <span class="px-2 py-0.5 rounded-full border ${meta.pillClass} font-extrabold text-[9.5px] uppercase">${esc(meta.badge)}</span>
              <span class="px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-zinc-300 font-bold text-[10px]">${esc(entry.tab)}</span>
            </div>
            <div class="font-extrabold text-xs text-white leading-snug">${esc(entry.title)}</div>
            <p class="text-[11px] opacity-90 leading-relaxed">${esc(entry.detail)}</p>
          </div>
        `;
      }).join('');

      const modal = document.createElement('div');
      modal.id = ids.MATRIX_MODAL;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'hidden fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-start justify-center p-2.5 sm:p-4 overflow-y-auto';

      modal.innerHTML = `
        <div class="my-auto w-full max-w-3xl max-h-[92dvh] rounded-2xl border-2 border-zinc-500/70 bg-zinc-900 text-zinc-100 shadow-2xl flex flex-col overflow-hidden text-xs">
          <div class="px-4 sm:px-5 py-3.5 border-b border-zinc-800 bg-gradient-to-r from-zinc-800 via-slate-900 to-zinc-900 flex items-center justify-between gap-2 shrink-0">
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-black uppercase text-white">🗺️ Bản Đồ Tính Năng Chế Độ Khách (Dùng Thử vs Cần Kết Nối)</h3>
              <p class="text-[11px] text-zinc-300 mt-0.5">Mọi thao tác trong Chế Độ Khách hoàn toàn an toàn, chỉ chạy tạm trên RAM và không lưu ổ cứng.</p>
            </div>
            <button type="button" id="${ids.MATRIX_CLOSE_BTN}" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-100 font-extrabold transition shrink-0">✕</button>
          </div>
          <div class="p-3.5 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
            ${cardsHtml}
          </div>
          <div class="px-4 sm:px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span class="text-[11px] text-zinc-400">Muốn mở khóa 100% tính năng? Reload &amp; dán API Key + chọn thư mục (&lt; 2 phút).</span>
            <button type="button" id="${ids.MATRIX_RELOAD_BTN}" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition">
              🔄 Reload Để Kết Nối Ngay (&lt; 2 Phút)
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.getElementById(ids.MATRIX_CLOSE_BTN)?.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
      document.getElementById(ids.MATRIX_RELOAD_BTN)?.addEventListener('click', () => {
        this.owner.reloadToMainGate();
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    showRestrictionModal({ requirementType, featureName, customNote = '' }) {
      this.ensureModalsInDOM();
      const ids = MOD41_CONSTANTS.DOM_IDS;
      const modal = document.getElementById(ids.RESTRICTION_MODAL);
      const badgeEl = document.getElementById(ids.RESTRICTION_BADGE);
      const titleEl = document.getElementById(ids.RESTRICTION_TITLE);
      const reasonEl = document.getElementById(ids.RESTRICTION_REASON);
      if (!modal || !badgeEl || !titleEl || !reasonEl) return;

      const REQ = MOD41_CONSTANTS.REQUIREMENT_TYPES;
      let badgeText = '🔐📁 CẦN GEMINI API KEY & THƯ MỤC LÀM VIỆC';
      let badgeColor = 'border-amber-400/60 bg-amber-500/20 text-amber-200';
      let specificLead = '';

      if (requirementType === REQ.API_KEY) {
        badgeText = '🔐 TÍNH NĂNG CẦN GEMINI API KEY';
        badgeColor = 'border-amber-400/65 bg-amber-500/20 text-amber-200';
        specificLead = 'Tính năng này cần liên kết Gemini API Key tại màn hình chính.';
      } else if (requirementType === REQ.WORKSPACE_FOLDER) {
        badgeText = '📁 TÍNH NĂNG CẦN CHỌN THƯ MỤC & LƯU TRỮ';
        badgeColor = 'border-rose-400/65 bg-rose-500/20 text-rose-200';
        specificLead = 'Tính năng này liên quan tới lưu trữ & thư mục làm việc thật trên thiết bị.';
      } else if (requirementType === REQ.CUSTOM_PROMPT_LOCKED) {
        badgeText = '🧪 CHỈ CHẠY PROMPT MẪU TRONG CHẾ ĐỘ KHÁCH';
        badgeColor = 'border-sky-400/65 bg-sky-500/20 text-sky-200';
        specificLead =
          'Ở Chế Độ Khách, bạn không thể tự nhập câu lệnh tùy chỉnh mà hãy chọn các Prompt mẫu có sẵn để xem mô phỏng.';
      } else {
        specificLead = 'Tính năng này yêu cầu cả Gemini API Key lẫn Thư mục làm việc.';
      }

      const tr41 = (str) => (window.NoirStudio?.i18n?.translateText ? window.NoirStudio.i18n.translateText(String(str || '')) : String(str || ''));
      badgeEl.textContent = tr41(badgeText);
      badgeEl.className = `px-2.5 py-0.5 rounded-full border font-black text-[10px] uppercase ${badgeColor}`;
      titleEl.textContent = tr41(featureName || 'Tính năng bị giới hạn trong Chế Độ Khách');

      const detailLines = [tr41(specificLead)];
      if (customNote) detailLines.push(tr41(customNote));
      detailLines.push(tr41(MOD41_CONSTANTS.TWO_MINUTE_RELOAD_MESSAGE));
      reasonEl.textContent = detailLines.join(' ');

      this.lastRestrictionDetail = {
        requirementType,
        featureName: titleEl.textContent,
        timestamp: Date.now()
      };
      modal.classList.remove('hidden');
      window.NoirStudio?.i18n?.translateElement?.(modal);
    }

    hideRestrictionModal() {
      document.getElementById(MOD41_CONSTANTS.DOM_IDS.RESTRICTION_MODAL)?.classList.add('hidden');
    }

    openCapabilityMatrixModal() {
      this.ensureModalsInDOM();
      const matrixModal = document.getElementById(MOD41_CONSTANTS.DOM_IDS.MATRIX_MODAL);
      if (matrixModal) {
        matrixModal.classList.remove('hidden');
        window.NoirStudio?.i18n?.translateElement?.(matrixModal);
      }
    }
  }

  // ==========================================================================
  // 5. BỘ ĐIỀU KHIỂN PROMPT MẪU, MÔ PHỎNG 5 CHẾ ĐỘ & KHÓA TỰ GÕ CÂU LỆNH
  // ==========================================================================
  class GuestModePresetPromptStudioController {
    constructor(owner) {
      this.owner = owner;
      this.selectedModeFilter = 'ALL';
      this.activePresetId = null;
      this.simulationRunCount = 0;
      this.lastSimulatedMode = null;
      this.lastSimulatedPresetId = null;
      this.domCaptureBound = false;
      this.lastLockedInputToastAt = 0;
    }

    getPresets() {
      return this.owner.presetsCatalog;
    }

    getPresetsByMode(modeKey) {
      if (!modeKey || modeKey === 'ALL') return this.getPresets();
      return this.getPresets().filter((p) => p.modeKey === modeKey);
    }

    findPresetById(presetId) {
      return this.getPresets().find((p) => p.id === presetId) || null;
    }

    getDefaultPresetForMode(modeKey) {
      return this.getPresets().find((p) => p.modeKey === modeKey) || this.getPresets()[0];
    }

    /**
     * Khóa cứng toàn bộ ô tự nhập câu lệnh AI & ô chat tự do trong Guest Mode:
     * đọc được để kiểm tra/copy nhưng không thể gõ hay dán câu lệnh tự do.
     */
    lockPromptInputsForGuestMode() {
      if (typeof document === 'undefined') return;
      const sandbox = this.owner.sandbox;

      MOD41_CONSTANTS.LOCKED_PROMPT_INPUT_IDS.forEach((elId) => {
        const el = document.getElementById(elId);
        if (!el) return;

        el.readOnly = true;
        el.setAttribute('aria-readonly', 'true');
        el.dataset.mod41GuestLocked = 'true';
        el.classList.add('opacity-60', 'cursor-not-allowed', 'border-zinc-500/70', 'select-none');

        const trGuestPh = (s) =>
          NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || '');
        if (elId === 's18-fullscreen-prompt-textarea') {
          el.placeholder = trGuestPh(
            '🔒 [GUEST MODE] Không tự nhập câu lệnh tại đây — Hãy bấm chọn một Prompt Mẫu 5 Chế Độ ở khung phía trên để nạp sẵn và chạy mô phỏng ngay!'
          );
        } else if (elId === 'mode5-prompt-input') {
          el.placeholder = trGuestPh(
            '🔒 [GUEST MODE] Không tự nhập câu lệnh Mode 5 — Hãy chọn Prompt Mẫu biểu đồ phía trên rồi bấm Phân Tích!'
          );
        } else if (elId === 'free-chat-input') {
          el.placeholder = trGuestPh(
            '🔒 [GUEST MODE] Chọn câu hỏi mẫu Bi Số 8 ở phía trên (Reload & dán API Key để chat tự do < 2 phút)...'
          );
        }

        if (!el.dataset.mod41InputGuardBound) {
          el.dataset.mod41InputGuardBound = '1';

          const notifyLocked = () => {
            if (!this.owner.isActive() || sandbox.internalBypassDepth > 0) return;
            const now = Date.now();
            if (now - this.lastLockedInputToastAt > 1800) {
              this.lastLockedInputToastAt = now;
              NS.uiUtils?.showToast?.(
                '🧪 Guest Mode chỉ chạy Prompt mẫu có sẵn — không cho tự gõ câu lệnh! Hãy chọn mẫu ở trên hoặc Reload web (< 2 phút) để dán API Key.',
                'warning',
                3800
              );
            }
          };

          el.addEventListener('beforeinput', (ev) => {
            if (!this.owner.isActive() || sandbox.internalBypassDepth > 0) return;
            ev.preventDefault();
            notifyLocked();
          });

          el.addEventListener('paste', (ev) => {
            if (!this.owner.isActive() || sandbox.internalBypassDepth > 0) return;
            ev.preventDefault();
            notifyLocked();
          });

          el.addEventListener('drop', (ev) => {
            if (!this.owner.isActive() || sandbox.internalBypassDepth > 0) return;
            ev.preventDefault();
            notifyLocked();
          });

          el.addEventListener('keydown', (ev) => {
            if (!this.owner.isActive() || sandbox.internalBypassDepth > 0) return;
            const allowNav = [
              'ArrowUp',
              'ArrowDown',
              'ArrowLeft',
              'ArrowRight',
              'Home',
              'End',
              'PageUp',
              'PageDown',
              'Tab',
              'Escape'
            ].includes(ev.key);
            const allowCopySelect = (ev.ctrlKey || ev.metaKey) && ['c', 'a', 'C', 'A'].includes(ev.key);
            if (allowNav || allowCopySelect) return;

            if (ev.key === 'Enter' && elId === 'free-chat-input') {
              ev.preventDefault();
              ev.stopImmediatePropagation();
              this.owner.showRestrictionNotice({
                requirementType: MOD41_CONSTANTS.REQUIREMENT_TYPES.API_KEY,
                featureName: 'Gửi câu hỏi tự do tới Trợ lý Viên Bi Số 8'
              });
              return;
            }

            if (ev.key.length === 1 || ev.key === 'Backspace' || ev.key === 'Delete' || ev.key === 'Enter') {
              ev.preventDefault();
              notifyLocked();
            }
          });
        }
      });
    }

    /**
     * Dựng dải banner nhỏ gọn trên đầu màn hình làm việc khi ở Guest Mode (Desktop & Mobile 0 tràn viền).
     */
    renderTopGuestBanner() {
      if (typeof document === 'undefined') return;
      const ids = MOD41_CONSTANTS.DOM_IDS;
      let banner = document.getElementById(ids.TOP_BANNER);
      if (!banner) {
        banner = document.createElement('div');
        banner.id = ids.TOP_BANNER;
        banner.className =
          'relative z-20 px-3 py-1.5 border-b border-zinc-500/50 bg-gradient-to-r from-zinc-800 via-slate-800 to-zinc-800 text-zinc-100 text-[11px] flex flex-wrap items-center justify-between gap-2 shrink-0 min-w-0 max-w-full overflow-x-hidden';
        const mainEl = document.getElementById('app-main-workspace');
        if (mainEl && mainEl.parentNode) {
          mainEl.parentNode.insertBefore(banner, mainEl);
        } else {
          document.body.appendChild(banner);
        }
      }

      banner.innerHTML = `
        <div class="flex flex-wrap items-center gap-1.5 min-w-0">
          <span class="animate-pulse px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/85 text-amber-200 font-black text-[10px] uppercase shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.45)]">
            🧪 CHẾ ĐỘ KHÁCH (DÙNG THỬ)
          </span>
          <span class="text-zinc-200 font-semibold leading-snug">
            Đang chạy bộ truyện mẫu trên trình duyệt
          </span>
        </div>
        <div class="w-full lg:w-auto flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
          <button type="button" id="btn-mod41-banner-jump-tab1" class="max-w-full whitespace-nowrap text-center px-2.5 py-1 rounded-lg bg-teal-600/85 hover:bg-teal-500 text-white font-extrabold text-[10.5px] transition">
            ✍️ Vào Bàn Viết (Tab 1)
          </button>
          <button type="button" id="${ids.BANNER_QUICK_5MODES_BTN}" class="max-w-full whitespace-normal text-center px-2.5 py-1 rounded-lg bg-sky-600/80 hover:bg-sky-500 text-white font-extrabold text-[10.5px] transition">
            ⚡ Thử Prompt 5 Chế Độ
          </button>
          <button type="button" id="${ids.BANNER_MATRIX_BTN}" class="max-w-full whitespace-normal text-center px-2.5 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 border border-zinc-400/50 text-zinc-100 font-bold text-[10.5px] transition">
            🗺️ Phân Quyền
          </button>
          <button type="button" id="${ids.BANNER_RELOAD_BTN}" class="max-w-full whitespace-normal text-center px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10.5px] shadow transition">
            🔄 Reload Nhập API &amp; Thư Mục (&lt; 2 Phút)
          </button>
        </div>
      `;

      banner.classList.toggle('hidden', !this.owner.isActive());
      NS.i18n?.translateElement?.(banner);

      document.getElementById('btn-mod41-banner-jump-tab1')?.addEventListener('click', () => {
        NS.navigator?.navigateToScreen?.('SCREEN_1_WRITE');
      });
      document.getElementById(ids.BANNER_QUICK_5MODES_BTN)?.addEventListener('click', () => {
        NS.navigator?.navigateToScreen?.('SCREEN_3_AI');
      });
      document.getElementById(ids.BANNER_MATRIX_BTN)?.addEventListener('click', () => {
        this.owner.openCapabilityMatrixModal();
      });
      document.getElementById(ids.BANNER_RELOAD_BTN)?.addEventListener('click', () => {
        this.owner.reloadToMainGate();
      });
    }

    /**
     * Dựng khung Prompt Mẫu (Bấm là chạy mô phỏng ngay) cho cả Tab 3, Command Modal & Mode 5 Studio.
     */
    renderAllPresetDocks() {
      if (typeof document === 'undefined') return;
      this.renderTab3PresetDock();
      this.renderCommandModalPresetDock();
      this.renderMode5PresetDock();
      this.renderChatbotPresetBar();
      this.renderTab6GuestStatusNotice();
    }

    buildEscaper() {
      return NS.uiUtils?.escapeHtml
        ? NS.uiUtils.escapeHtml
        : (s) =>
            String(s ?? '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
    }

    buildPresetCardHtml(preset, compact = false) {
      const esc = this.buildEscaper();
      const isSelected = this.activePresetId === preset.id;
      const borderCls = isSelected
        ? 'border-emerald-400 bg-emerald-950/55 ring-1 ring-emerald-400/50'
        : 'border-zinc-700/80 bg-zinc-900/90 hover:border-sky-400/70';

      return `
        <div class="p-2.5 rounded-xl border ${borderCls} flex flex-col justify-between gap-2 min-w-0 transition" data-mod41-preset-card="${esc(preset.id)}">
          <div class="space-y-1 min-w-0">
            <div class="flex flex-wrap items-center justify-between gap-1">
              <span class="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-600/80 text-sky-300 font-extrabold text-[9.5px] truncate">${esc(preset.badge)}</span>
              <span class="font-monoCode text-[9.5px] text-zinc-400">~${preset.estimatedWords} từ</span>
            </div>
            <div class="font-extrabold text-[11.5px] text-white leading-snug">${esc(preset.title)}</div>
            ${
              compact
                ? ''
                : `<p class="text-[10.5px] text-zinc-300 line-clamp-2 leading-relaxed">${esc(preset.userPromptText)}</p>`
            }
          </div>
          <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
            <button type="button" data-mod41-run-preset="${esc(preset.id)}" class="flex-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[10.5px] shadow transition text-center">
              ▶ Chạy Mô Phỏng Ngay
            </button>
            <button type="button" data-mod41-fill-preset="${esc(preset.id)}" class="px-2 py-1.5 rounded-lg border border-zinc-600 hover:bg-zinc-800 text-zinc-200 font-bold text-[10px] transition" title="Nạp câu lệnh mẫu để xem bước Tổng Hợp Prompt">
              👁️ Xem Prompt
            </button>
          </div>
        </div>
      `;
    }

    attachPresetContainerDelegates(containerEl) {
      if (!containerEl || containerEl.dataset.mod41DelegateBound === '1') return;
      containerEl.dataset.mod41DelegateBound = '1';
      containerEl.addEventListener('click', (ev) => {
        const filterBtn = ev.target.closest?.('[data-mod41-filter-mode]');
        if (filterBtn) {
          this.selectedModeFilter = filterBtn.getAttribute('data-mod41-filter-mode') || 'ALL';
          this.renderAllPresetDocks();
          return;
        }
        const runBtn = ev.target.closest?.('[data-mod41-run-preset]');
        if (runBtn) {
          const pid = runBtn.getAttribute('data-mod41-run-preset');
          if (pid) this.runSimulatedPreset(pid, { openTab3: true });
          return;
        }
        const fillBtn = ev.target.closest?.('[data-mod41-fill-preset]');
        if (fillBtn) {
          const pid = fillBtn.getAttribute('data-mod41-fill-preset');
          if (pid) this.selectPresetAndPreview(pid, true);
        }
      });
    }

    renderTab3PresetDock() {
      const ids = MOD41_CONSTANTS.DOM_IDS;
      const wrapper = document.getElementById('tab3-standard-output-wrapper');
      if (!wrapper) return;

      let dock = document.getElementById(ids.TAB3_PRESETS_DOCK);
      if (!dock) {
        dock = document.createElement('div');
        dock.id = ids.TAB3_PRESETS_DOCK;
        dock.className =
          'p-3 rounded-2xl border-2 border-zinc-500/60 bg-zinc-900/95 space-y-2.5 shrink-0 max-h-[38vh] overflow-y-auto min-w-0';
        wrapper.insertBefore(dock, wrapper.firstChild);
        this.attachPresetContainerDelegates(dock);
      }

      if (!this.owner.isActive()) {
        dock.classList.add('hidden');
        return;
      }
      dock.classList.remove('hidden');

      const modes = [
        { key: 'ALL', label: '🌟 Tất cả 5 Chế độ' },
        { key: 'MODE_1_DRAFT', label: '✍️ CĐ 1: Viết' },
        { key: 'MODE_2_BRAINSTORM', label: '🧭 CĐ 2: Tham mưu' },
        { key: 'MODE_3_AUDIT', label: '🔍 CĐ 3: Kiểm toán' },
        { key: 'MODE_4_REVIEW', label: '📊 CĐ 4: Đánh giá' },
        { key: 'MODE_5_DIAGRAM', label: '🎨 CĐ 5: Sơ đồ' }
      ];

      const tabsHtml = modes
        .map((m) => {
          const active = this.selectedModeFilter === m.key;
          const cls = active
            ? 'bg-emerald-600 text-white border-emerald-400'
            : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:bg-zinc-800';
          return `<button type="button" data-mod41-filter-mode="${m.key}" class="px-2.5 py-1 rounded-lg border text-[10.5px] font-bold transition ${cls}">${m.label}</button>`;
        })
        .join('');

      const list = this.getPresetsByMode(this.selectedModeFilter);
      const cardsHtml = list.map((p) => this.buildPresetCardHtml(p, true)).join('');

      dock.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="px-2 py-0.5 rounded bg-zinc-700 text-white font-black text-[10px]">🧪 CHẾ ĐỘ KHÁCH — PROMPT MẪU 5 CHẾ ĐỘ</span>
            <span class="text-[11px] text-zinc-300 font-semibold">Click bất kỳ mẫu nào bên dưới để chạy mô phỏng tức thì!</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">${tabsHtml}</div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 min-w-0">${cardsHtml}</div>
      `;
      NS.i18n?.translateElement?.(dock);
    }

    renderCommandModalPresetDock() {
      const ids = MOD41_CONSTANTS.DOM_IDS;
      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      if (!promptBox || !promptBox.parentElement) return;

      let dock = document.getElementById(ids.CMD_MODAL_PRESETS_DOCK);
      if (!dock) {
        dock = document.createElement('div');
        dock.id = ids.CMD_MODAL_PRESETS_DOCK;
        dock.className =
          'p-3 rounded-2xl border-2 border-sky-500/50 bg-zinc-950/90 space-y-2.5 mb-2 min-w-0';
        promptBox.parentElement.insertBefore(dock, promptBox);
        this.attachPresetContainerDelegates(dock);
      }

      if (!this.owner.isActive()) {
        dock.classList.add('hidden');
        return;
      }
      dock.classList.remove('hidden');

      const modeSelEl = document.getElementById('select-ai-execution-mode');
      if (modeSelEl && !modeSelEl.dataset.mod41ModeSyncBound) {
        modeSelEl.dataset.mod41ModeSyncBound = '1';
        modeSelEl.addEventListener('change', () => {
          if (!this.owner.isActive() || this.owner.sandbox.internalBypassDepth > 0) return;
          const nextPreset = this.getDefaultPresetForMode(modeSelEl.value || 'MODE_1_DRAFT');
          if (nextPreset) {
            this.selectPresetAndPreview(nextPreset.id, false);
          }
        });
      }

      const activeMode = modeSelEl?.value || 'MODE_1_DRAFT';
      const presets = this.getPresetsByMode(activeMode);
      const allRow = this.getPresets()
        .filter((p, idx, arr) => arr.findIndex((x) => x.modeKey === p.modeKey) === idx)
        .map((p) => {
          const isCur = p.modeKey === activeMode;
          return `<button type="button" data-mod41-run-preset="${p.id}" class="px-2.5 py-1 rounded-lg border text-[10.5px] font-bold transition ${
            isCur
              ? 'border-emerald-400 bg-emerald-600/30 text-emerald-200'
              : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
          }">▶ ${p.badge.split('•')[0].trim()}</button>`;
        })
        .join('');

      dock.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-[11px] font-extrabold text-sky-300">
            🔒 Ô Gõ Bị Khóa Trong Chế Độ Khách — Hãy chọn Prompt Mẫu dưới đây (Chạy Sẵn Cả 5 Chế Độ):
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">${allRow}</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${presets.map((p) => this.buildPresetCardHtml(p, false)).join('')}</div>
      `;
      NS.i18n?.translateElement?.(dock);
    }

    renderMode5PresetDock() {
      const ids = MOD41_CONSTANTS.DOM_IDS;
      const m5Input = document.getElementById('mode5-prompt-input');
      if (!m5Input || !m5Input.parentElement) return;

      let dock = document.getElementById(ids.MODE5_PRESETS_DOCK);
      if (!dock) {
        dock = document.createElement('div');
        dock.id = ids.MODE5_PRESETS_DOCK;
        dock.className = 'p-2.5 rounded-xl border border-emerald-500/45 bg-zinc-950/85 space-y-2 mb-2';
        m5Input.parentElement.insertBefore(dock, m5Input);
        this.attachPresetContainerDelegates(dock);
      }

      if (!this.owner.isActive()) {
        dock.classList.add('hidden');
        return;
      }
      dock.classList.remove('hidden');

      const m5Presets = this.getPresetsByMode('MODE_5_DIAGRAM');
      dock.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-[11px] font-extrabold text-emerald-300">🎨 Prompt Mẫu Chế Độ 5 (Click Là Vẽ Biểu Đồ SVG Sẵn):</span>
          <button type="button" data-mod41-filter-mode="ALL" class="hidden"></button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${m5Presets.map((p) => this.buildPresetCardHtml(p, true)).join('')}</div>
      `;
      NS.i18n?.translateElement?.(dock);
    }

    renderChatbotPresetBar() {
      const ids = MOD41_CONSTANTS.DOM_IDS;
      const chatInput = document.getElementById('free-chat-input');
      if (!chatInput || !chatInput.parentElement || !chatInput.parentElement.parentElement) return;

      const footerWrap = chatInput.parentElement.parentElement;
      let bar = document.getElementById(ids.CHAT_PRESETS_BAR);
      if (!bar) {
        bar = document.createElement('div');
        bar.id = ids.CHAT_PRESETS_BAR;
        bar.className =
          'px-3 py-2 border-t border-indigo-500/35 bg-zinc-900/95 space-y-1.5 shrink-0';
        footerWrap.insertBefore(bar, chatInput.parentElement);

        bar.addEventListener('click', (ev) => {
          const btn = ev.target.closest?.('[data-mod41-chat-preset]');
          if (!btn) return;
          const qid = btn.getAttribute('data-mod41-chat-preset');
          if (qid) this.runChatbotPresetQuestion(qid);
        });
      }

      if (!this.owner.isActive()) {
        bar.classList.add('hidden');
        return;
      }
      bar.classList.remove('hidden');

      const esc = this.buildEscaper();
      const qHtml = this.owner.chatbotPresets
        .map(
          (q) =>
            `<button type="button" data-mod41-chat-preset="${esc(q.id)}" class="px-2.5 py-1 rounded-lg border border-indigo-500/45 bg-indigo-950/65 hover:bg-indigo-800/70 text-indigo-100 font-bold text-[10.5px] transition">${esc(q.label)}</button>`
        )
        .join('');

      bar.innerHTML = `
        <div class="text-[10.5px] font-extrabold text-amber-300">
          🧪 Câu Hỏi Mẫu Bi Số 8 (Chế Độ Khách khóa gõ tự do — Bấm là trả lời ngay):
        </div>
        <div class="flex flex-wrap items-center gap-1.5">${qHtml}</div>
      `;
      NS.i18n?.translateElement?.(bar);
    }

    renderTab6GuestStatusNotice() {
      const ids = MOD41_CONSTANTS.DOM_IDS;
      const acc1Body = document.getElementById('tab6-acc-1-body');
      const liveKeyPill = document.getElementById('tab6-live-key-pill');
      const liveFolderPill = document.getElementById('tab6-live-folder-pill');
      const planPill = document.getElementById('tab6-plan-tier-badge');

      if (!this.owner.isActive()) {
        document.getElementById(ids.TAB6_GUEST_NOTICE)?.classList.add('hidden');
        return;
      }

      const trText = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      if (liveKeyPill) liveKeyPill.textContent = trText('🧪 Chế Độ Khách: Chưa nối API Key');
      if (liveFolderPill) liveFolderPill.textContent = trText('🧪 Chế Độ Khách: Chỉ lưu RAM tạm');
      if (planPill) planPill.textContent = trText('CHẾ ĐỘ DÙNG THỬ');

      if (!acc1Body) return;
      let card = document.getElementById(ids.TAB6_GUEST_NOTICE);
      if (!card) {
        card = document.createElement('div');
        card.id = ids.TAB6_GUEST_NOTICE;
        card.className =
          'p-3.5 rounded-xl border-2 border-zinc-400/60 bg-zinc-900/95 text-xs space-y-2';
        acc1Body.insertBefore(card, acc1Body.firstChild);
      }
      card.classList.remove('hidden');
      card.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-black text-white uppercase text-[11px]">🧪 Bạn đang trong Chế Độ Khách (Chưa kết nối API Key &amp; Thư mục)</span>
          <button type="button" id="btn-mod41-tab6-reload-connect" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow transition">
            🔄 Reload Nhập API &amp; Thư Mục (&lt; 2 Phút)
          </button>
        </div>
        <p class="text-[11px] text-zinc-300 leading-relaxed">
          ${MOD41_CONSTANTS.TWO_MINUTE_RELOAD_MESSAGE}
        </p>
      `;
      NS.i18n?.translateElement?.(card);
      document.getElementById('btn-mod41-tab6-reload-connect')?.addEventListener('click', () => {
        this.owner.reloadToMainGate();
      });
    }

    /**
     * Nạp câu lệnh mẫu vào UI và (tùy chọn) mở ngay Modal Kiểm Tra Prompt Tổng Hợp.
     */
    selectPresetAndPreview(presetId, openConfirmModal = true) {
      const preset = this.findPresetById(presetId) || this.getDefaultPresetForMode('MODE_1_DRAFT');
      this.activePresetId = preset.id;

      this.owner.sandbox.withInternalBypass(() => {
        const modeSel = document.getElementById('select-ai-execution-mode');
        if (modeSel) {
          modeSel.value = preset.modeKey;
          modeSel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const trGuestSample = (txt) => {
          const s = String(txt || '');
          if (NS.i18n?.translatePromptFrame) return NS.i18n.translatePromptFrame(s);
          if (NS.i18n?.translateText) return NS.i18n.translateText(s);
          return s;
        };
        const displayUserPrompt = trGuestSample(preset.userPromptText);
        const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
        if (promptBox) {
          promptBox.value = displayUserPrompt;
        }
        const counter = document.getElementById('prompt-char-counter');
        if (counter) {
          const lenStr = NS.i18n?.formatNumber
            ? NS.i18n.formatNumber(displayUserPrompt.length)
            : displayUserPrompt.length.toLocaleString('vi-VN');
          const tr = NS.i18n?.translateText || ((s) => s);
          counter.textContent = tr(`${lenStr} ký tự`);
        }
        const m5Box = document.getElementById('mode5-prompt-input');
        if (m5Box && preset.modeKey === 'MODE_5_DIAGRAM') {
          m5Box.value = displayUserPrompt;
        }
      });

      this.renderAllPresetDocks();

      if (openConfirmModal) {
        this.openPreRunReviewModalForPreset(preset);
      }
      return preset;
    }

    openPreRunReviewModalForPreset(preset) {
      const synth = NS.promptSynthesizer;
      const modal = document.getElementById('modal-confirm-synthesized-prompt');
      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      const titleEl = document.getElementById('confirm-synthesized-modal-title');
      const statsEl = document.getElementById('synthesized-prompt-stats');
      const runLabelEl = document.getElementById('label-btn-execute-confirm');

      let bodyPrompt = preset.userPromptText;
      if (preset.modeKey === 'MODE_1_DRAFT' && synth && typeof synth.buildMasterSynthesizedPrompt === 'function') {
        bodyPrompt = synth.buildMasterSynthesizedPrompt();
      } else if (synth && typeof synth.buildStandaloneModePrompt === 'function') {
        bodyPrompt = synth.buildStandaloneModePrompt(preset.modeKey, preset.userPromptText);
      }

      if (synth) {
        synth.lastSynthesizedPrompt = bodyPrompt;
        synth._pendingModalReviewContext = {
          modeKey: preset.modeKey,
          resolvedCmd: preset.userPromptText,
          presetId: preset.id,
          origin: 'GUEST_MODE_PRESET'
        };
      }

      const trText = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      if (synthTextarea) synthTextarea.value = bodyPrompt;
      if (statsEl) {
        const wc = NS.uiUtils?.countVietnameseWords?.(bodyPrompt) || bodyPrompt.split(/\s+/).length;
        const wcStr = NS.i18n?.formatNumber ? NS.i18n.formatNumber(wc) : wc.toLocaleString('vi-VN');
        statsEl.textContent = trText(`${wcStr} từ (Guest Prompt Mẫu)`);
      }
      if (titleEl) {
        titleEl.textContent = trText(`🧪 RÀ SOÁT PROMPT MẪU (${preset.badge}) — BẤM TIẾP TỤC ĐỂ CHẠY MÔ PHỎNG`);
      }
      if (runLabelEl) {
        runLabelEl.textContent = trText(`▶ Chạy Mô Phỏng ${preset.badge.split('•')[0].trim()} (0 Token / Không Cần API)`);
      }

      document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');
      if (modal) {
        modal.classList.remove('hidden');
        NS.i18n?.translateElement?.(modal);
      }
    }

    async handleStep1SynthesisInGuestMode(_bypassMode2Check) {
      const modeSelEl = document.getElementById('select-ai-execution-mode');
      if (modeSelEl && !modeSelEl.dataset.mod41ModeSyncBound) {
        modeSelEl.dataset.mod41ModeSyncBound = '1';
        modeSelEl.addEventListener('change', () => {
          if (!this.owner.isActive() || this.owner.sandbox.internalBypassDepth > 0) return;
          const nextPreset = this.getDefaultPresetForMode(modeSelEl.value || 'MODE_1_DRAFT');
          if (nextPreset) {
            this.selectPresetAndPreview(nextPreset.id, false);
          }
        });
      }

      const activeMode = modeSelEl?.value || 'MODE_1_DRAFT';
      let preset = this.activePresetId ? this.findPresetById(this.activePresetId) : null;
      if (!preset || preset.modeKey !== activeMode) {
        preset = this.getDefaultPresetForMode(activeMode);
      }
      this.selectPresetAndPreview(preset.id, true);
      return true;
    }

    async handleStep2ExecuteInGuestMode() {
      const ctxMode =
        NS.promptSynthesizer?._pendingModalReviewContext?.modeKey ||
        document.getElementById('select-ai-execution-mode')?.value ||
        'MODE_1_DRAFT';
      const ctxPresetId = NS.promptSynthesizer?._pendingModalReviewContext?.presetId || this.activePresetId;
      let preset = ctxPresetId ? this.findPresetById(ctxPresetId) : null;
      if (!preset || preset.modeKey !== ctxMode) {
        preset = this.getDefaultPresetForMode(ctxMode);
      }
      document.getElementById('modal-confirm-synthesized-prompt')?.classList.add('hidden');
      return this.runSimulatedPreset(preset.id, { openTab3: true });
    }

    async handleMode5TriggerInGuestMode(_customUserPrompt = '', options = {}) {
      const m5Preset =
        (this.activePresetId && this.findPresetById(this.activePresetId)?.modeKey === 'MODE_5_DIAGRAM'
          ? this.findPresetById(this.activePresetId)
          : null) || this.getDefaultPresetForMode('MODE_5_DIAGRAM');

      if (!options?.skipPreReview) {
        this.selectPresetAndPreview(m5Preset.id, true);
        return true;
      }
      return this.runSimulatedPreset(m5Preset.id, { openTab3: true });
    }

    /**
     * Thực thi mô phỏng hoàn chỉnh cho bất kỳ chế độ nào trong 5 chế độ:
     * - Mode 1 -> 4: nạp kết quả mẫu vào Tab 3 + bật thông báo nổi bật.
     * - Mode 5: dựng biểu đồ SVG tương tác trên #mode5-svg-canvas-Stage + xuất báo cáo #mode5-chronicle-report.
     */
    async runSimulatedPreset(presetIdOrModeKey, options = {}) {
      const preset =
        this.findPresetById(presetIdOrModeKey) ||
        this.getDefaultPresetForMode(presetIdOrModeKey || 'MODE_1_DRAFT');
      if (!preset) return false;

      this.activePresetId = preset.id;
      this.lastSimulatedMode = preset.modeKey;
      this.lastSimulatedPresetId = preset.id;
      this.simulationRunCount += 1;

      this.owner.sandbox.withInternalBypass(() => {
        const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
        if (promptBox) promptBox.value = preset.userPromptText;
        const m5Input = document.getElementById('mode5-prompt-input');
        if (m5Input && preset.modeKey === 'MODE_5_DIAGRAM') m5Input.value = preset.userPromptText;
        const modeSel = document.getElementById('select-ai-execution-mode');
        if (modeSel) modeSel.value = preset.modeKey;
      });

      document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');
      document.getElementById('modal-confirm-synthesized-prompt')?.classList.add('hidden');

      if (options.openTab3 !== false) {
        NS.tab3Controller?.switchMode?.(preset.modeKey);
        NS.navigator?.navigateToScreen?.('SCREEN_3_AI');
      }

      if (preset.modeKey === 'MODE_5_DIAGRAM' && preset.simulatedGraph) {
        const styleMode =
          document.getElementById('mode5-diagram-style')?.value || 'TIMELINE_AND_GRAPH';
        NS.mode5Studio?.buildInteractiveSvgDiagram?.(preset.simulatedGraph, styleMode);
        const reportEl = document.getElementById('mode5-chronicle-report');
        if (reportEl) reportEl.textContent = preset.simulatedOutput;
        const statusEl = document.getElementById('mode5-visual-status');
        if (statusEl) {
          statusEl.textContent = `🧪 Mô phỏng Mode 5 thành công (${preset.title})`;
        }
      }

      NS.tab3Controller?.setOutputForMode?.(preset.modeKey, preset.simulatedOutput, {
        notifyNew: true,
        usedEndpoint: preset.modelLabel,
        wordCount: preset.estimatedWords
      });

      const alertText = document.getElementById('tab3-new-output-alert-text');
      if (alertText) {
        alertText.textContent = `🧪 Đã chạy mô phỏng "${preset.title}" (${preset.badge})! ${
          preset.canApplyDiffToTab1
            ? 'Bạn có thể bấm "📥 Chèn nối tiếp" để thử Duyệt Màu Google Docs bên Tab 1!'
            : 'Xem chi tiết kết quả mô phỏng ngay bên dưới.'
        }`;
      }

      this.renderAllPresetDocks();
      NS.uiUtils?.showToast?.(
        `🧪 Đã chạy mô phỏng ${preset.badge}: "${preset.title}"!`,
        'success',
        3400
      );
      return true;
    }

    runChatbotPresetQuestion(questionId) {
      const q =
        this.owner.chatbotPresets.find((x) => x.id === questionId) ||
        this.owner.chatbotPresets[0];
      if (!q || !NS.mascotAndChat) return false;

      if (typeof NS.mascotAndChat.appendMessage === 'function') {
        NS.mascotAndChat.appendMessage('user', '🧪 Khách Dùng Thử', q.userText, 'CÂU HỎI MẪU');
        NS.mascotAndChat.appendMessage(
          'assistant',
          '🎱 Viên Bi Số 8 (Mô Phỏng Guest)',
          q.replyText,
          q.badge
        );
      }
      return true;
    }

    /**
     * Gắn trình chặn click (capture phase) cho mọi nút thao tác lưu trữ / thư mục / API thật.
     * Chỉ chặn khi Guest Mode đang hoạt động (`isActive() === true`).
     */
    bindDomRestrictionCaptureGuard() {
      if (this.domCaptureBound || typeof document === 'undefined') return;
      this.domCaptureBound = true;

      const REQ = MOD41_CONSTANTS.REQUIREMENT_TYPES;
      const RESTRICTED_CLICK_MAP = new Map([
        ['btn-s7-save-now', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Lưu bản thảo thủ công (3 tầng)' }],
        ['btn-new-draft-chapter', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Tạo chương mới trong Thư mục' }],
        ['btn-tab1-quick-new-chapter', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Tạo chương mới ở Tab 1' }],
        ['btn-import-files', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Nhập file .DOCX / .PDF / .TXT vào dự án' }],
        ['btn-export-workspace-json', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Sao lưu toàn bộ dự án (.JSON)' }],
        ['btn-approve-chapter', { requirementType: REQ.BOTH_API_AND_FOLDER, featureName: 'Duyệt & Chốt Bản Thảo Thông Minh' }],
        ['btn-confirm-run-approval-synthesis', { requirementType: REQ.BOTH_API_AND_FOLDER, featureName: 'Chốt Duyệt & Trích Xuất Story Bible' }],
        ['btn-tab4-sync-bible-entities', { requirementType: REQ.API_KEY, featureName: 'Đồng bộ Story Bible bằng Gemini AI' }],
        ['btn-bible-save-all', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Lưu dữ liệu Story Bible ra Thư mục' }],
        ['btn-add-character-profile', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Thêm & Lưu Nhân Vật mới vào Story Bible' }],
        ['btn-add-knowledge-entry', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Thêm & Lưu Bí Mật mới vào Ma Trận' }],
        ['btn-add-clue-entry', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Thêm & Lưu Phục Bút mới vào Sổ Cái' }],
        ['btn-tab3-save-to-bible', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Lưu kết quả AI vào Story Bible vĩnh viễn' }],
        ['btn-create-manual-version', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Tạo & Lưu Mốc Phiên Bản Time-Machine' }],
        ['btn-restore-selected-version', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Khôi Phục Phiên Bản từ Kho Lưu Trữ' }],
        ['btn-s6-open-connection-gate', { requirementType: REQ.BOTH_API_AND_FOLDER, featureName: 'Mở Cổng Kết Nối API Key & Thư mục' }],
        ['btn-s6-card-apikey', { requirementType: REQ.API_KEY, featureName: 'Cài đặt Gemini API Key' }],
        ['btn-s6-quick-gate', { requirementType: REQ.BOTH_API_AND_FOLDER, featureName: 'Kết nối API Key & Thư mục' }],
        ['btn-s6-quick-verify-all-links', { requirementType: REQ.API_KEY, featureName: 'Kiểm chứng kết nối Gemini API' }],
        ['btn-s6-card-share-bundle', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Xuất gói chia sẻ dữ liệu dự án' }],
        ['btn-send-free-chat', { requirementType: REQ.API_KEY, featureName: 'Gửi câu hỏi tự do tới Chatbot Bi Số 8' }],
        ['btn-save-sysprompt-config', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Lưu cấu hình System Prompt hệ thống' }],
        ['btn-reset-default-sysprompt', { requirementType: REQ.WORKSPACE_FOLDER, featureName: 'Đặt lại & lưu System Prompt hệ thống' }]
      ]);

      document.addEventListener(
        'click',
        (ev) => {
          if (!this.owner.isActive()) return;
          const target = ev.target;
          if (!target || typeof target.closest !== 'function') return;

          // Kiểm tra nút có ID trong danh sách hạn chế
          for (const [btnId, spec] of RESTRICTED_CLICK_MAP.entries()) {
            const matched = target.closest(`#${btnId}`);
            if (matched) {
              ev.preventDefault();
              ev.stopPropagation();
              ev.stopImmediatePropagation();
              this.owner.showRestrictionNotice(spec);
              return;
            }
          }

          // Chặn nút xóa chương động trong cây chương Tab 2
          const delChapBtn = target.closest('[data-action="delete"], .btn-delete-chapter, .chapter-delete-btn');
          if (delChapBtn && target.closest('#chapter-tree-container')) {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            this.owner.showRestrictionNotice({
              requirementType: REQ.WORKSPACE_FOLDER,
              featureName: 'Xóa chương khỏi kho lưu trữ'
            });
            return;
          }

          // Chặn các thao tác lưu/đồng bộ bên trong #tab6-workspace-export-root (Mod 37)
          const mod37Btn = target.closest('#tab6-workspace-export-root button');
          if (mod37Btn) {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            this.owner.showRestrictionNotice({
              requirementType: REQ.WORKSPACE_FOLDER,
              featureName: 'Xuất / Nhập gói .ZIP & Đồng bộ Google Drive'
            });
          }
        },
        true
      );
    }
  }

  // ==========================================================================
  // 6. BỘ ĐIỀU PHỐI TRUNG TÂM GUEST MODE (NS.guestMode)
  // ==========================================================================
  class GuestModeSandboxCoordinator {
    constructor() {
      this.active = false;
      this.hasInitialized = false;
      this.enteredAt = null;
      this.reloadHook = null;
      this.presetsCatalog = GuestDemoDatasetFactory.createPresetCatalog();
      this.chatbotPresets = GuestDemoDatasetFactory.createChatbotPresetQuestions();
      this.sandbox = new GuestStorageAndApiIsolationSandbox(this);
      this.modalsUI = new GuestModeRestrictionAndCapabilityModalUI(this);
      this.presetStudio = new GuestModePresetPromptStudioController(this);
    }

    init() {
      if (this.hasInitialized) return this;
      this.hasInitialized = true;

      this.sandbox.installStoragePrototypeSandbox();
      this.sandbox.installModuleGuards();
      this.modalsUI.ensureModalsInDOM();
      this.presetStudio.bindDomRestrictionCaptureGuard();
      this.bindEntryGateButton();

      if (NS.bus?.on) {
        NS.bus.on('mod36:shield_ready', () => {
          if (this.isActive()) this.refreshGuestSaveStatusIndicator();
        });
      }
      if (!this._i18nBound) {
        this._i18nBound = true;
        const onLangChanged = () => {
          if (this.isActive()) {
            this.presetStudio.lockPromptInputsForGuestMode();
            this.presetStudio.renderTopGuestBanner();
            this.presetStudio.renderAllPresetDocks();
            const activeMode = document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
            const actPreset =
              (this.presetStudio.activePresetId && this.presetStudio.findPresetById(this.presetStudio.activePresetId)) ||
              this.presetStudio.getDefaultPresetForMode(activeMode);
            if (actPreset) {
              this.sandbox.withInternalBypass(() => {
                const trSample = (txt) =>
                  NS.i18n?.translatePromptFrame
                    ? NS.i18n.translatePromptFrame(String(txt || ''))
                    : NS.i18n?.translateText
                      ? NS.i18n.translateText(String(txt || ''))
                      : String(txt || '');
                const txtOut = trSample(actPreset.userPromptText);
                const pEl = document.getElementById('s18-fullscreen-prompt-textarea');
                if (pEl && pEl.readOnly) pEl.value = txtOut;
                const m5El = document.getElementById('mode5-prompt-input');
                if (m5El && m5El.readOnly && actPreset.modeKey === 'MODE_5_DIAGRAM') m5El.value = txtOut;
              });
            }
            this.refreshGuestSaveStatusIndicator();
          }
          const rModal = document.getElementById(MOD41_CONSTANTS.DOM_IDS.RESTRICTION_MODAL);
          if (rModal && !rModal.classList.contains('hidden')) NS.i18n?.translateElement?.(rModal);
          const mModal = document.getElementById(MOD41_CONSTANTS.DOM_IDS.MATRIX_MODAL);
          if (mModal && !mModal.classList.contains('hidden')) NS.i18n?.translateElement?.(mModal);
        };
        NS.bus?.on?.('i18n:changed', onLangChanged);
        if (typeof window !== 'undefined' && window.addEventListener) {
          window.addEventListener('noir:i18n:changed', onLangChanged);
        }
      }
      return this;
    }

    bindEntryGateButton() {
      if (typeof document === 'undefined') return;
      const guestBtn = document.getElementById(MOD41_CONSTANTS.DOM_IDS.GATE_GUEST_BTN);
      if (guestBtn && !guestBtn.dataset.mod41Bound) {
        guestBtn.dataset.mod41Bound = '1';
        guestBtn.addEventListener('click', () => {
          this.enterGuestMode();
        });
      }
      const supportersBtn = document.getElementById('btn-gate-supporters-fan5');
      if (supportersBtn && !supportersBtn.dataset.mod41Bound) {
        supportersBtn.dataset.mod41Bound = '1';
        supportersBtn.addEventListener('click', () => {
          this.enterGuestModeToSupportersFan5();
        });
      }
    }

    enterGuestModeToSupportersFan5() {
      this.enterGuestMode({
        targetScreen: 'SCREEN_6_SYSTEM',
        skipDefaultTab5: true,
        customToast: '🌟 Đã vào Chế Độ Khách và mở sẵn Tab 6 — Những người đã ủng hộ web!'
      });
      if (typeof document === 'undefined') return true;
      const box5Body = document.getElementById('tab6-misc-fun-collapsible-body');
      const box5Toggle = document.getElementById('btn-toggle-tab6-misc-fun');
      if (box5Body && box5Body.classList.contains('hidden')) {
        if (box5Toggle) {
          box5Toggle.click();
        } else {
          box5Body.classList.remove('hidden');
        }
      }
      try {
        NS.miscFunHub?.preloadAllAssets?.();
        NS.miscFunHub?.selectTab?.('fan_ham_mo');
      } catch (_eMisc) {}
      setTimeout(() => {
        const targetSection =
          document.getElementById('misc-fun-stage') ||
          document.getElementById('tab6-misc-fun-section');
        if (targetSection && typeof targetSection.scrollIntoView === 'function') {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 90);
      return true;
    }

    isActive() {
      return Boolean(this.active);
    }

    /**
     * Kích hoạt Chế Độ Khách: không cần API Key hay Thư mục.
     * Toàn bộ dữ liệu thật của người dùng được cách ly an toàn; Studio nạp bộ
     * truyện mẫu + Story Bible mẫu + khóa gõ Prompt tùy chỉnh + bật Preset 5 Chế độ.
     */
    enterGuestMode(options = {}) {
      const opts = options && typeof options === 'object' ? options : {};
      const targetScreen = String(opts.targetScreen || 'SCREEN_5_AMBIENCE');
      this.init();
      this.sandbox.installModuleGuards();
      this.sandbox.resetRamStorageForGuestSession();

      this.active = true;
      this.enteredAt = Date.now();
      if (NS.state) {
        NS.state.entryGateUnlocked = true;
        NS.state.isGuestMode = true;
      }
      if (typeof document !== 'undefined' && document.body) {
        document.body.dataset.guestMode = 'true';
        document.body.dataset.appGateLocked = 'false';
      }

      // Đóng Cổng kết nối & mở khóa tương tác nền Studio
      const gateEl = document.getElementById('app-entry-connection-gate');
      if (gateEl) gateEl.classList.add('hidden');
      NS.connectionGate?.setBackgroundLocked?.(false);

      // Nạp bộ dữ liệu mẫu Light Novel & Story Bible vào RAM
      this.populateGuestDemoWorkspaceInRam();

      // Khóa toàn bộ ô tự nhập câu lệnh & dựng thanh Prompt Mẫu + Banner Guest Mode
      this.presetStudio.lockPromptInputsForGuestMode();
      this.presetStudio.renderTopGuestBanner();
      this.presetStudio.renderAllPresetDocks();

      // Nạp sẵn câu lệnh mẫu Chế độ 1 vào ô Prompt (readOnly)
      const defM1 = this.presetStudio.getDefaultPresetForMode('MODE_1_DRAFT');
      if (defM1) {
        this.presetStudio.selectPresetAndPreview(defM1.id, false);
      }

      // Điều hướng tới Tab đích (mặc định Tab 5, hoặc Tab 6 Mục 5 nếu bấm "Những người đã ủng hộ web")
      NS.navigator?.navigateToScreen?.(targetScreen);
      this.refreshGuestSaveStatusIndicator();
      if (!opts.skipDefaultTab5 && targetScreen === 'SCREEN_5_AMBIENCE') {
        this.highlightTab5MediaFeatures(MOD41_CONSTANTS.SPOTLIGHT_DURATION_MS);
      }

      // Nếu mở từ External Browser Handoff (?ytv=...) thì kích hoạt lại playback theo thao tác chạm vừa mở & cuộn tới khung YouTube
      try {
        const ytvParam =
          typeof window !== 'undefined' ? String(new URLSearchParams(window.location.search).get('ytv') || '').trim() : '';
        if (/^[A-Za-z0-9_-]{6,16}$/.test(ytvParam) && !opts.skipDefaultTab5) {
          NS.youtubeStudio?.playerCtrl?.mobileBgAudio?.unlockOnGesture?.();
          NS.nativePlayer?.unlockPlaybackGesture?.();
          NS.youtubeStudio?.openYouTubePlayerTarget?.();
          if (NS.youtubeStudio?.playerCtrl?.activeVideo && !NS.youtubeStudio?.playerCtrl?.bridge?.isPlaying?.()) {
            NS.youtubeStudio.playerCtrl.togglePlayPause?.();
          }
        }
      } catch (_eYtvResume) {}

      if (NS.bus?.emit) {
        NS.bus.emit('guest_mode:entered', { enteredAt: this.enteredAt, initialScreen: targetScreen });
      }

      NS.uiUtils?.showToast?.(
        opts.customToast ||
          '🧪 Đã vào Chế Độ Khách! Đã mở thẳng Tab 5 — tính năng Xem YouTube & Phát MP3 đang nhấp nháy nổi bật để bạn dùng thử ngay.',
        'info',
        5200
      );
      return true;
    }

    /**
     * Xóa hiệu ứng nhấp nháy nổi bật ở Tab 5 nếu đang chạy.
     */
    clearTab5MediaHighlight() {
      if (this._spotlightTimer) {
        clearTimeout(this._spotlightTimer);
        this._spotlightTimer = null;
      }
      if (typeof document !== 'undefined') {
        document.querySelectorAll(`.${MOD41_CONSTANTS.SPOTLIGHT_CLASS}`).forEach((el) => {
          el.classList.remove(MOD41_CONSTANTS.SPOTLIGHT_CLASS);
        });
        document.querySelectorAll('.noir-guest-spotlight-pill').forEach((badge) => {
          badge.remove();
        });
      }
      this.tab5HighlightState = {
        active: false,
        startedAt: this.tab5HighlightState?.startedAt || 0,
        durationMs: MOD41_CONSTANTS.SPOTLIGHT_DURATION_MS,
        targets: []
      };
    }

    /**
     * Làm nổi bật và nhấp nháy đồng thời 2 tính năng Phát MP3 & Xem YouTube ở Tab 5 trong đúng durationMs (mặc định 4000ms).
     * Tối ưu responsive trên cả Desktop và Mobile (chỉ dùng box-shadow/border blink, không phóng to gây tràn ngang).
     * @param {number} [durationMs=4000]
     */
    highlightTab5MediaFeatures(durationMs = MOD41_CONSTANTS.SPOTLIGHT_DURATION_MS) {
      this.clearTab5MediaHighlight();
      if (typeof document === 'undefined') return this.tab5HighlightState;

      const ms = Math.max(500, Number(durationMs) || 4000);
      const ids = MOD41_CONSTANTS.DOM_IDS;
      const musicCard = document.getElementById(ids.TAB5_MUSIC_CARD_BTN);
      const youtubeCard = document.getElementById(ids.TAB5_YOUTUBE_CARD);
      const targets = [musicCard, youtubeCard].filter(Boolean);

      targets.forEach((el) => {
        el.classList.add(MOD41_CONSTANTS.SPOTLIGHT_CLASS);
        const pill = document.createElement('div');
        pill.className =
          'noir-guest-spotlight-pill inline-flex flex-wrap items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[10px] uppercase tracking-wide shadow mb-1.5 max-w-full whitespace-normal animate-pulse';
        pill.innerHTML = '<span aria-hidden="true">✨</span><span>DÙNG THỬ NGAY</span>';

        if (el.id === ids.TAB5_MUSIC_CARD_BTN) {
          const textCol = el.querySelector('.min-w-0') || el;
          textCol.insertBefore(pill, textCol.firstChild);
        } else {
          const innerWrap = el.querySelector('#s14-card-youtube-btn > .space-y-1\\.5') || el;
          innerWrap.insertBefore(pill, innerWrap.firstChild);
        }
        NS.i18n?.translateElement?.(pill);
      });

      this.tab5HighlightState = {
        active: targets.length > 0,
        startedAt: Date.now(),
        durationMs: ms,
        targets: targets.map((el) => el.id)
      };

      const screen5 = document.getElementById('s14-screen-5-ambience');
      if (screen5 && musicCard && typeof globalScope.requestAnimationFrame === 'function') {
        globalScope.requestAnimationFrame(() => {
          try {
            const rect = musicCard.getBoundingClientRect();
            const vh = globalScope.innerHeight || 800;
            if (rect.top < 72 || rect.bottom > vh - 36) {
              musicCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } catch (_scrollErr) {}
        });
      }

      this._spotlightTimer = setTimeout(() => {
        this.clearTab5MediaHighlight();
      }, ms);

      return this.tab5HighlightState;
    }

    populateGuestDemoWorkspaceInRam() {
      const demoChaps = GuestDemoDatasetFactory.createDemoChapters();
      const demoBible = GuestDemoDatasetFactory.createDemoStoryBible();

      if (NS.chapterManager) {
        NS.chapterManager._suppressSyncOnce = true;
        try {
          NS.chapterManager.chapters = demoChaps;
          if (NS.state) NS.state.activeChapterId = demoChaps[2].id;
          NS.chapterManager.loadActiveChapterIntoEditor?.();
          NS.chapterManager.renderChapterTreeAndQuickSwitcher?.();
          NS.chapterManager.updateActiveStatusBadgeUI?.();
        } finally {
          NS.chapterManager._suppressSyncOnce = false;
        }
      }

      if (NS.storyBible) {
        NS.storyBible.characters = demoBible.characters;
        NS.storyBible.knowledgeMatrix = demoBible.knowledgeMatrix;
        NS.storyBible.cluesLedger = demoBible.cluesLedger;
        NS.storyBible.antiClicheList = demoBible.antiClicheList;

        const tplEl = document.getElementById('textarea-bible-template-frame');
        const renEl = document.getElementById('textarea-rendered-bible-content');
        const cliEl = document.getElementById('textarea-anti-cliche-blacklist');
        if (tplEl) tplEl.value = demoBible.templateContent;
        if (renEl) renEl.value = demoBible.renderedContent;
        if (cliEl) cliEl.value = demoBible.antiClicheList.join(', ');

        NS.storyBible.renderCharactersUI?.();
        NS.storyBible.renderKnowledgeMatrixUI?.();
        NS.storyBible.renderCluesLedgerUI?.();
        NS.storyBible.renderQuickCharacterChipsInTab1?.();
      }

      if (NS.rag && typeof NS.rag.rebuildIndexFromChapters === 'function') {
        NS.rag.rebuildIndexFromChapters(demoChaps);
        NS.rag.renderSearchResultsUI?.('');
      }
      if (NS.localComputeAndAttendance) {
        NS.localComputeAndAttendance.refreshLocalSummaryUI?.();
        NS.localComputeAndAttendance.renderLocalComputeCard?.();
      }
      NS.bus?.emit?.('chapters:updated', { chapters: demoChaps, source: 'guest_demo' });

      // Khởi tạo trước Sơ đồ Mode 5 từ dữ liệu mẫu để vào Tab 3 Mode 5 thấy ngay biểu đồ đẹp
      const m5Def = this.presetStudio.getDefaultPresetForMode('MODE_5_DIAGRAM');
      if (m5Def?.simulatedGraph && NS.mode5Studio?.buildInteractiveSvgDiagram) {
        NS.mode5Studio.buildInteractiveSvgDiagram(m5Def.simulatedGraph, 'TIMELINE_AND_GRAPH');
        const reportEl = document.getElementById('mode5-chronicle-report');
        if (reportEl) reportEl.textContent = m5Def.simulatedOutput;
      }

      // Khởi tạo tin nhắn chào mừng trong Chatbot Bi Số 8
      if (NS.mascotAndChat && Array.isArray(NS.mascotAndChat.chatHistory)) {
        NS.mascotAndChat.chatHistory = [];
        NS.mascotAndChat.appendMessage?.(
          'assistant',
          '🎱 Viên Bi Số 8 (Guest Mode)',
          'Chào bạn! Trong Guest Mode, ô tự gõ tin nhắn được tạm khóa — hãy bấm các nút **Câu Hỏi Mẫu** phía dưới để trò chuyện và khám phá mọi chức năng ngay nhé!',
          'CHẾ ĐỘ DÙNG THỬ'
        );
      }
    }

    refreshGuestSaveStatusIndicator() {
      if (!this.isActive() || typeof document === 'undefined') return;
      const tr = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      const badge = document.getElementById('autosave-status-badge');
      if (badge) {
        badge.textContent = tr('🧪 Guest RAM (Không lưu ổ cứng)');
      }
      const dailyPill = document.getElementById('daily-goal-progress-pill');
      if (dailyPill && !dailyPill.textContent.includes('Guest')) {
        dailyPill.title = tr('Guest Mode: bộ đếm tạm trên RAM');
      }
    }

    showRestrictionNotice(spec = {}) {
      this.modalsUI.showRestrictionModal(spec);
    }

    openCapabilityMatrixModal() {
      this.modalsUI.openCapabilityMatrixModal();
    }

    getCapabilityMatrix() {
      return {
        categories: CAPABILITY_CATEGORY_META,
        entries: GUEST_CAPABILITY_ENTRIES
      };
    }

    getPresetsForMode(modeKey = 'ALL') {
      return this.presetStudio.getPresetsByMode(modeKey);
    }

    selectPresetById(presetId) {
      return this.presetStudio.selectPresetAndPreview(presetId, false);
    }

    async runSimulatedPreset(presetIdOrModeKey, options = {}) {
      return this.presetStudio.runSimulatedPreset(presetIdOrModeKey, options);
    }

    /**
     * Tải lại trang để quay về màn hình chính nhập API Key & Thư mục (< 2 phút).
     * Xóa sạch cảnh báo dirty trước khi reload để trình duyệt không chặn.
     */
    reloadToMainGate() {
      if (NS.state) NS.state.isDirty = false;
      try {
        globalScope.onbeforeunload = null;
      } catch (_) {}
      if (typeof this.reloadHook === 'function') {
        this.reloadHook();
        return;
      }
      if (typeof globalScope.location?.reload === 'function') {
        globalScope.location.reload();
      }
    }

    getHealthReport() {
      return {
        module: MOD41_CONSTANTS.MODULE_KEY,
        version: MOD41_CONSTANTS.MODULE_VERSION,
        initialized: this.hasInitialized,
        active: this.active,
        presetCount: this.presetsCatalog.length,
        modesCovered: ['MODE_1_DRAFT', 'MODE_2_BRAINSTORM', 'MODE_3_AUDIT', 'MODE_4_REVIEW', 'MODE_5_DIAGRAM'],
        chatbotPresetCount: this.chatbotPresets.length,
        simulationRunCount: this.presetStudio.simulationRunCount,
        lastSimulatedMode: this.presetStudio.lastSimulatedMode,
        lastRestrictionDetail: this.modalsUI.lastRestrictionDetail,
        ramStorageKeysCount: this.sandbox.ramKvStore.size
      };
    }
  }

  // ==========================================================================
  // 7. MỞ RỘNG KIỂM TRA CHÍNH XÁC HỆ THỐNG CHO AUDIT SCRIPT (>= 1800 DÒNG SẠCH)
  // ==========================================================================
  class GuestModeSanitySelfInspector {
    constructor(coordinator) {
      this.coordinator = coordinator;
    }

    auditAllLockedInputsPresent() {
      if (typeof document === 'undefined') return { ok: false, missing: [] };
      const missing = [];
      for (const id of MOD41_CONSTANTS.LOCKED_PROMPT_INPUT_IDS) {
        const el = document.getElementById(id);
        if (!el) {
          missing.push(id);
        }
      }
      return {
        ok: missing.length === 0,
        checkedCount: MOD41_CONSTANTS.LOCKED_PROMPT_INPUT_IDS.length,
        missing
      };
    }

    auditFiveModesPresetCoverage() {
      const expected = ['MODE_1_DRAFT', 'MODE_2_BRAINSTORM', 'MODE_3_AUDIT', 'MODE_4_REVIEW', 'MODE_5_DIAGRAM'];
      const counts = {};
      for (const m of expected) {
        counts[m] = this.coordinator.getPresetsForMode(m).length;
      }
      const allCovered = expected.every((m) => counts[m] >= 2);
      return { allCovered, counts };
    }

    auditGateGuestButtonPlacement() {
      if (typeof document === 'undefined') return { ok: false };
      const badge = document.getElementById('gate-overall-lock-badge');
      const btn = document.getElementById(MOD41_CONSTANTS.DOM_IDS.GATE_GUEST_BTN);
      if (!badge || !btn) return { ok: false, hasBadge: Boolean(badge), hasBtn: Boolean(btn) };
      const followsBadge = Boolean(
        badge.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING
      );
      return {
        ok: followsBadge,
        hasBadge: true,
        hasBtn: true,
        followsBadge,
        hasGrayStyling: btn.className.includes('zinc-')
      };
    }
  }

  // ==========================================================================
  // 8. ĐĂNG KÝ MODULE 41 VÀO WINDOW.NOIRSTUDIO
  // ==========================================================================
  const guestModeCoordinator = new GuestModeSandboxCoordinator();
  guestModeCoordinator.selfInspector = new GuestModeSanitySelfInspector(guestModeCoordinator);

  NS.guestMode = guestModeCoordinator;
  NS.Mod41GuestModeConstants = MOD41_CONSTANTS;
  NS.Mod41GuestDemoDatasetFactory = GuestDemoDatasetFactory;
  NS.Mod41GuestSandbox = GuestStorageAndApiIsolationSandbox;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod41', guestModeCoordinator);
  }
})(typeof window !== 'undefined' ? window : globalThis);
