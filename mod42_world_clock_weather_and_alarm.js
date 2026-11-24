/**
 * MODULE 42: KHUNG GIỜ QUỐC TẾ, ĐỊNH DẠNG NGÀY GIỜ, XEM THỜI TIẾT & BÁO THỨC MP3/HỆ THỐNG
 * -----------------------------------------------------------------------------------------
 * - Gắn đồng hồ thời gian thực ngay bên dưới tiêu đề "Web viết tiểu thuyết của Bi"
 *   + Dòng 1 thời gian thực: DD/MM/YYYY HH:mm:ss, GMT +7 (Giờ Hà Nội) (tùy biến theo múi giờ & định dạng)
 *   + Dòng 2 bôi đậm gạch chân: "Bấm vào đây để chỉnh múi giờ, đặt báo thức và xem thời tiết"
 * - Mở cửa sổ chuyên biệt có nút X góc trên bên phải để đóng/mở tự do:
 *   1) Chỉnh múi giờ quốc tế (GMT -12 -> GMT +14 + 40+ thành phố tiêu biểu) & định dạng ngày giờ
 *   2) Bảng đối chiếu giờ quốc tế đa thành phố
 *   3) Xem thời tiết theo khu vực / tìm thành phố (Open-Meteo public API + mô phỏng ngoại tuyến khi mất mạng)
 *   4) Hệ thống báo thức theo mốc giờ:phút[:giây] (giây không nhập tự động mặc định :00),
 *      hỗ trợ 6 chuông mặc định hệ thống (WebAudio) hoặc file .MP3 tự chọn (IndexedDB / lấy từ Tab 5)
 *
 * File: mod42_world_clock_weather_and_alarm.js
 * Namespace: window.NoirStudio.worldClockStudio
 */
(function (global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});
  const MODULE_ID = 'mod42_worldClockStudio';
  const STORAGE_KEY = 'noir_v36_mod42_clock_weather_alarm_v1';
  const MODAL_ID = 'mod42-clock-weather-modal';
  const CLOSE_BTN_ID = 'mod42-btn-close-modal';
  const HEADER_CLOCK_ID = 'mod42-header-live-clock';
  const HEADER_TRIGGER_ID = 'mod42-open-modal-link';
  const HEADER_DOCK_ID = 'mod42-header-clock-dock';
  const RINGING_BANNER_ID = 'mod42-floating-ringing-banner';

  const IDB_NAME = 'NoirMod42AlarmAudioDB';
  const IDB_VERSION = 1;
  const IDB_STORE = 'custom_ringtones';
  const IDB_RECORD_KEY = 'active_custom_mp3';

  const OPEN_METEO_FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
  const OPEN_METEO_GEOCODE_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

  const VIETNAMESE_WEEKDAYS_LONG = Object.freeze([
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ]);

  const VIETNAMESE_WEEKDAYS_SHORT = Object.freeze(['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']);

  const ENGLISH_WEEKDAYS_SHORT = Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const ENGLISH_MONTHS_SHORT = Object.freeze([
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]);

  /**
   * Danh mục định dạng ngày giờ hỗ trợ hiển thị trên Header & Cửa sổ Module 42.
   */
  const DATE_FORMAT_CATALOG = Object.freeze([
    {
      id: 'DMY_HMS',
      label: 'Chuẩn Việt Nam 24h (DD/MM/YYYY HH:mm:ss, GMT +X)',
      example: '14/11/2026 08:20:11, GMT +7 (Giờ Hà Nội)',
      description: 'Định dạng mặc định rõ ràng: ngày/tháng/năm + giờ:phút:giây + múi giờ.',
    },
    {
      id: 'DMY_HMS_12H',
      label: 'Việt Nam 12h Sáng/Chiều (DD/MM/YYYY hh:mm:ss SA/CH)',
      example: '14/11/2026 08:20:11 SA, GMT +7 (Giờ Hà Nội)',
      description: 'Hiển thị SA (Sáng) / CH (Chiều) dễ đọc theo thói quen sinh hoạt.',
    },
    {
      id: 'YMD_HMS',
      label: 'Chuẩn Quốc Tế ISO (YYYY-MM-DD HH:mm:ss)',
      example: '2026-11-14 08:20:11, GMT +7 (Giờ Hà Nội)',
      description: 'Thuận tiện đối chiếu log chương truyện và ngày xuất bản quốc tế.',
    },
    {
      id: 'FULL_VI',
      label: 'Thứ Ngày Tháng Tiếng Việt Đầy Đủ',
      example: 'Thứ Bảy, 14/11/2026 08:20:11, GMT +7 (Giờ Hà Nội)',
      description: 'Kèm tên thứ trong tuần giúp canh lịch đăng chương cố định.',
    },
    {
      id: 'FULL_EN',
      label: 'Tiếng Anh Quốc Tế (Weekday, Mon DD YYYY)',
      example: 'Sat, Nov 14, 2026 08:20:11, GMT +7 (Giờ Hà Nội)',
      description: 'Phù hợp khi đối chiếu lịch phát hành nền tảng đọc tiếng Anh.',
    },
    {
      id: 'MDY_HMS_12H',
      label: 'Chuẩn Bắc Mỹ 12h AM/PM (MM/DD/YYYY hh:mm:ss AM)',
      example: '11/14/2026 08:20:11 AM, GMT +7 (Giờ Hà Nội)',
      description: 'Tháng trước ngày sau kèm AM/PM theo chuẩn Hoa Kỳ & Canada.',
    },
    {
      id: 'YMD_SLASH_HMS',
      label: 'Chuẩn Đông Á 24h (YYYY/MM/DD HH:mm:ss)',
      example: '2026/11/14 08:20:11, GMT +7 (Giờ Hà Nội)',
      description: 'Năm/Tháng/Ngày thông dụng tại Trung Quốc, Đài Loan và Nhật Bản.',
    },
    {
      id: 'YMD_DOT_HMS',
      label: 'Chuẩn Hàn Quốc 24h (YYYY.MM.DD HH:mm:ss)',
      example: '2026.11.14 08:20:11, GMT +7 (Giờ Hà Nội)',
      description: 'Định dạng dấu chấm Năm.Tháng.Ngày chuẩn Hàn Quốc.',
    },
    {
      id: 'COMPACT_HMS',
      label: 'Thu Gọn Tối Giản (DD/MM HH:mm:ss · GMT +X)',
      example: '14/11 08:20:11, GMT +7 (Giờ Hà Nội)',
      description: 'Tiết kiệm chiều ngang tối đa trên thanh đầu trang điện thoại.',
    },
  ]);

  const MOD42_WEEKDAY_DTF_CACHE = Object.create(null);

  function formatLocalizedWeekdayName(parts, langCode) {
    if (!langCode || langCode === 'vi' || typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
      return VIETNAMESE_WEEKDAYS_LONG[parts.weekdayIndex] || '';
    }
    try {
      const intlLocale = NS.i18n?.getIntlLocale?.(langCode) || langCode;
      if (!MOD42_WEEKDAY_DTF_CACHE[intlLocale]) {
        MOD42_WEEKDAY_DTF_CACHE[intlLocale] = new Intl.DateTimeFormat(intlLocale, {
          weekday: 'long',
          timeZone: 'UTC',
        });
      }
      const refUtc = new Date(Date.UTC(parts.year, Math.max(0, parts.month - 1), parts.day, 12, 0, 0));
      return MOD42_WEEKDAY_DTF_CACHE[intlLocale].format(refUtc);
    } catch (_err) {
      return ENGLISH_WEEKDAYS_SHORT[parts.weekdayIndex] || '';
    }
  }

  function localizeZoneLabelText(rawZoneLabel) {
    const lang = NS.i18n?.getLanguage?.() || 'vi';
    if (!lang || lang === 'vi') return rawZoneLabel;
    if (typeof NS.i18n?.formatZoneDisplayName === 'function') {
      return NS.i18n.formatZoneDisplayName(rawZoneLabel, lang);
    }
    return rawZoneLabel;
  }

  function formatLocalizedHeroDateLine(parts) {
    const lang = NS.i18n?.getLanguage?.() || 'vi';
    if (!lang || lang === 'vi') {
      return `${VIETNAMESE_WEEKDAYS_LONG[parts.weekdayIndex]}, ${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
    }
    const weekday = formatLocalizedWeekdayName(parts, lang);
    const dateStr =
      typeof NS.i18n?.formatDate === 'function'
        ? NS.i18n.formatDate({ year: parts.year, month: parts.month, day: parts.day }, lang)
        : `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
    return `${weekday}, ${dateStr}`;
  }

  function formatLocalizedZonedClockString(parts, formatId) {
    const lang = NS.i18n?.getLanguage?.() || 'vi';
    const localizedParts = {
      ...parts,
      zoneLabel: localizeZoneLabelText(parts.zoneLabel),
    };
    const yyyy = String(localizedParts.year).padStart(4, '0');
    const mm = pad2(localizedParts.month);
    const dd = pad2(localizedParts.day);
    const hh = pad2(localizedParts.hour);
    const mi = pad2(localizedParts.minute);
    const ss = pad2(localizedParts.second);

    if (formatId === 'YMD_SLASH_HMS') {
      return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}, ${localizedParts.gmtText} (${localizedParts.zoneLabel})`;
    }
    if (formatId === 'YMD_DOT_HMS') {
      return `${yyyy}.${mm}.${dd} ${hh}:${mi}:${ss}, ${localizedParts.gmtText} (${localizedParts.zoneLabel})`;
    }
    if (formatId === 'MDY_HMS_12H') {
      const h12 = pad2(localizedParts.hour % 12 || 12);
      const cfg = NS.i18n?.getLocaleConfig?.(lang);
      const ampm = localizedParts.hour >= 12 ? (cfg?.pmLabel || 'PM') : (cfg?.amLabel || 'AM');
      return `${mm}/${dd}/${yyyy} ${h12}:${mi}:${ss} ${ampm}, ${localizedParts.gmtText} (${localizedParts.zoneLabel})`;
    }
    if (formatId === 'COMPACT_HMS' && lang !== 'vi') {
      const md =
        typeof NS.i18n?.formatMonthDay === 'function'
          ? NS.i18n.formatMonthDay({ year: localizedParts.year, month: localizedParts.month, day: localizedParts.day }, lang)
          : `${dd}/${mm}`;
      return `${md} ${hh}:${mi}:${ss}, ${localizedParts.gmtText} (${localizedParts.zoneLabel})`;
    }
    return formatZonedClockString(localizedParts, formatId);
  }

  function formatLocalizedWeatherDayLabel(rawDayLabel) {
    const label = String(rawDayLabel || '').trim();
    const lang = NS.i18n?.getLanguage?.() || 'vi';
    if (!lang || lang === 'vi' || !label) return label;
    if (label === 'Hôm nay') {
      return NS.i18n?.formatTodayLabel?.(lang) || 'Today';
    }
    const m = label.match(/^(CN|T[2-7])\s+(\d{1,2})\/(\d{1,2})$/);
    if (m) {
      const wdIdxMap = { CN: 0, T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6 };
      const idx = wdIdxMap[m[1]] ?? 0;
      const cfg = NS.i18n?.getLocaleConfig?.(lang);
      const wdName = (cfg?.weekdayShort && cfg.weekdayShort[idx]) || m[1];
      const dd = pad2(Number(m[2]));
      const mm = pad2(Number(m[3]));
      const md =
        cfg?.monthDayOrder === 'MD'
          ? `${mm}${cfg.monthDaySep || '/'}${dd}`
          : `${dd}${cfg?.monthDaySep || '/'}${mm}`;
      return `${wdName} ${md}`;
    }
    return NS.i18n?.translateText?.(label, lang) || label;
  }

  /**
   * Danh mục múi giờ & thành phố quốc tế (GMT -11 đến GMT +14).
   * Mỗi múi giờ chứa thông số tọa độ để đồng bộ thẳng sang Weather Engine.
   */
  const INTERNATIONAL_TIMEZONE_CATALOG = Object.freeze([
    {
      id: 'vn_hanoi',
      iana: 'Asia/Ho_Chi_Minh',
      labelVi: 'Giờ Hà Nội',
      cityVi: 'Hà Nội',
      countryVi: 'Việt Nam',
      region: 'Asia',
      flag: '🇻🇳',
      offsetMinutesFallback: 420,
      lat: 21.0285,
      lon: 105.8542,
      keywords: 'viet nam ha noi hanoi hcm saigon gmt+7 +7 asia',
    },
    {
      id: 'vn_hcm',
      iana: 'Asia/Ho_Chi_Minh',
      labelVi: 'Giờ TP.HCM',
      cityVi: 'TP. Hồ Chí Minh',
      countryVi: 'Việt Nam',
      region: 'Asia',
      flag: '🇻🇳',
      offsetMinutesFallback: 420,
      lat: 10.8231,
      lon: 106.6297,
      keywords: 'viet nam ho chi minh sai gon saigon gmt+7 +7 asia',
    },
    {
      id: 'vn_danang',
      iana: 'Asia/Ho_Chi_Minh',
      labelVi: 'Giờ Đà Nẵng',
      cityVi: 'Đà Nẵng',
      countryVi: 'Việt Nam',
      region: 'Asia',
      flag: '🇻🇳',
      offsetMinutesFallback: 420,
      lat: 16.0544,
      lon: 108.2022,
      keywords: 'viet nam da nang danang mien trung gmt+7 +7 asia',
    },
    {
      id: 'th_bangkok',
      iana: 'Asia/Bangkok',
      labelVi: 'Giờ Bangkok',
      cityVi: 'Bangkok',
      countryVi: 'Thái Lan',
      region: 'Asia',
      flag: '🇹🇭',
      offsetMinutesFallback: 420,
      lat: 13.7563,
      lon: 100.5018,
      keywords: 'thai lan bangkok gmt+7 +7 asia',
    },
    {
      id: 'id_jakarta',
      iana: 'Asia/Jakarta',
      labelVi: 'Giờ Jakarta',
      cityVi: 'Jakarta',
      countryVi: 'Indonesia',
      region: 'Asia',
      flag: '🇮🇩',
      offsetMinutesFallback: 420,
      lat: -6.2088,
      lon: 106.8456,
      keywords: 'indonesia jakarta gmt+7 +7 asia',
    },
    {
      id: 'sg_singapore',
      iana: 'Asia/Singapore',
      labelVi: 'Giờ Singapore',
      cityVi: 'Singapore',
      countryVi: 'Singapore',
      region: 'Asia',
      flag: '🇸🇬',
      offsetMinutesFallback: 480,
      lat: 1.3521,
      lon: 103.8198,
      keywords: 'singapore gmt+8 +8 asia',
    },
    {
      id: 'my_kualalumpur',
      iana: 'Asia/Kuala_Lumpur',
      labelVi: 'Giờ Kuala Lumpur',
      cityVi: 'Kuala Lumpur',
      countryVi: 'Malaysia',
      region: 'Asia',
      flag: '🇲🇾',
      offsetMinutesFallback: 480,
      lat: 3.139,
      lon: 101.6869,
      keywords: 'malaysia kuala lumpur gmt+8 +8 asia',
    },
    {
      id: 'cn_beijing',
      iana: 'Asia/Shanghai',
      labelVi: 'Giờ Bắc Kinh',
      cityVi: 'Bắc Kinh / Thượng Hải',
      countryVi: 'Trung Quốc',
      region: 'Asia',
      flag: '🇨🇳',
      offsetMinutesFallback: 480,
      lat: 39.9042,
      lon: 116.4074,
      keywords: 'trung quoc beijing shanghai bac kinh thuong hai gmt+8 +8',
    },
    {
      id: 'tw_taipei',
      iana: 'Asia/Taipei',
      labelVi: 'Giờ Đài Bắc',
      cityVi: 'Đài Bắc',
      countryVi: 'Đài Loan',
      region: 'Asia',
      flag: '🇹🇼',
      offsetMinutesFallback: 480,
      lat: 25.033,
      lon: 121.5654,
      keywords: 'dai loan taipei dai bac gmt+8 +8 asia',
    },
    {
      id: 'ph_manila',
      iana: 'Asia/Manila',
      labelVi: 'Giờ Manila',
      cityVi: 'Manila',
      countryVi: 'Philippines',
      region: 'Asia',
      flag: '🇵🇭',
      offsetMinutesFallback: 480,
      lat: 14.5995,
      lon: 120.9842,
      keywords: 'philippines manila gmt+8 +8 asia',
    },
    {
      id: 'jp_tokyo',
      iana: 'Asia/Tokyo',
      labelVi: 'Giờ Tokyo',
      cityVi: 'Tokyo',
      countryVi: 'Nhật Bản',
      region: 'Asia',
      flag: '🇯🇵',
      offsetMinutesFallback: 540,
      lat: 35.6762,
      lon: 139.6503,
      keywords: 'nhat ban japan tokyo light novel akihabara gmt+9 +9 asia',
    },
    {
      id: 'kr_seoul',
      iana: 'Asia/Seoul',
      labelVi: 'Giờ Seoul',
      cityVi: 'Seoul',
      countryVi: 'Hàn Quốc',
      region: 'Asia',
      flag: '🇰🇷',
      offsetMinutesFallback: 540,
      lat: 37.5665,
      lon: 126.978,
      keywords: 'han quoc korea seoul webnovel gmt+9 +9 asia',
    },
    {
      id: 'in_delhi',
      iana: 'Asia/Kolkata',
      labelVi: 'Giờ New Delhi',
      cityVi: 'New Delhi',
      countryVi: 'Ấn Độ',
      region: 'Asia',
      flag: '🇮🇳',
      offsetMinutesFallback: 330,
      lat: 28.6139,
      lon: 77.209,
      keywords: 'an do india delhi kolkata mumbai gmt+5:30 +5:30',
    },
    {
      id: 'ae_dubai',
      iana: 'Asia/Dubai',
      labelVi: 'Giờ Dubai',
      cityVi: 'Dubai',
      countryVi: 'UAE',
      region: 'MiddleEast',
      flag: '🇦🇪',
      offsetMinutesFallback: 240,
      lat: 25.2048,
      lon: 55.2708,
      keywords: 'dubai uae middle east gmt+4 +4',
    },
    {
      id: 'ru_moscow',
      iana: 'Europe/Moscow',
      labelVi: 'Giờ Moscow',
      cityVi: 'Moscow',
      countryVi: 'Nga',
      region: 'Europe',
      flag: '🇷🇺',
      offsetMinutesFallback: 180,
      lat: 55.7558,
      lon: 37.6173,
      keywords: 'nga russia moscow gmt+3 +3 europe',
    },
    {
      id: 'tr_istanbul',
      iana: 'Europe/Istanbul',
      labelVi: 'Giờ Istanbul',
      cityVi: 'Istanbul',
      countryVi: 'Thổ Nhĩ Kỳ',
      region: 'Europe',
      flag: '🇹🇷',
      offsetMinutesFallback: 180,
      lat: 41.0082,
      lon: 28.9784,
      keywords: 'turkey istanbul gmt+3 +3 europe',
    },
    {
      id: 'fr_paris',
      iana: 'Europe/Paris',
      labelVi: 'Giờ Paris',
      cityVi: 'Paris',
      countryVi: 'Pháp',
      region: 'Europe',
      flag: '🇫🇷',
      offsetMinutesFallback: 60,
      lat: 48.8566,
      lon: 2.3522,
      keywords: 'phap france paris cet cest gmt+1 gmt+2 europe',
    },
    {
      id: 'de_berlin',
      iana: 'Europe/Berlin',
      labelVi: 'Giờ Berlin',
      cityVi: 'Berlin',
      countryVi: 'Đức',
      region: 'Europe',
      flag: '🇩🇪',
      offsetMinutesFallback: 60,
      lat: 52.52,
      lon: 13.405,
      keywords: 'duc germany berlin cet cest gmt+1 europe',
    },
    {
      id: 'gb_london',
      iana: 'Europe/London',
      labelVi: 'Giờ London',
      cityVi: 'London',
      countryVi: 'Vương quốc Anh',
      region: 'Europe',
      flag: '🇬🇧',
      offsetMinutesFallback: 0,
      lat: 51.5074,
      lon: -0.1278,
      keywords: 'anh uk london gmt+0 gmt+1 bst europe',
    },
    {
      id: 'etc_utc',
      iana: 'UTC',
      labelVi: 'Giờ Quốc Tế UTC',
      cityVi: 'UTC / Greenwich',
      countryVi: 'Toàn cầu',
      region: 'Global',
      flag: '🌐',
      offsetMinutesFallback: 0,
      lat: 51.4769,
      lon: 0.0,
      keywords: 'utc gmt 0 greenwich quoc te global',
    },
    {
      id: 'br_saopaulo',
      iana: 'America/Sao_Paulo',
      labelVi: 'Giờ São Paulo',
      cityVi: 'São Paulo',
      countryVi: 'Brazil',
      region: 'Americas',
      flag: '🇧🇷',
      offsetMinutesFallback: -180,
      lat: -23.5505,
      lon: -46.6333,
      keywords: 'brazil sao paulo gmt-3 -3 americas',
    },
    {
      id: 'us_newyork',
      iana: 'America/New_York',
      labelVi: 'Giờ New York',
      cityVi: 'New York',
      countryVi: 'Hoa Kỳ',
      region: 'Americas',
      flag: '🇺🇸',
      offsetMinutesFallback: -300,
      lat: 40.7128,
      lon: -74.006,
      keywords: 'my usa new york eastern est edt gmt-5 gmt-4 americas',
    },
    {
      id: 'ca_toronto',
      iana: 'America/Toronto',
      labelVi: 'Giờ Toronto',
      cityVi: 'Toronto',
      countryVi: 'Canada',
      region: 'Americas',
      flag: '🇨🇦',
      offsetMinutesFallback: -300,
      lat: 43.6532,
      lon: -79.3832,
      keywords: 'canada toronto est edt gmt-5 gmt-4 americas',
    },
    {
      id: 'us_chicago',
      iana: 'America/Chicago',
      labelVi: 'Giờ Chicago',
      cityVi: 'Chicago',
      countryVi: 'Hoa Kỳ',
      region: 'Americas',
      flag: '🇺🇸',
      offsetMinutesFallback: -360,
      lat: 41.8781,
      lon: -87.6298,
      keywords: 'my usa chicago central cst cdt gmt-6 gmt-5 americas',
    },
    {
      id: 'us_denver',
      iana: 'America/Denver',
      labelVi: 'Giờ Denver',
      cityVi: 'Denver',
      countryVi: 'Hoa Kỳ',
      region: 'Americas',
      flag: '🇺🇸',
      offsetMinutesFallback: -420,
      lat: 39.7392,
      lon: -104.9903,
      keywords: 'my usa denver mountain mst mdt gmt-7 gmt-6 americas',
    },
    {
      id: 'us_losangeles',
      iana: 'America/Los_Angeles',
      labelVi: 'Giờ Los Angeles',
      cityVi: 'Los Angeles / California',
      countryVi: 'Hoa Kỳ',
      region: 'Americas',
      flag: '🇺🇸',
      offsetMinutesFallback: -480,
      lat: 34.0522,
      lon: -118.2437,
      keywords: 'my usa los angeles california pacific pst pdt gmt-8 gmt-7 americas',
    },
    {
      id: 'ca_vancouver',
      iana: 'America/Vancouver',
      labelVi: 'Giờ Vancouver',
      cityVi: 'Vancouver',
      countryVi: 'Canada',
      region: 'Americas',
      flag: '🇨🇦',
      offsetMinutesFallback: -480,
      lat: 49.2827,
      lon: -123.1207,
      keywords: 'canada vancouver pacific pst gmt-8 gmt-7 americas',
    },
    {
      id: 'us_anchorage',
      iana: 'America/Anchorage',
      labelVi: 'Giờ Alaska',
      cityVi: 'Anchorage',
      countryVi: 'Hoa Kỳ',
      region: 'Americas',
      flag: '🇺🇸',
      offsetMinutesFallback: -540,
      lat: 61.2181,
      lon: -149.9003,
      keywords: 'alaska anchorage gmt-9 -9 americas',
    },
    {
      id: 'us_honolulu',
      iana: 'Pacific/Honolulu',
      labelVi: 'Giờ Hawaii',
      cityVi: 'Honolulu',
      countryVi: 'Hoa Kỳ',
      region: 'Oceania',
      flag: '🌺',
      offsetMinutesFallback: -600,
      lat: 21.3069,
      lon: -157.8583,
      keywords: 'hawaii honolulu pacific gmt-10 -10',
    },
    {
      id: 'au_sydney',
      iana: 'Australia/Sydney',
      labelVi: 'Giờ Sydney',
      cityVi: 'Sydney',
      countryVi: 'Úc',
      region: 'Oceania',
      flag: '🇦🇺',
      offsetMinutesFallback: 600,
      lat: -33.8688,
      lon: 151.2093,
      keywords: 'uc australia sydney aedt aest gmt+10 gmt+11 oceania',
    },
    {
      id: 'au_melbourne',
      iana: 'Australia/Melbourne',
      labelVi: 'Giờ Melbourne',
      cityVi: 'Melbourne',
      countryVi: 'Úc',
      region: 'Oceania',
      flag: '🇦🇺',
      offsetMinutesFallback: 600,
      lat: -37.8136,
      lon: 144.9631,
      keywords: 'uc australia melbourne gmt+10 gmt+11 oceania',
    },
    {
      id: 'nz_auckland',
      iana: 'Pacific/Auckland',
      labelVi: 'Giờ Auckland',
      cityVi: 'Auckland',
      countryVi: 'New Zealand',
      region: 'Oceania',
      flag: '🇳🇿',
      offsetMinutesFallback: 720,
      lat: -36.8485,
      lon: 174.7633,
      keywords: 'new zealand auckland gmt+12 gmt+13 oceania',
    },
    {
      id: 'fj_fiji',
      iana: 'Pacific/Fiji',
      labelVi: 'Giờ Fiji / Kamchatka',
      cityVi: 'Suva',
      countryVi: 'Fiji',
      region: 'Oceania',
      flag: '🇫🇯',
      offsetMinutesFallback: 720,
      lat: -18.1416,
      lon: 178.4419,
      keywords: 'fiji suva pacific gmt+12 +12',
    },
    {
      id: 'ki_kiritimati',
      iana: 'Pacific/Kiritimati',
      labelVi: 'Giờ Đảo Kiritimati',
      cityVi: 'Kiritimati',
      countryVi: 'Kiribati',
      region: 'Oceania',
      flag: '🇰🇮',
      offsetMinutesFallback: 840,
      lat: 1.8721,
      lon: -157.4278,
      keywords: 'kiribati kiritimati line islands gmt+14 +14',
    },
    {
      id: 'eg_cairo',
      iana: 'Africa/Cairo',
      labelVi: 'Giờ Cairo',
      cityVi: 'Cairo',
      countryVi: 'Ai Cập',
      region: 'Africa',
      flag: '🇪🇬',
      offsetMinutesFallback: 120,
      lat: 30.0444,
      lon: 31.2357,
      keywords: 'ai cap egypt cairo africa gmt+2 +2',
    },
    {
      id: 'za_johannesburg',
      iana: 'Africa/Johannesburg',
      labelVi: 'Giờ Johannesburg',
      cityVi: 'Johannesburg',
      countryVi: 'Nam Phi',
      region: 'Africa',
      flag: '🇿🇦',
      offsetMinutesFallback: 120,
      lat: -26.2041,
      lon: 28.0473,
      keywords: 'nam phi south africa johannesburg gmt+2 +2',
    },
    {
      id: 'mx_mexico',
      iana: 'America/Mexico_City',
      labelVi: 'Giờ Mexico City',
      cityVi: 'Mexico City',
      countryVi: 'Mexico',
      region: 'Americas',
      flag: '🇲🇽',
      offsetMinutesFallback: -360,
      lat: 19.4326,
      lon: -99.1332,
      keywords: 'mexico city americas gmt-6 -6',
    },
    {
      id: 'ws_pago',
      iana: 'Pacific/Pago_Pago',
      labelVi: 'Giờ Samoa Mỹ',
      cityVi: 'Pago Pago',
      countryVi: 'American Samoa',
      region: 'Oceania',
      flag: '🇼🇸',
      offsetMinutesFallback: -660,
      lat: -14.2756,
      lon: -170.702,
      keywords: 'samoa pago gmt-11 -11',
    },
  ]);

  /**
   * 6 âm thanh chuông báo thức mặc định tích hợp sẵn bằng WebAudio (0 phụ thuộc mạng).
   */
  const SYSTEM_RINGTONES = Object.freeze([
    {
      id: 'sys_chime_gentle',
      name: '🔔 Chuông Gió Studio (Mặc định êm ái)',
      description: 'Âm thanh hòa âm trong trẻo, tăng dần âm lượng không gây giật mình.',
      waveform: 'sine',
      tempoMs: 260,
      gain: 0.24,
      notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 0],
    },
    {
      id: 'sys_sunrise_bell',
      name: '🌅 Chuông Bình Minh (Trong trẻo)',
      description: 'Nhịp chuông sáng khoan thai khơi gợi cảm hứng viết chương mới.',
      waveform: 'triangle',
      tempoMs: 220,
      gain: 0.26,
      notes: [587.33, 739.99, 880.0, 1174.66, 0, 880.0, 1174.66, 0],
    },
    {
      id: 'sys_zen_bowl',
      name: '🪷 Chuông Thiền Tịnh (Sâu lắng)',
      description: 'Âm trầm vang ngân dài, thích hợp kết thúc phiên tập trung Pomodoro.',
      waveform: 'sine',
      tempoMs: 420,
      gain: 0.28,
      notes: [396.0, 528.0, 0, 396.0, 528.0, 0],
    },
    {
      id: 'sys_crystal_digital',
      name: '⏰ Đồng Hồ Điện Tử Cổ Điển (Rõ nét)',
      description: 'Nhịp bíp điện tử chuẩn xác, rõ ràng để nhắc deadline đúng giây.',
      waveform: 'square',
      tempoMs: 160,
      gain: 0.14,
      notes: [880, 880, 880, 0, 1046.5, 1046.5, 0, 0],
    },
    {
      id: 'sys_lofi_arpeggio',
      name: '🎹 Piano Lo-Fi Nhẹ Nhàng',
      description: 'Hợp âm rải dịu mắt như quán cà phê đêm mưa.',
      waveform: 'triangle',
      tempoMs: 240,
      gain: 0.24,
      notes: [440, 523.25, 659.25, 783.99, 987.77, 783.99, 659.25, 0],
    },
    {
      id: 'sys_alert_bright',
      name: '🚨 Chuông Đánh Thức Mạnh Mẽ',
      description: 'Âm sắc cao và dứt khoát khi bạn cần thức dậy hoặc không bỏ lỡ lịch.',
      waveform: 'sawtooth',
      tempoMs: 150,
      gain: 0.18,
      notes: [987.77, 1318.51, 987.77, 1318.51, 1567.98, 0, 987.77, 1318.51],
    },
  ]);

  /**
   * Bảng giải mã mã thời tiết chuẩn WMO -> Tiếng Việt & Gợi ý cảm hứng sáng tác.
   */
  const WMO_WEATHER_CATALOG = Object.freeze({
    0: {
      icon: '☀️',
      labelVi: 'Trời quang đãng, nắng đẹp',
      moodTag: 'Tươi sáng & Hứng khởi',
      writingTip: 'Ánh nắng chan hòa rất hợp viết những chương mở đầu giàu năng lượng.',
      tone: 'amber',
    },
    1: {
      icon: '🌤️',
      labelVi: 'Nắng nhẹ, ít mây',
      moodTag: 'Nhẹ nhàng & Thư thái',
      writingTip: 'Thời tiết cân bằng, lý tưởng để đi tiếp mạch truyện dài hơi.',
      tone: 'amber',
    },
    2: {
      icon: '⛅',
      labelVi: 'Có mây rải rác',
      moodTag: 'Dịu mắt & Tập trung',
      writingTip: 'Khí trời dịu nhẹ, rất hợp ngồi sâu chuốt câu chữ và nhịp thoại.',
      tone: 'sky',
    },
    3: {
      icon: '☁️',
      labelVi: 'Trời nhiều mây, âm u',
      moodTag: 'Trầm lắng & Chiều sâu',
      writingTip: 'Không khí trầm rất hợp viết các phân đoạn nội tâm hoặc bí ẩn.',
      tone: 'zinc',
    },
    45: {
      icon: '🌫️',
      labelVi: 'Có sương mù nhẹ',
      moodTag: 'Huyền ảo & Bí ẩn',
      writingTip: 'Gợi không khí mờ sương đầy chất trinh thám / huyền huyễn.',
      tone: 'zinc',
    },
    48: {
      icon: '🌫️',
      labelVi: 'Sương mù dày, đóng sương',
      moodTag: 'Lạnh & Sâu lắng',
      writingTip: 'Một tách trà nóng bên màn hình viết sẽ giữ nhịp mạch văn thật ổn định.',
      tone: 'zinc',
    },
    51: {
      icon: '🌦️',
      labelVi: 'Mưa phùn nhẹ',
      moodTag: 'Lãng mạn & Mưa rơi',
      writingTip: 'Rất hợp bật thêm tiếng mưa Tab 5 để nhập tâm cảnh chia ly hoặc hồi ức.',
      tone: 'sky',
    },
    53: {
      icon: '🌦️',
      labelVi: 'Mưa phùn vừa',
      moodTag: 'Tĩnh lặng & Nhịp chậm',
      writingTip: 'Mưa bụi giúp thế giới bên ngoài chậm lại, dễ dồn tâm trí vào bản thảo.',
      tone: 'sky',
    },
    55: {
      icon: '🌧️',
      labelVi: 'Mưa phùn dày hạt',
      moodTag: 'Ẩm ướt & Trầm tư',
      writingTip: 'Phù hợp viết các đoạn đối thoại sâu sắc bên khung cửa sổ.',
      tone: 'sky',
    },
    56: {
      icon: '🌧️',
      labelVi: 'Mưa phùn lạnh đóng băng nhẹ',
      moodTag: 'Giá lạnh',
      writingTip: 'Giữ ấm tay gõ phím và lưu bản thảo 3 tầng đều đặn nhé.',
      tone: 'cyan',
    },
    57: {
      icon: '🌧️',
      labelVi: 'Mưa lạnh dày',
      moodTag: 'Băng giá',
      writingTip: 'Không khí mùa đông khắc nghiệt — nguồn cảm hứng tuyệt vời cho fantasy phương Bắc.',
      tone: 'cyan',
    },
    61: {
      icon: '🌧️',
      labelVi: 'Mưa rào nhẹ',
      moodTag: 'Đêm mưa Lo-Fi',
      writingTip: 'Tiếng mưa rơi là nền âm thanh hoàn hảo để gõ 1.500+ chữ không dứt.',
      tone: 'sky',
    },
    63: {
      icon: '🌧️',
      labelVi: 'Mưa vừa liên tục',
      moodTag: 'Mưa rào sâu lắng',
      writingTip: 'Thử phối nền Đêm Mưa Dịu Mắt ở Tab 5 cho hợp thời tiết thực bên ngoài.',
      tone: 'indigo',
    },
    65: {
      icon: '⛈️',
      labelVi: 'Mưa to, nặng hạt',
      moodTag: 'Cao trào & Kịch tính',
      writingTip: 'Không khí bão tố cực hợp viết cảnh cao trào, đối đầu hoặc bước ngoặt lớn.',
      tone: 'indigo',
    },
    66: {
      icon: '🌧️',
      labelVi: 'Mưa lạnh nhẹ',
      moodTag: 'Lạnh buốt',
      writingTip: 'Chi tiết hơi lạnh bên ngoài có thể làm tư liệu tả cảnh sống động ngay lúc này.',
      tone: 'cyan',
    },
    67: {
      icon: '🌧️',
      labelVi: 'Mưa lạnh lớn',
      moodTag: 'Giá buốt',
      writingTip: 'Tạm nghỉ uống nước ấm nếu tay mỏi giữa phiên viết dài.',
      tone: 'cyan',
    },
    71: {
      icon: '🌨️',
      labelVi: 'Tuyết rơi nhẹ',
      moodTag: 'Tĩnh mịch mùa đông',
      writingTip: 'Khung cảnh tuyết rơi rất hợp những chương light novel đậm chất hoài niệm.',
      tone: 'cyan',
    },
    73: {
      icon: '🌨️',
      labelVi: 'Tuyết rơi vừa',
      moodTag: 'Trắng xóa & Thơ mộng',
      writingTip: 'Hãy chú ý mô tả sắc trắng và tiếng bước chân trên tuyết trong trang viết.',
      tone: 'cyan',
    },
    75: {
      icon: '❄️',
      labelVi: 'Tuyết rơi dày',
      moodTag: 'Bão tuyết',
      writingTip: 'Cảnh thiên nhiên dữ dội tạo phông nền xuất sắc cho sinh tồn hoặc kỳ ảo.',
      tone: 'cyan',
    },
    77: {
      icon: '🌨️',
      labelVi: 'Mưa tuyết hạt nhỏ',
      moodTag: 'Lạnh sâu',
      writingTip: 'Gợi không khí giao mùa se lạnh đầy chất điện ảnh.',
      tone: 'cyan',
    },
    80: {
      icon: '🌦️',
      labelVi: 'Mưa rào thoáng qua',
      moodTag: 'Tươi mát sau mưa',
      writingTip: 'Cơn mưa ngắn giúp không khí trong lành, lý tưởng để rà lỗi chính tả chương.',
      tone: 'sky',
    },
    81: {
      icon: '🌧️',
      labelVi: 'Mưa rào vừa từng đợt',
      moodTag: 'Nhịp biến đổi',
      writingTip: 'Đừng quên đặt báo thức nghỉ ngơi 5 phút sau mỗi chu kỳ 25–45 phút viết.',
      tone: 'sky',
    },
    82: {
      icon: '⛈️',
      labelVi: 'Mưa rào xối xả',
      moodTag: 'Dồn dập & Mạnh mẽ',
      writingTip: 'Nhịp mưa dồn dập hợp với các phân cảnh hành động nhanh.',
      tone: 'indigo',
    },
    85: {
      icon: '🌨️',
      labelVi: 'Mưa tuyết rào nhẹ',
      moodTag: 'Lạnh giá',
      writingTip: 'Một chút sắc lạnh làm nổi bật sự ấm áp giữa các nhân vật.',
      tone: 'cyan',
    },
    86: {
      icon: '❄️',
      labelVi: 'Mưa tuyết rào dày',
      moodTag: 'Khắc nghiệt',
      writingTip: 'Gợi bối cảnh mùa đông sâu nơi biên ải hoặc thành phố phủ băng.',
      tone: 'cyan',
    },
    95: {
      icon: '⛈️',
      labelVi: 'Có dông, sấm chớp',
      moodTag: 'Sấm chớp & Phép màu',
      writingTip: 'Giông bão tự nhiên luôn là chất liệu vàng cho những cú plot twist lớn.',
      tone: 'rose',
    },
    96: {
      icon: '⛈️',
      labelVi: 'Dông kèm mưa đá nhẹ',
      moodTag: 'Biến động mạnh',
      writingTip: 'Chú ý an toàn thiết bị điện; Studio đã sao lưu tự động 3 tầng cho bạn.',
      tone: 'rose',
    },
    99: {
      icon: '🌩️',
      labelVi: 'Dông bão mạnh kèm mưa đá',
      moodTag: 'Cảnh báo bão lớn',
      writingTip: 'Chú ý an toàn thời tiết bên ngoài; bật nền tối chống chói để bảo vệ mắt.',
      tone: 'rose',
    },
  });

  function pad2(n) {
    return String(Math.max(0, Math.floor(Number(n) || 0))).padStart(2, '0');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripVietnameseToneMarks(input) {
    return String(input || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .toLowerCase();
  }

  function formatBytesHuman(bytes) {
    const val = Number(bytes) || 0;
    if (val <= 0) return '0 B';
    if (val < 1024) return `${val} B`;
    if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`;
    return `${(val / (1024 * 1024)).toFixed(2)} MB`;
  }

  function generateUniqueId(prefix) {
    const rnd = Math.random().toString(36).slice(2, 7);
    return `${prefix}_${Date.now().toString(36)}_${rnd}`;
  }

  /**
   * Định dạng chuỗi GMT từ số phút lệch UTC (ví dụ: 420 -> "GMT +7", -300 -> "GMT -5", 330 -> "GMT +5:30").
   */
  function formatGmtOffsetText(offsetMinutes) {
    const total = Math.round(Number(offsetMinutes) || 0);
    const sign = total >= 0 ? '+' : '-';
    const abs = Math.abs(total);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (m === 0) {
      return `GMT ${sign}${h}`;
    }
    return `GMT ${sign}${h}:${pad2(m)}`;
  }

  /**
   * Phân tích giờ/phút/giây trong múi giờ IANA chuẩn bằng Intl.DateTimeFormat,
   * tự động fallback về offset phút cố định nếu trình duyệt không hỗ trợ múi giờ đó.
   */
  function resolveZonedParts(dateObj, zoneEntry, customOffsetMinutes) {
    const now = dateObj instanceof Date ? dateObj : new Date();

    if (typeof customOffsetMinutes === 'number' && Number.isFinite(customOffsetMinutes)) {
      const shiftedMs = now.getTime() + customOffsetMinutes * 60000;
      const d = new Date(shiftedMs);
      return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
        second: d.getUTCSeconds(),
        weekdayIndex: d.getUTCDay(),
        offsetMinutes: customOffsetMinutes,
        gmtText: formatGmtOffsetText(customOffsetMinutes),
        zoneLabel: zoneEntry?.labelVi || `Múi giờ ${formatGmtOffsetText(customOffsetMinutes)}`,
      };
    }

    const iana = zoneEntry?.iana || 'Asia/Ho_Chi_Minh';
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: iana,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
      });
      const parts = dtf.formatToParts(now);
      const map = {};
      for (let i = 0; i < parts.length; i++) {
        map[parts[i].type] = parts[i].value;
      }

      const year = Number(map.year) || now.getFullYear();
      const month = Number(map.month) || now.getMonth() + 1;
      const day = Number(map.day) || now.getDate();
      let hour = Number(map.hour);
      if (hour === 24) hour = 0;
      const minute = Number(map.minute) || 0;
      const second = Number(map.second) || 0;

      const utcNoonMs = Date.UTC(year, month - 1, day, hour, minute, second);
      const offsetMinutes = Math.round((utcNoonMs - Math.floor(now.getTime() / 1000) * 1000) / 60000);
      const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const weekdayIndex =
        typeof weekdayMap[map.weekday] === 'number'
          ? weekdayMap[map.weekday]
          : new Date(utcNoonMs).getUTCDay();

      return {
        year,
        month,
        day,
        hour,
        minute,
        second,
        weekdayIndex,
        offsetMinutes,
        gmtText: formatGmtOffsetText(offsetMinutes),
        zoneLabel: zoneEntry?.labelVi || iana,
      };
    } catch (_err) {
      const fallbackMin = Number(zoneEntry?.offsetMinutesFallback) || 420;
      const shiftedMs = now.getTime() + fallbackMin * 60000;
      const d = new Date(shiftedMs);
      return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
        second: d.getUTCSeconds(),
        weekdayIndex: d.getUTCDay(),
        offsetMinutes: fallbackMin,
        gmtText: formatGmtOffsetText(fallbackMin),
        zoneLabel: zoneEntry?.labelVi || 'Giờ Hà Nội',
      };
    }
  }

  /**
   * Kết xuất chuỗi hiển thị hoàn chỉnh theo format yêu cầu:
   * Ví dụ mặc định: "14/11/2026 08:20:11, GMT +7 (Giờ Hà Nội)"
   */
  function formatZonedClockString(parts, formatId) {
    const yyyy = String(parts.year);
    const mm = pad2(parts.month);
    const dd = pad2(parts.day);
    const hh24 = pad2(parts.hour);
    const min = pad2(parts.minute);
    const sec = pad2(parts.second);

    const tr = (s) =>
      NS.i18n && typeof NS.i18n.translateText === 'function'
        ? NS.i18n.translateText(String(s || ''))
        : String(s || '');
    const h12Raw = parts.hour % 12 || 12;
    const h12 = pad2(h12Raw);
    const ampmEn = parts.hour >= 12 ? 'PM' : 'AM';
    const ampmVi = tr(parts.hour >= 12 ? 'CH' : 'SA');
    const gmtFull = `${parts.gmtText} (${tr(parts.zoneLabel)})`;

    let outStr = '';
    switch (formatId) {
      case 'DMY_HMS_12H':
        outStr = `${dd}/${mm}/${yyyy} ${h12}:${min}:${sec} ${ampmVi}, ${gmtFull}`;
        break;
      case 'YMD_HMS':
        outStr = `${yyyy}-${mm}-${dd} ${hh24}:${min}:${sec}, ${gmtFull}`;
        break;
      case 'FULL_VI': {
        const wd = VIETNAMESE_WEEKDAYS_LONG[parts.weekdayIndex] || '';
        outStr = `${wd}, ${dd}/${mm}/${yyyy} ${hh24}:${min}:${sec}, ${gmtFull}`;
        break;
      }
      case 'FULL_EN': {
        const wd = ENGLISH_WEEKDAYS_SHORT[parts.weekdayIndex] || 'Day';
        const mon = ENGLISH_MONTHS_SHORT[Math.max(0, parts.month - 1)] || 'Jan';
        outStr = `${wd}, ${mon} ${dd}, ${yyyy} ${hh24}:${min}:${sec}, ${gmtFull}`;
        break;
      }
      case 'MDY_HMS_12H':
        outStr = `${mm}/${dd}/${yyyy} ${h12}:${min}:${sec} ${ampmEn}, ${gmtFull}`;
        break;
      case 'COMPACT_HMS':
        outStr = `${dd}/${mm} ${hh24}:${min}:${sec} · ${parts.gmtText}`;
        break;
      case 'DMY_HMS':
      default:
        outStr = `${dd}/${mm}/${yyyy} ${hh24}:${min}:${sec}, ${gmtFull}`;
        break;
    }
    return tr(outStr);
  }

  /**
   * Chuẩn hóa và validate input tạo báo thức.
   * Quy tắc bắt buộc:
   * - Giờ (0..23) và Phút (0..59) là bắt buộc.
   * - Giây (0..59) là tùy chọn: nếu để trống / undefined / null / "" thì TỰ ĐỘNG MẶC ĐỊNH LÀ 0 (00).
   */
  function normalizeAndValidateAlarmTimeInput(hourRaw, minuteRaw, secondRaw) {
    const hStr = String(hourRaw == null ? '' : hourRaw).trim();
    const mStr = String(minuteRaw == null ? '' : minuteRaw).trim();
    const sStr = String(secondRaw == null ? '' : secondRaw).trim();

    if (hStr === '' || mStr === '') {
      return {
        ok: false,
        error: 'Vui lòng nhập đầy đủ Giờ (00–23) và Phút (00–59) cho báo thức.',
      };
    }

    if (!/^\d{1,2}$/.test(hStr) || !/^\d{1,2}$/.test(mStr)) {
      return {
        ok: false,
        error: 'Giờ và Phút phải là số nguyên hợp lệ (ví dụ: 09 và 00).',
      };
    }

    const hour = Number(hStr);
    const minute = Number(mStr);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      return {
        ok: false,
        error: 'Giờ báo thức phải nằm trong khoảng 00 đến 23.',
      };
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      return {
        ok: false,
        error: 'Phút báo thức phải nằm trong khoảng 00 đến 59.',
      };
    }

    let second = 0;
    let secondDefaulted = false;
    if (sStr === '') {
      second = 0;
      secondDefaulted = true;
    } else if (!/^\d{1,2}$/.test(sStr)) {
      return {
        ok: false,
        error: 'Giây (tùy chọn) nếu nhập thì phải là số nguyên từ 00 đến 59.',
      };
    } else {
      second = Number(sStr);
      if (!Number.isInteger(second) || second < 0 || second > 59) {
        return {
          ok: false,
          error: 'Giây báo thức phải nằm trong khoảng 00 đến 59 (hoặc để trống để mặc định :00).',
        };
      }
    }

    return {
      ok: true,
      hour,
      minute,
      second,
      secondDefaulted,
      formattedHMS: `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`,
      formattedHM: `${pad2(hour)}:${pad2(minute)}`,
    };
  }

  /**
   * Phân tích chuỗi gõ nhanh kiểu "09:00" hoặc "09:00:15" (giây thiếu tự về 00).
   */
  function parseQuickTimeExpression(rawText) {
    const cleaned = String(rawText || '').trim();
    if (!cleaned) {
      return { ok: false, error: 'Hãy nhập mốc giờ dạng HH:MM hoặc HH:MM:SS (ví dụ 09:00).' };
    }
    const match = cleaned.match(/^(\d{1,2})[:hHg.\-](\d{1,2})(?:[:mMs.\-](\d{1,2}))?$/);
    if (!match) {
      return {
        ok: false,
        error: 'Định dạng không đúng. Hãy nhập kiểu 09:00 (tự đặt giây :00) hoặc 09:00:30.',
      };
    }
    return normalizeAndValidateAlarmTimeInput(match[1], match[2], match[3] || '');
  }

  function convertCelsius(tempC, unit) {
    const val = Number(tempC) || 0;
    if (unit === 'F') {
      return `${Math.round((val * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(val)}°C`;
  }

  function convertCelsiusNumber(tempC, unit) {
    const val = Number(tempC) || 0;
    return unit === 'F' ? Math.round((val * 9) / 5 + 32) : Math.round(val);
  }

  function lookupWmoWeatherMeta(code) {
    const num = Number(code);
    if (WMO_WEATHER_CATALOG[num]) return WMO_WEATHER_CATALOG[num];
    if (num >= 1 && num <= 3) return WMO_WEATHER_CATALOG[2];
    if (num >= 40 && num <= 49) return WMO_WEATHER_CATALOG[45];
    if (num >= 50 && num <= 59) return WMO_WEATHER_CATALOG[51];
    if (num >= 60 && num <= 69) return WMO_WEATHER_CATALOG[61];
    if (num >= 70 && num <= 79) return WMO_WEATHER_CATALOG[71];
    if (num >= 80 && num <= 84) return WMO_WEATHER_CATALOG[80];
    if (num >= 95) return WMO_WEATHER_CATALOG[95];
    return WMO_WEATHER_CATALOG[1];
  }

  function resolveZonedCalendarClockParts(dateObj, ianaZone) {
    const dt = dateObj instanceof Date ? dateObj : new Date();
    const tz = String(ianaZone || 'Asia/Ho_Chi_Minh').trim() || 'Asia/Ho_Chi_Minh';
    try {
      const dtf = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const map = {};
      dtf.formatToParts(dt).forEach((p) => {
        if (p.type !== 'literal') map[p.type] = p.value;
      });
      let hour = parseInt(map.hour, 10);
      if (!Number.isFinite(hour) || hour === 24) hour = 0;
      const minute = parseInt(map.minute, 10) || 0;
      const year = String(map.year || dt.getFullYear());
      const month = pad2(parseInt(map.month, 10) || dt.getMonth() + 1);
      const day = pad2(parseInt(map.day, 10) || dt.getDate());
      return {
        year,
        month,
        day,
        hour,
        minute,
        ddMm: `${day}/${month}`,
        isoHourPrefix: `${year}-${month}-${day}T${pad2(hour)}:00`,
      };
    } catch (_eTz) {
      const year = String(dt.getFullYear());
      const month = pad2(dt.getMonth() + 1);
      const day = pad2(dt.getDate());
      const hour = dt.getHours();
      const minute = dt.getMinutes();
      return {
        year,
        month,
        day,
        hour,
        minute,
        ddMm: `${day}/${month}`,
        isoHourPrefix: `${year}-${month}-${day}T${pad2(hour)}:00`,
      };
    }
  }

  function computeUpcomingHourlyStartMs(nowDate, ianaZone) {
    const baseMs = (nowDate instanceof Date ? nowDate : new Date()).getTime();
    const curParts = resolveZonedCalendarClockParts(new Date(baseMs), ianaZone);
    if (curParts.minute > 0) {
      return baseMs + (60 - curParts.minute) * 60000 + 1000;
    }
    return baseMs;
  }

  /**
   * Tạo bản ước lượng thời tiết cục bộ theo vĩ độ & khung giờ khi thiết bị mất mạng
   * hoặc chạy kiểm thử không có kết nối Open-Meteo. Luôn đánh dấu nguồn rõ ràng.
   */
  function buildOfflineWeatherSnapshot(lat, lon, displayName, zoneIana) {
    const now = new Date();
    const resolvedIana = zoneIana || 'Asia/Ho_Chi_Minh';
    const nowParts = resolveZonedCalendarClockParts(now, resolvedIana);
    const absLat = Math.abs(Number(lat) || 21);
    const month = parseInt(nowParts.month, 10) || now.getMonth() + 1;
    const hour = nowParts.hour;

    // Xác định mùa bán cầu Bắc / Nam một cách tự nhiên
    const isSouthern = (Number(lat) || 0) < 0;
    const effectiveMonth = isSouthern ? ((month + 5) % 12) + 1 : month;
    const isSummerBand = effectiveMonth >= 5 && effectiveMonth <= 9;
    const isWinterBand = effectiveMonth === 12 || effectiveMonth <= 2;

    let baseTempC = 28 - absLat * 0.34;
    if (isSummerBand) baseTempC += 4.2;
    else if (isWinterBand) baseTempC -= 5.8;

    // Biến thiên nhiệt độ ngày đêm (±3.5°C)
    const diurnalShift = Math.sin(((hour - 9) / 24) * Math.PI * 2) * 3.5;
    const currentC = Math.round((baseTempC + diurnalShift) * 10) / 10;

    // Mã WMO mẫu hợp lý theo vĩ độ
    let sampleCode = 2;
    if (absLat > 48 && isWinterBand && currentC <= 2) sampleCode = 71;
    else if (absLat < 25 && isSummerBand && hour >= 15 && hour <= 19) sampleCode = 61;
    else if (hour >= 10 && hour <= 15) sampleCode = 1;

    // 24 giờ gần nhất mỗi 1 tiếng tính từ giờ kế tiếp (VD: 23:50 ngày 21/11 -> 00:00 (22/11) .. 23:00 (22/11))
    const startHourMs = computeUpcomingHourlyStartMs(now, resolvedIana);
    const hourly = [];
    for (let i = 0; i < 24; i++) {
      const slotParts = resolveZonedCalendarClockParts(new Date(startHourMs + i * 3600000), resolvedIana);
      const h = slotParts.hour;
      const shift = Math.sin(((h - 9) / 24) * Math.PI * 2) * 3.5;
      const hhStr = `${pad2(h)}:00`;
      hourly.push({
        timeLabel: hhStr,
        dateLabel: slotParts.ddMm,
        displayLabel: `${hhStr} (${slotParts.ddMm})`,
        tempC: Math.round((baseTempC + shift) * 10) / 10,
        code: i % 4 === 2 ? sampleCode : (h >= 18 || h <= 5 ? 2 : 1),
        precipProb: sampleCode >= 60 ? 55 : 20,
      });
    }

    const daily = [];
    for (let d = 0; d < 5; d++) {
      const target = new Date(now.getTime() + d * 86400000);
      const wd = VIETNAMESE_WEEKDAYS_SHORT[target.getDay()];
      const dayLabel = d === 0 ? 'Hôm nay' : `${wd} ${pad2(target.getDate())}/${pad2(target.getMonth() + 1)}`;
      const jitter = ((Math.round(Math.abs(lon || 105)) + d * 3) % 5) - 2;
      daily.push({
        dayLabel,
        code: d === 1 && sampleCode < 60 ? 3 : sampleCode,
        minC: Math.round(baseTempC - 4 + jitter * 0.6),
        maxC: Math.round(baseTempC + 4.5 + jitter * 0.6),
        precipProb: sampleCode >= 60 ? 60 : 25,
      });
    }

    return {
      sourceMode: 'offline_estimate',
      sourceLabel: 'Ước lượng ngoại tuyến (Chưa có kết nối Open-Meteo)',
      locationName: displayName || 'Hà Nội, Việt Nam',
      zoneIana: zoneIana || 'Asia/Ho_Chi_Minh',
      lat: Number(lat) || 21.0285,
      lon: Number(lon) || 105.8542,
      fetchedAt: Date.now(),
      current: {
        tempC: currentC,
        feelsLikeC: Math.round((currentC + 1.2) * 10) / 10,
        humidity: absLat < 25 ? 74 : 58,
        windKmh: 11.4,
        cloudCover: sampleCode === 1 ? 22 : 48,
        pressureHpa: 1012,
        weatherCode: sampleCode,
        isDay: hour >= 6 && hour < 18,
      },
      hourly,
      daily,
    };
  }

  /**
   * Đánh giá khoảng thời gian đếm ngược đến lần chuông báo thức kế tiếp.
   */
  function computeAlarmCountdownParts(alarm, currentZonedParts) {
    const nowTotalSec =
      (Number(currentZonedParts.hour) || 0) * 3600 +
      (Number(currentZonedParts.minute) || 0) * 60 +
      (Number(currentZonedParts.second) || 0);
    const targetTotalSec =
      (Number(alarm.hour) || 0) * 3600 +
      (Number(alarm.minute) || 0) * 60 +
      (Number(alarm.second) || 0);

    let diffSec = targetTotalSec - nowTotalSec;
    if (diffSec < 0) {
      diffSec += 86400;
    }
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;
    const rawLabel =
      diffSec === 0
        ? 'Ngay bây giờ!'
        : hrs > 0
          ? `Còn ${hrs} giờ ${mins} phút ${pad2(secs)} giây`
          : mins > 0
            ? `Còn ${mins} phút ${pad2(secs)} giây`
            : `Còn ${secs} giây`;
    return {
      diffSec,
      label: NS.i18n?.translateText?.(rawLabel) || rawLabel,
    };
  }

  /**
   * Kho IndexedDB chuyên biệt lưu file .MP3 nhạc chuông báo thức tùy chọn của người dùng,
   * tách biệt hoàn toàn khỏi localStorage để tránh tràn giới hạn 5MB.
   */
  class Mod42AlarmAudioVault {
    constructor() {
      this.dbPromise = null;
    }

    openDb() {
      if (this.dbPromise) return this.dbPromise;
      this.dbPromise = new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
          resolve(null);
          return;
        }
        let settled = false;
        const done = (v) => {
          if (settled) return;
          settled = true;
          clearTimeout(t);
          resolve(v);
        };
        const t = setTimeout(() => done(null), 2000);
        try {
          const req = indexedDB.open(IDB_NAME, IDB_VERSION);
          req.onupgradeneeded = (ev) => {
            const db = ev.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
              db.createObjectStore(IDB_STORE, { keyPath: 'id' });
            }
          };
          req.onsuccess = (ev) => done(ev.target.result);
          req.onerror = () => done(null);
          req.onblocked = () => done(null);
        } catch (_err) {
          done(null);
        }
      });
      return this.dbPromise;
    }

    async saveAudioRecord(record) {
      const db = await this.openDb();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([IDB_STORE], 'readwrite');
          const store = tx.objectStore(IDB_STORE);
          store.put({
            id: IDB_RECORD_KEY,
            fileName: record.fileName || 'alarm_custom.mp3',
            mimeType: record.mimeType || 'audio/mpeg',
            sizeBytes: Number(record.sizeBytes) || 0,
            blob: record.blob,
            updatedAt: Date.now(),
          });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_err) {
          resolve(false);
        }
      });
    }

    async loadAudioRecord() {
      const db = await this.openDb();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([IDB_STORE], 'readonly');
          const store = tx.objectStore(IDB_STORE);
          const req = store.get(IDB_RECORD_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (_err) {
          resolve(null);
        }
      });
    }

    async clearAudioRecord() {
      const db = await this.openDb();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([IDB_STORE], 'readwrite');
          const store = tx.objectStore(IDB_STORE);
          store.delete(IDB_RECORD_KEY);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_err) {
          resolve(false);
        }
      });
    }
  }

  /**
   * Bộ phát chuông báo thức đa kênh:
   * - Chế độ "system": Tổng hợp âm sắc bằng WebAudio API (không phụ thuộc file ngoài).
   * - Chế độ "custom_mp3": Phát file MP3 tải lên từ máy hoặc mượn trực tiếp từ Tab 5 (Mod 21),
   *   có cơ chế dự phòng sang chuông hệ thống nếu trình duyệt chặn phát MP3.
   */
  class Mod42RingtoneEngine {
    constructor() {
      this.audioCtx = null;
      this.loopTimer = null;
      this.previewStopTimer = null;
      this.stepIndex = 0;
      this.activeHtmlAudio = null;
      this.customObjectUrl = null;
      this.customBlob = null;
      this.isPlaying = false;
      this.activeSourceLabel = '';
    }

    ensureAudioContext() {
      const Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx) return null;
      if (!this.audioCtx) {
        try {
          this.audioCtx = new Ctx();
        } catch (_err) {
          return null;
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    setCustomMp3Blob(blob) {
      if (this.customObjectUrl) {
        try {
          URL.revokeObjectURL(this.customObjectUrl);
        } catch (_err) {}
        this.customObjectUrl = null;
      }
      this.customBlob = blob instanceof Blob ? blob : null;
      if (this.customBlob) {
        try {
          this.customObjectUrl = URL.createObjectURL(this.customBlob);
        } catch (_err) {
          this.customObjectUrl = null;
        }
      }
    }

    /**
     * Thử tìm file nhạc MP3 hiện có bên Mod 21 (Tab 5 Âm Thanh) nếu tác giả muốn tái sử dụng nhanh.
     */
    resolveTab5LoadedMp3Source() {
      const mod21 = NS.audioStudio || NS.ambienceAudio;
      const el = document.getElementById('tab5-mp3-audio') || document.getElementById('ambient-mp3-player');
      const url = el?.currentSrc || el?.src || mod21?.currentTrackUrl || '';
      const titleEl = document.getElementById('mp3-track-title') || document.getElementById('s14-mp3-now-playing');
      const label = (titleEl?.textContent || '').trim();
      if (url && !url.startsWith('data:text') && url.length > 5) {
        return { url, label: label || 'Bài MP3 đang mở ở Tab 5' };
      }
      return null;
    }

    playSingleWebAudioNote(freq, durationMs, waveform, volumeScale) {
      if (!freq || freq <= 0) return;
      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = waveform || 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const peak = Math.max(0.02, Math.min(0.45, Number(volumeScale) || 0.2));
        const durSec = Math.max(0.08, (Number(durationMs) || 220) / 1000);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(peak, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durSec * 0.94);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + durSec);
      } catch (_err) {
        // Bỏ qua an toàn khi headless hoặc trình duyệt chưa mở khóa AudioContext
      }
    }

    startSystemPattern(ringtoneId, volume, autoStopAfterMs) {
      this.stopAll();
      const spec =
        SYSTEM_RINGTONES.find((item) => item.id === ringtoneId) || SYSTEM_RINGTONES[0];
      this.isPlaying = true;
      this.activeSourceLabel = spec.name;
      this.stepIndex = 0;

      const scaleVol = Math.max(0.1, Math.min(1, Number(volume) || 0.85));
      const noteTick = () => {
        if (!this.isPlaying) return;
        const freq = spec.notes[this.stepIndex % spec.notes.length];
        this.stepIndex += 1;
        this.playSingleWebAudioNote(freq, spec.tempoMs * 0.9, spec.waveform, spec.gain * scaleVol);
      };

      noteTick();
      this.loopTimer = setInterval(noteTick, Math.max(120, spec.tempoMs));

      try {
        const bgBridge = window.NoirStudio?.audioBackgroundBridge;
        if (bgBridge) {
          bgBridge.activateKeepAlive('alarm');
          bgBridge.syncMediaSession({
            sourceType: 'alarm',
            title: `⏰ Báo thức: ${spec.name}`,
            artist: 'Đồng Hồ & Báo Thức • Bi Light Novel Studio',
            album: 'Báo thức nền trên thiết bị',
            state: 'playing',
            handlers: {
              pause: () => this.stopAll(),
              stop: () => this.stopAll()
            }
          });
        }
      } catch (_err) {}

      if (autoStopAfterMs && autoStopAfterMs > 0) {
        this.previewStopTimer = setTimeout(() => {
          this.stopAll();
        }, autoStopAfterMs);
      }
      return { ok: true, mode: 'system', label: spec.name };
    }

    async startCustomMp3(volume, fallbackRingtoneId, autoStopAfterMs, overrideSrcUrl, overrideLabel) {
      this.stopAll();
      const targetUrl = overrideSrcUrl || this.customObjectUrl;
      if (!targetUrl) {
        return this.startSystemPattern(fallbackRingtoneId || 'sys_chime_gentle', volume, autoStopAfterMs);
      }

      try {
        const audio = new Audio(targetUrl);
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio.playsInline = true;
        audio.preload = 'auto';
        audio.loop = !autoStopAfterMs;
        audio.volume = Math.max(0.05, Math.min(1, Number(volume) || 0.85));
        this.activeHtmlAudio = audio;
        this.isPlaying = true;
        this.activeSourceLabel = overrideLabel || 'Chuông MP3 tự chọn';

        await audio.play();

        try {
          const bgBridge = window.NoirStudio?.audioBackgroundBridge;
          if (bgBridge) {
            bgBridge.activateKeepAlive('alarm');
            bgBridge.syncMediaSession({
              sourceType: 'alarm',
              title: `⏰ ${this.activeSourceLabel}`,
              artist: 'Chuông Báo Thức MP3 • Bi Studio',
              album: 'Báo thức nền trên thiết bị',
              state: 'playing',
              handlers: {
                pause: () => this.stopAll(),
                stop: () => this.stopAll()
              }
            });
          }
        } catch (_e) {}

        if (autoStopAfterMs && autoStopAfterMs > 0) {
          this.previewStopTimer = setTimeout(() => {
            this.stopAll();
          }, autoStopAfterMs);
        }
        return { ok: true, mode: 'custom_mp3', label: this.activeSourceLabel };
      } catch (_err) {
        return this.startSystemPattern(fallbackRingtoneId || 'sys_chime_gentle', volume, autoStopAfterMs);
      }
    }

    stopAll() {
      this.isPlaying = false;
      this.activeSourceLabel = '';
      if (this.loopTimer) {
        clearInterval(this.loopTimer);
        this.loopTimer = null;
      }
      if (this.previewStopTimer) {
        clearTimeout(this.previewStopTimer);
        this.previewStopTimer = null;
      }
      if (this.activeHtmlAudio) {
        try {
          this.activeHtmlAudio.pause();
          this.activeHtmlAudio.currentTime = 0;
        } catch (_err) {}
        this.activeHtmlAudio = null;
      }
      try {
        const bgBridge = window.NoirStudio?.audioBackgroundBridge;
        if (bgBridge) {
          bgBridge.deactivateKeepAlive('alarm');
          bgBridge.syncMediaSession({
            sourceType: 'alarm',
            title: 'Báo thức đã dừng',
            state: 'none'
          });
        }
      } catch (_err) {}
    }
  }

  /**
   * Dịch vụ tra cứu thời tiết trực tuyến (Open-Meteo, miễn phí 0 API Key)
   * + tìm kiếm địa danh toàn cầu + cache thông minh + mô phỏng ngoại tuyến.
   */
  class Mod42WeatherService {
    constructor() {
      this.cache = new Map();
    }

    makeCacheKey(lat, lon) {
      return `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`;
    }

    async fetchWeather(lat, lon, displayLocationName, zoneIana, forceRefresh) {
      const key = this.makeCacheKey(lat, lon);
      const cached = this.cache.get(key);
      if (!forceRefresh && cached && Date.now() - cached.fetchedAt < 10 * 60 * 1000) {
        if (displayLocationName && cached.locationName !== displayLocationName) {
          return { ...cached, locationName: displayLocationName };
        }
        return cached;
      }

      const params = new URLSearchParams({
        latitude: String(Number(lat) || 21.0285),
        longitude: String(Number(lon) || 105.8542),
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,wind_speed_10m,surface_pressure',
        hourly: 'temperature_2m,weather_code,precipitation_probability',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'auto',
        forecast_days: '5',
      });

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 5500) : null;

      try {
        const res = await fetch(`${OPEN_METEO_FORECAST_ENDPOINT}?${params.toString()}`, {
          method: 'GET',
          signal: controller ? controller.signal : undefined,
        });
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP_${res.status}`);
        const data = await res.json();
        if (!data || !data.current) throw new Error('INVALID_OPEN_METEO_PAYLOAD');

        const cur = data.current;
        const resolvedIana = data.timezone || zoneIana || 'Asia/Ho_Chi_Minh';
        const startAnchorMs = computeUpcomingHourlyStartMs(new Date(), resolvedIana);
        const startAnchor = resolveZonedCalendarClockParts(new Date(startAnchorMs), resolvedIana);
        const hourlyTimes = Array.isArray(data.hourly?.time) ? data.hourly.time : [];
        const hourlyTemps = Array.isArray(data.hourly?.temperature_2m) ? data.hourly.temperature_2m : [];
        const hourlyCodes = Array.isArray(data.hourly?.weather_code) ? data.hourly.weather_code : [];
        const hourlyProbs = Array.isArray(data.hourly?.precipitation_probability)
          ? data.hourly.precipitation_probability
          : [];

        // Tìm mốc giờ đầu tiên >= mốc giờ kế tiếp tại múi giờ mục tiêu, lấy 24 khung mỗi 1 tiếng
        let startIdx = hourlyTimes.findIndex((t) => String(t || '') >= startAnchor.isoHourPrefix);
        if (startIdx < 0) startIdx = 0;

        const hourly = [];
        for (let k = 0; k < 24 && startIdx + k < hourlyTimes.length; k += 1) {
          const idx = startIdx + k;
          const ts = String(hourlyTimes[idx] || '');
          const hhPart = ts.slice(11, 16) || `${pad2((startAnchor.hour + k) % 24)}:00`;
          const ddMm = ts.length >= 10 ? `${ts.slice(8, 10)}/${ts.slice(5, 7)}` : startAnchor.ddMm;
          hourly.push({
            timeLabel: hhPart,
            dateLabel: ddMm,
            displayLabel: ddMm ? `${hhPart} (${ddMm})` : hhPart,
            tempC: Number(hourlyTemps[idx] ?? cur.temperature_2m),
            code: Number(hourlyCodes[idx] ?? cur.weather_code),
            precipProb: Number(hourlyProbs[idx] ?? 0),
          });
        }

        const dailyDates = Array.isArray(data.daily?.time) ? data.daily.time : [];
        const dailyCodes = Array.isArray(data.daily?.weather_code) ? data.daily.weather_code : [];
        const dailyMax = Array.isArray(data.daily?.temperature_2m_max) ? data.daily.temperature_2m_max : [];
        const dailyMin = Array.isArray(data.daily?.temperature_2m_min) ? data.daily.temperature_2m_min : [];
        const dailyProb = Array.isArray(data.daily?.precipitation_probability_max)
          ? data.daily.precipitation_probability_max
          : [];

        const daily = dailyDates.slice(0, 5).map((isoDate, idx) => {
          const parts = String(isoDate).split('-');
          const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          const wd = VIETNAMESE_WEEKDAYS_SHORT[dObj.getDay()] || '';
          return {
            dayLabel: idx === 0 ? 'Hôm nay' : `${wd} ${parts[2]}/${parts[1]}`,
            code: Number(dailyCodes[idx] ?? cur.weather_code),
            minC: Math.round(Number(dailyMin[idx] ?? cur.temperature_2m - 3)),
            maxC: Math.round(Number(dailyMax[idx] ?? cur.temperature_2m + 3)),
            precipProb: Number(dailyProb[idx] ?? 0),
          };
        });

        const parsed = {
          sourceMode: 'open_meteo_live',
          sourceLabel: 'Thời tiết thực (Open-Meteo Realtime)',
          locationName: displayLocationName || data.timezone || 'Khu vực đang chọn',
          zoneIana: data.timezone || zoneIana || 'Asia/Ho_Chi_Minh',
          lat: Number(lat),
          lon: Number(lon),
          fetchedAt: Date.now(),
          current: {
            tempC: Number(cur.temperature_2m),
            feelsLikeC: Number(cur.apparent_temperature ?? cur.temperature_2m),
            humidity: Number(cur.relative_humidity_2m ?? 70),
            windKmh: Number(cur.wind_speed_10m ?? 10),
            cloudCover: Number(cur.cloud_cover ?? 35),
            pressureHpa: Number(cur.surface_pressure ?? 1013),
            weatherCode: Number(cur.weather_code ?? 1),
            isDay: Number(cur.is_day ?? 1) === 1,
          },
          hourly,
          daily,
        };

        this.cache.set(key, parsed);
        return parsed;
      } catch (_err) {
        if (timer) clearTimeout(timer);
        const fallback = buildOfflineWeatherSnapshot(lat, lon, displayLocationName, zoneIana);
        this.cache.set(key, fallback);
        return fallback;
      }
    }

    async searchCities(query) {
      const q = String(query || '').trim();
      if (!q) return [];
      const norm = stripVietnameseToneMarks(q);

      // Ưu tiên khớp nhanh danh sách thành phố có sẵn để phản hồi tức thì kể cả offline
      const localMatches = INTERNATIONAL_TIMEZONE_CATALOG.filter((z) =>
        stripVietnameseToneMarks(`${z.cityVi} ${z.countryVi} ${z.labelVi} ${z.keywords}`).includes(norm)
      ).map((z) => ({
        name: `${z.flag} ${z.cityVi}, ${z.countryVi}`,
        lat: z.lat,
        lon: z.lon,
        iana: z.iana,
        zoneId: z.id,
        fromLocal: true,
      }));

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 4500) : null;
      try {
        const params = new URLSearchParams({
          name: q,
          count: '5',
          language: 'vi',
          format: 'json',
        });
        const res = await fetch(`${OPEN_METEO_GEOCODE_ENDPOINT}?${params.toString()}`, {
          method: 'GET',
          signal: controller ? controller.signal : undefined,
        });
        if (timer) clearTimeout(timer);
        if (!res.ok) return localMatches;
        const json = await res.json();
        const remoteResults = Array.isArray(json?.results)
          ? json.results.map((r) => ({
              name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
              lat: Number(r.latitude),
              lon: Number(r.longitude),
              iana: r.timezone || 'UTC',
              zoneId: null,
              fromLocal: false,
            }))
          : [];
        return remoteResults.length ? remoteResults : localMatches;
      } catch (_err) {
        if (timer) clearTimeout(timer);
        return localMatches;
      }
    }
  }

  /**
   * Hàm dựng giao diện HTML từng phân khu trong cửa sổ Module 42.
   * Giữ code kết xuất tách biệt, dễ bảo trì và chuẩn dark/light mode của Studio.
   */
  function buildTimezoneTabPanelHtml(state, controller) {
    const now = new Date();
    const activeZone = controller.getActiveZoneEntry();
    const parts = controller.getCurrentZonedParts(now);
    const heroTimeText = `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
    const heroDateText = formatLocalizedHeroDateLine(parts);
    const localizedZoneLabel = localizeZoneLabelText(parts.zoneLabel);
    const fullFormatted = formatLocalizedZonedClockString(parts, state.dateFormatId);

    const searchNorm = stripVietnameseToneMarks(controller.tzSearchQuery || '');
    const filteredZones = INTERNATIONAL_TIMEZONE_CATALOG.filter((z) => {
      if (controller.tzRegionFilter !== 'ALL' && z.region !== controller.tzRegionFilter) {
        return false;
      }
      if (!searchNorm) return true;
      const hay = stripVietnameseToneMarks(
        `${z.labelVi} ${z.cityVi} ${z.countryVi} ${z.iana} ${z.keywords}`
      );
      return searchNorm.split(/\s+/).every((tok) => hay.includes(tok));
    });

    const fixedGmtOptions = [];
    for (let h = -11; h <= 14; h++) {
      const mins = h * 60;
      const sign = h >= 0 ? `+${h}` : `${h}`;
      const selected = state.customOffsetMinutes === mins ? 'selected' : '';
      fixedGmtOptions.push(`<option value="${mins}" ${selected}>GMT ${sign} (Cố định theo UTC)</option>`);
    }

    const regionButtons = [
      { key: 'ALL', label: '🌐 Tất cả' },
      { key: 'Asia', label: '🌏 Châu Á' },
      { key: 'Europe', label: '🌍 Châu Âu' },
      { key: 'Americas', label: '🌎 Châu Mỹ' },
      { key: 'Oceania', label: '🌊 Châu Úc' },
      { key: 'Africa', label: '🦁 Châu Phi' },
    ]
      .map((rg) => {
        const isActive = controller.tzRegionFilter === rg.key;
        return `<button type="button" data-mod42-region="${rg.key}" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
          isActive
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
        }">${rg.label}</button>`;
      })
      .join('');

    const zoneCardsHtml = filteredZones
      .map((z) => {
        const zParts = resolveZonedParts(now, z, null);
        const zTime = `${pad2(zParts.hour)}:${pad2(zParts.minute)}:${pad2(zParts.second)}`;
        const zDate =
          typeof NS.i18n?.formatMonthDay === 'function'
            ? NS.i18n.formatMonthDay({ year: zParts.year, month: zParts.month, day: zParts.day })
            : `${pad2(zParts.day)}/${pad2(zParts.month)}`;
        const isSelected = state.customOffsetMinutes === null && state.timezoneId === z.id;
        const zLocLabel = localizeZoneLabelText(z.labelVi);
        const zLocCity = NS.i18n?.translateText?.(z.cityVi) || z.cityVi;
        const zLocCountry = NS.i18n?.translateText?.(z.countryVi) || z.countryVi;
        return `
          <button type="button" data-mod42-select-zone="${escapeHtml(z.id)}" class="text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
            isSelected
              ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-400/50'
              : 'border-zinc-300/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 hover:border-emerald-500/50'
          }">
            <div class="min-w-0">
              <div class="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 leading-snug break-words" data-i18n-ignore="true">${escapeHtml(z.flag)} ${escapeHtml(zLocLabel)}</div>
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug break-words" data-i18n-ignore="true">${escapeHtml(zLocCity)} · ${escapeHtml(zLocCountry)}</div>
              <div class="text-[10px] font-monoCode text-amber-700 dark:text-amber-300">${escapeHtml(zParts.gmtText)} · ${escapeHtml(z.iana)}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-black font-monoCode text-emerald-700 dark:text-emerald-300">${zTime}</div>
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400" data-i18n-ignore="true">${zDate}</div>
            </div>
          </button>
        `;
      })
      .join('');

    const formatOptionsHtml = DATE_FORMAT_CATALOG.map((fmt) => {
      const isSelected = state.dateFormatId === fmt.id;
      const preview = formatLocalizedZonedClockString(parts, fmt.id);
      return `
        <button type="button" data-mod42-select-format="${escapeHtml(fmt.id)}" class="w-full text-left p-2.5 rounded-xl border transition ${
          isSelected
            ? 'border-amber-500 bg-amber-500/15'
            : 'border-zinc-300/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:border-amber-500/50'
        }">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-zinc-800 dark:text-zinc-100">${escapeHtml(fmt.label)}</span>
            ${isSelected ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">Đang dùng</span>' : ''}
          </div>
          <div class="mt-1 text-[11px] font-monoCode text-emerald-700 dark:text-emerald-300 break-all" data-i18n-ignore="true">${escapeHtml(preview)}</div>
          <div class="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">${escapeHtml(fmt.description)}</div>
        </button>
      `;
    }).join('');

    const worldCompareHtml = state.pinnedCompareIds
      .map((zid) => INTERNATIONAL_TIMEZONE_CATALOG.find((item) => item.id === zid))
      .filter(Boolean)
      .map((z) => {
        const zp = resolveZonedParts(now, z, null);
        const hDiff = Math.round(((zp.offsetMinutes - parts.offsetMinutes) / 60) * 10) / 10;
        const diffBadge =
          hDiff === 0 ? (NS.i18n?.translateText?.('Cùng giờ') || 'Cùng giờ') : hDiff > 0 ? `+${hDiff}h` : `${hDiff}h`;
        const cmpDate =
          typeof NS.i18n?.formatMonthDay === 'function'
            ? NS.i18n.formatMonthDay({ year: zp.year, month: zp.month, day: zp.day })
            : `${pad2(zp.day)}/${pad2(zp.month)}`;
        return `
          <div class="p-2 rounded-xl border border-zinc-300/80 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/70 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="text-[11px] font-bold text-zinc-800 dark:text-zinc-100 leading-snug break-words" data-i18n-ignore="true">${escapeHtml(z.flag)} ${escapeHtml(NS.i18n?.translateText?.(z.cityVi) || z.cityVi)}</div>
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400" data-i18n-ignore="true">${escapeHtml(zp.gmtText)} · ${escapeHtml(diffBadge)}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-xs font-extrabold font-monoCode text-sky-700 dark:text-sky-300">${pad2(zp.hour)}:${pad2(zp.minute)}</div>
              <div class="text-[9.5px] text-zinc-500 dark:text-zinc-400" data-i18n-ignore="true">${cmpDate}</div>
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="space-y-4">
        <!-- Thẻ Đồng Hồ Chính Đang Hiển Thị Trên Header -->
        <div class="p-3.5 sm:p-4 rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Đang hiển thị trên thanh đầu trang</div>
              <div id="mod42-modal-hero-time" data-i18n-ignore="true" class="text-2xl sm:text-3xl font-black font-monoCode tracking-tight text-zinc-900 dark:text-white mt-0.5">${heroTimeText}</div>
              <div id="mod42-modal-hero-date" data-i18n-ignore="true" class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">${escapeHtml(heroDateText)} · ${escapeHtml(parts.gmtText)} (${escapeHtml(localizedZoneLabel)})</div>
              <div id="mod42-modal-hero-formatted" data-i18n-ignore="true" class="mt-1.5 inline-block px-2 py-0.5 rounded-lg bg-black/5 dark:bg-black/35 border border-zinc-300/60 dark:border-zinc-700 text-[11px] font-monoCode text-amber-700 dark:text-amber-300 break-all">${escapeHtml(fullFormatted)}</div>
            </div>
            <div class="flex flex-col gap-1.5 sm:items-end shrink-0">
              <button type="button" id="mod42-btn-reset-vn-default" class="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition">🇻🇳 Về mặc định Giờ Hà Nội (GMT +7)</button>
            </div>
          </div>
        </div>

        <!-- Đối chiếu múi giờ toàn cầu (Mặc định thu gọn để tối ưu giao diện) -->
        <div class="p-3 rounded-2xl border border-zinc-300/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">🌐 Đối Chiếu Giờ Quốc Tế Nhanh</h3>
              <span class="text-[10px] text-zinc-500 dark:text-zinc-400">Giờ tại các thị trường Light Novel & WebNovel lớn</span>
            </div>
            <button type="button" id="btn-mod42-toggle-world-compare" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10.5px] font-bold text-zinc-700 dark:text-zinc-200 hover:border-emerald-500 transition">${controller.showWorldCompare ? '▲ Thu gọn' : '▼ Mở rộng'}</button>
          </div>
          <div id="mod42-world-compare-grid" class="${controller.showWorldCompare ? '' : 'hidden '}grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            ${worldCompareHtml}
          </div>
        </div>

        <!-- Chia 2 cột: Cột chọn Múi giờ & Cột chọn Định dạng ngày giờ (Có nút Thu gọn / Mở rộng) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div class="lg:col-span-7 space-y-2.5 p-3 rounded-2xl border border-zinc-300/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-xs font-extrabold text-zinc-800 dark:text-zinc-100">🗺️ Chọn Múi Giờ Quốc Tế (GMT -11 đến +14)</h3>
              <button type="button" id="btn-mod42-toggle-tz-picker" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10.5px] font-bold text-zinc-700 dark:text-zinc-200 hover:border-emerald-500 transition">${controller.showTzPicker ? '▲ Thu gọn' : '▼ Mở rộng'}</button>
            </div>
            <div id="mod42-tz-picker-body" class="${controller.showTzPicker ? '' : 'hidden '}space-y-2.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <select id="mod42-fixed-gmt-select" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-monoCode text-zinc-800 dark:text-zinc-200">
                  <option value="AUTO" ${state.customOffsetMinutes === null ? 'selected' : ''}>Theo thành phố / IANA chuẩn</option>
                  ${fixedGmtOptions.join('')}
                </select>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <input type="text" id="mod42-tz-search-input" value="${escapeHtml(controller.tzSearchQuery || '')}" placeholder="🔍 Tìm thành phố, quốc gia hoặc GMT +9, New York, Tokyo..." class="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-500" />
              </div>
              <div class="flex flex-wrap gap-1">${regionButtons}</div>
              <div id="mod42-tz-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                ${zoneCardsHtml || '<div class="col-span-full text-xs text-zinc-500 py-4 text-center">Không tìm thấy múi giờ phù hợp từ khóa.</div>'}
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 space-y-2.5 p-3 rounded-2xl border border-zinc-300/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-xs font-extrabold text-zinc-800 dark:text-zinc-100">📅 Định Dạng Ngày &amp; Giờ</h3>
              <button type="button" id="btn-mod42-toggle-format-picker" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10.5px] font-bold text-zinc-700 dark:text-zinc-200 hover:border-emerald-500 transition">${controller.showFormatPicker ? '▲ Thu gọn' : '▼ Mở rộng'}</button>
            </div>
            <div id="mod42-format-list" class="${controller.showFormatPicker ? '' : 'hidden '}space-y-2 max-h-80 overflow-y-auto pr-1">
              ${formatOptionsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function buildWeatherTabPanelHtml(state, controller) {
    const targetLoc =
      typeof controller.getEffectiveWeatherTarget === 'function'
        ? controller.getEffectiveWeatherTarget()
        : (() => {
            const activeZone = controller.getActiveZoneEntry();
            const override = state.weatherCityOverride;
            return {
              lat: override?.lat ?? activeZone.lat,
              lon: override?.lon ?? activeZone.lon,
              name: override?.name || `${activeZone.flag} ${activeZone.cityVi}, ${activeZone.countryVi}`,
              iana: override?.iana ?? activeZone.iana,
              isOverridden: Boolean(override),
            };
          })();
    const cachedSnap = controller.latestWeatherSnapshot;
    const snapMatchesTarget =
      cachedSnap &&
      Math.abs(Number(cachedSnap.lat) - Number(targetLoc.lat)) <= 0.05 &&
      Math.abs(Number(cachedSnap.lon) - Number(targetLoc.lon)) <= 0.05 &&
      cachedSnap.locationName === targetLoc.name;
    const snap = snapMatchesTarget
      ? cachedSnap
      : buildOfflineWeatherSnapshot(targetLoc.lat, targetLoc.lon, targetLoc.name, targetLoc.iana);
    const meta = lookupWmoWeatherMeta(snap.current.weatherCode);
    const tempUnit = state.tempUnit === 'F' ? 'F' : 'C';

    const hourlyHtml = (snap.hourly || [])
      .map((slot) => {
        const m = lookupWmoWeatherMeta(slot.code);
        return `
          <div class="p-2 rounded-xl border border-zinc-300/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 text-center flex flex-col items-center gap-0.5 min-w-[82px] shrink-0">
            <span class="text-[10.5px] font-monoCode font-extrabold text-zinc-700 dark:text-zinc-200">${escapeHtml(slot.timeLabel)}</span>
            ${slot.dateLabel ? `<span class="text-[9.5px] font-monoCode text-zinc-500 dark:text-zinc-400">(${escapeHtml(slot.dateLabel)})</span>` : ''}
            <span class="text-base">${m.icon}</span>
            <span class="text-xs font-extrabold text-zinc-800 dark:text-zinc-100">${convertCelsius(slot.tempC, tempUnit)}</span>
            <span class="text-[9.5px] text-sky-600 dark:text-sky-300">💧 ${Math.round(slot.precipProb)}%</span>
          </div>
        `;
      })
      .join('');

    const dailyHtml = (snap.daily || [])
      .map((day) => {
        const m = lookupWmoWeatherMeta(day.code);
        return `
          <div class="p-2.5 rounded-xl border border-zinc-300/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-lg shrink-0">${m.icon}</span>
              <div class="min-w-0">
                <div class="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate" data-i18n-ignore="true">${escapeHtml(formatLocalizedWeatherDayLabel(day.dayLabel))}</div>
                <div class="text-[10px] text-zinc-500 dark:text-zinc-400 truncate" data-i18n-ignore="true">${escapeHtml(NS.i18n?.translateText?.(m.labelVi) || m.labelVi)}</div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-xs font-extrabold font-monoCode text-amber-700 dark:text-amber-300">${convertCelsiusNumber(day.minC, tempUnit)}° – ${convertCelsiusNumber(day.maxC, tempUnit)}°${tempUnit}</div>
              <div class="text-[10px] text-sky-600 dark:text-sky-300" data-i18n-ignore="true">${escapeHtml(NS.i18n?.translateText?.(`Mưa ${Math.round(day.precipProb)}%`) || `Mưa ${Math.round(day.precipProb)}%`)}</div>
            </div>
          </div>
        `;
      })
      .join('');

    const searchResultsHtml = (controller.weatherSearchResults || [])
      .map(
        (res, idx) => `
          <button type="button" data-mod42-pick-weather-city="${idx}" class="px-2.5 py-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-[11px] font-bold text-sky-700 dark:text-sky-200 transition text-left">
            📍 ${escapeHtml(res.name)}
          </button>
        `
      )
      .join('');

    return `
      <div class="space-y-4">
        <!-- Thanh tìm kiếm địa điểm & chuyển đơn vị °C / °F -->
        <div class="flex flex-col sm:flex-row gap-2">
          <div class="flex-1 flex gap-1.5">
            <input type="text" id="mod42-weather-city-input" value="${escapeHtml(controller.weatherSearchQuery || '')}" placeholder="🔍 Nhập tên thành phố xem thời tiết (VD: Hà Nội, Tokyo, Đà Lạt, Paris)..." class="flex-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-sky-500" />
            <button type="button" id="mod42-btn-search-weather" class="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shrink-0">Tìm nơi</button>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" id="mod42-btn-toggle-temp-unit" class="px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-xs font-extrabold text-zinc-800 dark:text-zinc-100 transition">Đơn vị: °${tempUnit}</button>
            <button type="button" id="mod42-btn-refresh-weather" class="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition">${controller.isWeatherLoading ? '⏳ Đang tải...' : '🔄 Cập nhật'}</button>
            ${
              targetLoc.isOverridden
                ? '<button type="button" id="mod42-btn-weather-follow-tz" class="px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-[11px] font-bold text-amber-700 dark:text-amber-300">Theo múi giờ</button>'
                : ''
            }
          </div>
        </div>

        ${
          searchResultsHtml
            ? `<div class="flex flex-wrap gap-1.5 p-2 rounded-xl border border-sky-500/30 bg-sky-500/5">${searchResultsHtml}</div>`
            : ''
        }

        <!-- Hero Thời Tiết Hiện Tại -->
        <div id="mod42-weather-hero-card" class="p-4 rounded-2xl border border-sky-500/35 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-3xl shrink-0">${meta.icon}</div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-sm font-extrabold text-zinc-900 dark:text-white" data-i18n-ignore="true">${escapeHtml(NS.i18n?.translateText?.(snap.locationName) || snap.locationName)}</h3>
                  ${
                    targetLoc.isGps
                      ? `<span id="mod42-gps-user-where-pill" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40" data-i18n-ignore="true">${escapeHtml(NS.i18n?.translateText?.('🧭 Bạn đang ở:') || '🧭 Bạn đang ở:')} ${escapeHtml(String(snap.locationName || '').replace(/^📍\s*/, ''))}</span>`
                      : ''
                  }
                </div>
                <div class="text-xs font-bold text-sky-700 dark:text-sky-300 mt-0.5" data-i18n-ignore="true">${escapeHtml(NS.i18n?.translateText?.(meta.labelVi) || meta.labelVi)} · ${escapeHtml(NS.i18n?.translateText?.(meta.moodTag) || meta.moodTag)}</div>
                <div class="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1" data-i18n-ignore="true">${escapeHtml(NS.i18n?.translateText?.('✍️ Gợi ý sáng tác:') || '✍️ Gợi ý sáng tác:')} ${escapeHtml(NS.i18n?.translateText?.(meta.writingTip) || meta.writingTip)}</div>
              </div>
            </div>
            <div class="text-left sm:text-right shrink-0">
              <div id="mod42-weather-current-temp" class="text-3xl font-black font-monoCode text-zinc-900 dark:text-white">${convertCelsius(snap.current.tempC, tempUnit)}</div>
              <div class="text-[11px] text-zinc-600 dark:text-zinc-300" data-i18n-ignore="true">${escapeHtml(NS.i18n?.translateText?.('Cảm giác như') || 'Cảm giác như')} ${convertCelsius(snap.current.feelsLikeC, tempUnit)}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-zinc-300/60 dark:border-zinc-800/80 text-xs">
            <div class="p-2 rounded-xl bg-white/60 dark:bg-zinc-900/60">
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400">💧 Độ ẩm</div>
              <div class="font-extrabold text-zinc-800 dark:text-zinc-100">${Math.round(snap.current.humidity)}%</div>
            </div>
            <div class="p-2 rounded-xl bg-white/60 dark:bg-zinc-900/60">
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400">💨 Sức gió</div>
              <div class="font-extrabold text-zinc-800 dark:text-zinc-100">${Number(snap.current.windKmh).toFixed(1)} km/h</div>
            </div>
            <div class="p-2 rounded-xl bg-white/60 dark:bg-zinc-900/60">
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400">☁️ Mây che phủ</div>
              <div class="font-extrabold text-zinc-800 dark:text-zinc-100">${Math.round(snap.current.cloudCover)}%</div>
            </div>
            <div class="p-2 rounded-xl bg-white/60 dark:bg-zinc-900/60">
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400">🧭 Áp suất</div>
              <div class="font-extrabold text-zinc-800 dark:text-zinc-100">${Math.round(snap.current.pressureHpa)} hPa</div>
            </div>
          </div>
        </div>

        <!-- Theo giờ: 24 tiếng gần nhất mỗi 1 tiếng (Có nút Thu gọn / Mở rộng) -->
        <div class="p-3 rounded-2xl border border-zinc-300/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">⏱️ Dự Báo Ngắn Hạn 24 Giờ Tới (Mỗi 1 Tiếng)</h4>
            <button type="button" id="btn-mod42-toggle-weather-hourly" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10.5px] font-bold text-zinc-700 dark:text-zinc-200 hover:border-sky-500 transition">${controller.showWeatherHourly ? '▲ Thu gọn' : '▼ Mở rộng'}</button>
          </div>
          <div id="mod42-weather-hourly-body" class="${controller.showWeatherHourly ? '' : 'hidden '}flex gap-2 overflow-x-auto pb-1">${hourlyHtml}</div>
        </div>

        <!-- 5 ngày tới (Có nút Thu gọn / Mở rộng) -->
        <div class="p-3 rounded-2xl border border-zinc-300/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">📆 Xu Hướng 5 Ngày Tới</h4>
            <button type="button" id="btn-mod42-toggle-weather-daily" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10.5px] font-bold text-zinc-700 dark:text-zinc-200 hover:border-sky-500 transition">${controller.showWeatherDaily ? '▲ Thu gọn' : '▼ Mở rộng'}</button>
          </div>
          <div id="mod42-weather-daily-body" class="${controller.showWeatherDaily ? '' : 'hidden '}grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">${dailyHtml}</div>
        </div>

        <!-- Module 43: Mô phỏng bầu trời 6 khung giờ × 28 thời tiết WMO & Nền Website Real-Time -->
        <div id="mod43-inline-weather-mount" class="mt-4"></div>
      </div>
    `;
  }

  function buildAlarmTabPanelHtml(state, controller) {
    const nowParts = controller.getCurrentZonedParts(new Date());
    const draft = controller.alarmDraft || {};
    const mp3Meta = state.customMp3Meta || { hasAudio: false, fileName: '', sizeBytes: 0 };
    const tab5Mp3 = controller.ringtoneEngine.resolveTab5LoadedMp3Source();

    const sysOptionsHtml = SYSTEM_RINGTONES.map((r) => {
      const selected = (draft.systemRingtoneId || state.defaultSystemRingtoneId) === r.id ? 'selected' : '';
      return `<option value="${escapeHtml(r.id)}" ${selected}>${escapeHtml(r.name)}</option>`;
    }).join('');

    const alarmsListHtml =
      state.alarms && state.alarms.length
        ? state.alarms
            .map((alarm) => {
              const countdown = computeAlarmCountdownParts(alarm, nowParts);
              const toneLabel =
                alarm.ringtoneMode === 'custom_mp3'
                  ? `🎵 MP3 tự chọn (${mp3Meta.fileName || 'Chưa có file — tự dùng chuông hệ thống'})`
                  : SYSTEM_RINGTONES.find((s) => s.id === alarm.systemRingtoneId)?.name ||
                    SYSTEM_RINGTONES[0].name;
              const repeatLabel =
                alarm.repeatMode === 'daily'
                  ? 'Hàng ngày'
                  : alarm.repeatMode === 'weekdays'
                    ? 'Thứ 2 – Thứ 6'
                    : '1 lần';
              const targetDateBadge = alarm.targetDate
                ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-400/50 text-amber-700 dark:text-amber-300">📅 ${escapeHtml(alarm.targetDate.split('-').reverse().join('/'))}</span>`
                : '';
              return `
                <div class="p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                  alarm.enabled
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-zinc-300/80 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 opacity-75'
                }">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-lg font-black font-monoCode text-zinc-900 dark:text-white">${pad2(alarm.hour)}:${pad2(alarm.minute)}:${pad2(alarm.second)}</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">${repeatLabel}</span>
                      ${targetDateBadge}
                      ${
                        alarm.enabled
                          ? `<span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-300" data-mod42-countdown="${escapeHtml(alarm.id)}">⏳ ${escapeHtml(countdown.label)}</span>`
                          : '<span class="text-[10px] text-zinc-500">Đã tắt</span>'
                      }
                    </div>
                    <div class="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">${escapeHtml(alarm.label || 'Nhắc nhở từ Studio')}</div>
                    <div class="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">${escapeHtml(toneLabel)}</div>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" data-mod42-test-alarm="${escapeHtml(alarm.id)}" class="px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-bold">🔔 Thử</button>
                    <button type="button" data-mod42-toggle-alarm="${escapeHtml(alarm.id)}" class="px-2.5 py-1 rounded-lg border ${
                      alarm.enabled
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    } text-[11px] font-bold">${alarm.enabled ? 'Đang bật' : 'Đã tắt'}</button>
                    <button type="button" data-mod42-delete-alarm="${escapeHtml(alarm.id)}" class="px-2 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] font-bold" title="Xóa báo thức">🗑️</button>
                  </div>
                </div>
              `;
            })
            .join('')
        : '<div class="p-4 rounded-xl border border-dashed border-zinc-400/50 dark:border-zinc-700 text-center text-xs text-zinc-500 dark:text-zinc-400">Chưa có báo thức nào. Hãy nhập mốc giờ (VD: 09:00) bên trên để tạo mới!</div>';

    return `
      <div class="space-y-4">
        <!-- Trình tạo báo thức theo mốc giờ cụ thể (Giây tùy chọn, bỏ trống mặc định :00) -->
        <div class="p-3.5 rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-xs font-extrabold text-zinc-900 dark:text-white" data-i18n-ignore="true">${escapeHtml(NS.i18n?.translateText?.('⏰ Tạo Báo Thức Theo Mốc Giờ') || '⏰ Tạo Báo Thức Theo Mốc Giờ')} (${escapeHtml(nowParts.gmtText)} · ${escapeHtml(localizeZoneLabelText(nowParts.zoneLabel))})</h3>
              <p class="text-[11px] text-zinc-600 dark:text-zinc-400">Giờ hiện tại theo múi giờ đang chọn: <strong class="font-monoCode text-emerald-700 dark:text-emerald-300" id="mod42-alarm-clock-ref">${pad2(nowParts.hour)}:${pad2(nowParts.minute)}:${pad2(nowParts.second)}</strong></p>
            </div>
            <div class="flex flex-wrap gap-1">
              <button type="button" data-mod42-quick-offset="1" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10px] font-bold hover:border-amber-500">+1 phút</button>
              <button type="button" data-mod42-quick-offset="5" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10px] font-bold hover:border-amber-500">+5 phút</button>
              <button type="button" data-mod42-quick-fixed="09:00" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10px] font-bold hover:border-amber-500">09:00</button>
              <button type="button" data-mod42-quick-fixed="14:00" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10px] font-bold hover:border-amber-500">14:00</button>
              <button type="button" data-mod42-quick-fixed="21:30" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-[10px] font-bold hover:border-amber-500">21:30</button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div class="sm:col-span-2">
              <label for="mod42-alarm-hour" class="block text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300 mb-1">Giờ (00–23)</label>
              <input id="mod42-alarm-hour" type="number" min="0" max="23" value="${escapeHtml(draft.hour ?? '09')}" placeholder="09" class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-black font-monoCode text-center text-zinc-900 dark:text-white" />
            </div>
            <div class="sm:col-span-2">
              <label for="mod42-alarm-minute" class="block text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300 mb-1">Phút (00–59)</label>
              <input id="mod42-alarm-minute" type="number" min="0" max="59" value="${escapeHtml(draft.minute ?? '00')}" placeholder="00" class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-black font-monoCode text-center text-zinc-900 dark:text-white" />
            </div>
            <div class="sm:col-span-3">
              <label for="mod42-alarm-second" class="block text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300 mb-1">Giây (Tùy chọn → mặc định 00)</label>
              <input id="mod42-alarm-second" type="number" min="0" max="59" value="${escapeHtml(draft.second ?? '')}" placeholder="00 (bỏ trống = :00)" class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-black font-monoCode text-center text-zinc-900 dark:text-white" />
            </div>
            <div class="sm:col-span-3">
              <label for="mod42-alarm-label" class="block text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300 mb-1">Nhãn nhắc nhở</label>
              <input id="mod42-alarm-label" type="text" value="${escapeHtml(draft.label ?? 'Đến giờ viết chương mới!')}" placeholder="VD: Đến giờ đăng chương..." class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white" />
            </div>
            <div class="sm:col-span-2">
              <label for="mod42-alarm-repeat" class="block text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300 mb-1">Lặp lại</label>
              <select id="mod42-alarm-repeat" class="w-full px-2 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white">
                <option value="daily" ${(draft.repeatMode || 'daily') === 'daily' ? 'selected' : ''}>Hàng ngày</option>
                <option value="once" ${draft.repeatMode === 'once' ? 'selected' : ''}>1 lần</option>
                <option value="weekdays" ${draft.repeatMode === 'weekdays' ? 'selected' : ''}>T2 – T6</option>
              </select>
            </div>
          </div>

          <!-- Chọn ngày báo thức cụ thể (Tùy chọn cho báo thức hẹn ngày) -->
          <div class="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 text-[11px]">
            <label for="mod42-alarm-date" class="font-extrabold text-amber-800 dark:text-amber-200 flex items-center gap-1">
              <span>📅 Ngày báo thức:</span>
            </label>
            <input
              id="mod42-alarm-date"
              type="date"
              value="${escapeHtml(draft.targetDate || '')}"
              class="px-2.5 py-1 rounded-lg border border-amber-400/60 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white"
            />
            <button type="button" id="mod42-btn-date-today" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 hover:border-emerald-500 text-[10.5px] font-bold cursor-pointer">Hôm nay</button>
            <button type="button" id="mod42-btn-date-tomorrow" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 hover:border-emerald-500 text-[10.5px] font-bold cursor-pointer">Ngày mai</button>
            <button type="button" id="mod42-btn-date-clear" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 hover:border-rose-500 text-[10.5px] font-bold cursor-pointer">Mọi ngày</button>
            <span class="text-[10px] text-zinc-600 dark:text-zinc-400">(Chọn ngày cụ thể sẽ tự chuyển sang hẹn đúng ngày đó)</span>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
            <span>Hoặc gõ nhanh:</span>
            <input id="mod42-alarm-quick-str" type="text" placeholder="VD: 09:00 hoặc 09:00:30" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-monoCode w-44 text-zinc-800 dark:text-zinc-100" />
            <button type="button" id="mod42-btn-apply-quick-str" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-xs font-bold">Điền vào ô trên</button>
          </div>

          <!-- Chọn tiếng chuông hệ thống hoặc MP3 tự chọn -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-zinc-300/60 dark:border-zinc-800">
            <div class="p-2.5 rounded-xl border border-zinc-300/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <label class="flex items-center gap-2 text-xs font-extrabold text-zinc-800 dark:text-zinc-100 cursor-pointer">
                  <input type="radio" name="mod42-ringtone-mode" value="system" ${(draft.ringtoneMode || state.defaultRingtoneType) === 'system' ? 'checked' : ''} />
                  <span>🔔 Chuông Mặc Định Hệ Thống</span>
                </label>
                <div class="flex items-center gap-1">
                  <button type="button" id="mod42-btn-preview-system" class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold">▶ Nghe thử</button>
                  <button type="button" id="mod42-btn-stop-preview" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold">⏹️ Dừng</button>
                </div>
              </div>
              <select id="mod42-system-ringtone-select" class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                ${sysOptionsHtml}
              </select>
            </div>

            <div class="p-2.5 rounded-xl border border-zinc-300/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <label class="flex items-center gap-2 text-xs font-extrabold text-zinc-800 dark:text-zinc-100 cursor-pointer">
                  <input type="radio" name="mod42-ringtone-mode" value="custom_mp3" ${(draft.ringtoneMode || state.defaultRingtoneType) === 'custom_mp3' ? 'checked' : ''} />
                  <span>🎵 Chuông Tự Chọn Từ File MP3</span>
                </label>
                ${
                  mp3Meta.hasAudio
                    ? '<button type="button" id="mod42-btn-preview-mp3" class="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold">▶ Thử MP3</button>'
                    : ''
                }
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <input type="file" id="mod42-mp3-upload-input" accept=".mp3,audio/*" class="hidden" />
                <button type="button" id="mod42-btn-pick-mp3" class="px-2.5 py-1.5 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300">📂 Chọn file .MP3 từ máy</button>
                ${
                  tab5Mp3
                    ? '<button type="button" id="mod42-btn-reuse-tab5-mp3" class="px-2.5 py-1.5 rounded-xl border border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20 text-[11px] font-bold text-sky-700 dark:text-sky-300">🎧 Dùng MP3 ở Tab 5</button>'
                    : ''
                }
                ${
                  mp3Meta.hasAudio
                    ? '<button type="button" id="mod42-btn-clear-mp3" class="px-2 py-1.5 rounded-xl border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold">Xóa MP3</button>'
                    : ''
                }
              </div>
              <div id="mod42-mp3-status-text" class="text-[10.5px] text-zinc-600 dark:text-zinc-400 leading-snug break-words">
                ${
                  mp3Meta.hasAudio
                    ? `✅ Đã nạp: <strong>${escapeHtml(mp3Meta.fileName)}</strong> (${formatBytesHuman(mp3Meta.sizeBytes)})`
                    : 'Chưa chọn file MP3 riêng — nếu chọn chế độ MP3 mà chưa nạp file sẽ dùng chuông hệ thống dự phòng.'
                }
              </div>
            </div>
          </div>

          <div id="mod42-alarm-feedback" class="hidden text-xs font-bold px-3 py-2 rounded-xl"></div>

          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <span>🔊 Âm lượng:</span>
              <input id="mod42-alarm-volume-range" type="range" min="10" max="100" value="${Math.round((Number(state.alarmVolume) || 0.85) * 100)}" class="w-24 accent-emerald-500" />
              <span id="mod42-alarm-volume-label" class="font-monoCode font-bold">${Math.round((Number(state.alarmVolume) || 0.85) * 100)}%</span>
            </div>
            <button type="button" id="mod42-btn-add-alarm" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow transition">➕ Lưu &amp; Bật Báo Thức</button>
          </div>
        </div>

        <!-- Danh sách các báo thức đang quản lý -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">📋 Danh Sách Báo Thức (${(state.alarms || []).length})</h4>
            <button type="button" id="mod42-btn-stop-all-audio" class="px-2.5 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-bold">🔕 Tắt mọi chuông đang kêu</button>
          </div>
          <div id="mod42-alarms-list" class="space-y-2">
            ${alarmsListHtml}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Bộ điều khiển trung tâm Module 42:
   * - Giữ đồng hồ Header chạy mượt từng giây (DD/MM/YYYY HH:mm:ss, GMT +X)
   * - Ngăn click từ link gạch chân tràn sang modal Lưu tự động của Mod 09
   * - Mở / Đóng cửa sổ (có nút X góc trên bên phải) bất kỳ lúc nào
   * - Điều phối 3 phân khu: Múi giờ & Định dạng / Thời tiết / Báo thức (MP3 & Hệ thống)
   */
  class Mod42WorldClockWeatherAlarmController {
    constructor() {
      this.initialized = false;
      this.modalOpen = false;
      this.activeModalTab = 'timezone'; // 'timezone' | 'weather' | 'alarm'
      this.tzRegionFilter = 'ALL';
      this.tzSearchQuery = '';
      this.weatherSearchQuery = '';
      this.weatherSearchResults = [];
      this.showWeatherHourly = true;
      this.isWeatherLoading = false;
      this.latestWeatherSnapshot = null;

      this.audioVault = new Mod42AlarmAudioVault();
      this.ringtoneEngine = new Mod42RingtoneEngine();
      this.weatherService = new Mod42WeatherService();

      this.tickIntervalId = null;
      this.lastTickKey = '';
      this.activeRingingAlarm = null;
      this.tab5Mp3OverrideUrl = null;
      this.tab5Mp3OverrideName = '';

      this.state = this.loadStateFromStorage();
      this.alarmDraft = {
        hour: '09',
        minute: '00',
        second: '',
        label: 'Đến giờ viết chương mới!',
        repeatMode: 'daily',
        ringtoneMode: this.state.defaultRingtoneType || 'system',
        systemRingtoneId: this.state.defaultSystemRingtoneId || 'sys_chime_gentle',
      };
    }

    getDefaultState() {
      return {
        version: 1,
        timezoneId: 'vn_hanoi',
        customOffsetMinutes: null,
        dateFormatId: 'DMY_HMS',
        formatManualLocked: false,
        tempUnit: 'C',
        pinnedCompareIds: [
          'vn_hanoi',
          'jp_tokyo',
          'kr_seoul',
          'gb_london',
          'us_newyork',
          'au_sydney',
        ],
        weatherCityOverride: null,
        defaultRingtoneType: 'system',
        defaultSystemRingtoneId: 'sys_chime_gentle',
        customMp3Meta: {
          hasAudio: false,
          fileName: '',
          sizeBytes: 0,
        },
        alarmVolume: 0.85,
        snoozeMinutes: 5,
        alarms: [],
      };
    }

    loadStateFromStorage() {
      const defaults = this.getDefaultState();
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return defaults;

        const validTz = INTERNATIONAL_TIMEZONE_CATALOG.some((z) => z.id === parsed.timezoneId)
          ? parsed.timezoneId
          : defaults.timezoneId;
        const validFmt = DATE_FORMAT_CATALOG.some((f) => f.id === parsed.dateFormatId)
          ? parsed.dateFormatId
          : defaults.dateFormatId;

        const cleanAlarms = Array.isArray(parsed.alarms)
          ? parsed.alarms
              .map((a) => this.sanitizeSavedAlarm(a))
              .filter(Boolean)
          : [];

        return {
          ...defaults,
          ...parsed,
          timezoneId: validTz,
          dateFormatId: validFmt,
          formatManualLocked: Boolean(parsed.formatManualLocked),
          tempUnit: parsed.tempUnit === 'F' ? 'F' : 'C',
          customOffsetMinutes:
            typeof parsed.customOffsetMinutes === 'number' && Number.isFinite(parsed.customOffsetMinutes)
              ? parsed.customOffsetMinutes
              : null,
          pinnedCompareIds:
            Array.isArray(parsed.pinnedCompareIds) && parsed.pinnedCompareIds.length
              ? parsed.pinnedCompareIds
              : defaults.pinnedCompareIds,
          alarmVolume:
            typeof parsed.alarmVolume === 'number' && parsed.alarmVolume >= 0.05 && parsed.alarmVolume <= 1
              ? parsed.alarmVolume
              : defaults.alarmVolume,
          alarms: cleanAlarms,
        };
      } catch (_err) {
        return defaults;
      }
    }

    sanitizeSavedAlarm(rawAlarm) {
      if (!rawAlarm || typeof rawAlarm !== 'object') return null;
      const normalized = normalizeAndValidateAlarmTimeInput(
        rawAlarm.hour,
        rawAlarm.minute,
        rawAlarm.second === undefined || rawAlarm.second === null ? '' : rawAlarm.second
      );
      if (!normalized.ok) return null;
      return {
        id: String(rawAlarm.id || generateUniqueId('alm')),
        hour: normalized.hour,
        minute: normalized.minute,
        second: normalized.second,
        label: String(rawAlarm.label || 'Báo thức Studio').slice(0, 120),
        repeatMode:
          rawAlarm.repeatMode === 'once' || rawAlarm.repeatMode === 'weekdays'
            ? rawAlarm.repeatMode
            : 'daily',
        enabled: rawAlarm.enabled !== false,
        targetDate: /^\d{4}-\d{2}-\d{2}$/.test(String(rawAlarm.targetDate || '')) ? String(rawAlarm.targetDate) : '',
        ringtoneMode: rawAlarm.ringtoneMode === 'custom_mp3' ? 'custom_mp3' : 'system',
        systemRingtoneId: SYSTEM_RINGTONES.some((s) => s.id === rawAlarm.systemRingtoneId)
          ? rawAlarm.systemRingtoneId
          : 'sys_chime_gentle',
        lastTriggeredKey: String(rawAlarm.lastTriggeredKey || ''),
        createdAt: Number(rawAlarm.createdAt) || Date.now(),
      };
    }

    saveStateToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (_err) {
        // Không làm sập UI nếu chế độ riêng tư hạn chế localStorage
      }
    }

    getActiveZoneEntry() {
      return (
        INTERNATIONAL_TIMEZONE_CATALOG.find((z) => z.id === this.state.timezoneId) ||
        INTERNATIONAL_TIMEZONE_CATALOG[0]
      );
    }

    getCurrentZonedParts(dateObj) {
      const zoneEntry = this.getActiveZoneEntry();
      const parts = resolveZonedParts(dateObj || new Date(), zoneEntry, this.state.customOffsetMinutes);
      if (typeof this.state.customOffsetMinutes === 'number') {
        parts.zoneLabel = `Múi giờ ${formatGmtOffsetText(this.state.customOffsetMinutes)}`;
      }
      return parts;
    }

    getFormattedNowSnapshot(dateObj) {
      const now = dateObj instanceof Date ? dateObj : new Date();
      const parts = this.getCurrentZonedParts(now);
      const formatted = formatLocalizedZonedClockString(parts, this.state.dateFormatId);
      return {
        formatted,
        parts,
        timezoneId: this.state.timezoneId,
        dateFormatId: this.state.dateFormatId,
        customOffsetMinutes: this.state.customOffsetMinutes,
      };
    }

    syncLocaleDateFormatDefaults(langCode) {
      const lang = langCode || NS.i18n?.getLanguage?.() || 'vi';
      if (!this.state.formatManualLocked) {
        const nextFmt = NS.i18n?.getLocaleConfig?.(lang)?.defaultClockFormatId || 'DMY_HMS';
        if (DATE_FORMAT_CATALOG.some((f) => f.id === nextFmt)) {
          this.state.dateFormatId = nextFmt;
        }
      }
      this.updateHeaderClockDisplay();
      if (this.modalOpen) {
        this.renderModalBody();
      }
    }

    async init() {
      if (this.initialized) {
        this.bindHeaderTriggers();
        this.updateHeaderClockDisplay();
        return this;
      }

      this.initialized = true;
      this.ensureModalShellExists();
      this.ensureFloatingRingingBannerExists();
      this.bindHeaderTriggers();
      this.syncLocaleDateFormatDefaults(NS.i18n?.getLanguage?.());
      this.startLiveTicker();

      if (NS.bus && typeof NS.bus.on === 'function' && !this._mod42I18nBound) {
        this._mod42I18nBound = true;
        NS.bus.on('i18n:changed', (payload) => {
          this.syncLocaleDateFormatDefaults(payload?.lang);
        });
      }
      if (typeof global.addEventListener === 'function' && !this._mod42WinI18nBound) {
        this._mod42WinI18nBound = true;
        global.addEventListener('noir:i18n:changed', (ev) => {
          this.syncLocaleDateFormatDefaults(ev?.detail?.lang);
        });
      }

      // Khôi phục MP3 tùy chọn từ IndexedDB (nếu người dùng đã tải lên trước đó)
      const savedAudio = await this.audioVault.loadAudioRecord();
      if (savedAudio && savedAudio.blob) {
        this.ringtoneEngine.setCustomMp3Blob(savedAudio.blob);
        this.state.customMp3Meta = {
          hasAudio: true,
          fileName: savedAudio.fileName || 'alarm_custom.mp3',
          sizeBytes: savedAudio.sizeBytes || savedAudio.blob.size || 0,
        };
        this.saveStateToStorage();
      } else if (this.state.customMp3Meta?.hasAudio) {
        this.state.customMp3Meta = { hasAudio: false, fileName: '', sizeBytes: 0 };
        this.saveStateToStorage();
      }

      return this;
    }

    bindHeaderTriggers() {
      const linkBtn = document.getElementById(HEADER_TRIGGER_ID);
      const clockDock = document.getElementById(HEADER_DOCK_ID);
      const liveClockEl = document.getElementById(HEADER_CLOCK_ID);

      if (linkBtn && !linkBtn.dataset.mod42Bound) {
        linkBtn.dataset.mod42Bound = '1';
        linkBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this.toggleModal();
        });
      }

      if (liveClockEl && !liveClockEl.dataset.mod42Bound) {
        liveClockEl.dataset.mod42Bound = '1';
        liveClockEl.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this.openModal('timezone');
        });
      }

      if (clockDock && !clockDock.dataset.mod42Bound) {
        clockDock.dataset.mod42Bound = '1';
        clockDock.addEventListener('click', (ev) => {
          ev.stopPropagation();
        });
      }
    }

    updateHeaderClockDisplay() {
      const el = document.getElementById(HEADER_CLOCK_ID);
      if (!el) return;
      if (!el.hasAttribute('data-i18n-ignore')) {
        el.setAttribute('data-i18n-ignore', 'true');
      }
      const snap = this.getFormattedNowSnapshot(new Date());
      const activeAlarmCount = (this.state.alarms || []).filter((a) => a.enabled).length;
      const alarmTag = activeAlarmCount > 0 ? ` · ⏰${activeAlarmCount}` : '';
      el.textContent = `${snap.formatted}${alarmTag}`;

      // Nếu cửa sổ đang mở ở Tab Giờ hoặc Báo Thức, cập nhật số giây trực tiếp mà không vẽ lại toàn DOM
      if (this.modalOpen) {
        const heroTimeEl = document.getElementById('mod42-modal-hero-time');
        const heroDateEl = document.getElementById('mod42-modal-hero-date');
        const heroFmtEl = document.getElementById('mod42-modal-hero-formatted');
        const alarmRefEl = document.getElementById('mod42-alarm-clock-ref');
        const p = snap.parts;

        if (heroTimeEl) {
          heroTimeEl.textContent = `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`;
        }
        if (heroDateEl) {
          const heroDate = formatLocalizedHeroDateLine(p);
          const zLbl = localizeZoneLabelText(p.zoneLabel);
          heroDateEl.textContent = `${heroDate} · ${p.gmtText} (${zLbl})`;
        }
        if (heroFmtEl) {
          heroFmtEl.textContent = snap.formatted;
        }
        if (alarmRefEl) {
          alarmRefEl.textContent = `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`;
        }

        // Cập nhật đồng hồ đếm ngược từng báo thức
        if (this.activeModalTab === 'alarm' && Array.isArray(this.state.alarms)) {
          this.state.alarms.forEach((alarm) => {
            if (!alarm.enabled) return;
            const cdEl = document.querySelector(`[data-mod42-countdown="${alarm.id}"]`);
            if (cdEl) {
              const cd = computeAlarmCountdownParts(alarm, p);
              cdEl.textContent = `⏳ ${cd.label}`;
            }
          });
        }
      }
    }

    startLiveTicker() {
      if (this.tickIntervalId) {
        clearInterval(this.tickIntervalId);
      }
      this.tickIntervalId = setInterval(() => {
        const now = new Date();
        this.updateHeaderClockDisplay();
        this.evaluateAlarmsOnSecond(now);
      }, 1000);
    }

    evaluateAlarmsOnSecond(nowDate) {
      const alarms = this.state.alarms || [];
      if (!alarms.length) return;

      const parts = this.getCurrentZonedParts(nowDate);
      const secKey = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}|${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
      if (secKey === this.lastTickKey) return;
      this.lastTickKey = secKey;

      const currentDateKey = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
      const isWeekday = parts.weekdayIndex >= 1 && parts.weekdayIndex <= 5;
      let stateChanged = false;

      for (let i = 0; i < alarms.length; i++) {
        const alarm = alarms[i];
        if (!alarm || !alarm.enabled) continue;
        if (alarm.targetDate && alarm.targetDate !== currentDateKey) continue;
        if (!alarm.targetDate && alarm.repeatMode === 'weekdays' && !isWeekday) continue;

        if (
          Number(alarm.hour) === parts.hour &&
          Number(alarm.minute) === parts.minute &&
          Number(alarm.second) === parts.second
        ) {
          const triggerSig = `${alarm.id}|${secKey}`;
          if (alarm.lastTriggeredKey === triggerSig) continue;

          alarm.lastTriggeredKey = triggerSig;
          if (alarm.repeatMode === 'once') {
            alarm.enabled = false;
          }
          stateChanged = true;
          this.triggerAlarmRing(alarm, parts);
        }
      }

      if (stateChanged) {
        this.saveStateToStorage();
        if (this.modalOpen && this.activeModalTab === 'alarm') {
          this.renderModalBody();
        }
      }
    }

    triggerAlarmRing(alarm, zonedParts) {
      const p = zonedParts || this.getCurrentZonedParts(new Date());
      this.activeRingingAlarm = {
        id: alarm.id,
        label: alarm.label || 'Báo thức Studio',
        timeText: `${pad2(alarm.hour)}:${pad2(alarm.minute)}:${pad2(alarm.second)}`,
        zoneText: `${p.gmtText} (${p.zoneLabel})`,
        ringtoneMode: alarm.ringtoneMode,
        systemRingtoneId: alarm.systemRingtoneId,
      };

      const vol = this.state.alarmVolume || 0.85;
      if (alarm.ringtoneMode === 'custom_mp3') {
        const srcUrl = this.tab5Mp3OverrideUrl || this.ringtoneEngine.customObjectUrl;
        const srcLabel = this.tab5Mp3OverrideUrl
          ? this.tab5Mp3OverrideName
          : this.state.customMp3Meta?.fileName;
        this.ringtoneEngine.startCustomMp3(vol, alarm.systemRingtoneId, 60000, srcUrl, srcLabel);
      } else {
        this.ringtoneEngine.startSystemPattern(alarm.systemRingtoneId, vol, 60000);
      }

      this.renderFloatingRingingBanner();
      this.updateHeaderClockDisplay();
    }

    ensureFloatingRingingBannerExists() {
      if (document.getElementById(RINGING_BANNER_ID)) return;
      const banner = document.createElement('div');
      banner.id = RINGING_BANNER_ID;
      banner.className =
        'hidden fixed bottom-4 right-4 z-[10060] max-w-sm w-[calc(100vw-2rem)] p-3.5 rounded-2xl border border-amber-400/70 bg-zinc-950/95 text-white shadow-2xl backdrop-blur-md';
      document.body.appendChild(banner);
    }

    renderFloatingRingingBanner() {
      this.ensureFloatingRingingBannerExists();
      const banner = document.getElementById(RINGING_BANNER_ID);
      if (!banner) return;

      if (!this.activeRingingAlarm) {
        banner.classList.add('hidden');
        banner.innerHTML = '';
        return;
      }

      const info = this.activeRingingAlarm;
      banner.classList.remove('hidden');
      banner.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 animate-pulse">🔔 ĐANG ĐỔ CHUÔNG BÁO THỨC</div>
            <div class="text-lg font-black font-monoCode text-white mt-0.5">${escapeHtml(info.timeText)}</div>
            <div class="text-xs font-bold text-emerald-300 truncate">${escapeHtml(info.label)}</div>
            <div class="text-[10px] text-zinc-400 truncate">${escapeHtml(info.zoneText)}</div>
          </div>
          <button type="button" id="mod42-banner-close-stop" class="w-7 h-7 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-300 shrink-0" title="Tắt chuông">✕</button>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-3">
          <button type="button" id="mod42-banner-stop-btn" class="flex-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold">⏹️ Tắt Chuông</button>
          <button type="button" id="mod42-banner-snooze-btn" class="px-3 py-1.5 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold">😴 +${this.state.snoozeMinutes || 5}p</button>
          <button type="button" id="mod42-banner-open-btn" class="px-2.5 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs font-bold">Mở Bảng</button>
        </div>
      `;

      banner.querySelector('#mod42-banner-stop-btn')?.addEventListener('click', () => this.stopRinging());
      banner.querySelector('#mod42-banner-close-stop')?.addEventListener('click', () => this.stopRinging());
      banner.querySelector('#mod42-banner-snooze-btn')?.addEventListener('click', () => this.snoozeRinging(5));
      banner.querySelector('#mod42-banner-open-btn')?.addEventListener('click', () => this.openModal('alarm'));
      NS.i18n?.translateElement?.(banner);
    }

    ensureModalShellExists() {
      if (document.getElementById(MODAL_ID)) return;

      const wrapper = document.createElement('div');
      wrapper.id = MODAL_ID;
      wrapper.setAttribute('role', 'dialog');
      wrapper.setAttribute('aria-modal', 'true');
      wrapper.setAttribute('aria-label', 'Chỉnh Múi Giờ, Định Dạng Ngày Giờ, Xem Thời Tiết và Báo Thức');
      wrapper.className =
        'hidden fixed inset-0 z-[10050] bg-black/70 backdrop-blur-sm flex items-start justify-center p-2.5 sm:p-5 overflow-y-auto';

      wrapper.innerHTML = `
        <div id="mod42-modal-card" class="my-auto w-full max-w-4xl max-h-[92dvh] rounded-2xl border border-zinc-300 dark:border-zinc-700/80 bg-studioLightPanel dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xl flex flex-col overflow-hidden">
          <!-- Thanh tiêu đề có nút X góc trên bên phải để đóng/mở linh hoạt -->
          <div class="px-4 py-3 border-b border-zinc-300/80 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/90 flex items-center justify-between gap-3 shrink-0">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-base">🕒</span>
                <h2 class="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">Khung Giờ Quốc Tế, Thời Tiết &amp; Báo Thức</h2>
              </div>
              <p class="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">Chỉnh múi giờ, đổi định dạng ngày giờ, xem thời tiết và đặt chuông báo thức (MP3 hoặc mặc định)</p>
            </div>
            <button type="button" id="${CLOSE_BTN_ID}" aria-label="Đóng cửa sổ" title="Đóng cửa sổ (có thể bấm lại dòng chữ trên đầu trang để mở lại bất kỳ lúc nào)" class="w-9 h-9 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 font-black text-base flex items-center justify-center transition shrink-0 cursor-pointer">✕</button>
          </div>

          <!-- 5 Tab Chức Năng Trong Cửa Sổ -->
          <div id="mod42-modal-tabs-bar" class="px-4 py-2 border-b border-zinc-300/70 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex flex-wrap items-center gap-1.5 shrink-0">
            <button type="button" data-mod42-tab="timezone" class="mod42-tab-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition">🕒 Múi Giờ &amp; Định Dạng</button>
            <button type="button" data-mod42-tab="weather" class="mod42-tab-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition">🌤️ Xem Thời Tiết</button>
            <button type="button" data-mod42-tab="alarm" class="mod42-tab-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition">⏰ Báo Thức &amp; Chuông MP3</button>
            <button type="button" data-mod42-tab="market" class="mod42-tab-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition inline-flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg><span>Đầu tư hôm nay</span></button>
            <button type="button" data-mod42-tab="wisdom" class="mod42-tab-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition inline-flex items-center gap-1.5"><span>🧠</span><span>20 phút thông thái</span></button>
          </div>

          <!-- Nội dung cuộn -->
          <div id="mod42-modal-body" class="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-4"></div>

          <!-- Footer nhỏ gọn -->
          <div class="px-4 py-2 border-t border-zinc-300/70 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/80 flex items-center justify-between gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 shrink-0">
            <span class="truncate">Mọi thay đổi múi giờ, định dạng và báo thức đều lưu tự động ngay lập tức.</span>
            <button type="button" id="mod42-footer-close-btn" class="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-bold text-zinc-800 dark:text-zinc-200 shrink-0">Đóng cửa sổ</button>
          </div>
        </div>
      `;

      document.body.appendChild(wrapper);

      // Click backdrop để đóng
      wrapper.addEventListener('click', (ev) => {
        if (ev.target === wrapper) {
          this.closeModal();
        }
      });

      wrapper.querySelector(`#${CLOSE_BTN_ID}`)?.addEventListener('click', () => this.closeModal());
      wrapper.querySelector('#mod42-footer-close-btn')?.addEventListener('click', () => this.closeModal());

      wrapper.querySelectorAll('.mod42-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-mod42-tab') || 'timezone';
          this.switchModalTab(tab);
        });
      });

      if (!global.__mod42EscBound) {
        global.__mod42EscBound = true;
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape' && this.modalOpen) {
            this.closeModal();
          }
        });
      }
    }

    openModal(initialTab) {
      this.ensureModalShellExists();
      if (initialTab && ['timezone', 'weather', 'alarm', 'market', 'wisdom'].includes(initialTab)) {
        this.activeModalTab = initialTab;
      }
      this.modalOpen = true;
      const modal = document.getElementById(MODAL_ID);
      if (modal) {
        modal.classList.remove('hidden');
      }
      this.renderModalBody();

      if (this.activeModalTab === 'weather') {
        this.refreshWeather(false);
      }
      return true;
    }

    closeModal() {
      this.modalOpen = false;
      const modal = document.getElementById(MODAL_ID);
      if (modal) {
        modal.classList.add('hidden');
      }
      if (NS.weatherSkyEngine && typeof NS.weatherSkyEngine.onModalClosed === 'function') {
        NS.weatherSkyEngine.onModalClosed();
      }
      if (NS.marketAdvisor && typeof NS.marketAdvisor.onModalClosed === 'function') {
        NS.marketAdvisor.onModalClosed();
      }
      if (NS.twentyMinWisdom && typeof NS.twentyMinWisdom.onModalClosed === 'function') {
        NS.twentyMinWisdom.onModalClosed();
      }
      return true;
    }

    toggleModal(initialTab) {
      if (this.modalOpen) {
        return this.closeModal();
      }
      return this.openModal(initialTab);
    }

    switchModalTab(tabKey) {
      const prevTab = this.activeModalTab;
      this.activeModalTab = ['timezone', 'weather', 'alarm', 'market', 'wisdom'].includes(tabKey)
        ? tabKey
        : 'timezone';
      if (prevTab === 'market' && this.activeModalTab !== 'market') {
        if (NS.marketAdvisor && typeof NS.marketAdvisor.onModalClosed === 'function') {
          NS.marketAdvisor.onModalClosed();
        }
      }
      if (prevTab === 'wisdom' && this.activeModalTab !== 'wisdom') {
        if (NS.twentyMinWisdom && typeof NS.twentyMinWisdom.onModalClosed === 'function') {
          NS.twentyMinWisdom.onModalClosed();
        }
      }
      this.renderModalBody();
      if (this.activeModalTab === 'weather') {
        const target = this.getEffectiveWeatherTarget();
        const curSnap = this.latestWeatherSnapshot;
        const mismatch =
          !curSnap ||
          Math.abs(Number(curSnap.lat) - Number(target.lat)) > 0.05 ||
          Math.abs(Number(curSnap.lon) - Number(target.lon)) > 0.05 ||
          curSnap.locationName !== target.name;
        if (mismatch) {
          this.refreshWeather(false);
        }
      }
    }

    renderModalTabButtons() {
      const modal = document.getElementById(MODAL_ID);
      if (!modal) return;
      modal.querySelectorAll('.mod42-tab-btn').forEach((btn) => {
        const key = btn.getAttribute('data-mod42-tab');
        const active = key === this.activeModalTab;
        btn.className = active
          ? 'mod42-tab-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition bg-emerald-600 text-white shadow'
          : 'mod42-tab-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition border border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500/60';
      });
    }

    renderModalBody() {
      this.ensureModalShellExists();
      this.renderModalTabButtons();
      const body = document.getElementById('mod42-modal-body');
      if (!body) return;

      if (this.activeModalTab === 'weather') {
        body.innerHTML = buildWeatherTabPanelHtml(this.state, this);
        this.bindWeatherTabEvents(body);
      } else if (this.activeModalTab === 'alarm') {
        body.innerHTML = buildAlarmTabPanelHtml(this.state, this);
        this.bindAlarmTabEvents(body);
      } else if (this.activeModalTab === 'market') {
        body.innerHTML = '<div id="mod49-market-inline-mount"></div>';
        const mHost = body.querySelector('#mod49-market-inline-mount');
        if (mHost && NS.marketAdvisor?.mountIntoContainer) {
          NS.marketAdvisor.mountIntoContainer(mHost);
        }
      } else if (this.activeModalTab === 'wisdom') {
        body.innerHTML = '<div id="mod50-wisdom-inline-mount"></div>';
        const wHost = body.querySelector('#mod50-wisdom-inline-mount');
        if (wHost && NS.twentyMinWisdom?.mountIntoContainer) {
          NS.twentyMinWisdom.mountIntoContainer(wHost);
        }
      } else {
        body.innerHTML = buildTimezoneTabPanelHtml(this.state, this);
        this.bindTimezoneTabEvents(body);
      }

      const mod43Host = document.getElementById('mod43-inline-weather-mount');
      if (mod43Host && NS.weatherSkyEngine && typeof NS.weatherSkyEngine.mountIntoContainer === 'function') {
        NS.weatherSkyEngine.mountIntoContainer(mod43Host);
      }
      NS.i18n?.translateElement?.(document.getElementById(MODAL_ID) || body);
    }

    bindTimezoneTabEvents(container) {
      container.querySelector('#mod42-btn-reset-vn-default')?.addEventListener('click', () => {
        this.state.timezoneId = 'vn_hanoi';
        this.state.customOffsetMinutes = null;
        this.state.formatManualLocked = false;
        this.state.dateFormatId = NS.i18n?.getLocaleConfig?.()?.defaultClockFormatId || 'DMY_HMS';
        this.saveStateToStorage();
        this.updateHeaderClockDisplay();
        this.renderModalBody();
      });

      container.querySelectorAll('[data-mod42-jump-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.switchModalTab(btn.getAttribute('data-mod42-jump-tab'));
        });
      });

      const searchInput = container.querySelector('#mod42-tz-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (ev) => {
          this.tzSearchQuery = ev.target.value || '';
          const caret = ev.target.selectionStart;
          this.renderModalBody();
          const refreshed = document.getElementById('mod42-tz-search-input');
          if (refreshed) {
            refreshed.focus();
            if (typeof caret === 'number') {
              try {
                refreshed.setSelectionRange(caret, caret);
              } catch (_err) {}
            }
          }
        });
      }

      container.querySelector('#mod42-fixed-gmt-select')?.addEventListener('change', (ev) => {
        const val = ev.target.value;
        if (val === 'AUTO') {
          this.state.customOffsetMinutes = null;
        } else {
          this.state.customOffsetMinutes = Number(val);
        }
        this.saveStateToStorage();
        this.updateHeaderClockDisplay();
        this.renderModalBody();
      });

      container.querySelectorAll('[data-mod42-region]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.tzRegionFilter = btn.getAttribute('data-mod42-region') || 'ALL';
          this.renderModalBody();
        });
      });

      container.querySelectorAll('[data-mod42-select-zone]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.setTimezone(btn.getAttribute('data-mod42-select-zone'));
        });
      });

      container.querySelectorAll('[data-mod42-select-format]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.setDateFormat(btn.getAttribute('data-mod42-select-format'));
        });
      });

      const bindCollapseBtn = (btnId, bodyId, stateKey) => {
        const btn = container.querySelector(`#${btnId}`);
        const bodyEl = container.querySelector(`#${bodyId}`);
        if (!btn || !bodyEl) return;
        btn.addEventListener('click', () => {
          this[stateKey] = !this[stateKey];
          bodyEl.classList.toggle('hidden', !this[stateKey]);
          const lbl = this[stateKey] ? '▲ Thu gọn' : '▼ Mở rộng';
          btn.textContent = NS.i18n?.translateText?.(lbl) || lbl;
        });
      };
      bindCollapseBtn('btn-mod42-toggle-world-compare', 'mod42-world-compare-grid', 'showWorldCompare');
      bindCollapseBtn('btn-mod42-toggle-tz-picker', 'mod42-tz-picker-body', 'showTzPicker');
      bindCollapseBtn('btn-mod42-toggle-format-picker', 'mod42-format-list', 'showFormatPicker');
    }

    bindWeatherTabEvents(container) {
      const cityInput = container.querySelector('#mod42-weather-city-input');
      const runSearch = async () => {
        const q = cityInput?.value || '';
        this.weatherSearchQuery = q;
        if (!q.trim()) return;
        this.weatherSearchResults = await this.weatherService.searchCities(q);
        this.renderModalBody();
      };

      container.querySelector('#mod42-btn-search-weather')?.addEventListener('click', runSearch);
      cityInput?.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          runSearch();
        }
      });

      container.querySelectorAll('[data-mod42-pick-weather-city]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const idx = Number(btn.getAttribute('data-mod42-pick-weather-city'));
          const picked = (this.weatherSearchResults || [])[idx];
          if (!picked) return;
          this.state.weatherCityOverride = {
            name: picked.name,
            lat: picked.lat,
            lon: picked.lon,
            iana: picked.iana,
            isGps: false,
          };
          this.weatherSearchResults = [];
          this.latestWeatherSnapshot = null;
          this.saveStateToStorage();
          if (NS.weatherSkyEngine?.controller?.clearGpsPinOnly) {
            NS.weatherSkyEngine.controller.clearGpsPinOnly();
          }
          await this.refreshWeather(true);
          if (NS.weatherSkyEngine?.controller?.syncRealtimeWeather) {
            NS.weatherSkyEngine.controller.syncRealtimeWeather(false, true);
          }
        });
      });

      container.querySelector('#mod42-btn-toggle-temp-unit')?.addEventListener('click', () => {
        this.setTempUnit(this.state.tempUnit === 'F' ? 'C' : 'F');
      });

      container.querySelector('#mod42-btn-refresh-weather')?.addEventListener('click', () => {
        this.refreshWeather(true);
      });

      container.querySelector('#mod42-btn-weather-follow-tz')?.addEventListener('click', () => {
        this.clearGpsWeatherOverride(true, true);
      });

      const bindWeatherCollapseBtn = (btnId, bodyId, stateKey) => {
        const btn = container.querySelector(`#${btnId}`);
        const bodyEl = container.querySelector(`#${bodyId}`);
        if (!btn || !bodyEl) return;
        btn.addEventListener('click', () => {
          this[stateKey] = !this[stateKey];
          bodyEl.classList.toggle('hidden', !this[stateKey]);
          const lbl = this[stateKey] ? '▲ Thu gọn' : '▼ Mở rộng';
          btn.textContent = NS.i18n?.translateText?.(lbl) || lbl;
        });
      };
      bindWeatherCollapseBtn('btn-mod42-toggle-weather-hourly', 'mod42-weather-hourly-body', 'showWeatherHourly');
      bindWeatherCollapseBtn('btn-mod42-toggle-weather-daily', 'mod42-weather-daily-body', 'showWeatherDaily');
    }

    bindAlarmTabEvents(container) {
      const hourEl = container.querySelector('#mod42-alarm-hour');
      const minEl = container.querySelector('#mod42-alarm-minute');
      const secEl = container.querySelector('#mod42-alarm-second');
      const labelEl = container.querySelector('#mod42-alarm-label');
      const repeatEl = container.querySelector('#mod42-alarm-repeat');
      const dateEl = container.querySelector('#mod42-alarm-date');
      const sysSelect = container.querySelector('#mod42-system-ringtone-select');
      const mp3Input = container.querySelector('#mod42-mp3-upload-input');
      const quickStrEl = container.querySelector('#mod42-alarm-quick-str');

      const syncDraftFromDom = () => {
        if (hourEl) this.alarmDraft.hour = hourEl.value;
        if (minEl) this.alarmDraft.minute = minEl.value;
        if (secEl) this.alarmDraft.second = secEl.value;
        if (labelEl) this.alarmDraft.label = labelEl.value;
        if (repeatEl) this.alarmDraft.repeatMode = repeatEl.value;
        if (dateEl) this.alarmDraft.targetDate = dateEl.value;
        if (sysSelect) this.alarmDraft.systemRingtoneId = sysSelect.value;
        const checkedRadio = container.querySelector('input[name="mod42-ringtone-mode"]:checked');
        if (checkedRadio) {
          this.alarmDraft.ringtoneMode = checkedRadio.value;
        }
      };

      [hourEl, minEl, secEl, labelEl, repeatEl, dateEl, sysSelect].forEach((el) => {
        el?.addEventListener('change', syncDraftFromDom);
        el?.addEventListener('input', syncDraftFromDom);
      });

      const formatIsoDateOffset = (daysOffset = 0) => {
        const p = this.getCurrentZonedParts(new Date(Date.now() + daysOffset * 86400000));
        return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
      };
      dateEl?.addEventListener('change', () => {
        if (dateEl.value && repeatEl) {
          repeatEl.value = 'once';
        }
        syncDraftFromDom();
      });
      container.querySelector('#mod42-btn-date-today')?.addEventListener('click', () => {
        if (dateEl) dateEl.value = formatIsoDateOffset(0);
        if (repeatEl) repeatEl.value = 'once';
        syncDraftFromDom();
      });
      container.querySelector('#mod42-btn-date-tomorrow')?.addEventListener('click', () => {
        if (dateEl) dateEl.value = formatIsoDateOffset(1);
        if (repeatEl) repeatEl.value = 'once';
        syncDraftFromDom();
      });
      container.querySelector('#mod42-btn-date-clear')?.addEventListener('click', () => {
        if (dateEl) dateEl.value = '';
        if (repeatEl && repeatEl.value === 'once') repeatEl.value = 'daily';
        syncDraftFromDom();
      });

      container.querySelectorAll('input[name="mod42-ringtone-mode"]').forEach((radio) => {
        radio.addEventListener('change', () => {
          syncDraftFromDom();
          this.state.defaultRingtoneType = this.alarmDraft.ringtoneMode;
          this.saveStateToStorage();
        });
      });

      sysSelect?.addEventListener('change', () => {
        this.state.defaultSystemRingtoneId = sysSelect.value;
        this.saveStateToStorage();
      });

      container.querySelector('#mod42-btn-apply-quick-str')?.addEventListener('click', () => {
        const parsed = parseQuickTimeExpression(quickStrEl?.value || '');
        if (!parsed.ok) {
          this.showAlarmFeedback(parsed.error, 'error');
          return;
        }
        if (hourEl) hourEl.value = pad2(parsed.hour);
        if (minEl) minEl.value = pad2(parsed.minute);
        if (secEl) secEl.value = parsed.secondDefaulted ? '' : pad2(parsed.second);
        syncDraftFromDom();
        this.showAlarmFeedback(
          `Đã điền mốc ${parsed.formattedHMS}${parsed.secondDefaulted ? ' (giây mặc định :00)' : ''}. Bấm "Lưu & Bật Báo Thức" để kích hoạt.`,
          'success'
        );
      });

      container.querySelectorAll('[data-mod42-quick-offset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const offsetMin = Number(btn.getAttribute('data-mod42-quick-offset')) || 1;
          const p = this.getCurrentZonedParts(new Date(Date.now() + offsetMin * 60000));
          if (hourEl) hourEl.value = pad2(p.hour);
          if (minEl) minEl.value = pad2(p.minute);
          if (secEl) secEl.value = '';
          syncDraftFromDom();
          this.showAlarmFeedback(
            `Đã đặt sẵn mốc +${offsetMin} phút (${pad2(p.hour)}:${pad2(p.minute)}:00).`,
            'success'
          );
        });
      });

      container.querySelectorAll('[data-mod42-quick-fixed]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const parsed = parseQuickTimeExpression(btn.getAttribute('data-mod42-quick-fixed'));
          if (!parsed.ok) return;
          if (hourEl) hourEl.value = pad2(parsed.hour);
          if (minEl) minEl.value = pad2(parsed.minute);
          if (secEl) secEl.value = '';
          syncDraftFromDom();
        });
      });

      container.querySelector('#mod42-btn-preview-system')?.addEventListener('click', () => {
        const toneId = sysSelect?.value || this.state.defaultSystemRingtoneId;
        this.ringtoneEngine.startSystemPattern(toneId, this.state.alarmVolume, 4500);
      });

      container.querySelector('#mod42-btn-stop-preview')?.addEventListener('click', () => {
        this.ringtoneEngine.stopAll();
      });

      container.querySelector('#mod42-btn-pick-mp3')?.addEventListener('click', () => {
        mp3Input?.click();
      });

      mp3Input?.addEventListener('change', async (ev) => {
        const file = ev.target?.files?.[0];
        if (!file) return;
        this.tab5Mp3OverrideUrl = null;
        this.tab5Mp3OverrideName = '';
        await this.loadCustomMp3File(file);
        syncDraftFromDom();
        this.alarmDraft.ringtoneMode = 'custom_mp3';
        this.state.defaultRingtoneType = 'custom_mp3';
        this.saveStateToStorage();
        this.renderModalBody();
      });

      container.querySelector('#mod42-btn-reuse-tab5-mp3')?.addEventListener('click', () => {
        const tab5Src = this.ringtoneEngine.resolveTab5LoadedMp3Source();
        if (!tab5Src) {
          this.showAlarmFeedback('Chưa có file MP3 đang nạp ở Tab 5.', 'error');
          return;
        }
        this.tab5Mp3OverrideUrl = tab5Src.url;
        this.tab5Mp3OverrideName = tab5Src.label;
        this.alarmDraft.ringtoneMode = 'custom_mp3';
        this.state.defaultRingtoneType = 'custom_mp3';
        this.state.customMp3Meta = {
          hasAudio: true,
          fileName: `${tab5Src.label} (Từ Tab 5)`,
          sizeBytes: 0,
        };
        this.saveStateToStorage();
        this.renderModalBody();
      });

      container.querySelector('#mod42-btn-clear-mp3')?.addEventListener('click', async () => {
        this.tab5Mp3OverrideUrl = null;
        this.tab5Mp3OverrideName = '';
        await this.clearCustomMp3();
        this.renderModalBody();
      });

      container.querySelector('#mod42-btn-preview-mp3')?.addEventListener('click', () => {
        this.ringtoneEngine.startCustomMp3(
          this.state.alarmVolume,
          this.state.defaultSystemRingtoneId,
          5000,
          this.tab5Mp3OverrideUrl,
          this.tab5Mp3OverrideName || this.state.customMp3Meta?.fileName
        );
      });

      const volRange = container.querySelector('#mod42-alarm-volume-range');
      const volLabel = container.querySelector('#mod42-alarm-volume-label');
      volRange?.addEventListener('input', (ev) => {
        const pct = Math.max(10, Math.min(100, Number(ev.target.value) || 85));
        this.state.alarmVolume = pct / 100;
        if (volLabel) volLabel.textContent = `${pct}%`;
        this.saveStateToStorage();
      });

      container.querySelector('#mod42-btn-add-alarm')?.addEventListener('click', () => {
        syncDraftFromDom();
        const res = this.addAlarm({
          hour: this.alarmDraft.hour,
          minute: this.alarmDraft.minute,
          second: this.alarmDraft.second,
          label: this.alarmDraft.label,
          repeatMode: this.alarmDraft.repeatMode,
          targetDate: this.alarmDraft.targetDate,
          ringtoneMode: this.alarmDraft.ringtoneMode,
          systemRingtoneId: this.alarmDraft.systemRingtoneId,
        });
        if (!res.ok) {
          this.showAlarmFeedback(res.error, 'error');
        } else {
          this.renderModalBody();
          this.showAlarmFeedback(
            `✅ Đã lưu báo thức lúc ${res.alarm.hourText}:${res.alarm.minuteText}:${res.alarm.secondText}${
              res.alarm.targetDate ? ` ngày ${res.alarm.targetDate.split('-').reverse().join('/')}` : ''
            }${res.secondDefaulted ? ' (giây bỏ trống nên mặc định :00)' : ''}.`,
            'success'
          );
        }
      });

      container.querySelector('#mod42-btn-stop-all-audio')?.addEventListener('click', () => {
        this.stopRinging();
      });

      container.querySelectorAll('[data-mod42-test-alarm]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.testAlarmRing(btn.getAttribute('data-mod42-test-alarm'));
        });
      });

      container.querySelectorAll('[data-mod42-toggle-alarm]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.toggleAlarm(btn.getAttribute('data-mod42-toggle-alarm'));
        });
      });

      container.querySelectorAll('[data-mod42-delete-alarm]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.deleteAlarm(btn.getAttribute('data-mod42-delete-alarm'));
        });
      });
    }

    showAlarmFeedback(message, level) {
      const box = document.getElementById('mod42-alarm-feedback');
      if (!box) return;
      box.textContent = NS.i18n?.translateText?.(message) || message;
      box.className =
        level === 'error'
          ? 'text-xs font-bold px-3 py-2 rounded-xl border border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300'
          : 'text-xs font-bold px-3 py-2 rounded-xl border border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
      box.classList.remove('hidden');
    }

    setTimezone(zoneId) {
      const match = INTERNATIONAL_TIMEZONE_CATALOG.find((z) => z.id === zoneId);
      if (!match) return { ok: false, error: 'Không tìm thấy múi giờ.' };
      this.state.timezoneId = match.id;
      this.state.customOffsetMinutes = null;
      this.latestWeatherSnapshot = null;
      this.saveStateToStorage();
      this.updateHeaderClockDisplay();
      if (this.modalOpen) {
        this.renderModalBody();
      }
      return { ok: true, timezoneId: match.id };
    }

    setDateFormat(formatId) {
      const match = DATE_FORMAT_CATALOG.find((f) => f.id === formatId);
      if (!match) return { ok: false, error: 'Định dạng không hợp lệ.' };
      this.state.dateFormatId = match.id;
      this.state.formatManualLocked = true;
      this.saveStateToStorage();
      this.updateHeaderClockDisplay();
      if (this.modalOpen) {
        this.renderModalBody();
      }
      return { ok: true, dateFormatId: match.id };
    }

    setTempUnit(unit) {
      this.state.tempUnit = unit === 'F' ? 'F' : 'C';
      this.saveStateToStorage();
      if (this.modalOpen && this.activeModalTab === 'weather') {
        this.renderModalBody();
      }
      return { ok: true, tempUnit: this.state.tempUnit };
    }

    getMod43PinnedGpsCoords() {
      const mod43Ctrl = NS.weatherSkyEngine?.controller;
      if (mod43Ctrl && mod43Ctrl.state) {
        const g = mod43Ctrl.state.gpsCoords;
        if (g && Number.isFinite(Number(g.lat)) && Number.isFinite(Number(g.lon))) {
          return {
            lat: Number(g.lat),
            lon: Number(g.lon),
            label: g.label || '📍 Vị trí thực của bạn',
            iana: g.iana || '',
          };
        }
        return null;
      }
      try {
        const raw = localStorage.getItem('mod43_realtime_weather_sky_v1');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const g = parsed && parsed.gpsCoords;
        if (g && Number.isFinite(Number(g.lat)) && Number.isFinite(Number(g.lon))) {
          return {
            lat: Number(g.lat),
            lon: Number(g.lon),
            label: g.label || '📍 Vị trí thực của bạn',
            iana: g.iana || '',
          };
        }
      } catch (_err) {}
      return null;
    }

    getEffectiveWeatherTarget() {
      const zone = this.getActiveZoneEntry();
      const override = this.state.weatherCityOverride;
      if (override && Number.isFinite(Number(override.lat)) && Number.isFinite(Number(override.lon))) {
        return {
          lat: Number(override.lat),
          lon: Number(override.lon),
          name: override.name || `${zone.flag} ${zone.cityVi}, ${zone.countryVi}`,
          iana: override.iana || zone.iana,
          isGps: Boolean(override.isGps),
          isOverridden: true,
        };
      }
      const gps = this.getMod43PinnedGpsCoords();
      if (gps) {
        return {
          lat: gps.lat,
          lon: gps.lon,
          name: gps.label || '📍 Vị trí thực của bạn',
          iana: gps.iana || zone.iana,
          isGps: true,
          isOverridden: true,
        };
      }
      return {
        lat: Number(zone.lat),
        lon: Number(zone.lon),
        name: `${zone.flag} ${zone.cityVi}, ${zone.countryVi}`,
        iana: zone.iana,
        isGps: false,
        isOverridden: false,
      };
    }

    syncFromExternalGps(gpsLoc, forceRefresh = true) {
      if (!gpsLoc || !Number.isFinite(Number(gpsLoc.lat)) || !Number.isFinite(Number(gpsLoc.lon))) {
        return null;
      }
      const zone = this.getActiveZoneEntry();
      this.state.weatherCityOverride = {
        name: gpsLoc.name || gpsLoc.label || '📍 Vị trí thực của bạn',
        lat: Number(gpsLoc.lat),
        lon: Number(gpsLoc.lon),
        iana: gpsLoc.iana || zone.iana,
        isGps: true,
      };
      this.latestWeatherSnapshot = null;
      this.saveStateToStorage();
      if (this.modalOpen && this.activeModalTab === 'weather') {
        this.renderModalBody();
      }
      return this.refreshWeather(Boolean(forceRefresh));
    }

    clearGpsWeatherOverride(refreshNow = true, alsoClearMod43 = false) {
      this.state.weatherCityOverride = null;
      this.latestWeatherSnapshot = null;
      this.saveStateToStorage();
      if (alsoClearMod43 && NS.weatherSkyEngine?.controller?.clearGpsAndSync) {
        NS.weatherSkyEngine.controller.clearGpsAndSync();
      }
      if (this.modalOpen && this.activeModalTab === 'weather') {
        this.renderModalBody();
      }
      if (refreshNow !== false) {
        return this.refreshWeather(true);
      }
      return Promise.resolve(null);
    }

    async refreshWeather(forceRefresh) {
      const target = this.getEffectiveWeatherTarget();
      const lat = target.lat;
      const lon = target.lon;
      const name = target.name;
      const iana = target.iana;

      this.isWeatherLoading = true;
      if (this.modalOpen && this.activeModalTab === 'weather') {
        const refreshBtn = document.getElementById('mod42-btn-refresh-weather');
        if (refreshBtn) refreshBtn.textContent = NS.i18n?.translateText?.('⏳ Đang tải...') || '⏳ Đang tải...';
      }

      const snap = await this.weatherService.fetchWeather(lat, lon, name, iana, Boolean(forceRefresh));
      this.latestWeatherSnapshot = snap;
      this.isWeatherLoading = false;

      if (this.modalOpen && this.activeModalTab === 'weather') {
        this.renderModalBody();
      }
      return snap;
    }

    async loadCustomMp3File(file) {
      if (!file) return { ok: false, error: 'Chưa chọn file.' };
      this.ringtoneEngine.setCustomMp3Blob(file);
      this.state.customMp3Meta = {
        hasAudio: true,
        fileName: file.name || 'alarm_custom.mp3',
        sizeBytes: file.size || 0,
      };
      this.saveStateToStorage();
      await this.audioVault.saveAudioRecord({
        fileName: file.name,
        mimeType: file.type || 'audio/mpeg',
        sizeBytes: file.size || 0,
        blob: file,
      });
      return { ok: true, fileName: file.name };
    }

    async clearCustomMp3() {
      this.ringtoneEngine.setCustomMp3Blob(null);
      this.state.customMp3Meta = { hasAudio: false, fileName: '', sizeBytes: 0 };
      if (this.state.defaultRingtoneType === 'custom_mp3') {
        this.state.defaultRingtoneType = 'system';
      }
      this.alarmDraft.ringtoneMode = 'system';
      this.saveStateToStorage();
      await this.audioVault.clearAudioRecord();
      return { ok: true };
    }

    addAlarm(spec) {
      const check = normalizeAndValidateAlarmTimeInput(
        spec?.hour,
        spec?.minute,
        spec?.second === undefined || spec?.second === null ? '' : spec.second
      );
      if (!check.ok) {
        return { ok: false, error: check.error };
      }

      const alarmRecord = {
        id: generateUniqueId('alm'),
        hour: check.hour,
        minute: check.minute,
        second: check.second,
        hourText: pad2(check.hour),
        minuteText: pad2(check.minute),
        secondText: pad2(check.second),
        label: String(spec?.label || 'Nhắc nhở từ Studio').trim() || 'Nhắc nhở từ Studio',
        repeatMode:
          spec?.targetDate && /^\d{4}-\d{2}-\d{2}$/.test(String(spec.targetDate))
            ? 'once'
            : spec?.repeatMode === 'once' || spec?.repeatMode === 'weekdays'
              ? spec.repeatMode
              : 'daily',
        targetDate: /^\d{4}-\d{2}-\d{2}$/.test(String(spec?.targetDate || '')) ? String(spec.targetDate) : '',
        enabled: true,
        ringtoneMode: spec?.ringtoneMode === 'custom_mp3' ? 'custom_mp3' : 'system',
        systemRingtoneId: SYSTEM_RINGTONES.some((r) => r.id === spec?.systemRingtoneId)
          ? spec.systemRingtoneId
          : this.state.defaultSystemRingtoneId,
        lastTriggeredKey: '',
        createdAt: Date.now(),
      };

      this.state.alarms = [alarmRecord, ...(this.state.alarms || [])];
      this.saveStateToStorage();
      this.updateHeaderClockDisplay();
      return { ok: true, alarm: alarmRecord, secondDefaulted: check.secondDefaulted };
    }

    toggleAlarm(alarmId) {
      const found = (this.state.alarms || []).find((a) => a.id === alarmId);
      if (!found) return false;
      found.enabled = !found.enabled;
      this.saveStateToStorage();
      this.updateHeaderClockDisplay();
      if (this.modalOpen && this.activeModalTab === 'alarm') {
        this.renderModalBody();
      }
      return true;
    }

    deleteAlarm(alarmId) {
      const before = (this.state.alarms || []).length;
      this.state.alarms = (this.state.alarms || []).filter((a) => a.id !== alarmId);
      this.saveStateToStorage();
      this.updateHeaderClockDisplay();
      if (this.modalOpen && this.activeModalTab === 'alarm') {
        this.renderModalBody();
      }
      return (this.state.alarms || []).length !== before;
    }

    testAlarmRing(alarmIdOrSpec) {
      const found =
        typeof alarmIdOrSpec === 'string'
          ? (this.state.alarms || []).find((a) => a.id === alarmIdOrSpec)
          : alarmIdOrSpec;
      const target = found || {
        id: 'preview_test',
        hour: Number(this.alarmDraft.hour) || 9,
        minute: Number(this.alarmDraft.minute) || 0,
        second: Number(this.alarmDraft.second) || 0,
        label: this.alarmDraft.label || 'Kiểm tra chuông báo thức',
        ringtoneMode: this.alarmDraft.ringtoneMode,
        systemRingtoneId: this.alarmDraft.systemRingtoneId,
      };
      this.triggerAlarmRing(target, this.getCurrentZonedParts(new Date()));
      return true;
    }

    stopRinging() {
      this.ringtoneEngine.stopAll();
      this.activeRingingAlarm = null;
      this.renderFloatingRingingBanner();
      return true;
    }

    snoozeRinging(minutes) {
      const delayMin = Number(minutes) || this.state.snoozeMinutes || 5;
      const prevLabel = this.activeRingingAlarm?.label || 'Báo thức';
      const prevMode = this.activeRingingAlarm?.ringtoneMode || 'system';
      const prevTone = this.activeRingingAlarm?.systemRingtoneId || this.state.defaultSystemRingtoneId;

      this.stopRinging();
      const targetParts = this.getCurrentZonedParts(new Date(Date.now() + delayMin * 60000));
      this.addAlarm({
        hour: targetParts.hour,
        minute: targetParts.minute,
        second: targetParts.second,
        label: `${prevLabel} (Báo lại +${delayMin}p)`,
        repeatMode: 'once',
        ringtoneMode: prevMode,
        systemRingtoneId: prevTone,
      });
      if (this.modalOpen && this.activeModalTab === 'alarm') {
        this.renderModalBody();
      }
      return true;
    }

    previewSystemRingtone(ringtoneId) {
      return this.ringtoneEngine.startSystemPattern(
        ringtoneId || this.state.defaultSystemRingtoneId,
        this.state.alarmVolume,
        4500
      );
    }

    selectRingtoneMode(mode, systemToneId) {
      this.state.defaultRingtoneType = mode === 'custom_mp3' ? 'custom_mp3' : 'system';
      if (systemToneId && SYSTEM_RINGTONES.some((s) => s.id === systemToneId)) {
        this.state.defaultSystemRingtoneId = systemToneId;
      }
      this.alarmDraft.ringtoneMode = this.state.defaultRingtoneType;
      this.alarmDraft.systemRingtoneId = this.state.defaultSystemRingtoneId;
      this.saveStateToStorage();
      return { ok: true };
    }

    getState() {
      return {
        ...this.state,
        modalOpen: this.modalOpen,
        activeModalTab: this.activeModalTab,
        hasActiveRinging: Boolean(this.activeRingingAlarm),
      };
    }

    selfInspect() {
      const snap = this.getFormattedNowSnapshot(new Date());
      return {
        module: MODULE_ID,
        ok: Boolean(document.getElementById(HEADER_CLOCK_ID) && document.getElementById(HEADER_TRIGGER_ID)),
        modalExists: Boolean(document.getElementById(MODAL_ID)),
        closeButtonExists: Boolean(document.getElementById(CLOSE_BTN_ID)),
        formattedSample: snap.formatted,
        timezoneCount: INTERNATIONAL_TIMEZONE_CATALOG.length,
        formatCount: DATE_FORMAT_CATALOG.length,
        systemRingtoneCount: SYSTEM_RINGTONES.length,
        alarmCount: (this.state.alarms || []).length,
      };
    }
  }

  const controller = new Mod42WorldClockWeatherAlarmController();

  const publicApi = {
    moduleId: MODULE_ID,
    controller,
    DATE_FORMAT_CATALOG,
    INTERNATIONAL_TIMEZONE_CATALOG,
    SYSTEM_RINGTONES,
    init: () => controller.init(),
    openModal: (tab) => controller.openModal(tab),
    closeModal: () => controller.closeModal(),
    toggleModal: (tab) => controller.toggleModal(tab),
    setTimezone: (zoneId) => controller.setTimezone(zoneId),
    setDateFormat: (fmtId) => controller.setDateFormat(fmtId),
    setTempUnit: (unit) => controller.setTempUnit(unit),
    addAlarm: (spec) => controller.addAlarm(spec),
    toggleAlarm: (id) => controller.toggleAlarm(id),
    deleteAlarm: (id) => controller.deleteAlarm(id),
    testAlarmRing: (idOrSpec) => controller.testAlarmRing(idOrSpec),
    stopRinging: () => controller.stopRinging(),
    snoozeRinging: (mins) => controller.snoozeRinging(mins),
    previewSystemRingtone: (id) => controller.previewSystemRingtone(id),
    selectRingtoneMode: (mode, toneId) => controller.selectRingtoneMode(mode, toneId),
    refreshWeather: (force) => controller.refreshWeather(force),
    getFormattedNowSnapshot: (d) => controller.getFormattedNowSnapshot(d),
    normalizeAndValidateAlarmTimeInput,
    parseQuickTimeExpression,
    getState: () => controller.getState(),
    selfInspect: () => controller.selfInspect(),
  };

  NS.worldClockStudio = publicApi;
  NS.registry = NS.registry || {};
  NS.registry.mod42 = 'worldClockStudio';

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        publicApi.init();
      });
    } else {
      publicApi.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
