import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, MapPin, Search, UserX } from "lucide-react";
import { getPathname, Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getPublicCreator } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { demoPublicCreator } from "@/lib/demo-data";
import {
  COUNTRY_LABELS,
  FOLLOWER_RANGE_LABELS,
  label,
  REGULATED_INDUSTRIES,
  SERVICE_LABELS,
} from "@/lib/taxonomy";
import { formatPrice } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";
import { RequestForm } from "@/components/requests/request-form";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/social-icons";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ creator?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "requestForm" });
  return { title: t("pageTitle"), robots: { index: false } };
}

export default async function NewRequestPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "requestForm" });
  const { creator: username = "" } = await searchParams;
  const session = await requireSession(locale, {
    roles: ["company"],
    next: getPathname({
      locale,
      href: { pathname: "/dashboard/requests/new", query: { creator: username } },
    }),
  });

  const creator = username
    ? isSupabaseConfigured
      ? await getPublicCreator(await createClient(), username)
      : demoPublicCreator(username)
    : null;

  if (!creator) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={UserX}
            title={t("creatorMissingTitle")}
            text={t("creatorMissingText")}
            action={
              <Button asChild>
                <Link href="/creators">
                  <Search className="h-4 w-4" />
                  {t("browse")}
                </Link>
              </Button>
            }
          />
        </main>
      </>
    );
  }

  const p = creator.profile;
  const hasMinorAudience = creator.socials.some((s) => s.audience_top_age === "13_17");
  const industry = session.company?.industry;
  const showMinorWarning =
    hasMinorAudience && !!industry && REGULATED_INDUSTRIES.includes(industry);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <p className="mt-1 text-muted">{t("pageSubtitle", { name: p.full_name })}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <RequestForm
            username={p.username ?? username}
            creatorName={p.full_name}
            offered={creator.services.map((s) => s.service_type)}
            showMinorWarning={showMinorWarning}
          />

          <aside className="order-first lg:order-last">
            <div className="card sticky top-24 p-6">
              <div className="flex items-center gap-3">
                <Avatar src={p.avatar_url} name={p.full_name} size={52} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-display font-bold">
                    <span className="truncate">{p.full_name}</span>
                    {p.verified_at && <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-brand-500" />}
                  </p>
                  <Link
                    href={{ pathname: "/creators/[username]", params: { username: p.username ?? username } }}
                    className="text-sm text-brand-600 hover:underline"
                    target="_blank"
                  >
                    @{p.username}
                  </Link>
                </div>
              </div>
              {(p.city || p.country) && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {[p.city, p.country && label(COUNTRY_LABELS[p.country], locale)].filter(Boolean).join(", ")}
                </p>
              )}
              {creator.socials.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {creator.socials.map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <SocialIcon platform={s.platform} className="h-4 w-4 text-ink-soft" />
                      <span className="font-semibold">{FOLLOWER_RANGE_LABELS[s.follower_range]}</span>
                      {s.engagement_rate != null && (
                        <span className="text-xs text-muted">· ER {s.engagement_rate}%</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {creator.services.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs font-bold tracking-wider text-muted uppercase">{t("creatorRates")}</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {creator.services.map((s) => (
                      <li key={s.id} className="flex justify-between gap-3">
                        <span className="text-ink-soft">{label(SERVICE_LABELS[s.service_type], locale)}</span>
                        <span className="font-semibold">{formatPrice(s.price_min, s.price_max, s.currency, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-5 rounded-xl bg-brand-50 p-4 text-xs leading-relaxed text-brand-900">
                <p className="font-bold">{t("tipsTitle")}</p>
                <ul className="mt-2 space-y-1">
                  <li>• {t("tip1")}</li>
                  <li>• {t("tip2")}</li>
                  <li>• {t("tip3")}</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
