import { setRequestLocale, getTranslations } from "next-intl/server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CategoriesMarquee } from "@/components/landing/categories-marquee";
import { Networks } from "@/components/landing/networks";
import { ForBrands, FinalCta } from "@/components/landing/cta";
import { Faq } from "@/components/landing/faq";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "meta" });
  const faq = await getTranslations({ locale, namespace: "landing.faq" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Kolabo",
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description: t("description"),
        areaServed: ["RS", "HR", "BA", "ME", "MK", "SI"],
      },
      {
        "@type": "WebSite",
        name: "Kolabo",
        url: SITE_URL,
        inLanguage: locale === "sr" ? "sr-Latn" : "en",
      },
      {
        "@type": "FAQPage",
        mainEntity: (["q1", "q2", "q3", "q4", "q5", "q6"] as const).map((q) => ({
          "@type": "Question",
          name: faq(q),
          acceptedAnswer: {
            "@type": "Answer",
            text: faq(q.replace("q", "a") as "a1"),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <CategoriesMarquee />
        <Networks />
        <ForBrands />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
