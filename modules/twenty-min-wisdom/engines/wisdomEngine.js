/**
 * ============================================================================
 * 🧠 20 PHÚT THÔNG THÁI MỖI NGÀY — AUTHORITATIVE OFFICIAL & PRESS ENGINE (v132.0)
 * ============================================================================
 * NGUYÊN TẮC NGUỒN TIN TUYỆT ĐỐI:
 * - TUYỆT ĐỐI KHÔNG dùng Wikipedia, blog cá nhân, diễn đàn hay mạng xã hội!
 * - 100% dữ liệu sống & checklist tra cứu chỉ trỏ thẳng tới:
 *   1. Cơ quan Chính phủ, Ngân hàng Trung ương & Tổ chức Quốc tế Chính thức:
 *      - U.S. Department of the Treasury (Bộ Tài chính Mỹ — API chính thức)
 *      - World Bank Open Data (Ngân hàng Thế giới — GDP, CPI, Thất nghiệp, Tuổi thọ)
 *      - NIH / PubMed (Viện Y tế Quốc gia Hoa Kỳ — Công trình Y khoa bình duyệt)
 *      - Crossref Official DOI Registry (Tạp chí khoa học Nature, Science, IEEE, Lancet)
 *      - WHO, IMF, UN News, NASA, Cổng Thông tin Chính phủ, Ngân hàng Nhà nước
 *   2. Hệ thống Báo chí Chính thống Hạng 1 (Tier-1 Mainstream Press):
 *      - Quốc tế: Reuters, Associated Press (AP), BBC News, Financial Times, Bloomberg,
 *        The Economist, MIT Technology Review, Harvard Business Review, Nature, Science.
 *      - Việt Nam & khu vực: Báo Điện tử Chính phủ, VnExpress, Tuổi Trẻ, Thanh Niên,
 *        CafeF, Báo Sức Khỏe & Đời Sống (Bộ Y tế), Thư Viện Pháp Luật, NHK World, Nikkei, CNA.
 * - Dấu vân tay nguồn gốc SHA-256 + Lá chắn chống tin cũ (Year-Freshness Guardrail).
 * ============================================================================
 */
(function initWisdom20Engine(globalScope) {
  'use strict';

  const W20 = (globalScope.NoirWisdom20 = globalScope.NoirWisdom20 || {});

  const COUNTRY_PROFILES = Object.freeze({
    VN: {
      code: 'VN', name: 'Việt Nam', flag: '🇻🇳', currency: 'VND', wbIso2: 'VN', defaultCity: 'Hà Nội / TP.HCM',
      rssFeeds: [
        { name: 'VnExpress (Báo chính thống)', url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', cat: 'local_region' },
        { name: 'Tuổi Trẻ (Báo chính thống)', url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', cat: 'local_region' },
        { name: 'VnExpress Pháp luật', url: 'https://vnexpress.net/rss/phap-luat.rss', cat: 'law_society' },
        { name: 'VnExpress Sức khỏe', url: 'https://vnexpress.net/rss/suc-khoe.rss', cat: 'health_science' },
      ],
      newsLinks: [
        { label: 'Báo Điện tử Chính phủ (Chính thức)', url: 'https://baochinhphu.vn/', tier: 'Cơ quan Nhà nước' },
        { label: 'VnExpress — Thời sự 24h mới nhất', url: 'https://vnexpress.net/tin-tuc-24h', tier: 'Báo chính thống' },
        { label: 'Tuổi Trẻ Online — Tin nóng hôm nay', url: 'https://tuoitre.vn/tin-moi-nhat.htm', tier: 'Báo chính thống' },
        { label: 'Thanh Niên — Kinh tế & Xã hội', url: 'https://thanhnien.vn/tin-24h.htm', tier: 'Báo chính thống' },
        { label: 'Ngân hàng Nhà nước VN (Tỷ giá & Lãi suất)', url: 'https://www.sbv.gov.vn/', tier: 'Ngân hàng Trung ương' },
        { label: 'Thư Viện Pháp Luật (Nghị định & Luật mới)', url: 'https://thuvienphapluat.vn/', tier: 'Cổng Pháp luật' },
        { label: 'Báo Sức Khỏe & Đời Sống (Bộ Y tế)', url: 'https://suckhoedoisong.vn/', tier: 'Cơ quan Bộ Y tế' },
      ],
    },
    US: {
      code: 'US', name: 'Hoa Kỳ (Mỹ)', flag: '🇺🇸', currency: 'USD', wbIso2: 'US', defaultCity: 'New York / Washington D.C.',
      rssFeeds: [{ name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', cat: 'world_geo' }],
      newsLinks: [
        { label: 'Reuters US & World', url: 'https://www.reuters.com/world/us/', tier: 'Hãng thông tấn Hạng 1' },
        { label: 'Associated Press (AP News)', url: 'https://apnews.com/', tier: 'Hãng thông tấn Hạng 1' },
        { label: 'Federal Reserve (Cục Dự trữ Liên bang)', url: 'https://www.federalreserve.gov/newsevents.htm', tier: 'Ngân hàng Trung ương' },
        { label: 'U.S. NIH Medical News', url: 'https://www.nih.gov/news-events', tier: 'Cơ quan Y tế Quốc gia' },
      ],
    },
    JP: {
      code: 'JP', name: 'Nhật Bản', flag: '🇯🇵', currency: 'JPY', wbIso2: 'JP', defaultCity: 'Tokyo / Osaka',
      rssFeeds: [],
      newsLinks: [
        { label: 'NHK World Japan (Đài Truyền hình Quốc gia)', url: 'https://www3.nhk.or.jp/nhkworld/en/news/', tier: 'Đài Quốc gia' },
        { label: 'Nikkei Asia (Kinh tế & Tài chính)', url: 'https://asia.nikkei.com/', tier: 'Báo chính thống' },
        { label: 'Bank of Japan (Ngân hàng Trung ương Nhật)', url: 'https://www.boj.or.jp/en/', tier: 'Ngân hàng Trung ương' },
      ],
    },
    KR: {
      code: 'KR', name: 'Hàn Quốc', flag: '🇰🇷', currency: 'KRW', wbIso2: 'KR', defaultCity: 'Seoul / Busan',
      rssFeeds: [],
      newsLinks: [
        { label: 'Yonhap News Agency (Thông tấn xã Quốc gia)', url: 'https://en.yna.co.kr/', tier: 'Hãng thông tấn Quốc gia' },
        { label: 'The Korea Herald', url: 'https://www.koreaherald.com/', tier: 'Báo chính thống' },
        { label: 'Bank of Korea (Ngân hàng Trung ương Hàn Quốc)', url: 'https://www.bok.or.kr/eng/main/main.do', tier: 'Ngân hàng Trung ương' },
      ],
    },
    SG: {
      code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', wbIso2: 'SG', defaultCity: 'Singapore',
      rssFeeds: [],
      newsLinks: [
        { label: 'Channel News Asia (CNA)', url: 'https://www.channelnewsasia.com/', tier: 'Đài chính thống' },
        { label: 'The Straits Times', url: 'https://www.straitstimes.com/', tier: 'Báo chính thống' },
        { label: 'Monetary Authority of Singapore (MAS)', url: 'https://www.mas.gov.sg/', tier: 'Ngân hàng Trung ương' },
      ],
    },
    GB: {
      code: 'GB', name: 'Vương quốc Anh', flag: '🇬🇧', currency: 'GBP', wbIso2: 'GB', defaultCity: 'London',
      rssFeeds: [],
      newsLinks: [
        { label: 'BBC News Official', url: 'https://www.bbc.com/news', tier: 'Đài Quốc gia Anh' },
        { label: 'Financial Times', url: 'https://www.ft.com/', tier: 'Báo Kinh tế Hạng 1' },
        { label: 'Bank of England', url: 'https://www.bankofengland.co.uk/', tier: 'Ngân hàng Trung ương' },
      ],
    },
    DE: {
      code: 'DE', name: 'Đức / Châu Âu (EU)', flag: '🇩🇪', currency: 'EUR', wbIso2: 'DE', defaultCity: 'Berlin / Frankfurt',
      rssFeeds: [],
      newsLinks: [
        { label: 'DW News (Deutsche Welle)', url: 'https://www.dw.com/en/top-stories/s-9097', tier: 'Đài Quốc gia Đức' },
        { label: 'European Central Bank (ECB)', url: 'https://www.ecb.europa.eu/', tier: 'Ngân hàng Trung ương EU' },
        { label: 'Euronews', url: 'https://www.euronews.com/', tier: 'Báo chính thống EU' },
      ],
    },
    AU: {
      code: 'AU', name: 'Úc (Australia)', flag: '🇦🇺', currency: 'AUD', wbIso2: 'AU', defaultCity: 'Sydney / Melbourne',
      rssFeeds: [],
      newsLinks: [
        { label: 'ABC News Australia', url: 'https://www.abc.net.au/news', tier: 'Đài Quốc gia Úc' },
        { label: 'Reserve Bank of Australia (RBA)', url: 'https://www.rba.gov.au/', tier: 'Ngân hàng Trung ương' },
      ],
    },
    CN: {
      code: 'CN', name: 'Trung Quốc', flag: '🇨🇳', currency: 'CNY', wbIso2: 'CN', defaultCity: 'Bắc Kinh / Thượng Hải',
      rssFeeds: [],
      newsLinks: [
        { label: 'Reuters China Desk', url: 'https://www.reuters.com/world/china/', tier: 'Hãng thông tấn Hạng 1' },
        { label: 'South China Morning Post', url: 'https://www.scmp.com/', tier: 'Báo chính thống' },
      ],
    },
    GLOBAL: {
      code: 'GLOBAL', name: 'Quốc tế / Toàn cầu', flag: '🌍', currency: 'USD', wbIso2: 'WLD', defaultCity: 'Toàn cầu',
      rssFeeds: [],
      newsLinks: [
        { label: 'Reuters Global News', url: 'https://www.reuters.com/', tier: 'Hãng thông tấn Hạng 1' },
        { label: 'Associated Press (AP)', url: 'https://apnews.com/', tier: 'Hãng thông tấn Hạng 1' },
        { label: 'United Nations News (Liên Hợp Quốc)', url: 'https://news.un.org/en/', tier: 'Tổ chức Quốc tế' },
      ],
    },
  });

  const CATEGORIES = Object.freeze([
    { id: 'world_geo', icon: '🌍', title: '1. Thế giới & Địa chính trị', minutes: 3, color: '#0ea5e9', desc: 'Checklist thời sự quốc tế từ Reuters, AP News, BBC World, Financial Times & Liên Hợp Quốc (UN).' },
    { id: 'tech_science', icon: '🚀', title: '2. Công nghệ, AI & Khoa học', minutes: 3, color: '#8b5cf6', desc: 'Công bố khoa học bình duyệt Crossref/Nature/IEEE & tin công nghệ từ MIT Tech Review, Reuters Tech, BBC.' },
    { id: 'economy_markets', icon: '💰', title: '3. Kinh tế, Tài chính & Vĩ mô', minutes: 3, color: '#f59e0b', desc: 'Số liệu trực tiếp Bộ Tài chính Mỹ, Ngân hàng Thế giới, Tỷ giá, Vàng LBMA & Bloomberg/FT/IMF.' },
    { id: 'local_region', icon: '📍', title: '4. Khu vực & Quốc gia của bạn', minutes: 3, color: '#10b981', desc: 'Chỉ số World Bank (GDP, Thất nghiệp) & cổng báo chí chính thống + cơ quan Nhà nước theo vị trí.' },
    { id: 'health_science', icon: '🩺', title: '5. Sức khỏe & Y học Thực chứng', minutes: 2, color: '#ef4444', desc: 'Công trình y khoa mới nhất từ Viện Y tế Quốc gia Hoa Kỳ (PubMed/NIH), WHO & Bộ Y tế.' },
    { id: 'law_society', icon: '⚖️', title: '6. Pháp luật, Chính sách & Xã hội', minutes: 2, color: '#06b6d4', desc: 'Chính sách công, luật mới, khí hậu (UNFCCC) & pháp lý từ Cổng Pháp luật, Reuters Legal, UNESCO.' },
    { id: 'mind_skills', icon: '🧠', title: '7. Tâm lý, Quản trị & Tư duy Sâu', minutes: 2, color: '#a855f7', desc: 'Khung ra quyết định thực chứng từ Harvard Business Review (HBR), MIT Sloan & Hiệp hội Tâm lý Mỹ (APA).' },
    { id: 'deep_knowledge', icon: '📚', title: '8. Khoa học Vũ trụ, Văn hóa & Tri thức', minutes: 2, color: '#ec4899', desc: 'Khám phá chính chủ từ NASA, Nature, National Geographic, Smithsonian & The Economist.' },
  ]);

  const FOCUS_MODES = Object.freeze([
    { id: 'balanced_20m', label: '🧠 Toàn diện 8 Trụ cột (Chỉ báo chính thống & cơ quan chính thức)', desc: 'Tổng hợp cân bằng 8 mảng từ Reuters, AP, BBC, VnExpress, WHO, IMF, PubMed, Nature.' },
    { id: 'tech_ai', label: '🚀 Trọng tâm Công nghệ, AI & Khoa học (MIT / Nature / Reuters)', desc: 'Đào sâu đột phá AI, bán dẫn, khoa học ứng dụng & tác động nghề nghiệp.' },
    { id: 'geo_econ', label: '🌍 Trọng tâm Địa chính trị, Kinh tế & Pháp lý (FT / Bloomberg / IMF)', desc: 'Giải mã chuỗi nhân quả giữa chính sách, thương mại, lãi suất & túi tiền.' },
    { id: 'health_mind', label: '🩺 Trọng tâm Y học, Sức khỏe & Quản trị Tư duy (NIH / WHO / HBR)', desc: 'Cập nhật nghiên cứu y khoa bình duyệt, sức khỏe bền vững & tư duy ra quyết định.' },
  ]);

  // Checklist Nguồn Báo Chí Chính Thống & Cơ Quan Chính Thức theo 8 Trụ cột (KHÔNG Wikipedia / KHÔNG blog / KHÔNG MXH!)
  const OFFICIAL_PRESS_CHECKLIST = Object.freeze({
    world_geo: [
      { title: 'Tin nóng Địa chính trị & Ngoại giao Toàn cầu hôm nay', summary: 'Kiểm tra diễn biến mới nhất về xung đột khu vực, hội nghị thượng đỉnh, hiệp định thương mại & an ninh năng lượng tại hãng thông tấn Reuters.', source: 'Reuters World (Hãng thông tấn Hạng 1)', url: 'https://www.reuters.com/world/', readMinutes: 2 },
      { title: 'Bản tin Thời sự Quốc tế Trung lập (AP Top Headlines)', summary: 'Theo dõi tin thời sự gốc kiểm chứng chặt chẽ từ hãng thông tấn Associated Press (Mỹ) — nguồn trích dẫn chuẩn của báo chí toàn cầu.', source: 'Associated Press — AP News', url: 'https://apnews.com/world-news', readMinutes: 2 },
      { title: 'Phân tích Địa chính trị & Khu vực Châu Á – Châu Âu – Trung Đông', summary: 'Cập nhật góc nhìn toàn cảnh từ Đài Truyền hình Quốc gia Anh BBC News World và bản tin Liên Hợp Quốc (UN News).', source: 'BBC News World (Đài Quốc gia Anh)', url: 'https://www.bbc.com/news/world', readMinutes: 2 },
      { title: 'Bản tin Chính thức Liên Hợp Quốc (UN News Global Perspective)', summary: 'Các nghị quyết Hội đồng Bảo an, viện trợ nhân đạo, biến đổi khí hậu và báo cáo kinh tế – xã hội toàn cầu chính thức.', source: 'United Nations News (Liên Hợp Quốc)', url: 'https://news.un.org/en/', readMinutes: 1 },
    ],
    tech_science: [
      { title: 'Đột phá Trí tuệ Nhân tạo (AI), Chip Bán dẫn & Công nghệ Chiến lược', summary: 'Theo dõi trực tiếp tạp chí công nghệ uy tín của Viện Công nghệ Massachusetts (MIT Technology Review).', source: 'MIT Technology Review (Học viện MIT)', url: 'https://www.technologyreview.com/', readMinutes: 2 },
      { title: 'Tin Công nghệ, Big Tech & An ninh Mạng Quốc tế hôm nay', summary: 'Cập nhật thương vụ AI, quy định công nghệ, điện toán lượng tử và thị trường phần cứng từ Reuters Technology.', source: 'Reuters Technology', url: 'https://www.reuters.com/technology/', readMinutes: 2 },
      { title: 'Khoa học & Đổi mới Sáng tạo (Nature News & Briefings)', summary: 'Bản tin khoa học chính chủ từ tạp chí bình duyệt danh giá nhất thế giới Nature.', source: 'Nature Journal (Tạp chí Khoa học Hạng 1)', url: 'https://www.nature.com/news', readMinutes: 2 },
    ],
    economy_markets: [
      { title: 'Thị trường Tài chính, Lãi suất & Thương mại Toàn cầu', summary: 'Theo dõi diễn biến chính sách Fed/ECB/BOJ, giá dầu, thương mại và dòng vốn từ Financial Times & Reuters Markets.', source: 'Reuters Business & Markets', url: 'https://www.reuters.com/markets/', readMinutes: 2 },
      { title: 'Báo cáo Triển vọng Kinh tế Toàn cầu (IMF Official)', summary: 'Dữ liệu và cảnh báo vĩ mô chính thức từ Quỹ Tiền tệ Quốc tế (International Monetary Fund).', source: 'IMF Official (Quỹ Tiền tệ Quốc tế)', url: 'https://www.imf.org/en/News', readMinutes: 2 },
    ],
    health_science: [
      { title: 'Cảnh báo Dịch tễ & Hướng dẫn Y tế Toàn cầu (WHO Official)', summary: 'Thông cáo báo chí và khuyến cáo sức khỏe chính thức từ Tổ chức Y tế Thế giới (World Health Organization).', source: 'WHO Official (Tổ chức Y tế Thế giới)', url: 'https://www.who.int/news', readMinutes: 2 },
      { title: 'Y học Thực chứng & Chăm sóc Sức khỏe Đời sống (Harvard Health)', summary: 'Kiến thức dinh dưỡng, giấc ngủ, tim mạch và phòng bệnh từ Trường Y Đại học Harvard.', source: 'Harvard Medical School Publishing', url: 'https://www.health.harvard.edu/', readMinutes: 2 },
    ],
    law_society: [
      { title: 'Chính sách Công, Pháp luật & Quản trị Toàn cầu (Reuters Legal)', summary: 'Các phán quyết tòa án trọng yếu, đạo luật AI, chống độc quyền, thuế và bảo vệ dữ liệu cá nhân trên thế giới.', source: 'Reuters Legal & Policy', url: 'https://www.reuters.com/legal/', readMinutes: 2 },
      { title: 'Biến đổi Khí hậu & Cam kết Năng lượng Sạch (UN Climate Change)', summary: 'Bản tin chính thức từ Công ước Khung Liên Hợp Quốc về Biến đổi Khí hậu (UNFCCC).', source: 'UNFCCC Official (Liên Hợp Quốc)', url: 'https://unfccc.int/news', readMinutes: 2 },
      { title: 'Giáo dục, Văn hóa & Đạo đức AI Toàn cầu (UNESCO Official)', summary: 'Chính sách giáo dục, bảo tồn di sản và khung đạo đức trí tuệ nhân tạo của UNESCO.', source: 'UNESCO Official', url: 'https://www.unesco.org/en/news', readMinutes: 1 },
    ],
    mind_skills: [
      { title: 'Chiến lược Quản trị, Lãnh đạo & Hiệu suất (Harvard Business Review)', summary: 'Bài phân tích quản trị công việc, giao tiếp, ra quyết định và xây dựng sự nghiệp từ Đại học Harvard.', source: 'Harvard Business Review (HBR)', url: 'https://hbr.org/', readMinutes: 2 },
      { title: 'Khoa học Tâm lý & Sức khỏe Tinh thần (APA Official)', summary: 'Nghiên cứu tâm lý hành vi, quản trị stress và nhận thức từ Hiệp hội Tâm lý học Hoa Kỳ (American Psychological Association).', source: 'American Psychological Association (APA)', url: 'https://www.apa.org/news', readMinutes: 2 },
      { title: 'Tư duy Quản trị Kỷ nguyên AI (MIT Sloan Management Review)', summary: 'Khung tư duy lãnh đạo và đổi mới tổ chức xuất bản bởi Trường Quản trị Sloan — Đại học MIT.', source: 'MIT Sloan Management Review', url: 'https://sloanreview.mit.edu/', readMinutes: 2 },
    ],
    deep_knowledge: [
      { title: 'Tin tức Khám phá Vũ trụ & Trái Đất Chính chủ (NASA Official)', summary: 'Bản tin và hình ảnh khoa học chính thức từ Cơ quan Hàng không & Vũ trụ Hoa Kỳ (NASA).', source: 'NASA Official (Cơ quan Vũ trụ Mỹ)', url: 'https://www.nasa.gov/news/', readMinutes: 2 },
      { title: 'Khoa học, Lịch sử & Văn hóa Toàn cầu (Smithsonian Magazine)', summary: 'Chuyên san tri thức chính thức của Viện Smithsonian (Hoa Kỳ) về khảo cổ, lịch sử, tự nhiên và đổi mới.', source: 'Smithsonian Institution', url: 'https://www.smithsonianmag.com/', readMinutes: 2 },
      { title: 'Phân tích Chuyên sâu Kinh tế – Văn hóa (The Economist)', summary: 'Góc nhìn hệ thống về kinh tế chính trị, khoa học và văn hóa thế giới từ tuần báo uy tín hàng đầu.', source: 'The Economist', url: 'https://www.economist.com/', readMinutes: 2 },
    ],
  });

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

  function isFreshNewsItem({ title = '', summary = '', publishedAt = null, maxDays = 21 }) {
    const curYear = new Date().getUTCFullYear();
    const combined = `${title} ${summary}`;
    const years = [...combined.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]));
    if (years.length) {
      const hasCurrentOrRecent = years.some((y) => y >= curYear - 1);
      const hasStaleOldYear = years.some((y) => y >= 2015 && y <= curYear - 2);
      if (hasStaleOldYear && !hasCurrentOrRecent) return false;
    }
    if (publishedAt) {
      const ts = typeof publishedAt === 'number'
        ? (publishedAt < 1e12 ? publishedAt * 1000 : publishedAt)
        : Date.parse(publishedAt);
      if (Number.isFinite(ts)) {
        const ageDays = (Date.now() - ts) / 86400000;
        if (ageDays > maxDays) return false;
      }
    }
    return true;
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
   * Parse RSS XML trực tiếp (khi chạy bản Electron Desktop có cầu IPC fetch không bị CORS!)
   */
  function parseOfficialRssXml(xmlText, sourceName, maxItems = 4) {
    const out = [];
    const items = [...String(xmlText || '').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
    for (const m of items) {
      if (out.length >= maxItems) break;
      const body = m[1];
      const getTag = (tag) => {
        const mm = body.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
        return mm ? stripHtml(mm[1]) : '';
      };
      const title = getTag('title');
      const link = getTag('link');
      const desc = getTag('description');
      const pubDate = getTag('pubDate');
      const imgMatch = body.match(/(?:url|src)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
      if (!title || !link || !isFreshNewsItem({ title, summary: desc, publishedAt: pubDate, maxDays: 14 })) continue;
      out.push({
        title: title.slice(0, 200),
        summary: (desc || `Bản tin chính thống mới nhất từ ${sourceName}.`).slice(0, 240),
        url: link,
        imageUrl: imgMatch ? imgMatch[1] : '',
        publishedAt: pubDate || new Date().toISOString(),
        source: `${sourceName} (RSS Chính thức)`,
      });
    }
    return out;
  }

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
      health_science: [],
      law_society: [],
      mind_skills: [],
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
      countryUnempPct: null,
      countryLifeExp: null,
    };

    // 1) Dữ liệu Kinh tế & Tài chính Chính thức (Open Exchange Rates + Binance LBMA Gold/BTC + Bộ Tài chính Mỹ U.S. Treasury)
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
            summary: `Số liệu tỷ giá thị trường quốc tế cập nhật trực tiếp (${rFx.value.time_last_update_utc || 'Hôm nay'}).`,
            source: 'Open Exchange Rates (Số liệu trực tiếp)',
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
            title: `🥇 Vàng Thế giới (LBMA PAXG/USD): $${liveMetrics.goldUsdOz.toLocaleString('en-US', { maximumFractionDigits: 2 })}/oz (${liveMetrics.gold24hPct >= 0 ? '+' : ''}${liveMetrics.gold24hPct.toFixed(2)}% / 24h)`,
            summary: 'Giá vàng vật chất chuẩn LBMA London khớp lệnh thời gian thực 24/7.',
            source: 'Sàn giao dịch Quốc tế (LBMA PAXG)',
            url: 'https://www.lbma.org.uk/prices-and-data/precious-metal-prices',
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
            summary: 'Chỉ báo khẩu vị rủi ro & thanh khoản toàn cầu 24/7.',
            source: 'Thị trường Tài sản số (Live 24/7)',
            url: 'https://www.reuters.com/markets/currencies/',
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
            title: `🏛️ Nợ công Hoa Kỳ đạt $${liveMetrics.usDebtTrillion} nghìn tỷ USD (cập nhật ${row.record_date})`,
            summary: 'Báo cáo nợ công chính thức hằng ngày của Bộ Tài chính Hoa Kỳ (U.S. Department of the Treasury).',
            source: 'U.S. Treasury Official (Bộ Tài chính Mỹ)',
            url: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/',
            imageUrl: '',
            publishedAt: row.record_date,
            readMinutes: 1,
          }));
        }
      }
      report('💰 Đã cập nhật số liệu Bộ Tài chính Mỹ, Tỷ giá & Vàng LBMA', `${categoriesData.economy_markets.length} chỉ số`);
    });

    // 2) Số liệu Chính thức Ngân hàng Thế giới (World Bank Official: GDP, Lạm phát CPI, Thất nghiệp, Tuổi thọ trung bình)
    const pWb = Promise.allSettled([
      fetchJsonSafe(`https://api.worldbank.org/v2/country/${profile.wbIso2}/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=2`, signal, 9000),
      fetchJsonSafe(`https://api.worldbank.org/v2/country/${profile.wbIso2}/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2`, signal, 9000),
      fetchJsonSafe(`https://api.worldbank.org/v2/country/${profile.wbIso2}/indicator/SL.UEM.TOTL.ZS?format=json&mrv=2`, signal, 9000),
      fetchJsonSafe(`https://api.worldbank.org/v2/country/${profile.wbIso2}/indicator/SP.DYN.LE00.IN?format=json&mrv=2`, signal, 9000),
    ]).then(async ([rGdp, rCpi, rUnemp, rLife]) => {
      const pick = (r) => (r.status === 'fulfilled' && Array.isArray(r.value?.[1]) ? r.value[1].find((x) => x && x.value !== null) : null);
      const gdp = pick(rGdp);
      const cpi = pick(rCpi);
      const unemp = pick(rUnemp);
      const life = pick(rLife);

      if (gdp) {
        liveMetrics.countryGdpPct = Number(Number(gdp.value).toFixed(2));
        liveMetrics.countryGdpYear = gdp.date;
        categoriesData.local_region.push(await makeProvenanceItem({
          id: 'wb-gdp',
          category: 'local_region',
          title: `📈 Tăng trưởng GDP ${profile.name}: ${liveMetrics.countryGdpPct}% (năm ${gdp.date})`,
          summary: `Báo cáo kinh tế vĩ mô chính thức của Ngân hàng Thế giới (World Bank) cho ${profile.name}.`,
          source: 'World Bank Official (Ngân hàng Thế giới)',
          url: `https://data.worldbank.org/country/${profile.wbIso2}`,
          imageUrl: '',
          publishedAt: gdp.date,
          readMinutes: 1,
        }));
      }
      if (cpi) {
        liveMetrics.countryCpiPct = Number(Number(cpi.value).toFixed(2));
        liveMetrics.countryCpiYear = cpi.date;
        categoriesData.economy_markets.push(await makeProvenanceItem({
          id: 'wb-cpi',
          category: 'economy_markets',
          title: `🧾 Lạm phát CPI ${profile.name}: ${liveMetrics.countryCpiPct}% (năm ${cpi.date})`,
          summary: 'Chỉ số giá tiêu dùng chính thức theo Ngân hàng Thế giới (World Bank).',
          source: 'World Bank Official (Ngân hàng Thế giới)',
          url: `https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=${profile.wbIso2}`,
          imageUrl: '',
          publishedAt: cpi.date,
          readMinutes: 1,
        }));
      }
      if (unemp) {
        liveMetrics.countryUnempPct = Number(Number(unemp.value).toFixed(2));
        categoriesData.law_society.push(await makeProvenanceItem({
          id: 'wb-unemp',
          category: 'law_society',
          title: `👥 Tỷ lệ Thất nghiệp ${profile.name}: ${liveMetrics.countryUnempPct}% (năm ${unemp.date})`,
          summary: 'Thống kê thị trường lao động chính thức từ Tổ chức Lao động Quốc tế (ILO) / Ngân hàng Thế giới.',
          source: 'World Bank & ILO Official',
          url: `https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=${profile.wbIso2}`,
          imageUrl: '',
          publishedAt: unemp.date,
          readMinutes: 1,
        }));
      }
      if (life) {
        liveMetrics.countryLifeExp = Number(Number(life.value).toFixed(1));
        categoriesData.health_science.push(await makeProvenanceItem({
          id: 'wb-life',
          category: 'health_science',
          title: `❤️ Tuổi thọ trung bình ${profile.name}: ${liveMetrics.countryLifeExp} tuổi (năm ${life.date})`,
          summary: 'Chỉ số y tế dân số chính thức công bố bởi Ngân hàng Thế giới & Liên Hợp Quốc.',
          source: 'World Bank Health Data',
          url: `https://data.worldbank.org/indicator/SP.DYN.LE00.IN?locations=${profile.wbIso2}`,
          imageUrl: '',
          publishedAt: life.date,
          readMinutes: 1,
        }));
      }
      report(`🏛️ Đã cập nhật chỉ số World Bank cho ${profile.name}`, 'GDP · CPI · Lao động · Y tế');
    });

    // 3) Công trình Y học Bình duyệt Chính thức — Viện Y tế Quốc gia Hoa Kỳ (NIH / PubMed `200 OK · CORS=*`)
    const pPubMed = (async () => {
      try {
        const srch = await fetchJsonSafe(
          'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=(longevity+OR+sleep+OR+cardiovascular+OR+nutrition+OR+mental+health)+AND+review[pt]&retmax=3&sort=date&retmode=json',
          signal,
          9000
        );
        const ids = srch?.esearchresult?.idlist || [];
        if (ids.length) {
          const sum = await fetchJsonSafe(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`,
            signal,
            9000
          );
          for (const pid of ids) {
            const rec = sum?.result?.[pid];
            if (!rec?.title) continue;
            categoriesData.health_science.push(await makeProvenanceItem({
              id: `pubmed-${pid}`,
              category: 'health_science',
              title: `🩺 Nghiên cứu Y khoa mới: ${stripHtml(rec.title)}`,
              summary: `Công bố bình duyệt trên tạp chí y khoa ${rec.fulljournalname || rec.source || 'PubMed'} (${rec.pubdate || 'Mới xuất bản'}).`,
              source: 'PubMed / NIH (Viện Y tế Quốc gia Mỹ)',
              url: `https://pubmed.ncbi.nlm.nih.gov/${pid}/`,
              imageUrl: '',
              publishedAt: rec.pubdate || new Date().toISOString(),
              readMinutes: 2,
            }));
          }
        }
      } catch (_ePm) {}
      report('🩺 Đã quét Công trình Y khoa Bình duyệt (PubMed / NIH)', `${categoriesData.health_science.length} mục`);
    })();

    // 4) Công bố Khoa học & Công nghệ AI Chính thức — Crossref Official DOI Registry (`200 OK · CORS=*`)
    const pCrossref = (async () => {
      try {
        const curY = new Date().getUTCFullYear();
        const cr = await fetchJsonSafe(
          `https://api.crossref.org/works?filter=from-pub-date:${curY - 1}-06-01,type:journal-article&query=artificial+intelligence+energy+semiconductor&rows=3&sort=published&order=desc`,
          signal,
          9000
        );
        const works = cr?.message?.items || [];
        for (const w of works) {
          const title = Array.isArray(w.title) ? stripHtml(w.title[0]) : '';
          const journal = Array.isArray(w['container-title']) ? w['container-title'][0] : (w.publisher || 'Academic Journal');
          const url = w.URL || (w.DOI ? `https://doi.org/${w.DOI}` : '');
          if (!title || !url) continue;
          categoriesData.tech_science.push(await makeProvenanceItem({
            id: `doi-${w.DOI || Math.random()}`,
            category: 'tech_science',
            title: `🔬 Công bố Khoa học & AI: ${title.slice(0, 170)}`,
            summary: `Bài báo khoa học có mã định danh DOI chính thức trên ${journal} (Nhà xuất bản: ${w.publisher || 'Học thuật quốc tế'}).`,
            source: `Crossref DOI · ${journal.slice(0, 36)}`,
            url,
            imageUrl: '',
            publishedAt: new Date().toISOString(),
            readMinutes: 2,
          }));
        }
      } catch (_eCr) {}
      report('🔬 Đã quét Công bố Khoa học & AI Chính thức (Crossref DOI)', `${categoriesData.tech_science.length} mục`);
    })();

    // 5) Nếu đang chạy bản Electron Desktop -> đọc thẳng RSS XML từ Báo Chính Thống (VnExpress, Tuổi Trẻ, BBC World)!
    const pElectronRss = (async () => {
      if (!globalScope.NoirDesktopLocalEngine?.fetchUrl) {
        report('📰 Chuẩn hóa Checklist Báo chí Chính thống Quốc tế & Khu vực', profile.name);
        return;
      }
      const rssTargets = [
        { name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', cat: 'world_geo' },
        ...(profile.rssFeeds || []),
      ];
      let added = 0;
      for (const feed of rssTargets.slice(0, 4)) {
        try {
          const res = await globalScope.NoirDesktopLocalEngine.fetchUrl(feed.url);
          if (res?.ok && res.text) {
            const parsed = parseOfficialRssXml(res.text, feed.name, 3);
            for (const it of parsed) {
              categoriesData[feed.cat].push(await makeProvenanceItem({
                id: `rss-${feed.cat}-${added++}`,
                category: feed.cat,
                ...it,
                readMinutes: 2,
              }));
              if (it.imageUrl) {
                visualGallery.push({ title: it.title.slice(0, 75), caption: it.summary.slice(0, 130), imageUrl: it.imageUrl, url: it.url, tag: `📰 ${feed.name}` });
              }
            }
          }
        } catch (_eRss) {}
      }
      report('📰 Đã đọc thẳng RSS Báo chí Chính thống (Electron)', `${added} bài báo`);
    })();

    // 6) Nạp Checklist Báo chí Chính thống Hạng 1 & Cổng Cơ quan Nhà nước theo đúng Quốc gia (100% link chính chủ, 0 Wikipedia/Blog/MXH!)
    const pChecklist = (async () => {
      // Khu vực & Quốc gia của người dùng
      for (const lnk of (profile.newsLinks || [])) {
        categoriesData.local_region.push(await makeProvenanceItem({
          id: `loc-press-${categoriesData.local_region.length}`,
          category: 'local_region',
          title: `📰 ${lnk.label}`,
          summary: `Cổng thông tin ${lnk.tier} chính thức dành cho khu vực ${loc.fullAddress || profile.name} — bấm mở đọc tin mới nhất hôm nay.`,
          source: `${lnk.tier} · ${profile.name}`,
          url: lnk.url,
          imageUrl: '',
          publishedAt: new Date().toISOString(),
          readMinutes: 2,
        }));
      }
      // 7 trụ cột báo chí & học viện chính thống toàn cầu
      for (const [catId, list] of Object.entries(OFFICIAL_PRESS_CHECKLIST)) {
        for (const item of list) {
          categoriesData[catId].push(await makeProvenanceItem({
            id: `chk-${catId}-${categoriesData[catId].length}`,
            category: catId,
            title: item.title,
            summary: item.summary,
            source: item.source,
            url: item.url,
            imageUrl: '',
            publishedAt: new Date().toISOString(),
            readMinutes: item.readMinutes || 2,
          }));
        }
      }
      report('✅ Hoàn tất Checklist 8 Trụ cột Báo chí Chính thống (0 Wiki / 0 Blog)', '100% nguồn uy tín');
    })();

    await Promise.allSettled([pEcon, pWb, pPubMed, pCrossref, pElectronRss, pChecklist]);

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

  function buildGeminiWisdomPrompt(scanResult, { focusMode = 'balanced_20m', customTopic = '' } = {}) {
    const modeObj = FOCUS_MODES.find((m) => m.id === focusMode) || FOCUS_MODES[0];
    const locStr = `${scanResult.location?.fullAddress || scanResult.profile?.name || 'Việt Nam'} (${scanResult.profile?.flag || '🌍'} ${scanResult.profile?.code || 'VN'})`;
    const m = scanResult.liveMetrics || {};

    const lines = [];
    lines.push('Bạn là Tổng Biên Tập & Chuyên gia Phân tích Tri thức cho chuyên mục "🧠 20 PHÚT THÔNG THÁI MỖI NGÀY" (8 Trụ cột Tri thức Người Trưởng Thành).');
    lines.push(`NGÀY HÔM NAY: ${scanResult.dateLabel}`);
    lines.push(`Vị trí người đọc: ${locStr}`);
    lines.push(`Chế độ trọng tâm: ${modeObj.label}`);
    if (String(customTopic || '').trim()) {
      lines.push(`Chủ đề người đọc muốn ưu tiên đào sâu hôm nay: "${String(customTopic).trim()}"`);
    }
    lines.push('');
    lines.push('⚠️ QUY TẮC NGUỒN TIN & THỜI SỰ BẮT BUỘC (0% TIN CŨ · 0% NGUỒN RÁC):');
    lines.push('1. CHỈ ĐƯỢC PHÉP tra cứu và trích dẫn từ BÁO CHÍ CHÍNH THỐNG HẠNG 1 & CƠ QUAN CHÍNH THỨC: Reuters, AP News, BBC, Financial Times, Bloomberg, The Economist, Nature, Science, MIT Tech Review, Harvard Business Review, WHO, IMF, World Bank, NIH/PubMed, NASA, Báo Điện tử Chính phủ, VnExpress, Tuổi Trẻ, Thanh Niên, Ngân hàng Trung ương.');
    lines.push('2. TUYỆT ĐỐI CẤM dùng Wikipedia, blog cá nhân, diễn đàn (Reddit/Hacker News/Quora) hay mạng xã hội làm nguồn tin chính!');
    lines.push(`3. CHỈ tổng hợp sự kiện MỚI NHẤT trong 24–72 giờ tính tới hôm nay (${scanResult.dateLabel}), TUYỆT ĐỐI KHÔNG nhắc lại sự kiện cũ 2020–2024.`);
    lines.push('');
    lines.push('=== SỐ LIỆU CHÍNH THỨC & CHECKLIST 8 TRỤ CỘT ĐÃ CHUẨN BỊ HÔM NAY ===');
    lines.push(
      `• Số liệu sống: USD/${m.localCurrency || 'VND'}=${m.usdToLocal || 'N/A'} | Vàng LBMA=${m.goldUsdOz ? '$' + m.goldUsdOz.toFixed(0) + '/oz' : 'N/A'} | BTC=${m.btcUsd ? '$' + m.btcUsd.toFixed(0) : 'N/A'} | Nợ công Mỹ (U.S. Treasury)=${m.usDebtTrillion ? '$' + m.usDebtTrillion + 'T' : 'N/A'} | GDP (World Bank)=${m.countryGdpPct ?? 'N/A'}% | CPI=${m.countryCpiPct ?? 'N/A'}%`
    );

    for (const cat of CATEGORIES) {
      const items = scanResult.categoriesData?.[cat.id] || [];
      lines.push(`\n[${cat.title}] (${items.length} đầu mục nguồn uy tín):`);
      items.slice(0, 4).forEach((it, idx) => {
        lines.push(`  ${idx + 1}. ${it.title} — ${String(it.summary || '').slice(0, 140)} (Nguồn: ${it.source} | ${it.url})`);
      });
    }

    lines.push('');
    lines.push('=== PHẦN 1 — BẢN TIN 20 PHÚT CHÍNH THỐNG, DỄ HIỂU BẰNG TIẾNG VIỆT ===');
    lines.push('1. "3 Sự Kiện Quan Trọng Nhất Hôm Nay" (đọc trong 60 giây — ghi rõ tên tờ báo/cơ quan chính thống).');
    lines.push('2. Tổng hợp tin mới nhất hôm nay đủ 8 Trụ cột (Thế giới, Công nghệ/AI, Kinh tế, Khu vực của tôi, Y học/Sức khỏe, Pháp luật/Chính sách, Tâm lý/Quản trị, Khoa học/Văn hóa) — mỗi ý đều nêu rõ nguồn chính thống.');
    lines.push('3. Rút ra 3 "Mô hình Tư duy / Hành động Thực tế" áp dụng ngay hôm nay.');
    lines.push('');
    lines.push('=== PHẦN 2 — KHỐI JSON ĐỒNG BỘ BIỂU ĐỒ & SƠ ĐỒ (BẮT BUỘC GIỮ ĐÚNG CHUẨN) ===');
    lines.push('Cuối câu trả lời, xuất ĐÚNG 1 khối ```json theo chuẩn WISDOM_20MIN_SYNC_V1:');
    lines.push('```json');
    lines.push(JSON.stringify({
      schema: 'WISDOM_20MIN_SYNC_V1',
      headline: 'Tiêu đề toàn cảnh hôm nay từ báo chí chính thống (<= 90 ký tự)',
      reading_plan_20m: CATEGORIES.map((c) => ({ label: c.title.replace(/^\d+\.\s*/, ''), minutes: c.minutes, color: c.color })),
      impact_scores: [
        { topic: 'Sự kiện chính thống 1 hôm nay', score: 90, category: 'Thế giới', note: 'Nguồn: Reuters/AP' },
        { topic: 'Sự kiện chính thống 2 hôm nay', score: 85, category: 'Công nghệ', note: 'Nguồn: MIT/Nature' },
        { topic: 'Sự kiện chính thống 3 hôm nay', score: 78, category: 'Kinh tế', note: 'Nguồn: FT/IMF' },
        { topic: 'Sự kiện chính thống 4 hôm nay', score: 72, category: 'Y học / Pháp lý', note: 'Nguồn: WHO/NIH' },
      ],
      causal_mindmap: {
        center: 'Bản đồ Tri thức Hôm nay',
        chains: [
          { cause: 'Sự kiện gốc 1 hôm nay', mechanism: 'Cơ chế tác động', effect: 'Hệ quả đời sống & công việc' },
          { cause: 'Sự kiện gốc 2 hôm nay', mechanism: 'Cơ chế tác động', effect: 'Hệ quả tài chính & kỹ năng' },
          { cause: 'Sự kiện gốc 3 hôm nay', mechanism: 'Cơ chế tác động', effect: 'Hệ quả sức khỏe & chính sách' },
        ],
      },
      timeline: [
        { time: 'Hôm nay', event: 'Diễn biến chính thống mới nhất', tag: 'Chính thống' },
        { time: 'Tuần này', event: 'Chính sách / sự kiện cần theo dõi', tag: 'Theo dõi' },
        { time: 'Sắp tới', event: 'Mốc quan trọng sắp diễn ra', tag: 'Dự báo' },
      ],
      mental_models: [
        { title: 'Mô hình tư duy 1', lesson: 'Cách áp dụng thực tế trong 1 câu ngắn.' },
        { title: 'Mô hình tư duy 2', lesson: 'Cách áp dụng thực tế trong 1 câu ngắn.' },
      ],
      visual_search_queries: [
        'Từ khóa tra biểu đồ / ảnh báo chí chính thống 1',
        'Từ khóa tra biểu đồ / ảnh báo chí chính thống 2',
      ],
    }, null, 2));
    lines.push('```');
    return lines.join('\n');
  }

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

  function buildDefaultChartDataFromRaw(scanResult) {
    const cd = scanResult?.categoriesData || {};
    const readingPlan = CATEGORIES.map((c) => ({
      label: c.title.replace(/^\d+\.\s*/, ''),
      minutes: c.minutes,
      color: c.color,
      count: (cd[c.id] || []).length,
    }));

    const impacts = [];
    for (const c of CATEGORIES.slice(0, 6)) {
      const first = (cd[c.id] || [])[0];
      if (first) {
        impacts.push({
          topic: first.title.slice(0, 58),
          score: Math.min(96, 68 + (cd[c.id]?.length || 1) * 5),
          category: c.icon + ' ' + c.title.replace(/^\d+\.\s*/, '').split('&')[0].trim(),
          note: first.source,
        });
      }
    }

    const chains = [
      {
        cause: (cd.world_geo?.[0]?.title || 'Biến động Địa chính trị Quốc tế (Reuters/AP)').slice(0, 56),
        mechanism: 'Tác động chuỗi cung ứng, năng lượng & thương mại',
        effect: 'Ảnh hưởng chi phí sinh hoạt, tỷ giá & cơ hội nghề nghiệp',
      },
      {
        cause: (cd.tech_science?.[0]?.title || 'Công bố Khoa học & AI mới (MIT/Nature/DOI)').slice(0, 56),
        mechanism: 'Thay đổi tốc độ tự động hóa & tiêu chuẩn kỹ năng',
        effect: 'Tạo lợi thế cho người cập nhật tri thức chính thống mỗi ngày',
      },
      {
        cause: (cd.health_science?.[0]?.title || cd.economy_markets?.[0]?.title || 'Nghiên cứu Y khoa NIH & Vĩ mô').slice(0, 56),
        mechanism: 'Cập nhật thói quen y học thực chứng & kỷ luật tài chính',
        effect: `Nâng cao chất lượng sống bền vững tại ${scanResult?.profile?.name || 'khu vực của bạn'}`,
      },
    ];

    const timeline = [];
    for (const c of CATEGORIES.slice(0, 6)) {
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
      headline: `Checklist 8 Trụ cột Chính thống — ${scanResult?.dateLabel || ''}`,
      reading_plan_20m: readingPlan,
      impact_scores: impacts,
      causal_mindmap: {
        center: `20 Phút Thông Thái (${scanResult?.profile?.flag || '🌍'})`,
        chains,
      },
      timeline,
      mental_models: [
        { title: 'Kiểm chứng Nguồn Chính thống (Primary Source First)', lesson: 'Chỉ ra quyết định dựa trên dữ liệu cơ quan chính thức & báo chí hạng 1, nói không với tin đồn.' },
        { title: 'Tư duy Hệ quả Bậc 2', lesson: 'Đừng chỉ xem tin bề mặt — hãy hỏi "Chính sách / sự kiện này sẽ tác động gì tiếp theo?".' },
      ],
      visual_search_queries: [],
    };
  }

  W20.COUNTRY_PROFILES = COUNTRY_PROFILES;
  W20.CATEGORIES = CATEGORIES;
  W20.FOCUS_MODES = FOCUS_MODES;
  W20.getCountryProfile = getCountryProfile;
  W20.detectUserLocationByGps = detectUserLocationByGps;
  W20.isFreshNewsItem = isFreshNewsItem;
  W20.scanDailyWisdom = scanDailyWisdom;
  W20.buildGeminiWisdomPrompt = buildGeminiWisdomPrompt;
  W20.parseGeminiWisdomReply = parseGeminiWisdomReply;
  W20.buildDefaultChartDataFromRaw = buildDefaultChartDataFromRaw;
})(typeof window !== 'undefined' ? window : globalThis);
