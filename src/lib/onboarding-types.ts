import type {
  AgeRange,
  AudienceGender,
  BarterPreference,
  BarterType,
  ContactChannel,
  Country,
  Currency,
  FollowerRange,
  Gender,
  Platform,
  ServiceType,
} from "./taxonomy";

/** Shape the onboarding wizard edits and the server action persists. */
export interface SocialInput {
  platform: Platform;
  handle: string;
  profile_url: string;
  follower_range: FollowerRange;
  engagement_rate: string; // form input, parsed server-side
  avg_views: string;
  audience_gender: AudienceGender | "";
  audience_top_age: AgeRange | "";
  audience_countries: Country[];
  is_primary: boolean;
}

export interface ServiceInput {
  service_type: ServiceType;
  price_min: string;
  price_max: string;
}

export interface OnboardingData {
  basics: {
    username: string;
    bio: string;
    birth_year: string;
    gender: Gender | "";
    country: Country | "";
    city: string;
    languages: string[];
  };
  socials: SocialInput[];
  categories: string[];
  currency: Currency;
  services: ServiceInput[];
  collaboration: {
    barter: BarterPreference;
    barter_types: BarterType[];
    barter_min_value: string;
    min_budget: string;
    open_to_travel: boolean;
    notes: string;
  };
  contact: {
    contact_email: string;
    phone: string;
    preferred_channel: ContactChannel;
    allowed_channels: ContactChannel[];
    allow_platform_messages: boolean;
    email_notifications: boolean;
  };
}

export const emptyOnboardingData: OnboardingData = {
  basics: {
    username: "",
    bio: "",
    birth_year: "",
    gender: "",
    country: "RS",
    city: "",
    languages: ["sr"],
  },
  socials: [],
  categories: [],
  currency: "EUR",
  services: [],
  collaboration: {
    barter: "depends",
    barter_types: [],
    barter_min_value: "",
    min_budget: "",
    open_to_travel: false,
    notes: "",
  },
  contact: {
    contact_email: "",
    phone: "",
    preferred_channel: "platform",
    allowed_channels: ["platform", "email"],
    allow_platform_messages: true,
    email_notifications: true,
  },
};
