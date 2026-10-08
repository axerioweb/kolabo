import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Server-rendered pagination for the creator directory. */
export function Pagination({
  page,
  pages,
  query,
}: {
  page: number;
  pages: number;
  query: Record<string, string>;
}) {
  const t = useTranslations("creators");
  if (pages <= 1) return null;

  const href = (p: number) => ({
    pathname: "/creators" as const,
    query: { ...query, ...(p > 1 ? { page: String(p) } : {}) },
  });

  // 1 … p-1 p p+1 … last
  const nums = new Set<number>([1, pages, page - 1, page, page + 1]);
  const list = [...nums].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  const item =
    "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors";

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label={t("pagination")}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "text-ink-soft hover:bg-brand-50")} aria-label={t("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(item, "text-line")} aria-hidden>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      {list.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - list[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              item,
              n === page ? "bg-ink text-white" : "text-ink-soft hover:bg-brand-50"
            )}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={href(page + 1)} className={cn(item, "text-ink-soft hover:bg-brand-50")} aria-label={t("next")}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(item, "text-line")} aria-hidden>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
