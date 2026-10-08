import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getInfluencerFull, toOnboardingData } from "@/lib/queries";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { Logo } from "@/components/ui/logo";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import type { OnboardingData } from "@/lib/onboarding-types";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("title"), robots: { index: false } };
}

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations({ locale, namespace: "common" });

  let initialData: Partial<OnboardingData> | undefined;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect({ href: "/login", locale });
    const full = await getInfluencerFull(supabase, user!.id);
    if (full) initialData = toOnboardingData(full);
  }

  return (
    <main className="min-h-screen bg-hero-glow">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" aria-label="Kolabo">
          <Logo />
        </Link>
        {!isSupabaseConfigured && (
          <Badge tone="warning">{tc("demoBadge")}</Badge>
        )}
      </header>
      <div className="px-4 pt-4 pb-20 sm:px-6">
        <OnboardingWizard initialData={initialData} />
      </div>
    </main>
  );
}
