import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

// If environment credentials are provided, instantiate real client; otherwise null fallback
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string; tablesExist?: boolean }> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, message: 'Supabase credentials not configured in .env' };
  }
  try {
    // Check if auth or rest endpoint responds
    const { error } = await supabase.from('instruments').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
        return { ok: true, tablesExist: false, message: 'Supabase connected, but public tables not yet migrated.' };
      }
      return { ok: false, message: error.message };
    }
    return { ok: true, tablesExist: true, message: 'Supabase connected & verified with live database tables.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: errorMsg };
  }
}

