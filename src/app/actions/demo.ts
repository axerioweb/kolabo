"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_ROLE_COOKIE } from "@/lib/session";

/** Demo mode only: switch which role the UI previews. */
export async function setDemoRole(role: "influencer" | "company" | "admin") {
  if (isSupabaseConfigured) return { ok: false };
  (await cookies()).set(DEMO_ROLE_COOKIE, role, { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true };
}
