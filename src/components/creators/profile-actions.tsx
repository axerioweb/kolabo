"use client";

import { useEffect, useState } from "react";
import { Pencil, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/creators/save-button";
import { ReportDialog } from "@/components/community/report-dialog";

type Viewer =
  | { kind: "loading" }
  | { kind: "anon" }
  | { kind: "owner" }
  | { kind: "company"; saved: boolean }
  | { kind: "other" };

/**
 * Session-dependent actions on the (statically rendered) public profile.
 * Reads only — writes go through Server Actions.
 */
export function ProfileActions({
  influencerId,
  username,
}: {
  influencerId: string;
  username: string;
}) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const [viewer, setViewer] = useState<Viewer>(
    isSupabaseConfigured ? { kind: "loading" } : { kind: "company", saved: false }
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user.id;
      if (!uid) return setViewer({ kind: "anon" });
      if (uid === influencerId) return setViewer({ kind: "owner" });
      const { data: me } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      if (me?.role !== "company") return setViewer({ kind: "other" });
      const { data: saved } = await supabase
        .from("saved_influencers")
        .select("influencer_id")
        .eq("company_id", uid)
        .eq("influencer_id", influencerId)
        .maybeSingle();
      setViewer({ kind: "company", saved: !!saved });
    })();
  }, [influencerId]);

  const requestHref = {
    pathname: "/dashboard/requests/new" as const,
    query: { creator: username },
  };

  if (viewer.kind === "loading") {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="h-11 animate-pulse rounded-full bg-line motion-reduce:animate-none" />
        <div className="h-11 animate-pulse rounded-full bg-surface-soft motion-reduce:animate-none" />
      </div>
    );
  }

  if (viewer.kind === "owner") {
    return (
      <div className="space-y-3">
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">{t("ownerNote")}</p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/dashboard/profile">
            <Pencil className="h-4 w-4" />
            {t("editProfile")}
          </Link>
        </Button>
      </div>
    );
  }

  if (viewer.kind === "anon") {
    const next = getPathname({ locale, href: requestHref });
    return (
      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link href={{ pathname: "/signup", query: { tip: "brend" } }}>
            <Send className="h-4 w-4" />
            {t("sendRequest")}
          </Link>
        </Button>
        <p className="text-center text-xs text-muted">
          {t("haveBrandAccount")}{" "}
          <Link
            href={{ pathname: "/login", query: { next } }}
            className="font-semibold text-brand-600 hover:underline"
          >
            {t("loginToSend")}
          </Link>
        </p>
      </div>
    );
  }

  if (viewer.kind === "company") {
    return (
      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link href={requestHref}>
            <Send className="h-4 w-4" />
            {t("sendRequest")}
          </Link>
        </Button>
        <div className="flex justify-center">
          <SaveButton influencerId={influencerId} saved={viewer.saved} variant="button" />
        </div>
        <div className="flex justify-center pt-1">
          <ReportDialog targetId={influencerId} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <ReportDialog targetId={influencerId} />
    </div>
  );
}
