import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "brand",
  children,
}: {
  className?: string;
  tone?: "brand" | "accent" | "neutral" | "success" | "warning";
  children: React.ReactNode;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    accent: "bg-pink-50 text-accent-600 border-pink-200",
    neutral: "bg-surface-soft text-ink-soft border-line",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
