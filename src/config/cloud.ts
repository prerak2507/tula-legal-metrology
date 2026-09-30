// Public Supabase settings. The URL and publishable key are designed to ship in client code:
// every request is still checked by row-level security in the database.
// Override with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY for another project.

const env = (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env) || {};

export const SUPABASE_URL: string = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

/** Password of the six seeded evaluator accounts (shown on the sign-in page on purpose). */
export const DEMO_PASSWORD = 'TulaDemo@2026';

export const PRODUCTION_ORIGIN = 'https://tula-legal-metrology.vercel.app';
