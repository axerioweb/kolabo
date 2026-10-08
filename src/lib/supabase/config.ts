export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * The app runs in "demo mode" until a real Supabase project is
 * configured via .env.local. In demo mode auth is disabled and the
 * dashboards render seeded demo data so the UI can be reviewed.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20;
