import { ArrowRight, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion";

export function ForBrands() {
  const t = useTranslations("landing.forBrands");

  return (
    <section id="za-brendove" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Reveal>
        <div className="card flex flex-col items-center gap-6 border-dashed !border-brand-200 bg-brand-50/50 p-8 text-center sm:flex-row sm:text-left">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft">
            <Building2 className="h-7 w-7" />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">{t("title")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {t("subtitle")}
            </p>
          </div>
          <Button asChild variant="secondary">
            <a href="mailto:hello@kolabo.rs">{t("cta")}</a>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

export function FinalCta() {
  const t = useTranslations("landing.cta");

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 px-8 py-16 text-center text-white shadow-lift">
          {/* Decorative sparkle SVGs */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="animate-float-slow absolute top-8 left-10 h-8 w-8 fill-white/30"
          >
            <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
          </svg>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="animate-float-slower absolute right-12 bottom-10 h-12 w-12 fill-white/20"
          >
            <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
          </svg>
          <div
            aria-hidden
            className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
          />

          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/85">
            {t("subtitle")}
          </p>
          <div className="relative mt-8">
            <Button
              asChild
              size="lg"
              className="!bg-white !bg-none !text-brand-700 hover:!bg-brand-50"
            >
              <Link href="/signup">
                {t("button")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
