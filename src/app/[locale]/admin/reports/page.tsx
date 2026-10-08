import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAllReports } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { label, REPORT_REASON_LABELS } from "@/lib/taxonomy";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileModeration, ReportResolution } from "@/components/admin/admin-actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("reportsTitle"), robots: { index: false } };
}

export default async function AdminReportsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const format = await getFormatter({ locale });
  await requireSession(locale, { roles: ["admin"] });

  const reports = isSupabaseConfigured ? await getAllReports(await createClient()) : [];
  const open = reports.filter((r) => r.status === "open");
  const closed = reports.filter((r) => r.status !== "open");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("reportsTitle")}</h1>
        <p className="mt-1.5 text-muted">{t("reportsSubtitle")}</p>

        {open.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={t("reports.empty")} className="mt-8" />
        ) : (
          <ul className="mt-8 space-y-4">
            {open.map((r) => (
              <li key={r.id} className="card grid gap-5 p-5 md:grid-cols-[1fr_280px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{label(REPORT_REASON_LABELS[r.reason], locale)}</Badge>
                    <span className="text-xs text-muted">
                      {format.dateTime(new Date(r.created_at), { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="text-muted">{t("reports.reporter")}:</span>{" "}
                    <span className="font-semibold">{r.reporter.name}</span>
                    <span className="mx-2 text-muted">→</span>
                    <span className="text-muted">{t("reports.target")}:</span>{" "}
                    <span className="font-semibold">{r.target.name}</span>
                  </p>
                  {r.details && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.details}</p>}
                  {r.request_id && (
                    <Link
                      href={{ pathname: "/dashboard/requests/[id]", params: { id: r.request_id } }}
                      className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline"
                    >
                      {t("reports.viewRequest")}
                    </Link>
                  )}
                  <div className="mt-4">
                    <ProfileModeration
                      profileId={r.target_profile_id}
                      verified={r.target.verified}
                      status={r.target.status}
                    />
                  </div>
                </div>
                <ReportResolution reportId={r.id} />
              </li>
            ))}
          </ul>
        )}

        {closed.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-lg font-bold">{t("reports.closed")}</h2>
            <ul className="card mt-4 divide-y divide-line">
              {closed.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span>
                    {label(REPORT_REASON_LABELS[r.reason], locale)} · {r.target.name}
                  </span>
                  <Badge tone={r.status === "resolved" ? "success" : "neutral"}>
                    {t(`reports.status.${r.status}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
