/**
 * Kolabo taxonomy — single source of truth for domain values.
 * Mirrors the Postgres enums + `categories` table in supabase/migrations.
 * Every entry carries sr/en labels so forms and stats stay bilingual.
 */

export type LocalizedLabel = { sr: string; en: string };

/* ------------------------------------------------------------------ */
/* Platforms (5 najpoznatijih mreža)                                   */
/* ------------------------------------------------------------------ */

export const PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: "#E1306C",
  tiktok: "#111111",
  youtube: "#FF0000",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
};

/* ------------------------------------------------------------------ */
/* Follower ranges (tiers)                                             */
/* ------------------------------------------------------------------ */

export const FOLLOWER_RANGES = [
  "lt_1k",
  "1k_5k",
  "5k_10k",
  "10k_25k",
  "25k_50k",
  "50k_100k",
  "100k_250k",
  "gt_250k",
] as const;
export type FollowerRange = (typeof FOLLOWER_RANGES)[number];

export const FOLLOWER_RANGE_LABELS: Record<FollowerRange, string> = {
  lt_1k: "< 1.000",
  "1k_5k": "1.000 – 5.000",
  "5k_10k": "5.000 – 10.000",
  "10k_25k": "10.000 – 25.000",
  "25k_50k": "25.000 – 50.000",
  "50k_100k": "50.000 – 100.000",
  "100k_250k": "100.000 – 250.000",
  gt_250k: "250.000+",
};

/** Marketing tier derived from the follower range (za statistiku). */
export const FOLLOWER_TIER: Record<
  FollowerRange,
  "nano" | "micro" | "mid" | "macro"
> = {
  lt_1k: "nano",
  "1k_5k": "nano",
  "5k_10k": "nano",
  "10k_25k": "micro",
  "25k_50k": "micro",
  "50k_100k": "micro",
  "100k_250k": "mid",
  gt_250k: "macro",
};

export const TIER_LABELS: Record<string, LocalizedLabel> = {
  nano: { sr: "Nano (do 10k)", en: "Nano (up to 10k)" },
  micro: { sr: "Mikro (10k–100k)", en: "Micro (10k–100k)" },
  mid: { sr: "Srednji (100k–250k)", en: "Mid (100k–250k)" },
  macro: { sr: "Makro (250k+)", en: "Macro (250k+)" },
};

/* ------------------------------------------------------------------ */
/* Content categories — grupisane, sr/en                               */
/* ------------------------------------------------------------------ */

export type CategoryGroupSlug =
  | "style"
  | "health"
  | "food"
  | "life"
  | "entertainment"
  | "knowledge"
  | "tech"
  | "other";

export const CATEGORY_GROUPS: Record<CategoryGroupSlug, LocalizedLabel> = {
  style: { sr: "Stil i lepota", en: "Style & Beauty" },
  health: { sr: "Zdravlje i sport", en: "Health & Sports" },
  food: { sr: "Hrana i piće", en: "Food & Drink" },
  life: { sr: "Životni stil", en: "Lifestyle" },
  entertainment: { sr: "Zabava i kultura", en: "Entertainment & Culture" },
  knowledge: { sr: "Znanje i biznis", en: "Knowledge & Business" },
  tech: { sr: "Tehnologija i gejming", en: "Tech & Gaming" },
  other: { sr: "Ostalo", en: "Other" },
};

export type Category = {
  slug: string;
  group: CategoryGroupSlug;
  label: LocalizedLabel;
  emoji: string;
};

export const CATEGORIES: Category[] = [
  // Stil i lepota
  { slug: "fashion", group: "style", emoji: "👗", label: { sr: "Moda i stil", en: "Fashion & Style" } },
  { slug: "beauty", group: "style", emoji: "💄", label: { sr: "Lepota i šminka", en: "Beauty & Makeup" } },
  { slug: "skincare", group: "style", emoji: "✨", label: { sr: "Nega kože i kose", en: "Skincare & Hair" } },
  // Zdravlje i sport
  { slug: "fitness", group: "health", emoji: "💪", label: { sr: "Fitnes i trening", en: "Fitness & Training" } },
  { slug: "wellness", group: "health", emoji: "🧘", label: { sr: "Zdravlje i wellness", en: "Health & Wellness" } },
  { slug: "sports", group: "health", emoji: "⚽", label: { sr: "Sport", en: "Sports" } },
  // Hrana i piće
  { slug: "food", group: "food", emoji: "🍳", label: { sr: "Hrana i kuvanje", en: "Food & Cooking" } },
  { slug: "restaurants", group: "food", emoji: "☕", label: { sr: "Restorani i kafići", en: "Restaurants & Cafés" } },
  // Životni stil
  { slug: "travel", group: "life", emoji: "✈️", label: { sr: "Putovanja", en: "Travel" } },
  { slug: "lifestyle", group: "life", emoji: "🌿", label: { sr: "Lifestyle", en: "Lifestyle" } },
  { slug: "parenting", group: "life", emoji: "👶", label: { sr: "Roditeljstvo i porodica", en: "Parenting & Family" } },
  { slug: "home", group: "life", emoji: "🏠", label: { sr: "Dom i enterijer", en: "Home & Interior" } },
  { slug: "diy", group: "life", emoji: "🧵", label: { sr: "DIY i ručni radovi", en: "DIY & Crafts" } },
  { slug: "pets", group: "life", emoji: "🐾", label: { sr: "Kućni ljubimci", en: "Pets" } },
  // Zabava i kultura
  { slug: "music", group: "entertainment", emoji: "🎵", label: { sr: "Muzika", en: "Music" } },
  { slug: "movies", group: "entertainment", emoji: "🎬", label: { sr: "Film i serije", en: "Movies & TV" } },
  { slug: "comedy", group: "entertainment", emoji: "😂", label: { sr: "Humor i zabava", en: "Comedy & Entertainment" } },
  { slug: "art", group: "entertainment", emoji: "🎨", label: { sr: "Umetnost i dizajn", en: "Art & Design" } },
  { slug: "photography", group: "entertainment", emoji: "📸", label: { sr: "Fotografija", en: "Photography" } },
  { slug: "books", group: "entertainment", emoji: "📚", label: { sr: "Knjige", en: "Books" } },
  { slug: "nightlife", group: "entertainment", emoji: "🎉", label: { sr: "Noćni život i događaji", en: "Nightlife & Events" } },
  // Znanje i biznis
  { slug: "business", group: "knowledge", emoji: "💼", label: { sr: "Biznis i preduzetništvo", en: "Business & Entrepreneurship" } },
  { slug: "finance", group: "knowledge", emoji: "📈", label: { sr: "Finansije i investicije", en: "Finance & Investing" } },
  { slug: "education", group: "knowledge", emoji: "🎓", label: { sr: "Obrazovanje", en: "Education" } },
  { slug: "science", group: "knowledge", emoji: "🔬", label: { sr: "Nauka", en: "Science" } },
  { slug: "sustainability", group: "knowledge", emoji: "🌍", label: { sr: "Ekologija i održivost", en: "Sustainability" } },
  // Tehnologija i gejming
  { slug: "gaming", group: "tech", emoji: "🎮", label: { sr: "Gejming", en: "Gaming" } },
  { slug: "tech", group: "tech", emoji: "📱", label: { sr: "Tehnologija i gedžeti", en: "Tech & Gadgets" } },
  { slug: "auto", group: "tech", emoji: "🚗", label: { sr: "Auto-moto", en: "Cars & Moto" } },
  // Ostalo
  { slug: "ugc", group: "other", emoji: "🎥", label: { sr: "UGC kreator", en: "UGC Creator" } },
];

/** Koliko kategorija influenser sme da izabere. */
export const MAX_CATEGORIES = 5;

/* ------------------------------------------------------------------ */
/* Services (tipovi usluga / deliverables)                             */
/* ------------------------------------------------------------------ */

export const SERVICE_TYPES = [
  "ig_post",
  "ig_story",
  "ig_reel",
  "tiktok_video",
  "yt_video",
  "yt_short",
  "fb_post",
  "li_post",
  "ugc_video",
  "event_appearance",
  "brand_ambassador",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_LABELS: Record<ServiceType, LocalizedLabel> = {
  ig_post: { sr: "Instagram objava", en: "Instagram post" },
  ig_story: { sr: "Instagram story", en: "Instagram story" },
  ig_reel: { sr: "Instagram reel", en: "Instagram reel" },
  tiktok_video: { sr: "TikTok video", en: "TikTok video" },
  yt_video: { sr: "YouTube video", en: "YouTube video" },
  yt_short: { sr: "YouTube short", en: "YouTube short" },
  fb_post: { sr: "Facebook objava", en: "Facebook post" },
  li_post: { sr: "LinkedIn objava", en: "LinkedIn post" },
  ugc_video: { sr: "UGC video (bez objave)", en: "UGC video (no posting)" },
  event_appearance: { sr: "Pojavljivanje na događaju", en: "Event appearance" },
  brand_ambassador: { sr: "Brend ambasador (mesečno)", en: "Brand ambassador (monthly)" },
};

export const SERVICE_PLATFORM: Record<ServiceType, Platform | null> = {
  ig_post: "instagram",
  ig_story: "instagram",
  ig_reel: "instagram",
  tiktok_video: "tiktok",
  yt_video: "youtube",
  yt_short: "youtube",
  fb_post: "facebook",
  li_post: "linkedin",
  ugc_video: null,
  event_appearance: null,
  brand_ambassador: null,
};

export const CURRENCIES = ["EUR", "RSD", "BAM", "MKD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/* ------------------------------------------------------------------ */
/* Barter (promotivni paketi u zameni za reklamu)                      */
/* ------------------------------------------------------------------ */

export const BARTER_PREFERENCES = ["yes", "no", "depends"] as const;
export type BarterPreference = (typeof BARTER_PREFERENCES)[number];

export const BARTER_PREF_LABELS: Record<BarterPreference, LocalizedLabel> = {
  yes: { sr: "Da, prihvatam barter", en: "Yes, I accept barter" },
  no: { sr: "Ne, samo plaćene saradnje", en: "No, paid collaborations only" },
  depends: { sr: "Zavisi od ponude", en: "Depends on the offer" },
};

export const BARTER_TYPES = [
  "products",
  "services",
  "travel",
  "events",
  "discounts",
] as const;
export type BarterType = (typeof BARTER_TYPES)[number];

export const BARTER_TYPE_LABELS: Record<BarterType, LocalizedLabel> = {
  products: { sr: "Proizvodi", en: "Products" },
  services: { sr: "Usluge", en: "Services" },
  travel: { sr: "Putovanja i smeštaj", en: "Travel & stays" },
  events: { sr: "Ulaznice i događaji", en: "Tickets & events" },
  discounts: { sr: "Popusti i vaučeri", en: "Discounts & vouchers" },
};

/* ------------------------------------------------------------------ */
/* Audience (publika)                                                  */
/* ------------------------------------------------------------------ */

export const AUDIENCE_GENDERS = ["mostly_female", "mostly_male", "mixed"] as const;
export type AudienceGender = (typeof AUDIENCE_GENDERS)[number];

export const AUDIENCE_GENDER_LABELS: Record<AudienceGender, LocalizedLabel> = {
  mostly_female: { sr: "Pretežno ženska", en: "Mostly female" },
  mostly_male: { sr: "Pretežno muška", en: "Mostly male" },
  mixed: { sr: "Mešovita", en: "Mixed" },
};

export const AGE_RANGES = ["13_17", "18_24", "25_34", "35_44", "45_plus"] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  "13_17": "13–17",
  "18_24": "18–24",
  "25_34": "25–34",
  "35_44": "35–44",
  "45_plus": "45+",
};

export const COUNTRIES = [
  "RS",
  "HR",
  "BA",
  "ME",
  "MK",
  "SI",
  "AL",
  "XK",
  "diaspora",
  "other",
] as const;
export type Country = (typeof COUNTRIES)[number];

export const COUNTRY_LABELS: Record<Country, LocalizedLabel> = {
  RS: { sr: "Srbija", en: "Serbia" },
  HR: { sr: "Hrvatska", en: "Croatia" },
  BA: { sr: "Bosna i Hercegovina", en: "Bosnia & Herzegovina" },
  ME: { sr: "Crna Gora", en: "Montenegro" },
  MK: { sr: "Severna Makedonija", en: "North Macedonia" },
  SI: { sr: "Slovenija", en: "Slovenia" },
  AL: { sr: "Albanija", en: "Albania" },
  XK: { sr: "Kosovo*", en: "Kosovo*" },
  diaspora: { sr: "Dijaspora (EU/svet)", en: "Diaspora (EU/world)" },
  other: { sr: "Ostalo", en: "Other" },
};

/* ------------------------------------------------------------------ */
/* Contact & notifications                                             */
/* ------------------------------------------------------------------ */

export const CONTACT_CHANNELS = [
  "platform",
  "email",
  "phone",
  "whatsapp",
  "viber",
  "instagram_dm",
] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, LocalizedLabel> = {
  platform: { sr: "Poruke na Kolabo platformi", en: "Kolabo platform messages" },
  email: { sr: "Email", en: "Email" },
  phone: { sr: "Telefonski poziv", en: "Phone call" },
  whatsapp: { sr: "WhatsApp", en: "WhatsApp" },
  viber: { sr: "Viber", en: "Viber" },
  instagram_dm: { sr: "Instagram DM", en: "Instagram DM" },
};

export const GENDERS = ["female", "male", "other", "prefer_not"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, LocalizedLabel> = {
  female: { sr: "Ženski", en: "Female" },
  male: { sr: "Muški", en: "Male" },
  other: { sr: "Drugo", en: "Other" },
  prefer_not: { sr: "Ne želim da navedem", en: "Prefer not to say" },
};

export const CONTENT_LANGUAGES = [
  { code: "sr", label: { sr: "Srpski", en: "Serbian" } },
  { code: "hr", label: { sr: "Hrvatski", en: "Croatian" } },
  { code: "bs", label: { sr: "Bosanski", en: "Bosnian" } },
  { code: "me", label: { sr: "Crnogorski", en: "Montenegrin" } },
  { code: "mk", label: { sr: "Makedonski", en: "Macedonian" } },
  { code: "sl", label: { sr: "Slovenački", en: "Slovenian" } },
  { code: "sq", label: { sr: "Albanski", en: "Albanian" } },
  { code: "en", label: { sr: "Engleski", en: "English" } },
] as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function label(l: LocalizedLabel, locale: string): string {
  return locale === "en" ? l.en : l.sr;
}
