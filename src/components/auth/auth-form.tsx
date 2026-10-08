"use client";

import { useState } from "react";
import { Building2, Eye, EyeOff, Info, MailCheck, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type AccountType = "influencer" | "company";

/** Maps Supabase auth errors to friendly, translated messages. */
function authErrorKey(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "emailTaken";
  if (m.includes("rate limit") || m.includes("too many")) return "rateLimited";
  if (m.includes("password")) return "weakPassword";
  if (m.includes("email not confirmed")) return "emailNotConfirmed";
  return "genericError";
}

export function AuthForm({
  mode,
  next,
  initialType = "influencer",
  error: initialError,
}: {
  mode: "login" | "signup";
  next?: string;
  initialType?: AccountType;
  error?: string;
}) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "suspended"
      ? t("suspended")
      : initialError === "auth"
        ? t("linkExpired")
        : null
  );
  const [emailSent, setEmailSent] = useState(false);

  const isSignup = mode === "signup";
  const isCompany = accountType === "company";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (isSignup && !acceptTerms) {
      setError(t("mustAcceptTerms"));
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (isSignup) {
      const onboardingPath = getPathname({ locale, href: "/onboarding" });
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            account_type: accountType,
            company_name: isCompany ? companyName.trim() : undefined,
            accept_terms: "true",
            marketing_opt_in: marketing ? "true" : "false",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(onboardingPath)}`,
        },
      });
      setLoading(false);
      if (error) return setError(t(authErrorKey(error.message)));
      if (data.session) {
        router.push("/onboarding");
        router.refresh();
        return;
      }
      setEmailSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (error) {
        const key = authErrorKey(error.message);
        return setError(t(key === "emailNotConfirmed" ? key : "invalidCredentials"));
      }
      const target = safeNext(next, "");
      if (target) {
        window.location.assign(target);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
  }

  if (emailSent) {
    return (
      <div className="card p-8 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-brand-500" />
        <p className="mt-4 font-display text-lg font-bold">{t("checkEmailTitle")}</p>
        <p className="mt-2 text-sm text-muted">{t("checkEmail", { email })}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {isSignup ? t("signupTitle") : t("loginTitle")}
      </h1>
      <p className="mt-2 text-muted">
        {isSignup ? t("signupSubtitle") : t("loginSubtitle")}
      </p>

      {!isSupabaseConfigured && (
        <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {t("demoDisabled")}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate={false}>
        {isSignup && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t("accountType")}</legend>
            <div className="grid grid-cols-2 gap-3" role="radiogroup">
              {(
                [
                  { type: "influencer", Icon: Sparkles, title: t("typeCreator"), text: t("typeCreatorHint") },
                  { type: "company", Icon: Building2, title: t("typeBrand"), text: t("typeBrandHint") },
                ] as const
              ).map(({ type, Icon, title, text }) => {
                const active = accountType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setAccountType(type)}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-1.5 rounded-2xl border-2 p-4 text-left transition-all duration-150",
                      active
                        ? "border-brand-500 bg-brand-50/70 shadow-soft"
                        : "border-line bg-surface hover:border-brand-200"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-muted")} />
                    <span className="text-sm font-bold">{title}</span>
                    <span className="text-xs leading-snug text-muted">{text}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {isSignup && (
          <Field label={isCompany ? t("contactPerson") : t("fullName")}>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={100}
              autoComplete="name"
            />
          </Field>
        )}
        {isSignup && isCompany && (
          <Field label={t("companyName")}>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              maxLength={120}
              autoComplete="organization"
            />
          </Field>
        )}
        <Field label={t("email")}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
          />
        </Field>
        <Field label={t("password")} hint={isSignup ? t("passwordHint") : undefined}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-1 flex w-10 cursor-pointer items-center justify-center text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {!isSignup && (
          <div className="-mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
        )}

        {isSignup && (
          <div className="space-y-3 rounded-xl bg-surface-soft p-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
              />
              <span className="leading-relaxed text-ink-soft">
                {t.rich("consentTerms", {
                  terms: (chunks) => (
                    <Link href="/terms" className="font-semibold text-brand-600 hover:underline" target="_blank">
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link href="/privacy" className="font-semibold text-brand-600 hover:underline" target="_blank">
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
              />
              <span className="leading-relaxed text-ink-soft">
                {t("consentMarketing")}{" "}
                <span className="text-muted">({tc("optional")})</span>
              </span>
            </label>
          </div>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !isSupabaseConfigured}
        >
          {loading
            ? tc("loading")
            : isSignup
              ? isCompany
                ? t("signupButtonBrand")
                : t("signupButton")
              : t("loginButton")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {isSignup ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-brand-600 hover:underline"
        >
          {isSignup ? t("loginLink") : t("signupLink")}
        </Link>
      </p>
    </div>
  );
}
