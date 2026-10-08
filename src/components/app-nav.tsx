"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, ExternalLink, LogOut, Menu, Settings, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { signOut } from "@/app/actions/auth";
import { setDemoRole } from "@/app/actions/demo";
import { LangSwitcher } from "@/components/lang-switcher";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

/** Navigation only links to static routes (no [params]). */
type StaticPathname = Exclude<AppPathname, `${string}[${string}]${string}`>;

export type NavItem = {
  href: StaticPathname;
  label: string;
  badge?: number;
  exact?: boolean;
};

type NavUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  username: string | null;
  isPublic: boolean;
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact || item.href === "/admin") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function CountBadge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function DemoRoleSelect({ role, className }: { role: UserRole; className?: string }) {
  const t = useTranslations("nav");
  const [, startTransition] = useTransition();
  return (
    <select
      aria-label={t("demoRole")}
      className={cn(
        "h-9 cursor-pointer rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800",
        className
      )}
      value={role}
      onChange={(e) =>
        startTransition(async () => {
          await setDemoRole(e.target.value as UserRole);
        })
      }
    >
      <option value="influencer">{t("demoInfluencer")}</option>
      <option value="company">{t("demoCompany")}</option>
      <option value="admin">{t("demoAdmin")}</option>
    </select>
  );
}

export function AppNav({
  items,
  user,
  unreadNotifications,
  demo,
}: {
  items: NavItem[];
  user: NavUser;
  unreadNotifications: number;
  demo: boolean;
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close the user menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const linkCls = (active: boolean) =>
    cn(
      "relative flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
      active
        ? "bg-brand-50 text-brand-700"
        : "text-ink-soft hover:bg-brand-50 hover:text-brand-700"
    );

  const menuItemCls =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-50";

  return (
    <>
      <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label={t("main")}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkCls(active)}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
              <CountBadge n={item.badge} />
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        {demo && <DemoRoleSelect role={user.role} className="hidden sm:block" />}

        <LangSwitcher className="hidden sm:flex" />

        {user.role !== "admin" && (
          <Link
            href="/dashboard/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
            aria-label={
              unreadNotifications
                ? t("notificationsUnread", { count: unreadNotifications })
                : t("notifications")
            }
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-500" />
            )}
          </Link>
        )}

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={t("account")}
            className="flex cursor-pointer items-center rounded-full p-0.5 transition-shadow hover:ring-2 hover:ring-brand-200 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
          >
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              size={36}
              company={user.role === "company"}
            />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="card absolute right-0 z-50 mt-2 w-64 overflow-hidden p-1.5 shadow-lift"
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-sm font-bold">{user.name || "—"}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              {user.role !== "admin" && (
                <Link href="/dashboard/profile" role="menuitem" className={cn(menuItemCls, "mt-1")}>
                  <User className="h-4 w-4 text-muted" />
                  {user.role === "company" ? t("companyProfile") : t("myProfile")}
                </Link>
              )}
              {user.isPublic && user.username && (
                <Link
                  href={{
                    pathname: "/creators/[username]",
                    params: { username: user.username },
                  }}
                  role="menuitem"
                  className={menuItemCls}
                >
                  <ExternalLink className="h-4 w-4 text-muted" />
                  {t("publicProfile")}
                </Link>
              )}
              {user.role !== "admin" && (
                <Link href="/dashboard/settings" role="menuitem" className={menuItemCls}>
                  <Settings className="h-4 w-4 text-muted" />
                  {t("settings")}
                </Link>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  role="menuitem"
                  className={cn(menuItemCls, "w-full cursor-pointer text-left text-red-600 hover:bg-red-50")}
                >
                  <LogOut className="h-4 w-4" />
                  {tc("logout")}
                </button>
              </form>
            </div>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-ink lg:hidden"
          aria-label={t("menu")}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-16 border-b border-line bg-white/95 shadow-soft backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label={t("main")}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  linkCls(isActive(pathname, item)),
                  "justify-between rounded-xl px-4 py-3"
                )}
              >
                {item.label}
                <CountBadge n={item.badge} />
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line px-2 pt-4">
              <LangSwitcher />
              {demo && <DemoRoleSelect role={user.role} />}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
