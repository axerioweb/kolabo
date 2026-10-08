import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, locale: string = "sr"): string {
  return new Intl.NumberFormat(locale === "sr" ? "sr-Latn-RS" : "en-US").format(
    n
  );
}

export function formatPrice(
  min: number | null,
  max: number | null,
  currency: string,
  locale: string = "sr"
): string {
  const fmt = (v: number) => formatNumber(v, locale);
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)} ${currency}`;
  if (min != null) return `${locale === "en" ? "from" : "od"} ${fmt(min)} ${currency}`;
  if (max != null) return `${locale === "en" ? "up to" : "do"} ${fmt(max)} ${currency}`;
  return locale === "en" ? "On request" : "Na upit";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
