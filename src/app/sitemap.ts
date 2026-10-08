import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";

/** Public, indexable routes only. */
const publicPaths = ["/", "/login", "/signup", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((href) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        SITE_URL + getPathname({ locale, href }),
      ])
    );

    return {
      url: SITE_URL + getPathname({ locale: routing.defaultLocale, href }),
      lastModified: new Date(),
      changeFrequency: href === "/" ? "weekly" : "monthly",
      priority: href === "/" ? 1 : 0.6,
      alternates: { languages },
    };
  });
}
