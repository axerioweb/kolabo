import type { Metadata } from "next";
import { SITE_URL } from "./site";

/**
 * Metadata for a PUBLIC page. Next merges nested objects shallowly, so a
 * page that sets only `title` would inherit the layout's canonical ("/")
 * and the home OG title — every public page must go through this helper.
 */
export function publicMetadata({
  locale,
  title,
  description,
  sr,
  en,
  type = "website",
  noIndex = false,
}: {
  locale: string;
  title: string;
  description: string;
  /** Serbian path (no prefix), e.g. "/kreatori" */
  sr: string;
  /** English path WITH /en prefix, e.g. "/en/creators" */
  en: string;
  type?: "website" | "profile" | "article";
  noIndex?: boolean;
}): Metadata {
  const path = locale === "sr" ? sr : en;
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { sr, en, "x-default": sr },
    },
    openGraph: {
      type,
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: "Kolabo",
      locale: locale === "sr" ? "sr_RS" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
