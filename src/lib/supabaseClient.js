import { createClient } from '@supabase/supabase-js';

// Overrides manuales (como plan B si tu entorno no carga .env.local):
// Rellena estas constantes y se usarán en lugar de las env.
const OVERRIDE_SUPABASE_URL = "https://lzljofgdbnisnmuekghq.supabase.co";
const OVERRIDE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bGpvZmdkYm5pc25tdWVrZ2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDcxMjcsImV4cCI6MjA3NzQyMzEyN30.2dSryi2ZpG_-D9cR_2luQYnn4WBDDNEQfaGm9jtU2DQ";

let cachedClient = null;

export function getSupabase() {
  if (cachedClient) return cachedClient;
  const fromEnvUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const fromEnvKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const fromWindowUrl = typeof window !== 'undefined' ? window.__SUPABASE_URL : undefined;
  const fromWindowKey = typeof window !== 'undefined' ? window.__SUPABASE_ANON_KEY : undefined;

  const supabaseUrl = OVERRIDE_SUPABASE_URL || fromEnvUrl || fromWindowUrl;
  const supabaseAnonKey = OVERRIDE_SUPABASE_ANON_KEY || fromEnvKey || fromWindowKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.error('Faltan variables de Supabase (URL o ANON KEY).');
    }
    return null;
  }
  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}


