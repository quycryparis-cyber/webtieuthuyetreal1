/**
 * ============================================================================
 * 🧠 AUTOTESTER INTELLIGENCE LAYER
 * (plainVietnameseMap + ruleKnowledgeBase + improvementLoopEngine)
 * ============================================================================
 * - 100% tiếng Việt đời thường trên giao diện (cấm thuật ngữ kỹ thuật).
 * - Kho tri thức kê đơn sửa code chuẩn cho Antigravity.
 * - Chấm điểm 4 cột (40/25/20/15), lưu mốc 20 vòng, phát hiện Hồi quy (Regression)
 *   và xuất "Đơn thuốc kỹ thuật" chuẩn Markdown.
 * ============================================================================
 */
(function initAutoTesterIntelligence(globalScope) {
  'use strict';

  const AT = (globalScope.__NoirAutoTesterNS = globalScope.__NoirAutoTesterNS || {});

  // 1. TỪ ĐIỂN BẮT BUỘC CHO FRONT-END (100% TIẾNG VIỆT ĐỜI THƯỜNG)
  const PLAIN_VI_MAP = Object.freeze({
    runAll: 'Khám tổng quát',
    runAllFull: 'Khám tổng quát toàn bộ app',
    testCurrent: 'Kiểm tra trang này',
    stop: 'Dừng ngay',
    recorder: 'Quay lại thao tác mẫu',
    selfHeal: 'Tự tìm nút nếu bị đổi chỗ',
    chaos: 'Thử bấm phá & nạp file hỏng',
    visualDiff: 'Soi giao diện bị lệch hình',
    smoothness: 'Độ mượt khi vuốt & bấm',
    memory: 'Mức ngốn máy',
    overflowTouch: 'Khung hình & Độ dễ bấm',
    offlineSim: 'Thử giả lập rớt mạng',
    regressionTitle: 'Cảnh báo: Sửa chỗ kia làm hỏng chỗ này',
    sevP0: '🔴 Lỗi nặng (Sửa ngay)',
    sevP1: '🟠 Nên sửa sớm',
    sevP2: '🟡 Gợi ý cho mượt hơn',
    breadcrumbsBtn: 'Xem lại 15 bước trước khi hỏng',
    highlightBtn: '🎯 Chỉ thẳng chỗ bị lỗi',
    copyRxBtn: '📋 Chép đơn thuốc gửi AI sửa lỗi',
    devDetailsBtn: 'Xem chi tiết cho lập trình viên',
  });

  // 2. KHO TRI THỨC TỰ KÊ ĐƠN SỬA CODE (ruleKnowledgeBase)
  const RULE_KNOWLEDGE_BASE = Object.freeze({
    ERR_CONSOLE_RUNTIME: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Có lỗi chạy ngầm khiến một phần tính năng có thể hỏng',
      plainDesc: 'Hệ thống phát hiện lỗi bất ngờ xảy ra bên dưới khi bạn vừa bấm thao tác.',
      fixAdvice: 'Kiểm tra stack trace, bổ sung optional chaining (?.) / try-catch và kiểm tra null cho phần tử DOM tại tệp gây lỗi.',
    },
    ERR_MOBILE_OVERFLOW: {
      severity: 'P0',
      pillar: 'visual',
      plainTitle: 'Khung màn hình bị tràn ra ngoài mép phải',
      plainDesc: 'Có một ô hoặc thanh nút dài hơn màn hình nên phải kéo ngang mới thấy hết.',
      fixAdvice: 'Thêm `min-w-0`, `max-w-full`, `overflow-x-hidden` hoặc `flex-wrap` cho phần tử vượt khung trên `@media (max-width: 768px)`.',
    },
    ERR_FLOATING_OVERLAP: {
      severity: 'P1',
      pillar: 'visual',
      plainTitle: 'Các thanh nổi góc màn hình đang đè lên nhau',
      plainDesc: 'Hai thanh công cụ nổi chạm vào nhau làm che mất nút bấm bên dưới.',
      fixAdvice: 'Tách tọa độ `bottom` / `left` / `right` riêng biệt trong `@media (max-width: 639px)` và giới hạn `max-width` cho từng thanh nổi.',
    },
    WARN_SMALL_TOUCH_TARGET: {
      severity: 'P2',
      pillar: 'visual',
      plainTitle: 'Có nút bấm hơi nhỏ trên điện thoại, dễ bấm trượt',
      plainDesc: 'Một số nút bấm nhỏ hơn đầu ngón tay chuẩn nên trên màn hình điện thoại hơi khó chạm trúng.',
      fixAdvice: 'Tăng kích thước vùng chạm lên tối thiểu `min-width: 44px; min-height: 44px` trên màn hình nhỏ và cách nút kế bên tối thiểu `8px`.',
    },
    WARN_MAIN_THREAD_JANK: {
      severity: 'P1',
      pillar: 'smoothness',
      plainTitle: 'Màn hình hơi bị khựng khi vuốt hoặc bấm',
      plainDesc: 'Tốc độ khung hình tụt thấp hoặc có thao tác làm máy đứng hình nhẹ trên 0.1 giây.',
      fixAdvice: 'Tách tác vụ nặng bằng `requestIdleCallback` / chunk async, tạm dừng Canvas 60FPS khi ẩn và bật Mod 47 Auto-Sleep.',
    },
    WARN_UNREVOKED_BLOBS: {
      severity: 'P1',
      pillar: 'smoothness',
      plainTitle: 'Máy đang giữ tệp tạm trong bộ nhớ chưa dọn',
      plainDesc: 'Một số tệp ảnh hoặc PDF tạm tạo ra xong chưa được thu hồi lại bộ nhớ.',
      fixAdvice: 'Gọi `URL.revokeObjectURL(url)` ngay khi đóng hộp thoại xem trước, đổi công cụ hoặc kết thúc phiên xử lý file.',
    },
    ERR_PDF_OUTPUT_INVALID: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Xuất hoặc xử lý file PDF không thành công',
      plainDesc: 'Tệp kết quả bị rỗng (0 byte) hoặc không đúng định dạng PDF chuẩn.',
      fixAdvice: 'Kiểm tra `mod46_danglovepdf_and_doc_converter.js` / `mod26`: đảm bảo vẽ tiếng Việt qua Canvas Unicode hoặc nhúng font đầy đủ và trả về `Blob` có chữ ký `%PDF`.',
    },
    ERR_CHAOS_BAD_FILE_CRASH: {
      severity: 'P1',
      pillar: 'resilience',
      plainTitle: 'Khi nạp file hỏng/rỗng app chưa báo lỗi lịch sự',
      plainDesc: 'Thử đưa file rỗng 0 byte vào mà không thấy thông báo nhắc người dùng hoặc bị lỗi ngầm.',
      fixAdvice: 'Kiểm tra `file.size === 0` và kiểm tra Magic Bytes đầu file trước khi nạp vào parser PDF/DOCX/Ảnh, hiện toast cảnh báo rõ ràng.',
    },
    ERR_CHAOS_DOUBLE_CLICK: {
      severity: 'P1',
      pillar: 'resilience',
      plainTitle: 'Bấm đúp siêu nhanh có nguy cơ chạy trùng 2 lần',
      plainDesc: 'Nút xử lý chưa khóa tạm khi đang chạy nên bấm 2 cái liên tiếp dễ tạo dữ liệu lặp.',
      fixAdvice: 'Thêm cờ khóa `isBusy` hoặc thuộc tính `disabled` tạm thời trong suốt lúc tác vụ bất đồng bộ đang chạy.',
    },
    ERR_OFFLINE_FREEZE: {
      severity: 'P1',
      pillar: 'resilience',
      plainTitle: 'Khi mất mạng bất ngờ giao diện phản ứng chưa mượt',
      plainDesc: 'Giả lập rớt mạng ghi nhận lỗi không được bắt gọn gàng.',
      fixAdvice: 'Bọc toàn bộ lời gọi `fetch()` bằng `try/catch` + timeout `AbortController`, hiển thị thông báo tiếng Việt thân thiện khi offline.',
    },
    ERR_CHATBOT_PINGPONG: {
      severity: 'P0',
      pillar: 'functional',
      plainTitle: 'Trợ lý AI Viên Bi Số 8 trả lời chưa đúng ngữ cảnh trang web',
      plainDesc: 'Hỏi về tính năng trang web nhưng trợ lý lại từ chối hoặc đẩy qua chế độ khác.',
      fixAdvice: 'Kiểm tra `classifyChatMessageIntent` và `STUDIO_USAGE_KNOWLEDGE_BASE` trong `mod27_mascot_bi_so_8_and_dual_chat_assistant.js`.',
    },
    ERR_MISSING_COPY_SELECT_ALL: {
      severity: 'P1',
      pillar: 'functional',
      plainTitle: 'Khung soạn/câu lệnh thiếu nút Chọn tất cả hoặc Sao chép tất cả',
      plainDesc: 'Một khung câu lệnh, đầu ra AI hoặc Story Bible chưa có đủ 2 nút chọn hết & chép hết.',
      fixAdvice: 'Bổ sung tự động 2 nút `☑️ Chọn tất cả` và `📋 Sao chép tất cả` trong `V115WordRichEditorProSuite` (`mod17`) cho mọi khung prompt/output/Story Bible.',
    },
    WARN_VISUAL_SHIFT: {
      severity: 'P2',
      pillar: 'visual',
      plainTitle: 'Giao diện có khối bị lệch vị trí so với lần khám chuẩn trước',
      plainDesc: 'So với bản chụp lần trước, một khung chính đã thay đổi kích thước hoặc tọa độ đáng kể.',
      fixAdvice: 'Đối chiếu CSS layout tại phần tử bị dịch chuyển để chắc chắn không làm xô lệch bố cục ngoài ý muốn.',
    },
    WARN_SELF_HEAL_DRIFT: {
      severity: 'P2',
      pillar: 'functional',
      plainTitle: 'Một nút bấm đã đổi vị trí nhưng Bác sĩ App vẫn tự tìm được',
      plainDesc: 'Tính năng vẫn bấm được bình thường, chỉ ghi chú nhẹ để cập nhật lại mã định danh nút.',
      fixAdvice: 'Cập nhật lại CSS selector / `data-testid` của nút đã thay đổi để kịch bản kiểm thử khớp nhanh hơn.',
    },
  });

  // 3. ĐỘNG CƠ CHẤM ĐIỂM 4 CỘT + LỊCH SỬ 20 VÒNG + PHÁT HIỆN HỒI QUY + ĐƠN THUỐC AI
  const HISTORY_KEY = 'noir_at_v117_history_v1';
  const SNAPSHOT_KEY = 'noir_at_v117_layout_baseline_v1';

  class ImprovementLoopEngine {
    loadHistory() {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (_e) {
        return [];
      }
    }

    saveRun(summary) {
      const hist = this.loadHistory();
      hist.push(summary);
      const trimmed = hist.slice(-20);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      } catch (_e) {}
      return trimmed;
    }

    clearHistory() {
      try {
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem(SNAPSHOT_KEY);
      } catch (_e) {}
    }

    computeReport(results, perfStats, breadcrumbs) {
      const prevHist = this.loadHistory();
      const prevRun = prevHist.length ? prevHist[prevHist.length - 1] : null;
      const runNumber = (prevRun?.runNumber || 0) + 1;

      const passed = results.filter((r) => r.status === 'PASS');
      const issues = results.filter((r) => r.status !== 'PASS');

      // Chấm điểm 4 cột: Chức năng (40), Độ mượt (25), Dễ bấm/Giao diện (20), Chống sập/Độ bền (15)
      let pFunc = 40;
      let pSmooth = 25;
      let pVisual = 20;
      let pResil = 15;

      for (const it of issues) {
        const sev = it.severity || 'P2';
        const pen = sev === 'P0' ? 14 : sev === 'P1' ? 7 : 3;
        if (it.pillar === 'functional') pFunc = Math.max(0, pFunc - pen);
        else if (it.pillar === 'smoothness') pSmooth = Math.max(0, pSmooth - pen);
        else if (it.pillar === 'visual') pVisual = Math.max(0, pVisual - pen);
        else if (it.pillar === 'resilience') pResil = Math.max(0, pResil - pen);
      }

      if (perfStats.minFps > 0 && perfStats.minFps < 30) pSmooth = Math.max(0, pSmooth - 6);
      if (perfStats.longTasks > 2) pSmooth = Math.max(0, pSmooth - 4);
      if (perfStats.unrevokedBlobs > 3) pSmooth = Math.max(0, pSmooth - 4);

      const totalScore = Math.max(0, Math.min(100, Math.round(pFunc + pSmooth + pVisual + pResil)));
      const scoreDelta = prevRun ? totalScore - Number(prevRun.totalScore || 0) : 0;

      // Phát hiện Hồi quy (Regression): mục trước PASS mà lần này FAIL
      const prevPassedIds = new Set(prevRun?.passedIds || []);
      const prevFailedIds = new Set(prevRun?.failedIds || []);
      const regressions = issues.filter((it) => prevPassedIds.has(it.id));
      const fixedSincePrev = passed.filter((it) => prevFailedIds.has(it.id));

      // Sắp xếp lỗi theo P0 -> P1 -> P2
      const sevRank = { P0: 0, P1: 1, P2: 2 };
      issues.sort((a, b) => (sevRank[a.severity] ?? 3) - (sevRank[b.severity] ?? 3));

      const report = {
        runNumber,
        timestamp: Date.now(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        isMobile: window.innerWidth < 768,
        totalScore,
        scoreDelta,
        pillars: {
          functional: { score: pFunc, max: 40, label: 'Chạy đúng' },
          smoothness: { score: pSmooth, max: 25, label: 'Độ mượt' },
          visual: { score: pVisual, max: 20, label: 'Dễ bấm' },
          resilience: { score: pResil, max: 15, label: 'Chống sập' },
        },
        passed,
        issues,
        regressions,
        fixedSincePrev,
        perfStats,
        breadcrumbs: (breadcrumbs || []).slice(-15),
        passedIds: passed.map((x) => x.id),
        failedIds: issues.map((x) => x.id),
      };

      this.saveRun({
        runNumber: report.runNumber,
        timestamp: report.timestamp,
        totalScore: report.totalScore,
        viewport: report.viewport,
        passedCount: passed.length,
        issueCount: issues.length,
        passedIds: report.passedIds,
        failedIds: report.failedIds,
      });

      return report;
    }

    buildAiPatchPrompt(report) {
      if (!report) return 'Chưa có kết quả khám để xuất đơn thuốc.';
      const deviceTxt = report.isMobile
        ? `Điện thoại cảm ứng (${report.viewport}px)`
        : `Máy tính Desktop (${report.viewport}px)`;
      const deltaTxt =
        report.runNumber > 1
          ? ` (${report.scoreDelta >= 0 ? '+' : ''}${report.scoreDelta}đ so với vòng #${String(report.runNumber - 1).padStart(2, '0')})`
          : '';
      const fixedTxt = report.fixedSincePrev.length
        ? report.fixedSincePrev.map((x) => `\`${x.code || x.id}\``).join(', ')
        : 'Vòng đầu tiên / chưa có mục đổi trạng thái';
      const regTxt = report.regressions.length
        ? `⚠️ PHÁT HIỆN ${report.regressions.length} LỖI HỒI QUY: ` +
          report.regressions.map((x) => `\`${x.code || x.id}\` (${x.plainTitle})`).join('; ')
        : '0 lỗi mới phát sinh.';

      const p0 = report.issues.filter((i) => i.severity === 'P0');
      const p1 = report.issues.filter((i) => i.severity === 'P1');
      const p2 = report.issues.filter((i) => i.severity === 'P2');

      const fmtGroup = (list) =>
        list.length
          ? list
              .map(
                (i) =>
                  `- **Mã lỗi:** \`${i.code}\` tại \`${i.moduleRef || 'app'}\`\n` +
                  `  - **Mục kiểm tra:** ${i.plainTitle}\n` +
                  (i.selector ? `  - **Phần tử / CSS Selector:** \`${i.selector}\`\n` : '') +
                  `  - **Chi tiết kỹ thuật:** ${i.techDetail || i.plainDesc}\n` +
                  `  - **Hướng khắc phục đề xuất:** ${i.fixAdvice || RULE_KNOWLEDGE_BASE[i.code]?.fixAdvice || 'Kiểm tra log và xử lý ngoại lệ.'}`
              )
              .join('\n')
          : '- Không ghi nhận mục nào.';

      const lines = [
        `# BÁO CÁO TỰ CẢI THIỆN TỪ AUTOTESTER (VÒNG LẶP #${String(report.runNumber).padStart(2, '0')})`,
        `- **Thiết bị:** ${deviceTxt} | **Điểm sức khỏe:** ${report.totalScore}/100${deltaTxt}`,
        `- **4 Trụ cột:** Chạy đúng ${report.pillars.functional.score}/40 · Độ mượt ${report.pillars.smoothness.score}/25 · Dễ bấm ${report.pillars.visual.score}/20 · Chống sập ${report.pillars.resilience.score}/15`,
        `- **Hiệu năng đo được:** FPS TB ${report.perfStats.avgFps || '--'} (Thấp nhất ${report.perfStats.minFps || '--'}) · Long Tasks (>100ms): ${report.perfStats.longTasks} · CLS: ${report.perfStats.cls} · Blob chưa dọn: ${report.perfStats.unrevokedBlobs}${report.perfStats.ramMb ? ` · RAM: ${report.perfStats.ramMb} MB` : ''}`,
        `- **Tiến bộ vòng trước:** ${fixedTxt}`,
        `- **Cảnh báo hồi quy (Regression):** ${regTxt}`,
        '',
        '## 1. [P0 - LỖI NẶNG CẦN SỬA NGAY]',
        fmtGroup(p0),
        '',
        '## 2. [P1 - TĂNG ĐỘ MƯỢT, ĐỘ BỀN & TÍNH NĂNG]',
        fmtGroup(p1),
        '',
        '## 3. [P2 - TỐI ƯU FRONT-END & TRẢI NGHIỆM BẤM]',
        fmtGroup(p2),
        '',
        '## 4. [15 BƯỚC THAO TÁC GẦN NHẤT (BREADCRUMBS)]',
        ...(report.breadcrumbs.length
          ? report.breadcrumbs.map((b, idx) => `${idx + 1}. [${b.time}] ${b.action}`)
          : ['- Không có bước nào ghi nhận.']),
        '',
        `## TIÊU CHÍ NGHIỆM THU VÒNG LẶP #${String(report.runNumber + 1).padStart(2, '0')}`,
        `- Giữ nguyên toàn bộ ${report.passed.length} bài kiểm thử đang PASS, xử lý dứt điểm ${p0.length} lỗi P0 & ${p1.length} cảnh báo P1, giữ FPS tối thiểu >= 45 FPS và 0 tràn khung trên màn hình di động.`,
      ];

      return lines.join('\n');
    }
  }

  AT.PLAIN_VI_MAP = PLAIN_VI_MAP;
  AT.RULE_KNOWLEDGE_BASE = RULE_KNOWLEDGE_BASE;
  AT.SNAPSHOT_KEY = SNAPSHOT_KEY;
  AT.loopEngine = new ImprovementLoopEngine();
})(typeof window !== 'undefined' ? window : globalThis);
