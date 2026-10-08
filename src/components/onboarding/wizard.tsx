"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ExternalLink, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { normalizeUsername, usernameError } from "@/lib/validation";
import { saveOnboarding } from "@/app/actions/onboarding";
import {
  emptyOnboardingData,
  type OnboardingData,
} from "@/lib/onboarding-types";
import {
  BasicsStep,
  SocialsStep,
  CategoriesStep,
  PricingStep,
  ContactStep,
} from "./steps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEP_KEYS = [
  "basics",
  "socials",
  "categories",
  "pricing",
  "contact",
] as const;

export function OnboardingWizard({
  initialData,
  mode = "onboarding",
}: {
  initialData?: Partial<OnboardingData>;
  mode?: "onboarding" | "edit";
}) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<OnboardingData>({
    ...emptyOnboardingData,
    ...initialData,
  });

  const update = (patch: Partial<OnboardingData>) =>
    setData((d) => ({ ...d, ...patch }));

  const total = STEP_KEYS.length;
  const isLast = step === total - 1;

  const canContinue =
    step === 1 ? data.socials.length > 0 && data.socials.every((s) => s.handle.trim() !== "") : true;

  function errorText(code?: string) {
    const key = `errors.${code}`;
    return code && t.has(key) ? t(key) : tc("error");
  }

  function goNext() {
    setError(null);
    if (step === 0 && data.basics.username.trim()) {
      const err = usernameError(data.basics.username);
      if (err) {
        setError(errorText(`username_${err}`));
        return;
      }
    }
    if (isLast && !normalizeUsername(data.basics.username)) {
      setError(errorText("username_required"));
      return;
    }
    startTransition(async () => {
      const result = await saveOnboarding(data, isLast);
      if (!result.ok) {
        setError(errorText(result.error));
        return;
      }
      if (isLast) {
        setDone(true);
      } else {
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }
    });
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card mx-auto max-w-lg p-10 text-center"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lift">
          <PartyPopper className="h-8 w-8" />
        </span>
        <h2 className="mt-6 font-display text-2xl font-bold">
          {mode === "edit" ? t("done.savedTitle") : t("done.title")}
        </h2>
        <p className="mt-3 text-muted">
          {mode === "edit" ? t("done.savedSubtitle") : t("done.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/dashboard")}>
            {t("done.cta")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          {normalizeUsername(data.basics.username) && (
            <Button asChild variant="secondary">
              <Link
                href={{
                  pathname: "/creators/[username]",
                  params: { username: normalizeUsername(data.basics.username) },
                }}
              >
                <ExternalLink className="h-4 w-4" />
                {t("done.viewPublic")}
              </Link>
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  const stepKey = STEP_KEYS[step];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-10">
        <p className="mb-4 text-sm font-semibold text-muted">
          {t("stepOf", { current: step + 1, total })}
        </p>
        <div className="flex items-center gap-2">
          {STEP_KEYS.map((key, i) => (
            <div key={key} className="flex flex-1 flex-col gap-2">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  i < step
                    ? "bg-brand-500"
                    : i === step
                      ? "bg-gradient-to-r from-brand-500 to-accent-500"
                      : "bg-line"
                )}
              />
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:block",
                  i === step ? "text-brand-700" : "text-muted"
                )}
              >
                {i < step && (
                  <Check className="mr-1 inline h-3 w-3 text-brand-500" />
                )}
                {t(`steps.${key}`)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepKey}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {t(`${stepKey === "categories" ? "categoriesStep" : stepKey}.title`)}
          </h1>
          <p className="mt-2 mb-8 text-muted">
            {t(
              `${stepKey === "categories" ? "categoriesStep" : stepKey}.subtitle`,
              stepKey === "categories" ? { max: 5 } : undefined
            )}
          </p>

          {stepKey === "basics" && <BasicsStep data={data} update={update} />}
          {stepKey === "socials" && <SocialsStep data={data} update={update} />}
          {stepKey === "categories" && (
            <CategoriesStep data={data} update={update} />
          )}
          {stepKey === "pricing" && <PricingStep data={data} update={update} />}
          {stepKey === "contact" && <ContactStep data={data} update={update} />}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || pending}
        >
          <ArrowLeft className="h-4 w-4" />
          {tc("back")}
        </Button>
        <Button onClick={goNext} disabled={pending || !canContinue}>
          {pending ? tc("saving") : isLast ? tc("finish") : tc("next")}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
