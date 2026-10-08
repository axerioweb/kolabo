import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_NOTIFICATIONS } from "@/lib/demo-data";
import { AppHeader } from "@/components/app-header";
import { NotificationsList } from "@/components/dashboard/notifications-list";
import type { AppNotification } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("notifications"), robots: { index: false } };
}

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const session = await requireSession(locale, { allowIncomplete: true });

  let notifications: AppNotification[] = [];
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    notifications = await getNotifications(supabase, session.userId, 100);
  } else {
    notifications = DEMO_NOTIFICATIONS;
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">
          {t("notifications")}
        </h1>
        <NotificationsList notifications={notifications} showMarkAll />
      </main>
    </>
  );
}
