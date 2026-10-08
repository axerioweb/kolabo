"use client";

import { useState, useTransition } from "react";
import { Check, CornerUpLeft, PackageCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setRequestStatus } from "@/app/actions/requests";
import type { RequestStatus } from "@/lib/taxonomy";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

type ActionKey = "accept" | "decline" | "cancel" | "deliver" | "complete" | "revision";

const TARGET: Record<ActionKey, RequestStatus> = {
  accept: "accepted",
  decline: "declined",
  cancel: "cancelled",
  deliver: "delivered",
  complete: "completed",
  revision: "accepted",
};

/** Buttons for the allowed status transitions (mirrors the DB trigger). */
export function RequestActions({
  requestId,
  status,
  viewer,
}: {
  requestId: string;
  status: RequestStatus;
  viewer: "influencer" | "company";
}) {
  const t = useTranslations("requestActions");
  const tc = useTranslations("common");
  const router = useRouter();
  const [confirming, setConfirming] = useState<ActionKey | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const available: ActionKey[] =
    viewer === "influencer"
      ? status === "pending"
        ? ["accept", "decline"]
        : status === "accepted"
          ? ["deliver", "cancel"]
          : []
      : status === "pending"
        ? ["cancel"]
        : status === "accepted"
          ? ["cancel"]
          : status === "delivered"
            ? ["complete", "revision"]
            : [];

  if (available.length === 0) return null;

  function run(action: ActionKey) {
    setError(null);
    startTransition(async () => {
      const res = await setRequestStatus(requestId, TARGET[action], action === "decline" ? reason : undefined);
      if (!res.ok) {
        setError(t.has(`errors.${res.error}`) ? t(`errors.${res.error}`) : tc("error"));
        return;
      }
      setConfirming(null);
      router.refresh();
    });
  }

  const icon: Record<ActionKey, React.ReactNode> = {
    accept: <Check className="h-4 w-4" />,
    decline: <X className="h-4 w-4" />,
    cancel: <X className="h-4 w-4" />,
    deliver: <PackageCheck className="h-4 w-4" />,
    complete: <Check className="h-4 w-4" />,
    revision: <CornerUpLeft className="h-4 w-4" />,
  };
  const primary: ActionKey[] = ["accept", "deliver", "complete"];

  if (confirming) {
    return (
      <div className="space-y-3 rounded-xl border border-line bg-surface-soft p-4">
        <p className="text-sm font-semibold">{t(`confirm.${confirming}`)}</p>
        {confirming === "decline" && (
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder={t("declineReasonPlaceholder")}
            aria-label={t("declineReason")}
          />
        )}
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={["decline", "cancel"].includes(confirming) ? "danger" : "primary"}
            disabled={pending}
            onClick={() => run(confirming)}
          >
            {pending ? tc("loading") : t(`do.${confirming}`)}
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(null)}>
            {tc("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {available.map((a) => (
          <Button
            key={a}
            size="sm"
            variant={primary.includes(a) ? "primary" : "secondary"}
            onClick={() => (a === "accept" ? run(a) : setConfirming(a))}
            disabled={pending}
            className={primary.includes(a) ? "flex-1 sm:flex-none" : undefined}
          >
            {icon[a]}
            {pending && a === "accept" ? tc("loading") : t(`do.${a}`)}
          </Button>
        ))}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
