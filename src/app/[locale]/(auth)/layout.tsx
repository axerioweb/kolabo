import { getTranslations } from "next-intl/server";
import { BadgeCheck, Handshake, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { LangSwitcher } from "@/components/lang-switcher";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("auth.side");

  const points = [
    { Icon: Handshake, text: t("point1") },
    { Icon: ShieldCheck, text: t("point2") },
    { Icon: BadgeCheck, text: t("point3") },
  ];

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Kolabo">
            <Logo />
          </Link>
          <LangSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 lg:block">
        <svg aria-hidden className="absolute inset-0 h-full w-full opacity-20">
          <defs>
            <pattern id="auth-dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-dots)" />
        </svg>
        <div className="animate-float-slow absolute top-24 left-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="animate-float-slower absolute right-16 bottom-24 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <p className="font-display text-4xl leading-snug font-bold">
            {t("line1")}
            <br />
            {t("line2")}
            <br />
            <span className="text-amber-300">{t("line3")}</span>
          </p>
          <ul className="mt-10 max-w-md space-y-4">
            {points.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-white/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pt-1.5 text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
