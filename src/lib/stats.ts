import type { InfluencerFull } from "./types";
import {
  FOLLOWER_TIER,
  type Platform,
  type ServiceType,
} from "./taxonomy";

/** Aggregates computed for the admin panel from the full influencer set. */
export interface AdminStats {
  total: number;
  newThisMonth: number;
  completed: number;
  barterReady: number; // yes or depends
  avgEngagement: number | null;
  networksConnected: number;
  byCategory: { key: string; count: number }[];
  byPlatform: { key: Platform; count: number }[];
  byTier: { key: string; count: number }[];
  byCountry: { key: string; count: number }[];
  barterSplit: { yes: number; depends: number; no: number };
  avgPrices: { key: ServiceType; min: number; max: number; count: number }[];
}

export function computeStats(influencers: InfluencerFull[]): AdminStats {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = <K extends string>(entries: K[]): Record<string, number> => {
    const acc: Record<string, number> = {};
    for (const e of entries) acc[e] = (acc[e] ?? 0) + 1;
    return acc;
  };

  const sorted = (acc: Record<string, number>) =>
    Object.entries(acc)
      .map(([key, c]) => ({ key, count: c }))
      .sort((a, b) => b.count - a.count);

  const engagements = influencers
    .flatMap((i) => i.socials.map((s) => s.engagement_rate))
    .filter((e): e is number => e != null);

  const barterSplit = { yes: 0, depends: 0, no: 0 };
  for (const i of influencers) {
    const b = i.collaboration?.barter;
    if (b === "yes") barterSplit.yes++;
    else if (b === "no") barterSplit.no++;
    else if (b === "depends") barterSplit.depends++;
  }

  // Average price ranges per service type (EUR assumed for MVP stats)
  const priceAcc: Record<
    string,
    { minSum: number; maxSum: number; n: number }
  > = {};
  for (const i of influencers) {
    for (const s of i.services) {
      const a = (priceAcc[s.service_type] ??= { minSum: 0, maxSum: 0, n: 0 });
      if (s.price_min != null) a.minSum += s.price_min;
      if (s.price_max != null) a.maxSum += s.price_max;
      a.n++;
    }
  }

  return {
    total: influencers.length,
    newThisMonth: influencers.filter(
      (i) => new Date(i.profile.created_at) >= monthStart
    ).length,
    completed: influencers.filter((i) => i.profile.onboarding_completed).length,
    barterReady: barterSplit.yes + barterSplit.depends,
    avgEngagement:
      engagements.length > 0
        ? Math.round(
            (engagements.reduce((a, b) => a + b, 0) / engagements.length) * 10
          ) / 10
        : null,
    networksConnected: influencers.reduce((a, i) => a + i.socials.length, 0),
    byCategory: sorted(count(influencers.flatMap((i) => i.categories))),
    byPlatform: sorted(
      count(influencers.flatMap((i) => i.socials.map((s) => s.platform)))
    ) as { key: Platform; count: number }[],
    byTier: sorted(
      count(
        influencers
          .map((i) => {
            const primary =
              i.socials.find((s) => s.is_primary) ?? i.socials[0];
            return primary ? FOLLOWER_TIER[primary.follower_range] : null;
          })
          .filter((t): t is NonNullable<typeof t> => t != null)
      )
    ),
    byCountry: sorted(
      count(
        influencers
          .map((i) => i.profile.country)
          .filter((c): c is NonNullable<typeof c> => c != null)
      )
    ),
    barterSplit,
    avgPrices: Object.entries(priceAcc)
      .map(([key, a]) => ({
        key: key as ServiceType,
        min: a.n ? Math.round(a.minSum / a.n) : 0,
        max: a.n ? Math.round(a.maxSum / a.n) : 0,
        count: a.n,
      }))
      .sort((a, b) => b.count - a.count),
  };
}
