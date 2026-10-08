import type { CreatorFilters } from "./queries";
import {
  AGE_RANGES,
  AUDIENCE_GENDERS,
  CATEGORIES,
  CONTENT_LANGUAGES,
  COUNTRIES,
  FOLLOWER_RANGES,
  PLATFORMS,
  type AgeRange,
  type AudienceGender,
  type Country,
  type FollowerRange,
  type Platform,
} from "./taxonomy";

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function pick<T extends string>(v: string | undefined, allowed: readonly T[]): T | undefined {
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

/** URL search params → validated filters (unknown values are dropped). */
export function parseFilters(sp: Params): CreatorFilters {
  const maxPrice = Number(first(sp.maxPrice));
  const page = Number(first(sp.page));
  return {
    q: first(sp.q)?.slice(0, 80) || undefined,
    category: pick(first(sp.category), CATEGORIES.map((c) => c.slug)),
    platform: pick<Platform>(first(sp.platform), PLATFORMS),
    minFollowers: pick<FollowerRange>(first(sp.followers), FOLLOWER_RANGES),
    country: pick<Country>(first(sp.country), COUNTRIES),
    city: first(sp.city)?.slice(0, 60) || undefined,
    barter: first(sp.barter) === "1" ? true : undefined,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? Math.round(maxPrice) : undefined,
    audienceGender: pick<AudienceGender>(first(sp.gender), AUDIENCE_GENDERS),
    audienceAge: pick<AgeRange>(first(sp.age), AGE_RANGES),
    language: pick(first(sp.lang), CONTENT_LANGUAGES.map((l) => l.code)),
    verified: first(sp.verified) === "1" ? true : undefined,
    sort: first(sp.sort) === "newest" ? "newest" : "recommended",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** Filters → compact query object (only set values). */
export function filtersToQuery(f: CreatorFilters): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.q) q.q = f.q;
  if (f.category) q.category = f.category;
  if (f.platform) q.platform = f.platform;
  if (f.minFollowers) q.followers = f.minFollowers;
  if (f.country) q.country = f.country;
  if (f.city) q.city = f.city;
  if (f.barter) q.barter = "1";
  if (f.maxPrice) q.maxPrice = String(f.maxPrice);
  if (f.audienceGender) q.gender = f.audienceGender;
  if (f.audienceAge) q.age = f.audienceAge;
  if (f.language) q.lang = f.language;
  if (f.verified) q.verified = "1";
  if (f.sort && f.sort !== "recommended") q.sort = f.sort;
  if (f.page && f.page > 1) q.page = String(f.page);
  return q;
}

/** Number of active filters (excluding text search, sort and page). */
export function activeFilterCount(f: CreatorFilters): number {
  return [
    f.category,
    f.platform,
    f.minFollowers,
    f.country,
    f.city,
    f.barter,
    f.maxPrice,
    f.audienceGender,
    f.audienceAge,
    f.language,
    f.verified,
  ].filter(Boolean).length;
}
