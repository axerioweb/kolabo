import { getTranslations } from "next-intl/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicCreator } from "@/lib/queries";
import { demoPublicCreator } from "@/lib/demo-data";
import { categoryBySlug, COUNTRY_LABELS, FOLLOWER_RANGE_LABELS, label, PLATFORM_LABELS } from "@/lib/taxonomy";
import { ogImage, OG_SIZE } from "@/lib/og";
import { initials } from "@/lib/utils";

export const revalidate = 3600;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Kolabo";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  const u = decodeURIComponent(username).toLowerCase();
  const creator = isSupabaseConfigured
    ? await getPublicCreator(createPublicClient(), u)
    : demoPublicCreator(u);
  const t = await getTranslations({ locale, namespace: "og" });

  if (!creator) {
    return ogImage({ title: "Kolabo", subtitle: t("tagline"), footer: "kolabo.rs", footerTag: t("footerTag") });
  }

  const p = creator.profile;
  const primary = [...creator.socials].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
  const place = [p.city, p.country && label(COUNTRY_LABELS[p.country], locale)].filter(Boolean).join(", ");
  const chips = creator.categories
    .map((s) => categoryBySlug(s))
    .filter(Boolean)
    .map((c) => `${c!.emoji} ${label(c!.label, locale)}`);
  if (primary) chips.unshift(`${PLATFORM_LABELS[primary.platform]} ${FOLLOWER_RANGE_LABELS[primary.follower_range]}`);

  return ogImage({
    kicker: t("creatorKicker"),
    title: p.full_name,
    subtitle: [`@${p.username}`, place].filter(Boolean).join(" · "),
    chips,
    image: p.avatar_url,
    initials: initials(p.full_name),
    footer: `kolabo.rs/kreatori/${p.username}`,
    footerTag: t("footerTag"),
  });
}
