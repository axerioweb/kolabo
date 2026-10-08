import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, ExternalLink } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAllCompanies } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_COMPANY } from "@/lib/demo-data";
import {
  COMPANY_INDUSTRY_LABELS,
  COMPANY_TYPE_LABELS,
  COUNTRY_LABELS,
  label,
  TAX_ID_LABELS,
} from "@/lib/taxonomy";
import { isValidTaxId } from "@/lib/validation";
import type { CompanyFull } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileModeration } from "@/components/admin/admin-actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("companiesTitle"), robots: { index: false } };
}

export default async function AdminCompaniesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const format = await getFormatter({ locale });
  await requireSession(locale, { roles: ["admin"] });

  const companies: CompanyFull[] = isSupabaseConfigured
    ? await getAllCompanies(await createClient())
    : [DEMO_COMPANY];
  // Unverified first — they need attention
  companies.sort(
    (a, b) => Number(!!a.profile.verified_at) - Number(!!b.profile.verified_at)
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("companiesTitle")}</h1>
        <p className="mt-1.5 text-muted">{t("companiesSubtitle")}</p>

        {companies.length === 0 ? (
          <EmptyState icon={Building2} title={t("noCompanies")} className="mt-8" />
        ) : (
          <div className="card mt-8 overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-soft text-left text-xs font-bold tracking-wider text-muted uppercase">
                  <th className="px-4 py-3">{t("companyCols.company")}</th>
                  <th className="px-4 py-3">{t("companyCols.legal")}</th>
                  <th className="px-4 py-3">{t("companyCols.contact")}</th>
                  <th className="px-4 py-3">{t("companyCols.status")}</th>
                  <th className="px-4 py-3">{t("companyCols.joined")}</th>
                  <th className="px-4 py-3">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(({ profile, company: c, contact }) => {
                  const taxLabel = label(TAX_ID_LABELS[c.country] ?? { sr: "PIB", en: "Tax ID" }, locale);
                  const taxOk = c.tax_id ? isValidTaxId(c.country, c.tax_id) : false;
                  return (
                    <tr key={c.profile_id} className="border-b border-line/70 align-top last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={c.logo_url} name={c.name || profile.full_name} size={40} company />
                          <div className="min-w-0">
                            <p className="font-semibold">{c.name || "—"}</p>
                            <p className="text-xs text-muted">
                              {label(COMPANY_INDUSTRY_LABELS[c.industry], locale)} ·{" "}
                              {[c.city, label(COUNTRY_LABELS[c.country], locale)].filter(Boolean).join(", ")}
                            </p>
                            {c.website && (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                              >
                                {c.website.replace(/^https?:\/\//, "")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-semibold">{label(COMPANY_TYPE_LABELS[c.company_type], locale)}</p>
                        {c.legal_name && <p className="text-muted">{c.legal_name}</p>}
                        <p className="mt-1">
                          {taxLabel}: <span className="font-mono">{c.tax_id ?? "—"}</span>{" "}
                          {c.tax_id && (
                            <Badge tone={taxOk ? "success" : "warning"} className="!px-1.5 !py-0">
                              {taxOk ? t("taxOk") : t("taxCheck")}
                            </Badge>
                          )}
                        </p>
                        {c.registration_number && (
                          <p>
                            {t("regNo")}: <span className="font-mono">{c.registration_number}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-semibold">{c.contact_name ?? profile.full_name}</p>
                        {c.contact_role && <p className="text-muted">{c.contact_role}</p>}
                        {contact?.contact_email && <p>{contact.contact_email}</p>}
                        {contact?.phone && <p>{contact.phone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={profile.status === "active" ? "success" : profile.status === "suspended" ? "accent" : "warning"}
                          className="!px-2 !py-0.5"
                        >
                          {t(`table.statusLabels.${profile.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted tabular-nums">
                        {format.dateTime(new Date(profile.created_at), { dateStyle: "medium" })}
                      </td>
                      <td className="px-4 py-3">
                        <ProfileModeration
                          profileId={profile.id}
                          verified={!!profile.verified_at}
                          status={profile.status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
