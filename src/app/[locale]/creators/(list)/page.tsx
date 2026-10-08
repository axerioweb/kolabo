import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchX, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSavedIds, PAGE_SIZE, searchCreators } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { parseFilters, filtersToQuery } from "@/lib/creator-filters";
import { DEMO_INFLUENCERS, demoCardData } from "@/lib/demo-data";
import { categoryBySlug, label } from "@/lib/taxonomy";
import type { SearchResult } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { AppHeader } from "@/components/app-header";
import { Footer } from "@/components/footer";
import { CreatorCard } from "@/components/creators/creator-card";
import { CreatorFiltersPanel } from "@/components/creators/filters";
import { Pagination } from "@/components/creators/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { publicMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "creators" });
  const sp = await searchParams;
  const hasFilters = Object.keys(sp).length > 0;
  // Filter combinations would create endless duplicate URLs
  return publicMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    sr: "/kreatori",
    en: "/en/creators",
    noIndex: hasFilters,
  });
}

export default async function CreatorsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "creators" });
  const filters = parseFilters(await searchParams);
  const session = await getSession();
  const isCompany = session?.profile.role === "company";

  let result: SearchResult;
  let savedIds: string[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    [result, savedIds] = await Promise.all([
      searchCreators(supabase, filters),
      isCompany ? getSavedIds(supabase, session!.userId) : Promise.resolve([]),
    ]);
  } else {
    const items = DEMO_INFLUENCERS.filter(
      (i) =>
        (!filters.category || i.categories.includes(filters.category)) &&
        (!filters.platform || i.socials.some((s) => s.platform === filters.platform)) &&
        (!filters.country || i.profile.country === filters.country) &&
        (!filters.q ||
          i.profile.full_name.toLowerCase().includes(filters.q.toLowerCase()) ||
          (i.profile.username ?? "").includes(filters.q.toLowerCase()))
    ).map(demoCardData);
    result = { items, total: items.length };
  }

  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const category = filters.category ? categoryBySlug(filters.category) : undefined;
  const query = filtersToQuery({ ...filters, page: 1 });

  return (
    <>
      {session ? <AppHeader /> : <Navbar solid />}
      <main className={session ? "pb-20" : "pt-16 pb-20"}>
        <section className="bg-hero-glow border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {category
                ? t("titleCategory", { category: label(category.label, locale) })
                : t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-ink-soft">{t("subtitle")}</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <CreatorFiltersPanel filters={filters}>
            <p className="mb-4 text-sm text-muted" aria-live="polite">
              {t("resultsCount", { count: result.total })}
            </p>
            {result.items.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  {result.items.map((c) => (
                    <CreatorCard
                      key={c.id}
                      creator={c}
                      canSave={isCompany}
                      saved={savedIds.includes(c.id)}
                    />
                  ))}
                </div>
                <Pagination page={filters.page ?? 1} pages={pages} query={query} />
              </>
            ) : (
              <EmptyState
                icon={SearchX}
                title={t("emptyTitle")}
                text={t("emptyText")}
                action={
                  <Button asChild variant="secondary">
                    <Link href="/creators">{t("filters.clear")}</Link>
                  </Button>
                }
              />
            )}

            {!session && (
              <div className="card mt-10 flex flex-col items-center gap-4 bg-gradient-to-r from-brand-50 to-pink-50 p-6 text-center sm:flex-row sm:text-left">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft">
                  <Sparkles className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <p className="font-display font-bold">{t("ctaTitle")}</p>
                  <p className="mt-1 text-sm text-ink-soft">{t("ctaText")}</p>
                </div>
                <Button asChild>
                  <Link href={{ pathname: "/signup", query: { tip: "brend" } }}>{t("ctaButton")}</Link>
                </Button>
              </div>
            )}
          </CreatorFiltersPanel>
        </div>
      </main>
      {!session && <Footer />}
    </>
  );
}
