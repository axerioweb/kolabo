import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { LangSwitcher } from "@/components/lang-switcher";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/app/actions/auth";

export async function AppHeader({ isAdmin }: { isAdmin?: boolean }) {
  const t = await getTranslations("common");
  const nav = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Kolabo">
            <Logo />
          </Link>
          {!isSupabaseConfigured && (
            <Badge tone="warning" className="hidden sm:inline-flex">
              {t("demoBadge")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              {nav("admin")}
            </Link>
          )}
          <Link
            href="/dashboard"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-brand-50 hover:text-brand-700"
          >
            {nav("dashboard")}
          </Link>
          <LangSwitcher />
          <form action={signOut}>
            <button
              type="submit"
              title={t("logout")}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
