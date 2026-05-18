import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { parseTransactionText } from './services/ai';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

const parseTxnBodySchema = z.object({
  rawText: z.string().min(1, 'Nội dung giao dịch không được để trống'),
});

type ParseTxnBody = z.infer<typeof parseTxnBodySchema>;

app.post('/api/parse-txn', async (request: FastifyRequest<{ Body: ParseTxnBody }>, reply: FastifyReply) => {
  try {
    const body = parseTxnBodySchema.parse(request.body);
    const parsedData = await parseTransactionText(body.rawText);
    return reply.status(200).send({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    app.log.error(error);
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        error: 'Dữ liệu đầu vào không hợp lệ',
        details: error.errors,
      });
    }
    return reply.status(500).send({
      success: false,
      error: 'Lỗi xử lý AI',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    app.log.info('Server running on http://0.0.0.0:3000');
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
