"use client";

import { useState } from "react";
import { Info, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (data.session) return router.push("/onboarding");
      setEmailSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) return setError(t("invalidCredentials"));
      router.push("/dashboard");
      router.refresh();
    }
  }

  if (emailSent) {
    return (
      <div className="card p-8 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-brand-500" />
        <p className="mt-4 font-semibold">{t("checkEmail")}</p>
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

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {isSignup && (
          <Field label={t("fullName")}>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
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
          />
        </Field>
        <Field
          label={t("password")}
          hint={isSignup ? t("passwordHint") : undefined}
        >
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !isSupabaseConfigured}
        >
          {loading
            ? tc("loading")
            : isSignup
              ? t("signupButton")
              : t("loginButton")}
        </Button>
      </form>

      {isSignup && <p className="mt-4 text-xs text-muted">{t("terms")}</p>}

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
