import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * GDPR / ZZPL — pravo na prenosivost: korisnik preuzima sve svoje
 * podatke kao JSON. RLS garantuje da se vraćaju samo njegovi redovi.
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ demo: true }, { status: 200 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const uid = user.id;
  const [
    profile,
    company,
    socials,
    categories,
    services,
    collaboration,
    contact,
    requests,
    messages,
    reviewsGiven,
    reviewsReceived,
    saved,
    notifications,
    reports,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("companies").select("*").eq("profile_id", uid).maybeSingle(),
    supabase.from("social_accounts").select("*").eq("profile_id", uid),
    supabase.from("profile_categories").select("*").eq("profile_id", uid),
    supabase.from("services").select("*").eq("profile_id", uid),
    supabase.from("collaboration_prefs").select("*").eq("profile_id", uid).maybeSingle(),
    supabase.from("contact_prefs").select("*").eq("profile_id", uid).maybeSingle(),
    supabase
      .from("collaboration_requests")
      .select("*")
      .or(`company_id.eq.${uid},influencer_id.eq.${uid}`),
    supabase.from("messages").select("*").or(`sender_id.eq.${uid},recipient_id.eq.${uid}`),
    supabase.from("reviews").select("*").eq("reviewer_id", uid),
    supabase.from("reviews").select("*").eq("reviewee_id", uid),
    supabase.from("saved_influencers").select("*").eq("company_id", uid),
    supabase.from("notifications").select("*").eq("profile_id", uid),
    supabase.from("reports").select("*").eq("reporter_id", uid),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: uid, email: user.email, created_at: user.created_at },
    profile: profile.data,
    company: company.data,
    social_accounts: socials.data,
    categories: categories.data,
    services: services.data,
    collaboration_prefs: collaboration.data,
    contact_prefs: contact.data,
    collaboration_requests: requests.data,
    messages: messages.data,
    reviews_given: reviewsGiven.data,
    reviews_received: reviewsReceived.data,
    saved_creators: saved.data,
    notifications: notifications.data,
    reports: reports.data,
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kolabo-podaci-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
