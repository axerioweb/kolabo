import type { Country } from "./taxonomy";
import { RESERVED_USERNAMES } from "./taxonomy";

/** ISO 7064 MOD 11,10 — kontrolna cifra za srpski PIB i hrvatski OIB. */
function mod11_10(digits: string): boolean {
  let p = 10;
  for (let i = 0; i < digits.length - 1; i++) {
    let s = (Number(digits[i]) + p) % 10;
    if (s === 0) s = 10;
    p = (s * 2) % 11;
  }
  return (11 - p) % 10 === Number(digits[digits.length - 1]);
}

/** Srpski matični broj (8 cifara, težine 7-6-5-4-3-2-7). */
function serbianMb(digits: string): boolean {
  const w = [7, 6, 5, 4, 3, 2, 7];
  const sum = w.reduce((acc, wi, i) => acc + wi * Number(digits[i]), 0);
  let k = 11 - (sum % 11);
  if (k > 9) k = 0;
  return k === Number(digits[7]);
}

/**
 * Validacija poreskog broja po zemlji. Za RS i HR proverava i kontrolnu
 * cifru; za ostale zemlje samo format (dužina + cifre).
 */
export function isValidTaxId(country: Country, value: string): boolean {
  const v = value.replace(/[\s-]/g, "");
  switch (country) {
    case "RS":
      return /^\d{9}$/.test(v) && mod11_10(v);
    case "HR":
      return /^\d{11}$/.test(v) && mod11_10(v);
    case "BA":
    case "MK":
      return /^\d{13}$/.test(v);
    case "ME":
    case "SI":
      return /^\d{8}$/.test(v);
    default:
      return /^[0-9A-Za-z]{5,20}$/.test(v);
  }
}

export function isValidRegistrationNumber(country: Country, value: string): boolean {
  const v = value.replace(/[\s-]/g, "");
  if (country === "RS") return /^\d{8}$/.test(v) && serbianMb(v);
  return /^[0-9A-Za-z]{5,20}$/.test(v);
}

export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

export function normalizeUsername(v: string): string {
  return v.trim().toLowerCase().replace(/^@/, "");
}

/** Usernames that look like static files would be skipped by the middleware. */
const FILE_LIKE_RE = /\.(?:svg|png|jpe?g|gif|webp|avif|ico|txt|xml|json|webmanifest|js|css|map|woff2?)$/;

export function usernameError(v: string): "format" | "reserved" | null {
  const u = normalizeUsername(v);
  if (!USERNAME_RE.test(u) || FILE_LIKE_RE.test(u)) return "format";
  if (RESERVED_USERNAMES.includes(u)) return "reserved";
  return null;
}

/** Normalizes a website; returns null if it is not a plausible URL. */
export function normalizeUrl(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withProto);
    return u.hostname.includes(".") ? u.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
