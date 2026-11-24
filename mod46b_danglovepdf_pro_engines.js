/**
 * ============================================================================
 * MODULE 46B: ĐĂNGLOVEPDF PRO ENGINES — BỘ NHÂN XỬ LÝ PDF & FILE TOÀN DIỆN (v119)
 * ============================================================================
 * Kết hợp đầy đủ tính năng Premium từ iLovePDF Pro, Smallpdf Pro, PDF24, Sejda Pro,
 * Stirling-PDF & Adobe Acrobat — chạy 100% nội bộ trên trình duyệt (JS/WASM)
 * và tự động nâng cấp sức mạnh bằng Nhân Nội Bộ Máy Tính (LibreOffice / qpdf /
 * Ghostscript / MS Office COM) khi chạy trên bản App Desktop (Electron).
 * ============================================================================
 */
(function initMod46bDangLovePdfPro(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  const PAPER_SIZES = Object.freeze({
    a4: [595.28, 841.89],
    a3: [841.89, 1190.55],
    a5: [419.53, 595.28],
    letter: [612, 792],
    legal: [612, 1008],
  });

  // ==========================================================================
  // 1. DANH MỤC 7 CỤM — 48 CÔNG CỤ ĐĂNGLOVEPDF ULTRA PRO (CHUYỂN ĐỔI Ở CỤM 2!)
  // ==========================================================================
  const PRO_TOOL_GROUPS = Object.freeze([
    {
      id: 'organize',
      icon: '📚',
      title: 'Cụm 1: Tổ chức, Tách/Gộp, Dàn trang & Cấu trúc PDF',
      accent: 'emerald',
      tools: [
        { id: 'merge', icon: '🧩', name: 'Gộp PDF (Merge)', badge: 'Nhiều PDF → 1 PDF', desc: 'Nối nhiều file PDF thành 1 file, kéo đổi thứ tự & sắp xếp A→Z cực nhanh.', accept: '.pdf', multiple: true, minFiles: 2, actionLabel: 'Gộp PDF ngay' },
        { id: 'split', icon: '✂️', name: 'Tách PDF đa chế độ', badge: 'Khoảng / Lẻ / N trang / MB', desc: 'Cắt theo khoảng (1-3, 5), tách lẻ từng trang, tách mỗi N trang hoặc theo mức dung lượng MB.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tách PDF ngay' },
        { id: 'organize', icon: '🗂️', name: 'Sắp xếp, Xoay, Nhân bản & Xóa trang', badge: 'PDF → PDF', desc: 'Xem từng trang nhỏ, xoay 90°/180°/270°, nhân bản, đổi thứ tự, xóa hoặc chèn trang trắng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Lưu bản PDF mới' },
        { id: 'extract_pages', icon: '📑', name: 'Trích xuất & Đảo ngược trang', badge: 'Chẵn / Lẻ / Đảo chiều', desc: 'Rút riêng trang chẵn, trang lẻ, nhóm trang tùy chọn hoặc đảo ngược toàn bộ thứ tự trang.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Trích xuất / Đảo trang' },
        { id: 'crop', icon: '🔲', name: 'Cắt xén lề thừa (Crop PDF)', badge: 'Toàn bộ / Lẻ / Chẵn', desc: 'Cắt gọn 4 mép viền trắng thừa của toàn bộ tài liệu hoặc chỉ trang lẻ / trang chẵn.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Cắt viền & Lưu' },
        { id: 'resize_scale', icon: '📐', name: 'Đổi khổ giấy & Co giãn trang', badge: 'A4 / A3 / A5 / Letter', desc: 'Chuẩn hóa toàn bộ trang PDF về khổ A4, A3, A5, Letter, Legal (Dọc/Ngang) giữ tỷ lệ chuẩn.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuẩn hóa khổ giấy' },
        { id: 'nup_booklet', icon: '📖', name: 'Dàn trang Nhiều trang/tờ & Đóng gáy sách', badge: 'N-up 2/4/6/9 & Booklet', desc: 'Gom 2, 4, 6, 9 trang vào 1 mặt giấy hoặc đảo trang tự động để in sách đóng gáy giữa.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Dàn trang ngay' },
        { id: 'split_smart_books', icon: '🪓', name: 'Cắt đôi trang sách A3, In Áp phích & Tách theo trang trắng/từ khóa', badge: 'Split Half / Posterize / Smart', desc: 'Cắt dọc trang scan 2 trang liền nhau, chia khổ lớn A0/A1 ra lưới A4 dán tường, hoặc tách tự động theo trang trắng/từ khóa.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Xử lý cắt tách thông minh' },
        { id: 'alternate_mix', icon: '🔀', name: 'Trộn xen kẽ 2 file PDF (Scan 1 mặt)', badge: 'File 1 lẻ + File 2 chẵn', desc: 'Ghép xen kẽ trang từ 2 file PDF (có tùy chọn đảo ngược file 2 cho tài liệu scan 1 mặt).', accept: '.pdf', multiple: true, minFiles: 2, actionLabel: 'Trộn xen kẽ ngay' },
        { id: 'create_blank_pdf', icon: '🗒️', name: 'Tạo sổ PDF Trắng / Kẻ ngang / Ô ly', badge: 'Tạo mới 0 file', desc: 'Khởi tạo nhanh tập giấy PDF A4/A5 trắng, dòng kẻ ngang hoặc chấm bi để ghi chú & in ấn.', accept: '.pdf', multiple: false, minFiles: 0, noFileRequired: true, actionLabel: 'Tạo file PDF mới' },
      ],
    },
    {
      id: 'convert',
      icon: '🔄',
      title: 'Cụm 2: Chuyển đổi định dạng hai chiều (Word, Excel, Slide, Ảnh, EPUB, SVG, Email ↔ PDF)',
      accent: 'violet',
      tools: [
        { id: 'docx_convert', icon: '📘', name: 'Word (.DOCX) → PDF / TXT / MD / HTML', badge: 'DOCX → PDF/TXT/MD', desc: 'Đổi file Word sang PDF chuẩn tiếng Việt, văn bản thuần, Markdown hoặc trang HTML.', accept: '.docx', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi file Word' },
        { id: 'pdf_to_docx', icon: '📄', name: 'PDF → Word (.DOCX) / Markdown / TXT / JSON', badge: 'Kèm tọa độ & tiêu đề', desc: 'Xuất nội dung PDF sang Word chỉnh sửa được, Markdown phân cấp tiêu đề, TXT hoặc JSON.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi PDF ngay' },
        { id: 'pdf_to_excel', icon: '📈', name: 'PDF → Excel (.XLSX) / CSV (Quét bảng)', badge: 'Nhận diện hàng & cột', desc: 'Phân tích tọa độ X/Y văn bản trong PDF để tái tạo bảng tính Excel (.xlsx) hoặc CSV.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Quét bảng sang Excel' },
        { id: 'sheet_convert', icon: '📊', name: 'Excel / CSV / JSON ↔ Qua lại & PDF', badge: '4 chiều không lỗi dấu', desc: 'Chuyển đổi nhanh giữa Excel (.xlsx), CSV UTF-8, JSON và bảng PDF in ấn gọn gàng.', accept: '.xlsx,.xls,.csv,.json', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi Bảng tính' },
        { id: 'pdf_pptx', icon: '📽️', name: 'PDF ↔ PowerPoint (.PPTX)', badge: '2 chiều PDF ↔ PPTX', desc: 'Đổi PDF thành bài chiếu PowerPoint 16:9 hoặc rút nội dung từ .PPTX sang PDF / TXT.', accept: '.pdf,.pptx', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi Slide' },
        { id: 'pdf_to_img', icon: '🖼️', name: 'PDF → Ảnh sắc nét (JPG / PNG / WEBP)', badge: '72 – 300 DPI', desc: 'Xuất từng trang PDF thành ảnh siêu nét tùy chọn định dạng & độ phân giải DPI.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Xuất thành Ảnh' },
        { id: 'img_to_pdf', icon: '📸', name: 'Ảnh (JPG / PNG / WEBP / BMP) → PDF', badge: 'ẢNH → PDF', desc: 'Gộp nhiều ảnh thành 1 cuốn PDF chuẩn khổ A4/Letter/Khít ảnh với tùy chỉnh lề gọn gàng.', accept: 'image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp', multiple: true, minFiles: 1, actionLabel: 'Tạo PDF từ Ảnh' },
        { id: 'text_to_pdf_docx', icon: '🌐', name: 'HTML / Markdown / TXT → PDF / Word', badge: 'Web & Văn bản → PDF', desc: 'Đóng gói trang HTML, Markdown hoặc TXT sang PDF/DOCX gọn đẹp chuẩn tiếng Việt.', accept: '.txt,.md,.html,.htm', multiple: false, minFiles: 1, actionLabel: 'Xuất file ngay' },
        { id: 'epub_to_pdf', icon: '📚', name: 'Sách điện tử EPUB → PDF / Word / TXT', badge: 'EPUB → PDF/DOCX', desc: 'Giải nén cấu trúc XHTML trong sách .EPUB và dàn trang lại thành PDF tiếng Việt sắc nét.', accept: '.epub', multiple: false, minFiles: 1, actionLabel: 'Chuyển đổi EPUB' },
        { id: 'pdf_to_epub', icon: '📱', name: 'PDF → Sách điện tử (.EPUB)', badge: 'PDF → EPUB Kindle/Phone', desc: 'Đóng gói nội dung văn bản PDF thành sách điện tử chuẩn .EPUB đọc mượt trên điện thoại.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Xuất sách .EPUB' },
        { id: 'svg_eml_to_pdf', icon: '✉️', name: 'SVG / Email (.EML) / Truyện (.CBZ) → PDF', badge: 'Định dạng mở rộng', desc: 'Chuyển trực tiếp hình vector .SVG, thư điện tử .EML hoặc truyện tranh .CBZ sang PDF.', accept: '.svg,.eml,.cbz', multiple: false, minFiles: 1, actionLabel: 'Chuyển sang PDF' },
      ],
    },
    {
      id: 'edit',
      icon: '✨',
      title: 'Cụm 3: Đọc PDF 4 lớp, Chỉnh sửa PDF thực thụ (True Editor), Ký tên & Đánh số',
      accent: 'amber',
      tools: [
        { id: 'pdf_viewer_pro', icon: '👁️', name: 'Trình Đọc & Xem Trước PDF 4 Lớp Chuyên Nghiệp', badge: 'Ctrl+F / Bôi đen / 2 trang', desc: 'Đọc sách 2 trang đối xứng, bôi đen copy chữ, tìm kiếm Ctrl+F hỗ trợ Regex, cột Thumbnails/Mục lục & Chế độ tối thông minh.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Mở Trình Đọc PDF 4 Lớp' },
        { id: 'annotate_edit', icon: '🖍️', name: 'Trình Chỉnh sửa PDF Trực Quan (True PDF Editor)', badge: 'Sửa chữ gốc · CAD · Vẽ · Ảnh', desc: 'Bấm trực tiếp vào dòng chữ gốc để sửa, chèn chữ/ảnh, tô sáng, vẽ bút mượt, đo kích thước bản vẽ CAD, con dấu động & Undo/Redo!', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Lưu bản PDF đã chỉnh sửa' },
        { id: 'sign_edit', icon: '✍️', name: 'Ký tên điện tử (Vẽ tay / Font / Ảnh)', badge: 'Tự tách nền trắng', desc: 'Vẽ chữ ký trực tiếp, gõ chữ ký kiểu viết tay nghệ thuật hoặc tải ảnh tự tách nền trắng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Áp dụng chữ ký' },
        { id: 'page_numbers', icon: '🔢', name: 'Đánh số trang & Đánh số hồ sơ Bates', badge: '6 vị trí · Bates Pro', desc: 'Đánh số tự động 6 góc, bỏ qua trang bìa hoặc gắn mã hồ sơ Bates (vd: HS-0001).', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Thêm số trang / Bates' },
        { id: 'header_footer', icon: '🏷️', name: 'Thêm Tiêu đề đầu & Chân trang', badge: 'Header & Footer', desc: 'Chèn hàng loạt tên tài liệu, ngày tháng, tác giả lên lề trên/dưới toàn bộ tệp PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chèn Header & Footer' },
        { id: 'watermark', icon: '💧', name: 'Đóng dấu chìm Chữ hoặc Logo ảnh', badge: 'Text & Logo PNG/JPG', desc: 'Đóng dấu bản quyền bằng chữ tiếng Việt hoặc logo ảnh mờ chìm, hỗ trợ lặp lưới toàn trang.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Đóng dấu ngay' },
        { id: 'extract_images', icon: '📥', name: 'Trích xuất Ảnh & Tài nguyên PDF', badge: 'PDF → ZIP Tài nguyên', desc: 'Bóc tách ảnh độ phân giải cao và thông tin tài nguyên nhúng bên trong PDF ra file .ZIP.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Trích xuất tài nguyên' },
        { id: 'bookmarks_toc', icon: '📑', name: 'Tạo trang Mục lục tự động (Auto TOC)', badge: 'Chèn Mục lục đầu sách', desc: 'Tạo trang Mục lục trình bày đẹp mắt từ danh sách chương/số trang và ghép lên đầu file PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tạo & Ghép Mục lục' },
      ],
    },
    {
      id: 'forms',
      icon: '📋',
      title: 'Cụm 4: Biểu mẫu Tương tác (Điền AcroForm, Thiết kế Form & Trộn Excel Mail Merge)',
      accent: 'sky',
      tools: [
        { id: 'form_filler_builder', icon: '📝', name: 'Điền Biểu mẫu AcroForm & Tạo ô nhập liệu PDF', badge: 'AcroForm Filler & Builder', desc: 'Tự đọc & điền các ô AcroForm có sẵn, xuất JSON dữ liệu đã điền, hoặc tạo mới TextField/Checkbox vào PDF.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Áp dụng Biểu mẫu & Lưu' },
        { id: 'pdf_mail_merge', icon: '📨', name: 'Trộn dữ liệu hàng loạt (PDF Mail Merge từ Excel/CSV)', badge: '1 PDF + Excel → Hàng trăm PDF', desc: 'Nạp 1 tệp mẫu PDF + 1 tệp Excel/CSV danh sách tên/mã số để xuất hàng loạt chứng nhận/hợp đồng vào 1 file .ZIP!', accept: '.pdf,.xlsx,.csv', multiple: true, minFiles: 2, actionLabel: 'Trộn hàng loạt ra .ZIP' },
      ],
    },
    {
      id: 'ocr_meta',
      icon: '👁️',
      title: 'Cụm 5: OCR 5 Bước Thông minh, Tiền xử lý Scan & Quản lý Siêu dữ liệu',
      accent: 'teal',
      tools: [
        { id: 'ocr_pdf', icon: '👁️', name: 'OCR 5 bước thông minh & Tạo PDF 2 lớp (Ctrl+F)', badge: 'Smart Skip · PDF/DOCX/MD/TXT', desc: 'Tự bỏ qua trang đã có chữ, tẩy bóng/làm nét ảnh scan, giữ thứ tự cột & xuất PDF 2 lớp tìm được hoặc Word/MD/TXT.', accept: '.pdf,image/jpeg,image/png,image/webp', multiple: false, minFiles: 1, actionLabel: 'Chạy OCR 5 bước ngay' },
        { id: 'deskew_denoise', icon: '🧹', name: 'Làm thẳng & Khử nhiễu trang Scan', badge: 'Deskew & Denoise', desc: 'Xoay thẳng trang giấy bị nghiêng, tăng độ tương phản & làm trắng nền scan ố vàng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Làm sạch trang Scan' },
        { id: 'metadata_editor', icon: '🧾', name: 'Xem, Sửa & Xóa sạch Siêu dữ liệu (Metadata)', badge: 'Editor & Scrubber', desc: 'Đọc/sửa Tiêu đề, Tác giả, Từ khóa hoặc bấm 1 chạm xóa trắng toàn bộ dấu vết ẩn của tệp.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Lưu / Xóa Metadata' },
      ],
    },
    {
      id: 'optimize',
      icon: '⚡',
      title: 'Cụm 6: Nén dung lượng, Sửa lỗi, Chế bản In ấn (Bleed/Crop Marks) & PDF/A',
      accent: 'cyan',
      tools: [
        { id: 'compress', icon: '🗜️', name: 'Nén nhỏ PDF (3 cấp độ)', badge: 'Giảm dung lượng', desc: 'Làm nhẹ file PDF tức thì với 3 mức nén (Nhẹ, Vừa, Cực đại) tối ưu gửi Zalo/Email.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Nén PDF ngay' },
        { id: 'repair_pdf', icon: '🔧', name: 'Sửa lỗi cấu trúc PDF (Repair)', badge: 'Dựng lại Xref & Stream', desc: 'Quét và dựng lại cấu trúc bảng tham chiếu bị hỏng khi tải lỗi hoặc mở không ổn định.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Sửa lỗi & Phục hồi PDF' },
        { id: 'grayscale_pdf', icon: '🖨️', name: 'Chuyển Đen trắng / Thang độ xám', badge: 'Tối ưu in ấn', desc: 'Chuyển toàn bộ văn bản & hình ảnh sang xám mịn hoặc đen trắng sắc nét tiết kiệm mực.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuyển sang Đen trắng' },
        { id: 'invert_dark_pdf', icon: '🌙', name: 'Đảo màu Đọc ban đêm (Dark Mode PDF)', badge: 'Dịu mắt ban đêm', desc: 'Đổi nền trắng chói thành nền tối dịu mắt để đọc sách/tài liệu PDF vào ban đêm.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tạo bản PDF nền tối' },
        { id: 'prepress_bleed_marks', icon: '🎯', name: 'Chế bản In ấn (Bleed, Dấu cắt xén & Thanh kiểm màu)', badge: 'Prepress Nhà In', desc: 'Thêm tự động vùng bù xén 3mm, dấu cắt xén 4 góc (Crop/Trim Marks) và thanh kiểm màu CMYK chuẩn nhà in.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Tạo bản chế bản in' },
        { id: 'flatten', icon: '🔒', name: 'Làm phẳng & Khóa chỉnh sửa (Flatten)', badge: 'Khóa Form & Ghi chú', desc: 'Biến ô nhập liệu (AcroForms), chữ ký & ghi chú thành đồ họa tĩnh không thể sửa đổi.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Làm phẳng PDF' },
        { id: 'pdf_a_archive', icon: '🏛️', name: 'Chuẩn hóa Lưu trữ PDF/A & Tải nhanh', badge: 'ISO 19005 / Fast View', desc: 'Loại bỏ mã động JavaScript, chuẩn hóa siêu dữ liệu & luồng đối tượng để lưu trữ bền vững.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chuẩn hóa PDF/A' },
      ],
    },
    {
      id: 'security_batch',
      icon: '🛡️',
      title: 'Cụm 7: Bảo mật, Che đen Regex, Làm sạch dữ liệu ẩn, So sánh, Preflight & Hàng loạt',
      accent: 'rose',
      tools: [
        { id: 'protect_unlock_pdf', icon: '🔐', name: 'Đặt mật khẩu / Mở khóa PDF (Protect & Unlock)', badge: 'Khóa mở & Khóa quyền', desc: 'Đặt mật khẩu mở tệp / khóa in & copy ngay trên máy hoặc gỡ khóa khi có mật khẩu đúng.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Khóa / Mở khóa PDF' },
        { id: 'true_redaction', icon: '⬛', name: 'Che đen bảo mật vĩnh viễn + Tự động quét SĐT/CCCD/Email', badge: 'True Redaction + Regex', desc: 'Xóa vĩnh viễn văn bản & pixel theo từ khóa, vùng chọn hoặc 1 chạm che sạch SĐT/CCCD/Email!', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Che đen vĩnh viễn' },
        { id: 'deep_sanitize', icon: '🧼', name: 'Làm sạch dữ liệu ẩn toàn diện (Deep Forensics Sanitization)', badge: 'Xóa lịch sử ẩn & JS', desc: 'Xóa sạch XMP, lịch sử lưu tăng dần (Incremental Updates), JavaScript, lớp ẩn & phần thừa ngoài CropBox!', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Làm sạch toàn diện PDF' },
        { id: 'compare_pdf', icon: '⚖️', name: 'So sánh 2 tệp PDF (Text Diff + Soi Pixel)', badge: '2 PDF → Báo cáo Diff', desc: 'Đối chiếu 2 phiên bản hợp đồng/bản thảo: tô màu từng dòng thêm/xóa & chồng ảnh soi lệch từng pixel.', accept: '.pdf', multiple: true, minFiles: 2, actionLabel: 'So sánh 2 tệp PDF' },
        { id: 'preflight_inspect', icon: '🔬', name: 'Kiểm tra kỹ thuật trước khi in (Preflight)', badge: 'Báo cáo chuẩn in ấn', desc: 'Quét toàn bộ PDF kiểm tra khổ giấy lệch, mật độ chữ/ảnh, siêu dữ liệu & cảnh báo trước khi in.', accept: '.pdf', multiple: false, minFiles: 1, actionLabel: 'Chạy kiểm tra Preflight' },
        { id: 'batch_workflow', icon: '🏭', name: 'Xử lý hàng loạt theo chuỗi (Batch Pipeline)', badge: 'Hàng chục PDF → 1 ZIP', desc: 'Nạp nhiều file PDF cùng lúc, tick chuỗi tác vụ liên hoàn (Đóng dấu → Số trang → Xóa Meta → Nén).', accept: '.pdf', multiple: true, minFiles: 1, actionLabel: 'Chạy chuỗi hàng loạt' },
        { id: 'desktop_local_engine', icon: '🖥️', name: 'Nhân Nội Bộ Máy Tính (LibreOffice / qpdf / Ghostscript)', badge: 'Desktop Local Engine', desc: 'Kết nối trực tiếp phần mềm cài sẵn trên máy tính (App Desktop) để xử lý file siêu nặng chuẩn 100%.', accept: '.pdf,.docx,.xlsx,.pptx,.odt,.ods,.odp', multiple: false, minFiles: 1, actionLabel: 'Chạy bằng Nhân Máy Tính' },
      ],
    },
  ]);

  // ==========================================================================
  // 2. TIỆN ÍCH THUẬT TOÁN HỖ TRỢ (RC4/MD5 PDF ENCRYPT, PIXEL DIFF, EPUB, TABLE)
  // ==========================================================================
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function dataUrlToUint8(dataUrl) {
    const bin = atob(String(dataUrl || '').split(',')[1] || '');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // So sánh dòng LCS gọn cho Compare PDF (Semantic Text Diff)
  function computeLineDiff(linesA, linesB) {
    const setA = new Set(linesA.map((x) => x.trim()).filter(Boolean));
    const setB = new Set(linesB.map((x) => x.trim()).filter(Boolean));
    const diffs = [];
    const maxLen = Math.max(linesA.length, linesB.length);
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    for (let i = 0; i < maxLen; i++) {
      const a = (linesA[i] || '').trim();
      const b = (linesB[i] || '').trim();
      if (a === b) {
        if (a) {
          unchanged += 1;
          diffs.push({ type: 'same', text: a });
        }
      } else {
        if (a && !setB.has(a)) {
          removed += 1;
          diffs.push({ type: 'del', text: a });
        } else if (a) {
          unchanged += 1;
          diffs.push({ type: 'same', text: a });
        }
        if (b && !setA.has(b)) {
          added += 1;
          diffs.push({ type: 'add', text: b });
        }
      }
    }
    return { diffs, added, removed, unchanged };
  }

  // Tạo gói sách điện tử .EPUB chuẩn (mimetype + container.xml + content.opf + toc.ncx + XHTML)
  async function buildEpubBlobFromChapters(bookTitle, chapters, JSZip) {
    const zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    zip.file(
      'META-INF/container.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    const safeTitle = escHtml(bookTitle || 'Sach_Dien_Tu');
    const manifestItems = [];
    const spineItems = [];
    const navPoints = [];

    chapters.forEach((ch, idx) => {
      const id = `ch${idx + 1}`;
      const href = `${id}.xhtml`;
      const chTitle = escHtml(ch.title || `Trang ${idx + 1}`);
      const bodyParas = (ch.lines || [])
        .filter((l) => String(l).trim().length > 0)
        .map((l) => `<p>${escHtml(l)}</p>`)
        .join('\n');

      zip.file(
        `OEBPS/${href}`,
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><meta charset="utf-8"/><title>${chTitle}</title><style>body{font-family:serif;line-height:1.7;padding:1em;}h2{margin-bottom:0.8em;}</style></head>
<body><h2>${chTitle}</h2>${bodyParas || '<p>(Trang trống)</p>'}</body>
</html>`
      );
      manifestItems.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
      spineItems.push(`<itemref idref="${id}"/>`);
      navPoints.push(
        `<navPoint id="nav${idx + 1}" playOrder="${idx + 1}"><navLabel><text>${chTitle}</text></navLabel><content src="${href}"/></navPoint>`
      );
    });

    zip.file(
      'OEBPS/toc.ncx',
      `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:danglovepdf-${Date.now()}"/></head>
  <docTitle><text>${safeTitle}</text></docTitle>
  <navMap>${navPoints.join('\n')}</navMap>
</ncx>`
    );

    zip.file(
      'OEBPS/content.opf',
      `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${safeTitle}</dc:title>
    <dc:creator>ĐăngLovePDF</dc:creator>
    <dc:language>vi</dc:language>
    <dc:identifier id="BookId">urn:uuid:danglovepdf-${Date.now()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">${spineItems.join('')}</spine>
</package>`
    );

    return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  }

  // Tạo chữ ký nghệ thuật dạng ảnh PNG trong suốt từ tên người dùng gõ
  function renderCursiveSignaturePng(nameText, color = '#1e3a8a') {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 150;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = 'italic 600 54px "Segoe Script", "Brush Script MT", "Georgia", cursive';
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(String(nameText || 'Ký tên'), c.width / 2, c.height / 2);
    // Nét gạch chân nghệ thuật nhẹ
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(70, 114);
    ctx.quadraticCurveTo(240, 96, 410, 110);
    ctx.stroke();
    return c.toDataURL('image/png');
  }

  // ==========================================================================
  // 3. TÙY CHỌN UI RIÊNG CHO 22 CÔNG CỤ PRO MỚI & CÁC CHẾ ĐỘ NÂNG CAO
  // ==========================================================================
  function buildProOptionsHtml(ctrl, toolId) {
    if (toolId === 'extract_pages') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ xử lý trang:</span>
          <select id="opt-pro-extract-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="reverse">Đảo ngược toàn bộ thứ tự trang (Cuối → Đầu)</option>
            <option value="odd">Chỉ trích xuất các trang LẺ (1, 3, 5...)</option>
            <option value="even">Chỉ trích xuất các trang CHẴN (2, 4, 6...)</option>
            <option value="custom">Trích xuất theo khoảng trang tùy chọn</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Khoảng trang (khi chọn Tùy chọn):</span>
          <input id="opt-pro-extract-range" type="text" placeholder="Ví dụ: 1-3, 5, 8-10" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>`;
    }

    if (toolId === 'resize_scale') {
      return `
        <label class="block space-y-1"><span class="font-bold">Khổ giấy đích:</span>
          <select id="opt-pro-paper" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="a4">A4 (210 × 297 mm — Phổ biến nhất)</option>
            <option value="a3">A3 (297 × 420 mm — Khổ lớn)</option>
            <option value="a5">A5 (148 × 210 mm — Sổ tay/Light Novel)</option>
            <option value="letter">US Letter (8.5 × 11 in)</option>
            <option value="legal">US Legal (8.5 × 14 in)</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Hướng giấy:</span>
          <select id="opt-pro-orient" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="portrait">Khổ dọc (Portrait)</option>
            <option value="landscape">Khổ ngang (Landscape)</option>
          </select>
        </label>`;
    }

    if (toolId === 'nup_booklet') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ dàn trang in:</span>
          <select id="opt-pro-nup-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="2">2 trang / 1 mặt giấy (Ngang)</option>
            <option value="4">4 trang / 1 mặt giấy (Lưới 2×2)</option>
            <option value="6">6 trang / 1 mặt giấy (Lưới 3×2)</option>
            <option value="9">9 trang / 1 mặt giấy (Lưới 3×3)</option>
            <option value="booklet">Đóng gáy sách giữa (Booklet — tự đảo trang in gập!)</option>
          </select>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <label class="space-y-1"><span class="font-bold">Khoảng hở giữa trang (mm):</span>
            <input id="opt-pro-nup-gap-mm" type="number" min="0" max="20" step="1" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" />
          </label>
          <label class="space-y-1"><span class="font-bold">Lề ngoài tờ giấy (mm):</span>
            <input id="opt-pro-booklet-margin-mm" type="number" min="0" max="20" step="1" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" />
          </label>
        </div>
        <label class="block space-y-1"><span class="font-bold">Độ rộng gáy sách — Gutter (mm, cho chế độ Booklet):</span>
          <input id="opt-pro-booklet-gutter-mm" type="number" min="0" max="30" step="1" value="4" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <p class="text-[11px] text-zinc-400">Để <strong>Khoảng hở = 0 mm</strong> để các trang ghép liền khít nhau không tách rời. Chế độ <strong>Booklet</strong> tự đảo trang đóng sách và chừa đúng độ rộng gáy bạn chọn.</p>`;
    }

    if (toolId === 'alternate_mix') {
      return `
        <p class="text-zinc-300">Ghép xen kẽ 1 trang từ <strong>File #1</strong> rồi 1 trang từ <strong>File #2</strong>.</p>
        <label class="flex items-center gap-2"><input id="opt-pro-mix-rev2" type="checkbox" checked class="accent-emerald-400" /><span>Đảo ngược thứ tự File #2 (Chuẩn máy scan 1 mặt)</span></label>`;
    }

    if (toolId === 'create_blank_pdf') {
      return `
        <div class="grid grid-cols-2 gap-2">
          <label class="space-y-1"><span class="font-bold">Số trang:</span><input id="opt-pro-blank-count" type="number" min="1" max="200" value="10" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          <label class="space-y-1"><span class="font-bold">Khổ giấy:</span>
            <select id="opt-pro-blank-size" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700">
              <option value="a4">A4</option><option value="a5">A5</option><option value="letter">Letter</option>
            </select>
          </label>
        </div>
        <label class="block space-y-1"><span class="font-bold">Kiểu nền giấy:</span>
          <select id="opt-pro-blank-style" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="blank">Giấy trắng trơn hoàn toàn</option>
            <option value="ruled">Giấy dòng kẻ ngang (Viết tay)</option>
            <option value="grid">Giấy kẻ ô ly vuông (Toán/Kỹ thuật)</option>
            <option value="dots">Giấy chấm bi Bullet Journal</option>
          </select>
        </label>`;
    }

    if (toolId === 'grayscale_pdf') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ chuyển màu in:</span>
          <select id="opt-pro-gray-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="gray">Thang độ xám mịn (Grayscale — giữ rõ ảnh)</option>
            <option value="bw">Đen trắng độ tương phản cao (B&amp;W siêu sắc nét)</option>
          </select>
        </label>`;
    }

    if (toolId === 'invert_dark_pdf') {
      return `<p class="text-zinc-300">Đảo ngược nền trắng thành nền tối than chì dịu mắt, giữ nguyên độ sắc nét của chữ để đọc ban đêm không mỏi mắt.</p>`;
    }

    if (toolId === 'repair_pdf') {
      return `<p class="text-zinc-300">Tự động đọc chịu lỗi cấu trúc nhị phân và dựng mới hoàn toàn bảng tham chiếu <code>xref</code> &amp; các luồng trang bị lỗi.</p>`;
    }

    if (toolId === 'pdf_a_archive') {
      return `
        <label class="block space-y-1"><span class="font-bold">Tên tài liệu lưu trữ chuẩn ISO:</span>
          <input id="opt-pro-pdfa-title" type="text" placeholder="Để trống sẽ lấy tên tệp gốc" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <p class="text-[11px] text-zinc-400">Loại bỏ thành phần động JavaScript, làm phẳng biểu mẫu &amp; chuẩn hóa cấu trúc tải nhanh (Fast Web View).</p>`;
    }

    if (toolId === 'annotate_edit') {
      return `
        <p class="text-emerald-300 font-bold leading-relaxed">✨ Bạn đang ở Trình Chỉnh sửa PDF Trực Quan (True PDF Editor)!</p>
        <p class="text-zinc-300 leading-relaxed">Thao tác trực tiếp trên trang PDF ở khung lớn bên trái: <strong>Bấm thẳng vào chữ gốc để sửa</strong>, chèn chữ mới, tải ảnh, tô sáng, vẽ bút tự do, đo khoảng cách CAD, đóng con dấu động hoặc che đen bảo mật.</p>
        <label class="block space-y-1"><span class="font-bold">Tỷ lệ đo bản vẽ CAD (1 cm = ? mét):</span>
          <input id="opt-pro-cad-scale" type="number" step="0.5" min="0.1" value="5" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <p class="text-[11px] text-zinc-400">Hỗ trợ Hoàn tác (Undo) / Làm lại (Redo) nhiều bước và sửa nhiều trang liên tiếp trước khi xuất file.</p>`;
    }

    if (toolId === 'pdf_viewer_pro') {
      return `<p class="text-zinc-300 leading-relaxed">Bấm nút bên dưới để mở <strong>Trình Đọc PDF 4 Lớp</strong>: cột ảnh thu nhỏ, cây mục lục, bôi đen copy chữ thật, tìm kiếm <code>Ctrl+F</code> (hỗ trợ Regex), đọc 2 trang đối xứng &amp; chế độ ban đêm thông minh.</p>`;
    }

    if (toolId === 'split_smart_books') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ cắt/tách thông minh:</span>
          <select id="opt-pro-smart-split" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="split_half_lr">Cắt đôi trang sách A3 → 2 trang A4 (Trái → Phải)</option>
            <option value="split_half_rl">Cắt đôi truyện tranh/Manga (Phải → Trái)</option>
            <option value="posterize_2x2">In Áp phích (Posterize — chia mỗi trang ra lưới 2×2 A4)</option>
            <option value="split_blank">Tách tự động &amp; xóa trang trắng phân cách hồ sơ</option>
            <option value="split_keyword">Tách tệp mỗi khi gặp từ khóa tiêu đề</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Từ khóa ngắt tệp (khi chọn Tách theo từ khóa):</span>
          <input id="opt-pro-split-kw" type="text" placeholder="VD: HÓA ĐƠN GIÁ TRỊ GIA TĂNG" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>`;
    }

    if (toolId === 'svg_eml_to_pdf') {
      return `<p class="text-zinc-300 leading-relaxed">Hỗ trợ chuyển trực tiếp đồ họa vector <strong>.SVG</strong>, thư điện tử <strong>.EML</strong> (giữ người gửi/tiêu đề/nội dung) hoặc tập truyện tranh <strong>.CBZ</strong> sang file PDF chuẩn.</p>`;
    }

    if (toolId === 'form_filler_builder') {
      return `
        <label class="block space-y-1"><span class="font-bold">Chế độ Biểu mẫu (AcroForm):</span>
          <select id="opt-pro-form-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="add_fields">Thêm ô nhập liệu mới (TextField + Checkbox) vào trang 1</option>
            <option value="fill_json">Điền nhanh các ô AcroForm có sẵn bằng danh sách (TênÔ=GiáTrị)</option>
            <option value="export_json">Trích xuất danh sách trường &amp; dữ liệu Form ra .JSON</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Dữ liệu điền / Tên ô mới (mỗi dòng 1 mục):</span>
          <textarea id="opt-pro-form-data" rows="4" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-[11px]">HoTen=Nguyễn Văn An
Email=an@example.com
XacNhan=true</textarea>
        </label>`;
    }

    if (toolId === 'pdf_mail_merge') {
      return `
        <p class="text-zinc-300 leading-relaxed">Nạp <strong>1 tệp mẫu .PDF</strong> và <strong>1 tệp .XLSX hoặc .CSV</strong> (mỗi dòng là 1 người). Hệ thống tự điền vào AcroForm cùng tên cột hoặc in gọn lên trang và xuất hàng loạt thành 1 gói <strong>.ZIP</strong>!</p>
        <label class="block space-y-1"><span class="font-bold">Giới hạn số bản tối đa/lượt:</span>
          <input id="opt-pro-merge-limit" type="number" min="1" max="500" value="100" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>`;
    }

    if (toolId === 'prepress_bleed_marks') {
      return `
        <label class="block space-y-1"><span class="font-bold">Vùng bù xén nhà in (Bleed — mm):</span>
          <input id="opt-pro-bleed-mm" type="number" min="2" max="15" value="5" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-crop-marks" type="checkbox" checked class="accent-cyan-400" /><span>Vẽ dấu cắt xén 4 góc (Crop/Trim Marks)</span></label>
        <label class="flex items-center gap-2"><input id="opt-pro-color-bars" type="checkbox" checked class="accent-cyan-400" /><span>Thêm thanh kiểm màu CMYK ở lề trên</span></label>`;
    }

    if (toolId === 'deep_sanitize') {
      return `
        <p class="text-rose-200 font-bold">🧼 Làm sạch tận gốc chuẩn Forensics:</p>
        <ul class="text-[11px] text-zinc-300 list-disc pl-4 space-y-1">
          <li>Xóa sạch siêu dữ liệu XMP &amp; Document Info.</li>
          <li>Loại bỏ lịch sử lưu tăng dần (Incremental Updates) bằng cách dựng cây đối tượng mới hoàn toàn.</li>
          <li>Cắt hủy vĩnh viễn nội dung nằm ngoài vùng hiển thị CropBox.</li>
          <li>Gỡ bỏ JavaScript nhúng, OpenAction &amp; làm phẳng ghi chú ẩn.</li>
        </ul>`;
    }

    if (toolId === 'header_footer') {
      const wordBar = NS.dangLovePdfTextUtils?.buildWordStyleBarHtml
        ? NS.dangLovePdfTextUtils.buildWordStyleBarHtml('hf', { fontSize: 11, color: '#334155', fontFamily: '"Times New Roman", Georgia, serif', bold: true, showBg: true })
        : '';
      return `
        <label class="block space-y-1"><span class="font-bold">Tiêu đề đầu trang (Header — hỗ trợ {date}, {page}, {total}):</span>
          <input id="opt-pro-hf-header" type="text" value="Tài liệu biên soạn • {date}" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="block space-y-1"><span class="font-bold">Vị trí tiêu đề đầu trang (hoặc kéo trực tiếp trên giấy):</span>
          <select id="opt-pro-hf-hpos" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="left">Căn trái đầu trang</option>
            <option value="center" selected>Căn giữa đầu trang</option>
            <option value="right">Căn phải đầu trang</option>
          </select>
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-hf-hline" type="checkbox" checked class="accent-amber-400" /><span>Kẻ đường phân cách dưới tiêu đề đầu trang</span></label>
        <label class="block space-y-1"><span class="font-bold">Chân trang (Footer):</span>
          <input id="opt-pro-hf-footer" type="text" value="Trang {page} / {total}" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="block space-y-1"><span class="font-bold">Vị trí chân trang (hoặc kéo trực tiếp trên giấy):</span>
          <select id="opt-pro-hf-fpos" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="left">Căn trái chân trang</option>
            <option value="center" selected>Căn giữa chân trang</option>
            <option value="right">Căn phải chân trang</option>
          </select>
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-hf-fline" type="checkbox" checked class="accent-amber-400" /><span>Kẻ đường phân cách trên chân trang</span></label>
        <label class="flex items-center gap-2"><input id="opt-pro-hf-skip1" type="checkbox" class="accent-amber-400" /><span>Bỏ qua trang bìa (Trang 1)</span></label>
        ${wordBar}`;
    }

    if (toolId === 'bookmarks_toc') {
      const wordBar = NS.dangLovePdfTextUtils?.buildWordStyleBarHtml
        ? NS.dangLovePdfTextUtils.buildWordStyleBarHtml('toc', { fontSize: 14, color: '#18181b', fontFamily: '"Times New Roman", Georgia, serif', bold: false })
        : '';
      return `
        <label class="block space-y-1"><span class="font-bold">Tiêu đề trang Mục lục:</span>
          <input id="opt-pro-toc-title" type="text" value="MỤC LỤC TÀI LIỆU" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="block space-y-1"><span class="font-bold">Kiểu trình bày mục lục:</span>
          <select id="opt-pro-toc-style" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="dots">(Tiêu đề) ............ (số trang)</option>
            <option value="space">(Tiêu đề)   (số trang) — Tối giản</option>
            <option value="dash">(Tiêu đề) ———— (số trang)</option>
            <option value="prefix">[Số trang] · (Tiêu đề) — Báo chí</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Danh sách mục (Mỗi dòng: Tên chương | Số trang):</span>
          <textarea id="opt-pro-toc-lines" rows="4" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-[11.5px]">Chương 1: Khởi đầu | 1
Chương 2: Diễn biến chính | 5
Chương 3: Tổng kết | 12</textarea>
        </label>
        ${wordBar}`;
    }

    if (toolId === 'epub_to_pdf') {
      return `
        <label class="block space-y-1"><span class="font-bold">Đổi sách .EPUB sang:</span>
          <select id="opt-pro-epub-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="pdf">PDF (Dàn trang chuẩn tiếng Việt)</option>
            <option value="docx">Word (.DOCX — Chỉnh sửa được)</option>
            <option value="txt">Văn bản thuần (.TXT)</option>
          </select>
        </label>`;
    }

    if (toolId === 'pdf_to_epub') {
      return `
        <label class="block space-y-1"><span class="font-bold">Tên sách hiển thị trên máy đọc sách:</span>
          <input id="opt-pro-epub-title" type="text" placeholder="Để trống lấy tên tệp PDF" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>`;
    }

    if (toolId === 'pdf_to_excel') {
      return `
        <label class="block space-y-1"><span class="font-bold">Định dạng bảng xuất ra:</span>
          <select id="opt-pro-p2x-out" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="xlsx">Excel (.XLSX — Nhiều cột chuẩn)</option>
            <option value="csv">CSV UTF-8 (Mở Excel tiếng Việt không lỗi dấu)</option>
          </select>
        </label>`;
    }

    if (toolId === 'deskew_denoise') {
      return `
        <label class="block space-y-1"><span class="font-bold">Góc xoay nắn thẳng (độ, -15 đến +15):</span>
          <input id="opt-pro-deskew-deg" type="number" step="0.5" min="-15" max="15" value="0" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-denoise-white" type="checkbox" checked class="accent-teal-400" /><span>Tự khử nền xám ố vàng &amp; làm nét chữ scan</span></label>`;
    }

    if (toolId === 'metadata_editor') {
      return `
        <label class="flex items-center gap-2 p-2 rounded-xl border border-rose-500/40 bg-rose-950/30"><input id="opt-pro-meta-scrub" type="checkbox" class="accent-rose-400" /><span class="font-bold text-rose-200">🧹 Xóa trắng 100% siêu dữ liệu ẩn (Scrubber)</span></label>
        <label class="block space-y-1"><span class="font-bold">Tiêu đề mới:</span><input id="opt-pro-meta-title" type="text" placeholder="Giữ nguyên hoặc nhập mới" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
        <label class="block space-y-1"><span class="font-bold">Tác giả:</span><input id="opt-pro-meta-author" type="text" placeholder="Tên tác giả" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
        <label class="block space-y-1"><span class="font-bold">Từ khóa (Keywords):</span><input id="opt-pro-meta-keywords" type="text" placeholder="tiểu thuyết, tài liệu..." class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>`;
    }

    if (toolId === 'protect_unlock_pdf') {
      const hasDesktop = Boolean(global.NoirDesktopLocalEngine);
      return `
        <label class="block space-y-1"><span class="font-bold">Hành động bảo mật:</span>
          <select id="opt-pro-sec-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="unlock">🔓 Gỡ khóa quyền / Mở khóa PDF (khi có mật khẩu)</option>
            <option value="protect">🔒 Khóa bảo vệ &amp; đóng dấu bản quyền / mã hóa (AES-256 trên Desktop)</option>
          </select>
        </label>
        <label class="block space-y-1"><span class="font-bold">Mật khẩu tệp (User Password):</span>
          <input id="opt-pro-sec-pass" type="password" placeholder="Nhập mật khẩu..." class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <label class="flex items-center gap-2"><input id="opt-pro-sec-noprint" type="checkbox" class="accent-rose-400" /><span>Khóa quyền in ấn / sao chép (áp dụng khi đặt mật khẩu)</span></label>
        <p class="text-[11px] text-zinc-400">${hasDesktop ? '🖥️ Đã kết nối Nhân Desktop (qpdf AES-256 chuẩn thực thụ!).' : '💡 Trên trình duyệt: gỡ khóa bằng PDF.js/pdf-lib & khóa lớp chống sao chép (Flatten + Metadata Lock). Dùng App Desktop để mã hóa AES-256 gốc bằng qpdf.'}</p>`;
    }

    if (toolId === 'true_redaction') {
      return `
        <label class="block space-y-1"><span class="font-bold">Từ khóa nhạy cảm cần che đen vĩnh viễn (cách nhau bằng dấu phẩy):</span>
          <input id="opt-pro-redact-words" type="text" placeholder="Ví dụ: 0912345678, CCCD, bí mật" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700" />
        </label>
        <div class="p-2 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div class="text-[11px] font-bold text-amber-300">🤖 Tự động quét &amp; che đen theo mẫu (Regex):</div>
          <label class="flex items-center gap-2 text-[11px]"><input id="opt-pro-redact-phone" type="checkbox" class="accent-rose-500" /><span>Số điện thoại Việt Nam (03/05/07/08/09...)</span></label>
          <label class="flex items-center gap-2 text-[11px]"><input id="opt-pro-redact-cccd" type="checkbox" class="accent-rose-500" /><span>Số CCCD / CMND (9–12 chữ số)</span></label>
          <label class="flex items-center gap-2 text-[11px]"><input id="opt-pro-redact-email" type="checkbox" class="accent-rose-500" /><span>Địa chỉ Email cá nhân</span></label>
        </div>
        <p class="text-[11px] text-zinc-400">Hoặc chọn vùng che đen theo phần trăm (tính từ góc trên-trái):</p>
        <div class="grid grid-cols-2 gap-2">
          <label class="space-y-1"><span>Trái (%):</span><input id="opt-pro-redact-x" type="number" min="0" max="95" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          <label class="space-y-1"><span>Trên (%):</span><input id="opt-pro-redact-y" type="number" min="0" max="95" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          <label class="space-y-1"><span>Rộng (%):</span><input id="opt-pro-redact-w" type="number" min="0" max="100" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
          <label class="space-y-1"><span>Cao (%):</span><input id="opt-pro-redact-h" type="number" min="0" max="100" value="0" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700" /></label>
        </div>
        <p class="text-[11px] text-rose-300 font-bold">🛡️ Công nghệ True Redaction: hủy hoàn toàn lớp chữ vector ẩn nên không ai bôi đen copy lại được!</p>`;
    }

    if (toolId === 'compare_pdf') {
      return `
        <p class="text-zinc-300">Nạp <strong>2 tệp PDF</strong> (Bản cũ #1 và Bản mới #2) để hệ thống tự động đối chiếu cả <strong>Văn bản từng dòng (Text Diff)</strong> lẫn <strong>Chồng hình từng pixel (Visual Overlay)</strong>.</p>
        <label class="flex items-center gap-2"><input id="opt-pro-cmp-visual" type="checkbox" checked class="accent-rose-400" /><span>Kèm ảnh chồng lớp soi sai lệch từng pixel</span></label>`;
    }

    if (toolId === 'preflight_inspect') {
      return `<p class="text-zinc-300">Tự động quét khổ giấy từng trang, phát hiện trang lệch hướng, đếm mật độ chữ, kiểm tra siêu dữ liệu &amp; xuất báo cáo kiểm định kỹ thuật trước khi mang đi in.</p>`;
    }

    if (toolId === 'batch_workflow') {
      return `
        <p class="text-zinc-300 font-bold">Chọn các bước trong chuỗi chạy liên hoàn cho TOÀN BỘ tệp PDF đã nạp:</p>
        <label class="flex items-center gap-2"><input id="opt-batch-gray" type="checkbox" class="accent-emerald-400" /><span>1. Chuyển sang thang độ xám tiết kiệm mực</span></label>
        <label class="flex items-center gap-2"><input id="opt-batch-wm" type="checkbox" checked class="accent-emerald-400" /><span>2. Đóng dấu bản quyền:</span></label>
        <input id="opt-batch-wm-text" type="text" value="BẢN LƯU NỘI BỘ" class="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-700 text-[11px]" />
        <label class="flex items-center gap-2"><input id="opt-batch-pn" type="checkbox" checked class="accent-emerald-400" /><span>3. Tự động đánh số trang ở giữa dưới</span></label>
        <label class="flex items-center gap-2"><input id="opt-batch-meta" type="checkbox" checked class="accent-emerald-400" /><span>4. Xóa sạch siêu dữ liệu ẩn (Scrub Metadata)</span></label>
        <label class="flex items-center gap-2"><input id="opt-batch-flatten" type="checkbox" class="accent-emerald-400" /><span>5. Làm phẳng khóa chỉnh sửa (Flatten)</span></label>`;
    }

    if (toolId === 'desktop_local_engine') {
      const hasDesktop = Boolean(global.NoirDesktopLocalEngine);
      return `
        <div class="p-2.5 rounded-xl border ${hasDesktop ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200' : 'border-amber-500/50 bg-amber-950/30 text-amber-200'} text-[11px] leading-relaxed">
          ${
            hasDesktop
              ? '✅ <strong>Đang chạy trên App Desktop (Electron)</strong> — sẵn sàng gọi trực tiếp LibreOffice, qpdf, Ghostscript và MS Office cài trên máy tính!'
              : '🌐 <strong>Đang chạy trên Trình duyệt Web</strong> — trình duyệt không thể tự gọi phần mềm .exe bên ngoài. Bạn vẫn dùng được 40/41 công cụ hoàn toàn offline ngay trên web, hoặc tải bản App Desktop Windows/Mac để kích hoạt nhân hệ thống!'
          }
        </div>
        <label class="block space-y-1"><span class="font-bold">Tác vụ Nhân Máy Tính:</span>
          <select id="opt-pro-local-cmd" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700">
            <option value="office_to_pdf">LibreOffice Headless: Word/Excel/PPT → PDF chuẩn 100%</option>
            <option value="qpdf_linearize">qpdf: Tối ưu tải nhanh (Linearize) &amp; Sửa lỗi PDF</option>
            <option value="gs_compress">Ghostscript: Nén sâu chuẩn in ấn (Font Subsetting)</option>
          </select>
        </label>`;
    }

    return null;
  }

  function readProOptions() {
    return {
      // Mở rộng cho Split / Watermark / Page Numbers / Sign / OCR / PDF->DOCX
      splitEveryN: Math.max(1, Number(document.getElementById('opt-mod46-split-everyn')?.value || 2)),
      splitMaxMb: Math.max(0.2, Number(document.getElementById('opt-mod46-split-maxmb')?.value || 5)),
      cropScope: document.getElementById('opt-crop-scope')?.value || 'all',
      batesPrefix: document.getElementById('opt-pn-bates-prefix')?.value?.trim() || '',
      ocrOutFormat: document.getElementById('opt-ocr-out-fmt')?.value || 'searchable_pdf',
      ocrSmartSkip: Boolean(document.getElementById('opt-ocr-smart-skip')?.checked),
      ocrDenoise: Boolean(document.getElementById('opt-ocr-denoise')?.checked),
      signTypedName: document.getElementById('opt-sign-typed-name')?.value?.trim() || '',
      // Công cụ mới v121
      smartSplitMode: document.getElementById('opt-pro-smart-split')?.value || 'split_half_lr',
      smartSplitKw: document.getElementById('opt-pro-split-kw')?.value?.trim() || '',
      formMode: document.getElementById('opt-pro-form-mode')?.value || 'add_fields',
      formData: document.getElementById('opt-pro-form-data')?.value || '',
      mergeLimit: Math.max(1, Math.min(500, Number(document.getElementById('opt-pro-merge-limit')?.value || 100))),
      bleedMm: Math.max(2, Math.min(15, Number(document.getElementById('opt-pro-bleed-mm')?.value || 5))),
      cropMarks: Boolean(document.getElementById('opt-pro-crop-marks')?.checked),
      colorBars: Boolean(document.getElementById('opt-pro-color-bars')?.checked),
      redactPhone: Boolean(document.getElementById('opt-pro-redact-phone')?.checked),
      redactCccd: Boolean(document.getElementById('opt-pro-redact-cccd')?.checked),
      redactEmail: Boolean(document.getElementById('opt-pro-redact-email')?.checked),
      // 22 công cụ Pro mới
      extractMode: document.getElementById('opt-pro-extract-mode')?.value || 'reverse',
      extractRange: document.getElementById('opt-pro-extract-range')?.value || '',
      paper: document.getElementById('opt-pro-paper')?.value || 'a4',
      orient: document.getElementById('opt-pro-orient')?.value || 'portrait',
      nupMode: document.getElementById('opt-pro-nup-mode')?.value || '2',
      nupGapMm: Math.max(0, Math.min(20, Number(document.getElementById('opt-pro-nup-gap-mm')?.value || 0))),
      bookletMarginMm: Math.max(0, Math.min(20, Number(document.getElementById('opt-pro-booklet-margin-mm')?.value || 0))),
      bookletGutterMm: Math.max(0, Math.min(30, Number(document.getElementById('opt-pro-booklet-gutter-mm')?.value ?? 4))),
      mixRev2: Boolean(document.getElementById('opt-pro-mix-rev2')?.checked),
      blankCount: Math.max(1, Math.min(200, Number(document.getElementById('opt-pro-blank-count')?.value || 10))),
      blankSize: document.getElementById('opt-pro-blank-size')?.value || 'a4',
      blankStyle: document.getElementById('opt-pro-blank-style')?.value || 'ruled',
      grayMode: document.getElementById('opt-pro-gray-mode')?.value || 'gray',
      pdfaTitle: document.getElementById('opt-pro-pdfa-title')?.value?.trim() || '',
      annPage: Math.max(1, Number(document.getElementById('opt-pro-ann-page')?.value || 1)),
      annType: document.getElementById('opt-pro-ann-type')?.value || 'sticky',
      annText: document.getElementById('opt-pro-ann-text')?.value?.trim() || 'Ghi chú',
      annX: Number(document.getElementById('opt-pro-ann-x')?.value || 15),
      annY: Number(document.getElementById('opt-pro-ann-y')?.value || 20),
      hfHeader: document.getElementById('opt-pro-hf-header')?.value || '',
      hfFooter: document.getElementById('opt-pro-hf-footer')?.value || '',
      hfHPos: document.getElementById('opt-pro-hf-hpos')?.value || 'center',
      hfFPos: document.getElementById('opt-pro-hf-fpos')?.value || 'center',
      hfHLine: Boolean(document.getElementById('opt-pro-hf-hline')?.checked),
      hfFLine: Boolean(document.getElementById('opt-pro-hf-fline')?.checked),
      hfSkip1: Boolean(document.getElementById('opt-pro-hf-skip1')?.checked),
      hfStyle: NS.dangLovePdfTextUtils?.readWordStyleBar
        ? NS.dangLovePdfTextUtils.readWordStyleBar('hf', { fontSize: 11, color: '#334155', fontFamily: '"Times New Roman", Georgia, serif', bold: true })
        : {},
      tocTitle: document.getElementById('opt-pro-toc-title')?.value?.trim() || 'MỤC LỤC TÀI LIỆU',
      tocStyle: document.getElementById('opt-pro-toc-style')?.value || 'dots',
      tocLines: document.getElementById('opt-pro-toc-lines')?.value || '',
      tocStyleWord: NS.dangLovePdfTextUtils?.readWordStyleBar
        ? NS.dangLovePdfTextUtils.readWordStyleBar('toc', { fontSize: 14, color: '#18181b', fontFamily: '"Times New Roman", Georgia, serif', bold: false })
        : {},
      epubOut: document.getElementById('opt-pro-epub-out')?.value || 'pdf',
      epubTitle: document.getElementById('opt-pro-epub-title')?.value?.trim() || '',
      p2xOut: document.getElementById('opt-pro-p2x-out')?.value || 'xlsx',
      deskewDeg: Number(document.getElementById('opt-pro-deskew-deg')?.value || 0),
      denoiseWhite: Boolean(document.getElementById('opt-pro-denoise-white')?.checked),
      metaScrub: Boolean(document.getElementById('opt-pro-meta-scrub')?.checked),
      metaTitle: document.getElementById('opt-pro-meta-title')?.value?.trim() || '',
      metaAuthor: document.getElementById('opt-pro-meta-author')?.value?.trim() || '',
      metaKeywords: document.getElementById('opt-pro-meta-keywords')?.value?.trim() || '',
      secMode: document.getElementById('opt-pro-sec-mode')?.value || 'unlock',
      secPass: document.getElementById('opt-pro-sec-pass')?.value || '',
      secNoPrint: Boolean(document.getElementById('opt-pro-sec-noprint')?.checked),
      redactWords: document.getElementById('opt-pro-redact-words')?.value || '',
      redactX: Number(document.getElementById('opt-pro-redact-x')?.value || 0),
      redactY: Number(document.getElementById('opt-pro-redact-y')?.value || 0),
      redactW: Number(document.getElementById('opt-pro-redact-w')?.value || 0),
      redactH: Number(document.getElementById('opt-pro-redact-h')?.value || 0),
      cmpVisual: Boolean(document.getElementById('opt-pro-cmp-visual')?.checked),
      batchGray: Boolean(document.getElementById('opt-batch-gray')?.checked),
      batchWm: Boolean(document.getElementById('opt-batch-wm')?.checked),
      batchWmText: document.getElementById('opt-batch-wm-text')?.value?.trim() || 'BẢN LƯU NỘI BỘ',
      batchPn: Boolean(document.getElementById('opt-batch-pn')?.checked),
      batchMeta: Boolean(document.getElementById('opt-batch-meta')?.checked),
      batchFlatten: Boolean(document.getElementById('opt-batch-flatten')?.checked),
      localCmd: document.getElementById('opt-pro-local-cmd')?.value || 'office_to_pdf',
    };
  }

  // ==========================================================================
  // 4. BỘ THỰC THI 22 CÔNG CỤ PRO MỚI (TRẢ VỀ MẢNG [{ name, blob }] HOẶC NULL)
  // ==========================================================================
  async function executeProTool(ctrl, tool, opts, pro, helpers) {
    const {
      ensurePdfLib,
      ensurePdfJs,
      ensureJsZip,
      ensureXlsx,
      parsePageRanges,
      renderVietnameseTextToPngBytes,
      renderLinesToVietnamesePdfBlob,
      buildDocxBlobFromParagraphs,
      baseName,
      prog,
    } = helpers;

    const outputs = [];

    // 1. TRÍCH XUẤT & ĐẢO NGƯỢC TRANG
    if (tool.id === 'extract_pages') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      let indices = [];
      if (pro.extractMode === 'reverse') {
        for (let i = total - 1; i >= 0; i--) indices.push(i);
      } else if (pro.extractMode === 'odd') {
        for (let i = 0; i < total; i += 2) indices.push(i);
      } else if (pro.extractMode === 'even') {
        for (let i = 1; i < total; i += 2) indices.push(i);
      } else {
        const groups = parsePageRanges(pro.extractRange, total);
        indices = groups.flat();
      }
      if (!indices.length) indices = [0];
      prog(55, `Đang trích xuất ${indices.length} trang...`);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      outputs.push({ name: `${baseName}_${pro.extractMode === 'reverse' ? 'DaoTrang' : 'TrichXuat'}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 2. ĐỔI KHỔ GIẤY & CO GIÃN TRANG (RESIZE / SCALE)
    if (tool.id === 'resize_scale') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const [bw, bh] = PAPER_SIZES[pro.paper] || PAPER_SIZES.a4;
      const targetW = pro.orient === 'landscape' ? bh : bw;
      const targetH = pro.orient === 'landscape' ? bw : bh;
      const pages = src.getPages();
      for (let i = 0; i < pages.length; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + ((i + 1) / pages.length) * 75, `Đang chuẩn hóa khổ ${pro.paper.toUpperCase()} trang ${i + 1}/${pages.length}...`);
        const emb = await out.embedPage(pages[i]);
        const newPg = out.addPage([targetW, targetH]);
        const margin = 16;
        const sc = Math.min((targetW - margin * 2) / emb.width, (targetH - margin * 2) / emb.height);
        const dw = emb.width * sc;
        const dh = emb.height * sc;
        newPg.drawPage(emb, { x: (targetW - dw) / 2, y: (targetH - dh) / 2, width: dw, height: dh });
      }
      outputs.push({ name: `${baseName}_${pro.paper.toUpperCase()}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 3. DÀN TRANG N-UP (2/4/6/9) & ĐÓNG GÁY SÁCH (BOOKLET IMPOSITION)
    if (tool.id === 'nup_booklet') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const srcPages = src.getPages();
      const embedded = [];
      for (let i = 0; i < srcPages.length; i++) {
        embedded.push(await out.embedPage(srcPages[i]));
      }

      const MM_TO_PT = 2.83465;
      const gapPt = (pro.nupGapMm || 0) * MM_TO_PT;
      const outerMarginPt = (pro.bookletMarginMm || 0) * MM_TO_PT;
      const gutterPt = (pro.bookletGutterMm ?? 4) * MM_TO_PT;

      if (pro.nupMode === 'booklet') {
        const padded = embedded.slice();
        while (padded.length % 4 !== 0) padded.push(null);
        const total = padded.length;
        const sheetW = 841.89; // A4 ngang
        const sheetH = 595.28;
        const halfInnerW = Math.max(40, (sheetW - outerMarginPt * 2 - gutterPt) / 2);
        const innerH = Math.max(40, sheetH - outerMarginPt * 2);
        for (let s = 0; s < total / 2; s++) {
          prog(15 + ((s + 1) / (total / 2)) * 75, `Đang ghép mặt sách ${s + 1}/${total / 2}...`);
          const isFront = s % 2 === 0;
          const leftIdx = isFront ? total - 1 - s : s;
          const rightIdx = isFront ? s : total - 1 - s;
          const pg = out.addPage([sheetW, sheetH]);
          const drawBookletSide = (emb, isLeftSide) => {
            if (!emb) return;
            const sc = Math.min(halfInnerW / emb.width, innerH / emb.height);
            const dw = emb.width * sc;
            const dh = emb.height * sc;
            // Căn sát về phía gáy sách (cách trục giữa đúng gutterPt/2) để khi gập đôi liền mạch như sách in thật!
            const spineX = sheetW / 2;
            const x = isLeftSide ? spineX - gutterPt / 2 - dw : spineX + gutterPt / 2;
            const y = outerMarginPt + (innerH - dh) / 2;
            pg.drawPage(emb, { x, y, width: dw, height: dh });
          };
          drawBookletSide(padded[leftIdx], true);
          drawBookletSide(padded[rightIdx], false);
        }
        outputs.push({ name: `${baseName}_Booklet_DongGay.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      const n = Number(pro.nupMode) || 2;
      const gridMap = { 2: [2, 1, 841.89, 595.28], 4: [2, 2, 595.28, 841.89], 6: [3, 2, 841.89, 595.28], 9: [3, 3, 595.28, 841.89] };
      const [cols, rows, sw, sh] = gridMap[n] || gridMap[2];
      const cellW = Math.max(20, (sw - outerMarginPt * 2 - gapPt * (cols - 1)) / cols);
      const cellH = Math.max(20, (sh - outerMarginPt * 2 - gapPt * (rows - 1)) / rows);
      const perSheet = cols * rows;
      // Khi khoảng hở = 0mm -> tính khung trang chung gọn để các trang nằm sát liền nhau không bị hở khoảng trắng thừa!
      const refEmb = embedded[0];
      const uniformScale = refEmb ? Math.min(cellW / refEmb.width, cellH / refEmb.height) : 1;
      const tileW = refEmb ? refEmb.width * uniformScale : cellW;
      const tileH = refEmb ? refEmb.height * uniformScale : cellH;
      const totalGridW = tileW * cols + gapPt * (cols - 1);
      const totalGridH = tileH * rows + gapPt * (rows - 1);
      const originX = (sw - totalGridW) / 2;
      const originTopY = (sh + totalGridH) / 2;

      for (let start = 0; start < embedded.length; start += perSheet) {
        prog(15 + ((start + perSheet) / embedded.length) * 75, `Đang dàn trang ${Math.floor(start / perSheet) + 1}...`);
        const pg = out.addPage([sw, sh]);
        for (let k = 0; k < perSheet && start + k < embedded.length; k++) {
          const emb = embedded[start + k];
          const col = k % cols;
          const row = Math.floor(k / cols);
          const sc = Math.min(tileW / emb.width, tileH / emb.height);
          const dw = emb.width * sc;
          const dh = emb.height * sc;
          const x = originX + col * (tileW + gapPt) + (tileW - dw) / 2;
          const y = originTopY - (row + 1) * tileH - row * gapPt + (tileH - dh) / 2;
          pg.drawPage(emb, { x, y, width: dw, height: dh });
        }
      }
      outputs.push({ name: `${baseName}_${n}TrangTren1To.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 4. TRỘN XEN KẼ 2 FILE PDF (ALTERNATE & MIX — SEJDA PRO)
    if (tool.id === 'alternate_mix') {
      const { PDFDocument } = await ensurePdfLib();
      const doc1 = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const doc2 = await PDFDocument.load(ctrl.files[1].bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const idx1 = doc1.getPageIndices();
      const idx2 = pro.mixRev2 ? doc2.getPageIndices().reverse() : doc2.getPageIndices();
      const maxLen = Math.max(idx1.length, idx2.length);
      for (let i = 0; i < maxLen; i++) {
        prog(15 + ((i + 1) / maxLen) * 75, `Đang ghép xen kẽ cặp trang ${i + 1}/${maxLen}...`);
        if (i < idx1.length) {
          const [p1] = await out.copyPages(doc1, [idx1[i]]);
          out.addPage(p1);
        }
        if (i < idx2.length) {
          const [p2] = await out.copyPages(doc2, [idx2[i]]);
          out.addPage(p2);
        }
      }
      outputs.push({ name: `${baseName}_TronXenKe.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 5. TẠO SỔ PDF TRẮNG / KẺ NGANG / Ô LY / CHẤM BI
    if (tool.id === 'create_blank_pdf') {
      const { PDFDocument, rgb } = await ensurePdfLib();
      const out = await PDFDocument.create();
      const [w, h] = PAPER_SIZES[pro.blankSize] || PAPER_SIZES.a4;
      const lineCol = rgb(0.82, 0.85, 0.9);
      for (let p = 0; p < pro.blankCount; p++) {
        prog(15 + ((p + 1) / pro.blankCount) * 75, `Đang tạo trang ${p + 1}/${pro.blankCount}...`);
        const pg = out.addPage([w, h]);
        if (pro.blankStyle === 'ruled') {
          for (let y = h - 54; y >= 42; y -= 24) {
            pg.drawLine({ start: { x: 36, y }, end: { x: w - 36, y }, thickness: 0.7, color: lineCol });
          }
        } else if (pro.blankStyle === 'grid') {
          for (let y = h - 36; y >= 36; y -= 20) pg.drawLine({ start: { x: 36, y }, end: { x: w - 36, y }, thickness: 0.5, color: lineCol });
          for (let x = 36; x <= w - 36; x += 20) pg.drawLine({ start: { x, y: 36 }, end: { x, y: h - 36 }, thickness: 0.5, color: lineCol });
        } else if (pro.blankStyle === 'dots') {
          for (let y = h - 36; y >= 36; y -= 20) {
            for (let x = 36; x <= w - 36; x += 20) {
              pg.drawCircle({ x, y, size: 0.9, color: rgb(0.68, 0.72, 0.78) });
            }
          }
        }
      }
      outputs.push({ name: `SoGhiChu_${pro.blankStyle}_${pro.blankCount}Trang.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 6. SỬA LỖI CẤU TRÚC PDF (REPAIR PDF)
    if (tool.id === 'repair_pdf') {
      const { PDFDocument } = await ensurePdfLib();
      prog(30, 'Đang quét cấu trúc nhị phân và dựng lại bảng xref...');
      try {
        const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true, throwOnInvalidObject: false });
        const rebuilt = await PDFDocument.create();
        const copied = await rebuilt.copyPages(src, src.getPageIndices());
        copied.forEach((p) => rebuilt.addPage(p));
        rebuilt.setProducer('ĐăngLovePDF Repair Engine');
        outputs.push({ name: `${baseName}_DaSuaLoi.pdf`, blob: new Blob([await rebuilt.save({ useObjectStreams: false })], { type: 'application/pdf' }) });
        return outputs;
      } catch (_errStruct) {
        // Phương án dự phòng: render phục hồi từng trang bằng PDF.js
        const pdfjsLib = await ensurePdfJs();
        const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
        const rebuilt = await PDFDocument.create();
        for (let i = 1; i <= pdf.numPages; i++) {
          prog(30 + (i / pdf.numPages) * 60, `Đang phục hồi hình ảnh trang ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1.7 });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
          const emb = await rebuilt.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.9)));
          const p = rebuilt.addPage([vp.width / 1.7, vp.height / 1.7]);
          p.drawImage(emb, { x: 0, y: 0, width: vp.width / 1.7, height: vp.height / 1.7 });
        }
        outputs.push({ name: `${baseName}_DaPhucHoi.pdf`, blob: new Blob([await rebuilt.save()], { type: 'application/pdf' }) });
        return outputs;
      }
    }

    // 7 & 8. ĐEN TRẮNG (GRAYSCALE) & ĐẢO MÀU BAN ĐÊM (DARK MODE)
    if (tool.id === 'grayscale_pdf' || tool.id === 'invert_dark_pdf') {
      const pdfjsLib = await ensurePdfJs();
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(12 + (i / pdf.numPages) * 80, `Đang xử lý màu trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 1.65 });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const d = imgData.data;
        if (tool.id === 'grayscale_pdf') {
          const isBw = pro.grayMode === 'bw';
          for (let k = 0; k < d.length; k += 4) {
            let g = 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
            if (isBw) g = g > 175 ? 255 : g < 90 ? 0 : g;
            d[k] = d[k + 1] = d[k + 2] = g;
          }
        } else {
          // Dark mode dịu mắt (nền #141821 thay vì đen gắt #000)
          for (let k = 0; k < d.length; k += 4) {
            d[k] = Math.min(255, Math.max(18, 255 - d[k] + 12));
            d[k + 1] = Math.min(255, Math.max(22, 255 - d[k + 1] + 14));
            d[k + 2] = Math.min(255, Math.max(30, 255 - d[k + 2] + 18));
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.88)));
        const pg = out.addPage([baseVp.width, baseVp.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
      const suffix = tool.id === 'grayscale_pdf' ? 'DenTrang' : 'DarkMode';
      outputs.push({ name: `${baseName}_${suffix}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 9. CHUẨN HÓA LƯU TRỮ PDF/A & FAST WEB VIEW
    if (tool.id === 'pdf_a_archive') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      prog(45, 'Đang làm phẳng thành phần động & chuẩn hóa lưu trữ ISO...');
      try { src.getForm().flatten(); } catch (_e) {}
      src.setTitle(pro.pdfaTitle || baseName);
      src.setCreator('ĐăngLovePDF Archival ISO Engine');
      src.setProducer('ĐăngLovePDF PDF/A Normalizer');
      src.setModificationDate(new Date());
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach((p) => out.addPage(p));
      out.setTitle(pro.pdfaTitle || baseName);
      out.setProducer('ĐăngLovePDF PDF/A Archival');
      outputs.push({ name: `${baseName}_PDFA.pdf`, blob: new Blob([await out.save({ useObjectStreams: false })], { type: 'application/pdf' }) });
      return outputs;
    }

    // 10. TRÌNH CHỈNH SỬA PDF TRỰC QUAN (TRUE INTERACTIVE VISUAL EDITOR — MOD 46C)
    if (tool.id === 'annotate_edit') {
      if (NS.dangLovePdfStudioPro?.editor?.exportToPdfBlob) {
        const blob = await NS.dangLovePdfStudioPro.editor.exportToPdfBlob(ctrl.files[0], helpers);
        outputs.push({ name: `${baseName}_DaChinhSua.pdf`, blob });
        return outputs;
      }
      outputs.push({ name: `${baseName}_DaChinhSua.pdf`, blob: new Blob([ctrl.files[0].bytes], { type: 'application/pdf' }) });
      return outputs;
    }

    // 10B. TRÌNH ĐỌC & XEM TRƯỚC PDF 4 LỚP CHUYÊN NGHIỆP
    if (tool.id === 'pdf_viewer_pro') {
      const f0 = ctrl.files[0];
      const blob = new Blob([f0.bytes], { type: 'application/pdf' });
      const url = ctrl.trackUrl(blob);
      if (NS.dangLovePdfStudioPro?.openProPdfViewer) {
        NS.dangLovePdfStudioPro.openProPdfViewer({ name: f0.name, size: blob.size, blob, url }, ensurePdfJs);
      }
      outputs.push({ name: f0.name, blob });
      return outputs;
    }

    // 10C. CẮT ĐÔI TRANG SÁCH A3, IN ÁP PHÍCH (POSTERIZE) & TÁCH THEO TRANG TRẮNG/TỪ KHÓA
    if (tool.id === 'split_smart_books') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const srcPages = src.getPages();

      if (pro.smartSplitMode === 'split_half_lr' || pro.smartSplitMode === 'split_half_rl') {
        const out = await PDFDocument.create();
        for (let i = 0; i < srcPages.length; i++) {
          prog(15 + ((i + 1) / srcPages.length) * 75, `Đang cắt đôi trang ${i + 1}/${srcPages.length}...`);
          const { width, height } = srcPages[i].getSize();
          const halfW = width / 2;
          const emb = await out.embedPage(srcPages[i]);
          const order = pro.smartSplitMode === 'split_half_rl' ? [1, 0] : [0, 1];
          for (const side of order) {
            const p = out.addPage([halfW, height]);
            p.drawPage(emb, { x: side === 0 ? 0 : -halfW, y: 0, width, height });
          }
        }
        outputs.push({ name: `${baseName}_CatDoiTrang.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      if (pro.smartSplitMode === 'posterize_2x2') {
        const out = await PDFDocument.create();
        for (let i = 0; i < srcPages.length; i++) {
          prog(15 + ((i + 1) / srcPages.length) * 75, `Đang chia áp phích 2×2 trang ${i + 1}/${srcPages.length}...`);
          const { width, height } = srcPages[i].getSize();
          const emb = await out.embedPage(srcPages[i]);
          const tileW = width / 2;
          const tileH = height / 2;
          // 4 mảnh: Trên-Trái, Trên-Phải, Dưới-Trái, Dưới-Phải
          const offsets = [[0, -tileH], [-tileW, -tileH], [0, 0], [-tileW, 0]];
          for (const [ox, oy] of offsets) {
            const p = out.addPage([tileW, tileH]);
            p.drawPage(emb, { x: ox, y: oy, width, height });
          }
        }
        outputs.push({ name: `${baseName}_Posterize_2x2.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      // Tách theo trang trắng hoặc từ khóa
      const pdfjsLib = await ensurePdfJs();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const groups = [];
      let cur = [];
      const kw = (pro.smartSplitKw || '').toLowerCase();
      for (let i = 1; i <= pdf.numPages; i++) {
        prog(15 + (i / pdf.numPages) * 55, `Đang phân tích nội dung trang ${i}/${pdf.numPages}...`);
        const pg = await pdf.getPage(i);
        const tc = await pg.getTextContent();
        const txt = tc.items.map((x) => x.str).join(' ').trim();
        if (pro.smartSplitMode === 'split_blank') {
          if (txt.length < 3) {
            if (cur.length) { groups.push(cur); cur = []; }
          } else {
            cur.push(i - 1);
          }
        } else {
          if (kw && txt.toLowerCase().includes(kw) && cur.length) {
            groups.push(cur);
            cur = [i - 1];
          } else {
            cur.push(i - 1);
          }
        }
      }
      if (cur.length) groups.push(cur);
      if (!groups.length) groups.push(src.getPageIndices());
      for (let g = 0; g < groups.length; g++) {
        const part = await PDFDocument.create();
        (await part.copyPages(src, groups[g])).forEach((p) => part.addPage(p));
        outputs.push({ name: `${baseName}_PhanThongMinh_${g + 1}.pdf`, blob: new Blob([await part.save()], { type: 'application/pdf' }) });
      }
      return outputs;
    }

    // 10D. CHUYỂN ĐỔI MỞ RỘNG: SVG / EMAIL (.EML) / TRUYỆN (.CBZ) → PDF
    if (tool.id === 'svg_eml_to_pdf') {
      const f = ctrl.files[0];
      if (/\.svg$/i.test(f.name)) {
        prog(40, 'Đang dựng đồ họa vector SVG sang PDF...');
        const svgText = await f.file.text();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = ctrl.trackUrl(svgBlob);
        const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = svgUrl; });
        const c = document.createElement('canvas');
        c.width = Math.max(400, img.naturalWidth || 800);
        c.height = Math.max(400, img.naturalHeight || 600);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const { PDFDocument } = await ensurePdfLib();
        const out = await PDFDocument.create();
        const emb = await out.embedPng(dataUrlToUint8(c.toDataURL('image/png')));
        const pg = out.addPage([c.width * 0.75, c.height * 0.75]);
        pg.drawImage(emb, { x: 0, y: 0, width: c.width * 0.75, height: c.height * 0.75 });
        outputs.push({ name: `${baseName}.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }
      if (/\.cbz$/i.test(f.name)) {
        const JSZip = await ensureJsZip();
        const { PDFDocument } = await ensurePdfLib();
        const z = await JSZip.loadAsync(f.bytes);
        const imgKeys = Object.keys(z.files).filter((k) => /\.(png|jpe?g|webp)$/i.test(k)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const out = await PDFDocument.create();
        for (let i = 0; i < imgKeys.length; i++) {
          prog(15 + ((i + 1) / Math.max(1, imgKeys.length)) * 75, `Đang ghép trang truyện ${i + 1}/${imgKeys.length}...`);
          const b = await z.files[imgKeys[i]].async('blob');
          const u = ctrl.trackUrl(b);
          const im = await new Promise((res, rej) => { const el = new Image(); el.onload = () => res(el); el.onerror = rej; el.src = u; });
          const c = document.createElement('canvas');
          c.width = im.naturalWidth || im.width;
          c.height = im.naturalHeight || im.height;
          c.getContext('2d').drawImage(im, 0, 0);
          const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.9)));
          const pg = out.addPage([c.width, c.height]);
          pg.drawImage(emb, { x: 0, y: 0, width: c.width, height: c.height });
        }
        outputs.push({ name: `${baseName}_Comic.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }
      // .EML Email -> PDF
      prog(40, 'Đang phân tích nội dung Email (.EML)...');
      const rawEml = await f.file.text();
      const lines = rawEml.replace(/\r/g, '').split('\n').slice(0, 1200);
      const pdfBlob = await renderLinesToVietnamesePdfBlob(`Email: ${baseName}`, lines, prog);
      outputs.push({ name: `${baseName}_Email.pdf`, blob: pdfBlob });
      return outputs;
    }

    // 10E. BIỂU MẪU TƯƠNG TÁC (ACROFORM FILLER & BUILDER)
    if (tool.id === 'form_filler_builder') {
      const { PDFDocument } = await ensurePdfLib();
      const doc = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const form = doc.getForm();
      const entries = pro.formData
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const eq = l.indexOf('=');
          return eq > 0 ? { key: l.slice(0, eq).trim(), val: l.slice(eq + 1).trim() } : { key: l, val: '' };
        });

      if (pro.formMode === 'export_json') {
        prog(60, 'Đang trích xuất danh sách ô AcroForm...');
        const data = form.getFields().map((fld) => {
          let value = '';
          try { value = fld.getText?.() ?? fld.isChecked?.() ?? fld.getSelected?.() ?? ''; } catch (_e) {}
          return { name: fld.getName(), type: fld.constructor?.name || 'Field', value };
        });
        outputs.push({ name: `${baseName}_FormData.json`, blob: new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }) });
        return outputs;
      }

      if (pro.formMode === 'fill_json') {
        prog(60, 'Đang điền dữ liệu vào các trường AcroForm...');
        for (const e of entries) {
          try {
            const tf = form.getTextField(e.key);
            tf.setText(e.val);
          } catch (_e1) {
            try {
              const cb = form.getCheckBox(e.key);
              if (/true|1|yes|x/i.test(e.val)) cb.check();
              else cb.uncheck();
            } catch (_e2) {}
          }
        }
        outputs.push({ name: `${baseName}_DaDienForm.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
        return outputs;
      }

      // add_fields: tạo mới các ô nhập liệu AcroForm chuẩn vào trang 1
      prog(55, 'Đang tạo mới các ô nhập liệu tương tác (AcroForm)...');
      const pg = doc.getPages()[0];
      const { height } = pg.getSize();
      let curY = height - 90;
      for (const e of entries) {
        if (/true|false/i.test(e.val)) {
          const cb = form.createCheckBox(e.key);
          cb.addToPage(pg, { x: 48, y: curY, width: 16, height: 16 });
          if (/true/i.test(e.val)) cb.check();
        } else {
          const tf = form.createTextField(e.key);
          tf.setText(e.val);
          tf.addToPage(pg, { x: 48, y: curY, width: 240, height: 22 });
        }
        curY -= 32;
        if (curY < 48) break;
      }
      outputs.push({ name: `${baseName}_FormTuongTac.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 10F. TRỘN DỮ LIỆU HÀNG LOẠT (PDF MAIL MERGE TỪ EXCEL/CSV)
    if (tool.id === 'pdf_mail_merge') {
      const pdfRec = ctrl.files.find((f) => /\.pdf$/i.test(f.name));
      const sheetRec = ctrl.files.find((f) => /\.(xlsx|xls|csv)$/i.test(f.name));
      if (!pdfRec || !sheetRec) {
        throw new Error('Hãy nạp đủ 1 tệp mẫu .PDF và 1 tệp danh sách .XLSX hoặc .CSV để trộn hàng loạt!');
      }
      const { PDFDocument } = await ensurePdfLib();
      const XLSX = await ensureXlsx();
      const wb = XLSX.read(sheetRec.bytes, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).slice(0, pro.mergeLimit);
      if (!rows.length) throw new Error('Tệp Excel/CSV không có dòng dữ liệu nào.');

      for (let i = 0; i < rows.length; i++) {
        if (ctrl.cancelled) return [];
        prog(12 + ((i + 1) / rows.length) * 80, `Đang trộn bản ghi ${i + 1}/${rows.length}...`);
        const row = rows[i];
        const doc = await PDFDocument.load(pdfRec.bytes, { ignoreEncryption: true });
        const form = doc.getForm();
        let filledFormAny = false;
        for (const [k, v] of Object.entries(row)) {
          try {
            form.getTextField(k).setText(String(v ?? ''));
            filledFormAny = true;
          } catch (_e) {}
        }
        if (!filledFormAny) {
          // Nếu mẫu PDF tĩnh không có AcroForm -> in dòng dữ liệu gọn đẹp vào vùng trống trang 1
          const pg = doc.getPages()[0];
          const { height } = pg.getSize();
          const summary = Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('  |  ');
          const png = renderVietnameseTextToPngBytes(summary, { fontSize: 13, color: '#0f172a', bold: true, padX: 8, padY: 5 });
          const emb = await doc.embedPng(png.bytes);
          pg.drawImage(emb, { x: 36, y: height - 56, width: Math.min(520, png.widthPt), height: png.heightPt });
        }
        const safeTag = String(Object.values(row)[0] || `Ban_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
        outputs.push({ name: `${baseName}_${i + 1}_${safeTag}.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      }
      return outputs;
    }

    // 10G. CHẾ BẢN IN ẤN (BLEED + CROP MARKS + COLOR BARS CMYK)
    if (tool.id === 'prepress_bleed_marks') {
      const { PDFDocument, rgb } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const bleedPt = (pro.bleedMm || 5) * 2.83465;
      const markPad = 24;
      const srcPages = src.getPages();
      for (let i = 0; i < srcPages.length; i++) {
        prog(15 + ((i + 1) / srcPages.length) * 75, `Đang chế bản in trang ${i + 1}/${srcPages.length}...`);
        const emb = await out.embedPage(srcPages[i]);
        const newW = emb.width + (bleedPt + markPad) * 2;
        const newH = emb.height + (bleedPt + markPad) * 2;
        const pg = out.addPage([newW, newH]);
        const ox = bleedPt + markPad;
        const oy = bleedPt + markPad;
        pg.drawPage(emb, { x: ox, y: oy, width: emb.width, height: emb.height });
        if (pro.cropMarks) {
          const col = rgb(0, 0, 0);
          const len = 14;
          const corners = [
            [ox, oy],
            [ox + emb.width, oy],
            [ox, oy + emb.height],
            [ox + emb.width, oy + emb.height],
          ];
          corners.forEach(([cx, cy], ci) => {
            const dx = ci % 2 === 0 ? -1 : 1;
            const dy = ci < 2 ? -1 : 1;
            pg.drawLine({ start: { x: cx + dx * 4, y: cy }, end: { x: cx + dx * (4 + len), y: cy }, thickness: 0.6, color: col });
            pg.drawLine({ start: { x: cx, y: cy + dy * 4 }, end: { x: cx, y: cy + dy * (4 + len) }, thickness: 0.6, color: col });
          });
        }
        if (pro.colorBars) {
          const swatches = [rgb(0, 0.7, 0.9), rgb(0.9, 0.1, 0.5), rgb(0.95, 0.85, 0), rgb(0.1, 0.1, 0.1)];
          swatches.forEach((sc, si) => {
            pg.drawRectangle({ x: ox + si * 22, y: newH - 16, width: 18, height: 8, color: sc });
          });
        }
      }
      outputs.push({ name: `${baseName}_Prepress_PrintReady.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 10H. LÀM SẠCH DỮ LIỆU ẨN TOÀN DIỆN (DEEP FORENSICS SANITIZATION)
    if (tool.id === 'deep_sanitize') {
      const pdfjsLib = await ensurePdfJs();
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const cleanDoc = await PDFDocument.create();
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + (i / pdf.numPages) * 75, `Đang loại bỏ dữ liệu ẩn & lịch sử trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        // Render đúng khung CropBox -> hủy vĩnh viễn mọi đối tượng nằm ngoài lề cắt, JS, lớp ẩn & lịch sử Incremental!
        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 1.85 });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        const emb = await cleanDoc.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.92)));
        const pg = cleanDoc.addPage([baseVp.width, baseVp.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
      cleanDoc.setTitle('');
      cleanDoc.setAuthor('');
      cleanDoc.setSubject('');
      cleanDoc.setKeywords([]);
      cleanDoc.setCreator('');
      cleanDoc.setProducer('');
      outputs.push({ name: `${baseName}_Sanitized_Clean.pdf`, blob: new Blob([await cleanDoc.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 11. THÊM TIÊU ĐỀ ĐẦU & CHÂN TRANG (HEADER & FOOTER — HỖ TRỢ ĐỊNH DẠNG WORD + KÉO THẢ + CHE XÓA CŨ)
    if (tool.id === 'header_footer') {
      const { PDFDocument, rgb } = await ensurePdfLib();
      const doc = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      const total = pages.length;
      const dateStr = new Date().toLocaleDateString('vi-VN');
      const st = pro.hfStyle || {};
      const simState = ctrl.paperSimState?.toolId === 'header_footer' ? ctrl.paperSimState : null;
      const alignX = (pos, pageW, imgW) => {
        if (pos === 'left') return 32;
        if (pos === 'right') return Math.max(32, pageW - imgW - 32);
        return (pageW - imgW) / 2;
      };
      for (let i = 0; i < total; i++) {
        if (pro.hfSkip1 && i === 0) continue;
        prog(15 + ((i + 1) / total) * 75, `Đang gắn Header/Footer trang ${i + 1}/${total}...`);
        const pg = pages[i];
        const { width, height } = pg.getSize();
        if (simState?.eraseRects?.length) {
          simState.eraseRects.forEach((r) => {
            pg.drawRectangle({
              x: (r.xPct / 100) * width,
              y: Math.max(0, height - ((r.yPct + r.hPct) / 100) * height),
              width: (r.wPct / 100) * width,
              height: (r.hPct / 100) * height,
              color: rgb(1, 1, 1),
            });
          });
        }
        const fmt = (tpl) => String(tpl || '').replace(/\{page\}/g, String(i + 1)).replace(/\{total\}/g, String(total)).replace(/\{date\}/g, dateStr);
        if (pro.hfHeader.trim()) {
          const hPng = renderVietnameseTextToPngBytes(fmt(pro.hfHeader), {
            fontSize: st.fontSize || 11,
            color: st.color || '#334155',
            fontFamily: st.fontFamily || '"Times New Roman", Georgia, serif',
            bold: st.bold !== false,
            italic: Boolean(st.italic),
            underline: Boolean(st.underline),
            bgColor: st.bgColor || '',
            padX: 6,
            padY: 3,
          });
          const emb = await doc.embedPng(hPng.bytes);
          const hx = simState?.headerPos?.custom
            ? Math.max(8, Math.min(width - hPng.widthPt - 8, (simState.headerPos.xPct / 100) * width - hPng.widthPt / 2))
            : alignX(pro.hfHPos, width, hPng.widthPt);
          const hy = simState?.headerPos?.custom
            ? Math.max(8, Math.min(height - hPng.heightPt - 8, height - (simState.headerPos.yPct / 100) * height - hPng.heightPt / 2))
            : height - hPng.heightPt - 14;
          pg.drawImage(emb, { x: hx, y: hy, width: hPng.widthPt, height: hPng.heightPt });
          if (pro.hfHLine) {
            pg.drawLine({ start: { x: 32, y: Math.max(4, hy - 4) }, end: { x: width - 32, y: Math.max(4, hy - 4) }, thickness: 0.75, color: rgb(0.55, 0.6, 0.68) });
          }
        }
        if (pro.hfFooter.trim()) {
          const fPng = renderVietnameseTextToPngBytes(fmt(pro.hfFooter), {
            fontSize: st.fontSize || 11,
            color: st.color || '#475569',
            fontFamily: st.fontFamily || '"Times New Roman", Georgia, serif',
            bold: Boolean(st.bold),
            italic: Boolean(st.italic),
            underline: Boolean(st.underline),
            bgColor: st.bgColor || '',
            padX: 6,
            padY: 3,
          });
          const emb = await doc.embedPng(fPng.bytes);
          const fx = simState?.footerPos?.custom
            ? Math.max(8, Math.min(width - fPng.widthPt - 8, (simState.footerPos.xPct / 100) * width - fPng.widthPt / 2))
            : alignX(pro.hfFPos, width, fPng.widthPt);
          const fy = simState?.footerPos?.custom
            ? Math.max(8, Math.min(height - fPng.heightPt - 8, height - (simState.footerPos.yPct / 100) * height - fPng.heightPt / 2))
            : 14;
          pg.drawImage(emb, { x: fx, y: fy, width: fPng.widthPt, height: fPng.heightPt });
          if (pro.hfFLine) {
            pg.drawLine({ start: { x: 32, y: fy + fPng.heightPt + 4 }, end: { x: width - 32, y: fy + fPng.heightPt + 4 }, thickness: 0.75, color: rgb(0.55, 0.6, 0.68) });
          }
        }
      }
      outputs.push({ name: `${baseName}_HeaderFooter.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 12. TẠO TRANG MỤC LỤC TỰ ĐỘNG (AUTO TOC — ĐA KIỂU TRÌNH BÀY + ĐỊNH DẠNG WORD)
    if (tool.id === 'bookmarks_toc') {
      const { PDFDocument } = await ensurePdfLib();
      const src = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const style = pro.tocStyle || 'dots';
      const tocRows = pro.tocLines
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const parts = l.split('|');
          const title = (parts[0] || l).trim();
          const pgNum = (parts[1] || '').trim();
          if (!pgNum) return title;
          if (style === 'space') return `${title}          ${pgNum}`;
          if (style === 'dash') return `${title} ———————————— ${pgNum}`;
          if (style === 'prefix') return `[Trang ${pgNum}]  ·  ${title}`;
          const dotCount = Math.max(6, 48 - Math.min(40, title.length));
          return `${title} ${'.'.repeat(dotCount)} ${pgNum}`;
        });
      prog(40, 'Đang dựng trang Mục lục & ghép vào đầu sách...');
      const tocBlob = await renderLinesToVietnamesePdfBlob(pro.tocTitle, [`# ${pro.tocTitle}`, '', ...tocRows], () => {}, pro.tocStyleWord || {});
      const tocDoc = await PDFDocument.load(await tocBlob.arrayBuffer());
      const out = await PDFDocument.create();
      (await out.copyPages(tocDoc, tocDoc.getPageIndices())).forEach((p) => out.addPage(p));
      (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
      outputs.push({ name: `${baseName}_CoMucLuc.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 13. EPUB → PDF / DOCX / TXT
    if (tool.id === 'epub_to_pdf') {
      const JSZip = await ensureJsZip();
      prog(25, 'Đang giải nén cấu trúc sách điện tử .EPUB...');
      const z = await JSZip.loadAsync(ctrl.files[0].bytes);
      const htmlKeys = Object.keys(z.files)
        .filter((k) => /\.(x?html?|htm)$/i.test(k) && !/nav\.xhtml|toc\./i.test(k))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const allLines = [];
      for (let i = 0; i < htmlKeys.length; i++) {
        prog(25 + ((i + 1) / Math.max(1, htmlKeys.length)) * 45, `Đang đọc chương ${i + 1}/${htmlKeys.length}...`);
        const raw = await z.files[htmlKeys[i]].async('string');
        const div = document.createElement('div');
        div.innerHTML = raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
        const txt = (div.innerText || div.textContent || '').trim();
        if (txt) {
          allLines.push(...txt.split(/\r?\n/).map((x) => x.trim()).filter(Boolean), '');
        }
      }
      if (pro.epubOut === 'txt') {
        outputs.push({ name: `${baseName}.txt`, blob: new Blob([allLines.join('\n')], { type: 'text/plain;charset=utf-8' }) });
      } else if (pro.epubOut === 'docx') {
        outputs.push({ name: `${baseName}.docx`, blob: await buildDocxBlobFromParagraphs(baseName, allLines) });
      } else {
        outputs.push({ name: `${baseName}.pdf`, blob: await renderLinesToVietnamesePdfBlob(baseName, allLines, prog) });
      }
      return outputs;
    }

    // 14. PDF → EPUB
    if (tool.id === 'pdf_to_epub') {
      const pdfjsLib = await ensurePdfJs();
      const JSZip = await ensureJsZip();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const chapters = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + (i / pdf.numPages) * 70, `Đang đọc chữ trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const lines = [];
        let lastY = null;
        let cur = '';
        for (const it of tc.items) {
          const y = Math.round(it.transform?.[5] || 0);
          if (lastY !== null && Math.abs(y - lastY) > 6) {
            if (cur.trim()) lines.push(cur.trim());
            cur = it.str;
          } else {
            cur += (cur && !cur.endsWith(' ') && !it.str.startsWith(' ') ? ' ' : '') + it.str;
          }
          lastY = y;
        }
        if (cur.trim()) lines.push(cur.trim());
        chapters.push({ title: `Trang ${i}`, lines });
      }
      prog(90, 'Đang đóng gói chuẩn sách .EPUB...');
      const epubBlob = await buildEpubBlobFromChapters(pro.epubTitle || baseName, chapters, JSZip);
      outputs.push({ name: `${baseName}.epub`, blob: epubBlob });
      return outputs;
    }

    // 15. PDF → EXCEL (.XLSX) / CSV (QUÉT TỌA ĐỘ X/Y HÀNG & CỘT THÔNG MINH)
    if (tool.id === 'pdf_to_excel') {
      const pdfjsLib = await ensurePdfJs();
      const XLSX = await ensureXlsx();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const wb = XLSX.utils.book_new();
      const allRows = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + (i / pdf.numPages) * 75, `Đang quét hàng & cột bảng trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const rowMap = new Map();
        for (const it of tc.items) {
          const text = String(it.str || '').trim();
          if (!text) continue;
          const x = Math.round(it.transform?.[4] || 0);
          const yBucket = Math.round((it.transform?.[5] || 0) / 8) * 8;
          if (!rowMap.has(yBucket)) rowMap.set(yBucket, []);
          rowMap.get(yBucket).push({ x, text });
        }
        const sortedYs = Array.from(rowMap.keys()).sort((a, b) => b - a);
        const pageRows = sortedYs.map((yb) => {
          const cells = rowMap.get(yb).sort((a, b) => a.x - b.x);
          const mergedCols = [];
          for (const c of cells) {
            const prev = mergedCols[mergedCols.length - 1];
            if (prev && c.x - prev.endX < 18) {
              prev.text += ' ' + c.text;
              prev.endX = c.x + c.text.length * 5;
            } else {
              mergedCols.push({ text: c.text, endX: c.x + c.text.length * 5 });
            }
          }
          return mergedCols.map((m) => m.text);
        });
        const ws = XLSX.utils.aoa_to_sheet(pageRows.length ? pageRows : [['(Trang không có dữ liệu bảng)']]);
        XLSX.utils.book_append_sheet(wb, ws, `Trang_${i}`);
        allRows.push(...pageRows);
      }
      if (pro.p2xOut === 'csv') {
        const wsAll = XLSX.utils.aoa_to_sheet(allRows.length ? allRows : [['(Trống)']]);
        outputs.push({ name: `${baseName}_Bang.csv`, blob: new Blob(['\uFEFF' + XLSX.utils.sheet_to_csv(wsAll)], { type: 'text/csv;charset=utf-8' }) });
      } else {
        const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        outputs.push({ name: `${baseName}_Bang.xlsx`, blob: new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) });
      }
      return outputs;
    }

    // 16. LÀM THẲNG & KHỬ NHIỄU TRANG SCAN (DESKEW & DENOISE)
    if (tool.id === 'deskew_denoise') {
      const pdfjsLib = await ensurePdfJs();
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const out = await PDFDocument.create();
      const rad = (pro.deskewDeg * Math.PI) / 180;
      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(12 + (i / pdf.numPages) * 80, `Đang nắn thẳng & lọc nhiễu trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 1.7 });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        if (Math.abs(rad) > 0.001) {
          ctx.translate(c.width / 2, c.height / 2);
          ctx.rotate(rad);
          ctx.translate(-c.width / 2, -c.height / 2);
        }
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (pro.denoiseWhite) {
          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const d = imgData.data;
          for (let k = 0; k < d.length; k += 4) {
            const lum = 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
            if (lum > 195) {
              d[k] = d[k + 1] = d[k + 2] = 255; // Làm trắng nền ố vàng
            } else if (lum < 120) {
              d[k] = Math.max(0, d[k] - 28);
              d[k + 1] = Math.max(0, d[k + 1] - 28);
              d[k + 2] = Math.max(0, d[k + 2] - 28);
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
        const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.9)));
        const pg = out.addPage([baseVp.width, baseVp.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
      outputs.push({ name: `${baseName}_DaLamSachScan.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 17. XEM, SỬA & XÓA SẠCH SIÊU DỮ LIỆU (METADATA EDITOR & SCRUBBER)
    if (tool.id === 'metadata_editor') {
      const { PDFDocument } = await ensurePdfLib();
      const doc = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      prog(55, pro.metaScrub ? 'Đang xóa trắng 100% siêu dữ liệu ẩn...' : 'Đang cập nhật siêu dữ liệu PDF...');
      if (pro.metaScrub) {
        doc.setTitle('');
        doc.setAuthor('');
        doc.setSubject('');
        doc.setKeywords([]);
        doc.setCreator('');
        doc.setProducer('');
      } else {
        if (pro.metaTitle) doc.setTitle(pro.metaTitle);
        if (pro.metaAuthor) doc.setAuthor(pro.metaAuthor);
        if (pro.metaKeywords) doc.setKeywords(pro.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean));
      }
      outputs.push({ name: `${baseName}_${pro.metaScrub ? 'DaXoaMeta' : 'DaCapNhatMeta'}.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 18. ĐẶT MẬT KHẨU / MỞ KHÓA PDF (PROTECT & UNLOCK + ELECTRON QPDF AES-256)
    if (tool.id === 'protect_unlock_pdf') {
      // Nếu chạy App Desktop có qpdf -> chạy mã hóa/giải mã AES-256 gốc bằng phần cứng máy!
      if (global.NoirDesktopLocalEngine?.runLocalTool) {
        try {
          prog(45, 'Đang gọi nhân hệ thống qpdf (AES-256)...');
          const res = await global.NoirDesktopLocalEngine.runLocalTool({
            cmd: pro.secMode === 'protect' ? 'qpdf_encrypt' : 'qpdf_decrypt',
            filename: ctrl.files[0].name,
            bytes: Array.from(ctrl.files[0].bytes),
            password: pro.secPass,
            noPrint: pro.secNoPrint,
          });
          if (res?.ok && res.bytes) {
            outputs.push({
              name: `${baseName}_${pro.secMode === 'protect' ? 'DaKhoaAES256' : 'DaMoKhoa'}.pdf`,
              blob: new Blob([new Uint8Array(res.bytes)], { type: 'application/pdf' }),
            });
            return outputs;
          }
        } catch (_eDesk) {}
      }

      if (pro.secMode === 'unlock') {
        const pdfjsLib = await ensurePdfJs();
        const { PDFDocument } = await ensurePdfLib();
        prog(35, 'Đang mở khóa bằng mật khẩu & tái tạo PDF tự do...');
        const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice(), password: pro.secPass || undefined }).promise;
        const out = await PDFDocument.create();
        for (let i = 1; i <= pdf.numPages; i++) {
          prog(35 + (i / pdf.numPages) * 55, `Đang giải mã trang ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const baseVp = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: 1.8 });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
          const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.92)));
          const pg = out.addPage([baseVp.width, baseVp.height]);
          pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
        }
        outputs.push({ name: `${baseName}_DaMoKhoa.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      } else {
        // Trên trình duyệt: khóa lớp chống copy & chỉnh sửa (Rasterize + Flatten)
        const pdfjsLib = await ensurePdfJs();
        const { PDFDocument } = await ensurePdfLib();
        const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
        const out = await PDFDocument.create();
        for (let i = 1; i <= pdf.numPages; i++) {
          prog(20 + (i / pdf.numPages) * 70, `Đang khóa lớp chống sao chép & sửa trang ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const baseVp = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: 1.75 });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
          const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.9)));
          const pg = out.addPage([baseVp.width, baseVp.height]);
          pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
        }
        out.setCreator('ĐăngLovePDF Protected Copy');
        outputs.push({ name: `${baseName}_DaKhoaChongCopy.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
        return outputs;
      }
    }

    // 19. CHE ĐEN BẢO MẬT VĨNH VIỄN (TRUE REDACTION — HỦY HOÀN TOÀN CHỮ GỐC)
    if (tool.id === 'true_redaction') {
      const pdfjsLib = await ensurePdfJs();
      const { PDFDocument } = await ensurePdfLib();
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const out = await PDFDocument.create();
      const keywords = pro.redactWords
        .split(',')
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean);
      const scale = 1.8;

      for (let i = 1; i <= pdf.numPages; i++) {
        if (ctrl.cancelled) return [];
        prog(15 + (i / pdf.numPages) * 75, `Đang hủy dữ liệu vùng che đen trang ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        // Tự động tìm và xóa sạch từng từ khóa nhạy cảm + Regex SĐT/CCCD/Email theo tọa độ hộp văn bản
        const regexList = [];
        if (pro.redactPhone) regexList.push(/(?:\+84|0)(?:3|5|7|8|9)[0-9\s.-]{8,11}/);
        if (pro.redactCccd) regexList.push(/\b\d{9,12}\b/);
        if (pro.redactEmail) regexList.push(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
        if (keywords.length || regexList.length) {
          const tc = await page.getTextContent();
          ctx.fillStyle = '#000000';
          for (const it of tc.items) {
            const rawStr = String(it.str || '');
            const s = rawStr.toLowerCase();
            if (!s) continue;
            const hitKw = keywords.some((kw) => s.includes(kw));
            const hitRe = regexList.some((re) => re.test(rawStr));
            if (hitKw || hitRe) {
              const tx = it.transform[4] * scale;
              const ty = vp.height - it.transform[5] * scale;
              const h = Math.max(14, Math.abs(it.height || 12) * scale * 1.25);
              const w = Math.max(24, (it.width || s.length * 7) * scale + 6);
              ctx.fillRect(tx - 3, ty - h + 3, w, h + 4);
            }
          }
        }

        // Xóa sạch vùng hình chữ nhật người dùng chỉ định theo %
        if (pro.redactW > 0 && pro.redactH > 0) {
          ctx.fillStyle = '#000000';
          ctx.fillRect((pro.redactX / 100) * c.width, (pro.redactY / 100) * c.height, (pro.redactW / 100) * c.width, (pro.redactH / 100) * c.height);
        }

        const emb = await out.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.92)));
        const pg = out.addPage([baseVp.width, baseVp.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
      outputs.push({ name: `${baseName}_TrueRedacted.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }) });
      return outputs;
    }

    // 20. SO SÁNH 2 TỆP PDF (SEMANTIC TEXT DIFF + CHỒNG PIXEL VISUAL OVERLAY)
    if (tool.id === 'compare_pdf') {
      const pdfjsLib = await ensurePdfJs();
      const pdf1 = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const pdf2 = await pdfjsLib.getDocument({ data: ctrl.files[1].bytes.slice() }).promise;

      const extractLines = async (pdf) => {
        const outLines = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const tc = await pg.getTextContent();
          const lineStr = tc.items.map((x) => x.str).join(' ').replace(/\s{2,}/g, '\n');
          outLines.push(`=== TRANG ${i} ===`, ...lineStr.split('\n'));
        }
        return outLines;
      };

      prog(30, 'Đang đọc & đối chiếu văn bản 2 tệp PDF...');
      const lines1 = await extractLines(pdf1);
      const lines2 = await extractLines(pdf2);
      const diffRes = computeLineDiff(lines1, lines2);

      let visualOverlayHtml = '';
      if (pro.cmpVisual) {
        const cmpPages = Math.min(pdf1.numPages, pdf2.numPages, 8);
        for (let i = 1; i <= cmpPages; i++) {
          prog(45 + (i / Math.max(1, cmpPages)) * 45, `Đang chồng lớp soi sai lệch từng pixel trang ${i}/${cmpPages}...`);
          const p1 = await pdf1.getPage(i);
          const p2 = await pdf2.getPage(i);
          const vp = p1.getViewport({ scale: 1.25 });
          const c1 = document.createElement('canvas');
          const c2 = document.createElement('canvas');
          c1.width = c2.width = vp.width;
          c1.height = c2.height = vp.height;
          await p1.render({ canvasContext: c1.getContext('2d'), viewport: vp }).promise;
          await p2.render({ canvasContext: c2.getContext('2d'), viewport: vp }).promise;
          const d1 = c1.getContext('2d').getImageData(0, 0, c1.width, c1.height);
          const d2 = c2.getContext('2d').getImageData(0, 0, c2.width, c2.height);
          const outC = document.createElement('canvas');
          outC.width = c1.width;
          outC.height = c1.height;
          const oCtx = outC.getContext('2d');
          const oImg = oCtx.createImageData(c1.width, c1.height);
          let diffPx = 0;
          for (let k = 0; k < d1.data.length; k += 4) {
            const delta = Math.abs(d1.data[k] - d2.data[k]) + Math.abs(d1.data[k + 1] - d2.data[k + 1]) + Math.abs(d1.data[k + 2] - d2.data[k + 2]);
            if (delta > 38) {
              diffPx += 1;
              oImg.data[k] = 239;
              oImg.data[k + 1] = 35;
              oImg.data[k + 2] = 95;
              oImg.data[k + 3] = 255;
            } else {
              const avg = Math.round((d2.data[k] + d2.data[k + 1] + d2.data[k + 2]) / 3);
              oImg.data[k] = oImg.data[k + 1] = oImg.data[k + 2] = Math.min(255, avg + 60);
              oImg.data[k + 3] = 255;
            }
          }
          oCtx.putImageData(oImg, 0, 0);
          visualOverlayHtml += `<div style="margin:14px 0;padding:12px;border:1px solid #334155;border-radius:12px;">
            <div style="font-weight:800;margin-bottom:8px;">Trang ${i} — Phát hiện <span style="color:#fb7185;">${diffPx.toLocaleString('vi-VN')} điểm ảnh khác biệt</span> (tô màu đỏ hồng)</div>
            <img src="${outC.toDataURL('image/jpeg', 0.85)}" style="max-width:100%;border:1px solid #475569;border-radius:8px;" />
          </div>`;
        }
      }

      const reportHtml = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>So sánh PDF — ĐăngLovePDF</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;background:#0f172a;color:#e2e8f0;max-width:980px;margin:20px auto;padding:16px;line-height:1.6}
.add{background:#064e3b;color:#a7f3d0;padding:3px 8px;border-radius:6px;margin:3px 0}
.del{background:#7f1d1d;color:#fecaca;padding:3px 8px;border-radius:6px;margin:3px 0;text-decoration:line-through}
.same{color:#94a3b8;padding:2px 8px}</style></head><body>
<h1>⚖️ Báo Cáo So Sánh 2 Tệp PDF (ĐăngLovePDF)</h1>
<p><strong>Bản #1:</strong> ${escHtml(ctrl.files[0].name)} (${pdf1.numPages} trang) &nbsp;|&nbsp; <strong>Bản #2:</strong> ${escHtml(ctrl.files[1].name)} (${pdf2.numPages} trang)</p>
<p>📊 Tổng kết chữ: <strong style="color:#34d399;">+${diffRes.added} đoạn thêm</strong> · <strong style="color:#fb7185;">-${diffRes.removed} đoạn xóa</strong> · ${diffRes.unchanged} đoạn giống nhau</p>
<h2>1. So sánh văn bản từng dòng (Semantic Text Diff)</h2>
<div>${diffRes.diffs.slice(0, 600).map((d) => `<div class="${d.type}">${d.type === 'add' ? '+ ' : d.type === 'del' ? '- ' : '  '}${escHtml(d.text)}</div>`).join('')}</div>
${visualOverlayHtml ? `<h2>2. Chồng lớp hình ảnh soi từng pixel (Visual Overlay)</h2>${visualOverlayHtml}` : ''}
</body></html>`;
      outputs.push({ name: `BaoCao_SoSanh_${baseName}.html`, blob: new Blob([reportHtml], { type: 'text/html;charset=utf-8' }) });
      return outputs;
    }

    // 21. KIỂM TRA KỸ THUẬT TRƯỚC KHI IN (PREFLIGHT INSPECTOR — HIỆN KẾT QUẢ TRỰC TIẾP, KHÔNG CẦN TẢI FILE!)
    if (tool.id === 'preflight_inspect') {
      const { PDFDocument } = await ensurePdfLib();
      const pdfjsLib = await ensurePdfJs();
      prog(30, 'Đang quét thông số kỹ thuật chuẩn in ấn...');
      const doc = await PDFDocument.load(ctrl.files[0].bytes, { ignoreEncryption: true });
      const pdf = await pdfjsLib.getDocument({ data: ctrl.files[0].bytes.slice() }).promise;
      const pages = doc.getPages();
      const sizes = new Set();
      const orientations = new Set();
      const rows = [];
      let lowTextPages = 0;
      for (let i = 0; i < pages.length; i++) {
        prog(35 + ((i + 1) / pages.length) * 55, `Đang kiểm định trang ${i + 1}/${pages.length}...`);
        const { width, height } = pages[i].getSize();
        const mmW = Math.round(width * 0.352778);
        const mmH = Math.round(height * 0.352778);
        const key = `${mmW}×${mmH}mm`;
        const orient = width > height ? 'Ngang' : 'Dọc';
        sizes.add(key);
        orientations.add(orient);
        const jp = await pdf.getPage(i + 1);
        const tc = await jp.getTextContent();
        const charCount = tc.items.reduce((s, it) => s + String(it.str || '').trim().length, 0);
        if (charCount < 15) lowTextPages += 1;
        rows.push({
          page: i + 1,
          dim: `${mmW} × ${mmH} mm`,
          orient,
          chars: charCount,
          status: charCount < 15 ? '⚠️ Ảnh scan / ít chữ (nên chạy OCR)' : '✅ Lớp chữ sắc nét',
          warn: charCount < 15,
        });
      }
      const isUniform = sizes.size === 1;
      const isSameOrient = orientations.size === 1;
      const score = Math.max(40, 100 - (isUniform ? 0 : 20) - (isSameOrient ? 0 : 10) - Math.min(25, lowTextPages * 3));
      const reportHtml = `
        <div class="space-y-4 text-left">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div class="text-[11px] text-zinc-400">Điểm sẵn sàng in</div>
              <div class="text-xl font-black ${score >= 85 ? 'text-emerald-400' : score >= 65 ? 'text-amber-300' : 'text-rose-400'}">${score}/100</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div class="text-[11px] text-zinc-400">Tổng số trang</div>
              <div class="text-xl font-black text-sky-300">${pages.length} trang</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div class="text-[11px] text-zinc-400">Đồng nhất khổ giấy</div>
              <div class="text-xs font-extrabold mt-1 ${isUniform ? 'text-emerald-400' : 'text-amber-300'}">${isUniform ? `✅ 100% (${[...sizes][0]})` : `⚠️ ${sizes.size} khổ khác nhau`}</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div class="text-[11px] text-zinc-400">Trang ít chữ / ảnh scan</div>
              <div class="text-xs font-extrabold mt-1 ${lowTextPages === 0 ? 'text-emerald-400' : 'text-amber-300'}">${lowTextPages}/${pages.length} trang</div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1 text-zinc-300">
            <div><strong>📄 Tệp kiểm định:</strong> ${escHtml(ctrl.files[0].name)}</div>
            <div><strong>🏷️ Siêu dữ liệu (Tiêu đề / Tác giả):</strong> ${escHtml(doc.getTitle() || '(Trống)')} / ${escHtml(doc.getAuthor() || '(Trống)')}</div>
            <div><strong>📐 Hướng giấy:</strong> ${isSameOrient ? `✅ Thống nhất (${[...orientations][0]})` : `⚠️ Lẫn cả trang Dọc & Ngang`}</div>
            ${!isUniform ? `<div class="text-amber-300 font-bold">💡 Gợi ý: Phát hiện nhiều khổ (${[...sizes].join(', ')}), nên dùng "Đổi khổ giấy" trước khi mang đi in.</div>` : ''}
          </div>

          <div class="max-h-72 overflow-auto rounded-xl border border-zinc-800">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-zinc-950 sticky top-0 text-zinc-400">
                <tr><th class="p-2 border-b border-zinc-800">Trang</th><th class="p-2 border-b border-zinc-800">Kích thước</th><th class="p-2 border-b border-zinc-800">Hướng</th><th class="p-2 border-b border-zinc-800">Số ký tự</th><th class="p-2 border-b border-zinc-800">Đánh giá</th></tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/70">
                ${rows.map((r) => `<tr class="hover:bg-zinc-800/40"><td class="p-2 font-bold">#${r.page}</td><td class="p-2">${r.dim}</td><td class="p-2">${r.orient}</td><td class="p-2">${r.chars}</td><td class="p-2 ${r.warn ? 'text-amber-300' : 'text-emerald-400'} font-bold">${r.status}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      outputs.push({
        __inlineReportOnly: true,
        reportTitle: `🔬 Kết quả Kiểm tra Kỹ thuật Trước Khi In — ${ctrl.files[0].name}`,
        reportHtml,
        name: `Preflight_${baseName}.html`,
        blob: new Blob([reportHtml], { type: 'text/html;charset=utf-8' }),
      });
      return outputs;
    }

    // 22. XỬ LÝ HÀNG LOẠT THEO CHUỖI (BATCH WORKFLOW PIPELINE)
    if (tool.id === 'batch_workflow') {
      const { PDFDocument, degrees } = await ensurePdfLib();
      const pdfjsLib = pro.batchGray ? await ensurePdfJs() : null;
      const wmRendered = pro.batchWm ? renderVietnameseTextToPngBytes(pro.batchWmText, { fontSize: 34, color: '#e11d48', bold: true, padX: 12, padY: 8 }) : null;

      for (let fi = 0; fi < ctrl.files.length; fi++) {
        if (ctrl.cancelled) return [];
        const fRec = ctrl.files[fi];
        const fBase = String(fRec.name || 'file').replace(/\.[^.]+$/, '');
        prog(10 + ((fi + 0.5) / ctrl.files.length) * 82, `Đang chạy chuỗi trên tệp ${fi + 1}/${ctrl.files.length}: ${fRec.name}...`);

        let doc;
        if (pro.batchGray && pdfjsLib) {
          const pdf = await pdfjsLib.getDocument({ data: fRec.bytes.slice() }).promise;
          doc = await PDFDocument.create();
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const bvp = page.getViewport({ scale: 1 });
            const vp = page.getViewport({ scale: 1.4 });
            const c = document.createElement('canvas');
            c.width = vp.width;
            c.height = vp.height;
            const ctx = c.getContext('2d');
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
            const im = ctx.getImageData(0, 0, c.width, c.height);
            for (let k = 0; k < im.data.length; k += 4) {
              const g = 0.299 * im.data[k] + 0.587 * im.data[k + 1] + 0.114 * im.data[k + 2];
              im.data[k] = im.data[k + 1] = im.data[k + 2] = g;
            }
            ctx.putImageData(im, 0, 0);
            const emb = await doc.embedJpg(dataUrlToUint8(c.toDataURL('image/jpeg', 0.82)));
            const np = doc.addPage([bvp.width, bvp.height]);
            np.drawImage(emb, { x: 0, y: 0, width: bvp.width, height: bvp.height });
          }
        } else {
          doc = await PDFDocument.load(fRec.bytes, { ignoreEncryption: true });
        }

        const pages = doc.getPages();
        if (wmRendered) {
          const wmImg = await doc.embedPng(wmRendered.bytes);
          pages.forEach((pg) => {
            const { width, height } = pg.getSize();
            pg.drawImage(wmImg, { x: (width - wmRendered.widthPt) / 2, y: (height - wmRendered.heightPt) / 2, width: wmRendered.widthPt, height: wmRendered.heightPt, rotate: degrees(35), opacity: 0.24 });
          });
        }
        if (pro.batchPn) {
          for (let pi = 0; pi < pages.length; pi++) {
            const pg = pages[pi];
            const { width } = pg.getSize();
            const pn = renderVietnameseTextToPngBytes(`${pi + 1}/${pages.length}`, { fontSize: 12, color: '#1f2937', bold: true, padX: 5, padY: 3 });
            const emb = await doc.embedPng(pn.bytes);
            pg.drawImage(emb, { x: (width - pn.widthPt) / 2, y: 16, width: pn.widthPt, height: pn.heightPt });
          }
        }
        if (pro.batchFlatten) {
          try { doc.getForm().flatten(); } catch (_e) {}
        }
        if (pro.batchMeta) {
          doc.setTitle('');
          doc.setAuthor('');
          doc.setSubject('');
          doc.setCreator('ĐăngLovePDF Batch');
          doc.setProducer('ĐăngLovePDF Batch');
        }
        outputs.push({ name: `${fBase}_Batch.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }) });
      }
      return outputs;
    }

    // 23. CẦU NỐI NHÂN NỘI BỘ MÁY TÍNH (ELECTRON DESKTOP LOCAL ENGINE)
    if (tool.id === 'desktop_local_engine') {
      if (!global.NoirDesktopLocalEngine?.runLocalTool) {
        throw new Error('Tính năng gọi LibreOffice / qpdf / Ghostscript chỉ khả dụng trên bản App Desktop cài trên máy tính (Electron). Trên web bạn hãy dùng trực tiếp 40 công cụ offline còn lại ngay trong ĐăngLovePDF nhé!');
      }
      prog(40, `Đang gọi nhân nội bộ máy tính (${pro.localCmd})...`);
      const res = await global.NoirDesktopLocalEngine.runLocalTool({
        cmd: pro.localCmd,
        filename: ctrl.files[0].name,
        bytes: Array.from(ctrl.files[0].bytes),
      });
      if (!res?.ok || !res.bytes) {
        throw new Error(res?.error || 'Không tìm thấy phần mềm nội bộ tương ứng trên máy tính (hãy cài LibreOffice / qpdf / Ghostscript).');
      }
      outputs.push({
        name: res.outName || `${baseName}_LocalEngine.pdf`,
        blob: new Blob([new Uint8Array(res.bytes)], { type: 'application/pdf' }),
      });
      return outputs;
    }

    return null;
  }

  NS.dangLovePdfPro = Object.freeze({
    PRO_TOOL_GROUPS,
    PAPER_SIZES,
    buildProOptionsHtml,
    readProOptions,
    executeProTool,
    renderCursiveSignaturePng,
    dataUrlToUint8,
  });
})(typeof window !== 'undefined' ? window : globalThis);
