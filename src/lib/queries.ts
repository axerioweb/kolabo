import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppNotification,
  CollaborationPrefs,
  ContactPrefs,
  InfluencerFull,
  Profile,
  Service,
  SocialAccount,
} from "./types";
import type { OnboardingData } from "./onboarding-types";
import { emptyOnboardingData } from "./onboarding-types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyClient = SupabaseClient<any, any, any>;

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

export async function getInfluencerFull(
  supabase: AnyClient,
  userId: string
): Promise<InfluencerFull | null> {
  const profile = await getProfile(supabase, userId);
  if (!profile) return null;

  const [socials, cats, services, collab, contact] = await Promise.all([
    supabase.from("social_accounts").select("*").eq("profile_id", userId),
    supabase.from("profile_categories").select("category_slug").eq("profile_id", userId),
    supabase.from("services").select("*").eq("profile_id", userId),
    supabase.from("collaboration_prefs").select("*").eq("profile_id", userId).maybeSingle(),
    supabase.from("contact_prefs").select("*").eq("profile_id", userId).maybeSingle(),
  ]);

  return {
    profile,
    socials: (socials.data as SocialAccount[]) ?? [],
    categories:
      (cats.data as { category_slug: string }[] | null)?.map(
        (c) => c.category_slug
      ) ?? [],
    services: (services.data as Service[]) ?? [],
    collaboration: (collab.data as CollaborationPrefs) ?? null,
    contact: (contact.data as ContactPrefs) ?? null,
  };
}

export async function getAllInfluencers(
  supabase: AnyClient
): Promise<InfluencerFull[]> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "influencer")
    .order("created_at", { ascending: false });

  if (!profiles || profiles.length === 0) return [];

  const ids = profiles.map((p: Profile) => p.id);
  const [socials, cats, services, collabs, contacts] = await Promise.all([
    supabase.from("social_accounts").select("*").in("profile_id", ids),
    supabase.from("profile_categories").select("*").in("profile_id", ids),
    supabase.from("services").select("*").in("profile_id", ids),
    supabase.from("collaboration_prefs").select("*").in("profile_id", ids),
    supabase.from("contact_prefs").select("*").in("profile_id", ids),
  ]);

  return (profiles as Profile[]).map((profile) => ({
    profile,
    socials:
      ((socials.data as SocialAccount[]) ?? []).filter(
        (s) => s.profile_id === profile.id
      ),
    categories: ((cats.data as { profile_id: string; category_slug: string }[]) ?? [])
      .filter((c) => c.profile_id === profile.id)
      .map((c) => c.category_slug),
    services: ((services.data as Service[]) ?? []).filter(
      (s) => s.profile_id === profile.id
    ),
    collaboration:
      ((collabs.data as CollaborationPrefs[]) ?? []).find(
        (c) => c.profile_id === profile.id
      ) ?? null,
    contact:
      ((contacts.data as ContactPrefs[]) ?? []).find(
        (c) => c.profile_id === profile.id
      ) ?? null,
  }));
}

export async function getNotifications(
  supabase: AnyClient,
  userId: string
): Promise<AppNotification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as AppNotification[]) ?? [];
}

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
  if (p.city && p.country) score += 5;
  if (full.socials.length > 0) score += 20;
  if (full.socials.some((s) => s.engagement_rate != null)) score += 5;
  if (full.categories.length > 0) score += 15;
  if (full.services.length > 0) score += 10;
  if (full.collaboration) score += 5;
  if (full.contact?.contact_email) score += 10;
  return Math.min(100, score);
}
