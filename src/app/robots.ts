import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/en/admin",
          "/panel",
          "/en/dashboard",
          "/podesavanje-profila",
          "/en/onboarding",
          "/prijava",
          "/en/login",
          "/zaboravljena-lozinka",
          "/en/forgot-password",
          "/nova-lozinka",
          "/en/reset-password",
          "/auth",
          "/api",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
