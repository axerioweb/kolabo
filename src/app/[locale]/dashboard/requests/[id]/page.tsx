import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Check,
  ExternalLink,
  Globe,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getRequestDetail } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { markRequestRead } from "@/app/actions/requests";
import { DEMO_REQUEST_DETAIL } from "@/lib/demo-data";
import {
  COMPANY_INDUSTRY_LABELS,
  COMPENSATION_LABELS,
  label,
  SERVICE_LABELS,
  USAGE_RIGHTS_LABELS,
  type RequestStatus,
} from "@/lib/taxonomy";
import type { RequestContact, RequestDetail } from "@/lib/types";
import { formatNumber, cn } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import { Stars } from "@/components/ui/rating";
import { StatusBadge } from "@/components/requests/status-badge";
import { MessageThread } from "@/components/requests/message-thread";
import { RequestActions } from "@/components/requests/request-actions";
import { ReviewForm } from "@/components/requests/review-form";
import { ReportDialog } from "@/components/community/report-dialog";
import { InstagramIcon } from "@/components/social-icons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "requests" });
  return { title: t("detailTitle"), robots: { index: false } };
}

const FLOW: RequestStatus[] = ["pending", "accepted", "delivered", "completed"];

function Progress({ status, t }: { status: RequestStatus; t: (k: string) => string }) {
  if (status === "declined" || status === "cancelled" || status === "expired") {
    return (
      <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm font-semibold text-muted">
        {t(`closedNote.${status}`)}
      </p>
    );
  }
  const idx = FLOW.indexOf(status);
  return (
    <ol className="flex items-center gap-2" aria-label={t("progress")}>
      {FLOW.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col gap-1.5">
          <span
            className={cn(
              "h-1.5 rounded-full",
              i < idx ? "bg-brand-500" : i === idx ? "bg-gradient-to-r from-brand-500 to-accent-500" : "bg-line"
            )}
          />
          <span className={cn("text-[11px] font-semibold", i <= idx ? "text-brand-700" : "text-muted")}>
            {i < idx && <Check className="mr-0.5 inline h-3 w-3" />}
            {t(`flow.${s}`)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ContactCard({ contact, name, t }: { contact: RequestContact; name: string; t: (k: string, v?: Record<string, string>) => string }) {
  const digits = (p: string) => p.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const rows: { icon: React.ReactNode; label: string; value: string; href: string }[] = [];
  if (contact.email) rows.push({ icon: <Mail className="h-4 w-4" />, label: t("contact.email"), value: contact.email, href: `mailto:${contact.email}` });
  if (contact.phone) {
    if (contact.channels.includes("phone")) rows.push({ icon: <Phone className="h-4 w-4" />, label: t("contact.phone"), value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` });
    if (contact.channels.includes("whatsapp")) rows.push({ icon: <MessageCircle className="h-4 w-4" />, label: "WhatsApp", value: contact.phone, href: `https://wa.me/${digits(contact.phone)}` });
    if (contact.channels.includes("viber")) rows.push({ icon: <MessageCircle className="h-4 w-4" />, label: "Viber", value: contact.phone, href: `viber://chat?number=%2B${digits(contact.phone)}` });
  }
  if (contact.instagram) rows.push({ icon: <InstagramIcon className="h-4 w-4" />, label: "Instagram DM", value: `@${contact.instagram}`, href: `https://ig.me/m/${contact.instagram}` });

  return (
    <div className="card p-6">
      <p className="flex items-center gap-2 font-display font-bold">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
        {t("contact.title", { name })}
      </p>
      {rows.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.label + r.value}>
              <a
                href={r.href}
                target={r.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm transition-colors hover:border-brand-300"
              >
                <span className="text-muted">{r.icon}</span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted">{r.label}</span>
                  <span className="block truncate font-semibold">{r.value}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">{t("contact.platformOnly")}</p>
      )}
    </div>
  );
}

export default async function RequestDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "requests" });
  const format = await getFormatter({ locale });
  const session = await requireSession(locale, { roles: ["influencer", "company", "admin"] });

  let detail: RequestDetail | null;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    detail = await getRequestDetail(supabase, id, session.userId);
    // Mark as read/seen after the response is sent — does not block render
    if (detail) after(() => markRequestRead(id));
  } else {
    detail = DEMO_REQUEST_DETAIL;
  }
  if (!detail) notFound();

  const { request: r, company, influencer } = detail;
  const isAdmin = session.profile.role === "admin";
  const viewer: "influencer" | "company" =
    session.demo
      ? session.profile.role === "company" ? "company" : "influencer"
      : session.userId === r.company_id ? "company" : "influencer";
  const myId = session.demo ? (viewer === "company" ? r.company_id : r.influencer_id) : session.userId;
  const other = viewer === "company" ? influencer : company;
  const canSend = !isAdmin && ["pending", "accepted", "delivered", "completed"].includes(r.status);
  const fmtDate = (d: string | null) =>
    d ? format.dateTime(new Date(d), { day: "numeric", month: "long", year: "numeric" }) : null;
  const money = (v: number | null) => (v != null ? `${formatNumber(v, locale)} ${r.currency}` : "—");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href={isAdmin ? "/admin/requests" : "/dashboard/requests"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar src={other.avatar_url} name={other.name} size={56} company={viewer === "influencer"} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">{r.title}</h1>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
                {viewer === "company" ? t("with") : t("from")}{" "}
                {viewer === "company" && influencer.username ? (
                  <Link
                    href={{ pathname: "/creators/[username]", params: { username: influencer.username } }}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    {other.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-ink">{other.name}</span>
                )}
                {other.verified && <BadgeCheck className="h-4 w-4 text-brand-500" aria-label={t("verified")} />}
                <span className="text-muted">· {t("sentOn", { date: fmtDate(r.created_at) ?? "" })}</span>
              </p>
            </div>
          </div>
          {!isAdmin && (
            <ReportDialog targetId={other.id} requestId={r.id} className="self-start" />
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main column: status + conversation */}
          <div className="min-w-0 space-y-6">
            <div className="card space-y-5 p-6">
              <Progress status={r.status} t={(k) => t(k)} />
              {r.status === "declined" && r.decline_reason && (
                <Alert tone="info" title={t("declineReason")}>
                  {r.decline_reason}
                </Alert>
              )}
              {r.status === "pending" && viewer === "influencer" && (
                <p className="text-sm text-ink-soft">{t("pendingInfluencer")}</p>
              )}
              {r.status === "pending" && viewer === "company" && (
                <p className="text-sm text-ink-soft">
                  {r.viewed_at ? t("pendingCompanySeen") : t("pendingCompany")}
                </p>
              )}
              {r.status === "accepted" && (
                <p className="text-sm text-ink-soft">
                  {viewer === "influencer" ? t("acceptedInfluencer") : t("acceptedCompany")}
                </p>
              )}
              {r.status === "delivered" && (
                <p className="text-sm text-ink-soft">
                  {viewer === "company" ? t("deliveredCompany") : t("deliveredInfluencer")}
                </p>
              )}
              {!isAdmin && <RequestActions requestId={r.id} status={r.status} viewer={viewer} />}
            </div>

            {["accepted", "delivered"].includes(r.status) && (
              <Alert tone="warning" title={t("disclosureTitle")}>
                {t("disclosureText")}
              </Alert>
            )}

            {r.status === "completed" && !isAdmin && (
              <div className="card p-6">
                {detail.myReview ? (
                  <div>
                    <p className="font-display font-bold">{t("yourReview")}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Stars value={detail.myReview.rating} />
                      <span className="text-sm text-muted">{fmtDate(detail.myReview.created_at)}</span>
                    </div>
                    {detail.myReview.comment && (
                      <p className="mt-2 text-sm text-ink-soft">{detail.myReview.comment}</p>
                    )}
                  </div>
                ) : (
                  <ReviewForm requestId={r.id} otherName={other.name} />
                )}
              </div>
            )}

            <MessageThread
              requestId={r.id}
              initialMessages={detail.messages}
              myId={myId}
              otherName={other.name}
              canSend={canSend}
            />
          </div>

          {/* Sidebar: brief */}
          <aside className="space-y-6">
            {detail.contact && <ContactCard contact={detail.contact} name={other.name} t={(k, v) => t(k, v)} />}

            <div className="card p-6">
              <h2 className="font-display text-lg font-bold">{t("brief")}</h2>
              {r.goal && (
                <div className="mt-4">
                  <p className="text-xs font-bold tracking-wider text-muted uppercase">{t("goal")}</p>
                  <p className="mt-1 text-sm text-ink-soft">{r.goal}</p>
                </div>
              )}
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-ink-soft">{r.brief}</p>

              <dl className="mt-5 space-y-4 border-t border-line pt-5 text-sm">
                <div>
                  <dt className="text-xs font-bold tracking-wider text-muted uppercase">{t("deliverables")}</dt>
                  <dd className="mt-1.5">
                    <ul className="space-y-1">
                      {r.deliverables.map((d, i) => (
                        <li key={d} className="flex justify-between gap-3">
                          <span>{label(SERVICE_LABELS[d], locale)}</span>
                          <span className="font-semibold">× {r.deliverable_counts[i] ?? 1}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold tracking-wider text-muted uppercase">{t("compensation")}</dt>
                  <dd className="mt-1.5 space-y-1">
                    <p className="font-semibold">{label(COMPENSATION_LABELS[r.compensation], locale)}</p>
                    {r.compensation !== "barter" && (
                      <p>{t("budget")}: <span className="font-semibold">{money(r.budget_amount)}</span></p>
                    )}
                    {r.barter_description && (
                      <p>
                        {t("barter")}: <span className="font-semibold">{r.barter_description}</span>
                        {r.barter_value != null && <span className="text-muted"> (~{money(r.barter_value)})</span>}
                      </p>
                    )}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-bold tracking-wider text-muted uppercase">{t("usageRights")}</dt>
                    <dd className="mt-1.5">{label(USAGE_RIGHTS_LABELS[r.usage_rights], locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold tracking-wider text-muted uppercase">{t("revisions")}</dt>
                    <dd className="mt-1.5">{r.revisions}</dd>
                  </div>
                </div>
                {(r.start_date || r.end_date || r.respond_by) && (
                  <div>
                    <dt className="text-xs font-bold tracking-wider text-muted uppercase">{t("timeline")}</dt>
                    <dd className="mt-1.5 space-y-1">
                      {(r.start_date || r.end_date) && (
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted" />
                          {[fmtDate(r.start_date), fmtDate(r.end_date)].filter(Boolean).join(" – ")}
                        </p>
                      )}
                      {r.respond_by && r.status === "pending" && (
                        <p className="font-semibold text-amber-700">
                          {t("respondByFull", { date: fmtDate(r.respond_by) ?? "" })}
                        </p>
                      )}
                    </dd>
                  </div>
                )}
                {r.key_messages && (
                  <div>
                    <dt className="text-xs font-bold tracking-wider text-muted uppercase">{t("keyMessages")}</dt>
                    <dd className="mt-1.5 whitespace-pre-line text-ink-soft">{r.key_messages}</dd>
                  </div>
                )}
                {r.restrictions && (
                  <div>
                    <dt className="text-xs font-bold tracking-wider text-muted uppercase">{t("restrictions")}</dt>
                    <dd className="mt-1.5 whitespace-pre-line text-ink-soft">{r.restrictions}</dd>
                  </div>
                )}
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
                  <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t("disclosureAcked")}
                </div>
              </dl>
            </div>

            {viewer === "influencer" && (
              <div className="card p-6">
                <p className="font-display font-bold">{t("aboutCompany")}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar src={company.avatar_url} name={company.name} size={44} company />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-semibold">
                      {company.name}
                      {company.verified && <BadgeCheck className="h-4 w-4 text-brand-500" />}
                    </p>
                    <p className="text-xs text-muted">
                      {[company.industry && label(COMPANY_INDUSTRY_LABELS[company.industry], locale), company.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                {company.description && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{company.description}</p>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {company.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {!company.verified && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
                    <Star className="h-3.5 w-3.5" />
                    {t("unverifiedCompany")}
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
