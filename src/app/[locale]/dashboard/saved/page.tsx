import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Heart, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSavedCreators } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_INFLUENCERS, demoCardData } from "@/lib/demo-data";
import type { CreatorCardData } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { CreatorCard } from "@/components/creators/creator-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "saved" });
  return { title: t("title"), robots: { index: false } };
}

export default async function SavedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "saved" });
  const session = await requireSession(locale, { roles: ["company"] });

  let creators: CreatorCardData[];
  if (isSupabaseConfigured) {
    creators = await getSavedCreators(await createClient(), session.userId);
  } else {
    creators = DEMO_INFLUENCERS.slice(1, 3).map(demoCardData);
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted">{t("subtitle")}</p>
        <div className="mt-8">
          {creators.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((c) => (
                <CreatorCard key={c.id} creator={c} canSave saved />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              title={t("emptyTitle")}
              text={t("emptyText")}
              action={
                <Button asChild>
                  <Link href="/creators">
                    <Search className="h-4 w-4" />
                    {t("browse")}
                  </Link>
                </Button>
              }
            />
          )}
        </div>
      </main>
    </>
  );
}
