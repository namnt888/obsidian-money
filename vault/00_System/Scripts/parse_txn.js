/**
 * Hướng dẫn cài đặt trong Obsidian:
 * 1. Cài plugin "Templater"
 * 2. Lưu file này vào thư mục vault/00_System/Scripts/parse_txn.js
 * 3. Tạo một file `.md` trong thư mục Templates, nội dung: <%* await tp.user.parse_txn(tp) %>
 * 4. Gán Hotkey cho lệnh "Templater: Insert [Tên file template đó]" (KHÔNG dùng lệnh Create new note).
 */

async function parseTransaction(tp) {
    // 1. Lấy nội dung file hiện tại
    const view = app.workspace.getActiveViewOfType(tp.obsidian.MarkdownView);

    if (!view) {
        new Notice("❌ Không tìm thấy màn hình soạn thảo đang mở!");
        return;
    }

    const editor = view.editor;
    const cursor = editor.getCursor();

    let lineNum = cursor.line;
    let lineText = editor.getLine(lineNum);

    // NÂNG CẤP: Nếu dòng hiện tại trống (do template có dấu Enter đẩy trỏ chuột xuống)
    // thì tự động nhìn lên dòng ngay phía trên nó.
    if ((!lineText || lineText.trim() === "") && lineNum > 0) {
        lineNum = lineNum - 1;
        lineText = editor.getLine(lineNum);
    }

    // Làm sạch các ký tự markdown list (- , - [ ]) để lấy nội dung text thật sự
    const cleanText = lineText.replace(/^- \[ \]/, '').replace(/^- /, '').trim();

    if (!cleanText) {
        new Notice("⚠️ Dòng trống, không có giao dịch để parse!");
        return;
    }

    new Notice("⏳ Đang gửi AI parse: " + cleanText);

    try {
        // 2. Gọi API local (Backend Fastify đang chạy)
        // FIX LỖI CORS: Sử dụng `requestUrl` nội bộ của Obsidian thay vì `fetch` mặc định
        const response = await tp.obsidian.requestUrl({
            url: "http://127.0.0.1:3000/api/parse-txn",
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ rawText: cleanText })
        });

        if (response.status !== 200) throw new Error("API Backend báo lỗi: " + response.status);

        // response.json đã được parse sẵn trong hàm requestUrl
        const result = response.json;

        // Hiện tại Phase 2 chỉ lấy JSON ra xem đã. Phase 3 mới lưu DB.
        console.log("Parsed Data:", result);
        new Notice(`✅ Parse thành công: ${result.data.amount} - ${result.data.type}`);

        // 3. Cập nhật lại ĐÚNG dòng mà nó đã đọc
        const newLineText = `- [x] ${cleanText} 🧠 *(Đã parse)*`;
        editor.setLine(lineNum, newLineText);

    } catch (error) {
        console.error(error);
        new Notice("❌ Lỗi khi gọi Backend API. Bật Developer Console (Cmd+Option+I) để xem chi tiết.");
    }
}

// Bắt buộc phải export cho Templater hiểu
module.exports = parseTransaction;