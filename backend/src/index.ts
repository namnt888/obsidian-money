import 'dotenv/config';
import Fastify from 'fastify';

const app = Fastify();

app.get('/health', async () => ({ status: 'ok' }));

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
