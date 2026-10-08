import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { demoSession, type DemoRole } from "@/lib/demo-data";
import { COMPANY_COLS, getMyPrivateProfile, PROFILE_COLS } from "@/lib/queries";
import type { Company, Profile, SessionContext, UserRole } from "@/lib/types";

/** Cookie that picks which role the demo mode previews. */
export const DEMO_ROLE_COOKIE = "kolabo_demo_role";

/**
 * Current user + profile (+ company) + unread counters.
 * Wrapped in React `cache()` so the header and the page share ONE
 * round-trip per request.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  if (!isSupabaseConfigured) {
    const role = (await cookies()).get(DEMO_ROLE_COOKIE)?.value;
    const demoRole: DemoRole =
      role === "company" || role === "admin" ? role : "influencer";
    return demoSession(demoRole);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, companyRes, notifRes, msgRes, priv] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLS).eq("id", user.id).maybeSingle(),
    supabase.from("companies").select(COMPANY_COLS).eq("profile_id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .is("read_at", null),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
    getMyPrivateProfile(supabase),
  ]);

  if (!profileRes.data) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: { ...(profileRes.data as Profile), ...priv },
    company: companyRes.data
      ? ({
          legal_name: null,
          tax_id: null,
          registration_number: null,
          contact_name: null,
          contact_role: null,
          budget_min: null,
          budget_max: null,
          ...(companyRes.data as object),
        } as Company)
      : null,
    unreadNotifications: notifRes.count ?? 0,
    unreadMessages: msgRes.count ?? 0,
    demo: false,
  };
});

/**
 * Guard for authenticated pages. Redirects to login (with return path)
 * when signed out, and to the dashboard when the role is not allowed.
 */
export async function requireSession(
  locale: string,
  opts: { roles?: UserRole[]; next?: string; allowIncomplete?: boolean } = {}
): Promise<SessionContext> {
  const session = await getSession();
  if (!session) {
    redirect({
      href: opts.next
        ? { pathname: "/login", query: { next: opts.next } }
        : "/login",
      locale,
    });
  }
  const s = session!;

  if (s.profile.status === "suspended" && s.profile.role !== "admin") {
    redirect({ href: { pathname: "/login", query: { error: "suspended" } }, locale });
  }

  if (opts.roles && !opts.roles.includes(s.profile.role)) {
    redirect({ href: "/dashboard", locale });
  }

  if (
    !opts.allowIncomplete &&
    s.profile.role !== "admin" &&
    !s.profile.onboarding_completed
  ) {
    redirect({ href: "/onboarding", locale });
  }

  return s;
}

/** Where a user lands after login, based on role and onboarding state. */
export function homeFor(profile: Profile): AppPathname {
  if (profile.role === "admin") return "/admin";
  if (!profile.onboarding_completed) return "/onboarding";
  return "/dashboard";
}
