/**
 * ============================================================================
 * MODULE 01: CORE KERNEL, CONSTANTS, REACTIVE STATE, EVENT BUS & MUTEX ENGINE
 * ============================================================================
 * Phiên bản: v38.0.0-SUPREME-MODULAR (2026)
 * Nhiệm vụ:
 *   1. Khởi tạo không gian tên toàn cục duy nhất `window.NoirStudio` (Zero-Conflict).
 *   2. Định nghĩa bảng hằng số `STUDIO_CONSTANTS`, cấu hình IndexedDB, LocalStorage,
 *      6 thư mục ổ cứng cục bộ, từ điển hơn 120 cụm từ sáo rỗng AI tiếng Việt,
 *      và danh mục phím tắt / sự kiện chuẩn hóa toàn hệ thống.
 *   3. Quản lý kho trạng thái trung tâm `window.NoirStudio.state` kèm bộ kiểm tra
 *      toàn vẹn dữ liệu, chụp ảnh trạng thái (State Snapshot) và theo dõi thay đổi.
 *   4. Hệ thống Pub/Sub EventBus đa luồng (`window.NoirStudio.bus`) hỗ trợ Wildcard,
 *      độ ưu tiên (Priority), lịch sử sự kiện, phát lại (Replay), bất đồng bộ (`emitAsync`)
 *      và Middleware chặn lọc lỗi.
 *   5. Hàng đợi khóa bất đồng bộ (`window.NoirStudio.mutex`) hỗ trợ khóa theo tên tài nguyên,
 *      chống xung đột khi vừa lưu tự động 2s vừa đồng bộ ổ cứng hoặc cập nhật Story Bible.
 *   6. Bộ gắn sự kiện DOM chống nhân đôi (`window.NoirStudio.bindOnce`), quản lý phím tắt
 *      (`window.NoirStudio.shortcuts`), bộ đo hiệu năng (`window.NoirStudio.profiler`)
 *      và nhật ký chẩn đoán (`window.NoirStudio.logger`).
 * ============================================================================
 */

(function initNoirStudioCoreKernelModule(globalScope) {
  'use strict';

  const root = globalScope || (typeof window !== 'undefined' ? window : globalThis);
  root.NoirStudio = root.NoirStudio || {};
  root.NoirNovel = root.NoirStudio;
  const NS = root.NoirStudio;

  // ==========================================================================
  // PHẦN 1: BẢNG HẰNG SỐ TRUNG TÂM & DANH MỤC TỪ SÁO RỖNG TIẾNG VIỆT
  // ==========================================================================

  /**
   * Danh sách hơn 120 cụm từ sáo rỗng (AI Clichés) thường gặp khi các mô hình
   * ngôn ngữ viết tiểu thuyết tiếng Việt. Được phân loại chi tiết và tổng hợp
   * thành chuỗi mặc định cho Story Bible (Tab 4) và Máy quét nhịp văn (Module 24).
   */
  const VIETNAMESE_AI_CLICHE_TAXONOMY = {
    PHYSICAL_REACTIONS: [
      'một luồng điện chạy dọc sống lưng',
      'sống lưng lạnh toát',
      'lạnh sống lưng',
      'hít một hơi khí lạnh',
      'hít vào một ngụm khí lạnh',
      'đồng tử co rút',
      'đồng tử co rút mạnh',
      'đồng tử giãn lớn',
      'nắm chặt hai bàn tay đến trắng bệch',
      'móng tay bấm sâu vào lòng bàn tay',
      'trái tim đập loạn nhịp',
      'tim đập thình thịch như muốn nhảy ra khỏi lồng ngực',
      'cổ họng khô khốc',
      'nuốt nước bọt một cách khó khăn',
      'mồ hôi lạnh chảy ròng ròng',
      'mồ hôi lạnh thấm đẫm lưng áo',
      'toàn thân cứng đờ như tượng đá',
      'chân như chôn chặt xuống đất',
      'hơi thở trở nên gấp gáp',
      'máu trong người như đông cứng lại',
      'cảm giác ớn lạnh chạy dọc cột sống',
      'bàn tay vô thức siết chặt'
    ],
    FACIAL_AND_GAZE_CLICHES: [
      'ánh mắt phức tạp',
      'trong mắt hiện lên tia phức tạp',
      'khẽ nhếch môi',
      'nhếch mép tạo thành một đường cong hoàn hảo',
      'nở một nụ cười nửa miệng',
      'nụ cười đầy ẩn ý',
      'nụ cười khổ sở',
      'nụ cười tự giễu',
      'ánh mắt sắc như dao cạo',
      'ánh mắt lạnh như băng ngàn năm',
      'ánh mắt sâu thẳm như vực không đáy',
      'ánh mắt sâu như biển cả',
      'trong mắt lóe lên một tia sáng lạnh lẽo',
      'trong mắt lóe lên tia kiên định',
      'hàng lông mày nhíu chặt',
      'chau mày thành hình chữ Xuyên',
      'khóe môi giật giật',
      'gương mặt không chút gợn sóng',
      'vẻ mặt bình tĩnh đến đáng sợ',
      'ánh mắt lộ rõ vẻ không thể tin nổi'
    ],
    VOICE_AND_SIGH_CLICHES: [
      'thở dài một tiếng',
      'khẽ thở dài trong lòng',
      'buông một tiếng thở dài nặng nề',
      'giọng nói trầm thấp vang lên',
      'giọng nói lạnh lẽo như từ địa ngục vọng về',
      'giọng nói bình thản như không',
      'giọng nói mang theo vài phần bất đắc dĩ',
      'giọng nói khàn đặc',
      'cất giọng đều đều không chút cảm xúc',
      'từng chữ từng chữ rơi xuống nặng như ngàn cân',
      'lời nói như búa tạ giáng xuống',
      'im lặng một hồi lâu mới lên tiếng'
    ],
    ATMOSPHERE_AND_ENVIRONMENT_CLICHES: [
      'không khí như đặc quánh lại',
      'không khí rơi vào trầm mặc',
      'bầu không khí trở nên ngột ngạt đến cực điểm',
      'sự im lặng đáng sợ bao trùm',
      'im lặng đến mức nghe thấy tiếng kim rơi',
      'thời gian như ngừng trôi',
      'không gian như đóng băng',
      'màn đêm buông xuống nuốt chửng vạn vật',
      'ánh đèn vàng vọt hắt bóng dài cô độc',
      'cơn gió lạnh lẽo thổi qua mang theo mùi máu tanh',
      'bóng tối như con quái vật khổng lồ',
      'bầu trời âm u như báo hiệu cơn bão lớn sắp tới'
    ],
    ABSTRACT_SUMMARY_AND_TELLING_CLICHES: [
      'không khỏi cảm thán',
      'trong lòng dâng lên một cảm giác khó tả',
      'một cảm xúc hỗn độn trào dâng',
      'tâm trạng rối như tơ vò',
      'ngổn ngang trăm mối tơ vò',
      'như có tảng đá lớn đè nặng trong ngực',
      'cảm thấy một sự bất an mơ hồ',
      'linh cảm chẳng lành',
      'số phận trêu ngươi',
      'bánh xe vận mệnh bắt đầu quay',
      'một chương mới của cuộc đời chính thức mở ra',
      'nhưng đó là chuyện của sau này',
      'không ai biết rằng quyết định này sẽ thay đổi tất cả',
      'chính thức bắt đầu cuộc hành trình đầy sóng gió',
      'tất cả chỉ mới là sự khởi đầu',
      'bão táp thực sự vẫn còn ở phía trước'
    ],
    TRANSLATION_ESE_AND_AWKWARD_PHRASING: [
      'hổ躯 chấn động',
      'thân thể chấn động mạnh',
      'trong lòng lộp bộp một tiếng',
      'khóe miệng co giật kịch liệt',
      'đầy mặt hắc tuyến',
      'trên trán hiện lên ba vạch đen',
      'toàn trường chết lặng',
      'hít sâu một hơi áp chế lửa giận',
      'con ngươi猛 nhiên co rụt lại',
      'khí thế bùng nổ dữ dội',
      'áp lực vô hình bao phủ khắp căn phòng',
      'không nói hai lời liền lao tới',
      'ánh mắt như muốn ăn tươi nuốt sống',
      'nụ cười làm khuynh đảo chúng sinh'
    ]
  };

  /**
   * Trải phẳng toàn bộ từ điển từ sáo rỗng thành mảng duy nhất không trùng lặp.
   */
  const DEFAULT_ANTI_CLICHE_ARRAY = (function buildDefaultAntiClicheList() {
    const seen = new Set();
    const list = [];
    const groups = Object.keys(VIETNAMESE_AI_CLICHE_TAXONOMY);
    for (let i = 0; i < groups.length; i++) {
      const items = VIETNAMESE_AI_CLICHE_TAXONOMY[groups[i]] || [];
      for (let j = 0; j < items.length; j++) {
        const normalized = String(items[j] || '').trim().toLowerCase();
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          list.push(items[j].trim());
        }
      }
    }
    return list;
  })();

  /**
   * Danh mục các sự kiện chuẩn hóa trên toàn bộ 30 Module của Studio.
   */
  const STUDIO_EVENTS = Object.freeze({
    // Sự kiện vòng đời hệ thống
    KERNEL_READY: 'kernel:ready',
    MODULE_REGISTERED: 'kernel:module_registered',
    BOOT_STARTED: 'boot:started',
    BOOT_PROGRESS: 'boot:progress',
    BOOT_COMPLETED: 'boot:completed',
    BOOT_ERROR: 'boot:error',

    // Sự kiện điều hướng 6 màn hình
    SCREEN_CHANGED: 'nav:screen_changed',
    MODAL_OPENED: 'ui:modal_opened',
    MODAL_CLOSED: 'ui:modal_closed',
    THEME_CHANGED: 'ui:theme_changed',
    ZEN_MODE_TOGGLED: 'ui:zen_mode_toggled',
    TYPEWRITER_TOGGLED: 'ui:typewriter_toggled',

    // Sự kiện bản thảo & cây chương
    CHAPTER_CREATED: 'chapter:created',
    CHAPTER_SELECTED: 'chapter:selected',
    CHAPTER_UPDATED: 'chapter:updated',
    CHAPTER_TITLE_CHANGED: 'chapter:title_changed',
    CHAPTER_STATUS_CHANGED: 'chapter:status_changed',
    CHAPTER_DELETED: 'chapter:deleted',
    CHAPTER_REORDERED: 'chapter:reordered',
    CHAPTER_FILTER_CHANGED: 'chapter:filter_changed',
    CHAPTER_APPROVED: 'chapter:approved',
    MANUSCRIPT_INPUT: 'manuscript:input',
    MANUSCRIPT_STATS_UPDATED: 'manuscript:stats_updated',

    // Sự kiện lưu tự động 3 lớp & phiên bản
    AUTOSAVE_TRIGGERED: 'autosave:triggered',
    AUTOSAVE_COMPLETED: 'autosave:completed',
    AUTOSAVE_FAILED: 'autosave:failed',
    VERSION_SNAPSHOT_CREATED: 'version:snapshot_created',
    VERSION_RESTORED: 'version:restored',
    VERSION_DELETED: 'version:deleted',
    UNDO_PERFORMED: 'history:undo',
    REDO_PERFORMED: 'history:redo',

    // Sự kiện kiểm duyệt AI Diff kiểu Google Docs
    AI_DIFF_ACTIVATED: 'aidiff:activated',
    AI_DIFF_SEGMENT_ACCEPTED: 'aidiff:segment_accepted',
    AI_DIFF_SEGMENT_REJECTED: 'aidiff:segment_rejected',
    AI_DIFF_ALL_ACCEPTED: 'aidiff:all_accepted',
    AI_DIFF_ALL_REJECTED: 'aidiff:all_rejected',

    // Sự kiện Story Bible & BM25 RAG
    BIBLE_UPDATED: 'bible:updated',
    BIBLE_LOCK_TOGGLED: 'bible:lock_toggled',
    CHARACTER_ADDED: 'bible:character_added',
    CHARACTER_UPDATED: 'bible:character_updated',
    CHARACTER_REMOVED: 'bible:character_removed',
    KNOWLEDGE_UPDATED: 'bible:knowledge_updated',
    CLUES_UPDATED: 'bible:clues_updated',
    ANTI_CLICHE_UPDATED: 'bible:anti_cliche_updated',
    SCENE_MARKER_ADDED: 'scene:marker_added',
    SCENE_MARKER_REMOVED: 'scene:marker_removed',
    RAG_INDEX_REBUILT: 'rag:index_rebuilt',
    RAG_SEARCH_COMPLETED: 'rag:search_completed',

    // Sự kiện AI & 5 Chế độ
    API_KEY_UPDATED: 'ai:api_key_updated',
    API_KEY_VERIFIED: 'ai:api_key_verified',
    MODEL_SELECTED: 'ai:model_selected',
    MODE_SELECTED: 'ai:mode_selected',
    SYSPROMPT_UPDATED: 'ai:sysprompt_updated',
    MASTER_PROMPT_SYNTHESIZED: 'ai:master_prompt_synthesized',
    AI_EXECUTION_STARTED: 'ai:execution_started',
    AI_EXECUTION_COMPLETED: 'ai:execution_completed',
    AI_EXECUTION_FAILED: 'ai:execution_failed',
    MODE5_DIAGRAM_RENDERED: 'ai:mode5_diagram_rendered',

    // Sự kiện Đồng hồ Pomodoro, Âm thanh & Giao diện chữ
    POMODORO_TICK: 'pomodoro:tick',
    POMODORO_STARTED: 'pomodoro:started',
    POMODORO_PAUSED: 'pomodoro:paused',
    POMODORO_RESET: 'pomodoro:reset',
    POMODORO_PHASE_CHANGED: 'pomodoro:phase_changed',
    AUDIO_PRESET_CHANGED: 'audio:preset_changed',
    TYPOGRAPHY_UPDATED: 'typography:updated',
    BG_EFFECT_CHANGED: 'ambience:bg_effect_changed',

    // Sự kiện Ổ cứng cục bộ (File System Access API)
    FS_CONNECTED: 'fs:connected',
    FS_DISCONNECTED: 'fs:disconnected',
    FS_FILE_WRITTEN: 'fs:file_written',
    FS_SYNC_COMPLETED: 'fs:sync_completed',
    FS_ERROR: 'fs:error'
  });

  /**
   * Cấu hình khung mẫu Story Bible mặc định (Khi người dùng mở lần đầu).
   */
  const DEFAULT_STORY_BIBLE_TEMPLATE_FRAME = [
    '# 🏛️ KHUNG CẤU TRÚC STORY BIBLE CHUẨN (BẢN KHUÔN MẪU)',
    '',
    '## 1. THẾ GIỚI QUAN & BỐI CẢNH CỐT LÕI',
    '- Thời đại / Không gian chính:',
    '- Bầu không khí chủ đạo (Tone & Mood):',
    '- Các thế lực / Tổ chức ngầm đang chi phối:',
    '',
    '## 2. QUY TẮC BẤT KHẢ XÂM PHẠM (HARD RULES)',
    '- Giới hạn sức mạnh / Công nghệ / Tâm lý:',
    '- Những điều tuyệt đối không thể xảy ra trong thế giới này:',
    '- Quy ước hội thoại bắt buộc: - Câu thoại (Tên nhân vật)',
    '',
    '## 3. TÓM TẮT DÒNG THỜI GIAN & CÁC CHƯƠNG ĐÃ DUYỆT',
    '- Khởi đầu:',
    '- Các bước ngoặt lớn đã xảy ra:',
    '- Tình trạng hiện tại của nhân vật chính:',
    '',
    '## 4. GHI CHÚ TRỌNG TÂM CHO CHƯƠNG TIẾP THEO',
    '- Mục tiêu cốt truyện cần đẩy tới:',
    '- Bí mật chưa được phép tiết lộ:'
  ].join('\n');

  /**
   * Bảng hằng số trung tâm của Studio (`window.NoirStudio.constants`).
   */
  const STUDIO_CONSTANTS = Object.freeze({
    VERSION: '38.0.0-SUPREME-MODULAR',
    RELEASE_DATE: '2026',
    STUDIO_TITLE: 'Web Viết Tiểu Thuyết Của Bi — Studio Sáng Tác Đa Nền Tảng',
    DB_NAME: 'NoirPsychStudio_LocalDB_v1',
    DB_VERSION: 3,

    STORES: Object.freeze({
      WORKSPACE_HANDLES: 'workspace_handles',
      CHAPTERS: 'chapters',
      STORY_BIBLE: 'story_bible',
      RAG_CHUNKS: 'rag_chunks',
      STATE_CACHE: 'state_cache'
    }),

    STORAGE_KEYS: Object.freeze({
      API_KEY: 'noir_gemini_api_key',
      SELECTED_MODEL: 'noir_selected_gemini_model',
      EXECUTION_MODE: 'noir_selected_ai_mode',
      TARGET_WORDS: 'noir_target_word_count',
      TEMPERATURE: 'noir_ai_temperature',
      THEME: 'noir_studio_theme_mode',
      FONT_FAMILY: 'noir_editor_font_family',
      FONT_SIZE: 'noir_editor_font_size',
      LINE_HEIGHT: 'noir_editor_line_height',
      PAGE_WIDTH: 'noir_editor_page_width',
      BG_EFFECT: 'noir_ambient_bg_effect',
      BIBLE_TEMPLATE: 'noir_s10_bible_template_frame',
      BIBLE_RENDERED: 'noir_s10_rendered_bible_content',
      BIBLE_LOCKED: 'noir_s10_bible_template_locked',
      CHARACTERS: 'noir_s10_character_profiles_v1',
      KNOWLEDGE_MATRIX: 'noir_s10_knowledge_matrix_v1',
      CLUES_LEDGER: 'noir_s10_clues_ledger_v1',
      ANTI_CLICHE: 'noir_s10_anti_cliche_blacklist_v1',
      SCENE_MARKERS: 'noir_s18_scene_pov_markers_v1',
      MODE_OUTPUTS: 'noir_s20_quad_mode_outputs_v1',
      MODE_PROMPTS: 'noir_s20_custom_mode_sysprompts_v1',
      VERSION_VAULT: 'noir_v36_version_history_vault',
      AI_DIFF_STATE: 'noir_v36_active_ai_diff_state',
      SCRATCHPAD: 'noir_quick_scratchpad_notes',
      POMODORO_STATE: 'noir_unified_pomodoro_state_v36',
      DAILY_GOAL: 'noir_v38_daily_word_goal_state'
    }),

    LOCAL_FOLDERS: Object.freeze([
      '01_Chuong_Goc_Chua_Duyet',
      '02_Chuong_Da_Duyet',
      '03_Story_Bible_Local',
      '04_Chi_Muc_Chong_Quen',
      '05_Bang_Trang_Y_Tuong',
      '06_Sao_Luu_Code_Va_Ban_Thao'
    ]),

    LOCAL_FOLDER_DESCRIPTIONS: Object.freeze({
      '01_Chuong_Goc_Chua_Duyet': 'Chứa các chương đang ở trạng thái Bản Nháp (DRAFT) tự động lưu trực tiếp ra file .txt/.md.',
      '02_Chuong_Da_Duyet': 'Chứa các chương đã được tác giả bấm Duyệt & Chốt Bản Thảo (APPROVED) chính thức.',
      '03_Story_Bible_Local': 'Chứa hồ sơ Story Bible, Hồ sơ nhân vật, Ma trận Ai Biết Gì, Sổ cái Phục bút và Danh sách từ cấm.',
      '04_Chi_Muc_Chong_Quen': 'Chứa chỉ mục tìm kiếm chống quên BM25 (RAG Chunks) để tra cứu tình tiết cũ 0 Token.',
      '05_Bang_Trang_Y_Tuong': 'Chứa nội dung Bảng trắng nháp nhanh ý tưởng, mốc chuyển cảnh và ghi chú chợt lóe.',
      '06_Sao_Luu_Code_Va_Ban_Thao': 'Chứa các bản sao lưu toàn diện dự án (.json) và kho lịch sử phiên bản Time-Machine.'
    }),

    SCREENS: Object.freeze({
      SCREEN_1_WRITE: 'SCREEN_1_WRITE',
      SCREEN_2_FILES: 'SCREEN_2_FILES',
      SCREEN_3_AI: 'SCREEN_3_AI',
      SCREEN_4_BIBLE: 'SCREEN_4_BIBLE',
      SCREEN_5_AMBIENCE: 'SCREEN_5_AMBIENCE',
      SCREEN_6_SYSTEM: 'SCREEN_6_SYSTEM'
    }),

    EXECUTION_MODES: Object.freeze({
      MODE_1_DRAFT: 'MODE_1_DRAFT',
      MODE_2_BRAINSTORM: 'MODE_2_BRAINSTORM',
      MODE_3_AUDIT: 'MODE_3_AUDIT',
      MODE_4_REVIEW: 'MODE_4_REVIEW',
      MODE_5_DIAGRAM: 'MODE_5_DIAGRAM'
    }),

    DEFAULT_ANTI_CLICHE: DEFAULT_ANTI_CLICHE_ARRAY,
    ANTI_CLICHE_TAXONOMY: VIETNAMESE_AI_CLICHE_TAXONOMY,
    DEFAULT_BIBLE_TEMPLATE_FRAME: DEFAULT_STORY_BIBLE_TEMPLATE_FRAME,
    EVENTS: STUDIO_EVENTS,

    LIMITS: Object.freeze({
      AUTOSAVE_DEBOUNCE_MS: 2000,
      UNDO_STACK_MAX_DEPTH: 120,
      VERSION_VAULT_MAX_SNAPSHOTS: 60,
      EMERGENCY_VAULT_RING_SIZE: 15,
      EVENT_HISTORY_MAX_ITEMS: 400,
      LOGGER_MAX_ENTRIES: 600,
      MIN_TARGET_WORDS: 300,
      MAX_TARGET_WORDS: 15000,
      DEFAULT_TARGET_WORDS: 3500
    })
  });

  NS.constants = STUDIO_CONSTANTS;

  // ==========================================================================
  // PHẦN 2: KHO TRẠNG THÁI TRUNG TÂM (CENTRAL REACTIVE STATE) & BỘ TỰ PHỤC HỒI
  // ==========================================================================

  /**
   * Tạo cấu trúc trạng thái mặc định chuẩn cho toàn bộ ứng dụng.
   * Mọi khóa trong `NS.state` đều được giữ nguyên tên để tương thích 100%
   * với tất cả 30 Module trong hệ thống.
   */
  function createDefaultStudioState() {
    const todayKey = new Date().toISOString().slice(0, 10);
    return {
      bootstrapped: false,
      bootTimestamp: Date.now(),
      activeScreen: STUDIO_CONSTANTS.SCREENS.SCREEN_1_WRITE,
      previousScreen: STUDIO_CONSTANTS.SCREENS.SCREEN_1_WRITE,

      // Quản lý danh sách chương & bộ lọc
      chapters: [],
      activeChapterId: null,
      chapterFilter: 'ALL',

      // Chỉ mục chống quên cục bộ BM25 (0 Token)
      ragChunks: [],

      // Hồ sơ Story Bible (Tab 4)
      storyBible: {
        templateFrame: STUDIO_CONSTANTS.DEFAULT_BIBLE_TEMPLATE_FRAME,
        renderedContent: '',
        templateLocked: false,
        characters: [],
        knowledgeMatrix: [],
        cluesLedger: [],
        antiClicheBlacklist: STUDIO_CONSTANTS.DEFAULT_ANTI_CLICHE.join(', ')
      },

      // Danh sách mốc chuyển phân cảnh / đổi góc nhìn POV
      sceneMarkers: [],

      // Đầu ra và Prompt hệ thống của 5 Chế độ AI (Tab 3)
      modeOutputs: {
        MODE_1_DRAFT: '',
        MODE_2_BRAINSTORM: '',
        MODE_3_AUDIT: '',
        MODE_4_REVIEW: '',
        MODE_5_DIAGRAM: ''
      },
      modePrompts: {},
      activeOutputMode: 'MODE_1_DRAFT',
      synthesizedMasterPrompt: '',

      // Kho lưu trữ phiên bản Time-Machine (Tab 6)
      versionVault: [],
      selectedVersionId: null,

      // Trạng thái kiểm duyệt thay đổi AI kiểu Google Docs (Tab 1)
      aiDiffState: {
        active: false,
        originalText: '',
        mergedText: '',
        segments: []
      },

      // Ngăn xếp Hoàn tác / Làm lại (Undo / Redo)
      undoStack: [],
      redoStack: [],
      isUndoRedoAction: false,

      // Đồng hồ tập trung Pomodoro đồng bộ 2 chiều (Tab 5 + Thanh nổi)
      pomodoro: {
        isRunning: false,
        mode: 'WORK', // 'WORK' | 'BREAK'
        workMinutes: 25,
        breakMinutes: 5,
        remainingSeconds: 25 * 60,
        completedSessions: 0,
        wordsAtSessionStart: 0,
        intervalId: null,
        collapsed: false
      },

      // Mục tiêu số từ viết trong ngày
      dailyGoal: {
        targetWords: 2000,
        baselineWords: 0,
        dateKey: todayKey
      },

      // Tay cầm thư mục ổ cứng cục bộ (File System Access API)
      localRootHandle: null,
      localSubHandles: {},

      // Trạng thái âm thanh không gian & lặp đoạn A-B
      audioState: {
        activePreset: 'OFF',
        volume: 0.45,
        abLoopEnabled: false,
        pointA: 0,
        pointB: 60
      },

      // Trạng thái hiển thị & chế độ tập trung
      bgEffect: 'FIREFLIES',
      typewriterMode: false,
      zenMode: false,

      // Số liệu thống kê phiên làm việc hiện tại
      sessionMetrics: {
        sessionStartAt: Date.now(),
        keystrokesCount: 0,
        aiRequestsCount: 0,
        aiTokensEstimated: 0,
        autoSavesCount: 0,
        manualSavesCount: 0,
        chaptersApprovedInSession: 0
      }
    };
  }

  /**
   * Khởi tạo hoặc hợp nhất trạng thái hiện có với trạng thái mặc định.
   */
  const initialDefaultState = createDefaultStudioState();
  if (!NS.state || typeof NS.state !== 'object') {
    NS.state = initialDefaultState;
  } else {
    const keys = Object.keys(initialDefaultState);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (typeof NS.state[k] === 'undefined') {
        NS.state[k] = initialDefaultState[k];
      }
    }
  }

  // Khởi tạo bảng đăng ký Module
  NS.modules = NS.modules || {};

  /**
   * Lớp Quản lý và Kiểm định Toàn vẹn Trạng thái (`StudioStateGuardian`).
   * Đảm bảo không bao giờ xảy ra lỗi `undefined` hoặc hỏng cấu trúc mảng/đối tượng
   * khi nạp dữ liệu cũ từ LocalStorage / IndexedDB hoặc file JSON bên ngoài.
   */
  class StudioStateGuardian {
    constructor(stateRef) {
      this.state = stateRef;
      this.watchers = new Map();
      this.snapshotHistory = [];
      this.maxSnapshots = 20;
    }

    /**
     * Sao chép sâu (Deep Clone) an toàn cho đối tượng JSON, bỏ qua các thuộc tính
     * không thể tuần tự hóa như `FileSystemDirectoryHandle` hoặc `intervalId`.
     */
    safeClone(obj) {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }
      if (Array.isArray(obj)) {
        const arrCopy = [];
        for (let i = 0; i < obj.length; i++) {
          arrCopy.push(this.safeClone(obj[i]));
        }
        return arrCopy;
      }
      const copy = {};
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k === 'localRootHandle' || k === 'localSubHandles' || k === 'intervalId') {
          continue;
        }
        const val = obj[k];
        if (typeof val !== 'function') {
          copy[k] = this.safeClone(val);
        }
      }
      return copy;
    }

    /**
     * Kiểm tra và tự động sửa chữa cấu trúc `NS.state` nếu có trường bị hỏng.
     */
    validateAndHealState() {
      const report = {
        healedFields: [],
        timestamp: Date.now(),
        healthy: true
      };

      const defaults = createDefaultStudioState();

      // 1. Kiểm tra danh sách chương
      if (!Array.isArray(this.state.chapters)) {
        this.state.chapters = [];
        report.healedFields.push('chapters');
      } else {
        for (let i = 0; i < this.state.chapters.length; i++) {
          const ch = this.state.chapters[i];
          if (!ch || typeof ch !== 'object') {
            this.state.chapters.splice(i, 1);
            i--;
            report.healedFields.push('chapters[invalid_item]');
            continue;
          }
          if (!ch.id || typeof ch.id !== 'string') {
            ch.id = 'chap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
            report.healedFields.push('chapter.id');
          }
          if (typeof ch.title !== 'string' || !ch.title.trim()) {
            ch.title = 'Chương ' + (i + 1) + ': Chưa đặt tiêu đề';
            report.healedFields.push('chapter.title');
          }
          if (typeof ch.content !== 'string') {
            ch.content = String(ch.content || '');
            report.healedFields.push('chapter.content');
          }
          if (typeof ch.beats !== 'string') {
            ch.beats = String(ch.beats || '');
          }
          if (ch.status !== 'DRAFT' && ch.status !== 'APPROVED') {
            ch.status = 'DRAFT';
            report.healedFields.push('chapter.status');
          }
          if (typeof ch.updatedAt !== 'number' || Number.isNaN(ch.updatedAt)) {
            ch.updatedAt = Date.now();
          }
          if (typeof ch.createdAt !== 'number' || Number.isNaN(ch.createdAt)) {
            ch.createdAt = ch.updatedAt;
          }
        }
      }

      // 2. Kiểm tra Story Bible
      if (!this.state.storyBible || typeof this.state.storyBible !== 'object') {
        this.state.storyBible = defaults.storyBible;
        report.healedFields.push('storyBible');
      } else {
        const sb = this.state.storyBible;
        if (typeof sb.templateFrame !== 'string') {
          sb.templateFrame = defaults.storyBible.templateFrame;
          report.healedFields.push('storyBible.templateFrame');
        }
        if (typeof sb.renderedContent !== 'string') {
          sb.renderedContent = '';
          report.healedFields.push('storyBible.renderedContent');
        }
        if (typeof sb.templateLocked !== 'boolean') {
          sb.templateLocked = Boolean(sb.templateLocked);
        }
        if (!Array.isArray(sb.characters)) {
          sb.characters = [];
          report.healedFields.push('storyBible.characters');
        }
        if (!Array.isArray(sb.knowledgeMatrix)) {
          sb.knowledgeMatrix = [];
          report.healedFields.push('storyBible.knowledgeMatrix');
        }
        if (!Array.isArray(sb.cluesLedger)) {
          sb.cluesLedger = [];
          report.healedFields.push('storyBible.cluesLedger');
        }
        if (typeof sb.antiClicheBlacklist !== 'string') {
          sb.antiClicheBlacklist = defaults.storyBible.antiClicheBlacklist;
          report.healedFields.push('storyBible.antiClicheBlacklist');
        }
      }

      // 3. Kiểm tra 5 chế độ đầu ra AI
      if (!this.state.modeOutputs || typeof this.state.modeOutputs !== 'object') {
        this.state.modeOutputs = defaults.modeOutputs;
        report.healedFields.push('modeOutputs');
      } else {
        const modeKeys = Object.keys(defaults.modeOutputs);
        for (let i = 0; i < modeKeys.length; i++) {
          const mk = modeKeys[i];
          if (typeof this.state.modeOutputs[mk] !== 'string') {
            this.state.modeOutputs[mk] = '';
            report.healedFields.push('modeOutputs.' + mk);
          }
        }
      }

      // 4. Kiểm tra các mảng và đối tượng cốt lõi khác
      if (!Array.isArray(this.state.ragChunks)) {
        this.state.ragChunks = [];
        report.healedFields.push('ragChunks');
      }
      if (!Array.isArray(this.state.sceneMarkers)) {
        this.state.sceneMarkers = [];
        report.healedFields.push('sceneMarkers');
      }
      if (!Array.isArray(this.state.versionVault)) {
        this.state.versionVault = [];
        report.healedFields.push('versionVault');
      }
      if (!Array.isArray(this.state.undoStack)) {
        this.state.undoStack = [];
      }
      if (!Array.isArray(this.state.redoStack)) {
        this.state.redoStack = [];
      }
      if (!this.state.aiDiffState || typeof this.state.aiDiffState !== 'object') {
        this.state.aiDiffState = defaults.aiDiffState;
        report.healedFields.push('aiDiffState');
      }
      if (!this.state.pomodoro || typeof this.state.pomodoro !== 'object') {
        this.state.pomodoro = defaults.pomodoro;
        report.healedFields.push('pomodoro');
      }
      if (!this.state.dailyGoal || typeof this.state.dailyGoal !== 'object') {
        this.state.dailyGoal = defaults.dailyGoal;
        report.healedFields.push('dailyGoal');
      }

      report.healthy = report.healedFields.length === 0;
      return report;
    }

    /**
     * Lấy chương đang mở hiện tại trong `NS.state`.
     */
    getActiveChapter() {
      const chapters = this.state.chapters || [];
      if (!chapters.length) return null;
      const targetId = this.state.activeChapterId;
      if (targetId) {
        for (let i = 0; i < chapters.length; i++) {
          if (chapters[i] && chapters[i].id === targetId) {
            return chapters[i];
          }
        }
      }
      return chapters[0] || null;
    }

    /**
     * Tính tổng số từ của toàn bộ các chương trong dự án (dùng bộ đếm chuẩn hoặc ước tính).
     */
    computeProjectSummaryMetrics() {
      const chapters = Array.isArray(this.state.chapters) ? this.state.chapters : [];
      let totalChapters = chapters.length;
      let approvedChapters = 0;
      let draftChapters = 0;
      let totalChars = 0;
      let totalWordsApprox = 0;

      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        if (!ch) continue;
        if (ch.status === 'APPROVED') {
          approvedChapters++;
        } else {
          draftChapters++;
        }
        const content = String(ch.content || '').trim();
        totalChars += content.length;
        if (content.length > 0) {
          const words = content.split(/\s+/).filter(Boolean).length;
          totalWordsApprox += words;
        }
      }

      const sb = this.state.storyBible || {};
      return {
        totalChapters,
        approvedChapters,
        draftChapters,
        totalChars,
        totalWordsApprox,
        charactersCount: Array.isArray(sb.characters) ? sb.characters.length : 0,
        knowledgeCount: Array.isArray(sb.knowledgeMatrix) ? sb.knowledgeMatrix.length : 0,
        cluesCount: Array.isArray(sb.cluesLedger) ? sb.cluesLedger.length : 0,
        sceneMarkersCount: Array.isArray(this.state.sceneMarkers) ? this.state.sceneMarkers.length : 0,
        ragChunksCount: Array.isArray(this.state.ragChunks) ? this.state.ragChunks.length : 0,
        versionSnapshotsCount: Array.isArray(this.state.versionVault) ? this.state.versionVault.length : 0
      };
    }

    /**
     * Lưu một bản chụp nhanh (In-memory Snapshot) phục vụ gỡ lỗi hoặc hoàn nguyên tức thời.
     */
    captureMemorySnapshot(label) {
      const snap = {
        id: 'mem_snap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        label: String(label || 'Chụp trạng thái bộ nhớ'),
        createdAt: Date.now(),
        activeChapterId: this.state.activeChapterId,
        chaptersCount: Array.isArray(this.state.chapters) ? this.state.chapters.length : 0,
        payload: this.safeClone({
          chapters: this.state.chapters,
          activeChapterId: this.state.activeChapterId,
          storyBible: this.state.storyBible,
          sceneMarkers: this.state.sceneMarkers,
          modeOutputs: this.state.modeOutputs
        })
      };
      this.snapshotHistory.unshift(snap);
      if (this.snapshotHistory.length > this.maxSnapshots) {
        this.snapshotHistory.length = this.maxSnapshots;
      }
      return snap;
    }

    /**
     * Đăng ký hàm theo dõi khi một đường dẫn khóa trạng thái thay đổi.
     */
    watch(pathKey, callback) {
      if (!pathKey || typeof callback !== 'function') return () => {};
      if (!this.watchers.has(pathKey)) {
        this.watchers.set(pathKey, new Set());
      }
      const set = this.watchers.get(pathKey);
      set.add(callback);
      return () => {
        set.delete(callback);
      };
    }

    /**
     * Thông báo cho các watcher của một khóa cụ thể.
     */
    notifyWatchers(pathKey, newValue, oldValue) {
      const set = this.watchers.get(pathKey);
      if (!set || !set.size) return;
      set.forEach((cb) => {
        try {
          cb(newValue, oldValue, pathKey);
        } catch (err) {
          console.error('[NoirStudio StateGuardian] Lỗi thực thi Watcher tại khóa:', pathKey, err);
        }
      });
    }
  }

  NS.stateGuardian = new StudioStateGuardian(NS.state);

  // ==========================================================================
  // PHẦN 3: HỆ THỐNG NHẬT KÝ CHẨN ĐOÁN CÓ CẤU TRÚC (STRUCTURED TELEMETRY LOGGER)
  // ==========================================================================

  class StudioTelemetryLogger {
    constructor(maxEntries) {
      this.maxEntries = maxEntries || STUDIO_CONSTANTS.LIMITS.LOGGER_MAX_ENTRIES;
      this.entries = [];
      this.levelWeights = {
        DEBUG: 10,
        INFO: 20,
        WARN: 30,
        ERROR: 40,
        CRITICAL: 50
      };
      this.minConsoleLevel = 'INFO';
      this.counters = {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        CRITICAL: 0
      };
    }

    /**
     * Ghi một bản ghi nhật ký mới vào bộ đệm vòng (Ring Buffer).
     */
    log(level, moduleName, message, meta) {
      const normalizedLevel = this.levelWeights[level] ? level : 'INFO';
      this.counters[normalizedLevel] = (this.counters[normalizedLevel] || 0) + 1;

      const entry = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: Date.now(),
        isoTime: new Date().toISOString(),
        level: normalizedLevel,
        module: String(moduleName || 'CoreKernel'),
        message: String(message || ''),
        meta: meta !== undefined ? this._sanitizeMeta(meta) : null
      };

      this.entries.push(entry);
      if (this.entries.length > this.maxEntries) {
        this.entries.shift();
      }

      const currentWeight = this.levelWeights[normalizedLevel] || 20;
      const minWeight = this.levelWeights[this.minConsoleLevel] || 20;

      if (currentWeight >= minWeight && typeof console !== 'undefined') {
        const prefix = `[NoirStudio][${entry.module}][${normalizedLevel}]`;
        if (normalizedLevel === 'ERROR' || normalizedLevel === 'CRITICAL') {
          console.error(prefix, entry.message, entry.meta || '');
        } else if (normalizedLevel === 'WARN') {
          console.warn(prefix, entry.message, entry.meta || '');
        } else if (normalizedLevel === 'DEBUG') {
          console.debug(prefix, entry.message, entry.meta || '');
        }
      }

      return entry;
    }

    _sanitizeMeta(meta) {
      if (meta === null || meta === undefined) return null;
      if (meta instanceof Error) {
        return {
          name: meta.name,
          message: meta.message,
          stack: String(meta.stack || '').split('\n').slice(0, 6).join('\n')
        };
      }
      if (typeof meta !== 'object') {
        return meta;
      }
      try {
        return JSON.parse(JSON.stringify(meta));
      } catch (_) {
        return String(meta);
      }
    }

    debug(moduleName, message, meta) {
      return this.log('DEBUG', moduleName, message, meta);
    }

    info(moduleName, message, meta) {
      return this.log('INFO', moduleName, message, meta);
    }

    warn(moduleName, message, meta) {
      return this.log('WARN', moduleName, message, meta);
    }

    error(moduleName, message, meta) {
      return this.log('ERROR', moduleName, message, meta);
    }

    critical(moduleName, message, meta) {
      return this.log('CRITICAL', moduleName, message, meta);
    }

    /**
     * Lọc danh sách nhật ký theo cấp độ, tên module hoặc từ khóa.
     */
    queryLogs(filterOptions) {
      const opts = filterOptions || {};
      const levelFilter = opts.level ? String(opts.level).toUpperCase() : null;
      const moduleFilter = opts.module ? String(opts.module).toLowerCase() : null;
      const searchKeyword = opts.keyword ? String(opts.keyword).toLowerCase() : null;
      const limit = Number(opts.limit) > 0 ? Number(opts.limit) : 100;

      const results = [];
      for (let i = this.entries.length - 1; i >= 0; i--) {
        const item = this.entries[i];
        if (levelFilter && item.level !== levelFilter) continue;
        if (moduleFilter && !item.module.toLowerCase().includes(moduleFilter)) continue;
        if (searchKeyword) {
          const hay = (item.message + ' ' + JSON.stringify(item.meta || '')).toLowerCase();
          if (!hay.includes(searchKeyword)) continue;
        }
        results.push(item);
        if (results.length >= limit) break;
      }
      return results;
    }

    /**
     * Xuất báo cáo chẩn đoán hệ thống dưới dạng đối tượng JSON đầy đủ.
     */
    exportDiagnosticReport() {
      return {
        version: STUDIO_CONSTANTS.VERSION,
        generatedAt: new Date().toISOString(),
        counters: Object.assign({}, this.counters),
        registeredModules: Object.keys(NS.modules || {}),
        projectMetrics: NS.stateGuardian ? NS.stateGuardian.computeProjectSummaryMetrics() : {},
        recentErrors: this.queryLogs({ level: 'ERROR', limit: 25 }),
        recentWarnings: this.queryLogs({ level: 'WARN', limit: 25 }),
        recentLogs: this.entries.slice(-50)
      };
    }

    clear() {
      this.entries = [];
    }
  }

  NS.logger = new StudioTelemetryLogger(STUDIO_CONSTANTS.LIMITS.LOGGER_MAX_ENTRIES);

  // ==========================================================================
  // PHẦN 4: HỆ THỐNG PUB/SUB EVENT BUS ĐA LUỒNG (`window.NoirStudio.bus`)
  // ==========================================================================

  /**
   * Trạm trung chuyển sự kiện trung tâm (`StudioEventBus`).
   * Hỗ trợ:
   *  - Đăng ký sự kiện chuẩn `on(eventName, handler, options)`
   *  - Đăng ký một lần `once(eventName, handler, options)`
   *  - Hủy đăng ký `off(eventName, handler)`
   *  - Phát sự kiện đồng bộ `emit(eventName, payload)`
   *  - Phát sự kiện bất đồng bộ `emitAsync(eventName, payload)`
   *  - Lắng nghe ký tự đại diện (Wildcard): `*` hoặc `chapter:*`, `ai:*`
   *  - Lưu lịch sử sự kiện và phát lại (`replay`) cho các module khởi tạo muộn
   */
  class StudioEventBus {
    constructor() {
      this.listeners = new Map();
      this.wildcardListeners = new Map();
      this.history = [];
      this.maxHistory = STUDIO_CONSTANTS.LIMITS.EVENT_HISTORY_MAX_ITEMS;
      this.middlewares = [];
      this.paused = false;
      this.pausedQueue = [];
      this.channelStats = new Map();
      this.listenerIdCounter = 0;
    }

    /**
     * Kiểm tra xem tên sự kiện có phải dạng Wildcard (`*` hoặc `namespace:*`) hay không.
     */
    _isWildcardPattern(eventName) {
      return typeof eventName === 'string' && eventName.indexOf('*') !== -1;
    }

    /**
     * Chuyển mẫu Wildcard (ví dụ `chapter:*`) thành biểu thức chính quy.
     */
    _compileWildcardRegex(pattern) {
      const escaped = String(pattern)
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      return new RegExp('^' + escaped + '$');
    }

    /**
     * Đăng ký lắng nghe một sự kiện.
     * @param {string} eventName Tên sự kiện hoặc mẫu Wildcard
     * @param {Function} handler Hàm xử lý `(payload, eventMeta) => void`
     * @param {Object} [options] Tùy chọn `{ priority: number, once: boolean, subscriberName: string }`
     * @returns {Function} Hàm hủy đăng ký (Unsubscribe function)
     */
    on(eventName, handler, options) {
      if (!eventName || typeof handler !== 'function') {
        return () => {};
      }

      const opts = options && typeof options === 'object' ? options : {};
      const priority = typeof opts.priority === 'number' ? opts.priority : 0;
      const once = Boolean(opts.once);
      const subscriberName = String(opts.subscriberName || 'anonymous');
      const subscriptionId = 'sub_' + (++this.listenerIdCounter);

      const entry = {
        id: subscriptionId,
        eventName,
        handler,
        priority,
        once,
        subscriberName,
        registeredAt: Date.now(),
        invocationCount: 0
      };

      if (this._isWildcardPattern(eventName)) {
        entry.regex = this._compileWildcardRegex(eventName);
        if (!this.wildcardListeners.has(eventName)) {
          this.wildcardListeners.set(eventName, []);
        }
        const wcList = this.wildcardListeners.get(eventName);
        wcList.push(entry);
        wcList.sort((a, b) => b.priority - a.priority);
        return () => this.off(eventName, handler);
      }

      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, []);
      }
      const list = this.listeners.get(eventName);

      // Ngăn chặn đăng ký trùng lặp cùng một hàm handler trên cùng một sự kiện
      for (let i = 0; i < list.length; i++) {
        if (list[i].handler === handler) {
          return () => this.off(eventName, handler);
        }
      }

      list.push(entry);
      list.sort((a, b) => b.priority - a.priority);

      return () => this.off(eventName, handler);
    }

    /**
     * Đăng ký lắng nghe sự kiện duy nhất 1 lần rồi tự động gỡ bỏ.
     */
    once(eventName, handler, options) {
      const mergedOptions = Object.assign({}, options || {}, { once: true });
      return this.on(eventName, handler, mergedOptions);
    }

    /**
     * Gỡ bỏ hàm lắng nghe khỏi một sự kiện.
     */
    off(eventName, handler) {
      if (!eventName) return;

      if (this._isWildcardPattern(eventName)) {
        const wcList = this.wildcardListeners.get(eventName);
        if (!wcList) return;
        if (!handler) {
          this.wildcardListeners.delete(eventName);
          return;
        }
        for (let i = wcList.length - 1; i >= 0; i--) {
          if (wcList[i].handler === handler) {
            wcList.splice(i, 1);
          }
        }
        if (wcList.length === 0) {
          this.wildcardListeners.delete(eventName);
        }
        return;
      }

      const list = this.listeners.get(eventName);
      if (!list) return;
      if (!handler) {
        this.listeners.delete(eventName);
        return;
      }
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].handler === handler) {
          list.splice(i, 1);
        }
      }
      if (list.length === 0) {
        this.listeners.delete(eventName);
      }
    }

    /**
     * Thêm một hàm Middleware chặn lọc hoặc biến đổi dữ liệu sự kiện trước khi phát.
     */
    useMiddleware(middlewareFn) {
      if (typeof middlewareFn === 'function') {
        this.middlewares.push(middlewareFn);
      }
    }

    /**
     * Thu thập toàn bộ các listener khớp với `eventName` (bao gồm cả Wildcard).
     */
    _collectMatchingEntries(eventName) {
      const matched = [];
      const directList = this.listeners.get(eventName);
      if (directList && directList.length > 0) {
        for (let i = 0; i < directList.length; i++) {
          matched.push(directList[i]);
        }
      }

      if (this.wildcardListeners.size > 0) {
        this.wildcardListeners.forEach((wcList) => {
          for (let i = 0; i < wcList.length; i++) {
            const item = wcList[i];
            if (item.regex && item.regex.test(eventName)) {
              matched.push(item);
            }
          }
        });
      }

      if (matched.length > 1) {
        matched.sort((a, b) => b.priority - a.priority);
      }
      return matched;
    }

    /**
     * Ghi nhận thống kê và lưu vào lịch sử sự kiện.
     */
    _recordEventEmission(eventName, payload, listenersCount) {
      const now = Date.now();
      const record = {
        eventName,
        payload,
        ts: now,
        listenersCount
      };

      this.history.push(record);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      const stat = this.channelStats.get(eventName) || {
        eventName,
        emitCount: 0,
        lastEmittedAt: 0,
        errorsCount: 0
      };
      stat.emitCount += 1;
      stat.lastEmittedAt = now;
      this.channelStats.set(eventName, stat);

      return record;
    }

    /**
     * Phát một sự kiện đồng bộ tới mọi Module đã đăng ký.
     */
    emit(eventName, payload) {
      if (!eventName || typeof eventName !== 'string') return 0;

      if (this.paused) {
        this.pausedQueue.push({ eventName, payload, async: false });
        return 0;
      }

      let currentPayload = payload;
      for (let m = 0; m < this.middlewares.length; m++) {
        try {
          const mwResult = this.middlewares[m](eventName, currentPayload);
          if (mwResult === false) {
            return 0;
          }
          if (mwResult !== undefined) {
            currentPayload = mwResult;
          }
        } catch (mwErr) {
          NS.logger.error('EventBus', `Lỗi Middleware khi phát sự kiện ${eventName}`, mwErr);
        }
      }

      const matchedEntries = this._collectMatchingEntries(eventName);
      const record = this._recordEventEmission(eventName, currentPayload, matchedEntries.length);

      let invoked = 0;
      const toRemoveOnce = [];

      for (let i = 0; i < matchedEntries.length; i++) {
        const entry = matchedEntries[i];
        try {
          entry.invocationCount += 1;
          entry.handler(currentPayload, record);
          invoked += 1;
        } catch (err) {
          const stat = this.channelStats.get(eventName);
          if (stat) stat.errorsCount += 1;
          NS.logger.error('EventBus', `Lỗi thực thi sự kiện [${eventName}] tại subscriber [${entry.subscriberName}]`, err);
        }
        if (entry.once) {
          toRemoveOnce.push(entry);
        }
      }

      for (let r = 0; r < toRemoveOnce.length; r++) {
        this.off(toRemoveOnce[r].eventName, toRemoveOnce[r].handler);
      }

      return invoked;
    }

    /**
     * Phát sự kiện bất đồng bộ (`async/await`), chờ tất cả các handler hoàn thành.
     */
    async emitAsync(eventName, payload) {
      if (!eventName || typeof eventName !== 'string') return [];

      if (this.paused) {
        this.pausedQueue.push({ eventName, payload, async: true });
        return [];
      }

      const matchedEntries = this._collectMatchingEntries(eventName);
      const record = this._recordEventEmission(eventName, payload, matchedEntries.length);

      const results = [];
      const toRemoveOnce = [];

      for (let i = 0; i < matchedEntries.length; i++) {
        const entry = matchedEntries[i];
        try {
          entry.invocationCount += 1;
          const res = await Promise.resolve(entry.handler(payload, record));
          results.push({ subscriber: entry.subscriberName, status: 'fulfilled', value: res });
        } catch (err) {
          const stat = this.channelStats.get(eventName);
          if (stat) stat.errorsCount += 1;
          NS.logger.error('EventBus', `Lỗi bất đồng bộ [${eventName}] tại [${entry.subscriberName}]`, err);
          results.push({ subscriber: entry.subscriberName, status: 'rejected', error: err });
        }
        if (entry.once) {
          toRemoveOnce.push(entry);
        }
      }

      for (let r = 0; r < toRemoveOnce.length; r++) {
        this.off(toRemoveOnce[r].eventName, toRemoveOnce[r].handler);
      }

      return results;
    }

    /**
     * Phát lại sự kiện gần nhất có tên `eventName` cho một hàm xử lý mới đăng ký.
     */
    replayLast(eventName, handler) {
      if (!eventName || typeof handler !== 'function') return false;
      for (let i = this.history.length - 1; i >= 0; i--) {
        if (this.history[i].eventName === eventName) {
          try {
            handler(this.history[i].payload, this.history[i]);
            return true;
          } catch (err) {
            NS.logger.error('EventBus', `Lỗi replayLast cho sự kiện ${eventName}`, err);
            return false;
          }
        }
      }
      return false;
    }

    /**
     * Tạm dừng phát sự kiện (đưa vào hàng đợi tạm) và tiếp tục phát khi gọi `resume()`.
     */
    pause() {
      this.paused = true;
    }

    resume() {
      if (!this.paused) return;
      this.paused = false;
      const pending = this.pausedQueue.splice(0, this.pausedQueue.length);
      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        if (item.async) {
          this.emitAsync(item.eventName, item.payload);
        } else {
          this.emit(item.eventName, item.payload);
        }
      }
    }

    /**
     * Lấy lịch sử sự kiện gần đây để kiểm tra luồng hoạt động.
     */
    getHistory(filterEventName, limit) {
      const max = Number(limit) > 0 ? Number(limit) : 50;
      if (!filterEventName) {
        return this.history.slice(-max);
      }
      const filtered = [];
      for (let i = this.history.length - 1; i >= 0; i--) {
        if (this.history[i].eventName === filterEventName) {
          filtered.unshift(this.history[i]);
          if (filtered.length >= max) break;
        }
      }
      return filtered;
    }

    /**
     * Báo cáo tổng quan các kênh sự kiện đang hoạt động.
     */
    getDiagnosticsSummary() {
      const channels = [];
      this.listeners.forEach((list, eventName) => {
        const stat = this.channelStats.get(eventName) || { emitCount: 0, lastEmittedAt: 0, errorsCount: 0 };
        channels.push({
          eventName,
          subscribersCount: list.length,
          emitCount: stat.emitCount,
          errorsCount: stat.errorsCount,
          lastEmittedAt: stat.lastEmittedAt
        });
      });
      return {
        totalDirectChannels: this.listeners.size,
        totalWildcardChannels: this.wildcardListeners.size,
        historySize: this.history.length,
        paused: this.paused,
        channels
      };
    }
  }

  NS.bus = new StudioEventBus();

  // ==========================================================================
  // PHẦN 5: HÀNG ĐỢI KHÓA BẤT ĐỒNG BỘ (`window.NoirStudio.mutex`)
  // ==========================================================================

  /**
   * Hàng đợi khóa tuần tự (`AsyncMutexQueue`) đảm bảo các thao tác ghi dữ liệu
   * nhạy cảm (như Lưu tự động 2s, Đồng bộ thư mục ổ cứng, Cập nhật Story Bible)
   * không bao giờ chạy chồng chéo gây mất mát hoặc ghi đè dữ liệu cũ lên dữ liệu mới.
   */
  class AsyncMutexQueue {
    constructor() {
      this._chain = Promise.resolve();
      this._namedChains = new Map();
      this._stats = {
        totalTasksExecuted: 0,
        totalFailures: 0,
        totalTimeouts: 0,
        activeTasksCount: 0,
        lastTaskCompletedAt: 0
      };
      this.defaultTimeoutMs = 45000;
    }

    /**
     * Thực thi một tác vụ bất đồng bộ trong hàng đợi độc quyền.
     * @param {Function} taskFn Hàm thực thi `async () => any`
     * @param {string} [resourceKey='global_default'] Tên kênh tài nguyên cần khóa
     * @param {number} [timeoutMs=45000] Thời gian chờ tối đa để tránh treo hàng đợi
     */
    runExclusive(taskFn, resourceKey, timeoutMs) {
      let fn = taskFn;
      let rawKey = resourceKey;
      if (typeof fn === 'string' && typeof resourceKey === 'function') {
        fn = resourceKey;
        rawKey = taskFn;
      }
      if (typeof fn !== 'function') {
        return Promise.resolve(null);
      }

      const key = typeof rawKey === 'string' && rawKey.trim()
        ? rawKey.trim()
        : 'global_default';
      const maxWait = typeof timeoutMs === 'number' && timeoutMs > 0
        ? timeoutMs
        : this.defaultTimeoutMs;

      const baseChain = key === 'global_default'
        ? this._chain
        : (this._namedChains.get(key) || Promise.resolve());

      const wrappedTask = () => {
        this._stats.activeTasksCount += 1;
        return new Promise((resolve, reject) => {
          let settled = false;
          const timer = setTimeout(() => {
            if (!settled) {
              settled = true;
              this._stats.totalTimeouts += 1;
              this._stats.activeTasksCount = Math.max(0, this._stats.activeTasksCount - 1);
              const timeoutErr = new Error(`[AsyncMutexQueue] Quá thời gian chờ (${maxWait}ms) trên tài nguyên [${key}]`);
              NS.logger.warn('MutexQueue', timeoutErr.message);
              reject(timeoutErr);
            }
          }, maxWait);

          Promise.resolve()
            .then(() => fn())
            .then((result) => {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                this._stats.totalTasksExecuted += 1;
                this._stats.lastTaskCompletedAt = Date.now();
                this._stats.activeTasksCount = Math.max(0, this._stats.activeTasksCount - 1);
                resolve(result);
              }
            })
            .catch((err) => {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                this._stats.totalFailures += 1;
                this._stats.activeTasksCount = Math.max(0, this._stats.activeTasksCount - 1);
                NS.logger.error('MutexQueue', `Lỗi tác vụ trong hàng đợi [${key}]`, err);
                reject(err);
              }
            });
        });
      };

      const nextPromise = baseChain.then(wrappedTask, wrappedTask);
      const safeTail = nextPromise.catch(() => {});

      if (key === 'global_default') {
        this._chain = safeTail;
      } else {
        this._namedChains.set(key, safeTail);
      }

      return nextPromise;
    }

    /**
     * Lấy thống kê tình trạng hàng đợi Mutex.
     */
    getStats() {
      return Object.assign({}, this._stats, {
        namedChannels: Array.from(this._namedChains.keys())
      });
    }
  }

  NS.mutex = new AsyncMutexQueue();

  // ==========================================================================
  // PHẦN 6: BỘ GẮN SỰ KIỆN DOM CHỐNG NHÂN ĐÔI (`window.NoirStudio.bindOnce`)
  // ==========================================================================

  /**
   * Quản lý toàn bộ các sự kiện DOM đã gắn thông qua `NS.bindOnce`.
   * Ngăn chặn triệt để lỗi một nút bấm bị gắn 2-3 lần sự kiện khi chuyển tab
   * hoặc khởi tạo lại giao diện.
   */
  class StudioDOMBindingRegistry {
    constructor() {
      this.boundRecords = new Map();
      this.totalBoundCount = 0;
      this.skippedDuplicateCount = 0;
    }

    /**
     * Gắn sự kiện vào phần tử DOM (hoặc ID chuỗi) đúng 1 lần duy nhất cho mỗi `bindKey`.
     */
    bindOnce(elOrId, eventName, handler, bindKey, options) {
      if (typeof document === 'undefined') return null;
      const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
      if (!el || typeof handler !== 'function' || !eventName) return null;

      const elementIdentifier = el.id || el.tagName || 'dom_node';
      const key = String(bindKey || `${elementIdentifier}__${eventName}`).trim();
      const attrName = 'data-noir-bound-' + key.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

      if (el.getAttribute && el.getAttribute(attrName) === '1') {
        this.skippedDuplicateCount += 1;
        return el;
      }

      if (el.setAttribute) {
        el.setAttribute(attrName, '1');
      }

      const wrappedHandler = function noirSafeDomEventHandler(evt) {
        try {
          if (eventName === 'keydown' && NS.state && NS.state.sessionMetrics) {
            NS.state.sessionMetrics.keystrokesCount += 1;
          }
          return handler.call(el, evt);
        } catch (err) {
          NS.logger.error('DOMBinder', `Lỗi xử lý sự kiện DOM [${eventName}] tại [${key}]`, err);
        }
      };

      el.addEventListener(eventName, wrappedHandler, options || false);
      this.totalBoundCount += 1;

      this.boundRecords.set(key, {
        key,
        elementId: el.id || null,
        tagName: el.tagName || 'UNKNOWN',
        eventName,
        attrName,
        boundAt: Date.now(),
        elRef: el,
        wrappedHandler,
        options: options || false
      });

      return el;
    }

    /**
     * Gỡ bỏ một sự kiện đã gắn theo `bindKey` nếu cần gắn lại hàm xử lý mới.
     */
    unbindByKey(bindKey) {
      const key = String(bindKey || '').trim();
      if (!key || !this.boundRecords.has(key)) return false;

      const rec = this.boundRecords.get(key);
      if (rec && rec.elRef) {
        try {
          rec.elRef.removeEventListener(rec.eventName, rec.wrappedHandler, rec.options);
          if (rec.elRef.removeAttribute && rec.attrName) {
            rec.elRef.removeAttribute(rec.attrName);
          }
        } catch (_) {}
      }
      this.boundRecords.delete(key);
      return true;
    }

    /**
     * Gắn sự kiện cho một danh sách phần tử khớp với CSS Selector.
     */
    bindSelectorAllOnce(selector, eventName, handlerFn, bindKeyPrefix) {
      if (typeof document === 'undefined' || !selector) return 0;
      const nodes = document.querySelectorAll(selector);
      let count = 0;
      nodes.forEach((node, idx) => {
        const subKey = `${bindKeyPrefix || selector}_${idx}_${eventName}`;
        const bound = this.bindOnce(node, eventName, (evt) => handlerFn(node, evt, idx), subKey);
        if (bound) count += 1;
      });
      return count;
    }

    /**
     * Xuất thống kê các sự kiện DOM đã gắn.
     */
    getReport() {
      return {
        totalBoundCount: this.totalBoundCount,
        activeBindings: this.boundRecords.size,
        skippedDuplicateCount: this.skippedDuplicateCount
      };
    }
  }

  NS.domBinder = new StudioDOMBindingRegistry();

  /**
   * Hàm tiện ích toàn cục `window.NoirStudio.bindOnce(elOrId, eventName, handler, bindKey)`
   * được tất cả 30 Module gọi trực tiếp.
   */
  NS.bindOnce = function bindOnceGlobal(elOrId, eventName, handler, bindKey, options) {
    return NS.domBinder.bindOnce(elOrId, eventName, handler, bindKey, options);
  };

  // ==========================================================================
  // PHẦN 7: HỆ THỐNG ĐĂNG KÝ & KIỂM ĐỊNH 30 MODULE (`window.NoirStudio.registerModule`)
  // ==========================================================================

  /**
   * Danh mục chuẩn của 30 Module trong kiến trúc v38.0 Supreme Modular.
   */
  const EXPECTED_30_MODULES_MANIFEST = Object.freeze([
    { index: 1, key: 'mod01_core_kernel', file: 'mod01_core_kernel_and_event_bus.js', title: 'Nhân Hệ Thống, Hằng Số & Trạm Sự Kiện EventBus' },
    { index: 2, key: 'mod02_models_catalog', file: 'mod02_gemini_models_catalog_and_router_config.js', title: 'Danh Mục Mô Hình Gemini 2026 & Cố Vấn Chất Lượng' },
    { index: 3, key: 'mod03_ui_nlp_utils', file: 'mod03_humanized_ui_toast_and_vn_nlp_utils.js', title: 'Thông Báo Thân Thiện & Xử Lý Ngôn Ngữ Tiếng Việt' },
    { index: 4, key: 'mod04_idb_storage', file: 'mod04_indexeddb_storage_and_emergency_vault.js', title: 'Cơ Sở Dữ Liệu IndexedDB & Két Sắt Khẩn Cấp' },
    { index: 5, key: 'mod05_local_fs', file: 'mod05_local_filesystem_and_folder_sync.js', title: 'Đồng Bộ Ổ Cứng Máy Tính 6 Thư Mục Tự Động' },
    { index: 6, key: 'mod06_doc_importer', file: 'mod06_document_importer_docx_pdf_txt.js', title: 'Trình Nạp Tài Liệu .DOCX, .PDF, .TXT & .JSON' },
    { index: 7, key: 'mod07_bm25_rag', file: 'mod07_bm25_local_rag_memory_engine.js', title: 'Bộ Nhớ Chống Quên Cục Bộ BM25 (0 Token)' },
    { index: 8, key: 'mod08_chapter_tree', file: 'mod08_chapter_tree_and_bidirectional_approval.js', title: 'Quản Lý Cây Bản Thảo & Đồng Bộ Tiêu Đề Hai Chiều' },
    { index: 9, key: 'mod09_autosave_undo', file: 'mod09_three_tier_autosave_and_undo_stack.js', title: 'Lưu Tự Động 3 Lớp Sau 2 Giây & Hoàn Tác Đa Tầng' },
    { index: 10, key: 'mod10_version_vault', file: 'mod10_version_time_machine_and_live_preview.js', title: 'Cỗ Máy Thời Gian Phiên Bản & Xem Trước Trạng Thái Cũ' },
    { index: 11, key: 'mod11_ai_diff_review', file: 'mod11_google_docs_ai_diff_review_engine.js', title: 'Duyệt Thay Đổi AI Kiểu Google Docs (Tô Màu Đoạn Mới)' },
    { index: 12, key: 'mod12_story_bible', file: 'mod12_story_bible_and_lore_matrix_engine.js', title: 'Trung Tâm Story Bible, Nhân Vật, Ai Biết Gì & Phục Bút' },
    { index: 13, key: 'mod13_scene_builder', file: 'mod13_scene_transition_and_pov_builder.js', title: 'Thiết Kế Mốc Chuyển Phân Cảnh & Đổi Góc Nhìn POV' },
    { index: 14, key: 'mod14_sysprompts_studio', file: 'mod14_five_modes_system_prompts_studio.js', title: 'Khung Cấu Hình System Prompt Cho Cả 5 Chế Độ AI' },
    { index: 15, key: 'mod15_api_client', file: 'mod15_api_key_vault_and_zero_congestion_client.js', title: 'Két Sắt API Key & Động Cơ Kết Nối Gemini Chống Nghẽn' },
    { index: 16, key: 'mod16_prompt_synthesizer', file: 'mod16_master_prompt_synthesizer_two_step.js', title: 'Trình Tổng Hợp Prompt Chính Thức 2 Bước Chuẩn Xác' },
    { index: 17, key: 'mod17_tab3_controller', file: 'mod17_tab3_five_modes_output_controller.js', title: 'Điều Phối Cửa Sổ Đầu Ra 5 Chế Độ Tại Tab 3' },
    { index: 18, key: 'mod18_mode5_diagram', file: 'mod18_mode5_plot_diagram_and_timeline_studio.js', title: 'Chế Độ 5: Vẽ Biểu Đồ Cốt Truyện & Trục Thời Gian SVG' },
    { index: 19, key: 'mod19_smart_approval', file: 'mod19_smart_approval_and_bible_extractor.js', title: 'Cổng Duyệt Chương Thông Minh & Tự Động Trích Xuất Bible' },
    { index: 20, key: 'mod20_pomodoro_sync', file: 'mod20_bidirectional_pomodoro_sync_engine.js', title: 'Đồng Hồ Tập Trung Pomodoro Đồng Bộ Hai Chiều 100%' },
    { index: 21, key: 'mod21_audio_soundscape', file: 'mod21_mp3_ab_loop_and_webaudio_soundscape.js', title: 'Trình Phát MP3 Lặp A-B & Âm Thanh Không Gian WebAudio' },
    { index: 22, key: 'mod22_typography_canvas', file: 'mod22_typography_and_60fps_ambient_canvas.js', title: 'Kiểu Chữ Trang Sách & Hiệu Ứng Nền Động 60FPS' },
    { index: 23, key: 'mod23_dialogue_tools', file: 'mod23_dialogue_normalizer_and_vn_editor_tools.js', title: 'Chuẩn Hóa Hội Thoại "- Thoại (Tên)" & Tìm Thay Thế' },
    { index: 24, key: 'mod24_cliche_scanner', file: 'mod24_cliche_scanner_and_pacing_heatmap.js', title: 'Máy Quét Từ Sáo Rỗng AI & Phân Tích Nhịp Văn' },
    { index: 25, key: 'mod25_webnovel_secrets', file: 'mod25_webnovel_secret_features_and_lore_whisper.js', title: 'Từ Điển Ngũ Quan Show-Dont-Tell & Nhắc Lore Ngầm' },
    { index: 26, key: 'mod26_book_exporter', file: 'mod26_pdf_docx_epub_custom_book_exporter.js', title: 'Bộ Xuất Sách .PDF Chọn Font/Cỡ Chữ, .DOCX & .TXT' },
    { index: 27, key: 'mod27_mascot_bi_so_8', file: 'mod27_mascot_bi_so_8_and_dual_chat_assistant.js', title: 'Linh Vật Viên Bi Số 8 & Phòng Chat Gemini Tự Do' },
    { index: 28, key: 'mod28_video_tutorial', file: 'mod28_animated_video_tutorial_with_subtitles.js', title: 'Video Hướng Dẫn Tương Tác Có Phụ Đề & Cẩm Nang A-Z' },
    { index: 29, key: 'mod29_responsive_nav', file: 'mod29_responsive_mobile_pwa_and_six_screens_nav.js', title: 'Điều Hướng 6 Màn Hình Đa Nền Tảng Điện Thoại & Máy Tính' },
    { index: 30, key: 'mod30_master_bootloader', file: 'mod30_master_bootloader_and_integrity_guard.js', title: 'Bộ Khởi Động Tổng Thể & Kiểm Định Toàn Vẹn 30 Module' }
  ]);

  NS.EXPECTED_MODULES_MANIFEST = EXPECTED_30_MODULES_MANIFEST;

  /**
   * Đăng ký một Module vào không gian tên `window.NoirStudio.modules`.
   */
  NS.registerModule = function registerStudioModule(name, instance) {
    if (!name || typeof name !== 'string') return instance;
    const cleanName = name.trim();
    NS.modules[cleanName] = instance;
    NS.logger.info('ModuleRegistry', `Đã đăng ký Module: ${cleanName}`);
    NS.bus.emit(STUDIO_CONSTANTS.EVENTS.MODULE_REGISTERED, {
      name: cleanName,
      registeredAt: Date.now()
    });
    return instance;
  };

  /**
   * Truy xuất một Module đã đăng ký theo tên.
   */
  NS.getModule = function getStudioModule(name) {
    if (!name) return null;
    return NS.modules[name] || null;
  };

  // ==========================================================================
  // PHẦN 8: TRÌNH QUẢN LÝ PHÍM TẮT ĐA NỀN TẢNG (`window.NoirStudio.shortcuts`)
  // ==========================================================================

  /**
   * Quản lý tổ hợp phím tắt bàn phím chuyên nghiệp cho tác giả tiểu thuyết.
   * Tự động quy đổi `Ctrl` trên Windows/Linux và `Command (⌘)` trên macOS.
   */
  class StudioShortcutManager {
    constructor() {
      this.shortcuts = new Map();
      this.enabled = true;
      this._registerBuiltInDefaults();
    }

    /**
     * Chuẩn hóa sự kiện bàn phím thành chuỗi định danh (ví dụ: `CTRL+S`, `CTRL+SHIFT+F`, `F11`).
     */
    normalizeKeyboardEvent(evt) {
      if (!evt || !evt.key) return '';
      const parts = [];
      if (evt.ctrlKey || evt.metaKey) parts.push('CTRL');
      if (evt.altKey) parts.push('ALT');
      if (evt.shiftKey) parts.push('SHIFT');

      const rawKey = String(evt.key).toUpperCase();
      if (rawKey !== 'CONTROL' && rawKey !== 'META' && rawKey !== 'ALT' && rawKey !== 'SHIFT') {
        parts.push(rawKey === ' ' ? 'SPACE' : rawKey);
      }
      return parts.join('+');
    }

    /**
     * Đăng ký một phím tắt mới.
     */
    register(comboString, config) {
      if (!comboString || !config || typeof config.handler !== 'function') return;
      const normalized = String(comboString).trim().toUpperCase();
      this.shortcuts.set(normalized, {
        combo: normalized,
        description: String(config.description || 'Phím tắt thao tác nhanh'),
        category: String(config.category || 'Chung'),
        preventDefault: config.preventDefault !== false,
        allowInInputs: config.allowInInputs !== false,
        handler: config.handler
      });
    }

    /**
     * Khởi tạo bộ danh mục phím tắt mặc định của Studio.
     */
    _registerBuiltInDefaults() {
      this.defaultCatalog = [
        { combo: 'CTRL+S', category: 'Bàn viết & Lưu trữ', description: 'Lưu an toàn 3 lớp ngay lập tức (IndexedDB + Két khẩn cấp + Ổ cứng)' },
        { combo: 'CTRL+Z', category: 'Bàn viết & Lưu trữ', description: 'Hoàn tác bước chỉnh sửa trước đó (Undo)' },
        { combo: 'CTRL+Y', category: 'Bàn viết & Lưu trữ', description: 'Làm lại bước vừa hoàn tác (Redo)' },
        { combo: 'CTRL+F', category: 'Bàn viết & Lưu trữ', description: 'Bật / Tắt thanh Tìm kiếm & Thay thế nhanh trong chương' },
        { combo: 'F11', category: 'Không gian tập trung', description: 'Bật / Tắt chế độ Tập trung toàn màn hình (Zen Mode)' },
        { combo: 'ALT+1', category: 'Điều hướng 6 Màn hình', description: 'Chuyển nhanh sang Tab 1: Bàn Viết Truyện Chính' },
        { combo: 'ALT+2', category: 'Điều hướng 6 Màn hình', description: 'Chuyển nhanh sang Tab 2: Quản Lý Chương & File Nguồn' },
        { combo: 'ALT+3', category: 'Điều hướng 6 Màn hình', description: 'Chuyển nhanh sang Tab 3: Trợ Lý AI & 5 Chế Độ Đầu Ra' },
        { combo: 'ALT+4', category: 'Điều hướng 6 Màn hình', description: 'Chuyển nhanh sang Tab 4: Trung Tâm Story Bible & Nhân Vật' },
        { combo: 'ALT+5', category: 'Điều hướng 6 Màn hình', description: 'Chuyển nhanh sang Tab 5: Nhạc Nền, Pomodoro & Kiểu Chữ' },
        { combo: 'ALT+6', category: 'Điều hướng 6 Màn hình', description: 'Chuyển nhanh sang Tab 6: Kho Phiên Bản, Xuất PDF & Cài Đặt' },
        { combo: 'ESCAPE', category: 'Cửa sổ & Chế độ', description: 'Đóng cửa sổ Modal đang mở hoặc thoát khỏi Zen Mode' }
      ];
    }

    /**
     * Xuất danh sách phím tắt để hiển thị trong Cẩm nang A-Z hoặc Trợ lý Viên Bi Số 8.
     */
    getCheatSheetList() {
      const merged = [];
      const seen = new Set();
      this.shortcuts.forEach((val, key) => {
        seen.add(key);
        merged.push({
          combo: val.combo,
          category: val.category,
          description: val.description
        });
      });
      for (let i = 0; i < this.defaultCatalog.length; i++) {
        const item = this.defaultCatalog[i];
        if (!seen.has(item.combo)) {
          merged.push(item);
        }
      }
      return merged;
    }
  }

  NS.shortcuts = new StudioShortcutManager();

  // ==========================================================================
  // PHẦN 9: BỘ ĐO HIỆU NĂNG & GIÁM SÁT TỐC ĐỘ (`window.NoirStudio.profiler`)
  // ==========================================================================

  class StudioPerformanceProfiler {
    constructor() {
      this.spans = new Map();
      this.completedSpans = [];
      this.maxCompletedSpans = 150;
    }

    /**
     * Bắt đầu đo thời gian thực thi của một tác vụ.
     */
    startSpan(spanName, metadata) {
      const id = String(spanName || 'unnamed_span');
      const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      this.spans.set(id, {
        name: id,
        startTime: now,
        metadata: metadata || null
      });
      return id;
    }

    /**
     * Kết thúc đo thời gian thực thi và trả về số mili-giây.
     */
    endSpan(spanName) {
      const id = String(spanName || 'unnamed_span');
      const active = this.spans.get(id);
      if (!active) return 0;

      const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      const durationMs = Math.max(0, Number((now - active.startTime).toFixed(2)));
      this.spans.delete(id);

      const record = {
        name: id,
        durationMs,
        finishedAt: Date.now(),
        metadata: active.metadata
      };

      this.completedSpans.push(record);
      if (this.completedSpans.length > this.maxCompletedSpans) {
        this.completedSpans.shift();
      }

      return durationMs;
    }

    /**
     * Lấy báo cáo trung bình thời gian chạy các tác vụ trong Studio.
     */
    getPerformanceSummary() {
      const grouped = {};
      for (let i = 0; i < this.completedSpans.length; i++) {
        const sp = this.completedSpans[i];
        if (!grouped[sp.name]) {
          grouped[sp.name] = { count: 0, totalMs: 0, maxMs: 0 };
        }
        const g = grouped[sp.name];
        g.count += 1;
        g.totalMs += sp.durationMs;
        if (sp.durationMs > g.maxMs) {
          g.maxMs = sp.durationMs;
        }
      }

      const summary = {};
      const keys = Object.keys(grouped);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const g = grouped[k];
        summary[k] = {
          calls: g.count,
          avgMs: Number((g.totalMs / g.count).toFixed(2)),
          maxMs: g.maxMs
        };
      }
      return summary;
    }
  }

  NS.profiler = new StudioPerformanceProfiler();

  // ==========================================================================
  // PHẦN 10: ĐỒNG BỘ ĐA TAB & CHỐNG GHI ĐÈ (`StudioCrossTabSyncEngine`)
  // ==========================================================================

  /**
   * Quản lý đồng bộ giữa nhiều tab trình duyệt nếu tác giả vô tình mở 2 tab
   * cùng lúc. Sử dụng `BroadcastChannel` kết hợp sự kiện `storage` để thông báo
   * ngay khi có chương mới được lưu hoặc duyệt ở tab khác.
   */
  class StudioCrossTabSyncEngine {
    constructor() {
      this.channelName = 'noir_studio_v38_crosstab_sync_channel';
      this.tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      this.channel = null;
      this.isLeaderTab = true;
      this.knownPeers = new Map();
      this.lastBroadcastAt = 0;
      this._initChannel();
    }

    _initChannel() {
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.channel = new BroadcastChannel(this.channelName);
          this.channel.onmessage = (evt) => {
            this._handleIncomingMessage(evt.data);
          };
          this.broadcast('TAB_HELLO', {
            openedAt: Date.now(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
          });
        } catch (err) {
          NS.logger.warn('CrossTabSync', 'BroadcastChannel không khả dụng trong môi trường này', err);
        }
      }

      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('beforeunload', () => {
          this.broadcast('TAB_GOODBYE', { closedAt: Date.now() });
        });
      }
    }

    /**
     * Phát thông điệp đồng bộ sang các tab khác đang mở cùng địa chỉ web.
     */
    broadcast(type, payload) {
      if (!this.channel || !type) return false;
      try {
        const packet = {
          senderTabId: this.tabId,
          type: String(type),
          timestamp: Date.now(),
          payload: payload || {}
        };
        this.channel.postMessage(packet);
        this.lastBroadcastAt = packet.timestamp;
        return true;
      } catch (err) {
        NS.logger.warn('CrossTabSync', `Không thể gửi gói tin [${type}]`, err);
        return false;
      }
    }

    /**
     * Xử lý gói tin nhận được từ một tab khác của Studio.
     */
    _handleIncomingMessage(packet) {
      if (!packet || typeof packet !== 'object') return;
      if (packet.senderTabId === this.tabId) return;

      const sender = String(packet.senderTabId || 'unknown_tab');
      this.knownPeers.set(sender, {
        tabId: sender,
        lastSeenAt: Date.now(),
        lastEventType: packet.type
      });

      if (packet.type === 'TAB_HELLO') {
        this.broadcast('TAB_WELCOME', {
          leaderTabId: this.tabId,
          activeChapterId: NS.state ? NS.state.activeChapterId : null
        });
      } else if (packet.type === 'TAB_GOODBYE') {
        this.knownPeers.delete(sender);
      } else if (packet.type === 'CHAPTER_SAVED_EXTERNAL') {
        NS.bus.emit('crosstab:chapter_saved', packet.payload);
      } else if (packet.type === 'BIBLE_SAVED_EXTERNAL') {
        NS.bus.emit('crosstab:bible_saved', packet.payload);
      }
    }

    /**
     * Trả về số lượng tab khác đang mở cùng lúc.
     */
    getActivePeersCount() {
      const now = Date.now();
      this.knownPeers.forEach((info, key) => {
        if (now - info.lastSeenAt > 120000) {
          this.knownPeers.delete(key);
        }
      });
      return this.knownPeers.size;
    }
  }

  NS.crossTabSync = new StudioCrossTabSyncEngine();

  // ==========================================================================
  // PHẦN 11: TRÌNH NHẬN DIỆN THIẾT BỊ & MÔI TRƯỜNG (`StudioDeviceDetector`)
  // ==========================================================================

  /**
   * Nhận diện chính xác thiết bị đang sử dụng (Điện thoại iOS/Android, Máy tính bảng,
   * Máy tính để bàn, hỗ trợ File System Access API, IndexedDB, WebAudio, Cảm ứng)
   * để tự động tối ưu giao diện 6 màn hình và cơ chế lưu trữ.
   */
  class StudioEnvironmentAndDeviceDetector {
    constructor() {
      this.profile = this.detectAll();
    }

    detectAll() {
      const hasWindow = typeof window !== 'undefined';
      const hasNavigator = typeof navigator !== 'undefined';
      const ua = hasNavigator ? String(navigator.userAgent || '') : '';

      const isIOS = /iPad|iPhone|iPod/.test(ua) ||
        (hasNavigator && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/i.test(ua);
      const isMobileViewport = hasWindow && typeof window.innerWidth === 'number'
        ? window.innerWidth < 1024
        : false;
      const isTouchDevice = hasWindow && (
        'ontouchstart' in window ||
        (hasNavigator && navigator.maxTouchPoints > 0)
      );

      const supportsFileSystemAccess = hasWindow && typeof window.showDirectoryPicker === 'function';
      const supportsIndexedDB = hasWindow && typeof window.indexedDB !== 'undefined';
      const supportsWebAudio = hasWindow && (
        typeof window.AudioContext !== 'undefined' ||
        typeof window.webkitAudioContext !== 'undefined'
      );
      const supportsClipboardAPI = hasNavigator &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function';
      const supportsBroadcastChannel = typeof BroadcastChannel !== 'undefined';

      let osName = 'Desktop OS';
      if (isIOS) osName = 'iOS / iPadOS';
      else if (isAndroid) osName = 'Android';
      else if (/Win/i.test(ua)) osName = 'Windows';
      else if (/Mac/i.test(ua)) osName = 'macOS';
      else if (/Linux/i.test(ua)) osName = 'Linux';

      return {
        osName,
        isIOS,
        isAndroid,
        isMobileOrTablet: isIOS || isAndroid || isMobileViewport,
        isTouchDevice,
        supportsFileSystemAccess,
        supportsIndexedDB,
        supportsWebAudio,
        supportsClipboardAPI,
        supportsBroadcastChannel,
        viewportWidth: hasWindow ? window.innerWidth : 1280,
        viewportHeight: hasWindow ? window.innerHeight : 800,
        devicePixelRatio: hasWindow && window.devicePixelRatio ? window.devicePixelRatio : 1
      };
    }

    refreshViewportMetrics() {
      this.profile = this.detectAll();
      return this.profile;
    }

    isDesktopFileSystemCapable() {
      return Boolean(this.profile && this.profile.supportsFileSystemAccess);
    }
  }

  NS.deviceDetector = new StudioEnvironmentAndDeviceDetector();

  // ==========================================================================
  // PHẦN 12: BỘ KIỂM ĐỊNH VÀ CHUẨN HÓA DỮ LIỆU ĐẦU VÀO (`StudioSchemaValidator`)
  // ==========================================================================

  /**
   * Chuẩn hóa toàn bộ các thực thể dữ liệu (Chương, Nhân vật, Ma trận Ai Biết Gì,
   * Phục bút Chekhov, Mốc chuyển phân cảnh, Bản chụp phiên bản) trước khi lưu vào
   * IndexedDB hoặc kết hợp vào Prompt Tổng Hợp.
   */
  class StudioDataSchemaValidator {
    /**
     * Chuẩn hóa một đối tượng Chương (Chapter Entity).
     */
    normalizeChapterEntity(rawChapter, fallbackIndex) {
      const idx = typeof fallbackIndex === 'number' ? fallbackIndex + 1 : 1;
      const src = rawChapter && typeof rawChapter === 'object' ? rawChapter : {};
      const now = Date.now();

      const id = typeof src.id === 'string' && src.id.trim()
        ? src.id.trim()
        : `chap_${now}_${Math.random().toString(36).slice(2, 7)}`;

      const title = typeof src.title === 'string' && src.title.trim()
        ? src.title.trim()
        : `Chương ${idx}: Chưa đặt tiêu đề`;

      const content = typeof src.content === 'string'
        ? src.content.replace(/\r\n/g, '\n')
        : '';

      const beats = typeof src.beats === 'string'
        ? src.beats.replace(/\r\n/g, '\n')
        : '';

      const status = src.status === 'APPROVED' ? 'APPROVED' : 'DRAFT';

      const createdAt = typeof src.createdAt === 'number' && !Number.isNaN(src.createdAt)
        ? src.createdAt
        : now;

      const updatedAt = typeof src.updatedAt === 'number' && !Number.isNaN(src.updatedAt)
        ? src.updatedAt
        : now;

      const authorNoteTop = typeof src.authorNoteTop === 'string' ? src.authorNoteTop.trim() : '';
      const authorNoteBottom = typeof src.authorNoteBottom === 'string' ? src.authorNoteBottom.trim() : '';

      return {
        id,
        title,
        content,
        beats,
        status,
        createdAt,
        updatedAt,
        authorNoteTop,
        authorNoteBottom
      };
    }

    /**
     * Chuẩn hóa hồ sơ một Nhân vật trong Story Bible (Tab 4).
     */
    normalizeCharacterProfile(rawChar) {
      const src = rawChar && typeof rawChar === 'object' ? rawChar : {};
      return {
        id: typeof src.id === 'string' && src.id.trim()
          ? src.id.trim()
          : `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: String(src.name || 'Nhân vật mới').trim(),
        role: String(src.role || 'Nhân vật chính / Phụ').trim(),
        personality: String(src.personality || '').trim(),
        speechStyle: String(src.speechStyle || '').trim(),
        currentStatus: String(src.currentStatus || 'Bình thường').trim(),
        coreMotivation: String(src.coreMotivation || '').trim(),
        hiddenTraumaOrSecret: String(src.hiddenTraumaOrSecret || '').trim(),
        updatedAt: Date.now()
      };
    }

    /**
     * Chuẩn hóa một mục trong Ma trận "Ai Biết Gì" (Knowledge Matrix - Tab 4).
     */
    normalizeKnowledgeMatrixEntry(rawEntry) {
      const src = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
      return {
        id: typeof src.id === 'string' && src.id.trim()
          ? src.id.trim()
          : `know_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        secretTitle: String(src.secretTitle || src.secret || 'Bí mật cốt truyện').trim(),
        whoKnows: String(src.whoKnows || 'Chỉ tác giả biết').trim(),
        whoDoesNotKnow: String(src.whoDoesNotKnow || 'Các nhân vật khác').trim(),
        revealCondition: String(src.revealCondition || 'Chưa tiết lộ').trim(),
        updatedAt: Date.now()
      };
    }

    /**
     * Chuẩn hóa một mục trong Sổ cái Phục bút & Manh mối (Chekhov's Gun - Tab 4).
     */
    normalizeClueLedgerEntry(rawClue) {
      const src = rawClue && typeof rawClue === 'object' ? rawClue : {};
      const validStates = ['PLANTED', 'DEVELOPING', 'RESOLVED'];
      const status = validStates.includes(src.status) ? src.status : 'PLANTED';
      return {
        id: typeof src.id === 'string' && src.id.trim()
          ? src.id.trim()
          : `clue_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        clueName: String(src.clueName || src.title || 'Phục bút mới').trim(),
        plantedInChapter: String(src.plantedInChapter || 'Chương hiện tại').trim(),
        intendedPayoff: String(src.intendedPayoff || '').trim(),
        status,
        updatedAt: Date.now()
      };
    }

    /**
     * Chuẩn hóa một Mốc chuyển phân cảnh / đổi góc nhìn POV (Scene Marker).
     */
    normalizeSceneMarker(rawMarker, indexNumber) {
      const src = rawMarker && typeof rawMarker === 'object' ? rawMarker : {};
      const idx = typeof indexNumber === 'number' ? indexNumber + 1 : 1;
      return {
        id: typeof src.id === 'string' && src.id.trim()
          ? src.id.trim()
          : `scene_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        order: idx,
        pov: String(src.pov || 'Ngôi thứ 3 giới hạn').trim(),
        time: String(src.time || 'Tiếp nối cảnh trước').trim(),
        location: String(src.location || 'Bối cảnh hiện tại').trim(),
        goal: String(src.goal || '').trim(),
        chapterId: src.chapterId || (NS.state ? NS.state.activeChapterId : null),
        createdAt: typeof src.createdAt === 'number' ? src.createdAt : Date.now()
      };
    }
  }

  NS.schemaValidator = new StudioDataSchemaValidator();

  // ==========================================================================
  // PHẦN 13: DANH MỤC KHUÔN MẪU THỂ LOẠI TIỂU THUYẾT (`StudioGenreCatalog`)
  // ==========================================================================

  /**
   * Kho thiết lập sẵn các Khuôn mẫu Thể loại Tiểu thuyết (Genre Archetypes)
   * hỗ trợ người viết khởi tạo nhanh khung Story Bible, giọng văn, nhiệt độ AI
   * và bộ quy tắc thẩm mỹ văn học đặc trưng.
   */
  const LITERARY_GENRE_ARCHETYPE_CATALOG = Object.freeze({
    NOIR_PSYCHOLOGICAL_THRILLER: {
      id: 'NOIR_PSYCHOLOGICAL_THRILLER',
      name: '🕵️ Trinh Thám Tâm Lý & Noir Đô Thị',
      recommendedTemperature: 0.8,
      recommendedTargetWords: 3800,
      defaultPov: 'Ngôi thứ 3 giới hạn (Bám sát tâm lý nhân vật chính)',
      stylisticRules: [
        'Ưu tiên miêu tả chi tiết hiện trường qua góc nhìn chủ quan, ánh sáng tương phản (bóng tối, đèn đường, khói thuốc, mưa đêm).',
        'Độc thoại nội tâm sắc lạnh, lý tính nhưng ẩn chứa vết thương quá khứ chưa lành.',
        'Mọi manh mối đưa ra phải tuân thủ chặt chẽ Ma trận Ai Biết Gì — nhân vật không được suy luận từ thông tin mà họ chưa từng tiếp xúc.',
        'Đối thoại ngắn gọn, nhiều hàm ý ngầm (Subtext), sử dụng định dạng: - Câu thoại (Tên nhân vật).'
      ],
      bibleTemplatePreset: [
        '# 🏛️ KHUNG STORY BIBLE: TRINH THÁM TÂM LÝ & NOIR ĐÔ THỊ',
        '',
        '## 1. BỐI CẢNH ĐÔ THỊ & BẦU KHÔNG KHÍ',
        '- Thành phố / Khu vực trọng điểm:',
        '- Thời tiết & Ánh sáng chủ đạo (Mưa đêm, sương mù, đèn neon):',
        '- Các tầng lớp xã hội & Góc khuất pháp lý:',
        '',
        '## 2. HỒ SƠ VỤ ÁN / BÍ ẨN TRUNG TÂM',
        '- Sự kiện khởi phát (Nạn nhân, Thời gian tử vong / Mất tích, Hiện trường):',
        '- Danh sách nghi phạm & Động cơ bề nổi:',
        '- Sự thật ngầm định (Chỉ tác giả biết):',
        '',
        '## 3. QUY TẮC LOGIC TRINH THÁM BẤT KHẢ XÂM PHẠM',
        '- Nhân vật chỉ biết những gì họ tận mắt thấy hoặc nghe được.',
        '- Không có sự trùng hợp ngẫu nhiên giải quyết vụ án (No Deus Ex Machina).',
        '- Mọi câu thoại tuân thủ định dạng: - Câu thoại (Tên nhân vật)'
      ].join('\n')
    },

    VIETNAMESE_FOLK_HORROR_MYSTERY: {
      id: 'VIETNAMESE_FOLK_HORROR_MYSTERY',
      name: '🏮 Kinh Dị Dân Gian & Linh Dị Cổ Truyền Việt Nam',
      recommendedTemperature: 0.85,
      recommendedTargetWords: 3600,
      defaultPov: 'Ngôi thứ 1 ("Tôi") hoặc Ngôi thứ 3 giới hạn',
      stylisticRules: [
        'Sử dụng chất liệu văn hóa bản địa Việt Nam chân thực: mái đình, cây đa, bến nước, tiếng mõ đêm, hương trầm, đèn dầu, tục lệ cổ.',
        'Gợi nỗi sợ từ sự tĩnh lặng, âm thanh vọng lại trong sương và những quy tắc kiêng kỵ truyền đời trong làng cổ.',
        'Tránh lạm dụng máu me rẻ tiền; tập trung vào bầu không khí lạnh lẽo và sự nghi kỵ giữa người với người.',
        'Chuẩn hóa hội thoại: - Câu thoại (Tên nhân vật).'
      ],
      bibleTemplatePreset: [
        '# 🏛️ KHUNG STORY BIBLE: KINH DỊ DÂN GIAN & LINH DỊ VIỆT NAM',
        '',
        '## 1. ĐỊA LÝ LÀNG CỔ & TRUYỀN THUYẾT ĐỊA PHƯƠNG',
        '- Tên làng / Vùng núi / Miếu cổ:',
        '- Lịch sử hình thành & Biến cố trăm năm trước:',
        '- Các địa điểm cấm địa trong làng:',
        '',
        '## 2. HỆ THỐNG KIÊNG KỴ & LUẬT LỆ DÂN GIAN',
        '- Những điều dân làng tuyệt đối không được làm sau giờ Hợi:',
        '- Hệ quả tâm linh / tâm lý khi phá vỡ lời thề cổ:',
        '',
        '## 3. DÒNG THỜI GIAN SỰ KIỆN & NHÂN VẬT',
        '- Lý do nhân vật chính đặt chân đến vùng đất này:',
        '- Những hiện tượng kỳ lạ đã xảy ra theo từng đêm:'
      ].join('\n')
    },

    LIGHT_NOVEL_FANTASY_ACADEMY: {
      id: 'LIGHT_NOVEL_FANTASY_ACADEMY',
      name: '⚔️ Light Novel Kỳ Ảo, Học Viện & Phiêu Lưu',
      recommendedTemperature: 0.9,
      recommendedTargetWords: 3500,
      defaultPov: 'Ngôi thứ 1 hoặc Ngôi thứ 3 giới hạn giàu nhịp điệu',
      stylisticRules: [
        'Nhịp văn linh hoạt, kết hợp hài hòa giữa các phân cảnh chiến đấu tốc độ cao và những đoạn tương tác đời thường sinh động giữa các nhân vật.',
        'Hệ thống ma thuật / kỹ năng phải có giới hạn năng lượng (Mana/Thể lực) và cái giá phải trả rõ ràng.',
        'Mỗi nhân vật có giọng điệu đối thoại đặc trưng, dễ phân biệt ngay cả khi đọc nhanh.',
        'Chuẩn hóa hội thoại: - Câu thoại (Tên nhân vật).'
      ],
      bibleTemplatePreset: [
        '# 🏛️ KHUNG STORY BIBLE: LIGHT NOVEL KỲ ẢO & PHIÊU LƯU',
        '',
        '## 1. THẾ GIỚI QUAN & HỆ THỐNG SỨC MẠNH',
        '- Lục địa / Học viện / Thành bang chính:',
        '- Phân cấp bậc sức mạnh & Giới hạn đánh đổi:',
        '- Các chủng tộc / Phe phái đối lập:',
        '',
        '## 2. NHÓM NHÂN VẬT ĐỒNG HÀNH (PARTY)',
        '- Vai trò chiến đấu & Tính cách tương phản:',
        '- Mục tiêu chung của cả nhóm trong Arc hiện tại:',
        '',
        '## 3. LỊCH TRÌNH SỰ KIỆN & BOSS / THỬ THÁCH',
        '- Các cột mốc đã vượt qua:',
        '- Bí mật về di tích cổ / Kẻ đứng sau màn:'
      ].join('\n')
    },

    XIANXIA_ANCIENT_WUXIA: {
      id: 'XIANXIA_ANCIENT_WUXIA',
      name: '🏔️ Huyền Huyễn Cổ Phong, Tiên Hiệp & Kiếm Hiệp',
      recommendedTemperature: 0.85,
      recommendedTargetWords: 4000,
      defaultPov: 'Ngôi thứ 3 giới hạn',
      stylisticRules: [
        'Ngôn từ trang trọng, giàu hình ảnh cổ phong (non cao, mây trắng, tiếng đàn, ánh kiếm, đạo tâm) nhưng mạch lạc, dễ hiểu, không lạm dụng từ Hán Việt tối nghĩa.',
        'Trọng tâm nằm ở nhân quả, sự lựa chọn đạo tâm của nhân vật khi đứng trước ân oán và cơ duyên.',
        'Hệ thống cảnh giới tu luyện phải nhất quán tuyệt đối từ đầu đến cuối bộ truyện.',
        'Chuẩn hóa hội thoại: - Câu thoại (Tên nhân vật).'
      ],
      bibleTemplatePreset: [
        '# 🏛️ KHUNG STORY BIBLE: HUYỀN HUYỄN CỔ PHONG & TIÊN HIỆP',
        '',
        '## 1. CẢNH GIỚI TU LUYỆN & QUY LUẬT THIÊN ĐỊA',
        '- Hệ thống cảnh giới từ thấp đến cao:',
        '- Pháp bảo, Công pháp & Đan dược đặc thù:',
        '',
        '## 2. BẢN ĐỒ THẾ LỰC & TÔNG MÔN',
        '- Chính đạo / Ma đạo / Thế gia ẩn thế:',
        '- Ân oán lịch sử giữa các tông môn:',
        '',
        '## 3. HÀNH TRÌNH ĐẠO TÂM CỦA NHÂN VẬT CHÍNH',
        '- Cảnh giới hiện tại & Pháp bảo đang sở hữu:',
        '- Nhân quả chưa giải quyết:'
      ].join('\n')
    },

    MODERN_SLICE_OF_LIFE_ROMANCE: {
      id: 'MODERN_SLICE_OF_LIFE_ROMANCE',
      name: '☕ Đô Thị Đời Thường, Tâm Lý Chữa Lành & Lãng Mạn',
      recommendedTemperature: 0.85,
      recommendedTargetWords: 3400,
      defaultPov: 'Ngôi thứ 3 giới hạn hoặc Ngôi thứ 1 giàu cảm xúc',
      stylisticRules: [
        'Tập trung vào những rung động tinh tế, cử chỉ nhỏ nhặt đời thường (tiếng muỗng chạm ly sứ, ánh nắng chiều qua rèm cửa, mùi mưa đầu mùa).',
        'Tránh kịch tính hóa khiên cưỡng; để cảm xúc nhân vật phát triển tự nhiên qua đối thoại và sự đồng cảm.',
        'Ngôn từ trong sáng, giàu chất thơ và chiều sâu chiêm nghiệm.',
        'Chuẩn hóa hội thoại: - Câu thoại (Tên nhân vật).'
      ],
      bibleTemplatePreset: [
        '# 🏛️ KHUNG STORY BIBLE: ĐÔ THỊ CHỮA LÀNH & TÂM LÝ TÌNH CẢM',
        '',
        '## 1. KHÔNG GIAN SỐNG & NHỊP ĐIỆU ĐỜI THƯỜNG',
        '- Thành phố, Quán nhỏ, Khu phố hoặc Nơi làm việc:',
        '- Mùa trong năm & Sắc thái cảm xúc chủ đạo:',
        '',
        '## 2. CHIỀU SÂU TÂM LÝ HAI NHÂN VẬT CHÍNH',
        '- Vết thương lòng trong quá khứ / Áp lực cuộc sống hiện tại:',
        '- Cách hai nhân vật dần mở lòng và chữa lành cho nhau:',
        '',
        '## 3. CÁC CỘT MỐC PHÁT TRIỂN QUAN HỆ',
        '- Lần gặp gỡ đầu tiên:',
        '- Những kỷ niệm chung đã hình thành:'
      ].join('\n')
    },

    SCI_FI_CYBERPUNK_DYSTOPIA: {
      id: 'SCI_FI_CYBERPUNK_DYSTOPIA',
      name: '🌌 Khoa Huyễn Cyberpunk, Tương Lai & Trí Tuệ Nhân Tạo',
      recommendedTemperature: 0.8,
      recommendedTargetWords: 3800,
      defaultPov: 'Ngôi thứ 3 giới hạn',
      stylisticRules: [
        'Kết hợp miêu tả công nghệ cao (mạng thần kinh, cấy ghép sinh học, đô thị tầng ngầm, mưa axit) với triết lý về bản sắc con người và ký ức.',
        'Hệ thống công nghệ phải có quy칙 vật lý/logic nội tại rõ ràng.',
        'Chuẩn hóa hội thoại: - Câu thoại (Tên nhân vật).'
      ],
      bibleTemplatePreset: [
        '# 🏛️ KHUNG STORY BIBLE: KHOA HUYỄN CYBERPUNK & TƯƠNG LAI',
        '',
        '## 1. NỀN VĂN MINH & CẤU TRÚC ĐẠI ĐÔ THỊ',
        '- Năm / Kỷ nguyên tương lai:',
        '- Tập đoàn thống trị (Mega-Corporations) & Khu ổ chuột tầng đáy:',
        '',
        '## 2. QUY TẮC CÔNG NGHỆ & GIỚI HẠN SINH HỌC',
        '- Công nghệ cấy ghép / Mạng ý thức / AI:',
        '- Rủi ro quá tải thần kinh hoặc đánh mất ký ức gốc:',
        '',
        '## 3. NHIỆM VỤ & ÂM MƯU TRUNG TÂM',
        '- Dữ liệu mật đang bị săn lùng:',
        '- Sự thật đằng sau hệ thống điều khiển trung tâm:'
      ].join('\n')
    }
  });

  NS.genreCatalog = LITERARY_GENRE_ARCHETYPE_CATALOG;

  // ==========================================================================
  // PHẦN 14: BỘ QUẢN LÝ LỆNH TÁC VỤ & MACRO (`StudioCommandMacroEngine`)
  // ==========================================================================

  /**
   * Hỗ trợ thực thi chuỗi thao tác tự động (Macros) dành cho tác giả tiểu thuyết:
   * ví dụ "Chuẩn hóa văn bản + Quét từ sáo rỗng + Lưu tự động + Tạo mốc phiên bản".
   */
  class StudioCommandMacroEngine {
    constructor() {
      this.macros = new Map();
      this.executionLog = [];
      this._registerDefaultMacros();
    }

    registerMacro(macroId, definition) {
      if (!macroId || !definition || typeof definition.execute !== 'function') return;
      this.macros.set(String(macroId).trim(), {
        id: String(macroId).trim(),
        title: String(definition.title || macroId),
        description: String(definition.description || ''),
        stepsDescription: Array.isArray(definition.stepsDescription) ? definition.stepsDescription : [],
        execute: definition.execute
      });
    }

    async runMacro(macroId, contextPayload) {
      const id = String(macroId || '').trim();
      const macro = this.macros.get(id);
      if (!macro) {
        throw new Error(`Không tìm thấy Macro [${id}]`);
      }

      NS.profiler.startSpan(`macro:${id}`);
      try {
        const result = await Promise.resolve(macro.execute(contextPayload || {}));
        const elapsedMs = NS.profiler.endSpan(`macro:${id}`);
        this.executionLog.push({
          macroId: id,
          executedAt: Date.now(),
          elapsedMs,
          success: true
        });
        if (this.executionLog.length > 80) {
          this.executionLog.shift();
        }
        return result;
      } catch (err) {
        NS.profiler.endSpan(`macro:${id}`);
        this.executionLog.push({
          macroId: id,
          executedAt: Date.now(),
          success: false,
          errorMessage: err && err.message ? err.message : String(err)
        });
        NS.logger.error('MacroEngine', `Lỗi khi chạy Macro [${id}]`, err);
        throw err;
      }
    }

    _registerDefaultMacros() {
      this.registerMacro('MACRO_POLISH_AND_SNAPSHOT', {
        title: '✨ Chuẩn Hóa Hội Thoại + Lưu 3 Lớp + Chụp Phiên Bản',
        description: 'Tự động chuẩn hóa toàn bộ câu thoại về dạng "- Câu thoại (Tên nhân vật)", lưu an toàn 3 lớp và tạo mốc phiên bản mới.',
        stepsDescription: [
          'Bước 1: Chuẩn hóa dấu câu và định dạng hội thoại tiểu thuyết',
          'Bước 2: Lưu bản thảo vào IndexedDB, Két khẩn cấp và Ổ cứng',
          'Bước 3: Tạo bản chụp nhanh trong Kho lưu trữ phiên bản Tab 6'
        ],
        execute: async () => {
          if (NS.dialogueTools && typeof NS.dialogueTools.normalizeActiveManuscriptDialogue === 'function') {
            NS.dialogueTools.normalizeActiveManuscriptDialogue();
          }
          if (NS.autosave && typeof NS.autosave.saveNow === 'function') {
            await NS.autosave.saveNow(true);
          }
          if (NS.versionVault && typeof NS.versionVault.createSnapshot === 'function') {
            await NS.versionVault.createSnapshot('📸 Bản lưu sau khi Chuẩn hóa Hội thoại');
          }
          return { ok: true };
        }
      });

      this.registerMacro('MACRO_FULL_SAFETY_BACKUP', {
        title: '🛡️ Sao Lưu Khẩn Cấp Toàn Diện Dự Án',
        description: 'Kiểm định toàn vẹn trạng thái, lưu 3 lớp, tạo mốc phiên bản và đồng bộ toàn bộ 6 thư mục ổ cứng.',
        stepsDescription: [
          'Bước 1: Kiểm tra và tự phục hồi cấu trúc dữ liệu trạng thái',
          'Bước 2: Lưu đồng bộ toàn bộ chương và Story Bible',
          'Bước 3: Ghi file thật vào 6 thư mục trên ổ cứng máy tính (nếu đã kết nối)'
        ],
        execute: async () => {
          NS.stateGuardian.validateAndHealState();
          if (NS.autosave && typeof NS.autosave.saveNow === 'function') {
            await NS.autosave.saveNow(true);
          }
          if (NS.fsEngine && typeof NS.fsEngine.syncAllWorkspaceToDisk === 'function') {
            await NS.fsEngine.syncAllWorkspaceToDisk();
          }
          return { ok: true };
        }
      });
    }

    listMacros() {
      const list = [];
      this.macros.forEach((m) => {
        list.push({
          id: m.id,
          title: m.title,
          description: m.description,
          stepsDescription: m.stepsDescription
        });
      });
      return list;
    }
  }

  NS.macroEngine = new StudioCommandMacroEngine();

  // ==========================================================================
  // PHẦN 15: LÁ CHẮN BẮT LỖI TOÀN CỤC & TỰ ĐỘNG BẢO VỆ BẢN THẢO (`ErrorBoundary`)
  // ==========================================================================

  /**
   * Bắt mọi lỗi ngoại lệ chưa được xử lý (`window.onerror` và `unhandledrejection`)
   * để đảm bảo giao diện soạn thảo của người dùng không bao giờ bị đơ trắng màn hình,
   * đồng thời kích hoạt ghi khẩn cấp nội dung đang gõ vào LocalStorage.
   */
  class StudioGlobalErrorBoundary {
    constructor() {
      this.caughtErrors = [];
      this.maxRecordedErrors = 50;
      this.installed = false;
    }

    install() {
      if (this.installed || typeof window === 'undefined') return;
      this.installed = true;

      window.addEventListener('error', (event) => {
        this._recordAndProtect('WINDOW_ERROR', {
          message: event.message || 'Lỗi thực thi JavaScript',
          filename: event.filename || '',
          lineno: event.lineno || 0,
          colno: event.colno || 0
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        this._recordAndProtect('UNHANDLED_PROMISE_REJECTION', {
          message: reason && reason.message ? reason.message : String(reason || 'Promise rejected')
        });
      });
    }

    _recordAndProtect(errorType, details) {
      const entry = {
        type: errorType,
        details,
        timestamp: Date.now(),
        activeScreen: NS.state ? NS.state.activeScreen : 'UNKNOWN',
        activeChapterId: NS.state ? NS.state.activeChapterId : null
      };

      this.caughtErrors.push(entry);
      if (this.caughtErrors.length > this.maxRecordedErrors) {
        this.caughtErrors.shift();
      }

      NS.logger.error('ErrorBoundary', `Đã chặn lỗi toàn cục [${errorType}]`, details);

      // Bảo vệ khẩn cấp nội dung đang gõ trong khung soạn thảo chính nếu có
      try {
        if (typeof document !== 'undefined' && typeof localStorage !== 'undefined') {
          const editorEl = document.getElementById('textarea-chapter-content');
          const titleEl = document.getElementById('input-chapter-title');
          if (editorEl && editorEl.value && editorEl.value.trim().length > 0) {
            const emergencyBackup = {
              savedAt: Date.now(),
              reason: errorType,
              chapterId: NS.state ? NS.state.activeChapterId : null,
              chapterTitle: titleEl ? titleEl.value : 'Bản thảo khẩn cấp',
              content: editorEl.value
            };
            localStorage.setItem('noir_crash_shield_last_editor_backup', JSON.stringify(emergencyBackup));
          }
        }
      } catch (_) {}
    }

    getErrorHistory() {
      return this.caughtErrors.slice();
    }
  }

  NS.errorBoundary = new StudioGlobalErrorBoundary();
  NS.errorBoundary.install();

  // ==========================================================================
  // PHẦN 16: BỘ TIỆN ÍCH CẤU HÌNH NHANH & TRẠNG THÁI HỆ THỐNG (`KernelHelper`)
  // ==========================================================================

  /**
   * Cung cấp các phương thức kiểm tra sức khỏe toàn diện cho 30 Module.
   */
  const coreKernelModuleInstance = {
    name: 'mod01_core_kernel',
    version: STUDIO_CONSTANTS.VERSION,
    constants: STUDIO_CONSTANTS,
    state: NS.state,
    stateGuardian: NS.stateGuardian,
    bus: NS.bus,
    mutex: NS.mutex,
    domBinder: NS.domBinder,
    shortcuts: NS.shortcuts,
    profiler: NS.profiler,
    logger: NS.logger,
    crossTabSync: NS.crossTabSync,
    deviceDetector: NS.deviceDetector,
    schemaValidator: NS.schemaValidator,
    macroEngine: NS.macroEngine,
    errorBoundary: NS.errorBoundary,

    /**
     * Chạy kiểm định sức khỏe của Module 01 và trả về báo cáo chi tiết.
     */
    runHealthCheck() {
      const stateValidation = NS.stateGuardian.validateAndHealState();
      const busDiag = NS.bus.getDiagnosticsSummary();
      const mutexStats = NS.mutex.getStats();
      const domReport = NS.domBinder.getReport();
      const deviceProfile = NS.deviceDetector.refreshViewportMetrics();

      return {
        module: 'mod01_core_kernel_and_event_bus.js',
        version: STUDIO_CONSTANTS.VERSION,
        healthy: true,
        stateValidation,
        busDiag,
        mutexStats,
        domReport,
        deviceProfile,
        registeredModulesCount: Object.keys(NS.modules || {}).length
      };
    }
  };

  // ==========================================================================
  // PHẦN 17: BỘ DỰ PHÒNG BIỂU TƯỢNG TÁC GIẢ & FAVICON TOÀN HỆ THỐNG
  // ==========================================================================
  // Khi đẩy code lên GitHub Pages / web hosting mà thiếu thư mục `assets/`,
  // các icon PNG gốc bị 404; bộ dự phòng này tự động phục hồi ảnh tác giả từ
  // bản nhúng Base64 chuẩn ngay khi phát hiện lỗi tải để icon không bao giờ mất.

  const FAVICON_EMBEDDED_DATA_URI = 'data:image/png;base64,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';
  const AUTHOR_ICON_EMBEDDED_DATA_URI = 'data:image/png;base64,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';

  NS.FAVICON_EMBEDDED_DATA_URI = FAVICON_EMBEDDED_DATA_URI;
  NS.AUTHOR_ICON_EMBEDDED_DATA_URI = AUTHOR_ICON_EMBEDDED_DATA_URI;
  NS.assetsPortraitAvailable = null;

  function isPortraitAssetUrl(rawUrl) {
    const val = String(rawUrl || '').trim();
    if (!val || val.startsWith('data:')) return false;
    return (
      /(?:^|[/?#])assets\/(?:app-icon-|favicon-portrait|apple-touch-icon)/i.test(val) ||
      /(?:^|[/?#])favicon\.ico(?:$|[?#])/i.test(val)
    );
  }

  /**
   * Chuyển thẻ `<img>` icon tác giả bị lỗi tải sang bản PNG nhúng sẵn trong JS.
   */
  NS.applyAuthorIconFallback = function applyAuthorIconFallback(imgEl) {
    if (!imgEl || imgEl.tagName !== 'IMG') return false;
    const currentSrc = imgEl.getAttribute('src') || imgEl.src || '';
    if (!isPortraitAssetUrl(currentSrc)) return false;
    if (imgEl.dataset && imgEl.dataset.authorIconFallbackApplied === 'true') return false;
    if (imgEl.dataset) {
      imgEl.dataset.authorIconFallbackApplied = 'true';
    }
    NS.assetsPortraitAvailable = false;
    imgEl.src = AUTHOR_ICON_EMBEDDED_DATA_URI;
    return true;
  };

  /**
   * Phục hồi các thẻ `<link rel="icon">` / `apple-touch-icon` / `manifest` sang bản nhúng khi `assets/` 404.
   */
  NS.applyFaviconFallbackLinks = function applyFaviconFallbackLinks() {
    if (typeof document === 'undefined' || !document.head) return 0;
    NS.assetsPortraitAvailable = false;
    let updatedCount = 0;
    document.head
      .querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"], meta[name="msapplication-TileImage"]')
      .forEach((el) => {
        const attr = el.tagName === 'META' ? 'content' : 'href';
        const val = el.getAttribute(attr) || '';
        if (!isPortraitAssetUrl(val)) return;
        const sizes = String(el.getAttribute('sizes') || '');
        const useSmall =
          el.tagName === 'LINK' &&
          !/apple-touch-icon/i.test(el.getAttribute('rel') || '') &&
          (/16x16|32x32/.test(sizes) || /\.ico(?:$|\?)/i.test(val));
        el.setAttribute(attr, useSmall ? FAVICON_EMBEDDED_DATA_URI : AUTHOR_ICON_EMBEDDED_DATA_URI);
        updatedCount++;
      });

    // Tạo PWA manifest nhúng icon nếu manifest.json trỏ tới assets/ bị thiếu trên host
    const manifestLink = document.head.querySelector('link[rel="manifest"]');
    if (manifestLink && !manifestLink.dataset.embeddedManifestApplied && typeof Blob === 'function' && typeof URL !== 'undefined') {
      try {
        manifestLink.dataset.embeddedManifestApplied = 'true';
        const fallbackManifest = {
          name: 'Web Viết Tiểu Thuyết Của Bi',
          short_name: 'Tiểu Thuyết Bi',
          start_url: './',
          display: 'standalone',
          background_color: '#09090b',
          theme_color: '#10b981',
          icons: [
            { src: AUTHOR_ICON_EMBEDDED_DATA_URI, sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: AUTHOR_ICON_EMBEDDED_DATA_URI, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        };
        const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(fallbackManifest)], { type: 'application/manifest+json' }));
        manifestLink.setAttribute('href', blobUrl);
        updatedCount++;
      } catch (_mErr) {}
    }
    return updatedCount;
  };

  /**
   * Gắn theo dõi lỗi tải & phục hồi tức thì cho mọi icon tác giả trong phạm vi `rootEl`.
   */
  NS.bindAuthorIconFallback = function bindAuthorIconFallback(rootEl) {
    if (typeof document === 'undefined') return 0;
    const scope = rootEl && typeof rootEl.querySelectorAll === 'function' ? rootEl : document;
    const imgs = [];
    if (scope.tagName === 'IMG') {
      imgs.push(scope);
    } else {
      scope.querySelectorAll('img').forEach((node) => imgs.push(node));
    }
    let handled = 0;
    imgs.forEach((imgEl) => {
      const srcVal = imgEl.getAttribute('src') || imgEl.src || '';
      if (!isPortraitAssetUrl(srcVal)) return;
      if (NS.assetsPortraitAvailable === false) {
        NS.applyAuthorIconFallback(imgEl);
        handled++;
        return;
      }
      if (imgEl.dataset && imgEl.dataset.authorIconErrorBound !== 'true') {
        imgEl.dataset.authorIconErrorBound = 'true';
        imgEl.addEventListener('error', () => {
          NS.applyAuthorIconFallback(imgEl);
        });
      }
      if (imgEl.complete && imgEl.naturalWidth === 0) {
        NS.applyAuthorIconFallback(imgEl);
      }
      handled++;
    });
    return handled;
  };

  /**
   * Trả về URL ảnh bìa MediaSession an toàn (tự động dùng bản nhúng nếu thiếu `assets/`).
   */
  NS.getPortraitArtworkUrl = function getPortraitArtworkUrl() {
    if (NS.assetsPortraitAvailable === false && NS.AUTHOR_ICON_EMBEDDED_DATA_URI) {
      return NS.AUTHOR_ICON_EMBEDDED_DATA_URI;
    }
    return './assets/app-icon-192.png';
  };

  /**
   * Cài bộ lắng nghe capture-phase toàn trang & kiểm tra sớm thư mục `assets/` đúng 1 lần.
   */
  NS.installAuthorIconGlobalFallback = function installAuthorIconGlobalFallback() {
    if (typeof document === 'undefined') return;
    if (!NS._authorIconCaptureInstalled) {
      NS._authorIconCaptureInstalled = true;
      document.addEventListener(
        'error',
        (evt) => {
          const target = evt && evt.target;
          if (target && target.tagName === 'IMG') {
            NS.applyAuthorIconFallback(target);
          }
        },
        true
      );
    }

    const scanAllIcons = () => NS.bindAuthorIconFallback(document);
    scanAllIcons();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scanAllIcons, { once: true });
    }
    if (typeof setTimeout === 'function') {
      setTimeout(scanAllIcons, 1400);
    }

    if (!NS._faviconProbeDone && typeof Image === 'function') {
      NS._faviconProbeDone = true;
      const probe = new Image();
      probe.onload = () => {
        if (probe.naturalWidth > 0) {
          NS.assetsPortraitAvailable = true;
        }
      };
      probe.onerror = () => {
        NS.applyFaviconFallbackLinks();
        scanAllIcons();
      };
      probe.src = 'assets/favicon-portrait-32.png?v=4402';
    }
  };

  NS.installAuthorIconGlobalFallback();

  NS.registerModule('mod01_core_kernel', coreKernelModuleInstance);
  NS.bus.emit(STUDIO_CONSTANTS.EVENTS.KERNEL_READY, {
    version: STUDIO_CONSTANTS.VERSION,
    timestamp: Date.now()
  });

})(typeof window !== 'undefined' ? window : globalThis);
