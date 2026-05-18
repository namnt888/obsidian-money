import { z } from 'zod';

export const TransactionTypeEnum = z.enum([
  'expense',
  'income',
  'transfer',
  'lend',
  'borrow',
  'repay',
  'collect',
]);

export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const ParsedTransactionSchema = z.object({
  amount: z.number().describe('Số tiền (quy đổi "k" = 1000, ví dụ "45k" -> 45000)'),
  type: TransactionTypeEnum.describe('Loại giao dịch: expense, income, transfer, lend, borrow, repay, collect'),
  account_keyword: z.string().describe('Tên ví/thẻ (VD: "VCB", "Momo", "Tiền mặt")'),
  category_keyword: z.string().optional().describe('Danh mục (VD: "Ăn uống", "Xăng xe")'),
  person_keyword: z.string().optional().describe('Tên người liên quan nếu là giao dịch nợ/cho mượn'),
  description: z.string().describe('Diễn giải giao dịch'),
  date: z.string().describe('Ngày giao dịch định dạng chuẩn ISO (VD: YYYY-MM-DDTHH:mm:ss.sssZ)'),
});

export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;
