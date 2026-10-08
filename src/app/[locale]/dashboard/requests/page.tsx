import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Inbox, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getMyRequests } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_INBOX } from "@/lib/demo-data";
import type { InboxItem } from "@/lib/types";
import type { RequestStatus } from "@/lib/taxonomy";
import { AppHeader } from "@/components/app-header";
import { RequestList } from "@/components/requests/request-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS: { key: string; statuses: RequestStatus[] | null }[] = [
  { key: "all", statuses: null },
  { key: "pending", statuses: ["pending"] },
  { key: "active", statuses: ["accepted", "delivered"] },
  { key: "completed", statuses: ["completed"] },
  { key: "closed", statuses: ["declined", "cancelled"] },
];

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "requests" });
  return { title: t("title"), robots: { index: false } };
}

export default async function RequestsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "requests" });
  const session = await requireSession(locale, { roles: ["influencer", "company"] });
  const viewer = session.profile.role;
  const { tab = "all" } = await searchParams;
  const current = TABS.find((x) => x.key === tab) ?? TABS[0];

  let all: InboxItem[];
  if (isSupabaseConfigured) {
    all = await getMyRequests(await createClient());
  } else {
    all = DEMO_INBOX;
  }
  const items = current.statuses ? all.filter((r) => current.statuses!.includes(r.status)) : all;
  const count = (s: RequestStatus[] | null) => (s ? all.filter((r) => s.includes(r.status)).length : all.length);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-muted">
              {viewer === "company" ? t("subtitleCompany") : t("subtitleInfluencer")}
            </p>
          </div>
          {viewer === "company" && (
            <Button asChild size="sm">
              <Link href="/creators">
                <Search className="h-4 w-4" />
                {t("findCreators")}
              </Link>
            </Button>
          )}
        </div>

        <nav className="-mx-4 mt-6 overflow-x-auto px-4" aria-label={t("tabsLabel")}>
          <ul className="flex min-w-max gap-2">
            {TABS.map((x) => {
              const active = x.key === current.key;
              return (
                <li key={x.key}>
                  <Link
                    href={{ pathname: "/dashboard/requests", query: x.key === "all" ? {} : { tab: x.key } }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-surface text-ink-soft hover:border-brand-300 hover:text-brand-700"
                    )}
                  >
                    {t(`tabs.${x.key}`)}
                    <span className={cn("text-xs", active ? "text-white/70" : "text-muted")}>
                      {count(x.statuses)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6">
          {items.length > 0 ? (
            <RequestList items={items} viewer={viewer} />
          ) : (
            <EmptyState
              icon={Inbox}
              title={t("emptyTitle")}
              text={viewer === "company" ? t("emptyCompany") : t("emptyInfluencer")}
              action={
                viewer === "company" ? (
                  <Button asChild>
                    <Link href="/creators">{t("findCreators")}</Link>
                  </Button>
                ) : (
                  <Button asChild variant="secondary">
                    <Link href="/dashboard/profile">{t("improveProfile")}</Link>
                  </Button>
                )
              }
            />
          )}
        </div>
      </main>
    </>
  );
}
