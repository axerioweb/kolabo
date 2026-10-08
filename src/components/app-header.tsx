import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { getSession } from "@/lib/session";
import { AppNav, type NavItem } from "@/components/app-nav";

/**
 * Header for every signed-in page. Navigation depends on the role;
 * session data comes from the request-cached getSession().
 */
export async function AppHeader() {
  const session = await getSession();
  const t = await getTranslations("nav");

  const role = session?.profile.role ?? "influencer";
  const items: NavItem[] =
    role === "admin"
      ? [
          { href: "/admin", label: t("overview") },
          { href: "/admin/influencers", label: t("influencers") },
          { href: "/admin/companies", label: t("companies") },
          { href: "/admin/requests", label: t("requests") },
          { href: "/admin/reports", label: t("reports") },
        ]
      : role === "company"
        ? [
            { href: "/dashboard", label: t("dashboard"), exact: true },
            { href: "/creators", label: t("findCreators") },
            {
              href: "/dashboard/requests",
              label: t("requests"),
              badge: session?.unreadMessages,
            },
            { href: "/dashboard/saved", label: t("saved") },
          ]
        : [
            { href: "/dashboard", label: t("dashboard"), exact: true },
            {
              href: "/dashboard/requests",
              label: t("requests"),
              badge: session?.unreadMessages,
            },
            { href: "/dashboard/profile", label: t("myProfile") },
          ];

  const displayName =
    role === "company"
      ? session?.company?.name || session?.profile.full_name || ""
      : session?.profile.full_name ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={role === "admin" ? "/admin" : "/dashboard"} aria-label="Kolabo">
          <Logo />
        </Link>
        <AppNav
          items={items}
          user={{
            name: displayName,
            email: session?.email ?? "",
            avatarUrl:
              role === "company"
                ? session?.company?.logo_url ?? null
                : session?.profile.avatar_url ?? null,
            role,
            username: session?.profile.username ?? null,
            isPublic:
              role === "influencer" &&
              session?.profile.status === "active" &&
              !!session?.profile.username,
          }}
          unreadNotifications={session?.unreadNotifications ?? 0}
          demo={session?.demo ?? false}
        />
      </div>
    </header>
  );
}
