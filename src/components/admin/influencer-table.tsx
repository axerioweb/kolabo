"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { SocialIcon } from "@/components/social-icons";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import type { Platform } from "@/lib/taxonomy";
import type { ProfileStatus } from "@/lib/types";
import { Link } from "@/i18n/navigation";
import { ProfileModeration } from "@/components/admin/admin-actions";

export interface TableRow {
  id: string;
  name: string;
  username: string | null;
  city: string | null;
  country: string | null; // code
  countryLabel: string;
  categorySlugs: string[];
  categoryLabels: string[];
  platforms: Platform[];
  followerLabel: string | null;
  priceFrom: string | null;
  barter: "yes" | "no" | "depends" | null;
  joined: string; // formatted date
  status?: ProfileStatus;
  verified?: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
}

export function InfluencerTable({
  rows,
  categoryOptions,
  countryOptions,
  platformOptions,
  barterLabels,
  manage,
}: {
  manage?: boolean;
  rows: TableRow[];
  categoryOptions: FilterOption[];
  countryOptions: FilterOption[];
  platformOptions: FilterOption[];
  barterLabels: Record<"yes" | "no" | "depends", string>;
}) {
  const t = useTranslations("admin.table");
  const tc = useTranslations("common");

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [platform, setPlatform] = useState("");
  const [country, setCountry] = useState("");
  const [barter, setBarter] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (
        needle &&
        !r.name.toLowerCase().includes(needle) &&
        !(r.username ?? "").toLowerCase().includes(needle)
      )
        return false;
      if (category && !r.categorySlugs.includes(category)) return false;
      if (platform && !r.platforms.includes(platform as Platform)) return false;
      if (country && r.country !== country) return false;
      if (barter && r.barter !== barter) return false;
      if (status && r.status !== status) return false;
      return true;
    });
    if (manage) {
      // Admin queue: complete-but-unverified profiles first, then newest
      return [...list].sort(
        (a, b) =>
          Number(a.status === "active" && !a.verified) * -1 -
          Number(b.status === "active" && !b.verified) * -1
      );
    }
    return list;
  }, [rows, q, category, platform, country, barter, status, manage]);

  const barterTone = (b: TableRow["barter"]) =>
    b === "yes" ? "success" : b === "no" ? "neutral" : "warning";

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <p className="mr-auto font-display font-bold">{t("title")}</p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="!w-64 !pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="!w-auto"
          aria-label={t("filterCategory")}
        >
          <option value="">{t("filterCategory")}: {tc("all")}</option>
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="!w-auto"
          aria-label={t("filterNetwork")}
        >
          <option value="">{t("filterNetwork")}: {tc("all")}</option>
          {platformOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="!w-auto"
          aria-label={t("filterCountry")}
        >
          <option value="">{t("filterCountry")}: {tc("all")}</option>
          {countryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {manage && (
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="!w-auto"
            aria-label={t("filterStatus")}
          >
            <option value="">{t("filterStatus")}: {tc("all")}</option>
            {(["active", "pending", "suspended"] as const).map((s) => (
              <option key={s} value={s}>
                {t(`statusLabels.${s}`)}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={barter}
          onChange={(e) => setBarter(e.target.value)}
          className="!w-auto"
          aria-label={t("filterBarter")}
        >
          <option value="">{t("filterBarter")}: {tc("all")}</option>
          {(["yes", "depends", "no"] as const).map((b) => (
            <option key={b} value={b}>
              {barterLabels[b]}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-left text-xs font-bold uppercase tracking-wider text-muted">
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3">{t("location")}</th>
              <th className="px-4 py-3">{t("categories")}</th>
              <th className="px-4 py-3">{t("networks")}</th>
              <th className="px-4 py-3">{t("followers")}</th>
              <th className="px-4 py-3">{t("priceFrom")}</th>
              <th className="px-4 py-3">{t("barter")}</th>
              <th className="px-4 py-3">{t("joined")}</th>
              {manage && <th className="px-4 py-3">{t("status")}</th>}
              {manage && <th className="px-4 py-3">{t("actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-line/70 transition-colors last:border-0 hover:bg-brand-50/40"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold">{r.name}</p>
                  {r.username &&
                    (r.status === "active" ? (
                      <Link
                        href={{ pathname: "/creators/[username]", params: { username: r.username } }}
                        className="text-xs text-brand-600 hover:underline"
                        target="_blank"
                      >
                        @{r.username}
                      </Link>
                    ) : (
                      <p className="text-xs text-muted">@{r.username}</p>
                    ))}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {r.city ? `${r.city}, ` : ""}
                  {r.countryLabel}
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-52 flex-wrap gap-1">
                    {r.categoryLabels.slice(0, 3).map((c) => (
                      <Badge key={c} tone="neutral" className="!px-2 !py-0.5">
                        {c}
                      </Badge>
                    ))}
                    {r.categoryLabels.length > 3 && (
                      <span className="text-xs text-muted">
                        +{r.categoryLabels.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 text-ink-soft">
                    {r.platforms.map((p) => (
                      <SocialIcon key={p} platform={p} className="h-4 w-4" />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium tabular-nums">
                  {r.followerLabel ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums">{r.priceFrom ?? "—"}</td>
                <td className="px-4 py-3">
                  {r.barter ? (
                    <Badge tone={barterTone(r.barter)} className="!px-2 !py-0.5">
                      {barterLabels[r.barter]}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">{r.joined}</td>
                {manage && (
                  <td className="px-4 py-3">
                    <Badge
                      tone={r.status === "active" ? "success" : r.status === "suspended" ? "accent" : "warning"}
                      className="!px-2 !py-0.5"
                    >
                      {t(`statusLabels.${r.status ?? "pending"}`)}
                    </Badge>
                  </td>
                )}
                {manage && (
                  <td className="px-4 py-3">
                    <ProfileModeration
                      profileId={r.id}
                      verified={!!r.verified}
                      status={r.status ?? "pending"}
                    />
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={manage ? 10 : 8} className="px-4 py-10 text-center text-muted">
                  {t("noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
