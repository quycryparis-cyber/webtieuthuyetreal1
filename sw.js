/**
 * ============================================================================
 * ✍️ SỔ TAY TIỂU THUYẾT CỦA BI — PROGRESSIVE WEB APP SERVICE WORKER (v38.0)
 * ============================================================================
 * Hỗ trợ chạy ứng dụng mượt mà trên cả Điện thoại (iOS / Android) và Máy tính
 * (Windows / macOS / Linux) ngay cả khi mất kết nối mạng.
 * ============================================================================
 */
const CACHE_NAME = 'bi-novel-studio-pwa-v123';
const OFFLINE_CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
];
const CORE_ASSETS = [
  './',
  './index.html',
  './yt_pip_frame.html',
  './manifest.json',
  './favicon.ico',
  './assets/favicon-portrait.ico',
  './assets/favicon-portrait-16.png',
  './assets/favicon-portrait-32.png',
  './assets/favicon-portrait-192.png',
  './assets/app-icon.ico',
  './assets/app-icon-16.png',
  './assets/app-icon-32.png',
  './assets/app-icon-48.png',
  './assets/app-icon-72.png',
  './assets/app-icon-96.png',
  './assets/app-icon-128.png',
  './assets/app-icon-144.png',
  './assets/app-icon-192.png',
  './assets/app-icon-256.png',
  './assets/app-icon-384.png',
  './assets/app-icon-512.png',
  './assets/app-icon-maskable-192.png',
  './assets/app-icon-maskable-512.png',
  './assets/apple-touch-icon-120.png',
  './assets/apple-touch-icon-152.png',
  './assets/apple-touch-icon-167.png',
  './assets/apple-touch-icon-180.png',
  './assets/vietqr_mai_hai_dang.jpg',
  './assets/misc_mo_xum_xue_sa_luoi.jpg',
  './assets/misc_qua_bo_linh_vat_2.png',
  './assets/misc_sinh_vien_bach_khoa_2h_sang.jpg',
  './assets/misc_dang_vien_tranh_cu_quoc_hoi.jpg',
  './assets/misc_fan_ham_mo_1.jpg',
  './assets/misc_fan_ham_mo_2.jpg',
  './assets/misc_fan_ham_mo_3.jpg',
  './assets/misc_fan_ham_mo_4.jpg',
  './assets/misc_fan_ham_mo_5.jpg',
  './assets/misc_fan_ham_mo_6.jpg',
  './assets/misc_da_kiem_duyet_jumpscare.jpg',
  './assets/misc_bao_che_voice.m4a',
  './mod01_core_kernel_and_event_bus.js',
  './mod02_gemini_models_catalog_and_router_config.js',
  './mod03_humanized_ui_toast_and_vn_nlp_utils.js',
  './mod04_indexeddb_storage_and_emergency_vault.js',
  './mod05_local_filesystem_and_folder_sync.js',
  './mod06_document_importer_docx_pdf_txt.js',
  './mod07_bm25_local_rag_memory_engine.js',
  './mod08_chapter_tree_and_bidirectional_approval.js',
  './mod09_three_tier_autosave_and_undo_stack.js',
  './mod10_version_time_machine_and_live_preview.js',
  './mod11_google_docs_ai_diff_review_engine.js',
  './mod12_story_bible_and_lore_matrix_engine.js',
  './mod13_scene_transition_and_pov_builder.js',
  './mod14_five_modes_system_prompts_studio.js',
  './mod15_api_key_vault_and_zero_congestion_client.js',
  './mod16_master_prompt_synthesizer_two_step.js',
  './mod17_tab3_five_modes_output_controller.js',
  './mod18_mode5_plot_diagram_and_timeline_studio.js',
  './mod19_smart_approval_and_bible_extractor.js',
  './mod20_bidirectional_pomodoro_sync_engine.js',
  './mod21_mp3_ab_loop_and_webaudio_soundscape.js',
  './mod22_typography_and_60fps_ambient_canvas.js',
  './mod23_dialogue_normalizer_and_vn_editor_tools.js',
  './mod24_cliche_scanner_and_pacing_heatmap.js',
  './mod25_webnovel_secret_features_and_lore_whisper.js',
  './mod26_pdf_docx_epub_custom_book_exporter.js',
  './mod27_mascot_bi_so_8_and_dual_chat_assistant.js',
  './mod28_animated_video_tutorial_with_subtitles.js',
  './mod29_responsive_mobile_pwa_and_six_screens_nav.js',
  './mod30_master_bootloader_and_integrity_guard.js',
  './mod31_full_feature_directory_and_inspector.js',
  './mod32_ambient_backdrop_engine_and_argon_bridge.js',
  './mod33_unified_connection_guard_and_live_voice_studio.js',
  './mod34_bug_report_and_doc_relay.js',
  './mod35_author_credits_and_social_hub.js',
  './mod36_zero_reload_save_shield_and_integrity_guard.js',
  './mod37_workspace_export_and_gdrive_sync.js',
  './mod38_local_compute_and_tab5_attendance.js',
  './streamFetcher.js',
  './nativePlayer.js',
  './mod39_youtube_adfree_player_and_background.js',
  './mod40_youtube_motion_background_engine.js',
  './mod41_guest_demo_sandbox_mode.js',
  './mod42_world_clock_weather_and_alarm.js',
  './mod43_realtime_weather_sky_engine.js',
  './mod44_site_traffic_analytics_box.js',
  './mod45_scientific_fx570_and_desmos_graphing_calc.js',
  './mod46c_danglovepdf_studio_editor_and_viewer.js',
  './mod46b_danglovepdf_pro_engines.js',
  './mod46_danglovepdf_and_doc_converter.js',
  './mod47_performance_ram_and_lifecycle_manager.js',
  './mod48_autotester_loader.js',
  './mod49_market_gold_realestate_stock_advisor.js',
  './systemFontScale.js',
  './miscFunHub.js',
  './i18n_lang_en.js',
  './i18n_lang_zh_cn.js',
  './i18n_lang_zh_tw.js',
  './i18n_lang_ko.js',
  './i18n_lang_ja.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_ASSETS.map((assetUrl) => {
          const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
          const timer = ctrl ? setTimeout(() => ctrl.abort(), 4500) : null;
          return fetch(assetUrl, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
            .then((res) => {
              if (timer) clearTimeout(timer);
              return res && res.ok ? cache.put(assetUrl, res) : null;
            })
            .catch(() => {
              if (timer) clearTimeout(timer);
              return null;
            });
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return null;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try {
    url = new URL(req.url);
  } catch (_eUrl) {
    return;
  }
  if (url.hostname.includes('generativelanguage.googleapis.com')) {
    return;
  }
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigate = req.mode === 'navigate' || req.destination === 'document';
  const isCodeOrDoc =
    isNavigate || /\.(?:html|js|mjs|json|css)$/i.test(url.pathname) || url.pathname.endsWith('/');

  // Network-First tuyệt đối cho HTML & toàn bộ file .js/.json/.css để KHÔNG BAO GIỜ lệch phiên bản cache
  const doNetworkFetch = () => {
    if (isSameOrigin && isCodeOrDoc) {
      return fetch(req.url, { cache: 'no-store', credentials: 'same-origin' });
    }
    if (isSameOrigin) {
      return fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });
    }
    return fetch(req);
  };

  event.respondWith(
    doNetworkFetch()
      .then((networkRes) => {
        const contentType = (networkRes && networkRes.headers && networkRes.headers.get('content-type')) || '';
        const isImageReq = /\.(?:jpg|jpeg|png|webp|ico|svg)$/i.test(url.pathname) || req.destination === 'image';
        const isJsReq = /\.m?js$/i.test(url.pathname) || req.destination === 'script';
        const isHtmlPoison = (isImageReq || isJsReq) && contentType.toLowerCase().includes('text/html');
        const isSameOriginOk = networkRes && networkRes.status === 200 && isSameOrigin && !isHtmlPoison;
        const isStaticCdn =
          OFFLINE_CDN_HOSTS.includes(url.hostname) &&
          networkRes &&
          (networkRes.status === 200 || networkRes.type === 'opaque');
        if (isSameOriginOk || isStaticCdn) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          return networkRes;
        }
        if (!networkRes || !networkRes.ok || isHtmlPoison) {
          return caches.match(req, { ignoreSearch: true }).then((cached) => cached || networkRes);
        }
        return networkRes;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          if (isNavigate) {
            return caches.match('./index.html');
          }
          return Response.error();
        })
      )
  );
});
