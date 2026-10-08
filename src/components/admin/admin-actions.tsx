"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Ban, MailQuestion, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { requestCompanyInfo, resolveReport, setSuspended, setVerified } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import type { ProfileStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Verify / suspend controls for one profile row. */
export function ProfileModeration({
  profileId,
  verified,
  status,
}: {
  profileId: string;
  verified: boolean;
  status: ProfileStatus;
}) {
  const t = useTranslations("admin.actions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isVerified, setIsVerified] = useState(verified);
  const [isSuspended, setIsSuspended] = useState(status === "suspended");

  const btn =
    "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        disabled={pending}
        aria-pressed={isVerified}
        onClick={() =>
          startTransition(async () => {
            const next = !isVerified;
            setIsVerified(next);
            const res = await setVerified(profileId, next);
            if (!res.ok) setIsVerified(!next);
            else router.refresh();
          })
        }
        className={cn(
          btn,
          isVerified
            ? "border-brand-300 bg-brand-50 text-brand-700"
            : "border-line text-ink-soft hover:border-brand-300 hover:text-brand-700"
        )}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        {isVerified ? t("verified") : t("verify")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const next = !isSuspended;
          if (next && !window.confirm(t("suspendConfirm"))) return;
          startTransition(async () => {
            setIsSuspended(next);
            const res = await setSuspended(profileId, next);
            if (!res.ok) setIsSuspended(!next);
            else router.refresh();
          });
        }}
        className={cn(
          btn,
          isSuspended
            ? "border-line text-ink-soft hover:border-emerald-300 hover:text-emerald-700"
            : "border-line text-ink-soft hover:border-red-300 hover:text-red-600"
        )}
      >
        {isSuspended ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
        {isSuspended ? t("restore") : t("suspend")}
      </button>
    </div>
  );
}

/** Ask a company to complete its verification details. */
export function CompanyInfoRequest({ profileId }: { profileId: string }) {
  const t = useTranslations("admin.companyActions");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return <p className="text-xs font-semibold text-emerald-700">{t("sent")}</p>;
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-amber-300 hover:text-amber-700"
      >
        <MailQuestion className="h-3.5 w-3.5" />
        {t("needInfo")}
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("needInfoPrompt")}
        aria-label={t("needInfo")}
        maxLength={500}
        className="min-h-16 text-xs"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending || !note.trim()}
          onClick={() =>
            startTransition(async () => {
              const res = await requestCompanyInfo(profileId, note);
              if (res.ok) setSent(true);
            })
          }
        >
          {pending ? tc("loading") : t("needInfo")}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          {tc("cancel")}
        </Button>
      </div>
    </div>
  );
}

/** Resolve / dismiss an abuse report with an internal note. */
export function ReportResolution({ reportId }: { reportId: string }) {
  const t = useTranslations("admin.reports");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (status: "resolved" | "dismissed") =>
    startTransition(async () => {
      const res = await resolveReport(reportId, status, note);
      if (res.ok) router.refresh();
    });

  return (
    <div className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("notePlaceholder")}
        aria-label={t("note")}
        className="min-h-16 text-xs"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => run("resolved")}>
          {t("resolve")}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run("dismissed")}>
          {t("dismiss")}
        </Button>
      </div>
    </div>
  );
}
