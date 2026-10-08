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

/* ------------------------------------------------------------------ */
/* Companies (firme / brendovi)                                        */
/* ------------------------------------------------------------------ */

export const COMPANY_TYPES = ["legal_entity", "entrepreneur", "agency"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const COMPANY_TYPE_LABELS: Record<CompanyType, LocalizedLabel> = {
  legal_entity: { sr: "Pravno lice (d.o.o., a.d.)", en: "Company (LLC, JSC)" },
  entrepreneur: { sr: "Preduzetnik", en: "Sole trader" },
  agency: { sr: "Marketing agencija", en: "Marketing agency" },
};

export const COMPANY_INDUSTRIES = [
  "fashion_beauty",
  "food_drinks",
  "hospitality_travel",
  "health_fitness",
  "tech_electronics",
  "retail_ecommerce",
  "home_living",
  "kids_family",
  "finance_services",
  "automotive",
  "entertainment_events",
  "education",
  "agency",
  "other",
] as const;
export type CompanyIndustry = (typeof COMPANY_INDUSTRIES)[number];

export const COMPANY_INDUSTRY_LABELS: Record<CompanyIndustry, LocalizedLabel> = {
  fashion_beauty: { sr: "Moda i lepota", en: "Fashion & beauty" },
  food_drinks: { sr: "Hrana i piće", en: "Food & drinks" },
  hospitality_travel: { sr: "Turizam i ugostiteljstvo", en: "Hospitality & travel" },
  health_fitness: { sr: "Zdravlje i fitnes", en: "Health & fitness" },
  tech_electronics: { sr: "Tehnologija i elektronika", en: "Tech & electronics" },
  retail_ecommerce: { sr: "Maloprodaja i e-commerce", en: "Retail & e-commerce" },
  home_living: { sr: "Dom i enterijer", en: "Home & living" },
  kids_family: { sr: "Deca i porodica", en: "Kids & family" },
  finance_services: { sr: "Finansije i usluge", en: "Finance & services" },
  automotive: { sr: "Auto industrija", en: "Automotive" },
  entertainment_events: { sr: "Zabava i događaji", en: "Entertainment & events" },
  education: { sr: "Obrazovanje", en: "Education" },
  agency: { sr: "Agencija", en: "Agency" },
  other: { sr: "Ostalo", en: "Other" },
};

export const COMPANY_SIZES = ["solo", "2_10", "11_50", "51_200", "200_plus"] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const COMPANY_SIZE_LABELS: Record<CompanySize, LocalizedLabel> = {
  solo: { sr: "Samo ja", en: "Just me" },
  "2_10": { sr: "2–10 zaposlenih", en: "2–10 employees" },
  "11_50": { sr: "11–50 zaposlenih", en: "11–50 employees" },
  "51_200": { sr: "51–200 zaposlenih", en: "51–200 employees" },
  "200_plus": { sr: "200+ zaposlenih", en: "200+ employees" },
};

/** Naziv poreskog identifikatora po zemlji (PIB, OIB, JIB...). */
export const TAX_ID_LABELS: Partial<Record<Country, LocalizedLabel>> = {
  RS: { sr: "PIB", en: "Tax ID (PIB)" },
  HR: { sr: "OIB", en: "Tax ID (OIB)" },
  BA: { sr: "JIB", en: "Tax ID (JIB)" },
  ME: { sr: "PIB", en: "Tax ID (PIB)" },
  MK: { sr: "EDB", en: "Tax ID (EDB)" },
  SI: { sr: "Davčna številka", en: "Tax ID (DDV)" },
};

/* ------------------------------------------------------------------ */
/* Collaboration requests (upiti za saradnju)                          */
/* ------------------------------------------------------------------ */

export const REQUEST_STATUSES = [
  "pending",
  "accepted",
  "delivered",
  "completed",
  "declined",
  "cancelled",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const COMPENSATION_TYPES = ["paid", "barter", "paid_and_barter"] as const;
export type CompensationType = (typeof COMPENSATION_TYPES)[number];

export const COMPENSATION_LABELS: Record<CompensationType, LocalizedLabel> = {
  paid: { sr: "Plaćena saradnja", en: "Paid collaboration" },
  barter: { sr: "Barter (proizvodi/usluge)", en: "Barter (products/services)" },
  paid_and_barter: { sr: "Novac + barter", en: "Money + barter" },
};

export const USAGE_RIGHTS = [
  "organic_only",
  "repost",
  "paid_ads_30d",
  "paid_ads_90d",
  "unlimited",
] as const;
export type UsageRights = (typeof USAGE_RIGHTS)[number];

export const USAGE_RIGHTS_LABELS: Record<UsageRights, LocalizedLabel> = {
  organic_only: { sr: "Samo objava na profilu kreatora", en: "Creator's profile only" },
  repost: { sr: "Brend sme da podeli objavu", en: "Brand may repost" },
  paid_ads_30d: { sr: "Plaćeni oglasi do 30 dana", en: "Paid ads up to 30 days" },
  paid_ads_90d: { sr: "Plaćeni oglasi do 90 dana", en: "Paid ads up to 90 days" },
  unlimited: { sr: "Neograničeno korišćenje", en: "Unlimited usage" },
};

export const REPORT_REASONS = [
  "spam",
  "fake_profile",
  "inappropriate",
  "scam",
  "hidden_advertising",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, LocalizedLabel> = {
  spam: { sr: "Spam ili neželjene poruke", en: "Spam or unwanted messages" },
  fake_profile: { sr: "Lažan profil ili lažni pratioci", en: "Fake profile or followers" },
  inappropriate: { sr: "Neprimeren sadržaj ili ponašanje", en: "Inappropriate content or behaviour" },
  scam: { sr: "Prevara ili neisplata", en: "Scam or non-payment" },
  hidden_advertising: { sr: "Traži prikrivenu reklamu", en: "Asks for hidden advertising" },
  other: { sr: "Drugo", en: "Other" },
};

export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/**
 * Kategorije koje traže oprez kada publika uključuje maloletnike
 * (13–17): alkohol, kockanje, suplementi itd. Prikazujemo upozorenje
 * u formi upita — vidi docs/RESEARCH.md.
 */
export const REGULATED_INDUSTRIES: CompanyIndustry[] = ["food_drinks", "health_fitness"];

/** Rezervisana korisnička imena (kolizija sa rutama). */
export const RESERVED_USERNAMES = [
  "admin",
  "kategorija",
  "category",
  "kolabo",
  "panel",
  "dashboard",
  "api",
  "auth",
  "support",
  "podrska",
];

/** Granica za numeričke raspone publike — za filtere "od/do". */
export function followerRangeIndex(r: FollowerRange): number {
  return FOLLOWER_RANGES.indexOf(r);
}
