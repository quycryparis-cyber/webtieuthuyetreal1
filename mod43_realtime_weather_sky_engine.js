/**
 * ============================================================================
 * MODULE 43: ĐỘNG CƠ THỜI TIẾT THỜI GIAN THỰC & MÔ PHỎNG BẦU TRỜI 60FPS
 *            (6 KHUNG GIỜ ÁNH SÁNG × 28 MÃ THỜI TIẾT WMO = 168 BIẾN THỂ)
 * File: mod43_realtime_weather_sky_engine.js
 * Namespace: window.NoirStudio.weatherSkyEngine (đăng ký NS.registry.mod43)
 *
 * Nhiệm vụ cốt lõi:
 *  1. Gắn trực tiếp ngay bên dưới khung chỉnh Múi Giờ & Báo Thức trong cùng cửa sổ
 *     của Module 42 (#mod42-clock-weather-modal) một Màn hình Xem & Mô phỏng
 *     Thời tiết Real-Time tại vị trí thực của người dùng (GPS + Fallback thành phố).
 *  2. Hỗ trợ chuẩn xác 6 Khung Giờ Ánh Sáng dựa theo giờ mọc/lặn mặt trời thực tế
 *     từ Open-Meteo `daily=sunrise,sunset` (dawn, morning, noon, afternoon, dusk, night)
 *     kết hợp đủ 28 mã thời tiết WMO (0..99) -> 168 biến thể có mô tả chi tiết
 *     (ví dụ: "51 – Drizzle: Light: Mưa phùn nhẹ, hạt li ti lơ lửng").
 *  3. Kiến trúc Background Website 3 Lớp đồng bộ thời gian thực & Tùy chỉnh:
 *     - Lớp 1: Ảnh nền thư mục backgrounds/{file}_{phase}.webp (tự động fallback
 *              _{day|night}.webp hoặc bầu trời Procedural 60FPS sắc nét).
 *     - Lớp 2: Lớp phủ ánh sáng động (.light-dawn .. .light-night) + màng tối.
 *     - Lớp 3: Canvas 60FPS chia sẻ chung renderer (mô phỏng thu nhỏ + nền toàn web).
 *  4. Cung cấp 2 nút chọn nền web rõ ràng ("Nền Thời Tiết Hiện Tại Real-Time"
 *     và "Nền Thời Tiết Tùy Chỉnh") kèm bộ thanh trượt tinh chỉnh giống Tab 5:
 *     Độ rõ nền, Độ mờ, Độ sáng, Lớp phủ tối, Tương phản, Bão hòa, Xuyên thấu chữ,
 *     Mật độ hạt 60FPS, Sức gió & nút Soi Nền 100%.
 * ============================================================================
 */
(function initMod43RealtimeWeatherSkyEngine(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});
  NS.registry = NS.registry || {};

  const MODULE_ID = 'mod43_weatherSkyEngine';
  const ENGINE_VERSION = '43.1.0';
  const STORAGE_KEY = 'noir_v36_mod43_weather_sky_engine_v1';
  const IDB_NAME = 'NoirMod43WeatherBgImagesDB';
  const IDB_STORE = 'bgImages';
  const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
  const MOUNT_CONTAINER_ID = 'mod43-inline-weather-mount';

  const MOD43_CONSTANTS = Object.freeze({
    MODULE_ID,
    ENGINE_VERSION,
    STORAGE_KEY,
    IDB_NAME,
    IDB_STORE,
    OPEN_METEO_ENDPOINT,
    MOUNT_CONTAINER_ID,
    WEB_BG_LAYER_ID: 'mod43-web-weather-bg-layer',
    WEB_BG_SKY_ID: 'mod43-bg-sky-gradient',
    WEB_BG_IMAGE_ID: 'mod43-bg-image',
    WEB_LIGHT_OVERLAY_ID: 'mod43-light-overlay',
    WEB_FX_CANVAS_ID: 'mod43-fx-canvas',
    WEB_DARK_VEIL_ID: 'mod43-darkness-veil',
    MINI_CANVAS_ID: 'mod43-mini-preview-canvas',
    MINI_IMAGE_ID: 'mod43-mini-bg-image',
    MINI_LIGHT_ID: 'mod43-mini-light-overlay',
    DEFAULT_COORDS: Object.freeze({
      lat: 21.0285,
      lon: 105.8542,
      cityVi: 'Hà Nội, Việt Nam',
      iana: 'Asia/Ho_Chi_Minh',
      sunriseMins: 350, // 05:50
      sunsetMins: 1045, // 17:25
    }),
    REALTIME_WEATHER_SYNC_MS: 15 * 60 * 1000,
    REALTIME_PHASE_CHECK_MS: 30 * 1000,
  });

  /**
   * --------------------------------------------------------------------------
   * PHẦN 1: 6 KHUNG GIỜ ÁNH SÁNG CHUẨN (TIME-OF-DAY PHASES)
   * Mốc tính toán từ sunriseMins và sunsetMins thực tế theo phút trong ngày:
   *  - dawn:      [sunrise - 45, sunrise + 15)
   *  - morning:   [sunrise + 15, 10:30 = 630)
   *  - noon:      [10:30 = 630, 15:30 = 930)
   *  - afternoon: [15:30 = 930, sunset - 30)
   *  - dusk:      [sunset - 30, sunset + 40]
   *  - night:     phần còn lại
   * --------------------------------------------------------------------------
   */
  const MOD43_TIME_PHASES = Object.freeze([
    {
      id: 'dawn',
      order: 1,
      icon: '🌅',
      labelVi: 'Bình minh',
      fullTitleVi: 'Bình minh / Rạng đông',
      rangeFormulaText: 'sunrise - 45 phút → sunrise + 15 phút',
      sampleClockText: '05:15',
      lightOverlayClass: 'light-dawn',
      fallbackDayNight: 'day',
      lightingSummaryVi:
        'Chân trời hửng hồng cam, đỉnh trời vẫn còn xanh tím đậm, ánh sáng mềm, sương sớm.',
      skyStopsClear: ['#1b1b4b', '#4d2d73', '#b8536a', '#ff9b70'],
      skyStopsCloudy: ['#1d2138', '#3e3556', '#72566c', '#a97a7b'],
      horizonGlow: 'rgba(255, 146, 104, 0.55)',
      sunPos: { x: 0.72, y: 0.76, radius: 22, color: '#ffb580' },
      moonAlpha: 0.15,
      starAlpha: 0.3,
      cityLightsAlpha: 0.45,
      hillFarColor: '#2a2243',
      hillNearColor: '#19142c',
      badgeTone: 'rose',
    },
    {
      id: 'morning',
      order: 2,
      icon: '🌤️',
      labelVi: 'Buổi sáng',
      fullTitleVi: 'Buổi sáng sớm trong trẻo',
      rangeFormulaText: 'sunrise + 15 phút → 10:30',
      sampleClockText: '08:30',
      lightOverlayClass: 'light-morning',
      fallbackDayNight: 'day',
      lightingSummaryVi:
        'Ánh nắng vàng nhạt trong trẻo, bầu trời xanh tươi sáng, độ tương phản dịu.',
      skyStopsClear: ['#2669b5', '#4b9ae0', '#87cefa', '#dff3ff'],
      skyStopsCloudy: ['#52657c', '#74879c', '#98a7b6', '#bcc6d0'],
      horizonGlow: 'rgba(255, 244, 200, 0.35)',
      sunPos: { x: 0.78, y: 0.36, radius: 24, color: '#fff3c4' },
      moonAlpha: 0,
      starAlpha: 0,
      cityLightsAlpha: 0,
      hillFarColor: '#486d8a',
      hillNearColor: '#2c475c',
      badgeTone: 'sky',
    },
    {
      id: 'noon',
      order: 3,
      icon: '☀️',
      labelVi: 'Giữa trưa',
      fullTitleVi: 'Giữa trưa / Đầu chiều',
      rangeFormulaText: '10:30 → 15:30',
      sampleClockText: '12:30',
      lightOverlayClass: 'light-noon',
      fallbackDayNight: 'day',
      lightingSummaryVi:
        'Ánh sáng trắng cường độ mạnh, bóng đổ ngắn, bầu trời xanh thẳm hoặc rực sáng.',
      skyStopsClear: ['#0b4a8f', '#1c77c9', '#4db6f0', '#b8e8ff'],
      skyStopsCloudy: ['#495867', '#677787', '#8998a8', '#b0bcc7'],
      horizonGlow: 'rgba(255, 255, 240, 0.28)',
      sunPos: { x: 0.52, y: 0.18, radius: 25, color: '#ffffff' },
      moonAlpha: 0,
      starAlpha: 0,
      cityLightsAlpha: 0,
      hillFarColor: '#3f627e',
      hillNearColor: '#253d50',
      badgeTone: 'cyan',
    },
    {
      id: 'afternoon',
      order: 4,
      icon: '🌇',
      labelVi: 'Chiều tà',
      fullTitleVi: 'Chiều tà (Golden Hour)',
      rangeFormulaText: '15:30 → sunset - 30 phút',
      sampleClockText: '16:15',
      lightOverlayClass: 'light-afternoon',
      fallbackDayNight: 'day',
      lightingSummaryVi:
        'Nắng ngả vàng mật ong ấm áp, tia sáng chiếu xiên góc thấp, mây ánh vàng cam.',
      skyStopsClear: ['#264b7c', '#5b6c94', '#c9885b', '#ffcf7d'],
      skyStopsCloudy: ['#3e4659', '#615d6d', '#8c7671', '#b7947d'],
      horizonGlow: 'rgba(255, 193, 92, 0.52)',
      sunPos: { x: 0.25, y: 0.45, radius: 26, color: '#ffdd88' },
      moonAlpha: 0,
      starAlpha: 0.05,
      cityLightsAlpha: 0.12,
      hillFarColor: '#524455',
      hillNearColor: '#312735',
      badgeTone: 'amber',
    },
    {
      id: 'dusk',
      order: 5,
      icon: '🌆',
      labelVi: 'Chạng vạng',
      fullTitleVi: 'Chạng vạng / Hoàng hôn (Blue Hour)',
      rangeFormulaText: 'sunset - 30 phút → sunset + 40 phút',
      sampleClockText: '17:30',
      lightOverlayClass: 'light-dusk',
      fallbackDayNight: 'night',
      lightingSummaryVi:
        'Bầu trời chuyển dải màu cam đỏ, tím hồng sang xanh chàm (Blue Hour), đèn phố bắt đầu bật.',
      skyStopsClear: ['#151238', '#4a1d6c', '#b93f56', '#ff6e42'],
      skyStopsCloudy: ['#19192e', '#382a45', '#5d3b4d', '#864e4d'],
      horizonGlow: 'rgba(255, 92, 58, 0.62)',
      sunPos: { x: 0.22, y: 0.80, radius: 23, color: '#ff6e48' },
      moonAlpha: 0.35,
      starAlpha: 0.52,
      cityLightsAlpha: 0.72,
      hillFarColor: '#251734',
      hillNearColor: '#130c1e',
      badgeTone: 'orange',
    },
    {
      id: 'night',
      order: 6,
      icon: '🌌',
      labelVi: 'Ban đêm',
      fullTitleVi: 'Ban đêm sâu thẳm',
      rangeFormulaText: 'sunset + 40 phút → sunrise - 45 phút',
      sampleClockText: '22:00',
      lightOverlayClass: 'light-night',
      fallbackDayNight: 'night',
      lightingSummaryVi:
        'Nền trời xanh đen sâu thẳm hoặc đen tuyền, ánh trăng bạc, sao hoặc ánh sáng đô thị hắt lên mây.',
      skyStopsClear: ['#040712', '#091128', '#112146', '#1b315c'],
      skyStopsCloudy: ['#060811', '#0e1320', '#192131', '#263042'],
      horizonGlow: 'rgba(65, 105, 190, 0.24)',
      sunPos: null,
      moonAlpha: 0.92,
      starAlpha: 1.0,
      cityLightsAlpha: 1.0,
      hillFarColor: '#0c1324',
      hillNearColor: '#060912',
      badgeTone: 'indigo',
    },
  ]);

  const MOD43_TIME_PHASE_MAP = MOD43_TIME_PHASES.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  /**
   * --------------------------------------------------------------------------
   * PHẦN 2: MA TRẬN TOÀN BỘ 28 MÃ THỜI TIẾT CHUẨN WMO (OPEN-METEO)
   * Đầy đủ thông số từ tài liệu kỹ thuật:
   * - code, enName, viName, viDetail
   * - file (prefix tìm ảnh `{file}_{phase}.webp`)
   * - fx, fxType (celestial, clouds, fog, rain, snow, thunder)
   * - count, speed, len, dropOpacity, stormFlashPeriodMin/Max, hasHail, hasFrostCorners,
   *   hasGodRays, hasGustCycle, hasBottomSplash, hasBottomMist, desaturatePct, isColdTone
   * - phaseNotes (mô tả biến thể theo 6 khung giờ)
   * --------------------------------------------------------------------------
   */
  const MOD43_WMO_WEATHER_MATRIX = Object.freeze({
    0: {
      code: 0,
      category: 'CLEAR_CLOUD',
      icon: '☀️',
      nightIcon: '🌙',
      enName: 'Clear sky',
      viName: 'Trời quang',
      viDetail: 'Trời quang đãng hoàn toàn, không mây.',
      file: 'clear',
      fxType: 'celestial',
      fxName: 'celestial_clear',
      count: 80,
      speed: 0.35,
      len: 0,
      opacity: 0.85,
      cloudDensity: 0,
      fogDensity: 0,
      desaturatePct: 0,
      lightingDarkness: 0,
      techNoteVi: 'Ngày: lens flare đổi góc; Bình minh/Chiều: bụi nắng; Đêm: 90 ngôi sao nhấp nháy.',
      phaseNotes: {
        dawn: 'Chân trời hồng cam, đỉnh trời tím xanh, hạt bụi nắng lơ lửng.',
        morning: 'Xanh dương nhạt, nắng sớm dịu kèm vòng hào quang nhẹ.',
        noon: 'Xanh thẳm rực rỡ, ánh sáng trắng cường độ mạnh.',
        afternoon: 'Vàng mật ong ấm, hạt bụi nắng bay nhẹ.',
        dusk: 'Cam đỏ chuyển tím chàm, lóe những ngôi sao đầu tiên.',
        night: 'Xanh đen sâu, dải ngân hà & 90 ngôi sao nhấp nháy.',
      },
    },
    1: {
      code: 1,
      category: 'CLEAR_CLOUD',
      icon: '🌤️',
      nightIcon: '🌌',
      enName: 'Mainly clear',
      viName: 'Nắng nhẹ',
      viDetail: 'Trời gần như quang đãng, chỉ có vài gợn mây mỏng.',
      file: 'mainly_clear',
      fxType: 'celestial',
      fxName: 'celestial_mainly_clear',
      count: 50,
      speed: 0.4,
      len: 0,
      opacity: 0.25,
      cloudDensity: 1,
      cirrusOpacity: 0.25,
      fogDensity: 0,
      desaturatePct: 5,
      lightingDarkness: 0.03,
      techNoteVi: 'Hiệu ứng ánh sáng theo giờ + 1 lớp mây ti (cirrus) mỏng trôi cực chậm (opacity 0.25).',
      phaseNotes: {
        dawn: 'Các dải mây ti bắt sắc hồng tím lúc bình minh.',
        morning: 'Gợn mây ti trắng mỏng trôi chậm trên nền trời xanh.',
        noon: 'Trời xanh trong kèm dải mây ti mảnh (opacity 0.25).',
        afternoon: 'Mây ti nhuộm ánh vàng mật ong ấm áp.',
        dusk: 'Mây ti rực vàng cam giữa bầu trời chạng vạng.',
        night: 'Mây ti ánh bạc trôi nhẹ dưới trăng sao.',
      },
    },
    2: {
      code: 2,
      category: 'CLEAR_CLOUD',
      icon: '⛅',
      nightIcon: '☁️',
      enName: 'Partly cloudy',
      viName: 'Ít mây',
      viDetail: 'Có mây rải rác, nắng và mây đan xen.',
      file: 'partly_cloudy',
      fxType: 'clouds',
      fxName: 'cloud_parallax_light',
      count: 4,
      speed: 0.8,
      len: 0,
      opacity: 0.55,
      cloudDensity: 3,
      fogDensity: 0,
      desaturatePct: 12,
      lightingDarkness: 0.08,
      techNoteVi: '3 cụm mây tách nền trôi ngang tốc độ tỷ lệ thuận với wind_speed_10m.',
      phaseNotes: {
        dawn: 'Cụm mây tích viền sáng cam hồng rực rỡ trên nền trời chuyển sắc.',
        morning: 'Mây trắng xốp nổi khối trôi theo sức gió sáng.',
        noon: 'Mây trắng xốp nổi khối trên nền trời xanh.',
        afternoon: 'Mây tích viền nắng mật ong trôi ngang chân trời.',
        dusk: 'Mây tích viền cam đỏ chạng vạng cực kỳ rực rỡ.',
        night: 'Mây xám xanh trôi ngang ánh trăng bạc.',
      },
    },
    3: {
      code: 3,
      category: 'CLEAR_CLOUD',
      icon: '☁️',
      nightIcon: '☁️',
      enName: 'Overcast',
      viName: 'U ám',
      viDetail: 'U ám, mây che phủ kín 100% bầu trời.',
      file: 'overcast',
      fxType: 'clouds',
      fxName: 'cloud_parallax_heavy',
      count: 8,
      speed: 0.55,
      len: 0,
      opacity: 0.85,
      cloudDensity: 8,
      fogDensity: 0.08,
      desaturatePct: 45,
      lightingDarkness: 0.26,
      techNoteVi: 'Mây dày che phủ toàn màn hình, chuyển động chậm, giảm độ bão hòa màu.',
      phaseNotes: {
        dawn: 'Mây dày đặc ánh tím xám hoặc cam đục u buồn.',
        morning: 'Mây xám bạc phủ kín 100%, ánh sáng khuếch tán.',
        noon: 'Mây xám dày che nắng, độ bão hòa màu trầm lắng.',
        afternoon: 'Mây xám bạc pha chút ấm chiều tà khuếch tán.',
        dusk: 'Mây dày ánh tím chạng vạng trầm mặc.',
        night: 'Mây đen xám phản chiếu ánh đèn đô thị mờ ảo.',
      },
    },
    45: {
      code: 45,
      category: 'FOG_FROST',
      icon: '🌫️',
      nightIcon: '🌫️',
      enName: 'Fog',
      viName: 'Sương mù',
      viDetail: 'Sương mù dày đặc.',
      file: 'fog',
      fxType: 'fog',
      fxName: 'fog_layers',
      count: 6,
      speed: 0.45,
      len: 0,
      opacity: 0.72,
      cloudDensity: 5,
      fogDensity: 0.72,
      desaturatePct: 50,
      lightingDarkness: 0.22,
      techNoteVi: '2 lớp sương gradient trôi ngược chiều nhau, độ mờ mềm mại.',
      phaseNotes: {
        dawn: 'Sương mù nhuộm sắc hồng tím sớm mai mờ ảo.',
        morning: 'Sương trắng bạc dày đặc bảng lảng.',
        noon: 'Sương trắng bạc phủ mờ không gian.',
        afternoon: 'Màn sương ánh vàng nhạt cuối chiều.',
        dusk: 'Sương mù nhuộm cam tím chạng vạng.',
        night: 'Màn sương xám xanh khuếch tán ánh sáng mờ.',
      },
    },
    48: {
      code: 48,
      category: 'FOG_FROST',
      icon: '❄️',
      nightIcon: '❄️',
      enName: 'Depositing rime fog',
      viName: 'Sương muối',
      viDetail: 'Sương mù đóng băng (sương muối bám trắng).',
      file: 'rime_fog',
      fxType: 'fog',
      fxName: 'fog_layers + ice_dust',
      count: 8,
      iceDustCount: 50,
      speed: 0.4,
      len: 0,
      opacity: 0.78,
      cloudDensity: 5,
      fogDensity: 0.76,
      isColdTone: true,
      desaturatePct: 55,
      lightingDarkness: 0.25,
      techNoteVi: 'Sương mù dày + 50 hạt tinh thể băng li ti lơ lửng phản chiếu ánh sáng.',
      phaseNotes: {
        dawn: 'Sương băng ánh tím lạnh buổi bình minh.',
        morning: 'Sương mù xanh băng giá kèm 50 tinh thể băng phản quang.',
        noon: 'Sương muối lạnh buốt, tinh thể băng lấp lánh.',
        afternoon: 'Lớp sương lạnh giá ngả sắc xám bạc.',
        dusk: 'Tím lạnh lúc chạng vạng, sương muối bám trắng.',
        night: 'Xanh lam tối ban đêm, bụi băng lấp lánh dưới ánh trăng.',
      },
    },
    51: {
      code: 51,
      category: 'DRIZZLE_RAIN',
      icon: '🌦️',
      nightIcon: '🌧️',
      enName: 'Drizzle: Light',
      viName: 'Mưa phùn nhẹ',
      viDetail: 'Mưa phùn nhẹ, hạt li ti lơ lửng.',
      file: 'drizzle_light',
      fxType: 'rain',
      fxName: 'rain_drizzle_light',
      count: 60,
      speed: 4,
      len: 8,
      lineWidth: 1.0,
      opacity: 0.30,
      cloudDensity: 5,
      fogDensity: 0.14,
      desaturatePct: 40,
      lightingDarkness: 0.18,
      techNoteVi: '60 hạt mưa siêu mảnh (1px), tốc độ rơi chậm (4px/frame), mờ 30%.',
      phaseNotes: {
        dawn: 'Bầu trời ẩm ướt hửng hồng nhạt, mưa phùn nhẹ 60 hạt lơ lửng.',
        morning: 'Sáng dịu độ bão hòa giảm 40%, tầm nhìn hơi mờ nhẹ.',
        noon: 'Mưa phùn nhẹ hạt 1px rơi chậm, không khí ẩm dịu.',
        afternoon: 'Hạt mưa phùn mỏng nhuộm ánh vàng xám nhạt.',
        dusk: 'Mưa phùn chạng vạng ánh cam hồng dịu nhẹ.',
        night: 'Mưa phùn đêm tối tĩnh lặng, hạt li ti ánh bạc mờ 30%.',
      },
    },
    53: {
      code: 53,
      category: 'DRIZZLE_RAIN',
      icon: '🌧️',
      nightIcon: '🌧️',
      enName: 'Drizzle: Moderate',
      viName: 'Mưa phùn vừa',
      viDetail: 'Mưa phùn vừa, mật độ hạt dày hơn.',
      file: 'drizzle_mod',
      fxType: 'rain',
      fxName: 'rain_drizzle_mod',
      count: 120,
      speed: 5,
      len: 10,
      lineWidth: 1.0,
      opacity: 0.42,
      cloudDensity: 6,
      fogDensity: 0.15,
      desaturatePct: 48,
      lightingDarkness: 0.24,
      techNoteVi: '120 hạt mưa mảnh (1px), tốc độ 5px/frame, kèm lớp sương mỏng 15%.',
      phaseNotes: {
        dawn: 'Mây phủ đều, ánh bình minh chỉ còn là vệt màu nhạt phía chân trời.',
        morning: 'Không khí ẩm đục, 120 hạt mưa phùn vừa + 15% sương mỏng.',
        noon: 'Mưa phùn vừa đều đặn, bầu trời ẩm xám dịu.',
        afternoon: 'Không khí ẩm đục, ánh nắng chiều ẩn sau lớp sương mỏng.',
        dusk: 'Chỉ còn vệt sáng hoàng hôn nhạt sau màn mưa phùn 120 hạt.',
        night: 'Đêm mưa phùn vừa êm ả, sương mỏng hắt ánh đèn.',
      },
    },
    55: {
      code: 55,
      category: 'DRIZZLE_RAIN',
      icon: '🌧️',
      nightIcon: '🌧️',
      enName: 'Drizzle: Dense intensity',
      viName: 'Mưa phùn dày',
      viDetail: 'Mưa phùn dày đặc, tầm nhìn bị mờ.',
      file: 'drizzle_dense',
      fxType: 'rain',
      fxName: 'rain_drizzle_dense',
      count: 200,
      speed: 6,
      len: 12,
      lineWidth: 1.05,
      opacity: 0.52,
      hasBottomMist: true,
      cloudDensity: 7,
      fogDensity: 0.34,
      desaturatePct: 58,
      lightingDarkness: 0.32,
      techNoteVi: '200 hạt mưa mảnh + lớp sương mù mờ ở nửa dưới màn hình.',
      phaseNotes: {
        dawn: 'Mây thấp xám xịt, màn mưa bụi dày đặc che cảnh xa lúc bình minh.',
        morning: '200 hạt mưa bụi + lớp sương mù mờ nửa dưới.',
        noon: 'Trưa xám ẩm, tầm nhìn xa chìm trong mưa bụi dày đặc.',
        afternoon: 'Mưa phùn dày phủ xám bức tranh chiều tà.',
        dusk: 'Hoàng hôn trầm đục trong 200 hạt mưa bụi và sương thấp.',
        night: 'Đêm sương mưa bụi dày đặc quện lấy ánh đèn phố.',
      },
    },
    56: {
      code: 56,
      category: 'DRIZZLE_RAIN',
      icon: '🌨️',
      nightIcon: '🌨️',
      enName: 'Freezing Drizzle: Light',
      viName: 'Mưa phùn băng nhẹ',
      viDetail: 'Mưa phùn đóng băng nhẹ.',
      file: 'freezing_drizzle_l',
      fxType: 'rain',
      fxName: 'rain_freezing_light',
      count: 80,
      speed: 5,
      len: 9,
      lineWidth: 1.05,
      opacity: 0.45,
      isColdTone: true,
      silverIceTint: true,
      cloudDensity: 6,
      fogDensity: 0.2,
      desaturatePct: 55,
      lightingDarkness: 0.25,
      techNoteVi: '80 hạt mưa mảnh ánh trắng bạc phản quang, rơi chậm.',
      phaseNotes: {
        dawn: 'Bầu trời xám thép lạnh lẽo, hạt mưa phùn ánh bạc.',
        morning: 'Ánh sáng khúc xạ qua lớp băng mỏng trên bề mặt.',
        noon: 'Trời xám thép buốt giá, 80 hạt mưa băng bạc phản quang.',
        afternoon: 'Không khí lạnh sắc, ánh chiều nhạt trên màn băng mỏng.',
        dusk: 'Chạng vạng xanh thép lạnh lẽo, hạt băng phản quang.',
        night: 'Đêm đông xám thép, hạt mưa phùn đóng băng lấp lánh.',
      },
    },
    57: {
      code: 57,
      category: 'DRIZZLE_RAIN',
      icon: '🧊',
      nightIcon: '🧊',
      enName: 'Freezing Drizzle: Dense intensity',
      viName: 'Mưa phùn băng dày',
      viDetail: 'Mưa phùn đóng băng dày đặc.',
      file: 'freezing_drizzle_d',
      fxType: 'rain',
      fxName: 'rain_freezing_dense',
      count: 180,
      speed: 6,
      len: 11,
      lineWidth: 1.1,
      opacity: 0.56,
      isColdTone: true,
      silverIceTint: true,
      hasFrostCorners: true,
      cloudDensity: 7,
      fogDensity: 0.35,
      desaturatePct: 62,
      lightingDarkness: 0.34,
      techNoteVi: '180 hạt mưa ánh bạc + hiệu ứng viền đóng băng nhẹ ở 4 góc màn hình.',
      phaseNotes: {
        dawn: 'Mây xám xanh nặng nề, 4 góc bắt đầu kết sương băng.',
        morning: 'Sương băng & mưa bụi dày đặc 180 hạt ánh bạc.',
        noon: 'Trời nặng xám xanh lạnh giá, viền kính đóng băng nhẹ.',
        afternoon: 'Mưa phùn băng dày đặc che khuất ánh chiều.',
        dusk: 'Chạng vạng xám xanh tê buốt với viền băng 4 góc.',
        night: 'Đêm băng giá dày đặc, hạt mưa bạc phản chiếu đèn.',
      },
    },
    61: {
      code: 61,
      category: 'DRIZZLE_RAIN',
      icon: '🌦️',
      nightIcon: '🌧️',
      enName: 'Rain: Slight',
      viName: 'Mưa nhỏ',
      viDetail: 'Mưa nhỏ, hạt thưa.',
      file: 'rain_slight',
      fxType: 'rain',
      fxName: 'rain_slight',
      count: 150,
      speed: 9,
      len: 14,
      lineWidth: 1.2,
      opacity: 0.5,
      cloudDensity: 6,
      fogDensity: 0.12,
      desaturatePct: 45,
      lightingDarkness: 0.24,
      techNoteVi: '150 vệt mưa dài 14px, tốc độ 9px/frame, góc nghiêng theo gió.',
      phaseNotes: {
        dawn: 'Mây xám xanh kèm hạt mưa nhỏ 14px hửng chút sắc cam hồng.',
        morning: 'Không khí mát mẻ, mưa nhỏ thưa hạt nghiêng theo gió.',
        noon: 'Ánh sáng yếu dịu mắt, 150 vệt mưa nhỏ đều tay.',
        afternoon: 'Mưa nhỏ buổi chiều dịu mát gợi cảm hứng sáng tác.',
        dusk: 'Vẫn giữ chút ánh cam tím phản chiếu qua 150 vệt mưa nhỏ.',
        night: 'Mưa nhỏ đêm khuya tí tách êm đềm.',
      },
    },
    63: {
      code: 63,
      category: 'DRIZZLE_RAIN',
      icon: '🌧️',
      nightIcon: '🌧️',
      enName: 'Rain: Moderate',
      viName: 'Mưa vừa',
      viDetail: 'Mưa vừa, rơi đều hạt.',
      file: 'rain_mod',
      fxType: 'rain',
      fxName: 'rain_moderate',
      count: 300,
      speed: 13,
      len: 18,
      lineWidth: 1.35,
      opacity: 0.62,
      hasBottomSplash: true,
      cloudDensity: 7,
      fogDensity: 0.18,
      desaturatePct: 55,
      lightingDarkness: 0.34,
      techNoteVi: '300 vệt mưa dài 18px, tốc độ 13px/frame, có hạt văng nhẹ ở đáy.',
      phaseNotes: {
        dawn: 'Mây đen xám dày đặc lúc rạng đông, mặt đường ướt phản chiếu ánh sáng.',
        morning: '300 vệt mưa vừa dài 18px rơi đều hạt kèm bọt văng nhẹ.',
        noon: 'Mây dày che phần lớn nắng trưa, hạt văng lăn tăn ở đáy.',
        afternoon: 'Mưa vừa phủ kín buổi chiều, ánh sáng hắt xuống mặt đường ướt.',
        dusk: 'Mặt đường ướt chạng vạng phản chiếu sắc cam tím qua 300 vệt mưa.',
        night: 'Mưa đêm rơi đều hạt 13px/frame, bọt nước ánh bạc.',
      },
    },
    65: {
      code: 65,
      category: 'DRIZZLE_RAIN',
      icon: '⛈️',
      nightIcon: '⛈️',
      enName: 'Rain: Heavy intensity',
      viName: 'Mưa to',
      viDetail: 'Mưa to, nặng hạt, bầu trời tối sầm.',
      file: 'rain_heavy',
      fxType: 'rain',
      fxName: 'rain_heavy',
      count: 550,
      speed: 18,
      len: 24,
      lineWidth: 1.6,
      opacity: 0.72,
      hasBottomSplash: true,
      hasBottomMist: true,
      cloudDensity: 9,
      fogDensity: 0.3,
      desaturatePct: 70,
      lightingDarkness: 0.48,
      techNoteVi: '550 vệt mưa dài 24px, tốc độ 18px/frame, tạo bọt nước bắn ở đáy.',
      phaseNotes: {
        dawn: 'Bầu trời tối sầm từ rạng đông, mây đen kịt, màn mưa trắng xóa.',
        morning: '550 vệt mưa dài 24px trút xuống nặng hạt, bọt nước tung tóe.',
        noon: 'Bầu trời tối sầm như chạng vạng (kể cả giữa trưa), mưa trắng xóa.',
        afternoon: 'Màn mưa nặng hạt 18px/frame phủ kín khung cảnh chiều.',
        dusk: 'Chạng vạng tối kịt, bọt nước văng mạnh ở đáy màn hình.',
        night: 'Đêm mưa to tầm tã, 550 vệt mưa sáng xé màn đêm.',
      },
    },
    66: {
      code: 66,
      category: 'DRIZZLE_RAIN',
      icon: '🧊',
      nightIcon: '🧊',
      enName: 'Freezing Rain: Light',
      viName: 'Mưa băng nhẹ',
      viDetail: 'Mưa đóng băng nhẹ.',
      file: 'freezing_rain_l',
      fxType: 'rain',
      fxName: 'rain_ice_light',
      count: 160,
      speed: 11,
      len: 15,
      lineWidth: 1.25,
      opacity: 0.56,
      isColdTone: true,
      iceParticleRatio: 0.30,
      cloudDensity: 7,
      fogDensity: 0.2,
      desaturatePct: 58,
      lightingDarkness: 0.28,
      techNoteVi: '70% vệt mưa lỏng + 30% hạt băng nhỏ rơi nhanh.',
      phaseNotes: {
        dawn: 'Bầu trời xám trắng lạnh buốt, cành cây bọc băng trong suốt.',
        morning: '70% vệt mưa lỏng kết hợp 30% hạt băng nhỏ rơi nhanh.',
        noon: 'Trời xám trắng giá rét, hạt băng rơi lách tách.',
        afternoon: 'Chiều lạnh buốt với mưa đóng băng nhẹ.',
        dusk: 'Hoàng hôn xám trắng lạnh lẽo trên bề mặt đóng băng.',
        night: 'Đêm mưa băng 160 hạt lạnh buốt lấp lánh.',
      },
    },
    67: {
      code: 67,
      category: 'DRIZZLE_RAIN',
      icon: '🧊',
      nightIcon: '🧊',
      enName: 'Freezing Rain: Heavy intensity',
      viName: 'Mưa băng lớn',
      viDetail: 'Mưa đóng băng nặng hạt.',
      file: 'freezing_rain_h',
      fxType: 'rain',
      fxName: 'rain_ice_heavy',
      count: 450,
      speed: 16,
      len: 22,
      lineWidth: 1.5,
      opacity: 0.68,
      isColdTone: true,
      iceParticleRatio: 0.35,
      hasFrostCorners: true,
      hasBottomSplash: true,
      cloudDensity: 9,
      fogDensity: 0.32,
      desaturatePct: 68,
      lightingDarkness: 0.42,
      techNoteVi: 'Mưa dày hạt + hạt băng rơi nhanh + viền kính đóng băng.',
      phaseNotes: {
        dawn: 'Bầu trời xám chì nặng nề, băng tuyết phủ dày, viền kính đóng băng.',
        morning: '450 vệt mưa băng xối xả kết hợp tinh thể băng rơi nhanh.',
        noon: 'Trưa xám chì u tối, mưa băng nặng hạt và góc kính đóng băng.',
        afternoon: 'Bão băng chiều buốt giá với hạt băng đập mạnh.',
        dusk: 'Chạng vạng xám chì tê tái, viền kính đóng băng rõ nét.',
        night: 'Đêm mưa băng xối xả 450 hạt giữa bầu trời chì.',
      },
    },
    71: {
      code: 71,
      category: 'SNOW_ICE',
      icon: '🌨️',
      nightIcon: '❄️',
      enName: 'Snow fall: Slight',
      viName: 'Tuyết nhẹ',
      viDetail: 'Tuyết rơi nhẹ, bông tuyết nhỏ thưa.',
      file: 'snow_slight',
      fxType: 'snow',
      fxName: 'snow_slight',
      count: 80,
      speed: 1.5,
      len: 0,
      minRadius: 1.4,
      maxRadius: 3.4,
      opacity: 0.72,
      isColdTone: true,
      cloudDensity: 5,
      fogDensity: 0.14,
      desaturatePct: 35,
      lightingDarkness: 0.14,
      techNoteVi: '80 bông tuyết tròn mờ, rơi chậm theo quỹ đạo hình sin lắc lư.',
      phaseNotes: {
        dawn: 'Tuyết rơi nhẹ trong ánh hồng tím bình minh lãng mạn.',
        morning: 'Bầu trời trắng xám dịu, 80 bông tuyết chao lượn hình sin.',
        noon: 'Tuyết rơi thưa nhẹ nhàng trên nền xám bạc.',
        afternoon: 'Tuyết rơi trong nắng chiều ấm nhạt đầy chất thơ.',
        dusk: 'Tuyết rơi trong ánh hồng tím chạng vạng lãng mạn.',
        night: 'Nền xanh than ấm áp với 80 bông tuyết rơi chậm.',
      },
    },
    73: {
      code: 73,
      category: 'SNOW_ICE',
      icon: '❄️',
      nightIcon: '❄️',
      enName: 'Snow fall: Moderate',
      viName: 'Tuyết vừa',
      viDetail: 'Tuyết rơi vừa.',
      file: 'snow_mod',
      fxType: 'snow',
      fxName: 'snow_moderate',
      count: 200,
      speed: 2.5,
      len: 0,
      minRadius: 2.0,
      maxRadius: 5.0,
      opacity: 0.78,
      isColdTone: true,
      cloudDensity: 6,
      fogDensity: 0.22,
      desaturatePct: 45,
      lightingDarkness: 0.2,
      techNoteVi: '200 bông tuyết đa kích thước (2px–5px), tốc độ 2.5px/frame.',
      phaseNotes: {
        dawn: 'Mây trắng đục nhuộm ánh bình minh hồng nhạt, 200 bông tuyết.',
        morning: 'Cảnh vật phủ tuyết, ánh sáng khuếch tán mềm mại buổi sáng.',
        noon: '200 bông tuyết (2–5px) rơi đều ở tốc độ 2.5px/frame.',
        afternoon: 'Tuyết rơi vừa trong ánh khuếch tán dịu cuối chiều.',
        dusk: 'Chạng vạng mờ sương tuyết 2–5px đa tầng.',
        night: 'Đêm tuyết phủ trắng ánh đèn đô thị ấm áp.',
      },
    },
    75: {
      code: 75,
      category: 'SNOW_ICE',
      icon: '❄️',
      nightIcon: '❄️',
      enName: 'Snow fall: Heavy intensity',
      viName: 'Tuyết dày',
      viDetail: 'Tuyết rơi dày đặc.',
      file: 'snow_heavy',
      fxType: 'snow',
      fxName: 'snow_heavy',
      count: 450,
      speed: 4.0,
      len: 0,
      minRadius: 1.8,
      maxRadius: 5.2,
      windShearFactor: 1.7,
      opacity: 0.84,
      isColdTone: true,
      cloudDensity: 8,
      fogDensity: 0.36,
      desaturatePct: 60,
      lightingDarkness: 0.26,
      techNoteVi: '450 bông tuyết dày đặc, bay nghiêng mạnh theo chiều gió.',
      phaseNotes: {
        dawn: 'Bầu trời trắng xóa mù mịt rạng đông, 450 bông tuyết bay nghiêng.',
        morning: 'Tầm nhìn hạn chế, tuyết bay mù trời tốc độ 4px/frame.',
        noon: 'Trưa trắng xóa mù mịt, tuyết bay nghiêng theo gió.',
        afternoon: 'Chiều mù tuyết dày đặc che mờ cảnh xa.',
        dusk: 'Chạng vạng trắng đục mờ ảo, tuyết bay rợp trời.',
        night: 'Đêm tuyết dày 450 bông cuộn xiên mạnh trong gió.',
      },
    },
    77: {
      code: 77,
      category: 'SNOW_ICE',
      icon: '🌨️',
      nightIcon: '🌨️',
      enName: 'Snow grains',
      viName: 'Tuyết hạt',
      viDetail: 'Mưa tuyết hạt (hạt tuyết cứng nhỏ).',
      file: 'snow_grains',
      fxType: 'snow',
      fxName: 'snow_grains',
      count: 250,
      speed: 5.0,
      len: 0,
      minRadius: 1.6,
      maxRadius: 2.2,
      straightFall: true,
      opacity: 0.78,
      isColdTone: true,
      cloudDensity: 7,
      fogDensity: 0.2,
      desaturatePct: 55,
      lightingDarkness: 0.25,
      techNoteVi: '250 hạt tuyết nhỏ (2px), rơi thẳng và nhanh hơn tuyết bông.',
      phaseNotes: {
        dawn: 'Bầu trời xám bạc khô lạnh lúc bình minh, 250 hạt tuyết 2px.',
        morning: 'Các hạt tuyết nhỏ sắc nét rơi thẳng tốc độ 5px/frame.',
        noon: 'Trời xám bạc khô hanh, mưa tuyết hạt rơi dứt khoát.',
        afternoon: 'Không khí khô lạnh buổi chiều, hạt tuyết sắc nét.',
        dusk: 'Hoàng hôn xám lạnh, 250 hạt tuyết 2px rơi thẳng.',
        night: 'Đêm giá lạnh khô ráo, mưa tuyết hạt trắng mịn.',
      },
    },
    80: {
      code: 80,
      category: 'SHOWERS_THUNDER',
      icon: '🌦️',
      nightIcon: '🌧️',
      enName: 'Rain showers: Slight',
      viName: 'Mưa rào nhẹ',
      viDetail: 'Mưa rào nhẹ (mưa bóng mây).',
      file: 'shower_slight',
      fxType: 'rain',
      fxName: 'rain_slight + god_rays',
      count: 180,
      speed: 11,
      len: 16,
      lineWidth: 1.25,
      opacity: 0.56,
      hasGodRays: true,
      cloudDensity: 5,
      fogDensity: 0.1,
      desaturatePct: 24,
      lightingDarkness: 0.18,
      techNoteVi: 'Mưa hạt thưa 180 vệt kèm hiệu ứng tia sáng (crepuscular rays) chiếu xiên.',
      phaseNotes: {
        dawn: 'Mưa bóng mây rạng đông với tia sáng bình minh rẽ mây.',
        morning: 'Mây đen xen khoảng trời sáng và tia nắng xiên qua màn mưa.',
        noon: 'Mưa bóng mây giữa trưa, tia nắng crepuscular rực rỡ.',
        afternoon: 'Tia nắng mật ong chiều tà rọi xiên qua màn mưa rào nhẹ.',
        dusk: 'Ánh hoàng hôn rực rỡ xuyên qua màn mưa bóng mây tuyệt đẹp.',
        night: 'Ánh trăng rẽ mây rọi nhẹ qua màn mưa rào đêm.',
      },
    },
    81: {
      code: 81,
      category: 'SHOWERS_THUNDER',
      icon: '🌧️',
      nightIcon: '🌧️',
      enName: 'Rain showers: Moderate',
      viName: 'Mưa rào vừa',
      viDetail: 'Mưa rào vừa, bất chợt.',
      file: 'shower_mod',
      fxType: 'rain',
      fxName: 'rain_moderate + gust',
      count: 350,
      speed: 15,
      len: 20,
      lineWidth: 1.4,
      opacity: 0.65,
      hasGustCycle: true,
      hasBottomSplash: true,
      cloudDensity: 7,
      fogDensity: 0.2,
      desaturatePct: 45,
      lightingDarkness: 0.34,
      techNoteVi: 'Mưa rào từng đợt (mật độ hạt tăng giảm theo chu kỳ gió giật 10 giây).',
      phaseNotes: {
        dawn: 'Đám mây vũ tích tối màu trôi nhanh, chân trời vẫn hửng hồng bình minh.',
        morning: 'Mưa rào từng đợt bất chợt, mật độ tăng giảm chu kỳ 10 giây.',
        noon: 'Mây vũ tích lớn trôi nhanh, mưa rào 350 vệt từng cơn.',
        afternoon: 'Mưa rào chiều bất chợt, chân trời vẫn hửng nắng vàng.',
        dusk: 'Chân trời rực hoàng hôn tương phản dưới đám mây vũ tích.',
        night: 'Mưa rào đêm bất chợt từng cơn theo luồng gió giật 10 giây.',
      },
    },
    82: {
      code: 82,
      category: 'SHOWERS_THUNDER',
      icon: '⛈️',
      nightIcon: '⛈️',
      enName: 'Rain showers: Violent',
      viName: 'Mưa rào xối xả',
      viDetail: 'Mưa rào xối xả (mưa trút nước).',
      file: 'shower_violent',
      fxType: 'rain',
      fxName: 'rain_torrential',
      count: 750,
      speed: 22,
      len: 28,
      lineWidth: 1.75,
      opacity: 0.78,
      hasBottomSplash: true,
      hasBottomMist: true,
      cloudDensity: 9,
      fogDensity: 0.38,
      desaturatePct: 72,
      lightingDarkness: 0.52,
      techNoteVi: '750 vệt mưa dày đặc, độ mờ cao tạo hiệu ứng màn nước trắng.',
      phaseNotes: {
        dawn: 'Bức tường mây đen ập tới ngay rạng đông, mưa trút thác nước.',
        morning: '750 vệt mưa xối xả tốc độ 22px/frame che kín tầm nhìn.',
        noon: 'Giữa trưa tối sầm như đêm dưới bức tường mây trút nước.',
        afternoon: 'Mưa rào xối xả chiều tà tạo màn sương nước trắng xóa.',
        dusk: 'Bức tường mây đen kịt ập tới lúc hoàng hôn, mưa như thác đổ.',
        night: 'Đêm mưa rào dữ dội 750 vệt trắng xóa xối xả.',
      },
    },
    85: {
      code: 85,
      category: 'SNOW_ICE',
      icon: '🌨️',
      nightIcon: '🌨️',
      enName: 'Snow showers: Slight',
      viName: 'Mưa tuyết nhẹ',
      viDetail: 'Mưa tuyết rào nhẹ.',
      file: 'snow_shower_l',
      fxType: 'snow',
      fxName: 'snow_slight + god_rays',
      count: 150,
      speed: 3.0,
      len: 0,
      minRadius: 1.6,
      maxRadius: 4.0,
      hasGodRays: true,
      opacity: 0.78,
      isColdTone: true,
      cloudDensity: 6,
      fogDensity: 0.16,
      desaturatePct: 40,
      lightingDarkness: 0.18,
      techNoteVi: 'Tuyết rơi từng đợt nhẹ kèm luồng ánh sáng mờ từ trên cao.',
      phaseNotes: {
        dawn: 'Mây xám xen luồng sáng bình minh rọi qua màn tuyết rào nhẹ.',
        morning: '150 bông tuyết rơi từng đợt kèm tia sáng lạnh từ trên cao.',
        noon: 'Ánh sáng lạnh rẽ mây xám chiếu qua 150 bông tuyết.',
        afternoon: 'Tia sáng chiều tà lạnh lẽo rọi xiên qua mưa tuyết rào.',
        dusk: 'Mây xám tím xen ánh hoàng hôn qua đợt tuyết rào nhẹ.',
        night: 'Luồng ánh trăng mờ rẽ mây rọi lên 150 bông tuyết đêm.',
      },
    },
    86: {
      code: 86,
      category: 'SNOW_ICE',
      icon: '❄️',
      nightIcon: '❄️',
      enName: 'Snow showers: Heavy',
      viName: 'Mưa tuyết dày',
      viDetail: 'Mưa tuyết rào dày đặc.',
      file: 'snow_shower_h',
      fxType: 'snow',
      fxName: 'snow_blizzard',
      count: 500,
      speed: 5.5,
      len: 0,
      minRadius: 2.0,
      maxRadius: 5.4,
      windShearFactor: 2.1,
      blizzardSwirl: true,
      hasBottomMist: true,
      opacity: 0.88,
      isColdTone: true,
      cloudDensity: 9,
      fogDensity: 0.44,
      desaturatePct: 68,
      lightingDarkness: 0.34,
      techNoteVi: '500 bông tuyết xoáy mạnh, tốc độ cao (5.5px/frame), kèm lớp sương mờ.',
      phaseNotes: {
        dawn: 'Mây dày tối màu cuồn cuộn trút bão tuyết bình minh.',
        morning: '500 bông tuyết xoáy mạnh 5.5px/frame kèm màn sương bão tuyết.',
        noon: 'Bão tuyết cuồn cuộn giữa trưa trong màn sương mờ.',
        afternoon: 'Đợt mưa tuyết rào dày đặc gió xoáy rít qua chiều tà.',
        dusk: 'Bão tuyết chạng vạng cuộn xiên mạnh, tầm nhìn mờ mịt.',
        night: 'Đêm bão tuyết blizzard 500 bông xoáy dữ dội.',
      },
    },
    95: {
      code: 95,
      category: 'SHOWERS_THUNDER',
      icon: '⛈️',
      nightIcon: '🌩️',
      enName: 'Thunderstorm: Slight or moderate',
      viName: 'Giông bão',
      viDetail: 'Giông bão kèm sấm sét nhẹ đến vừa.',
      file: 'thunderstorm',
      fxType: 'thunder',
      fxName: 'rain_heavy + lightning',
      count: 500,
      speed: 18,
      len: 24,
      lineWidth: 1.6,
      opacity: 0.74,
      lightningIntervalMs: [6000, 12000],
      hasBottomSplash: true,
      cloudDensity: 9,
      fogDensity: 0.28,
      desaturatePct: 62,
      lightingDarkness: 0.5,
      techNoteVi: 'Mưa lớn 500 vệt + chớp sáng màn hình (flash) và tia sét ngẫu nhiên mỗi 6–12s.',
      phaseNotes: {
        dawn: 'Mây giông đen tím cuồn cuộn lúc hừng đông kèm sấm chớp.',
        morning: 'Mưa lớn 500 vệt 18px/frame + tia sét lóe rạch mây mỗi 6–12s.',
        noon: 'Trưa đen sầm tím ngắt dưới mây giông và chớp sét bất chợt.',
        afternoon: 'Mây giông đen tím ập tới chiều tà, tia sét xé ngang bầu trời.',
        dusk: 'Tương phản cực mạnh giữa mây đen tím và ánh đỏ chân trời + chớp sét.',
        night: 'Đêm giông bão uy nghi với tia sét rạch nền trời đen tím.',
      },
    },
    96: {
      code: 96,
      category: 'SHOWERS_THUNDER',
      icon: '🌩️',
      nightIcon: '🌩️',
      enName: 'Thunderstorm with slight hail',
      viName: 'Giông & mưa đá nhỏ',
      viDetail: 'Giông bão có sấm sét kèm mưa đá nhỏ.',
      file: 'thunder_hail_l',
      fxType: 'thunder',
      fxName: 'rain_heavy + lightning + hail_slight',
      count: 550,
      speed: 19,
      len: 24,
      lineWidth: 1.65,
      opacity: 0.76,
      lightningIntervalMs: [5500, 11000],
      hailCount: 38,
      hailSize: 3.5,
      hasBottomSplash: true,
      cloudDensity: 9,
      fogDensity: 0.3,
      desaturatePct: 65,
      lightingDarkness: 0.52,
      techNoteVi: 'Giống mã 95 + thêm các viên đá trắng tròn nảy nhẹ khi chạm đáy.',
      phaseNotes: {
        dawn: 'Mây giông ánh xanh xám đặc trưng của mưa đá buổi sớm.',
        morning: '550 vệt mưa, chớp sét 6–12s + viên mưa đá trắng tròn nảy ở đáy.',
        noon: 'Không khí nặng nề màu xanh xám giông đá giữa trưa.',
        afternoon: 'Giông chiều xanh xám kèm mưa đá nhỏ nảy lách tách.',
        dusk: 'Chạng vạng u ám ánh xanh xám đặc trưng của mây mưa đá.',
        night: 'Đêm giông sét kèm hạt mưa đá trắng tròn bật nảy.',
      },
    },
    99: {
      code: 99,
      category: 'SHOWERS_THUNDER',
      icon: '🌪️',
      nightIcon: '🌪️',
      enName: 'Thunderstorm with heavy hail',
      viName: 'Giông & mưa đá lớn',
      viDetail: 'Giông bão dữ dội kèm mưa đá lớn.',
      file: 'thunder_hail_h',
      fxType: 'thunder',
      fxName: 'rain_torrential + lightning_fast + hail_heavy',
      count: 750,
      speed: 22,
      len: 28,
      lineWidth: 1.85,
      opacity: 0.82,
      lightningIntervalMs: [3000, 6000],
      hailCount: 85,
      hailSize: 6.2,
      stormGreenCast: true,
      hasBottomSplash: true,
      hasBottomMist: true,
      cloudDensity: 10,
      fogDensity: 0.4,
      desaturatePct: 75,
      lightingDarkness: 0.58,
      techNoteVi: 'Mưa xối xả 750 vệt + chớp sét liên tục (3–6s/lần) + mưa đá hạt lớn.',
      phaseNotes: {
        dawn: 'Bầu trời đen kịt ánh xanh lục u ám cực đoan ngay lúc hừng đông.',
        morning: '750 vệt mưa trút xả + chớp sét 3–6s/lần + mưa đá hạt lớn.',
        noon: 'Bão tố cực đoan che tối rầm giữa trưa, tia sét liên tục.',
        afternoon: 'Trời đen ánh xanh lục u ám, mưa đá lớn dồn dập.',
        dusk: 'Hoàng hôn biến mất sau cơn bão giông đá cực đoan sét giật 3–6s.',
        night: 'Đêm cuồng phong bão tố cực đoan, sét xé liên hồi và mưa đá lớn.',
      },
    },
  });

  const MOD43_WMO_CODES_LIST = Object.freeze(
    Object.keys(MOD43_WMO_WEATHER_MATRIX)
      .map((k) => Number(k))
      .sort((a, b) => a - b)
      .map((code) => MOD43_WMO_WEATHER_MATRIX[code])
  );

  const MOD43_WEATHER_CATEGORIES = Object.freeze([
    { key: 'ALL', label: 'Tất cả (28)' },
    { key: 'CLEAR_CLOUD', label: '☀️ Quang & Mây (4)' },
    { key: 'FOG_FROST', label: '🌫️ Sương mù (2)' },
    { key: 'DRIZZLE_RAIN', label: '🌧️ Mưa phùn & Mưa (11)' },
    { key: 'SNOW_ICE', label: '❄️ Tuyết (6)' },
    { key: 'SHOWERS_THUNDER', label: '⛈️ Mưa rào & Giông sét (5)' },
  ]);

  const MOD43_QUICK_SCENARIO_PRESETS = Object.freeze([
    {
      id: 'dusk_1730_partly',
      label: '🌆 17:30 Chạng vạng ít mây',
      code: 2,
      phase: 'dusk',
      wind: 14,
    },
    {
      id: 'dawn_drizzle_51',
      label: '🌅 Bình minh mưa phùn (51)',
      code: 51,
      phase: 'dawn',
      wind: 8,
    },
    {
      id: 'afternoon_golden_clear',
      label: '🌇 Nắng chiều mật ong (0)',
      code: 0,
      phase: 'afternoon',
      wind: 10,
    },
    {
      id: 'night_stars_milky',
      label: '🌌 Đêm quang 90 sao (0)',
      code: 0,
      phase: 'night',
      wind: 5,
    },
    {
      id: 'dusk_thunder_95',
      label: '⛈️ Chạng vạng giông sét (95)',
      code: 95,
      phase: 'dusk',
      wind: 36,
    },
    {
      id: 'dusk_snow_71',
      label: '❄️ Hoàng hôn tuyết nhẹ (71)',
      code: 71,
      phase: 'dusk',
      wind: 11,
    },
  ]);

  const DEFAULT_STATE = Object.freeze({
    bgMode: 'off', // 'off' | 'realtime' | 'custom'
    previewFollowsRealtime: true,
    customWmoCode: 51,
    customPhaseId: 'dusk',
    customWindKmh: 14,
    locationSource: 'auto_gps_or_zone', // 'gps' | 'mod42_zone' | 'default'
    gpsCoords: null, // { lat, lon, label }
    lastRealtimeSnapshot: null,
    selectedCategory: 'ALL',
    showCustomMatrix: false,
    showTuningPanel: false,
    allowHttpServerFolderProbe: false,
    tuning: {
      opacityPct: 92,
      blurPx: 0,
      brightnessPct: 100,
      darknessPct: 18,
      contrastPct: 105,
      saturatePct: 105,
      uiGlassPct: 72,
      fxIntensityPct: 100,
      kenBurnsMotion: true,
    },
  });

  function cloneDefaultState() {
    return {
      ...DEFAULT_STATE,
      tuning: { ...DEFAULT_STATE.tuning },
    };
  }

  function escapeHtml(str) {
    if (NS.uiUtils && typeof NS.uiUtils.escapeHtml === 'function') {
      return NS.uiUtils.escapeHtml(str);
    }
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pad2(num) {
    return String(Math.max(0, Math.floor(Number(num) || 0))).padStart(2, '0');
  }

  function clampNumber(val, minVal, maxVal, fallbackVal) {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallbackVal;
    return Math.max(minVal, Math.min(maxVal, n));
  }

  function formatMinutesAsClock(totalMins) {
    const wrapped = ((Math.round(Number(totalMins) || 0) % 1440) + 1440) % 1440;
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${pad2(h)}:${pad2(m)}`;
  }

  function lookupWmoConfig(code) {
    const num = Number(code);
    if (Object.prototype.hasOwnProperty.call(MOD43_WMO_WEATHER_MATRIX, num)) {
      return MOD43_WMO_WEATHER_MATRIX[num];
    }
    return MOD43_WMO_WEATHER_MATRIX[0];
  }

  function lookupPhaseConfig(phaseId) {
    return MOD43_TIME_PHASE_MAP[phaseId] || MOD43_TIME_PHASE_MAP.noon;
  }

  /**
   * --------------------------------------------------------------------------
   * TÍNH TOÁN CHÍNH XÁC 1 TRONG 6 KHUNG GIỜ (KHÔNG BỊ LỆCH MÚI GIỜ OS)
   * Parse "YYYY-MM-DDTHH:MM" trực tiếp thành phút trong ngày (HH * 60 + MM)
   * rồi đối chiếu với giờ phút thực tại của địa phương (wall-clock theo IANA).
   * --------------------------------------------------------------------------
   */
  class Mod43PhaseCalculator {
    static parseIsoWallClockMinutes(isoStr, fallbackMins = 350) {
      const m = String(isoStr || '').match(/T(\d{1,2}):(\d{2})/);
      if (!m) return fallbackMins;
      const hh = clampNumber(m[1], 0, 23, 6);
      const mm = clampNumber(m[2], 0, 59, 0);
      return hh * 60 + mm;
    }

    static getZonedWallClockInfo(zoneIana, nowDate) {
      const d = nowDate instanceof Date ? nowDate : new Date();
      // Ưu tiên lấy đúng giờ đang cấu hình nếu đang đồng bộ cùng khu vực Mod 42
      const mod42Ctrl = NS.worldClockStudio?.controller;
      if (mod42Ctrl && !zoneIana) {
        const p = mod42Ctrl.getCurrentZonedParts(d);
        const dateText =
          NS.i18n && typeof NS.i18n.formatDate === 'function'
            ? NS.i18n.formatDate({ year: p.year, month: p.month, day: p.day })
            : `${pad2(p.day)}/${pad2(p.month)}/${p.year}`;
        return {
          hour: p.hour,
          minute: p.minute,
          second: p.second,
          currentMins: p.hour * 60 + p.minute,
          clockText: `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`,
          dateText,
          zoneLabel: p.gmtText,
        };
      }

      const targetZone = zoneIana || mod42Ctrl?.getActiveZoneEntry?.()?.iana || 'Asia/Ho_Chi_Minh';
      try {
        const fmt = new Intl.DateTimeFormat('en-GB', {
          timeZone: targetZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        const map = {};
        for (const pt of fmt.formatToParts(d)) {
          if (pt.type !== 'literal') map[pt.type] = pt.value;
        }
        let hour = Number(map.hour);
        if (hour === 24) hour = 0;
        const minute = Number(map.minute) || 0;
        const second = Number(map.second) || 0;
        return {
          hour,
          minute,
          second,
          currentMins: hour * 60 + minute,
          clockText: `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`,
          dateText:
            NS.i18n && typeof NS.i18n.formatDate === 'function'
              ? NS.i18n.formatDate({ year: Number(map.year), month: Number(map.month), day: Number(map.day) })
              : `${map.day}/${map.month}/${map.year}`,
          zoneLabel: targetZone,
        };
      } catch (_err) {
        const h = d.getHours();
        const m = d.getMinutes();
        const s = d.getSeconds();
        return {
          hour: h,
          minute: m,
          second: s,
          currentMins: h * 60 + m,
          clockText: `${pad2(h)}:${pad2(m)}:${pad2(s)}`,
          dateText:
            NS.i18n && typeof NS.i18n.formatDate === 'function'
              ? NS.i18n.formatDate(d)
              : `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
          zoneLabel: targetZone || 'Local',
        };
      }
    }

    static getTimePhaseFromMinutes(currentMins, sunriseMins = 350, sunsetMins = 1045) {
      const c = ((Math.floor(Number(currentMins) || 0) % 1440) + 1440) % 1440;
      const sr = clampNumber(sunriseMins, 180, 540, 350);
      const ss = clampNumber(sunsetMins, 840, 1320, 1045);

      if (c >= sr - 45 && c < sr + 15) {
        return 'dawn';
      }
      if (c >= sr + 15 && c < 630) {
        return 'morning';
      }
      if (c >= 630 && c < 930) {
        return 'noon';
      }
      if (c >= 930 && c < ss - 30) {
        return 'afternoon';
      }
      if (c >= ss - 30 && c <= ss + 40) {
        return 'dusk';
      }
      return 'night';
    }

    static getTimePhaseFromSunriseSunsetIso(sunriseIso, sunsetIso, zoneIana, nowDate) {
      const sunriseMins = this.parseIsoWallClockMinutes(sunriseIso, 350);
      const sunsetMins = this.parseIsoWallClockMinutes(sunsetIso, 1045);
      const clock = this.getZonedWallClockInfo(zoneIana, nowDate);
      return this.getTimePhaseFromMinutes(clock.currentMins, sunriseMins, sunsetMins);
    }

    static buildPhaseScheduleTable(sunriseMins = 350, sunsetMins = 1045) {
      const sr = clampNumber(sunriseMins, 180, 540, 350);
      const ss = clampNumber(sunsetMins, 840, 1320, 1045);
      return [
        { phaseId: 'dawn', start: sr - 45, end: sr + 15, label: `${formatMinutesAsClock(sr - 45)} – ${formatMinutesAsClock(sr + 15)}` },
        { phaseId: 'morning', start: sr + 15, end: 630, label: `${formatMinutesAsClock(sr + 15)} – 10:30` },
        { phaseId: 'noon', start: 630, end: 930, label: '10:30 – 15:30' },
        { phaseId: 'afternoon', start: 930, end: ss - 30, label: `15:30 – ${formatMinutesAsClock(ss - 30)}` },
        { phaseId: 'dusk', start: ss - 30, end: ss + 40, label: `${formatMinutesAsClock(ss - 30)} – ${formatMinutesAsClock(ss + 40)}` },
        { phaseId: 'night', start: ss + 40, end: sr - 45, label: `${formatMinutesAsClock(ss + 40)} – ${formatMinutesAsClock(sr - 45)}` },
      ];
    }
  }

  /**
   * --------------------------------------------------------------------------
   * DỊCH VỤ ĐỊNH VỊ GPS & ĐỒNG BỘ OPEN-METEO (CÓ SUNRISE / SUNSET THỰC)
   * Tích hợp cache + silent fallback khi offline để không bao giờ gây lỗi console.
   * --------------------------------------------------------------------------
   */
  class Mod43WeatherApiClient {
    constructor() {
      this.cache = new Map();
    }

    resolveTargetLocation(state) {
      const mod42 = NS.worldClockStudio?.controller;
      // Ưu tiên GPS thật nếu người dùng vừa cấp quyền định vị vị trí thực
      if (state.gpsCoords && Number.isFinite(state.gpsCoords.lat) && Number.isFinite(state.gpsCoords.lon)) {
        return {
          lat: Number(state.gpsCoords.lat),
          lon: Number(state.gpsCoords.lon),
          locationName: state.gpsCoords.label || '📍 Vị trí GPS thực tế của bạn',
          iana: state.gpsCoords.iana || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
          sourceKind: 'gps',
        };
      }

      // Nếu không có GPS, dùng thành phố/múi giờ đang chọn ở Mod 42 hoặc Weather override ở Mod 42
      if (mod42) {
        const override = mod42.state?.weatherCityOverride;
        const zone = mod42.getActiveZoneEntry();
        if (override && Number.isFinite(override.lat) && Number.isFinite(override.lon)) {
          return {
            lat: Number(override.lat),
            lon: Number(override.lon),
            locationName: override.name || `${zone.flag} ${zone.cityVi}`,
            iana: override.iana || zone.iana || 'Asia/Ho_Chi_Minh',
            sourceKind: 'mod42_city',
          };
        }
        if (zone && Number.isFinite(zone.lat) && Number.isFinite(zone.lon)) {
          return {
            lat: Number(zone.lat),
            lon: Number(zone.lon),
            locationName: `${zone.flag} ${zone.cityVi}, ${zone.countryVi}`,
            iana: zone.iana || 'Asia/Ho_Chi_Minh',
            sourceKind: 'mod42_zone',
          };
        }
      }

      return {
        lat: MOD43_CONSTANTS.DEFAULT_COORDS.lat,
        lon: MOD43_CONSTANTS.DEFAULT_COORDS.lon,
        locationName: `🇻🇳 ${MOD43_CONSTANTS.DEFAULT_COORDS.cityVi}`,
        iana: MOD43_CONSTANTS.DEFAULT_COORDS.iana,
        sourceKind: 'default',
      };
    }

    buildDeterministicFallbackSnapshot(loc) {
      const clock = Mod43PhaseCalculator.getZonedWallClockInfo(loc.iana, new Date());
      const sunriseMins = 350;
      const sunsetMins = 1045;
      const phaseId = Mod43PhaseCalculator.getTimePhaseFromMinutes(clock.currentMins, sunriseMins, sunsetMins);
      const latAbs = Math.abs(Number(loc.lat) || 21);
      // Ước lượng hợp lý theo vĩ độ & khung giờ khi chưa nối internet hoặc đang chạy cục bộ offline
      const seed = Math.abs(Math.round((Number(loc.lat) * 17 + Number(loc.lon) * 31) % 7));
      const fallbackCodes = [1, 2, 51, 3, 61, 0, 80];
      const wmoCode = latAbs > 60 ? 71 : fallbackCodes[seed];
      const baseTemp = Math.round(30 - latAbs * 0.34 + (phaseId === 'noon' || phaseId === 'afternoon' ? 3 : -2));
      const windSpeed = 7 + (seed % 5) * 3;
      const cfg = lookupWmoConfig(wmoCode);

      return {
        sourceMode: 'offline_estimate',
        sourceLabel: 'Ước lượng địa phương (Sẵn sàng đồng bộ Online)',
        locationName: loc.locationName,
        lat: Number(loc.lat),
        lon: Number(loc.lon),
        iana: loc.iana,
        wmoCode: cfg.code,
        tempC: baseTemp,
        apparentTempC: baseTemp + 1,
        windSpeedKmh: windSpeed,
        humidityPct: cfg.fxType === 'rain' ? 84 : 68,
        cloudCoverPct: cfg.cloudDensity * 10,
        pressureHpa: 1011,
        sunriseIso: `2026-11-14T${formatMinutesAsClock(sunriseMins)}`,
        sunsetIso: `2026-11-14T${formatMinutesAsClock(sunsetMins)}`,
        sunriseMins,
        sunsetMins,
        timePhase: phaseId,
        fetchedAt: Date.now(),
      };
    }

    async fetchRealtimeWeatherForLocation(loc, forceRefresh = false) {
      const cacheKey = `${Number(loc.lat).toFixed(2)},${Number(loc.lon).toFixed(2)}`;
      const cached = this.cache.get(cacheKey);
      if (!forceRefresh && cached && Date.now() - cached.fetchedAt < 10 * 60 * 1000) {
        // Luôn tính lại phase hiện tại theo phút mới nhất
        const clock = Mod43PhaseCalculator.getZonedWallClockInfo(cached.iana || loc.iana, new Date());
        return {
          ...cached,
          timePhase: Mod43PhaseCalculator.getTimePhaseFromMinutes(
            clock.currentMins,
            cached.sunriseMins,
            cached.sunsetMins
          ),
        };
      }

      const params = new URLSearchParams({
        latitude: String(Number(loc.lat) || 21.0285),
        longitude: String(Number(loc.lon) || 105.8542),
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,surface_pressure',
        daily: 'sunrise,sunset',
        timezone: 'auto',
        forecast_days: '2',
      });

      const abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timerId = abortCtrl ? setTimeout(() => abortCtrl.abort(), 4500) : null;

      try {
        const res = await fetch(`${OPEN_METEO_ENDPOINT}?${params.toString()}`, {
          method: 'GET',
          signal: abortCtrl ? abortCtrl.signal : undefined,
        });
        if (timerId) clearTimeout(timerId);
        if (!res.ok) throw new Error(`HTTP_${res.status}`);
        const data = await res.json();
        if (!data || !data.current) throw new Error('EMPTY_WEATHER_PAYLOAD');

        const cur = data.current;
        const sunriseIso = Array.isArray(data.daily?.sunrise) ? data.daily.sunrise[0] : '2026-11-14T05:50';
        const sunsetIso = Array.isArray(data.daily?.sunset) ? data.daily.sunset[0] : '2026-11-14T17:25';
        const sunriseMins = Mod43PhaseCalculator.parseIsoWallClockMinutes(sunriseIso, 350);
        const sunsetMins = Mod43PhaseCalculator.parseIsoWallClockMinutes(sunsetIso, 1045);
        const zoneIana = data.timezone || loc.iana || 'Asia/Ho_Chi_Minh';
        const clock = Mod43PhaseCalculator.getZonedWallClockInfo(zoneIana, new Date());
        const phaseId = Mod43PhaseCalculator.getTimePhaseFromMinutes(
          clock.currentMins,
          sunriseMins,
          sunsetMins
        );
        const cfg = lookupWmoConfig(cur.weather_code);

        const parsed = {
          sourceMode: 'open_meteo_live',
          sourceLabel: 'Thời tiết Real-Time (Open-Meteo + Sunrise/Sunset)',
          locationName: loc.locationName,
          lat: Number(loc.lat),
          lon: Number(loc.lon),
          iana: zoneIana,
          wmoCode: cfg.code,
          tempC: Number(cur.temperature_2m ?? 26),
          apparentTempC: Number(cur.apparent_temperature ?? cur.temperature_2m ?? 26),
          windSpeedKmh: Number(cur.wind_speed_10m ?? 10),
          humidityPct: Number(cur.relative_humidity_2m ?? 72),
          cloudCoverPct: Number(cur.cloud_cover ?? 25),
          pressureHpa: Number(cur.surface_pressure ?? 1012),
          sunriseIso,
          sunsetIso,
          sunriseMins,
          sunsetMins,
          timePhase: phaseId,
          fetchedAt: Date.now(),
        };
        this.cache.set(cacheKey, parsed);
        return parsed;
      } catch (_err) {
        if (timerId) clearTimeout(timerId);
        // Nếu Mod 42 đã lấy được snapshot gần đây cho cùng vùng thì tận dụng lại
        const mod42Snap = NS.worldClockStudio?.controller?.latestWeatherSnapshot;
        if (mod42Snap && mod42Snap.current) {
          const clock = Mod43PhaseCalculator.getZonedWallClockInfo(loc.iana, new Date());
          const sr = 350;
          const ss = 1045;
          return {
            sourceMode: mod42Snap.sourceMode || 'offline_estimate',
            sourceLabel: mod42Snap.sourceLabel || 'Đồng bộ từ Module 42',
            locationName: mod42Snap.locationName || loc.locationName,
            lat: Number(loc.lat),
            lon: Number(loc.lon),
            iana: mod42Snap.zoneIana || loc.iana,
            wmoCode: lookupWmoConfig(mod42Snap.current.weatherCode).code,
            tempC: Number(mod42Snap.current.tempC ?? 26),
            apparentTempC: Number(mod42Snap.current.feelsLikeC ?? 27),
            windSpeedKmh: Number(mod42Snap.current.windKmh ?? 10),
            humidityPct: Number(mod42Snap.current.humidity ?? 75),
            cloudCoverPct: Number(mod42Snap.current.cloudCover ?? 40),
            pressureHpa: Number(mod42Snap.current.pressureHpa ?? 1012),
            sunriseIso: `2026-11-14T${formatMinutesAsClock(sr)}`,
            sunsetIso: `2026-11-14T${formatMinutesAsClock(ss)}`,
            sunriseMins: sr,
            sunsetMins: ss,
            timePhase: Mod43PhaseCalculator.getTimePhaseFromMinutes(clock.currentMins, sr, ss),
            fetchedAt: Date.now(),
          };
        }
        return this.buildDeterministicFallbackSnapshot(loc);
      }
    }

    lookupKnownDistrictCity(lat, lon) {
      const nLat = Number(lat);
      const nLon = Number(lon);
      if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) return '';
      const boxes = [
        // Đà Nẵng — chi tiết cấp Phường/Xã (Sơn Trà & các quận/phường trung tâm)
        { minLat: 16.06, maxLat: 16.085, minLon: 108.225, maxLon: 108.255, name: 'Phường An Hải, Sơn Trà, Đà Nẵng' },
        { minLat: 16.048, maxLat: 16.068, minLon: 108.235, maxLon: 108.255, name: 'Phường Phước Mỹ, Sơn Trà, Đà Nẵng' },
        { minLat: 16.075, maxLat: 16.095, minLon: 108.24, maxLon: 108.26, name: 'Phường Mân Thái, Sơn Trà, Đà Nẵng' },
        { minLat: 16.08, maxLat: 16.105, minLon: 108.22, maxLon: 108.245, name: 'Phường Nại Hiên Đông, Sơn Trà, Đà Nẵng' },
        { minLat: 16.09, maxLat: 16.14, minLon: 108.23, maxLon: 108.32, name: 'Phường Thọ Quang, Sơn Trà, Đà Nẵng' },
        { minLat: 16.04, maxLat: 16.14, minLon: 108.21, maxLon: 108.32, name: 'Sơn Trà, Đà Nẵng' },
        { minLat: 16.055, maxLat: 16.08, minLon: 108.205, maxLon: 108.225, name: 'Phường Hải Châu, Hải Châu, Đà Nẵng' },
        { minLat: 16.02, maxLat: 16.09, minLon: 108.18, maxLon: 108.23, name: 'Hải Châu, Đà Nẵng' },
        { minLat: 15.97, maxLat: 16.045, minLon: 108.23, maxLon: 108.29, name: 'Ngũ Hành Sơn, Đà Nẵng' },
        { minLat: 16.04, maxLat: 16.08, minLon: 108.16, maxLon: 108.21, name: 'Thanh Khê, Đà Nẵng' },
        { minLat: 16.05, maxLat: 16.16, minLon: 108.08, maxLon: 108.18, name: 'Liên Chiểu, Đà Nẵng' },
        { minLat: 15.99, maxLat: 16.05, minLon: 108.16, maxLon: 108.23, name: 'Cẩm Lệ, Đà Nẵng' },
        { minLat: 15.92, maxLat: 16.22, minLon: 107.90, maxLon: 108.35, name: 'Đà Nẵng, Việt Nam' },
        // Hà Nội — cấp Phường trung tâm
        { minLat: 21.022, maxLat: 21.036, minLon: 105.845, maxLon: 105.86, name: 'Phường Hàng Trống, Hoàn Kiếm, Hà Nội' },
        { minLat: 21.01, maxLat: 21.05, minLon: 105.84, maxLon: 105.87, name: 'Hoàn Kiếm, Hà Nội' },
        { minLat: 21.02, maxLat: 21.06, minLon: 105.81, maxLon: 105.85, name: 'Ba Đình, Hà Nội' },
        { minLat: 21.025, maxLat: 21.045, minLon: 105.78, maxLon: 105.805, name: 'Phường Dịch Vọng, Cầu Giấy, Hà Nội' },
        { minLat: 21.01, maxLat: 21.06, minLon: 105.77, maxLon: 105.81, name: 'Cầu Giấy, Hà Nội' },
        { minLat: 20.99, maxLat: 21.03, minLon: 105.81, maxLon: 105.85, name: 'Đống Đa, Hà Nội' },
        { minLat: 20.94, maxLat: 21.14, minLon: 105.72, maxLon: 105.94, name: 'Hà Nội, Việt Nam' },
        // TP. Hồ Chí Minh — cấp Phường trung tâm
        { minLat: 10.77, maxLat: 10.79, minLon: 106.695, maxLon: 106.71, name: 'Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh' },
        { minLat: 10.76, maxLat: 10.80, minLon: 106.68, maxLon: 106.72, name: 'Quận 1, TP. Hồ Chí Minh' },
        { minLat: 10.79, maxLat: 10.89, minLon: 106.73, maxLon: 106.84, name: 'Thủ Đức, TP. Hồ Chí Minh' },
        { minLat: 10.68, maxLat: 10.90, minLon: 106.58, maxLon: 106.86, name: 'TP. Hồ Chí Minh, Việt Nam' },
        // Các thành phố lớn khác
        { minLat: 16.40, maxLat: 16.53, minLon: 107.52, maxLon: 107.66, name: 'Huế, Thừa Thiên Huế' },
        { minLat: 12.18, maxLat: 12.33, minLon: 109.12, maxLon: 109.25, name: 'Nha Trang, Khánh Hòa' },
        { minLat: 11.88, maxLat: 11.99, minLon: 108.39, maxLon: 108.50, name: 'Đà Lạt, Lâm Đồng' },
        { minLat: 10.00, maxLat: 10.10, minLon: 105.72, maxLon: 105.82, name: 'Ninh Kiều, Cần Thơ' },
        { minLat: 20.80, maxLat: 20.90, minLon: 106.63, maxLon: 106.75, name: 'Hải Phòng, Việt Nam' },
        { minLat: 10.32, maxLat: 10.42, minLon: 107.05, maxLon: 107.16, name: 'Vũng Tàu, Bà Rịa - Vũng Tàu' },
        { minLat: 35.60, maxLat: 35.78, minLon: 139.65, maxLon: 139.85, name: 'Tokyo, Nhật Bản' },
        { minLat: 37.45, maxLat: 37.65, minLon: 126.85, maxLon: 127.15, name: 'Seoul, Hàn Quốc' },
        { minLat: 1.24, maxLat: 1.44, minLon: 103.68, maxLon: 103.98, name: 'Singapore' },
      ];
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (nLat >= b.minLat && nLat <= b.maxLat && nLon >= b.minLon && nLon <= b.maxLon) {
          return b.name;
        }
      }
      return '';
    }

    _formatReverseGeocodePlace(parts) {
      const clean = [];
      const stripAdminPrefix = (s) =>
        String(s || '')
          .replace(/^(Thành phố|Tỉnh|Phường|Xã|Thị trấn|Quận|Huyện|Thị xã)\s+/iu, '')
          .trim()
          .toLowerCase();
      for (let i = 0; i < parts.length; i++) {
        const raw = String(parts[i] || '')
          .replace(/^(Thành phố|Tỉnh)\s+/iu, '')
          .replace(/^(Quận|Huyện|Thị xã)\s+(?!\d)/iu, '')
          .trim();
        if (!raw) continue;
        const normRaw = stripAdminPrefix(raw) || raw.toLowerCase();
        const exists = clean.some((c) => {
          const lc = stripAdminPrefix(c) || c.toLowerCase();
          return lc === normRaw || lc.indexOf(normRaw) !== -1 || normRaw.indexOf(lc) !== -1;
        });
        if (!exists) clean.push(raw);
      }
      return clean.slice(0, 3).join(', ');
    }

    formatGpsPlaceLabel(lat, lon, placeName = '') {
      const coordStr = `${Number(lat).toFixed(2)}°, ${Number(lon).toFixed(2)}°`;
      const cleanPlace = String(placeName || '').trim();
      return cleanPlace
        ? `📍 ${cleanPlace} (${coordStr})`
        : `📍 Vị trí thực của bạn (${coordStr})`;
    }

    async reverseGeocodeCoords(lat, lon) {
      const nLat = Number(lat);
      const nLon = Number(lon);
      if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) return '';
      if (!this._geoNameCache) this._geoNameCache = new Map();
      const cacheKey = `${nLat.toFixed(4)},${nLon.toFixed(4)}`;
      if (this._geoNameCache.has(cacheKey)) {
        return this._geoNameCache.get(cacheKey);
      }

      const fetchJsonWithTimeout = async (url, timeoutMs) => {
        if (typeof fetch !== 'function') return null;
        const abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timerId = abortCtrl ? setTimeout(() => abortCtrl.abort(), timeoutMs) : null;
        try {
          const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: abortCtrl ? abortCtrl.signal : undefined,
          });
          if (timerId) clearTimeout(timerId);
          if (!res || !res.ok) return null;
          return await res.json();
        } catch (_eGeo) {
          if (timerId) clearTimeout(timerId);
          return null;
        }
      };

      const hasWardPrecision = (txt) =>
        /^(Phường|Xã|Thị trấn|Ward|Commune)\b/iu.test(String(txt || '').trim()) ||
        (String(txt || '').split(',').length >= 3);

      let resolvedPlace = '';
      if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        // 1. Ưu tiên Nominatim zoom=18 để lấy chính xác tới đơn vị hành chính cơ sở (Phường / Xã / Thị trấn)
        const nom = await fetchJsonWithTimeout(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(nLat.toFixed(5))}&lon=${encodeURIComponent(nLon.toFixed(5))}&accept-language=vi&zoom=18&addressdetails=1`,
          3600
        );
        if (nom && nom.address) {
          const addr = nom.address;
          const ward =
            addr.quarter ||
            addr.suburb ||
            addr.village ||
            addr.town ||
            addr.hamlet ||
            addr.neighbourhood ||
            addr.residential ||
            '';
          const district = addr.city_district || addr.district || addr.county || '';
          const city = addr.city || addr.state || addr.province || '';
          resolvedPlace = this._formatReverseGeocodePlace([ward, district, city]);
        }

        // 2. Bổ sung BigDataCloud (kể cả localityInfo.administrative cấp 8/6/4) nếu Nominatim thiếu hoặc lỗi
        if (!resolvedPlace || !hasWardPrecision(resolvedPlace)) {
          const bdc = await fetchJsonWithTimeout(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(nLat.toFixed(5))}&longitude=${encodeURIComponent(nLon.toFixed(5))}&localityLanguage=vi`,
            2800
          );
          if (bdc) {
            const adminList = Array.isArray(bdc.localityInfo?.administrative)
              ? [...bdc.localityInfo.administrative].sort((a, b) => Number(b.adminLevel || 0) - Number(a.adminLevel || 0))
              : [];
            const wardAdmin = adminList.find((x) => Number(x.adminLevel) >= 7 && x.name)?.name || '';
            const distAdmin = adminList.find((x) => Number(x.adminLevel) === 6 && x.name)?.name || '';
            const cityAdmin = bdc.city || adminList.find((x) => Number(x.adminLevel) === 4 && x.name)?.name || bdc.principalSubdivision || '';
            const bdcPlace = this._formatReverseGeocodePlace([
              wardAdmin || bdc.locality,
              distAdmin,
              cityAdmin,
            ]);
            if (bdcPlace && (!resolvedPlace || (!hasWardPrecision(resolvedPlace) && hasWardPrecision(bdcPlace)) || bdcPlace.length > resolvedPlace.length)) {
              resolvedPlace = bdcPlace;
            }
          }
        }
      }
      const offlineBox = this.lookupKnownDistrictCity(nLat, nLon);
      if (!resolvedPlace || (!hasWardPrecision(resolvedPlace) && hasWardPrecision(offlineBox))) {
        if (offlineBox) resolvedPlace = offlineBox;
      }
      if (resolvedPlace) {
        this._geoNameCache.set(cacheKey, resolvedPlace);
      }
      return resolvedPlace;
    }

    async requestBrowserGpsCoords() {
      const tryBrowserGeo = (highAccuracy, timeoutMs) =>
        new Promise((resolve) => {
          if (typeof navigator === 'undefined' || !navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== 'function') {
            resolve({ ok: false, reason: 'Trình duyệt không hỗ trợ Geolocation.' });
            return;
          }
          try {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const lat = Number(pos?.coords?.latitude);
                const lon = Number(pos?.coords?.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
                  resolve({ ok: false, reason: 'Tọa độ GPS không hợp lệ.' });
                  return;
                }
                resolve({
                  ok: true,
                  lat,
                  lon,
                  source: 'browser_gps',
                  label: this.formatGpsPlaceLabel(lat, lon),
                });
              },
              (err) => {
                resolve({
                  ok: false,
                  code: Number(err?.code) || 0,
                  reason: err?.message || 'Chưa được cấp quyền vị trí trình duyệt.',
                });
              },
              {
                enableHighAccuracy: Boolean(highAccuracy),
                timeout: Math.max(1500, Number(timeoutMs) || 4500),
                maximumAge: 5 * 60 * 1000,
              }
            );
          } catch (err) {
            resolve({ ok: false, reason: String(err?.message || err) });
          }
        });

      const enrichGpsResultWithPlace = async (res) => {
        if (!res || !res.ok) return res;
        const placeName = await this.reverseGeocodeCoords(res.lat, res.lon).catch(() => '');
        return {
          ...res,
          placeName: placeName || '',
          label: this.formatGpsPlaceLabel(res.lat, res.lon, placeName),
        };
      };

      const firstTry = await tryBrowserGeo(false, 4500);
      if (firstTry.ok) return await enrichGpsResultWithPlace(firstTry);
      // Nếu lỗi không phải PERMISSION_DENIED (code === 1), thử lại 1 nhịp với highAccuracy cho điện thoại di động
      if (firstTry.code !== 1) {
        const secondTry = await tryBrowserGeo(true, 4500);
        if (secondTry.ok) return await enrichGpsResultWithPlace(secondTry);
      }

      // Dự phòng tự động định vị qua IP / Múi giờ khi người dùng bấm "📍 Vị Trí Thực (GPS)" trên Máy tính hoặc chưa cấp quyền GPS
      const ipFallback = await this.requestIpBasedRealLocationFallback();
      if (ipFallback && ipFallback.ok) {
        return ipFallback;
      }
      return firstTry;
    }

    async requestIpBasedRealLocationFallback() {
      if (typeof fetch === 'function') {
        const ipEndpoints = [
          {
            url: 'https://ipwho.is/',
            extract: (d) =>
              d && d.success !== false && Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude))
                ? {
                    lat: Number(d.latitude),
                    lon: Number(d.longitude),
                    city: String(d.city || d.region || d.country || '').trim(),
                    iana: String(d.timezone?.id || '').trim(),
                  }
                : null,
          },
          {
            url: 'https://ipapi.co/json/',
            extract: (d) =>
              d && Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude))
                ? {
                    lat: Number(d.latitude),
                    lon: Number(d.longitude),
                    city: String(d.city || d.region || d.country_name || '').trim(),
                    iana: String(d.timezone || '').trim(),
                  }
                : null,
          },
        ];

        for (let i = 0; i < ipEndpoints.length; i++) {
          const ep = ipEndpoints[i];
          const abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
          const timerId = abortCtrl ? setTimeout(() => abortCtrl.abort(), 3200) : null;
          try {
            const res = await fetch(ep.url, {
              method: 'GET',
              signal: abortCtrl ? abortCtrl.signal : undefined,
            });
            if (timerId) clearTimeout(timerId);
            if (res && res.ok) {
              const json = await res.json();
              const info = ep.extract(json);
              if (info && Number.isFinite(info.lat) && Number.isFinite(info.lon)) {
                const geoName = await this.reverseGeocodeCoords(info.lat, info.lon).catch(() => '');
                const resolvedName = geoName || info.city || '';
                return {
                  ok: true,
                  lat: info.lat,
                  lon: info.lon,
                  iana: info.iana || '',
                  source: 'ip_auto_fallback',
                  label: this.formatGpsPlaceLabel(info.lat, info.lon, resolvedName),
                };
              }
            }
          } catch (_eIp) {
            if (timerId) clearTimeout(timerId);
          }
        }
      }

      // Dự phòng cuối cùng: suy luận tọa độ thực từ múi giờ hệ thống của thiết bị hoặc thành phố đang chọn
      const loc = this.resolveTargetLocation(NS.weatherSkyEngine?.state || {});
      const fallbackLat = Number.isFinite(Number(loc?.lat)) ? Number(loc.lat) : MOD43_CONSTANTS.DEFAULT_COORDS.lat;
      const fallbackLon = Number.isFinite(Number(loc?.lon)) ? Number(loc.lon) : MOD43_CONSTANTS.DEFAULT_COORDS.lon;
      const fallbackPlace =
        (await this.reverseGeocodeCoords(fallbackLat, fallbackLon).catch(() => '')) ||
        String(loc?.locationName || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
      return {
        ok: true,
        lat: fallbackLat,
        lon: fallbackLon,
        iana: loc?.iana || MOD43_CONSTANTS.DEFAULT_COORDS.iana,
        source: 'timezone_auto_fallback',
        label: this.formatGpsPlaceLabel(fallbackLat, fallbackLon, fallbackPlace),
      };
    }
  }

  /**
   * --------------------------------------------------------------------------
   * KHO ẢNH NỀN THƯ MỤC `backgrounds/` (168 BIẾN THỂ .WEBP & FALLBACK DAY/NIGHT)
   * Lưu các file người dùng chọn từ máy tính vào IndexedDB để dùng dài lâu
   * mà không bao giờ gây lỗi ERR_FILE_NOT_FOUND khi thiếu ảnh cục bộ.
   * --------------------------------------------------------------------------
   */
  class Mod43BackgroundFolderVault {
    constructor() {
      this.keyToUrlMap = new Map();
      this.httpProbeCache = new Map();
    }

    openDb() {
      if (typeof indexedDB === 'undefined') return Promise.resolve(null);
      return new Promise((resolve) => {
        let settled = false;
        const done = (v) => {
          if (settled) return;
          settled = true;
          clearTimeout(t);
          resolve(v);
        };
        const t = setTimeout(() => done(null), 2000);
        try {
          const req = indexedDB.open(IDB_NAME, 1);
          req.onupgradeneeded = (ev) => {
            const db = ev.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
              db.createObjectStore(IDB_STORE, { keyPath: 'key' });
            }
          };
          req.onsuccess = (ev) => done(ev.target.result);
          req.onerror = () => done(null);
          req.onblocked = () => done(null);
        } catch (_err) {
          done(null);
        }
      });
    }

    normalizeImageStemKey(fileName) {
      return String(fileName || '')
        .split(/[\\/]/)
        .pop()
        .replace(/\.(webp|png|jpe?g|avif)$/i, '')
        .toLowerCase()
        .trim();
    }

    async loadFromIndexedDb() {
      const db = await this.openDb();
      if (!db) return 0;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(IDB_STORE, 'readonly');
          const store = tx.objectStore(IDB_STORE);
          const req = store.getAll();
          req.onsuccess = () => {
            const rows = Array.isArray(req.result) ? req.result : [];
            let count = 0;
            for (const row of rows) {
              if (row && row.key && row.blob) {
                const prevUrl = this.keyToUrlMap.get(row.key);
                if (prevUrl) {
                  try {
                    URL.revokeObjectURL(prevUrl);
                  } catch (_e) {}
                }
                this.keyToUrlMap.set(row.key, URL.createObjectURL(row.blob));
                count += 1;
              }
            }
            resolve(count);
          };
          req.onerror = () => resolve(0);
        } catch (_err) {
          resolve(0);
        }
      });
    }

    async importFileList(fileList) {
      const files = Array.from(fileList || []).filter((f) =>
        /\.(webp|png|jpe?g|avif)$/i.test(String(f?.name || ''))
      );
      if (!files.length) return { ok: false, importedCount: 0 };

      const db = await this.openDb();
      let importedCount = 0;

      for (const file of files) {
        const stemKey = this.normalizeImageStemKey(file.name);
        if (!stemKey) continue;
        const prevUrl = this.keyToUrlMap.get(stemKey);
        if (prevUrl) {
          try {
            URL.revokeObjectURL(prevUrl);
          } catch (_e) {}
        }
        const objUrl = URL.createObjectURL(file);
        this.keyToUrlMap.set(stemKey, objUrl);
        importedCount += 1;

        if (db) {
          try {
            await new Promise((res) => {
              const tx = db.transaction(IDB_STORE, 'readwrite');
              tx.objectStore(IDB_STORE).put({
                key: stemKey,
                fileName: file.name,
                blob: file,
                updatedAt: Date.now(),
              });
              tx.oncomplete = res;
              tx.onerror = res;
            });
          } catch (_err) {}
        }
      }

      return {
        ok: importedCount > 0,
        importedCount,
        totalLoaded: this.keyToUrlMap.size,
      };
    }

    async clearAllImportedImages() {
      for (const url of this.keyToUrlMap.values()) {
        try {
          URL.revokeObjectURL(url);
        } catch (_e) {}
      }
      this.keyToUrlMap.clear();

      const db = await this.openDb();
      if (!db) return true;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).clear();
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_err) {
          resolve(false);
        }
      });
    }

    resolveLoadedImageForVariant(filePrefix, phaseId) {
      const exactKey = `${filePrefix}_${phaseId}`.toLowerCase();
      if (this.keyToUrlMap.has(exactKey)) {
        return {
          mode: 'exact_168',
          key: exactKey,
          url: this.keyToUrlMap.get(exactKey),
          noteVi: `Khớp ảnh chính xác ${exactKey}.webp`,
        };
      }
      const phaseObj = lookupPhaseConfig(phaseId);
      const fallbackSuffix = phaseObj.fallbackDayNight; // 'day' | 'night'
      const fallbackKey = `${filePrefix}_${fallbackSuffix}`.toLowerCase();
      if (this.keyToUrlMap.has(fallbackKey)) {
        return {
          mode: 'fallback_day_night',
          key: fallbackKey,
          url: this.keyToUrlMap.get(fallbackKey),
          noteVi: `Dùng ảnh ${fallbackKey}.webp + Lớp phủ ánh sáng .${phaseObj.lightOverlayClass}`,
        };
      }
      return {
        mode: 'procedural_60fps',
        key: exactKey,
        url: '',
        noteVi: `Bầu trời Procedural 60FPS + .${phaseObj.lightOverlayClass} (chưa nạp ảnh ${exactKey}.webp)`,
      };
    }

    async probeHttpBackgroundOptional(filePrefix, phaseId, allowHttpProbe) {
      if (!allowHttpProbe) return null;
      const proto = String(global.location?.protocol || '');
      if (proto !== 'http:' && proto !== 'https:') return null;

      const exactKey = `${filePrefix}_${phaseId}`.toLowerCase();
      const phaseObj = lookupPhaseConfig(phaseId);
      const fallbackKey = `${filePrefix}_${phaseObj.fallbackDayNight}`.toLowerCase();

      for (const candidateKey of [exactKey, fallbackKey]) {
        const path = `./backgrounds/${candidateKey}.webp`;
        if (this.httpProbeCache.has(path)) {
          const hit = this.httpProbeCache.get(path);
          if (hit) return { mode: candidateKey === exactKey ? 'exact_168' : 'fallback_day_night', url: path, key: candidateKey };
          continue;
        }
        try {
          const res = await fetch(path, { method: 'HEAD' });
          const ok = Boolean(res.ok);
          this.httpProbeCache.set(path, ok);
          if (ok) {
            return {
              mode: candidateKey === exactKey ? 'exact_168' : 'fallback_day_night',
              key: candidateKey,
              url: path,
            };
          }
        } catch (_err) {
          this.httpProbeCache.set(path, false);
        }
      }
      return null;
    }

    getCount() {
      return this.keyToUrlMap.size;
    }
  }

  /**
   * --------------------------------------------------------------------------
   * BỘ VẼ HIỆU ỨNG BẦU TRỜI & THỜI TIẾT 60FPS DÙNG CHUNG (SHARED RENDERER)
   * Dùng chung 1 class duy nhất cho cả:
   *  - Màn hình mô phỏng thu nhỏ bên trong cửa sổ (`#mod43-mini-preview-canvas`)
   *  - Nền toàn website 60FPS (`#mod43-fx-canvas`)
   * Tránh hoàn toàn trùng lặp logic vẽ hạt mưa/tuyết/mây/sét/sương/bầu trời.
   * --------------------------------------------------------------------------
   */
  class Mod43SkyFxRenderer {
    constructor(roleName = 'mini') {
      this.roleName = roleName;
      this.canvas = null;
      this.ctx = null;
      this.animFrameId = null;
      this.running = false;
      this.renderWidth = 640;
      this.renderHeight = 360;
      this.particles = [];
      this.clouds = [];
      this.splashes = [];
      this.hails = [];
      this.stars = [];
      this.lightningBolt = null;
      this.flashAlpha = 0;
      this.nextLightningAtMs = 0;
      this.startEpochMs = performance.now ? performance.now() : Date.now();
      this.frameCounter = 0;
      this.hasCustomArtworkImage = false;
      this.state = {
        wmoCode: 0,
        timePhase: 'noon',
        windSpeedKmh: 10,
        fxIntensityPct: 100,
      };
    }

    attachCanvas(canvasEl) {
      if (this.canvas === canvasEl && canvasEl) {
        this.resizeToContainer();
        return;
      }
      this.canvas = canvasEl || null;
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      if (this.canvas) {
        this.resizeToContainer();
        this.rebuildSceneEntities();
      }
    }

    resizeToContainer() {
      if (!this.canvas) return;
      let targetW = this.roleName === 'fullscreen' ? global.innerWidth || 1280 : 560;
      let targetH = this.roleName === 'fullscreen' ? global.innerHeight || 720 : 210;

      if (this.roleName !== 'fullscreen') {
        const rect = this.canvas.parentElement?.getBoundingClientRect?.();
        if (rect && rect.width > 40 && rect.height > 40) {
          targetW = Math.round(rect.width);
          targetH = Math.round(rect.height);
        }
      }

      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = Math.max(120, targetW);
        this.canvas.height = Math.max(80, targetH);
      }
      this.renderWidth = this.canvas.width;
      this.renderHeight = this.canvas.height;
    }

    updateConfig(nextConfig) {
      const merged = {
        wmoCode: Number(nextConfig?.wmoCode ?? this.state.wmoCode),
        timePhase: nextConfig?.timePhase || this.state.timePhase || 'noon',
        windSpeedKmh: clampNumber(nextConfig?.windSpeedKmh ?? this.state.windSpeedKmh, 0, 120, 10),
        fxIntensityPct: clampNumber(nextConfig?.fxIntensityPct ?? this.state.fxIntensityPct, 15, 160, 100),
      };
      const needRebuild =
        merged.wmoCode !== this.state.wmoCode ||
        merged.timePhase !== this.state.timePhase ||
        merged.fxIntensityPct !== this.state.fxIntensityPct ||
        !this.particles.length;

      this.hasCustomArtworkImage = Boolean(nextConfig?.hasCustomArtworkImage);
      this.state = merged;

      if (needRebuild) {
        this.rebuildSceneEntities();
      }
    }

    rebuildSceneEntities() {
      const w = Math.max(120, this.renderWidth);
      const h = Math.max(80, this.renderHeight);
      const cfg = lookupWmoConfig(this.state.wmoCode);
      const scaleFactor = this.roleName === 'mini' ? 0.55 : 1.0;
      const intensityRatio = (this.state.fxIntensityPct || 100) / 100;

      const baseCount = cfg.fxType === 'celestial' && (this.state.timePhase === 'night' || this.state.timePhase === 'dusk')
        ? Math.max(cfg.count || 80, 90)
        : cfg.count || 60;
      const targetParticles = Math.max(4, Math.round(baseCount * scaleFactor * intensityRatio));

      this.particles = [];
      for (let i = 0; i < targetParticles; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * ((cfg.maxRadius || 3.2) - (cfg.minRadius || 1.2)) + (cfg.minRadius || 1.2),
          alpha: Math.random() * 0.55 + 0.25,
          speedOffset: Math.random() * 2.2,
          twinklePhase: Math.random() * Math.PI * 2,
          isIceCrystal: cfg.iceParticleRatio ? i / targetParticles >= 1 - cfg.iceParticleRatio : false,
        });
      }

      // 90 ngôi sao cho bầu trời đêm quang / ít mây
      this.stars = [];
      if (cfg.code === 0 || cfg.code === 1 || cfg.code === 2) {
        const starTotal = cfg.code === 0 ? 90 : cfg.code === 1 ? 55 : 28;
        for (let i = 0; i < starTotal; i++) {
          this.stars.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.72,
            r: Math.random() * 1.45 + 0.45,
            baseAlpha: Math.random() * 0.65 + 0.22,
            twinkleSpeed: Math.random() * 0.06 + 0.02,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }

      // Mây parallax theo cấu hình cloudDensity
      this.clouds = [];
      const cloudCount = Math.max(0, Number(cfg.cloudDensity) || 0);
      for (let i = 0; i < cloudCount; i++) {
        const puffs = [];
        const puffCount = 3 + (i % 3);
        const baseW = w * (0.22 + (i % 3) * 0.1);
        for (let p = 0; p < puffCount; p++) {
          puffs.push({
            dx: (p - puffCount / 2) * (baseW * 0.28),
            dy: ((p % 2) * 0.14 - 0.06) * baseW * 0.24,
            rx: baseW * (0.24 + (p % 2) * 0.08),
            ry: baseW * (0.11 + (p % 2) * 0.03),
          });
        }
        this.clouds.push({
          x: (i / Math.max(1, cloudCount)) * (w * 1.25) - w * 0.1,
          y: h * (0.1 + (i % 4) * 0.12),
          width: baseW,
          layerDepth: 0.4 + (i % 3) * 0.35,
          puffs,
        });
      }

      // Hạt tinh thể băng cho rime_fog (48)
      if (cfg.iceDustCount) {
        const dustTarget = Math.max(16, Math.round(cfg.iceDustCount * scaleFactor * intensityRatio));
        this.particles = [];
        for (let i = 0; i < dustTarget; i++) {
          this.particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.6 + 0.7,
            alpha: Math.random() * 0.65 + 0.2,
            speedOffset: Math.random() * 0.5,
            twinklePhase: Math.random() * Math.PI * 2,
            isIceCrystal: true,
          });
        }
      }

      // Hạt mưa đá (mã 96 & 99)
      this.hails = [];
      if (cfg.hailCount) {
        const hailTotal = Math.max(10, Math.round(cfg.hailCount * scaleFactor * intensityRatio));
        for (let i = 0; i < hailTotal; i++) {
          this.hails.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: (cfg.hailSize || 3.5) * (this.roleName === 'mini' ? 0.65 : 1) * (0.75 + Math.random() * 0.45),
            vy: (cfg.speed || 16) * (0.65 + Math.random() * 0.35),
            vx: (Math.random() - 0.3) * 2.2,
            bouncing: false,
            bounceVy: 0,
          });
        }
      }

      this.splashes = [];
      this.lightningBolt = null;
      this.flashAlpha = 0;
      const nowMs = Date.now();
      if (cfg.lightningIntervalMs) {
        this.nextLightningAtMs = nowMs + 1400 + Math.random() * 2400;
      } else {
        this.nextLightningAtMs = 0;
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this._lastDrawMs = 0;
      const tick = (nowTs) => {
        if (!this.running) return;
        const overlayCovering = Boolean(
          typeof document !== 'undefined' &&
          this.roleName !== 'mini' &&
          document.querySelector('[role="dialog"]:not(.hidden), #at-shell-root:not(.at-hidden)')
        );
        const canvasHidden = Boolean(
          (typeof document !== 'undefined' && document.hidden) ||
          overlayCovering ||
          !this.canvas ||
          this.canvas.offsetParent === null
        );
        // Khi tab ẩn hoặc khung canvas thời tiết đang bị hộp thoại che -> ngủ đông 850ms để giải phóng 100% GPU/CPU
        if (canvasHidden) {
          this._sleepTimer = setTimeout(() => {
            if (this.running) this.animFrameId = requestAnimationFrame(tick);
          }, 850);
          return;
        }
        const now = typeof nowTs === 'number' ? nowTs : performance.now();
        // Mây trời trôi êm chỉ cần vẽ lại ~20FPS (trừ lúc có tia chớp) để tiết kiệm GPU/Compositor trên mobile & desktop
        const minGap = this.flashAlpha > 0.05 ? 16 : 48;
        if (now - (this._lastDrawMs || 0) >= minGap) {
          this._lastDrawMs = now;
          this.renderFrame();
        }
        this.animFrameId = requestAnimationFrame(tick);
      };
      this.animFrameId = requestAnimationFrame(tick);
    }

    stop() {
      this.running = false;
      if (this._sleepTimer) {
        clearTimeout(this._sleepTimer);
        this._sleepTimer = null;
      }
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    }

    buildSkyStopsForVariant(cfg, phaseObj) {
      const heavyCloudy = cfg.cloudDensity >= 3 || cfg.fogDensity >= 0.4 || cfg.fxType === 'rain' || cfg.fxType === 'thunder' || cfg.fxType === 'snow';
      let base = heavyCloudy ? [...phaseObj.skyStopsCloudy] : [...phaseObj.skyStopsClear];

      if (cfg.stormGreenCast) {
        base = ['#050c0b', '#0d1e1b', '#17302a', '#214037'];
      } else if (cfg.code === 65 || cfg.code === 82 || cfg.code === 95) {
        base =
          this.state.timePhase === 'dusk'
            ? ['#0d0a1c', '#241835', '#42253c', '#733136']
            : ['#0c101b', '#171f2f', '#242f43', '#364359'];
      } else if (cfg.isColdTone && this.state.timePhase !== 'night') {
        base =
          this.state.timePhase === 'dusk'
            ? ['#1b213a', '#353b59', '#595978', '#837d99']
            : ['#4d6075', '#6e8196', '#94a7ba', '#bcccd9'];
      }
      return base;
    }

    renderProceduralBackdropPass(ctx, w, h, cfg, phaseObj, elapsedSec) {
      const stops = this.buildSkyStopsForVariant(cfg, phaseObj);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      stops.forEach((hex, idx) => {
        grad.addColorStop(idx / Math.max(1, stops.length - 1), hex);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Giảm bão hòa nhẹ khi mưa phùn / sương mù
      if (cfg.lightingDarkness > 0) {
        ctx.fillStyle = `rgba(10, 14, 24, ${Math.min(0.55, cfg.lightingDarkness * 0.72)})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Hào quang chân trời
      const glowGrad = ctx.createRadialGradient(
        w * (phaseObj.id === 'afternoon' || phaseObj.id === 'dusk' ? 0.25 : 0.7),
        h * 0.85,
        w * 0.05,
        w * 0.5,
        h * 0.85,
        w * 0.75
      );
      glowGrad.addColorStop(0, phaseObj.horizonGlow);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Dải Ngân Hà (khi đêm quang hoặc ít sao)
      if ((phaseObj.id === 'night' || phaseObj.id === 'dusk') && (cfg.code === 0 || cfg.code === 1)) {
        ctx.save();
        ctx.translate(w * 0.5, h * 0.34);
        ctx.rotate(-0.34);
        const milky = ctx.createLinearGradient(0, -h * 0.22, 0, h * 0.22);
        milky.addColorStop(0, 'rgba(130, 165, 255, 0)');
        milky.addColorStop(0.5, `rgba(148, 178, 255, ${phaseObj.id === 'night' ? 0.14 : 0.06})`);
        milky.addColorStop(1, 'rgba(130, 165, 255, 0)');
        ctx.fillStyle = milky;
        ctx.fillRect(-w, -h * 0.22, w * 2, h * 0.44);
        ctx.restore();
      }

      // Sao nhấp nháy trên bầu trời đêm / hoàng hôn
      if (phaseObj.starAlpha > 0 && this.stars.length) {
        for (const s of this.stars) {
          const tw = 0.65 + 0.35 * Math.sin(elapsedSec * 3.1 + s.phase);
          ctx.fillStyle = `rgba(245, 248, 255, ${(s.baseAlpha * phaseObj.starAlpha * tw).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Mặt trời & vòng hào quang (Lens flare đổi góc theo giờ)
      if (phaseObj.sunPos && cfg.cloudDensity < 6 && cfg.fogDensity < 0.5) {
        const sx = w * phaseObj.sunPos.x;
        const sy = h * phaseObj.sunPos.y;
        const r = phaseObj.sunPos.radius * (this.roleName === 'mini' ? 0.62 : 1.0);
        const sunVisibility = cfg.cloudDensity >= 3 ? 0.45 : 1.0;

        const halo = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 4.5);
        halo.addColorStop(0, phaseObj.sunPos.color);
        halo.addColorStop(0.35, `rgba(255, 230, 175, ${(0.36 * sunVisibility).toFixed(2)})`);
        halo.addColorStop(1, 'rgba(255, 220, 160, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Lens flare nhẹ cho ban ngày trời quang
        if (cfg.code <= 1 && (phaseObj.id === 'morning' || phaseObj.id === 'noon' || phaseObj.id === 'afternoon')) {
          const flareX = w * 0.5 + (w * 0.5 - sx) * 0.45;
          const flareY = h * 0.5 + (h * 0.5 - sy) * 0.45;
          ctx.fillStyle = 'rgba(255, 240, 195, 0.14)';
          ctx.beginPath();
          ctx.arc(flareX, flareY, r * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Mặt trăng bạc ban đêm / chạng vạng
      if (phaseObj.moonAlpha > 0 && cfg.cloudDensity < 7 && cfg.fogDensity < 0.6) {
        const mx = w * 0.78;
        const my = h * 0.22;
        const mr = this.roleName === 'mini' ? 12 : 20;
        const moonHalo = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 3.4);
        moonHalo.addColorStop(0, `rgba(235, 242, 255, ${(0.4 * phaseObj.moonAlpha).toFixed(2)})`);
        moonHalo.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.fillStyle = moonHalo;
        ctx.beginPath();
        ctx.arc(mx, my, mr * 3.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(244, 248, 255, ${(0.9 * phaseObj.moonAlpha).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lớp đồi núi & đường chân trời đô thị có ánh đèn bật khi dusk/night
      this.renderHorizonSilhouette(ctx, w, h, phaseObj);
    }

    renderHorizonSilhouette(ctx, w, h, phaseObj) {
      // Đồi xa
      ctx.fillStyle = phaseObj.hillFarColor;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.78);
      ctx.bezierCurveTo(w * 0.24, h * 0.70, w * 0.48, h * 0.83, w * 0.72, h * 0.74);
      ctx.bezierCurveTo(w * 0.86, h * 0.70, w * 0.95, h * 0.78, w, h * 0.76);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Đồi gần + bóng mái phố
      ctx.fillStyle = phaseObj.hillNearColor;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.86);
      ctx.bezierCurveTo(w * 0.3, h * 0.81, w * 0.62, h * 0.9, w, h * 0.84);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Ánh đèn đô thị nhỏ ấm áp khi chạng vạng & ban đêm
      if (phaseObj.cityLightsAlpha > 0) {
        const cols = 18;
        for (let i = 0; i < cols; i++) {
          const lx = (w / (cols + 1)) * (i + 0.8);
          const ly = h * (0.87 + ((i * 7) % 5) * 0.018);
          const alpha = phaseObj.cityLightsAlpha * (0.45 + 0.35 * ((i * 3) % 2));
          ctx.fillStyle = i % 3 === 0 ? `rgba(147, 197, 253, ${alpha.toFixed(2)})` : `rgba(253, 211, 108, ${alpha.toFixed(2)})`;
          ctx.fillRect(lx, ly, 2.2, 2.2);
        }
      }
    }

    renderCloudsAndRaysPass(ctx, w, h, cfg, phaseObj, windAngle, elapsedSec) {
      // Crepuscular God-Rays (cho mã 80 & 85)
      if (cfg.hasGodRays) {
        ctx.save();
        const rayColor =
          phaseObj.id === 'dusk' || phaseObj.id === 'dawn'
            ? 'rgba(255, 190, 130, 0.14)'
            : phaseObj.id === 'night'
            ? 'rgba(180, 210, 255, 0.10)'
            : 'rgba(255, 248, 215, 0.16)';
        ctx.fillStyle = rayColor;
        for (let r = 0; r < 4; r++) {
          const baseX = w * (0.18 + r * 0.21) + Math.sin(elapsedSec * 0.4 + r) * 14;
          ctx.beginPath();
          ctx.moveTo(baseX, 0);
          ctx.lineTo(baseX + w * 0.07, 0);
          ctx.lineTo(baseX + w * 0.24, h);
          ctx.lineTo(baseX + w * 0.08, h);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Mây ti mỏng (mã 1: opacity 0.25)
      if (cfg.cirrusOpacity) {
        ctx.save();
        ctx.strokeStyle =
          phaseObj.id === 'dawn' || phaseObj.id === 'dusk'
            ? `rgba(255, 198, 175, ${cfg.cirrusOpacity})`
            : phaseObj.id === 'night'
            ? `rgba(195, 212, 240, ${cfg.cirrusOpacity})`
            : `rgba(255, 255, 255, ${cfg.cirrusOpacity})`;
        ctx.lineWidth = this.roleName === 'mini' ? 6 : 12;
        ctx.lineCap = 'round';
        for (let c = 0; c < 3; c++) {
          const shift = ((elapsedSec * 8 * (c + 1) * 0.3) % (w + 180)) - 90;
          ctx.beginPath();
          ctx.moveTo(shift, h * (0.16 + c * 0.11));
          ctx.quadraticCurveTo(shift + w * 0.22, h * (0.12 + c * 0.11), shift + w * 0.44, h * (0.18 + c * 0.11));
          ctx.stroke();
        }
        ctx.restore();
      }

      // Các cụm mây parallax
      if (this.clouds.length) {
        const cloudColor =
          cfg.cloudDensity >= 8
            ? phaseObj.id === 'dusk'
              ? 'rgba(54, 46, 68, 0.76)'
              : 'rgba(66, 76, 94, 0.72)'
            : phaseObj.id === 'dusk' || phaseObj.id === 'dawn'
            ? 'rgba(255, 192, 165, 0.42)'
            : phaseObj.id === 'night'
            ? 'rgba(130, 152, 186, 0.34)'
            : 'rgba(248, 252, 255, 0.56)';

        const driftBase = Math.max(0.18, Math.abs(windAngle) * 0.12 + 0.18);
        for (const cl of this.clouds) {
          cl.x += driftBase * cl.layerDepth;
          if (cl.x - cl.width > w + 40) {
            cl.x = -cl.width - 20;
          }
          ctx.fillStyle = cloudColor;
          for (const puff of cl.puffs) {
            ctx.beginPath();
            ctx.ellipse(cl.x + puff.dx, cl.y + puff.dy, puff.rx, puff.ry, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2 lớp sương gradient trôi ngược chiều (45, 48) hoặc sương nửa dưới (55, 82, 86)
      if (cfg.fxType === 'fog' || cfg.hasBottomMist) {
        const fogShift1 = Math.sin(elapsedSec * 0.45) * w * 0.18;
        const fogShift2 = -Math.sin(elapsedSec * 0.38) * w * 0.18;
        const fogRgbaTop =
          phaseObj.id === 'dusk' || phaseObj.id === 'dawn'
            ? 'rgba(235, 185, 195, 0.36)'
            : phaseObj.id === 'night'
            ? 'rgba(155, 175, 205, 0.28)'
            : 'rgba(235, 242, 250, 0.42)';

        const fogGrad1 = ctx.createLinearGradient(0, cfg.hasBottomMist ? h * 0.48 : h * 0.15, 0, h);
        fogGrad1.addColorStop(0, 'rgba(220, 230, 240, 0)');
        fogGrad1.addColorStop(1, fogRgbaTop);
        ctx.fillStyle = fogGrad1;
        ctx.fillRect(fogShift1 * 0.2 - 30, 0, w + 60, h);

        if (cfg.fxType === 'fog') {
          ctx.fillStyle =
            phaseObj.id === 'night' ? 'rgba(130, 150, 180, 0.24)' : 'rgba(240, 246, 255, 0.28)';
          ctx.beginPath();
          ctx.ellipse(w * 0.5 + fogShift2, h * 0.62, w * 0.55, h * 0.22, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    renderFrame() {
      if (!this.ctx || !this.canvas) return;
      const ctx = this.ctx;
      const w = this.renderWidth;
      const h = this.renderHeight;
      const cfg = lookupWmoConfig(this.state.wmoCode);
      const phaseObj = lookupPhaseConfig(this.state.timePhase);
      const nowEpoch = performance.now ? performance.now() : Date.now();
      const elapsedSec = (nowEpoch - this.startEpochMs) / 1000;
      const speedScale = this.roleName === 'mini' ? 0.68 : 1.0;

      // Chu kỳ gió giật 10 giây cho mã 81 (Rain showers: Moderate)
      const gustFactor = cfg.hasGustCycle
        ? 0.52 + 0.48 * Math.sin((elapsedSec / 10) * Math.PI * 2)
        : 1.0;
      const windAngle = Math.min((this.state.windSpeedKmh || 8) * 0.15, 6) * speedScale * (cfg.hasGustCycle ? gustFactor + 0.35 : 1);

      this.frameCounter += 1;
      ctx.clearRect(0, 0, w, h);

      // Nền procedural khi không dùng ảnh ngoài (hoặc lót phía dưới)
      if (!this.hasCustomArtworkImage) {
        this.renderProceduralBackdropPass(ctx, w, h, cfg, phaseObj, elapsedSec);
      }

      // Mây, tia sáng và lớp sương
      this.renderCloudsAndRaysPass(ctx, w, h, cfg, phaseObj, windAngle, elapsedSec);

      // Sấm chớp & tia sét cho mã 95, 96 (6–12s) và 99 (3–6s)
      if (cfg.fxType === 'thunder' && cfg.lightningIntervalMs) {
        const wallMs = Date.now();
        if (wallMs >= this.nextLightningAtMs) {
          this.flashAlpha = 0.72;
          const [minGap, maxGap] = cfg.lightningIntervalMs;
          this.nextLightningAtMs = wallMs + minGap + Math.random() * (maxGap - minGap);
          // Tạo đường ziczac tia sét
          const bx = w * (0.2 + Math.random() * 0.6);
          const segs = [{ x: bx, y: 0 }];
          let curX = bx;
          let curY = 0;
          while (curY < h * 0.72) {
            curY += h * (0.09 + Math.random() * 0.08);
            curX += (Math.random() - 0.5) * w * 0.08;
            segs.push({ x: curX, y: curY });
          }
          this.lightningBolt = { segs, alpha: 0.95 };
        }

        if (this.flashAlpha > 0) {
          ctx.fillStyle = `rgba(220, 235, 255, ${this.flashAlpha.toFixed(3)})`;
          ctx.fillRect(0, 0, w, h);
          this.flashAlpha = Math.max(0, this.flashAlpha - 0.045);
        }

        if (this.lightningBolt && this.lightningBolt.alpha > 0) {
          ctx.save();
          ctx.strokeStyle = `rgba(235, 245, 255, ${this.lightningBolt.alpha.toFixed(2)})`;
          ctx.lineWidth = this.roleName === 'mini' ? 1.8 : 2.6;
          ctx.beginPath();
          this.lightningBolt.segs.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
          ctx.restore();
          this.lightningBolt.alpha -= 0.065;
        }
      }

      // Viền đóng băng nhẹ 4 góc cho mã 57 & 67
      if (cfg.hasFrostCorners) {
        const edgeR = Math.min(w, h) * 0.55;
        for (const [cx, cy] of [
          [0, 0],
          [w, 0],
          [0, h],
          [w, h],
        ]) {
          const frost = ctx.createRadialGradient(cx, cy, edgeR * 0.05, cx, cy, edgeR * 0.75);
          frost.addColorStop(0, 'rgba(215, 240, 255, 0.34)');
          frost.addColorStop(1, 'rgba(215, 240, 255, 0)');
          ctx.fillStyle = frost;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Vòng lặp hạt (mưa, tuyết, bụi nắng, tinh thể băng)
      const isWarmLightPhase = phaseObj.id === 'dusk' || phaseObj.id === 'dawn';
      const rainLen = (cfg.len || 12) * speedScale;
      const rainSpeed = (cfg.speed || 8) * speedScale;
      const limitCount = cfg.hasGustCycle
        ? Math.max(12, Math.floor(this.particles.length * gustFactor))
        : this.particles.length;

      for (let idx = 0; idx < limitCount; idx++) {
        const p = this.particles[idx];
        if (cfg.fxType === 'rain' || cfg.fxType === 'thunder') {
          const dropAlpha = p.alpha * (cfg.opacity || 0.65);
          if (p.isIceCrystal) {
            ctx.fillStyle = `rgba(230, 246, 255, ${Math.min(0.9, dropAlpha + 0.18).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
            p.x += windAngle * 0.85;
            p.y += rainSpeed * 1.15 + p.speedOffset;
          } else {
            ctx.strokeStyle = cfg.silverIceTint
              ? `rgba(232, 242, 255, ${Math.min(0.92, dropAlpha + 0.14).toFixed(2)})`
              : isWarmLightPhase
              ? `rgba(255, 215, 200, ${dropAlpha.toFixed(2)})`
              : `rgba(200, 220, 255, ${dropAlpha.toFixed(2)})`;
            ctx.lineWidth = cfg.lineWidth || 1.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + windAngle, p.y + rainLen);
            ctx.stroke();
            p.x += windAngle;
            p.y += rainSpeed + p.speedOffset;
          }

          if (p.y > h) {
            if (cfg.hasBottomSplash && this.splashes.length < 48 && Math.random() < 0.25) {
              this.splashes.push({
                x: p.x,
                y: h - 3 - Math.random() * 6,
                rx: 2,
                alpha: 0.65,
              });
            }
            p.y = -20;
            p.x = Math.random() * w;
          }
        } else if (cfg.fxType === 'snow') {
          ctx.fillStyle =
            isWarmLightPhase && cfg.code === 71
              ? `rgba(255, 232, 240, ${p.alpha.toFixed(2)})`
              : `rgba(255, 255, 255, ${p.alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (this.roleName === 'mini' ? 0.72 : 1), 0, Math.PI * 2);
          ctx.fill();

          const sway = cfg.straightFall
            ? windAngle * 0.18
            : Math.sin(p.y * 0.025 + p.twinklePhase) + windAngle * 0.35 * (cfg.windShearFactor || 1);
          p.x += sway;
          p.y += (cfg.speed || 2.5) * speedScale + p.speedOffset * 0.32;
          if (p.y > h + 8) {
            p.y = -12;
            p.x = Math.random() * w;
          }
        } else if (cfg.fxType === 'fog' && p.isIceCrystal) {
          const glint = 0.45 + 0.55 * Math.abs(Math.sin(elapsedSec * 2.5 + p.twinklePhase));
          ctx.fillStyle = `rgba(225, 245, 255, ${(p.alpha * glint).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          p.x += Math.sin(elapsedSec + p.twinklePhase) * 0.25 + windAngle * 0.08;
          p.y -= 0.14;
        } else if (cfg.fxType === 'celestial') {
          if (phaseObj.id === 'night' || phaseObj.id === 'dusk') {
            p.alpha += (Math.random() - 0.5) * 0.03;
            p.alpha = clampNumber(p.alpha, 0.12, 0.85, 0.5);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 0.55, 0, Math.PI * 2);
            ctx.fill();
          } else if (phaseObj.id === 'dawn' || phaseObj.id === 'afternoon') {
            ctx.fillStyle = `rgba(255, 232, 155, ${(p.alpha * 0.45).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 0.72, 0, Math.PI * 2);
            ctx.fill();
            p.y -= 0.22;
            p.x += Math.sin(p.y * 0.015 + p.twinklePhase) * 0.32;
          }
        }

        if (p.y < -25) p.y = h + 5;
        if (p.x > w + 12) p.x = -8;
        if (p.x < -12) p.x = w + 8;
      }

      // Bọt nước bắn nhẹ ở đáy (63, 65, 81, 82, 95, 96, 99)
      if (this.splashes.length) {
        const nextSplashes = [];
        for (const sp of this.splashes) {
          ctx.strokeStyle = `rgba(215, 232, 255, ${sp.alpha.toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.rx, sp.rx * 0.36, 0, 0, Math.PI * 2);
          ctx.stroke();
          sp.rx += 0.9;
          sp.alpha -= 0.07;
          if (sp.alpha > 0.05) nextSplashes.push(sp);
        }
        this.splashes = nextSplashes;
      }

      // Mưa đá nảy ở đáy (mã 96 & 99)
      if (this.hails.length) {
        for (const hl of this.hails) {
          ctx.fillStyle = 'rgba(240, 248, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(hl.x, hl.y, hl.r, 0, Math.PI * 2);
          ctx.fill();

          if (!hl.bouncing) {
            hl.x += hl.vx + windAngle * 0.65;
            hl.y += hl.vy * speedScale;
            if (hl.y >= h - hl.r - 2) {
              hl.bouncing = true;
              hl.bounceVy = -(2.5 + Math.random() * 2.8);
            }
          } else {
            hl.x += (Math.random() - 0.5) * 2.6;
            hl.y += hl.bounceVy;
            hl.bounceVy += 0.35;
            if (hl.y >= h + hl.r + 4) {
              hl.bouncing = false;
              hl.y = -15;
              hl.x = Math.random() * w;
            }
          }
        }
      }
    }
  }

  /**
   * --------------------------------------------------------------------------
   * BỘ XÂY DỰNG HTML GIAO DIỆN GẮN TRONG CỬA SỔ MÚI GIỜ / BÁO THỨC (MOD 42)
   * --------------------------------------------------------------------------
   */
  function buildTuningSliderRowHtml(key, label, value, min, max, unit) {
    return `
      <div class="p-2 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/65 flex flex-col gap-1">
        <div class="flex items-center justify-between text-[10.5px]">
          <span class="font-bold text-zinc-700 dark:text-zinc-200">${escapeHtml(label)}</span>
          <span id="mod43-val-${escapeHtml(key)}" class="font-monoCode font-extrabold text-sky-700 dark:text-sky-300">${Math.round(value)}${escapeHtml(unit)}</span>
        </div>
        <input type="range" data-mod43-slider="${escapeHtml(key)}" min="${min}" max="${max}" value="${Math.round(value)}" class="w-full h-1.5 accent-sky-500 cursor-pointer" />
      </div>
    `;
  }

  function buildMod43InlineDockHtml(ctrl) {
    const trText = (s) =>
      NS.i18n?.translateText ? NS.i18n.translateText(String(s || '')) : String(s || '');
    const st = ctrl.state;
    const rt = ctrl.getActiveRealtimeSnapshot();
    const previewSpec = ctrl.getPreviewSpec();
    const phaseObj = lookupPhaseConfig(previewSpec.phaseId);
    const wmoCfg = lookupWmoConfig(previewSpec.wmoCode);
    const isRealtimeBgActive = st.bgMode === 'realtime';
    const isCustomBgActive = st.bgMode === 'custom';
    const isGpsPinned = Boolean(
      st.gpsCoords && Number.isFinite(Number(st.gpsCoords.lat)) && Number.isFinite(Number(st.gpsCoords.lon))
    );
    const isAnyBgActive = isRealtimeBgActive || isCustomBgActive;
    const isPeekMode = Boolean(document.body?.classList?.contains('noir-ambient-peek-mode'));
    const loadedImgCount = ctrl.folderVault.getCount();
    const resolvedArt = ctrl.folderVault.resolveLoadedImageForVariant(wmoCfg.file, phaseObj.id);

    const scheduleRows = Mod43PhaseCalculator.buildPhaseScheduleTable(
      rt.sunriseMins,
      rt.sunsetMins
    );
    const rtPhaseObj = lookupPhaseConfig(rt.timePhase);
    const rtWmoCfg = lookupWmoConfig(rt.wmoCode);

    const phaseButtonsHtml = MOD43_TIME_PHASES.map((ph) => {
      const selected = previewSpec.phaseId === ph.id;
      const sched = scheduleRows.find((r) => r.phaseId === ph.id);
      return `
        <button type="button" data-mod43-pick-phase="${escapeHtml(ph.id)}" class="text-left p-2 rounded-xl border transition ${
          selected
            ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-400/50'
            : 'border-zinc-300/80 dark:border-zinc-800 bg-white/65 dark:bg-zinc-900/60 hover:border-amber-500/50'
        }">
          <div class="flex items-center justify-between gap-1">
            <span class="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">${ph.icon} ${escapeHtml(ph.labelVi)}</span>
            <span class="text-[9.5px] font-monoCode text-zinc-500 dark:text-zinc-400">${escapeHtml(ph.id)}</span>
          </div>
          <div class="text-[10px] font-monoCode text-amber-700 dark:text-amber-300 mt-0.5">${escapeHtml(sched ? sched.label : ph.sampleClockText)}</div>
        </button>
      `;
    }).join('');

    const categoryTabsHtml = MOD43_WEATHER_CATEGORIES.map((cat) => {
      const active = st.selectedCategory === cat.key;
      return `
        <button type="button" data-mod43-category="${escapeHtml(cat.key)}" class="px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition ${
          active
            ? 'border-sky-500 bg-sky-600 text-white'
            : 'border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-sky-500/50'
        }">${escapeHtml(cat.label)}</button>
      `;
    }).join('');

    const filteredWeatherList = MOD43_WMO_CODES_LIST.filter(
      (item) => st.selectedCategory === 'ALL' || item.category === st.selectedCategory
    );

    const weatherGridHtml = filteredWeatherList
      .map((item) => {
        const selected = Number(previewSpec.wmoCode) === Number(item.code);
        return `
          <button type="button" data-mod43-pick-wmo="${item.code}" class="text-left p-2 rounded-xl border transition flex items-start gap-2 ${
            selected
              ? 'border-sky-500 bg-sky-500/15 ring-1 ring-sky-400/50'
              : 'border-zinc-300/80 dark:border-zinc-800 bg-white/65 dark:bg-zinc-900/65 hover:border-sky-500/50'
          }">
            <span class="text-lg shrink-0 leading-none mt-0.5">${item.icon}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1">
                <span class="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100 truncate">${item.code} – ${escapeHtml(item.enName)}</span>
              </div>
              <div class="text-[10px] font-semibold text-sky-700 dark:text-sky-300 truncate">${escapeHtml(item.viName)}</div>
              <div class="text-[9.5px] text-zinc-600 dark:text-zinc-400 line-clamp-1">${escapeHtml(item.viDetail)}</div>
            </div>
          </button>
        `;
      })
      .join('');

    const quickPresetButtons = MOD43_QUICK_SCENARIO_PRESETS.map((p) => {
      return `
        <button type="button" data-mod43-quick-preset="${escapeHtml(p.id)}" class="px-2.5 py-1 rounded-lg border border-indigo-500/35 bg-indigo-500/10 hover:bg-indigo-500/20 text-[10.5px] font-bold text-indigo-700 dark:text-indigo-200 transition">${escapeHtml(p.label)}</button>
      `;
    }).join('');

    return `
      <section id="mod43-sim-stage-card" class="mt-4 pt-4 border-t-2 border-dashed border-sky-500/35 space-y-3">
        <!-- Đầu mục Thời tiết Real-Time & Mô phỏng ngay trong cửa sổ -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/35">🌦️ MODULE 43 · 168 BIẾN THỂ 60FPS</span>
              <span id="mod43-bg-active-pill" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isRealtimeBgActive
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                  : isCustomBgActive
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-400/30'
              }">
                ${escapeHtml(
                  trText(
                    isRealtimeBgActive
                      ? '● Nền Web: ĐANG CHẠY THỜI GIAN THỰC'
                      : isCustomBgActive
                      ? '● Nền Web: ĐANG CHẠY TÙY CHỈNH'
                      : '○ Nền Web: Chưa kích hoạt'
                  )
                )}
              </span>
            </div>
            <h3 class="text-sm font-extrabold text-zinc-900 dark:text-white mt-1">Xem Thời Tiết Real-Time Tại Vị Trí &amp; Màn Hình Mô Phỏng Bầu Trời</h3>
            <p class="text-[11px] text-zinc-600 dark:text-zinc-400">Tự động nhận diện vị trí + 6 khung giờ ánh sáng mặt trời mọc/lặn + 28 trạng thái thời tiết WMO (60FPS).</p>
          </div>
          <div class="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0 max-w-full">
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" id="mod43-btn-sync-gps" class="px-2.5 py-1.5 rounded-xl border border-emerald-500/45 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold transition cursor-pointer">📍 Vị Trí Thực (GPS)</button>
              <button type="button" id="mod43-btn-sync-zone" class="px-2.5 py-1.5 rounded-xl border border-sky-500/45 bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 text-[11px] font-bold transition cursor-pointer">🔄 Đồng Bộ Ngay</button>
            </div>
            <div id="mod43-gps-hint-box" class="px-2.5 py-1 rounded-xl border ${
              isGpsPinned
                ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                : 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200'
            } text-[10.5px] font-semibold leading-snug break-words" data-i18n-ignore="true">
              ${
                isGpsPinned
                  ? `✅ ${escapeHtml(trText('Bạn đang ở:'))} <strong>${escapeHtml(String(st.gpsCoords?.label || rt.locationName || '').replace(/^📍\s*/, ''))}</strong>`
                  : escapeHtml(trText('📱 Bạn bật tính năng Vị trí và bấm vào nút "Vị trí thực (GPS)" trên điện thoại để xem nhé'))
              }
            </div>
          </div>
        </div>

        <!-- Thông số thời tiết thực tế tại khu vực người dùng -->
        <div id="mod43-realtime-telemetry-bar" class="p-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          <div class="md:col-span-7 space-y-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-base">${rtWmoCfg.icon}</span>
              <span class="text-xs font-extrabold text-zinc-900 dark:text-white">${escapeHtml(trText(rt.locationName))}</span>
              <span id="mod43-gps-resolved-where" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isGpsPinned
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                  : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
              }" data-i18n-ignore="true">${escapeHtml(trText(isGpsPinned ? '🧭 Vị trí thực của bạn đang ở:' : '🧭 Khu vực đang xem:'))} ${escapeHtml(String(rt.locationName || '').replace(/^[^\p{L}\p{N}]+/u, ''))}</span>
              <span class="px-1.5 py-0.5 rounded-md text-[9.5px] font-monoCode bg-black/10 dark:bg-black/35 text-zinc-700 dark:text-zinc-300">${escapeHtml(rt.sourceMode === 'open_meteo_live' ? 'Open-Meteo Live' : 'Offline Sync')}</span>
            </div>
            <div id="mod43-realtime-wmo-summary" data-i18n-ignore="true" class="text-xs font-bold text-sky-700 dark:text-sky-300">
              ${rtWmoCfg.code} – ${escapeHtml(trText(rtWmoCfg.enName))}: ${escapeHtml(trText(rtWmoCfg.viDetail))}
            </div>
            <div class="text-[10.5px] text-zinc-600 dark:text-zinc-300 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span>${rtPhaseObj.icon} ${escapeHtml(trText('Khung giờ thực:'))} <strong>${escapeHtml(trText(rtPhaseObj.labelVi))} (${escapeHtml(rtPhaseObj.id)})</strong></span>
              <span>🌅 ${escapeHtml(trText('Mọc:'))} <strong class="font-monoCode">${formatMinutesAsClock(rt.sunriseMins)}</strong></span>
              <span>🌇 ${escapeHtml(trText('Lặn:'))} <strong class="font-monoCode">${formatMinutesAsClock(rt.sunsetMins)}</strong></span>
            </div>
          </div>
          <div class="md:col-span-5 grid grid-cols-3 gap-1.5 text-center">
            <div class="p-1.5 rounded-xl bg-white/65 dark:bg-zinc-900/70 border border-zinc-300/60 dark:border-zinc-800">
              <div class="text-[9.5px] text-zinc-500 dark:text-zinc-400">Nhiệt độ</div>
              <div class="text-sm font-black font-monoCode text-zinc-900 dark:text-white">${Math.round(rt.tempC)}°C</div>
            </div>
            <div class="p-1.5 rounded-xl bg-white/65 dark:bg-zinc-900/70 border border-zinc-300/60 dark:border-zinc-800">
              <div class="text-[9.5px] text-zinc-500 dark:text-zinc-400">Gió 10m</div>
              <div class="text-sm font-black font-monoCode text-zinc-900 dark:text-white">${Number(rt.windSpeedKmh).toFixed(0)} km/h</div>
            </div>
            <div class="p-1.5 rounded-xl bg-white/65 dark:bg-zinc-900/70 border border-zinc-300/60 dark:border-zinc-800">
              <div class="text-[9.5px] text-zinc-500 dark:text-zinc-400">Độ ẩm</div>
              <div class="text-sm font-black font-monoCode text-zinc-900 dark:text-white">${Math.round(rt.humidityPct)}%</div>
            </div>
          </div>
        </div>

        <!-- MÀN HÌNH NHỎ MÔ PHỎNG TRẠNG THÁI THỜI TIẾT & BẦU TRỜI 60FPS -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          <div class="lg:col-span-7 flex flex-col gap-2">
            <div id="mod43-mini-viewport" class="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden border border-sky-500/40 bg-zinc-950 shadow-inner">
              <div id="${MOD43_CONSTANTS.MINI_IMAGE_ID}" class="mod43-bg-layer" style="${
                resolvedArt.url ? `background-image:url('${escapeHtml(resolvedArt.url)}');background-size:cover;background-position:center;` : ''
              }"></div>
              <div id="${MOD43_CONSTANTS.MINI_LIGHT_ID}" class="mod43-bg-layer ${escapeHtml(phaseObj.lightOverlayClass)}"></div>
              <canvas id="${MOD43_CONSTANTS.MINI_CANVAS_ID}" class="mod43-bg-layer block w-full h-full"></canvas>

              <!-- HUD Overlay bên trong màn hình mô phỏng -->
              <div class="absolute inset-x-0 top-0 p-2.5 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
                <span data-i18n-ignore="true" class="px-2 py-0.5 rounded-full bg-black/55 border border-white/15 text-[10px] font-extrabold text-white backdrop-blur-sm">
                  🖥️ ${escapeHtml(trText(previewSpec.sourceTag === 'realtime' ? 'MÔ PHỎNG 60FPS · THỜI GIAN THỰC' : 'MÔ PHỎNG 60FPS · TÙY CHỈNH'))}
                </span>
                <span id="mod43-mini-clock-chip" data-i18n-ignore="true" class="px-2 py-0.5 rounded-full bg-black/55 border border-white/15 text-[10px] font-monoCode font-bold text-amber-200">
                  ${phaseObj.icon} ${escapeHtml(trText(phaseObj.labelVi))} · ${escapeHtml(previewSpec.clockLabel)}
                </span>
              </div>
              <div class="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none">
                <div id="mod43-mini-wmo-title" data-i18n-ignore="true" class="text-xs sm:text-sm font-extrabold text-white drop-shadow">
                  ${wmoCfg.icon} ${wmoCfg.code} – ${escapeHtml(trText(wmoCfg.enName))}: ${escapeHtml(trText(wmoCfg.viDetail))}
                </div>
              </div>
            </div>
          </div>

          <!-- BẢNG NÚT CHỌN BACKGROUND WEBSITE (THỜI GIAN THỰC & TÙY CHỈNH) -->
          <div class="lg:col-span-5 p-3 rounded-2xl border border-zinc-300/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/75 flex flex-col justify-between gap-2.5">
            <div class="space-y-2">
              <div class="text-[11px] font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">🎨 Áp Dụng Nền Website Toàn Trang (Kèm Khung Giờ &amp; 60FPS)</div>

              <button type="button" id="mod43-btn-apply-realtime-bg" data-gps-pinned="${isGpsPinned ? 'true' : 'false'}" class="w-full text-left p-2.5 rounded-xl border transition ${
                isRealtimeBgActive
                  ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-900/25'
                  : 'border-emerald-500/45 bg-emerald-500/12 hover:bg-emerald-500/22 text-emerald-800 dark:text-emerald-200'
              }${isGpsPinned ? ` noir-gps-realtime-blink${isRealtimeBgActive ? ' is-active' : ''}` : ''}">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-extrabold">🌦️ Background Thời Tiết Hiện Tại (Real-Time)</span>
                  <span class="flex items-center gap-1.5 shrink-0">
                    ${
                      isGpsPinned
                        ? `<span class="px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold ${
                            isRealtimeBgActive
                              ? 'bg-white/20 text-white border border-white/40'
                              : 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-400/60'
                          }">${escapeHtml(trText('📍 Đã ghim GPS'))}</span>`
                        : ''
                    }
                    <span class="text-[10px] font-monoCode font-bold">${escapeHtml(trText(isRealtimeBgActive ? 'ĐANG BẬT ✓' : 'Bật ngay'))}</span>
                  </span>
                </div>
                <div class="text-[10px] opacity-90 mt-0.5">${escapeHtml(trText('Tự động cập nhật thời tiết khu vực & chuyển màu theo 6 khung giờ thực tế.'))}</div>
              </button>

              <button type="button" id="mod43-btn-apply-custom-bg" class="w-full text-left p-2.5 rounded-xl border transition ${
                isCustomBgActive
                  ? 'border-amber-500 bg-amber-600 text-white shadow-lg shadow-amber-900/25'
                  : 'border-amber-500/45 bg-amber-500/12 hover:bg-amber-500/22 text-amber-800 dark:text-amber-200'
              }">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-extrabold">${escapeHtml(trText(`🎭 Background Thời Tiết Tùy Chỉnh (${wmoCfg.code} · ${phaseObj.labelVi})`))}</span>
                  <span class="text-[10px] font-monoCode font-bold">${escapeHtml(trText(isCustomBgActive ? 'ĐANG BẬT ✓' : 'Áp dụng'))}</span>
                </div>
                <div class="text-[10px] opacity-90 mt-0.5">${escapeHtml(trText('Cố định khung giờ & thời tiết đang chọn ở mô phỏng bên dưới.'))}</div>
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-300/60 dark:border-zinc-800">
              <button type="button" id="mod43-btn-toggle-peek" class="flex-1 px-2.5 py-1.5 rounded-xl border ${
                isPeekMode
                  ? 'border-sky-500 bg-sky-600 text-white'
                  : 'border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
              } text-[11px] font-bold transition">${escapeHtml(trText(isPeekMode ? '👁️ Tắt Soi Nền' : '👁️ Soi Nền 100%'))}</button>

              <button type="button" id="mod43-btn-disable-bg" ${isAnyBgActive ? '' : 'disabled'} class="px-2.5 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-45 text-rose-700 dark:text-rose-300 text-[11px] font-bold transition">${escapeHtml(trText('⏹️ Tắt Nền'))}</button>

              <button type="button" id="mod43-btn-toggle-tuning" class="px-2.5 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 text-[11px] font-bold transition">${escapeHtml(trText(st.showTuningPanel ? '🔽 Ẩn Chỉnh Nền' : '🎛️ Độ Mờ / Rõ Nền'))}</button>
            </div>
          </div>
        </div>

        <!-- THANH TÙY CHỈNH NỀN GIỐNG TAB 5 (ĐỘ RÕ, ĐỘ MỜ, ĐỘ SÁNG, XUYÊN THẤU, GIÓ, HẠT) -->
        ${
          st.showTuningPanel
            ? `
          <div id="mod43-bg-tuning-card" class="p-3 rounded-2xl border border-indigo-500/35 bg-indigo-500/5 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">🎛️ Tùy Chỉnh Giao Diện &amp; Nền Thời Tiết (Đồng Bộ Phong Cách Tab 5)</span>
              <button type="button" id="mod43-btn-reset-tuning" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-[10.5px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800">↺ Mặc định</button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              ${buildTuningSliderRowHtml('opacityPct', 'Độ rõ nền', st.tuning.opacityPct, 15, 100, '%')}
              ${buildTuningSliderRowHtml('blurPx', 'Độ mờ (Blur)', st.tuning.blurPx, 0, 24, 'px')}
              ${buildTuningSliderRowHtml('brightnessPct', 'Độ sáng', st.tuning.brightnessPct, 45, 175, '%')}
              ${buildTuningSliderRowHtml('darknessPct', 'Lớp phủ tối', st.tuning.darknessPct, 0, 85, '%')}
              ${buildTuningSliderRowHtml('contrastPct', 'Tương phản', st.tuning.contrastPct, 80, 145, '%')}
              ${buildTuningSliderRowHtml('uiGlassPct', 'Xuyên thấu khung viết', st.tuning.uiGlassPct, 15, 95, '%')}
              ${buildTuningSliderRowHtml('fxIntensityPct', 'Mật độ hạt 60FPS', st.tuning.fxIntensityPct, 20, 150, '%')}
              ${buildTuningSliderRowHtml('customWindKmh', 'Tốc độ gió (nghiêng)', st.customWindKmh, 0, 80, 'km/h')}
            </div>

            <!-- Nạp thư mục backgrounds/*.webp (168 biến thể) -->
            <div class="p-2.5 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 flex flex-wrap items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="text-[11px] font-bold text-zinc-800 dark:text-zinc-100">🖼️ Nạp thư mục ảnh nền AI <code class="font-monoCode text-amber-600 dark:text-amber-300">backgrounds/{file}_{phase}.webp</code> (${loadedImgCount} ảnh đã nạp)</div>
                <div class="text-[10px] text-zinc-500 dark:text-zinc-400">Hỗ trợ cơ chế tự fallback sang <code class="font-monoCode">_day</code> / <code class="font-monoCode">_night</code> + Lớp phủ ánh sáng chuẩn 6 khung giờ.</div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <input type="file" id="mod43-bg-folder-input" webkitdirectory multiple accept="image/*" class="hidden" />
                <button type="button" id="mod43-btn-import-bg-folder" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold">📁 Chọn thư mục backgrounds/</button>
                ${
                  loadedImgCount > 0
                    ? '<button type="button" id="mod43-btn-clear-bg-folder" class="px-2 py-1 rounded-lg border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[10.5px] font-bold">Xóa ảnh</button>'
                    : ''
                }
              </div>
            </div>
          </div>
        `
            : ''
        }

        <!-- BẢNG CHỌN NHANH 6 KHUNG GIỜ × 28 LOẠI THỜI TIẾT WMO = 168 BIẾN THỂ (MẶC ĐỊNH THU GỌN) -->
        <div id="mod43-custom-matrix-card" class="p-3 rounded-2xl border border-zinc-300/80 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-950/60 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 class="text-xs font-extrabold text-zinc-900 dark:text-white">🧭 Bộ Giả Lập &amp; Chọn Tùy Chỉnh 168 Biến Thể (6 Khung Giờ × 28 Thời Tiết WMO)</h4>
              <div class="text-[10.5px] text-zinc-600 dark:text-zinc-400">Bấm thử ngay khoảnh khắc 17:30 chạng vạng, bình minh mưa phùn hay đêm bão giông mà không cần chờ đúng giờ.</div>
            </div>
            <button type="button" id="mod43-btn-toggle-matrix" class="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-[10.5px] font-bold text-zinc-700 dark:text-zinc-200">${st.showCustomMatrix ? '▲ Thu gọn bảng chọn' : '▼ Mở bảng 6×28'}</button>
          </div>

          <div id="mod43-custom-matrix-body" class="${st.showCustomMatrix ? '' : 'hidden '}space-y-2.5">
            <!-- Thử nhanh khoảnh khắc -->
            <div class="flex flex-wrap items-center gap-1.5">
              ${quickPresetButtons}
            </div>

            <div>
              <div class="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1.5">1. Chọn 1 Trong 6 Khung Giờ Ánh Sáng (Theo Sunrise/Sunset)</div>
              <div id="mod43-phase-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                ${phaseButtonsHtml}
              </div>
            </div>

            <div>
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div class="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300">2. Chọn 1 Trong 28 Trạng Thái Thời Tiết WMO</div>
                <div class="flex flex-wrap gap-1">${categoryTabsHtml}</div>
              </div>
              <div id="mod43-wmo-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
                ${weatherGridHtml}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * --------------------------------------------------------------------------
   * BỘ ĐIỀU KHIỂN TRUNG TÂM MODULE 43
   * --------------------------------------------------------------------------
   */
  class Mod43WeatherSkyController {
    constructor() {
      this.initialized = false;
      this.state = cloneDefaultState();
      this.apiClient = new Mod43WeatherApiClient();
      this.folderVault = new Mod43BackgroundFolderVault();
      this.miniRenderer = new Mod43SkyFxRenderer('mini');
      this.webBgRenderer = new Mod43SkyFxRenderer('fullscreen');
      this.realtimeWeatherTimerId = null;
      this.realtimePhaseTimerId = null;
      this.modalStatusTimerId = null;
      this.activeContainer = null;
    }

    loadStateFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;
        this.state = {
          ...cloneDefaultState(),
          ...parsed,
          previewFollowsRealtime:
            typeof parsed.previewFollowsRealtime === 'boolean'
              ? parsed.previewFollowsRealtime
              : parsed.bgMode !== 'custom',
          tuning: {
            ...DEFAULT_STATE.tuning,
            ...(parsed.tuning || {}),
          },
        };
      } catch (_err) {
        this.state = cloneDefaultState();
      }
    }

    saveStateToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (_err) {}
    }

    getActiveRealtimeSnapshot() {
      const targetLoc = this.apiClient.resolveTargetLocation(this.state);
      if (this.state.lastRealtimeSnapshot && this.state.lastRealtimeSnapshot.locationName) {
        const snap = this.state.lastRealtimeSnapshot;
        const coordChanged =
          Math.abs(Number(snap.lat) - Number(targetLoc.lat)) > 0.05 ||
          Math.abs(Number(snap.lon) - Number(targetLoc.lon)) > 0.05;
        if (!coordChanged || this.state.gpsCoords) {
          const clock = Mod43PhaseCalculator.getZonedWallClockInfo(snap.iana || targetLoc.iana, new Date());
          return {
            ...snap,
            timePhase: Mod43PhaseCalculator.getTimePhaseFromMinutes(
              clock.currentMins,
              snap.sunriseMins ?? 350,
              snap.sunsetMins ?? 1045
            ),
          };
        }
      }
      const fb = this.apiClient.buildDeterministicFallbackSnapshot(targetLoc);
      this.state.lastRealtimeSnapshot = fb;
      return fb;
    }

    getPreviewSpec() {
      if (this.state.bgMode === 'realtime' || this.state.previewFollowsRealtime === true) {
        const rt = this.getActiveRealtimeSnapshot();
        const clock = Mod43PhaseCalculator.getZonedWallClockInfo(rt.iana, new Date());
        return {
          sourceTag: 'realtime',
          wmoCode: rt.wmoCode,
          phaseId: rt.timePhase,
          windSpeedKmh: rt.windSpeedKmh,
          clockLabel: clock.clockText,
        };
      }
      const ph = lookupPhaseConfig(this.state.customPhaseId);
      return {
        sourceTag: this.state.bgMode === 'custom' ? 'custom' : 'preview',
        wmoCode: lookupWmoConfig(this.state.customWmoCode).code,
        phaseId: ph.id,
        windSpeedKmh: this.state.customWindKmh,
        clockLabel: ph.sampleClockText,
      };
    }

    async init() {
      this.loadStateFromStorage();
      await this.folderVault.loadFromIndexedDb();

      const loc = this.apiClient.resolveTargetLocation(this.state);
      if (!this.state.lastRealtimeSnapshot) {
        this.state.lastRealtimeSnapshot = this.apiClient.buildDeterministicFallbackSnapshot(loc);
        // Khởi tạo mô phỏng ban đầu đồng bộ trạng thái thời tiết ước lượng địa phương
        this.state.customWmoCode = this.state.lastRealtimeSnapshot.wmoCode;
        this.state.customPhaseId = this.state.lastRealtimeSnapshot.timePhase;
        this.state.customWindKmh = this.state.lastRealtimeSnapshot.windSpeedKmh;
      }

      if (!global.__mod43ResizeBound) {
        global.__mod43ResizeBound = true;
        global.addEventListener('resize', () => {
          this.webBgRenderer.resizeToContainer();
          this.miniRenderer.resizeToContainer();
        });
      }

      // Nếu người dùng đã bật nền thời tiết trước đó, khôi phục ngay lập tức
      if (this.state.bgMode === 'realtime' || this.state.bgMode === 'custom') {
        this.applyWebBackgroundNow();
      }

      this.startRealtimeSchedulers();
      if (!global.__mod43I18nBound) {
        global.__mod43I18nBound = true;
        const syncLang = () => {
          try {
            if (this.activeContainer) this.refreshMountedPanel();
          } catch {}
        };
        NS.bus?.on?.('i18n:changed', syncLang);
        global.addEventListener?.('noir:i18n:changed', syncLang);
      }
      this.initialized = true;
      return { ok: true, mode: this.state.bgMode };
    }

    startRealtimeSchedulers() {
      if (this.realtimeWeatherTimerId) clearInterval(this.realtimeWeatherTimerId);
      if (this.realtimePhaseTimerId) clearInterval(this.realtimePhaseTimerId);

      // Cập nhật API mỗi 15 phút (khi đang dùng nền thời gian thực hoặc đang mở modal)
      this.realtimeWeatherTimerId = setInterval(() => {
        if (this.state.bgMode === 'realtime' || NS.worldClockStudio?.controller?.modalOpen) {
          this.syncRealtimeWeather(false, false);
        }
      }, MOD43_CONSTANTS.REALTIME_WEATHER_SYNC_MS);

      // Kiểm tra chuyển pha ánh sáng mỗi 30 giây để bắt khoảnh khắc bình minh/hoàng hôn ngay lập tức
      this.realtimePhaseTimerId = setInterval(() => {
        const snap = this.getActiveRealtimeSnapshot();
        if (this.state.bgMode === 'realtime') {
          this.applyWebBackgroundNow();
        }
        if (this.activeContainer && NS.worldClockStudio?.controller?.modalOpen) {
          const clock = Mod43PhaseCalculator.getZonedWallClockInfo(snap.iana, new Date());
          const chip = document.getElementById('mod43-mini-clock-chip');
          if (chip && (this.state.bgMode === 'realtime' || this.state.previewFollowsRealtime === true)) {
            const ph = lookupPhaseConfig(snap.timePhase);
            const phLabel = NS.i18n?.translateText?.(ph.labelVi) || ph.labelVi;
            chip.textContent = `${ph.icon} ${phLabel} · ${clock.clockText}`;
          }
        }
      }, MOD43_CONSTANTS.REALTIME_PHASE_CHECK_MS);
    }

    deactivateCompetingBackgrounds() {
      // Tắt nền YouTube Mod 40 nếu đang chạy
      try {
        if (NS.youtubeMotionBg && typeof NS.youtubeMotionBg.isActive === 'function' && NS.youtubeMotionBg.isActive()) {
          NS.youtubeMotionBg.clearWebBackground?.(true);
        }
      } catch (_err) {}

      // Tắt hạt Canvas mặc định Mod 22 nếu đang chạy để tránh đè 2 canvas
      try {
        if (NS.ambienceHub && typeof NS.ambienceHub.setBackgroundEffect === 'function') {
          NS.ambienceHub.setBackgroundEffect('NONE', false);
        }
      } catch (_err) {}

      // Ẩn lớp ảnh/video cũ nếu còn mở
      const mod32Art = document.getElementById('mod32-procedural-art-canvas');
      if (mod32Art) mod32Art.classList.add('hidden');
      const bgImg = document.getElementById('ambient-bg-image');
      if (bgImg) bgImg.classList.add('hidden');
      const bgVid = document.getElementById('ambient-bg-video');
      if (bgVid) bgVid.classList.add('hidden');
    }

    applyTuningCssVariables() {
      const t = this.state.tuning;
      const rootStyle = document.documentElement?.style;
      const layer = document.getElementById(MOD43_CONSTANTS.WEB_BG_LAYER_ID);
      const veil = document.getElementById(MOD43_CONSTANTS.WEB_DARK_VEIL_ID);

      const clampedGlass = clampNumber(t.uiGlassPct, 15, 95, 72);
      if (rootStyle) {
        const darkPaneAlpha = clampNumber(0.92 - clampedGlass / 100, 0.1, 0.76, 0.24).toFixed(2);
        const darkCardAlpha = clampNumber(1.04 - (clampedGlass * 0.82) / 100, 0.3, 0.84, 0.48).toFixed(2);
        const lightPaneAlpha = clampNumber(0.98 - clampedGlass / 100, 0.22, 0.86, 0.34).toFixed(2);
        const lightCardAlpha = clampNumber(1.06 - (clampedGlass * 0.72) / 100, 0.42, 0.9, 0.56).toFixed(2);
        rootStyle.setProperty('--noir-ambient-pane-dark', darkPaneAlpha);
        rootStyle.setProperty('--noir-ambient-card-dark', darkCardAlpha);
        rootStyle.setProperty('--noir-ambient-pane-light', lightPaneAlpha);
        rootStyle.setProperty('--noir-ambient-card-light', lightCardAlpha);
      }

      if (layer) {
        const opacity = clampNumber(t.opacityPct, 15, 100, 92) / 100;
        const blur = clampNumber(t.blurPx, 0, 24, 0);
        const bright = clampNumber(t.brightnessPct, 45, 175, 100);
        const contrast = clampNumber(t.contrastPct, 80, 145, 105);
        const sat = clampNumber(t.saturatePct, 60, 160, 105);
        layer.style.opacity = String(opacity);
        layer.style.filter = `blur(${blur}px) brightness(${bright}%) contrast(${contrast}%) saturate(${sat}%)`;
      }

      if (veil) {
        const darkAlpha = clampNumber(t.darknessPct, 0, 85, 18) / 100;
        veil.style.background = `rgba(6, 10, 18, ${darkAlpha.toFixed(2)})`;
      }
    }

    syncMiniPreviewVisuals() {
      const spec = this.getPreviewSpec();
      const cfg = lookupWmoConfig(spec.wmoCode);
      const ph = lookupPhaseConfig(spec.phaseId);
      const resolvedArt = this.folderVault.resolveLoadedImageForVariant(cfg.file, ph.id);

      const miniImg = document.getElementById(MOD43_CONSTANTS.MINI_IMAGE_ID);
      if (miniImg) {
        miniImg.style.backgroundImage = resolvedArt.url ? `url('${resolvedArt.url}')` : '';
        miniImg.style.backgroundSize = 'cover';
        miniImg.style.backgroundPosition = 'center';
      }

      const miniLight = document.getElementById(MOD43_CONSTANTS.MINI_LIGHT_ID);
      if (miniLight) {
        miniLight.className = `mod43-bg-layer ${ph.lightOverlayClass}`;
      }

      const miniCanvas = document.getElementById(MOD43_CONSTANTS.MINI_CANVAS_ID);
      if (miniCanvas) {
        this.miniRenderer.attachCanvas(miniCanvas);
        this.miniRenderer.updateConfig({
          wmoCode: cfg.code,
          timePhase: ph.id,
          windSpeedKmh: spec.windSpeedKmh,
          fxIntensityPct: this.state.tuning.fxIntensityPct,
          hasCustomArtworkImage: Boolean(resolvedArt.url),
        });
        this.miniRenderer.start();
      }
    }

    applyWebBackgroundNow() {
      const layer = document.getElementById(MOD43_CONSTANTS.WEB_BG_LAYER_ID);
      const bgImg = document.getElementById(MOD43_CONSTANTS.WEB_BG_IMAGE_ID);
      const lightOverlay = document.getElementById(MOD43_CONSTANTS.WEB_LIGHT_OVERLAY_ID);
      const fxCanvas = document.getElementById(MOD43_CONSTANTS.WEB_FX_CANVAS_ID);
      if (!layer || !fxCanvas) return false;

      if (this.state.bgMode === 'off') {
        return this.disableBackground();
      }

      this.deactivateCompetingBackgrounds();

      const useRealtime = this.state.bgMode === 'realtime';
      const rt = this.getActiveRealtimeSnapshot();
      const targetCode = useRealtime ? rt.wmoCode : this.state.customWmoCode;
      const targetPhase = useRealtime ? rt.timePhase : this.state.customPhaseId;
      const targetWind = useRealtime ? rt.windSpeedKmh : this.state.customWindKmh;

      const cfg = lookupWmoConfig(targetCode);
      const ph = lookupPhaseConfig(targetPhase);
      const resolvedArt = this.folderVault.resolveLoadedImageForVariant(cfg.file, ph.id);

      layer.classList.remove('hidden');
      document.body?.classList?.add('noir-ambient-active', 'mod43-weather-bg-active');

      if (bgImg) {
        bgImg.style.backgroundImage = resolvedArt.url ? `url('${resolvedArt.url}')` : '';
      }
      if (lightOverlay) {
        lightOverlay.className = `mod43-bg-layer ${ph.lightOverlayClass}`;
      }

      this.applyTuningCssVariables();

      this.webBgRenderer.attachCanvas(fxCanvas);
      this.webBgRenderer.updateConfig({
        wmoCode: cfg.code,
        timePhase: ph.id,
        windSpeedKmh: targetWind,
        fxIntensityPct: this.state.tuning.fxIntensityPct,
        hasCustomArtworkImage: Boolean(resolvedArt.url),
      });
      this.webBgRenderer.start();

      // Thử kiểm tra ảnh HTTP tùy chọn nếu bật
      if (!resolvedArt.url && this.state.allowHttpServerFolderProbe) {
        this.folderVault
          .probeHttpBackgroundOptional(cfg.file, ph.id, true)
          .then((hit) => {
            if (hit && hit.url && this.state.bgMode !== 'off' && bgImg) {
              bgImg.style.backgroundImage = `url('${hit.url}')`;
              this.webBgRenderer.updateConfig({ hasCustomArtworkImage: true });
            }
          });
      }

      return true;
    }

    applyRealtimeBackground(syncFirst = false) {
      this.state.bgMode = 'realtime';
      this.state.previewFollowsRealtime = true;
      this.saveStateToStorage();
      this.applyWebBackgroundNow();
      if (syncFirst) {
        this.syncRealtimeWeather(false, true);
      }
      this.refreshMountedPanel();
      return { ok: true, mode: 'realtime' };
    }

    applyCustomBackground(wmoCode, phaseId, windKmh) {
      if (wmoCode !== undefined && wmoCode !== null) {
        this.state.customWmoCode = lookupWmoConfig(wmoCode).code;
      }
      if (phaseId) {
        this.state.customPhaseId = lookupPhaseConfig(phaseId).id;
      }
      if (windKmh !== undefined && windKmh !== null) {
        this.state.customWindKmh = clampNumber(windKmh, 0, 120, this.state.customWindKmh);
      }
      this.state.bgMode = 'custom';
      this.state.previewFollowsRealtime = false;
      this.saveStateToStorage();
      this.applyWebBackgroundNow();
      this.refreshMountedPanel();
      return {
        ok: true,
        mode: 'custom',
        wmoCode: this.state.customWmoCode,
        phaseId: this.state.customPhaseId,
      };
    }

    setCustomVariant(wmoCode, phaseId, windKmh) {
      if (wmoCode !== undefined && wmoCode !== null) {
        this.state.customWmoCode = lookupWmoConfig(wmoCode).code;
      }
      if (phaseId) {
        this.state.customPhaseId = lookupPhaseConfig(phaseId).id;
      }
      if (windKmh !== undefined && windKmh !== null) {
        this.state.customWindKmh = clampNumber(windKmh, 0, 120, this.state.customWindKmh);
      }
      this.state.previewFollowsRealtime = false;
      // Khi đang chạy nền tùy chỉnh -> cập nhật nền web ngay; nếu đang ở realtime -> tạm chuyển sang preview tùy chỉnh trong hộp mô phỏng
      if (this.state.bgMode === 'realtime') {
        this.state.bgMode = 'custom';
        this.applyWebBackgroundNow();
      } else if (this.state.bgMode === 'custom') {
        this.applyWebBackgroundNow();
      }
      this.saveStateToStorage();
      this.refreshMountedPanel();
    }

    disableBackground() {
      this.state.bgMode = 'off';
      this.saveStateToStorage();
      this.webBgRenderer.stop();

      const layer = document.getElementById(MOD43_CONSTANTS.WEB_BG_LAYER_ID);
      if (layer) layer.classList.add('hidden');
      document.body?.classList?.remove('mod43-weather-bg-active', 'noir-ambient-peek-mode');

      // Chỉ tắt noir-ambient-active nếu không còn module nền nào khác đang hoạt động
      const hasMod40 = Boolean(NS.youtubeMotionBg?.isActive?.());
      const hasMod22Effect = Boolean(
        NS.ambienceHub?.canvasRenderer?.activeEffectKey &&
          NS.ambienceHub.canvasRenderer.activeEffectKey !== 'NONE'
      );
      const vidEl = document.getElementById('ambient-bg-video');
      const imgEl = document.getElementById('ambient-bg-image');
      const hasVideo = Boolean(vidEl && !vidEl.classList.contains('hidden') && vidEl.getAttribute('src'));
      const hasImage = Boolean(imgEl && !imgEl.classList.contains('hidden') && imgEl.getAttribute('src'));

      if (!hasMod40 && !hasMod22Effect && !hasVideo && !hasImage) {
        document.body?.classList?.remove('noir-ambient-active');
      }

      this.refreshMountedPanel();
      return { ok: true, mode: 'off' };
    }

    togglePeekMode(forceFlag = null) {
      if (this.state.bgMode === 'off') {
        this.applyCustomBackground();
      }
      const next =
        typeof forceFlag === 'boolean'
          ? forceFlag
          : !document.body?.classList?.contains('noir-ambient-peek-mode');
      document.body?.classList?.toggle('noir-ambient-peek-mode', next);
      this.refreshMountedPanel();
      return next;
    }

    clearGpsPinOnly() {
      this.state.gpsCoords = null;
      this.state.previewFollowsRealtime = true;
      this.saveStateToStorage();
    }

    clearGpsAndSync() {
      this.clearGpsPinOnly();
      return this.syncRealtimeWeather(false, true);
    }

    async syncRealtimeWeather(useBrowserGps = false, forceRefresh = true) {
      let gpsJustPinned = false;
      if (useBrowserGps) {
        const gps = await this.apiClient.requestBrowserGpsCoords();
        if (gps.ok) {
          this.state.gpsCoords = {
            lat: gps.lat,
            lon: gps.lon,
            label: gps.label,
          };
          this.state.previewFollowsRealtime = true;
          gpsJustPinned = true;
          this.saveStateToStorage();
        }
      } else if (
        this.state.gpsCoords &&
        Number.isFinite(Number(this.state.gpsCoords.lat)) &&
        Number.isFinite(Number(this.state.gpsCoords.lon)) &&
        (!this.state.gpsCoords.label ||
          String(this.state.gpsCoords.label).indexOf('Vị trí thực của bạn') !== -1 ||
          !/(Phường|Xã|Thị trấn)/i.test(String(this.state.gpsCoords.label)))
      ) {
        const upgradedPlace = await this.apiClient
          .reverseGeocodeCoords(this.state.gpsCoords.lat, this.state.gpsCoords.lon)
          .catch(() => '');
        if (upgradedPlace) {
          this.state.gpsCoords.label = this.apiClient.formatGpsPlaceLabel(
            this.state.gpsCoords.lat,
            this.state.gpsCoords.lon,
            upgradedPlace
          );
          gpsJustPinned = true;
          this.saveStateToStorage();
        }
      }

      const loc = this.apiClient.resolveTargetLocation(this.state);
      const snap = await this.apiClient.fetchRealtimeWeatherForLocation(loc, forceRefresh);
      if (this.state.gpsCoords && snap && snap.iana) {
        this.state.gpsCoords.iana = snap.iana;
      }
      this.state.lastRealtimeSnapshot = snap;
      if (this.state.bgMode !== 'custom' || gpsJustPinned) {
        this.state.customWmoCode = snap.wmoCode;
        this.state.customPhaseId = snap.timePhase;
        this.state.customWindKmh = snap.windSpeedKmh;
      }
      this.saveStateToStorage();

      if (this.state.bgMode === 'realtime') {
        this.applyWebBackgroundNow();
      }

      const mod42Ctrl = NS.worldClockStudio?.controller;
      if (mod42Ctrl && typeof mod42Ctrl.syncFromExternalGps === 'function' && this.state.gpsCoords && gpsJustPinned) {
        await mod42Ctrl.syncFromExternalGps(
          {
            lat: this.state.gpsCoords.lat,
            lon: this.state.gpsCoords.lon,
            name: this.state.gpsCoords.label,
            iana: snap.iana || this.state.gpsCoords.iana,
          },
          forceRefresh
        );
        if (!(mod42Ctrl.modalOpen && mod42Ctrl.activeModalTab === 'weather')) {
          this.refreshMountedPanel();
        }
      } else {
        this.refreshMountedPanel();
      }
      return snap;
    }

    mountIntoContainer(containerEl) {
      if (!containerEl) return false;
      this.activeContainer = containerEl;
      this.refreshMountedPanel();
      return true;
    }

    onModalClosed() {
      this.activeContainer = null;
      this.miniRenderer.stop();
      document.body?.classList?.remove('noir-ambient-peek-mode');
    }

    refreshMountedPanel() {
      const host = this.activeContainer || document.getElementById(MOUNT_CONTAINER_ID);
      if (!host) {
        this.miniRenderer.stop();
        return;
      }
      host.innerHTML = buildMod43InlineDockHtml(this);
      this.bindMountedPanelEvents(host);
      this.syncMiniPreviewVisuals();
      if (NS.i18n && NS.i18n.currentLang !== 'vi' && typeof NS.i18n.translateElement === 'function') {
        NS.i18n.translateElement(host);
      }
    }

    bindMountedPanelEvents(host) {
      host.querySelector('#mod43-btn-sync-gps')?.addEventListener('click', () => {
        this.syncRealtimeWeather(true, true);
      });

      host.querySelector('#mod43-btn-sync-zone')?.addEventListener('click', () => {
        this.state.gpsCoords = null;
        this.state.previewFollowsRealtime = true;
        this.saveStateToStorage();
        if (NS.worldClockStudio?.controller?.state?.weatherCityOverride?.isGps) {
          NS.worldClockStudio.controller.clearGpsWeatherOverride?.(true, false);
        }
        this.syncRealtimeWeather(false, true);
      });

      host.querySelector('#mod43-btn-apply-realtime-bg')?.addEventListener('click', () => {
        this.applyRealtimeBackground(true);
      });

      host.querySelector('#mod43-btn-apply-custom-bg')?.addEventListener('click', () => {
        this.applyCustomBackground();
      });

      host.querySelector('#mod43-btn-disable-bg')?.addEventListener('click', () => {
        this.disableBackground();
      });

      host.querySelector('#mod43-btn-toggle-peek')?.addEventListener('click', () => {
        this.togglePeekMode();
      });

      host.querySelector('#mod43-btn-toggle-tuning')?.addEventListener('click', () => {
        this.state.showTuningPanel = !this.state.showTuningPanel;
        this.saveStateToStorage();
        this.refreshMountedPanel();
      });

      host.querySelector('#mod43-btn-toggle-matrix')?.addEventListener('click', () => {
        this.state.showCustomMatrix = !this.state.showCustomMatrix;
        this.saveStateToStorage();
        this.refreshMountedPanel();
      });

      host.querySelector('#mod43-btn-reset-tuning')?.addEventListener('click', () => {
        this.state.tuning = { ...DEFAULT_STATE.tuning };
        this.state.customWindKmh = 14;
        this.saveStateToStorage();
        this.applyTuningCssVariables();
        if (this.state.bgMode !== 'off') this.applyWebBackgroundNow();
        this.refreshMountedPanel();
      });

      // Chọn khung giờ ánh sáng (6 phases)
      host.querySelectorAll('[data-mod43-pick-phase]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const phId = btn.getAttribute('data-mod43-pick-phase');
          this.setCustomVariant(undefined, phId, undefined);
        });
      });

      // Lọc nhóm thời tiết (28 WMO)
      host.querySelectorAll('[data-mod43-category]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.state.selectedCategory = btn.getAttribute('data-mod43-category') || 'ALL';
          this.saveStateToStorage();
          this.refreshMountedPanel();
        });
      });

      // Chọn từng mã WMO (0..99)
      host.querySelectorAll('[data-mod43-pick-wmo]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const code = Number(btn.getAttribute('data-mod43-pick-wmo'));
          this.setCustomVariant(code, undefined, undefined);
        });
      });

      // Thử nhanh kịch bản (17:30 chạng vạng, bão, tuyết...)
      host.querySelectorAll('[data-mod43-quick-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const pid = btn.getAttribute('data-mod43-quick-preset');
          const preset = MOD43_QUICK_SCENARIO_PRESETS.find((p) => p.id === pid);
          if (preset) {
            this.state.customWmoCode = preset.code;
            this.state.customPhaseId = preset.phase;
            this.state.customWindKmh = preset.wind;
            this.state.bgMode = 'custom';
            this.state.previewFollowsRealtime = false;
            this.saveStateToStorage();
            this.applyWebBackgroundNow();
            this.refreshMountedPanel();
          }
        });
      });

      // Sliders tùy chỉnh giống Tab 5 (không re-render cả DOM khi kéo để tránh giật thanh trượt)
      host.querySelectorAll('[data-mod43-slider]').forEach((input) => {
        input.addEventListener('input', (ev) => {
          const key = input.getAttribute('data-mod43-slider');
          const val = Number(ev.target.value);
          if (key === 'customWindKmh') {
            this.state.customWindKmh = clampNumber(val, 0, 120, 14);
          } else if (Object.prototype.hasOwnProperty.call(this.state.tuning, key)) {
            this.state.tuning[key] = val;
          }
          const readout = document.getElementById(`mod43-val-${key}`);
          if (readout) {
            const unit = key === 'blurPx' ? 'px' : key === 'customWindKmh' ? 'km/h' : '%';
            readout.textContent = `${Math.round(val)}${unit}`;
          }
          this.applyTuningCssVariables();
          this.syncMiniPreviewVisuals();
          if (this.state.bgMode !== 'off') {
            const spec = this.getPreviewSpec();
            this.webBgRenderer.updateConfig({
              wmoCode: spec.wmoCode,
              timePhase: spec.phaseId,
              windSpeedKmh: this.state.bgMode === 'custom' ? this.state.customWindKmh : spec.windSpeedKmh,
              fxIntensityPct: this.state.tuning.fxIntensityPct,
            });
          }
          this.saveStateToStorage();
        });
      });

      // Nạp thư mục backgrounds/
      const folderInput = host.querySelector('#mod43-bg-folder-input');
      host.querySelector('#mod43-btn-import-bg-folder')?.addEventListener('click', () => {
        if (folderInput) {
          folderInput.value = '';
          folderInput.click();
        }
      });
      folderInput?.addEventListener('change', async (ev) => {
        const res = await this.folderVault.importFileList(ev.target.files);
        if (res.ok) {
          if (this.state.bgMode !== 'off') this.applyWebBackgroundNow();
          this.refreshMountedPanel();
        }
      });
      host.querySelector('#mod43-btn-clear-bg-folder')?.addEventListener('click', async () => {
        await this.folderVault.clearAllImportedImages();
        if (this.state.bgMode !== 'off') this.applyWebBackgroundNow();
        this.refreshMountedPanel();
      });
    }

    getState() {
      return {
        ...this.state,
        tuning: { ...this.state.tuning },
        loadedFolderImagesCount: this.folderVault.getCount(),
        miniRunning: this.miniRenderer.running,
        webBgRunning: this.webBgRenderer.running,
      };
    }

    selfInspect() {
      const rt = this.getActiveRealtimeSnapshot();
      const spec = this.getPreviewSpec();
      return {
        module: MODULE_ID,
        version: ENGINE_VERSION,
        ok: Boolean(document.getElementById(MOD43_CONSTANTS.WEB_BG_LAYER_ID)),
        timePhaseCount: MOD43_TIME_PHASES.length,
        wmoCodeCount: MOD43_WMO_CODES_LIST.length,
        totalVariantMatrix: MOD43_TIME_PHASES.length * MOD43_WMO_CODES_LIST.length,
        bgMode: this.state.bgMode,
        previewWmoCode: spec.wmoCode,
        previewPhaseId: spec.phaseId,
        realtimePhaseId: rt.timePhase,
        loadedFolderImagesCount: this.folderVault.getCount(),
        webBgLayerVisible: !document.getElementById(MOD43_CONSTANTS.WEB_BG_LAYER_ID)?.classList?.contains('hidden'),
      };
    }
  }

  const controller = new Mod43WeatherSkyController();

  const publicApi = {
    moduleId: MODULE_ID,
    controller,
    MOD43_CONSTANTS,
    MOD43_TIME_PHASES,
    MOD43_WMO_WEATHER_MATRIX,
    MOD43_WMO_CODES_LIST,
    MOD43_QUICK_SCENARIO_PRESETS,
    computeTimePhaseFromMinutes: (currentMins, sunriseMins, sunsetMins) =>
      Mod43PhaseCalculator.getTimePhaseFromMinutes(currentMins, sunriseMins, sunsetMins),
    computeTimePhaseFromIso: (sunriseIso, sunsetIso, zoneIana) =>
      Mod43PhaseCalculator.getTimePhaseFromSunriseSunsetIso(sunriseIso, sunsetIso, zoneIana),
    init: () => controller.init(),
    mountIntoContainer: (el) => controller.mountIntoContainer(el),
    onModalClosed: () => controller.onModalClosed(),
    syncRealtimeWeather: (useGps, force) => controller.syncRealtimeWeather(useGps, force),
    applyRealtimeBackground: (syncFirst) => controller.applyRealtimeBackground(syncFirst),
    applyCustomBackground: (code, phase, wind) => controller.applyCustomBackground(code, phase, wind),
    setCustomVariant: (code, phase, wind) => controller.setCustomVariant(code, phase, wind),
    disableBackground: () => controller.disableBackground(),
    togglePeekMode: (flag) => controller.togglePeekMode(flag),
    getState: () => controller.getState(),
    selfInspect: () => controller.selfInspect(),
  };

  NS.weatherSkyEngine = publicApi;
  NS.mod43 = publicApi;
  NS.registry.mod43 = 'weatherSkyEngine';

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod43', publicApi);
  }
})(typeof window !== 'undefined' ? window : globalThis);
