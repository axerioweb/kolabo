import { cn } from "@/lib/utils";

/**
 * Kolabo logo — two overlapping speech bubbles forming a "K" negative
 * space, symbolizing the creator↔brand conversation.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={cn("h-9 w-9", className)}
    >
      <defs>
        <linearGradient id="kolabo-g" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="60%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="12" fill="url(#kolabo-g)" />
      <path
        d="M13 11v18M13 20l9-9M14.5 21.5 24 29"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28.5" cy="13" r="2.6" fill="white" opacity="0.9" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight text-ink">
        kolabo
      </span>
    </span>
  );
}
