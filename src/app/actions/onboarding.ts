"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OnboardingData } from "@/lib/onboarding-types";
import { MAX_CATEGORIES } from "@/lib/taxonomy";

function num(v: string): number | null {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && v !== "" ? n : null;
}

export type SaveResult = { ok: boolean; demo?: boolean; error?: string };

/**
 * Persists the full onboarding state for the signed-in influencer.
 * Idempotent — called on every step change and on finish.
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

  // 1) Profile basics
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username: data.basics.username.trim().toLowerCase() || null,
      bio: data.basics.bio.trim() || null,
      birth_year: num(data.basics.birth_year),
      gender: data.basics.gender || null,
      country: data.basics.country || null,
      city: data.basics.city.trim() || null,
      content_languages: data.basics.languages,
      onboarding_completed: completed,
      status: completed ? "active" : "pending",
    })
    .eq("id", user.id);

  if (profileError) return { ok: false, error: profileError.message };

  // 2) Social accounts — replace set
  await supabase.from("social_accounts").delete().eq("profile_id", user.id);
  if (data.socials.length > 0) {
    const { error } = await supabase.from("social_accounts").insert(
      data.socials.map((s) => ({
        profile_id: user.id,
        platform: s.platform,
        handle: s.handle.trim(),
        profile_url: s.profile_url.trim() || null,
        follower_range: s.follower_range,
        engagement_rate: num(s.engagement_rate),
        avg_views: num(s.avg_views),
        audience_gender: s.audience_gender || null,
        audience_top_age: s.audience_top_age || null,
        audience_countries: s.audience_countries,
        is_primary: s.is_primary,
      }))
    );
    if (error) return { ok: false, error: error.message };
  }

  // 3) Categories — replace set (cap enforced app-side + DB trigger)
  await supabase.from("profile_categories").delete().eq("profile_id", user.id);
  if (data.categories.length > 0) {
    const { error } = await supabase.from("profile_categories").insert(
      data.categories.slice(0, MAX_CATEGORIES).map((slug) => ({
        profile_id: user.id,
        category_slug: slug,
      }))
    );
    if (error) return { ok: false, error: error.message };
  }

  // 4) Services — replace set
  await supabase.from("services").delete().eq("profile_id", user.id);
  const services = data.services.filter(
    (s) => s.price_min !== "" || s.price_max !== ""
  );
  if (services.length > 0) {
    const { error } = await supabase.from("services").insert(
      services.map((s) => ({
        profile_id: user.id,
        service_type: s.service_type,
        price_min: num(s.price_min),
        price_max: num(s.price_max),
        currency: data.currency,
      }))
    );
    if (error) return { ok: false, error: error.message };
  }

  // 5) Collaboration prefs
  const { error: collabError } = await supabase
    .from("collaboration_prefs")
    .upsert({
      profile_id: user.id,
      barter: data.collaboration.barter,
      barter_types:
        data.collaboration.barter === "no" ? [] : data.collaboration.barter_types,
      barter_min_value: num(data.collaboration.barter_min_value),
      min_budget: num(data.collaboration.min_budget),
      currency: data.currency,
      open_to_travel: data.collaboration.open_to_travel,
      notes: data.collaboration.notes.trim() || null,
    });
  if (collabError) return { ok: false, error: collabError.message };

  // 6) Contact prefs
  const { error: contactError } = await supabase.from("contact_prefs").upsert({
    profile_id: user.id,
    contact_email: data.contact.contact_email.trim() || null,
    phone: data.contact.phone.trim() || null,
    preferred_channel: data.contact.preferred_channel,
    allowed_channels: data.contact.allowed_channels,
    allow_platform_messages: data.contact.allow_platform_messages,
    email_notifications: data.contact.email_notifications,
  });
  if (contactError) return { ok: false, error: contactError.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
