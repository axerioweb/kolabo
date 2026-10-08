"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const locale = await getLocale();
  redirect({ href: "/", locale });
}
