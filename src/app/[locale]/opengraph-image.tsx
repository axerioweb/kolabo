import { getTranslations } from "next-intl/server";
import { ogImage, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Kolabo";

/** Default OG card for the landing page and every page without its own. */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "og" });
  return ogImage({
    title: t("homeTitle"),
    subtitle: t("tagline"),
    chips: [t("chip1"), t("chip2"), t("chip3")],
    footer: "kolabo.rs",
    footerTag: t("footerTag"),
  });
}
