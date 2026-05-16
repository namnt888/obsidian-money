import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1)
});

const env = envSchema.parse(process.env);

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
