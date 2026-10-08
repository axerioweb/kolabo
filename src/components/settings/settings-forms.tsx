"use client";

import { useState, useTransition } from "react";
import { Download, KeyRound, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteAccount, updateMarketingConsent } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input, Toggle } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

export function PasswordForm() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setState(null);
        if (password.length < 8) return setState({ tone: "error", text: t("passwordShort") });
        if (password !== confirm) return setState({ tone: "error", text: t("passwordMismatch") });
        if (!isSupabaseConfigured) return setState({ tone: "success", text: t("passwordChanged") });
        startTransition(async () => {
          const { error } = await createClient().auth.updateUser({ password });
          if (error) return setState({ tone: "error", text: tc("error") });
          setPassword("");
          setConfirm("");
          setState({ tone: "success", text: t("passwordChanged") });
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("newPassword")}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
          />
        </Field>
        <Field label={t("confirmPassword")}>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
          />
        </Field>
      </div>
      {state && <Alert tone={state.tone}>{state.text}</Alert>}
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        <KeyRound className="h-4 w-4" />
        {pending ? tc("saving") : t("changePassword")}
      </Button>
    </form>
  );
}

export function MarketingToggle({ initial }: { initial: boolean }) {
  const t = useTranslations("settings");
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();
  return (
    <Toggle
      checked={value}
      label={t("marketing")}
      onChange={(v) => {
        setValue(v);
        startTransition(async () => {
          const res = await updateMarketingConsent(v);
          if (!res.ok) setValue(!v);
        });
      }}
    />
  );
}

export function ExportButton() {
  const t = useTranslations("settings");
  return (
    <Button asChild variant="secondary" size="sm">
      <a href="/api/export" download>
        <Download className="h-4 w-4" />
        {t("export")}
      </a>
    </Button>
  );
}

export function DeleteAccount() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const keyword = t("deleteKeyword");

  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        {t("deleteAccount")}
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-red-200 bg-red-50/60 p-4">
      <p className="text-sm text-red-800">{t("deleteWarning")}</p>
      <Field label={t("deleteConfirmLabel", { keyword })}>
        <Input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      </Field>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          size="sm"
          disabled={pending || text.trim().toUpperCase() !== keyword.toUpperCase()}
          onClick={() =>
            startTransition(async () => {
              const res = await deleteAccount(text);
              if (!res.ok) {
                setError(t.has(`deleteErrors.${res.error}`) ? t(`deleteErrors.${res.error}`) : tc("error"));
                return;
              }
              window.location.assign("/");
            })
          }
        >
          {pending ? tc("loading") : t("deleteConfirm")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {tc("cancel")}
        </Button>
      </div>
    </div>
  );
}
