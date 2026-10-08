import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAllInfluencers } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_INFLUENCERS } from "@/lib/demo-data";
import { buildInfluencerRows, tableOptions } from "@/lib/admin-rows";
import { AppHeader } from "@/components/app-header";
import { InfluencerTable } from "@/components/admin/influencer-table";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("influencersTitle"), robots: { index: false } };
}

export default async function AdminInfluencersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  await requireSession(locale, { roles: ["admin"] });

  const influencers = isSupabaseConfigured
    ? await getAllInfluencers(await createClient())
    : DEMO_INFLUENCERS;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("influencersTitle")}</h1>
        <p className="mt-1.5 text-muted">{t("influencersSubtitle")}</p>
        <div className="mt-8">
          <InfluencerTable rows={buildInfluencerRows(influencers, locale)} manage {...tableOptions(locale)} />
        </div>
      </main>
    </>
  );
}
