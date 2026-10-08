import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/taxonomy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicUsernames } from "@/lib/queries";

// Regenerate hourly so new public profiles get discovered
export const revalidate = 3600;

type Href = Parameters<typeof getPathname>[0]["href"];

function entry(
  href: Href,
  opts: { priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }
): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, SITE_URL + getPathname({ locale, href })])
  );
  return {
    url: SITE_URL + getPathname({ locale: routing.defaultLocale, href }),
    lastModified: new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  };
}

/** Public, indexable routes only. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    entry("/", { priority: 1, changeFrequency: "weekly" }),
    entry("/creators", { priority: 0.9, changeFrequency: "daily" }),
    entry("/for-brands", { priority: 0.8, changeFrequency: "monthly" }),
    entry("/signup", { priority: 0.6, changeFrequency: "monthly" }),
    entry("/privacy", { priority: 0.3, changeFrequency: "yearly" }),
    entry("/terms", { priority: 0.3, changeFrequency: "yearly" }),
    ...CATEGORIES.map((c) =>
      entry(
        { pathname: "/creators/category/[slug]", params: { slug: c.slug } },
        { priority: 0.7, changeFrequency: "daily" }
      )
    ),
  ];

  if (isSupabaseConfigured) {
    const usernames = await getPublicUsernames(createPublicClient());
    pages.push(
      ...usernames.map((username) =>
        entry(
          { pathname: "/creators/[username]", params: { username } },
          { priority: 0.6, changeFrequency: "weekly" }
        )
      )
    );
  }

  return pages;
}
