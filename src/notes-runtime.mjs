import { createClient } from '@supabase/supabase-js';
import { createLoginVerifier } from './verify-login.mjs';
import config from '../aleph.config.json' with { type: 'json' };
let cached;
export function notesRuntime() {
  if (!cached) {
    const key = process.env.SUPABASE_SECRET_KEY;
    const url = process.env.SUPABASE_URL;
    if (!key || url !== 'https://cagntnhysbiqlmjnkjqg.supabase.co') throw new Error('missing_config');
    cached = {
      db: createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }),
      verify: createLoginVerifier({ config, supabaseSecretKey: key }),
    };
  }
  return cached;
}
