import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { searchCreators } from "@/lib/queries";
import { DEMO_INFLUENCERS, demoCardData } from "@/lib/demo-data";
import { CATEGORIES, CATEGORY_GROUPS, categoryBySlug, label } from "@/lib/taxonomy";
import { SITE_URL } from "@/lib/site";
import type { CreatorCardData } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CreatorCard } from "@/components/creators/creator-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Programmatic SEO landing pages — one per category, refreshed every 10 min
export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    CATEGORIES.map((c) => ({ locale, slug: c.slug }))
  );
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return {};
  const t = await getTranslations({ locale, namespace: "categoryPage" });
  const name = label(category.label, locale);
  const sr = `/kreatori/kategorija/${slug}`;
  const en = `/en/creators/category/${slug}`;
  return {
    title: t("metaTitle", { category: name }),
    description: t("metaDescription", { category: name.toLowerCase() }),
    alternates: {
      canonical: locale === "sr" ? sr : en,
      languages: { sr, en, "x-default": sr },
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = categoryBySlug(slug);
  if (!category) notFound();
  const t = await getTranslations({ locale, namespace: "categoryPage" });
  const name = label(category.label, locale);

  let creators: CreatorCardData[];
  let total: number;
  if (isSupabaseConfigured) {
    const res = await searchCreators(createPublicClient(), { category: slug });
    creators = res.items;
    total = res.total;
  } else {
    creators = DEMO_INFLUENCERS.filter((i) => i.categories.includes(slug)).map(demoCardData);
    total = creators.length;
  }

  const related = CATEGORIES.filter((c) => c.group === category.group && c.slug !== slug);
  const pageUrl = `${SITE_URL}${locale === "sr" ? `/kreatori/kategorija/${slug}` : `/en/creators/category/${slug}`}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("h1", { category: name }),
    url: pageUrl,
    inLanguage: locale === "sr" ? "sr-Latn" : "en",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: creators.length,
      itemListElement: creators.slice(0, 12).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}${locale === "sr" ? "/kreatori" : "/en/creators"}/${c.username}`,
        name: c.full_name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar solid />
      <main className="pt-16 pb-20">
        <section className="bg-hero-glow border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <Link href="/creators" className="hover:text-brand-700">
                {t("breadcrumb")}
              </Link>
              <span className="mx-2">/</span>
              <span>{label(CATEGORY_GROUPS[category.group], locale)}</span>
            </nav>
            <h1 className="mt-4 flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              <span aria-hidden>{category.emoji}</span>
              {t("h1", { category: name })}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-soft">{t("intro", { category: name.toLowerCase() })}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button asChild>
                <Link href={{ pathname: "/creators", query: { category: slug } }}>
                  {t("filterCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <Users className="h-4 w-4" />
                {t("count", { count: total })}
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          {creators.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((c) => (
                <CreatorCard key={c.id} creator={c} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t("emptyTitle")}
              text={t("emptyText", { category: name.toLowerCase() })}
              action={
                <Button asChild>
                  <Link href="/signup">{t("emptyCta")}</Link>
                </Button>
              }
            />
          )}

          <section className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold">{t("whyTitle", { category: name.toLowerCase() })}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
                <li>• {t("why1")}</li>
                <li>• {t("why2")}</li>
                <li>• {t("why3")}</li>
              </ul>
              <Button asChild variant="secondary" className="mt-6">
                <Link href={{ pathname: "/signup", query: { tip: "brend" } }}>{t("brandCta")}</Link>
              </Button>
            </div>
            {related.length > 0 && (
              <div className="card p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold">{t("related")}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {related.map((c) => (
                    <Link
                      key={c.slug}
                      href={{ pathname: "/creators/category/[slug]", params: { slug: c.slug } }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700"
                    >
                      <span aria-hidden>{c.emoji}</span>
                      {label(c.label, locale)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
