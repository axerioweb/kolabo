import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
// Self-hosted variable fonts (uključuju latin-ext za š, đ, č, ć, ž)
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: "%s | Kolabo",
    },
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: locale === "sr" ? "/" : `/${locale}`,
      languages: {
        sr: "/",
        en: "/en",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      siteName: "Kolabo",
      title: t("title"),
      description: t("description"),
      locale: locale === "sr" ? "sr_RS" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <html lang={locale === "sr" ? "sr-Latn" : "en"}>
      <body className="antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
