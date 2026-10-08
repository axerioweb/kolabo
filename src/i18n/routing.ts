import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sr", "en"],
  defaultLocale: "sr",
  // Serbian URLs have no prefix (better for the Balkan market + SEO),
  // English lives under /en.
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/login": { sr: "/prijava", en: "/login" },
    "/signup": { sr: "/registracija", en: "/signup" },
    "/onboarding": { sr: "/podesavanje-profila", en: "/onboarding" },
    "/dashboard": { sr: "/panel", en: "/dashboard" },
    "/dashboard/profile": { sr: "/panel/profil", en: "/dashboard/profile" },
    "/dashboard/notifications": {
      sr: "/panel/obavestenja",
      en: "/dashboard/notifications",
    },
    "/admin": "/admin",
    "/admin/influencers": {
      sr: "/admin/influenseri",
      en: "/admin/influencers",
    },
    "/privacy": { sr: "/privatnost", en: "/privacy" },
    "/terms": { sr: "/uslovi", en: "/terms" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
