import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1) Locale handling (redirects, rewrites, locale cookie)
  const response = intlMiddleware(request);

  // 2) Keep the Supabase auth session fresh (no-op when Supabase
  //    env vars are not configured yet)
  return await updateSession(request, response);
}

export const config = {
  // Skip static files, images and Next internals
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
