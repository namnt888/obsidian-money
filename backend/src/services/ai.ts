import { env } from '../config/env';
import { ParsedTransactionSchema, ParsedTransaction } from '../schemas/transaction';

export { ParsedTransactionSchema };

const SYSTEM_PROMPT = `Bạn là một trợ lý tài chính thông minh chuyên nghiệp.
Nhiệm vụ của bạn là phân tích và bóc tách thông tin từ các câu ghi chú thu chi tự nhiên của người dùng sang cấu trúc dữ liệu JSON chính xác.

THÔNG TIN LƯU Ý QUAN TRỌNG:
- Thời gian hiện tại để tham chiếu: ${new Date().toISOString()}

QUY TẮC BÓC TÁCH & QUY ĐỔI SỐ TIỀN:
1. amount (number): Số tiền tuyệt đối. Chuyển đổi các đơn vị thông dụng:
   - "k" = 1,000 (VD: "45k" -> 45000)
   - "tr" / "củ" / "triệu" = 1,000,000 (VD: "1.5tr" -> 1500000, "5 củ" -> 5000000)
   - Nếu số tiền viết liền không đơn vị (VD: "50000"), giữ nguyên 50000.
2. type (enum): Phân loại chính xác: "expense", "income", "transfer", "lend", "borrow", "repay", "collect".
3. account_keyword (string): Tên ví/thẻ hoặc tài khoản (VD: "VCB", "Momo", "Tiền mặt"). Nếu câu không nêu cụ thể, dùng "Tiền mặt" làm mặc định.
4. category_keyword (string, optional): Danh mục chi tiêu hoặc thu nhập (VD: "Ăn uống", "Xăng xe").
5. person_keyword (string, optional): Tên người liên quan trong các giao dịch nợ/vay/trả (lend, borrow, repay, collect).
6. description (string): Tóm tắt nội dung/diễn giải giao dịch ngắn gọn, rõ ràng.
7. date (string): Định dạng chuẩn ISO 8601. Dựa trên mốc thời gian hiện tại để xác định nếu nhắc đến "hôm qua", "sáng nay",... Nếu không có thời gian cụ thể, sử dụng thời gian hiện tại.

BẠN BẮT BUỘC PHẢI TRẢ VỀ DUY NHẤT MỘT CHUỖI JSON HỢP LỆ TUÂN THỦ ĐÚNG SCHEMA SAU (KHÔNG BÌNH LUẬN, KHÔNG GIẢI THÍCH):
{
  "amount": number,
  "type": "expense" | "income" | "transfer" | "lend" | "borrow" | "repay" | "collect",
  "account_keyword": "string",
  "category_keyword": "string",
  "person_keyword": "string",
  "description": "string",
  "date": "2026-05-17T09:40:00.000Z"
}`;

function cleanJsonResponse(rawContent: string): string {
  let text = rawContent.trim();
  // Gỡ bỏ các ký tự markdown block thừa nếu AI sinh ra
  if (text.startsWith('```json')) {
    text = text.substring(7);
  } else if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  return text.trim();
}

export async function parseTransactionText(rawText: string): Promise<ParsedTransaction> {
  const baseUrl = (env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;
  const apiKey = env.AI_API_KEY || '';
  const modelName = env.AI_MODEL || 'gpt-4o-mini';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const payload = {
    model: modelName,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Nội dung giao dịch cần phân tích: "${rawText}"` },
    ],
    temperature: 0.1,
    stream: false,
    response_format: { type: 'json_object' },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI API call failed with status ${res.status}: ${errText}`);
  }

  const data = await res.json() as any;
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('AI API returned empty or invalid response content');
  }

  const jsonString = cleanJsonResponse(rawContent);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`Failed to parse AI JSON response. Raw string: ${jsonString}`);
  }

  const validatedData = ParsedTransactionSchema.parse(parsedJson);

  return validatedData;
}