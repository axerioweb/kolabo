"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { toggleSaved } from "@/app/actions/community";
import { cn } from "@/lib/utils";

/** Heart toggle for the company shortlist (optimistic). */
export function SaveButton({
  influencerId,
  saved,
  variant = "icon",
}: {
  influencerId: string;
  saved: boolean;
  variant?: "icon" | "button";
}) {
  const t = useTranslations("creators");
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(saved);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      setOptimistic(!optimistic);
      await toggleSaved(influencerId, !optimistic);
    });
  };

  const labelText = optimistic ? t("unsave") : t("save");

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={optimistic}
        disabled={pending}
        className={cn(
          "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold transition-all duration-200",
          optimistic
            ? "border-accent-400 bg-pink-50 text-accent-600"
            : "border-line bg-surface text-ink shadow-soft hover:border-brand-300 hover:text-brand-700"
        )}
      >
        <Heart className={cn("h-4 w-4", optimistic && "fill-current")} />
        {optimistic ? t("savedLabel") : t("save")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={optimistic}
      aria-label={labelText}
      title={labelText}
      className={cn(
        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white/90 backdrop-blur transition-all duration-150",
        optimistic
          ? "border-accent-400 text-accent-500"
          : "border-line text-muted hover:border-accent-400 hover:text-accent-500"
      )}
    >
      <Heart className={cn("h-4.5 w-4.5", optimistic && "fill-current")} />
    </button>
  );
}
