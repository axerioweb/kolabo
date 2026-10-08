import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppNotification,
  CollaborationPrefs,
  CollaborationRequest,
  Company,
  CompanyFull,
  ContactPrefs,
  CreatorCardData,
  InboxItem,
  InfluencerFull,
  Message,
  Profile,
  PublicCreator,
  RequestContact,
  RequestDetail,
  Report,
  Review,
  SearchResult,
  Service,
  SocialAccount,
} from "./types";
import type { OnboardingData } from "./onboarding-types";
import { emptyOnboardingData } from "./onboarding-types";
import {
  FOLLOWER_RANGES,
  type AgeRange,
  type AudienceGender,
  type Country,
  type FollowerRange,
  type Platform,
  type RequestStatus,
} from "./taxonomy";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyClient = SupabaseClient<any, any, any>;

/** PostgREST embed for everything that makes up an influencer profile. */
const INFLUENCER_EMBED =
  "social_accounts(*), profile_categories(category_slug), services(*), collaboration_prefs(*), contact_prefs(*)";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function toInfluencerFull(row: any): InfluencerFull {
  const {
    social_accounts,
    profile_categories,
    services,
    collaboration_prefs,
    contact_prefs,
    ...profile
  } = row;
  return {
    profile: profile as Profile,
    socials: (social_accounts as SocialAccount[]) ?? [],
    categories: ((profile_categories as { category_slug: string }[]) ?? []).map(
      (c) => c.category_slug
    ),
    services: (services as Service[]) ?? [],
    collaboration: one(collaboration_prefs) as CollaborationPrefs | null,
    contact: one(contact_prefs) as ContactPrefs | null,
  };
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

export async function getProfile(
  supabase: AnyClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

/** Full influencer profile in ONE request (embedded relations). */
export async function getInfluencerFull(
  supabase: AnyClient,
  userId: string
): Promise<InfluencerFull | null> {
  const { data } = await supabase
    .from("profiles")
    .select(`*, ${INFLUENCER_EMBED}`)
    .eq("id", userId)
    .maybeSingle();
  return data ? toInfluencerFull(data) : null;
}

/** Admin: all influencers in one request. */
export async function getAllInfluencers(
  supabase: AnyClient
): Promise<InfluencerFull[]> {
  const { data } = await supabase
    .from("profiles")
    .select(`*, ${INFLUENCER_EMBED}`)
    .eq("role", "influencer")
    .order("created_at", { ascending: false })
    .limit(1000);
  return (data ?? []).map(toInfluencerFull);
}

export async function getCompanyFull(
  supabase: AnyClient,
  userId: string
): Promise<CompanyFull | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*, companies(*), contact_prefs(*)")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  const { companies, contact_prefs, ...profile } = data as any;
  const company = one(companies) as Company | null;
  if (!company) return null;
  return {
    profile: profile as Profile,
    company,
    contact: one(contact_prefs) as ContactPrefs | null,
  };
}

/** Admin: all companies with their profile row. */
export async function getAllCompanies(supabase: AnyClient): Promise<CompanyFull[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*, companies(*), contact_prefs(*)")
    .eq("role", "company")
    .order("created_at", { ascending: false })
    .limit(1000);
  return (data ?? [])
    .map((row: any) => {
      const { companies, contact_prefs, ...profile } = row;
      const company = one(companies) as Company | null;
      return company
        ? { profile: profile as Profile, company, contact: one(contact_prefs) }
        : null;
    })
    .filter(Boolean) as CompanyFull[];
}

/* ------------------------------------------------------------------ */
/* Public creators (search + public profile)                           */
/* ------------------------------------------------------------------ */

export interface CreatorFilters {
  q?: string;
  category?: string;
  platform?: Platform;
  minFollowers?: FollowerRange;
  maxFollowers?: FollowerRange;
  country?: Country;
  city?: string;
  barter?: boolean;
  maxPrice?: number;
  audienceGender?: AudienceGender;
  audienceAge?: AgeRange;
  language?: string;
  verified?: boolean;
  sort?: "recommended" | "newest";
  page?: number;
}

export const PAGE_SIZE = 24;

/** Escape LIKE wildcards so user input is matched literally. */
function likeSafe(v: string): string {
  return v.replace(/[\\%_]/g, (m) => `\\${m}`).slice(0, 80);
}

export async function searchCreators(
  client: AnyClient,
  f: CreatorFilters
): Promise<SearchResult> {
  const page = Math.max(1, f.page ?? 1);
  const { data, error } = await client.rpc("search_influencers", {
    p_q: f.q?.trim() ? likeSafe(f.q.trim()) : null,
    p_category: f.category ?? null,
    p_platform: f.platform ?? null,
    p_min_followers: f.minFollowers ?? null,
    p_max_followers: f.maxFollowers ?? null,
    p_country: f.country ?? null,
    p_city: f.city?.trim() ? likeSafe(f.city.trim()) : null,
    p_barter: f.barter ?? null,
    p_max_price: f.maxPrice ?? null,
    p_audience_gender: f.audienceGender ?? null,
    p_audience_age: f.audienceAge ?? null,
    p_language: f.language ?? null,
    p_verified: f.verified ?? null,
    p_sort: f.sort ?? "recommended",
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error || !data) return { items: [], total: 0 };
  const rows = data as { profile: CreatorCardData; total_count: number }[];
  return {
    items: rows.map((r) => ({
      ...r.profile,
      reviews_count: Number(r.profile.reviews_count ?? 0),
      min_price_eur:
        r.profile.min_price_eur != null ? Number(r.profile.min_price_eur) : null,
      rating: r.profile.rating != null ? Number(r.profile.rating) : null,
    })),
    total: rows[0] ? Number(rows[0].total_count) : 0,
  };
}

/** Explicit public columns — anon has no access to birth_year/gender. */
const PUBLIC_PROFILE_COLUMNS =
  "id, full_name, username, avatar_url, bio, country, city, content_languages, verified_at, created_at";

export async function getPublicCreator(
  client: AnyClient,
  username: string
): Promise<PublicCreator | null> {
  const { data } = await client
    .from("profiles")
    .select(
      `${PUBLIC_PROFILE_COLUMNS}, social_accounts(*), profile_categories(category_slug), services(*), collaboration_prefs(*), reviews!reviewee_id(id, rating, comment, created_at)`
    )
    .eq("username", username.toLowerCase())
    .eq("role", "influencer")
    .eq("status", "active")
    .eq("onboarding_completed", true)
    .maybeSingle();
  if (!data) return null;
  const row = data as any;
  return {
    profile: {
      id: row.id,
      full_name: row.full_name,
      username: row.username,
      avatar_url: row.avatar_url,
      bio: row.bio,
      country: row.country,
      city: row.city,
      content_languages: row.content_languages ?? [],
      verified_at: row.verified_at,
      created_at: row.created_at,
    },
    socials: row.social_accounts ?? [],
    categories: (row.profile_categories ?? []).map(
      (c: { category_slug: string }) => c.category_slug
    ),
    services: row.services ?? [],
    collaboration: one(row.collaboration_prefs),
    reviews: [...(row.reviews ?? [])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    ),
  };
}

/** Usernames for sitemap / static params (public profiles only). */
export async function getPublicUsernames(client: AnyClient): Promise<string[]> {
  const { data } = await client
    .from("profiles")
    .select("username")
    .eq("role", "influencer")
    .eq("status", "active")
    .eq("onboarding_completed", true)
    .not("username", "is", null)
    .limit(5000);
  return (data ?? []).map((r: { username: string }) => r.username);
}

/** Maps an embedded influencer row to the search card shape. */
export function toCardData(full: InfluencerFull): CreatorCardData {
  const eur = (amount: number, cur: string) =>
    cur === "RSD" ? amount / 117 : cur === "BAM" ? amount / 1.95583 : cur === "MKD" ? amount / 61.5 : amount;
  const prices = full.services
    .filter((s) => s.price_min != null)
    .map((s) => eur(s.price_min!, s.currency));
  return {
    id: full.profile.id,
    full_name: full.profile.full_name,
    username: full.profile.username ?? "",
    avatar_url: full.profile.avatar_url,
    bio: full.profile.bio,
    city: full.profile.city,
    country: full.profile.country,
    verified: full.profile.verified_at != null,
    socials: [...full.socials]
      .sort(
        (a, b) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          FOLLOWER_RANGES.indexOf(b.follower_range) -
            FOLLOWER_RANGES.indexOf(a.follower_range)
      )
      .map((s) => ({
        platform: s.platform,
        handle: s.handle,
        follower_range: s.follower_range,
        engagement_rate: s.engagement_rate,
        is_primary: s.is_primary,
      })),
    categories: full.categories,
    min_price_eur: prices.length ? Math.round(Math.min(...prices)) : null,
    barter: full.collaboration?.barter ?? null,
    rating: null,
    reviews_count: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Saved creators (company shortlist)                                  */
/* ------------------------------------------------------------------ */

export async function getSavedIds(
  supabase: AnyClient,
  companyId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("saved_influencers")
    .select("influencer_id")
    .eq("company_id", companyId);
  return (data ?? []).map((r: { influencer_id: string }) => r.influencer_id);
}

export async function getSavedCreators(
  supabase: AnyClient,
  companyId: string
): Promise<CreatorCardData[]> {
  const ids = await getSavedIds(supabase, companyId);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, bio, country, city, verified_at, social_accounts(*), profile_categories(category_slug), services(*), collaboration_prefs(*)"
    )
    .in("id", ids);
  return (data ?? []).map((row: any) => toCardData(toInfluencerFull(row)));
}

/* ------------------------------------------------------------------ */
/* Collaboration requests                                              */
/* ------------------------------------------------------------------ */

export async function getMyRequests(
  supabase: AnyClient,
  status?: RequestStatus
): Promise<InboxItem[]> {
  const { data } = await supabase.rpc("my_requests", { p_status: status ?? null });
  return ((data as InboxItem[]) ?? []).map((r) => ({
    ...r,
    unread: Number(r.unread ?? 0),
  }));
}

export async function getRequestDetail(
  supabase: AnyClient,
  id: string,
  userId: string
): Promise<RequestDetail | null> {
  const { data: request } = await supabase
    .from("collaboration_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!request) return null;
  const r = request as CollaborationRequest;

  const revealed = ["accepted", "delivered", "completed"].includes(r.status);
  const [companyRes, influencerRes, messagesRes, reviewRes, contactRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, verified_at, companies(*)")
        .eq("id", r.company_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, verified_at")
        .eq("id", r.influencer_id)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("*")
        .eq("request_id", id)
        .order("created_at", { ascending: true })
        .limit(500),
      supabase
        .from("reviews")
        .select("*")
        .eq("request_id", id)
        .eq("reviewer_id", userId)
        .maybeSingle(),
      revealed
        ? supabase.rpc("get_request_contact", { rid: id })
        : Promise.resolve({ data: null }),
    ]);

  const cp = companyRes.data as any;
  const company = one(cp?.companies) as Company | null;
  const ip = influencerRes.data as any;

  return {
    request: r,
    company: {
      id: r.company_id,
      name: company?.name || cp?.full_name || "—",
      avatar_url: company?.logo_url ?? cp?.avatar_url ?? null,
      verified: cp?.verified_at != null,
      industry: company?.industry ?? null,
      website: company?.website ?? null,
      city: company?.city ?? null,
      country: company?.country ?? null,
      description: company?.description ?? null,
    },
    influencer: {
      id: r.influencer_id,
      name: ip?.full_name ?? "—",
      avatar_url: ip?.avatar_url ?? null,
      verified: ip?.verified_at != null,
      username: ip?.username ?? null,
    },
    messages: (messagesRes.data as Message[]) ?? [],
    myReview: (reviewRes.data as Review) ?? null,
    contact: (contactRes.data as RequestContact | null) ?? null,
  };
}

/** Admin: latest requests with party names. */
export async function getAllRequests(supabase: AnyClient) {
  const { data } = await supabase
    .from("collaboration_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  const requests = (data as CollaborationRequest[]) ?? [];
  const ids = [...new Set(requests.flatMap((r) => [r.company_id, r.influencer_id]))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name, companies(name)")
      .in("id", ids);
    for (const p of (people ?? []) as any[]) {
      names.set(p.id, one(p.companies)?.name || p.full_name);
    }
  }
  return requests.map((r) => ({
    ...r,
    company_name: names.get(r.company_id) ?? "—",
    influencer_name: names.get(r.influencer_id) ?? "—",
  }));
}

/** Admin: reports with reporter/target names. */
export async function getAllReports(supabase: AnyClient) {
  const { data } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  const reports = (data as Report[]) ?? [];
  const ids = [...new Set(reports.flatMap((r) => [r.reporter_id, r.target_profile_id]))];
  type Person = { name: string; role: string; status: Profile["status"]; verified: boolean };
  const names = new Map<string, Person>();
  if (ids.length) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name, role, status, verified_at, companies(name)")
      .in("id", ids);
    for (const p of (people ?? []) as any[]) {
      names.set(p.id, {
        name: one(p.companies)?.name || p.full_name,
        role: p.role,
        status: p.status,
        verified: p.verified_at != null,
      });
    }
  }
  const unknown: Person = { name: "—", role: "", status: "active", verified: false };
  return reports.map((r) => ({
    ...r,
    reporter: names.get(r.reporter_id) ?? unknown,
    target: names.get(r.target_profile_id) ?? unknown,
  }));
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function getNotifications(
  supabase: AnyClient,
  userId: string,
  limit = 20
): Promise<AppNotification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AppNotification[]) ?? [];
}

/* ------------------------------------------------------------------ */
/* Onboarding helpers                                                  */
/* ------------------------------------------------------------------ */

/** Maps stored rows back into the wizard's editable shape. */
export function toOnboardingData(full: InfluencerFull): OnboardingData {
  const e = emptyOnboardingData;
  return {
    basics: {
      username: full.profile.username ?? "",
      bio: full.profile.bio ?? "",
      birth_year: full.profile.birth_year?.toString() ?? "",
      gender: full.profile.gender ?? "",
      country: full.profile.country ?? "RS",
      city: full.profile.city ?? "",
      languages: full.profile.content_languages ?? ["sr"],
    },
    socials: full.socials.map((s) => ({
      platform: s.platform,
      handle: s.handle,
      profile_url: s.profile_url ?? "",
      follower_range: s.follower_range,
      engagement_rate: s.engagement_rate?.toString() ?? "",
      avg_views: s.avg_views?.toString() ?? "",
      audience_gender: s.audience_gender ?? "",
      audience_top_age: s.audience_top_age ?? "",
      audience_countries: s.audience_countries ?? [],
      is_primary: s.is_primary,
    })),
    categories: full.categories,
    currency: full.services[0]?.currency ?? full.collaboration?.currency ?? "EUR",
    services: full.services.map((s) => ({
      service_type: s.service_type,
      price_min: s.price_min?.toString() ?? "",
      price_max: s.price_max?.toString() ?? "",
    })),
    collaboration: full.collaboration
      ? {
          barter: full.collaboration.barter,
          barter_types: full.collaboration.barter_types ?? [],
          barter_min_value: full.collaboration.barter_min_value?.toString() ?? "",
          min_budget: full.collaboration.min_budget?.toString() ?? "",
          open_to_travel: full.collaboration.open_to_travel,
          notes: full.collaboration.notes ?? "",
        }
      : e.collaboration,
    contact: full.contact
      ? {
          contact_email: full.contact.contact_email ?? "",
          phone: full.contact.phone ?? "",
          preferred_channel: full.contact.preferred_channel,
          allowed_channels: full.contact.allowed_channels ?? [],
          allow_platform_messages: full.contact.allow_platform_messages,
          email_notifications: full.contact.email_notifications,
        }
      : e.contact,
  };
}

/** 0–100 score used on the dashboard. */
export function profileCompleteness(full: InfluencerFull): number {
  let score = 0;
  const p = full.profile;
  if (p.full_name) score += 10;
  if (p.username) score += 10;
  if (p.bio) score += 10;
  if (p.avatar_url) score += 5;
  if (p.city && p.country) score += 5;
  if (full.socials.length > 0) score += 15;
  if (full.socials.some((s) => s.engagement_rate != null)) score += 5;
  if (full.categories.length > 0) score += 15;
  if (full.services.length > 0) score += 10;
  if (full.collaboration) score += 5;
  if (full.contact?.contact_email) score += 10;
  return Math.min(100, score);
}

/** 0–100 score for company profiles. */
export function companyCompleteness(c: CompanyFull): number {
  let score = 0;
  const x = c.company;
  if (x.name) score += 15;
  if (x.tax_id) score += 15;
  if (x.description) score += 15;
  if (x.logo_url) score += 10;
  if (x.website || x.instagram) score += 10;
  if (x.city) score += 5;
  if (x.contact_name) score += 10;
  if (x.interested_categories.length > 0) score += 10;
  if (c.contact?.contact_email) score += 10;
  return Math.min(100, score);
}
