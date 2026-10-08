import { BadgeCheck, MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { InfluencerFull } from "@/lib/types";
import {
  categoryBySlug,
  COUNTRY_LABELS,
  FOLLOWER_RANGE_LABELS,
  label,
  SERVICE_LABELS,
} from "@/lib/taxonomy";
import { SocialIcon } from "@/components/social-icons";
import { Badge } from "@/components/ui/badge";
import { formatPrice, initials } from "@/lib/utils";

/** Public-style profile preview — "how brands see you". */
export async function ProfileCard({ full }: { full: InfluencerFull }) {
  const locale = await getLocale();
  const t = await getTranslations("dashboard");
  const { profile } = full;

  const barterTone =
    full.collaboration?.barter === "yes"
      ? "success"
      : full.collaboration?.barter === "no"
        ? "neutral"
        : "warning";
  const barterLabel =
    full.collaboration?.barter === "yes"
      ? t("barterYes")
      : full.collaboration?.barter === "no"
        ? t("barterNo")
        : t("barterDepends");

  return (
    <div className="card overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500" />
      <div className="p-6">
        <div className="-mt-14 flex items-end gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-500 to-accent-500 font-display text-2xl font-bold text-white shadow-soft">
            {initials(profile.full_name)}
          </div>
          <div className="pb-1">
            <p className="flex items-center gap-1.5 font-display text-lg font-bold">
              {profile.full_name}
              <BadgeCheck className="h-5 w-5 text-brand-500" />
            </p>
            <p className="text-sm text-muted">
              {profile.username && <>@{profile.username} · </>}
              <MapPin className="mr-0.5 inline h-3.5 w-3.5" />
              {profile.city}
              {profile.country &&
                `, ${label(COUNTRY_LABELS[profile.country], locale)}`}
            </p>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            {profile.bio}
          </p>
        )}

        {full.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {full.categories.map((slug) => {
              const c = categoryBySlug(slug);
              if (!c) return null;
              return (
                <Badge key={slug} tone="brand">
                  <span aria-hidden>{c.emoji}</span>
                  {label(c.label, locale)}
                </Badge>
              );
            })}
          </div>
        )}

        {full.socials.length > 0 && (
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {full.socials.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl bg-surface-soft px-4 py-3"
              >
                <SocialIcon platform={s.platform} className="text-ink-soft" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.handle}</p>
                  <p className="text-xs text-muted">
                    {FOLLOWER_RANGE_LABELS[s.follower_range]}
                    {s.engagement_rate != null && ` · ER ${s.engagement_rate}%`}
                  </p>
                </div>
                {s.is_primary && (
                  <Badge tone="accent" className="!px-2 !py-0.5">
                    ★
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {full.services.length > 0 && (
          <div className="mt-5 space-y-1.5">
            {full.services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="text-ink-soft">
                  {label(SERVICE_LABELS[s.service_type], locale)}
                </span>
                <span className="font-semibold">
                  {formatPrice(s.price_min, s.price_max, s.currency, locale)}
                </span>
              </div>
            ))}
          </div>
        )}

        {full.collaboration && (
          <div className="mt-5">
            <Badge tone={barterTone}>{barterLabel}</Badge>
          </div>
        )}
      </div>
    </div>
  );
}
