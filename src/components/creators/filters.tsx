"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { CreatorFilters } from "@/lib/queries";
import { activeFilterCount, filtersToQuery } from "@/lib/creator-filters";
import {
  AGE_RANGES,
  AGE_RANGE_LABELS,
  AUDIENCE_GENDERS,
  AUDIENCE_GENDER_LABELS,
  CATEGORIES,
  CONTENT_LANGUAGES,
  COUNTRIES,
  COUNTRY_LABELS,
  FOLLOWER_RANGES,
  FOLLOWER_RANGE_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
  label,
} from "@/lib/taxonomy";
import { Field, Input, Select, Toggle } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Filter panel for the creator directory. Every change updates the URL
 * (shareable, back-button friendly); the server page re-renders results.
 */
export function CreatorFiltersPanel({
  filters,
  children,
}: {
  filters: CreatorFilters;
  children: React.ReactNode;
}) {
  const t = useTranslations("creators.filters");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(filters.q ?? "");
  const [city, setCity] = useState(filters.city ?? "");

  const apply = (patch: Partial<CreatorFilters>) => {
    const next = { ...filters, ...patch, page: 1 };
    startTransition(() => {
      router.replace({ pathname: "/creators", query: filtersToQuery(next) }, { scroll: false });
    });
  };

  // Debounced text inputs
  useEffect(() => {
    if ((filters.q ?? "") === q) return;
    const id = setTimeout(() => apply({ q: q.trim() || undefined }), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useEffect(() => {
    if ((filters.city ?? "") === city) return;
    const id = setTimeout(() => apply({ city: city.trim() || undefined }), 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const count = activeFilterCount(filters);

  const panel = (
    <div className="space-y-5">
      <Field label={t("category")}>
        <Select
          value={filters.category ?? ""}
          onChange={(e) => apply({ category: e.target.value || undefined })}
        >
          <option value="">{t("any")}</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.emoji} {label(c.label, locale)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("platform")}>
        <Select
          value={filters.platform ?? ""}
          onChange={(e) => apply({ platform: (e.target.value || undefined) as CreatorFilters["platform"] })}
        >
          <option value="">{t("any")}</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("minFollowers")}>
        <Select
          value={filters.minFollowers ?? ""}
          onChange={(e) =>
            apply({ minFollowers: (e.target.value || undefined) as CreatorFilters["minFollowers"] })
          }
        >
          <option value="">{t("any")}</option>
          {FOLLOWER_RANGES.map((r) => (
            <option key={r} value={r}>
              {FOLLOWER_RANGE_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("maxPrice")} hint={t("maxPriceHint")}>
        <Input
          type="number"
          min={0}
          step={10}
          inputMode="numeric"
          defaultValue={filters.maxPrice ?? ""}
          placeholder="200"
          onBlur={(e) => {
            const v = Number(e.target.value);
            apply({ maxPrice: v > 0 ? Math.round(v) : undefined });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <Field label={t("country")}>
          <Select
            value={filters.country ?? ""}
            onChange={(e) => apply({ country: (e.target.value || undefined) as CreatorFilters["country"] })}
          >
            <option value="">{t("any")}</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {label(COUNTRY_LABELS[c], locale)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("city")}>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={locale === "en" ? "Belgrade" : "Beograd"}
          />
        </Field>
      </div>
      <Field label={t("audienceGender")}>
        <Select
          value={filters.audienceGender ?? ""}
          onChange={(e) =>
            apply({ audienceGender: (e.target.value || undefined) as CreatorFilters["audienceGender"] })
          }
        >
          <option value="">{t("any")}</option>
          {AUDIENCE_GENDERS.map((g) => (
            <option key={g} value={g}>
              {label(AUDIENCE_GENDER_LABELS[g], locale)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("audienceAge")}>
        <Select
          value={filters.audienceAge ?? ""}
          onChange={(e) =>
            apply({ audienceAge: (e.target.value || undefined) as CreatorFilters["audienceAge"] })
          }
        >
          <option value="">{t("any")}</option>
          {AGE_RANGES.map((a) => (
            <option key={a} value={a}>
              {AGE_RANGE_LABELS[a]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("language")}>
        <Select
          value={filters.language ?? ""}
          onChange={(e) => apply({ language: e.target.value || undefined })}
        >
          <option value="">{t("any")}</option>
          {CONTENT_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {label(l.label, locale)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="space-y-2.5">
        <Toggle
          checked={!!filters.barter}
          onChange={(v) => apply({ barter: v || undefined })}
          label={t("barter")}
        />
        <Toggle
          checked={!!filters.verified}
          onChange={(v) => apply({ verified: v || undefined })}
          label={t("verifiedOnly")}
        />
      </div>
      {count > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            setCity("");
            startTransition(() => {
              router.replace({ pathname: "/creators", query: q ? { q } : {} }, { scroll: false });
            });
          }}
        >
          <X className="h-4 w-4" />
          {t("clear")}
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Search + sort bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-sm shadow-soft focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-semibold shadow-soft lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("title")}
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <select
            aria-label={t("sort")}
            value={filters.sort ?? "recommended"}
            onChange={(e) => apply({ sort: e.target.value as CreatorFilters["sort"] })}
            className="h-12 flex-1 cursor-pointer rounded-full border border-line bg-surface px-5 text-sm font-semibold shadow-soft focus:border-brand-400 focus:outline-none sm:flex-none"
          >
            <option value="recommended">{t("sortRecommended")}</option>
            <option value="newest">{t("sortNewest")}</option>
          </select>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="card mt-4 p-5 lg:hidden">{panel}</div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-label={t("title")}>
          <div className="card sticky top-24 p-5">
            <p className="mb-5 flex items-center gap-2 font-display font-bold">
              <SlidersHorizontal className="h-4 w-4" />
              {t("title")}
            </p>
            {panel}
          </div>
        </aside>
        <div
          className={cn("min-w-0 transition-opacity duration-150", pending && "opacity-60")}
          aria-busy={pending}
        >
          {children}
        </div>
      </div>
    </>
  );
}
