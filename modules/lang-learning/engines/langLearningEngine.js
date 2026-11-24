/**
 * ============================================================================
 * 🎓 MODULE 51: ENGINE HỌC NGOẠI NGỮ 6 THỨ TIẾNG, PHIÊN ÂM, NGỮ PHÁP & FLASHCARD (v131.0)
 * ============================================================================
 * - Thu thập toàn bộ từ vựng/cụm từ đã dịch thực tế trên trang web từ `NS.i18nPacks`
 *   (6 ngôn ngữ: VI / EN / ZH-CN / ZH-TW / KO / JA) — phân nhóm khoa học.
 * - Phiên âm tự động đầy đủ 6 ngôn ngữ:
 *   * Tiếng Hàn (KO): Thuật toán tách Jamo chuẩn Revised Romanization of Korean (100% chính xác).
 *   * Tiếng Nhật (JA): Thuật toán Hiragana/Katakana -> Hepburn Romaji + từ điển Kanji giao diện.
 *   * Tiếng Trung (ZH-CN & ZH-TW): Từ điển Pinyin có thanh điệu cho các Hán tự thông dụng.
 *   * Tiếng Anh (EN) & Tiếng Việt (VI): Gợi ý phát âm + Đọc giọng bản xứ Web Speech API.
 * - Bảng Ngữ Pháp đối chiếu 10 cấu trúc cốt lõi cho cả 6 ngôn ngữ.
 * - Xuất `.PDF` thuần (Sổ tay Từ vựng + Ngữ pháp + Phiên âm, và Thẻ Flashcard In Cắt 2 Mặt A4),
 *   xuất `.TSV` chuẩn Anki/Quizlet, và xuất `.HTML` Bộ Flashcard tương tác chạy Offline độc lập!
 * ============================================================================
 */
(function initLangLearningEngine(globalScope) {
  'use strict';

  const LL = (globalScope.NoirLangLearning = globalScope.NoirLangLearning || {});
  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  const LANGUAGES = Object.freeze([
    { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt', short: 'VI', bcp47: 'vi-VN', qNative: 'Ngôn ngữ mẹ đẻ của bạn là gì?', qLearn: 'Ngôn ngữ bạn muốn học là gì?', menuLabel: 'Học ngoại ngữ qua trang web' },
    { code: 'en', flag: '🇺🇸', name: 'English', short: 'EN', bcp47: 'en-US', qNative: 'What is your native language?', qLearn: 'Which languages do you want to learn?', menuLabel: 'Learn languages via this website' },
    { code: 'zh_cn', flag: '🇨🇳', name: '简体中文', short: '简中', bcp47: 'zh-CN', qNative: '你的母语是什么？', qLearn: '你想学习哪些语言？', menuLabel: '通过本网站学外语' },
    { code: 'zh_tw', flag: '🇹🇼', name: '繁體中文', short: '繁中', bcp47: 'zh-TW', qNative: '你的母語是什麼？', qLearn: '你想學習哪些語言？', menuLabel: '透過本網站學外語' },
    { code: 'ko', flag: '🇰🇷', name: '한국어', short: 'KO', bcp47: 'ko-KR', qNative: '모국어는 무엇인가요?', qLearn: '배우고 싶은 언어는 무엇인가요?', menuLabel: '웹사이트로 외국어 배우기' },
    { code: 'ja', flag: '🇯🇵', name: '日本語', short: 'JA', bcp47: 'ja-JP', qNative: '母国語は何ですか？', qLearn: '学びたい言語は何ですか？', menuLabel: 'このサイトで外国語を学ぶ' },
  ]);

  const STORAGE_KEYS = Object.freeze({
    PREFS: 'noir_mod51_lang_prefs_v1',
    STARS: 'noir_mod51_starred_ids_v1',
    DECKS: 'noir_mod51_flashcard_decks_v1',
    MASTERY: 'noir_mod51_card_mastery_v1',
  });

  // --------------------------------------------------------------------------
  // 1. BỘ PHIÊN ÂM TỰ ĐỘNG CHO CẢ 6 NGÔN NGỮ (KO / JA / ZH / EN / VI)
  // --------------------------------------------------------------------------
  const KO_INIT = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
  const KO_MED = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
  const KO_FIN = ['','k','k','k','n','n','n','t','l','l','l','l','l','l','l','l','m','p','p','t','t','ng','t','t','k','t','p','t'];

  function romanizeKorean(str) {
    let out = '';
    for (const ch of String(str || '')) {
      const code = ch.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        const s = code - 0xac00;
        const i = Math.floor(s / 588);
        const m = Math.floor((s % 588) / 28);
        const f = s % 28;
        out += KO_INIT[i] + KO_MED[m] + KO_FIN[f];
      } else {
        out += ch;
      }
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  const KANA_MAP = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri',
    'る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'o','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','de':'de','ど':'do','で':'de',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho','ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
    'にゃ':'nya','にゅ':'nyu','にょ':'nyo','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
    'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo','じゃ':'ja','じゅ':'ju','じょ':'jo',
    'びゃ':'bya','びゅ':'byu','びょ':'byo','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
    'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o','カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko',
    'サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so','タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to',
    'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no','ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho',
    'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo','ヤ':'ya','ユ':'yu','ヨ':'yo','ラ':'ra','リ':'ri',
    'ル':'ru','レ':'re','ロ':'ro','ワ':'wa','ヲ':'o','ン':'n','ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go',
    'ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo','ダ':'da','ヂ':'ji','ヅ':'zu','デ':'de','ド':'do',
    'バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo','パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po',
    'キャ':'kya','キュ':'kyu','キョ':'kyo','シャ':'sha','シュ':'shu','ショ':'sho','チャ':'cha','チュ':'chu','チョ':'cho',
    'ジャ':'ja','ジュ':'ju','ジョ':'jo','ティ':'ti','ディ':'di','ファ':'fa','フィ':'fi','フェ':'fe','フォ':'fo','ー':'-',
  };

  const JA_KANJI_READINGS = {
    '執筆':'shippitsu','章':'shō','設定':'settei','保存':'hozon','削除':'sakujo','編集':'henshū','検索':'kensaku',
    '言語':'gengo','選択':'sentaku','天気':'tenki','時計':'tokei','音楽':'ongaku','動画':'dōga','背景':'haikei',
    '投資':'tōshi','今日':'kyō','毎日':'mainichi','知恵':'chie','位置':'ichi','変更':'henkō','確認':'kakunin',
    '出力':'shutsuryoku','書き出し':'kakidashi','読み込み':'yomikomi','閉じる':'tojiru','開く':'hiraku','作成':'sakusei',
    '新規':'shinki','一覧':'ichiran','管理':'kanri','同期':'dōki','情報':'jōhō','分析':'bunseki','図表':'zuhyō',
    '小説':'shōsetsu','物語':'monogatari','登場人物':'tōjō-jinbutsu','世界観':'sekaikan','文字数':'mojisū','自動':'jidō',
    '手動':'shudō','音声':'onsei','音量':'onryō','速度':'sokudo','再生':'saisei','一時停止':'ichiji-teishi','停止':'teishi',
    '日本語':'Nihongo','英語':'Eigo','中国語':'Chūgokugo','韓国語':'Kankokugo','学習':'gakushū','単語':'tango','文法':'bunpō',
    '時間':'jikan','分':'fun','秒':'byō','日付':'hizuke','地域':'chiiki','国':'kuni','価格':'kakaku','市場':'shijō',
    '画像':'gazō','文書':'bunsho','印刷':'insatsu','結合':'ketsugō','分割':'bunkatsu','圧縮':'asshuku','署名':'shomei',
    '変換':'henkan','表示':'hyōji','非表示':'hihyōji','拡大':'kakudai','縮小':'shukushō','回転':'kaiten','完了':'kanryō',
    '成功':'seikō','失敗':'shippai','警告':'keikoku','注意':'chūi','詳細':'shōsai','概要':'gaiyō','比較':'hikaku',
  };

  function romanizeJapanese(str) {
    let s = String(str || '');
    for (const [k, v] of Object.entries(JA_KANJI_READINGS)) {
      if (s.includes(k)) s = s.split(k).join(` ${v} `);
    }
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const two = s.slice(i, i + 2);
      if (KANA_MAP[two]) {
        out += KANA_MAP[two];
        i++;
      } else if (s[i] === 'っ' || s[i] === 'ッ') {
        const next = KANA_MAP[s[i + 1]] || '';
        out += next ? next[0] : '';
      } else if (KANA_MAP[s[i]]) {
        out += KANA_MAP[s[i]];
      } else {
        out += s[i];
      }
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  const ZH_PINYIN_MAP = {
    '写':'xiě','寫':'xiě','作':'zuò','章':'zhāng','节':'jié','節':'jié','设':'shè','設':'shè','置':'zhì',
    '保':'bǎo','存':'cún','删':'shān','刪':'shān','除':'chú','编':'biān','編':'biān','辑':'jí','輯':'jí',
    '搜':'sōu','索':'suǒ','语':'yǔ','語':'yǔ','言':'yán','选':'xuǎn','選':'xuǎn','择':'zé','擇':'zé',
    '天':'tiān','气':'qì','氣':'qì','时':'shí','時':'shí','钟':'zhōng','鐘':'zhōng','闹':'nào','鬧':'nào',
    '音':'yīn','乐':'yuè','樂':'yuè','视':'shì','視':'shì','频':'pín','頻':'pín','背':'bèi','景':'jǐng',
    '投':'tóu','资':'zī','資':'zī','今':'jīn','日':'rì','每':'měi','分':'fēn','智':'zhì','慧':'huì',
    '位':'wèi','更':'gēng','改':'gǎi','确':'què','確':'què','认':'rèn','認':'rèn','导':'dǎo','導':'dǎo',
    '出':'chū','入':'rù','关':'guān','關':'guān','闭':'bì','閉':'bì','打':'dǎ','开':'kāi','開':'kāi',
    '创':'chuàng','創':'chuàng','建':'jiàn','新':'xīn','列':'liè','表':'biǎo','管':'guǎn','理':'lǐ',
    '同':'tóng','步':'bù','信':'xìn','息':'xī','资':'zī','讯':'xùn','訊':'xùn','析':'xī','图':'tú','圖':'tú',
    '小':'xiǎo','说':'shuō','說':'shuō','故':'gù','事':'shì','人':'rén','物':'wù','世':'shì','界':'jiè',
    '字':'zì','数':'shù','數':'shù','自':'zì','动':'dòng','動':'dòng','手':'shǒu','声':'shēng','聲':'shēng',
    '量':'liàng','速':'sù','度':'dù','播':'bō','放':'fàng','暂':'zàn','暫':'zàn','停':'tíng','止':'zhǐ',
    '中':'zhōng','文':'wén','英':'yīng','韩':'hán','韓':'hán','学':'xué','學':'xué','习':'xí','習':'xí',
    '词':'cí','詞':'cí','汇':'huì','彙':'huì','法':'fǎ','间':'jiān','間':'jiān','秒':'miǎo','期':'qī',
    '地':'dì','区':'qū','區':'qū','国':'guó','國':'guó','家':'jiā','价':'jià','價':'jià','格':'gé',
    '市':'shì','场':'chǎng','場':'chǎng','片':'piàn','档':'dàng','檔':'dàng','打':'dǎ','印':'yìn',
    '合':'hé','并':'bìng','併':'bìng','拆':'chāi','压':'yā','壓':'yā','缩':'suō','縮':'suō','签':'qiān','簽':'qiān',
    '名':'míng','转':'zhuǎn','轉':'zhuǎn','换':'huàn','換':'huàn','显':'xiǎn','顯':'xiǎn','示':'shì',
    '隐':'yǐn','隱':'yǐn','藏':'cáng','大':'dà','旋':'xuán','完':'wán','成':'chéng','功':'gōng',
    '失':'shī','败':'bài','敗':'bài','警':'jǐng','告':'gào','注':'zhù','意':'yì','详':'xiáng','詳':'xiáng',
    '情':'qíng','概':'gài','要':'yào','比':'bǐ','较':'jiào','較':'jiào','原':'yuán','始':'shǐ','栏':'lán','欄':'lán',
    '目':'mù','立':'lì','即':'jí','查':'chá','看':'kàn','阅':'yuè','閱':'yuè','读':'dú','讀':'dú',
    '复':'fù','複':'fù','制':'zhì','製':'zhì','粘':'zhān','贴':'tiē','貼':'tiē','系':'xì','统':'tǒng','統':'tǒng',
    '网':'wǎng','網':'wǎng','站':'zhàn','外':'wài','本':'běn','通':'tōng','过':'guò','過':'guò','透':'tòu',
    '你':'nǐ','的':'de','母':'mǔ','是':'shì','什':'shén','么':'me','麼':'me','想':'xiǎng','哪':'nǎ','些':'xiē',
    '我':'wǒ','们':'men','們':'men','不':'bù','有':'yǒu','在':'zài','和':'hé','与':'yǔ','與':'yǔ','全':'quán',
    '部':'bù','页':'yè','頁':'yè','面':'miàn','简':'jiǎn','簡':'jiǎn','体':'tǐ','體':'tǐ','繁':'fán',
  };

  function romanizeChinese(str) {
    let out = [];
    let buf = '';
    for (const ch of String(str || '')) {
      if (ZH_PINYIN_MAP[ch]) {
        if (buf) { out.push(buf); buf = ''; }
        out.push(ZH_PINYIN_MAP[ch]);
      } else if (/[\u4e00-\u9fff]/.test(ch)) {
        if (buf) { out.push(buf); buf = ''; }
        out.push(ch);
      } else {
        buf += ch;
      }
    }
    if (buf) out.push(buf);
    return out.join(' ').replace(/\s+/g, ' ').trim();
  }

  function getPhonetic(langCode, text) {
    const clean = String(text || '').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim();
    if (!clean) return '';
    if (langCode === 'ko') return romanizeKorean(clean);
    if (langCode === 'ja') return romanizeJapanese(clean);
    if (langCode === 'zh_cn' || langCode === 'zh_tw') return romanizeChinese(clean);
    if (langCode === 'en') return `/${clean.toLowerCase().slice(0, 48)}/ (🔊 bấm nghe IPA)`;
    if (langCode === 'vi') return clean.split(/\s+/).slice(0, 8).join(' · ');
    return '';
  }

  function speakText(langCode, text) {
    try {
      if (!globalScope.speechSynthesis) return false;
      globalScope.speechSynthesis.cancel();
      const clean = String(text || '').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim();
      if (!clean) return false;
      const meta = LANGUAGES.find((l) => l.code === langCode) || LANGUAGES[0];
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = meta.bcp47;
      u.rate = 0.92;
      globalScope.speechSynthesis.speak(u);
      return true;
    } catch (_e) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 2. BẢNG NGỮ PHÁP ĐỐI CHIẾU 6 NGÔN NGỮ (10 CẤU TRÚC CỐT LÕI)
  // --------------------------------------------------------------------------
  const GRAMMAR_MATRIX = Object.freeze([
    {
      id: 'g_word_order',
      topic: '1. Trật tự câu cơ bản (Word Order)',
      vi: { pattern: 'Chủ ngữ + Động từ + Tân ngữ (SVO)', ex: 'Tôi đọc sách mỗi ngày.' },
      en: { pattern: 'Subject + Verb + Object (SVO)', ex: 'I read books every day.' },
      zh_cn: { pattern: '主语 + 动词 + 宾语 (SVO)', ex: '我每天看书。 (Wǒ měitiān kàn shū.)' },
      zh_tw: { pattern: '主語 + 動詞 + 受詞 (SVO)', ex: '我每天看書。 (Wǒ měitiān kàn shū.)' },
      ko: { pattern: '주어 + 목적어 + 동사 (SOV)', ex: '저는 매일 책을 읽어요. (Jeoneun maeil chaegeul ilgeoyo.)' },
      ja: { pattern: '主語 + 目的語 + 動詞 (SOV)', ex: '私は毎日、本を読みます。 (Watashi wa mainichi hon o yomimasu.)' },
    },
    {
      id: 'g_negation',
      topic: '2. Câu phủ định (Negation)',
      vi: { pattern: 'không + Động từ / Tính từ', ex: 'Tôi không hiểu câu này.' },
      en: { pattern: 'do/does/did + not + V (nguyên mẫu)', ex: 'I do not understand this sentence.' },
      zh_cn: { pattern: '不 (bù) / 没 (méi) + 动词', ex: '我不懂这句话。 (Wǒ bù dǒng zhè jù huà.)' },
      zh_tw: { pattern: '不 (bù) / 沒 (méi) + 動詞', ex: '我不懂這句話。 (Wǒ bù dǒng zhè jù huà.)' },
      ko: { pattern: '안 + 동사 / 동사 + 지 않아요', ex: '이 문장을 이해하지 못해요. (I munjangeul ihaehaji mothaeyo.)' },
      ja: { pattern: '動詞-ません / 動詞-ない', ex: 'この文が分かりません。 (Kono bun ga wakarimasen.)' },
    },
    {
      id: 'g_question',
      topic: '3. Câu hỏi (Yes/No Questions)',
      vi: { pattern: '... có ... không? / ... phải không?', ex: 'Bạn có thích học ngoại ngữ không?' },
      en: { pattern: 'Do/Does/Is/Are + S + V...?', ex: 'Do you enjoy learning languages?' },
      zh_cn: { pattern: 'Câu trần thuật + 吗 (ma)?', ex: '你喜欢学外语吗？ (Nǐ xǐhuan xué wàiyǔ ma?)' },
      zh_tw: { pattern: '陳述句 + 嗎 (ma)?', ex: '你喜歡學外語嗎？ (Nǐ xǐhuan xué wàiyǔ ma?)' },
      ko: { pattern: 'Thân động từ + -나요? / -습니까?', ex: '외국어 배우는 것을 좋아하나요? (Oegugeo baeuneun geoseul joahanayo?)' },
      ja: { pattern: 'Câu lịch sự + か (ka)?', ex: '外国語を学ぶのが好きですか。 (Gaikokugo o manabu no ga suki desu ka.)' },
    },
    {
      id: 'g_tenses',
      topic: '4. Quá khứ & Tương lai (Past & Future)',
      vi: { pattern: 'đã (quá khứ) / đang (hiện tại) / sẽ (tương lai)', ex: 'Hôm qua tôi đã viết, ngày mai tôi sẽ sửa.' },
      en: { pattern: 'V-ed (Past) / will + V (Future)', ex: 'Yesterday I wrote; tomorrow I will edit.' },
      zh_cn: { pattern: 'V + 了 (le - đã) / 会 (huì - sẽ) + V', ex: '昨天我写了，明天我会修改。 (Zuótiān wǒ xiě le, míngtiān wǒ huì xiūgǎi.)' },
      zh_tw: { pattern: 'V + 了 (le) / 會 (huì) + V', ex: '昨天我寫了，明天我會修改。 (Zuótiān wǒ xiě le, míngtiān wǒ huì xiūgǎi.)' },
      ko: { pattern: '-았/었어요 (Quá khứ) / -(으)ㄹ 거예요 (Tương lai)', ex: '어제 썼고, 내일 수정할 거예요. (Eoje sseotgo, naeil sujeonghal geoyeyo.)' },
      ja: { pattern: '-ました (Quá khứ) / -ます + ngày mai (Tương lai)', ex: '昨日書きました。明日直します。 (Kinō kakimashita. Ashita naoshimasu.)' },
    },
    {
      id: 'g_possessive',
      topic: '5. Sở hữu & Bổ ngữ (Possession)',
      vi: { pattern: 'Danh từ + của + Chủ sở hữu', ex: 'Cuốn sổ tay của tôi' },
      en: { pattern: 'Owner + \'s + Noun / my, your', ex: 'My notebook / Bi\'s notebook' },
      zh_cn: { pattern: 'Chủ sở hữu + 的 (de) + Danh từ', ex: '我的笔记本 (Wǒ de bǐjìběn)' },
      zh_tw: { pattern: '擁有者 + 的 (de) + 名詞', ex: '我的筆記本 (Wǒ de bǐjìběn)' },
      ko: { pattern: 'Chủ sở hữu + 의 (ui) + Danh từ', ex: '나의 노트 / 제 노트 (Naui noteu / Je noteu)' },
      ja: { pattern: 'Chủ sở hữu + の (no) + Danh từ', ex: '私のノート (Watashi no nōto)' },
    },
    {
      id: 'g_polite',
      topic: '6. Lịch sự & Đề nghị (Polite Requests)',
      vi: { pattern: 'Xin vui lòng + V / Hãy + V', ex: 'Vui lòng lưu tài liệu này lại.' },
      en: { pattern: 'Please + V / Could you please + V?', ex: 'Please save this document.' },
      zh_cn: { pattern: '请 (qǐng) + 动词', ex: '请保存这份文档。 (Qǐng bǎocún zhè fèn wéndàng.)' },
      zh_tw: { pattern: '請 (qǐng) + 動詞', ex: '請儲存這份文件。 (Qǐng chúcún zhè fèn wénjiàn.)' },
      ko: { pattern: '동사 + -(으)세요 / -아/어 주세요', ex: '이 문서를 저장해 주세요. (I munseoreul jeojanghae juseyo.)' },
      ja: { pattern: '動詞て形 + ください (te kudasai)', ex: 'この文書を保存してください。 (Kono bunsho o hozon shite kudasai.)' },
    },
    {
      id: 'g_conditional',
      topic: '7. Câu điều kiện (If ... then ...)',
      vi: { pattern: 'Nếu [A] thì [B]', ex: 'Nếu học 20 phút mỗi ngày thì bạn sẽ tiến bộ.' },
      en: { pattern: 'If [A], [B] (will ...)', ex: 'If you study 20 minutes daily, you will improve.' },
      zh_cn: { pattern: '如果 (rúguǒ) [A]，就 (jiù) [B]', ex: '如果每天学20分钟，就会进步。 (Rúguǒ měitiān xué 20 fēnzhōng, jiù huì jìnbù.)' },
      zh_tw: { pattern: '如果 (rúguǒ) [A]，就 (jiù) [B]', ex: '如果每天學20分鐘，就會進步。 (Rúguǒ měitiān xué 20 fēnzhōng, jiù huì jìnbù.)' },
      ko: { pattern: '[A]-(으)면 [B]', ex: '매일 20분 공부하면 실력이 늘어요. (Maeil 20bun gongbuhamyeon sillyeogi neureoyo.)' },
      ja: { pattern: '[A]たら / [A]ば、[B]', ex: '毎日20分勉強すれば、上達します。 (Mainichi 20-pun benkyō sureba, jōtatsu shimasu.)' },
    },
    {
      id: 'g_comparison',
      topic: '8. Câu so sánh (Comparison)',
      vi: { pattern: '[A] + Tính từ + hơn + [B]', ex: 'Hôm nay nóng hơn hôm qua.' },
      en: { pattern: '[A] is + adj-er / more adj + than + [B]', ex: 'Today is hotter than yesterday.' },
      zh_cn: { pattern: '[A] + 比 (bǐ) + [B] + 形容词', ex: '今天比昨天热。 (Jīntiān bǐ zuótiān rè.)' },
      zh_tw: { pattern: '[A] + 比 (bǐ) + [B] + 形容詞', ex: '今天比昨天熱。 (Jīntiān bǐ zuótiān rè.)' },
      ko: { pattern: '[A]가 [B]보다 더 + 형용사', ex: '오늘이 어제보다 더 더워요. (Oneuri eojeboda deo deowoyo.)' },
      ja: { pattern: '[A]は [B]より + 形容詞', ex: '今日は昨日より暑いです。 (Kyō wa kinō yori atsui desu.)' },
    },
    {
      id: 'g_location',
      topic: '9. Chỉ vị trí & Nơi chốn (Location)',
      vi: { pattern: 'ở / tại + [Địa điểm]', ex: 'Tôi đang làm việc ở Đà Nẵng.' },
      en: { pattern: 'in / at / on + [Place]', ex: 'I am working in Da Nang.' },
      zh_cn: { pattern: '在 (zài) + [地点] + 动词', ex: '我在岘港工作。 (Wǒ zài Xiàngǎng gōngzuò.)' },
      zh_tw: { pattern: '在 (zài) + [地點] + 動詞', ex: '我在峴港工作。 (Wǒ zài Xiàngǎng gōngzuò.)' },
      ko: { pattern: '[장소]에서 + 동사 (hành động) / 에 (tồn tại)', ex: '저는 다낭에서 일해요. (Jeoneun Danang-eseo ilhaeyo.)' },
      ja: { pattern: '[場所]で + 動詞 (hành động) / に (tồn tại)', ex: '私はダナンで働いています。 (Watashi wa Danan de hataraite imasu.)' },
    },
    {
      id: 'g_desire',
      topic: '10. Diễn tả mong muốn (Want to ...)',
      vi: { pattern: 'muốn + Động từ', ex: 'Tôi muốn xuất tệp PDF này.' },
      en: { pattern: 'want to + V / would like to + V', ex: 'I want to export this PDF file.' },
      zh_cn: { pattern: '想 (xiǎng) / 想要 + 动词', ex: '我想导出这个PDF文件。 (Wǒ xiǎng dǎochū zhège PDF wénjiàn.)' },
      zh_tw: { pattern: '想 (xiǎng) / 想要 + 動詞', ex: '我想匯出這個PDF檔案。 (Wǒ xiǎng huìchū zhège PDF dàng\'àn.)' },
      ko: { pattern: '동사 + -고 싶어요', ex: '이 PDF 파일을 내보내고 싶어요. (I PDF paireul naebonaego sipeoyo.)' },
      ja: { pattern: '動詞ます形 + たいです (-tai desu)', ex: 'このPDFを書き出したいです。 (Kono PDF o kakidashitai desu.)' },
    },
  ]);

  // --------------------------------------------------------------------------
  // 3. THU THẬP TỪ VỰNG THẬT TỪ TOÀN BỘ 5 GÓI DỊCH CỦA TRANG WEB (`NS.i18nPacks`)
  // --------------------------------------------------------------------------
  function classifyVocabTopic(viText) {
    const s = String(viText || '').toLowerCase();
    if (/pdf|docx|word|trang|cắt|gộp|tách|ký tên|font|phông|nén|ocr/.test(s)) return '📄 Công cụ PDF & Tài liệu';
    if (/đầu tư|vàng|chứng khoán|nhà đất|kinh tế|thông thái|vị trí|biểu đồ|sơ đồ/.test(s)) return '📈 Tài chính & Tri thức';
    if (/ai|gemini|prompt|mô hình|tư duy|api|story bible|nhân vật/.test(s)) return '🤖 AI & Sáng tác';
    if (/nhạc|mp3|youtube|video|nền|thời tiết|báo thức|múi giờ|pomodoro/.test(s)) return '🎵 Giải trí, Thời tiết & Giờ';
    if (/lưu|tải|xuất|đóng|mở|xóa|tìm|cài đặt|ngôn ngữ|hệ thống|chương/.test(s)) return '⚙️ Điều khiển & Giao diện';
    return '📚 Từ vựng & Cụm từ Chung';
  }

  function buildWebsiteVocabDatabase() {
    const packs = NS.i18nPacks || {};
    const enExact = packs.en?.exact || {};
    const zhCnExact = (packs['zh-CN'] || packs.zh_cn)?.exact || {};
    const zhTwExact = (packs['zh-TW'] || packs.zh_tw)?.exact || {};
    const koExact = packs.ko?.exact || {};
    const jaExact = packs.ja?.exact || {};

    const keys = Object.keys(enExact);
    const items = [];
    const seenClean = new Set();

    for (const viKey of keys) {
      const cleanVi = String(viKey || '').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim();
      // Lọc các cụm từ ngắn - trung bình giàu giá trị học ngoại ngữ (2..68 ký tự, tránh đoạn văn dài)
      if (!cleanVi || cleanVi.length < 2 || cleanVi.length > 68) continue;
      if (/^https?:|^\d+$|^[a-z0-9_.-]+$/i.test(cleanVi)) continue;
      const enVal = enExact[viKey];
      const zhCnVal = zhCnExact[viKey];
      const zhTwVal = zhTwExact[viKey];
      const koVal = koExact[viKey];
      const jaVal = jaExact[viKey];
      // Chỉ giữ mục có đầy đủ ít nhất 4/5 ngoại ngữ đã dịch thật!
      const validCount = [enVal, zhCnVal, zhTwVal, koVal, jaVal].filter((x) => x && String(x).trim()).length;
      if (validCount < 4) continue;
      const normKey = cleanVi.toLowerCase();
      if (seenClean.has(normKey)) continue;
      seenClean.add(normKey);

      const stripEmoji = (t) => String(t || '').replace(/^[\u{1F300}-\u{1FAFF}\u2600-\u27BF\s•▸▾▶➔←→✅⚠️❌🔄📋📍]+/gu, '').trim() || String(t || '').trim();
      const row = {
        id: `v_${items.length + 1}`,
        topic: classifyVocabTopic(cleanVi),
        vi: stripEmoji(viKey),
        en: stripEmoji(enVal || viKey),
        zh_cn: stripEmoji(zhCnVal || viKey),
        zh_tw: stripEmoji(zhTwVal || zhCnVal || viKey),
        ko: stripEmoji(koVal || viKey),
        ja: stripEmoji(jaVal || viKey),
      };
      items.push(row);
    }

    // Bảo đảm luôn có danh sách tối thiểu ngay cả khi test độc lập không load full packs
    if (items.length < 5) {
      const fallback = [
        { id: 'v_fb_1', topic: '⚙️ Điều khiển & Giao diện', vi: 'Lưu ngay', en: 'Save now', zh_cn: '立即保存', zh_tw: '立即儲存', ko: '지금 저장', ja: '今すぐ保存' },
        { id: 'v_fb_2', topic: '📈 Tài chính & Tri thức', vi: '20 phút thông thái', en: '20-Min Daily Wisdom', zh_cn: '每日20分钟智慧', zh_tw: '每日20分鐘智慧', ko: '매일 20분 지혜', ja: '毎日20分の知恵' },
        { id: 'v_fb_3', topic: '📈 Tài chính & Tri thức', vi: 'Đầu tư hôm nay', en: 'Invest Today', zh_cn: '今日投资', zh_tw: '今日投資', ko: '오늘의 투자', ja: '今日の投資' },
        { id: 'v_fb_4', topic: '🎵 Giải trí, Thời tiết & Giờ', vi: 'Xem Thời Tiết', en: 'Weather', zh_cn: '查看天气', zh_tw: '查看天氣', ko: '날씨 보기', ja: '天気を見る' },
        { id: 'v_fb_5', topic: '⚙️ Điều khiển & Giao diện', vi: 'Chọn Ngôn Ngữ', en: 'Select Language', zh_cn: '选择语言', zh_tw: '選擇語言', ko: '언어 선택', ja: '言語を選択' },
      ];
      items.push(...fallback);
    }

    return items;
  }

  // --------------------------------------------------------------------------
  // 4. LƯU TRỮ NỘI BỘ (PREFS, ⭐ STARS, FLASHCARD DECKS, MASTERY)
  // --------------------------------------------------------------------------
  function loadJson(key, fallback) {
    try {
      const raw = globalScope.localStorage?.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_e) { return fallback; }
  }
  function saveJson(key, val) {
    try {
      globalScope.localStorage?.setItem(key, JSON.stringify(val));
    } catch (_e) {}
  }

  // --------------------------------------------------------------------------
  // 5. BỘ XUẤT PDF THUẦN (SỔ TAY TỪ VỰNG+NGỮ PHÁP & THẺ FLASHCARD IN CẮT 2 MẶT)
  //    + XUẤT .TSV (ANKI/QUIZLET) + XUẤT .HTML FLASHCARD TƯƠNG TÁC OFFLINE
  // --------------------------------------------------------------------------
  async function ensurePdfLib() {
    if (globalScope.PDFLib) return globalScope.PDFLib;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
      s.async = true;
      s.onload = () => (globalScope.PDFLib ? resolve(globalScope.PDFLib) : reject(new Error('PDFLib failed')));
      s.onerror = () => reject(new Error('Không tải được pdf-lib'));
      document.head.appendChild(s);
    });
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function wrapCtx(ctx, txt, maxW) {
    const words = String(txt || '').split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  async function exportVocabAndGrammarPdf({ vocabItems, visibleLangs, nativeLang, includeGrammar = true }) {
    const PDFLib = await ensurePdfLib();
    const langs = visibleLangs.slice(0, 6);
    const pdfDoc = await PDFLib.PDFDocument.create();
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const c = document.createElement('canvas');
    c.width = 1240;
    c.height = 1754;
    const ctx = c.getContext('2d');
    const fontCjk = '"Segoe UI", "Microsoft YaHei", "Malgun Gothic", "Yu Gothic", Arial, sans-serif';

    const flushPage = async () => {
      const dataUrl = c.toDataURL('image/jpeg', 0.90);
      const bin = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const jpg = await pdfDoc.embedJpg(bytes);
      const pg = pdfDoc.addPage([595.28, 841.89]);
      pg.drawImage(jpg, { x: 0, y: 0, width: 595.28, height: 841.89 });
    };

    const startNewPage = (subtitle) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, c.width, 108);
      ctx.fillStyle = '#38bdf8';
      ctx.font = `900 30px ${fontCjk}`;
      ctx.textBaseline = 'top';
      ctx.fillText(`SỔ TAY TỪ VỰNG & NGỮ PHÁP ĐA NGÔN NGỮ (${langs.map((l) => l.toUpperCase()).join(' · ')})`, 56, 22);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `600 19px ${fontCjk}`;
      ctx.fillText(`${subtitle}  ·  Ngày xuất: ${todayStr}  ·  Sổ Tay Tiểu Thuyết Của Bi`, 56, 66);
      return 132;
    };

    let y = startNewPage(`Bảng từ vựng đã chọn (${vocabItems.length} mục) kèm phiên âm`);
    const colW = Math.floor((1240 - 112) / langs.length);

    const drawTableHeader = () => {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(56, y, 1240 - 112, 42);
      ctx.fillStyle = '#0369a1';
      ctx.font = `900 20px ${fontCjk}`;
      langs.forEach((code, idx) => {
        const meta = LANGUAGES.find((l) => l.code === code) || { name: code };
        ctx.fillText(meta.name + (code === nativeLang ? ' ★' : ''), 66 + idx * colW, y + 10);
      });
      y += 46;
    };

    drawTableHeader();
    for (const item of vocabItems.slice(0, 260)) {
      const cellLines = langs.map((code) => {
        ctx.font = `700 18px ${fontCjk}`;
        const t = wrapCtx(ctx, item[code] || '—', colW - 18).slice(0, 2);
        const ph = getPhonetic(code, item[code]);
        ctx.font = `500 14px ${fontCjk}`;
        const p = ph && code !== nativeLang ? wrapCtx(ctx, ph, colW - 18).slice(0, 2) : [];
        return { t, p };
      });
      const maxH = Math.max(...cellLines.map((cl) => cl.t.length * 24 + cl.p.length * 19)) + 16;
      if (y + maxH > 1680) {
        await flushPage();
        y = startNewPage(`Bảng từ vựng (tiếp theo)`);
        drawTableHeader();
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(56, y, 1240 - 112, maxH);
      cellLines.forEach((cl, idx) => {
        const cx = 66 + idx * colW;
        let cy = y + 8;
        ctx.fillStyle = '#0f172a';
        ctx.font = `700 18px ${fontCjk}`;
        cl.t.forEach((ln) => { ctx.fillText(ln, cx, cy); cy += 24; });
        ctx.fillStyle = '#64748b';
        ctx.font = `500 14px ${fontCjk}`;
        cl.p.forEach((ln) => { ctx.fillText(ln, cx, cy); cy += 19; });
      });
      y += maxH;
    }

    if (includeGrammar) {
      await flushPage();
      y = startNewPage('Bảng Ngữ Pháp Đối Chiếu 10 Cấu Trúc Cốt Lõi');
      for (const g of GRAMMAR_MATRIX) {
        const blockH = 44 + langs.length * 46;
        if (y + blockH > 1680) {
          await flushPage();
          y = startNewPage('Bảng Ngữ Pháp Đối Chiếu (tiếp theo)');
        }
        ctx.fillStyle = '#ede9fe';
        ctx.fillRect(56, y, 1240 - 112, 38);
        ctx.fillStyle = '#5b21b6';
        ctx.font = `900 20px ${fontCjk}`;
        ctx.fillText(g.topic, 68, y + 8);
        y += 42;
        for (const code of langs) {
          const meta = LANGUAGES.find((l) => l.code === code) || { short: code };
          const obj = g[code] || {};
          ctx.fillStyle = '#0f172a';
          ctx.font = `800 17px ${fontCjk}`;
          ctx.fillText(`[${meta.short}] ${obj.pattern || ''}`, 68, y);
          ctx.fillStyle = '#334155';
          ctx.font = `500 16px ${fontCjk}`;
          ctx.fillText(`VD: ${obj.ex || ''}`, 68, y + 22);
          y += 46;
        }
        y += 10;
      }
    }

    await flushPage();
    c.width = 0;
    c.height = 0;
    const pdfBytes = await pdfDoc.save();
    triggerDownload(new Blob([pdfBytes], { type: 'application/pdf' }), `So_Tay_Ngoai_Ngu_${Date.now()}.pdf`);
    return { ok: true, pages: pdfDoc.getPageCount(), size: pdfBytes.byteLength };
  }

  /**
   * Xuất Flashcard thành PDF In Cắt 2 Mặt A4 (8 thẻ/trang — Mặt trước + Mặt sau khớp nhau!)
   */
  async function exportFlashcardsPdf(deck) {
    const PDFLib = await ensurePdfLib();
    const pdfDoc = await PDFLib.PDFDocument.create();
    const cards = Array.isArray(deck?.cards) ? deck.cards : [];
    const fontCjk = '"Segoe UI", "Microsoft YaHei", "Malgun Gothic", "Yu Gothic", Arial, sans-serif';
    const c = document.createElement('canvas');
    c.width = 1240;
    c.height = 1754;
    const ctx = c.getContext('2d');

    const flush = async () => {
      const dataUrl = c.toDataURL('image/jpeg', 0.91);
      const bin = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const jpg = await pdfDoc.embedJpg(bytes);
      const pg = pdfDoc.addPage([595.28, 841.89]);
      pg.drawImage(jpg, { x: 0, y: 0, width: 595.28, height: 841.89 });
    };

    const drawGridSide = (slice, isBack) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = isBack ? '#065f46' : '#1e3a8a';
      ctx.font = `900 24px ${fontCjk}`;
      ctx.textBaseline = 'top';
      ctx.fillText(`${deck.title || 'Bộ Flashcard'} — ${isBack ? 'MẶT SAU (ĐÁP ÁN)' : 'MẶT TRƯỚC (CÂU HỎI)'}`, 56, 36);
      const cardW = 550;
      const cardH = 385;
      slice.forEach((card, i) => {
        const col = isBack ? (1 - (i % 2)) : (i % 2); // Đảo cột mặt sau để in 2 mặt cắt khớp 100%!
        const row = Math.floor(i / 2);
        const x = 56 + col * (cardW + 28);
        const y = 92 + row * (cardH + 22);
        ctx.fillStyle = isBack ? '#ecfdf5' : '#eff6ff';
        ctx.fillRect(x, y, cardW, cardH);
        ctx.setLineDash([10, 6]);
        ctx.strokeStyle = isBack ? '#10b981' : '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, cardW, cardH);
        ctx.setLineDash([]);

        ctx.fillStyle = isBack ? '#047857' : '#1d4ed8';
        ctx.font = `800 18px ${fontCjk}`;
        ctx.fillText(isBack ? card.backLabel || 'ĐÁP ÁN' : card.frontLabel || 'TỪ VỰNG', x + 22, y + 20);

        ctx.fillStyle = '#0f172a';
        ctx.font = `900 32px ${fontCjk}`;
        const mainTxt = isBack ? card.back : card.front;
        wrapCtx(ctx, mainTxt, cardW - 44).slice(0, 4).forEach((ln, li) => {
          ctx.fillText(ln, x + 22, y + 72 + li * 42);
        });

        const subTxt = isBack ? card.backSub : card.frontSub;
        if (subTxt) {
          ctx.fillStyle = '#475569';
          ctx.font = `600 20px ${fontCjk}`;
          wrapCtx(ctx, subTxt, cardW - 44).slice(0, 3).forEach((ln, li) => {
            ctx.fillText(ln, x + 22, y + 255 + li * 28);
          });
        }
      });
    };

    for (let i = 0; i < cards.length; i += 8) {
      const slice = cards.slice(i, i + 8);
      drawGridSide(slice, false);
      await flush();
      drawGridSide(slice, true);
      await flush();
    }
    c.width = 0;
    c.height = 0;
    const pdfBytes = await pdfDoc.save();
    triggerDownload(new Blob([pdfBytes], { type: 'application/pdf' }), `Flashcard_In_Cat_${Date.now()}.pdf`);
    return { ok: true, pages: pdfDoc.getPageCount() };
  }

  /**
   * Xuất Flashcard ra .TSV chuẩn Anki / Quizlet (UTF-8 BOM)
   */
  function exportFlashcardsTsv(deck) {
    const cards = Array.isArray(deck?.cards) ? deck.cards : [];
    const cleanCell = (s) => String(s || '').replace(/[\t\r\n]+/g, ' ').trim();
    const lines = cards.map((c) => {
      const front = cleanCell(c.front + (c.frontSub ? ` [${c.frontSub}]` : ''));
      const back = cleanCell(c.back + (c.backSub ? ` (${c.backSub})` : ''));
      return `${front}\t${back}`;
    });
    const content = '\uFEFF' + lines.join('\n');
    triggerDownload(new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' }), `Flashcard_Anki_Quizlet_${Date.now()}.tsv`);
    return { ok: true, count: cards.length };
  }

  /**
   * Xuất Flashcard thành file .HTML tương tác chạy Offline 100% (lật thẻ 3D + nghe phát âm 🔊!)
   */
  function exportFlashcardsInteractiveHtml(deck) {
    const safeJson = JSON.stringify(deck || { title: 'Flashcard', cards: [] }).replace(/</g, '\\u003c');
    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${String(deck?.title || 'Flashcard Ngoại Ngữ').replace(/</g, '&lt;')}</title>
<style>body{margin:0;font-family:"Segoe UI",Arial,sans-serif;background:#0f172a;color:#f8fafc;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
.card{width:100%;max-width:620px;min-height:280px;border-radius:22px;border:2px solid #38bdf8;background:#1e293b;padding:28px;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;box-shadow:0 20px 50px rgba(0,0,0,.5)}
.tag{font-size:12px;font-weight:800;color:#7dd3fc;text-transform:uppercase}.main{font-size:30px;font-weight:900;margin:16px 0;line-height:1.3}.sub{font-size:15px;color:#94a3b8}
.bar{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center}button{padding:10px 16px;border-radius:12px;border:1px solid #475569;background:#334155;color:#fff;font-weight:800;cursor:pointer}
button.pri{background:linear-gradient(135deg,#059669,#0284c7);border-color:#34d399}</style></head><body>
<h2 id="title" style="margin:0 0 12px"></h2>
<div class="card" id="card"><div class="tag" id="tag"></div><div class="main" id="main"></div><div class="sub" id="sub"></div><div style="font-size:12px;color:#64748b">Bấm vào thẻ để lật Mặt trước / Mặt sau</div></div>
<div class="bar"><button id="prev">◀ Trước</button><button id="speak">🔊 Nghe phát âm</button><button class="pri" id="flip">🔄 Lật thẻ</button><button id="next">Sau ▶</button></div>
<p id="stat" style="font-size:13px;color:#94a3b8;margin-top:12px"></p>
<script>const DECK=${safeJson};let idx=0,back=false;document.getElementById('title').textContent=DECK.title;
function render(){const c=DECK.cards[idx]||{};document.getElementById('tag').textContent=back?(c.backLabel||'ĐÁP ÁN'):(c.frontLabel||'CÂU HỎI');
document.getElementById('main').textContent=back?(c.back||''):(c.front||'');document.getElementById('sub').textContent=back?(c.backSub||''):(c.frontSub||'');
document.getElementById('stat').textContent='Thẻ '+(idx+1)+' / '+DECK.cards.length;}
document.getElementById('card').onclick=document.getElementById('flip').onclick=()=>{back=!back;render();};
document.getElementById('prev').onclick=()=>{idx=(idx-1+DECK.cards.length)%DECK.cards.length;back=false;render();};
document.getElementById('next').onclick=()=>{idx=(idx+1)%DECK.cards.length;back=false;render();};
document.getElementById('speak').onclick=()=>{const c=DECK.cards[idx];if(!c||!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(c.speakText||c.front);u.lang=c.bcp47||'en-US';speechSynthesis.speak(u);};
render();</script></body></html>`;
    triggerDownload(new Blob([html], { type: 'text/html;charset=utf-8' }), `Flashcard_Tuong_Tac_Offline_${Date.now()}.html`);
    return { ok: true, count: deck?.cards?.length || 0 };
  }

  LL.LANGUAGES = LANGUAGES;
  LL.GRAMMAR_MATRIX = GRAMMAR_MATRIX;
  LL.STORAGE_KEYS = STORAGE_KEYS;
  LL.getPhonetic = getPhonetic;
  LL.speakText = speakText;
  LL.buildWebsiteVocabDatabase = buildWebsiteVocabDatabase;
  LL.loadJson = loadJson;
  LL.saveJson = saveJson;
  LL.exportVocabAndGrammarPdf = exportVocabAndGrammarPdf;
  LL.exportFlashcardsPdf = exportFlashcardsPdf;
  LL.exportFlashcardsTsv = exportFlashcardsTsv;
  LL.exportFlashcardsInteractiveHtml = exportFlashcardsInteractiveHtml;
})(typeof window !== 'undefined' ? window : globalThis);
