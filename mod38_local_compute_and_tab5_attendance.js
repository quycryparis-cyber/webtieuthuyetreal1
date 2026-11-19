/**
 * ============================================================================
 * MODULE 38: XƯỞNG XỬ LÝ TÀI LIỆU CỤC BỘ (ZERO-UPLOAD CLIENT-SIDE) &
 *             BẢNG ĐIỂM DANH CHUYÊN CẦN TAB 5 + BÀN ĐIỀU KHIỂN MODAL TAB 6
 *             (mod38_local_compute_and_tab5_attendance.js)
 * ============================================================================
 * Nhiệm vụ cốt lõi:
 *   1. Vận hành mục "1. Điểm Danh" tách riêng ở đầu Tab 5 (`#s14-panel-attendance-box`):
 *      - Điểm danh thủ công 1 chạm ("✅ Điểm Danh Hôm Nay") & tự động đồng bộ từ
 *        phiên Pomodoro (Mod 20) + sản lượng chữ viết mỗi ngày.
 *      - Biểu đồ 7 ngày gần nhất, chuỗi ngày liên tiếp (Streak), 4 Huy hiệu thành tích,
 *        KPI mục tiêu từ/ngày chỉnh trực tiếp và xuất bảng lịch sử `.CSV`.
 *   2. Xây dựng Xưởng Xử Lý Cục Bộ kiểu iLovePDF Client-Side (`PureJsPdfBinaryBuilderAndMerger`):
 *      - Mọi tác vụ đọc, gộp file (.TXT / .MD / .PDF), tách chương, tạo `.PDF` nhị phân
 *        hoặc nén `.ZIP` đều chạy 100% bằng CPU/RAM ngay trong trình duyệt — 0 KB tải lên server.
 *      - Phân định minh bạch Bảng Nhiệm Vụ Offline (chạy tại máy) vs Online (cần mạng/API).
 *   3. Điều phối hàng nút đầu trang & cửa sổ Modal của Tab 6:
 *      - Góc trái: "🐞 Báo cáo lỗi" (`#modal-mod34-bug-report`)
 *      - Góc phải: "👑 Người làm trang web (Mai Hải Đăng đẹp trai vip pro)" + "☕ Ủng hộ Đăng cà phê"
 *      - Thanh công cụ: "🔄 Đồng bộ dữ liệu sang máy khác" (`#modal-mod37-workspace-sync`)
 *        & "📕 Xuất truyện qua PDF" (`#modal-s6-custom-exporter`).
 *
 * Kiến trúc thuần khiết: Đăng ký qua `window.NoirStudio.registerModule('mod38', ...)`.
 * ============================================================================
 */
(function initModule38LocalComputeAndAttendance(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  // ==========================================================================
  // HẰNG SỐ CẤU HÌNH TOÀN CỤC MODULE 38
  // ==========================================================================
  const MOD38_CONSTANTS = Object.freeze({
    MODULE_KEY: 'mod38',
    VERSION: '39.0.0',
    ATTENDANCE_STORAGE_KEY: 'noir_v39_attendance_checkins_v1',
    DAILY_GOAL_OVERRIDE_KEY: 'noir_v39_attendance_daily_target_v1',
    TOOLKIT_LOG_STORAGE_KEY: 'noir_v39_local_compute_logs_v1',
    MAX_LOG_ENTRIES: 30,
    DEFAULT_DAILY_WORD_TARGET: 2000,
    PDF_PAGE_WIDTH: 595.28,
    PDF_PAGE_HEIGHT: 841.89,
    PDF_MARGIN_X: 50,
    PDF_MARGIN_TOP: 58,
    PDF_MARGIN_BOTTOM: 54,
    PDF_BODY_FONT_SIZE: 11,
    PDF_BODY_LINE_HEIGHT: 16,
    PDF_CHARS_PER_LINE: 78,
    MAX_SAFE_RAM_FILE_MB: 45
  });

  // ==========================================================================
  // BẢNG PHÂN LOẠI MINH BẠCH: CHẠY TẠI MÁY (OFFLINE / ZERO-UPLOAD) VS ONLINE
  // ==========================================================================
  const CAPABILITY_MAP_OFFLINE_VS_ONLINE = Object.freeze({
    localZeroUploadTasks: [
      {
        id: 'LOC_WRITE_VAULT',
        icon: '💾',
        title: 'Viết bản thảo, Tự lưu an toàn & Lưu phiên bản',
        moduleRef: '',
        detail: ''
      },
      {
        id: 'LOC_ATTENDANCE_POMODORO',
        icon: '📅',
        title: 'Điểm danh 7 ngày, Huy hiệu, Pomodoro & Âm thanh thư giãn',
        moduleRef: '',
        detail: ''
      },
      {
        id: 'LOC_VISUAL_STAGE',
        icon: '🎨',
        title: 'Khung trang sách, Hình nền động 60FPS & Kho tranh nghệ thuật',
        moduleRef: '',
        detail: ''
      },
      {
        id: 'LOC_EXPORT_PACKAGE',
        icon: '📦',
        title: 'Đóng gói .ZIP, .DOCX, .EPUB, .TXT & Tạo/Gộp .PDF ngay tại máy',
        moduleRef: '',
        detail: ''
      },
      {
        id: 'LOC_RAG_CLICHE_SPLIT',
        icon: '🔍',
        title: 'Quét câu sáo rỗng, Tìm nhanh trong bản thảo & Cắt truyện thành chương',
        moduleRef: '',
        detail: ''
      }
    ],
    onlineRequiredTasks: [
      {
        id: 'NET_GEMINI_AI',
        icon: '🤖',
        title: 'Trợ lý AI viết truyện & Chatbot hỏi đáp',
        moduleRef: '',
        detail: ''
      },
      {
        id: 'NET_SMART_BIBLE_AI',
        icon: '🏛️',
        title: 'Tóm tắt Story Bible & Đối chiếu chỉnh sửa bằng AI',
        moduleRef: '',
        detail: ''
      },
      {
        id: 'NET_GDRIVE_NOTEBOOKLM',
        icon: '☁️',
        title: 'Sao lưu lên Google Drive & Mở Google NotebookLM',
        moduleRef: '',
        detail: ''
      },
      {
        id: 'NET_BUG_SHEET_RELAY',
        icon: '📊',
        title: 'Gửi báo lỗi & Góp ý về hệ thống',
        moduleRef: '',
        detail: ''
      }
    ]
  });

  // ==========================================================================
  // DANH MỤC HUY HIỆU ĐIỂM DANH & CHUỖI CHUYÊN CẦN (TAB 5 MỤC 1)
  // ==========================================================================
  const ATTENDANCE_BADGE_CATALOG = Object.freeze([
    {
      id: 'BADGE_NOVICE_7D',
      icon: '🌱',
      title: 'Tiểu thuyết gia tập sự',
      requirementLabel: 'Giữ chuỗi 7 ngày',
      checkUnlocked: (stats) => stats.currentStreak >= 7 || stats.longestStreak >= 7
    },
    {
      id: 'BADGE_AMATEUR_21D',
      icon: '🔥',
      title: 'Tiểu thuyết gia nghiệp dư',
      requirementLabel: 'Giữ chuỗi 21 ngày',
      checkUnlocked: (stats) => stats.currentStreak >= 21 || stats.longestStreak >= 21
    },
    {
      id: 'BADGE_SEMIPRO_90D',
      icon: '⚔️',
      title: 'Tiểu thuyết gia bán chuyên',
      requirementLabel: 'Giữ chuỗi 90 ngày',
      checkUnlocked: (stats) => stats.currentStreak >= 90 || stats.longestStreak >= 90
    },
    {
      id: 'BADGE_VETERAN_365D',
      icon: '👑',
      title: 'Tiểu thuyết gia kỳ cựu',
      requirementLabel: 'Giữ chuỗi 365 ngày',
      checkUnlocked: (stats) => stats.currentStreak >= 365 || stats.longestStreak >= 365
    }
  ]);

  // ==========================================================================
  // BẢNG ÁNH XẠ TIẾNG VIỆT SANG MÃ ASCII/WINANSI AN TOÀN CHO PDF THUẦN NHỊ PHÂN
  // ==========================================================================
  const VIETNAMESE_ASCII_CHAR_MAP = Object.freeze({
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
    â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
    À: 'A', Á: 'A', Ả: 'A', Ã: 'A', Ạ: 'A',
    Ă: 'A', Ằ: 'A', Ắ: 'A', Ẳ: 'A', Ẵ: 'A', Ặ: 'A',
    Â: 'A', Ầ: 'A', Ấ: 'A', Ẩ: 'A', Ẫ: 'A', Ậ: 'A',
    đ: 'd', Đ: 'D',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
    ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
    È: 'E', É: 'E', Ẻ: 'E', Ẽ: 'E', Ẹ: 'E',
    Ê: 'E', Ề: 'E', Ế: 'E', Ể: 'E', Ễ: 'E', Ệ: 'E',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    Ì: 'I', Í: 'I', Ỉ: 'I', Ĩ: 'I', Ị: 'I',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
    ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
    ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
    Ò: 'O', Ó: 'O', Ỏ: 'O', Õ: 'O', Ọ: 'O',
    Ô: 'O', Ồ: 'O', Ố: 'O', Ổ: 'O', Ỗ: 'O', Ộ: 'O',
    Ơ: 'O', Ờ: 'O', Ớ: 'O', Ở: 'O', Ỡ: 'O', Ợ: 'O',
    ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
    ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
    Ù: 'U', Ú: 'U', Ủ: 'U', Ũ: 'U', Ụ: 'U',
    Ư: 'U', Ừ: 'U', Ứ: 'U', Ử: 'U', Ữ: 'U', Ự: 'U',
    ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    Ỳ: 'Y', Ý: 'Y', Ỷ: 'Y', Ỹ: 'Y', Ỵ: 'Y',
    '\u201c': '"', '\u201d': '"', '\u2018': "'", '\u2019': "'",
    '\u2013': '-', '\u2014': '-', '\u2026': '...'
  });

  // ==========================================================================
  // HÀM TIỆN ÍCH CỤC BỘ DÙNG CHUNG TRONG MODULE 38
  // ==========================================================================
  function getUiUtilsSafe() {
    return (
      NS.uiUtils || {
        escapeHtml: (s) =>
          String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;'),
        showToast: () => {},
        countVietnameseWords: (txt) => {
          const clean = String(txt || '').trim();
          return clean ? clean.split(/\s+/).length : 0;
        }
      }
    );
  }

  function getLocalDateKey(dateObj = new Date()) {
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function shiftDateKey(baseDateKey, deltaDays) {
    const parts = String(baseDateKey || '').split('-').map((n) => parseInt(n, 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + deltaDays);
      return getLocalDateKey(fallback);
    }
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + deltaDays);
    return getLocalDateKey(d);
  }

  function formatBytesHuman(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function readStorageJsonSafe(key, fallbackValue) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallbackValue;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallbackValue : parsed;
    } catch (_) {
      return fallbackValue;
    }
  }

  function writeStorageJsonSafe(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function triggerBlobDownloadSafe(blob, filename) {
    if (!blob || typeof document === 'undefined') return false;
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `bi-studio-${Date.now()}.bin`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      }, 1500);
      return true;
    } catch (_) {
      return false;
    }
  }

  function bindClickOnceSafe(elOrId, handler, tagKey = 'mod38Bound') {
    if (typeof document === 'undefined') return false;
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return false;
    if (el.dataset && el.dataset[tagKey] === '1') return true;
    if (el.dataset) el.dataset[tagKey] = '1';
    el.addEventListener('click', handler);
    return true;
  }

  // ==========================================================================
  // LỚP 1: THANH TRA TÀI NGUYÊN MÁY CÁ NHÂN (CPU / RAM / OFFLINE / STORAGE)
  //         LocalResourceTelemetryInspector
  // ==========================================================================
  class LocalResourceTelemetryInspector {
    constructor() {
      this.lastEstimate = null;
      this.lastEstimatedAt = 0;
    }

    collectSyncHardwareProfile() {
      const nav = typeof navigator !== 'undefined' ? navigator : {};
      const cores = Number(nav.hardwareConcurrency) || 4;
      const ramGb = Number(nav.deviceMemory) || 0;
      const isOnline = typeof nav.onLine === 'boolean' ? nav.onLine : true;

      let localStorageBytes = 0;
      let studioKeyCount = 0;
      try {
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i);
          if (!k) continue;
          const val = localStorage.getItem(k) || '';
          localStorageBytes += (k.length + val.length) * 2;
          if (/^noir_/i.test(k)) {
            studioKeyCount += 1;
          }
        }
      } catch (_) {}

      const chapters = Array.isArray(NS.chapterManager?.chapters)
        ? NS.chapterManager.chapters
        : [];
      const totalWords = chapters.reduce(
        (sum, ch) => sum + (Number(ch?.wordCount) || 0),
        0
      );

      return {
        cpuCores: cores,
        deviceMemoryGb: ramGb > 0 ? ramGb : null,
        isOnline,
        onlineBadgeLabel: isOnline ? '🌐 Đang kết nối Internet' : '✈️ Ngoại tuyến (Chế độ Offline)',
        localStorageBytes,
        localStorageHuman: formatBytesHuman(localStorageBytes),
        studioKeyCount,
        chapterCount: chapters.length,
        totalWords
      };
    }

    async collectAsyncStorageQuotaProfile() {
      const syncInfo = this.collectSyncHardwareProfile();
      let quotaBytes = 0;
      let usageBytes = 0;
      let supported = false;

      try {
        if (navigator?.storage && typeof navigator.storage.estimate === 'function') {
          const est = await navigator.storage.estimate();
          quotaBytes = Number(est?.quota) || 0;
          usageBytes = Number(est?.usage) || 0;
          supported = quotaBytes > 0;
          this.lastEstimate = { quotaBytes, usageBytes };
          this.lastEstimatedAt = Date.now();
        }
      } catch (_) {}

      const freeBytes = Math.max(0, quotaBytes - usageBytes);
      const usagePercent =
        quotaBytes > 0 ? Math.min(100, Math.round((usageBytes / quotaBytes) * 1000) / 10) : 0;

      return {
        ...syncInfo,
        storageApiSupported: supported,
        quotaBytes,
        quotaHuman: supported ? formatBytesHuman(quotaBytes) : 'Không giới hạn rõ (Trình duyệt quản lý)',
        usageBytes,
        usageHuman: supported ? formatBytesHuman(usageBytes) : syncInfo.localStorageHuman,
        freeBytes,
        freeHuman: supported ? formatBytesHuman(freeBytes) : 'Dồi dào tại ổ đĩa cục bộ',
        usagePercent
      };
    }

    getCapabilityMatrix() {
      return CAPABILITY_MAP_OFFLINE_VS_ONLINE;
    }
  }

  // ==========================================================================
  // LỚP 2: ĐỘNG CƠ XỬ LÝ TỆP .PDF NHỊ PHÂN & TÀI LIỆU THUẦN JS TRONG RAM
  //         PureJsPdfBinaryBuilderAndMerger (Zero-Upload giống iLovePDF)
  // ==========================================================================
  class PureJsPdfBinaryBuilderAndMerger {
    constructor() {
      this.encoder = typeof TextEncoder === 'function' ? new TextEncoder() : null;
      this.decoder = typeof TextDecoder === 'function' ? new TextDecoder('utf-8', { fatal: false }) : null;
      this.latin1Decoder =
        typeof TextDecoder === 'function' ? new TextDecoder('latin1', { fatal: false }) : null;
    }

    encodeAsciiBytes(str) {
      const raw = String(str == null ? '' : str);
      if (this.encoder) {
        return this.encoder.encode(raw);
      }
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i += 1) {
        arr[i] = raw.charCodeAt(i) & 0xff;
      }
      return arr;
    }

    /**
     * Chuẩn hóa văn bản tiếng Việt sang dải ASCII sạch dành cho Type1 Font chuẩn PDF 1.4
     * (đảm bảo mở đọc mượt trên mọi trình đọc PDF thuần nhị phân mà không vỡ glyph).
     */
    toPdfSafeType1Text(text) {
      const str = String(text == null ? '' : text);
      let out = '';
      for (let i = 0; i < str.length; i += 1) {
        const ch = str[i];
        if (Object.prototype.hasOwnProperty.call(VIETNAMESE_ASCII_CHAR_MAP, ch)) {
          out += VIETNAMESE_ASCII_CHAR_MAP[ch];
        } else {
          const code = ch.charCodeAt(0);
          if (code === 10 || code === 13 || (code >= 32 && code <= 126)) {
            out += ch;
          } else if (code === 9) {
            out += '  ';
          } else {
            out += ' ';
          }
        }
      }
      return out;
    }

    escapePdfLiteralString(safeAscii) {
      return String(safeAscii || '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
    }

    wrapParagraphForPdfPage(paragraphText, maxChars = MOD38_CONSTANTS.PDF_CHARS_PER_LINE) {
      const clean = this.toPdfSafeType1Text(paragraphText).replace(/\r\n?/g, '\n').trim();
      if (!clean) return [''];
      const rawLines = clean.split('\n');
      const wrapped = [];

      for (const line of rawLines) {
        const trimmed = line.trim();
        if (!trimmed) {
          wrapped.push('');
          continue;
        }
        const words = trimmed.split(/\s+/);
        let current = '';
        for (const word of words) {
          if (!current) {
            if (word.length <= maxChars) {
              current = word;
            } else {
              // Cắt từ quá dài (ví dụ URL hoặc chuỗi liền không khoảng trắng)
              for (let pos = 0; pos < word.length; pos += maxChars) {
                wrapped.push(word.slice(pos, pos + maxChars));
              }
            }
          } else if (current.length + 1 + word.length <= maxChars) {
            current += ` ${word}`;
          } else {
            wrapped.push(current);
            current = word.length <= maxChars ? word : word.slice(0, maxChars);
          }
        }
        if (current) wrapped.push(current);
      }
      return wrapped;
    }

    paginateSectionsForPdf(sections, metadata = {}) {
      const bookTitle = this.toPdfSafeType1Text(metadata.title || 'Tieu Thuyet Cua Bi').trim();
      const authorName = this.toPdfSafeType1Text(metadata.author || 'Bi Novel Studio').trim();
      const pages = [];
      const usableHeight =
        MOD38_CONSTANTS.PDF_PAGE_HEIGHT -
        MOD38_CONSTANTS.PDF_MARGIN_TOP -
        MOD38_CONSTANTS.PDF_MARGIN_BOTTOM;
      const linesPerPage = Math.max(
        24,
        Math.floor(usableHeight / MOD38_CONSTANTS.PDF_BODY_LINE_HEIGHT)
      );

      // Trang bìa tóm tắt gọn gàng ở trang đầu
      pages.push({
        isCover: true,
        headerTitle: bookTitle,
        pageNumber: 1,
        lines: [
          { text: '', bold: false, size: 12 },
          { text: '', bold: false, size: 12 },
          { text: bookTitle.toUpperCase(), bold: true, size: 18 },
          { text: '', bold: false, size: 12 },
          { text: `Tac gia / Nguon: ${authorName}`, bold: false, size: 12 },
          {
            text: `Xuat ban cuc bo: Web Tieu Thuyet Cua Bi (${
              NS.i18n?.formatDate ? NS.i18n.formatDate(Date.now()) : new Date().toLocaleDateString('vi-VN')
            })`,
            bold: false,
            size: 10
          },
          {
            text: `Tong so phan / chuong gop: ${sections.length}`,
            bold: false,
            size: 10
          },
          { text: '------------------------------------------------------------', bold: false, size: 10 },
          {
            text: '[Zero-Upload Client-Side PDF] Tep nay duoc gop & tao 100% tren CPU/RAM may ban.',
            bold: false,
            size: 9
          }
        ]
      });

      let currentLines = [];
      const flushPage = () => {
        if (currentLines.length === 0) return;
        pages.push({
          isCover: false,
          headerTitle: bookTitle,
          pageNumber: pages.length + 1,
          lines: currentLines
        });
        currentLines = [];
      };

      for (let sIdx = 0; sIdx < sections.length; sIdx += 1) {
        const sec = sections[sIdx] || {};
        const headingText = this.toPdfSafeType1Text(
          sec.title || `Phan ${sIdx + 1}`
        ).trim();
        const headingLines = this.wrapParagraphForPdfPage(headingText, 64);

        if (currentLines.length > linesPerPage - 6) {
          flushPage();
        }
        if (sIdx > 0 && currentLines.length > 0) {
          currentLines.push({ text: '', bold: false, size: MOD38_CONSTANTS.PDF_BODY_FONT_SIZE });
        }
        for (const hLine of headingLines) {
          currentLines.push({ text: hLine, bold: true, size: 13 });
        }
        currentLines.push({ text: '', bold: false, size: MOD38_CONSTANTS.PDF_BODY_FONT_SIZE });

        const bodyParagraphs = String(sec.content || '').split(/\n{2,}|\r\n\r\n/);
        for (const para of bodyParagraphs) {
          const wrapped = this.wrapParagraphForPdfPage(
            para,
            MOD38_CONSTANTS.PDF_CHARS_PER_LINE
          );
          for (const wLine of wrapped) {
            if (currentLines.length >= linesPerPage) {
              flushPage();
            }
            currentLines.push({
              text: wLine,
              bold: false,
              size: MOD38_CONSTANTS.PDF_BODY_FONT_SIZE
            });
          }
          if (currentLines.length < linesPerPage) {
            currentLines.push({ text: '', bold: false, size: 8 });
          }
        }
      }
      flushPage();

      return pages;
    }

    buildPageContentStream(pageObj, totalPages) {
      const commands = [];
      const xStart = MOD38_CONSTANTS.PDF_MARGIN_X;
      let yCursor = MOD38_CONSTANTS.PDF_PAGE_HEIGHT - MOD38_CONSTANTS.PDF_MARGIN_TOP;

      // Header nhỏ gọn trên đầu trang nội dung
      if (!pageObj.isCover) {
        const hdr = this.escapePdfLiteralString(
          String(pageObj.headerTitle || '').slice(0, 72)
        );
        commands.push('BT');
        commands.push('/F1 9 Tf');
        commands.push(`1 0 0 1 ${xStart} ${MOD38_CONSTANTS.PDF_PAGE_HEIGHT - 28} Tm`);
        commands.push(`(${hdr}) Tj`);
        commands.push('ET');
      }

      // Nội dung dòng từng trang
      for (const lineObj of pageObj.lines) {
        const fontRef = lineObj.bold ? '/F2' : '/F1';
        const fontSize = lineObj.size || MOD38_CONSTANTS.PDF_BODY_FONT_SIZE;
        const stepY = lineObj.text
          ? Math.max(MOD38_CONSTANTS.PDF_BODY_LINE_HEIGHT, Math.round(fontSize * 1.45))
          : 10;

        if (lineObj.text) {
          const escaped = this.escapePdfLiteralString(lineObj.text);
          commands.push('BT');
          commands.push(`${fontRef} ${fontSize} Tf`);
          commands.push(`1 0 0 1 ${xStart} ${yCursor.toFixed(2)} Tm`);
          commands.push(`(${escaped}) Tj`);
          commands.push('ET');
        }
        yCursor -= stepY;
      }

      // Footer đánh số trang sạch sẽ
      const pageFooter = this.escapePdfLiteralString(
        `Trang ${pageObj.pageNumber} / ${totalPages}`
      );
      commands.push('BT');
      commands.push('/F1 9 Tf');
      commands.push(`1 0 0 1 ${(MOD38_CONSTANTS.PDF_PAGE_WIDTH / 2 - 28).toFixed(2)} 28 Tm`);
      commands.push(`(${pageFooter}) Tj`);
      commands.push('ET');

      return commands.join('\n');
    }

    /**
     * Tạo file `.PDF` nhị phân chuẩn PDF 1.4 hoàn toàn bằng JavaScript thuần trong RAM
     * (Không upload lên mạng, không phụ thuộc thư viện CDN bên ngoài).
     */
    buildStandalonePdfBlob(sections, metadata = {}) {
      const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const safeSections = Array.isArray(sections) && sections.length > 0
        ? sections
        : [{ title: 'Ban Thao Trong', content: 'Chua co noi dung van ban.' }];

      const pages = this.paginateSectionsForPdf(safeSections, metadata);
      const totalPages = pages.length;

      // Cấu trúc Object PDF:
      // 1: Catalog
      // 2: Pages
      // 3: Font Helvetica (F1)
      // 4: Font Helvetica-Bold (F2)
      // 5..4+2*N: cặp (Page obj, Content stream obj)
      const objects = [];
      const pageIds = [];

      // Đánh ID trước cho từng cặp trang
      for (let i = 0; i < totalPages; i += 1) {
        pageIds.push(5 + i * 2);
      }

      objects.push({
        id: 1,
        body: '<< /Type /Catalog /Pages 2 0 R >>'
      });
      objects.push({
        id: 2,
        body: `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${totalPages} >>`
      });
      objects.push({
        id: 3,
        body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
      });
      objects.push({
        id: 4,
        body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
      });

      for (let i = 0; i < totalPages; i += 1) {
        const pageObjId = 5 + i * 2;
        const streamObjId = 6 + i * 2;
        const streamContent = this.buildPageContentStream(pages[i], totalPages);
        const streamBytesLen = this.encodeAsciiBytes(streamContent).length;

        objects.push({
          id: pageObjId,
          body: [
            '<< /Type /Page',
            '/Parent 2 0 R',
            `/MediaBox [0 0 ${MOD38_CONSTANTS.PDF_PAGE_WIDTH} ${MOD38_CONSTANTS.PDF_PAGE_HEIGHT}]`,
            '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>',
            `/Contents ${streamObjId} 0 R >>`
          ].join(' ')
        });

        objects.push({
          id: streamObjId,
          body: `<< /Length ${streamBytesLen} >>\nstream\n${streamContent}\nendstream`
        });
      }

      const chunks = [];
      const pushStr = (s) => chunks.push(this.encodeAsciiBytes(s));
      let byteOffset = 0;
      const appendBytes = (u8) => {
        chunks.push(u8);
        byteOffset += u8.length;
      };

      // Header + binary marker
      appendBytes(this.encodeAsciiBytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));

      const offsets = new Array(objects.length + 1).fill(0);
      for (const obj of objects) {
        offsets[obj.id] = byteOffset;
        const block = `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
        appendBytes(this.encodeAsciiBytes(block));
      }

      const xrefStart = byteOffset;
      const xrefLines = [`xref`, `0 ${objects.length + 1}`, `0000000000 65535 f `];
      for (let id = 1; id <= objects.length; id += 1) {
        xrefLines.push(`${String(offsets[id]).padStart(10, '0')} 00000 n `);
      }
      xrefLines.push('trailer');
      xrefLines.push(`<< /Size ${objects.length + 1} /Root 1 0 R >>`);
      xrefLines.push('startxref');
      xrefLines.push(String(xrefStart));
      xrefLines.push('%%EOF\n');
      pushStr(xrefLines.join('\n'));

      // Gộp toàn bộ Uint8Array thành 1 buffer nhị phân duy nhất trong RAM
      const totalLen = chunks.reduce((s, c) => s + c.length, 0);
      const merged = new Uint8Array(totalLen);
      let writePtr = 0;
      for (const c of chunks) {
        merged.set(c, writePtr);
        writePtr += c.length;
      }

      const elapsedMs = Math.max(
        1,
        Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt)
      );

      return {
        blob: new Blob([merged], { type: 'application/pdf' }),
        bytesLength: totalLen,
        pageCount: totalPages,
        sectionCount: safeSections.length,
        elapsedMs
      };
    }

    /**
     * Phân tích tệp `.PDF` ngay trên trình duyệt bằng bộ đọc Byte Array cục bộ:
     * đọc chuẩn `%PDF-x.x`, đếm trang `/Type /Page`, trích văn bản BT..ET chưa nén nếu có.
     */
    inspectLocalPdfBytes(uint8Arr, filename = 'document.pdf') {
      const latinText = this.latin1Decoder
        ? this.latin1Decoder.decode(uint8Arr)
        : String.fromCharCode.apply(null, Array.from(uint8Arr.slice(0, 65536)));

      const isPdfHeader = /^%PDF-\d\.\d/i.test(latinText.slice(0, 32));
      const versionMatch = latinText.slice(0, 24).match(/%PDF-(\d\.\d)/i);
      const pdfVersion = versionMatch ? versionMatch[1] : 'Unknown';

      const pageMatches = latinText.match(/\/Type\s*\/Page(?!s)\b/g);
      let estimatedPages = pageMatches ? pageMatches.length : 0;
      if (estimatedPages === 0) {
        const countMatch = latinText.match(/\/Count\s+(\d{1,5})/);
        if (countMatch) estimatedPages = parseInt(countMatch[1], 10) || 1;
      }
      if (estimatedPages === 0 && isPdfHeader) estimatedPages = 1;

      const hasFlateStream = /\/FlateDecode/i.test(latinText);
      const extractedTextLines = [];
      const btRegex = /BT[\s\S]{1,12000}?ET/g;
      let btMatch;
      let matchGuard = 0;
      while ((btMatch = btRegex.exec(latinText)) !== null && matchGuard < 400) {
        matchGuard += 1;
        const tjRegex = /\(([^()\\]{1,240}(?:\\.[^()\\]{0,80})*)\)\s*Tj/g;
        let tjMatch;
        const lineParts = [];
        while ((tjMatch = tjRegex.exec(btMatch[0])) !== null) {
          const decodedPart = tjMatch[1]
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
            .trim();
          if (decodedPart) lineParts.push(decodedPart);
        }
        if (lineParts.length > 0) {
          extractedTextLines.push(lineParts.join(' '));
        }
      }

      const extractedText = extractedTextLines.join('\n').trim();
      return {
        filename,
        isPdfHeader,
        pdfVersion,
        byteSize: uint8Arr.length,
        byteSizeHuman: formatBytesHuman(uint8Arr.length),
        estimatedPages,
        hasCompressedStreams: hasFlateStream,
        extractedText,
        extractedWords: getUiUtilsSafe().countVietnameseWords(extractedText)
      };
    }

    /**
     * Đọc nhiều tệp cục bộ (.txt, .md, .json, .html, .pdf) hoàn toàn trên RAM máy người dùng.
     */
    async readSelectedLocalFilesInRam(fileList) {
      const files = Array.from(fileList || []);
      const results = [];

      for (const f of files) {
        const buf = await f.arrayBuffer();
        const u8 = new Uint8Array(buf);
        const extMatch = String(f.name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
        const ext = extMatch ? extMatch[1] : 'txt';

        if (ext === 'pdf') {
          const pdfMeta = this.inspectLocalPdfBytes(u8, f.name);
          const fallbackContent =
            pdfMeta.extractedText ||
            `[Tệp PDF: ${f.name} · ${pdfMeta.estimatedPages} trang · ${pdfMeta.byteSizeHuman}${
              pdfMeta.hasCompressedStreams
                ? ' · Stream FlateDecode nén ảnh/font (hỗ trợ đóng gói .ZIP hoặc in qua chế độ xuất sách)'
                : ''
            }]`;
          results.push({
            filename: f.name,
            ext: 'pdf',
            byteSize: u8.length,
            uint8Data: u8,
            pdfMeta,
            title: f.name.replace(/\.pdf$/i, ''),
            content: fallbackContent,
            wordCount: getUiUtilsSafe().countVietnameseWords(fallbackContent)
          });
        } else {
          let decoded = this.decoder ? this.decoder.decode(u8) : '';
          if (ext === 'html' || ext === 'htm') {
            decoded = decoded
              .replace(/<style[\s\S]*?<\/style>/gi, ' ')
              .replace(/<script[\s\S]*?<\/script>/gi, ' ')
              .replace(/<[^>]+>/g, '\n')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
          }
          results.push({
            filename: f.name,
            ext,
            byteSize: u8.length,
            uint8Data: u8,
            pdfMeta: null,
            title: f.name.replace(/\.[a-z0-9]+$/i, ''),
            content: decoded,
            wordCount: getUiUtilsSafe().countVietnameseWords(decoded)
          });
        }
      }

      return results;
    }

    /**
     * Tách một bản thảo lớn trong RAM thành mảng chương dựa theo tiêu đề Chương/Hồi/Chapter
     * hoặc chia đều theo ngưỡng số từ an toàn.
     */
    splitLongTextIntoChaptersInRam(rawText, options = {}) {
      const text = String(rawText || '').replace(/\r\n?/g, '\n').trim();
      if (!text) return [];

      const maxWordsChunk = Number(options.maxWordsPerChapter) || 3500;
      const headerRegex = /^(?:\s*)(?:CHƯƠNG|Chương|HỒI|Hồi|CHAPTER|Chapter|PHẦN|Phần)\s+(?:\d+|[IVXLCDM]+)(?:[:.\-–\s].*)?$/gm;
      const matches = [];
      let m;
      while ((m = headerRegex.exec(text)) !== null) {
        matches.push({ index: m.index, title: m[0].trim() });
      }

      const chapters = [];
      if (matches.length >= 2) {
        if (matches[0].index > 80) {
          const prologue = text.slice(0, matches[0].index).trim();
          if (prologue) {
            chapters.push({
              title: 'Mở Đầu / Tựa Truyện',
              content: prologue,
              wordCount: getUiUtilsSafe().countVietnameseWords(prologue)
            });
          }
        }
        for (let i = 0; i < matches.length; i += 1) {
          const startIdx = matches[i].index + matches[i].title.length;
          const endIdx = i + 1 < matches.length ? matches[i + 1].index : text.length;
          const body = text.slice(startIdx, endIdx).trim();
          chapters.push({
            title: matches[i].title,
            content: body,
            wordCount: getUiUtilsSafe().countVietnameseWords(body)
          });
        }
        return chapters;
      }

      // Nếu tệp không có dòng đánh số "Chương X", cắt thông minh theo đoạn văn & giới hạn từ
      const paras = text.split(/\n{2,}/);
      let bucket = [];
      let bucketWords = 0;
      let partIndex = 1;
      for (const p of paras) {
        const w = getUiUtilsSafe().countVietnameseWords(p);
        if (bucketWords > 0 && bucketWords + w > maxWordsChunk) {
          const joined = bucket.join('\n\n');
          chapters.push({
            title: `Chương ${partIndex}: Phần Tách Cục Bộ`,
            content: joined,
            wordCount: getUiUtilsSafe().countVietnameseWords(joined)
          });
          partIndex += 1;
          bucket = [p];
          bucketWords = w;
        } else {
          bucket.push(p);
          bucketWords += w;
        }
      }
      if (bucket.length > 0) {
        const joined = bucket.join('\n\n');
        chapters.push({
          title: `Chương ${partIndex}: Phần Tách Cục Bộ`,
          content: joined,
          wordCount: getUiUtilsSafe().countVietnameseWords(joined)
        });
      }
      return chapters;
    }

    /**
     * Đóng gói nhiều tệp cục bộ trong RAM thành tệp .ZIP bằng engine Mod 37 hoặc Store nội bộ.
     */
    buildClientZipBundleForLocalFiles(loadedFiles, archiveTitle = 'Bi_Novel_Local_Bundle') {
      const entries = (loadedFiles || []).map((f, idx) => ({
        path: `${archiveTitle}/${String(idx + 1).padStart(2, '0')}_${f.filename}`,
        data: f.uint8Data || this.encodeAsciiBytes(f.content || '')
      }));

      const manifestInfo = {
        packagedAt: new Date().toISOString(),
        mode: 'CLIENT_SIDE_ZERO_UPLOAD',
        totalFiles: entries.length,
        files: (loadedFiles || []).map((f) => ({
          filename: f.filename,
          byteSize: f.byteSize,
          wordCount: f.wordCount,
          pdfPages: f.pdfMeta?.estimatedPages || 0
        }))
      };
      entries.push({
        path: `${archiveTitle}/_manifest_local_bundle.json`,
        data: this.encodeAsciiBytes(JSON.stringify(manifestInfo, null, 2))
      });

      const writer = NS.workspaceSync?.zipWriter;
      if (writer && typeof writer.buildZipArchive === 'function') {
        return writer.buildZipArchive(entries);
      }
      return this.buildFallbackStoreZipArchive(entries);
    }

    buildFallbackStoreZipArchive(entries) {
      // Bộ đóng gói ZIP Store dự phòng chuẩn PK\x03\x04 / PK\x01\x02 / PK\x05\x06 không nén để chạy độc lập mọi lúc
      const crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i += 1) {
        let c = i;
        for (let k = 0; k < 8; k += 1) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[i] = c >>> 0;
      }
      const calcCrc32 = (u8) => {
        let crc = 0xffffffff;
        for (let i = 0; i < u8.length; i += 1) {
          crc = crcTable[(crc ^ u8[i]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
      };

      const localParts = [];
      const centralParts = [];
      let localOffset = 0;

      for (const ent of entries) {
        const nameBytes = this.encodeAsciiBytes(ent.path || 'file.txt');
        const data = ent.data instanceof Uint8Array ? ent.data : this.encodeAsciiBytes(ent.data || '');
        const crc = calcCrc32(data);

        const lfh = new Uint8Array(30 + nameBytes.length);
        const lv = new DataView(lfh.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, 0x0800, true);
        lv.setUint16(8, 0, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true);
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, nameBytes.length, true);
        lfh.set(nameBytes, 30);

        localParts.push(lfh, data);

        const cdh = new Uint8Array(46 + nameBytes.length);
        const cv = new DataView(cdh.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(10, 0, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint32(42, localOffset, true);
        cdh.set(nameBytes, 46);
        centralParts.push(cdh);

        localOffset += lfh.length + data.length;
      }

      const centralSize = centralParts.reduce((s, a) => s + a.length, 0);
      const eocd = new Uint8Array(22);
      const ev = new DataView(eocd.buffer);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(8, entries.length, true);
      ev.setUint16(10, entries.length, true);
      ev.setUint32(12, centralSize, true);
      ev.setUint32(16, localOffset, true);

      const allChunks = [...localParts, ...centralParts, eocd];
      const totalSize = allChunks.reduce((s, c) => s + c.length, 0);
      const out = new Uint8Array(totalSize);
      let pos = 0;
      for (const c of allChunks) {
        out.set(c, pos);
        pos += c.length;
      }
      return {
        blob: new Blob([out], { type: 'application/zip' }),
        totalFiles: entries.length,
        totalBytes: totalSize
      };
    }
  }

  // ==========================================================================
  // LỚP 3: HỆ THỐNG ĐIỂM DANH CHUYÊN CẦN & CHUỖI NGÀY TẬP TRUNG TAB 5 (MỤC 1)
  //         Tab5AttendanceStreakEngine
  // ==========================================================================
  class Tab5AttendanceStreakEngine {
    constructor(inspector) {
      this.inspector = inspector;
      this.state = {
        dailyCheckins: {},
        draftNotes: {},
        dailyWordTarget: MOD38_CONSTANTS.DEFAULT_DAILY_WORD_TARGET,
        lastCheckinDate: '',
        streakFrozenGraceUsed: {}
      };
      this.hasInitialized = false;
      this.lastRenderedSignature = '';
    }

    init() {
      this.loadStateFromStorage();
      this.hydrateFromIndexedDbAsync();
      this.reconcileWithPomodoroLedger();
      this.renderPanel();
      this.bindPanelEvents();
      this.hasInitialized = true;
      return true;
    }

    async hydrateFromIndexedDbAsync() {
      try {
        const hasLocal = Boolean(localStorage.getItem(MOD38_CONSTANTS.ATTENDANCE_STORAGE_KEY));
        if (hasLocal || typeof NS.idb?.get !== 'function') return;
        const cached = await NS.idb.get('state_cache', MOD38_CONSTANTS.ATTENDANCE_STORAGE_KEY);
        if (cached && typeof cached === 'object' && cached.dailyCheckins) {
          const clean = {};
          for (const [dk, entry] of Object.entries(cached.dailyCheckins || {})) {
            if (entry && typeof entry === 'object' && entry.manualChecked === true) {
              clean[dk] = { ...entry };
            }
          }
          if (Object.keys(clean).length > 0 || Object.keys(cached.draftNotes || {}).length > 0) {
            this.state.dailyCheckins = clean;
            this.state.draftNotes =
              cached.draftNotes && typeof cached.draftNotes === 'object'
                ? { ...cached.draftNotes }
                : {};
            if (Number(cached.dailyWordTarget) > 0) {
              this.state.dailyWordTarget = Number(cached.dailyWordTarget);
            }
            this.state.lastCheckinDate = String(cached.lastCheckinDate || '');
            writeStorageJsonSafe(MOD38_CONSTANTS.ATTENDANCE_STORAGE_KEY, this.state);
            this.renderPanel();
          }
        }
      } catch (_) {}
    }

    loadStateFromStorage() {
      const saved = readStorageJsonSafe(MOD38_CONSTANTS.ATTENDANCE_STORAGE_KEY, null);
      if (saved && typeof saved === 'object') {
        const rawCheckins =
          saved.dailyCheckins && typeof saved.dailyCheckins === 'object'
            ? saved.dailyCheckins
            : {};
        const verifiedManualCheckins = {};
        let dirty = false;
        for (const [dk, entry] of Object.entries(rawCheckins)) {
          // Chỉ tính các ngày có bấm nút điểm danh thủ công; bỏ bản ghi tự động từ Pomodoro cũ
          if (entry && typeof entry === 'object' && entry.manualChecked === true) {
            verifiedManualCheckins[dk] = { ...entry };
          } else {
            dirty = true;
          }
        }
        this.state.dailyCheckins = verifiedManualCheckins;
        this.state.draftNotes =
          saved.draftNotes && typeof saved.draftNotes === 'object'
            ? { ...saved.draftNotes }
            : {};
        this.state.dailyWordTarget =
          Number(saved.dailyWordTarget) > 0
            ? Number(saved.dailyWordTarget)
            : MOD38_CONSTANTS.DEFAULT_DAILY_WORD_TARGET;
        const sortedManualDates = Object.keys(verifiedManualCheckins).sort();
        this.state.lastCheckinDate =
          sortedManualDates.length > 0
            ? sortedManualDates[sortedManualDates.length - 1]
            : '';
        this.state.streakFrozenGraceUsed =
          saved.streakFrozenGraceUsed && typeof saved.streakFrozenGraceUsed === 'object'
            ? { ...saved.streakFrozenGraceUsed }
            : {};
        if (dirty) {
          writeStorageJsonSafe(MOD38_CONSTANTS.ATTENDANCE_STORAGE_KEY, this.state);
        }
      }
      const goalOverride = Number(
        localStorage.getItem(MOD38_CONSTANTS.DAILY_GOAL_OVERRIDE_KEY) || 0
      );
      if (goalOverride > 0) {
        this.state.dailyWordTarget = goalOverride;
      }
    }

    saveStateToStorage() {
      writeStorageJsonSafe(MOD38_CONSTANTS.ATTENDANCE_STORAGE_KEY, this.state);
      try {
        localStorage.setItem(
          MOD38_CONSTANTS.DAILY_GOAL_OVERRIDE_KEY,
          String(this.state.dailyWordTarget)
        );
      } catch (_) {}
      // Đồng bộ ngược về cấu trúc mục tiêu từ/ngày của hệ thống Pomodoro nếu đang dùng chung
      try {
        const goalKey =
          NS.constants?.STORAGE_KEYS?.DAILY_GOAL || 'noir_v38_daily_word_goal_state';
        const existingGoal = readStorageJsonSafe(goalKey, {});
        writeStorageJsonSafe(goalKey, {
          ...existingGoal,
          dailyTarget: this.state.dailyWordTarget
        });
      } catch (_) {}
      // Sao lưu song song lên IndexedDB state_cache & kích hoạt đồng bộ đa tầng
      try {
        if (typeof NS.idb?.put === 'function') {
          NS.idb
            .put('state_cache', {
              id: MOD38_CONSTANTS.ATTENDANCE_STORAGE_KEY,
              ...this.state,
              updatedAt: Date.now()
            })
            .catch(() => {});
        }
        NS.bus?.emit?.('attendance:updated', { ...this.state });
        NS.emergencyVault?.scheduleBackupSnapshot?.();
      } catch (_) {}
    }

    getPomodoroRecordsSafe() {
      const records = NS.pomodoro?.ledger?.records;
      return Array.isArray(records) ? records : [];
    }

    /**
     * Chỉ cộng dồn thống kê phút/từ Pomodoro cho những ngày đã bấm Điểm danh thủ công.
     * Tuyệt đối KHÔNG tự động điểm danh thay người dùng khi không bấm nút điểm danh.
     */
    reconcileWithPomodoroLedger() {
      const records = this.getPomodoroRecordsSafe();
      const statsByDay = new Map();

      for (const rec of records) {
        if (!rec || rec.phase !== 'WORK' || !rec.dateKey) continue;
        const dk = String(rec.dateKey);
        const cur = statsByDay.get(dk) || { sessions: 0, minutes: 0, words: 0 };
        cur.sessions += 1;
        cur.minutes += Number(rec.durationMinutes) || 25;
        cur.words += Number(rec.wordsWritten) || 0;
        statsByDay.set(dk, cur);
      }

      let changed = false;
      for (const [dk, entry] of Object.entries(this.state.dailyCheckins || {})) {
        if (!entry || entry.manualChecked !== true) continue;
        const agg = statsByDay.get(dk);
        if (!agg) continue;
        const nextSessions = Math.max(Number(entry.sessionsCount) || 0, agg.sessions);
        const nextMinutes = Math.max(Number(entry.minutesFocused) || 0, agg.minutes);
        const nextWords = Math.max(Number(entry.wordsWritten) || 0, agg.words);
        if (
          nextSessions !== entry.sessionsCount ||
          nextMinutes !== entry.minutesFocused ||
          nextWords !== entry.wordsWritten
        ) {
          entry.sessionsCount = nextSessions;
          entry.minutesFocused = nextMinutes;
          entry.wordsWritten = nextWords;
          changed = true;
        }
      }

      if (changed) {
        this.saveStateToStorage();
      }
      return changed;
    }

    checkInToday(customNote = '') {
      const todayKey = getLocalDateKey();
      const existing = this.state.dailyCheckins[todayKey];
      const draftNote = String(this.state.draftNotes?.[todayKey] || '').trim();
      const noteClean = String(customNote || '').trim();

      const pomoTodayStats = this.getDayAggregatedMetrics(todayKey);
      this.state.dailyCheckins[todayKey] = {
        dateKey: todayKey,
        checkedAt: existing?.checkedAt || Date.now(),
        updatedAt: Date.now(),
        source: pomoTodayStats.sessions > 0 ? 'MANUAL_AND_POMODORO' : 'MANUAL_CHECKIN',
        note: noteClean || existing?.note || draftNote || 'Có mặt bàn viết & giữ nhịp sáng tác',
        manualChecked: true,
        sessionsCount: pomoTodayStats.sessions,
        minutesFocused: pomoTodayStats.minutes,
        wordsWritten: Math.max(
          existing?.wordsWritten || 0,
          pomoTodayStats.words,
          this.getLiveEditorWrittenWordsTodayFallback()
        )
      };
      if (this.state.draftNotes && todayKey in this.state.draftNotes) {
        delete this.state.draftNotes[todayKey];
      }
      this.state.lastCheckinDate = todayKey;
      this.saveStateToStorage();
      this.renderPanel();

      const metrics = this.computeStreakAndSummaryMetrics();
      getUiUtilsSafe().showToast(
        `📅 Đã điểm danh ngày ${todayKey}! Chuỗi hiện tại: ${metrics.currentStreak} ngày liên tiếp.`,
        'success',
        3600
      );
      return this.state.dailyCheckins[todayKey];
    }

    updateTodayCheckinNote(noteText) {
      const todayKey = getLocalDateKey();
      const trimmed = String(noteText || '').trim();
      if (!this.state.dailyCheckins[todayKey]?.manualChecked) {
        if (!this.state.draftNotes || typeof this.state.draftNotes !== 'object') {
          this.state.draftNotes = {};
        }
        this.state.draftNotes[todayKey] = trimmed;
        this.saveStateToStorage();
        this.renderPanel();
        getUiUtilsSafe().showToast(
          '📝 Đã lưu nháp ghi chú. Hãy bấm "📅 Điểm Danh Hôm Nay Ngay" để điểm danh hôm nay!',
          'info',
          2800
        );
        return null;
      }
      this.state.dailyCheckins[todayKey].note = trimmed;
      this.state.dailyCheckins[todayKey].updatedAt = Date.now();
      this.saveStateToStorage();
      this.renderPanel();
      return this.state.dailyCheckins[todayKey];
    }

    setDailyWordTarget(newTarget) {
      const num = Math.max(100, Math.min(50000, parseInt(newTarget, 10) || 2000));
      this.state.dailyWordTarget = num;
      this.saveStateToStorage();
      this.renderPanel();
      if (NS.pomodoro?.goalProjector?.mountGoalProjectionStrip) {
        NS.pomodoro.goalProjector.mountGoalProjectionStrip();
      }
      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      getUiUtilsSafe().showToast(
        `🎯 Đã cập nhật mục tiêu KPI mỗi ngày: ${fmtNum(num)} từ/ngày.`,
        'info',
        2600
      );
      return num;
    }

    getLiveEditorWrittenWordsTodayFallback() {
      try {
        const goalKey =
          NS.constants?.STORAGE_KEYS?.DAILY_GOAL || 'noir_v38_daily_word_goal_state';
        const g = readStorageJsonSafe(goalKey, null);
        if (g && g.dateKey === getLocalDateKey() && Number(g.todayAddedWords) > 0) {
          return Number(g.todayAddedWords);
        }
      } catch (_) {}
      return 0;
    }

    getDayAggregatedMetrics(dateKey) {
      const records = this.getPomodoroRecordsSafe();
      const dayWork = records.filter((r) => r && r.phase === 'WORK' && r.dateKey === dateKey);
      const pomoMinutes = dayWork.reduce((s, r) => s + (Number(r.durationMinutes) || 0), 0);
      const pomoWords = dayWork.reduce((s, r) => s + (Number(r.wordsWritten) || 0), 0);
      const checkinEntry = this.state.dailyCheckins[dateKey] || null;
      const isToday = dateKey === getLocalDateKey();
      const fallbackTodayWords = isToday ? this.getLiveEditorWrittenWordsTodayFallback() : 0;

      const manualChecked = Boolean(checkinEntry && checkinEntry.manualChecked === true);
      const activeDay = manualChecked;
      return {
        dateKey,
        activeDay,
        manualChecked,
        sessions: dayWork.length,
        minutes: Math.max(pomoMinutes, checkinEntry?.minutesFocused || 0),
        words: Math.max(pomoWords, checkinEntry?.wordsWritten || 0, fallbackTodayWords),
        note: checkinEntry?.note || this.state.draftNotes?.[dateKey] || '',
        source: manualChecked ? checkinEntry?.source || 'MANUAL_CHECKIN' : ''
      };
    }

    getAllActiveDateKeysSet() {
      const keys = new Set();
      for (const [dk, entry] of Object.entries(this.state.dailyCheckins || {})) {
        if (entry && entry.manualChecked === true) {
          keys.add(dk);
        }
      }
      return keys;
    }

    computeStreakAndSummaryMetrics() {
      this.reconcileWithPomodoroLedger();
      const activeSet = this.getAllActiveDateKeysSet();
      const todayKey = getLocalDateKey();
      const yesterdayKey = shiftDateKey(todayKey, -1);

      // Tính chuỗi hiện tại: chỉ giữ chuỗi nếu hôm nay hoặc hôm qua đã bấm điểm danh (quá 1 ngày bỏ lỡ = 0)
      let currentStreak = 0;
      let cursorKey = activeSet.has(todayKey)
        ? todayKey
        : activeSet.has(yesterdayKey)
          ? yesterdayKey
          : '';

      while (cursorKey && activeSet.has(cursorKey)) {
        currentStreak += 1;
        cursorKey = shiftDateKey(cursorKey, -1);
        if (currentStreak > 1000) break;
      }

      // Tính chuỗi dài nhất trong lịch sử điểm danh
      const sortedDates = Array.from(activeSet).sort();
      let longestStreak = 0;
      let runningStreak = 0;
      let prevDate = '';
      for (const dk of sortedDates) {
        if (!prevDate || shiftDateKey(prevDate, 1) === dk) {
          runningStreak += 1;
        } else {
          runningStreak = 1;
        }
        if (runningStreak > longestStreak) longestStreak = runningStreak;
        prevDate = dk;
      }

      // Lập dữ liệu 7 ngày gần nhất (từ hôm nay lùi 6 ngày)
      const weeklyDays = [];
      for (let offset = 6; offset >= 0; offset -= 1) {
        const dk = shiftDateKey(todayKey, -offset);
        const parts = dk.split('-').map((n) => parseInt(n, 10));
        const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const weekdayShort = NS.i18n?.formatWeekdayShort
          ? NS.i18n.formatWeekdayShort(dObj)
          : dObj.toLocaleDateString('vi-VN', { weekday: 'short' });
        const dayNumLabel = NS.i18n?.formatShortDayMonth
          ? NS.i18n.formatShortDayMonth(dObj)
          : `${String(parts[2]).padStart(2, '0')}/${String(parts[1]).padStart(2, '0')}`;
        const dayStats = this.getDayAggregatedMetrics(dk);
        weeklyDays.push({
          ...dayStats,
          isToday: offset === 0,
          weekdayShort,
          dayNumLabel
        });
      }

      const records = this.getPomodoroRecordsSafe().filter((r) => r && r.phase === 'WORK');
      let totalWordsAcrossDays = 0;
      for (const dk of sortedDates) {
        totalWordsAcrossDays += this.getDayAggregatedMetrics(dk).words;
      }

      const todayMetrics = this.getDayAggregatedMetrics(todayKey);
      const dailyTarget = Math.max(100, this.state.dailyWordTarget || 2000);
      const todayGoalPct = Math.min(
        100,
        Math.round((todayMetrics.words / dailyTarget) * 100)
      );
      const remainingWords = Math.max(0, dailyTarget - todayMetrics.words);
      const workMins = Number(NS.pomodoro?.store?.state?.workMinutes) || 25;
      const avgWpm = Number(NS.pomodoro?.ledger?.getTodayStats?.()?.avgWpmToday) || 18;
      const effectiveWpm = avgWpm > 2 ? avgWpm : 18;
      const estSprintsNeeded =
        remainingWords > 0
          ? Math.ceil(remainingWords / Math.max(120, Math.round(effectiveWpm * workMins)))
          : 0;

      const summary = {
        todayKey,
        checkedInToday: activeSet.has(todayKey),
        manuallyCheckedInToday: Boolean(this.state.dailyCheckins[todayKey]?.manualChecked),
        currentStreak,
        longestStreak,
        totalCheckinDays: sortedDates.length,
        totalSessions: records.length,
        totalWordsAcrossDays,
        weeklyDays,
        todayMetrics,
        dailyTarget,
        todayGoalPct,
        remainingWords,
        effectiveWpm,
        estSprintsNeeded
      };

      const badges = ATTENDANCE_BADGE_CATALOG.map((b) => ({
        ...b,
        unlocked: Boolean(b.checkUnlocked(summary))
      }));

      return { ...summary, badges };
    }

    getCoachTipText(metrics) {
      if (metrics.checkedInToday && metrics.currentStreak >= 7) {
        return `Tuyệt vời! Bạn đã giữ kỷ lục ${metrics.currentStreak} ngày liên tiếp — nhịp viết cực kỳ ổn định!`;
      }
      if (metrics.checkedInToday) {
        return 'Hôm nay bạn đã điểm danh thành công! Hãy viết thêm một phân cảnh ngắn hoặc bật Pomodoro để tích lũy từ.';
      }
      return 'Bấm "📅 Điểm Danh Hôm Nay Ngay" để điểm danh; bỏ lỡ quá 1 ngày sẽ mất chuỗi.';
    }

    buildAttendanceCsvString() {
      const activeDates = Array.from(this.getAllActiveDateKeysSet()).sort().reverse();
      const rows = ['Ngay,TrangThaiDiemDanh,NguonGhiNhan,SoPhienPomodoro,SoPhutTapTrung,SoTuViet,GhiChu'];

      for (const dk of activeDates) {
        const m = this.getDayAggregatedMetrics(dk);
        const statusStr = m.activeDay ? 'Da diem danh' : 'Chua diem danh';
        const noteEsc = `"${String(m.note || '').replace(/"/g, '""')}"`;
        rows.push(
          [
            dk,
            statusStr,
            m.source || 'MANUAL',
            m.sessions,
            m.minutes,
            m.words,
            noteEsc
          ].join(',')
        );
      }
      return rows.join('\n');
    }

    downloadAttendanceCsvFile() {
      const csvStr = this.buildAttendanceCsvString();
      const blob = new Blob([`\uFEFF${csvStr}`], { type: 'text/csv;charset=utf-8' });
      const ok = triggerBlobDownloadSafe(blob, `DiemDanh_ChuoiViet_${getLocalDateKey()}.csv`);
      if (ok) {
        getUiUtilsSafe().showToast(
          '📥 Đã xuất bảng lịch sử Điểm danh & Năng suất viết (.CSV) về máy!',
          'success'
        );
      }
      return ok;
    }

    renderPanel() {
      if (typeof document === 'undefined') return false;
      const box = document.getElementById('s14-panel-attendance-box');
      if (!box) return false;

      const esc = getUiUtilsSafe().escapeHtml;
      const m = this.computeStreakAndSummaryMetrics();
      const maxDayWords = Math.max(250, ...m.weeklyDays.map((d) => d.words || 0));
      const unlockedCount = m.badges.filter((b) => b.unlocked).length;

      box.innerHTML = `
        <div class="flex flex-wrap items-start justify-between gap-3 border-b border-rose-500/25 pb-3.5">
          <div class="space-y-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-extrabold uppercase text-sm sm:text-base text-rose-300">
                📅 1. Điểm Danh Chuyên Cần &amp; Chuỗi Ngày Sáng Tác
              </h3>
              <span id="mod38-attendance-streak-pill" class="px-2.5 py-0.5 rounded-full border border-amber-500/45 bg-amber-500/15 text-amber-300 font-extrabold text-[11px]">
                🔥 Chuỗi hiện tại: ${m.currentStreak} ngày
              </span>
              <span class="px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-950/90 text-zinc-300 font-bold text-[10px]">
                🏆 Kỷ lục: ${m.longestStreak} ngày · Tổng ${m.totalCheckinDays} ngày
              </span>
            </div>
            <p class="text-[11px] text-zinc-300 leading-relaxed">
              ${esc(this.getCoachTipText(m))}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-mod38-checkin-today"
              class="px-4 py-2 rounded-xl font-extrabold text-xs shadow-lg transition ${
                m.checkedInToday
                  ? 'bg-emerald-600/25 border-2 border-emerald-400/70 text-emerald-200 hover:bg-emerald-600/35'
                  : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white'
              }"
            >
              ${m.checkedInToday ? '✅ Đã Điểm Danh Hôm Nay' : '📅 Điểm Danh Hôm Nay Ngay'}
            </button>
            <button
              type="button"
              id="btn-mod38-attendance-export-csv"
              class="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-bold text-xs transition"
            >
              📥 Xuất lịch sử .CSV
            </button>
          </div>
        </div>

        <!-- Bảng Điểm Danh 7 Ngày Gần Nhất -->
        <div class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span class="font-extrabold uppercase text-amber-300">📊 Bảng Nhịp Độ 7 Ngày Gần Nhất</span>
            <span class="text-zinc-400 font-monoCode">Hôm nay (${esc(
              NS.i18n?.formatDate ? NS.i18n.formatDate(Date.now()) : m.todayKey
            )}): ${m.todayMetrics.sessions} phiên · ${m.todayMetrics.minutes} phút · ${(
              NS.i18n?.formatNumber ? NS.i18n.formatNumber(m.todayMetrics.words) : m.todayMetrics.words.toLocaleString('vi-VN')
            )} từ</span>
          </div>

          <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
            ${m.weeklyDays
              .map((d) => {
                const barPct = d.words > 0 ? Math.max(18, Math.round((d.words / maxDayWords) * 100)) : d.activeDay ? 24 : 8;
                const cardCls = d.activeDay
                  ? d.isToday
                    ? 'border-2 border-emerald-400 bg-emerald-950/50 text-emerald-100 shadow'
                    : 'border border-emerald-500/45 bg-emerald-950/30 text-emerald-200'
                  : d.isToday
                    ? 'border border-amber-500/50 bg-amber-950/20 text-amber-200'
                    : 'border border-zinc-800 bg-zinc-950/75 text-zinc-400';
                return `
                  <div class="p-2 rounded-xl flex flex-col items-center justify-between gap-1 text-center ${cardCls}" title="${esc(d.dateKey)}: ${d.sessions} phiên · ${d.words} từ">
                    <div class="text-[10px] font-bold uppercase">${esc(d.weekdayShort)}</div>
                    <div class="text-[9px] font-monoCode opacity-80">${esc(d.dayNumLabel)}</div>
                    <div class="w-full h-10 bg-zinc-900/90 rounded-lg overflow-hidden flex items-end p-0.5">
                      <div class="w-full rounded ${d.activeDay ? 'bg-gradient-to-t from-emerald-500 to-teal-300' : 'bg-zinc-700/50'}" style="height: ${barPct}%;"></div>
                    </div>
                    <div class="text-xs font-extrabold">${d.activeDay ? '✓' : '·'}</div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Ghi chú mục tiêu hôm nay & Thanh tiến độ KPI từ/ngày -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
          <div class="lg:col-span-7 p-3.5 rounded-xl border border-emerald-500/35 bg-zinc-950/85 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span class="font-extrabold text-emerald-300">
                🎯 KPI Sản Lượng Hôm Nay: ${(
                  NS.i18n?.formatNumber ? NS.i18n.formatNumber(m.todayMetrics.words) : m.todayMetrics.words.toLocaleString('vi-VN')
                )} / ${(
                  NS.i18n?.formatNumber ? NS.i18n.formatNumber(m.dailyTarget) : m.dailyTarget.toLocaleString('vi-VN')
                )} từ (${m.todayGoalPct}%)
              </span>
              <div class="flex items-center gap-1.5">
                <label for="input-mod38-daily-target" class="text-[10px] text-zinc-400">Đổi KPI/ngày:</label>
                <input
                  id="input-mod38-daily-target"
                  type="number"
                  min="100"
                  max="50000"
                  step="100"
                  value="${m.dailyTarget}"
                  class="w-24 min-w-[88px] px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-emerald-300 font-monoCode font-bold text-xs select-text"
                />
                <button type="button" id="btn-mod38-save-daily-target" class="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/45 text-emerald-200 font-bold text-[10px] transition">
                  Lưu
                </button>
              </div>
            </div>
            <div class="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all" style="width: ${m.todayGoalPct}%;"></div>
            </div>
            <div class="text-[10px] text-zinc-400">
              ${
                m.remainingWords === 0
                  ? `🎉 Bạn đã vượt hoặc hoàn tất KPI ${(NS.i18n?.formatNumber ? NS.i18n.formatNumber(m.dailyTarget) : m.dailyTarget.toLocaleString('vi-VN'))} từ của ngày hôm nay!`
                  : `Còn ${(NS.i18n?.formatNumber ? NS.i18n.formatNumber(m.remainingWords) : m.remainingWords.toLocaleString('vi-VN'))} từ để chạm đích (~${m.estSprintsNeeded} phiên Pomodoro ở nhịp ${m.effectiveWpm} từ/phút).`
              }
            </div>
          </div>

          <div class="lg:col-span-5 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/85 space-y-2">
            <label for="input-mod38-today-note" class="block text-[10px] font-bold uppercase text-rose-300">
              📝 Nhật ký điểm danh hôm nay:
            </label>
            <div class="flex gap-2">
              <input
                id="input-mod38-today-note"
                type="text"
                value="${esc(m.todayMetrics.note)}"
                maxlength="160"
                placeholder="Ví dụ: Viết xong cao trào Chương 5, chỉnh tâm lý nhân vật..."
                class="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-[11px] select-text focus:outline-none focus:border-rose-400"
              />
              <button type="button" id="btn-mod38-save-today-note" class="px-3 py-1.5 rounded-lg bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/45 text-rose-200 font-bold text-[11px] transition shrink-0">
                Ghi chú
              </button>
            </div>
          </div>
        </div>

        <!-- 4 Huy Hiệu Chuyên Cần Tập Trung -->
        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-extrabold uppercase text-amber-300">🏅 Huy Hiệu Chuyên Cần (Alt + P)</span>
            <span class="text-zinc-400 font-monoCode">Đã mở ${unlockedCount}/${m.badges.length} huy hiệu</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            ${m.badges
              .map((b) => {
                const badgeCls = b.unlocked
                  ? 'border-emerald-500/50 bg-emerald-950/35 text-emerald-100 shadow'
                  : 'border-zinc-800 bg-zinc-950/75 text-zinc-400 opacity-80';
                return `
                  <div class="p-2.5 rounded-xl border space-y-1 ${badgeCls}">
                    <div class="flex items-center justify-between gap-1 font-extrabold text-[11px]">
                      <span class="truncate">${b.icon} ${esc(b.title)}</span>
                      <span class="text-[10px] shrink-0">${b.unlocked ? '✓ Đạt' : '🔒'}</span>
                    </div>
                    <div class="text-[10px] opacity-85 leading-snug">${esc(b.requirementLabel)}</div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      `;

      // Gắn lại các sự kiện sau mỗi lần render nội dung bên trong thẻ
      this.bindDynamicInnerEvents();
      NS.i18n?.translateElement?.(box);
      return true;
    }

    bindDynamicInnerEvents() {
      const btnCheckin = document.getElementById('btn-mod38-checkin-today');
      if (btnCheckin) {
        btnCheckin.onclick = () => {
          const noteInput = document.getElementById('input-mod38-today-note');
          this.checkInToday(noteInput?.value || '');
        };
      }

      const btnExportCsv = document.getElementById('btn-mod38-attendance-export-csv');
      if (btnExportCsv) {
        btnExportCsv.onclick = () => this.downloadAttendanceCsvFile();
      }

      const btnSaveTarget = document.getElementById('btn-mod38-save-daily-target');
      if (btnSaveTarget) {
        btnSaveTarget.onclick = () => {
          const inp = document.getElementById('input-mod38-daily-target');
          this.setDailyWordTarget(inp?.value || MOD38_CONSTANTS.DEFAULT_DAILY_WORD_TARGET);
        };
      }

      const btnSaveNote = document.getElementById('btn-mod38-save-today-note');
      if (btnSaveNote) {
        btnSaveNote.onclick = () => {
          const noteInput = document.getElementById('input-mod38-today-note');
          const saved = this.updateTodayCheckinNote(noteInput?.value || '');
          if (saved) {
            getUiUtilsSafe().showToast('📝 Đã lưu ghi chú điểm danh hôm nay!', 'success', 2200);
          }
        };
      }
    }

    bindPanelEvents() {
      if (NS.bus && typeof NS.bus.on === 'function' && !this._busBound) {
        this._busBound = true;
        const refreshSafe = () => {
          this.reconcileWithPomodoroLedger();
          this.renderPanel();
        };
        const evtNames = [
          NS.constants?.EVENTS?.POMODORO_TICK || 'pomodoro:session_complete',
          NS.constants?.EVENTS?.CHAPTER_SAVED || 'chapter:saved',
          NS.constants?.EVENTS?.CHAPTER_APPROVED || 'chapter:approved'
        ];
        for (const ev of evtNames) {
          try {
            NS.bus.on(ev, refreshSafe);
          } catch (_) {}
        }
      }

      // Tự đồng bộ khi Mod 20 gọi syncAllViews xong một phiên Pomodoro
      if (NS.pomodoro && typeof NS.pomodoro.syncAllViews === 'function' && !NS.pomodoro.__mod38AttendanceHooked) {
        NS.pomodoro.__mod38AttendanceHooked = true;
        const origPomoSync = NS.pomodoro.syncAllViews.bind(NS.pomodoro);
        NS.pomodoro.syncAllViews = (...args) => {
          const res = origPomoSync(...args);
          try {
            const sig = `${this.getPomodoroRecordsSafe().length}:${getLocalDateKey()}`;
            if (sig !== this.lastRenderedSignature) {
              this.lastRenderedSignature = sig;
              this.reconcileWithPomodoroLedger();
              this.renderPanel();
            }
          } catch (_) {}
          return res;
        };
      }
    }
  }

  // ==========================================================================
  // LỚP 4: BÀN ĐIỀU KHIỂN HÀNG NÚT ĐẦU TAB 6 & CỬA SỔ MODAL MỞ RỘNG
  //         Tab6TopActionsAndModalsBridge
  // ==========================================================================
  class Tab6TopActionsAndModalsBridge {
    constructor() {
      this.hasBound = false;
    }

    init() {
      if (typeof document === 'undefined') return false;
      this.bindTopCornerButtons();
      this.bindActionToolbarButtons();
      this.bindModalCloseHandlers();
      this.bindGlobalEscapeKeyHandler();
      this.hasBound = true;
      return true;
    }

    openBugReportFlow() {
      if (NS.bugReport && typeof NS.bugReport.openBugReportModal === 'function') {
        return NS.bugReport.openBugReportModal();
      }
      const modal = document.getElementById('modal-mod34-bug-report');
      if (modal) modal.classList.remove('hidden');
      return Boolean(modal);
    }

    closeBugReportFlow() {
      if (NS.bugReport && typeof NS.bugReport.closeBugReportModal === 'function') {
        return NS.bugReport.closeBugReportModal();
      }
      const modal = document.getElementById('modal-mod34-bug-report');
      if (modal) modal.classList.add('hidden');
      return true;
    }

    openAuthorCreditsFlow() {
      if (NS.authorCredits && typeof NS.authorCredits.openCreditsModal === 'function') {
        return NS.authorCredits.openCreditsModal();
      }
      const modal = document.getElementById('modal-mod35-credits-hub');
      if (modal) modal.classList.remove('hidden');
      return Boolean(modal);
    }

    closeAuthorCreditsFlow() {
      if (NS.authorCredits && typeof NS.authorCredits.closeCreditsModal === 'function') {
        return NS.authorCredits.closeCreditsModal();
      }
      const modal = document.getElementById('modal-mod35-credits-hub');
      if (modal) modal.classList.add('hidden');
      return true;
    }

    openDonateCoffeeFlow() {
      if (NS.authorCredits && typeof NS.authorCredits.openVietQrDonateModal === 'function') {
        return NS.authorCredits.openVietQrDonateModal();
      }
      getUiUtilsSafe().showToast(
        '🧋 Cảm ơn bạn đã ủng hộ Hải Đăng! Đang mở mã VietQR TPBank...',
        'info'
      );
      return false;
    }

    openWorkspaceSyncFlow() {
      if (NS.workspaceSync && typeof NS.workspaceSync.openWorkspaceSyncModal === 'function') {
        return NS.workspaceSync.openWorkspaceSyncModal();
      }
      const modal = document.getElementById('modal-mod37-workspace-sync');
      if (modal) modal.classList.remove('hidden');
      return Boolean(modal);
    }

    closeWorkspaceSyncFlow() {
      if (NS.workspaceSync && typeof NS.workspaceSync.closeWorkspaceSyncModal === 'function') {
        return NS.workspaceSync.closeWorkspaceSyncModal();
      }
      const modal = document.getElementById('modal-mod37-workspace-sync');
      if (modal) modal.classList.add('hidden');
      return true;
    }

    openPdfExporterFlow() {
      if (NS.exporter && typeof NS.exporter.openModal === 'function') {
        NS.exporter.openModal();
        return true;
      }
      const modal = document.getElementById('modal-s6-custom-exporter');
      if (modal) modal.classList.remove('hidden');
      return Boolean(modal);
    }

    bindTopCornerButtons() {
      bindClickOnceSafe('btn-tab6-top-bug-report', () => this.openBugReportFlow());
      bindClickOnceSafe('btn-tab6-top-credits', () => this.openAuthorCreditsFlow());
      bindClickOnceSafe('btn-tab6-top-donate-coffee', () => this.openDonateCoffeeFlow());
    }

    bindActionToolbarButtons() {
      bindClickOnceSafe('btn-tab6-top-sync-devices', () => this.openWorkspaceSyncFlow());
      bindClickOnceSafe('btn-tab6-top-export-pdf', () => this.openPdfExporterFlow());
    }

    bindModalCloseHandlers() {
      bindClickOnceSafe('btn-close-modal-mod34', () => this.closeBugReportFlow());
      bindClickOnceSafe('btn-close-modal-mod35', () => this.closeAuthorCreditsFlow());
      bindClickOnceSafe('btn-close-modal-mod37', () => this.closeWorkspaceSyncFlow());

      const backdropBindings = [
        ['modal-mod34-bug-report', () => this.closeBugReportFlow()],
        ['modal-mod35-credits-hub', () => this.closeAuthorCreditsFlow()],
        ['modal-mod37-workspace-sync', () => this.closeWorkspaceSyncFlow()]
      ];

      for (const [modalId, closeFn] of backdropBindings) {
        const modalEl = document.getElementById(modalId);
        if (!modalEl || modalEl.dataset.mod38BackdropBound === '1') continue;
        modalEl.dataset.mod38BackdropBound = '1';
        modalEl.addEventListener('click', (ev) => {
          if (ev.target === modalEl) {
            closeFn();
          }
        });
      }
    }

    bindGlobalEscapeKeyHandler() {
      if (document.body?.dataset?.mod38EscBound === '1') return;
      if (document.body?.dataset) document.body.dataset.mod38EscBound = '1';

      document.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Escape') return;
        const modals = [
          ['modal-mod34-bug-report', () => this.closeBugReportFlow()],
          ['modal-mod35-credits-hub', () => this.closeAuthorCreditsFlow()],
          ['modal-mod37-workspace-sync', () => this.closeWorkspaceSyncFlow()]
        ];
        for (const [id, closeFn] of modals) {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('hidden')) {
            closeFn();
            break;
          }
        }
      });
    }
  }

  // ==========================================================================
  // LỚP 5: XƯỞNG XỬ LÝ TÀI LIỆU CỤC BỘ & BẢNG PHÂN LOẠI OFFLINE/ONLINE TAB 6
  //         LocalComputeToolkitTab6Presenter
  // ==========================================================================
  class LocalComputeToolkitTab6Presenter {
    constructor(inspector, pdfEngine) {
      this.inspector = inspector;
      this.pdfEngine = pdfEngine;
      this.loadedFiles = [];
      this.executionLogs = readStorageJsonSafe(MOD38_CONSTANTS.TOOLKIT_LOG_STORAGE_KEY, []);
      this.lastBuildMetrics = null;
    }

    init() {
      this.renderToolkitUI();
      this.refreshAsyncStoragePanel();
      return true;
    }

    recordComputeLog(actionName, summaryText, elapsedMs = 0) {
      this.executionLogs.unshift({
        id: `CMP_${Date.now().toString(36)}`,
        timestamp: Date.now(),
        actionName,
        summaryText,
        elapsedMs
      });
      if (this.executionLogs.length > MOD38_CONSTANTS.MAX_LOG_ENTRIES) {
        this.executionLogs = this.executionLogs.slice(0, MOD38_CONSTANTS.MAX_LOG_ENTRIES);
      }
      writeStorageJsonSafe(MOD38_CONSTANTS.TOOLKIT_LOG_STORAGE_KEY, this.executionLogs);
    }

    async refreshAsyncStoragePanel() {
      const estEl = document.getElementById('mod38-storage-quota-summary');
      if (!estEl) return;
      const asyncProfile = await this.inspector.collectAsyncStorageQuotaProfile();
      const raw = `Đã dùng cục bộ: ${asyncProfile.usageHuman} / Hạn mức trình duyệt: ${asyncProfile.quotaHuman} (${asyncProfile.usagePercent}%)`;
      estEl.textContent = NS.i18n?.translateText ? NS.i18n.translateText(raw) : raw;
    }

    handleMergeCurrentChaptersToStandalonePdf() {
      const chapMgr = NS.chapterManager;
      const chapters = Array.isArray(chapMgr?.chapters) ? chapMgr.chapters : [];
      if (typeof chapMgr?.syncEditorToActiveChapter === 'function') {
        chapMgr.syncEditorToActiveChapter();
      }

      const sections =
        chapters.length > 0
          ? chapters.map((ch, idx) => ({
              title: ch.displayTitle || ch.title || `Chương ${idx + 1}`,
              content: ch.content || ''
            }))
          : [
              {
                title:
                  document.getElementById('input-chapter-title')?.value?.trim() ||
                  'Chương 1: Bản Thảo',
                content: document.getElementById('textarea-chapter-content')?.value || ''
              }
            ];

      const bookTitle =
        readStorageJsonSafe('noir_s1_book_title_v1', '') ||
        localStorage.getItem('noir_v34_book_title') ||
        'Tieu Thuyet Cua Bi';

      const pdfRes = this.pdfEngine.buildStandalonePdfBlob(sections, {
        title: String(bookTitle),
        author: 'Web Tieu Thuyet Cua Bi'
      });

      this.lastBuildMetrics = {
        action: 'Tạo PDF thuần nhị phân toàn bộ chương tại RAM',
        bytesHuman: formatBytesHuman(pdfRes.bytesLength),
        pageCount: pdfRes.pageCount,
        elapsedMs: pdfRes.elapsedMs
      };
      this.recordComputeLog(
        'PDF Toàn Bộ Chương (0 Upload)',
        `${pdfRes.sectionCount} chương · ${pdfRes.pageCount} trang · ${formatBytesHuman(pdfRes.bytesLength)}`,
        pdfRes.elapsedMs
      );

      triggerBlobDownloadSafe(
        pdfRes.blob,
        `ToanBoTruyen_Offline_${getLocalDateKey()}.pdf`
      );
      this.renderToolkitUI();
      getUiUtilsSafe().showToast(
        `📕 Đã dựng file .PDF (${pdfRes.pageCount} trang, ${formatBytesHuman(pdfRes.bytesLength)}) trong ${pdfRes.elapsedMs}ms ngay tại máy — 0 KB upload!`,
        'success',
        4200
      );
      return pdfRes;
    }

    async handleLocalFilesChosen(fileList) {
      const files = Array.from(fileList || []);
      if (files.length === 0) return [];

      const totalRawBytes = files.reduce((s, f) => s + (f.size || 0), 0);
      if (totalRawBytes > MOD38_CONSTANTS.MAX_SAFE_RAM_FILE_MB * 1024 * 1024) {
        getUiUtilsSafe().showToast(
          `⚠️ Tổng dung lượng vượt ${MOD38_CONSTANTS.MAX_SAFE_RAM_FILE_MB}MB; nên chia làm 2 lượt để RAM trình duyệt mượt nhất.`,
          'warning'
        );
      }

      const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.loadedFiles = await this.pdfEngine.readSelectedLocalFilesInRam(files);
      const elapsedMs = Math.max(
        1,
        Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started)
      );

      this.lastBuildMetrics = {
        action: `Nạp ${this.loadedFiles.length} tệp vào RAM trình duyệt`,
        bytesHuman: formatBytesHuman(totalRawBytes),
        pageCount: this.loadedFiles.reduce(
          (s, f) => s + (f.pdfMeta?.estimatedPages || 0),
          0
        ),
        elapsedMs
      };
      this.recordComputeLog(
        'Nạp Tài Liệu Cục Bộ (RAM)',
        `${this.loadedFiles.length} tệp (${formatBytesHuman(totalRawBytes)})`,
        elapsedMs
      );
      this.renderToolkitUI();
      getUiUtilsSafe().showToast(
        `⚡ Đã nạp ${this.loadedFiles.length} tệp (${formatBytesHuman(totalRawBytes)}) vào RAM trong ${elapsedMs}ms — 0 byte gửi lên server!`,
        'success',
        3200
      );
      return this.loadedFiles;
    }

    handleMergeLoadedFilesToPdf() {
      if (this.loadedFiles.length === 0) {
        return this.handleMergeCurrentChaptersToStandalonePdf();
      }
      const sections = this.loadedFiles.map((f) => ({
        title: f.title || f.filename,
        content: f.content || ''
      }));
      const res = this.pdfEngine.buildStandalonePdfBlob(sections, {
        title: `Tai lieu gop (${this.loadedFiles.length} tep)`,
        author: 'Zero-Upload Local Engine (Bi Studio)'
      });
      this.lastBuildMetrics = {
        action: `Gộp ${this.loadedFiles.length} tệp thành 1 PDF`,
        bytesHuman: formatBytesHuman(res.bytesLength),
        pageCount: res.pageCount,
        elapsedMs: res.elapsedMs
      };
      this.recordComputeLog(
        'Gộp Nhiều Tệp Thành 1 PDF',
        `${this.loadedFiles.length} tệp -> ${res.pageCount} trang (${formatBytesHuman(res.bytesLength)})`,
        res.elapsedMs
      );
      triggerBlobDownloadSafe(res.blob, `Gop_${this.loadedFiles.length}_TaiLieu_${getLocalDateKey()}.pdf`);
      this.renderToolkitUI();
      getUiUtilsSafe().showToast(
        `📕 Đã gộp ${this.loadedFiles.length} tệp thành 1 file .PDF (${res.pageCount} trang) ngay trên trình duyệt!`,
        'success'
      );
      return res;
    }

    handleMergeLoadedFilesToTxt() {
      if (this.loadedFiles.length === 0) {
        getUiUtilsSafe().showToast('📂 Hãy chọn ít nhất 1 tệp (.txt/.md/.pdf) trước khi gộp.', 'info');
        return null;
      }
      const mergedText = this.loadedFiles
        .map((f, idx) => `====================\n[${idx + 1}] ${f.filename}\n====================\n${f.content}`)
        .join('\n\n');
      const blob = new Blob([mergedText], { type: 'text/plain;charset=utf-8' });
      triggerBlobDownloadSafe(blob, `Gop_${this.loadedFiles.length}_Tep_${getLocalDateKey()}.txt`);
      this.recordComputeLog(
        'Gộp Nhiều Tệp Thành 1 .TXT',
        `${this.loadedFiles.length} tệp · ${formatBytesHuman(blob.size)}`,
        2
      );
      this.renderToolkitUI();
      getUiUtilsSafe().showToast(`📄 Đã xuất tệp gộp .TXT (${formatBytesHuman(blob.size)})!`, 'success');
      return blob;
    }

    handlePackLoadedFilesIntoClientZip() {
      if (this.loadedFiles.length === 0) {
        getUiUtilsSafe().showToast('📂 Hãy chọn các tệp (.pdf / .txt / .md) cần gom gói .ZIP trước.', 'info');
        return null;
      }
      const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const zipRes = this.pdfEngine.buildClientZipBundleForLocalFiles(
        this.loadedFiles,
        `Goi_Tai_Lieu_Bi_${getLocalDateKey()}`
      );
      const elapsedMs = Math.max(
        1,
        Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started)
      );
      triggerBlobDownloadSafe(zipRes.blob, `Goi_Tai_Lieu_Cuc_Bo_${getLocalDateKey()}.zip`);
      this.recordComputeLog(
        'Đóng Gói .ZIP Không Upload',
        `${this.loadedFiles.length} tệp -> ${formatBytesHuman(zipRes.blob.size)}`,
        elapsedMs
      );
      this.renderToolkitUI();
      getUiUtilsSafe().showToast(
        `📦 Đã nén ${this.loadedFiles.length} tệp thành .ZIP (${formatBytesHuman(zipRes.blob.size)}) trong ${elapsedMs}ms tại máy!`,
        'success'
      );
      return zipRes;
    }

    handleSplitLoadedTextIntoTab2Chapters() {
      const sourceText =
        this.loadedFiles.length > 0
          ? this.loadedFiles.map((f) => f.content || '').join('\n\n')
          : document.getElementById('textarea-chapter-content')?.value || '';

      if (!sourceText.trim()) {
        getUiUtilsSafe().showToast(
          '⚠️ Hãy chọn tệp truyện hoặc có nội dung ở bàn viết trước khi chạy bộ tách chương cục bộ.',
          'warning'
        );
        return [];
      }

      const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const chunks = this.pdfEngine.splitLongTextIntoChaptersInRam(sourceText, {
        maxWordsPerChapter: 3200
      });
      const elapsedMs = Math.max(
        1,
        Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started)
      );

      let addedCount = 0;
      const mgr = NS.chapterManager;
      if (mgr && Array.isArray(mgr.chapters)) {
        for (const ch of chunks) {
          if (typeof mgr.createChapter === 'function') {
            mgr.createChapter({
              title: ch.title,
              content: ch.content,
              status: 'DRAFT',
              selectAfterCreate: addedCount === 0
            });
            addedCount += 1;
          } else {
            mgr.chapters.push({
              id: `chap_split_${Date.now().toString(36)}_${addedCount}`,
              title: ch.title,
              displayTitle: ch.title,
              content: ch.content,
              status: 'DRAFT',
              wordCount: ch.wordCount,
              updatedAt: Date.now()
            });
            addedCount += 1;
          }
        }
        if (typeof mgr.renderChapterList === 'function') mgr.renderChapterList();
        if (typeof mgr.persistToStorage === 'function') mgr.persistToStorage();
      }

      this.lastBuildMetrics = {
        action: `Tách nhanh thành ${chunks.length} chương trong RAM`,
        bytesHuman: formatBytesHuman(sourceText.length),
        pageCount: chunks.length,
        elapsedMs
      };
      this.recordComputeLog(
        'Tách Chương Tốc Độ Cao (RAM)',
        `${chunks.length} chương -> Đưa vào Tab 2`,
        elapsedMs
      );
      this.renderToolkitUI();
      getUiUtilsSafe().showToast(
        `✂️ Đã tách thành công ${chunks.length} chương vào Cây Bản Thảo Tab 2 chỉ trong ${elapsedMs}ms!`,
        'success',
        4000
      );
      return chunks;
    }

    renderToolkitUI() {
      if (typeof document === 'undefined') return false;
      const root = document.getElementById('tab6-local-compute-toolkit-root');
      if (!root) return false;

      const esc = getUiUtilsSafe().escapeHtml;
      const hw = this.inspector.collectSyncHardwareProfile();
      const matrix = this.inspector.getCapabilityMatrix();

      root.innerHTML = `
        <div class="rounded-2xl border-2 border-emerald-500/45 bg-gradient-to-br from-emerald-950/35 via-zinc-950/90 to-slate-950 p-4 space-y-4 shadow-xl">
          <!-- Đầu đề + Thống kê tài nguyên máy cục bộ -->
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-500/25 pb-3">
            <div class="space-y-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-extrabold text-[10px]">
                  🔒 XỬ LÝ TẠI MÁY (KHÔNG TẢI LÊN MẠNG)
                </span>
                <span class="px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 font-bold text-[10px]">
                  ${esc(hw.onlineBadgeLabel)}
                </span>
              </div>
              <h4 class="text-sm font-extrabold text-emerald-300">
                🖥️ Xử Lý Tài Liệu Ngay Trên Máy Bạn
              </h4>
              <p class="text-[11px] text-zinc-400 leading-relaxed">
                Tất cả thao tác gộp tệp, tách chương, đóng gói .ZIP hay xuất .PDF đều xử lý trực tiếp trên máy bạn, không gửi dữ liệu ra ngoài.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-monoCode min-w-0 max-w-full">
              <span class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-cyan-300">
                ⚙️ CPU: ${hw.cpuCores} luồng
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-emerald-300">
                💾 RAM Web: ${hw.deviceMemoryGb ? `${hw.deviceMemoryGb} GB` : 'Trình duyệt tự điều tiết'}
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-amber-300">
                📚 ${hw.chapterCount} chương (${(NS.i18n?.formatNumber ? NS.i18n.formatNumber(hw.totalWords) : hw.totalWords.toLocaleString('vi-VN'))} từ)
              </span>
            </div>
          </div>

          <div id="mod38-storage-quota-summary" class="text-[10px] font-monoCode text-zinc-400 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
            Đang đo dung lượng bộ nhớ trình duyệt... (LocalStorage: ${esc(hw.localStorageHuman)} qua ${hw.studioKeyCount} khóa)
          </div>

          <!-- Khu chọn file đa định dạng & Thực thi Zero-Upload -->
          <div class="p-3.5 rounded-xl border border-emerald-500/35 bg-zinc-900/75 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="space-y-0.5">
                <div class="font-extrabold text-xs text-emerald-200">
                  📂 Chọn Nhiều Tệp Từ Máy (.PDF / .TXT / .MD / .HTML) Để Gộp Hoặc Tách Chương:
                </div>
                <div class="text-[10px] text-zinc-400">
                  File chỉ đọc vào RAM cục bộ. Bạn có thể chọn cùng lúc nhiều file PDF/TXT để gộp hoặc đóng gói.
                </div>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <input
                  id="input-mod38-local-files"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.html,.htm,.json"
                  class="hidden"
                />
                <button type="button" id="btn-mod38-pick-local-files" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition">
                  📂 Chọn Tệp Cục Bộ...
                </button>
                <button type="button" id="btn-mod38-clear-local-files" class="px-2.5 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition">
                  🧹 Xóa danh sách
                </button>
              </div>
            </div>

            ${
              this.loadedFiles.length > 0
                ? `<div class="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    ${this.loadedFiles
                      .map(
                        (f, i) => `
                          <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] px-2 py-1 rounded bg-zinc-900/80">
                            <span class="font-bold text-zinc-100 truncate max-w-[260px]">${i + 1}. ${esc(f.filename)}</span>
                            <span class="font-monoCode text-[10px] text-emerald-300">
                              ${esc(formatBytesHuman(f.byteSize))} · ${
                                f.pdfMeta
                                  ? `PDF v${esc(f.pdfMeta.pdfVersion)} (${f.pdfMeta.estimatedPages} trang)`
                                  : `${(NS.i18n?.formatNumber ? NS.i18n.formatNumber(f.wordCount) : f.wordCount.toLocaleString('vi-VN'))} từ`
                              }
                            </span>
                          </div>
                        `
                      )
                      .join('')}
                  </div>`
                : `<div class="p-2.5 rounded-lg bg-zinc-950/80 border border-dashed border-zinc-700 text-[11px] text-zinc-400">
                    Chưa chọn tệp ngoài nào — bấm <strong>"📕 Gộp Thành 1 File .PDF"</strong> để xuất nhanh toàn bộ các chương hiện tại.
                  </div>`
            }

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              <button type="button" id="btn-mod38-merge-to-pdf" class="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] shadow transition">
                📕 Gộp Thành 1 File .PDF
              </button>
              <button type="button" id="btn-mod38-merge-to-txt" class="px-3 py-2 rounded-xl border border-sky-500/45 bg-sky-600/20 hover:bg-sky-600/35 text-sky-200 font-bold text-[11px] transition">
                📄 Gộp Thành 1 File .TXT
              </button>
              <button type="button" id="btn-mod38-pack-local-zip" class="px-3 py-2 rounded-xl border border-teal-500/45 bg-teal-600/20 hover:bg-teal-600/35 text-teal-200 font-bold text-[11px] transition">
                📦 Nén Thành .ZIP Cục Bộ
              </button>
              <button type="button" id="btn-mod38-split-to-tab2" class="px-3 py-2 rounded-xl border border-amber-500/45 bg-amber-600/20 hover:bg-amber-600/35 text-amber-200 font-extrabold text-[11px] transition">
                ✂️ Tách Chương Đưa Vào Tab 2
              </button>
            </div>

            ${
              this.lastBuildMetrics
                ? `<div id="mod38-last-compute-badge" class="px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-200 font-semibold">
                    ✅ Vừa thực thi: <strong>${esc(this.lastBuildMetrics.action)}</strong> (${esc(this.lastBuildMetrics.bytesHuman)} · ${this.lastBuildMetrics.pageCount} trang/phần) trong <strong>${this.lastBuildMetrics.elapsedMs}ms</strong> tại RAM — 0 KB upload!
                  </div>`
                : ''
            }
          </div>

          <!-- Bảng đối chiếu trực quan: Việc gì chạy OFFLINE (Tài nguyên máy) vs Việc gì bắt buộc ONLINE (Mạng/API) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div class="p-3 rounded-xl border border-emerald-500/35 bg-emerald-950/20 space-y-2">
              <div class="font-extrabold text-xs text-emerald-300">
                🟢 1. CHẠY 100% BẰNG MÁY BẠN (OFFLINE / KHÔNG TỐN MẠNG)
              </div>
              <div class="space-y-1.5">
                ${matrix.localZeroUploadTasks
                  .map(
                    (t) => `
                      <div class="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/90">
                        <div class="font-bold text-[11px] text-emerald-200">${t.icon} ${esc(t.title)}</div>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </div>

            <div class="p-3 rounded-xl border border-sky-500/35 bg-sky-950/20 space-y-2">
              <div class="font-extrabold text-xs text-sky-300">
                🔵 2. BẮT BUỘC DÙNG INTERNET / API ĐÁM MÂY
              </div>
              <div class="space-y-1.5">
                ${matrix.onlineRequiredTasks
                  .map(
                    (t) => `
                      <div class="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/90">
                        <div class="font-bold text-[11px] text-sky-200">${t.icon} ${esc(t.title)}</div>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      this.bindToolkitEvents();
      NS.i18n?.translateElement?.(root);
      return true;
    }

    bindToolkitEvents() {
      const fileInput = document.getElementById('input-mod38-local-files');
      const pickBtn = document.getElementById('btn-mod38-pick-local-files');
      if (pickBtn && fileInput) {
        pickBtn.onclick = () => fileInput.click();
        fileInput.onchange = (ev) => {
          if (ev.target?.files?.length) {
            this.handleLocalFilesChosen(ev.target.files);
          }
        };
      }

      const clearBtn = document.getElementById('btn-mod38-clear-local-files');
      if (clearBtn) {
        clearBtn.onclick = () => {
          this.loadedFiles = [];
          this.lastBuildMetrics = null;
          this.renderToolkitUI();
        };
      }

      const btnMergePdf = document.getElementById('btn-mod38-merge-to-pdf');
      if (btnMergePdf) btnMergePdf.onclick = () => this.handleMergeLoadedFilesToPdf();

      const btnMergeTxt = document.getElementById('btn-mod38-merge-to-txt');
      if (btnMergeTxt) btnMergeTxt.onclick = () => this.handleMergeLoadedFilesToTxt();

      const btnPackZip = document.getElementById('btn-mod38-pack-local-zip');
      if (btnPackZip) btnPackZip.onclick = () => this.handlePackLoadedFilesIntoClientZip();

      const btnSplitTab2 = document.getElementById('btn-mod38-split-to-tab2');
      if (btnSplitTab2) btnSplitTab2.onclick = () => this.handleSplitLoadedTextIntoTab2Chapters();
    }
  }

  // ==========================================================================
  // LỚP 6: HỆ THỐNG CHÚ THÍCH HƯỚNG DẪN NHANH CHO TAB 5 & TAB 6 MỚI (TOOLTIPS)
  //         LocalComputeTooltipRegistrar
  // ==========================================================================
  class LocalComputeTooltipRegistrar {
    applyHoverNotes() {
      if (typeof document === 'undefined') return 0;
      const notesMap = {
        'btn-tab6-top-bug-report':
          'Mở cửa sổ Báo lỗi (Module 34) để gửi sự cố hoặc góp ý về Google Sheets 2 cột (Thời gian | Nội dung Bug) hay Gmail.',
        'btn-tab6-top-credits':
          'Mở bảng ghi công tác giả (Mai Hải Đăng - Bi), tâm sự làm web cùng AI và thông tin kết nối.',
        'btn-tab6-top-donate-coffee':
          'Mở mã VietQR TPBank (STK 0398922180) mời Đăng ly cà phê ủng hộ tinh thần!',
        'btn-tab6-top-sync-devices':
          'Đồng bộ dữ liệu & trạng thái sang thiết bị khác bằng cách tải file .ZIP về máy hoặc kết nối Google Drive tự động.',
        'btn-tab6-top-export-pdf':
          'Mở hộp thoại Xuất truyện ra .PDF tùy chỉnh phông chữ/cỡ chữ, hoặc .DOCX Word & .TXT.',
        'btn-mod38-checkin-today':
          'Đánh dấu hôm nay bạn đã ngồi vào bàn viết để giữ chuỗi ngày liên tiếp và mở khóa huy hiệu.',
        'btn-mod38-attendance-export-csv':
          'Tải về bảng lịch sử điểm danh, số phiên tập trung và sản lượng từ dưới dạng file Excel .CSV.',
        'btn-mod38-pick-local-files':
          'Chọn một hoặc nhiều file .PDF / .TXT / .MD từ máy để xử lý trực tiếp trên RAM (0 KB upload).',
        'btn-mod38-merge-to-pdf':
          'Gộp các file vừa chọn (hoặc toàn bộ các chương hiện có) thành một file .PDF ngay tại trình duyệt.',
        'btn-mod38-merge-to-txt':
          'Gộp nhiều file văn bản thành một tệp .TXT thống nhất tải về máy trong nháy mắt.',
        'btn-mod38-pack-local-zip':
          'Đóng gói nhiều tài liệu thành một file .ZIP thuần ngay trên trình duyệt không cần mạng.',
        'btn-mod38-split-to-tab2':
          'Tách tự động bản thảo dài thành từng chương riêng biệt rồi nạp thẳng vào Tab 2.',
        'btn-smart-approve-goto-tab4-notebooklm':
          'Đóng cửa sổ duyệt và nhảy sang khu vực Google NotebookLM ở Tab 4 để chống quên cốt truyện 100%.'
      };

      let updated = 0;
      for (const [id, msg] of Object.entries(notesMap)) {
        const el = document.getElementById(id);
        if (el) {
          el.setAttribute('title', msg);
          el.setAttribute('data-noir-tooltip', msg);
          updated += 1;
        }
      }
      return updated;
    }
  }

  // ==========================================================================
  // LỚP 7: BỘ ĐIỀU PHỐI TỔNG MODULE 38 (ĐĂNG KÝ LÊN `window.NoirStudio`)
  // ==========================================================================
  class Mod38LocalComputeAndAttendanceFacade {
    constructor() {
      this.inspector = new LocalResourceTelemetryInspector();
      this.pdfEngine = new PureJsPdfBinaryBuilderAndMerger();
      this.attendance = new Tab5AttendanceStreakEngine(this.inspector);
      this.tab6Bridge = new Tab6TopActionsAndModalsBridge();
      this.toolkit = new LocalComputeToolkitTab6Presenter(this.inspector, this.pdfEngine);
      this.tooltipRegistrar = new LocalComputeTooltipRegistrar();
      this.initialized = false;
    }

    init() {
      this.attendance.init();
      this.tab6Bridge.init();
      this.toolkit.init();
      this.tooltipRegistrar.applyHoverNotes();
      if (!this._i18nBound) {
        this._i18nBound = true;
        const onLangChanged = () => {
          this.attendance.renderPanel();
          this.toolkit.renderToolkitUI();
          this.toolkit.refreshAsyncStoragePanel();
        };
        NS.bus?.on?.('i18n:changed', onLangChanged);
        if (typeof window !== 'undefined' && window.addEventListener) {
          window.addEventListener('noir:i18n:changed', onLangChanged);
        }
      }
      this.initialized = true;
      return true;
    }

    getHealthReport() {
      return {
        module: MOD38_CONSTANTS.MODULE_KEY,
        version: MOD38_CONSTANTS.VERSION,
        initialized: this.initialized,
        attendanceStreak: this.attendance.computeStreakAndSummaryMetrics().currentStreak,
        loadedLocalFilesCount: this.toolkit.loadedFiles.length,
        hardware: this.inspector.collectSyncHardwareProfile()
      };
    }
  }

  const mod38Engine = new Mod38LocalComputeAndAttendanceFacade();
  NS.Mod38LocalComputeAndAttendanceFacade = Mod38LocalComputeAndAttendanceFacade;
  NS.PureJsPdfBinaryBuilderAndMerger = PureJsPdfBinaryBuilderAndMerger;
  NS.Tab5AttendanceStreakEngine = Tab5AttendanceStreakEngine;
  NS.localComputeAndAttendance = mod38Engine;
  NS.tab5Attendance = mod38Engine.attendance;
  NS.mod38Engine = mod38Engine;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod38', mod38Engine);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!mod38Engine.initialized) {
          mod38Engine.init();
        }
      });
    } else {
      setTimeout(() => {
        if (!mod38Engine.initialized) {
          mod38Engine.init();
        }
      }, 0);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
