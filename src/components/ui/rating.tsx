import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating (1–5). */
export function Stars({
  value,
  className,
  size = "h-4 w-4",
}: {
  value: number;
  className?: string;
  size?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(size, i <= rounded ? "fill-amber-400 text-amber-400" : "text-line")}
        />
      ))}
    </span>
  );
}
