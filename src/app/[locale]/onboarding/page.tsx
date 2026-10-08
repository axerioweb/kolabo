import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getCompanyFull, getInfluencerFull, toOnboardingData } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_COMPANY } from "@/lib/demo-data";
import { toCompanyInput } from "@/lib/company-input";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { CompanyForm, emptyCompanyInput } from "@/components/company/company-form";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { LangSwitcher } from "@/components/lang-switcher";
import type { OnboardingData } from "@/lib/onboarding-types";
import type { CompanyInput } from "@/app/actions/company";

export const dynamic = "force-dynamic";

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

  const session = await requireSession(locale, { allowIncomplete: true });
  const role = session.profile.role;
  if (role === "admin") redirect({ href: "/admin", locale });

  let influencerData: Partial<OnboardingData> | undefined;
  let companyData: CompanyInput = { ...emptyCompanyInput };

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    if (role === "company") {
      const full = await getCompanyFull(supabase, session.userId);
      if (full) companyData = toCompanyInput(full, session.email);
    } else {
      const full = await getInfluencerFull(supabase, session.userId);
      if (full) influencerData = toOnboardingData(full);
    }
  } else if (role === "company") {
    companyData = toCompanyInput(DEMO_COMPANY);
  }

  return (
    <main className="min-h-screen bg-hero-glow">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" aria-label="Kolabo">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          {!isSupabaseConfigured && <Badge tone="warning">{tc("demoBadge")}</Badge>}
          <LangSwitcher />
        </div>
      </header>
      <div className="px-4 pt-4 pb-20 sm:px-6">
        {role === "company" ? (
          <CompanyForm initial={companyData} mode="onboarding" />
        ) : (
          <OnboardingWizard initialData={influencerData} />
        )}
      </div>
    </main>
  );
}
