import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  SUPABASE_KEY: z.string().min(1).default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon'),
  AI_API_KEY: z.string().min(1).default('demo_key_or_replace'),
  AI_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().default('gpt-4o-mini'),
});

export const env = envSchema.parse(process.env);
