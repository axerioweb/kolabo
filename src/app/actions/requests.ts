"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  COMPENSATION_TYPES,
  CURRENCIES,
  SERVICE_TYPES,
  USAGE_RIGHTS,
  type CompensationType,
  type Currency,
  type RequestStatus,
  type ServiceType,
  type UsageRights,
} from "@/lib/taxonomy";
import type { Message } from "@/lib/types";

export type ActionResult<T = undefined> = {
  ok: boolean;
  demo?: boolean;
  error?: string;
  field?: string;
  data?: T;
};

export interface RequestInput {
  influencerUsername: string;
  title: string;
  goal: string;
  brief: string;
  key_messages: string;
  restrictions: string;
  deliverables: { type: ServiceType; count: number }[];
  compensation: CompensationType;
  budget_amount: string;
  currency: Currency;
  barter_description: string;
  barter_value: string;
  usage_rights: UsageRights;
  revisions: number;
  start_date: string;
  end_date: string;
  respond_by: string;
  ad_disclosure_ack: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const intOrNull = (v: string) => {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

function mapDbError(message: string | undefined, code: string | undefined): string {
  if (code === "23505") return "duplicate_pending";
  if (message?.includes("rate_limited")) return "rate_limited";
  if (message?.includes("invalid_status_transition")) return "invalid_transition";
  if (message?.includes("suspended")) return "suspended";
  if (code === "42501" || message?.includes("row-level security")) return "not_allowed";
  return "save_failed";
}

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Company → creator: new collaboration request (brief). */
export async function createRequest(input: RequestInput): Promise<ActionResult<{ id: string }>> {
  if (!isSupabaseConfigured) return { ok: true, demo: true, data: { id: "demo-r1" } };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };

  // --- Validation ---------------------------------------------------
  const title = input.title.trim();
  const brief = input.brief.trim();
  if (title.length < 3) return { ok: false, error: "required", field: "title" };
  if (brief.length < 20) return { ok: false, error: "brief_short", field: "brief" };
  const deliverables = input.deliverables.filter(
    (d) => SERVICE_TYPES.includes(d.type) && d.count >= 1 && d.count <= 20
  );
  if (deliverables.length === 0) return { ok: false, error: "required", field: "deliverables" };
  if (!COMPENSATION_TYPES.includes(input.compensation)) return { ok: false, error: "invalid" };
  if (!CURRENCIES.includes(input.currency)) return { ok: false, error: "invalid" };
  if (!USAGE_RIGHTS.includes(input.usage_rights)) return { ok: false, error: "invalid" };

  const budget = intOrNull(input.budget_amount);
  if (input.compensation !== "barter" && budget == null) {
    return { ok: false, error: "required", field: "budget_amount" };
  }
  const barterDescription = input.barter_description.trim();
  if (input.compensation !== "paid" && !barterDescription) {
    return { ok: false, error: "required", field: "barter_description" };
  }
  for (const k of ["start_date", "end_date", "respond_by"] as const) {
    if (input[k] && !DATE_RE.test(input[k])) return { ok: false, error: "invalid", field: k };
  }
  if (input.start_date && input.end_date && input.start_date > input.end_date) {
    return { ok: false, error: "dates_order", field: "end_date" };
  }
  if (!input.ad_disclosure_ack) {
    return { ok: false, error: "disclosure_required", field: "ad_disclosure_ack" };
  }

  // Resolve creator by username (RLS: only discoverable creators are visible)
  const { data: creator } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", input.influencerUsername.toLowerCase())
    .eq("role", "influencer")
    .maybeSingle();
  if (!creator) return { ok: false, error: "creator_not_found" };

  const { data, error } = await supabase
    .from("collaboration_requests")
    .insert({
      company_id: user.id,
      influencer_id: creator.id,
      title: title.slice(0, 120),
      goal: input.goal.trim().slice(0, 500) || null,
      brief: brief.slice(0, 3000),
      key_messages: input.key_messages.trim().slice(0, 1000) || null,
      restrictions: input.restrictions.trim().slice(0, 1000) || null,
      deliverables: deliverables.map((d) => d.type),
      deliverable_counts: deliverables.map((d) => Math.round(d.count)),
      compensation: input.compensation,
      budget_amount: input.compensation === "barter" ? null : budget,
      currency: input.currency,
      barter_description:
        input.compensation === "paid" ? null : barterDescription.slice(0, 500),
      barter_value: input.compensation === "paid" ? null : intOrNull(input.barter_value),
      usage_rights: input.usage_rights,
      revisions: Math.min(5, Math.max(0, Math.round(input.revisions))),
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      respond_by: input.respond_by || null,
      ad_disclosure_ack: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: mapDbError(error.message, error.code) };

  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id as string } };
}

/** Status transitions — the DB trigger enforces who may do what. */
export async function setRequestStatus(
  id: string,
  status: RequestStatus,
  reason?: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { error } = await supabase
    .from("collaboration_requests")
    .update({
      status,
      ...(status === "declined" && reason ? { decline_reason: reason.trim().slice(0, 500) } : {}),
    })
    .eq("id", id)
    .or(`company_id.eq.${user.id},influencer_id.eq.${user.id}`);

  if (error) return { ok: false, error: mapDbError(error.message, error.code) };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Marks the request as seen by the creator and the conversation as read.
 * Called while rendering the request page — no revalidation here.
 */
export async function markRequestRead(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { supabase, user } = await authed();
  if (!user) return;
  await Promise.all([
    // Trigger ignores this for anyone but the creator, and only once
    supabase
      .from("collaboration_requests")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("influencer_id", user.id)
      .is("viewed_at", null),
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("request_id", id)
      .eq("recipient_id", user.id)
      .is("read_at", null),
    supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("profile_id", user.id)
      .eq("data->>request_id", id)
      .is("read_at", null),
  ]);
}

export async function sendMessage(
  requestId: string,
  body: string
): Promise<ActionResult<Message>> {
  const text = body.trim();
  if (!text) return { ok: false, error: "required" };
  if (text.length > 2000) return { ok: false, error: "too_long" };
  if (!isSupabaseConfigured) {
    return {
      ok: true,
      demo: true,
      data: {
        id: `demo-${Date.now()}`,
        request_id: requestId,
        sender_id: "me",
        recipient_id: "",
        body: text,
        read_at: null,
        created_at: new Date().toISOString(),
      },
    };
  }
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data, error } = await supabase
    .from("messages")
    .insert({ request_id: requestId, sender_id: user.id, body: text })
    .select("*")
    .single();
  if (error) return { ok: false, error: mapDbError(error.message, error.code) };

  revalidatePath("/dashboard/requests", "page");
  return { ok: true, data: data as Message };
}

/** Realtime: recipient marks freshly received messages as read. */
export async function markMessagesRead(requestId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { supabase, user } = await authed();
  if (!user) return;
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .eq("recipient_id", user.id)
    .is("read_at", null);
}
