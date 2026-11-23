/**
 * ============================================================================
 * ✍️ WEB VIẾT TIỂU THUYẾT CỦA BI — MODULE 16 (BATCH 4)
 * TÊN FILE: mod16_master_prompt_synthesizer_two_step.js
 * ============================================================================
 * ĐỘNG CƠ TỔNG HỢP PROMPT TỔNG 2 BƯỚC & THỰC THI VIẾT TIỂU THUYẾT CHÍNH THỨC
 * (MasterPromptSynthesizerAndExecutionEngine — v36.0 SUPREME EDITION)
 *
 * Thiết kế bởi Kiến trúc sư Phần mềm 30 năm kinh nghiệm:
 * 1. Khắc phục triệt để lỗi "bắt nhập lại câu lệnh / báo trống câu lệnh giả":
 *    - Tự động đọc và đồng bộ thời gian thực từ #s18-fullscreen-prompt-textarea,
 *      #mode5-prompt-input, #textarea-chapter-beats, localStorage, lịch sử lệnh
 *      và beats của chương đang mở.
 *    - Không bao giờ chặn tác giả bằng lỗi "Vui lòng nhập câu lệnh" khi tác giả
 *      đã gõ nội dung ở bất kỳ ô nào hoặc khi đã có mốc phân cảnh / cốt truyện!
 * 2. Thực thi quy trình 2 bước chuẩn xác theo yêu cầu của tác giả:
 *    - Bước 1 (#btn-run-master-prompt-synthesis trong #modal-fullscreen-ai-command):
 *      Hiển thị màn hình chờ (#global-ai-blocking-loader), kết nối 100% Story Bible
 *      + Hồ sơ nhân vật + Ma trận Ai Biết Gì + Sổ cái Phục bút + Từ cấm sáo rỗng
 *      + Mốc chuyển cảnh / Đổi POV + Ký ức chống quên BM25 RAG + Câu lệnh tác giả
 *      thành "Prompt Tổng Hợp Chính Thức", rồi mở #modal-confirm-synthesized-prompt.
 *    - Bước 2 (#modal-confirm-synthesized-prompt):
 *      Cho phép tác giả kiểm tra / chỉnh sửa trực tiếp #textarea-synthesized-master-prompt,
 *      chọn lại mô hình AI lần thứ 2 tại #confirm-modal-model-select kèm khuyến cáo
 *      dùng từ Gemini Flash trở lên (Gemini 3.8 Flash, Gemini 3.1 Pro, Gemini 4 Argon)
 *      thay vì Flash-Lite để văn phong giàu cảm xúc nhất, và bấm
 *      #btn-execute-official-novel-prompt để chạy chính thức!
 * 3. Tích hợp Bộ Kiểm Định Ngữ Cảnh Trước Chuyến Bay (Pre-Flight Epistemic &
 *    Continuity Validator), Bộ Phân Bổ Ngân Sách Ngữ Cảnh (Context Budget Optimizer),
 *    Kho Mẫu Lệnh Văn Học (Literary Command Templates), và Bộ Chuẩn Hóa Đầu Ra
 *    Tiểu Thuyết Tiếng Việt.
 * ============================================================================
 */
(function () {
  'use strict';

  window.NoirStudio = window.NoirStudio || {};

  // ==========================================================================
  // PHẦN 1: DANH MỤC MẪU CÂU LỆNH SÁNG TÁC & CẤU HÌNH VĂN PHONG CHUYÊN SÂU
  // ==========================================================================
  const LITERARY_COMMAND_PRESETS = [
    {
      id: 'preset_opening_atmosphere',
      category: 'OPENING',
      label: '🌧️ Mở đầu chương: Dựng bầu không khí & Gieo mầm căng thẳng',
      summary: 'Mở màn chương mới bằng miêu tả đa giác quan, khắc họa nội tâm nhân vật chính và cài cắm chi tiết bất thường đầu tiên.',
      templateText: [
        'Hãy viết phần mở đầu cho chương này với nhịp điệu chậm rãi nhưng ẩn chứa sự bất an ngầm:',
        '1. Khắc họa không gian bối cảnh qua ít nhất 3 giác quan (ánh sáng/bóng tối, âm thanh vọng lại, mùi vị hoặc xúc giác lạnh lẽo).',
        '2. Đi sâu vào dòng suy nghĩ và trạng thái tâm lý hiện tại của nhân vật góc nhìn (POV) sau sự kiện ở chương trước.',
        '3. Cài cắm một chi tiết bất thường nhỏ nhưng đắt giá để dẫn dắt tự nhiên vào Mốc phân cảnh #1.',
        '4. Tuyệt đối tránh lối kể lể tóm tắt; hãy thể hiện cảm xúc qua hành động vô thức, nhịp thở và đối thoại hàm súc.'
      ].join('\n')
    },
    {
      id: 'preset_mind_game_dialogue',
      category: 'DIALOGUE',
      label: '♟️ Đối thoại đấu trí: Ẩn ý ngầm & Thăm dò thông tin',
      summary: 'Triển khai màn đối thoại căng thẳng giữa các nhân vật, tuân thủ nghiêm ngặt Ma trận Ai Biết Gì.',
      templateText: [
        'Hãy triển khai phân cảnh đối thoại đấu trí sâu sắc giữa các nhân vật trong cảnh này:',
        '1. Mọi câu thoại bắt buộc trình bày theo chuẩn: "- Câu thoại (Tên nhân vật)".',
        '2. Mỗi câu nói đều có lớp nghĩa bề mặt và ý đồ thăm dò, che giấu hoặc dẫn dụ ở tầng sâu.',
        '3. Xen kẽ giữa các câu thoại là miêu tả vi biểu cảm (ánh mắt thoáng dừng lại, ngón tay gõ nhẹ, nhịp ngắt quãng trước khi trả lời).',
        '4. Tuân thủ tuyệt đối Ma trận Ai Biết Gì: Nhân vật chưa biết bí mật thì không được nói hớ; nhân vật đang nắm bí mật chỉ tung hỏa mù vừa đủ.'
      ].join('\n')
    },
    {
      id: 'preset_climax_revelation',
      category: 'CLIMAX',
      label: '⚡ Cao trào & Lật mở sự thật: Bùng nổ cảm xúc & Thu hồi phục bút',
      summary: 'Đẩy xung đột lên đỉnh điểm, kích hoạt hoặc thu hồi phục bút đã gieo từ các chương trước.',
      templateText: [
        'Hãy viết phân cảnh cao trào của chương với sức nặng tâm lý và kịch tính cao nhất:',
        '1. Đẩy nhịp văn nhanh, dồn dập ở các đoạn hành động/phát hiện, nhưng lắng lại thật sâu ở khoảnh khắc nhân vật nhận ra sự thật.',
        '2. Kết nối chặt chẽ với các Phục bút (Chekhov\'s Gun) đã gieo trong Story Bible để màn lật mở vừa bất ngờ vừa hợp lý 100%.',
        '3. Miêu tả rõ sự sụp đổ hoặc chuyển biến nhận thức của nhân vật góc nhìn (POV) mà không dùng bất kỳ cụm từ sáo rỗng nào.',
        '4. Khép lại cao trào bằng một dư âm ám ảnh hoặc câu hỏi mở dẫn sang biến cố tiếp theo.'
      ].join('\n')
    },
    {
      id: 'preset_pov_transition_bridge',
      category: 'TRANSITION',
      label: '🎬 Chuyển cảnh & Đổi góc nhìn (POV): Mượt mà & Đổi tông giọng',
      summary: 'Thực hiện chuyển cảnh tự nhiên theo đúng danh sách Mốc chuyển phân cảnh và thay đổi màu sắc tâm lý theo nhân vật POV mới.',
      templateText: [
        'Hãy triển khai chương văn tuân thủ chính xác từng Mốc chuyển phân cảnh và Đổi góc nhìn (POV) đã thiết lập:',
        '1. Tại mỗi điểm chuyển cảnh, tạo một câu văn hoặc hình ảnh chuyển tiếp (visual/thematic bridge) để mạch đọc liền lạc.',
        '2. Khi đổi sang góc nhìn (POV) của nhân vật khác, hãy thay đổi rõ rệt cách quan sát thế giới, từ vựng nội tâm và định kiến riêng của nhân vật đó.',
        '3. Giữ nguyên tính nhất quán của dòng thời gian và vị trí địa lý giữa các cảnh song song hoặc nối tiếp.'
      ].join('\n')
    },
    {
      id: 'preset_psychological_introspection',
      category: 'PSYCHOLOGY',
      label: '🪞 Độc thoại nội tâm & Giằng xé đạo đức (Noir Psychological)',
      summary: 'Đào sâu vào vết thương tâm lý, ký ức ám ảnh và sự giằng xé trước một lựa chọn sinh tử.',
      templateText: [
        'Hãy tập trung khắc họa chiều sâu tâm lý và sự giằng xé nội tâm của nhân vật trong phân cảnh này:',
        '1. Sử dụng hình ảnh ẩn dụ gắn liền với quá khứ hoặc nỗi ám ảnh riêng của nhân vật thay vì gọi tên cảm xúc trực tiếp.',
        '2. Cho thấy sự mâu thuẫn giữa lý trí lạnh lùng và bản năng cảm xúc qua từng cử chỉ nhỏ nhặt.',
        '3. Dẫn dắt nhân vật đi đến một quyết định quan trọng làm thay đổi cục diện mối quan hệ hoặc cốt truyện.'
      ].join('\n')
    },
    {
      id: 'preset_investigative_deduction',
      category: 'MYSTERY',
      label: '🔍 Khám nghiệm hiện trường & Suy luận logic từng bước',
      summary: 'Dành cho phân cảnh tìm kiếm manh mối, lắp ghép dữ kiện và suy luận chặt chẽ.',
      templateText: [
        'Hãy viết phân cảnh quan sát hiện trường và suy luận logic một cách tỉ mỉ, sắc bén:',
        '1. Miêu tả chi tiết các dấu vết vật lý trong không gian theo trình tự quan sát thực tế của nhân vật.',
        '2. Trình bày quá trình loại trừ giả thuyết sai và kết nối các manh mối cũ (từ các chương đã duyệt) với manh mối mới vừa phát hiện.',
        '3. Đảm bảo người đọc có thể theo dõi từng mắt xích suy luận một cách thuyết phục, không nhảy cóc vô lý.'
      ].join('\n')
    },
    {
      id: 'preset_cliffhanger_ending',
      category: 'ENDING',
      label: '🪝 Kết chương gợi mở (Cliffhanger): Dư vị ám ảnh & Cuốn hút',
      summary: 'Khép lại chương bằng một phát hiện bất ngờ, một câu nói bỏ lửng hoặc một biến cố đột ngột khiến độc giả muốn đọc ngay chương sau.',
      templateText: [
        'Hãy hoàn thiện phần cuối chương và tạo một điểm kết (Cliffhanger) thật đắt giá:',
        '1. Giải quyết trọn vẹn mục tiêu chính của phân cảnh hiện tại nhưng mở ra một mối nguy hoặc bí ẩn lớn hơn.',
        '2. Câu văn cuối cùng phải cô đọng, giàu sức gợi hình và tạo tiếng vang tâm lý mạnh mẽ.',
        '3. Kiểm tra lại toàn bộ mạch văn để nối khớp hoàn hảo với đoạn cuối bản thảo đang có.'
      ].join('\n')
    }
  ];

  /**
   * Bảng quy chiếu đặc tả chuyên sâu cho từng chế độ trong 5 Chế độ Thực thi AI
   */
  const EXECUTION_MODE_SPECIFICATIONS = {
    MODE_1_DRAFT: {
      code: 'MODE_1_DRAFT',
      title: '✍️ Chế độ 1: Viết Bản Thảo Văn Học Chính Thức (Literary Drafting)',
      primaryGoal: 'Sáng tác văn xuôi tiểu thuyết hoàn chỉnh, giàu hình ảnh, cảm xúc chân thực, đối thoại sắc sảo và tuân thủ tuyệt đối Story Bible.',
      recommendedMinTemp: 0.7,
      recommendedMaxTemp: 0.95,
      defaultTargetWords: 3500,
      requireStrictDialogueFormat: true,
      requireAntiClicheEnforcement: true,
      requireEpistemicMatrixCheck: true,
      outputStructureGuide: [
        '• Viết trực tiếp văn bản tiểu thuyết hoàn chỉnh (không chèn lời bình của AI ở đầu hoặc cuối).',
        '• Chia đoạn văn rõ ràng, nhịp nhàng giữa miêu tả cảnh vật, hành động, nội tâm và hội thoại.',
        '• Mọi câu thoại bắt buộc định dạng: "- Câu thoại (Tên nhân vật)".',
        '• Triển khai đầy đủ các Mốc chuyển phân cảnh / Đổi góc nhìn (POV) theo thứ tự đã định.'
      ]
    },
    MODE_2_BRAINSTORM: {
      code: 'MODE_2_BRAINSTORM',
      title: '💡 Chế độ 2: Bàn Tròn Ý Tưởng & Thiết Kế Nhánh Cốt Truyện (Plot Brainstorming)',
      primaryGoal: 'Đề xuất các phương án phát triển tình tiết đột phá, nút thắt bất ngờ (plot twist), cách gỡ bí kịch bản và phương án thu hồi phục bút.',
      recommendedMinTemp: 0.8,
      recommendedMaxTemp: 1.0,
      defaultTargetWords: 2500,
      requireStrictDialogueFormat: false,
      requireAntiClicheEnforcement: true,
      requireEpistemicMatrixCheck: true,
      outputStructureGuide: [
        '• Đưa ra ít nhất 3 Phương Án Triển Khai Cốt Truyện khác nhau (từ hợp lý cổ điển đến đột phá bất ngờ).',
        '• Với mỗi phương án: Phân tích rõ Nguyên nhân -> Diễn biến -> Hệ quả tâm lý -> Tác động tới các chương sau.',
        '• Gợi ý các chi tiết Phục bút (Chekhov\'s Gun) có thể gieo mới hoặc kích hoạt trong chương này.',
        '• Đề xuất 3-5 câu thoại đắt giá hoặc hình ảnh ẩn dụ nghệ thuật mà tác giả có thể đưa vào bản thảo.'
      ]
    },
    MODE_3_AUDIT: {
      code: 'MODE_3_AUDIT',
      title: '🔍 Chế độ 3: Thanh Tra Logic, Mâu Thuẫn Thời Gian & Ma Trận Ai Biết Gì (Continuity Audit)',
      primaryGoal: 'Rà soát nghiêm ngặt toàn bộ lỗ hổng logic, sai lệch dòng thời gian, nhân vật biết trước thông tin chưa được tiết lộ (OOC / Epistemic Leak) và phục bút bị bỏ quên.',
      recommendedMinTemp: 0.25,
      recommendedMaxTemp: 0.55,
      defaultTargetWords: 2200,
      requireStrictDialogueFormat: false,
      requireAntiClicheEnforcement: false,
      requireEpistemicMatrixCheck: true,
      outputStructureGuide: [
        '• Lập Báo Cáo Thanh Tra Logic chia thành 4 mục rõ ràng:',
        '  1. Kiểm tra Dòng Thời Gian & Vị Trí Địa Lý giữa các chương.',
        '  2. Kiểm tra Ma Trận Ai Biết Gì (Có nhân vật nào nói hoặc hành xử dựa trên thông tin họ chưa từng biết không?).',
        '  3. Kiểm tra Tính Nhất Quán Tính Cách (OOC) & Trạng Thái Nhân Vật.',
        '  4. Đề xuất Cách Sửa Cụ Thể từng điểm mâu thuẫn (kèm đoạn văn mẫu đã chỉnh sửa).'
      ]
    },
    MODE_4_REVIEW: {
      code: 'MODE_4_REVIEW',
      title: '✨ Chế độ 4: Biên Tập Chuyên Sâu, Gọt Văn Chống Sáo Rỗng & Chuẩn Hóa Thoại (Literary Polish)',
      primaryGoal: 'Nâng cấp chất lượng văn chương của bản thảo, loại bỏ 100% từ ngữ sáo rỗng (Anti-Cliché), chuẩn hóa định dạng hội thoại và làm giàu nhạc tính tiếng Việt.',
      recommendedMinTemp: 0.5,
      recommendedMaxTemp: 0.8,
      defaultTargetWords: 3200,
      requireStrictDialogueFormat: true,
      requireAntiClicheEnforcement: true,
      requireEpistemicMatrixCheck: true,
      outputStructureGuide: [
        '• Phần 1: Nhận xét nhanh về nhịp điệu, giọng văn, các câu chữ chưa đắt hoặc dính từ cấm sáo rỗng.',
        '• Phần 2: Bản thảo đã được biên tập và gọt giũa hoàn chỉnh (giữ nguyên 100% cốt truyện và ý đồ của tác giả nhưng nâng tầm văn phong sắc sảo, giàu hình ảnh).',
        '• Chuẩn hóa toàn bộ câu thoại về đúng định dạng: "- Câu thoại (Tên nhân vật)".'
      ]
    },
    MODE_5_DIAGRAM: {
      code: 'MODE_5_DIAGRAM',
      title: '🎨 Chế độ 5: Vẽ Biểu Đồ Cốt Truyện, Mạng Lưới Nhân Vật & Đối Chiếu Thời Gian (Visual Chronicle)',
      primaryGoal: 'Trích xuất cấu trúc sự kiện, mạng lưới quan hệ nhân vật và dòng thời gian thành sơ đồ trực quan kèm báo cáo đối chiếu xuyên chương và Mindmap/Báo cáo hình ảnh trên NotebookLM.',
      recommendedMinTemp: 0.3,
      recommendedMaxTemp: 0.6,
      defaultTargetWords: 2000,
      requireStrictDialogueFormat: false,
      requireAntiClicheEnforcement: false,
      requireEpistemicMatrixCheck: true,
      outputStructureGuide: [
        '• Trả về khối dữ liệu JSON chuẩn (nodes, links, contradictions) để dựng biểu đồ SVG tương tác.',
        '• Tiếp theo là Báo Cáo Biên Niên Sử & Đối Chiếu Dòng Thời Gian chi tiết qua từng chương đã chọn.',
        '• Nếu chạy trên Google NotebookLM: yêu cầu tạo thêm Mindmap / Sơ đồ trực quan / Báo cáo ảnh ở thanh Studio bên phải.'
      ]
    },
    MODE_6_BOOK_COVER: {
      code: 'MODE_6_BOOK_COVER',
      title: '🖼️ Chế độ 6: Tạo Bìa Truyện Bằng AI (Gemini Tạo Hình Ảnh)',
      primaryGoal: 'Xây dựng câu lệnh thiết kế bìa tiểu thuyết chuyên nghiệp kết hợp chặt chẽ nội dung Story Bible, hình tượng nhân vật, không khí chủ đạo và phong cách nghệ thuật tác giả chọn.',
      recommendedMinTemp: 0.75,
      recommendedMaxTemp: 0.95,
      defaultTargetWords: 600,
      requireStrictDialogueFormat: false,
      requireAntiClicheEnforcement: false,
      requireEpistemicMatrixCheck: false,
      outputStructureGuide: [
        '• Mô tả chi tiết bố cục bìa sách (Tỷ lệ dọc 2:3 chuẩn bìa tiểu thuyết, không gian thoáng ở 1/3 trên để đặt Tên Truyện và phía dưới đặt Bút Danh).',
        '• Bám sát ngoại hình nhân vật chính, trang phục, đạo cụ biểu tượng và bối cảnh chủ đạo từ Story Bible.',
        '• Chốt bằng câu lệnh trực tiếp sẵn sàng dán vào chức năng "Tạo hình ảnh" của Gemini Web/App.'
      ]
    }
  };

  /**
   * 10+ Bộ khung phong cách vẽ bìa truyện chuyên nghiệp cho Chế độ 6 (Tạo Bìa Truyện Bằng AI)
   */
  const BOOK_COVER_STYLE_PRESETS = Object.freeze({
    ANIME_LN: {
      label: '✨ Anime / Light Novel',
      directive:
        'Phong cách minh họa bìa Light Novel Nhật Bản cao cấp (Japanese Light Novel Cover Art, Makoto Shinkai / Pixiv Masterpiece lighting), nét vẽ sắc sảo, ánh sáng điện ảnh lung linh, chiều sâu hậu cảnh phong phú, bố cục dọc 2:3 chuẩn xuất bản.'
    },
    CHIBI: {
      label: '🍡 Chibi Dễ Thương',
      directive:
        'Phong cách Chibi dễ thương tươi sáng (Cute Chibi Book Cover Illustration), tỷ lệ nhân vật đáng yêu, màu sắc pastel trong trẻo, đường viền sạch mềm mại, biểu cảm sinh động, bố cục bìa truyện hài hòa bắt mắt tỷ lệ 2:3.'
    },
    PHOTOREAL: {
      label: '🎬 Siêu Thực Điện Ảnh',
      directive:
        'Phong cách siêu thực điện ảnh như poster phim Hollywood / Netflix (Cinematic Photorealistic Book Cover, 8K Unreal Engine / IMAX film still), ánh sáng volumetric thực tế, kết cấu da/vải/mưa/khói cực kỳ chân thực, tương phản kịch tính tỷ lệ 2:3.'
    },
    WEBTOON: {
      label: '📱 Webtoon / Manhwa',
      directive:
        'Phong cách bìa Webtoon / Manhwa Hàn Quốc hiện đại (High-end Korean Manhwa Cover Art), góc máy năng động ấn tượng, hiệu ứng ánh sáng rực rỡ, đường nét gọn sắc, biểu cảm nhân vật cực ngầu tỷ lệ 2:3.'
    },
    INK_XIANXIA: {
      label: '🏮 Cổ Phong Thủy Mặc',
      directive:
        'Phong cách Cổ phong Thủy mặc Tiên hiệp / Kiếm hiệp Á Đông (Chinese Xianxia Watercolor & Ink Wash Book Cover), mây khói bảng lảng, y phục bay bổng, gam màu ngọc bích — vàng kim — mực tàu đậm chất thi họa tỷ lệ 2:3.'
    },
    DARK_NOIR: {
      label: '🕯️ Dark Fantasy / Noir',
      directive:
        'Phong cách Dark Fantasy / Trinh thám Tâm lý Noir u tối đầy ám ảnh (Atmospheric Gothic Noir Book Cover), ánh sáng chiaroscuro tương phản mạnh giữa bóng tối sâu và vệt sáng đơn sắc, giàu ẩn dụ tâm lý tỷ lệ 2:3.'
    },
    CYBERPUNK: {
      label: '🌆 Cyberpunk Neon',
      directive:
        'Phong cách Cyberpunk Đô thị tương lai (Neon Cyberpunk Sci-Fi Book Cover), ánh đèn neon cyan — hồng tím phản chiếu trên mặt đường ướt mưa, kiến trúc tương lai kỳ vĩ, chiều sâu không gian hút mắt tỷ lệ 2:3.'
    },
    CHILDREN: {
      label: '🧸 Thiếu Nhi Màu Nước',
      directive:
        'Phong cách tranh minh họa sách thiếu nhi & cổ tích vẽ tay màu nước (Whimsical Children Storybook Watercolor Illustration), nét cọ ấm áp, sắc màu rực rỡ mộng mơ, tạo cảm giác thân thiện ấm lòng tỷ lệ 2:3.'
    },
    MINIMALIST: {
      label: '📘 Tối Giản Hiện Đại',
      directive:
        'Phong cách bìa văn học hiện đại tối giản (Minimalist Literary Fiction Book Cover Design), dùng 1–2 hình tượng ẩn dụ đắt giá làm tâm điểm, mảng màu tinh tế sang trọng chuẩn nhà xuất bản lớn tỷ lệ 2:3.'
    },
    OIL_PAINTING: {
      label: '🎨 Sơn Dầu Cổ Điển',
      directive:
        'Phong cách tranh sơn dầu cổ điển châu Âu (Classical Fine Art Oil Painting Book Cover), nét cọ giàu chất liệu, ánh sáng cổ điển kiểu Rembrandt / Romanticism, trang trọng và mang chiều sâu sử thi tỷ lệ 2:3.'
    },
    CUSTOM_FREE: {
      label: '✏️ Tự nhập tự do',
      directive: ''
    }
  });

  /**
   * Placeholder gợi ý chuyên biệt (chữ xám hướng dẫn) cho từng chế độ 1 -> 5 trong #s18-fullscreen-prompt-textarea
   */
  const MODE_PROMPT_PLACEHOLDERS = Object.freeze({
    MODE_1_DRAFT: [
      '✍️ [CHẾ ĐỘ 1 — VIẾT BẢN THẢO CHÍNH THỨC]',
      'Nhập diễn biến chương truyện, tâm lý nhân vật, bối cảnh không gian hoặc phân cảnh bạn muốn AI triển khai chi tiết (3.000 - 4.000+ từ) tại đây...',
      '',
      'Ví dụ gợi ý để viết sâu sắc, không tua nhanh:',
      '- Cảnh 1 (Mưa khuya ở sảnh ga): Nhân vật A giữ im lặng khi nhận phong thư nặc danh, miêu tả chậm cảm giác lạnh gáy, mùi nước mưa và ánh đèn vàng hắt lên ngón tay run.',
      '- Cảnh 2 (Đối thoại căng thẳng): Cuộc chạm trán với Nhân vật B, dùng lời nói ẩn ý chứ chưa vội lật bài ngửa ngay.',
      '- Lưu ý: Hệ thống tự động lồng ghép dàn ý đã phát triển ở Chế độ 2 (nếu có) + Story Bible + Mốc chuyển phân cảnh + Ma trận Ai Biết Gì.'
    ].join('\n'),

    MODE_2_BRAINSTORM: [
      'Bạn có thể liệt kê dàn ý thô ở đây (mỗi gạch đầu dòng là một nhịp sự kiện hoặc ý tưởng bạn đã nghĩ sẵn) để AI chi tiết hóa từng bước mà không tự ý tua nhanh mạch truyện...',
      '',
      'Ví dụ dàn ý thô cực hiệu quả cho Chế độ 2:',
      '- Bối cảnh mở đầu chương: Nhân vật chính trở lại căn phòng cũ sau cuộc cãi vã.',
      '- Ý tưởng muốn khai thác: Tìm thấy một mẩu giấy nhắn cũ hoặc một món đồ làm dấy lên nghi ngờ về người anh trai.',
      '- Yêu cầu AI: Dựa vào các gạch đầu dòng trên + Story Bible, hãy phát triển chi tiết 3 phương án diễn biến tâm lý chậm rãi cho riêng chương tiếp theo (chưa vội cho nhân vật biết sự thật ngay, giữ nhịp hồi hộp & gài phục bút tinh tế).'
    ].join('\n'),

    MODE_3_AUDIT: [
      '🔍 [CHẾ ĐỘ 3 — THANH TRA LOGIC & MA TRẬN AI BIẾT GÌ]',
      'Nêu những đoạn bạn nghi ngờ có lỗ hổng thời gian, sai vị trí đồ vật, nhân vật lỡ miệng biết trước bí mật chưa công khai (Epistemic Leak) hoặc chuyển góc nhìn POV bất hợp lý...',
      '',
      'Ví dụ yêu cầu kiểm toán:',
      '- Kiểm tra giúp tôi xem ở Chương 3 nhân vật C có biết quá sớm chi tiết chiếc chìa khóa bạc không?',
      '- Đối chiếu đồng hồ thời gian từ lúc 21:00 đến rạng sáng xem các nhân vật di chuyển giữa 2 địa điểm có khớp giờ không?',
      '- Soi kỹ đoạn cuối xem nhân vật có bị OOC (hành xử trái tính cách gốc) hoặc lặp từ AI hay không.'
    ].join('\n'),

    MODE_4_REVIEW: [
      '✨ [CHẾ ĐỘ 4 — HỘI ĐỒNG ĐỘC GIẢ BETA & BIÊN TẬP GỌT VĂN]',
      'Dán đoạn văn hoặc nêu trọng tâm bạn muốn biên tập: chấm điểm 6 trụ cột văn học, nhận xét nhịp đọc trên điện thoại, gọt bớt từ sáo rỗng hoặc viết lại lời thoại cho sắc bén hơn...',
      '',
      'Ví dụ yêu cầu gọt văn & đánh giá:',
      '- Đóng vai 3 nhóm độc giả (thích đấu trí, thích tâm lý, đọc giải trí nhanh) nhận xét xem mở đầu Chương này đủ cuốn chưa?',
      '- Chỉnh giúp tôi những câu văn kể lể cảm xúc thô thành tả qua hành động (Show Don\'t Tell), và chuẩn hóa toàn bộ câu thoại về dạng "- Câu thoại (Tên nhân vật)".'
    ].join('\n'),

    MODE_5_DIAGRAM: [
      '🎨 [CHẾ ĐỘ 5 — SƠ ĐỒ CỐT TRUYỆN, TIMELINE & MINDMAP TRÊN NOTEBOOKLM]',
      'Nhập phạm vi các chương, tuyến nhân vật hoặc nút thắt bí ẩn bạn muốn AI vẽ thành Sơ đồ Timeline / Mindmap trực quan (hỗ trợ cả thanh Studio bên phải của NotebookLM)...',
      '',
      'Ví dụ yêu cầu vẽ sơ đồ:',
      '- Hãy lập sơ đồ dòng thời gian và mối quan hệ nhân quả từ Chương 1 đến chương mới nhất, đồng thời tạo Mindmap / Báo cáo trực quan ở thanh bên.',
      '- Đánh dấu đỏ những mốc thời gian có nguy cơ xung đột địa điểm hoặc nhân vật lộ bí mật.'
    ].join('\n'),

    MODE_6_BOOK_COVER: [
      '🖼️ [CHẾ ĐỘ 6 — TẠO BÌA TRUYỆN BẰNG AI (GEMINI TẠO HÌNH ẢNH)]',
      'Bạn có thể chọn 1 phong cách bìa có sẵn bên trên HOẶC chọn "Tự nhập tự do" và mô tả thẳng ý tưởng bìa bạn muốn (nhân vật trung tâm, tư thế, khung cảnh, tông màu, tên truyện hiển thị trên bìa)...',
      '',
      'Ví dụ mô tả thêm cho bìa truyện:',
      '- Nhân vật chính đứng dưới cơn mưa đêm thành phố nhìn lên màn hình điện thoại phát sáng ánh xanh lạnh, phía sau là bóng dáng kẻ phản diện mờ ảo trong màn sương.',
      '- Chừa khoảng thoáng phía trên để đặt tiêu đề tiểu thuyết thật nổi bật.'
    ].join('\n')
  });

  /**
   * Danh mục tư vấn sử dụng Mô hình AI giúp tác giả chọn đúng giữa Flash / Pro / Argon và Flash-Lite
   */
  const MODEL_TIER_ADVISORY_GUIDE = {
    'gemini-4-hydrogen': {
      badge: '🧪 KHUYÊN DÙNG #1 · SIÊU SUY LUẬN XHIGH — CÂN BẰNG TOÀN DIỆN GEMINI 4',
      toneQuality: '9.8/10 — Tự nhiên, giàu cảm xúc, sắc sảo và cân bằng nhịp điệu tốt',
      logicDepth: '9.9/10 — Hỗ trợ đầy đủ 4 mức tư duy LOW / MEDIUM / HIGH / XHIGH',
      speedRating: '⚡ Cân bằng Nhanh & Sâu (#1)',
      recommendationNote:
        'Lựa chọn ưu tiên số 1 cho cả 5 chế độ: viết chương dài (Chế độ 1), tham mưu cốt truyện (Chế độ 2), kiểm toán mâu thuẫn (Chế độ 3), đánh giá độc giả (Chế độ 4) & vẽ biểu đồ (Chế độ 5).'
    },
    'gemini-4-neon': {
      badge: '⚡ GEMINI 4 NEON (MỚI) · SUY LUẬN XHIGH & PHẢN HỒI SIÊU MƯỢT',
      toneQuality: '9.8/10 — Văn phong sắc sảo, giàu nhịp điệu, hội thoại tự nhiên',
      logicDepth: '9.8/10 — Hỗ trợ đầy đủ 4 mức tư duy LOW / MEDIUM / HIGH / XHIGH',
      speedRating: '⚡ Siêu nhanh & Sâu sắc',
      recommendationNote:
        'Mô hình Gemini 4 Neon thế hệ mới: kết hợp tốc độ xuất chữ cực nhanh với khả năng bám sát Story Bible & suy luận đa tầng (yêu cầu API Key hỗ trợ gói Paid/Billing).'
    },
    'gemini-3.8-flash': {
      badge: '🌟 DÒNG FLASH MƯỢT MÀ & GIÀU CẢM XÚC',
      toneQuality: '9.5/10 — Giàu cảm xúc, từ vựng tiếng Việt tự nhiên, miêu tả tâm lý mượt mà',
      logicDepth: '9.0/10 — Bám sát Story Bible và Mốc chuyển cảnh',
      speedRating: '⚡ Nhanh & Ổn định',
      recommendationNote:
        'Lựa chọn tối ưu nhất để viết bản thảo chính thức (Chế độ 1) và gọt văn (Chế độ 4). Văn phong có hồn, giàu ẩn dụ và không bị khô cứng.'
    },
    'gemini-3.1-pro-preview': {
      badge: '👑 CHUYÊN GIA LOGIC DÀI HƠI & PHỤC BÚT PHỨC TẠP',
      toneQuality: '9.6/10 — Sâu sắc, chững chạc, cấu trúc tầng lớp chặt chẽ',
      logicDepth: '9.9/10 — Đối chiếu hoàn hảo hàng chục nhân vật và Ma trận Ai Biết Gì',
      speedRating: '⏳ Trung bình (Suy luận sâu)',
      recommendationNote:
        'Rất mạnh khi viết các chương cao trào đan xen nhiều tuyến nhân vật, đấu trí phức tạp hoặc khi chạy Thanh tra Logic (Chế độ 3).'
    },
    'gemini-4-argon': {
      badge: '💎 ĐỈNH CAO VĂN CHƯƠNG & ĐỘC THOẠI NỘI TÂM',
      toneQuality: '9.9/10 — Chất văn nghệ thuật cao, giàu nhạc tính và chiều sâu triết lý',
      logicDepth: '9.8/10 — Kết nối tinh tế các phục bút ẩn',
      speedRating: '⏳ Chậm hơn (Ưu tiên chất lượng tối đa)',
      recommendationNote:
        'Lý tưởng cho những phân cảnh tâm lý nặng đô, hồi tưởng bi kịch hoặc chương kết quyển cần sức nặng văn học đặc biệt.'
    },
    'gemini-3.1-flash-lite-preview': {
      badge: '⚡ SIÊU NHANH — CHỈ NÊN DÙNG ĐỂ NHÁP NHANH / HỎI ĐÁP NGẮN',
      toneQuality: '7.0/10 — Câu văn ngắn gọn, ít chiều sâu miêu tả nội tâm',
      logicDepth: '7.5/10 — Đáp ứng ngữ cảnh cơ bản',
      speedRating: '🚀 Tức thì',
      recommendationNote:
        '⚠️ LƯU Ý: Mô hình Flash-Lite ưu tiên tốc độ nên văn phong dễ bị tóm tắt hoặc kém bay bổng. Khi viết tiểu thuyết chính thức, bạn nên đổi sang Gemini 3.8 Flash hoặc Gemini 3.1 Pro!'
    }
  };

  // ==========================================================================
  // PHẦN 2: BỘ PHÂN BỔ NGÂN SÁCH NGỮ CẢNH & KIỂM ĐỊNH TRƯỚC CHUYẾN BAY
  //         (ContextBudgetAndPreFlightInspector)
  // ==========================================================================
  class ContextBudgetAndPreFlightInspector {
    constructor(utils) {
      this.utils = utils;
    }

    countWordsSafe(text) {
      if (this.utils && typeof this.utils.countVietnameseWords === 'function') {
        return this.utils.countVietnameseWords(text || '');
      }
      const raw = String(text || '').trim();
      return raw ? raw.split(/\s+/).filter(Boolean).length : 0;
    }

    estimateTokensFromVietnameseWords(wordCount) {
      const w = Math.max(0, Number(wordCount) || 0);
      return Math.ceil(w * 1.45);
    }

    /**
     * Phân tích chi tiết từng thành phần trong gói Prompt Tổng Hợp để hiển thị
     * thống kê minh bạch cho tác giả và đảm bảo không bỏ sót bất kỳ dữ liệu nào.
     */
    analyzeContextLayers({
      sysInstruction = '',
      techSpecBlock = '',
      bibleBlock = '',
      sceneMarkersBlock = '',
      approvedSummariesBlock = '',
      ragBlock = '',
      tailContextBlock = '',
      userCommandBlock = ''
    }) {
      const layers = [
        {
          id: 'layer_sys_prompt',
          label: '1. Chỉ thị Hệ thống & Vai trò Văn học',
          words: this.countWordsSafe(sysInstruction),
          chars: String(sysInstruction || '').length,
          status: sysInstruction.trim() ? 'READY' : 'EMPTY'
        },
        {
          id: 'layer_tech_specs',
          label: '2. Thông số Kỹ thuật (Số từ, POV, Temp, Chuẩn thoại)',
          words: this.countWordsSafe(techSpecBlock),
          chars: String(techSpecBlock || '').length,
          status: 'READY'
        },
        {
          id: 'layer_story_bible',
          label: '3. Hồ sơ Story Bible, Nhân vật, Ma trận Ai Biết Gì & Từ cấm',
          words: this.countWordsSafe(bibleBlock),
          chars: String(bibleBlock || '').length,
          status: bibleBlock.trim() ? 'READY' : 'EMPTY'
        },
        {
          id: 'layer_scene_markers',
          label: '4. Mốc Chuyển Phân Cảnh & Đổi Góc Nhìn (POV)',
          words: this.countWordsSafe(sceneMarkersBlock),
          chars: String(sceneMarkersBlock || '').length,
          status: sceneMarkersBlock.includes('Chưa đặt mốc') ? 'DEFAULT' : 'READY'
        },
        {
          id: 'layer_approved_continuity',
          label: '5. Tóm tắt Mạch Truyện Các Chương Đã Duyệt',
          words: this.countWordsSafe(approvedSummariesBlock),
          chars: String(approvedSummariesBlock || '').length,
          status: approvedSummariesBlock.includes('chưa có chương') ? 'INITIAL' : 'READY'
        },
        {
          id: 'layer_bm25_rag',
          label: '6. Ký Ức Chống Quên Cục Bộ (BM25 RAG)',
          words: this.countWordsSafe(ragBlock),
          chars: String(ragBlock || '').length,
          status: ragBlock.includes('Không có đoạn ký ức') ? 'STANDBY' : 'ACTIVE'
        },
        {
          id: 'layer_manuscript_tail',
          label: '7. Đoạn Cuối Bản Thảo Hiện Tại (Nối mạch)',
          words: this.countWordsSafe(tailContextBlock),
          chars: String(tailContextBlock || '').length,
          status: tailContextBlock.includes('đang trống') ? 'NEW_CHAPTER' : 'CONNECTED'
        },
        {
          id: 'layer_user_command',
          label: '8. Yêu Cầu / Câu Lệnh Cụ Thể Của Tác Giả',
          words: this.countWordsSafe(userCommandBlock),
          chars: String(userCommandBlock || '').length,
          status: userCommandBlock.trim() ? 'READY' : 'AUTO_INFERRED'
        }
      ];

      const totalWords = layers.reduce((acc, item) => acc + item.words, 0);
      const totalChars = layers.reduce((acc, item) => acc + item.chars, 0);
      const estimatedInputTokens = this.estimateTokensFromVietnameseWords(totalWords);

      return {
        layers,
        totalWords,
        totalChars,
        estimatedInputTokens
      };
    }

    /**
     * Đối chiếu câu lệnh của tác giả với Ma trận Ai Biết Gì, Trạng thái Nhân vật
     * và Sổ cái Phục bút để tạo danh sách Lưu Ý Tự Động (Epistemic & Continuity Guardrails)
     * đính kèm vào Prompt Tổng Hợp.
     */
    buildEpistemicAndContinuityGuardrails(storyBible, sceneBuilder, activeChapter, userCommand) {
      const notes = [];
      const characters = Array.isArray(storyBible?.characters) ? storyBible.characters : [];
      const matrix = Array.isArray(storyBible?.knowledgeMatrix) ? storyBible.knowledgeMatrix : [];
      const clues = Array.isArray(storyBible?.cluesLedger) ? storyBible.cluesLedger : [];
      const antiCliche = Array.isArray(storyBible?.antiClicheList) ? storyBible.antiClicheList : [];
      const markers = Array.isArray(sceneBuilder?.markers) ? sceneBuilder.markers : [];

      const combinedContextText = `${userCommand || ''} ${activeChapter?.displayTitle || ''} ${
        markers.map((m) => `${m.pov || ''} ${m.location || ''} ${m.goal || ''}`).join(' ')
      }`.toLowerCase();

      // 1. Kiểm tra nhân vật xuất hiện trong câu lệnh hoặc mốc phân cảnh
      const mentionedChars = characters.filter((ch) => {
        const name = String(ch?.name || '').trim().toLowerCase();
        return name && combinedContextText.includes(name);
      });

      if (mentionedChars.length > 0) {
        mentionedChars.forEach((ch) => {
          notes.push(
            `• [Nhân vật trọng tâm "${ch.name}" (${ch.role || 'Nhân vật'})]: Tính cách & Giọng điệu: ${
              ch.traits || 'Giữ đúng hồ sơ gốc'
            } | Mục tiêu/Bí mật: ${ch.goal || 'Theo mạch truyện'}.`
          );
        });
      } else if (characters.length > 0) {
        notes.push(
          `• [Hệ thống nhân vật]: Có ${characters.length} hồ sơ nhân vật trong Story Bible. Khi nhân vật nào xuất hiện, bắt buộc giữ đúng giọng nói, xưng hô và tâm lý của nhân vật đó.`
        );
      }

      // 2. Kiểm tra Ma trận Ai Biết Gì (Epistemic Boundaries)
      if (matrix.length > 0) {
        matrix.forEach((row) => {
          const charName = String(row.character || '').trim();
          const secret = String(row.secret || '').trim();
          const state = String(row.state || '').toUpperCase();
          if (!charName || !secret) return;

          if (state.includes('CHƯA BIẾT') || state === 'UNKNOWN') {
            notes.push(
              `• ⛔ [CẢNH BÁO GIỚI HẠN NHẬN THỨC]: Nhân vật "${charName}" HIỆN CHƯA BIẾT về sự thật/bí mật "${secret}". Tuyệt đối KHÔNG để "${charName}" nói, suy nghĩ hoặc hành động như thể đã biết điều này (trừ khi câu lệnh của tác giả yêu cầu tiết lộ ngay trong cảnh này).`
            );
          } else if (state.includes('NGHI NGỜ') || state === 'SUSPECTS') {
            notes.push(
              `• ⚠️ [TRẠNG THÁI NGHI NGỜ]: Nhân vật "${charName}" mới chỉ ĐANG NGHI NGỜ về "${secret}" (${
                row.note || 'Chưa có bằng chứng xác thực'
              }). Hãy thể hiện sự dò xét, bán tín bán nghi thay vì khẳng định chắc chắn.`
            );
          } else {
            notes.push(
              `• ✅ [ĐÃ NẮM THÔNG TIN]: Nhân vật "${charName}" ĐÃ BIẾT rõ về "${secret}" (${
                row.note || 'Có thể chủ động sử dụng thông tin này'
              }).`
            );
          }
        });
      }

      // 3. Kiểm tra Sổ cái Phục bút (Chekhov's Gun Clues)
      const activeClues = clues.filter((c) => c && c.status !== 'RESOLVED');
      if (activeClues.length > 0) {
        const clueSummary = activeClues
          .slice(0, 6)
          .map(
            (c) =>
              `"${c.title}" (Gieo tại: ${c.plantedIn || 'Chương trước'} -> Dự kiến thu hồi: ${
                c.payoffPlan || 'Chờ kích hoạt'
              })`
          )
          .join('; ');
        notes.push(
          `• 🔫 [PHỤC BÚT ĐANG CÀI CẮM (${activeClues.length} manh mối mở)]: ${clueSummary}. Hãy duy trì tính nhất quán của các vật chứng/chi tiết này nếu chúng xuất hiện.`
        );
      }

      // 4. Kiểm tra Mốc chuyển phân cảnh & Đổi POV
      if (markers.length > 0) {
        notes.push(
          `• 🎬 [LỘ TRÌNH ${markers.length} MỐC CHUYỂN PHÂN CẢNH]: Bắt buộc triển khai đầy đủ theo thứ tự từ Cảnh #1 đến Cảnh #${markers.length}, giữ đúng Điểm nhìn (POV) và Thời gian/Địa điểm của từng mốc.`
        );
      }

      // 5. Nhắc nhở chống từ sáo rỗng (Anti-Cliché)
      if (antiCliche.length > 0) {
        notes.push(
          `• 🚫 [KIỂM SOÁT CHỐNG SÁO RỖNG]: Tuyệt đối không sử dụng ${antiCliche.length} cụm từ cấm trong danh sách Anti-Cliché (ví dụ: "${antiCliche
            .slice(0, 4)
            .join('", "')}"). Hãy thay bằng chi tiết quan sát cụ thể, hành động cơ thể và hình ảnh mới mẻ.`
        );
      }

      return notes.join('\n');
    }

    /**
     * Phân tích đoạn cuối bản thảo hiện tại để hướng dẫn AI nối mạch tự nhiên nhất
     * (không lặp lại câu cuối, không đứt gãy hội thoại đang dang dở).
     */
    buildSeamlessContinuationDirective(currentText) {
      const trimmed = String(currentText || '').trim();
      if (!trimmed) {
        return {
          mode: 'FRESH_CHAPTER_START',
          tailExcerpt: '(Chương hiện tại đang trống — Hãy bắt đầu viết từ câu mở đầu chương)',
          continuationHint:
            'Chương này chưa có nội dung bản thảo. Hãy mở đầu chương thật ấn tượng, thiết lập ngay không gian, thời gian và tâm thế của nhân vật góc nhìn (POV).'
        };
      }

      const paragraphs = trimmed
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      const lastParagraph = paragraphs[paragraphs.length - 1] || '';
      const endsInDialogue = /^[-–—]/.test(lastParagraph) || /\([^)]+\)\s*$/.test(lastParagraph);
      const tailExcerpt = trimmed.slice(-2400);

      let continuationHint =
        'Bản thảo hiện tại đang viết dở. Hãy đọc kỹ đoạn văn cuối cùng bên trên và viết NỐI TIẾP MƯỢT MÀ ngay sau câu cuối cùng (tuyệt đối không chép lặp lại đoạn đã có).';
      if (endsInDialogue) {
        continuationHint +=
          ' Lưu ý: Câu cuối cùng của bản thảo đang là một câu thoại — hãy tiếp nối bằng phản ứng, hành động hoặc lời đáp trả tự nhiên của nhân vật đối diện.';
      }

      return {
        mode: 'SEAMLESS_CONTINUATION',
        tailExcerpt,
        lastParagraph,
        endsInDialogue,
        continuationHint
      };
    }
  }

  // ==========================================================================
  // PHẦN 3: BỘ HẬU XỬ LÝ & KIỂM ĐỊNH ĐẦU RA VĂN HỌC TIẾNG VIỆT
  //         (VietnameseLiteraryOutputPostProcessor)
  // ==========================================================================
  class VietnameseLiteraryOutputPostProcessor {
    constructor(utils) {
      this.utils = utils;
    }

    /**
     * Chuẩn hóa văn bản đầu ra của AI:
     * - Loại bỏ các dòng rào đón thừa của AI (nếu ở Chế độ 1 Viết bản thảo)
     * - Chuẩn hóa khoảng trắng và dấu gạch ngang đầu dòng câu thoại
     * - Kiểm tra tỷ lệ tuân thủ định dạng thoại "- Câu thoại (Tên nhân vật)"
     * - Phát hiện xem còn sót cụm từ cấm Anti-Cliché nào không
     */
    processAndInspectOutput(rawText, modeKey, antiClicheList = []) {
      let cleaned = String(rawText || '').replace(/\r\n/g, '\n').trim();
      if (!cleaned) {
        return {
          text: '',
          stats: {
            wordCount: 0,
            paragraphCount: 0,
            dialogueLinesCount: 0,
            detectedCliches: []
          }
        };
      }

      // Ở Chế độ 1 (Viết bản thảo), gỡ bỏ các câu mở đầu kiểu trợ lý AI nếu vô tình xuất hiện
      if (modeKey === 'MODE_1_DRAFT') {
        cleaned = cleaned
          .replace(
            /^(Dưới đây là|Sau đây là|Chào bạn,?\s*dưới đây là|Tuyệt vời!?\s*Dưới đây là)[^\n]*:\s*\n+/i,
            ''
          )
          .trim();
      }

      // Gọt sạch toàn bộ ký hiệu Markdown/AI dư thừa (**, *, ###, ##, ---, ```, `) để bản thảo luôn thuần văn xuôi sạch đẹp
      if (modeKey !== 'MODE_5_DIAGRAM') {
        const stripper =
          typeof window !== 'undefined' && typeof window.NoirStudio?.stripAiMarkdownSymbols === 'function'
            ? window.NoirStudio.stripAiMarkdownSymbols
            : this.utils?.stripAiMarkdownSymbols?.bind(this.utils);
        if (typeof stripper === 'function') {
          cleaned = stripper(cleaned);
        }
      }

      // Chuẩn hóa dòng trống quá nhiều (tối đa 2 dòng xuống hàng liên tiếp)
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

      // Chuẩn hóa các dòng hội thoại bắt đầu bằng "– " hoặc "— " về "- " chuẩn
      const lines = cleaned.split('\n').map((line) => {
        const trimmedLine = line.trim();
        if (/^[–—]\s+/.test(trimmedLine)) {
          return trimmedLine.replace(/^[–—]\s+/, '- ');
        }
        return line;
      });
      cleaned = lines.join('\n');

      // Thống kê câu thoại và kiểm tra từ cấm Anti-Cliché
      const dialogueLines = lines.filter((l) => /^-\s+.+/.test(l.trim()));
      const lowerText = cleaned.toLowerCase();
      const detectedCliches = (Array.isArray(antiClicheList) ? antiClicheList : []).filter(
        (phrase) => {
          const p = String(phrase || '').trim().toLowerCase();
          return p && lowerText.includes(p);
        }
      );

      const wordCount =
        this.utils && typeof this.utils.countVietnameseWords === 'function'
          ? this.utils.countVietnameseWords(cleaned)
          : cleaned.split(/\s+/).filter(Boolean).length;

      const paragraphCount =
        this.utils && typeof this.utils.countParagraphs === 'function'
          ? this.utils.countParagraphs(cleaned)
          : lines.filter((l) => l.trim().length > 0).length;

      return {
        text: cleaned,
        stats: {
          wordCount,
          paragraphCount,
          dialogueLinesCount: dialogueLines.length,
          detectedCliches
        }
      };
    }
  }
  // ==========================================================================
  // PHẦN 4: BỘ QUẢN LÝ LỊCH SỬ CÂU LỆNH & KHÔI PHỤC TỨC THÌ
  //         (CommandHistoryAndSnapshotManager)
  // ==========================================================================
  class CommandHistoryAndSnapshotManager {
    constructor(idb, utils) {
      this.idb = idb;
      this.utils = utils;
      this.storageKey = 'noir_v36_command_prompt_history_stack';
      this.primaryPromptKey = 'noir_v36_last_command_prompt';
      this.maxHistoryEntries = 35;
      this.history = [];
      this.loadHistory();
    }

    loadHistory() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.history = parsed;
          }
        }
      } catch (_) {
        this.history = [];
      }
    }

    saveHistory() {
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify(this.history.slice(0, this.maxHistoryEntries))
        );
      } catch (_) {}
    }

    recordCommandSnapshot({
      commandText,
      modeKey = 'MODE_1_DRAFT',
      chapterId = null,
      chapterTitle = '',
      modelId = 'gemini-3.8-flash',
      targetWords = 3500
    }) {
      const clean = String(commandText || '').trim();
      if (!clean) return null;

      try {
        localStorage.setItem(this.primaryPromptKey, clean);
      } catch (_) {}

      // Không lưu trùng lặp liên tiếp nếu câu lệnh giống hệt bản ghi mới nhất
      if (this.history.length > 0 && this.history[0].commandText === clean) {
        this.history[0].timestamp = Date.now();
        this.history[0].modeKey = modeKey;
        this.history[0].modelId = modelId;
        this.saveHistory();
        return this.history[0];
      }

      const entry = {
        id: `cmd_hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        commandText: clean,
        modeKey,
        chapterId,
        chapterTitle: chapterTitle || 'Chương hiện tại',
        modelId,
        targetWords: Number(targetWords) || 3500,
        wordCount:
          this.utils && typeof this.utils.countVietnameseWords === 'function'
            ? this.utils.countVietnameseWords(clean)
            : clean.split(/\s+/).filter(Boolean).length
      };

      this.history.unshift(entry);
      if (this.history.length > this.maxHistoryEntries) {
        this.history = this.history.slice(0, this.maxHistoryEntries);
      }
      this.saveHistory();
      return entry;
    }

    getLatestSavedCommand() {
      const direct = localStorage.getItem(this.primaryPromptKey);
      if (direct && direct.trim()) {
        return direct.trim();
      }
      if (this.history.length > 0 && this.history[0].commandText) {
        return String(this.history[0].commandText).trim();
      }
      return '';
    }

    getHistoryList() {
      return [...this.history];
    }

    clearHistory() {
      this.history = [];
      this.saveHistory();
    }
  }

  // ==========================================================================
  // PHẦN 5: BỘ ĐO LƯỜNG HIỆU SUẤT & NHẬT KÝ THỰC THI AI
  //         (PromptExecutionTelemetryLogger)
  // ==========================================================================
  class PromptExecutionTelemetryLogger {
    constructor() {
      this.storageKey = 'noir_v36_prompt_execution_telemetry';
      this.maxLogs = 50;
      this.logs = [];
      this.loadLogs();
    }

    loadLogs() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.logs = parsed;
          }
        }
      } catch (_) {
        this.logs = [];
      }
    }

    saveLogs() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.logs.slice(0, this.maxLogs)));
      } catch (_) {}
    }

    recordExecution({
      modeKey,
      modelId,
      usedEndpoint,
      chapterTitle,
      promptWords,
      outputWords,
      durationMs,
      status = 'SUCCESS',
      errorMessage = ''
    }) {
      const item = {
        id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        modeKey: modeKey || 'MODE_1_DRAFT',
        modelId: modelId || 'gemini-3.8-flash',
        usedEndpoint: usedEndpoint || modelId || 'gemini-2.5-flash',
        chapterTitle: chapterTitle || 'Chương hiện tại',
        promptWords: Number(promptWords) || 0,
        outputWords: Number(outputWords) || 0,
        durationMs: Number(durationMs) || 0,
        status,
        errorMessage: String(errorMessage || '')
      };
      this.logs.unshift(item);
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }
      this.saveLogs();
      return item;
    }

    getSummaryMetrics() {
      const totalRuns = this.logs.length;
      const successRuns = this.logs.filter((l) => l.status === 'SUCCESS');
      const totalGeneratedWords = successRuns.reduce((acc, l) => acc + (l.outputWords || 0), 0);
      const avgDurationMs =
        successRuns.length > 0
          ? Math.round(
              successRuns.reduce((acc, l) => acc + (l.durationMs || 0), 0) / successRuns.length
            )
          : 0;

      return {
        totalRuns,
        successCount: successRuns.length,
        failureCount: totalRuns - successRuns.length,
        totalGeneratedWords,
        avgDurationMs,
        recentLogs: this.logs.slice(0, 10)
      };
    }
  }

  // ==========================================================================
  // PHẦN 6: ĐỘNG CƠ CHÍNH — MASTER PROMPT SYNTHESIZER & EXECUTION ENGINE
  //         (MasterPromptSynthesizerAndExecutionEngine)
  // ==========================================================================
  class MasterPromptSynthesizerAndExecutionEngine {
    constructor(
      idb,
      chapterMgr,
      storyBible,
      sceneBuilder,
      sysPrompts,
      rag,
      geminiRouter,
      utils
    ) {
      this._idb = idb;
      this._chapterMgr = chapterMgr;
      this._storyBible = storyBible;
      this._sceneBuilder = sceneBuilder;
      this._sysPrompts = sysPrompts;
      this._rag = rag;
      this._geminiRouter = geminiRouter;
      this._utils = utils;

      this.lastSynthesizedPrompt = '';
      this.lastContextBreakdown = null;
      this.isSynthesizing = false;
      this.isExecutingOfficialPrompt = false;
      this.activePresetCategory = 'ALL';

      this.inspector = new ContextBudgetAndPreFlightInspector(this.utils);
      this.postProcessor = new VietnameseLiteraryOutputPostProcessor(this.utils);
      this.commandHistory = new CommandHistoryAndSnapshotManager(this.idb, this.utils);
      this.telemetry = new PromptExecutionTelemetryLogger();
    }

    // Các getter tự động liên kết với window.NoirStudio nếu mô-đun được nạp độc lập
    get constants() {
      return (
        window.NoirStudio?.constants || {
          STORAGE_KEYS: {
            SELECTED_MODEL: 'noir_selected_gemini_model',
            EXECUTION_MODE: 'noir_selected_ai_mode',
            TARGET_WORDS: 'noir_target_word_count',
            TEMPERATURE: 'noir_ai_temperature'
          }
        }
      );
    }

    get idb() {
      return this._idb || window.NoirStudio?.idb;
    }

    get chapterMgr() {
      return this._chapterMgr || window.NoirStudio?.chapterManager;
    }

    get storyBible() {
      return this._storyBible || window.NoirStudio?.storyBible;
    }

    get sceneBuilder() {
      return this._sceneBuilder || window.NoirStudio?.sceneBuilder;
    }

    get sysPrompts() {
      return this._sysPrompts || window.NoirStudio?.sysPrompts;
    }

    get rag() {
      return this._rag || window.NoirStudio?.rag;
    }

    get geminiRouter() {
      return this._geminiRouter || window.NoirStudio?.geminiRouter;
    }

    get utils() {
      return (
        this._utils ||
        window.NoirStudio?.utils || {
          escapeHtml: (s) => String(s || ''),
          countVietnameseWords: (s) =>
            String(s || '')
              .trim()
              .split(/\s+/)
              .filter(Boolean).length,
          countParagraphs: (s) =>
            String(s || '')
              .split(/\r?\n+/)
              .filter((l) => l.trim().length > 0).length,
          formatTimestampVN: (ts) =>
            window.NoirNovel?.i18n?.formatDateTime
              ? window.NoirNovel.i18n.formatDateTime(ts || Date.now(), { includeSeconds: true })
              : new Date(ts || Date.now()).toLocaleString('vi-VN'),
          showToast: (msg) => console.log('[Toast]', msg),
          showBlockingLoader: () => {},
          updateBlockingLoader: () => {},
          hideBlockingLoader: () => {}
        }
      );
    }

    /**
     * Khởi tạo toàn bộ giao diện, lắng nghe sự kiện đồng bộ thời gian thực giữa các ô
     * nhập câu lệnh để KHÔNG BAO GIỜ xảy ra lỗi mất câu lệnh hay báo trống câu lệnh giả.
     */
    init() {
      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      const charCounter = document.getElementById('prompt-char-counter');
      const tempSlider = document.getElementById('slider-ai-temperature');
      const tempLabel = document.getElementById('label-temp-val');
      const targetWordInput = document.getElementById('input-target-word-count');
      const modeSelect = document.getElementById('select-ai-execution-mode');
      const confirmModelSelect = document.getElementById('confirm-modal-model-select');
      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');

      // 1. Khôi phục câu lệnh đã lưu từ localStorage / lịch sử lệnh / chương hiện tại
      const savedPrompt =
        localStorage.getItem('noir_v36_last_command_prompt') ||
        this.commandHistory.getLatestSavedCommand() ||
        '';
      if (promptBox && !promptBox.value && savedPrompt) {
        promptBox.value = savedPrompt;
      }

      this.updatePromptCounterUI(promptBox?.value || '');

      // 2. Đồng bộ 2 chiều theo thời gian thực khi tác giả gõ vào #s18-fullscreen-prompt-textarea
      if (promptBox && !promptBox.dataset.noirMod16Bound) {
        promptBox.dataset.noirMod16Bound = '1';
        const syncHandler = () => {
          const val = promptBox.value;
          try {
            localStorage.setItem('noir_v36_last_command_prompt', val);
          } catch (_) {}

          const legacyBeats = document.getElementById('textarea-chapter-beats');
          if (legacyBeats && legacyBeats.value !== val) {
            legacyBeats.value = val;
          }

          const active = this.chapterMgr?.getActiveChapter?.();
          if (active) {
            active.beats = val;
          }

          this.updatePromptCounterUI(val);
        };

        promptBox.addEventListener('input', syncHandler);
        promptBox.addEventListener('change', syncHandler);
        promptBox.addEventListener('paste', () => setTimeout(syncHandler, 20));
      }

      // 3. Đồng bộ ngược nếu tác giả nhập vào #textarea-chapter-beats hoặc #mode5-prompt-input
      const legacyBeats = document.getElementById('textarea-chapter-beats');
      if (legacyBeats && !legacyBeats.dataset.noirMod16Bound) {
        legacyBeats.dataset.noirMod16Bound = '1';
        legacyBeats.addEventListener('input', () => {
          const val = legacyBeats.value;
          if (promptBox && promptBox.value !== val) {
            promptBox.value = val;
          }
          try {
            localStorage.setItem('noir_v36_last_command_prompt', val);
          } catch (_) {}
          this.updatePromptCounterUI(val);
        });
      }

      const mode5Input = document.getElementById('mode5-prompt-input');
      if (mode5Input && !mode5Input.dataset.noirMod16Bound) {
        mode5Input.dataset.noirMod16Bound = '1';
        mode5Input.addEventListener('input', () => {
          const val = mode5Input.value;
          if (val && val.trim() && promptBox && !promptBox.value.trim()) {
            promptBox.value = val;
            try {
              localStorage.setItem('noir_v36_last_command_prompt', val);
            } catch (_) {}
          }
        });
      }

      this.bindEnterToRunPromptWithConfirm();

      // 4. Khôi phục & đồng bộ thanh trượt Nhiệt độ sáng tạo (Temperature)
      if (tempSlider && tempLabel && !tempSlider.dataset.noirMod16Bound) {
        tempSlider.dataset.noirMod16Bound = '1';
        const savedTemp = localStorage.getItem(this.constants.STORAGE_KEYS.TEMPERATURE);
        if (savedTemp) {
          tempSlider.value = savedTemp;
          tempLabel.textContent = savedTemp;
        }
        tempSlider.addEventListener('input', () => {
          tempLabel.textContent = tempSlider.value;
          try {
            localStorage.setItem(this.constants.STORAGE_KEYS.TEMPERATURE, tempSlider.value);
          } catch (_) {}
        });
      }

      // 5. Khôi phục & đồng bộ Số từ mục tiêu (Target Word Count)
      if (targetWordInput && !targetWordInput.dataset.noirMod16Bound) {
        targetWordInput.dataset.noirMod16Bound = '1';
        const savedTargetWords = localStorage.getItem(this.constants.STORAGE_KEYS.TARGET_WORDS);
        if (savedTargetWords && Number(savedTargetWords) >= 300) {
          targetWordInput.value = savedTargetWords;
        }
        targetWordInput.addEventListener('input', () => {
          const rawVal = Number(targetWordInput.value);
          if (rawVal >= 300) {
            try {
              localStorage.setItem(this.constants.STORAGE_KEYS.TARGET_WORDS, String(Math.min(25000, rawVal)));
            } catch (_) {}
          }
        });
        targetWordInput.addEventListener('change', () => {
          const cleanWords = Math.max(300, Math.min(25000, Number(targetWordInput.value) || 3500));
          targetWordInput.value = String(cleanWords);
          try {
            localStorage.setItem(this.constants.STORAGE_KEYS.TARGET_WORDS, String(cleanWords));
          } catch (_) {}
        });
      }

      // 5b. Tự động lưu & khôi phục Góc nhìn POV (#select-scene-pov) ngay khi gõ
      const scenePovInput = document.getElementById('select-scene-pov');
      if (scenePovInput && !scenePovInput.dataset.noirMod16Bound) {
        scenePovInput.dataset.noirMod16Bound = '1';
        try {
          const savedPov = localStorage.getItem('noir_v36_last_scene_pov_v1');
          if (savedPov && savedPov.trim()) {
            scenePovInput.value = savedPov;
          }
        } catch (_) {}
        const persistPov = () => {
          try {
            localStorage.setItem('noir_v36_last_scene_pov_v1', String(scenePovInput.value || '').trim());
          } catch (_) {}
        };
        scenePovInput.addEventListener('input', persistPov);
        scenePovInput.addEventListener('change', persistPov);
      }

      // 6. Khôi phục & đồng bộ Chế độ Thực thi AI (Mode 1 -> Mode 5)
      if (modeSelect && !modeSelect.dataset.noirMod16Bound) {
        modeSelect.dataset.noirMod16Bound = '1';
        const savedMode = localStorage.getItem(this.constants.STORAGE_KEYS.EXECUTION_MODE);
        if (savedMode && EXECUTION_MODE_SPECIFICATIONS[savedMode]) {
          modeSelect.value = savedMode;
        }
        modeSelect.addEventListener('change', () => {
          const chosenMode = modeSelect.value || 'MODE_1_DRAFT';
          try {
            localStorage.setItem(this.constants.STORAGE_KEYS.EXECUTION_MODE, chosenMode);
          } catch (_) {}
          this.onExecutionModeChanged(chosenMode);
        });
      }

      // 7. Lắng nghe thay đổi trên ô chọn mô hình ở Cửa sổ xác nhận Bước 2 (#confirm-modal-model-select)
      if (confirmModelSelect && !confirmModelSelect.dataset.noirMod16Bound) {
        confirmModelSelect.dataset.noirMod16Bound = '1';
        confirmModelSelect.addEventListener('change', () => {
          const chosenModel = confirmModelSelect.value;
          this.geminiRouter?.setSelectedModel?.(chosenModel);
          this.updateStep2ModelAdvisoryUI(chosenModel);
        });
      }

      // 8. Lắng nghe khi tác giả chỉnh sửa trực tiếp #textarea-synthesized-master-prompt ở Bước 2
      if (synthTextarea && !synthTextarea.dataset.noirMod16Bound) {
        synthTextarea.dataset.noirMod16Bound = '1';
        synthTextarea.addEventListener('input', () => {
          this.lastSynthesizedPrompt = synthTextarea.value;
          const synthStats = document.getElementById('synthesized-prompt-stats');
          if (synthStats) {
            const w = this.utils.countVietnameseWords(synthTextarea.value);
            const estTokens = this.inspector.estimateTokensFromVietnameseWords(w);
            const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
            const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
            synthStats.dataset.i18nIgnore = '1';
            synthStats.textContent = tr(`${fmtNum(w)} từ đã liên kết (~${fmtNum(estTokens)} tokens)`);
          }
        });
      }

      // 9. Gắn thanh công cụ Mẫu câu lệnh nhanh & Lịch sử lệnh ngay dưới ô nhập câu lệnh (nếu chưa gắn)
      this.injectQuickCommandPresetsBarIfNeeded();

      // 10. Gắn nút chuyển nhanh Chế độ 2, nút Mở to/Thu nhỏ & Thu gọn thông số + đồng bộ UX
      this.bindMode2GuidanceAndSwitchLinks();
      this.bindMaximizeAndCollapsibleCommandUI();
      this.refreshCommandModeUX(modeSelect?.value || 'MODE_1_DRAFT');
    }

    /**
     * Nút Mở to / Thu nhỏ Cửa sổ Điều khiển AI (#modal-fullscreen-ai-command)
     * và thu gọn / mở rộng các thanh Thông số & Dữ kiện kết nối.
     */
    bindMaximizeAndCollapsibleCommandUI() {
      const btnMax = document.getElementById('btn-toggle-maximize-ai-command');
      const outer = document.getElementById('modal-fullscreen-ai-command');
      const dialog = document.getElementById('modal-fullscreen-ai-command-dialog');
      if (btnMax && outer && dialog && !btnMax.dataset.noirMod16MaxBound) {
        btnMax.dataset.noirMod16MaxBound = '1';
        let isMax = false;
        try {
          isMax = localStorage.getItem('noir_v39_cmd_modal_maximized') === '1';
        } catch (_) {}
        const applyMax = (maxState) => {
          isMax = Boolean(maxState);
          outer.classList.toggle('p-0', isMax);
          outer.classList.toggle('sm:p-0', isMax);
          outer.classList.toggle('p-1.5', !isMax);
          outer.classList.toggle('sm:p-4', !isMax);
          dialog.classList.toggle('max-w-none', isMax);
          dialog.classList.toggle('w-full', isMax);
          dialog.classList.toggle('h-[100dvh]', isMax);
          dialog.classList.toggle('max-h-[100dvh]', isMax);
          dialog.classList.toggle('rounded-none', isMax);
          dialog.classList.toggle('my-auto', !isMax);
          dialog.classList.toggle('max-w-6xl', !isMax);
          dialog.classList.toggle('max-h-[96dvh]', !isMax);
          dialog.classList.toggle('rounded-2xl', !isMax);
          window.NoirStudio?.navigator?.mobileCompactAdvisor?.applyResponsiveModalMaxHeights?.();
          const trMax = (s) =>
            window.NoirStudio?.i18n?.translateText
              ? window.NoirStudio.i18n.translateText(String(s || ''))
              : String(s || '');
          btnMax.dataset.i18nIgnore = '1';
          btnMax.textContent = trMax(isMax ? '🗗 Thu nhỏ' : '🗖 Mở to');
          btnMax.title = trMax('Phóng to hết màn hình hoặc Thu nhỏ Hộp Điều Khiển AI Tab 3');
          btnMax.setAttribute('aria-pressed', isMax ? 'true' : 'false');
        };
        applyMax(isMax);
        btnMax.addEventListener('click', () => {
          const next = !isMax;
          applyMax(next);
          try {
            localStorage.setItem('noir_v39_cmd_modal_maximized', next ? '1' : '0');
          } catch (_) {}
        });
        window.NoirStudio?.bus?.on?.('i18n:changed', () => {
          const trMax = (s) =>
            window.NoirStudio?.i18n?.translateText
              ? window.NoirStudio.i18n.translateText(String(s || ''))
              : String(s || '');
          const pressed = btnMax.getAttribute('aria-pressed') === 'true';
          btnMax.textContent = trMax(pressed ? '🗗 Thu nhỏ' : '🗖 Mở to');
          btnMax.title = trMax('Phóng to hết màn hình hoặc Thu nhỏ Hộp Điều Khiển AI Tab 3');
        });
      }

      const btnParams = document.getElementById('btn-toggle-cmd-params-drawer');
      const paramsBody = document.getElementById('cmd-params-collapsible-body');
      const paramsSummary = document.getElementById('cmd-params-collapsed-summary');
      const quotaWidget = document.getElementById('ai-realtime-quota-widget');
      if (btnParams && paramsBody && !btnParams.dataset.noirMod16ParamsBound) {
        btnParams.dataset.noirMod16ParamsBound = '1';
        let savedOpen = null;
        try {
          savedOpen = localStorage.getItem('noir_v40_cmd_params_open_v1');
        } catch (_) {}
        let paramsOpen = savedOpen === '1';
        const tr16 = (s) =>
          window.NoirStudio?.i18n?.translateText
            ? window.NoirStudio.i18n.translateText(String(s || ''))
            : String(s || '');
        const applyParams = (open) => {
          paramsOpen = Boolean(open);
          paramsBody.classList.toggle('hidden', !paramsOpen);
          if (quotaWidget) quotaWidget.classList.toggle('hidden', !paramsOpen);
          // Ẩn dòng tóm tắt tĩnh vì 4 ô Chế độ / Mô hình / Số từ / Tư duy luôn hiện trực tiếp ở trên
          if (paramsSummary) paramsSummary.classList.add('hidden');
          btnParams.textContent = tr16(paramsOpen ? '⚙️ Thu gọn Thông số' : '⚙️ Mở rộng Thông số');
          btnParams.setAttribute('aria-expanded', paramsOpen ? 'true' : 'false');
          try {
            localStorage.setItem('noir_v40_cmd_params_open_v1', paramsOpen ? '1' : '0');
          } catch (_) {}
          this.updateCollapsedParamsSummaryText();
        };
        applyParams(paramsOpen);
        btnParams.addEventListener('click', () => applyParams(!paramsOpen));
        window.NoirStudio?.bus?.on?.('i18n:changed', () => {
          btnParams.textContent = tr16(paramsOpen ? '⚙️ Thu gọn Thông số' : '⚙️ Mở rộng Thông số');
        });
      }

      const btnLinks = document.getElementById('btn-toggle-cmd-links-drawer');
      const linksPills = document.getElementById('cmd-mode1-links-pills');
      if (btnLinks && linksPills && !btnLinks.dataset.noirMod16LinksBound) {
        btnLinks.dataset.noirMod16LinksBound = '1';
        let linksOpen = true;
        try {
          const savedLinks = localStorage.getItem('noir_v40_cmd_links_open_v1');
          if (savedLinks === '0') linksOpen = false;
          else if (savedLinks === '1') linksOpen = true;
        } catch (_) {}
        const syncLinksBtn = () => {
          const tr16 = (s) =>
            window.NoirStudio?.i18n?.translateText
              ? window.NoirStudio.i18n.translateText(String(s || ''))
              : String(s || '');
          linksPills.classList.toggle('hidden', !linksOpen);
          btnLinks.dataset.i18nIgnore = '1';
          btnLinks.textContent = tr16(linksOpen ? '▴ Ẩn bớt' : '▾ Hiện chi tiết');
          btnLinks.setAttribute('aria-expanded', linksOpen ? 'true' : 'false');
        };
        syncLinksBtn();
        btnLinks.addEventListener('click', () => {
          linksOpen = !linksOpen;
          try {
            localStorage.setItem('noir_v40_cmd_links_open_v1', linksOpen ? '1' : '0');
          } catch (_) {}
          syncLinksBtn();
        });
        window.NoirStudio?.bus?.on?.('i18n:changed', syncLinksBtn);
      }

      ['select-gemini-model', 'select-ai-thinking-level', 'select-ai-execution-mode'].forEach((id) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.noirMod16SummaryBound) {
          el.dataset.noirMod16SummaryBound = '1';
          el.addEventListener('change', () => this.updateCollapsedParamsSummaryText());
        }
      });
      this.updateCollapsedParamsSummaryText();
    }

    updateCollapsedParamsSummaryText() {
      const el = document.getElementById('cmd-params-collapsed-summary');
      if (!el) return;
      const modeVal = document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
      const modeSpec = EXECUTION_MODE_SPECIFICATIONS[modeVal] || EXECUTION_MODE_SPECIFICATIONS.MODE_1_DRAFT;
      const modelVal = document.getElementById('select-gemini-model')?.value || 'gemini-4-hydrogen';
      const thinkVal = document.getElementById('select-ai-thinking-level')?.value || 'HIGH';
      const wordsVal = document.getElementById('input-target-word-count')?.value || '3500';
      const rawSummary = `${modeSpec.title.split(':')[0]} · 🧪 ${modelVal} · Tư duy ${thinkVal} · ${wordsVal} từ`;
      const tr16 = (s) =>
        window.NoirStudio?.i18n?.translateText
          ? window.NoirStudio.i18n.translateText(String(s || ''))
          : String(s || '');
      el.textContent = tr16(rawSummary);
    }

    /**
     * Lấy nội dung diễn biến cốt truyện đã phát triển tại Chế độ 2 (Tab 3 hoặc bộ nhớ cục bộ)
     */
    getMode2DevelopedOutlineText() {
      const mem = String(
        window.NoirStudio?.tab3Controller?.modeOutputs?.MODE_2_BRAINSTORM || ''
      ).trim();
      if (mem) return mem;
      try {
        return String(localStorage.getItem('noir_v36_mode2_latest_plot_outline') || '').trim();
      } catch (_) {
        return '';
      }
    }

    hasDevelopedMode2Plot() {
      return this.getMode2DevelopedOutlineText().length >= 25;
    }

    bindMode2GuidanceAndSwitchLinks() {
      const bindOnce = (id, fn) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.noirMod16Mode2Bound) return;
        el.dataset.noirMod16Mode2Bound = '1';
        el.addEventListener('click', fn);
      };

      bindOnce('btn-jump-mode2-inline', () => this.switchToMode2AndFocus());
      bindOnce('btn-modal-jump-mode2-link', () => this.switchToMode2AndFocus());
      bindOnce('btn-modal-go-mode2-now', () => this.switchToMode2AndFocus());
      bindOnce('btn-close-mode1-missing-mode2-check', () => {
        document.getElementById('modal-mode1-missing-mode2-check')?.classList.add('hidden');
      });
      bindOnce('btn-modal-proceed-mode1-anyway', async () => {
        document.getElementById('modal-mode1-missing-mode2-check')?.classList.add('hidden');
        await this.runStep1MasterSynthesis(true);
      });
      bindOnce('btn-cmd-mode4-copy-critic-prompt', async () => {
        const btn = document.getElementById('btn-cmd-mode4-copy-critic-prompt');
        const tr16 = (s) =>
          window.NoirStudio?.i18n?.translateText
            ? window.NoirStudio.i18n.translateText(String(s || ''))
            : String(s || '');
        const rawPrompt = String(btn?.textContent || '').replace(/\s+/g, ' ').trim();
        if (!rawPrompt) return;
        await this.utils?.copyTextToClipboard?.(
          rawPrompt,
          tr16('📋 Đã copy câu lệnh gợi ý Chế độ 4! Hãy dán vào ô nhập lệnh bên dưới.')
        );
      });
    }

    switchToMode2AndFocus() {
      document.getElementById('modal-mode1-missing-mode2-check')?.classList.add('hidden');
      document.getElementById('modal-confirm-synthesized-prompt')?.classList.add('hidden');
      document.getElementById('modal-fullscreen-ai-command')?.classList.remove('hidden');

      const modeSelect = document.getElementById('select-ai-execution-mode');
      if (modeSelect) {
        modeSelect.value = 'MODE_2_BRAINSTORM';
        try {
          localStorage.setItem(this.constants.STORAGE_KEYS.EXECUTION_MODE, 'MODE_2_BRAINSTORM');
        } catch (_) {}
      }
      this.onExecutionModeChanged('MODE_2_BRAINSTORM');

      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      const modalBody = document.querySelector('#modal-fullscreen-ai-command-dialog .overflow-y-auto');
      if (modalBody) modalBody.scrollTop = 0;
      if (promptBox) {
        try {
          promptBox.focus({ preventScroll: true });
        } catch (_eFocus) {
          promptBox.focus();
        }
      }
      this.utils?.showToast?.(
        '🧭 Đã chuyển sang Chế độ 2! Hãy liệt kê vài gạch đầu dòng dàn ý thô rồi bảo AI chi tiết hóa nhé.',
        'info',
        4200
      );
    }

    refreshCommandModeUX(explicitModeKey = null) {
      const modeKey =
        explicitModeKey ||
        document.getElementById('select-ai-execution-mode')?.value ||
        'MODE_1_DRAFT';
      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      const tr16 = (s) =>
        window.NoirStudio?.i18n?.translateText
          ? window.NoirStudio.i18n.translateText(String(s || ''))
          : String(s || '');
      const esc16 = this.utils?.escapeHtml ? this.utils.escapeHtml.bind(this.utils) : (v) => String(v || '');
      if (promptBox && MODE_PROMPT_PLACEHOLDERS[modeKey] && !window.NoirStudio?.guestMode?.isActive?.()) {
        promptBox.placeholder = tr16(MODE_PROMPT_PLACEHOLDERS[modeKey]);
      }

      const advisoryDomByMode = {
        MODE_1_DRAFT: 'cmd-mode1-prompt-advisory',
        MODE_2_BRAINSTORM: 'cmd-mode2-outline-advisory',
        MODE_3_AUDIT: 'cmd-mode3-prompt-advisory',
        MODE_4_REVIEW: 'cmd-mode4-prompt-advisory',
        MODE_5_DIAGRAM: 'cmd-mode5-prompt-advisory',
        MODE_6_BOOK_COVER: 'cmd-mode6-book-cover-panel'
      };
      Object.entries(advisoryDomByMode).forEach(([k, domId]) => {
        const el = document.getElementById(domId);
        if (el) el.classList.toggle('hidden', k !== modeKey);
      });

      const isNotebookLmMode =
        modeKey === 'MODE_3_AUDIT' || modeKey === 'MODE_4_REVIEW' || modeKey === 'MODE_5_DIAGRAM';
      const cmdSplitBtn = document.getElementById('btn-cmd-split-gemini');
      if (cmdSplitBtn) {
        cmdSplitBtn.textContent = tr16(
          isNotebookLmMode ? '🪟 Chia đôi màn hình với NotebookLM' : '🪟 Chia đôi màn hình với Gemini'
        );
      }
      const tab3SplitBtn = document.getElementById('btn-tab3-split-gemini');
      if (tab3SplitBtn) {
        tab3SplitBtn.innerHTML = `<span>${esc16(
          tr16(isNotebookLmMode ? '🪟 Chia đôi màn hình với NotebookLM' : '🪟 Chia đôi màn hình với Gemini')
        )}</span>`;
      }

      const hasMode2 = this.hasDevelopedMode2Plot();
      const mode2Pill = document.getElementById('cmd-mode2-plot-pill');
      if (mode2Pill) {
        if (hasMode2) {
          mode2Pill.classList.remove('hidden');
        } else {
          mode2Pill.classList.add('hidden');
        }
      }

      const missingBanner = document.getElementById('cmd-mode1-missing-mode2-banner');
      if (missingBanner) {
        if (modeKey === 'MODE_1_DRAFT' && !hasMode2) {
          missingBanner.classList.remove('hidden');
        } else {
          missingBanner.classList.add('hidden');
        }
      }

      const isMode1 = modeKey === 'MODE_1_DRAFT';
      const isMode5 = modeKey === 'MODE_5_DIAGRAM';
      const isMode6 = modeKey === 'MODE_6_BOOK_COVER';
      const sepBadge = document.getElementById('cmd-mode-separation-badge');
      const mode1Pills = document.getElementById('cmd-mode1-links-pills');
      const sceneMarkerBtn = document.getElementById('btn-cmd-add-scene-marker');
      const runBtn = document.getElementById('btn-run-master-prompt-synthesis');

      if (sepBadge) {
        if (isMode1) {
          sepBadge.textContent = tr16('🔗 Chế độ 1 · Prompt Tổng Hợp đầy đủ Story Bible + Dàn ý Chế độ 2 + Mốc POV');
        } else if (modeKey === 'MODE_2_BRAINSTORM') {
          sepBadge.textContent = tr16('🧭 Chế độ 2 · Tổng hợp Story Bible + Nhân vật + Ma trận + Phục bút + Từ cấm → Tham mưu cốt truyện');
        } else if (modeKey === 'MODE_3_AUDIT') {
          sepBadge.textContent = tr16('🔍 Chế độ 3 · Kiểm toán Logic 30 năm kinh nghiệm (Khuyên dùng NotebookLM)');
        } else if (modeKey === 'MODE_4_REVIEW') {
          sepBadge.textContent = tr16('📊 Chế độ 4 · Nhà Phê Bình 20 năm kinh nghiệm & Beta Reader (Khuyên dùng NotebookLM)');
        } else if (isMode5) {
          sepBadge.textContent = tr16('🎨 Chế độ 5 · Sơ đồ Cốt Truyện, Timeline & Báo cáo Mindmap trên NotebookLM');
        } else {
          sepBadge.textContent = tr16('🖼️ Chế độ 6 · Tạo Bìa Truyện Bằng AI (Bấm "Tạo hình ảnh" trên Gemini Web/App)');
        }
      }
      if (mode1Pills) {
        mode1Pills.classList.toggle('opacity-60', !isMode1 && !isMode5 && modeKey !== 'MODE_2_BRAINSTORM' && !isMode6);
      }
      if (sceneMarkerBtn) {
        sceneMarkerBtn.classList.toggle('hidden', !isMode1 && modeKey !== 'MODE_2_BRAINSTORM');
      }
      if (runBtn) {
        if (isMode1) {
          runBtn.innerHTML = `<span>${esc16(tr16('🚀 Tổng Hợp, Copy & Chạy Viết Truyện (Chế Độ 1)'))}</span>`;
        } else if (modeKey === 'MODE_2_BRAINSTORM') {
          runBtn.innerHTML = `<span>${esc16(tr16('🧭 Tổng Hợp, Copy & Tham Mưu Cốt Truyện (Chế Độ 2)'))}</span>`;
        } else if (modeKey === 'MODE_3_AUDIT') {
          runBtn.innerHTML = `<span>${esc16(tr16('🔍 Tổng Hợp, Copy & Kiểm Toán Logic (Chế Độ 3 · NotebookLM)'))}</span>`;
        } else if (modeKey === 'MODE_4_REVIEW') {
          runBtn.innerHTML = `<span>${esc16(tr16('📊 Tổng Hợp, Copy & Phê Bình Truyện (Chế Độ 4 · NotebookLM)'))}</span>`;
        } else if (isMode5) {
          runBtn.innerHTML = `<span>${esc16(tr16('🎨 Tổng Hợp, Copy & Vẽ Sơ Đồ / Mindmap (Chế Độ 5 · NotebookLM)'))}</span>`;
        } else {
          runBtn.innerHTML = `<span>${esc16(tr16('🖼️ Tổng Hợp, Copy Lệnh Tạo Bìa & Mở Gemini Tạo Ảnh (Chế Độ 6)'))}</span>`;
        }
      }
      this.updateCollapsedParamsSummaryText();
    }

    /**
     * Cập nhật bộ đếm ký tự & số từ tại Cửa sổ điều khiển AI toàn màn hình
     */
    updatePromptCounterUI(rawText) {
      const charCounter = document.getElementById('prompt-char-counter');
      if (!charCounter) return;
      const text = String(rawText || '');
      const chars = text.length;
      const words = this.utils.countVietnameseWords(text);
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      charCounter.dataset.i18nIgnore = '1';
      charCounter.textContent = `${tr(`${fmtNum(words)} từ`)} • ${tr(`${fmtNum(chars)} ký tự`)}`;
    }

    /**
     * Khi tác giả đổi Chế độ Thực thi AI (Mode 1 -> 5), tự động gợi ý thông số
     * nhiệt độ, cập nhật placeholder + ghi chú Chế độ 2 và đồng bộ với bộ chọn ở Tab 3.
     */
    onExecutionModeChanged(modeKey) {
      const spec = EXECUTION_MODE_SPECIFICATIONS[modeKey];
      if (!spec) return;

      this.refreshCommandModeUX(modeKey);

      const tab3Select = document.getElementById('s20-quad-tab-selector');
      if (tab3Select && tab3Select.value !== modeKey) {
        tab3Select.value = modeKey;
      }
    }

    /**
     * Hiển thị thông tin tư vấn chuyên sâu về Mô hình AI ngay trong Cửa sổ xác nhận Bước 2
     * để nhắc tác giả ưu tiên Gemini 3.8 Flash / Gemini 3.1 Pro / Gemini 4 Argon thay vì Flash-Lite.
     */
    updateStep2ModelAdvisoryUI(modelId) {
      const resolvedId =
        modelId ||
        document.getElementById('confirm-modal-model-select')?.value ||
        this.geminiRouter?.selectedModelId ||
        'gemini-4-hydrogen';

      this.geminiRouter?.updateLiteWarningBanner?.(resolvedId);

      const entry = this.geminiRouter?.getModelEntry?.(resolvedId) || {
        id: resolvedId,
        isLite: resolvedId.includes('lite')
      };
      const warnBox = document.getElementById('confirm-model-lite-warning');
      if (warnBox) {
        if (entry.isLite) {
          warnBox.classList.remove('hidden');
        } else {
          warnBox.classList.add('hidden');
        }
      }

      // Cập nhật hộp thông tin chất lượng mô hình nếu có trên giao diện
      let advisoryPill = document.getElementById('mod16-step2-model-advisory-pill');
      const confirmSelect = document.getElementById('confirm-modal-model-select');
      if (!advisoryPill && confirmSelect && confirmSelect.parentElement) {
        advisoryPill = document.createElement('div');
        advisoryPill.id = 'mod16-step2-model-advisory-pill';
        advisoryPill.className =
          'mt-2 p-2.5 rounded-xl border text-[11px] leading-relaxed transition-all';
        confirmSelect.parentElement.appendChild(advisoryPill);
      }

      if (advisoryPill) {
        const guide =
          MODEL_TIER_ADVISORY_GUIDE[resolvedId] ||
          MODEL_TIER_ADVISORY_GUIDE['gemini-4-hydrogen'];
        if (entry.isLite) {
          advisoryPill.className =
            'mt-2 p-2.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-200 text-[11px] leading-relaxed';
        } else {
          advisoryPill.className =
            'mt-2 p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-[11px] leading-relaxed';
        }
        const tr16 = (s) =>
          window.NoirNovel?.i18n?.translateText
            ? window.NoirNovel.i18n.translateText(String(s || ''))
            : String(s || '');
        advisoryPill.dataset.i18nIgnore = '1';
        advisoryPill.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-1 font-extrabold mb-1">
            <span>${this.utils.escapeHtml(tr16(guide.badge))}</span>
            <span class="font-monoCode text-[10px] opacity-90">${this.utils.escapeHtml(
              tr16(guide.speedRating)
            )}</span>
          </div>
          <div class="text-zinc-300">${this.utils.escapeHtml(tr16(guide.recommendationNote))}</div>
        `;
      }
    }

    /**
     * Tích hợp thanh chọn nhanh Mẫu Câu Lệnh Văn Học (Literary Command Presets)
     * và nút Khôi Phục Câu Lệnh Gần Nhất ngay trong #modal-fullscreen-ai-command
     */
    injectQuickCommandPresetsBarIfNeeded() {
      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      if (!promptBox || !promptBox.parentElement) return;
      if (document.getElementById('mod16-literary-presets-toolbar')) return;

      const toolbar = document.createElement('div');
      toolbar.id = 'mod16-literary-presets-toolbar';
      toolbar.className =
        'mt-2.5 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]';

      const presetOptionsHtml = LITERARY_COMMAND_PRESETS.map(
        (p) =>
          `<option value="${this.utils.escapeHtml(p.id)}">${this.utils.escapeHtml(
            p.label
          )}</option>`
      ).join('');

      toolbar.innerHTML = `
        <div class="flex flex-wrap items-center gap-1.5 flex-1 min-w-[240px]">
          <span class="font-bold text-zinc-400 shrink-0">✨ Mẫu lệnh văn học:</span>
          <select id="mod16-select-command-preset" class="bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 font-semibold focus:border-emerald-500 focus:outline-none max-w-full sm:max-w-[330px]">
            <option value="">-- Chọn mẫu chỉ thị sáng tác chuyên sâu --</option>
            ${presetOptionsHtml}
          </select>
          <button id="mod16-btn-insert-preset" type="button" class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold transition">
            ➕ Chèn vào ô lệnh
          </button>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="mod16-btn-restore-last-cmd" type="button" title="Khôi phục câu lệnh vừa dùng gần nhất" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition">
            ↺ Khôi phục lệnh gần nhất
          </button>
        </div>
      `;

      promptBox.parentElement.appendChild(toolbar);
      window.NoirNovel?.i18n?.translateElement?.(toolbar);

      const selectEl = document.getElementById('mod16-select-command-preset');
      const btnInsert = document.getElementById('mod16-btn-insert-preset');
      const btnRestore = document.getElementById('mod16-btn-restore-last-cmd');

      if (btnInsert && selectEl) {
        btnInsert.addEventListener('click', () => {
          const presetId = selectEl.value;
          if (!presetId) {
            this.utils.showToast(
              '💡 Hãy chọn 1 mẫu chỉ thị sáng tác trong danh sách trước khi chèn!',
              'info'
            );
            return;
          }
          this.applyCommandPreset(presetId, true);
        });
      }

      if (btnRestore) {
        btnRestore.addEventListener('click', () => {
          this.restorePreviousCommandIntoTextarea();
        });
      }
    }

    /**
     * Chèn mẫu câu lệnh văn học vào ô nhập câu lệnh hiện tại và đồng bộ ngay lập tức
     */
    applyCommandPreset(presetId, appendMode = true) {
      const preset = LITERARY_COMMAND_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      if (!promptBox) return;

      const currentVal = promptBox.value.trim();
      const nextVal =
        appendMode && currentVal
          ? `${currentVal}\n\n${preset.templateText}`
          : preset.templateText;

      promptBox.value = nextVal;
      promptBox.dispatchEvent(new Event('input', { bubbles: true }));
      this.utils.showToast(`✨ Đã chèn mẫu lệnh: "${preset.label}"`, 'success', 2400);
    }

    /**
     * Khôi phục câu lệnh gần nhất trong lịch sử vào ô #s18-fullscreen-prompt-textarea
     */
    restorePreviousCommandIntoTextarea() {
      const latest = this.commandHistory.getLatestSavedCommand();
      if (!latest) {
        this.utils.showToast('ℹ️ Chưa có lịch sử câu lệnh trước đó để khôi phục.', 'info');
        return;
      }
      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      if (promptBox) {
        promptBox.value = latest;
        promptBox.dispatchEvent(new Event('input', { bubbles: true }));
        this.utils.showToast('↺ Đã khôi phục câu lệnh gần nhất vào ô soạn thảo!', 'success', 2200);
      }
    }

    /**
     * Lấy câu lệnh của tác giả từ mọi nguồn có thể để TUYỆT ĐỐI KHÔNG BAO GIỜ
     * báo lỗi giả "Vui lòng nhập câu lệnh" khi tác giả đã nhập rồi!
     */
    getResolvedUserCommand() {
      // Nguồn 1: Ô nhập câu lệnh chính trong Cửa sổ điều khiển AI (#s18-fullscreen-prompt-textarea)
      const primaryEl = document.getElementById('s18-fullscreen-prompt-textarea');
      const primary = primaryEl?.value || '';
      if (primary.trim()) {
        return primary.trim();
      }

      // Nguồn 2: Ô nhập câu lệnh tại Chế độ 5 Vẽ biểu đồ (#mode5-prompt-input)
      const mode5Box = document.getElementById('mode5-prompt-input')?.value || '';
      if (mode5Box.trim()) {
        if (primaryEl && !primaryEl.value) primaryEl.value = mode5Box.trim();
        return mode5Box.trim();
      }

      // Nguồn 3: Ô nhập dàn ý / beats chương (#textarea-chapter-beats)
      const legacyBeats = document.getElementById('textarea-chapter-beats')?.value || '';
      if (legacyBeats.trim()) {
        if (primaryEl && !primaryEl.value) primaryEl.value = legacyBeats.trim();
        return legacyBeats.trim();
      }

      // Nguồn 4: Bộ nhớ cục bộ tức thời (noir_v36_last_command_prompt)
      const savedLocal = localStorage.getItem('noir_v36_last_command_prompt') || '';
      if (savedLocal.trim()) {
        if (primaryEl && !primaryEl.value) primaryEl.value = savedLocal.trim();
        return savedLocal.trim();
      }

      // Nguồn 5: Beats lưu trong đối tượng chương đang mở (activeChap.beats)
      const activeChap = this.chapterMgr?.getActiveChapter?.();
      if (activeChap && activeChap.beats && String(activeChap.beats).trim()) {
        const chapBeats = String(activeChap.beats).trim();
        if (primaryEl && !primaryEl.value) primaryEl.value = chapBeats;
        return chapBeats;
      }

      // Nguồn 6: Lịch sử câu lệnh gần nhất
      const fromHistory = this.commandHistory.getLatestSavedCommand();
      if (fromHistory) {
        if (primaryEl && !primaryEl.value) primaryEl.value = fromHistory;
        return fromHistory;
      }

      return '';
    }

    /**
     * Xây dựng gói Prompt Tổng Hợp Chính Thức (Master Synthesized Prompt) kết nối 100%:
     * 1. Khung Prompt Hệ Thống của chế độ đang chọn (Chế độ 1 -> 5)
     * 2. Thông số mục tiêu (Số từ, Ngôi kể POV, Nhiệt độ sáng tạo, Chuẩn hội thoại)
     * 3. Toàn bộ Story Bible + Nhân vật + Ma trận Ai Biết Gì + Phục bút + Từ cấm sáo rỗng
     * 4. Toàn bộ Mốc chuyển phân cảnh / Đổi góc nhìn POV
     * 5. Bảng Kiểm Định Tự Động Trước Chuyến Bay (Epistemic & Continuity Guardrails)
     * 6. Ký ức các chương đã duyệt + Đoạn nối tiếp bản thảo hiện tại + BM25 chống quên
     * 7. Câu lệnh cụ thể của tác giả
     */
    buildMasterSynthesizedPrompt() {
      const modeSelect = document.getElementById('select-ai-execution-mode');
      const modeKey = modeSelect?.value || 'MODE_1_DRAFT';
      const modeSpec =
        EXECUTION_MODE_SPECIFICATIONS[modeKey] || EXECUTION_MODE_SPECIFICATIONS.MODE_1_DRAFT;

      const targetWords =
        Number(document.getElementById('input-target-word-count')?.value) ||
        modeSpec.defaultTargetWords ||
        3500;
      const pov =
        document.getElementById('select-scene-pov')?.value ||
        'Ngôi thứ 3 giới hạn (Theo sát nhân vật chính)';
      const temp = document.getElementById('slider-ai-temperature')?.value || '0.85';

      const sysInstruction =
        this.sysPrompts?.getPromptForMode?.(modeKey) || modeSpec.primaryGoal;
      const bibleBlock =
        this.storyBible?.buildCompiledBibleBlockForPrompt?.() ||
        '(Chưa có dữ liệu Story Bible)';
      const sceneMarkersBlock =
        this.sceneBuilder?.buildCompiledSceneMarkersBlockForPrompt?.() ||
        '(Chưa đặt mốc chuyển phân cảnh riêng)';

      const activeChap =
        this.chapterMgr?.syncEditorToActiveChapter?.() ||
        this.chapterMgr?.getActiveChapter?.() || {
          id: 'chap_default',
          displayTitle: 'Chương 1',
          title: 'Chương 1',
          content: ''
        };

      const userCommand = this.getResolvedUserCommand();

      // Truy xuất ký ức chống quên BM25 từ câu lệnh, tên chương và các mốc phân cảnh
      const sceneKeywords = Array.isArray(this.sceneBuilder?.markers)
        ? this.sceneBuilder.markers
            .map((m) => `${m.pov || ''} ${m.location || ''} ${m.goal || ''}`)
            .join(' ')
        : '';
      const ragQuery = `${userCommand} ${activeChap?.displayTitle || ''} ${sceneKeywords}`.trim();
      const ragHits = this.rag?.search ? this.rag.search(ragQuery, 5) : [];
      const ragBlock =
        Array.isArray(ragHits) && ragHits.length > 0
          ? ragHits
              .map(
                (h, i) =>
                  `  • [Ký ức liên quan #${i + 1} từ ${h.chapterTitle}]:\n    "${h.text}"`
              )
              .join('\n')
          : '  (Không có đoạn ký ức BM25 đặc biệt nào cần trích xuất thêm)';

      // Bug 3: Không chèn đoạn [TÓM TẮT CÁC CHƯƠNG ĐÃ DUYỆT TRƯỚC ĐÓ] dư thừa vào Prompt Tổng —
      // toàn bộ Story Bible chính thức (#textarea-rendered-bible-content + Nhân vật + Ma trận) đã được chép thẳng vào `bibleBlock`!
      const approvedSummaries = '';

      // Phân tích đoạn cuối bản thảo hiện tại để nối mạch mượt mà
      const currentText = String(activeChap?.content || '').trim();
      const continuationInfo = this.inspector.buildSeamlessContinuationDirective(currentText);
      const tailContext = continuationInfo.tailExcerpt;

      // Xây dựng bảng kiểm định nhận thức nhân vật & phục bút tự động (Pre-Flight Guardrails)
      const guardrailsBlock = this.inspector.buildEpistemicAndContinuityGuardrails(
        this.storyBible,
        this.sceneBuilder,
        activeChap,
        userCommand
      );

      // Nếu tác giả chưa nhập câu lệnh riêng, tự động tổng hợp chỉ thị thông minh từ Mốc phân cảnh & Story Bible
      const resolvedCommandText =
        userCommand ||
        `Hãy triển khai tiếp diễn biến của "${
          activeChap?.displayTitle || 'Chương hiện tại'
        }" dựa theo các Mốc chuyển phân cảnh, Hồ sơ Story Bible và mạch văn bên trên một cách tự nhiên, sâu sắc và lôi cuốn nhất.`;

      // Khi chạy Chế độ 1 (Viết bản thảo), lồng ghép khéo léo diễn biến cốt truyện đã phát triển tại Chế độ 2 (nếu có)
      const mode2OutlineText =
        modeKey === 'MODE_1_DRAFT' ? this.getMode2DevelopedOutlineText().slice(0, 12000) : '';
      const mode2WeaveSection = mode2OutlineText
        ? [
            ``,
            `====================================================================`,
            `🧭 DIỄN BIẾN & DÀN Ý CỐT TRUYỆN ĐÃ PHÁT TRIỂN Ở CHẾ ĐỘ 2 (LỒNG GHÉP SÂU)`,
            `====================================================================`,
            `Hãy lồng ghép khéo léo và triển khai chậm rãi, giàu chiều sâu tâm lý theo diễn biến cốt truyện từ Chế độ 2 dưới đây kết hợp hài hòa với Story Bible, Mốc chuyển phân cảnh và Câu lệnh bên dưới (tuyệt đối không tua nhanh sự kiện):`,
            mode2OutlineText
          ].join('\n')
        : '';

      const techSpecLines = [
        `- Chương đang thực hiện : ${activeChap?.displayTitle || 'Chương 1'}`,
        `- Chế độ thực thi       : ${modeSpec.title} (${modeKey})`,
        `- Mục tiêu cốt lõi      : ${modeSpec.primaryGoal}`,
        `- Độ dài mục tiêu       : Khoảng ${targetWords.toLocaleString('vi-VN')} từ (Triển khai kỹ lưỡng, giàu chi tiết)`,
        `- Điểm nhìn (POV)       : ${pov}`,
        `- Độ bay bổng (Temp)    : ${temp}`,
        `- Định dạng hội thoại   : Bắt buộc dùng "- Câu thoại (Tên nhân vật)"`,
        `- Hướng dẫn cấu trúc    :`,
        ...modeSpec.outputStructureGuide.map((line) => `  ${line}`)
      ].join('\n');

      // Lưu bảng phân tích dung lượng ngữ cảnh để hiển thị trong Cửa sổ Kiểm tra Ngữ cảnh
      this.lastContextBreakdown = this.inspector.analyzeContextLayers({
        sysInstruction,
        techSpecBlock: techSpecLines,
        bibleBlock,
        sceneMarkersBlock,
        approvedSummariesBlock: mode2OutlineText || approvedSummaries,
        ragBlock,
        tailContextBlock: tailContext,
        userCommandBlock: resolvedCommandText
      });

      const modeSceneWeaveDirective =
        modeKey === 'MODE_2_BRAINSTORM'
          ? [
              ``,
              `====================================================================`,
              `🎬 CHỈ THỊ HỢP NHẤT CHẾ ĐỘ 2 × STORY BIBLE × MỐC PHÂN CẢNH / POV`,
              `====================================================================`,
              `• Khi đề xuất dàn ý & diễn biến cốt truyện ở Chế độ 2, BẮT BUỘC đối chiếu 100% Hồ sơ Story Bible (Ma trận Ai Biết Gì, Sổ cái phục bút) VÀ tuân thủ đúng Mốc chuyển phân cảnh + Điểm nhìn POV [${pov}] đã cài đặt bên dưới.`,
              `• Chia dàn ý rõ ràng theo từng phân cảnh/POV (không tua nhanh, không làm lộ bí mật cho nhân vật chưa biết).`
            ].join('\n')
          : modeKey === 'MODE_1_DRAFT'
            ? [
                ``,
                `====================================================================`,
                `🎬 CHỈ THỊ HỢP NHẤT CHẾ ĐỘ 1 × STORY BIBLE × MỐC PHÂN CẢNH / POV`,
                `====================================================================`,
                `• Khi viết bản thảo Chế độ 1, BẮT BUỘC bám sát 100% Hồ sơ Story Bible, toàn bộ Mốc chuyển phân cảnh / Đổi góc nhìn POV đã cài đặt và Dàn ý Chế độ 2 (nếu có) theo điểm nhìn [${pov}].`
              ].join('\n')
            : '';

      const rawPrompt = [
        `####################################################################`,
        `🌟 PROMPT TỔNG HỢP CHÍNH THỨC (MASTER SYNTHESIZED NOVEL PROMPT)`,
        `####################################################################`,
        ``,
        `=== [PHẦN 1: VAI TRÒ & CHỈ THỊ HỆ THỐNG (${modeKey})] ===`,
        sysInstruction,
        ``,
        `=== [PHẦN 2: THÔNG SỐ KỸ THUẬT & TIÊU CHUẨN ĐẦU RA] ===`,
        techSpecLines,
        modeSceneWeaveDirective,
        ``,
        bibleBlock,
        ``,
        sceneMarkersBlock,
        mode2WeaveSection,
        ``,
        `====================================================================`,
        `🛡️ KIỂM ĐỊNH LOGIC, NHẬN THỨC NHÂN VẬT & PHỤC BÚT TRƯỚC KHI VIẾT`,
        `====================================================================`,
        guardrailsBlock || '• Tuân thủ đầy đủ hồ sơ nhân vật và bối cảnh trong Story Bible.',
        ``,
        `====================================================================`,
        `🔗 NGỮ CẢNH KÝ ỨC CỤC BỘ (BM25 RAG) & ĐOẠN NỐI MẠCH CHƯƠNG HIỆN TẠI`,
        `====================================================================`,
        `[CHI TIẾT KÝ ỨC CỤC BỘ TRÍCH XUẤT THEO NGỮ CẢNH (BM25 RAG)]:`,
        ragBlock,
        ``,
        `[ĐOẠN VĂN CUỐI TRONG BẢN THẢO HIỆN TẠI ĐỂ NỐI MẠCH]:`,
        tailContext,
        `-> Chỉ dẫn nối mạch: ${continuationInfo.continuationHint}`,
        ``,
        `====================================================================`,
        `✍️ YÊU CẦU / CÂU LỆNH SÁNG TÁC CỤ THỂ CỦA TÁC GIẢ CHO CHƯƠNG NÀY`,
        `====================================================================`,
        resolvedCommandText,
        ``,
        `====================================================================`,
        `🚀 CHỈ THỊ BẮT ĐẦU: Hãy thực thi ngay yêu cầu trên với chất lượng văn học cao nhất, tuân thủ 100% Story Bible, Mốc chuyển phân cảnh và Ma trận Ai Biết Gì!`
      ].join('\n');
      const trPrompt = window.NoirNovel?.i18n?.translatePromptFrame;
      return typeof trPrompt === 'function' ? trPrompt(rawPrompt) : rawPrompt;
    }

    /**
     * Mở Cửa sổ Xem Trước Gói Ngữ Cảnh (#modal-context-preview) để tác giả
     * kiểm tra toàn bộ gói dữ liệu trước hoặc trong lúc soạn lệnh.
     */
    openContextPackagePreviewModal() {
      const previewText = this.buildMasterSynthesizedPrompt();
      const previewEl = document.getElementById('pre-context-package-preview');
      if (previewEl) {
        if (this.lastContextBreakdown) {
          const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
          const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
          const headerSummary = [
            tr('📊 THỐNG KÊ GÓI NGỮ CẢNH ĐÃ KẾT NỐI:'),
            tr(`• Tổng số từ ngữ cảnh : ${fmtNum(this.lastContextBreakdown.totalWords)} từ (~${fmtNum(this.lastContextBreakdown.estimatedInputTokens)} tokens)`),
            ...this.lastContextBreakdown.layers.map(
              (l) => `  - ${tr(l.label)}: ${tr(`${fmtNum(l.words)} từ`)} [${tr(l.status)}]`
            ),
            `--------------------------------------------------------------------`,
            ``
          ].join('\n');
          previewEl.textContent = headerSummary + previewText;
        } else {
          previewEl.textContent = previewText;
        }
      }
      const ctxModal = document.getElementById('modal-context-preview');
      ctxModal?.classList.remove('hidden');
      if (ctxModal) window.NoirNovel?.i18n?.translateElement?.(ctxModal);
    }

    /**
     * Nhấn Enter trong ô gõ Prompt Tab 3 để chạy ngay:
     * - Shift+Enter để xuống dòng như bình thường.
     * - Tôn trọng bộ gõ Tiếng Việt IME (isComposing / keyCode 229).
     * - Hiện pop-up xác nhận Có/Không + checkbox "Không nhắc lại hộp thoại này nữa".
     */
    bindEnterToRunPromptWithConfirm() {
      const SKIP_KEY = 'noir_skip_enter_prompt_confirm_v1';
      const modal = document.getElementById('modal-confirm-enter-run-prompt');
      const chkSkipModal = document.getElementById('chk-skip-enter-prompt-confirm');
      const chkAskFooter = document.getElementById('chk-command-ask-before-enter');
      const btnConfirm = document.getElementById('btn-confirm-enter-run-prompt');
      const btnCancel = document.getElementById('btn-cancel-enter-run-prompt');

      const isSkipEnabled = () => {
        try {
          return localStorage.getItem(SKIP_KEY) === '1';
        } catch (_) {
          return false;
        }
      };

      const setSkipEnabled = (skip) => {
        try {
          localStorage.setItem(SKIP_KEY, skip ? '1' : '0');
        } catch (_) {}
        if (chkAskFooter) chkAskFooter.checked = !skip;
        if (chkSkipModal) chkSkipModal.checked = Boolean(skip);
      };

      if (chkAskFooter && !chkAskFooter.dataset.noirEnterSyncBound) {
        chkAskFooter.dataset.noirEnterSyncBound = '1';
        chkAskFooter.checked = !isSkipEnabled();
        chkAskFooter.addEventListener('change', () => {
          setSkipEnabled(!chkAskFooter.checked);
        });
      }

      let pendingAction = null;
      let pendingSourceEl = null;

      const closeConfirmModal = () => {
        modal?.classList.add('hidden');
        const el = pendingSourceEl;
        pendingAction = null;
        pendingSourceEl = null;
        el?.focus?.();
      };

      const executeConfirmedAction = () => {
        if (chkSkipModal?.checked) {
          setSkipEnabled(true);
        }
        const action = pendingAction;
        modal?.classList.add('hidden');
        pendingAction = null;
        pendingSourceEl = null;
        if (typeof action === 'function') action();
      };

      if (modal && !modal.dataset.noirEnterConfirmBound) {
        modal.dataset.noirEnterConfirmBound = '1';
        btnConfirm?.addEventListener('click', executeConfirmedAction);
        btnCancel?.addEventListener('click', closeConfirmModal);
        modal.addEventListener('click', (ev) => {
          if (ev.target === modal) closeConfirmModal();
        });
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeConfirmModal();
          }
        });
      }

      const attachEnterHandler = (textareaEl, onRun) => {
        if (!textareaEl || textareaEl.dataset.noirEnterRunBound === '1') return;
        textareaEl.dataset.noirEnterRunBound = '1';
        textareaEl.addEventListener('keydown', (ev) => {
          if (ev.isComposing || ev.keyCode === 229) return;
          if (ev.key !== 'Enter' || ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) return;

          ev.preventDefault();
          if (isSkipEnabled() || !modal) {
            onRun();
            return;
          }
          if (chkSkipModal) chkSkipModal.checked = false;
          pendingAction = onRun;
          pendingSourceEl = textareaEl;
          modal.classList.remove('hidden');
          btnConfirm?.focus?.();
        });
      };

      const primaryPromptEl = document.getElementById('s18-fullscreen-prompt-textarea');
      attachEnterHandler(primaryPromptEl, () => this.runStep1MasterSynthesis());

      const mode5PromptEl = document.getElementById('mode5-prompt-input');
      attachEnterHandler(mode5PromptEl, () => {
        const m5 = window.NoirStudio?.mode5Studio || window.NoirStudio?.mode5Manager;
        if (m5 && typeof m5.generateDiagramAndTimeline === 'function') {
          m5.generateDiagramAndTimeline();
        } else {
          this.runStep1MasterSynthesis();
        }
      });
    }

    /**
     * BƯỚC 1: Khi tác giả bấm "🚀 Chạy Prompt Tổng Hợp" (#btn-run-master-prompt-synthesis)
     * tại Cửa sổ điều khiển AI (#modal-fullscreen-ai-command):
     * -> Lưu & đồng bộ câu lệnh + Story Bible + Mốc chuyển phân cảnh
     * -> Hiển thị màn hình chờ (#global-ai-blocking-loader)
     * -> Tổng hợp đầy đủ Prompt Tổng Hợp Chính Thức vào #textarea-synthesized-master-prompt
     * -> Mở Cửa sổ Xác nhận Prompt Tổng Hợp & Chọn lại Mô hình lần 2 (#modal-confirm-synthesized-prompt)
     */
    buildStandaloneModePrompt(modeKey, userCommand) {
      const modeSpec =
        EXECUTION_MODE_SPECIFICATIONS[modeKey] || EXECUTION_MODE_SPECIFICATIONS.MODE_2_BRAINSTORM;
      const sysInstruction =
        this.sysPrompts?.getPromptForMode?.(modeKey) || modeSpec.primaryGoal;
      const bibleBlock =
        this.storyBible?.buildCompiledBibleBlockForPrompt?.() ||
        '(Chưa có dữ liệu Story Bible)';
      const activeChap =
        this.chapterMgr?.syncEditorToActiveChapter?.() ||
        this.chapterMgr?.getActiveChapter?.() || {
          id: 'chap_default',
          displayTitle: 'Chương hiện tại',
          content: ''
        };
      const chapText = String(activeChap?.content || '').trim();
      const pov =
        document.getElementById('select-scene-pov')?.value ||
        'Ngôi thứ 3 giới hạn (Theo sát nhân vật chính)';
      const cleanCmd = String(userCommand || '').trim();

      const wrapModePrompt = (lines) => {
        const raw = (Array.isArray(lines) ? lines : [lines]).join('\n');
        const trPrompt = window.NoirNovel?.i18n?.translatePromptFrame;
        return typeof trPrompt === 'function' ? trPrompt(raw) : raw;
      };

      if (modeKey === 'MODE_2_BRAINSTORM') {
        const recentChapterHint = chapText
          ? chapText.slice(-2600)
          : '(Chương hiện tại đang trống)';
        const sceneMarkersBlock =
          this.sceneBuilder?.buildCompiledSceneMarkersBlockForPrompt?.() ||
          '(Chưa đặt mốc chuyển phân cảnh riêng)';
        const guardrailsBlock = this.inspector.buildEpistemicAndContinuityGuardrails(
          this.storyBible,
          this.sceneBuilder,
          activeChap,
          cleanCmd
        );
        return wrapModePrompt([
          `####################################################################`,
          `🧭 CHẾ ĐỘ 2: THAM MƯU CỐT TRUYỆN & THIẾT KẾ DIỄN BIẾN CHUYÊN SÂU`,
          `####################################################################`,
          `[1. KHUNG PROMPT CỐ ĐỊNH & VAI TRÒ THAM MƯU]:`,
          sysInstruction,
          ``,
          `[2. TOÀN BỘ STORY BIBLE, HỒ SƠ NHÂN VẬT, MA TRẬN AI BIẾT GÌ, SỔ CÁI PHỤC BÚT & TỪ CẤM]:`,
          bibleBlock,
          ``,
          sceneMarkersBlock,
          ``,
          `[3. RÀNG BUỘC LOGIC & NHẬN THỨC NHÂN VẬT]:`,
          guardrailsBlock || '• Tuyệt đối tôn trọng Ma trận Ai Biết Gì và tính nhất quán nhân vật.',
          ``,
          `[4. NGỮ CẢNH ĐOẠN CUỐI BẢN THẢO (${activeChap?.displayTitle || 'Chương hiện tại'})]:`,
          recentChapterHint,
          ``,
          `[5. CHƯƠNG ĐANG CHUẨN BỊ / ĐIỂM NHÌN POV]: ${activeChap?.displayTitle || 'Chương tiếp theo'} · POV: ${pov}`,
          `[MỤC TIÊU ĐẦU RA]:`,
          ...modeSpec.outputStructureGuide,
          `- Tuyệt đối triển khai nhịp chậm, giàu căng thẳng tâm lý, không tua nhanh sự kiện hay giải quyết mâu thuẫn hời hợt.`,
          ``,
          `[6. DÀN Ý THÔ / Ý TƯỞNG CỦA TÁC GIẢ]:`,
          cleanCmd || `Hãy phát triển 3 phương án diễn biến chi tiết cho chương tiếp theo khớp 100% Story Bible bên trên (triển khai chậm rãi, gài phục bút tinh tế, không tua nhanh sự kiện).`,
          ``,
          `🚀 Hãy trả lời thành bản tham mưu rõ ràng từng phân cảnh để tác giả chốt và chuyển thẳng sang Chế độ 1 viết tiểu thuyết.`
        ]);
      }

      if (modeKey === 'MODE_3_AUDIT') {
        const excerpt = chapText.length > 14000 ? chapText.slice(-14000) : chapText;
        const chapterInventory = (this.chapterMgr?.chapters || [])
          .map((c, idx) => `  - Chương ${idx + 1}: ${c.displayTitle || c.title} (${c.wordCount || 0} từ · ${c.status === 'APPROVED' ? 'Đã duyệt' : 'Nháp'})`)
          .join('\n');
        return wrapModePrompt([
          `####################################################################`,
          `🔍 CHẾ ĐỘ 3: KIỂM TOÁN LOGIC TOÀN DIỆN (TIỂU THUYẾT GIA 30 NĂM KINH NGHIỆM — KHUYÊN DÙNG GOOGLE NOTEBOOKLM)`,
          `####################################################################`,
          `Bạn là một Tiểu Thuyết Gia & Tổng Biên Tập Kiểm Toán Logic 30 năm kinh nghiệm, cực kỳ khắt khe và tinh mắt như một thám tử pháp y văn bản.`,
          `Nhiệm vụ của bạn là SOI LỖI VÀ BẮT LỖI CỰC KỲ CHI TIẾT toàn bộ bản thảo so với Story Bible và các nguồn chương truyện đã tải lên (không bỏ sót dù chỉ 1 chi tiết nhỏ nhất):`,
          `1. DÒNG THỜI GIAN & ĐỒNG HỒ: Kiểm tra từng giờ, phút, ngày thứ mấy, khoảng cách di chuyển giữa các địa điểm, thời hạn đếm ngược nhiệm vụ — có mốc nào mâu thuẫn hoặc dịch chuyển phi vật lý không?`,
          `2. TÀI SẢN, VẬT PHẨM & THỂ CHẤT: Soi chính xác từng con số tiền bạc (cộng/trừ), vật chứng/USB/điện thoại đang ở đâu, thương tích nhân vật (rạn xương, vết khâu, sức bền) có bị tự nhiên biến mất vô lý không?`,
          `3. MA TRẬN "AI BIẾT GÌ" (EPISTEMIC LEAK): Phát hiện mọi tình huống nhân vật vô tình nói, nghĩ hoặc hành động dựa trên thông tin họ CHƯA ĐƯỢC BIẾT tính đến thời điểm đó.`,
          `4. TÍNH NHẤT QUÁN TÍNH CÁCH (OOC) & XƯNG HÔ: Kiểm tra nhân vật có hành xử trái tính cách gốc, đổi cách xưng hô đột ngột hoặc phản ứng phi tâm lý không.`,
          `5. SỔ CÁI PHỤC BÚT & LỖ HỔNG CỐT TRUYỆN: Liệt kê mọi phục bút bị treo quên, chi tiết mâu thuẫn giữa các chương trước và chương sau.`,
          `6. ĐỀ XUẤT SỬA CỤ THỂ: Với MỖI lỗi phát hiện được, BẮT BUỘC ghi rõ [Mức độ: Nghiêm trọng / Trung bình / Nhỏ] + [Vị trí Chương/Đoạn] + [Phân tích lỗi] + [Cách sửa dứt điểm kèm câu văn mẫu].`,
          ``,
          `[QUY TẮC KIỂM TOÁN BỔ SUNG CỦA STUDIO]:`,
          sysInstruction,
          ``,
          `[DANH SÁCH CHƯƠNG HIỆN CÓ TRONG STUDIO]:`,
          chapterInventory || '  (Chương hiện tại)',
          ``,
          `[STORY BIBLE, NHÂN VẬT, MA TRẬN AI BIẾT GÌ & PHỤC BÚT]:`,
          bibleBlock,
          ``,
          `[NỘI DUNG BẢN THẢO ĐANG KIỂM TRA (${activeChap?.displayTitle || 'Chương hiện tại'})]:`,
          excerpt || '(Bản thảo hiện đang trống — hãy đối chiếu toàn bộ nguồn tài liệu tôi tải lên NotebookLM)',
          ``,
          `[YÊU CẦU KIỂM TOÁN CỤ THỂ CỦA TÁC GIẢ]:`,
          cleanCmd || `Hãy soi lỗi cực kỳ chi tiết như tiểu thuyết gia 30 năm kinh nghiệm toàn bộ logic dòng thời gian, tiền bạc, thương tích, vật chứng, OOC nhân vật và rò rỉ thông tin trong Ma trận Ai Biết Gì.`
        ]);
      }

      if (modeKey === 'MODE_4_REVIEW') {
        const excerpt = chapText.length > 14000 ? chapText.slice(-14000) : chapText;
        return wrapModePrompt([
          `####################################################################`,
          `📊 CHẾ ĐỘ 4: NHÀ PHÊ BÌNH VĂN HỌC 20 NĂM KINH NGHIỆM & HỘI ĐỒNG ĐỘC GIẢ BETA (KHUYÊN DÙNG GOOGLE NOTEBOOKLM)`,
          `####################################################################`,
          `Bạn là 1 nhà phê bình tiểu thuyết, văn học mạng và chính quy 20 năm kinh nghiệm cho các nhà xuất bản lớn. Hãy đọc thật kỹ toàn bộ tài liệu / bản thảo và phân tích thẳng thắn, sắc sảo, không khen xã giao:`,
          `1. HƯỚNG ĐI CỐT TRUYỆN & ĐỘ LÔI CUỐN: Mạch truyện hiện tại đã tối ưu chưa? Có thực sự giữ chân độc giả từ câu mở đầu đến câu kết chương (cliffhanger / hook) không? Đoạn nào bị chùng nhịp hoặc lê thê?`,
          `2. TỐC ĐỘ & TỶ LỆ SỨC MẠNH (POWER SCALING / REALISM): Tốc độ phát triển nhân vật, năng lực, tài chính hay âm mưu có bị "ảo quá", buff quá đà hay giải quyết quá dễ dãi không? Chỉ rõ điểm cần tiết chế để tăng tính chân thực.`,
          `3. CHẤM ĐIỂM 6 TRỤ CỘT VĂN HỌC (Thang 10): Cốt truyện · Tâm lý nhân vật · Nhịp điệu · Hội thoại · Hình ảnh Ngũ quan (Show Don't Tell) · Mức độ chống sáo rỗng AI.`,
          `4. GÓC NHÌN 3 NHÓM ĐỘC GIẢ KHÓ TÍNH: (a) Độc giả mê đấu trí logic; (b) Độc giả thích chiều sâu tâm lý; (c) Độc giả đọc giải trí nhanh trên điện thoại — họ sẽ khen gì và chê/bỏ truyện ở đúng đoạn nào?`,
          `5. ĐỀ XUẤT CẢI THIỆN CỤ THỂ: Chỉ ra ít nhất 5 điểm đắt giá nhất cần nâng cấp ngay kèm ví dụ viết lại mẫu theo đúng văn phong tác giả.`,
          ``,
          `[QUY TẮC BIÊN TẬP & TIÊU CHUẨN VĂN PHONG]:`,
          sysInstruction,
          ``,
          `[STORY BIBLE & BỐI CẢNH ĐỐI CHIẾU]:`,
          bibleBlock,
          ``,
          `[BẢN THẢO / ĐOẠN VĂN CẦN ĐÁNH GIÁ & CHỈNH SỬA (${activeChap?.displayTitle || 'Chương hiện tại'})]:`,
          excerpt || '(Đánh giá dựa trên toàn bộ nguồn chương truyện tôi tải lên Google NotebookLM)',
          ``,
          `[TRỌNG TÂM ĐÁNH GIÁ / GỌT VĂN TÁC GIẢ YÊU CẦU]:`,
          cleanCmd || `Bạn là 1 nhà phê bình tiểu thuyết, văn học mạng và chính quy 20 năm kinh nghiệm cho các nhà xuất bản lớn và phân tích cho tôi hướng đi cốt truyện đã tối ưu chưa, có thực sự lôi cuốn độc giả không, có chỗ nào cần cải thiện để giữ chân người đọc và khiến sức mạnh, tốc độ của cốt truyện không bị ảo quá không?`
        ]);
      }

      if (modeKey === 'MODE_6_BOOK_COVER') {
        const styleKey = this._selectedCoverStyleKey || 'ANIME_LN';
        const styleObj = BOOK_COVER_STYLE_PRESETS[styleKey] || BOOK_COVER_STYLE_PRESETS.ANIME_LN;
        const novelTitle =
          document.getElementById('export-book-title-input')?.value?.trim() ||
          localStorage.getItem('noir_s6_book_title') ||
          'Tiểu thuyết của tôi';
        const authorName =
          document.getElementById('export-author-name-input')?.value?.trim() ||
          localStorage.getItem('noir_s6_author_name') ||
          'Tác giả';
        const bibleExcerpt = String(bibleBlock || '').slice(0, 6500);

        if (styleKey === 'CUSTOM_FREE' && cleanCmd) {
          return wrapModePrompt([
            `🖼️ [CHẾ ĐỘ 6 — TẠO BÌA TRUYỆN TỰ DO BẰNG GEMINI TẠO HÌNH ẢNH]`,
            `Hãy tạo trực tiếp một bức ảnh bìa tiểu thuyết hoàn chỉnh (tỷ lệ dọc 2:3 chuẩn bìa sách xuất bản, độ sắc nét cao, ánh sáng chuyên nghiệp) theo đúng mô tả sau:`,
            ``,
            cleanCmd,
            ``,
            `[THÔNG TIN THAM KHẢO TỪ TRUYỆN]:`,
            `- Tên truyện: ${novelTitle}`,
            `- Bút danh tác giả: ${authorName}`,
            `- Bối cảnh & Nhân vật từ Story Bible (tóm gọn để giữ đúng tạo hình):`,
            bibleExcerpt.slice(0, 2600)
          ]);
        }

        return wrapModePrompt([
          `####################################################################`,
          `🖼️ CHẾ ĐỘ 6: TẠO BÌA TRUYỆN CHUYÊN NGHIỆP BẰNG AI (DÁN VÀO MỤC "TẠO HÌNH ẢNH" CỦA GEMINI)`,
          `####################################################################`,
          `Hãy vẽ trực tiếp một bức ẢNH BÌA TIỂU THUYẾT xuất bản chuyên nghiệp, ấn tượng, chất lượng cực cao dựa trên trọn bộ chủ đề, nhân vật và bối cảnh truyện bên dưới:`,
          ``,
          `1. THÔNG TIN BÌA SÁCH:`,
          `- Tên tác phẩm: "${novelTitle}"`,
          `- Tên tác giả / Bút danh: "${authorName}"`,
          `- Tỷ lệ khung hình: Dọc 2:3 (Book Cover Vertical Poster), bố cục chuẩn xuất bản (chừa vùng không gian thoáng/tương phản đẹp ở 1/3 trên cho tiêu đề và lề dưới cho tên tác giả).`,
          ``,
          `2. PHONG CÁCH NGHỆ THUẬT ĐÃ CHỌN (${styleObj.label}):`,
          styleObj.directive || 'Phong cách minh họa bìa tiểu thuyết xuất bản chuyên nghiệp, ánh sáng điện ảnh, giàu cảm xúc.',
          ``,
          `3. YÊU CẦU THIẾT KẾ CỤ THỂ CỦA TÁC GIẢ:`,
          cleanCmd || `Thiết kế cảnh đắt giá nhất thể hiện linh hồn bộ truyện, nhân vật chính có thần thái cuốn hút, đạo cụ biểu tượng nổi bật và bầu không khí giàu kịch tính.`,
          ``,
          `4. DỮ LIỆU CỐT TRUYỆN, NHÂN VẬT & BỐI CẢNH TỪ STORY BIBLE (ĐỂ VẼ ĐÚNG CHỦ ĐỀ & TẠO HÌNH):`,
          bibleExcerpt,
          ``,
          `🚀 CHỈ THỊ VẼ ẢNH: Vẽ sắc nét, không méo bàn tay/khuôn mặt, ánh sáng có chiều sâu, màu sắc hài hòa đẳng cấp bìa sách bán chạy. Nếu chèn chữ, chỉ chèn chính xác tên tác phẩm hoặc để sạch không chữ rác (no gibberish text).`
        ]);
      }

      const rawMode5 = [
        `####################################################################`,
        `🎨 CHẾ ĐỘ 5: VẼ SƠ ĐỒ CỐT TRUYỆN, TIMELINE & BÁO CÁO MINDMAP TRỰC QUAN (GOOGLE NOTEBOOKLM)`,
        `####################################################################`,
        `[QUY TẮC & VAI TRÒ HỆ THỐNG]:`,
        sysInstruction,
        ``,
        `[YÊU CẦU ĐẶC BIỆT CHO GOOGLE NOTEBOOKLM (BẮT BUỘC THỰC HIỆN)]:`,
        `- Ngoài phần văn bản phân tích dòng thời gian & sơ đồ cốt truyện ở khung chat, HÃY ĐỒNG THỜI TẠO CẤU TRÚC PHÂN NHÁNH CHUẨN ĐỂ HIỂN THỊ THÀNH BÁO CÁO HÌNH ẢNH / MINDMAP / SƠ ĐỒ TRỰC QUAN Ở THANH STUDIO BÊN PHẢI CỦA NOTEBOOKLM!`,
        `- Trình bày rõ 3 lớp trực quan:`,
        `  1. SƠ ĐỒ TRỤC THỜI GIAN HIỆN TẠI (Timeline theo đúng thứ tự Arc → Hồi/Chương → Mốc giờ/ngày → Địa điểm → Bước ngoặt).`,
        `  2. SƠ ĐỒ MẠNG LƯỚI QUAN HỆ & PHE PHÁI NHÂN VẬT (Ai là đồng minh, ai là kẻ thù, ai đang giấu bí mật với ai).`,
        `  3. CÂY PHỤC BÚT & NGÒI NỔ HIỆN TẠI (Nhánh [ĐÃ KÍCH NỔ] vs [ĐANG TREO CHỜ BÙNG NỔ] kèm cảnh báo điểm mâu thuẫn logic nếu có).`,
        `- Đính kèm thêm khối mã sơ đồ Mermaid (flowchart TD / mindmap) để tác giả có thể xem hoặc xuất ảnh trực quan ngay lập tức.`,
        ``,
        `[STORY BIBLE CHÍNH THỨC CẦN LIÊN KẾT & ĐỐI CHIẾU (TAB 4)]:`,
        bibleBlock,
        ``,
        `[YÊU CẦU VẼ SƠ ĐỒ CỐT TRUYỆN CỦA TÁC GIẢ]:`,
        cleanCmd || `Hãy vẽ đúng sơ đồ cốt truyện, sơ đồ timeline đang diễn biến ở hiện tại, mạng lưới nhân vật và tạo thêm báo cáo trực quan / mindmap ở thanh bên NotebookLM dựa trên toàn bộ các chương và Story Bible.`
      ].join('\n');
      const trPrompt = window.NoirNovel?.i18n?.translatePromptFrame;
      return typeof trPrompt === 'function' ? trPrompt(rawMode5) : rawMode5;
    }

    buildSynthesizedPromptForMode(modeKey, resolvedCmd = '') {
      if (modeKey === 'MODE_1_DRAFT') {
        return this.buildMasterSynthesizedPrompt();
      }
      if (modeKey === 'MODE_5_DIAGRAM') {
        const m5Pkg = window.NoirStudio?.mode5Studio?.buildFullMode5PromptForReview?.(resolvedCmd);
        if (m5Pkg && m5Pkg.combinedCopyablePrompt) {
          return m5Pkg.combinedCopyablePrompt;
        }
      }
      return this.buildStandaloneModePrompt(modeKey, resolvedCmd);
    }

    _syncConfirmModalChromeForMode(modeKey) {
      const modeSpec =
        EXECUTION_MODE_SPECIFICATIONS[modeKey] || EXECUTION_MODE_SPECIFICATIONS.MODE_1_DRAFT;
      const titleEl = document.getElementById('confirm-synthesized-modal-title');
      const subEl = document.getElementById('confirm-synthesized-modal-subtitle');
      const backLabel = document.getElementById('label-btn-back-confirm');
      const execLabel = document.getElementById('label-btn-execute-confirm');
      const tr16 = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');

      [titleEl, subEl, backLabel, execLabel].forEach((el) => {
        if (el) el.dataset.i18nIgnore = '1';
      });

      if (modeKey === 'MODE_1_DRAFT') {
        if (titleEl) {
          titleEl.textContent = tr16('✅ Xác Nhận Prompt Tổng Hợp Chính Thức & Chọn Mô Hình Viết Truyện');
        }
        if (subEl) {
          subEl.textContent = tr16(
            'Prompt tổng hợp bên dưới đã được gắn kết đầy đủ: Story Bible + Hồ sơ nhân vật + Ma trận Ai Biết Gì + Phục bút + Mốc chuyển phân cảnh + Câu lệnh của bạn.'
          );
        }
        if (backLabel) backLabel.textContent = tr16('← Quay lại sửa câu lệnh');
        if (execLabel) execLabel.textContent = tr16('✍️ Bắt Đầu Chạy Prompt Chính Thức Để Viết Tiểu Thuyết');
      } else {
        if (titleEl) {
          titleEl.textContent = tr16(`📜 Kiểm Tra Prompt Tổng Hợp — ${modeSpec.title}`);
        }
        if (subEl) {
          subEl.textContent = tr16(
            'Đã tổng hợp đầy đủ khung Prompt hệ thống có sẵn + Story Bible + ngữ cảnh bản thảo + yêu cầu của bạn. Bạn có thể copy toàn bộ sang Gemini hoặc bấm Tiếp tục chạy ngay.'
          );
        }
        if (backLabel) backLabel.textContent = tr16('← Quay lại');
        if (execLabel) execLabel.textContent = tr16(`▶ Tiếp Tục Chạy ${modeSpec.title.split(':')[0]}`);
      }
    }

    openStandaloneModePreRunReviewModal(modeKey, resolvedCmd, chosenModelId, options = {}) {
      if (this.storyBible && typeof this.storyBible.saveAllBibleData === 'function') {
        try {
          const savePromise = this.storyBible.saveAllBibleData(false);
          if (savePromise && typeof savePromise.catch === 'function') savePromise.catch(() => {});
        } catch (_) {}
      }
      this.storyBible?.updateCommandModalStatusPills?.();

      const cleanCmd = String(resolvedCmd || this.getResolvedUserCommand() || '').trim();
      const targetModelId =
        chosenModelId ||
        document.getElementById('select-gemini-model')?.value ||
        this.geminiRouter?.selectedModelId ||
        'gemini-4-hydrogen';
      const completePrompt = this.buildSynthesizedPromptForMode(modeKey, cleanCmd);

      this._pendingModalReviewContext = {
        modeKey,
        resolvedCmd: cleanCmd,
        origin: options.origin || 'COMMAND_MODAL'
      };
      this.lastSynthesizedPrompt = completePrompt;

      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      const synthStats = document.getElementById('synthesized-prompt-stats');
      if (synthTextarea) {
        synthTextarea.dataset.noirUserEdited = '0';
        if (!synthTextarea.dataset.noirUserEditBound) {
          synthTextarea.dataset.noirUserEditBound = '1';
          synthTextarea.addEventListener('input', () => {
            synthTextarea.dataset.noirUserEdited = '1';
          });
        }
        synthTextarea.value = completePrompt;
      }
      if (synthStats) {
        const w = this.utils.countVietnameseWords(completePrompt);
        const estTokens = this.inspector.estimateTokensFromVietnameseWords(w);
        const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
        const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
        synthStats.dataset.i18nIgnore = '1';
        synthStats.textContent = tr(`${fmtNum(w)} từ đã tổng hợp (~${fmtNum(estTokens)} tokens)`);
      }

      this._syncConfirmModalChromeForMode(modeKey);

      const currentThinking =
        modeKey === 'MODE_5_DIAGRAM'
          ? document.getElementById('mode5-thinking-level-select')?.value ||
            this.geminiRouter?.getThinkingLevel?.() ||
            'MEDIUM'
          : document.getElementById('select-ai-thinking-level')?.value ||
            this.geminiRouter?.getThinkingLevel?.() ||
            'MEDIUM';
      this.geminiRouter?.setSelectedModel?.(targetModelId);
      this.geminiRouter?.setThinkingLevel?.(currentThinking);
      this.geminiRouter?.quotaTracker?.renderRealtimeQuotaWidget?.();
      this.updateStep2ModelAdvisoryUI(targetModelId);
      this.ensureStep2EnhancementsMounted();

      document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');
      const confirmModal = document.getElementById('modal-confirm-synthesized-prompt');
      confirmModal?.classList.remove('hidden');
      if (confirmModal) window.NoirNovel?.i18n?.translateElement?.(confirmModal);

      // Tự động copy câu lệnh tổng hợp vào bộ nhớ tạm + cập nhật nhắc chọn mô hình/tư duy + hỏi chia đôi màn hình
      window.NoirStudio?.geminiSplitBridge?.autoCopyAndAnnounceCompiledPrompt?.(completePrompt, modeKey, {
        openFloatingAsk: true
      });
      return completePrompt;
    }

    async executeDirectStandaloneMode(
      modeKey,
      resolvedCmd,
      chosenModelId,
      preSynthesizedPrompt = null,
      overrideThinkingLevel = null
    ) {
      if (this.isExecutingOfficialPrompt) {
        this.utils.showToast('⏳ Lệnh AI đang chạy rồi, vui lòng đợi phản hồi xong nhé...', 'info', 2200);
        return;
      }

      if (modeKey === 'MODE_5_DIAGRAM') {
        document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');
        document.getElementById('modal-confirm-synthesized-prompt')?.classList.add('hidden');
        window.NoirStudio?.tab3Controller?.switchMode?.('MODE_5_DIAGRAM');
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_3_AI');
        await window.NoirStudio?.mode5Studio?.generateDiagramAndTimeline?.(resolvedCmd, chosenModelId, {
          skipPreReview: true,
          preReviewedPrompt: preSynthesizedPrompt || '',
          overrideThinkingLevel
        });
        return;
      }

      const modeSpec =
        EXECUTION_MODE_SPECIFICATIONS[modeKey] || EXECUTION_MODE_SPECIFICATIONS.MODE_2_BRAINSTORM;
      const standalonePrompt =
        preSynthesizedPrompt && String(preSynthesizedPrompt).trim()
          ? String(preSynthesizedPrompt).trim()
          : this.buildStandaloneModePrompt(modeKey, resolvedCmd);
      const startTime = Date.now();
      const activeChap = this.chapterMgr?.getActiveChapter?.();
      const temperature =
        Number(document.getElementById('slider-ai-temperature')?.value) ||
        (modeKey === 'MODE_3_AUDIT' ? 0.45 : modeKey === 'MODE_4_REVIEW' ? 0.72 : 0.9);
      const thinkingLevel =
        overrideThinkingLevel ||
        document.getElementById('confirm-modal-thinking-select')?.value ||
        document.getElementById('select-ai-thinking-level')?.value ||
        this.geminiRouter?.getThinkingLevel?.() ||
        'HIGH';
      const enableWebSearch = Boolean(
        document.getElementById('checkbox-ai-web-search')?.checked ||
        this.geminiRouter?.isWebSearchEnabled?.()
      );

      this.isExecutingOfficialPrompt = true;
      let safetyTimer = null;
      try {
        this.utils.showBlockingLoader(
          `⚡ Đang Chạy ${modeSpec.title} trên ${chosenModelId}...`,
          'Chế độ tách biệt đang xử lý yêu cầu chuyên môn mà không trộn lẫn với Prompt Tổng Hợp của Chế độ 1.'
        );

        const timeoutPromise = new Promise((_, reject) => {
          safetyTimer = setTimeout(() => {
            reject(new Error('Quá thời gian chờ phản hồi từ Gemini (120 giây).'));
          }, 120000);
        });

        const result = await Promise.race([
          this.geminiRouter.generateTextWithFallback({
            prompt: standalonePrompt,
            systemInstruction:
              preSynthesizedPrompt && String(preSynthesizedPrompt).trim()
                ? ''
                : this.sysPrompts?.getPromptForMode?.(modeKey) || '',
            modelId: chosenModelId,
            temperature,
            maxOutputTokens: 8192,
            thinkingLevel,
            enableWebSearch
          }),
          timeoutPromise
        ]);

        const antiClicheList = this.storyBible?.antiClicheList || [];
        const processed = this.postProcessor.processAndInspectOutput(
          result.text,
          modeKey,
          antiClicheList
        );
        const finalOutputText = processed.text || result.text;
        const outWords = processed.stats.wordCount;

        this.telemetry.recordExecution({
          modeKey,
          modelId: chosenModelId,
          usedEndpoint: result.usedEndpoint || chosenModelId,
          chapterTitle: activeChap?.displayTitle || activeChap?.title || 'Chương hiện tại',
          promptWords: this.utils.countVietnameseWords(standalonePrompt),
          outputWords: outWords,
          durationMs: Date.now() - startTime,
          status: 'SUCCESS'
        });

        this.utils.hideBlockingLoader();
        document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');

        window.NoirStudio?.tab3Controller?.setOutputForMode?.(modeKey, finalOutputText, {
          notifyNew: true,
          usedEndpoint: result.usedEndpoint || chosenModelId,
          wordCount: outWords
        });
        window.NoirStudio?.tab3Controller?.switchMode?.(modeKey);
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_3_AI');

        const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
        if (modeKey === 'MODE_2_BRAINSTORM') {
          this.utils.showToast(
            `🧭 Đã tham mưu xong (${fmtNum(outWords)} từ)! Diễn biến đã tự động liên kết sang Chế độ 1 để viết chương.`,
            'success',
            5600
          );
        } else {
          this.utils.showToast(
            `✅ Đã xong ${modeSpec.title} (${fmtNum(outWords)} từ)!`,
            'success',
            5000
          );
        }
      } catch (err) {
        this.utils.hideBlockingLoader();
        this.utils.showToast(`❌ Lỗi khi chạy ${modeSpec.title}: ${err.message || err}`, 'error', 5200);
      } finally {
        if (safetyTimer) clearTimeout(safetyTimer);
        this.isExecutingOfficialPrompt = false;
      }
    }

    async runStep1MasterSynthesis(bypassMode2Check = false, bypassStaleWarn = false) {
      if (this.isSynthesizing) return;
      this.isSynthesizing = true;

      try {
        const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
        const resolvedCmd = this.getResolvedUserCommand();
        const currentModeKey =
          document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
        const currentModel =
          document.getElementById('select-gemini-model')?.value ||
          this.geminiRouter?.selectedModelId ||
          'gemini-4-hydrogen';

        // Kiểm tra cảnh báo khi nội dung chương truyện vừa thay đổi mà Story Bible / Chế độ 2 chưa cập nhật
        const syncTracker = window.NoirStudio?.manuscriptSyncTracker;
        if (!bypassStaleWarn && syncTracker) {
          if (currentModeKey === 'MODE_1_DRAFT' && syncTracker.shouldWarnMode1Stale()) {
            this.isSynthesizing = false;
            syncTracker.openMode1StaleWarningModal(() => {
              this.runStep1MasterSynthesis(bypassMode2Check, true);
            });
            return;
          }
          if (currentModeKey === 'MODE_2_BRAINSTORM' && syncTracker.shouldWarnMode2Stale()) {
            this.isSynthesizing = false;
            syncTracker.openMode2StaleWarningModal(() => {
              this.runStep1MasterSynthesis(bypassMode2Check, true);
            });
            return;
          }
        }

        // Chế độ 2, 3, 4, 5, 6: mở màn hình kiểm tra Prompt Tổng Hợp riêng biệt + tự động copy câu lệnh + gợi ý Chia đôi màn hình Gemini/NotebookLM
        if (currentModeKey !== 'MODE_1_DRAFT') {
          if (resolvedCmd) {
            try {
              localStorage.setItem('noir_v36_last_command_prompt', resolvedCmd);
            } catch (_) {}
          }
          if (currentModeKey === 'MODE_2_BRAINSTORM') {
            syncTracker?.markMode2UpdatedNow?.();
          }
          await this.openStandaloneModePreRunReviewModal(currentModeKey, resolvedCmd, currentModel, {
            origin: 'COMMAND_MODAL'
          });
          return;
        }

        // Kiểm tra trước khi duyệt Prompt Chế độ 1: nếu Chế độ 2 chưa có diễn biến cốt truyện -> gợi ý chuyển qua Chế độ 2
        if (
          currentModeKey === 'MODE_1_DRAFT' &&
          !bypassMode2Check &&
          !this.hasDevelopedMode2Plot()
        ) {
          this.bindMode2GuidanceAndSwitchLinks();
          this.refreshCommandModeUX('MODE_1_DRAFT');
          const checkModal = document.getElementById('modal-mode1-missing-mode2-check');
          if (checkModal) {
            checkModal.classList.remove('hidden');
            return;
          }
        }

        if (promptBox && resolvedCmd && !promptBox.value.trim()) {
          promptBox.value = resolvedCmd;
        }

        if (resolvedCmd) {
          try {
            localStorage.setItem('noir_v36_last_command_prompt', resolvedCmd);
          } catch (_) {}
          const activeChap = this.chapterMgr?.getActiveChapter?.();
          const modeKey =
            document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
          const modelId =
            document.getElementById('select-gemini-model')?.value ||
            this.geminiRouter?.selectedModelId ||
            'gemini-4-hydrogen';
          const targetWords =
            Number(document.getElementById('input-target-word-count')?.value) || 3500;

          this.commandHistory.recordCommandSnapshot({
            commandText: resolvedCmd,
            modeKey,
            chapterId: activeChap?.id || null,
            chapterTitle: activeChap?.displayTitle || activeChap?.title || '',
            modelId,
            targetWords
          });
        }

        // Đồng bộ Story Bible và các mốc chuyển cảnh mới nhất trước khi tổng hợp
        if (this.storyBible && typeof this.storyBible.saveAllBibleData === 'function') {
          await this.storyBible.saveAllBibleData(false);
        }

        this.utils.showBlockingLoader(
          '⏳ Đang Tổng Hợp Prompt Tổng Chính Thức (Bước 1/2)...',
          'Đang liên kết 100% Story Bible, Hồ sơ nhân vật, Ma trận Ai Biết Gì, Mốc chuyển phân cảnh, Ký ức BM25 và Câu lệnh của bạn. Vui lòng kiên nhẫn chờ, KHÔNG tắt trang web hay thoát khỏi màn hình này để chạy Prompt ổn định...'
        );

        await new Promise((r) => setTimeout(r, 120));

        const synthesized = this.buildMasterSynthesizedPrompt();
        this.lastSynthesizedPrompt = synthesized;

        const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
        const synthStats = document.getElementById('synthesized-prompt-stats');
        if (synthTextarea) {
          synthTextarea.dataset.noirUserEdited = '0';
          if (!synthTextarea.dataset.noirUserEditBound) {
            synthTextarea.dataset.noirUserEditBound = '1';
            synthTextarea.addEventListener('input', () => {
              synthTextarea.dataset.noirUserEdited = '1';
            });
          }
          synthTextarea.value = synthesized;
        }
        if (synthStats) {
          const w = this.utils.countVietnameseWords(synthesized);
          const estTokens = this.inspector.estimateTokensFromVietnameseWords(w);
          const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
          const tr = (s) => (window.NoirStudio?.i18n?.translateText ? window.NoirStudio.i18n.translateText(String(s || '')) : String(s || ''));
          synthStats.dataset.i18nIgnore = '1';
          synthStats.textContent = tr(`${fmtNum(w)} từ đã liên kết (~${fmtNum(estTokens)} tokens)`);
        }

        // Đồng bộ mô hình, mức độ tư duy & hạn mức sang cửa sổ xác nhận lần 2 và hiển thị khuyến cáo Flash/Pro vs Flash-Lite
        const currentThinking =
          document.getElementById('select-ai-thinking-level')?.value ||
          this.geminiRouter?.getThinkingLevel?.() ||
          'MEDIUM';
        this.geminiRouter?.setSelectedModel?.(currentModel);
        this.geminiRouter?.setThinkingLevel?.(currentThinking);
        this.geminiRouter?.quotaTracker?.renderRealtimeQuotaWidget?.();
        this.updateStep2ModelAdvisoryUI(currentModel);

        this.utils.hideBlockingLoader();
        this._pendingModalReviewContext = {
          modeKey: 'MODE_1_DRAFT',
          resolvedCmd,
          origin: 'COMMAND_MODAL'
        };
        this._syncConfirmModalChromeForMode('MODE_1_DRAFT');
        this.ensureStep2EnhancementsMounted();
        document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');
        const confirmModal = document.getElementById('modal-confirm-synthesized-prompt');
        confirmModal?.classList.remove('hidden');
        if (confirmModal) window.NoirNovel?.i18n?.translateElement?.(confirmModal);

        // Tự động copy Prompt Tổng Hợp Chế độ 1 + thông báo nhắc chọn mô hình/tư duy + cửa sổ nổi chia đôi màn hình Gemini
        window.NoirStudio?.geminiSplitBridge?.autoCopyAndAnnounceCompiledPrompt?.(synthesized, 'MODE_1_DRAFT', {
          openFloatingAsk: true
        });
      } catch (err) {
        this.utils.hideBlockingLoader();
        this.utils.showToast(
          `❌ Có lỗi khi tổng hợp Prompt Tổng: ${err.message || err}`,
          'error',
          4500
        );
      } finally {
        this.isSynthesizing = false;
      }
    }

    /**
     * BƯỚC 2: Khi tác giả đã kiểm tra/chỉnh sửa Prompt Tổng Hợp, chọn lại Mô hình ở
     * cửa sổ xác nhận (#confirm-modal-model-select) và bấm
     * "✍️ Bắt Đầu Chạy Prompt Chính Thức Để Viết Tiểu Thuyết" (#btn-execute-official-novel-prompt)
     */
    async executeStep2OfficialNovelPrompt() {
      if (this.isExecutingOfficialPrompt) {
        this.utils.showToast('⏳ Lệnh AI đang chạy rồi, vui lòng đợi phản hồi xong nhé...', 'info', 2200);
        return;
      }

      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      const finalMasterPrompt = (
        synthTextarea?.value ||
        this.lastSynthesizedPrompt ||
        this.buildMasterSynthesizedPrompt() ||
        ''
      ).trim();

      if (!finalMasterPrompt) {
        this.utils.showToast('⚠️ Prompt Tổng Hợp đang trống!', 'warning');
        return;
      }

      const runBtn = document.getElementById('btn-execute-official-novel-prompt');
      const origRunBtnHtml = runBtn ? runBtn.innerHTML : '';

      const chosenModelId =
        document.getElementById('confirm-modal-model-select')?.value ||
        this.geminiRouter?.selectedModelId ||
        'gemini-4-hydrogen';
      this.geminiRouter?.setSelectedModel?.(chosenModelId);

      const modeKey =
        this._pendingModalReviewContext?.modeKey ||
        document.getElementById('select-ai-execution-mode')?.value ||
        'MODE_1_DRAFT';
      const temperature =
        Number(document.getElementById('slider-ai-temperature')?.value) || 0.85;
      const chosenThinkingLevel =
        document.getElementById('confirm-modal-thinking-select')?.value ||
        document.getElementById('select-ai-thinking-level')?.value ||
        this.geminiRouter?.getThinkingLevel?.() ||
        'MEDIUM';

      // Chế độ 2, 3, 4: sau khi tác giả xem / copy / bấm Tiếp tục trên màn hình Prompt Tổng Hợp
      if (
        modeKey === 'MODE_2_BRAINSTORM' ||
        modeKey === 'MODE_3_AUDIT' ||
        modeKey === 'MODE_4_REVIEW'
      ) {
        document.getElementById('modal-confirm-synthesized-prompt')?.classList.add('hidden');
        const resolvedCmd =
          this._pendingModalReviewContext?.resolvedCmd ?? this.getResolvedUserCommand();
        await this.executeDirectStandaloneMode(
          modeKey,
          resolvedCmd,
          chosenModelId,
          finalMasterPrompt,
          chosenThinkingLevel
        );
        return;
      }

      // Chế độ 5 (Vẽ biểu đồ): truyền prompt đã rà soát + skipPreReview=true vào bộ xử lý Chế độ 5 tại Tab 3
      if (modeKey === 'MODE_5_DIAGRAM') {
        document.getElementById('modal-confirm-synthesized-prompt')?.classList.add('hidden');
        window.NoirStudio?.tab3Controller?.switchMode?.('MODE_5_DIAGRAM');
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_3_AI');
        const resolvedCmd =
          this._pendingModalReviewContext?.resolvedCmd ?? this.getResolvedUserCommand();
        await window.NoirStudio?.mode5Studio?.generateDiagramAndTimeline?.(
          resolvedCmd,
          chosenModelId,
          {
            skipPreReview: true,
            preReviewedPrompt: finalMasterPrompt,
            overrideThinkingLevel: chosenThinkingLevel
          }
        );
        return;
      }

      this.isExecutingOfficialPrompt = true;
      if (runBtn) {
        runBtn.disabled = true;
        const trSend = window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText('⏳ Đang gửi Prompt lên Gemini AI...')
          : '⏳ Đang gửi Prompt lên Gemini AI...';
        runBtn.innerHTML = trSend;
      }

      const startTime = Date.now();
      const activeChap = this.chapterMgr?.getActiveChapter?.();
      const modelEntry = this.geminiRouter?.getModelEntry?.(chosenModelId) || {
        id: chosenModelId,
        label: chosenModelId
      };

      this.utils.showBlockingLoader(
        `✍️ Đang Chạy Prompt Chính Thức Trên ${modelEntry.id} (Bước 2/2)...`,
        'AI đang sáng tác dựa trên toàn bộ Story Bible, Mốc chuyển phân cảnh và Câu lệnh của bạn. Vui lòng kiên nhẫn chờ, KHÔNG tắt trang web hay thoát khỏi màn hình này để Prompt chạy ổn định...'
      );

      let safetyFailsafeTimer = null;
      try {
        const enableWebSearch = Boolean(
          document.getElementById('checkbox-ai-web-search')?.checked ||
          this.geminiRouter?.isWebSearchEnabled?.()
        );

        const timeoutPromise = new Promise((_, reject) => {
          safetyFailsafeTimer = setTimeout(() => {
            reject(new Error('Quá thời gian chờ phản hồi từ Gemini (120 giây). Hãy bấm thử lại hoặc copy câu lệnh sang Gemini Web.'));
          }, 120000);
        });

        const result = await Promise.race([
          this.geminiRouter.generateTextWithFallback({
            prompt: finalMasterPrompt,
            systemInstruction: this.sysPrompts?.getPromptForMode?.(modeKey) || '',
            modelId: chosenModelId,
            temperature,
            maxOutputTokens: 8192,
            thinkingLevel: chosenThinkingLevel,
            enableWebSearch
          }),
          timeoutPromise
        ]);

        // Hậu xử lý & chuẩn hóa định dạng câu thoại tiểu thuyết tiếng Việt
        const antiClicheList = this.storyBible?.antiClicheList || [];
        const processed = this.postProcessor.processAndInspectOutput(
          result.text,
          modeKey,
          antiClicheList
        );
        const finalOutputText = processed.text || result.text;

        const durationMs = Date.now() - startTime;
        const promptWords = this.utils.countVietnameseWords(finalMasterPrompt);
        const outWords = processed.stats.wordCount;

        this.telemetry.recordExecution({
          modeKey,
          modelId: chosenModelId,
          usedEndpoint: result.usedEndpoint || chosenModelId,
          chapterTitle: activeChap?.displayTitle || activeChap?.title || 'Chương hiện tại',
          promptWords,
          outputWords: outWords,
          durationMs,
          status: 'SUCCESS'
        });

        this.utils.hideBlockingLoader();
        document.getElementById('modal-confirm-synthesized-prompt')?.classList.add('hidden');

        // Đưa đầu ra mới nhất thẳng vào Cửa sổ Đầu ra ở Tab 3, bật thông báo gây chú ý & mở ngay Tab 3
        window.NoirStudio?.tab3Controller?.setOutputForMode?.(modeKey, finalOutputText, {
          notifyNew: true,
          usedEndpoint: result.usedEndpoint || chosenModelId,
          wordCount: outWords
        });
        window.NoirStudio?.tab3Controller?.switchMode?.(modeKey);
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_3_AI');

        const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
        this.utils.showToast(
          `🎉 Đã xong (${fmtNum(outWords)} từ)! Kết quả mới nhất đã hiển thị ở Tab 3 — hoặc chọn lại từ Lịch sử đầu ra góc dưới.`,
          'success',
          5600
        );
      } catch (err) {
        const durationMs = Date.now() - startTime;
        this.telemetry.recordExecution({
          modeKey,
          modelId: chosenModelId,
          usedEndpoint: chosenModelId,
          chapterTitle: activeChap?.displayTitle || activeChap?.title || 'Chương hiện tại',
          promptWords: this.utils.countVietnameseWords(finalMasterPrompt),
          outputWords: 0,
          durationMs,
          status: 'ERROR',
          errorMessage: err.message || String(err)
        });

        this.utils.hideBlockingLoader();
        this.utils.showToast(`❌ Lỗi khi chạy AI: ${err.message}`, 'error', 5200);

        // Bug 13: Khi mô hình Pro / Argon 4 hoặc key gặp lỗi/hết hạn mức -> hiện bảng hướng dẫn Copy câu lệnh dán thẳng vào Gemini Web
        if (typeof this.geminiRouter?.showGeminiWebFallbackNoticeModal === 'function') {
          this.geminiRouter.showGeminiWebFallbackNoticeModal({
            promptText: finalMasterPrompt,
            modelId: chosenModelId,
            errorMessage: err.message || String(err),
            onFallbackFlashRetry: () => {
              const sel = document.getElementById('confirm-modal-model-select');
              if (sel) sel.value = 'gemini-3.8-flash';
              this.geminiRouter?.setSelectedModel?.('gemini-3.8-flash');
              this.executeStep2OfficialNovelPrompt();
            }
          });
        }
      } finally {
        clearTimeout(safetyFailsafeTimer);
        this.isExecutingOfficialPrompt = false;
        if (runBtn) {
          runBtn.disabled = false;
          const trFallback = window.NoirNovel?.i18n?.translateText
            ? window.NoirNovel.i18n.translateText('✍️ Bắt Đầu Chạy Prompt Chính Thức Để Viết Tiểu Thuyết')
            : '✍️ Bắt Đầu Chạy Prompt Chính Thức Để Viết Tiểu Thuyết';
          runBtn.innerHTML = origRunBtnHtml || trFallback;
          const curMode = this._pendingModalReviewContext?.modeKey || 'MODE_1_DRAFT';
          this._syncConfirmModalChromeForMode(curMode);
        }
      }
    }

    /**
     * Tích hợp thanh công cụ kiểm soát chuyên sâu cho Cửa sổ Xác nhận Bước 2
     * (#modal-confirm-synthesized-prompt): Sao chép nhanh Prompt Tổng, Tải xuống
     * file .TXT dự phòng, Làm mới lại từ Story Bible, và Chẩn đoán chất lượng Prompt.
     */
    injectStep2SurgicalControlsIfNeeded() {
      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      if (!synthTextarea || !synthTextarea.parentElement) return;
      if (document.getElementById('mod16-step2-surgical-toolbar')) return;

      const bar = document.createElement('div');
      bar.id = 'mod16-step2-surgical-toolbar';
      bar.className =
        'mt-2 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]';

      bar.innerHTML = `
        <div class="flex flex-wrap items-center gap-1.5">
          <button id="mod16-btn-copy-synth-prompt" type="button" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition">
            📋 Sao chép Prompt Tổng
          </button>
          <button id="mod16-btn-export-synth-txt" type="button" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition">
            💾 Tải file .TXT
          </button>
          <button id="mod16-btn-rebuild-fresh-synth" type="button" class="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold transition">
            🔄 Tổng hợp lại từ đầu
          </button>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="mod16-btn-run-prompt-diagnostics" type="button" class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold transition">
            🩺 Kiểm định độ phủ ngữ cảnh
          </button>
        </div>
      `;

      synthTextarea.parentElement.appendChild(bar);
      this.refreshStep2ToolbarLabels();

      document
        .getElementById('mod16-btn-copy-synth-prompt')
        ?.addEventListener('click', () => this.copySynthesizedPromptToClipboard());
      document
        .getElementById('mod16-btn-export-synth-txt')
        ?.addEventListener('click', () => this.exportSynthesizedPromptToFile());
      document
        .getElementById('mod16-btn-rebuild-fresh-synth')
        ?.addEventListener('click', () => this.resetSynthesizedPromptToFreshBuild());
      document
        .getElementById('mod16-btn-run-prompt-diagnostics')
        ?.addEventListener('click', () => this.runDeepPromptDiagnostics());
    }

    refreshStep2ToolbarLabels() {
      const tr = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      const labels = {
        'mod16-btn-copy-synth-prompt': '📋 Sao chép Prompt Tổng',
        'mod16-btn-export-synth-txt': '💾 Tải file .TXT',
        'mod16-btn-rebuild-fresh-synth': '🔄 Tổng hợp lại từ đầu',
        'mod16-btn-run-prompt-diagnostics': '🩺 Kiểm định độ phủ ngữ cảnh'
      };
      for (const [id, rawLabel] of Object.entries(labels)) {
        const el = document.getElementById(id);
        if (el) {
          el.dataset.i18nIgnore = '1';
          el.textContent = tr(rawLabel);
        }
      }
    }

    refreshConfirmModalI18n() {
      const modal = document.getElementById('modal-confirm-synthesized-prompt');
      if (!modal || modal.classList.contains('hidden')) return;
      const modeKey =
        this._pendingModalReviewContext?.modeKey ||
        document.getElementById('select-ai-execution-mode')?.value ||
        'MODE_1_DRAFT';
      this._syncConfirmModalChromeForMode(modeKey);
      this.updateStep2ModelAdvisoryUI(
        document.getElementById('confirm-modal-model-select')?.value ||
          this.geminiRouter?.selectedModelId
      );
      this.refreshStep2ToolbarLabels();
      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      const synthStats = document.getElementById('synthesized-prompt-stats');
      if (synthTextarea && synthTextarea.dataset.noirUserEdited !== '1') {
        const resolvedCmd = this._pendingModalReviewContext?.resolvedCmd ?? this.getResolvedUserCommand?.() ?? '';
        const rebuilt = this.buildSynthesizedPromptForMode(modeKey, resolvedCmd);
        synthTextarea.value = rebuilt;
        this.lastSynthesizedPrompt = rebuilt;
        if (synthStats) {
          const w = this.utils.countVietnameseWords(rebuilt);
          const estTokens = this.inspector.estimateTokensFromVietnameseWords(w);
          const fmtNum = (n) =>
            window.NoirStudio?.i18n?.formatNumber
              ? window.NoirStudio.i18n.formatNumber(n)
              : Number(n || 0).toLocaleString('vi-VN');
          const tr = (s) =>
            window.NoirStudio?.i18n?.translateText
              ? window.NoirStudio.i18n.translateText(String(s || ''))
              : String(s || '');
          synthStats.dataset.i18nIgnore = '1';
          synthStats.textContent = tr(`${fmtNum(w)} từ đã liên kết (~${fmtNum(estTokens)} tokens)`);
        }
      }
      window.NoirNovel?.i18n?.translateElement?.(modal);
    }

    /**
     * Sao chép toàn bộ Prompt Tổng Hợp Chính Thức vào khay nhớ tạm
     */
    async copySynthesizedPromptToClipboard() {
      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      const text = (synthTextarea?.value || this.lastSynthesizedPrompt || '').trim();
      if (!text) {
        this.utils.showToast('⚠️ Chưa có nội dung Prompt Tổng Hợp để sao chép.', 'warning');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        this.utils.showToast(
          '📋 Đã sao chép toàn bộ Prompt Tổng Hợp Chính Thức vào khay nhớ tạm!',
          'success'
        );
      } catch (_) {
        this.utils.showToast('📋 Đã sao chép Prompt Tổng Hợp!', 'success');
      }
    }

    /**
     * Xuất gói Prompt Tổng Hợp Chính Thức thành tệp văn bản (.TXT) để lưu trữ độc lập
     */
    exportSynthesizedPromptToFile() {
      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      const text = (
        synthTextarea?.value ||
        this.lastSynthesizedPrompt ||
        this.buildMasterSynthesizedPrompt()
      ).trim();
      if (!text) {
        this.utils.showToast('⚠️ Prompt Tổng Hợp đang trống!', 'warning');
        return;
      }
      const activeChap = this.chapterMgr?.getActiveChapter?.();
      const safeTitle = String(activeChap?.displayTitle || 'Chuong_Hien_Tai')
        .replace(/[\\/:*?"<>|]+/g, '_')
        .replace(/\s+/g, '_');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Prompt_Tong_Hop_${safeTitle}_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.utils.showToast('💾 Đã tải xuống tệp Prompt Tổng Hợp (.TXT)!', 'success');
    }

    /**
     * Tổng hợp lại Prompt Tổng Hợp từ dữ liệu Story Bible & Mốc phân cảnh mới nhất
     */
    resetSynthesizedPromptToFreshBuild() {
      const activeMode = this._pendingModalReviewContext?.modeKey || 'MODE_1_DRAFT';
      const resolvedCmd =
        this._pendingModalReviewContext?.resolvedCmd ?? this.getResolvedUserCommand();
      const fresh = this.buildSynthesizedPromptForMode(activeMode, resolvedCmd);
      this.lastSynthesizedPrompt = fresh;
      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      const synthStats = document.getElementById('synthesized-prompt-stats');
      if (synthTextarea) {
        synthTextarea.value = fresh;
      }
      if (synthStats) {
        const w = this.utils.countVietnameseWords(fresh);
        const estTokens = this.inspector.estimateTokensFromVietnameseWords(w);
        const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
        const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
        synthStats.dataset.i18nIgnore = '1';
        synthStats.textContent = tr(`${fmtNum(w)} từ đã liên kết (~${fmtNum(estTokens)} tokens)`);
      }
      this.utils.showToast(
        '🔄 Đã làm mới lại Prompt Tổng Hợp từ Story Bible và Mốc phân cảnh hiện tại!',
        'info'
      );
    }

    /**
     * Chạy kiểm định độ phủ ngữ cảnh 8 tầng của Prompt Tổng Hợp
     * (Kiểm tra xem đã có đủ Story Bible, Nhân vật, Ma trận Ai Biết Gì, Chuẩn thoại chưa)
     */
    runDeepPromptDiagnostics() {
      const synthTextarea = document.getElementById('textarea-synthesized-master-prompt');
      const currentPrompt = (
        synthTextarea?.value ||
        this.lastSynthesizedPrompt ||
        this.buildMasterSynthesizedPrompt()
      ).trim();

      const checks = [
        {
          name: 'Vai trò & Chỉ thị Hệ thống',
          passed: currentPrompt.includes('PHẦN 1: VAI TRÒ & CHỈ THỊ HỆ THNG') ||
                  currentPrompt.includes('PHẦN 1: VAI TRÒ & CHỈ THỊ HỆ THỐNG')
        },
        {
          name: 'Quy chuẩn hội thoại "- Câu thoại (Tên nhân vật)"',
          passed: currentPrompt.includes('- Câu thoại (Tên nhân vật)')
        },
        {
          name: 'Hồ sơ Story Bible & Thế giới',
          passed: currentPrompt.includes('STORY BIBLE') || currentPrompt.length > 800
        },
        {
          name: 'Ma trận Ai Biết Gì (Giới hạn nhận thức nhân vật)',
          passed:
            currentPrompt.includes('AI BIẾT GÌ') ||
            currentPrompt.includes('GIỚI HẠN NHẬN THỨC') ||
            (this.storyBible?.knowledgeMatrix?.length || 0) === 0
        },
        {
          name: 'Mốc chuyển phân cảnh & Đổi góc nhìn (POV)',
          passed:
            currentPrompt.includes('MỐC CHUYỂN PHÂN CẢNH') ||
            currentPrompt.includes('Điểm nhìn (POV)')
        },
        {
          name: 'Yêu cầu / Câu lệnh cụ thể của tác giả',
          passed: currentPrompt.includes('YÊU CẦU / CÂU LỆNH SÁNG TÁC')
        }
      ];

      const passedCount = checks.filter((c) => c.passed).length;
      const totalWords = this.utils.countVietnameseWords(currentPrompt);
      const estTokens = this.inspector.estimateTokensFromVietnameseWords(totalWords);

      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      this.utils.showToast(
        `🩺 Kiểm định Prompt Tổng: Đạt ${passedCount}/${checks.length} tiêu chuẩn vàng (${fmtNum(totalWords)} từ • ~${fmtNum(estTokens)} tokens). Sẵn sàng chạy chính thức!`,
        passedCount === checks.length ? 'success' : 'info',
        4500
      );

      return {
        passedCount,
        totalChecks: checks.length,
        checks,
        totalWords,
        estTokens
      };
    }

    /**
     * Xây dựng bộ mẫu câu thoại chuẩn mực tiếng Việt theo từng cảm xúc nhân vật
     * để làm tư liệu tham chiếu khi cần thiết
     */
    buildDialogueExemplarsBlock() {
      return [
        `=== [MẪU QUY CHUẨN TRÌNH BÀY HỘI THOẠI TIỂU THUYẾT] ===`,
        `- Chúng ta không còn nhiều thời gian trước khi sương mù phủ kín bến cảng đâu. (Lâm Phong)`,
        `- Anh nghĩ chỉ cần xóa sạch dấu chân trên cầu tàu là che mắt được bọn họ sao? (Hạ Vy)`,
        `- Ít nhất thì đêm nay, người nắm giữ chiếc chìa khóa đồng vẫn là tôi. (Lâm Phong)`,
        `Lưu ý: Luôn đặt dấu gạch ngang "-" ở đầu dòng thoại và ghi tên nhân vật trong ngoặc đơn "(Tên nhân vật)" ở cuối câu thoại.`
      ].join('\n');
    }

    /**
     * Trả về danh sách các mẫu câu lệnh văn học dựng sẵn
     */
    getCommandPresets(category = 'ALL') {
      if (!category || category === 'ALL') {
        return [...LITERARY_COMMAND_PRESETS];
      }
      return LITERARY_COMMAND_PRESETS.filter((p) => p.category === category);
    }

    /**
     * Trả về thông số kỹ thuật của một chế độ thực thi (Mode 1 -> Mode 5)
     */
    getExecutionModeSpec(modeKey = 'MODE_1_DRAFT') {
      return (
        EXECUTION_MODE_SPECIFICATIONS[modeKey] ||
        EXECUTION_MODE_SPECIFICATIONS.MODE_1_DRAFT
      );
    }

    /**
     * Trả về báo cáo thống kê nhật ký thực thi AI
     */
    getExecutionTelemetrySummary() {
      return this.telemetry.getSummaryMetrics();
    }

    /**
     * Trả về bảng tư vấn chọn mô hình AI (Flash / Pro / Argon vs Flash-Lite)
     */
    getModelTierAdvisory(modelId) {
      return (
        MODEL_TIER_ADVISORY_GUIDE[modelId] ||
        MODEL_TIER_ADVISORY_GUIDE['gemini-4-hydrogen']
      );
    }

    /**
     * Khởi chạy nhanh quy trình tổng hợp cho một đoạn văn được bôi đen trong trình soạn thảo
     * (Hỗ trợ mở rộng đoạn văn, viết sâu nội tâm hoặc trau chuốt câu thoại tại chỗ)
     */
    async synthesizeForSelectedExcerpt(selectedExcerpt, actionType = 'EXPAND_DEPTH') {
      const cleanExcerpt = String(selectedExcerpt || '').trim();
      if (!cleanExcerpt) {
        this.utils.showToast(
          '⚠️ Hãy bôi đen một đoạn văn hoặc câu thoại trong bản thảo trước!',
          'warning'
        );
        return;
      }

      const actionDirectives = {
        EXPAND_DEPTH:
          'Hãy mở rộng đoạn văn được chọn dưới đây với chiều sâu tâm lý, miêu tả đa giác quan (ánh sáng, âm thanh, xúc giác) và nhịp điệu giàu cảm xúc hơn, giữ nguyên mạch sự kiện:',
        POLISH_DIALOGUE:
          'Hãy nâng cấp các câu thoại và miêu tả vi biểu cảm trong đoạn văn dưới đây sao cho sắc sảo, giàu ẩn ý đấu trí và tuân thủ chuẩn "- Câu thoại (Tên nhân vật)":',
        REMOVE_CLICHE:
          'Hãy viết lại đoạn văn dưới đây để loại bỏ hoàn toàn các cách diễn đạt sáo rỗng, thay thế bằng hình ảnh ẩn dụ độc đáo và quan sát tinh tế:'
      };

      const header = actionDirectives[actionType] || actionDirectives.EXPAND_DEPTH;
      const composedCmd = `${header}\n\n"""\n${cleanExcerpt}\n"""`;

      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      if (promptBox) {
        promptBox.value = composedCmd;
        promptBox.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        try {
          localStorage.setItem('noir_v36_last_command_prompt', composedCmd);
        } catch (_) {}
      }

      await this.runStep1MasterSynthesis();
    }

    /**
     * Kiểm tra tính sẵn sàng của toàn bộ đường ống tổng hợp 2 bước
     * (Phục vụ thanh tra hệ thống và tự động hồi phục trạng thái)
     */
    verifyPipelineHealth() {
      const hasPromptTextarea = Boolean(
        document.getElementById('s18-fullscreen-prompt-textarea')
      );
      const hasConfirmModal = Boolean(
        document.getElementById('modal-confirm-synthesized-prompt')
      );
      const hasConfirmSynthBox = Boolean(
        document.getElementById('textarea-synthesized-master-prompt')
      );
      const hasConfirmModelSelect = Boolean(
        document.getElementById('confirm-modal-model-select')
      );
      const hasExecuteBtn = Boolean(
        document.getElementById('btn-execute-official-novel-prompt')
      );
      const hasBlockingLoader = Boolean(
        document.getElementById('global-ai-blocking-loader')
      );

      return {
        healthy:
          hasPromptTextarea &&
          hasConfirmModal &&
          hasConfirmSynthBox &&
          hasConfirmModelSelect &&
          hasExecuteBtn &&
          hasBlockingLoader,
        components: {
          hasPromptTextarea,
          hasConfirmModal,
          hasConfirmSynthBox,
          hasConfirmModelSelect,
          hasExecuteBtn,
          hasBlockingLoader
        },
        resolvedCommandLength: this.getResolvedUserCommand().length,
        historyEntriesCount: this.commandHistory.getHistoryList().length
      };
    }

    /**
     * Tự động gắn thêm thanh công cụ Bước 2 khi mở cửa sổ xác nhận
     */
    ensureStep2EnhancementsMounted() {
      this.injectStep2SurgicalControlsIfNeeded();
      const copyAllBtn = document.getElementById('btn-copy-all-synthesized-prompt');
      if (copyAllBtn && !copyAllBtn.dataset.noirMod16CopyAllBound) {
        copyAllBtn.dataset.noirMod16CopyAllBound = '1';
        copyAllBtn.addEventListener('click', () => this.copySynthesizedPromptToClipboard());
      }
      const currentModel =
        document.getElementById('confirm-modal-model-select')?.value ||
        this.geminiRouter?.selectedModelId ||
        'gemini-3.8-flash';
      this.updateStep2ModelAdvisoryUI(currentModel);
    }

    /**
     * Tạo bản tóm tắt siêu gọn về trạng thái Prompt Tổng Hợp hiện tại
     * để hiển thị trên thanh trạng thái hoặc nhật ký hệ thống
     */
    getQuickStatusDigest() {
      const cmd = this.getResolvedUserCommand();
      const modeKey =
        document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
      const modelId =
        document.getElementById('confirm-modal-model-select')?.value ||
        document.getElementById('select-gemini-model')?.value ||
        this.geminiRouter?.selectedModelId ||
        'gemini-3.8-flash';
      return {
        modeKey,
        modelId,
        hasUserCommand: Boolean(cmd),
        userCommandWords: this.utils.countVietnameseWords(cmd),
        lastSynthesizedWords: this.utils.countVietnameseWords(this.lastSynthesizedPrompt),
        isSynthesizing: this.isSynthesizing,
        isExecutingOfficialPrompt: this.isExecutingOfficialPrompt
      };
    }
  }

  // ==========================================================================
  // PHẦN 7: KHỞI TẠO & XUẤT RA KHÔNG GIAN TÊN TOÀN CỤC (window.NoirStudio)
  // ==========================================================================
  window.NoirStudio.MasterPromptSynthesizerAndExecutionEngine =
    MasterPromptSynthesizerAndExecutionEngine;
  window.NoirStudio.ContextBudgetAndPreFlightInspector = ContextBudgetAndPreFlightInspector;
  window.NoirStudio.VietnameseLiteraryOutputPostProcessor =
    VietnameseLiteraryOutputPostProcessor;
  window.NoirStudio.CommandHistoryAndSnapshotManager = CommandHistoryAndSnapshotManager;
  window.NoirStudio.PromptExecutionTelemetryLogger = PromptExecutionTelemetryLogger;

  const promptSynthesizer = new MasterPromptSynthesizerAndExecutionEngine(
    window.NoirStudio.idb,
    window.NoirStudio.chapterManager,
    window.NoirStudio.storyBible,
    window.NoirStudio.sceneBuilder,
    window.NoirStudio.sysPrompts,
    window.NoirStudio.rag,
    window.NoirStudio.geminiRouter,
    window.NoirStudio.utils
  );
  window.NoirStudio.promptSynthesizer = promptSynthesizer;

  // ==========================================================================
  // PHẦN 8 (v105): THEO DÕI THAY ĐỔI CHƯƠNG TRUYỆN + CẢNH BÁO STORY BIBLE / CHẾ ĐỘ 2
  //                + CẦU NỐI COPY TỰ ĐỘNG & CHIA ĐÔI MÀN HÌNH GEMINI / NOTEBOOKLM
  //                + QUY TRÌNH 4 BƯỚC TAB 1 + CHẾ ĐỘ 6 TẠO BÌA TRUYỆN
  // ==========================================================================

  class ManuscriptSyncChangeTracker {
    constructor(synthEngine) {
      this.synth = synthEngine;
      this.KEY_BIBLE_FP = 'noir_v105_bible_synced_fp_v1';
      this.KEY_MODE2_FP = 'noir_v105_mode2_synced_fp_v1';
      this.KEY_SKIP_M1 = 'noir_v105_skip_stale_warn_m1_v1';
      this.KEY_SKIP_M2 = 'noir_v105_skip_stale_warn_m2_v1';
      this._bound = false;
    }

    computeChaptersFingerprint() {
      try {
        const cm = window.NoirStudio?.chapterManager;
        const chaps = Array.isArray(cm?.chapters) ? cm.chapters : [];
        const liveTa = document.getElementById('textarea-chapter-content')?.value;
        const activeId = cm?.activeChapterId || cm?.getActiveChapter?.()?.id || '';
        const parts = chaps.map((c) => {
          const txt = String(c.id === activeId && typeof liveTa === 'string' ? liveTa : c.content || '');
          return `${c.id}:${(c.title || '').length}:${txt.length}:${txt.slice(0, 32)}:${txt.slice(-32)}`;
        });
        return `${chaps.length}#${parts.join('|')}`;
      } catch (_e) {
        return '';
      }
    }

    hasMeaningfulManuscriptText() {
      try {
        const cm = window.NoirStudio?.chapterManager;
        const chaps = Array.isArray(cm?.chapters) ? cm.chapters : [];
        const liveLen = String(document.getElementById('textarea-chapter-content')?.value || '').trim().length;
        if (liveLen >= 20) return true;
        return chaps.some((c) => String(c?.content || '').trim().length >= 20);
      } catch (_e) {
        return false;
      }
    }

    markStoryBibleUpdatedNow() {
      const fp = this.computeChaptersFingerprint();
      try {
        if (fp) localStorage.setItem(this.KEY_BIBLE_FP, fp);
      } catch (_e) {}
      this.refreshTab4StaleReminder();
    }

    markMode2UpdatedNow() {
      const fp = this.computeChaptersFingerprint();
      try {
        if (fp) localStorage.setItem(this.KEY_MODE2_FP, fp);
      } catch (_e) {}
    }

    isStoryBibleStale() {
      if (!this.hasMeaningfulManuscriptText()) return false;
      const curFp = this.computeChaptersFingerprint();
      if (!curFp) return false;
      try {
        const savedFp = localStorage.getItem(this.KEY_BIBLE_FP) || '';
        return savedFp !== curFp;
      } catch (_e) {
        return false;
      }
    }

    isMode2Stale() {
      if (!this.hasMeaningfulManuscriptText()) return false;
      const curFp = this.computeChaptersFingerprint();
      if (!curFp) return false;
      try {
        const savedFp = localStorage.getItem(this.KEY_MODE2_FP) || '';
        return savedFp !== curFp;
      } catch (_e) {
        return false;
      }
    }

    shouldWarnMode1Stale() {
      try {
        if (localStorage.getItem(this.KEY_SKIP_M1) === '1') return false;
      } catch (_e) {}
      return this.isStoryBibleStale() || this.isMode2Stale();
    }

    shouldWarnMode2Stale() {
      try {
        if (localStorage.getItem(this.KEY_SKIP_M2) === '1') return false;
      } catch (_e) {}
      return this.isStoryBibleStale();
    }

    refreshTab4StaleReminder() {
      const banner = document.getElementById('tab4-stale-bible-reminder');
      if (!banner) return;
      const stale = this.isStoryBibleStale();
      banner.classList.toggle('hidden', !stale);
    }

    openMode1StaleWarningModal(onProceed) {
      if (typeof document === 'undefined' || !document.body) {
        onProceed?.();
        return;
      }
      document.getElementById('modal-v105-stale-mode1-warn')?.remove();
      const modal = document.createElement('div');
      modal.id = 'modal-v105-stale-mode1-warn';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'fixed inset-0 z-[195] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto';

      modal.innerHTML = `
        <div class="my-auto w-full max-w-lg rounded-2xl border-2 border-amber-400/75 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-amber-950/75 to-rose-950/50 flex items-center justify-between gap-2">
            <div class="font-extrabold text-sm text-amber-300">⚠️ Phát Hiện Nội Dung Chương Truyện Vừa Thay Đổi</div>
            <button type="button" id="btn-close-v105-m1-warn" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕</button>
          </div>
          <div class="p-4 space-y-3.5">
            <p class="text-[12.5px] leading-relaxed text-zinc-100">
              Mình thấy chương truyện bạn viết đã thay đổi nội dung, điều này có thể dẫn tới story bible hoặc mạch truyện đổi, bạn có muốn cập nhật
              <button type="button" id="btn-v105-warn-jump-mode2" class="inline underline decoration-2 underline-offset-4 font-extrabold text-cyan-300 hover:text-white cursor-pointer bg-transparent border-0 px-0.5">Tham mưu cốt truyện</button>
              và
              <button type="button" id="btn-v105-warn-jump-bible" class="inline underline decoration-2 underline-offset-4 font-black text-amber-300 hover:text-amber-100 bg-amber-500/20 border border-amber-400/60 rounded px-1.5 py-0.5 cursor-pointer">Story Bible</button>
              (Story bible thì cần cập nhật ngay vì bạn có thay đổi trong chương truyện) không?
            </p>
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-300 cursor-pointer select-none">
              <input type="checkbox" id="chk-v105-skip-m1-warn" class="accent-amber-400 w-4 h-4 shrink-0" />
              <span>Không hiện cảnh báo này cho lần sau</span>
            </label>
            <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button type="button" id="btn-v105-m1-go-bible" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold shadow transition">
                🏛️ Qua Story Bible Ngay
              </button>
              <button type="button" id="btn-v105-m1-go-mode2" class="px-3 py-2 rounded-xl border border-cyan-500/50 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 font-bold transition">
                🧭 Qua Chế Độ 2
              </button>
              <button type="button" id="btn-v105-m1-proceed" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow transition">
                🚀 Vẫn Chạy Prompt
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      window.NoirStudio?.i18n?.translateElement?.(modal);

      const close = () => modal.remove();
      const saveSkipIfChecked = () => {
        if (modal.querySelector('#chk-v105-skip-m1-warn')?.checked) {
          try { localStorage.setItem(this.KEY_SKIP_M1, '1'); } catch (_e) {}
        }
      };
      modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
      modal.querySelector('#btn-close-v105-m1-warn')?.addEventListener('click', close);
      const goMode2 = () => {
        close();
        this.synth.switchToMode2AndFocus();
      };
      const goBible = () => {
        close();
        document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_4_BIBLE');
        this.refreshTab4StaleReminder();
      };
      modal.querySelector('#btn-v105-warn-jump-mode2')?.addEventListener('click', goMode2);
      modal.querySelector('#btn-v105-m1-go-mode2')?.addEventListener('click', goMode2);
      modal.querySelector('#btn-v105-warn-jump-bible')?.addEventListener('click', goBible);
      modal.querySelector('#btn-v105-m1-go-bible')?.addEventListener('click', goBible);
      modal.querySelector('#btn-v105-m1-proceed')?.addEventListener('click', () => {
        saveSkipIfChecked();
        close();
        onProceed?.();
      });
    }

    openMode2StaleWarningModal(onProceed) {
      if (typeof document === 'undefined' || !document.body) {
        onProceed?.();
        return;
      }
      document.getElementById('modal-v105-stale-mode2-warn')?.remove();
      const modal = document.createElement('div');
      modal.id = 'modal-v105-stale-mode2-warn';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'fixed inset-0 z-[195] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto';

      modal.innerHTML = `
        <div class="my-auto w-full max-w-md rounded-2xl border-2 border-amber-400/75 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-amber-950/75 to-zinc-950 flex items-center justify-between gap-2">
            <div class="font-extrabold text-sm text-amber-300">⚠️ Story Bible Chưa Được Cập Nhật</div>
            <button type="button" id="btn-close-v105-m2-warn" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕</button>
          </div>
          <div class="p-4 space-y-3.5">
            <p class="text-[12.5px] leading-relaxed text-zinc-100">
              Bạn chưa cập nhật <strong class="text-amber-300">story bible</strong>, bạn nên cập nhật nó, bạn có muốn cập nhật ngay bây giờ không?
            </p>
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-300 cursor-pointer select-none">
              <input type="checkbox" id="chk-v105-skip-m2-warn" class="accent-amber-400 w-4 h-4 shrink-0" />
              <span>Không hiện cảnh báo này cho lần sau</span>
            </label>
            <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button type="button" id="btn-v105-m2-go-bible" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold shadow transition">
                🏛️ Cập Nhật Story Bible Ngay
              </button>
              <button type="button" id="btn-v105-m2-proceed" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow transition">
                🧭 Vẫn Chạy Chế Độ 2
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      window.NoirStudio?.i18n?.translateElement?.(modal);

      const close = () => modal.remove();
      modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
      modal.querySelector('#btn-close-v105-m2-warn')?.addEventListener('click', close);
      modal.querySelector('#btn-v105-m2-go-bible')?.addEventListener('click', () => {
        close();
        document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_4_BIBLE');
        this.refreshTab4StaleReminder();
      });
      modal.querySelector('#btn-v105-m2-proceed')?.addEventListener('click', () => {
        if (modal.querySelector('#chk-v105-skip-m2-warn')?.checked) {
          try { localStorage.setItem(this.KEY_SKIP_M2, '1'); } catch (_e) {}
        }
        close();
        onProceed?.();
      });
    }

    init() {
      if (this._bound || typeof document === 'undefined') return;
      this._bound = true;
      // Khởi tạo baseline nếu lần đầu mở và đã có Story Bible sẵn
      try {
        if (!localStorage.getItem(this.KEY_BIBLE_FP)) {
          const bibleLen = String(document.getElementById('textarea-rendered-bible-content')?.value || '').trim().length;
          if (bibleLen > 80) {
            localStorage.setItem(this.KEY_BIBLE_FP, this.computeChaptersFingerprint());
          }
        }
      } catch (_e) {}

      const onManuscriptEdited = () => {
        this.refreshTab4StaleReminder();
      };
      document.getElementById('textarea-chapter-content')?.addEventListener('input', onManuscriptEdited);
      document.getElementById('input-chapter-title')?.addEventListener('input', onManuscriptEdited);
      window.NoirStudio?.bus?.on?.('chapter:created', onManuscriptEdited);
      window.NoirStudio?.bus?.on?.('chapter:deleted', onManuscriptEdited);
      window.NoirStudio?.bus?.on?.('chapter:saved', onManuscriptEdited);
      window.NoirStudio?.bus?.on?.('screen:changed', () => this.refreshTab4StaleReminder());
      setTimeout(() => this.refreshTab4StaleReminder(), 600);
    }
  }

  class GeminiAndNotebookLmSplitBridge {
    constructor(synthEngine) {
      this.synth = synthEngine;
      this.GEMINI_WEB_URL = 'https://gemini.google.com/app';
      this.NOTEBOOKLM_WEB_URL = 'https://notebooklm.google.com/';
      this._bound = false;
    }

    isMobileDevice() {
      if (typeof navigator === 'undefined') return false;
      return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(String(navigator.userAgent || ''));
    }

    isAndroidDevice() {
      if (typeof navigator === 'undefined') return false;
      return /Android/i.test(String(navigator.userAgent || ''));
    }

    getThinkingHumanLabel(level) {
      const map = {
        MINIMAL: 'Tối thiểu (Nhanh)',
        LOW: 'Thấp (Nhanh)',
        MEDIUM: 'Trung bình (Cân bằng)',
        HIGH: 'Cao (Sâu tâm lý & Logic)',
        XHIGH: 'Siêu cao · XHIGH (Tối đa Gemini 4)'
      };
      return map[String(level || 'MEDIUM').toUpperCase()] || 'Trung bình (Cân bằng)';
    }

    getSelectedModelAndThinkingInfo() {
      const selConfirm = document.getElementById('confirm-modal-model-select');
      const selMain = document.getElementById('select-gemini-model');
      const activeSel =
        !document.getElementById('modal-confirm-synthesized-prompt')?.classList.contains('hidden') && selConfirm
          ? selConfirm
          : selMain || selConfirm;
      const modelId = activeSel?.value || window.NoirStudio?.geminiRouter?.selectedModelId || 'gemini-4-hydrogen';
      const optText = activeSel?.selectedOptions?.[0]?.textContent?.trim() || modelId;

      const thinkConfirm = document.getElementById('confirm-modal-thinking-select');
      const thinkMain = document.getElementById('select-ai-thinking-level');
      const thinkVal =
        (!document.getElementById('modal-confirm-synthesized-prompt')?.classList.contains('hidden') && thinkConfirm?.value) ||
        thinkMain?.value ||
        window.NoirStudio?.geminiRouter?.getThinkingLevel?.() ||
        'MEDIUM';
      return {
        modelId,
        modelLabel: optText,
        thinkingLevel: thinkVal,
        thinkingLabel: this.getThinkingHumanLabel(thinkVal)
      };
    }

    refreshConfirmModalWebReminder() {
      const el = document.getElementById('confirm-modal-web-model-reminder');
      if (!el) return;
      const info = this.getSelectedModelAndThinkingInfo();
      const modeKey =
        this.synth?._pendingModalReviewContext?.modeKey ||
        document.getElementById('select-ai-execution-mode')?.value ||
        'MODE_1_DRAFT';
      const isNotebook = modeKey === 'MODE_3_AUDIT' || modeKey === 'MODE_4_REVIEW' || modeKey === 'MODE_5_DIAGRAM';
      const tr = (s) => (window.NoirStudio?.i18n?.translateText ? window.NoirStudio.i18n.translateText(String(s || '')) : String(s || ''));
      if (isNotebook) {
        el.textContent = tr(
          `🧠 Chế độ này khuyên dùng Google NotebookLM — câu lệnh đã tự động copy sẵn, bấm Chia Đôi Màn Hình để dán thẳng sang NotebookLM nhé!`
        );
      } else {
        el.textContent = tr(
          `🔔 Nếu bạn dùng Gemini Web/App thì nhớ chọn mô hình bạn đang mong muốn: ${info.modelLabel} — Mức tư duy: ${info.thinkingLabel} nha!`
        );
      }
    }

    async copyTextReliable(text) {
      const clean = String(text || '');
      if (!clean) return false;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(clean);
          return true;
        }
      } catch (_eClip) {}
      try {
        const ta = document.createElement('textarea');
        ta.value = clean;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return Boolean(ok);
      } catch (_eFb) {
        return false;
      }
    }

    launchExternalSplitWindow(serviceType = 'GEMINI', preferNativeAppIntent = false) {
      const isNotebook = serviceType === 'NOTEBOOKLM';
      const webUrl = isNotebook ? this.NOTEBOOKLM_WEB_URL : this.GEMINI_WEB_URL;

      if (this.isMobileDevice()) {
        if (preferNativeAppIntent && !isNotebook && this.isAndroidDevice()) {
          // Cơ chế tự dò App Gemini trên Android: mở thẳng App Gemini nếu đã cài, tự fallback sang Web nếu chưa cài!
          const intentUrl =
            'intent://gemini.google.com/app#Intent;scheme=https;package=com.google.android.apps.bard;S.browser_fallback_url=https%3A%2F%2Fgemini.google.com%2Fapp;end';
          try {
            window.location.href = intentUrl;
            return true;
          } catch (_eInt) {}
        }
        try {
          window.open(webUrl, '_blank', 'noopener,noreferrer');
          return true;
        } catch (_eMob) {
          return false;
        }
      }

      // Desktop: mở popup cửa sổ bên PHẢI màn hình tự động chia 50/50 + cố gắng căn app hiện tại sang nửa TRÁI
      const availLeft = Number(window.screen?.availLeft) || 0;
      const availTop = Number(window.screen?.availTop) || 0;
      const availW = Math.max(960, Number(window.screen?.availWidth) || 1440);
      const availH = Math.max(640, Number(window.screen?.availHeight) || 900);
      const halfW = Math.floor(availW / 2);
      const rightX = availLeft + halfW;

      try {
        // Nếu đang ở App PWA độc lập trên Desktop, tự co nhẹ cửa sổ hiện tại về nửa trái màn hình
        const isStandalone = Boolean(
          window.matchMedia?.('(display-mode: standalone)')?.matches ||
          window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches
        );
        if (isStandalone && typeof window.moveTo === 'function' && typeof window.resizeTo === 'function') {
          window.moveTo(availLeft, availTop);
          window.resizeTo(halfW, availH);
        }
      } catch (_eResize) {}

      const winName = isNotebook ? 'noir_split_notebooklm_window' : 'noir_split_gemini_window';
      const features = `popup=yes,resizable=yes,scrollbars=yes,left=${rightX},top=${availTop},width=${halfW},height=${availH}`;
      const opened = window.open(webUrl, winName, features);
      if (opened) {
        try { opened.focus(); } catch (_eF) {}
        window.NoirStudio?.utils?.showToast?.(
          isNotebook
            ? '🪟 Đã mở Google NotebookLM ở nửa phải màn hình! Bạn chỉ cần Ctrl+V dán câu lệnh vừa copy.'
            : '🪟 Đã mở Gemini ở nửa phải màn hình! (Trên Windows bấm Win + ← để ghim Studio sang nửa trái nếu đang mở trong tab trình duyệt)',
          'success',
          5000
        );
        return true;
      }
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      return true;
    }

    async autoCopyAndAnnounceCompiledPrompt(compiledPrompt, modeKey, options = {}) {
      const copied = await this.copyTextReliable(compiledPrompt);
      this.refreshConfirmModalWebReminder();
      const serviceType =
        modeKey === 'MODE_3_AUDIT' || modeKey === 'MODE_4_REVIEW' || modeKey === 'MODE_5_DIAGRAM'
          ? 'NOTEBOOKLM'
          : 'GEMINI';
      const info = this.getSelectedModelAndThinkingInfo();
      const pill = document.getElementById('mod32-confirm-copy-status-pill');
      if (pill && copied) {
        pill.textContent = '✅ Đã tự động copy câu lệnh vào bộ nhớ tạm';
      }
      window.NoirStudio?.utils?.showToast?.(
        serviceType === 'NOTEBOOKLM'
          ? '✅ Đã copy câu lệnh thành công! Sẵn sàng dán sang Google NotebookLM.'
          : `✅ Đã copy câu lệnh thành công! Nếu dùng Gemini Web/App nhớ chọn: ${info.modelLabel} (${info.thinkingLabel}).`,
        'success',
        4800
      );
      if (options.openFloatingAsk) {
        this.openSplitScreenLaunchModal({
          serviceType,
          compiledPrompt,
          modeKey,
          fromButtonExplain: false
        });
      }
    }

    async triggerSplitScreenForCurrentContext(explicitService = null, explicitModeKey = null, explicitPrompt = null) {
      const modeKey =
        explicitModeKey ||
        this.synth?._pendingModalReviewContext?.modeKey ||
        document.getElementById('select-ai-execution-mode')?.value ||
        'MODE_1_DRAFT';
      const serviceType =
        explicitService ||
        (modeKey === 'MODE_3_AUDIT' || modeKey === 'MODE_4_REVIEW' || modeKey === 'MODE_5_DIAGRAM'
          ? 'NOTEBOOKLM'
          : 'GEMINI');

      let promptText = explicitPrompt;
      if (!promptText) {
        if (serviceType === 'NOTEBOOKLM' && explicitModeKey === 'TAB4_STORY_BIBLE') {
          promptText =
            window.NoirStudio?.storyBible?.buildDynamicNotebookLmStoryBiblePrompt?.() ||
            document.getElementById('textarea-tab4-notebooklm-prompt')?.value ||
            '';
        } else {
          const resolvedCmd = this.synth.getResolvedUserCommand();
          promptText = this.synth.buildSynthesizedPromptForMode(modeKey, resolvedCmd);
        }
      }

      if (promptText && promptText.trim()) {
        await this.copyTextReliable(promptText);
        window.NoirStudio?.utils?.showToast?.(
          '✅ Đã tổng hợp và copy sẵn câu lệnh vào bộ nhớ tạm!',
          'success',
          3600
        );
      }

      this.openSplitScreenLaunchModal({
        serviceType,
        compiledPrompt: promptText || '',
        modeKey,
        fromButtonExplain: true
      });
    }

    openSplitScreenLaunchModal({ serviceType = 'GEMINI', compiledPrompt = '', modeKey = 'MODE_1_DRAFT', fromButtonExplain = false } = {}) {
      if (typeof document === 'undefined' || !document.body) return;
      document.getElementById('mod16-split-screen-bridge-modal')?.remove();

      const isNotebook = serviceType === 'NOTEBOOKLM';
      const isMobile = this.isMobileDevice();
      const info = this.getSelectedModelAndThinkingInfo();
      const esc = (s) =>
        String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

      const modal = document.createElement('div');
      modal.id = 'mod16-split-screen-bridge-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'fixed inset-0 z-[192] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto';

      const targetTitle = isNotebook
        ? '🪟 Chia Đôi Màn Hình Với Google NotebookLM'
        : '🪟 Chia Đôi Màn Hình Với Gemini Web / App';
      const modelReminderHtml = isNotebook
        ? `<div class="p-3 rounded-xl border border-sky-400/55 bg-sky-950/40 text-sky-100 font-bold leading-relaxed">
             🧠 <strong>Gợi ý Google NotebookLM:</strong> Câu lệnh chi tiết đã được tự động copy sẵn vào bộ nhớ tạm! Bạn chỉ cần dán (Ctrl+V / Dán) vào Google NotebookLM (kèm file PDF các chương nếu cần đối chiếu toàn truyện).
           </div>`
        : `<div class="p-3 rounded-xl border border-amber-400/60 bg-amber-500/15 text-amber-100 font-extrabold leading-relaxed">
             🔔 Nếu bạn dùng Gemini Web/App thì nhớ chọn mô hình bạn đang mong muốn:
             <span class="text-emerald-300">${esc(info.modelLabel)}</span> — Mức tư duy: <span class="text-cyan-300">${esc(info.thinkingLabel)}</span> nha!
           </div>`;

      const mode6TipHtml =
        modeKey === 'MODE_6_BOOK_COVER'
          ? `<div class="p-2.5 rounded-xl border border-violet-400/55 bg-violet-950/40 text-violet-100 font-bold leading-relaxed">
               🖼️ <strong>Mẹo Chế độ 6 (Tạo Bìa):</strong> Khi mở Gemini, hãy bấm dấu <strong>+</strong> ở thanh "Hỏi Gemini" → chọn <strong>🖼️ Tạo hình ảnh</strong> rồi dán câu lệnh đã copy vào để ra bìa đẹp nhất!
             </div>`
          : '';

      const explainBoxHtml = `
        <div class="p-3 rounded-xl border border-indigo-400/45 bg-indigo-950/35 text-zinc-200 leading-relaxed text-[11.5px]">
          💡 Khi chia đôi màn hình với ${isNotebook ? 'Google NotebookLM' : 'Gemini'}, bạn vừa có thể sáng tác truyện, vừa có thể tương tác với ${isNotebook ? 'NotebookLM Web/App' : 'Gemini Web hoặc App'} của bạn (Hoặc nếu không thì bạn có thể tương tác với Gemini qua Link API của mình, nhưng nó sẽ hơi lỏ hơn vì Gemini qua Link API không phân biệt bạn dùng cái tài khoản nào, Plus, Pro hay Ultra mà là 1 gói Billing riêng. Bạn có thể đưa Gemini nghĩ cốt truyện, sáng tạo thành phẩm,... rồi cóp ngược về app để quản lý chương truyện, vẽ sơ đồ,... nha).
        </div>
      `;

      modal.innerHTML = `
        <div class="my-auto w-full max-w-xl rounded-2xl border-2 border-indigo-400/75 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-indigo-950/80 via-violet-950/60 to-zinc-950 flex items-center justify-between gap-2">
            <div class="font-extrabold text-sm text-indigo-200">${targetTitle}</div>
            <button type="button" id="btn-close-split-bridge-modal" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕</button>
          </div>
          <div class="p-4 space-y-3">
            <div class="p-2.5 rounded-xl border border-emerald-500/50 bg-emerald-950/35 text-emerald-100 font-bold flex items-center justify-between gap-2">
              <span>✅ Đã copy câu lệnh thành công vào bộ nhớ tạm!</span>
              <button type="button" id="btn-split-bridge-recopy" class="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10.5px] font-bold shrink-0">📋 Copy lại</button>
            </div>
            ${modelReminderHtml}
            ${mode6TipHtml}
            ${explainBoxHtml}
            <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
              ${
                isMobile && !isNotebook && this.isAndroidDevice()
                  ? `<button type="button" id="btn-split-launch-app-android" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-lg transition">
                       📱 Mở Thẳng App Gemini (Tự Dò App) ↗
                     </button>`
                  : ''
              }
              <button type="button" id="btn-split-launch-main" class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold shadow-lg transition">
                ${
                  isMobile
                    ? isNotebook
                      ? '🌐 Mở Google NotebookLM Ngay ↗'
                      : '🌐 Mở Gemini Web / App Ngay ↗'
                    : isNotebook
                      ? '🪟 Chia Đôi Màn Hình Với NotebookLM Ngay ↗'
                      : '🪟 Chia Đôi Màn Hình Với Gemini Ngay ↗'
                }
              </button>
              <button type="button" id="btn-split-bridge-dismiss" class="px-3 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-bold transition">
                ${fromButtonExplain ? 'Đóng lại' : 'Ở lại (Dùng API Key / Chỉnh tiếp)'}
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      window.NoirStudio?.i18n?.translateElement?.(modal);

      const close = () => modal.remove();
      modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
      modal.querySelector('#btn-close-split-bridge-modal')?.addEventListener('click', close);
      modal.querySelector('#btn-split-bridge-dismiss')?.addEventListener('click', close);
      modal.querySelector('#btn-split-bridge-recopy')?.addEventListener('click', async () => {
        if (compiledPrompt) {
          await this.copyTextReliable(compiledPrompt);
          window.NoirStudio?.utils?.showToast?.('✅ Đã copy lại câu lệnh thành công!', 'success', 2400);
        }
      });
      modal.querySelector('#btn-split-launch-app-android')?.addEventListener('click', () => {
        this.launchExternalSplitWindow(serviceType, true);
        close();
      });
      modal.querySelector('#btn-split-launch-main')?.addEventListener('click', () => {
        this.launchExternalSplitWindow(serviceType, false);
        close();
      });
    }

    jumpToWorkflowTarget(targetKey) {
      if (targetKey === 'TAB4_BIBLE') {
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_4_BIBLE');
        window.NoirStudio?.manuscriptSyncTracker?.refreshTab4StaleReminder?.();
        return;
      }
      window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_3_AI');
      const modeSel = document.getElementById('select-ai-execution-mode');
      if (modeSel && targetKey) {
        modeSel.value = targetKey;
        try {
          localStorage.setItem(this.synth.constants.STORAGE_KEYS.EXECUTION_MODE, targetKey);
        } catch (_e) {}
      }
      window.NoirStudio?.tab3Controller?.switchMode?.(targetKey);
      this.synth.onExecutionModeChanged(targetKey);
      document.getElementById('modal-fullscreen-ai-command')?.classList.remove('hidden');
      this.synth.refreshCommandModeUX(targetKey);
    }

    init() {
      if (this._bound || typeof document === 'undefined') return;
      this._bound = true;

      const bindClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.v105SplitBound) {
          el.dataset.v105SplitBound = '1';
          el.addEventListener('click', fn);
        }
      };

      // Các nút Chia đôi màn hình với Gemini ở Tab 1, 2, 3 và Hộp lệnh
      bindClick('btn-tab1-split-gemini', () => this.triggerSplitScreenForCurrentContext('GEMINI', 'MODE_1_DRAFT'));
      bindClick('btn-tab2-split-gemini', () => this.triggerSplitScreenForCurrentContext('GEMINI', 'MODE_1_DRAFT'));
      bindClick('btn-tab3-split-gemini', () => this.triggerSplitScreenForCurrentContext(null, null));
      bindClick('btn-cmd-split-gemini', () => this.triggerSplitScreenForCurrentContext(null, null));

      // Các nút Chia đôi màn hình với NotebookLM ở Chế độ 3, 4, 5
      bindClick('btn-mode3-split-notebooklm', () => this.triggerSplitScreenForCurrentContext('NOTEBOOKLM', 'MODE_3_AUDIT'));
      bindClick('btn-mode4-split-notebooklm', () => this.triggerSplitScreenForCurrentContext('NOTEBOOKLM', 'MODE_4_REVIEW'));
      bindClick('btn-mode5-split-notebooklm', () => this.triggerSplitScreenForCurrentContext('NOTEBOOKLM', 'MODE_5_DIAGRAM'));

      // Chế độ 6 Tạo Bìa Truyện
      bindClick('btn-mode6-copy-cover-prompt', async () => {
        const cmd = this.synth.getResolvedUserCommand();
        const promptText = this.synth.buildSynthesizedPromptForMode('MODE_6_BOOK_COVER', cmd);
        await this.copyTextReliable(promptText);
        window.NoirStudio?.utils?.showToast?.(
          '✅ Đã copy câu lệnh tạo bìa thành công! Mở Gemini → bấm + → Tạo hình ảnh rồi dán vào nhé!',
          'success',
          4200
        );
      });
      bindClick('btn-mode6-split-gemini', () => this.triggerSplitScreenForCurrentContext('GEMINI', 'MODE_6_BOOK_COVER'));

      // Nút Copy & Chia Đôi trong Cửa sổ xác nhận (thay thế hành vi mở tab cũ bằng chia đôi thông minh)
      const confirmSplitBtn = document.getElementById('btn-mod32-confirm-copy-and-open');
      if (confirmSplitBtn && !confirmSplitBtn.dataset.v105SplitOverride) {
        confirmSplitBtn.dataset.v105SplitOverride = '1';
        confirmSplitBtn.addEventListener(
          'click',
          (ev) => {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            const txt =
              document.getElementById('textarea-synthesized-master-prompt')?.value ||
              this.synth.lastSynthesizedPrompt ||
              '';
            const modeKey =
              this.synth?._pendingModalReviewContext?.modeKey ||
              document.getElementById('select-ai-execution-mode')?.value ||
              'MODE_1_DRAFT';
            const svc =
              modeKey === 'MODE_3_AUDIT' || modeKey === 'MODE_4_REVIEW' || modeKey === 'MODE_5_DIAGRAM'
                ? 'NOTEBOOKLM'
                : 'GEMINI';
            this.triggerSplitScreenForCurrentContext(svc, modeKey, txt);
          },
          true
        );
      }

      // Cập nhật live dòng nhắc chọn mô hình + mức tư duy khi người dùng đổi dropdown
      ['confirm-modal-model-select', 'confirm-modal-thinking-select', 'select-gemini-model', 'select-ai-thinking-level'].forEach(
        (id) => {
          document.getElementById(id)?.addEventListener('change', () => this.refreshConfirmModalWebReminder());
        }
      );

      // Gắn sự kiện chọn phong cách bìa Chế độ 6
      document.querySelectorAll('.mode6-style-chip').forEach((chip) => {
        if (chip.dataset.v105ChipBound) return;
        chip.dataset.v105ChipBound = '1';
        chip.addEventListener('click', () => {
          const styleKey = chip.getAttribute('data-cover-style') || 'ANIME_LN';
          this.synth._selectedCoverStyleKey = styleKey;
          document.querySelectorAll('.mode6-style-chip').forEach((c) => {
            const active = c.getAttribute('data-cover-style') === styleKey;
            c.className = active
              ? 'mode6-style-chip px-2.5 py-1 rounded-lg border border-violet-400 bg-violet-600/85 text-white font-extrabold text-[10.5px] shadow transition'
              : 'mode6-style-chip px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-violet-400 font-bold text-[10.5px] transition';
          });
          const label = BOOK_COVER_STYLE_PRESETS[styleKey]?.label || styleKey;
          window.NoirStudio?.utils?.showToast?.(
            styleKey === 'CUSTOM_FREE'
              ? '✏️ Đã chọn tự nhập câu lệnh bìa tự do — bạn hãy mô tả thẳng ý tưởng vào khung bên dưới nhé!'
              : `🎨 Đã chọn phong cách bìa: ${label}`,
            'info',
            2600
          );
        });
      });

      // Quy trình 4 bước ngắn ở Tab 1 (mọi chữ gạch chân đều nhảy thẳng tới đúng chế độ)
      document.querySelectorAll('[data-workflow-jump]').forEach((btn) => {
        if (btn.dataset.v105WfBound) return;
        btn.dataset.v105WfBound = '1';
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-workflow-jump');
          if (target) this.jumpToWorkflowTarget(target);
        });
      });

      // Đồng bộ 2 chiều checkbox liên kết File Story Bible giữa Tab 3 Command Modal & Tab 4
      const cmdFileChk = document.getElementById('chk-cmd-link-story-bible-file');
      if (cmdFileChk && !cmdFileChk.dataset.v105FileSyncBound) {
        cmdFileChk.dataset.v105FileSyncBound = '1';
        const savedEnabled = localStorage.getItem('noir_v105_story_bible_file_link_enabled') !== '0';
        cmdFileChk.checked = savedEnabled;
        cmdFileChk.addEventListener('change', () => {
          localStorage.setItem('noir_v105_story_bible_file_link_enabled', cmdFileChk.checked ? '1' : '0');
          const tab4Chk = document.getElementById('chk-tab4-link-bible-file');
          if (tab4Chk) tab4Chk.checked = cmdFileChk.checked;
        });
      }
    }
  }

  const manuscriptSyncTracker = new ManuscriptSyncChangeTracker(promptSynthesizer);
  const geminiSplitBridge = new GeminiAndNotebookLmSplitBridge(promptSynthesizer);
  window.NoirStudio.manuscriptSyncTracker = manuscriptSyncTracker;
  window.NoirStudio.geminiSplitBridge = geminiSplitBridge;

  const bootV105SplitAndTrackers = () => {
    try {
      manuscriptSyncTracker.init();
      geminiSplitBridge.init();
    } catch (_eBoot) {}
  };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootV105SplitAndTrackers);
    } else {
      setTimeout(bootV105SplitAndTrackers, 60);
    }
  }

  const refreshMod16I18n = () => {
    try {
      promptSynthesizer.refreshCommandModeUX?.();
      promptSynthesizer.updateCollapsedParamsSummaryText?.();
      promptSynthesizer.refreshConfirmModalI18n?.();
      if (window.NoirStudio?.guestMode?.isActive?.()) {
        window.NoirStudio.guestMode.presetStudio?.lockPromptInputsForGuestMode?.();
      }
    } catch {}
  };
  window.NoirStudio?.bus?.on?.('i18n:changed', refreshMod16I18n);
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('noir:i18n:changed', refreshMod16I18n);
  }
})();
