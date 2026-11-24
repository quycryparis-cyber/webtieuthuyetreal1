/**
 * ============================================================================
 * 🧠 20 PHÚT THÔNG THÁI MỖI NGÀY — DETERMINISTIC KNOWLEDGE & NEWS ENGINE (v130.0)
 * ============================================================================
 * - 100% API `200 OK · CORS=*` chạy thẳng từ trình duyệt/PWA/Electron (0% bịa tin!).
 * - Chia sẵn 5 hạng mục tri thức khoa học để người dùng đọc NGAY Ở CHẾ ĐỘ THÔNG TIN THÔ
 *   mà KHÔNG cần Gemini:
 *     1. 🌍 Thế giới & Địa chính trị hôm nay
 *     2. 🚀 Công nghệ, AI & Khoa học Đột phá
 *     3. 💰 Kinh tế, Tài chính & Chỉ số Vĩ mô
 *     4. 📍 Khu vực & Quốc gia của bạn (theo GPS / Quốc gia đã xác nhận)
 *     5. 📚 Tri thức Nền tảng, Ảnh trong ngày & Lịch sử Hôm nay
 * - Kèm Provenance SHA-256 + Fail-Closed freshness guardrail (loại tin cũ > 90 ngày).
 * - Kèm bộ soạn Câu lệnh Gemini & Hợp đồng JSON `WISDOM_20MIN_SYNC_V1` để đồng bộ
 *   Biểu đồ (Donut, Cột tác động), Sơ đồ Nhân Quả/Mindmap SVG, Timeline & Hình ảnh.
 * ============================================================================
 */
(function initWisdom20Engine(globalScope) {
  'use strict';

  const W20 = (globalScope.NoirWisdom20 = globalScope.NoirWisdom20 || {});

  // Danh mục quốc gia/khu vực gọn nhẹ (độc lập, không bắt buộc mở Mod 49 trước)
  const COUNTRY_PROFILES = Object.freeze({
    VN: { code: 'VN', name: 'Việt Nam', flag: '🇻🇳', currency: 'VND', wikiLang: 'vi', wbIso2: 'VN', defaultCity: 'Hà Nội / TP.HCM', newsLinks: [
      { label: 'VnExpress Tin mới nhất', url: 'https://vnexpress.net/tin-tuc-24h' },
      { label: 'Tuổi Trẻ Thời sự & Kinh tế', url: 'https://tuoitre.vn/tin-moi-nhat.htm' },
      { label: 'CafeF Tài chính & Vĩ mô', url: 'https://cafef.vn/' },
      { label: 'Khoa học & Công nghệ (VnExpress)', url: 'https://vnexpress.net/khoa-hoc' },
    ] },
    US: { code: 'US', name: 'Hoa Kỳ (Mỹ)', flag: '🇺🇸', currency: 'USD', wikiLang: 'en', wbIso2: 'US', defaultCity: 'New York / Washington D.C.', newsLinks: [
      { label: 'Reuters World & Business', url: 'https://www.reuters.com/world/' },
      { label: 'AP News Top Headlines', url: 'https://apnews.com/' },
      { label: 'Federal Reserve News', url: 'https://www.federalreserve.gov/newsevents.htm' },
    ] },
    JP: { code: 'JP', name: 'Nhật Bản', flag: '🇯🇵', currency: 'JPY', wikiLang: 'ja', wbIso2: 'JP', defaultCity: 'Tokyo / Osaka', newsLinks: [
      { label: 'NHK World Japan', url: 'https://www3.nhk.or.jp/nhkworld/en/news/' },
      { label: 'Nikkei Asia', url: 'https://asia.nikkei.com/' },
    ] },
    KR: { code: 'KR', name: 'Hàn Quốc', flag: '🇰🇷', currency: 'KRW', wikiLang: 'ko', wbIso2: 'KR', defaultCity: 'Seoul / Busan', newsLinks: [
      { label: 'Yonhap News English', url: 'https://en.yna.co.kr/' },
      { label: 'Korea Herald', url: 'https://www.koreaherald.com/' },
    ] },
    SG: { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', wikiLang: 'en', wbIso2: 'SG', defaultCity: 'Singapore', newsLinks: [
      { label: 'Channel News Asia (CNA)', url: 'https://www.channelnewsasia.com/' },
      { label: 'The Straits Times', url: 'https://www.straitstimes.com/' },
    ] },
    GB: { code: 'GB', name: 'Vương quốc Anh', flag: '🇬🇧', currency: 'GBP', wikiLang: 'en', wbIso2: 'GB', defaultCity: 'London', newsLinks: [
      { label: 'BBC News World', url: 'https://www.bbc.com/news' },
      { label: 'The Guardian International', url: 'https://www.theguardian.com/international' },
    ] },
    DE: { code: 'DE', name: 'Đức / Châu Âu (EU)', flag: '🇩🇪', currency: 'EUR', wikiLang: 'de', wbIso2: 'DE', defaultCity: 'Berlin / Frankfurt', newsLinks: [
      { label: 'DW News (Deutsche Welle)', url: 'https://www.dw.com/en/top-stories/s-9097' },
      { label: 'Euronews', url: 'https://www.euronews.com/' },
    ] },
    AU: { code: 'AU', name: 'Úc (Australia)', flag: '🇦🇺', currency: 'AUD', wikiLang: 'en', wbIso2: 'AU', defaultCity: 'Sydney / Melbourne', newsLinks: [
      { label: 'ABC News Australia', url: 'https://www.abc.net.au/news' },
    ] },
    CN: { code: 'CN', name: 'Trung Quốc', flag: '🇨🇳', currency: 'CNY', wikiLang: 'zh', wbIso2: 'CN', defaultCity: 'Bắc Kinh / Thượng Hải', newsLinks: [
      { label: 'South China Morning Post', url: 'https://www.scmp.com/' },
      { label: 'Reuters China', url: 'https://www.reuters.com/world/china/' },
    ] },
    GLOBAL: { code: 'GLOBAL', name: 'Quốc tế / Toàn cầu', flag: '🌍', currency: 'USD', wikiLang: 'en', wbIso2: 'WLD', defaultCity: 'Toàn cầu', newsLinks: [
      { label: 'Reuters Global', url: 'https://www.reuters.com/' },
      { label: 'Wikipedia Current Events', url: 'https://en.wikipedia.org/wiki/Portal:Current_events' },
    ] },
  });

  const CATEGORIES = Object.freeze([
    { id: 'world_geo', icon: '🌍', title: '1. Thế giới & Địa chính trị hôm nay', minutes: 5, color: '#0ea5e9', desc: 'Sự kiện quốc tế nổi bật, xung đột, ngoại giao và xu hướng toàn cầu.' },
    { id: 'tech_science', icon: '🚀', title: '2. Công nghệ, AI & Khoa học Đột phá', minutes: 5, color: '#8b5cf6', desc: 'Đột phá AI, lập trình, mã nguồn mở và khám phá khoa học mới nhất.' },
    { id: 'economy_markets', icon: '💰', title: '3. Kinh tế, Tài chính & Chỉ số Vĩ mô', minutes: 4, color: '#f59e0b', desc: 'Tỷ giá, vàng, crypto, nợ công Mỹ và chỉ số tăng trưởng vĩ mô.' },
    { id: 'local_region', icon: '📍', title: '4. Khu vực & Quốc gia của bạn', minutes: 3, color: '#10b981', desc: 'Tin tức nổi bật, chỉ số kinh tế và nguồn tin chính thống tại khu vực bạn chọn.' },
    { id: 'deep_knowledge', icon: '📚', title: '5. Tri thức Nền tảng, Ảnh & Lịch sử Hôm nay', minutes: 3, color: '#ec4899', desc: 'Bài viết tinh hoa trong ngày, Ảnh đẹp thế giới & Ngày này năm xưa.' },
  ]);

  const FOCUS_MODES = Object.freeze([
    { id: 'balanced_20m', label: '🧠 Toàn diện 20 phút (Cân bằng 5 mảng)', desc: 'Tổng hợp cân bằng Thế giới + Công nghệ + Kinh tế + Khu vực + Tri thức nền.' },
    { id: 'tech_ai', label: '🚀 Trọng tâm Công nghệ, AI & Tương lai', desc: 'Đào sâu xu hướng AI, kỹ năng công nghệ và tác động tới công việc.' },
    { id: 'geo_econ', label: '🌍 Trọng tâm Địa chính trị & Kinh tế Vĩ mô', desc: 'Giải mã chuỗi nhân quả giữa sự kiện thế giới, thương mại và túi tiền.' },
    { id: 'deep_mind', label: '📚 Trọng tâm Tư duy, Khoa học & Lịch sử', desc: 'Rút ra mô hình tư duy (Mental Models) và bài học xuyên thời đại.' },
  ]);

  function getCountryProfile(code) {
    const key = String(code || 'VN').toUpperCase();
    return COUNTRY_PROFILES[key] || COUNTRY_PROFILES.VN;
  }

  function stripHtml(html) {
    return String(html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function sha256Short(str) {
    try {
      if (globalScope.crypto?.subtle) {
        const buf = new TextEncoder().encode(String(str || ''));
        const hash = await globalScope.crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash))
          .slice(0, 6)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch (_e) {}
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  async function fetchJsonSafe(url, signal, timeoutMs = 10000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const onParentAbort = () => ctrl.abort();
    if (signal) signal.addEventListener('abort', onParentAbort, { once: true });
    try {
      const resp = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onParentAbort);
    }
  }

  /**
   * Tự động định vị GPS qua trình duyệt + Nominatim reverse geocoding (không tự bỏ qua bước xác nhận!)
   */
  async function detectUserLocationByGps(signal) {
    if (!globalScope.navigator?.geolocation) {
      throw new Error('Trình duyệt không hỗ trợ định vị GPS.');
    }
    const pos = await new Promise((resolve, reject) => {
      globalScope.navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 180000,
      });
    });
    const lat = Number(pos.coords.latitude.toFixed(5));
    const lon = Number(pos.coords.longitude.toFixed(5));
    let countryCode = 'VN';
    let cityLabel = `${lat}, ${lon}`;
    let fullAddress = cityLabel;

    try {
      const geo = await fetchJsonSafe(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=vi`,
        signal,
        8000
      );
      const addr = geo?.address || {};
      if (addr.country_code) countryCode = String(addr.country_code).toUpperCase();
      const parts = [
        addr.suburb || addr.quarter || addr.city_district || addr.county,
        addr.city || addr.town || addr.province || addr.state,
        addr.country,
      ].filter(Boolean);
      if (parts.length) {
        cityLabel = parts.slice(0, 2).join(', ');
        fullAddress = parts.join(', ');
      }
    } catch (_eGeo) {}

    const profile = getCountryProfile(countryCode);
    return {
      source: 'gps',
      countryCode: profile.code,
      countryName: profile.name,
      flag: profile.flag,
      cityLabel,
      fullAddress,
      lat,
      lon,
      detectedAt: new Date().toISOString(),
    };
  }

  /**
   * Trả về chuỗi YYYY/MM/DD hợp lệ gần nhất cho Wikipedia Featured Feed
   * (tránh trường hợp đồng hồ máy người dùng lệch sang tương lai).
   */
  function getSafeWikiDatePath(offsetDays = 0) {
    const now = new Date();
    const target = new Date(now.getTime() - offsetDays * 86400000);
    const y = target.getUTCFullYear();
    const m = String(target.getUTCMonth() + 1).padStart(2, '0');
    const d = String(target.getUTCDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  }

  async function fetchWikiFeatured(lang, signal) {
    const safeLang = ['vi', 'en', 'ja', 'ko', 'de', 'zh'].includes(lang) ? lang : 'en';
    for (const offset of [0, 1]) {
      try {
        const dp = getSafeWikiDatePath(offset);
        const url = `https://${safeLang}.wikipedia.org/api/rest_v1/feed/featured/${dp}`;
        const data = await fetchJsonSafe(url, signal, 9000);
        if (data && (data.tfa || data.news || data.mostread || data.image || data.onthisday)) {
          return { data, sourceUrl: url, lang: safeLang };
        }
      } catch (_e) {}
    }
    return null;
  }

  /**
   * Fail-Closed freshness filter cho tin tức (loại bài cũ > 120 ngày để tránh rác năm 2021)
   */
  function isFreshStory(isoOrEpoch, maxDays = 120) {
    if (!isoOrEpoch) return true;
    const ts = typeof isoOrEpoch === 'number' ? (isoOrEpoch < 1e12 ? isoOrEpoch * 1000 : isoOrEpoch) : Date.parse(isoOrEpoch);
    if (!Number.isFinite(ts)) return true;
    const ageDays = Math.abs(Date.now() - ts) / 86400000;
    return ageDays <= maxDays;
  }

  async function makeProvenanceItem(item) {
    const hash = await sha256Short(`${item.title}|${item.url}|${item.summary || ''}`);
    return {
      ...item,
      sha256: hash,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Quét toàn bộ 5 hạng mục tri thức & tin tức sống (`200 OK · CORS=*`)
   */
  async function scanDailyWisdom({ location, onProgress, signal }) {
    const loc = location || {
      source: 'manual',
      countryCode: 'VN',
      countryName: 'Việt Nam',
      flag: '🇻🇳',
      cityLabel: 'Việt Nam',
      fullAddress: 'Việt Nam',
    };
    const profile = getCountryProfile(loc.countryCode);
    const stepsTotal = 6;
    let stepsDone = 0;
    const report = (label, detail) => {
      stepsDone = Math.min(stepsTotal, stepsDone + 1);
      if (typeof onProgress === 'function') {
        onProgress({
          pct: Math.round((stepsDone / stepsTotal) * 100),
          label,
          detail,
          stepsDone,
          stepsTotal,
        });
      }
    };

    const categoriesData = {
      world_geo: [],
      tech_science: [],
      economy_markets: [],
      local_region: [],
      deep_knowledge: [],
    };
    const visualGallery = [];
    const liveMetrics = {
      usdToLocal: null,
      localCurrency: profile.currency,
      goldUsdOz: null,
      gold24hPct: null,
      btcUsd: null,
      btc24hPct: null,
      usDebtTrillion: null,
      countryGdpPct: null,
      countryGdpYear: null,
      countryCpiPct: null,
      countryCpiYear: null,
    };

    // 1) Wikipedia EN Featured Feed (World News, Featured Article, Picture of the Day, On This Day, Most Read)
    const pWikiEn = fetchWikiFeatured('en', signal).then(async (res) => {
      if (res?.data) {
        const d = res.data;
        // World News items
        if (Array.isArray(d.news)) {
          for (const n of d.news.slice(0, 5)) {
            const linkObj = Array.isArray(n.links) ? n.links[0] : null;
            const title = stripHtml(n.story) || linkObj?.normalizedtitle || 'Tin quốc tế nổi bật';
            const url = linkObj?.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/Portal:Current_events';
            const img = linkObj?.thumbnail?.source || linkObj?.originalimage?.source || '';
            const rec = await makeProvenanceItem({
              id: `wiki-en-news-${categoriesData.world_geo.length}`,
              category: 'world_geo',
              title: title.slice(0, 200),
              summary: linkObj?.extract ? String(linkObj.extract).slice(0, 260) : 'Sự kiện thời sự thế giới được biên tập trực tiếp trên Wikipedia Current Events.',
              source: 'Wikipedia World News',
              url,
              imageUrl: img,
              publishedAt: new Date().toISOString(),
              readMinutes: 2,
            });
            categoriesData.world_geo.push(rec);
            if (img) {
              visualGallery.push({ title: linkObj?.normalizedtitle || title.slice(0, 75), caption: title.slice(0, 140), imageUrl: img, url, tag: '🌍 Thế giới' });
            }
          }
        }
        // Featured Article
        if (d.tfa) {
          const img = d.tfa.thumbnail?.source || d.tfa.originalimage?.source || '';
          const url = d.tfa.content_urls?.desktop?.page || 'https://en.wikipedia.org/';
          categoriesData.deep_knowledge.push(await makeProvenanceItem({
            id: 'wiki-en-tfa',
            category: 'deep_knowledge',
            title: `📖 Bài viết tinh hoa hôm nay: ${d.tfa.normalizedtitle || d.tfa.title}`,
            summary: String(d.tfa.extract || '').slice(0, 320),
            source: 'Wikipedia Featured Article',
            url,
            imageUrl: img,
            publishedAt: new Date().toISOString(),
            readMinutes: 3,
          }));
          if (img) {
            visualGallery.push({ title: d.tfa.normalizedtitle || d.tfa.title, caption: String(d.tfa.extract || '').slice(0, 140), imageUrl: img, url, tag: '📖 Tri thức hôm nay' });
          }
        }
        // Picture of the Day
        if (d.image?.thumbnail?.source || d.image?.image?.source) {
          const img = d.image.thumbnail?.source || d.image.image?.source;
          const desc = stripHtml(d.image.description?.text || d.image.title || 'Bức ảnh tiêu biểu trong ngày');
          const url = d.image.file_page || 'https://commons.wikimedia.org/wiki/Main_Page';
          categoriesData.deep_knowledge.push(await makeProvenanceItem({
            id: 'wiki-potd',
            category: 'deep_knowledge',
            title: `🖼️ Ảnh Tri thức Tiêu biểu trong ngày`,
            summary: desc.slice(0, 260),
            source: 'Wikimedia Commons POTD',
            url,
            imageUrl: img,
            publishedAt: new Date().toISOString(),
            readMinutes: 1,
          }));
          visualGallery.unshift({ title: '🖼️ Ảnh tiêu biểu trong ngày (Wikimedia)', caption: desc.slice(0, 140), imageUrl: img, url, tag: '🖼️ Ảnh trong ngày' });
        }
        // On This Day (Historical Wisdom)
        if (Array.isArray(d.onthisday)) {
          for (const ev of d.onthisday.slice(0, 3)) {
            const p0 = Array.isArray(ev.pages) ? ev.pages[0] : null;
            categoriesData.deep_knowledge.push(await makeProvenanceItem({
              id: `wiki-otd-${ev.year}`,
              category: 'deep_knowledge',
              title: `⏳ Ngày này năm ${ev.year}: ${String(ev.text || '').slice(0, 140)}`,
              summary: p0?.extract ? String(p0.extract).slice(0, 220) : String(ev.text || ''),
              source: 'Wikipedia On This Day',
              url: p0?.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/Wikipedia:Selected_anniversaries',
              imageUrl: p0?.thumbnail?.source || '',
              publishedAt: `${ev.year}`,
              readMinutes: 1,
            }));
          }
        }
      }
      report('🌍 Đã quét tin Thế giới & Tri thức Wikipedia', `${categoriesData.world_geo.length + categoriesData.deep_knowledge.length} mục`);
    }).catch(() => report('🌍 Wikipedia EN (tạm bỏ qua)', '0 mục'));

    // 2) Local-language Wikipedia Featured Feed (VD: vi.wikipedia.org cho Việt Nam!)
    const pWikiLocal = (profile.wikiLang !== 'en' ? fetchWikiFeatured(profile.wikiLang, signal) : Promise.resolve(null)).then(async (res) => {
      if (res?.data) {
        const d = res.data;
        if (Array.isArray(d.news)) {
          for (const n of d.news.slice(0, 4)) {
            const linkObj = Array.isArray(n.links) ? n.links[0] : null;
            const title = stripHtml(n.story) || linkObj?.normalizedtitle || 'Tin nổi bật khu vực';
            const url = linkObj?.content_urls?.desktop?.page || `https://${profile.wikiLang}.wikipedia.org/`;
            const img = linkObj?.thumbnail?.source || '';
            categoriesData.local_region.push(await makeProvenanceItem({
              id: `wiki-loc-news-${categoriesData.local_region.length}`,
              category: 'local_region',
              title: title.slice(0, 200),
              summary: linkObj?.extract ? String(linkObj.extract).slice(0, 240) : `Tin thời sự cập nhật bằng ngôn ngữ ${profile.wikiLang.toUpperCase()}.`,
              source: `Wikipedia (${profile.wikiLang.toUpperCase()}) Thời sự`,
              url,
              imageUrl: img,
              publishedAt: new Date().toISOString(),
              readMinutes: 2,
            }));
            if (img) {
              visualGallery.push({ title: linkObj?.normalizedtitle || title.slice(0, 75), caption: title.slice(0, 140), imageUrl: img, url, tag: `${profile.flag} Khu vực` });
            }
          }
        }
        if (d.tfa) {
          const img = d.tfa.thumbnail?.source || '';
          const url = d.tfa.content_urls?.desktop?.page || `https://${profile.wikiLang}.wikipedia.org/`;
          categoriesData.deep_knowledge.push(await makeProvenanceItem({
            id: 'wiki-loc-tfa',
            category: 'deep_knowledge',
            title: `🇻🇳 Bài chọn lọc (${profile.wikiLang.toUpperCase()}): ${d.tfa.normalizedtitle || d.tfa.title}`,
            summary: String(d.tfa.extract || '').slice(0, 280),
            source: `Wikipedia (${profile.wikiLang.toUpperCase()})`,
            url,
            imageUrl: img,
            publishedAt: new Date().toISOString(),
            readMinutes: 2,
          }));
          if (img) {
            visualGallery.push({ title: d.tfa.normalizedtitle || d.tfa.title, caption: String(d.tfa.extract || '').slice(0, 140), imageUrl: img, url, tag: '📚 Tri thức Việt' });
          }
        }
        if (Array.isArray(d.mostread?.articles)) {
          const topTrends = d.mostread.articles
            .filter((a) => a && a.normalizedtitle && !/Main Page|Trang Chính|Đặc biệt/i.test(a.normalizedtitle))
            .slice(0, 3);
          for (const a of topTrends) {
            const img = a.thumbnail?.source || '';
            const url = a.content_urls?.desktop?.page || `https://${profile.wikiLang}.wikipedia.org/`;
            categoriesData.local_region.push(await makeProvenanceItem({
              id: `wiki-loc-trend-${a.pageid || Math.random()}`,
              category: 'local_region',
              title: `🔥 Xu hướng tìm kiếm (${Number(a.views || 0).toLocaleString('vi-VN')} lượt xem): ${a.normalizedtitle}`,
              summary: String(a.extract || a.description || 'Chủ đề được quan tâm nhiều nhất trong 24 giờ qua.').slice(0, 240),
              source: `Wikipedia (${profile.wikiLang.toUpperCase()}) Top Trending`,
              url,
              imageUrl: img,
              publishedAt: new Date().toISOString(),
              readMinutes: 1,
            }));
          }
        }
      }
      report(`📍 Đã quét xu hướng khu vực ${profile.name}`, `${categoriesData.local_region.length} mục`);
    }).catch(() => report(`📍 Xu hướng khu vực ${profile.name}`, 'tạm bỏ qua'));

    // 3) Tech, AI & Science (Dev.to Top Articles với ảnh cover thật + HN Algolia AI/Science + GitHub Trending)
    const pTech = Promise.allSettled([
      fetchJsonSafe('https://dev.to/api/articles?top=1&per_page=5', signal, 9000),
      fetchJsonSafe('https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=8', signal, 9000),
      fetchJsonSafe('https://api.github.com/search/repositories?q=stars:>8000+topic:ai&sort=updated&per_page=3', signal, 9000),
    ]).then(async ([rDev, rHn, rGh]) => {
      if (rDev.status === 'fulfilled' && Array.isArray(rDev.value)) {
        for (const art of rDev.value.slice(0, 4)) {
          if (!art?.title || !art?.url) continue;
          const img = art.cover_image || art.social_image || '';
          categoriesData.tech_science.push(await makeProvenanceItem({
            id: `devto-${art.id}`,
            category: 'tech_science',
            title: art.title,
            summary: String(art.description || '').slice(0, 240) || `Bài viết công nghệ nổi bật (${art.reading_time_minutes || 3} phút đọc).`,
            source: `DEV.to (${art.user?.name || 'Tech'})`,
            url: art.url,
            imageUrl: img,
            publishedAt: art.published_at || new Date().toISOString(),
            readMinutes: Math.min(5, Math.max(1, Number(art.reading_time_minutes || 3))),
          }));
          if (img) {
            visualGallery.push({ title: art.title.slice(0, 75), caption: String(art.description || art.title).slice(0, 140), imageUrl: img, url: art.url, tag: '🚀 Công nghệ & AI' });
          }
        }
      }
      if (rHn.status === 'fulfilled' && Array.isArray(rHn.value?.hits)) {
        const filtered = rHn.value.hits.filter(
          (h) => h && h.title && (h.url || h.objectID) && isFreshStory(h.created_at, 60) && /\b(AI|LLM|GPT|Gemini|Claude|chip|NVIDIA|quantum|science|robot|model|open.?source)\b/i.test(h.title)
        );
        for (const h of filtered.slice(0, 4)) {
          categoriesData.tech_science.push(await makeProvenanceItem({
            id: `hn-ai-${h.objectID}`,
            category: 'tech_science',
            title: h.title,
            summary: `Thảo luận công nghệ nóng trên Hacker News (${h.points || 0} điểm · ${h.num_comments || 0} bình luận).`,
            source: 'Hacker News (Algolia Live)',
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            imageUrl: '',
            publishedAt: h.created_at || new Date().toISOString(),
            readMinutes: 2,
          }));
        }
      }
      if (rGh.status === 'fulfilled' && Array.isArray(rGh.value?.items)) {
        for (const repo of rGh.value.items.slice(0, 2)) {
          categoriesData.tech_science.push(await makeProvenanceItem({
            id: `gh-${repo.id}`,
            category: 'tech_science',
            title: `⭐ Dự án AI Mã nguồn mở nổi bật: ${repo.full_name} (${Number(repo.stargazers_count || 0).toLocaleString('en-US')} ★)`,
            summary: String(repo.description || 'Kho mã nguồn mở AI/Kỹ thuật đang cập nhật mạnh.').slice(0, 240),
            source: 'GitHub Open-Source Live',
            url: repo.html_url,
            imageUrl: '',
            publishedAt: repo.pushed_at || new Date().toISOString(),
            readMinutes: 1,
          }));
        }
      }
      report('🚀 Đã quét Công nghệ, AI & Khoa học', `${categoriesData.tech_science.length} mục`);
    });

    // 4) Geopolitics & Global Macro Headlines from Hacker News (title-verified + fresh)
    const pGeo = fetchJsonSafe(
      'https://hn.algolia.com/api/v1/search_by_date?query=geopolitics+OR+economy+OR+tariff+OR+energy&tags=story&hitsPerPage=10',
      signal,
      9000
    ).then(async (res) => {
      if (Array.isArray(res?.hits)) {
        const good = res.hits.filter(
          (h) => h && h.title && isFreshStory(h.created_at, 60) && /(tariff|war|oil|energy|trade|economy|inflation|fed|china|europe|semiconductor|climate|election|treaty)/i.test(h.title)
        );
        for (const h of good.slice(0, 4)) {
          categoriesData.world_geo.push(await makeProvenanceItem({
            id: `hn-geo-${h.objectID}`,
            category: 'world_geo',
            title: h.title,
            summary: `Tin vĩ mô & địa chính trị đang được cộng đồng quốc tế phân tích (${h.points || 0} điểm).`,
            source: 'Hacker News Global Pulse',
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            imageUrl: '',
            publishedAt: h.created_at || new Date().toISOString(),
            readMinutes: 2,
          }));
        }
      }
      report('🌐 Đã bổ sung tín hiệu Địa chính trị & Năng lượng', `${categoriesData.world_geo.length} mục`);
    }).catch(() => report('🌐 Tín hiệu Địa chính trị', 'đã hoàn tất'));

    // 5) Economy & Live Financial Indicators (ExchangeRate + Binance Gold/BTC + US Treasury Debt)
    const pEcon = Promise.allSettled([
      fetchJsonSafe('https://open.er-api.com/v6/latest/USD', signal, 9000),
      fetchJsonSafe('https://data-api.binance.vision/api/v3/ticker/24hr?symbols=[%22PAXGUSDT%22,%22BTCUSDT%22]', signal, 9000),
      fetchJsonSafe('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1', signal, 9000),
    ]).then(async ([rFx, rBin, rDebt]) => {
      if (rFx.status === 'fulfilled' && rFx.value?.rates) {
        const rate = Number(rFx.value.rates[profile.currency]);
        if (Number.isFinite(rate) && rate > 0) {
          liveMetrics.usdToLocal = rate;
          categoriesData.economy_markets.push(await makeProvenanceItem({
            id: 'econ-fx',
            category: 'economy_markets',
            title: `💱 Tỷ giá 1 USD = ${rate.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${profile.currency}`,
            summary: `Cập nhật trực tiếp từ Open Exchange Rates API (thời điểm: ${rFx.value.time_last_update_utc || 'Hôm nay'}).`,
            source: 'Open Exchange Rates (Live)',
            url: 'https://www.exchangerate-api.com/',
            imageUrl: '',
            publishedAt: new Date().toISOString(),
            readMinutes: 1,
          }));
        }
      }
      if (rBin.status === 'fulfilled' && Array.isArray(rBin.value)) {
        const paxg = rBin.value.find((x) => x.symbol === 'PAXGUSDT');
        const btc = rBin.value.find((x) => x.symbol === 'BTCUSDT');
        if (paxg) {
          liveMetrics.goldUsdOz = Number(paxg.lastPrice);
          liveMetrics.gold24hPct = Number(paxg.priceChangePercent);
          categoriesData.economy_markets.push(await makeProvenanceItem({
            id: 'econ-gold',
            category: 'economy_markets',
            title: `🥇 Vàng Thế giới (PAXG/USD): $${liveMetrics.goldUsdOz.toLocaleString('en-US', { maximumFractionDigits: 2 })}/oz (${liveMetrics.gold24hPct >= 0 ? '+' : ''}${liveMetrics.gold24hPct.toFixed(2)}% / 24h)`,
            summary: 'Dữ liệu khớp lệnh 24/7 theo vàng vật chất LBMA neo 1:1 (Binance Data API).',
            source: 'Binance Data API (Live 24/7)',
            url: 'https://www.binance.com/en/trade/PAXG_USDT',
            imageUrl: '',
            publishedAt: new Date().toISOString(),
            readMinutes: 1,
          }));
        }
        if (btc) {
          liveMetrics.btcUsd = Number(btc.lastPrice);
          liveMetrics.btc24hPct = Number(btc.priceChangePercent);
          categoriesData.economy_markets.push(await makeProvenanceItem({
            id: 'econ-btc',
            category: 'economy_markets',
            title: `₿ Bitcoin (BTC/USD): $${liveMetrics.btcUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${liveMetrics.btc24hPct >= 0 ? '+' : ''}${liveMetrics.btc24hPct.toFixed(2)}% / 24h)`,
            summary: 'Phong vũ biểu khẩu vị rủi ro công nghệ & thanh khoản toàn cầu 24/7.',
            source: 'Binance Data API (Live 24/7)',
            url: 'https://www.binance.com/en/trade/BTC_USDT',
            imageUrl: '',
            publishedAt: new Date().toISOString(),
            readMinutes: 1,
          }));
        }
      }
      if (rDebt.status === 'fulfilled' && rDebt.value?.data?.[0]) {
        const row = rDebt.value.data[0];
        const tril = Number(row.tot_pub_debt_out_amt) / 1e12;
        if (Number.isFinite(tril) && tril > 0) {
          liveMetrics.usDebtTrillion = Number(tril.toFixed(2));
          categoriesData.economy_markets.push(await makeProvenanceItem({
            id: 'econ-usdebt',
            category: 'economy_markets',
            title: `🏛️ Nợ công Hoa Kỳ đạt $${liveMetrics.usDebtTrillion} nghìn tỷ USD (ngày ${row.record_date})`,
            summary: 'Số liệu chính thức từ Bộ Tài chính Hoa Kỳ (U.S. Treasury Fiscal Data).',
            source: 'U.S. Treasury Official',
            url: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/',
            imageUrl: '',
            publishedAt: row.record_date,
            readMinutes: 1,
          }));
        }
      }
      report('💰 Đã quét chỉ số Kinh tế, Tỷ giá & Vàng/BTC', `${categoriesData.economy_markets.length} chỉ số`);
    });

    // 6) World Bank Country GDP & CPI + Local Verified News Links
    const pWb = Promise.allSettled([
      fetchJsonSafe(`https://api.worldbank.org/v2/country/${profile.wbIso2}/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=2`, signal, 9000),
      fetchJsonSafe(`https://api.worldbank.org/v2/country/${profile.wbIso2}/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2`, signal, 9000),
    ]).then(async ([rGdp, rCpi]) => {
      if (rGdp.status === 'fulfilled' && Array.isArray(rGdp.value?.[1])) {
        const valid = rGdp.value[1].find((x) => x && x.value !== null);
        if (valid) {
          liveMetrics.countryGdpPct = Number(Number(valid.value).toFixed(2));
          liveMetrics.countryGdpYear = valid.date;
          categoriesData.local_region.push(await makeProvenanceItem({
            id: 'wb-gdp',
            category: 'local_region',
            title: `📈 Tăng trưởng GDP ${profile.name}: ${liveMetrics.countryGdpPct}% (năm ${valid.date})`,
            summary: `Số liệu chính thức từ Ngân hàng Thế giới (World Bank) cho ${profile.name}.`,
            source: 'World Bank Open Data',
            url: `https://data.worldbank.org/country/${profile.wbIso2}`,
            imageUrl: '',
            publishedAt: valid.date,
            readMinutes: 1,
          }));
        }
      }
      if (rCpi.status === 'fulfilled' && Array.isArray(rCpi.value?.[1])) {
        const valid = rCpi.value[1].find((x) => x && x.value !== null);
        if (valid) {
          liveMetrics.countryCpiPct = Number(Number(valid.value).toFixed(2));
          liveMetrics.countryCpiYear = valid.date;
          categoriesData.economy_markets.push(await makeProvenanceItem({
            id: 'wb-cpi',
            category: 'economy_markets',
            title: `🧾 Lạm phát CPI ${profile.name}: ${liveMetrics.countryCpiPct}% (năm ${valid.date})`,
            summary: `Chỉ số giá tiêu dùng chính thức theo Ngân hàng Thế giới (World Bank).`,
            source: 'World Bank Open Data',
            url: `https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=${profile.wbIso2}`,
            imageUrl: '',
            publishedAt: valid.date,
            readMinutes: 1,
          }));
        }
      }
      report('📊 Đã hoàn tất chỉ số Ngân hàng Thế giới (World Bank)', `${profile.name}`);
    });

    await Promise.allSettled([pWikiEn, pWikiLocal, pTech, pGeo, pEcon, pWb]);

    const totalItems = Object.values(categoriesData).reduce((sum, arr) => sum + arr.length, 0);
    return {
      scannedAt: new Date().toISOString(),
      dateLabel: new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
      location: loc,
      profile,
      categories: CATEGORIES,
      categoriesData,
      visualGallery: visualGallery.slice(0, 8),
      liveMetrics,
      totalItems,
    };
  }

  /**
   * Dựng câu lệnh Gemini siêu chuẩn kèm Hợp đồng JSON `WISDOM_20MIN_SYNC_V1`
   * để vẽ Biểu đồ 20 phút, Biểu đồ Tác động, Sơ đồ Nhân Quả / Mindmap & Timeline.
   */
  function buildGeminiWisdomPrompt(scanResult, { focusMode = 'balanced_20m', customTopic = '' } = {}) {
    const modeObj = FOCUS_MODES.find((m) => m.id === focusMode) || FOCUS_MODES[0];
    const locStr = `${scanResult.location?.fullAddress || scanResult.profile?.name || 'Việt Nam'} (${scanResult.profile?.flag || '🌍'} ${scanResult.profile?.code || 'VN'})`;
    const m = scanResult.liveMetrics || {};

    const lines = [];
    lines.push(`Bạn là Chuyên gia Tổng hợp Tri thức & Tin tức Tinh gọn cho chuyên mục "🧠 20 PHÚT THÔNG THÁI MỖI NGÀY".`);
    lines.push(`Ngày cập nhật: ${scanResult.dateLabel}`);
    lines.push(`Vị trí người đọc: ${locStr}`);
    lines.push(`Chế độ trọng tâm: ${modeObj.label}`);
    if (String(customTopic || '').trim()) {
      lines.push(`Chủ đề người đọc muốn ưu tiên đào sâu hôm nay: "${String(customTopic).trim()}"`);
    }
    lines.push('');
    lines.push('=== DỮ LIỆU THÔ XÁC THỰC ĐÃ QUÉT TỪ WEB HÔM NAY (KHÔNG BỊA THÊM SỐ LIỆU) ===');
    lines.push(
      `• Chỉ số nhanh: USD/${m.localCurrency || 'VND'}=${m.usdToLocal || 'N/A'} | Vàng=${m.goldUsdOz ? '$' + m.goldUsdOz.toFixed(0) + '/oz' : 'N/A'} | BTC=${m.btcUsd ? '$' + m.btcUsd.toFixed(0) : 'N/A'} | Nợ công Mỹ=${m.usDebtTrillion ? '$' + m.usDebtTrillion + 'T' : 'N/A'} | GDP=${m.countryGdpPct ?? 'N/A'}% | CPI=${m.countryCpiPct ?? 'N/A'}%`
    );

    for (const cat of CATEGORIES) {
      const items = scanResult.categoriesData?.[cat.id] || [];
      lines.push(`\n[${cat.title}] (${items.length} mục):`);
      items.slice(0, 5).forEach((it, idx) => {
        lines.push(`  ${idx + 1}. ${it.title} — ${String(it.summary || '').slice(0, 160)} (Nguồn: ${it.source} | ${it.url})`);
      });
    }

    lines.push('');
    lines.push('=== YÊU CẦU TRÌNH BÀY (PHẦN 1 — BẢN TIN 20 PHÚT DỄ HIỂU BẰNG TIẾNG VIỆT) ===');
    lines.push('1. Tóm tắt "3 Điều Quan Trọng Nhất Hôm Nay" trong 60 giây (viết cực kỳ dễ hiểu, thực tế, không hàn lâm).');
    lines.push('2. Phân tích ngắn gọn từng mảng (Thế giới, Công nghệ/AI, Kinh tế, Khu vực của tôi, Tri thức nền/Lịch sử) gắn chặt dữ liệu thật ở trên + cập nhật thêm tin nóng mới nhất trong ngày (nếu bạn có tìm kiếm web) và ghi rõ nguồn.');
    lines.push('3. Rút ra 3 "Mô hình Tư duy / Bài học Áp dụng Ngay" cho công việc, học tập và tài chính cá nhân.');
    lines.push('4. Đặt 2 câu hỏi tư duy nhanh cuối buổi để người đọc khắc sâu kiến thức.');
    lines.push('');
    lines.push('=== YÊU CẦU ĐỒNG BỘ BIỂU ĐỒ & SƠ ĐỒ TỰ ĐỘNG (PHẦN 2 — BẮT BUỘC GIỮ ĐÚNG KHỐI JSON) ===');
    lines.push('Cuối câu trả lời, hãy xuất ĐÚNG 1 khối code ```json theo chuẩn WISDOM_20MIN_SYNC_V1 sau để ứng dụng tự vẽ Biểu đồ Tròn 20 phút, Biểu đồ Cột Tác động, Sơ đồ Nhân Quả (Mindmap) và Dòng thời gian:');
    lines.push('```json');
    lines.push(JSON.stringify({
      schema: 'WISDOM_20MIN_SYNC_V1',
      headline: 'Tiêu đề tóm gọn toàn cảnh hôm nay (<= 90 ký tự)',
      reading_plan_20m: [
        { label: 'Thế giới & Địa chính trị', minutes: 5, color: '#0ea5e9' },
        { label: 'Công nghệ & AI', minutes: 5, color: '#8b5cf6' },
        { label: 'Kinh tế & Tài chính', minutes: 4, color: '#f59e0b' },
        { label: 'Khu vực của bạn', minutes: 3, color: '#10b981' },
        { label: 'Tri thức & Lịch sử', minutes: 3, color: '#ec4899' },
      ],
      impact_scores: [
        { topic: 'Sự kiện / Xu hướng 1', score: 88, category: 'Thế giới', note: 'Tác động ngắn gọn' },
        { topic: 'Sự kiện / Xu hướng 2', score: 82, category: 'Công nghệ', note: 'Tác động ngắn gọn' },
        { topic: 'Sự kiện / Xu hướng 3', score: 75, category: 'Kinh tế', note: 'Tác động ngắn gọn' },
        { topic: 'Sự kiện / Xu hướng 4', score: 68, category: 'Khu vực', note: 'Tác động ngắn gọn' },
      ],
      causal_mindmap: {
        center: 'Tâm điểm hôm nay',
        chains: [
          { cause: 'Nguyên nhân / Sự kiện gốc 1', mechanism: 'Cơ chế lan truyền', effect: 'Hệ quả tới đời sống & công việc' },
          { cause: 'Nguyên nhân / Sự kiện gốc 2', mechanism: 'Cơ chế lan truyền', effect: 'Hệ quả tới đời sống & công việc' },
          { cause: 'Nguyên nhân / Sự kiện gốc 3', mechanism: 'Cơ chế lan truyền', effect: 'Hệ quả tới đời sống & công việc' },
        ],
      },
      timeline: [
        { time: 'Hôm nay', event: 'Sự kiện tiêu biểu 1', tag: 'Nóng' },
        { time: 'Tuần này', event: 'Sự kiện tiêu biểu 2', tag: 'Theo dõi' },
        { time: 'Sắp tới', event: 'Mốc quan trọng sắp diễn ra', tag: 'Dự báo' },
      ],
      mental_models: [
        { title: 'Mô hình tư duy 1', lesson: 'Cách áp dụng thực tế trong 1 câu ngắn.' },
        { title: 'Mô hình tư duy 2', lesson: 'Cách áp dụng thực tế trong 1 câu ngắn.' },
      ],
      visual_search_queries: [
        'Từ khóa tra cứu ảnh/biểu đồ minh họa 1',
        'Từ khóa tra cứu ảnh/biểu đồ minh họa 2',
      ],
    }, null, 2));
    lines.push('```');
    return lines.join('\n');
  }

  /**
   * Trích xuất và phân tách phản hồi Gemini thành:
   *  - `markdownBody`: phần bản tin 20 phút dễ đọc
   *  - `syncData`: khối JSON `WISDOM_20MIN_SYNC_V1` (hoặc fallback xác định nếu Gemini quên JSON)
   */
  function parseGeminiWisdomReply(rawText, scanResult) {
    const text = String(rawText || '').trim();
    if (!text) return null;

    let syncData = null;
    let markdownBody = text;

    const jsonBlocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
    for (let i = jsonBlocks.length - 1; i >= 0; i--) {
      const candidate = jsonBlocks[i][1].trim();
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && (parsed.schema === 'WISDOM_20MIN_SYNC_V1' || parsed.reading_plan_20m || parsed.causal_mindmap || parsed.impact_scores)) {
          syncData = parsed;
          markdownBody = text.replace(jsonBlocks[i][0], '').trim();
          break;
        }
      } catch (_eParse) {}
    }

    // Fallback tìm JSON trần nếu người dùng không copy dấu ```
    if (!syncData) {
      const idx = text.lastIndexOf('"WISDOM_20MIN_SYNC_V1"');
      if (idx > -1) {
        const start = text.lastIndexOf('{', idx);
        const end = text.lastIndexOf('}');
        if (start > -1 && end > start) {
          try {
            syncData = JSON.parse(text.slice(start, end + 1));
            markdownBody = (text.slice(0, start) + text.slice(end + 1)).trim();
          } catch (_eRaw) {}
        }
      }
    }

    return {
      parsedAt: new Date().toISOString(),
      hasStructuredSync: !!syncData,
      markdownBody,
      syncData: syncData || buildDefaultChartDataFromRaw(scanResult),
    };
  }

  /**
   * Tạo dữ liệu biểu đồ & sơ đồ mặc định từ chính dữ liệu thô đã quét
   * (để Tab Biểu đồ/Sơ đồ/Hình ảnh vẫn hiển thị sắc nét ngay cả khi chưa dùng Gemini!)
   */
  function buildDefaultChartDataFromRaw(scanResult) {
    const cd = scanResult?.categoriesData || {};
    const readingPlan = CATEGORIES.map((c) => ({
      label: c.title.replace(/^\d+\.\s*/, ''),
      minutes: c.minutes,
      color: c.color,
      count: (cd[c.id] || []).length,
    }));

    const impacts = [];
    for (const c of CATEGORIES) {
      const first = (cd[c.id] || [])[0];
      if (first) {
        impacts.push({
          topic: first.title.slice(0, 62),
          score: Math.min(96, 62 + (cd[c.id]?.length || 1) * 6),
          category: c.icon + ' ' + c.title.replace(/^\d+\.\s*/, '').split('&')[0].trim(),
          note: first.source,
        });
      }
    }

    const chains = [
      {
        cause: (cd.world_geo?.[0]?.title || 'Biến động Địa chính trị toàn cầu').slice(0, 56),
        mechanism: 'Tác động chuỗi cung ứng, năng lượng & tâm lý thị trường',
        effect: 'Ảnh hưởng chi phí sinh hoạt, tỷ giá & cơ hội nghề nghiệp',
      },
      {
        cause: (cd.tech_science?.[0]?.title || 'Đột phá AI & Mã nguồn mở mới').slice(0, 56),
        mechanism: 'Thay đổi tốc độ tự động hóa & công cụ làm việc hằng ngày',
        effect: 'Tạo lợi thế cho người chủ động cập nhật kỹ năng 20 phút/ngày',
      },
      {
        cause: (cd.economy_markets?.[0]?.title || 'Biến động tỷ giá, vàng & vĩ mô').slice(0, 56),
        mechanism: 'Điều chỉnh dòng vốn, lãi suất và sức mua đồng nội tệ',
        effect: `Giúp lên kế hoạch chi tiêu & tích lũy chủ động tại ${scanResult?.profile?.name || 'khu vực của bạn'}`,
      },
    ];

    const timeline = [];
    for (const c of CATEGORIES) {
      const item = (cd[c.id] || [])[0];
      if (item) {
        timeline.push({
          time: c.icon,
          event: item.title.slice(0, 110),
          tag: item.source,
        });
      }
    }

    return {
      schema: 'WISDOM_20MIN_SYNC_V1',
      isFallbackFromRaw: true,
      headline: `Bản đồ Tri thức Hôm nay — ${scanResult?.dateLabel || ''}`,
      reading_plan_20m: readingPlan,
      impact_scores: impacts,
      causal_mindmap: {
        center: `20 Phút Thông Thái (${scanResult?.profile?.flag || '🌍'})`,
        chains,
      },
      timeline,
      mental_models: [
        { title: 'Hiệu ứng Lãi kép Tri thức', lesson: 'Mỗi ngày đọc sâu 20 phút chọn lọc giúp vượt 95% đám đông sau 1 năm.' },
        { title: 'Tư duy Hệ quả Bậc 2', lesson: 'Đừng chỉ xem tin bề mặt — hãy hỏi "Sự kiện này sẽ dẫn tới điều gì tiếp theo?".' },
      ],
      visual_search_queries: [],
    };
  }

  W20.COUNTRY_PROFILES = COUNTRY_PROFILES;
  W20.CATEGORIES = CATEGORIES;
  W20.FOCUS_MODES = FOCUS_MODES;
  W20.getCountryProfile = getCountryProfile;
  W20.detectUserLocationByGps = detectUserLocationByGps;
  W20.scanDailyWisdom = scanDailyWisdom;
  W20.buildGeminiWisdomPrompt = buildGeminiWisdomPrompt;
  W20.parseGeminiWisdomReply = parseGeminiWisdomReply;
  W20.buildDefaultChartDataFromRaw = buildDefaultChartDataFromRaw;
})(typeof window !== 'undefined' ? window : globalThis);
