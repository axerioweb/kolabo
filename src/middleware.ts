import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Localized URL prefixes that require a signed-in user. Checked here so
 * anonymous visitors get a real 307 before any page streams (a page-level
 * redirect inside a loading boundary would answer 200 + client redirect).
 * Role checks (creator vs company vs admin) stay in requireSession().
 */
const PROTECTED = [
  "/panel",
  "/admin",
  "/podesavanje-profila",
  "/en/dashboard",
  "/en/admin",
  "/en/onboarding",
];

function loginUrlFor(request: NextRequest): URL {
  const { pathname, search } = request.nextUrl;
  const en = pathname.startsWith("/en/");
  const url = new URL(en ? "/en/login" : "/prijava", request.url);
  url.searchParams.set("next", pathname + search);
  return url;
}

export async function middleware(request: NextRequest) {
  // 1) Locale handling (redirects, rewrites, locale cookie)
  const intlResponse = intlMiddleware(request);

  // 2) Keep the Supabase auth session fresh (no-op when Supabase
  //    env vars are not configured yet)
  const { response, signedIn } = await updateSession(request, intlResponse);

  // 3) Auth gate for private areas
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isProtected && !signedIn) {
    const redirect = NextResponse.redirect(loginUrlFor(request));
    // carry over any refreshed auth cookies
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  // Skip API/auth handlers, Next internals, generated OG images and real
  // static files. Only known file extensions are excluded — usernames may
  // contain dots (e.g. /kreatori/milica.style) and must hit the middleware.
  matcher: [
    "/((?!api|auth|_next|_vercel|.*/opengraph-image|opengraph-image|.*/twitter-image|.*\\.(?:svg|png|jpe?g|gif|webp|avif|ico|txt|xml|json|webmanifest|js|css|map|woff2?)$).*)",
  ],
};
