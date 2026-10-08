import { BadgeCheck, MapPin, Star, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CreatorCardData } from "@/lib/types";
import {
  categoryBySlug,
  COUNTRY_LABELS,
  FOLLOWER_RANGE_LABELS,
  label,
} from "@/lib/taxonomy";
import { Avatar } from "@/components/ui/avatar";
import { SocialIcon } from "@/components/social-icons";
import { SaveButton } from "@/components/creators/save-button";
import { formatNumber } from "@/lib/utils";

/** Search result card. Whole card links to the public profile. */
export function CreatorCard({
  creator,
  saved,
  canSave,
}: {
  creator: CreatorCardData;
  saved?: boolean;
  canSave?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("creators");
  const primary = creator.socials[0];
  const location = [creator.city, creator.country && label(COUNTRY_LABELS[creator.country], locale)]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="card group relative flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      {canSave && (
        <div className="absolute top-4 right-4 z-10">
          <SaveButton influencerId={creator.id} saved={!!saved} />
        </div>
      )}
      <div className="flex items-center gap-3.5 pr-12">
        <Avatar src={creator.avatar_url} name={creator.full_name} size={56} />
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 font-display text-base font-bold">
            <Link
              href={{ pathname: "/creators/[username]", params: { username: creator.username } }}
              className="truncate after:absolute after:inset-0 after:rounded-[var(--radius-card)] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-400 focus-visible:after:ring-offset-2"
            >
              {creator.full_name}
            </Link>
            {creator.verified && (
              <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-brand-500" aria-label={t("verified")} />
            )}
          </h2>
          <p className="truncate text-sm text-muted">@{creator.username}</p>
          {location && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" />
              {location}
            </p>
          )}
        </div>
      </div>

      {creator.response_rate != null && creator.response_rate >= 70 && creator.median_response_hours != null && (
        <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <Zap className="h-3.5 w-3.5" aria-hidden />
          {t("respondsIn", { hours: Math.max(1, creator.median_response_hours) })}
          <span className="font-normal text-emerald-700/80">· {t("responseRate", { rate: creator.response_rate })}</span>
        </p>
      )}

      {creator.bio && (
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-soft">{creator.bio}</p>
      )}

      {creator.categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {creator.categories.slice(0, 3).map((slug) => {
            const c = categoryBySlug(slug);
            if (!c) return null;
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
              >
                <span aria-hidden>{c.emoji}</span>
                {label(c.label, locale)}
              </span>
            );
          })}
          {creator.categories.length > 3 && (
            <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-muted">
              +{creator.categories.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            {primary ? (
              <>
                <SocialIcon platform={primary.platform} className="h-4.5 w-4.5 shrink-0 text-ink-soft" />
                <span className="truncate font-semibold">
                  {FOLLOWER_RANGE_LABELS[primary.follower_range]}
                </span>
                {creator.socials.length > 1 && (
                  <span className="text-xs text-muted">+{creator.socials.length - 1}</span>
                )}
              </>
            ) : (
              <span className="text-muted">—</span>
            )}
          </div>
          <div className="shrink-0 text-right">
            {creator.min_price_eur != null ? (
              <span className="font-semibold">
                {t("fromPrice", { price: formatNumber(Math.round(creator.min_price_eur), locale) })}
              </span>
            ) : creator.barter === "yes" ? (
              <span className="font-semibold text-emerald-700">{t("barterOk")}</span>
            ) : (
              <span className="text-muted">{t("onRequest")}</span>
            )}
          </div>
        </div>
        {(creator.rating != null || primary?.engagement_rate != null) && (
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            {primary?.engagement_rate != null ? (
              <span>{t("engagement", { value: primary.engagement_rate })}</span>
            ) : (
              <span />
            )}
            {creator.rating != null && (
              <span className="flex items-center gap-1 font-semibold text-ink-soft">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {creator.rating.toFixed(1)}
                <span className="font-normal text-muted">({creator.reviews_count})</span>
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
