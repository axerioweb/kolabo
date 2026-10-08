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
    "/forgot-password": { sr: "/zaboravljena-lozinka", en: "/forgot-password" },
    "/reset-password": { sr: "/nova-lozinka", en: "/reset-password" },
    "/onboarding": { sr: "/podesavanje-profila", en: "/onboarding" },

    // Javni deo
    "/creators": { sr: "/kreatori", en: "/creators" },
    "/creators/[username]": { sr: "/kreatori/[username]", en: "/creators/[username]" },
    "/creators/category/[slug]": {
      sr: "/kreatori/kategorija/[slug]",
      en: "/creators/category/[slug]",
    },
    "/for-brands": { sr: "/za-brendove", en: "/for-brands" },

    // Panel (influenser + firma)
    "/dashboard": { sr: "/panel", en: "/dashboard" },
    "/dashboard/profile": { sr: "/panel/profil", en: "/dashboard/profile" },
    "/dashboard/notifications": {
      sr: "/panel/obavestenja",
      en: "/dashboard/notifications",
    },
    "/dashboard/requests": { sr: "/panel/upiti", en: "/dashboard/requests" },
    "/dashboard/requests/new": { sr: "/panel/upiti/novi", en: "/dashboard/requests/new" },
    "/dashboard/requests/[id]": {
      sr: "/panel/upiti/[id]",
      en: "/dashboard/requests/[id]",
    },
    "/dashboard/saved": { sr: "/panel/sacuvani", en: "/dashboard/saved" },
    "/dashboard/settings": { sr: "/panel/podesavanja", en: "/dashboard/settings" },

    // Admin
    "/admin": "/admin",
    "/admin/influencers": { sr: "/admin/influenseri", en: "/admin/influencers" },
    "/admin/companies": { sr: "/admin/kompanije", en: "/admin/companies" },
    "/admin/requests": { sr: "/admin/upiti", en: "/admin/requests" },
    "/admin/reports": { sr: "/admin/prijave", en: "/admin/reports" },

    "/privacy": { sr: "/privatnost", en: "/privacy" },
    "/terms": { sr: "/uslovi", en: "/terms" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
