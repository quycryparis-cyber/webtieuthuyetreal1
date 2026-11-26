/**
 * ============================================================================
 * MODULE 45: MÁY TÍNH KHOA HỌC CASIO FX-570VN PLUS & ĐỒ THỊ HÀM SỐ KIỂU DESMOS
 * ============================================================================
 * 100% Local-First (Chạy hoàn toàn trên CPU & HTML5 Canvas máy người dùng,
 * 0 phụ thuộc mạng / 0 CDN ngoài, độ trễ 0ms).
 *
 * Bao gồm:
 * - Giả lập trọn bộ Casio fx-570VN PLUS (NATURAL-V.P.A.M.):
 *   + Đủ 50 phím cứng (SHIFT, ALPHA, REPLAY 4 chiều, MODE/SETUP, ON, CALC/SOLVE,
 *     ∫dx, d/dx, ∑, ∏, phân số a/b, ÷R, √, ∛, ⁿ√, x², x³, xⁿ, log■□, log, ln,
 *     sin/cos/tan/hyp/nghịch đảo, °′″, FACT, Abs, RCL/STO, ENG, S⇔D phân số/căn/π,
 *     M+/M-, CONST 40 hằng số, CONV 24 đơn vị, nPr, nCr, GCD, LCM, Pol/Rec, RanInt).
 *   + Đủ 9 chế độ MODE: COMP, CMPLX, STAT, BASE-N, EQN (Hệ 2 ẩn/3 ẩn, Bậc 2, Bậc 3),
 *     MATRIX (2×2 & 3×3), TABLE f(x)/g(x), VECTOR (2D/3D), INEQ (Bất phương trình Bậc 2 & 3).
 * - Nút "📈 Tạo hàm đồ thị" mở Đồ thị Hàm số tương tác kiểu Desmos ngay bên cạnh:
 *   + Vẽ đa hàm y = f(x), hàm ẩn (x² + y² = 9, hình trái tim...), tọa độ cực r(θ),
 *     bất đẳng thức tô vùng (y ≤ x² - 1), thanh trượt tham số động (a, b, c) có Play/Pause.
 *   + Tự động tìm & đánh dấu Nghiệm (trục Ox), Giao trục Oy, Cực trị (Max/Min), Giao điểm.
 *   + Kéo thả (Pan), Cuộn phóng to/thu nhỏ (Zoom), chế độ Sáng/Tối kiểu Desmos,
 *     cầu nối 2 chiều với fx-570VN PLUS & xuất ảnh đồ thị .PNG cục bộ.
 * ============================================================================
 */
(function (global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});
  if (typeof global !== 'undefined') {
    global.NoirNovel = NS;
  }

  const MOD45_STORAGE_KEY = 'noir_v102_mod45_fx570_desmos_state';
  const MOD45_STYLE_ID = 'mod45-fx570-desmos-styles';
  const MOD45_MODAL_ID = 'mod45-fx570-desmos-modal';

  // ==========================================================================
  // PHẦN 1: DANH MỤC 40 HẰNG SỐ VẬT LÝ (SHIFT+7 CONST) & 24 ĐỔI ĐƠN VỊ (CONV)
  // ==========================================================================
  const FX570_CONSTANTS = Object.freeze([
    { code: '01', symbol: 'mp', name: 'Khối lượng proton', value: 1.67262192369e-27, unit: 'kg' },
    { code: '02', symbol: 'mn', name: 'Khối lượng neutron', value: 1.67492749804e-27, unit: 'kg' },
    { code: '03', symbol: 'me', name: 'Khối lượng electron', value: 9.1093837015e-31, unit: 'kg' },
    { code: '04', symbol: 'mμ', name: 'Khối lượng muon', value: 1.883531627e-28, unit: 'kg' },
    { code: '05', symbol: 'a0', name: 'Bán kính Bohr', value: 5.29177210903e-11, unit: 'm' },
    { code: '06', symbol: 'h', name: 'Hằng số Planck', value: 6.62607015e-34, unit: 'J·s' },
    { code: '07', symbol: 'μN', name: 'Manhêton hạt nhân', value: 5.0507837461e-27, unit: 'J/T' },
    { code: '08', symbol: 'μB', name: 'Manhêton Bohr', value: 9.2740100783e-24, unit: 'J/T' },
    { code: '09', symbol: 'ħ', name: 'Planck rút gọn (h/2π)', value: 1.054571817e-34, unit: 'J·s' },
    { code: '10', symbol: 'α', name: 'Hằng số cấu trúc tinh tế', value: 7.2973525693e-3, unit: '' },
    { code: '11', symbol: 're', name: 'Bán kính electron cổ điển', value: 2.8179403262e-15, unit: 'm' },
    { code: '12', symbol: 'λc', name: 'Bước sóng Compton e⁻', value: 2.42631023867e-12, unit: 'm' },
    { code: '13', symbol: 'γp', name: 'Tỉ số từ-cơ proton', value: 2.6752218744e8, unit: 's⁻¹T⁻¹' },
    { code: '14', symbol: 'λcp', name: 'Bước sóng Compton p⁺', value: 1.32140985539e-15, unit: 'm' },
    { code: '15', symbol: 'λcn', name: 'Bước sóng Compton n⁰', value: 1.31959090581e-15, unit: 'm' },
    { code: '16', symbol: 'R∞', name: 'Hằng số Rydberg', value: 10973731.56816, unit: 'm⁻¹' },
    { code: '17', symbol: 'u', name: 'Đơn vị khối lượng nguyên tử', value: 1.6605390666e-27, unit: 'kg' },
    { code: '18', symbol: 'μp', name: 'Mômen từ proton', value: 1.41060679736e-26, unit: 'J/T' },
    { code: '19', symbol: 'μe', name: 'Mômen từ electron', value: -9.2847647043e-24, unit: 'J/T' },
    { code: '20', symbol: 'μn', name: 'Mômen từ neutron', value: -9.6623651e-27, unit: 'J/T' },
    { code: '21', symbol: 'μμ', name: 'Mômen từ muon', value: -4.4904483e-26, unit: 'J/T' },
    { code: '22', symbol: 'F', name: 'Hằng số Faraday', value: 96485.33212, unit: 'C/mol' },
    { code: '23', symbol: 'e', name: 'Điện tích nguyên tố', value: 1.602176634e-19, unit: 'C' },
    { code: '24', symbol: 'NA', name: 'Số Avogadro', value: 6.02214076e23, unit: 'mol⁻¹' },
    { code: '25', symbol: 'k', name: 'Hằng số Boltzmann', value: 1.380649e-23, unit: 'J/K' },
    { code: '26', symbol: 'Vm', name: 'Thể tích mol khí lý tưởng', value: 0.02241396954, unit: 'm³/mol' },
    { code: '27', symbol: 'R', name: 'Hằng số khí lý tưởng', value: 8.314462618, unit: 'J/(mol·K)' },
    { code: '28', symbol: 'c0', name: 'Tốc độ ánh sáng chân không', value: 299792458, unit: 'm/s' },
    { code: '29', symbol: 'c1', name: 'Hằng số bức xạ thứ nhất', value: 3.741771852e-16, unit: 'W·m²' },
    { code: '30', symbol: 'c2', name: 'Hằng số bức xạ thứ hai', value: 0.01438776877, unit: 'm·K' },
    { code: '31', symbol: 'σ', name: 'Hằng số Stefan-Boltzmann', value: 5.670374419e-8, unit: 'W/(m²K⁴)' },
    { code: '32', symbol: 'ε0', name: 'Hằng số điện môi chân không', value: 8.8541878128e-12, unit: 'F/m' },
    { code: '33', symbol: 'μ0', name: 'Độ từ thẩm chân không', value: 1.25663706212e-6, unit: 'N/A²' },
    { code: '34', symbol: 'Φ0', name: 'Lượng tử từ thông', value: 2.067833848e-15, unit: 'Wb' },
    { code: '35', symbol: 'g', name: 'Gia tốc trọng trường chuẩn', value: 9.80665, unit: 'm/s²' },
    { code: '36', symbol: 'G0', name: 'Lượng tử độ dẫn điện', value: 7.748091729e-5, unit: 'S' },
    { code: '37', symbol: 'Z0', name: 'Trở kháng đặc trưng chân không', value: 376.730313668, unit: 'Ω' },
    { code: '38', symbol: 't', name: 'Nhiệt độ 0°C theo Kelvin', value: 273.15, unit: 'K' },
    { code: '39', symbol: 'G', name: 'Hằng số hấp dẫn Newton', value: 6.6743e-11, unit: 'm³/(kg·s²)' },
    { code: '40', symbol: 'atm', name: 'Áp suất khí quyển chuẩn', value: 101325, unit: 'Pa' }
  ]);

  const FX570_CONVERSIONS = Object.freeze([
    { code: '01', label: 'in → cm', fn: (v) => v * 2.54 },
    { code: '02', label: 'cm → in', fn: (v) => v / 2.54 },
    { code: '03', label: 'ft → m', fn: (v) => v * 0.3048 },
    { code: '04', label: 'm → ft', fn: (v) => v / 0.3048 },
    { code: '05', label: 'yd → m', fn: (v) => v * 0.9144 },
    { code: '06', label: 'm → yd', fn: (v) => v / 0.9144 },
    { code: '07', label: 'mile → km', fn: (v) => v * 1.609344 },
    { code: '08', label: 'km → mile', fn: (v) => v / 1.609344 },
    { code: '09', label: 'n mile → m', fn: (v) => v * 1852 },
    { code: '10', label: 'm → n mile', fn: (v) => v / 1852 },
    { code: '11', label: 'acre → m²', fn: (v) => v * 4046.8564224 },
    { code: '12', label: 'm² → acre', fn: (v) => v / 4046.8564224 },
    { code: '13', label: 'gal(US) → L', fn: (v) => v * 3.785411784 },
    { code: '14', label: 'L → gal(US)', fn: (v) => v / 3.785411784 },
    { code: '15', label: 'oz → g', fn: (v) => v * 28.349523125 },
    { code: '16', label: 'g → oz', fn: (v) => v / 28.349523125 },
    { code: '17', label: 'lb → kg', fn: (v) => v * 0.45359237 },
    { code: '18', label: 'kg → lb', fn: (v) => v / 0.45359237 },
    { code: '19', label: 'atm → Pa', fn: (v) => v * 101325 },
    { code: '20', label: 'Pa → atm', fn: (v) => v / 101325 },
    { code: '21', label: 'mmHg → Pa', fn: (v) => v * 133.3223684 },
    { code: '22', label: '°F → °C', fn: (v) => ((v - 32) * 5) / 9 },
    { code: '23', label: '°C → °F', fn: (v) => (v * 9) / 5 + 32 },
    { code: '24', label: 'km/h → m/s', fn: (v) => v / 3.6 },
    { code: '25', label: 'm/s → km/h', fn: (v) => v * 3.6 },
    { code: '26', label: 'cal → J', fn: (v) => v * 4.184 },
    { code: '27', label: 'J → cal', fn: (v) => v / 4.184 },
    { code: '28', label: 'hp → kW', fn: (v) => v * 0.745699872 }
  ]);

  const DESMOS_COLORS = Object.freeze([
    '#c74440',
    '#2d70b3',
    '#388c46',
    '#6042a6',
    '#fa7e19',
    '#000000',
    '#d946ef',
    '#0d9488'
  ]);

  const DESMOS_PRESETS = Object.freeze([
    {
      id: 'parabola_line',
      label: 'Parabol & Đường thẳng',
      expressions: [
        { expr: 'y = x^2 - 2x - 3', color: '#2d70b3' },
        { expr: 'y = x + 1', color: '#c74440' }
      ]
    },
    {
      id: 'trig_wave',
      label: 'Sóng Sin/Cos có tham số động',
      expressions: [
        { expr: 'a = 1.5', color: '#fa7e19' },
        { expr: 'b = 2', color: '#6042a6' },
        { expr: 'y = a*sin(b*x)', color: '#2d70b3' },
        { expr: 'y = cos(x)', color: '#388c46' }
      ]
    },
    {
      id: 'heart_implicit',
      label: 'Đường cong Trái Tim (Hàm ẩn)',
      expressions: [
        { expr: '(x^2 + y^2 - 4)^3 - x^2 * y^3 = 0', color: '#c74440' }
      ]
    },
    {
      id: 'circle_ineq',
      label: 'Đường tròn & Miền bất đẳng thức',
      expressions: [
        { expr: 'x^2 + y^2 = 16', color: '#6042a6' },
        { expr: 'y <= 0.5*x^2 - 2', color: '#388c46' }
      ]
    },
    {
      id: 'polar_rose',
      label: 'Bông hoa Cực r = 4cos(3θ)',
      expressions: [
        { expr: 'r = 4*cos(3*theta)', color: '#d946ef' },
        { expr: 'r = 2 + 2*sin(theta)', color: '#0d9488' }
      ]
    },
    {
      id: 'cubic_extrema',
      label: 'Hàm bậc 3 & Cực trị',
      expressions: [
        { expr: 'y = x^3 - 3x', color: '#c74440' },
        { expr: 'y = 3x^2 - 3', color: '#2d70b3' }
      ]
    }
  ]);

  function tr(text) {
    try {
      const i18n = NS.i18n || (global.NoirNovel && global.NoirNovel.i18n);
      if (i18n && typeof i18n.translateText === 'function') {
        return i18n.translateText(String(text || ''));
      }
    } catch (_e) {}
    return String(text || '');
  }

  function translateTree(el) {
    if (!el) return;
    try {
      const i18n = NS.i18n || (global.NoirNovel && global.NoirNovel.i18n);
      if (i18n && typeof i18n.translateElement === 'function') {
        i18n.translateElement(el);
      }
    } catch (_e) {}
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function gcdInt(a, b) {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return NaN;
    while (y !== 0) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x;
  }

  function lcmInt(a, b) {
    const x = Math.abs(Math.round(a));
    const y = Math.abs(Math.round(b));
    if (x === 0 || y === 0) return 0;
    const g = gcdInt(x, y);
    return g ? (x / g) * y : NaN;
  }

  function gammaLanczos(z) {
    const p = [
      676.5203681218851,
      -1259.1392167224028,
      771.3234287776531,
      -176.6150291621406,
      12.507343278686905,
      -0.13857109526572012,
      9.984369578019572e-6,
      1.5056327351493116e-7
    ];
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * gammaLanczos(1 - z));
    }
    let zz = z - 1;
    let x = 0.9999999999998099;
    for (let i = 0; i < p.length; i++) {
      x += p[i] / (zz + i + 1);
    }
    const t = zz + p.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, zz + 0.5) * Math.exp(-t) * x;
  }

  function factorialVal(n) {
    if (!Number.isFinite(n)) return NaN;
    if (n < 0 && Math.abs(n - Math.round(n)) < 1e-12) return NaN;
    if (n > 170) return Infinity;
    if (Math.abs(n - Math.round(n)) < 1e-12 && n >= 0) {
      let r = 1;
      const k = Math.round(n);
      for (let i = 2; i <= k; i++) r *= i;
      return r;
    }
    return gammaLanczos(n + 1);
  }

  function primeFactorize(num) {
    const nAbs = Math.round(Math.abs(num));
    if (!Number.isFinite(nAbs) || nAbs < 2 || Math.abs(num - Math.round(num)) > 1e-9 || nAbs > 1e12) {
      return String(num);
    }
    let rem = nAbs;
    const factors = [];
    let d = 2;
    while (d * d <= rem) {
      let cnt = 0;
      while (rem % d === 0) {
        rem = Math.floor(rem / d);
        cnt++;
      }
      if (cnt > 0) factors.push({ p: d, e: cnt });
      d = d === 2 ? 3 : d + 2;
    }
    if (rem > 1) factors.push({ p: rem, e: 1 });
    const sup = (exp) =>
      String(exp)
        .split('')
        .map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(ch)] || ch)
        .join('');
    const body = factors.map((f) => (f.e === 1 ? `${f.p}` : `${f.p}${sup(f.e)}`)).join(' × ');
    return num < 0 ? `-(${body})` : body;
  }

  function toDMSString(degVal) {
    if (!Number.isFinite(degVal)) return 'Math ERROR';
    const sign = degVal < 0 ? '-' : '';
    const abs = Math.abs(degVal);
    const d = Math.floor(abs + 1e-12);
    const remM = (abs - d) * 60;
    const m = Math.floor(remM + 1e-10);
    const s = Number(((remM - m) * 60).toFixed(2));
    return `${sign}${d}°${m}′${s}″`;
  }

  // ==========================================================================
  // PHẦN 2: ĐỘNG CƠ ĐỊNH DẠNG KẾT QUẢ CHÍNH XÁC (S⇔D: PHÂN SỐ, CĂN, π)
  // ==========================================================================
  function approximateRational(x, maxDen = 9999, tol = 1e-10) {
    if (!Number.isFinite(x)) return null;
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    if (ax < tol) return { n: 0, d: 1 };
    let h1 = 1;
    let h2 = 0;
    let k1 = 0;
    let k2 = 1;
    let b = ax;
    for (let iter = 0; iter < 32; iter++) {
      const a = Math.floor(b);
      const h = a * h1 + h2;
      const k = a * k1 + k2;
      if (k > maxDen) break;
      h2 = h1;
      h1 = h;
      k2 = k1;
      k1 = k;
      if (Math.abs(ax - h1 / k1) <= tol * Math.max(1, ax)) {
        return { n: sign * h1, d: k1 };
      }
      const rem = b - a;
      if (rem < 1e-14) break;
      b = 1 / rem;
    }
    if (k1 > 0 && Math.abs(ax - h1 / k1) <= tol * Math.max(1, ax)) {
      return { n: sign * h1, d: k1 };
    }
    return null;
  }

  function formatExactSymbolic(val) {
    if (!Number.isFinite(val)) return null;
    if (Math.abs(val) < 1e-13) return '0';
    if (Math.abs(val - Math.round(val)) < 1e-11 && Math.abs(val) < 1e12) {
      return String(Math.round(val));
    }

    // 1. Phân số tối giản p/q
    const frac = approximateRational(val, 2000, 1e-10);
    if (frac && frac.d > 1) {
      return `${frac.n}/${frac.d}`;
    }

    // 2. Bội phân số của π (ví dụ π/2, 3π/4)
    const piRatio = approximateRational(val / Math.PI, 120, 1e-9);
    if (piRatio && piRatio.n !== 0) {
      const sign = piRatio.n < 0 ? '-' : '';
      const an = Math.abs(piRatio.n);
      const numStr = an === 1 ? 'π' : `${an}π`;
      return piRatio.d === 1 ? `${sign}${numStr}` : `${sign}${numStr}/${piRatio.d}`;
    }

    // 3. Căn bậc hai đơn giản (p√r / q với r ∈ {2,3,5,6,7,10,11,13,14,15})
    const rads = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];
    for (let i = 0; i < rads.length; i++) {
      const r = rads[i];
      const sr = Math.sqrt(r);
      const rat = approximateRational(val / sr, 120, 1e-9);
      if (rat && rat.n !== 0) {
        const sign = rat.n < 0 ? '-' : '';
        const an = Math.abs(rat.n);
        const top = an === 1 ? `√${r}` : `${an}√${r}`;
        return rat.d === 1 ? `${sign}${top}` : `${sign}${top}/${rat.d}`;
      }
    }
    return null;
  }

  function formatDecimalNumber(val, displayMode = 'NORM', precision = 10) {
    if (typeof val === 'string') return val;
    if (Number.isNaN(val)) return 'Math ERROR';
    if (!Number.isFinite(val)) return val > 0 ? '∞' : '-∞';
    if (Math.abs(val) < 1e-14) return '0';

    if (displayMode === 'FIX') {
      const d = Math.max(0, Math.min(9, Number(precision) || 2));
      return val.toFixed(d);
    }
    if (displayMode === 'SCI') {
      const d = Math.max(1, Math.min(9, Number(precision) || 4));
      return val.toExponential(d).replace('e+', '×10^').replace('e', '×10^');
    }
    if (Math.abs(val) >= 1e10 || (Math.abs(val) > 0 && Math.abs(val) < 1e-5)) {
      return Number(val.toPrecision(10))
        .toExponential()
        .replace(/\.?0+e/, 'e')
        .replace('e+', '×10^')
        .replace('e', '×10^');
    }
    const rounded = Number(val.toPrecision(12));
    return String(rounded);
  }

  // ==========================================================================
  // PHẦN 3: BỘ PHÂN TÍCH & TÍNH TOÁN BIỂU THỨC KHOA HỌC (FX-570VN PLUS ENGINE)
  // ==========================================================================
  class Fx570MathEngine {
    constructor() {
      this.angleUnit = 'DEG'; // DEG | RAD | GRA
      this.displayMode = 'NORM'; // NORM | FIX | SCI
      this.displayPrecision = 4;
      this.vars = {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        E: 0,
        F: 0,
        X: 0,
        Y: 0,
        M: 0,
        Ans: 0,
        PreAns: 0
      };
    }

    toRad(angle) {
      if (this.angleUnit === 'DEG') return (angle * Math.PI) / 180;
      if (this.angleUnit === 'GRA') return (angle * Math.PI) / 200;
      return angle;
    }

    fromRad(rad) {
      if (this.angleUnit === 'DEG') return (rad * 180) / Math.PI;
      if (this.angleUnit === 'GRA') return (rad * 200) / Math.PI;
      return rad;
    }

    normalizeExpression(raw) {
      let s = String(raw || '').trim();
      s = s
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/–/g, '-')
        .replace(/π/g, 'pi')
        .replace(/θ/g, 'theta')
        .replace(/√\(/g, 'sqrt(')
        .replace(/∛\(/g, 'cbrt(')
        .replace(/√([0-9.a-zA-Z_]+)/g, 'sqrt($1)')
        .replace(/∛([0-9.a-zA-Z_]+)/g, 'cbrt($1)')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/⁻¹/g, '^(-1)')
        .replace(/sin⁻¹/g, 'asin')
        .replace(/cos⁻¹/g, 'acos')
        .replace(/tan⁻¹/g, 'atan')
        .replace(/sinh⁻¹/g, 'asinh')
        .replace(/cosh⁻¹/g, 'acosh')
        .replace(/tanh⁻¹/g, 'atanh')
        .replace(/Abs\(/g, 'abs(')
        .replace(/\|([^|]+)\|/g, 'abs($1)');
      return s;
    }

    tokenize(input) {
      const s = this.normalizeExpression(input);
      const rawTokens = [];
      let i = 0;
      while (i < s.length) {
        const ch = s[i];
        if (/\s/.test(ch)) {
          i++;
          continue;
        }
        // Số (bao gồm dạng 1.5e-3 hoặc 2E5)
        if (/[0-9.]/.test(ch)) {
          let start = i;
          let hasDot = ch === '.';
          i++;
          while (i < s.length && (/[0-9]/.test(s[i]) || (!hasDot && s[i] === '.'))) {
            if (s[i] === '.') hasDot = true;
            i++;
          }
          if (i < s.length && (s[i] === 'E' || (s[i] === 'e' && /[0-9+-]/.test(s[i + 1] || '')))) {
            const expPos = i;
            i++;
            if (s[i] === '+' || s[i] === '-') i++;
            const dStart = i;
            while (i < s.length && /[0-9]/.test(s[i])) i++;
            if (i === dStart) i = expPos;
          }
          rawTokens.push({ type: 'NUM', value: parseFloat(s.slice(start, i)) });
          continue;
        }
        // Định danh (hàm / biến / hằng)
        if (/[a-zA-Z_]/.test(ch)) {
          let start = i;
          i++;
          while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) i++;
          const word = s.slice(start, i);
          rawTokens.push({ type: 'ID', value: word });
          continue;
        }
        if ('+-*/^(),!%°'.includes(ch)) {
          rawTokens.push({ type: 'OP', value: ch });
          i++;
          continue;
        }
        throw new Error(`Ký tự không hợp lệ: ${ch}`);
      }

      // Chèn phép nhân ngầm định (ví dụ 2x -> 2*x, 2sin(30) -> 2*sin(30), (x+1)(x-1) -> (x+1)*(x-1), 2pi -> 2*pi)
      const tokens = [];
      const fnNames = new Set([
        'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
        'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
        'log', 'ln', 'logbase', 'exp', 'sqrt', 'cbrt', 'nroot',
        'abs', 'int', 'intg', 'floor', 'ceil', 'round', 'rnd', 'sign',
        'npr', 'ncr', 'gcd', 'lcm', 'fact', 'ran', 'ranint',
        'pol', 'rec', 'divr', 'dms', 'min', 'max',
        'integral', 'diff', 'sum', 'prod', 'solve'
      ]);

      for (let k = 0; k < rawTokens.length; k++) {
        const curr = rawTokens[k];
        if (tokens.length > 0) {
          const prev = tokens[tokens.length - 1];
          const prevIsVal =
            prev.type === 'NUM' ||
            (prev.type === 'ID' && !fnNames.has(prev.value.toLowerCase())) ||
            (prev.type === 'OP' && (prev.value === ')' || prev.value === '!' || prev.value === '%' || prev.value === '°'));
          const currStartsVal =
            curr.type === 'NUM' ||
            curr.type === 'ID' ||
            (curr.type === 'OP' && curr.value === '(');
          // Nếu prev là tên biến (ví dụ x) và curr là '(' thì vẫn nhân ngầm x(x+1), còn nếu prev là tên hàm sin thì không!
          if (prevIsVal && currStartsVal) {
            tokens.push({ type: 'OP', value: '*' });
          }
        }
        tokens.push(curr);
      }
      return tokens;
    }

    evaluate(expr, localScope = {}) {
      const trimmed = String(expr || '').trim();
      if (!trimmed) return 0;

      // Hỗ trợ lệnh giải tích / tổng / tích đặc biệt dạng chuỗi:
      // ∫(expr, a, b), d/dx(expr, x0), ∑(expr, a, b), ∏(expr, a, b), SOLVE(expr, x0), FACT(n), a ÷R b
      const special = this.tryEvaluateSpecialMacro(trimmed, localScope);
      if (special !== undefined) return special;

      const tokens = this.tokenize(trimmed);
      let pos = 0;

      const peek = () => tokens[pos] || null;
      const consume = () => tokens[pos++];

      const parseExpr = () => {
        let left = parseTerm();
        while (peek() && peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
          const op = consume().value;
          const right = parseTerm();
          left = op === '+' ? left + right : left - right;
        }
        return left;
      };

      const parseTerm = () => {
        let left = parseUnary();
        while (peek() && peek().type === 'OP' && (peek().value === '*' || peek().value === '/')) {
          const op = consume().value;
          const right = parseUnary();
          if (op === '/') {
            if (right === 0) throw new Error('Math ERROR (Chia cho 0)');
            left = left / right;
          } else {
            left = left * right;
          }
        }
        return left;
      };

      const parseUnary = () => {
        if (peek() && peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
          const op = consume().value;
          const val = parseUnary();
          return op === '-' ? -val : val;
        }
        return parsePower();
      };

      const parsePower = () => {
        let base = parsePostfix();
        if (peek() && peek().type === 'OP' && peek().value === '^') {
          consume();
          const exp = parseUnary();
          base = Math.pow(base, exp);
        }
        return base;
      };

      const parsePostfix = () => {
        let val = parsePrimary();
        while (peek() && peek().type === 'OP' && (peek().value === '!' || peek().value === '%' || peek().value === '°')) {
          const op = consume().value;
          if (op === '!') val = factorialVal(val);
          else if (op === '%') val = val / 100;
          else if (op === '°') {
            // Chuyển độ khi ở RAD/GRA
            if (this.angleUnit === 'RAD') val = (val * Math.PI) / 180;
            else if (this.angleUnit === 'GRA') val = (val * 200) / 180;
          }
        }
        return val;
      };

      const parsePrimary = () => {
        const t = peek();
        if (!t) throw new Error('Syntax ERROR');
        if (t.type === 'NUM') {
          consume();
          return t.value;
        }
        if (t.type === 'OP' && t.value === '(') {
          consume();
          const val = parseExpr();
          if (!peek() || peek().value !== ')') throw new Error('Syntax ERROR (Thiếu ngoặc đóng)');
          consume();
          return val;
        }
        if (t.type === 'ID') {
          consume();
          const name = t.value;
          const low = name.toLowerCase();
          // Kiểm tra gọi hàm
          if (peek() && peek().type === 'OP' && peek().value === '(') {
            consume(); // '('
            const args = [];
            if (!peek() || peek().value !== ')') {
              args.push(parseExpr());
              while (peek() && peek().type === 'OP' && peek().value === ',') {
                consume();
                args.push(parseExpr());
              }
            }
            if (!peek() || peek().value !== ')') throw new Error('Syntax ERROR (Thiếu ngoặc đóng hàm)');
            consume();
            return this.callFunction(low, args);
          }

          // Biến & hằng số
          if (Object.prototype.hasOwnProperty.call(localScope, name)) return Number(localScope[name]);
          if (Object.prototype.hasOwnProperty.call(localScope, low)) return Number(localScope[low]);
          if (low === 'pi') return Math.PI;
          if (low === 'e') return Math.E;
          if (low === 'ans') return Number(this.vars.Ans) || 0;
          if (low === 'preans') return Number(this.vars.PreAns) || 0;
          if (Object.prototype.hasOwnProperty.call(this.vars, name)) return Number(this.vars[name]) || 0;
          if (Object.prototype.hasOwnProperty.call(this.vars, name.toUpperCase())) {
            return Number(this.vars[name.toUpperCase()]) || 0;
          }
          // Tên hàm viết tắt kiểu sin30 hoặc sqrt9
          if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'cbrt'].includes(low)) {
            const arg = parseUnary();
            return this.callFunction(low, [arg]);
          }
          throw new Error(`Biến không xác định: ${name}`);
        }
        throw new Error('Syntax ERROR');
      };

      const res = parseExpr();
      if (pos < tokens.length) throw new Error('Syntax ERROR');
      return res;
    }

    callFunction(fn, args) {
      const a0 = args[0];
      const a1 = args[1];
      const a2 = args[2];
      switch (fn) {
        case 'sin': {
          const r = this.toRad(a0);
          const v = Math.sin(r);
          return Math.abs(v) < 1e-14 ? 0 : v;
        }
        case 'cos': {
          const r = this.toRad(a0);
          const v = Math.cos(r);
          return Math.abs(v) < 1e-14 ? 0 : v;
        }
        case 'tan': {
          const r = this.toRad(a0);
          if (Math.abs(Math.cos(r)) < 1e-14) throw new Error('Math ERROR (tan vô cực)');
          const v = Math.tan(r);
          return Math.abs(v) < 1e-14 ? 0 : v;
        }
        case 'asin':
          if (a0 < -1 || a0 > 1) throw new Error('Math ERROR');
          return this.fromRad(Math.asin(a0));
        case 'acos':
          if (a0 < -1 || a0 > 1) throw new Error('Math ERROR');
          return this.fromRad(Math.acos(a0));
        case 'atan':
          return this.fromRad(Math.atan(a0));
        case 'sinh':
          return Math.sinh(a0);
        case 'cosh':
          return Math.cosh(a0);
        case 'tanh':
          return Math.tanh(a0);
        case 'asinh':
          return Math.asinh(a0);
        case 'acosh':
          if (a0 < 1) throw new Error('Math ERROR');
          return Math.acosh(a0);
        case 'atanh':
          if (a0 <= -1 || a0 >= 1) throw new Error('Math ERROR');
          return Math.atanh(a0);
        case 'log':
          if (args.length === 2) {
            if (a0 <= 0 || a0 === 1 || a1 <= 0) throw new Error('Math ERROR');
            return Math.log(a1) / Math.log(a0);
          }
          if (a0 <= 0) throw new Error('Math ERROR');
          return Math.log10(a0);
        case 'logbase':
          if (a0 <= 0 || a0 === 1 || a1 <= 0) throw new Error('Math ERROR');
          return Math.log(a1) / Math.log(a0);
        case 'ln':
          if (a0 <= 0) throw new Error('Math ERROR');
          return Math.log(a0);
        case 'exp':
          return Math.exp(a0);
        case 'sqrt':
          if (a0 < 0) throw new Error('Math ERROR');
          return Math.sqrt(a0);
        case 'cbrt':
          return Math.cbrt(a0);
        case 'nroot':
          if (a0 === 0) throw new Error('Math ERROR');
          if (a1 < 0 && Math.abs(a0 % 2) === 1) return -Math.pow(-a1, 1 / a0);
          if (a1 < 0) throw new Error('Math ERROR');
          return Math.pow(a1, 1 / a0);
        case 'abs':
          return Math.abs(a0);
        case 'int':
          return Math.trunc(a0);
        case 'intg':
        case 'floor':
          return Math.floor(a0);
        case 'ceil':
          return Math.ceil(a0);
        case 'round':
        case 'rnd':
          return Math.round(a0);
        case 'sign':
          return Math.sign(a0);
        case 'npr': {
          const n = Math.round(a0);
          const r = Math.round(a1);
          if (n < 0 || r < 0 || r > n) throw new Error('Math ERROR');
          let p = 1;
          for (let i = 0; i < r; i++) p *= n - i;
          return p;
        }
        case 'ncr': {
          const n = Math.round(a0);
          const r = Math.round(a1);
          if (n < 0 || r < 0 || r > n) throw new Error('Math ERROR');
          const k = Math.min(r, n - r);
          let c = 1;
          for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
          return Math.round(c);
        }
        case 'gcd':
          return gcdInt(a0, a1);
        case 'lcm':
          return lcmInt(a0, a1);
        case 'ran':
          return Number(Math.random().toFixed(3));
        case 'ranint': {
          const lo = Math.ceil(Math.min(a0, a1));
          const hi = Math.floor(Math.max(a0, a1));
          return Math.floor(Math.random() * (hi - lo + 1)) + lo;
        }
        case 'min':
          return Math.min(...args);
        case 'max':
          return Math.max(...args);
        case 'dms':
          return (a0 || 0) + (a1 || 0) / 60 + (a2 || 0) / 3600;
        case 'pol': {
          const r = Math.hypot(a0, a1);
          const th = this.fromRad(Math.atan2(a1, a0));
          this.vars.X = r;
          this.vars.Y = th;
          return `r=${formatDecimalNumber(r)}, θ=${formatDecimalNumber(th)}`;
        }
        case 'rec': {
          const x = a0 * Math.cos(this.toRad(a1));
          const y = a0 * Math.sin(this.toRad(a1));
          this.vars.X = x;
          this.vars.Y = y;
          return `X=${formatDecimalNumber(x)}, Y=${formatDecimalNumber(y)}`;
        }
        case 'divr': {
          const a = Math.trunc(a0);
          const b = Math.trunc(a1);
          if (b === 0) throw new Error('Math ERROR');
          const q = Math.trunc(a / b);
          const rem = a - q * b;
          return `Q=${q}, R=${rem}`;
        }
        case 'fact':
          return primeFactorize(a0);
        default:
          throw new Error(`Hàm chưa hỗ trợ: ${fn}`);
      }
    }

    splitTopLevelArgs(inner) {
      const parts = [];
      let depth = 0;
      let start = 0;
      for (let i = 0; i < inner.length; i++) {
        const ch = inner[i];
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) {
          parts.push(inner.slice(start, i).trim());
          start = i + 1;
        }
      }
      parts.push(inner.slice(start).trim());
      return parts;
    }

    tryEvaluateSpecialMacro(raw, localScope) {
      // Phép chia có dư dạng "17 ÷R 5"
      const divRMatch = raw.match(/^(.+?)\s*÷R\s*(.+)$/);
      if (divRMatch) {
        const a = Math.trunc(this.evaluate(divRMatch[1], localScope));
        const b = Math.trunc(this.evaluate(divRMatch[2], localScope));
        if (b === 0) throw new Error('Math ERROR');
        const q = Math.trunc(a / b);
        const rem = a - q * b;
        return { text: `Q = ${q}, R = ${rem}`, numeric: q };
      }

      // Tích phân số: ∫(f(x), a, b)
      const intMatch = raw.match(/^(?:∫|integral)\(([\s\S]+)\)$/i);
      if (intMatch) {
        const args = this.splitTopLevelArgs(intMatch[1]);
        if (args.length !== 3) throw new Error('Cú pháp: ∫(f(x), a, b)');
        const fnExpr = args[0];
        const a = this.evaluate(args[1], localScope);
        const b = this.evaluate(args[2], localScope);
        return this.computeIntegral(fnExpr, a, b, localScope);
      }

      // Đạo hàm tại điểm: d/dx(f(x), x0)
      const diffMatch = raw.match(/^(?:d\/dx|diff)\(([\s\S]+)\)$/i);
      if (diffMatch) {
        const args = this.splitTopLevelArgs(diffMatch[1]);
        if (args.length !== 2) throw new Error('Cú pháp: d/dx(f(x), x0)');
        const fnExpr = args[0];
        const x0 = this.evaluate(args[1], localScope);
        return this.computeDerivative(fnExpr, x0, localScope);
      }

      // Tổng Sigma: ∑(f(x), start, end)
      const sumMatch = raw.match(/^(?:∑|sum)\(([\s\S]+)\)$/i);
      if (sumMatch) {
        const args = this.splitTopLevelArgs(sumMatch[1]);
        if (args.length !== 3) throw new Error('Cú pháp: ∑(f(x), đầu, cuối)');
        const fnExpr = args[0];
        const s0 = Math.round(this.evaluate(args[1], localScope));
        const s1 = Math.round(this.evaluate(args[2], localScope));
        if (s1 - s0 > 100000) throw new Error('Giới hạn tổng tối đa 100.000 hạng tử');
        let acc = 0;
        for (let k = s0; k <= s1; k++) {
          acc += this.evaluate(fnExpr, { ...localScope, x: k, X: k });
        }
        return acc;
      }

      // Tích Pi: ∏(f(x), start, end)
      const prodMatch = raw.match(/^(?:∏|prod)\(([\s\S]+)\)$/i);
      if (prodMatch) {
        const args = this.splitTopLevelArgs(prodMatch[1]);
        if (args.length !== 3) throw new Error('Cú pháp: ∏(f(x), đầu, cuối)');
        const fnExpr = args[0];
        const s0 = Math.round(this.evaluate(args[1], localScope));
        const s1 = Math.round(this.evaluate(args[2], localScope));
        if (s1 - s0 > 50000) throw new Error('Giới hạn tích tối đa 50.000 hạng tử');
        let acc = 1;
        for (let k = s0; k <= s1; k++) {
          acc *= this.evaluate(fnExpr, { ...localScope, x: k, X: k });
        }
        return acc;
      }

      // SHIFT+CALC SOLVE: SOLVE(lhs = rhs, x0) hoặc SOLVE(f(x), x0)
      const solveMatch = raw.match(/^SOLVE\(([\s\S]+)\)$/i);
      if (solveMatch) {
        const args = this.splitTopLevelArgs(solveMatch[1]);
        const eqStr = args[0];
        const guess = args.length >= 2 ? this.evaluate(args[1], localScope) : 1;
        const root = this.solveNumericEquation(eqStr, guess, localScope);
        this.vars.X = root;
        return { text: `X = ${formatDecimalNumber(root)}`, numeric: root };
      }

      return undefined;
    }

    computeIntegral(expr, a, b, localScope = {}) {
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Math ERROR');
      if (a === b) return 0;
      const n = 400; // Simpson ghép 400 đoạn (độ chính xác cực cao, <2ms)
      const h = (b - a) / n;
      const f = (x) => this.evaluate(expr, { ...localScope, x, X: x });
      let sum = f(a) + f(b);
      for (let i = 1; i < n; i++) {
        const x = a + i * h;
        sum += (i % 2 === 0 ? 2 : 4) * f(x);
      }
      return (sum * h) / 3;
    }

    computeDerivative(expr, x0, localScope = {}) {
      const h = 1e-5 * Math.max(1, Math.abs(x0));
      const f = (x) => this.evaluate(expr, { ...localScope, x, X: x });
      // Sai phân trung tâm 5 điểm O(h^4)
      const val = (-f(x0 + 2 * h) + 8 * f(x0 + h) - 8 * f(x0 - h) + f(x0 - 2 * h)) / (12 * h);
      return Math.abs(val) < 1e-12 ? 0 : val;
    }

    solveNumericEquation(eqStr, initialGuess = 1, localScope = {}) {
      let fExpr = eqStr;
      if (eqStr.includes('=')) {
        const parts = eqStr.split('=');
        fExpr = `(${parts[0]}) - (${parts[1]})`;
      }
      const f = (x) => this.evaluate(fExpr, { ...localScope, x, X: x });
      const df = (x) => {
        const h = 1e-6 * Math.max(1, Math.abs(x));
        return (f(x + h) - f(x - h)) / (2 * h);
      };

      const tries = [initialGuess, 0, 1, -1, 2, -2, 5, -5, 10, -10];
      for (let t = 0; t < tries.length; t++) {
        let x = tries[t];
        for (let iter = 0; iter < 80; iter++) {
          let fx;
          try {
            fx = f(x);
          } catch (_e) {
            break;
          }
          if (!Number.isFinite(fx)) break;
          if (Math.abs(fx) < 1e-11) return Math.abs(x) < 1e-12 ? 0 : x;
          let dfx;
          try {
            dfx = df(x);
          } catch (_e2) {
            break;
          }
          if (!Number.isFinite(dfx) || Math.abs(dfx) < 1e-14) {
            x += 0.17;
            continue;
          }
          const step = fx / dfx;
          x -= step;
          if (Math.abs(step) < 1e-11 && Math.abs(f(x)) < 1e-8) {
            return Math.abs(x) < 1e-12 ? 0 : x;
          }
        }
      }
      throw new Error('Can’t Solve (Không tìm thấy nghiệm gần điểm thử)');
    }
  }

  // ==========================================================================
  // PHẦN 4: CÁC CHẾ ĐỘ CHUYÊN SÂU CỦA FX-570VN PLUS (CMPLX, STAT, BASE, EQN,
  // INEQ, MATRIX, TABLE, VECTOR)
  // ==========================================================================
  class ComplexEngine {
    static add(a, b) {
      return { re: a.re + b.re, im: a.im + b.im };
    }
    static sub(a, b) {
      return { re: a.re - b.re, im: a.im - b.im };
    }
    static mul(a, b) {
      return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
    }
    static div(a, b) {
      const den = b.re * b.re + b.im * b.im;
      if (den === 0) throw new Error('Math ERROR (Chia cho 0)');
      return {
        re: (a.re * b.re + a.im * b.im) / den,
        im: (a.im * b.re - a.re * b.im) / den
      };
    }
    static pow(a, n) {
      const r = Math.hypot(a.re, a.im);
      const th = Math.atan2(a.im, a.re);
      const rn = Math.pow(r, n);
      return { re: rn * Math.cos(th * n), im: rn * Math.sin(th * n) };
    }
    static format(c, angleUnit = 'DEG', polar = false) {
      const re = Math.abs(c.re) < 1e-11 ? 0 : c.re;
      const im = Math.abs(c.im) < 1e-11 ? 0 : c.im;
      if (polar) {
        const r = Math.hypot(re, im);
        let th = Math.atan2(im, re);
        if (angleUnit === 'DEG') th = (th * 180) / Math.PI;
        else if (angleUnit === 'GRA') th = (th * 200) / Math.PI;
        return `${formatDecimalNumber(r)} ∠ ${formatDecimalNumber(th)}${angleUnit === 'DEG' ? '°' : ''}`;
      }
      if (im === 0) return formatDecimalNumber(re);
      const imAbs = Math.abs(im);
      const imStr = Math.abs(imAbs - 1) < 1e-11 ? 'i' : `${formatDecimalNumber(imAbs)}i`;
      if (re === 0) return im < 0 ? `-${imStr}` : imStr;
      return `${formatDecimalNumber(re)} ${im < 0 ? '−' : '+'} ${imStr}`;
    }
    static evaluate(exprStr, angleUnit = 'DEG') {
      const s = String(exprStr || '')
        .trim()
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/∠/g, '@');
      if (!s) return { re: 0, im: 0 };

      // Tokenizer số phức hỗ trợ (a+bi), r∠θ, Conjg(z), Abs(z), arg(z)
      const tokens = [];
      let i = 0;
      while (i < s.length) {
        const ch = s[i];
        if (/\s/.test(ch)) {
          i++;
          continue;
        }
        if (/[0-9.]/.test(ch)) {
          let st = i;
          i++;
          while (i < s.length && /[0-9.]/.test(s[i])) i++;
          tokens.push({ type: 'NUM', value: parseFloat(s.slice(st, i)) });
          continue;
        }
        if (/[a-zA-Z]/.test(ch)) {
          let st = i;
          i++;
          while (i < s.length && /[a-zA-Z0-9]/.test(s[i])) i++;
          tokens.push({ type: 'ID', value: s.slice(st, i) });
          continue;
        }
        if ('+-*/^()@'.includes(ch)) {
          tokens.push({ type: 'OP', value: ch });
          i++;
          continue;
        }
        throw new Error(`Ký tự số phức không hợp lệ: ${ch}`);
      }

      // Nhân ngầm định: 3i -> 3*i, (1+i)(2-i) -> (1+i)*(2-i)
      const norm = [];
      const fns = new Set(['abs', 'arg', 'conjg', 're', 'im']);
      for (let k = 0; k < tokens.length; k++) {
        const c = tokens[k];
        if (norm.length > 0) {
          const p = norm[norm.length - 1];
          const pVal = p.type === 'NUM' || (p.type === 'ID' && !fns.has(p.value.toLowerCase())) || (p.type === 'OP' && p.value === ')');
          const cVal = c.type === 'NUM' || c.type === 'ID' || (c.type === 'OP' && c.value === '(');
          if (pVal && cVal) norm.push({ type: 'OP', value: '*' });
        }
        norm.push(c);
      }

      let pos = 0;
      const peek = () => norm[pos] || null;
      const take = () => norm[pos++];

      const parseAdd = () => {
        let left = parseMul();
        while (peek() && peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
          const op = take().value;
          const right = parseMul();
          left = op === '+' ? ComplexEngine.add(left, right) : ComplexEngine.sub(left, right);
        }
        return left;
      };
      const parseMul = () => {
        let left = parseUnary();
        while (peek() && peek().type === 'OP' && (peek().value === '*' || peek().value === '/')) {
          const op = take().value;
          const right = parseUnary();
          left = op === '*' ? ComplexEngine.mul(left, right) : ComplexEngine.div(left, right);
        }
        return left;
      };
      const parseUnary = () => {
        if (peek() && peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
          const op = take().value;
          const v = parseUnary();
          return op === '-' ? { re: -v.re, im: -v.im } : v;
        }
        return parsePow();
      };
      const parsePow = () => {
        let base = parsePolar();
        if (peek() && peek().type === 'OP' && peek().value === '^') {
          take();
          const exp = parseUnary();
          base = ComplexEngine.pow(base, exp.re);
        }
        return base;
      };
      const parsePolar = () => {
        let mag = parseAtom();
        if (peek() && peek().type === 'OP' && peek().value === '@') {
          take();
          const ang = parseUnary();
          let rad = ang.re;
          if (angleUnit === 'DEG') rad = (rad * Math.PI) / 180;
          else if (angleUnit === 'GRA') rad = (rad * Math.PI) / 200;
          return { re: mag.re * Math.cos(rad), im: mag.re * Math.sin(rad) };
        }
        return mag;
      };
      const parseAtom = () => {
        const t = peek();
        if (!t) throw new Error('Syntax ERROR');
        if (t.type === 'NUM') {
          take();
          return { re: t.value, im: 0 };
        }
        if (t.type === 'OP' && t.value === '(') {
          take();
          const v = parseAdd();
          if (!peek() || peek().value !== ')') throw new Error('Thiếu )');
          take();
          return v;
        }
        if (t.type === 'ID') {
          take();
          const low = t.value.toLowerCase();
          if (low === 'i') return { re: 0, im: 1 };
          if (low === 'pi') return { re: Math.PI, im: 0 };
          if (low === 'e') return { re: Math.E, im: 0 };
          if (peek() && peek().value === '(') {
            take();
            const v = parseAdd();
            if (!peek() || peek().value !== ')') throw new Error('Thiếu )');
            take();
            if (low === 'abs') return { re: Math.hypot(v.re, v.im), im: 0 };
            if (low === 'conjg') return { re: v.re, im: -v.im };
            if (low === 're') return { re: v.re, im: 0 };
            if (low === 'im') return { re: v.im, im: 0 };
            if (low === 'arg') {
              let rad = Math.atan2(v.im, v.re);
              if (angleUnit === 'DEG') rad = (rad * 180) / Math.PI;
              else if (angleUnit === 'GRA') rad = (rad * 200) / Math.PI;
              return { re: rad, im: 0 };
            }
          }
          throw new Error(`Không hỗ trợ: ${t.value}`);
        }
        throw new Error('Syntax ERROR');
      };

      return parseAdd();
    }
  }

  class EqnAndIneqEngine {
    static solveLinear2(a1, b1, c1, a2, b2, c2) {
      const D = a1 * b2 - a2 * b1;
      const Dx = c1 * b2 - c2 * b1;
      const Dy = a1 * c2 - a2 * c1;
      if (Math.abs(D) < 1e-12) {
        if (Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12) {
          return { status: 'INFINITE', lines: ['Hệ có vô số nghiệm (Infinite Solutions)'] };
        }
        return { status: 'NO_SOLUTION', lines: ['Hệ vô nghiệm (No Solution)'] };
      }
      const x = Dx / D;
      const y = Dy / D;
      return {
        status: 'OK',
        x,
        y,
        lines: [
          `X = ${formatExactSymbolic(x) || formatDecimalNumber(x)} (${formatDecimalNumber(x)})`,
          `Y = ${formatExactSymbolic(y) || formatDecimalNumber(y)} (${formatDecimalNumber(y)})`
        ]
      };
    }

    static solveLinear3(rows) {
      // rows: [[a1,b1,c1,d1], [a2,b2,c2,d2], [a3,b3,c3,d3]]
      const m = rows.map((r) => r.map(Number));
      for (let col = 0; col < 3; col++) {
        let pivot = col;
        for (let r = col + 1; r < 3; r++) {
          if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
        }
        if (Math.abs(m[pivot][col]) < 1e-12) {
          return { status: 'SINGULAR', lines: ['Định thức D = 0 (Vô nghiệm hoặc Vô số nghiệm)'] };
        }
        [m[col], m[pivot]] = [m[pivot], m[col]];
        const div = m[col][col];
        for (let j = col; j < 4; j++) m[col][j] /= div;
        for (let r = 0; r < 3; r++) {
          if (r === col) continue;
          const f = m[r][col];
          for (let j = col; j < 4; j++) m[r][j] -= f * m[col][j];
        }
      }
      const x = m[0][3];
      const y = m[1][3];
      const z = m[2][3];
      return {
        status: 'OK',
        x,
        y,
        z,
        lines: [
          `X = ${formatExactSymbolic(x) || formatDecimalNumber(x)} (${formatDecimalNumber(x)})`,
          `Y = ${formatExactSymbolic(y) || formatDecimalNumber(y)} (${formatDecimalNumber(y)})`,
          `Z = ${formatExactSymbolic(z) || formatDecimalNumber(z)} (${formatDecimalNumber(z)})`
        ]
      };
    }

    static solveQuadratic(a, b, c) {
      if (Math.abs(a) < 1e-14) {
        if (Math.abs(b) < 1e-14) {
          return { status: 'DEGENERATE', lines: [Math.abs(c) < 1e-14 ? 'Vô số nghiệm (0 = 0)' : 'Vô nghiệm'] };
        }
        const x = -c / b;
        return { status: 'LINEAR', roots: [x], lines: [`X = ${formatExactSymbolic(x) || formatDecimalNumber(x)}`] };
      }
      const delta = b * b - 4 * a * c;
      const vx = -b / (2 * a);
      const vy = a * vx * vx + b * vx + c;
      const extremumLabel = a > 0 ? 'Đỉnh cực tiểu (Min)' : 'Đỉnh cực đại (Max)';

      if (delta > 1e-12) {
        const sq = Math.sqrt(delta);
        const x1 = (-b + sq) / (2 * a);
        const x2 = (-b - sq) / (2 * a);
        return {
          status: 'TWO_REAL',
          delta,
          roots: [x1, x2],
          vertex: { x: vx, y: vy },
          lines: [
            `Δ = ${formatDecimalNumber(delta)} > 0`,
            `X₁ = ${formatExactSymbolic(x1) || formatDecimalNumber(x1)} (${formatDecimalNumber(x1)})`,
            `X₂ = ${formatExactSymbolic(x2) || formatDecimalNumber(x2)} (${formatDecimalNumber(x2)})`,
            `${extremumLabel}: X = ${formatDecimalNumber(vx)}, Y = ${formatDecimalNumber(vy)}`
          ]
        };
      }
      if (Math.abs(delta) <= 1e-12) {
        return {
          status: 'DOUBLE_REAL',
          delta: 0,
          roots: [vx],
          vertex: { x: vx, y: vy },
          lines: [
            'Δ = 0 (Nghiệm kép)',
            `X₁ = X₂ = ${formatExactSymbolic(vx) || formatDecimalNumber(vx)} (${formatDecimalNumber(vx)})`,
            `${extremumLabel}: (${formatDecimalNumber(vx)}, ${formatDecimalNumber(vy)})`
          ]
        };
      }
      const im = Math.sqrt(-delta) / (2 * Math.abs(a));
      return {
        status: 'COMPLEX',
        delta,
        roots: [],
        complexRoots: [
          { re: vx, im },
          { re: vx, im: -im }
        ],
        vertex: { x: vx, y: vy },
        lines: [
          `Δ = ${formatDecimalNumber(delta)} < 0 (Nghiệm phức)`,
          `X₁ = ${ComplexEngine.format({ re: vx, im })}`,
          `X₂ = ${ComplexEngine.format({ re: vx, im: -im })}`,
          `${extremumLabel}: X = ${formatDecimalNumber(vx)}, Y = ${formatDecimalNumber(vy)}`
        ]
      };
    }

    static solveCubic(a, b, c, d) {
      if (Math.abs(a) < 1e-14) return EqnAndIneqEngine.solveQuadratic(b, c, d);
      // Đưa về t³ + pt + q = 0 với x = t - b/(3a)
      const p = (3 * a * c - b * b) / (3 * a * a);
      const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
      const shift = -b / (3 * a);
      const disc = (q * q) / 4 + (p * p * p) / 27;

      if (disc > 1e-12) {
        const s = Math.sqrt(disc);
        const u = Math.cbrt(-q / 2 + s);
        const v = Math.cbrt(-q / 2 - s);
        const x1 = u + v + shift;
        const re = -(u + v) / 2 + shift;
        const im = ((u - v) * Math.sqrt(3)) / 2;
        return {
          status: 'ONE_REAL_TWO_COMPLEX',
          roots: [x1],
          lines: [
            `X₁ = ${formatExactSymbolic(x1) || formatDecimalNumber(x1)} (${formatDecimalNumber(x1)})`,
            `X₂ = ${ComplexEngine.format({ re, im })}`,
            `X₃ = ${ComplexEngine.format({ re, im: -im })}`
          ]
        };
      }
      if (Math.abs(disc) <= 1e-12) {
        if (Math.abs(p) < 1e-12 && Math.abs(q) < 1e-12) {
          return {
            status: 'TRIPLE_REAL',
            roots: [shift],
            lines: [`X₁ = X₂ = X₃ = ${formatExactSymbolic(shift) || formatDecimalNumber(shift)}`]
          };
        }
        const u = Math.cbrt(-q / 2);
        const x1 = 2 * u + shift;
        const x2 = -u + shift;
        return {
          status: 'DOUBLE_REAL',
          roots: [x1, x2].sort((m, n) => m - n),
          lines: [
            `X₁ = ${formatExactSymbolic(x1) || formatDecimalNumber(x1)} (${formatDecimalNumber(x1)})`,
            `X₂ = X₃ = ${formatExactSymbolic(x2) || formatDecimalNumber(x2)} (${formatDecimalNumber(x2)})`
          ]
        };
      }
      // 3 nghiệm thực phân biệt (Viète lượng giác)
      const r = 2 * Math.sqrt(-p / 3);
      const cosPhi = Math.max(-1, Math.min(1, (-q / 2) / Math.sqrt((-p * p * p) / 27)));
      const phi = Math.acos(cosPhi);
      const x1 = r * Math.cos(phi / 3) + shift;
      const x2 = r * Math.cos((phi + 2 * Math.PI) / 3) + shift;
      const x3 = r * Math.cos((phi + 4 * Math.PI) / 3) + shift;
      const sorted = [x1, x2, x3].sort((m, n) => m - n);
      return {
        status: 'THREE_REAL',
        roots: sorted,
        lines: [
          `X₁ = ${formatExactSymbolic(sorted[0]) || formatDecimalNumber(sorted[0])} (${formatDecimalNumber(sorted[0])})`,
          `X₂ = ${formatExactSymbolic(sorted[1]) || formatDecimalNumber(sorted[1])} (${formatDecimalNumber(sorted[1])})`,
          `X₃ = ${formatExactSymbolic(sorted[2]) || formatDecimalNumber(sorted[2])} (${formatDecimalNumber(sorted[2])})`
        ]
      };
    }

    static solveInequality(degree, op, coeffs) {
      // op: '>' | '<' | '>=' | '<='
      const f =
        degree === 2
          ? (x) => coeffs[0] * x * x + coeffs[1] * x + coeffs[2]
          : (x) => coeffs[0] * x * x * x + coeffs[1] * x * x + coeffs[2] * x + coeffs[3];
      const eqRes =
        degree === 2
          ? EqnAndIneqEngine.solveQuadratic(coeffs[0], coeffs[1], coeffs[2])
          : EqnAndIneqEngine.solveCubic(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);

      const rawRoots = Array.isArray(eqRes.roots) ? eqRes.roots.slice().sort((m, n) => m - n) : [];
      const roots = [];
      for (let i = 0; i < rawRoots.length; i++) {
        if (roots.length === 0 || Math.abs(rawRoots[i] - roots[roots.length - 1]) > 1e-8) {
          roots.push(rawRoots[i]);
        }
      }

      const inclusive = op === '>=' || op === '<=';
      const wantPos = op === '>' || op === '>=';
      const checkVal = (v) => (wantPos ? (inclusive ? v >= -1e-10 : v > 1e-10) : inclusive ? v <= 1e-10 : v < -1e-10);

      // Tạo các khoảng kiểm thử (-∞, r0), (r0, r1), ..., (rk, +∞)
      const intervals = [];
      const points = [-Infinity, ...roots, Infinity];
      for (let i = 0; i < points.length - 1; i++) {
        const lo = points[i];
        const hi = points[i + 1];
        let sample;
        if (lo === -Infinity && hi === Infinity) sample = 0;
        else if (lo === -Infinity) sample = hi - 1;
        else if (hi === Infinity) sample = lo + 1;
        else sample = (lo + hi) / 2;

        if (checkVal(f(sample))) {
          intervals.push({ lo, hi });
        }
      }

      // Gộp các khoảng liền nhau khi dấu có '='
      const merged = [];
      for (let i = 0; i < intervals.length; i++) {
        const cur = intervals[i];
        if (inclusive && merged.length > 0 && merged[merged.length - 1].hi === cur.lo) {
          merged[merged.length - 1].hi = cur.hi;
        } else {
          merged.push({ ...cur });
        }
      }

      // Kiểm tra nghiệm đơn lẻ khi inclusive (ví dụ x² <= 0 -> x = 0)
      const isolatedRoots = [];
      if (inclusive) {
        for (let i = 0; i < roots.length; i++) {
          const r = roots[i];
          const inInterval = merged.some((iv) => r >= iv.lo && r <= iv.hi);
          if (!inInterval) isolatedRoots.push(r);
        }
      }

      if (merged.length === 1 && merged[0].lo === -Infinity && merged[0].hi === Infinity) {
        return { text: 'Tất cả số thực (All Real Numbers: x ∈ ℝ)', intervals: merged };
      }
      if (merged.length === 0 && isolatedRoots.length === 0) {
        return { text: 'Vô nghiệm (No Solution: x ∈ ∅)', intervals: [] };
      }

      const lt = inclusive ? '≤' : '<';
      const gt = inclusive ? '≥' : '>';
      const fmt = (v) => formatExactSymbolic(v) || formatDecimalNumber(v);
      const parts = merged.map((iv) => {
        if (iv.lo === -Infinity) return `x ${lt} ${fmt(iv.hi)}`;
        if (iv.hi === Infinity) return `x ${gt} ${fmt(iv.lo)}`;
        return `${fmt(iv.lo)} ${lt} x ${lt} ${fmt(iv.hi)}`;
      });
      for (let i = 0; i < isolatedRoots.length; i++) {
        parts.push(`x = ${fmt(isolatedRoots[i])}`);
      }
      return { text: parts.join(' ,  '), intervals: merged };
    }
  }

  class MatrixAndVectorEngine {
    static det(m) {
      const n = m.length;
      if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
      if (n === 3) {
        return (
          m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
          m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
          m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
        );
      }
      throw new Error('Chỉ hỗ trợ ma trận vuông 2×2 và 3×3');
    }

    static transpose(m) {
      return m[0].map((_, c) => m.map((row) => row[c]));
    }

    static add(a, b, sign = 1) {
      return a.map((row, r) => row.map((v, c) => v + sign * b[r][c]));
    }

    static multiply(a, b) {
      const n = a.length;
      const out = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          let sum = 0;
          for (let k = 0; k < n; k++) sum += a[i][k] * b[k][j];
          out[i][j] = sum;
        }
      }
      return out;
    }

    static inverse(m) {
      const d = MatrixAndVectorEngine.det(m);
      if (Math.abs(d) < 1e-12) throw new Error('Math ERROR (det = 0, không khả nghịch)');
      if (m.length === 2) {
        return [
          [m[1][1] / d, -m[0][1] / d],
          [-m[1][0] / d, m[0][0] / d]
        ];
      }
      // 3×3 adjugate / det
      const cof = Array.from({ length: 3 }, () => Array(3).fill(0));
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const sub = [];
          for (let i = 0; i < 3; i++) {
            if (i === r) continue;
            const row = [];
            for (let j = 0; j < 3; j++) if (j !== c) row.push(m[i][j]);
            sub.push(row);
          }
          const minor = sub[0][0] * sub[1][1] - sub[0][1] * sub[1][0];
          cof[c][r] = ((r + c) % 2 === 0 ? 1 : -1) * (minor / d);
        }
      }
      return cof;
    }

    static computeVector(op, a, b, angleUnit = 'DEG') {
      const vA = a.map(Number);
      const vB = b.map(Number);
      if (op === 'ADD') return { label: 'VctA + VctB', vec: vA.map((v, i) => v + vB[i]) };
      if (op === 'SUB') return { label: 'VctA − VctB', vec: vA.map((v, i) => v - vB[i]) };
      if (op === 'DOT') {
        const dot = vA.reduce((s, v, i) => s + v * vB[i], 0);
        return { label: 'VctA · VctB (Tích vô hướng)', scalar: dot };
      }
      if (op === 'CROSS') {
        const a3 = [vA[0] || 0, vA[1] || 0, vA[2] || 0];
        const b3 = [vB[0] || 0, vB[1] || 0, vB[2] || 0];
        return {
          label: 'VctA × VctB (Tích có hướng)',
          vec: [
            a3[1] * b3[2] - a3[2] * b3[1],
            a3[2] * b3[0] - a3[0] * b3[2],
            a3[0] * b3[1] - a3[1] * b3[0]
          ]
        };
      }
      if (op === 'MAG_A') {
        return { label: '|VctA| (Độ dài)', scalar: Math.hypot(...vA) };
      }
      if (op === 'ANGLE') {
        const magA = Math.hypot(...vA);
        const magB = Math.hypot(...vB);
        if (magA === 0 || magB === 0) throw new Error('Math ERROR (Vectơ không)');
        const dot = vA.reduce((s, v, i) => s + v * vB[i], 0);
        const rad = Math.acos(Math.max(-1, Math.min(1, dot / (magA * magB))));
        const deg = angleUnit === 'DEG' ? (rad * 180) / Math.PI : angleUnit === 'GRA' ? (rad * 200) / Math.PI : rad;
        return { label: `∠(VctA, VctB) [${angleUnit}]`, scalar: deg };
      }
      throw new Error('Phép toán vectơ không hợp lệ');
    }
  }

  class StatEngine {
    static compute(rows, isTwoVar = false) {
      const valid = rows
        .map((r) => ({ x: Number(r.x), y: Number(r.y), f: r.f == null || r.f === '' ? 1 : Number(r.f) }))
        .filter((r) => Number.isFinite(r.x) && Number.isFinite(r.f) && r.f > 0 && (!isTwoVar || Number.isFinite(r.y)));
      if (valid.length === 0) throw new Error('Chưa có dữ liệu thống kê hợp lệ');

      let n = 0;
      let sumX = 0;
      let sumX2 = 0;
      let sumY = 0;
      let sumY2 = 0;
      let sumXY = 0;
      const expandedX = [];

      for (let i = 0; i < valid.length; i++) {
        const { x, y, f } = valid[i];
        n += f;
        sumX += x * f;
        sumX2 += x * x * f;
        if (isTwoVar) {
          sumY += y * f;
          sumY2 += y * y * f;
          sumXY += x * y * f;
        }
        const repeat = Math.min(200, Math.round(f));
        for (let k = 0; k < repeat; k++) expandedX.push(x);
      }

      const meanX = sumX / n;
      const varPopX = Math.max(0, sumX2 / n - meanX * meanX);
      const sdPopX = Math.sqrt(varPopX);
      const sdSampleX = n > 1 ? Math.sqrt((varPopX * n) / (n - 1)) : 0;

      expandedX.sort((a, b) => a - b);
      const percentile = (arr, p) => {
        if (!arr.length) return 0;
        const idx = (arr.length - 1) * p;
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
      };

      const out = {
        n,
        sumX,
        sumX2,
        meanX,
        sdPopX,
        sdSampleX,
        minX: expandedX[0],
        q1: percentile(expandedX, 0.25),
        med: percentile(expandedX, 0.5),
        q3: percentile(expandedX, 0.75),
        maxX: expandedX[expandedX.length - 1]
      };

      if (isTwoVar) {
        const meanY = sumY / n;
        const sxx = sumX2 - (sumX * sumX) / n;
        const syy = sumY2 - (sumY * sumY) / n;
        const sxy = sumXY - (sumX * sumY) / n;
        const regB = Math.abs(sxx) > 1e-14 ? sxy / sxx : 0;
        const regA = meanY - regB * meanX;
        const corrR = sxx > 1e-14 && syy > 1e-14 ? sxy / Math.sqrt(sxx * syy) : 0;
        out.meanY = meanY;
        out.sumY = sumY;
        out.sumXY = sumXY;
        out.regA = regA;
        out.regB = regB;
        out.corrR = corrR;
      }
      return out;
    }
  }

  class BaseNEngine {
    static parseInBase(raw, base) {
      const clean = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!clean) return 0;
      const val = parseInt(clean, base);
      if (Number.isNaN(val)) throw new Error(`Giá trị không hợp lệ ở hệ cơ số ${base}`);
      return val | 0; // 32-bit signed giống Casio fx-570
    }
    static convertAll(intVal) {
      const signed = intVal | 0;
      const unsigned = signed >>> 0;
      return {
        dec: String(signed),
        hex: unsigned.toString(16).toUpperCase(),
        bin: unsigned.toString(2),
        oct: unsigned.toString(8)
      };
    }
  }

  // ==========================================================================
  // PHẦN 5: ĐỘNG CƠ ĐỒ THỊ HÀM SỐ KIỂU DESMOS (100% LOCAL HTML5 CANVAS 60FPS)
  // ==========================================================================
  class DesmosGraphEngine {
    constructor(mathEngine) {
      this.math = mathEngine;
      this.canvas = null;
      this.ctx = null;
      this.viewport = { xMin: -10, xMax: 10, yMin: -6.5, yMax: 6.5 };
      this.darkMode = false;
      this.showGrid = true;
      this.showMinorGrid = true;
      this.showAxes = true;
      this.expressions = [
        { id: 'expr_1', expr: 'y = sin(x)', color: DESMOS_COLORS[0], visible: true },
        { id: 'expr_2', expr: 'y = 0.25*x^2 - 2', color: DESMOS_COLORS[1], visible: true }
      ];
      this.sliders = {}; // { a: { val: 1, min: -10, max: 10, step: 0.1, playing: false, dir: 1 } }
      this.specialPoints = []; // { x, y, kind, color, label }
      this.hoverInfo = null; // { x, y, sx, sy, color, label }
      this.isDragging = false;
      this.dragStart = null;
      this.animFrameId = null;
      this.undoStack = [];
      this.redoStack = [];
      this._idCounter = 3;
      this._lastPinchDist = null;
    }

    pushHistory() {
      this.undoStack.push(JSON.stringify(this.expressions));
      if (this.undoStack.length > 40) this.undoStack.shift();
      this.redoStack = [];
    }

    undo() {
      if (!this.undoStack.length) return false;
      this.redoStack.push(JSON.stringify(this.expressions));
      this.expressions = JSON.parse(this.undoStack.pop());
      this.syncParametersFromExpressions();
      this.render();
      return true;
    }

    redo() {
      if (!this.redoStack.length) return false;
      this.undoStack.push(JSON.stringify(this.expressions));
      this.expressions = JSON.parse(this.redoStack.pop());
      this.syncParametersFromExpressions();
      this.render();
      return true;
    }

    getParamScope() {
      const scope = { ...this.math.vars };
      Object.keys(this.sliders).forEach((k) => {
        scope[k] = Number(this.sliders[k].val) || 0;
      });
      return scope;
    }

    parseExpressionSpec(rawStr) {
      const s = String(rawStr || '').trim();
      if (!s) return { kind: 'EMPTY' };

      // 1. Định nghĩa tham số trượt: "a = 2.5"
      const paramMatch = s.match(/^([a-zA-Z])\s*=\s*(-?[0-9.]+)$/);
      if (paramMatch && !['x', 'y', 'r', 'e'].includes(paramMatch[1].toLowerCase())) {
        return { kind: 'PARAM', name: paramMatch[1], value: parseFloat(paramMatch[2]) };
      }

      // 2. Phương trình tọa độ cực: "r = f(theta)"
      const polarMatch = s.match(/^r\s*=\s*(.+)$/i);
      if (polarMatch) {
        return { kind: 'POLAR', rhs: polarMatch[1].trim() };
      }

      // 3. Bất đẳng thức dạng y <= f(x), y < f(x), y >= f(x), y > f(x)
      const ineqYMatch = s.match(/^y\s*(<=|>=|<|>|≤|≥)\s*(.+)$/i);
      if (ineqYMatch) {
        const opMap = { '≤': '<=', '≥': '>=' };
        const op = opMap[ineqYMatch[1]] || ineqYMatch[1];
        return { kind: 'INEQ_Y', op, rhs: ineqYMatch[2].trim() };
      }

      // 4. Hàm hiển y = f(x) hoặc f(x) = ... hoặc g(x) = ...
      const explicitMatch = s.match(/^(?:y|[a-zA-Z][a-zA-Z0-9_]*\(\s*x\s*\))\s*=\s*(.+)$/i);
      if (explicitMatch && !/\by\b/i.test(explicitMatch[1])) {
        return { kind: 'EXPLICIT', rhs: explicitMatch[1].trim() };
      }

      // 5. Đường thẳng đứng x = c
      const vertMatch = s.match(/^x\s*=\s*(.+)$/i);
      if (vertMatch && !/\b[xy]\b/i.test(vertMatch[1])) {
        return { kind: 'VERTICAL', rhs: vertMatch[1].trim() };
      }

      // 6. Phương trình ẩn F(x, y) = G(x, y) (chứa cả x và y hoặc dấu '=' với y ở trong)
      if (s.includes('=')) {
        const parts = s.split('=');
        return { kind: 'IMPLICIT', lhs: parts[0].trim(), rhs: parts.slice(1).join('=').trim() };
      }

      // 7. Biểu thức trần chứa x (ví dụ sin(x) hoặc x^2 - 4) -> tự hiểu y = expr
      return { kind: 'EXPLICIT', rhs: s };
    }

    syncParametersFromExpressions() {
      const activeParams = new Set();
      for (let i = 0; i < this.expressions.length; i++) {
        const spec = this.parseExpressionSpec(this.expressions[i].expr);
        if (spec.kind === 'PARAM') {
          activeParams.add(spec.name);
          if (!this.sliders[spec.name]) {
            this.sliders[spec.name] = {
              val: spec.value,
              min: -10,
              max: 10,
              step: 0.1,
              playing: false,
              dir: 1
            };
          } else {
            this.sliders[spec.name].val = spec.value;
          }
        }
      }
      // Xóa slider không còn trong danh sách biểu thức
      Object.keys(this.sliders).forEach((k) => {
        if (!activeParams.has(k)) delete this.sliders[k];
      });
    }

    worldToScreen(wx, wy, w, h) {
      const { xMin, xMax, yMin, yMax } = this.viewport;
      const sx = ((wx - xMin) / (xMax - xMin)) * w;
      const sy = ((yMax - wy) / (yMax - yMin)) * h;
      return { sx, sy };
    }

    screenToWorld(sx, sy, w, h) {
      const { xMin, xMax, yMin, yMax } = this.viewport;
      const wx = xMin + (sx / w) * (xMax - xMin);
      const wy = yMax - (sy / h) * (yMax - yMin);
      return { wx, wy };
    }

    resetViewport() {
      this.viewport = { xMin: -10, xMax: 10, yMin: -6.5, yMax: 6.5 };
      this.aspectNormalize();
      this.render();
    }

    aspectNormalize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width > 40 && rect.height > 40) {
        const aspect = rect.height / rect.width;
        const cx = (this.viewport.xMin + this.viewport.xMax) / 2;
        const cy = (this.viewport.yMin + this.viewport.yMax) / 2;
        const halfW = (this.viewport.xMax - this.viewport.xMin) / 2;
        const halfH = halfW * aspect;
        this.viewport.yMin = cy - halfH;
        this.viewport.yMax = cy + halfH;
      }
    }

    zoomAt(factor, centerSx = null, centerSy = null) {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width || 600;
      const h = rect.height || 400;
      const sx = centerSx == null ? w / 2 : centerSx;
      const sy = centerSy == null ? h / 2 : centerSy;
      const { wx, wy } = this.screenToWorld(sx, sy, w, h);
      const { xMin, xMax, yMin, yMax } = this.viewport;
      const newXMin = wx - (wx - xMin) * factor;
      const newXMax = wx + (xMax - wx) * factor;
      const newYMin = wy - (wy - yMin) * factor;
      const newYMax = wy + (yMax - wy) * factor;
      if (newXMax - newXMin < 1e-6 || newXMax - newXMin > 1e7) return;
      this.viewport = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
      this.render();
    }

    computeNiceStep(span) {
      const raw = span / 9;
      const mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const norm = raw / mag;
      if (norm < 1.5) return 1 * mag;
      if (norm < 3.5) return 2 * mag;
      if (norm < 7.5) return 5 * mag;
      return 10 * mag;
    }

    attachCanvas(canvasEl) {
      this.canvas = canvasEl;
      if (!canvasEl) return;
      this.ctx = canvasEl.getContext('2d');
      this.aspectNormalize();

      const getLocalXY = (ev) => {
        const rect = canvasEl.getBoundingClientRect();
        return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top, w: rect.width, h: rect.height };
      };

      canvasEl.addEventListener(
        'wheel',
        (ev) => {
          ev.preventDefault();
          const { sx, sy } = getLocalXY(ev);
          const factor = ev.deltaY > 0 ? 1.15 : 0.87;
          this.zoomAt(factor, sx, sy);
        },
        { passive: false }
      );

      canvasEl.addEventListener('pointerdown', (ev) => {
        this.isDragging = true;
        const { sx, sy } = getLocalXY(ev);
        this.dragStart = { sx, sy, vp: { ...this.viewport } };
        try {
          canvasEl.setPointerCapture(ev.pointerId);
        } catch (_e) {}
      });

      canvasEl.addEventListener('pointermove', (ev) => {
        const { sx, sy, w, h } = getLocalXY(ev);
        if (this.isDragging && this.dragStart) {
          const dxPx = sx - this.dragStart.sx;
          const dyPx = sy - this.dragStart.sy;
          const xSpan = this.dragStart.vp.xMax - this.dragStart.vp.xMin;
          const ySpan = this.dragStart.vp.yMax - this.dragStart.vp.yMin;
          const dxW = (dxPx / Math.max(1, w)) * xSpan;
          const dyW = (dyPx / Math.max(1, h)) * ySpan;
          this.viewport = {
            xMin: this.dragStart.vp.xMin - dxW,
            xMax: this.dragStart.vp.xMax - dxW,
            yMin: this.dragStart.vp.yMin + dyW,
            yMax: this.dragStart.vp.yMax + dyW
          };
          this.hoverInfo = null;
          this.render();
          return;
        }
        this.updateHoverTrace(sx, sy, w, h);
      });

      const stopDrag = () => {
        this.isDragging = false;
        this.dragStart = null;
      };
      canvasEl.addEventListener('pointerup', stopDrag);
      canvasEl.addEventListener('pointercancel', stopDrag);
      canvasEl.addEventListener('pointerleave', () => {
        this.isDragging = false;
        this.hoverInfo = null;
        this.render();
      });

      // Hỗ trợ chụm 2 ngón phóng to/thu nhỏ trên điện thoại
      canvasEl.addEventListener(
        'touchmove',
        (ev) => {
          if (ev.touches && ev.touches.length === 2) {
            ev.preventDefault();
            const t0 = ev.touches[0];
            const t1 = ev.touches[1];
            const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
            if (this._lastPinchDist && dist > 10) {
              const factor = this._lastPinchDist / dist;
              const rect = canvasEl.getBoundingClientRect();
              const cx = (t0.clientX + t1.clientX) / 2 - rect.left;
              const cy = (t0.clientY + t1.clientY) / 2 - rect.top;
              this.zoomAt(Math.max(0.8, Math.min(1.25, factor)), cx, cy);
            }
            this._lastPinchDist = dist;
          }
        },
        { passive: false }
      );
      canvasEl.addEventListener('touchend', () => {
        this._lastPinchDist = null;
      });
    }

    updateHoverTrace(sx, sy, w, h) {
      let best = null;
      let bestDist = 18;

      // Ưu tiên bắt dính vào các điểm đặc biệt (Nghiệm, Cực trị, Giao điểm)
      for (let i = 0; i < this.specialPoints.length; i++) {
        const pt = this.specialPoints[i];
        const sc = this.worldToScreen(pt.x, pt.y, w, h);
        const d = Math.hypot(sc.sx - sx, sc.sy - sy);
        if (d < 14 && d < bestDist) {
          bestDist = d;
          best = {
            x: pt.x,
            y: pt.y,
            sx: sc.sx,
            sy: sc.sy,
            color: pt.color,
            label: `${pt.label}: (${formatDecimalNumber(pt.x, 'NORM', 4)}, ${formatDecimalNumber(pt.y, 'NORM', 4)})`
          };
        }
      }

      // Nếu không gần điểm đặc biệt, bắt dính lên đường cong gần nhất
      if (!best) {
        const { wx } = this.screenToWorld(sx, sy, w, h);
        const prevAngle = this.math.angleUnit;
        this.math.angleUnit = 'RAD'; // Đồ thị Desmos chuẩn dùng Radian cho giải tích
        const scope = this.getParamScope();
        for (let i = 0; i < this.expressions.length; i++) {
          const item = this.expressions[i];
          if (!item.visible) continue;
          const spec = this.parseExpressionSpec(item.expr);
          if (spec.kind !== 'EXPLICIT' && spec.kind !== 'INEQ_Y') continue;
          try {
            const wy = this.math.evaluate(spec.rhs, { ...scope, x: wx, X: wx });
            if (!Number.isFinite(wy)) continue;
            const sc = this.worldToScreen(wx, wy, w, h);
            const d = Math.abs(sc.sy - sy);
            if (d < bestDist) {
              bestDist = d;
              best = {
                x: wx,
                y: wy,
                sx: sc.sx,
                sy: sc.sy,
                color: item.color,
                label: `(${Number(wx.toFixed(3))}, ${Number(wy.toFixed(3))})`
              };
            }
          } catch (_e) {}
        }
        this.math.angleUnit = prevAngle;
      }

      this.hoverInfo = best;
      this.render();
    }

    render() {
      if (!this.canvas || !this.ctx) return;
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(260, Math.round(rect.width || 520));
      const h = Math.max(220, Math.round(rect.height || 380));
      const dpr = Math.min(2, global.devicePixelRatio || 1);
      if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
      }

      const ctx = this.ctx;
      ctx.save();
      ctx.scale(dpr, dpr);

      // Nền kiểu Desmos (Trắng sáng sắc nét hoặc Đêm Noir)
      ctx.fillStyle = this.darkMode ? '#111116' : '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const { xMin, xMax, yMin, yMax } = this.viewport;
      const xStep = this.computeNiceStep(xMax - xMin);
      const yStep = this.computeNiceStep(yMax - yMin);

      // 1. Lưới phụ & Lưới chính
      if (this.showGrid) {
        if (this.showMinorGrid) {
          ctx.strokeStyle = this.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const mxStep = xStep / 5;
          for (let x = Math.floor(xMin / mxStep) * mxStep; x <= xMax; x += mxStep) {
            const { sx } = this.worldToScreen(x, 0, w, h);
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
          }
          const myStep = yStep / 5;
          for (let y = Math.floor(yMin / myStep) * myStep; y <= yMax; y += myStep) {
            const { sy } = this.worldToScreen(0, y, w, h);
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);
          }
          ctx.stroke();
        }

        ctx.strokeStyle = this.darkMode ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = Math.floor(xMin / xStep) * xStep; x <= xMax; x += xStep) {
          const { sx } = this.worldToScreen(x, 0, w, h);
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, h);
        }
        for (let y = Math.floor(yMin / yStep) * yStep; y <= yMax; y += yStep) {
          const { sy } = this.worldToScreen(0, y, w, h);
          ctx.moveTo(0, sy);
          ctx.lineTo(w, sy);
        }
        ctx.stroke();
      }

      // 2. Trục tọa độ Ox, Oy & Nhãn số kiểu Desmos
      if (this.showAxes) {
        const origin = this.worldToScreen(0, 0, w, h);
        ctx.strokeStyle = this.darkMode ? '#e4e4e7' : '#222222';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        if (origin.sy >= 0 && origin.sy <= h) {
          ctx.moveTo(0, origin.sy);
          ctx.lineTo(w, origin.sy);
        }
        if (origin.sx >= 0 && origin.sx <= w) {
          ctx.moveTo(origin.sx, 0);
          ctx.lineTo(origin.sx, h);
        }
        ctx.stroke();

        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = this.darkMode ? '#d4d4d8' : '#333333';
        const axisY = Math.max(14, Math.min(h - 6, origin.sy + 14));
        const axisX = Math.max(4, Math.min(w - 28, origin.sx - 6));

        ctx.textAlign = 'center';
        for (let x = Math.floor(xMin / xStep) * xStep; x <= xMax; x += xStep) {
          if (Math.abs(x) < xStep * 0.01) continue;
          const { sx } = this.worldToScreen(x, 0, w, h);
          if (sx < 14 || sx > w - 14) continue;
          const lbl = Number(x.toPrecision(6)).toString();
          ctx.fillText(lbl, sx, axisY);
        }

        ctx.textAlign = 'right';
        for (let y = Math.floor(yMin / yStep) * yStep; y <= yMax; y += yStep) {
          if (Math.abs(y) < yStep * 0.01) continue;
          const { sy } = this.worldToScreen(0, y, w, h);
          if (sy < 12 || sy > h - 10) continue;
          const lbl = Number(y.toPrecision(6)).toString();
          ctx.fillText(lbl, axisX, sy + 4);
        }
        if (origin.sx >= 8 && origin.sx <= w - 8 && origin.sy >= 8 && origin.sy <= h - 8) {
          ctx.fillText('0', origin.sx - 5, origin.sy + 14);
        }
      }

      // 3. Vẽ từng biểu thức (luôn dùng RAD chuẩn giải tích cho đồ thị)
      const prevAngle = this.math.angleUnit;
      this.math.angleUnit = 'RAD';
      const scope = this.getParamScope();
      this.specialPoints = [];
      const explicitSeries = [];

      for (let idx = 0; idx < this.expressions.length; idx++) {
        const item = this.expressions[idx];
        if (!item.visible || !String(item.expr || '').trim()) continue;
        const spec = this.parseExpressionSpec(item.expr);
        if (spec.kind === 'EMPTY' || spec.kind === 'PARAM') continue;

        try {
          if (spec.kind === 'EXPLICIT' || spec.kind === 'INEQ_Y') {
            const samples = this.drawExplicitOrIneq(ctx, spec, item.color, scope, w, h);
            explicitSeries.push({ color: item.color, rhs: spec.rhs, samples });
          } else if (spec.kind === 'VERTICAL') {
            const xv = this.math.evaluate(spec.rhs, scope);
            if (Number.isFinite(xv)) {
              const { sx } = this.worldToScreen(xv, 0, w, h);
              ctx.strokeStyle = item.color;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(sx, 0);
              ctx.lineTo(sx, h);
              ctx.stroke();
            }
          } else if (spec.kind === 'POLAR') {
            this.drawPolarCurve(ctx, spec.rhs, item.color, scope, w, h);
          } else if (spec.kind === 'IMPLICIT') {
            this.drawImplicitCurve(ctx, spec.lhs, spec.rhs, item.color, scope, w, h);
          }
        } catch (_ePlot) {}
      }

      // Tìm giao điểm giữa các hàm hiển
      this.detectIntersections(explicitSeries, scope);
      this.math.angleUnit = prevAngle;

      // 4. Vẽ các điểm đặc biệt kiểu Desmos (chấm tròn xám nổi bật)
      for (let i = 0; i < this.specialPoints.length; i++) {
        const pt = this.specialPoints[i];
        const sc = this.worldToScreen(pt.x, pt.y, w, h);
        if (sc.sx < -4 || sc.sx > w + 4 || sc.sy < -4 || sc.sy > h + 4) continue;
        ctx.beginPath();
        ctx.arc(sc.sx, sc.sy, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = this.darkMode ? '#a1a1aa' : '#71717a';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = this.darkMode ? '#18181b' : '#ffffff';
        ctx.stroke();
      }

      // 5. Tooltip tọa độ khi rê chuột / chạm điểm
      if (this.hoverInfo) {
        const { sx, sy, color, label } = this.hoverInfo;
        ctx.beginPath();
        ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = color || '#2d70b3';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.font = 'bold 11px system-ui, sans-serif';
        const tw = ctx.measureText(label).width + 14;
        const bx = Math.max(6, Math.min(w - tw - 6, sx + 10));
        const by = sy > 34 ? sy - 30 : sy + 12;
        ctx.fillStyle = this.darkMode ? 'rgba(24,24,27,0.94)' : 'rgba(255,255,255,0.96)';
        ctx.strokeStyle = color || '#2d70b3';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bx, by, tw, 22, 6) : ctx.rect(bx, by, tw, 22);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = this.darkMode ? '#f4f4f5' : '#18181b';
        ctx.textAlign = 'left';
        ctx.fillText(label, bx + 7, by + 15);
      }

      ctx.restore();
    }

    drawExplicitOrIneq(ctx, spec, color, scope, w, h) {
      const { xMin, xMax, yMin, yMax } = this.viewport;
      const steps = Math.max(320, Math.min(900, Math.round(w * 1.4)));
      const dx = (xMax - xMin) / steps;
      const pts = [];
      const yRange = yMax - yMin;

      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * dx;
        let y = NaN;
        try {
          y = this.math.evaluate(spec.rhs, { ...scope, x, X: x });
        } catch (_e) {
          y = NaN;
        }
        pts.push({ x, y });
      }

      // Tô miền cho bất đẳng thức
      if (spec.kind === 'INEQ_Y') {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        let started = false;
        let firstSx = 0;
        let lastSx = 0;
        const edgeY = spec.op === '<' || spec.op === '<=' ? h : 0;
        for (let i = 0; i < pts.length; i++) {
          const { x, y } = pts[i];
          if (!Number.isFinite(y) || Math.abs(y) > yRange * 25) {
            if (started) {
              ctx.lineTo(lastSx, edgeY);
              ctx.lineTo(firstSx, edgeY);
              ctx.closePath();
              started = false;
            }
            continue;
          }
          const sc = this.worldToScreen(x, y, w, h);
          if (!started) {
            firstSx = sc.sx;
            ctx.moveTo(sc.sx, sc.sy);
            started = true;
          } else {
            ctx.lineTo(sc.sx, sc.sy);
          }
          lastSx = sc.sx;
        }
        if (started) {
          ctx.lineTo(lastSx, edgeY);
          ctx.lineTo(firstSx, edgeY);
          ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
      }

      // Vẽ đường cong mượt (nét đứt nếu < hoặc >)
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (spec.kind === 'INEQ_Y' && (spec.op === '<' || spec.op === '>')) {
        ctx.setLineDash([7, 5]);
      }
      ctx.beginPath();
      let penDown = false;
      let prevY = NaN;
      for (let i = 0; i < pts.length; i++) {
        const { x, y } = pts[i];
        if (!Number.isFinite(y) || Math.abs(y) > yRange * 30) {
          penDown = false;
          prevY = NaN;
          continue;
        }
        // Tránh nối qua tiệm cận đứng (ví dụ tan(x), 1/x)
        if (penDown && Number.isFinite(prevY) && Math.abs(y - prevY) > yRange * 2.5) {
          penDown = false;
        }
        const sc = this.worldToScreen(x, y, w, h);
        if (!penDown) {
          ctx.moveTo(sc.sx, sc.sy);
          penDown = true;
        } else {
          ctx.lineTo(sc.sx, sc.sy);
        }
        prevY = y;
      }
      ctx.stroke();
      ctx.restore();

      // Tìm điểm đặc biệt: Giao trục Oy (x = 0)
      if (xMin <= 0 && xMax >= 0) {
        try {
          const y0 = this.math.evaluate(spec.rhs, { ...scope, x: 0, X: 0 });
          if (Number.isFinite(y0) && y0 >= yMin && y0 <= yMax) {
            this.pushSpecialPoint(0, y0, color, 'Oy');
          }
        } catch (_e0) {}
      }

      // Tìm Nghiệm (giao Ox) & Cực trị địa phương (Max/Min)
      for (let i = 1; i < pts.length - 1; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        if (!Number.isFinite(p0.y) || !Number.isFinite(p1.y) || !Number.isFinite(p2.y)) continue;
        if (Math.abs(p1.y - p0.y) > yRange * 1.5 || Math.abs(p2.y - p1.y) > yRange * 1.5) continue;

        // Đổi dấu -> nghiệm qua phương pháp chia đôi 14 bước
        if ((p0.y < 0 && p1.y > 0) || (p0.y > 0 && p1.y < 0)) {
          let lo = p0.x;
          let hi = p1.x;
          let flo = p0.y;
          for (let k = 0; k < 14; k++) {
            const mid = (lo + hi) / 2;
            const fm = this.math.evaluate(spec.rhs, { ...scope, x: mid, X: mid });
            if ((flo < 0 && fm < 0) || (flo > 0 && fm > 0)) {
              lo = mid;
              flo = fm;
            } else {
              hi = mid;
            }
          }
          const rx = (lo + hi) / 2;
          if (Math.abs(this.math.evaluate(spec.rhs, { ...scope, x: rx, X: rx })) < yRange * 0.05) {
            this.pushSpecialPoint(rx, 0, color, 'Ox');
          }
        }

        // Cực đại / Cực tiểu địa phương
        if ((p1.y > p0.y && p1.y > p2.y) || (p1.y < p0.y && p1.y < p2.y)) {
          if (p1.y >= yMin && p1.y <= yMax) {
            const kind = p1.y > p0.y ? 'Max' : 'Min';
            this.pushSpecialPoint(p1.x, p1.y, color, kind);
          }
        }
      }

      return pts;
    }

    drawPolarCurve(ctx, rhs, color, scope, w, h) {
      const steps = 720;
      const maxTheta = Math.PI * 4;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      let penDown = false;
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * maxTheta;
        let r = NaN;
        try {
          r = this.math.evaluate(rhs, { ...scope, theta: th, t: th });
        } catch (_e) {}
        if (!Number.isFinite(r) || Math.abs(r) > 1e4) {
          penDown = false;
          continue;
        }
        const wx = r * Math.cos(th);
        const wy = r * Math.sin(th);
        const sc = this.worldToScreen(wx, wy, w, h);
        if (!penDown) {
          ctx.moveTo(sc.sx, sc.sy);
          penDown = true;
        } else {
          ctx.lineTo(sc.sx, sc.sy);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    drawImplicitCurve(ctx, lhs, rhs, color, scope, w, h) {
      // Marching Squares 2D cho hàm ẩn: đường tròn, elip, hyperbol, hình trái tim...
      const cols = 110;
      const rows = Math.max(70, Math.round((cols * h) / w));
      const { xMin, xMax, yMin, yMax } = this.viewport;
      const dx = (xMax - xMin) / cols;
      const dy = (yMax - yMin) / rows;
      const expr = `(${lhs}) - (${rhs})`;

      const grid = new Float64Array((cols + 1) * (rows + 1));
      for (let r = 0; r <= rows; r++) {
        const wy = yMin + r * dy;
        for (let c = 0; c <= cols; c++) {
          const wx = xMin + c * dx;
          let v = NaN;
          try {
            v = this.math.evaluate(expr, { ...scope, x: wx, y: wy, X: wx, Y: wy });
          } catch (_e) {}
          grid[r * (cols + 1) + c] = v;
        }
      }

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();

      const interp = (v1, v2, p1, p2) => {
        const d = v2 - v1;
        if (Math.abs(d) < 1e-12) return (p1 + p2) / 2;
        return p1 + (-v1 / d) * (p2 - p1);
      };

      for (let r = 0; r < rows; r++) {
        const y0 = yMin + r * dy;
        const y1 = y0 + dy;
        for (let c = 0; c < cols; c++) {
          const x0 = xMin + c * dx;
          const x1 = x0 + dx;
          const v00 = grid[r * (cols + 1) + c];
          const v10 = grid[r * (cols + 1) + (c + 1)];
          const v11 = grid[(r + 1) * (cols + 1) + (c + 1)];
          const v01 = grid[(r + 1) * (cols + 1) + c];
          if (!Number.isFinite(v00) || !Number.isFinite(v10) || !Number.isFinite(v11) || !Number.isFinite(v01)) {
            continue;
          }
          const crossings = [];
          if ((v00 < 0) !== (v10 < 0)) crossings.push({ x: interp(v00, v10, x0, x1), y: y0 });
          if ((v10 < 0) !== (v11 < 0)) crossings.push({ x: x1, y: interp(v10, v11, y0, y1) });
          if ((v11 < 0) !== (v01 < 0)) crossings.push({ x: interp(v11, v01, x1, x0), y: y1 });
          if ((v01 < 0) !== (v00 < 0)) crossings.push({ x: x0, y: interp(v01, v00, y1, y0) });

          if (crossings.length >= 2) {
            const a = this.worldToScreen(crossings[0].x, crossings[0].y, w, h);
            const b = this.worldToScreen(crossings[1].x, crossings[1].y, w, h);
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            if (crossings.length === 4) {
              const p = this.worldToScreen(crossings[2].x, crossings[2].y, w, h);
              const q = this.worldToScreen(crossings[3].x, crossings[3].y, w, h);
              ctx.moveTo(p.sx, p.sy);
              ctx.lineTo(q.sx, q.sy);
            }
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    detectIntersections(series, scope) {
      if (series.length < 2) return;
      const { yMin, yMax } = this.viewport;
      const yRange = yMax - yMin;
      for (let i = 0; i < series.length; i++) {
        for (let j = i + 1; j < series.length; j++) {
          const sA = series[i];
          const sB = series[j];
          const len = Math.min(sA.samples.length, sB.samples.length);
          for (let k = 1; k < len; k++) {
            const d0 = sA.samples[k - 1].y - sB.samples[k - 1].y;
            const d1 = sA.samples[k].y - sB.samples[k].y;
            if (!Number.isFinite(d0) || !Number.isFinite(d1)) continue;
            if (Math.abs(d1 - d0) > yRange * 2) continue;
            if ((d0 < 0 && d1 > 0) || (d0 > 0 && d1 < 0)) {
              let lo = sA.samples[k - 1].x;
              let hi = sA.samples[k].x;
              let flo = d0;
              for (let it = 0; it < 12; it++) {
                const mid = (lo + hi) / 2;
                const fm =
                  this.math.evaluate(sA.rhs, { ...scope, x: mid, X: mid }) -
                  this.math.evaluate(sB.rhs, { ...scope, x: mid, X: mid });
                if ((flo < 0 && fm < 0) || (flo > 0 && fm > 0)) {
                  lo = mid;
                  flo = fm;
                } else {
                  hi = mid;
                }
              }
              const ix = (lo + hi) / 2;
              const iy = this.math.evaluate(sA.rhs, { ...scope, x: ix, X: ix });
              if (Number.isFinite(iy) && iy >= yMin && iy <= yMax) {
                this.pushSpecialPoint(ix, iy, '#10b981', '∩');
              }
            }
          }
        }
      }
    }

    pushSpecialPoint(x, y, color, label) {
      if (this.specialPoints.length >= 60) return;
      const tol = (this.viewport.xMax - this.viewport.xMin) * 0.015;
      const exists = this.specialPoints.some((p) => Math.hypot(p.x - x, p.y - y) < tol);
      if (!exists) {
        this.specialPoints.push({ x, y, color, label });
      }
    }

    addExpression(expr = '', color = null) {
      this.pushHistory();
      const c = color || DESMOS_COLORS[(this._idCounter - 1) % DESMOS_COLORS.length];
      const item = { id: `expr_${this._idCounter++}`, expr: String(expr), color: c, visible: true };
      this.expressions.push(item);
      this.syncParametersFromExpressions();
      this.render();
      return item;
    }

    exportPng() {
      if (!this.canvas) return false;
      try {
        const url = this.canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `do_thi_ham_so_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return true;
      } catch (_e) {
        return false;
      }
    }
  }

  // ==========================================================================
  // PHẦN 6: BỘ ĐIỀU KHIỂN GIAO DIỆN CASIO FX-570VN PLUS + DESMOS TRỌN VẸN
  // ==========================================================================
  class Fx570AndDesmosController {
    constructor() {
      this.math = new Fx570MathEngine();
      this.graph = new DesmosGraphEngine(this.math);

      this.mode = 'COMP'; // COMP | CMPLX | STAT | BASE | EQN | MATRIX | TABLE | VECTOR | INEQ
      this.shiftOn = false;
      this.alphaOn = false;
      this.stoPending = false;
      this.rclPending = false;
      this.hypPending = false;
      this.exactMode = true; // S⇔D toggle
      this.inputExpr = '';
      this.cursorPos = 0;
      this.lastNumericResult = 0;
      this.lastExactDisplay = '0';
      this.lastDecimalDisplay = '0';
      this.lastError = '';
      this.history = [];
      this.historyIndex = -1;
      this.subPanel = ''; // '' | 'MODE' | 'SETUP' | 'CONST' | 'CONV' | 'CLR' | 'CMPLX_OP' | 'STAT_UI' | 'BASE_UI' | 'EQN_UI' | 'MATRIX_UI' | 'TABLE_UI' | 'VECTOR_UI' | 'INEQ_UI'
      this.desmosOpen = false;
      this.rootHost = null;
      this.modalEl = null;

      // Dữ liệu các chế độ nâng cao
      this.baseMode = 10;
      this.baseValue = 0;
      this.eqnSubMode = 'QUAD'; // LIN2 | LIN3 | QUAD | CUBIC
      this.ineqSubMode = 'QUAD'; // QUAD | CUBIC
      this.ineqOp = '>';
      this.statTwoVar = false;
      this.statRows = [
        { x: '2', y: '5', f: '1' },
        { x: '4', y: '9', f: '1' },
        { x: '6', y: '13', f: '1' },
        { x: '8', y: '16', f: '1' }
      ];
      this.matSize = 2;
      this.matA = [
        [2, 1, 0],
        [5, 3, 0],
        [0, 0, 1]
      ];
      this.matB = [
        [1, 4, 0],
        [2, 2, 0],
        [0, 0, 1]
      ];
      this.vecDim = 3;
      this.vecA = [1, 2, 3];
      this.vecB = [4, -5, 6];
      this.tableFx = 'x^2 - 2x - 3';
      this.tableGx = '2x + 1';
      this.tableStart = -3;
      this.tableEnd = 5;
      this.tableStep = 1;
      this._sliderAnimId = null;
      this._initialized = false;
    }

    init() {
      if (this._initialized) return true;
      this._initialized = true;
      this.injectStyles();
      this.restoreState();
      this.bindGlobalKeyboard();
      return true;
    }

    injectStyles() {
      if (typeof document === 'undefined' || document.getElementById(MOD45_STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = MOD45_STYLE_ID;
      style.textContent = `
        /* === KHUNG MÁY CASIO FX-570VN PLUS CHÂN THỰC === */
        .fx570-workspace {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          max-width: 100%;
        }
        @media (min-width: 1024px) {
          .fx570-workspace.desmos-open {
            display: grid;
            grid-template-columns: 344px minmax(0, 1fr);
            align-items: start;
          }
        }
        .fx570-chassis {
          width: 100%;
          max-width: 344px;
          margin: 0 auto;
          background: linear-gradient(180deg, #eff2f5 0%, #dde2e8 52%, #ced5de 100%);
          border: 4px solid #353d59;
          border-radius: 26px 26px 38px 38px;
          box-shadow: 0 18px 42px rgba(0,0,0,0.55), inset 0 2px 3px rgba(255,255,255,0.9), inset 0 -4px 8px rgba(40,48,74,0.28);
          padding: 14px 13px 18px;
          color: #1a202c;
          font-family: system-ui, -apple-system, 'Be Vietnam Pro', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', system-ui, sans-serif;
          user-select: none;
          position: relative;
        }
        .fx570-brand-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 0 4px 2px;
        }
        .fx570-brand-casio {
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 1.5px;
          color: #202534;
        }
        .fx570-brand-model {
          font-style: italic;
          font-weight: 700;
          font-size: 12px;
          color: #3a4566;
        }
        .fx570-vpam {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.4px;
          color: #116652;
          margin: 1px 0 7px;
          font-style: italic;
        }
        .fx570-lcd-bezel {
          background: linear-gradient(180deg, #4b5563 0%, #2f3746 100%);
          border-radius: 11px;
          padding: 5px;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.65);
          margin-bottom: 10px;
        }
        .fx570-lcd {
          background: linear-gradient(180deg, #cfe0cd 0%, #c1d4bf 100%);
          border-radius: 6px;
          min-height: 82px;
          padding: 5px 8px 6px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #162319;
          font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
          box-shadow: inset 0 2px 6px rgba(22,35,25,0.22);
          position: relative;
          overflow: hidden;
        }
        .fx570-lcd-flags {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 700;
          gap: 4px;
          border-bottom: 1px solid rgba(22,35,25,0.14);
          padding-bottom: 2px;
          min-height: 15px;
        }
        .fx570-flag-pill {
          padding: 0 3px;
          border-radius: 2px;
          background: #162319;
          color: #cfe0cd;
          font-size: 8.5px;
          line-height: 13px;
        }
        .fx570-flag-pill.shift { background: #92400e; color: #fef3c7; }
        .fx570-flag-pill.alpha { background: #991b1b; color: #fee2e2; }
        .fx570-lcd-expr {
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.3;
          word-break: break-all;
          min-height: 22px;
          margin-top: 3px;
          color: #0f1d13;
        }
        .fx570-lcd-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          background: #0f1d13;
          vertical-align: middle;
          animation: fx570Blink 1s steps(1) infinite;
        }
        @keyframes fx570Blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        .fx570-lcd-result {
          font-size: 17px;
          font-weight: 700;
          text-align: right;
          color: #0b160e;
          line-height: 1.25;
          word-break: break-all;
          margin-top: 2px;
        }
        .fx570-lcd-result.error {
          color: #991b1b;
          font-size: 12px;
          text-align: left;
        }

        /* Nhãn SHIFT (vàng đồng) & ALPHA (đỏ) phía trên mỗi phím */
        .fx570-key-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }
        .fx570-legends {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 8.5px;
          font-weight: 700;
          line-height: 10px;
          min-height: 10px;
          white-space: nowrap;
        }
        .fx570-leg-s { color: #9a6700; }
        .fx570-leg-a { color: #b91c1c; }
        .fx570-leg-b { color: #047857; }

        /* Phím hàng trên (SHIFT / ALPHA / REPLAY / MODE / ON) */
        .fx570-top-cluster {
          display: grid;
          grid-template-columns: 1fr 1fr 78px 1fr 1fr;
          align-items: center;
          gap: 5px;
          margin-bottom: 6px;
        }
        .fx570-pill-btn {
          width: 100%;
          height: 24px;
          border-radius: 12px;
          border: 1px solid #2b3248;
          background: linear-gradient(180deg, #747c99 0%, #505873 100%);
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 700;
          box-shadow: 0 2px 0 #2b3248, inset 0 1px 0 rgba(255,255,255,0.35);
          cursor: pointer;
          transition: transform 0.06s;
        }
        .fx570-pill-btn:active { transform: translateY(1.5px); box-shadow: 0 0 0 #2b3248; }
        .fx570-pill-btn.active-shift { background: linear-gradient(180deg, #d97706, #b45309); }
        .fx570-pill-btn.active-alpha { background: linear-gradient(180deg, #dc2626, #991b1b); }

        .fx570-replay-pad {
          width: 74px;
          height: 54px;
          margin: 0 auto;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 32%, #868fae 0%, #5b6380 65%, #444b66 100%);
          border: 2px solid #353d59;
          box-shadow: 0 3px 0 #2b3248, inset 0 1px 2px rgba(255,255,255,0.45);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e2e8f0;
          font-size: 8px;
          font-weight: 700;
        }
        .fx570-replay-dir {
          position: absolute;
          background: transparent;
          border: none;
          color: #f1f5f9;
          font-size: 10px;
          cursor: pointer;
          padding: 2px 5px;
          line-height: 1;
        }
        .fx570-replay-dir:hover { color: #fde68a; }
        .fx570-replay-dir.up { top: 1px; left: 50%; transform: translateX(-50%); }
        .fx570-replay-dir.down { bottom: 1px; left: 50%; transform: translateX(-50%); }
        .fx570-replay-dir.left { left: 2px; top: 50%; transform: translateY(-50%); }
        .fx570-replay-dir.right { right: 2px; top: 50%; transform: translateY(-50%); }

        /* Lưới phím khoa học (6 cột) */
        .fx570-sci-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 5px 4px;
          margin-bottom: 8px;
        }
        .fx570-sci-btn {
          width: 100%;
          height: 25px;
          border-radius: 7px;
          border: 1px solid #1e2436;
          background: linear-gradient(180deg, #43495f 0%, #2a2f42 100%);
          color: #f8fafc;
          font-size: 10.5px;
          font-weight: 700;
          box-shadow: 0 2px 0 #181c29, inset 0 1px 0 rgba(255,255,255,0.22);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 2px;
        }
        .fx570-sci-btn:hover { filter: brightness(1.12); }
        .fx570-sci-btn:active { transform: translateY(1.5px); box-shadow: none; }

        /* Lưới phím số & phép toán (5 cột) */
        .fx570-num-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px 5px;
        }
        .fx570-num-btn {
          width: 100%;
          height: 31px;
          border-radius: 9px 9px 11px 11px;
          border: 1px solid #7d8699;
          background: linear-gradient(180deg, #f8fafc 0%, #dce1e9 100%);
          color: #111827;
          font-size: 13.5px;
          font-weight: 700;
          box-shadow: 0 2.5px 0 #646d82, inset 0 1px 0 #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fx570-num-btn:hover { filter: brightness(1.04); }
        .fx570-num-btn:active { transform: translateY(2px); box-shadow: none; }
        .fx570-num-btn.orange {
          background: linear-gradient(180deg, #fb923c 0%, #ea580c 100%);
          border-color: #9a3412;
          color: #ffffff;
          box-shadow: 0 2.5px 0 #7c2d12, inset 0 1px 0 rgba(255,255,255,0.35);
          font-size: 12px;
        }
        .fx570-num-btn.op {
          font-size: 15px;
          background: linear-gradient(180deg, #eef2f6 0%, #cbd5e1 100%);
        }
        .fx570-num-btn.eq {
          background: linear-gradient(180deg, #e2e8f0 0%, #b6c2d2 100%);
          color: #0f172a;
        }

        /* Bảng phụ MODE / EQN / MATRIX / STAT / VECTOR / BASE / TABLE / CONST / CONV */
        .fx570-subpanel {
          margin-top: 8px;
          background: #141923;
          border: 1.5px solid #38bdf8;
          border-radius: 12px;
          padding: 9px;
          color: #e2e8f0;
          font-size: 11px;
        }

        /* === KHUNG ĐỒ THỊ KIỂU DESMOS === */
        .desmos-shell {
          border: 2px solid rgba(56, 189, 248, 0.5);
          border-radius: 18px;
          overflow: hidden;
          background: #18181b;
          display: flex;
          flex-direction: column;
          box-shadow: 0 16px 38px rgba(0,0,0,0.45);
        }
        .desmos-topbar {
          background: #1f2430;
          color: #f8fafc;
          padding: 8px 12px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-bottom: 1px solid #334155;
        }
        .desmos-body {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 460px;
        }
        @media (min-width: 768px) {
          .desmos-body {
            grid-template-columns: 270px minmax(0, 1fr);
          }
        }
        .desmos-sidebar {
          background: #f8fafc;
          color: #0f172a;
          border-right: 1px solid #cbd5e1;
          display: flex;
          flex-direction: column;
          max-height: 520px;
          overflow-y: auto;
        }
        .desmos-shell.dark-graph .desmos-sidebar {
          background: #12141c;
          color: #e2e8f0;
          border-right-color: #27272a;
        }
        .desmos-expr-row {
          display: flex;
          align-items: stretch;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
        }
        .desmos-shell.dark-graph .desmos-expr-row {
          background: #181b25;
          border-bottom-color: #27272a;
        }
        .desmos-expr-gutter {
          width: 34px;
          background: #f1f5f9;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 4px 2px;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          flex-shrink: 0;
        }
        .desmos-shell.dark-graph .desmos-expr-gutter {
          background: #11131a;
          border-right-color: #27272a;
        }
        .desmos-color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.25);
          cursor: pointer;
        }
        .desmos-canvas-stage {
          position: relative;
          min-height: 360px;
          background: #ffffff;
          overflow: hidden;
        }
        .desmos-canvas-stage canvas {
          width: 100%;
          height: 100%;
          min-height: 360px;
          display: block;
          touch-action: none;
          cursor: crosshair;
        }
        .desmos-canvas-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          z-index: 4;
        }
        .desmos-map-btn {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid rgba(15,23,42,0.18);
          background: rgba(255,255,255,0.94);
          color: #0f172a;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.14);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .desmos-map-btn:hover { background: #e0f2fe; }
      `;
      document.head.appendChild(style);
    }

    saveState() {
      try {
        if (!global.localStorage) return;
        const payload = {
          angleUnit: this.math.angleUnit,
          displayMode: this.math.displayMode,
          displayPrecision: this.math.displayPrecision,
          vars: this.math.vars,
          expressions: this.graph.expressions,
          desmosOpen: this.desmosOpen,
          darkMode: this.graph.darkMode
        };
        global.localStorage.setItem(MOD45_STORAGE_KEY, JSON.stringify(payload));
      } catch (_e) {}
    }

    restoreState() {
      try {
        if (!global.localStorage) return;
        const raw = global.localStorage.getItem(MOD45_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.angleUnit) this.math.angleUnit = data.angleUnit;
        if (data.displayMode) this.math.displayMode = data.displayMode;
        if (Number.isFinite(data.displayPrecision)) this.math.displayPrecision = data.displayPrecision;
        if (data.vars && typeof data.vars === 'object') Object.assign(this.math.vars, data.vars);
        if (Array.isArray(data.expressions) && data.expressions.length) {
          this.graph.expressions = data.expressions;
          this.graph._idCounter = data.expressions.length + 2;
          this.graph.syncParametersFromExpressions();
        }
        if (typeof data.darkMode === 'boolean') this.graph.darkMode = data.darkMode;
      } catch (_e) {}
    }

    insertToken(str, cursorOffsetFromEnd = 0) {
      const before = this.inputExpr.slice(0, this.cursorPos);
      const after = this.inputExpr.slice(this.cursorPos);
      this.inputExpr = before + str + after;
      this.cursorPos = before.length + str.length - cursorOffsetFromEnd;
      this.lastError = '';
      this.updateLcdOnly();
    }

    deleteAtCursor() {
      if (this.cursorPos <= 0) return;
      this.inputExpr = this.inputExpr.slice(0, this.cursorPos - 1) + this.inputExpr.slice(this.cursorPos);
      this.cursorPos--;
      this.lastError = '';
      this.updateLcdOnly();
    }

    clearAll() {
      this.inputExpr = '';
      this.cursorPos = 0;
      this.lastError = '';
      this.shiftOn = false;
      this.alphaOn = false;
      this.stoPending = false;
      this.rclPending = false;
      this.hypPending = false;
      this.lastExactDisplay = '0';
      this.lastDecimalDisplay = '0';
      this.updateLcdOnly();
      this.syncModifierButtons();
    }

    evaluateCurrentExpression() {
      const raw = this.inputExpr.trim();
      if (!raw) return;
      try {
        this.lastError = '';
        if (this.mode === 'CMPLX') {
          const c = ComplexEngine.evaluate(raw, this.math.angleUnit);
          this.lastExactDisplay = ComplexEngine.format(c, this.math.angleUnit, false);
          this.lastDecimalDisplay = ComplexEngine.format(c, this.math.angleUnit, true);
          this.history.push({ expr: raw, res: this.lastExactDisplay });
          this.historyIndex = this.history.length;
          this.updateLcdOnly();
          return c;
        }
        if (this.mode === 'BASE') {
          const v = BaseNEngine.parseInBase(raw, this.baseMode);
          this.baseValue = v;
          const all = BaseNEngine.convertAll(v);
          this.lastExactDisplay =
            this.baseMode === 16 ? all.hex : this.baseMode === 2 ? all.bin : this.baseMode === 8 ? all.oct : all.dec;
          this.lastDecimalDisplay = `DEC=${all.dec} | HEX=${all.hex}`;
          this.updateLcdOnly();
          this.renderSubPanel();
          return all;
        }

        const out = this.math.evaluate(raw);
        if (out && typeof out === 'object' && typeof out.text === 'string') {
          this.math.vars.PreAns = this.math.vars.Ans;
          this.math.vars.Ans = Number.isFinite(out.numeric) ? out.numeric : 0;
          this.lastNumericResult = this.math.vars.Ans;
          this.lastExactDisplay = out.text;
          this.lastDecimalDisplay = out.text;
        } else if (typeof out === 'string') {
          this.lastExactDisplay = out;
          this.lastDecimalDisplay = out;
        } else {
          this.math.vars.PreAns = this.math.vars.Ans;
          this.math.vars.Ans = out;
          this.lastNumericResult = out;
          const exact = formatExactSymbolic(out);
          const dec = formatDecimalNumber(out, this.math.displayMode, this.math.displayPrecision);
          this.lastExactDisplay = exact || dec;
          this.lastDecimalDisplay = dec;
        }

        this.history.push({ expr: raw, res: this.exactMode ? this.lastExactDisplay : this.lastDecimalDisplay });
        if (this.history.length > 30) this.history.shift();
        this.historyIndex = this.history.length;
        this.saveState();
        this.updateLcdOnly();
        return out;
      } catch (err) {
        this.lastError = String(err && err.message ? err.message : 'Syntax ERROR');
        this.updateLcdOnly();
        return null;
      }
    }

    handleKeyPress(keyId) {
      const sh = this.shiftOn;
      const al = this.alphaOn;

      // Xử lý lưu/gọi biến STO / RCL (A..F, X, Y, M)
      const varKeyMap = { neg: 'A', dms: 'B', hyp: 'C', sin: 'D', cos: 'E', tan: 'F', rparen: 'X', sd: 'Y', mplus: 'M' };
      if ((this.stoPending || this.rclPending) && varKeyMap[keyId]) {
        const vName = varKeyMap[keyId];
        if (this.stoPending) {
          if (this.inputExpr.trim()) this.evaluateCurrentExpression();
          this.math.vars[vName] = Number(this.lastNumericResult) || 0;
          this.lastExactDisplay = `${vName} ← ${formatDecimalNumber(this.math.vars[vName])}`;
          this.lastDecimalDisplay = this.lastExactDisplay;
          this.stoPending = false;
          this.saveState();
          this.updateLcdOnly();
          return;
        }
        if (this.rclPending) {
          this.rclPending = false;
          this.insertToken(vName);
          return;
        }
      }

      // Phím điều khiển SHIFT / ALPHA / MODE / ON / REPLAY
      if (keyId === 'shift') {
        this.shiftOn = !this.shiftOn;
        if (this.shiftOn) this.alphaOn = false;
        this.syncModifierButtons();
        this.updateLcdOnly();
        return;
      }
      if (keyId === 'alpha') {
        this.alphaOn = !this.alphaOn;
        if (this.alphaOn) this.shiftOn = false;
        this.syncModifierButtons();
        this.updateLcdOnly();
        return;
      }

      // Reset cờ SHIFT/ALPHA sau khi dùng phím
      this.shiftOn = false;
      this.alphaOn = false;
      this.syncModifierButtons();

      switch (keyId) {
        case 'mode':
          this.subPanel = sh ? (this.subPanel === 'SETUP' ? '' : 'SETUP') : this.subPanel === 'MODE' ? '' : 'MODE';
          this.renderSubPanel();
          return;
        case 'on':
          this.subPanel = '';
          this.mode = 'COMP';
          this.clearAll();
          this.renderSubPanel();
          return;
        case 'replay_left':
          this.cursorPos = Math.max(0, this.cursorPos - 1);
          this.updateLcdOnly();
          return;
        case 'replay_right':
          this.cursorPos = Math.min(this.inputExpr.length, this.cursorPos + 1);
          this.updateLcdOnly();
          return;
        case 'replay_up':
          if (this.history.length > 0) {
            this.historyIndex = Math.max(0, (this.historyIndex < 0 ? this.history.length : this.historyIndex) - 1);
            this.inputExpr = this.history[this.historyIndex].expr;
            this.cursorPos = this.inputExpr.length;
            this.updateLcdOnly();
          }
          return;
        case 'replay_down':
          if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.inputExpr = this.history[this.historyIndex].expr;
            this.cursorPos = this.inputExpr.length;
            this.updateLcdOnly();
          }
          return;
        case 'calc':
          if (sh) this.insertToken('SOLVE(, 1)', 4);
          else if (al) this.insertToken('=');
          else {
            // CALC: gán nhanh X rồi tính
            if (!this.inputExpr.trim()) this.insertToken('X^2 + 2X - 3');
            else this.evaluateCurrentExpression();
          }
          return;
        case 'integral':
          if (sh) this.insertToken('d/dx(, 0)', 4);
          else this.insertToken('∫(, 0, 1)', 7);
          return;
        case 'xinv':
          if (sh) this.insertToken('!');
          else this.insertToken('⁻¹');
          return;
        case 'logbase':
          if (sh) this.insertToken('∑(, 1, 10)', 8);
          else if (al) this.insertToken('∏(, 1, 5)', 7);
          else this.insertToken('logbase(, )', 3);
          return;
        case 'frac':
          if (sh) this.insertToken(' ÷R ');
          else this.insertToken('()/()', 4);
          return;
        case 'sqrt':
          if (sh) this.insertToken('∛()', 1);
          else this.insertToken('√()', 1);
          return;
        case 'x2':
          if (sh) this.insertToken('³');
          else if (this.mode === 'BASE') {
            this.baseMode = 10;
            this.updateLcdOnly();
            this.renderSubPanel();
          } else this.insertToken('²');
          return;
        case 'xpow':
          if (sh) this.insertToken('nroot(, )', 3);
          else if (this.mode === 'BASE') {
            this.baseMode = 16;
            this.updateLcdOnly();
            this.renderSubPanel();
          } else this.insertToken('^');
          return;
        case 'log':
          if (sh) this.insertToken('10^');
          else if (this.mode === 'BASE') {
            this.baseMode = 2;
            this.updateLcdOnly();
            this.renderSubPanel();
          } else this.insertToken('log()', 1);
          return;
        case 'ln':
          if (sh) this.insertToken('e^');
          else if (this.mode === 'BASE') {
            this.baseMode = 8;
            this.updateLcdOnly();
            this.renderSubPanel();
          } else this.insertToken('ln()', 1);
          return;
        case 'neg':
          if (sh) this.insertToken('∠');
          else if (al) this.insertToken('A');
          else this.insertToken('-');
          return;
        case 'dms':
          if (sh) {
            if (this.inputExpr.trim()) this.evaluateCurrentExpression();
            const fStr = primeFactorize(this.lastNumericResult);
            this.lastExactDisplay = fStr;
            this.lastDecimalDisplay = fStr;
            this.updateLcdOnly();
          } else if (al) this.insertToken('B');
          else {
            if (this.inputExpr.trim() && !/[°]/.test(this.inputExpr)) {
              const dmsStr = toDMSString(this.lastNumericResult);
              this.lastExactDisplay = dmsStr;
              this.lastDecimalDisplay = dmsStr;
              this.updateLcdOnly();
            } else {
              this.insertToken('°');
            }
          }
          return;
        case 'hyp':
          if (sh) this.insertToken('Abs()', 1);
          else if (al) this.insertToken('C');
          else {
            this.hypPending = !this.hypPending;
            this.updateLcdOnly();
          }
          return;
        case 'sin':
          if (al) this.insertToken('D');
          else if (this.hypPending) {
            this.hypPending = false;
            this.insertToken(sh ? 'asinh()' : 'sinh()', 1);
          } else this.insertToken(sh ? 'sin⁻¹()' : 'sin()', 1);
          return;
        case 'cos':
          if (al) this.insertToken('E');
          else if (this.hypPending) {
            this.hypPending = false;
            this.insertToken(sh ? 'acosh()' : 'cosh()', 1);
          } else this.insertToken(sh ? 'cos⁻¹()' : 'cos()', 1);
          return;
        case 'tan':
          if (al) this.insertToken('F');
          else if (this.hypPending) {
            this.hypPending = false;
            this.insertToken(sh ? 'atanh()' : 'tanh()', 1);
          } else this.insertToken(sh ? 'tan⁻¹()' : 'tan()', 1);
          return;
        case 'rcl':
          if (sh) {
            this.stoPending = true;
            this.rclPending = false;
          } else {
            this.rclPending = true;
            this.stoPending = false;
          }
          this.updateLcdOnly();
          return;
        case 'eng':
          if (al || this.mode === 'CMPLX') this.insertToken('i');
          else {
            // Định dạng kỹ thuật ENG (bội 10^3k)
            const v = this.lastNumericResult;
            if (Number.isFinite(v) && v !== 0) {
              const exp3 = Math.floor(Math.log10(Math.abs(v)) / 3) * 3;
              const mant = v / Math.pow(10, exp3);
              this.lastDecimalDisplay = `${Number(mant.toPrecision(7))}×10^${exp3}`;
              this.exactMode = false;
              this.updateLcdOnly();
            }
          }
          return;
        case 'lparen':
          if (sh) this.insertToken('%');
          else this.insertToken('(');
          return;
        case 'rparen':
          if (sh) this.insertToken(', ');
          else if (al) this.insertToken('X');
          else this.insertToken(')');
          return;
        case 'sd':
          if (al) this.insertToken('Y');
          else {
            this.exactMode = !this.exactMode;
            this.updateLcdOnly();
          }
          return;
        case 'mplus':
          if (al) this.insertToken('M');
          else {
            if (this.inputExpr.trim()) this.evaluateCurrentExpression();
            const delta = Number(this.lastNumericResult) || 0;
            this.math.vars.M = (Number(this.math.vars.M) || 0) + (sh ? -delta : delta);
            this.saveState();
            this.updateLcdOnly();
          }
          return;
        case 'del':
          this.deleteAtCursor();
          return;
        case 'ac':
          this.clearAll();
          return;
        case '7':
          if (sh) {
            this.subPanel = this.subPanel === 'CONST' ? '' : 'CONST';
            this.renderSubPanel();
          } else this.insertToken('7');
          return;
        case '8':
          if (sh) {
            this.subPanel = this.subPanel === 'CONV' ? '' : 'CONV';
            this.renderSubPanel();
          } else this.insertToken('8');
          return;
        case '9':
          if (sh) {
            this.math.vars = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0, Ans: 0, PreAns: 0 };
            this.clearAll();
            this.lastExactDisplay = 'CLR All Done';
            this.lastDecimalDisplay = 'CLR All Done';
            this.saveState();
            this.updateLcdOnly();
          } else this.insertToken('9');
          return;
        case '4':
          if (sh) {
            this.switchCalcMode('MATRIX');
          } else this.insertToken('4');
          return;
        case '5':
          if (sh) {
            this.switchCalcMode('VECTOR');
          } else this.insertToken('5');
          return;
        case '6':
          this.insertToken('6');
          return;
        case 'mul':
          if (sh) this.insertToken('nPr(, )', 3);
          else if (al) this.insertToken('GCD(, )', 3);
          else this.insertToken('×');
          return;
        case 'div':
          if (sh) this.insertToken('nCr(, )', 3);
          else if (al) this.insertToken('LCM(, )', 3);
          else this.insertToken('÷');
          return;
        case '1':
          if (sh) this.switchCalcMode('STAT');
          else this.insertToken('1');
          return;
        case '2':
          if (sh) this.switchCalcMode('CMPLX');
          else this.insertToken('2');
          return;
        case '3':
          if (sh) this.switchCalcMode('BASE');
          else this.insertToken('3');
          return;
        case 'add':
          if (sh) this.insertToken('Pol(, )', 3);
          else if (al) this.insertToken('Int()', 1);
          else this.insertToken('+');
          return;
        case 'sub':
          if (sh) this.insertToken('Rec(, )', 3);
          else if (al) this.insertToken('Intg()', 1);
          else this.insertToken('−');
          return;
        case '0':
          if (sh) this.insertToken('Rnd()', 1);
          else this.insertToken('0');
          return;
        case 'dot':
          if (sh) this.insertToken('Ran()');
          else if (al) this.insertToken('RanInt(1, 100)');
          else this.insertToken('.');
          return;
        case 'exp10':
          if (sh) this.insertToken('π');
          else if (al) this.insertToken('e');
          else this.insertToken('×10^');
          return;
        case 'ans':
          if (al) this.insertToken('PreAns');
          else this.insertToken('Ans');
          return;
        case 'eq':
          this.evaluateCurrentExpression();
          return;
        default:
          break;
      }
    }

    switchCalcMode(modeKey) {
      this.mode = modeKey;
      const mapPanel = {
        COMP: '',
        CMPLX: 'CMPLX_UI',
        STAT: 'STAT_UI',
        BASE: 'BASE_UI',
        EQN: 'EQN_UI',
        MATRIX: 'MATRIX_UI',
        TABLE: 'TABLE_UI',
        VECTOR: 'VECTOR_UI',
        INEQ: 'INEQ_UI'
      };
      this.subPanel = mapPanel[modeKey] || '';
      this.updateLcdOnly();
      this.renderSubPanel();
    }

    syncModifierButtons() {
      if (!this.rootHost) return;
      const sBtn = this.rootHost.querySelector('[data-fx-key="shift"]');
      const aBtn = this.rootHost.querySelector('[data-fx-key="alpha"]');
      if (sBtn) sBtn.classList.toggle('active-shift', this.shiftOn);
      if (aBtn) aBtn.classList.toggle('active-alpha', this.alphaOn);
    }

    updateLcdOnly() {
      if (!this.rootHost) return;
      const flagsEl = this.rootHost.querySelector('[data-fx-lcd-flags]');
      const exprEl = this.rootHost.querySelector('[data-fx-lcd-expr]');
      const resEl = this.rootHost.querySelector('[data-fx-lcd-result]');
      if (!flagsEl || !exprEl || !resEl) return;

      const leftFlags = [];
      if (this.shiftOn) leftFlags.push('<span class="fx570-flag-pill shift">S</span>');
      if (this.alphaOn) leftFlags.push('<span class="fx570-flag-pill alpha">A</span>');
      if (this.stoPending) leftFlags.push('<span class="fx570-flag-pill shift">STO</span>');
      if (this.rclPending) leftFlags.push('<span class="fx570-flag-pill">RCL</span>');
      if (this.hypPending) leftFlags.push('<span class="fx570-flag-pill">hyp</span>');
      if (Math.abs(this.math.vars.M || 0) > 1e-12) leftFlags.push('<span class="fx570-flag-pill">M</span>');
      leftFlags.push(`<span class="fx570-flag-pill">${this.math.angleUnit[0]}</span>`);
      if (this.math.displayMode !== 'NORM') {
        leftFlags.push(`<span class="fx570-flag-pill">${this.math.displayMode}</span>`);
      }

      const modeTag =
        this.mode === 'BASE'
          ? `BASE-${this.baseMode === 16 ? 'HEX' : this.baseMode === 2 ? 'BIN' : this.baseMode === 8 ? 'OCT' : 'DEC'}`
          : this.mode;
      flagsEl.innerHTML = `<span class="flex items-center gap-1">${leftFlags.join('')}</span><span>${escapeHtml(modeTag)} · Math</span>`;

      const before = escapeHtml(this.inputExpr.slice(0, this.cursorPos));
      const after = escapeHtml(this.inputExpr.slice(this.cursorPos));
      exprEl.innerHTML = `${before}<span class="fx570-lcd-cursor"></span>${after}`;

      if (this.lastError) {
        resEl.className = 'fx570-lcd-result error';
        resEl.textContent = this.lastError;
      } else {
        resEl.className = 'fx570-lcd-result';
        resEl.textContent = this.exactMode ? this.lastExactDisplay : this.lastDecimalDisplay;
      }
    }

    // Gửi hàm từ fx-570VN PLUS sang Đồ thị Desmos tức thì
    plotFunctionFromCalc(exprStr = null) {
      const raw = String(exprStr != null ? exprStr : this.inputExpr || '').trim();
      this.toggleDesmosPanel(true);
      if (raw) {
        const clean = raw
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-')
          .replace(/²/g, '^2')
          .replace(/³/g, '^3')
          .replace(/X/g, 'x');
        const hasYOrEq = clean.includes('=');
        const finalExpr = hasYOrEq ? clean : `y = ${clean}`;
        this.graph.addExpression(finalExpr);
        this.renderDesmosSidebar();
        this.graph.render();
      }
      return true;
    }

    toggleDesmosPanel(forceOpen = null) {
      this.desmosOpen = forceOpen === null ? !this.desmosOpen : Boolean(forceOpen);
      this.saveState();
      if (!this.rootHost) return this.desmosOpen;
      const ws = this.rootHost.querySelector('[data-fx-workspace]');
      const desmosPane = this.rootHost.querySelector('[data-desmos-pane]');
      const btn = this.rootHost.querySelector('[data-btn-toggle-desmos]');
      if (ws) ws.classList.toggle('desmos-open', this.desmosOpen);
      if (desmosPane) desmosPane.classList.toggle('hidden', !this.desmosOpen);
      if (btn) {
        btn.setAttribute('aria-expanded', this.desmosOpen ? 'true' : 'false');
      }
      if (this.desmosOpen) {
        this.renderDesmosSidebar();
        setTimeout(() => {
          this.graph.aspectNormalize();
          this.graph.render();
        }, 30);
      }
      return this.desmosOpen;
    }

    buildFx570KeypadHtml() {
      const sciRows = [
        // Hàng 1 khoa học: CALC, ∫dx, (trống 2 ô cho REPLAY), x⁻¹, log■□
        [
          { id: 'calc', lbl: 'CALC', s: 'SOLVE', a: '=' },
          { id: 'integral', lbl: '∫dx', s: 'd/dx', a: ':' },
          null,
          null,
          { id: 'xinv', lbl: 'x⁻¹', s: 'x!' },
          { id: 'logbase', lbl: 'log■□', s: '∑', a: '∏' }
        ],
        // Hàng 2: a/b, √, x², xⁿ, log, ln
        [
          { id: 'frac', lbl: '■/□', s: '÷R' },
          { id: 'sqrt', lbl: '√■', s: '∛' },
          { id: 'x2', lbl: 'x²', s: 'x³', b: 'DEC' },
          { id: 'xpow', lbl: 'x■', s: 'ⁿ√', b: 'HEX' },
          { id: 'log', lbl: 'log', s: '10ˣ', b: 'BIN' },
          { id: 'ln', lbl: 'ln', s: 'eˣ', b: 'OCT' }
        ],
        // Hàng 3: (-), °′″, hyp, sin, cos, tan
        [
          { id: 'neg', lbl: '(−)', s: '∠', a: 'A' },
          { id: 'dms', lbl: '°′″', s: 'FACT', a: 'B' },
          { id: 'hyp', lbl: 'hyp', s: 'Abs', a: 'C' },
          { id: 'sin', lbl: 'sin', s: 'sin⁻¹', a: 'D' },
          { id: 'cos', lbl: 'cos', s: 'cos⁻¹', a: 'E' },
          { id: 'tan', lbl: 'tan', s: 'tan⁻¹', a: 'F' }
        ],
        // Hàng 4: RCL, ENG, (, ), S⇔D, M+
        [
          { id: 'rcl', lbl: 'RCL', s: 'STO' },
          { id: 'eng', lbl: 'ENG', a: 'i' },
          { id: 'lparen', lbl: '(', s: '%' },
          { id: 'rparen', lbl: ')', s: ',', a: 'X' },
          { id: 'sd', lbl: 'S⇔D', a: 'Y' },
          { id: 'mplus', lbl: 'M+', s: 'M−', a: 'M' }
        ]
      ];

      const numRows = [
        [
          { id: '7', lbl: '7', s: 'CONST' },
          { id: '8', lbl: '8', s: 'CONV' },
          { id: '9', lbl: '9', s: 'CLR' },
          { id: 'del', lbl: 'DEL', s: 'INS', cls: 'orange' },
          { id: 'ac', lbl: 'AC', s: 'OFF', cls: 'orange' }
        ],
        [
          { id: '4', lbl: '4', s: 'MATRIX' },
          { id: '5', lbl: '5', s: 'VECTOR' },
          { id: '6', lbl: '6' },
          { id: 'mul', lbl: '×', s: 'nPr', a: 'GCD', cls: 'op' },
          { id: 'div', lbl: '÷', s: 'nCr', a: 'LCM', cls: 'op' }
        ],
        [
          { id: '1', lbl: '1', s: 'STAT' },
          { id: '2', lbl: '2', s: 'CMPLX' },
          { id: '3', lbl: '3', s: 'BASE' },
          { id: 'add', lbl: '+', s: 'Pol', a: 'Int', cls: 'op' },
          { id: 'sub', lbl: '−', s: 'Rec', a: 'Intg', cls: 'op' }
        ],
        [
          { id: '0', lbl: '0', s: 'Rnd' },
          { id: 'dot', lbl: '.', s: 'Ran#', a: 'RanInt' },
          { id: 'exp10', lbl: '×10ˣ', s: 'π', a: 'e' },
          { id: 'ans', lbl: 'Ans', a: 'PreAns' },
          { id: 'eq', lbl: '=', cls: 'eq' }
        ]
      ];

      const renderLegend = (k) => {
        const parts = [];
        if (k.s) parts.push(`<span class="fx570-leg-s">${escapeHtml(k.s)}</span>`);
        if (k.a) parts.push(`<span class="fx570-leg-a">${escapeHtml(k.a)}</span>`);
        if (k.b) parts.push(`<span class="fx570-leg-b">${escapeHtml(k.b)}</span>`);
        return `<div class="fx570-legends">${parts.join('')}</div>`;
      };

      const sciHtml = sciRows
        .map((row) =>
          row
            .map((k) => {
              if (!k) return '<div></div>';
              return `<div class="fx570-key-cell">${renderLegend(k)}<button type="button" data-fx-key="${k.id}" class="fx570-sci-btn">${escapeHtml(k.lbl)}</button></div>`;
            })
            .join('')
        )
        .join('');

      const numHtml = numRows
        .map((row) =>
          row
            .map((k) => {
              return `<div class="fx570-key-cell">${renderLegend(k)}<button type="button" data-fx-key="${k.id}" class="fx570-num-btn ${k.cls || ''}">${escapeHtml(k.lbl)}</button></div>`;
            })
            .join('')
        )
        .join('');

      return `
        <div class="fx570-chassis" data-fx-chassis tabindex="0" aria-label="Máy tính khoa học Casio fx-570VN PLUS">
          <div class="fx570-brand-row">
            <span class="fx570-brand-casio">CASIO</span>
            <span class="fx570-brand-model">fx-570VN PLUS</span>
          </div>
          <div class="fx570-vpam">NATURAL-V.P.A.M.</div>

          <div class="fx570-lcd-bezel">
            <div class="fx570-lcd">
              <div class="fx570-lcd-flags" data-fx-lcd-flags></div>
              <div class="fx570-lcd-expr" data-fx-lcd-expr></div>
              <div class="fx570-lcd-result" data-fx-lcd-result>0</div>
            </div>
          </div>

          <div class="fx570-top-cluster">
            <div class="fx570-key-cell">
              <div class="fx570-legends"><span class="fx570-leg-s">SHIFT</span></div>
              <button type="button" data-fx-key="shift" class="fx570-pill-btn">SHIFT</button>
            </div>
            <div class="fx570-key-cell">
              <div class="fx570-legends"><span class="fx570-leg-a">ALPHA</span></div>
              <button type="button" data-fx-key="alpha" class="fx570-pill-btn">ALPHA</button>
            </div>
            <div class="fx570-replay-pad">
              <span>REPLAY</span>
              <button type="button" data-fx-key="replay_up" class="fx570-replay-dir up" title="Lịch sử trước">▲</button>
              <button type="button" data-fx-key="replay_down" class="fx570-replay-dir down" title="Lịch sử sau">▼</button>
              <button type="button" data-fx-key="replay_left" class="fx570-replay-dir left" title="Sang trái">◄</button>
              <button type="button" data-fx-key="replay_right" class="fx570-replay-dir right" title="Sang phải">►</button>
            </div>
            <div class="fx570-key-cell">
              <div class="fx570-legends"><span class="fx570-leg-s">SETUP</span></div>
              <button type="button" data-fx-key="mode" class="fx570-pill-btn">MODE</button>
            </div>
            <div class="fx570-key-cell">
              <div class="fx570-legends"><span style="color:#1e293b">ON</span></div>
              <button type="button" data-fx-key="on" class="fx570-pill-btn">ON</button>
            </div>
          </div>

          <div class="fx570-sci-grid">${sciHtml}</div>
          <div class="fx570-num-grid">${numHtml}</div>

          <div data-fx-subpanel-host></div>
        </div>
      `;
    }

    renderSubPanel() {
      if (!this.rootHost) return;
      const host = this.rootHost.querySelector('[data-fx-subpanel-host]');
      if (!host) return;
      if (!this.subPanel) {
        host.innerHTML = '';
        return;
      }

      if (this.subPanel === 'MODE') {
        const modes = [
          ['COMP', '1: COMP (Tính toán chung)'],
          ['CMPLX', '2: CMPLX (Số phức a+bi)'],
          ['STAT', '3: STAT (Thống kê / Hồi quy)'],
          ['BASE', '4: BASE-N (DEC/HEX/BIN/OCT)'],
          ['EQN', '5: EQN (Giải PT & Hệ PT)'],
          ['MATRIX', '6: MATRIX (Ma trận 2×2, 3×3)'],
          ['TABLE', '7: TABLE (Bảng giá trị f(x))'],
          ['VECTOR', '8: VECTOR (Tích vô/có hướng)'],
          ['INEQ', '9: INEQ (Bất phương trình Bậc 2–3)']
        ];
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-sky-300">
              <span>⚙️ CHỌN CHẾ ĐỘ MODE (fx-570VN PLUS)</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="grid grid-cols-1 gap-1">
              ${modes
                .map(
                  ([k, label]) =>
                    `<button type="button" data-fx-pick-mode="${k}" class="text-left px-2.5 py-1.5 rounded-lg border ${
                      this.mode === k ? 'border-emerald-400 bg-emerald-950/60 text-emerald-200' : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100'
                    } font-bold transition">${escapeHtml(label)}</button>`
                )
                .join('')}
            </div>
          </div>
        `;
      } else if (this.subPanel === 'SETUP') {
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-amber-300">
              <span>🛠️ CÀI ĐẶT SETUP (Góc & Định dạng)</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="space-y-1.5">
              <div class="font-bold text-zinc-400">Đơn vị góc lượng giác:</div>
              <div class="grid grid-cols-3 gap-1.5">
                ${['DEG', 'RAD', 'GRA']
                  .map(
                    (u) =>
                      `<button type="button" data-fx-set-angle="${u}" class="py-1.5 rounded-lg border font-extrabold ${
                        this.math.angleUnit === u ? 'border-emerald-400 bg-emerald-600 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-200'
                      }">${u}</button>`
                  )
                  .join('')}
              </div>
              <div class="font-bold text-zinc-400 pt-1">Chế độ làm tròn hiển thị:</div>
              <div class="grid grid-cols-3 gap-1.5">
                ${['NORM', 'FIX', 'SCI']
                  .map(
                    (m) =>
                      `<button type="button" data-fx-set-disp="${m}" class="py-1.5 rounded-lg border font-extrabold ${
                        this.math.displayMode === m ? 'border-sky-400 bg-sky-600 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-200'
                      }">${m}</button>`
                  )
                  .join('')}
              </div>
            </div>
          </div>
        `;
      } else if (this.subPanel === 'CONST') {
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-amber-300">
              <span>⚛️ 40 Hằng Số Khoa Học (SHIFT+7 CONST)</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="max-h-48 overflow-y-auto space-y-1 pr-1">
              ${FX570_CONSTANTS.map(
                (c) => `
                <button type="button" data-fx-insert-const="${c.value}" class="w-full text-left px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-2">
                  <span><strong class="text-amber-300">${c.code} · ${escapeHtml(c.symbol)}</strong> <span class="text-zinc-400">${escapeHtml(c.name)}</span></span>
                  <span class="font-mono text-[10px] text-emerald-300 shrink-0">${c.value} ${escapeHtml(c.unit)}</span>
                </button>`
              ).join('')}
            </div>
          </div>
        `;
      } else if (this.subPanel === 'CONV') {
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-cyan-300">
              <span>📏 28 Đổi Đơn Vị Nhanh (SHIFT+8 CONV)</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="flex items-center gap-1.5">
              <input type="number" step="any" data-fx-conv-input value="${escapeHtml(this.lastNumericResult || 1)}" class="flex-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs" />
              <span class="text-zinc-400 text-[10px]">Nhập giá trị rồi bấm đơn vị</span>
            </div>
            <div class="max-h-44 overflow-y-auto grid grid-cols-2 gap-1 pr-1">
              ${FX570_CONVERSIONS.map(
                (cv, idx) =>
                  `<button type="button" data-fx-run-conv="${idx}" class="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-cyan-950 border border-zinc-700 text-left font-bold text-cyan-200">${cv.code}: ${escapeHtml(cv.label)}</button>`
              ).join('')}
            </div>
          </div>
        `;
      } else if (this.subPanel === 'CMPLX_UI') {
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-fuchsia-300">
              <span>🔮 MODE 2: CMPLX (Số Phức a + bi)</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="text-zinc-300 text-[10.5px]">Nhập trực tiếp biểu thức số phức trên máy tính (VD: <code class="text-amber-300">(3+4i)/(1-2i)</code> hoặc <code class="text-amber-300">5∠30 + 2i</code>), bấm <strong>=</strong> rồi bấm <strong>S⇔D</strong> để đổi dạng đại số ⇄ cực r∠θ!</div>
            <div class="grid grid-cols-3 gap-1">
              <button type="button" data-fx-cmplx-ins="i" class="py-1 rounded bg-zinc-800 hover:bg-fuchsia-900 font-bold text-fuchsia-200">Chèn i</button>
              <button type="button" data-fx-cmplx-ins="∠" class="py-1 rounded bg-zinc-800 hover:bg-fuchsia-900 font-bold text-fuchsia-200">Chèn ∠</button>
              <button type="button" data-fx-cmplx-ins="Conjg()" class="py-1 rounded bg-zinc-800 hover:bg-fuchsia-900 font-bold text-fuchsia-200">Conjg()</button>
              <button type="button" data-fx-cmplx-ins="Abs()" class="py-1 rounded bg-zinc-800 hover:bg-fuchsia-900 font-bold text-fuchsia-200">Abs()</button>
              <button type="button" data-fx-cmplx-ins="arg()" class="py-1 rounded bg-zinc-800 hover:bg-fuchsia-900 font-bold text-fuchsia-200">arg()</button>
              <button type="button" data-fx-cmplx-demo class="py-1 rounded bg-fuchsia-700 hover:bg-fuchsia-600 font-bold text-white">Mẫu (3+4i)²</button>
            </div>
          </div>
        `;
      } else if (this.subPanel === 'BASE_UI') {
        const conv = BaseNEngine.convertAll(this.baseValue);
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-emerald-300">
              <span>💻 MODE 4: BASE-N (Hệ Cơ Số)</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="grid grid-cols-4 gap-1">
              ${[
                [10, 'DEC'],
                [16, 'HEX'],
                [2, 'BIN'],
                [8, 'OCT']
              ]
                .map(
                  ([b, lbl]) =>
                    `<button type="button" data-fx-set-base="${b}" class="py-1 rounded font-extrabold border ${
                      this.baseMode === b ? 'border-emerald-400 bg-emerald-600 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-300'
                    }">${lbl}</button>`
                )
                .join('')}
            </div>
            <div class="flex gap-1.5">
              <input type="text" data-fx-base-input value="${escapeHtml(this.baseMode === 16 ? conv.hex : this.baseMode === 2 ? conv.bin : this.baseMode === 8 ? conv.oct : conv.dec)}" class="flex-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white font-mono" placeholder="Nhập số ở hệ đang chọn..." />
              <button type="button" data-fx-base-calc class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold">Đổi</button>
            </div>
            <div class="space-y-1 font-mono text-[10.5px] bg-zinc-950 p-2 rounded-lg border border-zinc-800">
              <div><strong class="text-sky-300">DEC:</strong> ${escapeHtml(conv.dec)}</div>
              <div><strong class="text-amber-300">HEX:</strong> ${escapeHtml(conv.hex)}</div>
              <div><strong class="text-emerald-300">BIN:</strong> ${escapeHtml(conv.bin)}</div>
              <div><strong class="text-purple-300">OCT:</strong> ${escapeHtml(conv.oct)}</div>
            </div>
          </div>
        `;
      } else if (this.subPanel === 'EQN_UI') {
        const subTabs = [
          ['LIN2', 'Hệ 2 ẩn'],
          ['LIN3', 'Hệ 3 ẩn'],
          ['QUAD', 'Bậc 2'],
          ['CUBIC', 'Bậc 3']
        ];
        let fieldsHtml = '';
        if (this.eqnSubMode === 'LIN2') {
          fieldsHtml = `
            <div class="text-zinc-400">a₁x + b₁y = c₁ ; a₂x + b₂y = c₂</div>
            <div class="grid grid-cols-3 gap-1">
              <input type="number" step="any" data-eqn-f="a1" value="2" placeholder="a1" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="b1" value="1" placeholder="b1" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="c1" value="5" placeholder="c1" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="a2" value="1" placeholder="a2" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="b2" value="-1" placeholder="b2" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="c2" value="1" placeholder="c2" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
            </div>`;
        } else if (this.eqnSubMode === 'LIN3') {
          const def = [
            [1, 1, 1, 6],
            [2, -1, 1, 3],
            [1, 2, -1, 2]
          ];
          fieldsHtml = `
            <div class="text-zinc-400">aₙx + bₙy + cₙz = dₙ</div>
            <div class="grid grid-cols-4 gap-1">
              ${def
                .map((row, r) =>
                  row
                    .map(
                      (val, c) =>
                        `<input type="number" step="any" data-eqn-f="m${r}_${c}" value="${val}" class="px-1 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-[10.5px]" />`
                    )
                    .join('')
                )
                .join('')}
            </div>`;
        } else if (this.eqnSubMode === 'QUAD') {
          fieldsHtml = `
            <div class="text-zinc-400">ax² + bx + c = 0</div>
            <div class="grid grid-cols-3 gap-1">
              <input type="number" step="any" data-eqn-f="a" value="1" placeholder="a" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="b" value="-5" placeholder="b" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="c" value="6" placeholder="c" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
            </div>`;
        } else {
          fieldsHtml = `
            <div class="text-zinc-400">ax³ + bx² + cx + d = 0</div>
            <div class="grid grid-cols-4 gap-1">
              <input type="number" step="any" data-eqn-f="a" value="1" placeholder="a" class="px-1 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="b" value="-6" placeholder="b" class="px-1 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="c" value="11" placeholder="c" class="px-1 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-eqn-f="d" value="-6" placeholder="d" class="px-1 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
            </div>`;
        }
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-emerald-300">
              <span>📐 MODE 5: EQN (Giải Phương Trình)</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="grid grid-cols-4 gap-1">
              ${subTabs
                .map(
                  ([k, lbl]) =>
                    `<button type="button" data-eqn-sub="${k}" class="py-1 rounded font-bold border ${
                      this.eqnSubMode === k ? 'border-emerald-400 bg-emerald-600 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-300'
                    }">${lbl}</button>`
                )
                .join('')}
            </div>
            ${fieldsHtml}
            <div class="flex gap-1.5">
              <button type="button" data-eqn-solve class="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold">✅ Giải Ngay (=)</button>
              ${
                this.eqnSubMode === 'QUAD' || this.eqnSubMode === 'CUBIC'
                  ? '<button type="button" data-eqn-plot class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold">📈 Vẽ Đồ Thị</button>'
                  : ''
              }
            </div>
            <div data-eqn-output class="p-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[10.5px] text-emerald-200 whitespace-pre-line">Bấm "Giải Ngay" để xem nghiệm chính xác...</div>
          </div>
        `;
      } else if (this.subPanel === 'INEQ_UI') {
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-amber-300">
              <span>⚡ MODE 9: INEQ (Bất Phương Trình VN PLUS)</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="grid grid-cols-2 gap-1">
              <button type="button" data-ineq-deg="QUAD" class="py-1 rounded font-bold border ${this.ineqSubMode === 'QUAD' ? 'border-amber-400 bg-amber-600 text-white' : 'border-zinc-700 bg-zinc-900'}">Bậc 2 (ax²+bx+c)</button>
              <button type="button" data-ineq-deg="CUBIC" class="py-1 rounded font-bold border ${this.ineqSubMode === 'CUBIC' ? 'border-amber-400 bg-amber-600 text-white' : 'border-zinc-700 bg-zinc-900'}">Bậc 3 (ax³+bx²+cx+d)</button>
            </div>
            <div class="grid grid-cols-4 gap-1">
              ${['>', '<', '>=', '<=']
                .map(
                  (op) =>
                    `<button type="button" data-ineq-op="${op}" class="py-1 rounded font-extrabold border ${
                      this.ineqOp === op ? 'border-sky-400 bg-sky-600 text-white' : 'border-zinc-700 bg-zinc-900'
                    }">${op === '>=' ? '≥ 0' : op === '<=' ? '≤ 0' : `${op} 0`}</button>`
                )
                .join('')}
            </div>
            <div class="grid ${this.ineqSubMode === 'QUAD' ? 'grid-cols-3' : 'grid-cols-4'} gap-1">
              <input type="number" step="any" data-ineq-f="a" value="1" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-ineq-f="b" value="-3" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              <input type="number" step="any" data-ineq-f="c" value="2" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />
              ${this.ineqSubMode === 'CUBIC' ? '<input type="number" step="any" data-ineq-f="d" value="0" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white" />' : ''}
            </div>
            <button type="button" data-ineq-solve class="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-extrabold">✅ Giải Bất Phương Trình</button>
            <div data-ineq-output class="p-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-amber-200">Bấm giải để xem tập nghiệm...</div>
          </div>
        `;
      } else if (this.subPanel === 'MATRIX_UI') {
        const n = this.matSize;
        const renderGrid = (tag, mat) =>
          `<div class="grid ${n === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1">${Array.from({ length: n })
            .map((_, r) =>
              Array.from({ length: n })
                .map(
                  (__, c) =>
                    `<input type="number" step="any" data-mat-cell="${tag}_${r}_${c}" value="${mat[r][c]}" class="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white text-center font-mono text-[10.5px]" />`
                )
                .join('')
            )
            .join('')}</div>`;
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-indigo-300">
              <span>🧮 MODE 6: MATRIX (${n}×${n})</span>
              <div class="flex items-center gap-1">
                <button type="button" data-mat-size="2" class="px-1.5 py-0.5 rounded ${n === 2 ? 'bg-indigo-600 text-white' : 'bg-zinc-800'}">2×2</button>
                <button type="button" data-mat-size="3" class="px-1.5 py-0.5 rounded ${n === 3 ? 'bg-indigo-600 text-white' : 'bg-zinc-800'}">3×3</button>
                <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div><div class="font-bold text-indigo-200 mb-1">MatA</div>${renderGrid('A', this.matA)}</div>
              <div><div class="font-bold text-cyan-200 mb-1">MatB</div>${renderGrid('B', this.matB)}</div>
            </div>
            <div class="grid grid-cols-3 gap-1">
              <button type="button" data-mat-op="ADD" class="py-1 rounded bg-zinc-800 hover:bg-indigo-700 font-bold">A + B</button>
              <button type="button" data-mat-op="SUB" class="py-1 rounded bg-zinc-800 hover:bg-indigo-700 font-bold">A − B</button>
              <button type="button" data-mat-op="MUL" class="py-1 rounded bg-zinc-800 hover:bg-indigo-700 font-bold">A × B</button>
              <button type="button" data-mat-op="DET_A" class="py-1 rounded bg-zinc-800 hover:bg-indigo-700 font-bold">det(A)</button>
              <button type="button" data-mat-op="INV_A" class="py-1 rounded bg-zinc-800 hover:bg-indigo-700 font-bold">A⁻¹</button>
              <button type="button" data-mat-op="TRN_A" class="py-1 rounded bg-zinc-800 hover:bg-indigo-700 font-bold">Trn(A)</button>
            </div>
            <div data-mat-output class="p-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[10.5px] text-indigo-200 whitespace-pre">Chọn phép toán ma trận...</div>
          </div>
        `;
      } else if (this.subPanel === 'VECTOR_UI') {
        const d = this.vecDim;
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-teal-300">
              <span>🧭 MODE 8: VECTOR (${d}D)</span>
              <div class="flex items-center gap-1">
                <button type="button" data-vec-dim="2" class="px-1.5 py-0.5 rounded ${d === 2 ? 'bg-teal-600 text-white' : 'bg-zinc-800'}">2D</button>
                <button type="button" data-vec-dim="3" class="px-1.5 py-0.5 rounded ${d === 3 ? 'bg-teal-600 text-white' : 'bg-zinc-800'}">3D</button>
                <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
              </div>
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-1"><span class="w-10 font-bold text-teal-200">VctA:</span>${Array.from({ length: d })
                .map((_, i) => `<input type="number" step="any" data-vec-cell="A_${i}" value="${this.vecA[i]}" class="w-full px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white text-center font-mono" />`)
                .join('')}</div>
              <div class="flex items-center gap-1"><span class="w-10 font-bold text-cyan-200">VctB:</span>${Array.from({ length: d })
                .map((_, i) => `<input type="number" step="any" data-vec-cell="B_${i}" value="${this.vecB[i]}" class="w-full px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white text-center font-mono" />`)
                .join('')}</div>
            </div>
            <div class="grid grid-cols-3 gap-1">
              <button type="button" data-vec-op="DOT" class="py-1 rounded bg-zinc-800 hover:bg-teal-700 font-bold">A · B</button>
              <button type="button" data-vec-op="CROSS" class="py-1 rounded bg-zinc-800 hover:bg-teal-700 font-bold">A × B</button>
              <button type="button" data-vec-op="ANGLE" class="py-1 rounded bg-zinc-800 hover:bg-teal-700 font-bold">∠(A,B)</button>
              <button type="button" data-vec-op="ADD" class="py-1 rounded bg-zinc-800 hover:bg-teal-700 font-bold">A + B</button>
              <button type="button" data-vec-op="SUB" class="py-1 rounded bg-zinc-800 hover:bg-teal-700 font-bold">A − B</button>
              <button type="button" data-vec-op="MAG_A" class="py-1 rounded bg-zinc-800 hover:bg-teal-700 font-bold">|A|</button>
            </div>
            <div data-vec-output class="p-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[10.5px] text-teal-200">Chọn phép toán vectơ...</div>
          </div>
        `;
      } else if (this.subPanel === 'STAT_UI') {
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-rose-300">
              <span>📊 MODE 3: STAT (Thống Kê)</span>
              <div class="flex items-center gap-1">
                <button type="button" data-stat-mode="1" class="px-1.5 py-0.5 rounded ${!this.statTwoVar ? 'bg-rose-600 text-white' : 'bg-zinc-800'}">1-VAR</button>
                <button type="button" data-stat-mode="2" class="px-1.5 py-0.5 rounded ${this.statTwoVar ? 'bg-rose-600 text-white' : 'bg-zinc-800'}">A+BX</button>
                <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
              </div>
            </div>
            <div class="max-h-32 overflow-y-auto space-y-1">
              ${this.statRows
                .map(
                  (r, idx) => `
                <div class="grid ${this.statTwoVar ? 'grid-cols-3' : 'grid-cols-2'} gap-1">
                  <input type="number" step="any" data-stat-cell="${idx}_x" value="${escapeHtml(r.x)}" placeholder="X" class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white font-mono" />
                  ${
                    this.statTwoVar
                      ? `<input type="number" step="any" data-stat-cell="${idx}_y" value="${escapeHtml(r.y)}" placeholder="Y" class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white font-mono" />`
                      : ''
                  }
                  <input type="number" step="any" data-stat-cell="${idx}_f" value="${escapeHtml(r.f)}" placeholder="Freq" class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono" />
                </div>`
                )
                .join('')}
            </div>
            <div class="flex gap-1">
              <button type="button" data-stat-add-row class="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 font-bold">+ Dòng</button>
              <button type="button" data-stat-calc class="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold">Tính Thống Kê</button>
            </div>
            <div data-stat-output class="p-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[10px] text-rose-200 whitespace-pre-line">Bấm "Tính Thống Kê" để xem x̄, σx, sx, Q1, Med, Q3...</div>
          </div>
        `;
      } else if (this.subPanel === 'TABLE_UI') {
        host.innerHTML = `
          <div class="fx570-subpanel space-y-2">
            <div class="flex items-center justify-between font-extrabold text-sky-300">
              <span>📋 MODE 7: TABLE (Bảng f(x) & g(x))</span>
              <button type="button" data-fx-close-sub class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-white">✕</button>
            </div>
            <div class="space-y-1">
              <input type="text" data-tbl-fx value="${escapeHtml(this.tableFx)}" placeholder="f(x) = ..." class="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white font-mono" />
              <input type="text" data-tbl-gx value="${escapeHtml(this.tableGx)}" placeholder="g(x) = ... (tùy chọn)" class="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono" />
              <div class="grid grid-cols-3 gap-1">
                <input type="number" step="any" data-tbl-start value="${this.tableStart}" placeholder="Start" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white font-mono" />
                <input type="number" step="any" data-tbl-end value="${this.tableEnd}" placeholder="End" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white font-mono" />
                <input type="number" step="any" data-tbl-step value="${this.tableStep}" placeholder="Step" class="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white font-mono" />
              </div>
            </div>
            <div class="flex gap-1.5">
              <button type="button" data-tbl-run class="flex-1 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-extrabold">Tạo Bảng</button>
              <button type="button" data-tbl-plot class="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold">📈 Vẽ</button>
            </div>
            <div data-tbl-output class="max-h-36 overflow-y-auto p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[10px]"></div>
          </div>
        `;
      }

      this.bindSubPanelEvents(host);
      translateTree(host);
    }

    bindSubPanelEvents(host) {
      host.querySelector('[data-fx-close-sub]')?.addEventListener('click', () => {
        this.subPanel = '';
        this.renderSubPanel();
      });

      host.querySelectorAll('[data-fx-pick-mode]').forEach((b) => {
        b.addEventListener('click', () => this.switchCalcMode(b.getAttribute('data-fx-pick-mode')));
      });
      host.querySelectorAll('[data-fx-set-angle]').forEach((b) => {
        b.addEventListener('click', () => {
          this.math.angleUnit = b.getAttribute('data-fx-set-angle');
          this.saveState();
          this.updateLcdOnly();
          this.renderSubPanel();
        });
      });
      host.querySelectorAll('[data-fx-set-disp]').forEach((b) => {
        b.addEventListener('click', () => {
          this.math.displayMode = b.getAttribute('data-fx-set-disp');
          this.saveState();
          this.updateLcdOnly();
          this.renderSubPanel();
        });
      });
      host.querySelectorAll('[data-fx-insert-const]').forEach((b) => {
        b.addEventListener('click', () => {
          this.insertToken(b.getAttribute('data-fx-insert-const'));
          this.subPanel = '';
          this.renderSubPanel();
        });
      });
      host.querySelectorAll('[data-fx-run-conv]').forEach((b) => {
        b.addEventListener('click', () => {
          const idx = Number(b.getAttribute('data-fx-run-conv'));
          const inp = host.querySelector('[data-fx-conv-input]');
          const v = Number(inp ? inp.value : 1) || 0;
          const cv = FX570_CONVERSIONS[idx];
          if (cv) {
            const out = cv.fn(v);
            this.lastNumericResult = out;
            this.inputExpr = `${v} (${cv.label})`;
            this.cursorPos = this.inputExpr.length;
            this.lastExactDisplay = formatDecimalNumber(out);
            this.lastDecimalDisplay = this.lastExactDisplay;
            this.updateLcdOnly();
          }
        });
      });

      // CMPLX shortcuts
      host.querySelectorAll('[data-fx-cmplx-ins]').forEach((b) => {
        b.addEventListener('click', () => {
          const t = b.getAttribute('data-fx-cmplx-ins');
          this.insertToken(t, t.endsWith('()') ? 1 : 0);
        });
      });
      host.querySelector('[data-fx-cmplx-demo]')?.addEventListener('click', () => {
        this.inputExpr = '(3+4i)^2';
        this.cursorPos = this.inputExpr.length;
        this.evaluateCurrentExpression();
      });

      // BASE-N
      host.querySelectorAll('[data-fx-set-base]').forEach((b) => {
        b.addEventListener('click', () => {
          this.baseMode = Number(b.getAttribute('data-fx-set-base'));
          this.updateLcdOnly();
          this.renderSubPanel();
        });
      });
      host.querySelector('[data-fx-base-calc]')?.addEventListener('click', () => {
        const inp = host.querySelector('[data-fx-base-input]');
        try {
          this.baseValue = BaseNEngine.parseInBase(inp ? inp.value : '0', this.baseMode);
          this.lastError = '';
          this.renderSubPanel();
          this.updateLcdOnly();
        } catch (err) {
          this.lastError = err.message;
          this.updateLcdOnly();
        }
      });

      // EQN
      host.querySelectorAll('[data-eqn-sub]').forEach((b) => {
        b.addEventListener('click', () => {
          this.eqnSubMode = b.getAttribute('data-eqn-sub');
          this.renderSubPanel();
        });
      });
      const readEqnNum = (k) => Number(host.querySelector(`[data-eqn-f="${k}"]`)?.value) || 0;
      host.querySelector('[data-eqn-solve]')?.addEventListener('click', () => {
        const outEl = host.querySelector('[data-eqn-output]');
        let res;
        if (this.eqnSubMode === 'LIN2') {
          res = EqnAndIneqEngine.solveLinear2(
            readEqnNum('a1'), readEqnNum('b1'), readEqnNum('c1'),
            readEqnNum('a2'), readEqnNum('b2'), readEqnNum('c2')
          );
        } else if (this.eqnSubMode === 'LIN3') {
          const rows = [0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => readEqnNum(`m${r}_${c}`)));
          res = EqnAndIneqEngine.solveLinear3(rows);
        } else if (this.eqnSubMode === 'QUAD') {
          res = EqnAndIneqEngine.solveQuadratic(readEqnNum('a'), readEqnNum('b'), readEqnNum('c'));
        } else {
          res = EqnAndIneqEngine.solveCubic(readEqnNum('a'), readEqnNum('b'), readEqnNum('c'), readEqnNum('d'));
        }
        const txt = (res.lines || []).join('\n');
        if (outEl) outEl.textContent = txt;
        this.lastExactDisplay = (res.lines && res.lines[0]) || 'Done';
        this.lastDecimalDisplay = this.lastExactDisplay;
        this.updateLcdOnly();
      });
      host.querySelector('[data-eqn-plot]')?.addEventListener('click', () => {
        const a = readEqnNum('a');
        const b = readEqnNum('b');
        const c = readEqnNum('c');
        if (this.eqnSubMode === 'QUAD') {
          this.plotFunctionFromCalc(`y = ${a}*x^2 + (${b})*x + (${c})`);
        } else {
          const d = readEqnNum('d');
          this.plotFunctionFromCalc(`y = ${a}*x^3 + (${b})*x^2 + (${c})*x + (${d})`);
        }
      });

      // INEQ
      host.querySelectorAll('[data-ineq-deg]').forEach((b) => {
        b.addEventListener('click', () => {
          this.ineqSubMode = b.getAttribute('data-ineq-deg');
          this.renderSubPanel();
        });
      });
      host.querySelectorAll('[data-ineq-op]').forEach((b) => {
        b.addEventListener('click', () => {
          this.ineqOp = b.getAttribute('data-ineq-op');
          this.renderSubPanel();
        });
      });
      host.querySelector('[data-ineq-solve]')?.addEventListener('click', () => {
        const g = (k) => Number(host.querySelector(`[data-ineq-f="${k}"]`)?.value) || 0;
        const coeffs = this.ineqSubMode === 'QUAD' ? [g('a'), g('b'), g('c')] : [g('a'), g('b'), g('c'), g('d')];
        const res = EqnAndIneqEngine.solveInequality(this.ineqSubMode === 'QUAD' ? 2 : 3, this.ineqOp, coeffs);
        const outEl = host.querySelector('[data-ineq-output]');
        if (outEl) outEl.textContent = res.text;
        this.lastExactDisplay = res.text;
        this.lastDecimalDisplay = res.text;
        this.updateLcdOnly();
      });

      // MATRIX
      host.querySelectorAll('[data-mat-size]').forEach((b) => {
        b.addEventListener('click', () => {
          this.matSize = Number(b.getAttribute('data-mat-size'));
          this.renderSubPanel();
        });
      });
      const readMatrices = () => {
        const n = this.matSize;
        const a = [];
        const b = [];
        for (let r = 0; r < n; r++) {
          const ra = [];
          const rb = [];
          for (let c = 0; c < n; c++) {
            const va = Number(host.querySelector(`[data-mat-cell="A_${r}_${c}"]`)?.value) || 0;
            const vb = Number(host.querySelector(`[data-mat-cell="B_${r}_${c}"]`)?.value) || 0;
            this.matA[r][c] = va;
            this.matB[r][c] = vb;
            ra.push(va);
            rb.push(vb);
          }
          a.push(ra);
          b.push(rb);
        }
        return { a, b };
      };
      host.querySelectorAll('[data-mat-op]').forEach((b) => {
        b.addEventListener('click', () => {
          const op = b.getAttribute('data-mat-op');
          const { a, b: mb } = readMatrices();
          const outEl = host.querySelector('[data-mat-output]');
          try {
            let txt = '';
            if (op === 'DET_A') {
              const d = MatrixAndVectorEngine.det(a);
              txt = `det(MatA) = ${formatDecimalNumber(d)}`;
            } else {
              const m =
                op === 'ADD'
                  ? MatrixAndVectorEngine.add(a, mb, 1)
                  : op === 'SUB'
                    ? MatrixAndVectorEngine.add(a, mb, -1)
                    : op === 'MUL'
                      ? MatrixAndVectorEngine.multiply(a, mb)
                      : op === 'INV_A'
                        ? MatrixAndVectorEngine.inverse(a)
                        : MatrixAndVectorEngine.transpose(a);
              txt = m.map((row) => '[ ' + row.map((v) => formatDecimalNumber(v, 'NORM', 4)).join(' , ') + ' ]').join('\n');
            }
            if (outEl) outEl.textContent = txt;
          } catch (err) {
            if (outEl) outEl.textContent = err.message;
          }
        });
      });

      // VECTOR
      host.querySelectorAll('[data-vec-dim]').forEach((b) => {
        b.addEventListener('click', () => {
          this.vecDim = Number(b.getAttribute('data-vec-dim'));
          this.renderSubPanel();
        });
      });
      host.querySelectorAll('[data-vec-op]').forEach((b) => {
        b.addEventListener('click', () => {
          const op = b.getAttribute('data-vec-op');
          const a = [];
          const vb = [];
          for (let i = 0; i < this.vecDim; i++) {
            const va = Number(host.querySelector(`[data-vec-cell="A_${i}"]`)?.value) || 0;
            const vbi = Number(host.querySelector(`[data-vec-cell="B_${i}"]`)?.value) || 0;
            this.vecA[i] = va;
            this.vecB[i] = vbi;
            a.push(va);
            vb.push(vbi);
          }
          const outEl = host.querySelector('[data-vec-output]');
          try {
            const r = MatrixAndVectorEngine.computeVector(op, a, vb, this.math.angleUnit);
            const txt = r.vec
              ? `${r.label} = (${r.vec.map((v) => formatDecimalNumber(v)).join(', ')})`
              : `${r.label} = ${formatDecimalNumber(r.scalar)}`;
            if (outEl) outEl.textContent = txt;
          } catch (err) {
            if (outEl) outEl.textContent = err.message;
          }
        });
      });

      // STAT
      host.querySelectorAll('[data-stat-mode]').forEach((b) => {
        b.addEventListener('click', () => {
          this.statTwoVar = b.getAttribute('data-stat-mode') === '2';
          this.renderSubPanel();
        });
      });
      const readStatRows = () => {
        this.statRows.forEach((r, idx) => {
          const ix = host.querySelector(`[data-stat-cell="${idx}_x"]`);
          const iy = host.querySelector(`[data-stat-cell="${idx}_y"]`);
          const ifq = host.querySelector(`[data-stat-cell="${idx}_f"]`);
          if (ix) r.x = ix.value;
          if (iy) r.y = iy.value;
          if (ifq) r.f = ifq.value;
        });
      };
      host.querySelector('[data-stat-add-row]')?.addEventListener('click', () => {
        readStatRows();
        this.statRows.push({ x: '', y: '', f: '1' });
        this.renderSubPanel();
      });
      host.querySelector('[data-stat-calc]')?.addEventListener('click', () => {
        readStatRows();
        const outEl = host.querySelector('[data-stat-output]');
        try {
          const st = StatEngine.compute(this.statRows, this.statTwoVar);
          const lines = [
            `n = ${st.n}  |  ∑x = ${formatDecimalNumber(st.sumX)}  |  x̄ = ${formatDecimalNumber(st.meanX)}`,
            `σx = ${formatDecimalNumber(st.sdPopX)}  |  sx = ${formatDecimalNumber(st.sdSampleX)}`,
            `Min=${st.minX} | Q1=${formatDecimalNumber(st.q1)} | Med=${formatDecimalNumber(st.med)} | Q3=${formatDecimalNumber(st.q3)} | Max=${st.maxX}`
          ];
          if (this.statTwoVar) {
            lines.push(`Hồi quy: y = ${formatDecimalNumber(st.regA)} + (${formatDecimalNumber(st.regB)})x  |  r = ${formatDecimalNumber(st.corrR)}`);
          }
          if (outEl) outEl.textContent = lines.join('\n');
        } catch (err) {
          if (outEl) outEl.textContent = err.message;
        }
      });

      // TABLE
      host.querySelector('[data-tbl-run]')?.addEventListener('click', () => {
        this.tableFx = host.querySelector('[data-tbl-fx]')?.value || 'x^2';
        this.tableGx = host.querySelector('[data-tbl-gx]')?.value || '';
        this.tableStart = Number(host.querySelector('[data-tbl-start]')?.value) || 0;
        this.tableEnd = Number(host.querySelector('[data-tbl-end]')?.value) || 5;
        this.tableStep = Math.max(0.05, Math.abs(Number(host.querySelector('[data-tbl-step]')?.value) || 1));
        const outEl = host.querySelector('[data-tbl-output]');
        const rows = [];
        for (let x = this.tableStart, cnt = 0; x <= this.tableEnd + 1e-9 && cnt < 65; x += this.tableStep, cnt++) {
          let fx = 'ERR';
          let gx = '';
          try {
            fx = formatDecimalNumber(this.math.evaluate(this.tableFx, { x, X: x }), 'NORM', 5);
          } catch (_e1) {}
          if (this.tableGx.trim()) {
            try {
              gx = formatDecimalNumber(this.math.evaluate(this.tableGx, { x, X: x }), 'NORM', 5);
            } catch (_e2) {
              gx = 'ERR';
            }
          }
          rows.push(
            `<tr class="border-b border-zinc-800/80"><td class="px-1.5 py-0.5 text-sky-300">${Number(x.toFixed(4))}</td><td class="px-1.5 py-0.5 text-emerald-300">${fx}</td>${
              this.tableGx.trim() ? `<td class="px-1.5 py-0.5 text-amber-300">${gx}</td>` : ''
            }</tr>`
          );
        }
        if (outEl) {
          outEl.innerHTML = `<table class="w-full text-left"><thead><tr class="text-zinc-400 border-b border-zinc-700"><th class="px-1.5">X</th><th class="px-1.5">f(X)</th>${
            this.tableGx.trim() ? '<th class="px-1.5">g(X)</th>' : ''
          }</tr></thead><tbody>${rows.join('')}</tbody></table>`;
        }
      });
      host.querySelector('[data-tbl-plot]')?.addEventListener('click', () => {
        const fx = host.querySelector('[data-tbl-fx]')?.value || this.tableFx;
        const gx = host.querySelector('[data-tbl-gx]')?.value || this.tableGx;
        if (fx.trim()) this.plotFunctionFromCalc(fx);
        if (gx.trim()) this.plotFunctionFromCalc(gx);
      });
    }

    buildDesmosPanelHtml() {
      return `
        <div class="desmos-shell ${this.graph.darkMode ? 'dark-graph' : ''}" data-desmos-shell>
          <div class="desmos-topbar">
            <div class="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
              <span class="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] tracking-wider">DESMOS LOCAL</span>
              <span>📈 Tạo Hàm Đồ Thị Tương Tác (100% Cục Bộ)</span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button type="button" data-desmos-undo class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold" title="Hoàn tác">↩</button>
              <button type="button" data-desmos-redo class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold" title="Làm lại">↪</button>
              <select data-desmos-preset class="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-bold text-[11px]">
                <option value="">✨ Chọn mẫu đồ thị đẹp...</option>
                ${DESMOS_PRESETS.map((p) => `<option value="${p.id}">${escapeHtml(p.label)}</option>`).join('')}
              </select>
              <button type="button" data-desmos-theme class="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold">${this.graph.darkMode ? '☀️ Sáng' : '🌙 Tối'}</button>
              <button type="button" data-desmos-png class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold">📸 Tải PNG</button>
            </div>
          </div>

          <div class="desmos-body">
            <div class="desmos-sidebar">
              <div class="p-2 border-b border-slate-300 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                <button type="button" data-desmos-add class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px]">＋ Thêm hàm số</button>
                <button type="button" data-desmos-add-slider class="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10.5px]">🎚️ + Tham số a</button>
              </div>
              <div data-desmos-expr-list class="flex-1 overflow-y-auto"></div>
              <div class="p-2 border-t border-slate-300 dark:border-zinc-800 space-y-1.5">
                <div class="text-[10px] font-bold opacity-70">Bàn phím toán nhanh (chèn vào ô đang chọn):</div>
                <div class="grid grid-cols-6 gap-1 text-[10.5px] font-bold">
                  ${['x', 'y', '^2', '^', 'sqrt()', 'abs()', 'sin()', 'cos()', 'tan()', 'ln()', 'pi', '<=']
                    .map(
                      (tok) =>
                        `<button type="button" data-desmos-keypad="${escapeHtml(tok)}" class="py-1 rounded border border-slate-300 bg-white hover:bg-sky-100 text-slate-900 font-mono">${escapeHtml(
                          tok.replace('sqrt()', '√').replace('abs()', '|x|').replace('pi', 'π').replace('<=', '≤')
                        )}</button>`
                    )
                    .join('')}
                </div>
              </div>
            </div>

            <div class="desmos-canvas-stage">
              <canvas data-desmos-canvas></canvas>
              <div class="desmos-canvas-controls">
                <button type="button" data-desmos-zoom-in class="desmos-map-btn" title="Phóng to">＋</button>
                <button type="button" data-desmos-zoom-out class="desmos-map-btn" title="Thu nhỏ">－</button>
                <button type="button" data-desmos-home class="desmos-map-btn" title="Về khung [-10, 10]">🏠</button>
                <button type="button" data-desmos-grid class="desmos-map-btn" title="Bật/Tắt lưới">#</button>
              </div>
              <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold pointer-events-none">
                💡 Kéo để di chuyển · Cuộn để phóng to/thu nhỏ · Rê chuột lên đường cong hoặc chấm xám để xem nghiệm & cực trị
              </div>
            </div>
          </div>
        </div>
      `;
    }

    renderDesmosSidebar() {
      if (!this.rootHost) return;
      const listEl = this.rootHost.querySelector('[data-desmos-expr-list]');
      if (!listEl) return;
      this.graph.syncParametersFromExpressions();

      listEl.innerHTML = this.graph.expressions
        .map((item, idx) => {
          const spec = this.graph.parseExpressionSpec(item.expr);
          const sliderObj = spec.kind === 'PARAM' ? this.graph.sliders[spec.name] : null;
          return `
            <div class="desmos-expr-row" data-expr-row-id="${item.id}">
              <div class="desmos-expr-gutter">
                <span>${idx + 1}</span>
                <button type="button" data-expr-toggle="${item.id}" class="desmos-color-dot" style="background:${item.visible ? item.color : 'transparent'}; border-color:${item.color};" title="Ẩn / Hiện đồ thị này"></button>
              </div>
              <div class="flex-1 p-1.5 min-w-0 space-y-1">
                <div class="flex items-center gap-1">
                  <input type="text" data-expr-input="${item.id}" value="${escapeHtml(item.expr)}" placeholder="VD: y = sin(x), x^2+y^2=9, r=3cos(3theta)..." class="w-full px-2 py-1 rounded border border-slate-300 bg-transparent font-mono text-xs focus:outline-none focus:border-sky-500 select-text" />
                  <button type="button" data-expr-del="${item.id}" class="px-1.5 py-1 rounded text-rose-500 hover:bg-rose-500/15 font-black text-xs shrink-0" title="Xóa biểu thức">✕</button>
                </div>
                ${
                  sliderObj
                    ? `<div class="flex items-center gap-1.5 text-[10px] pt-0.5">
                         <button type="button" data-slider-play="${spec.name}" class="px-1.5 py-0.5 rounded bg-sky-600 text-white font-bold">${sliderObj.playing ? '⏸' : '▶'}</button>
                         <span class="font-mono opacity-75">${sliderObj.min}</span>
                         <input type="range" data-slider-range="${spec.name}" min="${sliderObj.min}" max="${sliderObj.max}" step="${sliderObj.step}" value="${sliderObj.val}" class="flex-1 accent-sky-600" />
                         <span class="font-mono opacity-75">${sliderObj.max}</span>
                       </div>`
                    : ''
                }
              </div>
            </div>
          `;
        })
        .join('');

      listEl.querySelectorAll('[data-expr-input]').forEach((inp) => {
        inp.addEventListener('focus', () => {
          this._focusedDesmosInput = inp;
        });
        inp.addEventListener('input', () => {
          const id = inp.getAttribute('data-expr-input');
          const found = this.graph.expressions.find((x) => x.id === id);
          if (found) {
            found.expr = inp.value;
            this.graph.syncParametersFromExpressions();
            this.graph.render();
            this.saveState();
          }
        });
      });

      listEl.querySelectorAll('[data-expr-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-expr-toggle');
          const found = this.graph.expressions.find((x) => x.id === id);
          if (found) {
            found.visible = !found.visible;
            this.renderDesmosSidebar();
            this.graph.render();
          }
        });
      });

      listEl.querySelectorAll('[data-expr-del]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-expr-del');
          this.graph.pushHistory();
          this.graph.expressions = this.graph.expressions.filter((x) => x.id !== id);
          this.renderDesmosSidebar();
          this.graph.render();
          this.saveState();
        });
      });

      listEl.querySelectorAll('[data-slider-range]').forEach((rng) => {
        rng.addEventListener('input', () => {
          const name = rng.getAttribute('data-slider-range');
          const val = Number(rng.value);
          if (this.graph.sliders[name]) this.graph.sliders[name].val = val;
          const exprObj = this.graph.expressions.find((x) => this.graph.parseExpressionSpec(x.expr).name === name);
          if (exprObj) {
            exprObj.expr = `${name} = ${Number(val.toFixed(2))}`;
            const txtInp = listEl.querySelector(`[data-expr-input="${exprObj.id}"]`);
            if (txtInp) txtInp.value = exprObj.expr;
          }
          this.graph.render();
        });
      });

      listEl.querySelectorAll('[data-slider-play]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const name = btn.getAttribute('data-slider-play');
          const sl = this.graph.sliders[name];
          if (!sl) return;
          sl.playing = !sl.playing;
          btn.textContent = sl.playing ? '⏸' : '▶';
          this.ensureSliderAnimationLoop();
        });
      });

      translateTree(listEl);
    }

    ensureSliderAnimationLoop() {
      if (this._sliderAnimId) return;
      const step = () => {
        let anyPlaying = false;
        Object.keys(this.graph.sliders).forEach((name) => {
          const sl = this.graph.sliders[name];
          if (!sl || !sl.playing) return;
          anyPlaying = true;
          sl.val += sl.dir * 0.08;
          if (sl.val >= sl.max) {
            sl.val = sl.max;
            sl.dir = -1;
          } else if (sl.val <= sl.min) {
            sl.val = sl.min;
            sl.dir = 1;
          }
          const exprObj = this.graph.expressions.find((x) => this.graph.parseExpressionSpec(x.expr).name === name);
          if (exprObj) {
            exprObj.expr = `${name} = ${Number(sl.val.toFixed(2))}`;
            if (this.rootHost) {
              const inp = this.rootHost.querySelector(`[data-expr-input="${exprObj.id}"]`);
              const rng = this.rootHost.querySelector(`[data-slider-range="${name}"]`);
              if (inp) inp.value = exprObj.expr;
              if (rng) rng.value = String(sl.val);
            }
          }
        });
        if (anyPlaying && (!document.hidden) && this.rootHost && this.rootHost.offsetParent !== null) {
          this.graph.render();
          this._sliderAnimId = requestAnimationFrame(step);
        } else {
          this._sliderAnimId = null;
        }
      };
      this._sliderAnimId = requestAnimationFrame(step);
    }

    pauseBackgroundActivity() {
      if (this._sliderAnimId) {
        try { cancelAnimationFrame(this._sliderAnimId); } catch (_) {}
        this._sliderAnimId = null;
      }
      if (this.graph && this.graph.sliders) {
        Object.values(this.graph.sliders).forEach((sl) => { if (sl) sl.playing = false; });
      }
    }

    mountIntoContainer(containerEl) {
      if (!containerEl) return false;
      this.init();
      this.rootHost = containerEl;

      containerEl.innerHTML = `
        <div class="space-y-3 text-xs">
          <!-- Thanh công cụ phía trên: Nút "Tạo hàm đồ thị" ngay bên cạnh máy tính fx-570VN PLUS -->
          <div class="p-3 rounded-2xl border border-sky-500/40 bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-emerald-950/50 flex flex-wrap items-center justify-between gap-2.5">
            <div class="space-y-0.5 min-w-0">
              <div class="font-extrabold text-sm text-sky-300 flex items-center gap-2 flex-wrap">
                <span>🧮 Casio fx-570VN PLUS &amp; Đồ Thị Hàm Số (Desmos Local)</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px]">⚡ 100% Chạy Cục Bộ Trên Máy</span>
              </div>
              <div class="text-[11px] text-zinc-300">
                Đầy đủ chế độ thi cử (COMP, CMPLX, STAT, BASE-N, EQN bậc 2/3 &amp; hệ 2–3 ẩn, INEQ, MATRIX, TABLE, VECTOR, SOLVE, ∫dx, d/dx, S⇔D) + vẽ đồ thị 60FPS không cần mạng.
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <button type="button" id="btn-mod45-toggle-desmos" data-btn-toggle-desmos aria-expanded="${this.desmosOpen ? 'true' : 'false'}" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition inline-flex items-center gap-1.5">
                <span>📈 Tạo hàm đồ thị</span>
              </button>
              <button type="button" data-btn-send-to-desmos class="px-3 py-2 rounded-xl border border-sky-400/60 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 font-bold text-xs transition" title="Gửi biểu thức đang gõ trên màn hình fx-570 sang vẽ đồ thị Desmos ngay">
                <span>🚀 Vẽ từ fx-570</span>
              </button>
              <button type="button" data-btn-quick-mode-menu class="px-3 py-2 rounded-xl border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 font-bold text-xs transition">
                <span>⚙️ Chọn MODE (1–9)</span>
              </button>
            </div>
          </div>

          <div class="fx570-workspace ${this.desmosOpen ? 'desmos-open' : ''}" data-fx-workspace>
            <div class="flex flex-col items-center gap-2">
              ${this.buildFx570KeypadHtml()}
              <div class="text-[11px] text-zinc-400 text-center max-w-[344px]">
                💡 Mẹo: Có thể gõ số/phép tính trực tiếp bằng bàn phím máy tính khi bấm vào khung máy tính fx-570VN PLUS.
              </div>
            </div>
            <div class="${this.desmosOpen ? '' : 'hidden'}" data-desmos-pane>
              ${this.buildDesmosPanelHtml()}
            </div>
          </div>
        </div>
      `;

      // Gắn sự kiện 50 phím Casio fx-570VN PLUS
      containerEl.querySelectorAll('[data-fx-key]').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          this.handleKeyPress(btn.getAttribute('data-fx-key'));
        });
      });

      containerEl.querySelector('[data-btn-toggle-desmos]')?.addEventListener('click', () => {
        this.toggleDesmosPanel();
      });
      containerEl.querySelector('[data-btn-send-to-desmos]')?.addEventListener('click', () => {
        this.plotFunctionFromCalc();
      });
      containerEl.querySelector('[data-btn-quick-mode-menu]')?.addEventListener('click', () => {
        this.subPanel = this.subPanel === 'MODE' ? '' : 'MODE';
        this.renderSubPanel();
      });

      // Gắn sự kiện đồ thị Desmos
      const canvas = containerEl.querySelector('[data-desmos-canvas]');
      this.graph.attachCanvas(canvas);
      this.renderDesmosSidebar();

      containerEl.querySelector('[data-desmos-add]')?.addEventListener('click', () => {
        this.graph.addExpression('y = ');
        this.renderDesmosSidebar();
        this.saveState();
      });
      containerEl.querySelector('[data-desmos-add-slider]')?.addEventListener('click', () => {
        const names = ['a', 'b', 'c', 'k', 'm'];
        const nextName = names.find((n) => !this.graph.sliders[n]) || 'p';
        this.graph.addExpression(`${nextName} = 1`);
        this.renderDesmosSidebar();
        this.saveState();
      });
      containerEl.querySelector('[data-desmos-undo]')?.addEventListener('click', () => {
        if (this.graph.undo()) this.renderDesmosSidebar();
      });
      containerEl.querySelector('[data-desmos-redo]')?.addEventListener('click', () => {
        if (this.graph.redo()) this.renderDesmosSidebar();
      });
      containerEl.querySelector('[data-desmos-preset]')?.addEventListener('change', (ev) => {
        const pid = ev.target.value;
        const preset = DESMOS_PRESETS.find((p) => p.id === pid);
        if (!preset) return;
        this.graph.pushHistory();
        this.graph.expressions = preset.expressions.map((e, i) => ({
          id: `expr_${Date.now()}_${i}`,
          expr: e.expr,
          color: e.color,
          visible: true
        }));
        this.graph.resetViewport();
        this.renderDesmosSidebar();
        this.graph.render();
        this.saveState();
        ev.target.value = '';
      });
      containerEl.querySelector('[data-desmos-theme]')?.addEventListener('click', (ev) => {
        this.graph.darkMode = !this.graph.darkMode;
        const shell = containerEl.querySelector('[data-desmos-shell]');
        if (shell) shell.classList.toggle('dark-graph', this.graph.darkMode);
        ev.currentTarget.textContent = tr(this.graph.darkMode ? '☀️ Sáng' : '🌙 Tối');
        this.graph.render();
        this.saveState();
      });
      containerEl.querySelector('[data-desmos-png]')?.addEventListener('click', () => {
        this.graph.exportPng();
      });
      containerEl.querySelector('[data-desmos-zoom-in]')?.addEventListener('click', () => this.graph.zoomAt(0.75));
      containerEl.querySelector('[data-desmos-zoom-out]')?.addEventListener('click', () => this.graph.zoomAt(1.33));
      containerEl.querySelector('[data-desmos-home]')?.addEventListener('click', () => this.graph.resetViewport());
      containerEl.querySelector('[data-desmos-grid]')?.addEventListener('click', () => {
        this.graph.showGrid = !this.graph.showGrid;
        this.graph.render();
      });

      containerEl.querySelectorAll('[data-desmos-keypad]').forEach((kb) => {
        kb.addEventListener('click', () => {
          const tok = kb.getAttribute('data-desmos-keypad');
          const target = this._focusedDesmosInput || containerEl.querySelector('[data-expr-input]');
          if (!target) return;
          const start = target.selectionStart ?? target.value.length;
          const end = target.selectionEnd ?? target.value.length;
          target.value = target.value.slice(0, start) + tok + target.value.slice(end);
          const pos = start + tok.length - (tok.endsWith('()') ? 1 : 0);
          target.focus();
          try {
            target.setSelectionRange(pos, pos);
          } catch (_e) {}
          target.dispatchEvent(new Event('input', { bubbles: true }));
        });
      });

      this.updateLcdOnly();
      this.renderSubPanel();
      if (this.desmosOpen) {
        setTimeout(() => {
          this.graph.aspectNormalize();
          this.graph.render();
        }, 40);
      }
      translateTree(containerEl);
      return true;
    }

    openCalculatorModal(openDesmos = false) {
      if (typeof document === 'undefined' || !document.body) return null;
      this.init();
      const old = document.getElementById(MOD45_MODAL_ID);
      if (old) old.remove();

      const modal = document.createElement('div');
      modal.id = MOD45_MODAL_ID;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'fixed inset-0 z-[185] bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 overflow-y-auto';

      modal.innerHTML = `
        <div class="my-auto w-full max-w-6xl rounded-2xl border-2 border-sky-400/70 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[94dvh]">
          <div class="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 flex items-center justify-between gap-2 shrink-0">
            <h3 class="font-extrabold text-xs sm:text-sm text-sky-200 uppercase">
              🧮 Máy tính đồ thị (Casio fx-570VN PLUS &amp; Desmos Local)
            </h3>
            <button type="button" id="btn-close-mod45-modal" class="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-white font-extrabold text-xs transition">✕</button>
          </div>
          <div id="mod45-modal-mount-body" class="p-3 sm:p-4 overflow-y-auto flex-1"></div>
        </div>
      `;

      document.body.appendChild(modal);
      this.modalEl = modal;
      if (openDesmos) this.desmosOpen = true;
      const body = modal.querySelector('#mod45-modal-mount-body');
      this.mountIntoContainer(body);

      const close = () => this.closeCalculatorModal();
      modal.querySelector('#btn-close-mod45-modal')?.addEventListener('click', close);
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) close();
      });
      translateTree(modal);
      return modal;
    }

    closeCalculatorModal() {
      if (this.modalEl) {
        try {
          this.modalEl.remove();
        } catch (_e) {}
        this.modalEl = null;
      }
      return true;
    }

    bindGlobalKeyboard() {
      if (typeof document === 'undefined' || this._kbBound) return;
      this._kbBound = true;
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && this.modalEl) {
          this.closeCalculatorModal();
          return;
        }
        if (!this.rootHost) return;
        const chassis = this.rootHost.querySelector('[data-fx-chassis]');
        if (!chassis || document.activeElement !== chassis) return;
        if (/^[0-9]$/.test(ev.key)) {
          ev.preventDefault();
          this.handleKeyPress(ev.key);
        } else if (ev.key === '+') {
          ev.preventDefault();
          this.handleKeyPress('add');
        } else if (ev.key === '-') {
          ev.preventDefault();
          this.handleKeyPress('sub');
        } else if (ev.key === '*') {
          ev.preventDefault();
          this.handleKeyPress('mul');
        } else if (ev.key === '/') {
          ev.preventDefault();
          this.handleKeyPress('div');
        } else if (ev.key === '^') {
          ev.preventDefault();
          this.handleKeyPress('xpow');
        } else if (ev.key === '.') {
          ev.preventDefault();
          this.handleKeyPress('dot');
        } else if (ev.key === '(') {
          ev.preventDefault();
          this.handleKeyPress('lparen');
        } else if (ev.key === ')') {
          ev.preventDefault();
          this.handleKeyPress('rparen');
        } else if (ev.key === 'Enter' || ev.key === '=') {
          ev.preventDefault();
          this.handleKeyPress('eq');
        } else if (ev.key === 'Backspace') {
          ev.preventDefault();
          this.handleKeyPress('del');
        } else if (ev.key === 'Delete') {
          ev.preventDefault();
          this.handleKeyPress('ac');
        } else if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          this.handleKeyPress('replay_left');
        } else if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          this.handleKeyPress('replay_right');
        } else if (ev.key === 'ArrowUp') {
          ev.preventDefault();
          this.handleKeyPress('replay_up');
        } else if (ev.key === 'ArrowDown') {
          ev.preventDefault();
          this.handleKeyPress('replay_down');
        }
      });
    }

    // Public programmatic API (cho test & tương tác giữa các module)
    evaluateExpression(exprStr, options = {}) {
      const prevAngle = this.math.angleUnit;
      if (options.angleUnit) this.math.angleUnit = options.angleUnit;
      try {
        const val = this.math.evaluate(exprStr, options.scope || {});
        const numeric = typeof val === 'number' ? val : val && typeof val.numeric === 'number' ? val.numeric : NaN;
        return {
          ok: true,
          value: val,
          exact: Number.isFinite(numeric) ? formatExactSymbolic(numeric) || formatDecimalNumber(numeric) : String(val && val.text ? val.text : val),
          decimal: Number.isFinite(numeric) ? formatDecimalNumber(numeric) : String(val && val.text ? val.text : val)
        };
      } catch (err) {
        return { ok: false, error: err.message };
      } finally {
        this.math.angleUnit = prevAngle;
      }
    }

    solveEquation(subMode, coeffs) {
      if (subMode === 'LIN2') return EqnAndIneqEngine.solveLinear2(...coeffs);
      if (subMode === 'LIN3') return EqnAndIneqEngine.solveLinear3(coeffs);
      if (subMode === 'QUAD') return EqnAndIneqEngine.solveQuadratic(...coeffs);
      if (subMode === 'CUBIC') return EqnAndIneqEngine.solveCubic(...coeffs);
      throw new Error('Unknown EQN submode');
    }

    solveInequality(degree, op, coeffs) {
      return EqnAndIneqEngine.solveInequality(degree, op, coeffs);
    }

    evaluateComplex(exprStr, angleUnit = 'DEG') {
      return ComplexEngine.evaluate(exprStr, angleUnit);
    }

    computeStats(rows, isTwoVar = false) {
      return StatEngine.compute(rows, isTwoVar);
    }

    computeMatrix(op, matA, matB) {
      if (op === 'DET') return MatrixAndVectorEngine.det(matA);
      if (op === 'INV') return MatrixAndVectorEngine.inverse(matA);
      if (op === 'TRN') return MatrixAndVectorEngine.transpose(matA);
      if (op === 'ADD') return MatrixAndVectorEngine.add(matA, matB, 1);
      if (op === 'SUB') return MatrixAndVectorEngine.add(matA, matB, -1);
      if (op === 'MUL') return MatrixAndVectorEngine.multiply(matA, matB);
      throw new Error('Unknown matrix op');
    }

    computeVector(op, vecA, vecB, angleUnit = 'DEG') {
      return MatrixAndVectorEngine.computeVector(op, vecA, vecB, angleUnit);
    }

    convertBase(raw, fromBase = 10) {
      const v = BaseNEngine.parseInBase(raw, fromBase);
      return BaseNEngine.convertAll(v);
    }

    renderGraphNow() {
      this.graph.render();
      return true;
    }

    getSnapshot() {
      return {
        mode: this.mode,
        angleUnit: this.math.angleUnit,
        displayMode: this.math.displayMode,
        desmosOpen: this.desmosOpen,
        expressionCount: this.graph.expressions.length,
        specialPointCount: this.graph.specialPoints.length,
        lastNumericResult: this.lastNumericResult
      };
    }

    selfInspect() {
      const smokeSin = this.evaluateExpression('sin(30)', { angleUnit: 'DEG' });
      const smokeQuad = this.solveEquation('QUAD', [1, -5, 6]);
      const smokeInt = this.evaluateExpression('∫(x^2, 0, 3)');
      return {
        module: 'mod45',
        localFirst: true,
        networkCalls: 0,
        constantsCount: FX570_CONSTANTS.length,
        conversionsCount: FX570_CONVERSIONS.length,
        presetsCount: DESMOS_PRESETS.length,
        smokeOk: Boolean(
          smokeSin.ok &&
            Math.abs(smokeSin.value - 0.5) < 1e-9 &&
            smokeSin.exact === '1/2' &&
            smokeQuad.roots &&
            smokeQuad.roots.length === 2 &&
            smokeInt.ok &&
            Math.abs(smokeInt.value - 9) < 1e-6
        )
      };
    }
  }

  // ==========================================================================
  // PHẦN 7: BỘ ĐO KIỂM & THƯ VIỆN CÔNG THỨC ÔN THI ĐẠI HỌC / KỸ THUẬT (OFFLINE)
  // ==========================================================================
  // Hỗ trợ tra cứu nhanh 1 chạm ngay trong máy tính fx-570VN PLUS (không cần mạng)
  const FX570_FORMULA_CHEATSHEET = Object.freeze([
    {
      group: 'Đại số & Giải tích',
      items: [
        { title: 'Nghiệm bậc 2 (Δ = b² − 4ac)', expr: '(-b + sqrt(b^2 - 4*a*c)) / (2*a)', demoGraph: 'y = x^2 - 5x + 6' },
        { title: 'Tổ hợp & Chỉnh hợp', expr: 'nCr(10, 3)', demoGraph: '' },
        { title: 'Đạo hàm tại điểm x₀', expr: 'd/dx(x^3 - 3x, 2)', demoGraph: 'y = x^3 - 3x' },
        { title: 'Tích phân xác định ∫(f(x), a, b)', expr: '∫(x^2, 0, 3)', demoGraph: 'y = x^2' },
        { title: 'Tổng cấp số / Chuỗi Sigma', expr: '∑(x^2, 1, 10)', demoGraph: '' },
        { title: 'Tích giai thừa / Chuỗi Pi', expr: '∏(x, 1, 6)', demoGraph: '' },
        { title: 'Tìm nghiệm gần đúng SHIFT+SOLVE', expr: 'SOLVE(x^3 - 2x - 5 = 0, 2)', demoGraph: 'y = x^3 - 2x - 5' }
      ]
    },
    {
      group: 'Lượng giác & Hình học giải tích',
      items: [
        { title: 'Sóng điều hòa y = A·sin(ωx + φ)', expr: 'sin(30) + cos(60)', demoGraph: 'y = 2*sin(2*x)' },
        { title: 'Phương trình đường tròn tâm O', expr: 'sqrt(3^2 + 4^2)', demoGraph: 'x^2 + y^2 = 16' },
        { title: 'Phương trình Elip chính tắc', expr: '', demoGraph: 'x^2/16 + y^2/9 = 1' },
        { title: 'Phương trình Hyperbol', expr: '', demoGraph: 'x^2/4 - y^2/9 = 1' },
        { title: 'Bông hoa tọa độ cực r = 4cos(3θ)', expr: '', demoGraph: 'r = 4*cos(3*theta)' }
      ]
    },
    {
      group: 'Số học & Xác suất thống kê',
      items: [
        { title: 'Phân tích thừa số nguyên tố (FACT)', expr: 'FACT(360)', demoGraph: '' },
        { title: 'Ước chung lớn nhất GCD(a, b)', expr: 'GCD(48, 180)', demoGraph: '' },
        { title: 'Bội chung nhỏ nhất LCM(a, b)', expr: 'LCM(12, 18)', demoGraph: '' },
        { title: 'Phép chia có dư (÷R)', expr: '127 ÷R 11', demoGraph: '' },
        { title: 'Phân phối chuẩn Gaussian (Chuông)', expr: 'exp(-0.5) / sqrt(2*pi)', demoGraph: 'y = (1/sqrt(2*pi))*exp(-x^2/2)' }
      ]
    }
  ]);

  // Gắn danh mục công thức nhanh lên controller để dùng ở chế độ tra cứu nhanh
  Fx570AndDesmosController.prototype.getFormulaCheatsheet = function () {
    return FX570_FORMULA_CHEATSHEET;
  };

  // Kiểm tra nhanh tính tương thích của tất cả các phép toán lõi
  Fx570AndDesmosController.prototype.runSelfDiagnostics = function () {
    const cases = [
      { expr: 'sin(30)', angleUnit: 'DEG', expected: 0.5 },
      { expr: 'cos(60)', angleUnit: 'DEG', expected: 0.5 },
      { expr: 'tan(45)', angleUnit: 'DEG', expected: 1 },
      { expr: 'log(1000)', angleUnit: 'DEG', expected: 3 },
      { expr: 'logbase(2, 32)', angleUnit: 'DEG', expected: 5 },
      { expr: 'ln(e^3)', angleUnit: 'DEG', expected: 3 },
      { expr: 'nCr(5, 2)', angleUnit: 'DEG', expected: 10 },
      { expr: 'nPr(5, 2)', angleUnit: 'DEG', expected: 20 },
      { expr: 'GCD(48, 18)', angleUnit: 'DEG', expected: 6 },
      { expr: 'LCM(12, 18)', angleUnit: 'DEG', expected: 36 },
      { expr: '5!', angleUnit: 'DEG', expected: 120 },
      { expr: '∫(x^2, 0, 3)', angleUnit: 'RAD', expected: 9 },
      { expr: 'd/dx(x^3, 2)', angleUnit: 'RAD', expected: 12 },
      { expr: '∑(x, 1, 10)', angleUnit: 'RAD', expected: 55 },
      { expr: '∏(x, 1, 5)', angleUnit: 'RAD', expected: 120 }
    ];
    let passed = 0;
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      const r = this.evaluateExpression(c.expr, { angleUnit: c.angleUnit });
      if (r.ok && Math.abs(Number(r.value) - c.expected) < 1e-5) {
        passed++;
      }
    }
    const lin2 = this.solveEquation('LIN2', [2, 1, 5, 1, -1, 1]);
    const quad = this.solveEquation('QUAD', [1, -5, 6]);
    const cubic = this.solveEquation('CUBIC', [1, -6, 11, -6]);
    const ineq = this.solveInequality(2, '<', [1, -3, 2]);
    const cmplx = this.evaluateComplex('(3+4i)^2', 'DEG');
    const matDet = this.computeMatrix('DET', [
      [2, 1],
      [5, 3]
    ]);
    const vecDot = this.computeVector('DOT', [1, 2, 3], [4, -5, 6]);
    const baseHex = this.convertBase('255', 10);

    return {
      totalFormulaCases: cases.length,
      passedFormulaCases: passed,
      lin2Ok: lin2.status === 'OK' && Math.abs(lin2.x - 2) < 1e-9 && Math.abs(lin2.y - 1) < 1e-9,
      quadOk: quad.status === 'TWO_REAL' && quad.roots.includes(2) && quad.roots.includes(3),
      cubicOk: cubic.status === 'THREE_REAL' && cubic.roots.length === 3,
      ineqOk: Boolean(ineq.text && ineq.text.includes('1') && ineq.text.includes('2')),
      cmplxOk: Math.abs(cmplx.re - -7) < 1e-9 && Math.abs(cmplx.im - 24) < 1e-9,
      matDetOk: Math.abs(matDet - 1) < 1e-9,
      vecDotOk: Math.abs(vecDot.scalar - 12) < 1e-9,
      baseHexOk: baseHex.hex === 'FF' && baseHex.bin === '11111111'
    };
  };

  const controller = new Fx570AndDesmosController();
  NS.fx570GraphCalc = controller;
  NS.Fx570MathEngine = Fx570MathEngine;
  NS.DesmosGraphEngine = DesmosGraphEngine;
  NS.ComplexEngine = ComplexEngine;
  NS.EqnAndIneqEngine = EqnAndIneqEngine;
  NS.MatrixAndVectorEngine = MatrixAndVectorEngine;
  NS.StatEngine = StatEngine;
  NS.BaseNEngine = BaseNEngine;
})(typeof window !== 'undefined' ? window : globalThis);
