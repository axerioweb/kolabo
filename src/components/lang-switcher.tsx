"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LangSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchTo(next: string) {
    if (next === locale) return;
    router.replace(
      // @ts-expect-error — pathname + params are always compatible
      { pathname, params },
      { locale: next }
    );
  }

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-line bg-surface p-0.5 text-xs font-bold",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          className={cn(
            "cursor-pointer rounded-full px-2.5 py-1 uppercase transition-colors",
            l === locale
              ? "bg-ink text-white"
              : "text-muted hover:text-ink"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
