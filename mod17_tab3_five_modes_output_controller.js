/**
 * ============================================================================
 * ✍️ WEB VIẾT TIỂU THUYẾT CỦA BI — MODULE 17 (BATCH 4)
 * TÊN FILE: mod17_tab3_five_modes_output_controller.js
 * ============================================================================
 * BỘ ĐIỀU KHIỂN CỬA SỔ ĐẦU RA 5 CHẾ ĐỘ THỐNG NHẤT TẠI TAB 3
 * (Tab3FiveModesWorkspaceController — v36.0 SUPREME EDITION)
 *
 * Thiết kế bởi Kiến trúc sư Phần mềm 30 năm kinh nghiệm:
 * 1. Quản lý tập trung toàn bộ không gian đầu ra của 5 Chế độ Thực thi AI tại Tab 3:
 *    - MODE_1_DRAFT      : ✍️ Chế độ 1 — Bản thảo Văn học Chính thức
 *    - MODE_2_BRAINSTORM : 💡 Chế độ 2 — Bàn tròn Ý tưởng & Thiết kế Nhánh Cốt truyện
 *    - MODE_3_AUDIT      : 🔍 Chế độ 3 — Thanh tra Logic, Thời gian & Ma trận Ai Biết Gì
 *    - MODE_4_REVIEW     : ✨ Chế độ 4 — Biên tập Chuyên sâu, Gọt văn & Chuẩn hóa Thoại
 *    - MODE_5_DIAGRAM    : 🎨 Chế độ 5 — Vẽ Biểu đồ Cốt truyện & Đối chiếu Thời gian
 * 2. Điều khiển trực tiếp thanh công cụ thống nhất trên cùng (#tab3-unified-output-topbar):
 *    - Bộ chọn 5 chế độ (#s20-quad-tab-selector)
 *    - Huy hiệu đếm số từ thời gian thực (#tab3-output-word-badge)
 *    - Nút Chèn nối tiếp vào Bản thảo kèm đánh dấu màu AI (#btn-tab3-append-to-manuscript)
 *    - Nút Thay thế Bản thảo kèm lưu mốc lịch sử tự động (#btn-tab3-replace-manuscript)
 *    - Nút Sao chép nhanh (#btn-tab3-copy-output)
 *    - Nút Mở Bảng Cấu hình Prompt 5 Chế độ (#btn-tab3-open-mode-prompts)
 *    - Nút Lưu trích xuất vào Story Bible Tab 4 (#btn-tab3-save-to-bible)
 *    - Nút Xóa trắng đầu ra chế độ đang mở (#btn-tab3-clear-output)
 * 3. Tích hợp Kho Phiên Bản Đầu Ra Theo Từng Chế Độ (Tab3OutputRevisionHistoryVault),
 *    Bộ Phân Tích Chất Lượng Văn Học Tiếng Việt (Tab3LiteraryQualityAnalyzer),
 *    và Bộ Chuyển Giao Đoạn Bôi Đen Thông Minh (Tab3SmartTransferEngine).
 * ============================================================================
 */
(function () {
  'use strict';

  window.NoirStudio = window.NoirStudio || {};

  // ==========================================================================
  // PHẦN 1: ĐẶC TẢ CHI TIẾT 5 CHẾ ĐỘ ĐẦU RA TẠI TAB 3 & TỪ ĐIỂN CẢM QUAN VĂN HỌC
  // ==========================================================================
  const TAB3_MODE_DESCRIPTORS = {
    MODE_1_DRAFT: {
      key: 'MODE_1_DRAFT',
      shortLabel: '✍️ Chế độ 1: Viết Bản Thảo',
      fullTitle: '✍️ Chế độ 1: Đầu Ra Bản Thảo Tiểu Thuyết Chính Thức',
      badgeColor: 'emerald',
      placeholder:
        'Kết quả viết bản thảo chính thức (Chế độ 1) sẽ hiển thị tại đây.\n• Bạn có thể chỉnh sửa trực tiếp văn bản ngay trong khung này.\n• Bấm "📥 Chèn nối tiếp" hoặc "🔄 Thay thế" trên thanh trên cùng để đưa vào Bản thảo Chính ở Tab 1 (kèm màu đánh dấu AI để bạn duyệt).',
      bibleSectionHeader: 'BẢN NHÁP / TRÍCH ĐOẠN TỪ CHẾ ĐỘ 1 (VIẾT BẢN THẢO)',
      supportsDirectManuscriptTransfer: true
    },
    MODE_2_BRAINSTORM: {
      key: 'MODE_2_BRAINSTORM',
      shortLabel: '💡 Chế độ 2: Bàn Tròn Ý Tưởng',
      fullTitle: '💡 Chế độ 2: Phương Án Phát Triển Tình Tiết & Nút Thắt Cốt Truyện',
      badgeColor: 'amber',
      placeholder:
        'Các phương án phát triển cốt truyện, gợi ý nút thắt (Plot Twist) và hướng gỡ bí (Chế độ 2) sẽ hiển thị tại đây.\n• Bạn có thể bấm "📚 Lưu vào Bible" để cất giữ các ý tưởng hay vào Hồ sơ Story Bible tại Tab 4.',
      bibleSectionHeader: 'PHƯƠNG ÁN Ý TƯỞNG & NHÁNH CỐT TRUYỆN (TỪ CHẾ ĐỘ 2)',
      supportsDirectManuscriptTransfer: true
    },
    MODE_3_AUDIT: {
      key: 'MODE_3_AUDIT',
      shortLabel: '🔍 Chế độ 3: Thanh Tra Logic',
      fullTitle: '🔍 Chế độ 3: Báo Cáo Thanh Tra Logic, Thời Gian & Ma Trận Ai Biết Gì',
      badgeColor: 'indigo',
      placeholder:
        'Báo cáo rà soát mâu thuẫn dòng thời gian, kiểm tra Ma trận Ai Biết Gì và phát hiện lỗi tính cách nhân vật (Chế độ 3) sẽ hiển thị tại đây.\n• Giúp bạn đảm bảo toàn bộ các chương khớp nhau 100% trước khi chốt duyệt.',
      bibleSectionHeader: 'GHI CHÚ THANH TRA LOGIC & NHẤT QUÁN (TỪ CHẾ ĐỘ 3)',
      supportsDirectManuscriptTransfer: true
    },
    MODE_4_REVIEW: {
      key: 'MODE_4_REVIEW',
      shortLabel: '✨ Chế độ 4: Biên Tập & Gọt Văn',
      fullTitle: '✨ Chế độ 4: Bản Thảo Đã Chuẩn Hóa Hội Thoại & Gọt Văn Chống Sáo Rỗng',
      badgeColor: 'purple',
      placeholder:
        'Bản thảo sau khi được biên tập chuyên sâu, loại bỏ từ cấm sáo rỗng (Anti-Cliché) và chuẩn hóa hội thoại "- Câu thoại (Tên nhân vật)" (Chế độ 4) sẽ hiển thị tại đây.\n• Bạn có thể bấm "🔄 Thay thế" hoặc "📥 Chèn nối tiếp" để cập nhật sang Tab 1.',
      bibleSectionHeader: 'GHI CHÚ BIÊN TẬP & PHONG CÁCH VĂN CHƯƠNG (TỪ CHẾ ĐỘ 4)',
      supportsDirectManuscriptTransfer: true
    },
    MODE_5_DIAGRAM: {
      key: 'MODE_5_DIAGRAM',
      shortLabel: '🎨 Chế độ 5: Biểu Đồ Cốt Truyện',
      fullTitle: '🎨 Chế độ 5: Sơ Đồ Cốt Truyện, Mạng Lưới Nhân Vật & Dòng Thời Gian',
      badgeColor: 'teal',
      placeholder:
        'Biểu đồ SVG tương tác và Báo cáo đối chiếu dòng thời gian xuyên chương (Chế độ 5).',
      bibleSectionHeader: 'BIÊN NIÊN SỬ DÒNG THỜI GIAN & SƠ ĐỒ CỐT TRUYỆN (TỪ CHẾ ĐỘ 5)',
      supportsDirectManuscriptTransfer: true
    },
    MODE_6_BOOK_COVER: {
      key: 'MODE_6_BOOK_COVER',
      shortLabel: '🖼️ Chế độ 6: Tạo Bìa Truyện AI',
      fullTitle: '🖼️ Chế độ 6: Câu Lệnh & Ý Tưởng Thiết Kế Bìa Truyện Bằng AI (Gemini Tạo Ảnh)',
      badgeColor: 'purple',
      placeholder:
        'Câu lệnh tạo bìa truyện chuyên nghiệp kết hợp Story Bible & phong cách vẽ (Chế độ 6) sẽ hiển thị tại đây. Hãy copy dán vào mục "Tạo hình ảnh" của Gemini Web/App để vẽ bìa sắc nét nhất!',
      bibleSectionHeader: 'Ý TƯỞNG & PHONG CÁCH BÌA TRUYỆN (TỪ CHẾ ĐỘ 6)',
      supportsDirectManuscriptTransfer: false
    }
  };

  /**
   * Từ điển từ khóa cảm quan & tâm lý tiếng Việt phục vụ phân tích chất lượng đầu ra
   */
  const VIETNAMESE_SENSORY_LEXICON = {
    visual: [
      'ánh sáng',
      'bóng tối',
      'mờ ảo',
      'lấp lánh',
      'phản chiếu',
      'sương mù',
      'nhợt nhạt',
      'đỏ thẫm',
      'xám xịt',
      'vệt nắng',
      'ngọn đèn',
      'ánh mắt',
      'bóng lưng',
      'khói'
    ],
    auditory: [
      'tiếng bước chân',
      'vọng lại',
      'thì thầm',
      'im lặng',
      'rít lên',
      'tiếng mưa',
      'tiếng gió',
      'nhịp thở',
      'khàn đặc',
      'vang lên',
      'lách cách',
      'tĩnh mịch',
      'ngân dài'
    ],
    tactileAndOlfactory: [
      'lạnh buốt',
      'ẩm ướt',
      'mùi hương',
      'mùi máu',
      'mùi thuốc',
      'mùi ẩm mốc',
      'run rẩy',
      'nóng rực',
      'gai góc',
      'nhói buốt',
      'hơi lạnh',
      'cứng ngắc'
    ],
    psychological: [
      'hoài nghi',
      'ám ảnh',
      'cảnh giác',
      'dằn vặt',
      'ký ức',
      'trống rỗng',
      'bất an',
      'kiềm chế',
      'lạnh lùng',
      'do dự',
      'bí mật',
      'thăm dò',
      'giằng xé'
    ]
  };

  // ==========================================================================
  // PHẦN 2: KHO LƯU TRỮ LỊCH SỬ PHIÊN BẢN ĐẦU RA CỦA 5 CHẾ ĐỘ
  //         (Tab3OutputRevisionHistoryVault)
  // ==========================================================================
  class Tab3OutputRevisionHistoryVault {
    constructor(utils) {
      this.utils = utils;
      this.storageKey = 'noir_v36_tab3_mode_revision_history';
      this.maxRevisionsPerMode = 15;
      this.revisionsByMode = {
        MODE_1_DRAFT: [],
        MODE_2_BRAINSTORM: [],
        MODE_3_AUDIT: [],
        MODE_4_REVIEW: [],
        MODE_5_DIAGRAM: [],
        MODE_6_BOOK_COVER: []
      };
      this.loadFromStorage();
    }

    loadFromStorage() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.keys(this.revisionsByMode).forEach((k) => {
              if (Array.isArray(parsed[k])) {
                this.revisionsByMode[k] = parsed[k];
              }
            });
          }
        }
      } catch (_) {}
    }

    saveToStorage() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.revisionsByMode));
      } catch (_) {}
    }

    pushRevision(modeKey, text, sourceLabel = 'AI_GENERATION') {
      const cleanMode = this.revisionsByMode[modeKey] ? modeKey : 'MODE_1_DRAFT';
      const cleanText = String(text || '').trim();
      if (!cleanText) return null;

      const list = this.revisionsByMode[cleanMode];
      if (list.length > 0 && list[0].text === cleanText) {
        list[0].timestamp = Date.now();
        this.saveToStorage();
        return list[0];
      }

      const wordCount =
        this.utils && typeof this.utils.countVietnameseWords === 'function'
          ? this.utils.countVietnameseWords(cleanText)
          : cleanText.split(/\s+/).filter(Boolean).length;

      const item = {
        id: `rev_${cleanMode}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        modeKey: cleanMode,
        timestamp: Date.now(),
        sourceLabel,
        wordCount,
        preview: cleanText.slice(0, 110).replace(/\s+/g, ' '),
        text: cleanText
      };

      list.unshift(item);
      if (list.length > this.maxRevisionsPerMode) {
        this.revisionsByMode[cleanMode] = list.slice(0, this.maxRevisionsPerMode);
      }
      this.saveToStorage();
      return item;
    }

    getRevisionsForMode(modeKey) {
      return [...(this.revisionsByMode[modeKey] || [])];
    }

    getRevisionById(modeKey, revId) {
      const list = this.revisionsByMode[modeKey] || [];
      return list.find((r) => r.id === revId) || null;
    }

    clearRevisionsForMode(modeKey) {
      if (this.revisionsByMode[modeKey]) {
        this.revisionsByMode[modeKey] = [];
        this.saveToStorage();
      }
    }
  }

  // ==========================================================================
  // PHẦN 3: BỘ PHÂN TÍCH CHẤT LƯỢNG VĂN HỌC & NHỊP ĐIỆU ĐẦU RA TẠI TAB 3
  //         (Tab3LiteraryQualityAndReadabilityAnalyzer)
  // ==========================================================================
  class Tab3LiteraryQualityAndReadabilityAnalyzer {
    constructor(utils, storyBible) {
      this.utils = utils;
      this._storyBible = storyBible;
    }

    get storyBible() {
      return this._storyBible || window.NoirStudio?.storyBible;
    }

    /**
     * Phân tích toàn diện văn bản đầu ra đang mở ở Tab 3:
     * - Số từ, số đoạn văn, số câu, thời gian đọc ước tính
     * - Tỷ lệ hội thoại & mức độ tuân thủ chuẩn "- Câu thoại (Tên nhân vật)"
     * - Mật độ từ ngữ đa giác quan & nội tâm
     * - Phát hiện từ cấm sáo rỗng (Anti-Cliché)
     */
    analyzeOutputText(text) {
      const raw = String(text || '').trim();
      if (!raw) {
        return {
          wordCount: 0,
          charCount: 0,
          paragraphCount: 0,
          sentenceCount: 0,
          readingMinutes: 0,
          dialogueLineCount: 0,
          standardDialogueCount: 0,
          dialogueRatioPercent: 0,
          sensoryHits: { visual: 0, auditory: 0, tactileAndOlfactory: 0, psychological: 0 },
          detectedCliches: [],
          rhythmLabel: 'Chưa có văn bản'
        };
      }

      const wordCount =
        this.utils && typeof this.utils.countVietnameseWords === 'function'
          ? this.utils.countVietnameseWords(raw)
          : raw.split(/\s+/).filter(Boolean).length;

      const charCount = raw.length;
      const paragraphs = raw
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      const paragraphCount = paragraphs.length;

      const sentences = raw
        .split(/[.!?…]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);
      const sentenceCount = Math.max(1, sentences.length);
      const avgWordsPerSentence = wordCount / sentenceCount;

      const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));

      // Kiểm tra các dòng hội thoại
      const dialogueLines = paragraphs.filter((p) => /^[-–—]\s*/.test(p));
      const standardDialogueLines = dialogueLines.filter((p) =>
        /^-\s+.+\([^)]+\)\s*$/.test(p)
      );

      const dialogueWords = dialogueLines.reduce(
        (acc, line) => acc + line.split(/\s+/).filter(Boolean).length,
        0
      );
      const dialogueRatioPercent =
        wordCount > 0 ? Math.min(100, Math.round((dialogueWords / wordCount) * 100)) : 0;

      // Đếm mật độ từ ngữ cảm quan
      const lower = raw.toLowerCase();
      const sensoryHits = {
        visual: VIETNAMESE_SENSORY_LEXICON.visual.filter((w) => lower.includes(w)).length,
        auditory: VIETNAMESE_SENSORY_LEXICON.auditory.filter((w) => lower.includes(w)).length,
        tactileAndOlfactory: VIETNAMESE_SENSORY_LEXICON.tactileAndOlfactory.filter((w) =>
          lower.includes(w)
        ).length,
        psychological: VIETNAMESE_SENSORY_LEXICON.psychological.filter((w) =>
          lower.includes(w)
        ).length
      };

      // Kiểm tra danh sách từ cấm sáo rỗng (Anti-Cliché)
      const antiClicheList = Array.isArray(this.storyBible?.antiClicheList)
        ? this.storyBible.antiClicheList
        : [];
      const detectedCliches = antiClicheList.filter((phrase) => {
        const cleanPhrase = String(phrase || '').trim().toLowerCase();
        return cleanPhrase && lower.includes(cleanPhrase);
      });

      let rhythmLabel = 'Cân bằng & Mượt mà';
      if (avgWordsPerSentence < 11) {
        rhythmLabel = 'Nhịp nhanh, dồn dập (Hành động / Kịch tính)';
      } else if (avgWordsPerSentence > 24) {
        rhythmLabel = 'Nhịp chậm, sâu lắng (Nội tâm / Miêu tả)';
      }

      return {
        wordCount,
        charCount,
        paragraphCount,
        sentenceCount,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        readingMinutes,
        dialogueLineCount: dialogueLines.length,
        standardDialogueCount: standardDialogueLines.length,
        dialogueRatioPercent,
        sensoryHits,
        detectedCliches,
        rhythmLabel
      };
    }

    /**
     * Tự động chuẩn hóa định dạng hội thoại trong văn bản đầu ra tại Tab 3
     * về chuẩn "- Câu thoại (Tên nhân vật)" và loại bỏ dòng trống dư thừa.
     */
    normalizeDialogueAndParagraphFormatting(rawText) {
      const text = String(rawText || '').replace(/\r\n/g, '\n').trim();
      if (!text) return '';

      const normalizedLines = text.split('\n').map((line) => {
        let trimmed = line.trim();
        if (!trimmed) return '';
        // Đổi dấu gạch ngang dài hoặc ngoặc kép đầu dòng thoại sang "- "
        if (/^[–—]\s*/.test(trimmed)) {
          trimmed = trimmed.replace(/^[–—]\s*/, '- ');
        } else if (/^-\S/.test(trimmed)) {
          trimmed = trimmed.replace(/^-/, '- ');
        }
        return trimmed;
      });

      return normalizedLines.join('\n').replace(/\n{3,}/g, '\n\n');
    }
  }
  // ==========================================================================
  // PHẦN 4: BỘ TRÍCH XUẤT & ĐỒNG BỘ THÔNG MINH SANG STORY BIBLE & BẢN THẢO
  //         (Tab3SmartSelectionAndBibleBridge)
  // ==========================================================================
  class Tab3SmartSelectionAndBibleBridge {
    constructor(storyBible, utils) {
      this._storyBible = storyBible;
      this._utils = utils;
    }

    get storyBible() {
      return this._storyBible || window.NoirStudio?.storyBible;
    }

    get utils() {
      return this._utils || window.NoirStudio?.utils;
    }

    /**
     * Lấy phần văn bản đang được tác giả bôi đen trong #s20-quad-output-textarea
     * (Nếu tác giả không bôi đen riêng đoạn nào, trả về chuỗi rỗng để dùng toàn bộ văn bản)
     */
    getSelectedTextInOutputBox() {
      const outTextarea = document.getElementById('s20-quad-output-textarea');
      if (!outTextarea) return '';
      const start = outTextarea.selectionStart;
      const end = outTextarea.selectionEnd;
      if (typeof start === 'number' && typeof end === 'number' && end > start) {
        return outTextarea.value.slice(start, end).trim();
      }
      return '';
    }

    /**
     * Trích xuất tự động các Nhân vật, Mốc sự kiện hoặc Phục bút từ đầu ra Chế độ 2 / 3 / 4
     * để hỗ trợ tác giả lưu vào Story Bible Tab 4 một cách có cấu trúc.
     */
    formatStructuredBibleEntry(modeKey, rawText, chapterTitle = '') {
      const clean = String(rawText || '').trim();
      const stamp =
        this.utils && typeof this.utils.formatTimestampVN === 'function'
          ? this.utils.formatTimestampVN(Date.now())
          : new Date().toLocaleString('vi-VN');

      const descriptor =
        TAB3_MODE_DESCRIPTORS[modeKey] || TAB3_MODE_DESCRIPTORS.MODE_1_DRAFT;
      const chapTag = chapterTitle ? ` | ${chapterTitle}` : '';

      return [
        `====================================================================`,
        `📌 [${descriptor.bibleSectionHeader}${chapTag} — ${stamp}]`,
        `====================================================================`,
        clean
      ].join('\n');
    }
  }

  // ==========================================================================
  // PHẦN 5: BỘ ĐIỀU KHIỂN CHÍNH — TAB 3 FIVE MODES WORKSPACE CONTROLLER
  //         (Tab3FiveModesWorkspaceController)
  // ==========================================================================
  class Tab3FiveModesWorkspaceController {
    constructor(idb, aiDiff, storyBible, sysPrompts, utils) {
      this._idb = idb;
      this._aiDiff = aiDiff;
      this._storyBible = storyBible;
      this._sysPrompts = sysPrompts;
      this._utils = utils;

      this.activeMode = 'MODE_1_DRAFT';
      this.modeOutputs = {
        MODE_1_DRAFT: '',
        MODE_2_BRAINSTORM: '',
        MODE_3_AUDIT: '',
        MODE_4_REVIEW: '',
        MODE_5_DIAGRAM: '',
        MODE_6_BOOK_COVER: ''
      };

      this.searchQuery = '';
      this.lastSearchMatchIndex = -1;

      this.revisionVault = new Tab3OutputRevisionHistoryVault(this.utils);
      this.qualityAnalyzer = new Tab3LiteraryQualityAndReadabilityAnalyzer(
        this.utils,
        this.storyBible
      );
      this.bibleBridge = new Tab3SmartSelectionAndBibleBridge(
        this.storyBible,
        this.utils
      );
    }

    // Các getter an toàn liên kết với window.NoirStudio
    get constants() {
      return (
        window.NoirStudio?.constants || {
          STORAGE_KEYS: {
            MODE_OUTPUTS: 'noir_s20_quad_mode_outputs_v1',
            EXECUTION_MODE: 'noir_selected_ai_mode'
          }
        }
      );
    }

    get idb() {
      return this._idb || window.NoirStudio?.idb;
    }

    get aiDiff() {
      return this._aiDiff || window.NoirStudio?.aiDiff;
    }

    get storyBible() {
      return this._storyBible || window.NoirStudio?.storyBible;
    }

    get sysPrompts() {
      return this._sysPrompts || window.NoirStudio?.sysPrompts;
    }

    get chapterMgr() {
      return window.NoirStudio?.chapterManager;
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
              : new Date().toLocaleString('vi-VN'),
          showToast: (msg) => console.log('[Toast]', msg)
        }
      );
    }

    /**
     * Khởi tạo toàn bộ cửa sổ đầu ra 5 chế độ tại Tab 3, khôi phục dữ liệu đã lưu
     * và gắn kết sự kiện cho thanh công cụ thống nhất trên cùng (#tab3-unified-output-topbar).
     */
    init() {
      const saved = this.idb?.getLocalJSON
        ? this.idb.getLocalJSON(this.constants.STORAGE_KEYS.MODE_OUTPUTS, {})
        : {};
      if (saved && typeof saved === 'object') {
        this.modeOutputs = { ...this.modeOutputs, ...saved };
      }

      const outTextarea = document.getElementById('s20-quad-output-textarea');
      if (outTextarea && !outTextarea.dataset.noirMod17Bound) {
        outTextarea.dataset.noirMod17Bound = '1';
        outTextarea.addEventListener('input', () => {
          this.modeOutputs[this.activeMode] = outTextarea.value;
          this.persistOutputs();
          this.updateOutputWordBadge(outTextarea.value);
          this.refreshAnalyticsFooterBar();
        });
      }

      const selector = document.getElementById('s20-quad-tab-selector');
      if (selector && !selector.dataset.noirMod17Bound) {
        selector.dataset.noirMod17Bound = '1';
        selector.addEventListener('change', () => {
          this.switchMode(selector.value);
        });
      }

      this.bindTopbarButtonsIfNeeded();
      this.injectTab3SubToolbarAndAnalyticsFooterIfNeeded();
      try {
        const savedTab3Mode = localStorage.getItem('noir_v40_tab3_active_mode_v1');
        if (savedTab3Mode && TAB3_MODE_DESCRIPTORS[savedTab3Mode]) {
          this.activeMode = savedTab3Mode;
        }
      } catch (_) {}
      this.switchMode(this.activeMode);
      if (!this._i18nBound) {
        this._i18nBound = true;
        const syncLang = () => {
          try {
            const topbar = document.getElementById('tab3-unified-output-topbar');
            if (topbar) window.NoirNovel?.i18n?.translateElement?.(topbar);
            const curText = this.getCurrentModeText();
            this.updateOutputWordBadge(curText);
            this.refreshAnalyticsFooterBar();
          } catch {}
        };
        window.NoirStudio?.bus?.on?.('i18n:changed', syncLang);
        window.addEventListener?.('noir:i18n:changed', syncLang);
      }
    }

    /**
     * Đảm bảo các nút trên thanh #tab3-unified-output-topbar hoạt động ổn định
     */
    bindTopbarButtonsIfNeeded() {
      const bindOnce = (domId, handler) => {
        const el = document.getElementById(domId);
        if (!el || el.dataset.noirMod17ClickBound) return;
        el.dataset.noirMod17ClickBound = '1';
        el.addEventListener('click', handler);
      };

      bindOnce('btn-tab3-append-to-manuscript', () =>
        this.appendCurrentOutputToManuscript()
      );
      bindOnce('btn-tab3-replace-manuscript', () =>
        this.replaceManuscriptWithCurrentOutput()
      );
      bindOnce('btn-tab3-copy-output', () => this.copyCurrentOutput());
      bindOnce('btn-tab3-save-to-bible', () => this.saveCurrentOutputToStoryBible());
      bindOnce('btn-tab3-clear-output', () => this.clearCurrentOutput());
      bindOnce('btn-tab3-open-mode-prompts', () => {
        if (this.sysPrompts && typeof this.sysPrompts.openModal === 'function') {
          this.sysPrompts.openModal(this.activeMode);
        } else {
          document.getElementById('modal-system-prompts-config')?.classList.remove('hidden');
        }
      });
      bindOnce('btn-tab3-jump-newest-output', () => {
        this.revealLatestOutputInView(this.activeMode);
      });
      bindOnce('btn-tab3-dismiss-new-alert', () => {
        document.getElementById('tab3-new-output-alert-banner')?.classList.add('hidden');
      });
    }

    /**
     * Tích hợp thanh tiện ích phụ trợ gọn gàng bên dưới khung đầu ra Tab 3
     * (Lịch sử phiên bản đầu ra của chế độ hiện tại, Chuẩn hóa thoại nhanh,
     *  Xuất file .TXT/.MD và Chỉ số nhịp điệu văn học).
     */
    injectTab3SubToolbarAndAnalyticsFooterIfNeeded() {
      const stdWrapper = document.getElementById('tab3-standard-output-wrapper');
      if (!stdWrapper) return;
      if (document.getElementById('mod17-tab3-analytics-footer')) return;

      const footer = document.createElement('div');
      footer.id = 'mod17-tab3-analytics-footer';
      footer.className =
        'px-3 py-2 bg-zinc-950/90 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400';

      footer.innerHTML = `
        <div id="mod17-tab3-quality-metrics" class="flex flex-wrap items-center gap-3 font-monoCode text-[10px] sm:text-[11px]">
          <span>Đoạn: <strong id="mod17-stat-paragraphs" class="text-zinc-200">0</strong></span>
          <span>Thoại chuẩn: <strong id="mod17-stat-dialogue" class="text-emerald-400">0</strong></span>
          <span>Đọc: <strong id="mod17-stat-readtime" class="text-zinc-200">0 phút</strong></span>
          <span id="mod17-stat-rhythm" class="text-indigo-300 hidden sm:inline">Nhịp văn: Cân bằng</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <select id="mod17-select-mode-revision" title="Khôi phục kết quả chạy AI trước đó của chế độ này" class="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2 py-1 text-[10px] text-zinc-200 max-w-[200px]">
            <option value="">🕒 Lịch sử đầu ra chế độ này (0)</option>
          </select>
          <button id="mod17-btn-normalize-dialogue" type="button" title="Chuẩn hóa dấu gạch ngang đầu câu thoại và khoảng cách đoạn" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] transition">
            ✨ Chuẩn hóa thoại
          </button>
          <button id="mod17-btn-export-mode-txt" type="button" title="Tải đầu ra hiện tại về máy dạng .TXT" class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] transition">
            💾 Xuất .TXT
          </button>
        </div>
      `;

      stdWrapper.appendChild(footer);

      const revSelect = document.getElementById('mod17-select-mode-revision');
      if (revSelect) {
        revSelect.addEventListener('change', () => {
          const revId = revSelect.value;
          if (!revId) return;
          this.restoreModeRevision(this.activeMode, revId);
          revSelect.value = '';
        });
      }

      document
        .getElementById('mod17-btn-normalize-dialogue')
        ?.addEventListener('click', () => this.normalizeCurrentOutputFormatting());

      document
        .getElementById('mod17-btn-export-mode-txt')
        ?.addEventListener('click', () => this.exportCurrentOutputAsFile('txt'));
    }

    /**
     * Lưu toàn bộ nội dung đầu ra của 5 chế độ vào LocalStorage / IndexedDB
     */
    persistOutputs() {
      if (this.idb && typeof this.idb.setLocalJSON === 'function') {
        this.idb.setLocalJSON(this.constants.STORAGE_KEYS.MODE_OUTPUTS, this.modeOutputs);
      } else {
        try {
          localStorage.setItem(
            this.constants.STORAGE_KEYS.MODE_OUTPUTS,
            JSON.stringify(this.modeOutputs)
          );
        } catch (_) {}
      }
    }

    /**
     * Chuyển đổi giữa 5 Chế độ tại Tab 3:
     * - Chế độ 1 -> 4: Hiển thị khung văn bản tiêu chuẩn (#tab3-standard-output-wrapper & #s20-quad-output-textarea)
     * - Chế độ 5: Hiển thị Xưởng Vẽ Biểu Đồ Cốt Truyện & Dòng Thời Gian (#mode5-plot-diagram-studio)
     */
    switchMode(modeKey) {
      if (!modeKey) return;
      this.activeMode = modeKey;
      try {
        localStorage.setItem('noir_v40_tab3_active_mode_v1', String(modeKey));
      } catch (_) {}

      const selector = document.getElementById('s20-quad-tab-selector');
      if (selector && selector.value !== modeKey) {
        selector.value = modeKey;
      }

      const cmdModeSelect = document.getElementById('select-ai-execution-mode');
      if (cmdModeSelect && cmdModeSelect.value !== modeKey) {
        cmdModeSelect.value = modeKey;
      }

      const stdWrapper = document.getElementById('tab3-standard-output-wrapper');
      const mode5Studio = document.getElementById('mode5-plot-diagram-studio');
      const mode6Studio = document.getElementById('tab3-mode6-cover-studio');
      const outTextarea = document.getElementById('s20-quad-output-textarea');

      const descriptor =
        TAB3_MODE_DESCRIPTORS[modeKey] || TAB3_MODE_DESCRIPTORS.MODE_1_DRAFT;
      if (outTextarea && descriptor.placeholder) {
        outTextarea.setAttribute('placeholder', descriptor.placeholder);
        if (window.NoirStudio?.i18n?.processElementAttributes) {
          window.NoirStudio.i18n.processElementAttributes(outTextarea);
        }
      }

      const insertBtns = [
        document.getElementById('btn-s20-insert-append'),
        document.getElementById('btn-s20-insert-replace'),
        document.getElementById('btn-insert-ai-append'),
        document.getElementById('btn-insert-ai-replace'),
        document.getElementById('btn-tab3-append-to-manuscript'),
        document.getElementById('btn-tab3-replace-manuscript')
      ].filter(Boolean);

      if (modeKey === 'MODE_5_DIAGRAM') {
        stdWrapper?.classList.add('hidden');
        mode6Studio?.classList.add('hidden');
        mode5Studio?.classList.remove('hidden');
        insertBtns.forEach((b) => {
          b.disabled = true;
          b.classList.add('opacity-40', 'cursor-not-allowed');
        });
        window.NoirStudio?.mode5Studio?.refreshChapterChecklist?.();
        this.updateOutputWordBadge(this.modeOutputs.MODE_5_DIAGRAM || '');
      } else if (modeKey === 'MODE_6_BOOK_COVER') {
        stdWrapper?.classList.add('hidden');
        mode5Studio?.classList.add('hidden');
        mode6Studio?.classList.remove('hidden');
        insertBtns.forEach((b) => {
          b.disabled = true;
          b.classList.add('opacity-40', 'cursor-not-allowed');
        });
        window.NoirStudio?.coverGallery?.renderGalleryUI?.();
        this.updateOutputWordBadge('');
      } else {
        mode5Studio?.classList.add('hidden');
        mode6Studio?.classList.add('hidden');
        stdWrapper?.classList.remove('hidden');
        insertBtns.forEach((b) => {
          b.disabled = false;
          b.classList.remove('opacity-40', 'cursor-not-allowed');
        });
        if (outTextarea) {
          outTextarea.value = this.modeOutputs[modeKey] || '';
          this.updateOutputWordBadge(outTextarea.value);
        }
        window.NoirStudio?.tab3RichBridge?.loadModeRichOutput?.(modeKey, this.modeOutputs[modeKey] || '');
        this.refreshRevisionDropdownUI();
        this.refreshAnalyticsFooterBar();
      }
    }

    revealLatestOutputInView(modeKey = null) {
      const targetMode = modeKey || this.activeMode || 'MODE_1_DRAFT';
      const revs = this.revisionVault.getRevisionsForMode(targetMode);
      if (revs.length > 0 && (!this.modeOutputs[targetMode] || !this.modeOutputs[targetMode].trim())) {
        this.modeOutputs[targetMode] = revs[0].text;
      }
      this.switchMode(targetMode);
      const outTextarea = document.getElementById('s20-quad-output-textarea');
      if (outTextarea) {
        outTextarea.scrollTop = 0;
        outTextarea.focus();
        outTextarea.classList.add('ring-2', 'ring-emerald-400');
        setTimeout(() => outTextarea.classList.remove('ring-2', 'ring-emerald-400'), 1800);
      }
      document.getElementById('tab3-new-output-alert-banner')?.classList.add('hidden');
    }

    /**
     * Ghi nhận đầu ra mới cho một chế độ cụ thể (Mode 1 -> Mode 5),
     * lưu vào lịch sử phiên bản đầu ra của chế độ đó và cập nhật ngay giao diện + bật banner gây chú ý.
     */
    setOutputForMode(modeKey, text, meta = {}) {
      const cleanMode = modeKey || this.activeMode || 'MODE_1_DRAFT';
      const rawStr = String(text || '');
      const stripper =
        typeof window !== 'undefined' && typeof window.NoirStudio?.stripAiMarkdownSymbols === 'function'
          ? window.NoirStudio.stripAiMarkdownSymbols
          : null;
      const strText = stripper ? stripper(rawStr) : rawStr;

      // Lưu dấu gợi ý cốt truyện Chế độ 2 để Chế độ 1 tự động nhận biết và lồng ghép khi tổng hợp Prompt
      if (cleanMode === 'MODE_2_BRAINSTORM' && strText.trim()) {
        try {
          localStorage.setItem('noir_v36_mode2_latest_plot_outline', strText.trim());
        } catch (_) {}
      }

      // Nếu có nội dung mới khác rỗng, lưu vào kho lịch sử phiên bản của chế độ đó
      if (strText.trim()) {
        this.revisionVault.pushRevision(cleanMode, strText, 'AI_OUTPUT');
      }

      this.modeOutputs[cleanMode] = strText;
      this.persistOutputs();
      window.NoirStudio?.promptSynthesizer?.refreshCommandModeUX?.();

      // Tự động chuyển tab đầu ra về đúng chế độ vừa chạy xong để tác giả nhìn thấy ngay
      if (this.activeMode !== cleanMode) {
        this.switchMode(cleanMode);
      } else {
        const outTextarea = document.getElementById('s20-quad-output-textarea');
        if (outTextarea) {
          outTextarea.value = this.modeOutputs[cleanMode];
          outTextarea.scrollTop = 0;
        }
        window.NoirStudio?.tab3RichBridge?.syncFromPlainOutput?.(cleanMode, this.modeOutputs[cleanMode]);
        this.updateOutputWordBadge(this.modeOutputs[cleanMode]);
        this.refreshRevisionDropdownUI();
        this.refreshAnalyticsFooterBar();
      }

      if (strText.trim() && (meta?.notifyNew !== false)) {
        const banner = document.getElementById('tab3-new-output-alert-banner');
        const bannerText = document.getElementById('tab3-new-output-alert-text');
        const desc = TAB3_MODE_DESCRIPTORS[cleanMode]?.shortLabel || cleanMode;
        const wc = this.utils.countVietnameseWords(strText);
        const tr = (s) => (window.NoirStudio?.i18n?.translateText ? window.NoirStudio.i18n.translateText(String(s || '')) : String(s || ''));
        const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
        if (bannerText) {
          bannerText.textContent = tr(`Đã chạy xong "${tr(desc)}" (${fmtNum(wc)} từ)! Bản mới nhất đã nạp sẵn bên dưới — hoặc chọn từ 🕒 Lịch sử đầu ra góc dưới.`);
        }
        if (banner) {
          banner.classList.remove('hidden');
        }
      }
    }

    /**
     * Lấy nội dung văn bản của chế độ đang mở hiện tại tại Tab 3
     */
    getCurrentModeText() {
      if (this.activeMode === 'MODE_5_DIAGRAM') {
        const reportEl = document.getElementById('mode5-chronicle-report');
        return reportEl?.textContent || this.modeOutputs.MODE_5_DIAGRAM || '';
      }
      const outTextarea = document.getElementById('s20-quad-output-textarea');
      return outTextarea ? outTextarea.value : this.modeOutputs[this.activeMode] || '';
    }

    /**
     * Cập nhật huy hiệu hiển thị số từ (#tab3-output-word-badge) trên thanh trên cùng Tab 3
     */
    updateOutputWordBadge(text) {
      const badge = document.getElementById('tab3-output-word-badge');
      if (!badge) return;
      const w = this.utils.countVietnameseWords(text || '');
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      badge.dataset.i18nIgnore = '1';
      badge.textContent = tr(`${fmtNum(w)} từ`);
    }

    /**
     * Cập nhật các chỉ số phân tích chất lượng văn học dưới chân cửa sổ đầu ra Tab 3
     */
    refreshAnalyticsFooterBar() {
      const text = this.getCurrentModeText();
      const metrics = this.qualityAnalyzer.analyzeOutputText(text);
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));

      const elPara = document.getElementById('mod17-stat-paragraphs');
      const elDial = document.getElementById('mod17-stat-dialogue');
      const elRead = document.getElementById('mod17-stat-readtime');
      const elRhythm = document.getElementById('mod17-stat-rhythm');

      if (elPara) {
        elPara.dataset.i18nIgnore = '1';
        elPara.textContent = fmtNum(metrics.paragraphCount);
      }
      if (elDial) {
        elDial.dataset.i18nIgnore = '1';
        elDial.textContent = tr(`${metrics.standardDialogueCount}/${metrics.dialogueLineCount} câu (${metrics.dialogueRatioPercent}%)`);
      }
      if (elRead) {
        elRead.dataset.i18nIgnore = '1';
        elRead.textContent = tr(`~${metrics.readingMinutes} phút`);
      }
      if (elRhythm) {
        elRhythm.dataset.i18nIgnore = '1';
        if (metrics.detectedCliches.length > 0) {
          elRhythm.className = 'text-amber-400 font-bold hidden sm:inline';
          elRhythm.textContent = tr(`⚠️ Có ${metrics.detectedCliches.length} cụm từ cần gọt`);
        } else {
          elRhythm.className = 'text-indigo-300 hidden sm:inline';
          elRhythm.textContent = tr(`Nhịp văn: ${metrics.rhythmLabel}`);
        }
      }
    }

    /**
     * Cập nhật danh sách thả xuống Lịch sử các lần chạy AI của chế độ đang mở
     */
    refreshRevisionDropdownUI() {
      const revSelect = document.getElementById('mod17-select-mode-revision');
      if (!revSelect) return;
      const list = this.revisionVault.getRevisionsForMode(this.activeMode);
      const trRev = (s) =>
        window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || '');
      const headerLabel = trRev(`🕒 Lịch sử đầu ra chế độ này (${list.length})`);

      const optionsHtml = [
        `<option value="">${this.utils.escapeHtml(headerLabel)}</option>`,
        ...list.map((rev, idx) => {
          const timeStr = this.utils.formatTimestampVN(rev.timestamp);
          const label = `#${idx + 1} (${rev.wordCount} từ — ${timeStr}): ${rev.preview.slice(
            0,
            40
          )}...`;
          return `<option value="${this.utils.escapeHtml(rev.id)}">${this.utils.escapeHtml(
            label
          )}</option>`;
        })
      ].join('');

      revSelect.innerHTML = optionsHtml;
    }

    /**
     * Khôi phục một phiên bản đầu ra trước đó của chế độ hiện tại
     */
    restoreModeRevision(modeKey, revId) {
      const targetRev = this.revisionVault.getRevisionById(modeKey, revId);
      if (!targetRev) return;

      // Lưu bản hiện tại vào kho trước khi đổi sang bản cũ để không mất dữ liệu
      const currentText = this.getCurrentModeText();
      if (currentText && currentText.trim()) {
        this.revisionVault.pushRevision(modeKey, currentText, 'AUTO_SAVE_BEFORE_RESTORE');
      }

      this.modeOutputs[modeKey] = targetRev.text;
      this.persistOutputs();

      const outTextarea = document.getElementById('s20-quad-output-textarea');
      if (outTextarea && this.activeMode === modeKey) {
        outTextarea.value = targetRev.text;
      }
      window.NoirStudio?.tab3RichBridge?.syncFromPlainOutput?.(modeKey, targetRev.text);
      this.updateOutputWordBadge(targetRev.text);
      this.refreshRevisionDropdownUI();
      this.refreshAnalyticsFooterBar();

      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      this.utils.showToast(
        `↺ Đã khôi phục bản đầu ra (${fmtNum(targetRev.wordCount)} từ) vào cửa sổ Tab 3!`,
        'success'
      );
    }

    /**
     * Chuẩn hóa nhanh định dạng câu thoại "- Câu thoại (Tên nhân vật)" và ngắt đoạn
     * cho văn bản đang mở tại Tab 3
     */
    normalizeCurrentOutputFormatting() {
      const raw = this.getCurrentModeText();
      if (!raw.trim()) {
        this.utils.showToast('⚠️ Cửa sổ đầu ra đang trống!', 'warning');
        return;
      }
      const normalized =
        this.qualityAnalyzer.normalizeDialogueAndParagraphFormatting(raw);
      this.setOutputForMode(this.activeMode, normalized);
      this.utils.showToast(
        '✨ Đã chuẩn hóa dấu gạch ngang hội thoại và khoảng cách đoạn văn!',
        'success'
      );
    }

    /**
     * Nút "📥 Chèn nối tiếp" (#btn-tab3-append-to-manuscript):
     * Đưa toàn bộ đầu ra hiện tại (hoặc đoạn văn đang được tác giả bôi đen trong ô đầu ra)
     * nối tiếp vào cuối Bản thảo Chính tại Tab 1 kèm đánh dấu màu AI để tác giả duyệt!
     */
    async appendCurrentOutputToManuscript() {
      const selectedSnippet = this.bibleBridge.getSelectedTextInOutputBox();
      const text = selectedSnippet || this.getCurrentModeText();
      if (!text.trim()) {
        this.utils.showToast('⚠️ Cửa sổ đầu ra đang trống!', 'warning');
        return;
      }
      await this.aiDiff.applyAIOutputToManuscriptWithDiff(text, 'APPEND');
    }

    /**
     * Nút "🔄 Thay thế" (#btn-tab3-replace-manuscript):
     * Thay thế nội dung Bản thảo Chính tại Tab 1 bằng đầu ra AI hiện tại
     * (Tự động lưu 1 mốc lịch sử phiên bản tại Tab 6 và bật giao diện đánh dấu màu AI tại Tab 1!)
     */
    async replaceManuscriptWithCurrentOutput() {
      const text = this.getCurrentModeText();
      if (!text.trim()) {
        this.utils.showToast('⚠️ Cửa sổ đầu ra đang trống!', 'warning');
        return;
      }
      const tr17 = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      if (
        !window.confirm(
          tr17(
            'Bạn muốn thay thế nội dung bản thảo hiện tại bằng đầu ra AI này?\n(Hệ thống sẽ tự động lưu 1 mốc phiên bản cũ tại Tab 6 và hiển thị màu đánh dấu AI tại Tab 1 để bạn duyệt!)'
          )
        )
      ) {
        return;
      }
      await this.aiDiff.applyAIOutputToManuscriptWithDiff(text, 'REPLACE');
    }

    /**
     * Nút "📋 Sao chép" (#btn-tab3-copy-output):
     * Sao chép toàn bộ nội dung đầu ra (hoặc đoạn đang bôi đen) vào khay nhớ tạm
     */
    async copyCurrentOutput() {
      const selectedSnippet = this.bibleBridge.getSelectedTextInOutputBox();
      const text = selectedSnippet || this.getCurrentModeText();
      if (!text.trim()) {
        this.utils.showToast('⚠️ Chưa có nội dung đầu ra để sao chép.', 'warning');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        this.utils.showToast(
          selectedSnippet
            ? '📋 Đã sao chép đoạn văn bạn chọn vào khay nhớ tạm!'
            : '📋 Đã sao chép toàn bộ nội dung đầu ra vào khay nhớ tạm!',
          'success'
        );
      } catch (_) {
        this.utils.showToast('📋 Đã sao chép nội dung!', 'success');
      }
    }

    /**
     * Nút "📚 Lưu vào Bible" (#btn-tab3-save-to-bible):
     * Lưu nội dung đầu ra hiện tại (hoặc đoạn văn đang bôi đen) vào Hồ sơ Story Bible tại Tab 4
     */
    async saveCurrentOutputToStoryBible() {
      const selectedSnippet = this.bibleBridge.getSelectedTextInOutputBox();
      const text = selectedSnippet || this.getCurrentModeText();
      if (!text.trim()) {
        this.utils.showToast(
          '⚠️ Chưa có nội dung đầu ra để lưu vào Story Bible.',
          'warning'
        );
        return;
      }

      const renEl = document.getElementById('textarea-rendered-bible-content');
      if (renEl) {
        const activeChap = this.chapterMgr?.getActiveChapter?.();
        const formattedBlock = this.bibleBridge.formatStructuredBibleEntry(
          this.activeMode,
          text,
          activeChap?.displayTitle || activeChap?.title || ''
        );

        renEl.value = (renEl.value ? renEl.value.trim() + '\n\n' : '') + formattedBlock;
        if (this.storyBible && typeof this.storyBible.saveAllBibleData === 'function') {
          await this.storyBible.saveAllBibleData(true);
        }
      }
    }

    /**
     * Nút "🗑️ Xóa" (#btn-tab3-clear-output):
     * Xóa trắng cửa sổ đầu ra của chế độ đang mở (sau khi đã lưu bản dự phòng vào lịch sử chế độ)
     */
    clearCurrentOutput() {
      const text = this.getCurrentModeText();
      if (!text.trim()) return;
      const tr17 = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      if (!window.confirm(tr17('Xóa trắng nội dung cửa sổ đầu ra của chế độ đang mở?'))) return;

      // Lưu dự phòng vào lịch sử chế độ trước khi xóa trắng
      this.revisionVault.pushRevision(this.activeMode, text, 'SAVED_BEFORE_CLEAR');

      this.setOutputForMode(this.activeMode, '');
      this.utils.showToast(
        '🗑️ Đã xóa trắng cửa sổ đầu ra (Bạn vẫn có thể khôi phục từ ô Lịch sử đầu ra bên dưới).',
        'info'
      );
    }

    /**
     * Xuất nội dung đầu ra của chế độ đang mở thành file .TXT hoặc .MD
     */
    exportCurrentOutputAsFile(format = 'txt') {
      const text = this.getCurrentModeText();
      if (!text.trim()) {
        this.utils.showToast('⚠️ Cửa sổ đầu ra đang trống, chưa có nội dung để tải về!', 'warning');
        return;
      }
      const ext = format === 'md' ? 'md' : 'txt';
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dau_Ra_${this.activeMode}_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.utils.showToast(
        `💾 Đã tải xuống tệp đầu ra ${this.activeMode} (.${ext.toUpperCase()})!`,
        'success'
      );
    }

    /**
     * Xuất toàn bộ nội dung của cả 5 Chế độ tại Tab 3 thành 1 hồ sơ tổng hợp duy nhất
     */
    exportAllFiveModesBundle() {
      const sections = Object.keys(TAB3_MODE_DESCRIPTORS).map((modeKey) => {
        const desc = TAB3_MODE_DESCRIPTORS[modeKey];
        const content = (this.modeOutputs[modeKey] || '').trim() || '(Chưa có nội dung)';
        return [
          `####################################################################`,
          `${desc.fullTitle}`,
          `####################################################################`,
          content,
          ``
        ].join('\n');
      });

      const bundleText = sections.join('\n');
      const blob = new Blob([bundleText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ho_So_5_Che_Do_AI_Tab3_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.utils.showToast(
        '📦 Đã xuất trọn bộ hồ sơ đầu ra của cả 5 Chế độ AI tại Tab 3!',
        'success'
      );
    }

    /**
     * Tìm kiếm từ khóa bên trong cửa sổ đầu ra #s20-quad-output-textarea
     * và cuộn tới vị trí khớp tiếp theo
     */
    findNextInCurrentOutput(keyword) {
      const query = String(keyword || this.searchQuery || '').trim();
      if (!query) return false;
      this.searchQuery = query;

      const outTextarea = document.getElementById('s20-quad-output-textarea');
      if (!outTextarea || !outTextarea.value) return false;

      const lowerText = outTextarea.value.toLowerCase();
      const lowerQuery = query.toLowerCase();
      let idx = lowerText.indexOf(lowerQuery, this.lastSearchMatchIndex + 1);
      if (idx === -1) {
        idx = lowerText.indexOf(lowerQuery, 0);
      }
      if (idx === -1) {
        this.utils.showToast(`🔍 Không tìm thấy "${query}" trong đầu ra hiện tại.`, 'info');
        return false;
      }

      this.lastSearchMatchIndex = idx;
      outTextarea.focus();
      outTextarea.setSelectionRange(idx, idx + query.length);
      return true;
    }

    /**
     * So sánh nhanh 2 chế độ đầu ra (ví dụ: so sánh Bản thảo Chế độ 1 với Bản đã gọt văn ở Chế độ 4)
     */
    compareTwoModesSummary(modeA = 'MODE_1_DRAFT', modeB = 'MODE_4_REVIEW') {
      const textA = this.modeOutputs[modeA] || '';
      const textB = this.modeOutputs[modeB] || '';
      const metricsA = this.qualityAnalyzer.analyzeOutputText(textA);
      const metricsB = this.qualityAnalyzer.analyzeOutputText(textB);

      return {
        modeA: {
          key: modeA,
          title: TAB3_MODE_DESCRIPTORS[modeA]?.shortLabel || modeA,
          metrics: metricsA
        },
        modeB: {
          key: modeB,
          title: TAB3_MODE_DESCRIPTORS[modeB]?.shortLabel || modeB,
          metrics: metricsB
        },
        wordDelta: metricsB.wordCount - metricsA.wordCount,
        clicheReduction:
          metricsA.detectedCliches.length - metricsB.detectedCliches.length,
        dialogueStandardGain:
          metricsB.standardDialogueCount - metricsA.standardDialogueCount
      };
    }

    /**
     * Trả về báo cáo trạng thái tổng thể của cả 5 Chế độ tại Tab 3
     */
    getAllModesOverviewDigest() {
      const overview = {};
      let totalWordsAllModes = 0;

      Object.keys(this.modeOutputs).forEach((modeKey) => {
        const txt = this.modeOutputs[modeKey] || '';
        const w = this.utils.countVietnameseWords(txt);
        totalWordsAllModes += w;
        overview[modeKey] = {
          modeKey,
          label: TAB3_MODE_DESCRIPTORS[modeKey]?.shortLabel || modeKey,
          wordCount: w,
          revisionCount: this.revisionVault.getRevisionsForMode(modeKey).length,
          hasContent: w > 0
        };
      });

      return {
        activeMode: this.activeMode,
        totalWordsAllModes,
        modes: overview
      };
    }
  }

  // ==========================================================================
  // PHẦN 6: BỘ TRỢ LÝ SO SÁNH & CHUYỂN ĐỔI ĐOẠN VĂN GIỮA CÁC CHẾ ĐỘ TAB 3
  //         (Tab3CrossModeWorkflowHelper)
  // ==========================================================================
  class Tab3CrossModeWorkflowHelper {
    constructor(controller) {
      this.controller = controller;
    }

    /**
     * Chuyển nhanh văn bản từ Chế độ 1 (Bản thảo nháp) sang làm đầu vào cho
     * Chế độ 3 (Thanh tra Logic) hoặc Chế độ 4 (Biên tập & Gọt văn chống sáo rỗng)
     */
    sendCurrentModeOutputToCommandForMode(targetModeKey = 'MODE_4_REVIEW') {
      const sourceText = this.controller.getCurrentModeText();
      if (!sourceText.trim()) {
        this.controller.utils.showToast(
          '⚠️ Cửa sổ đầu ra hiện tại đang trống, chưa có văn bản để chuyển tiếp!',
          'warning'
        );
        return false;
      }

      const modeInstructions = {
        MODE_3_AUDIT:
          'Hãy thanh tra kỹ lưỡng đoạn bản thảo dưới đây, đối chiếu với Story Bible, Ma trận Ai Biết Gì và Dòng thời gian để tìm mọi điểm mâu thuẫn:',
        MODE_4_REVIEW:
          'Hãy biên tập chuyên sâu đoạn bản thảo dưới đây, loại bỏ 100% từ cấm sáo rỗng (Anti-Cliché), làm giàu miêu tả tâm lý và chuẩn hóa mọi câu thoại về "- Câu thoại (Tên nhân vật)":',
        MODE_2_BRAINSTORM:
          'Dựa trên đoạn bản thảo dưới đây, hãy đề xuất 3 hướng phát triển tình tiết tiếp theo thật bất ngờ và kịch tính:'
      };

      const prefix =
        modeInstructions[targetModeKey] || modeInstructions.MODE_4_REVIEW;
      const composedPrompt = `${prefix}\n\n"""\n${sourceText.trim()}\n"""`;

      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      if (promptBox) {
        promptBox.value = composedPrompt;
        promptBox.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        try {
          localStorage.setItem('noir_v36_last_command_prompt', composedPrompt);
        } catch (_) {}
      }

      const modeSelect = document.getElementById('select-ai-execution-mode');
      if (modeSelect) {
        modeSelect.value = targetModeKey;
        modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const router = window.NoirStudio?.geminiRouter;
      router?.populateAllModelDropdowns?.();
      router?.syncThinkingLevelControlsDOM?.();
      router?.quotaTracker?.renderRealtimeQuotaWidget?.();

      document
        .getElementById('modal-fullscreen-ai-command')
        ?.classList.remove('hidden');

      this.controller.utils.showToast(
        `🚀 Đã nạp văn bản vào Cửa sổ điều khiển AI (${targetModeKey})! Bạn có thể bấm "Chạy Prompt Tổng Hợp" ngay.`,
        'info',
        3600
      );
      return true;
    }

    /**
     * Tách riêng các câu thoại trong đầu ra hiện tại để tác giả kiểm tra nhịp điệu đối thoại
     * và giọng nói riêng của từng nhân vật (Character Voice Check)
     */
    extractDialogueScriptFromCurrentOutput() {
      const raw = this.controller.getCurrentModeText();
      if (!raw.trim()) {
        return {
          totalDialogueLines: 0,
          speakersMap: {},
          formattedScript: ''
        };
      }

      const lines = raw
        .split(/\r?\n+/)
        .map((l) => l.trim())
        .filter((l) => /^[-–—]\s+/.test(l));

      const speakersMap = {};
      const scriptLines = lines.map((line, idx) => {
        const speakerMatch = line.match(/\(([^)]+)\)\s*$/);
        const speaker = speakerMatch ? speakerMatch[1].trim() : 'Chưa ghi tên';
        speakersMap[speaker] = (speakersMap[speaker] || 0) + 1;
        return `${idx + 1}. [${speaker}]: ${line}`;
      });

      return {
        totalDialogueLines: lines.length,
        speakersMap,
        formattedScript: scriptLines.join('\n')
      };
    }

    /**
     * Kiểm tra tính toàn vẹn của toàn bộ thành phần DOM tại Tab 3
     */
    verifyTab3DomIntegrity() {
      const requiredIds = [
        'tab3-unified-output-topbar',
        's20-quad-tab-selector',
        'tab3-output-word-badge',
        'btn-tab3-append-to-manuscript',
        'btn-tab3-replace-manuscript',
        'btn-tab3-copy-output',
        'btn-tab3-open-mode-prompts',
        'btn-tab3-save-to-bible',
        'btn-tab3-clear-output',
        'tab3-standard-output-wrapper',
        's20-quad-output-textarea',
        'mode5-plot-diagram-studio'
      ];

      const missingIds = requiredIds.filter((id) => !document.getElementById(id));
      return {
        allMounted: missingIds.length === 0,
        missingIds,
        activeMode: this.controller.activeMode
      };
    }
  }

  // ==========================================================================
  // PHẦN 7: BỘ HỢP NHẤT PHẪU THUẬT TỪNG ĐOẠN & KHỬ TRÙNG LẶP NỐI MẠCH
  //         (Tab3ParagraphByParagraphSurgicalMerger)
  // ==========================================================================
  class Tab3ParagraphByParagraphSurgicalMerger {
    constructor(controller) {
      this.controller = controller;
    }

    /**
     * Tách văn bản đầu ra hiện tại tại Tab 3 thành danh sách các khối đoạn văn
     * kèm phân loại (NARRATION, DIALOGUE, HEADING, SCENE_BREAK) để xử lý chính xác.
     */
    parseOutputIntoBlocks(rawText) {
      const text = String(rawText || this.controller.getCurrentModeText() || '').trim();
      if (!text) return [];

      const rawParagraphs = text
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      return rawParagraphs.map((para, idx) => {
        let blockType = 'NARRATION';
        let speaker = null;

        if (/^[-–—]\s+/.test(para)) {
          blockType = 'DIALOGUE';
          const spMatch = para.match(/\(([^)]+)\)\s*$/);
          if (spMatch) speaker = spMatch[1].trim();
        } else if (/^(===|###|\*\*\*|---)/.test(para)) {
          blockType = 'SCENE_BREAK';
        } else if (/^(Chương|CHƯƠNG|Cảnh|CẢNH|Mốc|MỐC)\s+\d+/i.test(para) && para.length < 90) {
          blockType = 'HEADING';
        }

        const words = this.controller.utils.countVietnameseWords(para);
        return {
          index: idx,
          id: `tab3_blk_${idx}`,
          type: blockType,
          speaker,
          wordCount: words,
          text: para
        };
      });
    }

    /**
     * Khử trùng lặp câu nối mạch (Overlap De-duplication):
     * Khi AI viết nối tiếp đoạn cuối của bản thảo, đôi khi AI chép lại 1-2 câu cuối
     * của bản thảo cũ ở đầu câu trả lời. Hàm này tự động phát hiện và cắt bỏ phần
     * bị lặp ở đầu đầu ra AI để khi bấm "📥 Chèn nối tiếp", mạch văn liền lạc 100%!
     */
    stripLeadingOverlapWithManuscript(manuscriptText, aiOutputText) {
      const msClean = String(manuscriptText || '').trim();
      const aiClean = String(aiOutputText || '').trim();
      if (!msClean || !aiClean) {
        return {
          cleanedText: aiClean,
          overlapRemoved: false,
          removedCharsCount: 0
        };
      }

      const msParagraphs = msClean
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      const aiParagraphs = aiClean
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (msParagraphs.length === 0 || aiParagraphs.length === 0) {
        return {
          cleanedText: aiClean,
          overlapRemoved: false,
          removedCharsCount: 0
        };
      }

      const lastMsPara = msParagraphs[msParagraphs.length - 1];
      const secondLastMsPara =
        msParagraphs.length > 1 ? msParagraphs[msParagraphs.length - 2] : '';

      let stripCount = 0;
      if (
        secondLastMsPara &&
        aiParagraphs.length >= 2 &&
        this.isParagraphNearlyIdentical(aiParagraphs[0], secondLastMsPara) &&
        this.isParagraphNearlyIdentical(aiParagraphs[1], lastMsPara)
      ) {
        stripCount = 2;
      } else if (this.isParagraphNearlyIdentical(aiParagraphs[0], lastMsPara)) {
        stripCount = 1;
      }

      if (stripCount > 0 && aiParagraphs.length > stripCount) {
        const remaining = aiParagraphs.slice(stripCount).join('\n\n');
        return {
          cleanedText: remaining,
          overlapRemoved: true,
          removedCharsCount: aiClean.length - remaining.length
        };
      }

      return {
        cleanedText: aiClean,
        overlapRemoved: false,
        removedCharsCount: 0
      };
    }

    /**
     * Kiểm tra 2 đoạn văn có trùng khớp từ 90% trở lên không (bỏ qua khoảng trắng thừa)
     */
    isParagraphNearlyIdentical(paraA, paraB) {
      const normA = String(paraA || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      const normB = String(paraB || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      if (!normA || !normB) return false;
      if (normA === normB) return true;
      if (normA.length > 40 && normB.includes(normA)) return true;
      if (normB.length > 40 && normA.includes(normB)) return true;
      return false;
    }

    /**
     * Chèn một tập hợp các đoạn văn được chọn theo chỉ số (blockIndices)
     * từ cửa sổ đầu ra Tab 3 sang cuối Bản thảo Chính tại Tab 1
     */
    async appendSelectedBlocksToManuscript(blockIndices = []) {
      const allBlocks = this.parseOutputIntoBlocks();
      if (allBlocks.length === 0) {
        this.controller.utils.showToast('⚠️ Cửa sổ đầu ra đang trống!', 'warning');
        return false;
      }

      const indexSet = new Set(blockIndices);
      const chosen =
        indexSet.size > 0
          ? allBlocks.filter((b) => indexSet.has(b.index))
          : allBlocks;

      if (chosen.length === 0) return false;

      const joinedText = chosen.map((b) => b.text).join('\n\n');
      await this.controller.aiDiff?.applyAIOutputToManuscriptWithDiff?.(
        joinedText,
        'APPEND'
      );
      return true;
    }

    /**
     * Chèn đầu ra hiện tại vào đúng vị trí con trỏ đang đứng trong #textarea-chapter-content
     */
    async insertOutputAtEditorCursor(snippetText = '') {
      const textToInsert = String(
        snippetText ||
          this.controller.bibleBridge.getSelectedTextInOutputBox() ||
          this.controller.getCurrentModeText() ||
          ''
      ).trim();

      if (!textToInsert) {
        this.controller.utils.showToast(
          '⚠️ Chưa có văn bản đầu ra để chèn vào vị trí con trỏ.',
          'warning'
        );
        return false;
      }

      const editor = document.getElementById('textarea-chapter-content');
      if (!editor) {
        await this.controller.appendCurrentOutputToManuscript();
        return true;
      }

      const start =
        typeof editor.selectionStart === 'number'
          ? editor.selectionStart
          : editor.value.length;
      const end =
        typeof editor.selectionEnd === 'number' ? editor.selectionEnd : start;

      const before = editor.value.slice(0, start);
      const after = editor.value.slice(end);
      const prefixNewline = before && !before.endsWith('\n') ? '\n\n' : '';
      const suffixNewline = after && !after.startsWith('\n') ? '\n\n' : '';

      editor.value = `${before}${prefixNewline}${textToInsert}${suffixNewline}${after}`;
      editor.dispatchEvent(new Event('input', { bubbles: true }));

      window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_1_WRITE');
      this.controller.utils.showToast(
        '✍️ Đã chèn văn bản vào đúng vị trí con trỏ tại Bản thảo Tab 1!',
        'success'
      );
      return true;
    }
  }

  // ==========================================================================
  // PHẦN 8: BỘ QUÉT & GỢI Ý THAY THẾ TỪ SÁO RỖNG (ANTI-CLICHÉ SURGICAL CLEANER)
  //         (Tab3AntiClicheSurgicalCleaner)
  // ==========================================================================
  const BUILTIN_CLICHE_REPLACEMENT_SUGGESTIONS = {
    'một luồng điện chạy dọc sống lưng': [
      'các đốt sống lưng chợt căng cứng lại như phản xạ trước hiểm nguy',
      'hơi lạnh từ gáy lan nhanh xuống tận đầu ngón tay',
      'nhịp tim trật đi một nhịp, để lại khoảng rỗng lạnh buốt trong lồng ngực'
    ],
    'thở dài một tiếng': [
      'buông nhẹ hơi thở nặng nhọc qua kẽ răng',
      'hạ thấp bờ vai đang căng cứng, im lặng nhìn ra khoảng tối',
      'khẽ cụp mắt xuống, nén lại tiếng thở trầm đục'
    ],
    'ánh mắt phức tạp': [
      'ánh nhìn vừa thăm dò vừa như muốn giấu đi một nỗi day dứt cũ',
      'đồng tử khẽ co lại, đan xen giữa sự hoài nghi và chút xót xa hiếm hoi',
      'cái nhìn dừng lại rất lâu trên gương mặt đối phương nhưng không nói thành lời'
    ],
    'khẽ nhếch môi tạo thành một vòng cung': [
      'khóe môi chỉ hơi nhướng lên mà không hề chạm tới đáy mắt',
      'nở một nụ cười nhạt lạnh lùng như đã đoán trước kết cục',
      'gương mặt giữ nguyên vẻ bình thản, chỉ có khóe miệng thoáng nét giễu cợt'
    ],
    'không khỏi cảm thán trong lòng': [
      'thầm thừa nhận sự thật phũ phàng ấy trong im lặng',
      'bất giác nhận ra mọi tính toán từ đầu đều đã lệch đi một nước cờ',
      'lặng người đi vài giây trước sự trùng hợp đến rợn người'
    ],
    'trong lòng dâng lên một cảm giác khó tả': [
      'một nỗi bất an mơ hồ cứ âm ỉ lớn dần dưới lớp vỏ bình tĩnh',
      'ký ức cũ và thực tại trước mắt va vào nhau khiến ngực anh thắt lại',
      'cảm giác xa lạ len lỏi vào từng suy nghĩ vốn luôn rạch ròi'
    ],
    'bầu không khí bỗng trở nên tĩnh lặng đến đáng sợ': [
      'căn phòng chìm vào sự im ắng đặc quánh, chỉ còn nghe rõ tiếng kim đồng hồ gõ nhịp',
      'không ai nói thêm lời nào, khoảng lặng giữa hai người căng như dây đàn sắp đứt',
      'mọi âm thanh ngoài hành lang như lùi xa, để lại sự tĩnh mịch lạnh ngắt'
    ],
    'nụ cười nửa miệng đầy ẩn ý': [
      'nụ cười thoáng qua rất nhanh như đang giữ lại một quân bài tẩy',
      'khóe môi khẽ cong lên với vẻ điềm nhiên của kẻ nắm đằng chuôi',
      'ánh cười kín đáo khiến người đối diện không sao đoán nổi ý định thật sự'
    ]
  };

  class Tab3AntiClicheSurgicalCleaner {
    constructor(controller) {
      this.controller = controller;
    }

    /**
     * Quét toàn bộ văn bản đầu ra hiện tại tại Tab 3 để tìm các cụm từ nằm trong
     * danh sách cấm Anti-Cliché và đính kèm phương án viết lại giàu hình ảnh.
     */
    scanCurrentOutputForCliches() {
      const text = this.controller.getCurrentModeText();
      if (!text.trim()) {
        return {
          totalHits: 0,
          findings: []
        };
      }

      const customList = Array.isArray(this.controller.storyBible?.antiClicheList)
        ? this.controller.storyBible.antiClicheList
        : [];
      const mergedPhrases = [
        ...new Set([
          ...Object.keys(BUILTIN_CLICHE_REPLACEMENT_SUGGESTIONS),
          ...customList.map((p) => String(p || '').trim())
        ])
      ].filter(Boolean);

      const lowerText = text.toLowerCase();
      const findings = [];

      mergedPhrases.forEach((phrase) => {
        const lowerPhrase = phrase.toLowerCase();
        let searchPos = 0;
        const occurrences = [];

        while (searchPos < lowerText.length) {
          const foundIdx = lowerText.indexOf(lowerPhrase, searchPos);
          if (foundIdx === -1) break;
          occurrences.push({
            index: foundIdx,
            excerpt: text.slice(
              Math.max(0, foundIdx - 35),
              Math.min(text.length, foundIdx + phrase.length + 35)
            )
          });
          searchPos = foundIdx + lowerPhrase.length;
        }

        if (occurrences.length > 0) {
          const suggestions = BUILTIN_CLICHE_REPLACEMENT_SUGGESTIONS[lowerPhrase] || [
            'Thay bằng miêu tả hành động cơ thể hoặc chi tiết giác quan cụ thể',
            'Thể hiện tâm lý nhân vật qua nhịp đối thoại hoặc ánh nhìn thay vì kể trực tiếp'
          ];
          findings.push({
            phrase,
            count: occurrences.length,
            occurrences,
            suggestions
          });
        }
      });

      return {
        totalHits: findings.reduce((acc, f) => acc + f.count, 0),
        findings
      };
    }

    /**
     * Tự động thay thế các cụm từ sáo rỗng bị phát hiện bằng các phương án miêu tả
     * giàu hình ảnh, đa dạng hóa luân phiên để không bị lặp câu.
     */
    autoCleanDetectedClichesInCurrentOutput() {
      let text = this.controller.getCurrentModeText();
      if (!text.trim()) {
        this.controller.utils.showToast('⚠️ Cửa sổ đầu ra đang trống!', 'warning');
        return { replacedCount: 0 };
      }

      const scan = this.scanCurrentOutputForCliches();
      if (scan.totalHits === 0) {
        this.controller.utils.showToast(
          '✅ Tuyệt vời! Đầu ra hiện tại hoàn toàn sạch bóng từ ngữ sáo rỗng (Anti-Cliché 100%).',
          'success'
        );
        return { replacedCount: 0 };
      }

      let replacedCount = 0;
      scan.findings.forEach((item) => {
        const suggestions = item.suggestions;
        if (!Array.isArray(suggestions) || suggestions.length === 0) return;

        const escaped = item.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        let localIdx = 0;

        text = text.replace(regex, (matched) => {
          const replacement = suggestions[localIdx % suggestions.length];
          localIdx += 1;
          replacedCount += 1;
          // Giữ chữ hoa đầu câu nếu cụm gốc viết hoa chữ cái đầu
          if (
            matched[0] &&
            matched[0] === matched[0].toUpperCase() &&
            matched[0] !== matched[0].toLowerCase()
          ) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
          }
          return replacement;
        });
      });

      if (replacedCount > 0) {
        this.controller.setOutputForMode(this.controller.activeMode, text);
        this.controller.utils.showToast(
          `✨ Đã tự động gọt và thay thế ${replacedCount} cụm từ sáo rỗng bằng miêu tả giàu hình ảnh!`,
          'success',
          4000
        );
      }

      return { replacedCount };
    }
  }

  // ==========================================================================
  // PHẦN 9: BỘ ĐỐI CHIẾU SONG SONG & ĐO ĐỘ PHONG PHÚ TỪ VỰNG TIẾNG VIỆT
  //         (Tab3SplitViewComparisonAndLexicalEngine)
  // ==========================================================================
  class Tab3SplitViewComparisonAndLexicalEngine {
    constructor(controller) {
      this.controller = controller;
    }

    /**
     * Tính toán Độ Phong Phú Từ Vựng (Lexical Diversity / Type-Token Ratio)
     * và phân bố độ dài câu của văn bản đầu ra tại Tab 3
     */
    computeLexicalRichnessProfile(rawText) {
      const text = String(rawText || this.controller.getCurrentModeText() || '').trim();
      if (!text) {
        return {
          totalWords: 0,
          uniqueWords: 0,
          lexicalDiversityRatio: 0,
          sentenceLengthDistribution: { short: 0, medium: 0, long: 0 },
          topRepeatedWords: []
        };
      }

      const tokens = text
        .toLowerCase()
        .replace(/[.,!?;:"'()[\]{}«»“”‘’—–\-…/\\]+/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1);

      const totalWords = tokens.length;
      const freqMap = {};
      tokens.forEach((t) => {
        freqMap[t] = (freqMap[t] || 0) + 1;
      });

      const uniqueWords = Object.keys(freqMap).length;
      const lexicalDiversityRatio =
        totalWords > 0 ? Math.round((uniqueWords / totalWords) * 1000) / 10 : 0;

      // Từ dừng cơ bản trong tiếng Việt để lọc ra các từ thực sự có ý nghĩa khi thống kê từ lặp
      const stopWords = new Set([
        'những',
        'không',
        'trong',
        'được',
        'người',
        'mình',
        'chúng',
        'nhưng',
        'đang',
        'cũng',
        'rằng',
        'phải',
        'chưa',
        'cùng',
        'trên',
        'dưới',
        'ngoài',
        'giữa',
        'theo',
        'từng',
        'nhiều',
        'hơn',
        'nhất'
      ]);

      const topRepeatedWords = Object.entries(freqMap)
        .filter(([word, count]) => word.length >= 4 && count >= 3 && !stopWords.has(word))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([word, count]) => ({ word, count }));

      const sentences = text
        .split(/[.!?…]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const sentenceLengthDistribution = {
        short: 0, // < 10 từ
        medium: 0, // 10 - 25 từ
        long: 0 // > 25 từ
      };

      sentences.forEach((s) => {
        const wc = s.split(/\s+/).filter(Boolean).length;
        if (wc < 10) sentenceLengthDistribution.short += 1;
        else if (wc <= 25) sentenceLengthDistribution.medium += 1;
        else sentenceLengthDistribution.long += 1;
      });

      return {
        totalWords,
        uniqueWords,
        lexicalDiversityRatio,
        sentenceLengthDistribution,
        topRepeatedWords
      };
    }

    /**
     * Đối chiếu từng đoạn văn giữa Bản thảo đang mở ở Tab 1 và Đầu ra ở Tab 3
     * để tác giả thấy rõ những đoạn nào được mở rộng, gọt giũa hoặc viết mới
     */
    buildParagraphAlignmentBetweenManuscriptAndTab3() {
      const activeChap = this.controller.chapterMgr?.getActiveChapter?.();
      const manuscriptText = String(activeChap?.content || '').trim();
      const tab3Text = String(this.controller.getCurrentModeText() || '').trim();

      const msParas = manuscriptText
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      const tab3Paras = tab3Text
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      const maxLen = Math.max(msParas.length, tab3Paras.length);
      const rows = [];

      for (let i = 0; i < maxLen; i += 1) {
        const left = msParas[i] || '';
        const right = tab3Paras[i] || '';
        let status = 'MODIFIED';
        if (!left && right) status = 'ADDED_IN_TAB3';
        else if (left && !right) status = 'ONLY_IN_MANUSCRIPT';
        else if (left === right) status = 'IDENTICAL';

        rows.push({
          paragraphNumber: i + 1,
          manuscriptParagraph: left,
          tab3Paragraph: right,
          status,
          wordDelta:
            this.controller.utils.countVietnameseWords(right) -
            this.controller.utils.countVietnameseWords(left)
        });
      }

      return {
        manuscriptParagraphCount: msParas.length,
        tab3ParagraphCount: tab3Paras.length,
        rows
      };
    }

    /**
     * Tạo báo cáo tóm tắt đối chiếu văn bản dễ đọc bằng tiếng Việt
     */
    buildReadableComparisonReport() {
      const alignment = this.buildParagraphAlignmentBetweenManuscriptAndTab3();
      const lexical = this.computeLexicalRichnessProfile();

      const addedCount = alignment.rows.filter(
        (r) => r.status === 'ADDED_IN_TAB3'
      ).length;
      const modifiedCount = alignment.rows.filter(
        (r) => r.status === 'MODIFIED'
      ).length;
      const identicalCount = alignment.rows.filter(
        (r) => r.status === 'IDENTICAL'
      ).length;

      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      return [
        `📊 BÁO CÁO ĐỐI CHIẾU ĐẦU RA TAB 3 & BẢN THẢO HIỆN TẠI`,
        `--------------------------------------------------------------------`,
        `• Số đoạn trong Bản thảo Tab 1 : ${alignment.manuscriptParagraphCount} đoạn`,
        `• Số đoạn trong Đầu ra Tab 3   : ${alignment.tab3ParagraphCount} đoạn`,
        `• Số đoạn viết mới / mở rộng   : ${addedCount} đoạn mới, ${modifiedCount} đoạn chỉnh sửa, ${identicalCount} đoạn giữ nguyên`,
        `• Độ đa dạng từ vựng (TTR)     : ${lexical.lexicalDiversityRatio}% (${fmtNum(lexical.uniqueWords)} từ vựng riêng biệt / ${fmtNum(lexical.totalWords)} tổng từ)`,
        `• Phân bố nhịp câu             : ${lexical.sentenceLengthDistribution.short} câu ngắn • ${lexical.sentenceLengthDistribution.medium} câu vừa • ${lexical.sentenceLengthDistribution.long} câu dài`,
        lexical.topRepeatedWords.length > 0
          ? `• Các từ xuất hiện nhiều       : ${lexical.topRepeatedWords
              .slice(0, 6)
              .map((item) => `"${item.word}" (${item.count} lần)`)
              .join(', ')}`
          : `• Độ cân bằng từ ngữ           : Rất tốt, không có từ nào lặp lại bất thường.`
      ].join('\n');
    }
  }

  // ==========================================================================
  // PHẦN 10: BỘ KIỂM TRA NHẤT QUÁN GIỌNG THOẠI & XƯNG HÔ NHÂN VẬT TẠI TAB 3
  //          (Tab3VoiceAndDialogueConsistencyInspector)
  // ==========================================================================
  class Tab3VoiceAndDialogueConsistencyInspector {
    constructor(controller) {
      this.controller = controller;
    }

    /**
     * Phân tích toàn bộ các câu thoại có định dạng "- Câu thoại (Tên nhân vật)"
     * trong cửa sổ đầu ra Tab 3 để kiểm tra:
     * 1. Những nhân vật nào đang tham gia đối thoại?
     * 2. Cách xưng hô (tôi/anh/cô/ngươi/ta/cậu/tớ/em...) của từng nhân vật có nhất quán không?
     * 3. Có câu thoại nào quên ghi "(Tên nhân vật)" ở cuối dòng không?
     */
    inspectDialogueAndPronounsInCurrentOutput() {
      const raw = this.controller.getCurrentModeText();
      if (!raw.trim()) {
        return {
          totalDialogueLines: 0,
          properlyTaggedLines: 0,
          untaggedLines: [],
          characterSpeechProfiles: {}
        };
      }

      const paragraphs = raw
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      const dialogueLines = paragraphs.filter((p) => /^[-–—]\s+/.test(p));
      const untaggedLines = [];
      const characterSpeechProfiles = {};

      const pronounCandidates = [
        'tôi',
        'ta',
        'anh',
        'em',
        'cô',
        'cậu',
        'tớ',
        'mày',
        'tao',
        'ngươi',
        'huynh',
        'muội',
        'tiểu thư',
        'ngài',
        'ông',
        'bà',
        'chú',
        'bác',
        'chị',
        'chúng ta',
        'chúng tôi'
      ];

      let properlyTaggedLines = 0;

      dialogueLines.forEach((line, idx) => {
        const match = line.match(/^[-–—]\s+(.+?)\s*\(([^)]+)\)\s*$/);
        if (!match) {
          untaggedLines.push({
            dialogueIndex: idx + 1,
            lineText: line
          });
          return;
        }

        properlyTaggedLines += 1;
        const speechBody = match[1].trim();
        const speakerName = match[2].trim();

        if (!characterSpeechProfiles[speakerName]) {
          characterSpeechProfiles[speakerName] = {
            speakerName,
            lineCount: 0,
            totalWordsSpoken: 0,
            pronounsUsed: {},
            sampleLines: []
          };
        }

        const profile = characterSpeechProfiles[speakerName];
        profile.lineCount += 1;
        const words = speechBody.split(/\s+/).filter(Boolean);
        profile.totalWordsSpoken += words.length;

        if (profile.sampleLines.length < 3) {
          profile.sampleLines.push(speechBody);
        }

        const lowerSpeech = ` ${speechBody.toLowerCase()} `;
        pronounCandidates.forEach((pr) => {
          const regex = new RegExp(`(^|[^a-zA-ZÀ-ỹ])${pr}([^a-zA-ZÀ-ỹ]|$)`, 'i');
          if (regex.test(lowerSpeech)) {
            profile.pronounsUsed[pr] = (profile.pronounsUsed[pr] || 0) + 1;
          }
        });
      });

      return {
        totalDialogueLines: dialogueLines.length,
        properlyTaggedLines,
        untaggedLines,
        characterSpeechProfiles
      };
    }

    /**
     * Tự động gán thẻ "(Chưa rõ người nói)" hoặc gợi ý tên nhân vật góc nhìn (POV)
     * cho các câu thoại bị thiếu tên người nói ở cuối câu
     */
    autoTagUntaggedDialogueLines(fallbackSpeakerName = '') {
      let text = this.controller.getCurrentModeText();
      if (!text.trim()) return { fixedCount: 0 };

      const defaultSpeaker =
        fallbackSpeakerName.trim() ||
        this.inferPrimarySpeakerFromBibleOrScene() ||
        'Nhân vật chính';

      let fixedCount = 0;
      const updatedLines = text.split('\n').map((line) => {
        const trimmed = line.trim();
        if (!/^[-–—]\s+/.test(trimmed)) return line;
        if (/\([^)]+\)\s*$/.test(trimmed)) return line;

        fixedCount += 1;
        const normalizedDash = trimmed.replace(/^[–—]\s+/, '- ');
        return `${normalizedDash} (${defaultSpeaker})`;
      });

      if (fixedCount > 0) {
        const nextText = updatedLines.join('\n');
        this.controller.setOutputForMode(this.controller.activeMode, nextText);
        this.controller.utils.showToast(
          `💬 Đã bổ sung thẻ tên nhân vật cho ${fixedCount} dòng thoại chưa gắn tên!`,
          'success'
        );
      }

      return { fixedCount, speakerApplied: defaultSpeaker };
    }

    /**
     * Suy luận tên nhân vật chính hoặc nhân vật POV hiện tại từ Mốc phân cảnh hoặc Story Bible
     */
    inferPrimarySpeakerFromBibleOrScene() {
      const markers = window.NoirStudio?.sceneBuilder?.markers || [];
      if (markers.length > 0 && markers[0].pov) {
        return String(markers[0].pov).trim();
      }
      const chars = this.controller.storyBible?.characters || [];
      if (chars.length > 0 && chars[0].name) {
        return String(chars[0].name).trim();
      }
      return 'Nhân vật chính';
    }

    /**
     * Xuất bản báo cáo kiểm tra hội thoại và xưng hô của nhân vật trong đầu ra Tab 3
     */
    buildDialogueAuditSummaryText() {
      const report = this.inspectDialogueAndPronounsInCurrentOutput();
      if (report.totalDialogueLines === 0) {
        return 'ℹ️ Văn bản đầu ra hiện tại chưa có câu thoại nào.';
      }

      const speakerEntries = Object.values(report.characterSpeechProfiles);
      const speakerLines = speakerEntries.map((sp) => {
        const pronouns = Object.entries(sp.pronounsUsed)
          .map(([k, v]) => `${k} (${v})`)
          .join(', ');
        return `  • ${sp.speakerName}: ${sp.lineCount} câu thoại (${
          sp.totalWordsSpoken
        } từ) — Xưng hô: ${pronouns || 'Tự nhiên'}`;
      });

      return [
        `💬 KIỂM TRA HỘI THOẠI & XƯNG HÔ NHÂN VẬT TẠI TAB 3:`,
        `• Tổng số dòng thoại           : ${report.totalDialogueLines} dòng`,
        `• Đạt chuẩn "- Thoại (Tên)"    : ${report.properlyTaggedLines}/${report.totalDialogueLines} dòng`,
        `• Thống kê theo nhân vật       :`,
        ...speakerLines
      ].join('\n');
    }
  }

  // ==========================================================================
  // PHẦN 11: KHỞI TẠO & XUẤT RA KHÔNG GIAN TÊN TOÀN CỤC (window.NoirStudio)
  // ==========================================================================
  window.NoirStudio.Tab3FiveModesWorkspaceController =
    Tab3FiveModesWorkspaceController;
  window.NoirStudio.Tab3OutputRevisionHistoryVault = Tab3OutputRevisionHistoryVault;
  window.NoirStudio.Tab3LiteraryQualityAndReadabilityAnalyzer =
    Tab3LiteraryQualityAndReadabilityAnalyzer;
  window.NoirStudio.Tab3SmartSelectionAndBibleBridge =
    Tab3SmartSelectionAndBibleBridge;
  window.NoirStudio.Tab3CrossModeWorkflowHelper = Tab3CrossModeWorkflowHelper;
  window.NoirStudio.Tab3ParagraphByParagraphSurgicalMerger =
    Tab3ParagraphByParagraphSurgicalMerger;
  window.NoirStudio.Tab3AntiClicheSurgicalCleaner = Tab3AntiClicheSurgicalCleaner;
  window.NoirStudio.Tab3SplitViewComparisonAndLexicalEngine =
    Tab3SplitViewComparisonAndLexicalEngine;
  window.NoirStudio.Tab3VoiceAndDialogueConsistencyInspector =
    Tab3VoiceAndDialogueConsistencyInspector;

  const tab3Controller = new Tab3FiveModesWorkspaceController(
    window.NoirStudio.idb,
    window.NoirStudio.aiDiff,
    window.NoirStudio.storyBible,
    window.NoirStudio.sysPrompts,
    window.NoirStudio.utils
  );
  tab3Controller.workflowHelper = new Tab3CrossModeWorkflowHelper(tab3Controller);
  tab3Controller.surgicalMerger = new Tab3ParagraphByParagraphSurgicalMerger(
    tab3Controller
  );
  tab3Controller.clicheCleaner = new Tab3AntiClicheSurgicalCleaner(tab3Controller);
  tab3Controller.lexicalEngine = new Tab3SplitViewComparisonAndLexicalEngine(
    tab3Controller
  );
  tab3Controller.dialogueInspector = new Tab3VoiceAndDialogueConsistencyInspector(
    tab3Controller
  );
  window.NoirStudio.tab3Controller = tab3Controller;

  // ==========================================================================
  // PHẦN 12 (v109): CỬA SỔ ĐẦU RA CHUẨN WORD + XUẤT PDF + MÃ ASCII MODE 5 + KHO ẢNH BÌA MODE 6
  // ==========================================================================
  class V109Tab3RichAsciiAndCoverManager {
    constructor(controller) {
      this.controller = controller;
      this.RICH_STORAGE_PREFIX = 'noir_v109_tab3_rich_';
      this.ASCII_STORAGE_KEY = 'noir_v109_mode5_ascii_text';
      this.COVER_META_KEY = 'noir_v109_cover_gallery_meta_v1';
      this.ACTIVE_COVER_KEY = 'noir_v109_active_cover_id_v1';
      this.USE_CUSTOM_PDF_COVER_KEY = 'noir_v109_use_custom_pdf_cover_v1';
      this.COVER_FOLDER_NAME = '06_Anh_Bia_Truyen';
      this.IDB_NAME = 'NoirNovelCoversDB_v109';
      this.IDB_STORE = 'covers';

      this.isRichMode = true;
      this._suppressRichSync = false;
      this._idbPromise = null;
      this.coversMeta = this._loadCoversMeta();
      this.activeCoverId = this._safeGetLS(this.ACTIVE_COVER_KEY) || '';
      this.coverDataUrlCache = new Map();

      this._initAll();
    }

    _safeGetLS(key) {
      try {
        return localStorage.getItem(key);
      } catch (_) {
        return null;
      }
    }

    _safeSetLS(key, val) {
      try {
        if (val === null || val === undefined) localStorage.removeItem(key);
        else localStorage.setItem(key, String(val));
      } catch (_) {}
    }

    _toast(msg, type = 'info', ms = 3600) {
      if (window.NoirStudio?.utils?.showToast) {
        window.NoirStudio.utils.showToast(msg, type, ms);
      }
    }

    _escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    _initAll() {
      const boot = () => {
        this._bindRichEditorAndPdf();
        this._bindMode5AsciiStudio();
        this._bindMode6CoverStudio();
        this._preloadAllCoversFromIdb();
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
      } else {
        boot();
      }
    }

    // ------------------------------------------------------------------------
    // A. CỬA SỔ ĐẦU RA CHUẨN WORD (CHẾ ĐỘ 1–4) + XUẤT PDF
    // ------------------------------------------------------------------------
    _modeDisplayName(modeKey) {
      const map = {
        MODE_1_DRAFT: 'Chế độ 1: Viết Bản Nháp',
        MODE_2_BRAINSTORM: 'Chế độ 2: Tham Mưu Cốt Truyện',
        MODE_3_AUDIT: 'Chế độ 3: Kiểm Toán Logic',
        MODE_4_REVIEW: 'Chế độ 4: Đánh Giá & Chấm Điểm',
        MODE_5_DIAGRAM: 'Chế độ 5: Sơ Đồ Cốt Truyện ASCII',
        MODE_6_BOOK_COVER: 'Chế độ 6: Kho Ảnh Bìa Tiểu Thuyết'
      };
      return map[modeKey] || modeKey || 'Chế độ 1';
    }

    _plainToBasicHtml(text) {
      const s = String(text || '');
      if (!s.trim()) return '';
      return this._escapeHtml(s).replace(/\r\n|\r|\n/g, '<br>');
    }

    loadModeRichOutput(modeKey, plainText = '') {
      const mk = modeKey || this.controller?.activeMode || 'MODE_1_DRAFT';
      const pill = document.getElementById('tab3-output-mode-pill');
      if (pill) {
        pill.textContent = `📄 Đầu ra riêng: ${this._modeDisplayName(mk)}`;
      }
      const editor = document.getElementById('tab3-rich-output-editor');
      const textarea = document.getElementById('s20-quad-output-textarea');
      if (!editor) return;

      const savedHtml = this._safeGetLS(this.RICH_STORAGE_PREFIX + mk);
      this._suppressRichSync = true;
      try {
        if (savedHtml && savedHtml.trim()) {
          editor.innerHTML = savedHtml;
          if (textarea && !textarea.value.trim()) {
            textarea.value = editor.innerText || plainText || '';
          }
        } else if (plainText && String(plainText).trim()) {
          editor.innerHTML = this._plainToBasicHtml(plainText);
        } else {
          editor.innerHTML = '';
        }
      } finally {
        this._suppressRichSync = false;
      }
      this._updateWordBadgeFromActiveEditor();
    }

    setModeOutputText(modeKey, plainText) {
      return this.syncFromPlainOutput(modeKey, plainText);
    }

    syncFromPlainOutput(modeKey, plainText) {
      const mk = modeKey || this.controller?.activeMode || 'MODE_1_DRAFT';
      const html = this._plainToBasicHtml(plainText);
      this._safeSetLS(this.RICH_STORAGE_PREFIX + mk, html);
      if (mk === (this.controller?.activeMode || 'MODE_1_DRAFT')) {
        const editor = document.getElementById('tab3-rich-output-editor');
        if (editor) {
          this._suppressRichSync = true;
          try {
            editor.innerHTML = html;
          } finally {
            this._suppressRichSync = false;
          }
        }
      }
    }

    _updateWordBadgeFromActiveEditor() {
      const editor = document.getElementById('tab3-rich-output-editor');
      const textarea = document.getElementById('s20-quad-output-textarea');
      const badge = document.getElementById('tab3-output-word-badge');
      if (!badge) return;
      const text = this.isRichMode && editor ? editor.innerText || '' : textarea?.value || '';
      const words = window.NoirStudio?.utils?.countVietnameseWords
        ? window.NoirStudio.utils.countVietnameseWords(text)
        : text.trim()
        ? text.trim().split(/\s+/).length
        : 0;
      badge.textContent = `${words.toLocaleString('vi-VN')} từ`;
    }

    _bindRichEditorAndPdf() {
      const editor = document.getElementById('tab3-rich-output-editor');
      const textarea = document.getElementById('s20-quad-output-textarea');
      const toggleBtn = document.getElementById('btn-tab3-toggle-rich-output');
      const addImgBtn = document.getElementById('btn-tab3-rich-add-img');
      const imgInput = document.getElementById('input-tab3-rich-img');
      const exportPdfBtn = document.getElementById('btn-tab3-export-output-pdf');
      const clearBtn = document.getElementById('btn-tab3-clear-output');

      const syncEditorToController = () => {
        if (this._suppressRichSync || !editor) return;
        const mk = this.controller?.activeMode || 'MODE_1_DRAFT';
        if (mk === 'MODE_5_DIAGRAM' || mk === 'MODE_6_BOOK_COVER') return;
        const html = editor.innerHTML;
        const plain = editor.innerText || '';
        this._safeSetLS(this.RICH_STORAGE_PREFIX + mk, html);
        if (textarea) {
          textarea.value = plain;
        }
        if (this.controller && this.controller.modeOutputs) {
          this.controller.modeOutputs[mk] = plain;
          if (typeof this.controller.saveState === 'function') {
            this.controller.saveState();
          }
        }
        this._updateWordBadgeFromActiveEditor();
        if (this.controller && typeof this.controller.refreshAnalyticsFooterBar === 'function') {
          this.controller.refreshAnalyticsFooterBar();
        }
      };

      if (editor && !editor.dataset.v109Bound) {
        editor.dataset.v109Bound = '1';
        editor.addEventListener('input', syncEditorToController);
        editor.addEventListener('paste', (e) => {
          const items = e.clipboardData?.items;
          if (!items) return;
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it && it.type && it.type.startsWith('image/')) {
              const file = it.getAsFile();
              if (!file) continue;
              e.preventDefault();
              const reader = new FileReader();
              reader.onload = () => {
                const imgHtml = `<p><img src="${reader.result}" style="max-width:100%;border-radius:10px;margin:8px 0;" /></p>`;
                try {
                  document.execCommand('insertHTML', false, imgHtml);
                } catch (_) {
                  editor.innerHTML += imgHtml;
                }
                syncEditorToController();
              };
              reader.readAsDataURL(file);
              return;
            }
          }
        });
      }

      if (textarea && !textarea.dataset.v109PlainSyncBound) {
        textarea.dataset.v109PlainSyncBound = '1';
        textarea.addEventListener('input', () => {
          if (this.isRichMode) return;
          const mk = this.controller?.activeMode || 'MODE_1_DRAFT';
          this._safeSetLS(this.RICH_STORAGE_PREFIX + mk, this._plainToBasicHtml(textarea.value));
          this._updateWordBadgeFromActiveEditor();
        });
      }

      document.querySelectorAll('[data-tab3-rich-exec]').forEach((btn) => {
        if (btn.dataset.v109Bound) return;
        btn.dataset.v109Bound = '1';
        btn.addEventListener('click', () => {
          if (!editor) return;
          if (!this.isRichMode && toggleBtn) toggleBtn.click();
          editor.focus();
          try {
            document.execCommand(btn.getAttribute('data-tab3-rich-exec'), false, null);
          } catch (_) {}
          syncEditorToController();
        });
      });

      const addTableBtn = document.getElementById('btn-tab3-rich-add-table');
      if (addTableBtn && !addTableBtn.dataset.v113Bound) {
        addTableBtn.dataset.v113Bound = '1';
        addTableBtn.addEventListener('click', () => {
          if (!editor) return;
          if (!this.isRichMode && toggleBtn) toggleBtn.click();
          editor.focus();
          const tblHtml =
            '<table style="width:100%;border-collapse:collapse;margin:8px 0;"><thead><tr><th>Mục / Nhân vật</th><th>Chi tiết</th><th>Ghi chú</th></tr></thead><tbody><tr><td>1</td><td>...</td><td>...</td></tr><tr><td>2</td><td>...</td><td>...</td></tr></tbody></table><p><br></p>';
          try {
            document.execCommand('insertHTML', false, tblHtml);
          } catch (_) {
            editor.innerHTML += tblHtml;
          }
          syncEditorToController();
          this._toast('⊞ Đã chèn bảng chuẩn Word vào cửa sổ đầu ra!', 'success', 2200);
        });
      }

      if (addImgBtn && imgInput && !addImgBtn.dataset.v109Bound) {
        addImgBtn.dataset.v109Bound = '1';
        addImgBtn.addEventListener('click', () => imgInput.click());
        imgInput.addEventListener('change', () => {
          const f = imgInput.files && imgInput.files[0];
          imgInput.value = '';
          if (!f || !editor) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (!this.isRichMode && toggleBtn) toggleBtn.click();
            editor.focus();
            const imgHtml = `<p><img src="${reader.result}" style="max-width:100%;border-radius:10px;margin:8px 0;" /></p>`;
            try {
              document.execCommand('insertHTML', false, imgHtml);
            } catch (_) {
              editor.innerHTML += imgHtml;
            }
            syncEditorToController();
            this._toast('🖼️ Đã chèn ảnh vào khung đầu ra chuẩn Word!', 'success', 2400);
          };
          reader.readAsDataURL(f);
        });
      }

      if (toggleBtn && !toggleBtn.dataset.v109Bound) {
        toggleBtn.dataset.v109Bound = '1';
        toggleBtn.addEventListener('click', () => {
          this.isRichMode = !this.isRichMode;
          if (this.isRichMode) {
            if (editor && textarea) {
              const mk = this.controller?.activeMode || 'MODE_1_DRAFT';
              const saved = this._safeGetLS(this.RICH_STORAGE_PREFIX + mk);
              editor.innerHTML = saved || this._plainToBasicHtml(textarea.value);
              editor.classList.remove('hidden');
              textarea.classList.add('hidden');
            }
            toggleBtn.textContent = '📄 Chế độ Word (Bảng + Ảnh)';
          } else {
            if (editor && textarea) {
              textarea.value = editor.innerText || textarea.value || '';
              editor.classList.add('hidden');
              textarea.classList.remove('hidden');
            }
            toggleBtn.textContent = '📝 Chế độ Văn bản thuần';
          }
          this._updateWordBadgeFromActiveEditor();
        });
      }

      if (clearBtn && !clearBtn.dataset.v109RichClearBound) {
        clearBtn.dataset.v109RichClearBound = '1';
        clearBtn.addEventListener('click', () => {
          setTimeout(() => {
            const mk = this.controller?.activeMode || 'MODE_1_DRAFT';
            if (textarea && !textarea.value.trim()) {
              this._safeSetLS(this.RICH_STORAGE_PREFIX + mk, '');
              if (editor) editor.innerHTML = '';
              this._updateWordBadgeFromActiveEditor();
            }
          }, 40);
        });
      }

      if (exportPdfBtn && !exportPdfBtn.dataset.v109Bound) {
        exportPdfBtn.dataset.v109Bound = '1';
        exportPdfBtn.addEventListener('click', () => this.exportCurrentTab3OutputToPdf());
      }

      // Khởi nạp chế độ hiện hành ngay sau khi DOM sẵn sàng
      const initialMode = this.controller?.activeMode || 'MODE_1_DRAFT';
      const initialText =
        this.controller?.modeOutputs?.[initialMode] || textarea?.value || '';
      this.loadModeRichOutput(initialMode, initialText);
    }

    exportCurrentTab3OutputToPdf() {
      const mk = this.controller?.activeMode || 'MODE_1_DRAFT';
      const modeTitle = this._modeDisplayName(mk);
      const bookTitle =
        window.NoirStudio?.bookExporter?.prefs?.bookTitle ||
        document.getElementById('project-title-input')?.value ||
        'Sổ Tay Tiểu Thuyết Của Bi';
      let bodyHtml = '';

      if (mk === 'MODE_5_DIAGRAM') {
        const ascii = (document.getElementById('textarea-mode5-ascii-diagram')?.value || '').trim();
        const report = (document.getElementById('mode5-chronicle-report')?.innerText || '').trim();
        if (!ascii && !report) {
          this._toast('⚠️ Chưa có nội dung sơ đồ ở Chế độ 5 để tải PDF!', 'warning');
          return;
        }
        bodyHtml =
          (ascii
            ? `<h2>📐 Sơ Đồ Cốt Truyện Mã ASCII</h2><pre class="ascii-box">${this._escapeHtml(
                ascii
              )}</pre>`
            : '') +
          (report ? `<h2>⏳ Nhật Ký Sự Kiện</h2><div>${this._plainToBasicHtml(report)}</div>` : '');
      } else if (mk === 'MODE_6_BOOK_COVER') {
        const coverUrl = this.getActiveCoverDataUrl();
        if (!coverUrl) {
          this._toast('⚠️ Chưa có ảnh bìa ở Chế độ 6 để xuất PDF!', 'warning');
          return;
        }
        bodyHtml = `<div style="text-align:center;"><img src="${coverUrl}" style="max-width:100%;max-height:245mm;object-fit:contain;border-radius:6px;" /></div>`;
      } else {
        const editor = document.getElementById('tab3-rich-output-editor');
        const textarea = document.getElementById('s20-quad-output-textarea');
        const html =
          this.isRichMode && editor && editor.innerHTML.trim()
            ? editor.innerHTML
            : this._plainToBasicHtml(textarea?.value || '');
        if (!html.trim()) {
          this._toast(`⚠️ Cửa sổ đầu ra ${modeTitle} đang trống!`, 'warning');
          return;
        }
        bodyHtml = `<div class="rich-doc">${html}</div>`;
      }

      const safeTitle = this._escapeHtml(`${bookTitle} — ${modeTitle}`);
      const nowStr = new Date().toLocaleString('vi-VN');
      const docHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${safeTitle}</title>
<style>
  @page { size: A4; margin: 16mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: 'Times New Roman', Georgia, serif; font-size: 12.5pt; line-height: 1.65; color: #18181b; background: #fff; }
  .print-bar { position: sticky; top: 0; z-index: 99; background: #18181b; color: #f4f4f5; padding: 10px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; font-family: system-ui, sans-serif; font-size: 13px; border-bottom: 2px solid #8b5cf6; }
  .print-bar button { background: #8b5cf6; color: #fff; border: 0; border-radius: 8px; padding: 7px 14px; font-weight: 800; cursor: pointer; }
  .doc-wrap { max-width: 820px; margin: 0 auto; padding: 22px 24px 48px; }
  .doc-header { border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; margin-bottom: 18px; }
  .doc-header h1 { margin: 0 0 4px; font-size: 17pt; color: #111827; }
  .doc-header .meta { font-size: 10pt; color: #52525b; font-family: system-ui, sans-serif; }
  .rich-doc { white-space: pre-wrap; word-break: break-word; }
  .rich-doc table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11pt; page-break-inside: auto; }
  .rich-doc tr { page-break-inside: avoid; break-inside: avoid; }
  .rich-doc th, .rich-doc td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: left; vertical-align: top; }
  .rich-doc th { background: #f3f4f6; font-weight: 700; }
  .rich-doc img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; page-break-inside: avoid; }
  .ascii-box { font-family: 'Consolas', 'Courier New', monospace; font-size: 9pt; line-height: 1.35; white-space: pre; overflow-x: auto; border: 1px solid #d4d4d8; padding: 12px; border-radius: 8px; background: #fafafa; }
  @media print { .print-bar { display: none !important; } .doc-wrap { padding: 0; max-width: 100%; } }
</style>
</head>
<body>
  <div class="print-bar">
    <div><strong>📄 XUẤT PDF ĐẦU RA TAB 3:</strong> ${safeTitle}</div>
    <button type="button" onclick="window.print()">🖨️ Lưu Thành File .PDF</button>
  </div>
  <div class="doc-wrap">
    <div class="doc-header">
      <h1>${safeTitle}</h1>
      <div class="meta">Xuất cục bộ 100% trên máy • ${this._escapeHtml(nowStr)}</div>
    </div>
    ${bodyHtml}
  </div>
  <script>window.addEventListener('load',function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},350);});</script>
</body>
</html>`;

      const win = window.open('', '_blank', 'width=980,height=800');
      if (win && win.document) {
        win.document.open();
        win.document.write(docHtml);
        win.document.close();
        this._toast(`📄 Đã mở bản PDF cho ${modeTitle}! Chọn "Save as PDF" để lưu ngay.`, 'success', 4200);
        return;
      }

      let iframe = document.getElementById('noir-v109-tab3-pdf-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'noir-v109-tab3-pdf-iframe';
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
        document.body.appendChild(iframe);
      }
      const d = iframe.contentWindow?.document || iframe.contentDocument;
      d.open();
      d.write(docHtml);
      d.close();
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (_) {}
      }, 450);
    }

    // ------------------------------------------------------------------------
    // B. CHẾ ĐỘ 5: KHUNG DÁN & CHUYỂN MÃ ASCII QUA ẢNH ĐẸP GEMINI
    // ------------------------------------------------------------------------
    _downloadAsciiTxtFile(asciiContent, slotName = '') {
      const content = String(asciiContent || '').trim();
      if (!content) {
        this._toast('⚠️ Bạn hãy dán mã sơ đồ ASCII vào khung trước khi tải file nhé!', 'warning');
        return false;
      }
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const cleanSlot = String(slotName || '')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48);
      const fileBase = cleanSlot || `So_Do_Cot_Truyen_ASCII_${stamp}`;
      const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileBase}.txt`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (_) {}
      }, 600);
      this._toast(`⬇️ Đã tải file "${fileBase}.txt" (UTF-8 chuẩn không vỡ ký tự ASCII)!`, 'success', 3200);
      return true;
    }

    _buildAsciiToBeautifulImagePrompt() {
      return [
        'Hãy đọc kỹ toàn bộ tệp sơ đồ mã ASCII (.TXT) tôi vừa đính kèm ở trên và CHUYỂN HÓA nó thành một BỨC ẢNH SƠ ĐỒ / INFOGRAPHIC TUYỆT ĐẸP, SẮC NÉT, CHUYÊN NGHIỆP (độ phân giải cao, dễ đọc 100%).',
        '',
        'YÊU CẦU BẮT BUỘC:',
        '1. Giữ NGUYÊN CHÍNH XÁC 100% toàn bộ nội dung tiếng Việt có dấu, tên nhân vật, mốc thời gian, mối quan hệ, hướng mũi tên và phân nhánh từ file sơ đồ ASCII — TUYỆT ĐỐI không bỏ sót nhánh, không sai chính tả tiếng Việt, không bịa thêm chi tiết ngoài file.',
        '2. Thiết kế bố cục sạch sẽ, trực quan theo phong cách Infographic biên kịch / Bản đồ cốt truyện tiểu thuyết cao cấp: phân cấp màu sắc hài hòa giữa các Arc / Hồi / Tuyến nhân vật, khung thẻ bo góc sắc nét, mũi tên liên kết rõ ràng không chồng chéo.',
        '3. Chữ viết trên ảnh phải rõ ràng, tương phản cao, cỡ chữ đủ lớn để tác giả phóng to đọc mượt cả trên điện thoại lẫn máy tính.',
        '4. Hãy tạo trực tiếp hình ảnh sơ đồ hoàn chỉnh ngay trong phản hồi này (kèm bản tóm tắt cấu trúc ngắn gọn nếu cần).'
      ].join('\n');
    }

    _openAsciiToImageHelperModal(asciiText, promptText) {
      const existing = document.getElementById('modal-v109-ascii-to-image');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'modal-v109-ascii-to-image';
      modal.className =
        'fixed inset-0 z-[10060] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4';
      modal.innerHTML = `
        <div class="w-full max-w-lg rounded-2xl border-2 border-amber-400/70 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
          <div class="px-4 py-3 border-b border-amber-500/35 bg-gradient-to-r from-amber-950/70 via-zinc-900 to-rose-950/60 flex items-center justify-between gap-2">
            <h3 class="text-sm font-black text-amber-300 flex items-center gap-1.5">
              <span>✨ Chuyển Mã ASCII Sang Ảnh Sơ Đồ Đẹp</span>
            </h3>
            <button type="button" id="btn-close-v109-ascii-modal" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs">✕</button>
          </div>
          <div class="p-4 space-y-3 text-xs leading-relaxed">
            <div class="p-3 rounded-xl border border-emerald-500/45 bg-emerald-950/40 text-emerald-100 font-bold text-[12.5px]">
              ✅ Câu lệnh chuyển mã ASCII của bạn đã hoàn tất (và đã tự động sao chép sẵn vào bộ nhớ tạm), bạn chỉ cần tải file này về và đưa lên Gemini, dán câu lệnh là có sơ đồ đẹp!
            </div>
            <p class="text-[11px] text-zinc-400">
              💡 <strong>Vì sao dùng định dạng <code>.TXT (UTF-8)</code>?</strong> File <code>.TXT</code> giữ nguyên 100% từng ký tự kẻ khung (<code>┌─┐ │ └─┘ ──▶ ▼</code>) và khoảng trắng căn lề mà không bị tự động xuống dòng vỡ khung như PDF/Word — giúp Gemini đọc sơ đồ chính xác tuyệt đối.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button type="button" id="btn-v109-modal-download-ascii" class="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg transition">
                ⬇️ Tải File Sơ Đồ (.TXT)
              </button>
              <button type="button" id="btn-v109-modal-open-gemini" class="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg transition">
                🪟 Chia Đôi Màn Hình Gemini
              </button>
            </div>
            <div class="flex items-center justify-between pt-1">
              <button type="button" id="btn-v109-modal-recopy" class="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-[11px]">
                📋 Copy Lại Câu Lệnh
              </button>
              <button type="button" id="btn-v109-modal-done" class="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[11px]">
                Đóng
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const close = () => modal.remove();
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
      modal.querySelector('#btn-close-v109-ascii-modal')?.addEventListener('click', close);
      modal.querySelector('#btn-v109-modal-done')?.addEventListener('click', close);
      modal.querySelector('#btn-v109-modal-download-ascii')?.addEventListener('click', () => {
        this._downloadAsciiTxtFile(asciiText);
      });
      modal.querySelector('#btn-v109-modal-recopy')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(promptText);
          this._toast('📋 Đã copy lại câu lệnh chuyển mã ASCII sang ảnh đẹp!', 'success', 2600);
        } catch (_) {}
      });
      modal.querySelector('#btn-v109-modal-open-gemini')?.addEventListener('click', () => {
        if (window.NoirStudio?.geminiSplitBridge?.launchExternalSplitWindow) {
          window.NoirStudio.geminiSplitBridge.launchExternalSplitWindow('GEMINI', false);
        } else if (window.NoirStudio?.promptSynth?.openGeminiWebOrApp) {
          window.NoirStudio.promptSynth.openGeminiWebOrApp(true);
        } else {
          window.open('https://gemini.google.com/app', 'noir_split_gemini_window');
        }
      });
    }

    _loadAsciiSlots() {
      const SLOTS_KEY = 'noir_v111_mode5_ascii_slots_v1';
      try {
        const raw = localStorage.getItem(SLOTS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
      const legacy = this._safeGetLS(this.ASCII_STORAGE_KEY) || '';
      return [
        {
          id: 'ascii_slot_1',
          name: 'Khung 1: Sơ đồ Timeline & Cốt truyện',
          content: legacy,
          updatedAt: Date.now()
        }
      ];
    }

    _saveAsciiSlots() {
      this._safeSetLS('noir_v111_mode5_ascii_slots_v1', JSON.stringify(this.asciiSlots || []));
      this._safeSetLS('noir_v111_mode5_ascii_active_id_v1', this.activeAsciiSlotId || '');
      const active = this._getActiveAsciiSlot();
      if (active) this._safeSetLS(this.ASCII_STORAGE_KEY, active.content || '');
    }

    _getActiveAsciiSlot() {
      if (!Array.isArray(this.asciiSlots) || !this.asciiSlots.length) {
        this.asciiSlots = this._loadAsciiSlots();
      }
      return (
        this.asciiSlots.find((s) => s.id === this.activeAsciiSlotId) || this.asciiSlots[0]
      );
    }

    _renderAsciiSlotSelector() {
      const sel = document.getElementById('select-mode5-ascii-slot');
      const badge = document.getElementById('badge-mode5-ascii-slot-count');
      const box = document.getElementById('textarea-mode5-ascii-diagram');
      const active = this._getActiveAsciiSlot();
      if (active) this.activeAsciiSlotId = active.id;

      if (badge) {
        badge.textContent = `${this.asciiSlots.length} khung`;
      }
      if (sel) {
        sel.innerHTML = this.asciiSlots
          .map(
            (s, idx) =>
              `<option value="${this._escapeHtml(s.id)}" ${
                s.id === this.activeAsciiSlotId ? 'selected' : ''
              }>${idx + 1}. ${this._escapeHtml(s.name)}</option>`
          )
          .join('');
      }
      if (box && active && box.value !== (active.content || '')) {
        box.value = active.content || '';
      }
    }

    _openRenameAsciiSlotModal(slot) {
      if (!slot) return;
      document.getElementById('modal-v111-rename-ascii-slot')?.remove();
      const modal = document.createElement('div');
      modal.id = 'modal-v111-rename-ascii-slot';
      modal.className =
        'fixed inset-0 z-[10070] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3';
      modal.innerHTML = `
        <div class="w-full max-w-sm rounded-2xl border-2 border-cyan-400/70 bg-zinc-950 text-zinc-100 p-4 space-y-3 shadow-2xl">
          <div class="text-sm font-black text-cyan-300">✏️ Đặt Tên Khung Sơ Đồ ASCII</div>
          <input type="text" id="input-v111-rename-ascii-slot" value="${this._escapeHtml(
            slot.name
          )}" class="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:outline-none focus:border-cyan-400" placeholder="Ví dụ: Khung 2 - Mạng lưới nhân vật Arc 2" />
          <div class="flex justify-end gap-2">
            <button type="button" id="btn-v111-rename-ascii-cancel" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold">Hủy</button>
            <button type="button" id="btn-v111-rename-ascii-save" class="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold">Lưu Tên Khung</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const inp = modal.querySelector('#input-v111-rename-ascii-slot');
      inp?.focus();
      inp?.select();
      const close = () => modal.remove();
      const commit = () => {
        const nextName = (inp?.value || '').trim();
        if (!nextName) return;
        slot.name = nextName;
        slot.updatedAt = Date.now();
        this._saveAsciiSlots();
        this._renderAsciiSlotSelector();
        this._toast(`✅ Đã đổi tên khung thành "${nextName}"!`, 'success', 2400);
        close();
      };
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
      modal.querySelector('#btn-v111-rename-ascii-cancel')?.addEventListener('click', close);
      modal.querySelector('#btn-v111-rename-ascii-save')?.addEventListener('click', commit);
      inp?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') close();
      });
    }

    _bindMode5AsciiStudio() {
      const box = document.getElementById('textarea-mode5-ascii-diagram');
      const btnImg = document.getElementById('btn-mode5-ascii-to-beautiful-img');
      const btnDl = document.getElementById('btn-mode5-download-ascii-txt');
      const btnCopy = document.getElementById('btn-mode5-copy-ascii');
      const selSlot = document.getElementById('select-mode5-ascii-slot');
      const btnNewSlot = document.getElementById('btn-mode5-new-ascii-slot');
      const btnRenameSlot = document.getElementById('btn-mode5-rename-ascii-slot');
      const btnDeleteSlot = document.getElementById('btn-mode5-delete-ascii-slot');

      this.asciiSlots = this._loadAsciiSlots();
      this.activeAsciiSlotId =
        this._safeGetLS('noir_v111_mode5_ascii_active_id_v1') || this.asciiSlots[0].id;
      this._renderAsciiSlotSelector();

      if (box && !box.dataset.v109Bound) {
        box.dataset.v109Bound = '1';
        box.addEventListener('input', () => {
          const active = this._getActiveAsciiSlot();
          if (active) {
            active.content = box.value;
            active.updatedAt = Date.now();
            this._saveAsciiSlots();
          }
        });
      }

      if (selSlot && !selSlot.dataset.v111Bound) {
        selSlot.dataset.v111Bound = '1';
        selSlot.addEventListener('change', () => {
          this.activeAsciiSlotId = selSlot.value;
          this._saveAsciiSlots();
          this._renderAsciiSlotSelector();
        });
      }

      if (btnNewSlot && !btnNewSlot.dataset.v111Bound) {
        btnNewSlot.dataset.v111Bound = '1';
        btnNewSlot.addEventListener('click', () => {
          const nextNum = this.asciiSlots.length + 1;
          const defaultTitles = [
            'Sơ đồ Timeline & Cốt truyện',
            'Mạng lưới Nhân vật & Phe phái',
            'Cây Phục bút & Ngòi nổ'
          ];
          const labelSuffix = defaultTitles[(nextNum - 1) % defaultTitles.length];
          const newSlot = {
            id: `ascii_slot_${Date.now()}_${Math.floor(Math.random() * 999)}`,
            name: `Khung ${nextNum}: ${labelSuffix}`,
            content: '',
            updatedAt: Date.now()
          };
          this.asciiSlots.push(newSlot);
          this.activeAsciiSlotId = newSlot.id;
          this._saveAsciiSlots();
          this._renderAsciiSlotSelector();
          box?.focus();
          this._toast(`➕ Đã tạo "${newSlot.name}"! Bạn có thể bấm "✏️ Đặt tên khung" để đổi tên tùy ý.`, 'success', 2800);
        });
      }

      if (btnRenameSlot && !btnRenameSlot.dataset.v111Bound) {
        btnRenameSlot.dataset.v111Bound = '1';
        btnRenameSlot.addEventListener('click', () => {
          this._openRenameAsciiSlotModal(this._getActiveAsciiSlot());
        });
      }

      if (btnDeleteSlot && !btnDeleteSlot.dataset.v111Bound) {
        btnDeleteSlot.dataset.v111Bound = '1';
        btnDeleteSlot.addEventListener('click', () => {
          if (this.asciiSlots.length <= 1) {
            const only = this.asciiSlots[0];
            only.content = '';
            only.updatedAt = Date.now();
            this._saveAsciiSlots();
            this._renderAsciiSlotSelector();
            this._toast('🧹 Đã xóa trắng nội dung khung sơ đồ hiện tại!', 'info', 2200);
            return;
          }
          const active = this._getActiveAsciiSlot();
          this.asciiSlots = this.asciiSlots.filter((s) => s.id !== active.id);
          this.activeAsciiSlotId = this.asciiSlots[0].id;
          this._saveAsciiSlots();
          this._renderAsciiSlotSelector();
          this._toast(`🗑️ Đã xóa khung "${active.name}".`, 'info', 2400);
        });
      }

      if (btnCopy && !btnCopy.dataset.v109Bound) {
        btnCopy.dataset.v109Bound = '1';
        btnCopy.addEventListener('click', async () => {
          const val = (box?.value || '').trim();
          if (!val) {
            this._toast('⚠️ Khung sơ đồ ASCII đang trống!', 'warning');
            return;
          }
          try {
            await navigator.clipboard.writeText(val);
            this._toast('📋 Đã copy nguyên vẹn mã sơ đồ ASCII!', 'success', 2400);
          } catch (_) {
            this._toast('⚠️ Không thể tự động copy, hãy bôi đen và nhấn Ctrl+C.', 'warning');
          }
        });
      }

      if (btnDl && !btnDl.dataset.v109Bound) {
        btnDl.dataset.v109Bound = '1';
        btnDl.addEventListener('click', () => {
          const active = this._getActiveAsciiSlot();
          this._downloadAsciiTxtFile(box?.value || '', active?.name || '');
        });
      }

      if (btnImg && !btnImg.dataset.v109Bound) {
        btnImg.dataset.v109Bound = '1';
        btnImg.addEventListener('click', async () => {
          const asciiVal = (box?.value || '').trim();
          if (!asciiVal) {
            this._toast(
              '⚠️ Bạn hãy dán mã sơ đồ ASCII từ NotebookLM vào khung bên dưới trước nhé!',
              'warning',
              3600
            );
            box?.focus();
            return;
          }
          const promptText = this._buildAsciiToBeautifulImagePrompt();
          try {
            await navigator.clipboard.writeText(promptText);
          } catch (_) {}
          this._openAsciiToImageHelperModal(asciiVal, promptText);
        });
      }

      this._bindMode5VisualMapImageUploader();
    }

    _bindMode5VisualMapImageUploader() {
      const uploadBtn = document.getElementById('btn-mode5-upload-visual-img');
      const fileInp = document.getElementById('input-mode5-visual-img');
      const pasteBtn = document.getElementById('btn-mode5-paste-visual-img');
      const toggleBtn = document.getElementById('btn-mode5-toggle-svg-or-img');
      const dlBtn = document.getElementById('btn-mode5-download-visual-img');
      const clearBtn = document.getElementById('btn-mode5-clear-visual-img');
      const dropHost = document.getElementById('mode5-visual-drop-host');
      const svgStage = document.getElementById('mode5-svg-canvas-Stage');
      const imgStage = document.getElementById('mode5-custom-visual-img-stage');
      const imgEl = document.getElementById('img-mode5-custom-visual');
      const statusEl = document.getElementById('mode5-visual-status');
      if (!dropHost || dropHost.dataset.v112VisualBound === '1') return;
      dropHost.dataset.v112VisualBound = '1';

      const IMG_IDB_KEY = 'mode5_visual_diagram_img_v112';
      let currentImgDataUrl = '';
      let showingCustomImg = false;

      const applyView = () => {
        const hasImg = Boolean(currentImgDataUrl);
        if (imgEl) imgEl.src = currentImgDataUrl || '';
        toggleBtn?.classList.toggle('hidden', !hasImg);
        dlBtn?.classList.toggle('hidden', !hasImg);
        clearBtn?.classList.toggle('hidden', !hasImg);
        if (hasImg && showingCustomImg) {
          svgStage?.classList.add('hidden');
          imgStage?.classList.remove('hidden');
          if (toggleBtn) toggleBtn.textContent = '🔄 Xem Sơ Đồ SVG';
          if (statusEl) statusEl.textContent = '🖼️ Đang hiển thị ảnh sơ đồ đã dán/tải lên';
        } else {
          svgStage?.classList.remove('hidden');
          imgStage?.classList.add('hidden');
          if (toggleBtn) toggleBtn.textContent = '🖼️ Xem Ảnh Sơ Đồ Đã Lưu';
          if (statusEl) statusEl.textContent = hasImg ? 'Đang xem SVG (có ảnh sơ đồ đã lưu)' : 'Sẵn sàng vẽ sơ đồ hoặc dán ảnh';
        }
      };

      const acceptImageBlob = (blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const url = String(reader.result || '');
          if (!url.startsWith('data:image/')) {
            this._toast('⚠️ Tệp không phải định dạng ảnh hợp lệ!', 'warning');
            return;
          }
          currentImgDataUrl = url;
          showingCustomImg = true;
          await this._putCoverDataUrlIdb(IMG_IDB_KEY, url);
          applyView();
          this._toast('🖼️ Đã gắn & lưu ảnh Bản Đồ Trực Quan thành công!', 'success', 2800);
        };
        reader.readAsDataURL(blob);
      };

      // Tải lại ảnh đã lưu từ IndexedDB khi mở trang
      this._openCoversIdb().then((db) => {
        if (!db) return;
        try {
          const tx = db.transaction(this.IDB_STORE, 'readonly');
          const req = tx.objectStore(this.IDB_STORE).get(IMG_IDB_KEY);
          req.onsuccess = () => {
            if (req.result && req.result.dataUrl) {
              currentImgDataUrl = req.result.dataUrl;
              showingCustomImg = true;
              applyView();
            }
          };
        } catch (_) {}
      });

      uploadBtn?.addEventListener('click', () => fileInp?.click());
      fileInp?.addEventListener('change', () => {
        const f = fileInp.files && fileInp.files[0];
        fileInp.value = '';
        if (f) acceptImageBlob(f);
      });

      pasteBtn?.addEventListener('click', async () => {
        dropHost.focus();
        if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
          try {
            const clipItems = await navigator.clipboard.read();
            for (const ci of clipItems) {
              const imgType = ci.types.find((t) => t.startsWith('image/'));
              if (imgType) {
                const blob = await ci.getType(imgType);
                acceptImageBlob(blob);
                return;
              }
            }
          } catch (_) {}
        }
        this._toast('📋 Hãy nhấn Ctrl+V ngay bây giờ để dán ảnh từ bộ nhớ tạm vào khung Bản đồ trực quan!', 'info', 3400);
      });

      dropHost.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i]?.type?.startsWith('image/')) {
            const f = items[i].getAsFile();
            if (f) {
              e.preventDefault();
              acceptImageBlob(f);
              return;
            }
          }
        }
      });

      dropHost.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropHost.classList.add('border-emerald-400', 'bg-emerald-950/20');
      });
      dropHost.addEventListener('dragleave', () => {
        dropHost.classList.remove('border-emerald-400', 'bg-emerald-950/20');
      });
      dropHost.addEventListener('drop', (e) => {
        e.preventDefault();
        dropHost.classList.remove('border-emerald-400', 'bg-emerald-950/20');
        const f = Array.from(e.dataTransfer?.files || []).find((x) => x.type.startsWith('image/'));
        if (f) acceptImageBlob(f);
      });

      toggleBtn?.addEventListener('click', () => {
        showingCustomImg = !showingCustomImg;
        applyView();
      });

      dlBtn?.addEventListener('click', () => {
        if (!currentImgDataUrl) return;
        const a = document.createElement('a');
        a.href = currentImgDataUrl;
        a.download = `Ban_Do_Truc_Quan_${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { try { document.body.removeChild(a); } catch (_) {} }, 400);
      });

      clearBtn?.addEventListener('click', async () => {
        currentImgDataUrl = '';
        showingCustomImg = false;
        await this._deleteCoverDataUrlIdb(IMG_IDB_KEY);
        applyView();
        this._toast('🗑️ Đã xóa ảnh sơ đồ tùy chỉnh, quay về chế độ SVG.', 'info', 2200);
      });
    }

    // ------------------------------------------------------------------------
    // C. CHẾ ĐỘ 6: KHO ẢNH BÌA TIỂU THUYẾT + ĐỒNG BỘ THƯ MỤC + XUẤT PDF
    // ------------------------------------------------------------------------
    _loadCoversMeta() {
      try {
        const raw = localStorage.getItem(this.COVER_META_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }

    _saveCoversMeta() {
      this._safeSetLS(this.COVER_META_KEY, JSON.stringify(this.coversMeta));
    }

    _openCoversIdb() {
      if (this._idbPromise) return this._idbPromise;
      this._idbPromise = new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
          resolve(null);
          return;
        }
        try {
          const req = indexedDB.open(this.IDB_NAME, 1);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(this.IDB_STORE)) {
              db.createObjectStore(this.IDB_STORE, { keyPath: 'id' });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch (_) {
          resolve(null);
        }
      });
      return this._idbPromise;
    }

    async _putCoverDataUrlIdb(id, dataUrl) {
      this.coverDataUrlCache.set(id, dataUrl);
      const db = await this._openCoversIdb();
      if (!db) return;
      await new Promise((resolve) => {
        try {
          const tx = db.transaction(this.IDB_STORE, 'readwrite');
          tx.objectStore(this.IDB_STORE).put({ id, dataUrl });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }

    async _deleteCoverDataUrlIdb(id) {
      this.coverDataUrlCache.delete(id);
      const db = await this._openCoversIdb();
      if (!db) return;
      await new Promise((resolve) => {
        try {
          const tx = db.transaction(this.IDB_STORE, 'readwrite');
          tx.objectStore(this.IDB_STORE).delete(id);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }

    async _preloadAllCoversFromIdb() {
      const db = await this._openCoversIdb();
      if (db) {
        await new Promise((resolve) => {
          try {
            const tx = db.transaction(this.IDB_STORE, 'readonly');
            const req = tx.objectStore(this.IDB_STORE).getAll();
            req.onsuccess = () => {
              const rows = Array.isArray(req.result) ? req.result : [];
              rows.forEach((r) => {
                if (r && r.id && r.dataUrl) this.coverDataUrlCache.set(r.id, r.dataUrl);
              });
              resolve(true);
            };
            req.onerror = () => resolve(false);
          } catch (_) {
            resolve(false);
          }
        });
      }
      if (!this.activeCoverId && this.coversMeta.length > 0) {
        this.activeCoverId = this.coversMeta[0].id;
        this._safeSetLS(this.ACTIVE_COVER_KEY, this.activeCoverId);
      }
      this.renderGalleryUI();
    }

    _sanitizeCoverFileName(rawName, ext = 'png') {
      const cleaned = String(rawName || 'Bia_Truyen')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 72);
      const base = cleaned || 'Bia_Truyen';
      const safeExt = String(ext || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
      return base.toLowerCase().endsWith('.' + safeExt) ? base : `${base}.${safeExt}`;
    }

    async _getCoverFolderHandle(create = true) {
      const root = window.NoirStudio?.fsEngine?.rootDirHandle;
      if (!root || typeof root.getDirectoryHandle !== 'function') return null;
      try {
        return await root.getDirectoryHandle(this.COVER_FOLDER_NAME, { create });
      } catch (_) {
        return null;
      }
    }

    async _dataUrlToBlob(dataUrl) {
      const res = await fetch(dataUrl);
      return await res.blob();
    }

    async _writeCoverToWorkspaceFolder(fileName, dataUrl) {
      const dir = await this._getCoverFolderHandle(true);
      if (!dir) return false;
      try {
        const blob = await this._dataUrlToBlob(dataUrl);
        const fh = await dir.getFileHandle(fileName, { create: true });
        const writable = await fh.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (_) {
        return false;
      }
    }

    async _removeCoverFromWorkspaceFolder(fileName) {
      if (!fileName) return false;
      const dir = await this._getCoverFolderHandle(false);
      if (!dir || typeof dir.removeEntry !== 'function') return false;
      try {
        await dir.removeEntry(fileName);
        return true;
      } catch (_) {
        return false;
      }
    }

    async _renameCoverInWorkspaceFolder(oldFileName, newFileName, dataUrl) {
      if (!newFileName || oldFileName === newFileName) return false;
      const okWrite = await this._writeCoverToWorkspaceFolder(newFileName, dataUrl);
      if (okWrite && oldFileName) {
        await this._removeCoverFromWorkspaceFolder(oldFileName);
      }
      return okWrite;
    }

    hasAnyCover() {
      return Boolean(this.getActiveCoverDataUrl());
    }

    getActiveCoverMeta() {
      if (!this.coversMeta.length) return null;
      return (
        this.coversMeta.find((c) => c.id === this.activeCoverId) || this.coversMeta[0] || null
      );
    }

    getActiveCoverDataUrl() {
      const meta = this.getActiveCoverMeta();
      if (!meta) return '';
      return this.coverDataUrlCache.get(meta.id) || '';
    }

    isCustomPdfCoverEnabled() {
      const enabled = this._safeGetLS(this.USE_CUSTOM_PDF_COVER_KEY) === '1';
      return enabled && Boolean(this.getActiveCoverDataUrl());
    }

    setCustomPdfCoverEnabled(enabled, source = '') {
      const want = Boolean(enabled);
      if (want && !this.getActiveCoverDataUrl()) {
        this._safeSetLS(this.USE_CUSTOM_PDF_COVER_KEY, '0');
        this._syncPdfCoverCheckboxes(false);
        return false;
      }
      this._safeSetLS(this.USE_CUSTOM_PDF_COVER_KEY, want ? '1' : '0');
      this._syncPdfCoverCheckboxes(want);
      if (source !== 'exporter' && window.NoirStudio?.bookExporter) {
        try {
          window.NoirStudio.bookExporter.prefs.useCustomCoverImage = want;
          if (typeof window.NoirStudio.bookExporter.savePreferences === 'function') {
            window.NoirStudio.bookExporter.savePreferences();
          }
          if (typeof window.NoirStudio.bookExporter.updateLivePreview === 'function') {
            window.NoirStudio.bookExporter.updateLivePreview();
          }
        } catch (_) {}
      }
      return true;
    }

    _syncPdfCoverCheckboxes(checked) {
      const c1 = document.getElementById('chk-mode6-use-as-pdf-cover');
      const c2 = document.getElementById('chk-export-use-custom-cover');
      if (c1) c1.checked = Boolean(checked);
      if (c2) c2.checked = Boolean(checked);
    }

    async addCoverFromFileOrBlob(blobOrFile, preferredName = '') {
      if (!blobOrFile) return null;
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không đọc được ảnh'));
        reader.readAsDataURL(blobOrFile);
      });
      if (!dataUrl.startsWith('data:image/')) {
        this._toast('⚠️ Tệp không phải định dạng hình ảnh hợp lệ!', 'warning');
        return null;
      }

      const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
      const num = this.coversMeta.length + 1;
      const baseTitle = preferredName
        ? preferredName.replace(/\.[^.]+$/, '')
        : `Bia_Truyen_${num}`;
      const fileName = this._sanitizeCoverFileName(baseTitle, ext);
      const id = `cov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const meta = {
        id,
        name: baseTitle,
        fileName,
        mimeType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await this._putCoverDataUrlIdb(id, dataUrl);
      this.coversMeta.unshift(meta);
      this.activeCoverId = id;
      this._saveCoversMeta();
      this._safeSetLS(this.ACTIVE_COVER_KEY, id);
      this.renderGalleryUI();

      const savedToDir = await this._writeCoverToWorkspaceFolder(fileName, dataUrl);
      this._toast(
        savedToDir
          ? `🖼️ Đã lưu ảnh bìa "${meta.name}" vào Kho Bìa & thư mục ${this.COVER_FOLDER_NAME}/!`
          : `🖼️ Đã lưu ảnh bìa "${meta.name}" vào Kho Bìa trên máy!`,
        'success',
        3400
      );
      return meta;
    }

    selectCover(id) {
      const found = this.coversMeta.find((c) => c.id === id);
      if (!found) return;
      this.activeCoverId = found.id;
      this._safeSetLS(this.ACTIVE_COVER_KEY, found.id);
      this.renderGalleryUI();
    }

    _openRenameCoverModal(meta) {
      const existing = document.getElementById('modal-v109-rename-cover');
      if (existing) existing.remove();
      const modal = document.createElement('div');
      modal.id = 'modal-v109-rename-cover';
      modal.className =
        'fixed inset-0 z-[10065] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3';
      modal.innerHTML = `
        <div class="w-full max-w-sm rounded-2xl border-2 border-violet-400/70 bg-zinc-950 text-zinc-100 p-4 space-y-3 shadow-2xl">
          <div class="text-sm font-black text-violet-300">✏️ Đổi Tên Ảnh Bìa (Đồng Bộ Thư Mục)</div>
          <input type="text" id="input-v109-rename-cover" value="${this._escapeHtml(
            meta.name
          )}" class="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:outline-none focus:border-violet-400" placeholder="Ví dụ: Quyển 1 - Khởi Nguyên" />
          <p class="text-[11px] text-zinc-400">Tên file trong <code>${this.COVER_FOLDER_NAME}/</code> cũng sẽ tự động đổi tên tương ứng.</p>
          <div class="flex justify-end gap-2">
            <button type="button" id="btn-v109-rename-cancel" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold">Hủy</button>
            <button type="button" id="btn-v109-rename-save" class="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold">Lưu Tên Mới</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const inp = modal.querySelector('#input-v109-rename-cover');
      inp?.focus();
      inp?.select();

      const close = () => modal.remove();
      const commit = async () => {
        const nextName = (inp?.value || '').trim();
        if (!nextName) return;
        const oldFile = meta.fileName;
        const ext = (oldFile && oldFile.split('.').pop()) || 'png';
        const nextFile = this._sanitizeCoverFileName(nextName, ext);
        meta.name = nextName;
        meta.fileName = nextFile;
        meta.updatedAt = Date.now();
        this._saveCoversMeta();
        this.renderGalleryUI();
        const dataUrl = this.coverDataUrlCache.get(meta.id);
        let synced = false;
        if (dataUrl) {
          synced = await this._renameCoverInWorkspaceFolder(oldFile, nextFile, dataUrl);
        }
        this._toast(
          synced
            ? `✅ Đã đổi tên thành "${nextName}" & đồng bộ file ${nextFile} trong thư mục!`
            : `✅ Đã đổi tên ảnh bìa thành "${nextName}"!`,
          'success',
          2800
        );
        close();
      };

      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
      modal.querySelector('#btn-v109-rename-cancel')?.addEventListener('click', close);
      modal.querySelector('#btn-v109-rename-save')?.addEventListener('click', commit);
      inp?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') close();
      });
    }

    async deleteCover(id) {
      const idx = this.coversMeta.findIndex((c) => c.id === id);
      if (idx === -1) return;
      const [removed] = this.coversMeta.splice(idx, 1);
      await this._deleteCoverDataUrlIdb(id);
      if (removed?.fileName) {
        await this._removeCoverFromWorkspaceFolder(removed.fileName);
      }
      if (this.activeCoverId === id) {
        this.activeCoverId = this.coversMeta[0]?.id || '';
        this._safeSetLS(this.ACTIVE_COVER_KEY, this.activeCoverId);
      }
      if (!this.coversMeta.length) {
        this.setCustomPdfCoverEnabled(false);
      }
      this._saveCoversMeta();
      this.renderGalleryUI();
      this._toast(`🗑️ Đã xóa ảnh bìa "${removed?.name || ''}".`, 'info', 2400);
    }

    async downloadActiveCover(format = 'png') {
      const dataUrl = this.getActiveCoverDataUrl();
      const meta = this.getActiveCoverMeta();
      if (!dataUrl || !meta) {
        this._toast('⚠️ Bạn chưa có ảnh bìa nào để tải về!', 'warning');
        return;
      }
      const isJpg = format === 'jpg' || format === 'jpeg';
      const outMime = isJpg ? 'image/jpeg' : 'image/png';
      const outExt = isJpg ? 'jpg' : 'png';
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 1024;
        canvas.height = img.naturalHeight || img.height || 1536;
        const ctx = canvas.getContext('2d');
        if (isJpg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const outUrl = canvas.toDataURL(outMime, isJpg ? 0.96 : 1.0);
        const a = document.createElement('a');
        a.href = outUrl;
        a.download = this._sanitizeCoverFileName(meta.name || 'Bia_Truyen', outExt);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
          } catch (_) {}
        }, 400);
        this._toast(`⬇️ Đã tải ảnh bìa sắc nét (.${outExt.toUpperCase()})!`, 'success', 2600);
      } catch (_) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = this._sanitizeCoverFileName(meta.name || 'Bia_Truyen', outExt);
        a.click();
      }
    }

    async syncWithWorkspaceCoverFolder() {
      const dir = await this._getCoverFolderHandle(true);
      if (!dir) {
        this._toast(
          '📂 Hãy kết nối Thư mục Công Việc trên máy trước (Tab 6 / nút Mở Thư Mục) để đồng bộ thư mục 06_Anh_Bia_Truyen/ nhé!',
          'warning',
          4200
        );
        return;
      }
      let imported = 0;
      let exported = 0;
      const existingByFile = new Map(
        this.coversMeta.map((c) => [String(c.fileName || '').toLowerCase(), c])
      );
      const seenInFolder = new Set();

      try {
        for await (const entry of dir.values()) {
          if (entry.kind !== 'file') continue;
          if (!/\.(png|jpe?g|webp)$/i.test(entry.name)) continue;
          seenInFolder.add(entry.name.toLowerCase());
          if (!existingByFile.has(entry.name.toLowerCase())) {
            const file = await entry.getFile();
            await this.addCoverFromFileOrBlob(file, entry.name);
            imported++;
          }
        }
        for (const meta of this.coversMeta) {
          const fn = String(meta.fileName || '').toLowerCase();
          if (fn && !seenInFolder.has(fn)) {
            const dataUrl = this.coverDataUrlCache.get(meta.id);
            if (dataUrl) {
              const ok = await this._writeCoverToWorkspaceFolder(meta.fileName, dataUrl);
              if (ok) exported++;
            }
          }
        }
      } catch (_) {}

      this._toast(
        `🔄 Đồng bộ xong thư mục ${this.COVER_FOLDER_NAME}/: nhập ${imported} ảnh mới, lưu thêm ${exported} ảnh ra thư mục!`,
        'success',
        3600
      );
    }

    renderGalleryUI() {
      const listEl = document.getElementById('mode6-cover-gallery-list');
      const countEl = document.getElementById('mode6-cover-count-badge');
      const previewImg = document.getElementById('img-mode6-active-cover-preview');
      const emptyHint = document.getElementById('mode6-cover-empty-hint');
      const controls = document.getElementById('mode6-active-cover-controls');
      const activeNameEl = document.getElementById('label-mode6-active-cover-name');

      if (countEl) countEl.textContent = String(this.coversMeta.length);

      const activeMeta = this.getActiveCoverMeta();
      const activeUrl = activeMeta ? this.coverDataUrlCache.get(activeMeta.id) || '' : '';

      if (previewImg && emptyHint && controls) {
        if (activeMeta && activeUrl) {
          previewImg.src = activeUrl;
          previewImg.classList.remove('hidden');
          emptyHint.classList.add('hidden');
          controls.classList.remove('hidden');
          if (activeNameEl) activeNameEl.textContent = `📘 ${activeMeta.name}`;
        } else {
          previewImg.src = '';
          previewImg.classList.add('hidden');
          emptyHint.classList.remove('hidden');
          controls.classList.add('hidden');
        }
      }

      this._syncPdfCoverCheckboxes(this.isCustomPdfCoverEnabled());

      if (!listEl) return;
      if (!this.coversMeta.length) {
        listEl.innerHTML =
          '<div class="col-span-full py-8 text-center text-zinc-500 italic">Chưa có ảnh bìa nào được lưu. Hãy dán ảnh (Ctrl+V) vào khung bên trái!</div>';
        return;
      }

      listEl.innerHTML = this.coversMeta
        .map((c) => {
          const url = this.coverDataUrlCache.get(c.id) || '';
          const isActive = activeMeta && activeMeta.id === c.id;
          return `
            <div data-cover-id="${this._escapeHtml(
              c.id
            )}" class="group rounded-xl border-2 ${
            isActive
              ? 'border-emerald-400 bg-emerald-950/30 shadow-lg'
              : 'border-zinc-800 bg-zinc-900/80 hover:border-violet-400/60'
          } p-2 flex flex-col gap-1.5 transition">
              <div class="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-zinc-950 cursor-pointer flex items-center justify-center" data-cover-action="select" data-cover-id="${this._escapeHtml(
                c.id
              )}">
                ${
                  url
                    ? `<img src="${url}" alt="${this._escapeHtml(
                        c.name
                      )}" class="w-full h-full object-cover" />`
                    : `<span class="text-zinc-500 text-[10px]">Đang tải...</span>`
                }
                ${
                  isActive
                    ? '<span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500 text-zinc-950 font-black text-[9px]">ĐANG CHỌN</span>'
                    : ''
                }
              </div>
              <div class="font-bold text-[11px] text-zinc-200 truncate" title="${this._escapeHtml(
                c.name
              )}">${this._escapeHtml(c.name)}</div>
              <div class="flex items-center gap-1">
                <button type="button" data-cover-action="rename" data-cover-id="${this._escapeHtml(
                  c.id
                )}" class="flex-1 px-1.5 py-1 rounded-md bg-zinc-800 hover:bg-violet-600 text-zinc-200 hover:text-white font-bold text-[10px] transition">✏️ Đổi tên</button>
                <button type="button" data-cover-action="delete" data-cover-id="${this._escapeHtml(
                  c.id
                )}" class="px-1.5 py-1 rounded-md bg-zinc-800 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-[10px] transition" title="Xóa ảnh bìa">🗑️</button>
              </div>
            </div>
          `;
        })
        .join('');
    }

    _bindMode6CoverStudio() {
      const pasteZone = document.getElementById('mode6-cover-paste-zone');
      const uploadBtn = document.getElementById('btn-mode6-upload-cover');
      const fileInput = document.getElementById('input-mode6-cover-file');
      const syncBtn = document.getElementById('btn-mode6-sync-folder-covers');
      const dlPngBtn = document.getElementById('btn-mode6-download-png');
      const dlJpgBtn = document.getElementById('btn-mode6-download-jpg');
      const chkPdf = document.getElementById('chk-mode6-use-as-pdf-cover');
      const galleryList = document.getElementById('mode6-cover-gallery-list');

      const handlePasteEvent = async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it && it.type && it.type.startsWith('image/')) {
            const blob = it.getAsFile();
            if (!blob) continue;
            e.preventDefault();
            await this.addCoverFromFileOrBlob(blob);
            return true;
          }
        }
        return false;
      };

      if (pasteZone && !pasteZone.dataset.v109Bound) {
        pasteZone.dataset.v109Bound = '1';
        pasteZone.addEventListener('click', () => {
          pasteZone.focus();
          if (!this.coversMeta.length && fileInput) {
            // Focus để Ctrl+V hoạt động ngay; nhấp đúp mở hộp chọn tệp
          }
        });
        pasteZone.addEventListener('dblclick', () => fileInput?.click());
        pasteZone.addEventListener('paste', handlePasteEvent);
        pasteZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          pasteZone.classList.add('border-emerald-400', 'bg-emerald-950/25');
        });
        pasteZone.addEventListener('dragleave', () => {
          pasteZone.classList.remove('border-emerald-400', 'bg-emerald-950/25');
        });
        pasteZone.addEventListener('drop', async (e) => {
          e.preventDefault();
          pasteZone.classList.remove('border-emerald-400', 'bg-emerald-950/25');
          const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
            f.type.startsWith('image/')
          );
          for (const f of files) {
            await this.addCoverFromFileOrBlob(f, f.name);
          }
        });
      }

      // Hỗ trợ Ctrl+V toàn cục khi người dùng đang mở Chế độ 6 Tab 3
      if (!document.documentElement.dataset.v109CoverGlobalPasteBound) {
        document.documentElement.dataset.v109CoverGlobalPasteBound = '1';
        document.addEventListener('paste', (e) => {
          const studio = document.getElementById('tab3-mode6-cover-studio');
          if (!studio || studio.classList.contains('hidden')) return;
          const tag = (document.activeElement?.tagName || '').toLowerCase();
          if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
            return;
          }
          handlePasteEvent(e);
        });
      }

      if (uploadBtn && fileInput && !uploadBtn.dataset.v109Bound) {
        uploadBtn.dataset.v109Bound = '1';
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
          const files = Array.from(fileInput.files || []);
          fileInput.value = '';
          for (const f of files) {
            await this.addCoverFromFileOrBlob(f, f.name);
          }
        });
      }

      if (syncBtn && !syncBtn.dataset.v109Bound) {
        syncBtn.dataset.v109Bound = '1';
        syncBtn.addEventListener('click', () => this.syncWithWorkspaceCoverFolder());
      }
      if (dlPngBtn && !dlPngBtn.dataset.v109Bound) {
        dlPngBtn.dataset.v109Bound = '1';
        dlPngBtn.addEventListener('click', () => this.downloadActiveCover('png'));
      }
      if (dlJpgBtn && !dlJpgBtn.dataset.v109Bound) {
        dlJpgBtn.dataset.v109Bound = '1';
        dlJpgBtn.addEventListener('click', () => this.downloadActiveCover('jpg'));
      }
      if (chkPdf && !chkPdf.dataset.v109Bound) {
        chkPdf.dataset.v109Bound = '1';
        chkPdf.addEventListener('change', () => {
          const ok = this.setCustomPdfCoverEnabled(chkPdf.checked, 'mode6');
          if (chkPdf.checked && ok) {
            this._toast(
              '📕 Đã bật áp dụng ảnh bìa này khi xuất truyện PDF (đã đồng bộ sang khung Xuất PDF)!',
              'success',
              3200
            );
          } else if (!chkPdf.checked) {
            this._toast('📘 Đã tắt áp dụng ảnh bìa riêng khi xuất PDF.', 'info', 2200);
          }
        });
      }

      if (galleryList && !galleryList.dataset.v109Bound) {
        galleryList.dataset.v109Bound = '1';
        galleryList.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-cover-action]');
          if (!btn) return;
          const action = btn.getAttribute('data-cover-action');
          const id = btn.getAttribute('data-cover-id');
          if (!id) return;
          if (action === 'select') this.selectCover(id);
          else if (action === 'rename') {
            const meta = this.coversMeta.find((c) => c.id === id);
            if (meta) this._openRenameCoverModal(meta);
          } else if (action === 'delete') {
            this.deleteCover(id);
          }
        });
      }
    }
  }

  const v109Tab3Manager = new V109Tab3RichAsciiAndCoverManager(tab3Controller);
  window.NoirStudio.tab3RichBridge = v109Tab3Manager;
  window.NoirStudio.coverGallery = v109Tab3Manager;

  // ==========================================================================
  // V115: BỘ NÂNG CẤP TRÌNH SOẠN THẢO CHUẨN WORD CHO MỌI KHUNG CHAT / PROMPT /
  //       ĐẦU RA AI / STORY BIBLE / THAM MƯU CỐT TRUYỆN (CONTENTEDITABLE)
  // - Fix xóa Bảng & Ảnh bằng phím Backspace / Delete (như Microsoft Word)
  // - Menu chuột phải chuyên nghiệp cho Bảng (Thêm/Xóa hàng-cột, Canh đều cột,
  //   Căn trái/giữa/phải ô, Sao chép bảng, Xóa bảng) & Ảnh (Sao chép ảnh, Cắt/Crop
  //   ảnh trực quan, Chỉnh kích cỡ, Căn lề, Xoay 90°, Xóa ảnh)
  // - Bổ sung thanh công cụ chuẩn Word: Chọn tất cả, Căn trái/giữa/phải/đều,
  //   Gạch ngang, Danh sách, Hoàn tác/Làm lại, Xóa định dạng
  // ==========================================================================
  class V115WordRichEditorProSuite {
    constructor() {
      this.selectedImg = null;
      this.selectedTable = null;
      this.selectedCell = null;
      this.activeEditor = null;
      this.contextMenuEl = null;
      this.floatingBarEl = null;
      this._cropTargetImg = null;
      this._cropTargetEditor = null;
      this._initDone = false;
    }

    toast(msg, type = 'info', dur = 2400) {
      window.NoirStudio?.utils?.showToast?.(msg, type, dur);
    }

    notifyEditorChanged(editorEl) {
      if (!editorEl) return;
      try {
        editorEl.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (_e) {}
    }

    injectStylesOnce() {
      if (document.getElementById('v115-word-rich-styles')) return;
      const st = document.createElement('style');
      st.id = 'v115-word-rich-styles';
      st.textContent = `
        [contenteditable="true"] img.v115-word-img-selected {
          outline: 2.5px solid #38bdf8 !important;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.25);
          cursor: pointer;
        }
        [contenteditable="true"] table.v115-word-table-selected {
          outline: 2px solid #10b981 !important;
          outline-offset: 2px;
        }
        #v115-word-context-menu {
          position: fixed;
          z-index: 2147483600;
          min-width: 220px;
          max-width: 270px;
          background: rgba(18, 20, 28, 0.98);
          border: 1px solid rgba(71, 85, 105, 0.8);
          border-radius: 12px;
          padding: 5px;
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(12px);
          color: #f4f4f5;
          font-size: 12px;
          user-select: none;
        }
        #v115-word-context-menu .v115-ctx-title {
          padding: 4px 8px 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #34d399;
          border-bottom: 1px solid rgba(63, 63, 70, 0.7);
          margin-bottom: 4px;
        }
        #v115-word-context-menu button {
          width: 100%;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 9px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #e4e4e7;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        #v115-word-context-menu button:hover {
          background: rgba(16, 185, 129, 0.22);
          color: #ffffff;
        }
        #v115-word-context-menu button.v115-ctx-danger {
          color: #fda4af;
        }
        #v115-word-context-menu button.v115-ctx-danger:hover {
          background: rgba(225, 29, 72, 0.28);
          color: #ffffff;
        }
        #v115-word-context-menu .v115-ctx-sep {
          height: 1px;
          background: rgba(63, 63, 70, 0.7);
          margin: 4px 6px;
        }
        #v115-word-floating-bar {
          position: fixed;
          z-index: 2147483500;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          padding: 4px 6px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(52, 211, 153, 0.65);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.6);
          font-size: 11px;
          user-select: none;
        }
        #v115-word-floating-bar button {
          padding: 3px 7px;
          border-radius: 7px;
          border: 1px solid rgba(71, 85, 105, 0.7);
          background: rgba(30, 41, 59, 0.9);
          color: #e2e8f0;
          font-weight: 700;
          font-size: 10.5px;
          cursor: pointer;
          white-space: nowrap;
        }
        #v115-word-floating-bar button:hover {
          background: rgba(16, 185, 129, 0.3);
          border-color: rgba(52, 211, 153, 0.8);
          color: #fff;
        }
        #v115-word-floating-bar button.v115-fb-danger {
          background: rgba(159, 18, 57, 0.45);
          border-color: rgba(251, 113, 133, 0.6);
          color: #fecdd3;
        }
        #v115-word-floating-bar button.v115-fb-danger:hover {
          background: #e11d48;
          color: #fff;
        }
      `;
      document.head.appendChild(st);
    }

    findToolbarForEditor(editorEl) {
      if (!editorEl) return null;
      const idMap = {
        'tab3-rich-output-editor': 'tab3-rich-output-toolbar',
        'tab4-rich-bible-editor': 'tab4-rich-bible-toolbar',
        's18-rich-prompt-editor': 's18-rich-prompt-toolbar',
        'v111-exp-rich-editor': 'v111-exp-rich-toolbar'
      };
      if (idMap[editorEl.id]) {
        const direct = document.getElementById(idMap[editorEl.id]);
        if (direct) return direct;
      }
      // Tìm thanh công cụ ngay phía trước editor
      let prev = editorEl.previousElementSibling;
      for (let i = 0; i < 3 && prev; i++) {
        if (prev.querySelector && prev.querySelector('button')) {
          return prev;
        }
        prev = prev.previousElementSibling;
      }
      return null;
    }

    selectAllInsideEditor(editorEl) {
      if (!editorEl) return;
      editorEl.focus();
      try {
        if (editorEl.tagName === 'TEXTAREA' || editorEl.tagName === 'INPUT') {
          editorEl.select();
          editorEl.setSelectionRange?.(0, (editorEl.value || '').length);
        } else {
          const range = document.createRange();
          range.selectNodeContents(editorEl);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        this.toast('☑️ Đã chọn toàn bộ nội dung trong khung!', 'info', 1600);
      } catch (_e) {}
    }

    async copyAllFromEditor(editorEl) {
      if (!editorEl) return;
      const text =
        editorEl.tagName === 'TEXTAREA' || editorEl.tagName === 'INPUT'
          ? String(editorEl.value || '')
          : String(editorEl.innerText || editorEl.textContent || '');
      if (!text.trim()) {
        this.toast('⚠️ Khung hiện đang trống, chưa có nội dung để sao chép!', 'warning', 1800);
        return;
      }
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text);
        } else {
          const tmp = document.createElement('textarea');
          tmp.value = text;
          tmp.style.position = 'fixed';
          tmp.style.opacity = '0';
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          tmp.remove();
        }
        this.toast('📋 Đã sao chép toàn bộ nội dung vào bộ nhớ tạm!', 'success', 2000);
      } catch (_e) {
        this.selectAllInsideEditor(editorEl);
        try { document.execCommand('copy'); } catch (_e2) {}
        this.toast('📋 Đã chọn & sao chép toàn bộ nội dung!', 'success', 2000);
      }
    }

    enhancePlainPromptAndBibleTextareas() {
      const targetIds = [
        'mode5-prompt-input',
        'textarea-bible-template-frame',
        'textarea-synthesized-master-prompt',
        'textarea-sysprompt-editor',
      ];
      targetIds.forEach((id) => {
        const ta = document.getElementById(id);
        if (!ta || ta.dataset.v117SelectCopyBound === '1' || !ta.parentElement) return;
        ta.dataset.v117SelectCopyBound = '1';
        const bar = document.createElement('div');
        bar.className = 'flex flex-wrap items-center justify-end gap-1.5 mb-1.5';
        const bSel = document.createElement('button');
        bSel.type = 'button';
        bSel.dataset.v117SelectAll = id;
        bSel.className = 'px-2 py-0.5 rounded-lg border border-emerald-500/45 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-200 font-bold text-[10.5px] transition cursor-pointer';
        bSel.textContent = '☑️ Chọn tất cả';
        bSel.addEventListener('click', (ev) => {
          ev.preventDefault();
          this.selectAllInsideEditor(ta);
        });
        const bCopy = document.createElement('button');
        bCopy.type = 'button';
        bCopy.dataset.v117CopyAll = id;
        bCopy.className = 'px-2 py-0.5 rounded-lg border border-sky-500/45 bg-sky-500/15 hover:bg-sky-500/30 text-sky-200 font-bold text-[10.5px] transition cursor-pointer';
        bCopy.textContent = '📋 Sao chép tất cả';
        bCopy.addEventListener('click', (ev) => {
          ev.preventDefault();
          this.copyAllFromEditor(ta);
        });
        bar.appendChild(bSel);
        bar.appendChild(bCopy);
        ta.parentElement.insertBefore(bar, ta);
      });
    }

    runWordExecCmd(editorEl, cmd, val = null) {
      if (!editorEl) return;
      editorEl.focus();
      try {
        document.execCommand(cmd, false, val);
      } catch (_e) {}
      this.notifyEditorChanged(editorEl);
    }

    enhanceToolbarForEditor(editorEl) {
      if (!editorEl || editorEl.dataset.v115WordToolbarBound === '1') return;
      let toolbar = this.findToolbarForEditor(editorEl);
      // Nếu modal khung rich chưa có thanh công cụ (vd: cửa sổ nổi Story Bible / Tham mưu cốt truyện), tạo thanh gọn ngay phía trên!
      if (!toolbar && editorEl.parentElement) {
        toolbar = document.createElement('div');
        toolbar.className = 'flex flex-wrap items-center gap-1 px-2 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 text-[11px] mb-1.5';
        editorEl.parentElement.insertBefore(toolbar, editorEl);
      }
      if (!toolbar || toolbar.dataset.v115WordToolsAdded === '1') {
        editorEl.dataset.v115WordToolbarBound = '1';
        return;
      }
      toolbar.dataset.v115WordToolsAdded = '1';
      editorEl.dataset.v115WordToolbarBound = '1';

      const btnGroup = document.createElement('span');
      btnGroup.className = 'inline-flex flex-wrap items-center gap-1 pl-1.5 ml-1 border-l border-zinc-700/80';

      const makeBtn = (label, title, onClick, extraCls = '') => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.title = title;
        b.className = `px-1.5 py-0.5 rounded-md border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 hover:border-emerald-400/60 text-zinc-200 font-bold text-[10.5px] transition cursor-pointer ${extraCls}`;
        b.addEventListener('mousedown', (ev) => ev.preventDefault());
        b.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          onClick();
        });
        return b;
      };

      const selAllBtn = makeBtn('☑️ Chọn tất cả', 'Chọn tất cả nội dung trong khung này (Ctrl+A)', () => this.selectAllInsideEditor(editorEl), 'text-emerald-200 border-emerald-500/45 bg-emerald-500/10');
      selAllBtn.dataset.v117SelectAll = editorEl.id || 'rich';
      const copyAllBtn = makeBtn('📋 Sao chép tất cả', 'Sao chép toàn bộ nội dung trong khung này', () => this.copyAllFromEditor(editorEl), 'text-sky-200 border-sky-500/45 bg-sky-500/15');
      copyAllBtn.dataset.v117CopyAll = editorEl.id || 'rich';
      btnGroup.appendChild(selAllBtn);
      btnGroup.appendChild(copyAllBtn);
      btnGroup.appendChild(makeBtn('⫷', 'Căn trái (Align Left)', () => this.runWordExecCmd(editorEl, 'justifyLeft')));
      btnGroup.appendChild(makeBtn('⫶', 'Căn giữa (Align Center)', () => this.runWordExecCmd(editorEl, 'justifyCenter')));
      btnGroup.appendChild(makeBtn('⫸', 'Căn phải (Align Right)', () => this.runWordExecCmd(editorEl, 'justifyRight')));
      btnGroup.appendChild(makeBtn('☰', 'Căn đều 2 bên (Justify)', () => this.runWordExecCmd(editorEl, 'justifyFull')));
      btnGroup.appendChild(makeBtn('S̶', 'Gạch ngang chữ', () => this.runWordExecCmd(editorEl, 'strikeThrough')));
      btnGroup.appendChild(makeBtn('•', 'Danh sách chấm đầu dòng', () => this.runWordExecCmd(editorEl, 'insertUnorderedList')));
      btnGroup.appendChild(makeBtn('1.', 'Danh sách đánh số', () => this.runWordExecCmd(editorEl, 'insertOrderedList')));
      btnGroup.appendChild(makeBtn('↶', 'Hoàn tác (Ctrl+Z)', () => this.runWordExecCmd(editorEl, 'undo')));
      btnGroup.appendChild(makeBtn('↷', 'Làm lại (Ctrl+Y)', () => this.runWordExecCmd(editorEl, 'redo')));
      btnGroup.appendChild(makeBtn('🧹', 'Xóa định dạng chữ đang chọn', () => this.runWordExecCmd(editorEl, 'removeFormat')));

      // Chèn vào nhóm bên trái của toolbar (trước badge "Chế độ Word" nếu có)
      const firstFlexGroup = toolbar.querySelector(':scope > div, :scope > span');
      if (firstFlexGroup && toolbar.children.length >= 2 && toolbar.classList.contains('justify-between')) {
        firstFlexGroup.appendChild(btnGroup);
      } else {
        toolbar.appendChild(btnGroup);
      }
    }

    enhanceAllRichEditorsInDom() {
      document.querySelectorAll('[contenteditable="true"]').forEach((el) => {
        if (el.id === 'textarea-chapter-content') return;
        this.enhanceToolbarForEditor(el);
      });
    }

    clearSelections() {
      if (this.selectedImg) {
        this.selectedImg.classList.remove('v115-word-img-selected');
        this.selectedImg = null;
      }
      if (this.selectedTable) {
        this.selectedTable.classList.remove('v115-word-table-selected');
        this.selectedTable = null;
      }
      this.selectedCell = null;
      this.hideFloatingBar();
    }

    hideContextMenu() {
      if (this.contextMenuEl) {
        this.contextMenuEl.remove();
        this.contextMenuEl = null;
      }
    }

    hideFloatingBar() {
      if (this.floatingBarEl) {
        this.floatingBarEl.remove();
        this.floatingBarEl = null;
      }
    }

    showFloatingBarFor(targetEl, type, editorEl) {
      this.hideFloatingBar();
      if (!targetEl || !targetEl.isConnected) return;
      const rect = targetEl.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;

      const bar = document.createElement('div');
      bar.id = 'v115-word-floating-bar';

      const addBtn = (label, onClick, isDanger = false) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        if (isDanger) b.className = 'v115-fb-danger';
        b.addEventListener('mousedown', (ev) => ev.preventDefault());
        b.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          onClick();
        });
        bar.appendChild(b);
      };

      if (type === 'table') {
        addBtn('+ Hàng', () => this.tableInsertRow(targetEl, this.selectedCell, 'after', editorEl));
        addBtn('+ Cột', () => this.tableInsertCol(targetEl, this.selectedCell, 'after', editorEl));
        addBtn('⚖️ Canh đều cột', () => this.tableDistributeColumns(targetEl, editorEl));
        addBtn('🗑️ Xóa bảng', () => this.deleteTable(targetEl, editorEl), true);
      } else if (type === 'img') {
        addBtn('✂️ Cắt ảnh', () => this.openImageCropModal(targetEl, editorEl));
        addBtn('50%', () => this.resizeImage(targetEl, '50%', editorEl));
        addBtn('100%', () => this.resizeImage(targetEl, '100%', editorEl));
        addBtn('🔄 Xoay 90°', () => this.rotateImage90(targetEl, editorEl));
        addBtn('🗑️ Xóa ảnh', () => this.deleteImage(targetEl, editorEl), true);
      }

      document.body.appendChild(bar);
      const barRect = bar.getBoundingClientRect();
      const topPos = Math.max(8, rect.top - barRect.height - 6);
      const leftPos = Math.max(8, Math.min(window.innerWidth - barRect.width - 8, rect.left));
      bar.style.top = `${topPos}px`;
      bar.style.left = `${leftPos}px`;
      this.floatingBarEl = bar;
    }

    // --- CÁC THAO TÁC BẢNG CHUẨN WORD ---
    deleteTable(tableEl, editorEl) {
      if (!tableEl) return;
      const ed = editorEl || tableEl.closest('[contenteditable="true"]');
      const nextP = document.createElement('p');
      nextP.innerHTML = '<br>';
      if (tableEl.parentNode) {
        tableEl.parentNode.insertBefore(nextP, tableEl.nextSibling);
      }
      tableEl.remove();
      this.clearSelections();
      if (ed) {
        ed.focus();
        try {
          const r = document.createRange();
          r.setStart(nextP, 0);
          r.collapse(true);
          const s = window.getSelection();
          s?.removeAllRanges();
          s?.addRange(r);
        } catch (_e) {}
        this.notifyEditorChanged(ed);
      }
      this.toast('🗑️ Đã xóa toàn bộ bảng!', 'success', 1800);
    }

    tableInsertRow(tableEl, cellEl, where = 'after', editorEl) {
      if (!tableEl) return;
      const rows = Array.from(tableEl.rows);
      if (!rows.length) return;
      const curRow = cellEl ? cellEl.closest('tr') : rows[rows.length - 1];
      const colCount = Math.max(1, curRow ? curRow.cells.length : rows[0].cells.length);
      const insertIdx = curRow ? (where === 'before' ? curRow.rowIndex : curRow.rowIndex + 1) : rows.length;
      const newRow = tableEl.insertRow(insertIdx);
      for (let i = 0; i < colCount; i++) {
        const td = newRow.insertCell(i);
        td.innerHTML = '<br>';
        td.style.border = '1px solid #3f3f46';
        td.style.padding = '4px 8px';
      }
      this.notifyEditorChanged(editorEl || tableEl.closest('[contenteditable="true"]'));
      this.toast(where === 'before' ? '⬆️ Đã chèn thêm 1 hàng lên trên.' : '⬇️ Đã chèn thêm 1 hàng xuống dưới.', 'success', 1600);
    }

    tableDeleteRow(tableEl, cellEl, editorEl) {
      if (!tableEl) return;
      if (tableEl.rows.length <= 1) {
        this.deleteTable(tableEl, editorEl);
        return;
      }
      const row = cellEl ? cellEl.closest('tr') : tableEl.rows[tableEl.rows.length - 1];
      if (row) row.remove();
      this.notifyEditorChanged(editorEl || tableEl.closest('[contenteditable="true"]'));
      this.toast('❌ Đã xóa hàng hiện tại.', 'info', 1600);
    }

    tableInsertCol(tableEl, cellEl, where = 'after', editorEl) {
      if (!tableEl) return;
      const colIdx = cellEl ? cellEl.cellIndex : 0;
      const targetIdx = where === 'before' ? colIdx : colIdx + 1;
      Array.from(tableEl.rows).forEach((row, rIdx) => {
        const safeIdx = Math.max(0, Math.min(row.cells.length, targetIdx));
        const newCell = document.createElement(rIdx === 0 && row.cells[0]?.tagName === 'TH' ? 'th' : 'td');
        newCell.innerHTML = '<br>';
        newCell.style.border = '1px solid #3f3f46';
        newCell.style.padding = '4px 8px';
        if (safeIdx >= row.cells.length) row.appendChild(newCell);
        else row.insertBefore(newCell, row.cells[safeIdx]);
      });
      this.notifyEditorChanged(editorEl || tableEl.closest('[contenteditable="true"]'));
      this.toast(where === 'before' ? '⬅️ Đã thêm 1 cột bên trái.' : '➡️ Đã thêm 1 cột bên phải.', 'success', 1600);
    }

    tableDeleteCol(tableEl, cellEl, editorEl) {
      if (!tableEl) return;
      const firstRowCols = tableEl.rows[0]?.cells?.length || 0;
      if (firstRowCols <= 1) {
        this.deleteTable(tableEl, editorEl);
        return;
      }
      const colIdx = cellEl ? cellEl.cellIndex : firstRowCols - 1;
      Array.from(tableEl.rows).forEach((row) => {
        if (row.cells[colIdx]) row.deleteCell(colIdx);
      });
      this.notifyEditorChanged(editorEl || tableEl.closest('[contenteditable="true"]'));
      this.toast('❌ Đã xóa cột hiện tại.', 'info', 1600);
    }

    tableDistributeColumns(tableEl, editorEl) {
      if (!tableEl || !tableEl.rows.length) return;
      const maxCols = Math.max(1, ...Array.from(tableEl.rows).map((r) => r.cells.length));
      const pct = `${(100 / maxCols).toFixed(2)}%`;
      tableEl.style.tableLayout = 'fixed';
      tableEl.style.width = '100%';
      Array.from(tableEl.rows).forEach((row) => {
        Array.from(row.cells).forEach((cell) => {
          cell.style.width = pct;
        });
      });
      this.notifyEditorChanged(editorEl || tableEl.closest('[contenteditable="true"]'));
      this.toast(`⚖️ Đã canh đều độ rộng ${maxCols} cột (${pct}/cột)!`, 'success', 1800);
    }

    tableAlignCells(tableEl, cellEl, alignVal, applyWholeTable, editorEl) {
      if (applyWholeTable && tableEl) {
        Array.from(tableEl.querySelectorAll('td, th')).forEach((c) => {
          c.style.textAlign = alignVal;
        });
      } else if (cellEl) {
        cellEl.style.textAlign = alignVal;
      }
      this.notifyEditorChanged(editorEl || tableEl?.closest?.('[contenteditable="true"]'));
    }

    async copyTableHtml(tableEl) {
      if (!tableEl) return;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const htmlBlob = new Blob([tableEl.outerHTML], { type: 'text/html' });
          const textBlob = new Blob([tableEl.innerText || ''], { type: 'text/plain' });
          await navigator.clipboard.write([new window.ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })]);
        } else {
          await navigator.clipboard.writeText(tableEl.innerText || '');
        }
        this.toast('📋 Đã sao chép bảng (dán được sang Word/Docs)!', 'success', 1800);
      } catch (_e) {
        this.toast('⚠️ Trình duyệt chặn sao chép nhanh — hãy bôi đen bảng và nhấn Ctrl+C.', 'warning', 2200);
      }
    }

    // --- CÁC THAO TÁC ẢNH CHUẨN WORD ---
    deleteImage(imgEl, editorEl) {
      if (!imgEl) return;
      const ed = editorEl || imgEl.closest('[contenteditable="true"]');
      imgEl.remove();
      this.clearSelections();
      if (ed) {
        ed.focus();
        this.notifyEditorChanged(ed);
      }
      this.toast('🗑️ Đã xóa ảnh!', 'success', 1600);
    }

    resizeImage(imgEl, widthVal, editorEl) {
      if (!imgEl) return;
      imgEl.style.width = widthVal === 'auto' ? '' : widthVal;
      imgEl.style.height = 'auto';
      this.notifyEditorChanged(editorEl || imgEl.closest('[contenteditable="true"]'));
      this.showFloatingBarFor(imgEl, 'img', editorEl);
    }

    alignImage(imgEl, align, editorEl) {
      if (!imgEl) return;
      imgEl.style.display = 'block';
      if (align === 'left') {
        imgEl.style.marginLeft = '0';
        imgEl.style.marginRight = 'auto';
      } else if (align === 'center') {
        imgEl.style.marginLeft = 'auto';
        imgEl.style.marginRight = 'auto';
      } else if (align === 'right') {
        imgEl.style.marginLeft = 'auto';
        imgEl.style.marginRight = '0';
      }
      this.notifyEditorChanged(editorEl || imgEl.closest('[contenteditable="true"]'));
      this.showFloatingBarFor(imgEl, 'img', editorEl);
    }

    async copyImageToClipboard(imgEl) {
      if (!imgEl) return;
      try {
        const c = document.createElement('canvas');
        c.width = imgEl.naturalWidth || imgEl.width || 400;
        c.height = imgEl.naturalHeight || imgEl.height || 300;
        const ctx = c.getContext('2d');
        ctx.drawImage(imgEl, 0, 0, c.width, c.height);
        const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
          this.toast('📋 Đã sao chép ảnh vào bộ nhớ tạm!', 'success', 1800);
          return;
        }
      } catch (_e) {}
      try {
        await navigator.clipboard.writeText(imgEl.src || '');
        this.toast('📋 Đã sao chép đường dẫn/dữ liệu ảnh.', 'info', 1800);
      } catch (_e2) {}
    }

    rotateImage90(imgEl, editorEl) {
      if (!imgEl) return;
      try {
        const w = imgEl.naturalWidth || imgEl.width;
        const h = imgEl.naturalHeight || imgEl.height;
        if (!w || !h) return;
        const c = document.createElement('canvas');
        c.width = h;
        c.height = w;
        const ctx = c.getContext('2d');
        ctx.translate(h / 2, w / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(imgEl, -w / 2, -h / 2, w, h);
        imgEl.src = c.toDataURL('image/png');
        this.notifyEditorChanged(editorEl || imgEl.closest('[contenteditable="true"]'));
        this.toast('🔄 Đã xoay ảnh 90°!', 'success', 1600);
      } catch (_e) {
        this.toast('⚠️ Không thể xoay ảnh nguồn ngoài do chính sách CORS của trình duyệt.', 'warning', 2400);
      }
    }

    openImageCropModal(imgEl, editorEl) {
      if (!imgEl) return;
      this._cropTargetImg = imgEl;
      this._cropTargetEditor = editorEl || imgEl.closest('[contenteditable="true"]');
      document.getElementById('modal-v115-word-img-crop')?.remove();

      const modal = document.createElement('div');
      modal.id = 'modal-v115-word-img-crop';
      modal.className = 'fixed inset-0 z-[2147483610] bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5';
      modal.innerHTML = `
        <div class="w-full max-w-2xl rounded-2xl border border-emerald-500/50 bg-zinc-900 text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          <div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
            <h3 class="text-sm font-black text-emerald-300">✂️ Cắt (Crop) Ảnh Trực Quan</h3>
            <button type="button" id="btn-v115-crop-close" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-xs font-bold">✕ Đóng</button>
          </div>
          <div class="p-4 overflow-y-auto space-y-3">
            <div class="flex items-center justify-center bg-zinc-950 rounded-xl border border-zinc-800 p-2 min-h-[220px] max-h-[45vh] overflow-hidden">
              <canvas id="canvas-v115-crop-preview" class="max-w-full max-h-[42vh] rounded-lg"></canvas>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label class="space-y-1">
                <span class="text-zinc-400 font-bold">Cắt Trái (<span id="v115-cl-val">0%</span>)</span>
                <input id="v115-crop-left" type="range" min="0" max="45" value="0" class="w-full accent-emerald-400" />
              </label>
              <label class="space-y-1">
                <span class="text-zinc-400 font-bold">Cắt Phải (<span id="v115-cr-val">0%</span>)</span>
                <input id="v115-crop-right" type="range" min="0" max="45" value="0" class="w-full accent-emerald-400" />
              </label>
              <label class="space-y-1">
                <span class="text-zinc-400 font-bold">Cắt Trên (<span id="v115-ct-val">0%</span>)</span>
                <input id="v115-crop-top" type="range" min="0" max="45" value="0" class="w-full accent-emerald-400" />
              </label>
              <label class="space-y-1">
                <span class="text-zinc-400 font-bold">Cắt Dưới (<span id="v115-cb-val">0%</span>)</span>
                <input id="v115-crop-bottom" type="range" min="0" max="45" value="0" class="w-full accent-emerald-400" />
              </label>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span class="text-zinc-400 font-bold">Tỷ lệ nhanh:</span>
              <button type="button" data-crop-preset="reset" class="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 font-bold">Ảnh gốc</button>
              <button type="button" data-crop-preset="1:1" class="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 font-bold">Vuông 1:1</button>
              <button type="button" data-crop-preset="16:9" class="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 font-bold">Ngang 16:9</button>
              <button type="button" data-crop-preset="2:3" class="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 font-bold">Bìa sách 2:3</button>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button type="button" id="btn-v115-crop-cancel" class="px-3.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold">Hủy</button>
            <button type="button" id="btn-v115-crop-apply" class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow">✅ Áp dụng cắt ảnh</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const canvas = modal.querySelector('#canvas-v115-crop-preview');
      const slL = modal.querySelector('#v115-crop-left');
      const slR = modal.querySelector('#v115-crop-right');
      const slT = modal.querySelector('#v115-crop-top');
      const slB = modal.querySelector('#v115-crop-bottom');
      const natW = imgEl.naturalWidth || imgEl.width || 400;
      const natH = imgEl.naturalHeight || imgEl.height || 300;

      const drawPreview = () => {
        const l = Number(slL.value) / 100;
        const r = Number(slR.value) / 100;
        const t = Number(slT.value) / 100;
        const b = Number(slB.value) / 100;
        modal.querySelector('#v115-cl-val').textContent = `${slL.value}%`;
        modal.querySelector('#v115-cr-val').textContent = `${slR.value}%`;
        modal.querySelector('#v115-ct-val').textContent = `${slT.value}%`;
        modal.querySelector('#v115-cb-val').textContent = `${slB.value}%`;

        const scale = Math.min(1, 560 / Math.max(1, natW), 320 / Math.max(1, natH));
        canvas.width = Math.max(40, Math.round(natW * scale));
        canvas.height = Math.max(40, Math.round(natH * scale));
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
        // Phủ vùng bị cắt mờ đi
        const x1 = Math.round(canvas.width * l);
        const y1 = Math.round(canvas.height * t);
        const cw = Math.max(4, Math.round(canvas.width * (1 - l - r)));
        const ch = Math.max(4, Math.round(canvas.height * (1 - t - b)));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
        ctx.fillRect(0, 0, canvas.width, y1);
        ctx.fillRect(0, y1 + ch, canvas.width, canvas.height - (y1 + ch));
        ctx.fillRect(0, y1, x1, ch);
        ctx.fillRect(x1 + cw, y1, canvas.width - (x1 + cw), ch);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.strokeRect(x1 + 1, y1 + 1, cw - 2, ch - 2);
      };

      [slL, slR, slT, slB].forEach((s) => s.addEventListener('input', drawPreview));
      modal.querySelectorAll('[data-crop-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const p = btn.getAttribute('data-crop-preset');
          if (p === 'reset') {
            slL.value = slR.value = slT.value = slB.value = 0;
          } else {
            const [rw, rh] = p.split(':').map(Number);
            const targetRatio = rw / rh;
            const curRatio = natW / natH;
            if (curRatio > targetRatio) {
              const keepW = (natH * targetRatio) / natW;
              const cutSide = Math.max(0, Math.min(45, Math.round(((1 - keepW) / 2) * 100)));
              slL.value = slR.value = cutSide;
              slT.value = slB.value = 0;
            } else {
              const keepH = (natW / targetRatio) / natH;
              const cutTB = Math.max(0, Math.min(45, Math.round(((1 - keepH) / 2) * 100)));
              slT.value = slB.value = cutTB;
              slL.value = slR.value = 0;
            }
          }
          drawPreview();
        });
      });

      const closeModal = () => modal.remove();
      modal.querySelector('#btn-v115-crop-close')?.addEventListener('click', closeModal);
      modal.querySelector('#btn-v115-crop-cancel')?.addEventListener('click', closeModal);
      modal.querySelector('#btn-v115-crop-apply')?.addEventListener('click', () => {
        try {
          const l = Number(slL.value) / 100;
          const r = Number(slR.value) / 100;
          const t = Number(slT.value) / 100;
          const b = Number(slB.value) / 100;
          const sx = Math.round(natW * l);
          const sy = Math.round(natH * t);
          const sw = Math.max(8, Math.round(natW * (1 - l - r)));
          const sh = Math.max(8, Math.round(natH * (1 - t - b)));
          const out = document.createElement('canvas');
          out.width = sw;
          out.height = sh;
          out.getContext('2d').drawImage(imgEl, sx, sy, sw, sh, 0, 0, sw, sh);
          imgEl.src = out.toDataURL('image/png');
          this.notifyEditorChanged(this._cropTargetEditor);
          this.toast('✂️ Đã cắt ảnh thành công!', 'success', 2000);
          closeModal();
        } catch (_eCrop) {
          this.toast('⚠️ Không thể cắt ảnh ngoài do hạn chế bảo mật CORS.', 'warning', 2500);
        }
      });

      drawPreview();
    }

    openContextMenuAt(x, y, title, items) {
      this.hideContextMenu();
      const menu = document.createElement('div');
      menu.id = 'v115-word-context-menu';
      const ttl = document.createElement('div');
      ttl.className = 'v115-ctx-title';
      ttl.textContent = title;
      menu.appendChild(ttl);

      items.forEach((it) => {
        if (it === 'SEP') {
          const sep = document.createElement('div');
          sep.className = 'v115-ctx-sep';
          menu.appendChild(sep);
          return;
        }
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = it.label;
        if (it.danger) b.className = 'v115-ctx-danger';
        b.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this.hideContextMenu();
          it.action();
        });
        menu.appendChild(b);
      });

      document.body.appendChild(menu);
      const rect = menu.getBoundingClientRect();
      const left = Math.max(8, Math.min(window.innerWidth - rect.width - 8, x));
      const top = Math.max(8, Math.min(window.innerHeight - rect.height - 8, y));
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
      this.contextMenuEl = menu;
    }

    bindGlobalEvents() {
      // 1) Click chọn Ảnh hoặc Bảng trong mọi khung contenteditable
      document.addEventListener('click', (ev) => {
        if (ev.target?.closest?.('#v115-word-context-menu') || ev.target?.closest?.('#v115-word-floating-bar')) {
          return;
        }
        this.hideContextMenu();
        const editorEl = ev.target?.closest?.('[contenteditable="true"]');
        if (!editorEl) {
          this.clearSelections();
          return;
        }
        this.activeEditor = editorEl;
        this.enhanceToolbarForEditor(editorEl);

        const img = ev.target.closest('img');
        if (img && editorEl.contains(img)) {
          this.clearSelections();
          this.selectedImg = img;
          img.classList.add('v115-word-img-selected');
          this.showFloatingBarFor(img, 'img', editorEl);
          return;
        }
        const table = ev.target.closest('table');
        if (table && editorEl.contains(table)) {
          this.clearSelections();
          this.selectedTable = table;
          this.selectedCell = ev.target.closest('td, th');
          table.classList.add('v115-word-table-selected');
          this.showFloatingBarFor(table, 'table', editorEl);
          return;
        }
        this.clearSelections();
      });

      // 2) Phím Backspace / Delete xóa Ảnh & Bảng chuẩn Word!
      document.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Backspace' && ev.key !== 'Delete') return;
        const activeEd = document.activeElement?.closest?.('[contenteditable="true"]') || this.activeEditor;
        if (!activeEd || !activeEd.isConnected) return;

        // A) Đang chọn ảnh -> xóa ngay!
        if (this.selectedImg && activeEd.contains(this.selectedImg)) {
          ev.preventDefault();
          this.deleteImage(this.selectedImg, activeEd);
          return;
        }

        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);

        // B) Nếu bôi đen bao trùm hoặc ở trong bảng
        const anchorNode = range.startContainer;
        const anchorEl = anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement;
        const insideTable = anchorEl?.closest?.('table');

        if (insideTable && activeEd.contains(insideTable)) {
          // Ctrl+Backspace / Ctrl+Delete hoặc toàn bảng đang trống trơn -> xóa sạch bảng!
          const tableTextEmpty = !String(insideTable.innerText || '').trim();
          const wholeTableSelected = !range.collapsed && range.toString().trim() === String(insideTable.innerText || '').trim();
          if (ev.ctrlKey || tableTextEmpty || wholeTableSelected) {
            ev.preventDefault();
            this.deleteTable(insideTable, activeEd);
            return;
          }
        }

        // C) Con trỏ nằm ngay sau Ảnh hoặc Bảng khi nhấn Backspace (hoặc ngay trước khi nhấn Delete)
        if (range.collapsed) {
          if (ev.key === 'Backspace') {
            if (anchorNode.nodeType === 1 && range.startOffset > 0) {
              const prevChild = anchorNode.childNodes[range.startOffset - 1];
              if (prevChild?.tagName === 'IMG') {
                ev.preventDefault();
                this.deleteImage(prevChild, activeEd);
                return;
              }
              if (prevChild?.tagName === 'TABLE') {
                ev.preventDefault();
                this.deleteTable(prevChild, activeEd);
                return;
              }
            }
            if (range.startOffset === 0 && anchorEl && anchorEl !== activeEd) {
              const blockEl = anchorEl.closest('p, div, li') || anchorEl;
              const prevSib = blockEl.previousElementSibling;
              if (prevSib && activeEd.contains(prevSib)) {
                if (prevSib.tagName === 'IMG') {
                  ev.preventDefault();
                  this.deleteImage(prevSib, activeEd);
                  return;
                }
                if (prevSib.tagName === 'TABLE') {
                  ev.preventDefault();
                  this.deleteTable(prevSib, activeEd);
                  return;
                }
              }
            }
          } else if (ev.key === 'Delete') {
            if (anchorNode.nodeType === 1 && range.startOffset < anchorNode.childNodes.length) {
              const nextChild = anchorNode.childNodes[range.startOffset];
              if (nextChild?.tagName === 'IMG') {
                ev.preventDefault();
                this.deleteImage(nextChild, activeEd);
                return;
              }
              if (nextChild?.tagName === 'TABLE') {
                ev.preventDefault();
                this.deleteTable(nextChild, activeEd);
                return;
              }
            }
          }
        }
      }, true);

      // 3) Chuột phải (Context Menu) chuẩn Microsoft Word trên Bảng, Ảnh và Văn bản trong khung soạn thảo!
      document.addEventListener('contextmenu', (ev) => {
        const editorEl = ev.target?.closest?.('[contenteditable="true"]');
        if (!editorEl) return;
        this.activeEditor = editorEl;

        const img = ev.target.closest('img');
        if (img && editorEl.contains(img)) {
          ev.preventDefault();
          this.clearSelections();
          this.selectedImg = img;
          img.classList.add('v115-word-img-selected');
          this.openContextMenuAt(ev.clientX, ev.clientY, '🖼️ Tùy chọn Ảnh (Chuẩn Word)', [
            { label: '📋 Sao chép ảnh', action: () => this.copyImageToClipboard(img) },
            { label: '✂️ Cắt (Crop) ảnh...', action: () => this.openImageCropModal(img, editorEl) },
            { label: '🔄 Xoay ảnh 90°', action: () => this.rotateImage90(img, editorEl) },
            'SEP',
            { label: '📐 Kích cỡ: Nhỏ (35%)', action: () => this.resizeImage(img, '35%', editorEl) },
            { label: '📐 Kích cỡ: Vừa (65%)', action: () => this.resizeImage(img, '65%', editorEl) },
            { label: '📐 Kích cỡ: Đầy khung (100%)', action: () => this.resizeImage(img, '100%', editorEl) },
            { label: '📐 Trả về kích cỡ gốc', action: () => this.resizeImage(img, 'auto', editorEl) },
            'SEP',
            { label: '⫷ Căn trái ảnh', action: () => this.alignImage(img, 'left', editorEl) },
            { label: '⫶ Căn giữa ảnh', action: () => this.alignImage(img, 'center', editorEl) },
            { label: '⫸ Căn phải ảnh', action: () => this.alignImage(img, 'right', editorEl) },
            'SEP',
            { label: '🗑️ Xóa ảnh này', danger: true, action: () => this.deleteImage(img, editorEl) }
          ]);
          return;
        }

        const table = ev.target.closest('table');
        if (table && editorEl.contains(table)) {
          ev.preventDefault();
          const cell = ev.target.closest('td, th');
          this.clearSelections();
          this.selectedTable = table;
          this.selectedCell = cell;
          table.classList.add('v115-word-table-selected');
          this.openContextMenuAt(ev.clientX, ev.clientY, '⊞ Tùy chọn Bảng (Chuẩn Word)', [
            { label: '⬆️ Chèn hàng lên trên', action: () => this.tableInsertRow(table, cell, 'before', editorEl) },
            { label: '⬇️ Chèn hàng xuống dưới', action: () => this.tableInsertRow(table, cell, 'after', editorEl) },
            { label: '⬅️ Chèn cột bên trái', action: () => this.tableInsertCol(table, cell, 'before', editorEl) },
            { label: '➡️ Chèn cột bên phải', action: () => this.tableInsertCol(table, cell, 'after', editorEl) },
            'SEP',
            { label: '⚖️ Canh đều độ rộng các cột', action: () => this.tableDistributeColumns(table, editorEl) },
            { label: '⫷ Căn trái ô hiện tại', action: () => this.tableAlignCells(table, cell, 'left', false, editorEl) },
            { label: '⫶ Căn giữa ô hiện tại', action: () => this.tableAlignCells(table, cell, 'center', false, editorEl) },
            { label: '⫸ Căn phải ô hiện tại', action: () => this.tableAlignCells(table, cell, 'right', false, editorEl) },
            { label: '☰ Canh giữa toàn bộ bảng', action: () => this.tableAlignCells(table, cell, 'center', true, editorEl) },
            'SEP',
            { label: '📋 Sao chép bảng', action: () => this.copyTableHtml(table) },
            { label: '❌ Xóa hàng hiện tại', danger: true, action: () => this.tableDeleteRow(table, cell, editorEl) },
            { label: '❌ Xóa cột hiện tại', danger: true, action: () => this.tableDeleteCol(table, cell, editorEl) },
            { label: '🗑️ Xóa toàn bộ bảng', danger: true, action: () => this.deleteTable(table, editorEl) }
          ]);
        }
      });

      document.addEventListener('scroll', () => {
        this.hideFloatingBar();
      }, true);

      // Khi người dùng focus vào bất kỳ khung contenteditable động nào (modal mới tạo), tự gắn nút Word!
      document.addEventListener('focusin', (ev) => {
        const ed = ev.target?.closest?.('[contenteditable="true"]');
        if (ed) this.enhanceToolbarForEditor(ed);
      });
    }

    init() {
      if (this._initDone) return;
      this._initDone = true;
      this.injectStylesOnce();
      this.bindGlobalEvents();
      this.enhanceAllRichEditorsInDom();
      this.enhancePlainPromptAndBibleTextareas();
      setTimeout(() => {
        this.enhanceAllRichEditorsInDom();
        this.enhancePlainPromptAndBibleTextareas();
      }, 800);
    }
  }

  const v115WordPro = new V115WordRichEditorProSuite();
  window.NoirStudio.wordRichPro = v115WordPro;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => v115WordPro.init());
  } else {
    v115WordPro.init();
  }
})();
