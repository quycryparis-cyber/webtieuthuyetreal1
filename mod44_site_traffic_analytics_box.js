/**
 * @fileoverview
 * ✍️ WEB VIẾT TIỂU THUYẾT CỦA BI — MODULE 44 (v44.0)
 * Ô Thống Kê Người Đang Truy Cập & Lượt Truy Cập Trang Web (Đơn Ô Gọn Đẹp Tab 6)
 *
 * Thiết kế kiến trúc chuẩn Single-Box Analytics:
 * - Gắn duy nhất 1 ô thống kê (#mod44-traffic-summary-box) vào khoảng giữa hàng trên Tab 6
 *   (#tab6-mod44-traffic-host giữa nút "Báo cáo lỗi" và cụm "Người làm trang web" trên Desktop,
 *   tự xếp gọn ngay bên dưới trên Mobile / Tablet không tràn viền).
 * - Hiển thị đồng thời 6 chỉ số cốt lõi theo múi giờ chuẩn Asia/Ho_Chi_Minh (GMT+7):
 *     1. Đang truy cập (Live Multi-Tab Presence qua BroadcastChannel + LocalStorage Heartbeat)
 *     2. Lượt truy cập Hôm nay (theo ngày YYYY-MM-DD GMT+7)
 *     3. Lượt truy cập Tuần này (theo tuần ISO-8601 Thứ Hai -> Chủ Nhật YYYY-Www)
 *     4. Lượt truy cập Tháng này (theo tháng YYYY-MM)
 *     5. Lượt truy cập Năm này (theo năm YYYY)
 *     6. Toàn lịch sử (lũy kế vĩnh viễn bất biến theo thời gian, có bảo lưu 2 tầng)
 * - Lưu trữ bền vững 2 tầng (L1 LocalStorage + L2 IndexedDB BiNovelMod44TrafficDB) kèm tự phục hồi,
 *   lưu trữ lịch sử 90 ngày / 24 tuần / 24 tháng / 10 năm và tự động chuyển mốc qua 00:00 nửa đêm.
 * - Hỗ trợ tùy chọn đồng bộ điểm cuối đếm toàn cầu khi chạy HTTP/HTTPS (chỉ bật khi được cấu hình
 *   tường minh; hoàn toàn không gây lỗi CORS/mạng khi chạy offline, file:// hoặc PWA cục bộ).
 */

(function initMod44SiteTrafficAnalyticsModule(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  /**
   * Hằng số cấu hình bất biến cho Module 44.
   */
  const MOD44_CONSTANTS = Object.freeze({
    MODULE_ID: 'mod44',
    MODULE_VERSION: '44.0.0',
    DISPLAY_NAME: 'Ô Thống Kê Truy Cập Trang Web',
    TIMEZONE_ID: 'Asia/Ho_Chi_Minh',
    UTC_OFFSET_MINUTES: 420,
    HOST_ELEMENT_ID: 'tab6-mod44-traffic-host',
    BOX_ELEMENT_ID: 'mod44-traffic-summary-box',
    FALLBACK_SCREEN_SELECTOR: '#SCREEN_6_SYSTEM',
    STORAGE_KEYS: Object.freeze({
      LEDGER: 'bi_novel_mod44_traffic_ledger_v3',
      LEGACY_LEDGER: 'bi_novel_mod44_traffic_ledger_v2',
      PRESENCE_MAP: 'bi_novel_mod44_presence_tabs_v1',
      REMOTE_CONFIG: 'bi_novel_mod44_remote_cfg_v3',
      REMOTE_SNAPSHOT: 'bi_novel_mod44_remote_snapshot_v3',
      REMOTE_KNOWN_BUCKETS: 'bi_novel_mod44_remote_known_buckets_v3',
      PRESENCE_SLOT_PING: 'bi_novel_mod44_presence_slot_v3',
      SESSION_COUNTED: 'bi_novel_mod44_session_visit_counted_v3',
      TAB_ID_SESSION: 'bi_novel_mod44_active_tab_id_v1',
    }),
    DEFAULT_REMOTE: Object.freeze({
      URL: 'https://abacus.jasoncameron.dev',
      NAMESPACE: 'bi-novel-quycry-v3',
      MODE: 'merge_max',
      PRESENCE_WINDOW_MS: 120000,
    }),
    INDEXED_DB: Object.freeze({
      NAME: 'BiNovelMod44TrafficDB',
      VERSION: 1,
      STORE: 'trafficState',
      LEDGER_RECORD_KEY: 'primary_ledger_v3',
    }),
    CHANNELS: Object.freeze({
      PRESENCE_BROADCAST: 'BiNovelStudio_Mod44_TrafficPresence_v1',
    }),
    TIMINGS: Object.freeze({
      HEARTBEAT_INTERVAL_MS: 8000,
      PRESENCE_STALE_TTL_MS: 26000,
      ROLLOVER_CHECK_INTERVAL_MS: 30000,
      SESSION_RECOUNT_COOLDOWN_MS: 1800000, // 30 phút nếu cùng phiên mở lại thủ công
      RENDER_DEBOUNCE_MS: 60,
      CALC_SYNC_DEBOUNCE_MS: 500,
      REMOTE_TIMEOUT_MS: 5500,
      REMOTE_MIN_SYNC_INTERVAL_MS: 25000,
    }),
    RETENTION: Object.freeze({
      MAX_DAILY_ARCHIVE: 90,
      MAX_WEEKLY_ARCHIVE: 26,
      MAX_MONTHLY_ARCHIVE: 24,
      MAX_YEARLY_ARCHIVE: 12,
      MAX_RECENT_VISITS: 30,
    }),
  });

  /**
   * Danh mục mô tả chuẩn 6 ô chỉ số hiển thị trong ô thống kê Tab 6.
   */
  const METRIC_CARD_SPECS = Object.freeze([
    Object.freeze({
      key: 'online',
      valId: 'mod44-val-online',
      cardId: 'mod44-metric-card-online',
      label: 'Đang truy cập',
      shortLabel: 'Đang xem',
      icon: '🟢',
      accentDark: 'border-emerald-500/45 bg-emerald-950/35 text-emerald-300',
      accentLight: 'border-emerald-400/75 bg-emerald-50/90 text-emerald-800',
      valueClassDark: 'text-emerald-300',
      valueClassLight: 'text-emerald-700',
      description: 'Số người / cửa sổ đang mở trang web tại thời điểm hiện tại',
      isLive: true,
    }),
    Object.freeze({
      key: 'today',
      valId: 'mod44-val-today',
      cardId: 'mod44-metric-card-today',
      label: 'Hôm nay',
      shortLabel: 'Hôm nay',
      icon: '☀️',
      accentDark: 'border-sky-500/40 bg-sky-950/30 text-sky-300',
      accentLight: 'border-sky-400/70 bg-sky-50/90 text-sky-800',
      valueClassDark: 'text-sky-200',
      valueClassLight: 'text-sky-700',
      description: 'Tổng lượt truy cập tính từ 00:00 hôm nay (giờ Việt Nam)',
      isLive: false,
    }),
    Object.freeze({
      key: 'week',
      valId: 'mod44-val-week',
      cardId: 'mod44-metric-card-week',
      label: 'Tuần này',
      shortLabel: 'Tuần này',
      icon: '📅',
      accentDark: 'border-indigo-500/40 bg-indigo-950/30 text-indigo-300',
      accentLight: 'border-indigo-400/70 bg-indigo-50/90 text-indigo-800',
      valueClassDark: 'text-indigo-200',
      valueClassLight: 'text-indigo-700',
      description: 'Tổng lượt truy cập từ Thứ Hai đầu tuần đến hiện tại (ISO-8601)',
      isLive: false,
    }),
    Object.freeze({
      key: 'month',
      valId: 'mod44-val-month',
      cardId: 'mod44-metric-card-month',
      label: 'Tháng này',
      shortLabel: 'Tháng này',
      icon: '🗓️',
      accentDark: 'border-amber-500/40 bg-amber-950/25 text-amber-300',
      accentLight: 'border-amber-400/70 bg-amber-50/90 text-amber-800',
      valueClassDark: 'text-amber-200',
      valueClassLight: 'text-amber-700',
      description: 'Tổng lượt truy cập tính từ ngày mùng 1 đầu tháng đến hiện tại',
      isLive: false,
    }),
    Object.freeze({
      key: 'year',
      valId: 'mod44-val-year',
      cardId: 'mod44-metric-card-year',
      label: 'Năm này',
      shortLabel: 'Năm này',
      icon: '🎆',
      accentDark: 'border-fuchsia-500/40 bg-fuchsia-950/25 text-fuchsia-300',
      accentLight: 'border-fuchsia-400/70 bg-fuchsia-50/90 text-fuchsia-800',
      valueClassDark: 'text-fuchsia-200',
      valueClassLight: 'text-fuchsia-700',
      description: 'Tổng lượt truy cập tích lũy từ đầu năm dương lịch hiện tại',
      isLive: false,
    }),
    Object.freeze({
      key: 'allTime',
      valId: 'mod44-val-alltime',
      cardId: 'mod44-metric-card-alltime',
      label: 'Toàn lịch sử',
      shortLabel: 'Lịch sử',
      icon: '🏛️',
      accentDark: 'border-teal-400/50 bg-teal-950/35 text-teal-200',
      accentLight: 'border-teal-500/75 bg-teal-50/95 text-teal-900',
      valueClassDark: 'text-teal-200',
      valueClassLight: 'text-teal-800',
      description: 'Tổng toàn bộ lượt truy cập tích lũy trong suốt lịch sử sử dụng',
      isLive: false,
    }),
  ]);

  /**
   * Trình chuyển đổi HTML an toàn tránh XSS tuyệt đối khi render chuỗi động.
   * @param {unknown} raw
   * @returns {string}
   */
  function escapeHtmlSafe(raw) {
    const str = raw === null || raw === undefined ? '' : String(raw);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Chuyển đổi giá trị bất kỳ về số nguyên không âm hợp lệ.
   * @param {unknown} val
   * @param {number} [fallback=0]
   * @returns {number}
   */
  function clampNonNegativeInt(val, fallback = 0) {
    const num = Number(val);
    if (!Number.isFinite(num) || num < 0) return fallback;
    return Math.floor(num);
  }

  /**
   * Tạo chuỗi định danh ngẫu nhiên an toàn cho tab hoặc phiên làm việc.
   * @param {string} [prefix='mod44']
   * @returns {string}
   */
  function generateUniqueToken(prefix = 'mod44') {
    const nowPart = Date.now().toString(36);
    try {
      if (globalScope.crypto && typeof globalScope.crypto.randomUUID === 'function') {
        return `${prefix}_${nowPart}_${globalScope.crypto.randomUUID().slice(0, 8)}`;
      }
      if (globalScope.crypto && typeof globalScope.crypto.getRandomValues === 'function') {
        const arr = new Uint32Array(2);
        globalScope.crypto.getRandomValues(arr);
        return `${prefix}_${nowPart}_${arr[0].toString(36)}${arr[1].toString(36)}`;
      }
    } catch (_) {
      // Fallback sang Math.random ở môi trường không hỗ trợ WebCrypto
    }
    return `${prefix}_${nowPart}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Bộ tính toán Lịch Dương, Tuần ISO-8601 & Múi Giờ Asia/Ho_Chi_Minh thuần xác định.
   * Đảm bảo khóa ngày/tuần/tháng/năm chính xác kể cả khi đồng hồ máy người dùng ở múi giờ khác.
   */
  class Mod44CalendarTimeEngine {
    /**
     * @param {string} [timeZone='Asia/Ho_Chi_Minh']
     * @param {number} [fallbackOffsetMinutes=420]
     */
    constructor(timeZone = MOD44_CONSTANTS.TIMEZONE_ID, fallbackOffsetMinutes = MOD44_CONSTANTS.UTC_OFFSET_MINUTES) {
      this.timeZone = timeZone || 'Asia/Ho_Chi_Minh';
      this.fallbackOffsetMinutes = Number.isFinite(fallbackOffsetMinutes) ? fallbackOffsetMinutes : 420;
      this.dtFormatter = this.buildSafeFormatter();
    }

    /**
     * Khởi tạo Intl.DateTimeFormat an toàn, fallback về null nếu môi trường thiếu ICU.
     * @returns {Intl.DateTimeFormat|null}
     */
    buildSafeFormatter() {
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: this.timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
        });
      } catch (_) {
        return null;
      }
    }

    /**
     * Kiểm tra năm nhuận dương lịch chuẩn Gregory.
     * @param {number} year
     * @returns {boolean}
     */
    isLeapYear(year) {
      const y = clampNonNegativeInt(year, 1970);
      return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    }

    /**
     * Số ngày trong tháng dương lịch (tháng 1..12).
     * @param {number} year
     * @param {number} month
     * @returns {number}
     */
    getDaysInMonth(year, month) {
      const m = Math.max(1, Math.min(12, clampNonNegativeInt(month, 1)));
      if (m === 2) return this.isLeapYear(year) ? 29 : 28;
      if (m === 4 || m === 6 || m === 9 || m === 11) return 30;
      return 31;
    }

    /**
     * Tính thứ trong tuần theo công thức Sakamoto (1 = Thứ Hai .. 7 = Chủ Nhật theo chuẩn ISO).
     * @param {number} year
     * @param {number} month
     * @param {number} day
     * @returns {number}
     */
    getIsoWeekday(year, month, day) {
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const jsDay = utcDate.getUTCDay(); // 0=CN .. 6=T7
      return jsDay === 0 ? 7 : jsDay;
    }

    /**
     * Tính cặp { isoYear, isoWeek } chuẩn ISO-8601 (Thứ Hai là đầu tuần, tuần 1 chứa 04/01).
     * @param {number} year
     * @param {number} month
     * @param {number} day
     * @returns {{ isoYear: number, isoWeek: number, weekKey: string }}
     */
    computeIsoWeekInfo(year, month, day) {
      const target = new Date(Date.UTC(year, month - 1, day));
      const isoDayNum = target.getUTCDay() || 7;
      // Dịch sang Thứ Năm cùng tuần ISO để xác định năm ISO chuẩn
      target.setUTCDate(target.getUTCDate() + 4 - isoDayNum);
      const isoYear = target.getUTCFullYear();
      const yearStart = new Date(Date.UTC(isoYear, 0, 1));
      const diffDays = Math.floor((target.getTime() - yearStart.getTime()) / 86400000);
      const isoWeek = Math.floor(diffDays / 7) + 1;
      const paddedWeek = String(isoWeek).padStart(2, '0');
      return {
        isoYear,
        isoWeek,
        weekKey: `${isoYear}-W${paddedWeek}`,
      };
    }

    /**
     * Phân tách timestamp epochMs thành các thành phần lịch trong múi giờ mục tiêu.
     * @param {number} [epochMs=Date.now()]
     * @returns {{ year: number, month: number, day: number, hour: number, minute: number, second: number, isoWeekday: number }}
     */
    getZonedParts(epochMs = Date.now()) {
      const safeMs = Number.isFinite(epochMs) ? epochMs : Date.now();
      if (this.dtFormatter && typeof this.dtFormatter.formatToParts === 'function') {
        try {
          const parts = this.dtFormatter.formatToParts(new Date(safeMs));
          const map = {};
          for (let i = 0; i < parts.length; i += 1) {
            map[parts[i].type] = parts[i].value;
          }
          const year = clampNonNegativeInt(map.year, 2026);
          const month = Math.max(1, Math.min(12, clampNonNegativeInt(map.month, 1)));
          const day = Math.max(1, Math.min(31, clampNonNegativeInt(map.day, 1)));
          const hour = clampNonNegativeInt(map.hour, 0) % 24;
          const minute = clampNonNegativeInt(map.minute, 0) % 60;
          const second = clampNonNegativeInt(map.second, 0) % 60;
          return {
            year,
            month,
            day,
            hour,
            minute,
            second,
            isoWeekday: this.getIsoWeekday(year, month, day),
          };
        } catch (_) {
          // Rơi xuống bộ tính toán offset thuần nếu Intl báo lỗi
        }
      }

      const shifted = new Date(safeMs + this.fallbackOffsetMinutes * 60000);
      const year = shifted.getUTCFullYear();
      const month = shifted.getUTCMonth() + 1;
      const day = shifted.getUTCDate();
      const hour = shifted.getUTCHours();
      const minute = shifted.getUTCMinutes();
      const second = shifted.getUTCSeconds();
      return {
        year,
        month,
        day,
        hour,
        minute,
        second,
        isoWeekday: this.getIsoWeekday(year, month, day),
      };
    }

    /**
     * Lấy trọn bộ khóa bucket (ngày/tuần/tháng/năm) và chuỗi hiển thị tại mốc thời gian.
     * @param {number} [epochMs=Date.now()]
     * @returns {Object}
     */
    getBucketDescriptor(epochMs = Date.now()) {
      const p = this.getZonedParts(epochMs);
      const yyyy = String(p.year).padStart(4, '0');
      const mm = String(p.month).padStart(2, '0');
      const dd = String(p.day).padStart(2, '0');
      const hh = String(p.hour).padStart(2, '0');
      const mi = String(p.minute).padStart(2, '0');
      const ss = String(p.second).padStart(2, '0');

      const isoWeekInfo = this.computeIsoWeekInfo(p.year, p.month, p.day);
      const i18n = NS.i18n;
      const localizedDate =
        i18n && typeof i18n.formatDate === 'function'
          ? i18n.formatDate({ year: p.year, month: p.month, day: p.day })
          : `${dd}/${mm}/${yyyy}`;
      const localizedTime =
        i18n && typeof i18n.formatTime === 'function'
          ? i18n.formatTime({ hour: p.hour, minute: p.minute, second: p.second })
          : `${hh}:${mi}:${ss}`;

      return {
        epochMs: Number.isFinite(epochMs) ? epochMs : Date.now(),
        parts: p,
        dayKey: `${yyyy}-${mm}-${dd}`,
        weekKey: isoWeekInfo.weekKey,
        isoWeekNumber: isoWeekInfo.isoWeek,
        isoWeekYear: isoWeekInfo.isoYear,
        monthKey: `${yyyy}-${mm}`,
        yearKey: yyyy,
        displayDate: localizedDate,
        displayTime: localizedTime,
        displayDateTime: `${localizedDate} ${localizedTime}`,
      };
    }

    /**
     * Tính số mili-giây còn lại tới mốc chuyển ngày 00:00:02 kế tiếp tại GMT+7.
     * @param {number} [epochMs=Date.now()]
     * @returns {number}
     */
    getMsUntilNextDayBoundary(epochMs = Date.now()) {
      const p = this.getZonedParts(epochMs);
      const elapsedSecToday = p.hour * 3600 + p.minute * 60 + p.second;
      const remainingSec = Math.max(2, 86402 - elapsedSecToday);
      return remainingSec * 1000;
    }

    /**
     * Định dạng số nguyên kiểu Việt Nam (1.234.567) hoặc rút gọn thông minh nếu số quá lớn.
     * @param {number} count
     * @param {boolean} [allowCompact=false]
     * @returns {string}
     */
    formatNumber(count, allowCompact = false) {
      const safe = clampNonNegativeInt(count, 0);
      if (allowCompact && safe >= 1000000) {
        return `${(safe / 1000000).toFixed(1).replace('.0', '')}M`;
      }
      if (allowCompact && safe >= 100000) {
        return `${(safe / 1000).toFixed(1).replace('.0', '')}K`;
      }
      try {
        const locale = NS.i18n?.getIntlLocale?.() || 'vi-VN';
        return safe.toLocaleString(locale);
      } catch (_) {
        return String(safe);
      }
    }

    /**
     * Mô tả thời gian tương đối bằng tiếng Việt (ví dụ: "Vừa xong", "12 giây trước").
     * @param {number} targetEpochMs
     * @param {number} [nowMs=Date.now()]
     * @returns {string}
     */
    formatRelativeAge(targetEpochMs, nowMs = Date.now()) {
      const ts = Number(targetEpochMs);
      if (!Number.isFinite(ts) || ts <= 0) return 'Chưa ghi nhận';
      const diffSec = Math.max(0, Math.floor((nowMs - ts) / 1000));
      if (diffSec < 5) return 'Vừa cập nhật';
      if (diffSec < 60) return `${diffSec} giây trước`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} giờ trước`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay} ngày trước`;
    }
  }

  /**
   * Bộ đối chiếu Chuyển Mốc Thời Gian & Bảo Lưu Lịch Sử (Daily/Weekly/Monthly/Yearly Archive).
   * Đảm bảo khi sang ngày mới/tuần mới/tháng mới/năm mới, các bộ đếm chu kỳ tự reset sạch
   * đồng thời lưu lại số liệu cũ vào bảng lưu trữ và giữ nguyên Toàn Lịch Sử bất biến.
   */
  class Mod44RollingRolloverEngine {
    /**
     * @param {Mod44CalendarTimeEngine} timeEngine
     */
    constructor(timeEngine) {
      this.timeEngine = timeEngine;
    }

    /**
     * Tạo mới sổ cái thống kê chuẩn schema v2.
     * @param {number} [nowMs=Date.now()]
     * @returns {Object}
     */
    createFreshLedger(nowMs = Date.now()) {
      const desc = this.timeEngine.getBucketDescriptor(nowMs);
      return {
        schemaVersion: 2,
        moduleVersion: MOD44_CONSTANTS.MODULE_VERSION,
        timeZone: MOD44_CONSTANTS.TIMEZONE_ID,
        createdAt: desc.epochMs,
        updatedAt: desc.epochMs,
        lastVisitAt: 0,
        lastRolloverAt: desc.epochMs,
        activeDayKey: desc.dayKey,
        activeWeekKey: desc.weekKey,
        activeMonthKey: desc.monthKey,
        activeYearKey: desc.yearKey,
        counts: {
          today: 0,
          week: 0,
          month: 0,
          year: 0,
          allTime: 0,
        },
        peakConcurrent: 1,
        peakConcurrentAt: desc.epochMs,
        dailyArchive: {},
        weeklyArchive: {},
        monthlyArchive: {},
        yearlyArchive: {},
        recentVisits: [],
      };
    }

    /**
     * Cắt tỉa map archive theo thứ tự khóa từ cũ đến mới để không phình dung lượng lưu trữ.
     * @param {Record<string, number>} archiveObj
     * @param {number} maxEntries
     * @returns {Record<string, number>}
     */
    pruneArchiveMap(archiveObj, maxEntries) {
      if (!archiveObj || typeof archiveObj !== 'object') return {};
      const validEntries = [];
      const keys = Object.keys(archiveObj).sort();
      for (let i = 0; i < keys.length; i += 1) {
        const k = keys[i];
        const v = clampNonNegativeInt(archiveObj[k], 0);
        if (k && k.length <= 24) {
          validEntries.push([k, v]);
        }
      }
      const sliced = validEntries.length > maxEntries
        ? validEntries.slice(validEntries.length - maxEntries)
        : validEntries;
      const next = {};
      for (let i = 0; i < sliced.length; i += 1) {
        next[sliced[i][0]] = sliced[i][1];
      }
      return next;
    }

    /**
     * Làm sạch và di trú sổ cái từ JSON bất kỳ thành đối tượng chuẩn hoàn toàn không lỗi.
     * @param {unknown} raw
     * @param {number} [nowMs=Date.now()]
     * @returns {Object}
     */
    sanitizeAndMigrateLedger(raw, nowMs = Date.now()) {
      const fresh = this.createFreshLedger(nowMs);
      if (!raw || typeof raw !== 'object') return fresh;

      const src = raw;
      const countsSrc = src.counts && typeof src.counts === 'object' ? src.counts : src;

      const today = clampNonNegativeInt(countsSrc.today, 0);
      const week = Math.max(today, clampNonNegativeInt(countsSrc.week, today));
      const month = Math.max(today, clampNonNegativeInt(countsSrc.month, today));
      const year = Math.max(month, clampNonNegativeInt(countsSrc.year, month));
      const allTime = Math.max(year, week, clampNonNegativeInt(countsSrc.allTime, year));

      const recentRaw = Array.isArray(src.recentVisits) ? src.recentVisits : [];
      const recentClean = [];
      for (let i = 0; i < recentRaw.length; i += 1) {
        const item = recentRaw[i];
        if (item && typeof item === 'object' && Number.isFinite(Number(item.ts))) {
          recentClean.push({
            ts: clampNonNegativeInt(item.ts, nowMs),
            dayKey: typeof item.dayKey === 'string' ? item.dayKey.slice(0, 16) : '',
            mode: typeof item.mode === 'string' ? item.mode.slice(0, 12) : 'WEB',
            reason: typeof item.reason === 'string' ? item.reason.slice(0, 24) : 'visit',
          });
        }
      }

      const hydrated = {
        schemaVersion: 2,
        moduleVersion: MOD44_CONSTANTS.MODULE_VERSION,
        timeZone: MOD44_CONSTANTS.TIMEZONE_ID,
        createdAt: clampNonNegativeInt(src.createdAt, fresh.createdAt) || fresh.createdAt,
        updatedAt: clampNonNegativeInt(src.updatedAt, fresh.updatedAt) || fresh.updatedAt,
        lastVisitAt: clampNonNegativeInt(src.lastVisitAt, 0),
        lastRolloverAt: clampNonNegativeInt(src.lastRolloverAt, fresh.lastRolloverAt),
        activeDayKey: typeof src.activeDayKey === 'string' && src.activeDayKey ? src.activeDayKey : fresh.activeDayKey,
        activeWeekKey: typeof src.activeWeekKey === 'string' && src.activeWeekKey ? src.activeWeekKey : fresh.activeWeekKey,
        activeMonthKey: typeof src.activeMonthKey === 'string' && src.activeMonthKey ? src.activeMonthKey : fresh.activeMonthKey,
        activeYearKey: typeof src.activeYearKey === 'string' && src.activeYearKey ? src.activeYearKey : fresh.activeYearKey,
        counts: {
          today,
          week,
          month,
          year,
          allTime,
        },
        peakConcurrent: Math.max(1, clampNonNegativeInt(src.peakConcurrent, 1)),
        peakConcurrentAt: clampNonNegativeInt(src.peakConcurrentAt, nowMs),
        dailyArchive: this.pruneArchiveMap(src.dailyArchive, MOD44_CONSTANTS.RETENTION.MAX_DAILY_ARCHIVE),
        weeklyArchive: this.pruneArchiveMap(src.weeklyArchive, MOD44_CONSTANTS.RETENTION.MAX_WEEKLY_ARCHIVE),
        monthlyArchive: this.pruneArchiveMap(src.monthlyArchive, MOD44_CONSTANTS.RETENTION.MAX_MONTHLY_ARCHIVE),
        yearlyArchive: this.pruneArchiveMap(src.yearlyArchive, MOD44_CONSTANTS.RETENTION.MAX_YEARLY_ARCHIVE),
        recentVisits: recentClean.slice(-MOD44_CONSTANTS.RETENTION.MAX_RECENT_VISITS),
      };

      return this.reconcileRollover(hydrated, nowMs).ledger;
    }

    /**
     * Đối chiếu khóa ngày/tuần/tháng/năm hiện tại của sổ cái so với thời gian thực GMT+7.
     * Nếu đã bước qua chu kỳ mới thì bảo lưu số cũ vào Archive và reset bộ đếm chu kỳ đó về 0.
     * @param {Object} ledger
     * @param {number} [nowMs=Date.now()]
     * @returns {{ ledger: Object, rolledOver: boolean, changedBuckets: string[] }}
     */
    reconcileRollover(ledger, nowMs = Date.now()) {
      const desc = this.timeEngine.getBucketDescriptor(nowMs);
      const changedBuckets = [];

      if (ledger.activeDayKey !== desc.dayKey) {
        if (ledger.activeDayKey && ledger.counts.today > 0) {
          ledger.dailyArchive[ledger.activeDayKey] = Math.max(
            clampNonNegativeInt(ledger.dailyArchive[ledger.activeDayKey], 0),
            ledger.counts.today
          );
        }
        ledger.activeDayKey = desc.dayKey;
        ledger.counts.today = 0;
        ledger.dailyArchive = this.pruneArchiveMap(ledger.dailyArchive, MOD44_CONSTANTS.RETENTION.MAX_DAILY_ARCHIVE);
        changedBuckets.push('today');
      }

      if (ledger.activeWeekKey !== desc.weekKey) {
        if (ledger.activeWeekKey && ledger.counts.week > 0) {
          ledger.weeklyArchive[ledger.activeWeekKey] = Math.max(
            clampNonNegativeInt(ledger.weeklyArchive[ledger.activeWeekKey], 0),
            ledger.counts.week
          );
        }
        ledger.activeWeekKey = desc.weekKey;
        ledger.counts.week = 0;
        ledger.weeklyArchive = this.pruneArchiveMap(ledger.weeklyArchive, MOD44_CONSTANTS.RETENTION.MAX_WEEKLY_ARCHIVE);
        changedBuckets.push('week');
      }

      if (ledger.activeMonthKey !== desc.monthKey) {
        if (ledger.activeMonthKey && ledger.counts.month > 0) {
          ledger.monthlyArchive[ledger.activeMonthKey] = Math.max(
            clampNonNegativeInt(ledger.monthlyArchive[ledger.activeMonthKey], 0),
            ledger.counts.month
          );
        }
        ledger.activeMonthKey = desc.monthKey;
        ledger.counts.month = 0;
        ledger.monthlyArchive = this.pruneArchiveMap(ledger.monthlyArchive, MOD44_CONSTANTS.RETENTION.MAX_MONTHLY_ARCHIVE);
        changedBuckets.push('month');
      }

      if (ledger.activeYearKey !== desc.yearKey) {
        if (ledger.activeYearKey && ledger.counts.year > 0) {
          ledger.yearlyArchive[ledger.activeYearKey] = Math.max(
            clampNonNegativeInt(ledger.yearlyArchive[ledger.activeYearKey], 0),
            ledger.counts.year
          );
        }
        ledger.activeYearKey = desc.yearKey;
        ledger.counts.year = 0;
        ledger.yearlyArchive = this.pruneArchiveMap(ledger.yearlyArchive, MOD44_CONSTANTS.RETENTION.MAX_YEARLY_ARCHIVE);
        changedBuckets.push('year');
      }

      // Luôn bảo toàn bất biến lũy kế
      ledger.counts.week = Math.max(ledger.counts.week, ledger.counts.today);
      ledger.counts.year = Math.max(ledger.counts.year, ledger.counts.month);
      ledger.counts.allTime = Math.max(
        ledger.counts.allTime,
        ledger.counts.year,
        ledger.counts.week,
        ledger.counts.month,
        ledger.counts.today
      );

      const rolledOver = changedBuckets.length > 0;
      if (rolledOver) {
        ledger.lastRolloverAt = desc.epochMs;
        ledger.updatedAt = desc.epochMs;
      }

      return { ledger, rolledOver, changedBuckets };
    }

    /**
     * Cộng thêm +delta lượt truy cập đồng bộ vào cả 5 bộ đếm (Hôm nay, Tuần, Tháng, Năm, Lịch sử)
     * và cập nhật Archive hiện hành.
     * @param {Object} ledger
     * @param {number} [delta=1]
     * @param {string} [mode='WEB']
     * @param {string} [reason='session_start']
     * @param {number} [nowMs=Date.now()]
     * @returns {Object}
     */
    applyIncrement(ledger, delta = 1, mode = 'WEB', reason = 'session_start', nowMs = Date.now()) {
      const safeDelta = Math.max(1, clampNonNegativeInt(delta, 1));
      this.reconcileRollover(ledger, nowMs);
      const desc = this.timeEngine.getBucketDescriptor(nowMs);

      ledger.counts.today += safeDelta;
      ledger.counts.week += safeDelta;
      ledger.counts.month += safeDelta;
      ledger.counts.year += safeDelta;
      ledger.counts.allTime += safeDelta;

      ledger.dailyArchive[desc.dayKey] = ledger.counts.today;
      ledger.weeklyArchive[desc.weekKey] = ledger.counts.week;
      ledger.monthlyArchive[desc.monthKey] = ledger.counts.month;
      ledger.yearlyArchive[desc.yearKey] = ledger.counts.year;

      ledger.dailyArchive = this.pruneArchiveMap(ledger.dailyArchive, MOD44_CONSTANTS.RETENTION.MAX_DAILY_ARCHIVE);
      ledger.weeklyArchive = this.pruneArchiveMap(ledger.weeklyArchive, MOD44_CONSTANTS.RETENTION.MAX_WEEKLY_ARCHIVE);
      ledger.monthlyArchive = this.pruneArchiveMap(ledger.monthlyArchive, MOD44_CONSTANTS.RETENTION.MAX_MONTHLY_ARCHIVE);
      ledger.yearlyArchive = this.pruneArchiveMap(ledger.yearlyArchive, MOD44_CONSTANTS.RETENTION.MAX_YEARLY_ARCHIVE);

      ledger.lastVisitAt = desc.epochMs;
      ledger.updatedAt = desc.epochMs;

      ledger.recentVisits.push({
        ts: desc.epochMs,
        dayKey: desc.dayKey,
        mode: String(mode || 'WEB').slice(0, 12),
        reason: String(reason || 'visit').slice(0, 24),
      });
      if (ledger.recentVisits.length > MOD44_CONSTANTS.RETENTION.MAX_RECENT_VISITS) {
        ledger.recentVisits = ledger.recentVisits.slice(-MOD44_CONSTANTS.RETENTION.MAX_RECENT_VISITS);
      }
      return ledger;
    }

    /**
     * Chọn sổ cái giàu dữ liệu nhất giữa L1 LocalStorage và L2 IndexedDB để không mất lượt nào.
     * @param {Object|null} a
     * @param {Object|null} b
     * @param {number} [nowMs=Date.now()]
     * @returns {Object}
     */
    pickRicherLedger(a, b, nowMs = Date.now()) {
      if (!a && !b) return this.createFreshLedger(nowMs);
      if (!a) return this.sanitizeAndMigrateLedger(b, nowMs);
      if (!b) return this.sanitizeAndMigrateLedger(a, nowMs);

      const normA = this.sanitizeAndMigrateLedger(a, nowMs);
      const normB = this.sanitizeAndMigrateLedger(b, nowMs);

      if (normA.counts.allTime > normB.counts.allTime) return normA;
      if (normB.counts.allTime > normA.counts.allTime) return normB;
      return normA.updatedAt >= normB.updatedAt ? normA : normB;
    }
  }

  /**
   * Kho lưu trữ bền vững 2 tầng (Tầng 1: LocalStorage tức thì + Tầng 2: IndexedDB dự phòng sâu).
   * Tự động xếp hàng các tác vụ ghi nối tiếp để tránh tranh chấp I/O.
   */
  class Mod44DualTierLedgerStorage {
    /**
     * @param {Mod44RollingRolloverEngine} rolloverEngine
     */
    constructor(rolloverEngine) {
      this.rolloverEngine = rolloverEngine;
      this.idbPromise = null;
      this.writeChain = Promise.resolve();
      this.lastStorageTierReport = {
        localStorageOk: false,
        indexedDbOk: false,
      };
    }

    /**
     * Đọc bản ghi sổ cái thống nhất từ LocalStorage (khởi tạo kỷ nguyên đồng bộ v3 chuẩn).
     * @returns {Object|null}
     */
    readFromLocalStorage() {
      try {
        if (!globalScope.localStorage) return null;
        const primary = globalScope.localStorage.getItem(MOD44_CONSTANTS.STORAGE_KEYS.LEDGER);
        if (primary) {
          this.lastStorageTierReport.localStorageOk = true;
          return JSON.parse(primary);
        }
        this.lastStorageTierReport.localStorageOk = true;
        return null;
      } catch (_) {
        this.lastStorageTierReport.localStorageOk = false;
        return null;
      }
    }

    /**
     * Ghi đồng bộ xuống LocalStorage ngay lập tức.
     * @param {Object} ledger
     * @returns {boolean}
     */
    writeToLocalStorage(ledger) {
      try {
        if (!globalScope.localStorage) return false;
        globalScope.localStorage.setItem(MOD44_CONSTANTS.STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
        this.lastStorageTierReport.localStorageOk = true;
        return true;
      } catch (_) {
        this.lastStorageTierReport.localStorageOk = false;
        return false;
      }
    }

    /**
     * Mở kết nối IndexedDB an toàn (tái sử dụng kết nối đã mở).
     * @returns {Promise<IDBDatabase|null>}
     */
    openIdb() {
      if (this.idbPromise) return this.idbPromise;
      this.idbPromise = new Promise((resolve) => {
        try {
          if (!globalScope.indexedDB || typeof globalScope.indexedDB.open !== 'function') {
            resolve(null);
            return;
          }
          const req = globalScope.indexedDB.open(
            MOD44_CONSTANTS.INDEXED_DB.NAME,
            MOD44_CONSTANTS.INDEXED_DB.VERSION
          );
          req.onupgradeneeded = (evt) => {
            try {
              const db = evt.target && evt.target.result;
              if (db && !db.objectStoreNames.contains(MOD44_CONSTANTS.INDEXED_DB.STORE)) {
                db.createObjectStore(MOD44_CONSTANTS.INDEXED_DB.STORE);
              }
            } catch (_) {
              // Bỏ qua lỗi nâng cấp store nếu đã tồn tại
            }
          };
          req.onsuccess = (evt) => {
            const db = evt.target && evt.target.result;
            this.lastStorageTierReport.indexedDbOk = Boolean(db);
            if (db) {
              db.onversionchange = () => {
                try {
                  db.close();
                } catch (_) {
                  // No-op
                }
                this.idbPromise = null;
              };
            }
            resolve(db || null);
          };
          req.onerror = () => {
            this.lastStorageTierReport.indexedDbOk = false;
            resolve(null);
          };
          req.onblocked = () => {
            resolve(null);
          };
        } catch (_) {
          this.lastStorageTierReport.indexedDbOk = false;
          resolve(null);
        }
      });
      return this.idbPromise;
    }

    /**
     * Đọc sổ cái dự phòng từ IndexedDB.
     * @returns {Promise<Object|null>}
     */
    async readFromIndexedDb() {
      const db = await this.openIdb();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(MOD44_CONSTANTS.INDEXED_DB.STORE, 'readonly');
          const store = tx.objectStore(MOD44_CONSTANTS.INDEXED_DB.STORE);
          const req = store.get(MOD44_CONSTANTS.INDEXED_DB.LEDGER_RECORD_KEY);
          req.onsuccess = () => {
            this.lastStorageTierReport.indexedDbOk = true;
            resolve(req.result && typeof req.result === 'object' ? req.result : null);
          };
          req.onerror = () => {
            resolve(null);
          };
        } catch (_) {
          resolve(null);
        }
      });
    }

    /**
     * Ghi sổ cái xuống IndexedDB.
     * @param {Object} ledger
     * @returns {Promise<boolean>}
     */
    async writeToIndexedDb(ledger) {
      const db = await this.openIdb();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(MOD44_CONSTANTS.INDEXED_DB.STORE, 'readwrite');
          const store = tx.objectStore(MOD44_CONSTANTS.INDEXED_DB.STORE);
          store.put(ledger, MOD44_CONSTANTS.INDEXED_DB.LEDGER_RECORD_KEY);
          tx.oncomplete = () => {
            this.lastStorageTierReport.indexedDbOk = true;
            resolve(true);
          };
          tx.onerror = () => resolve(false);
          tx.onabort = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }

    /**
     * Nạp bản ghi đầy đủ nhất từ LocalStorage + IndexedDB và tự đồng bộ hóa chéo 2 tầng.
     * @param {number} [nowMs=Date.now()]
     * @returns {Promise<Object>}
     */
    async loadBestLedger(nowMs = Date.now()) {
      const l1 = this.readFromLocalStorage();
      let l2 = null;
      try {
        l2 = await this.readFromIndexedDb();
      } catch (_) {
        l2 = null;
      }
      const best = this.rolloverEngine.pickRicherLedger(l1, l2, nowMs);
      this.writeToLocalStorage(best);
      this.writeToIndexedDb(best).catch(() => false);
      return best;
    }

    /**
     * Xếp hàng lưu an toàn 2 tầng để chống race-condition giữa nhiều thao tác ghi liên tiếp.
     * @param {Object} ledger
     * @returns {Promise<{ l1: boolean, l2: boolean }>}
     */
    saveLedger(ledger) {
      const cloned = JSON.parse(JSON.stringify(ledger));
      this.writeChain = this.writeChain
        .catch(() => undefined)
        .then(async () => {
          const l1 = this.writeToLocalStorage(cloned);
          const l2 = await this.writeToIndexedDb(cloned);
          return { l1, l2 };
        });
      return this.writeChain;
    }

    /**
     * Kiểm tra xem phiên hiện tại đã được cộng lượt hay chưa (tránh bấm refresh liên tục gây sai lệch, tự mở khóa khi sang ngày mới GMT+7).
     * @param {number} [nowMs=Date.now()]
     * @param {string} [currentDayKey='']
     * @returns {boolean}
     */
    hasCountedCurrentSession(nowMs = Date.now(), currentDayKey = '') {
      try {
        if (!globalScope.sessionStorage) return false;
        const raw = globalScope.sessionStorage.getItem(MOD44_CONSTANTS.STORAGE_KEYS.SESSION_COUNTED);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return false;
        if (currentDayKey && parsed.dayKey && parsed.dayKey !== currentDayKey) return false;
        const ageMs = nowMs - clampNonNegativeInt(parsed.ts, 0);
        return ageMs >= 0 && ageMs < MOD44_CONSTANTS.TIMINGS.SESSION_RECOUNT_COOLDOWN_MS;
      } catch (_) {
        return false;
      }
    }

    /**
     * Đánh dấu phiên trình duyệt hiện tại đã ghi nhận 1 lượt truy cập.
     * @param {number} [nowMs=Date.now()]
     * @param {string} [dayKey='']
     */
    markSessionCounted(nowMs = Date.now(), dayKey = '') {
      try {
        if (!globalScope.sessionStorage) return;
        globalScope.sessionStorage.setItem(
          MOD44_CONSTANTS.STORAGE_KEYS.SESSION_COUNTED,
          JSON.stringify({
            ts: nowMs,
            dayKey: String(dayKey || ''),
            counted: true,
          })
        );
      } catch (_) {
        // Không làm gián đoạn nếu SessionStorage bị khóa ở chế độ riêng tư hạn chế
      }
    }

    /**
     * Đọc cấu hình điểm cuối đồng bộ toàn cầu (mặc định dùng Abacus Public Global Counter qua HTTPS).
     * @returns {{ url: string, namespace: string, mode: string }}
     */
    loadRemoteConfig() {
      const defaults = {
        url: typeof globalScope.NOIR_TRAFFIC_ENDPOINT === 'string' && globalScope.NOIR_TRAFFIC_ENDPOINT.trim()
          ? globalScope.NOIR_TRAFFIC_ENDPOINT.trim()
          : MOD44_CONSTANTS.DEFAULT_REMOTE.URL,
        namespace: MOD44_CONSTANTS.DEFAULT_REMOTE.NAMESPACE,
        mode: MOD44_CONSTANTS.DEFAULT_REMOTE.MODE,
      };
      try {
        if (!globalScope.localStorage) return defaults;
        const raw = globalScope.localStorage.getItem(MOD44_CONSTANTS.STORAGE_KEYS.REMOTE_CONFIG);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return defaults;
        const nextUrl = typeof parsed.url === 'string' && parsed.url.trim() ? parsed.url.trim() : defaults.url;
        const isDefaultAbacus = /abacus\.jasoncameron\.dev/i.test(nextUrl);
        return {
          url: nextUrl,
          namespace: typeof parsed.namespace === 'string' && parsed.namespace.trim()
            ? parsed.namespace.trim()
            : defaults.namespace,
          // Dùng merge_max cho Abacus mặc định để không bao giờ bị kéo tụt về 0/1 khi khóa từ xa hết hạn
          mode: isDefaultAbacus
            ? 'merge_max'
            : (parsed.mode === 'server_authoritative' ? 'server_authoritative' : 'merge_max'),
        };
      } catch (_) {
        return defaults;
      }
    }

    /**
     * Lưu cấu hình điểm cuối từ xa (Abacus hoặc URL máy chủ riêng).
     * @param {{ url?: string, namespace?: string, mode?: string }} cfg
     * @returns {{ url: string, namespace: string, mode: string }}
     */
    saveRemoteConfig(cfg) {
      const current = this.loadRemoteConfig();
      const next = {
        url: typeof cfg?.url === 'string' ? cfg.url.trim() : current.url,
        namespace: typeof cfg?.namespace === 'string' && cfg.namespace.trim()
          ? cfg.namespace.trim()
          : current.namespace,
        mode: cfg?.mode === 'merge_max' ? 'merge_max' : 'server_authoritative',
      };
      try {
        if (globalScope.localStorage) {
          globalScope.localStorage.setItem(MOD44_CONSTANTS.STORAGE_KEYS.REMOTE_CONFIG, JSON.stringify(next));
        }
      } catch (_) {
        // Bỏ qua nếu LocalStorage đầy
      }
      return next;
    }

    /**
     * Đọc bản chụp số liệu đám mây gần nhất để giữ hiển thị đồng nhất tức thì trên các lần tải trang.
     * @param {string} namespace
     * @returns {Object|null}
     */
    loadRemoteSnapshot(namespace = '') {
      try {
        if (!globalScope.localStorage) return null;
        const raw = globalScope.localStorage.getItem(MOD44_CONSTANTS.STORAGE_KEYS.REMOTE_SNAPSHOT);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        if (namespace && parsed.namespace && parsed.namespace !== namespace) return null;
        return parsed.snapshot || null;
      } catch (_) {
        return null;
      }
    }

    /**
     * Lưu bản chụp số liệu đám mây đã đồng bộ thành công.
     * @param {string} namespace
     * @param {Object} snapshot
     */
    saveRemoteSnapshot(namespace, snapshot) {
      if (!snapshot || typeof snapshot !== 'object') return;
      try {
        if (globalScope.localStorage) {
          globalScope.localStorage.setItem(
            MOD44_CONSTANTS.STORAGE_KEYS.REMOTE_SNAPSHOT,
            JSON.stringify({ namespace, snapshot, savedAt: Date.now() })
          );
        }
      } catch (_) {
        // Ignore
      }
    }

    /**
     * Kiểm tra / ghi dấu khóa bucket đã từng được khởi tạo trên Abacus để tránh gọi /get gây 404.
     * @returns {Object}
     */
    loadKnownRemoteBuckets() {
      try {
        if (!globalScope.localStorage) return {};
        const raw = globalScope.localStorage.getItem(MOD44_CONSTANTS.STORAGE_KEYS.REMOTE_KNOWN_BUCKETS);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (_) {
        return {};
      }
    }

    markKnownRemoteBucket(namespace, key) {
      try {
        if (!globalScope.localStorage) return;
        const map = this.loadKnownRemoteBuckets();
        const nsKey = `${namespace}::${key}`;
        map[nsKey] = Date.now();
        const entries = Object.entries(map);
        if (entries.length > 64) {
          entries.sort((a, b) => a[1] - b[1]);
          for (let i = 0; i < entries.length - 64; i += 1) {
            delete map[entries[i][0]];
          }
        }
        globalScope.localStorage.setItem(MOD44_CONSTANTS.STORAGE_KEYS.REMOTE_KNOWN_BUCKETS, JSON.stringify(map));
      } catch (_) {
        // Ignore
      }
    }

    isKnownRemoteBucket(namespace, key) {
      const map = this.loadKnownRemoteBuckets();
      return Boolean(map[`${namespace}::${key}`]);
    }
  }

  /**
   * Bộ điều phối Hiện Diện Trực Tiếp Đa Tab (Live Active Viewers / Multi-Tab Presence).
   * Kết hợp BroadcastChannel + bản đồ heartbeat trong LocalStorage + dọn dẹp pagehide/beforeunload
   * để đếm chính xác số tab / cửa sổ PWA đang mở trang web theo thời gian thực.
   */
  class Mod44LivePresenceCoordinator {
    /**
     * @param {Function} onPresenceChanged
     */
    constructor(onPresenceChanged) {
      this.onPresenceChanged = typeof onPresenceChanged === 'function' ? onPresenceChanged : () => {};
      this.tabId = this.resolveTabId();
      this.channel = null;
      this.heartbeatTimerId = null;
      this.activeTabsSnapshot = {};
      this.disposed = false;
      this.boundStorageHandler = null;
      this.boundVisibilityHandler = null;
      this.boundUnloadHandler = null;
    }

    /**
     * Lấy hoặc khởi tạo Tab ID ổn định suốt vòng đời của tab hiện tại.
     * @returns {string}
     */
    resolveTabId() {
      try {
        if (globalScope.sessionStorage) {
          const existing = globalScope.sessionStorage.getItem(MOD44_CONSTANTS.STORAGE_KEYS.TAB_ID_SESSION);
          if (existing) return existing;
          const fresh = generateUniqueToken('tab');
          globalScope.sessionStorage.setItem(MOD44_CONSTANTS.STORAGE_KEYS.TAB_ID_SESSION, fresh);
          return fresh;
        }
      } catch (_) {
        // Ignore
      }
      return generateUniqueToken('tab');
    }

    /**
     * Xác định ứng dụng đang mở dưới dạng Web thường hay App PWA độc lập.
     * @returns {'PWA'|'WEB'}
     */
    detectRuntimeSurface() {
      try {
        const isStandaloneMedia =
          typeof globalScope.matchMedia === 'function' &&
          (globalScope.matchMedia('(display-mode: standalone)').matches ||
            globalScope.matchMedia('(display-mode: window-controls-overlay)').matches);
        const isIosStandalone = Boolean(globalScope.navigator && globalScope.navigator.standalone === true);
        return isStandaloneMedia || isIosStandalone ? 'PWA' : 'WEB';
      } catch (_) {
        return 'WEB';
      }
    }

    /**
     * Đọc bản đồ các tab đang hoạt động từ LocalStorage và tự động loại bỏ các tab đã quá hạn TTL.
     * @param {number} [nowMs=Date.now()]
     * @returns {Record<string, Object>}
     */
    readAndPruneMap(nowMs = Date.now()) {
      let parsed = {};
      try {
        if (globalScope.localStorage) {
          const raw = globalScope.localStorage.getItem(MOD44_CONSTANTS.STORAGE_KEYS.PRESENCE_MAP);
          if (raw) {
            const candidate = JSON.parse(raw);
            if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
              parsed = candidate;
            }
          }
        }
      } catch (_) {
        parsed = {};
      }

      const cleaned = {};
      const keys = Object.keys(parsed);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const entry = parsed[key];
        if (!entry || typeof entry !== 'object') continue;
        const lastPing = clampNonNegativeInt(entry.lastPingAt, 0);
        if (nowMs - lastPing <= MOD44_CONSTANTS.TIMINGS.PRESENCE_STALE_TTL_MS) {
          cleaned[key] = entry;
        }
      }
      return cleaned;
    }

    /**
     * Ghi bản đồ hiện diện xuống LocalStorage.
     * @param {Record<string, Object>} map
     */
    writeMap(map) {
      try {
        if (globalScope.localStorage) {
          globalScope.localStorage.setItem(MOD44_CONSTANTS.STORAGE_KEYS.PRESENCE_MAP, JSON.stringify(map));
        }
      } catch (_) {
        // Bỏ qua nếu bị chặn
      }
    }

    /**
     * Cập nhật nhịp tim (heartbeat) cho tab hiện tại và tính lại số người đang truy cập.
     * @param {string} [reason='heartbeat']
     * @returns {{ activeCount: number, tabs: Record<string, Object>, visibleCount: number }}
     */
    beat(reason = 'heartbeat') {
      const nowMs = Date.now();
      const map = this.readAndPruneMap(nowMs);
      const prevTab = map[this.tabId];
      const currentScreen =
        (globalScope.document && globalScope.document.body && globalScope.document.body.dataset.s14Screen) ||
        'SCREEN_1_WRITE';
      const isVisible = !(globalScope.document && globalScope.document.visibilityState === 'hidden');

      map[this.tabId] = {
        tabId: this.tabId,
        joinedAt: prevTab && prevTab.joinedAt ? prevTab.joinedAt : nowMs,
        lastPingAt: nowMs,
        visible: isVisible,
        mode: this.detectRuntimeSurface(),
        screen: String(currentScreen),
      };

      this.writeMap(map);
      this.activeTabsSnapshot = map;

      if (this.channel) {
        try {
          this.channel.postMessage({
            type: reason === 'init' ? 'JOIN' : 'HEARTBEAT',
            tabId: this.tabId,
            entry: map[this.tabId],
            ts: nowMs,
          });
        } catch (_) {
          // Ignore disconnected BroadcastChannel
        }
      }

      const summary = this.summarizePresence(map);
      this.onPresenceChanged(summary);
      return summary;
    }

    /**
     * Xóa tab hiện tại khỏi danh sách khi đóng cửa sổ / tắt app.
     */
    leave() {
      const nowMs = Date.now();
      const map = this.readAndPruneMap(nowMs);
      if (Object.prototype.hasOwnProperty.call(map, this.tabId)) {
        delete map[this.tabId];
        this.writeMap(map);
      }
      if (this.channel) {
        try {
          this.channel.postMessage({
            type: 'LEAVE',
            tabId: this.tabId,
            ts: nowMs,
          });
        } catch (_) {
          // Ignore
        }
      }
    }

    /**
     * Tổng hợp số liệu người đang truy cập từ bản đồ hiện diện.
     * @param {Record<string, Object>} [map=this.activeTabsSnapshot]
     * @returns {{ activeCount: number, visibleCount: number, pwaCount: number, webCount: number, tabs: Record<string, Object> }}
     */
    summarizePresence(map = this.activeTabsSnapshot) {
      const safeMap = map && typeof map === 'object' ? map : {};
      const keys = Object.keys(safeMap);
      let visibleCount = 0;
      let pwaCount = 0;
      let webCount = 0;

      for (let i = 0; i < keys.length; i += 1) {
        const entry = safeMap[keys[i]];
        if (!entry) continue;
        if (entry.visible) visibleCount += 1;
        if (entry.mode === 'PWA') pwaCount += 1;
        else webCount += 1;
      }

      const activeCount = Math.max(1, keys.length);
      return {
        activeCount,
        visibleCount: Math.max(activeCount > 0 ? 1 : 0, visibleCount),
        pwaCount,
        webCount,
        tabs: safeMap,
      };
    }

    /**
     * Bắt đầu lắng nghe đa tab và phát nhịp tim định kỳ.
     */
    start() {
      if (this.disposed) return;

      if (typeof globalScope.BroadcastChannel === 'function') {
        try {
          this.channel = new globalScope.BroadcastChannel(MOD44_CONSTANTS.CHANNELS.PRESENCE_BROADCAST);
          this.channel.onmessage = (evt) => {
            const msg = evt && evt.data;
            if (!msg || typeof msg !== 'object') return;
            const nowMs = Date.now();
            const map = this.readAndPruneMap(nowMs);
            if (msg.type === 'LEAVE' && msg.tabId) {
              delete map[msg.tabId];
              this.writeMap(map);
              this.activeTabsSnapshot = map;
              this.onPresenceChanged(this.summarizePresence(map));
            } else if ((msg.type === 'JOIN' || msg.type === 'HEARTBEAT' || msg.type === 'PONG') && msg.tabId && msg.entry) {
              map[msg.tabId] = msg.entry;
              this.writeMap(map);
              this.activeTabsSnapshot = map;
              this.onPresenceChanged(this.summarizePresence(map));
              if (msg.type === 'JOIN' && msg.tabId !== this.tabId && this.channel) {
                try {
                  this.channel.postMessage({
                    type: 'PONG',
                    tabId: this.tabId,
                    entry: map[this.tabId],
                    ts: nowMs,
                  });
                } catch (_) {
                  // Ignore
                }
              }
            }
          };
        } catch (_) {
          this.channel = null;
        }
      }

      this.boundStorageHandler = (evt) => {
        if (evt && evt.key === MOD44_CONSTANTS.STORAGE_KEYS.PRESENCE_MAP) {
          const map = this.readAndPruneMap(Date.now());
          this.activeTabsSnapshot = map;
          this.onPresenceChanged(this.summarizePresence(map));
        }
      };
      globalScope.addEventListener('storage', this.boundStorageHandler);

      this.boundVisibilityHandler = () => {
        if (this.disposed) return;
        this.beat('visibility');
      };
      if (globalScope.document) {
        globalScope.document.addEventListener('visibilitychange', this.boundVisibilityHandler);
      }

      this.boundUnloadHandler = () => {
        this.leave();
      };
      globalScope.addEventListener('pagehide', this.boundUnloadHandler);
      globalScope.addEventListener('beforeunload', this.boundUnloadHandler);

      this.beat('init');
      this.heartbeatTimerId = globalScope.setInterval(() => {
        if (this.disposed) return;
        if (globalScope.document && globalScope.document.hidden) return;
        if (globalScope.NoirStudio?.perfManager?.isFeatureDisabled?.('traffic_analytics')) return;
        this.beat('interval');
      }, MOD44_CONSTANTS.TIMINGS.HEARTBEAT_INTERVAL_MS);
    }

    /**
     * Ngừng mọi bộ đếm nhịp tim và gỡ toàn bộ trình lắng nghe.
     */
    destroy() {
      this.disposed = true;
      if (this.heartbeatTimerId) {
        globalScope.clearInterval(this.heartbeatTimerId);
        this.heartbeatTimerId = null;
      }
      this.leave();
      if (this.channel) {
        try {
          this.channel.close();
        } catch (_) {
          // Ignore
        }
        this.channel = null;
      }
      if (this.boundStorageHandler) {
        globalScope.removeEventListener('storage', this.boundStorageHandler);
      }
      if (this.boundVisibilityHandler && globalScope.document) {
        globalScope.document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
      }
      if (this.boundUnloadHandler) {
        globalScope.removeEventListener('pagehide', this.boundUnloadHandler);
        globalScope.removeEventListener('beforeunload', this.boundUnloadHandler);
      }
    }
  }

  /**
   * Bộ chuyển đổi Đồng Bộ Bộ Đếm Toàn Cầu (Tùy chọn).
   * Nguyên tắc an toàn:
   * - Chỉ gửi yêu cầu mạng khi chạy trên giao thức HTTP/HTTPS thực tế, thiết bị đang online,
   *   VÀ đã được cấu hình URL điểm cuối hợp lệ tường minh.
   * - Tuyệt đối không tự gọi tới tên miền giả định gây lỗi Console/CORS khi dùng offline hoặc file://.
   */
  class Mod44OptionalRemoteCounterAdapter {
    /**
     * @param {Mod44DualTierLedgerStorage} storage
     * @param {Mod44CalendarTimeEngine} timeEngine
     */
    constructor(storage, timeEngine) {
      this.storage = storage;
      this.timeEngine = timeEngine;
      this.lastSyncAt = 0;
      this.lastError = '';
      this.lastRemoteSnapshot = null;
      this.consecutiveFailures = 0;
    }

    /**
     * Kiểm tra điểm cuối từ xa có đủ điều kiện gọi mạng an toàn hay không.
     * @returns {{ enabled: boolean, reason: string, config: Object }}
     */
    evaluateEligibility() {
      const cfg = this.storage.loadRemoteConfig();
      if (!cfg.url) {
        return { enabled: false, reason: 'local_only_no_endpoint', config: cfg };
      }

      let proto = '';
      try {
        proto = globalScope.location && globalScope.location.protocol ? globalScope.location.protocol : '';
      } catch (_) {
        proto = '';
      }
      if (proto !== 'http:' && proto !== 'https:') {
        return { enabled: false, reason: 'non_http_protocol', config: cfg };
      }

      try {
        const parsedUrl = new URL(cfg.url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return { enabled: false, reason: 'invalid_endpoint_protocol', config: cfg };
        }
      } catch (_) {
        return { enabled: false, reason: 'malformed_endpoint_url', config: cfg };
      }

      if (globalScope.navigator && globalScope.navigator.onLine === false) {
        return { enabled: false, reason: 'device_offline', config: cfg };
      }

      if (typeof globalScope.fetch !== 'function') {
        return { enabled: false, reason: 'fetch_unavailable', config: cfg };
      }

      return { enabled: true, reason: 'ready', config: cfg };
    }

    /**
     * Chuẩn hóa dữ liệu phản hồi JSON từ máy chủ đếm bên ngoài về đúng schema 6 chỉ số.
     * @param {unknown} rawPayload
     * @returns {{ online: number, today: number, week: number, month: number, year: number, allTime: number }|null}
     */
    normalizeRemotePayload(rawPayload) {
      if (!rawPayload || typeof rawPayload !== 'object') return null;
      const src = rawPayload.data && typeof rawPayload.data === 'object' ? rawPayload.data : rawPayload;
      const online = clampNonNegativeInt(src.online ?? src.active ?? src.currentOnline, 0);
      const today = clampNonNegativeInt(src.today ?? src.daily, 0);
      const week = clampNonNegativeInt(src.week ?? src.weekly, 0);
      const month = clampNonNegativeInt(src.month ?? src.monthly, 0);
      const year = clampNonNegativeInt(src.year ?? src.yearly, 0);
      const allTime = clampNonNegativeInt(src.allTime ?? src.total ?? src.history, 0);

      if (online === 0 && today === 0 && week === 0 && month === 0 && year === 0 && allTime === 0) {
        return null;
      }

      return {
        online,
        today,
        week: Math.max(today, week),
        month: Math.max(today, month),
        year: Math.max(month, year),
        allTime: Math.max(year, week, allTime),
      };
    }

    /**
     * Tính độ trễ backoff nếu các lần đồng bộ mạng liên tiếp trước đó thất bại.
     * @returns {number}
     */
    computeCooldownMs() {
      const base = MOD44_CONSTANTS.TIMINGS.REMOTE_MIN_SYNC_INTERVAL_MS;
      if (this.consecutiveFailures <= 0) return base;
      const multiplier = Math.min(8, Math.pow(2, this.consecutiveFailures - 1));
      return base * multiplier;
    }

    /**
     * Nhận diện xem endpoint có phải API Abacus CORS chuẩn (/hit/:ns/:key & /get/:ns/:key) hay máy chủ POST tùy chỉnh.
     * @param {string} urlStr
     * @returns {boolean}
     */
    isAbacusEndpoint(urlStr) {
      return /abacus\.jasoncameron\.dev/i.test(String(urlStr || ''));
    }

    /**
     * Tạo danh sách khóa bộ đếm toàn cầu theo múi giờ chuẩn GMT+7 (Ngày / Tuần / Tháng / Năm / Toàn lịch sử / Nhịp hiện diện 2 phút).
     * @param {Object} bucketDesc
     * @param {number} [nowMs=Date.now()]
     * @returns {Object}
     */
    buildGlobalBucketKeys(bucketDesc, nowMs = Date.now()) {
      const clean = (s) => String(s || '0').replace(/[^a-zA-Z0-9_-]/g, '_');
      const winSlot = Math.floor(nowMs / MOD44_CONSTANTS.DEFAULT_REMOTE.PRESENCE_WINDOW_MS);
      return {
        today: `d_${clean(bucketDesc?.dayKey)}`,
        week: `w_${clean(bucketDesc?.weekKey)}`,
        month: `m_${clean(bucketDesc?.monthKey)}`,
        year: `y_${clean(bucketDesc?.yearKey)}`,
        allTime: 'all_total',
        presenceKey: `p_${winSlot}`,
        presenceSlot: winSlot,
      };
    }

    /**
     * Kiểm tra / ghi dấu nhịp hiện diện 2 phút trên tab hiện tại để F5 reload không đếm trùng người online.
     * @param {number} slotNum
     * @returns {boolean}
     */
    claimPresenceWindowSlot(slotNum) {
      try {
        if (!globalScope.sessionStorage) return true;
        const prev = clampNonNegativeInt(
          globalScope.sessionStorage.getItem(MOD44_CONSTANTS.STORAGE_KEYS.PRESENCE_SLOT_PING),
          0
        );
        if (prev === slotNum) return false;
        globalScope.sessionStorage.setItem(MOD44_CONSTANTS.STORAGE_KEYS.PRESENCE_SLOT_PING, String(slotNum));
        return true;
      } catch (_) {
        return true;
      }
    }

    /**
     * Truy vấn một khóa đơn trên Abacus (/hit để khởi tạo/tăng hoặc /get để đọc sạch khi khóa đã tồn tại).
     * @param {string} baseUrl
     * @param {string} namespace
     * @param {'hit'|'get'} op
     * @param {string} key
     * @param {AbortSignal|undefined} signal
     * @param {boolean} keepalive
     * @returns {Promise<number|null>}
     */
    async queryAbacusSingleKey(baseUrl, namespace, op, key, signal, keepalive) {
      const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
      const url = `${cleanBase}/${op}/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`;
      const res = await globalScope.fetch(url, {
        method: 'GET',
        signal,
        keepalive,
      });
      if (!res || !res.ok) return null;
      const json = await res.json();
      if (!json || typeof json.value === 'undefined') return null;
      this.storage.markKnownRemoteBucket(namespace, key);
      return clampNonNegativeInt(json.value, 0);
    }

    /**
     * Đồng bộ đầy đủ 6 chỉ số toàn cầu qua Abacus Global REST Counter.
     * Chỉ dùng /hit khi ghi nhận lượt mới hoặc khởi tạo bucket mới (tránh 404 console).
     * @param {'visit'|'heartbeat'|'read'} action
     * @param {Object} bucketDesc
     * @param {Object} cfg
     * @param {AbortSignal|undefined} signal
     * @returns {Promise<Object|null>}
     */
    async syncWithAbacus(action, bucketDesc, cfg, signal) {
      const keys = this.buildGlobalBucketKeys(bucketDesc, Date.now());
      const ns = cfg.namespace || MOD44_CONSTANTS.DEFAULT_REMOTE.NAMESPACE;
      const isVisit = action === 'visit';
      const shouldPingPresence = this.claimPresenceWindowSlot(keys.presenceSlot);

      const resolveOpForBucket = (bucketKey) => {
        if (isVisit) return 'hit';
        return this.storage.isKnownRemoteBucket(ns, bucketKey) ? 'get' : 'hit';
      };

      const opToday = resolveOpForBucket(keys.today);
      const opWeek = resolveOpForBucket(keys.week);
      const opMonth = resolveOpForBucket(keys.month);
      const opYear = resolveOpForBucket(keys.year);
      const opAll = resolveOpForBucket(keys.allTime);
      const opPresence = shouldPingPresence || !this.storage.isKnownRemoteBucket(ns, keys.presenceKey) ? 'hit' : 'get';

      const [valOnline, valToday, valWeek, valMonth, valYear, valAll] = await Promise.all([
        this.queryAbacusSingleKey(cfg.url, ns, opPresence, keys.presenceKey, signal, false).catch(() => null),
        this.queryAbacusSingleKey(cfg.url, ns, opToday, keys.today, signal, isVisit).catch(() => null),
        this.queryAbacusSingleKey(cfg.url, ns, opWeek, keys.week, signal, isVisit).catch(() => null),
        this.queryAbacusSingleKey(cfg.url, ns, opMonth, keys.month, signal, isVisit).catch(() => null),
        this.queryAbacusSingleKey(cfg.url, ns, opYear, keys.year, signal, isVisit).catch(() => null),
        this.queryAbacusSingleKey(cfg.url, ns, opAll, keys.allTime, signal, isVisit).catch(() => null),
      ]);

      if (valAll === null && valToday === null && valYear === null && valMonth === null && valWeek === null) {
        return null;
      }

      const prev = this.lastRemoteSnapshot || {};
      const today = valToday !== null ? valToday : clampNonNegativeInt(prev.today, 1);
      const week = Math.max(today, valWeek !== null ? valWeek : clampNonNegativeInt(prev.week, today));
      const month = Math.max(today, valMonth !== null ? valMonth : clampNonNegativeInt(prev.month, today));
      const year = Math.max(month, valYear !== null ? valYear : clampNonNegativeInt(prev.year, month));
      const allTime = Math.max(year, week, valAll !== null ? valAll : clampNonNegativeInt(prev.allTime, Math.max(year, week)));
      const online = Math.max(1, valOnline !== null ? valOnline : clampNonNegativeInt(prev.online, 1));

      return { online, today, week, month, year, allTime };
    }

    /**
     * Đồng bộ hai chiều với máy chủ (Abacus toàn cầu hoặc máy chủ JSON tùy chỉnh).
     * @param {'visit'|'heartbeat'|'read'} action
     * @param {Object} bucketDesc
     * @param {boolean} [force=false]
     * @returns {Promise<{ synced: boolean, snapshot: Object|null, status: string }>}
     */
    async syncWithServer(action, bucketDesc, force = false) {
      const elig = this.evaluateEligibility();
      if (!elig.enabled) {
        return { synced: false, snapshot: null, status: elig.reason };
      }

      const nowMs = Date.now();
      if (!force && action !== 'visit' && nowMs - this.lastSyncAt < this.computeCooldownMs()) {
        return { synced: false, snapshot: this.lastRemoteSnapshot, status: 'throttled_cooldown' };
      }

      const controller = typeof globalScope.AbortController === 'function' ? new globalScope.AbortController() : null;
      const timeoutId = controller
        ? globalScope.setTimeout(() => {
            try {
              controller.abort();
            } catch (_) {
              // Ignore
            }
          }, MOD44_CONSTANTS.TIMINGS.REMOTE_TIMEOUT_MS)
        : null;

      try {
        let normalized = null;
        if (this.isAbacusEndpoint(elig.config.url)) {
          normalized = await this.syncWithAbacus(
            action,
            bucketDesc,
            elig.config,
            controller ? controller.signal : undefined
          );
        } else {
          const bodyPayload = {
            action,
            namespace: elig.config.namespace,
            timeZone: MOD44_CONSTANTS.TIMEZONE_ID,
            dayKey: bucketDesc.dayKey,
            weekKey: bucketDesc.weekKey,
            monthKey: bucketDesc.monthKey,
            yearKey: bucketDesc.yearKey,
            ts: nowMs,
          };

          const res = await globalScope.fetch(elig.config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload),
            signal: controller ? controller.signal : undefined,
            keepalive: action === 'visit',
          });

          if (!res || !res.ok) {
            throw new Error(`HTTP_${res ? res.status : 'ERR'}`);
          }

          const json = await res.json();
          normalized = this.normalizeRemotePayload(json);
        }

        if (!normalized) {
          throw new Error('EMPTY_REMOTE_COUNTER');
        }

        this.lastSyncAt = Date.now();
        this.consecutiveFailures = 0;
        this.lastError = '';
        this.lastRemoteSnapshot = normalized;
        this.storage.saveRemoteSnapshot(elig.config.namespace, normalized);
        return {
          synced: true,
          snapshot: normalized,
          status: 'cloud_synced',
        };
      } catch (err) {
        this.consecutiveFailures += 1;
        this.lastError = err && err.message ? String(err.message) : 'network_error';
        return { synced: false, snapshot: this.lastRemoteSnapshot, status: 'remote_unreachable' };
      } finally {
        if (timeoutId !== null) {
          globalScope.clearTimeout(timeoutId);
        }
      }
    }

    /**
     * Hợp nhất số liệu cục bộ và số liệu máy chủ theo chế độ đã cấu hình.
     * @param {{ online: number, today: number, week: number, month: number, year: number, allTime: number }} localMetrics
     * @returns {{ metrics: Object, sourceMode: string }}
     */
    mergeWithLocal(localMetrics) {
      const elig = this.evaluateEligibility();
      if (!elig.enabled) {
        return {
          metrics: localMetrics,
          sourceMode: 'local-multitab',
        };
      }

      const snap = this.lastRemoteSnapshot || this.storage.loadRemoteSnapshot(elig.config.namespace);
      if (!snap) {
        return {
          metrics: localMetrics,
          sourceMode: 'local-multitab',
        };
      }

      if (elig.config.mode === 'server_authoritative') {
        const today = Math.max(snap.today, localMetrics.today > 0 ? 1 : 0);
        const week = Math.max(snap.week, today);
        const month = Math.max(snap.month, today);
        const year = Math.max(snap.year, month);
        const allTime = Math.max(snap.allTime, year, week);
        return {
          metrics: {
            online: Math.max(1, localMetrics.online, snap.online),
            today,
            week,
            month,
            year,
            allTime,
          },
          sourceMode: 'cloud-synced',
        };
      }

      const mergedToday = Math.max(localMetrics.today, snap.today);
      const mergedMonth = Math.max(localMetrics.month, snap.month, mergedToday);
      const mergedWeek = Math.max(localMetrics.week, snap.week, mergedToday);
      const mergedYear = Math.max(localMetrics.year, snap.year, mergedMonth);
      const mergedAll = Math.max(localMetrics.allTime, snap.allTime, mergedYear, mergedWeek);

      return {
        metrics: {
          online: Math.max(localMetrics.online, snap.online),
          today: mergedToday,
          week: mergedWeek,
          month: mergedMonth,
          year: mergedYear,
          allTime: mergedAll,
        },
        sourceMode: 'cloud-synced',
      };
    }
  }

  /**
   * Trình giải mã Giao Diện Sáng/Tối & Tính Toán Phân Tích Lịch Sử Bổ Trợ.
   * Cung cấp báo cáo xu hướng, ngày cao điểm và phân giải bảng màu chuẩn cho Single-Box UI.
   */
  class Mod44AnalyticsInsightHelper {
    /**
     * @param {Mod44CalendarTimeEngine} timeEngine
     */
    constructor(timeEngine) {
      this.timeEngine = timeEngine;
    }

    /**
     * Kiểm tra giao diện toàn trang hiện đang bật nền Tối (Dark) hay Sáng (Light).
     * @returns {boolean}
     */
    isDarkThemeActive() {
      try {
        const doc = globalScope.document;
        if (!doc) return true;
        const root = doc.documentElement;
        if (root && root.getAttribute('data-theme') === 'light') return false;
        if (root && root.classList && root.classList.contains('dark')) return true;
        if (doc.body && doc.body.classList && doc.body.classList.contains('dark')) return true;
        return !root || root.classList.contains('dark') !== false;
      } catch (_) {
        return true;
      }
    }

    /**
     * Tính toán các chỉ số phân tích chuyên sâu từ Archive để phục vụ tự kiểm tra và tooltip chi tiết.
     * @param {Object} ledger
     * @returns {Object}
     */
    computeTrendSummary(ledger) {
      const dailyMap = ledger && ledger.dailyArchive ? ledger.dailyArchive : {};
      const dailyKeys = Object.keys(dailyMap).sort();
      let trackedDays = dailyKeys.length;
      let totalArchivedDailyVisits = 0;
      let peakDayKey = ledger?.activeDayKey || '';
      let peakDayCount = clampNonNegativeInt(ledger?.counts?.today, 0);

      for (let i = 0; i < dailyKeys.length; i += 1) {
        const k = dailyKeys[i];
        const v = clampNonNegativeInt(dailyMap[k], 0);
        totalArchivedDailyVisits += v;
        if (v > peakDayCount) {
          peakDayCount = v;
          peakDayKey = k;
        }
      }

      if (ledger && ledger.activeDayKey && dailyMap[ledger.activeDayKey] === undefined) {
        trackedDays += 1;
        totalArchivedDailyVisits += clampNonNegativeInt(ledger.counts.today, 0);
      }

      const avgDaily = trackedDays > 0 ? Math.round((totalArchivedDailyVisits / trackedDays) * 10) / 10 : 0;

      const monthlyMap = ledger && ledger.monthlyArchive ? ledger.monthlyArchive : {};
      const monthlyKeys = Object.keys(monthlyMap).sort();
      let peakMonthKey = ledger?.activeMonthKey || '';
      let peakMonthCount = clampNonNegativeInt(ledger?.counts?.month, 0);

      for (let i = 0; i < monthlyKeys.length; i += 1) {
        const mk = monthlyKeys[i];
        const mv = clampNonNegativeInt(monthlyMap[mk], 0);
        if (mv > peakMonthCount) {
          peakMonthCount = mv;
          peakMonthKey = mk;
        }
      }

      const yearlyMap = ledger && ledger.yearlyArchive ? ledger.yearlyArchive : {};
      const yearlyKeys = Object.keys(yearlyMap).sort();

      return {
        trackedDays,
        trackedMonths: monthlyKeys.length,
        trackedYears: yearlyKeys.length,
        averageDailyVisits: avgDaily,
        peakDayKey,
        peakDayCount,
        peakMonthKey,
        peakMonthCount,
        peakConcurrent: Math.max(1, clampNonNegativeInt(ledger?.peakConcurrent, 1)),
      };
    }

    /**
     * Xuất chuỗi báo cáo văn bản đọc nhanh về tình trạng truy cập.
     * @param {Object} snapshot
     * @returns {string}
     */
    formatPlainTextReport(snapshot) {
      if (!snapshot || !snapshot.metrics) return 'Chưa có dữ liệu thống kê truy cập.';
      const m = snapshot.metrics;
      const lines = [
        '📊 BÁO CÁO THỐNG KÊ TRUY CẬP — WEB VIẾT TIỂU THUYẾT CỦA BI',
        `• Thời gian đối chiếu: ${snapshot.clock.displayDateTime} (${MOD44_CONSTANTS.TIMEZONE_ID})`,
        `• Chu kỳ tuần hiện tại: ${snapshot.clock.weekKey}`,
        `• Nguồn đếm: ${snapshot.sourceMode === 'cloud-synced' ? 'Đồng bộ máy chủ toàn cầu + Multi-tab' : 'Thiết bị & Multi-tab cục bộ (LocalStorage + IndexedDB)'}`,
        '--------------------------------------------------',
        `• Đang truy cập: ${this.timeEngine.formatNumber(m.online)}`,
        `• Hôm nay (${snapshot.clock.dayKey}): ${this.timeEngine.formatNumber(m.today)}`,
        `• Tuần này (${snapshot.clock.weekKey}): ${this.timeEngine.formatNumber(m.week)}`,
        `• Tháng này (${snapshot.clock.monthKey}): ${this.timeEngine.formatNumber(m.month)}`,
        `• Năm này (${snapshot.clock.yearKey}): ${this.timeEngine.formatNumber(m.year)}`,
        `• Toàn lịch sử: ${this.timeEngine.formatNumber(m.allTime)}`,
      ];
      if (snapshot.trends) {
        lines.push(
          `• Ngày cao điểm: ${snapshot.trends.peakDayKey || 'N/A'} (${this.timeEngine.formatNumber(snapshot.trends.peakDayCount)} lượt)`,
          `• Trung bình/ngày: ${snapshot.trends.averageDailyVisits} lượt (${snapshot.trends.trackedDays} ngày ghi nhận)`
        );
      }
      return lines.join('\n');
    }
  }

  /**
   * Trình Kết Xuất Giao Diện Đơn Ô Duy Nhất (#mod44-traffic-summary-box) trên Tab 6.
   * Tuân thủ nghiêm ngặt yêu cầu: "chỉ thêm 1 ô như vậy thôi á" — tối ưu cho cả Desktop,
   * Tablet, Mobile (360px+) và Standalone PWA không bao giờ tràn viền hay bóp méo nút.
   */
  class Mod44SingleBoxViewRenderer {
    /**
     * @param {Mod44CalendarTimeEngine} timeEngine
     * @param {Mod44AnalyticsInsightHelper} insightHelper
     */
    constructor(timeEngine, insightHelper) {
      this.timeEngine = timeEngine;
      this.insightHelper = insightHelper;
      this.onManualRefresh = null;
      this.isMounted = false;
      this.lastRenderedSignature = '';
      this.previousNumbers = {
        online: null,
        today: null,
        week: null,
        month: null,
        year: null,
        allTime: null,
      };
    }

    /**
     * Tìm hoặc tạo neo gắn duy nhất #tab6-mod44-traffic-host bên trong Tab 6.
     * @returns {HTMLElement|null}
     */
    resolveHostElement() {
      const doc = globalScope.document;
      if (!doc) return null;

      let host = doc.getElementById(MOD44_CONSTANTS.HOST_ELEMENT_ID);
      if (host) return host;

      const row = doc.getElementById('tab6-top-corners-row');
      if (row) {
        host = doc.createElement('div');
        host.id = MOD44_CONSTANTS.HOST_ELEMENT_ID;
        host.className = 'order-3 sm:col-span-2 lg:order-2 lg:flex-1 lg:min-w-0 lg:max-w-[580px] lg:mx-auto w-full';
        if (row.children && row.children.length >= 2) {
          row.insertBefore(host, row.children[1]);
        } else {
          row.appendChild(host);
        }
        return host;
      }

      const tab6 = doc.querySelector(MOD44_CONSTANTS.FALLBACK_SCREEN_SELECTOR);
      if (tab6) {
        host = doc.createElement('div');
        host.id = MOD44_CONSTANTS.HOST_ELEMENT_ID;
        host.className = 'w-full max-w-[580px] mx-auto my-2';
        tab6.insertBefore(host, tab6.firstChild);
        return host;
      }

      return null;
    }

    /**
     * Đảm bảo chỉ tồn tại duy nhất 1 ô thống kê trong DOM (dọn dẹp mọi bản sao thừa nếu có).
     * @param {HTMLElement} host
     */
    pruneDuplicateBoxes(host) {
      const doc = globalScope.document;
      if (!doc) return;
      const allBoxes = doc.querySelectorAll(`#${MOD44_CONSTANTS.BOX_ELEMENT_ID}`);
      for (let i = 0; i < allBoxes.length; i += 1) {
        const el = allBoxes[i];
        if (!host.contains(el) || i > 0) {
          if (el.parentElement) el.parentElement.removeChild(el);
        }
      }
    }

    /**
     * Tạo khung HTML ban đầu cho duy nhất 1 ô thống kê 6 chỉ số.
     * Chú ý: Các ô con bên trong chỉ dùng rounded-xl (không dùng rounded-2xl) để đảm bảo
     * kiểm tra responsive chuẩn xác ngay cả trên màn hình hẹp 360px hay cột giữa 1024px.
     * @param {boolean} isDark
     * @returns {string}
     */
    buildSingleBoxShellHtml(isDark) {
      const containerTheme = isDark
        ? 'border-cyan-500/45 bg-gradient-to-br from-zinc-950/90 via-slate-950/90 to-cyan-950/40 text-zinc-100 shadow-lg shadow-cyan-950/35'
        : 'border-cyan-500/60 bg-gradient-to-br from-white/95 via-slate-50/95 to-cyan-50/90 text-slate-900 shadow-md shadow-cyan-900/10';

      const headerBorder = isDark ? 'border-cyan-500/25' : 'border-cyan-300/70';
      const titleClass = isDark ? 'text-cyan-300' : 'text-cyan-800';
      const refreshBtnClass = isDark
        ? 'border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-200'
        : 'border-cyan-500/50 bg-cyan-100/80 hover:bg-cyan-200 text-cyan-800';
      const footerClass = isDark ? 'text-zinc-400 border-zinc-800/80' : 'text-slate-600 border-slate-200';

      const cardsHtml = METRIC_CARD_SPECS.map((spec) => {
        const cardPalette = isDark ? spec.accentDark : spec.accentLight;
        const valColor = isDark ? spec.valueClassDark : spec.valueClassLight;
        const dotHtml = spec.isLive
          ? '<span class="relative flex h-2 w-2 shrink-0" aria-hidden="true"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>'
          : `<span aria-hidden="true" class="text-[11px] leading-none shrink-0">${spec.icon}</span>`;

        return `
          <div
            id="${spec.cardId}"
            data-mod44-metric="${spec.key}"
            title="${escapeHtmlSafe(spec.description)}"
            class="px-2 py-1.5 rounded-xl border ${cardPalette} min-w-0 flex flex-col justify-between gap-0.5 transition-all duration-200"
          >
            <div class="flex items-center gap-1 min-w-0">
              ${dotHtml}
              <span class="text-[10px] sm:text-[10.5px] font-bold leading-tight truncate opacity-90">${escapeHtmlSafe(spec.label)}</span>
            </div>
            <div
              id="${spec.valId}"
              class="font-monoCode font-black text-xs sm:text-sm leading-tight tracking-tight ${valColor} tabular-nums truncate"
            >0</div>
          </div>
        `;
      }).join('');

      return `
        <section
          id="${MOD44_CONSTANTS.BOX_ELEMENT_ID}"
          aria-label="Ô Thống Kê Lượt Truy Cập Trang Web"
          aria-live="polite"
          data-mod44-single-box="true"
          data-theme-mode="${isDark ? 'dark' : 'light'}"
          class="w-full rounded-2xl border ${containerTheme} backdrop-blur-md px-2.5 sm:px-3 py-2 sm:py-2.5 space-y-2 transition-colors min-w-0"
        >
          <div class="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b ${headerBorder} min-w-0">
            <div class="flex items-center gap-1.5 min-w-0">
              <span aria-hidden="true" class="text-xs sm:text-sm shrink-0">📊</span>
              <h3 class="text-[11px] sm:text-xs font-black uppercase tracking-wide ${titleClass} truncate">
                Thống Kê Truy Cập Web
              </h3>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                id="mod44-scope-badge"
                data-i18n-ignore="true"
                class="px-2 py-0.5 rounded-full border border-emerald-500/45 bg-emerald-500/15 text-emerald-300 text-[9.5px] font-extrabold leading-tight whitespace-nowrap"
              >🟢 Trực tiếp</span>
              <button
                type="button"
                id="mod44-btn-refresh-traffic"
                title="Làm mới số liệu thống kê truy cập ngay"
                aria-label="Làm mới thống kê truy cập"
                class="px-2 py-0.5 rounded-lg border ${refreshBtnClass} text-[10px] font-extrabold transition cursor-pointer shrink-0"
              >↻ Làm mới</button>
            </div>
          </div>

          <div id="mod44-metrics-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 min-w-0">
            ${cardsHtml}
          </div>

          <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 pt-1 border-t ${footerClass} text-[9.5px] sm:text-[10px] leading-snug min-w-0">
            <span id="mod44-footer-period" data-i18n-ignore="true" class="font-monoCode truncate max-w-full">
              Hôm nay --/--/---- · Tuần --
            </span>
            <span id="mod44-footer-meta" data-i18n-ignore="true" class="font-semibold truncate max-w-full opacity-90">
              Cập nhật --:--:--
            </span>
          </div>
        </section>
      `;
    }

    /**
     * Gắn sự kiện click nút làm mới vào DOM của ô thống kê.
     */
    bindInteractions() {
      const doc = globalScope.document;
      if (!doc) return;
      const refreshBtn = doc.getElementById('mod44-btn-refresh-traffic');
      if (refreshBtn && refreshBtn.dataset.mod44Bound !== '1') {
        refreshBtn.dataset.mod44Bound = '1';
        refreshBtn.addEventListener('click', () => {
          if (typeof this.onManualRefresh === 'function') {
            this.onManualRefresh();
          }
        });
      }
    }

    /**
     * Áp dụng hiệu ứng nháy sáng nhẹ khi giá trị chỉ số thay đổi tăng lên.
     * @param {HTMLElement} valueEl
     * @param {string} key
     * @param {number} nextNum
     */
    pulseIfChanged(valueEl, key, nextNum) {
      const prev = this.previousNumbers[key];
      this.previousNumbers[key] = nextNum;
      if (prev !== null && prev !== nextNum && valueEl && valueEl.animate) {
        try {
          valueEl.animate(
            [
              { transform: 'scale(1)', filter: 'brightness(1)' },
              { transform: 'scale(1.06)', filter: 'brightness(1.28)' },
              { transform: 'scale(1)', filter: 'brightness(1)' },
            ],
            { duration: 360, easing: 'ease-out' }
          );
        } catch (_) {
          // Ignore browsers without WAAPI support
        }
      }
    }

    /**
     * Kết xuất hoặc cập nhật siêu nhẹ (delta DOM patch) toàn bộ số liệu trong ô thống kê.
     * @param {Object} snapshot
     * @returns {boolean}
     */
    render(snapshot, options = {}) {
      if (!snapshot || !snapshot.metrics) return false;
      const host = this.resolveHostElement();
      if (!host) return false;

      const doc = globalScope.document;
      const isDark = this.insightHelper.isDarkThemeActive();
      const existingBox = doc.getElementById(MOD44_CONSTANTS.BOX_ELEMENT_ID);

      if (
        options.forceShellRebuild ||
        !existingBox ||
        !host.contains(existingBox) ||
        existingBox.dataset.themeMode !== (isDark ? 'dark' : 'light')
      ) {
        host.innerHTML = this.buildSingleBoxShellHtml(isDark);
        this.pruneDuplicateBoxes(host);
        this.bindInteractions();
        if (NS.i18n && typeof NS.i18n.translateElement === 'function' && NS.i18n.getLanguage?.() !== 'vi') {
          NS.i18n.translateElement(host);
        }
        this.isMounted = true;
      }

      const tr = (text) =>
        NS.i18n && typeof NS.i18n.translateText === 'function' ? NS.i18n.translateText(text) : text;

      const m = snapshot.metrics;
      for (let i = 0; i < METRIC_CARD_SPECS.length; i += 1) {
        const spec = METRIC_CARD_SPECS[i];
        const rawVal = clampNonNegativeInt(m[spec.key], 0);
        const valEl = doc.getElementById(spec.valId);
        const cardEl = doc.getElementById(spec.cardId);
        const localizedLabel = tr(spec.label);
        if (valEl) {
          const exactStr = this.timeEngine.formatNumber(rawVal, false);
          const compactStr = rawVal >= 100000 ? this.timeEngine.formatNumber(rawVal, true) : exactStr;
          if (valEl.textContent !== compactStr) {
            valEl.textContent = compactStr;
            this.pulseIfChanged(valEl, spec.key, rawVal);
          }
          valEl.title = `${localizedLabel}: ${exactStr}`;
        }
        if (cardEl) {
          const exactStr = this.timeEngine.formatNumber(rawVal, false);
          cardEl.setAttribute('aria-label', `${localizedLabel}: ${exactStr}`);
        }
      }

      const scopeBadge = doc.getElementById('mod44-scope-badge');
      if (scopeBadge) {
        if (snapshot.sourceMode === 'cloud-synced') {
          scopeBadge.textContent = tr('🌐 Đồng bộ toàn cầu');
          scopeBadge.title = tr('Đồng bộ trực tiếp với máy chủ toàn cầu và đa tab cục bộ');
        } else {
          const tabsLabel =
            snapshot.presence && snapshot.presence.activeCount > 1
              ? ` · ${snapshot.presence.activeCount} tab`
              : '';
          scopeBadge.textContent = tr(`🟡 Cục bộ (Ngoại tuyến)${tabsLabel}`);
          scopeBadge.title = tr('Đang đếm cục bộ trên trình duyệt (máy chủ thống kê toàn cầu tạm không phản hồi)');
        }
      }

      const footerPeriod = doc.getElementById('mod44-footer-period');
      if (footerPeriod && snapshot.clock) {
        const rawPeriod = `Hôm nay ${snapshot.clock.displayDate} · Tuần ${String(snapshot.clock.isoWeekNumber).padStart(2, '0')} (${snapshot.clock.yearKey})`;
        footerPeriod.textContent = tr(rawPeriod);
      }

      const footerMeta = doc.getElementById('mod44-footer-meta');
      if (footerMeta && snapshot.clock) {
        const modeTag = snapshot.sourceMode === 'cloud-synced' ? 'Toàn cầu' : 'Cục bộ 2 tầng (GMT+7)';
        footerMeta.textContent = tr(`${modeTag} · Lúc ${snapshot.clock.displayTime}`);
      }

      this.lastRenderedSignature = JSON.stringify({
        metrics: m,
        isDark,
        sourceMode: snapshot.sourceMode,
        dayKey: snapshot.clock ? snapshot.clock.dayKey : '',
        lang: NS.i18n?.getLanguage?.() || 'vi',
      });
      return true;
    }
  }

  /**
   * Bộ điều khiển Trung Tâm Module 44: Quản lý Vòng Đời, Đếm Lượt, Hiện Diện Đa Tab,
   * Chuyển Mốc Nửa Đêm, Tự Bảo Trì & Giao Tiếp Nội Bộ NoirStudio.
   */
  class Mod44SiteTrafficAnalyticsController {
    constructor() {
      this.timeEngine = new Mod44CalendarTimeEngine(
        MOD44_CONSTANTS.TIMEZONE_ID,
        MOD44_CONSTANTS.UTC_OFFSET_MINUTES
      );
      this.rolloverEngine = new Mod44RollingRolloverEngine(this.timeEngine);
      this.storage = new Mod44DualTierLedgerStorage(this.rolloverEngine);
      this.remoteAdapter = new Mod44OptionalRemoteCounterAdapter(this.storage, this.timeEngine);
      this.insightHelper = new Mod44AnalyticsInsightHelper(this.timeEngine);
      this.renderer = new Mod44SingleBoxViewRenderer(this.timeEngine, this.insightHelper);
      this.presence = null;

      this.ledger = this.rolloverEngine.createFreshLedger(Date.now());
      this.presenceSummary = { activeCount: 1, visibleCount: 1, pwaCount: 0, webCount: 1, tabs: {} };
      this.hasInitialized = false;
      this.isInitializing = false;
      this.subscribers = new Set();

      this.rolloverIntervalId = null;
      this.midnightTimerId = null;
      this.themeObserver = null;
      this.boundStorageLedgerHandler = null;
      this.boundScreenChangedHandler = null;
      this.calcSyncDebounceTimerId = null;
      this._pendingRemoteSyncOnDebounce = false;
      this._pendingRenderAfterVisible = false;

      this.renderer.onManualRefresh = () => {
        this.refreshPresence({ forceRemote: true }).catch(() => false);
      };
    }

    /**
     * Khởi tạo toàn bộ Module 44: nạp sổ cái 2 tầng, ghi nhận lượt truy cập phiên mới,
     * bật Presence đa tab, lập lịch chuyển mốc nửa đêm và render ngay ô duy nhất trên Tab 6.
     * @returns {Promise<Object>}
     */
    async init() {
      if (this.hasInitialized) {
        this.renderBox();
        return this.getSnapshot();
      }
      if (this.isInitializing) {
        return this.getSnapshot();
      }
      this.isInitializing = true;

      try {
        const nowMs = Date.now();
        const rawL1 = this.storage.readFromLocalStorage();
        const preIncrementL1AllTime = rawL1 && typeof rawL1 === 'object'
          ? clampNonNegativeInt(
              (rawL1.counts && typeof rawL1.counts === 'object' ? rawL1.counts.allTime : rawL1.allTime),
              0
            )
          : 0;
        this.ledger = this.rolloverEngine.sanitizeAndMigrateLedger(rawL1, nowMs);

        // Khởi động hệ thống đếm người/tab đang truy cập trực tiếp (0ms đồng bộ)
        this.presence = new Mod44LivePresenceCoordinator((summary) => {
          this.handlePresenceUpdate(summary);
        });
        this.presence.start();
        this.presenceSummary = this.presence.summarizePresence();

        // Cập nhật kỷ lục truy cập đồng thời nếu có tab mới mở cùng lúc
        if (this.presenceSummary.activeCount > this.ledger.peakConcurrent) {
          this.ledger.peakConcurrent = this.presenceSummary.activeCount;
          this.ledger.peakConcurrentAt = nowMs;
        }

        // Ghi nhận lượt truy cập đầu phiên ngay lập tức vào L1 LocalStorage (không chặn boot bởi IndexedDB)
        const initBucketDesc = this.timeEngine.getBucketDescriptor(nowMs);
        const justCountedThisSession = !this.storage.hasCountedCurrentSession(nowMs, initBucketDesc.dayKey);
        if (justCountedThisSession) {
          const mode = this.presence ? this.presence.detectRuntimeSurface() : 'WEB';
          this.rolloverEngine.applyIncrement(this.ledger, 1, mode, 'initial_session_entry', nowMs);
          this.storage.markSessionCounted(nowMs, initBucketDesc.dayKey);
          this.storage.writeToLocalStorage(this.ledger);
        } else {
          const rolloverRes = this.rolloverEngine.reconcileRollover(this.ledger, nowMs);
          if (rolloverRes.rolledOver) {
            this.storage.writeToLocalStorage(this.ledger);
          }
        }

        this.bindEnvironmentListeners();
        this.scheduleMidnightBoundaryTimer();

        this.hasInitialized = true;
        this.renderBox();
        this.notifySubscribers('init');

        // Nạp đối chiếu L2 IndexedDB + đồng bộ máy chủ từ xa (nếu cấu hình) hoàn toàn bất đồng bộ ở nền
        this.backgroundSyncPromise = this.hydrateL2AndRemoteAsync({
          justCountedThisSession,
          preIncrementL1AllTime,
          initNowMs: nowMs,
        });

        return this.getSnapshot();
      } finally {
        this.isInitializing = false;
      }
    }

    /**
     * Đối chiếu sổ cái L2 IndexedDB & điểm cuối đám mây ở nền sau khi boot xong
     * để không bao giờ làm chậm cổng kết nối lúc mới mở trang.
     * @param {{ justCountedThisSession: boolean, preIncrementL1AllTime: number, initNowMs: number }} ctx
     * @returns {Promise<void>}
     */
    async hydrateL2AndRemoteAsync(ctx) {
      try {
        const l2 = await this.storage.readFromIndexedDb();
        const l2AllTime = l2 && typeof l2 === 'object'
          ? clampNonNegativeInt(
              (l2.counts && typeof l2.counts === 'object' ? l2.counts.allTime : l2.allTime),
              0
            )
          : 0;
        let ledgerUpdatedFromL2 = false;

        if (l2 && l2AllTime > ctx.preIncrementL1AllTime) {
          const baseFromL2 = this.rolloverEngine.sanitizeAndMigrateLedger(l2, ctx.initNowMs);
          if (ctx.justCountedThisSession) {
            const mode = this.presence ? this.presence.detectRuntimeSurface() : 'WEB';
            this.rolloverEngine.applyIncrement(baseFromL2, 1, mode, 'initial_session_entry_l2_merge', ctx.initNowMs);
          }
          if (this.presenceSummary && this.presenceSummary.activeCount > baseFromL2.peakConcurrent) {
            baseFromL2.peakConcurrent = this.presenceSummary.activeCount;
            baseFromL2.peakConcurrentAt = Date.now();
          }
          this.ledger = baseFromL2;
          ledgerUpdatedFromL2 = true;
        }

        await this.storage.saveLedger(this.ledger);

        const desc = this.timeEngine.getBucketDescriptor(Date.now());
        await this.remoteAdapter.syncWithServer(
          ctx.justCountedThisSession ? 'visit' : 'read',
          desc,
          ctx.justCountedThisSession
        );

        if (this.remoteAdapter.lastRemoteSnapshot) {
          this.raiseLedgerWithRemoteSnapshot(this.remoteAdapter.lastRemoteSnapshot);
          await this.storage.saveLedger(this.ledger);
        }

        if (ledgerUpdatedFromL2 || this.remoteAdapter.lastRemoteSnapshot) {
          this.renderBox();
          this.notifySubscribers('l2_hydrated');
        }
      } catch (_) {
        // Giữ nguyên dữ liệu L1 nếu môi trường khóa IndexedDB (Incognito/sandbox)
      }
    }

    /**
     * Kiểm tra Tab 6 đang hiển thị trên màn hình hay đang ẩn để tránh cập nhật DOM thừa khi gõ ở Tab 1.
     * @returns {boolean}
     */
    isTab6Visible() {
      const doc = globalScope.document;
      if (!doc) return false;
      const screen6 = doc.getElementById('s14-screen-6-system');
      if (!screen6) return true;
      return !screen6.classList.contains('hidden');
    }

    /**
     * Trì hoãn (debounce 500ms) các tác vụ tính toán rollover, lưu sổ cái, đồng bộ server và cập nhật DOM
     * để không bao giờ gây khựng khung hình khi người dùng đang gõ chữ hoặc chuyển nhanh.
     * @param {string} [reason='debounced']
     * @param {{ syncRemote?: boolean, forceRemote?: boolean, saveLedger?: boolean }} [options]
     */
    scheduleDebouncedSyncAndCompute(reason = 'debounced', options = {}) {
      if (options && options.syncRemote) {
        this._pendingRemoteSyncOnDebounce = true;
      }
      if (this.calcSyncDebounceTimerId) {
        globalScope.clearTimeout(this.calcSyncDebounceTimerId);
        this.calcSyncDebounceTimerId = null;
      }
      const delayMs = MOD44_CONSTANTS.TIMINGS.CALC_SYNC_DEBOUNCE_MS || 500;
      this.calcSyncDebounceTimerId = globalScope.setTimeout(async () => {
        this.calcSyncDebounceTimerId = null;
        const shouldSyncRemote = this._pendingRemoteSyncOnDebounce;
        this._pendingRemoteSyncOnDebounce = false;
        try {
          const nowMs = Date.now();
          const res = this.rolloverEngine.reconcileRollover(this.ledger, nowMs);
          if (res.rolledOver || (options && options.saveLedger)) {
            await this.storage.saveLedger(this.ledger);
          }
          if (shouldSyncRemote) {
            const desc = this.timeEngine.getBucketDescriptor(nowMs);
            await this.remoteAdapter.syncWithServer(
              'heartbeat',
              desc,
              Boolean(options && options.forceRemote)
            );
            if (this.remoteAdapter.lastRemoteSnapshot && this.raiseLedgerWithRemoteSnapshot(this.remoteAdapter.lastRemoteSnapshot)) {
              await this.storage.saveLedger(this.ledger);
            }
          }
          if (this.isTab6Visible() || !this.renderer.isMounted) {
            this.renderBox();
          } else {
            this._pendingRenderAfterVisible = true;
          }
          this.notifySubscribers(reason);
        } catch (_) {
          // Bảo toàn luồng chính nếu có lỗi mạng/bộ nhớ nền
        }
      }, delayMs);
    }

    /**
     * Xử lý sự kiện cập nhật từ Mod44LivePresenceCoordinator (có debounce 500ms).
     * @param {Object} summary
     */
    handlePresenceUpdate(summary) {
      if (!summary || typeof summary !== 'object') return;
      this.presenceSummary = summary;
      let peakChanged = false;
      if (summary.activeCount > this.ledger.peakConcurrent) {
        this.ledger.peakConcurrent = summary.activeCount;
        this.ledger.peakConcurrentAt = Date.now();
        peakChanged = true;
      }
      this.scheduleDebouncedSyncAndCompute('presence', { saveLedger: peakChanged });
    }

    /**
     * Gắn các trình lắng nghe sự kiện chuyển tab, thay đổi LocalStorage chéo tab,
     * thay đổi theme sáng/tối và kiểm tra rollover định kỳ.
     */
    bindEnvironmentListeners() {
      this.boundStorageLedgerHandler = (evt) => {
        if (!evt || evt.key !== MOD44_CONSTANTS.STORAGE_KEYS.LEDGER || !evt.newValue) return;
        try {
          const parsed = JSON.parse(evt.newValue);
          this.ledger = this.rolloverEngine.pickRicherLedger(this.ledger, parsed, Date.now());
          this.scheduleDebouncedSyncAndCompute('storage_sync');
        } catch (_) {
          // Bỏ qua chuỗi JSON hỏng
        }
      };
      globalScope.addEventListener('storage', this.boundStorageLedgerHandler);

      this.boundScreenChangedHandler = (evt) => {
        const nextScreen =
          (evt && evt.detail && (evt.detail.screenKey || evt.detail.nextScreen)) ||
          (globalScope.document && globalScope.document.body && globalScope.document.body.dataset.s14Screen);
        if (nextScreen === 'SCREEN_6_SYSTEM') {
          this.onScreenActivated();
        }
      };
      if (globalScope.document) {
        globalScope.document.addEventListener('noir:s14-screen-changed', this.boundScreenChangedHandler);
        globalScope.document.addEventListener('click', (evt) => {
          const tabBtn = evt && evt.target && evt.target.closest ? evt.target.closest('[data-s14-tab="SCREEN_6_SYSTEM"]') : null;
          if (tabBtn) {
            this.scheduleDebouncedSyncAndCompute('tab6_click');
          }
        });
      }

      if (NS.bus && typeof NS.bus.on === 'function') {
        try {
          NS.bus.on('navigation:screenChanged', (payload) => {
            if (payload && payload.to === 'SCREEN_6_SYSTEM') {
              this.onScreenActivated();
            }
          });
          NS.bus.on('i18n:changed', () => {
            this.renderBox({ forceShellRebuild: true });
          });
        } catch (_) {
          // Ignore bus differences
        }
      }
      if (typeof globalScope.addEventListener === 'function' && !this._noirI18nWinBound) {
        this._noirI18nWinBound = true;
        globalScope.addEventListener('noir:i18n:changed', () => {
          this.renderBox({ forceShellRebuild: true });
        });
      }

      // Quan sát thay đổi theme Light/Dark (debounce 500ms để không render liên tục)
      if (typeof globalScope.MutationObserver === 'function' && globalScope.document && globalScope.document.documentElement) {
        try {
          this.themeObserver = new globalScope.MutationObserver(() => {
            this.scheduleDebouncedSyncAndCompute('theme');
          });
          this.themeObserver.observe(globalScope.document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme'],
          });
        } catch (_) {
          this.themeObserver = null;
        }
      }

      // Định kỳ kiểm tra chuyển ngày/tuần/tháng/năm
      this.rolloverIntervalId = globalScope.setInterval(() => {
        const nowMs = Date.now();
        const res = this.rolloverEngine.reconcileRollover(this.ledger, nowMs);
        if (res.rolledOver) {
          this.scheduleDebouncedSyncAndCompute('rollover', { saveLedger: true });
        }
      }, MOD44_CONSTANTS.TIMINGS.ROLLOVER_CHECK_INTERVAL_MS);
    }

    /**
     * Hẹn giờ chính xác tới mốc 00:00:02 giờ Việt Nam để tự động chuyển ngày mới ngay lập tức.
     */
    scheduleMidnightBoundaryTimer() {
      if (this.midnightTimerId) {
        globalScope.clearTimeout(this.midnightTimerId);
        this.midnightTimerId = null;
      }
      const waitMs = Math.min(86405000, this.timeEngine.getMsUntilNextDayBoundary(Date.now()));
      this.midnightTimerId = globalScope.setTimeout(() => {
        const nowMs = Date.now();
        const res = this.rolloverEngine.reconcileRollover(this.ledger, nowMs);
        if (res.rolledOver) {
          this.storage.saveLedger(this.ledger).catch(() => false);
        }
        this.renderBox();
        this.notifySubscribers('midnight_rollover');
        this.scheduleMidnightBoundaryTimer();
      }, waitMs);
    }

    /**
     * Được gọi khi người dùng mở Tab 6 để đảm bảo số liệu, mốc thời gian và trạng thái online tươi nhất (có debounce 500ms).
     */
    onScreenActivated() {
      if (this._pendingRenderAfterVisible || !this.renderer.isMounted) {
        this._pendingRenderAfterVisible = false;
        this.renderBox();
      }
      this.scheduleDebouncedSyncAndCompute('tab6_open', { syncRemote: false });
    }

    /**
     * Ghi nhận +delta lượt truy cập mới vào sổ cái, lưu 2 tầng và đẩy sync lên cloud (nếu cấu hình).
     * @param {string} [reason='manual_visit']
     * @param {number} [delta=1]
     * @returns {Promise<Object>}
     */
    async recordVisit(reason = 'session_visit', delta = 1) {
      const nowMs = Date.now();
      const mode = this.presence ? this.presence.detectRuntimeSurface() : 'WEB';
      const visitDesc = this.timeEngine.getBucketDescriptor(nowMs);
      this.rolloverEngine.applyIncrement(this.ledger, delta, mode, reason, nowMs);
      this.storage.markSessionCounted(nowMs, visitDesc.dayKey);
      await this.storage.saveLedger(this.ledger);

      await this.remoteAdapter.syncWithServer('visit', visitDesc, true);

      this.renderBox();
      this.notifySubscribers('visit_recorded');
      return this.getSnapshot();
    }

    /**
     * Làm mới tức thì bộ đếm người đang truy cập và kiểm tra rollover / đồng bộ máy chủ.
     * @param {{ forceRemote?: boolean }} [options]
     * @returns {Promise<Object>}
     */
    async refreshPresence(options = {}) {
      const nowMs = Date.now();
      const rolloverRes = this.rolloverEngine.reconcileRollover(this.ledger, nowMs);
      if (rolloverRes.rolledOver) {
        await this.storage.saveLedger(this.ledger);
      }
      if (this.presence) {
        this.presenceSummary = this.presence.beat('manual_refresh');
      }
      const desc = this.timeEngine.getBucketDescriptor(nowMs);
      await this.remoteAdapter.syncWithServer('heartbeat', desc, Boolean(options && options.forceRemote));

      this.renderBox();
      this.notifySubscribers('refresh');
      return this.getSnapshot();
    }

    /**
     * Kết xuất lại duy nhất 1 ô thống kê trên Tab 6 dựa trên snapshot mới nhất.
     * @returns {boolean}
     */
    renderBox(options = {}) {
      const snapshot = this.getSnapshot();
      const rendered = this.renderer.render(snapshot, options);
      if (rendered) {
        this._pendingRenderAfterVisible = false;
        if (NS.i18n?.getLanguage?.() && NS.i18n.getLanguage() !== 'vi') {
          const boxEl = globalScope.document?.getElementById(MOD44_CONSTANTS.BOX_ELEMENT_ID);
          if (boxEl) NS.i18n.translateElement?.(boxEl);
        }
      }
      return rendered;
    }

    /**
     * Trả về ảnh chụp toàn bộ trạng thái chỉ số, chu kỳ thời gian và phân tích lịch sử.
     * @returns {Object}
     */
    raiseLedgerWithRemoteSnapshot(snap) {
      if (!snap || typeof snap !== 'object' || !this.ledger || !this.ledger.counts) return false;
      const c = this.ledger.counts;
      const prevAll = c.allTime;
      const prevToday = c.today;
      c.today = Math.max(c.today || 0, clampNonNegativeInt(snap.today, 0));
      c.week = Math.max(c.week || 0, c.today, clampNonNegativeInt(snap.week, 0));
      c.month = Math.max(c.month || 0, c.today, clampNonNegativeInt(snap.month, 0));
      c.year = Math.max(c.year || 0, c.month, clampNonNegativeInt(snap.year, 0));
      c.allTime = Math.max(c.allTime || 0, c.year, c.week, clampNonNegativeInt(snap.allTime, 0));
      return c.allTime > prevAll || c.today > prevToday;
    }

    getSnapshot() {
      const nowMs = Date.now();
      this.rolloverEngine.reconcileRollover(this.ledger, nowMs);
      const clock = this.timeEngine.getBucketDescriptor(nowMs);

      const minActiveVisit = this.hasInitialized ? 1 : 0;
      const localToday = Math.max(minActiveVisit, clampNonNegativeInt(this.ledger.counts.today, 0));
      const localWeek = Math.max(localToday, clampNonNegativeInt(this.ledger.counts.week, 0));
      const localMonth = Math.max(localToday, clampNonNegativeInt(this.ledger.counts.month, 0));
      const localYear = Math.max(localMonth, clampNonNegativeInt(this.ledger.counts.year, 0));
      const localAll = Math.max(localYear, localWeek, clampNonNegativeInt(this.ledger.counts.allTime, 0));

      const localMetrics = {
        online: Math.max(1, clampNonNegativeInt(this.presenceSummary?.activeCount, 1)),
        today: localToday,
        week: localWeek,
        month: localMonth,
        year: localYear,
        allTime: localAll,
      };

      const merged = this.remoteAdapter.mergeWithLocal(localMetrics);
      const trends = this.insightHelper.computeTrendSummary(this.ledger);

      return {
        moduleVersion: MOD44_CONSTANTS.MODULE_VERSION,
        timeZone: MOD44_CONSTANTS.TIMEZONE_ID,
        clock,
        metrics: merged.metrics,
        localMetrics,
        sourceMode: merged.sourceMode,
        presence: {
          activeCount: this.presenceSummary ? this.presenceSummary.activeCount : 1,
          visibleCount: this.presenceSummary ? this.presenceSummary.visibleCount : 1,
          pwaCount: this.presenceSummary ? this.presenceSummary.pwaCount : 0,
          webCount: this.presenceSummary ? this.presenceSummary.webCount : 1,
        },
        trends,
        storageTiers: Object.assign({}, this.storage.lastStorageTierReport),
        remoteStatus: this.remoteAdapter.evaluateEligibility().reason,
        hasInitialized: this.hasInitialized,
        singleBoxMounted: Boolean(
          globalScope.document && globalScope.document.getElementById(MOD44_CONSTANTS.BOX_ELEMENT_ID)
        ),
      };
    }

    /**
     * Cấu hình điểm cuối máy chủ từ xa để đếm lượt truy cập toàn cầu thực tế khi triển khai web công khai.
     * @param {{ url?: string, namespace?: string, mode?: 'merge_max'|'server_authoritative' }} cfg
     * @returns {Promise<Object>}
     */
    async configureEndpoint(cfg) {
      const saved = this.storage.saveRemoteConfig(cfg || {});
      await this.refreshPresence({ forceRemote: true });
      return {
        config: saved,
        snapshot: this.getSnapshot(),
      };
    }

    /**
     * Tạo bản báo cáo văn bản đọc được cho các công cụ xuất / kiểm tra.
     * @returns {string}
     */
    exportReportText() {
      return this.insightHelper.formatPlainTextReport(this.getSnapshot());
    }

    /**
     * Mô phỏng thao tác reset bộ đếm cục bộ khi người dùng hoặc bộ test cần đưa số liệu về 1 phiên sạch.
     * @returns {Promise<Object>}
     */
    async resetLocalMetrics() {
      const nowMs = Date.now();
      this.ledger = this.rolloverEngine.createFreshLedger(nowMs);
      this.rolloverEngine.applyIncrement(
        this.ledger,
        1,
        this.presence ? this.presence.detectRuntimeSurface() : 'WEB',
        'reset_reinit',
        nowMs
      );
      this.storage.markSessionCounted(nowMs);
      await this.storage.saveLedger(this.ledger);
      this.renderBox();
      this.notifySubscribers('reset');
      return this.getSnapshot();
    }

    /**
     * Đăng ký lắng nghe mỗi khi số liệu thống kê cập nhật.
     * @param {Function} callback
     * @returns {Function} Hàm hủy đăng ký
     */
    subscribe(callback) {
      if (typeof callback !== 'function') return () => {};
      this.subscribers.add(callback);
      return () => {
        this.subscribers.delete(callback);
      };
    }

    /**
     * Thông báo cho toàn bộ subscriber kèm ảnh chụp mới nhất.
     * @param {string} eventType
     */
    notifySubscribers(eventType) {
      if (this.subscribers.size === 0) return;
      const snapshot = this.getSnapshot();
      this.subscribers.forEach((fn) => {
        try {
          fn(snapshot, eventType);
        } catch (_) {
          // Không để lỗi ở subscriber làm hỏng bộ đếm chính
        }
      });
    }

    /**
     * Tự kiểm tra toàn bộ bất biến dữ liệu, DOM đơn ô và khả năng tính lịch chính xác của Mod 44.
     * Được gọi bởi Module 30 Master Bootloader & Integrity Guard.
     * @returns {Object}
     */
    selfInspect() {
      const doc = globalScope.document;
      const boxEls = doc ? doc.querySelectorAll(`#${MOD44_CONSTANTS.BOX_ELEMENT_ID}`) : [];
      const hostEl = doc ? doc.getElementById(MOD44_CONSTANTS.HOST_ELEMENT_ID) : null;
      const metricIdsPresent = METRIC_CARD_SPECS.every((s) => Boolean(doc && doc.getElementById(s.valId)));

      const snapshot = this.getSnapshot();
      const m = snapshot.metrics;
      const invariantsOk =
        m.online >= 1 &&
        m.week >= m.today &&
        m.year >= m.month &&
        m.allTime >= m.year &&
        m.allTime >= m.week &&
        m.allTime >= m.month &&
        m.allTime >= m.today;

      // Tự kiểm tra hàm tính tuần ISO ở mốc giao thừa lịch sử (2025-12-29 là 2026-W01)
      const isoSample = this.timeEngine.computeIsoWeekInfo(2025, 12, 29);
      const calendarMathOk = isoSample.weekKey === '2026-W01' && this.timeEngine.isLeapYear(2024) && !this.timeEngine.isLeapYear(2100);

      const singleBoxOnly = boxEls.length === 1;
      const ok = Boolean(this.hasInitialized && hostEl && singleBoxOnly && metricIdsPresent && invariantsOk && calendarMathOk);

      return {
        module: MOD44_CONSTANTS.MODULE_ID,
        version: MOD44_CONSTANTS.MODULE_VERSION,
        ok,
        hasInitialized: this.hasInitialized,
        hostMounted: Boolean(hostEl),
        singleBoxCount: boxEls.length,
        metricIdsPresent,
        invariantsOk,
        calendarMathOk,
        metrics: m,
        sourceMode: snapshot.sourceMode,
      };
    }

    /**
     * Hủy toàn bộ bộ hẹn giờ và trình lắng nghe khi dọn dẹp vòng đời ứng dụng.
     */
    destroy() {
      if (this.rolloverIntervalId) {
        globalScope.clearInterval(this.rolloverIntervalId);
        this.rolloverIntervalId = null;
      }
      if (this.midnightTimerId) {
        globalScope.clearTimeout(this.midnightTimerId);
        this.midnightTimerId = null;
      }
      if (this.themeObserver) {
        try {
          this.themeObserver.disconnect();
        } catch (_) {
          // Ignore
        }
        this.themeObserver = null;
      }
      if (this.boundStorageLedgerHandler) {
        globalScope.removeEventListener('storage', this.boundStorageLedgerHandler);
        this.boundStorageLedgerHandler = null;
      }
      if (this.boundScreenChangedHandler && globalScope.document) {
        globalScope.document.removeEventListener('noir:s14-screen-changed', this.boundScreenChangedHandler);
        this.boundScreenChangedHandler = null;
      }
      if (this.presence) {
        this.presence.destroy();
        this.presence = null;
      }
      this.subscribers.clear();
    }
  }

  /**
   * Bộ trợ giúp Kiểm Định Lịch Sử & Đối Chiếu Tuần/Tháng/Năm Bổ Sung cho Mod 44.
   * Cung cấp các hàm tính toán chuỗi ngày 7 ngày gần nhất, so sánh tỷ lệ tăng trưởng
   * theo ngày/tuần/tháng/năm và xuất cấu trúc dữ liệu phục vụ thống kê nâng cao khi cần.
   */
  class Mod44PeriodComparisonAnalyzer {
    /**
     * @param {Mod44CalendarTimeEngine} timeEngine
     */
    constructor(timeEngine) {
      this.timeEngine = timeEngine;
    }

    /**
     * Lùi lịch dương đi offsetDays ngày (tính chính xác qua ranh giới tháng/năm nhuận).
     * @param {number} year
     * @param {number} month
     * @param {number} day
     * @param {number} offsetDays
     * @returns {{ year: number, month: number, day: number, dayKey: string }}
     */
    shiftCalendarDate(year, month, day, offsetDays) {
      const utc = new Date(Date.UTC(year, month - 1, day + offsetDays, 12, 0, 0));
      const y = utc.getUTCFullYear();
      const m = utc.getUTCMonth() + 1;
      const d = utc.getUTCDate();
      return {
        year: y,
        month: m,
        day: d,
        dayKey: `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      };
    }

    /**
     * Lấy mảng 7 ngày liên tiếp kết thúc vào hôm nay (kèm số lượt từng ngày từ ledger).
     * @param {Object} ledger
     * @param {number} [nowMs=Date.now()]
     * @returns {Array<{ dayKey: string, visits: number, isToday: boolean }>}
     */
    buildTrailingSevenDaysSeries(ledger, nowMs = Date.now()) {
      const desc = this.timeEngine.getBucketDescriptor(nowMs);
      const p = desc.parts;
      const series = [];
      const archive = ledger && ledger.dailyArchive ? ledger.dailyArchive : {};
      for (let i = 6; i >= 0; i -= 1) {
        const shifted = this.shiftCalendarDate(p.year, p.month, p.day, -i);
        const isToday = shifted.dayKey === desc.dayKey;
        const val = isToday
          ? clampNonNegativeInt(ledger?.counts?.today, 0)
          : clampNonNegativeInt(archive[shifted.dayKey], 0);
        series.push({
          dayKey: shifted.dayKey,
          visits: val,
          isToday,
        });
      }
      return series;
    }

    /**
     * Tính tỷ lệ phần trăm thay đổi giữa hôm nay và hôm qua (an toàn khi mẫu số = 0).
     * @param {Object} ledger
     * @param {number} [nowMs=Date.now()]
     * @returns {{ today: number, yesterday: number, delta: number, pctText: string }}
     */
    compareTodayVsYesterday(ledger, nowMs = Date.now()) {
      const desc = this.timeEngine.getBucketDescriptor(nowMs);
      const yest = this.shiftCalendarDate(desc.parts.year, desc.parts.month, desc.parts.day, -1);
      const todayVal = clampNonNegativeInt(ledger?.counts?.today, 0);
      const yestVal = clampNonNegativeInt(ledger?.dailyArchive?.[yest.dayKey], 0);
      const delta = todayVal - yestVal;
      let pctText = '+0%';
      if (yestVal === 0 && todayVal > 0) {
        pctText = '+100%';
      } else if (yestVal > 0) {
        const pct = Math.round((delta / yestVal) * 100);
        pctText = `${pct >= 0 ? '+' : ''}${pct}%`;
      }
      return {
        today: todayVal,
        yesterday: yestVal,
        delta,
        pctText,
      };
    }

    /**
     * Lấy danh sách thống kê các tháng gần nhất (tối đa maxMonths tháng).
     * @param {Object} ledger
     * @param {number} [maxMonths=6]
     * @returns {Array<{ monthKey: string, visits: number, isCurrentMonth: boolean }>}
     */
    buildRecentMonthsSummary(ledger, maxMonths = 6) {
      const archive = ledger && ledger.monthlyArchive ? ledger.monthlyArchive : {};
      const activeMonth = ledger && ledger.activeMonthKey ? ledger.activeMonthKey : '';
      const keysSet = new Set(Object.keys(archive));
      if (activeMonth) keysSet.add(activeMonth);
      const sorted = Array.from(keysSet).sort().slice(-Math.max(1, maxMonths));
      return sorted.map((mk) => ({
        monthKey: mk,
        visits:
          mk === activeMonth
            ? clampNonNegativeInt(ledger?.counts?.month, 0)
            : clampNonNegativeInt(archive[mk], 0),
        isCurrentMonth: mk === activeMonth,
      }));
    }

    /**
     * Tính phân phối lượt truy cập gần đây giữa chế độ Web thường và App PWA Độc lập.
     * @param {Object} ledger
     * @returns {{ webVisits: number, pwaVisits: number, totalRecent: number }}
     */
    summarizeRecentSurfaceSplit(ledger) {
      const list = Array.isArray(ledger?.recentVisits) ? ledger.recentVisits : [];
      let webVisits = 0;
      let pwaVisits = 0;
      for (let i = 0; i < list.length; i += 1) {
        if (list[i] && list[i].mode === 'PWA') pwaVisits += 1;
        else webVisits += 1;
      }
      return {
        webVisits,
        pwaVisits,
        totalRecent: webVisits + pwaVisits,
      };
    }
  }

  // Khởi tạo thể hiện chuẩn và gắn vào không gian tên NoirStudio
  const trafficController = new Mod44SiteTrafficAnalyticsController();
  const periodAnalyzer = new Mod44PeriodComparisonAnalyzer(trafficController.timeEngine);
  trafficController.periodAnalyzer = periodAnalyzer;

  NS.siteTrafficAnalytics = trafficController;
  NS.modules = NS.modules || {};
  NS.modules.mod44 = trafficController;

  // Khi DOM đã sẵn sàng (hoặc Script tải sau DOMContentLoaded), vẽ trước vỏ bảo đảm hiển thị tức thời
  if (globalScope.document && globalScope.document.readyState !== 'loading') {
    trafficController.renderBox();
  } else if (globalScope.document) {
    globalScope.document.addEventListener(
      'DOMContentLoaded',
      () => {
        trafficController.renderBox();
      },
      { once: true }
    );
  }
})(typeof window !== 'undefined' ? window : globalThis);
