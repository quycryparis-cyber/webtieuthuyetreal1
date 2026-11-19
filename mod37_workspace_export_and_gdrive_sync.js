/**
 * ============================================================================
 * MODULE 37: ĐÓNG GÓI KẾT QUẢ LÀM VIỆC (.ZIP), KHÔI PHỤC ĐA THIẾT BỊ
 *            VÀ ĐỒNG BỘ / CHIA SẺ GOOGLE DRIVE TRỰC TIẾP TRÊN TRÌNH DUYỆT
 *            (mod37_workspace_export_and_gdrive_sync.js)
 * ============================================================================
 * Nhiệm vụ cốt lõi:
 *   1. Hỏi người dùng đặt tên thư mục làm việc trước khi xuất (`#mod37-input-folder-name`)
 *      và chuẩn hóa đường dẫn an toàn nhưng giữ nguyên tên hiển thị tiếng Việt.
 *   2. Thu thập trọn vẹn trạng thái Studio từ bộ nhớ runtime + localStorage + IndexedDB:
 *      - Toàn bộ Chương truyện (Nháp & Đã Duyệt) kèm thống kê số từ & bản gộp toàn truyện.
 *      - Khung Story Bible, Nội dung Story Bible chính thức, Hồ sơ nhân vật, Ma trận Ai Biết Gì,
 *        Sổ Manh mối Phục bút, Danh sách Anti-Cliché & Mốc chuyển cảnh / POV.
 *      - Đầu ra 5 Chế độ Trợ lý AI Tab 3, Ghi chú tác giả, Nhật ký phiên bản Time-Machine,
 *        và tùy chọn giao diện / Pomodoro / Âm thanh (tuyệt đối KHÔNG xuất API Key ra .ZIP).
 *   3. Tự đóng gói & giải nén tệp .ZIP chuẩn PKZIP STORE (CRC-32 + cờ UTF-8 0x0800) thuần JS,
 *      tải xuống trực tiếp `<FolderName>.zip` hoặc `_studio_workspace_state.json`, và hỗ trợ
 *      khôi phục ngược lại từ tệp `.zip` / `.json` khi chuyển sang máy tính hoặc điện thoại khác.
 *   4. Kết nối trực tiếp Google Drive API v3 & Google Identity Services (GIS OAuth2) ngay trên
 *      trình duyệt: kiểm tra Google Drive API Key thực (kèm kiểm định Gemini Flash-Lite),
 *      đăng nhập Google (`drive.file`), tạo thư mục + tải file multipart + cấp quyền chia sẻ
 *      `role: 'reader', type: 'anyone'`, trả về đường link công khai (`webViewLink`) bấm được ngay.
 *
 * Kiến trúc thuần khiết: Đăng ký qua `window.NoirStudio.registerModule('mod37', ...)`.
 * ============================================================================
 */
(function initModule37WorkspaceExportAndGDriveSync(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  // ==========================================================================
  // PHẦN 1: HẰNG SỐ, CẤU HÌNH SCHEMA & DANH MỤC HƯỚNG DẪN GOOGLE CLOUD
  // ==========================================================================
  const MOD37_CONSTANTS = Object.freeze({
    MODULE_KEY: 'mod37',
    VERSION: '42.0.0',
    SCHEMA_VERSION: 2,
    ROOT_ELEMENT_ID: 'tab6-workspace-export-root',
    INPUT_FOLDER_NAME_ID: 'mod37-input-folder-name',
    STATE_FILENAME: '_studio_workspace_state.json',
    MANUSCRIPT_MERGED_FILENAME: '00_TOAN_BO_TRUYEN_GOP.txt',
    README_FILENAME: 'README_HUONG_DAN.txt',
    STORAGE_KEYS: Object.freeze({
      FOLDER_NAME: 'noir_mod37_folder_name_v1',
      DRIVE_API_KEY: 'noir_mod37_drive_api_key_v1',
      OAUTH_CLIENT_ID: 'noir_mod37_oauth_client_id_v1',
      SYNC_HISTORY: 'noir_mod37_sync_history_v1',
      EXPORT_PREFS: 'noir_mod37_export_prefs_v1',
      CLOUD_GUIDE_OPEN: 'noir_mod37_cloud_guide_open_v1',
      VERIFY_CACHE: 'noir_mod37_drive_verify_cache_v1',
    }),
    KNOWN_STUDIO_STORAGE_KEYS: Object.freeze([
      'noir_chapters_data_v1',
      'noir_active_chapter_id_v1',
      'noir_story_bible_template_v1',
      'noir_story_bible_content_v1',
      'noir_story_bible_characters_v1',
      'noir_story_bible_knowledge_v1',
      'noir_story_bible_clues_v1',
      'noir_story_bible_locked_v1',
      'noir_scene_markers_v1',
      'noir_v36_scene_modal_draft_v1',
      'noir_v36_last_scene_pov_v1',
      'noir_v36_target_word_count_v1',
      'noir_tab3_mode_outputs_v1',
      'noir_tab3_user_prompt_draft_v1',
      'noir_author_notes_v1',
      'noir_pomodoro_settings_v1',
      'noir_audio_soundscape_prefs_v1',
      'noir_theme_and_typography_v1',
      'noir_ambience_canvas_prefs_v1',
      'noir_version_vault_snapshots_v1',
      'noir_v39_attendance_checkins_v1',
      'noir_v39_attendance_daily_target_v1',
      'noir_v38_daily_word_goal_state',
      'noir_unified_pomodoro_state_v36',
      'noir_v36_pomodoro_ledger_v1',
    ]),
    SENSITIVE_KEY_PATTERNS: Object.freeze([
      /gemini.*key/i,
      /api_?key/i,
      /oauth/i,
      /token/i,
      /secret/i,
      /password/i,
      /credential/i,
    ]),
    SUBFOLDERS: Object.freeze({
      CHAPTERS: '01_Ban_Thao_Chuong',
      BIBLE: '02_Story_Bible_Va_Ho_So',
      AI_MODES: '03_Tro_Ly_AI_5_Che_Do',
      NOTES_META: '04_Ghi_Chu_Va_Phien_Ban',
    }),
    GOOGLE_APIS: Object.freeze({
      DISCOVERY_DRIVE_V3: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      DRIVE_FILES_ENDPOINT: 'https://www.googleapis.com/drive/v3/files',
      DRIVE_UPLOAD_ENDPOINT: 'https://www.googleapis.com/upload/drive/v3/files',
      GSI_SCRIPT_URL: 'https://accounts.google.com/gsi/client',
      DRIVE_SCOPE: 'https://www.googleapis.com/auth/drive.file',
      CLOUD_ENABLE_DRIVE_URL: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
      CLOUD_CREDENTIALS_URL: 'https://console.cloud.google.com/apis/credentials',
      CLOUD_CONSENT_URL: 'https://console.cloud.google.com/apis/credentials/consent',
    }),
    ZIP_FLAGS: Object.freeze({
      LOCAL_FILE_HEADER_SIG: 0x04034b50,
      CENTRAL_DIR_HEADER_SIG: 0x02014b50,
      END_OF_CENTRAL_DIR_SIG: 0x06054b50,
      UTF8_GENERAL_PURPOSE_FLAG: 0x0800,
      COMPRESSION_STORE: 0,
      VERSION_NEEDED: 20,
      VERSION_MADE_BY: 20,
    }),
    MAX_HISTORY_RECORDS: 25,
    MAX_UPLOAD_RETRY_COUNT: 2,
    FETCH_TIMEOUT_MS: 18000,
    GIS_LOAD_TIMEOUT_MS: 14000,
  });

  const CLOUD_SETUP_STEPS_GUIDE = Object.freeze([
    {
      stepNumber: 1,
      title: 'Bật Google Drive API trên Google Cloud Console',
      description:
        'Tạo hoặc chọn một Project trên Google Cloud Console rồi nhấn Enable (Bật) cho Google Drive API để trình duyệt được phép tạo thư mục và tải tệp.',
      linkLabel: 'Mở trang Bật Google Drive API ↗',
      linkUrl: MOD37_CONSTANTS.GOOGLE_APIS.CLOUD_ENABLE_DRIVE_URL,
    },
    {
      stepNumber: 2,
      title: 'Tạo API Key (khóa kiểm định public discovery)',
      description:
        'Vào Credentials → Create Credentials → API Key. Bạn có thể dán Key vào ô bên dưới rồi bấm "Xác thực Key" để kiểm tra kết nối Drive + Gemini Flash-Lite.',
      linkLabel: 'Mở trang Credentials tạo API Key ↗',
      linkUrl: MOD37_CONSTANTS.GOOGLE_APIS.CLOUD_CREDENTIALS_URL,
    },
    {
      stepNumber: 3,
      title: 'Tạo OAuth 2.0 Client ID (Web application) & thêm Authorized JS Origin',
      description:
        'Tại mục Credentials → Create Credentials → OAuth client ID → chọn Application type là Web application. Dán đúng Origin hiện tại (sao chép ở nút bên dưới) vào mục Authorized JavaScript origins.',
      linkLabel: 'Mở OAuth Consent / Client ID ↗',
      linkUrl: MOD37_CONSTANTS.GOOGLE_APIS.CLOUD_CONSENT_URL,
    },
    {
      stepNumber: 4,
      title: 'Đăng nhập Google trên trình duyệt & Tải folder công việc lên Drive',
      description:
        'Nhấn "Đăng nhập Google (drive.file)" — Studio chỉ xin quyền truy cập các tệp/thư mục do chính Studio vừa tạo, tuyệt đối không đọc tệp riêng tư khác trong Drive của bạn.',
      linkLabel: '',
      linkUrl: '',
    },
  ]);

  const TAB3_MODE_LABELS = Object.freeze({
    MODE_1_DRAFT: 'Che_Do_1_Viet_Cot_Truyen_Va_Chuong',
    MODE_2_BRAINSTORM: 'Che_Do_2_Phat_Trien_Dien_Bien_Va_Twist',
    MODE_3_AUDIT: 'Che_Do_3_Bien_Tap_Kiem_Toan_Logic',
    MODE_4_SENSORY: 'Che_Do_4_Nang_Tam_Van_Phong_Ngu_Quan',
    MODE_5_DIAGRAM: 'Che_Do_5_So_Do_Cot_Truyen_Va_Timeline',
  });

  // ==========================================================================
  // PHẦN 2: TIỆN ÍCH CHUẨN HÓA TIẾNG VIỆT, BẢO MẬT & THAO TÁC AN TOÀN
  // ==========================================================================

  function safeParseJson(rawText, fallbackValue = null) {
    if (typeof rawText !== 'string' || !rawText.trim()) return fallbackValue;
    try {
      return JSON.parse(rawText);
    } catch (_) {
      return fallbackValue;
    }
  }

  function safeStringifyJson(data, pretty = true) {
    try {
      return JSON.stringify(data, null, pretty ? 2 : 0);
    } catch (_) {
      return '{}';
    }
  }

  function readLocalStorageSafe(key, fallback = '') {
    try {
      const val = global.localStorage?.getItem(key);
      return val === null || val === undefined ? fallback : val;
    } catch (_) {
      return fallback;
    }
  }

  function writeLocalStorageSafe(key, value) {
    try {
      if (value === null || value === undefined) {
        global.localStorage?.removeItem(key);
      } else {
        global.localStorage?.setItem(key, String(value));
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function escapeHtmlSafe(text) {
    if (NS.uiUtils && typeof NS.uiUtils.escapeHtml === 'function') {
      return NS.uiUtils.escapeHtml(text);
    }
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function notifyToast(message, type = 'info', durationMs = 3800) {
    if (NS.uiUtils && typeof NS.uiUtils.showToast === 'function') {
      NS.uiUtils.showToast(message, type, durationMs);
      return;
    }
    if (type === 'error') {
      console.error('[Mod37]', message);
    } else {
      console.info('[Mod37]', message);
    }
  }

  function formatDateTag(dateInput = new Date()) {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
      d.getHours()
    )}h${pad(d.getMinutes())}`;
  }

  function formatHumanDateTime(isoOrMs) {
    try {
      const tr = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      const d = new Date(isoOrMs);
      if (Number.isNaN(d.getTime())) return tr('Vừa xong');
      if (NS.i18n && typeof NS.i18n.formatDateTime === 'function') {
        return NS.i18n.formatDateTime(d.getTime());
      }
      return d.toLocaleString('vi-VN');
    } catch (_) {
      return NS.i18n?.translateText ? NS.i18n.translateText('Vừa xong') : 'Vừa xong';
    }
  }

  function formatBytesReadable(bytes) {
    const num = Number(bytes || 0);
    if (!Number.isFinite(num) || num <= 0) return '0 B';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  }

  function stripVietnameseDiacritics(input) {
    return String(input || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  /**
   * Chuẩn hóa tên thư mục làm việc người dùng nhập:
   * - Giữ tên hiển thị sạch cho Google Drive folder (bỏ ký tự điều khiển / slash).
   * - Tạo tên ASCII an toàn cho đường dẫn tệp nén .ZIP tránh lỗi trình giải nén cũ trên Windows.
   */
  function normalizeFolderNames(rawInput) {
    const rawTrimmed = String(rawInput || '').replace(/[\r\n\t]+/g, ' ').trim();
    const defaultTitle = `WebTieuThuyetCuaBi_${formatDateTag()}`;
    const displayFolderName = rawTrimmed
      ? rawTrimmed.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 96)
      : defaultTitle;

    const asciiSlug = stripVietnameseDiacritics(displayFolderName)
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 72);

    return {
      displayFolderName: displayFolderName || defaultTitle,
      safeZipFolderName: asciiSlug || `WebTieuThuyet_${formatDateTag()}`,
    };
  }

  function sanitizeFilenameSegment(rawTitle, maxLen = 48) {
    const ascii = stripVietnameseDiacritics(String(rawTitle || 'Khong_Ten'))
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return (ascii || 'Khong_Ten').slice(0, maxLen);
  }

  function countWordsAccurate(text) {
    if (NS.uiUtils && typeof NS.uiUtils.countVietnameseWords === 'function') {
      return NS.uiUtils.countVietnameseWords(text);
    }
    const clean = String(text || '').trim();
    if (!clean) return 0;
    return clean.split(/\s+/).filter(Boolean).length;
  }

  function maskSecretValue(secret) {
    const s = String(secret || '').trim();
    if (!s) return '';
    if (s.length <= 8) return '****';
    return `${s.slice(0, 4)}...${s.slice(-4)}`;
  }

  function isSensitiveStorageKey(keyName) {
    const s = String(keyName || '');
    return MOD37_CONSTANTS.SENSITIVE_KEY_PATTERNS.some((rx) => rx.test(s));
  }

  function scrubSensitiveTokensFromText(text) {
    return String(text || '')
      .replace(/AIza[0-9A-Za-z\-_]{20,}/g, '[API_KEY_DA_AN]')
      .replace(/AQ\.[0-9A-Za-z\-_]{20,}/g, '[KEY_DA_AN]')
      .replace(/ya29\.[0-9A-Za-z\-_]{20,}/g, '[OAUTH_TOKEN_DA_AN]');
  }

  function getSafeAppOriginForOAuth() {
    try {
      const origin = global.location?.origin;
      if (origin && origin !== 'null' && !origin.startsWith('file:')) {
        return origin;
      }
      const fallbackMsg = 'http://localhost (Vui lòng chạy qua Local Server / HTTPS để dùng OAuth)';
      return global.NoirStudio?.i18n?.translateText
        ? global.NoirStudio.i18n.translateText(fallbackMsg)
        : fallbackMsg;
    } catch (_) {
      return 'http://localhost';
    }
  }

  function isHttpOriginSupportedForOAuth() {
    try {
      const proto = String(global.location?.protocol || '');
      return proto === 'http:' || proto === 'https:';
    } catch (_) {
      return false;
    }
  }

  function triggerBlobDownload(blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          a.remove();
          URL.revokeObjectURL(url);
        } catch (_) {
          // Bỏ qua khi DOM đã dọn
        }
      }, 1500);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function copyTextSafe(text) {
    const value = String(text || '');
    if (!value) return false;
    try {
      if (global.navigator?.clipboard?.writeText) {
        await global.navigator.clipboard.writeText(value);
        return true;
      }
    } catch (_) {
      // Dự phòng bên dưới bằng textarea
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return Boolean(ok);
    } catch (_) {
      return false;
    }
  }

  // ==========================================================================
  // PHẦN 3: BỘ ĐÓNG GÓI & GIẢI NÉN PKZIP STORE THUẦN JAVASCRIPT (CRC-32 + UTF-8)
  // ==========================================================================

  const CRC32_LOOKUP_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function computeCrc32Bytes(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC32_LOOKUP_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function encodeUtf8Bytes(input) {
    if (input instanceof Uint8Array) return input;
    const text = String(input ?? '');
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(text);
    }
    const encoded = unescape(encodeURIComponent(text));
    const arr = new Uint8Array(encoded.length);
    for (let i = 0; i < encoded.length; i++) {
      arr[i] = encoded.charCodeAt(i);
    }
    return arr;
  }

  function decodeUtf8Bytes(bytes) {
    if (!(bytes instanceof Uint8Array)) return '';
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    }
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    try {
      return decodeURIComponent(escape(bin));
    } catch (_) {
      return bin;
    }
  }

  function dateToDosTimeAndDate(dateObj = new Date()) {
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    const year = Math.max(1980, Math.min(2107, d.getFullYear()));
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = Math.floor(d.getSeconds() / 2);

    const dosTime = ((hours & 0x1f) << 11) | ((minutes & 0x3f) << 5) | (seconds & 0x1f);
    const dosDate = (((year - 1980) & 0x7f) << 9) | ((month & 0x0f) << 5) | (day & 0x1f);
    return { dosTime, dosDate };
  }

  /**
   * Đóng gói mảng file thành PKZIP STORE nhị phân hợp chuẩn (mở được trên mọi HĐH Windows/macOS/Android).
   */
  class PureJsWorkspaceZipWriter {
    /**
     * @param {Array<{path: string, content: string|Uint8Array, mimeType?: string, modifiedAt?: number}>} entries
     * @returns {{ blob: Blob, totalFiles: number, totalBytes: number, manifestSummary: Array<object> }}
     */
    buildZipArchive(entries) {
      const normalizedEntries = Array.isArray(entries) ? entries : [];
      const localParts = [];
      const centralParts = [];
      const manifestSummary = [];
      let runningOffset = 0;

      for (let idx = 0; idx < normalizedEntries.length; idx++) {
        const entry = normalizedEntries[idx];
        const cleanPath = String(entry?.path || `file_${idx + 1}.txt`)
          .replace(/\\/g, '/')
          .replace(/^\/+/, '');
        if (!cleanPath) continue;

        const nameBytes = encodeUtf8Bytes(cleanPath);
        const dataBytes = encodeUtf8Bytes(entry?.content ?? '');
        const crc32 = computeCrc32Bytes(dataBytes);
        const { dosTime, dosDate } = dateToDosTimeAndDate(
          entry?.modifiedAt ? new Date(entry.modifiedAt) : new Date()
        );

        // Local File Header (30 bytes + filename length)
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const lhv = new DataView(localHeader.buffer);
        lhv.setUint32(0, MOD37_CONSTANTS.ZIP_FLAGS.LOCAL_FILE_HEADER_SIG, true);
        lhv.setUint16(4, MOD37_CONSTANTS.ZIP_FLAGS.VERSION_NEEDED, true);
        lhv.setUint16(6, MOD37_CONSTANTS.ZIP_FLAGS.UTF8_GENERAL_PURPOSE_FLAG, true);
        lhv.setUint16(8, MOD37_CONSTANTS.ZIP_FLAGS.COMPRESSION_STORE, true);
        lhv.setUint16(10, dosTime, true);
        lhv.setUint16(12, dosDate, true);
        lhv.setUint32(14, crc32, true);
        lhv.setUint32(18, dataBytes.length, true);
        lhv.setUint32(22, dataBytes.length, true);
        lhv.setUint16(26, nameBytes.length, true);
        lhv.setUint16(28, 0, true);
        localHeader.set(nameBytes, 30);

        localParts.push(localHeader, dataBytes);

        // Central Directory Header (46 bytes + filename length)
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const chv = new DataView(centralHeader.buffer);
        chv.setUint32(0, MOD37_CONSTANTS.ZIP_FLAGS.CENTRAL_DIR_HEADER_SIG, true);
        chv.setUint16(4, MOD37_CONSTANTS.ZIP_FLAGS.VERSION_MADE_BY, true);
        chv.setUint16(6, MOD37_CONSTANTS.ZIP_FLAGS.VERSION_NEEDED, true);
        chv.setUint16(8, MOD37_CONSTANTS.ZIP_FLAGS.UTF8_GENERAL_PURPOSE_FLAG, true);
        chv.setUint16(10, MOD37_CONSTANTS.ZIP_FLAGS.COMPRESSION_STORE, true);
        chv.setUint16(12, dosTime, true);
        chv.setUint16(14, dosDate, true);
        chv.setUint32(16, crc32, true);
        chv.setUint32(20, dataBytes.length, true);
        chv.setUint32(24, dataBytes.length, true);
        chv.setUint16(28, nameBytes.length, true);
        chv.setUint16(30, 0, true);
        chv.setUint16(32, 0, true);
        chv.setUint16(34, 0, true);
        chv.setUint16(36, 0, true);
        chv.setUint32(38, 0, true);
        chv.setUint32(42, runningOffset, true);
        centralHeader.set(nameBytes, 46);

        centralParts.push(centralHeader);
        manifestSummary.push({
          path: cleanPath,
          size: dataBytes.length,
          crc32: crc32.toString(16).padStart(8, '0'),
        });

        runningOffset += localHeader.length + dataBytes.length;
      }

      const centralDirSize = centralParts.reduce((acc, part) => acc + part.length, 0);
      const eocd = new Uint8Array(22);
      const ev = new DataView(eocd.buffer);
      ev.setUint32(0, MOD37_CONSTANTS.ZIP_FLAGS.END_OF_CENTRAL_DIR_SIG, true);
      ev.setUint16(4, 0, true);
      ev.setUint16(6, 0, true);
      ev.setUint16(8, manifestSummary.length, true);
      ev.setUint16(10, manifestSummary.length, true);
      ev.setUint32(12, centralDirSize, true);
      ev.setUint32(16, runningOffset, true);
      ev.setUint16(20, 0, true);

      const totalBytes = runningOffset + centralDirSize + eocd.length;
      const merged = new Uint8Array(totalBytes);
      let cursor = 0;

      for (const part of localParts) {
        merged.set(part, cursor);
        cursor += part.length;
      }
      for (const cpart of centralParts) {
        merged.set(cpart, cursor);
        cursor += cpart.length;
      }
      merged.set(eocd, cursor);

      const blob = new Blob([merged.buffer], { type: 'application/zip' });
      return {
        blob,
        totalFiles: manifestSummary.length,
        totalBytes,
        manifestSummary,
      };
    }
  }

  /**
   * Đọc và giải nén tệp .ZIP chuẩn STORE hoặc DEFLATE (qua DecompressionStream nếu có)
   * để khôi phục dự án trên máy khác trực tiếp không cần cài thư viện ngoài.
   */
  class PureJsWorkspaceZipReader {
    /**
     * @param {ArrayBuffer|Uint8Array} bufferInput
     * @returns {Promise<Array<{path: string, compressionMethod: number, data: Uint8Array, text: string, crcValid: boolean}>>}
     */
    async parseZipArchive(bufferInput) {
      const rawBytes =
        bufferInput instanceof Uint8Array
          ? bufferInput
          : new Uint8Array(bufferInput instanceof ArrayBuffer ? bufferInput : new ArrayBuffer(0));
      if (rawBytes.length < 22) {
        throw new Error('Tệp .ZIP quá nhỏ hoặc không hợp lệ.');
      }

      const view = new DataView(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
      const extracted = [];

      // Ưu tiên tìm End of Central Directory (EOCD) để hỗ trợ cả các file có Data Descriptor
      const eocdOffset = this.findEocdOffset(view, rawBytes.length);
      if (eocdOffset >= 0) {
        const entryCount = view.getUint16(eocdOffset + 10, true);
        let cdOffset = view.getUint32(eocdOffset + 16, true);

        for (let i = 0; i < entryCount && cdOffset + 46 <= rawBytes.length; i++) {
          const sig = view.getUint32(cdOffset, true);
          if (sig !== MOD37_CONSTANTS.ZIP_FLAGS.CENTRAL_DIR_HEADER_SIG) break;

          const method = view.getUint16(cdOffset + 10, true);
          const expectedCrc = view.getUint32(cdOffset + 16, true);
          const compSize = view.getUint32(cdOffset + 20, true);
          const nameLen = view.getUint16(cdOffset + 28, true);
          const extraLen = view.getUint16(cdOffset + 30, true);
          const commentLen = view.getUint16(cdOffset + 32, true);
          const localHeaderOffset = view.getUint32(cdOffset + 42, true);

          const nameBytes = rawBytes.slice(cdOffset + 46, cdOffset + 46 + nameLen);
          const path = decodeUtf8Bytes(nameBytes);
          cdOffset += 46 + nameLen + extraLen + commentLen;

          if (!path || path.endsWith('/')) continue;
          if (localHeaderOffset + 30 > rawBytes.length) continue;
          if (view.getUint32(localHeaderOffset, true) !== MOD37_CONSTANTS.ZIP_FLAGS.LOCAL_FILE_HEADER_SIG) {
            continue;
          }

          const localNameLen = view.getUint16(localHeaderOffset + 26, true);
          const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
          const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
          const dataEnd = Math.min(rawBytes.length, dataStart + compSize);
          const compressedSlice = rawBytes.slice(dataStart, dataEnd);

          const uncompressed = await this.decompressEntryBytes(compressedSlice, method);
          if (!uncompressed) continue;

          const actualCrc = computeCrc32Bytes(uncompressed);
          const crcValid = expectedCrc === 0 || actualCrc === expectedCrc;
          extracted.push({
            path,
            compressionMethod: method,
            data: uncompressed,
            text: this.looksTextualPath(path) ? decodeUtf8Bytes(uncompressed) : '',
            crcValid,
          });
        }

        if (extracted.length > 0) {
          return extracted;
        }
      }

      // Dự phòng quét tuần tự Local File Header nếu không có EOCD chuẩn
      return this.scanLocalFileHeadersFallback(rawBytes, view);
    }

    findEocdOffset(view, totalLen) {
      const minOffset = Math.max(0, totalLen - 65558);
      for (let pos = totalLen - 22; pos >= minOffset; pos--) {
        if (view.getUint32(pos, true) === MOD37_CONSTANTS.ZIP_FLAGS.END_OF_CENTRAL_DIR_SIG) {
          return pos;
        }
      }
      return -1;
    }

    async scanLocalFileHeadersFallback(rawBytes, view) {
      const list = [];
      let cursor = 0;
      while (cursor + 30 <= rawBytes.length) {
        const sig = view.getUint32(cursor, true);
        if (sig !== MOD37_CONSTANTS.ZIP_FLAGS.LOCAL_FILE_HEADER_SIG) break;

        const method = view.getUint16(cursor + 8, true);
        const expectedCrc = view.getUint32(cursor + 14, true);
        const compSize = view.getUint32(cursor + 18, true);
        const nameLen = view.getUint16(cursor + 26, true);
        const extraLen = view.getUint16(cursor + 28, true);
        const nameStart = cursor + 30;
        const dataStart = nameStart + nameLen + extraLen;
        const dataEnd = Math.min(rawBytes.length, dataStart + compSize);

        const path = decodeUtf8Bytes(rawBytes.slice(nameStart, nameStart + nameLen));
        const payload = rawBytes.slice(dataStart, dataEnd);
        cursor = dataEnd;

        if (!path || path.endsWith('/')) continue;
        const uncompressed = await this.decompressEntryBytes(payload, method);
        if (!uncompressed) continue;

        const actualCrc = computeCrc32Bytes(uncompressed);
        list.push({
          path,
          compressionMethod: method,
          data: uncompressed,
          text: this.looksTextualPath(path) ? decodeUtf8Bytes(uncompressed) : '',
          crcValid: expectedCrc === 0 || actualCrc === expectedCrc,
        });
      }
      return list;
    }

    async decompressEntryBytes(bytes, method) {
      if (method === MOD37_CONSTANTS.ZIP_FLAGS.COMPRESSION_STORE) {
        return bytes;
      }
      if (method === 8 && typeof global.DecompressionStream === 'function') {
        try {
          const ds = new global.DecompressionStream('deflate-raw');
          const stream = new Blob([bytes]).stream().pipeThrough(ds);
          const buf = await new Response(stream).arrayBuffer();
          return new Uint8Array(buf);
        } catch (_) {
          return null;
        }
      }
      return null;
    }

    looksTextualPath(path) {
      return /\.(txt|md|json|html|htm|css|js|csv|xml|svg)$/i.test(String(path || ''));
    }
  }

  // ==========================================================================
  // PHẦN 4: BỘ THU THẬP SNAPSHOT TOÀN BỘ KHÔNG GIAN LÀM VIỆC & XUẤT FILE
  // ==========================================================================

  class WorkspaceSnapshotCollector {
    /**
     * Thu thập nguyên trạng thái tác phẩm từ các Module đang chạy + localStorage,
     * đồng thời lọc bỏ hoàn toàn API Key / OAuth Token để chia sẻ an toàn.
     */
    collectFullWorkspaceState(customFolderDisplayName = '') {
      const nowIso = new Date().toISOString();
      const chapters = this.collectChaptersSnapshot();
      const activeChapterId = this.collectActiveChapterId(chapters);
      const storyBible = this.collectStoryBibleSnapshot();
      const sceneData = this.collectSceneAndPovSnapshot();
      const tab3Data = this.collectTab3OutputsSnapshot();
      const authorNotes = this.collectAuthorNotesSnapshot();
      const preferences = this.collectPreferencesSnapshot();
      const versionVault = this.collectVersionVaultSnapshot();
      const sanitizedLocalStorage = this.collectSanitizedLocalStorageMap();

      const totalWords = chapters.reduce(
        (sum, ch) => sum + Number(ch.wordCount || countWordsAccurate(ch.content || '')),
        0
      );
      const approvedCount = chapters.filter(
        (ch) => String(ch.status || '').toUpperCase() === 'APPROVED'
      ).length;
      const draftCount = chapters.length - approvedCount;

      return {
        schema: 'NOIR_STUDIO_WORKSPACE_ARCHIVE_V2',
        schemaVersion: MOD37_CONSTANTS.SCHEMA_VERSION,
        appTitle: 'Web viết tiểu thuyết của Bi',
        exportedByModule: 'mod37',
        exportedAtIso: nowIso,
        folderLabel: customFolderDisplayName || 'WebTieuThuyetCuaBi',
        securityNotice:
          'Gói dữ liệu đã tự động lọc sạch toàn bộ Gemini API Key, Drive API Key và OAuth Token cá nhân.',
        statistics: {
          chapterCount: chapters.length,
          approvedCount,
          draftCount,
          totalWords,
          characterCount: Array.isArray(storyBible.characters) ? storyBible.characters.length : 0,
          knowledgeFactsCount: Array.isArray(storyBible.knowledgeMatrix)
            ? storyBible.knowledgeMatrix.length
            : 0,
          cluesCount: Array.isArray(storyBible.cluesLedger) ? storyBible.cluesLedger.length : 0,
          sceneMarkersChapterCount: Object.keys(sceneData.markersByChapter || {}).length,
          versionVaultCount: Array.isArray(versionVault) ? versionVault.length : 0,
        },
        chapters,
        activeChapterId,
        storyBible,
        sceneData,
        tab3Data,
        authorNotes,
        preferences,
        versionVault,
        localStorageBackup: sanitizedLocalStorage,
      };
    }

    collectChaptersSnapshot() {
      let rawChapters = [];
      if (NS.chapterManager && Array.isArray(NS.chapterManager.chapters)) {
        rawChapters = NS.chapterManager.chapters;
      } else {
        const stored = safeParseJson(readLocalStorageSafe('noir_chapters_data_v1', '[]'), []);
        if (Array.isArray(stored)) rawChapters = stored;
      }

      return rawChapters.map((ch, idx) => {
        const content = String(ch?.content || '');
        return {
          id: String(ch?.id || `chap_${idx + 1}`),
          order: idx + 1,
          title: String(ch?.title || ch?.displayTitle || `Chương ${idx + 1}`),
          displayTitle: String(ch?.displayTitle || ch?.title || `Chương ${idx + 1}`),
          status: String(ch?.status || 'DRAFT').toUpperCase() === 'APPROVED' ? 'APPROVED' : 'DRAFT',
          content,
          beats: String(ch?.beats || ''),
          wordCount: countWordsAccurate(content),
          updatedAt: ch?.updatedAt || new Date().toISOString(),
        };
      });
    }

    collectActiveChapterId(chapters) {
      const fromMgr = NS.chapterManager?.activeChapterId;
      if (fromMgr) return String(fromMgr);
      const fromStorage = readLocalStorageSafe('noir_active_chapter_id_v1', '');
      if (fromStorage) return String(fromStorage);
      return chapters[0]?.id || '';
    }

    collectStoryBibleSnapshot() {
      const sb = NS.storyBible || {};
      const keys = NS.CONSTANTS?.STORAGE_KEYS || {};
      const templateFrame =
        typeof sb.getTemplateFrame === 'function'
          ? sb.getTemplateFrame()
          : sb.templateFrame ||
            readLocalStorageSafe(keys.BIBLE_TEMPLATE || 'noir_s10_bible_template_frame', '');
      const bibleContent =
        typeof sb.getBibleContent === 'function'
          ? sb.getBibleContent()
          : sb.bibleContent ||
            readLocalStorageSafe(keys.BIBLE_RENDERED || 'noir_s10_rendered_bible_content', '');

      const characters = Array.isArray(sb.characters)
        ? sb.characters
        : safeParseJson(
            readLocalStorageSafe(keys.CHARACTERS || 'noir_s10_character_profiles_v1', '[]'),
            []
          );
      const knowledgeMatrix = Array.isArray(sb.knowledgeMatrix)
        ? sb.knowledgeMatrix
        : safeParseJson(
            readLocalStorageSafe(keys.KNOWLEDGE_MATRIX || 'noir_s10_knowledge_matrix_v1', '[]'),
            []
          );
      const cluesLedger = Array.isArray(sb.cluesLedger)
        ? sb.cluesLedger
        : safeParseJson(
            readLocalStorageSafe(keys.CLUES_LEDGER || 'noir_s10_clues_ledger_v1', '[]'),
            []
          );

      const templateInputDom = document.getElementById('textarea-bible-template-frame');
      const bibleInputDom = document.getElementById('textarea-rendered-bible-content');
      const antiClicheDom = document.getElementById('textarea-anti-cliche-blacklist');

      return {
        templateFrame: String(templateInputDom?.value || templateFrame || ''),
        bibleContent: String(bibleInputDom?.value || bibleContent || ''),
        characters: Array.isArray(characters) ? characters : [],
        knowledgeMatrix: Array.isArray(knowledgeMatrix) ? knowledgeMatrix : [],
        cluesLedger: Array.isArray(cluesLedger) ? cluesLedger : [],
        templateLocked: Boolean(
          sb.templateLocked ||
            readLocalStorageSafe(keys.BIBLE_LOCKED || 'noir_s10_bible_template_locked', '') ===
              'true'
        ),
        antiClicheNotes: String(
          antiClicheDom?.value ||
            readLocalStorageSafe(keys.ANTI_CLICHE || 'noir_s10_anti_cliche_blacklist_v1', '') ||
            ''
        ),
      };
    }

    collectSceneAndPovSnapshot() {
      const sb = NS.sceneBuilder || {};
      const markersByChapter =
        sb.markersByChapter && typeof sb.markersByChapter === 'object'
          ? JSON.parse(safeStringifyJson(sb.markersByChapter, false))
          : safeParseJson(readLocalStorageSafe('noir_scene_markers_v1', '{}'), {});

      const povSelect = document.getElementById('select-scene-pov');
      const wordTargetEl = document.getElementById('input-target-word-count');
      const modalDraft = safeParseJson(
        readLocalStorageSafe('noir_v36_scene_modal_draft_v1', 'null'),
        null
      );

      return {
        markersByChapter: markersByChapter || {},
        lastScenePov: String(
          povSelect?.value || readLocalStorageSafe('noir_v36_last_scene_pov_v1', '') || ''
        ),
        targetWordCount: String(
          wordTargetEl?.value || readLocalStorageSafe('noir_v36_target_word_count_v1', '') || ''
        ),
        sceneModalDraft: modalDraft,
      };
    }

    collectTab3OutputsSnapshot() {
      const ctrl = NS.tab3Controller || {};
      const rawOutputs =
        ctrl.modeOutputs && typeof ctrl.modeOutputs === 'object'
          ? ctrl.modeOutputs
          : safeParseJson(readLocalStorageSafe('noir_tab3_mode_outputs_v1', '{}'), {});

      const promptBox = document.getElementById('textarea-ai-user-prompt');
      const promptDraft = String(
        promptBox?.value || readLocalStorageSafe('noir_tab3_user_prompt_draft_v1', '') || ''
      );

      return {
        modeOutputs: rawOutputs || {},
        activeMode: String(ctrl.activeMode || 'MODE_1_DRAFT'),
        promptDraft,
      };
    }

    collectAuthorNotesSnapshot() {
      const noteEl = document.getElementById('textarea-author-notes');
      const noteText = String(
        noteEl?.value || readLocalStorageSafe('noir_author_notes_v1', '') || ''
      );
      return {
        notesText: noteText,
      };
    }

    collectPreferencesSnapshot() {
      const audio = {};
      if (NS.audioStudio) {
        audio.activePresetKey = NS.audioStudio.activePresetKey || 'OFF';
        audio.masterVolume = NS.audioStudio.masterVolume ?? 0.5;
        audio.playbackRate = NS.audioStudio.playbackRate ?? 1.0;
      } else {
        Object.assign(
          audio,
          safeParseJson(readLocalStorageSafe('noir_audio_soundscape_prefs_v1', '{}'), {})
        );
      }

      const pomodoro = {};
      if (NS.pomodoro) {
        pomodoro.workMinutes = NS.pomodoro.workMinutes ?? 25;
        pomodoro.breakMinutes = NS.pomodoro.breakMinutes ?? 5;
        pomodoro.completedCycles = NS.pomodoro.completedCycles ?? 0;
      } else {
        Object.assign(
          pomodoro,
          safeParseJson(readLocalStorageSafe('noir_pomodoro_settings_v1', '{}'), {})
        );
      }

      const typography = safeParseJson(
        readLocalStorageSafe('noir_theme_and_typography_v1', '{}'),
        {}
      );
      const ambience = safeParseJson(
        readLocalStorageSafe('noir_ambience_canvas_prefs_v1', '{}'),
        {}
      );

      const attendance = NS.tab5Attendance?.state
        ? { ...NS.tab5Attendance.state }
        : safeParseJson(readLocalStorageSafe('noir_v39_attendance_checkins_v1', 'null'), null);

      return {
        audio,
        pomodoro,
        attendance,
        typography,
        ambience,
        themeDark: document.documentElement?.classList?.contains('dark') ?? true,
      };
    }

    collectVersionVaultSnapshot() {
      if (NS.versionVault && Array.isArray(NS.versionVault.snapshots)) {
        return NS.versionVault.snapshots.slice(0, 40);
      }
      const stored = safeParseJson(
        readLocalStorageSafe('noir_version_vault_snapshots_v1', '[]'),
        []
      );
      return Array.isArray(stored) ? stored.slice(0, 40) : [];
    }

    collectSanitizedLocalStorageMap() {
      const result = {};
      try {
        const storage = global.localStorage;
        if (!storage) return result;
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (!k) continue;
          if (!k.startsWith('noir_') && !k.startsWith('bi_novel_')) continue;
          if (isSensitiveStorageKey(k)) continue;
          const v = storage.getItem(k);
          if (typeof v !== 'string') continue;
          if (v.length > 260000) continue; // Tránh phình khổng lồ với binary base64
          result[k] = scrubSensitiveTokensFromText(v);
        }
      } catch (_) {
        // Bỏ qua nếu trình duyệt chặn localStorage
      }
      return result;
    }

    /**
     * Chuyển toàn bộ snapshot thành danh sách file gọn gàng cho cả .ZIP lẫn Google Drive upload.
     * @returns {{ snapshot: object, folderMeta: object, files: Array<{path: string, relativePath: string, folderGroup: string, name: string, mimeType: string, content: string}> }}
     */
    buildReadableExportFileEntries(rawFolderInput = '') {
      const folderMeta = normalizeFolderNames(rawFolderInput);
      const snapshot = this.collectFullWorkspaceState(folderMeta.displayFolderName);
      const rootZipPrefix = folderMeta.safeZipFolderName;
      const files = [];

      const pushEntry = (folderGroup, name, content, mimeType = 'text/plain;charset=utf-8') => {
        const relativePath = folderGroup ? `${folderGroup}/${name}` : name;
        files.push({
          folderGroup,
          name,
          relativePath,
          path: `${rootZipPrefix}/${relativePath}`,
          mimeType,
          content: String(content ?? ''),
        });
      };

      // 1. File README hướng dẫn & thống kê
      pushEntry('', MOD37_CONSTANTS.README_FILENAME, this.renderReadmeText(snapshot, folderMeta));

      // 2. Các chương truyện + file gộp toàn truyện
      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      const mergedParts = [
        `====================================================================`,
        `TOÀN BỘ BẢN THẢO TÁC PHẨM — ${folderMeta.displayFolderName}`,
        `Xuất lúc: ${formatHumanDateTime(snapshot.exportedAtIso)}`,
        `Tổng số chương: ${snapshot.statistics.chapterCount} (Đã duyệt: ${snapshot.statistics.approvedCount}, Nháp: ${snapshot.statistics.draftCount})`,
        `Tổng số từ: ${fmtNum(snapshot.statistics.totalWords)} từ`,
        `====================================================================\n`,
      ];

      snapshot.chapters.forEach((ch, idx) => {
        const numPad = String(idx + 1).padStart(2, '0');
        const safeSlug = sanitizeFilenameSegment(ch.displayTitle || ch.title, 44);
        const statusTag = ch.status === 'APPROVED' ? 'Da_Duyet' : 'Nhap';
        const headerBlock = [
          `# ${ch.displayTitle || ch.title}`,
          `Trạng thái: ${ch.status === 'APPROVED' ? 'Đã duyệt chính thức' : 'Bản nháp'}`,
          `Số từ: ${fmtNum(ch.wordCount)} từ`,
          `Cập nhật: ${formatHumanDateTime(ch.updatedAt)}`,
          `--------------------------------------------------------------------\n`,
        ].join('\n');

        const fullChapterTxt = `${headerBlock}${ch.content || '(Chương hiện đang trống)'}\n`;
        pushEntry(
          MOD37_CONSTANTS.SUBFOLDERS.CHAPTERS,
          `Chuong_${numPad}_${statusTag}_${safeSlug}.txt`,
          fullChapterTxt,
          'text/plain;charset=utf-8'
        );
        pushEntry(
          MOD37_CONSTANTS.SUBFOLDERS.CHAPTERS,
          `Chuong_${numPad}_${statusTag}_${safeSlug}.md`,
          fullChapterTxt,
          'text/markdown;charset=utf-8'
        );

        mergedParts.push(
          `\n\n==================== [CHƯƠNG ${numPad}: ${ch.displayTitle || ch.title}] (${statusTag} - ${ch.wordCount} từ) ====================\n`
        );
        mergedParts.push(ch.content || '(Trống)');
      });

      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.CHAPTERS,
        MOD37_CONSTANTS.MANUSCRIPT_MERGED_FILENAME,
        mergedParts.join('\n'),
        'text/plain;charset=utf-8'
      );

      // 3. Story Bible, Nhân vật, Ma trận Ai Biết Gì, Manh mối, Mốc phân cảnh
      const sb = snapshot.storyBible;
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.BIBLE,
        '01_Khung_Story_Bible.txt',
        sb.templateFrame || '(Chưa thiết lập Khung Story Bible)'
      );
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.BIBLE,
        '02_Noi_Dung_Story_Bible_Chinh_Thuc.txt',
        sb.bibleContent || '(Chưa có Nội dung Story Bible chính thức)'
      );
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.BIBLE,
        '03_Ho_So_Nhan_Vat.json',
        safeStringifyJson(sb.characters, true),
        'application/json;charset=utf-8'
      );
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.BIBLE,
        '03_Ho_So_Nhan_Vat_De_Doc.txt',
        this.formatCharactersReadable(sb.characters)
      );
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.BIBLE,
        '04_Ma_Tran_Ai_Biet_Gi.json',
        safeStringifyJson(sb.knowledgeMatrix, true),
        'application/json;charset=utf-8'
      );
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.BIBLE,
        '04_Ma_Tran_Ai_Biet_Gi_De_Doc.txt',
        this.formatKnowledgeMatrixReadable(sb.knowledgeMatrix)
      );
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.BIBLE,
        '05_So_Manh_Moi_Phuc_But.json',
        safeStringifyJson(sb.cluesLedger, true),
        'application/json;charset=utf-8'
      );
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.BIBLE,
        '06_Moc_Chuyen_Canh_Va_POV.json',
        safeStringifyJson(snapshot.sceneData, true),
        'application/json;charset=utf-8'
      );

      // 4. Kết quả 5 Chế độ AI Tab 3
      const outputs = snapshot.tab3Data?.modeOutputs || {};
      Object.entries(TAB3_MODE_LABELS).forEach(([modeKey, fileStem]) => {
        const modeVal = outputs[modeKey];
        const textOut =
          typeof modeVal === 'string'
            ? modeVal
            : modeVal && typeof modeVal === 'object'
              ? modeVal.text || safeStringifyJson(modeVal, true)
              : '';
        if (textOut && textOut.trim()) {
          pushEntry(
            MOD37_CONSTANTS.SUBFOLDERS.AI_MODES,
            `${fileStem}.txt`,
            textOut,
            'text/plain;charset=utf-8'
          );
        }
      });

      // 5. Ghi chú tác giả & Thống kê
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.NOTES_META,
        'Ghi_Chu_Tac_Gia.txt',
        snapshot.authorNotes?.notesText || '(Chưa có ghi chú)'
      );
      pushEntry(
        MOD37_CONSTANTS.SUBFOLDERS.NOTES_META,
        'Thong_Ke_Du_An.json',
        safeStringifyJson(snapshot.statistics, true),
        'application/json;charset=utf-8'
      );

      // 6. Tệp trạng thái khôi phục toàn phần đa thiết bị
      pushEntry(
        '',
        MOD37_CONSTANTS.STATE_FILENAME,
        safeStringifyJson(snapshot, true),
        'application/json;charset=utf-8'
      );

      return { snapshot, folderMeta, files };
    }

    renderReadmeText(snapshot, folderMeta) {
      const stats = snapshot.statistics || {};
      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      return [
        `====================================================================`,
        `GÓI DỰ ÁN TIỂU THUYẾT — WEB VIẾT TIỂU THUYẾT CỦA BI`,
        `Tên thư mục xuất: ${folderMeta.displayFolderName}`,
        `Thời điểm đóng gói: ${formatHumanDateTime(snapshot.exportedAtIso)}`,
        `====================================================================`,
        ``,
        `THỐNG KÊ NHANH:`,
        `- Số chương: ${stats.chapterCount} (${stats.approvedCount} đã duyệt, ${stats.draftCount} bản nháp)`,
        `- Tổng khối lượng chữ: ${fmtNum(stats.totalWords)} từ`,
        `- Hồ sơ nhân vật: ${stats.characterCount} | Sự kiện Ai Biết Gì: ${stats.knowledgeFactsCount} | Manh mối: ${stats.cluesCount}`,
        ``,
        `CÁCH CHUYỂN SANG MÁY TÍNH HOẶC ĐIỆN THOẠI KHÁC LÀM VIỆC TIẾP:`,
        `1. Mở Web viết tiểu thuyết của Bi trên thiết bị mới.`,
        `2. Vào Tab 6 -> mở Mục "3. Xuất kết quả làm việc".`,
        `3. Bấm "Khôi phục từ tệp .ZIP / .JSON" và chọn chính file .ZIP này (hoặc file _studio_workspace_state.json bên trong).`,
        `4. Toàn bộ chương, Story Bible, Nhân vật, Mốc POV, âm thanh và cài đặt sẽ nạp lại ngay lập tức!`,
        ``,
        `LƯU Ý BẢO MẬT:`,
        `- Các API Key (Gemini / Google Drive) và Token đăng nhập Google KHÔNG được nhúng vào tệp .ZIP này để bạn yên tâm chia sẻ cho người khác.`,
        ``,
      ].join('\n');
    }

    formatCharactersReadable(characters) {
      if (!Array.isArray(characters) || characters.length === 0) {
        return '(Chưa có hồ sơ nhân vật nào được ghi nhận)';
      }
      return characters
        .map((c, idx) => {
          const name = c?.name || c?.characterName || `Nhân vật #${idx + 1}`;
          const role = c?.role || c?.archetype || 'Chưa rõ vai trò';
          const summary = c?.summary || c?.profile || c?.description || '';
          const secrets = c?.secrets || c?.hiddenMotives || '';
          return [
            `[${idx + 1}] ${name} (${role})`,
            summary ? `  - Tiểu sử / Đặc điểm: ${summary}` : '',
            secrets ? `  - Bí mật nội tâm: ${secrets}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        })
        .join('\n\n');
    }

    formatKnowledgeMatrixReadable(matrix) {
      if (!Array.isArray(matrix) || matrix.length === 0) {
        return '(Ma trận Ai Biết Gì đang trống)';
      }
      return matrix
        .map((row, idx) => {
          const who = row?.character || row?.who || 'Nhân vật';
          const knows = row?.knows || row?.fact || '';
          const secretFrom = row?.hiddenFrom || row?.secretFrom || '';
          const ch = row?.chapterRef || row?.chapter || '';
          return `[${idx + 1}] ${who}${ch ? ` (${ch})` : ''}: ${knows}${
            secretFrom ? ` | Giấu kín trước: ${secretFrom}` : ''
          }`;
        })
        .join('\n');
    }
  }

  // ==========================================================================
  // PHẦN 5: BỘ KHÔI PHỤC DỰ ÁN ĐA THIẾT BỊ (.ZIP / .JSON -> STUDIO LIVE STATE)
  // ==========================================================================

  class WorkspaceCrossDeviceRestorer {
    constructor(zipReader) {
      this.zipReader = zipReader;
    }

    async restoreFromFileObject(fileObj) {
      if (!fileObj) {
        throw new Error('Không tìm thấy tệp để khôi phục.');
      }
      const lowerName = String(fileObj.name || '').toLowerCase();
      if (lowerName.endsWith('.json')) {
        const text = await fileObj.text();
        return this.restoreFromJsonText(text, fileObj.name);
      }
      if (lowerName.endsWith('.zip')) {
        const buf = await fileObj.arrayBuffer();
        return this.restoreFromZipArrayBuffer(buf, fileObj.name);
      }
      throw new Error('Vui lòng chọn đúng tệp định dạng .ZIP hoặc .JSON xuất từ Studio.');
    }

    async restoreFromJsonText(jsonText, sourceLabel = 'workspace.json') {
      const parsed = safeParseJson(jsonText, null);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error(`Tệp "${sourceLabel}" không phải cấu trúc JSON hợp lệ.`);
      }
      if (!Array.isArray(parsed.chapters) && !parsed.storyBible && !parsed.localStorageBackup) {
        throw new Error('Tệp JSON không chứa dữ liệu Chương hoặc Story Bible của Studio.');
      }
      return this.applyWorkspaceSnapshotLive(parsed, sourceLabel);
    }

    async restoreFromZipArrayBuffer(arrayBuffer, sourceLabel = 'workspace.zip') {
      const entries = await this.zipReader.parseZipArchive(arrayBuffer);
      if (!entries || entries.length === 0) {
        throw new Error(`Tệp "${sourceLabel}" trống hoặc nén bằng định dạng chưa hỗ trợ.`);
      }

      // Ưu tiên tìm _studio_workspace_state.json ở mọi cấp thư mục
      const stateEntry = entries.find(
        (e) => e.path.endsWith(`/${MOD37_CONSTANTS.STATE_FILENAME}`) || e.path === MOD37_CONSTANTS.STATE_FILENAME
      );
      if (stateEntry && stateEntry.text) {
        const snapshot = safeParseJson(stateEntry.text, null);
        if (snapshot && typeof snapshot === 'object') {
          return this.applyWorkspaceSnapshotLive(snapshot, sourceLabel);
        }
      }

      // Dự phòng nếu đây là gói .ZIP chỉ chứa các file .txt/.md chương & Story Bible
      return this.reconstructAndApplyFromFolderEntries(entries, sourceLabel);
    }

    reconstructAndApplyFromFolderEntries(entries, sourceLabel) {
      const chapters = [];
      let templateFrame = '';
      let bibleContent = '';
      let characters = [];
      let knowledgeMatrix = [];
      let cluesLedger = [];

      entries.forEach((entry) => {
        const p = String(entry.path || '');
        if (!entry.text) return;

        if (
          p.includes('01_Ban_Thao_Chuong/') &&
          !p.endsWith(MOD37_CONSTANTS.MANUSCRIPT_MERGED_FILENAME) &&
          p.endsWith('.txt')
        ) {
          const baseName = p.split('/').pop() || 'Chuong';
          const isApproved = baseName.includes('_Da_Duyet_');
          const firstLine = entry.text.split('\n')[0]?.replace(/^#\s*/, '').trim();
          const bodySplit = entry.text.split('--------------------------------------------------------------------\n');
          const content = bodySplit.length > 1 ? bodySplit.slice(1).join('\n').trim() : entry.text;
          chapters.push({
            id: `restored_${chapters.length + 1}_${Date.now()}`,
            order: chapters.length + 1,
            title: firstLine || baseName.replace(/\.txt$/i, ''),
            displayTitle: firstLine || baseName.replace(/\.txt$/i, ''),
            status: isApproved ? 'APPROVED' : 'DRAFT',
            content,
            wordCount: countWordsAccurate(content),
            updatedAt: new Date().toISOString(),
          });
        } else if (p.endsWith('01_Khung_Story_Bible.txt')) {
          templateFrame = entry.text;
        } else if (p.endsWith('02_Noi_Dung_Story_Bible_Chinh_Thuc.txt')) {
          bibleContent = entry.text;
        } else if (p.endsWith('03_Ho_So_Nhan_Vat.json')) {
          const arr = safeParseJson(entry.text, []);
          if (Array.isArray(arr)) characters = arr;
        } else if (p.endsWith('04_Ma_Tran_Ai_Biet_Gi.json')) {
          const arr = safeParseJson(entry.text, []);
          if (Array.isArray(arr)) knowledgeMatrix = arr;
        } else if (p.endsWith('05_So_Manh_Moi_Phuc_But.json')) {
          const arr = safeParseJson(entry.text, []);
          if (Array.isArray(arr)) cluesLedger = arr;
        }
      });

      if (chapters.length === 0 && !bibleContent && !templateFrame) {
        throw new Error(`Không tìm thấy tệp dữ liệu Studio hợp lệ trong "${sourceLabel}".`);
      }

      return this.applyWorkspaceSnapshotLive(
        {
          schema: 'NOIR_STUDIO_RECONSTRUCTED_ZIP_V1',
          chapters,
          activeChapterId: chapters[0]?.id || '',
          storyBible: {
            templateFrame,
            bibleContent,
            characters,
            knowledgeMatrix,
            cluesLedger,
          },
        },
        sourceLabel
      );
    }

    applyWorkspaceSnapshotLive(snapshot, sourceLabel = 'Snapshot') {
      const summary = {
        sourceLabel,
        chaptersRestored: 0,
        storyBibleRestored: false,
        sceneMarkersRestored: false,
        preferencesRestored: false,
        restoredAtIso: new Date().toISOString(),
      };

      // 1. Khôi phục localStorage an toàn trước (trừ API Key / Token)
      if (snapshot.localStorageBackup && typeof snapshot.localStorageBackup === 'object') {
        Object.entries(snapshot.localStorageBackup).forEach(([k, v]) => {
          if (!isSensitiveStorageKey(k) && typeof v === 'string') {
            writeLocalStorageSafe(k, v);
          }
        });
      }

      // 2. Khôi phục danh sách chương
      if (Array.isArray(snapshot.chapters) && snapshot.chapters.length > 0) {
        const cleanChapters = snapshot.chapters.map((ch, idx) => {
          const text = String(ch?.content || '');
          return {
            id: String(ch?.id || `chap_${idx + 1}`),
            title: String(ch?.title || ch?.displayTitle || `Chương ${idx + 1}`),
            displayTitle: String(ch?.displayTitle || ch?.title || `Chương ${idx + 1}`),
            status:
              String(ch?.status || 'DRAFT').toUpperCase() === 'APPROVED' ? 'APPROVED' : 'DRAFT',
            content: text,
            beats: String(ch?.beats || ''),
            wordCount: countWordsAccurate(text),
            updatedAt: ch?.updatedAt || new Date().toISOString(),
          };
        });

        writeLocalStorageSafe('noir_chapters_data_v1', safeStringifyJson(cleanChapters, false));
        const activeId = String(snapshot.activeChapterId || cleanChapters[0]?.id || '');
        writeLocalStorageSafe('noir_active_chapter_id_v1', activeId);

        if (NS.chapterManager) {
          NS.chapterManager.chapters = cleanChapters;
          NS.chapterManager.activeChapterId = activeId;
          if (typeof NS.chapterManager.saveChapters === 'function') {
            NS.chapterManager.saveChapters();
          }
          if (typeof NS.chapterManager.renderChapterList === 'function') {
            NS.chapterManager.renderChapterList();
          }
          if (typeof NS.chapterManager.loadChapterIntoEditor === 'function' && activeId) {
            NS.chapterManager.loadChapterIntoEditor(activeId);
          }
        }
        summary.chaptersRestored = cleanChapters.length;
      }

      // 3. Khôi phục Story Bible & Hồ sơ (đồng bộ đúng key Mod 01 / Mod 12)
      if (snapshot.storyBible && typeof snapshot.storyBible === 'object') {
        const sbData = snapshot.storyBible;
        const keys = NS.CONSTANTS?.STORAGE_KEYS || {};
        writeLocalStorageSafe(
          keys.BIBLE_TEMPLATE || 'noir_s10_bible_template_frame',
          sbData.templateFrame || ''
        );
        writeLocalStorageSafe(
          keys.BIBLE_RENDERED || 'noir_s10_rendered_bible_content',
          sbData.bibleContent || ''
        );
        writeLocalStorageSafe(
          keys.CHARACTERS || 'noir_s10_character_profiles_v1',
          safeStringifyJson(sbData.characters || [], false)
        );
        writeLocalStorageSafe(
          keys.KNOWLEDGE_MATRIX || 'noir_s10_knowledge_matrix_v1',
          safeStringifyJson(sbData.knowledgeMatrix || [], false)
        );
        writeLocalStorageSafe(
          keys.CLUES_LEDGER || 'noir_s10_clues_ledger_v1',
          safeStringifyJson(sbData.cluesLedger || [], false)
        );

        const tplDom = document.getElementById('textarea-bible-template-frame');
        if (tplDom) tplDom.value = sbData.templateFrame || '';
        const bibleDom = document.getElementById('textarea-rendered-bible-content');
        if (bibleDom) bibleDom.value = sbData.bibleContent || '';
        const antiClicheDom = document.getElementById('textarea-anti-cliche-blacklist');
        if (antiClicheDom && typeof sbData.antiClicheNotes === 'string') {
          antiClicheDom.value = sbData.antiClicheNotes;
        }

        if (NS.storyBible) {
          NS.storyBible.templateFrame = sbData.templateFrame || '';
          NS.storyBible.bibleContent = sbData.bibleContent || '';
          if (Array.isArray(sbData.characters)) NS.storyBible.characters = sbData.characters;
          if (Array.isArray(sbData.knowledgeMatrix)) {
            NS.storyBible.knowledgeMatrix = sbData.knowledgeMatrix;
          }
          if (Array.isArray(sbData.cluesLedger)) NS.storyBible.cluesLedger = sbData.cluesLedger;
          if (typeof NS.storyBible.renderAll === 'function') {
            NS.storyBible.renderAll();
          } else if (typeof NS.storyBible.saveAllBibleData === 'function') {
            NS.storyBible.saveAllBibleData(false);
          }
        }
        summary.storyBibleRestored = true;
      }

      // 4. Khôi phục Mốc chuyển cảnh & POV
      if (snapshot.sceneData && typeof snapshot.sceneData === 'object') {
        const sc = snapshot.sceneData;
        if (sc.markersByChapter) {
          writeLocalStorageSafe('noir_scene_markers_v1', safeStringifyJson(sc.markersByChapter, false));
          if (NS.sceneBuilder) {
            NS.sceneBuilder.markersByChapter = sc.markersByChapter;
            if (typeof NS.sceneBuilder.renderMarkersListUI === 'function') {
              NS.sceneBuilder.renderMarkersListUI();
            }
          }
        }
        if (sc.lastScenePov) {
          writeLocalStorageSafe('noir_v36_last_scene_pov_v1', sc.lastScenePov);
          const povSel = document.getElementById('select-scene-pov');
          if (povSel) povSel.value = sc.lastScenePov;
        }
        summary.sceneMarkersRestored = true;
      }

      // 5. Khôi phục đầu ra 5 Chế độ Tab 3 & Ghi chú tác giả
      if (snapshot.tab3Data && typeof snapshot.tab3Data === 'object') {
        if (snapshot.tab3Data.modeOutputs) {
          writeLocalStorageSafe(
            'noir_tab3_mode_outputs_v1',
            safeStringifyJson(snapshot.tab3Data.modeOutputs, false)
          );
          if (NS.tab3Controller) {
            NS.tab3Controller.modeOutputs = snapshot.tab3Data.modeOutputs;
            if (typeof NS.tab3Controller.renderCurrentModeOutput === 'function') {
              NS.tab3Controller.renderCurrentModeOutput();
            }
          }
        }
        if (typeof snapshot.tab3Data.promptDraft === 'string') {
          writeLocalStorageSafe('noir_tab3_user_prompt_draft_v1', snapshot.tab3Data.promptDraft);
          const promptBox = document.getElementById('textarea-ai-user-prompt');
          if (promptBox && snapshot.tab3Data.promptDraft) {
            promptBox.value = snapshot.tab3Data.promptDraft;
          }
        }
      }

      if (snapshot.authorNotes && typeof snapshot.authorNotes.notesText === 'string') {
        writeLocalStorageSafe('noir_author_notes_v1', snapshot.authorNotes.notesText);
        const noteEl = document.getElementById('textarea-author-notes');
        if (noteEl) noteEl.value = snapshot.authorNotes.notesText;
      }

      if (snapshot.preferences) {
        const att = snapshot.preferences.attendance;
        const backupAttRaw = snapshot.localStorageBackup?.['noir_v39_attendance_checkins_v1'];
        const backupTargetRaw = snapshot.localStorageBackup?.['noir_v39_attendance_daily_target_v1'];
        if (att && typeof att === 'object') {
          writeLocalStorageSafe('noir_v39_attendance_checkins_v1', safeStringifyJson(att, false));
          if (Number(att.dailyWordTarget) > 0) {
            writeLocalStorageSafe('noir_v39_attendance_daily_target_v1', String(att.dailyWordTarget));
          }
          if (typeof NS.idb?.put === 'function') {
            NS.idb
              .put('state_cache', {
                id: 'noir_v39_attendance_checkins_v1',
                ...att,
                updatedAt: Date.now()
              })
              .catch(() => {});
          }
        } else if (typeof backupAttRaw === 'string' && backupAttRaw.trim()) {
          writeLocalStorageSafe('noir_v39_attendance_checkins_v1', backupAttRaw);
        }
        if (typeof backupTargetRaw === 'string' && backupTargetRaw.trim()) {
          writeLocalStorageSafe('noir_v39_attendance_daily_target_v1', backupTargetRaw);
        }
        if (NS.tab5Attendance && typeof NS.tab5Attendance.loadStateFromStorage === 'function') {
          NS.tab5Attendance.loadStateFromStorage();
          NS.tab5Attendance.renderPanel?.();
        }
        summary.preferencesRestored = true;
      } else if (snapshot.localStorageBackup?.['noir_v39_attendance_checkins_v1']) {
        writeLocalStorageSafe(
          'noir_v39_attendance_checkins_v1',
          snapshot.localStorageBackup['noir_v39_attendance_checkins_v1']
        );
        if (snapshot.localStorageBackup?.['noir_v39_attendance_daily_target_v1']) {
          writeLocalStorageSafe(
            'noir_v39_attendance_daily_target_v1',
            snapshot.localStorageBackup['noir_v39_attendance_daily_target_v1']
          );
        }
        NS.tab5Attendance?.loadStateFromStorage?.();
        NS.tab5Attendance?.renderPanel?.();
      }

      return summary;
    }
  }

  // ==========================================================================
  // PHẦN 6: XÁC THỰC GOOGLE DRIVE API KEY + GEMINI FLASH-LITE & GOOGLE OAUTH2
  // ==========================================================================

  class GoogleDriveCloudAuthAndVerifyClient {
    constructor() {
      this.accessToken = '';
      this.tokenExpiresAtMs = 0;
      this.gisLoadPromise = null;
      this.lastVerifyResult = safeParseJson(
        readLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.VERIFY_CACHE, 'null'),
        null
      );
    }

    hasValidAccessToken() {
      return Boolean(this.accessToken) && Date.now() < this.tokenExpiresAtMs - 30000;
    }

    getTokenRemainingSeconds() {
      if (!this.hasValidAccessToken()) return 0;
      return Math.max(0, Math.round((this.tokenExpiresAtMs - Date.now()) / 1000));
    }

    signOutLocalToken() {
      const oldToken = this.accessToken;
      this.accessToken = '';
      this.tokenExpiresAtMs = 0;
      try {
        if (oldToken && global.google?.accounts?.oauth2?.revoke) {
          global.google.accounts.oauth2.revoke(oldToken, () => {});
        }
      } catch (_) {
        // Bỏ qua nếu GIS chưa nạp
      }
    }

    /**
     * Kiểm định kép:
     * 1) Probe Google Drive v3 Discovery / Endpoint bằng Google Drive API Key người dùng nhập.
     * 2) Nếu người dùng đã gắn Gemini API Key ở Studio, gọi thử Gemini 2.5 Flash-Lite
     *    để xác nhận đường truyền AI + gợi ý kiểm tra cấu hình Google Cloud chính xác.
     */
    async verifyDriveApiKeyAndGeminiReadiness(rawDriveApiKey) {
      const apiKey = String(rawDriveApiKey || '').trim();
      const report = {
        checkedAtIso: new Date().toISOString(),
        driveKeyProvided: Boolean(apiKey),
        driveKeyMasked: maskSecretValue(apiKey),
        driveDiscoveryOk: false,
        driveStatusLabel: '',
        geminiFlashLiteChecked: false,
        geminiFlashLiteOk: false,
        geminiNote: '',
      };

      if (!apiKey) {
        report.driveStatusLabel = 'Chưa nhập Google Drive API Key (vẫn có thể tải .ZIP hoặc dùng OAuth Client ID).';
      } else if (!/^AIza[0-9A-Za-z\-_]{15,}$/.test(apiKey)) {
        report.driveStatusLabel = 'Định dạng Google Drive API Key chưa giống chuẩn Google Cloud ("AIza...").';
      } else {
        try {
          const url = `${MOD37_CONSTANTS.GOOGLE_APIS.DISCOVERY_DRIVE_V3}?key=${encodeURIComponent(
            apiKey
          )}`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 9000);
          const res = await fetch(url, { method: 'GET', signal: controller.signal });
          clearTimeout(timer);

          if (res.ok) {
            const payload = await res.json();
            if (payload && payload.name === 'drive') {
              report.driveDiscoveryOk = true;
              report.driveStatusLabel = `Google Drive API v3 phản hồi OK (${payload.title || 'Drive API'}).`;
            } else {
              report.driveStatusLabel = 'Endpoint Drive Discovery phản hồi nhưng thiếu metadata v3.';
            }
          } else {
            const errJson = await res.json().catch(() => ({}));
            const msg = errJson?.error?.message || `HTTP ${res.status}`;
            report.driveStatusLabel = `Drive API Key báo lỗi: ${scrubSensitiveTokensFromText(msg)}`;
          }
        } catch (err) {
          report.driveStatusLabel = `Không thể kết nối mạng tới googleapis.com (${err?.message || 'Offline / Bị chặn'}).`;
        }
      }

      // Kiểm định phụ bằng Gemini Flash-Lite trên Cổng Kết nối nếu có Key
      if (NS.geminiRouter && typeof NS.geminiRouter.generateTextWithFallback === 'function') {
        const hasGeminiKey = Boolean(NS.geminiRouter.getApiKey?.() || NS.apiVault?.getApiKey?.());
        if (hasGeminiKey) {
          report.geminiFlashLiteChecked = true;
          try {
            const geminiRes = await NS.geminiRouter.generateTextWithFallback({
              prompt:
                'Trả lời đúng 1 câu ngắn tiếng Việt (< 22 từ): Xác nhận kết nối đồng bộ Google Drive cho tác giả web tiểu thuyết đã sẵn sàng.',
              modelId: 'gemini-2.5-flash-lite',
              thinkingLevel: 'LOW',
              temperature: 0.2,
              maxOutputTokens: 80,
              suppressToast: true,
            });
            const textOut =
              typeof geminiRes === 'string'
                ? geminiRes
                : geminiRes?.text || geminiRes?.outputText || '';
            if (textOut && textOut.trim()) {
              report.geminiFlashLiteOk = true;
              report.geminiNote = scrubSensitiveTokensFromText(textOut.trim());
            } else {
              report.geminiNote = 'Gemini Flash-Lite không trả về nội dung.';
            }
          } catch (gErr) {
            report.geminiNote = `Gemini Flash-Lite tạm bận: ${scrubSensitiveTokensFromText(
              gErr?.message || ''
            )}`;
          }
        } else {
          report.geminiNote = 'Chưa gắn Gemini API Key ở Mục 1 nên bỏ qua bước test Flash-Lite.';
        }
      }

      this.lastVerifyResult = report;
      writeLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.VERIFY_CACHE, safeStringifyJson(report, false));
      return report;
    }

    /**
     * Tải động Google Identity Services script (`accounts.google.com/gsi/client`) chỉ khi người dùng bấm dùng Drive.
     */
    loadGoogleIdentityServicesLibrary() {
      if (global.google?.accounts?.oauth2?.initTokenClient) {
        return Promise.resolve(global.google.accounts.oauth2);
      }
      if (this.gisLoadPromise) return this.gisLoadPromise;

      this.gisLoadPromise = new Promise((resolve, reject) => {
        if (!isHttpOriginSupportedForOAuth()) {
          reject(
            new Error(
              'Đăng nhập Google OAuth2 yêu cầu mở trang qua http://localhost hoặc https:// (không hỗ trợ trực tiếp từ file://).'
            )
          );
          return;
        }

        const existingScript = document.querySelector(
          `script[src="${MOD37_CONSTANTS.GOOGLE_APIS.GSI_SCRIPT_URL}"]`
        );
        if (existingScript) {
          const checkReady = setInterval(() => {
            if (global.google?.accounts?.oauth2?.initTokenClient) {
              clearInterval(checkReady);
              resolve(global.google.accounts.oauth2);
            }
          }, 120);
          setTimeout(() => {
            clearInterval(checkReady);
            reject(new Error('Hết thời gian chờ Google Identity Services khởi tạo.'));
          }, MOD37_CONSTANTS.GIS_LOAD_TIMEOUT_MS);
          return;
        }

        const script = document.createElement('script');
        script.src = MOD37_CONSTANTS.GOOGLE_APIS.GSI_SCRIPT_URL;
        script.async = true;
        script.defer = true;

        const timeoutTimer = setTimeout(() => {
          reject(new Error('Không thể tải Google Identity Services (accounts.google.com).'));
        }, MOD37_CONSTANTS.GIS_LOAD_TIMEOUT_MS);

        script.onload = () => {
          clearTimeout(timeoutTimer);
          if (global.google?.accounts?.oauth2?.initTokenClient) {
            resolve(global.google.accounts.oauth2);
          } else {
            reject(new Error('Thư viện GIS đã tải nhưng thiếu google.accounts.oauth2.'));
          }
        };
        script.onerror = () => {
          clearTimeout(timeoutTimer);
          this.gisLoadPromise = null;
          reject(new Error('Lỗi mạng hoặc bị chặn khi tải Google Identity Services.'));
        };

        document.head.appendChild(script);
      });

      return this.gisLoadPromise;
    }

    /**
     * Xin OAuth2 Access Token phạm vi `drive.file` qua popup chính chủ của Google.
     */
    async requestOAuthAccessToken(clientIdInput, promptMode = 'consent') {
      const clientId = String(clientIdInput || '').trim();
      if (!clientId) {
        throw new Error('Vui lòng nhập OAuth 2.0 Client ID (Google Cloud Console) trước khi đăng nhập.');
      }
      if (!clientId.includes('.apps.googleusercontent.com')) {
        throw new Error(
          'OAuth Client ID không đúng định dạng chuẩn Google ("...apps.googleusercontent.com").'
        );
      }

      const oauth2 = await this.loadGoogleIdentityServicesLibrary();
      return new Promise((resolve, reject) => {
        try {
          const tokenClient = oauth2.initTokenClient({
            client_id: clientId,
            scope: MOD37_CONSTANTS.GOOGLE_APIS.DRIVE_SCOPE,
            callback: (tokenResponse) => {
              if (!tokenResponse) {
                reject(new Error('Google OAuth không trả về phản hồi.'));
                return;
              }
              if (tokenResponse.error) {
                reject(
                  new Error(
                    `Google từ chối cấp quyền: ${tokenResponse.error_description || tokenResponse.error}`
                  )
                );
                return;
              }
              if (!tokenResponse.access_token) {
                reject(new Error('Không nhận được Access Token hợp lệ từ Google.'));
                return;
              }
              const expiresInSec = Number(tokenResponse.expires_in || 3500);
              this.accessToken = tokenResponse.access_token;
              this.tokenExpiresAtMs = Date.now() + expiresInSec * 1000;
              resolve({
                accessToken: this.accessToken,
                expiresInSec,
              });
            },
            error_callback: (err) => {
              reject(
                new Error(
                  `Cửa sổ đăng nhập Google đóng hoặc bị chặn (${err?.type || err?.message || 'popup_closed'}).`
                )
              );
            },
          });

          tokenClient.requestAccessToken({ prompt: promptMode });
        } catch (err) {
          reject(err);
        }
      });
    }
  }

  // ==========================================================================
  // PHẦN 7: GOOGLE DRIVE REST V3 FOLDER & MULTIPART UPLOADER + CHIA SẺ LINK
  // ==========================================================================

  class GoogleDriveWorkspaceUploader {
    constructor(authClient) {
      this.authClient = authClient;
    }

    async fetchDriveJsonWithRetry(url, options = {}, attempt = 0) {
      const token = this.authClient.accessToken;
      if (!token) {
        throw new Error('Chưa có Google OAuth Access Token hợp lệ.');
      }

      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${token}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MOD37_CONSTANTS.FETCH_TIMEOUT_MS);

      try {
        const res = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if ((res.status === 429 || res.status >= 500) && attempt < MOD37_CONSTANTS.MAX_UPLOAD_RETRY_COUNT) {
          await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
          return this.fetchDriveJsonWithRetry(url, options, attempt + 1);
        }

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.error?.message || `Google Drive HTTP ${res.status}`;
          throw new Error(scrubSensitiveTokensFromText(msg));
        }
        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err?.name === 'AbortError' && attempt < MOD37_CONSTANTS.MAX_UPLOAD_RETRY_COUNT) {
          return this.fetchDriveJsonWithRetry(url, options, attempt + 1);
        }
        throw err;
      }
    }

    async createDriveFolder(folderName, parentFolderId = '') {
      const metadata = {
        name: String(folderName || 'WebTieuThuyetCuaBi').trim(),
        mimeType: 'application/vnd.google-apps.folder',
      };
      if (parentFolderId) {
        metadata.parents = [parentFolderId];
      }

      return this.fetchDriveJsonWithRetry(
        `${MOD37_CONSTANTS.GOOGLE_APIS.DRIVE_FILES_ENDPOINT}?fields=id,name,webViewLink`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify(metadata),
        }
      );
    }

    /**
     * Tải lên 1 tệp bằng chuẩn multipart/related lên Google Drive v3.
     */
    async uploadMultipartFileToDrive({ fileName, mimeType, contentBlobOrString, parentFolderId }) {
      const boundary = `-------NoirStudioBoundary${Date.now().toString(16)}${Math.random()
        .toString(16)
        .slice(2, 8)}`;

      const metadata = {
        name: String(fileName || 'file.txt'),
        parents: parentFolderId ? [parentFolderId] : undefined,
      };
      if (!metadata.parents) delete metadata.parents;

      const metaPart =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`;
      const endPart = `\r\n--${boundary}--`;

      const bodyBlob = new Blob([metaPart, contentBlobOrString, endPart], {
        type: `multipart/related; boundary=${boundary}`,
      });

      return this.fetchDriveJsonWithRetry(
        `${MOD37_CONSTANTS.GOOGLE_APIS.DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart&fields=id,name,webViewLink`,
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: bodyBlob,
        }
      );
    }

    async setAnyoneReaderPermission(fileOrFolderId) {
      await this.fetchDriveJsonWithRetry(
        `${MOD37_CONSTANTS.GOOGLE_APIS.DRIVE_FILES_ENDPOINT}/${encodeURIComponent(
          fileOrFolderId
        )}/permissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }
      );

      return this.fetchDriveJsonWithRetry(
        `${MOD37_CONSTANTS.GOOGLE_APIS.DRIVE_FILES_ENDPOINT}/${encodeURIComponent(
          fileOrFolderId
        )}?fields=id,name,webViewLink`
      );
    }

    /**
     * Tải trọn bộ thư mục công việc + file .ZIP dự phòng lên Google Drive và bật quyền chia sẻ link công khai.
     */
    async uploadWorkspacePackageAndShare({ exportPackage, zipBlob, makePublicLink = true, onProgress }) {
      const emit = (pct, msg) => {
        if (typeof onProgress === 'function') {
          onProgress(Math.min(100, Math.max(0, Math.round(pct))), msg);
        }
      };

      const { folderMeta, files } = exportPackage;
      emit(5, `Đang tạo thư mục gốc "${folderMeta.displayFolderName}" trên Google Drive...`);
      const rootFolder = await this.createDriveFolder(folderMeta.displayFolderName);
      const rootId = rootFolder.id;

      // Tạo các thư mục con
      const subFolderIds = {};
      const groupKeys = Object.values(MOD37_CONSTANTS.SUBFOLDERS);
      for (let i = 0; i < groupKeys.length; i++) {
        const groupName = groupKeys[i];
        emit(8 + i * 3, `Đang tạo thư mục con ${groupName}...`);
        const createdSub = await this.createDriveFolder(groupName, rootId);
        subFolderIds[groupName] = createdSub.id;
      }

      // Upload từng file thành phần + tệp .ZIP gộp
      const totalUploads = files.length + 1;
      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const parentId = item.folderGroup ? subFolderIds[item.folderGroup] || rootId : rootId;
        const pct = 22 + ((i + 1) / totalUploads) * 68;
        emit(pct, `Đang tải tệp (${i + 1}/${totalUploads}): ${item.relativePath}`);

        const uploaded = await this.uploadMultipartFileToDrive({
          fileName: item.name,
          mimeType: item.mimeType,
          contentBlobOrString: item.content,
          parentFolderId: parentId,
        });
        uploadedFiles.push(uploaded);
      }

      if (zipBlob) {
        emit(92, `Đang tải kèm gói nén ${folderMeta.safeZipFolderName}.zip lên thư mục gốc...`);
        const zipUploaded = await this.uploadMultipartFileToDrive({
          fileName: `${folderMeta.safeZipFolderName}.zip`,
          mimeType: 'application/zip',
          contentBlobOrString: zipBlob,
          parentFolderId: rootId,
        });
        uploadedFiles.push(zipUploaded);
      }

      let shareUrl =
        rootFolder.webViewLink || `https://drive.google.com/drive/folders/${encodeURIComponent(rootId)}`;
      let publicShared = false;

      if (makePublicLink) {
        emit(97, 'Đang mở quyền Xem cho bất kỳ ai có liên kết...');
        try {
          const sharedMeta = await this.setAnyoneReaderPermission(rootId);
          if (sharedMeta?.webViewLink) shareUrl = sharedMeta.webViewLink;
          publicShared = true;
        } catch (permErr) {
          notifyToast(
            `Thư mục đã lên Drive nhưng chưa bật được link công khai: ${permErr?.message || ''}`,
            'warning',
            5000
          );
        }
      }

      emit(100, 'Hoàn tất đồng bộ lên Google Drive!');
      return {
        folderId: rootId,
        folderName: folderMeta.displayFolderName,
        shareUrl,
        publicShared,
        uploadedCount: uploadedFiles.length,
        uploadedAtIso: new Date().toISOString(),
      };
    }
  }

  // ==========================================================================
  // PHẦN 8: QUẢN LÝ LỊCH SỬ ĐỒNG BỘ & NHẬT KÝ XUẤT BẢN (LOCALSTORAGE + IDB)
  // ==========================================================================

  class SyncHistoryLedgerManager {
    constructor() {
      this.records = this.loadFromStorage();
    }

    loadFromStorage() {
      const parsed = safeParseJson(
        readLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.SYNC_HISTORY, '[]'),
        []
      );
      return Array.isArray(parsed) ? parsed.slice(0, MOD37_CONSTANTS.MAX_HISTORY_RECORDS) : [];
    }

    appendRecord(entry) {
      const record = {
        id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind: String(entry?.kind || 'ZIP_EXPORT'), // 'ZIP_EXPORT' | 'JSON_EXPORT' | 'GDRIVE_UPLOAD' | 'CROSS_RESTORE'
        folderName: String(entry?.folderName || 'WebTieuThuyetCuaBi'),
        fileCount: Number(entry?.fileCount || 0),
        totalBytes: Number(entry?.totalBytes || 0),
        shareUrl: String(entry?.shareUrl || ''),
        note: String(entry?.note || ''),
        createdAtIso: new Date().toISOString(),
      };
      this.records.unshift(record);
      this.records = this.records.slice(0, MOD37_CONSTANTS.MAX_HISTORY_RECORDS);
      writeLocalStorageSafe(
        MOD37_CONSTANTS.STORAGE_KEYS.SYNC_HISTORY,
        safeStringifyJson(this.records, false)
      );
      return record;
    }

    clearAllRecords() {
      this.records = [];
      writeLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.SYNC_HISTORY, '[]');
    }

    getSummaryStats() {
      return {
        totalRecords: this.records.length,
        zipExports: this.records.filter((r) => r.kind === 'ZIP_EXPORT').length,
        driveUploads: this.records.filter((r) => r.kind === 'GDRIVE_UPLOAD').length,
        restores: this.records.filter((r) => r.kind === 'CROSS_RESTORE').length,
        latestRecord: this.records[0] || null,
      };
    }
  }

  // ==========================================================================
  // PHẦN 9: GIAO DIỆN TAB 6 (ACCORDION 3) & BỘ ĐIỀU KHIỂN WORKSPACE SYNC
  // ==========================================================================

  class WorkspaceExportAndGDriveController {
    constructor() {
      this.zipWriter = new PureJsWorkspaceZipWriter();
      this.zipReader = new PureJsWorkspaceZipReader();
      this.collector = new WorkspaceSnapshotCollector();
      this.restorer = new WorkspaceCrossDeviceRestorer(this.zipReader);
      this.authClient = new GoogleDriveCloudAuthAndVerifyClient();
      this.driveUploader = new GoogleDriveWorkspaceUploader(this.authClient);
      this.historyLedger = new SyncHistoryLedgerManager();
      this.hasInitialized = false;
      this.isBusy = false;
      this.lastShareResult = null;
    }

    init() {
      this.renderWorkspaceExportUI();
      this.bindWorkspaceExportEvents();
      this.registerTooltipsForMod37();
      this.refreshStatsPreview();
      const initRoot = document.getElementById(MOD37_CONSTANTS.ROOT_ELEMENT_ID);
      if (initRoot) NS.i18n?.translateElement?.(initRoot);
      if (!this._i18nBound) {
        this._i18nBound = true;
        const onLangChanged = () => {
          this.renderWorkspaceExportUI();
          this.bindWorkspaceExportEvents();
          this.registerTooltipsForMod37();
          this.refreshStatsPreview();
          this.renderAuthStatusBadge();
          this.renderSyncHistoryUI();
          const rootEl = document.getElementById(MOD37_CONSTANTS.ROOT_ELEMENT_ID);
          if (rootEl) NS.i18n?.translateElement?.(rootEl);
          const modal = document.getElementById('modal-mod37-workspace-sync');
          if (modal && !modal.classList.contains('hidden')) {
            NS.i18n?.translateElement?.(modal);
          }
        };
        NS.bus?.on?.('i18n:changed', onLangChanged);
        if (typeof global !== 'undefined' && global.addEventListener) {
          global.addEventListener('noir:i18n:changed', onLangChanged);
        }
      }
      this.hasInitialized = true;
      return true;
    }

    openWorkspaceSyncModal() {
      const modal = document.getElementById('modal-mod37-workspace-sync');
      if (modal) {
        modal.classList.remove('hidden');
      }
      const originEl = document.getElementById('mod37-oauth-origin-display');
      if (originEl) {
        originEl.textContent = getSafeAppOriginForOAuth();
      }
      this.refreshStatsPreview();
      this.renderAuthStatusBadge();
      this.renderSyncHistoryUI();
      if (modal) NS.i18n?.translateElement?.(modal);
      return true;
    }

    closeWorkspaceSyncModal() {
      const modal = document.getElementById('modal-mod37-workspace-sync');
      if (modal) {
        modal.classList.add('hidden');
      }
      return true;
    }

    /**
     * Tạo gói .ZIP hoàn chỉnh phục vụ cả nút tải xuống và các bài kiểm thử tự động.
     */
    buildWorkspaceZipPackage(rawFolderName = '') {
      const folderInputEl = document.getElementById(MOD37_CONSTANTS.INPUT_FOLDER_NAME_ID);
      const effectiveInput =
        String(rawFolderName || folderInputEl?.value || readLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.FOLDER_NAME, '') || '').trim();

      const exportPackage = this.collector.buildReadableExportFileEntries(effectiveInput);
      const zipResult = this.zipWriter.buildZipArchive(exportPackage.files);

      return {
        exportPackage,
        zipResult,
        downloadFilename: `${exportPackage.folderMeta.safeZipFolderName}.zip`,
      };
    }

    async parseZipPackageForInspection(blobOrBuffer) {
      const buf =
        blobOrBuffer instanceof Blob ? await blobOrBuffer.arrayBuffer() : blobOrBuffer;
      return this.zipReader.parseZipArchive(buf);
    }

    renderWorkspaceExportUI() {
      const rootEl = document.getElementById(MOD37_CONSTANTS.ROOT_ELEMENT_ID);
      if (!rootEl) return;

      const savedFolderName =
        readLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.FOLDER_NAME, '') ||
        `Tieu_Thuyet_Cua_Bi_${formatDateTag().slice(0, 10)}`;
      const savedDriveKey = readLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.DRIVE_API_KEY, '');
      const savedClientId = readLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.OAUTH_CLIENT_ID, '');
      const guideOpen = readLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.CLOUD_GUIDE_OPEN, 'false') === 'true';
      const safeOrigin = getSafeAppOriginForOAuth();
      const httpReady = isHttpOriginSupportedForOAuth();

      rootEl.innerHTML = `
        <div class="space-y-4 w-full min-w-0">
          <!-- KHỐI 1: ĐẶT TÊN THƯ MỤC & THỐNG KÊ GÓI DỮ LIỆU -->
          <div class="rounded-xl border border-teal-500/35 bg-zinc-950/85 p-3.5 sm:p-4 space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 class="text-xs sm:text-sm font-extrabold text-teal-300 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🗂️ Bước 1: Đặt Tên Thư Mục Kết Quả Làm Việc</span>
                </h4>
                <p class="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  Tên này sẽ được dùng để đặt tên file .ZIP khi tải về máy và tên Thư mục tạo trực tiếp trên Google Drive của bạn.
                </p>
              </div>
              <span id="mod37-live-stats-pill" class="px-2.5 py-1 rounded-full border border-teal-500/40 bg-teal-950/60 text-teal-200 text-[10px] font-bold">
                Đang tính dữ liệu...
              </span>
            </div>

            <div class="flex flex-col sm:flex-row gap-2">
              <div class="flex-1 min-w-0">
                <label for="mod37-input-folder-name" class="sr-only">Tên thư mục làm việc</label>
                <input
                  id="mod37-input-folder-name"
                  type="text"
                  maxlength="96"
                  value="${escapeHtmlSafe(savedFolderName)}"
                  placeholder="Ví dụ: Tieu_Thuyet_Vuot_Kho_Tap_1"
                  class="w-full min-w-0 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 text-xs sm:text-sm font-semibold focus:border-teal-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                id="btn-mod37-suggest-folder-name"
                class="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[11px] font-bold shrink-0 transition"
              >
                ✨ Gợi ý theo ngày
              </button>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 text-[10px] text-emerald-300/90 bg-emerald-950/30 border border-emerald-500/25 rounded-lg px-2.5 py-1.5">
              <span>🔒 Bảo mật tuyệt đối: API Key Gemini &amp; OAuth Token được tự động lọc bỏ khi đóng gói chia sẻ .ZIP.</span>
              <span id="mod37-preview-zip-name" class="font-mono text-teal-300 truncate max-w-full"></span>
            </div>
          </div>

          <!-- KHỐI 2: TẢI VỀ MÁY (.ZIP / .JSON) & KHÔI PHỤC ĐA THIẾT BỊ -->
          <div class="rounded-xl border border-emerald-500/35 bg-zinc-950/85 p-3.5 sm:p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h4 class="text-xs sm:text-sm font-extrabold text-emerald-300 uppercase tracking-wide">
                💾 Bước 2A: Tải Về Máy &amp; Chuyển Dự Án Sang Thiết Bị Khác
              </h4>
              <span class="text-[10px] font-bold text-zinc-400">Hỗ trợ Offline 100%</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                id="btn-mod37-export-zip"
                class="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 transition"
              >
                <span>📦 Tải Thư Mục Về Máy (.ZIP)</span>
              </button>

              <button
                type="button"
                id="btn-mod37-export-json"
                class="px-3.5 py-2.5 rounded-xl border border-emerald-500/45 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>🧬 Tải File Trạng Thái (.JSON)</span>
              </button>

              <button
                type="button"
                id="btn-mod37-import-trigger"
                class="px-3.5 py-2.5 rounded-xl border border-sky-500/45 bg-sky-950/40 hover:bg-sky-900/50 text-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>📥 Khôi Phục Từ .ZIP / .JSON</span>
              </button>
              <input id="mod37-input-import-file" type="file" accept=".zip,.json" class="hidden" />
            </div>

            <div id="mod37-local-export-feedback" class="hidden rounded-lg border border-emerald-500/35 bg-emerald-950/35 px-3 py-2 text-[11px] text-emerald-200 leading-relaxed"></div>
          </div>

          <!-- KHỐI 3: KẾT NỐI & ĐỒNG BỘ TRỰC TIẾP LÊN GOOGLE DRIVE TRONG TRÌNH DUYỆT -->
          <div class="rounded-xl border border-sky-500/40 bg-zinc-950/85 p-3.5 sm:p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 class="text-xs sm:text-sm font-extrabold text-sky-300 uppercase tracking-wide flex items-center gap-1.5">
                  <span>☁️ Bước 2B: Tải Thẳng Lên Google Drive &amp; Lấy Link Chia Sẻ</span>
                </h4>
                <p class="text-[11px] text-zinc-400 mt-0.5">
                  Tạo ngay thư mục chứa toàn bộ chương, Story Bible và gói .ZIP trên Google Drive cá nhân, kèm tùy chọn mở link chia sẻ nhanh.
                </p>
              </div>
              <button
                type="button"
                id="btn-mod37-toggle-cloud-guide"
                aria-expanded="${guideOpen ? 'true' : 'false'}"
                class="px-2.5 py-1.5 rounded-lg border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/50 text-sky-200 text-[11px] font-bold transition"
              >
                ${guideOpen ? '▴ Ẩn Hướng Dẫn Google Cloud' : '▾ Hướng Dẫn Tạo Key & Client ID'}
              </button>
            </div>

            <!-- Hướng dẫn Google Cloud thu gọn -->
            <div id="mod37-cloud-guide-body" class="${guideOpen ? '' : 'hidden'} rounded-xl border border-sky-500/30 bg-zinc-900/90 p-3 space-y-2.5 text-[11px] text-zinc-300">
              ${CLOUD_SETUP_STEPS_GUIDE.map(
                (st) => `
                <div class="p-2 rounded-lg border border-zinc-800 bg-zinc-950/80 space-y-1">
                  <div class="font-bold text-sky-300">Bước ${st.stepNumber}: ${escapeHtmlSafe(st.title)}</div>
                  <p class="text-zinc-400 leading-relaxed">${escapeHtmlSafe(st.description)}</p>
                  ${
                    st.linkUrl
                      ? `<a href="${escapeHtmlSafe(
                          st.linkUrl
                        )}" target="_blank" rel="noopener noreferrer" class="inline-block text-emerald-300 hover:text-emerald-200 underline font-bold">${escapeHtmlSafe(
                          st.linkLabel
                        )}</a>`
                      : ''
                  }
                </div>`
              ).join('')}

              <div class="p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/25 flex flex-wrap items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="text-[10px] font-bold text-amber-300 uppercase">Authorized JavaScript Origin của trang này:</div>
                  <div id="mod37-oauth-origin-display" class="font-mono text-[11px] text-amber-100 break-all">${escapeHtmlSafe(
                    safeOrigin
                  )}</div>
                </div>
                <button
                  type="button"
                  id="btn-mod37-copy-origin"
                  class="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-extrabold shrink-0"
                >
                  📋 Chép Origin
                </button>
              </div>
            </div>

            ${
              !httpReady
                ? `<div class="rounded-lg border border-amber-500/40 bg-amber-950/35 px-3 py-2 text-[11px] text-amber-200">
                    ⚠️ Bạn đang mở trang dạng <code>file://</code>. Google OAuth2 trên trình duyệt chỉ hoạt động qua <code>http://localhost</code> hoặc <code>https://</code>; còn tính năng <strong>Tải .ZIP về máy</strong> &amp; <strong>Kiểm tra API Key</strong> vẫn chạy bình thường.
                  </div>`
                : ''
            }

            <!-- Ô nhập Drive API Key & OAuth Client ID -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label for="mod37-input-drive-api-key" class="block text-[11px] font-bold text-zinc-300">
                  🔑 Google Drive API Key (Kiểm định kết nối Drive &amp; Flash-Lite)
                </label>
                <div class="flex gap-1.5">
                  <input
                    id="mod37-input-drive-api-key"
                    type="password"
                    autocomplete="off"
                    value="${escapeHtmlSafe(savedDriveKey)}"
                    placeholder="Dán AIza... (từ Google Cloud Credentials)"
                    class="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-xs focus:border-sky-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    id="btn-mod37-verify-drive-key"
                    class="px-2.5 py-2 rounded-lg border border-sky-500/50 bg-sky-900/50 hover:bg-sky-800 text-sky-100 text-[11px] font-bold shrink-0 transition"
                  >
                    🔍 Xác Thực
                  </button>
                </div>
              </div>

              <div class="space-y-1.5">
                <label for="mod37-input-oauth-client-id" class="block text-[11px] font-bold text-zinc-300">
                  🛡️ OAuth 2.0 Client ID (Bắt buộc để ghi folder lên Drive)
                </label>
                <input
                  id="mod37-input-oauth-client-id"
                  type="text"
                  autocomplete="off"
                  value="${escapeHtmlSafe(savedClientId)}"
                  placeholder="...apps.googleusercontent.com"
                  class="w-full min-w-0 px-2.5 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-xs focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div id="mod37-drive-verify-status" class="hidden rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-[11px] text-zinc-200 leading-relaxed"></div>

            <!-- Tùy chọn chia sẻ + Nút Đăng nhập & Tải lên Google Drive -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label class="inline-flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer select-none">
                <input id="mod37-chk-public-share" type="checkbox" checked class="rounded border-zinc-600 bg-zinc-900 text-sky-500 focus:ring-sky-500" />
                <span>Mở quyền <strong>Bất kỳ ai có link đều xem được</strong> (dễ gửi chuyển máy)</span>
              </label>
              <span id="mod37-auth-status-badge" class="px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 text-[10px] font-bold">
                ⚪ Chưa đăng nhập Google Drive
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                id="btn-mod37-google-signin"
                class="px-3.5 py-2.5 rounded-xl border border-indigo-500/50 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-100 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>🔐 Đăng Nhập Google (drive.file)</span>
              </button>

              <button
                type="button"
                id="btn-mod37-upload-gdrive"
                class="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 transition"
              >
                <span>🚀 Tạo Folder &amp; Tải Lên Google Drive</span>
              </button>
            </div>

            <!-- Thanh tiến trình upload -->
            <div id="mod37-upload-progress-wrap" class="hidden space-y-1.5 pt-1">
              <div class="flex items-center justify-between text-[11px]">
                <span id="mod37-upload-progress-label" class="text-sky-200 font-semibold">Đang chuẩn bị...</span>
                <span id="mod37-upload-progress-pct" class="font-mono text-sky-300 font-bold">0%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div id="mod37-upload-progress-bar" class="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-200" style="width: 0%"></div>
              </div>
            </div>

            <!-- Hộp hiển thị Link Google Drive sau khi đồng bộ xong -->
            <div id="mod37-gdrive-result-box" class="hidden rounded-xl border border-emerald-500/50 bg-emerald-950/35 p-3 space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-xs font-extrabold text-emerald-300">✅ Đã đồng bộ thư mục lên Google Drive thành công!</span>
                <button
                  type="button"
                  id="btn-mod37-copy-gdrive-link"
                  class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold transition"
                >
                  📋 Sao chép Link
                </button>
              </div>
              <a
                id="mod37-gdrive-share-link"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                class="block font-mono text-[11px] text-sky-300 hover:text-sky-200 underline break-all"
              ></a>
            </div>
          </div>

          <!-- KHỐI 4: LỊCH SỬ XUẤT BẢN & ĐỒNG BỘ GẦN ĐÂY -->
          <div class="rounded-xl border border-zinc-800 bg-zinc-950/75 p-3 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                id="btn-mod37-toggle-history"
                class="text-left text-[11px] font-extrabold text-zinc-300 hover:text-teal-300 flex items-center gap-1.5"
              >
                <span>📜 Nhật ký xuất .ZIP / Google Drive &amp; Khôi phục</span>
                <span id="mod37-history-count-badge" class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">0</span>
              </button>
              <button
                type="button"
                id="btn-mod37-clear-history"
                class="text-[10px] text-zinc-500 hover:text-rose-300 font-semibold"
              >
                Xóa nhật ký
              </button>
            </div>
            <div id="mod37-history-list-body" class="hidden space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[11px]"></div>
          </div>
        </div>
      `;

      this.syncPreviewFilenameLabel();
      this.renderAuthStatusBadge();
      this.renderSyncHistoryUI();
    }

    bindWorkspaceExportEvents() {
      const folderInput = document.getElementById(MOD37_CONSTANTS.INPUT_FOLDER_NAME_ID);
      if (folderInput && !folderInput.dataset.mod37Bound) {
        folderInput.dataset.mod37Bound = '1';
        folderInput.addEventListener('input', () => {
          writeLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.FOLDER_NAME, folderInput.value.trim());
          this.syncPreviewFilenameLabel();
        });
      }

      document.getElementById('btn-mod37-suggest-folder-name')?.addEventListener('click', () => {
        const inputEl = document.getElementById(MOD37_CONSTANTS.INPUT_FOLDER_NAME_ID);
        if (!inputEl) return;
        const stats = this.collector.collectFullWorkspaceState().statistics;
        const nextName = `Bi_LightNovel_${stats.chapterCount}Chuong_${formatDateTag()}`;
        inputEl.value = nextName;
        writeLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.FOLDER_NAME, nextName);
        this.syncPreviewFilenameLabel();
        notifyToast(`Đã gợi ý tên thư mục mới: ${nextName}`, 'info', 2500);
      });

      const driveKeyInput = document.getElementById('mod37-input-drive-api-key');
      if (driveKeyInput && !driveKeyInput.dataset.mod37Bound) {
        driveKeyInput.dataset.mod37Bound = '1';
        driveKeyInput.addEventListener('change', () => {
          writeLocalStorageSafe(
            MOD37_CONSTANTS.STORAGE_KEYS.DRIVE_API_KEY,
            driveKeyInput.value.trim()
          );
        });
      }

      const clientIdInput = document.getElementById('mod37-input-oauth-client-id');
      if (clientIdInput && !clientIdInput.dataset.mod37Bound) {
        clientIdInput.dataset.mod37Bound = '1';
        clientIdInput.addEventListener('change', () => {
          writeLocalStorageSafe(
            MOD37_CONSTANTS.STORAGE_KEYS.OAUTH_CLIENT_ID,
            clientIdInput.value.trim()
          );
        });
      }

      document.getElementById('btn-mod37-export-zip')?.addEventListener('click', () => {
        this.handleExportZipClick();
      });

      document.getElementById('btn-mod37-export-json')?.addEventListener('click', () => {
        this.handleExportJsonClick();
      });

      const importFileEl = document.getElementById('mod37-input-import-file');
      document.getElementById('btn-mod37-import-trigger')?.addEventListener('click', () => {
        importFileEl?.click();
      });
      importFileEl?.addEventListener('change', async (e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        await this.handleCrossDeviceImportFile(file);
        importFileEl.value = '';
      });

      document.getElementById('btn-mod37-toggle-cloud-guide')?.addEventListener('click', () => {
        const body = document.getElementById('mod37-cloud-guide-body');
        const btn = document.getElementById('btn-mod37-toggle-cloud-guide');
        if (!body || !btn) return;
        const willOpen = body.classList.contains('hidden');
        body.classList.toggle('hidden', !willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        btn.textContent = willOpen ? '▴ Ẩn Hướng Dẫn Google Cloud' : '▾ Hướng Dẫn Tạo Key & Client ID';
        writeLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.CLOUD_GUIDE_OPEN, willOpen ? 'true' : 'false');
      });

      document.getElementById('btn-mod37-copy-origin')?.addEventListener('click', async () => {
        const originText = getSafeAppOriginForOAuth().split(' ')[0];
        const ok = await copyTextSafe(originText);
        notifyToast(
          ok
            ? `Đã sao chép Origin: ${originText}`
            : `Vui lòng copy thủ công: ${originText}`,
          ok ? 'success' : 'warning',
          3200
        );
      });

      document.getElementById('btn-mod37-verify-drive-key')?.addEventListener('click', () => {
        this.handleVerifyDriveKeyClick();
      });

      document.getElementById('btn-mod37-google-signin')?.addEventListener('click', () => {
        this.handleGoogleSignInClick();
      });

      document.getElementById('btn-mod37-upload-gdrive')?.addEventListener('click', () => {
        this.handleUploadToGDriveClick();
      });

      document.getElementById('btn-mod37-copy-gdrive-link')?.addEventListener('click', async () => {
        const link = document.getElementById('mod37-gdrive-share-link')?.href || '';
        if (!link || link === '#') return;
        const ok = await copyTextSafe(link);
        notifyToast(
          ok ? 'Đã sao chép đường link thư mục Google Drive!' : 'Không thể tự động copy link.',
          ok ? 'success' : 'warning',
          3000
        );
      });

      document.getElementById('btn-mod37-toggle-history')?.addEventListener('click', () => {
        const listEl = document.getElementById('mod37-history-list-body');
        if (listEl) listEl.classList.toggle('hidden');
      });

      document.getElementById('btn-mod37-clear-history')?.addEventListener('click', () => {
        this.historyLedger.clearAllRecords();
        this.renderSyncHistoryUI();
        notifyToast('Đã dọn sạch nhật ký xuất .ZIP / Google Drive.', 'info', 2500);
      });
    }

    syncPreviewFilenameLabel() {
      const inputEl = document.getElementById(MOD37_CONSTANTS.INPUT_FOLDER_NAME_ID);
      const previewEl = document.getElementById('mod37-preview-zip-name');
      if (!previewEl) return;
      const meta = normalizeFolderNames(inputEl?.value || '');
      const label = NS.i18n?.translateText ? NS.i18n.translateText('Tệp nén:') : 'Tệp nén:';
      previewEl.textContent = `${label} ${meta.safeZipFolderName}.zip`;
    }

    refreshStatsPreview() {
      const pill = document.getElementById('mod37-live-stats-pill');
      if (!pill) return;
      const state = this.collector.collectFullWorkspaceState();
      const s = state.statistics;
      const wordsStr = NS.i18n?.formatNumber
        ? NS.i18n.formatNumber(Number(s.totalWords || 0))
        : Number(s.totalWords || 0).toLocaleString('vi-VN');
      const raw = `${s.chapterCount} chương (${wordsStr} từ) • ${s.characterCount} nhân vật`;
      pill.textContent = NS.i18n?.translateText ? NS.i18n.translateText(raw) : raw;
    }

    handleExportZipClick() {
      try {
        this.refreshStatsPreview();
        const pkg = this.buildWorkspaceZipPackage();
        const downloaded = triggerBlobDownload(pkg.zipResult.blob, pkg.downloadFilename);
        const feedbackEl = document.getElementById('mod37-local-export-feedback');
        if (feedbackEl) {
          feedbackEl.classList.remove('hidden');
          feedbackEl.innerHTML = `✅ Đã đóng gói xong <strong>${escapeHtmlSafe(
            pkg.downloadFilename
          )}</strong> (${pkg.zipResult.totalFiles} tệp, ${formatBytesReadable(
            pkg.zipResult.totalBytes
          )}). Gồm toàn bộ Chương truyện, Story Bible, Nhân vật, Mốc chuyển cảnh, Kết quả 5 Chế độ AI và file khôi phục đa thiết bị.`;
        }
        this.historyLedger.appendRecord({
          kind: 'ZIP_EXPORT',
          folderName: pkg.exportPackage.folderMeta.displayFolderName,
          fileCount: pkg.zipResult.totalFiles,
          totalBytes: pkg.zipResult.totalBytes,
          note: downloaded ? 'Đã tải xuống máy (.ZIP)' : 'Đã tạo Blob .ZIP',
        });
        this.renderSyncHistoryUI();
        notifyToast(
          `📦 Đã tải ${pkg.downloadFilename} (${pkg.zipResult.totalFiles} tệp)!`,
          'success',
          4200
        );
        return pkg;
      } catch (err) {
        notifyToast(`Lỗi đóng gói .ZIP: ${err?.message || 'Không xác định'}`, 'error', 5000);
        return null;
      }
    }

    handleExportJsonClick() {
      try {
        const inputEl = document.getElementById(MOD37_CONSTANTS.INPUT_FOLDER_NAME_ID);
        const meta = normalizeFolderNames(inputEl?.value || '');
        const snapshot = this.collector.collectFullWorkspaceState(meta.displayFolderName);
        const jsonStr = safeStringifyJson(snapshot, true);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const filename = `${meta.safeZipFolderName}_state.json`;
        triggerBlobDownload(blob, filename);

        const feedbackEl = document.getElementById('mod37-local-export-feedback');
        if (feedbackEl) {
          feedbackEl.classList.remove('hidden');
          feedbackEl.innerHTML = `🧬 Đã xuất tệp khôi phục <strong>${escapeHtmlSafe(
            filename
          )}</strong> (${formatBytesReadable(blob.size)}). Mang tệp này sang máy mới và bấm "Khôi phục từ .ZIP / .JSON" để tiếp tục viết.`;
        }
        this.historyLedger.appendRecord({
          kind: 'JSON_EXPORT',
          folderName: meta.displayFolderName,
          fileCount: 1,
          totalBytes: blob.size,
          note: `Đã xuất ${filename}`,
        });
        this.renderSyncHistoryUI();
        notifyToast(`🧬 Đã tải tệp trạng thái ${filename}!`, 'success', 3800);
        return { snapshot, filename, size: blob.size };
      } catch (err) {
        notifyToast(`Lỗi xuất .JSON: ${err?.message || 'Không xác định'}`, 'error', 5000);
        return null;
      }
    }

    async handleCrossDeviceImportFile(fileObj) {
      const feedbackEl = document.getElementById('mod37-local-export-feedback');
      try {
        const summary = await this.restorer.restoreFromFileObject(fileObj);
        this.refreshStatsPreview();
        this.historyLedger.appendRecord({
          kind: 'CROSS_RESTORE',
          folderName: fileObj.name,
          fileCount: summary.chaptersRestored,
          totalBytes: fileObj.size || 0,
          note: `Khôi phục ${summary.chaptersRestored} chương & Story Bible`,
        });
        this.renderSyncHistoryUI();

        if (feedbackEl) {
          feedbackEl.classList.remove('hidden');
          feedbackEl.innerHTML = `📥 <strong>Khôi phục thành công</strong> từ <code>${escapeHtmlSafe(
            summary.sourceLabel
          )}</code>: Đã nạp lại <strong>${
            summary.chaptersRestored
          } chương</strong>, ${summary.storyBibleRestored ? 'Story Bible + Nhân vật' : ''} ${
            summary.sceneMarkersRestored ? '+ Mốc phân cảnh/POV' : ''
          } vào Studio!`;
        }
        notifyToast(
          `✅ Đã khôi phục xong ${summary.chaptersRestored} chương từ "${fileObj.name}"!`,
          'success',
          4600
        );
        return summary;
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.classList.remove('hidden');
          feedbackEl.innerHTML = `❌ Lỗi khôi phục: ${escapeHtmlSafe(err?.message || '')}`;
        }
        notifyToast(`Không thể khôi phục tệp: ${err?.message || 'Lỗi định dạng'}`, 'error', 5000);
        return null;
      }
    }

    async handleVerifyDriveKeyClick() {
      const keyEl = document.getElementById('mod37-input-drive-api-key');
      const statusBox = document.getElementById('mod37-drive-verify-status');
      const btn = document.getElementById('btn-mod37-verify-drive-key');
      const driveKey = keyEl?.value?.trim() || '';
      writeLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.DRIVE_API_KEY, driveKey);

      if (btn) btn.disabled = true;
      if (statusBox) {
        statusBox.classList.remove('hidden');
        statusBox.innerHTML = '⏳ Đang kiểm định Google Drive API Key & Gemini Flash-Lite...';
      }

      try {
        const report = await this.authClient.verifyDriveApiKeyAndGeminiReadiness(driveKey);
        if (statusBox) {
          const driveIcon = report.driveDiscoveryOk ? '🟢' : '🟠';
          const geminiPart = report.geminiFlashLiteChecked
            ? `<div class="mt-1">${report.geminiFlashLiteOk ? '🟢' : '🟠'} <strong>Gemini Flash-Lite:</strong> ${escapeHtmlSafe(
                report.geminiNote
              )}</div>`
            : `<div class="mt-1 text-zinc-400">ℹ️ ${escapeHtmlSafe(report.geminiNote)}</div>`;
          statusBox.innerHTML = `<div>${driveIcon} <strong>Google Drive API:</strong> ${escapeHtmlSafe(
            report.driveStatusLabel
          )}</div>${geminiPart}`;
        }
        notifyToast(
          report.driveDiscoveryOk
            ? '🟢 Google Drive API Key hoạt động chuẩn xác!'
            : report.driveStatusLabel,
          report.driveDiscoveryOk ? 'success' : 'warning',
          4200
        );
        return report;
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    async handleGoogleSignInClick() {
      const clientIdEl = document.getElementById('mod37-input-oauth-client-id');
      const clientId = clientIdEl?.value?.trim() || '';
      writeLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.OAUTH_CLIENT_ID, clientId);

      try {
        await this.authClient.requestOAuthAccessToken(clientId, 'consent');
        this.renderAuthStatusBadge();
        notifyToast('🔐 Đăng nhập Google Drive thành công! Bạn có thể bấm Tải lên ngay.', 'success', 4200);
        return true;
      } catch (err) {
        this.renderAuthStatusBadge();
        notifyToast(err?.message || 'Chưa hoàn tất đăng nhập Google.', 'warning', 5200);
        return false;
      }
    }

    async handleUploadToGDriveClick() {
      if (this.isBusy) {
        notifyToast('Đang có tiến trình tải lên Google Drive, vui lòng chờ xong...', 'info', 2500);
        return null;
      }

      const clientId =
        document.getElementById('mod37-input-oauth-client-id')?.value?.trim() || '';
      writeLocalStorageSafe(MOD37_CONSTANTS.STORAGE_KEYS.OAUTH_CLIENT_ID, clientId);

      const uploadBtn = document.getElementById('btn-mod37-upload-gdrive');
      const progressWrap = document.getElementById('mod37-upload-progress-wrap');
      const progressBar = document.getElementById('mod37-upload-progress-bar');
      const progressLabel = document.getElementById('mod37-upload-progress-label');
      const progressPct = document.getElementById('mod37-upload-progress-pct');
      const resultBox = document.getElementById('mod37-gdrive-result-box');
      const shareLinkEl = document.getElementById('mod37-gdrive-share-link');

      this.isBusy = true;
      if (uploadBtn) uploadBtn.disabled = true;

      try {
        if (!this.authClient.hasValidAccessToken()) {
          await this.authClient.requestOAuthAccessToken(clientId, 'consent');
          this.renderAuthStatusBadge();
        }

        const pkg = this.buildWorkspaceZipPackage();
        const makePublicLink = Boolean(
          document.getElementById('mod37-chk-public-share')?.checked ?? true
        );

        if (progressWrap) progressWrap.classList.remove('hidden');

        const uploadResult = await this.driveUploader.uploadWorkspacePackageAndShare({
          exportPackage: pkg.exportPackage,
          zipBlob: pkg.zipResult.blob,
          makePublicLink,
          onProgress: (pct, msg) => {
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (progressLabel) progressLabel.textContent = msg;
            if (progressPct) progressPct.textContent = `${pct}%`;
          },
        });

        this.lastShareResult = uploadResult;
        if (resultBox && shareLinkEl) {
          resultBox.classList.remove('hidden');
          shareLinkEl.href = uploadResult.shareUrl;
          shareLinkEl.textContent = uploadResult.shareUrl;
        }

        this.historyLedger.appendRecord({
          kind: 'GDRIVE_UPLOAD',
          folderName: uploadResult.folderName,
          fileCount: uploadResult.uploadedCount,
          totalBytes: pkg.zipResult.totalBytes,
          shareUrl: uploadResult.shareUrl,
          note: uploadResult.publicShared ? 'Công khai (Reader anyone)' : 'Riêng tư trên Drive',
        });
        this.renderSyncHistoryUI();

        notifyToast(
          `☁️ Đã đưa thư mục "${uploadResult.folderName}" (${uploadResult.uploadedCount} tệp) lên Google Drive!`,
          'success',
          5000
        );
        return uploadResult;
      } catch (err) {
        notifyToast(`Tải lên Google Drive thất bại: ${err?.message || ''}`, 'error', 5500);
        return null;
      } finally {
        this.isBusy = false;
        if (uploadBtn) uploadBtn.disabled = false;
      }
    }

    renderAuthStatusBadge() {
      const badge = document.getElementById('mod37-auth-status-badge');
      if (!badge) return;
      const tr = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      if (this.authClient.hasValidAccessToken()) {
        const mins = Math.max(1, Math.round(this.authClient.getTokenRemainingSeconds() / 60));
        badge.className =
          'px-2.5 py-1 rounded-full border border-emerald-500/45 bg-emerald-950/60 text-emerald-300 text-[10px] font-bold';
        badge.textContent = tr(`🟢 Đã đăng nhập Google Drive (~${mins} phút)`);
      } else {
        badge.className =
          'px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 text-[10px] font-bold';
        badge.textContent = tr('⚪ Chưa đăng nhập Google Drive');
      }
    }

    renderSyncHistoryUI() {
      const listEl = document.getElementById('mod37-history-list-body');
      const countEl = document.getElementById('mod37-history-count-badge');
      const records = this.historyLedger.records;
      if (countEl) countEl.textContent = String(records.length);
      if (!listEl) return;

      if (records.length === 0) {
        listEl.innerHTML =
          '<div class="text-zinc-500 italic py-2">Chưa có phiên xuất .ZIP hoặc đồng bộ Google Drive nào gần đây.</div>';
        NS.i18n?.translateElement?.(listEl);
        return;
      }

      listEl.innerHTML = records
        .map((rec) => {
          const icon =
            rec.kind === 'GDRIVE_UPLOAD'
              ? '☁️'
              : rec.kind === 'CROSS_RESTORE'
                ? '📥'
                : rec.kind === 'JSON_EXPORT'
                  ? '🧬'
                  : '📦';
          return `
            <div class="p-2 rounded-lg border border-zinc-800 bg-zinc-900/80 flex flex-wrap items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="font-bold text-zinc-200 truncate" data-i18n-ignore="true">${icon} ${escapeHtmlSafe(
            rec.folderName
          )}</div>
                <div class="text-[10px] text-zinc-400">
                  <span data-i18n-ignore="true">${escapeHtmlSafe(formatHumanDateTime(rec.createdAtIso))}</span> • ${rec.fileCount} mục (${formatBytesReadable(
            rec.totalBytes
          )}) • ${escapeHtmlSafe(rec.note)}
                </div>
              </div>
              ${
                rec.shareUrl
                  ? `<a href="${escapeHtmlSafe(
                      rec.shareUrl
                    )}" target="_blank" rel="noopener noreferrer" class="text-[10px] font-bold text-sky-300 hover:text-sky-200 underline shrink-0">Mở Link Drive ↗</a>`
                  : ''
              }
            </div>`;
        })
        .join('');
      NS.i18n?.translateElement?.(listEl);
    }

    registerTooltipsForMod37() {
      const tips = [
        [
          'mod37-input-folder-name',
          'Đặt tên cho thư mục làm việc của bạn. Tên này sẽ áp dụng cho cả tệp .ZIP tải về máy lẫn thư mục mới tạo trên Google Drive.',
        ],
        [
          'btn-mod37-export-zip',
          'Đóng gói toàn bộ Chương truyện, Story Bible, Nhân vật, Đầu ra 5 Chế độ AI và file khôi phục vào 1 tệp .ZIP chuẩn tải ngay về thiết bị.',
        ],
        [
          'btn-mod37-import-trigger',
          'Chọn tệp .ZIP hoặc .JSON bạn đã tải từ máy cũ để khôi phục toàn bộ dự án sang máy mới ngay lập tức.',
        ],
        [
          'btn-mod37-verify-drive-key',
          'Kiểm tra Google Drive API Key thực tế qua internet và test độ sẵn sàng của Gemini Flash-Lite.',
        ],
        [
          'btn-mod37-google-signin',
          'Đăng nhập tài khoản Google cá nhân trên trình duyệt (chỉ cấp quyền drive.file cho thư mục Studio tạo).',
        ],
        [
          'btn-mod37-upload-gdrive',
          'Tạo thư mục theo tên bạn nhập trên Google Drive, tải lên toàn bộ bản thảo + tệp .ZIP và tạo link chia sẻ.',
        ],
      ];

      const trTip = (s) => (NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || ''));
      tips.forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const localized = trTip(text);
        el.setAttribute('data-noir-tooltip', localized);
        if (!el.getAttribute('title')) {
          el.setAttribute('title', localized);
        }
      });
    }

    getDiagnosticsSummary() {
      return {
        module: MOD37_CONSTANTS.MODULE_KEY,
        version: MOD37_CONSTANTS.VERSION,
        initialized: this.hasInitialized,
        hasValidOAuthToken: this.authClient.hasValidAccessToken(),
        historySummary: this.historyLedger.getSummaryStats(),
        httpOriginReadyForOAuth: isHttpOriginSupportedForOAuth(),
      };
    }
  }

  // ==========================================================================
  // PHẦN 10: ĐĂNG KÝ SINGLETON MODULE 37 LÊN `window.NoirStudio`
  // ==========================================================================
  const workspaceSyncController = new WorkspaceExportAndGDriveController();
  NS.workspaceSync = workspaceSyncController;
  NS.Mod37WorkspaceSyncConstants = MOD37_CONSTANTS;
  NS.Mod37PureJsZipWriter = PureJsWorkspaceZipWriter;
  NS.Mod37PureJsZipReader = PureJsWorkspaceZipReader;
  NS.Mod37SnapshotCollector = WorkspaceSnapshotCollector;
  NS.Mod37CrossDeviceRestorer = WorkspaceCrossDeviceRestorer;
  NS.Mod37DriveCloudClient = GoogleDriveCloudAuthAndVerifyClient;
  NS.Mod37DriveUploader = GoogleDriveWorkspaceUploader;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule(MOD37_CONSTANTS.MODULE_KEY, workspaceSyncController);
  }
})(typeof window !== 'undefined' ? window : globalThis);
