import type { InfluencerFull, AppNotification } from "./types";

/**
 * Demo podaci — koriste se dok Supabase nije konfigurisan (demo mode),
 * da bi dashboard i admin panel imali smislen prikaz za pregled dizajna.
 * Svi profili su izmišljeni.
 */

function demoInfluencer(
  i: number,
  data: Partial<InfluencerFull["profile"]> & {
    socials?: InfluencerFull["socials"];
    categories?: string[];
    services?: InfluencerFull["services"];
    collaboration?: InfluencerFull["collaboration"];
  }
): InfluencerFull {
  const id = `demo-${i}`;
  const { socials, categories, services, collaboration, ...profile } = data;
  return {
    profile: {
      id,
      role: "influencer",
      status: "active",
      full_name: profile.full_name ?? `Demo ${i}`,
      username: profile.username ?? `demo${i}`,
      avatar_url: null,
      bio: profile.bio ?? null,
      birth_year: profile.birth_year ?? 1999,
      gender: profile.gender ?? "female",
      country: profile.country ?? "RS",
      city: profile.city ?? "Beograd",
      content_languages: profile.content_languages ?? ["sr"],
      onboarding_completed: true,
      created_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    },
    socials: socials ?? [],
    categories: categories ?? [],
    services: services ?? [],
    collaboration: collaboration ?? null,
    contact: {
      profile_id: id,
      contact_email: `demo${i}@example.com`,
      phone: null,
      preferred_channel: "platform",
      allowed_channels: ["platform", "email", "instagram_dm"],
      allow_platform_messages: true,
      email_notifications: true,
    },
  };
}

function social(
  profileId: string,
  platform: InfluencerFull["socials"][number]["platform"],
  handle: string,
  range: InfluencerFull["socials"][number]["follower_range"],
  er: number,
  primary = false
): InfluencerFull["socials"][number] {
  return {
    id: `${profileId}-${platform}`,
    profile_id: profileId,
    platform,
    handle,
    profile_url: null,
    follower_range: range,
    followers_exact: null,
    engagement_rate: er,
    avg_views: null,
    audience_gender: "mostly_female",
    audience_top_age: "18_24",
    audience_countries: ["RS", "BA"],
    is_primary: primary,
  };
}

export const DEMO_INFLUENCERS: InfluencerFull[] = [
  demoInfluencer(1, {
    full_name: "Milica Jovanović",
    username: "milica.style",
    city: "Beograd",
    country: "RS",
    bio: "Moda, lepota i svakodnevne kombinacije. Sarađujem sa domaćim brendovima.",
    categories: ["fashion", "beauty", "lifestyle"],
    socials: [
      social("demo-1", "instagram", "@milica.style", "25k_50k", 4.2, true),
      social("demo-1", "tiktok", "@milica.style", "10k_25k", 7.8),
    ],
    services: [
      { id: "s1", profile_id: "demo-1", service_type: "ig_post", price_min: 80, price_max: 150, currency: "EUR" },
      { id: "s2", profile_id: "demo-1", service_type: "ig_reel", price_min: 120, price_max: 250, currency: "EUR" },
      { id: "s3", profile_id: "demo-1", service_type: "ig_story", price_min: 40, price_max: 80, currency: "EUR" },
    ],
    collaboration: {
      profile_id: "demo-1",
      barter: "depends",
      barter_types: ["products", "travel"],
      barter_min_value: 100,
      min_budget: 50,
      currency: "EUR",
      open_to_travel: true,
      notes: null,
    },
  }),
  demoInfluencer(2, {
    full_name: "Stefan Petrović",
    username: "stefan.gains",
    city: "Novi Sad",
    country: "RS",
    gender: "male",
    bio: "Fitnes trener. Treninzi, ishrana i transformacije.",
    categories: ["fitness", "wellness", "food"],
    socials: [
      social("demo-2", "instagram", "@stefan.gains", "50k_100k", 3.1, true),
      social("demo-2", "youtube", "Stefan Gains", "10k_25k", 5.5),
    ],
    services: [
      { id: "s4", profile_id: "demo-2", service_type: "ig_reel", price_min: 150, price_max: 300, currency: "EUR" },
      { id: "s5", profile_id: "demo-2", service_type: "yt_video", price_min: 300, price_max: 600, currency: "EUR" },
    ],
    collaboration: {
      profile_id: "demo-2",
      barter: "no",
      barter_types: [],
      barter_min_value: null,
      min_budget: 150,
      currency: "EUR",
      open_to_travel: false,
      notes: null,
    },
  }),
  demoInfluencer(3, {
    full_name: "Ana Kovač",
    username: "ana.putuje",
    city: "Zagreb",
    country: "HR",
    bio: "Putovanja po Balkanu i Evropi — skriveni dragulji i budget saveti.",
    categories: ["travel", "photography", "lifestyle"],
    socials: [
      social("demo-3", "instagram", "@ana.putuje", "10k_25k", 6.4, true),
      social("demo-3", "tiktok", "@ana.putuje", "25k_50k", 9.1),
    ],
    services: [
      { id: "s6", profile_id: "demo-3", service_type: "ig_post", price_min: 60, price_max: 120, currency: "EUR" },
      { id: "s7", profile_id: "demo-3", service_type: "tiktok_video", price_min: 90, price_max: 180, currency: "EUR" },
    ],
    collaboration: {
      profile_id: "demo-3",
      barter: "yes",
      barter_types: ["travel", "events", "services"],
      barter_min_value: 80,
      min_budget: null,
      currency: "EUR",
      open_to_travel: true,
      notes: null,
    },
  }),
  demoInfluencer(4, {
    full_name: "Marko Ilić",
    username: "marko.plays",
    city: "Niš",
    country: "RS",
    gender: "male",
    bio: "Gejming, tech recenzije i live streamovi.",
    categories: ["gaming", "tech"],
    socials: [
      social("demo-4", "youtube", "MarkoPlays", "25k_50k", 4.8, true),
      social("demo-4", "tiktok", "@marko.plays", "5k_10k", 11.2),
    ],
    services: [
      { id: "s8", profile_id: "demo-4", service_type: "yt_video", price_min: 200, price_max: 400, currency: "EUR" },
      { id: "s9", profile_id: "demo-4", service_type: "yt_short", price_min: 80, price_max: 150, currency: "EUR" },
    ],
    collaboration: {
      profile_id: "demo-4",
      barter: "depends",
      barter_types: ["products"],
      barter_min_value: 150,
      min_budget: 80,
      currency: "EUR",
      open_to_travel: false,
      notes: null,
    },
  }),
  demoInfluencer(5, {
    full_name: "Jelena Đorđević",
    username: "jelena.kuva",
    city: "Banja Luka",
    country: "BA",
    bio: "Domaći recepti na moderan način. Saradnje sa food brendovima.",
    categories: ["food", "restaurants", "home"],
    socials: [
      social("demo-5", "instagram", "@jelena.kuva", "10k_25k", 5.9, true),
      social("demo-5", "facebook", "Jelena Kuva", "25k_50k", 2.4),
    ],
    services: [
      { id: "s10", profile_id: "demo-5", service_type: "ig_reel", price_min: 70, price_max: 140, currency: "EUR" },
      { id: "s11", profile_id: "demo-5", service_type: "ugc_video", price_min: 100, price_max: 200, currency: "EUR" },
    ],
    collaboration: {
      profile_id: "demo-5",
      barter: "yes",
      barter_types: ["products", "discounts"],
      barter_min_value: 50,
      min_budget: null,
      currency: "EUR",
      open_to_travel: true,
      notes: null,
    },
  }),
  demoInfluencer(6, {
    full_name: "Nikola Vuković",
    username: "nikola.biz",
    city: "Podgorica",
    country: "ME",
    gender: "male",
    bio: "Preduzetništvo i lične finansije za mlade.",
    categories: ["business", "finance", "education"],
    socials: [
      social("demo-6", "linkedin", "Nikola Vuković", "5k_10k", 3.8, true),
      social("demo-6", "instagram", "@nikola.biz", "10k_25k", 4.5),
    ],
    services: [
      { id: "s12", profile_id: "demo-6", service_type: "li_post", price_min: 90, price_max: 180, currency: "EUR" },
      { id: "s13", profile_id: "demo-6", service_type: "ig_reel", price_min: 100, price_max: 200, currency: "EUR" },
    ],
    collaboration: {
      profile_id: "demo-6",
      barter: "no",
      barter_types: [],
      barter_min_value: null,
      min_budget: 100,
      currency: "EUR",
      open_to_travel: false,
      notes: null,
    },
  }),
];

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    profile_id: "demo-1",
    type: "collaboration",
    title: "Nova prilika za saradnju",
    body: "Brend iz kategorije Lepota i šminka traži mikro influensere iz Srbije.",
    link: null,
    read_at: null,
    created_at: new Date(Date.now() - 3600e3 * 5).toISOString(),
  },
  {
    id: "n2",
    profile_id: "demo-1",
    type: "system",
    title: "Dobrodošla na Kolabo 🎉",
    body: "Tvoj profil je aktivan. Dopuni cene usluga da bi te brendovi lakše pronašli.",
    link: null,
    read_at: null,
    created_at: new Date(Date.now() - 86400e3).toISOString(),
  },
  {
    id: "n3",
    profile_id: "demo-1",
    type: "reminder",
    title: "Dopuni statistiku publike",
    body: "Profili sa podacima o publici dobijaju 3x više upita.",
    link: null,
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400e3 * 3).toISOString(),
  },
];
