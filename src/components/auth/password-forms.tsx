"use client";

import { useState } from "react";
import { KeyRound, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

/** Step 1 — request a reset link (never reveals whether the email exists). */
export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);
    const next = getPathname({ locale, href: "/reset-password" });
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    });
    setLoading(false);
    if (error && /rate limit|too many/i.test(error.message)) {
      setError(t("rateLimited"));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-brand-500" />
        <p className="mt-4 font-display text-lg font-bold">{t("checkEmailTitle")}</p>
        <p className="mt-2 text-sm text-muted">{t("resetSent")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">{t("forgotTitle")}</h1>
      <p className="mt-2 text-muted">{t("forgotSubtitle")}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label={t("email")}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" className="w-full" disabled={loading || !isSupabaseConfigured}>
          {loading ? tc("loading") : t("sendResetLink")}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}

/** Step 2 — user arrives from the email link with a recovery session. */
export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (password.length < 8) return setError(t("weakPassword"));
    if (password !== confirm) return setError(t("passwordsDontMatch"));
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(/session/i.test(error.message) ? t("linkExpired") : t("weakPassword"));
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <KeyRound className="mx-auto h-12 w-12 text-brand-500" />
        <p className="mt-4 font-display text-lg font-bold">{t("passwordChanged")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">{t("resetTitle")}</h1>
      <p className="mt-2 text-muted">{t("resetSubtitle")}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label={t("newPassword")} hint={t("passwordHint")}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Field label={t("confirmPassword")}>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" className="w-full" disabled={loading || !isSupabaseConfigured}>
          {loading ? tc("saving") : t("savePassword")}
        </Button>
      </form>
    </div>
  );
}
