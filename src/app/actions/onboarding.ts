"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CREATORS_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OnboardingData } from "@/lib/onboarding-types";
import {
  CATEGORIES,
  CONTENT_LANGUAGES,
  MAX_CATEGORIES,
  PLATFORMS,
  SERVICE_TYPES,
} from "@/lib/taxonomy";
import { normalizeUsername, usernameError } from "@/lib/validation";

function num(v: string): number | null {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && v !== "" ? n : null;
}

function int(v: string): number | null {
  const n = num(v);
  return n == null ? null : Math.round(n);
}

export type SaveResult = { ok: boolean; demo?: boolean; error?: string };

/** "(a,b,c)" list literal for PostgREST `not.in` filters. */
function inList(values: string[]): string {
  return `(${values.map((v) => `"${v}"`).join(",")})`;
}

/**
 * Persists the full onboarding state for the signed-in influencer.
 * Idempotent — called on every step change and on finish.
 *
 * Order matters: rows are upserted FIRST and stale rows pruned AFTER,
 * so a failure midway never leaves the profile without its data.
 */
export async function saveOnboarding(
  data: OnboardingData,
  completed: boolean
): Promise<SaveResult> {
  if (!isSupabaseConfigured) {
    // Demo mode — nothing to persist, let the wizard continue.
    return { ok: true, demo: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };
  const uid = user.id;

  // Only creators have a creator profile (companies use saveCompanyProfile)
  const { data: me } = await supabase.from("profiles").select("role").eq("id", uid).single();
  if (me?.role !== "influencer") return { ok: false, error: "not_allowed" };

  // --- Validation (enums are validated before they reach any filter) ---
  const validSlugs = new Set(CATEGORIES.map((c) => c.slug));
  const validLangs = new Set<string>(CONTENT_LANGUAGES.map((l) => l.code));
  data.categories = data.categories.filter((s) => validSlugs.has(s));
  data.socials = data.socials.filter((s) => (PLATFORMS as readonly string[]).includes(s.platform));
  data.services = data.services.filter((s) => (SERVICE_TYPES as readonly string[]).includes(s.service_type));
  data.basics.languages = data.basics.languages.filter((l) => validLangs.has(l));
  const username = normalizeUsername(data.basics.username);
  if (username) {
    const err = usernameError(username);
    if (err) return { ok: false, error: `username_${err}` };
  }
  if (completed) {
    if (!username) return { ok: false, error: "username_required" };
    if (data.socials.length === 0) return { ok: false, error: "socials_required" };
    if (data.categories.length === 0) return { ok: false, error: "categories_required" };
  }

  // --- 1) Profile basics -------------------------------------------
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username: username || null,
      bio: data.basics.bio.trim().slice(0, 400) || null,
      birth_year: int(data.basics.birth_year),
      gender: data.basics.gender || null,
      country: data.basics.country || null,
      city: data.basics.city.trim().slice(0, 80) || null,
      content_languages: data.basics.languages.slice(0, 5),
      // Only ever flips to true here; intermediate step saves of an
      // already-public profile must not hide it. Status (pending/active)
      // derives from this flag in a DB trigger.
      ...(completed ? { onboarding_completed: true } : {}),
    })
    .eq("id", uid);

  if (profileError) {
    if (profileError.code === "23505") return { ok: false, error: "username_taken" };
    return { ok: false, error: "save_failed" };
  }

  // --- 2) Related sets, in parallel ---------------------------------
  const socials = data.socials.filter((s) => s.handle.trim() !== "");
  const platforms = socials.map((s) => s.platform);
  const hasPrimary = socials.some((s) => s.is_primary);

  const saveSocials = async () => {
    // Clear the primary flag first — one-primary-per-profile is a unique index
    await supabase.from("social_accounts").update({ is_primary: false }).eq("profile_id", uid);
    if (socials.length > 0) {
      const { error } = await supabase.from("social_accounts").upsert(
        socials.map((s, i) => ({
          profile_id: uid,
          platform: s.platform,
          handle: s.handle.trim().replace(/^@/, "").slice(0, 100),
          profile_url: s.profile_url.trim().slice(0, 300) || null,
          follower_range: s.follower_range,
          engagement_rate: num(s.engagement_rate),
          avg_views: int(s.avg_views),
          audience_gender: s.audience_gender || null,
          audience_top_age: s.audience_top_age || null,
          audience_countries: s.audience_countries.slice(0, 10),
          is_primary: hasPrimary ? s.is_primary : i === 0,
        })),
        { onConflict: "profile_id,platform" }
      );
      if (error) return error;
    }
    const prune = supabase.from("social_accounts").delete().eq("profile_id", uid);
    const { error } = platforms.length
      ? await prune.not("platform", "in", inList(platforms))
      : await prune;
    return error;
  };

  const saveCategories = async () => {
    const slugs = [...new Set(data.categories)].slice(0, MAX_CATEGORIES);
    // Prune first so the max-5 trigger never sees 6+ rows
    const prune = supabase.from("profile_categories").delete().eq("profile_id", uid);
    const { error: pruneError } = slugs.length
      ? await prune.not("category_slug", "in", inList(slugs))
      : await prune;
    if (pruneError) return pruneError;
    if (slugs.length === 0) return null;
    const { error } = await supabase.from("profile_categories").upsert(
      slugs.map((slug) => ({ profile_id: uid, category_slug: slug })),
      { onConflict: "profile_id,category_slug", ignoreDuplicates: true }
    );
    return error;
  };

  const saveServices = async () => {
    const services = data.services.filter(
      (s) => s.price_min !== "" || s.price_max !== ""
    );
    if (services.length > 0) {
      const { error } = await supabase.from("services").upsert(
        services.map((s) => ({
          profile_id: uid,
          service_type: s.service_type,
          price_min: int(s.price_min),
          price_max: int(s.price_max),
          currency: data.currency,
        })),
        { onConflict: "profile_id,service_type" }
      );
      if (error) return error;
    }
    const types = services.map((s) => s.service_type);
    const prune = supabase.from("services").delete().eq("profile_id", uid);
    const { error } = types.length
      ? await prune.not("service_type", "in", inList(types))
      : await prune;
    return error;
  };

  const saveCollab = async () => {
    const { error } = await supabase.from("collaboration_prefs").upsert({
      profile_id: uid,
      barter: data.collaboration.barter,
      barter_types:
        data.collaboration.barter === "no" ? [] : data.collaboration.barter_types,
      barter_min_value: int(data.collaboration.barter_min_value),
      min_budget: int(data.collaboration.min_budget),
      currency: data.currency,
      open_to_travel: data.collaboration.open_to_travel,
      notes: data.collaboration.notes.trim().slice(0, 300) || null,
    });
    return error;
  };

  const saveContact = async () => {
    const { error } = await supabase.from("contact_prefs").upsert({
      profile_id: uid,
      contact_email: data.contact.contact_email.trim().slice(0, 254) || null,
      phone: data.contact.phone.trim().slice(0, 30) || null,
      preferred_channel: data.contact.preferred_channel,
      allowed_channels: data.contact.allowed_channels,
      allow_platform_messages: data.contact.allow_platform_messages,
      email_notifications: data.contact.email_notifications,
    });
    return error;
  };

  const errors = (
    await Promise.all([
      saveSocials(),
      saveCategories(),
      saveServices(),
      saveCollab(),
      saveContact(),
    ])
  ).filter(Boolean);

  if (errors.length > 0) return { ok: false, error: "save_failed" };

  revalidateTag(PUBLIC_CREATORS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}
