/**
 * ============================================================================
 * MODULE 39: TRÌNH XEM YOUTUBE CHỐNG SAO NHÃNG & SÂN KHẤU NỀN VIDEO WEB
 *            (mod39_youtube_adfree_player_and_background.js)
 * ============================================================================
 * Vị trí hiển thị: Tab 5 ("5. Nhạc, Pomodoro & Chữ") -> Ô #5:
 *   "🎬 5. Xem Video YouTube hoặc Cài Video YouTube Làm Background"
 *   (`#s14-card-youtube-btn` điều khiển khung `#s14-panel-youtube-box`).
 *
 * Quy trình 2 bước thân thiện tuyệt đối cho cả Máy Tính (PC) và Điện Thoại:
 *   - Bước 1 (Popup `#modal-mod39-youtube-guide` có dấu ✕ tắt ở góc phải trên):
 *       + Hướng dẫn từng bước cách lấy link YouTube trên Máy Tính & Điện Thoại.
 *       + Nút mở nhanh https://www.youtube.com/ sang tab mới để người dùng chọn video.
 *       + Ô dán đường dẫn thông minh: ngay khi dán hoặc nhập link YouTube hợp lệ,
 *         Popup Bước 1 tự đóng êm ái và chuyển lập tức sang Trình Phát Bước 2.
 *   - Bước 2 (Trình Phát Rạp Viết Privacy-Enhanced & Sân Khấu Nền Web):
 *       + Dùng `https://www.youtube-nocookie.com/embed/...` kèm thuộc tính
 *         `referrerpolicy="strict-origin-when-cross-origin"` và kiểm soát `origin`
 *         thông minh trên HTTP/HTTPS (kèm bảng hướng dẫn dự phòng trung thực nếu mở
 *         trực tiếp qua `file://` hoặc video bị chủ kênh tắt quyền nhúng Error 101/150/153).
 *       + Đầy đủ công cụ nghe/xem chuyên sâu: Toàn màn hình (Fullscreen / Pseudo-FS),
 *         Lặp lại vô hạn (Repeat), Vòng lặp đoạn A–B chính xác từng giây, Tốc độ phát
 *         0.5x -> 2.0x, Tua nhanh -10s / +10s, Âm lượng & Tắt tiếng, Ghim Mini Bar.
 *       + Nút "🌌 Dùng Video Này Làm Background Web": biến video YouTube đang chọn
 *         thành hình nền chuyển động phủ kín 16:9 (cover-fit) sau lớp kính mờ của
 *         toàn bộ 6 Tab, điều chỉnh được Độ mờ Video, Độ nhòe, Độ sáng và Kính mờ chữ,
 *         đồng bộ hai chiều an toàn với Module 32 (`AmbientBackdropEngine`).
 *
 * Kiến trúc thuần khiết: Đăng ký qua `window.NoirStudio.registerModule('mod39', ...)`.
 * ============================================================================
 */
(function initModule39YouTubePlayerAndBackground(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  // ==========================================================================
  // 1. HẰNG SỐ CẤU HÌNH, NHÃN GIAO DIỆN & BỘ GỢI Ý TÌM KIẾM TRÊN YOUTUBE
  // ==========================================================================
  const MOD39_CONSTANTS = Object.freeze({
    MODULE_KEY: 'mod39',
    VERSION: '39.0.0',
    PANEL_ID: 's14-panel-youtube-box',
    CARD_BTN_ID: 's14-card-youtube-btn',
    GUIDE_MODAL_ID: 'modal-mod39-youtube-guide',
    GUIDE_CLOSE_BTN_ID: 'btn-mod39-close-guide',
    GUIDE_INPUT_ID: 'input-mod39-guide-url',
    STEP2_INPUT_ID: 'input-mod39-step2-url',
    YT_IFRAME_API_SRC: 'https://www.youtube.com/iframe_api',
    YOUTUBE_HOME_URL: 'https://www.youtube.com/',
    EMBED_HOST: 'https://www.youtube-nocookie.com',
    STORAGE_KEYS: Object.freeze({
      RECENT_VIDEOS: 'noir_v39_mod39_recent_videos_v1',
      FAVORITE_VIDEOS: 'noir_v39_mod39_favorite_videos_v1',
      CURRENT_VIDEO: 'noir_v39_mod39_current_video_v1',
      PLAYER_PREFS: 'noir_v39_mod39_player_prefs_v1',
      AB_LOOP_MAP: 'noir_v39_mod39_ab_loop_map_v1',
      WEB_BG_STATE: 'noir_v39_mod39_web_bg_state_v1',
      YT_LOOP_STATE: 'yt_loop_state',
      YTSAVE_DIRECT_REDIRECT: 'noir_mod39_ytsave_direct_redirect_v1',
      SEARCH_CACHE_PREFIX: 'mod39_yt_search_cache_'
    }),
    SEARCH_TIMEOUT_MS: 5200,
    SEARCH_SOURCES: Object.freeze([
      { type: 'invidious', url: 'https://yt.chocolatemoo53.com/api/v1/search', batch: 1 },
      { type: 'piped', url: 'https://api.piped.private.coffee/search', filter: 'all', batch: 1 },
      { type: 'piped', url: 'https://pipedapi.ducks.party/search', filter: 'all', batch: 1 },
      { type: 'piped', url: 'https://api.piped.private.coffee/search', filter: 'music_songs', batch: 2 },
      { type: 'piped', url: 'https://pipedapi.ducks.party/search', filter: 'music_songs', batch: 2 },
      { type: 'piped', url: 'https://pipedapi.reallyaweso.me/search', filter: 'all', batch: 2 },
      { type: 'invidious', url: 'https://invidious.nerdvpn.de/api/v1/search', batch: 2 },
      { type: 'piped', url: 'https://pipedapi.kavin.rocks/search', filter: 'videos', batch: 2 },
      { type: 'invidious', url: 'https://inv.nadeko.net/api/v1/search', batch: 3 },
      { type: 'invidious', url: 'https://yt.artemislena.eu/api/v1/search', batch: 3 },
      { type: 'piped', url: 'https://pipedapi.adminforge.de/search', filter: 'all', batch: 3 }
    ]),
    LIMITS: Object.freeze({
      MAX_RECENT_VIDEOS: 16,
      MAX_FAVORITE_VIDEOS: 24,
      AB_POLL_INTERVAL_MS: 120,
      MIN_AB_GAP_SECONDS: 1,
      SEEK_STEP_SECONDS: 10,
      DEFAULT_BG_OPACITY_PCT: 72,
      DEFAULT_BG_BLUR_PX: 2,
      DEFAULT_BG_BRIGHTNESS_PCT: 62,
      DEFAULT_BG_VOLUME_PCT: 0
    }),
    SPEED_OPTIONS: Object.freeze([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4]),
    YT_PLAYER_STATES: Object.freeze({
      UNSTARTED: -1,
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5
    })
  });

  /**
   * Nhận diện Desktop (Trình duyệt PC/Laptop hoặc App PWA cài trên Desktop).
   * Trên Desktop, trình duyệt đã cho phép YouTube phát trong nền tự nhiên nên
   * ưu tiên phát trực tiếp qua youtube-nocookie.com, không cần dò luồng công cộng.
   */
  function isDesktopDirectYoutubeEnv() {
    if (global.__MOD39_FORCE_PUBLIC_STREAM__) return false;
    if (typeof navigator === 'undefined') return false;
    const ua = String(navigator.userAgent || '');
    const isMobileOrTabletUa =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
    const isIpadOs =
      /Macintosh/i.test(ua) && Number(navigator.maxTouchPoints || 0) > 1;
    return !isMobileOrTabletUa && !isIpadOs;
  }

  /**
   * Các từ khóa tìm kiếm bầu không khí sáng tác lành mạnh trên YouTube.
   * Bấm vào sẽ mở trang kết quả YouTube chính chủ để tác giả tự do lựa chọn
   * video đang hoạt động và copy link dán ngược về Studio (không nhúng bừa ID chết).
   */
  const AMBIENCE_YOUTUBE_SEARCH_PRESETS = Object.freeze([
    {
      id: 'SEARCH_LOFI_RAIN_CAFE',
      badge: '☕ Lo-Fi Quán Cà Phê Mưa',
      description: 'Nhạc chill nhẹ nhàng + tiếng mưa rơi cửa kính để gõ bản thảo dài',
      query: 'lofi hip hop rain coffee shop ambience no lyrics',
      accentClass: 'border-amber-500/45 bg-amber-950/25 text-amber-200 hover:bg-amber-500/15'
    },
    {
      id: 'SEARCH_CYBERPUNK_RAIN',
      badge: '🌆 Phố Đêm Cyberpunk Mưa Neon',
      description: 'Cảnh nền đô thị đêm rực đèn neon rất hợp viết đô thị, sci-fi, trinh thám',
      query: 'cyberpunk neon rain night city ambience 4k synthwave',
      accentClass: 'border-cyan-500/45 bg-cyan-950/25 text-cyan-200 hover:bg-cyan-500/15'
    },
    {
      id: 'SEARCH_FIREPLACE_LIBRARY',
      badge: '🔥 Thư Phòng Cổ & Lò Sưởi Ấm',
      description: 'Cảnh thư viện cổ điển, tiếng củi nổ tí tách + mưa đêm giông bão',
      query: 'dark academia library fireplace thunderstorm ambience 4k',
      accentClass: 'border-orange-500/45 bg-orange-950/25 text-orange-200 hover:bg-orange-500/15'
    },
    {
      id: 'SEARCH_EASTERN_XIANXIA',
      badge: '🎋 Trúc Lâm Cổ Trang & Sáo Trúc',
      description: 'Cổ phong thanh tịnh, sương mù núi non, đàn tranh hợp viết tiên hiệp / kiếm hiệp',
      query: 'chinese guzheng bamboo forest rain relaxing instrumental ambience',
      accentClass: 'border-emerald-500/45 bg-emerald-950/25 text-emerald-200 hover:bg-emerald-500/15'
    },
    {
      id: 'SEARCH_PIANO_EMOTIONAL',
      badge: '🎹 Piano Nội Tâm Sâu Lắng',
      description: 'Độc tấu piano buồn hoặc cao trào phục vụ viết phân cảnh tâm lý nặng đô',
      query: 'emotional anime piano instrumental sad writing music',
      accentClass: 'border-violet-500/45 bg-violet-950/25 text-violet-200 hover:bg-violet-500/15'
    },
    {
      id: 'SEARCH_DEEP_SPACE_BGM',
      badge: '🌌 Tàu Vũ Trụ & Ngân Hà',
      description: 'Nền âm thanh trầm tĩnh ngoài không gian giúp tập trung cao độ nhiều giờ',
      query: 'spaceship ambient white noise nebula 4k visual background',
      accentClass: 'border-indigo-500/45 bg-indigo-950/25 text-indigo-200 hover:bg-indigo-500/15'
    }
  ]);

  /**
   * Bảng mô tả mã lỗi trình phát YouTube chuẩn xác bằng tiếng Việt dễ hiểu.
   */
  const YOUTUBE_ERROR_EXPLANATIONS = Object.freeze({
    2: 'Tham số video YouTube không hợp lệ (ví dụ ID video bị thiếu ký tự). Hãy kiểm tra lại đường link vừa dán.',
    5: 'Trình duyệt hiện tại gặp trục trặc khi giải mã luồng HTML5 của video này. Hãy thử tải lại trình phát hoặc mở trực tiếp trên YouTube.',
    100: 'Video này không tồn tại trên YouTube hoặc đã bị đặt về chế độ Riêng tư / Đã xóa.',
    101: 'Chủ kênh YouTube đã tắt quyền "Cho phép nhúng" (Embed) đối với video này. Bấm "Mở trên YouTube ↗" để xem trực tiếp hoặc chọn một video khác!',
    150: 'Chủ sở hữu bản quyền hạn chế phát nhúng video này bên ngoài trang chủ YouTube. Bạn hãy bấm "Mở trên YouTube ↗" hoặc dán link video khác cho phép nhúng nhé.',
    153: 'Trình duyệt hoặc giao thức file:// không gửi được thông tin Referrer (Strict-Origin) tới máy chủ YouTube. Hãy mở trang qua máy chủ localhost/HTTPS hoặc bấm "Mở trên YouTube ↗".'
  });

  /**
   * Bộ trợ giúp thông báo an toàn trong toàn hệ thống NoirStudio.
   */
  function safeNotify(message, type = 'info', duration = 3200) {
    try {
      if (NS.ui && typeof NS.ui.showToast === 'function') {
        NS.ui.showToast(message, type, duration);
        return;
      }
      if (typeof global.showToast === 'function') {
        global.showToast(message, type);
        return;
      }
    } catch (_err) {}
    if (typeof console !== 'undefined' && console.info) {
      console.info(`[Mod39 ${type}] ${message}`);
    }
  }

  function safeStorageGet(key, fallbackValue = null) {
    try {
      if (typeof global.localStorage === 'undefined') return fallbackValue;
      const raw = global.localStorage.getItem(key);
      return raw === null ? fallbackValue : raw;
    } catch (_err) {
      return fallbackValue;
    }
  }

  function safeStorageSet(key, value) {
    try {
      if (typeof global.localStorage === 'undefined') return false;
      global.localStorage.setItem(key, String(value));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function safeJsonParse(rawText, fallbackObj) {
    if (!rawText || typeof rawText !== 'string') return fallbackObj;
    try {
      const parsed = JSON.parse(rawText);
      return parsed === null || typeof parsed === 'undefined' ? fallbackObj : parsed;
    } catch (_err) {
      return fallbackObj;
    }
  }

  function escapeHtml(rawStr) {
    return String(rawStr || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clampNumber(val, min, max, fallback) {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function formatSecondsToClock(totalSeconds) {
    const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hrs = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
    if (hrs > 0) {
      return `${hrs}:${pad2(mins)}:${pad2(secs)}`;
    }
    return `${pad2(mins)}:${pad2(secs)}`;
  }

  function formatAbClockForDuration(totalSeconds, durationSec = 0) {
    const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const dur = Math.max(0, Math.floor(Number(durationSec) || 0));
    const useHours = dur >= 3600 || safe >= 3600;
    const hrs = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
    if (useHours) {
      return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
    }
    return `${pad2(mins)}:${pad2(secs)}`;
  }

  function parseFlexibleTimeToSeconds(input) {
    if (typeof input === 'number' && Number.isFinite(input)) {
      return Math.max(0, Math.floor(input));
    }
    const raw = String(input || '').trim().toLowerCase();
    if (!raw) return null;

    // Dạng số giây thuần: "95" hoặc "95s"
    if (/^\d+(\.\d+)?s?$/.test(raw)) {
      return Math.max(0, Math.floor(parseFloat(raw)));
    }

    // Dạng HMS kiểu YouTube: "1h2m30s", "2m15s", "45s"
    const hmsMatch = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
      const h = parseInt(hmsMatch[1] || '0', 10);
      const m = parseInt(hmsMatch[2] || '0', 10);
      const s = parseInt(hmsMatch[3] || '0', 10);
      return Math.max(0, h * 3600 + m * 60 + s);
    }

    // Dạng dấu hai chấm: "MM:SS" hoặc "HH:MM:SS"
    if (/^\d{1,3}(:\d{1,2}){1,2}$/.test(raw)) {
      const parts = raw.split(':').map((p) => parseInt(p, 10));
      if (parts.some((p) => !Number.isFinite(p) || p < 0)) return null;
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }

    return null;
  }

  /**
   * Phân tích chặt chẽ thời gian người dùng gõ trong ô Mốc A / Mốc B.
   * Trả về { kind: 'EMPTY' | 'VALID' | 'INVALID', seconds: number | null }.
   */
  function parseAbTimeInput(rawInput) {
    const raw = String(rawInput ?? '').trim();
    if (!raw) return { kind: 'EMPTY', seconds: null };
    const normalized = raw.toLowerCase();

    if (/^\d+(\.\d+)?s?$/.test(normalized)) {
      const n = parseFloat(normalized);
      if (!Number.isFinite(n) || n < 0) return { kind: 'INVALID', seconds: null };
      return { kind: 'VALID', seconds: Math.floor(n) };
    }

    const hmsMatch = normalized.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
      const h = parseInt(hmsMatch[1] || '0', 10);
      const m = parseInt(hmsMatch[2] || '0', 10);
      const s = parseInt(hmsMatch[3] || '0', 10);
      if ((h > 0 && m >= 60) || ((m > 0 || h > 0) && s >= 60)) {
        return { kind: 'INVALID', seconds: null };
      }
      return { kind: 'VALID', seconds: Math.max(0, h * 3600 + m * 60 + s) };
    }

    if (/^\d{1,3}(:\d{1,2}){1,2}$/.test(normalized)) {
      const parts = normalized.split(':').map((p) => parseInt(p, 10));
      if (parts.some((p) => !Number.isFinite(p) || p < 0)) {
        return { kind: 'INVALID', seconds: null };
      }
      if (parts.length === 2) {
        if (parts[1] >= 60) return { kind: 'INVALID', seconds: null };
        return { kind: 'VALID', seconds: parts[0] * 60 + parts[1] };
      }
      if (parts.length === 3) {
        if (parts[1] >= 60 || parts[2] >= 60) return { kind: 'INVALID', seconds: null };
        return { kind: 'VALID', seconds: parts[0] * 3600 + parts[1] * 60 + parts[2] };
      }
    }

    return { kind: 'INVALID', seconds: null };
  }

  // ==========================================================================
  // 2. BỘ PHÂN TÍCH & CHUẨN HÓA ĐƯỜNG DẪN YOUTUBE THÔNG MINH
  // ==========================================================================
  class YouTubeUrlParserAndValidator {
    constructor() {
      this.videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
      this.playlistIdPattern = /^[A-Za-z0-9_-]{10,64}$/;
    }

    isValidVideoId(candidate) {
      return typeof candidate === 'string' && this.videoIdPattern.test(candidate.trim());
    }

    isValidPlaylistId(candidate) {
      return typeof candidate === 'string' && this.playlistIdPattern.test(candidate.trim());
    }

    /**
     * Phân loại thông minh đầu vào từ Smart Omnibox (Link YouTube hay Từ khóa tìm kiếm).
     * Tránh nhầm từ đơn tiếng Anh dài đúng 11 ký tự (ví dụ "programming") thành Video ID.
     */
    classifyOmniboxInput(rawInput) {
      const trimmed = String(rawInput || '').trim();
      if (!trimmed) {
        return { mode: 'EMPTY', query: '', parsed: null };
      }

      const hasHttpOrYoutubeHost =
        /https?:\/\//i.test(trimmed) ||
        /(?:youtube\.com|youtu\.be|youtube-nocookie\.com|m\.youtube\.com|music\.youtube\.com)/i.test(trimmed);

      if (hasHttpOrYoutubeHost) {
        const parsed = this.parse(trimmed);
        return {
          mode: parsed.valid ? 'URL' : 'URL_INVALID',
          query: trimmed,
          parsed
        };
      }

      // Chỉ coi là mã Video ID 11 ký tự thuần nếu chứa chữ số, dấu _/- hoặc chữ Hoa+thường xen kẽ (kiểu dQw4w9WgXcQ)
      if (this.isValidVideoId(trimmed)) {
        const looksLikeGeneratedId =
          /[0-9_-]/.test(trimmed) || (/[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed));
        if (looksLikeGeneratedId) {
          return {
            mode: 'URL',
            query: trimmed,
            parsed: this.parse(trimmed)
          };
        }
      }

      // Nếu giống đường link web khác (không có khoảng trắng và có dạng host.tld/...)
      if (!/\s/.test(trimmed) && /^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(trimmed)) {
        const parsed = this.parse(trimmed);
        return {
          mode: parsed.valid ? 'URL' : 'URL_INVALID',
          query: trimmed,
          parsed
        };
      }

      return { mode: 'KEYWORD', query: trimmed, parsed: null };
    }

    /**
     * Trích xuất chuỗi URL khả nghi từ đoạn văn bản người dùng dán
     * (ví dụ copy nguyên tin nhắn chia sẻ từ ứng dụng YouTube trên iOS/Android).
     */
    extractCandidateUrlFromText(rawText) {
      const cleaned = String(rawText || '').trim();
      if (!cleaned) return '';

      // Nếu là URL đầy đủ nằm lẫn trong text (ví dụ "Xem video hay nè https://youtu.be/abc...")
      const urlMatch = cleaned.match(
        /https?:\/\/(?:[\w-]+\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com|m\.youtube\.com|music\.youtube\.com)\/[^\s"'<>]+/i
      );
      if (urlMatch) {
        return urlMatch[0].replace(/[),.;!?]+$/, '');
      }

      // Nếu thiếu https:// nhưng bắt đầu bằng youtube.com/... hoặc youtu.be/...
      const bareHostMatch = cleaned.match(
        /(?:^|\s)((?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s"'<>]+)/i
      );
      if (bareHostMatch) {
        return `https://${bareHostMatch[1].replace(/[),.;!?]+$/, '')}`;
      }

      return cleaned;
    }

    /**
     * Phân tích link YouTube thành đối tượng chuẩn `{ valid, videoId, playlistId, startSeconds, kind, canonicalUrl, watchUrl, thumbnailUrl, embedUrl }`.
     */
    parse(rawInput) {
      const original = String(rawInput || '').trim();
      if (!original) {
        return {
          valid: false,
          reason: 'EMPTY',
          message: 'Hãy dán đường link YouTube vào ô bên trên để bắt đầu.'
        };
      }

      // Trường hợp người dùng dán trực tiếp đúng 11 ký tự ID video
      if (this.isValidVideoId(original)) {
        return this.buildParsedPayload({
          videoId: original,
          playlistId: null,
          startSeconds: 0,
          kind: 'DIRECT_ID',
          originalInput: original
        });
      }

      const candidate = this.extractCandidateUrlFromText(original);
      let urlObj = null;
      try {
        urlObj = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
      } catch (_err) {
        return {
          valid: false,
          reason: 'INVALID_URL_FORMAT',
          message: 'Đoạn chữ bạn dán chưa phải một đường link YouTube hợp lệ.'
        };
      }

      const hostname = (urlObj.hostname || '').toLowerCase().replace(/^www\./, '');
      const isYoutubeHost =
        hostname === 'youtu.be' ||
        hostname === 'youtube.com' ||
        hostname === 'm.youtube.com' ||
        hostname === 'music.youtube.com' ||
        hostname === 'youtube-nocookie.com' ||
        hostname.endsWith('.youtube.com');

      if (!isYoutubeHost) {
        return {
          valid: false,
          reason: 'NOT_YOUTUBE_DOMAIN',
          message: `Tên miền "${hostname}" không thuộc YouTube (youtube.com hoặc youtu.be).`
        };
      }

      const pathSegments = (urlObj.pathname || '')
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);

      let videoId = null;
      let playlistId = null;
      let kind = 'WATCH';

      // Đọc tham số playlist & timestamp
      const rawList = urlObj.searchParams.get('list');
      if (rawList && this.isValidPlaylistId(rawList)) {
        playlistId = rawList.trim();
      }

      const rawTime =
        urlObj.searchParams.get('t') ||
        urlObj.searchParams.get('start') ||
        urlObj.searchParams.get('time_continue') ||
        '';
      let startSeconds = parseFlexibleTimeToSeconds(rawTime) || 0;
      if (!startSeconds && urlObj.hash) {
        const hashTime = urlObj.hash.replace(/^#/, '').replace(/^t=/, '');
        startSeconds = parseFlexibleTimeToSeconds(hashTime) || 0;
      }

      // 1) Link rút gọn youtu.be/VIDEO_ID
      if (hostname === 'youtu.be') {
        const maybeId = pathSegments[0] || '';
        if (this.isValidVideoId(maybeId)) {
          videoId = maybeId;
          kind = 'SHORT_LINK';
        }
      }

      // 2) Link /watch?v=VIDEO_ID (desktop, mobile m.youtube.com, music.youtube.com)
      if (!videoId) {
        const queryV = urlObj.searchParams.get('v');
        if (queryV && this.isValidVideoId(queryV)) {
          videoId = queryV.trim();
          kind = hostname === 'music.youtube.com' ? 'YT_MUSIC' : 'WATCH';
        }
      }

      // 3) Link /shorts/ID, /live/ID, /embed/ID, /v/ID
      if (!videoId && pathSegments.length >= 2) {
        const prefix = (pathSegments[0] || '').toLowerCase();
        const second = pathSegments[1] || '';
        if (
          (prefix === 'shorts' || prefix === 'live' || prefix === 'embed' || prefix === 'v') &&
          this.isValidVideoId(second)
        ) {
          videoId = second;
          kind = prefix.toUpperCase();
        }
      }

      // 4) Link attribution_link có lồng param u=/watch?v=...
      if (!videoId && pathSegments[0] === 'attribution_link') {
        const nestedU = urlObj.searchParams.get('u');
        if (nestedU) {
          try {
            const nestedUrl = new URL(`https://www.youtube.com${nestedU}`);
            const nestedV = nestedUrl.searchParams.get('v');
            if (nestedV && this.isValidVideoId(nestedV)) {
              videoId = nestedV.trim();
              kind = 'ATTRIBUTION';
            }
          } catch (_e) {}
        }
      }

      // 5) Chỉ có Playlist URL dạng youtube.com/playlist?list=PL...
      if (!videoId && playlistId) {
        kind = 'PLAYLIST_ONLY';
        return this.buildParsedPayload({
          videoId: null,
          playlistId,
          startSeconds: 0,
          kind,
          originalInput: original
        });
      }

      if (!videoId) {
        return {
          valid: false,
          reason: 'MISSING_VIDEO_ID',
          message:
            'Không tìm thấy mã video 11 ký tự trong đường link này. Bạn hãy mở hẳn video muốn phát rồi copy lại đường dẫn nhé.'
        };
      }

      return this.buildParsedPayload({
        videoId,
        playlistId,
        startSeconds,
        kind,
        originalInput: original
      });
    }

    buildParsedPayload({ videoId, playlistId, startSeconds, kind, originalInput }) {
      const watchUrl = videoId
        ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}${
            playlistId ? `&list=${encodeURIComponent(playlistId)}` : ''
          }${startSeconds > 0 ? `&t=${startSeconds}s` : ''}`
        : `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;

      const thumbnailUrl = videoId
        ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
        : '';

      const key = videoId ? `vid:${videoId}` : `pl:${playlistId}`;
      const isLive = String(kind || '').toUpperCase() === 'LIVE';

      return {
        valid: true,
        key,
        videoId: videoId || null,
        playlistId: playlistId || null,
        startSeconds: clampNumber(startSeconds, 0, 86400, 0),
        kind,
        isLive,
        originalInput,
        watchUrl,
        thumbnailUrl,
        embedUrl: this.buildPrivacyEmbedUrl({
          videoId,
          playlistId,
          startSeconds,
          autoplay: false,
          loop: false,
          muted: false,
          controls: true,
          forBackground: false
        })
      };
    }

    /**
     * Xây dựng đường link nhúng `youtube-nocookie.com` an toàn cho cả HTTP/HTTPS
     * lẫn không làm hỏng tham số `origin` khi người dùng mở file HTML cục bộ.
     */
    buildPrivacyEmbedUrl(options = {}) {
      const {
        videoId = null,
        playlistId = null,
        startSeconds = 0,
        autoplay = false,
        loop = false,
        muted = false,
        controls = true,
        forBackground = false
      } = options;

      const params = new URLSearchParams();
      params.set('enablejsapi', '1');
      params.set('rel', '0');
      params.set('modestbranding', '1');
      params.set('playsinline', '1');
      params.set('iv_load_policy', '3');

      if (autoplay) {
        params.set('autoplay', '1');
      }
      if (muted || forBackground) {
        params.set('mute', '1');
      }
      if (forBackground) {
        params.set('controls', '0');
        params.set('disablekb', '1');
        params.set('fs', '0');
        params.set('loop', '1');
        if (videoId) {
          params.set('playlist', playlistId || videoId);
        } else if (playlistId) {
          params.set('listType', 'playlist');
          params.set('list', playlistId);
        }
      } else {
        params.set('controls', controls ? '1' : '0');
        if (loop) {
          params.set('loop', '1');
          if (videoId) {
            // Khi bật Lặp 1 video: luôn gắn playlist=videoId và không truyền list=RD...
            // để YouTube lặp chính xác video hiện tại thay vì chạy tiếp sang bài khác trong Mix.
            params.set('playlist', videoId);
          } else if (playlistId) {
            params.set('listType', 'playlist');
            params.set('list', playlistId);
          }
        } else if (playlistId && videoId) {
          params.set('list', playlistId);
        } else if (playlistId && !videoId) {
          params.set('listType', 'playlist');
          params.set('list', playlistId);
        }
        if (startSeconds > 0 && videoId) {
          params.set('start', String(Math.floor(startSeconds)));
        }
      }

      // Chỉ gắn `origin` khi chạy dưới HTTP/HTTPS hợp lệ (tránh `origin=null` trên file://)
      try {
        if (
          typeof global.location !== 'undefined' &&
          (global.location.protocol === 'http:' || global.location.protocol === 'https:') &&
          global.location.origin &&
          global.location.origin !== 'null'
        ) {
          params.set('origin', global.location.origin);
        }
      } catch (_e) {}

      if (videoId) {
        return `${MOD39_CONSTANTS.EMBED_HOST}/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
      }
      return `${MOD39_CONSTANTS.EMBED_HOST}/embed/videoseries?${params.toString()}`;
    }
  }

  // ==========================================================================
  // 3. KHO LƯU TRỮ CỤC BỘ (LỊCH SỬ LINK, YÊU THÍCH, MỐC A–B & NỀN WEB)
  // ==========================================================================
  class Mod39StorageAndFavoritesVault {
    constructor() {
      this.abLoopMap = this.loadAbLoopMap();
    }

    getDefaultPlayerPrefs() {
      return {
        volume: 85,
        muted: false,
        speed: 1,
        repeatMode: false,
        miniDockEnabled: false,
        miniDockDefaultMigratedV3: true,
        autoCloseStep1OnPaste: true,
        mobileBgAudioEnabled: true,
        alwaysBackgroundPip: false,
        audioOnlyMode: false
      };
    }

    loadPlayerPrefs() {
      const defaults = this.getDefaultPlayerPrefs();
      const parsed = safeJsonParse(safeStorageGet(MOD39_CONSTANTS.STORAGE_KEYS.PLAYER_PREFS), {});
      const rawYtLoop = safeStorageGet(MOD39_CONSTANTS.STORAGE_KEYS.YT_LOOP_STATE, null);
      const repeatMode =
        rawYtLoop === 'true' ? true : rawYtLoop === 'false' ? Boolean(parsed.repeatMode) : Boolean(parsed.repeatMode);
      const migratedMini = false;
      return {
        volume: clampNumber(parsed.volume, 0, 100, defaults.volume),
        muted: Boolean(parsed.muted),
        speed: MOD39_CONSTANTS.SPEED_OPTIONS.includes(Number(parsed.speed)) ? Number(parsed.speed) : 1,
        repeatMode,
        miniDockEnabled: migratedMini,
        miniDockDefaultMigratedV3: true,
        videoPlaybackMode: Boolean(parsed.videoPlaybackMode),
        autoCloseStep1OnPaste:
          typeof parsed.autoCloseStep1OnPaste === 'boolean' ? parsed.autoCloseStep1OnPaste : true,
        mobileBgAudioEnabled: true,
        alwaysBackgroundPip: false,
        audioOnlyMode: false
      };
    }

    savePlayerPrefs(prefs) {
      if (prefs && typeof prefs.repeatMode === 'boolean') {
        safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.YT_LOOP_STATE, prefs.repeatMode ? 'true' : 'false');
      }
      return safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.PLAYER_PREFS, JSON.stringify(prefs || {}));
    }

    getDefaultWebBgState() {
      return {
        enabled: false,
        videoKey: null,
        videoId: null,
        playlistId: null,
        watchUrl: null,
        title: '',
        opacityPct: MOD39_CONSTANTS.LIMITS.DEFAULT_BG_OPACITY_PCT,
        blurPx: MOD39_CONSTANTS.LIMITS.DEFAULT_BG_BLUR_PX,
        brightnessPct: MOD39_CONSTANTS.LIMITS.DEFAULT_BG_BRIGHTNESS_PCT,
        allowBgSound: false,
        bgVolume: MOD39_CONSTANTS.LIMITS.DEFAULT_BG_VOLUME_PCT
      };
    }

    loadWebBgState() {
      const defaults = this.getDefaultWebBgState();
      const parsed = safeJsonParse(safeStorageGet(MOD39_CONSTANTS.STORAGE_KEYS.WEB_BG_STATE), {});
      return {
        enabled: Boolean(parsed.enabled && (parsed.videoId || parsed.playlistId)),
        videoKey: parsed.videoKey || null,
        videoId: parsed.videoId || null,
        playlistId: parsed.playlistId || null,
        watchUrl: parsed.watchUrl || null,
        title: typeof parsed.title === 'string' ? parsed.title : '',
        opacityPct: clampNumber(parsed.opacityPct, 10, 100, defaults.opacityPct),
        blurPx: clampNumber(parsed.blurPx, 0, 18, defaults.blurPx),
        brightnessPct: clampNumber(parsed.brightnessPct, 25, 115, defaults.brightnessPct),
        allowBgSound: Boolean(parsed.allowBgSound),
        bgVolume: clampNumber(parsed.bgVolume, 0, 100, defaults.bgVolume)
      };
    }

    saveWebBgState(state) {
      return safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.WEB_BG_STATE, JSON.stringify(state || {}));
    }

    loadCurrentVideo() {
      const parsed = safeJsonParse(safeStorageGet(MOD39_CONSTANTS.STORAGE_KEYS.CURRENT_VIDEO), null);
      if (!parsed || (!parsed.videoId && !parsed.playlistId)) return null;
      return parsed;
    }

    saveCurrentVideo(videoRecord) {
      if (!videoRecord) {
        try {
          global.localStorage?.removeItem(MOD39_CONSTANTS.STORAGE_KEYS.CURRENT_VIDEO);
        } catch (_e) {}
        return true;
      }
      return safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.CURRENT_VIDEO, JSON.stringify(videoRecord));
    }

    loadRecentVideos() {
      const list = safeJsonParse(safeStorageGet(MOD39_CONSTANTS.STORAGE_KEYS.RECENT_VIDEOS), []);
      return Array.isArray(list) ? list.filter((it) => it && (it.videoId || it.playlistId)) : [];
    }

    pushRecentVideo(item) {
      if (!item || (!item.videoId && !item.playlistId)) return [];
      const key = item.key || (item.videoId ? `vid:${item.videoId}` : `pl:${item.playlistId}`);
      const existing = this.loadRecentVideos().filter((r) => r.key !== key);
      const nextItem = {
        key,
        videoId: item.videoId || null,
        playlistId: item.playlistId || null,
        watchUrl: item.watchUrl || '',
        thumbnailUrl: item.thumbnailUrl || '',
        isLive: Boolean(item.isLive),
        title: item.title || (item.videoId ? `Video YouTube (${item.videoId})` : `Danh sách phát (${item.playlistId})`),
        lastOpenedAt: new Date().toISOString()
      };
      const updated = [nextItem, ...existing].slice(0, MOD39_CONSTANTS.LIMITS.MAX_RECENT_VIDEOS);
      safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.RECENT_VIDEOS, JSON.stringify(updated));
      return updated;
    }

    updateTitleAcrossVault(videoKey, newTitle) {
      const cleanTitle = String(newTitle || '').trim();
      if (!videoKey || !cleanTitle) return;

      const cur = this.loadCurrentVideo();
      if (cur && cur.key === videoKey) {
        cur.title = cleanTitle;
        this.saveCurrentVideo(cur);
      }

      const recents = this.loadRecentVideos().map((r) =>
        r.key === videoKey ? { ...r, title: cleanTitle } : r
      );
      safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.RECENT_VIDEOS, JSON.stringify(recents));

      const favs = this.loadFavoriteVideos().map((f) =>
        f.key === videoKey ? { ...f, title: cleanTitle } : f
      );
      safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.FAVORITE_VIDEOS, JSON.stringify(favs));
    }

    updateLiveStatusAcrossVault(videoKey, isLive) {
      if (!videoKey) return;
      const liveFlag = Boolean(isLive);

      const cur = this.loadCurrentVideo();
      if (cur && cur.key === videoKey && Boolean(cur.isLive) !== liveFlag) {
        cur.isLive = liveFlag;
        this.saveCurrentVideo(cur);
      }

      const recents = this.loadRecentVideos();
      if (recents.some((r) => r.key === videoKey && Boolean(r.isLive) !== liveFlag)) {
        safeStorageSet(
          MOD39_CONSTANTS.STORAGE_KEYS.RECENT_VIDEOS,
          JSON.stringify(recents.map((r) => (r.key === videoKey ? { ...r, isLive: liveFlag } : r)))
        );
      }

      const favs = this.loadFavoriteVideos();
      if (favs.some((f) => f.key === videoKey && Boolean(f.isLive) !== liveFlag)) {
        safeStorageSet(
          MOD39_CONSTANTS.STORAGE_KEYS.FAVORITE_VIDEOS,
          JSON.stringify(favs.map((f) => (f.key === videoKey ? { ...f, isLive: liveFlag } : f)))
        );
      }
    }

    removeRecentVideo(videoKey) {
      const next = this.loadRecentVideos().filter((r) => r.key !== videoKey);
      safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.RECENT_VIDEOS, JSON.stringify(next));
      return next;
    }

    loadFavoriteVideos() {
      const list = safeJsonParse(safeStorageGet(MOD39_CONSTANTS.STORAGE_KEYS.FAVORITE_VIDEOS), []);
      return Array.isArray(list) ? list.filter((it) => it && (it.videoId || it.playlistId)) : [];
    }

    isFavorite(videoKey) {
      return this.loadFavoriteVideos().some((f) => f.key === videoKey);
    }

    toggleFavoriteVideo(item) {
      if (!item || (!item.videoId && !item.playlistId)) {
        return { added: false, list: this.loadFavoriteVideos() };
      }
      const key = item.key || (item.videoId ? `vid:${item.videoId}` : `pl:${item.playlistId}`);
      const list = this.loadFavoriteVideos();
      const idx = list.findIndex((f) => f.key === key);
      if (idx >= 0) {
        list.splice(idx, 1);
        safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.FAVORITE_VIDEOS, JSON.stringify(list));
        return { added: false, list };
      }

      const nextRecord = {
        key,
        videoId: item.videoId || null,
        playlistId: item.playlistId || null,
        watchUrl: item.watchUrl || '',
        thumbnailUrl: item.thumbnailUrl || '',
        isLive: Boolean(item.isLive),
        title: item.title || (item.videoId ? `Video yêu thích (${item.videoId})` : `Playlist (${item.playlistId})`),
        pinnedAt: new Date().toISOString()
      };
      const updated = [nextRecord, ...list].slice(0, MOD39_CONSTANTS.LIMITS.MAX_FAVORITE_VIDEOS);
      safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.FAVORITE_VIDEOS, JSON.stringify(updated));
      return { added: true, list: updated };
    }

    loadAbLoopMap() {
      const parsed = safeJsonParse(safeStorageGet(MOD39_CONSTANTS.STORAGE_KEYS.AB_LOOP_MAP), {});
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }

    getAbLoopForVideo(videoKey) {
      if (!videoKey) return { startSec: null, endSec: null, enabled: false };
      const rec = this.abLoopMap[videoKey];
      if (!rec) return { startSec: null, endSec: null, enabled: false };
      const startSec = typeof rec.startSec === 'number' && rec.startSec >= 0 ? Math.floor(rec.startSec) : null;
      let endSec = typeof rec.endSec === 'number' && rec.endSec >= 0 ? Math.floor(rec.endSec) : null;
      let enabled = Boolean(rec.enabled);
      if (startSec !== null && endSec !== null && endSec - startSec < MOD39_CONSTANTS.LIMITS.MIN_AB_GAP_SECONDS) {
        endSec = null;
        enabled = false;
      }
      if (startSec === null || endSec === null) {
        enabled = false;
      }
      return { startSec, endSec, enabled };
    }

    saveAbLoopForVideo(videoKey, loopData) {
      if (!videoKey) return;
      this.abLoopMap[videoKey] = {
        startSec: typeof loopData.startSec === 'number' ? loopData.startSec : null,
        endSec: typeof loopData.endSec === 'number' ? loopData.endSec : null,
        enabled: Boolean(loopData.enabled)
      };
      safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.AB_LOOP_MAP, JSON.stringify(this.abLoopMap));
    }
  }

  // ==========================================================================
  // 3B. CÔNG CỤ TÌM KIẾM VIDEO YOUTUBE TRỰC TIẾP TRONG WEB (INVIDIOUS + PIPED)
  //     Không cần API Key, không giới hạn lượt tìm, Fallback kép 4s & sessionStorage Cache
  // ==========================================================================
  class YouTubeInAppSearchCoordinator {
    constructor(parser) {
      this.parser = parser;
      this.lastQuery = '';
      this.lastResults = [];
      this.lastSourceHost = '';
      this.lastError = '';
      this.isSearching = false;
      this.activeAbortCtrl = null;
    }

    getCacheKey(query) {
      return `${MOD39_CONSTANTS.STORAGE_KEYS.SEARCH_CACHE_PREFIX}${String(query || '').trim().toLowerCase()}`;
    }

    readSessionCache(query) {
      try {
        if (typeof global.sessionStorage === 'undefined') return null;
        const raw = global.sessionStorage.getItem(this.getCacheKey(query));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch (_err) {
        return null;
      }
    }

    writeSessionCache(query, results) {
      try {
        if (typeof global.sessionStorage === 'undefined') return false;
        if (!Array.isArray(results) || results.length === 0) return false;
        global.sessionStorage.setItem(this.getCacheKey(query), JSON.stringify(results));
        return true;
      } catch (_err) {
        return false;
      }
    }

    normalizeResults(rawData, sourceType) {
      const normalized = [];
      const seenIds = new Set();

      if (sourceType === 'invidious' && Array.isArray(rawData)) {
        for (const item of rawData) {
          const itemType = String(item?.type || 'video');
          if (!item || (itemType !== 'video' && itemType !== 'shortVideo') || !item.videoId) continue;
          const id = String(item.videoId).trim();
          if (!this.parser.isValidVideoId(id) || seenIds.has(id)) continue;
          seenIds.add(id);
          const durSec = Number(item.lengthSeconds) || 0;
          const isLive = Boolean(item.liveNow);
          const rawViews = Number(item.viewCount);
          const viewsText = Number.isFinite(rawViews) && rawViews >= 0
            ? (rawViews >= 1e9 ? `${(rawViews / 1e9).toFixed(1).replace(/\.0$/, '')}B`
              : rawViews >= 1e6 ? `${(rawViews / 1e6).toFixed(1).replace(/\.0$/, '')}M`
              : rawViews >= 1e3 ? `${(rawViews / 1e3).toFixed(1).replace(/\.0$/, '')}K`
              : String(rawViews))
            : String(item.viewCountText || '').trim();
          let uploadDateShort = '';
          const pubSec = Number(item.published);
          if (Number.isFinite(pubSec) && pubSec > 946684800) {
            const d = new Date(pubSec * 1000);
            uploadDateShort = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          } else if (item.publishedText) {
            uploadDateShort = String(item.publishedText).trim();
          }
          normalized.push({
            videoId: id,
            title: String(item.title || `Video (${id})`),
            author: String(item.author || 'YouTube'),
            viewsText,
            uploadDateShort,
            isLive,
            duration: isLive ? '🔴 LIVE' : durSec > 0 ? formatSecondsToClock(durSec) : '',
            durationSec: !isLive && durSec > 0 ? durSec : 0,
            thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`,
            watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
          });
          if (normalized.length >= 18) break;
        }
        return normalized;
      }

      const items = rawData && Array.isArray(rawData.items) ? rawData.items : [];
      if (sourceType === 'piped' && items.length > 0) {
        for (const item of items) {
          if (!item || !item.url) continue;
          const urlStr = String(item.url);
          const idMatch = urlStr.match(/(?:v=|\/shorts\/|\/live\/|\/watch\/)([A-Za-z0-9_-]{11})/);
          const id = idMatch ? idMatch[1] : '';
          if (!id || !this.parser.isValidVideoId(id) || seenIds.has(id)) continue;
          seenIds.add(id);
          const durNum = Number(item.duration);
          const isLive = durNum === -1 || Boolean(item.livestream) || Boolean(item.liveNow);
          const durationLabel = isLive ? '🔴 LIVE' : durNum > 0 ? formatSecondsToClock(durNum) : '';
          const rawViews = Number(item.views);
          const viewsText = Number.isFinite(rawViews) && rawViews >= 0
            ? (rawViews >= 1e9 ? `${(rawViews / 1e9).toFixed(1).replace(/\.0$/, '')}B`
              : rawViews >= 1e6 ? `${(rawViews / 1e6).toFixed(1).replace(/\.0$/, '')}M`
              : rawViews >= 1e3 ? `${(rawViews / 1e3).toFixed(1).replace(/\.0$/, '')}K`
              : String(rawViews))
            : '';
          let uploadDateShort = '';
          const upMs = Number(item.uploaded);
          if (Number.isFinite(upMs) && upMs > 946684800000) {
            const d = new Date(upMs);
            uploadDateShort = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          } else if (item.uploadedDate) {
            const rawRel = String(item.uploadedDate).trim();
            const mRel = rawRel.match(/(\d+)\s*(year|month|week|day|hour|minute)/i);
            if (mRel) {
              const qty = Number(mRel[1]) || 0;
              const unit = mRel[2].toLowerCase();
              const msMap = { minute: 60e3, hour: 3600e3, day: 86400e3, week: 604800e3, month: 2592000e3, year: 31536000e3 };
              const est = new Date(Date.now() - qty * (msMap[unit] || 0));
              uploadDateShort = `${String(est.getDate()).padStart(2, '0')}/${String(est.getMonth() + 1).padStart(2, '0')}/${est.getFullYear()}`;
            } else {
              uploadDateShort = rawRel;
            }
          }
          normalized.push({
            videoId: id,
            title: String(item.title || `Video (${id})`),
            author: String(item.uploaderName || 'YouTube'),
            viewsText,
            uploadDateShort,
            isLive,
            duration: durationLabel,
            durationSec: !isLive && durNum > 0 ? durNum : 0,
            thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`,
            watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
          });
          if (normalized.length >= 18) break;
        }
      }

      return normalized;
    }

    async fetchDynamicInvidiousMirrors(fetchFn) {
      const CACHE_KEY = 'mod39_dyn_invidious_hosts_v1';
      try {
        const cached = global.sessionStorage ? global.sessionStorage.getItem(CACHE_KEY) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.hosts) && Date.now() - Number(parsed.ts || 0) < 600000) {
            return parsed.hosts;
          }
        }
      } catch (_e) {}

      const AbortCtrl = typeof global.AbortController === 'function' ? global.AbortController : null;
      const controller = AbortCtrl ? new AbortCtrl() : null;
      const tid = controller ? setTimeout(() => { try { controller.abort(); } catch (_e) {} }, 3000) : null;
      try {
        const res = await fetchFn(
          'https://api.invidious.io/instances.json?sort_by=health',
          controller ? { signal: controller.signal } : undefined
        );
        if (tid) clearTimeout(tid);
        if (!res || !res.ok) return [];
        const rows = await res.json();
        if (!Array.isArray(rows)) return [];
        const knownSet = new Set(MOD39_CONSTANTS.SEARCH_SOURCES.map((s) => s.url));
        const hosts = [];
        for (const entry of rows) {
          if (!Array.isArray(entry) || entry.length < 2) continue;
          const meta = entry[1];
          if (!meta || meta.type !== 'https' || !meta.api || !meta.uri) continue;
          const cleanUri = String(meta.uri).replace(/\/+$/, '');
          const searchUrl = `${cleanUri}/api/v1/search`;
          if (knownSet.has(searchUrl)) continue;
          hosts.push({ type: 'invidious', url: searchUrl });
          if (hosts.length >= 3) break;
        }
        try {
          if (global.sessionStorage && hosts.length > 0) {
            global.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), hosts }));
          }
        } catch (_e) {}
        return hosts;
      } catch (_err) {
        if (tid) clearTimeout(tid);
        return [];
      }
    }

    getPreferredRegionCode() {
      try {
        const lang = String(NS.i18n?.getLanguage?.() || '').toLowerCase();
        if (!lang || lang === 'vi') return 'VN';
        if (lang === 'ja') return 'JP';
        if (lang === 'ko') return 'KR';
        if (lang === 'zh-tw') return 'TW';
        if (lang === 'zh-cn') return 'HK';
      } catch (_e) {}
      return 'VN';
    }

    async querySingleSource(source, query, fetchFn, externalSignal = null) {
      const AbortCtrl = typeof global.AbortController === 'function' ? global.AbortController : null;
      const controller = AbortCtrl ? new AbortCtrl() : null;
      this.activeAbortCtrl = controller;
      const onExtAbort = () => {
        try { controller?.abort(); } catch (_e) {}
      };
      if (externalSignal && controller) {
        if (externalSignal.aborted) onExtAbort();
        else externalSignal.addEventListener('abort', onExtAbort, { once: true });
      }
      const timeoutId = controller
        ? setTimeout(() => {
            try {
              controller.abort();
            } catch (_e) {}
          }, MOD39_CONSTANTS.SEARCH_TIMEOUT_MS)
        : null;

      try {
        const region = this.getPreferredRegionCode();
        const regionParam = region ? `&region=${encodeURIComponent(region)}` : '';
        const filterVal = source.filter || 'all';
        const endpoint =
          source.type === 'invidious'
            ? `${source.url}?q=${encodeURIComponent(query)}&type=video${regionParam}`
            : `${source.url}?q=${encodeURIComponent(query)}&filter=${encodeURIComponent(filterVal)}${regionParam}`;

        const response = await fetchFn(endpoint, controller ? { signal: controller.signal } : undefined);
        if (timeoutId) clearTimeout(timeoutId);
        if (!response || !response.ok) return null;

        const rawData = await response.json();
        const list = this.normalizeResults(rawData, source.type);
        return list.length > 0 ? list : null;
      } catch (_err) {
        if (timeoutId) clearTimeout(timeoutId);
        return null;
      }
    }

    async searchVideos(rawQuery) {
      const query = String(rawQuery || '').trim();
      if (!query) {
        return { ok: false, query: '', videos: [], message: 'Hãy nhập từ khóa cần tìm kiếm.' };
      }

      this.lastQuery = query;
      this.lastError = '';

      // 1) Đọc Cache trong sessionStorage để phản hồi tức thì
      const cached = this.readSessionCache(query);
      if (cached) {
        this.lastResults = cached;
        this.lastSourceHost = 'sessionStorage';
        return { ok: true, cached: true, query, videos: cached, sourceHost: 'sessionStorage' };
      }

      // Hủy request tìm kiếm trước đó nếu người dùng gõ từ khóa mới ngay lập tức
      if (this.activeAbortCtrl) {
        try {
          this.activeAbortCtrl.abort();
        } catch (_e) {}
      }

      this.isSearching = true;
      const fetchFn = typeof global.fetch === 'function' ? global.fetch.bind(global) : null;
      if (!fetchFn) {
        this.isSearching = false;
        this.lastError = 'Trình duyệt hiện tại không hỗ trợ Fetch API.';
        return { ok: false, query, videos: [], message: this.lastError };
      }

      const buildHit = (source, list) => {
        this.writeSessionCache(query, list);
        this.lastResults = list;
        try {
          this.lastSourceHost = new URL(source.url).hostname;
        } catch (_e) {
          this.lastSourceHost = source.type;
        }
        return {
          ok: true,
          cached: false,
          query,
          videos: list,
          sourceHost: this.lastSourceHost
        };
      };

      // Đua song song theo cụm để phản hồi ~300-800ms (kèm &region=VN để tìm chuẩn nhạc Việt như Sơn Tùng M-TP)
      const raceBatch = (sources) =>
        new Promise((resolveBatch) => {
          if (!Array.isArray(sources) || !sources.length) {
            resolveBatch(null);
            return;
          }
          const AbortCtrl = typeof global.AbortController === 'function' ? global.AbortController : null;
          const batchCtrl = AbortCtrl ? new AbortCtrl() : null;
          let settled = false;
          let pending = sources.length;
          for (const source of sources) {
            this.querySingleSource(source, query, fetchFn, batchCtrl ? batchCtrl.signal : null)
              .then((list) => {
                if (settled) return;
                if (list && list.length > 0) {
                  settled = true;
                  try { batchCtrl?.abort(); } catch (_e) {}
                  resolveBatch(buildHit(source, list));
                  return;
                }
                pending -= 1;
                if (pending <= 0) resolveBatch(null);
              })
              .catch(() => {
                if (settled) return;
                pending -= 1;
                if (pending <= 0) resolveBatch(null);
              });
          }
        });

      const trySequential = async (sources) => {
        for (const source of sources) {
          const list = await this.querySingleSource(source, query, fetchFn);
          if (list && list.length > 0) {
            return buildHit(source, list);
          }
        }
        return null;
      };

      const batch1 = MOD39_CONSTANTS.SEARCH_SOURCES.filter((s) => (s.batch || 1) === 1);
      const batch2 = MOD39_CONSTANTS.SEARCH_SOURCES.filter((s) => s.batch === 2);
      const batch3 = MOD39_CONSTANTS.SEARCH_SOURCES.filter((s) => s.batch === 3);

      const hit1 = await raceBatch(batch1);
      if (hit1) {
        this.isSearching = false;
        this.activeAbortCtrl = null;
        return hit1;
      }

      // Thử cụm dự phòng (bao gồm music_songs + Invidious/Piped phụ)
      const hit2 = await trySequential([...batch2, ...batch3]);
      if (hit2) {
        this.isSearching = false;
        this.activeAbortCtrl = null;
        return hit2;
      }

      // Dự phòng động: lấy top host Invidious còn khỏe theo thời gian thực nếu các node tĩnh bị nghẽn
      const dynamicSources = await this.fetchDynamicInvidiousMirrors(fetchFn);
      if (dynamicSources.length > 0) {
        const dynamicHit = await raceBatch(dynamicSources);
        if (dynamicHit) {
          this.isSearching = false;
          this.activeAbortCtrl = null;
          return dynamicHit;
        }
      }

      this.isSearching = false;
      this.activeAbortCtrl = null;
      this.lastResults = [];
      this.lastError =
        'Các máy chủ tìm kiếm miễn phí tạm thời quá tải hoặc đang ngoại tuyến. Bạn vẫn có thể bấm nút "Mở Kết Quả YouTube ↗" hoặc dán thẳng link video vào ô trên.';
      return {
        ok: false,
        query,
        videos: [],
        message: this.lastError
      };
    }

    async probeVideoLiveMetadata(videoId) {
      const vid = String(videoId || '').trim();
      if (!vid || !this.parser.isValidVideoId(vid)) return { known: false, isLive: false };

      const fromLast = Array.isArray(this.lastResults)
        ? this.lastResults.find((item) => item && item.videoId === vid)
        : null;
      if (fromLast && (fromLast.isLive || Number(fromLast.durationSec) > 0)) {
        return {
          known: true,
          isLive: Boolean(fromLast.isLive),
          title: fromLast.title || ''
        };
      }

      const cacheKey = `mod39_yt_vid_live_${vid}`;
      try {
        if (typeof global.sessionStorage !== 'undefined') {
          const raw = global.sessionStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Date.now() - Number(parsed.ts || 0) < 900000) {
              return { known: true, isLive: Boolean(parsed.isLive), title: parsed.title || '' };
            }
          }
        }
      } catch (_e) {}

      const fetchFn = typeof global.fetch === 'function' ? global.fetch.bind(global) : null;
      if (!fetchFn) return { known: false, isLive: false };

      for (const source of MOD39_CONSTANTS.SEARCH_SOURCES.slice(0, 4)) {
        const list = await this.querySingleSource(source, vid, fetchFn);
        const hit = Array.isArray(list) ? list.find((item) => item && item.videoId === vid) : null;
        if (hit && (hit.isLive || Number(hit.durationSec) > 0)) {
          const meta = { known: true, isLive: Boolean(hit.isLive), title: hit.title || '' };
          try {
            if (typeof global.sessionStorage !== 'undefined') {
              global.sessionStorage.setItem(cacheKey, JSON.stringify({ ...meta, ts: Date.now() }));
            }
          } catch (_e) {}
          return meta;
        }
      }
      return { known: false, isLive: false };
    }
  }

  // ==========================================================================
  // 4. CẦU NỐI YOUTUBE IFRAME API & TRUYỀN LỆNH POSTMESSAGE AN TOÀN
  // ==========================================================================
  class YouTubeIframeApiBridgeAndCommandBus {
    constructor(parser) {
      this.parser = parser;
      this.mainIframeId = 'mod39-yt-player-iframe';
      this.ytPlayer = null;
      this.isYtApiLoaded = false;
      this.isYtApiLoading = false;
      this.playerReady = false;
      this._ytApiReady = false;
      this._ytApiAttachInFlight = false;
      this.pendingCallbacks = [];
      this.lastKnownTime = 0;
      this.lastKnownDuration = 0;
      this.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED;
      this.lastKnownPlaybackRate = 1;
      this.lastKnownIsLive = false;
      this._liveSignalVideoId = '';
      this._lastLivePollCheckMs = 0;
      this.assumedAutoplaying = false;
      this.lastErrorCode = null;
      this._fgMountGeneration = 0;
      this._fgIframeAcked = false;
      this._lastMountedVideoKey = '';
      this._fgListeningTimer = null;
      this._fgListenersRegisteredGen = -1;
      this._lastHandshakeCheckAtMs = 0;
      this._fgMountAtMs = 0;
      this._lastPlayCommandAtMs = 0;
      this._lastMessageTimeAtMs = 0;
      this._lastMessageStateAtMs = 0;
      this.listeners = {
        onReady: [],
        onStateChange: [],
        onError: [],
        onTimeTick: [],
        onDurationDetected: [],
        onPlaybackRateChange: [],
        onTitleDetected: [],
        onVideoIdDetected: [],
        onLiveStatusDetected: []
      };
      this.telemetry = {
        apiScriptLoads: 0,
        postMessageFallbacks: 0,
        commandsDispatched: 0,
        listeningHandshakesSent: 0,
        lastCommand: null
      };
      this.boundMessageHandler = null;
    }

    on(eventName, handler) {
      if (this.listeners[eventName] && typeof handler === 'function') {
        this.listeners[eventName].push(handler);
      }
    }

    emit(eventName, payload) {
      const arr = this.listeners[eventName] || [];
      for (const fn of arr) {
        try {
          fn(payload);
        } catch (_err) {}
      }
    }

    _stopListeningHandshake() {
      if (this._fgListeningTimer) {
        clearInterval(this._fgListeningTimer);
        this._fgListeningTimer = null;
      }
    }

    _registerIframeNativeListenersOnce(iframeEl) {
      if (!iframeEl || !iframeEl.contentWindow) return;
      if (this._fgListenersRegisteredGen === this._fgMountGeneration) return;
      this._fgListenersRegisteredGen = this._fgMountGeneration;
      ['onStateChange', 'onError', 'onPlaybackRateChange'].forEach((evName) => {
        this.sendRawPostMessageToIframe(iframeEl, {
          event: 'command',
          func: 'addEventListener',
          args: [evName],
          id: 1,
          channel: 'widget'
        });
      });
    }

    startListeningHandshake(iframeEl, widgetId = 1, gen = this._fgMountGeneration) {
      this._stopListeningHandshake();
      if (!iframeEl) return;
      this._fgIframeAcked = false;
      let attempts = 0;
      const sendPulse = () => {
        if (gen !== this._fgMountGeneration || this._fgIframeAcked) {
          this._stopListeningHandshake();
          return;
        }
        const liveEl =
          typeof document !== 'undefined' ? document.getElementById(this.mainIframeId) : iframeEl;
        if (!liveEl || !liveEl.contentWindow) return;
        attempts += 1;
        this.telemetry.listeningHandshakesSent += 1;
        this.sendRawPostMessageToIframe(liveEl, {
          event: 'listening',
          id: widgetId,
          channel: 'widget'
        });
        if (attempts >= 24) {
          this._stopListeningHandshake();
        }
      };
      sendPulse();
      this._fgListeningTimer = setInterval(sendPulse, 250);
    }

    ensureBridgeConnected(prefs = {}) {
      if (typeof document === 'undefined') return false;
      const iframeEl = document.getElementById(this.mainIframeId);
      if (!iframeEl || !iframeEl.contentWindow || !iframeEl.getAttribute('src')) return false;
      const now = Date.now();
      this._lastHandshakeCheckAtMs = now;
      if (!this._fgIframeDomLoaded && this._fgMountAtMs > 0 && now - this._fgMountAtMs >= 1200) {
        this._fgIframeDomLoaded = true;
      }
      if (!this._fgIframeDomLoaded) {
        return false;
      }
      if (!this._fgIframeAcked) {
        this.telemetry.listeningHandshakesSent += 1;
        this.sendRawPostMessageToIframe(iframeEl, {
          event: 'listening',
          id: 1,
          channel: 'widget'
        });
        this._registerIframeNativeListenersOnce(iframeEl);
      }
      if (
        !this._ytApiReady &&
        !this._ytApiAttachInFlight &&
        typeof global.location !== 'undefined' &&
        /^https?:$/i.test(String(global.location?.protocol || ''))
      ) {
        this.attachYtPlayerApiToExistingIframe(prefs, this._fgMountGeneration);
      }
      return true;
    }

    ensureMessageBridgeAttached() {
      if (this.boundMessageHandler || typeof global.addEventListener !== 'function') return;
      this.boundMessageHandler = (event) => {
        if (!event || !event.data) return;
        const bgIframe =
          typeof document !== 'undefined' ? document.getElementById('mod39-youtube-bg-iframe') : null;
        if (bgIframe && bgIframe.contentWindow && event.source === bgIframe.contentWindow) {
          return;
        }
        const fgIframe =
          typeof document !== 'undefined' ? document.getElementById(this.mainIframeId) : null;
        if (
          fgIframe &&
          fgIframe.contentWindow &&
          event.source &&
          event.source !== fgIframe.contentWindow &&
          event.source !== global
        ) {
          return;
        }
        const origin = String(event.origin || '');
        if (
          origin &&
          !origin.includes('youtube.com') &&
          !origin.includes('youtube-nocookie.com')
        ) {
          return;
        }
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (_e) {
            return;
          }
        }
        if (!data || typeof data !== 'object') return;

        // Bỏ qua thông điệp còn sót từ trang embed cũ trước khi iframe mới kích hoạt onload cho mountGen hiện tại
        if (this._fgIframeDomLoaded === false && event.source && event.source !== global) {
          return;
        }

        if (fgIframe && event.source && event.source === fgIframe.contentWindow) {
          this._fgIframeAcked = true;
          this._stopListeningHandshake();
          this._registerIframeNativeListenersOnce(fgIframe);
        }

        const isCrossWindowMsg = Boolean(event.source && event.source !== global);

        const isDelivery =
          (data.event === 'infoDelivery' || data.event === 'initialDelivery') &&
          data.info &&
          typeof data.info === 'object';

        if (isDelivery) {
          const info = data.info;
          const mod21ActiveNow = NS.youtubeStudio?.playerCtrl?.activeEngine === 'MOD21_AUDIO';
          if (typeof info.currentTime === 'number' && Number.isFinite(info.currentTime)) {
            this._lastVisualIframeTimeSec = info.currentTime;
            if (!mod21ActiveNow) {
              const incomingT = info.currentTime;
              const incomingSt = typeof info.playerState === 'number' ? info.playerState : this.lastKnownState;
              const isRecentSeekOrMount =
                Date.now() - (this._lastUserSeekAtMs || 0) < 3000 ||
                Date.now() - (this._fgMountAtMs || 0) < 4000;
              const isStaleZeroReset =
                incomingT <= 0.25 &&
                this.lastKnownTime > 1 &&
                (data.event === 'initialDelivery' ||
                  incomingSt !== MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
                  isRecentSeekOrMount);
              if (!isStaleZeroReset) {
                this.lastKnownTime = incomingT;
                this._lastMessageTimeAtMs = Date.now();
              }
            }
          }
          if (typeof info.duration === 'number' && info.duration > 0) {
            this.lastKnownDuration = info.duration;
            this.emit('onDurationDetected', info.duration);
          }
          if (!mod21ActiveNow && typeof info.playbackRate === 'number' && Number.isFinite(info.playbackRate) && info.playbackRate > 0) {
            if (info.playbackRate !== this.lastKnownPlaybackRate) {
              this.lastKnownPlaybackRate = info.playbackRate;
              this.emit('onPlaybackRateChange', info.playbackRate);
            }
          }
          if (typeof info.playerState === 'number') {
            this._lastVisualIframeState = info.playerState;
            if (!mod21ActiveNow) {
              this._lastStateWasSameWindowMock = !isCrossWindowMsg;
              if (this.shouldIgnoreTransientIframePauseEcho(info.playerState, isCrossWindowMsg)) {
                // Ignore asynchronous iframe PAUSED/CUED echo immediately following playVideo()
              } else {
                if (info.playerState !== MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED) {
                  this.assumedAutoplaying = false;
                }
                if (info.playerState === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING && !this._fgFirstPlayObservedAtMs) {
                  this._fgFirstPlayObservedAtMs = Date.now();
                }
                this.lastKnownState = info.playerState;
                this._lastMessageStateAtMs = Date.now();
                this.emit('onStateChange', info.playerState);
              }
            }
          }
          const msgVideoIsLive = Boolean(
            info.isLive === true ||
              info.progressState?.isLivePlayback === true ||
              info.videoData?.isLive === true ||
              info.videoData?.isWindowedLive === true ||
              info.videoData?.isManifestless === true
          );
          if (info.videoData) {
            if (info.videoData.title) {
              this.emit('onTitleDetected', info.videoData.title);
            }
            if (info.videoData.video_id) {
              this.emit('onVideoIdDetected', {
                videoId: info.videoData.video_id,
                title: info.videoData.title || '',
                isLive: msgVideoIsLive
              });
            }
          }
          if (msgVideoIsLive) {
            this.extractAndApplyLiveSignal(info, null);
          }
          this.emit('onTimeTick', {
            currentTime: this.lastKnownTime,
            duration: this.lastKnownDuration,
            state: this.lastKnownState,
            playbackRate: this.lastKnownPlaybackRate,
            isLive: this.lastKnownIsLive,
            fromMessage: true
          });
        } else if (data.event === 'onReady') {
          this.playerReady = true;
          this._fgIframeAcked = true;
          this._stopListeningHandshake();
          if (fgIframe) this._registerIframeNativeListenersOnce(fgIframe);
          this.emit('onReady', this.ytPlayer || null);
        } else if (data.event === 'onPlaybackRateChange' && typeof data.info === 'number') {
          if (data.info > 0 && data.info !== this.lastKnownPlaybackRate) {
            this.lastKnownPlaybackRate = data.info;
            this.emit('onPlaybackRateChange', data.info);
          }
        } else if (data.event === 'onStateChange' && typeof data.info === 'number') {
          if (NS.youtubeStudio?.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
            this._lastVisualIframeState = data.info;
            return;
          }
          this._lastStateWasSameWindowMock = !isCrossWindowMsg;
          if (!this.shouldIgnoreTransientIframePauseEcho(data.info, isCrossWindowMsg)) {
            if (data.info !== MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED) {
              this.assumedAutoplaying = false;
            }
            if (data.info === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING && !this._fgFirstPlayObservedAtMs) {
              this._fgFirstPlayObservedAtMs = Date.now();
            }
            this.lastKnownState = data.info;
            this._lastMessageStateAtMs = Date.now();
            this.emit('onStateChange', data.info);
          }
        } else if (data.event === 'onError' && typeof data.info === 'number') {
          this.lastErrorCode = data.info;
          this.emit('onError', data.info);
        }
      };
      global.addEventListener('message', this.boundMessageHandler);
    }

    loadYoutubeIframeApiScript() {
      return new Promise((resolve) => {
        if (global.YT && typeof global.YT.Player === 'function') {
          this.isYtApiLoaded = true;
          resolve(true);
          return;
        }
        this.pendingCallbacks.push(resolve);
        if (this.isYtApiLoading) return;
        this.isYtApiLoading = true;

        const prevGlobalReady = global.onYouTubeIframeAPIReady;
        global.onYouTubeIframeAPIReady = () => {
          if (typeof prevGlobalReady === 'function') {
            try {
              prevGlobalReady();
            } catch (_e) {}
          }
          this.isYtApiLoaded = true;
          this.isYtApiLoading = false;
          const queue = this.pendingCallbacks.splice(0, this.pendingCallbacks.length);
          queue.forEach((cb) => cb(true));
        };

        if (typeof document !== 'undefined' && document.head) {
          const existingScript = document.querySelector(
            'script[src*="youtube.com/iframe_api"]'
          );
          if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'mod39-youtube-iframe-api-script';
            script.src = MOD39_CONSTANTS.YT_IFRAME_API_SRC;
            script.async = true;
            script.onerror = () => {
              this.isYtApiLoading = false;
              const queue = this.pendingCallbacks.splice(0, this.pendingCallbacks.length);
              queue.forEach((cb) => cb(false));
            };
            document.head.appendChild(script);
            this.telemetry.apiScriptLoads += 1;
          }
        } else {
          this.isYtApiLoading = false;
          const queue = this.pendingCallbacks.splice(0, this.pendingCallbacks.length);
          queue.forEach((cb) => cb(false));
        }

        // Hết giờ dự phòng nếu môi trường offline/bị chặn
        setTimeout(() => {
          if (this.pendingCallbacks.length > 0) {
            this.isYtApiLoading = false;
            const queue = this.pendingCallbacks.splice(0, this.pendingCallbacks.length);
            queue.forEach((cb) => cb(Boolean(global.YT && global.YT.Player)));
          }
        }, 4500);
      });
    }

    mountEmbedUrlIntoIframe(parsedVideo, prefs = {}, options = {}) {
      this.ensureMessageBridgeAttached();
      const mountGen = ++this._fgMountGeneration;
      this._stopListeningHandshake();
      this._fgIframeAcked = false;
      this._fgIframeDomLoaded = false;
      this.lastErrorCode = null;
      this.lastKnownTime = parsedVideo.startSeconds || 0;
      this.lastKnownDuration = 0;
      this.lastKnownIsLive = Boolean(parsedVideo.isLive);
      this._liveSignalVideoId = String(parsedVideo.videoId || '');
      this._lastLivePollCheckMs = 0;
      const shouldAutoplay = options.autoplay !== false;
      this.lastKnownState = shouldAutoplay
        ? MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED
        : MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED;
      this.lastKnownPlaybackRate = Number(prefs.speed) || 1;
      this.assumedAutoplaying = shouldAutoplay;
      this.playerReady = false;
      this._ytApiReady = false;
      this._ytApiAttachInFlight = false;
      this._lastHandshakeCheckAtMs = Date.now();
      this._fgMountAtMs = Date.now();
      this._fgFirstPlayObservedAtMs = 0;
      this._lastPlayCommandAtMs = 0;
      this._lastMessageTimeAtMs = 0;
      this._lastMessageStateAtMs = 0;

      const currentEl =
        typeof document !== 'undefined' ? document.getElementById(this.mainIframeId) : null;
      const stageParent =
        (currentEl && currentEl.parentElement) ||
        (typeof document !== 'undefined'
          ? document.getElementById('mod39-player-stage-wrapper')
          : null);
      if (!stageParent && !currentEl) return false;

      const shouldMuteIframe =
        typeof options.muted === 'boolean' ? options.muted : Boolean(prefs.muted);
      this._mountedMutedOverride = typeof options.muted === 'boolean' ? options.muted : null;
      if (options.killExternalAudio !== false && options.muted !== true) {
        const ytCtrl = NS.youtubeStudio?.playerCtrl;
        if (ytCtrl) {
          ytCtrl._audibleIframeMountSeq = (Number(ytCtrl._audibleIframeMountSeq) || 0) + 1;
        }
        NS.audioStudio?.pauseExternalAudioStream?.(true);
      }
      const embedUrl = this.parser.buildPrivacyEmbedUrl({
        videoId: parsedVideo.videoId,
        playlistId: parsedVideo.playlistId,
        startSeconds: parsedVideo.startSeconds || 0,
        autoplay: shouldAutoplay,
        loop: Boolean(prefs.repeatMode) && !this.lastKnownIsLive,
        muted: shouldMuteIframe,
        controls: true,
        forBackground: false
      });

      // Hủy instance YT.Player cũ trước khi đổi src để tránh rò rỉ listener
      if (this.ytPlayer && typeof this.ytPlayer.destroy === 'function') {
        try {
          this.ytPlayer.destroy();
        } catch (_e) {}
        this.ytPlayer = null;
      }

      // Cực kỳ quan trọng: YT.Player.destroy() sẽ biến <iframe> thành <div>!
      // Đồng thời khi chuyển sang video khác, luôn gỡ <iframe> cũ và tạo <iframe> mới nguyên vẹn
      // để tránh thông điệp/tàn dư contentWindow của video cũ nhảy ngược đè video mới.
      const nextVideoKey = String(parsedVideo.videoId || parsedVideo.playlistId || '').trim();
      const videoSwitched = Boolean(
        nextVideoKey && this._lastMountedVideoKey && nextVideoKey !== this._lastMountedVideoKey
      );
      this._lastMountedVideoKey = nextVideoKey;

      let freshIframe = document.getElementById(this.mainIframeId);
      if (videoSwitched && freshIframe) {
        try {
          if (freshIframe.tagName && freshIframe.tagName.toUpperCase() === 'IFRAME') {
            freshIframe.setAttribute('src', 'about:blank');
          }
          freshIframe.remove();
        } catch (_e) {}
        freshIframe = null;
      }
      if (!freshIframe || !freshIframe.tagName || freshIframe.tagName.toUpperCase() !== 'IFRAME') {
        if (freshIframe) {
          try {
            freshIframe.remove();
          } catch (_e) {}
        }
        freshIframe = document.createElement('iframe');
        freshIframe.id = this.mainIframeId;
        freshIframe.className = 'w-full h-full border-0';
        freshIframe.title = 'Trình phát YouTube Chống Sao Nhãng — Web Viết Tiểu Thuyết Của Bi';
        if (stageParent) {
          stageParent.insertBefore(freshIframe, stageParent.firstChild);
        }
      }
      freshIframe.classList.remove('hidden');
      if (typeof document !== 'undefined') {
        const nativeHost = document.getElementById('mod39-native-video-host');
        if (nativeHost) nativeHost.classList.add('hidden');
      }
      freshIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      freshIframe.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
      );
      freshIframe.setAttribute('allowfullscreen', 'true');
      freshIframe.onload = () => {
        if (mountGen !== this._fgMountGeneration) return;
        this._fgIframeDomLoaded = true;
        this.startListeningHandshake(freshIframe, 1, mountGen);
        this.attachYtPlayerApiToExistingIframe(prefs, mountGen);
      };
      freshIframe.setAttribute('src', embedUrl);

      return true;
    }

    async attachYtPlayerApiToExistingIframe(prefs = {}, expectedGen = this._fgMountGeneration) {
      if (this._ytApiAttachInFlight) return false;
      this._ytApiAttachInFlight = true;
      let ready = false;
      try {
        ready = await this.loadYoutubeIframeApiScript();
      } finally {
        this._ytApiAttachInFlight = false;
      }
      if (expectedGen !== this._fgMountGeneration) return false;
      if (!ready || !global.YT || typeof global.YT.Player !== 'function') {
        return false;
      }
      const el = document.getElementById(this.mainIframeId);
      const srcNow = el ? String(el.getAttribute('src') || '') : '';
      if (!el || !el.tagName || el.tagName.toUpperCase() !== 'IFRAME' || !srcNow || srcNow === 'about:blank' || srcNow.indexOf('youtube') === -1) {
        return false;
      }

      try {
        if (this.ytPlayer && typeof this.ytPlayer.destroy === 'function' && this._ytApiReady) {
          return true;
        }
        this.ytPlayer = new global.YT.Player(this.mainIframeId, {
          host: MOD39_CONSTANTS.EMBED_HOST,
          events: {
            onReady: (ev) => {
              if (expectedGen !== this._fgMountGeneration) return;
              this.playerReady = true;
              this._ytApiReady = true;
              this._fgIframeAcked = true;
              this._stopListeningHandshake();
              try {
                if (typeof prefs.volume === 'number' && ev.target.setVolume) {
                  ev.target.setVolume(clampNumber(prefs.volume, 0, 100, 85));
                }
                if (prefs.muted && ev.target.mute) {
                  ev.target.mute();
                } else if (!prefs.muted && ev.target.unMute) {
                  ev.target.unMute();
                }
                if (typeof prefs.speed === 'number' && ev.target.setPlaybackRate) {
                  ev.target.setPlaybackRate(prefs.speed);
                }
                if (this.lastKnownTime > 1 && typeof ev.target.seekTo === 'function') {
                  const curT = Number(ev.target.getCurrentTime?.() || 0);
                  if (curT < 1) {
                    ev.target.seekTo(this.lastKnownTime, true);
                    if (this.lastKnownState === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED && typeof ev.target.pauseVideo === 'function') {
                      setTimeout(() => { try { ev.target.pauseVideo(); } catch (_eP) {} }, 60);
                    }
                  }
                }
                if (ev.target.getDuration) {
                  const durReady = Number(ev.target.getDuration());
                  if (Number.isFinite(durReady) && durReady > 0) {
                    this.lastKnownDuration = durReady;
                    this.emit('onDurationDetected', durReady);
                  }
                }
                const vData = ev.target.getVideoData ? ev.target.getVideoData() : null;
                if (vData) {
                  if (vData.title) this.emit('onTitleDetected', vData.title);
                  if (vData.video_id) {
                    this.emit('onVideoIdDetected', {
                      videoId: vData.video_id,
                      title: vData.title || '',
                      isLive: Boolean(vData.isLive || vData.isWindowedLive || vData.isManifestless)
                    });
                  }
                }
                this.extractAndApplyLiveSignal(null, ev.target);
              } catch (_err) {}
              this.emit('onReady', ev.target);
            },
            onStateChange: (ev) => {
              if (expectedGen !== this._fgMountGeneration) return;
              this._lastVisualIframeState = ev.data;
              if (NS.youtubeStudio?.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
                return;
              }
              this._lastStateWasSameWindowMock = false;
              if (this.shouldIgnoreTransientIframePauseEcho(ev.data, true)) {
                return;
              }
              if (ev.data !== MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED) {
                this.assumedAutoplaying = false;
              }
              this._fgIframeAcked = true;
              this._stopListeningHandshake();
              this.lastKnownState = ev.data;
              this._lastMessageStateAtMs = Date.now();
              try {
                if (ev.target && ev.target.getDuration) {
                  const dur = ev.target.getDuration();
                  if (dur > 0) this.lastKnownDuration = dur;
                }
                if (ev.target && ev.target.getCurrentTime) {
                  const t = ev.target.getCurrentTime();
                  const isRecentSeekOrMount =
                    Date.now() - (this._lastUserSeekAtMs || 0) < 3500 ||
                    Date.now() - (this._fgMountAtMs || 0) < 4500;
                  const isStaleZeroReset =
                    t <= 0.25 &&
                    this.lastKnownTime > 1 &&
                    (ev.data !== MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING || isRecentSeekOrMount);
                  if (Number.isFinite(t) && t >= 0 && !isStaleZeroReset) {
                    this.lastKnownTime = t;
                    this._lastMessageTimeAtMs = Date.now();
                  }
                }
                const vData = ev.target.getVideoData ? ev.target.getVideoData() : null;
                if (vData) {
                  if (vData.title) this.emit('onTitleDetected', vData.title);
                  if (vData.video_id) {
                    this.emit('onVideoIdDetected', {
                      videoId: vData.video_id,
                      title: vData.title || '',
                      isLive: Boolean(vData.isLive || vData.isWindowedLive || vData.isManifestless)
                    });
                  }
                }
                this.extractAndApplyLiveSignal(null, ev.target);
              } catch (_e) {}
              this.emit('onStateChange', ev.data);
            },
            onPlaybackRateChange: (ev) => {
              if (expectedGen !== this._fgMountGeneration) return;
              const rate = Number(ev?.data);
              if (Number.isFinite(rate) && rate > 0 && rate !== this.lastKnownPlaybackRate) {
                this.lastKnownPlaybackRate = rate;
                this.emit('onPlaybackRateChange', rate);
              }
            },
            onError: (ev) => {
              if (expectedGen !== this._fgMountGeneration) return;
              this.lastErrorCode = ev ? ev.data : null;
              this.emit('onError', this.lastErrorCode);
            }
          }
        });
        return true;
      } catch (_err) {
        return false;
      }
    }

    sendRawPostMessageToIframe(iframeEl, payloadObj) {
      if (!iframeEl || !iframeEl.contentWindow) return false;
      try {
        const msg =
          payloadObj && typeof payloadObj === 'object' && !payloadObj.channel
            ? { ...payloadObj, channel: 'widget' }
            : payloadObj;
        iframeEl.contentWindow.postMessage(JSON.stringify(msg), '*');
        return true;
      } catch (_e) {
        return false;
      }
    }

    dispatchPlayerCommand(funcName, args = []) {
      this.telemetry.commandsDispatched += 1;
      this.telemetry.lastCommand = funcName;

      // Chỉ tin cậy hoàn toàn instance YT.Player khi chính API này đã xác nhận onReady (đã gắn đúng host nocookie).
      // Nếu YT.Player chưa sẵn sàng (hoặc đang dùng kênh postMessage id=1 / file://), luôn gửi kèm postMessage('*').
      if (this.ytPlayer && this._ytApiReady && typeof this.ytPlayer[funcName] === 'function') {
        try {
          const result = this.ytPlayer[funcName](...args);
          return { ok: true, via: 'YT_API', result };
        } catch (_err) {}
      }

      // Dự phòng gửi postMessage chuẩn YouTube JSON command bus
      const iframeEl =
        typeof document !== 'undefined' ? document.getElementById(this.mainIframeId) : null;
      if (iframeEl && iframeEl.contentWindow) {
        this.telemetry.postMessageFallbacks += 1;
        this.sendRawPostMessageToIframe(iframeEl, {
          event: 'command',
          func: funcName,
          args: Array.isArray(args) ? args : [],
          id: 1,
          channel: 'widget'
        });
        return { ok: true, via: 'POST_MESSAGE', result: null };
      }

      return { ok: false, via: 'NONE', result: null };
    }

    extractAndApplyLiveSignal(info = null, ytPlayerObj = null) {
      let liveDetected = false;
      let detectedVideoId = this._liveSignalVideoId || '';
      if (info && typeof info === 'object') {
        if (info.isLive === true || info.progressState?.isLivePlayback === true) {
          liveDetected = true;
        }
        const vd = info.videoData;
        if (vd && typeof vd === 'object') {
          if (vd.video_id) detectedVideoId = String(vd.video_id).trim();
          if (vd.isLive === true || vd.isWindowedLive === true || vd.isManifestless === true) {
            liveDetected = true;
          }
        }
      }
      if (!liveDetected && ytPlayerObj) {
        try {
          const vData = typeof ytPlayerObj.getVideoData === 'function' ? ytPlayerObj.getVideoData() : null;
          if (vData && typeof vData === 'object') {
            if (vData.video_id) detectedVideoId = String(vData.video_id).trim();
            if (vData.isLive === true || vData.isWindowedLive === true || vData.isManifestless === true) {
              liveDetected = true;
            }
          }
          if (!liveDetected && typeof ytPlayerObj.getPlayerResponse === 'function') {
            const pResp = ytPlayerObj.getPlayerResponse();
            if (pResp?.videoDetails?.isLive === true) {
              liveDetected = true;
              if (pResp.videoDetails.videoId) {
                detectedVideoId = String(pResp.videoDetails.videoId).trim();
              }
            }
          }
        } catch (_e) {}
      }
      if (liveDetected && !this.lastKnownIsLive) {
        this.lastKnownIsLive = true;
        this._liveSignalVideoId = detectedVideoId || this._liveSignalVideoId;
        this.emit('onLiveStatusDetected', {
          isLive: true,
          videoId: this._liveSignalVideoId || ''
        });
      }
      return this.lastKnownIsLive;
    }

    shouldIgnoreTransientIframePauseEcho(stateVal, isCrossWindowMsg = true) {
      if (!isCrossWindowMsg) return false;
      const recentPlay = Boolean(this._lastPlayCommandAtMs && Date.now() - this._lastPlayCommandAtMs < 1800);
      if (
        !recentPlay ||
        (this.lastKnownState !== MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING &&
          this.lastKnownState !== MOD39_CONSTANTS.YT_PLAYER_STATES.BUFFERING)
      ) {
        return false;
      }
      return (
        stateVal === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED ||
        stateVal === MOD39_CONSTANTS.YT_PLAYER_STATES.CUED ||
        stateVal === MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED
      );
    }

    getCurrentPlaybackSnapshot() {
      const mod39Engine = NS.youtubeStudio?.playerCtrl?.activeEngine;
      const recentSeekGuard = Date.now() - (this._lastUserSeekAtMs || 0) < 3000;
      if (mod39Engine === 'MOD21_AUDIO' && NS.audioStudio?.getExternalAudioState) {
        const extSnap = NS.audioStudio.getExternalAudioState();
        if (extSnap && extSnap.active) {
          const ignoreZero = extSnap.currentTime <= 0.25 && this.lastKnownTime > 1 && (recentSeekGuard || extSnap.state !== MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING);
          const safeTime = ignoreZero ? this.lastKnownTime : extSnap.currentTime;
          this.lastKnownTime = safeTime;
          if (extSnap.duration > 0) this.lastKnownDuration = extSnap.duration;
          this.lastKnownState = extSnap.state;
          return {
            currentTime: safeTime,
            duration: extSnap.duration || this.lastKnownDuration,
            state: extSnap.state,
            isLive: this.lastKnownIsLive
          };
        }
      }
      const nativePlayer = NS.nativePlayer;
      if (nativePlayer && typeof nativePlayer.isActive === 'function' && nativePlayer.isActive()) {
        const nsSnap = nativePlayer.getSnapshot();
        const ignoreZero = nsSnap.currentTime <= 0.25 && this.lastKnownTime > 1 && (recentSeekGuard || nsSnap.state !== MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING);
        const safeTime = ignoreZero ? this.lastKnownTime : nsSnap.currentTime;
        this.lastKnownTime = safeTime;
        if (nsSnap.duration > 0) this.lastKnownDuration = nsSnap.duration;
        this.lastKnownState = nsSnap.state;
        this.lastKnownIsLive = Boolean(nsSnap.isLive);
        return {
          currentTime: safeTime,
          duration: nsSnap.duration || this.lastKnownDuration,
          state: nsSnap.state,
          isLive: this.lastKnownIsLive
        };
      }

      let currentTime = this.lastKnownTime;
      let duration = this.lastKnownDuration;
      let state = this.lastKnownState;
      const now = Date.now();
      const msgRecent = now - (this._lastMessageTimeAtMs || 0) < 120;
      const stateMsgRecent = now - (this._lastMessageStateAtMs || 0) < 120;

      const recentUserPlay = now - (this._lastPlayCommandAtMs || 0) < 1800;
      if (this.ytPlayer && this.playerReady) {
        try {
          if (typeof this.ytPlayer.getCurrentTime === 'function' && !msgRecent) {
            const t = this.ytPlayer.getCurrentTime();
            if (Number.isFinite(t) && t >= 0 && !(t === 0 && currentTime > 0)) {
              currentTime = t;
            }
          }
          if (typeof this.ytPlayer.getDuration === 'function') {
            const d = this.ytPlayer.getDuration();
            if (Number.isFinite(d) && d > 0) duration = d;
          }
          if (typeof this.ytPlayer.getPlayerState === 'function' && !stateMsgRecent) {
            const st = this.ytPlayer.getPlayerState();
            const holdPlaying =
              recentUserPlay &&
              state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING &&
              (st === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED ||
                st === MOD39_CONSTANTS.YT_PLAYER_STATES.CUED ||
                st === MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED);
            if (typeof st === 'number' && !holdPlaying && !(st === -1 && state !== -1)) {
              state = st;
            }
          }
          if (!this.lastKnownIsLive && now - (this._lastLivePollCheckMs || 0) >= 500) {
            this._lastLivePollCheckMs = now;
            this.extractAndApplyLiveSignal(null, this.ytPlayer);
          }
        } catch (_err) {}
      }

      this.lastKnownTime = currentTime;
      this.lastKnownDuration = duration;
      this.lastKnownState = state;
      return { currentTime, duration, state, isLive: this.lastKnownIsLive };
    }
  }

  // ==========================================================================
  // 4B. CẦU NỐI ÂM THANH TRONG NỀN MOBILE/PWA & MEDIA SESSION CHO YOUTUBE
  // ==========================================================================
  class YouTubeMobileBgAudioBridge {
    constructor(playerCtrl) {
      this.playerCtrl = playerCtrl;
      this.resolvedVideoId = '';
      this.resolvedStreamUrl = '';
      this.resolvedStreamInfo = null;
      this.streamFallbackReason = '';
      this.mode = 'idle'; // idle | resolving | native-video | audio-only-active | audio-bg-active | ready | iframe-fallback
      this.statusText =
        '📱 Sẵn sàng nâng cấp HTML5 Native Video/Audio (PiP hệ điều hành & phát nền khi thoát trình duyệt).';
      this._bgAudioTookOver = false;
      this._resolveVideoTarget = '';
      this._boundEvents = false;
      this._handlersRegistered = false;
      this._nativeEventsBound = false;
      this._lastBackgroundAudioFailToastMs = 0;
      this._bgReconnectState = null;
      this._autoReconnectDelayOverrideMs = null;
    }

    get audioEl() {
      return NS.nativePlayer?.ensureVideoElement?.() || null;
    }

    ensureNativeAudioElement() {
      const player = NS.nativePlayer;
      if (!player) return null;
      if (typeof document !== 'undefined') {
        const stageHost = document.getElementById('mod39-native-video-host');
        if (stageHost) player.attachStageHost(stageHost);
      }
      const el = player.ensureVideoElement();
      this._bindNativePlayerEventsOnce();
      return el;
    }

    _bindNativePlayerEventsOnce() {
      const player = NS.nativePlayer;
      if (!player || this._nativeEventsBound) return;
      this._nativeEventsBound = true;

      player.on('durationChange', (dur) => {
        if (Number.isFinite(dur) && dur > 0) {
          this.playerCtrl.bridge.lastKnownDuration = dur;
          this.playerCtrl.bridge.emit('onDurationDetected', dur);
        }
      });

      player.on('stateChange', (stateCode) => {
        if (!player.isActive()) return;
        if (player.visualMutedCompanion && this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
          if (!this._syncingVisualFromMod21 && player.isInSystemPiP) {
            if (stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED && !document.hidden) {
              NS.audioStudio?.setExternalAudioPaused?.(true);
            } else if (stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING) {
              NS.audioStudio?.setExternalAudioPaused?.(false);
            }
          }
          return;
        }
        this.playerCtrl.bridge.lastKnownState = stateCode;
        this.playerCtrl.bridge.emit('onStateChange', stateCode);
        this.syncStatusUi();
        this.playerCtrl.emitUiSync?.();
      });

      player.on('seeked', (ev) => {
        if (!player.isActive()) return;
        if (player.visualMutedCompanion && this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
          if (!this._syncingVisualFromMod21 && player.isInSystemPiP && Number.isFinite(ev?.currentTime)) {
            NS.audioStudio?.seekExternalAudio?.(ev.currentTime);
          }
        }
      });

      player.on('timeUpdate', (tick) => {
        if (!player.isActive()) return;
        if (player.visualMutedCompanion && this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
          return;
        }
        const prevDur = this.playerCtrl.bridge.lastKnownDuration;
        this.playerCtrl.bridge.lastKnownTime = tick.currentTime;
        if (tick.duration > 0) {
          this.playerCtrl.bridge.lastKnownDuration = tick.duration;
          if (!prevDur && !this.playerCtrl.isVideoLiveStream()) {
            this.playerCtrl._reconcileAbBoundsWithDuration(tick.duration);
          }
        }
        const curDur =
          tick.duration > 0 ? tick.duration : this.playerCtrl.bridge.lastKnownDuration;
        const curState =
          typeof tick.state === 'number'
            ? tick.state
            : this.playerCtrl.bridge.lastKnownState;
        this.playerCtrl._inspectForegroundJumpAndDrift(tick.currentTime, curState, 'native-time');
        if (!this.playerCtrl.isVideoLiveStream()) {
          this.playerCtrl._enforceAbLoopIfNeeded(tick.currentTime, curDur, curState);
        }
        if (!this.playerCtrl.isScrubbing) {
          this.playerCtrl.updateTimelineDomDirectly({
            currentTime: tick.currentTime,
            duration: curDur,
            state: curState
          });
        }
        this.enforceBackgroundAudioLoopTick();
      });

      player.on('playbackRateChange', (rate) => {
        if (!player.isActive() || player.visualMutedCompanion) return;
        if (Number.isFinite(rate) && rate > 0) {
          this.playerCtrl.bridge.lastKnownPlaybackRate = rate;
          this.playerCtrl.bridge.emit('onPlaybackRateChange', rate);
        }
      });

      player.on('ended', () => {
        if (!player.isActive() || player.visualMutedCompanion) return;
        const isLive = Boolean(this.playerCtrl?.isVideoLiveStream?.());
        const ab = this.playerCtrl.abLoop;
        if (!isLive && ab?.enabled && this.playerCtrl.isAbPairValid()) {
          player.seekTo(ab.startSec);
          player.play();
          return;
        }
        if (!isLive && this.playerCtrl.prefs?.repeatMode) {
          player.seekTo(0);
          player.play();
          return;
        }
        this._bgAudioTookOver = false;
        this.syncMediaSessionState('paused');
        this.syncStatusUi();
      });

      player.on('pipChange', (ev) => {
        this.syncStatusUi();
        this.playerCtrl.emitUiSync?.();
        if (ev?.active) {
          safeNotify(
            '🪟 Đã bật Cửa Sổ Nổi Hệ Điều Hành (PiP) — có thể thoát trình duyệt mà vẫn xem!',
            'success',
            2600
          );
        }
      });

      player.on('modeChange', (ev) => {
        if (ev?.provisional) return;
        if (typeof document !== 'undefined') {
          const nativeHost = document.getElementById('mod39-native-video-host');
          const iframeEl = document.getElementById(this.playerCtrl.bridge.mainIframeId);
          const resolvingCard = document.getElementById('mod39-resolving-poster-card');
          if (nativeHost && !ev?.backgroundAudioOnly) {
            player.attachStageHost(nativeHost);
          }

          if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO' && player.visualMutedCompanion) {
            if (ev?.active && ev.mode === 'video') {
              nativeHost?.classList.remove('hidden');
              resolvingCard?.classList.add('hidden');
              iframeEl?.classList.add('hidden');
            } else {
              nativeHost?.classList.add('hidden');
              this.syncAudioBridgeStageCard();
            }
            this.syncStatusUi();
            return;
          }

          if (ev?.active && ev.mode === 'video') {
            nativeHost?.classList.remove('hidden');
            resolvingCard?.classList.add('hidden');
            iframeEl?.classList.add('hidden');
            this._bgAudioTookOver = Boolean(ev?.backgroundAudioOnly);
            this.mode = ev?.backgroundAudioOnly ? 'audio-bg-active' : 'native-video';
            if (!ev?.backgroundAudioOnly) this.statusText = '';
          } else if (ev?.active && ev.mode === 'audio-only') {
            nativeHost?.classList.add('hidden');
            resolvingCard?.classList.add('hidden');
            this._bgAudioTookOver = true;
            this.mode = 'audio-only-active';
            this.statusText =
              '🎧 Đang phát Audio Nền trên lõi HTML5 (tắt màn hình / thoát trình duyệt vẫn nghe).';
          } else if (!ev?.active) {
            nativeHost?.classList.add('hidden');
            const curEngine = this.playerCtrl?.activeEngine;
            if (curEngine !== 'MOD21_AUDIO') {
              this._bgAudioTookOver = false;
            }
            this.syncAudioBridgeStageCard();
          }
        }
        this.syncStatusUi();
      });

      player.on('bgAudioError', (err) => {
        if (!player.isActive()) return;
        const resumeAt = Math.max(0, Math.floor(Number(err?.currentTime ?? player.lastKnownTime) || 0));
        if (player.mode === 'audio-only') {
          player.deactivate(false);
          this._bgAudioTookOver = false;
          this.playerCtrl.activeEngine = 'IFRAME';
          this._restoreForegroundStageFromFallback(resumeAt, this._iframeWasPlayingBeforeHidden);
          if (typeof document !== 'undefined' && document.hidden && this._iframeWasPlayingBeforeHidden) {
            this.playerCtrl.bridge.dispatchPlayerCommand('playVideo', []);
          }
          this.syncStatusUi();
          this.playerCtrl.emitUiSync?.();
        }
      });

      player.on('error', (err) => {
        if (!player.isActive()) return;
        if (player.visualMutedCompanion && this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
          // Luồng Audio Nền Tab 3 đang chạy ổn định — chỉ khi toàn bộ candidate trong stream hiện tại lỗi,
          // thử xin luồng mới 1 lần từ server khác trước khi chấp nhận dự phòng.
          const errVid = String(err?.videoId || this.playerCtrl?.activeVideo?.videoId || '').trim();
          const failedHost = this.resolvedStreamInfo?.sourceHost || '';
          const canRetryFresh = Boolean(
            errVid &&
            !this._retriedFreshVisualForVid?.[errVid] &&
            !/^blob:|^data:/i.test(String(err?.src || ''))
          );
          if (canRetryFresh) {
            this._retriedFreshVisualForVid = { ...(this._retriedFreshVisualForVid || {}), [errVid]: true };
            this.resolveDirectStream(errVid, true, {
              excludeHosts: failedHost ? [failedHost] : [],
              timeoutMs: 5000
            })
              .then((fresh) => {
                if (
                  fresh?.ok &&
                  !fresh.fallback &&
                  this.playerCtrl?.activeEngine === 'MOD21_AUDIO' &&
                  String(this.playerCtrl?.activeVideo?.videoId || '') === errVid &&
                  (fresh.videoStreamUrl || fresh.muxedVideoUrl || fresh.adaptiveVideoUrl || fresh.hlsUrl)
                ) {
                  this.resolvedStreamInfo = fresh;
                  return this._attachPairedVisualVideoToMod21(this.playerCtrl.activeVideo, fresh, {});
                }
                return false;
              })
              .catch(() => false);
            return;
          }
          player.deactivate(false, { preservePiP: false });
          this._iframeMutedVisualCompanion = false;
          this._silencedIframeForBgAudio = false;
          this._silenceForegroundIframeForNativeTakeover();
          this.syncAudioBridgeStageCard();
          this.syncStatusUi();
          this.playerCtrl.emitUiSync?.();
          return;
        }
        const resumeAt = Math.max(0, Math.floor(Number(err?.currentTime) || 0));
        const activeVid = this.playerCtrl.activeVideo;
        NS.audioStudio?.pauseExternalAudioStream?.(true);
        player.deactivate(false, { preservePiP: false });
        this._bgAudioTookOver = false;
        this._iframeMutedVisualCompanion = false;
        this._silencedIframeForBgAudio = false;
        this.playerCtrl.bridge._mountedMutedOverride = null;
        this.mode = 'iframe-fallback';
        this.playerCtrl.activeEngine = 'IFRAME';
        this.playerCtrl._lockedIframeSessionId = this.playerCtrl._engineSessionId || 0;
        this.streamFallbackReason =
          'Luồng stream trực tiếp bị gián đoạn hoặc hết hạn — tự động chuyển về iframe youtube-nocookie.com.';
        this.statusText = `📺 ${this.streamFallbackReason}`;
        this.syncAudioBridgeStageCard();
        if (typeof document !== 'undefined') {
          document.getElementById('mod39-native-video-host')?.classList.add('hidden');
          document.getElementById('mod39-resolving-poster-card')?.classList.add('hidden');
          document.getElementById('mod39-audio-only-stage')?.classList.add('hidden');
          document.getElementById(this.playerCtrl.bridge.mainIframeId)?.classList.remove('hidden');
        }
        if (activeVid && String(activeVid.videoId || '') === String(err?.videoId || '')) {
          this.playerCtrl.bridge.mountEmbedUrlIntoIframe(
            { ...activeVid, startSeconds: resumeAt },
            this.playerCtrl.prefs,
            { autoplay: true }
          );
        }
        NS.youtubeStudio?.viewRenderer?.syncFloatingMiniDock?.();
        this.syncStatusUi();
        this.playerCtrl.emitUiSync?.();
      });
    }

    bindGlobalEventsOnce() {
      if (this._boundEvents || typeof document === 'undefined') return;
      this._boundEvents = true;

      document.addEventListener('visibilitychange', () => {
        this.handleVisibilityChange(Boolean(document.hidden));
      });
      NS.bus?.on?.('screen:changed', (payload) => {
        const scr = typeof payload === 'string' ? payload : payload?.screenId || '';
        if (scr === 'SCREEN_5_AMBIENCE' && isDesktopDirectYoutubeEnv() && this.playerCtrl?.activeEngine === 'IFRAME') {
          setTimeout(() => this.nudgeDesktopIframeCompositorRepaint(), 40);
        }
      });
      if (typeof window !== 'undefined') {
        window.addEventListener('pagehide', () => this.handleVisibilityChange(true));
        window.addEventListener('pageshow', () => this.handleVisibilityChange(Boolean(document.hidden)));
        window.addEventListener('online', () => {
          this.nudgeAutoReconnectIfDue(true);
        });
        window.addEventListener('mod21:local-track-loaded', () => {
          this.stopAutoReconnectLoop({ silent: true });
          if (NS.nativePlayer?.isActive?.()) {
            NS.nativePlayer.deactivate(false);
          }
          if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
            this._bgAudioTookOver = false;
            this.mode = 'paused-by-local-mp3';
            this.playerCtrl.stopAndClearVideo(false);
          }
        });
      }
    }

    registerMediaSessionHandlersOnce() {
      const sharedBridge = NS.audioBackgroundBridge;
      if (sharedBridge && !this._handlersRegistered) {
        this._handlersRegistered = true;
        sharedBridge.registerSourceHandlers('youtube', {
          play: () => this.playerCtrl.play(),
          pause: () => this.playerCtrl.pause(),
          seekbackward: (details) => {
            const step = Number(details?.seekOffset) || MOD39_CONSTANTS.LIMITS.SEEK_STEP_SECONDS;
            this.playerCtrl.seekRelative(-step);
          },
          seekforward: (details) => {
            const step = Number(details?.seekOffset) || MOD39_CONSTANTS.LIMITS.SEEK_STEP_SECONDS;
            this.playerCtrl.seekRelative(step);
          },
          seekto: (details) => {
            if (typeof details?.seekTime === 'number') {
              this.playerCtrl.seekToSeconds(details.seekTime, true);
            }
          },
          stop: () => this.playerCtrl.pause()
        });
      }
      NS.nativePlayer?.registerExtraMediaSessionHandlers?.({
        previoustrack: () => this.playerCtrl.seekRelative(-MOD39_CONSTANTS.LIMITS.SEEK_STEP_SECONDS),
        nexttrack: () => this.playerCtrl.seekRelative(MOD39_CONSTANTS.LIMITS.SEEK_STEP_SECONDS)
      });
    }

    async resolveDirectStream(videoId, forceRefresh = false, extraOpts = {}) {
      const vid = String(videoId || '').trim();
      if (!vid || !NS.streamFetcher) return null;
      const excludeHosts = Array.isArray(extraOpts?.excludeHosts) ? extraOpts.excludeHosts : [];

      if (
        !forceRefresh &&
        !excludeHosts.length &&
        this.resolvedVideoId === vid &&
        this.resolvedStreamInfo &&
        !this.resolvedStreamInfo.fallback
      ) {
        return this.resolvedStreamInfo;
      }

      this.mode = 'resolving';
      this.streamFallbackReason = '';
      this.statusText = '⏳ Đang dò Luồng phát công cộng (phát nền MP3 & PiP)...';
      this.syncStatusUi();

      const res = await NS.streamFetcher.fetchStreams(vid, {
        forceRefresh: Boolean(forceRefresh || excludeHosts.length),
        excludeHosts,
        timeoutMs: Math.max(1200, Number(extraOpts?.timeoutMs) || 8500)
      });
      if (this.playerCtrl?.activeVideo?.videoId && String(this.playerCtrl.activeVideo.videoId) !== vid) {
        return null;
      }

      if (res && res.ok && !res.fallback && (res.videoStreamUrl || res.audioStreamUrl)) {
        this.resolvedVideoId = vid;
        this.resolvedStreamUrl = res.audioStreamUrl || res.videoStreamUrl;
        this.resolvedStreamInfo = res;
        this.streamFallbackReason = '';
        if (res.isLive) {
          this.playerCtrl?._applyLiveStreamLoopLock?.(vid, true, {
            source: 'stream-fetcher-meta',
            announce: true
          });
        }
        this.statusText = '';
        if (!NS.nativePlayer?.isActive?.()) {
          this.mode = 'ready';
        }
        this.syncStatusUi();
        return res;
      }

      this.resolvedVideoId = '';
      this.resolvedStreamUrl = '';
      this.resolvedStreamInfo = null;
      if (!this._bgReconnectState?.active) {
        this.mode = 'iframe-fallback';
        this.streamFallbackReason = this.formatFriendlyStreamFallbackReason(res?.errorReason);
        this.statusText = `📺 ${this.streamFallbackReason}`;
        this.syncStatusUi();
      }
      return res;
    }

    formatFriendlyStreamFallbackReason(rawReason = '') {
      const r = String(rawReason || '').trim();
      if (!r || /LOGIN_REQUIRED|chặn bot|Piped|Invidious|youtube-nocookie/i.test(r)) {
        return 'Luồng phát công cộng tạm bị YouTube giới hạn — Đã chuyển dự phòng về Luồng phát YouTube (tự động tắt MP3 cũ ở Tab 3 để chờ đồng bộ).';
      }
      if (/Timeout/i.test(r)) {
        return 'Luồng phát công cộng phản hồi chậm — Đã chuyển dự phòng về Luồng phát YouTube (tự động tắt MP3 cũ ở Tab 3 để chờ đồng bộ).';
      }
      return 'Luồng phát công cộng tạm bận — Đã chuyển dự phòng về Luồng phát YouTube (tự động tắt MP3 cũ ở Tab 3 để chờ đồng bộ).';
    }

    emitTab3StreamSignal(action, extra = {}) {
      const ctrl = this.playerCtrl;
      const vid = String(extra.videoId ?? ctrl?.activeVideo?.videoId ?? '').trim();
      const engine = String(extra.engine ?? ctrl?.activeEngine ?? '').trim();
      const sessionId = Number(extra.sessionId ?? ctrl?._engineSessionId) || 0;
      const streamTypeLabel =
        engine === 'MOD21_AUDIO' || engine === 'HTML5'
          ? 'Luồng phát công cộng'
          : engine === 'IFRAME'
            ? 'Luồng phát YouTube'
            : engine === 'RESOLVING_STREAM'
              ? 'Đang dò Luồng phát công cộng'
              : 'Đã dừng';
      const payload = {
        action: String(action || '').trim(),
        engine,
        videoId: vid,
        sessionId,
        streamTypeLabel,
        ...extra
      };
      try {
        if (typeof NS.onTab5StreamSignal === 'function') {
          NS.onTab5StreamSignal(payload);
        } else if (typeof NS.audioStudio?.onTab5StreamSignal === 'function') {
          NS.audioStudio.onTab5StreamSignal(payload);
        }
      } catch (_eSig) {}
      try {
        if (typeof global.dispatchEvent === 'function' && typeof global.CustomEvent === 'function') {
          global.dispatchEvent(new global.CustomEvent('mod39:stream-signal', { detail: payload }));
        }
      } catch (_eEv) {}
      return payload;
    }

    async resolveAudioStreamUrl(videoId) {
      const res = await this.resolveDirectStream(videoId, false);
      return res?.ok ? res.audioStreamUrl || res.videoStreamUrl || '' : '';
    }

    stopAutoReconnectLoop(options = {}) {
      const prev = this._bgReconnectState;
      if (prev?.timerId) {
        try {
          clearTimeout(prev.timerId);
        } catch (_eT) {}
      }
      this._bgReconnectState = null;
      if (!options.silent) {
        this.syncStatusUi();
      }
    }

    _getAutoReconnectDelayMs(attempts = 0) {
      const override = Number(this._autoReconnectDelayOverrideMs);
      if (Number.isFinite(override) && override >= 10) {
        return Math.floor(override);
      }
      return Math.min(9000, 2200 + Math.max(0, Number(attempts) || 0) * 1400);
    }

    startBgBotBlockAutoReconnect(video = null, triggerReason = 'manual-bg-toggle', options = {}) {
      const targetVid = video || this.playerCtrl?.activeVideo;
      if (!targetVid?.videoId || targetVid.isLive) return false;
      const vidStr = String(targetVid.videoId).trim();
      const sessionId = this.playerCtrl?._engineSessionId || 0;
      const curSt = this._bgReconnectState;
      if (curSt && curSt.active && curSt.videoId === vidStr && curSt.sessionId === sessionId) {
        curSt.reason = triggerReason || curSt.reason;
        curSt.attachVisualVideo = Boolean(options.attachVisualVideo);
        this.syncStatusUi();
        return true;
      }

      this.stopAutoReconnectLoop({ silent: true });
      const overrideMs = Number(options.retryDelayMs);
      const initDelayMs =
        Number.isFinite(overrideMs) && overrideMs >= 10 ? Math.floor(overrideMs) : this._getAutoReconnectDelayMs(0);

      this._bgReconnectState = {
        active: true,
        videoId: vidStr,
        sessionId,
        reason: String(triggerReason || 'manual-bg-toggle'),
        attachVisualVideo: Boolean(options.attachVisualVideo),
        attempts: 0,
        inFlight: false,
        lastAttemptAtMs: Date.now(),
        nextDueAtMs: Date.now() + initDelayMs,
        customRetryMs: Number.isFinite(overrideMs) && overrideMs >= 10 ? Math.floor(overrideMs) : null,
        timerId: null
      };
      this.statusText =
        this._bgReconnectState.reason === 'auto-public-stream-retry'
          ? '🔄 Luồng phát công cộng tạm bị YouTube giới hạn — Đang tạm phát qua Luồng phát YouTube và tự động dò lại liên tục đến khi kết nối được!'
          : '🔄 Luồng phát công cộng đang bị YouTube giới hạn — Đang tự động kết nối lại liên tục đến khi phát nền được!';
      this.syncStatusUi();
      this._scheduleNextAutoReconnectAttempt(initDelayMs);
      return true;
    }

    _scheduleNextAutoReconnectAttempt(explicitDelayMs = null) {
      const st = this._bgReconnectState;
      if (!st || !st.active) return false;
      const activeVid = String(this.playerCtrl?.activeVideo?.videoId || '').trim();
      const activeSession = this.playerCtrl?._engineSessionId || 0;
      if (!activeVid || activeVid !== st.videoId || activeSession !== st.sessionId) {
        this.stopAutoReconnectLoop({ silent: true });
        return false;
      }
      if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO' || this.playerCtrl?.activeEngine === 'HTML5') {
        this.stopAutoReconnectLoop({ silent: true });
        return false;
      }
      if (
        st.reason === 'visibility-bg' &&
        typeof document !== 'undefined' &&
        !document.hidden &&
        !this.playerCtrl?.prefs?.audioOnlyMode &&
        !this._userPreSelectedBgMode
      ) {
        this.stopAutoReconnectLoop({ silent: true });
        return false;
      }

      if (st.timerId) {
        try {
          clearTimeout(st.timerId);
        } catch (_eC) {}
        st.timerId = null;
      }
      const delayMs =
        explicitDelayMs !== null
          ? Math.max(10, Number(explicitDelayMs) || 2200)
          : st.customRetryMs || this._getAutoReconnectDelayMs(st.attempts);
      st.nextDueAtMs = Date.now() + delayMs;
      st.timerId = setTimeout(() => {
        if (this._bgReconnectState === st) {
          st.timerId = null;
          this._runAutoReconnectAttempt();
        }
      }, delayMs);
      return true;
    }

    nudgeAutoReconnectIfDue(forceImmediate = false) {
      const st = this._bgReconnectState;
      if (!st || !st.active || st.inFlight) return false;
      if (forceImmediate || Date.now() >= (Number(st.nextDueAtMs) || 0)) {
        return this._runAutoReconnectAttempt();
      }
      return false;
    }

    async _runAutoReconnectAttempt() {
      const st = this._bgReconnectState;
      if (!st || !st.active || st.inFlight) return false;
      const video = this.playerCtrl?.activeVideo;
      const activeVid = String(video?.videoId || '').trim();
      const activeSession = this.playerCtrl?._engineSessionId || 0;
      if (!video || !activeVid || activeVid !== st.videoId || activeSession !== st.sessionId) {
        this.stopAutoReconnectLoop({ silent: true });
        return false;
      }
      if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO' || this.playerCtrl?.activeEngine === 'HTML5') {
        this.stopAutoReconnectLoop({ silent: true });
        return true;
      }
      if (typeof global.navigator !== 'undefined' && global.navigator.onLine === false) {
        this._scheduleNextAutoReconnectAttempt();
        return false;
      }

      st.attempts += 1;
      st.inFlight = true;
      st.lastAttemptAtMs = Date.now();
      const retryingMsg =
        st.reason === 'auto-public-stream-retry'
          ? '🔄 Luồng phát công cộng tạm bị YouTube giới hạn — Đang tạm phát qua Luồng phát YouTube và tự động dò lại liên tục đến khi kết nối được!'
          : '🔄 Luồng phát công cộng đang bị YouTube giới hạn — Đang tự động kết nối lại liên tục đến khi phát nền được!';
      this.statusText = retryingMsg;
      this.syncStatusUi();

      try {
        const fresh = await this.resolveDirectStream(st.videoId, true, { timeoutMs: 8500 }).catch(() => null);
        if (
          !this._bgReconnectState ||
          this._bgReconnectState !== st ||
          String(this.playerCtrl?.activeVideo?.videoId || '').trim() !== st.videoId ||
          (this.playerCtrl?._engineSessionId || 0) !== st.sessionId
        ) {
          return false;
        }
        if (fresh && fresh.ok && !fresh.fallback && (fresh.audioStreamUrl || fresh.videoStreamUrl)) {
          const curSec = this.getAccurateForegroundTimestampSec(video.startSeconds || 0);
          const shouldPlay =
            st.reason === 'visibility-bg'
              ? Boolean(this._iframeWasPlayingBeforeHidden) || !this.playerCtrl?._userDesiredPaused
              : !this.playerCtrl?._userDesiredPaused;
          const wantsAudioOnly = Boolean(
            st.reason === 'manual-bg-toggle' ||
            st.reason === 'audio-only' ||
            this.playerCtrl?.prefs?.audioOnlyMode
          );
          if (wantsAudioOnly && this.playerCtrl?.prefs) {
            this.playerCtrl.prefs.audioOnlyMode = true;
            this._userPreSelectedBgMode = true;
            this.playerCtrl.vault?.savePlayerPrefs?.(this.playerCtrl.prefs);
          }

          if (this.playerCtrl) {
            this.playerCtrl._lockedIframeSessionId = 0;
          }
          const bridged = await this.activateMod21AudioBridge(video, fresh, {
            sessionId: st.sessionId,
            startTimeSec: curSec,
            autoplay: shouldPlay,
            manualUserAction: true,
            attachVisualVideo: Boolean(st.attachVisualVideo && !wantsAudioOnly)
          }).catch(() => false);

          if (bridged && this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
            const totalTries = st.attempts;
            this.stopAutoReconnectLoop({ silent: true });
            this.syncStatusUi();
            this.playerCtrl.emitUiSync?.();
            const okBaseMsg = '✅ Đã tự động kết nối lại Luồng phát công cộng thành công — đang phát nền qua Mục 3!';
            const okMsgText = NS.i18n?.translateText
              ? `${NS.i18n.translateText(okBaseMsg)} (#${totalTries})`
              : `${okBaseMsg} (#${totalTries})`;
            safeNotify(okMsgText, 'success', 2800);
            return true;
          }
          if (st.reason === 'auto-public-stream-retry' && !wantsAudioOnly) {
            const directHtml5Ok = await this.upgradeActiveVideoToNativePlayer(video, {
              cachedStream: fresh,
              autoplay: shouldPlay,
              startTimeOverrideSec: curSec,
              manualUserAction: true,
              sessionId: st.sessionId
            }).catch(() => false);
            if (directHtml5Ok && this.playerCtrl?.activeEngine === 'HTML5') {
              const totalTries = st.attempts;
              this.stopAutoReconnectLoop({ silent: true });
              this.syncStatusUi();
              this.playerCtrl.emitUiSync?.();
              const okBaseMsg = '✅ Đã tự động kết nối lại Luồng phát công cộng thành công — đang phát trực tiếp!';
              const okMsgText = NS.i18n?.translateText
                ? `${NS.i18n.translateText(okBaseMsg)} (#${totalTries})`
                : `${okBaseMsg} (#${totalTries})`;
              safeNotify(okMsgText, 'success', 2800);
              return true;
            }
          }
          if (st.reason === 'visibility-bg') {
            const bgOk = await this.activateNativeAudioPlayback('background', { startTimeSec: curSec }).catch(() => false);
            if (bgOk) {
              this.stopAutoReconnectLoop({ silent: true });
              this.syncStatusUi();
              this.playerCtrl.emitUiSync?.();
              return true;
            }
          }
        }
      } finally {
        if (this._bgReconnectState === st) {
          st.inFlight = false;
        }
      }

      if (this._bgReconnectState === st && st.active) {
        this.statusText = retryingMsg;
        this.syncStatusUi();
        this._scheduleNextAutoReconnectAttempt();
      }
      return false;
    }

    _restoreForegroundStageFromFallback(resumeSec = null, autoplay = true) {
      if (typeof document === 'undefined') return;
      // Khi chuyển sang Luồng phát YouTube (IFRAME), luôn phát tín hiệu ngắt & dọn sạch Audio Nền Tab 3 + <video> cũ
      this.emitTab3StreamSignal('switch-to-youtube-stream', {
        engine: 'IFRAME',
        videoId: this.playerCtrl?.activeVideo?.videoId || '',
        sessionId: this.playerCtrl?._engineSessionId || 0
      });
      NS.audioStudio?.pauseExternalAudioStream?.(true);
      if (NS.nativePlayer?.isActive?.()) {
        NS.nativePlayer.deactivate(false, { preservePiP: false });
      }
      this._bgAudioTookOver = false;
      const nativeHost = document.getElementById('mod39-native-video-host');
      const resolvingCard = document.getElementById('mod39-resolving-poster-card');
      const audioStage = document.getElementById('mod39-audio-only-stage');
      const iframeEl = document.getElementById(this.playerCtrl.bridge.mainIframeId);
      const emptyCard = document.getElementById('mod39-empty-stage-card');
      nativeHost?.classList.add('hidden');
      resolvingCard?.classList.add('hidden');
      audioStage?.classList.add('hidden');
      const video = this.playerCtrl?.activeVideo;
      if (!video) return;
      emptyCard?.classList.add('hidden');
      iframeEl?.classList.remove('hidden');
      const curSrc = String(iframeEl?.getAttribute('src') || '');
      const targetVid = String(video.videoId || '').trim();
      const targetPl = String(video.playlistId || '').trim();
      const idMatchesCurSrc =
        (targetVid && (curSrc.indexOf('/embed/' + targetVid) !== -1 || curSrc.indexOf('v=' + targetVid) !== -1)) ||
        (!targetVid && targetPl && curSrc.indexOf(targetPl) !== -1) ||
        (!targetVid && !targetPl);
      const hasEmbeddedVideo = Boolean(
        curSrc && curSrc !== 'about:blank' && curSrc.indexOf('youtube') !== -1 && idMatchesCurSrc
      );
      if (!hasEmbeddedVideo) {
        this._iframeMutedVisualCompanion = false;
        this._silencedIframeForBgAudio = false;
        this.playerCtrl.bridge._mountedMutedOverride = null;
        const startAt = Math.max(
          0,
          Math.floor(Number.isFinite(resumeSec) ? Number(resumeSec) : Number(this.playerCtrl.bridge.lastKnownTime) || 0)
        );
        this.playerCtrl.bridge.mountEmbedUrlIntoIframe(
          { ...video, startSeconds: startAt },
          this.playerCtrl.prefs,
          { autoplay: Boolean(autoplay) }
        );
      } else if (
        this._silencedIframeForBgAudio ||
        this._iframeMutedVisualCompanion ||
        this.playerCtrl.bridge._mountedMutedOverride === true
      ) {
        this._silencedIframeForBgAudio = false;
        this._iframeMutedVisualCompanion = false;
        this.playerCtrl.bridge._mountedMutedOverride = null;
        const targetSec = Number.isFinite(resumeSec) ? Math.max(0, Number(resumeSec)) : null;
        if (targetSec !== null && targetSec > 0) {
          this.playerCtrl.bridge.dispatchPlayerCommand('seekTo', [targetSec, true]);
        }
        if (this.playerCtrl.prefs?.muted) {
          this.playerCtrl.bridge.dispatchPlayerCommand('mute', []);
        } else {
          this.playerCtrl.bridge.dispatchPlayerCommand('unMute', []);
          const vol = Math.max(0, Math.min(100, Number(this.playerCtrl.prefs?.volume ?? 85)));
          this.playerCtrl.bridge.dispatchPlayerCommand('setVolume', [vol]);
        }
        if (autoplay) {
          this.playerCtrl.bridge.dispatchPlayerCommand('playVideo', []);
        } else {
          this.playerCtrl.bridge.dispatchPlayerCommand('pauseVideo', []);
        }
      }
    }

    _ensureMutedIframeVisualCompanion(resumeSec = null, autoplay = true) {
      if (typeof document === 'undefined') return false;
      const video = this.playerCtrl?.activeVideo;
      if (!video || this.playerCtrl?.prefs?.audioOnlyMode) return false;
      if (
        NS.nativePlayer?.isActive?.() &&
        NS.nativePlayer.visualMutedCompanion &&
        NS.nativePlayer.mode === 'video'
      ) {
        return false;
      }
      const bridge = this.playerCtrl.bridge;
      const iframeEl = document.getElementById(bridge.mainIframeId);
      document.getElementById('mod39-empty-stage-card')?.classList.add('hidden');
      document.getElementById('mod39-resolving-poster-card')?.classList.add('hidden');
      document.getElementById('mod39-native-video-host')?.classList.add('hidden');
      iframeEl?.classList.remove('hidden');

      const curSrc = String(iframeEl?.getAttribute('src') || '');
      const hasSameVideo = Boolean(
        curSrc &&
        curSrc !== 'about:blank' &&
        (!video.videoId || curSrc.indexOf(video.videoId) !== -1)
      );
      const startAt = Math.max(
        0,
        Math.floor(Number.isFinite(resumeSec) ? Number(resumeSec) : Number(bridge.lastKnownTime) || 0)
      );
      this._iframeMutedVisualCompanion = true;
      if (!hasSameVideo) {
        const prevState = bridge.lastKnownState;
        const prevDur = bridge.lastKnownDuration;
        bridge.mountEmbedUrlIntoIframe(
          { ...video, startSeconds: startAt },
          this.playerCtrl.prefs,
          { autoplay: Boolean(autoplay), muted: true }
        );
        if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
          bridge.lastKnownTime = startAt;
          if (prevDur > 0) bridge.lastKnownDuration = prevDur;
          bridge.lastKnownState = prevState;
        }
      } else {
        bridge.dispatchPlayerCommand('mute', []);
        if (startAt > 0 && Math.abs((Number(bridge._lastVisualIframeTimeSec) || 0) - startAt) > 1.5) {
          bridge.dispatchPlayerCommand('seekTo', [startAt, true]);
        }
        bridge.dispatchPlayerCommand(autoplay ? 'playVideo' : 'pauseVideo', []);
      }
      return true;
    }

    syncAudioBridgeStageCard() {
      if (typeof document === 'undefined') return;
      const resolvingCard = document.getElementById('mod39-resolving-poster-card');
      const audioStage = document.getElementById('mod39-audio-only-stage');
      const emptyCard = document.getElementById('mod39-empty-stage-card');
      const nativeHost = document.getElementById('mod39-native-video-host');
      const iframeEl = document.getElementById(this.playerCtrl.bridge.mainIframeId);
      const video = this.playerCtrl?.activeVideo;
      const engine = this.playerCtrl?.activeEngine || 'IFRAME';

      if (!video) {
        resolvingCard?.classList.add('hidden');
        audioStage?.classList.add('hidden');
        nativeHost?.classList.add('hidden');
        emptyCard?.classList.remove('hidden');
        return;
      }

      emptyCard?.classList.add('hidden');
      const nativeVideoVisible = Boolean(
        NS.nativePlayer?.isActive?.() &&
        NS.nativePlayer.mode === 'video' &&
        !NS.nativePlayer._provisionalStageTakeover
      );
      if (nativeVideoVisible) {
        resolvingCard?.classList.add('hidden');
        audioStage?.classList.add('hidden');
        nativeHost?.classList.remove('hidden');
        iframeEl?.classList.add('hidden');
        return;
      }

      if (engine === 'RESOLVING_STREAM') {
        audioStage?.classList.add('hidden');
        nativeHost?.classList.add('hidden');
        const curIfrSrc = String(iframeEl?.getAttribute('src') || '');
        const hasProvisionalYoutubeIframe = Boolean(
          !this.playerCtrl?.prefs?.audioOnlyMode &&
          curIfrSrc &&
          curIfrSrc !== 'about:blank' &&
          curIfrSrc.indexOf('youtube') !== -1 &&
          (!video.videoId || curIfrSrc.indexOf(video.videoId) !== -1)
        );
        if (hasProvisionalYoutubeIframe) {
          resolvingCard?.classList.add('hidden');
          iframeEl?.classList.remove('hidden');
          return;
        }
        iframeEl?.classList.add('hidden');
        if (resolvingCard) {
          const thumbImg = document.getElementById('mod39-resolving-poster-thumb');
          const thumbUrl =
            video.thumbnailUrl ||
            (video.videoId ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : '');
          if (thumbImg) {
            if (thumbUrl) {
              if (thumbImg.getAttribute('src') !== thumbUrl) thumbImg.setAttribute('src', thumbUrl);
              thumbImg.classList.remove('hidden');
            } else {
              thumbImg.removeAttribute('src');
              thumbImg.classList.add('hidden');
            }
          }
          resolvingCard.classList.remove('hidden');
        }
        return;
      }

      resolvingCard?.classList.add('hidden');

      if (engine === 'MOD21_AUDIO') {
        const ifrSrc = String(iframeEl?.getAttribute('src') || '');
        const hasExplicitIframe = Boolean(
          this._explicitIframeVisualForSession &&
          ifrSrc &&
          ifrSrc !== 'about:blank' &&
          ifrSrc.indexOf('youtube') !== -1
        );
        if (hasExplicitIframe) {
          audioStage?.classList.add('hidden');
          nativeHost?.classList.add('hidden');
          iframeEl?.classList.remove('hidden');
          return;
        }
        nativeHost?.classList.add('hidden');
        iframeEl?.classList.add('hidden');
        if (audioStage) {
          const thumbImg = document.getElementById('mod39-audio-stage-thumb');
          const thumbUrl =
            video.thumbnailUrl ||
            (video.videoId ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : '');
          if (thumbImg) {
            if (thumbUrl) {
              if (thumbImg.getAttribute('src') !== thumbUrl) thumbImg.setAttribute('src', thumbUrl);
              thumbImg.classList.remove('hidden');
            } else {
              thumbImg.removeAttribute('src');
              thumbImg.classList.add('hidden');
            }
          }
          const hintEl = document.getElementById('mod39-audio-stage-hint');
          if (hintEl) {
            const trFn = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
            const st = this.playerCtrl?.bridge?.lastKnownState;
            const isPausedNow =
              st === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED ||
              st === MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED ||
              Boolean(this.playerCtrl?._userDesiredPaused);
            const nextHint = isPausedNow
              ? trFn('⏸ Đã tạm dừng — Chạm vào khung để Phát tiếp')
              : trFn('▶️ Chạm vào khung để Tạm dừng (Tắt màn hình vẫn nghe nền Mục 3)');
            if (hintEl.textContent !== nextHint) hintEl.textContent = nextHint;
          }
          audioStage.classList.remove('hidden');
        }
        return;
      }

      audioStage?.classList.add('hidden');
      if (!NS.nativePlayer?.isActive?.()) {
        nativeHost?.classList.add('hidden');
        iframeEl?.classList.remove('hidden');
      }
    }

    _syncVisualCompanionWithMod21(action = 'tick', info = {}) {
      const player = NS.nativePlayer;
      const el = player?.videoEl;
      if (!player || !player.isActive() || !player.visualMutedCompanion || !el) {
        if (
          this.playerCtrl?.activeEngine === 'MOD21_AUDIO' &&
          !this.playerCtrl?.prefs?.audioOnlyMode &&
          this.playerCtrl?.activeVideo
        ) {
          const bridge = this.playerCtrl.bridge;
          const isHiddenNow = typeof document !== 'undefined' && Boolean(document.hidden);
          const ifr = typeof document !== 'undefined' ? document.getElementById(bridge.mainIframeId) : null;
          const ifrSrc = String(ifr?.getAttribute('src') || '');
          if (!ifrSrc || ifrSrc === 'about:blank') return;

          if (action === 'pause') {
            if (!this._lastSentIframeMuted) {
              this._lastSentIframeMuted = true;
              bridge.dispatchPlayerCommand('mute', []);
            }
            bridge.dispatchPlayerCommand('pauseVideo', []);
            return;
          }
          if (action === 'rate') {
            const cleanRate = Number(info.playbackRate) || Number(this.playerCtrl?.prefs?.speed) || 1;
            this._lastSentIframeRate = cleanRate;
            bridge.dispatchPlayerCommand('setPlaybackRate', [cleanRate]);
            return;
          }
          if (action === 'seek') {
            const targetSec = Math.max(0, Number(info.currentTime) || 0);
            this._iframeLastSeekSyncMs = Date.now();
            if (!this._lastSentIframeMuted) {
              this._lastSentIframeMuted = true;
              bridge.dispatchPlayerCommand('mute', []);
            }
            bridge.dispatchPlayerCommand('seekTo', [targetSec, true]);
            return;
          }
          if (isHiddenNow) {
            if (bridge._lastVisualIframeState === 1 || bridge._lastVisualIframeState === 3) {
              bridge.dispatchPlayerCommand('pauseVideo', []);
            }
            return;
          }
          if (!this._lastSentIframeMuted) {
            this._lastSentIframeMuted = true;
            bridge.dispatchPlayerCommand('mute', []);
          }
          const cleanRate = Number(info.playbackRate) || Number(this.playerCtrl?.prefs?.speed) || 1;
          if (this._lastSentIframeRate !== cleanRate) {
            this._lastSentIframeRate = cleanRate;
            bridge.dispatchPlayerCommand('setPlaybackRate', [cleanRate]);
          }
          if (action === 'play') {
            const targetSec = Number(info.currentTime);
            if (Number.isFinite(targetSec) && targetSec >= 0) {
              const lastVTime = Number(bridge._lastVisualIframeTimeSec);
              if (!Number.isFinite(lastVTime) || Math.abs(lastVTime - targetSec) > 1.5) {
                this._iframeLastSeekSyncMs = Date.now();
                bridge.dispatchPlayerCommand('seekTo', [targetSec, true]);
              }
            }
            bridge.dispatchPlayerCommand('playVideo', []);
            return;
          }
          const shouldPlay = !info.paused;
          if (shouldPlay && bridge._lastVisualIframeState !== 1 && bridge._lastVisualIframeState !== 3) {
            const nowMs = Date.now();
            if (!this._iframeLastPlaySyncMs || nowMs - this._iframeLastPlaySyncMs > 1800) {
              this._iframeLastPlaySyncMs = nowMs;
              bridge.dispatchPlayerCommand('playVideo', []);
            }
          } else if (!shouldPlay && bridge._lastVisualIframeState === 1) {
            bridge.dispatchPlayerCommand('pauseVideo', []);
          }
          const targetCur = Number(info.currentTime);
          const vTime = Number(bridge._lastVisualIframeTimeSec);
          if (
            Number.isFinite(targetCur) &&
            targetCur >= 0 &&
            Number.isFinite(vTime) &&
            Math.abs(vTime - targetCur) > 2.8 &&
            (!this._iframeLastSeekSyncMs || Date.now() - this._iframeLastSeekSyncMs >= 4000)
          ) {
            this._iframeLastSeekSyncMs = Date.now();
            bridge.dispatchPlayerCommand('seekTo', [targetCur, true]);
          }
        }
        return;
      }
      const isHiddenNow = typeof document !== 'undefined' && Boolean(document.hidden);
      const inPip = Boolean(player.isInSystemPiP);
      this._syncingVisualFromMod21 = true;
      try {
        el.muted = true;
        el.defaultMuted = true;
        el.volume = 0;

        if (action === 'pause') {
          if (!el.paused) {
            try { el.pause(); } catch (_eP) {}
          }
          player.playbackStateCode = MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED;
          return;
        }
        if (action === 'rate') {
          const cleanRate = Number(info.playbackRate) || Number(this.playerCtrl?.prefs?.speed) || 1;
          if (Math.abs((el.playbackRate || 1) - cleanRate) > 0.01) {
            el.playbackRate = cleanRate;
          }
          return;
        }
        if (action === 'seek') {
          const targetSec = Math.max(0, Number(info.currentTime) || 0);
          player.lastKnownTime = targetSec;
          this._lastVisualHardSeekMs = Date.now();
          const baseRate = Number(info.playbackRate) || Number(this.playerCtrl?.prefs?.speed) || 1;
          if (Math.abs((el.playbackRate || 1) - baseRate) > 0.01) {
            el.playbackRate = baseRate;
          }
          if (el.readyState >= 1) {
            try { el.currentTime = targetSec; } catch (_eS) {}
          } else {
            player.pendingSeekTime = targetSec;
          }
          return;
        }

        const audioRate = Number(info.playbackRate) || Number(this.playerCtrl?.prefs?.speed) || 1;

        if (action === 'play') {
          const targetPlayTime = Number.isFinite(info.currentTime) ? Math.max(0, Number(info.currentTime)) : 0;
          if (Math.abs((el.playbackRate || 1) - audioRate) > 0.01) {
            el.playbackRate = audioRate;
          }
          if (el.readyState >= 1 && (el.ended || Math.abs((el.currentTime || 0) - targetPlayTime) > 0.45)) {
            this._lastVisualHardSeekMs = Date.now();
            try { el.currentTime = targetPlayTime; } catch (_eS2) {}
          }
          if ((!isHiddenNow || inPip) && (el.paused || el.ended)) {
            el.play().catch(() => {});
          }
          player.playbackStateCode = MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
          return;
        }

        // Smooth A/V drift-lock between Tab 3 <audio> and Tab 5 muted <video> (zero keyframe-seek stutter on long videos)
        if (isHiddenNow && !inPip) {
          if (!el.paused) {
            try { el.pause(); } catch (_eH) {}
          }
          return;
        }
        const shouldPlay = !info.paused;
        if (shouldPlay && el.paused && !el.ended && el.readyState >= 2) {
          el.play().catch(() => {});
        } else if (!shouldPlay && !el.paused) {
          try { el.pause(); } catch (_eP2) {}
        }
        const targetCur = Number(info.currentTime);
        if (Number.isFinite(targetCur) && targetCur >= 0 && el.readyState >= 2 && !el.seeking) {
          const nowMs = Date.now();
          const drift = targetCur - (el.currentTime || 0);
          const absDrift = Math.abs(drift);
          const sinceHardSeek = nowMs - (this._lastVisualHardSeekMs || 0);
          if (absDrift > 2.4 && sinceHardSeek >= 1800) {
            // Chỉ tua cứng lại khi lệch rất xa (>2.4s) và đã qua thời gian giải mã keyframe
            this._lastVisualHardSeekMs = nowMs;
            if (Math.abs((el.playbackRate || 1) - audioRate) > 0.01) {
              el.playbackRate = audioRate;
            }
            try { el.currentTime = targetCur; } catch (_eD) {}
          } else if (shouldPlay && absDrift > 0.16 && absDrift <= 2.4 && sinceHardSeek >= 600) {
            // Bắt kịp mượt mà bằng vi chỉnh tốc độ khung hình (không ngắt pipeline giải mã video dài)
            const nudgeFactor = drift > 0 ? Math.min(1.18, 1 + absDrift * 0.12) : Math.max(0.86, 1 - absDrift * 0.10);
            const desiredRate = Math.max(0.5, Math.min(2.25, Number((audioRate * nudgeFactor).toFixed(3))));
            if (Math.abs((el.playbackRate || 1) - desiredRate) > 0.015) {
              el.playbackRate = desiredRate;
            }
          } else if (Math.abs((el.playbackRate || 1) - audioRate) > 0.01) {
            el.playbackRate = audioRate;
          }
        }
      } finally {
        this._syncingVisualFromMod21 = false;
      }
    }

    async _attachPairedVisualVideoToMod21(record, streamInfo, options = {}) {
      const player = NS.nativePlayer;
      if (!player || !record?.videoId || !streamInfo || record.isLive || this.playerCtrl?.prefs?.audioOnlyMode) {
        return false;
      }
      if (this.playerCtrl?.activeEngine !== 'MOD21_AUDIO') return false;
      const reqSessionId = options.sessionId || this.playerCtrl._engineSessionId || 0;
      if (reqSessionId && this.playerCtrl._engineSessionId && reqSessionId !== this.playerCtrl._engineSessionId) {
        return false;
      }
      const hasVideoTarget = Boolean(
        streamInfo.videoStreamUrl || streamInfo.muxedVideoUrl || streamInfo.adaptiveVideoUrl || streamInfo.hlsUrl
      );
      if (!hasVideoTarget) return false;

      const extNow = NS.audioStudio?.getExternalAudioState?.();
      const targetStartSec = extNow?.active
        ? Math.max(0, Number(extNow.currentTime) || 0)
        : Math.max(0, Number(options.startTimeSec ?? record.startSeconds) || 0);
      const shouldPlay = extNow?.active ? !extNow.paused : options.autoplay !== false;

      if (
        player.isActive() &&
        player.visualMutedCompanion &&
        String(player.currentStreamInfo?.videoId || '') === String(record.videoId)
      ) {
        this._silenceForegroundIframeForNativeTakeover();
        player.setModeLayout('video');
        if (typeof document !== 'undefined') {
          document.getElementById('mod39-native-video-host')?.classList.remove('hidden');
          document.getElementById('mod39-resolving-poster-card')?.classList.add('hidden');
        }
        this._syncVisualCompanionWithMod21(shouldPlay ? 'play' : 'pause', {
          currentTime: targetStartSec,
          paused: !shouldPlay,
          playbackRate: Number(this.playerCtrl?.prefs?.speed) || 1
        });
        this.syncAudioBridgeStageCard();
        this.syncStatusUi();
        return true;
      }

      this.ensureNativeAudioElement();
      const stageHost =
        typeof document !== 'undefined' ? document.getElementById('mod39-native-video-host') : null;
      const loaded = await player.loadStream(
        {
          ...streamInfo,
          title: record.title || streamInfo.title,
          thumbnailUrl:
            record.thumbnailUrl ||
            streamInfo.thumbnailUrl ||
            `https://i.ytimg.com/vi/${record.videoId}/hqdefault.jpg`
        },
        {
          audioOnly: false,
          startTimeSec: targetStartSec,
          autoplay: shouldPlay && (typeof document === 'undefined' || !document.hidden),
          userIntentPaused: !shouldPlay,
          deferStageTakeover: false,
          visualMutedCompanion: true,
          stageHostEl: stageHost,
          prefs: { ...(this.playerCtrl.prefs || {}), muted: true }
        }
      );
      if (
        !loaded ||
        this.playerCtrl?.activeEngine !== 'MOD21_AUDIO' ||
        String(this.playerCtrl?.activeVideo?.videoId || '') !== String(record.videoId) ||
        (reqSessionId && this.playerCtrl._engineSessionId && reqSessionId !== this.playerCtrl._engineSessionId)
      ) {
        if (player.isActive() && this.playerCtrl?.activeEngine !== 'MOD21_AUDIO') {
          player.deactivate(false);
        } else if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
          this.syncAudioBridgeStageCard();
        }
        return false;
      }

      // Chỉ ẩn iframe sau khi luồng <video> Hình đã nạp thành công 100% -> 0ms màn hình đen!
      this._silenceForegroundIframeForNativeTakeover();
      const freshExt = NS.audioStudio?.getExternalAudioState?.();
      if (freshExt?.active) {
        this._syncVisualCompanionWithMod21(freshExt.paused ? 'pause' : 'play', {
          currentTime: freshExt.currentTime,
          paused: freshExt.paused,
          playbackRate: freshExt.playbackRate
        });
      }
      this.syncAudioBridgeStageCard();
      this.syncStatusUi();
      this.playerCtrl.emitUiSync?.();
      return true;
    }

    async activateMod21AudioBridge(record, streamInfo, options = {}) {
      const mp3BridgeFn = NS.playExternalStreamInMp3Engine || NS.loadExternalAudioStream;
      if (!record?.videoId || !streamInfo || typeof mp3BridgeFn !== 'function') {
        return false;
      }
      const reqSessionId = options.sessionId || this.playerCtrl._engineSessionId || 0;
      if (reqSessionId && this.playerCtrl._engineSessionId && reqSessionId !== this.playerCtrl._engineSessionId) {
        return false;
      }
      if (
        !options.manualUserAction &&
        this.playerCtrl._lockedIframeSessionId &&
        this.playerCtrl._lockedIframeSessionId === (this.playerCtrl._engineSessionId || 0)
      ) {
        return false;
      }

      const failedSet = NS.nativePlayer?._failedMediaUrls;
      const rawCandidates = [
        streamInfo.audioStreamUrl,
        ...(Array.isArray(streamInfo.alternateAudioUrls) ? streamInfo.alternateAudioUrls : []),
        streamInfo.muxedVideoUrl,
        !streamInfo.requiresPairedAudio ? streamInfo.videoStreamUrl : ''
      ];
      const candidates = [];
      for (let i = 0; i < rawCandidates.length; i++) {
        const u = String(rawCandidates[i] || '').trim();
        if (u && candidates.indexOf(u) === -1 && (!failedSet || !failedSet.has(u))) {
          candidates.push(u);
        }
      }
      if (!candidates.length) return false;

      if (NS.nativePlayer?.isActive?.()) {
        NS.nativePlayer.deactivate(false);
      }

      const prefs = this.playerCtrl.prefs || {};
      const startSec = Math.max(0, Number(options.startTimeSec ?? record.startSeconds) || 0);
      const effectiveAutoplay =
        options.manualUserAction === true
          ? options.autoplay !== false
          : options.autoplay !== false && !this.playerCtrl?._userDesiredPaused;
      const thumbUrl =
        record.thumbnailUrl ||
        streamInfo.thumbnailUrl ||
        `https://i.ytimg.com/vi/${record.videoId}/hqdefault.jpg`;

      this.resolvedVideoId = String(record.videoId);
      this.resolvedStreamUrl = candidates[0];
      this.resolvedStreamInfo = streamInfo;
      this.streamFallbackReason = '';

      const isSameSessionAndVideo = () =>
        this.playerCtrl?.activeEngine === 'MOD21_AUDIO' &&
        String(this.playerCtrl?.activeVideo?.videoId || '') === String(record.videoId) &&
        (!reqSessionId || reqSessionId === this.playerCtrl._engineSessionId);

      const cleanTargetVid = String(record.videoId).trim();
      this.playerCtrl._activatingMod21VideoId = cleanTargetVid;
      let res = null;
      try {
        res = await mp3BridgeFn({
        url: candidates[0],
        fallbackUrls: candidates.slice(1),
        title: record.title || streamInfo.title || `YouTube (${record.videoId})`,
        artist: 'YouTube Audio Nền • Web Tiểu Thuyết Bi',
        artwork: thumbUrl,
        videoId: record.videoId,
        durationSec: Number(streamInfo.durationSec) || 0,
        isLive: Boolean(record.isLive || streamInfo.isLive),
        startSeconds: startSec,
        autoplay: effectiveAutoplay,
        playbackRate: Number(prefs.speed) || 1,
        volume: Number(prefs.volume ?? 85),
        muted: Boolean(prefs.muted),
        repeatMode: Boolean(prefs.repeatMode),
        abLoopEnabled: Boolean(this.playerCtrl.abLoop?.enabled && this.playerCtrl.isAbPairValid()),
        onTimeUpdate: (info) => {
          if (!isSameSessionAndVideo()) return;
          const dur = Number(info?.duration) || this.playerCtrl.bridge.lastKnownDuration || 0;
          const cur = Number(info?.currentTime) || 0;
          const isEndedNow = Boolean(
            info?.ended ||
            (info?.paused && this.playerCtrl.bridge.lastKnownState === MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED)
          );
          const st = isEndedNow
            ? MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED
            : info?.paused
              ? MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED
              : MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
          this.playerCtrl.bridge.lastKnownTime = cur;
          if (dur > 0) this.playerCtrl.bridge.lastKnownDuration = dur;
          this.playerCtrl.bridge.lastKnownState = st;
          this._syncVisualCompanionWithMod21('tick', {
            currentTime: cur,
            paused: Boolean(info?.paused),
            playbackRate: Number(this.playerCtrl?.prefs?.speed) || 1
          });
          if (!this.playerCtrl.isScrubbing) {
            this.playerCtrl.updateTimelineDomDirectly({
              currentTime: cur,
              duration: dur,
              state: st,
              isLive: Boolean(record.isLive || streamInfo.isLive)
            });
          }
        },
        onStateChange: (ev) => {
          if (!isSameSessionAndVideo()) return;
          const st = Number(ev?.state);
          const cur = Number(ev?.currentTime) || 0;
          const isPlay = st === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
          this.playerCtrl.bridge.lastKnownState = st;
          this.playerCtrl.bridge.lastKnownTime = cur;
          this._syncVisualCompanionWithMod21(isPlay ? 'play' : 'pause', {
            currentTime: cur,
            paused: !isPlay,
            playbackRate: Number(this.playerCtrl?.prefs?.speed) || 1
          });
          this.playerCtrl._notifyMotionBgPlaybackState?.(
            isPlay ? 'playing' : 'paused',
            { stateCode: st, currentTime: cur, forceNotify: true, reason: 'mod21-bridge-state' }
          );
          this.playerCtrl.updateTimelineDomDirectly({
            currentTime: cur,
            duration: this.playerCtrl.bridge.lastKnownDuration,
            state: st,
            isLive: Boolean(record.isLive || streamInfo.isLive)
          });
          this.syncStatusUi();
          this.playerCtrl.emitUiSync?.();
        },
        onSeeked: (ev) => {
          if (!isSameSessionAndVideo()) return;
          const cur = Number(ev?.currentTime) || 0;
          this.playerCtrl.bridge.lastKnownTime = cur;
          this._syncVisualCompanionWithMod21('seek', { currentTime: cur });
          if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.syncWithForegroundSeek === 'function') {
            NS.youtubeMotionBg.syncWithForegroundSeek(cur, true);
          }
          if (!this.playerCtrl.isScrubbing) {
            this.playerCtrl.updateTimelineDomDirectly({
              currentTime: cur,
              duration: this.playerCtrl.bridge.lastKnownDuration,
              state: this.playerCtrl.bridge.lastKnownState,
              isLive: Boolean(record.isLive || streamInfo.isLive)
            });
          }
        },
        onRateChange: (ev) => {
          if (!isSameSessionAndVideo()) return;
          const r = Number(ev?.playbackRate) || 1;
          if (this.playerCtrl.prefs && Math.abs((Number(this.playerCtrl.prefs.speed) || 1) - r) > 0.01) {
            this.playerCtrl.prefs.speed = r;
            this.playerCtrl.vault.savePlayerPrefs(this.playerCtrl.prefs);
            this.playerCtrl.emitUiSync?.();
          }
          this._syncVisualCompanionWithMod21('rate', { playbackRate: r });
          if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.syncWithForegroundRate === 'function') {
            NS.youtubeMotionBg.syncWithForegroundRate(r);
          }
        },
        onEnded: () => {
          if (!isSameSessionAndVideo()) return;
          if (!this.playerCtrl.isVideoLiveStream()) {
            if (this.playerCtrl.abLoop?.enabled && this.playerCtrl.isAbPairValid()) {
              this.playerCtrl.seekToSeconds(this.playerCtrl.abLoop.startSec, true);
              this.playerCtrl.play();
              return;
            }
            if (this.playerCtrl.prefs?.repeatMode) {
              this.playerCtrl.seekToSeconds(0, true);
              this.playerCtrl.play();
              return;
            }
          }
          this._syncVisualCompanionWithMod21('pause', {});
          this.playerCtrl.bridge.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED;
          this.playerCtrl._notifyMotionBgPlaybackState?.('ended', {
            stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED,
            reason: 'mod21-bridge-ended'
          });
          this.playerCtrl.updateTimelineDomDirectly({
            currentTime: this.playerCtrl.bridge.lastKnownDuration || this.playerCtrl.bridge.lastKnownTime,
            duration: this.playerCtrl.bridge.lastKnownDuration,
            state: MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED,
            isLive: Boolean(record.isLive || streamInfo.isLive)
          });
          this.syncStatusUi();
          this.playerCtrl.emitUiSync?.();
        },
        onError: (errInfo) => {
          if (!isSameSessionAndVideo()) return;
          const resumeAt = Math.max(0, Math.floor(Number(errInfo?.currentTime) || 0));
          this.emitTab3StreamSignal('switch-to-youtube-stream', {
            engine: 'IFRAME',
            videoId: record.videoId,
            sessionId: this.playerCtrl._engineSessionId || 0
          });
          NS.audioStudio?.pauseExternalAudioStream?.(true);
          if (NS.nativePlayer?.isActive?.()) NS.nativePlayer.deactivate(false);
          this._bgAudioTookOver = false;
          this.playerCtrl.activeEngine = 'IFRAME';
          this.playerCtrl._lockedIframeSessionId = this.playerCtrl._engineSessionId || 0;
          this.mode = 'iframe-fallback';
          this.statusText = '📺 Luồng phát công cộng tạm gián đoạn — Đã chuyển dự phòng về Luồng phát YouTube (tự động tắt MP3 cũ ở Tab 3 để chờ đồng bộ).';
          this.syncAudioBridgeStageCard();
          this._restoreForegroundStageFromFallback(resumeAt, !this.playerCtrl?._userDesiredPaused);
          this.syncStatusUi();
          this.playerCtrl.emitUiSync?.();
        }
      });

      if (!res || !res.ok) {
        return false;
      }

      if (reqSessionId && this.playerCtrl._engineSessionId && reqSessionId !== this.playerCtrl._engineSessionId) {
        NS.audioStudio?.pauseExternalAudioStream?.(true);
        return false;
      }
      if (String(this.playerCtrl?.activeVideo?.videoId || '') !== String(record.videoId)) {
        NS.audioStudio?.pauseExternalAudioStream?.(true);
        return false;
      }

      this.playerCtrl.activeEngine = 'MOD21_AUDIO';
      this.emitTab3StreamSignal('public-stream-active', {
        engine: 'MOD21_AUDIO',
        videoId: record.videoId,
        sessionId: reqSessionId,
        streamUrl: candidates[0]
      });
      } finally {
        if (this.playerCtrl && this.playerCtrl._activatingMod21VideoId === cleanTargetVid) {
          this.playerCtrl._activatingMod21VideoId = '';
        }
      }
      this.playerCtrl.bridge.lastKnownTime = startSec;
      this.playerCtrl.bridge.lastKnownDuration = Number(streamInfo.durationSec) || this.playerCtrl.bridge.lastKnownDuration || 0;
      this.playerCtrl.bridge.lastKnownState = res.playing
        ? MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING
        : MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED;
      this._bgAudioTookOver = true;
      this.mode = 'mod21-audio-active';
      this.statusText = '🎧 Tự động chạy nền (Luồng phát công cộng): Hình chạy tại Tab 5, Âm thanh nối thẳng Tab 3 (MP3) & luôn đồng bộ thời gian.';
      // Khi chuyển từ khung youtube-nocookie.com sang luồng Piped/Invidious (MOD21_AUDIO), ngắt hẳn iframe youtube-nocookie ngay lập tức
      this.stopAutoReconnectLoop({ silent: true });
      this._explicitIframeVisualForSession = false;
      this._iframeMutedVisualCompanion = false;
      this._silenceForegroundIframeForNativeTakeover();

      const hasVideoTarget = Boolean(
        streamInfo.videoStreamUrl || streamInfo.muxedVideoUrl || streamInfo.adaptiveVideoUrl || streamInfo.hlsUrl
      );
      if (!record.isLive && options.attachVisualVideo !== false) {
        if (hasVideoTarget) {
          this.playerCtrl._attachingPairedVisual = true;
          const attachPromise = this._attachPairedVisualVideoToMod21(record, streamInfo, {
            sessionId: reqSessionId,
            startTimeSec: startSec,
            autoplay: res.playing
          })
            .then((attached) => {
              if (isSameSessionAndVideo()) {
                this.syncAudioBridgeStageCard();
                this.syncStatusUi();
              }
              return attached;
            })
            .catch(() => {
              if (isSameSessionAndVideo()) {
                this.syncAudioBridgeStageCard();
                this.syncStatusUi();
              }
              return false;
            })
            .finally(() => {
              this.playerCtrl._attachingPairedVisual = false;
            });
          await Promise.race([attachPromise, new Promise((resolveFast) => setTimeout(() => resolveFast(null), 1800))]);
        } else {
          this.playerCtrl._attachingPairedVisual = false;
          this._silenceForegroundIframeForNativeTakeover();
        }
      } else {
        this.playerCtrl._attachingPairedVisual = false;
        this._silenceForegroundIframeForNativeTakeover();
      }
      this.syncAudioBridgeStageCard();
      this.syncStatusUi();
      this.playerCtrl.emitUiSync?.();
      this.playerCtrl._notifyMotionBgPlaybackState?.(
        res.playing ? 'playing' : 'paused',
        {
          stateCode: this.playerCtrl.bridge.lastKnownState,
          currentTime: startSec,
          forceNotify: true,
          reason: 'mod21-bridge-activated'
        }
      );
      return true;
    }

    async resolveAndStartPreferredEngine(record, options = {}) {
      if (!record?.videoId) return false;
      const sessionId = options.sessionId || this.playerCtrl._engineSessionId || 0;
      const timeoutMs = Math.max(1200, Math.min(10000, Number(options.timeoutMs) || 8500));

      const raceResult = await Promise.race([
        this.resolveDirectStream(record.videoId, Boolean(options.forceRefresh), { timeoutMs }).catch(() => null),
        new Promise((resolveTimeout) => {
          setTimeout(() => resolveTimeout({ ok: false, fallback: true, errorReason: `Timeout (${timeoutMs}ms)` }), timeoutMs + 150);
        })
      ]);

      if (sessionId && this.playerCtrl._engineSessionId && sessionId !== this.playerCtrl._engineSessionId) {
        return false;
      }
      if (!this.playerCtrl.activeVideo || String(this.playerCtrl.activeVideo.videoId) !== String(record.videoId)) {
        return false;
      }
      if (this.playerCtrl._lockedIframeSessionId && this.playerCtrl._lockedIframeSessionId === sessionId) {
        return false;
      }

      if (raceResult && raceResult.ok && !raceResult.fallback && (raceResult.audioStreamUrl || raceResult.videoStreamUrl)) {
        const liveStartSec = Math.max(
          Number(record.startSeconds) || 0,
          this.getAccurateForegroundTimestampSec(0)
        );
        const liveAutoplay = options.autoplay !== false && !this.playerCtrl?._userDesiredPaused;
        const bridged = await Promise.race([
          this.activateMod21AudioBridge(record, raceResult, {
            sessionId,
            startTimeSec: liveStartSec,
            autoplay: liveAutoplay
          }).catch(() => false),
          new Promise((resolveBridgeTimeout) => setTimeout(() => resolveBridgeTimeout(false), 11500))
        ]);
        const extNowAfterBridge = NS.audioStudio?.getExternalAudioState?.();
        if (
          (bridged ||
            (extNowAfterBridge?.active &&
              String(extNowAfterBridge.videoId || '') === String(record.videoId))) &&
          this.playerCtrl.activeEngine === 'MOD21_AUDIO'
        ) {
          return true;
        }

        if (sessionId === this.playerCtrl._engineSessionId) {
          NS.audioStudio?.pauseExternalAudioStream?.(true);
          if (this.playerCtrl.activeEngine === 'MOD21_AUDIO') {
            this.playerCtrl.activeEngine = 'RESOLVING_STREAM';
          }
        }

        // Nếu cầu nối Tab 3 chưa bắt kịp, ưu tiên nâng cấp trực tiếp HTML5 <video> (Ảnh 2) trước khi phải dùng Iframe!
        const directHtml5Ok = await this.upgradeActiveVideoToNativePlayer(record, {
          cachedStream: raceResult,
          autoplay: liveAutoplay,
          startTimeOverrideSec: liveStartSec,
          manualUserAction: true,
          sessionId
        }).catch(() => false);
        if (directHtml5Ok && this.playerCtrl.activeEngine === 'HTML5') return true;
      }

      if (sessionId !== this.playerCtrl._engineSessionId) return false;
      if (!this.playerCtrl.activeVideo || String(this.playerCtrl.activeVideo.videoId || '') !== String(record.videoId || '')) {
        return false;
      }

      // Quá thời gian dò luồng hoặc toàn bộ server tạm bận -> ngắt hẳn Tab 3 (nếu còn sót) & chuyển Luồng phát YouTube dự phòng
      this.emitTab3StreamSignal('switch-to-youtube-stream', {
        engine: 'IFRAME',
        videoId: record.videoId,
        sessionId
      });
      NS.audioStudio?.pauseExternalAudioStream?.(true);
      this.playerCtrl._lockedIframeSessionId = sessionId;
      this.playerCtrl.activeEngine = 'IFRAME';
      this.mode = 'iframe-fallback';
      this._bgAudioTookOver = false;
      this.streamFallbackReason = this.formatFriendlyStreamFallbackReason(
        this.streamFallbackReason || raceResult?.errorReason
      );
      this.statusText = `📺 ${this.streamFallbackReason}`;
      const fallbackStartSec = Math.max(
        Number(record.startSeconds) || 0,
        this.getAccurateForegroundTimestampSec(0)
      );
      const fallbackPlay = options.autoplay !== false && !this.playerCtrl?._userDesiredPaused;
      this.syncAudioBridgeStageCard();
      this._restoreForegroundStageFromFallback(fallbackStartSec, fallbackPlay);
      const autoReconnectReason =
        this._userPreSelectedBgMode || this.playerCtrl?.prefs?.audioOnlyMode
          ? 'audio-only'
          : typeof document !== 'undefined' && document.hidden
            ? 'visibility-bg'
            : 'auto-public-stream-retry';
      this.startBgBotBlockAutoReconnect(record, autoReconnectReason, {
        attachVisualVideo: autoReconnectReason === 'auto-public-stream-retry'
      });
      this.syncStatusUi();
      this.playerCtrl.emitUiSync?.();
      return false;
    }

    async switchBetweenAudioBridgeAndVideo(forceShowVideo = null) {
      const prefs = this.playerCtrl.prefs || {};
      const video = this.playerCtrl?.activeVideo;
      if (!video) {
        const nextAudioOnly = typeof forceShowVideo === 'boolean' ? !forceShowVideo : !Boolean(prefs.audioOnlyMode);
        prefs.audioOnlyMode = nextAudioOnly;
        this._userPreSelectedBgMode = nextAudioOnly;
        this.playerCtrl.vault.savePlayerPrefs(prefs);
        this.syncAudioBridgeStageCard();
        this.syncStatusUi();
        this.playerCtrl.emitUiSync?.();
        if (nextAudioOnly) {
          safeNotify('🎧 Đã bật sẵn chế độ Ẩn Hình (Chỉ Audio Nền) — khi phát video sẽ ưu tiên âm thanh nền Mục 3.', 'success', 2600);
        } else {
          safeNotify('📺 Đã đặt chế độ Mặc định Xem Video Hình trên web.', 'info', 2200);
        }
        return true;
      }
      const curEngine = this.playerCtrl.activeEngine;
      const currentlyShowingVisual = Boolean(
        !prefs.audioOnlyMode &&
        (
          (curEngine === 'MOD21_AUDIO' && NS.nativePlayer?.isActive?.() && NS.nativePlayer.visualMutedCompanion && NS.nativePlayer.mode === 'video') ||
          curEngine === 'HTML5' ||
          curEngine === 'IFRAME'
        )
      );
      const toShowVideo = typeof forceShowVideo === 'boolean' ? forceShowVideo : !currentlyShowingVisual;
      this._userPreSelectedBgMode = !toShowVideo;
      if (toShowVideo) {
        this.stopAutoReconnectLoop({ silent: true });
      }

      if (curEngine === 'MOD21_AUDIO') {
        prefs.audioOnlyMode = !toShowVideo;
        this.playerCtrl.vault.savePlayerPrefs(prefs);
        if (toShowVideo) {
          const extBefore = NS.audioStudio?.getExternalAudioState?.();
          const resumeSec = extBefore?.active
            ? Math.max(0, Number(extBefore.currentTime) || 0)
            : this.getAccurateForegroundTimestampSec(video.startSeconds || 0);
          const wasPlaying = extBefore?.active ? !extBefore.paused : !this.playerCtrl?._userDesiredPaused;

          const streamInfo = this.resolvedStreamInfo?.ok
            ? this.resolvedStreamInfo
            : video.videoId
              ? await this.resolveDirectStream(video.videoId, false, { timeoutMs: 4500 })
              : null;
          if (streamInfo?.ok && !streamInfo.fallback && (streamInfo.videoStreamUrl || streamInfo.muxedVideoUrl || streamInfo.adaptiveVideoUrl || streamInfo.hlsUrl)) {
            const attached = await this._attachPairedVisualVideoToMod21(video, streamInfo, {
              startTimeSec: resumeSec,
              autoplay: wasPlaying
            });
            if (attached) {
              this.syncStatusUi();
              this.playerCtrl.emitUiSync?.();
              safeNotify('📺 Đã bật khung Video Hình Tab 5 đồng bộ với Âm thanh nền Tab 3!', 'success', 2000);
              return true;
            }
          }
          // Không có luồng Video Hình trực tiếp -> chuyển sang Luồng phát YouTube (IFRAME)
          // đồng thời NGẮT & DỌN SẠCH âm nhạc ở Tab 3 để tránh trùng tiếng hoặc giữ bài cũ!
          this.emitTab3StreamSignal('switch-to-youtube-stream', {
            engine: 'IFRAME',
            videoId: video.videoId || '',
            sessionId: this.playerCtrl._engineSessionId || 0
          });
          NS.audioStudio?.pauseExternalAudioStream?.(true);
          if (NS.nativePlayer?.isActive?.()) {
            NS.nativePlayer.deactivate(false, { preservePiP: false });
          }
          this.playerCtrl._lockedIframeSessionId = this.playerCtrl._engineSessionId || 0;
          this.playerCtrl.activeEngine = 'IFRAME';
          this.mode = 'iframe-fallback';
          this._bgAudioTookOver = false;
          this.syncAudioBridgeStageCard();
          this._restoreForegroundStageFromFallback(resumeSec, wasPlaying);
          this.syncStatusUi();
          this.playerCtrl.emitUiSync?.();
          safeNotify('📺 Chuyển sang Luồng phát YouTube và đã tự động tắt Audio Nền Mục 3 để tránh trùng tiếng.', 'info', 2500);
          return true;
        }
        if (NS.nativePlayer?.isActive?.()) {
          NS.nativePlayer.deactivate(false, { preservePiP: false });
        }
        this.syncAudioBridgeStageCard();
        this.syncStatusUi();
        this.playerCtrl.emitUiSync?.();
        safeNotify('🎧 Đã ẩn khung hình để tiết kiệm pin/dữ liệu — Tab 3 MP3 Audio vẫn phát liên tục.', 'info', 2000);
        return true;
      }

      if (toShowVideo) {
        const savedTime = this.getAccurateForegroundTimestampSec(video.startSeconds || 0);
        const wasPlaying =
          curEngine === 'PAUSED_BY_LOCAL_MP3'
            ? true
            : this.playerCtrl.bridge.lastKnownState === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
        prefs.audioOnlyMode = false;
        this.playerCtrl.vault.savePlayerPrefs(prefs);

        if (!video.isLive && video.videoId) {
          const streamInfo = this.resolvedStreamInfo?.ok
            ? this.resolvedStreamInfo
            : await this.resolveDirectStream(video.videoId, false, { timeoutMs: 4500 });
          if (streamInfo?.ok && !streamInfo.fallback && (streamInfo.audioStreamUrl || streamInfo.videoStreamUrl)) {
            const bridged = await this.activateMod21AudioBridge(video, streamInfo, {
              startTimeSec: savedTime,
              autoplay: wasPlaying,
              manualUserAction: true
            });
            if (bridged) return true;
          }
        }

        // Dự phòng Luồng phát YouTube tại đúng mốc thời gian — ngắt hẳn Tab 3 nếu đang phát bài cũ
        this.emitTab3StreamSignal('switch-to-youtube-stream', {
          engine: 'IFRAME',
          videoId: video.videoId || '',
          sessionId: this.playerCtrl._engineSessionId || 0
        });
        NS.audioStudio?.pauseExternalAudioStream?.(true);
        if (NS.nativePlayer?.isActive?.()) {
          NS.nativePlayer.deactivate(false, { preservePiP: false });
        }
        this.playerCtrl._lockedIframeSessionId = this.playerCtrl._engineSessionId || 0;
        this.playerCtrl.activeEngine = 'IFRAME';
        this.mode = 'iframe-fallback';
        this.syncAudioBridgeStageCard();
        this._restoreForegroundStageFromFallback(savedTime, wasPlaying);
        this.startBgBotBlockAutoReconnect(video, 'auto-public-stream-retry', {
          attachVisualVideo: true
        });
        this.syncStatusUi();
        this.playerCtrl.emitUiSync?.();
        return true;
      }

      // Chuyển từ HTML5 / Iframe -> Nghe Audio Nền Tab 3
      const snap = this.playerCtrl.bridge.getCurrentPlaybackSnapshot();
      const savedTime = this.getAccurateForegroundTimestampSec(Number(snap.currentTime) || 0);
      const wasPlaying =
        snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
        Boolean(this.playerCtrl.bridge.assumedAutoplaying);
      prefs.audioOnlyMode = true;
      this.playerCtrl.vault.savePlayerPrefs(prefs);
      this.syncStatusUi();
      safeNotify('⏳ Đang tách Luồng phát công cộng sang Mục 3...', 'info', 2200);

      const streamInfo = this.resolvedStreamInfo?.ok
        ? this.resolvedStreamInfo
        : video.videoId
          ? await this.resolveDirectStream(video.videoId, false, { timeoutMs: 8500 })
          : null;
      if (streamInfo?.ok && !streamInfo.fallback && (streamInfo.audioStreamUrl || streamInfo.videoStreamUrl)) {
        const bridged = await this.activateMod21AudioBridge(video, streamInfo, {
          startTimeSec: savedTime,
          autoplay: wasPlaying,
          manualUserAction: true,
          attachVisualVideo: false
        });
        if (bridged) return true;
      }
      // Không tách được audio trực tiếp (YouTube chặn máy chủ công cộng) -> vẫn giữ tiếng tạm qua Luồng phát YouTube
      // nhưng BẬT ngay vòng lặp TỰ ĐỘNG kết nối lại liên tục bao giờ tách được thì thôi!
      prefs.audioOnlyMode = false;
      this._userPreSelectedBgMode = true;
      this.playerCtrl.vault.savePlayerPrefs(prefs);
      this.emitTab3StreamSignal('switch-to-youtube-stream', {
        engine: 'IFRAME',
        videoId: video.videoId || '',
        sessionId: this.playerCtrl._engineSessionId || 0
      });
      NS.audioStudio?.pauseExternalAudioStream?.(true);
      this.syncAudioBridgeStageCard();
      this.startBgBotBlockAutoReconnect(video, 'manual-bg-toggle', { attachVisualVideo: false });
      this.playerCtrl.emitUiSync?.();
      safeNotify('🔄 Luồng phát công cộng đang bị YouTube giới hạn — Hệ thống đang TỰ ĐỘNG kết nối lại liên tục đến khi phát nền được!', 'warning', 3600);
      return false;
    }

    _silenceForegroundIframeForNativeTakeover() {
      if (this.playerCtrl.bridge.ytPlayer && typeof this.playerCtrl.bridge.ytPlayer.destroy === 'function') {
        try {
          this.playerCtrl.bridge.ytPlayer.destroy();
        } catch (_e) {}
        this.playerCtrl.bridge.ytPlayer = null;
      }
      if (typeof document !== 'undefined') {
        const mainId = this.playerCtrl.bridge.mainIframeId;
        let iframeEl = document.getElementById(mainId);
        // YT.Player.destroy() có thể xóa/thay <iframe> khỏi DOM; giữ lại placeholder <iframe> ẩn để Stage ổn định
        if (!iframeEl || String(iframeEl.tagName || '').toUpperCase() !== 'IFRAME') {
          if (iframeEl) {
            try { iframeEl.remove(); } catch (_e) {}
          }
          const stageWrapper = document.getElementById('mod39-player-stage-wrapper');
          if (stageWrapper) {
            iframeEl = document.createElement('iframe');
            iframeEl.id = mainId;
            iframeEl.className = 'w-full h-full border-0 hidden';
            iframeEl.title = 'Trình phát YouTube Chống Sao Nhãng — Web Viết Tiểu Thuyết Của Bi';
            stageWrapper.insertBefore(iframeEl, stageWrapper.firstChild);
          }
        }
        if (iframeEl && String(iframeEl.tagName || '').toUpperCase() === 'IFRAME') {
          iframeEl.classList.add('hidden');
          try {
            if (iframeEl.getAttribute('src') !== 'about:blank') {
              iframeEl.setAttribute('src', 'about:blank');
            }
          } catch (_e) {}
        }
      }
      this.playerCtrl.bridge.playerReady = false;
      this.playerCtrl.bridge.assumedAutoplaying = false;
    }

    getAccurateForegroundTimestampSec(minFallbackSec = 0) {
      const snap = this.playerCtrl?.bridge?.getCurrentPlaybackSnapshot?.() || {};
      let sec = Number.isFinite(snap.currentTime) && snap.currentTime > 0 ? snap.currentTime : 0;
      const bridge = this.playerCtrl?.bridge;
      const isPlayingIframe =
        !NS.nativePlayer?.isActive?.() &&
        (snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING || Boolean(bridge?.assumedAutoplaying));
      if (sec <= 0.1 && isPlayingIframe) {
        const originMs = bridge?._fgFirstPlayObservedAtMs || (bridge?._fgMountAtMs ? bridge._fgMountAtMs + 900 : 0);
        if (originMs > 0 && Date.now() > originMs) {
          sec = Math.max(0, (Date.now() - originMs) / 1000);
        }
      }
      return Math.max(sec, Number(minFallbackSec) || 0);
    }

    async prewarmStreamForBackground(record, sessionId = 0) {
      if (!record?.videoId) return null;
      const streamInfo = await this.resolveDirectStream(record.videoId, false);
      if (sessionId && this.playerCtrl._engineSessionId && sessionId !== this.playerCtrl._engineSessionId) {
        return null;
      }
      if (!this.playerCtrl.activeVideo || String(this.playerCtrl.activeVideo.videoId) !== String(record.videoId)) {
        return null;
      }
      if (streamInfo && streamInfo.ok && !streamInfo.fallback && streamInfo.audioStreamUrl) {
        NS.nativePlayer?.prewarmCompanionAudio?.(streamInfo);
      }
      return streamInfo;
    }

    async upgradeActiveVideoToNativePlayer(record, options = {}) {
      const player = NS.nativePlayer;
      if (!player || !record?.videoId) return false;
      const reqSessionId = options.sessionId || this.playerCtrl._engineSessionId || 0;
      if (
        !options.manualUserAction &&
        this.playerCtrl._lockedIframeSessionId &&
        this.playerCtrl._lockedIframeSessionId === reqSessionId
      ) {
        return false;
      }

      const streamInfo =
        options.cachedStream ||
        (await this.resolveDirectStream(record.videoId, Boolean(options.forceRefresh)));
      if (
        reqSessionId &&
        this.playerCtrl._engineSessionId &&
        reqSessionId !== this.playerCtrl._engineSessionId
      ) {
        return false;
      }
      if (
        !options.manualUserAction &&
        this.playerCtrl._lockedIframeSessionId &&
        this.playerCtrl._lockedIframeSessionId === (this.playerCtrl._engineSessionId || 0)
      ) {
        return false;
      }
      if (!streamInfo || !streamInfo.ok || streamInfo.fallback) return false;
      if (!this.playerCtrl.activeVideo || String(this.playerCtrl.activeVideo.videoId) !== String(record.videoId)) {
        return false;
      }

      const preSnap = this.playerCtrl.bridge.getCurrentPlaybackSnapshot();
      const initialStartSec = Number.isFinite(options.startTimeOverrideSec)
        ? Math.max(0, Number(options.startTimeOverrideSec))
        : this.getAccurateForegroundTimestampSec(Number(record.startSeconds) || 0);
      const shouldPlay =
        options.autoplay !== undefined
          ? Boolean(options.autoplay)
          : preSnap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
            Boolean(this.playerCtrl.bridge.assumedAutoplaying);

      this.ensureNativeAudioElement();

      // Nạp âm thanh tạm tắt tiếng trước khi seek đúng mốc live để tuyệt đối không phát lặp lại giây 00:00,
      // và giữ nguyên iframe đang phát (deferStageTakeover: true) cho tới khi xác nhận HTML5 phát thành công!
      const loaded = await player.loadStream(
        {
          ...streamInfo,
          title: record.title || streamInfo.title,
          thumbnailUrl:
            record.thumbnailUrl ||
            streamInfo.thumbnailUrl ||
            `https://i.ytimg.com/vi/${record.videoId}/hqdefault.jpg`
        },
        {
          audioOnly: Boolean(this.playerCtrl.prefs?.audioOnlyMode),
          startTimeSec: initialStartSec,
          autoplay: false,
          userIntentPaused: !shouldPlay,
          deferStageTakeover: true,
          prefs: { ...(this.playerCtrl.prefs || {}), muted: true }
        }
      );

      if (!loaded) {
        return false;
      }

      const el = player.videoEl;
      const metadataReady = await new Promise((resolveMeta) => {
        if (!el) {
          resolveMeta(false);
          return;
        }
        const isSyntheticMedia = /^blob:|^data:/i.test(String(el.src || ''));
        const minReadyState = shouldPlay && !isSyntheticMedia ? 2 : 1;
        if (el.readyState >= minReadyState && !el.error && (Number.isFinite(el.duration) && el.duration > 0 || streamInfo.isLive || Number(streamInfo.durationSec) > 0)) {
          resolveMeta(true);
          return;
        }
        let done = false;
        const finish = (ok) => {
          if (done) return;
          done = true;
          el.removeEventListener('loadedmetadata', onLoadedMeta);
          el.removeEventListener('loadeddata', onPlayableData);
          el.removeEventListener('canplay', onPlayableData);
          el.removeEventListener('error', onErr);
          clearTimeout(timer);
          resolveMeta(ok);
        };
        const onPlayableData = () => finish(true);
        const onLoadedMeta = () => {
          if (!shouldPlay || isSyntheticMedia || el.readyState >= 2) {
            finish(true);
          }
        };
        const onErr = () => finish(false);
        const timer = setTimeout(() => {
          finish(Boolean(el.readyState >= minReadyState && !el.error));
        }, 2800);
        el.addEventListener('loadedmetadata', onLoadedMeta);
        el.addEventListener('loadeddata', onPlayableData, { once: true });
        el.addEventListener('canplay', onPlayableData, { once: true });
        el.addEventListener('error', onErr, { once: true });
      });

      const sessionStillValid = Boolean(
        (!reqSessionId || !this.playerCtrl._engineSessionId || reqSessionId === this.playerCtrl._engineSessionId) &&
        this.playerCtrl.activeVideo &&
        String(this.playerCtrl.activeVideo.videoId) === String(record.videoId)
      );

      const hiddenAborted = typeof document !== 'undefined' && Boolean(document.hidden);
      if (!sessionStillValid) {
        return false;
      }
      if (!metadataReady || !player.active || hiddenAborted) {
        if (el?.currentSrc && !hiddenAborted) player._markMediaUrlFailed?.(el.currentSrc);
        player.deactivate(false);
        if (this.playerCtrl.activeEngine !== 'MOD21_AUDIO') {
          this.playerCtrl.activeEngine = 'IFRAME';
          if (!hiddenAborted) {
            this._restoreForegroundStageFromFallback(initialStartSec, shouldPlay);
          }
        }
        NS.youtubeStudio?.viewRenderer?.syncFloatingMiniDock?.();
        return false;
      }

      // Đọc mốc thời gian CHÍNH XÁC nhất ngay thời điểm chuyển giao xong metadata và seek trước khi mở tiếng
      const liveTargetSec = this.getAccurateForegroundTimestampSec(initialStartSec);
      if (liveTargetSec > 0.2 && el && !streamInfo.isLive) {
        await new Promise((resolveSeek) => {
          let settled = false;
          const finishSeek = () => {
            if (settled) return;
            settled = true;
            el.removeEventListener('seeked', finishSeek);
            clearTimeout(st);
            resolveSeek();
          };
          const st = setTimeout(finishSeek, 320);
          el.addEventListener('seeked', finishSeek, { once: true });
          player.seekTo(liveTargetSec);
        });
      }

      const stillValidAfterSeek = Boolean(
        (!reqSessionId || !this.playerCtrl._engineSessionId || reqSessionId === this.playerCtrl._engineSessionId) &&
        this.playerCtrl.activeVideo &&
        String(this.playerCtrl.activeVideo.videoId) === String(record.videoId)
      );
      if (!stillValidAfterSeek) return false;

      if (shouldPlay) {
        const playOk = await player.play().catch(() => false);
        const stillValidAfterPlay = Boolean(
          (!reqSessionId || !this.playerCtrl._engineSessionId || reqSessionId === this.playerCtrl._engineSessionId) &&
          this.playerCtrl.activeVideo &&
          String(this.playerCtrl.activeVideo.videoId) === String(record.videoId)
        );
        if (!stillValidAfterPlay) return false;
        if (!playOk || !player.active || el.paused || el.error || (typeof document !== 'undefined' && document.hidden)) {
          if (el?.currentSrc && el.error) player._markMediaUrlFailed?.(el.currentSrc);
          player.deactivate(false);
          if (this.playerCtrl.activeEngine !== 'MOD21_AUDIO') {
            this.playerCtrl.activeEngine = 'IFRAME';
            this._restoreForegroundStageFromFallback(liveTargetSec, true);
          }
          NS.youtubeStudio?.viewRenderer?.syncFloatingMiniDock?.();
          return false;
        }
      }

      const targetStageHost =
        typeof document !== 'undefined'
          ? document.getElementById('mod39-native-video-host')
          : null;

      this.emitTab3StreamSignal('switch-to-html5-video', {
        engine: 'HTML5',
        videoId: record.videoId,
        sessionId: reqSessionId
      });
      NS.audioStudio?.pauseExternalAudioStream?.(true);
      this.playerCtrl.activeEngine = 'HTML5';
      this.playerCtrl.bridge.dispatchPlayerCommand('mute', []);
      if (this.playerCtrl.prefs?.audioOnlyMode) {
        this.playerCtrl.bridge.dispatchPlayerCommand('pauseVideo', []);
      } else {
        this._silenceForegroundIframeForNativeTakeover();
      }
      document.getElementById('mod39-resolving-poster-card')?.classList.add('hidden');
      player.confirmProvisionalTakeover(this.playerCtrl.prefs || {}, targetStageHost);
      this.syncAudioBridgeStageCard();
      this.syncStatusUi();
      this.playerCtrl.emitUiSync?.();
      NS.youtubeStudio?.viewRenderer?.syncFloatingMiniDock?.();
      return true;
    }

    pickBestAudioStreamUrl(payload, type = 'piped') {
      const extracted = NS.streamFetcher?.extractStreamsFromPayload?.(payload, type);
      return extracted?.audioStreamUrl || extracted?.videoStreamUrl || '';
    }

    onVideoLoaded(record, options = {}) {
      this.bindGlobalEventsOnce();
      this.registerMediaSessionHandlersOnce();
      this._bindNativePlayerEventsOnce();
      this.stopAutoReconnectLoop({ silent: true });
      this._bgAudioTookOver = false;

      this._retriedFreshVisualForVid = {};
      if (NS.nativePlayer?.isActive?.()) {
        NS.nativePlayer.deactivate(false, { preservePiP: false });
      }
      // Luôn phát tín hiệu đổi video & dừng hẳn luồng audio YouTube cũ ở Tab 3 ngay lập tức khi nạp video mới
      this.emitTab3StreamSignal('switch-video', {
        engine: options.resolvingPreferred ? 'RESOLVING_STREAM' : this.playerCtrl?.activeEngine || '',
        videoId: record?.videoId || '',
        sessionId: options.sessionId || this.playerCtrl?._engineSessionId || 0
      });
      if (NS.audioStudio?.currentTrackMeta?.isExternalStream || NS.audioStudio?._externalStream) {
        NS.audioStudio.pauseExternalAudioStream(true);
      }

      this.resolvedVideoId = '';
      this.resolvedStreamUrl = '';
      this.resolvedStreamInfo = null;
      this.streamFallbackReason = '';

      if (!record?.videoId) {
        this.mode = 'idle';
        this.statusText = '';
        this.syncAudioBridgeStageCard();
        this.syncStatusUi();
        return;
      }

      this.mode = options.resolvingPreferred ? 'resolving' : 'ready';
      this.statusText = '';
      this.syncMediaSessionState('paused');
      this.syncAudioBridgeStageCard();
      this.syncStatusUi();

      const sessionId = options.sessionId || this.playerCtrl._engineSessionId || 0;
      const isHttpOrigin =
        typeof global.location !== 'undefined' && /^https?:$/i.test(String(global.location.protocol || ''));
      const activeRec =
        this.playerCtrl?.activeVideo &&
        String(this.playerCtrl.activeVideo.videoId || '') === String(record.videoId || '')
          ? this.playerCtrl.activeVideo
          : record;
      const resolvedStartSec = Math.max(
        0,
        Number(activeRec?.startSeconds) || Number(this.playerCtrl?.bridge?.lastKnownTime) || 0
      );
      if (options.useMod21AudioBridge === true && options.cachedStream) {
        this._lastBridgePath = 'cached-bridge-entered';
        this.activateMod21AudioBridge(activeRec, options.cachedStream, {
          sessionId,
          startTimeSec: resolvedStartSec,
          autoplay: options.autoplay !== false
        })
          .then((bridgedOk) => {
            if (!bridgedOk && this.playerCtrl._engineSessionId === sessionId) {
              this._lastBridgePath = 'cached-bridge-returned-false';
              this.playerCtrl.activeEngine = 'IFRAME';
              this._restoreForegroundStageFromFallback(resolvedStartSec, options.autoplay !== false);
              this.syncAudioBridgeStageCard();
              this.syncStatusUi();
              this.playerCtrl.emitUiSync?.();
            }
          })
          .catch((bridgeErr) => {
            this._lastBridgePath = 'cached-bridge-threw:' + String(bridgeErr?.message || bridgeErr);
            if (this.playerCtrl._engineSessionId === sessionId) {
              this.playerCtrl.activeEngine = 'IFRAME';
              this._restoreForegroundStageFromFallback(resolvedStartSec, options.autoplay !== false);
              this.syncAudioBridgeStageCard();
              this.syncStatusUi();
              this.playerCtrl.emitUiSync?.();
            }
          });
      } else if (options.resolvingPreferred === true) {
        this.resolveAndStartPreferredEngine(activeRec, {
          sessionId,
          autoplay: options.autoplay !== false,
          timeoutMs: 8500
        }).catch(() => {
          if (this.playerCtrl._engineSessionId !== sessionId) return;
          this.playerCtrl.activeEngine = 'IFRAME';
          this._restoreForegroundStageFromFallback(resolvedStartSec, options.autoplay !== false);
          this.syncAudioBridgeStageCard();
          this.syncStatusUi();
        });
      } else if (options.forceResolveDirectStream === true || options.upgradeImmediately === true) {
        this.upgradeActiveVideoToNativePlayer(activeRec, {
          cachedStream: options.cachedStream || null,
          autoplay: options.autoplay !== false,
          forceRefresh: Boolean(options.forceRefresh),
          sessionId
        }).catch(() => {
          if (this.playerCtrl._engineSessionId !== sessionId) return;
          this.playerCtrl.activeEngine = 'IFRAME';
          this._restoreForegroundStageFromFallback(resolvedStartSec, options.autoplay !== false);
          this.syncAudioBridgeStageCard();
          this.syncStatusUi();
        });
      } else if (isHttpOrigin && !navigator?.webdriver && !isDesktopDirectYoutubeEnv()) {
        this.prewarmStreamForBackground(activeRec, sessionId).catch(() => {});
      }
    }

    applyPrefsToNativeAudio(audioEl) {
      if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.setExternalAudioPrefs) {
        NS.audioStudio.setExternalAudioPrefs({
          ...(this.playerCtrl.prefs || {}),
          abLoopEnabled: Boolean(this.playerCtrl.abLoop?.enabled && this.playerCtrl.isAbPairValid())
        });
      }
      if (NS.nativePlayer) {
        NS.nativePlayer.applyPrefs(this.playerCtrl.prefs || {});
        return;
      }
      if (!audioEl) return;
      const prefs = this.playerCtrl.prefs || {};
      audioEl.playbackRate = Number(prefs.speed) || 1;
      audioEl.muted = Boolean(prefs.muted);
      audioEl.volume = clampNumber((Number(prefs.volume) || 85) / 100, 0, 1, 0.85);
    }

    async activateNativeAudioPlayback(reason = 'background', options = {}) {
      const video = this.playerCtrl.activeVideo;
      const player = NS.nativePlayer;
      if (!video || !video.videoId || !player) return false;

      this.ensureNativeAudioElement();

      if (player.isActive() && player.currentStreamInfo?.videoId === video.videoId) {
        if (reason === 'background') {
          const started = player.enterBackgroundAudioHandoff();
          if (started) {
            this._bgAudioTookOver = true;
            this.mode = 'audio-bg-active';
            NS.audioBackgroundBridge?.activateKeepAlive('youtube');
            this.syncStatusUi();
            return true;
          }
        } else {
          const switched = await player.switchMode(true, { forcePlay: true });
          if (switched) {
            this._bgAudioTookOver = true;
            this.mode = reason === 'audio-only' ? 'audio-only-active' : 'audio-bg-active';
            NS.audioBackgroundBridge?.activateKeepAlive('youtube');
            this.syncStatusUi();
            return true;
          }
        }
      }

      const cached =
        (this.resolvedVideoId === String(video.videoId) && this.resolvedStreamInfo?.ok && this.resolvedStreamInfo) ||
        NS.streamFetcher?.readCache?.(video.videoId);
      const cachedUrl = cached?.audioStreamUrl || cached?.muxedVideoUrl || '';
      const needFresh = Boolean(!cached || (cachedUrl && player._failedMediaUrls?.has?.(cachedUrl)));
      const streamInfo = !needFresh ? cached : await this.resolveDirectStream(video.videoId, needFresh);
      if (!streamInfo || !streamInfo.ok || streamInfo.fallback) return false;

      const targetTime = Number.isFinite(options.startTimeSec)
        ? Math.max(0, Number(options.startTimeSec))
        : this.getAccurateForegroundTimestampSec(video.startSeconds || 0);
      const richStream = {
        ...streamInfo,
        title: video.title || streamInfo.title,
        thumbnailUrl:
          video.thumbnailUrl ||
          streamInfo.thumbnailUrl ||
          `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
      };

      // Cho trường hợp chuyển sang nền khi đang chạy iframe: thử mở & xác nhận <audio> chạy THẬT sự
      // trước khi tạm dừng/tắt tiếng iframe, tuyệt đối không làm mất tiếng khi proxy lỗi hoặc bị chặn!
      if (reason === 'background') {
        const bgVerified = await player.verifyAndStartBackgroundAudio(richStream, {
          startTimeSec: targetTime,
          prefs: this.playerCtrl.prefs,
          keepModeVideo: false
        });
        if (!bgVerified) {
          if (player.isActive() && player.mode === 'audio-only') {
            player.deactivate(false);
          }
          if (typeof document === 'undefined' || !document.hidden || this._silencedIframeForBgAudio) {
            this._restoreForegroundStageFromFallback(targetTime, true);
          }
          return false;
        }
        this._silencedIframeForBgAudio = true;
        this.playerCtrl.bridge.dispatchPlayerCommand('mute', []);
        this.playerCtrl.bridge.dispatchPlayerCommand('pauseVideo', []);
        if (!this.playerCtrl.bridge.playerReady) {
          this._silenceForegroundIframeForNativeTakeover();
        }
        this._bgAudioTookOver = true;
        this.mode = 'audio-bg-active';
        NS.audioBackgroundBridge?.activateKeepAlive('youtube');
        this.syncStatusUi();
        return true;
      }

      const ok = await player.loadStream(richStream, {
        audioOnly: true,
        startTimeSec: targetTime,
        autoplay: true,
        prefs: this.playerCtrl.prefs
      });

      if (ok) {
        this._silenceForegroundIframeForNativeTakeover();
        this._bgAudioTookOver = true;
        this.mode = reason === 'audio-only' ? 'audio-only-active' : 'audio-bg-active';
        NS.audioBackgroundBridge?.activateKeepAlive('youtube');
        this.syncStatusUi();
      }
      return ok;
    }

    async pauseNativeAudioAndSyncBack(restoreIframeAudio = true) {
      const player = NS.nativePlayer;
      if (player?.isActive?.() && player._bgAudioHandoffActive) {
        player.restoreForegroundVideoFromBgAudio();
      }
      const snap = player?.isActive?.() ? player.getSnapshot() : null;
      const resumeSec = snap ? snap.currentTime : Number(this.playerCtrl.bridge?.lastKnownTime) || 0;
      const shouldContinuePlay = Boolean(
        !player?._userExplicitlyPaused &&
        (this._iframeWasPlayingBeforeHidden || snap?.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING)
      );

      // Nếu đang phát qua luồng Direct Stream: chuyển mượt giữa Audio-Only <-> Video trên CÙNG thẻ <video>
      if (player?.isActive?.() && !this.playerCtrl.prefs?.audioOnlyMode && this.resolvedStreamInfo?.videoStreamUrl) {
        const switchedBack = await player.switchMode(false, { forcePlay: shouldContinuePlay });
        if (switchedBack) {
          this._bgAudioTookOver = false;
          this.mode = 'native-video';
          this.syncStatusUi();
          NS.youtubeStudio?.viewRenderer?.syncFloatingMiniDock?.();
          return resumeSec;
        }
      }

      let stageTouched = false;
      if (player?.isActive?.()) {
        if (!this.playerCtrl.prefs?.audioOnlyMode && player.mode === 'audio-only') {
          player.deactivate(false);
          this.playerCtrl.activeEngine = 'IFRAME';
          this._restoreForegroundStageFromFallback(resumeSec, shouldContinuePlay);
          stageTouched = true;
        } else if (restoreIframeAudio) {
          player.pause();
        }
      } else if (!this.playerCtrl.prefs?.audioOnlyMode && this._silencedIframeForBgAudio) {
        this._restoreForegroundStageFromFallback(resumeSec, shouldContinuePlay);
        stageTouched = true;
      }
      this._bgAudioTookOver = false;
      this.mode = this.resolvedStreamUrl ? 'ready' : 'iframe-fallback';
      this.syncStatusUi();
      if (stageTouched) {
        NS.youtubeStudio?.viewRenderer?.syncFloatingMiniDock?.();
      }
      return resumeSec;
    }

    isInAppWebView() {
      if (typeof navigator === 'undefined') return false;
      const ua = String(navigator.userAgent || '');
      return /FBAN|FBAV|Messenger|Zalo|Instagram|Line\/|MicroMessenger|TikTok/i.test(ua);
    }

    openInExternalSystemBrowser(videoId = '') {
      if (typeof window === 'undefined' || !window.location) return false;
      const vid = String(videoId || this.playerCtrl?.activeVideo?.videoId || '').trim();
      const loc = window.location;
      const urlObj = new URL(loc.href);
      if (vid) {
        urlObj.searchParams.set('ytv', vid);
      }
      const cleanUrl = urlObj.toString();
      const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
      const isAndroid = /Android/i.test(ua);

      if (isAndroid && /^https?:/i.test(loc.protocol)) {
        const intentUrl = `intent://${loc.host}${loc.pathname}${urlObj.search}#Intent;scheme=${loc.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(cleanUrl)};end`;
        try {
          window.location.href = intentUrl;
          return true;
        } catch (_eIntent) {}
      }

      try {
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(cleanUrl).catch(() => {});
        }
      } catch (_eClip) {}

      try {
        window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      } catch (_eOpen) {}

      safeNotify(
        '🌐 Trình duyệt trong ứng dụng (Messenger / Zalo) chặn cửa sổ nổi (PiP). Đã mở / sao chép link sang Chrome hoặc Safari để chạy nền & thu nhỏ màn hình 100%!',
        'info',
        4200
      );
      return true;
    }

    isFloatingWindowOpen() {
      return Boolean(
        NS.nativePlayer?.isInSystemPiP ||
        (this._docPipWindow && !this._docPipWindow.closed) ||
        document.getElementById('mod39-desktop-floating-win')
      );
    }

    nudgeDesktopIframeCompositorRepaint() {
      if (typeof document === 'undefined') return;
      if (this.playerCtrl?.activeEngine !== 'IFRAME') return;
      // Bảo đảm mọi lớp phủ native/audio-only/poster đều ẩn hoàn toàn khi đang phát iframe trực tiếp
      ['mod39-native-video-host', 'mod39-resolving-poster-card', 'mod39-audio-only-stage'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
      const iframe = document.getElementById('mod39-youtube-iframe');
      if (!iframe) return;
      iframe.classList.remove('hidden');
      iframe.style.visibility = 'visible';
      iframe.style.opacity = '1';
      // Kích nhẹ GPU compositor layer của Chromium để tránh khung đen hardware-decode khi chuyển tab
      iframe.style.transform = 'translateZ(0.01px)';
      requestAnimationFrame(() => {
        iframe.style.transform = 'translateZ(0)';
      });
    }

    hardStopAllExtraYoutubeAudioEngines() {
      // Hủy mọi vòng lặp tìm nguồn công cộng đang chạy nền (chặn tuyệt đối audio phát trễ sau khi đóng!)
      this._desktopFloatingLoopToken = (this._desktopFloatingLoopToken || 0) + 1;
      this._desktopFloatingSearching = false;
      this.stopAutoReconnectLoop?.({ silent: true });

      // Tắt & xóa hẳn nguồn thẻ video/audio của NativePlayer
      if (NS.nativePlayer) {
        try {
          if (document.pictureInPictureElement && NS.nativePlayer.videoEl && document.pictureInPictureElement === NS.nativePlayer.videoEl) {
            document.exitPictureInPicture?.().catch(() => {});
          }
        } catch (_ePipExit) {}
        try {
          if (NS.nativePlayer.videoEl) {
            NS.nativePlayer.videoEl.pause();
            NS.nativePlayer.videoEl.muted = true;
            NS.nativePlayer.videoEl.removeAttribute('src');
            NS.nativePlayer.videoEl.load();
          }
          if (NS.nativePlayer.companionAudioEl) {
            NS.nativePlayer.companionAudioEl.pause();
            NS.nativePlayer.companionAudioEl.muted = true;
            NS.nativePlayer.companionAudioEl.removeAttribute('src');
            NS.nativePlayer.companionAudioEl.load();
          }
          NS.nativePlayer.deactivate?.();
        } catch (_eDeact) {}
      }

      // Tắt mọi luồng audio ngoại bộ nếu đang nối qua Tab 3/Mod21
      try {
        if (NS.audioStudio?.currentTrackMeta?.isExternalStream) {
          NS.audioStudio.stopExternalAudio?.();
        }
      } catch (_eMod21) {}

      // Xóa mọi iframe trong cửa sổ nổi (gán about:blank TRƯỚC khi đóng để Chromium hủy ngay luồng âm thanh!)
      try {
        if (this._docPipWindow && !this._docPipWindow.closed) {
          this._docPipWindow.document?.querySelectorAll?.('iframe').forEach((f) => {
            try { f.src = 'about:blank'; } catch (_eF) {}
          });
          this._docPipWindow.document?.querySelectorAll?.('video,audio').forEach((m) => {
            try { m.pause(); m.muted = true; m.removeAttribute('src'); m.load(); } catch (_eM) {}
          });
          this._docPipWindow.close();
        }
      } catch (_ePipWin) {}
      this._docPipWindow = null;

      const floatEl = document.getElementById('mod39-desktop-floating-win');
      if (floatEl) {
        try {
          floatEl.querySelectorAll('iframe').forEach((f) => {
            try { f.src = 'about:blank'; } catch (_eF) {}
          });
          floatEl.querySelectorAll('video,audio').forEach((m) => {
            try { m.pause(); m.muted = true; m.removeAttribute('src'); m.load(); } catch (_eM) {}
          });
          floatEl.remove();
        } catch (_eRm) {}
      }
    }

    restoreDesktopIframeAfterFloatingClose(resumeAtSec = null, shouldResume = true) {
      const wasActive = Boolean(
        this._desktopFloatingPublicStreamActive ||
        this._desktopFloatingIframePaused ||
        this._desktopFloatingSearching
      );
      const video = this.playerCtrl?.activeVideo;
      let sec = Number.isFinite(resumeAtSec) ? Math.max(0, Math.floor(resumeAtSec)) : null;

      if (sec === null && NS.nativePlayer?.videoEl && Number.isFinite(NS.nativePlayer.videoEl.currentTime) && NS.nativePlayer.videoEl.currentTime > 0) {
        sec = Math.max(0, Math.floor(NS.nativePlayer.videoEl.currentTime));
      }

      // Tắt TRIỆT ĐỂ mọi nguồn phát phụ trước khi khôi phục iframe gốc (KHÔNG BAO GIỜ còn nhạc chạy nền ma!)
      this.hardStopAllExtraYoutubeAudioEngines();

      this._desktopFloatingPublicStreamActive = false;
      this._desktopFloatingIframePaused = false;
      this._silencedIframeForBgAudio = false;
      this.mode = 'iframe-fallback';
      if (this.playerCtrl) {
        this.playerCtrl.activeEngine = 'IFRAME';
      }

      if (wasActive && video && (video.videoId || video.playlistId)) {
        const targetSec = sec !== null ? sec : Math.max(0, Math.floor(Number(this.playerCtrl?.bridge?.lastKnownTime) || 0));
        const iframe = document.getElementById('mod39-youtube-iframe');
        const parser = NS.youtubeStudio?.parser;
        if (iframe && parser) {
          // Đồng bộ lại đúng mốc giây và trạng thái mute/play của khung video chính
          if (!iframe.src || iframe.src === 'about:blank') {
            iframe.src = parser.buildPrivacyEmbedUrl({
              videoId: video.videoId,
              playlistId: video.playlistId,
              startSeconds: targetSec,
              autoplay: Boolean(shouldResume),
              loop: !video.isLive && Boolean(this.playerCtrl?.prefs?.repeatMode),
              muted: Boolean(this.playerCtrl?.prefs?.muted),
              controls: true,
              forBackground: false
            });
          } else {
            try {
              if (!this.playerCtrl?.prefs?.muted) {
                this.playerCtrl?.bridge?.dispatchPlayerCommand?.('unMute', []);
              }
              if (targetSec > 0) this.playerCtrl?.bridge?.dispatchPlayerCommand?.('seekTo', [targetSec, true]);
              if (shouldResume) {
                this.playerCtrl?.bridge?.dispatchPlayerCommand?.('playVideo', []);
              } else {
                this.playerCtrl?.bridge?.dispatchPlayerCommand?.('pauseVideo', []);
              }
            } catch (_eRes) {}
          }
        }
        this.nudgeDesktopIframeCompositorRepaint();
      }
      this.syncStatusUi();
      this.playerCtrl?.emitUiSync?.();
    }

    closeDesktopFloatingWindow() {
      const hadAnything = Boolean(
        this._desktopFloatingPublicStreamActive ||
        this._desktopFloatingIframePaused ||
        this._desktopFloatingSearching ||
        (this._docPipWindow && !this._docPipWindow.closed) ||
        document.getElementById('mod39-desktop-floating-win') ||
        NS.nativePlayer?.isInSystemPiP
      );
      this.restoreDesktopIframeAfterFloatingClose(null, true);
      return hadAnything;
    }

    async openDesktopFloatingWindow() {
      const video = this.playerCtrl?.activeVideo;
      if (!video || (!video.videoId && !video.playlistId)) {
        safeNotify('🎬 Hãy chọn hoặc mở một video YouTube trước!', 'warning', 2600);
        return { ok: false, reason: 'no-video' };
      }

      if (this.isFloatingWindowOpen() || this._desktopFloatingPublicStreamActive || this._desktopFloatingSearching) {
        this.closeDesktopFloatingWindow();
        safeNotify('🖼️ Đã tắt Cửa sổ nổi & tắt hẳn nguồn phụ — đồng bộ về khung YouTube chính!', 'info', 2400);
        return { ok: true, closed: true };
      }

      const snap = this.playerCtrl?.bridge?.getCurrentPlaybackSnapshot?.() || {};
      const startSec = Math.max(0, Math.floor(Number(snap.currentTime) || Number(video.startSeconds) || 0));

      // 1) Tắt & tắt tiếng hoàn toàn iframe youtube-nocookie.com TRƯỚC khi mở Cửa sổ nổi (tránh phát trùng tiếng!)
      this._desktopFloatingIframePaused = true;
      try {
        this.playerCtrl?.bridge?.dispatchPlayerCommand?.('pauseVideo', []);
        this.playerCtrl?.bridge?.dispatchPlayerCommand?.('mute', []);
        this._silenceForegroundIframeForNativeTakeover?.();
        this.playerCtrl?.pause?.();
      } catch (_ePause) {}

      // 2) Trên Desktop: LIÊN TỤC tự động tìm nguồn phát công cộng (Piped / Invidious) cho đến khi lấy được video thật (hoặc người dùng bấm tắt Cửa sổ nổi)!
      if (isDesktopDirectYoutubeEnv() && video.videoId && !video.isLive) {
        const myToken = (this._desktopFloatingLoopToken || 0) + 1;
        this._desktopFloatingLoopToken = myToken;
        this._desktopFloatingSearching = true;
        this.syncStatusUi();
        this.playerCtrl?.emitUiSync?.();

        let attempt = 0;
        while (this._desktopFloatingLoopToken === myToken && String(this.playerCtrl?.activeVideo?.videoId || '') === String(video.videoId)) {
          attempt += 1;
          safeNotify(
            `🔎 [Lần ${attempt}] Đang tìm nguồn công cộng (Piped / Invidious) để bật Cửa sổ nổi Desktop... (Bấm lại nút 🖼️ Cửa sổ nổi để hủy)`,
            'info',
            2600
          );

          try {
            const upgraded = await this.upgradeActiveVideoToNativePlayer(video, {
              autoplay: true,
              startTime: startSec,
              preferVideo: true,
              forceRefresh: attempt > 1
            });

            // Kiểm tra lại token ngay lập tức: nếu người dùng đã bấm TẮT trong lúc đang dò -> hủy thẳng không cho phát nhạc nền ma!
            if (this._desktopFloatingLoopToken !== myToken) {
              this.hardStopAllExtraYoutubeAudioEngines();
              return { ok: false, cancelled: true };
            }

            if (upgraded && NS.nativePlayer?.isActive?.() && NS.nativePlayer.videoEl) {
              this._desktopFloatingSearching = false;
              this._desktopFloatingPublicStreamActive = true;
              // Tắt lại iframe chính lần nữa để bảo đảm đồng bộ duy nhất 1 nguồn âm thanh
              try {
                this.playerCtrl?.bridge?.dispatchPlayerCommand?.('pauseVideo', []);
                this.playerCtrl?.bridge?.dispatchPlayerCommand?.('mute', []);
                this._silenceForegroundIframeForNativeTakeover?.();
              } catch (_eSil) {}

              const vidEl = NS.nativePlayer.videoEl;
              const onLeavePip = () => {
                vidEl.removeEventListener('leavepictureinpicture', onLeavePip);
                const curSec = Number.isFinite(vidEl.currentTime) ? Math.floor(vidEl.currentTime) : startSec;
                const wasPlaying = !vidEl.paused;
                this.restoreDesktopIframeAfterFloatingClose(curSec, wasPlaying);
                safeNotify('🔄 Đã tắt Cửa sổ nổi & trả âm thanh/hình về đúng khung YouTube chính!', 'info', 2500);
              };
              vidEl.addEventListener('leavepictureinpicture', onLeavePip, { once: true });

              const pipRes = await NS.nativePlayer.enterSystemPictureInPicture?.();
              if (this._desktopFloatingLoopToken !== myToken) {
                vidEl.removeEventListener('leavepictureinpicture', onLeavePip);
                this.hardStopAllExtraYoutubeAudioEngines();
                return { ok: false, cancelled: true };
              }
              if (pipRes && pipRes.ok !== false && document.pictureInPictureElement === vidEl) {
                this.syncStatusUi();
                this.playerCtrl?.emitUiSync?.();
                safeNotify('🖼️ Đã bật Cửa sổ nổi Video thật từ nguồn công cộng! Khi đóng sẽ tự đồng bộ về khung gốc.', 'success', 3200);
                return { ok: true, mode: 'desktop-native-video-pip' };
              }

              // Nếu user gesture đã hết hạn do tìm nguồn lâu -> hiện khung nổi gọn trong app với nút 1 chạm bật OS Video PiP ngay lập tức!
              vidEl.removeEventListener('leavepictureinpicture', onLeavePip);
              if (typeof document !== 'undefined' && document.body) {
                document.getElementById('mod39-desktop-floating-win')?.remove();
                const win = document.createElement('div');
                win.id = 'mod39-desktop-floating-win';
                win.className =
                  'fixed bottom-4 right-4 z-[175] w-[360px] sm:w-[420px] rounded-2xl overflow-hidden border-2 border-violet-500/80 bg-zinc-950 shadow-2xl';
                const safeTitle = String(video.title || 'Video YouTube')
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
                win.innerHTML = `
                  <div id="mod39-floating-drag-bar" class="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800 cursor-move select-none text-xs">
                    <span class="font-extrabold text-violet-200 truncate flex-1">🖼️ ${safeTitle}</span>
                    <button type="button" id="btn-mod39-promote-os-pip" class="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10.5px] transition">↗ Bật PiP OS</button>
                    <button type="button" id="btn-mod39-close-floating-win" class="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-100 font-extrabold transition">✕</button>
                  </div>
                  <div id="mod39-floating-video-slot" class="relative w-full aspect-video bg-black"></div>
                `;
                document.body.appendChild(win);
                const slot = win.querySelector('#mod39-floating-video-slot');
                if (slot) {
                  vidEl.controls = true;
                  vidEl.style.width = '100%';
                  vidEl.style.height = '100%';
                  slot.appendChild(vidEl);
                  vidEl.play().catch(() => {});
                }
                win.querySelector('#btn-mod39-promote-os-pip')?.addEventListener('click', async () => {
                  vidEl.addEventListener('leavepictureinpicture', onLeavePip, { once: true });
                  const r2 = await NS.nativePlayer.enterSystemPictureInPicture?.();
                  if (r2 && r2.ok !== false && document.pictureInPictureElement === vidEl) {
                    win.classList.add('hidden');
                  }
                });
                win.querySelector('#btn-mod39-close-floating-win')?.addEventListener('click', () => {
                  this.closeDesktopFloatingWindow();
                });
                this.syncStatusUi();
                this.playerCtrl?.emitUiSync?.();
                safeNotify('🖼️ Đã mở Cửa sổ nổi từ nguồn công cộng! Bấm "↗ Bật PiP OS" để nổi ra ngoài trình duyệt.', 'success', 3400);
                return { ok: true, mode: 'desktop-native-floating' };
              }
            }
          } catch (_eDeskLoop) {}

          // Đợi 2.6 giây rồi tự thử lại nguồn Piped / Invidious khác (ngừng ngay nếu người dùng bấm tắt)
          await new Promise((resolve) => setTimeout(resolve, 2600));
        }

        this._desktopFloatingSearching = false;
        this.syncStatusUi();
        return { ok: false, cancelled: true };
      }

      const parser = NS.youtubeStudio?.parser;
      const embedUrl = parser
        ? parser.buildPrivacyEmbedUrl({
            videoId: video.videoId,
            playlistId: video.playlistId,
            startSeconds: startSec,
            autoplay: true,
            loop: !video.isLive && Boolean(this.playerCtrl?.prefs?.repeatMode),
            muted: Boolean(this.playerCtrl?.prefs?.muted),
            controls: true,
            forBackground: false
          })
        : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId || '')}?autoplay=1&start=${startSec}&rel=0`;

      // Ưu tiên dự phòng 1: Document Picture-in-Picture thật của hệ điều hành (Chrome / Edge / Desktop PWA)
      if (
        typeof window !== 'undefined' &&
        window.documentPictureInPicture &&
        typeof window.documentPictureInPicture.requestWindow === 'function'
      ) {
        try {
          const pipWin = await window.documentPictureInPicture.requestWindow({
            width: 440,
            height: 292
          });
          this._docPipWindow = pipWin;
          const doc = pipWin.document;
          doc.title = `${video.title || 'YouTube'} — Cửa sổ nổi`;
          doc.body.style.cssText =
            'margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;height:100vh;overflow:hidden;';

          const safeTitle = String(video.title || 'Video YouTube')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          doc.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:#18181b;border-bottom:1px solid #27272a;font-size:11px;font-weight:700;">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">🖼️ ${safeTitle}</span>
              <button id="pip-close-btn" type="button" style="background:#e11d48;color:#fff;border:0;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;cursor:pointer;">✕ Đóng</button>
            </div>
            <div style="flex:1;position:relative;background:#000;">
              <iframe src="${embedUrl}" style="width:100%;height:100%;border:0;" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe>
            </div>
          `;
          doc.getElementById('pip-close-btn')?.addEventListener('click', () => {
            try { pipWin.close(); } catch (_eC) {}
          });
          pipWin.addEventListener('pagehide', () => {
            this._docPipWindow = null;
            this.restoreDesktopIframeAfterFloatingClose(null, true);
          });
          this.syncStatusUi();
          this.playerCtrl?.emitUiSync?.();
          safeNotify('🖼️ Đã mở Cửa sổ nổi YouTube trên màn hình!', 'success', 2400);
          return { ok: true, mode: 'document-pip' };
        } catch (_eDocPip) {
          this._docPipWindow = null;
        }
      }

      // Ưu tiên 2: Cửa sổ nổi kéo-thả trực tiếp trong toàn bộ 6 Tab của Studio
      if (typeof document !== 'undefined' && document.body) {
        const win = document.createElement('div');
        win.id = 'mod39-desktop-floating-win';
        win.className =
          'fixed bottom-4 right-4 z-[175] w-[340px] sm:w-[400px] rounded-2xl overflow-hidden border-2 border-violet-500/70 bg-zinc-950 shadow-2xl';
        const safeTitle = String(video.title || 'Video YouTube')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        win.innerHTML = `
          <div id="mod39-floating-drag-bar" class="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800 cursor-move select-none text-xs">
            <span class="font-extrabold text-violet-200 truncate flex-1">🖼️ ${safeTitle}</span>
            <button type="button" id="btn-mod39-close-floating-win" class="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-100 font-extrabold transition">✕</button>
          </div>
          <div class="relative w-full aspect-video bg-black">
            <iframe src="${embedUrl}" class="w-full h-full border-0" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe>
          </div>
        `;
        document.body.appendChild(win);

        // Kéo thả mượt mà quanh màn hình
        const dragBar = win.querySelector('#mod39-floating-drag-bar');
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;
        if (dragBar) {
          dragBar.addEventListener('pointerdown', (ev) => {
            if (ev.target?.closest?.('button')) return;
            dragging = true;
            const rect = win.getBoundingClientRect();
            offsetX = ev.clientX - rect.left;
            offsetY = ev.clientY - rect.top;
            win.style.right = 'auto';
            win.style.bottom = 'auto';
            win.style.left = `${rect.left}px`;
            win.style.top = `${rect.top}px`;
            try { dragBar.setPointerCapture(ev.pointerId); } catch (_eCap) {}
          });
          dragBar.addEventListener('pointermove', (ev) => {
            if (!dragging) return;
            const maxX = Math.max(8, window.innerWidth - win.offsetWidth - 8);
            const maxY = Math.max(8, window.innerHeight - win.offsetHeight - 8);
            const nx = Math.max(8, Math.min(maxX, ev.clientX - offsetX));
            const ny = Math.max(8, Math.min(maxY, ev.clientY - offsetY));
            win.style.left = `${nx}px`;
            win.style.top = `${ny}px`;
          });
          dragBar.addEventListener('pointerup', () => {
            dragging = false;
          });
        }
        win.querySelector('#btn-mod39-close-floating-win')?.addEventListener('click', () => {
          this.closeDesktopFloatingWindow();
        });
        this.syncStatusUi();
        this.playerCtrl?.emitUiSync?.();
        safeNotify('🖼️ Đã mở Cửa sổ nổi — có thể kéo tự do qua mọi Tab!', 'success', 2600);
        return { ok: true, mode: 'in-app-floating' };
      }

      return { ok: false, reason: 'floating-unavailable' };
    }

    async requestSystemPictureInPicture() {
      const video = this.playerCtrl.activeVideo;
      if (!video) {
        safeNotify('🎬 Hãy chọn hoặc mở một video YouTube trước!', 'warning', 2600);
        return { ok: false, reason: 'no-video' };
      }

      // 1) Nếu đang phát qua HTML5 Video Native (Mobile/Stream) -> dùng PiP video hệ điều hành
      if (NS.nativePlayer?.isActive?.() && NS.nativePlayer.mode === 'video') {
        const res = await NS.nativePlayer.enterSystemPictureInPicture();
        this.syncStatusUi();
        this.playerCtrl.emitUiSync?.();
        return res;
      }

      // 2) Trên Desktop (YouTube Trực Tiếp) hoặc Iframe -> mở Cửa sổ nổi (Document PiP / Floating Window)
      if (isDesktopDirectYoutubeEnv() || this.playerCtrl.activeEngine === 'IFRAME') {
        return await this.openDesktopFloatingWindow();
      }

      const okVideo = await this.switchBetweenAudioBridgeAndVideo(true);
      if (okVideo && NS.nativePlayer?.isActive?.() && NS.nativePlayer.mode === 'video') {
        const caps = NS.nativePlayer.getPiPCapabilities?.();
        if (caps?.anySupported) {
          return await NS.nativePlayer.enterSystemPictureInPicture();
        }
      }
      return await this.openDesktopFloatingWindow();
    }

    handleVisibilityChange(isHidden) {
      const video = this.playerCtrl.activeVideo;
      if (!video) return;
      this.playerCtrl?.reconcileTab5AndTab3Sync?.('visibility');
      const prefs = this.playerCtrl.prefs || {};
      const player = NS.nativePlayer;

      if (this._bgHiddenWatchdogTimer) {
        clearTimeout(this._bgHiddenWatchdogTimer);
        this._bgHiddenWatchdogTimer = null;
      }

      // 0) Kiến trúc đồng bộ tự động (Tab 3 Audio Master + Tab 5 Hình Câm):
      // Thẻ <audio id="s8-native-audio-bar"> tự phát xuyên suốt cả foreground lẫn background/khóa màn hình!
      // Khi quay lại trình duyệt, tự động đồng bộ lại đúng mốc thời gian & phát tiếp khung hình Tab 5.
      if (this.playerCtrl.activeEngine === 'MOD21_AUDIO') {
        const ext = NS.audioStudio?.getExternalAudioState?.();
        this._bgAudioTookOver = Boolean(ext?.active && !ext.paused);
        if (isHidden) {
          this._syncVisualCompanionWithMod21('pause', {});
          this.playerCtrl._notifyMotionBgPlaybackState?.('paused', { reason: 'mod21-bg-save-battery' });
        } else {
          if (ext?.active && !prefs.audioOnlyMode && !video.isLive) {
            if (NS.nativePlayer?.isActive?.() && NS.nativePlayer.visualMutedCompanion) {
              this._syncVisualCompanionWithMod21(ext.paused ? 'pause' : 'play', {
                currentTime: ext.currentTime,
                paused: ext.paused,
                playbackRate: ext.playbackRate || Number(prefs.speed) || 1
              });
            } else if (this.resolvedStreamInfo?.ok && (this.resolvedStreamInfo.videoStreamUrl || this.resolvedStreamInfo.muxedVideoUrl || this.resolvedStreamInfo.adaptiveVideoUrl)) {
              this._attachPairedVisualVideoToMod21(video, this.resolvedStreamInfo, {
                startTimeSec: ext.currentTime,
                autoplay: !ext.paused
              }).catch(() => {});
            }
          }
          if (ext?.active && !ext.paused) {
            this.playerCtrl._notifyMotionBgPlaybackState?.('playing', {
              stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING,
              currentTime: ext.currentTime,
              forceSeekSync: true,
              reason: 'mod21-fg-return'
            });
          }
        }
        this.syncStatusUi();
        return;
      }

      // 1) Đang chạy trên HTML5 Video (<video>):
      if (player?.isActive?.()) {
        const snap = player.getSnapshot();
        const isPlaying =
          snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
          Boolean(!player._userExplicitlyPaused);
        if (isHidden) {
          player.setAudioSessionPlayback?.();
          if (isPlaying) {
            const handoffOk = player.enterBackgroundAudioHandoff();
            this._bgAudioTookOver = Boolean(handoffOk);
            NS.audioBackgroundBridge?.activateKeepAlive('youtube');
            this.syncMediaSessionState('playing');
            this.syncStatusUi();
          }
        } else {
          this._bgAudioTookOver = false;
          if (player._bgAudioHandoffActive) {
            if (player.mode === 'audio-only' && !prefs.audioOnlyMode) {
              this.pauseNativeAudioAndSyncBack(false).catch(() => {});
            } else {
              player.restoreForegroundVideoFromBgAudio();
            }
          } else if (!prefs.audioOnlyMode && player.mode === 'audio-only') {
            this.pauseNativeAudioAndSyncBack(false).catch(() => {});
          } else if (!player._userExplicitlyPaused && player.videoEl?.paused && !player.videoEl?.ended) {
            player.play().catch(() => {});
          }
          this.syncStatusUi();
        }
        return;
      }

      // Desktop phát trực tiếp qua youtube-nocookie.com: KHÔNG cướp quyền nền sang audio-only (tránh đen khung hình khi quay lại tab!)
      if (isDesktopDirectYoutubeEnv() && this.playerCtrl?.activeEngine === 'IFRAME' && !this._desktopFloatingPublicStreamActive) {
        if (!isHidden) {
          this.nudgeDesktopIframeCompositorRepaint();
        }
        return;
      }

      // 2) Đang chạy bằng iframe dự phòng (ví dụ video > 2.5s server bận): phát âm thanh nền nếu trích được, KHÔNG xóa iframe nếu lỗi
      const snap = this.playerCtrl.bridge.getCurrentPlaybackSnapshot();
      const isPlaying =
        snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
        Boolean(this.playerCtrl.bridge.assumedAutoplaying);

      if (isHidden && (isPlaying || Boolean(this.playerCtrl.activeVideo?.videoId))) {
        this._iframeWasPlayingBeforeHidden = Boolean(isPlaying);
        this._bgAudioTookOver = true;
        this.mode = 'audio-only';
        const liveSec = this.getAccurateForegroundTimestampSec(video.startSeconds || 0);
        player?.setAudioSessionPlayback?.();
        NS.audioBackgroundBridge?.activateKeepAlive('youtube');
        this.syncMediaSessionState('playing');
        if (!video.isLive && isPlaying) {
          this.activateNativeAudioPlayback('background', { startTimeSec: liveSec })
            .then((startedOk) => {
              if (startedOk) {
                this.stopAutoReconnectLoop({ silent: true });
                return;
              }
              if (typeof document !== 'undefined' && document.hidden && String(this.playerCtrl?.activeVideo?.videoId || '') === String(video.videoId)) {
                this.startBgBotBlockAutoReconnect(video, 'visibility-bg', { attachVisualVideo: false });
              }
              if (typeof document !== 'undefined' && document.hidden && this._iframeWasPlayingBeforeHidden && !player?.isActive?.()) {
                this.playerCtrl.bridge.dispatchPlayerCommand('playVideo', []);
                this._bgHiddenWatchdogTimer = setTimeout(() => {
                  if (typeof document !== 'undefined' && document.hidden && this._iframeWasPlayingBeforeHidden && !player?.isActive?.()) {
                    NS.audioBackgroundBridge?.activateKeepAlive?.('youtube');
                    this.playerCtrl.bridge.dispatchPlayerCommand('playVideo', []);
                  }
                }, 420);
              }
            })
            .catch(() => {
              if (typeof document !== 'undefined' && document.hidden && String(this.playerCtrl?.activeVideo?.videoId || '') === String(video.videoId)) {
                this.startBgBotBlockAutoReconnect(video, 'visibility-bg', { attachVisualVideo: false });
              }
            });
        }
        this.syncStatusUi();
      } else if (!isHidden) {
        if (this._bgReconnectState?.active && this._bgReconnectState.reason === 'visibility-bg') {
          this.stopAutoReconnectLoop({ silent: true });
        }
        if (this._iframeWasPlayingBeforeHidden || this._bgAudioTookOver || this._silencedIframeForBgAudio) {
          const shouldResumeIframe = Boolean(this._iframeWasPlayingBeforeHidden);
          this._iframeWasPlayingBeforeHidden = false;
          this._bgAudioTookOver = false;
          if (!prefs.audioOnlyMode) {
            this._restoreForegroundStageFromFallback(null, shouldResumeIframe);
          }
          this.syncStatusUi();
        }
      }
    }

    enforceBackgroundAudioLoopTick() {
      const player = NS.nativePlayer;
      if (!player || !player.isActive()) return;
      const el =
        player._bgAudioHandoffActive && player.companionAudioEl
          ? player.companionAudioEl
          : player.videoEl;
      if (!el || el.paused) return;
      const cur = el.currentTime || 0;
      this.playerCtrl.bridge.lastKnownTime = cur;
      if (this.playerCtrl?.isVideoLiveStream?.()) return;
      const ab = this.playerCtrl.abLoop;
      if (ab?.enabled && this.playerCtrl.isAbPairValid()) {
        if (cur >= ab.endSec || cur < ab.startSec - 0.25) {
          el.currentTime = ab.startSec;
          this.playerCtrl.bridge.lastKnownTime = ab.startSec;
        }
      }
    }

    syncMediaSessionState(forcedState = null) {
      this.registerMediaSessionHandlersOnce();
      if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.syncMp3MediaSession) {
        NS.audioStudio.syncMp3MediaSession();
        return;
      }
      if (NS.nativePlayer?.isActive?.()) {
        NS.nativePlayer.syncMediaSession(forcedState);
        return;
      }
      const sharedBridge = NS.audioBackgroundBridge;
      const video = this.playerCtrl.activeVideo;
      if (!sharedBridge || !video) return;

      const snap = this.playerCtrl.bridge.getCurrentPlaybackSnapshot();
      const isPlaying =
        forcedState === 'playing' ||
        (forcedState !== 'paused' &&
          forcedState !== 'none' &&
          (snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
            Boolean(this.playerCtrl.bridge.assumedAutoplaying)));

      if (isPlaying) {
        sharedBridge.activateKeepAlive('youtube');
      } else {
        sharedBridge.deactivateKeepAlive('youtube');
      }

      const isLive = Boolean(this.playerCtrl?.isVideoLiveStream?.());
      const dur = isLive ? 0 : Number(snap.duration) || 0;
      const pos = Number(snap.currentTime) || 0;

      sharedBridge.syncMediaSession({
        sourceType: 'youtube',
        title: video.title || `YouTube (${video.videoId || 'Playlist'})`,
        artist: 'YouTube Không Quảng Cáo • Web Tiểu Thuyết Bi',
        album: isLive
          ? '🔴 Đang phát trực tiếp (LIVE — Khóa lặp)'
          : this.playerCtrl.abLoop?.enabled
            ? 'Lặp đoạn A–B YouTube'
            : 'Nghe & Xem Nền',
        artworkUrl: video.videoId
          ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
          : NS.getPortraitArtworkUrl?.() || './assets/app-icon-192.png',
        state: forcedState || (isPlaying ? 'playing' : 'paused'),
        duration: dur,
        position: Math.min(dur || pos, Math.max(0, pos)),
        playbackRate: Number(this.playerCtrl.prefs?.speed) || 1.0
      });
    }

    syncStatusUi() {
      if (typeof document === 'undefined') return;
      if (this.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
        this.syncAudioBridgeStageCard();
      }
      const statusEl = document.getElementById('mod39-mobile-bg-status');
      const sysPipBtn = document.getElementById('btn-mod39-system-pip');
      const alwaysBgPipBtn = document.getElementById('btn-mod39-toggle-always-bg-pip');
      const modeBadge = document.getElementById('mod39-stream-mode-badge');

      const isDesktopDirect = isDesktopDirectYoutubeEnv();
      const isMod21Audio = this.playerCtrl?.activeEngine === 'MOD21_AUDIO';
      const isResolving = this.playerCtrl?.activeEngine === 'RESOLVING_STREAM';
      const nativeActive = Boolean(NS.nativePlayer?.isActive?.());
      const visualPairedActive = Boolean(isMod21Audio && nativeActive && NS.nativePlayer?.visualMutedCompanion && NS.nativePlayer?.mode === 'video');
      const pipSupported = Boolean(NS.nativePlayer?.getPiPCapabilities?.()?.anySupported);
      const isFloatingOpen = this.isFloatingWindowOpen();
      const canShowFloatingBtn = Boolean(
        (nativeActive && NS.nativePlayer?.mode === 'video' && pipSupported) ||
        (isDesktopDirect && this.playerCtrl?.activeVideo)
      );
      const trBg = (s) =>
        NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || '');

      const setTxtIf = (el, txt) => {
        if (el && el.textContent !== txt) el.textContent = txt;
      };
      const setClsIf = (el, cls) => {
        if (el && el.className !== cls) el.className = cls;
      };

      const isReconnectingNow = Boolean(!isDesktopDirect && this._bgReconnectState?.active && !isMod21Audio && !nativeActive);
      const isYoutubeIframeFallback = Boolean(
        !isDesktopDirect &&
        this.playerCtrl?.activeVideo &&
        !isMod21Audio &&
        !nativeActive &&
        !isResolving &&
        (this.playerCtrl?.activeEngine === 'IFRAME' || this.mode === 'iframe-fallback')
      );
      const shouldBlinkStatusAlert = Boolean(isReconnectingNow || isYoutubeIframeFallback);
      if (statusEl) {
        const bgStatusMsg = isDesktopDirect
          ? '🖥️ Chế độ Desktop (YouTube Trực Tiếp): Phát mượt trong nền qua youtube-nocookie, hỗ trợ Tua, Dừng, Lặp A–B, Tốc độ (0.25x–4x) & Cửa sổ nổi.'
          : this.statusText && this.statusText.indexOf('🎬') === -1
            ? this.statusText
            : isYoutubeIframeFallback
              ? '📺 Đang phát qua Luồng phát YouTube — Đã tự động ngắt MP3 cũ ở Tab 3 để chờ đồng bộ (Tự động chạy nền khi sang Luồng phát công cộng).'
              : '🎧 Tự động chạy nền (Luồng phát công cộng): Hình chạy tại Tab 5, Âm thanh nối thẳng Tab 3 (MP3) & luôn đồng bộ thời gian.';
        const renderedStatus = isReconnectingNow && this._bgReconnectState.attempts > 0
          ? `${trBg(bgStatusMsg)} (#${this._bgReconnectState.attempts})`
          : trBg(bgStatusMsg);
        setTxtIf(statusEl, renderedStatus);
        setClsIf(
          statusEl,
          shouldBlinkStatusAlert
            ? 'px-2.5 py-1.5 rounded-xl border border-amber-400/75 bg-amber-500/15 text-[11px] font-bold text-amber-100 leading-snug break-words flex-1 min-w-[180px] mod39-status-alert-blink'
            : 'px-2.5 py-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-[11px] text-emerald-200/95 leading-snug break-words flex-1 min-w-[180px]'
        );
        statusEl.classList.remove('hidden');
      }
      if (modeBadge) {
        if (isDesktopDirect) {
          delete modeBadge.dataset.i18nIgnore;
          setTxtIf(modeBadge, trBg('🖥️ YouTube Trực Tiếp (Desktop)'));
          setClsIf(
            modeBadge,
            'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 shrink-0'
          );
        } else if (isMod21Audio) {
          delete modeBadge.dataset.i18nIgnore;
          setTxtIf(modeBadge, trBg(visualPairedActive ? '🎬 Luồng phát công cộng (Hình + MP3 Nền)' : '🎧 Luồng phát công cộng (MP3 Nền)'));
          setClsIf(
            modeBadge,
            'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 shrink-0'
          );
        } else if (isReconnectingNow) {
          delete modeBadge.dataset.i18nIgnore;
          setTxtIf(modeBadge, trBg('🔄 Đang kết nối lại Luồng phát công cộng...'));
          setClsIf(
            modeBadge,
            'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/25 border border-amber-400/75 text-amber-200 shrink-0 animate-pulse'
          );
        } else if (isResolving) {
          delete modeBadge.dataset.i18nIgnore;
          setTxtIf(modeBadge, trBg('⏳ Đang dò Luồng phát công cộng...'));
          setClsIf(
            modeBadge,
            'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-400/60 text-amber-200 shrink-0'
          );
        } else if (nativeActive) {
          delete modeBadge.dataset.i18nIgnore;
          setTxtIf(modeBadge, trBg('🚀 Luồng phát công cộng (Video & Cửa sổ nổi)'));
          setClsIf(
            modeBadge,
            'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 border border-sky-400/60 text-sky-200 shrink-0'
          );
        } else {
          delete modeBadge.dataset.i18nIgnore;
          setTxtIf(modeBadge, trBg('📺 Luồng phát YouTube'));
          setClsIf(
            modeBadge,
            'px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0'
          );
        }
      }
      if (alwaysBgPipBtn) {
        alwaysBgPipBtn.classList.add('hidden');
      }
      const bgModeBtn = document.getElementById('btn-mod39-bg-mode-toggle');
      if (bgModeBtn) {
        const audioStageVisible = Boolean(
          document.getElementById('mod39-audio-only-stage') &&
          !document.getElementById('mod39-audio-only-stage').classList.contains('hidden')
        );
        const isAudioOnlyVisualHidden = Boolean(
          this.playerCtrl?.prefs?.audioOnlyMode ||
          (isMod21Audio && !visualPairedActive && audioStageVisible) ||
          (nativeActive && NS.nativePlayer?.mode === 'audio-only')
        );
        setTxtIf(
          bgModeBtn,
          trBg(isAudioOnlyVisualHidden ? '📺 Bật Video Hình' : '🎧 Ẩn Hình (Chỉ Audio Nền)')
        );
        setClsIf(
          bgModeBtn,
          isAudioOnlyVisualHidden
            ? 'shrink-0 px-3 py-2 rounded-xl border border-sky-400/75 bg-sky-500/25 hover:bg-sky-500/35 text-sky-100 text-xs font-extrabold transition flex lg:hidden items-center justify-center gap-1.5 shadow-md mod39-bg-toggle-blink'
            : 'shrink-0 px-3 py-2 rounded-xl border border-amber-400/65 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-extrabold transition flex lg:hidden items-center justify-center gap-1.5 shadow-sm mod39-bg-toggle-blink'
        );
      }
      if (sysPipBtn) {
        sysPipBtn.classList.toggle('hidden', !canShowFloatingBtn);
        sysPipBtn.textContent = trBg(
          isFloatingOpen ? '🖼️ Đang mở Cửa sổ nổi' : '🖼️ Cửa sổ nổi'
        );
        sysPipBtn.className = canShowFloatingBtn
          ? isFloatingOpen
            ? 'px-2.5 py-2 rounded-xl border border-emerald-400 bg-emerald-600/80 text-white text-xs font-extrabold transition shadow shrink-0 whitespace-nowrap inline-flex items-center justify-center'
            : 'px-2.5 py-2 rounded-xl border border-violet-500/45 bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 text-xs font-extrabold transition shrink-0 whitespace-nowrap inline-flex items-center justify-center'
          : 'hidden';
      }
    }
  }

  // ==========================================================================
  // 5. BỘ ĐIỀU KHIỂN PHÁT NHẠC / PHIM, VÒNG LẶP A–B, TỐC ĐỘ & FULLSCREEN
  // ==========================================================================
  class YouTubeABLoopAndPlaybackController {
    constructor(bridge, vault) {
      this.bridge = bridge;
      this.vault = vault;
      this.metadataSearcher = null;
      this.prefs = this.vault.loadPlayerPrefs();
      this.mobileBgAudio = new YouTubeMobileBgAudioBridge(this);
      this.activeVideo = this.vault.loadCurrentVideo();
      this.abLoop = this.activeVideo
        ? this.vault.getAbLoopForVideo(this.activeVideo.key)
        : { startSec: null, endSec: null, enabled: false };
      if (this.activeVideo?.isLive) {
        this.bridge.lastKnownIsLive = true;
        if (this.prefs.repeatMode) {
          this.prefs.repeatMode = false;
          this.vault.savePlayerPrefs(this.prefs);
        }
        if (this.abLoop?.enabled || this.abLoop?.startSec !== null || this.abLoop?.endSec !== null) {
          this.abLoop = { startSec: null, endSec: null, enabled: false };
          this.vault.saveAbLoopForVideo(this.activeVideo.key, this.abLoop);
        }
      }
      this.pollTimer = null;
      this.isScrubbing = false;
      this.isPseudoFullscreen = false;
      this.uiSyncCallback = null;
      this.lastLoopJumpAtMs = 0;
      this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };
      this._abValidationState = null;
      this._lastSyncedBgStateTag = '';
      this._lastBgSyncPollAt = 0;
      this._lastSyncedFgTimeSec = 0;
      this._lastSyncedFgVideoId = '';
      this._lastFgSampleTimeSec = 0;
      this._lastFgSamplePerfMs = 0;
      this._lastFgSampleState = MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED;
      this._lastFgSampleVideoId = '';
      this._lastBgSeekSyncAtMs = 0;
      this._suppressJumpDetectUntilMs = 0;

      this.wireBridgeEvents();
    }

    setUiSyncCallback(fn) {
      this.uiSyncCallback = typeof fn === 'function' ? fn : null;
    }

    setMetadataSearcher(searcher) {
      this.metadataSearcher = searcher || null;
    }

    isVideoLiveStream() {
      return Boolean(this.activeVideo?.isLive || this.bridge?.lastKnownIsLive);
    }

    _applyLiveStreamLoopLock(videoId = '', isLive = true, options = {}) {
      const targetId = String(videoId || this.activeVideo?.videoId || '').trim();
      if (targetId && this.activeVideo?.videoId && targetId !== String(this.activeVideo.videoId).trim()) {
        return false;
      }
      if (!isLive) {
        if (!options.allowUnlock) return false;
        if (this.activeVideo) {
          this.activeVideo.isLive = false;
          this.vault.saveCurrentVideo(this.activeVideo);
          this.vault.updateLiveStatusAcrossVault(this.activeVideo.key || targetId, false);
        }
        this.bridge.lastKnownIsLive = false;
        this.emitUiSync();
        return true;
      }

      const wasLive = this.isVideoLiveStream();
      const hadRepeat = Boolean(this.prefs?.repeatMode);
      const hadAb = Boolean(
        this.abLoop?.enabled ||
          typeof this.abLoop?.startSec === 'number' ||
          typeof this.abLoop?.endSec === 'number'
      );

      this.bridge.lastKnownIsLive = true;
      if (this.activeVideo) {
        this.activeVideo.isLive = true;
        this.vault.saveCurrentVideo(this.activeVideo);
        this.vault.updateLiveStatusAcrossVault(this.activeVideo.key || targetId, true);
      }

      let clearedAny = false;
      if (hadRepeat) {
        this.prefs.repeatMode = false;
        this.vault.savePlayerPrefs(this.prefs);
        clearedAny = true;
      }
      if (hadAb) {
        this.abLoop = { startSec: null, endSec: null, enabled: false };
        this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };
        if (this.activeVideo) {
          this.vault.saveAbLoopForVideo(this.activeVideo.key, this.abLoop);
        }
        clearedAny = true;
      }

      if (!wasLive || clearedAny) {
        this._abValidationState = {
          type: 'warning',
          field: 'BOTH',
          message:
            'Video đang phát trực tiếp (LIVE) nên đã khóa tính năng Lặp toàn video và Lặp 1 phần (A–B).'
        };
        this.bridge.dispatchPlayerCommand?.('setLoop', [false]);
        this.mobileBgAudio?.syncMediaSessionState?.(
          this.bridge.lastKnownState === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING
            ? 'playing'
            : 'paused'
        );
        if (options.announce !== false) {
          safeNotify(
            clearedAny
              ? '🔴 Video đang phát trực tiếp (LIVE) — Đã tự động tắt & khóa Loop toàn video và Loop 1 phần!'
              : '🔴 Video đang phát trực tiếp (LIVE) — Không thể sử dụng Loop toàn video và Loop 1 phần.',
            'warning',
            3600
          );
        }
      }
      this.updateTimelineDomDirectly(this.bridge.getCurrentPlaybackSnapshot());
      this.emitUiSync();
      return true;
    }

    _resetForegroundTrackingBaseline(timeSec = 0, stateCode = MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED, videoId = '') {
      this._lastFgSampleTimeSec = Math.max(0, Number(timeSec) || 0);
      this._lastFgSamplePerfMs = Date.now();
      this._lastFgSampleState = typeof stateCode === 'number' ? stateCode : MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED;
      this._lastFgSampleVideoId = String(videoId || this.activeVideo?.videoId || '');
    }

    _inspectForegroundJumpAndDrift(actualTime, stateCode, source = 'poll') {
      if (!this.activeVideo) return false;
      const curSec = Number(actualTime);
      if (!Number.isFinite(curSec) || curSec < 0) return false;

      const now = Date.now();
      const vid = String(this.activeVideo.videoId || '');
      if (!vid) return false;

      if (this._lastFgSampleVideoId !== vid || this._lastFgSamplePerfMs <= 0) {
        this._resetForegroundTrackingBaseline(curSec, stateCode, vid);
        return false;
      }

      if (now < (this._suppressJumpDetectUntilMs || 0)) {
        this._resetForegroundTrackingBaseline(curSec, stateCode, vid);
        return false;
      }

      const elapsedSec = Math.max(0, (now - this._lastFgSamplePerfMs) / 1000);
      const rate = Number(this.bridge.lastKnownPlaybackRate || this.prefs.speed) || 1;
      const isCurrentlyPaused =
        stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED ||
        stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED ||
        stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.CUED;
      const wasPlaying = this._lastFgSampleState === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
      const expectedSec =
        wasPlaying && !isCurrentlyPaused
          ? this._lastFgSampleTimeSec + elapsedSec * rate
          : this._lastFgSampleTimeSec;
      const jumpDelta = Math.abs(curSec - expectedSec);
      const jumpThreshold = isCurrentlyPaused ? 0.45 : 0.95;

      this._lastFgSampleTimeSec = curSec;
      this._lastFgSamplePerfMs = now;
      this._lastFgSampleState = stateCode;
      this._lastFgSampleVideoId = vid;

      if (jumpDelta >= jumpThreshold) {
        this._lastBgSeekSyncAtMs = now;
        this._lastSyncedFgTimeSec = curSec;
        if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.syncWithForegroundSeek === 'function') {
          NS.youtubeMotionBg.syncWithForegroundSeek(curSec, true);
        }
        if (isCurrentlyPaused) {
          const justIssuedPlay = Boolean(
            !this.bridge._lastStateWasSameWindowMock &&
            this.bridge._lastPlayCommandAtMs &&
            Date.now() - this.bridge._lastPlayCommandAtMs < 1800
          );
          if (!justIssuedPlay) {
            this._notifyMotionBgPlaybackState('paused', {
              stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED,
              currentTime: curSec,
              forceNotify: true,
              forceSeekSync: true,
              reason: `${source}-paused-seek`
            });
          }
        } else if (stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING) {
          this._notifyMotionBgPlaybackState('playing', {
            stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING,
            currentTime: curSec,
            forceNotify: true,
            forceSeekSync: true,
            reason: `${source}-playing-seek`
          });
        }
        return true;
      }

      return false;
    }

    _notifyMotionBgPlaybackState(stateName, extra = {}) {
      const bgEngine = NS.youtubeMotionBg;
      if (!bgEngine || typeof bgEngine.syncWithForegroundPlayback !== 'function') return false;

      const stateCode =
        typeof extra.stateCode === 'number'
          ? extra.stateCode
          : stateName === 'playing'
            ? MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING
            : stateName === 'paused'
              ? MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED
              : stateName === 'ended'
                ? MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED
                : null;
      const vid = this.activeVideo?.videoId || '';
      const timeVal =
        typeof extra.currentTime === 'number' && Number.isFinite(extra.currentTime)
          ? extra.currentTime
          : this.bridge.lastKnownTime;
      const timeMoved =
        this._lastSyncedFgVideoId === vid &&
        Math.abs((Number(timeVal) || 0) - (Number(this._lastSyncedFgTimeSec) || 0)) >= 0.45;
      const tag = `${stateName}:${vid}:${extra.errorCode || ''}`;

      if (
        !extra.forceNotify &&
        !extra.forceSeekSync &&
        !timeMoved &&
        this._lastSyncedBgStateTag === tag &&
        stateName !== 'playing'
      ) {
        return false;
      }
      this._lastSyncedBgStateTag = tag;
      this._lastSyncedFgTimeSec = Number(timeVal) || 0;
      this._lastSyncedFgVideoId = vid;

      return bgEngine.syncWithForegroundPlayback({
        state: stateName,
        stateCode,
        currentTime: timeVal,
        speed: this.prefs.speed,
        videoId: vid,
        errorCode: extra.errorCode || null,
        reason: extra.reason || stateName,
        forceNotify: Boolean(extra.forceNotify),
        // Only treat normal time progression as forceSeekSync when leaving a non-playing state;
        // triggering seekTo every ~0.5s during playing repeatedly wakes YouTube's overlay buttons.
        forceSeekSync: Boolean(extra.forceSeekSync || (stateName !== 'playing' && timeMoved))
      });
    }

    wireBridgeEvents() {
      this.bridge.on('onStateChange', (stateCode) => {
        if (this.activeEngine === 'MOD21_AUDIO') {
          return;
        }
        const snap = this.bridge.getCurrentPlaybackSnapshot();
        const isLive = this.isVideoLiveStream();
        const hasLooping =
          !isLive &&
          (Boolean(this.prefs.repeatMode) || (Boolean(this.abLoop.enabled) && this.isAbPairValid()));

        this._inspectForegroundJumpAndDrift(snap.currentTime, stateCode, 'state-change');

        // Khi kết thúc video (ENDED = 0), nếu bật Repeat hoặc A–B Loop thì tự tua lặp lại đúng video này! (Khóa với livestream)
        if (stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED) {
          if (!isLive && this.abLoop.enabled && this.isAbPairValid()) {
            this.seekToSeconds(this.abLoop.startSec, true);
            this.play();
            return;
          } else if (!isLive && this.prefs.repeatMode) {
            if (this.activeVideo?.videoId && typeof this.bridge.ytPlayer?.getVideoData === 'function') {
              try {
                const liveVid = this.bridge.ytPlayer.getVideoData()?.video_id;
                if (liveVid && liveVid !== this.activeVideo.videoId) {
                  this.bridge.mountEmbedUrlIntoIframe(
                    { ...this.activeVideo, startSeconds: 0 },
                    this.prefs
                  );
                  this.emitUiSync();
                  return;
                }
              } catch (_e) {}
            }
            if (snap.duration >= 0) {
              this.seekToSeconds(0, true);
              this.play();
              return;
            }
          }
          if (!hasLooping) {
            this._notifyMotionBgPlaybackState('ended', {
              stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED,
              currentTime: snap.duration || snap.currentTime,
              forceSeekSync: true,
              reason: 'bridge-ended'
            });
          }
        } else if (stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED) {
          // Hướng 1: Nếu trình duyệt di động tự tạm dừng iframe khi tab bị ẩn (document.hidden), tự ép playVideo sau 120ms
          if (
            typeof document !== 'undefined' &&
            document.hidden &&
            !this.isNativePlayerActive() &&
            this.mobileBgAudio?._iframeWasPlayingBeforeHidden
          ) {
            setTimeout(() => {
              if (typeof document !== 'undefined' && document.hidden && !this.isNativePlayerActive() && this.mobileBgAudio?._iframeWasPlayingBeforeHidden) {
                this.bridge._lastPlayCommandAtMs = Date.now();
                this.bridge.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
                this.bridge.dispatchPlayerCommand('playVideo', []);
                this.mobileBgAudio?.syncMediaSessionState('playing');
              }
            }, 120);
            return;
          }
          const justIssuedPlay = Boolean(
            !this.bridge._lastStateWasSameWindowMock &&
            this.bridge._lastPlayCommandAtMs &&
            Date.now() - this.bridge._lastPlayCommandAtMs < 1800
          );
          if (!justIssuedPlay) {
            this._notifyMotionBgPlaybackState('paused', {
              stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED,
              currentTime: snap.currentTime,
              forceNotify: true,
              forceSeekSync: true,
              reason: 'bridge-paused'
            });
          }
        } else if (stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING) {
          this.bridge.lastErrorCode = null;
          if (!isLive && snap.duration > 0) {
            this._reconcileAbBoundsWithDuration(snap.duration);
          }
          this._notifyMotionBgPlaybackState('playing', {
            stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING,
            currentTime: snap.currentTime,
            forceNotify: true,
            reason: 'bridge-playing'
          });
          if (!isLive) {
            this._enforceAbLoopIfNeeded(snap.currentTime, snap.duration, stateCode);
          }
        }
        this.updateTimelineDomDirectly({ ...snap, state: stateCode });
        this.emitUiSync();
      });

      this.bridge.on('onDurationDetected', (dur) => {
        if (!this.activeVideo || !dur || dur <= 0 || this.isVideoLiveStream()) return;
        this._reconcileAbBoundsWithDuration(dur);
      });

      this.bridge.on('onTimeTick', (tick) => {
        if (!this.activeVideo || !tick) return;
        const cur = Number(tick.currentTime);
        const dur = Number(tick.duration) || this.bridge.lastKnownDuration || 0;
        const st = typeof tick.state === 'number' ? tick.state : this.bridge.lastKnownState;
        const isLive = this.isVideoLiveStream();
        if (!isLive && dur > 0) {
          this._reconcileAbBoundsWithDuration(dur);
        }
        if (Number.isFinite(cur) && cur >= 0) {
          this._inspectForegroundJumpAndDrift(cur, st, 'time-tick');
          if (!isLive) {
            this._enforceAbLoopIfNeeded(cur, dur, st);
          }
          if (!this.isScrubbing) {
            this.updateTimelineDomDirectly({
              currentTime: cur,
              duration: dur,
              state: st
            });
          }
        }
      });

      this.bridge.on('onPlaybackRateChange', (rate) => {
        if (Number.isFinite(rate) && rate > 0) {
          if (this.prefs.speed !== rate) {
            this.prefs.speed = rate;
            this.vault.savePlayerPrefs(this.prefs);
          }
          if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.syncWithForegroundRate === 'function') {
            NS.youtubeMotionBg.syncWithForegroundRate(rate);
          }
          this.emitUiSync();
        }
      });

      this.bridge.on('onVideoIdDetected', (info) => {
        const detectedId = info && info.videoId ? String(info.videoId).trim() : '';
        if (!detectedId || !this.activeVideo || !this.activeVideo.videoId) return;
        if (detectedId === this.activeVideo.videoId) {
          if (info?.isLive && !this.isVideoLiveStream()) {
            this._applyLiveStreamLoopLock(detectedId, true, {
              source: 'video-id-detected-live',
              announce: true
            });
          }
          return;
        }

        // Nếu đang bật Repeat video đơn hoặc Vòng lặp A-B (chỉ với video thường): chặn không cho nhảy sang video khác!
        if (!this.isVideoLiveStream() && (this.prefs.repeatMode || (this.abLoop.enabled && this.isAbPairValid()))) {
          const targetStart =
            this.abLoop.enabled && this.isAbPairValid() ? this.abLoop.startSec : 0;
          this.bridge.mountEmbedUrlIntoIframe(
            { ...this.activeVideo, startSeconds: targetStart },
            this.prefs
          );
          safeNotify(
            `🔁 Đang khóa lặp đúng video "${this.activeVideo.title || this.activeVideo.videoId}".`,
            'info',
            1800
          );
          return;
        }

        // Chặn thông điệp tàn dư từ iframe ẩn khi đang chạy MOD21_AUDIO / HTML5 / RESOLVING_STREAM
        // hoặc từ các video cũ vừa rời đi trong cửa sổ 5 giây sau khi chuyển bài!
        if (this.activeEngine && this.activeEngine !== 'IFRAME') {
          return;
        }
        const recentExitAt = Number(this._recentSwitchedOutVideos?.[detectedId] || 0);
        if (
          (this._previousVideoId &&
            detectedId === this._previousVideoId &&
            Date.now() - (this._videoSwitchAtMs || 0) < 5000) ||
          (recentExitAt > 0 && Date.now() - recentExitAt < 5000)
        ) {
          return;
        }

        // Nếu không lặp và người dùng bấm video liên quan ngay trong khung phát YouTube:
        // nạp qua loadParsedVideo để tự động ngắt audio video cũ ở Tab 3 & đồng bộ toàn diện video mới.
        const parsedNext = this.bridge.parser.parse(`https://www.youtube.com/watch?v=${detectedId}`);
        if (parsedNext && parsedNext.valid) {
          const isNextLive = Boolean(info?.isLive || parsedNext.isLive);
          parsedNext.isLive = isNextLive;
          parsedNext.title = (info.title || '').trim() || `Video YouTube (${detectedId})`;
          this.loadParsedVideo(parsedNext);
          return;
        }
      });

      this.bridge.on('onLiveStatusDetected', (info) => {
        if (!info || !info.isLive) return;
        const vid = String(info.videoId || this.activeVideo?.videoId || '').trim();
        if (this.activeVideo?.videoId && vid && vid !== String(this.activeVideo.videoId).trim()) {
          return;
        }
        this._applyLiveStreamLoopLock(vid, true, {
          source: info.source || 'bridge-telemetry',
          announce: true
        });
      });

      this.bridge.on('onReady', () => {
        this.startPollingLoop();
        this.emitUiSync();
      });

      this.bridge.on('onTitleDetected', (title) => {
        if (this.activeVideo && title && title.trim()) {
          this.activeVideo.title = title.trim();
          this.vault.updateTitleAcrossVault(this.activeVideo.key, title.trim());
          this.emitUiSync();
        }
      });

      this.bridge.on('onError', (errCode) => {
        if (this.activeEngine === 'MOD21_AUDIO') {
          return;
        }
        if (errCode) this.bridge.lastErrorCode = errCode;
        this.bridge.assumedAutoplaying = false;
        this.bridge.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED;
        this.stopPollingLoop();
        this._notifyMotionBgPlaybackState('error', {
          errorCode: errCode || this.bridge.lastErrorCode || 150,
          forceNotify: true,
          reason: 'bridge-error'
        });
        this.updateTimelineDomDirectly(this.bridge.getCurrentPlaybackSnapshot());
        this.emitUiSync();
      });
    }

    emitUiSync() {
      if (this.uiSyncCallback) {
        try {
          this.uiSyncCallback();
        } catch (_err) {}
      }
    }

    startPollingLoop() {
      this.stopPollingLoop();
      this.pollTimer = setInterval(() => {
        this.onPollingTick();
      }, MOD39_CONSTANTS.LIMITS.AB_POLL_INTERVAL_MS);
    }

    stopPollingLoop() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    }

    reconcileTab5AndTab3Sync(reason = 'tick') {
      const extStreamObj = NS.audioStudio?._externalStream;
      const ext = NS.audioStudio?.getExternalAudioState?.();
      const tab5Vid = String(this.activeVideo?.videoId || '').trim();
      const isBridgedFromTab5 = Boolean(extStreamObj && (extStreamObj.onTimeUpdate || extStreamObj.onStateChange));
      const extVid = String(ext?.videoId || '').trim();
      const audibleIframeMountedAfterLoad = Boolean(
        extStreamObj &&
        Number(this._audibleIframeMountSeq || 0) > Number(extStreamObj.audibleIframeMountSeqAtLoad || 0)
      );

      // 1) Nếu Tab 5 đang chạy IFRAME (youtube-nocookie) / HTML5 / hoặc chưa chọn video -> ngắt hẳn mọi MP3 YouTube cũ ở Tab 3
      if (!tab5Vid || this.activeEngine === 'IFRAME' || this.activeEngine === 'HTML5') {
        const audioBarEl = typeof document !== 'undefined' ? document.getElementById('s8-native-audio-bar') : null;
        const hasResidualExternalAudio = Boolean(
          (ext && ext.active) ||
          (audioBarEl && audioBarEl.getAttribute('src') && NS.audioStudio?.currentTrackMeta?.isExternalStream)
        );
        if (hasResidualExternalAudio && !extStreamObj?._loadingInProgress) {
          const isSameStandaloneStream =
            !isBridgedFromTab5 &&
            !audibleIframeMountedAfterLoad &&
            Boolean(tab5Vid) &&
            (!extVid || extVid === tab5Vid);
          if (!isSameStandaloneStream) {
            NS.audioStudio?.pauseExternalAudioStream?.(true);
          }
        }
        if (this.activeEngine === 'HTML5') {
          this.mobileBgAudio?._silenceForegroundIframeForNativeTakeover?.();
        }
        return;
      }

      // 2) Ngược lại: nếu đang ở MOD21_AUDIO (Piped/Invidious) -> dọn sạch iframe youtube-nocookie nếu còn sót & giữ Tab 3 đúng videoId
      if (this.activeEngine === 'MOD21_AUDIO') {
        const iframeElNow = typeof document !== 'undefined' ? document.getElementById(this.bridge.mainIframeId) : null;
        const ifrSrcNow = String(iframeElNow?.getAttribute('src') || '');
        if (
          this.bridge?.ytPlayer ||
          (ifrSrcNow && ifrSrcNow !== 'about:blank' && ifrSrcNow.indexOf('youtube') !== -1)
        ) {
          this.mobileBgAudio?._silenceForegroundIframeForNativeTakeover?.();
          this.mobileBgAudio?.syncAudioBridgeStageCard?.();
        }
        if (ext && ext.active && ext.videoId && String(ext.videoId) !== tab5Vid) {
          NS.audioStudio?.pauseExternalAudioStream?.(true);
          if (NS.nativePlayer?.isActive?.()) {
            NS.nativePlayer.deactivate(false);
          }
          if (this._resyncInFlightForVid !== tab5Vid) {
            this._resyncInFlightForVid = tab5Vid;
            const targetVideo = { ...this.activeVideo };
            const targetSession = this._engineSessionId;
            this.mobileBgAudio
              ?.resolveAndStartPreferredEngine?.(targetVideo, {
                sessionId: targetSession,
                autoplay: !this._userDesiredPaused,
                timeoutMs: 8500
              })
              .finally(() => {
                if (this._resyncInFlightForVid === tab5Vid) this._resyncInFlightForVid = '';
              });
          }
          return;
        }
        const extStreamObj = NS.audioStudio?._externalStream;
        if (ext && ext.active && ext.videoId === tab5Vid && extStreamObj && !extStreamObj._loadingInProgress) {
          if (this._userDesiredPaused && !ext.paused && typeof NS.audioStudio?.setExternalAudioPaused === 'function') {
            NS.audioStudio.setExternalAudioPaused(true);
          }
        }
      }
    }

    onPollingTick() {
      if (!this.activeVideo || this.bridge.lastErrorCode) {
        const orphanExt = NS.audioStudio?.getExternalAudioState?.();
        if (!this.activeVideo && orphanExt?.active) {
          NS.audioStudio?.pauseExternalAudioStream?.(true);
        }
        return;
      }
      if (this.activeEngine === 'RESOLVING_STREAM' || this.activeEngine === 'PAUSED_BY_LOCAL_MP3') return;

      // Bảo vệ tuyệt đối: luôn kiểm tra trùng khớp videoId & engine giữa Tab 5 và Tab 3
      this.reconcileTab5AndTab3Sync('poll');
      this.mobileBgAudio?.nudgeAutoReconnectIfDue?.(false);

      // Phát hiện trường hợp người dùng chuyển sang video khác ngay bên trong khung youtube-nocookie iframe
      if (
        this.activeEngine === 'IFRAME' &&
        !this.prefs.repeatMode &&
        typeof this.bridge?.ytPlayer?.getVideoData === 'function'
      ) {
        try {
          const ifrVid = String(this.bridge.ytPlayer.getVideoData()?.video_id || '').trim();
          const curVid = String(this.activeVideo?.videoId || '').trim();
          const inOldGrace =
            this._previousVideoId &&
            ifrVid === this._previousVideoId &&
            Date.now() - (this._videoSwitchAtMs || 0) < 3500;
          if (/^[a-zA-Z0-9_-]{11}$/.test(ifrVid) && curVid && ifrVid !== curVid && !inOldGrace) {
            const parsedNext = this.bridge.parser.parse(`https://www.youtube.com/watch?v=${ifrVid}`);
            if (parsedNext && parsedNext.valid) {
              this.loadParsedVideo(parsedNext);
              return;
            }
          }
        } catch (_eIfrVid) {}
      }

      const nativeActive = Boolean(NS.nativePlayer?.isActive?.());
      const mod21Active = this.activeEngine === 'MOD21_AUDIO';
      if (
        !nativeActive &&
        !mod21Active &&
        !this.bridge._fgIframeAcked &&
        Date.now() - (this.bridge._lastHandshakeCheckAtMs || 0) >= 1000
      ) {
        this.bridge.ensureBridgeConnected(this.prefs);
      }
      const snap = this.bridge.getCurrentPlaybackSnapshot();
      const isLive = this.isVideoLiveStream();
      if (!isLive && snap.duration > 0) {
        this._reconcileAbBoundsWithDuration(snap.duration);
      }

      // Phát hiện ngay lập tức mọi cú tua hoặc nhảy thời gian trực tiếp trong khung YouTube
      this._inspectForegroundJumpAndDrift(snap.currentTime, snap.state, 'poll');

      // Đồng bộ dự phòng cho trường hợp iframe đổi trạng thái Phát/Tạm dừng mà sự kiện postMessage chưa tới kịp
      const hasLooping =
        !isLive &&
        (Boolean(this.prefs.repeatMode) || (Boolean(this.abLoop.enabled) && this.isAbPairValid()));
      if (snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED) {
        const justIssuedPlay = Boolean(
          !this.bridge._lastStateWasSameWindowMock &&
          this.bridge._lastPlayCommandAtMs &&
          Date.now() - this.bridge._lastPlayCommandAtMs < 1800
        );
        if (!justIssuedPlay) {
          this._notifyMotionBgPlaybackState('paused', {
            stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED,
            currentTime: snap.currentTime,
            reason: 'poll-paused'
          });
        }
      } else if (snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED && !hasLooping) {
        this._notifyMotionBgPlaybackState('ended', {
          stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED,
          currentTime: snap.duration || snap.currentTime,
          reason: 'poll-ended'
        });
      } else if (snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING) {
        const nowSync = Date.now();
        if (
          this._lastSyncedBgStateTag !== `playing:${this.activeVideo?.videoId || ''}:` ||
          nowSync - this._lastBgSyncPollAt >= 750
        ) {
          this._lastBgSyncPollAt = nowSync;
          this._notifyMotionBgPlaybackState('playing', {
            stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING,
            currentTime: snap.currentTime,
            reason: 'poll-playing'
          });
        }
      }

      // Thực thi logic Vòng Lặp Đoạn A–B chính xác (khóa với video đang phát trực tiếp)
      if (!isLive) {
        const abJumped = this._enforceAbLoopIfNeeded(snap.currentTime, snap.duration, snap.state);
        if (
          !abJumped &&
          !(this.abLoop.enabled && this.isAbPairValid()) &&
          this.prefs.repeatMode &&
          snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING &&
          snap.duration > 2 &&
          snap.currentTime >= snap.duration - 0.65
        ) {
          // Chủ động tua về 00:00 trước khi YouTube kích hoạt màn hình gợi ý / nhảy video khác trong Mix!
          const now = Date.now();
          if (now - this.lastLoopJumpAtMs > 1200) {
            this.lastLoopJumpAtMs = now;
            this.seekToSeconds(0, true);
            this.play();
          }
        }
      }

      if (!this.isScrubbing) {
        this.updateTimelineDomDirectly(snap);
      }
    }

    updateTimelineDomDirectly(snap) {
      if (typeof document === 'undefined') return;
      const slider = document.getElementById('slider-mod39-timeline');
      const readout = document.getElementById('mod39-time-readout');
      const statusBadge = document.getElementById('mod39-player-state-badge');

      const isLive = this.isVideoLiveStream();
      const dur = Math.max(0, Number(snap.duration) || 0);
      const cur = Math.max(0, Number(snap.currentTime) || 0);
      const isPlayingNow =
        snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
        Boolean(this.mobileBgAudio?._bgAudioTookOver);

      if (slider && !this.isScrubbing) {
        const pct = isLive
          ? 1000
          : dur > 0
            ? Math.min(1000, Math.round((cur / dur) * 1000))
            : 0;
        slider.value = String(pct);
      }
      this.syncAbVisualBar(cur, dur);
      const timeText = isLive
        ? cur > 0
          ? `🔴 LIVE • ${formatSecondsToClock(cur)}`
          : '🔴 PHÁT TRỰC TIẾP'
        : `${formatSecondsToClock(cur)} / ${dur > 0 ? formatSecondsToClock(dur) : '--:--'}`;
      if (readout && readout.textContent !== timeText) {
        readout.textContent = timeText;
      }
      const miniTimeBadge = document.getElementById('mod39-mini-time-badge');
      if (miniTimeBadge && miniTimeBadge.textContent !== timeText) {
        miniTimeBadge.textContent = timeText;
      }
      if (NS.youtubeStudio?.viewRenderer && typeof NS.youtubeStudio.viewRenderer.syncMiniScreenMedia === 'function') {
        NS.youtubeStudio.viewRenderer.syncMiniScreenMedia(snap);
      }
      const tr39 = (s) => {
        const i18n = NS?.i18n || window.NoirStudio?.i18n;
        return i18n?.translateText ? i18n.translateText(String(s || '')) : String(s || '');
      };
      const miniStateBadge = document.getElementById('mod39-mini-state-badge');
      if (miniStateBadge) {
        const rawMiniState = isLive
          ? isPlayingNow
            ? '🔴 LIVE'
            : '🔴 LIVE (Tạm dừng)'
          : isPlayingNow
            ? '▶ Đang phát'
            : '⏸ Tạm dừng';
        const nextMiniTxt = tr39(rawMiniState);
        if (miniStateBadge.getAttribute('data-i18n-ignore') !== 'true') {
          miniStateBadge.setAttribute('data-i18n-ignore', 'true');
        }
        if (miniStateBadge.textContent !== nextMiniTxt) {
          miniStateBadge.textContent = nextMiniTxt;
        }
      }
      if (statusBadge) {
        if (statusBadge.getAttribute('data-i18n-ignore') !== 'true') {
          statusBadge.setAttribute('data-i18n-ignore', 'true');
        }
        let nextBadgeTxt = '';
        if (isLive) {
          const liveMap = {
            [MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING]: '🔴 TRỰC TIẾP (Đang phát)',
            [MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED]: '🔴 LIVE • Tạm dừng',
            [MOD39_CONSTANTS.YT_PLAYER_STATES.BUFFERING]: '🔴 LIVE • Đang tải',
            [MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED]: '🔴 LIVE • Đã kết thúc',
            [MOD39_CONSTANTS.YT_PLAYER_STATES.CUED]: '🔴 LIVE • Sẵn sàng'
          };
          nextBadgeTxt = tr39(liveMap[snap.state] || '🔴 LUỒNG PHÁT TRỰC TIẾP');
        } else {
          const stMap = {
            [MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING]: '▶ Đang phát',
            [MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED]: '⏸ Tạm dừng',
            [MOD39_CONSTANTS.YT_PLAYER_STATES.BUFFERING]: '⏳ Đang tải đệm',
            [MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED]: '⏹ Đã kết thúc',
            [MOD39_CONSTANTS.YT_PLAYER_STATES.CUED]: '🎬 Sẵn sàng'
          };
          nextBadgeTxt = tr39(stMap[snap.state] || '🎬 Đã nạp khung phát');
        }
        if (statusBadge.textContent !== nextBadgeTxt) {
          statusBadge.textContent = nextBadgeTxt;
        }
      }
    }

    syncAbVisualBar(curSec = 0, durSec = 0) {
      if (typeof document === 'undefined') return;
      const fillEl = document.getElementById('mod39-ab-visual-fill');
      const playheadEl = document.getElementById('mod39-ab-playhead-marker');
      const rangeLabelEl = document.getElementById('mod39-ab-range-label');
      if (this.isVideoLiveStream()) {
        if (playheadEl) {
          playheadEl.style.left = '100%';
          playheadEl.style.opacity = '0.45';
        }
        const trAb = (s) =>
          NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || '');
        if (rangeLabelEl) {
          rangeLabelEl.textContent = trAb('🔴 Đang phát trực tiếp — khóa lặp 1 phần');
        }
        if (fillEl) {
          fillEl.style.left = '0%';
          fillEl.style.width = '0%';
          fillEl.style.opacity = '0';
        }
        return;
      }
      const ab = this.abLoop || {};
      const dur = Math.max(0, Number(durSec) || Number(this.bridge?.lastKnownDuration) || 0);
      const cur = Math.max(0, Number(curSec) || Number(this.bridge?.lastKnownTime) || 0);

      if (playheadEl) {
        const curPct = dur > 0 ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
        playheadEl.style.left = `${curPct.toFixed(2)}%`;
        playheadEl.style.opacity = dur > 0 ? '1' : '0.35';
      }

      const hasA = typeof ab.startSec === 'number';
      const hasB = typeof ab.endSec === 'number';
      if (rangeLabelEl) {
        const trAb = (s) =>
          NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || '');
        if (hasA && hasB && this.isAbPairValid()) {
          rangeLabelEl.textContent = `${formatSecondsToClock(ab.startSec)} ➔ ${formatSecondsToClock(ab.endSec)} (${ab.endSec - ab.startSec}s)`;
        } else if (hasA) {
          rangeLabelEl.textContent = trAb(`Đã đặt A: ${formatSecondsToClock(ab.startSec)} • Bấm "Đặt B" để khóa đoạn lặp`);
        } else {
          rangeLabelEl.textContent = trAb('Chưa chọn đoạn A–B');
        }
      }

      if (fillEl) {
        if (hasA && hasB && this.isAbPairValid()) {
          const refTotal = dur > 0 ? dur : Math.max(ab.endSec * 1.15, 60);
          const leftPct = Math.min(99, Math.max(0, (ab.startSec / refTotal) * 100));
          const rightPct = Math.min(100, Math.max(leftPct + 1, (ab.endSec / refTotal) * 100));
          fillEl.style.left = `${leftPct.toFixed(2)}%`;
          fillEl.style.width = `${Math.max(1.5, rightPct - leftPct).toFixed(2)}%`;
          fillEl.style.opacity = ab.enabled ? '1' : '0.45';
        } else {
          fillEl.style.left = '0%';
          fillEl.style.width = '0%';
          fillEl.style.opacity = '0';
        }
      }
    }

    loadParsedVideo(parsedVideo, options = {}) {
      if (!parsedVideo || !parsedVideo.valid) return false;
      const incomingVid = String(parsedVideo.videoId || parsedVideo.playlistId || parsedVideo.key || '');
      const nowMs = Date.now();
      if (
        !options?.forceReload &&
        incomingVid &&
        this._lastLoadParsedVid === incomingVid &&
        nowMs - (Number(this._lastLoadParsedAtMs) || 0) < 600
      ) {
        return true;
      }
      this._lastLoadParsedVid = incomingVid;
      this._lastLoadParsedAtMs = nowMs;
      if (this.mobileBgAudio) {
        this.mobileBgAudio._explicitIframeVisualForSession = false;
        this.mobileBgAudio._iframeMutedVisualCompanion = false;
        this.mobileBgAudio._silencedIframeForBgAudio = false;
      }
      if (this.bridge) {
        this.bridge._mountedMutedOverride = null;
      }
      // Mặc định: chọn video ở Tab 5 là tự động bật cả Hình Tab 5 + Audio Nền Tab 3
      // (trừ khi người dùng đã chủ động bấm nút "Ẩn Hình (Chỉ Audio Nền)" trên thanh công cụ),
      // đồng thời ưu tiên cắt nhạc MP3 cá nhân đang chạy ở Tab 3 (nếu có) và dọn hẳn âm thanh YouTube cũ!
      this._userDesiredPaused = false;
      if (!this.mobileBgAudio?._userPreSelectedBgMode) {
        this.prefs.audioOnlyMode = false;
        this.vault.savePlayerPrefs(this.prefs);
      }
      NS.audioStudio?.stopLocalMp3ForYoutubePriority?.();
      NS.audioStudio?.pauseExternalAudioStream?.(true);
      NS.nativePlayer?.deactivate?.(false, { preservePiP: false });

      const isLiveStream = Boolean(parsedVideo.isLive || parsedVideo.kind === 'LIVE');
      const record = {
        key: parsedVideo.key,
        videoId: parsedVideo.videoId,
        playlistId: parsedVideo.playlistId,
        startSeconds: parsedVideo.startSeconds || 0,
        isLive: isLiveStream,
        watchUrl: parsedVideo.watchUrl,
        thumbnailUrl: parsedVideo.thumbnailUrl,
        title:
          parsedVideo.title ||
          (parsedVideo.videoId
            ? `Video YouTube (${parsedVideo.videoId})`
            : `Danh sách phát (${parsedVideo.playlistId})`)
      };

      const prevVid = this.activeVideo && this.activeVideo.videoId ? String(this.activeVideo.videoId).trim() : '';
      if (prevVid && prevVid !== String(record.videoId || '')) {
        this._previousVideoId = prevVid;
        this._videoSwitchAtMs = Date.now();
        this._recentSwitchedOutVideos = {
          ...(this._recentSwitchedOutVideos || {}),
          [prevVid]: Date.now()
        };
        if (this.mobileBgAudio) {
          this.mobileBgAudio.resolvedVideoId = '';
          this.mobileBgAudio.resolvedStreamUrl = '';
          this.mobileBgAudio.resolvedStreamInfo = null;
          this.mobileBgAudio.streamFallbackReason = '';
        }
      }

      const prevAbSaved = this.vault.getAbLoopForVideo(record.key);
      const hadActiveLoopBefore = Boolean(
        this.prefs.repeatMode ||
          prevAbSaved?.enabled ||
          typeof prevAbSaved?.startSec === 'number' ||
          typeof prevAbSaved?.endSec === 'number' ||
          this.abLoop?.enabled ||
          typeof this.abLoop?.startSec === 'number' ||
          typeof this.abLoop?.endSec === 'number'
      );

      this.activeVideo = record;
      this.bridge.lastKnownIsLive = isLiveStream;
      this.vault.saveCurrentVideo(record);
      this.vault.pushRecentVideo(record);

      if (isLiveStream) {
        if (this.prefs.repeatMode) {
          this.prefs.repeatMode = false;
          this.vault.savePlayerPrefs(this.prefs);
        }
        this.abLoop = { startSec: null, endSec: null, enabled: false };
        this.vault.saveAbLoopForVideo(record.key, this.abLoop);
        this._abValidationState = {
          type: 'warning',
          field: 'BOTH',
          message:
            'Video đang phát trực tiếp (LIVE) nên đã khóa tính năng Lặp toàn video và Lặp 1 phần (A–B).'
        };
        if (hadActiveLoopBefore) {
          safeNotify(
            '🔴 Video đang phát trực tiếp (LIVE) — Đã tự động tắt & khóa Loop toàn video và Loop 1 phần!',
            'warning',
            3400
          );
        }
      } else {
        this.abLoop = prevAbSaved;
        this._abValidationState = null;
      }
      this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };

      this._lastSyncedBgStateTag = '';
      this._lastSyncedFgTimeSec = Number(record.startSeconds) || 0;
      this._lastSyncedFgVideoId = String(record.videoId || '');
      this._suppressJumpDetectUntilMs = Date.now() + 800;
      this._resetForegroundTrackingBaseline(
        record.startSeconds || 0,
        MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED,
        record.videoId || ''
      );
      this._engineSessionId = (this._engineSessionId || 0) + 1;
      const sessionId = this._engineSessionId;
      this._lockedIframeSessionId = 0;

      const isDesktopDirect = isDesktopDirectYoutubeEnv();
      const isHttpOrigin =
        typeof global.location !== 'undefined' && /^https?:$/i.test(String(global.location.protocol || ''));
      const cachedDirect =
        !isDesktopDirect && !isLiveStream && record.videoId ? NS.streamFetcher?.readCache?.(record.videoId) : null;
      const hasValidCachedDirect = Boolean(
        !isDesktopDirect &&
          cachedDirect &&
          cachedDirect.ok &&
          !cachedDirect.fallback &&
          (cachedDirect.videoStreamUrl || cachedDirect.audioStreamUrl)
      );

      // Trên Desktop / App Desktop: phát thẳng qua youtube-nocookie.com (đã chạy nền mượt, không cần dò luồng công cộng).
      // Trên Mobile: ưu tiên luồng công cộng HTML5 / Audio Nền Tab 3 để tắt màn hình vẫn nghe được.
      if (isDesktopDirect) {
        this.activeEngine = 'IFRAME';
        this.mobileBgAudio?.closeDesktopFloatingWindow?.();
        this.bridge.mountEmbedUrlIntoIframe(record, this.prefs);
        this.startPollingLoop();
        this.mobileBgAudio?.onVideoLoaded(record, { sessionId });
      } else if (hasValidCachedDirect) {
        if (this.mobileBgAudio) {
          this.mobileBgAudio._iframeMutedVisualCompanion = false;
          this.mobileBgAudio._silenceForegroundIframeForNativeTakeover?.();
        }
        this.activeEngine = 'RESOLVING_STREAM';
        this.startPollingLoop();
        this.mobileBgAudio?.onVideoLoaded(record, {
          sessionId,
          useMod21AudioBridge: true,
          cachedStream: cachedDirect
        });
      } else if (!isLiveStream && record.videoId && isHttpOrigin && !global.__MOD39_DISABLE_AUTO_RESOLVE__) {
        NS.nativePlayer?.unlockPlaybackGesture?.();
        NS.unlockExternalAudioGesture?.();
        // Tạm tắt âm thanh MP3 ở Tab 3 & phát tạm ngay khung hình youtube-nocookie để không bao giờ bị màn hình đen trong lúc dò luồng công cộng liên tục
        this.mobileBgAudio?.emitTab3StreamSignal?.('switch-to-youtube-stream', {
          engine: 'RESOLVING_STREAM',
          videoId: record.videoId,
          sessionId
        });
        NS.audioStudio?.pauseExternalAudioStream?.(true);
        if (this.mobileBgAudio) {
          this.mobileBgAudio._iframeMutedVisualCompanion = false;
          this.mobileBgAudio._silencedIframeForBgAudio = false;
        }
        this.activeEngine = 'RESOLVING_STREAM';
        if (!this.prefs?.audioOnlyMode) {
          this.bridge.mountEmbedUrlIntoIframe(record, this.prefs);
        } else {
          this.mobileBgAudio?._silenceForegroundIframeForNativeTakeover?.();
          this.bridge.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.BUFFERING;
        }
        this.mobileBgAudio?.syncAudioBridgeStageCard?.();
        this.startPollingLoop();
        this.mobileBgAudio?.onVideoLoaded(record, {
          sessionId,
          resolvingPreferred: true
        });
      } else {
        this.activeEngine = 'IFRAME';
        this.bridge.mountEmbedUrlIntoIframe(record, this.prefs);
        this.startPollingLoop();
        this.mobileBgAudio?.onVideoLoaded(record, { sessionId });
      }
      this.emitUiSync();

      if (
        !isLiveStream &&
        record.videoId &&
        !global.navigator?.webdriver &&
        this.metadataSearcher &&
        typeof this.metadataSearcher.probeVideoLiveMetadata === 'function'
      ) {
        const probeVid = record.videoId;
        this.metadataSearcher
          .probeVideoLiveMetadata(probeVid)
          .then((probe) => {
            if (
              probe?.found &&
              probe.isLive &&
              this.activeVideo &&
              String(this.activeVideo.videoId || '') === String(probeVid)
            ) {
              this._applyLiveStreamLoopLock(probeVid, true, {
                source: 'piped-probe',
                announce: true
              });
            }
          })
          .catch(() => {});
      }

      // Tự động ưu tiên Video YouTube làm Nền Chuyển Động 16:9 Toàn Trang (Mod 40)
      if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.onVideoSelectedAndPlayed === 'function') {
        NS.youtubeMotionBg.onVideoSelectedAndPlayed(record, { source: 'auto-priority', silent: true });
      } else if (typeof global.dispatchEvent === 'function' && typeof global.CustomEvent === 'function') {
        global.dispatchEvent(new global.CustomEvent('mod39:video-loaded', { detail: record }));
      }
      return true;
    }

    isNativePlayerActive() {
      return Boolean(NS.nativePlayer?.isActive?.());
    }

    requestSystemPiP() {
      return this.mobileBgAudio?.requestSystemPictureInPicture?.();
    }

    play() {
      NS.nativePlayer?.unlockPlaybackGesture?.();
      NS.unlockExternalAudioGesture?.();
      NS.audioBackgroundBridge?.activateKeepAlive?.('youtube');
      this._userDesiredPaused = false;
      NS.audioStudio?.stopLocalMp3ForYoutubePriority?.();
      this.bridge.lastErrorCode = null;
      this.bridge.assumedAutoplaying = true;
      this.bridge._lastStateWasSameWindowMock = false;
      this.bridge.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
      this.bridge._lastMessageStateAtMs = Date.now();
      this.bridge._lastPlayCommandAtMs = Date.now();
      this._lastFgSampleState = MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
      this._lastFgSamplePerfMs = Date.now();
      this.reconcileTab5AndTab3Sync('play');
      if (this.activeEngine === 'PAUSED_BY_LOCAL_MP3' && this.activeVideo && this.mobileBgAudio?.resolvedStreamInfo) {
        this.mobileBgAudio.activateMod21AudioBridge(this.activeVideo, this.mobileBgAudio.resolvedStreamInfo, {
          startTimeSec: this.bridge.lastKnownTime || 0,
          autoplay: true,
          manualUserAction: true
        }).catch(() => {});
        return;
      }
      if (this.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.setExternalAudioPaused) {
        const curTimeNow = Number(this.bridge.lastKnownTime) || 0;
        NS.audioStudio.setExternalAudioPaused(false);
        this.mobileBgAudio?._syncVisualCompanionWithMod21?.('play', {
          currentTime: curTimeNow,
          paused: false,
          playbackRate: Number(this.prefs?.speed) || 1
        });
        this.mobileBgAudio?.syncMediaSessionState('playing');
      } else if (this.isNativePlayerActive()) {
        NS.nativePlayer.play();
      } else if (
        this.activeVideo?.videoId &&
        !this.isVideoLiveStream() &&
        this.mobileBgAudio?.resolvedStreamInfo?.ok &&
        !this.mobileBgAudio.resolvedStreamInfo.fallback &&
        String(this.mobileBgAudio.resolvedVideoId || '') === String(this.activeVideo.videoId)
      ) {
        this.mobileBgAudio
          .activateMod21AudioBridge(this.activeVideo, this.mobileBgAudio.resolvedStreamInfo, {
            startTimeSec: Number(this.bridge.lastKnownTime) || 0,
            autoplay: true,
            manualUserAction: true
          })
          .catch(() => {});
      } else {
        const isHttpOriginPlay =
          typeof global.location !== 'undefined' && /^https?:$/i.test(String(global.location.protocol || ''));
        if (
          !isDesktopDirectYoutubeEnv() &&
          this.activeVideo?.videoId &&
          !this.isVideoLiveStream() &&
          isHttpOriginPlay &&
          !global.navigator?.webdriver &&
          !global.__MOD39_DISABLE_AUTO_RESOLVE__ &&
          (!this._lockedIframeSessionId || this._lockedIframeSessionId !== this._engineSessionId)
        ) {
          this.mobileBgAudio
            ?.resolveAndStartPreferredEngine?.(this.activeVideo, {
              sessionId: this._engineSessionId,
              autoplay: true,
              timeoutMs: 8500
            })
            .catch(() => {});
        } else {
          this.bridge.ensureBridgeConnected(this.prefs);
          this.bridge.dispatchPlayerCommand('playVideo', []);
          if (this.prefs.audioOnlyMode) {
            this.mobileBgAudio?.activateNativeAudioPlayback('audio-only');
          } else {
            this.mobileBgAudio?.syncMediaSessionState('playing');
          }
        }
      }
      this._notifyMotionBgPlaybackState('playing', {
        stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING,
        currentTime: this.bridge.lastKnownTime,
        forceNotify: true,
        reason: 'controller-play'
      });
      this.updateTimelineDomDirectly({
        currentTime: this.bridge.lastKnownTime,
        duration: this.bridge.lastKnownDuration,
        state: MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING
      });
      this.persistCurrentPlaybackSnapshotNow(true);
      this.emitUiSync();
    }

    pause() {
      const curTime = Number(this.bridge.lastKnownTime) || 0;
      this._userDesiredPaused = true;
      if (this.mobileBgAudio) {
        this.mobileBgAudio._iframeWasPlayingBeforeHidden = false;
      }
      this.bridge.assumedAutoplaying = false;
      this.bridge._lastPlayCommandAtMs = 0;
      this.bridge.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED;
      this.bridge._lastMessageStateAtMs = Date.now();
      this._lastFgSampleState = MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED;
      this._lastFgSampleTimeSec = curTime;
      this._lastFgSamplePerfMs = Date.now();
      this.reconcileTab5AndTab3Sync('pause');
      if (this.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.setExternalAudioPaused) {
        NS.audioStudio.setExternalAudioPaused(true);
        this.mobileBgAudio?._syncVisualCompanionWithMod21?.('pause', {});
        this.mobileBgAudio?.syncMediaSessionState('paused');
      } else if (this.isNativePlayerActive()) {
        NS.nativePlayer.pause();
      } else {
        this.bridge.dispatchPlayerCommand('pauseVideo', []);
        this.mobileBgAudio?.pauseNativeAudioAndSyncBack(!this.prefs.audioOnlyMode);
        this.mobileBgAudio?.syncMediaSessionState('paused');
      }
      this._notifyMotionBgPlaybackState('paused', {
        stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED,
        currentTime: curTime,
        forceNotify: true,
        forceSeekSync: true,
        reason: 'controller-pause'
      });
      this.updateTimelineDomDirectly({
        currentTime: curTime,
        duration: this.bridge.lastKnownDuration,
        state: MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED
      });
      this.persistCurrentPlaybackSnapshotNow(true);
      this.emitUiSync();
    }

    persistCurrentPlaybackSnapshotNow(forceWrite = false) {
      try {
        if (!this.activeVideo || (!this.activeVideo.videoId && !this.activeVideo.playlistId)) {
          return false;
        }
        const snap = this.bridge?.getCurrentPlaybackSnapshot?.() || {};
        const sec = Math.max(
          0,
          Math.floor(
            Number.isFinite(Number(snap.currentTime))
              ? Number(snap.currentTime)
              : Number(this.bridge?.lastKnownTime ?? this.activeVideo.startSeconds) || 0
          )
        );
        const prevSec = Math.max(0, Math.floor(Number(this.activeVideo.startSeconds) || 0));
        const isPaused = snap.state !== MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING;
        if (!forceWrite && Math.abs(sec - prevSec) < 1 && this._lastSavedPausedFlag === isPaused) {
          return true;
        }
        this._lastSavedPausedFlag = isPaused;
        this.activeVideo = {
          ...this.activeVideo,
          startSeconds: sec
        };
        this.vault.saveCurrentVideo(this.activeVideo);
        safeStorageSet(
          'noir_v40_mod39_playback_session_v1',
          JSON.stringify({
            stoppedByUser: false,
            paused: isPaused,
            currentTime: sec,
            videoKey: this.activeVideo.key || this.activeVideo.videoId || '',
            updatedAt: Date.now()
          })
        );
        return true;
      } catch (_e) {
        return false;
      }
    }

    stopAndClearVideo(showToast = true) {
      this._engineSessionId = (this._engineSessionId || 0) + 1;
      if (this.mobileBgAudio) {
        this.mobileBgAudio._userPreSelectedBgMode = false;
        this.mobileBgAudio.resolvedVideoId = '';
        this.mobileBgAudio.resolvedStreamUrl = '';
        this.mobileBgAudio.resolvedStreamInfo = null;
        this.mobileBgAudio.streamFallbackReason = '';
        this.mobileBgAudio.stopAutoReconnectLoop?.({ silent: true });
        this.mobileBgAudio.closeDesktopFloatingWindow?.();
      }
      this.bridge.assumedAutoplaying = false;
      this.bridge._lastPlayCommandAtMs = 0;
      this.bridge.lastKnownTime = 0;
      this.bridge.lastKnownDuration = 0;
      this.bridge.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED;
      this.bridge._fgMountGeneration = (this.bridge._fgMountGeneration || 0) + 1;
      this.mobileBgAudio?.emitTab3StreamSignal?.('stop', {
        engine: 'STOPPED',
        videoId: '',
        sessionId: this._engineSessionId
      });
      try {
        NS.nativePlayer?.deactivate?.();
      } catch (_e) {}
      try {
        if (this.activeEngine === 'MOD21_AUDIO' || this.mobileBgAudio?._bgAudioTookOver || NS.audioStudio?.currentTrackMeta?.isExternalStream) {
          NS.audioStudio?.pauseExternalAudioStream?.(true);
        }
      } catch (_e2) {}
      try {
        const hostEl = document.getElementById('mod39-native-video-host');
        if (hostEl) hostEl.classList.add('hidden');
        this.mobileBgAudio?._silenceForegroundIframeForNativeTakeover?.();
      } catch (_e3) {}
      if (this.activeVideo?.videoId) {
        const stoppedVid = String(this.activeVideo.videoId).trim();
        this._previousVideoId = stoppedVid;
        this._videoSwitchAtMs = Date.now();
        this._recentSwitchedOutVideos = {
          ...(this._recentSwitchedOutVideos || {}),
          [stoppedVid]: Date.now()
        };
      }
      this._lastLoadParsedVid = '';
      this.activeEngine = '';
      this.activeVideo = null;
      this.vault.saveCurrentVideo(null);
      safeStorageSet(
        'noir_v40_mod39_playback_session_v1',
        JSON.stringify({
          stoppedByUser: true,
          paused: true,
          currentTime: 0,
          videoKey: null,
          updatedAt: Date.now()
        })
      );
      this.mobileBgAudio?.syncAudioBridgeStageCard?.();
      this.updateTimelineDomDirectly({ currentTime: 0, duration: 0, state: -1 });
      this.emitUiSync();
      if (showToast) {
        safeNotify('⏹️ Đã dừng và tắt hẳn trình phát Video YouTube.', 'info', 2200);
      }
      return true;
    }

    togglePlayPause() {
      const snap = this.bridge.getCurrentPlaybackSnapshot();
      const isPlayingNow =
        snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
        snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.BUFFERING ||
        (snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED && Boolean(this.bridge.assumedAutoplaying));
      if (isPlayingNow) {
        this.pause();
      } else {
        this.play();
      }
    }

    seekToSeconds(seconds, allowAhead = true) {
      const target = Math.max(0, Number(seconds) || 0);
      this.bridge._lastUserSeekAtMs = Date.now();
      this.bridge.lastKnownTime = target;
      this.bridge._lastMessageTimeAtMs = Date.now();
      this._suppressJumpDetectUntilMs = Date.now() + 750;
      this._lastBgSeekSyncAtMs = Date.now();
      this._lastSyncedFgTimeSec = target;
      this._resetForegroundTrackingBaseline(
        target,
        this.bridge.lastKnownState,
        this.activeVideo?.videoId || ''
      );
      if (this.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.seekExternalAudio) {
        NS.audioStudio.seekExternalAudio(target);
        this.mobileBgAudio?._syncVisualCompanionWithMod21?.('seek', { currentTime: target });
      } else if (this.isNativePlayerActive()) {
        NS.nativePlayer.seekTo(target);
      } else {
        this.bridge.dispatchPlayerCommand('seekTo', [target, Boolean(allowAhead)]);
      }
      this.mobileBgAudio?.syncMediaSessionState();
      if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.syncWithForegroundSeek === 'function') {
        NS.youtubeMotionBg.syncWithForegroundSeek(target, allowAhead);
      }
      const isPausedNow =
        this.bridge.lastKnownState === MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED ||
        this.bridge.lastKnownState === MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED ||
        this.bridge.lastKnownState === MOD39_CONSTANTS.YT_PLAYER_STATES.CUED ||
        (this.bridge.lastKnownState === MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED &&
          !this.bridge.assumedAutoplaying);
      if (isPausedNow) {
        this._notifyMotionBgPlaybackState('paused', {
          stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED,
          currentTime: target,
          forceNotify: true,
          forceSeekSync: true,
          reason: 'controller-seek-paused'
        });
      }
      this.updateTimelineDomDirectly({
        currentTime: target,
        duration: this.bridge.lastKnownDuration,
        state: this.bridge.lastKnownState
      });
      if (NS.youtubeStudio?.viewRenderer && typeof NS.youtubeStudio.viewRenderer.syncMiniScreenMedia === 'function') {
        NS.youtubeStudio.viewRenderer.syncMiniScreenMedia(
          {
            currentTime: target,
            duration: this.bridge.lastKnownDuration,
            state: this.bridge.lastKnownState
          },
          { forceSeek: true }
        );
      }
      this.persistCurrentPlaybackSnapshotNow(true);
    }

    seekRelative(deltaSeconds) {
      const snap = this.bridge.getCurrentPlaybackSnapshot();
      const dur = snap.duration > 0 ? snap.duration : Number.MAX_SAFE_INTEGER;
      const next = clampNumber(snap.currentTime + deltaSeconds, 0, dur, 0);
      this.seekToSeconds(next, true);
    }

    setSpeed(rate) {
      const cleanRate = MOD39_CONSTANTS.SPEED_OPTIONS.includes(Number(rate)) ? Number(rate) : 1;
      this.prefs.speed = cleanRate;
      this.vault.savePlayerPrefs(this.prefs);
      let iframeSpeedCapped = false;
      if (this.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.setExternalAudioPrefs) {
        NS.audioStudio.setExternalAudioPrefs(this.prefs);
        this.mobileBgAudio?._syncVisualCompanionWithMod21?.('rate', { playbackRate: cleanRate });
      } else if (this.isNativePlayerActive()) {
        NS.nativePlayer.setPlaybackRate(cleanRate);
      } else {
        // YouTube Iframe API chính thức hỗ trợ 0.25x -> 2x; truyền mức tối đa 2x khi > 2x để tránh bị từ chối lệnh
        const ytSafeRate = cleanRate > 2 ? 2 : cleanRate;
        iframeSpeedCapped = cleanRate > 2;
        this.bridge.dispatchPlayerCommand('setPlaybackRate', [ytSafeRate]);
      }
      this.mobileBgAudio?.applyPrefsToNativeAudio();
      this.mobileBgAudio?.syncMediaSessionState();
      if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.syncWithForegroundRate === 'function') {
        NS.youtubeMotionBg.syncWithForegroundRate(cleanRate);
      }
      this.emitUiSync();
      safeNotify(
        iframeSpeedCapped
          ? `⚡ Tốc độ ${cleanRate}x đã chọn (Khung YouTube chuẩn giới hạn tối đa 2x; trình phát MP3/HTML5 hỗ trợ trọn vẹn 3x–4x).`
          : `⚡ Tốc độ phát YouTube: ${cleanRate}x`,
        'info',
        iframeSpeedCapped ? 3200 : 1800
      );
    }

    setVolume(volumePct) {
      const cleanVol = clampNumber(volumePct, 0, 100, 85);
      this.prefs.volume = cleanVol;
      if (cleanVol > 0 && this.prefs.muted) {
        this.prefs.muted = false;
        if (!this.isNativePlayerActive() && this.activeEngine !== 'MOD21_AUDIO') {
          this.bridge.dispatchPlayerCommand('unMute', []);
        }
      }
      this.vault.savePlayerPrefs(this.prefs);
      if (this.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.setExternalAudioPrefs) {
        NS.audioStudio.setExternalAudioPrefs(this.prefs);
      } else if (!this.isNativePlayerActive()) {
        this.bridge.dispatchPlayerCommand('setVolume', [cleanVol]);
      }
      this.mobileBgAudio?.applyPrefsToNativeAudio();
      this.emitUiSync();
    }

    toggleMute() {
      this.prefs.muted = !this.prefs.muted;
      this.vault.savePlayerPrefs(this.prefs);
      if (this.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.setExternalAudioPrefs) {
        NS.audioStudio.setExternalAudioPrefs(this.prefs);
      } else if (!this.isNativePlayerActive()) {
        this.bridge.dispatchPlayerCommand(this.prefs.muted ? 'mute' : 'unMute', []);
      }
      this.mobileBgAudio?.applyPrefsToNativeAudio();
      this.emitUiSync();
    }

    async toggleAudioOnlyMode(forceState = null) {
      const next = typeof forceState === 'boolean' ? forceState : !this.prefs.audioOnlyMode;
      this.prefs.audioOnlyMode = next;
      if (this.mobileBgAudio) {
        this.mobileBgAudio._userPreSelectedBgMode = next;
      }
      this.vault.savePlayerPrefs(this.prefs);
      if (next) {
        NS.audioBackgroundBridge?.activateKeepAlive('youtube');
        const ok = await this.mobileBgAudio?.activateNativeAudioPlayback('audio-only');
        if (!ok && this.mobileBgAudio && this.activeVideo?.videoId && !this.activeVideo.isLive) {
          this.mobileBgAudio.startBgBotBlockAutoReconnect(this.activeVideo, 'audio-only', { attachVisualVideo: false });
          safeNotify('🔄 YouTube đang chặn bot Piped/Invidious — Hệ thống đang TỰ ĐỘNG kết nối lại liên tục đến khi phát nền được!', 'warning', 3200);
        } else {
          safeNotify('🎧 Đã BẬT chế độ Chỉ Audio Nền cho YouTube (tắt màn hình/thoát trình duyệt vẫn nghe khi có luồng trực tiếp).', 'success', 2600);
        }
      } else {
        this.mobileBgAudio?.stopAutoReconnectLoop?.({ silent: true });
        await this.mobileBgAudio?.pauseNativeAudioAndSyncBack(true);
        this.mobileBgAudio?.syncMediaSessionState();
        safeNotify('📺 Đã trở về chế độ Phát Video YouTube tiêu chuẩn.', 'info', 2000);
      }
      this.emitUiSync();
      return next;
    }

    toggleAlwaysBackgroundPip(forceState = null) {
      const prev = this.prefs.alwaysBackgroundPip !== false;
      const next = typeof forceState === 'boolean' ? forceState : !prev;
      this.prefs.alwaysBackgroundPip = next;
      this.vault.savePlayerPrefs(this.prefs);
      if (next) {
        NS.nativePlayer?.unlockPlaybackGesture?.();
        if (this.activeVideo?.videoId && !NS.nativePlayer?.isActive?.()) {
          this.mobileBgAudio?.upgradeActiveVideoToNativePlayer?.(this.activeVideo, { autoplay: true });
        }
        safeNotify('🔒 Đã BẬT tự động nghe nền & giữ PiP cho MỌI video (tự động duy trì khi chuyển bài).', 'success', 2800);
      } else {
        safeNotify('⏸ Đã TẮT chế độ tự động nghe nền & giữ PiP mọi video.', 'info', 2200);
      }
      this.mobileBgAudio?.syncStatusUi();
      this.emitUiSync();
      return next;
    }

    toggleRepeat() {
      if (this.isVideoLiveStream()) {
        if (this.prefs.repeatMode) {
          this.prefs.repeatMode = false;
          this.vault.savePlayerPrefs(this.prefs);
        }
        if (!this.isNativePlayerActive()) {
          this.bridge.dispatchPlayerCommand?.('setLoop', [false]);
        }
        this.emitUiSync();
        safeNotify(
          '🔒 Không thể bật Loop: Video này đang phát trực tiếp (LIVE) nên không thể lặp toàn video.',
          'warning',
          3200
        );
        return false;
      }
      this.prefs.repeatMode = !this.prefs.repeatMode;
      this.vault.savePlayerPrefs(this.prefs);
      if (this.activeEngine === 'MOD21_AUDIO' && NS.audioStudio?.setExternalAudioPrefs) {
        NS.audioStudio.setExternalAudioPrefs({
          ...this.prefs,
          abLoopEnabled: Boolean(this.abLoop?.enabled && this.isAbPairValid())
        });
      } else if (this.isNativePlayerActive()) {
        const videoEl = NS.nativePlayer?.videoEl;
        if (videoEl) {
          const abRunning = Boolean(this.abLoop?.enabled && this.isAbPairValid());
          videoEl.loop = Boolean(this.prefs.repeatMode && !abRunning);
        }
      } else if (this.activeVideo?.playlistId && !this.activeVideo?.videoId) {
        // Chỉ gửi setLoop khi đang phát danh sách phát; video đơn KHÔNG hủy / remount iframe đang chạy
        // vì onPollingTick + ENDED listener tự động tua mượt về 00:00 mà không làm đen màn hình!
        this.bridge.dispatchPlayerCommand('setLoop', [this.prefs.repeatMode]);
      }
      this.emitUiSync();
      safeNotify(
        this.prefs.repeatMode
          ? '🔁 Đã BẬT Lặp 1 Video Duy Nhất (khóa chặt video hiện tại, không nhảy bài khác).'
          : '⏹ Đã TẮT chế độ Lặp Lại video.',
        'info',
        2400
      );
      return this.prefs.repeatMode;
    }

    getKnownDurationSeconds() {
      if (this.isVideoLiveStream()) return 0;
      const snapDur = Number(this.bridge?.getCurrentPlaybackSnapshot?.()?.duration) || 0;
      const d = Math.max(0, snapDur || Number(this.bridge?.lastKnownDuration) || 0);
      return d > 0 ? Math.floor(d) : 0;
    }

    isAbPairValid() {
      if (this.isVideoLiveStream()) return false;
      if (
        typeof this.abLoop.startSec !== 'number' ||
        typeof this.abLoop.endSec !== 'number' ||
        this.abLoop.endSec - this.abLoop.startSec < MOD39_CONSTANTS.LIMITS.MIN_AB_GAP_SECONDS
      ) {
        return false;
      }
      const durSec = this.getKnownDurationSeconds();
      if (durSec > 0 && (this.abLoop.startSec >= durSec || this.abLoop.endSec > durSec)) {
        return false;
      }
      return true;
    }

    validateAbBounds(startSec, endSec) {
      if (this.isVideoLiveStream()) {
        return {
          ok: false,
          field: 'BOTH',
          code: 'LIVE_STREAM_LOCKED',
          message: 'Video đang phát trực tiếp (LIVE) nên không thể lặp 1 phần (A–B)!'
        };
      }
      const nextStart =
        startSec === null || startSec === undefined || !Number.isFinite(Number(startSec))
          ? null
          : Math.floor(Number(startSec));
      const nextEnd =
        endSec === null || endSec === undefined || !Number.isFinite(Number(endSec))
          ? null
          : Math.floor(Number(endSec));

      if (startSec !== null && startSec !== undefined && (nextStart === null || nextStart < 0)) {
        return {
          ok: false,
          field: 'A',
          code: 'INVALID_A',
          message: 'Mốc A không hợp lệ (không được nhỏ hơn 00:00).'
        };
      }
      if (endSec !== null && endSec !== undefined && (nextEnd === null || nextEnd < 0)) {
        return {
          ok: false,
          field: 'B',
          code: 'INVALID_B',
          message: 'Mốc B không hợp lệ (không được nhỏ hơn 00:00).'
        };
      }

      const durSec = this.getKnownDurationSeconds();
      if (durSec > 0) {
        if (nextStart !== null && nextStart > durSec) {
          return {
            ok: false,
            field: 'A',
            code: 'A_EXCEEDS_DURATION',
            message: `Mốc A (${formatSecondsToClock(nextStart)}) vượt quá thời lượng video (${formatSecondsToClock(durSec)}). Vui lòng chọn lại!`
          };
        }
        if (nextEnd !== null && nextEnd > durSec) {
          return {
            ok: false,
            field: 'B',
            code: 'B_EXCEEDS_DURATION',
            message: `Mốc B (${formatSecondsToClock(nextEnd)}) vượt quá thời lượng video (${formatSecondsToClock(durSec)}). Vui lòng chọn lại!`
          };
        }
        if (nextStart !== null && durSec >= 1 && nextStart >= durSec) {
          return {
            ok: false,
            field: 'A',
            code: 'A_AT_END_OF_DURATION',
            message: `Mốc A (${formatSecondsToClock(nextStart)}) phải nhỏ hơn thời lượng video (${formatSecondsToClock(durSec)}) để Mốc B còn nằm sau Mốc A. Vui lòng chọn lại!`
          };
        }
      }

      if (nextStart !== null && nextEnd !== null) {
        if (nextStart === nextEnd) {
          return {
            ok: false,
            field: 'BOTH',
            code: 'A_EQUALS_B',
            message: `Mốc A (${formatSecondsToClock(nextStart)}) đang bằng Mốc B (${formatSecondsToClock(nextEnd)}). Mốc thời gian A phải ở trước mốc thời gian của B — vui lòng chọn lại!`
          };
        }
        if (nextStart > nextEnd) {
          return {
            ok: false,
            field: 'BOTH',
            code: 'A_AFTER_B',
            message: `Mốc A (${formatSecondsToClock(nextStart)}) đang vượt quá Mốc B (${formatSecondsToClock(nextEnd)}). Mốc thời gian A phải ở trước mốc thời gian của B — vui lòng chọn lại!`
          };
        }
        if (nextEnd - nextStart < MOD39_CONSTANTS.LIMITS.MIN_AB_GAP_SECONDS) {
          return {
            ok: false,
            field: 'BOTH',
            code: 'GAP_TOO_SMALL',
            message: `Mốc B phải cách Mốc A ít nhất ${MOD39_CONSTANTS.LIMITS.MIN_AB_GAP_SECONDS} giây (A phải ở trước B). Vui lòng chọn lại!`
          };
        }
      }

      return { ok: true, startSec: nextStart, endSec: nextEnd };
    }

    _reconcileAbBoundsWithDuration(rawDuration) {
      if (this.isVideoLiveStream()) return false;
      const durSec = Math.floor(Number(rawDuration) || 0);
      if (!Number.isFinite(durSec) || durSec <= 0) return false;
      const curA = this.abLoop?.startSec;
      const curB = this.abLoop?.endSec;
      let changed = false;
      let nextA = typeof curA === 'number' ? curA : null;
      let nextB = typeof curB === 'number' ? curB : null;
      if (nextB !== null && nextB > durSec) {
        nextB = null;
        changed = true;
      }
      if (nextA !== null && (nextA > durSec || (durSec >= 1 && nextA >= durSec))) {
        nextA = null;
        changed = true;
      }
      if (!changed) return false;
      this.abLoop = { startSec: nextA, endSec: nextB, enabled: false };
      this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };
      this._abValidationState = {
        type: 'error',
        field: 'BOTH',
        message: `Mốc A–B đã đặt trước đó vượt quá thời lượng video (${formatSecondsToClock(durSec)}). Hệ thống đã bỏ mốc quá giới hạn để bạn chọn lại.`
      };
      if (this.activeVideo) {
        this.vault.saveAbLoopForVideo(this.activeVideo.key, this.abLoop);
      }
      safeNotify(`⚠️ ${this._abValidationState.message}`, 'warning', 3200);
      this.emitUiSync();
      return true;
    }

    _enforceAbLoopIfNeeded(currentTime, duration, stateCode) {
      if (
        this.isVideoLiveStream() ||
        !this.activeVideo ||
        !this.abLoop?.enabled ||
        !this.isAbPairValid()
      ) {
        this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };
        return false;
      }
      const cur = Number(currentTime);
      if (!Number.isFinite(cur) || cur < 0) return false;

      const isActivelyPlaying =
        stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
        stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.BUFFERING ||
        (stateCode === MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED && Boolean(this.bridge.assumedAutoplaying));
      if (!isActivelyPlaying) return false;

      const startSec = this.abLoop.startSec;
      const endSec = this.abLoop.endSec;
      const dur = Math.max(0, Number(duration) || 0);
      const effectiveEndSec =
        dur > 1 && endSec >= dur - 0.35 ? Math.max(startSec + 0.5, dur - 0.35) : endSec;

      const now = Date.now();
      const segLen = Math.max(1, endSec - startSec);
      const js = this._abLoopJumpState || {
        active: false,
        atMs: 0,
        startSec: 0,
        settled: false,
        fromCur: null
      };
      const fromWasPastEnd =
        typeof js.fromCur === 'number' && js.fromCur >= effectiveEndSec - 0.1;

      if (js.active && !js.settled) {
        const landedInWindow =
          segLen <= 2
            ? cur >= startSec - 0.25 && cur < Math.min(effectiveEndSec - 0.08, startSec + segLen * 0.85)
            : cur >= startSec - 0.45 && cur < effectiveEndSec - 0.2;
        if (landedInWindow) {
          js.settled = true;
        } else if (fromWasPastEnd && now - js.atMs < 700) {
          return false;
        }
      }

      const crossedEnd = cur >= effectiveEndSec - 0.03;
      const farBeforeStart = startSec > 0 && cur < startSec - 1;
      if (!crossedEnd && !farBeforeStart) return false;
      if (fromWasPastEnd && !js.settled && now - js.atMs < 220) return false;

      this.lastLoopJumpAtMs = now;
      this._abLoopJumpState = {
        active: true,
        atMs: now,
        startSec,
        settled: false,
        fromCur: cur
      };
      this.seekToSeconds(startSec, true);
      if (stateCode !== MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING) {
        if (this.activeEngine === 'MOD21_AUDIO') {
          this.play();
        } else {
          this.bridge.dispatchPlayerCommand('playVideo', []);
        }
      }
      return true;
    }

    markPointAFromCurrent() {
      if (this.isVideoLiveStream()) {
        this._abValidationState = {
          type: 'warning',
          field: 'BOTH',
          message: 'Video đang phát trực tiếp (LIVE) nên không thể đặt Mốc A hoặc lặp 1 phần (A–B)!'
        };
        safeNotify(
          '🔒 Video đang phát trực tiếp (LIVE) nên không thể đặt Mốc A hoặc lặp 1 phần!',
          'warning',
          3200
        );
        this.emitUiSync();
        return false;
      }
      this.bridge.ensureBridgeConnected(this.prefs);
      const snap = this.bridge.getCurrentPlaybackSnapshot();
      const knownDur = this.getKnownDurationSeconds();
      let sec = Math.max(0, Math.floor(snap.currentTime));
      if (knownDur > 0 && sec > knownDur) sec = knownDur;
      const res = this.setAbLoopBounds(sec, this.abLoop.endSec, this.abLoop.enabled, {
        confirmField: 'A'
      });
      if (!res.ok) return false;
      safeNotify(`🅰️ Đã đặt & xác nhận Mốc A tại ${formatSecondsToClock(sec)}`, 'success', 2000);
      return true;
    }

    markPointBFromCurrent() {
      if (this.isVideoLiveStream()) {
        this._abValidationState = {
          type: 'warning',
          field: 'BOTH',
          message: 'Video đang phát trực tiếp (LIVE) nên không thể đặt Mốc B hoặc lặp 1 phần (A–B)!'
        };
        safeNotify(
          '🔒 Video đang phát trực tiếp (LIVE) nên không thể đặt Mốc B hoặc lặp 1 phần!',
          'warning',
          3200
        );
        this.emitUiSync();
        return false;
      }
      this.bridge.ensureBridgeConnected(this.prefs);
      const snap = this.bridge.getCurrentPlaybackSnapshot();
      const knownDur = this.getKnownDurationSeconds();
      let sec = Math.max(0, Math.floor(snap.currentTime));
      if (knownDur > 0 && sec > knownDur) sec = knownDur;
      const canAutoEnable =
        typeof this.abLoop.startSec === 'number' &&
        sec - this.abLoop.startSec >= MOD39_CONSTANTS.LIMITS.MIN_AB_GAP_SECONDS;
      const res = this.setAbLoopBounds(this.abLoop.startSec, sec, canAutoEnable || this.abLoop.enabled, {
        confirmField: 'B'
      });
      if (!res.ok) return false;
      if (this.abLoop.enabled && this.isAbPairValid()) {
        const preJumpCur = Number(this.bridge.getCurrentPlaybackSnapshot().currentTime) || 0;
        this._abLoopJumpState = {
          active: true,
          atMs: Date.now(),
          startSec: this.abLoop.startSec,
          settled: false,
          fromCur: preJumpCur
        };
        this.seekToSeconds(this.abLoop.startSec, true);
        this.play();
        safeNotify(
          `🅱️ Đã đặt Mốc B tại ${formatSecondsToClock(sec)} & TỰ BẬT Vòng Lặp A–B (${formatSecondsToClock(this.abLoop.startSec)} ➔ ${formatSecondsToClock(sec)})!`,
          'success',
          2400
        );
      } else {
        safeNotify(`🅱️ Đã đặt & xác nhận Mốc B tại ${formatSecondsToClock(sec)}`, 'info', 2000);
      }
      return true;
    }

    setAbLoopBounds(startSec, endSec, forceEnabled = null, options = {}) {
      const check = this.validateAbBounds(startSec, endSec);
      if (!check.ok) {
        if (!options.silentError) {
          this._abValidationState = {
            type: 'error',
            field: check.field,
            message: check.message
          };
          safeNotify(`❌ ${check.message}`, 'error', 3600);
          this.emitUiSync();
        }
        return check;
      }

      const nextStart = check.startSec;
      const nextEnd = check.endSec;
      let enabled = forceEnabled !== null ? Boolean(forceEnabled) : Boolean(this.abLoop.enabled);
      if (
        enabled &&
        (nextStart === null ||
          nextEnd === null ||
          nextEnd - nextStart < MOD39_CONSTANTS.LIMITS.MIN_AB_GAP_SECONDS)
      ) {
        enabled = false;
      }

      this.abLoop = { startSec: nextStart, endSec: nextEnd, enabled };
      this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };

      if (options.confirmField === 'A' && nextStart !== null) {
        this._abValidationState = {
          type: 'success',
          field: 'A',
          message:
            nextEnd !== null
              ? `Đã xác nhận Mốc A = ${formatSecondsToClock(nextStart)} • Đoạn lặp: ${formatSecondsToClock(nextStart)} ➔ ${formatSecondsToClock(nextEnd)} (${nextEnd - nextStart}s)`
              : `Đã xác nhận Mốc A = ${formatSecondsToClock(nextStart)} — hãy chọn tiếp Mốc B`
        };
      } else if (options.confirmField === 'B' && nextEnd !== null) {
        this._abValidationState = {
          type: 'success',
          field: 'B',
          message:
            nextStart !== null
              ? `Đã xác nhận Mốc B = ${formatSecondsToClock(nextEnd)} • Đoạn lặp: ${formatSecondsToClock(nextStart)} ➔ ${formatSecondsToClock(nextEnd)} (${nextEnd - nextStart}s)`
              : `Đã xác nhận Mốc B = ${formatSecondsToClock(nextEnd)} — hãy chọn tiếp Mốc A`
        };
      } else {
        this._abValidationState = null;
      }

      if (this.activeVideo) {
        this.vault.saveAbLoopForVideo(this.activeVideo.key, this.abLoop);
      }
      this.mobileBgAudio?.applyPrefsToNativeAudio?.();

      if (this.abLoop.enabled && this.isAbPairValid()) {
        const snap = this.bridge.getCurrentPlaybackSnapshot();
        const isPlayingNow =
          snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
          snap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.BUFFERING;
        if (isPlayingNow && (snap.currentTime < nextStart || snap.currentTime >= nextEnd)) {
          this.seekToSeconds(nextStart, true);
        }
      }

      this.emitUiSync();
      return { ok: true, abLoop: this.abLoop };
    }

    toggleAbLoop() {
      if (this.isVideoLiveStream()) {
        this.abLoop = { startSec: null, endSec: null, enabled: false };
        this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };
        this._abValidationState = {
          type: 'warning',
          field: 'BOTH',
          message: 'Video đang phát trực tiếp (LIVE) nên không thể bật Lặp 1 phần (A–B)!'
        };
        safeNotify(
          '🔒 Video đang phát trực tiếp (LIVE) nên không thể bật Lặp 1 phần (A–B)!',
          'warning',
          3200
        );
        this.emitUiSync();
        return false;
      }
      this.bridge.ensureBridgeConnected(this.prefs);
      if (!this.isAbPairValid()) {
        const check = this.validateAbBounds(this.abLoop.startSec, this.abLoop.endSec);
        const msg = !check.ok
          ? check.message
          : 'Hãy chọn đủ Mốc A và Mốc B hợp lệ (Mốc A phải ở trước Mốc B và không vượt quá thời lượng video)!';
        this._abValidationState = { type: 'error', field: check.field || 'BOTH', message: msg };
        safeNotify(`⚠️ ${msg}`, 'warning', 3200);
        this.emitUiSync();
        return false;
      }
      this.abLoop.enabled = !this.abLoop.enabled;
      this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };
      if (this.activeVideo) {
        this.vault.saveAbLoopForVideo(this.activeVideo.key, this.abLoop);
      }
      if (this.abLoop.enabled) {
        this._abValidationState = {
          type: 'success',
          field: 'BOTH',
          message: `Đang bật lặp đoạn ${formatSecondsToClock(this.abLoop.startSec)} ➔ ${formatSecondsToClock(this.abLoop.endSec)} (${this.abLoop.endSec - this.abLoop.startSec}s)`
        };
        const preJumpCur = Number(this.bridge.getCurrentPlaybackSnapshot().currentTime) || 0;
        this._abLoopJumpState = {
          active: true,
          atMs: Date.now(),
          startSec: this.abLoop.startSec,
          settled: false,
          fromCur: preJumpCur
        };
        this.seekToSeconds(this.abLoop.startSec, true);
        this.play();
        safeNotify(
          `🔁 Đang lặp đoạn A–B (${formatSecondsToClock(this.abLoop.startSec)} ➔ ${formatSecondsToClock(
            this.abLoop.endSec
          )})`,
          'success',
          2400
        );
      } else {
        this._abValidationState = null;
        safeNotify('⏹ Đã tạm tắt Vòng Lặp A–B.', 'info', 1800);
      }
      this.mobileBgAudio?.applyPrefsToNativeAudio?.();
      this.emitUiSync();
      return true;
    }

    clearAbLoop() {
      if (this.isVideoLiveStream()) {
        this.abLoop = { startSec: null, endSec: null, enabled: false };
        this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };
        this._abValidationState = {
          type: 'warning',
          field: 'BOTH',
          message: 'Video đang phát trực tiếp (LIVE) — Tính năng Lặp 1 phần (A–B) đang được khóa.'
        };
        safeNotify(
          '🔒 Video đang phát trực tiếp (LIVE) — Tính năng Lặp 1 phần (A–B) đang được khóa.',
          'info',
          2200
        );
        this.emitUiSync();
        return false;
      }
      this.abLoop = { startSec: null, endSec: null, enabled: false };
      this._abLoopJumpState = { active: false, atMs: 0, startSec: 0, settled: false };
      this._abValidationState = null;
      if (this.activeVideo) {
        this.vault.saveAbLoopForVideo(this.activeVideo.key, this.abLoop);
      }
      this.mobileBgAudio?.applyPrefsToNativeAudio?.();
      this.emitUiSync();
      safeNotify('🧹 Đã xóa mốc A–B cho video hiện tại.', 'info', 1800);
    }

    async toggleFullscreen() {
      if (typeof document === 'undefined') return false;
      const stageEl = document.getElementById('mod39-player-stage-wrapper');
      if (!stageEl) return false;

      const fsEl =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement;

      if (fsEl) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } catch (_e) {}
        stageEl.classList.remove('mod39-pseudo-fullscreen');
        this.isPseudoFullscreen = false;
        this.emitUiSync();
        return true;
      }

      if (this.isPseudoFullscreen) {
        stageEl.classList.remove('mod39-pseudo-fullscreen');
        this.isPseudoFullscreen = false;
        this.emitUiSync();
        return true;
      }

      try {
        if (stageEl.requestFullscreen) {
          await stageEl.requestFullscreen();
          this.emitUiSync();
          return true;
        }
        if (stageEl.webkitRequestFullscreen) {
          stageEl.webkitRequestFullscreen();
          this.emitUiSync();
          return true;
        }
      } catch (_err) {
        // Bị chặn Fullscreen API (ví dụ iOS Safari hoặc chế độ headless): dùng Pseudo-Fullscreen mượt mà!
      }

      stageEl.classList.add('mod39-pseudo-fullscreen');
      this.isPseudoFullscreen = true;
      this.emitUiSync();
      safeNotify('🖥️ Đã bật Toàn Màn Hình Tối Đa trong khung trình duyệt (bấm ESC hoặc Thu Nhỏ để thoát).', 'info', 2600);
      return true;
    }
  }

  // ==========================================================================
  // 6. SÂN KHẤU VIDEO YOUTUBE LÀM BACKGROUND WEB (TƯƠNG THÍCH MODULE 32)
  // ==========================================================================
  class YouTubeWebBackgroundStageCoordinator {
    constructor(parser, vault, bridge = null) {
      this.parser = parser;
      this.vault = vault;
      this.bridge = bridge;
      this.state = this.vault.loadWebBgState();
      this.hasWrappedMod32 = false;
      this.layerId = 'mod39-youtube-bg-layer';
      this.iframeId = 'mod39-youtube-bg-iframe';
      this.styleId = 'mod39-stage-dynamic-styles';
      this.peekBtnId = 'btn-mod39-exit-peek-floating';
      this.bgYtPlayer = null;
      this.resizeBound = false;
      this.uiSyncCallback = null;
    }

    setUiSyncCallback(fn) {
      this.uiSyncCallback = typeof fn === 'function' ? fn : null;
    }

    init() {
      // Nếu Module 40 đã sẵn sàng tiếp quản sân khấu nền chuyển động 16:9,
      // không chèn #mod39-stage-dynamic-styles hay nạp video nền cũ của Mod 39 gây lệch góc / đè video cũ.
      if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.applyWebBackground === 'function') {
        const legacyStyle =
          typeof document !== 'undefined' ? document.getElementById(this.styleId) : null;
        if (legacyStyle) {
          try {
            legacyStyle.remove();
          } catch (_e) {}
        }
        return;
      }

      this.injectStageCss();
      this.ensureBgLayerMounted();
      this.wrapMod32ForceSyncSafely();
      this.bindViewportResizeCover();

      const savedVis = Number(safeStorageGet('noir_v36_ambient_visibility_pct', '68'));
      this.applyUiGlassTransparency(savedVis, false);

      if (this.state.enabled && (this.state.videoId || this.state.playlistId)) {
        this.applyWebBackground(this.state, false);
      }
    }

    injectStageCss() {
      if (typeof document === 'undefined' || !document.head) return;
      let styleEl = document.getElementById(this.styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = this.styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.textContent = `
        /* Mod 39: Sân khấu YouTube Background Web, Kính Mờ 6 Tab & Pseudo-Fullscreen */
        #mod39-youtube-bg-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        #mod39-youtube-bg-layer.hidden {
          display: none !important;
        }
        #mod39-youtube-bg-iframe {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(1.06);
          border: 0;
          pointer-events: none;
          will-change: filter;
          transition: filter 0.2s ease;
        }
        /* Gỡ lớp màng tối phụ #ambient-frosted-shield khi YouTube Background bật để nút Opacity/Brightness ăn chuẩn 100% */
        body.mod39-yt-bg-active #ambient-frosted-shield {
          background-color: transparent !important;
          background-image: none !important;
        }
        body.mod39-yt-bg-active #app-shell,
        body.mod39-yt-bg-active main,
        body.mod39-yt-bg-active section {
          position: relative;
        }
        /* Ép toàn bộ 6 Tab & thẻ nền trong suốt theo thanh trượt Xuyên Thấu (Dark Mode + Light Mode) */
        html.dark body.mod39-yt-bg-active #s14-master-top-nav,
        html.dark body.mod39-yt-bg-active #mobile-bottom-nav-bar,
        html.dark body.mod39-yt-bg-active #left-sidebar-pane,
        html.dark body.mod39-yt-bg-active #center-editor-pane,
        html.dark body.mod39-yt-bg-active #pane-left-beats,
        html.dark body.mod39-yt-bg-active #pane-right-manuscript,
        html.dark body.mod39-yt-bg-active #mode5-plot-diagram-studio,
        html.dark body.mod39-yt-bg-active #right-bible-pane,
        html.dark body.mod39-yt-bg-active #s14-screen-5-ambience,
        html.dark body.mod39-yt-bg-active #s14-screen-6-system,
        html.dark body.mod39-yt-bg-active #tab3-unified-output-topbar {
          background-color: rgba(8, 12, 20, var(--noir-ambient-pane-dark, 0.22)) !important;
          background-image: none !important;
        }
        html.dark body.mod39-yt-bg-active #s14-screen-5-ambience .rounded-2xl:not(select):not(button),
        html.dark body.mod39-yt-bg-active #s14-screen-5-ambience .rounded-xl:not(select):not(button):not(input):not(a),
        html.dark body.mod39-yt-bg-active #tab5-quick-controls-bar,
        html.dark body.mod39-yt-bg-active #tab5-youtube-big-card,
        html.dark body.mod39-yt-bg-active #s14-card-youtube-btn,
        html.dark body.mod39-yt-bg-active #right-bible-pane .rounded-2xl:not(select):not(button),
        html.dark body.mod39-yt-bg-active #s14-screen-6-system .rounded-2xl:not(select):not(button),
        html.dark body.mod39-yt-bg-active #center-editor-pane .rounded-2xl:not(select):not(button),
        html.dark body.mod39-yt-bg-active #pane-left-beats .rounded-2xl:not(select):not(button),
        html.dark body.mod39-yt-bg-active #left-sidebar-pane .rounded-2xl:not(select):not(button),
        html.dark body.mod39-yt-bg-active #pane-right-manuscript textarea,
        html.dark body.mod39-yt-bg-active #tab3-standard-output-wrapper textarea {
          background-color: rgba(12, 17, 27, var(--noir-ambient-card-dark, 0.38)) !important;
          background-image: none !important;
          backdrop-filter: blur(var(--mod32-stage-blur, 5px)) !important;
        }
        /* Không chồng 2 lớp mờ bên trong Ô Lớn #5 để nhìn thẳng xuống Video Background */
        html.dark body.mod39-yt-bg-active #s14-panel-youtube-box,
        html:not(.dark) body.mod39-yt-bg-active #s14-panel-youtube-box {
          background-color: transparent !important;
          background-image: none !important;
          backdrop-filter: none !important;
        }
        /* Chế độ Light Mode (html:not(.dark)) cũng trong suốt kính mờ đồng bộ */
        html:not(.dark) body.mod39-yt-bg-active #s14-master-top-nav,
        html:not(.dark) body.mod39-yt-bg-active #mobile-bottom-nav-bar,
        html:not(.dark) body.mod39-yt-bg-active #left-sidebar-pane,
        html:not(.dark) body.mod39-yt-bg-active #center-editor-pane,
        html:not(.dark) body.mod39-yt-bg-active #pane-left-beats,
        html:not(.dark) body.mod39-yt-bg-active #pane-right-manuscript,
        html:not(.dark) body.mod39-yt-bg-active #mode5-plot-diagram-studio,
        html:not(.dark) body.mod39-yt-bg-active #right-bible-pane,
        html:not(.dark) body.mod39-yt-bg-active #s14-screen-5-ambience,
        html:not(.dark) body.mod39-yt-bg-active #s14-screen-6-system,
        html:not(.dark) body.mod39-yt-bg-active #tab3-unified-output-topbar {
          background-color: rgba(248, 250, 252, var(--noir-ambient-pane-light, 0.30)) !important;
          background-image: none !important;
        }
        html:not(.dark) body.mod39-yt-bg-active #s14-screen-5-ambience .rounded-2xl:not(select):not(button),
        html:not(.dark) body.mod39-yt-bg-active #s14-screen-5-ambience .rounded-xl:not(select):not(button):not(input):not(a),
        html:not(.dark) body.mod39-yt-bg-active #tab5-quick-controls-bar,
        html:not(.dark) body.mod39-yt-bg-active #tab5-youtube-big-card,
        html:not(.dark) body.mod39-yt-bg-active #s14-card-youtube-btn,
        html:not(.dark) body.mod39-yt-bg-active #right-bible-pane .rounded-2xl:not(select):not(button),
        html:not(.dark) body.mod39-yt-bg-active #s14-screen-6-system .rounded-2xl:not(select):not(button),
        html:not(.dark) body.mod39-yt-bg-active #center-editor-pane .rounded-2xl:not(select):not(button),
        html:not(.dark) body.mod39-yt-bg-active #pane-left-beats .rounded-2xl:not(select):not(button),
        html:not(.dark) body.mod39-yt-bg-active #left-sidebar-pane .rounded-2xl:not(select):not(button),
        html:not(.dark) body.mod39-yt-bg-active #pane-right-manuscript textarea,
        html:not(.dark) body.mod39-yt-bg-active #tab3-standard-output-wrapper textarea {
          background-color: rgba(241, 245, 249, var(--noir-ambient-card-light, 0.44)) !important;
          background-image: none !important;
          backdrop-filter: blur(var(--mod32-stage-blur, 5px)) !important;
        }
        /* Soi Nền 100%: Làm mờ tạm toàn bộ khung viết/Tab 1–6 */
        body.noir-ambient-active.noir-ambient-peek-mode #s14-master-top-nav,
        body.noir-ambient-active.noir-ambient-peek-mode #mobile-bottom-nav-bar,
        body.noir-ambient-active.noir-ambient-peek-mode #left-sidebar-pane,
        body.noir-ambient-active.noir-ambient-peek-mode #center-editor-pane,
        body.noir-ambient-active.noir-ambient-peek-mode #pane-left-beats,
        body.noir-ambient-active.noir-ambient-peek-mode #pane-right-manuscript,
        body.noir-ambient-active.noir-ambient-peek-mode #mode5-plot-diagram-studio,
        body.noir-ambient-active.noir-ambient-peek-mode #right-bible-pane,
        body.noir-ambient-active.noir-ambient-peek-mode #s14-screen-5-ambience,
        body.noir-ambient-active.noir-ambient-peek-mode #s14-screen-6-system {
          opacity: 0.08 !important;
          transition: opacity 0.2s ease !important;
        }
        #mod39-player-stage-wrapper.mod39-pseudo-fullscreen {
          position: fixed !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100dvh !important;
          height: calc(var(--studio-vh, 1dvh) * 100) !important;
          max-width: none !important;
          z-index: 9500 !important;
          border-radius: 0 !important;
          background: #020408 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
        }
        #mod39-bg-hint-ribbon {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(69, 26, 3, 0.45);
          border: 1px solid rgba(245, 158, 11, 0.5);
          box-sizing: border-box;
        }
        #btn-mod39-bg-mode-toggle {
          cursor: pointer;
          white-space: nowrap;
        }
        @media (min-width: 1024px) {
          #mod39-bg-hint-ribbon,
          #btn-mod39-bg-mode-toggle {
            display: none !important;
          }
        }
        #mod39-player-stage-wrapper.mod39-pseudo-fullscreen .mod39-stage-exit-pseudo-btn {
          display: inline-flex !important;
        }
        @keyframes mod39SoftBgTogglePulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.35), 0 4px 12px rgba(0, 0, 0, 0.25);
          }
          50% {
            opacity: 0.86;
            box-shadow: 0 0 0 5px rgba(251, 191, 36, 0.14), 0 0 14px rgba(251, 191, 36, 0.28);
          }
        }
        .mod39-bg-toggle-blink {
          animation: mod39SoftBgTogglePulse 2.1s ease-in-out infinite;
        }
        @keyframes mod39StatusAlertPulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.45), 0 4px 14px rgba(0, 0, 0, 0.3);
            border-color: rgba(251, 191, 36, 0.85);
          }
          50% {
            opacity: 0.84;
            box-shadow: 0 0 0 6px rgba(251, 191, 36, 0.16), 0 0 16px rgba(251, 191, 36, 0.35);
            border-color: rgba(252, 211, 77, 1);
          }
        }
        .mod39-status-alert-blink {
          animation: mod39StatusAlertPulse 1.75s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mod39-bg-toggle-blink,
          .mod39-status-alert-blink {
            animation: none;
          }
        }
      `;
    }

    ensureBgLayerMounted() {
      if (typeof document === 'undefined') return null;
      let layer = document.getElementById(this.layerId);
      if (layer) return layer;

      const backdropLayer = document.getElementById('ambient-backdrop-layer');
      if (!backdropLayer) return null;

      layer = document.createElement('div');
      layer.id = this.layerId;
      layer.className = 'hidden';

      const artCanvas = document.getElementById('mod32-procedural-art-canvas');
      const particleCanvas = document.getElementById('ambient-bg-canvas');
      const anchor = artCanvas || particleCanvas;
      if (anchor && anchor.parentElement === backdropLayer) {
        backdropLayer.insertBefore(layer, anchor);
      } else {
        backdropLayer.appendChild(layer);
      }

      this.updateCoverIframeGeometry();
      return layer;
    }

    /**
     * Tính toán kích thước iframe 16:9 sao cho luôn phủ kín 100% khung nhìn
     * cả trên màn hình siêu rộng 21:9 lẫn điện thoại dọc 390x844 mà không hở viền đen.
     */
    updateCoverIframeGeometry() {
      if (typeof document === 'undefined' || typeof global === 'undefined') return;
      const iframe = document.getElementById(this.iframeId);
      if (!iframe) return;

      const vw = Math.max(320, global.innerWidth || document.documentElement?.clientWidth || 1280);
      const vh = Math.max(320, global.innerHeight || document.documentElement?.clientHeight || 720);
      const targetRatio = 16 / 9;
      const viewportRatio = vw / vh;

      let coverW;
      let coverH;
      if (viewportRatio >= targetRatio) {
        coverW = vw;
        coverH = Math.ceil(vw / targetRatio);
      } else {
        coverH = vh;
        coverW = Math.ceil(vh * targetRatio);
      }

      iframe.style.width = `${coverW}px`;
      iframe.style.height = `${coverH}px`;
    }

    bindViewportResizeCover() {
      if (this.resizeBound || typeof global.addEventListener !== 'function') return;
      this.resizeBound = true;
      global.addEventListener('resize', () => {
        this.updateCoverIframeGeometry();
      });
    }

    /**
     * Đóng gói an toàn hàm `forceSyncAmbientBodyClass()` của Module 32 để khi
     * nền YouTube đang bật, lớp kính mờ `noir-ambient-active` không bao giờ bị gỡ nhầm!
     */
    wrapMod32ForceSyncSafely() {
      if (this.hasWrappedMod32) return;
      const compositor = NS.ambientStage && NS.ambientStage.stageCompositor;
      if (!compositor || typeof compositor.forceSyncAmbientBodyClass !== 'function') {
        return;
      }
      this.hasWrappedMod32 = true;
      const origForceSync = compositor.forceSyncAmbientBodyClass.bind(compositor);
      const self = this;

      compositor.forceSyncAmbientBodyClass = function wrappedMod39AmbientSync() {
        origForceSync();
        if (self.isWebBackgroundActive()) {
          document.body?.classList?.add('noir-ambient-active');
          document.body?.classList?.add('mod39-yt-bg-active');
        } else {
          document.body?.classList?.remove('mod39-yt-bg-active');
        }
      };
    }

    isWebBackgroundActive() {
      if (typeof document === 'undefined') return Boolean(this.state.enabled);
      const layer = document.getElementById(this.layerId);
      const iframe = document.getElementById(this.iframeId);
      return Boolean(
        this.state.enabled &&
          layer &&
          !layer.classList.contains('hidden') &&
          iframe &&
          iframe.getAttribute('src')
      );
    }

    attachBgYtPlayerApi() {
      if (typeof document === 'undefined' || !this.bridge) return;
      const iframe = document.getElementById(this.iframeId);
      if (!iframe) return;

      try {
        this.bridge.sendRawPostMessageToIframe(iframe, { event: 'listening', id: 2 });
      } catch (_e) {}

      this.bridge.loadYoutubeIframeApiScript().then((ready) => {
        if (!ready || !global.YT || typeof global.YT.Player !== 'function') return;
        const currentIframe = document.getElementById(this.iframeId);
        if (!currentIframe || !this.isWebBackgroundActive()) return;

        if (this.bgYtPlayer && typeof this.bgYtPlayer.destroy === 'function') {
          try {
            this.bgYtPlayer.destroy();
          } catch (_e) {}
          this.bgYtPlayer = null;
        }

        try {
          this.bgYtPlayer = new global.YT.Player(this.iframeId, {
            events: {
              onReady: (ev) => {
                try {
                  ev.target.setLoop?.(true);
                  if (this.state.allowBgSound) {
                    const vol = Math.max(25, this.state.bgVolume || 50);
                    ev.target.unMute?.();
                    ev.target.setVolume?.(vol);
                  } else {
                    ev.target.mute?.();
                  }
                  ev.target.playVideo?.();
                } catch (_err) {}
              },
              onStateChange: (ev) => {
                if (ev.data === MOD39_CONSTANTS.YT_PLAYER_STATES.ENDED && this.isWebBackgroundActive()) {
                  try {
                    ev.target.seekTo?.(0, true);
                    ev.target.playVideo?.();
                  } catch (_err) {}
                }
              },
              onError: (ev) => {
                const code = ev ? ev.data : null;
                if (code && this.bridge) {
                  this.bridge.lastErrorCode = code;
                  this.bridge.emit('onError', code);
                }
              }
            }
          });
        } catch (_err) {}
      });
    }

    applyUiGlassTransparency(visPct, persist = true) {
      const clamped = clampNumber(visPct, 15, 95, 68);
      const darkPaneAlpha = Math.max(0.06, Math.min(0.78, 0.92 - (clamped * 0.9) / 100)).toFixed(2);
      const darkCardAlpha = Math.max(0.14, Math.min(0.86, 0.98 - (clamped * 0.88) / 100)).toFixed(2);
      const lightPaneAlpha = Math.max(0.10, Math.min(0.84, 0.96 - (clamped * 0.9) / 100)).toFixed(2);
      const lightCardAlpha = Math.max(0.18, Math.min(0.90, 1.0 - (clamped * 0.86) / 100)).toFixed(2);

      if (NS.ambientStage?.stageCompositor?.applyVisibilitySettings) {
        try {
          NS.ambientStage.stageCompositor.applyVisibilitySettings(clamped, persist);
        } catch (_e) {}
      } else if (persist) {
        safeStorageSet('noir_v36_ambient_visibility_pct', clamped);
      }

      if (typeof document !== 'undefined' && document.documentElement) {
        const rootStyle = document.documentElement.style;
        rootStyle.setProperty('--noir-ambient-pane-dark', darkPaneAlpha);
        rootStyle.setProperty('--noir-ambient-card-dark', darkCardAlpha);
        rootStyle.setProperty('--noir-ambient-pane-light', lightPaneAlpha);
        rootStyle.setProperty('--noir-ambient-card-light', lightCardAlpha);
      }
      return clamped;
    }

    syncFloatingPeekExitButton() {
      if (typeof document === 'undefined' || !document.body) return;
      const isPeeking = document.body.classList.contains('noir-ambient-peek-mode');
      let btn = document.getElementById(this.peekBtnId);
      if (!isPeeking) {
        if (btn) btn.classList.add('hidden');
        return;
      }
      if (!btn) {
        btn = document.createElement('button');
        btn.id = this.peekBtnId;
        btn.type = 'button';
        btn.className =
          'fixed top-3 right-3 z-[9400] px-4 py-2 rounded-xl bg-zinc-950/90 hover:bg-cyan-600 text-white border border-cyan-400/70 font-extrabold text-xs shadow-2xl transition';
        btn.textContent = '✨ Hiện Lại Giao Diện Viết Truyện';
        btn.addEventListener('click', () => {
          document.body?.classList?.remove('noir-ambient-peek-mode');
          this.syncFloatingPeekExitButton();
          safeNotify('✨ Đã khôi phục độ rõ giao diện.', 'info', 1800);
        });
        document.body.appendChild(btn);
      }
      btn.classList.remove('hidden');
    }

    applyWebBackground(videoPayload, showToast = true) {
      if (!videoPayload || (!videoPayload.videoId && !videoPayload.playlistId)) {
        if (showToast) {
          safeNotify('⚠️ Hãy tìm chọn hoặc dán một video YouTube trước khi cài làm hình nền!', 'warning');
        }
        return false;
      }

      const layer = this.ensureBgLayerMounted();
      if (!layer) return false;

      // Dọn các lớp nền SVG/Ảnh tĩnh cũ để YouTube background hiển thị trọn vẹn sắc nét
      try {
        NS.ambientStage?.artPainter?.clear?.();
        const bgImg = document.getElementById('ambient-bg-image');
        if (bgImg) {
          bgImg.classList.add('hidden');
          bgImg.removeAttribute('src');
        }
        const bgVid = document.getElementById('ambient-bg-video');
        if (bgVid) {
          bgVid.pause?.();
          bgVid.classList.add('hidden');
          bgVid.removeAttribute('src');
        }
      } catch (_e) {}

      this.state = {
        ...this.state,
        enabled: true,
        videoKey:
          videoPayload.key ||
          videoPayload.videoKey ||
          (videoPayload.videoId ? `vid:${videoPayload.videoId}` : `pl:${videoPayload.playlistId}`),
        videoId: videoPayload.videoId || null,
        playlistId: videoPayload.playlistId || null,
        watchUrl: videoPayload.watchUrl || null,
        title: videoPayload.title || 'Video Nền YouTube'
      };

      const bgEmbedUrl = this.parser.buildPrivacyEmbedUrl({
        videoId: this.state.videoId,
        playlistId: this.state.playlistId,
        startSeconds: 0,
        autoplay: true,
        loop: true,
        muted: !this.state.allowBgSound,
        controls: false,
        forBackground: true
      });

      let iframe = document.getElementById(this.iframeId);
      const needsReload = !iframe || iframe.getAttribute('src') !== bgEmbedUrl;

      if (needsReload && this.bgYtPlayer && typeof this.bgYtPlayer.destroy === 'function') {
        try {
          this.bgYtPlayer.destroy();
        } catch (_e) {}
        this.bgYtPlayer = null;
        iframe = document.getElementById(this.iframeId);
      }

      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = this.iframeId;
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
        iframe.setAttribute('title', 'Hình Nền Video YouTube Web Viết Tiểu Thuyết Của Bi');
        layer.innerHTML = '';
        layer.appendChild(iframe);
      }

      if (needsReload) {
        iframe.onload = () => {
          this.attachBgYtPlayerApi();
        };
        iframe.setAttribute('src', bgEmbedUrl);
      }

      layer.classList.remove('hidden');
      this.updateCoverIframeGeometry();

      const savedVis = Number(
        (typeof document !== 'undefined' && document.getElementById('slider-mod39-ui-glass')?.value) ||
          safeStorageGet('noir_v36_ambient_visibility_pct', '68')
      );
      this.applyUiGlassTransparency(savedVis, false);

      this.applyVisualFilters(
        this.state.opacityPct,
        this.state.blurPx,
        this.state.brightnessPct,
        false,
        false
      );

      document.body?.classList?.add('noir-ambient-active');
      document.body?.classList?.add('mod39-yt-bg-active');
      this.wrapMod32ForceSyncSafely();
      this.vault.saveWebBgState(this.state);

      if (this.uiSyncCallback) this.uiSyncCallback();
      if (showToast) {
        safeNotify(
          '🌌 Đã cài Video YouTube làm Hình Nền Web! Toàn bộ thẻ 6 Tab đã tự chuyển kính mờ để nhìn xuyên xuống video.',
          'success',
          3600
        );
      }
      return true;
    }

    clearWebBackground(showToast = true) {
      this.state.enabled = false;
      this.vault.saveWebBgState(this.state);

      if (this.bgYtPlayer && typeof this.bgYtPlayer.destroy === 'function') {
        try {
          this.bgYtPlayer.destroy();
        } catch (_e) {}
        this.bgYtPlayer = null;
      }

      if (typeof document !== 'undefined') {
        const layer = document.getElementById(this.layerId);
        const iframe = document.getElementById(this.iframeId);
        if (iframe) {
          iframe.onload = null;
          iframe.removeAttribute('src');
        }
        if (layer) {
          layer.classList.add('hidden');
        }
        document.body?.classList?.remove('noir-ambient-peek-mode');
        this.syncFloatingPeekExitButton();
        document.body?.classList?.remove('mod39-yt-bg-active');
        if (NS.ambientStage?.stageCompositor?.forceSyncAmbientBodyClass) {
          NS.ambientStage.stageCompositor.forceSyncAmbientBodyClass();
        } else {
          document.body?.classList?.remove('noir-ambient-active');
        }
      }

      if (this.uiSyncCallback) this.uiSyncCallback();
      if (showToast) {
        safeNotify('🧹 Đã tắt Hình Nền Video YouTube và trả giao diện về trạng thái tiêu chuẩn.', 'info', 2400);
      }
      return true;
    }

    applyVisualFilters(opacityPct, blurPx, brightnessPct, persist = true, notifyFullUi = true) {
      this.state.opacityPct = clampNumber(opacityPct, 10, 100, MOD39_CONSTANTS.LIMITS.DEFAULT_BG_OPACITY_PCT);
      this.state.blurPx = clampNumber(blurPx, 0, 18, MOD39_CONSTANTS.LIMITS.DEFAULT_BG_BLUR_PX);
      this.state.brightnessPct = clampNumber(
        brightnessPct,
        25,
        115,
        MOD39_CONSTANTS.LIMITS.DEFAULT_BG_BRIGHTNESS_PCT
      );

      if (typeof document !== 'undefined') {
        const layer = document.getElementById(this.layerId);
        const iframe = document.getElementById(this.iframeId);
        const filterStr = `blur(${this.state.blurPx}px) brightness(${this.state.brightnessPct}%)`;
        if (layer) {
          layer.style.opacity = (this.state.opacityPct / 100).toFixed(2);
          layer.style.filter = 'none';
        }
        if (iframe) {
          iframe.style.filter = filterStr;
        }
      }

      if (persist) {
        this.vault.saveWebBgState(this.state);
      }
      if (notifyFullUi && this.uiSyncCallback) {
        this.uiSyncCallback();
      }
    }

    toggleBgSound(allowSound) {
      this.state.allowBgSound = Boolean(allowSound);
      this.vault.saveWebBgState(this.state);

      if (this.bgYtPlayer) {
        try {
          if (this.state.allowBgSound) {
            const vol = Math.max(25, this.state.bgVolume || 50);
            this.state.bgVolume = vol;
            this.bgYtPlayer.unMute?.();
            this.bgYtPlayer.setVolume?.(vol);
            this.bgYtPlayer.playVideo?.();
          } else {
            this.bgYtPlayer.mute?.();
          }
        } catch (_e) {}
      }

      const iframe = typeof document !== 'undefined' ? document.getElementById(this.iframeId) : null;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'listening', id: 2 }),
            '*'
          );
          iframe.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: this.state.allowBgSound ? 'unMute' : 'mute',
              args: []
            }),
            '*'
          );
          if (this.state.allowBgSound) {
            const vol = Math.max(25, this.state.bgVolume || 50);
            this.state.bgVolume = vol;
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }),
              '*'
            );
          }
        } catch (_e) {}
      }

      if (this.uiSyncCallback) this.uiSyncCallback();
      safeNotify(
        this.state.allowBgSound
          ? '🔊 Đã bật tiếng cho Video Background YouTube.'
          : '🔇 Đã tắt tiếng Video Background (chỉ chạy hình nền chuyển động).',
        'info',
        2000
      );
    }

    setBgVolume(volPct) {
      const vol = clampNumber(volPct, 0, 100, 40);
      this.state.bgVolume = vol;
      if (vol > 0 && !this.state.allowBgSound) {
        this.state.allowBgSound = true;
      }
      this.vault.saveWebBgState(this.state);

      const iframe = typeof document !== 'undefined' ? document.getElementById(this.iframeId) : null;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: this.state.allowBgSound ? 'unMute' : 'mute', args: [] }),
            '*'
          );
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }),
            '*'
          );
        } catch (_e) {}
      }
      if (this.uiSyncCallback) this.uiSyncCallback();
    }
  }

  // ==========================================================================
  // 7. POPUP BƯỚC 1: HƯỚNG DẪN COPY LINK YOUTUBE (PC + MOBILE) & TỰ PHÁT
  // ==========================================================================
  class YouTubeStep1GuideModalPresenter {
    constructor(parser, onValidUrlDetected) {
      this.parser = parser;
      this.onValidUrlDetected = typeof onValidUrlDetected === 'function' ? onValidUrlDetected : () => {};
      this.modalMounted = false;
      this.hasShownOnceThisSession = false;
    }

    ensureModalInDom() {
      if (typeof document === 'undefined' || !document.body) return null;
      let modal = document.getElementById(MOD39_CONSTANTS.GUIDE_MODAL_ID);
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = MOD39_CONSTANTS.GUIDE_MODAL_ID;
      modal.className =
        'hidden fixed inset-0 z-[9400] bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-5 overflow-y-auto';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'mod39-guide-modal-title');

      modal.innerHTML = `
        <div class="my-auto relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-2xl border-2 border-rose-500/55 bg-zinc-950 text-zinc-100 shadow-2xl p-4 sm:p-6 space-y-4">
          <!-- Nút dấu ✕ cố định ở góc phải trên theo yêu cầu -->
          <button
            type="button"
            id="${MOD39_CONSTANTS.GUIDE_CLOSE_BTN_ID}"
            aria-label="Đóng hướng dẫn Bước 1"
            title="Đóng bảng hướng dẫn Bước 1"
            class="absolute top-3 right-3 w-9 h-9 rounded-full bg-zinc-900 hover:bg-rose-600 border border-zinc-700 hover:border-rose-400 text-zinc-200 hover:text-white font-extrabold text-sm flex items-center justify-center transition shadow"
          >✕</button>

          <div class="pr-10 space-y-1">
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
              🎬 BƯỚC 1 / 2 • KẾT NỐI VIDEO YOUTUBE VÀO RẠP VIẾT TRUYỆN
            </div>
            <h3 id="mod39-guide-modal-title" class="text-base sm:text-lg font-extrabold text-white">
              Hướng Dẫn Copy Link YouTube (Trên Máy Tính &amp; Điện Thoại)
            </h3>
            <p class="text-xs text-zinc-400 leading-relaxed">
              Không cần đăng nhập, không mất tab viết truyện. Chỉ cần sao chép link video YouTube bạn thích rồi dán vào ô dưới — hệ thống tự động nhận diện và chuyển sang <strong class="text-emerald-300">Bước 2: Trình Phát Toàn Diện &amp; Cài Background Web</strong> ngay lập tức!
            </p>
          </div>

          <!-- Thao tác nhanh 1 chạm mở YouTube -->
          <div class="p-3.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/55 via-zinc-900 to-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="text-xs text-zinc-200 space-y-0.5">
              <div class="font-bold text-rose-300">🚀 Chưa có sẵn đường link trong khay nhớ tạm?</div>
              <div class="text-[11px] text-zinc-400">Bấm nút bên cạnh để mở trang chủ YouTube ở tab mới, tìm video muốn nghe/làm hình nền rồi copy link quay lại đây.</div>
            </div>
            <a
              id="btn-mod39-goto-youtube"
              href="${MOD39_CONSTANTS.YOUTUBE_HOME_URL}"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg flex items-center justify-center gap-1.5 transition"
            >
              <span>▶ Mở YouTube.com Ngay</span>
              <span>↗</span>
            </a>
          </div>

          <!-- Hai cột hướng dẫn song song: Máy Tính (PC) & Điện Thoại (Mobile) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 rounded-xl border border-sky-500/35 bg-sky-950/20 space-y-2">
              <div class="font-extrabold text-sky-300 flex items-center gap-1.5">
                <span>💻</span>
                <span>Cách lấy link trên Máy Tính (PC/Mac)</span>
              </div>
              <ol class="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
                <li>Bấm nút Mở YouTube.com Ngay phía trên.</li>
                <li>Mở video, nhạc lo-fi, playlist hoặc cảnh mưa 4K bạn muốn xem.</li>
                <li>Click chuột vào thanh địa chỉ trình duyệt, nhấn Ctrl + C (hoặc bấm nút Chia sẻ / Share ➔ Sao chép dưới video).</li>
                <li>Quay lại đây và dán (Ctrl + V) vào ô xanh bên dưới!</li>
              </ol>
            </div>

            <div class="p-3.5 rounded-xl border border-emerald-500/35 bg-emerald-950/20 space-y-2">
              <div class="font-extrabold text-emerald-300 flex items-center gap-1.5">
                <span>📱</span>
                <span>Cách lấy link trên Điện Thoại</span>
              </div>
              <ol class="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
                <li>Mở ứng dụng YouTube (hoặc trình duyệt) trên iPhone / Android.</li>
                <li>Chạm nút Chia sẻ (Share) nằm ngay bên dưới khung video.</li>
                <li>Chọn mục Sao chép đường dẫn (Copy link).</li>
                <li>Quay lại Tab 5 của Web Viết Tiểu Thuyết và bấm nút 📋 Dán từ Clipboard hoặc nhấn giữ vào ô nhập để Dán!</li>
              </ol>
            </div>
          </div>

          <!-- Ô dán link YouTube tự kích hoạt Bước 2 -->
          <div class="p-4 rounded-xl border-2 border-emerald-500/50 bg-zinc-900/90 space-y-2.5">
            <label for="${MOD39_CONSTANTS.GUIDE_INPUT_ID}" class="block text-xs font-extrabold text-emerald-300">
              🔗 Dán Link Video hoặc Playlist YouTube vào đây (Tự động chạy ngay Bước 2 khi link hợp lệ):
            </label>
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                id="${MOD39_CONSTANTS.GUIDE_INPUT_ID}"
                autocomplete="off"
                spellcheck="false"
                placeholder="Ví dụ: https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                class="flex-1 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-emerald-400 focus:outline-none text-xs text-white placeholder-zinc-500"
              />
              <button
                type="button"
                id="btn-mod39-paste-clipboard-guide"
                class="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-xs font-bold shrink-0 transition"
              >📋 Dán Nhanh</button>
              <button
                type="button"
                id="btn-mod39-confirm-guide-url"
                class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shrink-0 shadow transition"
              >▶ Vào Bước 2 Ngay</button>
            </div>
            <div id="mod39-guide-parse-status" class="text-[11px] text-zinc-400 min-h-[18px]">
              Hỗ trợ đủ link: <code class="text-zinc-300">youtube.com/watch?v=...</code>, <code class="text-zinc-300">youtu.be/...</code>, <code class="text-zinc-300">/shorts/</code>, <code class="text-zinc-300">/live/</code>, hoặc link có kèm giờ phát <code class="text-zinc-300">&amp;t=120s</code>.
            </div>
          </div>

          <div class="text-[11px] text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded-xl p-2.5 flex items-start gap-2">
            <span>🛡️</span>
            <span>
              <strong>Ghi chú Privacy-Enhanced:</strong> Hệ thống phát video qua máy chủ rút gọn <code class="text-emerald-300">youtube-nocookie.com</code> giúp giảm tối đa giao diện gây phân tâm xung quanh (cột bình luận, đề xuất). Lưu ý nếu chủ kênh YouTube khóa quyền nhúng bên thứ 3 hoặc bạn mở web trực tiếp bằng giao thức <code class="text-amber-300">file://</code>, khung Bước 2 sẽ hiện sẵn nút mở sang YouTube trong 1 chạm.
            </span>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents(modal);
      this.modalMounted = true;
      NS.i18n?.translateElement?.(modal);
      return modal;
    }

    bindModalEvents(modal) {
      const closeBtn = modal.querySelector(`#${MOD39_CONSTANTS.GUIDE_CLOSE_BTN_ID}`);
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Chạm nền tối bên ngoài hộp thoại cũng cho đóng gọn gàng
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) {
          this.close();
        }
      });

      const inputEl = modal.querySelector(`#${MOD39_CONSTANTS.GUIDE_INPUT_ID}`);
      const statusEl = modal.querySelector('#mod39-guide-parse-status');
      const pasteBtn = modal.querySelector('#btn-mod39-paste-clipboard-guide');
      const launchBtn = modal.querySelector('#btn-mod39-confirm-guide-url');

      const evaluateAndMaybeLaunch = (autoLaunchIfValid) => {
        if (!inputEl) return;
        const val = inputEl.value.trim();
        if (!val) {
          if (statusEl) {
            statusEl.className = 'text-[11px] text-zinc-400 min-h-[18px]';
            statusEl.textContent = 'Hãy dán link YouTube bạn vừa sao chép vào ô trên.';
          }
          return;
        }

        const parsed = this.parser.parse(val);
        if (parsed.valid) {
          if (statusEl) {
            statusEl.className = 'text-[11px] text-emerald-300 font-bold min-h-[18px]';
            statusEl.textContent = `✅ Đã nhận diện hợp lệ (${
              parsed.videoId ? `Video: ${parsed.videoId}` : `Playlist: ${parsed.playlistId}`
            }) — Đang mở Trình Phát Bước 2...`;
          }
          if (autoLaunchIfValid) {
            this.close();
            this.onValidUrlDetected(parsed);
          }
        } else {
          if (statusEl) {
            statusEl.className = 'text-[11px] text-rose-400 font-semibold min-h-[18px]';
            statusEl.textContent = `⚠️ ${parsed.message}`;
          }
        }
      };

      if (inputEl) {
        // Khi người dùng gõ hoặc dán link: nếu hợp lệ thì tự động chuyển thẳng sang Bước 2!
        inputEl.addEventListener('input', () => evaluateAndMaybeLaunch(true));
        inputEl.addEventListener('paste', () => {
          setTimeout(() => evaluateAndMaybeLaunch(true), 40);
        });
        inputEl.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            evaluateAndMaybeLaunch(true);
          } else if (ev.key === 'Escape') {
            ev.preventDefault();
            this.close();
          }
        });
      }

      if (pasteBtn) {
        pasteBtn.addEventListener('click', async () => {
          if (!global.navigator?.clipboard?.readText) {
            safeNotify('📋 Trình duyệt chặn đọc Clipboard tự động — hãy bấm vào ô nhập rồi Dán (Ctrl+V / Nhấn giữ).', 'info', 2800);
            inputEl?.focus();
            return;
          }
          try {
            const clip = await global.navigator.clipboard.readText();
            if (inputEl) {
              inputEl.value = (clip || '').trim();
              evaluateAndMaybeLaunch(true);
            }
          } catch (_err) {
            safeNotify('📋 Hãy chạm vào ô nhập và bấm Dán thủ công nhé.', 'info', 2400);
            inputEl?.focus();
          }
        });
      }

      if (launchBtn) {
        launchBtn.addEventListener('click', () => evaluateAndMaybeLaunch(true));
      }
    }

    open(prefillText = '') {
      const modal = this.ensureModalInDom();
      if (!modal) return false;
      this.hasShownOnceThisSession = true;
      modal.classList.remove('hidden');

      const inputEl = modal.querySelector(`#${MOD39_CONSTANTS.GUIDE_INPUT_ID}`);
      if (inputEl && typeof prefillText === 'string' && prefillText.trim()) {
        inputEl.value = prefillText.trim();
      }
      setTimeout(() => {
        inputEl?.focus();
      }, 60);
      return true;
    }

    close() {
      const modal = typeof document !== 'undefined' ? document.getElementById(MOD39_CONSTANTS.GUIDE_MODAL_ID) : null;
      if (modal) {
        modal.classList.add('hidden');
      }
    }
  }

  // ==========================================================================
  // 8. GIAO DIỆN TOÀN DIỆN TAB 5 MỤC 5 (`#s14-panel-youtube-box`) & MINI BAR
  // ==========================================================================
  class Tab5YouTubeStudioViewRenderer {
    constructor(parser, vault, bridge, playerCtrl, bgStage, step1Modal, searcher) {
      this.parser = parser;
      this.vault = vault;
      this.bridge = bridge;
      this.playerCtrl = playerCtrl;
      this.bgStage = bgStage;
      this.step1Modal = step1Modal;
      this.searcher = searcher;
      this.mounted = false;
      const savedSubtab = safeStorageGet('noir_v40_mod39_active_tab_v1', 'PLAYER');
      this.activeTab =
        savedSubtab === 'FAVORITES' || savedSubtab === 'DISCOVER' || savedSubtab === 'PLAYER'
          ? savedSubtab
          : 'PLAYER';
      this.miniDockId = 'mod39-floating-mini-bar';
      this._miniDismissedForKey = null;
      this._userOpenedMiniThisSession = false;
      this.step1GuideAutoOpenedOnCardClick = false;
      this.searchState = {
        statusText: '',
        videos: [],
        isLoading: false,
        isError: false,
        query: ''
      };
    }

    init() {
      this.renderPanelSkeleton();
      this.bindTab5CardButtonBehavior();
      this.bindStaticEvents();
      this.restoreSavedVideoIfAny();
      this.syncDynamicUi();
      const bus = NS.bus || NS.events;
      const screenEventName = NS.constants?.EVENTS?.SCREEN_CHANGED || 'nav:screen_changed';
      if (bus && typeof bus.on === 'function') {
        bus.on(screenEventName, () => {
          this.syncFloatingMiniDock();
        });
        if (screenEventName !== 'nav:screen_changed') {
          bus.on('nav:screen_changed', () => {
            this.syncFloatingMiniDock();
          });
        }
        bus.on('gate:unlocked', () => {
          this.syncFloatingMiniDock();
        });
        bus.on('guest_mode:entered', () => {
          this.syncFloatingMiniDock();
        });
      }
      if (typeof global !== 'undefined' && typeof global.addEventListener === 'function') {
        global.addEventListener('mod39:video-loaded', () => {
          this._miniDismissedForKey = null;
          this.syncFloatingMiniDock();
        });
      }
      this.mounted = true;
    }

    getPanelContainer() {
      if (typeof document === 'undefined') return null;
      return document.getElementById(MOD39_CONSTANTS.PANEL_ID);
    }

    /**
     * Đồng bộ nhãn trạng thái đóng/mở trên header Ô Lớn #5 ở Tab 5.
     */
    syncBigCardHeaderBadge() {
      if (typeof document === 'undefined') return;
      const panelEl = this.getPanelContainer();
      const cardBtn = document.getElementById(MOD39_CONSTANTS.CARD_BTN_ID);
      const isOpen = Boolean(panelEl && !panelEl.classList.contains('hidden'));
      if (cardBtn && typeof NS.syncTab5CardToggleState === 'function') {
        NS.syncTab5CardToggleState(cardBtn, isOpen);
        return;
      }
      if (cardBtn) {
        cardBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      const badgeEl = document.getElementById('s14-card-youtube-state-badge');
      if (badgeEl) {
        const rawBadge = isOpen
          ? 'Đang mở rộng, bấm vào để thu gọn'
          : 'Đang thu gọn, bấm vào để mở rộng';
        badgeEl.textContent = NS.i18n?.translateText ? NS.i18n.translateText(rawBadge) : rawBadge;
      }
    }

    /**
     * Kết nối Ô Lớn #5 (`#s14-card-youtube-btn`) ở Tab 5 để mở ra / đóng vào mượt mà,
     * công khai toàn bộ công cụ ngay bên trong ô và khởi động trước YT Iframe API khi mở ô.
     */
    bindTab5CardButtonBehavior() {
      if (typeof document === 'undefined') return;
      const cardBtn = document.getElementById(MOD39_CONSTANTS.CARD_BTN_ID);
      const panelEl = this.getPanelContainer();
      if (!cardBtn || cardBtn.dataset.mod39GuideHooked) return;
      cardBtn.dataset.mod39GuideHooked = 'true';

      const scheduleSync = () => {
        setTimeout(() => {
          this.syncBigCardHeaderBadge();
          const curPanel = this.getPanelContainer();
          if (curPanel && !curPanel.classList.contains('hidden')) {
            this.bridge.loadYoutubeIframeApiScript?.();
            if (
              this.playerCtrl?.activeVideo &&
              (!this.bridge._fgIframeAcked || !this.bridge._ytApiReady)
            ) {
              this.bridge.ensureBridgeConnected?.(this.playerCtrl.prefs);
            }
          }
        }, 25);
      };

      cardBtn.addEventListener('click', scheduleSync);
      document.getElementById('btn-tab5-collapse-all')?.addEventListener('click', scheduleSync);
      document.getElementById('btn-tab5-expand-all')?.addEventListener('click', scheduleSync);

      if (panelEl && typeof global.MutationObserver === 'function' && !panelEl.dataset.mod39ClassObs) {
        panelEl.dataset.mod39ClassObs = 'true';
        const obs = new global.MutationObserver(() => this.syncBigCardHeaderBadge());
        obs.observe(panelEl, { attributes: true, attributeFilter: ['class'] });
      }

      this.syncBigCardHeaderBadge();
    }

    renderPanelSkeleton() {
      const panel = this.getPanelContainer();
      if (!panel) return;

      panel.innerHTML = `
        <!-- Thanh Tìm Kiếm Nổi Bật (Hero Search Bar ngay dưới Ô Lớn #5 — bấm Enter tìm/phát ngay trên cả ĐT & Laptop) -->
        <form id="mod39-hero-search-card" class="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/35 via-zinc-950/95 to-zinc-900/95 border-2 border-rose-500/50 shadow-xl space-y-3" action="javascript:void(0);" onsubmit="return false;" novalidate>
          <div class="relative flex items-center">
            <span class="pointer-events-none absolute left-4 text-base sm:text-lg text-rose-300" aria-hidden="true">🔎</span>
            <input
              type="search"
              enterkeyhint="search"
              id="${MOD39_CONSTANTS.STEP2_INPUT_ID}"
              autocomplete="off"
              spellcheck="false"
              placeholder="Gõ từ khóa tìm video (vd: lofi mưa đêm, sáo trúc, anime ost...) hoặc dán link YouTube rồi bấm Enter..."
              class="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-zinc-900/95 border-2 border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none text-sm sm:text-base font-medium text-white placeholder-zinc-400 shadow-inner transition"
            />
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-mod39-step2-load"
              class="flex-1 sm:flex-initial min-w-[120px] px-5 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold shadow-lg shadow-emerald-950/40 transition"
            >🔍 Tìm / ▶ Phát</button>
          </div>
        </form>

        <!-- Thanh Chuyển Mục Phụ Tách Riêng -->
        <div class="flex flex-wrap items-center gap-2 pt-0.5 min-w-0 max-w-full">
          <button
            type="button"
            data-mod39-subtab="FAVORITES"
            class="mod39-subtab-btn px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white transition"
          >⭐ Đã Lưu (<span id="mod39-fav-count">0</span>)</button>
          <button
            type="button"
            data-mod39-subtab="DISCOVER"
            class="mod39-subtab-btn px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white transition"
          >🔎 Chủ Đề Nhạc/Cảnh Hay</button>
        </div>

        <!-- KHU 1: TÌM KIẾM TẠI CHỖ + TRÌNH PHÁT + VÒNG LẶP A-B + CÀI BACKGROUND -->
        <div id="mod39-subview-player" class="space-y-4">
          <!-- CẢNH BÁO TRÌNH DUYỆT TRONG ỨNG DỤNG (MESSENGER / ZALO / FACEBOOK WEBVIEW) -->
          <div id="mod39-inapp-webview-banner" class="${this.playerCtrl?.mobileBgAudio?.isInAppWebView?.() ? '' : 'hidden '}rounded-2xl border border-amber-400/70 bg-amber-950/75 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-lg">
            <div class="text-xs text-amber-100 leading-relaxed">
              <strong class="text-amber-300">⚠️ Bạn đang mở web trong trình duyệt thu gọn (Messenger / Zalo):</strong> <span>Trình duyệt nội bộ này khóa tính năng chạy nhạc nền khi tắt màn hình và cửa sổ nổi (PiP). Hãy bấm nút bên cạnh để mở thẳng trong Chrome hoặc Safari!</span>
            </div>
            <button
              type="button"
              id="btn-mod39-open-external-browser"
              class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold shadow transition shrink-0 cursor-pointer"
            >🌐 Mở bằng Chrome / Safari (Chạy nền &amp; PiP 100%)</button>
          </div>

          <!-- KẾT QUẢ TÌM KIẾM TRỰC TIẾP TRONG WEB (INVIDIOUS + PIPED FALLBACK) -->
          <div id="mod39-search-results-section" class="hidden rounded-2xl border border-rose-500/35 bg-zinc-950/80 p-3 sm:p-4 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div id="mod39-search-status-msg" class="text-xs font-bold text-zinc-200 flex items-center gap-2 flex-wrap">
                <span>🔎 Kết quả tìm kiếm video YouTube</span>
              </div>
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  id="link-mod39-search-fallback-yt"
                  href="${MOD39_CONSTANTS.YOUTUBE_HOME_URL}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-[11px] font-bold transition"
                >Mở Kết Quả YouTube ↗</a>
                <button
                  type="button"
                  id="btn-mod39-clear-search-results"
                  class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-600/80 border border-zinc-600 text-zinc-200 hover:text-white text-[11px] font-bold transition"
                >✕ Đóng Kết Quả</button>
              </div>
            </div>
            <div id="mod39-search-video-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1"></div>
          </div>

          <!-- Khung Video & Đầy Đủ Bảng Điều Khiển (Công khai ngay cả trước khi chọn video) -->
          <div id="mod39-active-player-grid" class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <!-- CỘT TRÁI (7/12): KHUNG VIDEO 16:9 + TIMELINE + THANH ĐIỀU KHIỂN -->
            <div class="xl:col-span-7 space-y-3 min-w-0">
              <!-- Thanh Hướng Dẫn & Nút Chuyển Chế Độ Ẩn Hình (Chỉ Audio Nền) / Bật Video Hình (Chỉ hiện trên Mobile) -->
              <div id="mod39-bg-hint-ribbon" class="flex lg:hidden flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-amber-950/35 border border-amber-500/40 shadow-sm min-w-0">
                <p id="mod39-bg-hint-text" class="text-[11px] leading-relaxed text-amber-100/95 font-medium min-w-0 flex-1 break-words">Nếu bạn muốn nghe phát nền hãy bấm vào nút Ẩn hình (Chỉ Audio Nền), còn muốn xem lại video ở trên web thì bấm lại "Bật video hình" là được nhé =)), hack youtube lord</p>
                <button type="button" id="btn-mod39-bg-mode-toggle" class="shrink-0 px-3 py-2 rounded-xl border border-amber-400/65 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-extrabold transition flex lg:hidden items-center justify-center gap-1.5 shadow-sm mod39-bg-toggle-blink">🎧 Ẩn Hình (Chỉ Audio Nền)</button>
              </div>
              <!-- Khung màn hình phát & nút thoát Pseudo-Fullscreen -->
              <div id="mod39-player-stage-wrapper" class="relative w-full aspect-video min-h-[225px] sm:min-h-0 rounded-2xl overflow-hidden bg-black border border-zinc-700 shadow-2xl">
                <iframe
                  id="${this.bridge.mainIframeId}"
                  class="w-full h-full border-0"
                  title="Trình phát YouTube Chống Sao Nhãng — Web Viết Tiểu Thuyết Của Bi"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowfullscreen
                ></iframe>
                <!-- Khung gắn thẻ HTML5 <video id="core-media-player" playsinline> phát trực tiếp (không hiện khung YouTube) -->
                <div
                  id="mod39-native-video-host"
                  class="hidden absolute inset-0 z-[5] bg-black flex items-center justify-center"
                ></div>
                <!-- Ảnh nền chờ thụ động khi đang lấy luồng trực tiếp (không có nút hỏi/chọn chế độ) -->
                <div
                  id="mod39-resolving-poster-card"
                  class="hidden pointer-events-none absolute inset-0 z-[6] bg-zinc-950/90 flex flex-col items-center justify-center p-4 text-center gap-2"
                >
                  <img id="mod39-resolving-poster-thumb" alt="" class="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" />
                  <div class="relative z-10 px-3 py-1.5 rounded-full bg-zinc-950/85 border border-emerald-400/50 text-emerald-200 text-xs font-extrabold shadow-lg">⏳ Đang nạp trình phát video mượt...</div>
                </div>
                <!-- Khung Audio-Stage Chế Độ 2 (không tự mở iframe YouTube có bánh răng/CC; chạm khung để Phát / Tạm dừng) -->
                <div
                  id="mod39-audio-only-stage"
                  class="hidden absolute inset-0 z-[7] bg-zinc-950 flex flex-col items-center justify-center p-4 text-center cursor-pointer select-none overflow-hidden"
                  role="button"
                  tabindex="0"
                  aria-label="Chạm khung để Phát hoặc Tạm dừng âm thanh nền"
                >
                  <img id="mod39-audio-stage-thumb" alt="" class="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none" />
                  <div class="relative z-10 flex flex-col items-center gap-2.5 max-w-sm pointer-events-none">
                    <div class="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-400/60 text-emerald-200 text-xs font-extrabold shadow-lg">🎧 Đang phát Audio nền Mục 3 (MP3)</div>
                    <div id="mod39-audio-stage-hint" class="text-[11px] font-semibold text-zinc-100/90 bg-black/60 px-3 py-1.5 rounded-xl border border-zinc-700/70">▶️ Chạm vào khung để Tạm dừng (Tắt màn hình vẫn nghe nền Mục 3)</div>
                  </div>
                  <div class="relative z-10 mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      id="btn-mod39-optin-iframe-visual"
                      class="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-600/80 text-zinc-200 text-[11px] font-bold shadow transition"
                    >📺 Mở khung YouTube gốc nếu muốn xem hình</button>
                  </div>
                </div>
                <!-- Lớp chờ tìm kiếm trực tiếp ngay trong khung 16:9 khi chưa nạp video -->
                <div id="mod39-empty-stage-card" class="absolute inset-0 z-10 p-3 sm:p-5 bg-zinc-950/95 flex flex-col justify-start items-center text-center overflow-y-auto">
                  <div class="my-auto w-full flex flex-col items-center text-center space-y-2.5">
                  <div class="text-2xl sm:text-3xl leading-none">🎬🔎</div>
                  <div class="text-xs sm:text-sm font-extrabold text-zinc-100">
                    Tìm &amp; Phát Video YouTube Trực Tiếp Trong Khung Này
                  </div>
                  <p class="text-[11px] text-zinc-300 max-w-lg leading-relaxed">
                    Gõ từ khóa bất kỳ (nhạc không lời, lofi mưa đêm, cổ phong, anime ost...) rồi chọn video phát ngay — video sẽ tự động chạy làm nền động 16:9 cho cả 6 Tab!
                  </p>
                  <div class="w-full max-w-md flex flex-col sm:flex-row gap-2 pt-0.5">
                    <input
                      type="text"
                      id="input-mod39-stage-inline-search"
                      autocomplete="off"
                      spellcheck="false"
                      placeholder="Gõ từ khóa YouTube (vd: lofi rain ambient)..."
                      class="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-rose-400 focus:outline-none text-xs text-white placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      id="btn-mod39-stage-inline-search"
                      class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg transition shrink-0"
                    >🔍 Tìm Trong Khung</button>
                  </div>
                  <div class="flex flex-wrap items-center justify-center gap-1.5 pt-0.5 max-w-xl">
                    ${AMBIENCE_YOUTUBE_SEARCH_PRESETS.slice(0, 6)
                      .map(
                        (item) => `
                      <button
                        type="button"
                        data-mod39-quick-search="${escapeHtml(item.query)}"
                        class="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-600/85 border border-zinc-700 hover:border-rose-400 text-zinc-200 hover:text-white text-[11px] font-bold transition"
                      >${escapeHtml(item.badge)}</button>`
                      )
                      .join('')}
                  </div>
                  <div class="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                    <button
                      type="button"
                      id="btn-mod39-empty-open-guide"
                      class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold transition"
                    >❓ Hoặc dán link YouTube có sẵn</button>
                  </div>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-mod39-exit-pseudo-fs"
                  class="mod39-stage-exit-pseudo-btn hidden absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-rose-600 text-white text-xs font-extrabold border border-zinc-500 shadow-lg"
                >✕ Thu Nhỏ Màn Hình</button>
              </div>

              <!-- Cảnh báo dự phòng trung thực nếu gặp Error 101/150/153 hoặc file:// -->
              <div id="mod39-embed-fallback-banner" class="hidden p-3 rounded-xl border border-amber-500/50 bg-amber-950/35 text-xs space-y-2">
                <div class="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span id="mod39-embed-error-title">Lưu ý phát nhúng video</span>
                </div>
                <p id="mod39-embed-error-detail" class="text-[11px] text-zinc-200 leading-relaxed"></p>
                <div class="flex flex-wrap gap-2">
                  <a
                    id="link-mod39-fallback-watch"
                    href="${MOD39_CONSTANTS.YOUTUBE_HOME_URL}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition"
                  >▶ Mở Video Trực Tiếp Trên YouTube ↗</a>
                  <button
                    type="button"
                    id="btn-mod39-retry-embed"
                    class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 text-[11px] font-bold transition"
                  >🔄 Tải Lại Khung Phát</button>
                </div>
                <details id="mod39-stream-config-drawer" class="pt-2 border-t border-amber-500/30 text-[11px] space-y-2">
                  <summary class="cursor-pointer font-bold text-amber-300 select-none">⚙️ Server Luồng Riêng</summary>
                  <div class="pt-1.5 space-y-2">
                    <div class="font-bold text-amber-200">⚡ Cloudflare Worker Riêng (Chống YouTube chặn IP máy chủ công cộng LOGIN_REQUIRED)</div>
                    <p class="text-zinc-300 leading-relaxed">Nếu các server công cộng tạm bị YouTube giới hạn, bạn có thể tạo Cloudflare Worker miễn phí, dán code có sẵn rồi nhập URL *.workers.dev vào ô dưới đây:</p>
                    <div class="flex flex-wrap gap-1.5">
                      <input type="url" id="input-mod39-custom-stream-host" value="${escapeHtml(NS.streamFetcher?.getCustomInstanceUrl?.() || '')}" placeholder="https://yt-proxy.tenban.workers.dev" class="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500" />
                      <button type="button" id="btn-mod39-save-stream-host" class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold">💾 Lưu</button>
                      <button type="button" id="btn-mod39-copy-worker-code" class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold">📋 Copy Code Worker</button>
                      <button type="button" id="btn-mod39-reset-stream-host" class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 font-bold">🔄 Mặc Định</button>
                    </div>
                  </div>
                </details>
              </div>

              <!-- Tiêu đề & nút Lưu Yêu Thích / Mở tab gốc -->
              <div class="p-3 rounded-xl bg-zinc-950/75 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="min-w-0">
                  <div id="mod39-active-video-title" class="text-xs sm:text-sm font-extrabold text-white leading-snug break-words">
                    Video YouTube
                  </div>
                  <div id="mod39-active-video-meta" class="text-[11px] text-zinc-400 leading-snug break-words mt-0.5"></div>
                </div>
                <div class="w-full sm:w-auto flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
                  <button
                    type="button"
                    id="btn-mod39-toggle-favorite"
                    class="px-2.5 py-1.5 rounded-lg border border-amber-500/45 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold transition"
                  >☆ Lưu Yêu Thích</button>
                  <button
                    type="button"
                    id="btn-mod39-stop-clear-video"
                    class="hidden px-2.5 py-1.5 rounded-lg border border-rose-500/45 bg-rose-500/15 hover:bg-rose-500/30 text-rose-200 text-[11px] font-bold transition"
                  >⏹️ Tắt Video</button>
                  <a
                    id="link-mod39-open-original"
                    href="${MOD39_CONSTANTS.YOUTUBE_HOME_URL}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[11px] font-bold transition"
                  >↗ YouTube</a>
                </div>
              </div>

              <!-- Thanh Tua Thời Gian & Bộ Đếm -->
              <div class="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div class="flex items-center gap-2.5">
                  <input
                    type="range"
                    id="slider-mod39-timeline"
                    min="0"
                    max="1000"
                    value="0"
                    aria-label="Thanh tua thời gian video YouTube"
                    class="flex-1 accent-rose-500 cursor-pointer h-2"
                  />
                  <span id="mod39-time-readout" class="text-[11px] font-mono font-bold text-zinc-200 shrink-0 min-w-[92px] text-right">
                    00:00 / --:--
                  </span>
                </div>

                <!-- Thanh Thu gọn / Mở rộng cụm điều khiển phát, tua ±10s, lặp & tải video -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
                  <span class="text-[11px] font-extrabold text-zinc-300">🎛️ Bộ Điều Khiển Phát, Tua ±10s, Lặp &amp; Tải Video</span>
                  <button
                    type="button"
                    id="btn-mod39-toggle-controls-deck"
                    class="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-[10.5px] font-bold text-zinc-200 transition shrink-0"
                  >▼ Mở rộng</button>
                </div>

                <div id="mod39-controls-collapsible-body" class="hidden space-y-2.5">
                <!-- Hàng nút điều khiển chính -->
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      id="btn-mod39-seek-back10"
                      class="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-xs font-extrabold shrink-0 whitespace-nowrap inline-flex items-center justify-center"
                      title="Tua lùi 10 giây"
                    >⏪ -10s</button>
                    <button
                      type="button"
                      id="btn-mod39-play-pause"
                      class="px-3.5 py-2 min-w-[126px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow shrink-0 whitespace-nowrap inline-flex items-center justify-center"
                    >▶ / ⏸ Phát - Dừng</button>
                    <button
                      type="button"
                      id="btn-mod39-seek-fwd10"
                      class="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-xs font-extrabold shrink-0 whitespace-nowrap inline-flex items-center justify-center"
                      title="Tua tới 10 giây"
                    >+10s ⏩</button>
                    <button
                      type="button"
                      id="btn-mod39-yt-repeat"
                      class="px-2.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold shrink-0 whitespace-nowrap inline-flex items-center justify-center"
                    >🔁 Lặp: Tắt</button>
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      id="btn-mod39-system-pip"
                      class="hidden px-2.5 py-2 rounded-xl border border-violet-500/45 bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 text-xs font-extrabold shrink-0 whitespace-nowrap inline-flex items-center justify-center"
                      title="Mở cửa sổ nổi xem video (hỗ trợ cả Desktop &amp; Mobile)"
                    >🖼️ Cửa sổ nổi</button>
                    <button
                      type="button"
                      id="btn-mod39-yt-fullscreen"
                      class="px-3 py-2 rounded-xl border border-sky-500/45 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 text-xs font-extrabold shrink-0 whitespace-nowrap inline-flex items-center justify-center"
                      title="Toàn màn hình chuẩn (tự động dùng Pseudo-Fullscreen dự phòng nếu trình duyệt hạn chế)"
                    >⛶ Toàn Màn Hình</button>
                    <button
                      type="button"
                      id="btn-mod39-download-ytsave"
                      class="px-3 py-2 rounded-xl border border-amber-400/60 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-extrabold shrink-0 whitespace-nowrap inline-flex items-center justify-center shadow-sm transition cursor-pointer"
                      title="Tự động sao chép link video YouTube đang xem và mở trang tải video ytsave"
                    >📥 Tải video Youtube về máy ( ͡° ͜ʖ ͡°)</button>
                  </div>
                </div>

                <div
                  id="mod39-live-loop-lock-notice"
                  role="status"
                  class="hidden px-3 py-2 rounded-xl border border-rose-500/50 bg-rose-950/35 text-[11px] font-bold text-rose-200 leading-relaxed break-words"
                >🔴 Video này là luồng phát trực tiếp (LIVE) nên tính năng Loop toàn video và Loop 1 phần (A–B) đã bị khóa.</div>

                <!-- Tốc độ & Âm lượng -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
                  <div class="flex items-center justify-between gap-2">
                    <label for="select-mod39-speed" class="text-[11px] font-bold text-zinc-400 shrink-0">⚡ Tốc độ:</label>
                    <select
                      id="select-mod39-speed"
                      class="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white font-bold"
                    >
                      ${MOD39_CONSTANTS.SPEED_OPTIONS.map(
                        (sp) => `<option value="${sp}" ${sp === 1 ? 'selected' : ''}>${sp}x${sp === 1 ? ' (Chuẩn)' : ''}</option>`
                      ).join('')}
                    </select>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-mod39-mute"
                      class="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs"
                      title="Bật / Tắt tiếng"
                    >🔊</button>
                    <input
                      type="range"
                      id="slider-mod39-volume"
                      min="0"
                      max="100"
                      value="85"
                      aria-label="Âm lượng trình phát YouTube"
                      class="flex-1 accent-emerald-500 cursor-pointer h-1.5"
                    />
                    <span id="mod39-volume-label" class="text-[11px] font-mono text-zinc-300 w-9 text-right">85%</span>
                  </div>
                </div>

                <!-- Phát Âm Thanh Nền Mặc Định Tự Động (không cần bấm nút) -->
                <div id="mod39-mobile-bg-panel" class="pt-2 border-t border-zinc-800/80 space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div id="mod39-mobile-bg-status" class="px-2.5 py-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-[11px] text-emerald-200/95 leading-snug break-words flex-1 min-w-[180px]">
                      🎧 Tự động chạy nền (Luồng phát công cộng): Hình chạy tại Tab 5, Âm thanh nối thẳng Tab 3 (MP3) &amp; luôn đồng bộ thời gian.
                    </div>
                  </div>
                </div>
                </div>
              </div>

              <!-- HỘP VÒNG LẶP ĐOẠN A–B TRỰC QUAN KIỂU MP3 (NGAY DƯỚI TRÌNH PHÁT CỘT TRÁI — MẶC ĐỊNH THU GỌN) -->
              <div id="mod39-left-ab-loop-box" class="p-3.5 rounded-2xl border border-violet-500/45 bg-violet-950/25 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs sm:text-sm font-extrabold text-violet-300">
                      🔁 Lặp Đoạn Cụ Thể A–B (Giống Máy MP3)
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span id="mod39-ab-status-pill" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 shrink-0">A–B: Tắt</span>
                    <button
                      type="button"
                      id="btn-mod39-toggle-ab-loop-box"
                      class="px-2 py-0.5 rounded-lg border border-violet-500/40 bg-violet-900/40 hover:bg-violet-800/50 text-[10.5px] font-bold text-violet-200 transition"
                    >▲ Thu gọn</button>
                  </div>
                </div>

                <div id="mod39-left-ab-loop-body" class="space-y-2.5">
                <!-- Thanh trực quan đoạn lặp A–B trên tổng thời lượng video -->
                <div class="space-y-1">
                  <div id="mod39-ab-visual-track" class="relative w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-700/80 overflow-hidden">
                    <div id="mod39-ab-visual-fill" class="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-200" style="left:0%;width:0%;opacity:0;"></div>
                    <div id="mod39-ab-playhead-marker" class="absolute top-0 bottom-0 w-0.5 bg-white shadow" style="left:0%;opacity:0.35;"></div>
                  </div>
                  <div class="flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400">
                    <span>Nhập 01:25 rồi bấm Enter hoặc chạm/click ra ngoài để tự xác nhận (A &lt; B &le; thời lượng)</span>
                    <span id="mod39-ab-range-label" class="font-mono text-violet-300 font-bold">Chưa chọn đoạn A–B</span>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div class="space-y-1">
                    <label for="input-mod39-ab-start" class="block text-[10px] font-bold text-zinc-400 uppercase">Mốc A (Bắt đầu)</label>
                    <div class="flex gap-1">
                      <input
                        type="text"
                        inputmode="numeric"
                        autocomplete="off"
                        id="input-mod39-ab-start"
                        placeholder="00:00"
                        class="w-full min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono text-white"
                      />
                      <button
                        type="button"
                        id="btn-mod39-mark-a"
                        class="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-extrabold shrink-0"
                        title="Lấy giây đang phát hiện tại làm Điểm A"
                      >📍 Đặt A</button>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label for="input-mod39-ab-end" class="block text-[10px] font-bold text-zinc-400 uppercase">Mốc B (Kết thúc)</label>
                    <div class="flex gap-1">
                      <input
                        type="text"
                        inputmode="numeric"
                        autocomplete="off"
                        id="input-mod39-ab-end"
                        placeholder="00:30"
                        class="w-full min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono text-white"
                      />
                      <button
                        type="button"
                        id="btn-mod39-mark-b"
                        class="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-extrabold shrink-0"
                        title="Lấy giây đang phát hiện tại làm Điểm B"
                      >📍 Đặt B</button>
                    </div>
                  </div>
                </div>

                <div
                  id="mod39-ab-live-lock-banner"
                  role="status"
                  class="hidden px-2.5 py-2 rounded-xl border border-rose-500/55 bg-rose-950/40 text-[11px] font-bold text-rose-200 leading-relaxed break-words"
                >🔒 <strong class="text-rose-100">Video đang phát trực tiếp (LIVE):</strong> Không thể đặt Mốc A–B hoặc lặp 1 phần cho luồng phát trực tiếp.</div>

                <div
                  id="mod39-ab-validation-msg"
                  role="alert"
                  class="hidden px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                ></div>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    id="btn-mod39-yt-ab-toggle"
                    class="flex-1 px-3 py-2 rounded-xl border border-violet-500/50 bg-violet-600/80 hover:bg-violet-500 text-white text-xs font-extrabold transition"
                  >🔁 Bật Vòng Lặp A–B</button>
                  <button
                    type="button"
                    id="btn-mod39-yt-ab-clear"
                    class="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold transition"
                  >🧹 Xóa A–B</button>
                </div>
                </div>
              </div>
            </div>

            <!-- CỘT PHẢI (5/12): CÀI VIDEO LÀM BACKGROUND WEB TOÀN TRANG 16:9 -->
            <div class="xl:col-span-5 space-y-3">
              <!-- BỘ ĐIỀU KHIỂN NỀN VIDEO CHUYỂN ĐỘNG TOÀN TRANG 16:9 (MODULE 40 QUẢN LÝ) -->
              <div id="mod40-bg-controls-mount"></div>
            </div>
          </div>
        </div>

        <!-- KHU 2: KHO YÊU THÍCH & LỊCH SỬ LINK YOUTUBE ĐÃ DÁN -->
        <div id="mod39-subview-favorites" class="hidden space-y-4">
          <div class="space-y-2">
            <div class="text-xs font-extrabold text-amber-300">⭐ Video Yêu Thích Đã Ghim</div>
            <div id="mod39-favorites-list" class="grid grid-cols-1 md:grid-cols-2 gap-2.5"></div>
          </div>

          <div class="space-y-2 pt-2 border-t border-zinc-800">
            <div class="text-xs font-extrabold text-zinc-300">🕒 Lịch Sử Đường Dẫn Bạn Đã Mở Gần Đây</div>
            <div id="mod39-recent-list" class="grid grid-cols-1 md:grid-cols-2 gap-2.5"></div>
          </div>
        </div>

        <!-- KHU 3: GỢI Ý CHỦ ĐỀ TÌM VIDEO TRỰC TIẾP TRONG TRANG THEO THỂ LOẠI TRUYỆN -->
        <div id="mod39-subview-discover" class="hidden space-y-3">
          <div class="text-xs text-zinc-300 leading-relaxed">
            Chạm bất kỳ chủ đề nào dưới đây để hệ thống tìm ngay danh sách video tại chỗ (bạn có thể chọn phát ngay mà không cần rời khỏi trang web):
          </div>
          <div id="mod39-discover-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            ${AMBIENCE_YOUTUBE_SEARCH_PRESETS.map(
              (item) => `
              <div class="p-3.5 rounded-xl border ${item.accentClass} transition flex flex-col justify-between gap-2.5">
                <button
                  type="button"
                  data-mod39-discover-search="${escapeHtml(item.query)}"
                  class="text-left space-y-1 flex-1 cursor-pointer group"
                >
                  <div class="text-xs font-extrabold group-hover:underline">${escapeHtml(item.badge)}</div>
                  <div class="text-[11px] opacity-85 leading-relaxed">${escapeHtml(item.description)}</div>
                </button>
                <div class="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
                  <button
                    type="button"
                    data-mod39-discover-search="${escapeHtml(item.query)}"
                    class="px-2.5 py-1 rounded-lg bg-rose-600/85 hover:bg-rose-500 text-white text-[11px] font-bold transition"
                  >🔍 Tìm Ngay Trong Web</button>
                  <a
                    href="https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[11px] font-bold underline underline-offset-2 opacity-80 hover:opacity-100"
                  >YouTube ↗</a>
                </div>
              </div>`
            ).join('')}
          </div>
        </div>
      `;
      NS.i18n?.translateElement?.(panel);
    }

    async runInAppVideoSearch(rawQuery) {
      const cleanQuery = String(rawQuery || '').trim();
      if (!cleanQuery) {
        safeNotify('🔎 Hãy nhập từ khóa cần tìm video (vd: lofi chill mưa, sáo trúc...).', 'info', 2400);
        return null;
      }

      const panel = this.getPanelContainer();
      if (panel && panel.classList.contains('hidden')) {
        if (NS.navigator?.openTab5Panel) {
          NS.navigator.openTab5Panel(MOD39_CONSTANTS.PANEL_ID, false);
        } else {
          panel.classList.remove('hidden');
        }
      }

      const step2Input = document.getElementById(MOD39_CONSTANTS.STEP2_INPUT_ID);
      if (step2Input && step2Input.value !== cleanQuery) {
        step2Input.value = cleanQuery;
      }

      this.activeTab = 'PLAYER';
      this.syncDynamicUi();

      const section = document.getElementById('mod39-search-results-section');
      const statusMsg = document.getElementById('mod39-search-status-msg');
      const grid = document.getElementById('mod39-search-video-grid');
      const fallbackYtLink = document.getElementById('link-mod39-search-fallback-yt');

      if (fallbackYtLink) {
        fallbackYtLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;
      }
      if (section) {
        section.classList.remove('hidden');
      }

      this.searchState = {
        statusText: `⏳ Đang tìm kiếm "${cleanQuery}" qua Invidious & Piped...`,
        videos: [],
        isLoading: true,
        isError: false,
        query: cleanQuery
      };

      if (statusMsg) {
        statusMsg.innerHTML = `<span class="text-cyan-300 animate-pulse">⏳ Đang tìm kiếm video cho từ khóa: "${escapeHtml(cleanQuery)}"...</span>`;
      }
      if (grid) {
        grid.innerHTML =
          '<div class="col-span-full py-6 text-center text-xs text-zinc-400">Đang truy vấn máy chủ tìm kiếm công cộng không quảng cáo (hết giờ 4s sẽ tự chuyển nguồn dự phòng)...</div>';
      }

      if (!this.searcher) {
        return { ok: false, videos: [], message: 'Công cụ tìm kiếm chưa được khởi tạo.' };
      }

      const res = await this.searcher.searchVideos(cleanQuery);
      // Nếu người dùng đã tìm một từ khóa mới hơn trong lúc chờ, bỏ qua kết quả cũ
      if (this.searchState.query !== cleanQuery) {
        return res;
      }

      if (res && res.ok && Array.isArray(res.videos) && res.videos.length > 0) {
        this.renderInAppSearchResults(
          res.videos,
          `<span>🎬 Tìm thấy <strong>${res.videos.length}</strong> video cho "<strong>${escapeHtml(cleanQuery)}</strong>"</span>`,
          false
        );
      } else {
        this.renderInAppSearchResults(
          [],
          `<span class="text-amber-300">⚠️ ${escapeHtml(res?.message || 'Không tìm thấy video phù hợp hoặc máy chủ đang bận.')}</span>`,
          true
        );
      }

      return res;
    }

    renderInAppSearchResults(videos, statusHtml, isError) {
      const section = document.getElementById('mod39-search-results-section');
      const statusMsg = document.getElementById('mod39-search-status-msg');
      const grid = document.getElementById('mod39-search-video-grid');

      this.searchState = {
        ...this.searchState,
        videos: Array.isArray(videos) ? videos : [],
        isLoading: false,
        isError: Boolean(isError),
        statusText: statusHtml || ''
      };

      if (section) section.classList.remove('hidden');
      if (statusMsg && statusHtml) statusMsg.innerHTML = statusHtml;
      if (!grid) return;

      if (!Array.isArray(videos) || videos.length === 0) {
        grid.innerHTML =
          '<div class="col-span-full py-4 text-center text-xs text-zinc-400">Thử từ khóa ngắn hơn (tiếng Anh hoặc không dấu) hoặc bấm nút "Mở Kết Quả YouTube ↗" ở góc phải phía trên.</div>';
        return;
      }

      const fallbackThumb =
        "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%2318181b'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' fill='%23a1a1aa' font-family='sans-serif' font-size='22'%3E%F0%9F%8E%AC%20YouTube%3C/text%3E%3C/svg%3E";

      grid.innerHTML = videos
        .map(
          (v, idx) => `
          <div
            role="button"
            tabindex="0"
            data-mod39-result-idx="${idx}"
            data-mod39-result-id="${escapeHtml(v.videoId)}"
            class="group rounded-xl border border-zinc-800 hover:border-rose-400/70 bg-zinc-900/90 hover:bg-zinc-900 overflow-hidden transition flex flex-col justify-between cursor-pointer text-left shadow-md"
          >
            <div>
              <div class="relative aspect-video bg-black overflow-hidden">
                <img
                  src="${escapeHtml(v.thumbnail)}"
                  onerror="this.onerror=null;this.src='${fallbackThumb}';"
                  alt="${escapeHtml(v.title)}"
                  loading="lazy"
                  class="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                ${
                  v.duration
                    ? `<span class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded ${
                        v.isLive ? 'bg-rose-600/95' : 'bg-black/85'
                      } text-white text-[10px] font-bold">${escapeHtml(v.duration)}</span>`
                    : ''
                }
              </div>
              <div class="p-2.5 space-y-1">
                <div class="text-xs font-extrabold text-zinc-100 line-clamp-2 leading-snug group-hover:text-rose-200">${escapeHtml(v.title)}</div>
                <div class="text-[11px] text-zinc-400 truncate">${escapeHtml(v.author || 'YouTube')}</div>
                ${
                  v.viewsText || v.uploadDateShort
                    ? `<div class="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 font-semibold pt-0.5">
                        ${v.viewsText ? `<span class="inline-flex items-center gap-0.5 text-zinc-300">👁️ ${escapeHtml(v.viewsText)}</span>` : ''}
                        ${v.uploadDateShort ? `<span class="inline-flex items-center gap-0.5 text-zinc-400">📅 ${escapeHtml(v.uploadDateShort)}</span>` : ''}
                      </div>`
                    : ''
                }
              </div>
            </div>
            <div class="px-2.5 pb-2.5 flex items-center justify-between gap-1.5">
              <span class="px-2 py-1 rounded-lg bg-rose-600/85 group-hover:bg-rose-500 text-white text-[10px] font-extrabold transition">▶ Chọn Phát</span>
              <button
                type="button"
                data-mod39-result-bg-idx="${idx}"
                class="px-2 py-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-[10px] font-bold transition"
                title="Cài thẳng video này làm Hình Nền Web 16:9"
              >🌌 Nền Web</button>
            </div>
          </div>`
        )
        .join('');

      const buildPayloadFromResult = (v) => {
        const isLiveResult = Boolean(
          v.isLive || v.duration === '🔴 LIVE' || Number(v.durationSec) < 0
        );
        const payload = this.parser.buildParsedPayload({
          videoId: v.videoId,
          playlistId: null,
          startSeconds: 0,
          kind: isLiveResult ? 'LIVE' : 'IN_APP_SEARCH',
          originalInput: v.watchUrl
        });
        payload.isLive = isLiveResult;
        payload.title = v.title || `Video YouTube (${v.videoId})`;
        payload.thumbnailUrl = v.thumbnail || payload.thumbnailUrl;
        return payload;
      };

      const selectAndPlayResult = (idx) => {
        const v = videos[idx];
        if (!v) return;
        const payload = buildPayloadFromResult(v);
        this.activeTab = 'PLAYER';
        this.playerCtrl.loadParsedVideo(payload);
        safeNotify(`🎬 Đang phát: ${payload.title}`, 'success', 2400);
        document.getElementById('mod39-player-stage-wrapper')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      };

      grid.querySelectorAll('[data-mod39-result-idx]').forEach((card) => {
        card.addEventListener('click', (ev) => {
          if (ev.target && ev.target.closest('[data-mod39-result-bg-idx]')) return;
          const idx = Number(card.getAttribute('data-mod39-result-idx'));
          selectAndPlayResult(idx);
        });
        card.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            const idx = Number(card.getAttribute('data-mod39-result-idx'));
            selectAndPlayResult(idx);
          }
        });
      });

      grid.querySelectorAll('[data-mod39-result-bg-idx]').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const idx = Number(btn.getAttribute('data-mod39-result-bg-idx'));
          const v = videos[idx];
          if (!v) return;
          const payload = buildPayloadFromResult(v);
          this.playerCtrl.loadParsedVideo(payload);
          const stageCtrl = NS.youtubeStudio?.bgStage || this.bgStage;
          stageCtrl.applyWebBackground(payload, true);
        });
      });
    }

    clearSearchResults() {
      const section = document.getElementById('mod39-search-results-section');
      const grid = document.getElementById('mod39-search-video-grid');
      if (section) section.classList.add('hidden');
      if (grid) grid.innerHTML = '';
      this.searchState = { statusText: '', videos: [], isLoading: false, isError: false, query: '' };
    }

    executeOmniboxSubmit() {
      NS.unlockExternalAudioGesture?.();
      NS.nativePlayer?.unlockPlaybackGesture?.();
      const step2Input = document.getElementById(MOD39_CONSTANTS.STEP2_INPUT_ID);
      const raw = step2Input ? step2Input.value : '';
      const cls = this.parser.classifyOmniboxInput(raw);

      if (cls.mode === 'URL' && cls.parsed?.valid) {
        this.activeTab = 'PLAYER';
        this.playerCtrl.loadParsedVideo(cls.parsed);
        safeNotify('🎬 Đã nạp link YouTube vào Trình Phát Chống Sao Nhãng!', 'success', 2400);
        document.getElementById('mod39-player-stage-wrapper')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
        return { ok: true, mode: 'URL' };
      }

      if (cls.mode === 'URL_INVALID') {
        safeNotify(`⚠️ ${cls.parsed?.message || 'Đường dẫn YouTube chưa hợp lệ.'}`, 'warning', 2800);
        return { ok: false, mode: 'URL_INVALID' };
      }

      if (cls.mode === 'KEYWORD') {
        return this.runInAppVideoSearch(cls.query);
      }

      safeNotify('🔎 Hãy gõ từ khóa tìm kiếm (vd: lofi chill mưa) hoặc dán link YouTube.', 'info', 2500);
      return { ok: false, mode: 'EMPTY' };
    }

    syncFilterReadoutLabelsFast(op, bl, br, glass) {
      const setLabel = (id, val, suffix) => {
        if (val === undefined || val === null) return;
        const el = document.getElementById(id);
        if (el) el.textContent = `${val}${suffix}`;
      };
      setLabel('mod39-val-bg-opacity', op, '%');
      setLabel('mod39-val-bg-blur', bl, 'px');
      setLabel('mod39-val-bg-brightness', br, '%');
      setLabel('mod39-val-ui-glass', glass, '%');
    }

    bindStaticEvents() {
      const panel = this.getPanelContainer();
      if (!panel) return;

      // Nút mở Hướng dẫn dán link trong khung chờ trống
      document.getElementById('btn-mod39-empty-open-guide')?.addEventListener('click', () => {
        this.step1Modal.open();
      });

      // Thanh tìm kiếm trực tiếp ngay bên trong khung hình chờ 16:9 (đồng bộ với Omnibox trên)
      const triggerInlineStageSearch = () => {
        const inlineEl = document.getElementById('input-mod39-stage-inline-search');
        const step2El = document.getElementById(MOD39_CONSTANTS.STEP2_INPUT_ID);
        const raw = String(inlineEl?.value || '').trim();
        if (!raw) {
          safeNotify('🔎 Hãy nhập từ khóa (vd: lofi mưa đêm) để tìm và phát ngay tại khung này.', 'info', 2400);
          inlineEl?.focus();
          return;
        }
        if (step2El) step2El.value = raw;
        document.getElementById('btn-mod39-step2-load')?.click();
      };
      document.getElementById('btn-mod39-stage-inline-search')?.addEventListener('click', triggerInlineStageSearch);
      document.getElementById('input-mod39-stage-inline-search')?.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
          evt.preventDefault();
          triggerInlineStageSearch();
        }
      });

      // Chuyển Sub-tab (bấm lại tab đang mở sẽ quay về màn hình Trình Phát chính)
      panel.querySelectorAll('.mod39-subtab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const clickedTab = btn.getAttribute('data-mod39-subtab') || 'PLAYER';
          this.activeTab = this.activeTab === clickedTab ? 'PLAYER' : clickedTab;
          safeStorageSet('noir_v40_mod39_active_tab_v1', this.activeTab);
          this.syncDynamicUi();
        });
      });

      // Chip gợi ý tìm nhanh trong khung chờ & Khám phá chủ đề
      panel.querySelectorAll('[data-mod39-quick-search], [data-mod39-discover-search]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const q =
            btn.getAttribute('data-mod39-quick-search') ||
            btn.getAttribute('data-mod39-discover-search') ||
            '';
          if (q) {
            this.runInAppVideoSearch(q);
          }
        });
      });

      document.getElementById('btn-mod39-clear-search-results')?.addEventListener('click', () => {
        this.clearSearchResults();
      });

      // Smart Omnibox: tự động phát khi dán Link hợp lệ, bấm Enter trên ĐT/Laptop tìm kiếm hoặc phát ngay
      const step2Input = document.getElementById(MOD39_CONSTANTS.STEP2_INPUT_ID);
      const heroSearchForm = document.getElementById('mod39-hero-search-card');
      const tryAutoLoadUrlOnInput = () => {
        if (!step2Input) return false;
        const cls = this.parser.classifyOmniboxInput(step2Input.value);
        if (cls.mode === 'URL' && cls.parsed?.valid) {
          this.activeTab = 'PLAYER';
          this.playerCtrl.loadParsedVideo(cls.parsed);
          safeNotify('🎬 Đã nhận diện link YouTube và nạp vào Trình Phát!', 'success', 2400);
          return true;
        }
        return false;
      };

      if (heroSearchForm) {
        heroSearchForm.addEventListener('submit', (ev) => {
          ev.preventDefault();
          this.executeOmniboxSubmit();
        });
      }

      if (step2Input) {
        const savedQ = safeStorageGet('noir_v40_mod39_search_query_v1', '');
        if (savedQ && !step2Input.value && !this.playerCtrl.activeVideo) {
          step2Input.value = savedQ;
        }
        step2Input.addEventListener('input', () => {
          safeStorageSet('noir_v40_mod39_search_query_v1', String(step2Input.value || ''));
          tryAutoLoadUrlOnInput();
        });
        step2Input.addEventListener('paste', () => {
          setTimeout(() => tryAutoLoadUrlOnInput(), 40);
        });
        step2Input.addEventListener('search', () => {
          if (String(step2Input.value || '').trim()) {
            this.executeOmniboxSubmit();
          }
        });
        step2Input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.keyCode === 13) {
            ev.preventDefault();
            this.executeOmniboxSubmit();
          }
        });
      }

      document.getElementById('btn-mod39-step2-paste')?.addEventListener('click', async () => {
        if (!global.navigator?.clipboard?.readText) {
          safeNotify('📋 Hãy click vào ô tìm kiếm rồi Dán (Ctrl+V / Nhấn giữ).', 'info', 2500);
          step2Input?.focus();
          return;
        }
        try {
          const text = await global.navigator.clipboard.readText();
          if (step2Input) {
            step2Input.value = (text || '').trim();
            this.executeOmniboxSubmit();
          }
        } catch (_e) {
          step2Input?.focus();
        }
      });

      document.getElementById('btn-mod39-step2-load')?.addEventListener('click', () => {
        this.executeOmniboxSubmit();
      });

      // Các nút điều khiển Playback
      document.getElementById('btn-mod39-play-pause')?.addEventListener('click', () => {
        this.playerCtrl.togglePlayPause();
      });
      document.getElementById('btn-mod39-seek-back10')?.addEventListener('click', () => {
        this.playerCtrl.seekRelative(-MOD39_CONSTANTS.LIMITS.SEEK_STEP_SECONDS);
      });
      document.getElementById('btn-mod39-seek-fwd10')?.addEventListener('click', () => {
        this.playerCtrl.seekRelative(MOD39_CONSTANTS.LIMITS.SEEK_STEP_SECONDS);
      });
      document.getElementById('btn-mod39-yt-repeat')?.addEventListener('click', () => {
        this.playerCtrl.toggleRepeat();
      });
      document.getElementById('btn-mod39-yt-fullscreen')?.addEventListener('click', () => {
        this.playerCtrl.toggleFullscreen();
      });
      document.getElementById('btn-mod39-exit-pseudo-fs')?.addEventListener('click', () => {
        this.playerCtrl.toggleFullscreen();
      });
      document.getElementById('btn-mod39-mute')?.addEventListener('click', () => {
        this.playerCtrl.toggleMute();
      });
      document.getElementById('btn-mod39-toggle-favorite')?.addEventListener('click', () => {
        if (!this.playerCtrl.activeVideo) return;
        const res = this.vault.toggleFavoriteVideo(this.playerCtrl.activeVideo);
        safeNotify(
          res.added ? '⭐ Đã ghim video vào mục Yêu Thích!' : '🗑️ Đã gỡ khỏi mục Yêu Thích.',
          res.added ? 'success' : 'info',
          2000
        );
        this.syncDynamicUi();
      });
      document.getElementById('btn-mod39-stop-clear-video')?.addEventListener('click', () => {
        this.playerCtrl.stopAndClearVideo(true);
      });
      document.getElementById('btn-mod39-retry-embed')?.addEventListener('click', () => {
        if (this.playerCtrl.activeVideo) {
          NS.audioStudio?.pauseExternalAudioStream?.(true);
          if (NS.nativePlayer?.isActive?.()) NS.nativePlayer.deactivate(false);
          this.playerCtrl.activeEngine = 'IFRAME';
          this.bridge.lastErrorCode = null;
          this.playerCtrl._lastSyncedBgStateTag = '';
          this.bridge.mountEmbedUrlIntoIframe(this.playerCtrl.activeVideo, this.playerCtrl.prefs);
          this.playerCtrl.startPollingLoop();
          this.playerCtrl._notifyMotionBgPlaybackState('playing', {
            stateCode: MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING,
            forceNotify: true,
            reason: 'retry-embed'
          });
          this.syncDynamicUi();
          safeNotify('🔄 Đang nạp lại khung YouTube...', 'info', 1800);
        }
      });

      document.getElementById('select-mod39-speed')?.addEventListener('change', (ev) => {
        this.playerCtrl.setSpeed(Number(ev.target.value));
      });

      document.getElementById('slider-mod39-volume')?.addEventListener('input', (ev) => {
        this.playerCtrl.setVolume(Number(ev.target.value));
      });

      // Thanh tua Timeline
      const timeline = document.getElementById('slider-mod39-timeline');
      if (timeline) {
        const readActiveDur = () => {
          const snapDur = Number(this.bridge?.getCurrentPlaybackSnapshot?.()?.duration) || 0;
          return Math.max(0, snapDur || Number(this.bridge.lastKnownDuration) || 0);
        };
        timeline.addEventListener('pointerdown', () => {
          this.playerCtrl.isScrubbing = true;
        });
        timeline.addEventListener('input', () => {
          this.playerCtrl.isScrubbing = true;
          const dur = readActiveDur();
          if (dur > 0) {
            const target = (Number(timeline.value) / 1000) * dur;
            const readout = document.getElementById('mod39-time-readout');
            if (readout) {
              readout.textContent = this.playerCtrl.isVideoLiveStream()
                ? `🔴 LIVE • ${formatSecondsToClock(target)}`
                : `${formatSecondsToClock(target)} / ${formatSecondsToClock(dur)}`;
            }
          }
        });
        timeline.addEventListener('change', () => {
          this.playerCtrl.isScrubbing = false;
          const dur = readActiveDur();
          if (dur > 0) {
            const target = (Number(timeline.value) / 1000) * dur;
            this.playerCtrl.seekToSeconds(target, true);
          }
        });
        ['pointerup', 'pointercancel', 'blur'].forEach((evName) => {
          timeline.addEventListener(evName, () => {
            this.playerCtrl.isScrubbing = false;
          });
        });
      }

      // Điều khiển Vòng Lặp A-B & Mở trình duyệt ngoài (Messenger/Zalo bypass)
      document.getElementById('btn-mod39-open-external-browser')?.addEventListener('click', () => {
        this.playerCtrl?.mobileBgAudio?.openInExternalSystemBrowser?.(
          this.playerCtrl?.activeVideo?.videoId || ''
        );
      });
      document.getElementById('btn-mod39-mark-a')?.addEventListener('click', () => {
        this.playerCtrl.markPointAFromCurrent();
      });
      document.getElementById('btn-mod39-mark-b')?.addEventListener('click', () => {
        this.playerCtrl.markPointBFromCurrent();
      });
      document.getElementById('btn-mod39-yt-ab-toggle')?.addEventListener('click', () => {
        if (!this.syncAbInputsIntoControllerBeforeToggle()) return;
        this.playerCtrl.toggleAbLoop();
      });
      document.getElementById('btn-mod39-yt-ab-clear')?.addEventListener('click', () => {
        this.playerCtrl.clearAbLoop();
      });

      const getAbTemplateForCurrentVideo = () => {
        const dur = Number(this.playerCtrl?.bridge?.lastKnownDuration) || 0;
        return dur >= 3600 ? '00:00:00' : '00:00';
      };
      const getAbDigitSlots = (tpl) => (tpl.length === 8 ? [0, 1, 3, 4, 6, 7] : [0, 1, 3, 4]);
      const normalizeMaskedClockValue = (rawVal, tpl) => {
        const clean = String(rawVal || '').trim();
        if (!clean) return tpl;
        if (tpl.length === 8 && /^\d{2}:\d{2}:\d{2}$/.test(clean)) return clean;
        if (tpl.length === 5 && /^\d{2}:\d{2}$/.test(clean)) return clean;
        const sec = parseFlexibleTimeToSeconds(clean);
        if (typeof sec === 'number' && sec >= 0) {
          return formatAbClockForDuration(sec, tpl.length === 8 ? 3600 : 0);
        }
        return tpl;
      };

      const abInputDefs = [
        { id: 'input-mod39-ab-start', field: 'A' },
        { id: 'input-mod39-ab-end', field: 'B' }
      ];
      abInputDefs.forEach(({ id, field }) => {
        const inputEl = document.getElementById(id);
        if (!inputEl) return;
        inputEl.dataset.abValidatedRaw = String(inputEl.value || '').trim();
        inputEl.addEventListener('focus', () => {
          const tpl = getAbTemplateForCurrentVideo();
          const curVal = String(inputEl.value || '').trim();
          const committedSec =
            field === 'A' ? this.playerCtrl.abLoop?.startSec : this.playerCtrl.abLoop?.endSec;
          const dur = Number(this.playerCtrl?.bridge?.lastKnownDuration) || 0;
          const committedStr =
            typeof committedSec === 'number' ? formatAbClockForDuration(committedSec, dur) : '';
          if (!curVal) {
            inputEl.value = tpl;
            setTimeout(() => {
              try {
                inputEl.setSelectionRange(0, 2);
              } catch (_eSel) {}
            }, 0);
          } else if (curVal === committedStr) {
            inputEl.dataset.abValidatedRaw = curVal;
          }
        });
        inputEl.addEventListener('click', () => {
          const val = String(inputEl.value || '');
          if (!/^\d{2}:\d{2}(:\d{2})?$/.test(val)) return;
          const pos = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : 0;
          const segStart = pos >= 6 ? 6 : pos >= 3 ? 3 : 0;
          try {
            inputEl.setSelectionRange(segStart, segStart + 2);
          } catch (_eClickSel) {}
        });
        const setCaretSafe = (pos) => {
          const apply = () => {
            try {
              inputEl.setSelectionRange(pos, pos);
            } catch (_eSet) {}
          };
          apply();
          setTimeout(apply, 0);
        };
        const applyMaskedDigits = (digitStr) => {
          const digitsOnly = String(digitStr || '').replace(/\D+/g, '');
          if (!digitsOnly) return false;
          const tpl = getAbTemplateForCurrentVideo();
          const slots = getAbDigitSlots(tpl);
          let masked = normalizeMaskedClockValue(inputEl.value, tpl);
          let rawPos = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : 0;
          const selEnd = typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : rawPos;
          if (selEnd > rawPos && rawPos === 0 && selEnd >= tpl.length - 1) {
            rawPos = 0;
          }
          for (let d = 0; d < digitsOnly.length; d++) {
            let slotIdx = slots.findIndex((s) => s >= rawPos);
            if (slotIdx === -1) slotIdx = slots.length - 1;
            const charPos = slots[slotIdx];
            const chars = masked.split('');
            chars[charPos] = digitsOnly[d];
            masked = chars.join('');
            rawPos = slotIdx < slots.length - 1 ? slots[slotIdx + 1] : tpl.length;
          }
          inputEl.value = masked;
          setCaretSafe(rawPos);
          return true;
        };

        inputEl.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.keyCode === 13) {
            ev.preventDefault();
            const ok = this.commitSingleAbInput(field, 'enter', { explicitConfirm: true });
            if (ok) {
              inputEl.blur();
            }
            return;
          }
          if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
          const tpl = getAbTemplateForCurrentVideo();
          const slots = getAbDigitSlots(tpl);
          if (/^[0-9]$/.test(ev.key)) {
            ev.preventDefault();
            applyMaskedDigits(ev.key);
            return;
          }
          if (ev.key === 'Backspace') {
            const cur = String(inputEl.value || '');
            if (/^\d{2}:\d{2}(:\d{2})?$/.test(cur)) {
              ev.preventDefault();
              const rawPos = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : cur.length;
              let prevSlotIdx = -1;
              for (let i = slots.length - 1; i >= 0; i--) {
                if (slots[i] < rawPos) {
                  prevSlotIdx = i;
                  break;
                }
              }
              if (prevSlotIdx === -1) prevSlotIdx = 0;
              const charPos = slots[prevSlotIdx];
              const chars = cur.split('');
              chars[charPos] = '0';
              inputEl.value = chars.join('');
              setCaretSafe(charPos);
            }
          }
        });
        inputEl.addEventListener('beforeinput', (ev) => {
          if (ev.inputType === 'insertText' && typeof ev.data === 'string' && /^[0-9]+$/.test(ev.data)) {
            ev.preventDefault();
            applyMaskedDigits(ev.data);
          }
        });
        inputEl.addEventListener('input', () => {
          const tpl = getAbTemplateForCurrentVideo();
          const cur = String(inputEl.value || '');
          const pos = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : cur.length;
          if (!cur) return;

          // Nếu đã đúng định dạng 03:00 và con trỏ vừa gõ xong 2 chữ số đầu (đang đứng ngay trước dấu :)
          // -> lập tức nhảy con trỏ qua dấu : (tới vị trí 3 hoặc 6) để gõ thẳng 2 chữ số tiếp theo trên Mobile!
          if (/^\d{2}:\d{2}(:\d{2})?$/.test(cur)) {
            if (pos === 2) {
              setCaretSafe(3);
            } else if (tpl.length === 8 && pos === 5) {
              setCaretSafe(6);
            }
            return;
          }

          if (cur.indexOf(':') !== -1) {
            const parts = cur.split(':').map((p) => p.replace(/\D+/g, ''));
            if (tpl.length === 5) {
              let p0 = parts[0] || '';
              let p1 = parts[1] || '';
              if (p0.length > 2) {
                const overflow = p0.slice(2);
                p0 = p0.slice(0, 2);
                p1 = (overflow + p1).slice(0, 2);
                inputEl.value = `${p0}:${p1.padEnd(2, '0')}`;
                setCaretSafe(Math.min(5, 3 + overflow.length));
              } else if (p1.length > 2) {
                inputEl.value = `${p0.padStart(2, '0')}:${p1.slice(0, 2)}`;
                setCaretSafe(Math.min(5, pos));
              }
            } else {
              let p0 = parts[0] || '';
              let p1 = parts[1] || '';
              let p2 = parts[2] || '';
              if (p0.length > 2) {
                const ov = p0.slice(2);
                p0 = p0.slice(0, 2);
                p1 = (ov + p1).slice(0, 2);
                inputEl.value = `${p0}:${p1.padEnd(2, '0')}:${p2.padEnd(2, '0').slice(0, 2)}`;
                setCaretSafe(Math.min(8, 3 + ov.length));
              } else if (p1.length > 2) {
                const ov = p1.slice(2);
                p1 = p1.slice(0, 2);
                p2 = (ov + p2).slice(0, 2);
                inputEl.value = `${p0.padStart(2, '0')}:${p1}:${p2.padEnd(2, '0')}`;
                setCaretSafe(Math.min(8, 6 + ov.length));
              } else if (p2.length > 2) {
                inputEl.value = `${p0.padStart(2, '0')}:${p1.padStart(2, '0')}:${p2.slice(0, 2)}`;
                setCaretSafe(Math.min(8, pos));
              }
            }
            return;
          }

          const digits = cur.replace(/\D+/g, '');
          if (!digits) return;
          const maxDigits = tpl.length === 8 ? 6 : 4;
          const clipped = digits.slice(0, maxDigits);
          const parts = [];
          for (let i = 0; i < clipped.length; i += 2) {
            parts.push(clipped.slice(i, i + 2));
          }
          if (clipped.length === 2 || (tpl.length === 8 && clipped.length === 4)) {
            inputEl.value = parts.join(':') + ':';
          } else {
            inputEl.value = parts.join(':');
          }
          setCaretSafe(inputEl.value.length);
        });
        inputEl.addEventListener('change', () => {
          this.commitSingleAbInput(field, 'change', { silentConfirmToast: true });
        });
        inputEl.addEventListener('blur', () => {
          const tpl = getAbTemplateForCurrentVideo();
          const curRaw = String(inputEl.value || '').trim();
          const prevCommitted = String(inputEl.dataset.abValidatedRaw || '').trim();
          const committedSec =
            field === 'A' ? this.playerCtrl.abLoop?.startSec : this.playerCtrl.abLoop?.endSec;
          if ((curRaw === tpl || curRaw === '00:00' || curRaw === '00:00:00') && typeof committedSec !== 'number' && !prevCommitted) {
            inputEl.value = '';
            return;
          }
          if (curRaw !== prevCommitted) {
            this.commitSingleAbInput(field, 'blur');
          }
        });
      });

      if (!this._abOutsideDocBound) {
        this._abOutsideDocBound = true;
        const onOutsidePointerOrTouch = (ev) => {
          const active = document.activeElement;
          if (!active || (active.id !== 'input-mod39-ab-start' && active.id !== 'input-mod39-ab-end')) {
            return;
          }
          const target = ev.target;
          if (target === active || (target && active.contains && active.contains(target))) {
            return;
          }
          const which = active.id === 'input-mod39-ab-start' ? 'A' : 'B';
          const targetBtn = target?.closest?.('button');
          if (
            targetBtn &&
            (targetBtn.id === 'btn-mod39-yt-ab-clear' ||
              (which === 'A' && targetBtn.id === 'btn-mod39-mark-a') ||
              (which === 'B' && targetBtn.id === 'btn-mod39-mark-b'))
          ) {
            return;
          }
          const curRaw = String(active.value || '').trim();
          const prevCommitted = String(active.dataset.abValidatedRaw || '').trim();
          if (curRaw !== prevCommitted) {
            this.commitSingleAbInput(which, 'outside-pointer');
          }
          const interactiveTarget = target?.closest?.('input, textarea, select, button, a, [tabindex]');
          if (!interactiveTarget) {
            try {
              active.blur();
            } catch (_) {
              // ignore blur error
            }
          }
        };
        document.addEventListener('pointerdown', onOutsidePointerOrTouch, true);
        document.addEventListener('touchstart', onOutsidePointerOrTouch, { capture: true, passive: true });
      }

      // Điều khiển Background Web YouTube
      const resolveActiveBgStage = () => NS.youtubeStudio?.bgStage || this.bgStage;
      document.getElementById('btn-mod39-set-web-bg')?.addEventListener('click', () => {
        let targetVideo = this.playerCtrl.activeVideo;
        if (!targetVideo) {
          const step2Input = document.getElementById(MOD39_CONSTANTS.STEP2_INPUT_ID);
          const cls = this.parser.classifyOmniboxInput(step2Input ? step2Input.value : '');
          if (cls.mode === 'URL' && cls.parsed?.valid) {
            this.playerCtrl.loadParsedVideo(cls.parsed);
            targetVideo = cls.parsed;
          }
        }
        resolveActiveBgStage().applyWebBackground(targetVideo, true);
      });
      document.getElementById('btn-mod39-clear-web-bg')?.addEventListener('click', () => {
        resolveActiveBgStage().clearWebBackground(true);
      });
      document.getElementById('btn-mod39-peek-bg')?.addEventListener('click', () => {
        const activeBgStage = resolveActiveBgStage();
        if (!activeBgStage.isWebBackgroundActive() && this.playerCtrl.activeVideo) {
          activeBgStage.applyWebBackground(this.playerCtrl.activeVideo, false);
        }
        const isPeeking = document.body?.classList?.toggle('noir-ambient-peek-mode');
        activeBgStage.syncFloatingPeekExitButton?.();
        safeNotify(
          isPeeking
            ? '👁️ Đang Soi Nền Video — bấm nút "Hiện Lại Giao Diện" ở góc trên phải (hoặc bấm lại Soi Nền) để khôi phục.'
            : '✨ Đã khôi phục độ rõ giao diện.',
          'info',
          2400
        );
      });

      const readRangeNumber = (id, fallback) => {
        const el = document.getElementById(id);
        return el && el.value !== '' ? Number(el.value) : fallback;
      };
      const onBgSliderChange = () => {
        const op = readRangeNumber('slider-mod39-bg-opacity', 72);
        const bl = readRangeNumber('slider-mod39-bg-blur', 2);
        const br = readRangeNumber('slider-mod39-bg-brightness', 62);
        this.bgStage.applyVisualFilters(op, bl, br, true, false);
        this.syncFilterReadoutLabelsFast(op, bl, br);
      };
      ['slider-mod39-bg-opacity', 'slider-mod39-bg-blur', 'slider-mod39-bg-brightness'].forEach((sid) => {
        document.getElementById(sid)?.addEventListener('input', onBgSliderChange);
      });

      document.getElementById('slider-mod39-ui-glass')?.addEventListener('input', (ev) => {
        const val = clampNumber(ev.target.value, 15, 95, 68);
        this.bgStage.applyUiGlassTransparency(val, true);
        this.syncFilterReadoutLabelsFast(undefined, undefined, undefined, val);
      });

      document.getElementById('toggle-mod39-bg-sound')?.addEventListener('change', (ev) => {
        this.bgStage.toggleBgSound(Boolean(ev.target.checked));
      });

      document.getElementById('btn-mod39-system-pip')?.addEventListener('click', () => {
        this.playerCtrl.requestSystemPiP();
      });

      document.getElementById('btn-mod39-download-ytsave')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        this.downloadActiveYoutubeViaYtSave();
      });

      const bindMod39Accordion = (btnId, bodyId) => {
        const btn = document.getElementById(btnId);
        const bodyEl = document.getElementById(bodyId);
        if (!btn || !bodyEl) return;
        btn.addEventListener('click', () => {
          const willOpen = bodyEl.classList.contains('hidden');
          bodyEl.classList.toggle('hidden', !willOpen);
          const lbl = willOpen ? '▲ Thu gọn' : '▼ Mở rộng';
          btn.textContent = NS.i18n?.translateText?.(lbl) || lbl;
        });
      };
      bindMod39Accordion('btn-mod39-toggle-controls-deck', 'mod39-controls-collapsible-body');
      bindMod39Accordion('btn-mod39-toggle-ab-loop-box', 'mod39-left-ab-loop-body');

      document.getElementById('mod39-native-video-host')?.addEventListener('click', (ev) => {
        if (!NS.nativePlayer?.isActive?.() || NS.nativePlayer?.mode !== 'video') return;
        ev.preventDefault();
        this.playerCtrl.togglePlayPause();
      });

      const audioStageEl = document.getElementById('mod39-audio-only-stage');
      if (audioStageEl) {
        audioStageEl.addEventListener('click', (ev) => {
          if (ev.target && ev.target.closest && ev.target.closest('#btn-mod39-optin-iframe-visual')) return;
          if (this.playerCtrl?.activeEngine !== 'MOD21_AUDIO') return;
          ev.preventDefault();
          this.playerCtrl.togglePlayPause();
        });
        audioStageEl.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            if (ev.target && ev.target.closest && ev.target.closest('#btn-mod39-optin-iframe-visual')) return;
            ev.preventDefault();
            this.playerCtrl.togglePlayPause();
          }
        });
      }

      document.getElementById('btn-mod39-bg-mode-toggle')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        NS.unlockExternalAudioGesture?.();
        NS.nativePlayer?.unlockPlaybackGesture?.();
        NS.audioBackgroundBridge?.activateKeepAlive?.('youtube');
        this.playerCtrl?.mobileBgAudio?.switchBetweenAudioBridgeAndVideo?.();
      });

      document.getElementById('btn-mod39-optin-iframe-visual')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (!this.playerCtrl?.activeVideo || !this.playerCtrl?.mobileBgAudio) return;
        NS.unlockExternalAudioGesture?.();
        NS.nativePlayer?.unlockPlaybackGesture?.();
        this.playerCtrl.mobileBgAudio._explicitIframeVisualForSession = true;
        this.playerCtrl.mobileBgAudio.switchBetweenAudioBridgeAndVideo(true);
      });

      document.getElementById('btn-mod39-toggle-stream-config')?.addEventListener('click', () => {
        const drawer = document.getElementById('mod39-stream-config-drawer');
        const hostInput = document.getElementById('input-mod39-custom-stream-host');
        if (drawer) {
          drawer.classList.toggle('hidden');
          if (!drawer.classList.contains('hidden') && hostInput) {
            hostInput.value = NS.streamFetcher?.getCustomInstanceUrl?.() || '';
          }
        }
      });

      document.getElementById('btn-mod39-save-stream-host')?.addEventListener('click', () => {
        const hostInput = document.getElementById('input-mod39-custom-stream-host');
        const saved = NS.streamFetcher?.setCustomInstanceUrl?.(hostInput ? hostInput.value : '') || '';
        if (hostInput) hostInput.value = saved;
        safeNotify(
          saved ? `✅ Đã lưu server nguồn luồng riêng: ${saved}` : '🔄 Đã xóa server riêng, dùng cụm mặc định.',
          saved ? 'success' : 'info',
          2400
        );
        if (this.playerCtrl.activeVideo?.videoId) {
          this.playerCtrl.loadParsedVideo(
            { ...this.playerCtrl.activeVideo, valid: true },
            { forceReload: true }
          );
        }
      });

      document.getElementById('btn-mod39-reset-stream-host')?.addEventListener('click', () => {
        const hostInput = document.getElementById('input-mod39-custom-stream-host');
        NS.streamFetcher?.setCustomInstanceUrl?.('');
        if (hostInput) hostInput.value = '';
        safeNotify('🔄 Đã khôi phục danh sách server mặc định.', 'info', 2000);
      });

      document.getElementById('btn-mod39-copy-worker-code')?.addEventListener('click', async () => {
        const code = NS.streamFetcher?.getWorkerTemplateCode?.() || '';
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code);
          safeNotify(
            '📋 Đã copy code Cloudflare Worker! Dán vào Cloudflare Workers -> Deploy -> Dán URL *.workers.dev vào ô trên.',
            'success',
            4500
          );
        } catch (_e) {
          safeNotify('⚠️ Không copy tự động được — hãy cấp quyền Clipboard hoặc dùng trình duyệt HTTPS.', 'warning', 3200);
        }
      });
    }

    async downloadActiveYoutubeViaYtSave() {
      const video = this.playerCtrl?.activeVideo;
      const vid = String(video?.videoId || '').trim();
      const plId = String(video?.playlistId || '').trim();
      const rawWatchUrl = String(video?.watchUrl || '').trim();
      const hasValidActiveYoutube = Boolean(
        video &&
        (vid || plId || /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(rawWatchUrl))
      );
      if (!hasValidActiveYoutube) {
        safeNotify(
          '⚠️ Bạn đang chưa xem video YouTube nào! Hãy chọn hoặc tìm một video YouTube trước nhé.',
          'warning',
          3200
        );
        return { ok: false, reason: 'no-active-video' };
      }

      const watchUrl =
        rawWatchUrl && /^https?:\/\//i.test(rawWatchUrl)
          ? rawWatchUrl
          : vid
            ? `https://www.youtube.com/watch?v=${vid}`
            : `https://www.youtube.com/playlist?list=${plId}`;

      let copiedOk = false;
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(watchUrl);
          copiedOk = true;
        }
      } catch (_eClip) {}

      if (!copiedOk && typeof document !== 'undefined' && document.body) {
        try {
          const ta = document.createElement('textarea');
          ta.value = watchUrl;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.top = '-9999px';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          if (typeof document.execCommand === 'function') {
            copiedOk = Boolean(document.execCommand('copy'));
          }
          document.body.removeChild(ta);
        } catch (_eFallbackClip) {
          copiedOk = true;
        }
      }

      this._lastCopiedYtSaveUrl = watchUrl;
      const ytsaveUrl = 'https://ytsave.to/';
      this._lastOpenedYtSaveTarget = ytsaveUrl;

      // Nếu người dùng đã bật "Điều hướng thẳng tới YTSave" từ trước -> mở thẳng không hiện cửa sổ nữa
      const directRedirectPref = safeStorageGet(MOD39_CONSTANTS.STORAGE_KEYS.YTSAVE_DIRECT_REDIRECT);
      if (directRedirectPref === '1') {
        safeNotify('✅ Đã copy link thành công — Đang điều hướng thẳng tới YTSave!', 'success', 3000);
        try {
          if (typeof global.open === 'function') {
            global.open(ytsaveUrl, '_blank', 'noopener,noreferrer');
          }
        } catch (_eOpenDirect) {}
        return {
          ok: true,
          copied: Boolean(copiedOk),
          directRedirect: true,
          watchUrl,
          ytsaveUrl
        };
      }

      safeNotify('✅ Đã copy link thành công, chờ bạn dán link vào ytsave', 'success', 3600);

      // Mặc định CHỈ hiện cửa sổ hướng dẫn trực quan, KHÔNG tự nhảy thẳng sang trang YTSave
      try {
        this.openYtSaveGuideModal(watchUrl, ytsaveUrl);
      } catch (_eGuide) {}

      return {
        ok: true,
        copied: Boolean(copiedOk),
        directRedirect: false,
        watchUrl,
        ytsaveUrl
      };
    }

    openYtSaveGuideModal(watchUrl, ytsaveUrl = 'https://ytsave.to/') {
      if (typeof document === 'undefined' || !document.body) return null;
      const existing = document.getElementById('mod39-ytsave-guide-modal');
      if (existing) existing.remove();

      if (!document.getElementById('mod39-ytsave-blink-style')) {
        const st = document.createElement('style');
        st.id = 'mod39-ytsave-blink-style';
        st.textContent = [
          '@keyframes mod39YtSavePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.85), 0 0 14px rgba(239,68,68,.55); transform: scale(1); } 50% { box-shadow: 0 0 0 7px rgba(239,68,68,0), 0 0 24px rgba(251,191,36,.95); transform: scale(1.04); } }',
          '@keyframes mod39YtOpenSuperBlink { 0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,.95), 0 0 18px rgba(244,63,94,.85); filter: brightness(1); transform: scale(1); } 50% { box-shadow: 0 0 0 10px rgba(251,191,36,0), 0 0 32px rgba(251,191,36,1); filter: brightness(1.18); transform: scale(1.06); } }',
          '.mod39-ytsave-dl-blink { animation: mod39YtSavePulse 1.25s ease-in-out infinite; }',
          '.mod39-ytsave-open-super-blink { animation: mod39YtOpenSuperBlink 1.05s ease-in-out infinite; }'
        ].join('\n');
        document.head.appendChild(st);
      }

      const escHtml = (s) =>
        String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

      const modal = document.createElement('div');
      modal.id = 'mod39-ytsave-guide-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'fixed inset-0 z-[190] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto';

      modal.innerHTML = `
        <div class="my-auto w-full max-w-xl rounded-2xl border-2 border-amber-400/75 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-amber-950/70 via-rose-950/50 to-zinc-950 flex items-center justify-between gap-2">
            <div class="font-extrabold text-sm text-amber-300 flex items-center gap-2">
              <span>📥 Hướng Dẫn Tải Video / MP3 Tại YTSave</span>
            </div>
            <button type="button" id="btn-mod39-close-ytsave-guide" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-100 font-extrabold transition">✕</button>
          </div>
          <div class="p-4 space-y-3.5">
            <div class="p-3 rounded-xl border border-emerald-500/45 bg-emerald-950/30 text-emerald-100 leading-relaxed font-semibold">
              ✅ Link YouTube đã được tự động sao chép sẵn vào bộ nhớ tạm! Bạn chỉ cần <strong>Dán (Ctrl+V / bấm Paste)</strong> vào ô tải của YTSave rồi bấm <strong>Download</strong>.
            </div>

            <!-- Mô phỏng trực quan ô Paste link & nút Download nhấp nháy của YTSave -->
            <div class="p-3.5 rounded-xl border border-zinc-800 bg-[#1a1a1d] space-y-2.5 shadow-inner">
              <div class="text-center space-y-0.5">
                <div class="text-sm font-black tracking-tight text-white">YouTube Video Downloader</div>
                <div class="text-[10.5px] text-zinc-400">👀 Mô phỏng ô dán link &amp; nút Download trên trang YTSave</div>
              </div>
              <div class="p-2.5 rounded-xl bg-[#242428] border border-zinc-700/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div class="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#323237] border border-zinc-600/80 text-zinc-300 font-mono text-[11px]">
                  <span class="truncate">🔗 youtube.com/watch?v=...</span>
                  <span class="px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-200 font-sans font-bold text-[10.5px] shrink-0">📋 Paste</span>
                </div>
                <div class="flex flex-col items-center sm:items-end shrink-0 gap-1">
                  <span class="mod39-ytsave-dl-blink w-full sm:w-auto text-center px-4 py-2 rounded-lg bg-red-600 text-white font-extrabold text-xs tracking-wide select-none">⬇ Download</span>
                </div>
              </div>
              <div class="text-[10.5px] text-amber-200/90 text-center sm:text-right font-semibold pr-1">
                Enter ở máy tính hoặc bấm vào nút Download ở điện thoại nha
              </div>
            </div>

            <div class="flex items-center gap-1.5 p-2 rounded-xl border border-zinc-800 bg-zinc-900/80">
              <input type="text" id="mod39-ytsave-guide-url-input" readonly value="${escHtml(watchUrl)}" class="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-sky-300 focus:outline-none select-all" />
              <button type="button" id="btn-mod39-ytsave-recopy" class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold shrink-0 transition">📋 Sao chép lại</button>
            </div>

            <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                id="btn-mod39-ytsave-direct-always"
                class="px-3 py-2 rounded-xl border border-sky-500/50 bg-sky-950/45 hover:bg-sky-900/60 text-sky-200 font-bold text-[11px] text-left sm:text-center leading-snug transition flex-1 min-w-[200px]"
              >⚡ Điều hướng thẳng tới YTSave (Bạn sẽ không thấy cửa sổ này hiện lên ở lần sau)</button>
              <div class="flex flex-wrap items-center justify-end gap-2 shrink-0">
                <a href="${escHtml(ytsaveUrl)}" target="_blank" rel="noopener noreferrer" id="btn-mod39-ytsave-reopen" class="mod39-ytsave-open-super-blink px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs shadow-lg border-2 border-amber-200/80 transition inline-flex items-center justify-center gap-1.5">
                  <span>🚀 Mở YTSave Ngay ↗</span>
                </a>
                <button type="button" id="btn-mod39-ytsave-guide-done" class="px-3 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-bold transition">
                  Đã hiểu, đóng lại
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      if (NS.i18n?.translateElement) {
        NS.i18n.translateElement(modal);
      }

      const closeModal = () => {
        try { modal.remove(); } catch (_e) {}
      };
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) closeModal();
      });
      modal.querySelector('#btn-mod39-close-ytsave-guide')?.addEventListener('click', closeModal);
      modal.querySelector('#btn-mod39-ytsave-guide-done')?.addEventListener('click', closeModal);
      modal.querySelector('#btn-mod39-ytsave-direct-always')?.addEventListener('click', () => {
        safeStorageSet(MOD39_CONSTANTS.STORAGE_KEYS.YTSAVE_DIRECT_REDIRECT, '1');
        closeModal();
        safeNotify('⚡ Đã bật điều hướng thẳng tới YTSave cho các lần tải sau!', 'success', 3000);
        try {
          if (typeof global.open === 'function') {
            global.open(ytsaveUrl, '_blank', 'noopener,noreferrer');
          }
        } catch (_eOpenAlways) {}
      });
      modal.querySelector('#btn-mod39-ytsave-recopy')?.addEventListener('click', async () => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(watchUrl);
          } else {
            const inp = modal.querySelector('#mod39-ytsave-guide-url-input');
            inp?.select?.();
            document.execCommand?.('copy');
          }
          safeNotify('✅ Đã copy link thành công, chờ bạn dán link vào ytsave', 'success', 2600);
        } catch (_e) {}
      });
      return modal;
    }

    commitSingleAbInput(field, triggerReason = 'manual', options = {}) {
      if (this.playerCtrl?.isVideoLiveStream?.()) {
        safeNotify(
          '🔒 Video đang phát trực tiếp (LIVE) nên không thể nhập hoặc lặp 1 phần (A–B)!',
          'warning',
          3000
        );
        this.syncDynamicUi();
        return false;
      }
      const isStart = field === 'A';
      const el = document.getElementById(isStart ? 'input-mod39-ab-start' : 'input-mod39-ab-end');
      if (!el || !this.playerCtrl) return false;
      const raw = String(el.value || '').trim();
      const prevSec = isStart ? this.playerCtrl.abLoop?.startSec : this.playerCtrl.abLoop?.endSec;
      const prevStr = typeof prevSec === 'number' ? formatSecondsToClock(prevSec) : '';
      const parsed = parseAbTimeInput(raw);

      if (parsed.kind === 'INVALID') {
        const msg = `Mốc ${field} ("${raw}") sai định dạng thời gian. Hãy nhập dạng MM:SS (ví dụ 01:25) hoặc số giây hợp lệ!`;
        this.playerCtrl._abValidationState = { type: 'error', field, message: msg };
        safeNotify(`❌ ${msg}`, 'error', 3400);
        el.value = prevStr;
        el.dataset.abValidatedRaw = prevStr;
        this.syncDynamicUi();
        return false;
      }

      if (parsed.kind === 'EMPTY') {
        const nextA = isStart ? null : this.playerCtrl.abLoop.startSec;
        const nextB = isStart ? this.playerCtrl.abLoop.endSec : null;
        const res = this.playerCtrl.setAbLoopBounds(nextA, nextB, false);
        el.dataset.abValidatedRaw = '';
        if (options.explicitConfirm && res.ok) {
          safeNotify(`🧹 Đã xóa Mốc ${field}`, 'info', 1600);
        }
        return Boolean(res.ok);
      }

      const nextA = isStart ? parsed.seconds : this.playerCtrl.abLoop.startSec;
      const nextB = isStart ? this.playerCtrl.abLoop.endSec : parsed.seconds;
      const res = this.playerCtrl.setAbLoopBounds(
        nextA,
        nextB,
        this.playerCtrl.abLoop.enabled,
        { confirmField: field }
      );
      if (!res.ok) {
        el.value = prevStr;
        el.dataset.abValidatedRaw = prevStr;
        this.syncDynamicUi();
        return false;
      }

      const formatted = formatSecondsToClock(parsed.seconds);
      el.value = formatted;
      el.dataset.abValidatedRaw = formatted;
      if (
        !options.silentConfirmToast &&
        (options.explicitConfirm || triggerReason === 'outside-pointer' || triggerReason === 'blur')
      ) {
        safeNotify(`✅ Đã xác nhận Mốc ${field} = ${formatted}`, 'success', 2000);
      }
      return true;
    }

    syncAbInputsIntoControllerBeforeToggle() {
      if (this.playerCtrl?.isVideoLiveStream?.()) {
        this.syncDynamicUi();
        return false;
      }
      const aEl = document.getElementById('input-mod39-ab-start');
      const bEl = document.getElementById('input-mod39-ab-end');
      const aRaw = String(aEl?.value || '').trim();
      const bRaw = String(bEl?.value || '').trim();
      const aParsed = parseAbTimeInput(aRaw);
      const bParsed = parseAbTimeInput(bRaw);

      if (aParsed.kind === 'INVALID') {
        this.commitSingleAbInput('A', 'sync-toggle');
        return false;
      }
      if (bParsed.kind === 'INVALID') {
        this.commitSingleAbInput('B', 'sync-toggle');
        return false;
      }

      const nextStart = aParsed.kind === 'VALID' ? aParsed.seconds : null;
      const nextEnd = bParsed.kind === 'VALID' ? bParsed.seconds : null;
      const res = this.playerCtrl.setAbLoopBounds(
        nextStart,
        nextEnd,
        this.playerCtrl.abLoop.enabled
      );
      if (!res.ok) {
        const curA = this.playerCtrl.abLoop?.startSec;
        const curB = this.playerCtrl.abLoop?.endSec;
        if (aEl) {
          aEl.value = typeof curA === 'number' ? formatSecondsToClock(curA) : '';
          aEl.dataset.abValidatedRaw = aEl.value;
        }
        if (bEl) {
          bEl.value = typeof curB === 'number' ? formatSecondsToClock(curB) : '';
          bEl.dataset.abValidatedRaw = bEl.value;
        }
        this.syncDynamicUi();
        return false;
      }

      if (aEl) {
        const fmtA = nextStart !== null ? formatSecondsToClock(nextStart) : '';
        aEl.value = fmtA;
        aEl.dataset.abValidatedRaw = fmtA;
      }
      if (bEl) {
        const fmtB = nextEnd !== null ? formatSecondsToClock(nextEnd) : '';
        bEl.value = fmtB;
        bEl.dataset.abValidatedRaw = fmtB;
      }
      return true;
    }

    restoreSavedVideoIfAny() {
      const saved = this.playerCtrl.activeVideo;
      if (saved && (saved.videoId || saved.playlistId)) {
        const isLiveSaved = Boolean(saved.isLive || this.playerCtrl.isVideoLiveStream());
        this.bridge.lastKnownIsLive = isLiveSaved;
        if (isLiveSaved) {
          if (this.playerCtrl.prefs.repeatMode) {
            this.playerCtrl.prefs.repeatMode = false;
            this.vault.savePlayerPrefs(this.playerCtrl.prefs);
          }
          if (
            this.playerCtrl.abLoop?.enabled ||
            typeof this.playerCtrl.abLoop?.startSec === 'number' ||
            typeof this.playerCtrl.abLoop?.endSec === 'number'
          ) {
            this.playerCtrl.abLoop = { startSec: null, endSec: null, enabled: false };
            this.vault.saveAbLoopForVideo(saved.key, this.playerCtrl.abLoop);
          }
        }
        const step2Input = document.getElementById(MOD39_CONSTANTS.STEP2_INPUT_ID);
        if (step2Input && saved.watchUrl) {
          step2Input.value = saved.watchUrl;
        }
        const isHttpOriginBoot =
          typeof global.location !== 'undefined' && /^https?:$/i.test(String(global.location.protocol || ''));
        if (
          !isDesktopDirectYoutubeEnv() &&
          !isLiveSaved &&
          saved.videoId &&
          isHttpOriginBoot &&
          !global.navigator?.webdriver &&
          !global.__MOD39_DISABLE_AUTO_RESOLVE__
        ) {
          this.playerCtrl._userDesiredPaused = true;
          this.playerCtrl.prefs.audioOnlyMode = false;
          this.playerCtrl._engineSessionId = (this.playerCtrl._engineSessionId || 0) + 1;
          const bootSessionId = this.playerCtrl._engineSessionId;
          const cachedBootStream = NS.streamFetcher?.readCache?.(saved.videoId);
          this.playerCtrl.activeEngine = 'RESOLVING_STREAM';
          this.playerCtrl.mobileBgAudio?._silenceForegroundIframeForNativeTakeover?.();
          this.playerCtrl.startPollingLoop();
          if (cachedBootStream && cachedBootStream.ok && !cachedBootStream.fallback && (cachedBootStream.audioStreamUrl || cachedBootStream.videoStreamUrl)) {
            this.playerCtrl.mobileBgAudio?.onVideoLoaded(saved, {
              sessionId: bootSessionId,
              useMod21AudioBridge: true,
              cachedStream: cachedBootStream,
              autoplay: false
            });
          } else {
            this.playerCtrl.mobileBgAudio?.onVideoLoaded(saved, {
              sessionId: bootSessionId,
              resolvingPreferred: true,
              autoplay: false
            });
          }
          return;
        }
        // Nạp lại khung embed ở trạng thái không tự phát ồn khi vừa tải lại trang
        const iframeEl = document.getElementById(this.bridge.mainIframeId);
        if (iframeEl) {
          this.bridge.ensureMessageBridgeAttached();
          const gen = ++this.bridge._fgMountGeneration;
          this.bridge._fgIframeAcked = false;
          this.bridge._fgIframeDomLoaded = false;
          this.bridge.playerReady = false;
          this.bridge._ytApiReady = false;
          this.bridge._ytApiAttachInFlight = false;
          this.bridge.assumedAutoplaying = false;
          this.bridge._fgMountAtMs = Date.now();
          this.bridge._lastUserSeekAtMs = (saved.startSeconds || 0) > 0 ? Date.now() : 0;
          this.bridge.lastKnownTime = saved.startSeconds || 0;
          this.bridge.lastKnownState = MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED;
          this.playerCtrl._resetForegroundTrackingBaseline(
            saved.startSeconds || 0,
            MOD39_CONSTANTS.YT_PLAYER_STATES.PAUSED,
            saved.videoId || ''
          );
          const url = this.parser.buildPrivacyEmbedUrl({
            videoId: saved.videoId,
            playlistId: saved.playlistId,
            startSeconds: saved.startSeconds || 0,
            autoplay: false,
            loop: !isLiveSaved && Boolean(this.playerCtrl.prefs.repeatMode),
            muted: Boolean(this.playerCtrl.prefs.muted),
            controls: true,
            forBackground: false
          });
          iframeEl.onload = () => {
            if (gen !== this.bridge._fgMountGeneration) return;
            this.bridge._fgIframeDomLoaded = true;
            this.bridge.startListeningHandshake(iframeEl, 1, gen);
            this.bridge.attachYtPlayerApiToExistingIframe(this.playerCtrl.prefs, gen);
          };
          iframeEl.setAttribute('src', url);
          this.playerCtrl.startPollingLoop();
        }
        if (
          !isLiveSaved &&
          saved.videoId &&
          !global.navigator?.webdriver &&
          this.searcher &&
          typeof this.searcher.probeVideoLiveMetadata === 'function'
        ) {
          this.searcher
            .probeVideoLiveMetadata(saved.videoId)
            .then((probe) => {
              if (
                probe?.found &&
                probe.isLive &&
                this.playerCtrl.activeVideo &&
                String(this.playerCtrl.activeVideo.videoId || '') === String(saved.videoId)
              ) {
                this.playerCtrl._applyLiveStreamLoopLock(saved.videoId, true, {
                  source: 'restore-probe',
                  announce: true
                });
              }
            })
            .catch(() => {});
        }
      }
    }

    syncDynamicUi() {
      if (typeof document === 'undefined') return;
      const panel = this.getPanelContainer();
      if (!panel) return;

      // Sub-tab highlighting & panel visibility
      panel.querySelectorAll('.mod39-subtab-btn').forEach((btn) => {
        const key = btn.getAttribute('data-mod39-subtab');
        const isActive = key === this.activeTab;
        btn.className = isActive
          ? 'mod39-subtab-btn px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/60 bg-rose-500/20 text-rose-200 transition'
          : 'mod39-subtab-btn px-3 py-2 rounded-xl text-xs font-bold border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white transition';
      });

      document.getElementById('mod39-subview-player')?.classList.toggle('hidden', this.activeTab !== 'PLAYER');
      document.getElementById('mod39-subview-favorites')?.classList.toggle('hidden', this.activeTab !== 'FAVORITES');
      document.getElementById('mod39-subview-discover')?.classList.toggle('hidden', this.activeTab !== 'DISCOVER');

      const favs = this.vault.loadFavoriteVideos();
      const favCountEl = document.getElementById('mod39-fav-count');
      if (favCountEl) favCountEl.textContent = String(favs.length);

      const hasVideo = Boolean(this.playerCtrl.activeVideo);
      const isLive = hasVideo && Boolean(this.playerCtrl.isVideoLiveStream());
      document.getElementById('mod39-empty-stage-card')?.classList.toggle('hidden', hasVideo);
      document.getElementById('btn-mod39-stop-clear-video')?.classList.toggle('hidden', !hasVideo);

      const trText = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      if (hasVideo) {
        const v = this.playerCtrl.activeVideo;
        const step2Input = document.getElementById(MOD39_CONSTANTS.STEP2_INPUT_ID);
        if (step2Input && document.activeElement !== step2Input && v.watchUrl && !step2Input.value) {
          step2Input.value = v.watchUrl;
        }

        const titleEl = document.getElementById('mod39-active-video-title');
        if (titleEl) titleEl.textContent = v.title || trText('Video YouTube');

        const metaEl = document.getElementById('mod39-active-video-meta');
        if (metaEl) {
          const metaParts = [
            isLive ? trText('🔴 Luồng phát trực tiếp (LIVE — Khóa lặp)') : null,
            v.playlistId ? `Playlist: ${v.playlistId}` : null
          ].filter(Boolean);
          metaEl.textContent = metaParts.join(' • ');
          metaEl.classList.toggle('hidden', metaParts.length === 0);
        }

        const origLink = document.getElementById('link-mod39-open-original');
        if (origLink && v.watchUrl) origLink.href = v.watchUrl;

        const favBtn = document.getElementById('btn-mod39-toggle-favorite');
        if (favBtn) {
          const isFav = this.vault.isFavorite(v.key);
          favBtn.textContent = trText(isFav ? '★ Đã Ghim Yêu Thích' : '☆ Lưu Yêu Thích');
        }
      } else {
        const titleEl = document.getElementById('mod39-active-video-title');
        if (titleEl) titleEl.textContent = trText('Rạp YouTube Tối Giản — Sẵn sàng nhận đường dẫn');

        const metaEl = document.getElementById('mod39-active-video-meta');
        if (metaEl) {
          metaEl.textContent = trText(
            'youtube-nocookie.com • Toàn màn hình & Pseudo-Fullscreen • Repeat • A–B Loop • Phủ Background Web 16:9'
          );
        }

        const origLink = document.getElementById('link-mod39-open-original');
        if (origLink) origLink.href = MOD39_CONSTANTS.YOUTUBE_HOME_URL;

        const favBtn = document.getElementById('btn-mod39-toggle-favorite');
        if (favBtn) favBtn.textContent = trText('☆ Lưu Yêu Thích');

        const badgeEl = document.getElementById('mod39-player-state-badge');
        if (badgeEl) badgeEl.textContent = trText('Chờ link YouTube');
      }

      // Error / file:// fallback banner (hiện ngay nếu bị lỗi 101/150/153 hoặc đang chạy file://)
      const fallbackBanner = document.getElementById('mod39-embed-fallback-banner');
      if (fallbackBanner) {
        const errCode = this.bridge.lastErrorCode;
        const isFileProtocol =
          typeof global.location !== 'undefined' && global.location.protocol === 'file:';
        const showBanner = Boolean(errCode || isFileProtocol);
        fallbackBanner.classList.toggle('hidden', !showBanner);
        if (showBanner) {
          const errTitle = document.getElementById('mod39-embed-error-title');
          const errDetail = document.getElementById('mod39-embed-error-detail');
          const watchLink = document.getElementById('link-mod39-fallback-watch');
          if (watchLink && this.playerCtrl.activeVideo?.watchUrl) {
            watchLink.href = this.playerCtrl.activeVideo.watchUrl;
          }
          if (errCode) {
            if (errTitle) errTitle.textContent = trText(`YouTube báo mã hạn chế nhúng #${errCode}`);
            if (errDetail) {
              errDetail.textContent = trText(
                YOUTUBE_ERROR_EXPLANATIONS[errCode] ||
                  `Không thể phát video qua iframe (Mã lỗi ${errCode}). Bạn hãy bấm nút bên dưới để mở trực tiếp trên YouTube.`
              );
            }
          } else if (isFileProtocol) {
            if (errTitle) errTitle.textContent = trText('Đang chạy file HTML trực tiếp từ ổ cứng (file://)');
            if (errDetail) {
              errDetail.textContent = trText(
                'Một số video YouTube yêu cầu trang chạy qua localhost/HTTPS để nhận Referrer hợp lệ (tránh lỗi Error 153). Nếu khung trên báo lỗi, bạn có thể chạy bằng server cục bộ hoặc bấm mở thẳng sang YouTube.'
              );
            }
          }
        }
      }

      // Sync nút Play/Pause, Repeat, Speed, Mute, Volume (chỉ ghi DOM khi giá trị thực sự đổi để chống giật nháy)
      const setTxtIf = (el, v) => {
        if (el && el.textContent !== v) el.textContent = v;
      };
      const setClsIf = (el, c) => {
        if (el && el.className !== c) el.className = c;
      };
      const setAttrIf = (el, k, v) => {
        if (el && el.getAttribute(k) !== v) el.setAttribute(k, v);
      };
      const prefs = this.playerCtrl.prefs;
      const playPauseBtn = document.getElementById('btn-mod39-play-pause');
      const liveSnap = this.bridge.getCurrentPlaybackSnapshot();
      const isPlayingUi =
        Boolean(this.playerCtrl.activeVideo) &&
        (liveSnap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.PLAYING ||
          ((liveSnap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.UNSTARTED ||
            liveSnap.state === MOD39_CONSTANTS.YT_PLAYER_STATES.BUFFERING) &&
            Boolean(this.bridge.assumedAutoplaying)));
      if (playPauseBtn) {
        const nextPlayTxt = !this.playerCtrl.activeVideo
          ? trText('▶ / ⏸ Phát - Dừng')
          : trText(isPlayingUi ? '⏸ Tạm dừng' : '▶ Phát tiếp');
        setTxtIf(playPauseBtn, nextPlayTxt);
      }
      const miniPlayPauseBtn = document.getElementById('btn-mod39-mini-playpause');
      if (miniPlayPauseBtn) {
        setTxtIf(miniPlayPauseBtn, this.playerCtrl.activeVideo ? (isPlayingUi ? '⏸' : '▶') : '▶/⏸');
      }

      const repBtn = document.getElementById('btn-mod39-yt-repeat');
      if (repBtn) {
        if (repBtn.disabled !== isLive) repBtn.disabled = isLive;
        setAttrIf(repBtn, 'aria-disabled', isLive ? 'true' : 'false');
        if (isLive) {
          setTxtIf(repBtn, trText('🔒 Lặp: Đã khóa (LIVE)'));
          const tLive = trText('Video đang phát trực tiếp (LIVE) nên không thể lặp toàn video');
          if (repBtn.title !== tLive) repBtn.title = tLive;
          setClsIf(
            repBtn,
            'px-2.5 py-2 rounded-xl border border-rose-500/45 bg-rose-950/50 text-rose-200/85 text-xs font-bold opacity-80 cursor-not-allowed shrink-0 whitespace-nowrap inline-flex items-center justify-center'
          );
        } else {
          const tNorm = trText('Bật/Tắt lặp lại toàn bộ video hiện tại');
          if (repBtn.title !== tNorm) repBtn.title = tNorm;
          setTxtIf(repBtn, trText(prefs.repeatMode ? '🔁 Lặp: ĐANG BẬT' : '🔁 Lặp: Tắt'));
          setClsIf(
            repBtn,
            prefs.repeatMode
              ? 'px-2.5 py-2 rounded-xl border border-emerald-400 bg-emerald-600/80 text-white text-xs font-extrabold shadow shrink-0 whitespace-nowrap inline-flex items-center justify-center'
              : 'px-2.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold shrink-0 whitespace-nowrap inline-flex items-center justify-center'
          );
        }
      }

      const liveLockNotice = document.getElementById('mod39-live-loop-lock-notice');
      if (liveLockNotice) {
        liveLockNotice.classList.toggle('hidden', !isLive);
      }

      const speedSel = document.getElementById('select-mod39-speed');
      if (speedSel) speedSel.value = String(prefs.speed);

      const muteBtn = document.getElementById('btn-mod39-mute');
      if (muteBtn) muteBtn.textContent = prefs.muted || prefs.volume === 0 ? '🔇' : '🔊';

      const volSlider = document.getElementById('slider-mod39-volume');
      if (volSlider) volSlider.value = String(prefs.volume);
      const volLabel = document.getElementById('mod39-volume-label');
      if (volLabel) volLabel.textContent = prefs.muted ? trText('Tắt') : `${prefs.volume}%`;

      // Sync A-B Loop controls (khóa toàn bộ khi là luồng phát trực tiếp LIVE)
      const ab = this.playerCtrl.abLoop;
      const vState = this.playerCtrl._abValidationState || null;
      const aInput = document.getElementById('input-mod39-ab-start');
      const bInput = document.getElementById('input-mod39-ab-end');
      const markABtn = document.getElementById('btn-mod39-mark-a');
      const markBBtn = document.getElementById('btn-mod39-mark-b');
      const abClearBtn = document.getElementById('btn-mod39-yt-ab-clear');
      const abLiveBanner = document.getElementById('mod39-ab-live-lock-banner');

      if (abLiveBanner) {
        abLiveBanner.classList.toggle('hidden', !isLive);
      }

      const activeDurForAb = Number(this.bridge?.lastKnownDuration) || 0;
      const abHourMode = activeDurForAb >= 3600;
      const defaultPlaceholderA = abHourMode ? '00:00:00' : '00:00';
      const defaultPlaceholderB = abHourMode ? '00:00:00' : '00:00';

      if (aInput) {
        aInput.disabled = isLive;
        aInput.setAttribute('aria-disabled', isLive ? 'true' : 'false');
        aInput.placeholder = isLive ? trText('Khóa (LIVE)') : defaultPlaceholderA;
        if (isLive) {
          aInput.value = '';
          aInput.dataset.abValidatedRaw = '';
        } else if (document.activeElement !== aInput) {
          aInput.value =
            typeof ab.startSec === 'number'
              ? formatAbClockForDuration(ab.startSec, activeDurForAb)
              : '';
          aInput.dataset.abValidatedRaw = aInput.value;
        }
      }
      if (bInput) {
        bInput.disabled = isLive;
        bInput.setAttribute('aria-disabled', isLive ? 'true' : 'false');
        bInput.placeholder = isLive ? trText('Khóa (LIVE)') : defaultPlaceholderB;
        if (isLive) {
          bInput.value = '';
          bInput.dataset.abValidatedRaw = '';
        } else if (document.activeElement !== bInput) {
          bInput.value =
            typeof ab.endSec === 'number'
              ? formatAbClockForDuration(ab.endSec, activeDurForAb)
              : '';
          bInput.dataset.abValidatedRaw = bInput.value;
        }
      }

      const baseAbInputClass = isLive
        ? 'w-full min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-900/70 border border-rose-500/40 text-xs font-mono text-rose-200/70 opacity-70 cursor-not-allowed'
        : 'w-full min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-950 border text-xs font-mono text-white';
      const errField = !isLive && vState && vState.type === 'error' ? vState.field : null;
      if (aInput) {
        const aErr = errField === 'A' || errField === 'BOTH';
        aInput.className = isLive
          ? baseAbInputClass
          : `${baseAbInputClass} ${aErr ? 'border-rose-500 ring-1 ring-rose-500' : 'border-zinc-700'}`;
      }
      if (bInput) {
        const bErr = errField === 'B' || errField === 'BOTH';
        bInput.className = isLive
          ? baseAbInputClass
          : `${baseAbInputClass} ${bErr ? 'border-rose-500 ring-1 ring-rose-500' : 'border-zinc-700'}`;
      }

      if (markABtn) {
        if (markABtn.disabled !== isLive) markABtn.disabled = isLive;
        setAttrIf(markABtn, 'aria-disabled', isLive ? 'true' : 'false');
        setClsIf(
          markABtn,
          isLive
            ? 'px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[11px] font-extrabold shrink-0 opacity-60 cursor-not-allowed'
            : 'px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-extrabold shrink-0'
        );
      }
      if (markBBtn) {
        if (markBBtn.disabled !== isLive) markBBtn.disabled = isLive;
        setAttrIf(markBBtn, 'aria-disabled', isLive ? 'true' : 'false');
        setClsIf(
          markBBtn,
          isLive
            ? 'px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[11px] font-extrabold shrink-0 opacity-60 cursor-not-allowed'
            : 'px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-extrabold shrink-0'
        );
      }

      const msgEl = document.getElementById('mod39-ab-validation-msg');
      if (msgEl) {
        if (!isLive && vState && vState.message) {
          msgEl.classList.remove('hidden');
          if (vState.type === 'error') {
            setClsIf(
              msgEl,
              'px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500/15 border border-rose-500/60 text-rose-200'
            );
            setTxtIf(msgEl, `❌ ${trText(vState.message)}`);
          } else if (vState.type === 'warning') {
            setClsIf(
              msgEl,
              'px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/15 border border-amber-500/55 text-amber-200'
            );
            setTxtIf(msgEl, `🔒 ${trText(vState.message)}`);
          } else {
            setClsIf(
              msgEl,
              'px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/50 text-emerald-200'
            );
            setTxtIf(msgEl, `✅ ${trText(vState.message)}`);
          }
        } else {
          setTxtIf(msgEl, '');
          setClsIf(msgEl, 'hidden px-2.5 py-1.5 rounded-lg text-[11px] font-bold');
        }
      }

      const abPill = document.getElementById('mod39-ab-status-pill');
      const abToggleBtn = document.getElementById('btn-mod39-yt-ab-toggle');
      if (abPill) {
        if (isLive) {
          setTxtIf(abPill, trText('🔴 LIVE • Khóa lặp'));
          setClsIf(
            abPill,
            'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 border border-rose-500/60 text-rose-200 shrink-0'
          );
        } else if (ab.enabled && this.playerCtrl.isAbPairValid()) {
          setTxtIf(abPill, `A–B: ${formatSecondsToClock(ab.startSec)} ➔ ${formatSecondsToClock(ab.endSec)}`);
          setClsIf(abPill, 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400 text-emerald-300 shrink-0');
        } else if (this.playerCtrl.isAbPairValid()) {
          setTxtIf(abPill, trText(`Chờ bật A–B: ${formatSecondsToClock(ab.startSec)} ➔ ${formatSecondsToClock(ab.endSec)}`));
          setClsIf(abPill, 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 border border-violet-400/60 text-violet-200 shrink-0');
        } else {
          setTxtIf(abPill, trText('A–B: Tắt'));
          setClsIf(abPill, 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 shrink-0');
        }
      }
      if (abToggleBtn) {
        if (abToggleBtn.disabled !== isLive) abToggleBtn.disabled = isLive;
        setAttrIf(abToggleBtn, 'aria-disabled', isLive ? 'true' : 'false');
        if (isLive) {
          setTxtIf(abToggleBtn, trText('🔒 Khóa Lặp A–B (Phát trực tiếp)'));
          setClsIf(
            abToggleBtn,
            'flex-1 px-3 py-2 rounded-xl border border-rose-500/45 bg-rose-950/50 text-rose-200/85 text-xs font-extrabold opacity-75 cursor-not-allowed whitespace-nowrap'
          );
        } else {
          setTxtIf(abToggleBtn, trText(ab.enabled ? '⏹ Dừng Vòng Lặp A–B' : '🔁 Bật Vòng Lặp A–B'));
          setClsIf(
            abToggleBtn,
            'flex-1 px-3 py-2 rounded-xl border border-violet-500/50 bg-violet-600/80 hover:bg-violet-500 text-white text-xs font-extrabold whitespace-nowrap'
          );
        }
      }
      if (abClearBtn) {
        if (abClearBtn.disabled !== isLive) abClearBtn.disabled = isLive;
        setAttrIf(abClearBtn, 'aria-disabled', isLive ? 'true' : 'false');
        setClsIf(
          abClearBtn,
          isLive
            ? 'px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-bold opacity-60 cursor-not-allowed whitespace-nowrap shrink-0'
            : 'px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold whitespace-nowrap shrink-0'
        );
      }
      if (hasVideo && !this.playerCtrl.isScrubbing) {
        this.playerCtrl.updateTimelineDomDirectly(liveSnap);
      } else {
        this.playerCtrl.syncAbVisualBar(this.bridge.lastKnownTime, this.bridge.lastKnownDuration);
      }

      // Sync Background Controls
      const bgState = this.bgStage.state;
      const bgActive = this.bgStage.isWebBackgroundActive();
      const bgPill = document.getElementById('mod39-bg-status-pill');
      if (bgPill) {
        bgPill.textContent = trText(bgActive ? '✨ ĐANG BẬT' : 'Đang tắt');
        bgPill.className = bgActive
          ? 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 border border-cyan-400 text-cyan-200 shrink-0'
          : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 shrink-0';
      }

      const setSliderVal = (id, labelId, val, suffix) => {
        const sl = document.getElementById(id);
        const lb = document.getElementById(labelId);
        if (sl && document.activeElement !== sl) sl.value = String(val);
        if (lb) lb.textContent = `${val}${suffix}`;
      };
      setSliderVal('slider-mod39-bg-opacity', 'mod39-val-bg-opacity', bgState.opacityPct, '%');
      setSliderVal('slider-mod39-bg-blur', 'mod39-val-bg-blur', bgState.blurPx, 'px');
      setSliderVal('slider-mod39-bg-brightness', 'mod39-val-bg-brightness', bgState.brightnessPct, '%');

      const currentVis =
        NS.ambientStage?.stageCompositor?.visibilityPct ??
        clampNumber(safeStorageGet('noir_v36_ambient_visibility_pct', '68'), 15, 95, 68);
      setSliderVal('slider-mod39-ui-glass', 'mod39-val-ui-glass', currentVis, '%');
      this.bgStage.syncFloatingPeekExitButton?.();

      const bgSoundChk = document.getElementById('toggle-mod39-bg-sound');
      if (bgSoundChk) bgSoundChk.checked = Boolean(bgState.allowBgSound);

      this.playerCtrl.mobileBgAudio?.syncStatusUi();
      this.renderFavoritesAndRecentLists();
      this.syncFloatingMiniDock();
    }

    renderFavoritesAndRecentLists() {
      const favContainer = document.getElementById('mod39-favorites-list');
      const recContainer = document.getElementById('mod39-recent-list');
      if (!favContainer || !recContainer) return;

      const favs = this.vault.loadFavoriteVideos();
      const recents = this.vault.loadRecentVideos();
      const curLang =
        (NS.i18n && typeof NS.i18n.getActiveLang === 'function' && NS.i18n.getActiveLang()) || 'vi';
      const renderSig = `${curLang}|${favs.map((x) => x.key).join(',')}|${recents.map((x) => x.key).join(',')}`;
      if (this._lastFavRecRenderSig === renderSig) {
        return;
      }
      this._lastFavRecRenderSig = renderSig;

      const buildCardHtml = (item, isFavList) => `
        <div class="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 flex items-center gap-2.5">
          ${
            item.thumbnailUrl
              ? `<img src="${escapeHtml(item.thumbnailUrl)}" alt="" class="w-16 h-10 object-cover rounded-lg border border-zinc-700 shrink-0 bg-zinc-900" loading="lazy" />`
              : `<div class="w-16 h-10 rounded-lg border border-zinc-700 bg-zinc-900 flex items-center justify-center text-sm shrink-0">🎬</div>`
          }
          <div class="min-w-0 flex-1">
            <div class="text-xs font-bold text-zinc-100 truncate">${escapeHtml(item.title)}</div>
            <div class="text-[10px] text-zinc-400 truncate">${escapeHtml(item.watchUrl || item.key)}</div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              data-mod39-action="load"
              data-mod39-url="${escapeHtml(item.watchUrl || item.videoId || '')}"
              class="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
            >▶ Phát</button>
            <button
              type="button"
              data-mod39-action="bg"
              data-mod39-key="${escapeHtml(item.key)}"
              class="px-2 py-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-[10px] font-bold"
              title="Cài làm Hình nền Web"
            >🌌 Nền</button>
            <button
              type="button"
              data-mod39-action="${isFavList ? 'unfav' : 'delrecent'}"
              data-mod39-key="${escapeHtml(item.key)}"
              class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold"
              title="Xóa"
            >✕</button>
          </div>
        </div>`;

      favContainer.innerHTML = favs.length
        ? favs.map((f) => buildCardHtml(f, true)).join('')
        : '<div class="text-xs text-zinc-500 italic col-span-full">Chưa có video yêu thích nào. Khi phát video hãy bấm "☆ Lưu Yêu Thích".</div>';

      recContainer.innerHTML = recents.length
        ? recents.map((r) => buildCardHtml(r, false)).join('')
        : '<div class="text-xs text-zinc-500 italic col-span-full">Chưa có lịch sử video đã mở.</div>';

      NS.i18n?.translateElement?.(favContainer);
      NS.i18n?.translateElement?.(recContainer);

      const allItemsByKey = new Map();
      [...favs, ...recents].forEach((x) => allItemsByKey.set(x.key, x));

      [favContainer, recContainer].forEach((box) => {
        box.querySelectorAll('button[data-mod39-action]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-mod39-action');
            const key = btn.getAttribute('data-mod39-key');
            const url = btn.getAttribute('data-mod39-url');
            const target = allItemsByKey.get(key);

            if (action === 'load' && url) {
              const parsed = this.parser.parse(url);
              if (parsed.valid) {
                if (target?.title) parsed.title = target.title;
                if (target?.isLive) parsed.isLive = true;
                this.activeTab = 'PLAYER';
                this.playerCtrl.loadParsedVideo(parsed);
              }
            } else if (action === 'bg' && target) {
              const stageCtrl = NS.youtubeStudio?.bgStage || this.bgStage;
              stageCtrl.applyWebBackground(target, true);
            } else if (action === 'unfav' && target) {
              this.vault.toggleFavoriteVideo(target);
              this.syncDynamicUi();
            } else if (action === 'delrecent' && key) {
              this.vault.removeRecentVideo(key);
              this.syncDynamicUi();
            }
          });
        });
      });
    }

    /**
     * Thanh Mini điều khiển gọn góc dưới trái khi bật chế độ Ghim Mini (không đụng
     * Mascot Viên Bi Số 8 ở góc phải dưới).
     */
    openYouTubePlayerTarget() {
      const mainHost = typeof document !== 'undefined' ? document.getElementById('mod39-native-video-host') : null;
      if (NS.navigator && typeof NS.navigator.openTab5Section === 'function') {
        const res = NS.navigator.openTab5Section(MOD39_CONSTANTS.PANEL_ID, '#mod39-player-stage-wrapper');
        if (NS.nativePlayer?.isActive?.() && mainHost && !this.playerCtrl?.prefs?.miniDockEnabled) {
          NS.nativePlayer.attachStageHost(mainHost);
        }
        return res;
      }
      if (NS.navigator?.openTab5Panel) {
        NS.navigator.openTab5Panel(MOD39_CONSTANTS.PANEL_ID, true);
      } else {
        const mainHost = typeof document !== 'undefined' ? document.getElementById('mod39-native-video-host') : null;
      if (NS.nativePlayer?.isActive?.() && mainHost) { NS.nativePlayer.attachStageHost(mainHost); }
      NS.navigator?.navigateToScreen?.('SCREEN_5_AMBIENCE');
        document.getElementById(MOD39_CONSTANTS.PANEL_ID)?.classList.remove('hidden');
      }
      setTimeout(() => {
        document.getElementById('mod39-player-stage-wrapper')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 60);
      return true;
    }

    syncFloatingMiniDock() {
      if (typeof document === 'undefined' || !document.body) return;
      // Đã loại bỏ hoàn toàn khung mini popup #mod39-floating-mini-bar đè màn hình.
      // Giữ đồng bộ sạch sẽ các phần tử trên khung phát chính tại Tab 5.
      const existingDock = document.getElementById(this.miniDockId);
      if (existingDock) {
        try { existingDock.remove(); } catch (_eR) { existingDock.classList.add('hidden'); }
      }
      const video = this.playerCtrl.activeVideo;
      const engine = this.playerCtrl.activeEngine;
      const mainStageHost = document.getElementById('mod39-native-video-host');
      const iframeEl = document.getElementById(this.playerCtrl.bridge.mainIframeId);
      const emptyCard = document.getElementById('mod39-empty-stage-card');

      this.playerCtrl.mobileBgAudio?.syncAudioBridgeStageCard?.();
      if (engine === 'MOD21_AUDIO' && NS.nativePlayer?.isActive?.() && NS.nativePlayer.visualMutedCompanion && NS.nativePlayer.mode === 'video' && !this.playerCtrl?.prefs?.audioOnlyMode && !NS.nativePlayer._provisionalStageTakeover) {
        if (mainStageHost) {
          mainStageHost.classList.remove('hidden');
          if (NS.nativePlayer.stageHostEl !== mainStageHost) {
            NS.nativePlayer.attachStageHost(mainStageHost);
          }
        }
        iframeEl?.classList.add('hidden');
        return;
      }
      if (engine === 'MOD21_AUDIO' || engine === 'RESOLVING_STREAM' || engine === 'PAUSED_BY_LOCAL_MP3') {
        return;
      }

      if (NS.nativePlayer?.isActive?.() && NS.nativePlayer.mode === 'video' && !NS.nativePlayer._provisionalStageTakeover) {
        if (mainStageHost) {
          mainStageHost.classList.remove('hidden');
          if (NS.nativePlayer.stageHostEl !== mainStageHost) {
            NS.nativePlayer.attachStageHost(mainStageHost);
          }
        }
        iframeEl?.classList.add('hidden');
      } else if (!NS.nativePlayer?.isActive?.()) {
        mainStageHost?.classList.add('hidden');
        if (video) {
          emptyCard?.classList.add('hidden');
          iframeEl?.classList.remove('hidden');
        }
      }
    }

    syncMiniScreenMedia(_snap = null) {
      if (typeof document === 'undefined') return;
      const existingDock = document.getElementById(this.miniDockId);
      if (existingDock) {
        try { existingDock.remove(); } catch (_eR) { existingDock.classList.add('hidden'); }
      }
    }
  }

  // ==========================================================================
  // 9. TRÌNH BỔ TRỢ GỢI Ý & ĐIỀU PHỐI BÀN PHÍM, TOOLTIP, CHẨN ĐOÁN MODULE 39
  // ==========================================================================
  class Mod39KeyboardAndTooltipGuard {
    constructor(playerCtrl, viewRenderer) {
      this.playerCtrl = playerCtrl;
      this.viewRenderer = viewRenderer;
      this.bound = false;
    }

    init() {
      this.applyTooltips();
      this.bindEscForFullscreenAndGuide();
    }

    applyTooltips() {
      if (typeof document === 'undefined') return;
      const notes = {
        [MOD39_CONSTANTS.CARD_BTN_ID]:
          'Mở Rạp Xem Video YouTube Chống Sao Nhãng (Full, Lặp A-B, Tốc độ, Tua ±10s) & Cài Video YouTube Làm Hình Nền Web.',
        'btn-mod39-set-web-bg':
          'Đặt video YouTube này chạy phủ làm hình nền web phía sau kính mờ toàn bộ 6 Tab.',
        'btn-mod39-yt-ab-toggle':
          'Lặp đi lặp lại đúng đoạn từ Mốc A tới Mốc B (ví dụ đoạn nhạc cao trào viết truyện).',
        'btn-mod39-system-pip':
          'Mở cửa sổ nổi xem video (hỗ trợ cả Desktop & Mobile)',
        'btn-mod39-yt-fullscreen':
          'Mở rộng khung YouTube ra toàn màn hình (tự động dùng Pseudo-Fullscreen nếu trình duyệt hạn chế).'
      };
      const trTip = NS.i18n?.translateText || ((s) => s);
      for (const [id, text] of Object.entries(notes)) {
        const el = document.getElementById(id);
        if (el) {
          el.setAttribute('title', trTip(text));
        }
      }
    }

    bindEscForFullscreenAndGuide() {
      if (this.bound || typeof document === 'undefined') return;
      this.bound = true;
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
          if (this.playerCtrl.isPseudoFullscreen) {
            this.playerCtrl.toggleFullscreen();
            return;
          }
          const guideModal = document.getElementById(MOD39_CONSTANTS.GUIDE_MODAL_ID);
          if (guideModal && !guideModal.classList.contains('hidden')) {
            guideModal.classList.add('hidden');
          }
        }
      });
    }
  }

  /**
   * Bộ Kiểm Định Sức Khỏe Đường Dẫn & Sân Khấu Module 39 (phục vụ Bách Khoa Tab 6 & E2E).
   */
  class Mod39YouTubeDiagnosticsReporter {
    constructor(parser, vault, bridge, playerCtrl, bgStage) {
      this.parser = parser;
      this.vault = vault;
      this.bridge = bridge;
      this.playerCtrl = playerCtrl;
      this.bgStage = bgStage;
    }

    runSelfDiagnosticChecklist() {
      const sampleWatch = this.parser.parse('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s');
      const sampleShort = this.parser.parse('https://youtu.be/aqz-KE-bpKQ');
      const sampleShorts = this.parser.parse('https://www.youtube.com/shorts/abcdefghijk');
      const sampleInvalid = this.parser.parse('https://example.com/not-youtube');

      const referrerMetaPresent =
        typeof document !== 'undefined' &&
        Boolean(document.querySelector('meta[name="referrer"][content="strict-origin-when-cross-origin"]'));

      return {
        module: MOD39_CONSTANTS.MODULE_KEY,
        version: MOD39_CONSTANTS.VERSION,
        parserTestsPassed:
          sampleWatch.valid &&
          sampleWatch.startSeconds === 42 &&
          sampleShort.valid &&
          sampleShort.videoId === 'aqz-KE-bpKQ' &&
          sampleShorts.valid &&
          !sampleInvalid.valid,
        referrerMetaPresent,
        hasActiveVideo: Boolean(this.playerCtrl.activeVideo),
        webBgActive: this.bgStage.isWebBackgroundActive(),
        favoritesCount: this.vault.loadFavoriteVideos().length,
        recentCount: this.vault.loadRecentVideos().length,
        bridgeTelemetry: { ...this.bridge.telemetry }
      };
    }
  }

  // ==========================================================================
  // 10. MẶT TIỀN TỔNG MODULE 39 (FACADE & ĐĂNG KÝ NOIRSTUDIO)
  // ==========================================================================
  class Mod39YouTubeStudioFacade {
    constructor() {
      this.parser = new YouTubeUrlParserAndValidator();
      this.vault = new Mod39StorageAndFavoritesVault();
      this.searcher = new YouTubeInAppSearchCoordinator(this.parser);
      this.bridge = new YouTubeIframeApiBridgeAndCommandBus(this.parser);
      this.playerCtrl = new YouTubeABLoopAndPlaybackController(this.bridge, this.vault);
      this.playerCtrl.setMetadataSearcher(this.searcher);
      this.bgStage = new YouTubeWebBackgroundStageCoordinator(this.parser, this.vault, this.bridge);
      this.step1Modal = new YouTubeStep1GuideModalPresenter(this.parser, (parsed) => {
        this.onStep1UrlLaunched(parsed);
      });
      this.viewRenderer = new Tab5YouTubeStudioViewRenderer(
        this.parser,
        this.vault,
        this.bridge,
        this.playerCtrl,
        this.bgStage,
        this.step1Modal,
        this.searcher
      );
      this.guard = new Mod39KeyboardAndTooltipGuard(this.playerCtrl, this.viewRenderer);
      this.diagnostics = new Mod39YouTubeDiagnosticsReporter(
        this.parser,
        this.vault,
        this.bridge,
        this.playerCtrl,
        this.bgStage
      );
      this.initialized = false;
    }

    init() {
      this.bgStage.init();
      this.viewRenderer.init();
      this.guard.init();

      if (typeof window !== 'undefined' && /^https?:$/i.test(String(window.location?.protocol || ''))) {
        this.bridge.loadYoutubeIframeApiScript();
      }

      this.playerCtrl.setUiSyncCallback(() => this.viewRenderer.syncDynamicUi());
      this.bgStage.setUiSyncCallback(() => this.viewRenderer.syncDynamicUi());

      if (!this._i18nBound) {
        this._i18nBound = true;
        const onLangChanged = () => {
          this.viewRenderer.syncDynamicUi();
          this.viewRenderer.syncFloatingMiniDock();
          if (!this.playerCtrl.isScrubbing) {
            this.playerCtrl.updateTimelineDomDirectly(this.bridge.getCurrentPlaybackSnapshot());
          }
          this.guard.applyTooltips();
          const panel = this.viewRenderer.getPanelContainer();
          if (panel) NS.i18n?.translateElement?.(panel);
          const dock = document.getElementById(MOD39_CONSTANTS.MINI_DOCK_ID);
          if (dock) NS.i18n?.translateElement?.(dock);
          const modal = document.getElementById(MOD39_CONSTANTS.GUIDE_MODAL_ID);
          if (modal && !modal.classList.contains('hidden')) NS.i18n?.translateElement?.(modal);
        };
        NS.bus?.on?.('i18n:changed', onLangChanged);
        if (typeof global !== 'undefined' && global.addEventListener) {
          global.addEventListener('noir:i18n:changed', onLangChanged);
        }
      }

      if (typeof window !== 'undefined' && window.location?.search) {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const ytvId = String(urlParams.get('ytv') || '').trim();
          if (/^[A-Za-z0-9_-]{6,16}$/.test(ytvId)) {
            const parsedUrlVid = this.parser.parse(`https://www.youtube.com/watch?v=${ytvId}`);
            if (parsedUrlVid && parsedUrlVid.valid) {
              setTimeout(() => {
                this.onStep1UrlLaunched(parsedUrlVid);
              }, 120);
            }
          }
        } catch (_eYtv) {}
      }

      this.initialized = true;
      return true;
    }

    registerMotionBgEngine(engine) {
      if (engine && typeof engine.applyWebBackground === 'function') {
        this.motionBgEngine = engine;
        return true;
      }
      return false;
    }

    getCurrentVideoRecord() {
      return this.playerCtrl?.activeVideo || null;
    }

    searchVideosInApp(query) {
      return this.viewRenderer.runInAppVideoSearch(query);
    }

    onStep1UrlLaunched(parsedVideo) {
      // Đảm bảo Tab 5 & Khung 5 đang mở sẵn sàng trước khi phát video Bước 2
      try {
        if (NS.navigator?.openTab5Panel) {
          NS.navigator.openTab5Panel(MOD39_CONSTANTS.PANEL_ID, false);
        } else {
          NS.navigator?.navigateToScreen?.('SCREEN_5_AMBIENCE');
          const panel = document.getElementById(MOD39_CONSTANTS.PANEL_ID);
          panel?.classList.remove('hidden');
        }
      } catch (_e) {}

      this.viewRenderer.activeTab = 'PLAYER';
      const step2Input = document.getElementById(MOD39_CONSTANTS.STEP2_INPUT_ID);
      if (step2Input && parsedVideo.watchUrl) {
        step2Input.value = parsedVideo.watchUrl;
      }

      this.playerCtrl.loadParsedVideo(parsedVideo);
      safeNotify('🎬 Bước 2 đã kích hoạt! Video YouTube đã sẵn sàng trong rạp viết.', 'success', 2800);
    }

    openGuideStep1(prefillUrl = '') {
      return this.step1Modal.open(prefillUrl);
    }

    closeGuideStep1() {
      return this.step1Modal.close();
    }

    loadVideoFromInput(rawUrl) {
      const parsed = this.parser.parse(rawUrl);
      if (!parsed.valid) {
        safeNotify(`⚠️ ${parsed.message}`, 'warning', 2800);
        return { ok: false, error: parsed.message };
      }
      this.onStep1UrlLaunched(parsed);
      return { ok: true, parsed };
    }

    applyCurrentVideoAsWebBackground() {
      return this.bgStage.applyWebBackground(this.playerCtrl.activeVideo, true);
    }

    clearWebBackground() {
      return this.bgStage.clearWebBackground(true);
    }

    openYouTubePlayerTarget() {
      return this.viewRenderer.openYouTubePlayerTarget();
    }

    toggleMiniDockPinned(_forceState = null) {
      this.playerCtrl.prefs.miniDockEnabled = false;
      this.vault.savePlayerPrefs(this.playerCtrl.prefs);
      this.viewRenderer.syncFloatingMiniDock();
      this.viewRenderer.syncDynamicUi();
      return false;
    }

    toggleAudioOnlyBackground(forceState = null) {
      return this.playerCtrl.toggleAudioOnlyMode(forceState);
    }

    requestSystemPiP() {
      return this.playerCtrl.requestSystemPiP();
    }

    downloadActiveYoutubeViaYtSave() {
      return this.viewRenderer.downloadActiveYoutubeViaYtSave();
    }

    stopAndClearVideo(showToast = true) {
      return this.playerCtrl.stopAndClearVideo(showToast);
    }

    isActivelyPlaying() {
      const ctrl = this.playerCtrl;
      if (!ctrl || !ctrl.activeVideo) return false;
      const eng = ctrl.activeEngine;
      if (eng === 'RESOLVING_STREAM') return true;
      if (eng === 'MOD21_AUDIO') {
        const ext = NS.audioStudio?.getExternalAudioState?.();
        return Boolean(ext?.active && !ext.paused);
      }
      if (NS.nativePlayer?.isActive?.()) {
        return Number(NS.nativePlayer.getSnapshot?.()?.state) === 1;
      }
      if (eng === 'IFRAME' && !ctrl._userDesiredPaused) {
        const st = Number(ctrl.bridge?.lastKnownState);
        return st === 1 || st === 3 || Boolean(ctrl.bridge?.assumedAutoplaying);
      }
      return false;
    }

    persistCurrentPlaybackSnapshotNow(forceWrite = false) {
      return this.playerCtrl.persistCurrentPlaybackSnapshotNow(forceWrite);
    }

    getMobileBgAudioDiagnostics() {
      const bridge = this.playerCtrl?.mobileBgAudio;
      return {
        mode: bridge?.mode || 'idle',
        statusText: bridge?.statusText || '',
        resolvedVideoId: bridge?.resolvedVideoId || '',
        hasStreamUrl: Boolean(bridge?.resolvedStreamUrl),
        nativePlayerActive: Boolean(NS.nativePlayer?.isActive?.()),
        nativePlayerMode: NS.nativePlayer?.mode || 'idle',
        inSystemPiP: Boolean(NS.nativePlayer?.isInSystemPiP),
        tookOverBackground: Boolean(bridge?._bgAudioTookOver),
        audioOnlyMode: Boolean(this.playerCtrl?.prefs?.audioOnlyMode),
        mobileBgAudioEnabled: this.playerCtrl?.prefs?.mobileBgAudioEnabled !== false
      };
    }

    getHealthReport() {
      return {
        ...this.diagnostics.runSelfDiagnosticChecklist(),
        initialized: this.initialized,
        isLiveStream: Boolean(this.playerCtrl.isVideoLiveStream()),
        prefs: { ...this.playerCtrl.prefs },
        abLoop: { ...this.playerCtrl.abLoop },
        bgState: { ...this.bgStage.state },
        mobileBgAudio: this.getMobileBgAudioDiagnostics(),
        searchCacheReady: typeof sessionStorage !== 'undefined',
        lastSearchCount: this.searcher ? this.searcher.lastResults.length : 0
      };
    }
  }

  // Khởi tạo và gắn chặt vào không gian tên NoirStudio
  const mod39Engine = new Mod39YouTubeStudioFacade();
  NS.Mod39YouTubeStudioFacade = Mod39YouTubeStudioFacade;
  NS.YouTubeUrlParserAndValidator = YouTubeUrlParserAndValidator;
  NS.YouTubeInAppSearchCoordinator = YouTubeInAppSearchCoordinator;
  NS.YouTubeABLoopAndPlaybackController = YouTubeABLoopAndPlaybackController;
  NS.YouTubeWebBackgroundStageCoordinator = YouTubeWebBackgroundStageCoordinator;
  NS.youtubeStudio = mod39Engine;
  NS.mod39 = mod39Engine;
  NS.mod39Engine = mod39Engine;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod39', mod39Engine);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!mod39Engine.initialized) {
          mod39Engine.init();
        }
      });
    } else {
      setTimeout(() => {
        if (!mod39Engine.initialized) {
          mod39Engine.init();
        }
      }, 0);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
