import { createServerClient } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from "./config";

/**
 * Refreshes the Supabase auth session on every request.
 * Refreshed auth cookies are written onto the response produced by the
 * next-intl middleware, so locale rewrites/redirects stay intact.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Do not remove — refreshes the auth token when it is about to expire
  await supabase.auth.getUser();

  return response;
}
