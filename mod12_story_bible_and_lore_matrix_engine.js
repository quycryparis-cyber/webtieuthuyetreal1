/**
 * ============================================================================
 * ✍️ WEB VIẾT TIỂU THUYẾT CỦA BI — MODULE 12 (v38.0 SUPREME EDITION)
 * ============================================================================
 * Tệp: mod12_story_bible_and_lore_matrix_engine.js
 * Chức năng chính:
 *   1. Hệ thống Quản trị Story Bible Chính Thức & Khung Cấu Trúc Mẫu (Template
 *      Frame) tại Tab 4 (StoryBibleAndLoreMatrixEngine — window.NoirStudio.storyBible).
 *   2. Kho Mẫu Story Bible Chuyên Sâu theo 6 Thể loại lớn:
 *      - Light Novel (Fantasy / Học Viện / Dị Giới)
 *      - Trinh Thám — Tâm Lý Noir
 *      - Tiên Hiệp — Tu Chân Cổ Điển
 *      - Đô Thị — Tâm Lý & Thương Trường
 *      - Huyền Huyễn — Cổ Đại Phương Đông
 *      - Khoa Huyễn — Cyberpunk / Hậu Tận Thế
 *   3. Hồ Sơ Nhân Vật Đa Chiều, Thư viện Hình mẫu Tâm lý (Archetypes), Ma trận
 *      Quan hệ & Quy tắc Xưng hô Tiếng Việt chuẩn xác, đồng bộ trực tiếp với
 *      thanh Chèn Thoại Nhanh (#quick-character-chips-bar) tại Bàn viết Tab 1.
 *   4. Ma Trận Bất Đối Xứng "Ai Biết Gì" (Asymmetric Knowledge Matrix) giúp
 *      ngăn chặn triệt để lỗi AI để nhân vật nói/nghĩ về bí mật chưa được tiết lộ.
 *   5. Sổ Cái Phục Bút & Manh Mối (Chekhov's Gun Ledger) theo dõi trạng thái
 *      Gieo manh mối (PLANTED) ➔ Bồi đắp ➔ Thu hồi (RESOLVED).
 *   6. Danh Sách Từ Sáo Rỗng Cấm AI Sử Dụng (Anti-Cliché Blacklist) & Biên dịch
 *      100% toàn bộ dữ liệu thành Khối Ngữ Cảnh Story Bible chuẩn mực nạp vào
 *      Prompt Tổng Hợp Chính Thức (buildCompiledBibleBlockForPrompt).
 * ============================================================================
 */
(function () {
  'use strict';

  if (window.__NOIR_MOD12_STORY_BIBLE_LOADED__) return;
  window.__NOIR_MOD12_STORY_BIBLE_LOADED__ = true;

  window.NoirStudio = window.NoirStudio || {
    state: {
      activeScreen: 'SCREEN_1_WRITE',
      activeChapterId: null,
      chapterFilter: 'ALL',
      isSaving: false,
      isDirty: false,
      lastSavedAt: Date.now()
    }
  };

  // ==========================================================================
  // PHẦN 1: KHO MẪU KHUNG CẤU TRÚC STORY BIBLE THEO 6 THỂ LOẠI TIỂU THUYẾT
  // ==========================================================================
  const STORY_BIBLE_GENRE_PRESETS = {
    DEFAULT_UNIVERSAL: {
      id: 'DEFAULT_UNIVERSAL',
      label: '🏛️ Khung Chuẩn Đa Năng (Light Novel / Tiểu Thuyết Hiện Đại)',
      badge: 'Mặc định chuẩn',
      templateText: [
        '=== [I. BỐI CẢNH THẾ GIỚI & QUY TẮC BẤT KHẢ XÂM PHẠM] ===',
        '- Thời đại & Không gian chính: Thành phố cảng sương mù những năm 2020, nơi giao thoa giữa những khu phố cổ trầm mặc và các tòa tháp tài chính hiện đại.',
        '- Hệ thống quy luật cốt lõi: Mọi sự kiện đều tuân theo logic tâm lý và nhân quả thực tế; không có phép màu giải cứu vô lý (No Deus Ex Machina).',
        '- Những điều tuyệt đối không được mâu thuẫn: Trình tự ngày giờ giữa các chương, vết thương thể chất của nhân vật, và giới hạn thông tin mỗi người nắm giữ.',
        '',
        '=== [II. HỒ SƠ NHÂN VẬT TRUNG TÂM & GIỌNG ĐIỆU ĐỐI THOẠI] ===',
        '- Nhân vật chính (Tính cách, mục tiêu, vết thương tâm lý, thói quen ăn nói): Điềm tĩnh, quan sát sắc bén từng cử chỉ nhỏ của người đối diện, câu thoại ngắn gọn nhưng giàu ẩn ý.',
        '- Các nhân vật phụ quan trọng & Mạng lưới quan hệ: Đồng sự, đối thủ ngầm, người nắm giữ ký ức quá khứ.',
        '- Quy ước định dạng câu thoại bắt buộc: Luôn viết theo chuẩn "- Câu nói của nhân vật (Tên nhân vật)".',
        '',
        '=== [III. TÓM TẮT DIỄN BIẾN CÁC CHƯƠNG ĐÃ DUYỆT] ===',
        '- Trục sự kiện đã xảy ra: Khởi đầu từ cuộc gặp gỡ định mệnh trong đêm mưa, phát hiện manh mối đầu tiên dẫn tới chuỗi bí mật bị chôn vùi.',
        '',
        '=== [IV. PHỤC BÚT ĐANG GIEO & BÍ MẬT CHƯA TIẾT LỘ] ===',
        '- Các manh mối đang chờ thu hồi: Chiếc đồng hồ quả quýt ngừng chạy lúc 23:15; bức thư không đề tên người gửi.',
        '- Định hướng cao trào sắp tới: Cuộc đối chất trực diện tại tầng thượng khi bức màn sự thật dần hé mở.'
      ].join('\n'),
      sampleAntiCliche: [
        'một luồng điện chạy dọc sống lưng',
        'thở dài một tiếng',
        'ánh mắt phức tạp',
        'khẽ nhếch môi tạo thành một vòng cung',
        'không khỏi cảm thán trong lòng',
        'trong lòng dâng lên một cảm giác khó tả',
        'bầu không khí bỗng trở nên tĩnh lặng đến đáng sợ',
        'nụ cười nửa miệng đầy ẩn ý'
      ]
    },

    LIGHT_NOVEL_FANTASY: {
      id: 'LIGHT_NOVEL_FANTASY',
      label: '⚔️ Light Novel — Học Viện Giả Tưởng & Dị Giới (Fantasy / Isekai)',
      badge: 'Light Novel',
      templateText: [
        '=== [I. THẾ GIỚI QUAN, ĐỊA LÝ & HỆ THỐNG MA THUẬT / KỸ NĂNG] ===',
        '- Đại lục & Quốc gia trung tâm: Đế quốc Aethelgard và Học viện Thánh Kiếm Hoàng Gia tọa lạc trên đảo nổi giữa hồ Thiên Kính.',
        '- Nguồn gốc & Cấp bậc Sức mạnh: Hệ thống Ma Mạch 7 Tầng (Khởi Nguyên ➔ Cộng Hưởng ➔ Kết Tinh ➔ Linh Hồn ➔ Vực Sâu ➔ Thánh Vực ➔ Thần Thoại).',
        '- Cái giá của Sức mạnh (Giới hạn bắt buộc): Mỗi lần thi triển ma pháp vượt cấp sẽ làm đóng băng một phần xúc cảm hoặc hao tổn tuổi thọ; tuyệt đối không được dùng kỹ năng tối thượng liên tục mà không chịu phản phệ.',
        '',
        '=== [II. DÀN NHÂN VẬT CHÍNH & ĐẶC TRƯNG TƯƠNG TÁC LIGHT NOVEL] ===',
        '- Nam/Nữ chính (Tính cách, năng lực ẩn giấu, thói quen đời thường): Bề ngoài tỏ ra lười biếng, thích ngồi góc thư viện đọc sách cổ, nhưng thực chất là người duy nhất giải mã được Cổ Ngữ Thất Lạc.',
        '- Đồng đội / Nữ chính đồng hành: Kiếm sĩ thiên tài kiêu hãnh nhưng vụng về trong giao tiếp đời thường; Pháp sư giả kim tinh quái.',
        '- Quy tắc Xưng hô & Hội thoại: Giữ nhịp đối thoại tung hứng tự nhiên, giàu hình ảnh biểu cảm (Show, Don\'t Tell), định dạng "- Câu thoại (Tên nhân vật)".',
        '',
        '=== [III. NHẬT KÝ HÀNH TRÌNH & CÁC ARC CỐT TRUYỆN ĐÃ QUA] ===',
        '- Arc 1 (Khởi đầu): Kỳ thi tuyển sinh đẫm máu dưới Mê Cung Ngầm và sự thức tỉnh của Di Vật Cổ Đại.',
        '- Những thay đổi về trang bị / cấp độ hiện tại của nhóm nhân vật chính.',
        '',
        '=== [IV. BÍ MẬT THẾ GIỚI & PHỤC BÚT ĐANG CÀI CẮM] ===',
        '- Chân tướng về cuộc Đại Chiến Trăm Năm Trước bị giáo hội viết lại lịch sử.',
        '- Ấn ký kỳ lạ trên mu bàn tay trái của nhân vật chính chỉ phát sáng khi tới gần di tích cổ.'
      ].join('\n'),
      sampleAntiCliche: [
        'sát khí nồng đậm đến mức thực chất hóa',
        'hít vào một ngụm khí lạnh',
        'cằm muốn rớt xuống đất',
        'ánh mắt lóe lên tia sáng sắc lạnh',
        'một luồng sức mạnh hủy thiên diệt địa',
        'khẽ nhếch môi tạo thành một vòng cung'
      ]
    },

    TRINH_THAM_TAM_LY_NOIR: {
      id: 'TRINH_THAM_TAM_LY_NOIR',
      label: '🕵️ Trinh Thám — Tâm Lý Tội Phạm & Đấu Trí Noir',
      badge: 'Trinh Thám Noir',
      templateText: [
        '=== [I. BỐI CẢNH KHÔNG GIAN, THỜI GIAN & LUẬT TRINH THÁM CÔNG BẰNG] ===',
        '- Không gian vụ án: Biệt thự cổ biệt lập trên đồi sương mù / Khu chung cư cũ kỹ ngập trong mưa đêm tháng Mười Một.',
        '- Khung thời gian nghiệm尸 & Bằng chứng ngoại phạm (Alibi): Mọi mốc giờ đều phải khớp chính xác từng phút từ 21:00 đến 03:00 sáng.',
        '- Luật Công Bằng Trinh Thám (Knox\'s Decalogue): Mọi manh mối suy luận ra hung thủ đều phải được mô tả tinh tế trước mắt độc giả trước khi phá án; cấm tuyệt đối việc hung thủ là nhân vật chưa từng xuất hiện.',
        '',
        '=== [II. HỒ SƠ ĐIỀU TRA VIÊN & CÁC NGHI PHẠM TRỌNG ĐIỂM] ===',
        '- Điều tra viên / Nhân vật chính: Sắc sảo, mắc chứng mất ngủ kinh niên, luôn chú ý tới những vết xước trên giày, mùi khói thuốc và nhịp chớp mắt khi người khác nói dối.',
        '- Danh sách Nghi phạm (Động cơ, Cơ hội, Điểm khuất tất):',
        '  1. Nghi phạm A: Có mặt tại hiện trường lúc 22:30 nhưng khai báo gian dối.',
        '  2. Nghi phạm B: Nắm giữ di chúc / tài liệu mật liên quan tới nạn nhân.',
        '',
        '=== [III. BIÊN BẢN HIỆN TRƯỜNG & DIỄN BIẾN ĐIỀU TRA ĐÃ DUYỆT] ===',
        '- Các vật chứng đã thu thập hợp lệ.',
        '- Các lời khai đã được kiểm chứng và những điểm mâu thuẫn đang chờ bóc trần.',
        '',
        '=== [IV. MANH MỐI THẬT VS CÁ TRÍCH ĐỎ (RED HERRING)] ===',
        '- Manh mối đánh lạc hướng (Red Herring): Vết máu trên rèm cửa thực chất được tạo ra sau khi nạn nhân đã tử vong.',
        '- Chìa khóa phá án thật sự: Nhiệt độ tách trà trên bàn và chiếc đồng hồ đeo tay bị chỉnh lệch 15 phút.'
      ].join('\n'),
      sampleAntiCliche: [
        'một luồng điện chạy dọc sống lưng',
        'bầu không khí bỗng trở nên tĩnh lặng đến đáng sợ',
        'ánh mắt sắc như dao cạo',
        'nụ cười nửa miệng đầy ẩn ý',
        'trực giác mách bảo rằng',
        'không khí đặc quánh lại'
      ]
    },

    TIEN_HIEP_CO_DIEN: {
      id: 'TIEN_HIEP_CO_DIEN',
      label: '🏔️ Tiên Hiệp — Tu Chân Cổ Điển & Đại Đạo Tranh Phong',
      badge: 'Tiên Hiệp',
      templateText: [
        '=== [I. CẢNH GIỚI TU HÀNH, THIÊN ĐỊA QUY TẮC & ĐỊA ĐỒ TU CHÂN GIỚI] ===',
        '- Hệ thống Cảnh giới: Luyện Khí ➔ Trúc Cơ ➔ Kim Đan ➔ Nguyên Anh ➔ Hóa Thần ➔ Luyện Hư ➔ Hợp Thể ➔ Đại Thừa ➔ Độ Kiếp.',
        '- Quy luật Thiên Đạo & Tâm Ma: Tu hành không chỉ là tích lũy linh lực mà là quá trình minh ngộ bản tâm; kẻ sát phạt vô độ tất sinh Tâm Ma khi độ kiếp.',
        '- Thế lực & Tông môn: Cửu Đại Tiên Môn vùng Trung Châu, Yêu Tộc Bắc Hoang, và các Cổ Tộc ẩn thế.',
        '',
        '=== [II. ĐẠO TÂM NHÂN VẬT CHÍNH & QUY TẮC NGÔN TỪ CỔ PHONG] ===',
        '- Nhân vật chính (Đạo tâm, Công pháp, Pháp bảo bản mệnh): Xuất thân bình phàm nơi sơn thôn, tính tình kiên nghị, trọng tình nghĩa nhưng quyết đoán trước kẻ thù.',
        '- Pháp bảo & Linh vật đang sở hữu (Ghi rõ công năng và hạn chế để không bị "buff" quá đà).',
        '- Giọng văn & Xưng hô: Điềm đạm, mang âm hưởng cổ điển trang nhã (xưng "ta - đạo hữu / tiền bối / sư huynh"), tránh dùng từ ngữ hiện đại lạc quẻ.',
        '',
        '=== [III. TRỤC SỰ KIỆN TU HÀNH QUA CÁC CHƯƠNG ĐÃ DUYỆT] ===',
        '- Cảnh giới hiện tại, thương thế đang điều trị và số lượng linh thạch / đan dược còn lại.',
        '',
        '=== [IV. NHÂN QUẢ CHƯA LIỄU KẾT & BÍ CẢNH SẮP MỞ] ===',
        '- Ân oán với cố nhân từ thuở vi mạt.',
        '- Bí mật đằng sau mảnh ngọc giản tàn khuyết tìm thấy dưới đáy Hàn Đàm.'
      ].join('\n'),
      sampleAntiCliche: [
        'hít vào một ngụm khí lạnh',
        'khủng bố như斯',
        'một cỗ uy áp hủy thiên diệt địa',
        'nhếch miệng cười lạnh',
        'con kiến hôi mà cũng dám',
        'sát ý ngập trời'
      ]
    },

    DO_THI_THUONG_TRUONG: {
      id: 'DO_THI_THUONG_TRUONG',
      label: '🏙️ Đô Thị Hiện Đại — Tâm Lý Xã Hội & Đấu Trí Thương Trường',
      badge: 'Đô Thị',
      templateText: [
        '=== [I. BỐI CẢNH XÃ HỘI, KINH TẾ & QUY LUẬT THƯƠNG TRƯỜNG] ===',
        '- Không gian chính: Đô thị tài chính sầm uất, nơi các tập đoàn công nghệ và bất động sản cạnh tranh từng phần trăm cổ phần.',
        '- Quy tắc thực tế: Mọi kế hoạch thâu tóm, đầu tư, đàm phán đều phải tuân theo quy trình tài chính, pháp lý và tâm lý học hành vi hợp lý; không hạ thấp trí thông minh của đối thủ.',
        '',
        '=== [II. HỒ SƠ NHÂN VẬT, ĐỊA VỊ & PHONG THÁI GIAO TIẾP] ===',
        '- Nhân vật chính: Từng trải qua biến cố phá sản năm 25 tuổi, nay trở lại với tư duy chiến lược sắc lạnh, thấu hiểu lòng người, giữ khoảng cách lịch thiệp nhưng khó đoán.',
        '- Đối tác, Tri kỷ & Đối thủ cạnh tranh: Mỗi nhân vật đều có lợi ích riêng, gia cảnh riêng và điểm yếu tình cảm riêng.',
        '',
        '=== [III. TIẾN ĐỘ DỰ ÁN & DIỄN BIẾN CÁC CHƯƠNG ĐÃ DUYỆT] ===',
        '- Tình hình nguồn vốn, các hợp đồng đã ký và những cái bẫy tài chính đang giăng ra.',
        '',
        '=== [IV. QUÂN BÀI TẨY & BƯỚC NGOẶT TÂM LÝ] ===',
        '- Bản hợp đồng phụ lục chưa công bố.',
        '- Mối liên hệ thật sự giữa người cộng sự thân tín và tập đoàn đối thủ.'
      ].join('\n'),
      sampleAntiCliche: [
        'tổng tài bá đạo',
        'trong vòng ba phút tôi muốn có toàn bộ thông tin',
        'khẽ nhếch môi tạo thành một vòng cung',
        'ánh mắt phức tạp',
        'thở dài một tiếng',
        'bầu không khí bỗng trở nên tĩnh lặng đến đáng sợ'
      ]
    },

    HUYEN_HUYEN_KY_AO: {
      id: 'HUYEN_HUYEN_KY_AO',
      label: '🐉 Huyền Huyễn — Thần Thoại Phương Đông & Cổ Giới Bí Ẩn',
      badge: 'Huyền Huyễn',
      templateText: [
        '=== [I. KỶ NGUYÊN THẦN THOẠI, DỊ TƯỢNG & QUY LUẬT CỔ GIỚI] ===',
        '- Bối cảnh: Thế giới hậu Hoàng Hôn Chư Thần, khi tàn tích của các vị thần cổ đại hóa thành những vùng Cấm Khu sương mù vĩnh cửu.',
        '- Hệ thống Huyết Mạch & Cổ Tự: Con người thức tỉnh năng lực thông qua việc giải mã Thần Văn khắc trên xương cốt thượng cổ.',
        '',
        '=== [II. HỒ SƠ NHÂN VẬT & KHÍ CHẤT VĂN CHƯƠNG] ===',
        '- Nhân vật chính: Người gác đèn nơi biên ải Bắc Cảnh, mang trong người dòng máu lai giữa Phàm nhân và Cổ Thần đã tuyệt tích.',
        '- Giọng văn chủ đạo: Hùng tráng, giàu chất thơ bi tráng, miêu tả thiên nhiên hùng vĩ gắn liền với nỗi cô độc của con người.',
        '',
        '=== [III. BIÊN NIÊN SỬ HÀNH TRÌNH ĐÃ DUYỆT] ===',
        '- Các vùng đất đã đi qua, các thần vật đã thu thập và những lời thề sinh tử.',
        '',
        '=== [IV. LỜI TIÊN TRI CỔ ĐẠI & PHỤC BÚT CHƯA MỞ] ===',
        '- Tiếng chuông đồng vọng ra từ đáy biển mỗi đêm trăng máu.',
        '- Thân phận thật sự của thiếu nữ mù bán hoa giấy ở thành Trường An.'
      ].join('\n'),
      sampleAntiCliche: [
        'một luồng điện chạy dọc sống lưng',
        'hít vào một ngụm khí lạnh',
        'ánh mắt phức tạp',
        'không khỏi cảm thán trong lòng',
        'sát khí ngút trời'
      ]
    }
  };

  // ==========================================================================
  // PHẦN 2: THƯ VIỆN 12 HÌNH MẪU NHÂN VẬT VĂN HỌC (CHARACTER ARCHETYPES)
  // ==========================================================================
  const CHARACTER_ARCHETYPE_LIBRARY = [
    {
      id: 'ARCH_STRATEGIST',
      label: '♟️ Quân Sư Điềm Tĩnh / Kẻ Điều Khiển Sau Màn',
      role: 'Nhân vật chính / Quân sư trung tâm',
      traits:
        'Điềm tĩnh trước mọi biến cố, luôn tính trước ba bước, hiếm khi bộc lộ cảm xúc thật trên gương mặt, có thói quen gõ nhẹ ngón trỏ lên mặt bàn khi suy nghĩ.',
      speechStyle:
        'Câu văn ngắn gọn, lịch thiệp nhưng sắc bén, thường trả lời câu hỏi bằng một câu hỏi ngược lại; xưng "tôi - cậu" hoặc "tôi - anh/chị".',
      innerWound: 'Từng vì một quyết định quá lý trí trong quá khứ mà đánh mất người đồng đội thân thiết nhất.',
      defaultRelation: 'Giữ khoảng cách an toàn nhưng âm thầm bảo vệ người mình trân trọng'
    },
    {
      id: 'ARCH_DETECTIVE_NOIR',
      label: '🕵️ Thám Tử Trầm Mặc / Điều Tra Viên Ám Ảnh',
      role: 'Nhân vật chính (Trinh thám / Tâm lý)',
      traits:
        'Quan sát vi biểu cảm cực nhạy, mắc chứng mất ngủ, trí nhớ hình ảnh siêu phàm, bề ngoài có vẻ bất cần nhưng mang lòng trắc ẩn sâu sắc với kẻ yếu.',
      speechStyle:
        'Giọng trầm khàn, pha chút châm biếm nhẹ, đi thẳng vào trọng tâm sự thật; xưng "tôi - ông/bà/anh/cô".',
      innerWound: 'Vụ án đầu tiên trong sự nghiệp vẫn còn một mảnh ghép chưa được đưa ra ánh sáng.',
      defaultRelation: 'Hoài nghi mọi lời khai cho tới khi có vật chứng xác thực'
    },
    {
      id: 'ARCH_SWORD_PRODIGY',
      label: '⚔️ Kiếm Khách Cô Độc / Thiên Tài Lạnh Lùng',
      role: 'Đồng hành chủ lực / Đối thủ truyền kiếp',
      traits:
        'Kỷ luật thép, kiệm lời, chỉ tin vào lưỡi kiếm trong tay, nhưng lại bối rối trước những cử chỉ quan tâm đời thường.',
      speechStyle:
        'Cực kỳ ngắn gọn, hiếm khi nói quá hai câu liên tiếp, âm điệu dứt khoát; xưng "ta - ngươi" hoặc "tôi - cậu".',
      innerWound: 'Gánh vác trách nhiệm phục hưng gia tộc/tông môn đã suy tàn sau một đêm huyết chiến.',
      defaultRelation: 'Ngoài lạnh trong nóng, sẵn sàng chắn mũi kiếm cho đồng đội'
    },
    {
      id: 'ARCH_CHARMING_RIVAL',
      label: '🎭 Phản Diện Lịch Lãm / Đối Thủ Đấu Trí Xứng Tầm',
      role: 'Phản diện trung tâm / Đối trọng trí tuệ',
      traits:
        'Phong thái quý tộc, uyên bác, yêu nghệ thuật và âm nhạc cổ điển, không bao giờ nổi giận mất kiểm soát, coi cuộc đối đầu với nhân vật chính là một ván cờ nghệ thuật.',
      speechStyle:
        'Từ tốn, giàu triết lý và ẩn dụ, luôn mỉm cười lịch sự ngay cả khi đang dồn đối phương vào chân tường; xưng "tôi - ngài/bạn hiền".',
      innerWound: 'Tin rằng thế giới hiện tại đã mục nát và cần một trật tự mới dù phải đánh đổi bằng máu.',
      defaultRelation: 'Vừa là kẻ thù nguy hiểm nhất, vừa là người hiểu nhân vật chính sâu sắc nhất'
    },
    {
      id: 'ARCH_BRIGHT_COMPANION',
      label: '🌟 Đồng Đội Nhiệt Huyết / Ánh Dương Giữa Đêm Tối',
      role: 'Bạn đồng hành / Điểm tựa tinh thần',
      traits:
        'Tràn đầy năng lượng, trực giác nhạy bén, trung thành tuyệt đối, là sợi dây kéo nhân vật chính trở về với nhân tính khi đứng trước vực thẳm.',
      speechStyle:
        'Tự nhiên, sinh động, giàu cảm xúc, đôi khi nói nhanh khi hào hứng; xưng "tớ - cậu" hoặc "em - anh/chị".',
      innerWound: 'Che giấu nỗi sợ bị bỏ lại phía sau dưới nụ cười rạng rỡ thường trực.',
      defaultRelation: 'Tin tưởng nhân vật chính vô điều kiện'
    },
    {
      id: 'ARCH_MYSTERIOUS_MENTOR',
      label: '🕯️ Người Dẫn Đường Bí Ẩn / Tiền Bối Ẩn Thế',
      role: 'Sư phụ / Người nắm giữ bí mật cổ xưa',
      traits:
        'Thâm sâu khó lường, thường xuất hiện ở những quán trà nhỏ hoặc hiệu sách cũ, nắm giữ nửa sự thật về nguồn gốc thế giới.',
      speechStyle:
        'Điềm đạm, pha chút hài hước từng trải, hay gợi mở thay vì nói toạc đáp án; xưng "ta - con/tiểu hữu" hoặc "lão - cậu".',
      innerWound: 'Mang thương tích vĩnh viễn từ cuộc chiến của thế hệ trước.',
      defaultRelation: 'Dẫn dắt nhưng để nhân vật chính tự lựa chọn con đường của mình'
    },
    {
      id: 'ARCH_DOUBLE_AGENT',
      label: '🦊 Kẻ Hai Mặt / Người Cung Cấp Tình Báo Chợ Đen',
      role: 'Trung lập / Nhân vật bẻ lái cốt truyện',
      traits:
        'Linh hoạt, thực dụng, giỏi cải trang và thu thập tin tức, luôn đặt lợi ích lên bàn cân nhưng vẫn có một giới hạn đạo đức riêng không bao giờ bước qua.',
      speechStyle:
        'Khéo léo, nửa đùa nửa thật, hay dùng thành ngữ hoặc lối nói vòng vo; xưng "tôi - quý khách / người anh em".',
      innerWound: 'Không có quê hương hay chốn dung thân thực sự.',
      defaultRelation: 'Hợp tác theo giao kèo nhưng nhiều lần cứu nguy bất ngờ'
    },
    {
      id: 'ARCH_TRAGIC_HEIRESS',
      label: '❄️ Tiểu Thư Gia Tộc Suy Tàn / Nữ Chính Nội Tâm Sâu Sắc',
      role: 'Nữ chính / Nhân vật trung tâm mạch tình cảm & chính trị',
      traits:
        'Kiên cường dưới vẻ ngoài mong manh, thông tuệ lễ nghi và mưu lược gia tộc, không bao giờ khóc trước mặt kẻ thù.',
      speechStyle:
        'Chuẩn mực, dịu dàng nhưng ẩn chứa sự kiên định không thể lay chuyển; xưng "tôi - anh" hoặc "thiếp/ta - chàng/huynh".',
      innerWound: 'Bị cuốn vào vòng xoáy tranh giành quyền lực ngay từ thuở niên thiếu.',
      defaultRelation: 'Ban đầu đề phòng nhân vật chính, sau trở thành tri kỷ đồng sinh cộng tử'
    }
  ];

  /**
   * Hàm lấy STUDIO_CONSTANTS an toàn tuyệt đối
   */
  function getStudioConstants() {
    if (window.NoirStudio && window.NoirStudio.constants) {
      return window.NoirStudio.constants;
    }
    return {
      STORES: {
        WORKSPACE_HANDLES: 'workspace_handles',
        CHAPTERS: 'chapters',
        STORY_BIBLE: 'story_bible',
        RAG_CHUNKS: 'rag_chunks',
        STATE_CACHE: 'state_cache'
      },
      STORAGE_KEYS: {
        BIBLE_TEMPLATE: 'noir_s10_bible_template_frame',
        BIBLE_RENDERED: 'noir_s10_rendered_bible_content',
        BIBLE_LOCKED: 'noir_s10_bible_template_locked',
        CHARACTERS: 'noir_s10_character_profiles_v1',
        KNOWLEDGE_MATRIX: 'noir_s10_knowledge_matrix_v1',
        CLUES_LEDGER: 'noir_s10_clues_ledger_v1',
        ANTI_CLICHE: 'noir_s10_anti_cliche_blacklist_v1'
      },
      DEFAULT_ANTI_CLICHE: STORY_BIBLE_GENRE_PRESETS.DEFAULT_UNIVERSAL.sampleAntiCliche
    };
  }

  // ==========================================================================
  // PHẦN 3: MA TRẬN QUAN HỆ NHÂN VẬT & TỪ ĐIỂN XƯNG HÔ TIẾNG VIỆT ĐA THỂ LOẠI
  // ==========================================================================
  const VIETNAMESE_PRONOUN_PRESETS = {
    MODERN_PEER_CALM: {
      id: 'MODERN_PEER_CALM',
      label: 'Современ / Hiện đại: "Tôi — Cậu" (Bình đẳng, điềm tĩnh, Light Novel)',
      selfPronoun: 'tôi',
      targetPronoun: 'cậu',
      toneNote: 'Giữ khoảng cách vừa phải, lịch sự nhưng có chiều sâu nội tâm'
    },
    MODERN_ROMANCE_WARM: {
      id: 'MODERN_ROMANCE_WARM',
      label: 'Hiện đại / Tình cảm: "Anh — Em" (Gần gũi, ấm áp hoặc giằng xé)',
      selfPronoun: 'anh',
      targetPronoun: 'em',
      toneNote: 'Thích hợp cho quan hệ tình cảm, tiền bối — hậu bối thân thiết'
    },
    MODERN_FORMAL_NOIR: {
      id: 'MODERN_FORMAL_NOIR',
      label: 'Trinh thám / Công sở: "Tôi — Ông/Bà/Anh/Chị" (Chuẩn mực, điều tra)',
      selfPronoun: 'tôi',
      targetPronoun: 'anh/chị',
      toneNote: 'Ngôn ngữ sắc lạnh, khách quan, dùng khi thẩm vấn hoặc đàm phán'
    },
    YOUTH_SCHOOL_LN: {
      id: 'YOUTH_SCHOOL_LN',
      label: 'Học đường / Thanh xuân: "Tớ — Cậu" (Trẻ trung, trong sáng)',
      selfPronoun: 'tớ',
      targetPronoun: 'cậu',
      toneNote: 'Nhịp thoại nhanh, giàu biểu cảm tuổi học trò'
    },
    ANCIENT_EQUAL_DAO: {
      id: 'ANCIENT_EQUAL_DAO',
      label: 'Tiên hiệp / Cổ trang: "Ta — Đạo hữu / Các hạ" (Ngang hàng, khách khí)',
      selfPronoun: 'ta',
      targetPronoun: 'đạo hữu',
      toneNote: 'Văn phong cổ nhã, dùng giữa các tu sĩ hoặc kiếm khách'
    },
    ANCIENT_SENIOR_JUNIOR: {
      id: 'ANCIENT_SENIOR_JUNIOR',
      label: 'Tiên hiệp / Sư môn: "Vãn bối / Đệ tử — Tiền bối / Sư tôn"',
      selfPronoun: 'vãn bối',
      targetPronoun: 'tiền bối',
      toneNote: 'Tôn kính, giữ lễ tiết tôn ti trật tự trong tông môn'
    },
    ANCIENT_SUPREME_OVERLORD: {
      id: 'ANCIENT_SUPREME_OVERLORD',
      label: 'Bá giả / Thượng vị: "Bổn tọa / Ta — Ngươi" (Uy nghiêm, áp đảo)',
      selfPronoun: 'bổn tọa',
      targetPronoun: 'ngươi',
      toneNote: 'Dùng cho cường giả đỉnh phong hoặc phản diện bề trên'
    },
    ROYAL_NOBLE_FANTASY: {
      id: 'ROYAL_NOBLE_FANTASY',
      label: 'Quý tộc / Hoàng gia Âu cổ: "Thần / Tôi — Điện hạ / Ngài"',
      selfPronoun: 'tôi',
      targetPronoun: 'Ngài',
      toneNote: 'Trang trọng, lịch lãm kiểu Light Novel Fantasy phương Tây'
    }
  };

  /**
   * Động cơ Quản lý Quan hệ Đa chiều & Kiểm toán Nhất quán Xưng hô Nhân vật
   */
  class VietnamesePronounAndRelationshipMatrixEngine {
    constructor(idb) {
      this.idb = idb;
      this.storageKey = 'noir_v38_character_relationships_v1';
      this.relationships = [];
    }

    getIdb() {
      return this.idb || window.NoirStudio?.idb || null;
    }

    loadRelationships() {
      const idb = this.getIdb();
      if (idb && typeof idb.getLocalJSON === 'function') {
        this.relationships = idb.getLocalJSON(this.storageKey, []);
      } else {
        try {
          this.relationships = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (_) {
          this.relationships = [];
        }
      }
      if (!Array.isArray(this.relationships)) {
        this.relationships = [];
      }
      return this.relationships;
    }

    saveRelationships() {
      const idb = this.getIdb();
      if (idb && typeof idb.setLocalJSON === 'function') {
        idb.setLocalJSON(this.storageKey, this.relationships);
      } else {
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.relationships));
        } catch (_) {}
      }
    }

    addOrUpdateRelationship({
      sourceChar,
      targetChar,
      relationLabel,
      pronounPair,
      trustScore = 50,
      dynamicNote = ''
    }) {
      const src = String(sourceChar || '').trim();
      const tgt = String(targetChar || '').trim();
      if (!src || !tgt) return null;

      const existing = this.relationships.find(
        (r) =>
          r.sourceChar.toLowerCase() === src.toLowerCase() &&
          r.targetChar.toLowerCase() === tgt.toLowerCase()
      );

      if (existing) {
        existing.relationLabel = relationLabel || existing.relationLabel;
        existing.pronounPair = pronounPair || existing.pronounPair;
        existing.trustScore = Number(trustScore) || existing.trustScore;
        existing.dynamicNote = dynamicNote || existing.dynamicNote;
        existing.updatedAt = Date.now();
        this.saveRelationships();
        return existing;
      }

      const rel = {
        id: 'rel_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        sourceChar: src,
        targetChar: tgt,
        relationLabel: relationLabel || 'Đồng hành / Đối trọng',
        pronounPair: pronounPair || 'tôi - cậu',
        trustScore: Math.max(-100, Math.min(100, Number(trustScore) || 50)),
        dynamicNote: dynamicNote || 'Xưng hô nhất quán trong mọi phân cảnh',
        updatedAt: Date.now()
      };
      this.relationships.push(rel);
      this.saveRelationships();
      return rel;
    }

    deleteRelationship(relId) {
      this.relationships = this.relationships.filter((r) => r.id !== relId);
      this.saveRelationships();
    }

    /**
     * Quét văn bản chương để phát hiện câu thoại của nhân vật có dùng sai đại từ xưng hô đã khóa không
     */
    auditPronounConsistencyInText(chapterText, charactersList = []) {
      if (!chapterText || typeof chapterText !== 'string') return [];
      const lines = chapterText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const warnings = [];

      const charMap = {};
      (charactersList || []).forEach((c) => {
        if (c && c.name) {
          charMap[c.name.trim().toLowerCase()] = c;
        }
      });

      const stdDialogueRx = /^[-–—]\s+(.+)\(([^()]+)\)\s*[.!?…]*$/;

      lines.forEach((line, idx) => {
        const m = line.match(stdDialogueRx);
        if (!m) return;
        const speech = m[1].trim().toLowerCase();
        const speaker = m[2].trim();
        const charObj = charMap[speaker.toLowerCase()];
        if (!charObj || !charObj.speechStyle) return;

        const styleLower = charObj.speechStyle.toLowerCase();
        // Nếu nhân vật khóa xưng "tôi" nhưng trong thoại lại xưng "bổn tọa" hoặc "trẫm" (hoặc ngược lại)
        if (
          styleLower.includes('tôi') &&
          !styleLower.includes('ta') &&
          /\b(bổn tọa|lão phu|bần đạo|trẫm)\b/i.test(speech)
        ) {
          warnings.push({
            lineIndex: idx + 1,
            speaker,
            line,
            reason: `Nhân vật [${speaker}] có thiết lập giọng thoại "${charObj.speechStyle}", nhưng câu thoại lại dùng đại từ cổ trang không khớp.`
          });
        } else if (
          (styleLower.includes('bổn tọa') || styleLower.includes('vãn bối')) &&
          /\b(tớ|cậu ấy|ok|okay)\b/i.test(speech)
        ) {
          warnings.push({
            lineIndex: idx + 1,
            speaker,
            line,
            reason: `Nhân vật cổ phong [${speaker}] đang dùng đại từ hiện đại ("tớ/cậu") lệch thiết lập.`
          });
        }
      });

      return warnings;
    }

    /**
     * Xuất khối quy tắc quan hệ & xưng hô để ghép vào Prompt Tổng Hợp
     */
    buildRelationshipPromptSection() {
      if (!Array.isArray(this.relationships) || this.relationships.length === 0) {
        return '';
      }
      const lines = this.relationships.map(
        (r, idx) =>
          `  ${idx + 1}. [${r.sourceChar}] ➔ [${r.targetChar}] (${r.relationLabel}): Xưng hô bắt buộc "${
            r.pronounPair
          }" — Lưu ý tương tác: ${r.dynamicNote || 'Tự nhiên'}`
      );
      const rawSection = [
        ``,
        `[2B. MA TRẬN QUAN HỆ & QUY TẮC XƯNG HÔ SONG PHƯƠNG]:`,
        ...lines
      ].join('\n');
      const i18n = window.NoirStudio?.i18n;
      return i18n?.translatePromptFrame ? i18n.translatePromptFrame(rawSection) : rawSection;
    }
  }

  // ==========================================================================
  // PHẦN 4: BỘ KIỂM TOÁN MA TRẬN "AI BIẾT GÌ" (ASYMMETRIC KNOWLEDGE VALIDATOR)
  // ==========================================================================
  class AsymmetricKnowledgeValidator {
    /**
     * Trích xuất các từ khóa đặc trưng từ nội dung một Bí mật (Secret)
     */
    static extractKeywordsFromSecret(secretText) {
      if (!secretText || typeof secretText !== 'string') return [];
      const stopWords = new Set([
        'chân', 'tướng', 'sự', 'kiện', 'việc', 'người', 'những', 'trong', 'ngoài',
        'của', 'và', 'hoặc', 'là', 'đã', 'đang', 'sẽ', 'một', 'các', 'này', 'đó',
        'khi', 'nơi', 'về', 'với', 'cho', 'không', 'có', 'được', 'bị', 'tại'
      ]);

      return secretText
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 4 && !stopWords.has(w));
    }

    /**
     * Kiểm tra xem bản thảo chương hiện tại có vô tình để nhân vật nằm trong danh sách
     * "CHƯA BIẾT" (whoDoesNotKnow) nói ra từ khóa của Bí mật hay không!
     */
    static scanManuscriptForKnowledgeLeaks(chapterText, knowledgeMatrix = []) {
      if (!chapterText || !Array.isArray(knowledgeMatrix) || knowledgeMatrix.length === 0) {
        return [];
      }

      const leaks = [];
      const lines = chapterText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const stdDialogueRx = /^[-–—]\s+(.+)\(([^()]+)\)\s*[.!?…]*$/;

      for (const item of knowledgeMatrix) {
        if (!item || !item.secret || !item.whoDoesNotKnow) continue;
        const forbiddenNames = item.whoDoesNotKnow
          .split(/[,;&/]+/)
          .map((n) => n.replace(/\(.*?\)/g, '').trim().toLowerCase())
          .filter((n) => n.length >= 2);

        const secretKeywords = this.extractKeywordsFromSecret(item.secret);
        if (secretKeywords.length < 2) continue;

        lines.forEach((line) => {
          const m = line.match(stdDialogueRx);
          if (!m) return;
          const speechLower = m[1].toLowerCase();
          const speakerLower = m[2].trim().toLowerCase();

          const isForbiddenSpeaker = forbiddenNames.some(
            (fn) =>
              speakerLower.includes(fn) ||
              (fn === 'nhân vật chính' && speakerLower.length > 0)
          );
          if (!isForbiddenSpeaker) return;

          const matchedKw = secretKeywords.filter((kw) => speechLower.includes(kw));
          if (matchedKw.length >= Math.min(3, secretKeywords.length)) {
            leaks.push({
              secret: item.secret,
              speaker: m[2].trim(),
              whoDoesNotKnow: item.whoDoesNotKnow,
              matchedKeywords: matchedKw,
              excerpt: line.slice(0, 140)
            });
          }
        });
      }

      return leaks;
    }
  }

  // ==========================================================================
  // PHẦN 5: BỘ QUÉT TỰ ĐỘNG TRÍCH XUẤT THỰC THỂ & PHỤC BÚT TỪ BẢN THẢO (0 TOKEN)
  // ==========================================================================
  class AutoLoreEntityExtractor {
    /**
     * Tự động quét bản thảo đang mở để tìm các tên nhân vật xuất hiện trong cặp ngoặc
     * của quy ước hội thoại "- Câu thoại (Tên nhân vật)" mà chưa có trong Hồ sơ nhân vật!
     */
    static discoverNewCharactersFromManuscript(chapterText, existingCharacters = []) {
      if (!chapterText || typeof chapterText !== 'string') return [];

      const existingSet = new Set(
        (existingCharacters || []).map((c) => String(c.name || '').trim().toLowerCase())
      );

      const counts = {};
      const lines = chapterText.split(/\r?\n/);
      const dialogueRx = /^[-–—]\s+.+\(([^()]{2,32})\)\s*[.!?…]*$/;

      for (const rawLine of lines) {
        const line = rawLine.trim();
        const match = line.match(dialogueRx);
        if (match) {
          const speaker = match[1].trim();
          const lower = speaker.toLowerCase();
          if (!existingSet.has(lower)) {
            counts[speaker] = (counts[speaker] || 0) + 1;
          }
        }
      }

      return Object.entries(counts)
        .map(([name, dialogueCount]) => ({
          name,
          dialogueCount,
          suggestedRole: dialogueCount >= 4 ? 'Nhân vật quan trọng trong chương' : 'Nhân vật phụ xuất hiện'
        }))
        .sort((a, b) => b.dialogueCount - a.dialogueCount);
    }

    /**
     * Bóc tách thực thể cục bộ 0-Token bằng bộ lọc regex & chia đoạn ngữ cảnh Story Bible
     * khi người dùng dán hoặc cập nhật Story Bible chính thức.
     */
    static parseStructuredEntitiesLocally(bibleText) {
      if (!bibleText || typeof bibleText !== 'string') return null;
      const res = {
        characters: [],
        knowledgeMatrix: [],
        cluesLedger: []
      };

      const lines = bibleText.split(/\r?\n/);
      let currentSection = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const lower = line.toLowerCase();
        if (lower.includes('hồ sơ') || lower.includes('nhân vật')) {
          currentSection = 'CHARS';
          continue;
        } else if (lower.includes('ai biết gì') || lower.includes('bí mật') || lower.includes('ma trận')) {
          currentSection = 'KNOW';
          continue;
        } else if (lower.includes('phục bút') || lower.includes('manh mối') || lower.includes('chekhov')) {
          currentSection = 'CLUES';
          continue;
        } else if (line.startsWith('[') && line.endsWith(']')) {
          currentSection = '';
        }

        // Bóc tách nhân vật
        if (currentSection === 'CHARS' || lower.includes('nhân vật:')) {
          const charMatch = line.match(/^[-*+•]\s*(?:Nhân vật:\s*)?([A-ZÀ-Ỹ][A-Za-zÀ-ỹ\s]{1,30})(?:\s*[:(—–-]\s*(.*))?$/);
          if (charMatch) {
            const cName = charMatch[1].trim();
            const rest = charMatch[2] ? charMatch[2].replace(/[()]/g, '').trim() : '';
            if (cName.length >= 2 && !cName.toLowerCase().startsWith('chương')) {
              res.characters.push({
                name: cName,
                role: rest ? (rest.length > 50 ? rest.slice(0, 48) + '...' : rest) : 'Nhân vật trong truyện',
                traits: rest || 'Xuất hiện trong Story Bible',
                speechStyle: 'Nhất quán theo bối cảnh',
                innerWound: ''
              });
            }
          }
        }

        // Bóc tách ma trận Ai biết gì
        if (currentSection === 'KNOW' || lower.includes('bí mật:')) {
          const knowMatch = line.match(/^[-*+•]\s*(?:Bí mật:\s*)?([^:—–-]+)(?:[:—–-]\s*(.*))?$/);
          if (knowMatch) {
            const sec = knowMatch[1].trim();
            const desc = knowMatch[2] || '';
            if (sec.length >= 4) {
              res.knowledgeMatrix.push({
                secret: sec,
                whoKnows: desc ? 'Nhân vật liên quan' : 'Người trong cuộc',
                whoDoesNotKnow: 'Nhân vật chính (Cấm lộ sớm)'
              });
            }
          }
        }

        // Bóc tách phục bút
        if (currentSection === 'CLUES' || lower.includes('phục bút:')) {
          const clueMatch = line.match(/^[-*+•]\s*(?:Phục bút:\s*)?([^:—–-]+)(?:[:—–-]\s*(.*))?$/);
          if (clueMatch) {
            const clTitle = clueMatch[1].trim();
            const clNote = clueMatch[2] || '';
            if (clTitle.length >= 4) {
              res.cluesLedger.push({
                title: clTitle,
                plantedIn: 'Story Bible',
                status: 'PLANTED',
                note: clNote || 'Ghi nhận từ Story Bible'
              });
            }
          }
        }
      }

      return res;
    }
  }

  // ==========================================================================
  // PHẦN 6: BỘ MẪU PHỤC BÚT (CHEKHOV'S GUN TEMPLATES) & MA TRẬN BÍ MẬT MẪU
  // ==========================================================================
  const CHEKHOV_CLUE_PRESET_PACKS = [
    {
      category: 'TRINH_THAM_NOIR',
      label: '🕵️ Gói Phục Bút Trinh Thám — Vật Chứng & Lệch Giờ',
      items: [
        {
          title: 'Chiếc đồng hồ quả quýt ngừng chạy lúc 23:15',
          plantedIn: 'Chương 1',
          status: 'PLANTED',
          note: 'Thời điểm đồng hồ vỡ không trùng với giờ tử vong thật sự của nạn nhân (Ngụy tạo Alibi)'
        },
        {
          title: 'Vết bùn đất đỏ chỉ có ở khu nhà kho bến cảng phía Đông',
          plantedIn: 'Chương 2',
          status: 'PLANTED',
          note: 'Dính trên gấu quần của người tự xưng không rời khỏi phòng sách suốt đêm mưa'
        },
        {
          title: 'Tách trà Bá Tước vẫn còn ấm khi cảnh sát ập vào',
          plantedIn: 'Chương 3',
          status: 'PLANTED',
          note: 'Chứng tỏ hung thủ vừa mới rời đi qua lối mật đạo chưa đầy 5 phút trước'
        }
      ]
    },
    {
      category: 'LIGHT_NOVEL_FANTASY',
      label: '⚔️ Gói Phục Bút Light Novel — Di Vật & Thân Phận Ẩn',
      items: [
        {
          title: 'Vết sẹo hình bán nguyệt phát sáng khi tiếp xúc với Cổ Ngữ',
          plantedIn: 'Chương 1',
          status: 'PLANTED',
          note: 'Dấu ấn phong ấn một nửa ký ức thời thơ ấu của nhân vật chính'
        },
        {
          title: 'Trang cuối bị xé rách trong Nhật ký của Viện Trưởng đời thứ nhất',
          plantedIn: 'Chương 4',
          status: 'PLANTED',
          note: 'Ghi chép tên thật của vị thần đã phản bội loài người'
        },
        {
          title: 'Thanh đoản kiếm rỉ sét mua ở chợ trời không thể bị ma thuật ăn mòn',
          plantedIn: 'Chương 2',
          status: 'PLANTED',
          note: 'Vỏ ngoài rỉ sét chỉ là lớp ngụy trang của Thần Khí Phá Pháp'
        }
      ]
    },
    {
      category: 'TIEN_HIEP_HUYEN_HUYEN',
      label: '🏔️ Gói Phục Bút Tiên Hiệp — Nhân Quả & Cổ Ngọc',
      items: [
        {
          title: 'Mảnh ngọc bội ấm áp hấp thụ một giọt máu tâm đầu khi đột phá',
          plantedIn: 'Chương 1',
          status: 'PLANTED',
          note: 'Chìa khóa mở ra Động Phủ của Đại Năng thượng cổ ở quyển 2'
        },
        {
          title: 'Lời dặn không được bước vào Vạn Kiếm Cốc trước khi đạt Kim Đan',
          plantedIn: 'Chương 3',
          status: 'PLANTED',
          note: 'Dưới đáy cốc giam giữ tàn hồn có ân oán huyết hải với sư môn'
        }
      ]
    }
  ];

  const KNOWLEDGE_MATRIX_PRESET_PACKS = [
    {
      id: 'KNOW_PACK_NOIR',
      label: '🕵️ Mẫu Bí Mật Trinh Thám: Kẻ Phản Bội Nội Gián',
      secret: 'Phó đội trưởng Trần Minh chính là người đã xóa dữ liệu camera hành lang lúc 22:40',
      whoKnows: 'Trần Minh và kẻ chủ mưu đứng sau tập đoàn Hóa Sinh',
      whoDoesNotKnow: 'Nhân vật chính Lâm Phong và toàn bộ đội điều tra (Tuyệt đối cấm AI viết lộ ra trước Chương 10!)'
    },
    {
      id: 'KNOW_PACK_LN',
      label: '⚔️ Mẫu Bí Mật Light Novel: Thân Phận Thật Của Đồng Đội',
      secret: 'Cô bạn cùng bàn trầm lặng thực chất là Công chúa lưu vong của Vương quốc Phương Bắc',
      whoKnows: 'Chỉ bản thân cô ấy và người hộ vệ già giả làm quản thư viện',
      whoDoesNotKnow: 'Nhân vật chính và toàn bộ học viên trong lớp (Cấm nhân vật chính gọi đúng thân phận công chúa khi chưa tới cảnh lật bài!)'
    },
    {
      id: 'KNOW_PACK_TIEN_HIEP',
      label: '🏔️ Mẫu Bí Mật Tiên Hiệp: Nguồn Gốc Linh Căn Phế Vật',
      secret: 'Linh căn của nhân vật chính không bị phế mà đang bị Cửu Chuyển Phong Ấn Trận hút linh khí để nuôi dưỡng thần mộc dưới lòng đất',
      whoKnows: 'Chỉ vị Đại Trưởng Lão ẩn cư ở Hậu Sơn',
      whoDoesNotKnow: 'Nhân vật chính, các đệ tử ngoại môn và gia tộc (Nhân vật chính vẫn tưởng mình tư chất kém nên phải nỗ lực gấp mười lần)'
    }
  ];

  // ==========================================================================
  // PHẦN 7: ĐỘNG CƠ CHÍNH — STORY BIBLE AND LORE MATRIX ENGINE (MODULE 12)
  // ==========================================================================
  class StoryBibleAndLoreMatrixEngine {
    constructor(idb, fs, utils) {
      this._idb = idb || null;
      this._fs = fs || null;
      this._utils = utils || null;

      this.templateLocked = false;
      this.activeGenrePresetId = 'DEFAULT_UNIVERSAL';
      this.characters = [];
      this.knowledgeMatrix = [];
      this.cluesLedger = [];
      this.relationshipEngine = new VietnamesePronounAndRelationshipMatrixEngine(this._idb);
      this._domEventsBound = false;

      this.defaultTemplate = STORY_BIBLE_GENRE_PRESETS.DEFAULT_UNIVERSAL.templateText;
    }

    get idb() {
      return (
        this._idb ||
        window.NoirStudio?.idb || {
          getLocalJSON: (k, fb) => {
            try {
              const r = localStorage.getItem(k);
              return r ? JSON.parse(r) : fb;
            } catch (_) {
              return fb;
            }
          },
          setLocalJSON: (k, v) => {
            try {
              localStorage.setItem(k, JSON.stringify(v));
              return true;
            } catch (_) {
              return false;
            }
          },
          set: async () => true,
          get: async () => null
        }
      );
    }

    set idb(val) {
      this._idb = val;
    }

    get fs() {
      return (
        this._fs ||
        window.NoirStudio?.fsEngine || {
          rootHandle: null,
          writeTextFile: async () => false
        }
      );
    }

    set fs(val) {
      this._fs = val;
    }

    get utils() {
      return (
        this._utils ||
        window.NoirStudio?.utils || {
          escapeHtml: (s) =>
            String(s ?? '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;'),
          countVietnameseWords: (t) =>
            String(t || '')
              .trim()
              .split(/\s+/)
              .filter(Boolean).length,
          formatTimestampVN: (ts) =>
            window.NoirNovel?.i18n?.formatDateTime
              ? window.NoirNovel.i18n.formatDateTime(ts || Date.now(), { includeSeconds: true })
              : new Date(ts || Date.now()).toLocaleString('vi-VN'),
          showToast: (msg) => console.log('[Toast]', msg)
        }
      );
    }

    set utils(val) {
      this._utils = val;
    }

    /**
     * Khởi tạo và nạp toàn bộ dữ liệu Story Bible từ bộ nhớ cục bộ
     */
    init() {
      this.loadAllFromStorage();
      this.bindTab4DOMEvents();
      this.injectGenreTemplateToolbarIfMissing();
      if (!this._i18nBound) {
        this._i18nBound = true;
        const syncLang = () => {
          try {
            this.renderCharactersUI();
            this.renderKnowledgeMatrixUI();
            this.renderCluesLedgerUI();
            this.renderQuickCharacterChipsInTab1();
            this.updateCommandModalStatusPills?.();
          } catch {}
        };
        window.NoirStudio?.bus?.on?.('i18n:changed', syncLang);
        window.addEventListener?.('noir:i18n:changed', syncLang);
      }
    }

    /**
     * Đọc toàn bộ Khung mẫu, Nội dung Story Bible chính thức, Hồ sơ nhân vật,
     * Ma trận Ai Biết Gì, Sổ cái Phục bút & Danh sách Từ cấm từ LocalStorage / IndexedDB
     */
    loadAllFromStorage() {
      const constants = getStudioConstants();

      const fallbackDefaultTemplate =
        this.defaultTemplate ||
        (typeof STORY_BIBLE_GENRE_PRESETS !== 'undefined' &&
          STORY_BIBLE_GENRE_PRESETS.DEFAULT_UNIVERSAL?.templateText) ||
        '=== KHUNG CẤU TRÚC STORY BIBLE TIỂU THUYẾT ===\n[I. THẾ GIỚI QUAN & BỐI CẢNH CỐT LÕI]\n- Thời đại, không gian và quy tắc chi phối.';

      const rawTemplate = localStorage.getItem(constants.STORAGE_KEYS.BIBLE_TEMPLATE);
      const savedTemplate =
        rawTemplate && rawTemplate.trim() ? rawTemplate : fallbackDefaultTemplate;
      const rawRendered = localStorage.getItem(constants.STORAGE_KEYS.BIBLE_RENDERED);
      const savedRendered =
        rawRendered && rawRendered.trim() ? rawRendered : savedTemplate;
      this.templateLocked =
        localStorage.getItem(constants.STORAGE_KEYS.BIBLE_LOCKED) === 'true';

      this.activeGenrePresetId =
        localStorage.getItem('noir_v38_active_bible_genre_preset') ||
        'DEFAULT_UNIVERSAL';

      this.characters = this.idb.getLocalJSON(constants.STORAGE_KEYS.CHARACTERS, [
        {
          id: 'char_default_1',
          name: 'Nhân vật chính',
          role: 'Trung tâm cốt truyện',
          traits: 'Điềm tĩnh, quan sát sắc bén, nội tâm sâu sắc',
          speechStyle: 'Ngắn gọn, giàu ẩn ý, xưng hô nhất quán',
          innerWound: 'Mang ký ức chưa lời giải từ sự kiện mở đầu',
          archetypeId: 'ARCH_STRATEGIST'
        }
      ]);

      this.knowledgeMatrix = this.idb.getLocalJSON(
        constants.STORAGE_KEYS.KNOWLEDGE_MATRIX,
        [
          {
            id: 'know_default_1',
            secret: 'Chân tướng sự kiện đêm mưa mở đầu',
            whoKnows: 'Chỉ người đứng sau màn',
            whoDoesNotKnow: 'Nhân vật chính và các đồng đội (Cấm AI để lộ sớm!)'
          }
        ]
      );

      this.cluesLedger = this.idb.getLocalJSON(constants.STORAGE_KEYS.CLUES_LEDGER, [
        {
          id: 'clue_default_1',
          title: 'Chiếc đồng hồ quả quýt ngừng chạy lúc 23:15',
          plantedIn: 'Chương 1',
          status: 'PLANTED',
          note: 'Manh mối dẫn tới nghi phạm thực sự ở giữa truyện'
        }
      ]);

      this.relationshipEngine.loadRelationships();

      const savedAntiCliche =
        localStorage.getItem(constants.STORAGE_KEYS.ANTI_CLICHE) ||
        (constants.DEFAULT_ANTI_CLICHE || STORY_BIBLE_GENRE_PRESETS.DEFAULT_UNIVERSAL.sampleAntiCliche).join(', ');

      const tplEl = document.getElementById('textarea-bible-template-frame');
      const renEl = document.getElementById('textarea-rendered-bible-content');
      const antiEl = document.getElementById('textarea-anti-cliche-blacklist');

      if (tplEl) {
        tplEl.value = savedTemplate;
        tplEl.readOnly = this.templateLocked;
      }
      if (renEl) renEl.value = savedRendered;
      if (antiEl) antiEl.value = savedAntiCliche;

      this.updateLockButtonUI();
      this.renderCharactersUI();
      this.renderKnowledgeMatrixUI();
      this.renderCluesLedgerUI();
      this.renderQuickCharacterChipsInTab1();
      this.updateCommandModalStatusPills();
    }

    /**
     * Gắn sự kiện cho các nút thao tác trong Tab 4 (với cờ chống gắn trùng lặp 100%)
     */
    bindTab4DOMEvents() {
      const btnLock = document.getElementById('btn-toggle-bible-template-lock');
      const btnSaveAll = document.getElementById('btn-bible-save-all');
      const btnAddChar = document.getElementById('btn-add-character-profile');
      const btnAddKnow = document.getElementById('btn-add-knowledge-entry');
      const btnAddClue = document.getElementById('btn-add-clue-entry');
      const tplEl = document.getElementById('textarea-bible-template-frame');
      const renEl = document.getElementById('textarea-rendered-bible-content');
      const antiEl = document.getElementById('textarea-anti-cliche-blacklist');

      if (btnLock && !btnLock.dataset.mod12Bound) {
        btnLock.dataset.mod12Bound = '1';
        btnLock.addEventListener('click', () => {
          this.toggleTemplateLock();
        });
      }

      if (btnSaveAll && !btnSaveAll.dataset.mod12Bound) {
        btnSaveAll.dataset.mod12Bound = '1';
        btnSaveAll.addEventListener('click', () => {
          this.saveAllBibleData(true);
        });
      }

      if (btnAddChar && !btnAddChar.dataset.mod12Bound) {
        btnAddChar.dataset.mod12Bound = '1';
        btnAddChar.addEventListener('click', () => {
          this.addCharacterInteractive();
        });
      }

      if (btnAddKnow && !btnAddKnow.dataset.mod12Bound) {
        btnAddKnow.dataset.mod12Bound = '1';
        btnAddKnow.addEventListener('click', () => {
          this.addKnowledgeEntryInteractive();
        });
      }

      if (btnAddClue && !btnAddClue.dataset.mod12Bound) {
        btnAddClue.dataset.mod12Bound = '1';
        btnAddClue.addEventListener('click', () => {
          this.addClueEntryInteractive();
        });
      }

      // Nạp câu lệnh chuẩn mẫu NotebookLM siêu chi tiết (8 phần chuẩn trục thời gian & Story Bible toàn diện + liệt kê chương)
      const nblmPromptEl = document.getElementById('textarea-tab4-notebooklm-prompt');
      if (nblmPromptEl) {
        nblmPromptEl.value = this.buildDynamicNotebookLmStoryBiblePrompt();
      }

      const btnCopyNblm = document.getElementById('btn-tab4-copy-notebooklm-prompt');
      if (btnCopyNblm && !btnCopyNblm.dataset.mod12Bound) {
        btnCopyNblm.dataset.mod12Bound = '1';
        btnCopyNblm.addEventListener('click', async () => {
          const freshPrompt = this.buildDynamicNotebookLmStoryBiblePrompt();
          const promptBox = document.getElementById('textarea-tab4-notebooklm-prompt');
          if (promptBox) promptBox.value = freshPrompt;
          const textToCopy = freshPrompt || promptBox?.value || '';
          if (!textToCopy.trim()) return;
          try {
            await navigator.clipboard.writeText(textToCopy);
          } catch (_e) {
            if (promptBox) {
              promptBox.select();
              try { document.execCommand('copy'); } catch (_e2) {}
            }
          }
          const statusPill = document.getElementById('tab4-nblm-copy-status-pill');
          if (statusPill) {
            statusPill.textContent = `✅ Đã copy lệnh (${textToCopy.length} ký tự)`;
            statusPill.className =
              'px-2.5 py-0.5 rounded-full border border-amber-400/50 bg-amber-500/20 text-amber-200 font-extrabold text-[10px]';
          }
          this.utils.showToast(
            '📋 Đã sao chép câu lệnh Story Bible chi tiết (kèm danh sách chương & sổ cái)! Hãy dán vào NotebookLM nhé.',
            'success',
            4000
          );
        });
      }

      const btnToggleNblmPreview = document.getElementById('btn-tab4-toggle-nblm-prompt-preview');
      const wrapNblmPreview = document.getElementById('tab4-notebooklm-prompt-preview-wrap');
      if (btnToggleNblmPreview && wrapNblmPreview && !btnToggleNblmPreview.dataset.mod12Bound) {
        btnToggleNblmPreview.dataset.mod12Bound = '1';
        btnToggleNblmPreview.addEventListener('click', () => {
          const isHidden = wrapNblmPreview.classList.toggle('hidden');
          btnToggleNblmPreview.textContent = isHidden
            ? '👁️ Xem trước nội dung câu lệnh ▾'
            : '🔼 Thu gọn khung câu lệnh ▴';
        });
      }

      const btnExportAllPdfNblm = document.getElementById('btn-tab4-export-all-chapters-pdf');
      if (btnExportAllPdfNblm && !btnExportAllPdfNblm.dataset.mod12Bound) {
        btnExportAllPdfNblm.dataset.mod12Bound = '1';
        btnExportAllPdfNblm.addEventListener('click', () => {
          const exp = window.NoirStudio?.exporter;
          if (exp && typeof exp.exportMergedManuscriptPdfForNotebookLM === 'function') {
            exp.exportMergedManuscriptPdfForNotebookLM();
          } else {
            const scopeSel = document.getElementById('export-scope-select');
            if (scopeSel) scopeSel.value = 'ALL_CHAPTERS';
            exp?.openExporterModal?.();
          }
        });
      }

      // Tự động lưu ngầm khi tác giả gõ vào các ô Textarea của Story Bible
      [tplEl, renEl, antiEl].forEach((el) => {
        if (el && !el.dataset.mod12InputBound) {
          el.dataset.mod12InputBound = '1';
          el.addEventListener('input', () => {
            this.saveAllBibleData(false);
            if (el === renEl) {
              window.NoirStudio?.manuscriptSyncTracker?.markStoryBibleUpdatedNow?.();
            }
          });
        }
      });

      // Khởi tạo trình soạn thảo Word/Google Docs, File Story Bible PDF/Chọn File & Chia đôi màn hình NotebookLM (v105)
      this.bindV105RichBibleAndFileControls();

      // Gắn sự kiện đồng bộ Gemini Flash cho nút #btn-tab4-sync-bible-entities & sự kiện dán vào ô Box 2
      const btnSyncEntities = document.getElementById('btn-tab4-sync-bible-entities');
      if (btnSyncEntities && !btnSyncEntities.dataset.mod12Bound) {
        btnSyncEntities.dataset.mod12Bound = '1';
        btnSyncEntities.addEventListener('click', () => {
          this.syncStructuredEntitiesFromOfficialBible({ manual: true });
        });
      }

      if (renEl && !renEl.dataset.mod12PasteBound) {
        renEl.dataset.mod12PasteBound = '1';
        renEl.addEventListener('paste', () => {
          setTimeout(() => {
            const val = (renEl.value || '').trim();
            if (val.length >= 40) {
              this.syncStructuredEntitiesFromOfficialBible({ isAutoPaste: true });
            }
          }, 600);
        });
      }

      this._domEventsBound = true;
    }

    /**
     * Bóc tách và cập nhật tự động Hồ sơ nhân vật, Ma trận Ai biết gì và Sổ cái phục bút
     * trực tiếp từ ô "2. Nội dung Story Bible chính thức" bằng Gemini Flash (đã kết nối API Key)
     * kèm bộ phân tích ngữ pháp cấu trúc dự phòng 0-Token tức thời.
     */
    async syncStructuredEntitiesFromOfficialBible(options = {}) {
      const renEl = document.getElementById('textarea-rendered-bible-content');
      const bibleText = (renEl?.value || '').trim();
      const statusPill = document.getElementById('tab4-entity-sync-status');

      if (!bibleText || bibleText.length < 30) {
        if (!options.silent) {
          this.utils.showToast(
            '⚠️ Ô "2. Nội dung Story Bible chính thức" hiện chưa có đủ nội dung để bóc tách.',
            'warning',
            3500
          );
        }
        return false;
      }

      if (statusPill) {
        statusPill.classList.remove('hidden');
        const activeBibleModel =
          document.getElementById('tab4-bible-model-select')?.value ||
          window.NoirStudio?.geminiRouter?.getSelectedModelId?.() ||
          'gemini-4-hydrogen';
        statusPill.textContent = `⚡ ${activeBibleModel} đang bóc tách...`;
        statusPill.className =
          'px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse';
      }

      let parsedData = null;
      let usedGeminiFlash = false;

      // 1. Nếu đã kết nối API Key, ưu tiên gọi Gemini Flash
      const router = window.NoirStudio?.geminiRouter;
      const effectiveKey = router?.getEffectiveActiveKey?.() || router?.getApiKey?.() || '';

      if (effectiveKey && effectiveKey.length >= 8 && router?.isCurrentKeyFlashLiteVerified?.()) {
        try {
          const extractionPrompt = [
            'Bạn là Chuyên gia Cấu trúc Cốt truyện, Trục Thời Gian & Story Bible Tiểu thuyết Siêu Chi Tiết.',
            'Hãy phân tích CỰC KỲ KỸ LƯỠNG Bản Story Bible chính thức dưới đây (không bỏ sót nhân vật, bí mật, phục bút, vật chứng, mốc thời gian) và bóc tách thành một đối tượng JSON hợp lệ DUY NHẤT theo schema sau:',
            '{',
            '  "characters": [',
            '    { "name": "Tên nhân vật", "role": "Vai trò / Thân phận (Chính / Phản diện / Phụ)", "traits": "Tính cách, hành vi nổi bật & trạng thái hiện tại", "speechStyle": "Giọng thoại & xưng hô", "innerWound": "Động cơ / Vết thương nội tâm / Mục tiêu" }',
            '  ],',
            '  "knowledgeMatrix": [',
            '    { "secret": "Tên bí mật, manh mối hoặc âm mưu chưa tiết lộ", "whoKnows": "Ai đã biết rõ", "whoDoesNotKnow": "Ai tuyệt đối chưa biết (cấm AI để lộ sớm)" }',
            '  ],',
            '  "cluesLedger": [',
            '    { "title": "Chi tiết phục bút, manh mối, vật chứng hoặc ngòi nổ hạn chót thời gian", "plantedIn": "Hồi / Chương / Mốc giờ gieo", "status": "PLANTED", "note": "Ghi chú chi tiết ý nghĩa thu hồi & mốc thời gian liên quan" }',
            '  ]',
            '}',
            'QUY TẮC BẮT BUỘC:',
            '1. Chỉ trả về chuỗi JSON thuần, bắt đầu bằng { và kết thúc bằng }.',
            '2. Không kèm bất kỳ lời giải thích, mở đầu hay khối ```json markdown.',
            '3. Bóc tách ĐẦY ĐỦ TẤT CẢ nhân vật, bí mật, manh mối, ngòi nổ phục bút và mốc thời gian quan trọng có trong Story Bible (ưu tiên chi tiết tối đa).',
            '',
            '=== BẢN STORY BIBLE CHÍNH THỨC ===',
            bibleText
          ].join('\n');

          const chosenBibleModel =
            document.getElementById('tab4-bible-model-select')?.value ||
            router?.getSelectedModelId?.() ||
            'gemini-4-hydrogen';
          const chosenBibleThinking =
            document.getElementById('tab4-bible-thinking-select')?.value ||
            router?.getThinkingLevel?.() ||
            'HIGH';
          const resp = await router.generateTextWithFallback({
            prompt: extractionPrompt,
            modelId: chosenBibleModel,
            temperature: 0.2,
            maxOutputTokens: 6000,
            thinkingLevel: chosenBibleThinking
          });

          if (resp && resp.text) {
            const raw = resp.text.trim();
            const cleanJson = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedData = JSON.parse(jsonMatch[0]);
              usedGeminiFlash = true;
            }
          }
        } catch (_geminiErr) {
          // Bỏ qua lỗi và chuyển sang bộ bóc tách nội bộ tức thời
        }
      }

      // 2. Bộ bóc tách ngữ nghĩa nội bộ 0-Token nếu không có API Key hoặc Gemini chưa phản hồi
      if (!parsedData || (!parsedData.characters && !parsedData.knowledgeMatrix && !parsedData.cluesLedger)) {
        parsedData = AutoLoreEntityExtractor.parseStructuredEntitiesLocally(bibleText);
      }

      if (!parsedData) {
        if (statusPill) {
          statusPill.textContent = '❌ Không bóc tách được';
          statusPill.className =
            'px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold';
        }
        return false;
      }

      // 3. Tiến hành gộp dữ liệu thông minh (tránh nhân đôi, cập nhật thông tin mới nhất)
      let addedChars = 0;
      let addedKnow = 0;
      let addedClues = 0;

      const cleanField = (v) => {
        const s = String(v || '').trim();
        return typeof window !== 'undefined' && typeof window.NoirStudio?.stripAiMarkdownSymbols === 'function'
          ? window.NoirStudio.stripAiMarkdownSymbols(s)
          : s;
      };

      if (Array.isArray(parsedData.characters)) {
        parsedData.characters.forEach((c) => {
          const cleanName = cleanField(c.name);
          if (!cleanName) return;
          const existing = this.characters.find(
            (x) => x.name.trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (existing) {
            if (c.role) existing.role = cleanField(c.role);
            if (c.traits) existing.traits = cleanField(c.traits);
            if (c.speechStyle) existing.speechStyle = cleanField(c.speechStyle);
            if (c.innerWound) existing.innerWound = cleanField(c.innerWound);
          } else {
            this.characters.push({
              id: 'char_auto_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              name: cleanName,
              role: cleanField(c.role || 'Nhân vật'),
              traits: cleanField(c.traits || 'Được bóc tách từ Story Bible'),
              speechStyle: cleanField(c.speechStyle || 'Nhất quán theo mạch truyện'),
              innerWound: cleanField(c.innerWound || '')
            });
            addedChars += 1;
          }
        });
      }

      if (Array.isArray(parsedData.knowledgeMatrix)) {
        parsedData.knowledgeMatrix.forEach((k) => {
          const cleanSecret = cleanField(k.secret);
          if (!cleanSecret) return;
          const existing = this.knowledgeMatrix.find(
            (x) => x.secret.trim().toLowerCase() === cleanSecret.toLowerCase()
          );
          if (existing) {
            if (k.whoKnows) existing.whoKnows = cleanField(k.whoKnows);
            if (k.whoDoesNotKnow) existing.whoDoesNotKnow = cleanField(k.whoDoesNotKnow);
          } else {
            this.knowledgeMatrix.push({
              id: 'know_auto_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              secret: cleanSecret,
              whoKnows: cleanField(k.whoKnows || 'Người trong cuộc'),
              whoDoesNotKnow: cleanField(k.whoDoesNotKnow || 'Nhân vật chính (Cấm lộ sớm)')
            });
            addedKnow += 1;
          }
        });
      }

      if (Array.isArray(parsedData.cluesLedger)) {
        parsedData.cluesLedger.forEach((cl) => {
          const cleanTitle = cleanField(cl.title);
          if (!cleanTitle) return;
          const existing = this.cluesLedger.find(
            (x) => x.title.trim().toLowerCase() === cleanTitle.toLowerCase()
          );
          if (existing) {
            if (cl.plantedIn) existing.plantedIn = cleanField(cl.plantedIn);
            if (cl.status) existing.status = cleanField(cl.status);
            if (cl.note) existing.note = cleanField(cl.note);
          } else {
            this.cluesLedger.push({
              id: 'clue_auto_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              title: cleanTitle,
              plantedIn: cleanField(cl.plantedIn || 'Chương hiện tại'),
              status: cleanField(cl.status || 'PLANTED'),
              note: cleanField(cl.note || 'Manh mối quan trọng từ Story Bible')
            });
            addedClues += 1;
          }
        });
      }

      // 4. Mở rộng các bảng dữ kiện để tác giả nhìn thấy kết quả ngay & ghi nhớ trạng thái mở
      ['tab4-card-chars-body', 'tab4-card-knowledge-body', 'tab4-card-clues-body'].forEach((cardId) => {
        if (window.NoirStudio?.navigator?.collapsibleToolbars?.setTargetCollapsed) {
          window.NoirStudio.navigator.collapsibleToolbars.setTargetCollapsed(cardId, false);
        } else {
          const el = document.getElementById(cardId);
          if (el) el.classList.remove('hidden');
        }
      });

      // 5. Cập nhật giao diện và lưu trữ
      this.renderCharactersUI();
      this.renderKnowledgeMatrixUI();
      this.renderCluesLedgerUI();
      this.renderQuickCharacterChipsInTab1();
      this.saveAllBibleData(false);

      if (statusPill) {
        statusPill.textContent = usedGeminiFlash ? '✅ Flash đồng bộ xong' : '✅ Đã đồng bộ cấu trúc';
        statusPill.className =
          'px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold';
      }

      const methodLabel = usedGeminiFlash ? 'Gemini Flash (AI Studio)' : 'Bộ phân tích cấu trúc Story Bible';
      this.utils.showToast(
        `✨ ${methodLabel} đã đồng bộ thành công: ${this.characters.length} nhân vật (${addedChars} mới), ${this.knowledgeMatrix.length} bí mật (${addedKnow} mới), ${this.cluesLedger.length} phục bút (${addedClues} mới)!`,
        'success',
        4600
      );
      return true;
    }

    /**
     * Bổ sung thanh chọn nhanh Mẫu Thể Loại (Light Novel, Trinh Thám, Tiên Hiệp, Đô Thị, Huyền Huyễn),
     * Hình mẫu Nhân vật (Archetypes) và Quét nhân vật tự động từ bản thảo ngay trong Tab 4
     */
    injectGenreTemplateToolbarIfMissing() {
      const bibleMainView = document.getElementById('s10-story-bible-main-view');
      if (!bibleMainView || document.getElementById('mod12-genre-presets-bar')) return;

      const toolbar = document.createElement('div');
      toolbar.id = 'mod12-genre-presets-bar';
      toolbar.className =
        'p-3.5 rounded-2xl border border-emerald-500/30 bg-studioLightPanel dark:bg-zinc-900/90 space-y-2.5 text-xs';

      const presetOptionsHtml = Object.values(STORY_BIBLE_GENRE_PRESETS)
        .map(
          (p) =>
            `<option value="${this.utils.escapeHtml(p.id)}" ${
              p.id === this.activeGenrePresetId ? 'selected' : ''
            }>${this.utils.escapeHtml(p.label)}</option>`
        )
        .join('');

      const archetypeOptionsHtml = CHARACTER_ARCHETYPE_LIBRARY.map(
        (a) =>
          `<option value="${this.utils.escapeHtml(a.id)}">${this.utils.escapeHtml(
            a.label
          )}</option>`
      ).join('');

      toolbar.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-extrabold uppercase text-emerald-400 text-[11px]">📚 Mẫu Thể Loại Story Bible &amp; Hình Mẫu Nhân Vật</span>
          <button type="button" id="btn-toggle-mod12-genre-bar" class="px-2.5 py-1 rounded-lg border border-emerald-500/50 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-200 font-bold text-[10.5px] transition">
            ▲ Thu gọn
          </button>
        </div>
        <div id="mod12-genre-presets-body" class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <select id="mod12-select-genre-preset" class="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-studioLightBg dark:bg-zinc-950 font-bold text-xs text-emerald-300">
              ${presetOptionsHtml}
            </select>
            <button type="button" id="btn-mod12-apply-genre-preset" class="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] transition">
              ✨ Nạp Khung Mẫu Này
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select id="mod12-select-char-archetype" class="px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-studioLightBg dark:bg-zinc-950 font-semibold text-xs text-amber-300">
              ${archetypeOptionsHtml}
            </select>
            <button type="button" id="btn-mod12-add-archetype-char" class="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/35 border border-amber-500/40 text-amber-300 font-bold text-[11px] transition">
              👤 + Thêm Từ Hình Mẫu
            </button>
            <button type="button" id="btn-mod12-scan-manuscript-chars" class="px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[11px] transition" title="Tự động quét các tên nhân vật trong câu thoại của chương đang mở để thêm vào Hồ sơ">
              🔍 Quét Nhân Vật Từ Bản Thảo
            </button>
            <button type="button" id="btn-mod12-audit-knowledge-leaks" class="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] transition" title="Kiểm tra xem chương đang mở có vô tình để lộ bí mật hoặc lệch xưng hô không">
              🛡️ Kiểm Toán Lộ Bí Mật & Xưng Hô
            </button>
          </div>
        </div>
      `;

      // Chèn ngay dưới phần header đầu tiên của Tab 4
      const firstChild = bibleMainView.firstElementChild;
      if (firstChild && firstChild.nextSibling) {
        bibleMainView.insertBefore(toolbar, firstChild.nextSibling);
      } else {
        bibleMainView.prepend(toolbar);
      }

      const genreBody = document.getElementById('mod12-genre-presets-body');
      const genreToggleBtn = document.getElementById('btn-toggle-mod12-genre-bar');
      if (genreBody && genreToggleBtn) {
        const applyGenreCollapsed = (collapsed) => {
          genreBody.classList.toggle('hidden', Boolean(collapsed));
          genreToggleBtn.textContent = collapsed ? '▼ Mở rộng' : '▲ Thu gọn';
          try { localStorage.setItem('noir_v107_tab4_genre_bar_collapsed', collapsed ? '1' : '0'); } catch (_e) {}
        };
        try {
          if (localStorage.getItem('noir_v107_tab4_genre_bar_collapsed') === '1') applyGenreCollapsed(true);
        } catch (_e) {}
        genreToggleBtn.addEventListener('click', () => {
          applyGenreCollapsed(!genreBody.classList.contains('hidden'));
        });
      }

      document
        .getElementById('btn-mod12-apply-genre-preset')
        ?.addEventListener('click', () => {
          const sel = document.getElementById('mod12-select-genre-preset');
          if (sel) this.applyGenrePresetTemplate(sel.value);
        });

      document
        .getElementById('btn-mod12-add-archetype-char')
        ?.addEventListener('click', () => {
          const sel = document.getElementById('mod12-select-char-archetype');
          if (sel) this.addCharacterFromArchetype(sel.value);
        });

      document
        .getElementById('btn-mod12-scan-manuscript-chars')
        ?.addEventListener('click', () => {
          this.scanActiveChapterAndSuggestCharacters();
        });

      document
        .getElementById('btn-mod12-audit-knowledge-leaks')
        ?.addEventListener('click', () => {
          this.runKnowledgeAndPronounAuditOnActiveChapter();
        });
    }

    /**
     * Nạp một Khung cấu trúc mẫu theo thể loại (Light Novel / Trinh Thám / Tiên Hiệp / Đô Thị / Huyền Huyễn)
     */
    applyGenrePresetTemplate(presetId) {
      const tr12 = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      const preset =
        STORY_BIBLE_GENRE_PRESETS[presetId] ||
        STORY_BIBLE_GENRE_PRESETS.DEFAULT_UNIVERSAL;
      if (this.templateLocked) {
        this.utils.showToast(
          '🔒 Khung Cấu Trúc đang khóa! Hãy bấm mở khóa trước khi đổi sang mẫu thể loại mới.',
          'warning'
        );
        return;
      }

      const tplEl = document.getElementById('textarea-bible-template-frame');
      const renEl = document.getElementById('textarea-rendered-bible-content');
      const antiEl = document.getElementById('textarea-anti-cliche-blacklist');

      if (
        tplEl &&
        tplEl.value.trim().length > 40 &&
        !window.confirm(
          `${tr12('Áp dụng khung mẫu')} "${tr12(preset.label)}" ${tr12('vào ô Khung Cấu Trúc Story Bible?')}\n${tr12('(Nội dung Story Bible chính thức bên phải sẽ được giữ nguyên hoặc bổ sung nếu đang trống)')}`
        )
      ) {
        return;
      }

      this.activeGenrePresetId = preset.id;
      localStorage.setItem('noir_v38_active_bible_genre_preset', preset.id);

      const i18n = window.NoirStudio?.i18n;
      const localizedTpl = i18n?.translatePromptFrame
        ? i18n.translatePromptFrame(preset.templateText)
        : preset.templateText;
      if (tplEl) {
        tplEl.dataset.noirViDefaultSource = preset.templateText;
        tplEl.value = localizedTpl;
      }
      if (renEl && (!renEl.value.trim() || renEl.value.trim() === this.defaultTemplate.trim())) {
        renEl.dataset.noirViDefaultSource = preset.templateText;
        renEl.value = localizedTpl;
      }
      if (antiEl && Array.isArray(preset.sampleAntiCliche)) {
        const existing = antiEl.value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const translatedSamples = preset.sampleAntiCliche.map((s) =>
          i18n?.translateText ? i18n.translateText(s) : s
        );
        const combined = [...new Set([...existing, ...translatedSamples])];
        antiEl.value = combined.join(', ');
      }

      this.saveAllBibleData(false);
      this.utils.showToast(
        `📚 Đã nạp mẫu cấu trúc "${preset.badge}" vào Story Bible!`,
        'success'
      );
    }

    /**
     * Khung biểu mẫu tích hợp trực tiếp ngay bên dưới mục tương ứng trong Tab 4
     * (thay thế hoàn toàn cửa sổ window.prompt nổi của trình duyệt, dịch 100% đa ngôn ngữ).
     */
    openInlineEntityEditorForm(config = {}) {
      if (typeof document === 'undefined') return null;
      const tr = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      const esc = (s) => this.utils.escapeHtml(s);

      const containerId = config.containerId || 'character-profiles-list';
      const host = document.getElementById(containerId);
      if (!host) return null;
      const hiddenParent = host.closest('.hidden');
      if (hiddenParent) hiddenParent.classList.remove('hidden');

      const existing = document.getElementById('mod12-inline-entity-editor-box');
      if (existing) existing.remove();

      const fields = Array.isArray(config.fields) ? config.fields : [];
      const formBox = document.createElement('div');
      formBox.id = 'mod12-inline-entity-editor-box';
      formBox.className =
        'mb-3 p-3.5 rounded-2xl border-2 border-emerald-500/65 bg-zinc-900/95 text-zinc-100 shadow-xl space-y-2.5 select-text';

      const fieldsHtml = fields
        .map(
          (f, idx) => `
          <div class="space-y-1">
            <label for="mod12-inline-field-${idx}" class="block text-[11px] font-bold text-emerald-300">
              ${esc(tr(f.label || ''))}
            </label>
            <input
              id="mod12-inline-field-${idx}"
              data-field-key="${esc(f.key)}"
              type="text"
              value="${esc(f.defaultValue !== undefined ? tr(f.defaultValue) : '')}"
              placeholder="${esc(tr(f.placeholder || ''))}"
              class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
            />
          </div>
        `
        )
        .join('');

      formBox.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
          <div class="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
            <span>✨</span>
            <span>${esc(tr(config.title || 'Nhập thông tin hồ sơ'))}</span>
          </div>
          <button type="button" id="btn-mod12-inline-cancel-top" class="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-rose-600 text-[11px] text-zinc-300 hover:text-white font-bold">✕</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${fieldsHtml}
        </div>
        <div class="flex items-center justify-end gap-2 pt-1">
          <button type="button" id="btn-mod12-inline-cancel" class="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition">
            ${esc(tr('Hủy'))}
          </button>
          <button type="button" id="btn-mod12-inline-save" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow transition">
            ${esc(tr(config.submitLabel || '💾 Lưu vào Story Bible'))}
          </button>
        </div>
      `;

      host.insertBefore(formBox, host.firstChild);
      window.NoirNovel?.i18n?.translateElement?.(formBox);

      const firstInput = formBox.querySelector('input[data-field-key]');
      if (firstInput) {
        setTimeout(() => {
          firstInput.focus();
          firstInput.select?.();
        }, 20);
      }

      const closeForm = () => {
        formBox.remove();
      };

      const submitForm = () => {
        const values = {};
        formBox.querySelectorAll('input[data-field-key]').forEach((inp) => {
          const k = inp.getAttribute('data-field-key');
          if (k) values[k] = String(inp.value || '').trim();
        });
        if (typeof config.onSubmit === 'function') {
          const ok = config.onSubmit(values);
          if (ok !== false) {
            closeForm();
          }
        } else {
          closeForm();
        }
      };

      formBox.querySelector('#btn-mod12-inline-cancel-top')?.addEventListener('click', closeForm);
      formBox.querySelector('#btn-mod12-inline-cancel')?.addEventListener('click', closeForm);
      formBox.querySelector('#btn-mod12-inline-save')?.addEventListener('click', submitForm);
      formBox.querySelectorAll('input[data-field-key]').forEach((inp) => {
        inp.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            submitForm();
          } else if (ev.key === 'Escape') {
            ev.preventDefault();
            closeForm();
          }
        });
      });

      return formBox;
    }

    /**
     * Thêm nhân vật mới dựa trên Hình mẫu Tâm lý (Archetype)
     */
    addCharacterFromArchetype(archetypeId) {
      const tr = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      const arch =
        CHARACTER_ARCHETYPE_LIBRARY.find((a) => a.id === archetypeId) ||
        CHARACTER_ARCHETYPE_LIBRARY[0];

      this.openInlineEntityEditorForm({
        containerId: 'character-profiles-list',
        title: `${tr('Nhập tên cho nhân vật theo hình mẫu')}: ${tr(arch.label)}`,
        submitLabel: '💾 Lưu Nhân Vật',
        fields: [
          {
            key: 'name',
            label: 'Tên nhân vật:',
            defaultValue: 'Lâm Phong',
            placeholder: 'Nhập tên nhân vật mới (Ví dụ: Lâm Phong):'
          },
          {
            key: 'role',
            label: 'Vai trò trong truyện:',
            defaultValue: arch.role,
            placeholder: 'Vai trò của nhân vật (Ví dụ: Nhân vật chính / Phản diện):'
          },
          {
            key: 'traits',
            label: 'Tính cách, ngoại hình, mục tiêu:',
            defaultValue: `${tr(arch.traits)} (${tr('Vết thương tâm lý')}: ${tr(arch.innerWound)})`,
            placeholder: 'Tính cách, khả năng & động cơ cốt lõi:'
          },
          {
            key: 'speechStyle',
            label: 'Giọng điệu câu thoại & Cách xưng hô:',
            defaultValue: arch.speechStyle,
            placeholder: 'Cách xưng hô & Giọng điệu khi đối thoại:'
          }
        ],
        onSubmit: (vals) => {
          if (!vals.name) return false;
          this.characters.push({
            id: 'char_' + Date.now(),
            name: vals.name,
            role: vals.role || tr(arch.role),
            traits: vals.traits || `${tr(arch.traits)} (${tr('Vết thương tâm lý')}: ${tr(arch.innerWound)})`,
            speechStyle: vals.speechStyle || tr(arch.speechStyle),
            archetypeId: arch.id
          });
          this.renderCharactersUI();
          this.saveAllBibleData(true);
          return true;
        }
      });
    }

    /**
     * Quét bản thảo chương đang mở để tự động phát hiện nhân vật mới từ câu thoại "- Câu thoại (Tên nhân vật)"
     */
    scanActiveChapterAndSuggestCharacters() {
      const editorText =
        document.getElementById('textarea-chapter-content')?.value ||
        window.NoirStudio?.chapterManager?.getActiveChapter()?.content ||
        '';
      if (!editorText.trim()) {
        this.utils.showToast(
          '⚠️ Bản thảo chương đang mở hiện chưa có nội dung để quét nhân vật.',
          'warning'
        );
        return;
      }

      const discovered = AutoLoreEntityExtractor.discoverNewCharactersFromManuscript(
        editorText,
        this.characters
      );

      if (discovered.length === 0) {
        this.utils.showToast(
          '✅ Tất cả nhân vật có câu thoại trong chương này đều đã nằm trong Hồ Sơ Nhân Vật!',
          'info',
          3200
        );
        return;
      }

      let addedCount = 0;
      const tr12 = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      discovered.forEach((d) => {
        if (
          window.confirm(
            `${tr12('Phát hiện nhân vật')} "${d.name}" ${tr12('xuất hiện')} ${d.dialogueCount} ${tr12('lần trong câu thoại của chương hiện tại.')}\n${tr12('Bạn có muốn thêm')} "${d.name}" ${tr12('vào Hồ Sơ Nhân Vật Story Bible không?')}`
          )
        ) {
          this.characters.push({
            id: 'char_' + Date.now() + '_' + addedCount,
            name: d.name,
            role: d.suggestedRole,
            traits: 'Được trích xuất tự động từ bản thảo chương hiện tại',
            speechStyle: 'Nhất quán theo ngữ cảnh xuất hiện trong chương'
          });
          addedCount += 1;
        }
      });

      if (addedCount > 0) {
        this.renderCharactersUI();
        this.saveAllBibleData(true);
      }
    }

    /**
     * Kiểm toán nhanh xem bản thảo hiện tại có vi phạm Ma trận Ai Biết Gì hoặc lệch xưng hô không
     */
    runKnowledgeAndPronounAuditOnActiveChapter() {
      const editorText =
        document.getElementById('textarea-chapter-content')?.value ||
        window.NoirStudio?.chapterManager?.getActiveChapter()?.content ||
        '';
      if (!editorText.trim()) {
        this.utils.showToast('⚠️ Chương hiện tại đang trống, chưa có nội dung để kiểm toán.', 'warning');
        return;
      }

      const leaks = AsymmetricKnowledgeValidator.scanManuscriptForKnowledgeLeaks(
        editorText,
        this.knowledgeMatrix
      );
      const pronounWarnings = this.relationshipEngine.auditPronounConsistencyInText(
        editorText,
        this.characters
      );

      if (leaks.length === 0 && pronounWarnings.length === 0) {
        this.utils.showToast(
          '🛡️ Kiểm toán hoàn tất: Không phát hiện lỗi lộ bí mật sớm hay lệch đại từ xưng hô trong chương này!',
          'success',
          4000
        );
        return;
      }

      const reportLines = [];
      if (leaks.length > 0) {
        reportLines.push(`${tr12('⚠️ PHÁT HIỆN')} ${leaks.length} ${tr12('NGHI VẤN LỘ BÍ MẬT SỚM:')}`);
        leaks.forEach((lk, i) => {
          reportLines.push(
            `  ${i + 1}. ${tr12('Nhân vật')} [${lk.speaker}] ${tr12('thuộc diện CHƯA BIẾT')} "${lk.secret}", ${tr12('nhưng câu thoại có chứa từ khóa')} (${lk.matchedKeywords.join(', ')}):\n     "${lk.excerpt}"`
          );
        });
      }
      if (pronounWarnings.length > 0) {
        reportLines.push(`\n${tr12('⚠️ PHÁT HIỆN')} ${pronounWarnings.length} ${tr12('DÒNG THOẠI LỆCH ĐẠI TỪ XƯNG HÔ:')}`);
        pronounWarnings.forEach((pw, i) => {
          reportLines.push(`  ${i + 1}. ${tr12('Dòng #')}${pw.lineIndex}: ${tr12(pw.reason)}\n     "${pw.line}"`);
        });
      }

      window.alert(reportLines.join('\n'));
    }

    /**
     * Cập nhật giao diện nút Khóa / Mở khóa Khung Cấu Trúc Story Bible
     */
    updateLockButtonUI() {
      const btn = document.getElementById('btn-toggle-bible-template-lock');
      const tplEl = document.getElementById('textarea-bible-template-frame');
      if (tplEl) tplEl.readOnly = this.templateLocked;
      if (!btn) return;
      if (this.templateLocked) {
        btn.className =
          'px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]';
        btn.textContent = '🔒 Đã Khóa Khung (Bấm để mở)';
      } else {
        btn.className =
          'px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px]';
        btn.textContent = '🔓 Chốt Khung Cấu Trúc';
      }
    }

    /**
     * Đổi trạng thái Khóa / Mở khóa Khung Cấu Trúc Story Bible
     */
    toggleTemplateLock() {
      const constants = getStudioConstants();
      this.templateLocked = !this.templateLocked;
      localStorage.setItem(
        constants.STORAGE_KEYS.BIBLE_LOCKED,
        String(this.templateLocked)
      );
      this.updateLockButtonUI();
      this.saveAllBibleData(false);
      this.utils.showToast(
        this.templateLocked
          ? '🔒 Đã khóa Khung Cấu Trúc Story Bible để bảo vệ các đề mục cốt lõi!'
          : '🔓 Đã mở khóa Khung Cấu Trúc Story Bible để bạn tự do chỉnh sửa.',
        'info'
      );
    }

    /**
     * Lưu toàn bộ dữ liệu Story Bible xuống LocalStorage, IndexedDB và Ổ cứng cục bộ
     */
    async saveAllBibleData(showFeedback = true) {
      const constants = getStudioConstants();
      const tplEl = document.getElementById('textarea-bible-template-frame');
      const renEl = document.getElementById('textarea-rendered-bible-content');
      const antiEl = document.getElementById('textarea-anti-cliche-blacklist');

      if (tplEl) {
        localStorage.setItem(constants.STORAGE_KEYS.BIBLE_TEMPLATE, tplEl.value);
      }
      if (renEl) {
        localStorage.setItem(constants.STORAGE_KEYS.BIBLE_RENDERED, renEl.value);
      }
      if (antiEl) {
        localStorage.setItem(constants.STORAGE_KEYS.ANTI_CLICHE, antiEl.value);
      }

      this.idb.setLocalJSON(constants.STORAGE_KEYS.CHARACTERS, this.characters);
      this.idb.setLocalJSON(
        constants.STORAGE_KEYS.KNOWLEDGE_MATRIX,
        this.knowledgeMatrix
      );
      this.idb.setLocalJSON(constants.STORAGE_KEYS.CLUES_LEDGER, this.cluesLedger);
      this.relationshipEngine.saveRelationships();

      if (typeof this.idb.set === 'function') {
        await this.idb.set(constants.STORES.STORY_BIBLE, 'master_bible_v36', {
          template: tplEl?.value || '',
          rendered: renEl?.value || '',
          characters: this.characters,
          relationships: this.relationshipEngine.relationships,
          knowledgeMatrix: this.knowledgeMatrix,
          cluesLedger: this.cluesLedger,
          antiCliche: antiEl?.value || '',
          updatedAt: Date.now()
        });
      }

      if (this.fs && this.fs.rootHandle && typeof this.fs.writeTextFile === 'function') {
        await this.fs.writeTextFile(
          '03_Story_Bible_Local',
          'Story_Bible_Chinh_Thuc.txt',
          this.buildCompiledBibleBlockForPrompt()
        );
      }

      this.renderQuickCharacterChipsInTab1();
      this.updateCommandModalStatusPills();

      if (showFeedback) {
        this.utils.showToast(
          '🏛️ Đã lưu toàn bộ Story Bible, Nhân vật, Ma trận Ai Biết Gì & Phục bút (Sẵn sàng tích hợp vào Prompt Tổng)!',
          'success'
        );
      }
    }

    /**
     * Kết xuất danh sách Hồ sơ Nhân vật đa chiều (#character-profiles-list) tại Tab 4
     * kèm Ma trận Quan hệ & Xưng hô giữa các nhân vật
     */
    renderCharactersUI() {
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const charsBadge = document.getElementById('tab4-chars-count-badge');
      if (charsBadge) {
        charsBadge.dataset.i18nIgnore = '1';
        charsBadge.textContent = tr(`${this.characters.length} NV`);
      }
      const box = document.getElementById('character-profiles-list');
      if (!box) return;
      if (this.characters.length === 0) {
        box.innerHTML =
          '<div class="text-zinc-500 italic p-2">Chưa có hồ sơ nhân vật. Hãy bấm "+ Thêm Nhân Vật" hoặc chọn từ Hình mẫu để tạo!</div>';
        window.NoirNovel?.i18n?.translateElement?.(box);
        return;
      }

      const charCardsHtml = this.characters
        .map(
          (ch) => `
          <div class="p-3 rounded-xl border border-studioLightBorder dark:border-zinc-800 bg-studioLightBg dark:bg-zinc-950 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <div class="font-extrabold text-xs text-emerald-400">👤 <span>${this.utils.escapeHtml(
                tr(ch.name)
              )}</span> <span class="text-[10px] font-semibold text-zinc-400">(${this.utils.escapeHtml(
                tr(ch.role || 'Nhân vật')
              )})</span></div>
              <div class="flex items-center gap-1">
                <button type="button" data-rel-char="${this.utils.escapeHtml(
                  ch.id
                )}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-teal-600 text-[10px] text-teal-200 font-bold" title="Thiết lập quan hệ & đại từ xưng hô với nhân vật khác">🤝 Quan hệ</button>
                <button type="button" data-edit-char="${this.utils.escapeHtml(
                  ch.id
                )}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-indigo-600 text-[10px] text-white font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0">✏️ Sửa</button>
                <button type="button" data-del-char="${this.utils.escapeHtml(
                  ch.id
                )}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-[10px] text-white font-bold">✕</button>
              </div>
            </div>
            <div class="text-[11px] text-zinc-300"><strong>Tính cách & Đặc điểm:</strong> <span>${this.utils.escapeHtml(
              tr(ch.traits || 'Chưa mô tả')
            )}</span></div>
            <div class="text-[11px] text-amber-300/90"><strong>Giọng thoại & Xưng hô:</strong> <span>${this.utils.escapeHtml(
              tr(ch.speechStyle || 'Tự nhiên')
            )}</span></div>
          </div>
        `
        )
        .join('');

      const rels = this.relationshipEngine.relationships || [];
      const relSectionHtml =
        rels.length > 0
          ? `<div class="mt-3 pt-2.5 border-t border-zinc-800 space-y-1.5">
              <div class="text-[11px] font-extrabold uppercase text-teal-400">${this.utils.escapeHtml(tr(`🤝 Ma Trận Xưng Hô & Quan Hệ Đã Khóa (${rels.length}):`))}</div>
              ${rels
                .map(
                  (r) => `
                  <div class="px-2.5 py-1.5 rounded-lg border border-teal-500/30 bg-zinc-900/90 flex items-center justify-between gap-2 text-[11px]">
                    <div>
                      <strong data-i18n-ignore="true" class="text-emerald-300">${this.utils.escapeHtml(
                        r.sourceChar
                      )}</strong> ➔ <strong data-i18n-ignore="true" class="text-amber-300">${this.utils.escapeHtml(
                        r.targetChar
                      )}</strong>
                      <span data-i18n-ignore="true" class="text-zinc-400">(${this.utils.escapeHtml(
                        r.relationLabel
                      )})</span>:
                      <span class="text-teal-200 font-semibold">${this.utils.escapeHtml(tr('Xưng hô'))} "<span data-i18n-ignore="true">${this.utils.escapeHtml(
                        r.pronounPair
                      )}</span>"</span>
                    </div>
                    <button type="button" data-del-char-rel="${this.utils.escapeHtml(
                      r.id
                    )}" class="text-zinc-400 hover:text-rose-400 font-bold">✕</button>
                  </div>
                `
                )
                .join('')}
            </div>`
          : '';

      box.innerHTML = charCardsHtml + relSectionHtml;
      window.NoirNovel?.i18n?.translateElement?.(box);

      // Sự kiện sửa nhân vật (Mở biểu mẫu tích hợp trực tiếp bên dưới)
      box.querySelectorAll('[data-edit-char]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-edit-char');
          const ch = this.characters.find((x) => x.id === id);
          if (!ch) return;
          this.openInlineEntityEditorForm({
            containerId: 'character-profiles-list',
            title: `${tr('✏️ Sửa')}: ${ch.name}`,
            submitLabel: '💾 Lưu Nhân Vật',
            fields: [
              { key: 'name', label: 'Tên nhân vật:', defaultValue: ch.name, placeholder: 'Tên nhân vật:' },
              { key: 'role', label: 'Vai trò trong truyện:', defaultValue: ch.role || '', placeholder: 'Vai trò trong truyện:' },
              { key: 'traits', label: 'Tính cách, ngoại hình, mục tiêu:', defaultValue: ch.traits || '', placeholder: 'Tính cách, ngoại hình, mục tiêu:' },
              { key: 'speechStyle', label: 'Giọng điệu câu thoại & Cách xưng hô:', defaultValue: ch.speechStyle || '', placeholder: 'Giọng điệu câu thoại & Cách xưng hô:' }
            ],
            onSubmit: (vals) => {
              if (!vals.name) return false;
              ch.name = vals.name;
              ch.role = vals.role;
              ch.traits = vals.traits;
              ch.speechStyle = vals.speechStyle;
              this.renderCharactersUI();
              this.saveAllBibleData(false);
              return true;
            }
          });
        });
      });

      // Sự kiện xóa nhân vật
      box.querySelectorAll('[data-del-char]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-del-char');
          this.characters = this.characters.filter((x) => x.id !== id);
          this.renderCharactersUI();
          this.saveAllBibleData(false);
        });
      });

      // Sự kiện thêm mối quan hệ & đại từ xưng hô giữa 2 nhân vật
      box.querySelectorAll('[data-rel-char]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-rel-char');
          const srcChar = this.characters.find((x) => x.id === id);
          if (!srcChar) return;
          const defaultOther = this.characters.find((x) => x.id !== id)?.name || '';
          this.openInlineEntityEditorForm({
            containerId: 'character-profiles-list',
            title: `${tr('🤝 Quan hệ')}: ${srcChar.name}`,
            submitLabel: '💾 Lưu Quan Hệ',
            fields: [
              {
                key: 'targetName',
                label: 'Nhân vật đối phương:',
                defaultValue: defaultOther,
                placeholder: 'Nhập tên nhân vật đối phương...'
              },
              {
                key: 'relLabel',
                label: 'Mối quan hệ:',
                defaultValue: 'Đồng đội tin cậy / Đối thủ',
                placeholder: 'Đồng đội tin cậy / Đối thủ'
              },
              {
                key: 'pronounPair',
                label: 'Cặp đại từ xưng hô bắt buộc:',
                defaultValue: 'tôi - cậu',
                placeholder: 'Ví dụ: tôi - cậu, anh - em, ta - đạo hữu'
              }
            ],
            onSubmit: (vals) => {
              if (!vals.targetName) return false;
              this.relationshipEngine.addOrUpdateRelationship({
                sourceChar: srcChar.name,
                targetChar: vals.targetName,
                relationLabel: vals.relLabel || tr('Đồng hành'),
                pronounPair: vals.pronounPair || tr('tôi - cậu')
              });
              this.renderCharactersUI();
              this.saveAllBibleData(true);
              return true;
            }
          });
        });
      });

      // Sự kiện xóa mối quan hệ
      box.querySelectorAll('[data-del-char-rel]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const relId = btn.getAttribute('data-del-char-rel');
          this.relationshipEngine.deleteRelationship(relId);
          this.renderCharactersUI();
          this.saveAllBibleData(false);
        });
      });
    }

    /**
     * Thêm nhân vật mới tương tác trực tiếp từ nút "+ Thêm Nhân Vật" (biểu mẫu tích hợp tại chỗ)
     */
    addCharacterInteractive() {
      const tr = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      this.openInlineEntityEditorForm({
        containerId: 'character-profiles-list',
        title: '+ Thêm Nhân Vật Mới',
        submitLabel: '💾 Lưu Nhân Vật',
        fields: [
          {
            key: 'name',
            label: 'Tên nhân vật:',
            defaultValue: 'Lâm Phong',
            placeholder: 'Nhập tên nhân vật mới (Ví dụ: Lâm Phong):'
          },
          {
            key: 'role',
            label: 'Vai trò trong truyện:',
            defaultValue: 'Nhân vật chính',
            placeholder: 'Vai trò của nhân vật (Ví dụ: Nhân vật chính / Phản diện):'
          },
          {
            key: 'traits',
            label: 'Tính cách, ngoại hình, mục tiêu:',
            defaultValue: 'Thông minh, quyết đoán, mang bí mật quá khứ',
            placeholder: 'Tính cách, khả năng & động cơ cốt lõi:'
          },
          {
            key: 'speechStyle',
            label: 'Giọng điệu câu thoại & Cách xưng hô:',
            defaultValue: 'Điềm đạm, câu văn sắc gọn, xưng "tôi - cậu"',
            placeholder: 'Cách xưng hô & Giọng điệu khi đối thoại:'
          }
        ],
        onSubmit: (vals) => {
          if (!vals.name) return false;
          this.characters.push({
            id: 'char_' + Date.now(),
            name: vals.name,
            role: vals.role || tr('Nhân vật chính'),
            traits: vals.traits || '',
            speechStyle: vals.speechStyle || ''
          });
          this.renderCharactersUI();
          this.saveAllBibleData(true);
          return true;
        }
      });
    }

    /**
     * Kết xuất các nút Chèn Thoại Nhanh (#quick-character-chips-bar) trên thanh công cụ Bàn viết Tab 1
     * để tác giả bấm 1 chạm là chèn ngay câu thoại chuẩn `- ... (Tên nhân vật)`
     */
    renderQuickCharacterChipsInTab1() {
      const bar = document.getElementById('quick-character-chips-bar');
      if (!bar) return;
      if (this.characters.length === 0) {
        bar.innerHTML = '';
        return;
      }
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      bar.innerHTML =
        `<span class="text-[10px] text-zinc-400 font-bold mr-1">${this.utils.escapeHtml(tr('Chèn thoại nhanh:'))}</span>` +
        this.characters
          .slice(0, 6)
          .map(
            (c) =>
              `<button type="button" data-quick-char-name="${this.utils.escapeHtml(
                c.name
              )}" data-i18n-ignore="true" class="px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-bold transition" title="${this.utils.escapeHtml(tr(`Chèn câu thoại chuẩn của ${c.name} vào vị trí con trỏ`))}">💬 ${this.utils.escapeHtml(c.name)}</button>`
          )
          .join('');

      bar.querySelectorAll('[data-quick-char-name]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const charName = btn.getAttribute('data-quick-char-name');
          const editor = document.getElementById('textarea-chapter-content');
          if (!editor) return;
          const start = editor.selectionStart ?? editor.value.length;
          const end = editor.selectionEnd ?? editor.value.length;
          const selected = editor.value.slice(start, end).trim();
          const lineToInsert = selected
            ? `- ${selected} (${charName})`
            : `\n- ... (${charName})`;
          editor.setRangeText(lineToInsert, start, end, 'end');
          editor.focus();
          editor.dispatchEvent(new Event('input'));
        });
      });
    }

    /**
     * Kết xuất Ma trận Bất đối xứng "Ai Biết Gì" (#knowledge-matrix-list) tại Tab 4
     */
    renderKnowledgeMatrixUI() {
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const knowBadge = document.getElementById('tab4-knowledge-count-badge');
      if (knowBadge) {
        knowBadge.dataset.i18nIgnore = '1';
        knowBadge.textContent = tr(`${this.knowledgeMatrix.length} Bí mật`);
      }
      const box = document.getElementById('knowledge-matrix-list');
      if (!box) return;
      if (this.knowledgeMatrix.length === 0) {
        box.innerHTML =
          '<div class="text-zinc-500 italic p-2">Chưa có mục nào trong Ma trận Ai Biết Gì.</div>';
        window.NoirNovel?.i18n?.translateElement?.(box);
        return;
      }
      box.innerHTML = this.knowledgeMatrix
        .map(
          (item) => `
          <div class="p-3 rounded-xl border border-amber-500/30 bg-studioLightBg dark:bg-zinc-950 space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="font-extrabold text-xs text-amber-400">🔒 <span>Bí mật:</span> <span>${this.utils.escapeHtml(
                tr(item.secret)
              )}</span></span>
              <div class="flex items-center gap-1">
                <button type="button" data-edit-know="${this.utils.escapeHtml(
                  item.id
                )}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-indigo-600 text-[10px] text-white font-bold whitespace-nowrap inline-flex items-center gap-1 shrink-0">✏️ Sửa</button>
                <button type="button" data-del-know="${this.utils.escapeHtml(
                  item.id
                )}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-[10px] text-white font-bold">✕</button>
              </div>
            </div>
            <div class="text-[11px] text-emerald-300"><strong>✔ Người ĐÃ BIẾT:</strong> <span>${this.utils.escapeHtml(
              tr(item.whoKnows)
            )}</span></div>
            <div class="text-[11px] text-rose-300"><strong>✘ Người CHƯA BIẾT (Cấm AI lộ):</strong> <span>${this.utils.escapeHtml(
              tr(item.whoDoesNotKnow)
            )}</span></div>
          </div>
        `
        )
        .join('');
      window.NoirNovel?.i18n?.translateElement?.(box);

      box.querySelectorAll('[data-edit-know]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-edit-know');
          const item = this.knowledgeMatrix.find((x) => x.id === id);
          if (!item) return;
          this.openInlineEntityEditorForm({
            containerId: 'knowledge-matrix-list',
            title: '✏️ Sửa Ma trận Ai Biết Gì',
            submitLabel: '💾 Lưu Mục Bí Mật',
            fields: [
              { key: 'secret', label: 'Nội dung bí mật / sự thật:', defaultValue: item.secret, placeholder: 'Nhập bí mật / sự thật quan trọng trong cốt truyện:' },
              { key: 'whoKnows', label: 'Những nhân vật ĐÃ BIẾT sự thật này:', defaultValue: item.whoKnows || '', placeholder: 'Chỉ kẻ chủ mưu' },
              { key: 'whoDoesNotKnow', label: 'Những nhân vật TUYỆT ĐỐI CHƯA BIẾT (Cấm AI để lộ):', defaultValue: item.whoDoesNotKnow || '', placeholder: 'Nhân vật chính' }
            ],
            onSubmit: (vals) => {
              if (!vals.secret) return false;
              item.secret = vals.secret;
              item.whoKnows = vals.whoKnows;
              item.whoDoesNotKnow = vals.whoDoesNotKnow;
              this.renderKnowledgeMatrixUI();
              this.saveAllBibleData(false);
              return true;
            }
          });
        });
      });

      box.querySelectorAll('[data-del-know]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-del-know');
          this.knowledgeMatrix = this.knowledgeMatrix.filter((x) => x.id !== id);
          this.renderKnowledgeMatrixUI();
          this.saveAllBibleData(false);
        });
      });
    }

    /**
     * Thêm một mục mới vào Ma trận "Ai Biết Gì" (biểu mẫu tích hợp tại chỗ)
     */
    addKnowledgeEntryInteractive() {
      const tr = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      this.openInlineEntityEditorForm({
        containerId: 'knowledge-matrix-list',
        title: '+ Thêm Mục Ma Trận "Ai Biết Gì"',
        submitLabel: '💾 Lưu Mục Bí Mật',
        fields: [
          {
            key: 'secret',
            label: 'Nội dung bí mật / sự thật:',
            defaultValue: '',
            placeholder: 'Nhập bí mật / sự thật quan trọng trong cốt truyện:'
          },
          {
            key: 'whoKnows',
            label: 'Những nhân vật ĐÃ BIẾT sự thật này:',
            defaultValue: 'Chỉ kẻ chủ mưu',
            placeholder: 'Chỉ kẻ chủ mưu'
          },
          {
            key: 'whoDoesNotKnow',
            label: 'Những nhân vật TUYỆT ĐỐI CHƯA BIẾT (Cấm AI để lộ):',
            defaultValue: 'Nhân vật chính',
            placeholder: 'Nhân vật chính'
          }
        ],
        onSubmit: (vals) => {
          if (!vals.secret) return false;
          this.knowledgeMatrix.push({
            id: 'know_' + Date.now(),
            secret: vals.secret,
            whoKnows: vals.whoKnows || tr('Chỉ kẻ chủ mưu'),
            whoDoesNotKnow: vals.whoDoesNotKnow || tr('Nhân vật chính')
          });
          this.renderKnowledgeMatrixUI();
          this.saveAllBibleData(true);
          return true;
        }
      });
    }

    /**
     * Kết xuất Sổ cái Phục bút & Manh mối (#clues-ledger-list) tại Tab 4
     */
    renderCluesLedgerUI() {
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const cluesBadge = document.getElementById('tab4-clues-count-badge');
      if (cluesBadge) {
        cluesBadge.dataset.i18nIgnore = '1';
        cluesBadge.textContent = tr(`${this.cluesLedger.length} Phục bút`);
      }
      const box = document.getElementById('clues-ledger-list');
      if (!box) return;
      if (this.cluesLedger.length === 0) {
        box.innerHTML =
          '<div class="text-zinc-500 italic p-2">Chưa có phục bút nào. Hãy bấm "+ Gieo Phục Bút Mới"!</div>';
        window.NoirNovel?.i18n?.translateElement?.(box);
        return;
      }
      box.innerHTML = this.cluesLedger
        .map(
          (clue) => `
          <div class="p-3 rounded-xl border border-indigo-500/30 bg-studioLightBg dark:bg-zinc-950 space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="font-extrabold text-xs text-indigo-300">🔫 ${this.utils.escapeHtml(
                tr(clue.title)
              )}</span>
              <div class="flex items-center gap-1">
                <button type="button" data-toggle-clue="${this.utils.escapeHtml(
                  clue.id
                )}" class="px-2 py-0.5 rounded text-[10px] font-bold ${
            clue.status === 'RESOLVED'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }">${clue.status === 'RESOLVED' ? '✅ Đã thu hồi' : '⏳ Đang cài cắm'}</button>
                <button type="button" data-edit-clue="${this.utils.escapeHtml(
                  clue.id
                )}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-indigo-600 text-[10px] text-white font-bold">✏️</button>
                <button type="button" data-del-clue="${this.utils.escapeHtml(
                  clue.id
                )}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-[10px] text-white font-bold">✕</button>
              </div>
            </div>
            <div class="text-[11px] text-zinc-400"><span>Gieo tại:</span> <strong>${this.utils.escapeHtml(
              tr(clue.plantedIn || 'Chương 1')
            )}</strong> — <span>${this.utils.escapeHtml(tr(clue.note || ''))}</span></div>
          </div>
        `
        )
        .join('');
      window.NoirNovel?.i18n?.translateElement?.(box);

      box.querySelectorAll('[data-toggle-clue]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-toggle-clue');
          const c = this.cluesLedger.find((x) => x.id === id);
          if (c) {
            c.status = c.status === 'RESOLVED' ? 'PLANTED' : 'RESOLVED';
            this.renderCluesLedgerUI();
            this.saveAllBibleData(false);
          }
        });
      });

      box.querySelectorAll('[data-edit-clue]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-edit-clue');
          const c = this.cluesLedger.find((x) => x.id === id);
          if (!c) return;
          this.openInlineEntityEditorForm({
            containerId: 'clues-ledger-list',
            title: '✏️ Sửa Phục Bút & Manh Mối',
            submitLabel: '💾 Lưu Phục Bút',
            fields: [
              { key: 'title', label: 'Tên phục bút / vật chứng:', defaultValue: c.title, placeholder: 'Tên phục bút / vật chứng / chi tiết cài cắm:' },
              { key: 'plantedIn', label: 'Gieo tại chương nào?', defaultValue: c.plantedIn || '', placeholder: 'Chương hiện tại' },
              { key: 'note', label: 'Ý nghĩa & Kế hoạch thu hồi:', defaultValue: c.note || '', placeholder: 'Ý nghĩa hoặc dự kiến chương sẽ thu hồi phục bút này:' }
            ],
            onSubmit: (vals) => {
              if (!vals.title) return false;
              c.title = vals.title;
              c.plantedIn = vals.plantedIn;
              c.note = vals.note;
              this.renderCluesLedgerUI();
              this.saveAllBibleData(false);
              return true;
            }
          });
        });
      });

      box.querySelectorAll('[data-del-clue]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-del-clue');
          this.cluesLedger = this.cluesLedger.filter((x) => x.id !== id);
          this.renderCluesLedgerUI();
          this.saveAllBibleData(false);
        });
      });
    }

    /**
     * Gieo một Phục bút mới từ nút "+ Gieo Phục Bút Mới" (biểu mẫu tích hợp tại chỗ)
     */
    addClueEntryInteractive() {
      const tr = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      this.openInlineEntityEditorForm({
        containerId: 'clues-ledger-list',
        title: '+ Gieo Phục Bút Mới',
        submitLabel: '💾 Lưu Phục Bút',
        fields: [
          {
            key: 'title',
            label: 'Tên phục bút / vật chứng:',
            defaultValue: '',
            placeholder: 'Tên phục bút / vật chứng / chi tiết cài cắm:'
          },
          {
            key: 'plantedIn',
            label: 'Gieo tại chương nào?',
            defaultValue: 'Chương hiện tại',
            placeholder: 'Chương hiện tại'
          },
          {
            key: 'note',
            label: 'Ý nghĩa & Kế hoạch thu hồi:',
            defaultValue: '',
            placeholder: 'Ý nghĩa hoặc dự kiến chương sẽ thu hồi phục bút này:'
          }
        ],
        onSubmit: (vals) => {
          if (!vals.title) return false;
          this.cluesLedger.push({
            id: 'clue_' + Date.now(),
            title: vals.title,
            plantedIn: vals.plantedIn || tr('Chương hiện tại'),
            status: 'PLANTED',
            note: vals.note || ''
          });
          this.renderCluesLedgerUI();
          this.saveAllBibleData(true);
          return true;
        }
      });
    }

    /**
     * Cập nhật huy hiệu trạng thái Story Bible trên Cửa sổ Trung tâm Điều khiển AI (#cmd-bible-status-pill)
     */
    updateCommandModalStatusPills() {
      const constants = getStudioConstants();
      const biblePill = document.getElementById('cmd-bible-status-pill');
      if (biblePill) {
        const ren =
          document.getElementById('textarea-rendered-bible-content')?.value ||
          localStorage.getItem(constants.STORAGE_KEYS.BIBLE_RENDERED) ||
          '';
        const words = this.utils.countVietnameseWords(ren);
        const i18n = window.NoirStudio?.i18n;
        const rawText = `Story Bible: Đã nạp (${words} từ • ${this.characters.length} NV • ${this.cluesLedger.length} Phục bút)`;
        biblePill.setAttribute('data-i18n-ignore', 'true');
        biblePill.textContent = i18n?.translateText ? i18n.translateText(rawText) : rawText;
      }
    }

    /**
     * Tổng hợp toàn bộ dữ liệu Story Bible + Nhân vật + Quan hệ Xưng hô + Ma trận Ai Biết Gì
     * + Phục bút + Từ cấm thành một khối ngữ cảnh chuẩn mực để tự động đưa 100% vào Prompt Tổng Hợp!
     */
    buildCompiledBibleBlockForPrompt() {
      const cmdLinkChk = typeof document !== 'undefined' ? document.getElementById('chk-cmd-link-story-bible-file') : null;
      const masterLinkEnabled = cmdLinkChk
        ? Boolean(cmdLinkChk.checked)
        : localStorage.getItem('noir_v105_story_bible_file_link_enabled') !== '0';
      if (!masterLinkEnabled) {
        return '(Tác giả đã tắt liên kết Story Bible cho câu lệnh này)';
      }

      const constants = getStudioConstants();
      const tpl =
        document.getElementById('textarea-bible-template-frame')?.value ||
        localStorage.getItem(constants.STORAGE_KEYS.BIBLE_TEMPLATE) ||
        '';
      const ren =
        document.getElementById('textarea-rendered-bible-content')?.value ||
        localStorage.getItem(constants.STORAGE_KEYS.BIBLE_RENDERED) ||
        '';
      const anti =
        document.getElementById('textarea-anti-cliche-blacklist')?.value ||
        localStorage.getItem(constants.STORAGE_KEYS.ANTI_CLICHE) ||
        (constants.DEFAULT_ANTI_CLICHE || STORY_BIBLE_GENRE_PRESETS.DEFAULT_UNIVERSAL.sampleAntiCliche).join(', ');

      const charLines =
        this.characters.length > 0
          ? this.characters
              .map(
                (c, i) =>
                  `  ${i + 1}. [${c.name}] (${c.role || 'Nhân vật'}):\n     - Tính cách & Đặc điểm: ${
                    c.traits || 'Chưa ghi'
                  }\n     - Giọng thoại & Xưng hô bắt buộc: ${c.speechStyle || 'Tự nhiên'}`
              )
              .join('\n')
          : '  (Chưa khai báo danh sách nhân vật riêng)';

      const relBlock = this.relationshipEngine.buildRelationshipPromptSection();

      const knowLines =
        this.knowledgeMatrix.length > 0
          ? this.knowledgeMatrix
              .map(
                (k, i) =>
                  `  ${i + 1}. Bí mật "${k.secret}":\n     - Ai ĐÃ BIẾT: ${
                    k.whoKnows
                  }\n     - Ai CHƯA BIẾT (Tuyệt đối không được để lộ trong lời nói/suy nghĩ của họ): ${
                    k.whoDoesNotKnow
                  }`
              )
              .join('\n')
          : '  (Không có giới hạn bí mật đặc biệt)';

      const clueLines =
        this.cluesLedger.length > 0
          ? this.cluesLedger
              .map(
                (cl, i) =>
                  `  ${i + 1}. [${
                    cl.status === 'RESOLVED' ? 'ĐÃ THU HỒI' : 'ĐANG GIEO - CẦN DUY TRÌ LOGIC'
                  }] ${cl.title} (Gieo tại: ${cl.plantedIn}) — Ghi chú: ${cl.note || 'Không'}`
              )
              .join('\n')
          : '  (Chưa có phục bút nào)';

      const linkedFileData = this.getLinkedStoryBibleFileIfEnabled();
      const linkedFileSection =
        linkedFileData &&
        linkedFileData.text &&
        linkedFileData.text.trim() &&
        linkedFileData.text.trim() !== ren.trim()
          ? [
              ``,
              `[FILE STORY BIBLE ĐANG LIÊN KẾT TỰ ĐỘNG (${linkedFileData.fileName})]:`,
              linkedFileData.text.trim()
            ].join('\n')
          : '';

      const rawBlock = [
        `====================================================================`,
        `🏛️ HỒ SƠ STORY BIBLE & LUẬT BẤT KHẢ XÂM PHẠM (ĐÃ LIÊN KẾT TỰ ĐỘNG)`,
        `====================================================================`,
        `[1. NỘI DUNG STORY BIBLE CHÍNH THỨC]:`,
        ren.trim() || tpl.trim() || '(Chưa có nội dung Story Bible)',
        linkedFileSection,
        ``,
        `[2. HỒ SƠ NHÂN VẬT & GIỌNG ĐIỆU ĐỐI THOẠI]:`,
        charLines,
        relBlock,
        ``,
        `[3. MA TRẬN BẤT ĐỐI XỨNG "AI BIẾT GÌ" (CHỐNG LỘ BÍ MẬT SỚM)]:`,
        knowLines,
        ``,
        `[4. SỔ CÁI PHỤC BÚT & MANH MỐI (CHEKHOV'S GUN)]:`,
        clueLines,
        ``,
        `[5. DANH SÁCH TỪ SÁO RỖNG CẤM AI SỬ DỤNG]:`,
        `Tuyệt đối tránh dùng các cụm từ sáo rỗng sau: ${anti}`
      ]
        .filter((line) => line !== undefined)
        .join('\n');
      const i18n = window.NoirStudio?.i18n;
      return i18n?.translatePromptFrame ? i18n.translatePromptFrame(rawBlock) : rawBlock;
    }

    /**
     * Xây dựng câu lệnh tạo/cập nhật Story Bible 8 phần siêu chi tiết (bao phủ toàn bộ cấu trúc PDF mẫu),
     * tự động liệt kê tất cả các chương tác giả đã viết + Hồ sơ nhân vật + Ma trận Ai Biết Gì + Sổ cái phục bút!
     */
    buildDynamicNotebookLmStoryBiblePrompt() {
      const chaps = Array.isArray(window.NoirStudio?.chapterManager?.chapters)
        ? window.NoirStudio.chapterManager.chapters
        : [];
      const chapListText =
        chaps.length > 0
          ? chaps
              .map(
                (c, i) =>
                  `   ${i + 1}. ${c.displayTitle || c.title || `Chương ${i + 1}`} (${
                    c.wordCount || 0
                  } từ · ${c.status === 'APPROVED' ? 'Đã duyệt' : 'Bản nháp'})`
              )
              .join('\n')
          : '   (Đọc toàn bộ các chương hiện có trong tài liệu tải lên)';

      const clueSummary =
        this.cluesLedger.length > 0
          ? this.cluesLedger
              .map(
                (cl, i) =>
                  `   - [${cl.status === 'RESOLVED' ? 'ĐÃ THU HỒI' : 'ĐANG TREO'}] ${cl.title} (${cl.plantedIn || 'Chưa rõ'}) — ${cl.note || ''}`
              )
              .join('\n')
          : '   (Trích xuất đầy đủ mọi phục bút & manh mối mới từ các chương)';

      const knowSummary =
        this.knowledgeMatrix.length > 0
          ? this.knowledgeMatrix
              .map(
                (k, i) =>
                  `   - Bí mật "${k.secret}": ĐÃ BIẾT (${k.whoKnows}) | CHƯA BIẾT (${k.whoDoesNotKnow})`
              )
              .join('\n')
          : '   (Trích xuất toàn bộ bí mật chưa tiết lộ và ranh giới nhận thức giữa các nhân vật)';

      return [
        'Bạn là Biên Tập Viên Cốt Truyện & Chuyên Gia Kiểm Toán Trục Thời Gian Cấp Cao. Hãy đọc thật kỹ toàn bộ tệp PDF / các chương tiểu thuyết tôi tải lên (đúng trình tự từ Arc 1 / Hồi 1 đến chương cuối cùng) và biên soạn một BẢN STORY BIBLE TOÀN DIỆN & SIÊU CHI TIẾT.',
        '',
        '📚 DANH SÁCH CÁC CHƯƠNG HIỆN TÁC GIẢ ĐÃ VIẾT (BẮT BUỘC PHỦ ĐỦ 100%, KHÔNG BỎ SÓT CHƯƠNG NÀO):',
        chapListText,
        '',
        'NGUYÊN TẮC TỐI THƯỢNG (BẮT BUỘC TUÂN THỦ):',
        '- PHẢI CHI TIẾT HÓA CỰC SÂU, DÀI, ĐẦY ĐỦ TỪNG CON SỐ TIỀN BẠC, MỐC GIỜ/PHÚT, TÊN ĐƯỜNG/ĐỊA BÀN, VẬT CHỨNG, THƯƠNG TÍCH, LỜI THOẠI THEN CHỐT VÀ DIỄN BIẾN TÂM LÝ.',
        '- TUYỆT ĐỐI KHÔNG TÓM TẮT SƠ SÀI, KHÔNG GỘP CHUNG CHUNG, KHÔNG LƯỢC BỎ BẤT KỲ MANH MỐI HAY MỐC THỜI GIAN NÀO.',
        '- Trình bày rõ ràng có tiêu đề, gạch đầu dòng phân cấp và BẢNG 4 CỘT chuẩn để tôi copy thẳng vào Word / Google Docs / Studio:',
        '',
        '1. TÓM TẮT TIMELINE HÀNH TRÌNH CHI TIẾT (THEO TỪNG PHẦN / ARC → HỒI / CHƯƠNG → PHÂN CẢNH):',
        '   - Chia rõ từng Phần (Arc) -> từng Hồi/Chương -> từng Phân cảnh nhỏ (X.1, X.2, X.3...).',
        '   - Ghi rõ MỐC THỜI GIAN CHÍNH XÁC từng ngày/buổi/giờ/phút (vd: 09h42 sáng Thứ Sáu, 21h28 Thứ Sáu, 06h12 Thứ Bảy, 22h50...) và đếm ngược giữa các sự kiện.',
        '   - Ghi rõ diễn biến hành động, kỹ thuật/nghiệp vụ, con số tiền bạc/vật chứng và bước ngoặt tâm lý từng cảnh.',
        '',
        '2. CƠ CHẾ HỆ THỐNG / QUY TẮC THẾ GIỚI & NHIỆM VỤ ĐANG KÍCH HOẠT:',
        '   - Tên Hệ thống / Luật bất khả xâm phạm của thế giới, giới hạn năng lực, cơ chế cảnh báo.',
        '   - Trạng thái các Nhiệm vụ đã hoàn thành và Nhiệm vụ đang kích hoạt (thời hạn chót chính xác, yêu cầu kép bắt buộc, phần thưởng, hình phạt thất bại).',
        '',
        '3. BẢNG NHÂN VẬT & MẠNG LƯỚI QUAN HỆ (DẠNG BẢNG 4 CỘT CHI TIẾT):',
        '   - Cột 1: Nhân vật | Cột 2: Vai trò / Thân phận (tuổi, nghề nghiệp, quê quán) | Cột 3: Tính cách, Hành vi nổi bật đến hết chương mới nhất & Xưng hô | Cột 4: Trạng thái hiện tại (đang ở đâu, làm gì, thương tích/tâm lý ra sao).',
        '',
        '4. TÀI SẢN, QUYỀN LỰC, VŨ KHÍ DỮ LIỆU, BẰNG CHỨNG PHÁP LÝ & TÌNH TRẠNG THỂ CHẤT HIỆN TẠI:',
        '   - Tài chính khả dụng và tài chính ngầm cất giấu (ghi rõ từng đồng và từng vị trí giấu).',
        '   - Danh sách từng vật chứng, USB, video, giấy tờ y tế/pháp lý và nơi sao lưu.',
        '   - Tình trạng thể chất & thương tích hiện tại của nhân vật chính và đồng minh.',
        '',
        '5. NHỮNG NGÒI NỔ CẤP BÁCH CHỜ KÍCH NỔ (HỒI TIẾP THEO) & SỔ CÁI PHỤC BÚT (MANH MỐI):',
        '   - Liệt kê toàn bộ các ngòi nổ cấp bách, âm mưu, kế hoạch đang đếm ngược cho chương kế tiếp.',
        '   - Cập nhật đầy đủ Sổ cái Phục bút & Manh mối (đánh dấu [ĐANG TREO CHỜ THU HỒI] hoặc [ĐÃ GIẢI ĐÁP]).',
        '   - Sổ cái phục bút hiện ghi nhận trong Studio:',
        clueSummary,
        '',
        '6. NHỮNG BÍ MẬT CHƯA TIẾT LỘ (SECRETS KEPT HIDDEN) & MA TRẬN "AI BIẾT GÌ":',
        '   - Liệt kê từng bí mật cốt lõi, chỉ rõ tính đến chương cuối AI ĐÃ BIẾT, AI ĐANG NGHI NGỜ và AI TUYỆT ĐỐI CHƯA BIẾT.',
        '   - Ma trận hiện ghi nhận trong Studio:',
        knowSummary,
        '',
        '7. ĐỊA BÀN & ĐỊA ĐIỂM QUAN TRỌNG:',
        '   - Chiến trường, căn cứ, phòng trọ, trạm y tế, trụ sở đối thủ, hang ổ kẻ thù, địa bàn lưu trữ dữ liệu và mục tiêu tiếp theo.',
        '',
        '8. CHIẾN THUẬT & ĐÒN ĐẤU TRÍ THỰC CHIẾN NỔI BẬT:',
        '   - Tổng hợp từng chiến thuật/đòn phản kích đặc sắc đã và đang sử dụng (tên chiến thuật + cơ chế thực thi + điểm mù khai thác).'
      ].join('\n');
    }

    isLinkedStoryBibleFileEnabled() {
      try {
        return localStorage.getItem('noir_v105_story_bible_file_link_enabled') !== '0';
      } catch (_e) {
        return true;
      }
    }

    getLinkedStoryBibleFileData() {
      try {
        const raw = localStorage.getItem('noir_v105_linked_bible_file_v1');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.text === 'string' && parsed.text.trim()) {
          return parsed;
        }
      } catch (_e) {}
      return null;
    }

    getLinkedStoryBibleFileIfEnabled() {
      if (!this.isLinkedStoryBibleFileEnabled()) return null;
      return this.getLinkedStoryBibleFileData();
    }

    saveLinkedStoryBibleFileData(fileName, textContent) {
      const payload = {
        fileName: String(fileName || 'Story_Bible.pdf'),
        text: String(textContent || '').trim(),
        updatedAt: Date.now()
      };
      try {
        localStorage.setItem('noir_v105_linked_bible_file_v1', JSON.stringify(payload));
        localStorage.setItem('noir_v105_story_bible_file_link_enabled', '1');
      } catch (_e) {}
      this.refreshLinkedBibleFileBadgeUI();
      window.NoirStudio?.manuscriptSyncTracker?.markStoryBibleUpdatedNow?.();
      return payload;
    }

    refreshLinkedBibleFileBadgeUI() {
      const badge = document.getElementById('tab4-linked-bible-file-badge');
      const chkTab4 = document.getElementById('chk-tab4-link-bible-file');
      const chkCmd = document.getElementById('chk-cmd-link-story-bible-file');
      const enabled = this.isLinkedStoryBibleFileEnabled();
      if (chkTab4) chkTab4.checked = enabled;
      if (chkCmd) chkCmd.checked = enabled;
      if (!badge) return;
      const data = this.getLinkedStoryBibleFileData();
      if (data) {
        const words = this.utils.countVietnameseWords(data.text);
        badge.textContent = enabled
          ? `✅ Đang liên kết: ${data.fileName} (${words} từ)`
          : `⏸️ Đã tạm tắt liên kết: ${data.fileName}`;
        badge.className = enabled
          ? 'px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-monoCode text-[10px]'
          : 'px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 font-monoCode text-[10px]';
      } else {
        badge.textContent = 'Chưa chọn file riêng (đang dùng trực tiếp khung Story Bible)';
      }
    }

    extractPlainTextFromRichHtml(richEl) {
      if (!richEl) return '';
      const clone = richEl.cloneNode(true);
      // Chuyển bảng HTML thành dạng bảng Markdown rõ cột khi đồng bộ sang văn bản prompt
      clone.querySelectorAll('table').forEach((tbl) => {
        const rows = Array.from(tbl.querySelectorAll('tr')).map((tr) =>
          Array.from(tr.querySelectorAll('th,td'))
            .map((cell) => String(cell.textContent || '').replace(/\s+/g, ' ').trim())
            .join(' | ')
        );
        const pre = document.createTextNode('\n' + rows.join('\n') + '\n');
        tbl.replaceWith(pre);
      });
      return String(clone.innerText || clone.textContent || '').replace(/\r\n/g, '\n').trim();
    }

    plainTextToRichHtml(plainText) {
      const esc = this.utils.escapeHtml.bind(this.utils);
      return String(plainText || '')
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return '<br>';
          if (/^(===|###|\d+\.\s+[A-ZÀ-Ỹ])/.test(trimmed)) {
            return `<div><strong>${esc(line)}</strong></div>`;
          }
          return `<div>${esc(line)}</div>`;
        })
        .join('');
    }

    async exportStoryBibleToPdfAndFolder() {
      const renEl = document.getElementById('textarea-rendered-bible-content');
      const richEl = document.getElementById('tab4-rich-bible-editor');
      const plainContent = (renEl?.value || '').trim();
      const richHtml = (richEl?.innerHTML || '').trim() || this.plainTextToRichHtml(plainContent);

      if (!plainContent && !richHtml) {
        this.utils.showToast('⚠️ Story Bible hiện đang trống, hãy nhập nội dung trước khi xuất file!', 'warning', 3200);
        return false;
      }

      const bookTitle =
        document.getElementById('export-book-title-input')?.value?.trim() ||
        localStorage.getItem('noir_s6_book_title') ||
        'Story Bible Tiểu Thuyết';
      const esc = this.utils.escapeHtml.bind(this.utils);
      const safeStamp = new Date().toISOString().slice(0, 10);
      const pdfDocTitle = `Story_Bible_${safeStamp}`;

      const printableHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${esc(pdfDocTitle)} — ${esc(bookTitle)}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family: "Times New Roman", "Segoe UI", Georgia, serif; color: #111827; line-height: 1.65; font-size: 12pt; max-width: 820px; margin: 0 auto; padding: 18px; }
    h1 { font-size: 18pt; border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10.5pt; }
    th, td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: bold; }
    img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }
    .meta { color: #4b5563; font-size: 10pt; margin-bottom: 14px; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="background:#ecfdf5;border:1px solid #10b981;padding:10px 14px;border-radius:10px;margin-bottom:16px;font-family:system-ui,sans-serif;font-size:13px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
    <span>📄 <strong>Story Bible PDF đã sẵn sàng!</strong> Chọn <strong>"Save as PDF / Lưu dưới dạng PDF"</strong> trong hộp thoại in để tải xuống.</span>
    <button onclick="window.print()" style="background:#059669;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;">🖨️ Lưu thành PDF</button>
  </div>
  <h1>📖 STORY BIBLE: ${esc(bookTitle)}</h1>
  <div class="meta">Cập nhật lúc: ${esc(this.utils.formatTimestampVN(Date.now()))}</div>
  <div>${richHtml}</div>
  <script>window.onload = function(){ setTimeout(function(){ try { window.print(); } catch(e){} }, 350); };</script>
</body>
</html>`;

      // 1) Mở hộp thoại tải PDF tức thì (100% nội bộ trên máy người dùng)
      const printWin = window.open('', '_blank', 'width=980,height=820');
      if (printWin && printWin.document) {
        printWin.document.open();
        printWin.document.write(printableHtml);
        printWin.document.close();
      } else {
        // Fallback tải file HTML chuẩn mở in PDF
        const blob = new Blob([printableHtml], { type: 'text/html;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${pdfDocTitle}.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }

      // 2) Tự động copy nội bộ vào thư mục con "Story Bible" cạnh các chương truyện trong thư mục làm việc thật (nếu đã nối ổ cứng)
      let savedToFolder = false;
      try {
        const rootHandle = this.fs?.rootHandle || window.NoirStudio?.fsEngine?.rootHandle;
        if (rootHandle && typeof rootHandle.getDirectoryHandle === 'function') {
          const bibleDir = await rootHandle.getDirectoryHandle('Story Bible', { create: true });
          const htmlHandle = await bibleDir.getFileHandle(`${pdfDocTitle}.html`, { create: true });
          const w1 = await htmlHandle.createWritable();
          await w1.write(printableHtml);
          await w1.close();

          const txtHandle = await bibleDir.getFileHandle(`${pdfDocTitle}.txt`, { create: true });
          const w2 = await txtHandle.createWritable();
          await w2.write(plainContent || this.extractPlainTextFromRichHtml(richEl));
          await w2.close();
          savedToFolder = true;
        }
      } catch (_eFs) {}

      // 3) Ưu tiên tự động liên kết chính file Story Bible vừa xuất làm nguồn mặc định cho Chế độ 1–6
      this.saveLinkedStoryBibleFileData(
        `${pdfDocTitle}.pdf`,
        plainContent || this.extractPlainTextFromRichHtml(richEl)
      );

      this.utils.showToast(
        savedToFolder
          ? `📄 Đã mở tải PDF Story Bible, tự động lưu bản sao vào thư mục "Story Bible/" cạnh các chương & bật liên kết mặc định cho Chế độ 1–6!`
          : `📄 Đã mở tải PDF Story Bible & bật liên kết mặc định cho Chế độ 1–6! (Nối thư mục ổ cứng để tự chép vào thư mục con "Story Bible/")`,
        'success',
        5200
      );
      return true;
    }

    async importStoryBibleFromPickedFile(file) {
      if (!file) return false;
      try {
        let extractedText = '';
        const lower = String(file.name || '').toLowerCase();
        const importer = window.NoirStudio?.docImporter;
        if (lower.endsWith('.pdf') && importer?.extractPdfContent) {
          const res = await importer.extractPdfContent(file, file.name);
          extractedText = String(res?.content || res?.text || '').trim();
        } else if (lower.endsWith('.docx') && importer?.extractDocxContent) {
          const res = await importer.extractDocxContent(file, file.name);
          extractedText = String(res?.content || res?.text || '').trim();
        } else {
          const rawStr = await file.text();
          if (lower.endsWith('.html') || lower.endsWith('.htm')) {
            const tmp = document.createElement('div');
            tmp.innerHTML = rawStr;
            extractedText = this.extractPlainTextFromRichHtml(tmp);
          } else {
            extractedText = rawStr.trim();
          }
        }

        if (!extractedText) {
          this.utils.showToast('⚠️ Không trích xuất được nội dung văn bản từ tệp Story Bible vừa chọn.', 'warning', 3500);
          return false;
        }

        this.saveLinkedStoryBibleFileData(file.name, extractedText);

        // Nếu khung Story Bible chính thức đang ngắn/mặc định, tự điền luôn để tác giả xem và chỉnh sửa trực tiếp
        const renEl = document.getElementById('textarea-rendered-bible-content');
        const richEl = document.getElementById('tab4-rich-bible-editor');
        if (renEl && renEl.value.trim().length < 200) {
          renEl.value = extractedText;
          if (richEl) {
            richEl.innerHTML = this.plainTextToRichHtml(extractedText);
            try { localStorage.setItem('noir_v105_bible_rich_html_v1', richEl.innerHTML); } catch (_e) {}
          }
          this.saveAllBibleData(false);
        }

        const words = this.utils.countVietnameseWords(extractedText);
        this.utils.showToast(
          `✅ Đã chọn & liên kết File Story Bible "${file.name}" (${words} từ) cho toàn bộ Chế độ 1–6!`,
          'success',
          4400
        );
        return true;
      } catch (err) {
        this.utils.showToast(`❌ Lỗi đọc File Story Bible: ${err?.message || err}`, 'error', 4200);
        return false;
      }
    }

    bindV105RichBibleAndFileControls() {
      const renEl = document.getElementById('textarea-rendered-bible-content');
      const richEl = document.getElementById('tab4-rich-bible-editor');
      const btnModeRich = document.getElementById('btn-tab4-bible-mode-rich');
      const btnModePlain = document.getElementById('btn-tab4-bible-mode-plain');
      const richToolbar = document.getElementById('tab4-rich-bible-toolbar');

      // 1) Khởi tạo nội dung Rich Editor kiểu Word / Google Docs (giữ trọn bảng, emoji, icon, ảnh)
      if (richEl && !richEl.dataset.v105RichBound) {
        richEl.dataset.v105RichBound = '1';
        const savedRichHtml = localStorage.getItem('noir_v105_bible_rich_html_v1') || '';
        const savedPlain = renEl?.value || '';
        if (savedRichHtml && savedRichHtml.trim()) {
          richEl.innerHTML = savedRichHtml;
        } else if (savedPlain.trim()) {
          richEl.innerHTML = this.plainTextToRichHtml(savedPlain);
        }

        const syncRichToPlainAndSave = () => {
          const htmlNow = richEl.innerHTML;
          try {
            localStorage.setItem('noir_v105_bible_rich_html_v1', htmlNow);
          } catch (_eQuota) {}
          if (renEl) {
            renEl.value = this.extractPlainTextFromRichHtml(richEl);
          }
          this.saveAllBibleData(false);
          window.NoirStudio?.manuscriptSyncTracker?.markStoryBibleUpdatedNow?.();
        };

        richEl.addEventListener('input', syncRichToPlainAndSave);
        richEl.addEventListener('paste', () => {
          setTimeout(() => {
            syncRichToPlainAndSave();
            const txt = (renEl?.value || '').trim();
            if (txt.length >= 60) {
              this.syncStructuredEntitiesFromOfficialBible({ isAutoPaste: true });
            }
          }, 120);
        });

        const setEditorViewMode = (isRich) => {
          if (isRich) {
            if (renEl && !richEl.innerHTML.trim() && renEl.value.trim()) {
              richEl.innerHTML = this.plainTextToRichHtml(renEl.value);
            }
            richEl.classList.remove('hidden');
            richToolbar?.classList.remove('hidden');
            renEl?.classList.add('hidden');
            if (btnModeRich) btnModeRich.className = 'px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] transition';
            if (btnModePlain) btnModePlain.className = 'px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white font-bold text-[10px] transition';
          } else {
            if (renEl) renEl.value = this.extractPlainTextFromRichHtml(richEl) || renEl.value;
            richEl.classList.add('hidden');
            richToolbar?.classList.add('hidden');
            renEl?.classList.remove('hidden');
            if (btnModePlain) btnModePlain.className = 'px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] transition';
            if (btnModeRich) btnModeRich.className = 'px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white font-bold text-[10px] transition';
          }
        };

        btnModeRich?.addEventListener('click', () => setEditorViewMode(true));
        btnModePlain?.addEventListener('click', () => setEditorViewMode(false));

        document.querySelectorAll('[data-rich-cmd]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const cmd = btn.getAttribute('data-rich-cmd');
            richEl.focus();
            try { document.execCommand(cmd, false, null); } catch (_e) {}
            syncRichToPlainAndSave();
          });
        });

        document.getElementById('btn-tab4-rich-insert-table')?.addEventListener('click', () => {
          richEl.focus();
          const tableHtml = `
            <table>
              <thead>
                <tr><th>Nhân vật</th><th>Vai trò / Thân phận</th><th>Tính cách &amp; Hành vi</th><th>Trạng thái hiện tại</th></tr>
              </thead>
              <tbody>
                <tr><td>Tên nhân vật</td><td>Vai trò</td><td>Đặc điểm nổi bật</td><td>Đang ở đâu / tình trạng</td></tr>
              </tbody>
            </table><div><br></div>`;
          try {
            document.execCommand('insertHTML', false, tableHtml);
          } catch (_e) {
            richEl.insertAdjacentHTML('beforeend', tableHtml);
          }
          syncRichToPlainAndSave();
        });

        const imgBtn = document.getElementById('btn-tab4-rich-insert-img');
        const imgInput = document.getElementById('input-tab4-rich-insert-img');
        imgBtn?.addEventListener('click', () => imgInput?.click());
        imgInput?.addEventListener('change', () => {
          const f = imgInput.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result || '');
            if (!dataUrl) return;
            richEl.focus();
            const imgHtml = `<img src="${dataUrl}" alt="${this.utils.escapeHtml(f.name)}" /><div><br></div>`;
            try { document.execCommand('insertHTML', false, imgHtml); } catch (_e) { richEl.insertAdjacentHTML('beforeend', imgHtml); }
            syncRichToPlainAndSave();
          };
          reader.readAsDataURL(f);
          imgInput.value = '';
        });

        document.getElementById('btn-tab4-rich-copy-html')?.addEventListener('click', async () => {
          const html = richEl.innerHTML;
          const plain = this.extractPlainTextFromRichHtml(richEl);
          try {
            if (navigator.clipboard?.write && typeof ClipboardItem === 'function') {
              await navigator.clipboard.write([
                new ClipboardItem({
                  'text/html': new Blob([html], { type: 'text/html' }),
                  'text/plain': new Blob([plain], { type: 'text/plain' })
                })
              ]);
            } else {
              await navigator.clipboard.writeText(plain);
            }
            this.utils.showToast('📋 Đã copy Story Bible giữ nguyên bảng, icon, emoji & định dạng!', 'success', 3200);
          } catch (_e) {
            await window.NoirStudio?.geminiSplitBridge?.copyTextReliable?.(plain);
            this.utils.showToast('📋 Đã sao chép nội dung Story Bible!', 'success', 2600);
          }
        });
      }

      // 2) Các nút File Story Bible (Xuất PDF + Lưu thư mục Story Bible & Chọn File liên kết mặc định bật)
      const btnExportPdf = document.getElementById('btn-tab4-export-bible-pdf-file');
      if (btnExportPdf && !btnExportPdf.dataset.v105Bound) {
        btnExportPdf.dataset.v105Bound = '1';
        btnExportPdf.addEventListener('click', () => this.exportStoryBibleToPdfAndFolder());
      }

      const btnPickFile = document.getElementById('btn-tab4-pick-bible-file');
      const inputPickFile = document.getElementById('input-tab4-pick-bible-file');
      if (btnPickFile && inputPickFile && !btnPickFile.dataset.v105Bound) {
        btnPickFile.dataset.v105Bound = '1';
        btnPickFile.addEventListener('click', () => inputPickFile.click());
        inputPickFile.addEventListener('change', async () => {
          const f = inputPickFile.files?.[0];
          if (f) await this.importStoryBibleFromPickedFile(f);
          inputPickFile.value = '';
        });
      }

      const chkTab4Link = document.getElementById('chk-tab4-link-bible-file');
      if (chkTab4Link && !chkTab4Link.dataset.v105Bound) {
        chkTab4Link.dataset.v105Bound = '1';
        chkTab4Link.addEventListener('change', () => {
          try {
            localStorage.setItem('noir_v105_story_bible_file_link_enabled', chkTab4Link.checked ? '1' : '0');
          } catch (_e) {}
          this.refreshLinkedBibleFileBadgeUI();
        });
      }
      this.refreshLinkedBibleFileBadgeUI();

      // 3) Nút Chia đôi màn hình với NotebookLM & 2 link gạch chân nhắc cập nhật Story Bible ở Tab 4
      const launchTab4NotebookLm = async (splitMode) => {
        const freshPrompt = this.buildDynamicNotebookLmStoryBiblePrompt();
        const promptBox = document.getElementById('textarea-tab4-notebooklm-prompt');
        if (promptBox) promptBox.value = freshPrompt;
        if (splitMode) {
          window.NoirStudio?.geminiSplitBridge?.triggerSplitScreenForCurrentContext?.(
            'NOTEBOOKLM',
            'TAB4_STORY_BIBLE',
            freshPrompt
          );
        } else {
          await window.NoirStudio?.geminiSplitBridge?.copyTextReliable?.(freshPrompt);
          this.utils.showToast(
            '✅ Đã copy sẵn câu lệnh khung Story Bible siêu chi tiết & mở Google NotebookLM!',
            'success',
            4000
          );
          window.open('https://notebooklm.google.com/', '_blank', 'noopener,noreferrer');
        }
      };

      const bindOnce = (id, fn) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.v105NblmBound) {
          el.dataset.v105NblmBound = '1';
          el.addEventListener('click', fn);
        }
      };
      bindOnce('btn-tab4-split-notebooklm', () => launchTab4NotebookLm(true));
      bindOnce('btn-tab4-stale-open-nblm', () => launchTab4NotebookLm(false));
      bindOnce('btn-tab4-stale-split-nblm', () => launchTab4NotebookLm(true));
    }
  }

  // ==========================================================================
  // PHẦN 8: KHỞI TẠO ĐỐI TƯỢNG TOÀN CỤC & ĐĂNG KÝ VÀO WINDOW.NOIRSTUDIO
  // ==========================================================================
  const storyBibleEngine = new StoryBibleAndLoreMatrixEngine(
    window.NoirStudio?.idb || null,
    window.NoirStudio?.fsEngine || null,
    window.NoirStudio?.utils || null
  );

  window.StoryBibleAndLoreMatrixEngine = StoryBibleAndLoreMatrixEngine;
  window.STORY_BIBLE_GENRE_PRESETS = STORY_BIBLE_GENRE_PRESETS;
  window.CHARACTER_ARCHETYPE_LIBRARY = CHARACTER_ARCHETYPE_LIBRARY;
  window.VIETNAMESE_PRONOUN_PRESETS = VIETNAMESE_PRONOUN_PRESETS;
  window.CHEKHOV_CLUE_PRESET_PACKS = CHEKHOV_CLUE_PRESET_PACKS;
  window.KNOWLEDGE_MATRIX_PRESET_PACKS = KNOWLEDGE_MATRIX_PRESET_PACKS;
  window.NoirStudio.storyBible = storyBibleEngine;
  window.NoirStudio.bibleEngine = storyBibleEngine;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      storyBibleEngine.init();
    });
  } else {
    setTimeout(() => {
      storyBibleEngine.init();
    }, 0);
  }
})();
