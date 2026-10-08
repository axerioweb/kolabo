"use client";

import { useRef, useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createReport } from "@/app/actions/community";
import { REPORT_REASONS, REPORT_REASON_LABELS, label, type ReportReason } from "@/lib/taxonomy";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/** Native <dialog> — focus trap, Escape and backdrop come for free. */
export function ReportDialog({
  targetId,
  requestId,
  className,
}: {
  targetId: string;
  requestId?: string;
  className?: string;
}) {
  const t = useTranslations("report");
  const tc = useTranslations("common");
  const locale = useLocale();
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [pending, startTransition] = useTransition();

  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setState("idle");
          ref.current?.showModal();
        }}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted hover:text-red-600",
          className
        )}
      >
        <Flag className="h-3.5 w-3.5" />
        {t("open")}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[var(--radius-card)] border border-line p-0 shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-lg font-bold">{t("title")}</h2>
            <button
              type="button"
              onClick={close}
              aria-label={tc("close")}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-soft"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {state === "sent" ? (
            <div className="mt-4 space-y-4">
              <Alert tone="success">{t("sent")}</Alert>
              <Button className="w-full" variant="secondary" onClick={close}>
                {tc("close")}
              </Button>
            </div>
          ) : (
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const res = await createReport(targetId, reason, details, requestId);
                  setState(res.ok ? "sent" : "error");
                });
              }}
            >
              <p className="text-sm text-muted">{t("subtitle")}</p>
              <Field label={t("reason")}>
                <Select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {label(REPORT_REASON_LABELS[r], locale)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("details")} optional={tc("optional")}>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={1000}
                  placeholder={t("detailsPlaceholder")}
                />
              </Field>
              {state === "error" && <Alert tone="error">{tc("error")}</Alert>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={close}>
                  {tc("cancel")}
                </Button>
                <Button type="submit" variant="danger" disabled={pending}>
                  {pending ? tc("loading") : t("submit")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
