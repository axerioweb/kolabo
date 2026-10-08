import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tip?: string; type?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signupTitle"), description: t("signupSubtitle") };
}

export default async function SignupPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tip, type } = await searchParams;
  const wantsBrand = ["brend", "brand", "company", "firma"].includes(tip ?? type ?? "");
  return <AuthForm mode="signup" initialType={wantsBrand ? "company" : "influencer"} />;
}
