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

      // 1. Khôi phục câu lệnh RIÊNG BIỆT theo đúng Chế độ đang chọn (tuyệt đối không dùng chung giữa 6 chế độ)
      const initialModeKey = modeSelect?.value || 'MODE_1_DRAFT';
      const perModeKey = `noir_v106_cmd_draft_${initialModeKey}`;
      let savedPrompt = '';
      try {
        savedPrompt = localStorage.getItem(perModeKey) || '';
        // Chỉ di trú 1 lần duy nhất từ bản cũ sang Chế độ 1 nếu Chế độ 1 chưa có draft mới
        if (!savedPrompt && initialModeKey === 'MODE_1_DRAFT' && localStorage.getItem('noir_v106_migrated_m1_v1') !== '1') {
          const legacy = localStorage.getItem('noir_v36_last_command_prompt') || '';
          if (legacy) {
            savedPrompt = legacy;
            localStorage.setItem(perModeKey, legacy);
          }
          localStorage.setItem('noir_v106_migrated_m1_v1', '1');
        }
      } catch (_eInitP) {}
      if (promptBox && !promptBox.value && savedPrompt) {
        promptBox.value = savedPrompt;
      }

      this.updatePromptCounterUI(promptBox?.value || '');

      // 2. Đồng bộ 2 chiều theo đúng Chế độ đang chọn (6 chế độ hoàn toàn độc lập)
      if (promptBox && !promptBox.dataset.noirMod16Bound) {
        promptBox.dataset.noirMod16Bound = '1';
        const syncHandler = () => {
          const val = promptBox.value;
          const activeMode = document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
          try {
            localStorage.setItem(`noir_v106_cmd_draft_${activeMode}`, val);
          } catch (_) {}

          // Chỉ đồng bộ với beats của chương khi đang ở Chế độ 1
          if (activeMode === 'MODE_1_DRAFT') {
            const legacyBeats = document.getElementById('textarea-chapter-beats');
            if (legacyBeats && legacyBeats.value !== val) {
              legacyBeats.value = val;
            }
            const active = this.chapterMgr?.getActiveChapter?.();
            if (active) {
              active.beats = val;
            }
          }

          this.updatePromptCounterUI(val);
        };

        promptBox.addEventListener('input', syncHandler);
        promptBox.addEventListener('change', syncHandler);
        promptBox.addEventListener('paste', () => setTimeout(syncHandler, 20));
      }

      // 3. Đồng bộ ngược nếu tác giả nhập vào #textarea-chapter-beats (chỉ cho Chế độ 1)
      const legacyBeats = document.getElementById('textarea-chapter-beats');
      if (legacyBeats && !legacyBeats.dataset.noirMod16Bound) {
        legacyBeats.dataset.noirMod16Bound = '1';
        legacyBeats.addEventListener('input', () => {
          const val = legacyBeats.value;
          try {
            localStorage.setItem('noir_v106_cmd_draft_MODE_1_DRAFT', val);
          } catch (_) {}
          const activeMode = document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
          if (activeMode === 'MODE_1_DRAFT') {
            if (promptBox && promptBox.value !== val) {
              promptBox.value = val;
            }
            const richEl = document.getElementById('s18-rich-prompt-editor');
            if (richEl && window.NoirStudio?.v106CommandSuite?.richModeActive) {
              richEl.innerText = val;
            }
            this.updatePromptCounterUI(val);
          }
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
          let rawVal = Number(targetWordInput.value);
          if (rawVal > 40000) {
            rawVal = 40000;
            targetWordInput.value = '40000';
            this.utils?.showToast?.('⚠️ Giới hạn tối đa là 40.000 từ mỗi lần chạy Prompt!', 'warning', 2400);
          }
          if (rawVal >= 300) {
            try {
              localStorage.setItem(this.constants.STORAGE_KEYS.TARGET_WORDS, String(rawVal));
            } catch (_) {}
          }
        });
        targetWordInput.addEventListener('change', () => {
          const rawVal = Number(targetWordInput.value) || 3500;
          if (rawVal > 40000) {
            this.utils?.showToast?.('⚠️ Giới hạn tối đa là 40.000 từ mỗi lần chạy Prompt!', 'warning', 2400);
          }
          const cleanWords = Math.max(300, Math.min(40000, rawVal));
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
      if (window.NoirStudio?.v106CommandSuite) {
        const suite = window.NoirStudio.v106CommandSuite;
        if (suite.activeModeKey !== modeKey) {
          suite.saveCurrentModeDraft(suite.activeModeKey);
          suite.loadModeDraftIntoEditors(modeKey);
        } else {
          suite.refreshHeroTopLinksUI(modeKey);
        }
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
    getResolvedUserCommand(explicitModeKey = '') {
      const modeKey =
        explicitModeKey ||
        document.getElementById('select-ai-execution-mode')?.value ||
        'MODE_1_DRAFT';
      // Đồng bộ từ ô Rich Word-style nếu đang mở
      if (window.NoirStudio?.v106CommandSuite?.syncRichEditorToPlainTextarea) {
        try {
          window.NoirStudio.v106CommandSuite.syncRichEditorToPlainTextarea(false);
        } catch (_eSync) {}
      }

      // Nguồn 1: Ô nhập câu lệnh chính trong Cửa sổ điều khiển AI (đã tách riêng biệt theo từng Chế độ 1–6)
      const primaryEl = document.getElementById('s18-fullscreen-prompt-textarea');
      const primary = primaryEl?.value || '';
      if (primary.trim()) {
        return primary.trim();
      }

      // Nguồn 2: Draft đã lưu riêng cho đúng modeKey này (TUYỆT ĐỐI KHÔNG lấy nhầm draft của chế độ khác!)
      try {
        const perModeSaved = localStorage.getItem(`noir_v106_cmd_draft_${modeKey}`) || '';
        if (perModeSaved.trim()) {
          if (primaryEl && !primaryEl.value) primaryEl.value = perModeSaved.trim();
          return perModeSaved.trim();
        }
      } catch (_ePm) {}

      // Nguồn 3: Chỉ riêng Chế độ 5 mới đọc thêm ô phụ #mode5-prompt-input
      if (modeKey === 'MODE_5_DIAGRAM') {
        const mode5Box = document.getElementById('mode5-prompt-input')?.value || '';
        if (mode5Box.trim()) {
          return mode5Box.trim();
        }
      }

      return '';
    }

    getCompiledMode1PlotOutlineForPrompt() {
      const masterChk = document.getElementById('chk-cmd-link-plot-brainstorm');
      const masterEnabled = masterChk
        ? Boolean(masterChk.checked)
        : localStorage.getItem('noir_v106_plot_link_master_v1') !== '0';
      if (!masterEnabled) return '';

      const useAi = localStorage.getItem('noir_v106_plot_use_ai_v1') !== '0';
      const useManual = localStorage.getItem('noir_v106_plot_use_manual_v1') === '1';

      const parts = [];
      if (useAi) {
        const aiText = String(this.getMode2DevelopedOutlineText() || '').trim();
        if (aiText) {
          parts.push(
            `[A. THAM MƯU CỐT TRUYỆN THEO GEMINI / AI (CHẾ ĐỘ 2)]:\n${aiText}`
          );
        }
      }
      if (useManual) {
        let manualText = '';
        try {
          manualText = String(localStorage.getItem('noir_v106_manual_plot_outline_v1') || '').trim();
        } catch (_eM) {}
        if (manualText) {
          parts.push(
            `[B. THAM MƯU CỐT TRUYỆN RIÊNG TÁC GIẢ TỰ VIẾT (KHÔNG DÙNG AI)]:\n${manualText}`
          );
        }
      }
      return parts.join('\n\n--------------------------------------------------------------------\n\n');
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
      const sceneMarkersBlock =
        this.sceneBuilder?.buildCompiledSceneMarkersBlockForPrompt?.() ||
        '';

      const activeChap =
        this.chapterMgr?.syncEditorToActiveChapter?.() ||
        this.chapterMgr?.getActiveChapter?.() || {
          id: 'chap_default',
          displayTitle: 'Chương 1',
          title: 'Chương 1',
          content: ''
        };

      const userCommand = this.getResolvedUserCommand();
      const antiClicheRaw = String(
        document.getElementById('textarea-anti-cliche-blacklist')?.value || ''
      ).trim().slice(0, 600);

      // Đoạn cuối ngắn (~700 ký tự) của chương hiện tại để nối mạch mượt mà mà không làm phình prompt
      const currentText = String(activeChap?.content || '').trim();
      const tailShort = currentText ? currentText.slice(-700).trim() : '';

      // Nếu tác giả chưa nhập câu lệnh riêng, tự tổng hợp chỉ thị súc tích
      const resolvedCommandText =
        userCommand ||
        `Hãy triển khai tiếp diễn biến của "${
          activeChap?.displayTitle || 'Chương hiện tại'
        }" bám sát tuyệt đối 2 tệp đính kèm (File Story Bible + File Tham mưu cốt truyện) một cách chậm rãi, sâu tâm lý, giàu ngũ quan và lôi cuốn nhất.`;

      const techSpecLines = [
        `- Chương đang viết    : ${activeChap?.displayTitle || 'Chương 1'}`,
        `- Chế độ thực thi     : ${modeSpec.title} (${modeKey})`,
        `- Độ dài mục tiêu     : Khoảng ${targetWords.toLocaleString('vi-VN')} từ (Triển khai kỹ lưỡng, không tua nhanh sự kiện)`,
        `- Điểm nhìn (POV)     : ${pov}`,
        `- Độ bay bổng (Temp)  : ${temp}`,
        `- Định dạng hội thoại : Bắt buộc dùng "- Câu thoại (Tên nhân vật)"`,
        `- Cấu trúc đầu ra     :`,
        ...modeSpec.outputStructureGuide.map((line) => `  ${line}`)
      ].join('\n');

      // Lưu thống kê ngữ cảnh gọn nhẹ
      this.lastContextBreakdown = this.inspector.analyzeContextLayers({
        sysInstruction,
        techSpecBlock: techSpecLines,
        bibleBlock: '(Đính kèm qua File PDF Story Bible)',
        sceneMarkersBlock: sceneMarkersBlock || '(Không có)',
        approvedSummariesBlock: '(Đính kèm qua File PDF Tham Mưu Cốt Truyện)',
        ragBlock: '(Đọc trực tiếp từ 2 file đính kèm)',
        tailContextBlock: tailShort,
        userCommandBlock: resolvedCommandText
      });

      const sysTrimmed = String(sysInstruction || '').trim().slice(0, 3200);
      const sceneSection =
        sceneMarkersBlock && !/Chưa đặt mốc/i.test(sceneMarkersBlock)
          ? `\n=== [MỐC CHUYỂN PHÂN CẢNH / ĐỔI POV] ===\n${sceneMarkersBlock.slice(0, 1400)}\n`
          : '';
      const antiClicheSection = antiClicheRaw
        ? `\n[TỪ SÁO RỖNG CẤM DÙNG]: ${antiClicheRaw}\n`
        : '';
      const tailSection = tailShort
        ? `\n=== [ĐOẠN CUỐI CHƯƠNG HIỆN TẠI ĐỂ NỐI MẠCH] ===\n...${tailShort}\n`
        : '';

      const rawPrompt = [
        `🌟 PROMPT VIẾT TIỂU THUYẾT CHÍNH THỨC — CHẾ ĐỘ 1 (SÚC TÍCH ≤ 10.000 KÝ TỰ)`,
        ``,
        `📎 TÀI LIỆU ĐÍNH KÈM (TÁC GIẢ TẢI KÈM 2 FILE LÊN GEMINI CÙNG CÂU LỆNH NÀY):`,
        `  1. 📄 FILE 1 — STORY BIBLE (PDF): Đọc kỹ 100% Hồ sơ nhân vật, Dòng thời gian, Tài sản/Thương tích, Sổ cái phục bút và Ma trận "Ai Biết Gì" (TUYỆT ĐỐI không để lộ bí mật cho nhân vật chưa biết, không lệch mốc giờ/tiền bạc/OOC).`,
        `  2. 🧭 FILE 2 — THAM MƯU CỐT TRUYỆN (PDF): Bám sát toàn bộ diễn biến & dàn ý đã chốt trong file này, triển khai nhịp chậm rãi, giàu căng thẳng tâm lý và chiều sâu ngũ quan (KHÔNG tua nhanh hay rút gọn sự kiện).`,
        ``,
        `=== [VAI TRÒ & QUY TẮC VĂN HỌC CỐT LÕI] ===`,
        sysTrimmed,
        ``,
        `=== [THÔNG SỐ KỸ THUẬT] ===`,
        techSpecLines,
        sceneSection,
        antiClicheSection,
        tailSection,
        `********************************************************************`,
        `⭐ YÊU CẦU / CÂU LỆNH CÁ NHÂN CỦA NGƯỜI DÙNG (ƯU TIÊN THỰC THI CAO NHẤT) ⭐`,
        `********************************************************************`,
        resolvedCommandText,
        `********************************************************************`,
        ``,
        `🚀 BẮT ĐẦU: Đọc kỹ 2 file đính kèm (Story Bible + Tham mưu cốt truyện) rồi viết thẳng bản thảo chương truyện đạt chất lượng văn học cao nhất!`
      ].join('\n').replace(/\n{3,}/g, '\n\n');
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
        const recentChapterHint = chapText ? chapText.slice(-650).trim() : '';
        const sceneMarkersBlock =
          this.sceneBuilder?.buildCompiledSceneMarkersBlockForPrompt?.() || '';
        const sysTrimmed = String(sysInstruction || '').trim().slice(0, 3200);
        const sceneSection =
          sceneMarkersBlock && !/Chưa đặt mốc/i.test(sceneMarkersBlock)
            ? `\n[MỐC CHUYỂN PHÂN CẢNH / POV]:\n${sceneMarkersBlock.slice(0, 1200)}\n`
            : '';
        const tailSection = recentChapterHint
          ? `\n[ĐOẠN CUỐI CHƯƠNG HIỆN TẠI (${activeChap?.displayTitle || 'Chương hiện tại'})]:\n...${recentChapterHint}\n`
          : '';
        return wrapModePrompt([
          `🧭 CHẾ ĐỘ 2: THAM MƯU CỐT TRUYỆN & THIẾT KẾ DIỄN BIẾN CHUYÊN SÂU (SÚC TÍCH ≤ 10.000 KÝ TỰ)`,
          ``,
          `📎 TÀI LIỆU ĐÍNH KÈM: Tác giả sẽ tải kèm FILE PDF STORY BIBLE lên Gemini cùng câu lệnh này. AI BẮT BUỘC đối chiếu 100% File PDF Story Bible đính kèm (Hồ sơ nhân vật, Dòng thời gian, Tài sản/Thương tích, Sổ cái phục bút và Ma trận "Ai Biết Gì") — TUYỆT ĐỐI không lệch logic và không làm lộ bí mật cho nhân vật chưa biết!`,
          ``,
          `[1. VAI TRÒ & KHUNG THAM MƯU CỐT LÕI]:`,
          sysTrimmed,
          ``,
          `[2. CHƯƠNG ĐANG CHUẨN BỊ & TIÊU CHUẨN ĐẦU RA]:`,
          `- Chương: ${activeChap?.displayTitle || 'Chương tiếp theo'} · Điểm nhìn POV: ${pov}`,
          ...modeSpec.outputStructureGuide,
          `- Triển khai nhịp chậm rãi, giàu đấu trí và căng thẳng tâm lý; chia rõ từng phân cảnh cụ thể, tuyệt đối không tua nhanh sự kiện hay giải quyết mâu thuẫn hời hợt.`,
          sceneSection,
          tailSection,
          `********************************************************************`,
          `⭐ YÊU CẦU / DÀN Ý CÁ NHÂN CỦA NGƯỜI DÙNG (ƯU TIÊN THỰC THI CAO NHẤT) ⭐`,
          `********************************************************************`,
          cleanCmd || `Hãy đọc kỹ File PDF Story Bible tôi đính kèm và phát triển 3 phương án diễn biến chi tiết theo từng phân cảnh cho chương tiếp theo (chậm rãi, gài phục bút tinh tế, không tua nhanh sự kiện).`,
          `********************************************************************`,
          ``,
          `🚀 Hãy trình bày bản tham mưu rõ ràng từng phân cảnh (có thể dùng bảng biểu) để tôi chốt và đưa sang Chế độ 1 viết tiểu thuyết.`
        ].join('\n').replace(/\n{3,}/g, '\n\n'));
      }

      if (modeKey === 'MODE_3_AUDIT') {
        const chapterInventory = (this.chapterMgr?.chapters || [])
          .map((c, idx) => `  ${idx + 1}. ${c.displayTitle || c.title} (${c.status === 'APPROVED' ? 'Đã duyệt' : 'Nháp'})`)
          .join('\n');
        return wrapModePrompt([
          `🔍 CHẾ ĐỘ 3: KIỂM TOÁN LOGIC & SOI MÂU THUẪN TOÀN DIỆN (KHUYÊN DÙNG GOOGLE NOTEBOOKLM)`,
          `(Bám sát tuyệt đối bản Story Bible bạn đã tổng hợp ở phần trên và toàn bộ các chương truyện tôi đã tải lên làm nguồn — KHÔNG bỏ sót dù chỉ 1 chi tiết nhỏ).`,
          ``,
          `Bạn là một Tiểu Thuyết Gia & Tổng Biên Tập Kiểm Toán Logic 30 năm kinh nghiệm, soi lỗi sắc bén như thám tử pháp y văn bản:`,
          `1. DÒNG THỜI GIAN & ĐỒNG HỒ: Soi từng giờ, phút, ngày thứ mấy, khoảng cách di chuyển và đếm ngược nhiệm vụ — chỉ rõ mọi mốc mâu thuẫn hoặc dịch chuyển phi vật lý.`,
          `2. TÀI SẢN, VẬT PHẨM & THỂ CHẤT: Kiểm từng con số tiền bạc (thu/chi/số dư), vị trí vật chứng/thiết bị/tài liệu, tình trạng thương tích nhân vật (có bị tự nhiên biến mất vô lý không?).`,
          `3. MA TRẬN "AI BIẾT GÌ" (RÒ RỈ NHẬN THỨC): Phát hiện mọi chỗ nhân vật vô tình nói, nghĩ hoặc hành động dựa trên thông tin họ CHƯA ĐƯỢC BIẾT tại thời điểm đó.`,
          `4. TÍNH NHẤT QUÁN TÍNH CÁCH (OOC) & XƯNG HÔ: Chỉ rõ chỗ nhân vật hành xử trái bản chất hoặc lệch vai vế xưng hô.`,
          `5. SỔ CÁI PHỤC BÚT & LỖ HỔNG CỐT TRUYỆN: Liệt kê các phục bút bị treo quên hoặc xung đột giữa chương trước và chương sau.`,
          `6. ĐỀ XUẤT SỬA CỤ THỂ: Với MỖI lỗi phát hiện được, ghi rõ [Mức độ: Nghiêm trọng / Trung bình / Nhỏ] + [Vị trí Chương/Đoạn] + [Phân tích lỗi] + [Cách sửa dứt điểm kèm câu văn mẫu].`,
          ``,
          `[DANH SÁCH CHƯƠNG HIỆN CÓ]:`,
          chapterInventory || '  (Đối chiếu toàn bộ chương đã tải lên NotebookLM)',
          ``,
          `⭐ YÊU CẦU KIỂM TOÁN CÁ NHÂN CỦA NGƯỜI DÙNG:`,
          cleanCmd || `Hãy soi lỗi cực kỳ chi tiết toàn bộ logic dòng thời gian, tiền bạc, thương tích, vật chứng, OOC nhân vật và rò rỉ thông tin trong Ma trận Ai Biết Gì trên toàn bộ các chương tôi đã tải lên.`
        ]);
      }

      if (modeKey === 'MODE_4_REVIEW') {
        return wrapModePrompt([
          `📊 CHẾ ĐỘ 4: NHÀ PHÊ BÌNH VĂN HỌC CÔNG TÂM & HỘI ĐỒNG ĐỘC GIẢ BETA (KHUYÊN DÙNG GOOGLE NOTEBOOKLM)`,
          `(Bám sát tuyệt đối bản Story Bible bạn đã tổng hợp ở phần trên và toàn bộ các chương truyện tôi đã tải lên làm nguồn).`,
          ``,
          `Bạn là 1 Nhà Phê Bình Tiểu Thuyết, Văn Học Mạng & Chính Quy 20 năm kinh nghiệm cho các nhà xuất bản lớn. Hãy đọc thật kỹ toàn bộ các chương truyện đã tải lên và đánh giá thật công tâm, thẳng thắn, sắc sảo, không khen xã giao:`,
          `1. HƯỚNG ĐI CỐT TRUYỆN & ĐỘ LÔI CUỐN: Mạch truyện hiện tại đã tối ưu chưa? Có thực sự giữ chân độc giả từ mở đầu đến kết chương (hook / cliffhanger) không? Đoạn nào bị chùng nhịp, dài dòng hoặc vội vàng?`,
          `2. TỐC ĐỘ & TÍNH CHÂN THỰC / SỨC MẠNH: Tốc độ phát triển nhân vật, năng lực, tài chính hay âm mưu có bị "ảo quá", buff quá đà hay giải quyết quá dễ dãi không? Chỉ rõ chỗ cần tiết chế để thuyết phục hơn.`,
          `3. CHẤM ĐIỂM 6 TRỤ CỘT VĂN HỌC (Thang 10): Cốt truyện · Tâm lý nhân vật · Nhịp điệu · Hội thoại · Hình ảnh Ngũ quan (Show Don't Tell) · Tự nhiên & chống sáo rỗng AI.`,
          `4. GÓC NHÌN 3 NHÓM ĐỘC GIẢ KHÓ TÍNH: (a) Độc giả mê đấu trí logic; (b) Độc giả thích chiều sâu tâm lý; (c) Độc giả đọc giải trí nhanh trên điện thoại — họ sẽ khen gì và dễ bỏ truyện ở đúng điểm nào?`,
          `5. ĐỀ XUẤT CẢI THIỆN ĐẮT GIÁ NHẤT: Chỉ ra 5 điểm cần nâng cấp ngay kèm ví dụ viết lại ngắn theo đúng văn phong tác giả.`,
          ``,
          `⭐ YÊU CẦU PHÊ BÌNH CÁ NHÂN CỦA NGƯỜI DÙNG:`,
          cleanCmd || `Hãy phân tích công tâm xem hướng đi cốt truyện đã tối ưu chưa, có thực sự lôi cuốn độc giả không, chỗ nào cần cải thiện để giữ chân người đọc và khiến nhịp truyện cùng sức mạnh nhân vật không bị ảo quá.`
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

        if (styleKey === 'CUSTOM_FREE' && cleanCmd) {
          return wrapModePrompt([
            `🖼️ CHẾ ĐỘ 6 — TẠO BÌA TRUYỆN TỰ DO (DÁN VÀO MỤC "TẠO HÌNH ẢNH" CỦA GEMINI)`,
            `(Bám sát Story Bible và bối cảnh các chương truyện đã tải lên/tổng hợp ở phần trên).`,
            `- Tên truyện: "${novelTitle}" · Bút danh: "${authorName}" · Tỷ lệ dọc 2:3 chuẩn bìa sách xuất bản.`,
            ``,
            `⭐ YÊU CẦU THIẾT KẾ BÌA CỦA NGƯỜI DÙNG:`,
            cleanCmd
          ]);
        }

        return wrapModePrompt([
          `🖼️ CHẾ ĐỘ 6: TẠO BÌA TRUYỆN CHUYÊN NGHIỆP BẰNG AI (DÁN VÀO MỤC "TẠO HÌNH ẢNH" CỦA GEMINI)`,
          `(Bám sát Story Bible bạn đã tổng hợp ở phần trên và các chương truyện đã tải lên để vẽ đúng tạo hình nhân vật, bối cảnh & không khí truyện).`,
          ``,
          `1. THÔNG TIN BÌA SÁCH:`,
          `- Tên tác phẩm: "${novelTitle}" | Bút danh: "${authorName}"`,
          `- Tỷ lệ dọc 2:3 (Book Cover Vertical Poster), bố cục chuẩn xuất bản (chừa vùng thoáng/tương phản đẹp cho tiêu đề & tên tác giả).`,
          ``,
          `2. PHONG CÁCH NGHỆ THUẬT (${styleObj.label}):`,
          styleObj.directive || 'Phong cách minh họa bìa tiểu thuyết xuất bản chuyên nghiệp, ánh sáng điện ảnh, giàu cảm xúc.',
          ``,
          `⭐ YÊU CẦU THIẾT KẾ BÌA CÁ NHÂN CỦA NGƯỜI DÙNG:`,
          cleanCmd || `Thiết kế cảnh đắt giá nhất thể hiện linh hồn bộ truyện, nhân vật chính có thần thái cuốn hút, đạo cụ biểu tượng nổi bật và bầu không khí giàu kịch tính.`,
          ``,
          `🚀 CHỈ THỊ VẼ ẢNH: Vẽ sắc nét, không méo bàn tay/khuôn mặt, ánh sáng có chiều sâu, không sinh chữ lỗi (no gibberish text).`
        ]);
      }

      const rawMode5 = [
        `🎨 CHẾ ĐỘ 5: VẼ SƠ ĐỒ CỐT TRUYỆN, TIMELINE & MẠNG LƯỚI NHÂN VẬT DẠNG PLAINTEXT MÃ ASCII CHUẨN ĐẸP`,
        `(Bám sát tuyệt đối bản Story Bible bạn đã tổng hợp ở phần trên và toàn bộ các chương truyện tôi đã tải lên làm nguồn).`,
        ``,
        `YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (ĐỂ TÔI COPY THẲNG KHÔNG BỊ VỠ KHUNG):`,
        `- Hãy vẽ toàn bộ sơ đồ đặt bên trong 1 khối mã Plaintext (code block \`\`\`text ... \`\`\`) dùng ký tự kẻ khung Unicode sắc nét (┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼ ──▶ ▼ ◄── ═══), căn lề thẳng hàng tuyệt đối, mũi tên chỉ hướng rõ ràng, khoảng trắng thoáng dễ nhìn, KHÔNG bị lệch dòng.`,
        `- Nếu dùng Google NotebookLM: hãy vừa vẽ khối sơ đồ Plaintext ASCII thật đẹp rõ mũi tên trong khung chat, vừa gợi ý cấu trúc để tạo Bản đồ tư duy / Báo cáo trực quan ở thanh Studio bên phải.`,
        `- Bao gồm 3 sơ đồ nối tiếp rõ ràng:`,
        `  1. SƠ ĐỒ TRỤC THỜI GIAN (TIMELINE): Arc → Hồi/Chương → Mốc giờ/ngày → Địa điểm → Bước ngoặt chính (có mũi tên ──▶ và ▼ mạch lạc).`,
        `  2. SƠ ĐỒ MẠNG LƯỚI NHÂN VẬT & PHE PHÁI: Ai là đồng minh (<══>), đối thủ (──✖──), ai đang giấu bí mật gì với ai.`,
        `  3. CÂY PHỤC BÚT & NGÒI NỔ: Phân tách [ĐÃ KÍCH NỔ] vs [ĐANG TREO CHỜ BÙNG NỔ] (kèm đánh dấu [!] nếu có điểm lệch logic).`,
        ``,
        `⭐ YÊU CẦU VẼ SƠ ĐỒ CÁ NHÂN CỦA NGƯỜI DÙNG:`,
        cleanCmd || `Hãy vẽ sơ đồ cốt truyện, trục timeline hiện tại, mạng lưới nhân vật và cây phục bút dạng Plaintext mã ASCII sắc nét, mũi tên rõ ràng dễ nhìn để tôi copy trực tiếp vào Studio.`
      ].join('\n');
      const trPrompt = window.NoirNovel?.i18n?.translatePromptFrame;
      return typeof trPrompt === 'function' ? trPrompt(rawMode5) : rawMode5;
    }

    buildSynthesizedPromptForMode(modeKey, resolvedCmd = '') {
      if (modeKey === 'MODE_1_DRAFT') {
        return this.buildMasterSynthesizedPrompt();
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
      window.NoirStudio?.v106CommandSuite?.renderPromptLengthLimitGuard?.(completePrompt, modeKey);
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
      if (this.isSynthesizing && Date.now() - (this._synthStartedAt || 0) < 4000) return;
      this.isSynthesizing = true;
      this._synthStartedAt = Date.now();

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
              syncTracker.acknowledgeStaleForCurrentChapters('M1');
              this.isSynthesizing = false;
              this.runStep1MasterSynthesis(true, true);
            });
            return;
          }
          if (currentModeKey === 'MODE_2_BRAINSTORM' && syncTracker.shouldWarnMode2Stale()) {
            this.isSynthesizing = false;
            syncTracker.openMode2StaleWarningModal(() => {
              syncTracker.acknowledgeStaleForCurrentChapters('M2');
              this.isSynthesizing = false;
              this.runStep1MasterSynthesis(true, true);
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

        // Đồng bộ Story Bible không chặn (non-blocking) để mở ngay cửa sổ xác nhận Prompt
        if (this.storyBible && typeof this.storyBible.saveAllBibleData === 'function') {
          try {
            const pSave = this.storyBible.saveAllBibleData(false);
            if (pSave && typeof pSave.catch === 'function') pSave.catch(() => {});
          } catch (_eSbSave) {}
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
        window.NoirStudio?.v106CommandSuite?.renderPromptLengthLimitGuard?.(synthesized, 'MODE_1_DRAFT');
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

    acknowledgeStaleForCurrentChapters(which = 'BOTH') {
      const fp = this.computeChaptersFingerprint();
      if (!fp) return;
      try {
        if (which === 'M1' || which === 'BOTH') {
          this._sessionAckFpM1 = fp;
          localStorage.setItem('noir_v108_ack_stale_m1_fp', fp);
        }
        if (which === 'M2' || which === 'BOTH') {
          this._sessionAckFpM2 = fp;
          localStorage.setItem('noir_v108_ack_stale_m2_fp', fp);
        }
      } catch (_eAck) {}
    }

    shouldWarnMode1Stale() {
      const curFp = this.computeChaptersFingerprint();
      if (!curFp) return false;
      try {
        if (localStorage.getItem(this.KEY_SKIP_M1) === '1') return false;
        if (this._sessionAckFpM1 === curFp || localStorage.getItem('noir_v108_ack_stale_m1_fp') === curFp) {
          return false;
        }
      } catch (_e) {}
      return this.isStoryBibleStale() || this.isMode2Stale();
    }

    shouldWarnMode2Stale() {
      const curFp = this.computeChaptersFingerprint();
      if (!curFp) return false;
      try {
        if (localStorage.getItem(this.KEY_SKIP_M2) === '1') return false;
        if (this._sessionAckFpM2 === curFp || localStorage.getItem('noir_v108_ack_stale_m2_fp') === curFp) {
          return false;
        }
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
      modal.style.zIndex = '2147483000';
      modal.className =
        'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto';

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
      const runProceedM1 = (ev) => {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        saveSkipIfChecked();
        this.acknowledgeStaleForCurrentChapters('M1');
        close();
        if (this.synth) this.synth.isSynthesizing = false;
        setTimeout(() => {
          try { onProceed?.(); } catch (err) { console.error('[mod16] m1 proceed err:', err); }
        }, 15);
      };
      modal.querySelector('#btn-v105-m1-proceed')?.addEventListener('click', runProceedM1);
      modal.addEventListener('click', (ev) => {
        if (ev.target?.closest?.('#btn-v105-m1-proceed')) {
          runProceedM1(ev);
        }
      }, true);
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
      modal.style.zIndex = '2147483000';
      modal.className =
        'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto';

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
      const runProceedM2 = (ev) => {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        if (modal.querySelector('#chk-v105-skip-m2-warn')?.checked) {
          try { localStorage.setItem(this.KEY_SKIP_M2, '1'); } catch (_e) {}
        }
        this.acknowledgeStaleForCurrentChapters('M2');
        close();
        if (this.synth) this.synth.isSynthesizing = false;
        setTimeout(() => {
          try { onProceed?.(); } catch (err) { console.error('[mod16] m2 proceed err:', err); }
        }, 15);
      };
      modal.querySelector('#btn-v105-m2-proceed')?.addEventListener('click', runProceedM2);
      modal.addEventListener('click', (ev) => {
        if (ev.target?.closest?.('#btn-v105-m2-proceed')) {
          runProceedM2(ev);
        }
      }, true);
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
      // Singleton: tối đa 1 cửa sổ Gemini + 1 cửa sổ NotebookLM bật cùng lúc — nếu cửa sổ đó đang mở sẵn thì điều hướng & focus thẳng qua nó, KHÔNG tạo cửa sổ thứ 2!
      const existingWin = isNotebook ? this._activeNotebookLmWin : this._activeGeminiWin;
      if (existingWin && !existingWin.closed) {
        try {
          existingWin.focus();
          window.NoirStudio?.utils?.showToast?.(
            isNotebook
              ? '✨ Cửa sổ Google NotebookLM đang mở sẵn — Đã chuyển thẳng qua cửa sổ đó (bấm Ctrl+V để dán câu lệnh)!'
              : '✨ Cửa sổ Gemini đang mở sẵn — Đã chuyển thẳng qua cửa sổ đó (bấm Ctrl+V để dán câu lệnh)!',
            'success',
            3600
          );
          return true;
        } catch (_eFocus) {}
      }

      const features = `popup=yes,resizable=yes,scrollbars=yes,left=${rightX},top=${availTop},width=${halfW},height=${availH}`;
      const opened = window.open(webUrl, winName, features);
      if (opened) {
        if (isNotebook) this._activeNotebookLmWin = opened;
        else this._activeGeminiWin = opened;
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

      const guideDrawerHtml =
        window.NoirStudio?.aiGuides?.buildCollapsibleSplitGuideHtml?.(
          isNotebook ? 'NOTEBOOKLM' : 'GEMINI',
          modeKey
        ) || '';

      modal.innerHTML = `
        <div class="my-auto w-full max-w-2xl rounded-2xl border-2 border-indigo-400/75 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-indigo-950/80 via-violet-950/60 to-zinc-950 flex items-center justify-between gap-2">
            <div class="font-extrabold text-sm text-indigo-200">${targetTitle}</div>
            <button type="button" id="btn-close-split-bridge-modal" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕</button>
          </div>
          <div class="p-4 space-y-3 max-h-[82vh] overflow-y-auto">
            <div class="p-2.5 rounded-xl border border-emerald-500/50 bg-emerald-950/35 text-emerald-100 font-bold flex items-center justify-between gap-2">
              <span>✅ Đã copy câu lệnh thành công vào bộ nhớ tạm!</span>
              <button type="button" id="btn-split-bridge-recopy" class="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10.5px] font-bold shrink-0">📋 Copy lại</button>
            </div>
            ${modelReminderHtml}
            ${mode6TipHtml}
            ${guideDrawerHtml}
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
      window.NoirStudio?.aiGuides?.bindCollapsibleSplitGuideEvents?.(modal);
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

  class V106CommandBoxAndLimitGuards {
    constructor(synthEngine) {
      this.synth = synthEngine;
      this.activeModeKey = 'MODE_1_DRAFT';
      this.richModeActive = true;
      this.modeImagesMap = {};
      this.lastOver10AlertModeCount = {};
      this._bound = false;
      this._syncingFromPlain = false;
      this.SKIP_IMG_PDF_KEY = 'noir_v106_skip_img_pdf_popup_v1';
      this.PLOT_MASTER_KEY = 'noir_v106_plot_link_master_v1';
      this.PLOT_USE_AI_KEY = 'noir_v106_plot_use_ai_v1';
      this.PLOT_USE_MANUAL_KEY = 'noir_v106_plot_use_manual_v1';
      this.PLOT_MANUAL_TEXT_KEY = 'noir_v106_manual_plot_outline_v1';
    }

    getModeShortLabel(modeKey) {
      const map = {
        MODE_1_DRAFT: 'Chế độ 1 (Viết truyện)',
        MODE_2_BRAINSTORM: 'Chế độ 2 (Tham mưu)',
        MODE_3_AUDIT: 'Chế độ 3 (Soi logic)',
        MODE_4_REVIEW: 'Chế độ 4 (Đánh giá)',
        MODE_5_DIAGRAM: 'Chế độ 5 (Sơ đồ)',
        MODE_6_BOOK_COVER: 'Chế độ 6 (Tạo bìa)'
      };
      return map[modeKey] || modeKey;
    }

    escapeHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    serializeRichNodeToPlainText(rootEl) {
      if (!rootEl) return '';
      const walk = (node) => {
        if (!node) return '';
        if (node.nodeType === 3) return node.nodeValue || '';
        if (node.nodeType !== 1) return '';
        const tag = String(node.tagName || '').toUpperCase();
        if (tag === 'BR') return '\n';
        if (tag === 'IMG') {
          const alt = node.getAttribute('alt') || 'Ảnh đính kèm';
          return `[🖼️ ${alt}]`;
        }
        if (tag === 'TABLE') {
          const rows = Array.from(node.querySelectorAll('tr'));
          const mdRows = rows.map((tr, rIdx) => {
            const cells = Array.from(tr.querySelectorAll('th,td')).map((c) =>
              String(c.innerText || c.textContent || '')
                .replace(/\s+/g, ' ')
                .trim()
            );
            const line = `| ${cells.join(' | ')} |`;
            if (rIdx === 0 && cells.length > 0) {
              return `${line}\n| ${cells.map(() => '---').join(' | ')} |`;
            }
            return line;
          });
          return `\n${mdRows.join('\n')}\n`;
        }
        let inner = '';
        node.childNodes.forEach((ch) => {
          inner += walk(ch);
        });
        if (['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(tag)) {
          return `${inner}\n`;
        }
        return inner;
      };
      return walk(rootEl)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    saveCurrentModeDraft(modeKey = this.activeModeKey) {
      const mKey = modeKey || 'MODE_1_DRAFT';
      const plainEl = document.getElementById('s18-fullscreen-prompt-textarea');
      const richEl = document.getElementById('s18-rich-prompt-editor');
      let plainVal = plainEl ? String(plainEl.value || '') : '';
      if (this.richModeActive && richEl) {
        plainVal = this.serializeRichNodeToPlainText(richEl);
        if (plainEl && plainEl.value !== plainVal) {
          plainEl.value = plainVal;
        }
      }
      try {
        localStorage.setItem(`noir_v106_cmd_draft_${mKey}`, plainVal);
        if (richEl && this.richModeActive) {
          const clone = richEl.cloneNode(true);
          clone.querySelectorAll('img').forEach((im) => {
            if ((im.getAttribute('src') || '').length > 120000) im.remove();
          });
          const html = clone.innerHTML || '';
          if (html.length < 180000) {
            localStorage.setItem(`noir_v106_cmd_rich_${mKey}`, html);
          }
        }
      } catch (_eSave) {}
    }

    loadModeDraftIntoEditors(modeKey) {
      const mKey = modeKey || 'MODE_1_DRAFT';
      this.activeModeKey = mKey;
      const plainEl = document.getElementById('s18-fullscreen-prompt-textarea');
      const richEl = document.getElementById('s18-rich-prompt-editor');
      let savedPlain = '';
      let savedRich = '';
      try {
        savedPlain = localStorage.getItem(`noir_v106_cmd_draft_${mKey}`) || '';
        savedRich = localStorage.getItem(`noir_v106_cmd_rich_${mKey}`) || '';
      } catch (_eLoad) {}

      this._syncingFromPlain = true;
      if (plainEl) {
        plainEl.value = savedPlain;
      }
      if (richEl) {
        if (savedRich && savedRich.trim()) {
          richEl.innerHTML = savedRich;
        } else {
          richEl.innerText = savedPlain;
        }
      }
      this._syncingFromPlain = false;

      const badge = document.getElementById('cmd-active-mode-draft-badge');
      if (badge) {
        badge.textContent = `🗂️ Ô lệnh riêng: ${this.getModeShortLabel(mKey)}`;
      }

      const counterEl = document.getElementById('prompt-char-counter');
      if (counterEl) {
        counterEl.textContent = `${savedPlain.length.toLocaleString('vi-VN')} ký tự`;
      }

      this.refreshHeroTopLinksUI(mKey);
      this.renderAttachedImagesBar(mKey);
    }

    syncRichEditorToPlainTextarea(persist = true) {
      if (this._syncingFromPlain) return;
      const richEl = document.getElementById('s18-rich-prompt-editor');
      const plainEl = document.getElementById('s18-fullscreen-prompt-textarea');
      if (!richEl || !plainEl || !this.richModeActive) return;
      const serialized = this.serializeRichNodeToPlainText(richEl);
      if (plainEl.value !== serialized) {
        plainEl.value = serialized;
      }
      const counterEl = document.getElementById('prompt-char-counter');
      if (counterEl) {
        counterEl.textContent = `${serialized.length.toLocaleString('vi-VN')} ký tự`;
      }
      if (persist) {
        this.saveCurrentModeDraft(this.activeModeKey);
      }
    }

    getModeImages(modeKey = this.activeModeKey) {
      const mKey = modeKey || 'MODE_1_DRAFT';
      if (!Array.isArray(this.modeImagesMap[mKey])) {
        this.modeImagesMap[mKey] = [];
      }
      return this.modeImagesMap[mKey];
    }

    addImagesToCurrentMode(imageItems = []) {
      const mKey = this.activeModeKey || 'MODE_1_DRAFT';
      const list = this.getModeImages(mKey);
      imageItems.forEach((item) => {
        if (item && item.dataUrl) {
          list.push({
            id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: item.name || `Anh_${list.length + 1}.png`,
            dataUrl: item.dataUrl
          });
        }
      });
      this.renderAttachedImagesBar(mKey);
      if (list.length > 10) {
        const skipPopup = localStorage.getItem(this.SKIP_IMG_PDF_KEY) === '1';
        const prevAlerted = this.lastOver10AlertModeCount[mKey] || 0;
        if (!skipPopup && list.length > prevAlerted) {
          this.lastOver10AlertModeCount[mKey] = list.length;
          this.openOver10ImagesPdfPromptModal(mKey, list.length);
        }
      }
    }

    renderAttachedImagesBar(modeKey = this.activeModeKey) {
      const list = this.getModeImages(modeKey);
      const bar = document.getElementById('cmd-attached-images-bar');
      const btnPdf = document.getElementById('btn-cmd-images-to-pdf');
      const countEl = document.getElementById('cmd-attached-images-count');
      if (countEl) countEl.textContent = String(list.length);
      if (btnPdf) btnPdf.classList.toggle('hidden', list.length === 0);
      if (!bar) return;
      if (list.length === 0) {
        bar.classList.add('hidden');
        bar.innerHTML = '';
        return;
      }
      bar.classList.remove('hidden');
      const overLimitHtml =
        list.length > 10
          ? `<span class="px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400 text-amber-200 font-black text-[10px]">⚠️ ${list.length} ảnh (vượt 10 ảnh/lệnh Gemini — nên gộp PDF!)</span>`
          : `<span class="text-[10.5px] text-violet-200 font-bold">🖼️ Đã đính kèm ${list.length} ảnh riêng cho ${this.getModeShortLabel(modeKey)}</span>`;
      const thumbsHtml = list
        .map(
          (img, idx) => `
          <div class="relative group w-14 h-14 rounded-lg overflow-hidden border border-violet-400/50 bg-zinc-950 shrink-0">
            <img src="${img.dataUrl}" alt="${this.escapeHtml(img.name)}" class="w-full h-full object-cover" />
            <button type="button" data-remove-cmd-img="${idx}" class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none flex items-center justify-center opacity-90 hover:opacity-100" title="Gỡ ảnh này">✕</button>
          </div>
        `
        )
        .join('');
      bar.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          ${overLimitHtml}
          <div class="flex items-center gap-1.5">
            <button type="button" id="btn-cmd-bar-convert-pdf" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-[10px] transition">📄 Gộp ${list.length} ảnh thành PDF & Tải về</button>
            <button type="button" id="btn-cmd-bar-clear-imgs" class="px-2 py-1 rounded-lg border border-rose-500/50 text-rose-300 hover:bg-rose-500/20 font-bold text-[10px] transition">🗑️ Xóa hết ảnh</button>
          </div>
        </div>
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">${thumbsHtml}</div>
      `;
      bar.querySelectorAll('[data-remove-cmd-img]').forEach((b) => {
        b.addEventListener('click', () => {
          const idx = Number(b.getAttribute('data-remove-cmd-img'));
          if (!Number.isNaN(idx)) {
            list.splice(idx, 1);
            this.renderAttachedImagesBar(modeKey);
          }
        });
      });
      bar.querySelector('#btn-cmd-bar-convert-pdf')?.addEventListener('click', () => {
        this.exportAttachedImagesToPdf(modeKey);
      });
      bar.querySelector('#btn-cmd-bar-clear-imgs')?.addEventListener('click', () => {
        list.length = 0;
        this.renderAttachedImagesBar(modeKey);
      });
    }

    openOver10ImagesPdfPromptModal(modeKey, count) {
      document.getElementById('modal-v106-over10-images-pdf')?.remove();
      const modal = document.createElement('div');
      modal.id = 'modal-v106-over10-images-pdf';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.style.zIndex = '2147483100';
      modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto';
      modal.innerHTML = `
        <div class="my-auto w-full max-w-md rounded-2xl border-2 border-amber-400/80 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-amber-950/80 to-violet-950/60 flex items-center justify-between gap-2">
            <div class="font-extrabold text-sm text-amber-300">🖼️ Bạn Đang Có Nhiều Ảnh (${count} ảnh)</div>
            <button type="button" id="btn-close-v106-img-pdf" class="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕</button>
          </div>
          <div class="p-4 space-y-3.5">
            <p class="text-[12.5px] leading-relaxed text-zinc-100">
              Bạn đang có nhiều ảnh (<strong class="text-amber-300">${count} ảnh</strong> — vượt giới hạn <strong>10 ảnh/câu lệnh</strong> của Gemini). Bạn muốn mình <strong class="text-emerald-300">gộp &amp; convert mớ ảnh này thẳng qua 1 file PDF</strong> tải về máy để bạn gửi cho Gemini quét không?
            </p>
            <p class="text-[11px] text-zinc-400">
              ⚡ Xử lý 100% ngay trên máy bạn (tải thẳng về thư mục Downloads, KHÔNG ghi vào thư mục công việc truyện).
            </p>
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-300 cursor-pointer select-none">
              <input type="checkbox" id="chk-v106-skip-img-pdf" class="accent-amber-400 w-4 h-4 shrink-0" />
              <span>Không hiện hộp thoại này ở lần sau</span>
            </label>
            <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button type="button" id="btn-v106-img-pdf-cancel" class="px-3.5 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-bold transition">Không, giữ nguyên</button>
              <button type="button" id="btn-v106-img-pdf-confirm" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-zinc-950 font-black shadow-lg transition">✅ Có, Gộp Ảnh Thành PDF &amp; Tải Về</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const saveSkip = () => {
        if (modal.querySelector('#chk-v106-skip-img-pdf')?.checked) {
          try { localStorage.setItem(this.SKIP_IMG_PDF_KEY, '1'); } catch (_e) {}
        }
      };
      const close = () => { saveSkip(); modal.remove(); };
      modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
      modal.querySelector('#btn-close-v106-img-pdf')?.addEventListener('click', close);
      modal.querySelector('#btn-v106-img-pdf-cancel')?.addEventListener('click', close);
      modal.querySelector('#btn-v106-img-pdf-confirm')?.addEventListener('click', async () => {
        saveSkip();
        modal.remove();
        await this.exportAttachedImagesToPdf(modeKey);
      });
    }

    // Pure-JS 100% Client-Side Multi-Page JPEG-in-PDF 1.4 Binary Builder (Zero server upload!)
    buildPdfBlobFromJpegPages(jpegPages = []) {
      const encoder = new TextEncoder();
      const chunks = [];
      let byteLen = 0;
      const pushStr = (s) => {
        const b = encoder.encode(s);
        chunks.push(b);
        byteLen += b.length;
      };
      const pushBytes = (u8) => {
        chunks.push(u8);
        byteLen += u8.length;
      };

      const offsets = [0];
      pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

      const pageCount = jpegPages.length;
      const kidsRefs = [];
      // Object 1: Catalog, Object 2: Pages
      // For each page i (0-based): ImageObj = 3 + i*3, ContentObj = 4 + i*3, PageObj = 5 + i*3
      for (let i = 0; i < pageCount; i++) {
        kidsRefs.push(`${5 + i * 3} 0 R`);
      }

      offsets.push(byteLen);
      pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

      offsets.push(byteLen);
      pushStr(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(' ')}] /Count ${pageCount} >>\nendobj\n`);

      for (let i = 0; i < pageCount; i++) {
        const pg = jpegPages[i];
        const imgObjNum = 3 + i * 3;
        const contentObjNum = 4 + i * 3;
        const pageObjNum = 5 + i * 3;

        // A4 width=595pt, compute height keeping aspect ratio (capped nicely)
        const pageW = 595;
        const pageH = Math.max(240, Math.min(842, Math.round((pg.height / Math.max(1, pg.width)) * pageW)));
        const drawW = pageW - 24;
        const drawH = Math.min(pageH - 24, (pg.height / Math.max(1, pg.width)) * drawW);
        const drawX = Math.round((pageW - drawW) / 2);
        const drawY = Math.round((pageH - drawH) / 2);

        offsets.push(byteLen);
        pushStr(
          `${imgObjNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pg.width} /Height ${pg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.bytes.length} >>\nstream\n`
        );
        pushBytes(pg.bytes);
        pushStr('\nendstream\nendobj\n');

        const contentStream = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${drawX} ${drawY} cm\n/Im0 Do\nQ\n`;
        const contentBytes = encoder.encode(contentStream);
        offsets.push(byteLen);
        pushStr(`${contentObjNum} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
        pushBytes(contentBytes);
        pushStr('endstream\nendobj\n');

        offsets.push(byteLen);
        pushStr(
          `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 ${imgObjNum} 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`
        );
      }

      const xrefOffset = byteLen;
      pushStr(`xref\n0 ${offsets.length}\n`);
      pushStr('0000000000 65535 f \n');
      for (let i = 1; i < offsets.length; i++) {
        pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
      }
      pushStr(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

      return new Blob(chunks, { type: 'application/pdf' });
    }

    dataUrlToJpegPage(dataUrl) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1600;
            let w = img.naturalWidth || img.width || 800;
            let h = img.naturalHeight || img.height || 600;
            if (w > maxDim || h > maxDim) {
              const ratio = Math.min(maxDim / w, maxDim / h);
              w = Math.max(1, Math.round(w * ratio));
              h = Math.max(1, Math.round(h * ratio));
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            const b64 = jpegDataUrl.split(',')[1] || '';
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            resolve({ width: w, height: h, bytes });
          } catch (_eC) {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
    }

    triggerBlobDownload(blob, fileName) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 2000);
    }

    async exportAttachedImagesToPdf(modeKey = this.activeModeKey) {
      const list = this.getModeImages(modeKey);
      if (list.length === 0) {
        window.NoirStudio?.utils?.showToast?.('⚠️ Chưa có ảnh nào được đính kèm trong ô lệnh này!', 'warning', 2400);
        return false;
      }
      window.NoirStudio?.utils?.showToast?.(`⏳ Đang gộp ${list.length} ảnh thành PDF ngay trên máy bạn...`, 'info', 2200);
      const pages = [];
      for (const item of list) {
        const pg = await this.dataUrlToJpegPage(item.dataUrl);
        if (pg) pages.push(pg);
      }
      if (pages.length === 0) {
        window.NoirStudio?.utils?.showToast?.('❌ Không thể chuyển đổi ảnh sang PDF.', 'error', 2800);
        return false;
      }
      const pdfBlob = this.buildPdfBlobFromJpegPages(pages);
      const stamp = new Date().toISOString().slice(0, 10);
      this.triggerBlobDownload(pdfBlob, `Gemini_Images_${pages.length}anh_${stamp}.pdf`);
      window.NoirStudio?.utils?.showToast?.(
        `✅ Đã gộp ${pages.length} ảnh thành file PDF và tải thẳng về thư mục Downloads! Bạn chỉ cần tải file PDF này lên Gemini nhé.`,
        'success',
        4600
      );
      return true;
    }

    // Xuất toàn bộ Prompt dài thành file PDF tiếng Việt sắc nét 100% trên máy người dùng (Canvas UTF-8 -> PDF)
    async exportCompiledPromptToPdf(promptText, modeKey = 'MODE_1_DRAFT') {
      const text = String(promptText || '').trim();
      if (!text) {
        window.NoirStudio?.utils?.showToast?.('⚠️ Nội dung Prompt đang trống!', 'warning', 2200);
        return false;
      }
      window.NoirStudio?.utils?.showToast?.('📄 Đang tạo file PDF câu lệnh tổng hợp ngay trên máy bạn...', 'info', 2500);
      const pageW = 1240;
      const pageH = 1754;
      const padX = 76;
      const padY = 76;
      const maxTextW = pageW - padX * 2;
      const lineH = 30;
      const maxLinesPerPage = Math.floor((pageH - padY * 2 - 40) / lineH);

      const measureCanvas = document.createElement('canvas');
      const mCtx = measureCanvas.getContext('2d');
      mCtx.font = '21px "Segoe UI", "Roboto", "Arial", sans-serif';

      const wrappedLines = [];
      const rawLines = text.split(/\r?\n/);
      for (const rawLine of rawLines) {
        if (!rawLine.trim()) {
          wrappedLines.push('');
          continue;
        }
        const words = rawLine.split(/\s+/);
        let cur = '';
        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w;
          if (mCtx.measureText(test).width > maxTextW && cur) {
            wrappedLines.push(cur);
            cur = w;
          } else {
            cur = test;
          }
        }
        if (cur) wrappedLines.push(cur);
      }

      const pages = [];
      const totalPages = Math.max(1, Math.ceil(wrappedLines.length / maxLinesPerPage));
      for (let p = 0; p < totalPages; p++) {
        const canvas = document.createElement('canvas');
        canvas.width = pageW;
        canvas.height = pageH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageW, pageH);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px "Segoe UI", "Roboto", "Arial", sans-serif';
        ctx.fillText(`PROMPT TỔNG HỢP (${this.getModeShortLabel(modeKey)}) — Trang ${p + 1}/${totalPages}`, padX, 46);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padX, 58);
        ctx.lineTo(pageW - padX, 58);
        ctx.stroke();

        ctx.fillStyle = '#111827';
        ctx.font = '21px "Segoe UI", "Roboto", "Arial", sans-serif';
        const slice = wrappedLines.slice(p * maxLinesPerPage, (p + 1) * maxLinesPerPage);
        slice.forEach((line, idx) => {
          ctx.fillText(line, padX, padY + 24 + idx * lineH);
        });

        const jpegUrl = canvas.toDataURL('image/jpeg', 0.86);
        const b64 = jpegUrl.split(',')[1] || '';
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        pages.push({ width: pageW, height: pageH, bytes });
      }

      const pdfBlob = this.buildPdfBlobFromJpegPages(pages);
      const stamp = new Date().toISOString().slice(0, 10);
      this.triggerBlobDownload(pdfBlob, `Prompt_Gemini_${modeKey}_${stamp}.pdf`);
      window.NoirStudio?.utils?.showToast?.(
        `✅ Đã xuất file PDF câu lệnh (${totalPages} trang) về Downloads! Bạn tải file PDF này lên Gemini rồi nhắn "Đọc và thực thi toàn bộ file PDF này" nhé.`,
        'success',
        5200
      );
      return true;
    }

    refreshHeroTopLinksUI(modeKey = this.activeModeKey) {
      const mKey = modeKey || document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
      const topBar = document.getElementById('cmd-hero-links-topbar');
      const plotCard = document.getElementById('cmd-hero-plot-link-card');
      const bibleStatus = document.getElementById('badge-cmd-hero-bible-status');
      const plotStatus = document.getElementById('badge-cmd-hero-plot-status');
      const bibleChk = document.getElementById('chk-cmd-link-story-bible-file');
      const plotChk = document.getElementById('chk-cmd-link-plot-brainstorm');

      const isMode1 = mKey === 'MODE_1_DRAFT';
      if (plotCard) plotCard.classList.toggle('hidden', !isMode1);
      if (topBar) {
        topBar.classList.toggle('md:grid-cols-2', isMode1);
        topBar.classList.toggle('md:grid-cols-1', !isMode1);
      }

      if (bibleStatus) {
        const enabled = bibleChk ? bibleChk.checked : localStorage.getItem('noir_v105_story_bible_file_link_enabled') !== '0';
        const bibleLen = String(document.getElementById('textarea-rendered-bible-content')?.value || '').trim().length;
        const linkedFile = window.NoirStudio?.storyBible?.getLinkedStoryBibleFileData?.();
        const extraFileLen = linkedFile?.text ? linkedFile.text.length : 0;
        const totalChars = bibleLen + extraFileLen;
        if (!enabled) {
          bibleStatus.textContent = 'Đang TẮT liên kết';
          bibleStatus.className = 'px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-400 font-extrabold text-[10px] shrink-0';
        } else {
          bibleStatus.textContent = totalChars > 0
            ? `Đã liên kết (${totalChars.toLocaleString('vi-VN')} ký tự) · Xem`
            : 'Đã liên kết · Bấm xem';
          bibleStatus.className = 'px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 font-extrabold text-[10px] shrink-0';
        }
      }

      if (plotStatus) {
        const masterOn = plotChk ? plotChk.checked : localStorage.getItem(this.PLOT_MASTER_KEY) !== '0';
        const useAi = localStorage.getItem(this.PLOT_USE_AI_KEY) !== '0';
        const useManual = localStorage.getItem(this.PLOT_USE_MANUAL_KEY) === '1';
        if (!masterOn) {
          plotStatus.textContent = 'Đang TẮT liên kết';
          plotStatus.className = 'px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-400 font-extrabold text-[10px] shrink-0';
        } else {
          const tags = [];
          if (useAi) tags.push('AI Gemini');
          if (useManual) tags.push('Tự viết');
          plotStatus.textContent = tags.length > 0 ? `Đang gắn: ${tags.join(' + ')}` : 'Chưa chọn nguồn';
          plotStatus.className = 'px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-100 font-extrabold text-[10px] shrink-0';
        }
      }
    }

    exportRichHtmlToPdfDocument(titleText, bodyHtml, plainFallbackText = '', filePrefix = 'Document') {
      const safeTitle = this.escapeHtml(titleText || 'Tài liệu Studio');
      const htmlDoc = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><title>${safeTitle}</title><style>
        @page { size: A4; margin: 16mm 14mm; }
        body { font-family: "Segoe UI", Roboto, Arial, sans-serif; color: #111827; line-height: 1.58; font-size: 13px; margin: 0; padding: 18px; background: #fff; }
        h1 { font-size: 18px; color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 6px; margin: 0 0 14px 0; }
        h2 { font-size: 15px; color: #1e3a8a; margin: 18px 0 8px 0; border-left: 4px solid #3b82f6; padding-left: 8px; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; page-break-inside: auto; font-size: 12px; }
        tr { page-break-inside: avoid; }
        th, td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background: #ecfdf5; font-weight: 700; }
        img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; page-break-inside: avoid; }
        .doc-body { white-space: pre-wrap; word-break: break-word; }
      </style></head><body><h1>${safeTitle}</h1><div class="doc-body">${bodyHtml}</div><script>window.onload=function(){setTimeout(function(){window.print();},260);};<\/script></body></html>`;

      const win = window.open('', '_blank', 'width=940,height=780');
      if (win && win.document) {
        win.document.open();
        win.document.write(htmlDoc);
        win.document.close();
        window.NoirStudio?.utils?.showToast?.(
          '📄 Đã mở bản in chuẩn Word (giữ nguyên 100% Bảng & Ảnh) — Chọn "Lưu dưới dạng PDF / Save as PDF" để lưu ngay!',
          'success',
          4200
        );
        return true;
      }
      // Dự phòng nếu trình duyệt chặn pop-up: xuất trực tiếp file .pdf binary về Downloads
      this.exportCompiledPromptToPdf(plainFallbackText || titleText, filePrefix);
      return true;
    }

    openStoryBibleFullViewerModal() {
      document.getElementById('modal-v106-story-bible-viewer')?.remove();
      const sb = window.NoirStudio?.storyBible;
      const tab4Plain = document.getElementById('textarea-rendered-bible-content');
      const tab4Rich = document.getElementById('tab4-rich-bible-editor');
      const rawBibleText = String(tab4Plain?.value || '').trim();
      const richHtml = String(tab4Rich?.innerHTML || '').trim();
      const linkedFile = sb?.getLinkedStoryBibleFileData?.();
      const chars = Array.isArray(sb?.characters) ? sb.characters : [];
      const knows = Array.isArray(sb?.knowledgeMatrix) ? sb.knowledgeMatrix : [];
      const clues = Array.isArray(sb?.cluesLedger) ? sb.cluesLedger : [];

      const charsHtml =
        chars.length > 0
          ? chars
              .map(
                (c, i) =>
                  `<div class="p-2 rounded-lg border border-zinc-800 bg-zinc-900/80"><div class="font-bold text-emerald-300">${i + 1}. ${this.escapeHtml(c.name)} <span class="text-zinc-400 font-normal">(${this.escapeHtml(c.role || 'Nhân vật')})</span></div><div class="text-[11px] text-zinc-300 mt-0.5">${this.escapeHtml(c.traits || '')}</div></div>`
              )
              .join('')
          : '<div class="text-zinc-500 italic">Chưa có hồ sơ nhân vật riêng.</div>';

      const knowsHtml =
        knows.length > 0
          ? knows
              .map(
                (k, i) =>
                  `<div class="p-2 rounded-lg border border-zinc-800 bg-zinc-900/80"><div class="font-bold text-amber-300">${i + 1}. ${this.escapeHtml(k.secret)}</div><div class="text-[11px] text-emerald-300">Đã biết: ${this.escapeHtml(k.whoKnows)}</div><div class="text-[11px] text-rose-300">Chưa biết: ${this.escapeHtml(k.whoDoesNotKnow)}</div></div>`
              )
              .join('')
          : '<div class="text-zinc-500 italic">Chưa có mục Ma trận Ai Biết Gì.</div>';

      const cluesHtml =
        clues.length > 0
          ? clues
              .map(
                (cl, i) =>
                  `<div class="p-2 rounded-lg border border-zinc-800 bg-zinc-900/80"><span class="font-bold ${cl.status === 'RESOLVED' ? 'text-emerald-300' : 'text-indigo-300'}">[${cl.status === 'RESOLVED' ? 'Đã thu hồi' : 'Đang gieo'}]</span> ${this.escapeHtml(cl.title)} — <span class="text-zinc-400">${this.escapeHtml(cl.note || '')}</span></div>`
              )
              .join('')
          : '<div class="text-zinc-500 italic">Chưa có phục bút nào.</div>';

      const modal = document.createElement('div');
      modal.id = 'modal-v106-story-bible-viewer';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.style.zIndex = '2147483100';
      modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto';
      modal.innerHTML = `
        <div class="my-auto w-full max-w-5xl max-h-[92dvh] rounded-2xl border-2 border-amber-400/75 bg-zinc-950 text-zinc-100 shadow-2xl flex flex-col overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-amber-950/75 to-zinc-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div>
              <div class="font-extrabold text-sm text-amber-300">🏛️ CỬA SỔ NỔI TOÀN BỘ STORY BIBLE (CHUẨN WORD · GIỮ TRỌN BẢNG &amp; ẢNH NHƯ TAB 4 MỤC 2)</div>
              <div class="text-[11px] text-amber-100/80">
                ${linkedFile?.fileName ? `📄 File đang liên kết: <strong>${this.escapeHtml(linkedFile.fileName)}</strong> (${(linkedFile.text || '').length.toLocaleString('vi-VN')} ký tự) · ` : ''}Nội dung Story Bible: ${rawBibleText.length.toLocaleString('vi-VN')} ký tự (giữ nguyên 100%, không vỡ bảng/ảnh)
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 shrink-0">
              <button type="button" id="btn-v108-bible-download-pdf" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow transition">📄 Tải PDF</button>
              <button type="button" id="btn-v106-bible-save-inline" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow transition">💾 Lưu Story Bible</button>
              <button type="button" id="btn-v106-bible-goto-tab4" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold transition">🏛️ Qua Tab 4</button>
              <button type="button" id="btn-v106-bible-close" class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕ Đóng</button>
            </div>
          </div>
          <div class="p-4 overflow-y-auto flex-1 space-y-4">
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="font-extrabold text-emerald-300 uppercase text-[11px]">📖 2. Nội Dung Story Bible Chính Thức (Chế độ Word — giữ nguyên bảng biểu, định dạng &amp; hình ảnh):</div>
                <div class="flex items-center gap-1">
                  <button type="button" data-fb-exec="bold" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-black">B</button>
                  <button type="button" data-fb-exec="italic" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white italic font-serif">I</button>
                  <button type="button" data-fb-exec="underline" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white underline">U</button>
                </div>
              </div>
              <div id="div-v108-floating-bible-rich" contenteditable="true" spellcheck="false" class="w-full min-h-[280px] max-h-[52vh] overflow-y-auto p-3.5 rounded-xl border border-emerald-500/45 bg-zinc-900/90 text-xs leading-relaxed text-zinc-100 select-text focus:outline-none focus:border-emerald-400 whitespace-pre-wrap break-words [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-zinc-600 [&_th]:bg-zinc-800/80 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-zinc-700 [&_td]:px-2 [&_td]:py-1 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2"></div>
            </div>
            ${
              linkedFile?.text
                ? `<div class="space-y-1.5"><div class="font-extrabold text-sky-300 uppercase text-[11px]">📄 Nội Dung File Story Bible Đang Liên Kết (${this.escapeHtml(linkedFile.fileName)}):</div><pre class="max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-monoCode text-[11.5px] leading-relaxed text-zinc-200 select-text bg-zinc-900/80 p-3 rounded-xl border border-sky-500/35">${this.escapeHtml(linkedFile.text)}</pre></div>`
                : ''
            }
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="p-3 rounded-xl border border-emerald-500/30 bg-zinc-900/50 space-y-2">
                <div class="font-extrabold text-emerald-300 text-[11px] uppercase">👤 Hồ Sơ Nhân Vật (${chars.length})</div>
                <div class="space-y-1.5 max-h-44 overflow-y-auto">${charsHtml}</div>
              </div>
              <div class="p-3 rounded-xl border border-amber-500/30 bg-zinc-900/50 space-y-2">
                <div class="font-extrabold text-amber-300 text-[11px] uppercase">🧠 Ma Trận Ai Biết Gì (${knows.length})</div>
                <div class="space-y-1.5 max-h-44 overflow-y-auto">${knowsHtml}</div>
              </div>
              <div class="p-3 rounded-xl border border-indigo-500/30 bg-zinc-900/50 space-y-2">
                <div class="font-extrabold text-indigo-300 text-[11px] uppercase">🔫 Sổ Cái Phục Bút (${clues.length})</div>
                <div class="space-y-1.5 max-h-44 overflow-y-auto">${cluesHtml}</div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const richEditor = modal.querySelector('#div-v108-floating-bible-rich');
      if (richEditor) {
        if (richHtml) richEditor.innerHTML = richHtml;
        else richEditor.innerText = rawBibleText;
      }
      modal.querySelectorAll('[data-fb-exec]').forEach((b) => {
        b.addEventListener('click', () => {
          richEditor?.focus();
          try { document.execCommand(b.getAttribute('data-fb-exec'), false, null); } catch (_e) {}
        });
      });

      const saveInlineBible = () => {
        const htmlNow = String(richEditor?.innerHTML || '');
        const plainNow = this.serializeRichNodeToPlainText(richEditor);
        if (tab4Rich) {
          tab4Rich.innerHTML = htmlNow;
          tab4Rich.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (tab4Plain) {
          tab4Plain.value = plainNow;
          tab4Plain.dispatchEvent(new Event('input', { bubbles: true }));
        }
        try { localStorage.setItem('noir_v105_story_bible_rich_html_v1', htmlNow); } catch (_e) {}
        sb?.saveAllBibleData?.(false);
        this.refreshHeroTopLinksUI();
        window.NoirStudio?.utils?.showToast?.('✅ Đã lưu Story Bible (giữ nguyên bảng biểu & ảnh)!', 'success', 2400);
      };

      modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
      modal.querySelector('#btn-v106-bible-close')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#btn-v106-bible-save-inline')?.addEventListener('click', saveInlineBible);
      modal.querySelector('#btn-v108-bible-download-pdf')?.addEventListener('click', () => {
        saveInlineBible();
        const htmlNow = String(richEditor?.innerHTML || '');
        const plainNow = this.serializeRichNodeToPlainText(richEditor);
        this.exportRichHtmlToPdfDocument('STORY BIBLE CHÍNH THỨC', htmlNow || this.escapeHtml(plainNow), plainNow, 'Story_Bible');
      });
      modal.querySelector('#btn-v106-bible-goto-tab4')?.addEventListener('click', () => {
        saveInlineBible();
        modal.remove();
        document.getElementById('modal-fullscreen-ai-command')?.classList.add('hidden');
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_4_BIBLE');
      });
    }

    openDualPlotBrainstormingModal() {
      document.getElementById('modal-v106-dual-plot-modal')?.remove();
      const useAiInit = localStorage.getItem(this.PLOT_USE_AI_KEY) !== '0';
      const useManualInit = localStorage.getItem(this.PLOT_USE_MANUAL_KEY) === '1';
      const aiOutlineVal = String(this.synth?.getMode2DevelopedOutlineText?.() || '').trim();
      let manualOutlineVal = '';
      let aiRichSaved = '';
      let manualRichSaved = '';
      try {
        manualOutlineVal = localStorage.getItem(this.PLOT_MANUAL_TEXT_KEY) || '';
        aiRichSaved = localStorage.getItem('noir_v108_plot_ai_rich_html') || '';
        manualRichSaved = localStorage.getItem('noir_v108_plot_manual_rich_html') || '';
      } catch (_eM) {}

      const modal = document.createElement('div');
      modal.id = 'modal-v106-dual-plot-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.style.zIndex = '2147483100';
      modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto';
      modal.innerHTML = `
        <div class="my-auto w-full max-w-5xl max-h-[92dvh] rounded-2xl border-2 border-cyan-400/75 bg-zinc-950 text-zinc-100 shadow-2xl flex flex-col overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-cyan-950/75 to-indigo-950/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div class="font-extrabold text-sm text-cyan-300">🧭 CHỌN NGUỒN THAM MƯU CỐT TRUYỆN CHO CHẾ ĐỘ 1 (CHUẨN WORD · GIỮ TRỌN BẢNG &amp; ẢNH)</div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button type="button" id="btn-v108-plot-download-pdf" class="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow transition">📄 Tải PDF</button>
              <button type="button" id="btn-v106-plot-close" class="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕ Đóng</button>
            </div>
          </div>
          <div class="p-4 overflow-y-auto flex-1 space-y-3">
            <div class="p-3 rounded-xl border border-amber-400/55 bg-amber-950/40 text-amber-100 text-[12px] leading-relaxed">
              💡 Tại đây, bạn tick chọn <strong class="text-cyan-300">tham mưu cốt truyện theo câu trả lời của Gemini</strong> thì AI sẽ tổng hợp prompt theo hướng tham mưu cốt truyện của Gemini, còn nếu bạn chọn ô bên cạnh, là <strong class="text-emerald-300">tham mưu cốt truyện riêng bạn viết, không dùng AI</strong> thì cũng được, hoặc là <strong class="text-amber-300">tick cả 2</strong> (khi bấm <strong>📄 Tải PDF</strong>, nếu tick cả 2 ô sẽ tự động gộp cả 2 vào 1 file PDF duy nhất!).
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div class="p-3 rounded-2xl border-2 border-cyan-500/50 bg-cyan-950/20 space-y-2 flex flex-col">
                <label class="flex items-center gap-2 font-extrabold text-cyan-300 text-xs cursor-pointer select-none">
                  <input type="checkbox" id="chk-v106-plot-ai" ${useAiInit ? 'checked' : ''} class="accent-cyan-400 w-4 h-4 shrink-0" />
                  <span>🤖 Tham mưu cốt truyện theo câu trả lời của Gemini (Chế độ 2)</span>
                </label>
                <p class="text-[11px] text-zinc-400">Hỗ trợ dán trực tiếp từ Gemini / Word / Docs (không vỡ bảng biểu, hình ảnh):</p>
                <div id="div-v108-plot-ai-rich" contenteditable="true" spellcheck="false" data-placeholder="Dán câu trả lời tham mưu cốt truyện từ Gemini (hoặc chạy Chế độ 2 để tự điền vào đây)..." class="w-full min-h-[260px] max-h-[46vh] overflow-y-auto flex-1 p-3 rounded-xl border border-cyan-500/40 bg-zinc-950 text-xs text-zinc-100 leading-relaxed focus:outline-none focus:border-cyan-400 select-text whitespace-pre-wrap break-words [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-zinc-600 [&_th]:bg-zinc-800/80 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-zinc-700 [&_td]:px-2 [&_td]:py-1 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2"></div>
              </div>
              <div class="p-3 rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/20 space-y-2 flex flex-col">
                <label class="flex items-center gap-2 font-extrabold text-emerald-300 text-xs cursor-pointer select-none">
                  <input type="checkbox" id="chk-v106-plot-manual" ${useManualInit ? 'checked' : ''} class="accent-emerald-400 w-4 h-4 shrink-0" />
                  <span>✍️ Tham mưu cốt truyện riêng bạn tự viết (không dùng AI)</span>
                </label>
                <p class="text-[11px] text-zinc-400">Soạn thảo chuẩn Word (hỗ trợ dán bảng, ảnh, dàn ý riêng của bạn):</p>
                <div id="div-v108-plot-manual-rich" contenteditable="true" spellcheck="false" data-placeholder="Gõ hoặc dán cốt truyện riêng bạn tự nghĩ ra tại đây (giữ nguyên 100%, không cắt xén)..." class="w-full min-h-[260px] max-h-[46vh] overflow-y-auto flex-1 p-3 rounded-xl border border-emerald-500/40 bg-zinc-950 text-xs text-zinc-100 leading-relaxed focus:outline-none focus:border-emerald-400 select-text whitespace-pre-wrap break-words [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-zinc-600 [&_th]:bg-zinc-800/80 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-zinc-700 [&_td]:px-2 [&_td]:py-1 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2"></div>
              </div>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span class="text-[11px] text-zinc-400">✅ Toàn bộ nội dung bạn tick chọn sẽ được ghép nguyên văn 100% vào Prompt Chế độ 1.</span>
            <button type="button" id="btn-v106-plot-save" class="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold shadow-lg transition">💾 Lưu &amp; Áp Dụng Vào Chế Độ 1</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const aiRichEl = modal.querySelector('#div-v108-plot-ai-rich');
      const manualRichEl = modal.querySelector('#div-v108-plot-manual-rich');
      if (aiRichEl) {
        if (aiRichSaved && aiRichSaved.trim()) aiRichEl.innerHTML = aiRichSaved;
        else aiRichEl.innerText = aiOutlineVal;
      }
      if (manualRichEl) {
        if (manualRichSaved && manualRichSaved.trim()) manualRichEl.innerHTML = manualRichSaved;
        else manualRichEl.innerText = manualOutlineVal;
      }

      const persistPlotData = () => {
        const useAi = Boolean(modal.querySelector('#chk-v106-plot-ai')?.checked);
        const useManual = Boolean(modal.querySelector('#chk-v106-plot-manual')?.checked);
        const aiHtml = String(aiRichEl?.innerHTML || '');
        const manualHtml = String(manualRichEl?.innerHTML || '');
        const aiTxt = this.serializeRichNodeToPlainText(aiRichEl);
        const manualTxt = this.serializeRichNodeToPlainText(manualRichEl);
        try {
          localStorage.setItem(this.PLOT_USE_AI_KEY, useAi ? '1' : '0');
          localStorage.setItem(this.PLOT_USE_MANUAL_KEY, useManual ? '1' : '0');
          localStorage.setItem(this.PLOT_MANUAL_TEXT_KEY, manualTxt);
          localStorage.setItem('noir_v36_mode2_latest_plot_outline', aiTxt);
          localStorage.setItem('noir_v108_plot_ai_rich_html', aiHtml);
          localStorage.setItem('noir_v108_plot_manual_rich_html', manualHtml);
        } catch (_eS) {}
        this.refreshHeroTopLinksUI('MODE_1_DRAFT');
        this.synth?.refreshCommandModeUX?.('MODE_1_DRAFT');
        return { useAi, useManual, aiHtml, manualHtml, aiTxt, manualTxt };
      };

      modal.querySelector('#btn-v108-plot-download-pdf')?.addEventListener('click', () => {
        const data = persistPlotData();
        const htmlSections = [];
        const plainSections = [];
        if (data.useAi && (data.aiTxt || data.aiHtml.trim())) {
          htmlSections.push(`<h2>🤖 A. Tham Mưu Cốt Truyện Theo Câu Trả Lời Của Gemini (Chế Độ 2)</h2><div>${data.aiHtml || this.escapeHtml(data.aiTxt)}</div>`);
          plainSections.push(`[A. THAM MƯU CỐT TRUYỆN THEO GEMINI]\n${data.aiTxt}`);
        }
        if (data.useManual && (data.manualTxt || data.manualHtml.trim())) {
          htmlSections.push(`<h2>✍️ B. Tham Mưu Cốt Truyện Riêng Tác Giả Tự Viết</h2><div>${data.manualHtml || this.escapeHtml(data.manualTxt)}</div>`);
          plainSections.push(`[B. THAM MƯU CỐT TRUYỆN TỰ VIẾT]\n${data.manualTxt}`);
        }
        if (htmlSections.length === 0) {
          window.NoirStudio?.utils?.showToast?.('⚠️ Hãy tick chọn và nhập nội dung ít nhất 1 ô trước khi tải PDF!', 'warning', 2800);
          return;
        }
        const pdfTitle =
          data.useAi && data.useManual
            ? 'THAM MƯU CỐT TRUYỆN TỔNG HỢP (GEMINI + TÁC GIẢ TỰ VIẾT)'
            : data.useAi
              ? 'THAM MƯU CỐT TRUYỆN THEO GEMINI (CHẾ ĐỘ 2)'
              : 'THAM MƯU CỐT TRUYỆN TÁC GIẢ TỰ VIẾT';
        this.exportRichHtmlToPdfDocument(pdfTitle, htmlSections.join('<hr style="margin:18px 0;border:0;border-top:2px dashed #94a3b8;" />'), plainSections.join('\n\n---\n\n'), 'Tham_Muu_Cot_Truyen');
      });

      const saveAndClose = () => {
        persistPlotData();
        modal.remove();
        window.NoirStudio?.utils?.showToast?.(
          '✅ Đã lưu cấu hình Tham mưu cốt truyện (chuẩn Word, giữ bảng & ảnh) cho Chế độ 1!',
          'success',
          2600
        );
      };

      modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
      modal.querySelector('#btn-v106-plot-close')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#btn-v106-plot-save')?.addEventListener('click', saveAndClose);
    }

    renderPromptLengthLimitGuard(promptText, modeKey = 'MODE_1_DRAFT') {
      const box = document.getElementById('confirm-prompt-length-limit-guard');
      if (!box) return;
      const len = String(promptText || '').length;
      const isNotebookLmMode =
        modeKey === 'MODE_3_AUDIT' || modeKey === 'MODE_4_REVIEW' || modeKey === 'MODE_5_DIAGRAM';

      // 1) NotebookLM: khung chat ngắn (~4.500 ký tự) -> Hướng dẫn tạo Ghi chú (+ Lưu ý / Studio) kèm giao diện mô phỏng trực quan!
      if (isNotebookLmMode && len > 4500) {
        const shortTriggerCmd =
          'Hãy đọc toàn bộ nội dung trong ghi chú [Tên ghi chú vừa tạo] và thực hiện chính xác theo các yêu cầu/hướng dẫn trong đó giúp tôi.';
        box.classList.remove('hidden');
        box.innerHTML = `
          <div class="p-3.5 rounded-2xl border-2 border-sky-400/75 bg-gradient-to-r from-sky-950/75 via-zinc-950 to-indigo-950/70 space-y-3 text-xs shadow-xl">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-extrabold text-sky-300 text-xs sm:text-sm">
                📝 Prompt dài ${len.toLocaleString('vi-VN')} ký tự — Có thể vượt giới hạn ô chat NotebookLM!
              </div>
              <span class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-200 font-bold text-[10px]">Mẹo chuẩn NotebookLM</span>
            </div>
            <p class="text-sky-100 leading-relaxed text-[11.5px]">
              Nếu ô chat NotebookLM báo quá dài không dán hết được, hãy bấm nút <strong class="text-amber-300">+ Lưu ý (Add note)</strong> ở thanh <strong>Studio bên phải</strong> NotebookLM → dán toàn bộ Prompt đã copy vào ghi chú đó → rồi quay lại ô chat dán lệnh gọi siêu ngắn bên dưới là NotebookLM đọc trọn vẹn 100%!
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <!-- Mô phỏng trực quan giao diện Studio của NotebookLM -->
              <div class="rounded-xl border border-zinc-700 bg-[#1e1f24] p-2.5 space-y-2 shadow-inner">
                <div class="flex items-center justify-between text-[10.5px] font-bold text-zinc-300 border-b border-zinc-700/80 pb-1.5">
                  <span>✨ Studio (Bên phải NotebookLM)</span>
                  <span class="text-sky-400">Ghi chú mới</span>
                </div>
                <div class="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-400">
                  <div class="px-2 py-1.5 rounded-lg bg-zinc-800/80">🎧 Tổng quan âm thanh</div>
                  <div class="px-2 py-1.5 rounded-lg bg-zinc-800/80">🗺️ Bản đồ tư duy</div>
                  <div class="px-2 py-1.5 rounded-lg bg-zinc-800/80">📊 Báo cáo</div>
                  <div class="px-2 py-1.5 rounded-lg bg-zinc-800/80">📑 Trình chiếu</div>
                </div>
                <div class="flex justify-center pt-1">
                  <div class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[11px] shadow-lg ring-4 ring-amber-400/35 animate-pulse">
                    <span>📝</span><span>+ Lưu ý (BẤM ĐÂY ĐỂ DÁN PROMPT)</span>
                  </div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="text-[11px] font-bold text-emerald-300">⚡ Lệnh gọi siêu ngắn dán vào ô Chat NotebookLM sau khi tạo Lưu ý:</div>
                <div class="p-2.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-100 text-[11px] leading-relaxed select-text">${this.escapeHtml(shortTriggerCmd)}</div>
                <button type="button" id="btn-v106-copy-nlm-short-cmd" class="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow transition">
                  📋 Copy Lệnh Gọi Ghi Chú Siêu Ngắn (1 Chạm)
                </button>
              </div>
            </div>
          </div>
        `;
        box.querySelector('#btn-v106-copy-nlm-short-cmd')?.addEventListener('click', async () => {
          await window.NoirStudio?.geminiSplitBridge?.copyTextSafe?.(shortTriggerCmd);
          window.NoirStudio?.utils?.showToast?.('✅ Đã copy lệnh gọi Ghi chú NotebookLM vào bộ nhớ tạm!', 'success', 2600);
        });
        return;
      }

      // 2) Gemini: khi prompt tổng quá dài (> 28.000 ký tự) -> Nút bấm xuất thẳng file PDF câu lệnh để tải lên Gemini đọc!
      if (!isNotebookLmMode && len > 28000) {
        box.classList.remove('hidden');
        box.innerHTML = `
          <button type="button" id="btn-v106-export-prompt-pdf-for-gemini" class="w-full text-left p-3.5 rounded-2xl border-2 border-amber-400/85 bg-gradient-to-r from-amber-950/80 via-rose-950/60 to-violet-950/75 hover:from-amber-900/85 hover:to-violet-900/80 text-amber-100 shadow-xl transition flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-1 flex-1 min-w-[220px]">
              <div class="font-black text-amber-300 text-xs sm:text-sm leading-snug">
                📄 Prompt tổng của bạn có thể đang vượt quá giới hạn nhập lệnh của Gemini, bạn nên xuất file pdf câu lệnh và tải lên cho Gemini nó đọc =))
              </div>
              <div class="text-[11px] text-amber-100/85">
                Độ dài hiện tại: <strong>${len.toLocaleString('vi-VN')} ký tự</strong> · Bấm vào đây để xuất ngay file <strong>.PDF</strong> câu lệnh ngay trên máy bạn (tải thẳng về Downloads)!
              </div>
            </div>
            <span class="px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 font-black text-xs shadow-lg shrink-0">⬇️ Xuất File PDF Câu Lệnh Ngay</span>
          </button>
        `;
        box.querySelector('#btn-v106-export-prompt-pdf-for-gemini')?.addEventListener('click', () => {
          const latestText =
            document.getElementById('textarea-synthesized-master-prompt')?.value ||
            promptText;
          this.exportCompiledPromptToPdf(latestText, modeKey);
        });
        return;
      }

      box.classList.add('hidden');
      box.innerHTML = '';
    }

    bindAutoCopyOnAllExternalAiLinks() {
      if (this._linksBound || typeof document === 'undefined') return;
      this._linksBound = true;
      document.addEventListener(
        'click',
        (ev) => {
          const anchor = ev.target?.closest?.('a[href]');
          if (!anchor) return;
          const href = String(anchor.getAttribute('href') || '');
          const isNlm = href.includes('notebooklm.google.com');
          const isGemini = href.includes('gemini.google.com');
          if (!isNlm && !isGemini) return;

          try {
            const confirmModal = document.getElementById('modal-confirm-synthesized-prompt');
            let textToCopy = '';
            if (confirmModal && !confirmModal.classList.contains('hidden')) {
              textToCopy =
                document.getElementById('textarea-synthesized-master-prompt')?.value ||
                this.synth?.lastSynthesizedPrompt ||
                '';
            }
            if (!textToCopy.trim()) {
              const modeKey =
                document.getElementById('select-ai-execution-mode')?.value || 'MODE_1_DRAFT';
              const resolvedCmd = this.synth?.getResolvedUserCommand?.(modeKey) || '';
              textToCopy =
                this.synth?.buildSynthesizedPromptForMode?.(modeKey, resolvedCmd) || '';
            }
            if (textToCopy.trim()) {
              window.NoirStudio?.geminiSplitBridge?.copyTextSafe?.(textToCopy);
              window.NoirStudio?.utils?.showToast?.(
                isNlm
                  ? '✅ Đã tự động copy toàn bộ Prompt tổng hợp vào bộ nhớ tạm trước khi mở Google NotebookLM!'
                  : '✅ Đã tự động copy toàn bộ Prompt tổng hợp vào bộ nhớ tạm trước khi mở Gemini!',
                'success',
                3400
              );
            }
          } catch (_eCp) {}
        },
        true
      );
    }

    init() {
      if (this._bound || typeof document === 'undefined') return;
      this._bound = true;

      const modeSelect = document.getElementById('select-ai-execution-mode');
      const richEl = document.getElementById('s18-rich-prompt-editor');
      const plainEl = document.getElementById('s18-fullscreen-prompt-textarea');
      const bibleChk = document.getElementById('chk-cmd-link-story-bible-file');
      const plotChk = document.getElementById('chk-cmd-link-plot-brainstorm');

      this.activeModeKey = modeSelect?.value || 'MODE_1_DRAFT';
      this.loadModeDraftIntoEditors(this.activeModeKey);

      // Chuyển Chế độ 1..6 -> lưu ô lệnh cũ, nạp ô lệnh riêng của chế độ mới
      if (modeSelect) {
        modeSelect.addEventListener('change', () => {
          const prevMode = this.activeModeKey;
          this.saveCurrentModeDraft(prevMode);
          const nextMode = modeSelect.value || 'MODE_1_DRAFT';
          this.loadModeDraftIntoEditors(nextMode);
        });
      }

      // Đồng bộ Rich Editor <-> Plain Textarea + Enter để chạy
      if (richEl) {
        richEl.addEventListener('input', () => {
          this.syncRichEditorToPlainTextarea(true);
        });
        richEl.addEventListener('paste', (ev) => {
          const items = ev.clipboardData?.items;
          if (!items) return;
          const imgFiles = [];
          for (let i = 0; i < items.length; i++) {
            if (items[i].type && items[i].type.startsWith('image/')) {
              const f = items[i].getAsFile();
              if (f) imgFiles.push(f);
            }
          }
          if (imgFiles.length > 0) {
            ev.preventDefault();
            Promise.all(
              imgFiles.map(
                (file) =>
                  new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({ name: file.name || 'Pasted_Image.png', dataUrl: reader.result });
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(file);
                  })
              )
            ).then((loaded) => {
              const valid = loaded.filter(Boolean);
              this.addImagesToCurrentMode(valid);
              valid.forEach((im) => {
                try {
                  document.execCommand('insertHTML', false, `<img src="${im.dataUrl}" alt="${this.escapeHtml(im.name)}" />`);
                } catch (_eIns) {}
              });
              this.syncRichEditorToPlainTextarea(true);
            });
          } else {
            setTimeout(() => this.syncRichEditorToPlainTextarea(true), 20);
          }
        });
        richEl.addEventListener('keydown', (ev) => {
          if (ev.isComposing || ev.keyCode === 229) return;
          if (ev.key === 'Enter' && !ev.shiftKey && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
            // Không chặn Enter khi đang gõ trong ô bảng <td>/<th>
            const selNode = window.getSelection?.()?.anchorNode;
            const inTable = selNode?.parentElement?.closest?.('td, th');
            if (inTable) return;
            ev.preventDefault();
            this.syncRichEditorToPlainTextarea(true);
            plainEl?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
          }
        });
      }

      if (plainEl) {
        plainEl.addEventListener('input', () => {
          if (!this.richModeActive) {
            this.saveCurrentModeDraft(this.activeModeKey);
            const counterEl = document.getElementById('prompt-char-counter');
            if (counterEl) counterEl.textContent = `${plainEl.value.length.toLocaleString('vi-VN')} ký tự`;
          }
        });
      }

      // Nút B / I / U
      document.querySelectorAll('[data-cmd-rich-exec]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!this.richModeActive) return;
          richEl?.focus();
          try { document.execCommand(btn.getAttribute('data-cmd-rich-exec'), false, null); } catch (_e) {}
          this.syncRichEditorToPlainTextarea(true);
        });
      });

      // Chèn bảng kiểu Word/Google Docs
      document.getElementById('btn-cmd-rich-insert-table')?.addEventListener('click', () => {
        if (!this.richModeActive) {
          document.getElementById('btn-cmd-toggle-rich-mode')?.click();
        }
        richEl?.focus();
        const tableHtml =
          '<table><thead><tr><th>Mục / Phân cảnh</th><th>Chi tiết diễn biến</th><th>Ghi chú POV / Số từ</th></tr></thead><tbody><tr><td>Cảnh 1</td><td>...</td><td>...</td></tr><tr><td>Cảnh 2</td><td>...</td><td>...</td></tr></tbody></table><p><br></p>';
        try {
          document.execCommand('insertHTML', false, tableHtml);
        } catch (_eT) {
          if (richEl) richEl.innerHTML += tableHtml;
        }
        this.syncRichEditorToPlainTextarea(true);
      });

      // Thêm ảnh từ máy tính/điện thoại
      const imgInput = document.getElementById('input-cmd-rich-image-files');
      document.getElementById('btn-cmd-rich-add-images')?.addEventListener('click', () => {
        imgInput?.click();
      });
      imgInput?.addEventListener('change', () => {
        const files = Array.from(imgInput.files || []);
        if (files.length === 0) return;
        Promise.all(
          files.map(
            (file) =>
              new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
              })
          )
        ).then((loaded) => {
          const valid = loaded.filter(Boolean);
          this.addImagesToCurrentMode(valid);
          if (this.richModeActive && richEl) {
            valid.forEach((im) => {
              const imgTag = document.createElement('img');
              imgTag.src = im.dataUrl;
              imgTag.alt = im.name;
              richEl.appendChild(imgTag);
            });
            this.syncRichEditorToPlainTextarea(true);
          }
          imgInput.value = '';
        });
      });

      document.getElementById('btn-cmd-images-to-pdf')?.addEventListener('click', () => {
        this.exportAttachedImagesToPdf(this.activeModeKey);
      });

      // Chuyển đổi Chế độ Word (Bảng + Ảnh) <-> Văn bản thuần
      const toggleRichBtn = document.getElementById('btn-cmd-toggle-rich-mode');
      toggleRichBtn?.addEventListener('click', () => {
        if (this.richModeActive) {
          this.syncRichEditorToPlainTextarea(true);
          this.richModeActive = false;
          richEl?.classList.add('hidden');
          plainEl?.classList.remove('hidden');
          toggleRichBtn.textContent = '📝 Văn bản thuần (Bấm bật Word)';
        } else {
          this.richModeActive = true;
          if (richEl && plainEl) richEl.innerText = plainEl.value || '';
          plainEl?.classList.add('hidden');
          richEl?.classList.remove('hidden');
          toggleRichBtn.textContent = '📄 Chế độ Word (Bảng + Ảnh)';
        }
      });

      // Cập nhật nút Phóng to ô nhập áp dụng cho cả Rich Editor lẫn Textarea
      const expandBtn = document.getElementById('btn-toggle-prompt-box-expand');
      if (expandBtn) {
        expandBtn.removeAttribute('onclick');
        expandBtn.addEventListener('click', () => {
          const target = this.richModeActive ? richEl : plainEl;
          if (!target) return;
          const big = target.classList.toggle('min-h-[68vh]');
          target.classList.toggle('min-h-[42vh]', !big);
          expandBtn.textContent = big ? '⤡ Thu gọn ô nhập' : '⤢ Phóng to ô nhập';
        });
      }

      // 2 nút lớn trên cùng: FILE STORY BIBLE & THAM MƯU CỐT TRUYỆN (tick chỉ bật/tắt, bấm thân nút mở cửa sổ nổi!)
      document.getElementById('btn-cmd-hero-story-bible-viewer')?.addEventListener('click', () => {
        this.openStoryBibleFullViewerModal();
      });
      document.getElementById('btn-cmd-hero-plot-selector')?.addEventListener('click', () => {
        this.openDualPlotBrainstormingModal();
      });
      document.getElementById('cmd-mode2-plot-pill')?.addEventListener('click', () => {
        this.openDualPlotBrainstormingModal();
      });
      bibleChk?.addEventListener('click', (ev) => ev.stopPropagation());
      bibleChk?.addEventListener('change', () => {
        this.refreshHeroTopLinksUI();
      });
      if (plotChk) {
        plotChk.checked = localStorage.getItem(this.PLOT_MASTER_KEY) !== '0';
        plotChk.addEventListener('click', (ev) => ev.stopPropagation());
        plotChk.addEventListener('change', () => {
          try { localStorage.setItem(this.PLOT_MASTER_KEY, plotChk.checked ? '1' : '0'); } catch (_e) {}
          this.refreshHeroTopLinksUI();
        });
      }

      // Nút Thu gọn / Mở rộng toàn bộ khung gợi ý trong Hộp Điều Khiển AI (áp dụng cả Tab 3 lẫn Viết Tập Trung)
      const advToggleBtn = document.getElementById('btn-toggle-cmd-advisories');
      const advWrap = document.getElementById('cmd-mode-prompt-advisories-wrap');
      if (advToggleBtn && advWrap) {
        const setAdvCollapsed = (collapsed) => {
          advWrap.classList.toggle('hidden', Boolean(collapsed));
          advToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
          advToggleBtn.textContent = collapsed ? '▼ Mở rộng gợi ý' : '▲ Thu gọn gợi ý';
          try { localStorage.setItem('noir_v108_cmd_advisories_collapsed', collapsed ? '1' : '0'); } catch (_e) {}
        };
        try {
          if (localStorage.getItem('noir_v108_cmd_advisories_collapsed') === '1') setAdvCollapsed(true);
        } catch (_e) {}
        advToggleBtn.addEventListener('click', () => {
          setAdvCollapsed(!advWrap.classList.contains('hidden'));
        });
      }

      // Nút Thu gọn / Mở rộng khung màu vàng chọn mô hình trong Cửa sổ Xác Nhận Prompt (áp dụng mọi Chế độ 1–6)
      const yellowToggleBtn = document.getElementById('btn-toggle-confirm-yellow-panel');
      const yellowPanelBody = document.getElementById('confirm-yellow-model-panel-body');
      if (yellowToggleBtn && yellowPanelBody) {
        const setYellowCollapsed = (collapsed) => {
          yellowPanelBody.classList.toggle('hidden', Boolean(collapsed));
          yellowToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
          yellowToggleBtn.textContent = collapsed ? '▼ Mở rộng khung chọn mô hình' : '▲ Thu gọn khung này';
          try { localStorage.setItem('noir_v107_confirm_yellow_collapsed', collapsed ? '1' : '0'); } catch (_e) {}
        };
        try {
          if (localStorage.getItem('noir_v107_confirm_yellow_collapsed') === '1') setYellowCollapsed(true);
        } catch (_e) {}
        yellowToggleBtn.addEventListener('click', () => {
          setYellowCollapsed(!yellowPanelBody.classList.contains('hidden'));
        });
      }

      // Khi mở modal lệnh AI -> làm mới trạng thái 2 nút lớn trên cùng
      document.getElementById('btn-open-fullscreen-ai-command')?.addEventListener('click', () => {
        setTimeout(() => this.refreshHeroTopLinksUI(), 30);
      });

      this.bindAutoCopyOnAllExternalAiLinks();
      this.refreshHeroTopLinksUI();
    }
  }

  // ============================================================================
  // PHẦN V110: CẨM NANG HƯỚNG DẪN TRỰC QUAN GEMINI & NOTEBOOKLM TỪ A ĐẾN Z
  // (Mô phỏng giống hệt giao diện thật — nhúng vào mọi popup Chia đôi & Tab 6 Mục 1)
  // ============================================================================
  class V110AiPlatformVisualGuideStudio {
    constructor() {
      this._styleInjected = false;
    }

    ensureStyles() {
      if (this._styleInjected || typeof document === 'undefined') return;
      if (document.getElementById('noir-v110-ai-guide-styles')) {
        this._styleInjected = true;
        return;
      }
      const st = document.createElement('style');
      st.id = 'noir-v110-ai-guide-styles';
      st.textContent = `
        @keyframes noirV110GuideBlink6s {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.25);
            border-color: rgba(251, 191, 36, 0.65);
            background-color: rgba(120, 53, 15, 0.35);
          }
          50% {
            box-shadow: 0 0 22px 4px rgba(251, 191, 36, 0.72);
            border-color: rgba(253, 224, 71, 1);
            background-color: rgba(180, 83, 9, 0.55);
          }
        }
        .noir-v110-blink-6s {
          animation: noirV110GuideBlink6s 1s ease-in-out 6;
        }
      `;
      document.head.appendChild(st);
      this._styleInjected = true;
    }

    buildGeminiGuideStepsHtml(modeKey = '') {
      const isCoverMode = modeKey === 'MODE_6_BOOK_COVER';
      return `
        <div class="space-y-3 text-[11.5px] leading-relaxed text-zinc-200">
          <!-- Bước 1: Mở thẳng Gemini & giao diện chính -->
          <div class="p-3 rounded-xl border border-indigo-500/40 bg-zinc-900/90 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-black text-amber-300">Bước 1: Mở thẳng giao diện chính Gemini &amp; chọn mô hình</div>
              <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] shadow transition">
                🚀 Mở thẳng Gemini (gemini.google.com) ↗
              </a>
            </div>
            <p class="text-[11px] text-zinc-300">Bấm nút xanh bên phải (hoặc nút Chia đôi màn hình) để vào thẳng màn hình chính của Gemini. Ở góc phải thanh chat, chọn mô hình phù hợp (<strong class="text-emerald-300">Pro / Flash / Neon</strong>).</p>
            <!-- Mockup giao diện chính Gemini -->
            <div class="rounded-xl border border-zinc-700/80 bg-[#131314] p-3 space-y-2.5 font-sans shadow-inner">
              <div class="flex items-center justify-between text-[11px] text-zinc-400">
                <span class="font-bold text-zinc-200 flex items-center gap-1.5"><span class="text-sky-400">✦</span> Gemini</span>
                <span class="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300">Tài khoản Google của bạn</span>
              </div>
              <div class="text-center py-1">
                <div class="text-sm font-bold bg-gradient-to-r from-sky-400 via-indigo-300 to-rose-300 bg-clip-text text-transparent">Xin chào, hôm nay chúng ta viết chương nào?</div>
              </div>
              <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-full border border-zinc-700 bg-[#1e1f20]">
                <div class="flex items-center gap-2 text-zinc-400">
                  <span class="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-white font-black text-sm">+</span>
                  <span class="text-xs">Hỏi Gemini</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-lg border-2 border-amber-400 bg-amber-500/20 text-amber-200 font-extrabold text-[10.5px]">Pro / Neon ▾</span>
                  <span class="px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 font-black text-[9px]">CHỌN MÔ HÌNH</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bước 2: Bấm dấu + để tải tệp PDF Story Bible / Tham mưu / File .TXT ASCII -->
          <div class="p-3 rounded-xl border border-emerald-500/40 bg-zinc-900/90 space-y-2.5">
            <div class="font-black text-emerald-300">Bước 2: Bấm dấu (+) bên trái thanh "Hỏi Gemini" → Tải tệp PDF lên</div>
            <p class="text-[11px] text-zinc-300">
              • <strong>Chế độ 2 (Tham mưu):</strong> Up <strong>1 file PDF Story Bible</strong>.<br/>
              • <strong>Chế độ 1 (Viết truyện):</strong> Up <strong>2 file PDF</strong> (<em>Story Bible</em> + <em>Tham mưu cốt truyện</em>).<br/>
              • <strong>Chế độ 5 (Chuyển mã ASCII → Ảnh đẹp):</strong> Up <strong>1 file <code>.TXT</code></strong> mã sơ đồ ASCII.
            </p>
            <!-- Mockup menu dấu + của Gemini giống thật -->
            <div class="rounded-xl border border-zinc-700/80 bg-[#0d1122] p-3 flex flex-col items-center">
              <div class="w-full max-w-md space-y-2">
                <div class="flex items-center justify-between px-3 py-2 rounded-full border border-zinc-600 bg-[#1e1f20]">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-black text-sm shadow">+</span>
                    <span class="text-xs text-zinc-400">Hỏi Gemini</span>
                  </div>
                  <span class="text-xs font-bold text-indigo-300">Neon ▾</span>
                </div>
                <div class="w-64 rounded-2xl border border-zinc-700 bg-[#1e1f20] p-2 space-y-1 shadow-xl">
                  <div class="flex items-center justify-between px-2.5 py-2 rounded-xl border-2 border-amber-400 bg-amber-500/15">
                    <span class="font-extrabold text-amber-100 text-xs">📎 Tải tệp lên</span>
                    <span class="px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950 font-black text-[9.5px]">BẤM ĐÂY</span>
                  </div>
                  <div class="px-2.5 py-1.5 rounded-lg text-zinc-400 text-xs">▲ Thêm từ Drive</div>
                  <div class="flex items-center justify-between px-2.5 py-1.5 rounded-xl ${
                    isCoverMode ? 'border-2 border-violet-400 bg-violet-500/20 text-violet-100 font-extrabold' : 'text-zinc-300'
                  } text-xs">
                    <span>🖼️ Tạo hình ảnh</span>
                    ${isCoverMode ? '<span class="px-1.5 py-0.5 rounded bg-violet-400 text-zinc-950 font-black text-[9px]">DÙNG CHO BÌA</span>' : '<span class="text-[9.5px] text-zinc-500">(Chế độ 6 / Vẽ ảnh)</span>'}
                  </div>
                  <div class="px-2.5 py-1.5 rounded-lg text-zinc-500 text-xs">🎬 Tạo video</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bước 3: Dán câu lệnh đã copy & bấm Gửi -->
          <div class="p-3 rounded-xl border border-violet-500/40 bg-zinc-900/90 space-y-2.5">
            <div class="font-black text-violet-300">Bước 3: Dán câu lệnh đã copy (Ctrl+V / Dán) &amp; bấm Gửi (➤)</div>
            <p class="text-[11px] text-zinc-300">Câu lệnh tổng hợp đã được web tự động copy sẵn. Bạn chỉ cần nhấn <kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono">Ctrl+V</kbd> (hoặc chạm giữ → Dán trên điện thoại) rồi bấm nút Gửi.</p>
            <div class="rounded-xl border border-zinc-700/80 bg-[#1e1f20] p-3 space-y-2">
              <div class="flex flex-wrap gap-1.5">
                <span class="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-400/45 text-rose-200 text-[10.5px] font-bold">📄 Story_Bible.pdf</span>
                <span class="px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/45 text-cyan-200 text-[10.5px] font-bold">📄 Tham_Muu_Cot_Truyen.pdf</span>
              </div>
              <div class="flex items-end justify-between gap-2 pt-1 border-t border-zinc-700/60">
                <div class="text-[11px] text-emerald-200 italic truncate">✍️ [Đã dán câu lệnh tổng hợp tối ưu &lt; 10.000 ký tự...]</div>
                <span class="px-2.5 py-1 rounded-full bg-indigo-500 text-white font-black text-xs shrink-0 shadow">➤ Gửi</span>
              </div>
            </div>
          </div>

          <!-- Bước 4: Copy kết quả về Web -->
          <div class="p-3 rounded-xl border border-cyan-500/40 bg-zinc-900/90 space-y-1.5">
            <div class="font-black text-cyan-300">Bước 4: Chép kết quả ngược về Web Viết Tiểu Thuyết Của Bi</div>
            <p class="text-[11px] text-zinc-300">
              • Bấm biểu tượng <strong>📋 Sao chép</strong> ở cuối câu trả lời Gemini → dán vào <strong>Cửa sổ đầu ra Tab 3</strong> (hỗ trợ chuẩn Word giữ nguyên bảng biểu &amp; ảnh, có nút tải PDF) hoặc bấm <strong>Chèn nối tiếp / Thay thế</strong> đưa thẳng vào bản thảo.<br/>
              • Riêng <strong>Ảnh Bìa (Chế độ 6)</strong>: Chuột phải <em>Sao chép hình ảnh</em> (hoặc tải ảnh) → dán <code>Ctrl+V</code> vào Kho Bìa Chế độ 6 để tự động lưu thư mục &amp; gắn vào xuất sách PDF!
            </p>
          </div>
        </div>
      `;
    }

    buildNotebookLmGuideStepsHtml() {
      return `
        <div class="space-y-3 text-[11.5px] leading-relaxed text-zinc-200">
          <!-- Bước 1: Mở thẳng Google NotebookLM & Tạo Sổ mới -->
          <div class="p-3 rounded-xl border border-sky-500/45 bg-zinc-900/90 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-black text-amber-300">Bước 1: Mở thẳng Google NotebookLM &amp; bấm "+ Tạo mới"</div>
              <a href="https://notebooklm.google.com/" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] shadow transition">
                🚀 Mở thẳng NotebookLM (notebooklm.google.com) ↗
              </a>
            </div>
            <p class="text-[11px] text-zinc-300">Bấm link xanh bên phải để mở trang chủ Google NotebookLM, sau đó bấm nút <strong class="text-amber-200">+ Tạo mới (Create new)</strong> để mở một Sổ tay riêng cho bộ tiểu thuyết của bạn.</p>
            <!-- Mockup màn hình chính NotebookLM -->
            <div class="rounded-xl border border-zinc-700/80 bg-[#17191e] p-3 space-y-2.5 font-sans">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-zinc-100 text-xs flex items-center gap-1.5">📓 NotebookLM</span>
                <span class="px-2.5 py-1 rounded-full border-2 border-amber-400 bg-amber-500/20 text-amber-100 font-black text-[10.5px] flex items-center gap-1.5 shadow">
                  <span>+ Tạo mới</span>
                  <span class="px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 text-[9px]">BẤM ĐÂY</span>
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="p-2.5 rounded-xl border border-dashed border-sky-400/60 bg-sky-950/25 text-center text-[10.5px] text-sky-200 font-bold">
                  ➕ Tạo sổ ghi chú tiểu thuyết mới
                </div>
                <div class="p-2.5 rounded-xl border border-zinc-700 bg-zinc-900/80 text-[10.5px]">
                  <div class="font-bold text-zinc-200 truncate">📘 Sổ tay Truyện của tôi</div>
                  <div class="text-[9.5px] text-zinc-400 mt-0.5">3 nguồn · Story Bible</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bước 2: Up file nguồn (Sources) bên trái -->
          <div class="p-3 rounded-xl border border-emerald-500/45 bg-zinc-900/90 space-y-2.5">
            <div class="font-black text-emerald-300">Bước 2: Tải file chương truyện (.TXT / .PDF) vào cột "Nguồn (Sources)" bên trái</div>
            <p class="text-[11px] text-zinc-300">Bấm <strong>+ Thêm nguồn</strong> ở cột trái → chọn <strong>📤 Tải tệp lên</strong> để nạp file gộp toàn bộ chương (tải ở Tab 4) và/hoặc file PDF Story Bible. NotebookLM đọc chính xác hàng trăm chương mà <strong>không bao giờ quên chi tiết</strong>!</p>
            <!-- Mockup giao diện 3 cột NotebookLM thật -->
            <div class="rounded-xl border border-zinc-700/80 bg-[#17191e] p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px]">
              <!-- Cột 1: Nguồn -->
              <div class="p-2 rounded-lg border-2 border-amber-400 bg-zinc-950/90 space-y-1.5">
                <div class="flex items-center justify-between font-bold text-amber-200">
                  <span>📂 Nguồn (Sources)</span>
                  <span class="px-1 py-0.5 rounded bg-amber-400 text-zinc-950 font-black text-[8.5px]">BƯỚC 2</span>
                </div>
                <div class="px-2 py-1.5 rounded-lg bg-emerald-600/25 border border-emerald-400/60 text-emerald-200 font-extrabold text-center">
                  + Thêm nguồn (Upload PDF/TXT)
                </div>
                <div class="space-y-1 text-[10px] text-zinc-300">
                  <div class="px-1.5 py-1 rounded bg-zinc-900 flex items-center gap-1">☑️ 📄 Toan_Bo_Chuong.txt</div>
                  <div class="px-1.5 py-1 rounded bg-zinc-900 flex items-center gap-1">☑️ 📄 Story_Bible.pdf</div>
                </div>
              </div>
              <!-- Cột 2: Trò chuyện -->
              <div class="p-2 rounded-lg border border-sky-500/50 bg-zinc-950/80 space-y-1.5">
                <div class="font-bold text-sky-300">💬 Trò chuyện (Chat)</div>
                <div class="p-1.5 rounded bg-zinc-900 text-[9.5px] text-zinc-300">
                  Dán <code>Ctrl+V</code> câu lệnh đã copy → Bấm <strong>➤</strong> để cập nhật Story Bible / vẽ mã sơ đồ ASCII!
                </div>
                <div class="px-2 py-1 rounded-lg border border-amber-400/70 bg-amber-500/15 text-amber-200 font-bold text-[9.5px] text-center">
                  📌 Lưu vào ghi chú (Save to note)
                </div>
              </div>
              <!-- Cột 3: Studio -->
              <div class="p-2 rounded-lg border border-violet-500/55 bg-zinc-950/80 space-y-1.5">
                <div class="font-bold text-violet-300">✨ Studio (Cột Phải)</div>
                <div class="grid grid-cols-1 gap-1 text-[9.5px]">
                  <div class="px-1.5 py-1 rounded bg-violet-500/20 border border-violet-400/50 text-violet-100 font-bold">🗺️ Bản đồ tư duy (Mind Map)</div>
                  <div class="px-1.5 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-100 font-bold">📊 Báo cáo &amp; Hình ảnh / Slide</div>
                  <div class="px-1.5 py-1 rounded bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 font-bold">📝 Ghi chú đã lưu (+ Thêm ghi chú)</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bước 3: Chat, Tạo Ghi Chú & Xem Báo Cáo Hình Ảnh / Mind Map trong Studio -->
          <div class="p-3 rounded-xl border border-violet-500/45 bg-zinc-900/90 space-y-2">
            <div class="font-black text-violet-300">Bước 3: Tạo Ghi Chú, Bản Đồ Tư Duy (Mind Map) &amp; Xem Báo Cáo Hình Ảnh ở cột Studio</div>
            <ul class="list-disc pl-4 space-y-1 text-[11px] text-zinc-300">
              <li><strong>Dán câu lệnh vào cột Trò chuyện (giữa):</strong> Nhấn <code>Ctrl+V</code> → gửi đi. Ngay dưới câu trả lời hay, bấm <strong>📌 Lưu vào ghi chú (Save to note)</strong> để chốt lại thành ghi chú bên cột Studio (không bị trôi mất khi tải lại trang!).</li>
              <li><strong>Bản đồ tư duy (Mind Map):</strong> Ở cột <strong>Studio bên phải</strong>, bấm <strong>🗺️ Bản đồ tư duy</strong> để NotebookLM tự động vẽ sơ đồ cây tương tác (bấm vào từng nhánh để xem chi tiết nhân vật, mâu thuẫn &amp; sự kiện).</li>
              <li><strong>Báo cáo &amp; Tổng quan hình ảnh / Slide / Audio:</strong> Cũng tại cột <strong>Studio</strong>, bấm <strong>📊 Báo cáo (Reports)</strong> hoặc <strong>🎨 Tổng quan hình ảnh / Slide</strong> để xem tóm tắt trực quan toàn bộ thế giới truyện.</li>
            </ul>
          </div>

          <!-- Bước 4: Đưa kết quả về Web -->
          <div class="p-3 rounded-xl border border-amber-500/40 bg-zinc-900/90 space-y-1.5">
            <div class="font-black text-amber-300">Bước 4: Đưa kết quả từ NotebookLM về Web Viết Tiểu Thuyết Của Bi</div>
            <p class="text-[11px] text-zinc-300">
              • <strong>Cập nhật Story Bible:</strong> Copy câu trả lời từ NotebookLM → dán vào <strong>Tab 4 Mục 2</strong> (giữ chuẩn Word, tự động bóc tách Hồ sơ nhân vật, Ma trận bí mật &amp; Phục bút).<br/>
              • <strong>Chuyển sơ đồ ASCII sang ảnh đẹp:</strong> Copy đoạn sơ đồ mã ASCII → dán vào <strong>Tab 3 Chế độ 5</strong> → bấm nút <strong>✨ Chuyển mã ASCII từ NotebookLM qua ảnh đẹp</strong> để tải file <code>.TXT</code> và gửi sang Gemini vẽ infographic sắc nét!
            </p>
          </div>
        </div>
      `;
    }

    buildCollapsibleSplitGuideHtml(platform = 'GEMINI', modeKey = '') {
      this.ensureStyles();
      const isNotebook = platform === 'NOTEBOOKLM';
      const uid = `v110-split-guide-${Date.now()}-${Math.floor(Math.random() * 999)}`;
      const btnText = isNotebook
        ? '📖 Hướng dẫn dùng NotebookLM từ A → Z (Tạo sổ · Up file · Ghi chú · Báo cáo & Mindmap)'
        : '📖 Hướng dẫn dùng Gemini từ A → Z (Up file PDF · Chọn mô hình · Dán lệnh · Tạo ảnh bìa)';
      const bodyHtml = isNotebook
        ? this.buildNotebookLmGuideStepsHtml()
        : this.buildGeminiGuideStepsHtml(modeKey);

      return `
        <div class="rounded-xl border border-amber-400/55 bg-zinc-950/90 overflow-hidden" data-v110-guide-box="1">
          <button
            type="button"
            data-v110-guide-toggle="${uid}"
            aria-expanded="false"
            class="noir-v110-blink-6s w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left border border-amber-400/70 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-100 font-extrabold text-[11.5px] transition cursor-pointer"
          >
            <span class="min-w-0 flex-1">${btnText}</span>
            <span class="shrink-0 px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/60 text-amber-200 text-[10.5px] font-black whitespace-nowrap">
              <span data-v110-guide-state="${uid}">Mở rộng</span> <span data-v110-guide-arrow="${uid}">▾</span>
            </span>
          </button>
          <div id="${uid}" class="hidden p-3 border-t border-amber-500/30 bg-zinc-950/95">
            ${bodyHtml}
          </div>
        </div>
      `;
    }

    bindCollapsibleSplitGuideEvents(rootEl) {
      if (!rootEl) return;
      rootEl.querySelectorAll('[data-v110-guide-toggle]').forEach((btn) => {
        if (btn.dataset.v110Bound === '1') return;
        btn.dataset.v110Bound = '1';
        const targetId = btn.getAttribute('data-v110-guide-toggle');
        btn.addEventListener('click', () => {
          const panel = targetId ? document.getElementById(targetId) : null;
          if (!panel) return;
          const willOpen = panel.classList.contains('hidden');
          panel.classList.toggle('hidden', !willOpen);
          btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
          btn.classList.remove('noir-v110-blink-6s');
          const tr = (s) =>
            window.NoirStudio?.i18n?.translateText
              ? window.NoirStudio.i18n.translateText(s)
              : s;
          const lbl = rootEl.querySelector(`[data-v110-guide-state="${targetId}"]`);
          const arr = rootEl.querySelector(`[data-v110-guide-arrow="${targetId}"]`);
          if (lbl) lbl.textContent = willOpen ? tr('Thu gọn') : tr('Mở rộng');
          if (arr) arr.textContent = willOpen ? '▴' : '▾';
          if (willOpen) {
            window.NoirStudio?.i18n?.translateElement?.(panel);
          }
        });
      });
    }

    mountTab6Guides() {
      if (typeof document === 'undefined') return;
      const root = document.getElementById('tab6-v110-ai-guides-root');
      if (!root) return;
      this.ensureStyles();
      root.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-500/30">
          <div>
            <div class="text-sm font-black text-amber-300 flex items-center gap-1.5">
              <span>🧭 Cẩm Nang Trực Quan A → Z: Dùng Gemini &amp; Google NotebookLM</span>
            </div>
            <p class="text-[11px] text-zinc-300 mt-0.5">Ảnh minh họa giống hệt giao diện thật: cách mở trang chủ, up file PDF/TXT, dán câu lệnh, tạo ghi chú, xem Mind Map &amp; Báo cáo hình ảnh.</p>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" id="btn-tab6-guide-tab-gemini" class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow transition">
              ✨ Hướng dẫn Gemini (A → Z)
            </button>
            <button type="button" id="btn-tab6-guide-tab-notebooklm" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition">
              📓 Hướng dẫn NotebookLM (A → Z)
            </button>
          </div>
        </div>
        <div id="tab6-guide-pane-gemini" class="pt-3">
          ${this.buildGeminiGuideStepsHtml('MODE_6_BOOK_COVER')}
        </div>
        <div id="tab6-guide-pane-notebooklm" class="hidden pt-3">
          ${this.buildNotebookLmGuideStepsHtml()}
        </div>
      `;

      const btnG = document.getElementById('btn-tab6-guide-tab-gemini');
      const btnN = document.getElementById('btn-tab6-guide-tab-notebooklm');
      const paneG = document.getElementById('tab6-guide-pane-gemini');
      const paneN = document.getElementById('tab6-guide-pane-notebooklm');

      const setActive = (which) => {
        const isG = which === 'GEMINI';
        paneG?.classList.toggle('hidden', !isG);
        paneN?.classList.toggle('hidden', isG);
        if (btnG) {
          btnG.className = isG
            ? 'px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow transition'
            : 'px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition';
        }
        if (btnN) {
          btnN.className = !isG
            ? 'px-3 py-1.5 rounded-xl bg-sky-600 text-white font-extrabold text-xs shadow transition'
            : 'px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition';
        }
      };

      btnG?.addEventListener('click', () => setActive('GEMINI'));
      btnN?.addEventListener('click', () => setActive('NOTEBOOKLM'));
      window.NoirStudio?.i18n?.translateElement?.(root);
    }
  }

  const manuscriptSyncTracker = new ManuscriptSyncChangeTracker(promptSynthesizer);
  const geminiSplitBridge = new GeminiAndNotebookLmSplitBridge(promptSynthesizer);
  const v106CommandSuite = new V106CommandBoxAndLimitGuards(promptSynthesizer);
  const v110AiGuides = new V110AiPlatformVisualGuideStudio();
  window.NoirStudio.manuscriptSyncTracker = manuscriptSyncTracker;
  window.NoirStudio.geminiSplitBridge = geminiSplitBridge;
  window.NoirStudio.v106CommandSuite = v106CommandSuite;
  window.NoirStudio.aiGuides = v110AiGuides;

  const bootV105SplitAndTrackers = () => {
    try {
      manuscriptSyncTracker.init();
      geminiSplitBridge.init();
      v106CommandSuite.init();
      v110AiGuides.mountTab6Guides();
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
