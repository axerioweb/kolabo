"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CREATORS_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AccountResult = { ok: boolean; demo?: boolean; error?: string; url?: string };

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Uploads a profile picture (creator) or logo (company) to
 * Storage `avatars/<uid>/…` and stores the public URL.
 */
export async function uploadAvatar(formData: FormData): Promise<AccountResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "no_file" };
  const ext = TYPES[file.type];
  if (!ext) return { ok: false, error: "file_type" };
  if (file.size > MAX_BYTES) return { ok: false, error: "file_size" };

  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const folder = user.id;
  const path = `${folder}/avatar-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (uploadError) return { ok: false, error: "upload_failed" };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } =
    profile?.role === "company"
      ? await supabase.from("companies").update({ logo_url: publicUrl }).eq("profile_id", user.id)
      : await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  if (error) return { ok: false, error: "save_failed" };

  // Remove previous pictures (keep storage tidy)
  const { data: files } = await supabase.storage.from("avatars").list(folder);
  const stale = (files ?? [])
    .map((f) => `${folder}/${f.name}`)
    .filter((p) => p !== path);
  if (stale.length) await supabase.storage.from("avatars").remove(stale);

  revalidateTag(PUBLIC_CREATORS_TAG);
  revalidatePath("/", "layout");
  return { ok: true, url: publicUrl };
}

export async function removeAvatar(): Promise<AccountResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files?.length) {
    await supabase.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));
  }
  await Promise.all([
    supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id),
    supabase.from("companies").update({ logo_url: null }).eq("profile_id", user.id),
  ]);
  revalidateTag(PUBLIC_CREATORS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateMarketingConsent(optIn: boolean): Promise<AccountResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };
  const { error } = await supabase
    .from("profiles")
    .update({ marketing_opt_in: optIn })
    .eq("id", user.id);
  if (error) return { ok: false, error: "save_failed" };
  revalidatePath("/dashboard/settings", "page");
  return { ok: true };
}

/**
 * GDPR / ZZPL čl. 30 — brisanje naloga. Fajlovi iz Storage-a se brišu
 * ovde, a nalog i svi povezani redovi kroz RPC delete_my_account()
 * (migracija 0011, pokreće se ručno u SQL editoru).
 */
export async function deleteAccount(confirmation: string): Promise<AccountResult> {
  if (!isSupabaseConfigured) return { ok: true, demo: true };
  if (confirmation.trim().toUpperCase() !== "OBRISI" && confirmation.trim().toUpperCase() !== "DELETE") {
    return { ok: false, error: "confirm_mismatch" };
  }
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files?.length) {
    await supabase.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    // PGRST202 = function not found (migration 0011 not applied yet)
    return {
      ok: false,
      error: error.code === "PGRST202" ? "deletion_unavailable" : error.message.includes("admin")
        ? "admin_cannot_delete"
        : "delete_failed",
    };
  }
  await supabase.auth.signOut();
  revalidateTag(PUBLIC_CREATORS_TAG);
  return { ok: true };
}
