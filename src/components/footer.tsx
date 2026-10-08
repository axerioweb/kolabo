import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { CATEGORIES, label } from "@/lib/taxonomy";
import { LEGAL_ENTITY } from "@/lib/site";

const FEATURED = ["fashion", "beauty", "fitness", "food", "travel", "gaming"];

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const locale = await getLocale();
  const year = new Date().getFullYear();

  const linkCls = "hover:text-brand-700";
  return (
    <footer className="border-t border-line bg-surface-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t("tagline")}</p>
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-wider text-ink uppercase">
            {t("product")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>
              <Link href="/creators" className={linkCls}>
                {nav("findCreators")}
              </Link>
            </li>
            <li>
              <Link href="/for-brands" className={linkCls}>
                {nav("forBrands")}
              </Link>
            </li>
            <li>
              <Link href="/signup" className={linkCls}>
                {nav("signup")}
              </Link>
            </li>
            <li>
              <Link href="/login" className={linkCls}>
                {nav("login")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-wider text-ink uppercase">
            {t("categories")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {CATEGORIES.filter((c) => FEATURED.includes(c.slug)).map((c) => (
              <li key={c.slug}>
                <Link
                  href={{ pathname: "/creators/category/[slug]", params: { slug: c.slug } }}
                  className={linkCls}
                >
                  {label(c.label, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-wider text-ink uppercase">
            {t("legal")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>
              <Link href="/privacy" className={linkCls}>
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkCls}>
                {t("terms")}
              </Link>
            </li>
            <li>
              <a href={`mailto:${LEGAL_ENTITY.email}`} className={linkCls}>
                {LEGAL_ENTITY.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs leading-relaxed text-muted">
        <p>
          © {year} {LEGAL_ENTITY.name}. {t("rights")}
        </p>
        <p className="mt-1">
          {LEGAL_ENTITY.address} · {t("regNo")}: {LEGAL_ENTITY.registrationNumber} · {t("taxId")}:{" "}
          {LEGAL_ENTITY.taxId}
        </p>
      </div>
    </footer>
  );
}
