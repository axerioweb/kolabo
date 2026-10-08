import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            {t("tagline")}
          </p>
        </div>
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-wider text-ink">
            {t("product")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>
              <a href="#kako-radi" className="hover:text-brand-700">
                {nav("howItWorks")}
              </a>
            </li>
            <li>
              <a href="#kategorije" className="hover:text-brand-700">
                {nav("categories")}
              </a>
            </li>
            <li>
              <Link href="/signup" className="hover:text-brand-700">
                {nav("signup")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-brand-700">
                {nav("login")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-wider text-ink">
            {t("legal")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>
              <Link href="/privacy" className="hover:text-brand-700">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-brand-700">
                {t("terms")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {year} Kolabo. {t("rights")}
      </div>
    </footer>
  );
}
