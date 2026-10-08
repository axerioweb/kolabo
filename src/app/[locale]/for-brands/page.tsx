import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Filter,
  Gift,
  Lock,
  MessageCircle,
  Search,
  Send,
  Star,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, label } from "@/lib/taxonomy";
import { SITE_URL } from "@/lib/site";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { publicMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forBrands" });
  return publicMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    sr: "/za-brendove",
    en: "/en/for-brands",
  });
}

const FAQ = ["q1", "q2", "q3", "q4"] as const;

export default async function ForBrandsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "forBrands" });

  const features = [
    { Icon: Filter, key: "filters" },
    { Icon: FileText, key: "brief" },
    { Icon: MessageCircle, key: "chat" },
    { Icon: Lock, key: "privacy" },
    { Icon: Gift, key: "barter" },
    { Icon: Star, key: "reviews" },
  ] as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}${locale === "sr" ? "/za-brendove" : "/en/for-brands"}`,
    mainEntity: FAQ.map((q) => ({
      "@type": "Question",
      name: t(`faq.${q}`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.${q.replace("q", "a")}`) },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-hero-glow pt-32 pb-20 sm:pt-40">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <div className="animate-fade-up">
              <Badge tone="brand" className="mb-6">
                <BadgeCheck className="h-3.5 w-3.5" />
                {t("badge")}
              </Badge>
              <h1 className="font-display text-4xl leading-[1.1] font-bold tracking-tight sm:text-6xl">
                {t("title1")} <span className="text-gradient">{t("title2")}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("subtitle")}</p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={{ pathname: "/signup", query: { tip: "brend" } }}>
                    {t("ctaPrimary")}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/creators">
                    <Search className="h-5 w-5" />
                    {t("ctaSecondary")}
                  </Link>
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted">{t("note")}</p>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("stepsTitle")}</h2>
          </Reveal>
          <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { Icon: Search, n: 1 },
              { Icon: Send, n: 2 },
              { Icon: BadgeCheck, n: 3 },
            ].map(({ Icon, n }) => (
              <StaggerItem key={n}>
                <div className="card h-full p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lift">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-5 text-xs font-bold tracking-wider text-brand-600 uppercase">
                    {t("stepLabel", { n })}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold">{t(`step${n}Title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(`step${n}Text`)}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* Features */}
        <section className="bg-surface-soft py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("featuresTitle")}</h2>
              <p className="mt-3 text-ink-soft">{t("featuresSubtitle")}</p>
            </Reveal>
            <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ Icon, key }) => (
                <StaggerItem key={key}>
                  <div className="card h-full p-6">
                    <Icon className="h-6 w-6 text-brand-600" />
                    <h3 className="mt-4 font-display font-bold">{t(`features.${key}.title`)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t(`features.${key}.text`)}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("categoriesTitle")}</h2>
          </Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={{ pathname: "/creators/category/[slug]", params: { slug: c.slug } }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-soft shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
              >
                <span aria-hidden>{c.emoji}</span>
                {label(c.label, locale)}
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight">{t("faqTitle")}</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((q) => (
              <details key={q} className="card group overflow-hidden !shadow-none">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {t(`faq.${q}`)}
                  <ArrowRight className="h-4 w-4 shrink-0 text-brand-500 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{t(`faq.${q.replace("q", "a")}`)}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 px-8 py-16 text-center text-white shadow-lift">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("finalTitle")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">{t("finalText")}</p>
            <Button asChild size="lg" className="mt-8 !bg-white !bg-none !text-brand-700 hover:!bg-brand-50">
              <Link href={{ pathname: "/signup", query: { tip: "brend" } }}>
                {t("ctaPrimary")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
