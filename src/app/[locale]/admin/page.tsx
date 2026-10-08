import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAllInfluencers, getProfile } from "@/lib/queries";
import { DEMO_INFLUENCERS } from "@/lib/demo-data";
import { computeStats } from "@/lib/stats";
import type { InfluencerFull } from "@/lib/types";
import {
  BARTER_PREF_LABELS,
  CATEGORIES,
  categoryBySlug,
  COUNTRIES,
  COUNTRY_LABELS,
  FOLLOWER_RANGE_LABELS,
  label,
  PLATFORMS,
  PLATFORM_LABELS,
  SERVICE_LABELS,
  TIER_LABELS,
} from "@/lib/taxonomy";
import { AppHeader } from "@/components/app-header";
import {
  ChartCard,
  HBarChart,
  KpiCard,
  RangeBars,
  SplitBar,
} from "@/components/admin/charts";
import {
  InfluencerTable,
  type TableRow,
} from "@/components/admin/influencer-table";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });

  let influencers: InfluencerFull[];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect({ href: "/login", locale });
    const me = await getProfile(supabase, user!.id);
    if (me?.role !== "admin") redirect({ href: "/dashboard", locale });
    influencers = await getAllInfluencers(supabase);
  } else {
    influencers = DEMO_INFLUENCERS;
  }

  const stats = computeStats(influencers);

  const dateFmt = new Intl.DateTimeFormat(
    locale === "sr" ? "sr-Latn-RS" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  );

  const rows: TableRow[] = influencers.map((i) => {
    const primary = i.socials.find((s) => s.is_primary) ?? i.socials[0];
    const cheapest = i.services
      .map((s) => s.price_min)
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b)[0];
    return {
      id: i.profile.id,
      name: i.profile.full_name,
      username: i.profile.username,
      city: i.profile.city,
      country: i.profile.country,
      countryLabel: i.profile.country
        ? label(COUNTRY_LABELS[i.profile.country], locale)
        : "—",
      categorySlugs: i.categories,
      categoryLabels: i.categories
        .map((slug) => {
          const c = categoryBySlug(slug);
          return c ? label(c.label, locale) : slug;
        }),
      platforms: i.socials.map((s) => s.platform),
      followerLabel: primary
        ? FOLLOWER_RANGE_LABELS[primary.follower_range]
        : null,
      priceFrom:
        cheapest != null
          ? `${formatNumber(cheapest, locale)} ${i.services[0]?.currency ?? "EUR"}`
          : null,
      barter: i.collaboration?.barter ?? null,
      joined: dateFmt.format(new Date(i.profile.created_at)),
    };
  });

  return (
    <>
      <AppHeader isAdmin />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-muted">{t("subtitle")}</p>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
          <KpiCard
            label={t("kpi.totalInfluencers")}
            value={formatNumber(stats.total, locale)}
          />
          <KpiCard
            label={t("kpi.newThisMonth")}
            value={formatNumber(stats.newThisMonth, locale)}
          />
          <KpiCard
            label={t("kpi.completedProfiles")}
            value={formatNumber(stats.completed, locale)}
          />
          <KpiCard
            label={t("kpi.barterReady")}
            value={formatNumber(stats.barterReady, locale)}
          />
          <KpiCard
            label={t("kpi.avgEngagement")}
            value={stats.avgEngagement != null ? `${stats.avgEngagement}%` : "—"}
          />
          <KpiCard
            label={t("kpi.activeNetworks")}
            value={formatNumber(stats.networksConnected, locale)}
          />
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title={t("charts.byCategory")}>
            <HBarChart
              locale={locale}
              data={stats.byCategory.map((c) => {
                const cat = categoryBySlug(c.key);
                return {
                  label: cat ? `${cat.emoji} ${label(cat.label, locale)}` : c.key,
                  value: c.count,
                };
              })}
            />
          </ChartCard>
          <ChartCard title={t("charts.byNetwork")}>
            <HBarChart
              locale={locale}
              data={stats.byPlatform.map((p) => ({
                label: PLATFORM_LABELS[p.key],
                value: p.count,
              }))}
            />
          </ChartCard>
          <ChartCard title={t("charts.byTier")}>
            <HBarChart
              locale={locale}
              data={stats.byTier.map((x) => ({
                label: TIER_LABELS[x.key]
                  ? label(TIER_LABELS[x.key], locale)
                  : x.key,
                value: x.count,
              }))}
            />
          </ChartCard>
          <ChartCard title={t("charts.byCountry")}>
            <HBarChart
              locale={locale}
              data={stats.byCountry.map((c) => ({
                label: label(
                  COUNTRY_LABELS[c.key as (typeof COUNTRIES)[number]],
                  locale
                ),
                value: c.count,
              }))}
            />
          </ChartCard>
          <ChartCard title={t("charts.avgPrices")}>
            <RangeBars
              locale={locale}
              data={stats.avgPrices.slice(0, 8).map((p) => ({
                label: label(SERVICE_LABELS[p.key], locale),
                min: p.min,
                max: p.max,
                count: p.count,
              }))}
            />
          </ChartCard>
          <ChartCard title={t("charts.barterSplit")}>
            <SplitBar
              locale={locale}
              segments={[
                {
                  label: label(BARTER_PREF_LABELS.yes, locale),
                  value: stats.barterSplit.yes,
                },
                {
                  label: label(BARTER_PREF_LABELS.depends, locale),
                  value: stats.barterSplit.depends,
                },
                {
                  label: label(BARTER_PREF_LABELS.no, locale),
                  value: stats.barterSplit.no,
                },
              ]}
            />
          </ChartCard>
        </div>

        {/* Table */}
        <div className="mt-6">
          <InfluencerTable
            rows={rows}
            categoryOptions={CATEGORIES.map((c) => ({
              value: c.slug,
              label: `${c.emoji} ${label(c.label, locale)}`,
            }))}
            countryOptions={COUNTRIES.map((c) => ({
              value: c,
              label: label(COUNTRY_LABELS[c], locale),
            }))}
            platformOptions={PLATFORMS.map((p) => ({
              value: p,
              label: PLATFORM_LABELS[p],
            }))}
            barterLabels={{
              yes: label(BARTER_PREF_LABELS.yes, locale),
              depends: label(BARTER_PREF_LABELS.depends, locale),
              no: label(BARTER_PREF_LABELS.no, locale),
            }}
          />
        </div>
      </main>
    </>
  );
}
