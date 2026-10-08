import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getCompanyFull, getInfluencerFull, toOnboardingData } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { DEMO_COMPANY, DEMO_INFLUENCERS } from "@/lib/demo-data";
import { toCompanyInput } from "@/lib/company-input";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { CompanyForm, emptyCompanyInput } from "@/components/company/company-form";
import { AvatarUploader } from "@/components/settings/avatar-uploader";
import { AppHeader } from "@/components/app-header";
import type { OnboardingData } from "@/lib/onboarding-types";
import type { CompanyInput } from "@/app/actions/company";

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
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const session = await requireSession(locale, { roles: ["influencer", "company"] });
  const isCompany = session.profile.role === "company";

  let influencerData: Partial<OnboardingData> | undefined;
  let companyData: CompanyInput = { ...emptyCompanyInput };
  let avatar: string | null = null;
  let name = session.profile.full_name;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    if (isCompany) {
      const full = await getCompanyFull(supabase, session.userId);
      if (full) {
        companyData = toCompanyInput(full, session.email);
        avatar = full.company.logo_url;
        name = full.company.name;
      }
    } else {
      const full = await getInfluencerFull(supabase, session.userId);
      if (full) {
        influencerData = toOnboardingData(full);
        avatar = full.profile.avatar_url;
      }
    }
  } else if (isCompany) {
    companyData = toCompanyInput(DEMO_COMPANY);
    name = DEMO_COMPANY.company.name;
  } else {
    influencerData = toOnboardingData(DEMO_INFLUENCERS[0]);
  }

  return (
    <>
      <AppHeader />
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto mb-8 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {isCompany ? t("editCompany") : t("editProfile")}
          </h1>
          <div className="card mt-6 p-6">
            <p className="mb-4 font-display font-bold">
              {isCompany ? t("logoTitle") : t("photoTitle")}
            </p>
            <AvatarUploader current={avatar} name={name} company={isCompany} />
          </div>
        </div>
        {isCompany ? (
          <CompanyForm initial={companyData} mode="edit" />
        ) : (
          <OnboardingWizard initialData={influencerData} mode="edit" />
        )}
      </main>
    </>
  );
}
