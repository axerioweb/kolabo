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

/**
 * App-level row types. Mirror supabase/migrations — regenerate the full
 * typed client later with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type UserRole = "influencer" | "admin";
export type ProfileStatus = "pending" | "active" | "suspended";

export interface Profile {
  id: string;
  role: UserRole;
  status: ProfileStatus;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  birth_year: number | null;
  gender: Gender | null;
  country: Country | null;
  city: string | null;
  content_languages: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  profile_id: string;
  platform: Platform;
  handle: string;
  profile_url: string | null;
  follower_range: FollowerRange;
  followers_exact: number | null;
  engagement_rate: number | null;
  avg_views: number | null;
  audience_gender: AudienceGender | null;
  audience_top_age: AgeRange | null;
  audience_countries: Country[];
  is_primary: boolean;
}

export interface ProfileCategory {
  profile_id: string;
  category_slug: string;
}

export interface Service {
  id: string;
  profile_id: string;
  service_type: ServiceType;
  price_min: number | null;
  price_max: number | null;
  currency: Currency;
}

export interface CollaborationPrefs {
  profile_id: string;
  barter: BarterPreference;
  barter_types: BarterType[];
  barter_min_value: number | null;
  min_budget: number | null;
  currency: Currency;
  open_to_travel: boolean;
  notes: string | null;
}

export interface ContactPrefs {
  profile_id: string;
  contact_email: string | null;
  phone: string | null;
  preferred_channel: ContactChannel;
  allowed_channels: ContactChannel[];
  allow_platform_messages: boolean;
  email_notifications: boolean;
}

export type NotificationType =
  | "system"
  | "collaboration"
  | "message"
  | "reminder";

export interface AppNotification {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

/** Composite shape used by dashboard + admin views. */
export interface InfluencerFull {
  profile: Profile;
  socials: SocialAccount[];
  categories: string[]; // category slugs
  services: Service[];
  collaboration: CollaborationPrefs | null;
  contact: ContactPrefs | null;
}
