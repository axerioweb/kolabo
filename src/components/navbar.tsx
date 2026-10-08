"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LangSwitcher } from "@/components/lang-switcher";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

const links = [
  { href: "/creators", key: "findCreators" },
  { href: "/for-brands", key: "forBrands" },
  { href: { pathname: "/", hash: "kako-radi" }, key: "howItWorks" },
  { href: { pathname: "/", hash: "faq" }, key: "faq" },
] as const;

/** Public (marketing) navigation. Stays static — session is read client-side. */
export function Navbar({ solid }: { solid?: boolean }) {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    createClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const raised = solid || scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        raised
          ? "border-b border-line/70 bg-white/85 shadow-soft backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Kolabo" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((a) => (
            <Link
              key={a.key}
              href={a.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {t(a.key)}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LangSwitcher />
          {signedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard">{t("dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">{t("signup")}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-ink lg:hidden"
          aria-label={t("menu")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-white/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {links.map((a) => (
              <Link
                key={a.key}
                href={a.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-ink-soft hover:bg-brand-50"
              >
                {t(a.key)}
              </Link>
            ))}
            <div className="mt-3 flex items-center gap-3 px-2">
              {signedIn ? (
                <Button asChild size="sm" className="flex-1">
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    {t("dashboard")}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="secondary" size="sm" className="flex-1">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      {t("login")}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      {t("signup")}
                    </Link>
                  </Button>
                </>
              )}
              <LangSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
