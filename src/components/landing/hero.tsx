"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Heart, Sparkles, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialIcon } from "@/components/social-icons";

const ease = [0.22, 1, 0.36, 1] as const;

function FloatingCard({
  className,
  delay,
  children,
}: {
  className?: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const t = useTranslations("landing.hero");
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden bg-hero-glow pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Decorative SVG grid + blobs */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
      >
        <defs>
          <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0v48" fill="none" stroke="#7C3AED" strokeOpacity="0.08" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-float-slower pointer-events-none absolute top-32 -right-24 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            <Badge tone="brand" className="mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              {t("badge")}
            </Badge>
          </motion.div>

          <motion.h1
            className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
          >
            {t("title1")}
            <br />
            <span className="text-gradient">{t("title2")}</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft lg:mx-0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease }}
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease }}
          >
            <Button asChild size="lg">
              <Link href="/signup">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/for-brands">{t("ctaSecondary")}</Link>
            </Button>
          </motion.div>

          <motion.p
            className="mt-6 flex items-center justify-center gap-2 text-sm text-muted lg:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            {t("noFollowersMin")} · {t("socialProof")}
          </motion.p>
        </div>

        {/* Visual — mock profile card with floating stat chips */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <FloatingCard delay={0.2} className="card relative z-10 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 font-display text-xl font-bold text-white">
                MJ
              </div>
              <div>
                <p className="font-display font-bold">Milica Jovanović</p>
                <p className="text-sm text-muted">@milica.style · Beograd</p>
              </div>
              <BadgeCheck className="ml-auto h-6 w-6 text-brand-500" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="neutral">👗 {locale === "en" ? "Fashion" : "Moda"}</Badge>
              <Badge tone="neutral">💄 {locale === "en" ? "Beauty" : "Lepota"}</Badge>
              <Badge tone="neutral">🌿 Lifestyle</Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-surface-soft p-4 text-center">
              <div>
                <p className="font-display text-lg font-bold">25–50k</p>
                <p className="text-xs text-muted">
                  {locale === "en" ? "followers" : "pratilaca"}
                </p>
              </div>
              <div>
                <p className="font-display text-lg font-bold text-brand-600">4.2%</p>
                <p className="text-xs text-muted">engagement</p>
              </div>
              <div>
                <p className="font-display text-lg font-bold">80–150€</p>
                <p className="text-xs text-muted">
                  {locale === "en" ? "per post" : "po objavi"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 text-muted">
              <SocialIcon platform="instagram" />
              <SocialIcon platform="tiktok" />
              <SocialIcon platform="youtube" />
              <span className="ml-auto">
                <Badge tone="success">
                  {locale === "en" ? "Open to collabs" : "Otvorena za saradnje"}
                </Badge>
              </span>
            </div>
          </FloatingCard>

          <FloatingCard
            delay={0.5}
            className="animate-float-slow absolute -top-8 -right-4 z-20 hidden sm:block"
          >
            <div className="card flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
              </span>
              <div className="text-sm">
                <p className="font-bold">+3 {locale === "en" ? "inquiries" : "upita"}</p>
                <p className="text-xs text-muted">
                  {locale === "en" ? "this week" : "ove nedelje"}
                </p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            delay={0.65}
            className="animate-float-slower absolute -bottom-6 -left-6 z-20 hidden sm:block"
          >
            <div className="card flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100">
                <Heart className="h-4.5 w-4.5 text-accent-500" />
              </span>
              <div className="text-sm">
                <p className="font-bold">
                  {locale === "en" ? "New collab" : "Nova saradnja"} 🎉
                </p>
                <p className="text-xs text-muted">
                  {locale === "en" ? "Beauty brand · barter + fee" : "Beauty brend · barter + honorar"}
                </p>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}
