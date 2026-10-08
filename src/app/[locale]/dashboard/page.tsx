import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Pencil } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  getInfluencerFull,
  getNotifications,
  profileCompleteness,
} from "@/lib/queries";
import { DEMO_INFLUENCERS, DEMO_NOTIFICATIONS } from "@/lib/demo-data";
import type { AppNotification, InfluencerFull } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { NotificationsList } from "@/components/dashboard/notifications-list";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title"), robots: { index: false } };
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "dashboard" });

  let full: InfluencerFull | null = null;
  let notifications: AppNotification[] = [];
  let isAdmin = false;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect({ href: "/login", locale });
    full = await getInfluencerFull(supabase, user!.id);
    notifications = await getNotifications(supabase, user!.id);
    isAdmin = full?.profile.role === "admin";
  } else {
    // Demo mode
    full = DEMO_INFLUENCERS[0];
    notifications = DEMO_NOTIFICATIONS;
    isAdmin = true;
  }

  if (!full) redirect({ href: "/onboarding", locale });
  const f = full!;
  const completeness = profileCompleteness(f);
  const firstName = f.profile.full_name.split(" ")[0];

  return (
    <>
      <AppHeader isAdmin={isAdmin} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t("welcome", { name: firstName })}
            </h1>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/profile">
              <Pencil className="h-4 w-4" />
              {t("editProfile")}
            </Link>
          </Button>
        </div>

        {!f.profile.onboarding_completed && (
          <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 border-amber-200 bg-amber-50/60 p-5">
            <p className="text-sm font-medium text-amber-900">
              {t("completeOnboarding")}
            </p>
            <Button asChild size="sm">
              <Link href="/onboarding">
                {t("continueOnboarding")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left column — profile preview */}
          <div>
            <p className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted">
              {t("profilePreview")}
            </p>
            <ProfileCard full={f} />
          </div>

          {/* Right column — completeness + notifications */}
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="font-display font-bold">
                  {t("profileCompleteness")}
                </p>
                <p className="font-display text-2xl font-bold text-brand-600">
                  {completeness}%
                </p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-700"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted">{t("completenessHint")}</p>
            </div>

            <div className="card p-6">
              <p className="mb-4 font-display font-bold">
                {t("notifications")}
              </p>
              <NotificationsList notifications={notifications} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
