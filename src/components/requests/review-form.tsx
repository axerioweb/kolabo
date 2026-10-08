"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createReview } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function ReviewForm({ requestId, otherName }: { requestId: string; otherName: string }) {
  const t = useTranslations("review");
  const tc = useTranslations("common");
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return setError(t("pickRating"));
        setError(null);
        startTransition(async () => {
          const res = await createReview(requestId, rating, comment);
          if (!res.ok) {
            setError(res.error === "already_reviewed" ? t("already") : tc("error"));
            return;
          }
          router.refresh();
        });
      }}
    >
      <p className="font-display font-bold">{t("title", { name: otherName })}</p>
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-label={t("ratingLabel")}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={t("stars", { count: n })}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="cursor-pointer rounded-md p-0.5 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-line"
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        placeholder={t("placeholder")}
        aria-label={t("commentLabel")}
      />
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? tc("loading") : t("submit")}
      </Button>
    </form>
  );
}
