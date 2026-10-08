"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CREATORS_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ReportStatus } from "@/lib/taxonomy";

export type AdminResult = { ok: boolean; demo?: boolean; error?: string };

/** Every admin action re-checks the role server-side (RLS is the 2nd line). */
async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return me?.role === "admin" ? supabase : null;
}

export async function setVerified(profileId: string, verified: boolean): Promise<AdminResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "not_admin" };

  const { error } = await supabase
    .from("profiles")
    .update({ verified_at: verified ? new Date().toISOString() : null })
    .eq("id", profileId);
  if (error) return { ok: false, error: "save_failed" };

  if (verified) {
    await supabase.from("notifications").insert({
      profile_id: profileId,
      type: "system",
      template: "verified",
    });
  }
  revalidateTag(PUBLIC_CREATORS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setSuspended(profileId: string, suspended: boolean): Promise<AdminResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "not_admin" };

  const { data: target } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", profileId)
    .single();
  if (!target || target.role === "admin") return { ok: false, error: "not_allowed" };

  const { error } = await supabase
    .from("profiles")
    .update({
      status: suspended ? "suspended" : target.onboarding_completed ? "active" : "pending",
    })
    .eq("id", profileId);
  if (error) return { ok: false, error: "save_failed" };
  revalidateTag(PUBLIC_CREATORS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resolveReport(
  id: string,
  status: Exclude<ReportStatus, "open">,
  note: string
): Promise<AdminResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "not_admin" };

  const { error } = await supabase
    .from("reports")
    .update({
      status,
      resolution_note: note.trim().slice(0, 1000) || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "save_failed" };
  revalidatePath("/admin/reports", "page");
  return { ok: true };
}
