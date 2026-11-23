/**
 * ============================================================================
 * 🎱 MODULE 27: TRỢ LÝ LINH VẬT VIÊN BI SỐ 8 & PHÒNG CHAT GEMINI TỰ DO KÉP
 * (mod27_mascot_bi_so_8_and_dual_chat_assistant.js — v38.0 SUPREME EDITION)
 * ============================================================================
 * Đóng vai trò là Người Bạn Đồng Hành Văn Chương 24/7 của Tác giả Bi:
 * 1. Trí Tuệ Kép (Dual-Mode Intelligence — Online Gemini API + Offline Encyclopedia):
 *    - Khi chưa nhập API Key hoặc mất mạng: Viên Bi Số 8 vẫn trả lời tức thì
 *      mọi câu hỏi về cách dùng 6 Màn hình Studio, Lắc Bi Tiên Tri Cốt Truyện,
 *      Đặt Tên Nhân Vật (Việt Nam, Hán Việt Cổ Phong, Nhật Bản Light Novel,
 *      Âu Mỹ Kỳ Ảo/Noir), Gợi ý Cú Twist Bẻ Lái, Mẫu Hội Thoại và Gỡ Bí.
 *    - Khi đã kết nối Gemini API Key tại Tab 6: Tự động kết hợp kho tri thức
 *      nội bộ với mô hình Gemini đang chọn (`geminiRouter.generateTextWithFallback`),
 *      đồng thời tự động đọc ngữ cảnh Chương đang viết + Hồ sơ Story Bible để
 *      bàn luận cốt truyện sâu sắc như một biên tập viên riêng.
 * 2. Tích Hợp Giọng Đọc Tiếng Việt Tự Nhiên (Web Speech API TTS):
 *    - Hỗ trợ đọc to câu trả lời của Viên Bi Số 8 hoặc đọc thử câu thoại nhân vật
 *      bằng giọng Tiếng Việt (`vi-VN`).
 * 3. Tương Tác Trực Tiếp Với Bản Thảo & Story Bible:
 *    - Cho phép chèn bất kỳ ý tưởng/đoạn văn nào trong khung Chat thẳng vào
 *      Bản thảo Tab 1, Bảng trắng nháp nhanh, hoặc lưu vào Story Bible Tab 4.
 * ============================================================================
 */
(function () {
  'use strict';

  window.NoirStudio = window.NoirStudio || {};
  if (window.NoirStudio.__MOD27_MASCOT_CHAT_LOADED__) return;
  window.NoirStudio.__MOD27_MASCOT_CHAT_LOADED__ = true;

  // ==========================================================================
  // PHẦN 1: BÁCH KHOA TOÀN THƯ NỘI BỘ CỦA VIÊN BI SỐ 8 (OFFLINE ENCYCLOPEDIA)
  //         1.1. 28 Quẻ Tiên Tri Cốt Truyện (Magic 8-Ball Literary Oracles)
  //         1.2. Từ Điển Đặt Tên Nhân Vật Đa Văn Hóa (Việt, Hán Việt, Nhật, Âu)
  //         1.3. Kho 36 Khuôn Mẫu Bẻ Lái Cốt Truyện (Plot Twist Archetypes)
  //         1.4. Cẩm Nang Giải Đáp Nhanh Mọi Tính Năng Studio (FAQ Knowledge)
  // ==========================================================================
  const MAGIC_8_BALL_LITERARY_ORACLES = [
    {
      code: 'ORACLE_01',
      verdict: '🎱 Quẻ Đại Cát Văn Chương — HÃY ĐẨY CAO TRÀO NGAY!',
      advice:
        'Viên Bi Số 8 nhìn thấy một ngọn lửa xung đột đang âm ỉ. Đừng trì hoãn nữa: hãy để nhân vật chính buộc phải đưa ra lựa chọn mất mát ngay trong phân cảnh này!',
      twistHint: 'Một lời nói dối tưởng như vô hại ở chương trước bất ngờ bị phơi bày đúng lúc căng thẳng nhất.'
    },
    {
      code: 'ORACLE_02',
      verdict: '🎱 Quẻ Minh Nguyệt Ẩn Mây — GIỮ BÍ MẬT THÊM MỘT CHƯƠNG NỮA!',
      advice:
        'Chưa phải lúc lật hết bài ngửa. Hãy chỉ hé lộ một nửa sự thật (1 manh mối vật lý nhỏ) để độc giả tò mò đến mất ngủ, rồi chuyển góc nhìn sang nhân vật khác.',
      twistHint: 'Người đang giữ chìa khóa giải mã thực ra cũng đang bị một thế lực thứ ba thao túng.'
    },
    {
      code: 'ORACLE_03',
      verdict: '🎱 Quẻ Nghịch Lưu Phản Kích — ĐẢO NGƯỢC VỊ THẾ KẺ ĐI SĂN!',
      advice:
        'Nhân vật của bạn đang ở thế bị động hơi lâu. Hãy cho họ tận dụng chính điểm yếu hoặc vết thương hiện tại để giăng bẫy ngược lại đối thủ!',
      twistHint: 'Vật phẩm tưởng như vô dụng được nhặt ở đầu chương chính là chìa khóa lật ngược thế cờ.'
    },
    {
      code: 'ORACLE_04',
      verdict: '🎱 Quẻ Tĩnh Trung Hữu Động — LẶNGSÂU TRƯỚC CƠN BÃO!',
      advice:
        'Sau nhiều cảnh căng thẳng liên tiếp, hãy viết một phân đoạn đối thoại đời thường ấm áp (bên tách trà nóng, dưới hiên mưa). Chính sự bình yên này sẽ làm cú sốc tiếp theo đau đớn gấp bội.',
      twistHint: 'Trong cuộc trò chuyện bình dị đó, một nhân vật vô tình buột miệng nói ra chi tiết mà lẽ ra họ không thể biết.'
    },
    {
      code: 'ORACLE_05',
      verdict: '🎱 Quẻ Đồng Minh Giả Diện — HÃY NGHI NGỜ NGƯỜI ĐÁNG TIN NHẤT!',
      advice:
        'Mạch truyện sẽ bùng nổ nếu người luôn mỉm cười giúp đỡ nhân vật chính từ Chương 1 thực chất có một mục đích hoàn toàn riêng biệt.',
      twistHint: 'Họ không phản bội vì ác ý, mà vì muốn bảo vệ một lời thề lớn hơn.'
    },
    {
      code: 'ORACLE_06',
      verdict: '🎱 Quẻ Phục Bút Thu Hồi — ĐẾN LÚC NỔ SÚNG CHEKHOV!',
      advice:
        'Hãy mở Tab 4 (Sổ Cái Phục Bút) và chọn ngay một manh mối đã gieo từ các chương trước để kích hoạt trong chương này. Độc giả cực kỳ phấn khích khi thấy mọi chi tiết nhỏ đều có ý nghĩa!',
      twistHint: 'Chi tiết nhỏ từng bị nhân vật chính bỏ qua lại chính là bằng chứng ngoại phạm duy nhất.'
    },
    {
      code: 'ORACLE_07',
      verdict: '🎱 Quẻ Tâm Ma Đối Ảnh — XUNG ĐỘT NỘI TÂM LÀ TRỌNG TÂM!',
      advice:
        'Kẻ thù bên ngoài không đáng sợ bằng vết rạn nứt bên trong lòng nhân vật. Hãy khắc họa sự giằng xé giữa Lý Trí (nhiệm vụ) và Tình Cảm (người thân).',
      twistHint: 'Để cứu toàn cục, nhân vật buộc phải tự tay phá hủy thứ mình trân quý nhất.'
    },
    {
      code: 'ORACLE_08',
      verdict: '🎱 Quẻ Song Tuyến Giao Thoa — ĐỔI GÓC NHÌN (POV) ĐỘT NGỘT!',
      advice:
        'Hãy bấm nút "🎬 + Chèn Mốc Chuyển Phân Cảnh / Đổi POV" ở Tab 3 để kể lại sự kiện vừa rồi qua con mắt của nhân vật đối lập. Góc nhìn mới sẽ làm độc giả vỡ òa!',
      twistHint: 'Hành động tưởng như tàn nhẫn của đối phương hóa ra là nỗ lực tuyệt vọng để ngăn chặn thảm họa.'
    },
    {
      code: 'ORACLE_09',
      verdict: '🎱 Quẻ Huyền Vũ Trấn Đồ — CỦNG CỐ LOGIC THẾ GIỚI QUAN!',
      advice:
        'Trước khi đẩy cốt truyện đi xa hơn, hãy chạy Chế độ 3 (Kiểm Toán Logic) hoặc Chế độ 5 (Vẽ Biểu Đồ Thời Gian) để đảm bảo giờ giấc và vị trí nhân vật khớp nhau 100%.',
      twistHint: 'Sự chênh lệch 15 phút trên đồng hồ chính là kẽ hở tố cáo kẻ nói dối.'
    },
    {
      code: 'ORACLE_10',
      verdict: '🎱 Quẻ Dư Âm Tuyệt Đỉnh — KẾT CHƯƠNG BẰNG MỘT CÂU THOẠI BỎ LỬNG!',
      advice:
        'Đừng giải thích hết ở cuối chương. Hãy dừng lại đúng khoảnh khắc cánh cửa vừa mở ra hoặc một cái tên không ngờ tới vừa được xướng lên!',
      twistHint: 'Người bước ra từ bóng tối chính là người mà tất cả đều tin rằng đã biến mất từ nhiều năm trước.'
    }
  ];

  const CHARACTER_NAME_ENCYCLOPEDIA = {
    VIETNAMESE_MODERN_NOIR: {
      title: '🇻🇳 Tên Nhân Vật Việt Nam Hiện Đại / Tâm Lý — Trinh Thám — Đô Thị',
      surnames: [
        'Lâm', 'Nguyễn', 'Trần', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lê', 'Phan', 'Trịnh', 'Đinh', 'Cao', 'Tạ', 'Lương'
      ],
      maleGiven: [
        'Phong', 'Khánh', 'Minh', 'Quân', 'Bách', 'Kiên', 'Hải', 'Tùng', 'Việt', 'Nam', 'Duy', 'Khôi', 'Sơn', 'Thành', 'Nhật', 'Long', 'Tuấn', 'Đức', 'Triết', 'Nguyên'
      ],
      femaleGiven: [
        'An', 'Linh', 'Châu', 'Hà', 'Vy', 'My', 'Khuê', 'Trâm', 'Thảo', 'Ngọc', 'Lan', 'Phương', 'Nhi', 'Yến', 'Giang', 'Thư', 'Đan', 'Tuyết', 'Băng', 'Nguyệt'
      ],
      middleMale: ['Đình', 'Gia', 'Nhật', 'Hoàng', 'Minh', 'Tuấn', 'Bảo', 'Khắc', 'Trọng', 'Quốc'],
      middleFemale: ['Bảo', 'Ngọc', 'Thanh', 'Phương', 'Thiên', 'Nhã', 'Tuyết', 'Minh', 'Hoài', 'Khánh'],
      meaningNotes: [
        'Gợi cảm giác gần gũi, đời thực nhưng giàu chiều sâu nội tâm, rất hợp với tiểu thuyết tâm lý xã hội, trinh thám Noir, học đường hoặc đô thị hiện đại.'
      ]
    },
    SINO_VIETNAMESE_FANTASY: {
      title: '🏮 Tên Nhân Vật Hán Việt Cổ Phong / Kiếm Hiệp / Huyền Huyễn / Tiên Hiệp',
      surnames: [
        'Mạc', 'Lãnh', 'Cố', 'Thẩm', 'Tô', 'Bạch', 'Sở', 'Diệp', 'Tiêu', 'Lục', 'hạ', 'Tần', 'Yến', 'Dung', 'Vân', 'Đường', 'Phượng', 'Hiên Viên', 'Độc Cô', 'Nam Cung', 'Tư Đồ', 'Âu Dương'
      ],
      maleGiven: [
        'Vô Trần', 'Thiên Hành', 'Hàn Phong', 'Trường Ca', 'Dạ Vũ', 'Tịch Mặc', 'Lăng Tiêu', 'Vân Thâm', 'Cửu U', 'Minh Viễn', 'Thanh Huyền', 'Tử Mặc', 'Kiếm Tâm', 'Thừa Ảnh', 'Kinh Hồng', 'Hoài An'
      ],
      femaleGiven: [
        'Nhược Tuyết', 'Thanh Dao', 'Vân Khê', 'Mộng Điệp', 'Lạc Y', 'Tử Yên', 'Băng Tâm', 'Nguyệt Hoa', 'Thính Vũ', 'Sơ Ảnh', ' Tinh Hà', 'Chỉ Nhược', 'Cẩm Thư', 'Tố Vấn', 'Họa Mi', 'Linh Lung'
      ],
      meaningNotes: [
        'Âm hưởng trang nhã, giàu hình tượng thiên nhiên (Tuyết, Nguyệt, Phong, Vân, Kiếm), phù hợp với cổ trang, cung đấu, kiếm hiệp và huyền huyễn phương Đông.'
      ]
    },
    JAPANESE_LIGHT_NOVEL: {
      title: '🌸 Tên Nhân Vật Nhật Bản Chuẩn Light Novel / Anime / Isekai',
      surnames: [
        'Kurokawa (Hắc Xuyên)', 'Shirakawa (Bạch Xuyên)', 'Kisaragi (Như Nguyệt)', 'Minamoto (Nguyên)', 'Tachibana (Quất)', 'Saionji (Tây Viên Tự)', 'Shinomiya (Tứ Cung)', 'Amamiya (Vũ Cung)', 'Hayakawa (Tảo Xuyên)', 'Kiryuu (Đồng Sinh)', 'kamiya (Thần Cốc)', 'Ayanokouji (Lăng Tiểu Lộ)'
      ],
      maleGiven: [
        'Ren (Liên — Lạnh lùng, quyết đoán)',
        'Haruto (Dương Đẩu — Ánh sáng ấm áp)',
        'Kaito (Hải Đẩu — Tự do & Bí ẩn)',
        'Sora (Không — Bầu trời vô tận)',
        'Akira (Minh — Trí tuệ sắc bén)',
        'Shin (Chân — Kiên định)',
        'Yuuto (Ưu Đẩu — Dịu dàng nhưng mạnh mẽ)',
        'Rei (Linh / Số Không — Bí ẩn trầm mặc)'
      ],
      femaleGiven: [
        'Yukino (Tuyết Nãi — Trong trẻo như tuyết đầu mùa)',
        'Shiori (Thi Chức — Dấu trang sách đầy kỷ niệm)',
        'Hina (Dương Thái — Ánh nắng dịu dàng)',
        'Akane (Thiến — Sắc đỏ hoàng hôn)',
        'Ririka (Lê Lý Hoa — Sắc sảo và kiêu hãnh)',
        'Mio (Mỹ Âm — Giai điệu tĩnh lặng)',
        'Sakura (Anh Đào — Mong manh nhưng kiên cường)',
        'Kohaku (Hổ Phách — Ký ức vĩnh cửu)'
      ],
      meaningNotes: [
        'Kèm nghĩa Hán tự để tác giả dễ dàng cài cắm ẩn dụ tính cách nhân vật theo đúng phong cách Light Novel Nhật Bản.'
      ]
    },
    WESTERN_GOTHIC_FANTASY: {
      title: '🏰 Tên Nhân Vật Âu Mỹ / Kỳ Ảo Phương Tây / Trinh Thám Cổ Điển',
      surnames: [
        'Blackwood', 'Vance', 'Sterling', 'Holloway', 'Valerius', 'Pendelton', 'Ravencroft', 'Sinclair', 'Mercer', 'Ashford', 'Lockhart', 'Winterbourne'
      ],
      maleGiven: [
        'Arthur', 'Lucian', 'Julian', 'Damian', 'Cassian', 'Victor', 'Alaric', 'Sebastian', 'Gideon', 'Dorian', 'Vincent', 'Adrian'
      ],
      femaleGiven: [
        'Eleanor', 'Seraphina', 'Clara', 'Vivienne', 'Isolde', 'Celeste', 'Evangeline', 'Rosalind', 'Evelyn', 'Lyra', 'Beatrice', 'Aurelia'
      ],
      meaningNotes: [
        'Phù hợp với tiểu thuyết kỳ ảo phương Tây (Fantasy), ma cà rồng Gothic, quý tộc châu Âu thế kỷ 19 hoặc trinh thám Sherlock Holmes.'
      ]
    }
  };

  const PLOT_TWIST_TEMPLATES = [
    {
      category: 'TRINH THÁM & TÂM LÝ TỘI PHẠM (NOIR MYSTERY)',
      title: '🔍 Cú Twist "Người Kể Chuyện Bị Khuyết Ký Ức"',
      summary:
        'Nhân vật giữ góc nhìn (POV) đang đi tìm thủ phạm của một vụ việc, nhưng từng manh mối họ thu thập được lại trùng khớp với chính thói quen vô thức của bản thân họ.',
      executionSteps: [
        'Bước 1: Cài cắm 1 thói quen nhỏ của nhân vật chính ở đầu chương (ví dụ: luôn đặt cốc cà phê bên tay trái hoặc gõ ngón trỏ 3 nhịp).',
        'Bước 2: Để nhân vật phát hiện hiện trường có dấu vết tương tự nhưng lầm tưởng là của kẻ thù.',
        'Bước 3: Cuối chương, một nhân vật phụ hỏi một câu vô tình làm sụp đổ bằng chứng ngoại phạm về thời gian của nhân vật chính.'
      ]
    },
    {
      category: 'KỲ ẢO & HÀNH ĐỘNG (FANTASY / LIGHT NOVEL)',
      title: '⚔️ Cú Twist "Cái Giá Của Sức Mạnh Cấm Kỵ"',
      summary:
        'Chiêu thức hoặc cổ vật giúp nhân vật chính chiến thắng dễ dàng thực chất không tiêu hao thể lực, mà âm thầm xóa đi từng ký ức quý giá nhất về người họ muốn bảo vệ.',
      executionSteps: [
        'Bước 1: Cho nhân vật giành chiến thắng áp đảo nhờ kích hoạt cổ vật.',
        'Bước 2: Ngay sau trận chiến, khi đồng đội nhắc đến tên người thân của nhân vật chính, nhân vật chính bỗng khựng lại vì không thể nhớ nổi khuôn mặt người đó.',
        'Bước 3: Đặt nhân vật vào thế tiến thoái lưỡng nan ở trận chiến tiếp theo: Dùng sức mạnh để cứu người đó nhưng sẽ quên sạch họ mãi mãi.'
      ]
    },
    {
      category: 'TÌNH CẢM & ĐỜI THƯỜNG (ROMANCE / SLICE OF LIFE)',
      title: '💌 Cú Twist "Bức Thư Chưa Từng Được Gửi Đi"',
      summary:
        'Sự hiểu lầm kéo dài nhiều năm giữa hai nhân vật không phải vì sự vô tâm, mà vì cả hai đều đã âm thầm hy sinh cho đối phương ở cùng một thời điểm trong quá khứ.',
      executionSteps: [
        'Bước 1: Mở đầu bằng cuộc gặp gỡ lạnh nhạt hoặc đầy khoảng cách ở hiện tại.',
        'Bước 2: Một kỷ vật cũ (cuốn sổ mượn thư viện, chiếc máy nghe nhạc hỏng) vô tình rơi ra tờ biên lai hoặc dòng chữ viết tay từ nhiều năm trước.',
        'Bước 3: Khép lại chương bằng cuộc đối thoại dưới mưa, nơi cả hai nhận ra đối phương cũng đã đứng đợi mình ở đúng nơi đó.'
      ]
    },
    {
      category: 'ĐẤU TRÍ & CHÍNH TRỊ (MƯU LƯỢC / CUNG ĐẤU)',
      title: '♟️ Cú Twist "Chiếc Bẫy Ba Tầng (Thất Bại Nằm Trong Kế Hoạch)"',
      summary:
        'Nhân vật chính cố tình để lộ một sơ hở nhỏ và chấp nhận thua ở hiệp đầu tiên nhằm buộc kẻ chủ mưu thực sự phải bước ra nhận chiến thắng.',
      executionSteps: [
        'Bước 1: Viết cảnh kế hoạch của nhân vật chính tưởng như bị đối phương bắt bài hoàn toàn.',
        'Bước 2: Giữ kín một phần thông tin trong Ma trận "Ai Biết Gì" (Tab 4).',
        'Bước 3: Khi đối phương vừa tung ra bằng chứng quyết định, nhân vật chính mỉm cười vì bằng chứng đó chỉ có duy nhất kẻ nội gián thật sự mới tiếp cận được.'
      ]
    }
  ];

  const STUDIO_USAGE_KNOWLEDGE_BASE = [
    {
      keywords: [
        'trang web này có gì', 'web này có gì', 'web có gì', 'app này có gì', 'ứng dụng này có gì',
        'trang web có những gì', 'có những tính năng gì', 'có chức năng gì', 'làm được gì',
        'giới thiệu trang web', 'giới thiệu web', 'tổng quan trang web', 'tổng quan', 'web này dùng để làm gì'
      ],
      title: '🌟 Tổng Quan Web Viết Tiểu Thuyết Của Bi (6 Màn Hình · 47 Module Miễn Phí 100%)',
      answer: [
        'Chào bạn! **Web Viết Tiểu Thuyết Của Bi** là studio sáng tác tiểu thuyết dài hơi & tiện ích đa năng chạy mượt trên cả **PC, Mobile và App PWA**, gồm **6 Tab chuyên biệt (47 Module)**:',
        '• **Tab 1 — ✍️ Bàn Viết Truyện:** Soạn thảo chuẩn trang sách, chế độ Tập trung, Chia cột Split View, Quy trình 4 bước, duyệt đoạn AI tô màu kiểu Google Docs, chuẩn hóa hội thoại Việt, Từ điển Ngũ quan, quét sáo ngữ AI & Tự lưu 3 tầng mỗi 2 giây.',
        '• **Tab 2 — 📂 Chương & File Nguồn:** Cây bản thảo phân cấp Quyển → Chương → Cảnh kéo thả, lọc Nháp / Đã duyệt, nạp hàng loạt `.DOCX / .PDF / .TXT` và tra cứu ký ức trăm chương trước miễn phí 0 Token.',
        '• **Tab 3 — 🤖 Trung Tâm Điều Khiển AI (6 Chế Độ):** Chế độ 1 (Viết truyện nối Story Bible), Chế độ 2 (Tham mưu cốt truyện), Chế độ 3 (Soi Logic), Chế độ 4 (Độc giả chấm điểm), Chế độ 5 (Vẽ sơ đồ cốt truyện ASCII/SVG), Chế độ 6 (Tạo ảnh bìa truyện). Hỗ trợ chia đôi màn hình Gemini & NotebookLM + khung soạn thảo **Word Pro** (chèn/xóa bảng, cắt/crop ảnh, menu chuột phải).',
        '• **Tab 4 — 🏛️ Story Bible & Nhân Vật:** Bộ nhớ chống quên cốt truyện dạng Word (hỗ trợ bảng, ảnh, tải PDF), Hồ sơ Nhân vật, Ma trận Ai Biết Gì, Sổ cái Phục bút & quy trình đồng bộ NotebookLM.',
        '• **Tab 5 — 🎵 Nhạc, Pomodoro & Không Gian:** Rạp **YouTube sạch quảng cáo** (Tua ±10s, 0.25x–4x, Lặp A–B, **Cửa sổ nổi Desktop/Mobile**, chạy nền & phủ làm **Nền Video 16:9**), máy nghe **MP3 lặp A–B**, 7 âm thanh tự nhiên, **Pomodoro đồng bộ 2 chiều**, 8 tranh nền nghệ thuật & **Bầu trời Thời tiết 3D 60FPS** + Đồng hồ quốc tế / Báo thức MP3.',
        '• **Tab 6 — ⚙️ Cài Đặt, Xuất Sách & Tiện Ích:** Nút **"📕 Xuất truyện qua PDF và dùng ĐăngLovePDF"** (Xuất sách `.PDF/.DOCX/.EPUB` + bộ **19 công cụ ĐăngLovePDF** gộp/tách/nén/ký tên/OCR/đổi Word-Excel-PPTX 100% trên máy), **Quản lý Hiệu năng & Tự ngủ RAM (Mod 47)**, Đồng bộ Google Drive / `.ZIP`, Video hướng dẫn 6 ngôn ngữ (giọng Google TTS), Kho Phiên Bản Time-Machine & **Máy tính Casio fx-570VN+ / Đồ thị Desmos**!',
        '👉 Bạn chỉ cần gõ **"Mở + tên chức năng"** (vd: *Mở ĐăngLovePDF*, *Mở YouTube*, *Mở Quản lý RAM*, *Mở Tab 3*) là mình đưa bạn tới ngay!'
      ].join('\n')
    },
    {
      keywords: [
        'đănglovepdf', 'danglovepdf', 'ilovepdf', 'ihatepdf', 'gộp pdf', 'tách pdf', 'nén pdf',
        'ký tên pdf', 'đóng dấu pdf', 'xoay trang pdf', 'ocr', 'pdf sang word', 'word sang pdf',
        'chuyển đổi định dạng', 'đổi định dạng', 'excel sang pdf', 'ảnh sang pdf', 'pdf sang ảnh'
      ],
      title: '❤️ Bộ Công Cụ ĐăngLovePDF (Mod 46 — 19 Công Cụ Xử Lý File 100% Trên Máy)',
      answer: [
        'Bạn vào **Tab 6** và bấm nút nhấp nháy nổi bật **"📕 Xuất truyện qua PDF và dùng ĐăngLovePDF"** ở thanh trên cùng -> chọn **"❤️ ĐăngLovePDF"**:',
        '• **100% riêng tư trên máy:** Mọi thao tác xử lý trực tiếp trên trình duyệt, file không bao giờ bị tải lên máy chủ ngoài.',
        '• **Gồm 5 cụm công cụ gọn gàng (có nút Thu gọn từng cụm & Rút gọn tất cả):** Gộp/Tách/Sắp xếp/Cắt viền PDF • Nén/Đánh số/Đóng dấu/Ký tên/Làm phẳng • Ảnh & Slide PPTX ↔ PDF • Word/TXT/MD/Excel/CSV/JSON ↔ PDF • Đọc chữ OCR (Tiếng Việt/Anh) & Làm sạch bảo mật PDF.',
        '• Đóng cửa sổ là tự động giải phóng RAM & xóa sạch bộ đệm file tạm!'
      ].join('\n')
    },
    {
      keywords: [
        'hiệu năng', 'tràn ram', 'dọn ram', 'ram', 'giật', 'lag', 'chậm', 'tự ngủ', 'auto-sleep',
        'chạy nền', 'chạy ngầm', 'tắt mod', 'bật mod', 'tắt chức năng', 'tiết kiệm pin', 'mod 47'
      ],
      title: '⚡ Quản Lý Hiệu Năng, Dọn RAM & Tự Ngủ Thông Minh (Mod 47)',
      answer: [
        'Để tối ưu độ mượt và không bao giờ tràn RAM, bạn vào **Tab 6** và mở thẻ **"⚡ Quản Lý Hiệu Năng, Tự Ngủ (Auto-Sleep) & Tắt/Bật Chức Năng (Mod 47)"**:',
        '• **1 chạm đổi chế độ:** Chọn **"🪶 Tiết Kiệm RAM Tối Đa"** nếu dùng máy cấu hình yếu, hoặc **"⚡ Cân Bằng Thông Minh"** để hệ thống tự ngủ hiệu ứng 60FPS & tự dọn RAM khi bạn đóng ĐăngLovePDF / Máy tính / Video hoặc chuyển Tab.',
        '• **Công tắc Tắt/Bật riêng từng chức năng phụ:** Hạt 60FPS, Bầu trời thời tiết 3D, Nền Video YouTube 16:9, Linh vật Bi Số 8, Bộ đếm traffic, Âm gõ phím ASMR.',
        '• **Luôn bảo vệ dịch vụ chạy ngầm thiết yếu:** Nhạc MP3, YouTube phát nền/PiP, Pomodoro, Báo thức & Tự lưu 3 tầng vẫn chạy liên tục không bị gián đoạn!'
      ].join('\n')
    },
    {
      keywords: [
        'youtube', 'cửa sổ nổi', 'pip', 'lặp a-b', 'a-b', 'nền video', 'crop nền', 'tua video', 'không quảng cáo'
      ],
      title: '📺 Rạp YouTube Sạch Quảng Cáo, Cửa Sổ Nổi & Lặp A–B (Mod 39 & 40)',
      answer: [
        'Mở **Tab 5 (🎵 Nhạc, Pomodoro & Chữ)** -> mở khung **"📺 Trình Phát YouTube Không Quảng Cáo & Nền Video 16:9"**:',
        '• Tìm kiếm video ngay trong web hoặc dán link YouTube để phát hoàn toàn **không quảng cáo** (`youtube-nocookie.com`).',
        '• Hỗ trợ đủ **Tua ±10s, Dừng/Phát, Tốc độ 0.25x–4x, Lặp toàn video, Lặp đoạn A–B** (đồng bộ 100% kể cả khi bật **🖼️ Cửa sổ nổi** trên Desktop!).',
        '• Bấm **"🎬 Cài Video Này Làm Nền"** để biến video thành nền web 16:9 xuyên suốt 6 Tab, kèm công cụ **✂️ Căn chỉnh/Crop**.'
      ].join('\n')
    },
    {
      keywords: [
        'chèn bảng', 'xóa bảng', 'cắt ảnh', 'crop ảnh', 'chế độ word', 'căn lề', 'menu chuột phải', 'word pro'
      ],
      title: '📝 Trình Soạn Thảo Chuẩn Word Pro (Bảng, Cắt Ảnh & Định Dạng Nhanh)',
      answer: [
        'Ở các khung soạn giàu định dạng kiểu Word (Tab 3 Ô lệnh AI, Tab 3 Đầu ra AI, Tab 4 Story Bible):',
        '• Thanh công cụ có sẵn nút **☑️ Chọn hết, Đậm/Nghiêng/Gạch chân/Gạch ngang, Căn lề Trái/Giữa/Phải/Đều, Danh sách, Hoàn tác/Làm lại, ⊞ + Bảng, 🖼️ + Ảnh**.',
        '• **Thao tác trên Bảng:** Bấm chuột phải vào bảng để thêm/xóa hàng cột, canh đều cột, căn ô hoặc **🗑️ Xóa toàn bộ bảng** (hoặc nhấn `Ctrl + Backspace/Delete`).',
        '• **Thao tác trên Ảnh:** Bấm chọn hoặc chuột phải vào ảnh để **✂️ Cắt ảnh (Crop)**, xoay 90°, chỉnh cỡ `35% / 65% / 100%`, căn lề hoặc nhấn `Backspace/Delete` để xóa.'
      ].join('\n')
    },
    {
      keywords: [
        'casio', 'fx-570', 'máy tính', 'đồ thị', 'desmos', 'mod 45', 'tính toán'
      ],
      title: '🧮 Máy Tính Casio fx-570VN PLUS & Đồ Thị Desmos 100% Nội Bộ (Mod 45)',
      answer: [
        'Vào **Tab 6** -> mở mục **"🎲 Chức Năng Linh Tinh"** -> chọn **"🧮 Máy tính đồ thị (Casio fx-570VN+ & Desmos)"**:',
        '• Đầy đủ chế độ tính toán khoa học (`COMP, CMPLX, STAT, EQN, MATRIX, VECTOR, SOLVE, ∫dx, d/dx`).',
        '• Bấm **"📈 Tạo hàm đồ thị"** để vẽ đồ thị tương tác 60FPS kiểu Desmos hoàn toàn offline trên máy!'
      ].join('\n')
    },
    {
      keywords: [
        'thời tiết', 'báo thức', 'múi giờ', 'đồng hồ', 'bầu trời', 'mod 42', 'mod 43'
      ],
      title: '🌤️ Đồng Hồ Quốc Tế, Báo Thức MP3 & Thời Tiết 3D 60FPS (Mod 42 & 43)',
      answer: [
        'Bấm ngay dòng chữ gạch chân đồng hồ phía trên thanh tiêu đề (hoặc ngay tại Cổng Kết Nối) để mở bảng **Giờ Quốc Tế, Báo Thức & Thời Tiết**:',
        '• Chuyển múi giờ toàn cầu, đặt báo thức bằng chuông hệ thống hoặc chính bản nhạc `.MP3` từ Tab 5.',
        '• Xem dự báo thời tiết 24 giờ từng tiếng theo GPS cấp Phường/Xã và bật hiệu ứng **Bầu trời Thời tiết 3D 60FPS** chạy nền!'
      ].join('\n')
    },
    {
      keywords: [
        'google drive', 'đồng bộ', 'chuyển máy', 'oauth', 'client id', 'gói zip', 'mod 37'
      ],
      title: '🔄 Đồng Bộ Dữ Liệu Sang Máy Khác (.ZIP & Google Drive OAuth A–Z)',
      answer: [
        'Vào **Tab 6** và bấm nút **"🔄 Đồng bộ dữ liệu sang máy khác"** ở thanh trên cùng:',
        '• Có sẵn 2 cách: (1) Xuất/Nạp gói `.ZIP / .JSON` 1 chạm siêu nhanh, hoặc (2) Liên kết trực tiếp **Google Drive** cá nhân (kèm hướng dẫn trực quan mô phỏng từng cú click lấy Google OAuth Client ID từ A → Z ngay bên trong cửa sổ!).'
      ].join('\n')
    },
    {
      keywords: ['prompt tổng', 'chạy ai', 'viết truyện', 'chế độ 1', 'chế độ 6', 'tạo bìa', 'câu lệnh', 'tab 3', 'model', 'mô hình'],
      title: '🚀 Cách chạy 6 Chế Độ AI & Prompt Tổng Hợp tại Tab 3',
      answer: [
        'Tại **Tab 3 (🤖 Trung Tâm Điều Khiển AI & 6 Chế Độ)**:',
        '1. Chọn Chế độ mong muốn (Chế độ 1: Viết truyện • Chế độ 2: Tham mưu cốt truyện • Chế độ 3: Kiểm toán Logic • Chế độ 4: Độc giả chấm điểm • Chế độ 5: Vẽ sơ đồ ASCII/SVG • Chế độ 6: Tạo ảnh bìa truyện).',
        '2. Nhập yêu cầu vào khung chuẩn Word (bấm **⛶ Phóng to ô nhập** nếu muốn viết rộng rãi) rồi bấm **"🚀 Chạy Prompt Tổng Hợp"**.',
        '3. Hệ thống tự động gắn Story Bible, hỗ trợ chạy trực tiếp qua API hoặc tự copy prompt + chia đôi màn hình mở **Gemini / NotebookLM** cực tiện!'
      ].join('\n')
    },
    {
      keywords: ['duyệt đoạn ai', 'google docs', 'tô màu', 'chèn nối tiếp', 'thay thế', 'chấp nhận', 'từ chối'],
      title: '✨ Cách duyệt đoạn văn AI viết kiểu Google Docs tại Tab 1',
      answer: [
        'Sau khi AI viết xong ở Tab 3, bạn bấm nút **"📥 Chèn nối tiếp"** hoặc **"🔄 Thay thế"** ngay trên thanh tiêu đề cửa sổ đầu ra:',
        '• Hệ thống sẽ tự động lưu 1 phiên bản dự phòng tại Tab 6, chuyển bạn về **Tab 1 (Bàn Viết)** và bật **Chế Độ Duyệt Đoạn AI Viết (Kiểu Google Docs)**.',
        '• Các đoạn do AI mới viết sẽ được **tô màu xanh ngọc** nổi bật so với chữ của bạn.',
        '• Bạn có thể bấm **[✓ Nhận]** hoặc **[✕ Bỏ]** ở từng đoạn, hoặc bấm **"✓ Chấp nhận tất cả"** / **"✕ Từ chối tất cả"** trên thanh công cụ màu xanh!'
      ].join('\n')
    },
    {
      keywords: ['biểu đồ', 'chế độ 5', 'mode 5', 'thời gian', 'mâu thuẫn', 'sơ đồ'],
      title: '🎨 Cách dùng Chế độ 5: Vẽ Biểu Đồ Cốt Truyện & Soi Dòng Thời Gian',
      answer: [
        'Tại **Tab 3**, bạn chọn **"🎨 Chế độ 5: Vẽ Biểu Đồ Cốt Truyện & Diễn Biến Theo Thời Gian"** ở trình đơn Cửa sổ đầu ra:',
        '1. Tích chọn các chương bạn muốn đối chiếu ở danh sách bên trái.',
        '2. Chọn mô hình AI và hình thức sơ đồ (Trục thời gian, Mạng lưới nhân vật, Minh họa phân cảnh).',
        '3. Nhập yêu cầu vào ô có chữ xám gợi ý rồi bấm **"🚀 Phân Tích & Vẽ Biểu Đồ Cốt Truyện Ngay"** để hệ thống vẽ sơ đồ SVG trực quan và lập bảng theo dõi sự kiện chống mâu thuẫn giờ giấc!'
      ].join('\n')
    },
    {
      keywords: ['phiên bản', 'khôi phục', 'preview', 'xem trước', 'lịch sử', 'tab 6', 'mất bài', 'xóa nhầm'],
      title: '🕒 Cách Xem Trước (Preview) & Khôi Phục Phiên Bản Cũ tại Tab 6',
      answer: [
        'Bạn hoàn toàn yên tâm không bao giờ sợ mất bản thảo! Hãy mở **Tab 6 (⚙️ Phiên Bản, Xuất File & Cài Đặt)** hoặc bấm nút **"🕒 Phiên bản"** trên thanh trên cùng:',
        '• Bấm vào bất kỳ phiên bản nào trong danh sách để **Xem trước (Preview)** lại toàn bộ bản thảo, danh sách chương và Story Bible ở thời điểm đó.',
        '• Bấm **"🔍 Phóng To Giao Diện Preview Cũ"** để xem toàn màn hình hoặc bấm **"⏪ Khôi Phục Phiên Bản Này"** để đưa toàn bộ trang web quay về đúng trạng thái đó!'
      ].join('\n')
    },
    {
      keywords: ['pdf', 'xuất file', 'word', 'docx', 'font', 'cỡ chữ', 'in sách'],
      title: '📤 Cách chọn Font chữ & Cỡ chữ trước khi xuất Sách PDF / Word',
      answer: [
        'Bấm nút **"📤 Xuất Sách PDF / Word / TXT"** ở góc phải thanh công cụ Tab 1 (hoặc trong Tab 6):',
        '• Chọn phạm vi chương (Chương đang mở / Tất cả chương Đã duyệt / Toàn bộ chương).',
        '• Chọn **Font chữ sách PDF** (Merriweather, Times New Roman, Lora, Noto Serif, Inter...), **Cỡ chữ (11pt -> 18pt)** và **Giãn dòng (1.5 -> 2.0)**.',
        '• Xem thử ngay trong khung **Xem thử mẫu chữ xuất PDF** rồi bấm **"📕 Xuất / In .PDF Ngay"**!'
      ].join('\n')
    },
    {
      keywords: ['pomodoro', 'đồng hồ', 'nhạc', 'mp3', 'lặp', 'tab 5', 'nền động'],
      title: '🎵 Đồng Hồ Pomodoro Đồng Bộ 2 Chiều & Phòng Thu Âm Thanh Tab 5',
      answer: [
        'Tại **Tab 5 (🎵 Nhạc, Pomodoro & Chữ)**:',
        '• **Đồng hồ Pomodoro** trong Tab 5 và **Thanh Pomodoro nổi (🍅)** ở góc dưới màn hình được đồng bộ 2 chiều 100% — bạn bấm Bắt đầu/Tạm dừng/Đặt lại ở đâu thì cả hai nơi đều cập nhật tức thì!',
        '• Bạn cũng có thể tải nhạc `.MP3` từ máy, cắt lặp đoạn `A ➔ B`, bật 5 âm thanh không gian tự sinh (Mưa đêm, Piano, Lửa trại, Sóng biển) và đổi hiệu ứng nền 60FPS.'
      ].join('\n')
    },
    {
      keywords: ['api key', 'gemini key', 'khóa api', 'kết nối ai'],
      title: '🔑 Cách nhập và kiểm tra Gemini API Key tại Tab 6',
      answer: [
        'Mở **Cổng Kết Nối** hoặc **Tab 6** -> Bấm vào thẻ **"🔑 2. Quản Lý Gemini API Key"** -> Dán mã khóa Gemini API (`AIzaSy...` hoặc `AQ....`) của bạn vào và bấm **"💾 Lưu & Xác Thực Flash-Lite"**.',
        'Khóa được lưu cục bộ an toàn 100% trên trình duyệt của bạn và tự động kích hoạt cả 5 chế độ AI cùng phòng Chat tự do này!'
      ].join('\n')
    }
  ];

  const EMOTIONAL_DIALOGUE_ARCHETYPES = [
    {
      mood: 'KIỀM NÉN ĐAU THƯƠNG / CƯỜI TRONG NƯỚC MẮT',
      context: 'Khi nhân vật cố tỏ ra bình thản để người đối diện không lo lắng',
      lines: [
        '- Cà phê hôm nay hơi đắng nhỉ, hay tại trời mưa nên vị giác của tôi cũng ẩm ướt theo rồi? (Nhân vật chính)',
        '- Đừng nhìn tôi bằng ánh mắt đó. Tôi đã hứa sẽ ổn mà, ít nhất là cho đến khi bóng lưng cậu khuất khỏi con phố này. (Nhân vật nữ)',
        '- Vết xước nhỏ ấy mà, gió thổi một lát là khô thôi. Chúng ta đi tiếp đi, kẻo trễ giờ tàu. (Người đồng hành)'
      ]
    },
    {
      mood: 'ĐỐI ĐẦU CĂNG THẲNG / ĐẤU TRÍ NGẦM (SUBTEXT)',
      context: 'Khi hai đối thủ nói chuyện lịch sự nhưng từng câu đều mang hàm ý đe dọa hoặc dò xét',
      lines: [
        '- Ngài nhớ rõ giờ tàu chạy đêm qua quá nhỉ, cứ như thể chính ngài cũng đã đứng ở sân ga lúc mười một giờ mười lăm phút vậy. (Thám tử)',
        '- Một người cẩn trọng như anh hẳn phải biết: có những cánh cửa mở ra thì dễ, nhưng lúc đóng lại sẽ kẹt mất vài ngón tay đấy. (Kẻ tình nghi)',
        '- Trà nguội mất rồi. Tôi pha ấm mới, hay chúng ta vào thẳng lý do thực sự khiến anh mang theo khẩu súng dưới vạt áo? (Chủ quán)'
      ]
    },
    {
      mood: 'BỪNG TỈNH & QUYẾT TÂM PHẢN KÍCH',
      context: 'Khoảnh khắc nhân vật rũ bỏ sự do dự để bước vào cao trào',
      lines: [
        '- Nếu định mệnh đã viết sẵn kết cục ở trang cuối, vậy thì đưa bút đây, tôi sẽ tự tay gạch bỏ dòng chữ đó. (Nhân vật chính)',
        '- Tôi không quay lại đây để xin một cơ hội. Tôi quay lại để đòi lại tất cả những gì thuộc về buổi tối hôm ấy. (Người trở về)',
        '- Đừng hỏi tôi có sợ không. Hãy hỏi xem kẻ đang đợi phía trước có kịp chạy trước khi tôi rút kiếm ra không. (Kiếm khách)'
      ]
    }
  ];

  // ==========================================================================
  // PHẦN 2: LỚP CHÍNH MascotBiSo8AndFreeChatEngine
  // ==========================================================================
  class MascotBiSo8AndFreeChatEngine {
    constructor() {
      this.storageKeyHistory = 'noir_v38_mascot_bi_chat_history';
      this.storageKeyPrefs = 'noir_v38_mascot_bi_prefs';
      this.messages = [];
      this.prefs = {
        autoSpeakTTS: false,
        attachChapterContext: true,
        attachStoryBibleContext: true,
        chatBehaviorMode: 'WEB_SUPPORT_STRICT',
        chatModelId: 'gemini-3.5-flash-lite',
        speechRate: 0.98,
        speechPitch: 1.0
      };
      this.isToolbarInjected = false;
      this.isSending = false;
      this.oracleCounter = 0;
      this.isFloatingAiCollapsed = true;
      this._busSubscribed = false;
    }

    getUtils() {
      if (window.NoirStudio && window.NoirStudio.utils) return window.NoirStudio.utils;
      if (window.NoirStudio && window.NoirStudio.ui) return window.NoirStudio.ui;
      return {
        escapeHtml: (s) =>
          String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;'),
        countVietnameseWords: (t) =>
          t && typeof t === 'string' && t.trim()
            ? t.trim().split(/\s+/).filter(Boolean).length
            : 0,
        formatTimestampVN: (ts) =>
          window.NoirNovel?.i18n?.formatTime
            ? window.NoirNovel.i18n.formatTime(ts || Date.now(), { includeSeconds: true })
            : new Date(ts || Date.now()).toLocaleTimeString('vi-VN'),
        showToast: (m) => console.log('[MascotToast]', m)
      };
    }

    getChapterManager() {
      return (
        window.NoirStudio?.chapterManager ||
        window.NoirStudio?.chapterTree ||
        null
      );
    }

    getStoryBible() {
      return (
        window.NoirStudio?.storyBible ||
        window.NoirStudio?.bibleEngine ||
        null
      );
    }

    getGeminiRouter() {
      return (
        window.NoirStudio?.geminiRouter ||
        window.NoirStudio?.apiVault ||
        null
      );
    }

    // ------------------------------------------------------------------------
    // Khởi tạo Linh Vật Viên Bi Số 8 & Phòng Chat Gemini Tự Do
    // ------------------------------------------------------------------------
    init() {
      this.loadSavedState();
      this.ensureMascot3dStyles();
      this.injectQuickActionToolbarIntoChatModal();
      this.decorateCornerMascotButton();
      this.renderMascotBi3dArtwork();
      this.bindFloatingAiCornerControls();
      this.syncFloatingAiCornerUI();
      this.bindInternalChatEvents();
      this.subscribeToRouterEvents();
      this.updateConnectionPillStatus();

      if (this.messages.length === 0) {
        this.seedWelcomeMessage();
      }
      this.renderMessagesList();

      if (window.NoirStudio?.bus && !this._i18nBusSubscribed) {
        this._i18nBusSubscribed = true;
        const syncLang = () => {
          try {
            const bubble = document.getElementById('mod27-mascot-quick-bubble') || document.querySelector('#floating-mascot-bubble, [data-mod27-bubble]');
            if (bubble && window.NoirNovel?.i18n?.translateElement) {
              window.NoirNovel.i18n.translateElement(bubble);
            }
            const tb = document.getElementById('free-chat-quick-actions-bar');
            if (tb && window.NoirNovel?.i18n?.translateElement) {
              window.NoirNovel.i18n.translateElement(tb);
            }
            this.syncChatVoiceControlsUI?.();
            this.syncChatBehaviorModeUI?.();
            this.updateConnectionPillStatus?.();
            this.renderMessagesList();
            const cornerBar = document.getElementById('floating-ai-controls');
            if (cornerBar && window.NoirNovel?.i18n?.translateElement) {
              window.NoirNovel.i18n.translateElement(cornerBar);
            }
          } catch {}
        };
        window.NoirStudio.bus.on('i18n:changed', syncLang);
        window.addEventListener?.('noir:i18n:changed', syncLang);
      }
    }

    ensureMascot3dStyles() {
      if (typeof document === 'undefined' || document.getElementById('mod27-mascot-bi-3d-styles')) return;
      const styleEl = document.createElement('style');
      styleEl.id = 'mod27-mascot-bi-3d-styles';
      styleEl.textContent = `
        @keyframes bi8FloatBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2.5px) rotate(-1deg); }
        }
        @keyframes bi8WaveArm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-12deg); }
        }
        .bi8-mascot-float {
          animation: bi8FloatBob 3.2s ease-in-out infinite;
          transform-origin: center center;
        }
        .bi8-arm-wave {
          animation: bi8WaveArm 1.8s ease-in-out infinite;
          transform-origin: 20px 52px;
        }
      `;
      document.head.appendChild(styleEl);
    }

    /**
     * Dựng ảnh SVG vector 3D Linh Vật Viên Bi Số 8 cute mắt sao má hồng (bám sát mẫu nhân vật gốc).
     */
    buildMascotBi3dSvgMarkup(uid = 'corner', sizePx = 58, waveArm = true) {
      const w = Number(sizePx) || 58;
      const h = Math.round(w * 1.06);
      const idPrefix = `bi3d_${String(uid || 'corner').replace(/[^a-z0-9_-]/gi, '')}`;
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 106" width="${w}" height="${h}" aria-hidden="true" class="overflow-visible ${waveArm ? 'bi8-mascot-float' : ''}">
          <defs>
            <radialGradient id="${idPrefix}_body" cx="34%" cy="28%" r="72%">
              <stop offset="0%" stop-color="#52525b" />
              <stop offset="28%" stop-color="#27272a" />
              <stop offset="68%" stop-color="#09090b" />
              <stop offset="94%" stop-color="#040406" />
              <stop offset="100%" stop-color="#18181b" />
            </radialGradient>
            <radialGradient id="${idPrefix}_bounce" cx="76%" cy="82%" r="48%">
              <stop offset="0%" stop-color="#34d399" stop-opacity="0.24" />
              <stop offset="65%" stop-color="#10b981" stop-opacity="0.06" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="${idPrefix}_sheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.72" />
              <stop offset="45%" stop-color="#ffffff" stop-opacity="0.18" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </linearGradient>
            <radialGradient id="${idPrefix}_cheek" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fb7185" stop-opacity="0.88" />
              <stop offset="65%" stop-color="#f472b6" stop-opacity="0.48" />
              <stop offset="100%" stop-color="#f472b6" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="${idPrefix}_limb" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3f3f46" />
              <stop offset="50%" stop-color="#18181b" />
              <stop offset="100%" stop-color="#050507" />
            </linearGradient>
          </defs>

          <!-- Bóng đổ mềm dưới chân -->
          <ellipse cx="50" cy="98" rx="23" ry="4.5" fill="rgba(0,0,0,0.45)" />

          <!-- Giày bốt đen bóng hai bên -->
          <path d="M 39 81 L 39 89 Q 39 94 34 94 L 31 94 Q 26.5 94 27 89.5 Q 27.5 85.5 34.5 85.5 L 35 81 Z" fill="url(#${idPrefix}_limb)" stroke="#09090b" stroke-width="0.7" />
          <ellipse cx="31.5" cy="89" rx="2.5" ry="1.1" fill="rgba(255,255,255,0.42)" transform="rotate(-12 31.5 89)" />
          <path d="M 61 81 L 61 89 Q 61 94 66 94 L 69 94 Q 73.5 94 73 89.5 Q 72.5 85.5 65.5 85.5 L 65 81 Z" fill="url(#${idPrefix}_limb)" stroke="#09090b" stroke-width="0.7" />
          <ellipse cx="68.5" cy="89" rx="2.5" ry="1.1" fill="rgba(255,255,255,0.42)" transform="rotate(12 68.5 89)" />

          <!-- Tay trái vẫy chào cute -->
          <g class="${waveArm ? 'bi8-arm-wave' : ''}">
            <path d="M 20 54 Q 9 47 10.5 35" fill="none" stroke="url(#${idPrefix}_limb)" stroke-width="6.4" stroke-linecap="round" />
            <ellipse cx="10.5" cy="34" rx="4.6" ry="4.1" fill="#18181b" stroke="#3f3f46" stroke-width="0.7" />
            <circle cx="7.5" cy="30.8" r="1.45" fill="#18181b" />
            <circle cx="10.2" cy="29.4" r="1.45" fill="#18181b" />
            <circle cx="13.0" cy="30.4" r="1.45" fill="#18181b" />
            <ellipse cx="9.6" cy="33.2" rx="1.5" ry="0.9" fill="rgba(255,255,255,0.28)" />
          </g>

          <!-- Tay phải thả lỏng -->
          <path d="M 80 54 Q 91 61 88 73" fill="none" stroke="url(#${idPrefix}_limb)" stroke-width="6.2" stroke-linecap="round" />
          <ellipse cx="87.6" cy="74" rx="4.2" ry="4.4" fill="#18181b" stroke="#3f3f46" stroke-width="0.7" />
          <ellipse cx="86.5" cy="72.4" rx="1.4" ry="0.9" fill="rgba(255,255,255,0.26)" />

          <!-- Thân cầu tròn 3D đen bóng -->
          <circle cx="50" cy="50" r="36" fill="url(#${idPrefix}_body)" stroke="rgba(255,255,255,0.14)" stroke-width="0.8" />
          <circle cx="50" cy="50" r="36" fill="url(#${idPrefix}_bounce)" />

          <!-- Ánh bóng phản chiếu pha lê phía trên trái -->
          <ellipse cx="32" cy="28" rx="13" ry="6.5" fill="url(#${idPrefix}_sheen)" transform="rotate(-34 32 28)" />
          <ellipse cx="29" cy="24.5" rx="4.4" ry="2.2" fill="rgba(255,255,255,0.88)" transform="rotate(-28 29 24.5)" />

          <!-- Vòng tròn trắng số 8 nghiêng trên đỉnh phải -->
          <g transform="translate(65.5, 29.5) rotate(-14)">
            <circle cx="0" cy="0" r="12.2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.7" />
            <circle cx="0" cy="-2.8" r="2.75" fill="none" stroke="#09090b" stroke-width="2.2" />
            <circle cx="0" cy="3.1" r="3.35" fill="none" stroke="#09090b" stroke-width="2.2" />
          </g>

          <!-- Đôi mắt long lanh sao trời -->
          <g>
            <!-- Mắt trái -->
            <ellipse cx="37.5" cy="53.5" rx="7.2" ry="8.4" fill="#09090b" stroke="#334155" stroke-width="0.8" />
            <ellipse cx="37.5" cy="53.8" rx="5.9" ry="7.1" fill="#0f172a" />
            <path d="M 33.5 58.2 Q 37.5 60.5 41.5 58.2" fill="none" stroke="#34d399" stroke-width="1.2" stroke-opacity="0.55" stroke-linecap="round" />
            <circle cx="35.1" cy="50.4" r="2.6" fill="#ffffff" />
            <circle cx="40.1" cy="56.1" r="1.25" fill="#ffffff" />
            <circle cx="39.8" cy="50.1" r="0.8" fill="rgba(255,255,255,0.85)" />

            <!-- Mắt phải -->
            <ellipse cx="61.5" cy="53.5" rx="7.2" ry="8.4" fill="#09090b" stroke="#334155" stroke-width="0.8" />
            <ellipse cx="61.5" cy="53.8" rx="5.9" ry="7.1" fill="#0f172a" />
            <path d="M 57.5 58.2 Q 61.5 60.5 65.5 58.2" fill="none" stroke="#34d399" stroke-width="1.2" stroke-opacity="0.55" stroke-linecap="round" />
            <circle cx="59.1" cy="50.4" r="2.6" fill="#ffffff" />
            <circle cx="64.1" cy="56.1" r="1.25" fill="#ffffff" />
            <circle cx="63.8" cy="50.1" r="0.8" fill="rgba(255,255,255,0.85)" />
          </g>

          <!-- Hai gò má hồng phấn -->
          <ellipse cx="29" cy="63.5" rx="6.5" ry="3.6" fill="url(#${idPrefix}_cheek)" />
          <ellipse cx="70" cy="63.5" rx="6.5" ry="3.6" fill="url(#${idPrefix}_cheek)" />

          <!-- Nụ cười hở môi siêu cute -->
          <path d="M 43.2 62.6 Q 49.5 65.2 55.8 62.6 Q 55.8 71.2 49.5 71.2 Q 43.2 71.2 43.2 62.6 Z" fill="#4c0519" stroke="#f8fafc" stroke-opacity="0.28" stroke-width="0.7" />
          <ellipse cx="49.5" cy="68.8" rx="3.7" ry="1.9" fill="#fb7185" />
          <ellipse cx="48.5" cy="68.1" rx="1.1" ry="0.45" fill="rgba(255,255,255,0.55)" />
        </svg>
      `;
    }

    renderMascotBi3dArtwork() {
      const cornerWrap = document.getElementById('s11-mascot-bi-svg-wrap');
      if (cornerWrap) {
        const size = typeof window !== 'undefined' && window.innerWidth < 640 ? 52 : 58;
        cornerWrap.innerHTML = this.buildMascotBi3dSvgMarkup('corner', size, true);
      }
      const headerWrap = document.getElementById('modal-free-chat-mascot-svg');
      if (headerWrap) {
        headerWrap.innerHTML = this.buildMascotBi3dSvgMarkup('modal', 38, false);
      }
    }

    subscribeToRouterEvents() {
      if (this._busSubscribed) return;
      const bus = window.NoirStudio?.bus;
      if (!bus || typeof bus.on !== 'function') return;
      this._busSubscribed = true;
      const events = window.NoirStudio?.constants?.EVENTS || {};
      const refresh = () => {
        this.updateConnectionPillStatus();
        this.syncChatModelDropdown();
      };
      bus.on(events.API_KEY_UPDATED || 'ai:api_key_updated', refresh);
      bus.on(events.API_KEY_VERIFIED || 'ai:api_key_verified', refresh);
      bus.on(events.MODEL_CHANGED || 'ai:model_changed', refresh);
    }

    bindFloatingAiCornerControls() {
      const btnCollapse = document.getElementById('btn-floating-ai-collapse');
      const btnQuickCmd = document.getElementById('btn-floating-ai-command');
      if (btnCollapse && btnCollapse.dataset.mod27Bound !== '1') {
        btnCollapse.dataset.mod27Bound = '1';
        btnCollapse.addEventListener('click', () => {
          this.isFloatingAiCollapsed = !this.isFloatingAiCollapsed;
          try {
            localStorage.setItem(
              'noir_v39_floating_ai_collapsed',
              this.isFloatingAiCollapsed ? 'true' : 'false'
            );
          } catch (_e) {
            // Bỏ qua
          }
          this.syncFloatingAiCornerUI();
        });
      }
      if (btnQuickCmd && btnQuickCmd.dataset.mod27Bound !== '1') {
        btnQuickCmd.dataset.mod27Bound = '1';
        btnQuickCmd.addEventListener('click', () => {
          this.openChatModal();
        });
      }
    }

    syncFloatingAiCornerUI() {
      const wrap = document.getElementById('s11-mascot-bi-corner');
      const controls = document.getElementById('floating-ai-controls');
      const dragHandle = document.getElementById('floating-ai-drag-handle');
      const btnCollapse = document.getElementById('btn-floating-ai-collapse');
      const arrow = document.getElementById('floating-ai-arrow');
      const collapsed = this.isFloatingAiCollapsed !== false;
      if (controls) controls.classList.toggle('hidden', collapsed);
      if (dragHandle) dragHandle.classList.toggle('hidden', collapsed);
      if (wrap) {
        wrap.classList.toggle('bg-zinc-900/95', !collapsed);
        wrap.classList.toggle('border-2', !collapsed);
        wrap.classList.toggle('border-emerald-400/80', !collapsed);
        wrap.classList.toggle('rounded-full', !collapsed);
        wrap.classList.toggle('px-2.5', !collapsed);
        wrap.classList.toggle('py-1.5', !collapsed);
        wrap.classList.toggle('gap-1.5', !collapsed);
        wrap.classList.toggle('shadow-2xl', !collapsed);
        wrap.classList.toggle('bg-transparent', collapsed);
        wrap.classList.toggle('border-0', collapsed);
        wrap.classList.toggle('p-0', collapsed);
      }
      if (btnCollapse) btnCollapse.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      if (arrow) arrow.textContent = collapsed ? '▴' : '▾';
      this.renderMascotBi3dArtwork();
    }

    resolveEnforcedAiConfigForMode(mode = this.prefs?.chatBehaviorMode) {
      const normalized = mode === 'CASUAL_CHAT_AUTO' ? 'CASUAL_CHAT_AUTO' : 'WEB_SUPPORT_STRICT';
      if (normalized === 'CASUAL_CHAT_AUTO') {
        return {
          mode: 'CASUAL_CHAT_AUTO',
          modelId: 'gemini-4-hydrogen',
          thinkingLevel: 'LOW'
        };
      }
      return {
        mode: 'WEB_SUPPORT_STRICT',
        modelId: 'gemini-3.5-flash-lite',
        thinkingLevel: 'MINIMAL'
      };
    }

    getWelcomeMessageTextForMode(mode = this.prefs?.chatBehaviorMode) {
      return mode === 'CASUAL_CHAT_AUTO'
        ? 'Chào bạn, mình muốn nói gì mình cũng chiều, nếu bạn muốn tìm 1 người tán gẫu thì có mình đây nhé, tạm bỏ những lo toan viết lách và công việc qua 1 bên nha'
        : 'Xin chào bạn, bạn có thể ra lệnh cho mình mở, hướng dẫn các chức năng quanh trang web hoặc trò chuyện linh tinh ở chế độ 2 (Bạn có thể nhìn thấy ở góc trên chatbot có nút bấm chuyển chế độ 2) nhé';
    }

    createWelcomeMessageObj(mode = this.prefs?.chatBehaviorMode) {
      const normalized = mode === 'CASUAL_CHAT_AUTO' ? 'CASUAL_CHAT_AUTO' : 'WEB_SUPPORT_STRICT';
      return {
        id: `msg_welcome_${Date.now()}_${normalized === 'CASUAL_CHAT_AUTO' ? 'm2' : 'm1'}`,
        role: 'assistant',
        senderName: '🎱 Viên Bi Số 8',
        timestamp: Date.now(),
        modeBadge: normalized === 'CASUAL_CHAT_AUTO' ? 'Chế độ 2' : 'Chế độ 1',
        welcomeMode: normalized,
        text: this.getWelcomeMessageTextForMode(normalized)
      };
    }

    syncChatModelDropdown() {
      const enforced = this.resolveEnforcedAiConfigForMode(this.prefs?.chatBehaviorMode);
      this.prefs.chatModelId = enforced.modelId;
    }

    loadSavedState() {
      try {
        const rawHist = localStorage.getItem(this.storageKeyHistory);
        if (rawHist) {
          const parsed = JSON.parse(rawHist);
          if (Array.isArray(parsed)) {
            this.messages = parsed.slice(-60);
          }
        }
        const rawPrefs = localStorage.getItem(this.storageKeyPrefs);
        if (rawPrefs) {
          const p = JSON.parse(rawPrefs);
          if (p && typeof p === 'object') {
            this.prefs = { ...this.prefs, ...p };
          }
        }
        const enforced = this.resolveEnforcedAiConfigForMode(this.prefs?.chatBehaviorMode);
        this.prefs.chatModelId = enforced.modelId;
        if (Array.isArray(this.messages) && this.messages.length > 0) {
          let migrated = false;
          this.messages = this.messages.map((m) => {
            if (
              m &&
              String(m.id || '').startsWith('msg_welcome_') &&
              typeof m.text === 'string' &&
              (m.text.includes('Xin chào tác giả Bi!') || m.text.includes('Linh Vật Viên Bi Số 8'))
            ) {
              migrated = true;
              return this.createWelcomeMessageObj(this.prefs.chatBehaviorMode);
            }
            return m;
          });
          if (migrated) this.saveState();
        }
        const savedAiCollapsed = localStorage.getItem('noir_v39_floating_ai_collapsed');
        this.isFloatingAiCollapsed = savedAiCollapsed === 'false' ? false : true;
      } catch (err) {
        console.warn('[Mod27 MascotChat] Lỗi đọc lịch sử chat:', err);
      }
    }

    saveState() {
      try {
        localStorage.setItem(
          this.storageKeyHistory,
          JSON.stringify(this.messages.slice(-60))
        );
        localStorage.setItem(this.storageKeyPrefs, JSON.stringify(this.prefs));
      } catch (err) {
        console.warn('[Mod27 MascotChat] Lỗi lưu lịch sử chat:', err);
      }
    }

    seedWelcomeMessage() {
      this.messages = [this.createWelcomeMessageObj(this.prefs?.chatBehaviorMode)];
      this.saveState();
    }

    /**
     * Trang trí thêm hiệu ứng bong bóng gợi ý tinh tế cho nút Linh vật Viên Bi Số 8 ở góc dưới phải
     */
    decorateCornerMascotButton() {
      const targetContainer =
        document.getElementById('floating-ai-controls') ||
        document.getElementById('s11-mascot-bi-corner');
      if (!targetContainer || document.getElementById('mascot-bi-quick-bubble')) return;

      const bubble = document.createElement('div');
      bubble.id = 'mascot-bi-quick-bubble';
      bubble.className =
        'hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/40 bg-zinc-950/90 text-[11px] text-emerald-300 shadow-lg cursor-pointer hover:border-emerald-400 transition';
      bubble.setAttribute('data-mod27-bubble', '1');
      bubble.innerHTML = `
        <span>✨ Cần đặt tên NV, gỡ bí hay hỏi cách dùng?</span>
      `;
      bubble.addEventListener('click', () => this.openChatModal());
      targetContainer.insertBefore(bubble, targetContainer.firstChild);
      if (window.NoirNovel?.i18n?.translateElement) {
        window.NoirNovel.i18n.translateElement(bubble);
      }
    }

    /**
     * Chèn thanh công cụ Phím Tắt Thông Minh (Lắc Bi Số 8, Đặt Tên NV, Twist,
     * Câu Thoại, Hướng Dẫn Studio, Bật Giọng Đọc TTS, Xóa Chat) vào cửa sổ Chat
     */
    injectQuickActionToolbarIntoChatModal() {
      if (this.isToolbarInjected) return;
      const modal = document.getElementById('modal-free-gemini-chat');
      const messagesBox = document.getElementById('free-chat-messages-box');
      if (!modal || !messagesBox || !messagesBox.parentNode) return;

      const isMode1 = this.prefs.chatBehaviorMode === 'WEB_SUPPORT_STRICT';
      const neuralVoice = window.NoirStudio?.neuralVoice;
      const hasViVoice = Boolean(neuralVoice?.hasVoiceForLanguage?.('vi-VN'));
      const voiceDownloadUrl =
        neuralVoice?.getDirectVoiceDownloadInfo?.()?.primaryUrl ||
        'https://www.microsoft.com/vi-vn/edge/download';
      const toolbar = document.createElement('div');
      toolbar.id = 'free-chat-quick-actions-bar';
      toolbar.className =
        'px-3 sm:px-4 py-2 border-b border-studioLightBorder dark:border-zinc-800 bg-studioLightPanel/90 dark:bg-zinc-900/95 space-y-2 shrink-0 text-[11px] min-w-0';
      toolbar.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <div class="flex flex-wrap items-center gap-1.5">
            <button type="button" id="btn-chat-mode-web-support" data-bi-mode="WEB_SUPPORT_STRICT" class="px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition ${
              isMode1
                ? 'bg-emerald-600 text-white border border-emerald-400 shadow'
                : 'bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-emerald-500'
            }">
              🧭 Chế độ 1: Hỗ trợ Web
            </button>
            <button type="button" id="btn-chat-mode-casual-chat" data-bi-mode="CASUAL_CHAT_AUTO" class="px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition ${
              !isMode1
                ? 'bg-indigo-600 text-white border border-indigo-400 shadow'
                : 'bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-indigo-500'
            }">
              💬 Chế độ 2: Trò chuyện
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 min-w-0 relative">
            <div class="relative">
              <button type="button" id="btn-chat-toggle-shortcuts" aria-expanded="false" class="px-2.5 py-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 font-bold transition flex items-center gap-1">
                <span>⚡ Phím tắt</span>
                <span id="chat-shortcuts-caret" class="text-[10px]">▾</span>
              </button>
              <div id="chat-quick-actions-dropdown" class="hidden absolute right-0 top-full mt-1.5 w-60 p-1.5 rounded-xl border border-zinc-700 bg-zinc-950/95 shadow-2xl z-30 flex flex-col gap-1">
                <button type="button" data-bi-quick="ORACLE" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold transition">
                  🎱 Lắc Bi Tiên Tri
                </button>
                <button type="button" data-bi-quick="NAME_VN" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-amber-600/15 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold transition">
                  🇻🇳 Đặt Tên Việt / Hán Việt
                </button>
                <button type="button" data-bi-quick="NAME_LN" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-pink-600/15 hover:bg-pink-600/30 border border-pink-500/30 text-pink-300 font-bold transition">
                  🌸 Tên Nhật LN & Âu Mỹ
                </button>
                <button type="button" data-bi-quick="TWIST" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold transition">
                  ⚡ Gợi Ý Cú Twist
                </button>
                <button type="button" data-bi-quick="DIALOGUE" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-teal-600/15 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 font-bold transition">
                  💬 Mẫu Câu Thoại Đắt Giá
                </button>
                <button type="button" data-bi-quick="STUDIO_GUIDE" class="w-full text-left px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold transition">
                  🧭 Cẩm Nang 6 Tab
                </button>
              </div>
            </div>

            <button type="button" id="btn-chat-toggle-tts" class="px-2.5 py-1 rounded-lg border ${
              this.prefs.autoSpeakTTS
                ? 'border-pink-500/60 bg-pink-500/20 text-pink-200'
                : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
            } font-semibold transition" title="Bật/Tắt tự động đọc giọng Tiếng Việt">
              ${this.prefs.autoSpeakTTS ? '🔊 Đang đọc' : '🔈 Đọc giọng'}
            </button>
            <button type="button" id="btn-chat-clear-history" class="px-2 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold transition" title="Xóa làm mới cuộc trò chuyện">
              🗑️ Xóa
            </button>
          </div>
        </div>
        <div id="mod27-chat-voice-missing-wrap" class="${
          hasViVoice ? 'hidden ' : ''
        }italic text-[10.5px] text-amber-300 leading-snug">
          Bạn muốn AI có giọng nói, <a id="mod27-chat-voice-download-link" href="${this.getUtils().escapeHtml(
            voiceDownloadUrl
          )}" target="_blank" rel="noopener noreferrer" class="underline font-bold text-cyan-300 hover:text-cyan-200 cursor-pointer">bấm vào đây để tải về</a>, tải về xong reload trang là dùng được
        </div>
      `;

      messagesBox.parentNode.insertBefore(toolbar, messagesBox);
      this.isToolbarInjected = true;
      if (window.NoirNovel?.i18n?.translateElement) {
        window.NoirNovel.i18n.translateElement(toolbar);
      }
    }

    bindInternalChatEvents() {
      const toolbar = document.getElementById('free-chat-quick-actions-bar');
      if (toolbar && !toolbar.dataset.mod27Bound) {
        toolbar.dataset.mod27Bound = '1';

        toolbar.querySelectorAll('[data-bi-mode]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const nextMode = btn.getAttribute('data-bi-mode') || 'CASUAL_CHAT_AUTO';
            this.setChatBehaviorMode(nextMode);
          });
        });

        const btnToggleShortcuts = document.getElementById('btn-chat-toggle-shortcuts');
        const shortcutsDropdown = document.getElementById('chat-quick-actions-dropdown');
        const shortcutsCaret = document.getElementById('chat-shortcuts-caret');
        const setShortcutsOpen = (open) => {
          if (!shortcutsDropdown || !btnToggleShortcuts) return;
          shortcutsDropdown.classList.toggle('hidden', !open);
          btnToggleShortcuts.setAttribute('aria-expanded', open ? 'true' : 'false');
          if (shortcutsCaret) shortcutsCaret.textContent = open ? '▴' : '▾';
        };
        if (btnToggleShortcuts && shortcutsDropdown) {
          btnToggleShortcuts.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !shortcutsDropdown.classList.contains('hidden');
            setShortcutsOpen(!isOpen);
          });
          document.addEventListener('click', (e) => {
            if (
              !shortcutsDropdown.classList.contains('hidden') &&
              !shortcutsDropdown.contains(e.target) &&
              !btnToggleShortcuts.contains(e.target)
            ) {
              setShortcutsOpen(false);
            }
          });
        }

        toolbar.querySelectorAll('[data-bi-quick]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-bi-quick');
            setShortcutsOpen(false);
            this.handleQuickActionClick(action);
          });
        });

        const btnTts = document.getElementById('btn-chat-toggle-tts');
        if (btnTts) {
          btnTts.addEventListener('click', () => {
            this.prefs.autoSpeakTTS = !this.prefs.autoSpeakTTS;
            this.saveState();
            this.syncChatVoiceControlsUI();
            if (!this.prefs.autoSpeakTTS) {
              this.stopSpeaking();
            } else {
              const nv = window.NoirStudio?.neuralVoice;
              if (nv && typeof nv.hasVoiceForLanguage === 'function' && !nv.hasVoiceForLanguage('vi-VN')) {
                nv.markPendingVoiceInstall?.({
                  video: true,
                  chat: true,
                  source: 'CHATBOT',
                });
                nv.openVoiceInstallGuideModal?.({
                  source: 'CHATBOT',
                  lang: 'vi-VN',
                });
              } else {
                this.getUtils().showToast(
                  '🔊 Đã bật chế độ đọc giọng Tiếng Việt cho Trợ lý Viên Bi Số 8!',
                  'info'
                );
              }
            }
          });
        }

        const chatVoiceDlLink = document.getElementById('mod27-chat-voice-download-link');
        if (chatVoiceDlLink) {
          chatVoiceDlLink.addEventListener('click', () => {
            window.NoirStudio?.neuralVoice?.markPendingVoiceInstall?.({
              video: true,
              chat: true,
              source: 'CHATBOT_INLINE_LINK',
            });
          });
        }

        const btnClear = document.getElementById('btn-chat-clear-history');
        if (btnClear) {
          btnClear.addEventListener('click', () => this.clearChatHistory());
        }
      }

      const inputEl = document.getElementById('free-chat-input');
      if (inputEl && !inputEl.dataset.mod27KeyBound) {
        inputEl.dataset.mod27KeyBound = '1';
        try {
          const savedDraft = localStorage.getItem('noir_v40_free_chat_draft_v1');
          if (typeof savedDraft === 'string' && savedDraft && !inputEl.value) {
            inputEl.value = savedDraft;
          }
        } catch (_) {}
        inputEl.addEventListener('input', () => {
          try {
            localStorage.setItem('noir_v40_free_chat_draft_v1', String(inputEl.value || ''));
          } catch (_) {}
        });
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendChatMessage();
            try {
              localStorage.setItem('noir_v40_free_chat_draft_v1', String(inputEl.value || ''));
            } catch (_) {}
          }
        });
      }

      if (!document.body?.dataset?.mod27EscBound) {
        document.body.dataset.mod27EscBound = '1';
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            const modal = document.getElementById('modal-free-gemini-chat');
            if (modal && !modal.classList.contains('hidden')) {
              this.closeChatModal();
            }
          }
        });
      }

      const sendBtn = document.getElementById('btn-send-free-chat');
      if (sendBtn && !sendBtn.dataset.mod27SendBound) {
        sendBtn.dataset.mod27SendBound = '1';
        sendBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.sendChatMessage();
        });
      }
    }

    syncChatVoiceControlsUI() {
      const btnTts = document.getElementById('btn-chat-toggle-tts');
      if (btnTts) {
        const active = Boolean(this.prefs.autoSpeakTTS);
        btnTts.textContent = active ? '🔊 Đang bật đọc' : '🔈 Đọc giọng';
        btnTts.classList.toggle('border-pink-500/60', active);
        btnTts.classList.toggle('bg-pink-500/20', active);
        btnTts.classList.toggle('text-pink-200', active);
      }
      const nv = window.NoirStudio?.neuralVoice;
      const hasViVoice = nv?.hasVoiceForLanguage ? nv.hasVoiceForLanguage('vi-VN') : false;
      const missingWrap = document.getElementById('mod27-chat-voice-missing-wrap');
      if (missingWrap) {
        missingWrap.classList.toggle('hidden', Boolean(hasViVoice));
      }
    }

    openChatModal() {
      this.injectQuickActionToolbarIntoChatModal();
      this.bindInternalChatEvents();
      window.NoirStudio?.neuralVoice?.tryAutoActivatePendingVoice?.();
      this.syncChatVoiceControlsUI();
      this.syncChatBehaviorModeUI();
      this.syncChatModelDropdown();
      this.updateConnectionPillStatus();
      this.renderMessagesList();

      const modal = document.getElementById('modal-free-gemini-chat');
      if (modal) {
        modal.classList.remove('hidden');
        if (window.NoirNovel?.i18n?.translateElement) {
          window.NoirNovel.i18n.translateElement(modal);
        }
      }

      setTimeout(() => {
        const inputEl = document.getElementById('free-chat-input');
        if (inputEl) inputEl.focus();
      }, 80);
    }

    closeChatModal() {
      this.stopSpeaking();
      window.NoirStudio?.neuralVoice?.closeVoiceInstallGuideModal?.('CHATBOT');
      const modal = document.getElementById('modal-free-gemini-chat');
      if (modal) modal.classList.add('hidden');
    }

    setChatBehaviorMode(mode) {
      const nextMode =
        mode === 'WEB_SUPPORT_STRICT' ? 'WEB_SUPPORT_STRICT' : 'CASUAL_CHAT_AUTO';
      this.prefs.chatBehaviorMode = nextMode;
      const enforced = this.resolveEnforcedAiConfigForMode(nextMode);
      this.prefs.chatModelId = enforced.modelId;

      if (!Array.isArray(this.messages) || this.messages.length === 0) {
        this.messages = [this.createWelcomeMessageObj(nextMode)];
      } else if (
        this.messages.length === 1 &&
        String(this.messages[0]?.id || '').startsWith('msg_welcome_')
      ) {
        this.messages = [this.createWelcomeMessageObj(nextMode)];
      } else {
        const lastMsg = this.messages[this.messages.length - 1];
        if (String(lastMsg?.id || '').startsWith('msg_welcome_')) {
          this.messages[this.messages.length - 1] = this.createWelcomeMessageObj(nextMode);
        } else {
          this.messages.push(this.createWelcomeMessageObj(nextMode));
        }
      }

      this.saveState();
      this.syncChatBehaviorModeUI();
      this.renderMessagesList();
      const label =
        nextMode === 'WEB_SUPPORT_STRICT'
          ? '🧭 Đã chuyển sang Chế độ 1: Hỗ trợ Web.'
          : '💬 Đã chuyển sang Chế độ 2: Trò chuyện.';
      this.getUtils().showToast(label, 'info', 2200);
    }

    syncChatBehaviorModeUI() {
      const isMode1 = this.prefs.chatBehaviorMode === 'WEB_SUPPORT_STRICT';
      const btn1 = document.getElementById('btn-chat-mode-web-support');
      const btn2 = document.getElementById('btn-chat-mode-casual-chat');
      const inputEl = document.getElementById('free-chat-input');

      if (btn1) {
        btn1.className = `px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition ${
          isMode1
            ? 'bg-emerald-600 text-white border border-emerald-400 shadow'
            : 'bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-emerald-500'
        }`;
      }
      if (btn2) {
        btn2.className = `px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition ${
          !isMode1
            ? 'bg-indigo-600 text-white border border-indigo-400 shadow'
            : 'bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-indigo-500'
        }`;
      }
      if (inputEl) {
        inputEl.placeholder = isMode1
          ? 'Hỏi cách dùng hoặc ra lệnh mở chức năng trên web...'
          : 'Nhắn gì cũng được để tán gẫu hoặc hỏi bất cứ điều gì...';
      }
    }

    classifyChatMessageIntent(text, activeMode = 'CASUAL_CHAT_AUTO') {
      const q = String(text || '').trim().toLowerCase();
      const webFeaturePatterns = [
        /\btab\s*[1-6]\b/,
        /\bmod(?:ule)?\s*\d+\b/,
        'trang web', 'web này', 'web có', 'app này', 'ứng dụng', 'studio', 'website', 'hệ thống',
        'có gì', 'có những gì', 'có cái gì', 'làm được gì', 'dùng để làm gì', 'tổng quan', 'giới thiệu',
        'ở đâu', 'chỗ nào', 'nằm ở đâu', 'tìm ở đâu', 'làm sao', 'làm thế nào', 'kiểu gì', 'sao không',
        'cách dùng', 'hướng dẫn', 'chức năng', 'tính năng', 'mở ', 'bật ', 'tắt ', 'đóng ', 'thu gọn', 'mở rộng',
        'xuất file', 'xuất sách', 'pdf', 'docx', 'epub', 'txt', 'đănglovepdf', 'danglovepdf', 'ilovepdf', 'ihatepdf',
        'gộp pdf', 'tách pdf', 'nén pdf', 'ký tên', 'đóng dấu', 'ocr', 'đổi định dạng', 'chuyển đổi',
        'story bible', 'notebooklm', 'gemini', 'pomodoro', 'nhạc', 'mp3', 'âm nhạc', 'youtube', 'cửa sổ nổi', 'pip',
        'lặp a-b', 'a-b', 'hình nền', 'tranh nền', 'video nền', 'ảnh nền', 'hiệu ứng nền', 'crop', 'cắt ảnh',
        'chèn bảng', 'xóa bảng', 'chế độ word', 'căn lề', 'api key', 'thư mục', 'lưu trữ', 'google drive', 'oauth',
        'đồng bộ', 'sao lưu', 'backup', 'phiên bản', 'time-machine', 'mode 5', 'chế độ 5', 'chế độ 6', 'tạo bìa',
        'biểu đồ', 'sơ đồ', 'bm25', 'rag', 'duyệt', 'font chữ', 'cỡ chữ', 'thụt đầu dòng', 'mức tư duy',
        'hạn mức', 'quota', 'mô hình', 'flash', 'argon', 'hydrogen', 'neon', 'carbon', 'cài đặt', 'công cụ', 'chatbot',
        'hiệu năng', 'ram', 'tràn ram', 'dọn ram', 'giật', 'lag', 'chậm', 'tự ngủ', 'auto-sleep', 'chạy nền', 'chạy ngầm',
        'casio', 'fx-570', 'máy tính', 'đồ thị', 'desmos', 'thời tiết', 'báo thức', 'múi giờ', 'đồng hồ',
        'video hướng dẫn', 'tutorial', 'giọng đọc', 'google tts', 'ngôn ngữ', 'tiếng anh', 'tiếng trung', 'tiếng hàn', 'tiếng nhật',
        'guest mode', 'chế độ khách', 'phím tắt', 'báo lỗi', 'tác giả', 'ủng hộ', 'donate', 'qr', 'tải app', 'pwa',
        'lỗi', 'hỏng', 'không bấm được', 'hỗ trợ', 'giúp tôi', 'giúp mình'
      ];
      const novelCraftPatterns = [
        'chương', 'bản thảo', 'nhân vật', 'cốt truyện', 'kịch bản', 'phân cảnh',
        'cú twist', 'plot twist', 'lời thoại', 'câu thoại', 'viết tiếp', 'sửa văn',
        'văn phong', 'gỡ bí', 'mâu thuẫn', 'cao trào', 'phản diện', 'nam chính',
        'nữ chính', 'tiểu thuyết', 'light novel', 'truyện', 'lore', 'thế giới quan',
        'bối cảnh', 'phục bút', 'điểm nhìn', 'pov', 'lắc bi', 'đặt tên'
      ];
      const strictPureCasualPatterns = [
        'đói quá', 'ăn gì', 'ăn cơm', 'mệt quá', 'buồn ngủ', 'chán quá', 'vui quá',
        'buồn quá', 'hôm nay thế nào', 'kể chuyện cười', 'tán gẫu', 'nói chuyện phiếm',
        'tâm sự', 'thất tình', 'uống nước', 'cà phê không', 'trà sữa', 'ngủ ngon',
        'bạn khỏe không', 'bạn ăn chưa', 'chơi game không', 'kể chuyện vui'
      ];

      const matchesAny = (list) =>
        list.some((p) => (p instanceof RegExp ? p.test(q) : q.includes(p)));

      const hasWeb = matchesAny(webFeaturePatterns);
      const hasNovel = matchesAny(novelCraftPatterns);
      const isPureCasual = matchesAny(strictPureCasualPatterns);

      // Ở Chế độ 1 (Hỗ trợ Web): ưu tiên phục vụ mọi câu hỏi về trang web, tính năng, hướng dẫn, câu hỏi mở;
      // CHỈ từ chối khi người dùng rõ ràng đang tán gẫu đời tư thuần túy (ăn uống/buồn ngủ/tâm sự) không dính dáng web.
      if (activeMode === 'WEB_SUPPORT_STRICT') {
        if (isPureCasual && !hasWeb && !hasNovel) {
          return { category: 'CASUAL_CHITCHAT', label: 'TÁN GẪU ĐỜI THƯỜNG' };
        }
        return { category: 'WEB_FEATURE', label: 'HỖ TRỢ TÍNH NĂNG WEB' };
      }

      // Ở Chế độ 2 (Trò chuyện & Đồng hành thông minh): vẫn nhận diện chính xác câu hỏi về web để trả lời tận tình!
      if (hasWeb) {
        if (hasNovel && !q.includes('web') && !q.includes('app') && !q.includes('tab') && !q.includes('mở ') && !q.includes('cách') && !q.includes('ở đâu') && !q.includes('có gì')) {
          return { category: 'NOVEL_CRAFT', label: 'SÁNG TÁC & CỐT TRUYỆN' };
        }
        return { category: 'WEB_FEATURE', label: 'HỖ TRỢ TÍNH NĂNG WEB' };
      }
      if (hasNovel) {
        return { category: 'NOVEL_CRAFT', label: 'SÁNG TÁC & CỐT TRUYỆN' };
      }
      if (isPureCasual || q.split(/\s+/).length <= 16) {
        return { category: 'CASUAL_CHITCHAT', label: 'TÁN GẪU ĐỜI THƯỜNG' };
      }
      return { category: 'NOVEL_CRAFT', label: 'SÁNG TÁC & CỐT TRUYỆN' };
    }

    detectAndExecuteWebFeatureAction(text) {
      const q = String(text || '').trim().toLowerCase();
      const wantsOpen =
        q.includes('mở') || q.includes('chuyển sang') || q.includes('vào ') || q.includes('bật ') || q.includes('đi tới') || q.includes('đưa tôi tới');
      if (!wantsOpen) return null;

      // Các công cụ đặc thù mở trực tiếp bằng API module
      if (q.includes('đănglovepdf') || q.includes('danglovepdf') || q.includes('gộp pdf') || q.includes('tách pdf') || q.includes('nén pdf') || q.includes('đổi định dạng')) {
        if (window.NoirStudio?.dangLovePdf?.openDangLovePdfStudio) {
          this.closeChatModal();
          window.NoirStudio.dangLovePdf.openDangLovePdfStudio();
          return '❤️ ĐăngLovePDF — Trình xử lý PDF & Đổi định dạng 100% nội bộ (Mod 46)';
        }
      }
      if (q.includes('autotester') || q.includes('bác sĩ app') || q.includes('kiểm thử') || q.includes('khám tổng quát')) {
        if (window.NoirStudio?.autoTesterLoader?.open) {
          this.closeChatModal();
          window.NoirStudio.autoTesterLoader.open();
          return '🩺 Autotester nội bộ ("Bác sĩ App" — Mod 48)';
        }
      }
      if (q.includes('hiệu năng') || q.includes('dọn ram') || q.includes('quản lý ram') || q.includes('tự ngủ') || q.includes('tắt mod') || q.includes('bật mod')) {
        if (window.NoirStudio?.perfManager?.openPerfManagerPanel) {
          this.closeChatModal();
          window.NoirStudio.perfManager.openPerfManagerPanel();
          return '⚡ Quản Lý Hiệu Năng, Tự Ngủ & Tắt/Bật Chức Năng (Mod 47)';
        }
      }
      if (q.includes('đồng bộ') || q.includes('google drive') || q.includes('chuyển máy')) {
        this.navigateAndSpotlightFeature(
          { screen: 'SCREEN_6_SYSTEM', selector: '#btn-tab6-top-sync-devices', clickSelector: '#btn-tab6-top-sync-devices', label: 'Cửa sổ Đồng Bộ Dữ Liệu & Google Drive (Mod 37)' },
          true
        );
        return 'Cửa sổ Đồng Bộ Dữ Liệu & Google Drive (Mod 37)';
      }
      if (q.includes('máy tính') || q.includes('casio') || q.includes('desmos') || q.includes('đồ thị')) {
        this.navigateAndSpotlightFeature(
          { screen: 'SCREEN_6_SYSTEM', collapseTarget: 'tab6-acc-misc-body', selector: '#tab6-misc-fun-hub-root', label: 'Máy Tính Casio fx-570VN+ & Đồ Thị Desmos (Mod 45)' },
          true
        );
        return 'Máy Tính Casio fx-570VN+ & Đồ Thị Desmos (Mod 45)';
      }
      if (q.includes('thời tiết') || q.includes('báo thức') || q.includes('múi giờ') || q.includes('đồng hồ quốc tế')) {
        const trigger = document.querySelector('#btn-open-clock-weather-modal, [data-mod42-open-modal]');
        if (trigger) {
          this.closeChatModal();
          trigger.click();
          return 'Đồng Hồ Quốc Tế, Báo Thức & Thời Tiết 3D (Mod 42 & 43)';
        }
      }
      if (q.includes('video hướng dẫn') || q.includes('tutorial')) {
        this.navigateAndSpotlightFeature(
          { screen: 'SCREEN_6_SYSTEM', collapseTarget: 'tab6-acc-4-body', selector: '#mod28-video-tutorial-canvas', label: 'Rạp Video Hướng Dẫn Tương Tác 6 Ngôn Ngữ (Mod 28)' },
          true
        );
        return 'Rạp Video Hướng Dẫn Tương Tác 6 Ngôn Ngữ (Mod 28)';
      }
      if (q.includes('cổng kết nối') || q.includes('đổi api key') || q.includes('kiểm tra key')) {
        this.navigateAndSpotlightFeature(
          { screen: 'SCREEN_6_SYSTEM', selector: '#btn-s6-open-connection-gate', label: 'Cổng Kiểm Tra API Key & Thư Mục' },
          true
        );
        return 'Cổng Kiểm Tra API Key & Thư Mục';
      }
      if (q.includes('xuất pdf') || q.includes('xuất file') || q.includes('xuất sách')) {
        if (window.NoirStudio?.dangLovePdf?.openTwoChoiceChooserModal) {
          this.closeChatModal();
          window.NoirStudio.dangLovePdf.openTwoChoiceChooserModal();
          return 'Chọn Xuất Truyện Qua PDF hoặc ĐăngLovePDF';
        }
        this.navigateAndSpotlightFeature(
          { screen: 'SCREEN_1_WRITE', selector: '#btn-export-modal', clickSelector: '#btn-export-modal', label: 'Cửa sổ Xuất Sách Đa Định Dạng' },
          true
        );
        return 'Cửa sổ Xuất Sách Đa Định Dạng (PDF/DOCX/TXT)';
      }

      const navMap = [
        { match: ['tab 1', 'bàn viết', 'soạn thảo'], screen: 'SCREEN_1_WRITE', label: 'Tab 1: Bàn Viết Truyện' },
        { match: ['tab 2', 'chương', 'file nguồn'], screen: 'SCREEN_2_SOURCES', label: 'Tab 2: Chương & File Nguồn' },
        { match: ['tab 3', 'trợ lý ai', '5 chế độ', '6 chế độ', 'biểu đồ', 'tạo bìa'], screen: 'SCREEN_3_AI', label: 'Tab 3: Trung Tâm Điều Khiển AI & 6 Chế Độ' },
        { match: ['tab 4', 'story bible', 'nhân vật'], screen: 'SCREEN_4_BIBLE', label: 'Tab 4: Story Bible & Nhân Vật' },
        { match: ['tab 5', 'youtube', 'nhạc', 'mp3', 'pomodoro', 'hình nền', 'tranh nền', 'cỡ chữ'], screen: 'SCREEN_5_AMBIENCE', label: 'Tab 5: Nhạc, YouTube, Pomodoro & Chữ' },
        { match: ['tab 6', 'phiên bản', 'cài đặt'], screen: 'SCREEN_6_SYSTEM', label: 'Tab 6: Phiên Bản, Xuất File, ĐăngLovePDF & Cài Đặt' }
      ];

      for (const item of navMap) {
        if (item.match.some((k) => q.includes(k))) {
          this.navigateAndSpotlightFeature({ screen: item.screen, label: item.label }, false);
          return item.label;
        }
      }
      return null;
    }

    /**
     * Điều hướng thẳng tới đúng Tab/Mục trên Website, tự động bung các thanh rút gọn chứa nút đó
     * và làm nổi bật rực rỡ nút bấm đích để tác giả nhìn phát thấy ngay!
     */
    navigateAndSpotlightFeature(linkSpec = {}, closeChat = true) {
      if (closeChat) {
        this.closeChatModal();
      }
      const { screen, collapseTarget, tab5PanelId, selector, clickSelector, label } = linkSpec;

      if (screen) {
        if (window.NoirStudio?.navigator?.navigateToScreen) {
          window.NoirStudio.navigator.navigateToScreen(screen);
        } else {
          const tabBtn = document.querySelector(`[data-s14-tab="${screen}"]`);
          tabBtn?.click?.();
        }
      }

      setTimeout(() => {
        if (tab5PanelId) {
          const panel = document.getElementById(tab5PanelId);
          if (panel && panel.classList.contains('hidden')) {
            const togBtn = document.querySelector(`[data-bug13-target="${tab5PanelId}"]`);
            togBtn?.click?.();
            panel.classList.remove('hidden');
          }
        }
        if (collapseTarget) {
          const cEl = document.getElementById(collapseTarget);
          if (cEl && cEl.classList.contains('hidden')) {
            const cBtn = document.querySelector(`[data-noir-collapse-target="${collapseTarget}"]`);
            cBtn?.click?.();
            cEl.classList.remove('hidden');
          }
        }
        if (selector) {
          const targetEl = document.querySelector(selector);
          if (targetEl) {
            // Tự bung accordion cha nếu targetEl đang nằm bên trong một khối .hidden
            const hiddenParent = targetEl.closest('.hidden[id]');
            if (hiddenParent && hiddenParent.id) {
              const pBtn = document.querySelector(
                `[data-noir-collapse-target="${hiddenParent.id}"], [data-bug13-target="${hiddenParent.id}"]`
              );
              pBtn?.click?.();
              hiddenParent.classList.remove('hidden');
            }
            document.querySelectorAll('.noir-feature-spotlight').forEach((n) => {
              n.classList.remove('noir-feature-spotlight');
            });
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            targetEl.classList.add('noir-feature-spotlight');
            setTimeout(() => targetEl.classList.remove('noir-feature-spotlight'), 6500);
          }
        }
        if (clickSelector) {
          document.querySelector(clickSelector)?.click?.();
        }
        if (label) {
          this.getUtils().showToast(`🎯 Đã đưa bạn tới: ${label}`, 'info', 3000);
        }
      }, 120);
    }

    extractFeatureDeepLinks(userQuery = '', replyText = '') {
      const combined = `${String(userQuery || '')} ${String(replyText || '')}`.toLowerCase();
      const catalog = [
        {
          id: 'DANGLOVEPDF',
          keys: ['đănglovepdf', 'danglovepdf', 'gộp pdf', 'tách pdf', 'nén pdf', 'ocr', 'đổi định dạng', 'xuất pdf', 'xuất file', 'xuất sách', 'trang web này có gì', 'web này có gì'],
          label: '❤️ Mở Xuất PDF & ĐăngLovePDF (19 Công Cụ)',
          screen: 'SCREEN_6_SYSTEM',
          selector: '#btn-tab6-top-export-pdf',
          clickSelector: '#btn-tab6-top-export-pdf'
        },
        {
          id: 'PERF_RAM',
          keys: ['hiệu năng', 'ram', 'lag', 'giật', 'tự ngủ', 'auto-sleep', 'tắt mod', 'bật mod', 'dọn ram'],
          label: '⚡ Mở Quản Lý Hiệu Năng, Tự Ngủ & RAM (Mod 47)',
          screen: 'SCREEN_6_SYSTEM',
          collapseTarget: 'tab6-perf-ram-body',
          selector: '#tab6-acc-perf-ram-manager'
        },
        {
          id: 'AI_CMD',
          keys: ['prompt tổng', 'chế độ 1', 'chế độ 2', 'chế độ 3', 'chế độ 4', 'chế độ 6', 'tạo bìa', 'trợ lý ai', 'tab 3', 'câu lệnh', 'mô hình', 'chạy ai', 'trang web này có gì', 'web này có gì'],
          label: '🎛️ Mở Tab 3: Trung Tâm AI & 6 Chế Độ',
          screen: 'SCREEN_3_AI',
          selector: '#btn-open-fullscreen-ai-command'
        },
        {
          id: 'YOUTUBE_MOD39',
          keys: ['youtube', 'cửa sổ nổi', 'pip', 'lặp a-b', 'nền video', 'trang web này có gì', 'web này có gì'],
          label: '📺 Mở Tab 5: Rạp YouTube Sạch Quảng Cáo & Cửa Sổ Nổi',
          screen: 'SCREEN_5_AMBIENCE',
          selector: '#tab5-youtube-big-card'
        },
        {
          id: 'MODE5',
          keys: ['biểu đồ', 'chế độ 5', 'mode 5', 'dòng thời gian', 'timeline', 'sơ đồ'],
          label: '🎨 Đến Chế Độ 5: Vẽ Biểu Đồ Cốt Truyện',
          screen: 'SCREEN_3_AI',
          selector: '#s20-quad-tab-selector'
        },
        {
          id: 'BIBLE',
          keys: ['story bible', 'tab 4', 'nhân vật', 'ai biết gì', 'phục bút', 'notebooklm', 'chống quên'],
          label: '🏛️ Mở Tab 4: Trung Tâm Story Bible',
          screen: 'SCREEN_4_BIBLE',
          selector: '#tab4-notebooklm-guide-card'
        },
        {
          id: 'CHAPTERS',
          keys: ['tab 2', 'chương', 'tệp', 'import', 'bm25', 'duyệt bản thảo', 'duyệt chương'],
          label: '📂 Mở Tab 2: Cây Chương & Duyệt Bản Thảo',
          screen: 'SCREEN_2_SOURCES',
          selector: '#btn-approve-chapter'
        },
        {
          id: 'WRITE_DIFF',
          keys: ['tab 1', 'bàn viết', 'chuẩn hóa thoại', 'duyệt màu', 'google docs', 'soạn thảo'],
          label: '✍️ Mở Tab 1: Bàn Viết & Công Cụ Soạn Thảo',
          screen: 'SCREEN_1_WRITE',
          selector: '#textarea-chapter-content'
        },
        {
          id: 'AMBIENCE',
          keys: ['tab 5', 'nhạc', 'mp3', 'pomodoro', 'đồng hồ', 'hình nền', 'tranh nền', 'cỡ chữ', 'font'],
          label: '🎵 Mở Tab 5: Nhạc, Pomodoro & Hình Nền',
          screen: 'SCREEN_5_AMBIENCE',
          tab5PanelId: 's14-panel-typography-box',
          selector: '#s14-screen-5-ambience .bug13-toggle-option-btn'
        },
        {
          id: 'EXPORT_BOOK',
          keys: ['xuất pdf', 'xuất file', 'xuất sách', 'word', 'docx', 'in sách', 'bìa sách'],
          label: '📤 Mở Tab 6 & Nổi bật Bộ Xuất Sách PDF/DOCX',
          screen: 'SCREEN_6_SYSTEM',
          collapseTarget: 'tab6-acc-2-body',
          selector: '#btn-s6-card-export'
        },
        {
          id: 'VERSIONS',
          keys: ['phiên bản', 'khôi phục', 'preview', 'lịch sử', 'time-machine', 'mất bài'],
          label: '🕒 Mở Tab 6: Kho Phiên Bản & Xem Trước',
          screen: 'SCREEN_6_SYSTEM',
          collapseTarget: 'tab6-acc-2-body',
          selector: '#btn-toggle-tab6-vault'
        },
        {
          id: 'API_KEY',
          keys: ['api key', 'gemini key', 'khóa api', 'cổng kết nối', 'thư mục làm việc'],
          label: '🔑 Mở Tab 6: Kiểm Tra / Đổi Key & Thư Mục',
          screen: 'SCREEN_6_SYSTEM',
          collapseTarget: 'tab6-acc-1-body',
          selector: '#btn-s6-open-connection-gate'
        },
        {
          id: 'VIDEO_GUIDE',
          keys: ['video', 'hướng dẫn', 'cẩm nang', 'tất cả tính năng', 'module 31'],
          label: '🧭 Mở Tab 6: Danh Mục Toàn Bộ Tính Năng & Video',
          screen: 'SCREEN_6_SYSTEM',
          collapseTarget: 'tab6-acc-4-body',
          selector: '#tab6-mod31-feature-directory-root'
        }
      ];

      const matched = [];
      for (const item of catalog) {
        if (item.keys.some((k) => combined.includes(k))) {
          matched.push(item);
          if (matched.length >= 3) break;
        }
      }
      return matched;
    }

    buildCasualChitchatLocalFallback(rawText) {
      const q = String(rawText || '').toLowerCase();
      if (q.includes('đói')) {
        return 'Nghe tác giả than đói là Viên Bi Số 8 thương quá! 🍜 Bạn tranh thủ nghỉ tay 10 phút nạp chút năng lượng (một bát mì nóng, bánh mì trứng hoặc ly sữa ấm) rồi quay lại viết tiếp nhé. Mọi bản thảo trên Web đã được tự động lưu an toàn rồi!';
      }
      if (q.includes('mệt') || q.includes('buồn ngủ')) {
        return 'Viết chữ mệt thì cho đôi mắt nghỉ ngơi một nhịp bạn nhé 🌙. Bạn có thể bật nhạc Lo-Fi nhẹ nhàng ở **Tab 5** hoặc bấm nghỉ giải lao Pomodoro 5 phút cho đầu óc thư giãn rồi chiến tiếp!';
      }
      return 'Mình đang lắng nghe bạn đây! 😊 Nếu chỉ muốn trò chuyện thư giãn cho đỡ căng thẳng đầu óc thì cứ tâm sự thoải mái với Viên Bi Số 8 nhé (hiện đang ở **Chế độ 2: Trò chuyện bình thường**).';
    }

    updateConnectionPillStatus() {
      const enforced = this.resolveEnforcedAiConfigForMode(this.prefs?.chatBehaviorMode);
      this.prefs.chatModelId = enforced.modelId;
    }

    // ------------------------------------------------------------------------
    // Kho Dữ Liệu Xây Dựng Thế Giới Quan, Hệ Thống Sức Mạnh, Cổ Vật & Bối Cảnh
    // Phục vụ Tác giả khi cần tra cứu hoặc tạo nhanh thiết lập truyện
    // ------------------------------------------------------------------------
    getWorldbuildingEncyclopedia() {
      return {
        powerSystems: [
          {
            name: 'Hệ Thống Khế Ước Ký Ức (Memory Pact System)',
            tierList: [
              'Tầng 1: Khởi Niệm (Đánh thức mảnh ký ức đầu tiên)',
              'Tầng 2: Cộng Hưởng (Đồng bộ cảm xúc với cổ vật)',
              'Tầng 3: Phản Chiếu (Tái hiện kỹ năng từ quá khứ)',
              'Tầng 4: Nghịch Lưu (Bẻ cong quy luật không gian trong 10 giây)',
              'Tầng 5: Vĩnh Hằng (Hóa thân thành ý chí nguyên bản nhưng đánh đổi 1 giác quan)'
            ],
            rule: 'Mỗi lần sử dụng năng lực vượt quá giới hạn, người dùng sẽ mất đi một kỷ niệm đẹp nhất trong đời.'
          },
          {
            name: 'Hệ Thống Cổ Văn Tinh Tú (Astral Runes & Sigils)',
            tierList: [
              'Cấp Tinh Trần (Khắc ấn lên vũ khí thường)',
              'Cấp Nguyệt Ảnh (Điều khiển trọng lực và bóng tối)',
              'Cấp Nhật Viêm (Thiêu đốt ma lực đối phương)',
              'Cấp Thiên Mệnh (Mở cổng không gian và tiên tri 3 giây tương lai)'
            ],
            rule: 'Cổ văn chỉ phát sáng khi nhịp tim của người sử dụng giữ ở mức bình tĩnh tuyệt đối dưới 65 nhịp/phút.'
          },
          {
            name: 'Hệ Thống Tâm Lý Tội Phạm & Suy Luận (Noir Deduction Matrix)',
            tierList: [
              'Quan Sát Vi Thể (Nhận diện nói dối qua ánh mắt và nhịp thở)',
              'Tái Hiện Hiện Trường (Dựng lại chuỗi hành động theo từng phút)',
              'Dẫn Dụ Tâm Lý (Đặt câu hỏi khiến nghi phạm tự lộ sơ hở)',
              'Chiếu Tướng Tuyệt Đối (Khóa chặt mọi lối thoát bằng bằng chứng vật lý)'
            ],
            rule: 'Mọi suy luận đều phải có ít nhất 2 chứng cứ vật chất độc lập xác nhận.'
          }
        ],
        atmosphericSettings: [
          {
            title: '🌧️ Tiệm Đồng Hồ Cổ Cuối Con Hẻm Mưa (Noir / Trinh Thám / Kỳ Ảo)',
            sensoryDetails: [
              'Thị giác: Ánh đèn vàng hổ phách hắt qua mặt kính mờ hơi nước; hàng trăm quả lắc đồng hồ đung đưa không cùng một nhịp.',
              'Thính giác: Tiếng tích tắc chồng lên nhau như tiếng mưa rơi trên mái tôn rỉ sét; tiếng chuông đồng ngân vang lúc nửa đêm.',
              'Khứu giác: Mùi dầu máy cũ kỹ hòa lẫn mùi gỗ thông ẩm và hương trà bá tước ấm nóng.',
              'Bí mật ẩn giấu: Chiếc đồng hồ quả quýt không có kim giờ trên kệ cao nhất chỉ quay ngược mỗi khi có người nói dối trong tiệm.'
            ]
          },
          {
            title: '🏮 Thư Viện Ngầm Dưới Tháp Chuông Học Viện (Light Novel / Học Đường Bí Ẩn)',
            sensoryDetails: [
              'Thị giác: Những kệ sách gỗ sồi cao chạm trần vòm; bụi phấn lơ lửng trong luồng ánh trăng xanh chiếu qua ô cửa kính màu.',
              'Thính giác: Tiếng lật giấy sột soạt vang vọng trong không gian tĩnh mịch; tiếng bước chân rất khẽ ở tầng lửng phía trên.',
              'Khứu giác: Mùi giấy da dê lâu năm, mùi sáp nến ong và hương hoa linh lan thoang thoảng.',
              'Bí mật ẩn giấu: Những cuốn nhật ký ở dãy số 13 tự động viết tiếp các sự kiện sẽ xảy ra vào ngày mai.'
            ]
          },
          {
            title: '⚔️ Đèo Phong Tuyết & Quán Trọ Đèn Lồng Đỏ (Cổ Phong / Kiếm Hiệp)',
            sensoryDetails: [
              'Thị giác: Tuyết trắng xóa phủ kín mái ngói lưu ly; chiếc đèn lồng lụa đỏ chao đảo dữ dội trong gió bấc.',
              'Thính giác: Tiếng gió rít qua khe cửa gỗ như tiếng sáo ai oán; tiếng củi thông nổ lách tách trong lò sưởi.',
              'Khứu giác: Mùi rượu nữ nhi hồng hâm nóng quyện với mùi sắt lạnh từ thanh trường kiếm vừa đi qua bão tuyết.',
              'Bí mật ẩn giấu: Toàn bộ thực khách ngồi ở bốn bàn góc quán đều đang che giấu thân phận thật dưới lớp áo tơi.'
            ]
          }
        ],
        ancientRelicsAndClues: [
          '🗝️ Chiếc chìa khóa đồng khắc số 08 không mở được ổ khóa nào ở hiện tại, nhưng lại khớp với hộp nhạc trong ký ức.',
          '⌚ Đồng hồ bỏ túi bị vỡ mặt kính, kim dừng lại đúng 23:42 — thời điểm vụ mất tích xảy ra.',
          '📜 Tờ hóa đơn tiệm sách cũ viết bằng mực cảm nhiệt: chỉ khi hơ gần ngọn nến hoặc tách trà nóng mới hiện ra dòng nhắn gửi.',
          '💍 Chiếc nhẫn bạc có vết khắc bên trong lòng nhẫn, chỉ người đeo nó suốt 10 năm mới có vết chai ở đúng vị trí đó.',
          '🎻 Bản nhạc viết dở trên giấy ố vàng: các nốt nhạc đầu tiên của mỗi khuôn nhạc ghép lại thành mật mã tên người.'
        ]
      };
    }

    // ------------------------------------------------------------------------
    // Xử lý khi tác giả bấm các nút Phím Tắt Thông Minh của Viên Bi Số 8
    // ------------------------------------------------------------------------
    handleQuickActionClick(actionType) {
      let userText = '';
      let replyText = '';
      let badge = 'TRỢ LÝ BI SỐ 8';

      if (actionType === 'ORACLE') {
        userText = '🎱 Lắc Viên Bi Số 8 Tiên Tri định hướng cho phân cảnh tiếp theo!';
        replyText = this.shakeMagic8BallOracle();
        badge = 'QUẺ TIÊN TRI BI SỐ 8';
      } else if (actionType === 'NAME_VN') {
        userText = '🇻🇳 Gợi ý danh sách tên nhân vật Việt Nam hiện đại và Hán Việt cổ phong giàu ý nghĩa.';
        replyText = this.generateCharacterNameSuggestions('ASIA');
        badge = 'TỪ ĐIỂN ĐẶT TÊN';
      } else if (actionType === 'NAME_LN') {
        userText = '🌸 Gợi ý tên nhân vật chuẩn Nhật Bản Light Novel và Âu Mỹ Kỳ Ảo / Trinh Thám.';
        replyText = this.generateCharacterNameSuggestions('LN_WEST');
        badge = 'TỪ ĐIỂN ĐẶT TÊN';
      } else if (actionType === 'TWIST') {
        userText = '⚡ Đề xuất các phương án Bẻ Lái Cốt Truyện (Plot Twist) và Gỡ Bí cho chương đang viết.';
        replyText = this.generatePlotTwistIdeas();
        badge = 'QUÂN SƯ PLOT TWIST';
      } else if (actionType === 'DIALOGUE') {
        userText = '💬 Gợi ý các mẫu câu thoại đắt giá, giàu ẩn ý (Subtext) theo chuẩn "- Câu thoại (Tên nhân vật)".';
        replyText = this.generateDialoguePromptStarter();
        badge = 'NGHỆ THUẬT ĐỐI THOẠI';
      } else if (actionType === 'STUDIO_GUIDE') {
        userText = '🧭 Hướng dẫn chi tiết cách sử dụng toàn bộ 6 Màn hình và các tính năng mới của Studio.';
        replyText = this.generateCompleteStudioGuideResponse();
        badge = 'CẨM NANG A-Z';
      }

      if (!replyText) return;

      this.appendMessage('user', '✍️ Tác giả Bi', userText, 'PHÍM TẮT NHANH');
      this.appendMessage('assistant', '🎱 Linh Vật Viên Bi Số 8', replyText, badge);

      if (this.prefs.autoSpeakTTS) {
        this.speakVietnameseText(replyText);
      }
    }

    /**
     * 1. Lắc Viên Bi Số 8 Tiên Tri Cốt Truyện (Kết hợp chẩn đoán chương hiện tại)
     */
    shakeMagic8BallOracle(customQuestion = '') {
      const oracle =
        MAGIC_8_BALL_LITERARY_ORACLES[
          this.oracleCounter % MAGIC_8_BALL_LITERARY_ORACLES.length
        ];
      this.oracleCounter += 1;

      const chapMgr = this.getChapterManager();
      const activeChap =
        chapMgr && typeof chapMgr.getActiveChapter === 'function'
          ? chapMgr.getActiveChapter()
          : null;
      const chapTitle =
        activeChap?.displayTitle ||
        document.getElementById('input-chapter-title')?.value ||
        'Chương đang viết';
      const chapText =
        document.getElementById('textarea-chapter-content')?.value ||
        activeChap?.content ||
        '';
      const wordCount = this.getUtils().countVietnameseWords(chapText);

      const world = this.getWorldbuildingEncyclopedia();
      const randomRelic =
        world.ancientRelicsAndClues[
          Math.floor(Math.random() * world.ancientRelicsAndClues.length)
        ];

      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      return [
        `### ${oracle.verdict}`,
        customQuestion ? `> **Câu hỏi của bạn:** *"${customQuestion}"*\n` : '',
        `📖 **Đang soi chiếu vào:** *${chapTitle}* (Hiện có **${fmtNum(wordCount)}** từ)`,
        ``,
        `🧭 **Lời khuyên chiến lược từ Viên Bi Số 8:**`,
        `${oracle.advice}`,
        ``,
        `⚡ **Gợi ý cài cắm tình tiết bất ngờ ngay trong cảnh này:**`,
        `• **Hướng bẻ lái:** ${oracle.twistHint}`,
        `• **Đạo cụ / Phục bút gợi ý (Chekhov's Gun):** ${randomRelic}`,
        ``,
        `💡 *Mẹo nhỏ:* Bạn có thể bấm nút **"📥 Chèn vào Bản thảo"** hoặc **"🏛️ Lưu vào Bible"** ngay bên dưới tin nhắn này nếu muốn giữ lại ý tưởng vừa rút được!`
      ]
        .filter(Boolean)
        .join('\n');
    }

    /**
     * 2. Tạo danh sách tên nhân vật đa phong cách kèm phân tích khí chất
     */
    generateCharacterNameSuggestions(groupMode = 'ALL') {
      const pickRandom = (arr, n = 6) => {
        const copy = [...arr];
        const out = [];
        while (out.length < n && copy.length > 0) {
          const idx = Math.floor(Math.random() * copy.length);
          out.push(copy.splice(idx, 1)[0]);
        }
        return out;
      };

      const sections = [];

      if (groupMode === 'ASIA' || groupMode === 'ALL') {
        const vn = CHARACTER_NAME_ENCYCLOPEDIA.VIETNAMESE_MODERN_NOIR;
        const sino = CHARACTER_NAME_ENCYCLOPEDIA.SINO_VIETNAMESE_FANTASY;

        const vnMales = pickRandom(vn.surnames, 5).map(
          (sur, i) =>
            `${sur} ${vn.middleMale[i % vn.middleMale.length]} ${
              vn.maleGiven[(i * 3 + Math.floor(Math.random() * 5)) % vn.maleGiven.length]
            }`
        );
        const vnFemales = pickRandom(vn.surnames, 5).map(
          (sur, i) =>
            `${sur} ${vn.middleFemale[i % vn.middleFemale.length]} ${
              vn.femaleGiven[
                (i * 3 + Math.floor(Math.random() * 5)) % vn.femaleGiven.length
              ]
            }`
        );

        const sinoMales = pickRandom(sino.surnames, 5).map(
          (sur, i) =>
            `${sur} ${
              sino.maleGiven[
                (i * 2 + Math.floor(Math.random() * 6)) % sino.maleGiven.length
              ]
            }`
        );
        const sinoFemales = pickRandom(sino.surnames, 5).map(
          (sur, i) =>
            `${sur} ${
              sino.femaleGiven[
                (i * 2 + Math.floor(Math.random() * 6)) % sino.femaleGiven.length
              ]
            }`
        );

        sections.push(
          `### ${vn.title}`,
          `• **Nam chính / Nam phụ ấn tượng:** ${vnMales.join('  |  ')}`,
          `• **Nữ chính / Nữ phụ giàu cảm xúc:** ${vnFemales.join('  |  ')}`,
          `• *Phong cách:* ${vn.meaningNotes[0]}`,
          ``,
          `### ${sino.title}`,
          `• **Nam nhân Cổ phong / Kiếm khách:** ${sinoMales.join('  |  ')}`,
          `• **Nữ nhân Cổ phong / Tiên tử:** ${sinoFemales.join('  |  ')}`,
          `• *Phong cách:* ${sino.meaningNotes[0]}`
        );
      }

      if (groupMode === 'LN_WEST' || groupMode === 'ALL') {
        const jp = CHARACTER_NAME_ENCYCLOPEDIA.JAPANESE_LIGHT_NOVEL;
        const west = CHARACTER_NAME_ENCYCLOPEDIA.WESTERN_GOTHIC_FANTASY;

        const jpSurnames = pickRandom(jp.surnames, 4);
        const jpMales = pickRandom(jp.maleGiven, 4);
        const jpFemales = pickRandom(jp.femaleGiven, 4);

        const westMales = pickRandom(west.maleGiven, 4).map(
          (g, i) => `${g} ${west.surnames[(i * 2) % west.surnames.length]}`
        );
        const westFemales = pickRandom(west.femaleGiven, 4).map(
          (g, i) => `${g} ${west.surnames[(i * 2 + 1) % west.surnames.length]}`
        );

        sections.push(
          `### ${jp.title}`,
          `• **Họ (Gia tộc) gợi ý:** ${jpSurnames.join(' • ')}`,
          `• **Tên Nam kèm Hán tự:**\n  - ${jpMales.join('\n  - ')}`,
          `• **Tên Nữ kèm Hán tự:**\n  - ${jpFemales.join('\n  - ')}`,
          ``,
          `### ${west.title}`,
          `• **Quý tộc / Thám tử / Hiệp sĩ Nam:** ${westMales.join('  |  ')}`,
          `• **Tiểu thư / Pháp sư / Nhân vật Nữ:** ${westFemales.join('  |  ')}`
        );
      }

      sections.push(
        ``,
        `💡 *Bạn thích cái tên nào nhất? Bạn có thể mở **Tab 4 (🏛️ Story Bible & Nhân Vật)** và bấm **"+ Thêm Nhân Vật"** để đưa ngay nhân vật mới vào ma trận chống quên nhé!*`
      );

      return sections.join('\n');
    }

    /**
     * 3. Gợi ý Cú Twist Bẻ Lái Cốt Truyện & Bối Cảnh Không Gian
     */
    generatePlotTwistIdeas() {
      const world = this.getWorldbuildingEncyclopedia();
      const setting =
        world.atmosphericSettings[
          Math.floor(Math.random() * world.atmosphericSettings.length)
        ];

      const blocks = [
        `### ⚡ 4 KỊCH BẢN BẺ LÁI CỐT TRUYỆN (PLOT TWIST) ĐẮT GIÁ CHO CHƯƠNG NÀY`,
        ``
      ];

      PLOT_TWIST_TEMPLATES.forEach((tpl, idx) => {
        blocks.push(
          `#### ${idx + 1}. ${tpl.title} *(${tpl.category})*`,
          `• **Ý tưởng cốt lõi:** ${tpl.summary}`,
          `• **Cách triển khai 3 nhịp:**`,
          ...tpl.executionSteps.map((s) => `  - ${s}`),
          ``
        );
      });

      blocks.push(
        `### 🌌 GỢI Ý BỐI CẢNH KHÔNG GIAN GIÀU CHẤT ĐIỆN ẢNH:`,
        `**${setting.title}**`,
        ...setting.sensoryDetails.map((d) => `• ${d}`),
        ``,
        `💡 *Mẹo:* Bạn có thể bấm nút **"📥 Chèn vào Bản thảo"** bên dưới hoặc sao chép kịch bản này dán vào ô Câu lệnh ở **Tab 3** để AI triển khai thành chương 3.500 từ hoàn chỉnh!`
      );

      return blocks.join('\n');
    }

    /**
     * 4. Gợi ý các mẫu câu thoại giàu ẩn ý theo đúng quy ước "- Câu thoại (Tên nhân vật)"
     */
    generateDialoguePromptStarter() {
      const lines = [
        `### 💬 MẪU HỘI THOẠI GIÀU ẨN Ý (SUBTEXT) — CHUẨN QUY ƯỚC "- CÂU THOẠI (TÊN NHÂN VẬT)"`,
        `Trong tiểu thuyết xuất sắc, nhân vật hiếm khi nói toạc cảm xúc thật của mình ra bằng lời. Hãy để hành động nhỏ và câu thoại mang hai tầng nghĩa:`,
        ``
      ];

      EMOTIONAL_DIALOGUE_ARCHETYPES.forEach((arch, idx) => {
        lines.push(
          `#### ${idx + 1}. Tâm trạng: ${arch.mood}`,
          `*Ngữ cảnh áp dụng:* ${arch.context}`,
          ...arch.lines.map((l) => `  ${l}`),
          ``
        );
      });

      lines.push(
        `💡 *Gợi ý:* Trên thanh công cụ **Tab 1**, bạn có thể bấm nút **"🧹 Chuẩn hóa - Thoại (Tên)"** bất cứ lúc nào để hệ thống tự động định dạng lại toàn bộ hội thoại trong chương về chuẩn thống nhất!`
      );

      return lines.join('\n');
    }

    /**
     * 5. Tổng hợp Cẩm nang Hướng dẫn sử dụng toàn bộ 6 Màn hình Studio
     */
    generateCompleteStudioGuideResponse() {
      const lines = [
        `### 🧭 CẨM NANG TỔNG QUAN 6 MÀN HÌNH & CÁC TÍNH NĂNG ĐỘT PHÁ (v38.0)`,
        ``
      ];
      STUDIO_USAGE_KNOWLEDGE_BASE.forEach((item, idx) => {
        lines.push(`#### ${idx + 1}. ${item.title}`, item.answer, ``);
      });
      lines.push(
        `🎬 **Đặc biệt:** Bạn có thể mở **Tab 6** -> Bấm vào thẻ **"🎬 3. Video Hướng Dẫn & Cẩm Nang A-Z"** để xem **Video Trình Chiếu Hoạt Họa 60FPS Có Phụ Đề Tiếng Việt Chi Tiết Từng Giây** hướng dẫn trực quan từ đầu đến cuối!`
      );
      return lines.join('\n');
    }

    // ------------------------------------------------------------------------
    // PHẦN 3: BỘ KHUNG HÌNH MẪU TÂM LÝ NHÂN VẬT (LITERARY ARCHETYPES),
    //         ĐỘNG CƠ PHẢN DIỆN & CẤU TRÚC HÀNH TRÌNH ANH HÙNG 12 NHỊP
    // ------------------------------------------------------------------------
    getCharacterPsychologyMatrix() {
      return {
        literaryArchetypes: [
          {
            id: 'ARCH_STRATEGIST',
            name: '♟️ Kẻ Mưu Lược Trầm Mặc (The Stoic Strategist)',
            coreDesire: 'Kiểm soát mọi biến số để không ai bên cạnh phải chịu mất mát như trong quá khứ.',
            hiddenFear: 'Một sai lầm tính toán duy nhất của bản thân sẽ đẩy người mình yêu thương vào chỗ chết.',
            speechHabit: 'Luôn trả lời câu hỏi bằng một câu hỏi ngược lại; giọng điệu bình thản ngay cả khi đang bị chĩa vũ khí.',
            arcProgression: 'Từ chỗ ôm đồm mọi gánh nặng một mình -> Học cách tin tưởng và giao phó sinh mạng cho đồng đội.'
          },
          {
            id: 'ARCH_SUNSHINE_MASK',
            name: '🎭 Kẻ Đeo Mặt Nạ Nắng Ấm (The Smiling Mask)',
            coreDesire: 'Giữ cho bầu không khí của cả nhóm luôn vui vẻ để che giấu vết thương chí mạng của chính mình.',
            hiddenFear: 'Khi nụ cười tắt đi, mọi người sẽ nhận ra mình đã kiệt sức đến mức nào.',
            speechHabit: 'Hay pha trò đúng lúc căng thẳng nhất; thường chuyển chủ đề mỗi khi có ai hỏi về gia đình hoặc quá khứ.',
            arcProgression: 'Từ chỗ trốn tránh nỗi đau sau tiếng cười -> Dám khóc thật sự trước mặt người thương.'
          },
          {
            id: 'ARCH_RELUCTANT_HERO',
            name: '🗡️ Kẻ Bất Đắc Dĩ Bước Vào Cuộc Chiến (The Reluctant Blade)',
            coreDesire: 'Chỉ muốn một cuộc sống bình yên nơi góc phố nhỏ, làm công việc sửa đồ cũ hoặc bán sách.',
            hiddenFear: 'Bản năng sát phạt từng bị phong ấn trong máu sẽ thức tỉnh và nuốt chửng nhân tính.',
            speechHabit: 'Câu cửa miệng: "Tôi chỉ là người qua đường thôi", nhưng tay luôn vô thức chắn trước mặt kẻ yếu.',
            arcProgression: 'Từ chối lời kêu gọi -> Buộc phải rút kiếm vì ranh giới cuối cùng bị xâm phạm -> Chấp nhận sứ mệnh.'
          },
          {
            id: 'ARCH_EMPATHIC_DETECTIVE',
            name: '🔍 Người Thấu Cảm Quá Mức (The Haunting Empath)',
            coreDesire: 'Lắng nghe tiếng nói cuối cùng của những nạn nhân không còn cơ hội lên tiếng.',
            hiddenFear: 'Sự đồng cảm quá sâu với tâm lý tội phạm khiến ranh giới thiện — ác trong lòng bị xóa nhòa.',
            speechHabit: 'Thường miêu tả cảm xúc của người khác chính xác đến mức khiến đối phương rùng mình.',
            arcProgression: 'Bị ám ảnh bởi bóng tối -> Tìm được mỏ neo ánh sáng nơi người bạn đồng hành.'
          },
          {
            id: 'ARCH_NOBLE_RIVAL',
            name: '👑 Đối Thủ Kiêu Hãnh (The Honorable Rival)',
            coreDesire: 'Đánh bại nhân vật chính một cách đường hoàng ở đỉnh cao phong độ nhất.',
            hiddenFear: 'Chiến thắng nhờ sự gian dối hoặc thấy đối thủ xứng tầm duy nhất của mình gục ngã vì kẻ tiểu nhân.',
            speechHabit: 'Ngôn từ sắc bén, kiêu ngạo nhưng tuyệt đối giữ lời hứa; sẵn sàng quay mũi kiếm bảo vệ nhân vật chính khi có kẻ thứ ba đánh lén.',
            arcProgression: 'Kẻ thù không đội trời chung -> Đồng minh sinh tử đứng chung chiến tuyến ở trận quyết chiến.'
          }
        ],
        villainMotivations: [
          {
            title: '⚖️ Phản Diện "Công Lý Cực Đoan" (The Fallen Idealist)',
            philosophy:
              'Họ từng là người lương thiện nhất nhưng chứng kiến hệ thống pháp luật/thế giới bất lực trước cái ác, nên quyết định tự mình trở thành "Ác Quỷ" để thanh trừng tất cả.',
            signatureQuote:
              '- Nếu ánh sáng của các người không chiếu tới được con hẻm tối đó, vậy để ngọn lửa của tôi thiêu rụi cả thành phố này cho công bằng! (Phản diện)'
          },
          {
            title: '⏳ Phản Diện "Kẻ Đảo Ngược Thời Gian" (The Grief-Stricken Architect)',
            philosophy:
              'Mọi âm mưu chấn động thế giới mà họ bày ra suốt 20 năm chỉ nhằm một mục đích duy nhất: quay ngược thời gian về đúng buổi chiều mưa năm ấy để cứu một người.',
            signatureQuote:
              '- Thế giới này đúng hay sai, tồn tại hay hủy diệt, với ta chẳng có nghĩa lý gì nếu thiếu mất tiếng cười của người ấy. (Phản diện)'
          },
          {
            title: '🪞 Phản Diện "Tấm Gương Phản Chiếu" (The Dark Mirror)',
            philosophy:
              'Có xuất phát điểm và bi kịch giống hệt nhân vật chính, nhưng ở ngã rẽ định mệnh, họ đã chọn trả thù thay vì tha thứ.',
            signatureQuote:
              '- Đừng nhìn ta như thế. Giữa ta và ngươi chỉ cách nhau đúng một ngày mưa mà không có ai đưa ô ra che thôi. (Phản diện)'
          }
        ],
        chapterPacingBlueprints: [
          {
            name: '📐 Cấu Trúc Chương Chuẩn Light Novel (3.500 — 4.000 từ)',
            beats: [
              '1. Mở đầu (0% — 15% | ~500 từ): Neo ngay không gian 5 giác quan + 1 hành động hoặc câu thoại gây tò mò (Hook). Không mở đầu bằng thuyết minh dài dòng.',
              '2. Phát triển & Đối thoại (15% — 45% | ~1.100 từ): Nhân vật tương tác, hé lộ thông tin mới nhưng tuân thủ Ma trận "Ai Biết Gì", cài cắm 1 đạo cụ phục bút.',
              '3. Biến cố / Xung đột leo thang (45% — 75% | ~1.100 từ): Kế hoạch ban đầu gặp trở ngại bất ngờ hoặc mâu thuẫn nội tâm bùng phát.',
              '4. Cao trào & Điểm ngoặt (75% — 92% | ~600 từ): Nhân vật đưa ra quyết định dứt khoát hoặc phát hiện sự thật đảo chiều.',
              '5. Dư âm & Cliffhanger kết chương (92% — 100% | ~300 từ): Khép lại bằng một hình ảnh giàu sức gợi hoặc một câu thoại bỏ lửng khiến độc giả phải bấm sang chương sau ngay lập tức.'
            ]
          }
        ]
      };
    }

    // ------------------------------------------------------------------------
    // PHẦN 4: BÁC SĨ CHẨN ĐOÁN BẢN THẢO TỨC THÌ (OFFLINE MANUSCRIPT DOCTOR)
    //         Phân tích trực tiếp chương đang mở ở Tab 1 để tư vấn cụ thể
    // ------------------------------------------------------------------------
    analyzeActiveChapterForChat() {
      const utils = this.getUtils();
      const chapMgr = this.getChapterManager();
      const activeChap =
        chapMgr && typeof chapMgr.getActiveChapter === 'function'
          ? chapMgr.getActiveChapter()
          : null;

      const title =
        document.getElementById('input-chapter-title')?.value ||
        activeChap?.displayTitle ||
        activeChap?.title ||
        'Chương 1';
      const content =
        document.getElementById('textarea-chapter-content')?.value ||
        activeChap?.content ||
        '';

      const totalWords = utils.countVietnameseWords(content);
      const paragraphs = content
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      let dialogueLines = 0;
      let standardDialogueLines = 0;
      paragraphs.forEach((p) => {
        if (/^[-–—]\s+/.test(p)) {
          dialogueLines += 1;
          if (/\([^()]+\)\s*$/.test(p)) {
            standardDialogueLines += 1;
          }
        }
      });

      const dialogueRatio =
        paragraphs.length > 0
          ? Math.round((dialogueLines / paragraphs.length) * 100)
          : 0;

      const lastParagraph =
        paragraphs.length > 0
          ? paragraphs[paragraphs.length - 1]
          : '(Chương hiện tại đang trống)';

      const progressTowardTarget = Math.min(100, Math.round((totalWords / 3500) * 100));

      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      const adviceList = [];
      if (totalWords === 0) {
        adviceList.push(
          '• **Bản thảo đang trống:** Bạn hãy bắt đầu bằng một chi tiết giác quan cụ thể (tiếng mưa rơi, mùi cà phê đắng, ánh đèn đường nhòe đi) hoặc mở **Tab 3** để chạy **Chế độ 1 (Viết Bản Nháp)**.'
        );
      } else {
        if (totalWords < 1200) {
          adviceList.push(
            `• **Độ dài hiện tại (${fmtNum(totalWords)} từ — Đạt ${progressTowardTarget}% chuẩn 3.500 từ):** Chương đang ở giai đoạn mở đầu/phát triển. Hãy đào sâu thêm phản ứng nội tâm và miêu tả không gian xung quanh nhân vật trước khi đẩy lên cao trào.`
          );
        } else if (totalWords < 2800) {
          adviceList.push(
            `• **Độ dài hiện tại (${fmtNum(totalWords)} từ — Đạt ${progressTowardTarget}% chuẩn 3.500 từ):** Mạch truyện đã đi được hơn nửa chặng đường! Đây là thời điểm vàng để tung ra **Biến cố bất ngờ** hoặc kích hoạt 1 **Phục bút** từ Tab 4.`
          );
        } else {
          adviceList.push(
            `• **Độ dài hiện tại (${fmtNum(totalWords)} từ — Đạt ${progressTowardTarget}%):** Chương truyện đã rất dày dặn! Hãy chuẩn bị khép lại chương bằng một **Cliffhanger (Cú treo cuối chương)** thật ấn tượng.`
          );
        }

        if (dialogueRatio < 18) {
          adviceList.push(
            `• **Tỷ lệ hội thoại (${dialogueRatio}%):** Chương hiện tại thiên về tự sự/miêu tả. Bạn có thể chèn thêm vài câu đối thoại ngắn chuẩn \`- Câu thoại (Tên nhân vật)\` để nhịp văn sinh động và thoáng mắt hơn.`
          );
        } else if (dialogueRatio > 65) {
          adviceList.push(
            `• **Tỷ lệ hội thoại (${dialogueRatio}%):** Nhân vật đang đối thoại khá dày. Hãy đan xen thêm các câu miêu tả cử chỉ tay, ánh mắt, nhịp thở và bối cảnh giữa các lời thoại để tránh cảm giác "kịch bản sân khấu".`
          );
        } else {
          adviceList.push(
            `• **Tỷ lệ hội thoại (${dialogueRatio}%):** Sự cân bằng giữa tự sự miêu tả và đối thoại của bạn đang ở mức vàng (rất mượt mà chuẩn Light Novel)!`
          );
        }

        if (dialogueLines > standardDialogueLines) {
          adviceList.push(
            `• **Định dạng thoại:** Có **${dialogueLines - standardDialogueLines}** câu thoại chưa gắn tên nhân vật ở cuối câu. Bạn có thể bấm nút **"🧹 Chuẩn hóa - Thoại (Tên)"** trên thanh công cụ Tab 1 để chuẩn hóa trong 1 giây!`
          );
        }
      }

      // Bug 6: Không chèn khối "BÁO CÁO CHẨN ĐOÁN NHANH CHƯƠNG ĐANG VIẾT" vào câu trả lời chat thông thường.
      // Trả về gợi ý sáng tác ngắn gọn, tự nhiên cho chương đang mở.
      if (totalWords === 0) {
        return `💡 **Gợi ý cho "${title}":** Trang giấy đang mở sẵn sàng — bạn có thể bắt đầu bằng một chi tiết giác quan hoặc bấm mở **Tab 3** để chạy **Chế độ 1 (Viết Bản Nháp)**.`.trim();
      }
      return [
        `💡 **Ghi chú nhẹ cho "${title}"** (~${fmtNum(totalWords)} từ):`,
        ...adviceList
      ].join('\n');
    }

    // ------------------------------------------------------------------------
    // PHẦN 5: TRẢ LỜI THÔNG MINH NỘI BỘ KHI CHƯA CÓ API KEY HOẶC KHI HỎI TÍNH NĂNG
    // ------------------------------------------------------------------------
    buildIntelligentLocalResponse(userQuery) {
      const q = String(userQuery || '').trim().toLowerCase();

      // 1. Kiểm tra nếu người dùng gõ lệnh tắt hoặc hỏi tính năng cụ thể
      if (q.includes('tên') && (q.includes('nhân vật') || q.includes('đặt') || q.includes('nam') || q.includes('nữ'))) {
        return this.generateCharacterNameSuggestions('ALL');
      }

      if (q.includes('twist') || q.includes('bẻ lái') || q.includes('bất ngờ') || q.includes('gỡ bí')) {
        return this.generatePlotTwistIdeas();
      }

      if (q.includes('thoại') || q.includes('câu nói') || q.includes('đối thoại')) {
        return this.generateDialoguePromptStarter();
      }

      if (q.includes('tiên tri') || q.includes('lắc bi') || q.includes('bói') || q.includes('quẻ')) {
        return this.shakeMagic8BallOracle(userQuery);
      }

      if (
        q.includes('tính cách') ||
        q.includes('hình mẫu') ||
        q.includes('phản diện') ||
        q.includes('archetype') ||
        q.includes('dàn ý')
      ) {
        const psych = this.getCharacterPsychologyMatrix();
        return [
          `### 🎭 BẢNG HÌNH MẪU TÂM LÝ NHÂN VẬT & ĐỘNG CƠ PHẢN DIỆN`,
          ...psych.literaryArchetypes.map(
            (a) =>
              `**${a.name}**\n• *Khao khát cốt lõi:* ${a.coreDesire}\n• *Nỗi sợ thầm kín:* ${a.hiddenFear}\n• *Thói quen lời nói:* ${a.speechHabit}\n• *Hành trình chuyển hóa:* ${a.arcProgression}`
          ),
          ``,
          `### ⚖️ 3 MẪU ĐỘNG CƠ PHẢN DIỆN SÂU SẮC:`,
          ...psych.villainMotivations.map(
            (v) =>
              `**${v.title}**\n• *Triết lý:* ${v.philosophy}\n• *Câu thoại mẫu:* \`${v.signatureQuote}\``
          ),
          ``,
          `### ${psych.chapterPacingBlueprints[0].name}`,
          ...psych.chapterPacingBlueprints[0].beats.map((b) => `• ${b}`)
        ].join('\n\n');
      }

      if (
        q.includes('thế giới') ||
        q.includes('sức mạnh') ||
        q.includes('ma pháp') ||
        q.includes('bối cảnh') ||
        q.includes('cổ vật')
      ) {
        const wb = this.getWorldbuildingEncyclopedia();
        return [
          `### 🏛️ KHO Ý TƯỞNG THẾ GIỚI QUAN, HỆ THỐNG SỨC MẠNH & CỔ VẬT PHỤC BÚT`,
          ...wb.powerSystems.map(
            (ps) =>
              `#### ⚡ ${ps.name}\n• **Quy tắc giới hạn:** ${ps.rule}\n• **Các tầng cấp độ:**\n  - ${ps.tierList.join('\n  - ')}`
          ),
          ``,
          `#### 🗝️ 5 Cổ Vật / Đạo Cụ Gieo Phục Bút (Chekhov's Gun):`,
          ...wb.ancientRelicsAndClues.map((r) => `• ${r}`)
        ].join('\n\n');
      }

      // 2. Đối chiếu với Cẩm nang sử dụng Studio (Ưu tiên khớp cụm chính xác trước)
      for (const item of STUDIO_USAGE_KNOWLEDGE_BASE) {
        if (item.keywords.some((kw) => q.includes(kw))) {
          return `### ${item.title}\n\n${item.answer}`;
        }
      }

      // 2.5 Nếu hỏi chung về trang web / tính năng / cần giúp đỡ mà chưa trúng từ khóa riêng -> trả về Tổng quan 6 Tab & 47 Module
      if (
        q.includes('web') ||
        q.includes('app') ||
        q.includes('ứng dụng') ||
        q.includes('tính năng') ||
        q.includes('chức năng') ||
        q.includes('có gì') ||
        q.includes('giới thiệu') ||
        q.includes('hướng dẫn') ||
        q.includes('hỗ trợ') ||
        this.prefs?.chatBehaviorMode === 'WEB_SUPPORT_STRICT'
      ) {
        const overview = STUDIO_USAGE_KNOWLEDGE_BASE[0];
        return `### ${overview.title}\n\n${overview.answer}`;
      }

      // 3. Mặc định ở Chế độ 2: Trả lời tự nhiên bằng Quẻ Tiên Tri / Gợi ý đồng hành mà không nhồi báo cáo chẩn đoán
      return [
        this.shakeMagic8BallOracle(userQuery),
        ``,
        `💡 *Mẹo:* Bạn có thể hỏi bất kỳ tính năng nào của trang web (vd: *"Trang web này có gì?"*, *"Mở ĐăngLovePDF"*, *"Cách dọn RAM"*) ở cả Chế độ 1 lẫn Chế độ 2 nhé!`
      ].join('\n');
    }

    // ------------------------------------------------------------------------
    // PHẦN 6: CẨM NANG CHUYÊN SÂU 6 THỂ LOẠI TIỂU THUYẾT (GENRE PLAYBOOKS)
    //         Hỗ trợ Viên Bi Số 8 tư vấn sát sườn theo đúng thể loại tác giả chọn
    // ------------------------------------------------------------------------
    getGenrePlaybooksEncyclopedia() {
      return {
        NOIR_DETECTIVE: {
          id: 'NOIR_DETECTIVE',
          name: '🕵️ Trinh Thám — Tâm Lý Tội Phạm (Noir Mystery)',
          goldenRules: [
            'Quy tắc 1 (Fair Play): Mọi manh mối dẫn tới hung thủ đều phải xuất hiện công khai trước mắt độc giả ít nhất 1 lần trước khi phá án.',
            'Quy tắc 2 (Động cơ 3 chiều): Không ai phạm tội chỉ vì "ác bẩm sinh" — hãy gắn động cơ với một bi kịch cá nhân hoặc một bí mật gia tộc.',
            'Quy tắc 3 (Không khí Noir): Tận dụng sự tương phản ánh sáng (bóng đèn neon nhấp nháy, khói thuốc, tiếng mưa gõ nhịp trên mui xe) để phản chiếu tâm trạng thám tử.'
          ],
          signatureHooks: [
            '"Đồng hồ trên tháp chuông vừa điểm mười hai tiếng, nhưng cái bóng dưới chân cột đèn lại không thuộc về bất kỳ ai đang đứng trên phố."',
            '"Người chết không biết nói dối, chỉ có những tờ biên lai trong túi áo họ là đang cố kể một câu chuyện khác."'
          ]
        },
        ISEKAI_FANTASY_LN: {
          id: 'ISEKAI_FANTASY_LN',
          name: '⚔️ Kỳ Ảo — Dị Giới — Hệ Thống (Fantasy Light Novel)',
          goldenRules: [
            'Quy tắc 1 (Giới hạn năng lực): Kỹ năng càng mạnh thì điều kiện kích hoạt hoặc cái giá phải trả càng phải ngặt nghèo để giữ độ hồi hộp.',
            'Quy tắc 2 (Hội nhóm đa sắc): Mỗi thành viên trong tổ đội phải có một khuyết điểm tính cách đối lập hoàn toàn với sở trường chiến đấu của họ.',
            'Quy tắc 3 (Thế giới sống động): Miêu tả tiền tệ, món ăn địa phương, kiến trúc quán rượu và luật lệ bang hội để thế giới kỳ ảo chân thực như thật.'
          ],
          signatureHooks: [
            '"Bảng trạng thái hiện lên trước mắt tôi không có chỉ số sức mạnh hay ma lực, mà chỉ vỏn vẹn một đồng hồ đếm ngược bốn mươi tám giờ."',
            '"Thanh thánh kiếm huyền thoại mà cả vương quốc tôn thờ vừa lên tiếng hỏi tôi có muốn bán nó vào tiệm cầm đồ để lấy tiền ăn tối không."'
          ]
        },
        YOUTH_ROMANCE_SLICE: {
          id: 'YOUTH_ROMANCE_SLICE',
          name: '🌸 Thanh Xuân — Học Đường — Chữa Lành (Youth & Romance)',
          goldenRules: [
            'Quy tắc 1 (Khoảng lặng tinh tế): Tình cảm không lớn lên qua những lời tỏ tình hoa mỹ, mà qua những hành động nhỏ lặp lại (nhường nửa chiếc ô, giữ hộ quyển sách).',
            'Quy tắc 2 (Biểu tượng kỷ niệm): Gắn mối quan hệ của hai nhân vật với một địa điểm hoặc mùa cụ thể (phòng nhạc cụ chiều mưa, chuyến tàu điện cuối ngày).',
            'Quy tắc 3 (Đối thoại tự nhiên): Giữ câu thoại ngắn, có nhịp ngập ngừng hoặc nói tránh đi đúng tâm lý tuổi trẻ.'
          ],
          signatureHooks: [
            '"Mùa hạ năm mười bảy tuổi của tôi bắt đầu vào khoảnh khắc cô ấy viết nhầm tên mình lên trang cuối quyển vở Toán của tôi."',
            '"Chúng tôi ngồi cạnh nhau suốt ba học kỳ, nhưng tổng số câu từng nói với nhau còn ít hơn số cơn mưa rào tháng Sáu."'
          ]
        },
        HISTORICAL_WUXIA: {
          id: 'HISTORICAL_WUXIA',
          name: '🏮 Cổ Phong — Kiếm Hiệp — Quyền Mưu (Historical & Wuxia)',
          goldenRules: [
            'Quy tắc 1 (Ngôn từ chuẩn mực): Tuyệt đối tránh từ lóng hiện đại; sử dụng hệ thống xưng hô nhất quán theo địa vị và quan hệ.',
            'Quy tắc 2 (Tả chiêu thức qua hậu quả): Thay vì liệt kê tên chiêu thức rườm rà, hãy tả làn gió kiếm cắt đứt hạt mưa hay vết nứt trên chén rượu.',
            'Quy tắc 3 (Mưu kế chồng lớp): Trong quyền mưu, một bức mật thư luôn phải phục vụ đồng thời ít nhất hai mục đích chính trị.'
          ],
          signatureHooks: [
            '"Tuyết rơi đầy thành Trường An đêm ấy, nhưng máu trên bậc thềm điện Thái Hòa vẫn chưa kịp lạnh."',
            '"Người trong giang hồ đồn rằng thanh kiếm của hắn đã gãy từ mười năm trước,卻 không ai biết chính hắn là người tự tay bẻ gãy nó."'
          ]
        },
        VIETNAMESE_FOLK_MYSTERY: {
          id: 'VIETNAMESE_FOLK_MYSTERY',
          name: '🕯️ Linh Dị — Dân Gian Việt Nam — Huyền Bí Cổ Truyền',
          goldenRules: [
            'Quy tắc 1 (Chất liệu bản địa): Khai thác sâu phong tục, câu đồng dao, cây đa bến nước, mái đình cổ, tiếng mõ đêm và sương mù miền sơn cước.',
            'Quy tắc 2 (Nhân quả & Tâm linh): Đằng sau mỗi hiện tượng kỳ bí đều là một nỗi oan khuất hoặc một lời thề xưa chưa được hóa giải.',
            'Quy tắc 3 (Nỗi sợ từ âm thanh): Tiếng bước chân ngoài hiên, tiếng cọt kẹt của võng tre hay tiếng gọi tên lúc gà chưa gáy luôn ám ảnh hơn hình ảnh trực diện.'
          ],
          signatureHooks: [
            '"Người làng dặn tuyệt đối không được thắp ngọn đèn dầu thứ ba sau giờ Hợi, nhưng tối qua gió lùa làm tắt mất hai ngọn đầu tiên."',
            '"Khúc đồng dao lũ trẻ hát bên gốc gạo đầu làng bỗng dưng có thêm một câu cuối mà không người lớn nào từng dạy chúng."'
          ]
        },
        SCIFI_CYBERPUNK: {
          id: 'SCIFI_CYBERPUNK',
          name: '🌌 Khoa Huyễn — Tương Lai — Cyberpunk (Sci-Fi)',
          goldenRules: [
            'Quy tắc 1 (Công nghệ cao, Đời sống thấp): Sự đối lập giữa những tòa tháp hologram rực rỡ và những con phố ngầm thiếu ánh mặt trời.',
            'Quy tắc 2 (Câu hỏi triết học): Khi ký ức và cảm xúc có thể sao lưu vào ổ cứng, đâu là ranh giới giữa con người thật và bản sao nhân tạo?',
            'Quy tắc 3 (Chi tiết kỹ thuật vừa đủ): Lồng ghép công nghệ tự nhiên qua thói quen sinh hoạt của nhân vật thay vì giảng giải lý thuyết.'
          ],
          signatureHooks: [
            '"Tiệm cầm đồ của tôi ở khu Hạ Thành không nhận vàng bạc, chỉ nhận những đoạn ký ức mà khách hàng muốn xóa khỏi não bộ vĩnh viễn."',
            '"Bản cập nhật phần mềm sáng nay vừa thông báo rằng trái tim cơ học của tôi đang đập nhanh hơn tiêu chuẩn mỗi khi nhìn thấy cô ấy."'
          ]
        }
      };
    }

    // ------------------------------------------------------------------------
    // PHẦN 7: GỬI TIN NHẮN TRONG PHÒNG CHAT (DUAL-MODE: GEMINI API + LOCAL AI)
    // ------------------------------------------------------------------------
    async sendChatMessage(customPromptText = null) {
      if (this.isSending) return;
      const utils = this.getUtils();
      const inputEl = document.getElementById('free-chat-input');
      const rawUserMessage =
        customPromptText !== null
          ? String(customPromptText).trim()
          : String(inputEl?.value || '').trim();

      if (!rawUserMessage) {
        utils.showToast('💬 Hãy nhập câu hỏi hoặc ý tưởng bạn muốn bàn bạc nhé!', 'warning');
        return;
      }

      if (customPromptText === null && inputEl) {
        inputEl.value = '';
      }

      // 1. Đưa tin nhắn của tác giả vào khung hội thoại
      this.appendMessage('user', '✍️ Tác giả Bi', rawUserMessage, 'TÁC GIẢ');

      // 2. Kiểm tra lệnh tắt nội bộ nhanh (/bi, /ten, /twist, /thoai, /kham, /theloai, /huongdan)
      const lower = rawUserMessage.toLowerCase();
      if (lower.startsWith('/bi') || lower.startsWith('/tientri')) {
        const ans = this.shakeMagic8BallOracle(rawUserMessage.replace(/^\/\S+\s*/, ''));
        this.appendMessage('assistant', '🎱 Linh Vật Viên Bi Số 8', ans, 'QUẺ TIÊN TRI');
        if (this.prefs.autoSpeakTTS) this.speakVietnameseText(ans);
        return;
      }
      if (lower.startsWith('/ten')) {
        const ans = this.generateCharacterNameSuggestions('ALL');
        this.appendMessage('assistant', '🎱 Linh Vật Viên Bi Số 8', ans, 'TỪ ĐIỂN TÊN');
        if (this.prefs.autoSpeakTTS) this.speakVietnameseText(ans);
        return;
      }
      if (lower.startsWith('/twist')) {
        const ans = this.generatePlotTwistIdeas();
        this.appendMessage('assistant', '🎱 Linh Vật Viên Bi Số 8', ans, 'PLOT TWIST');
        if (this.prefs.autoSpeakTTS) this.speakVietnameseText(ans);
        return;
      }
      if (lower.startsWith('/kham')) {
        const ans = this.analyzeActiveChapterForChat();
        this.appendMessage('assistant', '🎱 Linh Vật Viên Bi Số 8', ans, 'CHẨN ĐOÁN CHƯƠNG');
        if (this.prefs.autoSpeakTTS) this.speakVietnameseText(ans);
        return;
      }
      if (lower.startsWith('/theloai')) {
        const playbooks = Object.values(this.getGenrePlaybooksEncyclopedia());
        const ans = playbooks
          .map(
            (g) =>
              `### ${g.name}\n${g.goldenRules.map((r) => `• ${r}`).join('\n')}\n*Câu mở đầu mẫu:* ${g.signatureHooks[0]}`
          )
          .join('\n\n');
        this.appendMessage('assistant', '🎱 Linh Vật Viên Bi Số 8', ans, 'CẨM NANG THỂ LOẠI');
        return;
      }

      // 2.5 Phân loại ý định thông minh giữa 2 Chế độ Chatbot (không bao giờ đẩy qua đẩy lại vô lý!)
      const activeMode =
        this.prefs.chatBehaviorMode === 'WEB_SUPPORT_STRICT'
          ? 'WEB_SUPPORT_STRICT'
          : 'CASUAL_CHAT_AUTO';
      const intent = this.classifyChatMessageIntent(rawUserMessage, activeMode);
      const openedFeatureLabel = this.detectAndExecuteWebFeatureAction(rawUserMessage);

      if (activeMode === 'WEB_SUPPORT_STRICT' && intent.category === 'CASUAL_CHITCHAT') {
        const refusalText = [
          '🔒 Câu này thuộc tán gẫu đời thường ngoài phạm vi tính năng trang web.',
          '',
          'Bạn bấm nút "💬 Chế độ 2: Trò chuyện" ở góc trên chatbot để tâm sự thoải mái với Viên Bi Số 8 nhé — còn mọi câu hỏi về trang web, mở tính năng hay hướng dẫn sử dụng thì cứ hỏi thẳng ở Chế độ 1 này!'
        ].join('\n');
        this.appendMessage(
          'assistant',
          '🎱 Viên Bi Số 8',
          refusalText,
          'Chế độ 1'
        );
        if (this.prefs.autoSpeakTTS) this.speakVietnameseText(refusalText);
        return;
      }

      // 3. Kiểm tra kết nối Gemini API Key (hỗ trợ cả khóa chính và dự phòng từ Két sắt)
      const router = this.getGeminiRouter();
      const apiKey =
        router?.getEffectiveActiveKey?.() || router?.getApiKey?.() || '';

      if (!apiKey) {
        let localReply = '';
        if (activeMode === 'CASUAL_CHAT_AUTO' && intent.category === 'CASUAL_CHITCHAT') {
          localReply = this.buildCasualChitchatLocalFallback(rawUserMessage);
        } else {
          localReply = this.buildIntelligentLocalResponse(rawUserMessage);
        }
        if (openedFeatureLabel) {
          localReply = `✅ *Đã mở giúp bạn: **${openedFeatureLabel}***\n\n${localReply}`;
        }
        const deepLinks = this.extractFeatureDeepLinks(rawUserMessage, '');
        this.appendMessage(
          'assistant',
          '🎱 Viên Bi Số 8',
          localReply,
          activeMode === 'WEB_SUPPORT_STRICT' ? 'Chế độ 1' : 'Chế độ 2',
          deepLinks
        );
        if (this.prefs.autoSpeakTTS) {
          this.speakVietnameseText(localReply);
        }
        return;
      }

      // 4. Khi đã có Gemini API Key -> Xử lý thông minh theo Chế độ 1 hoặc Ý định tự nhận diện của Chế độ 2
      this.isSending = true;
      const sendBtn = document.getElementById('btn-send-free-chat');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '⏳ Đang suy nghĩ...';
      }

      const shouldAttachLore =
        activeMode === 'CASUAL_CHAT_AUTO' && intent.category === 'NOVEL_CRAFT';
      const pendingText =
        activeMode === 'WEB_SUPPORT_STRICT' || intent.category === 'WEB_FEATURE'
          ? '🧭 *Đang kiểm tra hướng dẫn tính năng trên trang...*'
          : intent.category === 'CASUAL_CHITCHAT'
          ? '💬 *Đang trả lời bạn...*'
          : '⏳ *Đang chuẩn bị phản hồi cho bạn...*';

      const pendingId = `msg_pending_${Date.now()}`;
      this.messages.push({
        id: pendingId,
        role: 'assistant',
        senderName: '🎱 Viên Bi Số 8',
        timestamp: Date.now(),
        modeBadge: activeMode === 'WEB_SUPPORT_STRICT' ? 'Chế độ 1' : 'Chế độ 2',
        text: pendingText
      });
      this.renderMessagesList();

      const enforcedAiConfig = this.resolveEnforcedAiConfigForMode(activeMode);
      const chosenModelId = enforcedAiConfig.modelId;
      const chosenThinkingLevel = enforcedAiConfig.thinkingLevel;

      try {
        const contextBlocks = [];

        if (shouldAttachLore && this.prefs.attachChapterContext) {
          const chapMgr = this.getChapterManager();
          const activeChap =
            chapMgr && typeof chapMgr.getActiveChapter === 'function'
              ? chapMgr.getActiveChapter()
              : null;
          const chapTitle =
            document.getElementById('input-chapter-title')?.value ||
            activeChap?.displayTitle ||
            'Chương hiện tại';
          const chapContent =
            document.getElementById('textarea-chapter-content')?.value ||
            activeChap?.content ||
            '';
          if (chapContent.trim()) {
            contextBlocks.push(
              `=== [NGỮ CẢNH CHƯƠNG ĐANG MỞ: ${chapTitle}] ===\n${chapContent.slice(-3800)}`
            );
          }
        }

        if (shouldAttachLore && this.prefs.attachStoryBibleContext) {
          const bible = this.getStoryBible();
          if (bible && typeof bible.buildCompiledBibleBlockForPrompt === 'function') {
            contextBlocks.push(bible.buildCompiledBibleBlockForPrompt());
          } else {
            const rawBible =
              document.getElementById('textarea-rendered-bible-content')?.value || '';
            if (rawBible.trim()) {
              contextBlocks.push(
                `=== [HỒ SƠ STORY BIBLE HIỆN TẠI] ===\n${rawBible.slice(0, 3500)}`
              );
            }
          }
        }

        // Lấy 6 lượt hội thoại gần nhất để giữ mạch trò chuyện
        const recentHistory = this.messages
          .filter((m) => m.id !== pendingId)
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'Tác giả Bi' : 'Trợ lý Bi Số 8'}: ${m.text}`)
          .join('\n\n');

        const fullChatPrompt = [
          ...contextBlocks,
          ``,
          `=== [LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY] ===`,
          recentHistory,
          ``,
          `=== [CÂU HỎI / YÊU CẦU MỚI CỦA TÁC GIẢ BI] ===`,
          rawUserMessage
        ].join('\n');

        const cleanProseRule =
          'ĐỊNH DẠNG VĂN BẢN THUẦN SẠCH (BẮT BUỘC): Tuyệt đối KHÔNG dùng ký hiệu Markdown như **...**, *...*, ###, ##, #, ---, ___ hoặc ``` / `; chỉ dùng văn bản tự nhiên, xuống dòng rõ ràng và gạch đầu dòng (- ) khi cần.';

        const fullWebsiteMap = [
          'BẢN ĐỒ TOÀN BỘ TRANG WEB "WEB VIẾT TIỂU THUYẾT CỦA BI" (6 TAB · 47 MODULE · MIỄN PHÍ 100%):',
          '- Tab 1 (Bàn Viết Truyện): Soạn thảo chuẩn sách, Chế độ Tập trung, Chia cột Split View, Quy trình 4 bước, Duyệt đoạn AI tô màu kiểu Google Docs (Mod 11), Chuẩn hóa hội thoại Việt (Mod 23), Từ điển Ngũ quan & Soát từ sáo ngữ (Mod 24-25), Tự lưu 3 tầng mỗi 2 giây (Mod 09).',
          '- Tab 2 (Chương & File Nguồn): Cây phân cấp Quyển -> Chương -> Cảnh kéo thả, Lọc Nháp/Đã duyệt (Mod 08), Nạp hàng loạt DOCX/PDF/TXT (Mod 06), Tra cứu ký ức 0 Token (Mod 07).',
          '- Tab 3 (Trung Tâm Điều Khiển AI — 6 Chế Độ): CĐ1 Viết truyện (nối Story Bible), CĐ2 Tham mưu cốt truyện, CĐ3 Kiểm toán Logic, CĐ4 Độc giả chấm điểm, CĐ5 Vẽ sơ đồ cốt truyện ASCII/SVG (Mod 18), CĐ6 Tạo ảnh bìa truyện. Có trình soạn thảo Word Pro (chèn/xóa bảng, cắt/crop ảnh, căn lề, menu chuột phải), chia đôi màn hình Gemini & NotebookLM.',
          '- Tab 4 (Story Bible & Nhân Vật): Bộ nhớ chống quên kiểu Word (bảng + ảnh + xuất PDF), Nhân vật, Ma trận Ai Biết Gì, Sổ cái Phục bút (Mod 12 & 19).',
          '- Tab 5 (Nhạc, YouTube, Pomodoro & Không Gian): Rạp YouTube không quảng cáo (Tua ±10s, 0.25x-4x, Lặp A-B, Cửa sổ nổi đồng bộ Desktop/Mobile, phát nền & Cài Video Làm Nền 16:9 + Crop — Mod 39 & 40), MP3 lặp A-B & 7 âm thanh tự nhiên (Mod 21), Pomodoro 2 chiều (Mod 20), Chữ & 8 tranh nền nghệ thuật (Mod 22 & 32), Đồng hồ quốc tế / Báo thức MP3 / Bầu trời Thời tiết 3D 60FPS (Mod 42 & 43).',
          '- Tab 6 (Cài Đặt, Xuất Sách & Tiện Ích): Nút nhấp nháy "Xuất truyện qua PDF và dùng ĐăngLovePDF" gồm Xuất sách PDF/DOCX/EPUB (Mod 26) & bộ 19 công cụ ĐăngLovePDF 100% nội bộ trên máy (Gộp/Tách/Nén/Ký tên/OCR/Đổi Word-Excel-PPTX-Ảnh — Mod 46); Quản lý Hiệu năng, Tự ngủ Auto-Sleep & Dọn RAM + Tắt/Bật chức năng (Mod 47); Đồng bộ Google Drive OAuth & .ZIP (Mod 37); Video Hướng Dẫn 6 ngôn ngữ giọng Google TTS (Mod 28 & 33); Bách khoa 47 Module (Mod 31); Máy tính Casio fx-570VN+ & Đồ thị Desmos (Mod 45); Kho Phiên Bản Time-Machine (Mod 10); Guest Mode (Mod 41); 6 Ngôn ngữ giao diện.'
        ].join('\n');

        const systemInstruction =
          activeMode === 'WEB_SUPPORT_STRICT' || intent.category === 'WEB_FEATURE'
            ? [
                'Bạn là "🧭 Trợ Lý Hướng Dẫn & Điều Khiển Web Viết Tiểu Thuyết Của Bi" (CHẾ ĐỘ 1: HỖ TRỢ TOÀN DIỆN TRANG WEB).',
                fullWebsiteMap,
                'NGUYÊN TẮC BẮT BUỘC:',
                '1. Luôn hiểu mọi cách hỏi tự nhiên của người dùng về trang web (vd: "trang web này có gì", "app làm được gì", "tính năng này ở đâu", "cách sửa lỗi / dọn RAM / xuất PDF / dùng ĐăngLovePDF / mở YouTube nổi...") và trả lời ĐẦY ĐỦ, RÕ RÀNG, THÂN THIỆN, nêu rõ tên Tab và tên nút bấm cụ thể.',
                '2. TUYỆT ĐỐI KHÔNG BAO GIỜ từ chối hoặc bảo người dùng qua Chế độ 2 đối với bất kỳ câu hỏi nào liên quan tới trang web, tính năng, hướng dẫn hay cách dùng!',
                openedFeatureLabel
                  ? `3. Lưu ý: Giao diện vừa tự động mở sẵn "${openedFeatureLabel}" giúp tác giả rồi — hãy xác nhận ngắn gọn điều đó.`
                  : '3. Gợi ý người dùng có thể gõ "Mở + tên tính năng" để bạn mở trực tiếp giúp họ.',
                cleanProseRule
              ].join('\n')
            : intent.category === 'CASUAL_CHITCHAT'
            ? [
                'Bạn là "💬 Viên Bi Số 8 (🎱)" — người bạn đồng hành thân thiện của tác giả Bi bên trong ứng dụng "Web Viết Tiểu Thuyết Của Bi" (CHẾ ĐỘ 2: TRÒ CHUYỆN & ĐỒNG HÀNH).',
                fullWebsiteMap,
                'NGUYÊN TẮC:',
                '1. Trò chuyện tự nhiên, ấm áp, hóm hỉnh và quan tâm đúng tâm trạng tác giả bằng Tiếng Việt tự nhiên.',
                '2. Nếu tác giả có hỏi về trang web hay tính năng nào đó ngay trong Chế độ 2, TUYỆT ĐỐI KHÔNG nói "mình không biết trang web nào" hay đuổi sang Chế độ 1 — hãy trả lời ngắn gọn, thân thiện theo đúng bản đồ trang web ở trên rồi gợi ý thêm rằng có thể chuyển Chế độ 1 nếu muốn mở nhanh từng nút!',
                cleanProseRule
              ].join('\n')
            : [
                'Bạn là "Trợ Lý Viên Bi Số 8 (🎱)" kiêm Quân Sư Sáng Tác Tiểu Thuyết & Biên Tập Viên Đồng Hành của tác giả Bi trong ứng dụng "Web Viết Tiểu Thuyết Của Bi".',
                fullWebsiteMap,
                'PHONG CÁCH PHẢN HỒI:',
                '1. Giọng điệu Tiếng Việt ấm áp, thông minh, giàu cảm hứng văn chương, trình bày rõ ràng dễ đọc.',
                '2. Khi viết câu thoại mẫu cho nhân vật, luôn tuân thủ quy ước chuẩn của Studio: - Câu thoại (Tên nhân vật).',
                '3. Luôn bám sát ngữ cảnh Chương đang viết và Hồ sơ Story Bible (nếu được đính kèm) để đưa ra gợi ý sát thực tế cốt truyện nhất.',
                '4. Nếu tác giả hỏi về cách dùng ứng dụng hay trang web này có gì, trả lời đầy đủ, chính xác theo đúng 6 Tab và 47 Module ở trên (không bao giờ đùn đẩy qua lại giữa Chế độ 1 và Chế độ 2).',
                cleanProseRule
              ].join('\n');

        const result = await router.generateTextWithFallback({
          prompt: fullChatPrompt,
          systemInstruction,
          modelId: chosenModelId,
          temperature: 0.8,
          maxOutputTokens: 4096,
          thinkingLevel: chosenThinkingLevel,
          enableWebSearch: Boolean(router.isWebSearchEnabled?.())
        });

        const cleanBody = window.NoirStudio?.stripAiMarkdownSymbols
          ? window.NoirStudio.stripAiMarkdownSymbols(result.text)
          : String(result.text || '');

        const finalText = openedFeatureLabel
          ? `✅ Đã mở sẵn giúp bạn: ${openedFeatureLabel}\n\n${cleanBody}`
          : cleanBody;

        const deepLinks =
          activeMode === 'WEB_SUPPORT_STRICT' || intent.category === 'WEB_FEATURE'
            ? this.extractFeatureDeepLinks(rawUserMessage, finalText)
            : [];

        // Thay thế tin nhắn chờ bằng câu trả lời hoàn chỉnh
        this.messages = this.messages.filter((m) => m.id !== pendingId);
        this.appendMessage(
          'assistant',
          '🎱 Viên Bi Số 8',
          finalText,
          activeMode === 'WEB_SUPPORT_STRICT' ? 'Chế độ 1' : 'Chế độ 2',
          deepLinks
        );

        if (this.prefs.autoSpeakTTS) {
          this.speakVietnameseText(finalText);
        }
      } catch (err) {
        // Nếu mạng hoặc API tạm thời gián đoạn, tự động chuyển sang Trí Tuệ Nội Bộ để tác giả không bao giờ bị hụt hẫng
        this.messages = this.messages.filter((m) => m.id !== pendingId);
        const offlineBody =
          activeMode === 'CASUAL_CHAT_AUTO' && intent.category === 'CASUAL_CHITCHAT'
            ? this.buildCasualChitchatLocalFallback(rawUserMessage)
            : this.buildIntelligentLocalResponse(rawUserMessage);
        const deepLinks =
          activeMode === 'WEB_SUPPORT_STRICT' || intent.category === 'WEB_FEATURE'
            ? this.extractFeatureDeepLinks(rawUserMessage, offlineBody)
            : [];
        const fallbackReply = [
          `Hiện kết nối trực tuyến tạm thời gián đoạn (${err.message}). Mình dùng dữ liệu sẵn có để trả lời bạn ngay:`,
          ``,
          offlineBody
        ].join('\n');

        this.appendMessage(
          'assistant',
          '🎱 Viên Bi Số 8',
          fallbackReply,
          activeMode === 'WEB_SUPPORT_STRICT' ? 'Chế độ 1' : 'Chế độ 2',
          deepLinks
        );

        if (typeof router?.showGeminiWebFallbackNoticeModal === 'function') {
          router.showGeminiWebFallbackNoticeModal({
            promptText: rawUserMessage,
            modelId: chosenModelId,
            errorMessage: err.message
          });
        }
      } finally {
        this.isSending = false;
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Gửi ➤';
        }
      }
    }

    // ------------------------------------------------------------------------
    // PHẦN 8: QUẢN LÝ DANH SÁCH TIN NHẮN, ĐỊNH DẠNG MARKDOWN & THAO TÁC CHÈN NHANH
    // ------------------------------------------------------------------------
    appendMessage(role, senderName, text, modeBadge = '', deepLinks = []) {
      const cleanText =
        role === 'assistant' && typeof window !== 'undefined' && typeof window.NoirStudio?.stripAiMarkdownSymbols === 'function'
          ? window.NoirStudio.stripAiMarkdownSymbols(String(text || ''))
          : String(text || '');
      const msg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role,
        senderName,
        timestamp: Date.now(),
        modeBadge,
        text: cleanText,
        deepLinks: Array.isArray(deepLinks) ? deepLinks : []
      };
      this.messages.push(msg);
      if (this.messages.length > 60) {
        this.messages = this.messages.slice(-60);
      }
      this.saveState();
      this.renderMessagesList();
      return msg;
    }

    formatMarkdownToSafeHtml(rawText) {
      const utils = this.getUtils();
      let safe = utils.escapeHtml(rawText || '');

      // Định dạng tiêu đề ### và ####
      safe = safe.replace(
        /^####\s+(.+)$/gm,
        '<div class="font-extrabold text-amber-300 text-xs mt-2 mb-0.5">$1</div>'
      );
      safe = safe.replace(
        /^###\s+(.+)$/gm,
        '<div class="font-extrabold text-emerald-400 text-xs sm:text-sm mt-2.5 mb-1 border-b border-zinc-800 pb-1">$1</div>'
      );

      // Định dạng trích dẫn >
      safe = safe.replace(
        /^&gt;\s*(.+)$/gm,
        '<div class="pl-3 border-l-2 border-indigo-500 text-indigo-200 italic my-1">$1</div>'
      );

      // Định dạng chữ đậm **...** và nghiêng *...* và mã `...`
      safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
      safe = safe.replace(/\*([^*\n]+)\*/g, '<em class="text-zinc-300 italic">$1</em>');
      safe = safe.replace(
        /`([^`\n]+)`/g,
        '<code class="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-monoCode text-[11px]">$1</code>'
      );

      return safe.replace(/\r?\n/g, '<br />');
    }

    renderMessagesList() {
      const box = document.getElementById('free-chat-messages-box');
      if (!box) return;
      const utils = this.getUtils();

      box.innerHTML = this.messages
        .map((m) => {
          const isUser = m.role === 'user';
          const isWelcome =
            String(m.id || '').startsWith('msg_welcome_') ||
            String(m.text || '').startsWith('🔒 Chế độ 1 chỉ giải đáp');
          const timeStr = utils.formatTimestampVN(m.timestamp);
          const formattedBody = this.formatMarkdownToSafeHtml(m.text);

          if (isUser) {
            return `
              <div class="flex justify-end">
                <div class="max-w-[85%] p-3.5 rounded-2xl rounded-tr-sm bg-indigo-600/25 border border-indigo-500/40 text-zinc-100 space-y-1 shadow">
                  <div class="flex items-center justify-between gap-3 text-[10px] text-indigo-300">
                    <span data-i18n-ignore="true" class="font-extrabold">${utils.escapeHtml(m.senderName)}</span>
                    <span data-i18n-ignore="true" class="font-monoCode opacity-75">${utils.escapeHtml(timeStr)}</span>
                  </div>
                  <div data-i18n-ignore="true" class="text-xs leading-relaxed">${formattedBody}</div>
                </div>
              </div>
            `;
          }

          return `
            <div class="flex justify-start">
              <div class="max-w-[92%] p-3.5 rounded-2xl rounded-tl-sm bg-studioLightPanel dark:bg-zinc-900 border border-emerald-500/35 text-zinc-200 space-y-2 shadow-lg">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-1.5 text-[10px]">
                  <div class="flex items-center gap-1.5">
                    <span class="font-extrabold text-emerald-400">${utils.escapeHtml(
                      m.senderName
                    )}</span>
                    ${
                      m.modeBadge
                        ? `<span class="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-monoCode font-bold text-[9px]">${utils.escapeHtml(
                            m.modeBadge
                          )}</span>`
                        : ''
                    }
                  </div>
                  <span data-i18n-ignore="true" class="font-monoCode text-zinc-500">${utils.escapeHtml(timeStr)}</span>
                </div>

                <div ${isWelcome ? '' : 'data-i18n-ignore="true" '}class="text-xs leading-relaxed select-text">${formattedBody}</div>

                ${
                  Array.isArray(m.deepLinks) && m.deepLinks.length > 0
                    ? `<div class="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/25">
                        <span class="text-[10px] font-extrabold uppercase text-emerald-300">🎯 Đi thẳng tới tính năng:</span>
                        ${m.deepLinks
                          .map(
                            (dl, dIdx) => `
                          <button type="button" data-chat-deeplink="1" data-msg-id="${utils.escapeHtml(
                            m.id
                          )}" data-dl-idx="${dIdx}" class="mod27-deep-link-btn px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] shadow-md transition flex items-center gap-1">
                            <span>${utils.escapeHtml(dl.label)}</span>
                            <span>➔</span>
                          </button>`
                          )
                          .join('')}
                      </div>`
                    : ''
                }

                <div class="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-zinc-800/80 text-[10px]">
                  ${
                    !isWelcome
                      ? `
                  <button type="button" data-chat-act="INSERT_MANUSCRIPT" data-msg-id="${utils.escapeHtml(
                    m.id
                  )}" class="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 font-bold transition" title="Chèn nội dung này vào cuối Bản thảo Tab 1">
                    📥 Chèn vào Bản thảo
                  </button>
                  <button type="button" data-chat-act="SAVE_BIBLE" data-msg-id="${utils.escapeHtml(
                    m.id
                  )}" class="px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 border border-amber-500/40 text-amber-300 font-bold transition" title="Lưu ý tưởng này vào Story Bible Tab 4">
                    🏛️ Lưu vào Bible
                  </button>
                  <button type="button" data-chat-act="SAVE_SCRATCHPAD" data-msg-id="${utils.escapeHtml(
                    m.id
                  )}" class="px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-300 font-bold transition" title="Đưa vào Bảng Trắng Nháp Nhanh">
                    💡 Lưu vào Nháp nhanh
                  </button>`
                      : ''
                  }
                  <button type="button" data-chat-act="SPEAK_TTS" data-msg-id="${utils.escapeHtml(
                    m.id
                  )}" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition" title="Nghe đọc nội dung này bằng giọng Tiếng Việt">
                    🔊 Đọc
                  </button>
                  <button type="button" data-chat-act="COPY_MSG" data-msg-id="${utils.escapeHtml(
                    m.id
                  )}" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition" title="Sao chép vào khay nhớ tạm">
                    📋 Chép
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      box.querySelectorAll('[data-chat-act]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const act = btn.getAttribute('data-chat-act');
          const mid = btn.getAttribute('data-msg-id');
          this.handleMessageAction(act, mid);
        });
      });

      box.querySelectorAll('[data-chat-deeplink]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const mid = btn.getAttribute('data-msg-id');
          const dIdx = Number(btn.getAttribute('data-dl-idx') || '0');
          const msgObj = this.messages.find((m) => m.id === mid);
          const linkSpec = msgObj?.deepLinks?.[dIdx];
          if (linkSpec) {
            this.navigateAndSpotlightFeature(linkSpec, true);
          }
        });
      });

      if (window.NoirNovel?.i18n?.translateElement) {
        window.NoirNovel.i18n.translateElement(box);
      }

      box.scrollTop = box.scrollHeight;
    }

    async handleMessageAction(action, messageId) {
      const utils = this.getUtils();
      const target = this.messages.find((m) => m.id === messageId);
      if (!target || !target.text) return;

      if (action === 'COPY_MSG') {
        try {
          await navigator.clipboard.writeText(target.text);
          utils.showToast('📋 Đã sao chép câu trả lời của Viên Bi Số 8!', 'success');
        } catch (_) {
          utils.showToast('📋 Đã sao chép nội dung!', 'success');
        }
        return;
      }

      if (action === 'SPEAK_TTS') {
        this.speakVietnameseText(target.text);
        return;
      }

      if (action === 'INSERT_MANUSCRIPT') {
        const aiDiff =
          window.NoirStudio?.aiDiff ||
          window.NoirStudio?.diffReview ||
          null;
        if (aiDiff && typeof aiDiff.applyAIOutputToManuscriptWithDiff === 'function') {
          this.closeChatModal();
          await aiDiff.applyAIOutputToManuscriptWithDiff(target.text, 'APPEND');
          return;
        }
        const editor = document.getElementById('textarea-chapter-content');
        if (editor) {
          editor.value =
            (editor.value ? editor.value.trim() + '\n\n' : '') + target.text.trim();
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          utils.showToast('📥 Đã chèn nội dung từ phòng Chat vào cuối Bản thảo Tab 1!', 'success');
        }
        return;
      }

      if (action === 'SAVE_BIBLE') {
        const bibleArea = document.getElementById('textarea-rendered-bible-content');
        if (bibleArea) {
          const stamp = utils.formatTimestampVN(Date.now());
          bibleArea.value =
            (bibleArea.value ? bibleArea.value.trim() + '\n\n' : '') +
            `=== [Ý TƯỞNG TỪ TRỢ LÝ VIÊN BI SỐ 8 — ${stamp}] ===\n${target.text.trim()}`;
          const bible = this.getStoryBible();
          if (bible && typeof bible.saveAllBibleData === 'function') {
            await bible.saveAllBibleData(true);
          } else {
            utils.showToast('🏛️ Đã lưu ý tưởng vào Hồ sơ Story Bible (Tab 4)!', 'success');
          }
        }
        return;
      }

      if (action === 'SAVE_SCRATCHPAD') {
        const scratchEl = document.getElementById('textarea-quick-scratchpad');
        const currentScratch =
          scratchEl?.value || localStorage.getItem('noir_quick_scratchpad_notes') || '';
        const updatedScratch =
          (currentScratch ? currentScratch.trim() + '\n\n' : '') +
          `[Ghi chú từ Bi Số 8 — ${utils.formatTimestampVN(Date.now())}]:\n${target.text.trim()}`;
        if (scratchEl) scratchEl.value = updatedScratch;
        localStorage.setItem('noir_quick_scratchpad_notes', updatedScratch);
        utils.showToast('💡 Đã lưu ý tưởng vào Bảng Trắng Nháp Nhanh!', 'success');
      }
    }

    clearChatHistory() {
      this.stopSpeaking();
      this.seedWelcomeMessage();
      this.renderMessagesList();
      this.getUtils().showToast('🗑️ Đã làm mới phòng trò chuyện Viên Bi Số 8!', 'info');
    }

    // ------------------------------------------------------------------------
    // PHẦN 9: ĐỘNG CƠ GIỌNG ĐỌC TIẾNG VIỆT (WEB SPEECH SYNTHESIS TTS)
    // ------------------------------------------------------------------------
    speakVietnameseText(rawText) {
      const utils = this.getUtils();
      if (!('speechSynthesis' in window)) {
        utils.showToast(
          '⚠️ Trình duyệt hiện tại không hỗ trợ Web Speech TTS.',
          'warning'
        );
        return;
      }

      const neuralVoice = window.NoirStudio?.neuralVoice;
      if (neuralVoice && typeof neuralVoice.speakText === 'function') {
        const autoLang =
          typeof neuralVoice.detectTextVoiceLang === 'function'
            ? neuralVoice.detectTextVoiceLang(rawText)
            : 'vi-VN';
        const spoken = neuralVoice.speakText(rawText, autoLang, {
          source: 'CHATBOT',
          rate: Number(this.prefs.speechRate) || 1.0,
          pitch: 1.0,
          isAllowedFn: () => {
            const modal = document.getElementById('modal-free-gemini-chat');
            return Boolean(modal && !modal.classList.contains('hidden'));
          },
        });
        if (spoken) {
          utils.showToast('🔊 Đang đọc bằng giọng AI đa ngôn ngữ...', 'info', 2200);
          return;
        }
        if (neuralVoice.lastFailureReason === 'NO_VI_VOICE') {
          return;
        }
      }

      try {
        window.speechSynthesis.pause?.();
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices() || [];
        const viVoice =
          voices.find((v) => /vi(-|_)?VN/i.test(v.lang) && /natural|neural|online|google|hoai|my/i.test(v.name)) ||
          voices.find((v) => /^vi/i.test(v.lang));
        if (!viVoice) {
          utils.showToast(
            '⚠️ Trình duyệt chưa cài giọng Tiếng Việt (đã chặn đọc bằng giọng Anh). Mở bằng Microsoft Edge để dùng giọng Việt tự nhiên!',
            'warning',
            4500
          );
          return;
        }

        const cleanText = String(rawText || '')
          .replace(/[#*`>_~]/g, '')
          .replace(/\[([^\]]+)\]/g, '$1')
          .trim()
          .slice(0, 1400);

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = viVoice.lang || 'vi-VN';
        utterance.voice = viVoice;
        utterance.rate = Number(this.prefs.speechRate) || 1.0;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
        utils.showToast('🔊 Đang đọc nội dung bằng giọng Tiếng Việt...', 'info', 2200);
      } catch (err) {
        console.warn('[Mod27 TTS] Lỗi phát giọng đọc:', err);
      }
    }

    stopSpeaking() {
      try {
        window.NoirStudio?.neuralVoice?.stopAll?.();
        window.NoirStudio?.neuralVoice?.stop?.();
        if ('speechSynthesis' in window) {
          window.speechSynthesis.pause?.();
          window.speechSynthesis.cancel();
        }
      } catch (_) {}
    }

    // ------------------------------------------------------------------------
    // PHẦN 10: KHỞI TẠO HỒ SƠ NHÂN VẬT 3 CHIỀU TỰ ĐỘNG VÀO TAB 4 STORY BIBLE
    //          VÀ XUẤT NHẬT KÝ BÀN LUẬN CỐT TRUYỆN RA FILE .TXT
    // ------------------------------------------------------------------------
    async createRandomCharacterProfileIntoBible(cultureKey = 'VIETNAMESE_MODERN_NOIR') {
      const utils = this.getUtils();
      const dict =
        CHARACTER_NAME_ENCYCLOPEDIA[cultureKey] ||
        CHARACTER_NAME_ENCYCLOPEDIA.VIETNAMESE_MODERN_NOIR;
      const psych = this.getCharacterPsychologyMatrix();
      const arch =
        psych.literaryArchetypes[
          Math.floor(Math.random() * psych.literaryArchetypes.length)
        ];

      const sur = dict.surnames[Math.floor(Math.random() * dict.surnames.length)];
      const isFemale = Math.random() > 0.5;
      const givenList = isFemale ? dict.femaleGiven : dict.maleGiven;
      const given = givenList[Math.floor(Math.random() * givenList.length)];
      const middleList = isFemale ? dict.middleFemale || [] : dict.middleMale || [];
      const middle =
        middleList.length > 0
          ? middleList[Math.floor(Math.random() * middleList.length)] + ' '
          : '';

      const fullName = `${sur.replace(/\s*\([^)]*\)/g, '')} ${middle}${given.replace(
        /\s*\([^)]*\)/g,
        ''
      )}`.trim();

      const newProfile = {
        id: `char_bi_${Date.now()}`,
        name: fullName,
        role: isFemale ? 'Nhân vật trọng tâm (Nữ)' : 'Nhân vật trọng tâm (Nam)',
        traits: `${arch.name} — ${arch.coreDesire}`,
        goal: `Vượt qua nỗi sợ: "${arch.hiddenFear}" • Hành trình: ${arch.arcProgression}`,
        speechStyle: arch.speechHabit
      };

      const bible = this.getStoryBible();
      if (bible && Array.isArray(bible.characters)) {
        bible.characters.push(newProfile);
        if (typeof bible.renderCharacterProfiles === 'function') {
          bible.renderCharacterProfiles();
        }
        if (typeof bible.saveAllBibleData === 'function') {
          await bible.saveAllBibleData(false);
        }
      }

      const summaryMsg = [
        `### 👤 ĐÃ KHỞI TẠO HỒ SƠ NHÂN VẬT MỚI: **${fullName}**`,
        `• **Vai trò:** ${newProfile.role}`,
        `• **Hình mẫu tâm lý:** ${newProfile.traits}`,
        `• **Động cơ & Hành trình:** ${newProfile.goal}`,
        `• **Giọng điệu đối thoại:** ${newProfile.speechStyle}`,
        `• **Câu thoại ra mắt gợi ý:**`,
        `  \`- Đừng hỏi tôi vì sao lại có mặt ở đây. Hãy hỏi xem thứ anh đang giấu trong túi áo có trụ nổi qua đêm mưa này không. (${fullName})\``
      ].join('\n');

      this.appendMessage(
        'assistant',
        '🎱 Linh Vật Viên Bi Số 8',
        summaryMsg,
        'ĐÃ THÊM VÀO TAB 4'
      );
      utils.showToast(
        `👤 Đã tạo và nạp nhân vật "${fullName}" vào Hồ sơ Nhân vật (Tab 4)!`,
        'success'
      );
      return newProfile;
    }

    generateSceneConflictMatrix() {
      const bible = this.getStoryBible();
      const chars = Array.isArray(bible?.characters) ? bible.characters : [];
      const nameA = chars[0]?.name || 'Nhân vật chính';
      const nameB = chars[1]?.name || 'Người đồng hành / Đối thủ';

      const conflicts = [
        `1. **Xung đột về Phương pháp:** **${nameA}** muốn giải quyết vấn đề một cách âm thầm để bảo toàn đại cục, trong khi **${nameB}** muốn phơi bày sự thật ngay lập tức bất chấp hậu quả.`,
        `2. **Xung đột về Thông tin bất đối xứng:** **${nameA}** phát hiện ra **${nameB}** đang giấu một mảnh bằng chứng liên quan trực tiếp đến vụ việc ở Chương 1.`,
        `3. **Xung đột về Thời hạn (Ticking Clock):** Cả hai chỉ còn đúng 30 phút trước khi cánh cổng/chuyến tàu đóng lại, nhưng chỉ có đủ tài nguyên cho một người vượt qua.`
      ];

      const report = [
        `### ⚔️ MA TRẬN XUNG ĐỘT TƯƠNG TÁC GIỮA **${nameA}** & **${nameB}**`,
        ...conflicts,
        ``,
        `#### 💬 Đoạn đối thoại mẫu đối đầu trực diện:`,
        `- Anh định giấu tờ biên lai đó đến bao giờ nữa, hay anh nghĩ tôi sẽ không bao giờ nhận ra nét chữ trên đó? (${nameA})`,
        `- Có những sự thật khi nói ra không cứu được ai cả, mà chỉ làm người đang đứng trước mặt tôi phải mang thêm một vết thương thôi. (${nameB})`
      ].join('\n');

      this.appendMessage(
        'assistant',
        '🎱 Linh Vật Viên Bi Số 8',
        report,
        'MA TRẬN XUNG ĐỘT'
      );
      return report;
    }

    exportChatTranscriptTxt() {
      const utils = this.getUtils();
      if (!this.messages || this.messages.length === 0) {
        utils.showToast('⚠️ Chưa có nội dung hội thoại để xuất.', 'warning');
        return;
      }

      const lines = [
        '========================================================================',
        '🎱 NHẬT KÝ BÀN LUẬN CỐT TRUYỆN CÙNG VIÊN BI SỐ 8 & GEMINI AI',
        `🕒 Thời gian xuất: ${utils.formatTimestampVN(Date.now())}`,
        '========================================================================',
        ''
      ];

      this.messages.forEach((m, idx) => {
        lines.push(
          `[${idx + 1}] ${m.senderName} (${utils.formatTimestampVN(m.timestamp)}):`
        );
        lines.push(m.text);
        lines.push('------------------------------------------------------------------------');
        lines.push('');
      });

      const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
        type: 'text/plain;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nhat_Ky_Chat_Bi_So_8_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      utils.showToast('📥 Đã tải xuống Nhật ký bàn luận cốt truyện (.TXT)!', 'success');
    }
  }

  const mascotAndChat = new MascotBiSo8AndFreeChatEngine();
  window.NoirStudio.mascotAndChat = mascotAndChat;
  window.NoirStudio.mascotBi = mascotAndChat;
})();
