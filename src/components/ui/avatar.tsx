import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn, initials } from "@/lib/utils";

/** Profile picture with gradient-initials fallback. */
export function Avatar({
  src,
  name,
  size = 48,
  company,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  /** Square-ish logo style + building icon fallback for companies. */
  company?: boolean;
  className?: string;
}) {
  const radius = company ? "rounded-xl" : "rounded-full";
  // next/image throws for hosts outside remotePatterns — never let a bad
  // URL (DB constraint should prevent it) take the whole page down.
  const safe = !!src && /^https:\/\/[a-z0-9-]+\.supabase\.co\//.test(src);
  if (src && safe) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 object-cover", radius, className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-gradient-to-br font-display font-bold text-white",
        company ? "from-ink-soft to-brand-700" : "from-brand-500 to-accent-500",
        radius,
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.36) }}
    >
      {company && !name ? <Building2 className="h-1/2 w-1/2" /> : initials(name) || "?"}
    </span>
  );
}
