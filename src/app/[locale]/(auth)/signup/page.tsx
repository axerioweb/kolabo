import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { publicMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tip?: string; type?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return publicMetadata({
    locale,
    title: t("signupTitle"),
    description: t("signupSubtitle"),
    sr: "/registracija",
    en: "/en/signup",
  });
}

export default async function SignupPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tip, type } = await searchParams;
  const wantsBrand = ["brend", "brand", "company", "firma"].includes(tip ?? type ?? "");
  return <AuthForm mode="signup" initialType={wantsBrand ? "company" : "influencer"} />;
}
