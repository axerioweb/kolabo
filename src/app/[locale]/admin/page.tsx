import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAllCompanies, getAllInfluencers, getAllReports, getAllRequests } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_COMPANY, DEMO_INBOX, DEMO_INFLUENCERS } from "@/lib/demo-data";
import { computeStats } from "@/lib/stats";
import type { InfluencerFull } from "@/lib/types";
import {
  BARTER_PREF_LABELS,
  categoryBySlug,
  COUNTRIES,
  COUNTRY_LABELS,
  label,
  PLATFORM_LABELS,
  SERVICE_LABELS,
  TIER_LABELS,
  type RequestStatus,
} from "@/lib/taxonomy";
import { AppHeader } from "@/components/app-header";
import { ChartCard, HBarChart, KpiCard, RangeBars, SplitBar } from "@/components/admin/charts";
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
  const tr = await getTranslations({ locale, namespace: "requests.status" });
  await requireSession(locale, { roles: ["admin"] });

  let influencers: InfluencerFull[];
  let companyCount: number;
  let unverifiedCompanies: number;
  let requestStatuses: RequestStatus[];
  let openReports: number;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const [inf, companies, requests, reports] = await Promise.all([
      getAllInfluencers(supabase),
      getAllCompanies(supabase),
      getAllRequests(supabase),
      getAllReports(supabase),
    ]);
    influencers = inf;
    companyCount = companies.length;
    unverifiedCompanies = companies.filter((c) => !c.profile.verified_at).length;
    requestStatuses = requests.map((r) => r.status);
    openReports = reports.filter((r) => r.status === "open").length;
  } else {
    influencers = DEMO_INFLUENCERS;
    companyCount = 1;
    unverifiedCompanies = DEMO_COMPANY.profile.verified_at ? 0 : 1;
    requestStatuses = DEMO_INBOX.map((r) => r.status);
    openReports = 0;
  }

  const stats = computeStats(influencers);
  const totalRequests = requestStatuses.length;
  const accepted = requestStatuses.filter((s) => ["accepted", "delivered", "completed"].includes(s)).length;
  const decided = requestStatuses.filter((s) => s !== "pending" && s !== "cancelled").length;
  const acceptRate = decided ? Math.round((accepted / decided) * 100) : null;
  const byStatus = (["pending", "accepted", "delivered", "completed", "declined", "cancelled"] as const).map(
    (s) => ({ label: tr(s), value: requestStatuses.filter((x) => x === s).length })
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1.5 text-muted">{t("subtitle")}</p>

        {(unverifiedCompanies > 0 || openReports > 0) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {unverifiedCompanies > 0 && (
              <Link
                href="/admin/companies"
                className="card flex items-center justify-between gap-3 border-amber-200 bg-amber-50/60 p-4 text-sm font-semibold text-amber-900 hover:shadow-lift"
              >
                {t("todo.companies", { count: unverifiedCompanies })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {openReports > 0 && (
              <Link
                href="/admin/reports"
                className="card flex items-center justify-between gap-3 border-red-200 bg-red-50/60 p-4 text-sm font-semibold text-red-800 hover:shadow-lift"
              >
                {t("todo.reports", { count: openReports })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label={t("kpi.totalInfluencers")} value={formatNumber(stats.total, locale)} />
          <KpiCard label={t("kpi.companies")} value={formatNumber(companyCount, locale)} />
          <KpiCard label={t("kpi.requests")} value={formatNumber(totalRequests, locale)} />
          <KpiCard label={t("kpi.acceptRate")} value={acceptRate != null ? `${acceptRate}%` : "—"} />
          <KpiCard label={t("kpi.newThisMonth")} value={formatNumber(stats.newThisMonth, locale)} />
          <KpiCard label={t("kpi.completedProfiles")} value={formatNumber(stats.completed, locale)} />
          <KpiCard label={t("kpi.barterReady")} value={formatNumber(stats.barterReady, locale)} />
          <KpiCard
            label={t("kpi.avgEngagement")}
            value={stats.avgEngagement != null ? `${stats.avgEngagement}%` : "—"}
          />
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title={t("charts.requestsByStatus")}>
            <HBarChart locale={locale} data={byStatus} />
          </ChartCard>
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
              data={stats.byPlatform.map((p) => ({ label: PLATFORM_LABELS[p.key], value: p.count }))}
            />
          </ChartCard>
          <ChartCard title={t("charts.byTier")}>
            <HBarChart
              locale={locale}
              data={stats.byTier.map((x) => ({
                label: TIER_LABELS[x.key] ? label(TIER_LABELS[x.key], locale) : x.key,
                value: x.count,
              }))}
            />
          </ChartCard>
          <ChartCard title={t("charts.byCountry")}>
            <HBarChart
              locale={locale}
              data={stats.byCountry.map((c) => ({
                label: label(COUNTRY_LABELS[c.key as (typeof COUNTRIES)[number]], locale),
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
                { label: label(BARTER_PREF_LABELS.yes, locale), value: stats.barterSplit.yes },
                { label: label(BARTER_PREF_LABELS.depends, locale), value: stats.barterSplit.depends },
                { label: label(BARTER_PREF_LABELS.no, locale), value: stats.barterSplit.no },
              ]}
            />
          </ChartCard>
        </div>
      </main>
    </>
  );
}
