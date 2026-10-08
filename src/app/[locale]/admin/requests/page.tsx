import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Inbox } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAllRequests } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_REQUEST_DETAIL } from "@/lib/demo-data";
import { COMPENSATION_LABELS, label } from "@/lib/taxonomy";
import { formatNumber } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/requests/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("requestsTitle"), robots: { index: false } };
}

export default async function AdminRequestsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const format = await getFormatter({ locale });
  await requireSession(locale, { roles: ["admin"] });

  const requests = isSupabaseConfigured
    ? await getAllRequests(await createClient())
    : [
        {
          ...DEMO_REQUEST_DETAIL.request,
          company_name: DEMO_REQUEST_DETAIL.company.name,
          influencer_name: DEMO_REQUEST_DETAIL.influencer.name,
        },
      ];

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("requestsTitle")}</h1>
        <p className="mt-1.5 text-muted">{t("requestsSubtitle")}</p>

        {requests.length === 0 ? (
          <EmptyState icon={Inbox} title={t("noRequests")} className="mt-8" />
        ) : (
          <div className="card mt-8 overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-soft text-left text-xs font-bold tracking-wider text-muted uppercase">
                  <th className="px-4 py-3">{t("requestCols.title")}</th>
                  <th className="px-4 py-3">{t("requestCols.company")}</th>
                  <th className="px-4 py-3">{t("requestCols.creator")}</th>
                  <th className="px-4 py-3">{t("requestCols.compensation")}</th>
                  <th className="px-4 py-3">{t("requestCols.status")}</th>
                  <th className="px-4 py-3">{t("requestCols.created")}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-line/70 last:border-0 hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <Link
                        href={{ pathname: "/dashboard/requests/[id]", params: { id: r.id } }}
                        className="font-semibold hover:text-brand-700"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{r.company_name}</td>
                    <td className="px-4 py-3 text-ink-soft">{r.influencer_name}</td>
                    <td className="px-4 py-3 text-xs">
                      <p>{label(COMPENSATION_LABELS[r.compensation], locale)}</p>
                      {r.budget_amount != null && (
                        <p className="font-semibold">
                          {formatNumber(r.budget_amount, locale)} {r.currency}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} className="!px-2 !py-0.5" />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted tabular-nums">
                      {format.dateTime(new Date(r.created_at), { dateStyle: "medium" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
