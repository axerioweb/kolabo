import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/** Cache tag for everything rendered from public creator data. */
export const PUBLIC_CREATORS_TAG = "public-creators";

/**
 * Cookie-less Supabase client for PUBLIC pages (creator directory,
 * public profiles, sitemap). It always runs as `anon`, so RLS exposes
 * only public columns (see 0009_column_privileges.sql).
 *
 * Responses go through Next's data cache for 5 minutes and are tagged,
 * so Server Actions that change public data call
 * `revalidateTag(PUBLIC_CREATORS_TAG)` for instant refresh.
 */
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: 300, tags: [PUBLIC_CREATORS_TAG] },
        }),
    },
  });
}
