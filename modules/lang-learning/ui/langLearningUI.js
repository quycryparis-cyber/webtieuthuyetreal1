/**
 * ============================================================================
 * 🎓 MODULE 51: GIAO DIỆN "HỌC NGOẠI NGỮ QUA TRANG WEB" & FLASHCARD 6 CHẾ ĐỘ (v131.0)
 * ============================================================================
 * - Bước 1 (Pop-up Chọn ngôn ngữ bằng cả 6 thứ tiếng ngăn cách bởi dấu `/`):
 *   1) Ngôn ngữ mẹ đẻ của bạn là gì? (6 thứ tiếng /)
 *   2) Ngôn ngữ bạn muốn học là gì? (5 thứ tiếng còn lại /, chọn nhiều ngôn ngữ 1 lúc!)
 * - Bước 2 (Studio Học tập 4 Tab):
 *   * Tab 1: 📖 Bảng Từ Vựng Đa Ngôn Ngữ (từ dịch thuật thật xuyên suốt web, ẩn/hiện cột
 *     tối thiểu 2 ngôn ngữ, phiên âm 6 thứ tiếng + nút 🔊 nghe giọng bản xứ, mặc định chọn
 *     tất cả để xuất PDF/Flashcard, dấu ⭐ yêu thích lưu nội bộ, chọn từ riêng vào kho!).
 *   * Tab 2: 📐 Bảng Ngữ Pháp & Cấu Trúc (10 cấu trúc đối chiếu 6 ngôn ngữ).
 *   * Tab 3: 🃏 Tạo & Học Flashcard 6 Chế Độ (CHỈ tạo khi người dùng bấm Tạo, lưu nội bộ!).
 *   * Tab 4: 📥 Xuất PDF & Tải Bộ Flashcard (.PDF In Cắt 2 Mặt / .TSV Anki-Quizlet / .HTML Offline).
 * ============================================================================
 */
(function initLangLearningUI(globalScope) {
  'use strict';

  const LL = (globalScope.NoirLangLearning = globalScope.NoirLangLearning || {});
  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  const MODAL_ID = 'modal-mod51-lang-studio';

  const FLASHCARD_MODES = Object.freeze([
    { id: 'meaning', icon: '📖', label: '1. Học ý nghĩa từ vựng (Meaning Recall)', desc: 'Hiện từ ngoại ngữ + phiên âm → Lật xem nghĩa tiếng mẹ đẻ.' },
    { id: 'script', icon: '🔤', label: '2. Nhận diện mặt chữ (Script Recognition)', desc: 'Ẩn phiên âm, chỉ hiện mặt chữ gốc (Kanji/Hán tự/Hangul) → Lật xem cách đọc & nghĩa.' },
    { id: 'listening', icon: '🎧', label: '3. Nghe & Nhận diện từ ngữ (Audio Listening)', desc: 'Ẩn chữ, bấm nghe giọng bản xứ → Đoán từ rồi lật kiểm tra đáp án.' },
    { id: 'active_typing', icon: '✍️', label: '4. Đảo chiều & Gõ đáp án (Active Recall)', desc: 'Hiện nghĩa tiếng mẹ đẻ → Tự gõ lại từ ngoại ngữ để chấm đúng/sai.' },
    { id: 'grammar', icon: '📐', label: '5. Nhận diện Ngữ pháp & Mẫu câu (Grammar)', desc: 'Học 10 cấu trúc ngữ pháp cốt lõi đối chiếu trực tiếp với tiếng mẹ đẻ.' },
    { id: 'quiz_4', icon: '⚡', label: '6. Trắc nghiệm 4 Đáp Án (Speed Quiz)', desc: 'Chọn nhanh 1 trong 4 đáp án, tính điểm chuẩn xác ngay lập tức.' },
  ]);

  const state = {
    modalEl: null,
    step: 'setup', // 'setup' | 'studio'
    activeTab: 'vocab', // 'vocab' | 'grammar' | 'flashcards' | 'export'
    nativeLang: 'vi',
    targetLangs: ['en', 'ja'],
    visibleLangs: ['vi', 'en', 'ja'],
    vocabList: [],
    selectedIds: new Set(),
    starredIds: new Set(),
    searchQuery: '',
    topicFilter: 'all',
    showOnlyStarred: false,
    showPhonetics: true,
    decks: [],
    activeDeckId: '',
    studyMode: 'meaning',
    cardIdx: 0,
    cardFlipped: false,
    quizPicked: '',
    quizScore: { ok: 0, total: 0 },
    typingFeedback: '',
    masteryMap: {},
  };

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(msg, type = 'info', ms = 3000) {
    NS.utils?.showToast?.(msg, type, ms);
  }

  function persistState() {
    LL.saveJson(LL.STORAGE_KEYS.PREFS, {
      nativeLang: state.nativeLang,
      targetLangs: state.targetLangs,
      visibleLangs: state.visibleLangs,
      setupDone: state.step === 'studio',
    });
    LL.saveJson(LL.STORAGE_KEYS.STARS, [...state.starredIds]);
    LL.saveJson(LL.STORAGE_KEYS.MASTERY, state.masteryMap);
    try {
      const jsonDecks = JSON.stringify(state.decks);
      globalScope.localStorage?.setItem(LL.STORAGE_KEYS.DECKS, jsonDecks);
    } catch (_eQuota) {
      try {
        // Nếu bộ thẻ lớn vượt 5MB localStorage, lưu công thức tái tạo FULL theo ID từ vựng (0 mất thẻ nào khi mở lại!)
        const recipes = state.decks.slice(0, 6).map((d) => ({
          id: d.id,
          title: d.title,
          targetLang: d.targetLang,
          defaultMode: d.defaultMode,
          createdLabel: d.createdLabel,
          sourceMode: d.sourceMode || ((d.cards?.length || 0) >= state.vocabList.length ? 'all' : 'custom'),
          vocabIds: (d.cards || []).map((c) => c.vocabId).filter(Boolean),
          cards: (d.cards?.length || 0) <= 250 ? d.cards : undefined,
        }));
        globalScope.localStorage?.setItem(LL.STORAGE_KEYS.DECKS, JSON.stringify(recipes));
      } catch (_e2) {}
    }
  }

  function hydrateState() {
    const prefs = LL.loadJson(LL.STORAGE_KEYS.PREFS, null);
    if (prefs && prefs.nativeLang) {
      state.nativeLang = prefs.nativeLang;
      state.targetLangs = Array.isArray(prefs.targetLangs) && prefs.targetLangs.length
        ? prefs.targetLangs.filter((c) => c !== prefs.nativeLang)
        : ['en'];
      state.visibleLangs = Array.isArray(prefs.visibleLangs) && prefs.visibleLangs.length >= 2
        ? prefs.visibleLangs
        : [state.nativeLang, ...state.targetLangs];
      state.step = prefs.setupDone ? 'studio' : 'setup';
    } else {
      const curAppLang = NS.i18n?.getLanguage?.() || 'vi';
      state.nativeLang = curAppLang;
      state.targetLangs = curAppLang === 'en' ? ['vi', 'ja'] : ['en', 'ja'];
      state.visibleLangs = [state.nativeLang, ...state.targetLangs];
      state.step = 'setup';
    }
    state.starredIds = new Set(LL.loadJson(LL.STORAGE_KEYS.STARS, []));
    const rawDecks = LL.loadJson(LL.STORAGE_KEYS.DECKS, []);
    state.masteryMap = LL.loadJson(LL.STORAGE_KEYS.MASTERY, {});
    state.vocabList = LL.buildWebsiteVocabDatabase();
    // Mặc định chọn TẤT CẢ từ vựng trong bảng để xuất PDF hoặc tạo Flashcard
    state.selectedIds = new Set(state.vocabList.map((v) => v.id));
    state.decks = Array.isArray(rawDecks)
      ? rawDecks.map((d) => {
          if (Array.isArray(d?.cards) && d.cards.length) return d;
          const tgt = d?.targetLang || state.targetLangs[0] || 'en';
          const modeId = d?.defaultMode || 'meaning';
          if (Array.isArray(d?.vocabIds) && d.vocabIds.length) {
            const wantSet = new Set(d.vocabIds);
            const matchedPool = state.vocabList.filter((v) => wantSet.has(v.id));
            return { ...d, cards: buildDeckCardsFromPool(matchedPool, tgt, modeId) };
          }
          return { ...d, cards: buildDeckCards({ sourceMode: d?.sourceMode || 'all', targetLang: tgt, modeId }) };
        })
      : [];
  }

  function getLangMeta(code) {
    return LL.LANGUAGES.find((l) => l.code === code) || LL.LANGUAGES[0];
  }

  function getFilteredVocab() {
    const q = state.searchQuery.trim().toLowerCase();
    return state.vocabList.filter((item) => {
      if (state.showOnlyStarred && !state.starredIds.has(item.id)) return false;
      if (state.topicFilter !== 'all' && item.topic !== state.topicFilter) return false;
      if (!q) return true;
      return state.visibleLangs.some((code) => String(item[code] || '').toLowerCase().includes(q));
    });
  }

  function resolvePoolForSourceMode(sourceMode) {
    let pool = state.vocabList;
    if (sourceMode === 'selected') {
      pool = state.vocabList.filter((v) => state.selectedIds.has(v.id));
    } else if (sourceMode === 'starred') {
      pool = state.vocabList.filter((v) => state.starredIds.has(v.id));
    }
    return pool.length ? pool : state.vocabList;
  }

  function makeVocabCard(v, targetLang, nativeMeta, targetMeta) {
    const targetWord = v[targetLang] || v.en;
    const nativeWord = v[state.nativeLang] || v.vi;
    const phon = LL.getPhonetic(targetLang, targetWord);
    return {
      id: `${v.id}_${targetLang}`,
      vocabId: v.id,
      targetLang,
      bcp47: targetMeta.bcp47,
      speakText: targetWord,
      frontLabel: `${targetMeta.flag} ${targetMeta.name} (${v.topic})`,
      front: targetWord,
      frontSub: phon,
      backLabel: `${nativeMeta.flag} ${nativeMeta.name}`,
      back: nativeWord,
      backSub: phon ? `Phiên âm: ${phon}` : '',
    };
  }

  function buildDeckCardsFromPool(pool, targetLang, modeId) {
    const nativeMeta = getLangMeta(state.nativeLang);
    const targetMeta = getLangMeta(targetLang);
    if (modeId === 'grammar') {
      return LL.GRAMMAR_MATRIX.map((g) => ({
        id: `${g.id}_${targetLang}`,
        frontLabel: `📐 NGỮ PHÁP (${targetMeta.flag} ${targetMeta.name})`,
        front: g[targetLang]?.pattern || g.topic,
        frontSub: `VD: ${g[targetLang]?.ex || ''}`,
        backLabel: `${nativeMeta.flag} ${nativeMeta.name} — ${g.topic}`,
        back: g[state.nativeLang]?.pattern || '',
        backSub: `VD: ${g[state.nativeLang]?.ex || ''}`,
        speakText: String(g[targetLang]?.ex || '').replace(/\(.*?\)/g, '').trim(),
        bcp47: targetMeta.bcp47,
        targetLang,
        vocabId: g.id,
      }));
    }
    return (pool || state.vocabList).map((v) => makeVocabCard(v, targetLang, nativeMeta, targetMeta));
  }

  function buildDeckCards({ sourceMode, targetLang, modeId }) {
    if (modeId === 'grammar' || sourceMode === 'grammar') {
      return buildDeckCardsFromPool([], targetLang, 'grammar');
    }
    return buildDeckCardsFromPool(resolvePoolForSourceMode(sourceMode), targetLang, modeId);
  }

  async function buildDeckCardsAsync({ sourceMode, targetLang, modeId, onProgress } = {}) {
    if (modeId === 'grammar' || sourceMode === 'grammar') {
      return buildDeckCardsFromPool([], targetLang, 'grammar');
    }
    const nativeMeta = getLangMeta(state.nativeLang);
    const targetMeta = getLangMeta(targetLang);
    const pool = resolvePoolForSourceMode(sourceMode);
    const cards = new Array(pool.length);
    const CHUNK = 160;
    for (let i = 0; i < pool.length; i += CHUNK) {
      const end = Math.min(pool.length, i + CHUNK);
      for (let j = i; j < end; j++) {
        cards[j] = makeVocabCard(pool[j], targetLang, nativeMeta, targetMeta);
      }
      if (typeof onProgress === 'function') onProgress(end, pool.length);
      if (end < pool.length) await new Promise((r) => setTimeout(r, 0));
    }
    return cards;
  }

  // ==========================================================================
  // RENDER SETUP WIZARD (6 THỨ TIẾNG NGĂN CÁCH BỞI /)
  // ==========================================================================
  function renderSetupWizardHtml() {
    const q1All6 = LL.LANGUAGES.map((l) => l.qNative).join(' / ');
    const remaining5 = LL.LANGUAGES.filter((l) => l.code !== state.nativeLang);
    const q2Rem5 = remaining5.map((l) => l.qLearn).join(' / ');

    return `
      <div class="max-w-4xl mx-auto space-y-5 py-2">
        <div class="ll51-card space-y-3 border-sky-500/45">
          <div class="text-xs font-black uppercase tracking-wider text-sky-400">BƯỚC 1 / STEP 1 / 步骤 1</div>
          <h3 class="text-sm sm:text-base font-black leading-relaxed text-white">${esc(q1All6)}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            ${LL.LANGUAGES.map((l) => {
              const active = l.code === state.nativeLang;
              return `
                <button type="button" data-ll51-native="${l.code}" class="min-w-0 p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between gap-2 ${active ? 'border-emerald-400 bg-emerald-500/20 text-white' : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-sky-400/60'}">
                  <span class="min-w-0 flex items-center gap-2 font-extrabold text-xs sm:text-sm"><span class="shrink-0">${l.flag}</span><span class="break-words">${esc(l.name)}</span></span>
                  <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800">${active ? '✓' : l.short}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="ll51-card space-y-3 border-violet-500/45">
          <div class="text-xs font-black uppercase tracking-wider text-violet-300">BƯỚC 2 / STEP 2 (CHỌN 1 HOẶC NHIỀU NGÔN NGỮ CÙNG LÚC)</div>
          <h3 class="text-sm sm:text-base font-black leading-relaxed text-white">${esc(q2Rem5)}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            ${remaining5.map((l) => {
              const picked = state.targetLangs.includes(l.code);
              return `
                <button type="button" data-ll51-target="${l.code}" class="p-3 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between gap-2 ${picked ? 'border-violet-400 bg-violet-500/25 text-white' : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-violet-400/60'}">
                  <span class="flex items-center gap-2 font-extrabold text-sm"><span>${l.flag}</span><span>${esc(l.name)}</span></span>
                  <span class="text-xs font-black px-2 py-0.5 rounded ${picked ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'}">${picked ? '✓ Học' : '+ Chọn'}</span>
                </button>
              `;
            }).join('')}
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button type="button" id="ll51-btn-pick-all-5" class="ll51-btn text-xs">🌍 Chọn học cả 5 ngoại ngữ cùng lúc</button>
            <button type="button" id="ll51-btn-start-studio" class="ll51-btn ll51-btn-primary px-6 py-2.5 text-sm">
              🚀 Vào Bảng Từ Vựng, Ngữ Pháp &amp; Flashcard (${state.targetLangs.length} ngoại ngữ) ➔
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // RENDER TAB 1: BẢNG TỪ VỰNG ĐA NGÔN NGỮ (TỐI THIỂU 2 NGÔN NGỮ HIỂN THỊ)
  // ==========================================================================
  function renderVocabTabHtml() {
    const filtered = getFilteredVocab();
    const topics = ['all', ...new Set(state.vocabList.map((v) => v.topic))];
    const activeLangs = [state.nativeLang, ...state.targetLangs].filter((v, i, a) => a.indexOf(v) === i);

    return `
      <div class="space-y-3.5">
        <!-- Thanh ẩn/hiện ngôn ngữ (bắt buộc giữ tối thiểu 2 ngôn ngữ) -->
        <div class="ll51-card space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs font-black text-sky-300">👁️ Ẩn / Hiện cột ngôn ngữ (luôn giữ tối thiểu 2 ngôn ngữ để đối chiếu):</div>
            <div class="flex flex-wrap items-center gap-2">
              <label class="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <input type="checkbox" id="ll51-chk-phonetics" ${state.showPhonetics ? 'checked' : ''} />
                <span>Hiện phiên âm 6 ngôn ngữ</span>
              </label>
              <button type="button" id="ll51-btn-edit-langs" class="ll51-btn text-xs py-1">⚙️ Đổi ngôn ngữ mẹ đẻ / mục tiêu</button>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            ${activeLangs.map((code) => {
              const l = getLangMeta(code);
              const isOn = state.visibleLangs.includes(code);
              return `
                <button type="button" data-ll51-toggle-col="${code}" class="ll51-lang-chip ${isOn ? 'is-on' : ''}">
                  <span>${l.flag} ${esc(l.name)}${code === state.nativeLang ? ' (Mẹ đẻ)' : ''}</span>
                  <span>${isOn ? '👁️' : '🙈'}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Bộ lọc, Tìm kiếm & Quản lý Chọn Xuất / Sao yêu thích -->
        <div class="ll51-card flex flex-wrap items-center justify-between gap-2.5">
          <div class="flex flex-wrap items-center gap-2 flex-1 min-w-0 w-full md:w-auto md:min-w-[240px]">
            <input type="text" id="ll51-search" class="ll51-input flex-1 min-w-0 w-full sm:w-auto sm:min-w-[180px]" placeholder="🔍 Tìm từ vựng bằng bất kỳ ngôn ngữ nào..." value="${esc(state.searchQuery)}" />
            <select id="ll51-topic-sel" class="ll51-select">
              ${topics.map((t) => `<option value="${esc(t)}" ${t === state.topicFilter ? 'selected' : ''}>${t === 'all' ? '📂 Tất cả chủ đề' : esc(t)}</option>`).join('')}
            </select>
            <button type="button" id="ll51-btn-filter-star" class="ll51-btn text-xs ${state.showOnlyStarred ? 'll51-btn-amber' : ''}">⭐ Chỉ hiện từ yêu thích (${state.starredIds.size})</button>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <span id="ll51-selected-count-badge" class="text-xs font-black text-emerald-300 px-2">✅ Đã chọn: ${state.selectedIds.size}/${state.vocabList.length}</span>
            <button type="button" id="ll51-btn-sel-all" class="ll51-btn text-xs py-1.5">☑️ Chọn hết</button>
            <button type="button" id="ll51-btn-sel-none" class="ll51-btn text-xs py-1.5">⬜ Bỏ chọn</button>
            <button type="button" id="ll51-btn-sel-stars" class="ll51-btn text-xs py-1.5">⭐ Chọn theo Sao</button>
          </div>
        </div>

        <!-- Bảng Từ Vựng Đa Ngôn Ngữ -->
        <div class="ll51-table-wrap max-h-[52vh]">
          <table class="ll51-table">
            <thead>
              <tr>
                <th class="w-10">Chọn</th>
                <th class="w-10">⭐</th>
                ${state.visibleLangs.map((code) => {
                  const l = getLangMeta(code);
                  return `<th>${l.flag} ${esc(l.name)}${code === state.nativeLang ? ' ★' : ''}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${filtered.slice(0, 180).map((item) => {
                const checked = state.selectedIds.has(item.id);
                const starred = state.starredIds.has(item.id);
                return `
                  <tr>
                    <td><input type="checkbox" data-ll51-sel-id="${item.id}" ${checked ? 'checked' : ''} class="w-4 h-4 accent-emerald-500 cursor-pointer" /></td>
                    <td>
                      <button type="button" data-ll51-star-id="${item.id}" class="text-lg leading-none cursor-pointer bg-transparent border-0" title="Đánh dấu sao từ thích học">${starred ? '⭐' : '☆'}</button>
                    </td>
                    ${state.visibleLangs.map((code) => {
                      const txt = item[code] || '—';
                      const phon = state.showPhonetics ? LL.getPhonetic(code, txt) : '';
                      return `
                        <td>
                          <div class="flex items-start justify-between gap-1.5">
                            <span lang="${esc(code)}" class="font-semibold text-slate-100 leading-relaxed">${esc(txt)}</span>
                            <button type="button" data-ll51-speak-lang="${code}" data-ll51-speak-text="${esc(txt)}" class="shrink-0 text-xs px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-600 text-sky-300 hover:text-white cursor-pointer border-0 inline-flex items-center justify-center" title="Nghe phát âm bản xứ" aria-label="Nghe phát âm"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></button>
                          </div>
                          ${phon ? `<span class="ll51-phonetic">${esc(phon)}</span>` : ''}
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${filtered.length > 180 ? `<div class="text-xs text-slate-400 text-center">Đang hiển thị 180/${filtered.length} từ khớp bộ lọc (toàn bộ từ đã tích chọn vẫn được giữ đủ khi xuất PDF / tạo Flashcard).</div>` : ''}
      </div>
    `;
  }

  // ==========================================================================
  // RENDER TAB 2: BẢNG NGỮ PHÁP ĐỐI CHIẾU 6 NGÔN NGỮ
  // ==========================================================================
  function renderGrammarTabHtml() {
    return `
      <div class="space-y-3">
        <div class="ll51-card flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-sm sm:text-base font-black text-violet-300">📐 Bảng Ngữ Pháp &amp; Mẫu Câu Cốt Lõi Đối Chiếu (${state.visibleLangs.length} Ngôn Ngữ)</h3>
            <p class="text-xs text-slate-300">So sánh trực tiếp công thức, trật tự câu &amp; ví dụ kèm phiên âm giữa ngôn ngữ mẹ đẻ và các ngoại ngữ bạn đang học.</p>
          </div>
          <button type="button" id="ll51-btn-export-grammar-pdf" class="ll51-btn ll51-btn-rose text-xs">📄 Xuất PDF Bảng Từ Vựng &amp; Ngữ Pháp</button>
        </div>

        <div class="space-y-3">
          ${LL.GRAMMAR_MATRIX.map((g) => `
            <div class="ll51-card space-y-2">
              <div class="text-sm font-black text-sky-300 border-b border-slate-700/80 pb-1.5">${esc(g.topic)}</div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                ${state.visibleLangs.map((code) => {
                  const l = getLangMeta(code);
                  const row = g[code] || {};
                  const speakClean = String(row.ex || '').replace(/\(.*?\)/g, '').trim();
                  return `
                    <div class="p-3 rounded-xl border ${code === state.nativeLang ? 'border-emerald-500/50 bg-emerald-950/25' : 'border-slate-700 bg-slate-900/70'} space-y-1">
                      <div class="flex items-center justify-between gap-1">
                        <span class="text-xs font-black text-amber-300">${l.flag} ${esc(l.name)}</span>
                        <button type="button" data-ll51-speak-lang="${code}" data-ll51-speak-text="${esc(speakClean)}" class="text-xs px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-600 cursor-pointer border-0">🔊</button>
                      </div>
                      <div class="text-xs font-extrabold text-white">${esc(row.pattern || '')}</div>
                      <div class="text-xs text-slate-300 leading-relaxed">VD: ${esc(row.ex || '')}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // RENDER TAB 3: TẠO & HỌC FLASHCARD 6 CHẾ ĐỘ (CHỈ TẠO KHI BẤM · LƯU NỘI BỘ)
  // ==========================================================================
  function renderFlashcardsTabHtml() {
    const activeDeck = state.decks.find((d) => d.id === state.activeDeckId) || null;
    const targetOptions = state.targetLangs.map((c) => {
      const l = getLangMeta(c);
      return `<option value="${c}">${l.flag} ${esc(l.name)}</option>`;
    }).join('');

    let studyAreaHtml = '';
    if (activeDeck && activeDeck.cards?.length) {
      const idx = Math.max(0, Math.min(activeDeck.cards.length - 1, state.cardIdx));
      const card = activeDeck.cards[idx];
      const mode = state.studyMode;
      const isStar = card.vocabId && state.starredIds.has(card.vocabId);
      const mastery = state.masteryMap[card.id] || 'new';

      let cardBodyHtml = '';
      if (mode === 'quiz_4') {
        // Tạo 4 đáp án ổn định từ bộ thẻ
        const pool = activeDeck.cards.filter((c) => c.id !== card.id);
        const distractors = [];
        for (let k = 0; k < pool.length && distractors.length < 3; k++) {
          const pick = pool[(idx * 7 + k * 3) % pool.length];
          if (pick && !distractors.includes(pick.back) && pick.back !== card.back) distractors.push(pick.back);
        }
        const choices = [card.back, ...distractors].sort((a, b) => a.localeCompare(b));
        cardBodyHtml = `
          <div class="space-y-3 text-center">
            <div class="text-xs font-black text-sky-300 uppercase">${esc(card.frontLabel)}</div>
            <div class="text-2xl sm:text-3xl font-black text-white">${esc(card.front)}</div>
            ${card.frontSub ? `<div class="text-sm text-slate-400 font-mono">${esc(card.frontSub)}</div>` : ''}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 text-left">
              ${choices.map((ch) => {
                const picked = state.quizPicked === ch;
                const isRight = ch === card.back;
                let cls = 'border-slate-600 bg-slate-800/80 hover:border-sky-400';
                if (state.quizPicked) {
                  if (isRight) cls = 'border-emerald-400 bg-emerald-600/30 text-white';
                  else if (picked) cls = 'border-rose-400 bg-rose-600/30 text-white';
                }
                return `<button type="button" data-ll51-quiz-choice="${esc(ch)}" class="p-3 rounded-xl border-2 font-bold text-sm cursor-pointer transition ${cls}">${esc(ch)}</button>`;
              }).join('')}
            </div>
            <div class="text-xs font-bold text-emerald-300">Điểm trắc nghiệm: ${state.quizScore.ok} / ${state.quizScore.total}</div>
          </div>
        `;
      } else if (mode === 'active_typing') {
        cardBodyHtml = `
          <div class="space-y-3 text-center">
            <div class="text-xs font-black text-amber-300 uppercase">✍️ ĐẢO CHIỀU — GÕ LẠI TỪ NGOẠI NGỮ (${esc(card.frontLabel)})</div>
            <div class="text-2xl font-black text-white">${esc(card.back)}</div>
            <div class="flex flex-wrap gap-2 justify-center pt-2">
              <input type="text" id="ll51-typing-input" class="ll51-input w-full max-w-md text-center text-base" placeholder="Gõ đáp án ngoại ngữ rồi bấm Kiểm tra..." />
              <button type="button" id="ll51-btn-check-typing" class="ll51-btn ll51-btn-primary">✅ Kiểm tra</button>
            </div>
            ${state.typingFeedback ? `<div class="text-sm font-black ${state.typingFeedback.startsWith('✅') ? 'text-emerald-400' : 'text-amber-300'}">${esc(state.typingFeedback)}</div>` : ''}
            ${state.cardFlipped ? `<div class="p-3 rounded-xl bg-slate-800/80 text-sm">Đáp án chuẩn: <b class="text-sky-300">${esc(card.front)}</b> ${card.frontSub ? `<span class="text-slate-400">(${esc(card.frontSub)})</span>` : ''}</div>` : ''}
          </div>
        `;
      } else {
        const showBack = state.cardFlipped;
        let frontMain = card.front;
        let frontSub = card.frontSub;
        if (mode === 'script') frontSub = '🔤 (Đã ẩn phiên âm — hãy thử tự đọc mặt chữ này rồi lật thẻ!)';
        if (mode === 'listening') {
          frontMain = '🎧 Bấm nút 🔊 Nghe phát âm để đoán từ!';
          frontSub = `Gợi ý độ dài: ${String(card.front || '').length} ký tự`;
        }
        const faceLang = showBack
          ? (card.backLang || state.nativeLang || 'vi')
          : (card.frontLang || card.targetLang || (String(card.bcp47 || '').split('-')[0] === 'zh' ? card.bcp47 : String(card.bcp47 || '').split('-')[0]) || 'en');
        cardBodyHtml = `
          <div id="ll51-card-flip-area" class="text-center space-y-3 cursor-pointer select-none py-4">
            <div class="text-xs font-semibold uppercase tracking-wide ${showBack ? 'text-emerald-300' : 'text-sky-300'}">${esc(showBack ? card.backLabel : card.frontLabel)}</div>
            <div lang="${esc(faceLang)}" class="ll51-fc-main text-2xl sm:text-3xl font-bold text-white leading-snug">${esc(showBack ? card.back : frontMain)}</div>
            <div class="text-sm text-slate-300 font-mono">${esc(showBack ? (mode === 'listening' ? `${card.front} — ${card.frontSub}` : card.backSub) : frontSub)}</div>
            <div class="text-xs text-slate-400 pt-2">Bấm vào thẻ hoặc nút "Lật thẻ" để xem ${showBack ? 'Mặt trước' : 'Đáp án Mặt sau'}</div>
          </div>
        `;
      }

      studyAreaHtml = `
        <div class="ll51-card space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-sm font-black text-white">🃏 Đang học bộ: ${esc(activeDeck.title)} (${idx + 1} / ${activeDeck.cards.length})</div>
              <div class="text-xs text-slate-400">Trạng thái thẻ: <b>${mastery === 'mastered' ? '🟢 Đã thuộc' : mastery === 'learning' ? '🟡 Đang nhớ' : '🔴 Chưa thuộc'}</b></div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <select id="ll51-study-mode-sel" class="ll51-select text-xs">
                ${FLASHCARD_MODES.map((m) => `<option value="${m.id}" ${m.id === state.studyMode ? 'selected' : ''}>${m.icon} ${esc(m.label)}</option>`).join('')}
              </select>
              ${card.vocabId ? `<button type="button" id="ll51-btn-card-star" class="ll51-btn text-xs">${isStar ? '⭐ Đã gắn sao' : '☆ Gắn sao'}</button>` : ''}
            </div>
          </div>

          <div class="ll51-flashcard-stage">
            ${cardBodyHtml}
            <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-700/80">
              <div class="flex flex-wrap gap-2">
                <button type="button" id="ll51-btn-prev-card" class="ll51-btn text-xs"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg><span>Thẻ trước</span></button>
                <button type="button" id="ll51-btn-speak-card" class="ll51-btn ll51-btn-violet text-xs"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg><span>Nghe phát âm</span></button>
                <button type="button" id="ll51-btn-flip-card" class="ll51-btn ll51-btn-primary text-xs"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg><span>Lật thẻ</span></button>
                <button type="button" id="ll51-btn-next-card" class="ll51-btn text-xs"><span>Thẻ sau</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg></button>
              </div>
              <div class="flex flex-wrap gap-1">
                <button type="button" data-ll51-rate="hard" class="ll51-btn text-xs py-1 px-2.5 border-rose-500/60">🔴 Chưa thuộc</button>
                <button type="button" data-ll51-rate="learning" class="ll51-btn text-xs py-1 px-2.5 border-amber-500/60">🟡 Đang nhớ</button>
                <button type="button" data-ll51-rate="mastered" class="ll51-btn text-xs py-1 px-2.5 border-emerald-500/60">🟢 Đã thuộc</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        <!-- Khung Tạo Bộ Flashcard Mới (CHỈ TẠO KHI BẤM) -->
        <div class="ll51-card space-y-3 border-violet-500/45">
          <div class="text-sm font-black text-violet-300">✨ Tạo Bộ Flashcard Mới (Chỉ tạo khi bạn bấm · Lưu nội bộ trên máy)</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <input type="text" id="ll51-new-deck-title" class="ll51-input" placeholder="Tên bộ thẻ (VD: Từ vựng Nhật hôm nay)" />
            <select id="ll51-new-deck-source" class="ll51-select">
              <option value="selected">✅ Từ đã tích chọn trong bảng (${state.selectedIds.size} từ)</option>
              <option value="starred">⭐ Chỉ những từ có dấu Sao yêu thích (${state.starredIds.size} từ)</option>
              <option value="all">📚 Toàn bộ từ vựng bảng (${state.vocabList.length} từ)</option>
              <option value="grammar">📐 10 Cấu trúc Ngữ pháp cốt lõi</option>
            </select>
            <select id="ll51-new-deck-lang" class="ll51-select">${targetOptions}</select>
            <select id="ll51-new-deck-mode" class="ll51-select">
              ${FLASHCARD_MODES.map((m) => `<option value="${m.id}">${m.icon} ${esc(m.label)}</option>`).join('')}
            </select>
          </div>
          <button type="button" id="ll51-btn-create-deck" class="ll51-btn ll51-btn-violet px-5 py-2.5">
            ✨ Tạo &amp; Lưu Bộ Flashcard ngay
          </button>
        </div>

        <!-- Danh sách các Bộ Flashcard đã lưu nội bộ -->
        <div class="ll51-card space-y-2.5">
          <div class="text-xs font-black text-sky-300 uppercase">🗂️ Kho Bộ Flashcard đã tạo của bạn (${state.decks.length} bộ lưu nội bộ)</div>
          ${state.decks.length ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              ${state.decks.map((d) => `
                <div class="p-3 rounded-xl border ${d.id === state.activeDeckId ? 'border-emerald-400 bg-emerald-950/30' : 'border-slate-700 bg-slate-900/75'} flex flex-col justify-between gap-2">
                  <div>
                    <div class="text-sm font-black text-white">${esc(d.title)}</div>
                    <div class="text-xs text-slate-400">${d.cards?.length || 0} thẻ · Tạo lúc ${esc(d.createdLabel || '')}</div>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <button type="button" data-ll51-open-deck="${d.id}" class="ll51-btn ll51-btn-primary text-xs py-1 flex-1">▶️ Học ngay</button>
                    ${(d.cards?.length || 0) <= 300 && state.vocabList.length > 500 && (d.defaultMode || 'meaning') !== 'grammar'
                      ? `<button type="button" data-ll51-upgrade-deck="${d.id}" class="ll51-btn ll51-btn-amber text-xs py-1">♻️ Nâng cấp FULL ${state.vocabList.length}</button>`
                      : ''}
                    <button type="button" data-ll51-del-deck="${d.id}" class="ll51-btn text-xs py-1 border-rose-500/50 text-rose-300">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<div class="text-xs text-slate-400">Chưa có bộ Flashcard nào — hãy bấm nút tím "✨ Tạo & Lưu Bộ Flashcard ngay" ở trên khi bạn muốn tạo nhé (không tự tạo sẵn để tiết kiệm RAM!).</div>'}
        </div>

        ${studyAreaHtml}
      </div>
    `;
  }

  // ==========================================================================
  // RENDER TAB 4: XUẤT PDF & TẢI FLASHCARD (PDF IN CẮT / ANKI TSV / HTML OFFLINE)
  // ==========================================================================
  function renderExportTabHtml() {
    const activeDeck = state.decks.find((d) => d.id === state.activeDeckId) || null;
    const useActiveDeckByDefault = Boolean(activeDeck && activeDeck.cards?.length && activeDeck.cards.length >= state.vocabList.length);
    const useQuickSelectedDefault = !useActiveDeckByDefault && state.selectedIds.size > 0 && state.selectedIds.size < state.vocabList.length;
    const useAllVocabDefault = !useActiveDeckByDefault && !useQuickSelectedDefault;
    const primaryTgt = state.targetLangs[0] || 'en';
    const primaryMeta = getLangMeta(primaryTgt);
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="ll51-card space-y-3 border-rose-500/45">
          <div class="text-base font-black text-rose-300">📄 1. Xuất Sổ Tay Học Ngoại Ngữ ra PDF thuần</div>
          <p class="text-xs text-slate-300 leading-relaxed">
            Xuất toàn bộ <b>${state.selectedIds.size} từ vựng đã tích chọn</b> (mặc định là tất cả bảng) kèm <b>phiên âm đầy đủ</b> cho ${state.visibleLangs.length} ngôn ngữ đang hiển thị + <b>10 bảng Ngữ pháp đối chiếu</b> — sắc nét đầy đủ chữ Việt, Anh, Hán tự, Hàn, Nhật (0 lỗi ô vuông!).
          </p>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="ll51-exp-pdf-full" class="ll51-btn ll51-btn-rose flex-1 py-2.5">📄 Tải PDF Từ Vựng + Ngữ Pháp (${state.selectedIds.size} từ)</button>
            <button type="button" id="ll51-exp-pdf-star" class="ll51-btn ll51-btn-amber py-2.5">⭐ Tải PDF chỉ từ có Sao (${state.starredIds.size})</button>
          </div>
        </div>

        <div class="ll51-card space-y-3 border-sky-500/45">
          <div class="text-base font-black text-sky-300">🃏 2. Tải Bộ Flashcard về máy (3 Định dạng Tối ưu nhất)</div>
          <p class="text-xs text-slate-300 leading-relaxed">
            Quét &amp; xuất trọn vẹn <b>${state.vocabList.length} từ vựng</b> (hoặc bộ đã tích chọn <b>${state.selectedIds.size} từ</b>) sang .PDF, .TSV &amp; .HTML tương tác Offline:
          </p>
          <select id="ll51-export-deck-sel" class="ll51-select w-full">
            <option value="__starred_vocab__" ${state.starredIds.size > 0 && !useActiveDeckByDefault && !useQuickSelectedDefault ? '' : ''}>⭐ CHỈ XUẤT CÁC THẺ CÓ DẤU SAO YÊU THÍCH (${state.starredIds.size} từ — ${esc(primaryMeta.name)})</option>
            <option value="__all_vocab__" ${useAllVocabDefault ? 'selected' : ''}>🌍 QUÉT FULL TOÀN BỘ TỪ VỰNG WEB (${state.vocabList.length} từ — ${esc(primaryMeta.name)})</option>
            <option value="__quick_selected__" ${useQuickSelectedDefault ? 'selected' : ''}>⚡ Xuất toàn bộ từ đang tích chọn (${state.selectedIds.size}/${state.vocabList.length} từ — ${esc(primaryMeta.name)})</option>
            ${state.decks.map((d) => {
              const cnt = d.cards?.length || 0;
              const isLegacyShort = cnt > 0 && cnt <= 300 && state.vocabList.length > 500 && (d.defaultMode || 'meaning') !== 'grammar';
              return `<option value="${d.id}" ${useActiveDeckByDefault && activeDeck?.id === d.id ? 'selected' : ''}>🃏 ${esc(d.title)} (${cnt} thẻ${isLegacyShort ? ' · Bản cũ rút gọn' : ''})</option>`;
            }).join('')}
          </select>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" id="ll51-btn-pick-starred-export" class="ll51-btn ll51-btn-amber text-xs py-1.5 px-3">⭐ Chọn nhanh: Chỉ xuất ${state.starredIds.size} thẻ có dấu sao</button>
            <span class="text-[11px] text-slate-400">Không cần xuất toàn bộ ${state.vocabList.length} thẻ nếu bạn chỉ muốn ôn các từ đã gắn sao ★!</span>
          </div>
          <div class="space-y-2 pt-1">
            <button type="button" id="ll51-exp-fc-pdf" class="ll51-btn ll51-btn-primary w-full py-2.5">🖨️ Tải .PDF Thẻ Flashcard In Cắt 2 Mặt (A4 khớp gương)</button>
            <button type="button" id="ll51-exp-fc-tsv" class="ll51-btn ll51-btn-violet w-full py-2.5">🗂️ Tải .TSV Chuẩn Anki &amp; Quizlet (Nhập 1 chạm)</button>
            <button type="button" id="ll51-exp-fc-html" class="ll51-btn w-full py-2.5 border-emerald-500/60">🌐 Tải .HTML Bộ Flashcard Tương Tác Offline (Lật thẻ + Nghe 🔊)</button>
          </div>
        </div>
      </div>
    `;
  }

  async function resolveDeckForExportAsync(onProgress) {
    const selVal = state.modalEl?.querySelector('#ll51-export-deck-sel')?.value || '__all_vocab__';
    const tgt = state.targetLangs[0] || 'en';
    if (selVal === '__starred_vocab__') {
      if (!state.starredIds.size) {
        toast('⚠️ Bạn chưa gắn dấu sao ⭐ từ nào! Hãy gắn sao các từ muốn ôn ở Tab 1 hoặc khi học Flashcard.', 'warning', 3200);
        return { title: 'Flashcard Sao', cards: [] };
      }
      return {
        title: `Flashcard Có Sao (${state.starredIds.size} từ · ${getLangMeta(tgt).name})`,
        cards: await buildDeckCardsAsync({ sourceMode: 'starred', targetLang: tgt, modeId: 'meaning', onProgress }),
      };
    }
    if (selVal === '__all_vocab__') {
      return {
        title: `Flashcard Full ${state.vocabList.length} Từ (${getLangMeta(tgt).name})`,
        cards: await buildDeckCardsAsync({ sourceMode: 'all', targetLang: tgt, modeId: 'meaning', onProgress }),
      };
    }
    if (selVal === '__quick_selected__') {
      return {
        title: `Flashcard (${state.selectedIds.size} từ · ${getLangMeta(tgt).name})`,
        cards: await buildDeckCardsAsync({ sourceMode: 'selected', targetLang: tgt, modeId: 'meaning', onProgress }),
      };
    }
    const found = state.decks.find((d) => d.id === selVal);
    if (found) return found;
    return {
      title: `Flashcard Full ${state.vocabList.length} Từ (${getLangMeta(tgt).name})`,
      cards: await buildDeckCardsAsync({ sourceMode: 'all', targetLang: tgt, modeId: 'meaning', onProgress }),
    };
  }

  function resolveDeckForExport() {
    const selVal = state.modalEl?.querySelector('#ll51-export-deck-sel')?.value || '__all_vocab__';
    const tgt = state.targetLangs[0] || 'en';
    if (selVal === '__starred_vocab__') {
      if (!state.starredIds.size) {
        toast('⚠️ Bạn chưa gắn dấu sao ⭐ từ nào!', 'warning', 2800);
        return { title: 'Flashcard Sao', cards: [] };
      }
      return {
        title: `Flashcard Có Sao (${state.starredIds.size} từ · ${getLangMeta(tgt).name})`,
        cards: buildDeckCards({ sourceMode: 'starred', targetLang: tgt, modeId: 'meaning' }),
      };
    }
    if (selVal === '__all_vocab__') {
      return {
        title: `Flashcard Full ${state.vocabList.length} Từ (${getLangMeta(tgt).name})`,
        cards: buildDeckCards({ sourceMode: 'all', targetLang: tgt, modeId: 'meaning' }),
      };
    }
    if (selVal === '__quick_selected__') {
      return {
        title: `Flashcard (${getLangMeta(tgt).name})`,
        cards: buildDeckCards({ sourceMode: 'selected', targetLang: tgt, modeId: 'meaning' }),
      };
    }
    const found = state.decks.find((d) => d.id === selVal);
    if (found) return found;
    return {
      title: `Flashcard Full ${state.vocabList.length} Từ (${getLangMeta(tgt).name})`,
      cards: buildDeckCards({ sourceMode: 'all', targetLang: tgt, modeId: 'meaning' }),
    };
  }

  function bindEvents() {
    const root = state.modalEl;
    if (!root) return;

    root.querySelector('#ll51-btn-close')?.addEventListener('click', () => LL.close());

    if (state.step === 'setup') {
      root.querySelectorAll('[data-ll51-native]').forEach((b) => {
        b.addEventListener('click', () => {
          state.nativeLang = b.getAttribute('data-ll51-native') || 'vi';
          state.targetLangs = state.targetLangs.filter((c) => c !== state.nativeLang);
          if (!state.targetLangs.length) {
            state.targetLangs = [state.nativeLang === 'en' ? 'vi' : 'en'];
          }
          render();
        });
      });
      root.querySelectorAll('[data-ll51-target]').forEach((b) => {
        b.addEventListener('click', () => {
          const code = b.getAttribute('data-ll51-target');
          if (!code || code === state.nativeLang) return;
          if (state.targetLangs.includes(code)) {
            if (state.targetLangs.length <= 1) {
              toast('⚠️ Hãy chọn ít nhất 1 ngôn ngữ muốn học!', 'warning', 2500);
              return;
            }
            state.targetLangs = state.targetLangs.filter((c) => c !== code);
          } else {
            state.targetLangs.push(code);
          }
          render();
        });
      });
      root.querySelector('#ll51-btn-pick-all-5')?.addEventListener('click', () => {
        state.targetLangs = LL.LANGUAGES.map((l) => l.code).filter((c) => c !== state.nativeLang);
        render();
      });
      root.querySelector('#ll51-btn-start-studio')?.addEventListener('click', () => {
        state.visibleLangs = [state.nativeLang, ...state.targetLangs];
        state.step = 'studio';
        state.activeTab = 'vocab';
        persistState();
        render();
      });
      return;
    }

    // Studio top tabs
    root.querySelectorAll('[data-ll51-tab]').forEach((b) => {
      b.addEventListener('click', () => {
        state.activeTab = b.getAttribute('data-ll51-tab') || 'vocab';
        render();
      });
    });

    // Global speak buttons
    root.querySelectorAll('[data-ll51-speak-lang]').forEach((b) => {
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        LL.speakText(b.getAttribute('data-ll51-speak-lang'), b.getAttribute('data-ll51-speak-text'));
      });
    });

    // Tab 1 events
    root.querySelector('#ll51-btn-edit-langs')?.addEventListener('click', () => {
      state.step = 'setup';
      render();
    });
    root.querySelector('#ll51-chk-phonetics')?.addEventListener('change', (ev) => {
      state.showPhonetics = ev.target.checked;
      render();
    });
    root.querySelectorAll('[data-ll51-toggle-col]').forEach((b) => {
      b.addEventListener('click', () => {
        const code = b.getAttribute('data-ll51-toggle-col');
        if (state.visibleLangs.includes(code)) {
          if (state.visibleLangs.length <= 2) {
            toast('⚠️ Bảng đối chiếu cần giữ hiển thị tối thiểu 2 ngôn ngữ!', 'warning', 2600);
            return;
          }
          state.visibleLangs = state.visibleLangs.filter((c) => c !== code);
        } else {
          state.visibleLangs.push(code);
        }
        persistState();
        render();
      });
    });
    root.querySelector('#ll51-search')?.addEventListener('input', (ev) => {
      state.searchQuery = ev.target.value || '';
      render();
      const inp = state.modalEl?.querySelector('#ll51-search');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    });
    root.querySelector('#ll51-topic-sel')?.addEventListener('change', (ev) => {
      state.topicFilter = ev.target.value || 'all';
      render();
    });
    root.querySelector('#ll51-btn-filter-star')?.addEventListener('click', () => {
      state.showOnlyStarred = !state.showOnlyStarred;
      render();
    });
    root.querySelector('#ll51-btn-sel-all')?.addEventListener('click', () => {
      state.selectedIds = new Set(state.vocabList.map((v) => v.id));
      render();
    });
    root.querySelector('#ll51-btn-sel-none')?.addEventListener('click', () => {
      state.selectedIds.clear();
      render();
    });
    root.querySelector('#ll51-btn-sel-stars')?.addEventListener('click', () => {
      if (!state.starredIds.size) {
        toast('ℹ️ Bạn chưa gắn dấu ⭐ cho từ nào!', 'info', 2500);
        return;
      }
      state.selectedIds = new Set(state.starredIds);
      render();
    });
    root.querySelectorAll('[data-ll51-sel-id]').forEach((chk) => {
      chk.addEventListener('change', () => {
        const id = chk.getAttribute('data-ll51-sel-id');
        if (chk.checked) state.selectedIds.add(id);
        else state.selectedIds.delete(id);
        // Cập nhật đếm trực tiếp TẠI CHỖ (KHÔNG render lại toàn trang để giữ nguyên 100% vị trí cuộn!)
        const badge = root.querySelector('#ll51-selected-count-badge');
        if (badge) badge.textContent = `✅ Đã chọn: ${state.selectedIds.size}/${state.vocabList.length}`;
      });
    });
    root.querySelectorAll('[data-ll51-star-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ll51-star-id');
        const nowStar = !state.starredIds.has(id);
        if (nowStar) state.starredIds.add(id);
        else state.starredIds.delete(id);
        persistState();
        // Cập nhật dấu sao TẠI CHỖ (KHÔNG nhảy lên đầu trang!)
        btn.textContent = nowStar ? '⭐' : '☆';
        const fStarBtn = root.querySelector('#ll51-btn-filter-star');
        if (fStarBtn) fStarBtn.textContent = `⭐ Chỉ hiện từ yêu thích (${state.starredIds.size})`;
        if (state.showOnlyStarred && !nowStar) {
          btn.closest('tr')?.remove();
        }
      });
    });

    // Tab 2 export shortcut
    root.querySelector('#ll51-btn-export-grammar-pdf')?.addEventListener('click', async () => {
      const items = state.vocabList.filter((v) => state.selectedIds.has(v.id));
      toast('⏳ Đang dựng Sổ tay PDF Từ vựng & Ngữ pháp...', 'info', 2200);
      await LL.exportVocabAndGrammarPdf({ vocabItems: items.length ? items : state.vocabList.slice(0, 60), visibleLangs: state.visibleLangs, nativeLang: state.nativeLang, includeGrammar: true });
      toast('✅ Đã tải xuống Sổ tay PDF Từ vựng & Ngữ pháp!', 'success', 3200);
    });

    // Tab 3 Flashcard creation & player (Sinh bất đồng bộ theo mẫu — 0 đơ màn hình)
    root.querySelector('#ll51-btn-create-deck')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      const oldTxt = btn.textContent;
      btn.disabled = true;
      const titleInp = root.querySelector('#ll51-new-deck-title')?.value?.trim();
      const sourceMode = root.querySelector('#ll51-new-deck-source')?.value || 'selected';
      const targetLang = root.querySelector('#ll51-new-deck-lang')?.value || state.targetLangs[0] || 'en';
      const modeId = root.querySelector('#ll51-new-deck-mode')?.value || 'meaning';
      try {
        await LL.ensurePinyinPro?.();
        const cards = await buildDeckCardsAsync({
          sourceMode,
          targetLang,
          modeId,
          onProgress: (done, tot) => { btn.textContent = `⏳ Đang sinh từ mẫu... ${done}/${tot} thẻ`; },
        });
        const deck = {
          id: `deck_${Date.now()}`,
          title: titleInp || `Flashcard ${getLangMeta(targetLang).name} (${cards.length} thẻ)`,
          targetLang,
          defaultMode: modeId,
          sourceMode,
          createdLabel: new Date().toLocaleDateString('vi-VN'),
          cards,
        };
        state.decks.unshift(deck);
        state.activeDeckId = deck.id;
        state.studyMode = modeId;
        state.cardIdx = 0;
        state.cardFlipped = false;
        state.quizPicked = '';
        state.typingFeedback = '';
        persistState();
        toast(`✅ Đã tạo và lưu nội bộ "${deck.title}" (${cards.length} thẻ)!`, 'success', 3200);
        render();
      } finally {
        btn.disabled = false;
        btn.textContent = oldTxt;
      }
    });

    root.querySelectorAll('[data-ll51-upgrade-deck]').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-ll51-upgrade-deck');
        const deck = state.decks.find((d) => d.id === id);
        if (!deck) return;
        const oldTxt = b.textContent;
        b.disabled = true;
        try {
          await LL.ensurePinyinPro?.();
          const tgt = deck.targetLang || state.targetLangs[0] || 'en';
          const modeId = deck.defaultMode || 'meaning';
          const cards = await buildDeckCardsAsync({
            sourceMode: 'all',
            targetLang: tgt,
            modeId,
            onProgress: (done, tot) => { b.textContent = `⏳ ${done}/${tot}`; },
          });
          deck.cards = cards;
          deck.sourceMode = 'all';
          deck.title = deck.title.replace(/\(\d+\s*thẻ\)/i, `(${cards.length} thẻ)`);
          state.activeDeckId = deck.id;
          state.cardIdx = 0;
          persistState();
          toast(`✅ Đã nâng cấp bộ thẻ lên FULL ${cards.length} thẻ!`, 'success', 3200);
          render();
        } finally {
          b.disabled = false;
          b.textContent = oldTxt;
        }
      });
    });

    root.querySelectorAll('[data-ll51-open-deck]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-ll51-open-deck');
        const deck = state.decks.find((d) => d.id === id);
        if (!deck) return;
        state.activeDeckId = deck.id;
        state.studyMode = deck.defaultMode || 'meaning';
        state.cardIdx = 0;
        state.cardFlipped = false;
        state.quizPicked = '';
        state.typingFeedback = '';
        render();
      });
    });
    root.querySelectorAll('[data-ll51-del-deck]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-ll51-del-deck');
        state.decks = state.decks.filter((d) => d.id !== id);
        if (state.activeDeckId === id) state.activeDeckId = '';
        persistState();
        render();
      });
    });

    root.querySelector('#ll51-study-mode-sel')?.addEventListener('change', (ev) => {
      state.studyMode = ev.target.value || 'meaning';
      state.cardFlipped = false;
      state.quizPicked = '';
      state.typingFeedback = '';
      render();
    });
    const flipAction = () => { state.cardFlipped = !state.cardFlipped; render(); };
    root.querySelector('#ll51-card-flip-area')?.addEventListener('click', flipAction);
    root.querySelector('#ll51-btn-flip-card')?.addEventListener('click', flipAction);
    root.querySelector('#ll51-btn-prev-card')?.addEventListener('click', () => {
      const deck = state.decks.find((d) => d.id === state.activeDeckId);
      if (!deck?.cards?.length) return;
      state.cardIdx = (state.cardIdx - 1 + deck.cards.length) % deck.cards.length;
      state.cardFlipped = false; state.quizPicked = ''; state.typingFeedback = '';
      render();
    });
    root.querySelector('#ll51-btn-next-card')?.addEventListener('click', () => {
      const deck = state.decks.find((d) => d.id === state.activeDeckId);
      if (!deck?.cards?.length) return;
      state.cardIdx = (state.cardIdx + 1) % deck.cards.length;
      state.cardFlipped = false; state.quizPicked = ''; state.typingFeedback = '';
      render();
    });
    root.querySelector('#ll51-btn-speak-card')?.addEventListener('click', () => {
      const deck = state.decks.find((d) => d.id === state.activeDeckId);
      const card = deck?.cards?.[state.cardIdx];
      if (card) LL.speakText(card.targetLang, card.speakText || card.front);
    });
    root.querySelector('#ll51-btn-card-star')?.addEventListener('click', () => {
      const deck = state.decks.find((d) => d.id === state.activeDeckId);
      const card = deck?.cards?.[state.cardIdx];
      if (!card?.vocabId) return;
      if (state.starredIds.has(card.vocabId)) state.starredIds.delete(card.vocabId);
      else state.starredIds.add(card.vocabId);
      persistState();
      render();
    });
    root.querySelectorAll('[data-ll51-rate]').forEach((b) => {
      b.addEventListener('click', () => {
        const deck = state.decks.find((d) => d.id === state.activeDeckId);
        const card = deck?.cards?.[state.cardIdx];
        if (!card) return;
        state.masteryMap[card.id] = b.getAttribute('data-ll51-rate');
        persistState();
        state.cardIdx = (state.cardIdx + 1) % deck.cards.length;
        state.cardFlipped = false; state.quizPicked = ''; state.typingFeedback = '';
        render();
      });
    });
    root.querySelectorAll('[data-ll51-quiz-choice]').forEach((b) => {
      b.addEventListener('click', () => {
        if (state.quizPicked) return;
        const deck = state.decks.find((d) => d.id === state.activeDeckId);
        const card = deck?.cards?.[state.cardIdx];
        if (!card) return;
        const val = b.getAttribute('data-ll51-quiz-choice') || '';
        state.quizPicked = val;
        state.quizScore.total += 1;
        if (val === card.back) state.quizScore.ok += 1;
        render();
      });
    });
    root.querySelector('#ll51-btn-check-typing')?.addEventListener('click', () => {
      const deck = state.decks.find((d) => d.id === state.activeDeckId);
      const card = deck?.cards?.[state.cardIdx];
      const typed = (root.querySelector('#ll51-typing-input')?.value || '').trim().toLowerCase();
      if (!card) return;
      const expected = String(card.front || '').trim().toLowerCase();
      if (typed && (typed === expected || expected.includes(typed))) {
        state.typingFeedback = `✅ Chính xác! "${card.front}"`;
      } else {
        state.typingFeedback = `❌ Chưa khớp — Đáp án đúng là: "${card.front}"`;
      }
      state.cardFlipped = true;
      render();
    });

    // Tab 4 Export buttons (Xuất FULL hoặc CHỈ THẺ CÓ DẤU SAO ★!)
    root.querySelector('#ll51-btn-pick-starred-export')?.addEventListener('click', () => {
      const sel = root.querySelector('#ll51-export-deck-sel');
      if (!state.starredIds.size) {
        toast('⚠️ Bạn chưa gắn dấu sao ⭐ từ nào! Hãy gắn sao các từ muốn ôn ở Tab 1 hoặc khi học Flashcard.', 'warning', 3200);
        return;
      }
      if (sel) sel.value = '__starred_vocab__';
      toast(`⭐ Đã chọn xuất riêng ${state.starredIds.size} thẻ có dấu sao! Bấm PDF, TSV Anki hoặc HTML bên dưới để tải ngay.`, 'success', 3400);
    });
    root.querySelector('#ll51-exp-pdf-full')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      const items = state.vocabList.filter((v) => state.selectedIds.has(v.id));
      if (!items.length) return toast('⚠️ Chưa có từ nào được tích chọn!', 'warning', 2500);
      const oldTxt = btn.textContent;
      btn.disabled = true;
      toast(`⏳ Đang xuất FULL ${items.length} từ vựng + Ngữ pháp ra PDF...`, 'info', 3000);
      try {
        const r = await LL.exportVocabAndGrammarPdf({
          vocabItems: items,
          visibleLangs: state.visibleLangs,
          nativeLang: state.nativeLang,
          includeGrammar: true,
          onProgress: (done, tot) => {
            btn.textContent = `⏳ Đang xuất PDF... ${done}/${tot} từ`;
          },
        });
        toast(`✅ Đã tải PDF FULL ${items.length} từ vựng (${r.pages} trang)!`, 'success', 4000);
      } finally {
        btn.disabled = false;
        btn.textContent = oldTxt;
      }
    });
    root.querySelector('#ll51-exp-pdf-star')?.addEventListener('click', async () => {
      const items = state.vocabList.filter((v) => state.starredIds.has(v.id));
      if (!items.length) return toast('⚠️ Bạn chưa gắn ⭐ cho từ nào!', 'warning', 2500);
      toast('⏳ Đang xuất PDF các từ gắn ⭐ yêu thích...', 'info', 2200);
      const r = await LL.exportVocabAndGrammarPdf({ vocabItems: items, visibleLangs: state.visibleLangs, nativeLang: state.nativeLang, includeGrammar: true });
      toast(`✅ Đã tải PDF ${items.length} từ yêu thích (${r.pages} trang)!`, 'success', 3500);
    });
    root.querySelector('#ll51-exp-fc-pdf')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      const oldTxt = btn.textContent;
      btn.disabled = true;
      try {
        await LL.ensurePinyinPro?.();
        const deck = await resolveDeckForExportAsync((done, tot) => {
          btn.textContent = `⏳ Đang sinh từ mẫu... ${done}/${tot} thẻ`;
        });
        toast(`⏳ Đang dựng PDF Flashcard FULL ${deck.cards.length} thẻ in cắt 2 mặt A4...`, 'info', 2800);
        const r = await LL.exportFlashcardsPdf(deck, {
          onProgress: (done, tot) => {
            btn.textContent = `⏳ Đang dựng PDF Flashcard... ${done}/${tot} thẻ`;
          },
        });
        toast(`✅ Đã tải FULL ${r.count} thẻ Flashcard PDF (${r.pages} trang A4)!`, 'success', 4000);
      } finally {
        btn.disabled = false;
        btn.textContent = oldTxt;
      }
    });
    root.querySelector('#ll51-exp-fc-tsv')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      const oldTxt = btn.textContent;
      btn.disabled = true;
      try {
        await LL.ensurePinyinPro?.();
        const deck = await resolveDeckForExportAsync((done, tot) => {
          btn.textContent = `⏳ Đang sinh .TSV... ${done}/${tot} thẻ`;
        });
        const r = LL.exportFlashcardsTsv(deck);
        toast(`✅ Đã tải FULL ${r.count} thẻ chuẩn Anki / Quizlet (.TSV)!`, 'success', 3400);
      } finally {
        btn.disabled = false;
        btn.textContent = oldTxt;
      }
    });
    root.querySelector('#ll51-exp-fc-html')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      const oldTxt = btn.textContent;
      btn.disabled = true;
      try {
        await LL.ensurePinyinPro?.();
        const deck = await resolveDeckForExportAsync((done, tot) => {
          btn.textContent = `⏳ Đang sinh .HTML... ${done}/${tot} thẻ`;
        });
        const r = LL.exportFlashcardsInteractiveHtml(deck);
        toast(`✅ Đã tải FULL Bộ Flashcard Tương Tác Offline (.HTML · ${r.count} thẻ)!`, 'success', 3600);
      } finally {
        btn.disabled = false;
        btn.textContent = oldTxt;
      }
    });
  }

  // Bản dịch giao diện nút bấm Mod 51 theo đúng Ngôn ngữ mẹ đẻ người dùng chọn (6 thứ tiếng)
  const NATIVE_UI_CHROME = Object.freeze({
    en: {
      '🎓 Học Ngoại Ngữ Qua Trang Web · 6 Languages & Flashcards Studio': '🎓 Learn Languages From This Website · 6 Languages & Flashcards Studio',
      'Từ vựng thật từ giao diện web · Phiên âm & Giọng đọc 6 thứ tiếng · Ngữ pháp đối chiếu · Xuất PDF & Flashcard': 'Real vocabulary from this web UI · 6-language phonetics & audio · Comparative grammar · PDF & Flashcard export',
      '✕ Đóng': '✕ Close',
      'Bảng Từ Vựng': 'Vocabulary Table',
      'Bảng Ngữ Pháp (10 Cấu trúc)': 'Grammar Matrix (10 Structures)',
      'Flashcard 6 Chế Độ': '6-Mode Flashcards',
      'Xuất PDF & Tải Flashcard': 'Export PDF & Flashcards',
      'Ẩn / Hiện cột ngôn ngữ (luôn giữ tối thiểu 2 ngôn ngữ để đối chiếu):': 'Show / Hide language columns (keep at least 2 languages):',
      'Hiện phiên âm 6 ngôn ngữ': 'Show phonetics (6 languages)',
      'Đổi ngôn ngữ mẹ đẻ / mục tiêu': 'Change Native / Target Languages',
      'Tìm từ vựng bằng bất kỳ ngôn ngữ nào...': 'Search vocabulary in any language...',
      'Tất cả chủ đề': 'All Topics',
      'Chỉ hiện từ yêu thích': 'Starred Only',
      'Đã chọn:': 'Selected:',
      'Chọn hết': 'Select All',
      'Bỏ chọn': 'Deselect All',
      'Chọn theo Sao': 'Select Starred',
      'Chọn': 'Select',
      'Mẹ đẻ': 'Native',
      'bộ': 'decks',
      'Tạo Bộ Flashcard Mới': 'Create New Flashcard Deck',
      'Xuất PDF Sổ Tay Từ Vựng & Ngữ Pháp': 'Export Vocab & Grammar PDF',
      'Tải Bộ Flashcard Tương Tác Offline (.HTML)': 'Download Offline Interactive Flashcards (.HTML)',
    },
    ja: {
      '🎓 Học Ngoại Ngữ Qua Trang Web · 6 Languages & Flashcards Studio': '🎓 ウェブサイトで語学学習 · 6言語＆単語帳スタジオ',
      'Từ vựng thật từ giao diện web · Phiên âm & Giọng đọc 6 thứ tiếng · Ngữ pháp đối chiếu · Xuất PDF & Flashcard': '実サイトの語彙 · 6言語発音記号＆音声 · 対照文法 · PDF＆単語帳出力',
      '✕ Đóng': '✕ 閉じる',
      'Bảng Từ Vựng': '単語リスト',
      'Bảng Ngữ Pháp (10 Cấu trúc)': '文法対照表 (10構造)',
      'Flashcard 6 Chế Độ': '6モード単語帳',
      'Xuất PDF & Tải Flashcard': 'PDF出力＆単語帳保存',
      'Ẩn / Hiện cột ngôn ngữ (luôn giữ tối thiểu 2 ngôn ngữ để đối chiếu):': '言語列の表示 / 非表示（最低2言語を維持）：',
      'Hiện phiên âm 6 ngôn ngữ': '6言語の発音表記を表示',
      'Đổi ngôn ngữ mẹ đẻ / mục tiêu': '母語・学習言語を変更',
      'Tìm từ vựng bằng bất kỳ ngôn ngữ nào...': 'どの言語でも単語を検索...',
      'Tất cả chủ đề': 'すべてのトピック',
      'Chỉ hiện từ yêu thích': 'お気に入りのみ',
      'Đã chọn:': '選択中:',
      'Chọn hết': 'すべて選択',
      'Bỏ chọn': '選択解除',
      'Chọn theo Sao': '星付きを選択',
      'Chọn': '選択',
      'Mẹ đẻ': '母語',
      'bộ': 'セット',
    },
    ko: {
      '🎓 Học Ngoại Ngữ Qua Trang Web · 6 Languages & Flashcards Studio': '🎓 웹사이트로 외국어 학습 · 6개 언어 & 플래시카드 스튜디오',
      'Từ vựng thật từ giao diện web · Phiên âm & Giọng đọc 6 thứ tiếng · Ngữ pháp đối chiếu · Xuất PDF & Flashcard': '실제 웹 어휘 · 6개 언어 발음 & 음성 · 대조 문법 · PDF & 플래시카드 내보내기',
      '✕ Đóng': '✕ 닫기',
      'Bảng Từ Vựng': '어휘 표',
      'Bảng Ngữ Pháp (10 Cấu trúc)': '문법 대조표 (10구조)',
      'Flashcard 6 Chế Độ': '6모드 플래시카드',
      'Xuất PDF & Tải Flashcard': 'PDF & 플래시카드 내보내기',
      'Ẩn / Hiện cột ngôn ngữ (luôn giữ tối thiểu 2 ngôn ngữ để đối chiếu):': '언어 열 표시 / 숨기기 (최소 2개 언어 유지):',
      'Hiện phiên âm 6 ngôn ngữ': '6개 언어 발음 표기 보기',
      'Đổi ngôn ngữ mẹ đẻ / mục tiêu': '모국어 / 학습 언어 변경',
      'Tìm từ vựng bằng bất kỳ ngôn ngữ nào...': '모든 언어로 어휘 검색...',
      'Tất cả chủ đề': '모든 주제',
      'Chỉ hiện từ yêu thích': '즐겨찾기만 보기',
      'Đã chọn:': '선택됨:',
      'Chọn hết': '모두 선택',
      'Bỏ chọn': '선택 해제',
      'Chọn theo Sao': '별표만 선택',
      'Chọn': '선택',
      'Mẹ đẻ': '모국어',
      'bộ': '세트',
    },
    zh_cn: {
      '🎓 Học Ngoại Ngữ Qua Trang Web · 6 Languages & Flashcards Studio': '🎓 通过网站学外语 · 6语言与闪卡工作室',
      'Từ vựng thật từ giao diện web · Phiên âm & Giọng đọc 6 thứ tiếng · Ngữ pháp đối chiếu · Xuất PDF & Flashcard': '真实网页词汇 · 6语种音标与朗读 · 语法对照 · 导出PDF与闪卡',
      '✕ Đóng': '✕ 关闭',
      'Bảng Từ Vựng': '词汇表',
      'Bảng Ngữ Pháp (10 Cấu trúc)': '语法对照表 (10项)',
      'Flashcard 6 Chế Độ': '6模式闪卡',
      'Xuất PDF & Tải Flashcard': '导出PDF与闪卡',
      'Ẩn / Hiện cột ngôn ngữ (luôn giữ tối thiểu 2 ngôn ngữ để đối chiếu):': '显示/隐藏语言列（至少保留2种语言对照）：',
      'Hiện phiên âm 6 ngôn ngữ': '显示6语种音标',
      'Đổi ngôn ngữ mẹ đẻ / mục tiêu': '更改母语 / 目标语言',
      'Tìm từ vựng bằng bất kỳ ngôn ngữ nào...': '输入任意语言搜索词汇...',
      'Tất cả chủ đề': '全部主题',
      'Chỉ hiện từ yêu thích': '仅看收藏',
      'Đã chọn:': '已选:',
      'Chọn hết': '全选',
      'Bỏ chọn': '取消全选',
      'Chọn theo Sao': '选择收藏项',
      'Chọn': '选择',
      'Mẹ đẻ': '母语',
      'bộ': '套',
    },
    zh_tw: {
      '🎓 Học Ngoại Ngữ Qua Trang Web · 6 Languages & Flashcards Studio': '🎓 透過網站學外語 · 6語言與閃卡工作室',
      'Từ vựng thật từ giao diện web · Phiên âm & Giọng đọc 6 thứ tiếng · Ngữ pháp đối chiếu · Xuất PDF & Flashcard': '真實網頁詞彙 · 6語種音標與朗讀 · 文法對照 · 匯出PDF與閃卡',
      '✕ Đóng': '✕ 關閉',
      'Bảng Từ Vựng': '詞彙表',
      'Bảng Ngữ Pháp (10 Cấu trúc)': '文法對照表 (10項)',
      'Flashcard 6 Chế Độ': '6模式閃卡',
      'Xuất PDF & Tải Flashcard': '匯出PDF與閃卡',
      'Ẩn / Hiện cột ngôn ngữ (luôn giữ tối thiểu 2 ngôn ngữ để đối chiếu):': '顯示/隱藏語言欄（至少保留2種語言對照）：',
      'Hiện phiên âm 6 ngôn ngữ': '顯示6語種音標',
      'Đổi ngôn ngữ mẹ đẻ / mục tiêu': '變更母語 / 目標語言',
      'Tìm từ vựng bằng bất kỳ ngôn ngữ nào...': '輸入任意語言搜尋詞彙...',
      'Tất cả chủ đề': '全部主題',
      'Chỉ hiện từ yêu thích': '僅看收藏',
      'Đã chọn:': '已選:',
      'Chọn hết': '全選',
      'Bỏ chọn': '取消全選',
      'Chọn theo Sao': '選擇收藏項',
      'Chọn': '選擇',
      'Mẹ đẻ': '母語',
      'bộ': '套',
    },
  });

  function applyNativeUiChrome(root, nativeLang) {
    if (!root || !nativeLang || nativeLang === 'vi') return;
    const dict = NATIVE_UI_CHROME[nativeLang];
    const packKey = nativeLang === 'zh_cn' ? 'zh-CN' : nativeLang === 'zh_tw' ? 'zh-TW' : nativeLang;
    const globalExact = NS.i18nPacks?.[packKey]?.exact || {};
    const translateStr = (raw) => {
      let s = String(raw || '');
      const trimmed = s.trim();
      if (!trimmed) return s;
      if (dict && dict[trimmed]) return s.replace(trimmed, dict[trimmed]);
      if (globalExact[trimmed]) return s.replace(trimmed, globalExact[trimmed]);
      if (dict) {
        for (const [k, v] of Object.entries(dict)) {
          if (s.includes(k)) s = s.split(k).join(v);
        }
      }
      return s;
    };
    // Chỉ dịch khung nút bấm & nhãn giao diện — TUYỆT ĐỐI giữ nguyên dữ liệu học trong <tbody>!
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      const parent = n.parentElement;
      if (!parent || parent.closest('tbody') || parent.closest('[data-ll51-keep-orig]')) continue;
      nodes.push(n);
    }
    for (const tn of nodes) {
      const next = translateStr(tn.nodeValue);
      if (next !== tn.nodeValue) tn.nodeValue = next;
    }
    root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {
      if (el.closest('tbody')) return;
      const ph = el.getAttribute('placeholder');
      if (ph) {
        const next = translateStr(ph);
        if (next !== ph) el.setAttribute('placeholder', next);
      }
    });
  }

  function render() {
    if (!state.modalEl) return;
    // Giữ nguyên vị trí cuộn của modal & bảng khi re-render (không bao giờ giật lên đầu trang!)
    const prevBodyScroll = state.modalEl.querySelector('.ll51-body')?.scrollTop || 0;
    const prevTableScroll = state.modalEl.querySelector('.ll51-table-wrap')?.scrollTop || 0;
    const isStudio = state.step === 'studio';
    const bodyHtml = isStudio
      ? `
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <button type="button" data-ll51-tab="vocab" class="ll51-tab ${state.activeTab === 'vocab' ? 'is-active' : ''}">📖 Bảng Từ Vựng (${state.vocabList.length})</button>
            <button type="button" data-ll51-tab="grammar" class="ll51-tab ${state.activeTab === 'grammar' ? 'is-active' : ''}">📐 Bảng Ngữ Pháp (10 Cấu trúc)</button>
            <button type="button" data-ll51-tab="flashcards" class="ll51-tab ${state.activeTab === 'flashcards' ? 'is-active' : ''}">🃏 Flashcard 6 Chế Độ (${state.decks.length} bộ)</button>
            <button type="button" data-ll51-tab="export" class="ll51-tab ${state.activeTab === 'export' ? 'is-active' : ''}">📥 Xuất PDF &amp; Tải Flashcard</button>
          </div>
          <div>
            ${state.activeTab === 'vocab' ? renderVocabTabHtml() : ''}
            ${state.activeTab === 'grammar' ? renderGrammarTabHtml() : ''}
            ${state.activeTab === 'flashcards' ? renderFlashcardsTabHtml() : ''}
            ${state.activeTab === 'export' ? renderExportTabHtml() : ''}
          </div>
        </div>
      `
      : renderSetupWizardHtml();

    state.modalEl.innerHTML = `
      <div class="ll51-shell">
        <div class="ll51-header">
          <div class="min-w-0">
            <h2 class="text-sm sm:text-base font-black text-white">🎓 Học Ngoại Ngữ Qua Trang Web · 6 Languages &amp; Flashcards Studio</h2>
            <div class="text-xs text-sky-200/85">Từ vựng thật từ giao diện web · Phiên âm &amp; Giọng đọc 6 thứ tiếng · Ngữ pháp đối chiếu · Xuất PDF &amp; Flashcard</div>
          </div>
          <button type="button" id="ll51-btn-close" class="ll51-btn ll51-btn-rose text-xs">✕ Đóng</button>
        </div>
        <div class="ll51-body">${bodyHtml}</div>
      </div>
    `;
    bindEvents();
    if (isStudio) applyNativeUiChrome(state.modalEl, state.nativeLang);
    const newBody = state.modalEl.querySelector('.ll51-body');
    const newTable = state.modalEl.querySelector('.ll51-table-wrap');
    if (newBody && prevBodyScroll > 0) newBody.scrollTop = prevBodyScroll;
    if (newTable && prevTableScroll > 0) newTable.scrollTop = prevTableScroll;
  }

  LL.open = function open() {
    hydrateState();
    let modal = document.getElementById(MODAL_ID);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = MODAL_ID;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('data-i18n-ignore', 'true'); // Giữ nguyên chữ gốc đa ngôn ngữ để học không bị ghi đè!
      document.body.appendChild(modal);
    }
    state.modalEl = modal;
    render();
    // Nạp nền thư viện pinyin-pro (20.900+ Hán tự Giản/Phồn) rồi tự làm mới phiên âm 100%!
    if (typeof LL.ensurePinyinPro === 'function' && !globalScope.pinyinPro?.pinyin) {
      LL.ensurePinyinPro().then((lib) => {
        if (lib && state.modalEl && state.modalEl.isConnected && state.step === 'studio') {
          render();
        }
      });
    }
    return true;
  };

  LL.close = function close() {
    try { globalScope.speechSynthesis?.cancel?.(); } catch (_e) {}
    document.getElementById(MODAL_ID)?.remove();
    state.modalEl = null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
