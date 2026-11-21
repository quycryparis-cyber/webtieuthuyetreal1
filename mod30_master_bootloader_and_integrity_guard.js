/**
 * ============================================================================
 * NOIR STUDIO v38.0 — MODULE 30: BỘ KHỞI ĐỘNG TỔNG THỂ (MASTER BOOTLOADER),
 * ĐIỀU PHỐI THỨ TỰ KHỞI TẠO 30 MODULE & KIỂM ĐỊNH TOÀN VẸN HỆ THỐNG
 * ============================================================================
 * Nhiệm vụ:
 *  - Đảm bảo toàn bộ 30 module (mod01 -> mod30) được nạp và kích hoạt đúng
 *    thứ tự phụ thuộc bất đồng bộ (Storage -> Chapters -> AutoSave/Versions ->
 *    RAG/Bible/Scene -> Prompts/Router/AI -> Tab 3/Mode 5 -> Exporter/Chat/Nav).
 *  - Kết nối chuẩn xác các nút bấm cầu nối còn thiếu giữa HTML và các Engine
 *    bằng NS.bindOnce để KHÔNG BAO GIỜ tạo listener trùng lặp hay nút chết.
 *  - Đăng ký Service Worker PWA (sw.js) an toàn dưới HTTP/HTTPS, theo dõi
 *    toàn vẹn DOM và cung cấp NS.runIntegrityAudit() chuẩn đoán toàn hệ thống.
 * ============================================================================
 */
(function initMod30MasterBootloader(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  /**
   * Danh mục kiểm tra 30 module bắt buộc & ánh xạ tên biến trên window.NoirStudio.
   */
  const THIRTY_MODULES_CONTRACT_REGISTRY = Object.freeze([
    { index: 1, key: 'mod01', file: 'mod01_core_kernel_and_event_bus.js', nsProp: 'constants', label: 'Hạt nhân Core & Event Bus' },
    { index: 2, key: 'mod02', file: 'mod02_gemini_models_catalog_and_router_config.js', nsProp: 'models', label: 'Danh mục Mô hình Gemini & Phân luồng' },
    { index: 3, key: 'mod03', file: 'mod03_humanized_ui_toast_and_vn_nlp_utils.js', nsProp: 'uiUtils', label: 'UI Thông báo Tiếng Việt & Bộ NLP' },
    { index: 4, key: 'mod04', file: 'mod04_indexeddb_storage_and_emergency_vault.js', nsProp: 'idb', label: 'Kho IndexedDB & Két sắt Khẩn cấp' },
    { index: 5, key: 'mod05', file: 'mod05_local_filesystem_and_folder_sync.js', nsProp: 'fsEngine', label: 'Đồng bộ Thư mục Ổ cứng Máy tính' },
    { index: 6, key: 'mod06', file: 'mod06_document_importer_docx_pdf_txt.js', nsProp: 'docParser', label: 'Bộ Nhập Tệp DOCX / PDF / TXT / MD' },
    { index: 7, key: 'mod07', file: 'mod07_bm25_local_rag_memory_engine.js', nsProp: 'rag', label: 'Động cơ Ký ức Cục bộ BM25 (0 Token)' },
    { index: 8, key: 'mod08', file: 'mod08_chapter_tree_and_bidirectional_approval.js', nsProp: 'chapterManager', label: 'Quản lý Cây Chương & Duyệt 2 Chiều' },
    { index: 9, key: 'mod09', file: 'mod09_three_tier_autosave_and_undo_stack.js', nsProp: 'autoSaver', label: 'Tự động Lưu 3 Tầng & Hoàn tác Sâu' },
    { index: 10, key: 'mod10', file: 'mod10_version_time_machine_and_live_preview.js', nsProp: 'versionVault', label: 'Kho Phiên Bản Time-Machine & Preview' },
    { index: 11, key: 'mod11', file: 'mod11_google_docs_ai_diff_review_engine.js', nsProp: 'aiDiff', label: 'Soát Màu Đề Xuất AI Kiểu Google Docs' },
    { index: 12, key: 'mod12', file: 'mod12_story_bible_and_lore_matrix_engine.js', nsProp: 'storyBible', label: 'Trung Tâm Story Bible & Ma Trận Lore' },
    { index: 13, key: 'mod13', file: 'mod13_scene_transition_and_pov_builder.js', nsProp: 'sceneBuilder', label: 'Mốc Chuyển Phân Cảnh & Góc Nhìn POV' },
    { index: 14, key: 'mod14', file: 'mod14_five_modes_system_prompts_studio.js', nsProp: 'sysPrompts', label: 'Cấu Hình Prompt Hệ Thống 5 Chế Độ' },
    { index: 15, key: 'mod15', file: 'mod15_api_key_vault_and_zero_congestion_client.js', nsProp: 'geminiRouter', label: 'Két Sắt API Key & Router Chống Nghẽn' },
    { index: 16, key: 'mod16', file: 'mod16_master_prompt_synthesizer_two_step.js', nsProp: 'promptSynthesizer', label: 'Tổng Hợp Prompt Tổng 2 Bước Chính Thức' },
    { index: 17, key: 'mod17', file: 'mod17_tab3_five_modes_output_controller.js', nsProp: 'tab3Controller', label: 'Điều Khiển Cửa Sổ Đầu Ra Tab 3 (5 Chế Độ)' },
    { index: 18, key: 'mod18', file: 'mod18_mode5_plot_diagram_and_timeline_studio.js', nsProp: 'mode5Studio', label: 'Chế Độ 5 Vẽ Biểu Đồ Cốt Truyện SVG' },
    { index: 19, key: 'mod19', file: 'mod19_smart_approval_and_bible_extractor.js', nsProp: 'approvalExtractor', label: 'Duyệt Chương Thông Minh & Trích Xuất Bible' },
    { index: 20, key: 'mod20', file: 'mod20_bidirectional_pomodoro_sync_engine.js', nsProp: 'pomodoro', label: 'Đồng Hồ Pomodoro Đồng Bộ 2 Chiều' },
    { index: 21, key: 'mod21', file: 'mod21_mp3_ab_loop_and_webaudio_soundscape.js', nsProp: 'audioStudio', label: 'Trình Phát MP3 Lặp A-B & Âm Thanh' },
    { index: 22, key: 'mod22', file: 'mod22_typography_and_60fps_ambient_canvas.js', nsProp: 'ambience', label: 'Kiểu Chữ Trang Sách & Hiệu Ứng Nền 60FPS' },
    { index: 23, key: 'mod23', file: 'mod23_dialogue_normalizer_and_vn_editor_tools.js', nsProp: 'editorTools', label: 'Chuẩn Hóa Thoại & Công Cụ Soạn Thảo' },
    { index: 24, key: 'mod24', file: 'mod24_cliche_scanner_and_pacing_heatmap.js', nsProp: 'clicheScanner', label: 'Quét Sáo Ngữ AI & Bản Đồ Nhịp Văn' },
    { index: 25, key: 'mod25', file: 'mod25_webnovel_secret_features_and_lore_whisper.js', nsProp: 'webNovelFeatures', label: 'Tính Năng Ngầm WebNovel & Ngũ Quan' },
    { index: 26, key: 'mod26', file: 'mod26_pdf_docx_epub_custom_book_exporter.js', nsProp: 'exporter', label: 'Xuất Sách PDF Chọn Font/Size, DOCX, EPUB' },
    { index: 27, key: 'mod27', file: 'mod27_mascot_bi_so_8_and_dual_chat_assistant.js', nsProp: 'mascotAndChat', label: 'Linh Vật Viên Bi Số 8 & Chat Gemini' },
    { index: 28, key: 'mod28', file: 'mod28_animated_video_tutorial_with_subtitles.js', nsProp: 'tutorialAndChangelog', label: 'Video Hướng Dẫn Có Phụ Đề & Cẩm Nang A-Z' },
    { index: 29, key: 'mod29', file: 'mod29_responsive_mobile_pwa_and_six_screens_nav.js', nsProp: 'navigator', label: 'Điều Hướng 6 Màn Hình & Responsive Mobile' },
    { index: 30, key: 'mod30', file: 'mod30_master_bootloader_and_integrity_guard.js', nsProp: 'bootloader', label: 'Bộ Khởi Động Tổng Thể & Kiểm Định Hệ Thống' },
    { index: 31, key: 'mod31', file: 'mod31_full_feature_directory_and_inspector.js', nsProp: 'featureDirectory', label: 'Thư Viện Toàn Bộ Tính Năng Website & Điều Hướng Nhanh' },
    { index: 32, key: 'mod32', file: 'mod32_ambient_backdrop_engine_and_argon_bridge.js', nsProp: 'argonAndStageEngine', label: 'Sân Khấu Hình Nền Đa Tầng & Cầu Nối Gemini Argon 4' },
    { index: 33, key: 'mod33', file: 'mod33_unified_connection_guard_and_live_voice_studio.js', nsProp: 'connectionAndVoiceStudio', label: 'Bảo Chứng API/Thư Mục/Pro-Ultra, Giọng Neural VI/EN & Video DOM Thật' },
    { index: 34, key: 'mod34', file: 'mod34_bug_report_and_doc_relay.js', nsProp: 'bugReport', label: 'Báo Lỗi Từ Người Dùng Tab 6, Lọc Bí Mật & Chuyển Tiếp Kín' },
    { index: 35, key: 'mod35', file: 'mod35_author_credits_and_social_hub.js', nsProp: 'authorCredits', label: 'Author Credits Cuộn Tự Động (Mai Hải Đăng) & Liên Hệ Tác Giả' },
    { index: 36, key: 'mod36', file: 'mod36_zero_reload_save_shield_and_integrity_guard.js', nsProp: 'zeroReloadShield', label: 'Khiên Chống Reload Đột Ngột Khi Gõ/Backspace/Backup & Giữ Con Trỏ' },
    { index: 37, key: 'mod37', file: 'mod37_workspace_export_and_gdrive_sync.js', nsProp: 'workspaceSync', label: 'Xuất Kết Quả Làm Việc (.ZIP), Nhập Lại & Đồng Bộ Google Drive' },
    { index: 38, key: 'mod38', file: 'mod38_local_compute_and_tab5_attendance.js', nsProp: 'localComputeAndAttendance', label: 'Điểm Danh Tab 5, Modal Đầu Trang Tab 6 & Xưởng Tài Liệu Cục Bộ (0 Upload)' },
    { index: 39, key: 'mod39', file: 'mod39_youtube_adfree_player_and_background.js', nsProp: 'youtubeStudio', label: 'Trình Xem YouTube Privacy-Enhanced (Full/Lặp A-B/Tốc Độ) & Tìm Trong Khung Tab 5' },
    { index: 40, key: 'mod40', file: 'mod40_youtube_motion_background_engine.js', nsProp: 'youtubeMotionBg', label: 'Động Cơ Nền Video Chuyển Động YouTube 16:9 Tự Động Ưu Tiên (Mờ/Sáng/Tối/Kính Mờ)' },
    { index: 41, key: 'mod41', file: 'mod41_guest_demo_sandbox_mode.js', nsProp: 'guestMode', label: 'Chế Độ Dùng Thử Guest Mode (Không Cần API/Thư Mục & Mô Phỏng 5 Chế Độ)' },
    { index: 42, key: 'mod42', file: 'mod42_world_clock_weather_and_alarm.js', nsProp: 'worldClockStudio', label: 'Khung Giờ Quốc Tế, Định Dạng Ngày Giờ, Thời Tiết & Báo Thức (MP3 / Hệ Thống)' },
    { index: 43, key: 'mod43', file: 'mod43_realtime_weather_sky_engine.js', nsProp: 'weatherSkyEngine', label: 'Động Cơ Thời Tiết Thời Gian Thực & Nền Bầu Trời 60FPS (6 Khung Giờ × 28 WMO)' },
    { index: 44, key: 'mod44', file: 'mod44_site_traffic_analytics_box.js', nsProp: 'siteTrafficAnalytics', label: 'Ô Thống Kê Người Đang Truy Cập & Lượt Truy Cập (Ngày / Tuần / Tháng / Năm / Lịch Sử)' },
  ]);

  /**
   * Danh sách các phần tử DOM cốt lõi bắt buộc phải hiện diện trong file HTML thống nhất.
   */
  const CRITICAL_DOM_INVENTORY_IDS = Object.freeze([
    'desktop-six-tabs-nav',
    'mobile-bottom-nav',
    'left-sidebar-pane',
    'center-editor-pane',
    'pane-left-beats',
    'pane-right-manuscript',
    'right-bible-pane',
    's14-screen-5-ambience',
    's14-screen-6-system',
    'textarea-chapter-content',
    'input-chapter-title',
    'quick-chapter-switcher',
    'chapter-tree-container',
    'rag-search-input',
    'btn-rag-search',
    'rag-search-results',
    's20-quad-tab-selector',
    's20-quad-output-textarea',
    'btn-open-fullscreen-ai-command',
    'modal-fullscreen-ai-command',
    's18-fullscreen-prompt-textarea',
    'btn-run-master-prompt-synthesis',
    'modal-confirm-synthesized-prompt',
    'textarea-synthesized-master-prompt',
    'confirm-modal-model-select',
    'confirm-model-lite-warning',
    'btn-execute-official-novel-prompt',
    'btn-approve-chapter',
    'modal-approve-chapter-smart',
    'ai-diff-review-toolbar',
    'ai-diff-review-surface',
    'version-history-list-container',
    'version-preview-content-box',
    'modal-fullscreen-version-preview',
    'modal-s6-custom-exporter',
    'export-pdf-font-family',
    'export-pdf-font-size',
    'modal-api-key-vault',
    'modal-tutorial-changelog-az',
    'modal-sensory-and-author-notes',
    'tab6-workspace-export-root',
    'tab6-mod31-feature-directory-root',
    'modal-free-gemini-chat',
    's15-floating-pomodoro-pill',
    's14-panel-pomodoro-box',
  ]);

  /**
   * Bộ đăng ký và giám sát Service Worker PWA (sw.js) an toàn không báo lỗi khi mở bằng file://.
   */
  class ServiceWorkerRegistrationCoordinator {
    constructor(swPath = './sw.js') {
      this.swPath = swPath;
      this.status = 'IDLE';
      this.registration = null;
      this.lastErrorMessage = '';
    }

    async registerSafely() {
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        this.status = 'UNSUPPORTED';
        return { registered: false, status: this.status };
      }
      const protocol = typeof location !== 'undefined' ? location.protocol : '';
      if (protocol !== 'https:' && protocol !== 'http:') {
        this.status = 'SKIPPED_LOCAL_FILE_PROTOCOL';
        return { registered: false, status: this.status };
      }
      try {
        const reg = await navigator.serviceWorker.register(this.swPath, { updateViaCache: 'none' });
        try { reg.update().catch(() => {}); } catch (_eUpd) {}
        this.registration = reg;
        this.status = 'REGISTERED';
        return { registered: true, status: this.status, scope: reg.scope };
      } catch (err) {
        this.status = 'REGISTER_FAILED';
        this.lastErrorMessage = err?.message || String(err);
        return { registered: false, status: this.status, error: this.lastErrorMessage };
      }
    }

    getSummary() {
      return {
        status: this.status,
        scope: this.registration?.scope || '',
        lastErrorMessage: this.lastErrorMessage,
      };
    }
  }

  /**
   * Nhật ký trình tự khởi động đo hiệu năng từng bước khởi tạo module (ms).
   */
  class BootSequenceTelemetryLedger {
    constructor() {
      this.bootStartedAt = Date.now();
      this.bootFinishedAt = null;
      this.steps = [];
    }

    recordStep(stepId, outcome, durationMs, detail = '') {
      this.steps.push({
        stepId,
        outcome,
        durationMs: Math.round(durationMs),
        detail: String(detail || ''),
        timestamp: Date.now(),
      });
    }

    markBootCompleted() {
      this.bootFinishedAt = Date.now();
    }

    getTotalBootMs() {
      const end = this.bootFinishedAt || Date.now();
      return Math.max(0, end - this.bootStartedAt);
    }

    getSummaryReport() {
      const failures = this.steps.filter((s) => s.outcome === 'ERROR');
      return {
        totalBootMs: this.getTotalBootMs(),
        stepCount: this.steps.length,
        errorCount: failures.length,
        failures,
        steps: this.steps.slice(),
      };
    }
  }

  /**
   * Cầu nối sự kiện trung tâm gắn kết an toàn (chỉ gắn 1 lần bằng NS.bindOnce) mọi nút bấm HTML
   * sang các Engine chuyên biệt, loại bỏ hoàn toàn tình trạng nút chết hay gắn trùng listener.
   */
  class CrossModuleActionBridgeBinder {
    constructor() {
      this.boundKeys = new Set();
      this.ragDebounceTimer = null;
      this.ragRebuildTimer = null;
    }

    bindClickSafe(elementOrId, bindKey, handler) {
      if (typeof document === 'undefined') return false;
      const el =
        typeof elementOrId === 'string'
          ? document.getElementById(elementOrId)
          : elementOrId;
      if (!el) return false;
      if (typeof NS.bindOnce === 'function') {
        NS.bindOnce(el, 'click', handler, bindKey);
      } else {
        if (el.dataset[bindKey] === '1') return false;
        el.dataset[bindKey] = '1';
        el.addEventListener('click', handler);
      }
      this.boundKeys.add(bindKey);
      return true;
    }

    bindEventSafe(elementOrId, eventName, bindKey, handler) {
      if (typeof document === 'undefined') return false;
      const el =
        typeof elementOrId === 'string'
          ? document.getElementById(elementOrId)
          : elementOrId;
      if (!el) return false;
      if (typeof NS.bindOnce === 'function') {
        NS.bindOnce(el, eventName, handler, bindKey);
      } else {
        const attrKey = `${bindKey}_${eventName}`;
        if (el.dataset[attrKey] === '1') return false;
        el.dataset[attrKey] = '1';
        el.addEventListener(eventName, handler);
      }
      this.boundKeys.add(`${bindKey}:${eventName}`);
      return true;
    }

    bindAllMissingBridges() {
      this.bindAiCommandAndConfirmWorkflow();
      this.bindTab2ImportAndRagSearch();
      this.bindExporterAndBackupButtons();
      this.bindMascotAndFreeChatButtons();
      this.bindHeaderUtilityAndReactiveRagSync();
      return {
        boundCount: this.boundKeys.size,
        keys: Array.from(this.boundKeys),
      };
    }

    openAiCommandCenterModal() {
      const modal = document.getElementById('modal-fullscreen-ai-command');
      if (!modal) return false;

      NS.geminiRouter?.populateAllModelDropdowns?.();
      NS.geminiRouter?.syncThinkingLevelControlsDOM?.();
      NS.geminiRouter?.quotaTracker?.renderRealtimeQuotaWidget?.();
      NS.sceneBuilder?.liveBadgeBridge?.refreshAllCommandBadges?.();

      if (
        NS.geminiRouter?.isCurrentKeyFlashLiteVerified?.() &&
        (NS.geminiRouter?.liveProbe?.lastLiveModels?.length || 0) === 0 &&
        typeof NS.geminiRouter?.liveProbe?.probeKeyAndFetchLiveModels === 'function'
      ) {
        Promise.resolve(NS.geminiRouter.liveProbe.probeKeyAndFetchLiveModels()).catch(() => {});
      }

      const promptBox = document.getElementById('s18-fullscreen-prompt-textarea');
      if (promptBox) {
        if (!promptBox.value && typeof NS.promptSynthesizer?.getResolvedUserCommand === 'function') {
          const restored = NS.promptSynthesizer.getResolvedUserCommand();
          if (restored) promptBox.value = restored;
        }
        NS.promptSynthesizer?.updatePromptCounterUI?.(promptBox.value || '');
      }
      if (typeof NS.promptSynthesizer?.bindMode2GuidanceAndSwitchLinks === 'function') {
        NS.promptSynthesizer.bindMode2GuidanceAndSwitchLinks();
      }
      if (typeof NS.promptSynthesizer?.refreshCommandModeUX === 'function') {
        NS.promptSynthesizer.refreshCommandModeUX();
      }

      modal.classList.remove('hidden');
      if (NS.modalStack?.register) {
        NS.modalStack.register('modal-fullscreen-ai-command', () => this.closeAiCommandCenterModal());
      }
      if (promptBox && typeof promptBox.focus === 'function') {
        setTimeout(() => promptBox.focus(), 40);
      }
      return true;
    }

    closeAiCommandCenterModal() {
      const modal = document.getElementById('modal-fullscreen-ai-command');
      if (modal) modal.classList.add('hidden');
      NS.modalStack?.unregister?.('modal-fullscreen-ai-command');
    }

    closeConfirmSynthesizedModal() {
      const modal = document.getElementById('modal-confirm-synthesized-prompt');
      if (modal) modal.classList.add('hidden');
      NS.modalStack?.unregister?.('modal-confirm-synthesized-prompt');
    }

    bindAiCommandAndConfirmWorkflow() {
      this.bindClickSafe('btn-open-fullscreen-ai-command', 'mod30OpenAiCmd', () => {
        this.openAiCommandCenterModal();
      });

      this.bindClickSafe('btn-tab1-quick-ai-open', 'mod30Tab1OpenAiCmd', () => {
        this.openAiCommandCenterModal();
      });

      this.bindClickSafe('btn-close-fullscreen-ai-command', 'mod30CloseAiCmd', () => {
        this.closeAiCommandCenterModal();
      });

      this.bindClickSafe('btn-cmd-open-bible-drawer', 'mod30JumpBibleFromCmd', () => {
        this.closeAiCommandCenterModal();
        NS.navigator?.navigateToScreen?.('SCREEN_4_BIBLE');
      });

      this.bindClickSafe('btn-run-master-prompt-synthesis', 'mod30RunStep1Synth', async () => {
        if (typeof NS.promptSynthesizer?.runStep1MasterSynthesis === 'function') {
          await NS.promptSynthesizer.runStep1MasterSynthesis();
          NS.promptSynthesizer?.ensureStep2EnhancementsMounted?.();
        } else {
          NS.uiUtils?.showToast?.('Bộ tổng hợp Prompt 2 bước đang khởi tạo, vui lòng thử lại sau giây lát.', 'warning');
        }
      });

      this.bindClickSafe('btn-close-confirm-synthesized', 'mod30CloseConfirmModal', () => {
        this.closeConfirmSynthesizedModal();
      });

      this.bindClickSafe('btn-back-to-command-modal', 'mod30BackToCmdModal', () => {
        this.closeConfirmSynthesizedModal();
        const origin = NS.promptSynthesizer?._pendingModalReviewContext?.origin;
        if (origin !== 'TAB3_MODE5') {
          this.openAiCommandCenterModal();
        }
      });

      this.bindClickSafe('btn-execute-official-novel-prompt', 'mod30RunStep2Execute', async () => {
        if (typeof NS.promptSynthesizer?.executeStep2OfficialNovelPrompt === 'function') {
          await NS.promptSynthesizer.executeStep2OfficialNovelPrompt();
        }
      });

      this.bindClickSafe('btn-preview-context-package', 'mod30PreviewCtxPkg', () => {
        const previewText =
          typeof NS.promptSynthesizer?.buildMasterSynthesizedPrompt === 'function'
            ? NS.promptSynthesizer.buildMasterSynthesizedPrompt()
            : '';
        const livePkg = NS.packageInspector?.buildLiveContextPackageSummary?.() || null;
        if (!previewText && !livePkg) {
          NS.uiUtils?.showToast?.('Chưa có dữ liệu ngữ cảnh để xem trước.', 'info');
          return;
        }
        const combinedText =
          previewText ||
          [
            `=== MÔ HÌNH HIỆN TẠI: ${livePkg.selectedModelId || 'gemini-3.8-flash'} ===`,
            livePkg.renderedBible ? `\n[STORY BIBLE]\n${livePkg.renderedBible}` : '',
            livePkg.charactersText ? `\n[NHÂN VẬT]\n${livePkg.charactersText}` : '',
            livePkg.markersText ? `\n[MỐC CẢNH]\n${livePkg.markersText}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        const synthBox = document.getElementById('textarea-synthesized-master-prompt');
        if (synthBox) {
          synthBox.value = combinedText;
        }
        const statsEl = document.getElementById('synthesized-prompt-stats');
        if (statsEl) {
          const words =
            NS.uiUtils?.countVietnameseWords?.(combinedText) ||
            combinedText.split(/\s+/).filter(Boolean).length;
          const fmtNum = (n) => (NS.i18n?.formatNumber ? NS.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
          const trText = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
          statsEl.textContent = trText(`${fmtNum(words)} từ đã liên kết (~${fmtNum(Math.round(words * 1.45))} tokens)`);
        }
        NS.promptSynthesizer?.updateStep2ModelAdvisoryUI?.(
          NS.geminiRouter?.selectedModelId || 'gemini-3.8-flash'
        );
        document.getElementById('modal-confirm-synthesized-prompt')?.classList.remove('hidden');
      });
    }

    bindTab2ImportAndRagSearch() {
      const fileInput = document.getElementById('file-upload-input');

      this.bindClickSafe('btn-import-files', 'mod30TriggerImportPicker', () => {
        if (fileInput) {
          fileInput.click();
        }
      });

      if (fileInput) {
        this.bindEventSafe(fileInput, 'change', 'mod30HandleFileImportChange', async (ev) => {
          const files = ev?.target?.files;
          if (!files || files.length === 0) return;
          try {
            if (typeof NS.docParser?.importMultipleFilesToChapters === 'function') {
              NS.uiUtils?.showBlockingLoader?.(
                '📥 Đang Đọc & Tách Chương Tài Liệu...',
                `Đang xử lý ${files.length} tệp tài liệu bạn vừa chọn...`
              );
              await NS.docParser.importMultipleFilesToChapters(files);
              const chaps = NS.chapterManager?.chapters || [];
              NS.rag?.rebuildIndexFromChapters?.(chaps);
              NS.chapterManager?.renderChapterTreeAndQuickSwitcher?.();
              NS.uiUtils?.hideBlockingLoader?.();
              NS.uiUtils?.showToast?.(
                `Đã xử lý xong ${files.length} tệp tài liệu vào Kho Chương.`,
                'success'
              );
            }
          } catch (err) {
            NS.uiUtils?.hideBlockingLoader?.();
            NS.uiUtils?.showToast?.(
              `Không thể đọc tệp vừa chọn: ${err?.message || err}`,
              'error'
            );
          } finally {
            fileInput.value = '';
          }
        });
      }

      const ragInput = document.getElementById('rag-search-input');
      const runRagSearch = () => {
        const q = ragInput?.value || '';
        NS.rag?.renderSearchResultsUI?.(q);
        // Bảo đảm bấm nhanh thẻ gợi ý trong kết quả cũng điền đúng vào #rag-search-input
        const box = document.getElementById('rag-search-results');
        if (box) {
          box.querySelectorAll('[data-rag-quick-chip]').forEach((chip) => {
            if (chip.dataset.mod30ChipSynced === '1') return;
            chip.dataset.mod30ChipSynced = '1';
            chip.addEventListener('click', () => {
              if (ragInput) ragInput.value = chip.getAttribute('data-rag-quick-chip') || '';
            });
          });
        }
      };

      this.bindClickSafe('btn-rag-search', 'mod30RunRagSearchClick', runRagSearch);

      if (ragInput) {
        this.bindEventSafe(ragInput, 'input', 'mod30RunRagSearchInput', () => {
          clearTimeout(this.ragDebounceTimer);
          this.ragDebounceTimer = setTimeout(runRagSearch, 180);
        });
        this.bindEventSafe(ragInput, 'keydown', 'mod30RunRagSearchEnter', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            clearTimeout(this.ragDebounceTimer);
            runRagSearch();
          }
        });
      }
    }

    bindExporterAndBackupButtons() {
      const openExportModal = () => {
        if (typeof NS.exporter?.openModal === 'function') {
          NS.exporter.openModal();
        }
      };

      this.bindClickSafe('btn-s6-open-custom-export', 'mod30OpenCustomExportTop', openExportModal);
      this.bindClickSafe('btn-s6-card-export', 'mod30OpenCustomExportCard', openExportModal);

      this.bindClickSafe('btn-s6-open-connection-gate', 'mod30OpenConnGate', () => {
        NS.connectionGate?.openGateManual?.();
      });

      this.bindClickSafe('btn-export-workspace-json', 'mod30ExportWorkspaceJson', () => {
        if (typeof NS.exporter?.exportWorkspaceJsonBackup === 'function') {
          NS.exporter.exportWorkspaceJsonBackup();
        } else if (typeof NS.emergencyVault?.exportFullBackupFile === 'function') {
          NS.emergencyVault.exportFullBackupFile();
        }
      });

      this.bindClickSafe('btn-s6-card-share-bundle', 'mod30ShareBundleCard', () => {
        if (typeof NS.exporter?.exportShareBundle === 'function') {
          NS.exporter.exportShareBundle();
        }
      });

      this.bindClickSafe('btn-export-pdf-now', 'mod30ExportPdfNow', () => {
        NS.exporter?.exportPdf?.();
      });
      this.bindClickSafe('btn-export-docx-now', 'mod30ExportDocxNow', () => {
        NS.exporter?.exportDocx?.();
      });
      this.bindClickSafe('btn-export-txt-now', 'mod30ExportTxtNow', () => {
        NS.exporter?.exportTxt?.();
      });
      this.bindClickSafe('btn-close-exporter-modal', 'mod30CloseExporterModal', () => {
        NS.exporter?.closeModal?.();
      });
    }

    bindMascotAndFreeChatButtons() {
      const openChat = () => {
        NS.mascotAndChat?.openChatModal?.();
      };
      const closeChat = () => {
        NS.mascotAndChat?.closeChatModal?.();
      };

      this.bindClickSafe('btn-open-free-gemini-chat', 'mod30OpenFreeChatTab3', openChat);
      this.bindClickSafe('btn-s11-open-bi-hub', 'mod30OpenFreeChatMascot', openChat);
      this.bindClickSafe('btn-close-free-chat', 'mod30CloseFreeChatModal', closeChat);
    }

    bindHeaderUtilityAndReactiveRagSync() {
      this.bindClickSafe('brand-autosave-pill', 'mod30BrandAutosavePill', () => {
        const chapsCount = NS.chapterManager?.chapters?.length || 0;
        const versCount = NS.versionVault?.versions?.length || 0;
        NS.uiUtils?.showToast?.(
          `Lưu 3 tầng đang hoạt động (${chapsCount} chương • ${versCount} phiên bản Time-Machine).`,
          'info'
        );
      });

      // Tự động cập nhật lại chỉ mục tìm kiếm BM25 khi có chương mới hoặc chốt duyệt
      if (NS.bus?.on && !this.boundKeys.has('mod30RagBusSync')) {
        this.boundKeys.add('mod30RagBusSync');
        const evts = NS.constants?.EVENTS || {};
        const triggerRebuild = () => {
          clearTimeout(this.ragRebuildTimer);
          this.ragRebuildTimer = setTimeout(() => {
            const chapters = NS.chapterManager?.chapters || [];
            NS.rag?.rebuildIndexFromChapters?.(chapters);
          }, 350);
        };
        if (evts.CHAPTER_CREATED) NS.bus.on(evts.CHAPTER_CREATED, triggerRebuild);
        if (evts.CHAPTER_APPROVED) NS.bus.on(evts.CHAPTER_APPROVED, triggerRebuild);
        if (evts.CHAPTER_DELETED) NS.bus.on(evts.CHAPTER_DELETED, triggerRebuild);
      }
    }
  }

  /**
   * Trình kiểm định toàn vẹn 30 module, kiểm tra DOM và phát hiện xung đột/trùng lặp sự kiện.
   */
  class SystemIntegrityAuditorEngine {
    inspectAllThirtyModules() {
      const results = THIRTY_MODULES_CONTRACT_REGISTRY.map((spec) => {
        const instance = NS[spec.nsProp] || NS.getModule?.(spec.key) || null;
        const loaded = Boolean(instance);
        const initialized =
          typeof instance?.hasInitialized === 'boolean'
            ? instance.hasInitialized
            : loaded;
        return {
          index: spec.index,
          key: spec.key,
          file: spec.file,
          nsProp: spec.nsProp,
          label: spec.label,
          loaded,
          initialized,
        };
      });

      const missingModules = results.filter((r) => !r.loaded);
      const uninitializedModules = results.filter((r) => r.loaded && !r.initialized);
      return {
        totalExpected: THIRTY_MODULES_CONTRACT_REGISTRY.length,
        loadedCount: results.filter((r) => r.loaded).length,
        missingCount: missingModules.length,
        uninitializedCount: uninitializedModules.length,
        missingModules,
        uninitializedModules,
        modules: results,
      };
    }

    inspectCriticalDomElements() {
      if (typeof document === 'undefined') {
        return { presentCount: 0, missingCount: CRITICAL_DOM_INVENTORY_IDS.length, missingIds: [...CRITICAL_DOM_INVENTORY_IDS] };
      }
      const missingIds = [];
      for (const id of CRITICAL_DOM_INVENTORY_IDS) {
        if (!document.getElementById(id)) {
          missingIds.push(id);
        }
      }
      return {
        totalChecked: CRITICAL_DOM_INVENTORY_IDS.length,
        presentCount: CRITICAL_DOM_INVENTORY_IDS.length - missingIds.length,
        missingCount: missingIds.length,
        missingIds,
      };
    }

    inspectLegacyConflictAbsence() {
      if (typeof document === 'undefined') return { clean: true, legacyScriptsLoaded: [] };
      const scripts = Array.from(document.querySelectorAll('script[src]')).map((s) =>
        s.getAttribute('src') || ''
      );
      const legacyPatterns = ['stage1_to_15', 'stage16_', 'stage17_', 'stage18_', 'stage19_', 'stage20_', 'noir_studio_unified'];
      const legacyScriptsLoaded = scripts.filter((src) =>
        legacyPatterns.some((pat) => src.includes(pat))
      );
      return {
        clean: legacyScriptsLoaded.length === 0,
        totalScriptsInDom: scripts.length,
        legacyScriptsLoaded,
      };
    }

    runFullIntegrityAudit(swCoordinator, bootTelemetry) {
      const moduleCheck = this.inspectAllThirtyModules();
      const domCheck = this.inspectCriticalDomElements();
      const conflictCheck = this.inspectLegacyConflictAbsence();
      const navAudit = NS.navigator?.runResponsiveHealthReport?.() || null;
      const pomoCheck = NS.pomodoro?.getDailyFocusSummaryReport?.() || null;
      const aiPipelineCheck = NS.promptSynthesizer?.verifyPipelineHealth?.() || null;

      const healthy =
        moduleCheck.missingCount === 0 &&
        domCheck.missingCount === 0 &&
        conflictCheck.clean &&
        Boolean(!navAudit || navAudit.domIntegrity?.healthy);

      return {
        healthy,
        auditedAt: new Date().toISOString(),
        bootTelemetry: bootTelemetry?.getSummaryReport?.() || null,
        modules: moduleCheck,
        dom: domCheck,
        conflictCheck,
        navigation: navAudit,
        pomodoro: pomoCheck,
        aiPipeline: aiPipelineCheck,
        serviceWorker: swCoordinator?.getSummary?.() || null,
      };
    }
  }

  /**
   * Trình giám sát lỗi runtime toàn cục (tránh crash trắng trang khi gặp ngoại lệ bất ngờ).
   */
  class RuntimeErrorSentinelAndAutoRecovery {
    constructor(maxRecentErrors = 30) {
      this.maxRecentErrors = maxRecentErrors;
      this.capturedErrors = [];
      this.listenersAttached = false;
    }

    attachGlobalHandlers() {
      if (typeof window === 'undefined' || this.listenersAttached) return;
      this.listenersAttached = true;

      window.addEventListener('error', (ev) => {
        this.recordCapturedError('window.error', ev?.error || ev?.message || 'Lỗi script không xác định', {
          filename: ev?.filename || '',
          lineno: ev?.lineno || 0,
        });
      });

      window.addEventListener('unhandledrejection', (ev) => {
        const reason = ev?.reason;
        this.recordCapturedError(
          'unhandledrejection',
          reason?.message || String(reason || 'Promise bị từ chối chưa bắt'),
          { stack: reason?.stack || '' }
        );
      });
    }

    recordCapturedError(sourceType, errorOrMessage, meta = {}) {
      const msg =
        errorOrMessage instanceof Error
          ? errorOrMessage.message
          : String(errorOrMessage || 'Unknown error');
      const entry = {
        id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestampIso: new Date().toISOString(),
        sourceType,
        message: msg,
        meta,
      };
      this.capturedErrors.push(entry);
      if (this.capturedErrors.length > this.maxRecentErrors) {
        this.capturedErrors.shift();
      }
      if (NS.logger?.warn) {
        NS.logger.warn(`[BootSentinel:${sourceType}] ${msg}`, meta);
      }
      return entry;
    }

    attemptSafeLoaderRecovery() {
      // Nếu phát hiện kẹt màn hình chờ toàn cục quá lâu do exception mạng bất ngờ, có thể gọi để gỡ kẹt
      try {
        NS.uiUtils?.hideBlockingLoader?.();
      } catch (_err) {
        const loader = typeof document !== 'undefined' && document.getElementById('global-ai-blocking-loader');
        if (loader) loader.classList.add('hidden');
      }
    }

    getHealthSnapshot() {
      return {
        capturedErrorCount: this.capturedErrors.length,
        recentErrors: this.capturedErrors.slice(-10),
        cleanRun: this.capturedErrors.length === 0,
      };
    }
  }

  /**
   * Trình kiểm tra xung đột ID DOM trùng lặp & tính duy nhất của thuộc tính HTML.
   */
  class DuplicateDomIdAndBindingInspector {
    scanDuplicateElementIds() {
      if (typeof document === 'undefined') return { clean: true, duplicates: [] };
      const allWithId = document.querySelectorAll('[id]');
      const counts = new Map();
      allWithId.forEach((el) => {
        const id = el.getAttribute('id');
        if (!id) return;
        counts.set(id, (counts.get(id) || 0) + 1);
      });
      const duplicates = [];
      counts.forEach((count, id) => {
        if (count > 1) {
          duplicates.push({ id, count });
        }
      });
      return {
        totalIdsScanned: allWithId.length,
        uniqueIdsCount: counts.size,
        duplicateCount: duplicates.length,
        duplicates,
        clean: duplicates.length === 0,
      };
    }

    verifyNoLegacyGlobalPolluters() {
      if (typeof window === 'undefined') return { clean: true, foundLegacyGlobals: [] };
      const forbiddenLegacyKeys = [
        'STAGE16_LOADED',
        'STAGE17_PATCHED',
        'STAGE18_ACTIVE',
        'STAGE19_PATCHED',
        'STAGE20_OVERHAUL',
      ];
      const foundLegacyGlobals = forbiddenLegacyKeys.filter((k) => Boolean(window[k]));
      return {
        clean: foundLegacyGlobals.length === 0,
        foundLegacyGlobals,
      };
    }
  }

  /**
   * Bộ điều phối khởi động theo 6 pha phụ thuộc nghiêm ngặt cho toàn bộ 30 Module.
   */
  class PhasedDependencyOrchestrator {
    constructor(telemetryLedger, sentinel, bridgeBinder, swCoordinator) {
      this.telemetry = telemetryLedger;
      this.sentinel = sentinel;
      this.bridgeBinder = bridgeBinder;
      this.swCoordinator = swCoordinator;
      this.hasBooted = false;
      this.bootPromise = null;
    }

    async invokeModuleInitSafe(label, targetObj, methodName = 'init', skipIfAlreadyInit = true) {
      const started = Date.now();
      if (!targetObj) {
        this.telemetry.recordStep(label, 'SKIPPED_MISSING', 0, 'Module object chưa tồn tại');
        return false;
      }
      if (skipIfAlreadyInit && targetObj.hasInitialized === true) {
        this.telemetry.recordStep(label, 'ALREADY_INITIALIZED', 0, 'Bỏ qua khởi tạo lại');
        return true;
      }
      if (typeof targetObj[methodName] !== 'function') {
        this.telemetry.recordStep(label, 'READY_NO_INIT', 0, 'Module kích hoạt đồng bộ');
        return true;
      }
      try {
        const maybePromise = targetObj[methodName]();
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
        }
        this.telemetry.recordStep(label, 'OK', Date.now() - started);
        return true;
      } catch (err) {
        const msg = err?.message || String(err);
        this.telemetry.recordStep(label, 'ERROR', Date.now() - started, msg);
        this.sentinel.recordCapturedError(`init:${label}`, err);
        return false;
      }
    }

    async executeBootSequence() {
      if (this.hasBooted && this.bootPromise) return this.bootPromise;
      this.bootPromise = this.runPhasesSequentially();
      return this.bootPromise;
    }

    async runPhasesSequentially() {
      this.sentinel.attachGlobalHandlers();

      // PHA 1: Hạt nhân UI, Lưu trữ IndexedDB, Router API & Cấu hình Prompt 5 chế độ
      await this.invokeModuleInitSafe('mod02_models', NS.modelAdvisor, 'init');
      await this.invokeModuleInitSafe('mod03_uiUtils', NS.uiUtils, 'init');
      await this.invokeModuleInitSafe('mod04_idb', NS.idb, 'init');
      await this.invokeModuleInitSafe('mod05_localFs', NS.fsEngine, 'init');
      await this.invokeModuleInitSafe('mod14_sysPrompts', NS.sysPrompts, 'init');
      await this.invokeModuleInitSafe('mod15_geminiRouter', NS.geminiRouter, 'init');

      // PHA 2: Nạp cây chương từ IndexedDB, dựng chỉ mục BM25 RAG & Kho Phiên Bản Tab 6
      await this.invokeModuleInitSafe('mod08_chapterManager', NS.chapterManager, 'init');
      this.rebuildRagAndRefreshBadgesAfterChapters();
      await this.invokeModuleInitSafe('mod09_autoSaver', NS.autoSaver, 'init');
      await this.invokeModuleInitSafe('mod10_versionVault', NS.versionVault, 'init');

      // PHA 3: Dữ liệu Story Bible, Mốc chuyển cảnh POV & Google Docs Diff Review
      await this.invokeModuleInitSafe('mod11_aiDiff', NS.aiDiff, 'init');
      await this.invokeModuleInitSafe('mod12_storyBible', NS.storyBible, 'init');
      await this.invokeModuleInitSafe('mod13_sceneBuilder', NS.sceneBuilder, 'init');

      // PHA 4: Đường ống Prompt 2 bước, Tab 3 (5 Chế độ), Chế độ 5 SVG & Duyệt chương thông minh
      await this.invokeModuleInitSafe('mod16_promptSynthesizer', NS.promptSynthesizer, 'init');
      await this.invokeModuleInitSafe('mod17_tab3Controller', NS.tab3Controller, 'init');
      await this.invokeModuleInitSafe('mod18_mode5Studio', NS.mode5Studio, 'init');
      await this.invokeModuleInitSafe('mod19_approvalExtractor', NS.approvalExtractor, 'init');

      // PHA 5: Không gian tập trung (Pomodoro 2 chiều, Nhạc A-B, Hiệu ứng nền, Công cụ viết, Xuất sách, Mascot, Video)
      await this.invokeModuleInitSafe('mod20_pomodoro', NS.pomodoro, 'init');
      await this.invokeModuleInitSafe('mod21_audioStudio', NS.audioStudio, 'init');
      await this.invokeModuleInitSafe('mod22_ambience', NS.ambience, 'init');
      await this.invokeModuleInitSafe('mod23_editorTools', NS.editorTools, 'init');
      await this.invokeModuleInitSafe('mod24_clicheScanner', NS.clicheScanner, 'init');
      await this.invokeModuleInitSafe('mod25_webNovelFeatures', NS.webNovelFeatures, 'init');
      await this.invokeModuleInitSafe('mod26_exporter', NS.exporter, 'init');
      await this.invokeModuleInitSafe('mod27_mascotAndChat', NS.mascotAndChat, 'init');
      await this.invokeModuleInitSafe('mod28_tutorialAndChangelog', NS.tutorialAndChangelog, 'init');

      // PHA 6: Điều hướng 6 màn hình, Danh mục Tính năng (Mod 31), Nền & Argon (Mod 32), Bảo chứng (Mod 33), Báo lỗi (Mod 34), Credits (Mod 35), Khiên Reload (Mod 36), Xuất kết quả làm việc (Mod 37), Xưởng Cục Bộ & Điểm danh (Mod 38)
      await this.invokeModuleInitSafe('mod29_navigator', NS.navigator, 'init');
      await this.invokeModuleInitSafe('mod31_featureDirectory', NS.featureDirectory, 'init');
      await this.invokeModuleInitSafe('mod32_argonAndStageEngine', NS.argonAndStageEngine, 'init');
      await this.invokeModuleInitSafe('mod33_connectionAndVoiceStudio', NS.connectionAndVoiceStudio, 'init');
      await this.invokeModuleInitSafe('mod34_bugReport', NS.bugReport, 'init');
      await this.invokeModuleInitSafe('mod35_authorCredits', NS.authorCredits, 'init');
      await this.invokeModuleInitSafe('mod36_zeroReloadShield', NS.zeroReloadShield, 'init');
      await this.invokeModuleInitSafe('mod37_workspaceSync', NS.workspaceSync, 'init');
      await this.invokeModuleInitSafe('mod38_localComputeAndAttendance', NS.localComputeAndAttendance, 'init');
      await this.invokeModuleInitSafe('mod39_youtubeStudio', NS.youtubeStudio, 'init');
      await this.invokeModuleInitSafe('mod40_youtubeMotionBg', NS.youtubeMotionBg, 'init');
      await this.invokeModuleInitSafe('mod41_guestMode', NS.guestMode, 'init');
      await this.invokeModuleInitSafe('mod42_worldClockStudio', NS.worldClockStudio, 'init');
      await this.invokeModuleInitSafe('mod43_weatherSkyEngine', NS.weatherSkyEngine, 'init');
      await this.invokeModuleInitSafe('mod44_siteTrafficAnalytics', NS.siteTrafficAnalytics, 'init');
      await this.invokeModuleInitSafe('systemFontScale', NS.systemFontScale, 'init');
      await this.invokeModuleInitSafe('miscFunHub', NS.miscFunHub, 'init');

      const startedBridge = Date.now();
      const bridgeSummary = this.bridgeBinder.bindAllMissingBridges();
      this.telemetry.recordStep(
        'mod30_bridges',
        'OK',
        Date.now() - startedBridge,
        `Đã gắn ${bridgeSummary.boundCount} cầu nối sự kiện`
      );

      // Gọi lại đồng bộ giao diện phụ thuộc dữ liệu chương sau khi toàn bộ UI đã sẵn sàng
      this.postBootSynchronizationPass();

      const startedSw = Date.now();
      await this.swCoordinator.registerSafely();
      this.telemetry.recordStep('mod30_serviceWorker', 'OK', Date.now() - startedSw, this.swCoordinator.status);

      this.hasBooted = true;
      this.telemetry.markBootCompleted();

      if (NS.bus?.emit && NS.constants?.EVENTS?.BOOT_COMPLETE) {
        NS.bus.emit(NS.constants.EVENTS.BOOT_COMPLETE, {
          totalBootMs: this.telemetry.getTotalBootMs(),
          bridgeCount: bridgeSummary.boundCount,
        });
      }

      return this.telemetry.getSummaryReport();
    }

    rebuildRagAndRefreshBadgesAfterChapters() {
      try {
        const chapters = Array.isArray(NS.chapterManager?.chapters) ? NS.chapterManager.chapters : [];
        NS.rag?.rebuildIndexFromChapters?.(chapters);
        NS.rag?.renderSearchResultsUI?.('');
        NS.chapterManager?.renderChapterTreeAndQuickSwitcher?.();
        NS.chapterManager?.updateActiveStatusBadgeUI?.();
      } catch (err) {
        this.sentinel.recordCapturedError('postChapterRagRebuild', err);
      }
    }

    postBootSynchronizationPass() {
      try {
        NS.geminiRouter?.populateAllModelDropdowns?.();
        NS.pomodoro?.syncAllViews?.();
        NS.sceneBuilder?.liveBadgeBridge?.refreshAllCommandBadges?.();
        NS.webNovelFeatures?.updateDailyGoalFromActiveProject?.();
        NS.tab3Controller?.renderCurrentActiveModeView?.();
        NS.versionVault?.renderVersionListUI?.();
        NS.navigator?.autoHealLayout?.();
      } catch (err) {
        this.sentinel.recordCapturedError('postBootSyncPass', err);
      }
    }
  }

  /**
   * Trình kiểm tra và phục hồi trạng thái dữ liệu khởi tạo (Schema Migration & Consistency Healer)
   * đảm bảo dữ liệu cũ từ các phiên bản trước khi nạp lên v38.0 vẫn hoàn toàn tương thích.
   */
  class WorkspaceSchemaMigrationAndHealer {
    inspectAndHealWorkspaceIntegrity() {
      const actionsTaken = [];

      // 1. Bảo đảm mảng chương và chương đang mở luôn hợp lệ
      const chapMgr = NS.chapterManager;
      if (chapMgr && Array.isArray(chapMgr.chapters)) {
        if (chapMgr.chapters.length > 0 && !chapMgr.activeChapterId) {
          chapMgr.activeChapterId = chapMgr.chapters[0].id;
          actionsTaken.push('Khôi phục activeChapterId về chương đầu tiên hợp lệ');
        }
        chapMgr.chapters.forEach((ch, idx) => {
          if (!ch.displayTitle && ch.title) {
            ch.displayTitle = ch.title;
            actionsTaken.push(`Chuẩn hóa displayTitle cho chương #${idx + 1}`);
          }
          if (!ch.status || (ch.status !== 'DRAFT' && ch.status !== 'APPROVED')) {
            ch.status = 'DRAFT';
            actionsTaken.push(`Đặt lại trạng thái DRAFT chuẩn cho chương #${idx + 1}`);
          }
        });
      }

      // 2. Bảo đảm tên mô hình đã chọn thuộc danh mục up-to-date hiện hành
      const catalogIds = new Set(
        Array.isArray(NS.models) ? NS.models.map((m) => m.id || m.modelId) : []
      );
      const selectedModel = NS.geminiRouter?.selectedModelId;
      if (selectedModel && catalogIds.size > 0 && !catalogIds.has(selectedModel)) {
        const fallbackModel = 'gemini-3.8-flash';
        NS.geminiRouter?.setSelectedModel?.(fallbackModel);
        actionsTaken.push(`Chuyển mô hình không còn hỗ trợ (${selectedModel}) sang ${fallbackModel}`);
      }

      // 3. Bảo đảm khung tiêu đề Tab 1 đồng bộ với tiêu đề chương hiện hành
      if (typeof document !== 'undefined' && chapMgr?.getActiveChapter) {
        const active = chapMgr.getActiveChapter();
        const titleInput = document.getElementById('input-chapter-title');
        if (active && titleInput && !titleInput.value && (active.displayTitle || active.title)) {
          titleInput.value = active.displayTitle || active.title;
          actionsTaken.push('Đồng bộ lại tên chương lên thanh tiêu đề Tab 1');
        }
      }

      return {
        healedCount: actionsTaken.length,
        actionsTaken,
        checkedAt: new Date().toISOString(),
      };
    }

    collectWorkspaceContentMetrics() {
      const chapters = Array.isArray(NS.chapterManager?.chapters) ? NS.chapterManager.chapters : [];
      const countWords =
        NS.uiUtils?.countVietnameseWords ||
        ((t) =>
          String(t || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean).length);

      let totalWords = 0;
      let approvedChapters = 0;
      let draftChapters = 0;

      for (const ch of chapters) {
        totalWords += countWords(ch?.content || '');
        if (ch?.status === 'APPROVED') approvedChapters += 1;
        else draftChapters += 1;
      }

      const bibleChars = Array.isArray(NS.storyBible?.characters)
        ? NS.storyBible.characters.length
        : 0;
      const cluesCount = Array.isArray(NS.storyBible?.cluesLedger)
        ? NS.storyBible.cluesLedger.length
        : 0;
      const versionSnapshots = Array.isArray(NS.versionVault?.versions)
        ? NS.versionVault.versions.length
        : 0;
      const ragChunksCount = Array.isArray(NS.rag?.chunks) ? NS.rag.chunks.length : 0;

      return {
        chapterCount: chapters.length,
        approvedChapters,
        draftChapters,
        totalWords,
        bibleCharactersCount: bibleChars,
        cluesLedgerCount: cluesCount,
        versionSnapshotsCount: versionSnapshots,
        ragChunksCount,
        selectedAiModel: NS.geminiRouter?.selectedModelId || 'gemini-3.8-flash',
      };
    }
  }

  /**
   * Trình ghi vết sự kiện Event Bus phục vụ gỡ lỗi luồng giao tiếp giữa 30 module.
   */
  class EventBusActivityTracer {
    constructor(maxHistory = 60) {
      this.maxHistory = maxHistory;
      this.eventsLog = [];
      this.attached = false;
    }

    attachToEventBus() {
      if (this.attached || !NS.bus?.on || !NS.constants?.EVENTS) return;
      this.attached = true;
      const watchedEvents = Object.values(NS.constants.EVENTS);
      watchedEvents.forEach((eventName) => {
        if (!eventName || typeof eventName !== 'string') return;
        NS.bus.on(eventName, (payload) => {
          this.eventsLog.push({
            eventName,
            timestamp: Date.now(),
            hasPayload: payload !== undefined && payload !== null,
          });
          if (this.eventsLog.length > this.maxHistory) {
            this.eventsLog.shift();
          }
        });
      });
    }

    getRecentActivity(limit = 20) {
      return this.eventsLog.slice(-Math.max(1, limit));
    }

    getEventFrequencyMap() {
      const counts = {};
      for (const item of this.eventsLog) {
        counts[item.eventName] = (counts[item.eventName] || 0) + 1;
      }
      return counts;
    }
  }

  /**
   * Giao diện kiểm định nhanh toàn bộ 30 module & công cụ phục hồi khẩn cấp (Diagnostic Modal).
   */
  class SystemDiagnosticsInspectorModal {
    constructor(bootloaderRef) {
      this.bootloader = bootloaderRef;
      this.modalId = 'mod30-system-diagnostics-modal';
    }

    escapeSafe(val) {
      if (NS.uiUtils?.escapeHtml) return NS.uiUtils.escapeHtml(val);
      return String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    ensureModalDomElement() {
      if (typeof document === 'undefined') return null;
      let modal = document.getElementById(this.modalId);
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = this.modalId;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'hidden fixed inset-0 z-[85] bg-black/85 backdrop-blur-md flex items-start justify-center p-2 sm:p-4 overflow-y-auto';
      modal.innerHTML = `
        <div class="my-auto w-full max-w-4xl max-h-[92dvh] rounded-2xl border border-emerald-500/40 bg-zinc-900 text-zinc-100 shadow-2xl flex flex-col overflow-hidden text-xs">
          <div class="px-5 py-3.5 border-b border-zinc-800 bg-emerald-950/60 flex items-center justify-between gap-2 shrink-0">
            <div>
              <h3 class="font-extrabold uppercase text-sm text-emerald-400">🛡️ Trung Tâm Kiểm Định Toàn Vẹn 30 Module (Bootloader v38.0)</h3>
              <p class="text-[11px] text-zinc-400">Theo dõi sức khỏe từng tệp JS, DOM đa thiết bị, Pomodoro sync & phục hồi nhanh nếu có lỗi trình duyệt.</p>
            </div>
            <button type="button" id="mod30-diag-close-btn" class="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕</button>
          </div>
          <div id="mod30-diag-body" class="p-4 overflow-y-auto flex-1 space-y-4 select-text"></div>
          <div class="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-2">
            <button type="button" id="mod30-diag-heal-btn" class="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold">🛠️ Tự Sửa Lỗi Giao Diện & Đồng Bộ</button>
            <button type="button" id="mod30-diag-refresh-btn" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">🔄 Quét Lại Hệ Thống</button>
          </div>
        </div>
      `;
      document.body?.appendChild(modal);

      document.getElementById('mod30-diag-close-btn')?.addEventListener('click', () => this.closeModal());
      document.getElementById('mod30-diag-refresh-btn')?.addEventListener('click', () => this.renderAuditReport());
      document.getElementById('mod30-diag-heal-btn')?.addEventListener('click', () => {
        this.bootloader.runEmergencySelfHeal();
        this.renderAuditReport();
      });
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) this.closeModal();
      });

      return modal;
    }

    openModal() {
      const modal = this.ensureModalDomElement();
      if (!modal) return false;
      this.renderAuditReport();
      modal.classList.remove('hidden');
      NS.modalStack?.register?.(this.modalId, () => this.closeModal());
      return true;
    }

    closeModal() {
      const modal = document.getElementById(this.modalId);
      if (modal) modal.classList.add('hidden');
      NS.modalStack?.unregister?.(this.modalId);
    }

    renderAuditReport() {
      const bodyEl = document.getElementById('mod30-diag-body');
      if (!bodyEl) return;
      const audit = this.bootloader.runIntegrityAudit();
      const metrics = this.bootloader.schemaHealer.collectWorkspaceContentMetrics();

      const summaryCards = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 rounded-xl border border-zinc-800 bg-zinc-950">
            <div class="text-[10px] text-zinc-400 uppercase font-bold">Trạng Thái Tổng Thể</div>
            <div class="text-sm font-extrabold mt-1 ${audit.healthy ? 'text-emerald-400' : 'text-rose-400'}">
              ${audit.healthy ? '✅ KHỎE MẠNH 100%' : '⚠️ CẦN KIỂM TRA'}
            </div>
          </div>
          <div class="p-3 rounded-xl border border-zinc-800 bg-zinc-950">
            <div class="text-[10px] text-zinc-400 uppercase font-bold">Module Đã Nạp</div>
            <div class="text-sm font-extrabold mt-1 text-indigo-300 font-monoCode">
              ${audit.modules.loadedCount} / ${audit.modules.totalExpected}
            </div>
          </div>
          <div class="p-3 rounded-xl border border-zinc-800 bg-zinc-950">
            <div class="text-[10px] text-zinc-400 uppercase font-bold">Xung Đột Legacy</div>
            <div class="text-sm font-extrabold mt-1 ${audit.conflictCheck.clean ? 'text-emerald-400' : 'text-rose-400'}">
              ${audit.conflictCheck.clean ? '0 Xung Đột' : `${audit.conflictCheck.legacyScriptsLoaded.length} Lỗi`}
            </div>
          </div>
          <div class="p-3 rounded-xl border border-zinc-800 bg-zinc-950">
            <div class="text-[10px] text-zinc-400 uppercase font-bold">Dữ Liệu Dự Án</div>
            <div class="text-sm font-extrabold mt-1 text-amber-300 font-monoCode">
              ${metrics.chapterCount} ch • ${NS.i18n?.formatNumber ? NS.i18n.formatNumber(metrics.totalWords) : metrics.totalWords.toLocaleString('vi-VN')} từ
            </div>
          </div>
        </div>
      `;

      const modulesGrid = `
        <div class="space-y-2">
          <div class="font-extrabold uppercase text-emerald-400 text-[11px]">📦 Trạng Thái 30 Module Chuyên Biệt:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            ${audit.modules.modules
              .map(
                (m) => `
                <div class="p-2 rounded-xl border ${
                  m.loaded ? 'border-emerald-500/30 bg-emerald-950/15' : 'border-rose-500/40 bg-rose-950/20'
                } flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-bold text-[11px] truncate">${m.index}. ${this.escapeSafe(m.label)}</div>
                    <div class="font-monoCode text-[10px] text-zinc-400 truncate">${this.escapeSafe(m.key)} • NS.${this.escapeSafe(m.nsProp)}</div>
                  </div>
                  <span class="px-1.5 py-0.5 rounded font-monoCode text-[10px] font-bold shrink-0 ${
                    m.loaded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }">${m.loaded ? 'OK' : 'MISSING'}</span>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      `;

      bodyEl.innerHTML = `${summaryCards}${modulesGrid}`;
    }
  }

  /**
   * Hỗ trợ tạo gói báo cáo chẩn đoán không chứa bí mật API Key để tác giả sao lưu hoặc đối chiếu.
   */
  class DiagnosticsReportSanitizer {
    sanitizeReportForExport(rawReport) {
      const jsonText = JSON.stringify(rawReport, null, 2);
      return jsonText
        .replace(/AIza[0-9A-Za-z\-_]{20,}/g, '[MASKED_API_KEY]')
        .replace(/AQ\.[0-9A-Za-z\-_.]{18,}/g, '[MASKED_API_KEY]');
    }
  }

  /**
   * Kiểm tra hợp đồng API công khai giữa các mô-đun cốt lõi (Contract Signature Verification).
   */
  class CrossModuleContractVerifier {
    constructor() {
      this.contracts = [
        { module: 'mod03', nsProp: 'uiUtils', requiredMethods: ['showToast', 'escapeHtml', 'countVietnameseWords'] },
        { module: 'mod04', nsProp: 'idb', requiredMethods: ['init', 'get', 'set'] },
        { module: 'mod06', nsProp: 'docParser', requiredMethods: ['parseFile', 'importMultipleFilesToChapters'] },
        { module: 'mod07', nsProp: 'rag', requiredMethods: ['rebuildIndexFromChapters', 'search', 'renderSearchResultsUI'] },
        { module: 'mod08', nsProp: 'chapterManager', requiredMethods: ['init', 'createNewChapter', 'getActiveChapter', 'renderChapterTreeAndQuickSwitcher'] },
        { module: 'mod09', nsProp: 'autoSaver', requiredMethods: ['init', 'undo', 'redo'] },
        { module: 'mod10', nsProp: 'versionVault', requiredMethods: ['init', 'createSnapshot', 'selectVersionForPreview', 'restoreSelectedVersion', 'openFullscreenStatePreviewModal'] },
        { module: 'mod11', nsProp: 'aiDiff', requiredMethods: ['init', 'applyAIOutputToManuscriptWithDiff', 'acceptAllForActiveChapter', 'rejectAllForActiveChapter'] },
        { module: 'mod12', nsProp: 'storyBible', requiredMethods: ['init', 'saveAllBibleData'] },
        { module: 'mod13', nsProp: 'sceneBuilder', requiredMethods: ['init', 'bindDomEvents'] },
        { module: 'mod14', nsProp: 'sysPrompts', requiredMethods: ['init', 'getPromptForMode', 'openModal'] },
        { module: 'mod15', nsProp: 'geminiRouter', requiredMethods: ['init', 'getApiKey', 'setSelectedModel', 'populateAllModelDropdowns', 'generateTextWithFallback'] },
        { module: 'mod16', nsProp: 'promptSynthesizer', requiredMethods: ['init', 'runStep1MasterSynthesis', 'executeStep2OfficialNovelPrompt', 'buildMasterSynthesizedPrompt'] },
        { module: 'mod17', nsProp: 'tab3Controller', requiredMethods: ['init', 'switchMode', 'copyCurrentOutput'] },
        { module: 'mod18', nsProp: 'mode5Studio', requiredMethods: ['init', 'generateDiagramAndTimeline'] },
        { module: 'mod19', nsProp: 'approvalExtractor', requiredMethods: ['init'] },
        { module: 'mod20', nsProp: 'pomodoro', requiredMethods: ['init', 'toggleStartPause', 'resetTimer', 'syncAllViews'] },
        { module: 'mod21', nsProp: 'audioStudio', requiredMethods: ['init'] },
        { module: 'mod22', nsProp: 'ambience', requiredMethods: ['init', 'toggleZenFullscreenMode'] },
        { module: 'mod23', nsProp: 'editorTools', requiredMethods: ['init', 'inspectParagraphFlow', 'auditDialogueQuoteConsistency'] },
        { module: 'mod24', nsProp: 'clicheScanner', requiredMethods: ['init', 'auditCharacterVoiceEchoes'] },
        { module: 'mod25', nsProp: 'webNovelFeatures', requiredMethods: ['init', 'updateDailyGoalFromActiveProject', 'diagnoseChapterOpeningAndHook'] },
        { module: 'mod26', nsProp: 'exporter', requiredMethods: ['init', 'openModal', 'exportPdf', 'exportDocx', 'exportTxt', 'exportShareBundle'] },
        { module: 'mod27', nsProp: 'mascotAndChat', requiredMethods: ['init', 'openChatModal', 'closeChatModal'] },
        { module: 'mod28', nsProp: 'tutorialAndChangelog', requiredMethods: ['init', 'openModal', 'closeModal'] },
        { module: 'mod29', nsProp: 'navigator', requiredMethods: ['init', 'navigateToScreen', 'getCurrentScreen', 'runResponsiveHealthReport'] },
        { module: 'mod41', nsProp: 'guestMode', requiredMethods: ['init', 'enterGuestMode', 'isActive', 'showRestrictionNotice', 'runSimulatedPreset'] },
        { module: 'mod42', nsProp: 'worldClockStudio', requiredMethods: ['init', 'openModal', 'closeModal', 'toggleModal', 'setTimezone', 'setDateFormat', 'addAlarm', 'deleteAlarm', 'refreshWeather', 'getFormattedNowSnapshot'] },
        { module: 'mod43', nsProp: 'weatherSkyEngine', requiredMethods: ['init', 'mountIntoContainer', 'onModalClosed', 'computeTimePhaseFromMinutes', 'syncRealtimeWeather', 'applyRealtimeBackground', 'applyCustomBackground', 'disableBackground', 'selfInspect'] },
        { module: 'mod44', nsProp: 'siteTrafficAnalytics', requiredMethods: ['init', 'recordVisit', 'refreshPresence', 'getSnapshot', 'renderBox', 'selfInspect'] },
      ];
    }

    verifyAllContracts() {
      const missingDetails = [];
      let totalRequiredMethods = 0;
      let presentMethods = 0;

      for (const spec of this.contracts) {
        const modObj = NS[spec.nsProp];
        for (const fnName of spec.requiredMethods) {
          totalRequiredMethods += 1;
          if (modObj && typeof modObj[fnName] === 'function') {
            presentMethods += 1;
          } else {
            missingDetails.push({
              module: spec.module,
              nsProp: spec.nsProp,
              missingMethod: fnName,
            });
          }
        }
      }

      return {
        allContractsSatisfied: missingDetails.length === 0,
        totalRequiredMethods,
        presentMethods,
        contractPassRatePct:
          totalRequiredMethods > 0
            ? Math.round((presentMethods / totalRequiredMethods) * 100)
            : 100,
        missingDetails,
      };
    }
  }

  /**
   * Kiểm tra tự động các yêu cầu đại tu giao diện & chống lỗi regression ngay trên DOM đang chạy.
   */
  class OverhaulRegressionGuardSuite {
    runUiStructureVerification() {
      if (typeof document === 'undefined') {
        return { verified: false, reason: 'no_dom' };
      }

      // 1. Bảo đảm ô Chương 2 dư thừa tại Tab 1 không tồn tại
      const hasLegacyChapter2Input = Boolean(
        document.getElementById('input-chapter-2-title') ||
        document.getElementById('chapter-2-box')
      );

      // 2. Bảo đảm Modal Duyệt & Chốt Bản Thảo (#modal-approve-chapter-smart) không còn nhúng cửa sổ đầu ra dư thừa
      const approveModal = document.getElementById('modal-approve-chapter-smart');
      const approveHasOutputTextarea = Boolean(
        approveModal && approveModal.querySelector('textarea#approve-output-preview, textarea#modal-approve-output')
      );

      // 3. Bảo đảm khung nhập câu lệnh AI (#s18-fullscreen-prompt-textarea) hiện diện ở kích thước rộng mặc định
      const cmdTextarea = document.getElementById('s18-fullscreen-prompt-textarea');
      const hasRedundantSizeButtons = Boolean(
        document.getElementById('btn-cmd-size-small') || document.getElementById('btn-cmd-size-large')
      );

      // 4. Bảo đảm Tab 3 chỉ dùng trình đơn thả xuống 5 chế độ + nút topbar hợp nhất
      const quadSelect = document.getElementById('s20-quad-tab-selector');
      const hasFiveModesInDropdown = quadSelect
        ? Array.from(quadSelect.options).length >= 5
        : false;
      const hasLegacyFourModeRightButtons = Boolean(
        document.getElementById('tab3-right-4-mode-buttons')
      );

      // 5. Bảo đảm Pomodoro có đủ 2 khung DOM để đồng bộ 2 chiều
      const tab5PomoBox = document.getElementById('s14-panel-pomodoro-box');
      const floatingPomoPill = document.getElementById('s15-floating-pomodoro-pill');

      // 6. Bảo đảm Tab 6 Version Vault & PDF Export Font/Size controls đều sẵn sàng
      const versionList = document.getElementById('version-history-list-container');
      const versionPreview = document.getElementById('version-preview-content-box');
      const pdfFontSelect = document.getElementById('export-pdf-font-family');
      const pdfSizeSelect = document.getElementById('export-pdf-font-size');

      const checks = {
        noLegacyChapter2Box: !hasLegacyChapter2Input,
        noRedundantApproveOutputWindow: !approveHasOutputTextarea,
        wideCommandPromptWithoutSizeToggles: Boolean(cmdTextarea) && !hasRedundantSizeButtons,
        tab3UnifiedFiveModesDropdown: hasFiveModesInDropdown && !hasLegacyFourModeRightButtons,
        pomodoroDualViewsPresent: Boolean(tab5PomoBox && floatingPomoPill),
        versionVaultReady: Boolean(versionList && versionPreview),
        pdfFontAndSizeSelectable: Boolean(pdfFontSelect && pdfSizeSelect),
      };

      const allPassed = Object.values(checks).every(Boolean);
      return {
        allPassed,
        checks,
      };
    }
  }

  /**
   * Gắn thanh trạng thái Kiểm định Kỹ thuật gọn nhẹ vào Tab 6 & cài đặt tổ hợp cứu hộ giao diện khẩn cấp.
   */
  class Tab6DiagnosticsBarAndEmergencyHotkey {
    constructor(bootloaderRef) {
      this.bootloader = bootloaderRef;
    }

    mountTab6HealthFooter() {
      // Bộ kiểm định 39 Module chạy nền thầm lặng; ẩn thẻ thống kê kỹ thuật khỏi giao diện Tab 6.
      if (typeof document === 'undefined') return null;
      const existing = document.getElementById('mod30-tab6-diagnostics-card');
      if (existing) existing.remove();
      return null;
    }

    _legacyMountTab6HealthFooterUnused() {
      if (typeof document === 'undefined') return null;
      const systemHost = document.querySelector('#s14-screen-6-system .max-w-6xl');
      if (!systemHost) return null;

      let card = document.getElementById('mod30-tab6-diagnostics-card');
      if (!card) {
        card = document.createElement('div');
        card.id = 'mod30-tab6-diagnostics-card';
        card.className =
          'p-4 rounded-2xl border border-emerald-500/30 bg-studioLightPanel/90 dark:bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3';
        systemHost.appendChild(card);
      }

      const audit = this.bootloader.auditor.inspectAllThirtyModules();
      card.className =
        'p-4 rounded-2xl border border-emerald-500/30 bg-studioLightPanel/90 dark:bg-zinc-900/90 space-y-2.5';
      card.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <button type="button" id="btn-toggle-tab6-mod30-diag" aria-expanded="false" class="noir-collapse-toggle text-left flex-1 min-w-[220px]">
            <div class="font-extrabold text-xs text-emerald-400">
              🛡️ Kiến Trúc Thuần Khiết ${audit.totalExpected} Module — Đang Nạp ${audit.loadedCount}/${audit.totalExpected} Module An Toàn <span class="noir-collapse-arrow">▾</span>
            </div>
          </button>
        </div>
        <div id="mod30-diag-collapsible-body" class="hidden flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-500/20">
          <div class="text-[11px] text-zinc-400">
            Mẹo cứu hộ khẩn cấp: Nhấn <kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-monoCode">Ctrl+Shift+Alt+R</kbd> bất cứ lúc nào để dọn màn hình chờ kẹt và làm mới bố cục.
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" id="mod30-btn-open-diagnostics" class="px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs transition">
              🩺 Mở Kiểm Định Hệ Thống
            </button>
            <button type="button" id="mod30-btn-self-heal-ui" class="px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs transition">
              🛠️ Làm Mới Đồng Bộ
            </button>
          </div>
        </div>
      `;

      const toggleMod30DiagBtn = document.getElementById('btn-toggle-tab6-mod30-diag');
      const bodyMod30Diag = document.getElementById('mod30-diag-collapsible-body');
      if (toggleMod30DiagBtn && bodyMod30Diag && !toggleMod30DiagBtn.dataset.mod30Bound) {
        toggleMod30DiagBtn.dataset.mod30Bound = '1';
        toggleMod30DiagBtn.addEventListener('click', () => {
          const collapsed = !bodyMod30Diag.classList.contains('hidden');
          bodyMod30Diag.classList.toggle('hidden', collapsed);
          toggleMod30DiagBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        });
      }

      const openDiagBtn = document.getElementById('mod30-btn-open-diagnostics');
      if (openDiagBtn && !openDiagBtn.dataset.mod30Bound) {
        openDiagBtn.dataset.mod30Bound = '1';
        openDiagBtn.addEventListener('click', () => this.bootloader.openDiagnosticsModal());
      }

      const healBtn = document.getElementById('mod30-btn-self-heal-ui');
      if (healBtn && !healBtn.dataset.mod30Bound) {
        healBtn.dataset.mod30Bound = '1';
        healBtn.addEventListener('click', () => {
          this.bootloader.runEmergencySelfHeal();
          NS.uiUtils?.showToast?.('Đã làm mới toàn bộ bộ nhớ đệm giao diện và đồng bộ mô hình.', 'success');
        });
      }

      return card;
    }

    attachEmergencyHotkey() {
      if (typeof document === 'undefined' || document.__mod30EmergencyHotkeyBound) return;
      document.__mod30EmergencyHotkeyBound = true;
      document.addEventListener('keydown', (ev) => {
        if (ev.ctrlKey && ev.shiftKey && ev.altKey && (ev.key === 'r' || ev.key === 'R')) {
          ev.preventDefault();
          this.bootloader.runEmergencySelfHeal();
          NS.uiUtils?.showToast?.('Đã chạy Phục Hồi Khẩn Cấp giao diện Studio!', 'success');
        }
      });
    }
  }

  /**
   * Trình dọn dẹp kho lưu trữ trình duyệt cũ thừa thãi an toàn (không chạm dữ liệu truyện).
   */
  class LegacyCacheHygieneHelper {
    inspectDeprecatedLocalKeys() {
      if (typeof localStorage === 'undefined') return { deprecatedKeys: [] };
      const deprecatedPrefixes = ['stage16_legacy_', 'stage17_tmp_', 'stage18_old_'];
      const found = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && deprecatedPrefixes.some((p) => key.startsWith(p))) {
          found.push(key);
        }
      }
      return { deprecatedKeys: found };
    }

    cleanDeprecatedTempKeysOnly() {
      const { deprecatedKeys } = this.inspectDeprecatedLocalKeys();
      deprecatedKeys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch (_err) {
          // Không cản trở khởi động
        }
      });
      return deprecatedKeys.length;
    }
  }

  /**
   * Đánh giá khả năng phần cứng & API trình duyệt tại thời điểm khởi động (Desktop / Mobile WebView).
   */
  class PreFlightEnvironmentCapabilitiesMatrix {
    probeCapabilities() {
      const storageWriteOk = this.testLocalStorageRoundTrip();
      return {
        userAgentCompact:
          typeof navigator !== 'undefined' ? String(navigator.userAgent || '').slice(0, 110) : 'server',
        indexedDbAvailable: typeof indexedDB !== 'undefined',
        localStorageWritable: storageWriteOk,
        fileSystemAccessApi:
          typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function',
        webAudioAvailable:
          typeof window !== 'undefined' &&
          Boolean(window.AudioContext || window.webkitAudioContext),
        speechSynthesisAvailable:
          typeof window !== 'undefined' && 'speechSynthesis' in window,
        serviceWorkerAvailable:
          typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
        canvas2dSupported: this.testCanvas2dSupport(),
        webCryptoSubtleAvailable:
          typeof crypto !== 'undefined' && Boolean(crypto.subtle),
      };
    }

    testLocalStorageRoundTrip() {
      try {
        if (typeof localStorage === 'undefined') return false;
        const probeKey = '__noir_v38_storage_probe__';
        localStorage.setItem(probeKey, '1');
        const val = localStorage.getItem(probeKey);
        localStorage.removeItem(probeKey);
        return val === '1';
      } catch (_err) {
        return false;
      }
    }

    testCanvas2dSupport() {
      try {
        if (typeof document === 'undefined') return false;
        const c = document.createElement('canvas');
        return Boolean(c && typeof c.getContext === 'function' && c.getContext('2d'));
      } catch (_err) {
        return false;
      }
    }
  }

  /**
   * Trình kiểm tra xung đột CSS / Biến toàn cục hoặc phần tử giao diện bị kẹt bất thường.
   */
  class UiOverlayStuckGuard {
    detectHiddenBlockers() {
      if (typeof document === 'undefined') return { blocked: false, blockers: [] };
      const blockingLoader = document.getElementById('global-ai-blocking-loader');
      const loaderActive = Boolean(blockingLoader && !blockingLoader.classList.contains('hidden'));
      const openModals = Array.from(
        document.querySelectorAll('[id^="modal-"]:not(.hidden)')
      ).map((el) => el.id);

      return {
        loaderActive,
        openModalIds: openModals,
        blocked: loaderActive && openModals.length === 0,
      };
    }

    clearStuckOverlayStates() {
      if (typeof document === 'undefined') return 0;
      let cleared = 0;
      const loader = document.getElementById('global-ai-blocking-loader');
      if (loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
        cleared += 1;
      }
      if (NS.uiUtils?.hideBlockingLoader) {
        try {
          NS.uiUtils.hideBlockingLoader();
        } catch (_err) {
          // Bỏ qua nếu uiUtils chưa gắn hoàn tất
        }
      }
      return cleared;
    }
  }

  /**
   * Bảng điều phối lưu trữ tạm trước khi đóng/tải lại trang để tránh thất thoát dữ liệu chương đang gõ.
   */
  class PageUnloadEmergencySyncGuard {
    constructor() {
      this.attached = false;
    }

    attachBeforeUnloadHook() {
      if (typeof window === 'undefined' || this.attached) return;
      this.attached = true;

      window.addEventListener('pagehide', () => this.performFastSynchronousSave());
      window.addEventListener('beforeunload', () => this.performFastSynchronousSave());
    }

    performFastSynchronousSave() {
      try {
        NS.chapterManager?.syncEditorToActiveChapter?.();
        const chapters = Array.isArray(NS.chapterManager?.chapters) ? NS.chapterManager.chapters : [];
        if (chapters.length > 0 && typeof localStorage !== 'undefined') {
          const activeChap = NS.chapterManager?.getActiveChapter?.() || chapters[0];
          if (activeChap) {
            localStorage.setItem(
              'noir_v38_last_unload_rescue_chap',
              JSON.stringify({
                id: activeChap.id,
                title: activeChap.displayTitle || activeChap.title || '',
                content: String(activeChap.content || '').slice(0, 120000),
                savedAtIso: new Date().toISOString(),
              })
            );
          }
        }
        NS.pomodoro?.snapshotFocusRecovery?.('page_unload');
      } catch (_err) {
        // Luôn thực thi nhẹ nhàng trong handler unload
      }
    }

    readLastUnloadRescueMarker() {
      try {
        if (typeof localStorage === 'undefined') return null;
        const raw = localStorage.getItem('noir_v38_last_unload_rescue_chap');
        return raw ? JSON.parse(raw) : null;
      } catch (_err) {
        return null;
      }
    }
  }

  /**
   * Trình đồng bộ trạng thái giữa Tab 3 / Mode 5 và các thay đổi trên cây chương Tab 2.
   */
  class ReactiveCrossModuleSynchronizer {
    constructor() {
      this.attached = false;
    }

    attachCrossModuleListeners() {
      if (this.attached || !NS.bus?.on || !NS.constants?.EVENTS) return;
      this.attached = true;
      const E = NS.constants.EVENTS;

      if (E.SCREEN_CHANGED) {
        NS.bus.on(E.SCREEN_CHANGED, (payload) => {
          if (payload?.screenId === 'SCREEN_6_SYSTEM') {
            NS.bootloader?.tab6CardInjector?.mountTab6HealthFooter?.();
          }
        });
      }

      if (E.CHAPTER_CHANGED) {
        NS.bus.on(E.CHAPTER_CHANGED, () => {
          NS.webNovelFeatures?.updateDailyGoalFromActiveProject?.();
          NS.sceneBuilder?.liveBadgeBridge?.refreshAllCommandBadges?.();
        });
      }

      if (E.BIBLE_UPDATED) {
        NS.bus.on(E.BIBLE_UPDATED, () => {
          NS.sceneBuilder?.liveBadgeBridge?.refreshAllCommandBadges?.();
        });
      }
    }
  }

  /**
   * Bộ điều khiển Màn hình Khởi động Bắt buộc Kết nối API Key (xác thực Flash-Lite thấp nhất)
   * và Chọn Thư mục Làm việc Ổ cứng / Thiết bị trước khi được phép vào Web / App.
   */
  class EntryConnectionGateController {
    constructor() {
      this.hasInitialized = false;
      this.isVerifying = false;
      this.isManuallyOpened = false;
      this._hasUnlockedStudio = false;
      this.autoVerifyTimer = null;
      this._lastAutoVerifiedInput = '';
      this.lastVerifyError = '';
      this.lastFolderError = '';
      this._queuedVerifyKey = '';
    }

    getEls() {
      if (typeof document === 'undefined') return {};
      return {
        gate: document.getElementById('app-entry-connection-gate'),
        studioLink: document.getElementById('btn-gate-open-google-studio'),
        keyInput: document.getElementById('gate-input-gemini-api-key'),
        toggleKeyBtn: document.getElementById('btn-gate-toggle-apikey'),
        keyStatus: document.getElementById('gate-apikey-status'),
        reconnectFolderBtn: document.getElementById('btn-gate-reconnect-last-folder'),
        pickFolderBtn: document.getElementById('btn-gate-pick-workspace-folder'),
        mobileWebkitInput: document.getElementById('gate-mobile-folder-picker-input'),
        folderStatus: document.getElementById('gate-folder-status'),
        folderNameEl: document.getElementById('gate-folder-name'),
        step1Badge: document.getElementById('gate-step1-badge'),
        step2Badge: document.getElementById('gate-step2-badge'),
        overallBadge: document.getElementById('gate-overall-lock-badge'),
        chkHasKey: document.getElementById('gate-check-has-key'),
        chkFlashVerified: document.getElementById('gate-check-flashlite-verified'),
        chkFolderSelected: document.getElementById('gate-check-folder-selected'),
        lockSummaryHint: document.getElementById('gate-lock-summary-hint'),
        enterBtn: document.getElementById('btn-gate-enter-studio'),
        supportBiQrBtn: document.getElementById('btn-gate-support-bi-qr'),
      };
    }

    getGateStatus() {
      const router = NS.geminiRouter;
      const fs = NS.fsEngine;
      const activeKey = router?.getEffectiveActiveKey?.() || router?.getApiKey?.() || '';
      const hasKey = Boolean(activeKey && activeKey.trim().length >= 8);
      const flashLiteVerified = Boolean(
        hasKey && router?.isCurrentKeyFlashLiteVerified?.()
      );
      const folderSelected = Boolean(fs?.isConnected?.());
      const canEnter = hasKey && flashLiteVerified && folderSelected;
      return {
        hasKey,
        flashLiteVerified,
        folderSelected,
        canEnter,
        activeKey,
        folderName: fs?.getConnectedFolderName?.() || '',
        hasPendingReconnect: Boolean(fs?.hasPendingReconnectHandle?.()),
        pendingFolderName: fs?.getPendingFolderName?.() || '',
        isDesktopFsSupported: Boolean(fs?.isSupported?.()),
        fallbackModeActive: Boolean(fs?.fallbackModeActive),
        lastConnectError: fs?.lastConnectError || '',
      };
    }

    setBackgroundLocked(locked) {
      if (typeof document === 'undefined' || !document.body) return;
      document.body.dataset.appGateLocked = locked ? 'true' : 'false';
      const backgroundTargets = [
        document.querySelector('header'),
        document.getElementById('app-main-workspace'),
        document.getElementById('mobile-bottom-nav'),
        document.getElementById('s15-floating-pomodoro-pill'),
        document.getElementById('s15-floating-audio-pill'),
        document.getElementById('s11-mascot-bi-corner'),
      ];
      backgroundTargets.forEach((el) => {
        if (!el) return;
        try {
          if (locked) {
            el.setAttribute('inert', '');
            el.setAttribute('aria-hidden', 'true');
            el.classList.add('pointer-events-none', 'select-none');
          } else {
            el.removeAttribute('inert');
            el.removeAttribute('aria-hidden');
            el.classList.remove('pointer-events-none', 'select-none');
          }
        } catch (_e) {
          // Bỏ qua trên trình duyệt không hỗ trợ thuộc tính inert
        }
      });
    }

    applyChecklistPill(el, ok, okText, pendingText) {
      if (!el) return;
      const tr = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      el.textContent = ok ? `✅ ${tr(okText)}` : `⬜ ${tr(pendingText)}`;
      el.className = ok
        ? 'px-2.5 py-1.5 rounded-xl border border-emerald-500/45 bg-emerald-500/15 text-emerald-300 font-bold text-[11px]'
        : 'px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold text-[11px]';
    }

    refreshUI() {
      const els = this.getEls();
      if (!els.gate) return;
      const st = this.getGateStatus();

      if (els.keyInput && document.activeElement !== els.keyInput && st.activeKey) {
        if (els.keyInput.value !== st.activeKey) {
          els.keyInput.value = st.activeKey;
        }
      }

      this.applyChecklistPill(
        els.chkHasKey,
        st.hasKey,
        '1. Đã có API Key Gemini',
        '1. Chưa có API Key Gemini'
      );
      this.applyChecklistPill(
        els.chkFlashVerified,
        st.flashLiteVerified,
        '2. Đã xác thực Flash-Lite',
        '2. Chờ xác thực Flash-Lite'
      );
      this.applyChecklistPill(
        els.chkFolderSelected,
        st.folderSelected,
        '3. Đã nối thư mục làm việc',
        '3. Chưa chọn thư mục làm việc'
      );

      const tr = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      const esc =
        NS.uiUtils?.escapeHtml ||
        ((s) =>
          String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;'));

      if (els.keyStatus && !this.isVerifying) {
        const rec = NS.geminiRouter?.loadFlashLiteVerificationRecord?.();
        if (!st.hasKey) {
          els.keyStatus.innerHTML =
            '<span class="text-amber-300">Chưa có Gemini API Key. Hãy bấm nút Google Studio ở trên để lấy mã rồi dán vào đây.</span>';
        } else if (st.flashLiteVerified && rec) {
          const viaPart = rec.transportType ? ` · ${rec.transportType}` : '';
          const verifiedPlain = tr(
            `✅ Đã xác thực tự động thành công qua mô hình ${rec.modelEndpoint} (${rec.latencyMs || 0}ms${viaPart}).`
          );
          els.keyStatus.innerHTML = `<span data-i18n-ignore="true" class="text-emerald-300 font-bold">${esc(verifiedPlain)}</span>`;
        } else if (this.lastVerifyError) {
          els.keyStatus.innerHTML = `<span data-i18n-ignore="true" class="text-rose-300 font-bold">❌ ${esc(
            tr(this.lastVerifyError)
          )}</span>`;
        } else {
          els.keyStatus.innerHTML =
            '<span class="text-rose-300 font-semibold">⚠️ API Key chưa xác thực thành công. Hãy kiểm tra lại mã khóa rồi dán lại vào ô trên để hệ thống tự động kiểm tra.</span>';
        }
      }

      if (els.reconnectFolderBtn) {
        if (!st.folderSelected && st.hasPendingReconnect && st.pendingFolderName) {
          els.reconnectFolderBtn.classList.remove('hidden');
          els.reconnectFolderBtn.dataset.i18nIgnore = '1';
          els.reconnectFolderBtn.textContent = tr(
            `🔓 Mở Lại Thư Mục Đã Nhớ: "${st.pendingFolderName}" (1 chạm)`
          );
        } else {
          els.reconnectFolderBtn.classList.add('hidden');
        }
      }

      if (els.pickFolderBtn) {
        delete els.pickFolderBtn.dataset.i18nIgnore;
        els.pickFolderBtn.textContent = tr(
          st.isDesktopFsSupported
            ? st.folderSelected
              ? '🔄 Đổi thư mục làm việc khác...'
              : st.hasPendingReconnect
              ? '📁 Hoặc Chọn Thư Mục Ổ Cứng Khác...'
              : '📂 Chọn Thư Mục Làm Việc Trên Máy Tính'
            : '📱 Chọn Thư Mục Trên Thiết Bị / Di Động'
        );
      }

      if (els.step1Badge) {
        els.step1Badge.textContent = st.flashLiteVerified
          ? 'Đã xác thực'
          : st.hasKey
          ? 'Chờ Flash-Lite'
          : 'Chưa xác thực';
        els.step1Badge.className = st.flashLiteVerified
          ? 'px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/45 text-emerald-300 font-bold text-[10px]'
          : 'px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold text-[10px]';
      }
      if (els.step2Badge) {
        if (st.folderSelected) {
          els.step2Badge.dataset.i18nIgnore = '1';
          els.step2Badge.textContent = tr(`Đã nối: ${st.folderName}`);
        } else {
          delete els.step2Badge.dataset.i18nIgnore;
          els.step2Badge.textContent = 'Chưa chọn thư mục';
        }
        els.step2Badge.className = st.folderSelected
          ? 'px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/45 text-emerald-300 font-bold text-[10px] truncate max-w-[180px]'
          : 'px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold text-[10px]';
      }
      if (els.overallBadge) {
        els.overallBadge.textContent = tr(
          st.canEnter
            ? '✅ Đủ điều kiện — Sẵn sàng vào Studio'
            : '🔒 Đang khóa — Chờ đủ điều kiện'
        );
        els.overallBadge.className = st.canEnter
          ? 'px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-extrabold text-[11px]'
          : 'px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-extrabold text-[11px]';
      }

      if (els.folderStatus) {
        const displayFolderLabel = st.folderSelected
          ? st.folderName
          : st.pendingFolderName
          ? tr(`Đã nhớ từ lần trước: ${st.pendingFolderName}`)
          : tr('Chưa chọn');
        const effectiveErr = this.lastFolderError || st.lastConnectError;
        const isDiskHandleActive = Boolean(NS.fsEngine?.rootDirHandle);
        let statusMsg = '';
        if (st.folderSelected) {
          const msgText = isDiskHandleActive
            ? tr(`✅ Đã kết nối thư mục làm việc: ${st.folderName} (${tr('Đọc/Ghi trực tiếp ổ cứng')}).`)
            : tr(`✅ Đã kết nối thư mục làm việc: ${st.folderName}.`);
          statusMsg = `<span data-i18n-ignore="true" class="text-emerald-300 font-bold">${esc(msgText)}</span>`;
        } else if (effectiveErr) {
          statusMsg = `<span data-i18n-ignore="true" class="text-rose-300 font-bold">❌ ${esc(
            tr(effectiveErr)
          )}</span>`;
        } else if (st.hasPendingReconnect && st.pendingFolderName) {
          statusMsg = `<span data-i18n-ignore="true" class="text-amber-300 font-semibold">${esc(
            tr(
              `💾 Đã tự ghi nhớ thư mục từ lần trước: ${st.pendingFolderName}. Hãy bấm nút "🔓 Mở Lại Thư Mục Đã Nhớ" ở trên để cấp quyền ghi tiếp!`
            )
          )}</span>`;
        } else if (st.isDesktopFsSupported) {
          statusMsg =
            '<span class="text-amber-300">Chưa chọn thư mục ổ cứng (nên chọn thư mục con riêng như D:\\TruyenCuaBi để tránh trình duyệt chặn thư mục hệ thống Desktop/Documents).</span>';
        } else {
          statusMsg =
            '<span class="text-sky-300">Thiết bị di động: hãy bấm nút chọn thư mục ở trên để kết nối và đồng bộ dữ liệu cho những lần làm việc sau.</span>';
        }
        const folderPrefix = tr('Thư mục:');
        els.folderStatus.innerHTML = `${statusMsg}<div id="gate-folder-name" data-i18n-ignore="true" class="mt-1 font-monoCode text-[10px] text-zinc-400">${esc(
          `${folderPrefix} ${displayFolderLabel}`
        )}</div>`;
        NS.i18n?.translateElement?.(els.folderStatus);
      }

      if (els.enterBtn) {
        els.enterBtn.disabled = !st.canEnter;
        if (st.canEnter) {
          els.enterBtn.className =
            'w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-300 font-extrabold text-xs sm:text-sm cursor-pointer transition flex items-center justify-center gap-2 shrink-0 noir-gate-ready-pulse';
          els.enterBtn.textContent = tr('✅ Xác Nhận Đã Kết Nối — Vào Chế Độ Chính ➔');
        } else {
          els.enterBtn.className =
            'w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-rose-950/90 text-rose-200 border-2 border-rose-500/75 font-extrabold text-xs sm:text-sm cursor-not-allowed transition flex items-center justify-center gap-2 shrink-0';
          els.enterBtn.textContent = tr('⛔ Chưa Đủ Điều Kiện — Hoàn Tất Kết Nối Để Vào Chế Độ Chính');
        }
      }

      if (els.lockSummaryHint) {
        if (st.canEnter) {
          els.lockSummaryHint.innerHTML = `<span class="text-emerald-300 font-bold">${esc(
            tr('✅ Key API & Thư mục làm việc đã được nạp sẵn từ phiên trước và liên kết đồng bộ cho Tab 3, Duyệt thông minh & Chatbot Bi Số 8. Hãy kiểm tra lại rồi bấm nút xanh bên dưới để vào Studio.')
          )}</span>`;
        } else {
          const missing = [];
          if (!st.hasKey) missing.push(tr('nhập Gemini API Key'));
          else if (!st.flashLiteVerified) missing.push(tr('xác thực API Key qua Gemini Flash-Lite'));
          if (!st.folderSelected) missing.push(tr('chọn thư mục làm việc'));
          const sep = NS.i18n?.getLanguage?.()?.startsWith('zh') || NS.i18n?.getLanguage?.() === 'ja' ? ' + ' : ' + ';
          els.lockSummaryHint.innerHTML = `<span data-i18n-ignore="true" class="text-amber-300">${esc(
            tr(`🔒 Còn thiếu: ${missing.join(sep)}. Chỉ khi đủ cả 3 bước bạn mới được vào ứng dụng.`)
          )}</span>`;
        }
      }

      if (els.gate && NS.i18n?.translateElement) {
        NS.i18n.translateElement(els.gate);
      }
    }

    async runAutoFlashLiteVerify(rawKeyInput = null) {
      clearTimeout(this.autoVerifyTimer);
      const router = NS.geminiRouter;
      const els = this.getEls();
      if (!router) return { ok: false };
      const candidate = router.vaultMgr.sanitizeKeyString(
        rawKeyInput !== null ? rawKeyInput : els.keyInput?.value || router.getEffectiveActiveKey()
      );
      if (!candidate) {
        this.lastVerifyError = '';
        this._queuedVerifyKey = '';
        router.saveApiKey('');
        this.refreshUI();
        return { ok: false, empty: true };
      }

      if (this.isVerifying) {
        this._queuedVerifyKey = candidate;
        return { ok: false, queued: true };
      }

      this.isVerifying = true;
      this.lastVerifyError = '';
      this._queuedVerifyKey = '';
      if (els.keyStatus) {
        els.keyStatus.innerHTML =
          '<span class="text-sky-300 font-semibold">⏳ Đang tự động kiểm tra API Key với mô hình Gemini Flash-Lite thấp nhất (hỗ trợ cả AIza... & AQ....)...</span>';
      }

      try {
        const res = await router.verifyKeyWithLowestFlashLite(candidate, {
          autoSave: true,
          emitEvents: true,
        });
        this._lastAutoVerifiedInput = candidate;
        this.lastVerifyError = res.ok
          ? ''
          : String(res.message || 'Xác thực Flash-Lite thất bại.');
        return res;
      } finally {
        this.isVerifying = false;
        this.refreshUI();
        const queuedNext = this._queuedVerifyKey;
        this._queuedVerifyKey = '';
        if (queuedNext && queuedNext !== candidate) {
          setTimeout(() => {
            this.runAutoFlashLiteVerify(queuedNext);
          }, 30);
        }
      }
    }

    shouldSuppressAutoGate() {
      if (NS.guestMode?.isActive?.()) return true;
      if (this._hasUnlockedStudio) return true;
      const { gate } = this.getEls();
      if (
        gate &&
        gate.classList.contains('hidden') &&
        typeof document !== 'undefined' &&
        document.body?.dataset?.appGateLocked === 'false' &&
        !this.isManuallyOpened
      ) {
        return true;
      }
      return false;
    }

    showGate(manual = false, forceInitial = false) {
      if (!manual && !forceInitial && this.shouldSuppressAutoGate()) {
        this.refreshUI();
        return;
      }
      const { gate } = this.getEls();
      this.isManuallyOpened = Boolean(manual);
      if (manual || forceInitial) {
        this._hasUnlockedStudio = false;
        if (NS.state) NS.state.entryGateUnlocked = false;
      }
      if (gate) {
        gate.classList.remove('hidden');
      }
      this.setBackgroundLocked(true);
      this.refreshUI();
    }

    openGateManual() {
      this._hasUnlockedStudio = false;
      this.showGate(true);
    }

    unlockAndEnterStudio() {
      const st = this.getGateStatus();
      if (!st.canEnter) {
        this.refreshUI();
        NS.uiUtils?.showToast?.(
          '🔒 Bạn phải có API Key đã xác thực Flash-Lite VÀ chọn thư mục làm việc trước khi vào Studio!',
          'warning',
          4000
        );
        return false;
      }
      const { gate } = this.getEls();
      this.isManuallyOpened = false;
      this._hasUnlockedStudio = true;
      if (NS.state) NS.state.entryGateUnlocked = true;
      if (gate) {
        gate.classList.add('hidden');
      }
      this.setBackgroundLocked(false);
      this.refreshUI();
      NS.bus?.emit?.('gate:unlocked', st);
      NS.navigator?.runResponsiveHealthReport?.();
      NS.uiUtils?.showToast?.(
        `✅ Chào mừng trở lại! Đã nối thư mục "${st.folderName}" & Gemini AI sẵn sàng.`,
        'success',
        3200
      );
      return true;
    }

    bindGateEvents() {
      const els = this.getEls();
      if (!els.gate || els.gate.dataset.mod30GateBound === '1') return;
      els.gate.dataset.mod30GateBound = '1';

      if (els.supportBiQrBtn && els.supportBiQrBtn.dataset.gateQrBound !== '1') {
        els.supportBiQrBtn.dataset.gateQrBound = '1';
        els.supportBiQrBtn.addEventListener('click', () => {
          NS.authorCredits?.openVietQrDonateModal?.();
        });
      }

      if (els.toggleKeyBtn && els.keyInput) {
        els.toggleKeyBtn.addEventListener('click', () => {
          const isPwd = els.keyInput.type === 'password';
          els.keyInput.type = isPwd ? 'text' : 'password';
          els.toggleKeyBtn.textContent = isPwd ? '🙈 Ẩn' : '👁️ Hiện';
        });
      }

      if (els.keyInput) {
        const scheduleAutoVerify = (delayMs = 420) => {
          const val =
            NS.geminiRouter?.vaultMgr?.sanitizeKeyString?.(els.keyInput.value) ||
            String(els.keyInput.value || '').trim();
          this.lastVerifyError = '';
          this._lastAutoVerifiedInput = '';
          clearTimeout(this.autoVerifyTimer);
          NS.geminiRouter?.saveApiKey?.(val);
          this.refreshUI();
          if (val.length >= 8) {
            this.autoVerifyTimer = setTimeout(() => {
              this.runAutoFlashLiteVerify(val);
            }, delayMs);
          }
        };

        els.keyInput.addEventListener('input', () => scheduleAutoVerify(420));

        els.keyInput.addEventListener('paste', () => {
          clearTimeout(this.autoVerifyTimer);
          setTimeout(() => {
            const val =
              NS.geminiRouter?.vaultMgr?.sanitizeKeyString?.(els.keyInput.value) ||
              String(els.keyInput.value || '').trim();
            if (val.length >= 8) {
              clearTimeout(this.autoVerifyTimer);
              this.runAutoFlashLiteVerify(val);
            }
          }, 40);
        });

        const triggerImmediateIfPending = () => {
          const val =
            NS.geminiRouter?.vaultMgr?.sanitizeKeyString?.(els.keyInput.value) ||
            String(els.keyInput.value || '').trim();
          if (val.length >= 8 && !NS.geminiRouter?.isCurrentKeyFlashLiteVerified?.() && val !== this._lastAutoVerifiedInput) {
            clearTimeout(this.autoVerifyTimer);
            this.runAutoFlashLiteVerify(val);
          }
        };
        els.keyInput.addEventListener('change', triggerImmediateIfPending);
        els.keyInput.addEventListener('blur', triggerImmediateIfPending);
        els.keyInput.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            triggerImmediateIfPending();
          }
        });
      }

      if (els.reconnectFolderBtn) {
        els.reconnectFolderBtn.addEventListener('click', async () => {
          this.lastFolderError = '';
          const ok = await NS.fsEngine?.reconnectPendingFolder?.();
          if (!ok && NS.fsEngine?.hasPendingReconnectHandle?.()) {
            this.lastFolderError =
              NS.fsEngine?.lastConnectError ||
              'Chưa cấp lại được quyền thư mục cũ — bạn có thể bấm nút bên dưới để chọn thư mục khác.';
          } else if (!ok) {
            await NS.fsEngine?.requestConnectFolder?.(true);
            if (!NS.fsEngine?.isConnected?.()) {
              this.lastFolderError = NS.fsEngine?.lastConnectError || '';
            }
          }
          this.refreshUI();
        });
      }

      if (els.pickFolderBtn) {
        els.pickFolderBtn.addEventListener('click', async () => {
          this.lastFolderError = '';
          if (NS.fsEngine?.isSupported?.()) {
            const ok = await NS.fsEngine.requestConnectFolder(true);
            if (!ok) {
              this.lastFolderError = NS.fsEngine?.lastConnectError || '';
              if (NS.fsEngine?.fallbackModeActive && els.mobileWebkitInput && 'webkitdirectory' in els.mobileWebkitInput) {
                els.mobileWebkitInput.click();
              }
            } else {
              this.lastFolderError = '';
            }
            this.refreshUI();
          } else {
            const ua = String(navigator?.userAgent || '');
            const isIos = /iPad|iPhone|iPod/i.test(ua);
            const supportsWebkitDir = Boolean(els.mobileWebkitInput && 'webkitdirectory' in els.mobileWebkitInput);
            if (!isIos && supportsWebkitDir && !navigator?.webdriver) {
              els.mobileWebkitInput.click();
            } else {
              const tr = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
              let chosenName = 'ThuMuc_TieuThuyet';
              if (typeof window !== 'undefined' && typeof window.prompt === 'function' && !navigator?.webdriver) {
                const entered = window.prompt(tr('Nhập tên thư mục làm việc trên thiết bị của bạn:'), chosenName);
                if (entered === null) return;
                chosenName = String(entered || '').trim() || chosenName;
              }
              await NS.fsEngine?.connectMobileWorkspaceFolder?.({ folderName: chosenName });
              this.refreshUI();
            }
          }
        });
      }

      if (els.mobileWebkitInput) {
        els.mobileWebkitInput.addEventListener('change', async () => {
          this.lastFolderError = '';
          const files = els.mobileWebkitInput.files;
          await NS.fsEngine?.connectMobileWorkspaceFolder?.({
            folderName: files && files.length === 0 ? 'ThuMuc_TieuThuyet' : '',
            fileList: files || null,
          });
          this.refreshUI();
        });
      }

      if (els.enterBtn) {
        els.enterBtn.addEventListener('click', () => {
          this.unlockAndEnterStudio();
        });
      }

      if (NS.bus?.on) {
        const E = NS.constants?.EVENTS || {};
        const syncAndEnforce = () => {
          if (this.shouldSuppressAutoGate()) {
            this.refreshUI();
            return;
          }
          this.refreshUI();
          const st = this.getGateStatus();
          if (!st.canEnter) {
            this.showGate(false);
          }
        };
        NS.bus.on(E.API_KEY_UPDATED || 'ai:api_key_updated', syncAndEnforce);
        NS.bus.on(E.API_KEY_VERIFIED || 'ai:api_key_verified', (payload) => {
          if (payload && payload.verified === true) {
            this.lastVerifyError = '';
          } else if (payload && payload.verified === false && payload.error) {
            this.lastVerifyError = String(payload.error);
          }
          syncAndEnforce();
        });
        NS.bus.on(E.FS_CONNECTED || 'fs:connected', () => {
          this.lastFolderError = '';
          this.refreshUI();
        });
        NS.bus.on('fs:connect_error', (payload) => {
          if (payload && payload.error) {
            this.lastFolderError = String(payload.error);
          }
          this.refreshUI();
        });
        NS.bus.on(E.FS_DISCONNECTED || 'fs:disconnected', syncAndEnforce);
        NS.bus.on('i18n:changed', () => {
          try {
            this.refreshUI();
          } catch {}
        });
      }
      if (typeof window !== 'undefined' && !window.__noirGateI18nListener) {
        window.__noirGateI18nListener = true;
        window.addEventListener('noir:i18n:changed', () => {
          try {
            this.refreshUI();
          } catch {}
        });
      }
    }

    async init() {
      if (this.hasInitialized) return this;
      this.hasInitialized = true;
      this.bindGateEvents();

      if (NS.guestMode?.isActive?.()) {
        this.refreshUI();
        return this;
      }

      // Khởi đầu hiển thị màn hình kết nối để người dùng kiểm tra lại API Key & Thư mục mỗi lần truy cập
      this.showGate(false, true);

      const stInitial = this.getGateStatus();
      if (stInitial.hasKey && !stInitial.flashLiteVerified) {
        await this.runAutoFlashLiteVerify(stInitial.activeKey);
      }

      // Tuyệt đối không tự bật lại Cổng Kết Nối nếu người dùng đã vào Chế độ Khách / Studio trong lúc xác thực ngầm
      if (!this.shouldSuppressAutoGate()) {
        this.showGate(false);
      }
      this.refreshUI();
      return this;
    }
  }

  /**
   * Lớp trung tâm Bộ Khởi Động Tổng Thể Noir Studio v38.0 (mod30).
   */
  class MasterStudioBootloader {
    constructor() {
      this.hasInitialized = false;
      this.telemetryLedger = new BootSequenceTelemetryLedger();
      this.swCoordinator = new ServiceWorkerRegistrationCoordinator('./sw.js');
      this.errorSentinel = new RuntimeErrorSentinelAndAutoRecovery(40);
      this.bridgeBinder = new CrossModuleActionBridgeBinder();
      this.auditor = new SystemIntegrityAuditorEngine();
      this.contractVerifier = new CrossModuleContractVerifier();
      this.regressionGuard = new OverhaulRegressionGuardSuite();
      this.domIdInspector = new DuplicateDomIdAndBindingInspector();
      this.schemaHealer = new WorkspaceSchemaMigrationAndHealer();
      this.eventTracer = new EventBusActivityTracer(80);
      this.capabilitiesMatrix = new PreFlightEnvironmentCapabilitiesMatrix();
      this.overlayStuckGuard = new UiOverlayStuckGuard();
      this.unloadSyncGuard = new PageUnloadEmergencySyncGuard();
      this.crossSync = new ReactiveCrossModuleSynchronizer();
      this.diagSanitizer = new DiagnosticsReportSanitizer();
      this.cacheHygiene = new LegacyCacheHygieneHelper();
      this.diagModal = new SystemDiagnosticsInspectorModal(this);
      this.tab6CardInjector = new Tab6DiagnosticsBarAndEmergencyHotkey(this);
      this.connectionGate = new EntryConnectionGateController();
      this.orchestrator = new PhasedDependencyOrchestrator(
        this.telemetryLedger,
        this.errorSentinel,
        this.bridgeBinder,
        this.swCoordinator
      );
    }

    async boot() {
      if (this.hasInitialized && this.orchestrator.hasBooted) {
        return this.telemetryLedger.getSummaryReport();
      }
      this.hasInitialized = true;

      this.eventTracer.attachToEventBus();
      this.crossSync.attachCrossModuleListeners();
      this.unloadSyncGuard.attachBeforeUnloadHook();
      this.tab6CardInjector.attachEmergencyHotkey();
      this.cacheHygiene.cleanDeprecatedTempKeysOnly();

      // Bug 12: Ngăn phím Backspace/Delete khi nhấn liên tục ngoài ô nhập gây điều hướng quay lại / tải lại trang web
      if (typeof document !== 'undefined' && !document.body?.dataset?.noirSafeKeyGuard) {
        if (document.body) document.body.dataset.noirSafeKeyGuard = '1';
        document.addEventListener(
          'keydown',
          (ev) => {
            if (ev.key !== 'Backspace' && ev.key !== 'Delete') return;
            const t = ev.target;
            const tag = (t?.tagName || '').toUpperCase();
            const isEditable =
              tag === 'TEXTAREA' ||
              (tag === 'INPUT' &&
                !/^(button|checkbox|radio|submit|reset|file|range|color)$/i.test(
                  t.type || ''
                )) ||
              Boolean(t?.isContentEditable);
            if (!isEditable) {
              ev.preventDefault();
            }
          },
          true
        );
        document.addEventListener(
          'submit',
          (ev) => {
            ev.preventDefault();
          },
          true
        );
      }

      const bootSummary = await this.orchestrator.executeBootSequence();
      try {
        NS.featureDirectory?.init?.();
      } catch (_mod31Err) {}
      this.schemaHealer.inspectAndHealWorkspaceIntegrity();
      this.tab6CardInjector.mountTab6HealthFooter();
      await this.connectionGate.init();
      try {
        NS.i18n?.init?.();
      } catch (_i18nBootErr) {}

      if (NS.logger?.info) {
        NS.logger.info(
          `[Mod30 Bootloader] Khởi động hoàn tất 31 module trong ${bootSummary.totalBootMs}ms.`
        );
      }

      return bootSummary;
    }

    init() {
      return this.boot();
    }

    runIntegrityAudit() {
      const coreAudit = this.auditor.runFullIntegrityAudit(
        this.swCoordinator,
        this.telemetryLedger
      );
      const contracts = this.contractVerifier.verifyAllContracts();
      const uiOverhaul = this.regressionGuard.runUiStructureVerification();
      const duplicateDom = this.domIdInspector.scanDuplicateElementIds();
      const legacyGlobals = this.domIdInspector.verifyNoLegacyGlobalPolluters();
      const envCapabilities = this.capabilitiesMatrix.probeCapabilities();
      const sentinelHealth = this.errorSentinel.getHealthSnapshot();

      const overallHealthy =
        coreAudit.healthy &&
        contracts.allContractsSatisfied &&
        uiOverhaul.allPassed &&
        duplicateDom.clean &&
        legacyGlobals.clean;

      return {
        ...coreAudit,
        healthy: overallHealthy,
        contracts,
        uiOverhaul,
        duplicateDom,
        legacyGlobals,
        envCapabilities,
        runtimeErrors: sentinelHealth,
        recentEvents: this.eventTracer.getRecentActivity(15),
      };
    }

    runEmergencySelfHeal() {
      this.overlayStuckGuard.clearStuckOverlayStates();
      const schemaResult = this.schemaHealer.inspectAndHealWorkspaceIntegrity();
      this.orchestrator.rebuildRagAndRefreshBadgesAfterChapters();
      this.orchestrator.postBootSynchronizationPass();
      this.bridgeBinder.bindAllMissingBridges();
      this.tab6CardInjector.mountTab6HealthFooter();
      return {
        recoveredAtIso: new Date().toISOString(),
        schemaResult,
        audit: this.runIntegrityAudit(),
      };
    }

    openDiagnosticsModal() {
      return this.diagModal.openModal();
    }

    exportSanitizedDiagnosticsJson() {
      const fullAudit = this.runIntegrityAudit();
      return this.diagSanitizer.sanitizeReportForExport(fullAudit);
    }

    getQuickBootSummary() {
      const modSummary = this.auditor.inspectAllThirtyModules();
      const metrics = this.schemaHealer.collectWorkspaceContentMetrics();
      return {
        hasInitialized: this.hasInitialized,
        hasBooted: this.orchestrator.hasBooted,
        totalBootMs: this.telemetryLedger.getTotalBootMs(),
        loadedModules: `${modSummary.loadedCount}/${modSummary.totalExpected}`,
        capturedRuntimeErrors: this.errorSentinel.capturedErrors.length,
        metrics,
      };
    }
  }

  /**
   * Trình kiểm tra sự sẵn sàng kết nối của toàn bộ các luồng nghiệp vụ trọng tâm end-to-end.
   */
  class EndToEndWorkflowReadinessVerifier {
    verifyAllCriticalWorkflows() {
      if (typeof document === 'undefined') {
        return { ready: false, reason: 'missing_dom' };
      }

      const verifyIds = (ids) => ids.every((id) => Boolean(document.getElementById(id)));

      const workflows = {
        sixScreenNavigation: {
          label: 'Điều hướng 6 Màn hình Desktop & Mobile PWA',
          ready:
            typeof NS.navigator?.navigateToScreen === 'function' &&
            document.querySelectorAll('.s14-nav-tab[data-s14-tab]').length >= 12,
        },
        editorAndApprovalFlow: {
          label: 'Soạn thảo Tab 1, Chuẩn hóa thoại & Duyệt bản thảo sạch',
          ready:
            verifyIds(['textarea-chapter-content', 'input-chapter-title', 'btn-approve-chapter', 'modal-approve-chapter-smart']) &&
            typeof NS.chapterManager?.createNewChapter === 'function' &&
            typeof NS.editorTools?.auditDialogueQuoteConsistency === 'function',
        },
        aiTwoStepSynthesisFlow: {
          label: 'Quy trình AI 2 Bước (Prompt Tổng -> Xác nhận chọn mô hình)',
          ready:
            verifyIds([
              'btn-open-fullscreen-ai-command',
              's18-fullscreen-prompt-textarea',
              'btn-run-master-prompt-synthesis',
              'modal-confirm-synthesized-prompt',
              'confirm-modal-model-select',
              'confirm-model-lite-warning',
              'btn-execute-official-novel-prompt',
            ]) &&
            typeof NS.promptSynthesizer?.runStep1MasterSynthesis === 'function' &&
            typeof NS.promptSynthesizer?.executeStep2OfficialNovelPrompt === 'function',
        },
        tab3AndMode5PlotDiagram: {
          label: 'Tab 3 Menu 5 Chế độ & Chế độ 5 Biểu đồ Cốt Truyện SVG',
          ready:
            verifyIds([
              's20-quad-tab-selector',
              's20-quad-output-textarea',
              'btn-tab3-append-to-manuscript',
              'btn-tab3-replace-manuscript',
              'btn-tab3-copy-output',
              'mode5-plot-diagram-studio',
              'mode5-svg-canvas-Stage',
            ]) && typeof NS.mode5Studio?.generateDiagramAndTimeline === 'function',
        },
        googleDocsAiDiffReview: {
          label: 'Duyệt Màu Đoạn AI Viết kiểu Google Docs tại Tab 1',
          ready:
            verifyIds(['ai-diff-review-toolbar', 'ai-diff-review-surface', 'btn-ai-diff-accept-all', 'btn-ai-diff-reject-all']) &&
            typeof NS.aiDiff?.applyAIOutputToManuscriptWithDiff === 'function',
        },
        bidirectionalPomodoroSync: {
          label: 'Đồng hồ Pomodoro Đồng bộ 2 chiều (Tab 5 <-> Thanh Nổi)',
          ready:
            verifyIds(['s14-panel-pomodoro-box', 's15-floating-pomodoro-pill']) &&
            typeof NS.pomodoro?.toggleStartPause === 'function',
        },
        versionTimeMachineAndPdfFont: {
          label: 'Kho Phiên Bản Preview/Khôi phục & Xuất PDF chọn Font/Size',
          ready:
            verifyIds([
              'version-history-list-container',
              'version-preview-content-box',
              'modal-fullscreen-version-preview',
              'export-pdf-font-family',
              'export-pdf-font-size',
            ]) &&
            typeof NS.versionVault?.createSnapshot === 'function' &&
            typeof NS.exporter?.exportPdf === 'function',
        },
        tutorialVideoAndWebNovelTools: {
          label: 'Video Hướng Dẫn 60FPS Có Phụ Đề & Công cụ Ngũ quan WebNovel',
          ready:
            verifyIds(['btn-s6-card-tutorial', 'modal-tutorial-changelog-az', 'modal-sensory-and-author-notes', 'passive-lore-whisper-bar']) &&
            typeof NS.tutorialAndChangelog?.openModal === 'function' &&
            typeof NS.webNovelFeatures?.diagnoseChapterOpeningAndHook === 'function',
        },
        entryConnectionGateAndCollapsibles: {
          label: 'Màn hình Kết Nối API Flash-Lite & Thư mục + Thanh Rút Gọn Mặc Định',
          ready:
            verifyIds([
              'app-entry-connection-gate',
              'btn-gate-open-google-studio',
              'gate-input-gemini-api-key',
              'btn-gate-pick-workspace-folder',
              'btn-gate-enter-studio',
              's15-floating-audio-pill',
            ]) && typeof NS.connectionGate?.getGateStatus === 'function',
        },
      };

      const entries = Object.values(workflows);
      const passedCount = entries.filter((w) => w.ready).length;
      return {
        allReady: passedCount === entries.length,
        passedCount,
        totalCount: entries.length,
        workflows,
      };
    }
  }

  /**
   * Kiểm tra tài nguyên Font, SVG & WebStorage ngoại tuyến giúp đảm bảo hoạt động khi mất mạng.
   */
  class OfflineReadinessAndAssetInspector {
    inspectOfflineAssets() {
      const fontsLoaded =
        typeof document !== 'undefined' && document.fonts
          ? document.fonts.size || 0
          : 0;
      const manifestLink =
        typeof document !== 'undefined'
          ? document.querySelector('link[rel="manifest"]')?.getAttribute('href') || ''
          : '';
      const prefersDarkClass =
        typeof document !== 'undefined'
          ? document.documentElement.classList.contains('dark')
          : true;

      return {
        manifestDeclared: Boolean(manifestLink),
        manifestHref: manifestLink,
        documentFontsCount: fontsLoaded,
        darkThemeActive: prefersDarkClass,
        indexedDbSupported: typeof indexedDB !== 'undefined',
      };
    }

    formatHumanReadableBootReport(bootloaderRef) {
      const summary = bootloaderRef.getQuickBootSummary();
      const wf = bootloaderRef.workflowVerifier.verifyAllCriticalWorkflows();
      const offline = this.inspectOfflineAssets();
      return [
        `=== BÁO CÁO TRẠNG THÁI NOIR STUDIO v38.0 ===`,
        `• Thời gian khởi động: ${summary.totalBootMs} ms`,
        `• Mô-đun hoạt động: ${summary.loadedModules}`,
        `• Lỗi runtime ghi nhận: ${summary.capturedRuntimeErrors}`,
        `• Số chương hiện có: ${summary.metrics.chapterCount} (${summary.metrics.totalWords} từ)`,
        `• Số phiên bản Time-Machine: ${summary.metrics.versionSnapshotsCount}`,
        `• Luồng nghiệp vụ sẵn sàng: ${wf.passedCount}/${wf.totalCount}`,
        `• Manifest PWA: ${offline.manifestDeclared ? offline.manifestHref : 'Chưa khai báo'}`,
      ].join('\n');
    }
  }

  /**
   * Giám sát xung đột phím tắt toàn cục & đo độ trễ phản hồi từng pha khởi động.
   */
  class ModuleWatchdogAndShortcutAuditor {
    constructor() {
      this.registeredShortcutBindings = [
        { combo: 'Ctrl+S', owner: 'mod09', description: 'Lưu 3 tầng & chụp mốc nhanh' },
        { combo: 'Ctrl+Z / Ctrl+Y', owner: 'mod09', description: 'Hoàn tác / Làm lại sâu' },
        { combo: 'Ctrl+F', owner: 'mod23', description: 'Mở/Đóng thanh Tìm kiếm & Thay thế Tab 1' },
        { combo: 'F11', owner: 'mod29/mod22', description: 'Bật/Tắt chế độ Tập trung Zen Mode' },
        { combo: 'Alt+1 .. Alt+6', owner: 'mod29', description: 'Chuyển nhanh 6 Màn hình chính' },
        { combo: 'Alt+ArrowLeft / Right', owner: 'mod29', description: 'Lùi / Tiến màn hình liền kề' },
        { combo: 'Escape', owner: 'mod03', description: 'Đóng hộp thoại nổi trên cùng' },
        { combo: 'Ctrl+Shift+Alt+R', owner: 'mod30', description: 'Phục hồi giao diện khẩn cấp' },
      ];
    }

    getShortcutAllocationTable() {
      return this.registeredShortcutBindings.slice();
    }

    detectSlowBootPhases(bootSummary, slowThresholdMs = 350) {
      const steps = Array.isArray(bootSummary?.steps) ? bootSummary.steps : [];
      const slowSteps = steps.filter((s) => Number(s.durationMs || 0) >= slowThresholdMs);
      return {
        thresholdMs: slowThresholdMs,
        slowStepsCount: slowSteps.length,
        slowSteps,
      };
    }

    buildPortableDiagnosticHtmlCard(bootloaderRef) {
      const reportText = bootloaderRef.generateHumanReadableStatusSummary();
      const safe = reportText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"><title>Chẩn Đoán Noir Studio v38.0</title></head>
<body style="font-family:monospace;background:#090d14;color:#e2e8f0;padding:24px;">
<h2 style="color:#34d399;">Noir Studio — Báo Cáo Toàn Vẹn 30 Module</h2>
<pre style="white-space:pre-wrap;background:#111827;padding:16px;border-radius:10px;">${safe}</pre>
</body>
</html>`;
    }
  }

  /**
   * Trình nhắc sao lưu nhẹ nhàng theo phiên viết dài (không làm gián đoạn mạch sáng tác).
   */
  class SessionBackupCadenceMonitor {
    constructor(intervalMinutes = 30) {
      this.intervalMinutes = intervalMinutes;
      this.sessionStartedMs = Date.now();
      this.lastBackupNotifiedMs = Date.now();
      this.timerHandle = null;
    }

    startGentleMonitor() {
      if (this.timerHandle || typeof setInterval === 'undefined') return;
      const periodMs = Math.max(5, this.intervalMinutes) * 60 * 1000;
      this.timerHandle = setInterval(() => {
        const now = Date.now();
        if (now - this.lastBackupNotifiedMs < periodMs) return;
        this.lastBackupNotifiedMs = now;
        const chapsCount = NS.chapterManager?.chapters?.length || 0;
        const hasDiskFolder = Boolean(NS.fsEngine?.hasActiveDirectoryHandle?.());
        if (chapsCount > 0 && !hasDiskFolder && NS.uiUtils?.showToast) {
          NS.uiUtils.showToast(
            'Mẹo bảo vệ bản thảo: Bạn có thể bấm "Ổ cứng" hoặc sao lưu .JSON ở Tab 2 để lưu thêm 1 bản trên máy.',
            'info',
            4500
          );
        }
      }, periodMs);
    }

    stopMonitor() {
      if (this.timerHandle) {
        clearInterval(this.timerHandle);
        this.timerHandle = null;
      }
    }

    getElapsedSessionMinutes() {
      return Math.round((Date.now() - this.sessionStartedMs) / 60000);
    }
  }

  /**
   * Bộ điều phối đa ngôn ngữ toàn hệ thống (Tiếng Việt gốc + EN / zh-CN / zh-TW / KO / JA).
   * Tự động chụp snapshot DOM bằng WeakMap để khôi phục nguyên bản 100% khi quay về Tiếng Việt
   * và tuyệt đối không chạm vào nội dung tiểu thuyết người dùng đang soạn thảo.
   */
  const STUDIO_LOCALE_RULES = Object.freeze({
    vi: Object.freeze({
      intlLocale: 'vi-VN',
      dateOrder: 'DMY',
      dateSep: '/',
      monthDayOrder: 'DM',
      monthDaySep: '/',
      hour12: false,
      amLabel: 'SA',
      pmLabel: 'CH',
      defaultClockFormatId: 'DMY_HMS',
      todayLabel: 'Hôm nay',
      weekdayShort: Object.freeze(['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']),
      timePrefix: 'Giờ ',
      timeSuffix: '',
      languageHeader: '🌐 Chọn Ngôn Ngữ',
    }),
    en: Object.freeze({
      intlLocale: 'en-US',
      dateOrder: 'MDY',
      dateSep: '/',
      monthDayOrder: 'MD',
      monthDaySep: '/',
      hour12: true,
      amLabel: 'AM',
      pmLabel: 'PM',
      defaultClockFormatId: 'MDY_HMS_12H',
      todayLabel: 'Today',
      weekdayShort: Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
      timePrefix: '',
      timeSuffix: ' Time',
      languageHeader: '🌐 Select Language',
    }),
    'zh-CN': Object.freeze({
      intlLocale: 'zh-CN',
      dateOrder: 'YMD',
      dateSep: '/',
      monthDayOrder: 'MD',
      monthDaySep: '/',
      hour12: false,
      amLabel: '上午',
      pmLabel: '下午',
      defaultClockFormatId: 'YMD_SLASH_HMS',
      todayLabel: '今天',
      weekdayShort: Object.freeze(['周日', '周一', '周二', '周三', '周四', '周五', '周六']),
      timePrefix: '',
      timeSuffix: '时间',
      languageHeader: '🌐 选择界面语言',
    }),
    'zh-TW': Object.freeze({
      intlLocale: 'zh-TW',
      dateOrder: 'YMD',
      dateSep: '/',
      monthDayOrder: 'MD',
      monthDaySep: '/',
      hour12: false,
      amLabel: '上午',
      pmLabel: '下午',
      defaultClockFormatId: 'YMD_SLASH_HMS',
      todayLabel: '今天',
      weekdayShort: Object.freeze(['週日', '週一', '週二', '週三', '週四', '週五', '週六']),
      timePrefix: '',
      timeSuffix: '時間',
      languageHeader: '🌐 選擇介面語言',
    }),
    ko: Object.freeze({
      intlLocale: 'ko-KR',
      dateOrder: 'YMD',
      dateSep: '.',
      monthDayOrder: 'MD',
      monthDaySep: '.',
      hour12: false,
      amLabel: '오전',
      pmLabel: '오후',
      defaultClockFormatId: 'YMD_DOT_HMS',
      todayLabel: '오늘',
      weekdayShort: Object.freeze(['일', '월', '화', '수', '목', '금', '토']),
      timePrefix: '',
      timeSuffix: ' 시간',
      languageHeader: '🌐 언어 선택',
    }),
    ja: Object.freeze({
      intlLocale: 'ja-JP',
      dateOrder: 'YMD',
      dateSep: '/',
      monthDayOrder: 'MD',
      monthDaySep: '/',
      hour12: false,
      amLabel: '午前',
      pmLabel: '午後',
      defaultClockFormatId: 'YMD_SLASH_HMS',
      todayLabel: '今日',
      weekdayShort: Object.freeze(['日', '月', '火', '水', '木', '金', '土']),
      timePrefix: '',
      timeSuffix: '時間',
      languageHeader: '🌐 言語を選択',
    }),
  });

  class NoirMultiLanguageController {
    constructor() {
      this.storageKey = 'bi_novel_ui_lang_v1';
      this.baseMeta = Object.freeze({
        code: 'vi',
        flag: '🇻🇳',
        nativeName: 'Tiếng Việt',
        shortLabel: 'VI',
        htmlLang: 'vi',
        version: '1.0.0',
      });
      this.packOrder = ['en', 'zh-CN', 'zh-TW', 'ko', 'ja'];
      this.currentLang = 'vi';
      this.origTextMap = typeof WeakMap === 'function' ? new WeakMap() : null;
      this.origAttrMap = typeof WeakMap === 'function' ? new WeakMap() : null;
      this.origDocTitle = '';
      this.lastAppliedDocTitle = '';
      this.preparedPhrasesCache = {};
      this.lowerExactCache = {};
      this.translatableAttrs = ['placeholder', 'title', 'aria-label', 'data-noir-hover-title'];
      this.observer = null;
      this.observerDisabled = true;
      this.isApplying = false;
      this.popoverEl = null;
      this.activeTriggerEl = null;
      this.initialized = false;
      [
        'getLanguage',
        'getLocaleConfig',
        'getIntlLocale',
        'formatNumber',
        'formatDate',
        'formatMonthDay',
        'formatTime',
        'formatDateTime',
        'formatWeekdayShort',
        'formatTodayLabel',
        'formatZoneDisplayName',
        'getPack',
        'getMeta',
        'reformatDatesInText',
        'translateText',
        'translatePromptFrame',
        'syncDefaultInputValues',
        'translateElement',
        'setLanguage',
        'syncDocumentTitle',
      ].forEach((fn) => {
        if (typeof this[fn] === 'function') {
          this[fn] = this[fn].bind(this);
        }
      });
      this.excludedSelector = [
        'script',
        'style',
        'noscript',
        'svg',
        'textarea',
        'code',
        'pre',
        'template',
        '[contenteditable="true"]',
        '[contenteditable=""]',
        '[data-i18n-ignore]',
        '[data-i18n-active-name]',
        '#bi-i18n-floating-popover',
        '#textarea-chapter-content',
        '#input-chapter-title',
        '#s18-minimal-chapter-title',
        '#s18-fullscreen-prompt-textarea',
        '#input-ai-command-prompt',
        '#s20-quad-output-textarea',
        '#tab4-story-bible-content',
        '#tab4-bible-structure-template',
        '#tab4-banned-cliches-input',
        '#mod27-chat-messages-box',
        '#rag-search-results',
        '#version-preview-content-box',
        '#scratchpad-textarea',
        '#chapter-tree-container .chapter-title-text',
        '#chapter-tree-container input',
        '#chapter-tree-container [data-chapter-title]',
        '.live-mini-ui-stage',
        '#mod28-live-mirror-scale-wrapper',
        '.noir-user-prose',
        '[data-user-manuscript="true"]',
      ].join(', ');
      this.attrExcludedSelector = [
        '[data-i18n-ignore]',
        '#bi-i18n-floating-popover',
        '.live-mini-ui-stage',
        '#mod28-live-mirror-scale-wrapper',
      ].join(', ');
    }

    getPack(code = this.currentLang) {
      if (!code || code === 'vi') return null;
      return NS.i18nPacks && NS.i18nPacks[code] ? NS.i18nPacks[code] : null;
    }

    getMeta(code = this.currentLang) {
      if (!code || code === 'vi') return this.baseMeta;
      const pack = this.getPack(code);
      return (pack && pack.meta) || this.baseMeta;
    }

    getLocaleConfig(code = this.currentLang) {
      return STUDIO_LOCALE_RULES[code] || STUDIO_LOCALE_RULES.vi;
    }

    getIntlLocale(code = this.currentLang) {
      return this.getLocaleConfig(code).intlLocale || 'vi-VN';
    }

    _coerceDate(input) {
      if (input instanceof Date) return Number.isNaN(input.getTime()) ? new Date() : input;
      if (typeof input === 'number' || typeof input === 'string') {
        const d = new Date(input);
        return Number.isNaN(d.getTime()) ? new Date() : d;
      }
      return new Date();
    }

    _pad2(n) {
      return String(Math.max(0, Number(n) || 0)).padStart(2, '0');
    }

    formatNumber(value, code = this.currentLang) {
      let raw = value;
      if (typeof raw === 'string') {
        const s = raw.trim();
        if (/^-?\d{1,3}(?:\.\d{3})+$/.test(s) || /^-?\d{1,3}(?:,\d{3})+$/.test(s)) {
          raw = s.replace(/[.,]/g, '');
        }
      }
      const num = Number(raw);
      if (!Number.isFinite(num)) return String(value ?? '');
      return num.toLocaleString(this.getIntlLocale(code));
    }

    formatDate(input, code = this.currentLang) {
      const cfg = this.getLocaleConfig(code);
      let year, month, day;
      if (input && typeof input === 'object' && !(input instanceof Date) && 'year' in input) {
        year = Number(input.year);
        month = Number(input.month);
        day = Number(input.day);
      } else {
        const d = this._coerceDate(input);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
      }
      const yyyy = String(year).padStart(4, '0');
      const mm = this._pad2(month);
      const dd = this._pad2(day);
      const sep = cfg.dateSep || '/';
      if (cfg.dateOrder === 'MDY') return `${mm}${sep}${dd}${sep}${yyyy}`;
      if (cfg.dateOrder === 'YMD') return `${yyyy}${sep}${mm}${sep}${dd}`;
      return `${dd}${sep}${mm}${sep}${yyyy}`;
    }

    formatMonthDay(input, code = this.currentLang) {
      const cfg = this.getLocaleConfig(code);
      const d = this._coerceDate(input);
      const mm = this._pad2(d.getMonth() + 1);
      const dd = this._pad2(d.getDate());
      const sep = cfg.monthDaySep || '/';
      return cfg.monthDayOrder === 'MD' ? `${mm}${sep}${dd}` : `${dd}${sep}${mm}`;
    }

    formatTime(input, options = {}, code = this.currentLang) {
      const cfg = this.getLocaleConfig(code);
      let hours, minutes, seconds;
      if (input && typeof input === 'object' && !(input instanceof Date) && 'hour' in input) {
        hours = Number(input.hour);
        minutes = Number(input.minute);
        seconds = Number(input.second || 0);
      } else {
        const d = this._coerceDate(input);
        hours = d.getHours();
        minutes = d.getMinutes();
        seconds = d.getSeconds();
      }
      const includeSeconds = options.seconds !== false;
      const use12h = typeof options.hour12 === 'boolean' ? options.hour12 : Boolean(cfg.hour12);
      const mi = this._pad2(minutes);
      const ss = this._pad2(seconds);
      if (use12h) {
        const ampm = hours >= 12 ? (cfg.pmLabel || 'PM') : (cfg.amLabel || 'AM');
        const h12 = this._pad2(hours % 12 || 12);
        return includeSeconds ? `${h12}:${mi}:${ss} ${ampm}` : `${h12}:${mi} ${ampm}`;
      }
      const hh = this._pad2(hours);
      return includeSeconds ? `${hh}:${mi}:${ss}` : `${hh}:${mi}`;
    }

    formatDateTime(input, options = {}, code = this.currentLang) {
      const dateStr = this.formatDate(input, code);
      const timeStr = this.formatTime(input, options, code);
      const sep = options.separator || ' ';
      return `${dateStr}${sep}${timeStr}`;
    }

    formatWeekdayShort(input, code = this.currentLang) {
      const cfg = this.getLocaleConfig(code);
      const d = this._coerceDate(input);
      const arr = cfg.weekdayShort;
      return Array.isArray(arr) && arr[d.getDay()] ? arr[d.getDay()] : '';
    }

    formatTodayLabel(code = this.currentLang) {
      return this.getLocaleConfig(code).todayLabel || 'Hôm nay';
    }

    formatZoneDisplayName(rawViName, code = this.currentLang) {
      const raw = String(rawViName || '').trim();
      if (!raw) return '';
      if (!code || code === 'vi') return raw;
      const translatedDirect = this.translateText(raw, code);
      if (translatedDirect !== raw && !/[À-ỹ]/.test(translatedDirect)) {
        return translatedDirect;
      }
      const cityOnly = raw.replace(/^Giờ\s+/i, '').trim();
      const cfg = this.getLocaleConfig(code);
      const translatedCity = this.translateText(cityOnly, code);
      const resolvedCity = (translatedCity && translatedCity !== cityOnly) ? translatedCity : cityOnly;
      if (/^Giờ\s+/i.test(raw)) {
        return `${cfg.timePrefix || ''}${resolvedCity}${cfg.timeSuffix || ''}`.trim();
      }
      return resolvedCity;
    }

    reformatDatesInText(text, code = this.currentLang) {
      if (typeof text !== 'string' || !text || !code || code === 'vi') return text;
      const cfg = this.getLocaleConfig(code);
      let out = text;
      if (/\bDD\/MM\/YYYY\b/i.test(out)) {
        const sep = cfg.dateSep || '/';
        const token =
          cfg.dateOrder === 'MDY'
            ? `MM${sep}DD${sep}YYYY`
            : cfg.dateOrder === 'YMD'
              ? `YYYY${sep}MM${sep}DD`
              : `DD${sep}MM${sep}YYYY`;
        out = out.replace(/\bDD\/MM\/YYYY\b/gi, token);
      }
      if (!/\d{1,2}\/\d{1,2}\/\d{4}/.test(out)) return out;
      return out.replace(/(^|[^\d/])(\d{1,2})\/(\d{1,2})\/(\d{4})(?=$|[^\d/])/g, (full, pre, ddRaw, mmRaw, yyyy) => {
        const dNum = Number(ddRaw);
        const mNum = Number(mmRaw);
        if (dNum < 1 || dNum > 31 || mNum < 1 || mNum > 12) return full;
        const dd = this._pad2(dNum);
        const mm = this._pad2(mNum);
        const sep = cfg.dateSep || '/';
        if (cfg.dateOrder === 'MDY') return `${pre}${mm}${sep}${dd}${sep}${yyyy}`;
        if (cfg.dateOrder === 'YMD') return `${pre}${yyyy}${sep}${mm}${sep}${dd}`;
        return full;
      });
    }

    getSupportedLanguages() {
      const list = [this.baseMeta];
      for (let i = 0; i < this.packOrder.length; i++) {
        const pack = this.getPack(this.packOrder[i]);
        if (pack && pack.meta) list.push(pack.meta);
      }
      return list;
    }

    getLanguage() {
      return this.currentLang;
    }

    readStoredLang() {
      try {
        const saved = globalScope.localStorage?.getItem(this.storageKey);
        if (saved === 'vi') return 'vi';
        if (saved && this.packOrder.includes(saved) && this.getPack(saved)) {
          return saved;
        }
      } catch (_readErr) {}
      return 'vi';
    }

    saveStoredLang(code) {
      try {
        globalScope.localStorage?.setItem(this.storageKey, code);
      } catch (_saveErr) {}
    }

    hasNonAsciiOrViText(str) {
      if (!str || str.length < 2) return false;
      if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) return true;
      if (/^[\d\s.,:/+\-–—•·|()[\]{}<>%?!@#$%^&*=~`"';\\]+$/.test(str)) return false;
      if (/^https?:\/\/\S+$/i.test(str)) return false;
      return /[A-Za-zÀ-ỹ]/.test(str);
    }

    getPreparedPhrases(code, pack) {
      if (!pack || !Array.isArray(pack.phrases)) return [];
      if (this.preparedPhrasesCache[code]) return this.preparedPhrasesCache[code];
      const sorted = pack.phrases
        .filter((pair) => Array.isArray(pair) && typeof pair[0] === 'string' && pair[0].length > 0)
        .slice()
        .sort((a, b) => b[0].length - a[0].length);
      this.preparedPhrasesCache[code] = sorted;
      return sorted;
    }

    translateText(rawText, code = this.currentLang) {
      if (typeof rawText !== 'string' || !rawText) return rawText;
      if (!code || code === 'vi') return rawText;
      const pack = this.getPack(code);
      if (!pack) return rawText;

      const wsMatch = rawText.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const lead = wsMatch ? wsMatch[1] : '';
      const core = wsMatch ? wsMatch[2] : rawText;
      const trail = wsMatch ? wsMatch[3] : '';
      if (!core || !this.hasNonAsciiOrViText(core)) return rawText;

      const norm = core.replace(/\s+/g, ' ').trim();
      const sourceHasViOrToken = /[À-ỹ]/.test(norm) || /\bDD\/MM\/YYYY\b/i.test(norm);
      const exactMap = pack.exact || {};

      if (Object.prototype.hasOwnProperty.call(exactMap, core)) {
        const res = sourceHasViOrToken ? this.reformatDatesInText(exactMap[core], code) : exactMap[core];
        return lead + res + trail;
      }
      if (Object.prototype.hasOwnProperty.call(exactMap, norm)) {
        const res = sourceHasViOrToken ? this.reformatDatesInText(exactMap[norm], code) : exactMap[norm];
        return lead + res + trail;
      }

      let lowerMap = this.lowerExactCache[code];
      if (!lowerMap) {
        lowerMap = Object.create(null);
        const exactKeys = Object.keys(exactMap);
        for (let i = 0; i < exactKeys.length; i++) {
          const lk = exactKeys[i].replace(/\s+/g, ' ').trim().toLowerCase();
          if (lk && !Object.prototype.hasOwnProperty.call(lowerMap, lk)) {
            lowerMap[lk] = exactMap[exactKeys[i]];
          }
        }
        this.lowerExactCache[code] = lowerMap;
      }
      const lowerNorm = norm.toLowerCase();
      if (lowerNorm && Object.prototype.hasOwnProperty.call(lowerMap, lowerNorm)) {
        const res = sourceHasViOrToken ? this.reformatDatesInText(lowerMap[lowerNorm], code) : lowerMap[lowerNorm];
        return lead + res + trail;
      }

      // [DYN_I18N_PATTERNS_V43]
      const mCropReadout = norm.match(/^X:\s*(\d+)%\s*•\s*Y:\s*(\d+)%\s*•\s*Rộng:\s*(\d+)%\s*•\s*Cao:\s*(\d+)%$/i);
      if (mCropReadout) {
        const [, x, y, w, h] = mCropReadout;
        const map = {
          en: `X: ${x}% • Y: ${y}% • Width: ${w}% • Height: ${h}%`,
          'zh-CN': `X: ${x}% • Y: ${y}% • 宽度: ${w}% • 高度: ${h}%`,
          'zh-TW': `X: ${x}% • Y: ${y}% • 寬度: ${w}% • 高度: ${h}%`,
          ko: `X: ${x}% • Y: ${y}% • 너비: ${w}% • 높이: ${h}%`,
          ja: `X: ${x}% • Y: ${y}% • 幅: ${w}% • 高さ: ${h}%`
        };
        if (map[code]) return lead + map[code] + trail;
      }
      const mCropStep2 = norm.match(/^Vùng đã chọn:\s*Rộng\s*(\d+)%\s*×\s*Cao\s*(\d+)%\s*\(tại\s*X=(\d+)%,\s*Y=(\d+)%\)$/i);
      if (mCropStep2) {
        const [, w, h, x, y] = mCropStep2;
        const map = {
          en: `Selected region: Width ${w}% × Height ${h}% (at X=${x}%, Y=${y}%)`,
          'zh-CN': `已选区域：宽度 ${w}% × 高度 ${h}%（位于 X=${x}%, Y=${y}%）`,
          'zh-TW': `已選區域：寬度 ${w}% × 高度 ${h}%（位於 X=${x}%, Y=${y}%）`,
          ko: `선택 영역: 너비 ${w}% × 높이 ${h}% (위치 X=${x}%, Y=${y}%)`,
          ja: `選択領域：幅 ${w}% × 高さ ${h}%（位置 X=${x}%, Y=${y}%）`
        };
        if (map[code]) return lead + map[code] + trail;
      }
      const mCroppedBadge = norm.match(/^Đã crop\s*(\d+)%×(\d+)%\s*•\s*(.+)$/i);
      if (mCroppedBadge) {
        const [, w, h, fitRaw] = mCroppedBadge;
        const isExact = fitRaw.includes('Đúng kích thước');
        const map = {
          en: `Cropped ${w}%×${h}% • ${isExact ? 'Exact size (black bars)' : 'Full-screen stretch'}`,
          'zh-CN': `已裁剪 ${w}%×${h}% • ${isExact ? '保持原尺寸（黑边）' : '全屏铺满'}`,
          'zh-TW': `已裁剪 ${w}%×${h}% • ${isExact ? '保持原尺寸（黑邊）' : '全螢幕鋪滿'}`,
          ko: `자르기됨 ${w}%×${h}% • ${isExact ? '정확한 크기 (검은 여백)' : '전체 화면 채우기'}`,
          ja: `トリミング済 ${w}%×${h}% • ${isExact ? '実寸維持（黒帯）' : '全画面フィット'}`
        };
        if (map[code]) return lead + map[code] + trail;
      }
      const mDateSess = norm.match(/^(\d{4}-\d{2}-\d{2}):\s*(\d+)\s*phiên\s*·\s*([\d.,]+)\s*từ$/i);
      if (mDateSess) {
        const [, dt, sCnt, wCnt] = mDateSess;
        const map = {
          en: `${dt}: ${sCnt} sessions · ${wCnt} words`,
          'zh-CN': `${dt}: ${sCnt} 次 · ${wCnt} 字`,
          'zh-TW': `${dt}: ${sCnt} 次 · ${wCnt} 字`,
          ko: `${dt}: ${sCnt}세션 · ${wCnt}단어`,
          ja: `${dt}: ${sCnt}セッション · ${wCnt}語`
        };
        if (map[code]) return lead + map[code] + trail;
      }
      const mApproveErr = norm.match(/^(?:🛠️\s*)?❌\s*Có trục trặc khi tổng hợp chốt duyệt:\s*([\s\S]+)$/i);
      if (mApproveErr) {
        const [, detail] = mApproveErr;
        const map = {
          en: `❌ Error during chapter approval synthesis: ${detail}`,
          'zh-CN': `❌ 章节定稿汇总时发生错误：${detail}`,
          'zh-TW': `❌ 章節定稿彙總時發生錯誤：${detail}`,
          ko: `❌ 챕터 승인 종합 중 오류 발생: ${detail}`,
          ja: `❌ 章の承認統合中にエラーが発生しました：${detail}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 1. 📁 Thư mục: ✅ 1. VƯỢT KHÓ LIGHT NOVEL (giữ nguyên tên thư mục của người dùng, nhưng để "⚠️ Chưa gắn ổ cứng" đi qua patterns dịch)
      const mFolderPill = norm.match(/^(📁\s*)?Thư mục:\s*([\s\S]*)$/i);
      if (mFolderPill && (!String(mFolderPill[2] || '').trim() || String(mFolderPill[2] || '').trim().startsWith('✅'))) {
        const icon = mFolderPill[1] || '';
        const rest = String(mFolderPill[2] || '').trim();
        const labelMap = {
          en: 'Folder:',
          'zh-CN': '文件夹:',
          'zh-TW': '資料夾:',
          ko: '폴더:',
          ja: 'フォルダ:'
        };
        if (labelMap[code]) {
          return lead + `${icon}${labelMap[code]}${rest ? ' ' + rest : ''}` + trail;
        }
      }

      // 2. Đang đồng bộ tự động vào thư mục: <folderName>
      const mAutoSyncFolder = norm.match(/^Đang đồng bộ tự động vào thư mục:\s*([\s\S]+)$/i);
      if (mAutoSyncFolder) {
        const folderName = mAutoSyncFolder[1];
        const map = {
          en: `Auto-syncing to folder: ${folderName}`,
          'zh-CN': `正在自动同步到文件夹：${folderName}`,
          'zh-TW': `正在自動同步到資料夾：${folderName}`,
          ko: `폴더에 자동 동기화 중: ${folderName}`,
          ja: `フォルダへ自動同期中：${folderName}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 3. Nhấn để cấp lại quyền ghi nhanh vào thư mục cũ: <folderName>
      const mReconnectFolder = norm.match(/^Nhấn để cấp lại quyền ghi nhanh vào thư mục cũ:\s*([\s\S]+)$/i);
      if (mReconnectFolder) {
        const folderName = mReconnectFolder[1];
        const map = {
          en: `Click to re-grant write permission to previous folder: ${folderName}`,
          'zh-CN': `点击重新授予旧文件夹写入权限：${folderName}`,
          'zh-TW': `點擊重新授予舊資料夾寫入權限：${folderName}`,
          ko: `이전 폴더에 쓰기 권한을 다시 부여하려면 클릭하세요: ${folderName}`,
          ja: `クリックして以前のフォルダへの書き込み権限を再付与：${folderName}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 4. Thông báo điểm danh: (✨ )?📅 Đã điểm danh ngày YYYY-MM-DD! Chuỗi hiện tại: X ngày liên tiếp.
      const mCheckinToast = norm.match(/^(?:✨\s*)?📅\s*Đã điểm danh ngày\s*(\S+)!\s*Chuỗi hiện tại:\s*(\d+)\s*ngày liên tiếp\.?$/i);
      if (mCheckinToast) {
        const [, dtKey, streakNum] = mCheckinToast;
        const hasSparkle = norm.startsWith('✨');
        const pfx = hasSparkle ? '✨ ' : '';
        const map = {
          en: `${pfx}📅 Checked in for ${dtKey}! Current streak: ${streakNum} consecutive days.`,
          'zh-CN': `${pfx}📅 已完成 ${dtKey} 打卡！当前连续打卡：${streakNum} 天。`,
          'zh-TW': `${pfx}📅 已完成 ${dtKey} 打卡！目前連續打卡：${streakNum} 天。`,
          ko: `${pfx}📅 ${dtKey} 출석 체크 완료! 현재 연속 기록: ${streakNum}일 연속.`,
          ja: `${pfx}📅 ${dtKey} の出席チェック完了！現在の連続記録：${streakNum}日連続。`
        };
        if (map[code]) return lead + this.reformatDatesInText(map[code], code) + trail;
      }

      // 5. Thông báo cập nhật KPI: (💡 )?🎯 Đã cập nhật mục tiêu KPI mỗi ngày: X từ/ngày.
      const mKpiToast = norm.match(/^(?:💡\s*)?🎯\s*Đã cập nhật mục tiêu KPI mỗi ngày:\s*([\d.,]+)\s*từ\/ngày\.?$/i);
      if (mKpiToast) {
        const [, targetWords] = mKpiToast;
        const hasBulb = norm.startsWith('💡');
        const pfx = hasBulb ? '💡 ' : '';
        const map = {
          en: `${pfx}🎯 Updated daily KPI target: ${targetWords} words/day.`,
          'zh-CN': `${pfx}🎯 已更新每日 KPI 目标：${targetWords} 字/天。`,
          'zh-TW': `${pfx}🎯 已更新每日 KPI 目標：${targetWords} 字/天。`,
          ko: `${pfx}🎯 일일 KPI 목표 업데이트 완료: ${targetWords}단어/일.`,
          ja: `${pfx}🎯 1日のKPI目標を更新しました：${targetWords}語/日。`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 6. Tiêu đề chương mặc định & chương mẫu: Hồi 1, Hồi 2, Hồi 3: (CHAPTER 3), Chương X: Chương mới
      const mNewChap = norm.match(/^Chương\s*(\d+)\s*:\s*Chương mới$/i);
      if (mNewChap) {
        const n = mNewChap[1];
        const map = {
          en: `Chapter ${n}: New Chapter`,
          'zh-CN': `第 ${n} 章：新章节`,
          'zh-TW': `第 ${n} 章：新章節`,
          ko: `제${n}장: 새 챕터`,
          ja: `第${n}章：新規章`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mHoiChap = norm.match(/^Hồi\s*(\d+)(?:\s*:\s*\(CHAPTER\s*(\d+)\))?$/i);
      if (mHoiChap) {
        const n = mHoiChap[1];
        const map = {
          en: `Chapter ${n}`,
          'zh-CN': `第 ${n} 章`,
          'zh-TW': `第 ${n} 章`,
          ko: `제${n}장`,
          ja: `第${n}章`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mBareChap = norm.match(/^Chương\s*(\d+)$/i);
      if (mBareChap) {
        const n = mBareChap[1];
        const map = {
          en: `Chapter ${n}`,
          'zh-CN': `第 ${n} 章`,
          'zh-TW': `第 ${n} 章`,
          ko: `제${n}장`,
          ja: `第${n}章`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 7. Thứ trong tuần + ngày giờ trên đồng hồ Mod 42 (Thứ Hai, 16/11/2026 12:17:15, GMT +7...)
      const mWeekdayClock = norm.match(/^(Chủ Nhật|Thứ Hai|Thứ Ba|Thứ Tư|Thứ Năm|Thứ Sáu|Thứ Bảy),\s*([\s\S]+)$/i);
      if (mWeekdayClock) {
        const wdRaw = mWeekdayClock[1];
        const restClock = this.translateText(mWeekdayClock[2], code);
        const wdKey = wdRaw.toLowerCase();
        const wdTable = {
          'chủ nhật': { en: 'Sun', 'zh-CN': '周日', 'zh-TW': '週日', ko: '일요일', ja: '日曜日' },
          'thứ hai': { en: 'Mon', 'zh-CN': '周一', 'zh-TW': '週一', ko: '월요일', ja: '月曜日' },
          'thứ ba': { en: 'Tue', 'zh-CN': '周二', 'zh-TW': '週二', ko: '화요일', ja: '火曜日' },
          'thứ tư': { en: 'Wed', 'zh-CN': '周三', 'zh-TW': '週三', ko: '수요일', ja: '水曜日' },
          'thứ năm': { en: 'Thu', 'zh-CN': '周四', 'zh-TW': '週四', ko: '목요일', ja: '木曜日' },
          'thứ sáu': { en: 'Fri', 'zh-CN': '周五', 'zh-TW': '週五', ko: '금요일', ja: '金曜日' },
          'thứ bảy': { en: 'Sat', 'zh-CN': '周六', 'zh-TW': '週六', ko: '토요일', ja: '土曜日' }
        };
        const wdTranslated = wdTable[wdKey]?.[code];
        if (wdTranslated) {
          return lead + `${wdTranslated}, ${this.reformatDatesInText(restClock, code)}` + trail;
        }
      }

      // 8. Huy hiệu Story Bible & Tab 4
      const mBiblePill = norm.match(/^Story Bible:\s*Đã nạp\s*\(([\d.,]+)\s*từ\s*•\s*(\d+)\s*NV\s*•\s*(\d+)\s*Phục bút\)$/i);
      if (mBiblePill) {
        const [, wCnt, cCnt, clCnt] = mBiblePill;
        const map = {
          en: `Story Bible: Loaded (${wCnt} words • ${cCnt} Chars • ${clCnt} Clues)`,
          'zh-CN': `设定集：已加载（${wCnt} 字 • ${cCnt} 角色 • ${clCnt} 伏笔）`,
          'zh-TW': `設定集：已載入（${wCnt} 字 • ${cCnt} 角色 • ${clCnt} 伏筆）`,
          ko: `스토리 바이블: 로드됨 (${wCnt}단어 • 캐릭터 ${cCnt} • 복선 ${clCnt})`,
          ja: `設定資料集：読込済（${wCnt}語 • キャラ${cCnt} • 伏線${clCnt}）`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mCustomWeatherBtn = norm.match(/^🎭\s*Background Thời Tiết Tùy Chỉnh\s*\((\d+)\s*·\s*([\s\S]+)\)$/i);
      if (mCustomWeatherBtn) {
        const [, wmoCode, phaseLabel] = mCustomWeatherBtn;
        const locPhase = this.translateText(phaseLabel.trim(), code);
        const map = {
          en: `🎭 Custom Weather Background (${wmoCode} · ${locPhase})`,
          'zh-CN': `🎭 自定义天气背景 (${wmoCode} · ${locPhase})`,
          'zh-TW': `🎭 自訂天氣背景 (${wmoCode} · ${locPhase})`,
          ko: `🎭 사용자 지정 날씨 배경 (${wmoCode} · ${locPhase})`,
          ja: `🎭 カスタム天気背景 (${wmoCode} · ${locPhase})`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 9. Entry Gate: "🔒 Còn thiếu: ... . Chỉ khi đủ cả 3 bước bạn mới được vào ứng dụng."
      const mGateMissing = norm.match(/^🔒\s*Còn thiếu:\s*([\s\S]+?)\.\s*Chỉ khi đủ cả 3 bước bạn mới được vào ứng dụng\.?$/i);
      if (mGateMissing) {
        const items = mGateMissing[1].split(/\s*\+\s*/).map((s) => this.translateText(s.trim(), code)).join(' + ');
        const map = {
          en: `🔒 Missing: ${items}. You can only enter the app once all 3 steps are complete.`,
          'zh-CN': `🔒 尚未完成：${items}。只有完成全部 3 个步骤后才能进入应用。`,
          'zh-TW': `🔒 尚未完成：${items}。只有完成全部 3 個步驟後才能進入應用。`,
          ko: `🔒 미완료: ${items}. 3단계를 모두 완료해야 앱에 입장할 수 있습니다.`,
          ja: `🔒 未完了：${items}。3つのステップをすべて完了するとアプリに入れます。`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 10. Floating Compact Bars close / reopen toasts (mod29)
      const mCloseBar = norm.match(/^Đã đóng ([\s\S]+?)\.\s*Bạn có thể mở lại bất cứ lúc nào ở ([\s\S]+?)\.?$/i);
      if (mCloseBar) {
        const barName = this.translateText(mCloseBar[1].trim(), code);
        const reopenPlace = this.translateText(mCloseBar[2].trim(), code);
        const map = {
          en: `Closed ${barName}. You can reopen it anytime in ${reopenPlace}.`,
          'zh-CN': `已关闭${barName}。您可以随时在${reopenPlace}重新打开。`,
          'zh-TW': `已關閉${barName}。您可以隨時在${reopenPlace}重新開啟。`,
          ko: `${barName}을(를) 닫았습니다. 언제든지 ${reopenPlace}에서 다시 열 수 있습니다.`,
          ja: `${barName}を閉じました。いつでも${reopenPlace}から再度開けます。`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mReopenBar = norm.match(/^✅\s*Đã bật lại ([\s\S]+?)!?$/i);
      if (mReopenBar) {
        const barName = this.translateText(mReopenBar[1].trim(), code);
        const map = {
          en: `✅ Reopened ${barName}!`,
          'zh-CN': `✅ 已重新开启${barName}！`,
          'zh-TW': `✅ 已重新開啟${barName}！`,
          ko: `✅ ${barName}을(를) 다시 열었습니다!`,
          ja: `✅ ${barName}を再表示しました！`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 11. Google API Key verification & HTTP error messages (mod15)
      const mGoogleReject = norm.match(/^(❌\s*)?Google từ chối API Key \(HTTP (\d+) tại (.+?)\):\s*([\s\S]+)$/i);
      if (mGoogleReject) {
        const prefix = mGoogleReject[1] ? '❌ ' : '';
        const [, , status, via, detailRaw] = mGoogleReject;
        const detail = this.translateText(detailRaw.trim(), code);
        const map = {
          en: `${prefix}Google rejected the API Key (HTTP ${status} via ${via}): ${detail}`,
          'zh-CN': `${prefix}Google 拒绝了 API Key（${via} HTTP ${status}）：${detail}`,
          'zh-TW': `${prefix}Google 拒絕了 API Key（${via} HTTP ${status}）：${detail}`,
          ko: `${prefix}Google이 API 키를 거부했습니다 (${via} HTTP ${status}): ${detail}`,
          ja: `${prefix}Google が API キーを拒否しました（${via} HTTP ${status}）：${detail}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mGooglePerm = norm.match(/^(❌\s*)?API Key chưa đủ quyền hoặc bị hạn chế \(HTTP (\d+) tại (.+?)\):\s*([\s\S]+)$/i);
      if (mGooglePerm) {
        const prefix = mGooglePerm[1] ? '❌ ' : '';
        const [, , status, via, detailRaw] = mGooglePerm;
        const map = {
          en: `${prefix}API Key lacks permissions or is restricted (HTTP ${status} via ${via}): ${detailRaw.trim()}`,
          'zh-CN': `${prefix}API Key 权限不足或受限（${via} HTTP ${status}）：${detailRaw.trim()}`,
          'zh-TW': `${prefix}API Key 權限不足或受限（${via} HTTP ${status}）：${detailRaw.trim()}`,
          ko: `${prefix}API 키 권한이 부족하거나 제한되었습니다 (${via} HTTP ${status}): ${detailRaw.trim()}`,
          ja: `${prefix}API キーの権限不足または制限されています（${via} HTTP ${status}）：${detailRaw.trim()}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mGoogle429 = norm.match(/^(❌\s*)?API Key hợp lệ nhưng đang hết hạn ngạch tạm thời \(HTTP (\d+) tại (.+?)\):\s*([\s\S]+)$/i);
      if (mGoogle429) {
        const prefix = mGoogle429[1] ? '❌ ' : '';
        const [, , status, via] = mGoogle429;
        const map = {
          en: `${prefix}API Key is valid but temporarily out of quota (HTTP ${status} via ${via}). Please wait 30–60s and verify again.`,
          'zh-CN': `${prefix}API Key 有效但暂时超出配额（${via} HTTP ${status}）。请等待 30–60 秒后重试验证。`,
          'zh-TW': `${prefix}API Key 有效但暫時超出配額（${via} HTTP ${status}）。請等待 30–60 秒後重試驗證。`,
          ko: `${prefix}API 키는 유효하지만 일시적으로 할당량이 초과되었습니다 (${via} HTTP ${status}). 30~60초 후 다시 인증해 주세요.`,
          ja: `${prefix}API キーは有効ですが一時的にクォータ上限に達しました（${via} HTTP ${status}）。30〜60秒後に再認証してください。`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mGoogle404 = norm.match(/^(❌\s*)?Không tìm thấy mô hình Flash-Lite khả dụng trên tài khoản \(HTTP (\d+) tại (.+?)\):\s*([\s\S]+)$/i);
      if (mGoogle404) {
        const prefix = mGoogle404[1] ? '❌ ' : '';
        const [, , status, via, detailRaw] = mGoogle404;
        const map = {
          en: `${prefix}No available Flash-Lite model found on this account (HTTP ${status} via ${via}): ${detailRaw.trim()}`,
          'zh-CN': `${prefix}此账号未找到可用的 Flash-Lite 模型（${via} HTTP ${status}）：${detailRaw.trim()}`,
          'zh-TW': `${prefix}此帳號未找到可用的 Flash-Lite 模型（${via} HTTP ${status}）：${detailRaw.trim()}`,
          ko: `${prefix}계정에서 사용 가능한 Flash-Lite 모델을 찾을 수 없습니다 (${via} HTTP ${status}): ${detailRaw.trim()}`,
          ja: `${prefix}このアカウントで利用可能な Flash-Lite モデルが見つかりません（${via} HTTP ${status}）：${detailRaw.trim()}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mGoogleErr = norm.match(/^(❌\s*)?Lỗi từ máy chủ Google \(HTTP (\d+) tại (.+?)\):\s*([\s\S]+)$/i);
      if (mGoogleErr) {
        const prefix = mGoogleErr[1] ? '❌ ' : '';
        const [, , status, via, detailRaw] = mGoogleErr;
        const map = {
          en: `${prefix}Google server error (HTTP ${status} via ${via}): ${detailRaw.trim()}`,
          'zh-CN': `${prefix}Google 服务器错误（${via} HTTP ${status}）：${detailRaw.trim()}`,
          'zh-TW': `${prefix}Google 伺服器錯誤（${via} HTTP ${status}）：${detailRaw.trim()}`,
          ko: `${prefix}Google 서버 오류 (${via} HTTP ${status}): ${detailRaw.trim()}`,
          ja: `${prefix}Google サーバーエラー（${via} HTTP ${status}）：${detailRaw.trim()}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mGoogleNet = norm.match(/^(❌\s*)?Không kết nối được tới máy chủ Google \(([^)]+)\)\.([\s\S]*)$/i);
      if (mGoogleNet) {
        const prefix = mGoogleNet[1] ? '❌ ' : '';
        const detail = mGoogleNet[2];
        const map = {
          en: `${prefix}Cannot reach Google server (${detail}). Please check your internet, VPN, or AdBlock.`,
          'zh-CN': `${prefix}无法连接到 Google 服务器（${detail}）。请检查网络、VPN 或广告拦截插件。`,
          'zh-TW': `${prefix}無法連線到 Google 伺服器（${detail}）。請檢查網路、VPN 或廣告攔截套件。`,
          ko: `${prefix}Google 서버에 연결할 수 없습니다 (${detail}). 인터넷, VPN 또는 광고 차단을 확인해 주세요.`,
          ja: `${prefix}Google サーバーに接続できません（${detail}）。ネットワーク、VPN、広告ブロックをご確認ください。`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mVerifyOk = norm.match(/^(✅\s*)?Kết nối Gemini API thành công \((\d+)ms\)\s*—\s*([\s\S]+)$/i);
      if (mVerifyOk) {
        const prefix = mVerifyOk[1] ? '✅ ' : '';
        const [, , ms, rest] = mVerifyOk;
        const map = {
          en: `${prefix}Gemini API connected (${ms}ms) — ${this.translateText(rest.trim(), code)}`,
          'zh-CN': `${prefix}Gemini API 连接成功（${ms}ms）— ${this.translateText(rest.trim(), code)}`,
          'zh-TW': `${prefix}Gemini API 連線成功（${ms}ms）— ${this.translateText(rest.trim(), code)}`,
          ko: `${prefix}Gemini API 연결 성공 (${ms}ms) — ${this.translateText(rest.trim(), code)}`,
          ja: `${prefix}Gemini API 接続成功（${ms}ms）— ${this.translateText(rest.trim(), code)}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 12. Billing Tier 403/429 Auto-Fallback & Chapter Hierarchy / Drag-Drop toasts
      const mFallback = norm.match(/^⚠️\s*Key của bạn hiện bị giới hạn với model ([^\s(]+)\s*\(HTTP (\d+)\),\s*đã tự động chuyển sang bản Flash \(([^)]+)\)!?$/i);
      if (mFallback) {
        const [, modelId, status, fallbackEp] = mFallback;
        const map = {
          en: `⚠️ Your API Key is restricted on model ${modelId} (HTTP ${status}); auto-switched to Flash (${fallbackEp})!`,
          'zh-CN': `⚠️ 您的密钥在模型 ${modelId} 上受限（HTTP ${status}），已自动切换至 Flash 版本（${fallbackEp}）！`,
          'zh-TW': `⚠️ 您的金鑰在模型 ${modelId} 上受限（HTTP ${status}），已自動切換至 Flash 版本（${fallbackEp}）！`,
          ko: `⚠️ API 키가 ${modelId} 모델에서 제한되어(HTTP ${status}) 자동으로 Flash(${fallbackEp})로 전환되었습니다!`,
          ja: `⚠️ APIキーはモデル ${modelId} で制限されているため（HTTP ${status}）、自動的に Flash（${fallbackEp}）へ切り替えました！`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mGroupChaps = norm.match(/^📚\s*Đã gộp (\d+) mục vào (Quyển|Chương|Cảnh):\s*"([^"]+)"!?$/i);
      if (mGroupChaps) {
        const [, cnt, lvl, grpName] = mGroupChaps;
        const lvlLoc = this.translateText(lvl, code);
        const map = {
          en: `📚 Grouped ${cnt} items into ${lvlLoc}: "${grpName}"!`,
          'zh-CN': `📚 已将 ${cnt} 项合并到${lvlLoc}：“${grpName}”！`,
          'zh-TW': `📚 已將 ${cnt} 項合併到${lvlLoc}：「${grpName}」！`,
          ko: `📚 ${cnt}개 항목을 ${lvlLoc} "${grpName}"에 병합했습니다!`,
          ja: `📚 ${cnt}件を${lvlLoc}「${grpName}」にまとめました！`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mDragChap = norm.match(/^🔀\s*Đã kéo "([^"]+)" tới vị trí #(\d+)!?$/i);
      if (mDragChap) {
        const [, title, pos] = mDragChap;
        const map = {
          en: `🔀 Moved "${title}" to position #${pos}!`,
          'zh-CN': `🔀 已将“${title}”拖动至第 #${pos} 位！`,
          'zh-TW': `🔀 已將「${title}」拖曳至第 #${pos} 位！`,
          ko: `🔀 "${title}"을(를) #${pos} 위치로 이동했습니다!`,
          ja: `🔀 「${title}」を #${pos} 番目に移動しました！`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mPresetInsert = norm.match(/^✨\s*Đã chèn mẫu lệnh:\s*"([^"]+)"!?$/i);
      if (mPresetInsert) {
        const [, pname] = mPresetInsert;
        const map = {
          en: `✨ Inserted prompt template: "${pname}"!`,
          'zh-CN': `✨ 已插入指令模板：“${pname}”！`,
          'zh-TW': `✨ 已插入指令範本：「${pname}」！`,
          ko: `✨ 프롬프트 템플릿 삽입됨: "${pname}"!`,
          ja: `✨ プロンプトテンプレートを挿入しました：「${pname}」！`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mAiRunErr = norm.match(/^❌\s*Lỗi khi chạy ([^:]+):\s*([\s\S]+)$/i);
      if (mAiRunErr) {
        const [, modeLabel, errDetail] = mAiRunErr;
        const map = {
          en: `❌ Error running ${this.translateText(modeLabel.trim(), code)}: ${errDetail.trim()}`,
          'zh-CN': `❌ 运行${this.translateText(modeLabel.trim(), code)}出错：${errDetail.trim()}`,
          'zh-TW': `❌ 執行${this.translateText(modeLabel.trim(), code)}出錯：${errDetail.trim()}`,
          ko: `❌ ${this.translateText(modeLabel.trim(), code)} 실행 오류: ${errDetail.trim()}`,
          ja: `❌ ${this.translateText(modeLabel.trim(), code)}の実行エラー：${errDetail.trim()}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      // 13. Bộ đếm chương/từ Tab 6, tiêu đề trang động (— Noir Studio), và nhãn Cục bộ (Ngoại tuyến)
      const mChapWordCnt = norm.match(/^(\d+)\s*chương\s*\(([\d.,]+)\s*từ\)$/i);
      if (mChapWordCnt) {
        const [, chN, wdN] = mChapWordCnt;
        const map = {
          en: `${chN} chapters (${wdN} words)`,
          'zh-CN': `${chN} 章（${wdN} 字）`,
          'zh-TW': `${chN} 章（${wdN} 字）`,
          ko: `${chN}장 (${wdN}단어)`,
          ja: `${chN}章（${wdN}語）`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mChapAppWord = norm.match(/^(\d+)\s*chương\s*\((\d+)\s*đã duyệt\)\s*·\s*([\d.,]+)\s*từ đã viết$/i);
      if (mChapAppWord) {
        const [, chN, appN, wdN] = mChapAppWord;
        const map = {
          en: `${chN} chapters (${appN} approved) · ${wdN} words written`,
          'zh-CN': `${chN} 章（已审 ${appN} 章）· 已写 ${wdN} 字`,
          'zh-TW': `${chN} 章（已審 ${appN} 章）· 已寫 ${wdN} 字`,
          ko: `${chN}장 (${appN} 승인) · ${wdN}단어 작성`,
          ja: `${chN}章（承認済 ${appN}）· ${wdN}語執筆済`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mNoirDocTitle = norm.match(/^(.+?)\s*—\s*Noir Studio$/i);
      if (mNoirDocTitle) {
        const prefixTr = this.translateText(mNoirDocTitle[1].trim(), code);
        if (prefixTr && prefixTr !== mNoirDocTitle[1].trim()) {
          return lead + `${prefixTr} — Noir Studio` + trail;
        }
      }

      const mLocalOfflineBadge = norm.match(/^🟡\s*Cục bộ \(Ngoại tuyến\)(?:\s*·\s*(\d+)\s*tab)?$/i);
      if (mLocalOfflineBadge) {
        const tabPart = mLocalOfflineBadge[1] ? ` · ${mLocalOfflineBadge[1]} tab` : '';
        const map = {
          en: `🟡 Local (Offline)${tabPart}`,
          'zh-CN': `🟡 本地（离线）${tabPart}`,
          'zh-TW': `🟡 本機（離線）${tabPart}`,
          ko: `🟡 로컬 (오프라인)${tabPart}`,
          ja: `🟡 ローカル（オフライン）${tabPart}`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      const mModReady = norm.match(/^🛡️\s*(\d+)\/(\d+)\s*Module Sẵn Sàng$/i);
      if (mModReady) {
        const [, okN, totN] = mModReady;
        const map = {
          en: `🛡️ ${okN}/${totN} Modules Ready`,
          'zh-CN': `🛡️ ${okN}/${totN} 模块就绪`,
          'zh-TW': `🛡️ ${okN}/${totN} 模組就緒`,
          ko: `🛡️ ${okN}/${totN} 모듈 준비됨`,
          ja: `🛡️ ${okN}/${totN} モジュール稼働中`
        };
        if (map[code]) return lead + map[code] + trail;
      }

      if (Array.isArray(pack.patterns)) {
        for (let i = 0; i < pack.patterns.length; i++) {
          const rule = pack.patterns[i];
          if (!rule || !rule[0]) continue;
          const regex = rule[0];
          const repl = rule[1];
          if (regex instanceof RegExp) regex.lastIndex = 0;
          if (regex.test(norm)) {
            if (regex instanceof RegExp) regex.lastIndex = 0;
            const replaced = typeof repl === 'function' ? norm.replace(regex, repl) : norm.replace(regex, repl);
            const finalOut = sourceHasViOrToken ? this.reformatDatesInText(replaced, code) : replaced;
            return lead + finalOut + trail;
          }
        }
      }

      const phrases = this.getPreparedPhrases(code, pack);
      if (phrases.length > 0 && /[À-ỹ]/.test(norm)) {
        let out = norm;
        let touched = false;
        for (let i = 0; i < phrases.length; i++) {
          const srcPhrase = phrases[i][0];
          const dstPhrase = phrases[i][1];
          if (out.includes(srcPhrase)) {
            out = out.split(srcPhrase).join(dstPhrase);
            touched = true;
          }
        }
        if (touched) return lead + this.reformatDatesInText(out, code) + trail;
      }

      // Chuyển định dạng ngày DD/MM/YYYY độc lập (hoặc trong chuỗi có tiếng Việt) sang chuẩn quốc gia
      if (/^\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/.test(norm) || sourceHasViOrToken) {
        const converted = this.reformatDatesInText(norm, code);
        if (converted !== norm) {
          return lead + converted + trail;
        }
      }

      return rawText;
    }

    translatePromptFrame(rawText, code = this.currentLang) {
      if (typeof rawText !== 'string' || !rawText || !code || code === 'vi') return rawText;
      const pack = this.getPack(code);
      if (!pack) return rawText;

      const promptExact = pack.promptExact || {};
      const promptPatterns = Array.isArray(pack.promptPatterns) ? pack.promptPatterns : [];
      const uiExact = pack.exact || {};
      const uiPatterns = Array.isArray(pack.patterns) ? pack.patterns : [];

      const lines = rawText.split(/\r?\n/);
      let changed = false;

      const trInline = (val) => {
        const s = String(val ?? '');
        if (!s) return s;
        if (Object.prototype.hasOwnProperty.call(promptExact, s)) return promptExact[s];
        if (Object.prototype.hasOwnProperty.call(uiExact, s)) return uiExact[s];
        const viaUi = this.translateText(s, code);
        if (viaUi !== s) return viaUi;
        return s;
      };

      const outLines = lines.map((line) => {
        if (!line || !line.trim()) return line;
        const m = line.match(/^([ \t]*)([\s\S]*?)([ \t]*)$/);
        const lead = m ? m[1] : '';
        const core = m ? m[2] : line;
        const trail = m ? m[3] : '';
        if (!core) return line;

        if (Object.prototype.hasOwnProperty.call(promptExact, core)) {
          changed = true;
          return lead + this.reformatDatesInText(promptExact[core], code) + trail;
        }
        if (Object.prototype.hasOwnProperty.call(uiExact, core)) {
          changed = true;
          return lead + this.reformatDatesInText(uiExact[core], code) + trail;
        }

        for (let i = 0; i < promptPatterns.length; i++) {
          const rule = promptPatterns[i];
          if (!rule || !rule[0]) continue;
          const rx = rule[0];
          const repl = rule[1];
          if (rx instanceof RegExp) rx.lastIndex = 0;
          if (rx.test(core)) {
            if (rx instanceof RegExp) rx.lastIndex = 0;
            const replaced =
              typeof repl === 'function'
                ? core.replace(rx, (...args) => repl(...args, trInline))
                : core.replace(rx, repl);
            changed = true;
            return lead + this.reformatDatesInText(replaced, code) + trail;
          }
        }

        for (let i = 0; i < uiPatterns.length; i++) {
          const rule = uiPatterns[i];
          if (!rule || !rule[0]) continue;
          const rx = rule[0];
          const repl = rule[1];
          if (rx instanceof RegExp) rx.lastIndex = 0;
          if (rx.test(core)) {
            if (rx instanceof RegExp) rx.lastIndex = 0;
            const replaced = typeof repl === 'function' ? core.replace(rx, repl) : core.replace(rx, repl);
            changed = true;
            return lead + this.reformatDatesInText(replaced, code) + trail;
          }
        }

        const viaText = this.translateText(core, code);
        if (viaText !== core) {
          changed = true;
          return lead + viaText + trail;
        }

        return line;
      });

      return changed ? outLines.join('\n') : rawText;
    }

    syncDefaultInputValues() {
      if (typeof document === 'undefined') return;
      const povDefault = 'Ngôi thứ 3 giới hạn (Theo sát nhân vật chính)';
      const inputs = Array.from(document.querySelectorAll('input[data-i18n-default-value], #select-scene-pov'));
      const seen = new Set();
      inputs.forEach((el) => {
        if (!el || seen.has(el)) return;
        seen.add(el);
        const orig = el.getAttribute('data-i18n-default-value') || (el.id === 'select-scene-pov' ? povDefault : '');
        if (!orig) return;
        if (!el.hasAttribute('data-i18n-default-value')) {
          el.setAttribute('data-i18n-default-value', orig);
        }
        const cur = String(el.value || '').trim();
        let isKnownDefault = cur === orig;
        if (!isKnownDefault && cur) {
          for (let i = 0; i < this.packOrder.length; i++) {
            const c = this.packOrder[i];
            if (this.translateText(orig, c) === cur) {
              isKnownDefault = true;
              break;
            }
          }
        }
        if (isKnownDefault) {
          const nextVal = this.currentLang === 'vi' ? orig : this.translateText(orig, this.currentLang);
          if (el.value !== nextVal) {
            el.value = nextVal;
          }
        }
      });

      const bibleTextareas = [
        'textarea-bible-template-frame',
        'textarea-rendered-bible-content',
        'input-bible-anti-cliche',
        'textarea-anti-cliche-blacklist',
        'textarea-tab4-notebooklm-prompt'
      ];
      bibleTextareas.forEach((id) => {
        const ta = document.getElementById(id);
        if (!ta || typeof ta.value !== 'string') return;
        const curVal = ta.value;
        if (!curVal.trim()) return;
        if (!ta._i18nViSource || (this.currentLang === 'vi' && curVal !== ta._i18nLastApplied)) {
          ta._i18nViSource = curVal;
        }
        if (this.currentLang === 'vi') {
          if (ta._i18nViSource && ta.value !== ta._i18nViSource) {
            ta.value = ta._i18nViSource;
          }
          ta._i18nLastApplied = ta.value;
          return;
        }
        if (curVal !== ta._i18nLastApplied && curVal !== ta._i18nViSource) {
          ta._i18nViSource = curVal;
        }
        const srcText = ta._i18nViSource || curVal;
        const nextText = this.translatePromptFrame(srcText, this.currentLang);
        if (ta.value !== nextText) {
          ta.value = nextText;
        }
        ta._i18nLastApplied = ta.value;
      });
    }

    isExcludedTextNode(textNode) {
      if (!textNode || !textNode.parentElement) return true;
      const parentEl = textNode.parentElement;
      if (parentEl.closest && parentEl.closest(this.excludedSelector)) return true;
      return false;
    }

    isExcludedAttrElement(el) {
      if (!el || el.nodeType !== 1) return true;
      if (el.closest && el.closest(this.attrExcludedSelector)) return true;
      return false;
    }

    processTextNode(textNode) {
      if (!textNode || textNode.nodeType !== 3 || !this.origTextMap) return;
      if (this.isExcludedTextNode(textNode)) return;

      const currentVal = textNode.nodeValue;
      let entry = this.origTextMap.get(textNode);

      if (this.currentLang === 'vi') {
        if (entry) {
          if (currentVal !== entry.lastApplied && currentVal !== entry.src) {
            entry.src = currentVal;
          }
          if (textNode.nodeValue !== entry.src) {
            textNode.nodeValue = entry.src;
          }
          entry.lastApplied = entry.src;
        }
        return;
      }

      if (!entry) {
        entry = { src: currentVal, lastApplied: currentVal };
        this.origTextMap.set(textNode, entry);
      } else if (currentVal !== entry.lastApplied) {
        // Code runtime mới vừa ghi chuỗi Tiếng Việt mới vào node -> cập nhật bản gốc
        entry.src = currentVal;
      }

      const targetVal = this.translateText(entry.src, this.currentLang);
      if (textNode.nodeValue !== targetVal) {
        textNode.nodeValue = targetVal;
      }
      entry.lastApplied = textNode.nodeValue;
    }

    processElementAttributes(el) {
      if (!el || el.nodeType !== 1 || !this.origAttrMap) return;
      if (this.isExcludedAttrElement(el)) return;

      let attrStore = this.origAttrMap.get(el);
      if (!attrStore) {
        attrStore = {};
        this.origAttrMap.set(el, attrStore);
      }

      for (let i = 0; i < this.translatableAttrs.length; i++) {
        const attrName = this.translatableAttrs[i];
        if (!el.hasAttribute(attrName)) continue;
        const currentAttr = el.getAttribute(attrName);
        if (currentAttr === null) continue;

        let rec = attrStore[attrName];
        if (this.currentLang === 'vi') {
          if (rec) {
            if (currentAttr !== rec.lastApplied && currentAttr !== rec.src) {
              rec.src = currentAttr;
            }
            if (currentAttr !== rec.src) {
              el.setAttribute(attrName, rec.src);
            }
            rec.lastApplied = rec.src;
          }
          continue;
        }

        if (!rec) {
          rec = { src: currentAttr, lastApplied: currentAttr };
          attrStore[attrName] = rec;
        } else if (currentAttr !== rec.lastApplied) {
          rec.src = currentAttr;
        }

        const nextAttr = this.translateText(rec.src, this.currentLang);
        if (currentAttr !== nextAttr) {
          el.setAttribute(attrName, nextAttr);
        }
        rec.lastApplied = el.getAttribute(attrName);
      }
    }

    syncDocumentTitle() {
      if (typeof document === 'undefined') return;
      const curTitle = document.title || '';
      if (!this.origDocTitle) {
        this.origDocTitle = curTitle;
        this.lastAppliedDocTitle = curTitle;
      }
      if (this.currentLang === 'vi') {
        if (curTitle !== this.lastAppliedDocTitle && curTitle !== this.origDocTitle) {
          this.origDocTitle = curTitle;
        }
        if (document.title !== this.origDocTitle) {
          document.title = this.origDocTitle;
        }
        this.lastAppliedDocTitle = document.title;
        return;
      }
      if (curTitle !== this.lastAppliedDocTitle) {
        this.origDocTitle = curTitle;
      }
      const nextTitle = this.translateText(this.origDocTitle, this.currentLang);
      if (document.title !== nextTitle) {
        document.title = nextTitle;
      }
      this.lastAppliedDocTitle = document.title;
    }

    translateSubtree(rootEl) {
      if (typeof document === 'undefined' || !rootEl) return;
      if (rootEl.nodeType === 3) {
        this.processTextNode(rootEl);
        return;
      }
      if (rootEl.nodeType !== 1) return;
      if (this.isExcludedAttrElement(rootEl)) return;

      if (
        rootEl.hasAttribute('placeholder') ||
        rootEl.hasAttribute('title') ||
        rootEl.hasAttribute('aria-label') ||
        rootEl.hasAttribute('data-noir-hover-title')
      ) {
        this.processElementAttributes(rootEl);
      }

      if (
        rootEl.hasAttribute('data-i18n-active-name') ||
        (rootEl.matches && rootEl.matches(this.excludedSelector))
      ) {
        return;
      }

      if (typeof document.createTreeWalker !== 'function') return;

      const SHOW_ELEMENT = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_ELEMENT : 1;
      const SHOW_TEXT = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;
      const FILTER_ACCEPT = typeof NodeFilter !== 'undefined' ? NodeFilter.FILTER_ACCEPT : 1;
      const FILTER_REJECT = typeof NodeFilter !== 'undefined' ? NodeFilter.FILTER_REJECT : 2;
      const FILTER_SKIP = typeof NodeFilter !== 'undefined' ? NodeFilter.FILTER_SKIP : 3;

      const self = this;
      const walker = document.createTreeWalker(rootEl, SHOW_ELEMENT | SHOW_TEXT, {
        acceptNode(node) {
          if (node.nodeType === 1) {
            const tag = node.tagName;
            if (
              tag === 'SCRIPT' ||
              tag === 'STYLE' ||
              tag === 'NOSCRIPT' ||
              tag === 'SVG' ||
              tag === 'TEMPLATE'
            ) {
              return FILTER_REJECT;
            }
            if (
              node.id === 'bi-i18n-floating-popover' ||
              node.id === 'mod28-live-mirror-scale-wrapper' ||
              node.hasAttribute('data-i18n-ignore') ||
              (node.classList && node.classList.contains('live-mini-ui-stage'))
            ) {
              return FILTER_REJECT;
            }
            if (
              node.hasAttribute('placeholder') ||
              node.hasAttribute('title') ||
              node.hasAttribute('aria-label') ||
              node.hasAttribute('data-noir-hover-title')
            ) {
              self.processElementAttributes(node);
            }
            if (
              tag === 'TEXTAREA' ||
              tag === 'CODE' ||
              tag === 'PRE' ||
              node.isContentEditable ||
              node.hasAttribute('data-i18n-active-name') ||
              (node.matches && node.matches(self.excludedSelector))
            ) {
              return FILTER_REJECT;
            }
            return FILTER_SKIP;
          }
          if (node.nodeType === 3) {
            if (!node.nodeValue || !node.nodeValue.trim()) {
              return FILTER_SKIP;
            }
            return FILTER_ACCEPT;
          }
          return FILTER_SKIP;
        },
      });

      let textNode = walker.nextNode();
      while (textNode) {
        this.processTextNode(textNode);
        textNode = walker.nextNode();
      }
    }

    translateElement(rootEl) {
      if (typeof document === 'undefined' || !rootEl || this.currentLang === 'vi' || this.isApplying) {
        return false;
      }
      this.isApplying = true;
      try {
        this.translateSubtree(rootEl);
        this.syncDefaultInputValues();
      } finally {
        this.isApplying = false;
      }
      return true;
    }

    syncTriggerLabels() {
      if (typeof document === 'undefined') return;
      const meta = this.getMeta(this.currentLang);
      document.querySelectorAll('[data-i18n-active-name]').forEach((el) => {
        const mode = el.getAttribute('data-i18n-active-name');
        el.textContent = mode === 'short' ? meta.shortLabel : meta.nativeName;
      });
      document.querySelectorAll('[data-i18n-trigger="true"]').forEach((btn) => {
        btn.setAttribute('data-i18n-current', meta.code);
      });
      document.documentElement.lang = meta.htmlLang || 'vi';
      document.documentElement.dataset.uiLang = meta.code;
      this.renderPopoverOptions();
    }

    refreshDom(rootEl = null) {
      if (typeof document === 'undefined' || this.isApplying) return;
      this.isApplying = true;
      try {
        const target = rootEl || document.body;
        if (target) this.translateSubtree(target);
        this.syncDefaultInputValues();
        this.syncDocumentTitle();
        this.syncTriggerLabels();
      } finally {
        this.isApplying = false;
      }
    }

    ensurePopoverMounted() {
      if (typeof document === 'undefined') return null;
      if (this.popoverEl && document.body.contains(this.popoverEl)) {
        return this.popoverEl;
      }
      const box = document.createElement('div');
      box.id = 'bi-i18n-floating-popover';
      box.setAttribute('data-i18n-ignore', 'true');
      box.setAttribute('role', 'listbox');
      box.setAttribute('aria-label', 'Language Selector');
      box.className = 'hidden fixed z-[155] w-[260px] max-w-[calc(100vw-16px)] max-h-[75vh] overflow-y-auto rounded-2xl border border-sky-500/45 bg-zinc-950/95 backdrop-blur-xl text-zinc-100 shadow-2xl shadow-black/70 p-2 space-y-1';
      document.body.appendChild(box);
      this.popoverEl = box;
      this.renderPopoverOptions();
      return box;
    }

    renderPopoverOptions() {
      if (!this.popoverEl) return;
      const langs = this.getSupportedLanguages();
      const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const cfg = this.getLocaleConfig(this.currentLang);
      const headerHtml =
        '<div class="px-2.5 py-1.5 border-b border-zinc-800 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-sky-300">' +
        '<span>' + esc(cfg.languageHeader || '🌐 Language') + '</span>' +
        '<span class="text-zinc-400 font-mono">6</span>' +
        '</div>';
      const itemsHtml = langs
        .map((m) => {
          const isActive = m.code === this.currentLang;
          const activeCls = isActive
            ? 'border-sky-400/75 bg-sky-500/20 text-white'
            : 'border-transparent hover:border-zinc-700 hover:bg-zinc-900/90 text-zinc-200';
          return (
            '<button type="button" data-i18n-select="' + esc(m.code) + '" role="option" aria-selected="' + (isActive ? 'true' : 'false') + '" ' +
            'class="w-full px-2.5 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition text-xs cursor-pointer ' + activeCls + '">' +
            '<span class="flex items-center gap-2 min-w-0">' +
            '<span class="text-base shrink-0" aria-hidden="true">' + esc(m.flag) + '</span>' +
            '<span class="font-bold truncate">' + esc(m.nativeName) + '</span>' +
            '</span>' +
            '<span class="text-[10px] font-monoCode px-1.5 py-0.5 rounded bg-zinc-800/90 text-sky-300 shrink-0">' +
            (isActive ? '✓ ' : '') + esc(m.shortLabel) +
            '</span>' +
            '</button>'
          );
        })
        .join('');
      this.popoverEl.innerHTML = headerHtml + itemsHtml;
    }

    positionPopover(triggerEl) {
      if (!this.popoverEl || !triggerEl || typeof window === 'undefined') return;
      const rect = triggerEl.getBoundingClientRect();
      const vw = window.innerWidth || 360;
      const vh = window.innerHeight || 640;
      const popWidth = Math.min(260, vw - 16);
      this.popoverEl.style.width = `${popWidth}px`;
      let left = rect.right - popWidth;
      if (left < 8) left = Math.max(8, rect.left);
      if (left + popWidth > vw - 8) left = Math.max(8, vw - popWidth - 8);
      this.popoverEl.style.left = `${Math.round(left)}px`;

      const popRect = this.popoverEl.getBoundingClientRect();
      const estH = popRect.height || 270;
      let top = rect.bottom + 6;
      if (top + estH > vh - 10 && rect.top - estH - 6 >= 10) {
        top = rect.top - estH - 6;
      } else if (top + estH > vh - 10) {
        top = Math.max(8, vh - estH - 10);
      }
      this.popoverEl.style.top = `${Math.round(top)}px`;
    }

    openPopover(triggerEl) {
      const box = this.ensurePopoverMounted();
      if (!box) return;
      this.activeTriggerEl = triggerEl || null;
      this.renderPopoverOptions();
      box.classList.remove('hidden');
      this.positionPopover(triggerEl);
      document.querySelectorAll('[data-i18n-trigger="true"]').forEach((btn) => {
        btn.setAttribute('aria-expanded', btn === triggerEl ? 'true' : 'false');
      });
    }

    closePopover() {
      if (this.popoverEl) {
        this.popoverEl.classList.add('hidden');
      }
      document.querySelectorAll('[data-i18n-trigger="true"]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
      });
      this.activeTriggerEl = null;
    }

    togglePopover(triggerEl) {
      const box = this.ensurePopoverMounted();
      if (!box) return;
      const isHidden = box.classList.contains('hidden');
      if (isHidden || this.activeTriggerEl !== triggerEl) {
        this.openPopover(triggerEl);
      } else {
        this.closePopover();
      }
    }

    scheduleClickTranslation(sourceTarget = null) {
      if (this.currentLang === 'vi' || typeof document === 'undefined') return;
      const runSweep = () => {
        if (this.currentLang === 'vi' || this.isApplying) return;
        const roots = [];
        if (sourceTarget && sourceTarget.nodeType === 1) {
          const localContainer =
            sourceTarget.closest('[role="dialog"], details, section, #entry-connection-gate, #main-studio-screens-root') ||
            null;
          if (localContainer) roots.push(localContainer);
        }
        document.querySelectorAll('[role="dialog"]:not(.hidden), .fixed:not(.hidden)').forEach((modalEl) => {
          if (modalEl.id === 'bi-i18n-floating-popover') return;
          if (!roots.includes(modalEl)) roots.push(modalEl);
        });
        if (roots.length === 0 && document.body) {
          roots.push(document.body);
        }
        for (let i = 0; i < roots.length; i++) {
          this.translateElement(roots[i]);
        }
      };
      if (typeof globalScope.requestAnimationFrame === 'function') {
        globalScope.requestAnimationFrame(runSweep);
      } else {
        setTimeout(runSweep, 16);
      }
      if (this._clickTranslateTimer) clearTimeout(this._clickTranslateTimer);
      this._clickTranslateTimer = setTimeout(() => {
        this._clickTranslateTimer = null;
        runSweep();
      }, 220);
    }

    setLanguage(code, options = {}) {
      const targetCode = code === 'vi' || this.getPack(code) ? code : 'vi';
      this.currentLang = targetCode;
      this.saveStoredLang(targetCode);
      this.emitLanguageChanged(targetCode);
      this.refreshDom(document.body);
      if (!options.keepPopoverOpen) {
        this.closePopover();
      }
      if (!options.silentToast && NS.uiUtils?.showToast) {
        const meta = this.getMeta(targetCode);
        NS.uiUtils.showToast(`${meta.flag} ${meta.nativeName}`, 'success', 1800);
      }
      return targetCode;
    }

    attachDomObserver() {
      // Đã ngắt bỏ MutationObserver liên tục để loại bỏ giật lag khi gõ chữ & tick đồng hồ.
      // Quá trình dịch chỉ chạy đúng lúc bấm đổi ngôn ngữ hoặc khi mở modal/khối động lúc đang chọn ngoại ngữ.
      this.observer = null;
      this.observerDisabled = true;
    }

    bindGlobalEvents() {
      if (typeof document === 'undefined' || document.body?.dataset?.noirI18nBound) return;
      if (document.body) document.body.dataset.noirI18nBound = '1';

      document.addEventListener('click', (ev) => {
        const selectBtn = ev.target?.closest?.('[data-i18n-select]');
        if (selectBtn) {
          ev.preventDefault();
          ev.stopPropagation();
          const chosen = selectBtn.getAttribute('data-i18n-select') || 'vi';
          this.setLanguage(chosen);
          return;
        }
        const triggerBtn = ev.target?.closest?.('[data-i18n-trigger="true"]');
        if (triggerBtn) {
          ev.preventDefault();
          ev.stopPropagation();
          this.togglePopover(triggerBtn);
          return;
        }
        if (this.popoverEl && !this.popoverEl.classList.contains('hidden')) {
          if (!this.popoverEl.contains(ev.target)) {
            this.closePopover();
          }
        }
        if (this.currentLang !== 'vi') {
          const t = ev.target;
          const isEditor =
            t &&
            (t.tagName === 'TEXTAREA' ||
              t.isContentEditable ||
              t.closest?.('#textarea-chapter-content, #scratchpad-textarea, #tab4-story-bible-content'));
          if (!isEditor) {
            this.scheduleClickTranslation(t);
          }
        }
      });

      document.addEventListener('change', (ev) => {
        if (this.currentLang === 'vi') return;
        const t = ev.target;
        if (t && (t.tagName === 'SELECT' || t.type === 'checkbox' || t.type === 'radio')) {
          this.scheduleClickTranslation(t);
        }
      });

      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && this.popoverEl && !this.popoverEl.classList.contains('hidden')) {
          this.closePopover();
        }
      });

      globalScope.addEventListener('resize', () => {
        if (this.popoverEl && !this.popoverEl.classList.contains('hidden') && this.activeTriggerEl) {
          this.positionPopover(this.activeTriggerEl);
        }
      });
    }

    inspectStatus() {
      return {
        currentLang: this.currentLang,
        supported: this.getSupportedLanguages().map((m) => m.code),
        loadedPacksCount: this.packOrder.filter((c) => Boolean(this.getPack(c))).length,
        initialized: this.initialized,
        observerDisabled: true,
      };
    }

    emitLanguageChanged(code = this.currentLang) {
      const payload = { lang: code, meta: this.getMeta(code), locale: this.getLocaleConfig(code) };
      if (NS.bus && typeof NS.bus.emit === 'function') {
        NS.bus.emit('i18n:changed', payload);
      }
      if (NS.eventBus && NS.eventBus !== NS.bus && typeof NS.eventBus.emit === 'function') {
        NS.eventBus.emit('i18n:changed', payload);
      }
      if (typeof globalScope.dispatchEvent === 'function' && typeof globalScope.CustomEvent === 'function') {
        try {
          globalScope.dispatchEvent(new globalScope.CustomEvent('noir:i18n:changed', { detail: payload }));
        } catch (_evErr) {}
      }
    }

    init() {
      if (typeof document === 'undefined') return this.inspectStatus();
      const firstInit = !this.initialized;
      if (!this.initialized) {
        this.initialized = true;
        this.origDocTitle = document.title || '';
        this.lastAppliedDocTitle = this.origDocTitle;
        this.currentLang = this.readStoredLang();
        this.ensurePopoverMounted();
        this.bindGlobalEvents();
      }
      if (this.currentLang !== 'vi') {
        this.emitLanguageChanged(this.currentLang);
        this.refreshDom(document.body);
        if (firstInit) {
          setTimeout(() => {
            if (this.currentLang !== 'vi' && document.body) {
              this.refreshDom(document.body);
            }
          }, 180);
        }
      } else {
        this.syncDocumentTitle();
        this.syncTriggerLabels();
      }
      return this.inspectStatus();
    }
  }

  const backupCadenceMonitor = new SessionBackupCadenceMonitor(30);
  const watchdogAndShortcuts = new ModuleWatchdogAndShortcutAuditor();
  const i18nController = new NoirMultiLanguageController();

  const workflowVerifier = new EndToEndWorkflowReadinessVerifier();
  const offlineAssetInspector = new OfflineReadinessAndAssetInspector();

  const masterBootloader = new MasterStudioBootloader();
  masterBootloader.workflowVerifier = workflowVerifier;
  masterBootloader.offlineAssetInspector = offlineAssetInspector;
  masterBootloader.watchdogAndShortcuts = watchdogAndShortcuts;
  masterBootloader.backupCadenceMonitor = backupCadenceMonitor;

  masterBootloader.verifyEndToEndWorkflows = () =>
    workflowVerifier.verifyAllCriticalWorkflows();

  masterBootloader.generateHumanReadableStatusSummary = () =>
    offlineAssetInspector.formatHumanReadableBootReport(masterBootloader);

  masterBootloader.inspectOfflineAssets = () =>
    offlineAssetInspector.inspectOfflineAssets();

  masterBootloader.inspectKeyboardShortcutMap = () =>
    watchdogAndShortcuts.getShortcutAllocationTable();

  masterBootloader.detectSlowBootPhases = (thresholdMs = 350) =>
    watchdogAndShortcuts.detectSlowBootPhases(
      masterBootloader.telemetryLedger.getSummaryReport(),
      thresholdMs
    );

  masterBootloader.exportDiagnosticBundleHtml = () =>
    watchdogAndShortcuts.buildPortableDiagnosticHtmlCard(masterBootloader);

  NS.THIRTY_MODULES_CONTRACT = THIRTY_MODULES_CONTRACT_REGISTRY;
  NS.CRITICAL_DOM_INVENTORY_IDS = CRITICAL_DOM_INVENTORY_IDS;
  NS.CrossModuleActionBridgeBinder = CrossModuleActionBridgeBinder;
  NS.SystemIntegrityAuditorEngine = SystemIntegrityAuditorEngine;
  NS.PhasedDependencyOrchestrator = PhasedDependencyOrchestrator;
  NS.CrossModuleContractVerifier = CrossModuleContractVerifier;
  NS.OverhaulRegressionGuardSuite = OverhaulRegressionGuardSuite;
  NS.EndToEndWorkflowReadinessVerifier = EndToEndWorkflowReadinessVerifier;
  NS.OfflineReadinessAndAssetInspector = OfflineReadinessAndAssetInspector;
  NS.ModuleWatchdogAndShortcutAuditor = ModuleWatchdogAndShortcutAuditor;
  NS.NoirMultiLanguageController = NoirMultiLanguageController;
  NS.i18n = i18nController;
  if (typeof globalThis !== 'undefined') globalThis.NoirNovel = globalThis.NoirStudio = NS;
  if (typeof window !== 'undefined') window.NoirNovel = window.NoirStudio = NS;
  NS.MasterStudioBootloader = MasterStudioBootloader;
  NS.EntryConnectionGateController = EntryConnectionGateController;
  NS.connectionGate = masterBootloader.connectionGate;
  NS.bootloader = masterBootloader;
  NS.runIntegrityAudit = () => masterBootloader.runIntegrityAudit();

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod30', masterBootloader);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        masterBootloader.boot();
      });
    } else {
      masterBootloader.boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
