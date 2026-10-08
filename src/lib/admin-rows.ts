import type { TableRow } from "@/components/admin/influencer-table";
import type { InfluencerFull } from "./types";
import {
  BARTER_PREF_LABELS,
  CATEGORIES,
  categoryBySlug,
  COUNTRIES,
  COUNTRY_LABELS,
  FOLLOWER_RANGE_LABELS,
  label,
  PLATFORMS,
  PLATFORM_LABELS,
} from "./taxonomy";
import { formatNumber } from "./utils";

/** Rows for the admin influencer table (shared by overview + management). */
export function buildInfluencerRows(influencers: InfluencerFull[], locale: string): TableRow[] {
  const dateFmt = new Intl.DateTimeFormat(locale === "sr" ? "sr-Latn-RS" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return influencers.map((i) => {
    const primary = i.socials.find((s) => s.is_primary) ?? i.socials[0];
    const cheapest = i.services
      .map((s) => s.price_min)
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b)[0];
    return {
      id: i.profile.id,
      name: i.profile.full_name,
      username: i.profile.username,
      city: i.profile.city,
      country: i.profile.country,
      countryLabel: i.profile.country ? label(COUNTRY_LABELS[i.profile.country], locale) : "—",
      categorySlugs: i.categories,
      categoryLabels: i.categories.map((slug) => {
        const c = categoryBySlug(slug);
        return c ? label(c.label, locale) : slug;
      }),
      platforms: i.socials.map((s) => s.platform),
      followerLabel: primary ? FOLLOWER_RANGE_LABELS[primary.follower_range] : null,
      priceFrom:
        cheapest != null
          ? `${formatNumber(cheapest, locale)} ${i.services[0]?.currency ?? "EUR"}`
          : null,
      barter: i.collaboration?.barter ?? null,
      joined: dateFmt.format(new Date(i.profile.created_at)),
      status: i.profile.status,
      verified: i.profile.verified_at != null,
    };
  });
}

export function tableOptions(locale: string) {
  return {
    categoryOptions: CATEGORIES.map((c) => ({
      value: c.slug,
      label: `${c.emoji} ${label(c.label, locale)}`,
    })),
    countryOptions: COUNTRIES.map((c) => ({ value: c, label: label(COUNTRY_LABELS[c], locale) })),
    platformOptions: PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] })),
    barterLabels: {
      yes: label(BARTER_PREF_LABELS.yes, locale),
      depends: label(BARTER_PREF_LABELS.depends, locale),
      no: label(BARTER_PREF_LABELS.no, locale),
    },
  };
}
