/**
 * ============================================================================
 * MODULE 33: BẢO CHỨNG KẾT NỐI API/FOLDER ĐA TẦNG, GIỌNG ĐỌC NEURAL VI/EN
 *            VÀ TRÌNH CHIẾU VIDEO GIAO DIỆN WEB THẬT
 * ============================================================================
 * Phiên bản: v38.3.0-SUPREME-MODULAR (2026)
 * Nhiệm vụ cốt lõi:
 *   1. UnifiedConnectionAndTierSynchronizer (`window.NoirStudio.unifiedConnectionGuard`):
 *      - Đồng bộ 100% trạng thái thực của Gemini API Key (đã verify Flash-Lite),
 *        Thư mục ổ cứng (FileSystem Handle / Mobile Fallback) và Gói tài khoản
 *        (Standard / Pro -> Argon 4 / Ultra -> Carbon 4) sang Tab 6, Mod 31, Header,
 *        Cổng Kết Nối, Két Sắt API và Chatbot Bi Số 8 — sửa dứt điểm lỗi báo sai
 *        "Chưa nối Key / Chưa gắn thư mục".
 *      - Bộ kiểm tra quyền truy cập trực tiếp Argon 4 / Carbon 4 / Pro qua v1beta,
 *        v1alpha và Vertex AI Express cho người dùng đã nâng cấp gói Pro/Ultra.
 *   2. BilingualNeuralVoiceStudio (`window.NoirStudio.neuralVoice`):
 *      - Động cơ chuẩn hóa phát âm Tiếng Việt & Tiếng Anh chuyên sâu: tách cụm
 *        nhịp thở tự nhiên, chuyển đổi ký hiệu kỹ thuật (PDF, DOCX, API, Argon 4,
 *        Carbon 4, 20.000+...), ưu tiên giọng Neural/Online tự nhiên (HoaiMy,
 *        NamMinh, Google Tiếng Việt, Aria/Jenny Natural) thay cho giọng robot cứng.
 *   3. RealDomVideoMirrorRenderer (`window.NoirStudio.liveDomVideoMirror`):
 *      - Nhân bản không-trùng-ID giao diện DOM THẬT của chính trang web đang chạy
 *        vào sân khấu video 1280x720 tỷ lệ chuẩn bên dưới lớp phủ Canvas điều hướng
 *        để video hướng dẫn chiếu chính xác 100% nút bấm và màn hình thật của web.
 *   4. Tab6SpotlightAndCollapseOrchestrator:
 *      - Tối ưu front-end Tab 6 gọn gàng: hiển thị Cụm Mục Nổi Bật Nhất + nút
 *        "Thu gọn hết các mục" / "Mở rộng tất cả" để người dùng đóng/mở tùy ý.
 * ============================================================================
 */
(function initNoirStudioUnifiedConnectionAndVoiceModule(globalScope) {
  'use strict';

  const root = globalScope || (typeof window !== 'undefined' ? window : globalThis);
  root.NoirStudio = root.NoirStudio || {};
  const NS = root.NoirStudio;

  // ==========================================================================
  // PHẦN 1: HẰNG SỐ ĐỊNH HÌNH, BẢNG GÓI TÀI KHOẢN & TỪ ĐIỂN PHÁT ÂM NEURAL
  // ==========================================================================

  const MOD33_CONFIG = Object.freeze({
    MODULE_VERSION: '38.3.0-CONNECTION-VOICE-MIRROR',
    STORAGE_KEYS: Object.freeze({
      PLAN_TIER: 'noir_v40_google_plan_tier_v1',
      PROBED_TIER_CAPS: 'noir_v40_probed_tier_capabilities_v1',
      VOICE_PREFS: 'noir_v40_neural_voice_prefs_v1',
      VOICE_PENDING_INSTALL: 'noir_v40_voice_pending_auto_enable_v1',
      TAB6_COLLAPSE_MODE: 'noir_v40_tab6_compact_mode_v1',
      MIRROR_VIDEO_MODE: 'noir_v40_video_real_dom_mode_v1',
    }),
    SELECTORS: Object.freeze({
      TAB6_SPOTLIGHT_DOCK: 'tab6-quick-spotlight-dock',
      TAB6_KEY_PILL: 'tab6-live-key-pill',
      TAB6_FOLDER_PILL: 'tab6-live-folder-pill',
      TAB6_TIER_BADGE: 'tab6-plan-tier-badge',
      TAB6_BTN_COLLAPSE_ALL: 'btn-tab6-collapse-all',
      TAB6_BTN_EXPAND_ALL: 'btn-tab6-expand-all',
      VIDEO_FRAME_WRAP: 'mod28-video-frame-wrap',
      VIDEO_MIRROR_STAGE: 'mod33-real-dom-stage',
      VIDEO_MIRROR_VIEWPORT: 'mod33-mirror-viewport',
      VOICE_PICKER_SELECT: 'mod33-voice-select',
      VOICE_QUALITY_PILL: 'mod33-voice-quality-pill',
      VOICE_TEST_BTN: 'mod33-btn-test-voice',
      VOICE_GUIDE_MODAL: 'modal-mod33-voice-install-guide',
      MIRROR_TOGGLE_BTN: 'mod33-btn-toggle-mirror-mode',
    }),
    VIRTUAL_VIEWPORT_W: 1280,
    VIRTUAL_VIEWPORT_H: 720,
    CHATBOT_DEFAULT_LITE_MODEL: 'gemini-3.5-flash-lite',
  });

  const GOOGLE_PLAN_TIERS_CATALOG = Object.freeze({
    STANDARD: Object.freeze({
      id: 'STANDARD',
      badgeLabel: 'Standard / Free API',
      shortTitle: '⚡ Gói Tiêu Chuẩn (Flash / Flash-Lite)',
      expectedModels: ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'],
      advisoryNote:
        'Tối ưu cho tốc độ nhanh và Chatbot Flash-Lite tiết kiệm quota. Có thể nâng cấp gói Pro/Ultra để mở khóa mô hình đại tự sự.',
      preferredDefaultTab3Model: 'gemini-3.8-flash',
    }),
    PRO: Object.freeze({
      id: 'PRO',
      badgeLabel: 'Google AI Pro (Hydrogen 4 & Argon 4 Ready)',
      shortTitle: '💎 Gói Pro — Kích hoạt Gemini Hydrogen 4, Argon 4 & 3.1 Pro',
      expectedModels: ['gemini-4-hydrogen', 'gemini-4-argon', 'gemini-3.1-pro-preview', 'gemini-2.5-pro'],
      advisoryNote:
        'Tài khoản Pro mở quyền chạy Gemini Hydrogen 4 (hỗ trợ tư duy XHIGH), Argon 4 và chuỗi Pro 3.1 / 2.5 sâu tâm lý.',
      preferredDefaultTab3Model: 'gemini-4-argon',
    }),
    ULTRA: Object.freeze({
      id: 'ULTRA',
      badgeLabel: 'Google AI Ultra (Hydrogen 4, Carbon 4 & Argon 4 Ready)',
      shortTitle: '🔥 Gói Ultra — Kích hoạt Carbon 4, Hydrogen 4 & Argon 4',
      expectedModels: [
        'gemini-4-carbon',
        'gemini-4-hydrogen',
        'gemini-4-argon',
        'gemini-3.1-pro-preview',
        'gemini-2.5-pro',
      ],
      advisoryNote:
        'Tài khoản Ultra cấp cao nhất: ưu tiên Gemini Carbon 4 (tư duy logic & tâm lý chiến đỉnh cao) cùng Argon 4 viết đại tự sự dài hơi.',
      preferredDefaultTab3Model: 'gemini-4-carbon',
    }),
  });

  const VIETNAMESE_NEURAL_LEXICON = Object.freeze([
    [/\bAPI\s*Key\b/gi, 'khóa A P I'],
    [/\bAPI\b/g, 'A P I'],
    [/\bPDF\b/gi, 'tệp Pê Đê Ép'],
    [/\bDOCX\b/gi, 'tệp Đốc Ích'],
    [/\bEPUB\b/gi, 'sách I Pắp'],
    [/\bJSON\b/gi, 'Giây Sân'],
    [/\bSVG\b/gi, 'sơ đồ trực quan'],
    [/\bBM25\b/gi, 'tìm kiếm thông minh'],
    [/\bRAG\b/gi, 'truy hồi ngữ cảnh'],
    [/\b60FPS\b/gi, '60 khung hình mỗi giây'],
    [/\b20\.000\+/g, 'hơn hai mươi nghìn'],
    [/\b20000\+/g, 'hơn hai mươi nghìn'],
    [/\b3\.000\s*[-–]\s*4\.000\+/g, 'ba đến hơn bốn nghìn'],
    [/\bNotebookLM\b/gi, 'Nốt Bút Lờ Em'],
    [/\bApps\s*Script\b/gi, 'Áp Sờ Críp'],
    [/\bYouTube\b/gi, 'Diu Túp'],
    [/\bTime-Machine\b/gi, 'Kho Lưu Trữ Thời Gian'],
    [/\bStory Bible\b/gi, 'Hồ sơ Cốt Truyện'],
    [/\bHydrogen\s*4\b/gi, 'Hai-đrô-gen bốn'],
    [/\bArgon\s*4\b/gi, 'A-gôn bốn'],
    [/\bCarbon\s*4\b/gi, 'Các-bon bốn'],
    [/\bXHIGH\b/gi, 'siêu cao ích hai'],
    [/\bFlash-Lite\b/gi, 'Phờ-lát Lai'],
    [/\bFlash\b/gi, 'Phờ-lát'],
    [/\bIndexedDB\b/gi, 'kho dữ liệu trình duyệt'],
    [/\bLocalStorage\b/gi, 'bộ nhớ nhanh'],
    [/\bTab\s*([1-6])\b/gi, 'Mục $1'],
    [/\bMod\s*(\d+)\b/gi, 'Mô-đun $1'],
    [/\bBi\s*#?8\b/gi, 'Bi số tám'],
    [/\bVI\/EN\b/gi, 'Việt Anh'],
    [/\b24\/7\b/g, 'hai tư trên bảy'],
    [/\bLight\s*Novel\b/gi, 'tiểu thuyết'],
    [/\bChatbot\b/gi, 'Trợ lý Bi số tám'],
    [/\bQuota\b/gi, 'Hạn mức'],
    [/\bPrompt\b/gi, 'Câu lệnh'],
    [/\bTimeline\b/gi, 'Dòng thời gian'],
    [/\bPlot\s*Hole\b/gi, 'Lỗ hổng cốt truyện'],
    [/\bShow,\s*Don'?t\s*Tell\b/gi, 'tả cảnh thay vì kể lể'],
    [/\bReal-?time\b/gi, 'thời gian thực'],
    [/\bFullscreen\b/gi, 'toàn màn hình'],
    [/\bPomodoro\b/gi, 'Pô-mô-đô-rô'],
    [/\bHighlight\b/gi, 'làm nổi bật'],
    [/\bEndpoint\b/gi, 'cổng kết nối'],
    [/\bPro\b/g, 'Pờ-rô'],
    [/\bUltra\b/g, 'An-tra'],
    [/\bAI\b/g, 'trí tuệ nhân tạo'],
  ]);

  const ENGLISH_NEURAL_LEXICON = Object.freeze([
    [/\b60FPS\b/gi, 'sixty frames per second'],
    [/\b20[,.]000\+/g, 'over twenty thousand'],
    [/\bVI\/EN\b/gi, 'Vietnamese and English'],
    [/\bBi\s*#?8\b/gi, 'Magic 8-Ball Bi'],
    [/\bTab\s*([1-6])\b/gi, 'Tab $1'],
    [/\bMod\s*(\d+)\b/gi, 'Module $1'],
    [/\bHydrogen\s*4\b/gi, 'Hydrogen four'],
    [/\bArgon\s*4\b/gi, 'Argon four'],
    [/\bCarbon\s*4\b/gi, 'Carbon four'],
    [/\bXHIGH\b/gi, 'extra high thinking'],
    [/\bNotebookLM\b/gi, 'Notebook L M'],
    [/\bBM25\b/gi, 'B M 25'],
    [/\bRAG\b/gi, 'Retrieval Augmented Generation'],
    [/\bStory Bible\b/gi, 'Story Bible'],
    [/\bLight\s*Novel\b/gi, 'Light Novel'],
  ]);

  const VOICE_CALIBRATION_PRESETS = Object.freeze({
    STUDIO_NEURAL: Object.freeze({
      id: 'STUDIO_NEURAL',
      label: '🎙️ Giọng Thuyết Minh Studio (Tự nhiên, ấm áp)',
      rate: 0.98,
      pitch: 1.0,
      pauseScale: 1.0,
    }),
    STORYTELLER_WARM: Object.freeze({
      id: 'STORYTELLER_WARM',
      label: '📖 Giọng Kể Chuyện Truyền Cảm (Nhấn nhá chậm rãi)',
      rate: 0.93,
      pitch: 0.97,
      pauseScale: 1.18,
    }),
    QUICK_BRIEF: Object.freeze({
      id: 'QUICK_BRIEF',
      label: '⚡ Giọng Tóm Tắt Nhanh Gọn (Rõ nét, tiết kiệm thời gian)',
      rate: 1.08,
      pitch: 1.02,
      pauseScale: 0.78,
    }),
    EN_DOCUMENTARY: Object.freeze({
      id: 'EN_DOCUMENTARY',
      label: '🎬 English Neural Documentary (Balanced clarity)',
      rate: 0.97,
      pitch: 1.0,
      pauseScale: 1.05,
    }),
  });

  /**
   * Kịch bản ánh xạ từng cảnh Video Hướng Dẫn (Cảnh 1 -> 9) vào đúng phần tử DOM thật của web.
   */
  const CHAPTER_MIRROR_CHOREOGRAPHY = Object.freeze({
    CHAP_01_ENTRY_GATE_AND_ARCHITECTURE: Object.freeze({
      screenKey: 'SCREEN_1_WRITE',
      focusTargetId: 's14-desktop-nav-tabs',
      secondaryTargetId: 'btn-open-api-vault',
      captionBadge: 'CỔNG KẾT NỐI · TẢI APP PWA · 6 MÀN HÌNH',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Ủng hộ Đăng · Tải App & 6 Tab',
      pointerCurveOffset: { dx: 0, dy: -6 },
    }),
    CHAP_02_TAB1_EDITOR_DIFF_SENSORY: Object.freeze({
      screenKey: 'SCREEN_1_WRITE',
      focusTargetId: 'btn-approve-chapter',
      secondaryTargetId: 'textarea-chapter-content',
      captionBadge: 'TAB 1: VIẾT, DIFF AI, NGŨ QUAN & LORE',
      expandInMirror: [['tab1-extra-tools-collapsible-body', 'show']],
      showGateOverlayInMirror: false,
      pointerLabel: 'Duyệt Diff Google Docs & Ngũ quan',
      pointerCurveOffset: { dx: -10, dy: 4 },
    }),
    CHAP_03_TAB2_CHAPTERS_IMPORT_BM25: Object.freeze({
      screenKey: 'SCREEN_2_SOURCES',
      focusTargetId: 'btn-toggle-tab2-filters',
      secondaryTargetId: 'input-search-rag',
      captionBadge: 'TAB 2: LỌC CHƯƠNG, DOCX/PDF & BM25',
      expandInMirror: [['tab2-filter-import-collapsible-body', 'show']],
      showGateOverlayInMirror: false,
      pointerLabel: 'Lọc Nháp/Duyệt & Tra cứu BM25 0đ',
      pointerCurveOffset: { dx: 12, dy: 8 },
    }),
    CHAP_04_TAB3_AI_STUDIO_HYDROGEN4: Object.freeze({
      screenKey: 'SCREEN_3_AI',
      focusTargetId: 'btn-open-fullscreen-ai-command',
      secondaryTargetId: 'select-gemini-model',
      captionBadge: 'TAB 3: GEMINI 4 HYDROGEN & TƯ DUY XHIGH',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Hydrogen 4 #1 + Hộp lệnh Thu phóng',
      pointerCurveOffset: { dx: 0, dy: 0 },
    }),
    CHAP_05_TAB3_FIVE_MODES_DISTINCT: Object.freeze({
      screenKey: 'SCREEN_3_AI',
      focusTargetId: 'mode5-plot-diagram-studio',
      secondaryTargetId: 's20-quad-tab-selector',
      captionBadge: '5 CHẾ ĐỘ ĐỘC LẬP & SƠ ĐỒ MODE 5',
      expandInMirror: [['mode5-plot-diagram-studio', 'show']],
      showGateOverlayInMirror: false,
      pointerLabel: 'Mode 1 Tổng hợp · Mode 2->5 Tách biệt',
      pointerCurveOffset: { dx: 0, dy: 12 },
    }),
    CHAP_06_TAB4_BIBLE_NOTEBOOKLM: Object.freeze({
      screenKey: 'SCREEN_4_BIBLE',
      focusTargetId: 'btn-tab4-copy-notebooklm-prompt',
      secondaryTargetId: 'textarea-rendered-bible-content',
      captionBadge: 'TAB 4: STORY BIBLE & NOTEBOOKLM',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'PDF gộp toàn truyện -> NotebookLM',
      pointerCurveOffset: { dx: -8, dy: 4 },
    }),
    CHAP_07_TAB5_POMODORO_AUDIO_TYPO: Object.freeze({
      screenKey: 'SCREEN_5_AMBIENCE',
      focusTargetId: 's14-panel-pomodoro-box',
      secondaryTargetId: 's14-panel-music-box',
      captionBadge: 'TAB 5 MỤC 1-3: NÚT ĐÓNG MỞ, POMODORO & A-B',
      expandInMirror: [
        ['s14-panel-pomodoro-box', 'show'],
        ['s14-panel-music-box', 'show'],
      ],
      showGateOverlayInMirror: false,
      pointerLabel: 'Nút Mở rộng/Thu gọn · Pomodoro & MP3',
      pointerCurveOffset: { dx: 6, dy: 6 },
    }),
    CHAP_08_TAB5_BACKDROP_MOD32: Object.freeze({
      screenKey: 'SCREEN_5_AMBIENCE',
      focusTargetId: 'mod32-backdrop-stage-panel',
      secondaryTargetId: 'btn-upload-custom-bg',
      captionBadge: 'TAB 5 MỤC 4: KHO TRANH & MOD 32',
      expandInMirror: [['s14-panel-typography-box', 'show']],
      showGateOverlayInMirror: false,
      pointerLabel: '8 Nền (OLED Đen/Trắng) & Soi 100%',
      pointerCurveOffset: { dx: 0, dy: -6 },
    }),
    CHAP_09_TAB5_YOUTUBE_MOD39: Object.freeze({
      screenKey: 'SCREEN_5_AMBIENCE',
      focusTargetId: 's14-card-youtube-btn',
      secondaryTargetId: 's14-panel-youtube-box',
      captionBadge: 'TAB 5 MỤC 5: YOUTUBE SẠCH QUẢNG CÁO & NỀN 16:9',
      expandInMirror: [['s14-panel-youtube-box', 'show']],
      showGateOverlayInMirror: false,
      pointerLabel: 'Không quảng cáo chết tiệt + Phát nền',
      pointerCurveOffset: { dx: 0, dy: 4 },
    }),
    CHAP_10_ARGON4_WEB_20K_BRIDGE: Object.freeze({
      screenKey: 'SCREEN_3_AI',
      focusTargetId: 'btn-open-fullscreen-ai-command',
      secondaryTargetId: 'btn-generate-chapter',
      captionBadge: 'CẦU NỐI 20.000+ TỪ ARGON 4 / CARBON 4',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Copy trọn Prompt -> Mở Gemini Web',
      pointerCurveOffset: { dx: 0, dy: 0 },
    }),
    CHAP_11_MASCOT_BI8_DUAL_CHAT: Object.freeze({
      screenKey: 'SCREEN_1_WRITE',
      focusTargetId: 'btn-open-free-chat-header',
      secondaryTargetId: 's14-desktop-nav-tabs',
      captionBadge: 'LINH VẬT VIÊN BI SỐ 8 (3D & FLASH-LITE)',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Nhấn Bi #8 góc phải · Dấu X góc trái',
      pointerCurveOffset: { dx: 0, dy: -4 },
    }),
    CHAP_12_TAB6_EXPORT_PDF_DOCX_VERSIONS: Object.freeze({
      screenKey: 'SCREEN_6_SYSTEM',
      focusTargetId: 'btn-create-manual-version',
      secondaryTargetId: 'btn-export-docx-custom',
      captionBadge: 'TAB 6: KẾT NỐI, TIME-MACHINE & PDF/DOCX',
      expandInMirror: [['tab6-version-vault-collapsible-body', 'show']],
      showGateOverlayInMirror: false,
      pointerLabel: 'Time-Machine Preview & Xuất Sách',
      pointerCurveOffset: { dx: 0, dy: 4 },
    }),
    CHAP_13_TAB6_ENCYCLOPEDIA_VIDEO_AI_BAR: Object.freeze({
      screenKey: 'SCREEN_6_SYSTEM',
      focusTargetId: 'tab6-acc-4-tutorial-encyclopedia',
      secondaryTargetId: 'btn-toggle-tab6-acc-4',
      captionBadge: 'MOD 28/31/33: BÁCH KHOA 44 MODULE & GIỌNG NEURAL',
      expandInMirror: [['tab6-acc-4-body', 'show']],
      showGateOverlayInMirror: false,
      pointerLabel: 'Bách khoa 44 Module & Video Toàn màn',
      pointerCurveOffset: { dx: -6, dy: 6 },
    }),
    CHAP_14_TAB6_BUG_RELAY_CREDITS_SHIELD: Object.freeze({
      screenKey: 'SCREEN_6_SYSTEM',
      focusTargetId: 'btn-tab6-top-bug-report',
      secondaryTargetId: 'btn-tab6-top-credits',
      captionBadge: 'MOD 34-38: BUG SHEETS, CREDITS "BI" & LÁ CHẮN',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Gửi Bug Google Sheet · Tác giả Bi',
      pointerCurveOffset: { dx: 4, dy: 4 },
    }),
    CHAP_15_GUEST_MODE_AND_JSON_PERSISTENCE: Object.freeze({
      screenKey: 'SCREEN_1_WRITE',
      focusTargetId: 'fs-status-dot',
      secondaryTargetId: 'brand-autosave-pill',
      captionBadge: 'MOD 41 GUEST MODE & LƯU _STUDIO_WORKSPACE_STATE.JSON',
      expandInMirror: [],
      showGateOverlayInMirror: true,
      pointerLabel: 'Guest Mode Mô Phỏng & JSON Lưu Trạng Thái',
      pointerCurveOffset: { dx: 0, dy: -4 },
    }),
    CHAP_16_WORLD_CLOCK_TIMEZONE_ALARM: Object.freeze({
      screenKey: 'SCREEN_1_WRITE',
      focusTargetId: 'mod42-open-modal-link',
      secondaryTargetId: 'mod42-header-live-clock',
      captionBadge: 'MOD 42: MÚI GIỜ QUỐC TẾ & BÁO THỨC MP3',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Chạm link dưới tiêu đề chỉnh Giờ & Báo thức',
      pointerCurveOffset: { dx: 8, dy: 6 },
    }),
    CHAP_17_REALTIME_WEATHER_SKY_60FPS: Object.freeze({
      screenKey: 'SCREEN_1_WRITE',
      focusTargetId: 'mod42-open-modal-link',
      secondaryTargetId: 'brand-autosave-pill',
      captionBadge: 'MOD 43: THỜI TIẾT THỰC & BẦU TRỜI 60FPS (6×28)',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: '6 Khung giờ × 28 WMO · Nền Bầu Trời 60FPS',
      pointerCurveOffset: { dx: 6, dy: 8 },
    }),
    CHAP_18_MOBILE_BACKGROUND_AUDIO_MINI_SCREEN: Object.freeze({
      screenKey: 'SCREEN_5_AMBIENCE',
      focusTargetId: 's14-card-youtube-btn',
      secondaryTargetId: 's14-panel-music-box',
      captionBadge: 'PHÁT TRONG NỀN & MÀN HÌNH THU NHỎ KÉO THẢ',
      expandInMirror: [
        ['s14-panel-youtube-box', 'show'],
        ['s14-panel-music-box', 'show'],
      ],
      showGateOverlayInMirror: false,
      pointerLabel: 'Tắt máy vẫn nghe · Kéo thả về lại Tab 5',
      pointerCurveOffset: { dx: 0, dy: 4 },
    }),
    CHAP_19_PWA_APP_INSTALL_AND_PORTRAIT_ICONS: Object.freeze({
      screenKey: 'SCREEN_6_SYSTEM',
      focusTargetId: 'mod29-tab6-pwa-status-host',
      secondaryTargetId: 'btn-s6-quick-gate',
      captionBadge: 'MOD 29 & 37: TẢI APP ĐỘC LẬP & ICON CHÂN DUNG MỚI',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Cài App Laptop/Mobile · Icon Chân Dung Mới',
      pointerCurveOffset: { dx: 0, dy: 4 },
    }),
    CHAP_20_MOD44_TRAFFIC_BOX_SUMMARY: Object.freeze({
      screenKey: 'SCREEN_6_SYSTEM',
      focusTargetId: 'tab6-mod44-traffic-host',
      secondaryTargetId: 'btn-tab6-top-credits',
      captionBadge: 'MOD 44: Ô THỐNG KÊ TRUY CẬP WEB TAB 6 (44 MODULE)',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Đang xem · Hôm nay · Tuần · Tháng · Năm · Lịch sử',
      pointerCurveOffset: { dx: 0, dy: 2 },
    }),
    CHAP_21_V46_STREAM_FONTSCALE_MISC: Object.freeze({
      screenKey: 'SCREEN_6_SYSTEM',
      focusTargetId: 'tab6-misc-fun-card',
      secondaryTargetId: 'tab6-system-font-scale-bar',
      captionBadge: 'V46: STREAM/PIP · REPEAT/A-B · CỠ CHỮ · MỤC #5 LINH TINH',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Cỡ chữ Toàn Web · Chuỗi Điểm Danh · Mục #5 Linh Tinh',
      pointerCurveOffset: { dx: 0, dy: 4 },
    }),
    CHAP_22_YT_MP3_BACKGROUND_SYNC: Object.freeze({
      screenKey: 'SCREEN_5_AMBIENCE',
      focusTargetId: 's14-panel-music-box',
      secondaryTargetId: 's14-card-youtube-btn',
      captionBadge: 'MỤC 5 ➔ MỤC 3 MP3 NỀN · ĐỒNG BỘ 2 CHIỀU · XUNG ĐỘT THÔNG MINH',
      expandInMirror: [
        ['s14-panel-youtube-box', 'show'],
        ['s14-panel-music-box', 'show'],
      ],
      showGateOverlayInMirror: false,
      pointerLabel: 'Âm thanh YouTube tự nối sang MP3 Mục 3 phát nền',
      pointerCurveOffset: { dx: 0, dy: 4 },
    }),
    CHAP_23_AUTOSAVE_EVERY_2S_AND_UI_STATE: Object.freeze({
      screenKey: 'SCREEN_1_WRITE',
      focusTargetId: 'brand-autosave-pill',
      secondaryTargetId: 'textarea-chapter-content',
      captionBadge: 'TỰ LƯU MỖI 2 GIÂY · LƯU GẤP/MỞ KHỐI · LƯU TAB & VỊ TRÍ CUỘN',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Tự lưu 3 tầng mọi thay đổi chữ, gấp/mở & vị trí Tab',
      pointerCurveOffset: { dx: 8, dy: 6 },
    }),
    CHAP_24_SIMPLIFIED_ENTRY_GATE_AND_NOTICES: Object.freeze({
      screenKey: 'SCREEN_6_SYSTEM',
      focusTargetId: 'btn-s6-quick-gate',
      secondaryTargetId: 'btn-tab6-top-bug-report',
      captionBadge: 'CỔNG VÀO GỌN SẠCH · CUỘN MƯỢT PC/MOBILE · POPUP THÔNG BÁO GOOGLE SHEET',
      expandInMirror: [],
      showGateOverlayInMirror: false,
      pointerLabel: 'Cổng Kết Nối tinh gọn 2 bước & Popup Sheet',
      pointerCurveOffset: { dx: 0, dy: 4 },
    }),
    CHAP_25_MOBILE_FULLSCREEN_UI_NO_TOP_CLIP: Object.freeze({
      screenKey: 'SCREEN_6_SYSTEM',
      focusTargetId: 'btn-s6-card-tutorial',
      secondaryTargetId: 'mod42-open-modal-link',
      captionBadge: 'MOBILE KHÔNG MẤT ĐỈNH · POPUP AN TOÀN · FULLSCREEN VIDEO MOB/PC',
      expandInMirror: [['tab6-acc-4-body', 'show']],
      showGateOverlayInMirror: false,
      pointerLabel: 'Khóa đỉnh Mobile 0 cắt + Video Fullscreen Mọi Màn Hình',
      pointerCurveOffset: { dx: 0, dy: 4 },
    }),
  });

  // ==========================================================================
  // PHẦN 2: TIỆN ÍCH CỤC BỘ AN TOÀN (KHÔNG PHỤ THUỘC CHÉO)
  // ==========================================================================

  function readStorageSafe(key, fallbackVal = '') {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        return val !== null ? val : fallbackVal;
      }
    } catch (_e) {}
    return fallbackVal;
  }

  function writeStorageSafe(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, String(value));
        return true;
      }
    } catch (_e) {}
    return false;
  }

  function writeJsonStorageSafe(key, obj) {
    try {
      return writeStorageSafe(key, JSON.stringify(obj));
    } catch (_e) {
      return false;
    }
  }

  function readJsonStorageSafe(key, fallbackObj = null) {
    try {
      const raw = readStorageSafe(key, '');
      if (!raw) return fallbackObj;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallbackObj;
    } catch (_e) {
      return fallbackObj;
    }
  }

  function escapeHtmlSafe(raw) {
    if (NS.uiUtils?.escapeHtml) return NS.uiUtils.escapeHtml(raw);
    return String(raw ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripEmojisAndMarkdownForSpeech(text) {
    return String(text || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ')
      .replace(/```[\s\S]*?```/g, ' đoạn mã ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#+\s*/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[•▪►▸✅⚠️🔒🔓📁🔑💎🔥🌟⚡🧭🎬📤🕒🎱📋]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ==========================================================================
  // PHẦN 3: ĐỘNG CƠ ĐỒNG BỘ KẾT NỐI API KEY + THƯ MỤC + GÓI PRO/ULTRA (MOD 33)
  // ==========================================================================

  class UnifiedConnectionAndTierSynchronizer {
    constructor() {
      this.currentPlanTier = this.loadSavedPlanTier();
      this.probedCapabilities = readJsonStorageSafe(
        MOD33_CONFIG.STORAGE_KEYS.PROBED_TIER_CAPS,
        null
      );
      this.isProbingTier = false;
      this.busBound = false;
      this.domBound = false;
    }

    loadSavedPlanTier() {
      const saved = String(
        readStorageSafe(MOD33_CONFIG.STORAGE_KEYS.PLAN_TIER, 'PRO')
      ).toUpperCase();
      return GOOGLE_PLAN_TIERS_CATALOG[saved] ? saved : 'STANDARD';
    }

    setPlanTier(tierId, emitEvent = true) {
      const normalized = String(tierId || 'STANDARD').toUpperCase();
      const spec = GOOGLE_PLAN_TIERS_CATALOG[normalized] || GOOGLE_PLAN_TIERS_CATALOG.STANDARD;
      this.currentPlanTier = spec.id;
      writeStorageSafe(MOD33_CONFIG.STORAGE_KEYS.PLAN_TIER, spec.id);

      // Tự đồng bộ lựa chọn ở các ô dropdown Plan Tier trên UI
      document.querySelectorAll('[data-mod33-plan-tier-select]').forEach((sel) => {
        if (sel.value !== spec.id) sel.value = spec.id;
      });

      this.syncUnifiedConnectionUI();

      if (emitEvent && NS.bus?.emit) {
        NS.bus.emit('mod33:plan_tier_changed', {
          planTier: spec.id,
          spec,
        });
      }
      return spec;
    }

    getUnifiedConnectionSnapshot() {
      const router = NS.geminiRouter || NS.apiVault || null;
      const fs = NS.fsEngine || null;

      const activeKey = String(
        router?.getEffectiveActiveKey?.() || router?.getApiKey?.() || ''
      ).trim();
      const hasApiKey = Boolean(activeKey.length >= 8);
      const isFlashVerified = Boolean(
        hasApiKey && router?.isCurrentKeyFlashLiteVerified?.()
      );
      const verifySummary =
        isFlashVerified && typeof router?.loadFlashLiteVerificationRecord === 'function'
          ? router.loadFlashLiteVerificationRecord()
          : null;

      const folderConnected = Boolean(fs?.isConnected?.());
      const folderName = String(
        fs?.getConnectedFolderName?.() ||
          fs?.virtualFolderName ||
          (folderConnected ? 'Thư mục Novel Studio' : '')
      ).trim();
      const folderFallbackActive = Boolean(fs?.fallbackModeActive);

      const liveModels = router?.liveProbe?.getCachedOrLiveModels?.() || [];
      const selectedModel = String(
        router?.getSelectedModelId?.() || router?.selectedModelId || 'gemini-3.8-flash'
      );
      const thinkingLevelLabel =
        router?.getThinkingLevelLabel?.() || 'Trung bình (Cân bằng)';

      const argonDirectAvailable = liveModels.some((m) =>
        /argon/i.test(String(m || ''))
      );
      const carbonDirectAvailable = liveModels.some((m) =>
        /carbon/i.test(String(m || ''))
      );
      const proDirectAvailable = liveModels.some((m) =>
        /pro/i.test(String(m || ''))
      );

      const chatbotModel = String(
        NS.mascotBi?.resolveEnforcedAiConfigForMode?.()?.modelId ||
          NS.mascotBi?.prefs?.chatModelId ||
          MOD33_CONFIG.CHATBOT_DEFAULT_LITE_MODEL
      );

      const keyMask = hasApiKey
        ? `${activeKey.slice(0, 4)}...${activeKey.slice(-4)}`
        : '';

      return {
        hasApiKey,
        keyMask,
        isFlashVerified,
        verifyEndpoint: verifySummary?.modelEndpoint || '',
        verifyTransport: verifySummary?.transportType || '',
        folderConnected,
        folderName,
        folderFallbackActive,
        planTier: this.currentPlanTier,
        planSpec: GOOGLE_PLAN_TIERS_CATALOG[this.currentPlanTier] || GOOGLE_PLAN_TIERS_CATALOG.STANDARD,
        liveModelsCount: liveModels.length,
        selectedModel,
        thinkingLevelLabel,
        chatbotModel,
        argonDirectAvailable,
        carbonDirectAvailable,
        proDirectAvailable,
        fullyReady: hasApiKey && isFlashVerified && folderConnected,
      };
    }

    /**
     * Kiểm tra thực tế API Key hiện tại có đang mở endpoint Argon 4 (gói Pro),
     * Carbon 4 (gói Ultra), hoặc Gemini 3.1/2.5 Pro trên tài khoản hay không,
     * đồng thời gợi ý rõ ràng cách dùng trực tiếp hoặc qua Cầu nối Gemini Web.
     */
    async probeFlagshipArgonAndCarbonCapabilities(showToast = true) {
      if (this.isProbingTier) return null;
      const router = NS.geminiRouter;
      const apiKey = String(
        router?.getEffectiveActiveKey?.() || router?.getApiKey?.() || ''
      ).trim();

      if (!apiKey) {
        if (showToast) {
          NS.uiUtils?.showToast?.(
            '⚠️ Chưa có Gemini API Key. Hãy nhập & xác thực Flash-Lite trước nhé!',
            'warning',
            3200
          );
        }
        return { ok: false, reason: 'NO_API_KEY' };
      }

      this.isProbingTier = true;
      this.setProbeResultBoxState('⏳ Đang kiểm tra danh sách mô hình sống (Hydrogen 4 / Argon 4 / Carbon 4 / Pro) từ khóa API...', 'pending');

      try {
        // 1. Gọi probe danh sách model live từ Google AI Studio (mở rộng pageSize=200 bên Mod 15)
        const probeRes = await router?.liveProbe?.probeKeyAndFetchLiveModels?.(apiKey);
        const liveList = router?.liveProbe?.getCachedOrLiveModels?.(apiKey) || [];

        const hasHydrogenDirect = liveList.some((id) => /hydrogen/i.test(id));
        const hasArgonDirect = liveList.some((id) => /argon/i.test(id));
        const hasCarbonDirect = liveList.some((id) => /carbon/i.test(id));
        const proModels = liveList.filter((id) => /pro/i.test(id));

        const resultObj = {
          ok: Boolean(probeRes?.ok),
          checkedAt: Date.now(),
          planTier: this.currentPlanTier,
          liveCount: liveList.length,
          hasHydrogenDirect,
          hasArgonDirect,
          hasCarbonDirect,
          proModels: proModels.slice(0, 6),
          hasProDirect: proModels.length > 0,
        };
        this.probedCapabilities = resultObj;
        writeJsonStorageSafe(MOD33_CONFIG.STORAGE_KEYS.PROBED_TIER_CAPS, resultObj);

        const summaryLines = [
          `• Kết nối Key (${apiKey.slice(0, 4)}...${apiKey.slice(-4)}): ${
            probeRes?.ok ? `✅ Hợp lệ (${liveList.length} mô hình)` : `⚠️ ${probeRes?.message || 'Không lấy được danh sách'}`
          }`,
          `• Gemini 4 Hydrogen (tư duy XHIGH): ${
            hasHydrogenDirect
              ? '✅ Tài khoản API mở sẵn Hydrogen 4!'
              : proModels.length > 0
              ? `⚡ Định tuyến dự phòng thông minh sang ${proModels[0]} khi gọi Hydrogen 4`
              : '⚡ Dùng cơ chế định tuyến tự động sang Flash/Pro khi cần'
          }`,
          `• Gói Pro → Argon 4 trực tiếp qua API: ${
            hasArgonDirect
              ? '✅ Tài khoản API mở sẵn Argon 4!'
              : proModels.length > 0
              ? `⚠️ Key API Studio mở sẵn ${proModels[0]} (gói Pro consumer chạy Argon 4 trực tiếp qua Cầu nối Gemini Web)`
              : '🔒 Chưa mở trực tiếp qua API Key này (dùng Cầu nối Gemini Web chạy Argon 4)'
          }`,
          `• Gói Ultra → Carbon 4 trực tiếp qua API: ${
            hasCarbonDirect
              ? '✅ Tài khoản API mở sẵn Carbon 4!'
              : proModels.length > 0
              ? `⚠️ Tự động định tuyến dự phòng sang ${proModels[0]} hoặc dùng Cầu nối Gemini Web cho Carbon 4`
              : '🔒 Chưa mở trực tiếp qua API Key này (dùng Cầu nối Gemini Web chạy Carbon 4)'
          }`,
        ];

        this.setProbeResultBoxState(
          summaryLines.join('\n'),
          hasHydrogenDirect || hasArgonDirect || hasCarbonDirect ? 'ok' : probeRes?.ok ? 'warn' : 'error'
        );

        if (showToast) {
          NS.uiUtils?.showToast?.(
            hasHydrogenDirect || hasArgonDirect || hasCarbonDirect
              ? '💎 Đã phát hiện endpoint Gemini 4 (Hydrogen / Argon / Carbon) mở trực tiếp trên Key của bạn!'
              : `✅ Key hợp lệ (${liveList.length} model; Pro live: ${proModels[0] || 'Flash'}). Đã đồng bộ sang toàn bộ 6 Tab!`,
            'success',
            4000
          );
        }

        this.syncUnifiedConnectionUI();
        return resultObj;
      } finally {
        this.isProbingTier = false;
      }
    }

    setProbeResultBoxState(message, tone = 'info') {
      document.querySelectorAll('[data-mod33-tier-probe-output]').forEach((box) => {
        box.textContent = message;
        box.className = `p-2.5 rounded-xl border text-[11px] leading-relaxed whitespace-pre-line font-monoCode ${
          tone === 'ok'
            ? 'border-emerald-500/45 bg-emerald-950/30 text-emerald-200'
            : tone === 'warn'
            ? 'border-amber-500/45 bg-amber-950/25 text-amber-200'
            : tone === 'error'
            ? 'border-rose-500/45 bg-rose-950/25 text-rose-200'
            : 'border-indigo-500/40 bg-indigo-950/25 text-indigo-200'
        }`;
      });
    }

    /**
     * Đồng bộ hóa bắt buộc trạng thái nối Thư mục + API Key ra tất cả màn hình.
     */
    async verifyAndRepairAllLinks(showToast = true) {
      const router = NS.geminiRouter;
      const fs = NS.fsEngine;

      // 1. Nếu Key chưa verify Flash-Lite mà đã có chuỗi key hợp lệ -> nhắc nhẹ hoặc thử verify lại
      const curKey = router?.getEffectiveActiveKey?.() || router?.getApiKey?.() || '';
      if (curKey && !router?.isCurrentKeyFlashLiteVerified?.()) {
        try {
          await router?.verifyKeyWithLowestFlashLite?.(curKey, { autoSave: true, emitEvents: true });
        } catch (_e) {}
      }

      // 2. Đồng bộ quyền Thư mục nếu đang có pending handle trên Desktop
      if (fs && !fs.isConnected() && fs.hasPendingReconnectHandle?.()) {
        try {
          await fs.reconnectLastFolder?.();
        } catch (_e2) {}
      }

      this.syncUnifiedConnectionUI();
      const snap = this.getUnifiedConnectionSnapshot();

      if (showToast) {
        if (snap.fullyReady) {
          NS.uiUtils?.showToast?.(
            `✅ Mọi kết nối đã đồng bộ thông suốt: Key (${snap.keyMask}) + Thư mục "${snap.folderName}"!`,
            'success',
            3500
          );
        } else {
          NS.uiUtils?.showToast?.(
            `ℹ️ Trạng thái: Key=${snap.hasApiKey ? 'OK' : 'Thiếu'}, Flash-Lite=${snap.isFlashVerified ? 'OK' : 'Chưa verify'}, Thư mục=${snap.folderConnected ? snap.folderName : 'Chưa gắn'}.`,
            'warn',
            3800
          );
        }
      }
      return snap;
    }

    injectPlanTierControlsIntoVaultAndGate() {
      // Chèn bộ chọn Gói Tài Khoản Pro / Ultra & nút Kiểm tra vào #modal-api-key-vault
      const vaultStatus = document.getElementById('apikey-verify-status');
      if (vaultStatus && !document.getElementById('mod33-vault-plan-tier-box')) {
        const box = document.createElement('div');
        box.id = 'mod33-vault-plan-tier-box';
        box.className =
          'p-3 rounded-xl border border-purple-500/40 bg-purple-950/20 space-y-2 text-[11px]';
        box.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label for="select-mod33-vault-plan-tier" class="font-extrabold text-purple-300">
              👑 Gói Tài Khoản Google AI Của Bạn (Pro → Argon 4 · Ultra → Carbon 4):
            </label>
            <select id="select-mod33-vault-plan-tier" data-mod33-plan-tier-select="1" class="px-2.5 py-1 rounded-lg border border-purple-400/50 bg-zinc-950 text-purple-200 font-bold text-[11px]">
              <option value="STANDARD">⚡ Standard / Free API (Flash & Flash-Lite)</option>
              <option value="PRO">💎 Google AI Pro (Mở Argon 4 & Pro 3.1)</option>
              <option value="ULTRA">🔥 Google AI Ultra (Mở Carbon 4 & Argon 4)</option>
            </select>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-zinc-300 leading-snug flex-1 min-w-[200px]">
              Nếu Key Google Cloud / AI Studio có mở quyền Pro/Ultra trả phí, hệ thống sẽ ưu tiên gọi thẳng <strong>Argon 4 / Carbon 4</strong> trước tiên.
            </span>
            <button type="button" id="btn-mod33-probe-flagship-tiers" class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[11px] shrink-0 transition">
              🔍 Quét Quyền Argon 4 / Carbon 4
            </button>
          </div>
          <div data-mod33-tier-probe-output="1" class="p-2 rounded-lg border border-zinc-800 bg-zinc-950/75 text-[10.5px] text-zinc-400">
            Bấm "Quét Quyền Argon 4 / Carbon 4" để kiểm tra danh sách mô hình thực tế gắn với API Key hiện tại.
          </div>
        `;
        vaultStatus.parentNode.insertBefore(box, vaultStatus.nextSibling);
        if (window.NoirNovel?.i18n?.translateElement) {
          window.NoirNovel.i18n.translateElement(box);
        }
      }

      document.querySelectorAll('[data-mod33-plan-tier-select]').forEach((sel) => {
        if (sel.value !== this.currentPlanTier) {
          sel.value = this.currentPlanTier;
        }
        if (!sel.dataset.mod33Bound) {
          sel.dataset.mod33Bound = '1';
          sel.addEventListener('change', () => {
            this.setPlanTier(sel.value, true);
          });
        }
      });

      const probeBtn = document.getElementById('btn-mod33-probe-flagship-tiers');
      if (probeBtn && !probeBtn.dataset.mod33Bound) {
        probeBtn.dataset.mod33Bound = '1';
        probeBtn.addEventListener('click', () => {
          this.probeFlagshipArgonAndCarbonCapabilities(true);
        });
      }
    }

    syncUnifiedConnectionUI() {
      const snap = this.getUnifiedConnectionSnapshot();
      const tr = (s) => {
        const text = String(s || '');
        return window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(text) : text;
      };

      // 1. Cập nhật Cụm Thanh Trạng Thái Tab 6 (#tab6-quick-spotlight-dock)
      const keyPill = document.getElementById(MOD33_CONFIG.SELECTORS.TAB6_KEY_PILL);
      if (keyPill) {
        keyPill.dataset.i18nIgnore = '1';
        if (snap.isFlashVerified) {
          keyPill.textContent = tr(`🔑 API Key: ✅ Đã nối & verify (${snap.keyMask})`);
          keyPill.className =
            'px-2.5 py-1 rounded-full border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-bold text-[11px]';
        } else if (snap.hasApiKey) {
          keyPill.textContent = tr(`🔑 API Key: Đã nạp (${snap.keyMask} · chờ verify)`);
          keyPill.className =
            'px-2.5 py-1 rounded-full border border-amber-500/50 bg-amber-500/15 text-amber-300 font-bold text-[11px]';
        } else {
          keyPill.textContent = tr('🔑 API Key: ⚠️ Chưa nối');
          keyPill.className =
            'px-2.5 py-1 rounded-full border border-rose-500/50 bg-rose-500/15 text-rose-300 font-bold text-[11px]';
        }
      }

      const folderPill = document.getElementById(MOD33_CONFIG.SELECTORS.TAB6_FOLDER_PILL);
      if (folderPill) {
        folderPill.dataset.i18nIgnore = '1';
        if (snap.folderConnected) {
          const folderDisplay = snap.folderName || tr('Đã gắn an toàn');
          folderPill.textContent = `${tr('📁 Thư mục:')} ✅ ${folderDisplay}`;
          folderPill.className =
            'px-2.5 py-1 rounded-full border border-sky-500/50 bg-sky-500/15 text-sky-300 font-bold text-[11px]';
        } else {
          folderPill.textContent = tr('📁 Thư mục: ⚠️ Chưa gắn ổ cứng');
          folderPill.className =
            'px-2.5 py-1 rounded-full border border-rose-500/50 bg-rose-500/15 text-rose-300 font-bold text-[11px]';
        }
      }

      const tierBadge = document.getElementById(MOD33_CONFIG.SELECTORS.TAB6_TIER_BADGE);
      if (tierBadge) {
        tierBadge.dataset.i18nIgnore = '1';
        tierBadge.textContent = tr(`👑 ${snap.planSpec.badgeLabel} · Chat mặc định: ${snap.chatbotModel}`);
      }

      // 2. Đồng bộ sang Mod 31 nếu đang gắn trong Tab 6
      if (NS.featureDirectory && typeof NS.featureDirectory.refreshLiveDiagnosticsStrip === 'function') {
        NS.featureDirectory.refreshLiveDiagnosticsStrip();
      }

      // 3. Đồng bộ lại thanh trạng thái Chatbot Bi Số 8
      if (NS.mascotBi && typeof NS.mascotBi.updateConnectionPillStatus === 'function') {
        NS.mascotBi.updateConnectionPillStatus();
      }

      // 4. Đồng bộ Header nút thư mục
      const headerFolderBtn = document.getElementById('btn-connect-local-folder');
      if (headerFolderBtn && snap.folderConnected) {
        headerFolderBtn.dataset.i18nIgnore = '1';
        headerFolderBtn.textContent = `📁 ${snap.folderName ? snap.folderName.slice(0, 14) : tr('Ổ cứng OK')}`;
      }
    }

    bindGlobalConnectionListeners() {
      if (!this.busBound && NS.bus?.on) {
        this.busBound = true;
        const events = NS.constants?.EVENTS || {};
        const evNames = [
          events.API_KEY_VERIFIED || 'ai:api_key_verified',
          events.API_KEY_UPDATED || 'ai:api_key_updated',
          events.FOLDER_CONNECTED || 'storage:folder_connected',
          'gate:entered_studio',
          'mod29:screen_changed',
          'i18n:changed',
        ];
        evNames.forEach((ev) => {
          NS.bus.on(ev, () => {
            setTimeout(() => this.syncUnifiedConnectionUI(), 20);
          });
        });
      }
      if (typeof window !== 'undefined' && !window.__mod33I18nBound) {
        window.__mod33I18nBound = true;
        window.addEventListener('noir:i18n:changed', () => {
          setTimeout(() => {
            this.syncUnifiedConnectionUI();
            const vaultBox = document.getElementById('mod33-vault-plan-tier-box');
            if (vaultBox && window.NoirNovel?.i18n?.translateElement) {
              window.NoirNovel.i18n.translateElement(vaultBox);
            }
          }, 25);
        });
      }

      if (!this.domBound && typeof document !== 'undefined') {
        this.domBound = true;
        document.addEventListener('click', (ev) => {
          const btn = ev.target.closest?.('[data-s14-tab="SCREEN_6_SYSTEM"]');
          if (btn) {
            setTimeout(() => this.syncUnifiedConnectionUI(), 40);
          }
        });
      }
    }

    init() {
      this.injectPlanTierControlsIntoVaultAndGate();
      this.bindGlobalConnectionListeners();
      this.syncUnifiedConnectionUI();
    }
  }

  // ==========================================================================
  // PHẦN 4: BỘ TỔNG HỢP GIỌNG NÓI AI TỰ NHIÊN 6 NGÔN NGỮ (NEURAL + GOOGLE DỊCH TTS)
  // ==========================================================================

  const SUPPORTED_VOICE_LANGS = Object.freeze({
    'vi-VN': { prefix: 'vi', gttsTl: 'vi', youdaoLe: '', label: 'Tiếng Việt', i18nCode: 'vi', geminiVoice: 'Aoede' },
    'en-US': { prefix: 'en', gttsTl: 'en', youdaoLe: 'en', label: 'English', i18nCode: 'en', geminiVoice: 'Puck' },
    'zh-CN': { prefix: 'zh-cn', altPrefix: 'zh', gttsTl: 'zh-CN', youdaoLe: 'zh', label: '中文 (简体)', i18nCode: 'zh-CN', geminiVoice: 'Kore' },
    'zh-TW': { prefix: 'zh-tw', altPrefix: 'zh', gttsTl: 'zh-TW', youdaoLe: 'zh', label: '中文 (繁體)', i18nCode: 'zh-TW', geminiVoice: 'Kore' },
    'ko-KR': { prefix: 'ko', gttsTl: 'ko', youdaoLe: 'ko', label: '한국어', i18nCode: 'ko', geminiVoice: 'Kore' },
    'ja-JP': { prefix: 'ja', gttsTl: 'ja', youdaoLe: 'jap', label: '日本語', i18nCode: 'ja', geminiVoice: 'Aoede' },
  });
  const GOOGLE_TRANSLATE_TTS_URI = '__GOOGLE_TRANSLATE_TTS__';
  const GEMINI_AI_TTS_URI = '__GEMINI_AI_TTS__';

  function normalizeVoiceLangCode(rawCode) {
    const c = String(rawCode || '').trim().toLowerCase().replace('_', '-');
    if (c === 'en' || c.startsWith('en-')) return 'en-US';
    if (c === 'zh-tw' || c === 'zh-hk' || c === 'zh-hant' || c === 'tw') return 'zh-TW';
    if (c === 'zh' || c === 'zh-cn' || c === 'zh-hans' || c === 'zh-sg') return 'zh-CN';
    if (c === 'ko' || c.startsWith('ko-')) return 'ko-KR';
    if (c === 'ja' || c.startsWith('ja-')) return 'ja-JP';
    return 'vi-VN';
  }

  class BilingualNeuralVoiceStudio {
    constructor() {
      const saved = readJsonStorageSafe(MOD33_CONFIG.STORAGE_KEYS.VOICE_PREFS, null);
      this.prefs = {
        language: normalizeVoiceLangCode(saved?.language || 'vi-VN'),
        preferredVoiceByLang:
          saved?.preferredVoiceByLang && typeof saved.preferredVoiceByLang === 'object'
            ? {
                'vi-VN': '',
                'en-US': '',
                'zh-CN': '',
                'zh-TW': '',
                'ko-KR': '',
                'ja-JP': '',
                ...saved.preferredVoiceByLang,
              }
            : { 'vi-VN': '', 'en-US': '', 'zh-CN': '', 'zh-TW': '', 'ko-KR': '', 'ja-JP': '' },
        rate: Number(saved?.rate || 0.98),
        pitch: Number(saved?.pitch || 1.01),
      };
      this.activePlaybackToken = 0;
      this.pendingPauseTimer = null;
      this.currentUtterance = null;
      this.currentGttsAudio = null;
      this.isSpeaking = false;
      this.lastFailureReason = '';
      this._lastMissingViVoiceToastMs = 0;
      this.cachedVoices = [];
      this.voicesLoaded = false;
      this._voiceWatcherTimer = null;
      this._voiceWatcherChecks = 0;
      this._activeGuideSource = '';
    }

    normalizeLangCode(code) {
      return normalizeVoiceLangCode(code);
    }

    getSupportedVoiceLanguages() {
      return SUPPORTED_VOICE_LANGS;
    }

    getActiveUiVoiceLang() {
      const uiLang = NS.i18n?.getLanguage?.() || window.NoirNovel?.i18n?.getLanguage?.() || 'vi';
      return normalizeVoiceLangCode(uiLang);
    }

    detectTextVoiceLang(rawText, fallbackLang = null) {
      const text = String(rawText || '').trim();
      if (!text) return normalizeVoiceLangCode(fallbackLang || this.getActiveUiVoiceLang());
      // Nhật (Hiragana / Katakana)
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja-JP';
      // Hàn (Hangul)
      if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'ko-KR';
      // Hoa (CJK Ideographs) -> phân biệt Phồn thể / Giản thể theo UI đang chọn
      if (/[\u4E00-\u9FFF]/.test(text)) {
        const ui = this.getActiveUiVoiceLang();
        return ui === 'zh-TW' ? 'zh-TW' : 'zh-CN';
      }
      // Tiếng Việt có dấu đặc trưng
      if (/[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/.test(text)) {
        return 'vi-VN';
      }
      if (fallbackLang) return normalizeVoiceLangCode(fallbackLang);
      return this.getActiveUiVoiceLang();
    }

    getDirectVoiceDownloadInfo() {
      const ua =
        typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
      const isAndroid = /android/i.test(ua);
      const isWindows = /windows/i.test(ua);
      const isMac = /macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua);
      const isIos = /iphone|ipad|ipod/i.test(ua);
      const primaryUrl = isAndroid
        ? 'https://play.google.com/store/apps/details?id=com.google.android.tts'
        : 'https://www.microsoft.com/vi-vn/edge/download';
      const secondaryPackUrl =
        'https://support.microsoft.com/vi-vn/windows/g%C3%B3i-ng%C3%B4n-ng%E1%BB%AF-cho-windows-a04c4b69-74b9-bfa6-8863-ece5743b0b81';
      return {
        isAndroid,
        isWindows,
        isMac,
        isIos,
        primaryUrl,
        primaryLabel: isAndroid
          ? '📲 Tải Giọng Tiếng Việt Google TTS Trên Web (Play Store) ↗'
          : '🌐 Tải Microsoft Edge Trên Web (Có Sẵn Giọng AI Việt Hoài My/Nam Minh) ↗',
        secondaryPackUrl,
        secondaryPackLabel:
          '💻 Tải Gói Ngôn Ngữ & Giọng Nói Tiếng Việt Cho Windows Chrome ↗',
      };
    }

    hasVoiceForLanguage(langCode = 'vi-VN') {
      const targetLang = normalizeVoiceLangCode(langCode);
      if (this.isSupported() && this.getRankedVoicesForLanguage(targetLang).length > 0) {
        return true;
      }
      // Luôn có động cơ Google Dịch TTS (6 ngôn ngữ) dự phòng khi đang có mạng
      const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
      return Boolean(isOnline && typeof Audio === 'function');
    }

    getPendingVoiceInstall() {
      const saved = readJsonStorageSafe(MOD33_CONFIG.STORAGE_KEYS.VOICE_PENDING_INSTALL, null);
      if (!saved || typeof saved !== 'object') return null;
      const ageMs = Date.now() - Number(saved.requestedAt || 0);
      if (ageMs > 7 * 24 * 60 * 60 * 1000) {
        writeJsonStorageSafe(MOD33_CONFIG.STORAGE_KEYS.VOICE_PENDING_INSTALL, null);
        return null;
      }
      return saved;
    }

    clearPendingVoiceInstall() {
      try {
        localStorage.removeItem(MOD33_CONFIG.STORAGE_KEYS.VOICE_PENDING_INSTALL);
      } catch (_e) {
        writeJsonStorageSafe(MOD33_CONFIG.STORAGE_KEYS.VOICE_PENDING_INSTALL, null);
      }
    }

    markPendingVoiceInstall(opts = {}) {
      const cur = this.getPendingVoiceInstall() || {};
      const payload = {
        video: opts.video !== undefined ? Boolean(opts.video) : cur.video !== false,
        chat: opts.chat !== undefined ? Boolean(opts.chat) : cur.chat !== false,
        source: String(opts.source || cur.source || 'VIDEO'),
        lang: normalizeVoiceLangCode(opts.lang || cur.lang || 'vi-VN'),
        pendingText: String(opts.pendingText || cur.pendingText || '').slice(0, 600),
        requestedAt: Date.now(),
      };
      writeJsonStorageSafe(MOD33_CONFIG.STORAGE_KEYS.VOICE_PENDING_INSTALL, payload);
      this.startLiveVoiceInstallWatcher();
      return payload;
    }

    isSupported() {
      return (
        typeof globalScope !== 'undefined' &&
        'speechSynthesis' in globalScope &&
        typeof globalScope.SpeechSynthesisUtterance === 'function'
      );
    }

    savePrefs() {
      writeJsonStorageSafe(MOD33_CONFIG.STORAGE_KEYS.VOICE_PREFS, this.prefs);
    }

    refreshAvailableVoices() {
      if (!this.isSupported()) return [];
      try {
        const list = globalScope.speechSynthesis.getVoices?.() || [];
        if (list.length > 0) {
          this.cachedVoices = list.slice();
          this.voicesLoaded = true;
        }
      } catch (_e) {}
      return this.cachedVoices;
    }

    scoreVoiceNaturalness(voice, targetLang) {
      const normTarget = normalizeVoiceLangCode(targetLang);
      const lang = String(voice?.lang || '').toLowerCase().replace('_', '-');
      const name = String(voice?.name || '').toLowerCase();

      let langMatches = false;
      if (normTarget === 'vi-VN') langMatches = lang.startsWith('vi');
      else if (normTarget === 'en-US') langMatches = lang.startsWith('en');
      else if (normTarget === 'zh-TW') langMatches = lang.startsWith('zh-tw') || lang.startsWith('zh-hk') || lang.includes('hant') || /taiwan|國語|繁體|hsiaochen|yunjhe|meijia/i.test(name);
      else if (normTarget === 'zh-CN') langMatches = (lang.startsWith('zh-cn') || lang.startsWith('zh-sg') || lang.includes('hans') || lang === 'zh') && !lang.startsWith('zh-tw') && !lang.startsWith('zh-hk');
      else if (normTarget === 'ko-KR') langMatches = lang.startsWith('ko');
      else if (normTarget === 'ja-JP') langMatches = lang.startsWith('ja');
      if (!langMatches) return -1;

      let score = 10;
      if (/natural|neural|online/i.test(name)) score += 60;
      if (normTarget === 'vi-VN') {
        if (/hoaimy/i.test(name)) score += 50;
        else if (/namminh/i.test(name)) score += 45;
        else if (/google.*ti[eế]ng vi[eệ]t|google vietnam/i.test(name)) score += 38;
        else if (/linh/i.test(name)) score += 28;
        else if (/\ban\b/i.test(name)) score += 12;
      } else if (normTarget === 'en-US') {
        if (/aria/i.test(name)) score += 48;
        else if (/jenny|ava|emma|guy/i.test(name)) score += 42;
        else if (/google us english|google uk english/i.test(name)) score += 35;
        else if (/samantha|karen/i.test(name)) score += 25;
      } else if (normTarget === 'zh-CN') {
        if (/xiaoxiao|yunxi|xiaoyi/i.test(name)) score += 48;
        else if (/google.*普通话|ting-?ting/i.test(name)) score += 38;
      } else if (normTarget === 'zh-TW') {
        if (/hsiaochen|yunjhe|hsiaoyu/i.test(name)) score += 48;
        else if (/google.*國語|meijia/i.test(name)) score += 38;
      } else if (normTarget === 'ko-KR') {
        if (/sunhi|injoon/i.test(name)) score += 48;
        else if (/google.*한국|yuna/i.test(name)) score += 38;
      } else if (normTarget === 'ja-JP') {
        if (/nanami|keita/i.test(name)) score += 48;
        else if (/google.*日本|kyoko|haruka/i.test(name)) score += 38;
      }
      if (!voice.localService) score += 8;
      return score;
    }

    getRankedVoicesForLanguage(langCode = 'vi-VN') {
      const normLang = normalizeVoiceLangCode(langCode);
      const list = this.refreshAvailableVoices();
      return list
        .map((v) => ({ voice: v, score: this.scoreVoiceNaturalness(v, normLang) }))
        .filter((item) => item.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.voice);
    }

    pickBestNaturalVoice(langCode = 'vi-VN') {
      const normLang = normalizeVoiceLangCode(langCode);
      const preferredUri = this.prefs.preferredVoiceByLang?.[normLang] || '';
      if (preferredUri === GEMINI_AI_TTS_URI) {
        return { voiceURI: GEMINI_AI_TTS_URI, name: 'Gemini AI Voice (Studio)', lang: normLang, isGeminiAiTts: true };
      }
      if (preferredUri === GOOGLE_TRANSLATE_TTS_URI) {
        return { voiceURI: GOOGLE_TRANSLATE_TTS_URI, name: 'Google Translate TTS', lang: normLang, isGoogleTranslateTts: true };
      }
      const ranked = this.getRankedVoicesForLanguage(normLang);
      // Với VI/KO/JA, loại bỏ giọng Chrome stub không có Neural/Natural nếu thường bị câm trên máy
      const reliableRanked = ranked.filter((v) => {
        const vn = String(v?.name || '');
        if ((normLang === 'ko-KR' || normLang === 'ja-JP') && /^google\s/i.test(vn) && !/natural|neural/i.test(vn)) {
          return false;
        }
        return true;
      });
      const pool = reliableRanked.length > 0 ? reliableRanked : ranked;
      if (pool.length === 0) return null;

      if (preferredUri) {
        const exact = pool.find((v) => v.voiceURI === preferredUri || v.name === preferredUri);
        if (exact) return exact;
      }
      return pool[0];
    }

    getAiVoiceOptionsForLanguage(langCode = 'vi-VN') {
      const normLang = normalizeVoiceLangCode(langCode);
      const meta = SUPPORTED_VOICE_LANGS[normLang] || SUPPORTED_VOICE_LANGS['vi-VN'];
      const osVoices = this.getRankedVoicesForLanguage(normLang);
      const hasGeminiKey = Boolean(this._resolveGeminiApiKey());
      const list = [
        {
          uri: GOOGLE_TRANSLATE_TTS_URI,
          label: `🌐 AI Cloud TTS (${meta.label} — Chuẩn 6 Ngôn Ngữ)`,
          engine: 'cloud_tts',
          available: true,
        },
      ];
      if (hasGeminiKey) {
        list.unshift({
          uri: GEMINI_AI_TTS_URI,
          label: `✨ Gemini AI Neural Voice (${meta.label} · ${meta.geminiVoice || 'Aoede'})`,
          engine: 'gemini_tts',
          available: true,
        });
      }
      osVoices.forEach((v) => {
        const isNeural = /natural|neural|online/i.test(v.name);
        list.push({
          uri: v.voiceURI,
          label: `${isNeural ? '✨ Neural' : v.localService ? '💻 Hệ thống' : '🌐 Online'}: ${v.name.slice(0, 34)}`,
          engine: 'web_speech',
          available: true,
        });
      });
      return list;
    }

    _resolveGeminiApiKey() {
      try {
        const key =
          NS.apiVault?.getActiveApiKey?.() ||
          NS.apiKeyVault?.getActiveKey?.() ||
          localStorage.getItem('noir_gemini_api_key') ||
          localStorage.getItem('gemini_api_key') ||
          '';
        return String(key || '').trim();
      } catch (_e) {
        return '';
      }
    }

    buildCloudTtsUrls(text, langCode = 'vi-VN') {
      const normLang = normalizeVoiceLangCode(langCode);
      const langMeta = SUPPORTED_VOICE_LANGS[normLang] || SUPPORTED_VOICE_LANGS['vi-VN'];
      const tl = langMeta.gttsTl || 'vi';
      const q = encodeURIComponent(String(text || '').trim());
      const urls = [
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${q}`,
        `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${encodeURIComponent(tl)}&q=${q}`,
        `https://translate.google.com/translate_tts?ie=UTF-8&client=dict-chrome-ex&tl=${encodeURIComponent(tl)}&q=${q}`,
      ];
      if (langMeta.youdaoLe) {
        urls.push(`https://dict.youdao.com/dictvoice?audio=${q}&le=${encodeURIComponent(langMeta.youdaoLe)}`);
      }
      return urls;
    }

    _pcm16Base64ToWavBlobUrl(base64Pcm, sampleRate = 24000) {
      const bin = atob(base64Pcm);
      const pcmLen = bin.length;
      const buf = new ArrayBuffer(44 + pcmLen);
      const view = new DataView(buf);
      const writeStr = (off, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
      };
      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + pcmLen, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, pcmLen, true);
      const outBytes = new Uint8Array(buf, 44);
      for (let i = 0; i < pcmLen; i++) outBytes[i] = bin.charCodeAt(i);
      const blob = new Blob([buf], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }

    async speakViaGeminiAiTts(rawText, targetLang, myToken, baseRate, options = {}) {
      const apiKey = this._resolveGeminiApiKey();
      if (!apiKey || typeof fetch !== 'function' || typeof Audio !== 'function') return false;
      const langMeta = SUPPORTED_VOICE_LANGS[targetLang] || SUPPORTED_VOICE_LANGS['vi-VN'];
      const voiceName = langMeta.geminiVoice || 'Aoede';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey)}`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: String(rawText || '').slice(0, 600) }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
            },
          }),
        });
        if (!res.ok || myToken !== this.activePlaybackToken) return false;
        const data = await res.json();
        const part = data?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data);
        if (!part?.inlineData?.data || myToken !== this.activePlaybackToken) return false;
        const mime = String(part.inlineData.mimeType || 'audio/L16;rate=24000');
        let audioUrl = '';
        if (/audio\/(?:L16|pcm)/i.test(mime)) {
          const rateMatch = mime.match(/rate=(\d+)/i);
          audioUrl = this._pcm16Base64ToWavBlobUrl(part.inlineData.data, rateMatch ? Number(rateMatch[1]) : 24000);
        } else {
          const bin = atob(part.inlineData.data);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          audioUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
        }
        const audio = this._getSharedTtsAudio();
        this.currentGttsAudio = audio;
        this.isSpeaking = true;
        audio.playbackRate = Math.max(0.75, Math.min(1.6, Number(baseRate) || 1.0));
        audio.src = audioUrl;
        const cleanup = () => {
          try { URL.revokeObjectURL(audioUrl); } catch (_eRev) {}
          if (myToken === this.activePlaybackToken) {
            this.isSpeaking = false;
            if (typeof options.onComplete === 'function') options.onComplete();
          }
        };
        audio.onended = cleanup;
        audio.onerror = cleanup;
        await audio.play();
        return true;
      } catch (_eGem) {
        return false;
      }
    }

    _getSharedTtsAudio() {
      if (!this._sharedTtsAudio && typeof Audio === 'function') {
        this._sharedTtsAudio = new Audio();
        try { this._sharedTtsAudio.referrerPolicy = 'no-referrer'; } catch (_eRef) {}
        this._sharedTtsAudio.preload = 'auto';
        this._sharedTtsAudio.volume = 0.96;
      }
      return this._sharedTtsAudio;
    }

    setPreferredVoice(langCode, voiceUriOrName) {
      const lang = normalizeVoiceLangCode(langCode);
      this.prefs.preferredVoiceByLang[lang] = String(voiceUriOrName || '');
      this.savePrefs();
      this.syncVoicePickerUI(lang);
    }

    /**
     * Chuẩn hóa văn bản theo từ điển phát âm tự nhiên (6 ngôn ngữ)
     */
    normalizeTextForSpeech(rawText, langCode = 'vi-VN') {
      const targetLang = normalizeVoiceLangCode(langCode);
      let clean = stripEmojisAndMarkdownForSpeech(rawText);
      const lexicon =
        targetLang === 'en-US'
          ? ENGLISH_NEURAL_LEXICON
          : targetLang === 'vi-VN'
            ? VIETNAMESE_NEURAL_LEXICON
            : [];

      for (let i = 0; i < lexicon.length; i += 1) {
        const [rx, replacement] = lexicon[i];
        clean = clean.replace(rx, replacement);
      }

      clean = clean
        .replace(/\s*[—–]\s*/g, ', ')
        .replace(/\s*->\s*/g, targetLang === 'en-US' ? ', then ' : targetLang === 'vi-VN' ? ', tiếp theo ' : ', ')
        .replace(/([a-zA-ZÀ-ỹ0-9])\s*\(/g, '$1, ')
        .replace(/\)/g, ', ')
        .replace(/,\s*,+/g, ', ')
        .replace(/,\s*([.!?。！？])/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim();

      return clean;
    }

    /**
     * Tách câu thông minh (hỗ trợ cả dấu câu CJK 。！？ và giới hạn <= 165 ký tự để Google Dịch TTS đọc mượt không cắt cụt)
     */
    splitIntoNaturalProsodyClauses(normalizedText, maxLen = 170) {
      if (!normalizedText) return [];
      const rawSentences = normalizedText
        .split(/(?<=[.!?;。！？；])\s*|\n+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const clauses = [];
      for (let i = 0; i < rawSentences.length; i += 1) {
        const sent = rawSentences[i];
        if (sent.length <= maxLen) {
          clauses.push({
            text: sent,
            pauseAfterMs: 110,
            pitchOffset: 0,
          });
          continue;
        }

        const subParts = sent.split(/(?<=[,:，、：])\s*/).filter(Boolean);
        let acc = '';
        for (let j = 0; j < subParts.length; j += 1) {
          const piece = subParts[j];
          const nextAcc = acc ? `${acc} ${piece}` : piece;
          if (nextAcc.length > maxLen && acc) {
            clauses.push({
              text: acc,
              pauseAfterMs: 85,
              pitchOffset: 0,
            });
            acc = piece;
          } else {
            acc = nextAcc;
          }
        }
        if (acc) {
          if (acc.length > maxLen) {
            for (let k = 0; k < acc.length; k += maxLen) {
              clauses.push({
                text: acc.slice(k, k + maxLen).trim(),
                pauseAfterMs: 75,
                pitchOffset: 0,
              });
            }
          } else {
            clauses.push({
              text: acc,
              pauseAfterMs: 110,
              pitchOffset: 0,
            });
          }
        }
      }
      return clauses.filter((c) => c.text && c.text.length > 0);
    }

    stopAll() {
      return this.stop();
    }

    stop() {
      this.activePlaybackToken += 1;
      this.isSpeaking = false;
      if (this.pendingPauseTimer) {
        clearTimeout(this.pendingPauseTimer);
        this.pendingPauseTimer = null;
      }
      if (this.currentGttsAudio) {
        try {
          this.currentGttsAudio.onended = null;
          this.currentGttsAudio.onerror = null;
          this.currentGttsAudio.pause();
          this.currentGttsAudio.removeAttribute?.('src');
          this.currentGttsAudio.src = '';
        } catch (_eGtts) {}
        this.currentGttsAudio = null;
      }
      if (this.currentUtterance) {
        try {
          this.currentUtterance.onend = null;
          this.currentUtterance.onerror = null;
        } catch (_e) {}
        this.currentUtterance = null;
      }
      if (!this.isSupported()) return;
      try {
        // Trên Windows Chrome/Edge, gọi pause + cancel ngăn phát bù câu đã xếp hàng trước đó
        globalScope.speechSynthesis.pause?.();
        globalScope.speechSynthesis.cancel?.();
      } catch (_e) {}
    }

    /**
     * Phát giọng đọc AI trực tuyến 6 ngôn ngữ (VI, EN, ZH-CN, ZH-TW, KO, JA) với chuỗi dự phòng 4 cổng + bảo toàn Audio element trên Mobile
     */
    speakViaGoogleTranslateTts(clauses, targetLang, myToken, baseRate, options = {}) {
      if (typeof Audio !== 'function') return false;
      const langMeta = SUPPORTED_VOICE_LANGS[targetLang] || SUPPORTED_VOICE_LANGS['vi-VN'];
      const tl = langMeta.gttsTl || 'vi';
      // Chia nhỏ câu dài cho tiếng Nhật / Hàn / Trung (tối đa 62 ký tự CJK để không bao giờ vượt giới hạn URL 200 byte!)
      const isCjkLang = /^(ja|ko|zh)/i.test(tl);
      const maxChunk = isCjkLang ? 62 : 145;
      const safeClauses = [];
      (clauses || []).forEach((c) => {
        const raw = String(c?.text || '').trim();
        if (!raw) return;
        if (raw.length <= maxChunk) {
          safeClauses.push(c);
        } else {
          const parts = raw.split(/(?<=[.!?。！？,，、;；:：\s])/).filter(Boolean);
          let buf = '';
          for (const p of parts) {
            if ((buf + p).length > maxChunk) {
              if (buf.trim()) safeClauses.push({ text: buf.trim(), pauseAfterMs: 65 });
              if (p.length > maxChunk) {
                for (let k = 0; k < p.length; k += maxChunk) {
                  safeClauses.push({ text: p.slice(k, k + maxChunk), pauseAfterMs: 45 });
                }
                buf = '';
              } else {
                buf = p;
              }
            } else {
              buf += p;
            }
          }
          if (buf.trim()) safeClauses.push({ text: buf.trim(), pauseAfterMs: c.pauseAfterMs || 90 });
        }
      });
      this.isSpeaking = true;
      let idx = 0;

      const playNextChunk = () => {
        if (myToken !== this.activePlaybackToken) {
          this.isSpeaking = false;
          return;
        }
        if (typeof options.isAllowedFn === 'function' && !options.isAllowedFn()) {
          this.stop();
          return;
        }
        if (idx >= safeClauses.length) {
          this.isSpeaking = false;
          this.currentGttsAudio = null;
          if (typeof options.onComplete === 'function') options.onComplete();
          return;
        }

        const item = safeClauses[idx];
        idx += 1;
        const candidateUrls = this.buildCloudTtsUrls(item.text, targetLang);

        const tryCandidate = (urlIndex) => {
          if (myToken !== this.activePlaybackToken) {
            this.isSpeaking = false;
            return;
          }
          if (urlIndex >= candidateUrls.length) {
            // Hết 4 cổng Cloud AI -> fallback sang Web Speech API giọng hệ thống
            try {
              if (this.isSupported()) {
                const u = new globalScope.SpeechSynthesisUtterance(item.text);
                u.lang = targetLang;
                const best = this.getRankedVoicesForLanguage(targetLang)[0];
                if (best) u.voice = best;
                u.rate = Math.max(0.78, Math.min(1.45, Number(baseRate) || 1.0));
                const nextFallback = () => {
                  if (myToken !== this.activePlaybackToken) return;
                  this.pendingPauseTimer = setTimeout(playNextChunk, item.pauseAfterMs || 90);
                };
                u.onend = nextFallback;
                u.onerror = nextFallback;
                globalScope.speechSynthesis.speak(u);
                return;
              }
            } catch (_eFallback) {}
            this.pendingPauseTimer = setTimeout(playNextChunk, item.pauseAfterMs || 90);
            return;
          }

          try {
            const audio = this._getSharedTtsAudio() || new Audio();
            try {
              audio.referrerPolicy = 'no-referrer';
            } catch (_eRef) {}
            audio.preload = 'auto';
            audio.volume = 0.96;
            audio.playbackRate = Math.max(0.75, Math.min(1.6, Number(baseRate) || 1.0));
            this.currentGttsAudio = audio;

            let settled = false;
            let watchdog = setTimeout(() => {
              if (!settled) {
                settled = true;
                tryCandidate(urlIndex + 1);
              }
            }, 7500);

            const clearWatch = () => {
              if (watchdog) {
                clearTimeout(watchdog);
                watchdog = null;
              }
            };

            const nextStep = () => {
              if (settled) return;
              settled = true;
              clearWatch();
              if (myToken !== this.activePlaybackToken) {
                this.isSpeaking = false;
                return;
              }
              if (typeof options.isAllowedFn === 'function' && !options.isAllowedFn()) {
                this.stop();
                return;
              }
              this.pendingPauseTimer = setTimeout(playNextChunk, item.pauseAfterMs || 90);
            };

            const onFail = () => {
              if (settled) return;
              settled = true;
              clearWatch();
              if (myToken !== this.activePlaybackToken) {
                this.isSpeaking = false;
                return;
              }
              tryCandidate(urlIndex + 1);
            };

            audio.onended = nextStep;
            audio.onerror = onFail;
            audio.src = candidateUrls[urlIndex];
            const p = audio.play();
            if (p && typeof p.catch === 'function') {
              p.catch(() => onFail());
            }
          } catch (_ePlay) {
            tryCandidate(urlIndex + 1);
          }
        };

        tryCandidate(0);
      };

      playNextChunk();
      return true;
    }

    speakText(rawText, langCode = 'vi-VN', options = {}) {
      this.lastFailureReason = '';
      const targetLang = normalizeVoiceLangCode(langCode || this.getActiveUiVoiceLang());
      const normalized = this.normalizeTextForSpeech(rawText, targetLang);
      const clauses = this.splitIntoNaturalProsodyClauses(normalized, 165);
      if (clauses.length === 0) {
        this.lastFailureReason = 'EMPTY';
        return false;
      }

      this.stop();
      if (this.isSupported()) {
        this.refreshAvailableVoices();
      }
      const chosenVoice = this.pickBestNaturalVoice(targetLang);
      const myToken = this.activePlaybackToken;
      const baseRate = Math.max(
        0.78,
        Math.min(1.45, Number(options.rate || this.prefs.rate || 1.0))
      );
      const basePitch = Math.max(
        0.92,
        Math.min(1.08, Number(options.pitch || this.prefs.pitch || 1.0))
      );

      // Ưu tiên Gemini AI Neural Voice nếu người dùng chủ động chọn (có BYOK API Key)
      if ((chosenVoice?.isGeminiAiTts || options.preferGeminiTts) && this._resolveGeminiApiKey()) {
        const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
        if (isOnline) {
          this.speakViaGeminiAiTts(normalized, targetLang, myToken, baseRate, options).then((ok) => {
            if (!ok && myToken === this.activePlaybackToken) {
              this.speakViaGoogleTranslateTts(clauses, targetLang, myToken, baseRate, options);
            }
          });
          return true;
        }
      }

      // Dùng Cloud AI TTS (4 cổng Google/Youdao) khi người dùng chọn Cloud AI HOẶC máy thiếu giọng bản địa (đặc biệt VI/KO/JA)
      const forceGtts = Boolean(
        chosenVoice?.isGoogleTranslateTts ||
        options.preferGoogleTts ||
        !this.isSupported() ||
        !chosenVoice
      );
      if (forceGtts) {
        const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
        if (isOnline && typeof Audio === 'function') {
          return this.speakViaGoogleTranslateTts(clauses, targetLang, myToken, baseRate, options);
        }
        if (targetLang === 'vi-VN' && !chosenVoice) {
          this.lastFailureReason = 'NO_VI_VOICE';
          this.syncVoicePickerUI(targetLang);
          return false;
        }
      }

      if (!this.isSupported()) {
        this.lastFailureReason = 'UNSUPPORTED';
        return false;
      }

      this.isSpeaking = true;

      let clauseIdx = 0;
      const speakNextClause = () => {
        if (myToken !== this.activePlaybackToken) {
          this.isSpeaking = false;
          return;
        }
        if (typeof options.isAllowedFn === 'function' && !options.isAllowedFn()) {
          this.stop();
          return;
        }
        if (clauseIdx >= clauses.length) {
          this.isSpeaking = false;
          this.currentUtterance = null;
          if (typeof options.onComplete === 'function') {
            options.onComplete();
          }
          return;
        }

        const item = clauses[clauseIdx];
        clauseIdx += 1;

        try {
          const utter = new globalScope.SpeechSynthesisUtterance(item.text);
          utter.lang = chosenVoice?.lang || targetLang;
          if (chosenVoice && !chosenVoice.isGoogleTranslateTts) {
            utter.voice = chosenVoice;
          }
          utter.rate = baseRate;
          utter.pitch = basePitch;
          utter.volume = 0.96;
          this.currentUtterance = utter;

          const scheduleNext = () => {
            if (this.currentUtterance === utter) {
              this.currentUtterance = null;
            }
            if (myToken !== this.activePlaybackToken) {
              this.isSpeaking = false;
              return;
            }
            if (typeof options.isAllowedFn === 'function' && !options.isAllowedFn()) {
              this.stop();
              return;
            }
            this.pendingPauseTimer = setTimeout(speakNextClause, item.pauseAfterMs);
          };

          utter.onend = scheduleNext;
          utter.onerror = scheduleNext;

          if (globalScope.speechSynthesis.paused) {
            globalScope.speechSynthesis.resume?.();
          }
          globalScope.speechSynthesis.speak(utter);
        } catch (_err) {
          this.isSpeaking = false;
          if (typeof options.onComplete === 'function') options.onComplete();
        }
      };

      speakNextClause();
      return true;
    }

    syncVoicePickerUI(langCode = null) {
      const lang = normalizeVoiceLangCode(
        langCode ||
          document.getElementById('mod28-voice-lang-select')?.value ||
          this.prefs.language ||
          'vi-VN'
      );
      const langMeta = SUPPORTED_VOICE_LANGS[lang] || SUPPORTED_VOICE_LANGS['vi-VN'];
      const selectEl = document.getElementById(MOD33_CONFIG.SELECTORS.VOICE_PICKER_SELECT);
      const qualityPill = document.getElementById(MOD33_CONFIG.SELECTORS.VOICE_QUALITY_PILL);
      const voices = this.getRankedVoicesForLanguage(lang);
      const activeVoice = this.pickBestNaturalVoice(lang);
      const isGeminiSelected = Boolean(activeVoice?.isGeminiAiTts);
      const isGttsSelected = Boolean(!activeVoice || activeVoice.isGoogleTranslateTts);

      if (selectEl) {
        const hasGeminiKey = Boolean(this._resolveGeminiApiKey());
        const geminiOpt = hasGeminiKey
          ? `<option value="${GEMINI_AI_TTS_URI}"${isGeminiSelected ? ' selected' : ''}>✨ Gemini AI Neural Voice (${escapeHtmlSafe(langMeta.label)} · Studio)</option>`
          : '';
        const gttsOpt = `<option value="${GOOGLE_TRANSLATE_TTS_URI}"${
          isGttsSelected ? ' selected' : ''
        }>🌐 AI Cloud TTS (${escapeHtmlSafe(langMeta.label)} — Chuẩn 6 Ngôn Ngữ)</option>`;
        const osOpts = voices
          .map((v) => {
            const isNeural = /natural|neural|online/i.test(v.name);
            const tag = isNeural ? '✨ Neural' : v.localService ? '💻 Hệ thống' : '🌐 Online';
            const selected =
              !isGttsSelected && !isGeminiSelected && activeVoice && v.voiceURI === activeVoice.voiceURI
                ? ' selected'
                : '';
            return `<option value="${escapeHtmlSafe(v.voiceURI)}"${selected}>${tag}: ${escapeHtmlSafe(
              v.name.slice(0, 34)
            )}</option>`;
          })
          .join('');
        selectEl.innerHTML = geminiOpt + gttsOpt + osOpts;
      }

      const hasAnyVoice = this.hasVoiceForLanguage(lang);
      const dlInfo = this.getDirectVoiceDownloadInfo();

      const inlineHint = document.getElementById('mod28-voice-install-inline-hint');
      if (inlineHint) {
        inlineHint.classList.toggle('hidden', hasAnyVoice);
      }
      const inlineLink = document.getElementById('mod28-inline-voice-download-link');
      if (inlineLink && inlineLink.getAttribute('href') !== dlInfo.primaryUrl) {
        inlineLink.setAttribute('href', dlInfo.primaryUrl);
      }
      const chatMissingWrap = document.getElementById('mod27-chat-voice-missing-wrap');
      if (chatMissingWrap) {
        chatMissingWrap.classList.toggle('hidden', hasAnyVoice);
      }
      const chatDownloadLink = document.getElementById('mod27-chat-voice-download-link');
      if (chatDownloadLink && chatDownloadLink.getAttribute('href') !== dlInfo.primaryUrl) {
        chatDownloadLink.setAttribute('href', dlInfo.primaryUrl);
      }

      if (qualityPill) {
        if (isGttsSelected) {
          qualityPill.textContent = `🌐 Google Dịch TTS (${langMeta.label}) — Sẵn sàng phát trực tiếp`;
        } else if (activeVoice) {
          const isNeural = /natural|neural|online/i.test(activeVoice.name);
          qualityPill.textContent = `${
            isNeural ? '💎 Giọng Neural Tự Nhiên:' : '🔊 Giọng hệ thống:'
          } ${activeVoice.name}`;
        }
      }
      const i18nInst =
        (typeof window !== 'undefined' && (window.NoirStudio?.i18n || window.NoirNovel?.i18n)) || null;
      if (i18nInst?.translateElement) {
        if (selectEl) i18nInst.translateElement(selectEl);
        if (qualityPill) i18nInst.translateElement(qualityPill);
      }
    }

    ensureVoiceInstallGuideModal() {
      if (typeof document === 'undefined') return null;
      let modal = document.getElementById(MOD33_CONFIG.SELECTORS.VOICE_GUIDE_MODAL);
      if (modal) return modal;

      const dlInfo = this.getDirectVoiceDownloadInfo();
      modal = document.createElement('div');
      modal.id = MOD33_CONFIG.SELECTORS.VOICE_GUIDE_MODAL;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'hidden fixed inset-0 z-[155] bg-black/80 backdrop-blur-sm flex items-start justify-center p-2.5 sm:p-4 overflow-y-auto';

      modal.innerHTML = `
        <div class="my-auto w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-2xl border-2 border-amber-500/60 bg-zinc-950 text-zinc-100 shadow-2xl p-4 sm:p-5 space-y-3.5 text-xs min-w-0">
          <div class="flex items-start justify-between gap-2 pb-2.5 border-b border-zinc-800">
            <div class="space-y-0.5 min-w-0">
              <h3 class="font-extrabold uppercase text-sm text-amber-300 leading-snug">
                🎙️ Cài Giọng Nói AI Tiếng Việt Cho Trình Duyệt
              </h3>
              <p class="text-[11px] text-zinc-400">
                Áp dụng đồng bộ cho cả <strong>Video Hướng Dẫn</strong> &amp; <strong>Trợ lý Chatbot Viên Bi Số 8</strong>
              </p>
            </div>
            <button type="button" id="btn-mod33-close-voice-guide" class="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-rose-600 text-white font-bold shrink-0">✕</button>
          </div>

          <div class="p-3 rounded-xl border border-amber-500/35 bg-amber-950/20 text-zinc-200 leading-relaxed space-y-1.5">
            <p>
              Trình duyệt hiện tại chưa có gói giọng nói <strong>Tiếng Việt (vi-VN)</strong> nên AI chưa thể cất tiếng. Bạn chỉ cần cài giọng nói theo đường dẫn trực tiếp bên dưới:
            </p>
          </div>

          <div class="space-y-2">
            <a id="mod33-voice-guide-primary-link" href="${escapeHtmlSafe(
              dlInfo.primaryUrl
            )}" target="_blank" rel="noopener noreferrer"
              class="flex items-center justify-between gap-2 w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold shadow-lg transition">
              <span>${escapeHtmlSafe(dlInfo.primaryLabel)}</span>
            </a>

            <a id="mod33-voice-guide-secondary-link" href="${escapeHtmlSafe(
              dlInfo.secondaryPackUrl
            )}" target="_blank" rel="noopener noreferrer"
              class="flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-xl border border-sky-500/45 bg-sky-950/35 hover:bg-sky-900/45 text-sky-200 font-bold transition">
              <span>${escapeHtmlSafe(dlInfo.secondaryPackLabel)}</span>
            </a>

            ${
              dlInfo.isWindows
                ? `<button type="button" id="btn-mod33-open-win-speech-settings" class="flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold transition text-left">
                    <span>⚙️ Mở nhanh Cài đặt Giọng Nói Windows (Time &amp; Language → Speech → Add Vietnamese)</span>
                  </button>`
                : ''
            }
          </div>

          <div class="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-100 leading-relaxed space-y-1">
            <p class="italic text-[11px]">
              💡 <strong>Cài xong tự kích hoạt / Reload:</strong> Nếu trình duyệt tự cập nhật giọng mới, cả <strong>Video</strong> và <strong>Con AI Viên Bi Số 8</strong> sẽ <strong>tự động bật giọng nói ngay</strong>. Nếu chưa tự nhận, hãy bấm <strong>🔄 Reload trang</strong> để dùng ngay lập tức!
            </p>
            <p id="mod33-voice-guide-live-status" class="text-[11px] font-semibold text-cyan-300"></p>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" id="btn-mod33-recheck-voice" class="px-3.5 py-2 rounded-xl border border-emerald-500/50 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-200 font-extrabold transition">
              🔍 Kiểm Tra &amp; Bật Ngay
            </button>
            <button type="button" id="btn-mod33-reload-for-voice" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold shadow transition">
              🔄 Tải Lại Trang (Reload)
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) {
          this.closeVoiceInstallGuideModal();
        }
      });

      const closeBtn = document.getElementById('btn-mod33-close-voice-guide');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeVoiceInstallGuideModal());
      }

      const primaryLink = document.getElementById('mod33-voice-guide-primary-link');
      if (primaryLink) {
        primaryLink.addEventListener('click', () => {
          this.markPendingVoiceInstall({ video: true, chat: true, source: 'GUIDE_PRIMARY_LINK' });
        });
      }

      const secondaryLink = document.getElementById('mod33-voice-guide-secondary-link');
      if (secondaryLink) {
        secondaryLink.addEventListener('click', () => {
          this.markPendingVoiceInstall({ video: true, chat: true, source: 'GUIDE_PACK_LINK' });
        });
      }

      const winSettingsBtn = document.getElementById('btn-mod33-open-win-speech-settings');
      if (winSettingsBtn) {
        winSettingsBtn.addEventListener('click', () => {
          this.markPendingVoiceInstall({ video: true, chat: true, source: 'WIN_SETTINGS' });
          try {
            window.open('ms-settings:speech', '_self');
          } catch (_e) {}
        });
      }

      const recheckBtn = document.getElementById('btn-mod33-recheck-voice');
      if (recheckBtn) {
        recheckBtn.addEventListener('click', () => {
          this.refreshAvailableVoices();
          const activated = this.tryAutoActivatePendingVoice({ forceProbe: true });
          const statusEl = document.getElementById('mod33-voice-guide-live-status');
          if (!activated && statusEl) {
            statusEl.textContent =
              '⏳ Trình duyệt chưa cập nhật gói giọng Tiếng Việt mới. Hãy thử bấm "🔄 Tải Lại Trang (Reload)" hoặc mở trang này trên Microsoft Edge!';
          }
        });
      }

      const reloadBtn = document.getElementById('btn-mod33-reload-for-voice');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
          this.markPendingVoiceInstall({ video: true, chat: true, source: 'RELOAD_CTA' });
          try {
            globalScope.location?.reload?.();
          } catch (_e) {}
        });
      }

      return modal;
    }

    openVoiceInstallGuideModal(options = {}) {
      const modal = this.ensureVoiceInstallGuideModal();
      if (!modal) return false;
      this._activeGuideSource = String(options.source || '');
      this.markPendingVoiceInstall({
        video: true,
        chat: true,
        source: options.source || 'GUIDE',
        lang: options.lang || 'vi-VN',
        pendingText: options.autoSpeakText || '',
      });
      const statusEl = document.getElementById('mod33-voice-guide-live-status');
      if (statusEl) statusEl.textContent = '';
      modal.classList.remove('hidden');
      if (window.NoirNovel?.i18n?.translateElement) {
        window.NoirNovel.i18n.translateElement(modal);
      }
      if (NS.modalStack?.register) {
        NS.modalStack.register(MOD33_CONFIG.SELECTORS.VOICE_GUIDE_MODAL, () =>
          this.closeVoiceInstallGuideModal()
        );
      }
      return true;
    }

    closeVoiceInstallGuideModal(onlyIfSource = '') {
      if (onlyIfSource && this._activeGuideSource && this._activeGuideSource !== onlyIfSource) {
        if (!String(this._activeGuideSource).startsWith(onlyIfSource)) {
          return;
        }
      }
      const modal = document.getElementById(MOD33_CONFIG.SELECTORS.VOICE_GUIDE_MODAL);
      if (modal) {
        modal.classList.add('hidden');
      }
      this._activeGuideSource = '';
      if (NS.modalStack?.unregister) {
        NS.modalStack.unregister(MOD33_CONFIG.SELECTORS.VOICE_GUIDE_MODAL);
      }
    }

    tryAutoActivatePendingVoice(options = {}) {
      if (!this.hasVoiceForLanguage('vi-VN')) return false;
      const pending = this.getPendingVoiceInstall();
      if (!pending && !options.forceProbe) return false;

      const voice = this.pickBestNaturalVoice('vi-VN');
      const enableVideo = !pending || pending.video !== false;
      const enableChat = !pending || pending.chat !== false;

      if (enableVideo && NS.tutorialAndChangelog?.player?.voiceNarrator) {
        NS.tutorialAndChangelog.player.voiceNarrator.setEnabled(true);
        NS.tutorialAndChangelog.syncVoiceControlsUI?.(true);
        const videoModal = document.getElementById('modal-tutorial-changelog-az');
        if (
          videoModal &&
          !videoModal.classList.contains('hidden') &&
          NS.tutorialAndChangelog.player.isPlaying
        ) {
          NS.tutorialAndChangelog.player.voiceNarrator.speakCueIfNeeded(
            NS.tutorialAndChangelog.player.getCurrentSubtitleCue(),
            true
          );
        }
      }

      if (enableChat && NS.mascotAndChat) {
        NS.mascotAndChat.prefs.autoSpeakTTS = true;
        NS.mascotAndChat.saveState?.();
        NS.mascotAndChat.syncChatVoiceControlsUI?.();
        const chatModal = document.getElementById('modal-free-gemini-chat');
        if (
          pending?.pendingText &&
          chatModal &&
          !chatModal.classList.contains('hidden') &&
          pending.source === 'CHATBOT'
        ) {
          this.speakText(pending.pendingText, 'vi-VN', {
            source: 'CHATBOT',
            suppressInstallModal: true,
          });
        }
      }

      this.clearPendingVoiceInstall();
      this.stopLiveVoiceInstallWatcher();
      this.closeVoiceInstallGuideModal();
      this.syncVoicePickerUI('vi-VN');

      NS.uiUtils?.showToast?.(
        `✅ Đã kích hoạt giọng AI Tiếng Việt (${
          voice?.name || 'vi-VN'
        }) cho cả Video & Trợ lý Viên Bi Số 8!`,
        'success',
        4200
      );
      return true;
    }

    startLiveVoiceInstallWatcher() {
      if (this._voiceWatcherTimer || typeof window === 'undefined') return;
      this._voiceWatcherChecks = 0;
      this._voiceWatcherTimer = window.setInterval(() => {
        this._voiceWatcherChecks += 1;
        this.refreshAvailableVoices();
        if (this.hasVoiceForLanguage('vi-VN')) {
          this.tryAutoActivatePendingVoice();
          return;
        }
        if (this._voiceWatcherChecks >= 60) {
          this.stopLiveVoiceInstallWatcher();
        }
      }, 1500);
    }

    stopLiveVoiceInstallWatcher() {
      if (this._voiceWatcherTimer && typeof window !== 'undefined') {
        window.clearInterval(this._voiceWatcherTimer);
      }
      this._voiceWatcherTimer = null;
      this._voiceWatcherChecks = 0;
    }

    bindVoicesChangedOnce() {
      if (!this.isSupported() || this._voicesEventBound) return;
      this._voicesEventBound = true;
      const handleVoiceRefresh = () => {
        this.refreshAvailableVoices();
        this.syncVoicePickerUI();
        this.tryAutoActivatePendingVoice();
      };
      try {
        globalScope.speechSynthesis.addEventListener?.('voiceschanged', handleVoiceRefresh);
      } catch (_e) {}
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', handleVoiceRefresh);
      }
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            handleVoiceRefresh();
          }
        });
      }
    }

    getCalibrationPresets() {
      return Object.values(VOICE_CALIBRATION_PRESETS);
    }

    applyCalibrationPreset(presetId) {
      const preset = VOICE_CALIBRATION_PRESETS[presetId];
      if (!preset) return false;
      this.prefs.rate = preset.rate;
      this.prefs.pitch = preset.pitch;
      this.prefs.calibrationPresetId = preset.id;
      this.savePrefs();
      return true;
    }

    describeActiveVoiceProfile(langCode = null) {
      const lang = langCode || this.prefs.language || 'vi-VN';
      const voice = this.pickBestNaturalVoice(lang);
      return {
        supported: this.isSupported(),
        lang,
        voiceName: voice?.name || 'Fallback',
        voiceURI: voice?.voiceURI || '',
        isNeural: Boolean(voice && /natural|neural|online/i.test(voice.name)),
        rate: this.prefs.rate,
        pitch: this.prefs.pitch,
        presetId: this.prefs.calibrationPresetId || 'STUDIO_NEURAL',
      };
    }

    init() {
      this.refreshAvailableVoices();
      this.bindVoicesChangedOnce();
      this.tryAutoActivatePendingVoice();
      if (this.getPendingVoiceInstall() && !this.hasVoiceForLanguage('vi-VN')) {
        this.startLiveVoiceInstallWatcher();
      }
      setTimeout(() => {
        this.refreshAvailableVoices();
        this.syncVoicePickerUI();
        this.tryAutoActivatePendingVoice();
      }, 280);
      setTimeout(() => {
        this.refreshAvailableVoices();
        this.syncVoicePickerUI();
        this.tryAutoActivatePendingVoice();
      }, 950);
    }
  }

  // ==========================================================================
  // PHẦN 5: TRÌNH CHIẾU GIAO DIỆN WEB THẬT VÀO KHUNG VIDEO HƯỚNG DẪN (LIVE DOM MIRROR)
  // ==========================================================================

  class RealDomVideoMirrorRenderer {
    constructor() {
      this.enabled = readStorageSafe(MOD33_CONFIG.STORAGE_KEYS.MIRROR_VIDEO_MODE, 'true') !== 'false';
      this.cachedScreenSnaps = new Map();
      this.activeMirrorChapterId = '';
      this.lastMirrorRefreshMs = 0;
      this.resizeObserver = null;
      this.latestTargetPoint = null;
    }

    isMirrorActiveAndMounted() {
      if (!this.enabled) return false;
      const stage = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_STAGE);
      const viewport = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_VIEWPORT);
      return Boolean(stage && !stage.classList.contains('hidden') && viewport && viewport.childElementCount > 0);
    }

    setEnabled(flag) {
      this.enabled = Boolean(flag);
      writeStorageSafe(MOD33_CONFIG.STORAGE_KEYS.MIRROR_VIDEO_MODE, this.enabled ? 'true' : 'false');
      const stage = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_STAGE);
      if (stage) {
        stage.classList.toggle('hidden', !this.enabled);
      }
      if (!this.enabled) {
        this.latestTargetPoint = null;
      } else {
        this.syncMirrorForChapter(this.activeMirrorChapterId || 'CHAP_01_ENTRY_GATE_AND_ARCHITECTURE', true);
      }
      return this.enabled;
    }

    ensureMirrorStageMountedInsideVideo() {
      const wrap =
        document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_FRAME_WRAP) ||
        document.getElementById('mod28-tutorial-canvas')?.parentElement;
      if (!wrap) return null;

      wrap.style.position = 'relative';

      let stage = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_STAGE);
      if (!stage) {
        stage = document.createElement('div');
        stage.id = MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_STAGE;
        stage.setAttribute('aria-hidden', 'true');
        stage.setAttribute('inert', '');
        stage.className = `absolute inset-0 z-[1] overflow-hidden pointer-events-none select-none bg-[#09090b] ${
          this.enabled ? '' : 'hidden'
        }`;
        stage.style.cssText =
          'position:absolute;inset:0;width:100%;height:100%;max-width:none;overflow:clip;';

        const viewport = document.createElement('div');
        viewport.id = MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_VIEWPORT;
        viewport.style.cssText = `position:absolute;top:0;left:0;width:${MOD33_CONFIG.VIRTUAL_VIEWPORT_W}px !important;min-width:${MOD33_CONFIG.VIRTUAL_VIEWPORT_W}px !important;max-width:none !important;height:${MOD33_CONFIG.VIRTUAL_VIEWPORT_H}px !important;min-height:${MOD33_CONFIG.VIRTUAL_VIEWPORT_H}px !important;max-height:none !important;transform-origin:top left;display:flex;flex-direction:column;overflow:hidden;background:#09090b;color:#f4f4f5;`;
        stage.appendChild(viewport);

        const canvasEl = document.getElementById('mod28-tutorial-canvas');
        if (canvasEl && canvasEl.parentElement === wrap) {
          wrap.insertBefore(stage, canvasEl);
          canvasEl.style.position = 'relative';
          canvasEl.style.zIndex = '2';
          canvasEl.style.background = 'transparent';
        } else {
          wrap.appendChild(stage);
        }
      }

      this.updateViewportScaleToFit();
      this.bindFrameResizeObserver(wrap, stage);
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => this.updateViewportScaleToFit());
      }
      setTimeout(() => this.updateViewportScaleToFit(), 80);
      setTimeout(() => this.updateViewportScaleToFit(), 260);
      return stage;
    }

    bindFrameResizeObserver(wrap, stage = null) {
      if (!this.resizeObserver && typeof ResizeObserver !== 'undefined' && wrap) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateViewportScaleToFit();
        });
        this.resizeObserver.observe(wrap);
        if (stage && stage !== wrap) {
          this.resizeObserver.observe(stage);
        }
      }
      if (!this._windowResizeBound && typeof window !== 'undefined') {
        this._windowResizeBound = true;
        const onViewportChange = () => {
          this.updateViewportScaleToFit();
          setTimeout(() => this.updateViewportScaleToFit(), 90);
        };
        window.addEventListener('resize', onViewportChange);
        window.addEventListener('orientationchange', onViewportChange);
        document?.addEventListener?.('fullscreenchange', onViewportChange);
      }
    }

    updateViewportScaleToFit() {
      const stage = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_STAGE);
      const viewport = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_VIEWPORT);
      if (!stage || !viewport) return;

      const wrap = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_FRAME_WRAP);
      const rect = stage.getBoundingClientRect();
      const wrapRect = wrap?.getBoundingClientRect?.();
      const stageW = Math.max(120, rect.width || wrapRect?.width || stage.clientWidth || wrap?.clientWidth || 640);
      const stageH = Math.max(68, rect.height || wrapRect?.height || stage.clientHeight || wrap?.clientHeight || Math.round(stageW * 9 / 16));
      const scaleX = stageW / MOD33_CONFIG.VIRTUAL_VIEWPORT_W;
      const scaleY = stageH / MOD33_CONFIG.VIRTUAL_VIEWPORT_H;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = Math.max(0, (stageW - MOD33_CONFIG.VIRTUAL_VIEWPORT_W * scale) / 2);
      const offsetY = Math.max(0, (stageH - MOD33_CONFIG.VIRTUAL_VIEWPORT_H * scale) / 2);

      viewport.style.setProperty('width', `${MOD33_CONFIG.VIRTUAL_VIEWPORT_W}px`, 'important');
      viewport.style.setProperty('min-width', `${MOD33_CONFIG.VIRTUAL_VIEWPORT_W}px`, 'important');
      viewport.style.setProperty('max-width', 'none', 'important');
      viewport.style.setProperty('height', `${MOD33_CONFIG.VIRTUAL_VIEWPORT_H}px`, 'important');
      viewport.style.setProperty('min-height', `${MOD33_CONFIG.VIRTUAL_VIEWPORT_H}px`, 'important');
      viewport.style.setProperty('max-height', 'none', 'important');
      viewport.style.transformOrigin = 'top left';
      viewport.style.transform = `translate(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px) scale(${scale.toFixed(4)})`;
    }

    /**
     * Nhân bản một phần tử DOM thật an toàn 100%:
     *   - Chuyển toàn bộ `id` sang `data-m33-src-id` để tuyệt đối KHÔNG gây trùng ID DOM.
     *   - Gỡ bỏ `<script>`, bảo toàn giá trị đang gõ của `<textarea>`, `<input>`, `<select>`.
     */
    cloneNodeSanitizedWithoutDuplicateIds(sourceEl) {
      if (!sourceEl) return null;
      const clone = sourceEl.cloneNode(true);

      const syncInputValues = (srcRoot, dstRoot) => {
        const srcFields = srcRoot.querySelectorAll('input, textarea, select');
        const dstFields = dstRoot.querySelectorAll('input, textarea, select');
        for (let i = 0; i < srcFields.length && i < dstFields.length; i += 1) {
          const s = srcFields[i];
          const d = dstFields[i];
          if (s.tagName === 'TEXTAREA' || s.tagName === 'INPUT') {
            if (s.type === 'checkbox' || s.type === 'radio') {
              d.checked = Boolean(s.checked);
            } else {
              d.value = s.value || '';
            }
          } else if (s.tagName === 'SELECT') {
            d.value = s.value;
          }
        }
      };

      const sanitizeSubtree = (node) => {
        if (!node || node.nodeType !== 1) return;
        node.querySelectorAll('script').forEach((sc) => sc.remove());

        if (node.id) {
          node.setAttribute('data-m33-src-id', node.id);
          node.removeAttribute('id');
        }
        node.querySelectorAll('[id]').forEach((el) => {
          el.setAttribute('data-m33-src-id', el.id);
          el.removeAttribute('id');
        });
      };

      syncInputValues(sourceEl, clone);
      sanitizeSubtree(clone);
      return clone;
    }

    resolveTargetDomSectionForChoreography(choreo) {
      const map = {
        SCREEN_1_WRITE: ['s14-screen-1-write', 'center-editor-pane'],
        SCREEN_2_SOURCES: ['s14-screen-2-files', 'left-sidebar-pane'],
        SCREEN_3_AI: ['s14-screen-3-ai', 's20-quad-prompt-studio'],
        SCREEN_4_BIBLE: ['s14-screen-4-bible', 'right-bible-pane'],
        SCREEN_5_AMBIENCE: ['s14-screen-5-ambience'],
        SCREEN_6_SYSTEM: ['s14-screen-6-system'],
      };
      const ids = map[choreo.screenKey] || [];
      for (let i = 0; i < ids.length; i += 1) {
        const el = document.getElementById(ids[i]);
        if (el) return el;
      }
      return document.getElementById('app-main-workspace');
    }

    /**
     * Dựng ảnh chụp DOM thật của đúng màn hình tương ứng phân đoạn Video đang phát.
     */
    syncMirrorForChapter(chapterId, forceRebuild = false) {
      const choreo =
        CHAPTER_MIRROR_CHOREOGRAPHY[chapterId] || CHAPTER_MIRROR_CHOREOGRAPHY.CHAP_01_ENTRY_GATE_AND_ARCHITECTURE;
      const stage = this.ensureMirrorStageMountedInsideVideo();
      const viewport = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_VIEWPORT);
      if (!stage || !viewport) return;

      if (!this.enabled) {
        stage.classList.add('hidden');
        return;
      }
      stage.classList.remove('hidden');

      const now = Date.now();
      if (!forceRebuild && this.activeMirrorChapterId === chapterId && now - this.lastMirrorRefreshMs < 1500) {
        this.computeTargetHighlightCoordinates(choreo);
        return;
      }

      this.activeMirrorChapterId = chapterId;
      this.lastMirrorRefreshMs = now;
      viewport.innerHTML = '';

      // 1. Nền tranh tự sinh nếu đang bật trong Mod 32 (sao chép nền thực lên mirror)
      const bgImg = document.getElementById('ambient-bg-image');
      if (bgImg && !bgImg.classList.contains('hidden') && bgImg.src) {
        const imgClone = document.createElement('img');
        imgClone.src = bgImg.src;
        imgClone.style.cssText =
          'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.42;pointer-events:none;z-index:0;';
        viewport.appendChild(imgClone);
      }

      // 2. Nhân bản Header THẬT của trang web
      const realHeader = document.querySelector('header');
      if (realHeader) {
        const headerClone = this.cloneNodeSanitizedWithoutDuplicateIds(realHeader);
        headerClone.removeAttribute('inert');
        headerClone.removeAttribute('aria-hidden');
        headerClone.classList.remove('pointer-events-none', 'hidden');
        headerClone.style.cssText =
          'position:relative;z-index:2;flex-shrink:0;width:100%;background:rgba(9,9,11,0.92);';
        // Tô nổi đúng tab đang trình bày trong gương
        const activeTabBtn = headerClone.querySelector(
          `[data-s14-tab="${choreo.screenKey}"]`
        );
        if (activeTabBtn) {
          activeTabBtn.style.outline = '2px solid #34d399';
          activeTabBtn.style.background = '#059669';
          activeTabBtn.style.color = '#ffffff';
        }
        viewport.appendChild(headerClone);
      }

      // 3. Nhân bản Khu vực Màn hình THẬT (Tab 1 -> Tab 6)
      const screenEl = this.resolveTargetDomSectionForChoreography(choreo);
      if (screenEl) {
        const bodyClone = this.cloneNodeSanitizedWithoutDuplicateIds(screenEl);
        bodyClone.classList.remove('hidden', 'pointer-events-none', 'select-none');
        bodyClone.style.cssText =
          'position:relative;z-index:2;display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;padding:12px 16px;background:rgba(9,13,20,0.68);';

        // Mở các khối đang thu gọn bên trong bản sao để người xem nhìn thấy rõ nút bấm thật
        (choreo.expandInMirror || []).forEach(([srcId, action]) => {
          const inner = bodyClone.querySelector(`[data-m33-src-id="${srcId}"]`);
          if (inner && action === 'show') {
            inner.classList.remove('hidden');
            inner.style.display = '';
          }
        });

        // Làm sáng nổi bật chính phần tử mục tiêu ngay trên bản sao thật
        const focusEl = bodyClone.querySelector(
          `[data-m33-src-id="${choreo.focusTargetId}"]`
        );
        if (focusEl) {
          focusEl.style.outline = '3px solid #34d399';
          focusEl.style.outlineOffset = '3px';
          focusEl.style.boxShadow = '0 0 24px rgba(52, 211, 153, 0.55)';
          // Cuộn phần tử mục tiêu vào vùng nhìn thấy của khung 1280x720
          try {
            const innerOffset = focusEl.offsetTop || 0;
            if (innerOffset > 280) {
              bodyClone.scrollTop = Math.max(0, innerOffset - 120);
            }
          } catch (_e) {}
        }

        // Đánh dấu phụ trợ phần tử thứ cấp để người xem hiểu ngữ cảnh xung quanh nút chính
        if (choreo.secondaryTargetId) {
          const secEl = bodyClone.querySelector(
            `[data-m33-src-id="${choreo.secondaryTargetId}"]`
          );
          if (secEl && secEl !== focusEl) {
            secEl.style.outline = '1.5px dashed rgba(34, 211, 238, 0.72)';
            secEl.style.outlineOffset = '2px';
          }
        }

        viewport.appendChild(bodyClone);
      }

      this.updateViewportScaleToFit();
      this.computeTargetHighlightCoordinates(choreo);
    }

    computeTargetHighlightCoordinates(choreo) {
      const stage = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_STAGE);
      const viewport = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_VIEWPORT);
      if (!stage || !viewport) {
        this.latestTargetPoint = null;
        return null;
      }

      const targetEl = viewport.querySelector(
        `[data-m33-src-id="${choreo.focusTargetId}"]`
      ) || viewport.querySelector(`[data-m33-src-id="${choreo.secondaryTargetId}"]`);

      if (!targetEl) {
        this.latestTargetPoint = null;
        return null;
      }

      const stageRect = stage.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height || !targetRect.width) {
        this.latestTargetPoint = null;
        return null;
      }

      const relX = Math.max(
        28,
        Math.min(
          stageRect.width - 28,
          targetRect.left - stageRect.left + targetRect.width * 0.5
        )
      );
      const relY = Math.max(
        34,
        Math.min(
          stageRect.height - 88,
          targetRect.top - stageRect.top + targetRect.height * 0.5
        )
      );

      this.latestTargetPoint = {
        x: relX,
        y: relY,
        boxX: Math.max(8, targetRect.left - stageRect.left),
        boxY: Math.max(8, targetRect.top - stageRect.top),
        boxW: Math.min(stageRect.width - 16, Math.max(40, targetRect.width)),
        boxH: Math.min(stageRect.height - 96, Math.max(22, targetRect.height)),
        label: choreo.pointerLabel || 'Giao diện thật',
        badge: choreo.captionBadge || '',
      };
      return this.latestTargetPoint;
    }

    /**
     * Vẽ lớp phủ trong suốt gồm: khung viền rực sáng đúng nút thật, con trỏ nhấp,
     * thẻ chú thích và dải phụ đề song ngữ — giữ 100% giao diện web thật hiển thị bên dưới!
     */
    drawTransparentLiveDomOverlay(player, ctx, w, h, chap, cue, localProgress) {
      ctx.clearRect(0, 0, w, h);

      this.syncMirrorForChapter(chap.id, false);
      const choreo =
        CHAPTER_MIRROR_CHOREOGRAPHY[chap.id] || CHAPTER_MIRROR_CHOREOGRAPHY.CHAP_01_SIX_SCREENS;
      const pt = this.computeTargetHighlightCoordinates(choreo) || this.latestTargetPoint;

      ctx.save();

      // Nếu định vị được nút/khung thật trong DOM Mirror -> vẽ viền laser + con trỏ chỉ chính xác
      if (pt) {
        const pulse = 0.65 + 0.35 * Math.sin(localProgress * Math.PI * 6);
        player.drawRoundedRect(ctx, pt.boxX - 4, pt.boxY - 4, pt.boxW + 8, pt.boxH + 8, 10);
        ctx.strokeStyle = chap.accentColor;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Thẻ chú thích ngay gần nút bấm thật
        const tipW = Math.min(240, w - 32);
        const tipX = Math.max(12, Math.min(w - tipW - 12, pt.x - tipW * 0.5));
        const tipY = pt.y > h * 0.45 ? Math.max(12, pt.boxY - 34) : Math.min(h - 118, pt.boxY + pt.boxH + 10);

        player.drawRoundedRect(ctx, tipX, tipY, tipW, 24, 8);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.fill();
        ctx.strokeStyle = chap.accentColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`👆 ${pt.label}`, tipX + tipW / 2, tipY + 12);

        const animOffsetX = Math.sin(localProgress * Math.PI * 4) * 5;
        const animOffsetY = Math.cos(localProgress * Math.PI * 4) * 4;
        if (typeof player.drawAnimatedPointer === 'function') {
          player.drawAnimatedPointer(
            ctx,
            pt.x + animOffsetX,
            pt.y + animOffsetY,
            (localProgress * 4) % 1,
            chap.accentColor
          );
        }
      }

      // Phụ đề được hiển thị ở thanh rạp hát ngay DƯỚI khung video (#mod28-subtitle-theater-bar)
      // để khung giao diện web thật trong canvas luôn hiển thị trọn vẹn 100%, không bị che khuất.
      ctx.restore();
    }
  }

  // ==========================================================================
  // PHẦN 6: BỘ TỐI ƯU FRONT-END TAB 6 (THU GỌN HẾT & CỤM MỤC NỔI BẬT)
  // ==========================================================================

  class Tab6SpotlightAndCollapseOrchestrator {
    constructor(syncer) {
      this.syncer = syncer;
      this.eventsBound = false;
    }

    /**
     * Đặt lại trạng thái Thu gọn hết (chỉ giữ Cụm Mục Nổi Bật Nhất)
     * hoặc Mở rộng đồng loạt tất cả thẻ trong Tab 6.
     */
    setAllTab6SectionsCollapsed(shouldCollapse, showToast = false) {
      const targetBodyPairs = [
        {
          bodyId: 'tab6-acc-4-body',
          toggleId: 'btn-toggle-tab6-acc-4',
        },
        {
          bodyId: 'tab6-acc-1-body',
          toggleId: 'btn-toggle-tab6-acc-1',
        },
        {
          bodyId: 'tab6-floating-ai-manager-collapsible-body',
          toggleId: 'btn-toggle-tab6-floating-ai',
        },
        {
          bodyId: 'tab6-version-vault-collapsible-body',
          toggleId: 'btn-toggle-tab6-vault',
        },
        {
          bodyId: 'tab6-misc-fun-collapsible-body',
          toggleId: 'btn-toggle-tab6-misc-fun',
        },
        {
          bodyId: 'mod31-directory-panel-body',
          mod31Sync: shouldCollapse,
        },
      ];

      if (NS.featureDirectory) {
        if (typeof NS.featureDirectory.setPanelCollapsed === 'function') {
          NS.featureDirectory.setPanelCollapsed(Boolean(shouldCollapse), false);
        } else {
          NS.featureDirectory.isDirectoryPanelCollapsed = Boolean(shouldCollapse);
        }
        if (typeof NS.featureDirectory.renderRoot === 'function') {
          NS.featureDirectory.renderRoot();
        }
      }

      targetBodyPairs.forEach(({ bodyId, toggleId }) => {
        if (NS.navigator?.collapsibleToolbars?.setTargetCollapsed && bodyId !== 'mod31-directory-panel-body') {
          NS.navigator.collapsibleToolbars.setTargetCollapsed(bodyId, Boolean(shouldCollapse));
        }
        const body = document.getElementById(bodyId);
        if (body) {
          body.classList.toggle('hidden', Boolean(shouldCollapse));
        }
        const btn = toggleId ? document.getElementById(toggleId) : null;
        if (btn) {
          btn.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
          const arrow = btn.querySelector('.noir-collapse-arrow');
          if (arrow) arrow.textContent = shouldCollapse ? '▾' : '▴';
        }
      });

      writeStorageSafe(
        MOD33_CONFIG.STORAGE_KEYS.TAB6_COLLAPSE_MODE,
        shouldCollapse ? 'COLLAPSED' : 'EXPANDED'
      );

      if (showToast) {
        NS.uiUtils?.showToast?.(
          shouldCollapse
            ? '⏫ Đã thu gọn hết các mục phụ ở Tab 6 — Chỉ giữ lại Cụm Mục Nổi Bật Nhất!'
            : '⏬ Đã mở rộng toàn bộ các bảng công cụ trên Tab 6!',
          'info',
          2400
        );
      }
    }

    /**
     * Đồng bộ trạng thái thu gọn cho các thẻ động trong Tab 6 mà không gán trùng listener với Mod 29.
     */
    enhanceDynamicCardsInTab6() {
      const floatingSec = document.getElementById('tab6-floating-ai-manager-section');
      if (floatingSec && !floatingSec.dataset.mod33Wrapped) {
        floatingSec.dataset.mod33Wrapped = '1';
        const toggleBtn = document.getElementById('btn-toggle-tab6-floating-ai');
        const bodyEl = document.getElementById('tab6-floating-ai-manager-collapsible-body');
        if (toggleBtn && bodyEl && !toggleBtn.hasAttribute('data-noir-collapse-target')) {
          toggleBtn.addEventListener('click', () => {
            const nextHidden = !bodyEl.classList.contains('hidden');
            bodyEl.classList.toggle('hidden', nextHidden);
            toggleBtn.setAttribute('aria-expanded', nextHidden ? 'false' : 'true');
          });
        }
      }
    }

    bindSpotlightDockEvents() {
      if (this.eventsBound) return;
      this.eventsBound = true;

      const bindClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.mod33Bound) {
          el.dataset.mod33Bound = '1';
          el.addEventListener('click', fn);
        }
      };

      bindClick(MOD33_CONFIG.SELECTORS.TAB6_BTN_COLLAPSE_ALL, () => {
        this.setAllTab6SectionsCollapsed(true, true);
      });

      bindClick(MOD33_CONFIG.SELECTORS.TAB6_BTN_EXPAND_ALL, () => {
        this.setAllTab6SectionsCollapsed(false, true);
      });

      bindClick('btn-s6-quick-gate', () => {
        if (NS.entryGate?.openGate) {
          NS.entryGate.openGate(true);
        } else {
          document.getElementById('btn-s6-open-connection-gate')?.click();
        }
      });

      bindClick('btn-s6-quick-export', () => {
        document.getElementById('btn-s6-card-export')?.click();
      });

      bindClick('btn-s6-quick-video', () => {
        NS.tutorialAndChangelog?.openModal?.('VIDEO');
      });

      bindClick('btn-s6-quick-vault', () => {
        const vaultBody = document.getElementById('tab6-version-vault-collapsible-body');
        if (vaultBody && vaultBody.classList.contains('hidden')) {
          document.getElementById('btn-toggle-tab6-vault')?.click();
        }
        document.getElementById('tab6-version-history-vault')?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'start',
        });
      });

      bindClick('btn-s6-quick-verify-all-links', () => {
        this.syncer.verifyAndRepairAllLinks(true);
        NS.connectionSelfTest?.renderSelfTestReportIntoTab6?.(false);
      });
    }

    /**
     * Kiểm tra sự hiện diện của các nút điều khiển hàng đầu trên Tab 6 và gắn chú thích bảo chứng.
     */
    verifyTopActionsReadiness() {
      if (typeof document === 'undefined') return { ready: false, missing: [] };
      const requiredTopIds = [
        'btn-tab6-top-bug-report',
        'btn-tab6-top-credits',
        'btn-tab6-top-donate-coffee',
        'btn-tab6-top-sync-devices',
        'btn-tab6-top-export-pdf',
        'tab6-acc-4-tutorial-encyclopedia',
      ];
      const missing = requiredTopIds.filter((id) => !document.getElementById(id));
      return {
        ready: missing.length === 0,
        presentCount: requiredTopIds.length - missing.length,
        totalCount: requiredTopIds.length,
        missing,
      };
    }

    init() {
      this.bindSpotlightDockEvents();
      this.enhanceDynamicCardsInTab6();
      const markTab6MixedMode = () => {
        writeStorageSafe(MOD33_CONFIG.STORAGE_KEYS.TAB6_COLLAPSE_MODE, 'MIXED');
      };
      [
        'btn-toggle-tab6-acc-4',
        'btn-toggle-tab6-acc-1',
        'btn-toggle-tab6-floating-ai',
        'btn-toggle-tab6-vault',
        'btn-toggle-tab6-misc-fun',
        'mod31-btn-toggle-panel',
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.mod33MixedBound) {
          el.dataset.mod33MixedBound = '1';
          el.addEventListener('click', markTab6MixedMode);
        }
      });

      const savedMode = readStorageSafe(
        MOD33_CONFIG.STORAGE_KEYS.TAB6_COLLAPSE_MODE,
        ''
      );
      let hasPerSectionOpen = false;
      try {
        const rawMap = readStorageSafe('noir_v39_collapsed_controls_v1', '');
        const parsedMap = rawMap ? JSON.parse(rawMap) : null;
        if (parsedMap && typeof parsedMap === 'object') {
          hasPerSectionOpen = [
            'tab6-acc-4-body',
            'tab6-acc-1-body',
            'tab6-floating-ai-manager-collapsible-body',
            'tab6-version-vault-collapsible-body',
            'tab6-misc-fun-collapsible-body',
          ].some((k) => k in parsedMap);
        }
      } catch (_e) {}

      if (savedMode === '' || (savedMode === 'COLLAPSED' && !hasPerSectionOpen)) {
        this.setAllTab6SectionsCollapsed(true, false);
      } else {
        NS.navigator?.collapsibleToolbars?.refreshBindings?.();
      }
      setTimeout(() => {
        this.enhanceDynamicCardsInTab6();
        this.verifyTopActionsReadiness();
      }, 350);
    }
  }

  // ==========================================================================
  // PHẦN 6B: MA TRẬN TỰ KIỂM TRA TÍNH TOÀN VẸN KẾT NỐI 6 TẦNG (SELF-TEST MATRIX)
  // ==========================================================================

  class ConnectionIntegritySelfTestMatrix {
    constructor(connectionSync, neuralVoice, domVideoMirror) {
      this.connectionSync = connectionSync;
      this.neuralVoice = neuralVoice;
      this.domVideoMirror = domVideoMirror;
      this.lastReport = null;
    }

    /**
     * Chạy kiểm toán chéo 6 lớp hạ tầng của Studio tại thời điểm hiện tại:
     *   1. Gemini API Key + Chứng thực Flash-Lite thấp nhất
     *   2. Liên kết Thư mục ổ cứng thật / Dự phòng Mobile
     *   3. Gói tài khoản & khả năng gọi Pro / Argon 4 / Carbon 4
     *   4. Độc lập mô hình Chatbot Bi #8 (mặc định Flash-Lite, không ghi đè Tab 3)
     *   5. Trình chiếu DOM thật của Video Hướng Dẫn (DUP_IDS = 0)
     *   6. Động cơ giọng đọc Neural song ngữ VI/EN
     */
    runFullSixLayerAudit() {
      const state = this.connectionSync.getUnifiedConnectionSnapshot();
      const router = NS.geminiRouter;
      const tab3Model = String(
        router?.getSelectedModelId?.() || router?.selectedModelId || 'gemini-3.8-flash'
      );
      const enforcedChat = NS.mascotBi?.resolveEnforcedAiConfigForMode?.();
      const chatbotModel = String(
        enforcedChat?.modelId || NS.mascotBi?.prefs?.chatModelId || MOD33_CONFIG.CHATBOT_DEFAULT_LITE_MODEL
      );
      const isChatbotLite = /flash-lite|hydrogen/i.test(chatbotModel);
      const stageEl = document.getElementById(MOD33_CONFIG.SELECTORS.VIDEO_MIRROR_STAGE);
      const voiceProfile = this.neuralVoice?.describeActiveVoiceProfile?.('vi-VN') || {
        supported: false,
        isNeural: false,
        voiceName: 'Chưa sẵn sàng',
      };

      const checks = [
        {
          id: 'LAYER_1_API_KEY',
          title: '1. Gemini API Key & Xác thực Flash-Lite',
          ok: Boolean(state.hasApiKey && state.isFlashVerified),
          statusText: state.hasApiKey
            ? state.isFlashVerified
              ? `Đạt chuẩn (${state.keyMask} · ${state.verifyEndpoint || 'flash-lite'})`
              : `Đã nhập (${state.keyMask}) nhưng cần xác thực Flash-Lite`
            : 'Chưa gắn API Key',
        },
        {
          id: 'LAYER_2_FOLDER_SYNC',
          title: '2. Thư mục Ổ cứng / Két dự phòng',
          ok: Boolean(state.folderConnected),
          statusText: state.folderConnected
            ? `${state.folderFallbackActive ? 'Mobile Vault' : 'Thư mục thật'}: ${state.folderName}`
            : 'Chưa gắn thư mục làm việc',
        },
        {
          id: 'LAYER_3_PLAN_TIER',
          title: '3. Gói Google AI & Argon 4 / Carbon 4',
          ok: state.planTier === 'STANDARD' || state.hasApiKey,
          statusText: `${state.planSpec.badgeLabel} · Live probe ${state.liveModelsCount} model(s)`,
        },
        {
          id: 'LAYER_4_CHATBOT_LITE',
          title: '4. Chatbot Bi #8 Tự Động Theo Chế Độ',
          ok: isChatbotLite,
          statusText: `Chatbot: ${chatbotModel} | Tab 3 Viết: ${tab3Model}`,
        },
        {
          id: 'LAYER_5_DOM_MIRROR',
          title: '5. Video Chiếu Giao Diện Web Thật',
          ok: Boolean(this.domVideoMirror?.enabled),
          statusText: stageEl
            ? `Sẵn sàng chiếu DOM thật (không trùng ID)`
            : 'Sân khấu sẽ gắn ngay khi mở Tab Video Hướng Dẫn',
        },
        {
          id: 'LAYER_6_NEURAL_VOICE',
          title: '6. Động Cơ Giọng Nói Neural VI/EN',
          ok: Boolean(voiceProfile.supported),
          statusText: voiceProfile.supported
            ? `${voiceProfile.isNeural ? '✨ Neural' : '🔊 System'}: ${voiceProfile.voiceName}`
            : 'Trình duyệt không hỗ trợ SpeechSynthesis',
        },
      ];

      const passedCount = checks.filter((c) => c.ok).length;
      const report = {
        timestampIso: new Date().toISOString(),
        passedCount,
        totalCount: checks.length,
        allHealthy: passedCount === checks.length,
        checks,
        stateSnapshot: state,
      };
      this.lastReport = report;
      return report;
    }

    renderSelfTestReportIntoTab6(showToast = true) {
      const report = this.runFullSixLayerAudit();
      let container = document.getElementById('mod33-tab6-selftest-report-box');
      if (!container) {
        const dock = document.getElementById(MOD33_CONFIG.SELECTORS.TAB6_SPOTLIGHT_DOCK);
        if (dock) {
          container = document.createElement('div');
          container.id = 'mod33-tab6-selftest-report-box';
          container.className =
            'mt-3 p-3 rounded-xl border border-cyan-500/35 bg-zinc-950/85 space-y-2';
          dock.appendChild(container);
        }
      }

      if (container) {
        container.classList.remove('hidden');
        container.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-zinc-800">
            <span class="text-xs font-extrabold text-cyan-300">
              🩺 Kết Quả Tự Kiểm Tra 6 Tầng Hệ Thống: ${report.passedCount}/${report.totalCount} Đạt
            </span>
            <button type="button" id="btn-mod33-close-selftest"
              class="px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300">
              ✕ Đóng báo cáo
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            ${report.checks
              .map(
                (item) => `
              <div class="p-2 rounded-lg border ${
                item.ok
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : 'border-amber-500/45 bg-amber-950/25'
              }">
                <div class="text-[11px] font-extrabold ${
                  item.ok ? 'text-emerald-300' : 'text-amber-300'
                }">${item.ok ? '✅' : '⚠️'} ${escapeHtmlSafe(item.title)}</div>
                <div class="text-[10px] text-zinc-300 mt-0.5">${escapeHtmlSafe(item.statusText)}</div>
              </div>
            `
              )
              .join('')}
          </div>
        `;
        const closeBtn = document.getElementById('btn-mod33-close-selftest');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            container.classList.add('hidden');
          });
        }
      }

      if (showToast) {
        NS.uiUtils?.showToast?.(
          `🩺 Đã kiểm tra 6 tầng kết nối: ${report.passedCount}/${report.totalCount} mục hoạt động đồng bộ!`,
          report.passedCount >= 5 ? 'success' : 'info',
          3000
        );
      }
      return report;
    }
  }

  // ==========================================================================
  // PHẦN 7: BỘ ĐIỀU KHIỂN MODULE 33 THỐNG NHẤT
  // ==========================================================================

  class Mod33ConnectionAndVoiceController {
    constructor() {
      this.version = MOD33_CONFIG.MODULE_VERSION;
      this.connectionSync = new UnifiedConnectionAndTierSynchronizer();
      this.neuralVoice = new BilingualNeuralVoiceStudio();
      this.domVideoMirror = new RealDomVideoMirrorRenderer();
      this.tab6Orchestrator = new Tab6SpotlightAndCollapseOrchestrator(this.connectionSync);
      this.selfTestMatrix = new ConnectionIntegritySelfTestMatrix(
        this.connectionSync,
        this.neuralVoice,
        this.domVideoMirror
      );
      this.initialized = false;
    }

    init() {
      if (this.initialized) {
        this.connectionSync.syncUnifiedConnectionUI();
        this.neuralVoice.syncVoicePickerUI();
        return;
      }

      this.connectionSync.init();
      this.neuralVoice.init();
      this.tab6Orchestrator.init();
      this.initialized = true;
    }
  }

  const mod33Instance = new Mod33ConnectionAndVoiceController();

  NS.connectionAndVoiceStudio = mod33Instance;
  NS.unifiedConnectionGuard = mod33Instance.connectionSync;
  NS.neuralVoice = mod33Instance.neuralVoice;
  NS.liveDomVideoMirror = mod33Instance.domVideoMirror;
  NS.tab6Spotlight = mod33Instance.tab6Orchestrator;
  NS.connectionSelfTest = mod33Instance.selfTestMatrix;
  NS.MOD33_PLAN_TIERS = GOOGLE_PLAN_TIERS_CATALOG;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod33', mod33Instance);
  }
})(typeof window !== 'undefined' ? window : globalThis);
