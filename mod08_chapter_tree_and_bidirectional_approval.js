/**
 * ============================================================================
 * MODULE 08: QUẢN LÝ CÂY BẢN THẢO, CỔNG DUYỆT HAI CHIỀU (NHÁP ⇄ ĐÃ DUYỆT),
 *            ĐỒNG BỘ TIÊU ĐỀ HAI CHIỀU & PHẪU THUẬT CHƯƠNG (SẮP XẾP / NHÂN BẢN
 *            / GỘP CHƯƠNG / TÁCH CHƯƠNG TẠI CON TRỎ / THỐNG KÊ VĂN HỌC)
 * ============================================================================
 * Phiên bản: NoirStudio Modular Architecture v36.0
 * Tập tin: mod08_chapter_tree_and_bidirectional_approval.js
 * Mục tiêu:
 *   1. Cung cấp lớp `ChapterRegistryAndApprovalGate` gắn vào `window.NoirStudio.chapterManager`.
 *   2. Triển khai đầy đủ các phương thức bắt buộc:
 *      - `loadChaptersFromStorage()`
 *      - `getActiveChapter()`
 *      - `getApprovedChapters()`
 *      - `getDraftChapters()`
 *      - `syncEditorToActiveChapter()`
 *      - `loadActiveChapterIntoEditor()`
 *      - `updateLiveWordStatsUI(text)`
 *      - `selectChapter(chapterId)`
 *      - `createNewChapter(customTitle, initialContent)`
 *      - `renameChapter(chapterId, newTitle)`
 *      - `deleteChapter(chapterId)`
 *      - `renderChapterTreeAndQuickSwitcher()`
 *   3. Tương tác mượt mà với `#quick-chapter-switcher`, `#input-chapter-title`,
 *      `#active-chapter-status-badge`, `#stat-word-count`, `#stat-paragraph-count`,
 *      `#stat-reading-time`, `#chapter-tree-container`, `#count-all-chapters`,
 *      `#count-draft-chapters`, `#count-approved-chapters`, và `.chapter-filter-btn`.
 *   4. Mở rộng tính năng quản trị bản thảo chuyên nghiệp: Di chuyển thứ tự chương (Lên/Xuống),
 *      Nhân bản chương (Duplicate), Gộp 2 chương (Merge), Tách chương ngay tại vị trí con trỏ
 *      soạn thảo (Split at Cursor), Biểu đồ thống kê độ dài chương & Cổng duyệt 2 chiều.
 * ============================================================================
 */

(function () {
  'use strict';

  window.NoirStudio = window.NoirStudio || {};
  window.NoirStudio.state = window.NoirStudio.state || {
    activeScreen: 'SCREEN_1_WRITE',
    activeChapterId: null,
    chapterFilter: 'ALL',
    isSaving: false,
    isDirty: false,
    lastSavedAt: Date.now()
  };

  // ==========================================================================
  // PHẦN 1: BỘ ĐO LƯỜNG THỐNG KÊ VĂN HỌC & TIẾN ĐỘ CHƯƠNG (LITERARY METRICS)
  // ==========================================================================
  class ChapterLiteraryMetricsCalculator {
    constructor(utils) {
      this.utils = utils;
      this.defaultReadingWpm = 220; // Tốc độ đọc thầm Tiếng Việt trung bình (220 từ/phút)
      this.defaultAudiobookWpm = 145; // Tốc độ đọc diễn cảm Audiobook (145 từ/phút)
    }

    /**
     * Tính toán chi tiết các chỉ số thống kê của một văn bản chương
     */
    computeDetailedChapterStats(text, targetWords = 3500) {
      const raw = typeof text === 'string' ? text : '';
      const trimmed = raw.trim();

      if (!trimmed) {
        return {
          wordCount: 0,
          charCountWithSpaces: 0,
          charCountNoSpaces: 0,
          paragraphCount: 0,
          sentenceCount: 0,
          dialogueLineCount: 0,
          narrativeLineCount: 0,
          dialoguePercent: 0,
          readingMinutes: 1,
          audiobookMinutes: 1,
          avgWordsPerSentence: 0,
          avgWordsPerParagraph: 0,
          targetWords: Math.max(500, Number(targetWords) || 3500),
          completionPercent: 0
        };
      }

      const wordCount = this.utils.countVietnameseWords(trimmed);
      const charCountWithSpaces = trimmed.length;
      const charCountNoSpaces = trimmed.replace(/\s+/g, '').length;
      const paragraphCount = this.utils.countParagraphs(trimmed);

      const sentences = trimmed
        .split(/(?<=[.!?…])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);
      const sentenceCount = Math.max(1, sentences.length);

      const nonEmptyLines = trimmed
        .split(/\r?\n+/)
        .map((l) => l.trim())
        .filter(Boolean);

      let dialogueLineCount = 0;
      let narrativeLineCount = 0;
      for (const line of nonEmptyLines) {
        if (/^(?:—|–|-|“|"|«)/.test(line)) {
          dialogueLineCount++;
        } else {
          narrativeLineCount++;
        }
      }

      const dialoguePercent =
        nonEmptyLines.length > 0
          ? Math.round((dialogueLineCount / nonEmptyLines.length) * 100)
          : 0;

      const readingMinutes = Math.max(
        1,
        Math.ceil(wordCount / this.defaultReadingWpm)
      );
      const audiobookMinutes = Math.max(
        1,
        Math.ceil(wordCount / this.defaultAudiobookWpm)
      );

      const avgWordsPerSentence = Number((wordCount / sentenceCount).toFixed(1));
      const avgWordsPerParagraph =
        paragraphCount > 0 ? Number((wordCount / paragraphCount).toFixed(1)) : 0;

      const safeTarget = Math.max(500, Number(targetWords) || 3500);
      const completionPercent = Math.min(
        100,
        Math.round((wordCount / safeTarget) * 100)
      );

      return {
        wordCount,
        charCountWithSpaces,
        charCountNoSpaces,
        paragraphCount,
        sentenceCount,
        dialogueLineCount,
        narrativeLineCount,
        dialoguePercent,
        readingMinutes,
        audiobookMinutes,
        avgWordsPerSentence,
        avgWordsPerParagraph,
        targetWords: safeTarget,
        completionPercent
      };
    }

    /**
     * Tổng hợp báo cáo thống kê toàn bộ tiểu thuyết trên tất cả các chương
     */
    computeManuscriptAggregateReport(chapters = []) {
      if (!Array.isArray(chapters) || chapters.length === 0) {
        return {
          totalChapters: 0,
          approvedChapters: 0,
          draftChapters: 0,
          totalWords: 0,
          approvedWords: 0,
          draftWords: 0,
          avgChapterWords: 0,
          longestChapter: null,
          shortestChapter: null,
          estimatedTotalReadingHours: '0.0'
        };
      }

      let totalWords = 0;
      let approvedWords = 0;
      let draftWords = 0;
      let approvedChapters = 0;
      let draftChapters = 0;
      let longestChapter = null;
      let shortestChapter = null;

      for (const chap of chapters) {
        const wc =
          typeof chap.wordCount === 'number'
            ? chap.wordCount
            : this.utils.countVietnameseWords(chap.content || '');

        totalWords += wc;
        if (chap.status === 'APPROVED') {
          approvedChapters++;
          approvedWords += wc;
        } else {
          draftChapters++;
          draftWords += wc;
        }

        if (!longestChapter || wc > longestChapter.wordCount) {
          longestChapter = {
            id: chap.id,
            title: chap.displayTitle || chap.title,
            wordCount: wc
          };
        }
        if (!shortestChapter || wc < shortestChapter.wordCount) {
          shortestChapter = {
            id: chap.id,
            title: chap.displayTitle || chap.title,
            wordCount: wc
          };
        }
      }

      const avgChapterWords = Math.round(totalWords / chapters.length);
      const totalReadingMins = Math.ceil(totalWords / this.defaultReadingWpm);
      const estimatedTotalReadingHours = (totalReadingMins / 60).toFixed(1);

      return {
        totalChapters: chapters.length,
        approvedChapters,
        draftChapters,
        totalWords,
        approvedWords,
        draftWords,
        avgChapterWords,
        longestChapter,
        shortestChapter,
        totalReadingMins,
        estimatedTotalReadingHours
      };
    }
  }

  // ==========================================================================
  // PHẦN 2: ĐỘNG CƠ PHẪU THUẬT BẢN THẢO (SẮP XẾP, NHÂN BẢN, GỘP & TÁCH CHƯƠNG)
  // ==========================================================================
  class ChapterSurgeryAndReorderEngine {
    constructor(manager) {
      this.manager = manager;
    }

    /**
     * Đánh số lại thứ tự `chapterNumber` và `fileName` tuần tự từ 1 đến N
     */
    renumberAllChaptersSequential(updateTitlePrefixIfStandard = false) {
      this.manager.chapters.forEach((chap, idx) => {
        const newNum = idx + 1;
        chap.chapterNumber = newNum;
        chap.fileName = `Chuong_${newNum}.txt`;

        if (updateTitlePrefixIfStandard) {
          const currentTitle = chap.displayTitle || chap.title || '';
          const match = currentTitle.match(/^Chương\s+\d+\s*([:\-–—]\s*.*)?$/i);
          if (match) {
            const suffix = match[1] || '';
            chap.title = `Chương ${newNum}${suffix}`;
            chap.displayTitle = chap.title;
          }
        }
      });
    }

    /**
     * Di chuyển vị trí của một chương lên trên (-1) hoặc xuống dưới (+1)
     */
    async moveChapter(chapterId, directionOffset = -1) {
      this.manager.syncEditorToActiveChapter();
      const idx = this.manager.chapters.findIndex((c) => c.id === chapterId);
      if (idx === -1) return false;

      const targetIdx = idx + directionOffset;
      if (targetIdx < 0 || targetIdx >= this.manager.chapters.length) {
        this.manager.utils.showToast(
          directionOffset < 0
            ? 'ℹ️ Chương này đã ở vị trí đầu tiên của danh sách.'
            : 'ℹ️ Chương này đã ở vị trí cuối cùng của danh sách.',
          'info',
          2000
        );
        return false;
      }

      // Hoán đổi vị trí 2 chương
      const temp = this.manager.chapters[idx];
      this.manager.chapters[idx] = this.manager.chapters[targetIdx];
      this.manager.chapters[targetIdx] = temp;

      this.renumberAllChaptersSequential(false);

      // Lưu lại thứ tự mới vào IndexedDB
      await this.manager.persistAllChaptersToStorage();
      this.manager.rag.rebuildIndexFromChapters(this.manager.chapters);
      this.manager.renderChapterTreeAndQuickSwitcher();

      this.manager.utils.showToast(
        `↕️ Đã di chuyển "${temp.displayTitle || temp.title}" sang vị trí #${targetIdx + 1}!`,
        'success',
        2200
      );
      return true;
    }

    /**
     * Kéo thả sắp xếp lại trình tự chương cực nhanh
     */
    async reorderChapterByDrop(sourceId, targetId) {
      if (!sourceId || !targetId || sourceId === targetId) return false;
      this.manager.syncEditorToActiveChapter();
      const fromIdx = this.manager.chapters.findIndex((c) => c.id === sourceId);
      const toIdx = this.manager.chapters.findIndex((c) => c.id === targetId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return false;

      const [moved] = this.manager.chapters.splice(fromIdx, 1);
      this.manager.chapters.splice(toIdx, 0, moved);
      this.renumberAllChaptersSequential(false);

      await this.manager.persistAllChaptersToStorage();
      this.manager.rag.rebuildIndexFromChapters(this.manager.chapters);
      this.manager.renderChapterTreeAndQuickSwitcher();

      this.manager.utils.showToast(
        `🔀 Đã kéo "${moved.displayTitle || moved.title}" tới vị trí #${toIdx + 1}!`,
        'success',
        2200
      );
      return true;
    }

    /**
     * Gộp nhiều chương đã chọn thành Quyển (volume) / Chương (chapter) / Cảnh (scene)
     */
    async groupChaptersIntoHierarchy(chapterIds = [], level = 'volume', groupLabel = '') {
      const idSet = new Set(Array.isArray(chapterIds) ? chapterIds : []);
      if (idSet.size === 0) return false;
      const safeLevel = ['volume', 'chapter', 'scene'].includes(level) ? level : 'volume';
      const defaultNameMap = {
        volume: 'Quyển 1',
        chapter: 'Chương Gộp 1',
        scene: 'Cảnh 1'
      };
      const cleanName = String(groupLabel || '').trim() || defaultNameMap[safeLevel];
      const groupId = `${safeLevel}_${Date.now()}`;

      let updated = 0;
      const persistMap = this.manager.loadHierarchyMapFromStorage();
      this.manager.chapters.forEach((chap) => {
        if (!idSet.has(chap.id)) return;
        chap.hierarchyLevel = safeLevel;
        chap.hierarchyGroup = cleanName;
        chap.hierarchyGroupId = groupId;
        persistMap[chap.id] = {
          level: safeLevel,
          group: cleanName,
          groupId
        };
        updated += 1;
      });
      if (updated === 0) return false;

      this.manager.saveHierarchyMapToStorage(persistMap);
      await this.manager.persistAllChaptersToStorage();
      await this.manager.syncHierarchyFolderStructureToDisk?.();
      this.manager.renderChapterTreeAndQuickSwitcher();

      const levelVi = safeLevel === 'volume' ? 'Quyển (Volume)' : safeLevel === 'chapter' ? 'Chương (Chapter)' : 'Cảnh (Scene)';
      this.manager.utils.showToast(
        `📚 Đã gộp ${updated} mục vào ${levelVi}: "${cleanName}" & tạo thư mục đồng bộ!`,
        'success',
        2800
      );
      return true;
    }

    /**
     * Bỏ nhóm phân cấp khỏi các chương đã chọn
     */
    async ungroupChapters(chapterIds = []) {
      const idSet = new Set(Array.isArray(chapterIds) ? chapterIds : []);
      if (idSet.size === 0) return false;
      const persistMap = this.manager.loadHierarchyMapFromStorage();
      this.manager.chapters.forEach((chap) => {
        if (!idSet.has(chap.id)) return;
        const oldPath = chap.diskRelPath || '';
        delete chap.hierarchyLevel;
        delete chap.hierarchyGroup;
        delete chap.hierarchyGroupId;
        delete persistMap[chap.id];
        if (oldPath) chap._prevDiskRelPath = oldPath;
      });
      this.manager.saveHierarchyMapToStorage(persistMap);
      await this.manager.persistAllChaptersToStorage();
      await this.manager.syncHierarchyFolderStructureToDisk?.();
      this.manager.renderChapterTreeAndQuickSwitcher();
      this.manager.utils.showToast('🧹 Đã tách nhóm phân cấp cho các chương đã chọn.', 'info', 2200);
      return true;
    }

    /**
     * Nhân bản (Duplicate) một chương thành bản sao ngay liền sau chương gốc
     */
    async duplicateChapter(chapterId) {
      this.manager.syncEditorToActiveChapter();
      const sourceIdx = this.manager.chapters.findIndex((c) => c.id === chapterId);
      if (sourceIdx === -1) return null;

      const source = this.manager.chapters[sourceIdx];
      const cloneTitle = `${source.displayTitle || source.title} (Bản sao)`;
      const cloneChap = {
        id: `chap_copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chapterNumber: sourceIdx + 2,
        title: cloneTitle,
        displayTitle: cloneTitle,
        content: source.content || '',
        beats: source.beats || '',
        status: 'DRAFT',
        wordCount: this.manager.utils.countVietnameseWords(source.content || ''),
        summary: source.summary || this.manager.parser.buildZeroTokenSummary(source.content || ''),
        fileName: `Chuong_${sourceIdx + 2}_BanSao.txt`,
        updatedAt: Date.now()
      };

      this.manager.chapters.splice(sourceIdx + 1, 0, cloneChap);
      this.renumberAllChaptersSequential(false);

      this.manager.activeChapterId = cloneChap.id;
      window.NoirStudio.state.activeChapterId = cloneChap.id;

      await this.manager.persistAllChaptersToStorage();
      this.manager.rag.rebuildIndexFromChapters(this.manager.chapters);
      this.manager.renderChapterTreeAndQuickSwitcher();
      this.manager.loadActiveChapterIntoEditor();

      this.manager.utils.showToast(
        `📑 Đã nhân bản thành công "${cloneTitle}"!`,
        'success'
      );
      return cloneChap;
    }

    /**
     * Gộp (Merge) 2 chương lại thành 1 chương duy nhất (tự động chụp mốc phiên bản dự phòng tại Tab 6)
     */
    async mergeTwoChapters(primaryChapterId, secondaryChapterId, separator = '\n\n* * *\n\n') {
      this.manager.syncEditorToActiveChapter();
      if (!primaryChapterId || !secondaryChapterId || primaryChapterId === secondaryChapterId) {
        this.manager.utils.showToast('⚠️ Hãy chọn 2 chương khác nhau để gộp!', 'warning');
        return null;
      }

      const primary = this.manager.chapters.find((c) => c.id === primaryChapterId);
      const secondary = this.manager.chapters.find((c) => c.id === secondaryChapterId);
      if (!primary || !secondary) return null;

      // Chụp mốc phiên bản dự phòng trước khi gộp
      await window.NoirStudio.versionVault?.createSnapshot(
        `Sao lưu tự động trước khi gộp "${primary.displayTitle}" và "${secondary.displayTitle}"`,
        'MANUAL'
      );

      const combinedContent = [
        (primary.content || '').trim(),
        (secondary.content || '').trim()
      ]
        .filter(Boolean)
        .join(separator);

      const combinedBeats = [
        (primary.beats || '').trim(),
        (secondary.beats || '').trim()
      ]
        .filter(Boolean)
        .join('\n');

      primary.content = combinedContent;
      primary.beats = combinedBeats;
      primary.wordCount = this.manager.utils.countVietnameseWords(combinedContent);
      primary.summary = this.manager.parser.buildZeroTokenSummary(combinedContent);
      primary.updatedAt = Date.now();

      // Xóa chương thứ hai khỏi danh sách và IndexedDB
      this.manager.chapters = this.manager.chapters.filter(
        (c) => c.id !== secondaryChapterId
      );
      await this.manager.idb.delete(
        this.manager.getStoreName('CHAPTERS'),
        secondaryChapterId
      );

      this.renumberAllChaptersSequential(false);
      this.manager.activeChapterId = primary.id;
      window.NoirStudio.state.activeChapterId = primary.id;

      await this.manager.persistAllChaptersToStorage();
      this.manager.rag.rebuildIndexFromChapters(this.manager.chapters);
      this.manager.renderChapterTreeAndQuickSwitcher();
      this.manager.loadActiveChapterIntoEditor();

      this.manager.utils.showToast(
        `🔗 Đã gộp "${secondary.displayTitle}" vào "${primary.displayTitle}" (${primary.wordCount.toLocaleString(
          'vi-VN'
        )} từ)!`,
        'success',
        4000
      );
      return primary;
    }

    /**
     * Tách chương đang mở thành 2 chương độc lập ngay tại vị trí con trỏ chuột trong khung soạn thảo
     */
    async splitActiveChapterAtEditorCursor(customNewChapterTitle = '') {
      this.manager.syncEditorToActiveChapter();
      const activeChap = this.manager.getActiveChapter();
      const editor = document.getElementById('textarea-chapter-content');
      if (!activeChap || !editor) return null;

      const fullText = editor.value || '';
      const cursorPos =
        typeof editor.selectionStart === 'number' ? editor.selectionStart : -1;

      if (cursorPos <= 20 || cursorPos >= fullText.length - 20) {
        this.manager.utils.showToast(
          '⚠️ Hãy đặt con trỏ chuột ở vị trí giữa bản thảo (nơi bạn muốn ngắt sang chương mới) rồi bấm Tách Chương!',
          'warning',
          4200
        );
        return null;
      }

      const firstHalf = fullText.slice(0, cursorPos).trim();
      const secondHalf = fullText.slice(cursorPos).trim();

      if (!firstHalf || !secondHalf) {
        this.manager.utils.showToast(
          '⚠️ Vị trí con trỏ không có nội dung ở cả hai phía để tách chương.',
          'warning'
        );
        return null;
      }

      // Chụp mốc phiên bản dự phòng trước khi tách chương
      await window.NoirStudio.versionVault?.createSnapshot(
        `Sao lưu tự động trước khi tách chương "${activeChap.displayTitle}"`,
        'MANUAL'
      );

      // Cập nhật nửa đầu cho chương hiện tại
      activeChap.content = firstHalf;
      activeChap.wordCount = this.manager.utils.countVietnameseWords(firstHalf);
      activeChap.summary = this.manager.parser.buildZeroTokenSummary(firstHalf);
      activeChap.updatedAt = Date.now();

      // Tạo chương mới cho nửa sau ngay bên dưới chương hiện tại
      const activeIdx = this.manager.chapters.findIndex((c) => c.id === activeChap.id);
      const nextNum = activeIdx + 2;
      const newTitle =
        (customNewChapterTitle || '').trim() ||
        `Chương ${nextNum}: Phần Tiếp Theo Của ${activeChap.displayTitle || activeChap.title}`;

      const secondChap = {
        id: `chap_split_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chapterNumber: nextNum,
        title: newTitle,
        displayTitle: newTitle,
        content: secondHalf,
        beats: '',
        status: 'DRAFT',
        wordCount: this.manager.utils.countVietnameseWords(secondHalf),
        summary: this.manager.parser.buildZeroTokenSummary(secondHalf),
        fileName: `Chuong_${nextNum}.txt`,
        updatedAt: Date.now()
      };

      this.manager.chapters.splice(activeIdx + 1, 0, secondChap);
      this.renumberAllChaptersSequential(false);

      this.manager.activeChapterId = secondChap.id;
      window.NoirStudio.state.activeChapterId = secondChap.id;

      await this.manager.persistAllChaptersToStorage();
      this.manager.rag.rebuildIndexFromChapters(this.manager.chapters);
      this.manager.renderChapterTreeAndQuickSwitcher();
      this.manager.loadActiveChapterIntoEditor();

      this.manager.utils.showToast(
        `✂️ Đã tách thành công! Nửa sau (${secondChap.wordCount.toLocaleString(
          'vi-VN'
        )} từ) đã chuyển sang "${newTitle}".`,
        'success',
        4200
      );
      return secondChap;
    }
  }

  // ==========================================================================
  // PHẦN 3: CỔNG DUYỆT HAI CHIỀU (NHÁP ⇄ ĐÃ DUYỆT) & NHẬT KÝ DUYỆT BẢN CHÍNH THỨC
  // ==========================================================================
  class BidirectionalApprovalGateController {
    constructor(manager) {
      this.manager = manager;
      this.auditStorageKey = 'noir_mod08_approval_audit_ledger_v1';
      this.auditLogs = this.loadAuditLogs();
    }

    loadAuditLogs() {
      try {
        const raw = localStorage.getItem(this.auditStorageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, 60) : [];
      } catch (_) {
        return [];
      }
    }

    saveAuditLogs() {
      try {
        localStorage.setItem(
          this.auditStorageKey,
          JSON.stringify(this.auditLogs.slice(0, 60))
        );
      } catch (_) {}
    }

    recordApprovalTransition(chap, fromStatus, toStatus, reasonNote = '') {
      if (!chap) return;
      this.auditLogs.unshift({
        id: 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        chapterId: chap.id,
        chapterTitle: chap.displayTitle || chap.title,
        fromStatus,
        toStatus,
        wordCountAtTransition: chap.wordCount || 0,
        reasonNote:
          reasonNote ||
          (toStatus === 'APPROVED'
            ? 'Chốt duyệt làm bản chính thức'
            : 'Mở khóa về Bản nháp để chỉnh sửa tiếp'),
        timestamp: Date.now()
      });
      if (this.auditLogs.length > 60) {
        this.auditLogs = this.auditLogs.slice(0, 60);
      }
      this.saveAuditLogs();
    }

    /**
     * Đổi trạng thái hai chiều Nháp ⇄ Đã Duyệt cho một chương bất kỳ
     */
    async toggleChapterStatusBidirectional(chapterId, explicitStatus = null, silent = false) {
      const chap = this.manager.chapters.find((c) => c.id === chapterId);
      if (!chap) return null;

      if (chap.id === this.manager.activeChapterId) {
        this.manager.syncEditorToActiveChapter();
      }

      const oldStatus = chap.status === 'APPROVED' ? 'APPROVED' : 'DRAFT';
      const nextStatus =
        explicitStatus === 'APPROVED' || explicitStatus === 'DRAFT'
          ? explicitStatus
          : oldStatus === 'APPROVED'
          ? 'DRAFT'
          : 'APPROVED';

      chap.status = nextStatus;
      chap.updatedAt = Date.now();
      chap.wordCount = this.manager.utils.countVietnameseWords(chap.content || '');
      chap.summary = this.manager.parser.buildZeroTokenSummary(chap.content || '');

      if (nextStatus === 'APPROVED') {
        chap.approvedAt = Date.now();
        chap.approvedWordCount = chap.wordCount;
      }

      this.recordApprovalTransition(chap, oldStatus, nextStatus);

      // Lưu vào IndexedDB
      await this.manager.idb.set(
        this.manager.getStoreName('CHAPTERS'),
        chap.id,
        chap
      );

      // Đồng bộ xuống ổ cứng máy tính nếu đã kết nối
      if (this.manager.fs && this.manager.fs.rootHandle) {
        const targetFolder =
          nextStatus === 'APPROVED'
            ? '02_Chuong_Da_Duyet'
            : '01_Chuong_Goc_Chua_Duyet';
        await this.manager.fs.writeTextFile(
          targetFolder,
          `${chap.displayTitle || chap.title}.txt`,
          chap.content || ''
        );
      }

      // Cập nhật lại chỉ mục RAG và cây chương
      this.manager.rag.rebuildIndexFromChapters(this.manager.chapters);
      this.manager.renderChapterTreeAndQuickSwitcher();

      if (chap.id === this.manager.activeChapterId) {
        this.manager.loadActiveChapterIntoEditor();
      }

      // Khi duyệt chương trực tiếp ở Tab 2 -> mở hộp thoại xác nhận cập nhật Story Bible từ Chương 1 tới chương mới nhất + gợi ý Google NotebookLM
      if (!silent && nextStatus === 'APPROVED') {
        try {
          const ext = window.NoirStudio?.approvalExtractor;
          if (ext && typeof ext.openPostApprovalBibleConfirmModal === 'function') {
            ext.openPostApprovalBibleConfirmModal([chap]);
          } else {
            ext?.syncCumulativeStoryBibleFromApprovedChapters?.({ silent: true });
          }
        } catch (_sbErr) {}
      }

      if (!silent) {
        this.manager.utils.showToast(
          nextStatus === 'APPROVED'
            ? `✅ Đã chuyển "${chap.displayTitle || chap.title}" sang Đã Duyệt!`
            : `📝 Đã chuyển "${chap.displayTitle || chap.title}" về Bản Nháp!`,
          'success'
        );
      }

      return chap;
    }

    /**
     * Chuyển hàng loạt tất cả các chương sang Đã Duyệt hoặc Bản Nháp
     */
    async batchSetAllChaptersStatus(targetStatus = 'APPROVED') {
      this.manager.syncEditorToActiveChapter();
      const validStatus = targetStatus === 'APPROVED' ? 'APPROVED' : 'DRAFT';

      for (const chap of this.manager.chapters) {
        if (chap.status !== validStatus) {
          await this.toggleChapterStatusBidirectional(chap.id, validStatus, true);
        }
      }

      this.manager.utils.showToast(
        validStatus === 'APPROVED'
          ? `✅ Đã chốt duyệt toàn bộ ${this.manager.chapters.length} chương thành Bản đã duyệt!`
          : `📝 Đã chuyển toàn bộ ${this.manager.chapters.length} chương về trạng thái Bản Nháp!`,
        'success'
      );
    }
  }

  // ==========================================================================
  // PHẦN 4: HỘP THOẠI QUẢN TRỊ BẢN THẢO NÂNG CAO (GỘP / TÁCH / BIỂU ĐỒ THỐNG KÊ)
  // ==========================================================================
  class ChapterStudioOperationsModalUI {
    constructor(manager) {
      this.manager = manager;
      this.modalId = 'noir-mod08-chapter-studio-modal';
      this.activeSubTab = 'OVERVIEW'; // 'OVERVIEW' | 'MERGE_SPLIT' | 'AUDIT_LOG'
    }

    ensureModalInDOM() {
      let modal = document.getElementById(this.modalId);
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = this.modalId;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.className =
        'hidden fixed inset-0 z-[97] bg-black/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 overflow-y-auto font-sansUI';
      modal.innerHTML = `
        <div class="my-auto w-full max-w-4xl rounded-3xl border border-emerald-500/40 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
          <div class="px-5 py-4 border-b border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <h3 class="font-extrabold text-sm sm:text-base text-emerald-400">
                🗂️ Trung Tâm Quản Trị Cây Bản Thảo & Phẫu Thuật Chương
              </h3>
              <p id="mod08-studio-modal-subtitle" class="text-[11px] text-zinc-400 mt-0.5"></p>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" data-mod08-tab="OVERVIEW" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs">
                📊 Thống Kê Độ Dài
              </button>
              <button type="button" data-mod08-tab="MERGE_SPLIT" class="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs">
                ✂️ Gộp & Tách Chương
              </button>
              <button type="button" data-mod08-tab="AUDIT_LOG" class="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs">
                📜 Nhật Ký Duyệt
              </button>
              <button type="button" id="btn-mod08-close-studio-modal" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white font-bold text-xs ml-1">
                ✕
              </button>
            </div>
          </div>
          <div id="mod08-studio-modal-body" class="p-5 overflow-y-auto space-y-4 text-xs flex-1"></div>
        </div>
      `;

      document.body.appendChild(modal);

      modal
        .querySelector('#btn-mod08-close-studio-modal')
        ?.addEventListener('click', () => modal.classList.add('hidden'));

      modal.querySelectorAll('[data-mod08-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.activeSubTab = btn.getAttribute('data-mod08-tab') || 'OVERVIEW';
          this.renderModalContent();
        });
      });

      return modal;
    }

    openStudioModal(initialTab = 'OVERVIEW') {
      this.manager.syncEditorToActiveChapter();
      this.activeSubTab = initialTab;
      const modal = this.ensureModalInDOM();
      this.renderModalContent();
      modal.classList.remove('hidden');
      window.NoirNovel?.i18n?.translateElement?.(modal);
    }

    renderModalContent() {
      const modal = document.getElementById(this.modalId);
      if (!modal) return;

      modal.querySelectorAll('[data-mod08-tab]').forEach((btn) => {
        const tabId = btn.getAttribute('data-mod08-tab');
        btn.className =
          tabId === this.activeSubTab
            ? 'px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow'
            : 'px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs';
      });

      const report = this.manager.metricsCalc.computeManuscriptAggregateReport(
        this.manager.chapters
      );
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      const subEl = modal.querySelector('#mod08-studio-modal-subtitle');
      if (subEl) {
        subEl.dataset.i18nIgnore = '1';
        subEl.textContent = `${tr(`Tổng cộng ${report.totalChapters} chương`)} (${tr(`${report.approvedChapters} đã duyệt`)}, ${tr(`${report.draftChapters} nháp`)}) • ${tr(`${fmtNum(report.totalWords)} từ`)} (~${tr(`${report.estimatedTotalReadingHours} giờ đọc`)})`;
      }

      const bodyEl = modal.querySelector('#mod08-studio-modal-body');
      if (!bodyEl) return;

      const esc = (s) => this.manager.utils.escapeHtml(s);

      if (this.activeSubTab === 'OVERVIEW') {
        const maxW = Math.max(
          1000,
          ...this.manager.chapters.map((c) => c.wordCount || 0)
        );
        const barsHtml = this.manager.chapters
          .map((c, idx) => {
            const pct = Math.max(2, Math.round(((c.wordCount || 0) / maxW) * 100));
            const barColor =
              c.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500';
            return `
              <div class="space-y-1 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-bold text-zinc-100 truncate">${idx + 1}. ${esc(
              c.displayTitle || c.title
            )}</span>
                  <span class="font-monoCode text-zinc-300 shrink-0">${(
                    c.wordCount || 0
                  ).toLocaleString('vi-VN')} từ</span>
                </div>
                <div class="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div class="${barColor} h-full rounded-full transition-all" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          })
          .join('');

        bodyEl.innerHTML = `
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/90">
              <div class="text-[10px] text-zinc-400 uppercase font-bold">Tổng Số Từ</div>
              <div class="text-lg font-extrabold text-emerald-400 font-monoCode mt-0.5">${report.totalWords.toLocaleString(
                'vi-VN'
              )}</div>
            </div>
            <div class="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/90">
              <div class="text-[10px] text-zinc-400 uppercase font-bold">Trung Bình / Chương</div>
              <div class="text-lg font-extrabold text-amber-400 font-monoCode mt-0.5">${report.avgChapterWords.toLocaleString(
                'vi-VN'
              )}</div>
            </div>
            <div class="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/90">
              <div class="text-[10px] text-zinc-400 uppercase font-bold">Số Từ Đã Duyệt</div>
              <div class="text-lg font-extrabold text-indigo-400 font-monoCode mt-0.5">${report.approvedWords.toLocaleString(
                'vi-VN'
              )}</div>
            </div>
            <div class="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/90">
              <div class="text-[10px] text-zinc-400 uppercase font-bold">Thời Lượng Đọc</div>
              <div class="text-lg font-extrabold text-rose-400 font-monoCode mt-0.5">~${
                report.totalReadingMins
              } phút</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="font-extrabold uppercase text-zinc-300 text-[11px]">
              📈 Biểu Đồ Phân Bố Độ Dài Các Chương:
            </div>
            <div class="space-y-2 max-h-[46vh] overflow-y-auto pr-1">${barsHtml}</div>
          </div>
        `;
      } else if (this.activeSubTab === 'MERGE_SPLIT') {
        const chapOptions = this.manager.chapters
          .map(
            (c, i) =>
              `<option value="${esc(c.id)}">${i + 1}. ${esc(
                c.displayTitle || c.title
              )} (${(c.wordCount || 0).toLocaleString('vi-VN')} từ)</option>`
          )
          .join('');

        bodyEl.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl border border-indigo-500/30 bg-zinc-900/80 space-y-3">
              <h4 class="font-extrabold text-indigo-300 text-sm">🔗 Gộp 2 Chương Thành 1 Chương</h4>
              <p class="text-[11px] text-zinc-400">
                Nội dung của Chương thứ 2 sẽ được nối vào cuối Chương thứ 1 (cách nhau bởi dấu phân cảnh <code>* * *</code>). Hệ thống tự động tạo mốc sao lưu tại Tab 6 trước khi gộp.
              </p>
              <div class="space-y-2">
                <label class="block text-[11px] font-bold text-zinc-300">Chương gốc (Giữ lại):</label>
                <select id="mod08-merge-primary-select" class="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs">
                  ${chapOptions}
                </select>
              </div>
              <div class="space-y-2">
                <label class="block text-[11px] font-bold text-zinc-300">Chương nối thêm vào cuối:</label>
                <select id="mod08-merge-secondary-select" class="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs">
                  ${chapOptions}
                </select>
              </div>
              <button type="button" id="btn-mod08-exec-merge" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow transition">
                🔗 Thực Hiện Gộp 2 Chương Đã Chọn
              </button>
            </div>

            <div class="p-4 rounded-2xl border border-amber-500/30 bg-zinc-900/80 space-y-3">
              <h4 class="font-extrabold text-amber-300 text-sm">✂️ Tách Chương Đang Mở Tại Con Trỏ Chuột</h4>
              <p class="text-[11px] text-zinc-400">
                Đặt con trỏ chuột ở vị trí muốn ngắt trong khung soạn thảo Tab 1, nhập tiêu đề cho chương mới bên dưới rồi bấm Tách Chương.
              </p>
              <div class="space-y-2">
                <label class="block text-[11px] font-bold text-zinc-300">Tiêu đề cho Chương Mới (Nửa sau):</label>
                <input type="text" id="mod08-split-new-title" placeholder="VD: Chương kế tiếp: Bóng Tối Sau Cánh Cửa" class="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs" />
              </div>
              <button type="button" id="btn-mod08-exec-split-cursor" class="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow transition">
                ✂️ Tách Chương Tại Vị Trí Con Trỏ
              </button>
              <hr class="border-zinc-800 my-2" />
              <button type="button" id="btn-mod08-renumber-all" class="w-full py-2 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white font-bold text-xs transition">
                🔢 Chuẩn Hóa Lại Số Thứ Tự Chương (1 ➔ ${this.manager.chapters.length})
              </button>
            </div>
          </div>
        `;

        const secSelect = bodyEl.querySelector('#mod08-merge-secondary-select');
        if (secSelect && this.manager.chapters.length > 1) {
          secSelect.selectedIndex = 1;
        }

        bodyEl
          .querySelector('#btn-mod08-exec-merge')
          ?.addEventListener('click', async () => {
            const pId = bodyEl.querySelector('#mod08-merge-primary-select')?.value;
            const sId = bodyEl.querySelector('#mod08-merge-secondary-select')?.value;
            const merged = await this.manager.surgeryEngine.mergeTwoChapters(pId, sId);
            if (merged) {
              this.renderModalContent();
            }
          });

        bodyEl
          .querySelector('#btn-mod08-exec-split-cursor')
          ?.addEventListener('click', async () => {
            const customTitle =
              bodyEl.querySelector('#mod08-split-new-title')?.value || '';
            const created =
              await this.manager.surgeryEngine.splitActiveChapterAtEditorCursor(
                customTitle
              );
            if (created) {
              modal.classList.add('hidden');
            }
          });

        bodyEl
          .querySelector('#btn-mod08-renumber-all')
          ?.addEventListener('click', async () => {
            this.manager.surgeryEngine.renumberAllChaptersSequential(true);
            await this.manager.persistAllChaptersToStorage();
            this.manager.renderChapterTreeAndQuickSwitcher();
            this.manager.loadActiveChapterIntoEditor();
            this.manager.utils.showToast(
              '🔢 Đã đánh lại số thứ tự chương chuẩn xác từ 1 đến hết!',
              'success'
            );
            this.renderModalContent();
          });
      } else {
        const logs = this.manager.approvalController.auditLogs || [];
        const logsHtml =
          logs.length > 0
            ? logs
                .map(
                  (item) => `
                  <div class="p-3 rounded-xl border border-zinc-800 bg-zinc-900/70 flex items-center justify-between gap-3">
                    <div>
                      <div class="font-bold text-zinc-100">${esc(item.chapterTitle)}</div>
                      <div class="text-[11px] text-zinc-400 mt-0.5">${esc(
                        item.reasonNote
                      )} • ${(item.wordCountAtTransition || 0).toLocaleString(
                    'vi-VN'
                  )} từ</div>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        item.toStatus === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }">
                        ${item.fromStatus} ➔ ${item.toStatus}
                      </span>
                      <div class="font-monoCode text-[10px] text-zinc-500 mt-1">
                        ${this.manager.utils.formatTimestampVN(item.timestamp)}
                      </div>
                    </div>
                  </div>
                `
                )
                .join('')
            : '<div class="p-6 text-center text-zinc-500 italic">Chưa có lịch sử chuyển đổi trạng thái Nháp ⇄ Đã duyệt nào trong phiên này.</div>';

        bodyEl.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <span class="font-extrabold text-zinc-300 uppercase text-[11px]">
              📜 Lịch Sử Chuyển Đổi Trạng Thái Nháp ⇄ Bản Đã Duyệt:
            </span>
            <div class="flex items-center gap-2">
              <button type="button" id="btn-mod08-batch-approve-all" class="px-3 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] hover:bg-emerald-600 hover:text-white transition">
                ✅ Duyệt Tất Cả Chương
              </button>
              <button type="button" id="btn-mod08-batch-draft-all" class="px-3 py-1 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 font-bold text-[11px] hover:bg-amber-600 hover:text-white transition">
                📝 Chuyển Tất Cả Về Nháp
              </button>
            </div>
          </div>
          <div class="space-y-2 max-h-[50vh] overflow-y-auto pr-1">${logsHtml}</div>
        `;

        bodyEl
          .querySelector('#btn-mod08-batch-approve-all')
          ?.addEventListener('click', async () => {
            await this.manager.approvalController.batchSetAllChaptersStatus('APPROVED');
            this.renderModalContent();
          });

        bodyEl
          .querySelector('#btn-mod08-batch-draft-all')
          ?.addEventListener('click', async () => {
            await this.manager.approvalController.batchSetAllChaptersStatus('DRAFT');
            this.renderModalContent();
          });
      }
    }
  }

  // ==========================================================================
  // PHẦN 5: BỘ XUẤT BẢN BẢN THẢO ĐA ĐỊNH DẠNG (.TXT, .MD, .HTML EBOOK, .JSON)
  // ==========================================================================
  class ChapterManuscriptExporter {
    constructor(manager) {
      this.manager = manager;
    }

    /**
     * Tải xuống một chương đơn lẻ dưới dạng file .txt hoặc .md
     */
    downloadSingleChapter(chapterId, format = 'txt') {
      this.manager.syncEditorToActiveChapter();
      const chap =
        this.manager.chapters.find((c) => c.id === chapterId) ||
        this.manager.getActiveChapter();
      if (!chap) return false;

      const title = chap.displayTitle || chap.title || 'Chuong_Ban_Thao';
      const safeFileName = title.replace(/[<>:"/\\|?*]+/g, '_').trim();
      let payload = '';
      let mime = 'text/plain;charset=utf-8';
      let ext = 'txt';

      if (format === 'md') {
        ext = 'md';
        mime = 'text/markdown;charset=utf-8';
        payload = [
          `# ${title}`,
          ``,
          `> Trạng thái: ${chap.status === 'APPROVED' ? 'Bản đã duyệt' : 'Bản nháp'} • Số từ: ${(
            chap.wordCount || 0
          ).toLocaleString('vi-VN')} từ`,
          ``,
          chap.content || ''
        ].join('\n');
      } else if (format === 'json') {
        ext = 'json';
        mime = 'application/json;charset=utf-8';
        payload = JSON.stringify(chap, null, 2);
      } else {
        payload = `${title}\n${'='.repeat(Math.min(68, title.length + 8))}\n\n${
          chap.content || ''
        }`;
      }

      this.triggerBrowserDownload(`${safeFileName}.${ext}`, payload, mime);
      this.manager.utils.showToast(
        `📥 Đã tải xuống chương "${title}" (.${ext.toUpperCase()})!`,
        'success'
      );
      return true;
    }

    /**
     * Xuất bản toàn bộ các chương (hoặc chỉ các chương Đã Duyệt) thành 1 cuốn sách hoàn chỉnh
     */
    exportCompiledBook(options = {}) {
      this.manager.syncEditorToActiveChapter();
      const {
        onlyApproved = false,
        format = 'txt', // 'txt' | 'md' | 'html' | 'json'
        bookTitle = 'Tieu_Thuyet_NoirStudio'
      } = options;

      const list = onlyApproved
        ? this.manager.getApprovedChapters()
        : this.manager.chapters;

      if (!list || list.length === 0) {
        this.manager.utils.showToast(
          '⚠️ Không có chương nào thỏa điều kiện để xuất bản!',
          'warning'
        );
        return false;
      }

      const totalWords = list.reduce((sum, c) => sum + (c.wordCount || 0), 0);
      const timestamp = this.manager.utils.formatTimestampVN(Date.now());

      if (format === 'json') {
        const jsonPayload = JSON.stringify(
          {
            exportedAt: Date.now(),
            totalChapters: list.length,
            totalWords,
            chapters: list
          },
          null,
          2
        );
        this.triggerBrowserDownload(
          `${bookTitle}_${list.length}_Chuong.json`,
          jsonPayload,
          'application/json;charset=utf-8'
        );
        return true;
      }

      if (format === 'html') {
        const esc = (s) => this.manager.utils.escapeHtml(s);
        const chaptersHtml = list
          .map(
            (c, idx) => `
            <article class="chapter-block" id="chap-${idx + 1}">
              <h2 class="chapter-title">${esc(c.displayTitle || c.title)}</h2>
              <div class="chapter-meta">${
                c.status === 'APPROVED' ? '✅ Đã duyệt' : '📝 Bản nháp'
              } • ${(c.wordCount || 0).toLocaleString('vi-VN')} từ</div>
              <div class="chapter-content">${esc(c.content || '')
                .split(/\r?\n\r?\n+/)
                .map((p) => `<p>${p.replace(/\r?\n/g, '<br/>')}</p>`)
                .join('\n')}</div>
            </article>
          `
          )
          .join('\n<hr class="chapter-divider"/>\n');

        const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(bookTitle)} — Bản Thảo Hoàn Chỉnh (${list.length} Chương)</title>
  <style>
    body { background: #0f0f12; color: #e4e4e7; font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.85; margin: 0; padding: 2rem 1rem; }
    .book-container { max-width: 760px; margin: 0 auto; background: #18181b; padding: 2.5rem; border-radius: 18px; border: 1px solid #27272a; }
    .book-header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .chapter-title { color: #34d399; font-size: 1.45rem; margin-bottom: 0.25rem; }
    .chapter-meta { color: #a1a1aa; font-size: 0.8rem; font-family: sans-serif; margin-bottom: 1.25rem; }
    .chapter-content p { margin: 0 0 1.15rem 0; text-align: justify; font-size: 1.08rem; }
    .chapter-divider { border: 0; border-top: 1px dashed #3f3f46; margin: 2.5rem 0; }
  </style>
</head>
<body>
  <div class="book-container">
    <header class="book-header">
      <h1>📖 Bản Thảo Tiểu Thuyết (${list.length} Chương)</h1>
      <p>Tổng số từ: ${totalWords.toLocaleString('vi-VN')} từ • Xuất bản lúc: ${esc(timestamp)}</p>
    </header>
    ${chaptersHtml}
  </div>
</body>
</html>`;

        this.triggerBrowserDownload(
          `${bookTitle}_${list.length}_Chuong.html`,
          fullHtml,
          'text/html;charset=utf-8'
        );
        return true;
      }

      if (format === 'md') {
        const mdBody = list
          .map(
            (c) =>
              `# ${c.displayTitle || c.title}\n\n${(c.content || '').trim()}\n`
          )
          .join('\n\n---\n\n');
        this.triggerBrowserDownload(
          `${bookTitle}_${list.length}_Chuong.md`,
          mdBody,
          'text/markdown;charset=utf-8'
        );
        return true;
      }

      const txtBody = list
        .map(
          (c) =>
            `====================================================================\n${
              c.displayTitle || c.title
            } (${(c.wordCount || 0).toLocaleString(
              'vi-VN'
            )} từ)\n====================================================================\n\n${(
              c.content || ''
            ).trim()}`
        )
        .join('\n\n\n');

      this.triggerBrowserDownload(
        `${bookTitle}_${list.length}_Chuong.txt`,
        txtBody,
        'text/plain;charset=utf-8'
      );
      return true;
    }

    triggerBrowserDownload(fileName, content, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  // ==========================================================================
  // PHẦN 6: BỘ TÌM KIẾM TOÀN TRUYỆN & DÀN Ý BẢNG TỔNG QUAN (OUTLINE MATRIX)
  // ==========================================================================
  class ChapterGlobalSearchAndOutlineMatrix {
    constructor(manager) {
      this.manager = manager;
    }

    /**
     * Tìm kiếm tức thì một cụm từ hoặc tên nhân vật trên tất cả các chương
     * (bao gồm tiêu đề, dàn ý beats và nội dung chính).
     */
    searchAcrossManuscript(rawQuery, options = {}) {
      const q = String(rawQuery || '').trim().toLowerCase();
      if (!q) return [];
      const utils = this.manager.utils;
      const stripQ = utils && typeof utils.stripVietnameseDiacritics === 'function'
        ? utils.stripVietnameseDiacritics(q).toLowerCase()
        : q;
      const fuzzyDiacritics = Boolean(options.fuzzyDiacritics);
      const maxMatchesPerChapter = Number(options.maxMatchesPerChapter || 5);
      const results = [];

      this.manager.chapters.forEach((chap, idx) => {
        const title = String(chap.displayTitle || chap.title || `Chương ${idx + 1}`);
        const content = String(chap.content || '');
        const beats = String(chap.beats || '');
        const matches = [];

        if (title.toLowerCase().includes(q)) {
          matches.push({
            location: 'TITLE',
            label: 'Tiêu đề chương',
            snippet: title,
            charIndex: 0
          });
        }

        if (beats.toLowerCase().includes(q)) {
          const pos = beats.toLowerCase().indexOf(q);
          matches.push({
            location: 'BEATS',
            label: 'Khung Dàn ý (Beats)',
            snippet: this.buildSnippet(beats, pos, q.length),
            charIndex: pos
          });
        }

        const hay = fuzzyDiacritics && utils && typeof utils.stripVietnameseDiacritics === 'function'
          ? utils.stripVietnameseDiacritics(content).toLowerCase()
          : content.toLowerCase();
        const needle = fuzzyDiacritics ? stripQ : q;

        let cursor = 0;
        let foundInBody = 0;
        while (foundInBody < maxMatchesPerChapter) {
          const hitPos = hay.indexOf(needle, cursor);
          if (hitPos === -1) break;
          matches.push({
            location: 'CONTENT',
            label: `Bản thảo (Vị trí ký tự #${hitPos + 1})`,
            snippet: this.buildSnippet(content, hitPos, needle.length),
            charIndex: hitPos
          });
          cursor = hitPos + Math.max(1, needle.length);
          foundInBody += 1;
        }

        if (matches.length > 0) {
          results.push({
            chapterId: chap.id,
            chapterIndex: idx + 1,
            chapterTitle: title,
            status: chap.status,
            matchesCount: matches.length,
            matches
          });
        }
      });

      return results;
    }

    buildSnippet(text, index, matchLen) {
      const start = Math.max(0, index - 48);
      const end = Math.min(text.length, index + matchLen + 68);
      const prefix = start > 0 ? '…' : '';
      const suffix = end < text.length ? '…' : '';
      return `${prefix}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
    }

    /**
     * Tổng hợp Bảng Dàn Ý Toàn Bộ Tiểu Thuyết (Series Outline Digest)
     * phục vụ Story Bible, RAG và Chế độ AI tổng hợp liên chương.
     */
    buildSeriesOutlineMatrix() {
      return this.manager.chapters.map((chap, idx) => {
        const wc = chap.wordCount || this.manager.utils.countVietnameseWords(chap.content || '');
        const teaser =
          this.manager.utils?.keywordExtractor?.buildSmartChapterTeaser?.(chap.content || '', 160) ||
          String(chap.content || '').slice(0, 160);
        return {
          order: idx + 1,
          id: chap.id,
          title: chap.displayTitle || chap.title || `Chương ${idx + 1}`,
          status: chap.status || 'DRAFT',
          wordCount: wc,
          beats: String(chap.beats || '').trim(),
          teaser,
          updatedAt: chap.updatedAt || Date.now()
        };
      });
    }
  }

  // ==========================================================================
  // PHẦN 7: LỚP CHỦ QUẢN CÂY BẢN THẢO & CỔNG DUYỆT HAI CHIỀU
  // ==========================================================================
  class ChapterRegistryAndApprovalGate {
    constructor() {
      this.NS = window.NoirStudio;
      this.chapters = [];
      this.storageKey =
        this.NS.constants?.STORAGE_KEYS?.CHAPTERS || 'noir_studio_chapters_v35';
      this.activeIdKey =
        this.NS.constants?.STORAGE_KEYS?.ACTIVE_CHAPTER_ID || 'noir_studio_active_chapter_v35';
      this.initialized = false;
      this._suppressSyncOnce = false;
    }

    get utils() {
      return (
        this.NS.utils || {
          escapeHtml: (s) => String(s ?? '').replace(/[&<>"']/g, ''),
          countVietnameseWords: (t) =>
            String(t || '').trim() ? String(t).trim().split(/\s+/).length : 0,
          countParagraphs: (t) =>
            String(t || '').trim() ? String(t).trim().split(/\n+/).length : 0,
          estimateReadingTimeMinutes: (w) => Math.max(1, Math.ceil((w || 0) / 240)),
          formatTimestampVN: (ts) =>
            window.NoirNovel?.i18n?.formatDateTime
              ? window.NoirNovel.i18n.formatDateTime(ts || Date.now(), { includeSeconds: true })
              : new Date(ts || Date.now()).toLocaleString('vi-VN'),
          formatRelativeTimeVN: (ts) =>
            window.NoirNovel?.utils?.formatRelativeTimeVN
              ? window.NoirNovel.utils.formatRelativeTimeVN(ts)
              : (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText('Vừa xong') : 'Vừa xong'),
          showToast: () => {},
          generateId: (p) => `${p || 'id'}_${Date.now()}`
        }
      );
    }

    get parser() {
      if (this.NS?.parser && typeof this.NS.parser.buildZeroTokenSummary === 'function') {
        return this.NS.parser;
      }
      if (this.NS?.docImporter?.parser && typeof this.NS.docImporter.parser.buildZeroTokenSummary === 'function') {
        return this.NS.docImporter.parser;
      }
      return {
        buildZeroTokenSummary: (text) => {
          const clean = String(text || '').replace(/\s+/g, ' ').trim();
          return clean.length > 260 ? `${clean.slice(0, 257)}...` : clean;
        }
      };
    }

    get idb() {
      return (
        this.NS?.idb || {
          set: async () => true,
          get: async () => null,
          delete: async () => true,
          getAll: async () => []
        }
      );
    }

    get fs() {
      return this.NS?.fs || this.NS?.fileSystem || null;
    }

    get rag() {
      return (
        this.NS?.rag || {
          rebuildIndexFromChapters: () => {}
        }
      );
    }

    getStoreName(key = 'CHAPTERS') {
      return this.NS?.constants?.STORES?.[key] || String(key || 'chapters').toLowerCase();
    }

    async persistAllChaptersToStorage() {
      if (typeof this.persistChapters === 'function') {
        return this.persistChapters();
      }
      return true;
    }

    ensureHelpersReady() {
      if (!this.metrics) this.metrics = new ChapterLiteraryMetricsCalculator(this.utils);
      if (!this.surgery) this.surgery = new ChapterSurgeryAndReorderEngine(this);
      if (!this.approvalGate) this.approvalGate = new BidirectionalApprovalGateController(this);
      if (!this.studioModal) this.studioModal = new ChapterStudioOperationsModalUI(this);
      if (!this.exporter) this.exporter = new ChapterManuscriptExporter(this);
      if (!this.outlineMatrix) this.outlineMatrix = new ChapterGlobalSearchAndOutlineMatrix(this);
    }

    /**
     * Nạp danh sách chương từ IndexedDB hoặc LocalStorage (tương thích mọi key cũ).
     */
    async loadChaptersFromStorage() {
      this.ensureHelpersReady();
      let deletedSet = new Set();
      try {
        const rawDel = localStorage.getItem('noir_v38_deleted_chapter_ids');
        const arrDel = rawDel ? JSON.parse(rawDel) : [];
        if (Array.isArray(arrDel)) deletedSet = new Set(arrDel.map(String));
      } catch (_) {}

      let idbLoaded = null;
      try {
        if (this.NS.idb && typeof this.NS.idb.getAll === 'function') {
          const storeName = this.NS.constants?.STORES?.CHAPTERS || 'chapters';
          const fromIdb = await this.NS.idb.getAll(storeName);
          if (Array.isArray(fromIdb) && fromIdb.length > 0) {
            idbLoaded = fromIdb.filter((c) => c && c.id && !deletedSet.has(String(c.id)));
          }
        }
      } catch (_) {
        // Fallback sang LocalStorage bên dưới
      }

      let lsLoaded = null;
      const candidateKeys = [
        this.storageKey,
        'noir_studio_chapters_v34',
        'noir_studio_chapters',
        'novelist_chapters_v1'
      ];
      for (let i = 0; i < candidateKeys.length; i += 1) {
        try {
          const raw = localStorage.getItem(candidateKeys[i]);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              lsLoaded = parsed.filter((c) => c && c.id && !deletedSet.has(String(c.id)));
              break;
            }
          }
        } catch (_) {
          // Bỏ qua key hỏng
        }
      }

      let loaded = null;
      if (idbLoaded && idbLoaded.length > 0 && lsLoaded && lsLoaded.length > 0) {
        const idbMap = new Map(idbLoaded.map((c) => [String(c.id), c]));
        const seen = new Set();
        loaded = [];
        for (const lsChap of lsLoaded) {
          const cid = String(lsChap.id);
          seen.add(cid);
          const idbChap = idbMap.get(cid);
          if (!idbChap || (Number(lsChap.updatedAt) || 0) >= (Number(idbChap.updatedAt) || 0)) {
            loaded.push(lsChap);
          } else {
            loaded.push(idbChap);
          }
        }
        for (const idbChap of idbLoaded) {
          const cid = String(idbChap.id);
          if (!seen.has(cid)) {
            loaded.push(idbChap);
          }
        }
      } else if (lsLoaded && lsLoaded.length > 0) {
        loaded = lsLoaded;
      } else if (idbLoaded && idbLoaded.length > 0) {
        loaded = idbLoaded;
      }

      if (!loaded || loaded.length === 0) {
        const defaultId = 'chap_intro_001';
        loaded = [
          {
            id: defaultId,
            title: 'Chương 1: Khởi đầu trong màn sương',
            displayTitle: 'Chương 1: Khởi đầu trong màn sương',
            order: 0,
            status: 'DRAFT',
            content: '',
            beats: '',
            notes: '',
            wordCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ];
      }

      this.chapters = loaded
        .map((c, idx) => this.normalizeChapterRecord(c, idx))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      let savedActiveId = null;
      try {
        savedActiveId = localStorage.getItem(this.activeIdKey);
      } catch (_) {
        savedActiveId = null;
      }

      const foundActive =
        this.chapters.find((c) => c.id === savedActiveId) || this.chapters[0];
      if (this.NS.state) {
        this.NS.state.activeChapterId = foundActive ? foundActive.id : null;
      }

      this.loadActiveChapterIntoEditor();
      this.renderChapterTreeAndQuickSwitcher();
      return this.chapters;
    }

    normalizeChapterRecord(raw, idx = 0) {
      const content = typeof raw?.content === 'string' ? raw.content : '';
      const title = String(raw?.displayTitle || raw?.title || `Chương ${idx + 1}`).trim();
      return {
        id: String(raw?.id || `chap_${Date.now()}_${idx}`),
        title,
        displayTitle: title,
        order: typeof raw?.order === 'number' ? raw.order : idx,
        status: raw?.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
        content,
        beats: typeof raw?.beats === 'string' ? raw.beats : '',
        notes: typeof raw?.notes === 'string' ? raw.notes : '',
        sceneMarkers: Array.isArray(raw?.sceneMarkers) ? raw.sceneMarkers : [],
        wordCount:
          typeof raw?.wordCount === 'number'
            ? raw.wordCount
            : this.utils.countVietnameseWords(content),
        createdAt: Number(raw?.createdAt) || Date.now(),
        updatedAt: Number(raw?.updatedAt) || Date.now()
      };
    }

    async persistChapters() {
      try {
        this.chapters.forEach((c, idx) => {
          c.order = idx;
          c.displayTitle = c.displayTitle || c.title;
          c.title = c.displayTitle;
          c.wordCount = this.utils.countVietnameseWords(c.content || '');
        });

        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.chapters));
          if (this.NS.state?.activeChapterId) {
            localStorage.setItem(this.activeIdKey, this.NS.state.activeChapterId);
          }
        } catch (_) {
          // Bỏ qua nếu LocalStorage đầy dung lượng (đã có IDB dự phòng)
        }

        if (this.NS.idb && typeof this.NS.idb.set === 'function') {
          const storeName = this.NS.constants?.STORES?.CHAPTERS || 'chapters';
          for (let i = 0; i < this.chapters.length; i += 1) {
            await this.NS.idb.set(storeName, this.chapters[i].id, this.chapters[i]);
          }
        }
        return true;
      } catch (_) {
        return false;
      }
    }

    getActiveChapter() {
      const activeId = this.NS.state?.activeChapterId;
      if (activeId) {
        const hit = this.chapters.find((c) => c.id === activeId);
        if (hit) return hit;
      }
      if (this.chapters.length > 0) {
        if (this.NS.state) this.NS.state.activeChapterId = this.chapters[0].id;
        return this.chapters[0];
      }
      return null;
    }

    getApprovedChapters() {
      return this.chapters.filter((c) => c.status === 'APPROVED');
    }

    getDraftChapters() {
      return this.chapters.filter((c) => c.status !== 'APPROVED');
    }

    getChapterById(id) {
      return this.chapters.find((c) => c.id === id) || null;
    }

    localizeDefaultChapterTitle(rawTitle) {
      const str = String(rawTitle || '').trim();
      if (!str) return str;
      const tr = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      // Dịch các tiêu đề chương mặc định / chương mẫu (Hồi 1, Hồi 2, Hồi 3: (CHAPTER 3), Chương X: Chương mới, Chương 1: Khởi đầu...)
      const isDefaultPattern =
        /^(?:Chương|Hồi|Chapter)\s*\d+(?:\s*[:：\-–]\s*(?:Chương mới|New Chapter|\(CHAPTER\s*\d+\)|Khởi đầu trong màn sương.*))?$/i.test(
          str
        ) ||
        /^第\s*\d+\s*[章回](?:\s*[:：\-–]\s*(?:新章节|新章節|新規章|\(CHAPTER\s*\d+\)))?$/i.test(str) ||
        /^제\s*\d+\s*[장회](?:\s*[:：\-–]\s*(?:새 챕터|\(CHAPTER\s*\d+\)))?$/i.test(str) ||
        str === 'Chương chưa đặt tên';
      return isDefaultPattern ? tr(str) : tr(str);
    }

    /**
     * Đồng bộ dữ liệu từ các ô soạn thảo trên màn hình Tab 1 vào object chương hiện tại.
     */
    syncEditorToActiveChapter() {
      if (this._suppressSyncOnce) return null;
      const chap = this.getActiveChapter();
      if (!chap || typeof document === 'undefined') return chap;

      const titleEl = document.getElementById('input-chapter-title');
      const contentEl = document.getElementById('textarea-chapter-content');
      const beatsEl = document.getElementById('textarea-chapter-beats');

      let changed = false;

      if (titleEl) {
        const nextTitle = String(titleEl.value || '').trim() || chap.displayTitle || 'Chương chưa đặt tên';
        const localizedCurrent = this.localizeDefaultChapterTitle(chap.displayTitle || chap.title || '');
        if (
          nextTitle !== chap.displayTitle &&
          nextTitle !== chap.title &&
          nextTitle !== localizedCurrent
        ) {
          chap.displayTitle = nextTitle;
          chap.title = nextTitle;
          changed = true;
        }
      }

      if (contentEl && contentEl.value !== chap.content) {
        chap.content = contentEl.value;
        chap.wordCount = this.utils.countVietnameseWords(chap.content);
        changed = true;
      }

      if (beatsEl && beatsEl.value !== chap.beats) {
        chap.beats = beatsEl.value;
        changed = true;
      }

      if (changed) {
        chap.updatedAt = Date.now();
        this.updateLiveWordStatsUI(chap.content);
        this.renderQuickSwitcherOnly();
      }
      return chap;
    }

    /**
     * Nạp dữ liệu từ chương đang được chọn vào giao diện soạn thảo Tab 1.
     */
    loadActiveChapterIntoEditor() {
      const chap = this.getActiveChapter();
      if (!chap || typeof document === 'undefined') return null;

      this._suppressSyncOnce = true;
      try {
        const titleEl = document.getElementById('input-chapter-title');
        const contentEl = document.getElementById('textarea-chapter-content');
        const beatsEl = document.getElementById('textarea-chapter-beats');

        if (titleEl) titleEl.value = this.localizeDefaultChapterTitle(chap.displayTitle || chap.title || '');
        if (contentEl) contentEl.value = chap.content || '';
        if (beatsEl) beatsEl.value = chap.beats || '';

        this.updateActiveStatusBadgeUI(chap);
        this.updateLiveWordStatsUI(chap.content || '');
      } finally {
        this._suppressSyncOnce = false;
      }

      if (this.NS.sceneBuilder && typeof this.NS.sceneBuilder.renderMarkersListUI === 'function') {
        try {
          this.NS.sceneBuilder.renderMarkersListUI();
        } catch (_) {
          // Bỏ qua nếu module 13 chưa sẵn sàng
        }
      }

      if (this.NS.bus && typeof this.NS.bus.emit === 'function') {
        const evt = this.NS.constants?.EVENTS?.CHAPTER_SELECTED || 'chapter:selected';
        this.NS.bus.emit(evt, { chapterId: chap.id, chapter: chap });
      }
      return chap;
    }

    updateActiveStatusBadgeUI(chap) {
      if (typeof document === 'undefined') return;
      const badgeEl = document.getElementById('active-chapter-status-badge');
      if (!badgeEl || !chap) return;
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      badgeEl.dataset.i18nIgnore = '1';
      if (chap.status === 'APPROVED') {
        badgeEl.textContent = tr('✅ Đã duyệt');
        badgeEl.className =
          'text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shrink-0 cursor-pointer';
      } else {
        badgeEl.textContent = tr('📝 Bản nháp');
        badgeEl.className =
          'text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 shrink-0 cursor-pointer';
      }
      badgeEl.title = tr('Nhấn để đổi nhanh trạng thái Bản nháp ⇄ Đã duyệt');
    }

    updateLiveWordStatsUI(text) {
      if (typeof document === 'undefined') return;
      const wc = this.utils.countVietnameseWords(text || '');
      const pc = this.utils.countParagraphs(text || '');
      const rt = this.utils.estimateReadingTimeMinutes(wc);
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));

      const wordEl = document.getElementById('stat-word-count');
      const paraEl = document.getElementById('stat-paragraph-count');
      const readEl = document.getElementById('stat-reading-time');

      if (wordEl) {
        wordEl.dataset.i18nIgnore = '1';
        wordEl.textContent = tr(`${fmtNum(wc)} từ`);
      }
      if (paraEl) {
        paraEl.dataset.i18nIgnore = '1';
        paraEl.textContent = tr(`${fmtNum(pc)} đoạn`);
      }
      if (readEl) {
        readEl.dataset.i18nIgnore = '1';
        readEl.textContent = tr(`~${rt} phút đọc`);
      }
    }

    selectChapter(chapterId) {
      this.syncEditorToActiveChapter();
      const target = this.chapters.find((c) => c.id === chapterId);
      if (!target) return null;

      if (this.NS.state) {
        this.NS.state.activeChapterId = target.id;
      }
      try {
        localStorage.setItem(this.activeIdKey, target.id);
      } catch (_) {
        // Bỏ qua
      }

      this.loadActiveChapterIntoEditor();
      this.renderChapterTreeAndQuickSwitcher();
      return target;
    }

    createNewChapter(customTitle = '', initialContent = '') {
      this.syncEditorToActiveChapter();
      const nextNum = this.chapters.length + 1;
      const tr = (s) =>
        window.NoirNovel?.i18n?.translateText
          ? window.NoirNovel.i18n.translateText(String(s || ''))
          : String(s || '');
      const title = String(customTitle || '').trim() || tr(`Chương ${nextNum}: Chương mới`);
      const newChap = this.normalizeChapterRecord(
        {
          id: `chap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title,
          displayTitle: title,
          order: this.chapters.length,
          status: 'DRAFT',
          content: String(initialContent || ''),
          beats: '',
          notes: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        this.chapters.length
      );

      this.chapters.push(newChap);
      if (this.NS.state) {
        this.NS.state.activeChapterId = newChap.id;
      }
      this.loadActiveChapterIntoEditor();
      this.renderChapterTreeAndQuickSwitcher();
      this.persistChapters();
      this.syncSingleChapterToDisk(newChap).catch(() => {});

      this.utils.showToast(`🌱 Đã tạo "${newChap.displayTitle}" & tự động tạo file trong thư mục công việc!`, 'success');
      return newChap;
    }

    sanitizeDiskSegment(rawName, fallback = 'Muc_Khong_Ten') {
      const cleaned = String(rawName || '')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/g, '');
      return (cleaned || fallback).slice(0, 90);
    }

    computeDiskSegmentsForChapter(chap) {
      const safeTitle = this.sanitizeDiskSegment(chap?.displayTitle || chap?.title || 'Chuong_Moi', 'Chuong_Moi');
      const level = String(chap?.hierarchyLevel || '').trim();
      const group = String(chap?.hierarchyGroup || '').trim();
      const parentVol = String(chap?.parentVolumeName || '').trim();

      if (level === 'volume' && group) {
        return { dirs: [this.sanitizeDiskSegment(group, 'Quyen_1')], fileName: `${safeTitle}.txt` };
      }
      if (level === 'chapter' && group) {
        const dirs = [];
        if (parentVol) dirs.push(this.sanitizeDiskSegment(parentVol, 'Quyen_1'));
        dirs.push(this.sanitizeDiskSegment(group, 'Chuong_1'));
        return { dirs, fileName: `${safeTitle}.txt` };
      }
      if (level === 'scene' && group) {
        const dirs = [];
        if (parentVol) dirs.push(this.sanitizeDiskSegment(parentVol, 'Quyen_1'));
        dirs.push(this.sanitizeDiskSegment(group, 'Chuong_Canh'));
        return { dirs, fileName: `${safeTitle}.txt` };
      }
      return { dirs: [], fileName: `${safeTitle}.txt` };
    }

    async _getHierarchyDiskRoot() {
      const fs = this.NS?.fsEngine || window.NoirStudio?.fsEngine;
      if (!fs || !fs.rootDirHandle) return null;
      try {
        return await fs.rootDirHandle.getDirectoryHandle('00_Thu_Muc_Quyen_Chuong_Canh', { create: true });
      } catch (_e) {
        return fs.rootDirHandle;
      }
    }

    async _removeDiskRelPath(rootDir, relPath) {
      if (!rootDir || !relPath) return;
      const parts = String(relPath).split('/').filter(Boolean);
      if (parts.length === 0) return;
      try {
        let dir = rootDir;
        for (let i = 0; i < parts.length - 1; i++) {
          dir = await dir.getDirectoryHandle(parts[i], { create: false });
        }
        await dir.removeEntry(parts[parts.length - 1], { recursive: true });
      } catch (_eRm) {}
    }

    async syncSingleChapterToDisk(chap, explicitOldRelPath = '') {
      if (!chap) return false;
      const rootDir = await this._getHierarchyDiskRoot();
      if (!rootDir) return false;
      try {
        const oldPath = explicitOldRelPath || chap._prevDiskRelPath || chap.diskRelPath || '';
        const { dirs, fileName } = this.computeDiskSegmentsForChapter(chap);
        let curDir = rootDir;
        for (const d of dirs) {
          curDir = await curDir.getDirectoryHandle(d, { create: true });
        }
        const newRelPath = [...dirs, fileName].join('/');
        const fh = await curDir.getFileHandle(fileName, { create: true });
        const writable = await fh.createWritable();
        await writable.write(String(chap.content || ''));
        await writable.close();

        if (oldPath && oldPath !== newRelPath) {
          await this._removeDiskRelPath(rootDir, oldPath);
        }
        chap.diskRelPath = newRelPath;
        chap.fileName = fileName;
        delete chap._prevDiskRelPath;
        return true;
      } catch (_eSync) {
        return false;
      }
    }

    async syncHierarchyFolderStructureToDisk() {
      const rootDir = await this._getHierarchyDiskRoot();
      if (!rootDir) return false;
      let okCount = 0;
      for (const chap of this.chapters) {
        const ok = await this.syncSingleChapterToDisk(chap);
        if (ok) okCount += 1;
      }
      return okCount > 0;
    }

    async syncFromDiskFolderIfConnected(showFeedback = true) {
      const rootDir = await this._getHierarchyDiskRoot();
      if (!rootDir) {
        if (showFeedback) {
          this.utils.showToast('📂 Hãy kết nối Thư mục công việc trên máy tính trước (Tab 6) để đồng bộ file 2 chiều!', 'info', 3400);
        }
        return { ok: false, updated: 0, added: 0 };
      }

      const foundFiles = [];
      const walkDir = async (dirHandle, relDirs = []) => {
        try {
          for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'directory') {
              await walkDir(handle, [...relDirs, name]);
            } else if (handle.kind === 'file' && /\.(txt|md)$/i.test(name)) {
              const file = await handle.getFile();
              const text = await file.text();
              foundFiles.push({
                relPath: [...relDirs, name].join('/'),
                dirs: relDirs,
                fileName: name,
                baseTitle: name.replace(/\.(txt|md)$/i, ''),
                text,
                lastModified: file.lastModified || Date.now()
              });
            }
          }
        } catch (_eWalk) {}
      };
      await walkDir(rootDir, []);

      if (foundFiles.length === 0) {
        await this.syncHierarchyFolderStructureToDisk();
        if (showFeedback) {
          this.utils.showToast('✅ Đã đẩy toàn bộ cấu trúc Quyển / Chương / Cảnh lên thư mục máy tính!', 'success', 2800);
        }
        return { ok: true, updated: 0, added: 0 };
      }

      let updated = 0;
      let added = 0;
      const byPath = new Map(this.chapters.map((c) => [c.diskRelPath || '', c]));
      const byTitle = new Map(this.chapters.map((c) => [this.sanitizeDiskSegment(c.displayTitle || c.title), c]));
      const persistMap = this.loadHierarchyMapFromStorage();

      for (const f of foundFiles) {
        const matched = byPath.get(f.relPath) || byTitle.get(this.sanitizeDiskSegment(f.baseTitle));
        if (matched) {
          let changed = false;
          if (f.baseTitle && matched.displayTitle !== f.baseTitle && f.relPath !== matched.diskRelPath) {
            matched.displayTitle = f.baseTitle;
            matched.title = f.baseTitle;
            changed = true;
          }
          if (f.text && f.lastModified > (matched.updatedAt || 0) + 1500 && f.text !== matched.content) {
            matched.content = f.text;
            matched.wordCount = this.utils.countVietnameseWords(f.text);
            matched.updatedAt = f.lastModified;
            changed = true;
          }
          if (f.dirs.length >= 1) {
            const topDir = f.dirs[0];
            if (matched.hierarchyGroup !== topDir) {
              matched.hierarchyLevel = f.dirs.length >= 2 ? 'scene' : 'volume';
              matched.hierarchyGroup = f.dirs[f.dirs.length - 1];
              if (f.dirs.length >= 2) matched.parentVolumeName = topDir;
              persistMap[matched.id] = {
                level: matched.hierarchyLevel,
                group: matched.hierarchyGroup,
                groupId: matched.hierarchyGroupId || `${matched.hierarchyLevel}_${Date.now()}`
              };
              changed = true;
            }
          }
          matched.diskRelPath = f.relPath;
          if (changed) updated += 1;
        } else {
          const newChap = this.normalizeChapterRecord(
            {
              id: `chap_disk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              title: f.baseTitle,
              displayTitle: f.baseTitle,
              order: this.chapters.length,
              status: 'DRAFT',
              content: f.text || '',
              beats: '',
              notes: '',
              diskRelPath: f.relPath,
              fileName: f.fileName,
              createdAt: f.lastModified,
              updatedAt: f.lastModified
            },
            this.chapters.length
          );
          if (f.dirs.length >= 1) {
            newChap.hierarchyLevel = f.dirs.length >= 2 ? 'scene' : 'volume';
            newChap.hierarchyGroup = f.dirs[f.dirs.length - 1];
            if (f.dirs.length >= 2) newChap.parentVolumeName = f.dirs[0];
            persistMap[newChap.id] = {
              level: newChap.hierarchyLevel,
              group: newChap.hierarchyGroup,
              groupId: `${newChap.hierarchyLevel}_${Date.now()}`
            };
          }
          this.chapters.push(newChap);
          added += 1;
        }
      }

      if (updated > 0 || added > 0) {
        this.saveHierarchyMapToStorage(persistMap);
        this.persistChapters();
        const activeEl = document.activeElement;
        const isTypingInEditor = Boolean(
          activeEl && (activeEl.id === 'textarea-chapter-content' || activeEl.id === 'input-chapter-title')
        );
        if (!isTypingInEditor) {
          this.loadActiveChapterIntoEditor();
        }
        this.renderChapterTreeAndQuickSwitcher();
      }
      await this.syncHierarchyFolderStructureToDisk();
      if (showFeedback) {
        this.utils.showToast(
          `🔄 Đồng bộ 2 chiều thư mục xong! (Cập nhật: ${updated} · Thêm mới từ ổ cứng: ${added})`,
          'success',
          3200
        );
      } else if (updated > 0 || added > 0) {
        this.utils.showToast(
          `🔄 Đã tự động đồng bộ 2 chiều với thư mục máy tính (+${added} mới · ${updated} cập nhật).`,
          'info',
          2600
        );
      }
      return { ok: true, updated, added };
    }

    renameChapter(chapterId, newTitle) {
      const chap = this.chapters.find((c) => c.id === chapterId);
      if (!chap) return false;
      const cleaned = String(newTitle || '').trim();
      if (!cleaned) return false;
      const oldDiskPath = chap.diskRelPath || '';

      chap.displayTitle = cleaned;
      chap.title = cleaned;
      chap.updatedAt = Date.now();

      if (this.NS.state?.activeChapterId === chap.id) {
        const titleEl = document.getElementById('input-chapter-title');
        if (titleEl && titleEl.value !== cleaned) {
          titleEl.value = cleaned;
        }
      }

      this.renderChapterTreeAndQuickSwitcher();
      this.persistChapters();
      this.syncSingleChapterToDisk(chap, oldDiskPath).catch(() => {});
      this.utils.showToast(`✏️ Đã đổi tên thành "${cleaned}" & đồng bộ tên file!`, 'success', 2400);
      return true;
    }

    async renameHierarchyGroup(level, oldGroupName, newGroupName) {
      const cleaned = String(newGroupName || '').trim();
      if (!cleaned || cleaned === oldGroupName) return false;
      const persistMap = this.loadHierarchyMapFromStorage();
      const affected = [];
      this.chapters.forEach((c) => {
        if ((c.hierarchyLevel || '') === level && (c.hierarchyGroup || '') === oldGroupName) {
          c._prevDiskRelPath = c.diskRelPath || '';
          c.hierarchyGroup = cleaned;
          persistMap[c.id] = {
            level,
            group: cleaned,
            groupId: c.hierarchyGroupId || `${level}_${Date.now()}`
          };
          affected.push(c);
        }
      });
      if (affected.length === 0) return false;

      this.saveHierarchyMapToStorage(persistMap);
      this.persistChapters();
      const rootDir = await this._getHierarchyDiskRoot();
      for (const chap of affected) {
        await this.syncSingleChapterToDisk(chap, chap._prevDiskRelPath || '');
      }
      if (rootDir) {
        const oldDirName = this.sanitizeDiskSegment(oldGroupName, '');
        if (oldDirName && oldDirName !== this.sanitizeDiskSegment(cleaned, '')) {
          try { await rootDir.removeEntry(oldDirName, { recursive: true }); } catch (_eRmOld) {}
        }
      }
      this.renderChapterTreeAndQuickSwitcher();
      const levelVi = level === 'volume' ? 'Quyển' : level === 'chapter' ? 'Chương' : 'Cảnh';
      this.utils.showToast(`✏️ Đã đổi tên ${levelVi} thành "${cleaned}" & đồng bộ thư mục!`, 'success', 2600);
      return true;
    }

    openInAppRenameModal({ title, subtitle, initialValue, onConfirm }) {
      if (typeof document === 'undefined' || !document.body) return;
      document.getElementById('modal-mod08-inline-rename')?.remove();
      const esc = (s) => this.utils.escapeHtml(String(s || ''));
      const modal = document.createElement('div');
      modal.id = 'modal-mod08-inline-rename';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.style.zIndex = '2147483200';
      modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5';
      modal.innerHTML = `
        <div class="w-full max-w-md rounded-2xl border-2 border-emerald-500/65 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden text-xs">
          <div class="px-4 py-3 border-b border-zinc-800 bg-emerald-950/60 flex items-center justify-between gap-2">
            <div class="font-extrabold text-sm text-emerald-300">${esc(title)}</div>
            <button type="button" id="btn-mod08-rename-close" class="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-rose-600 text-white font-bold">✕</button>
          </div>
          <div class="p-4 space-y-3">
            <p class="text-[11.5px] text-zinc-300 leading-relaxed">${esc(subtitle)}</p>
            <input id="input-mod08-rename-value" type="text" value="${esc(initialValue)}" class="w-full px-3 py-2.5 rounded-xl border-2 border-emerald-500/50 bg-zinc-900 text-sm font-bold text-white focus:outline-none focus:border-emerald-400 select-text" />
            <div class="flex items-center justify-end gap-2 pt-1">
              <button type="button" id="btn-mod08-rename-cancel" class="px-3.5 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-bold">Hủy</button>
              <button type="button" id="btn-mod08-rename-save" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow">✅ Lưu Tên &amp; Đồng Bộ File</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const inp = modal.querySelector('#input-mod08-rename-value');
      setTimeout(() => {
        inp?.focus();
        try { inp?.select(); } catch (_e) {}
      }, 20);
      const close = () => modal.remove();
      const submit = () => {
        const val = String(inp?.value || '').trim();
        close();
        if (val && val !== String(initialValue || '').trim()) {
          onConfirm?.(val);
        }
      };
      modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
      modal.querySelector('#btn-mod08-rename-close')?.addEventListener('click', close);
      modal.querySelector('#btn-mod08-rename-cancel')?.addEventListener('click', close);
      modal.querySelector('#btn-mod08-rename-save')?.addEventListener('click', submit);
      inp?.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); submit(); }
        if (ev.key === 'Escape') { ev.preventDefault(); close(); }
      });
    }

    promptInlineRenameChapter(chapterId) {
      const chap = this.chapters.find((c) => c.id === chapterId);
      if (!chap) return;
      const current = chap.displayTitle || chap.title || '';
      this.openInAppRenameModal({
        title: '✏️ Đổi Tên Chương / Cảnh',
        subtitle: 'Tên mới sẽ được cập nhật ngay trên giao diện và đồng bộ thẳng với tên file trong thư mục công việc trên máy tính.',
        initialValue: current,
        onConfirm: (nextVal) => this.renameChapter(chapterId, nextVal)
      });
    }

    promptInlineRenameGroup(level, oldGroupName) {
      const levelVi = level === 'volume' ? 'Quyển' : level === 'chapter' ? 'Chương' : 'Cảnh';
      this.openInAppRenameModal({
        title: `✏️ Đổi Tên ${levelVi}`,
        subtitle: `Tên mới cho ${levelVi} "${oldGroupName}" sẽ tự động đồng bộ lại tên thư mục tương ứng trên ổ cứng.`,
        initialValue: oldGroupName,
        onConfirm: (nextVal) => this.renameHierarchyGroup(level, oldGroupName, nextVal)
      });
    }

    async deleteChapter(chapterId) {
      if (this.chapters.length <= 1) {
        this.utils.showToast('⚠️ Bạn cần giữ lại ít nhất 1 chương trong dự án truyện!', 'warning');
        return false;
      }
      const idx = this.chapters.findIndex((c) => c.id === chapterId);
      if (idx === -1) return false;

      const target = this.chapters[idx];
      let confirmed = true;
      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      if (typeof this.NS.confirmDialog === 'function') {
        confirmed = await this.NS.confirmDialog({
          title: 'Xóa chương khỏi bản thảo?',
          message: `Bạn có chắc muốn xóa "${target.displayTitle}" (${fmtNum(target.wordCount || 0)} từ)?\nHệ thống vẫn có bản chụp an toàn trong Kho Phiên Bản Tab 6 nếu bạn muốn khôi phục sau.`,
          confirmLabel: 'Xóa chương này',
          cancelLabel: 'Giữ lại',
          danger: true
        });
      }
      if (!confirmed) return false;

      if (this.NS.versionVault && typeof this.NS.versionVault.createSnapshot === 'function') {
        try {
          this.NS.versionVault.createSnapshot(`Trước khi xóa: ${target.displayTitle}`, 'PRE_DELETE');
        } catch (_) {
          // Bỏ qua
        }
      }

      this.chapters.splice(idx, 1);
      try {
        const rawDel = localStorage.getItem('noir_v38_deleted_chapter_ids');
        const arrDel = rawDel ? JSON.parse(rawDel) : [];
        const delSet = new Set(Array.isArray(arrDel) ? arrDel.map(String) : []);
        delSet.add(String(target.id));
        localStorage.setItem('noir_v38_deleted_chapter_ids', JSON.stringify(Array.from(delSet).slice(-100)));
      } catch (_) {}
      try {
        if (this.NS.idb && typeof this.NS.idb.delete === 'function') {
          await this.NS.idb.delete(this.NS.constants?.STORES?.CHAPTERS || 'chapters', target.id);
        }
        await this.NS.fsEngine?.syncDeletedChapterFromDisk?.(target, idx);
      } catch (_) {
        // Bỏ qua
      }

      if (this.NS.state?.activeChapterId === target.id) {
        const nextChap = this.chapters[Math.min(idx, this.chapters.length - 1)] || this.chapters[0];
        this.NS.state.activeChapterId = nextChap ? nextChap.id : null;
        this.loadActiveChapterIntoEditor();
      }

      this.renderChapterTreeAndQuickSwitcher();
      await this.persistChapters();
      this.utils.showToast(`🗑️ Đã xóa "${target.displayTitle}".`, 'info');
      return true;
    }

    toggleChapterApprovalStatus(chapterId) {
      const chap = this.chapters.find((c) => c.id === chapterId) || this.getActiveChapter();
      if (!chap) return null;
      const nextStatus = chap.status === 'APPROVED' ? 'DRAFT' : 'APPROVED';
      chap.status = nextStatus;
      chap.updatedAt = Date.now();

      if (this.NS.state?.activeChapterId === chap.id) {
        this.updateActiveStatusBadgeUI(chap);
      }
      this.renderChapterTreeAndQuickSwitcher();
      this.persistChapters();

      const msg =
        nextStatus === 'APPROVED'
          ? `✅ Đã đưa "${chap.displayTitle}" vào danh sách Đã duyệt!`
          : `📝 Đã chuyển "${chap.displayTitle}" về lại trạng thái Bản nháp.`;
      this.utils.showToast(msg, 'success');
      return chap;
    }

    renderQuickSwitcherOnly() {
      if (typeof document === 'undefined') return;
      const switcher = document.getElementById('quick-chapter-switcher');
      if (!switcher) return;
      const activeId = this.NS.state?.activeChapterId;
      const esc = (s) => this.utils.escapeHtml(s);
      const tr = (s) => (window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(String(s || '')) : String(s || ''));
      const fmtNum = (n) => (window.NoirNovel?.i18n?.formatNumber ? window.NoirNovel.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      switcher.dataset.i18nIgnore = '1';
      switcher.title = tr('Chuyển nhanh giữa các chương');
      switcher.innerHTML = this.chapters
        .map((c) => {
          const badge = c.status === 'APPROVED' ? '✅' : '📝';
          const selected = c.id === activeId ? 'selected' : '';
          const locTitle = this.localizeDefaultChapterTitle(c.displayTitle || c.title);
          return `<option value="${esc(c.id)}" ${selected}>${badge} ${esc(locTitle)} (${esc(tr(`${fmtNum(c.wordCount || 0)} từ`))})</option>`;
        })
        .join('');
    }

    renderChapterTreeAndQuickSwitcher() {
      if (typeof document === 'undefined') return;
      this.ensureHelpersReady();
      this.renderQuickSwitcherOnly();

      const allCount = this.chapters.length;
      const draftCount = this.getDraftChapters().length;
      const approvedCount = this.getApprovedChapters().length;

      const cAllEl = document.getElementById('count-all-chapters');
      const cDraftEl = document.getElementById('count-draft-chapters');
      const cAppEl = document.getElementById('count-approved-chapters');
      if (cAllEl) cAllEl.textContent = String(allCount);
      if (cDraftEl) cDraftEl.textContent = String(draftCount);
      if (cAppEl) cAppEl.textContent = String(approvedCount);

      const filter = this.NS.state?.chapterFilter || 'ALL';
      document.querySelectorAll('.chapter-filter-btn').forEach((btn) => {
        const mode =
          btn.getAttribute('data-chapter-filter') || btn.getAttribute('data-filter') || 'ALL';
        const isSelected = mode === filter;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        if (isSelected) {
          btn.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');
          btn.classList.remove('text-zinc-400', 'hover:text-white', 'bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/40');
        } else {
          btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm', 'bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/40');
          btn.classList.add('text-zinc-400', 'hover:text-white');
        }
      });

      const treeContainer = document.getElementById('chapter-tree-container');
      if (!treeContainer) return;

      const filtered = this.chapters.filter((c) => {
        if (filter === 'APPROVED') return c.status === 'APPROVED';
        if (filter === 'DRAFT') return c.status !== 'APPROVED';
        return true;
      });

      if (filtered.length === 0) {
        const emptyMsg =
          filter === 'DRAFT'
            ? 'Hiện không có chương Bản nháp nào (tất cả chương đã được duyệt).'
            : filter === 'APPROVED'
            ? 'Chưa có chương nào ở trạng thái Đã duyệt chính thức.'
            : 'Chưa có chương nào trong bộ lọc hiện tại.';
        treeContainer.innerHTML = `
          <div class="p-4 text-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-400">
            ${emptyMsg}
          </div>
        `;
        window.NoirNovel?.i18n?.translateElement?.(treeContainer);
        return;
      }

      const activeId = this.NS.state?.activeChapterId;
      const esc = (s) => this.utils.escapeHtml(s);
      const hMap = this.loadHierarchyMapFromStorage();
      if (!this._selectedHierarchyIds) this._selectedHierarchyIds = new Set();
      const multiMode = Boolean(this._multiSelectHierarchyMode);

      // Đồng bộ phân cấp đã lưu vào từng chương
      this.chapters.forEach((c) => {
        const meta = hMap[c.id];
        if (meta && !c.hierarchyGroup) {
          c.hierarchyLevel = meta.level;
          c.hierarchyGroup = meta.group;
          c.hierarchyGroupId = meta.groupId;
        }
      });

      const hierarchyToolbarHtml = `
        <div id="mod08-hierarchy-toolbar" class="mb-2 p-2 rounded-xl border border-indigo-500/30 bg-indigo-950/25 space-y-2 text-[11px]">
          <div class="flex items-center justify-between gap-1.5 flex-wrap">
            <button type="button" id="btn-mod08-toggle-multiselect" class="px-2.5 py-1 rounded-lg border ${multiMode ? 'border-emerald-400 bg-emerald-600/30 text-emerald-200' : 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200'} font-bold transition">
              ${multiMode ? '☑️ Đang chọn nhiều (Bấm để tắt)' : '☑️ Chọn nhiều / Gộp Quyển-Chương-Cảnh'}
            </button>
            <span class="text-[10px] text-zinc-400">⠿ Kéo thả để đổi thứ tự</span>
          </div>
          ${multiMode ? `
            <div class="space-y-1.5 pt-1.5 border-t border-indigo-500/20">
              <div class="flex items-center gap-1.5">
                <input id="input-mod08-group-name" type="text" placeholder="Nhập tên Quyển / Chương / Cảnh..." value="${esc(this._lastHierarchyGroupInput || '')}" class="flex-1 min-w-0 px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-950 text-[11px] text-zinc-100 focus:outline-none focus:border-emerald-400" />
                <span class="text-[10px] font-mono text-emerald-300 shrink-0">Đã chọn: ${this._selectedHierarchyIds.size}</span>
              </div>
              <div class="flex flex-wrap items-center gap-1">
                <button type="button" data-mod08-group-level="volume" class="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition">📚 Gộp Quyển (Volume)</button>
                <button type="button" data-mod08-group-level="chapter" class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition">📖 Gộp Chương (Chapter)</button>
                <button type="button" data-mod08-group-level="scene" class="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] transition">🎬 Gộp Cảnh (Scene)</button>
                <button type="button" id="btn-mod08-ungroup-selected" class="px-2 py-1 rounded-lg border border-zinc-600 hover:bg-zinc-800 text-zinc-200 font-bold text-[10px] transition">🧹 Tách nhóm</button>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      let lastRenderedGroupKey = '';
      const cardsHtml = filtered
        .map((chap, displayIdx) => {
          const isActive = chap.id === activeId;
          const isApproved = chap.status === 'APPROVED';
          const isChecked = this._selectedHierarchyIds.has(chap.id);
          const borderCls = isActive
            ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-950/30'
            : isChecked
              ? 'border-indigo-400/75 bg-indigo-500/15'
              : 'border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-700';

          const hLevel = chap.hierarchyLevel || '';
          const hGroup = chap.hierarchyGroup || '';
          const groupKey = hGroup ? `${hLevel}::${hGroup}` : '';
          let groupHeaderHtml = '';
          if (groupKey && groupKey !== lastRenderedGroupKey) {
            const gBadgeCls =
              hLevel === 'volume'
                ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200'
                : hLevel === 'chapter'
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                  : 'border-amber-400/50 bg-amber-500/15 text-amber-200';
            const gIcon = hLevel === 'volume' ? '📚 Quyển' : hLevel === 'chapter' ? '📖 Chương' : '🎬 Cảnh';
            groupHeaderHtml = `<div data-action="dblclick-rename-group" data-group-level="${esc(hLevel)}" data-group-name="${esc(hGroup)}" title="Double-click hoặc bấm ✏️ để đổi tên ${gIcon} (đồng bộ tên thư mục)" class="mt-2 mb-1 px-2.5 py-1 rounded-lg border ${gBadgeCls} text-[10.5px] font-extrabold flex items-center justify-between gap-2 cursor-pointer select-none"><span class="truncate">${gIcon}: ${esc(hGroup)}</span><button type="button" data-action="rename-group" data-group-level="${esc(hLevel)}" data-group-name="${esc(hGroup)}" title="Đổi tên ${gIcon}" class="px-1.5 py-0.5 rounded bg-black/25 hover:bg-black/50 text-[10px] font-bold shrink-0">✏️ Sửa tên</button></div>`;
          }
          lastRenderedGroupKey = groupKey;

          const indentCls = hLevel === 'scene' ? 'ml-4' : hLevel === 'chapter' ? 'ml-2' : '';

          return `${groupHeaderHtml}
            <div draggable="true" data-chap-card="${esc(chap.id)}" class="group rounded-xl border p-2.5 transition cursor-pointer ${borderCls} ${indentCls}">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-1.5 min-w-0 flex-1">
                  <span class="mod08-drag-handle text-zinc-500 hover:text-emerald-300 cursor-grab select-none text-xs pt-0.5 shrink-0" title="Kéo thả để sắp xếp thứ tự">⠿</span>
                  ${multiMode ? `<input type="checkbox" data-action="toggle-select-chap" data-chap-id="${esc(chap.id)}" ${isChecked ? 'checked' : ''} class="mt-1 rounded border-indigo-400 text-indigo-500 focus:ring-0 shrink-0" />` : ''}
                  <div class="min-w-0 flex-1" data-action="select-chap" data-chap-id="${esc(chap.id)}">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-mono text-zinc-500 shrink-0">#${displayIdx + 1}</span>
                      <span data-i18n-ignore="true" data-action="dblclick-rename-chap" data-chap-id="${esc(chap.id)}" title="Double-click để đổi tên chương / cảnh nhanh" class="text-xs font-bold truncate ${isActive ? 'text-emerald-200' : 'text-zinc-200'}">${esc(this.localizeDefaultChapterTitle(chap.displayTitle || chap.title))}</span>
                    </div>
                    <div class="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 flex-wrap">
                      <span class="${isApproved ? 'text-emerald-400' : 'text-amber-400'} font-semibold">${isApproved ? '✅ Đã duyệt' : '📝 Nháp'}</span>
                      <span>•</span>
                      <span data-i18n-ignore="true">${esc(window.NoirNovel?.i18n?.translateText ? window.NoirNovel.i18n.translateText(`${window.NoirNovel.i18n.formatNumber(chap.wordCount || 0)} từ`) : `${(chap.wordCount || 0).toLocaleString('vi-VN')} từ`)}</span>
                      <button type="button" data-action="rename-chap" data-chap-id="${esc(chap.id)}" title="Đổi tên chương / cảnh (đồng bộ tên file)" class="px-1.5 py-0.5 rounded-md border border-zinc-700/80 bg-zinc-800/70 hover:bg-emerald-600/30 hover:border-emerald-400/60 text-zinc-200 hover:text-emerald-200 font-bold text-[9.5px] transition">✏️ Sửa tên</button>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                  <button type="button" data-action="toggle-status" data-chap-id="${esc(chap.id)}" title="${isApproved ? 'Chuyển về Bản nháp' : 'Duyệt thành bản chính thức'}" class="p-1 rounded-lg hover:bg-zinc-700/80 text-[11px]">${isApproved ? '↩️' : '✅'}</button>
                  <button type="button" data-action="move-up" data-chap-id="${esc(chap.id)}" title="Đưa lên trên" class="p-1 rounded-lg hover:bg-zinc-700/80 text-[11px]">▲</button>
                  <button type="button" data-action="move-down" data-chap-id="${esc(chap.id)}" title="Đưa xuống dưới" class="p-1 rounded-lg hover:bg-zinc-700/80 text-[11px]">▼</button>
                  <button type="button" data-action="delete-chap" data-chap-id="${esc(chap.id)}" title="Xóa chương này" class="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 text-[11px]">🗑️</button>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      treeContainer.innerHTML = hierarchyToolbarHtml + cardsHtml;

      document.getElementById('btn-mod08-toggle-multiselect')?.addEventListener('click', () => {
        this._multiSelectHierarchyMode = !this._multiSelectHierarchyMode;
        if (!this._multiSelectHierarchyMode) this._selectedHierarchyIds.clear();
        this.renderChapterTreeAndQuickSwitcher();
      });

      const groupNameInput = document.getElementById('input-mod08-group-name');
      if (groupNameInput) {
        groupNameInput.addEventListener('input', () => {
          this._lastHierarchyGroupInput = groupNameInput.value;
        });
      }

      treeContainer.querySelectorAll('[data-mod08-group-level]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const level = btn.getAttribute('data-mod08-group-level');
          const ids = Array.from(this._selectedHierarchyIds || []);
          if (ids.length === 0) {
            this.utils.showToast('⚠️ Hãy tick chọn ít nhất 1 chương trước khi gộp phân cấp!', 'warning', 2400);
            return;
          }
          const nameVal = document.getElementById('input-mod08-group-name')?.value || '';
          this.surgery?.groupChaptersIntoHierarchy?.(ids, level, nameVal);
        });
      });

      document.getElementById('btn-mod08-ungroup-selected')?.addEventListener('click', () => {
        const ids = Array.from(this._selectedHierarchyIds || []);
        if (ids.length === 0) {
          this.utils.showToast('⚠️ Hãy tick chọn ít nhất 1 chương để tách nhóm!', 'warning', 2200);
          return;
        }
        this.surgery?.ungroupChapters?.(ids);
      });

      treeContainer.querySelectorAll('[data-action="toggle-select-chap"]').forEach((chk) => {
        chk.addEventListener('click', (e) => e.stopPropagation());
        chk.addEventListener('change', () => {
          const cid = chk.getAttribute('data-chap-id');
          if (chk.checked) this._selectedHierarchyIds.add(cid);
          else this._selectedHierarchyIds.delete(cid);
          this.renderChapterTreeAndQuickSwitcher();
        });
      });

      // Drag & Drop sắp xếp thứ tự chương cực nhanh
      let draggingChapId = '';
      treeContainer.querySelectorAll('[data-chap-card]').forEach((card) => {
        card.addEventListener('dragstart', (e) => {
          draggingChapId = card.getAttribute('data-chap-card') || '';
          card.classList.add('opacity-50');
          try {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggingChapId);
          } catch (_eDt) {}
        });
        card.addEventListener('dragend', () => {
          card.classList.remove('opacity-50');
          treeContainer.querySelectorAll('[data-chap-card]').forEach((c) => c.classList.remove('ring-2', 'ring-emerald-400'));
          draggingChapId = '';
        });
        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          card.classList.add('ring-2', 'ring-emerald-400');
        });
        card.addEventListener('dragleave', () => {
          card.classList.remove('ring-2', 'ring-emerald-400');
        });
        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('ring-2', 'ring-emerald-400');
          const targetId = card.getAttribute('data-chap-card') || '';
          const srcId = draggingChapId || (e.dataTransfer ? e.dataTransfer.getData('text/plain') : '');
          if (srcId && targetId && srcId !== targetId) {
            this.surgery?.reorderChapterByDrop?.(srcId, targetId);
          }
        });
      });

      treeContainer.querySelectorAll('[data-action="select-chap"]').forEach((el) => {
        el.addEventListener('click', (e) => {
          if (e.target?.closest?.('button')) return;
          this.selectChapter(el.getAttribute('data-chap-id'));
        });
        el.addEventListener('dblclick', (e) => {
          if (e.target?.closest?.('button')) return;
          e.stopPropagation();
          this.promptInlineRenameChapter(el.getAttribute('data-chap-id'));
        });
      });

      treeContainer.querySelectorAll('[data-action="rename-chap"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.promptInlineRenameChapter(btn.getAttribute('data-chap-id'));
        });
      });

      treeContainer.querySelectorAll('[data-action="rename-group"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.promptInlineRenameGroup(
            btn.getAttribute('data-group-level') || 'volume',
            btn.getAttribute('data-group-name') || ''
          );
        });
      });

      treeContainer.querySelectorAll('[data-action="dblclick-rename-group"]').forEach((hdr) => {
        hdr.addEventListener('dblclick', (e) => {
          if (e.target?.closest?.('button')) return;
          e.stopPropagation();
          this.promptInlineRenameGroup(
            hdr.getAttribute('data-group-level') || 'volume',
            hdr.getAttribute('data-group-name') || ''
          );
        });
      });

      treeContainer.querySelectorAll('[data-action="toggle-status"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleChapterApprovalStatus(btn.getAttribute('data-chap-id'));
        });
      });

      treeContainer.querySelectorAll('[data-action="move-up"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cid = btn.getAttribute('data-chap-id');
          if (this.surgery && typeof this.surgery.moveChapter === 'function') {
            this.surgery.moveChapter(cid, -1);
          }
        });
      });

      treeContainer.querySelectorAll('[data-action="move-down"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cid = btn.getAttribute('data-chap-id');
          if (this.surgery && typeof this.surgery.moveChapter === 'function') {
            this.surgery.moveChapter(cid, 1);
          }
        });
      });

      treeContainer.querySelectorAll('[data-action="delete-chap"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteChapter(btn.getAttribute('data-chap-id'));
        });
      });

      window.NoirNovel?.i18n?.translateElement?.(treeContainer);
    }

    loadHierarchyMapFromStorage() {
      try {
        const raw = localStorage.getItem('noir_v40_chapter_hierarchy_v1');
        return raw ? JSON.parse(raw) || {} : {};
      } catch (_eH) {
        return {};
      }
    }

    saveHierarchyMapToStorage(mapObj) {
      try {
        localStorage.setItem('noir_v40_chapter_hierarchy_v1', JSON.stringify(mapObj || {}));
      } catch (_eHs) {}
    }

    bindDomEvents() {
      if (typeof document === 'undefined') return;
      const bind = (id, evt, handler) => {
        const el = document.getElementById(id);
        if (!el || el.dataset[`noirMod08_${evt}`]) return;
        el.dataset[`noirMod08_${evt}`] = '1';
        el.addEventListener(evt, handler);
      };

      bind('btn-new-draft-chapter', 'click', () => this.createNewChapter());
      bind('btn-tab1-quick-new-chapter', 'click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        const created = this.createNewChapter();
        if (created) {
          const titleInput = document.getElementById('input-chapter-title');
          if (titleInput) {
            titleInput.focus();
            try { titleInput.select(); } catch (_e) {}
          }
          this.utils.showToast(
            `✨ Đã tạo "${created.displayTitle || 'Chương mới'}"! Bạn có thể bắt đầu gõ ngay tại Bàn Viết Truyện.`,
            'success',
            3200
          );
        }
      });

      bind('quick-chapter-switcher', 'change', (e) => {
        this.selectChapter(e.target.value);
      });

      bind('input-chapter-title', 'input', (e) => {
        const chap = this.getActiveChapter();
        if (!chap || this._suppressSyncOnce) return;
        const val = String(e.target.value || '').trim();
        chap.displayTitle = val || 'Chương chưa đặt tên';
        chap.title = chap.displayTitle;
        chap.updatedAt = Date.now();
        this.renderQuickSwitcherOnly();
        if (this.NS.autoSaver?.markWorkspaceDirtyAndScheduleSave) {
          this.NS.autoSaver.markWorkspaceDirtyAndScheduleSave(850);
        } else if (this.NS.autoSaver?.scheduleDebouncedSave) {
          this.NS.autoSaver.scheduleDebouncedSave(850);
        }
      });

      bind('textarea-chapter-content', 'input', (e) => {
        if (this._suppressSyncOnce) return;
        const chap = this.getActiveChapter();
        if (chap) {
          chap.content = e.target.value;
          chap.wordCount = this.utils.countVietnameseWords(chap.content);
          chap.updatedAt = Date.now();
          this.updateLiveWordStatsUI(chap.content);
        }
        if (this.NS.autoSaver?.markWorkspaceDirtyAndScheduleSave) {
          this.NS.autoSaver.markWorkspaceDirtyAndScheduleSave(850);
        } else if (this.NS.autoSaver?.scheduleDebouncedSave) {
          this.NS.autoSaver.scheduleDebouncedSave(850);
        }
      });

      bind('textarea-chapter-beats', 'input', (e) => {
        if (this._suppressSyncOnce) return;
        const chap = this.getActiveChapter();
        if (chap) {
          chap.beats = e.target.value;
          chap.updatedAt = Date.now();
        }
        if (this.NS.autoSaver?.markWorkspaceDirtyAndScheduleSave) {
          this.NS.autoSaver.markWorkspaceDirtyAndScheduleSave(850);
        } else if (this.NS.autoSaver?.scheduleDebouncedSave) {
          this.NS.autoSaver.scheduleDebouncedSave(850);
        }
      });

      bind('active-chapter-status-badge', 'click', () => {
        const chap = this.getActiveChapter();
        if (chap) this.toggleChapterApprovalStatus(chap.id);
      });

      document.querySelectorAll('.chapter-filter-btn').forEach((btn) => {
        if (btn.dataset.noirMod08FilterBound) return;
        btn.dataset.noirMod08FilterBound = '1';
        btn.addEventListener('click', () => {
          if (this.NS.state) {
            this.NS.state.chapterFilter =
              btn.getAttribute('data-chapter-filter') || btn.getAttribute('data-filter') || 'ALL';
          }
          this.renderChapterTreeAndQuickSwitcher();
        });
      });

      bind('btn-open-chapter-studio-ops', 'click', () => {
        this.ensureHelpersReady();
        if (this.studioModal && typeof this.studioModal.openModal === 'function') {
          this.studioModal.openModal();
        }
      });

      // Nút thu gọn / mở lại Danh Sách Chương Tab 2 sang bên trái
      const setSidebarCollapsed = (collapsed) => {
        const aside = document.getElementById('left-sidebar-pane');
        const expandBtn = document.getElementById('btn-tab2-expand-sidebar');
        if (aside) aside.classList.toggle('noir-sidebar-collapsed', Boolean(collapsed));
        if (expandBtn) expandBtn.classList.toggle('hidden', !collapsed);
        try { localStorage.setItem('noir_v106_tab2_sidebar_collapsed', collapsed ? '1' : '0'); } catch (_e) {}
      };
      bind('btn-tab2-collapse-sidebar', 'click', () => setSidebarCollapsed(true));
      bind('btn-tab2-expand-sidebar', 'click', () => setSidebarCollapsed(false));

      // Tự động ẩn nút mở sidebar nếu chuyển sang tab không dùng sidebar (lắng nghe đúng sự kiện nav:screen_changed của Mod 29!)
      const syncExpandBtnForScreen = (payload) => {
        const aside = document.getElementById('left-sidebar-pane');
        const expandBtn = document.getElementById('btn-tab2-expand-sidebar');
        if (!expandBtn) return;
        const scr =
          (typeof payload === 'string' ? payload : payload?.screenId || '') ||
          document.body?.dataset?.activeScreen ||
          this.NS?.state?.activeScreen ||
          '';
        const isTab2 = scr === 'SCREEN_2_FILES' || scr === 'SCREEN_2_SOURCES';
        const isCollapsed = Boolean(aside?.classList.contains('noir-sidebar-collapsed'));
        expandBtn.classList.toggle('hidden', !(isTab2 && isCollapsed));
      };
      const scrEvt = this.NS?.constants?.EVENTS?.SCREEN_CHANGED || 'nav:screen_changed';
      this.NS.bus?.on?.(scrEvt, syncExpandBtnForScreen);
      if (scrEvt !== 'screen:changed') {
        this.NS.bus?.on?.('screen:changed', syncExpandBtnForScreen);
      }
      setTimeout(() => syncExpandBtnForScreen(), 250);

      // Đồng bộ 2 chiều TỰ ĐỘNG ngầm giữa thư mục Quyển / Chương / Cảnh trên máy tính và App (không cần nút bấm thủ công!)
      if (!this._v113AutoDiskSyncBound) {
        this._v113AutoDiskSyncBound = true;
        this._v113LastAutoDiskSyncAt = 0;
        this._v113AutoDiskSyncBusy = false;
        const runSilentAutoDiskSync = async () => {
          try {
            if (this._v113AutoDiskSyncBusy) return;
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
            const fs = this.NS?.localFS;
            if (!fs || !fs.directoryHandle || !fs.isConnected) return;
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.id === 'textarea-chapter-content' || activeEl.id === 'input-chapter-title')) {
              return;
            }
            const now = Date.now();
            if (now - (this._v113LastAutoDiskSyncAt || 0) < 4000) return;
            this._v113AutoDiskSyncBusy = true;
            this._v113LastAutoDiskSyncAt = now;
            await this.syncFromDiskFolderIfConnected(false);
          } catch (_eAutoSync) {
          } finally {
            this._v113AutoDiskSyncBusy = false;
          }
        };
        window.addEventListener('focus', () => {
          setTimeout(() => { runSilentAutoDiskSync(); }, 350);
        });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            setTimeout(() => { runSilentAutoDiskSync(); }, 350);
          }
        });
        setInterval(() => {
          runSilentAutoDiskSync();
        }, 8500);
      }

      // Đồng bộ đổi tên tiêu đề chương tại Tab 1 xuống tên file khi blur
      bind('input-chapter-title', 'change', (e) => {
        const chap = this.getActiveChapter();
        if (!chap || this._suppressSyncOnce) return;
        const cleaned = String(e.target.value || '').trim();
        if (cleaned) {
          this.syncSingleChapterToDisk(chap).catch(() => {});
          this.renderChapterTreeAndQuickSwitcher();
        }
      });
    }

    async init() {
      if (this.initialized) return this;
      this.initialized = true;
      this.ensureHelpersReady();
      this.bindDomEvents();
      await this.loadChaptersFromStorage();
      if (!this._i18nBound) {
        this._i18nBound = true;
        const syncLang = () => {
          try {
            const activeChap = this.getActiveChapter();
            if (activeChap) {
              const titleEl = document.getElementById('input-chapter-title');
              if (titleEl) {
                titleEl.value = this.localizeDefaultChapterTitle(
                  activeChap.displayTitle || activeChap.title || ''
                );
              }
            }
            this.renderChapterTreeAndQuickSwitcher();
            this.updateActiveStatusBadgeUI(activeChap);
            const ed = document.getElementById('textarea-chapter-content');
            if (ed) this.updateLiveWordStatsUI(ed.value || '');
            const studioModal = document.getElementById(this.studioModal?.modalId || 'modal-mod08-chapter-studio');
            if (studioModal && !studioModal.classList.contains('hidden')) {
              this.studioModal.renderModalContent();
              window.NoirNovel?.i18n?.translateElement?.(studioModal);
            }
          } catch {}
        };
        this.NS.bus?.on?.('i18n:changed', syncLang);
        window.addEventListener?.('noir:i18n:changed', syncLang);
      }
      return this;
    }
  }

  // ==========================================================================
  // PHẦN 8: KIỂM TOÁN CÂN BẰNG ĐỘ DÀI CHƯƠNG & TIẾN ĐỘ TOÀN BỘ TẬP TRUYỆN
  // ==========================================================================
  class ChapterBookBalanceAndTitleAuditor {
    constructor(manager) {
      this.manager = manager;
    }

    auditManuscriptPacingAndTitles() {
      const list = Array.isArray(this.manager.chapters) ? this.manager.chapters : [];
      if (list.length === 0) {
        return {
          totalChapters: 0,
          totalWords: 0,
          avgWordsPerChapter: 0,
          genericTitleIds: [],
          shortChapterIds: [],
          longChapterIds: [],
          advice: ['Hãy tạo chương đầu tiên để bắt đầu kiểm toán bố cục tập truyện.']
        };
      }

      const wordCounts = list.map((c) => c.wordCount || this.manager.utils.countVietnameseWords(c.content || ''));
      const totalWords = wordCounts.reduce((a, b) => a + b, 0);
      const nonEmptyCounts = wordCounts.filter((w) => w > 0);
      const avgWordsPerChapter =
        nonEmptyCounts.length > 0
          ? Math.round(nonEmptyCounts.reduce((a, b) => a + b, 0) / nonEmptyCounts.length)
          : 0;

      const genericTitleIds = [];
      const shortChapterIds = [];
      const longChapterIds = [];

      list.forEach((chap, idx) => {
        const wc = wordCounts[idx];
        const title = String(chap.displayTitle || chap.title || '').trim();
        if (/^(chương mới|untitled|chương \d+\s*:?\s*chương mới|bản nháp)/i.test(title)) {
          genericTitleIds.push(chap.id);
        }
        if (wc > 0 && avgWordsPerChapter >= 800 && wc < avgWordsPerChapter * 0.45) {
          shortChapterIds.push({ id: chap.id, title, wordCount: wc });
        }
        if (wc > 0 && avgWordsPerChapter >= 800 && wc > avgWordsPerChapter * 2.15) {
          longChapterIds.push({ id: chap.id, title, wordCount: wc });
        }
      });

      const advice = [];
      if (genericTitleIds.length > 0) {
        advice.push(
          `Có ${genericTitleIds.length} chương vẫn đang để tiêu đề tạm ("Chương mới"). Hãy đặt tên giàu gợi hình để độc giả dễ nhớ.`
        );
      }
      if (shortChapterIds.length > 0) {
        advice.push(
          `${shortChapterIds.length} chương ngắn bất thường dưới 45% độ dài trung bình (~${avgWordsPerChapter} từ/chương): cân nhắc gộp hoặc bồi đắp thêm cảnh tâm lý.`
        );
      }
      if (longChapterIds.length > 0) {
        advice.push(
          `${longChapterIds.length} chương rất dài (> 215% trung bình): có thể dùng công cụ Tách Chương Tại Con Trỏ để chia nhịp đọc nhẹ nhàng hơn.`
        );
      }
      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      if (advice.length === 0) {
        advice.push(`Bố cục ${list.length} chương cân đối (${fmtNum(totalWords)} từ tổng cộng, trung bình ${fmtNum(avgWordsPerChapter)} từ/chương).`);
      }

      return {
        totalChapters: list.length,
        totalWords,
        avgWordsPerChapter,
        genericTitleIds,
        shortChapterIds,
        longChapterIds,
        advice
      };
    }

    getFormattedSummaryText() {
      const report = this.auditManuscriptPacingAndTitles();
      const fmtNum = (n) => (window.NoirStudio?.i18n?.formatNumber ? window.NoirStudio.i18n.formatNumber(n) : Number(n || 0).toLocaleString('vi-VN'));
      return [
        `📚 TỔNG QUAN BỐ CỤC: ${report.totalChapters} chương • ${fmtNum(report.totalWords)} từ`,
        `⚖️ Độ dài trung bình: ${fmtNum(report.avgWordsPerChapter)} từ/chương`,
        ...report.advice.map((line) => `• ${line}`)
      ].join('\n');
    }
  }

  const chapterManager = new ChapterRegistryAndApprovalGate();
  chapterManager.bookAuditor = new ChapterBookBalanceAndTitleAuditor(chapterManager);
  window.NoirStudio.ChapterBookBalanceAndTitleAuditor = ChapterBookBalanceAndTitleAuditor;
  window.NoirStudio.ChapterLiteraryMetricsCalculator = ChapterLiteraryMetricsCalculator;
  window.NoirStudio.ChapterSurgeryAndReorderEngine = ChapterSurgeryAndReorderEngine;
  window.NoirStudio.BidirectionalApprovalGateController = BidirectionalApprovalGateController;
  window.NoirStudio.ChapterStudioOperationsModalUI = ChapterStudioOperationsModalUI;
  window.NoirStudio.ChapterManuscriptExporter = ChapterManuscriptExporter;
  window.NoirStudio.ChapterGlobalSearchAndOutlineMatrix = ChapterGlobalSearchAndOutlineMatrix;
  window.NoirStudio.ChapterRegistryAndApprovalGate = ChapterRegistryAndApprovalGate;
  window.NoirStudio.chapterManager = chapterManager;
  window.NoirStudio.chapterTree = chapterManager;

  if (typeof window.NoirStudio.registerModule === 'function') {
    window.NoirStudio.registerModule('mod08', chapterManager);
  }
})();
