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
  // Skip API/auth handlers, Next internals and real static files.
  // Note: only known file extensions are excluded — usernames may contain
  // dots (e.g. /kreatori/milica.style) and must still hit the middleware.
  matcher: [
    "/((?!api|auth|_next|_vercel|.*\\.(?:svg|png|jpe?g|gif|webp|avif|ico|txt|xml|json|webmanifest|js|css|map|woff2?)$).*)",
  ],
};
