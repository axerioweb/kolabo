"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CREATORS_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { REPORT_REASONS, type ReportReason } from "@/lib/taxonomy";

export type CommunityResult = { ok: boolean; demo?: boolean; error?: string };

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Company shortlist: save / unsave a creator. */
export async function toggleSaved(
  influencerId: string,
  save: boolean
): Promise<CommunityResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { error } = save
    ? await supabase
        .from("saved_influencers")
        .upsert(
          { company_id: user.id, influencer_id: influencerId },
          { onConflict: "company_id,influencer_id", ignoreDuplicates: true }
        )
    : await supabase
        .from("saved_influencers")
        .delete()
        .eq("company_id", user.id)
        .eq("influencer_id", influencerId);

  if (error) return { ok: false, error: "not_allowed" };
  revalidatePath("/dashboard/saved", "page");
  return { ok: true };
}

/** Review after a completed collaboration (one per side per request). */
export async function createReview(
  requestId: string,
  rating: number,
  comment: string
): Promise<CommunityResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "invalid" };
  }
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: request } = await supabase
    .from("collaboration_requests")
    .select("company_id, influencer_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!request || request.status !== "completed") return { ok: false, error: "not_allowed" };

  const reviewee =
    request.company_id === user.id ? request.influencer_id : request.company_id;

  const { error } = await supabase.from("reviews").insert({
    request_id: requestId,
    reviewer_id: user.id,
    reviewee_id: reviewee,
    rating,
    comment: comment.trim().slice(0, 1000) || null,
  });
  if (error) return { ok: false, error: error.code === "23505" ? "already_reviewed" : "not_allowed" };

  revalidateTag(PUBLIC_CREATORS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Abuse report — reviewed by admins. */
export async function createReport(
  targetProfileId: string,
  reason: ReportReason,
  details: string,
  requestId?: string
): Promise<CommunityResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  if (!REPORT_REASONS.includes(reason)) return { ok: false, error: "invalid" };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };
  if (user.id === targetProfileId) return { ok: false, error: "invalid" };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_profile_id: targetProfileId,
    request_id: requestId ?? null,
    reason,
    details: details.trim().slice(0, 1000) || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "already_reported" };
    if (error.message.includes("rate_limited")) return { ok: false, error: "rate_limited" };
    return { ok: false, error: "save_failed" };
  }
  return { ok: true };
}
