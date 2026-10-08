import type {
  AppNotification,
  CompanyFull,
  CreatorCardData,
  InboxItem,
  InfluencerFull,
  Message,
  PublicCreator,
  RequestDetail,
  SessionContext,
} from "./types";
import { FOLLOWER_RANGES } from "./taxonomy";

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
      verified_at: i <= 3 ? new Date(Date.now() - i * 86400000).toISOString() : null,
      terms_accepted_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      marketing_opt_in: false,
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
    template: "request_new",
    data: { request_id: "demo-r1", name: "Zdravo Organic", title: "Jesenja kampanja — nova granola" },
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
    template: null,
    data: {},
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
    template: null,
    data: {},
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400e3 * 3).toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/* Firme, upiti i poruke (demo)                                        */
/* ------------------------------------------------------------------ */

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
const day = (daysFromNow: number) =>
  new Date(now + 86400e3 * daysFromNow).toISOString().slice(0, 10);

export const DEMO_COMPANY: CompanyFull = {
  profile: {
    ...DEMO_INFLUENCERS[0].profile,
    id: "demo-company",
    role: "company",
    full_name: "Marko Petrović",
    username: null,
    bio: null,
    birth_year: null,
    gender: null,
    verified_at: iso(86400e3 * 2),
  },
  company: {
    profile_id: "demo-company",
    name: "Zdravo Organic",
    legal_name: "Zdravo Organic d.o.o.",
    tax_id: "101234567",
    registration_number: "07654321",
    company_type: "legal_entity",
    industry: "food_drinks",
    size: "11_50",
    website: "https://example.com",
    instagram: "zdravo.organic",
    country: "RS",
    city: "Beograd",
    description:
      "Domaći proizvođač organskih granola, namaza i grickalica. Tražimo kreatore koji vole zdravu ishranu i aktivan život.",
    logo_url: null,
    contact_name: "Marko Petrović",
    contact_role: "Brand menadžer",
    interested_categories: ["food", "fitness", "wellness", "lifestyle"],
    budget_min: 100,
    budget_max: 600,
    currency: "EUR",
    created_at: iso(86400e3 * 20),
    updated_at: iso(86400e3),
  },
  contact: {
    profile_id: "demo-company",
    contact_email: "marketing@example.com",
    phone: "+381 60 000 0000",
    preferred_channel: "platform",
    allowed_channels: ["platform", "email"],
    allow_platform_messages: true,
    email_notifications: true,
  },
};

export type DemoRole = "influencer" | "company" | "admin";

/** Demo session per role — chosen via the demo role switcher cookie. */
export function demoSession(role: DemoRole): SessionContext {
  if (role === "company") {
    return {
      userId: DEMO_COMPANY.profile.id,
      email: "firma.demo@example.com",
      profile: DEMO_COMPANY.profile,
      company: DEMO_COMPANY.company,
      unreadNotifications: 1,
      unreadMessages: 1,
      demo: true,
    };
  }
  const p = DEMO_INFLUENCERS[0].profile;
  return {
    userId: p.id,
    email: "influenser.demo@example.com",
    profile: role === "admin" ? { ...p, role: "admin" } : p,
    company: null,
    unreadNotifications: 2,
    unreadMessages: 1,
    demo: true,
  };
}

export function demoCardData(full: InfluencerFull): CreatorCardData {
  const prices = full.services
    .map((s) => s.price_min)
    .filter((p): p is number => p != null);
  return {
    id: full.profile.id,
    full_name: full.profile.full_name,
    username: full.profile.username ?? full.profile.id,
    avatar_url: full.profile.avatar_url,
    bio: full.profile.bio,
    city: full.profile.city,
    country: full.profile.country,
    verified: full.profile.verified_at != null,
    socials: [...full.socials]
      .sort(
        (a, b) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          FOLLOWER_RANGES.indexOf(b.follower_range) -
            FOLLOWER_RANGES.indexOf(a.follower_range)
      )
      .map((s) => ({
        platform: s.platform,
        handle: s.handle,
        follower_range: s.follower_range,
        engagement_rate: s.engagement_rate,
        is_primary: s.is_primary,
      })),
    categories: full.categories,
    min_price_eur: prices.length ? Math.min(...prices) : null,
    barter: full.collaboration?.barter ?? null,
    rating: full.profile.id === "demo-1" ? 4.9 : null,
    reviews_count: full.profile.id === "demo-1" ? 3 : 0,
  };
}

export function demoPublicCreator(username: string): PublicCreator | null {
  const full = DEMO_INFLUENCERS.find((i) => i.profile.username === username);
  if (!full) return null;
  return {
    profile: full.profile,
    socials: full.socials,
    categories: full.categories,
    services: full.services,
    collaboration: full.collaboration,
    reviews:
      full.profile.id === "demo-1"
        ? [
            {
              id: "rv1",
              rating: 5,
              comment:
                "Sadržaj isporučen pre roka, odlična komunikacija i preko 40 upita u DM-u posle objave.",
              created_at: iso(86400e3 * 9),
            },
            {
              id: "rv2",
              rating: 5,
              comment: "Profesionalna i kreativna — sarađivaćemo ponovo.",
              created_at: iso(86400e3 * 30),
            },
          ]
        : [],
  };
}

const demoMessages: Message[] = [
  {
    id: "m1",
    request_id: "demo-r1",
    sender_id: "demo-company",
    recipient_id: "demo-1",
    body: "Zdravo Milice! Pratimo tvoj sadržaj i mislimo da bi naša nova granola savršeno legla uz tvoje jutarnje rutine. Detalji su u briefu 🙂",
    read_at: iso(3600e3 * 3),
    created_at: iso(3600e3 * 5),
  },
  {
    id: "m2",
    request_id: "demo-r1",
    sender_id: "demo-1",
    recipient_id: "demo-company",
    body: "Hvala, zvuči super! Da li paket može da stigne do petka, da snimim reel za vikend?",
    read_at: null,
    created_at: iso(3600e3 * 2),
  },
];

export const DEMO_REQUEST_DETAIL: RequestDetail = {
  request: {
    id: "demo-r1",
    company_id: "demo-company",
    influencer_id: "demo-1",
    title: "Jesenja kampanja — nova granola",
    goal: "Predstavljanje nove linije organske granole mlađoj publici u Beogradu.",
    brief:
      "Tražimo autentičan prikaz jutarnje rutine sa našom granolom. Ton: opušten, svakodnevni, bez preteranog prodajnog jezika.",
    key_messages: "100% organski sastojci • bez dodatog šećera • proizvedeno u Srbiji",
    restrictions: "Bez poređenja sa konkurentskim brendovima.",
    deliverables: ["ig_reel", "ig_story"],
    deliverable_counts: [1, 3],
    compensation: "paid_and_barter",
    budget_amount: 250,
    currency: "EUR",
    barter_description: "Paket proizvoda (6 granola + 2 namaza)",
    barter_value: 40,
    usage_rights: "repost",
    revisions: 1,
    start_date: day(5),
    end_date: day(19),
    respond_by: day(3),
    ad_disclosure_ack: true,
    status: "pending",
    viewed_at: iso(3600e3 * 3),
    decline_reason: null,
    responded_at: null,
    completed_at: null,
    created_at: iso(3600e3 * 5),
    updated_at: iso(3600e3 * 2),
  },
  company: {
    id: "demo-company",
    name: "Zdravo Organic",
    avatar_url: null,
    verified: true,
    industry: "food_drinks",
    website: "https://example.com",
    city: "Beograd",
    country: "RS",
    description: DEMO_COMPANY.company.description,
  },
  influencer: {
    id: "demo-1",
    name: "Milica Jovanović",
    avatar_url: null,
    verified: true,
    username: "milica.style",
  },
  messages: demoMessages,
  myReview: null,
  contact: null,
};

export const DEMO_INBOX: InboxItem[] = [
  {
    id: "demo-r1",
    title: DEMO_REQUEST_DETAIL.request.title,
    status: "pending",
    compensation: "paid_and_barter",
    budget_amount: 250,
    currency: "EUR",
    deliverables: ["ig_reel", "ig_story"],
    respond_by: DEMO_REQUEST_DETAIL.request.respond_by,
    viewed_at: iso(3600e3 * 3),
    created_at: iso(3600e3 * 5),
    updated_at: iso(3600e3 * 2),
    company: { id: "demo-company", name: "Zdravo Organic", logo_url: null, verified: true },
    influencer: {
      id: "demo-1",
      full_name: "Milica Jovanović",
      username: "milica.style",
      avatar_url: null,
      verified: true,
    },
    unread: 1,
    last_message: {
      body: demoMessages[1].body,
      created_at: demoMessages[1].created_at,
      mine: false,
    },
  },
  {
    id: "demo-r2",
    title: "Recenzija fitnes narukvice",
    status: "accepted",
    compensation: "barter",
    budget_amount: null,
    currency: "EUR",
    deliverables: ["tiktok_video"],
    respond_by: null,
    viewed_at: iso(86400e3 * 4),
    created_at: iso(86400e3 * 5),
    updated_at: iso(86400e3 * 2),
    company: { id: "demo-company-2", name: "TechHub", logo_url: null, verified: false },
    influencer: {
      id: "demo-2",
      full_name: "Stefan Petrović",
      username: "stefan.gains",
      avatar_url: null,
      verified: true,
    },
    unread: 0,
    last_message: {
      body: "Super, šaljemo narukvicu u ponedeljak!",
      created_at: iso(86400e3 * 2),
      mine: true,
    },
  },
];
