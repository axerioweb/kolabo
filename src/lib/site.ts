/** Canonical site URL — set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kolabo.rs";

export const SITE_NAME = "Kolabo";

/**
 * Podaci o pružaocu usluge — Zakon o elektronskoj trgovini (čl. 6) traži
 * da budu javno dostupni (footer + uslovi korišćenja).
 * TODO(vlasnik): popuniti pravim podacima pre lansiranja.
 */
export const LEGAL_ENTITY = {
  name: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "Kolabo (naziv pravnog lica — popuniti)",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "Adresa sedišta — popuniti",
  registrationNumber: process.env.NEXT_PUBLIC_LEGAL_MB ?? "—",
  taxId: process.env.NEXT_PUBLIC_LEGAL_PIB ?? "—",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@kolabo.rs",
};
