import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getInfluencerFull, toOnboardingData } from "@/lib/queries";
import { DEMO_INFLUENCERS } from "@/lib/demo-data";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { AppHeader } from "@/components/app-header";
import type { OnboardingData } from "@/lib/onboarding-types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("editProfile"), robots: { index: false } };
}

export default async function EditProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialData: Partial<OnboardingData> | undefined;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect({ href: "/login", locale });
    const full = await getInfluencerFull(supabase, user!.id);
    if (full) initialData = toOnboardingData(full);
  } else {
    initialData = toOnboardingData(DEMO_INFLUENCERS[0]);
  }

  return (
    <>
      <AppHeader />
      <main className="px-4 py-12 sm:px-6">
        <OnboardingWizard initialData={initialData} />
      </main>
    </>
  );
}
