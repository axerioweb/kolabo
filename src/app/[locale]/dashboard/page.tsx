import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  ExternalLink,
  Heart,
  Inbox,
  Megaphone,
  Pencil,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getPathname, Link, redirect } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  companyCompleteness,
  getCompanyFull,
  getInfluencerFull,
  getMyRequests,
  getNotifications,
  getSavedIds,
  profileCompleteness,
  searchCreators,
} from "@/lib/queries";
import { requireSession } from "@/lib/session";
import {
  DEMO_COMPANY,
  DEMO_INBOX,
  DEMO_INFLUENCERS,
  DEMO_NOTIFICATIONS,
  demoCardData,
} from "@/lib/demo-data";
import type {
  AppNotification,
  CompanyFull,
  CreatorCardData,
  InboxItem,
  InfluencerFull,
  SessionContext,
} from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { NotificationsList } from "@/components/dashboard/notifications-list";
import { ProfileChecklist } from "@/components/dashboard/profile-checklist";
import { RequestList } from "@/components/requests/request-list";
import { CreatorCard } from "@/components/creators/creator-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title"), robots: { index: false } };
}

function StatTile({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  href?: React.ComponentProps<typeof Link>["href"];
}) {
  const body = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      {body}
    </Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}

function Completeness({ value, hint, title }: { value: number; hint: string; title: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-display font-bold">{title}</p>
        <p className="font-display text-2xl font-bold text-brand-600">{value}%</p>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-700 motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireSession(locale);
  if (session.profile.role === "admin") redirect({ href: "/admin", locale });

  return session.profile.role === "company" ? (
    <CompanyDashboard session={session} locale={locale} />
  ) : (
    <InfluencerDashboard session={session} locale={locale} />
  );
}

/* ------------------------------------------------------------------ */
/* Creator dashboard                                                   */
/* ------------------------------------------------------------------ */

async function InfluencerDashboard({
  session,
  locale,
}: {
  session: SessionContext;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "dashboard" });

  let full: InfluencerFull | null;
  let notifications: AppNotification[];
  let requests: InboxItem[];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    [full, notifications, requests] = await Promise.all([
      getInfluencerFull(supabase, session.userId),
      getNotifications(supabase, session.userId, 6),
      getMyRequests(supabase),
    ]);
  } else {
    full = DEMO_INFLUENCERS[0];
    notifications = DEMO_NOTIFICATIONS;
    requests = DEMO_INBOX.slice(0, 1);
  }

  if (!full) redirect({ href: "/onboarding", locale });
  const f = full!;
  const completeness = profileCompleteness(f);
  const firstName = f.profile.full_name.split(" ")[0];
  const pending = requests.filter((r) => r.status === "pending").length;
  const active = requests.filter((r) => ["accepted", "delivered"].includes(r.status)).length;
  const completed = requests.filter((r) => r.status === "completed").length;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("welcome", { name: firstName })}
            </h1>
            <p className="mt-1 text-muted">{t("influencerSubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {f.profile.username && (
              <Button asChild variant="secondary" size="sm">
                <Link href={{ pathname: "/creators/[username]", params: { username: f.profile.username } }}>
                  <ExternalLink className="h-4 w-4" />
                  {t("viewPublicProfile")}
                </Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link href="/dashboard/profile">
                <Pencil className="h-4 w-4" />
                {t("editProfile")}
              </Link>
            </Button>
          </div>
        </div>

        {!f.profile.verified_at && (
          <Alert tone="info" className="mt-6" title={t("verifyTitle")}>
            {t("verifyText")}
          </Alert>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile icon={Inbox} label={t("stats.newRequests")} value={pending} href="/dashboard/requests" />
          <StatTile icon={Sparkles} label={t("stats.activeCollabs")} value={active} href="/dashboard/requests" />
          <StatTile icon={BadgeCheck} label={t("stats.completed")} value={completed} />
          <StatTile icon={ShieldCheck} label={t("stats.completeness")} value={`${completeness}%`} href="/dashboard/profile" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold tracking-wider text-muted uppercase">
                  {t("latestRequests")}
                </h2>
                {requests.length > 0 && (
                  <Link href="/dashboard/requests" className="text-sm font-semibold text-brand-600 hover:underline">
                    {t("viewAll")}
                  </Link>
                )}
              </div>
              {requests.length > 0 ? (
                <RequestList items={requests.slice(0, 4)} viewer="influencer" />
              ) : (
                <EmptyState icon={Inbox} title={t("noRequestsTitle")} text={t("noRequestsText")} />
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-sm font-bold tracking-wider text-muted uppercase">
                {t("profilePreview")}
              </h2>
              <ProfileCard full={f} />
            </section>
          </div>

          <div className="space-y-6">
            <ProfileChecklist full={f} avatarMissing={!f.profile.avatar_url} />

            <div className="card border-amber-200 bg-amber-50/50 p-6">
              <p className="flex items-center gap-2 font-display font-bold text-amber-900">
                <Megaphone className="h-5 w-5" />
                {t("disclosureTitle")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/80">{t("disclosureText")}</p>
            </div>

            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display font-bold">{t("notifications")}</p>
                <Link href="/dashboard/notifications" className="text-sm font-semibold text-brand-600 hover:underline">
                  {t("viewAll")}
                </Link>
              </div>
              <NotificationsList notifications={notifications} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Company dashboard                                                   */
/* ------------------------------------------------------------------ */

async function CompanyDashboard({
  session,
  locale,
}: {
  session: SessionContext;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "dashboard" });

  let full: CompanyFull | null;
  let requests: InboxItem[];
  let savedIds: string[];
  let recommended: CreatorCardData[];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const interest = session.company?.interested_categories[0];
    const country = session.company?.country;
    let targeted: CreatorCardData[];
    let fallback: CreatorCardData[];
    [full, requests, savedIds, targeted, fallback] = await Promise.all([
      getCompanyFull(supabase, session.userId),
      getMyRequests(supabase),
      getSavedIds(supabase, session.userId),
      searchCreators(supabase, { category: interest, country }).then((r) => r.items.slice(0, 3)),
      searchCreators(supabase, {}).then((r) => r.items.slice(0, 3)),
    ]);
    recommended = targeted.length > 0 ? targeted : fallback;
    // Nothing in the main interest yet — show the newest public creators instead
    if (recommended.length === 0 && interest) {
      recommended = (await searchCreators(supabase, {})).items.slice(0, 3);
    }
  } else {
    full = DEMO_COMPANY;
    requests = DEMO_INBOX;
    savedIds = ["demo-2"];
    recommended = DEMO_INFLUENCERS.slice(0, 3).map(demoCardData);
  }

  if (!full) redirect({ href: "/onboarding", locale });
  const c = full!;
  const completeness = companyCompleteness(c);
  const sent = requests.length;
  const accepted = requests.filter((r) => ["accepted", "delivered", "completed"].includes(r.status)).length;
  const awaiting = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("welcome", { name: c.company.contact_name?.split(" ")[0] || c.company.name })}
            </h1>
            <p className="mt-1 text-muted">{t("companySubtitle", { company: c.company.name })}</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/profile">
              <Pencil className="h-4 w-4" />
              {t("editCompany")}
            </Link>
          </Button>
        </div>

        {c.profile.verified_at ? (
          <Alert tone="success" className="mt-6" title={t("companyVerifiedTitle")}>
            {t("companyVerifiedText")}
          </Alert>
        ) : (
          <Alert tone="info" className="mt-6" title={t("companyPendingTitle")}>
            {t("companyPendingText")}
          </Alert>
        )}

        {/* Quick search */}
        <form
          action={getPathname({ locale, href: "/creators" })}
          method="get"
          className="card mt-6 flex flex-col gap-3 bg-gradient-to-r from-brand-50 to-pink-50 p-5 sm:flex-row sm:items-center"
        >
          <label htmlFor="quick-q" className="sr-only">
            {t("quickSearch")}
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
            <input
              id="quick-q"
              name="q"
              placeholder={t("quickSearchPlaceholder")}
              className="h-12 w-full rounded-full border border-line bg-white pr-4 pl-11 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          <Button type="submit">
            {t("quickSearch")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile icon={Send} label={t("stats.sent")} value={sent} href="/dashboard/requests" />
          <StatTile icon={Clock} label={t("stats.awaiting")} value={awaiting} href="/dashboard/requests" />
          <StatTile icon={BadgeCheck} label={t("stats.accepted")} value={accepted} href="/dashboard/requests" />
          <StatTile icon={Heart} label={t("stats.saved")} value={savedIds.length} href="/dashboard/saved" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold tracking-wider text-muted uppercase">
                {t("latestRequests")}
              </h2>
              {requests.length > 0 && (
                <Link href="/dashboard/requests" className="text-sm font-semibold text-brand-600 hover:underline">
                  {t("viewAll")}
                </Link>
              )}
            </div>
            {requests.length > 0 ? (
              <RequestList items={requests.slice(0, 5)} viewer="company" />
            ) : (
              <EmptyState
                icon={Send}
                title={t("noSentTitle")}
                text={t("noSentText")}
                action={
                  <Button asChild>
                    <Link href="/creators">
                      <Search className="h-4 w-4" />
                      {t("findCreators")}
                    </Link>
                  </Button>
                }
              />
            )}
          </section>

          <div className="space-y-6">
            <Completeness value={completeness} title={t("companyCompleteness")} hint={t("companyCompletenessHint")} />
            <div className="card p-6">
              <p className="font-display font-bold">{t("howItWorksTitle")}</p>
              <ol className="mt-4 space-y-3 text-sm text-ink-soft">
                {(["step1", "step2", "step3"] as const).map((k, i) => (
                  <li key={k} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{t(`companySteps.${k}`)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {recommended.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{t("recommendedTitle")}</h2>
              <Link href="/creators" className="text-sm font-semibold text-brand-600 hover:underline">
                {t("viewAll")}
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((cr) => (
                <CreatorCard key={cr.id} creator={cr} canSave saved={savedIds.includes(cr.id)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
