import { getTranslations } from "next-intl/server";
import { categoryBySlug, label } from "@/lib/taxonomy";
import { ogImage, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Kolabo";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const category = categoryBySlug(slug);
  const t = await getTranslations({ locale, namespace: "og" });
  const name = category ? label(category.label, locale) : "Kolabo";
  return ogImage({
    kicker: t("categoryKicker"),
    title: `${category?.emoji ?? ""} ${t("categoryTitle", { category: name })}`.trim(),
    subtitle: t("tagline"),
    footer: "kolabo.rs",
    footerTag: t("footerTag"),
  });
}
