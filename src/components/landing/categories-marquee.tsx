import { useLocale, useTranslations } from "next-intl";
import { CATEGORIES, label } from "@/lib/taxonomy";
import { Reveal } from "@/components/motion";
import { Link } from "@/i18n/navigation";

export function CategoriesMarquee() {
  const t = useTranslations("landing.categories");
  const locale = useLocale();

  const half = Math.ceil(CATEGORIES.length / 2);
  const rows = [CATEGORIES.slice(0, half), CATEGORIES.slice(half)];

  return (
    <section id="kategorije" className="scroll-mt-24 overflow-hidden py-20">
      <Reveal className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-soft">{t("subtitle")}</p>
      </Reveal>

      <div className="mt-12 space-y-4">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
          >
            <div
              className="animate-marquee flex w-max shrink-0 gap-4 pr-4"
              style={i === 1 ? { animationDirection: "reverse" } : undefined}
            >
              {[...row, ...row].map((c, j) => (
                <Link
                  key={`${c.slug}-${j}`}
                  href={{ pathname: "/creators/category/[slug]", params: { slug: c.slug } }}
                  // second copy exists only for the seamless loop
                  aria-hidden={j >= row.length || undefined}
                  tabIndex={j >= row.length ? -1 : undefined}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-soft shadow-soft transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <span aria-hidden>{c.emoji}</span>
                  {label(c.label, locale)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
