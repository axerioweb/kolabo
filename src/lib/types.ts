import type {
  AgeRange,
  AudienceGender,
  BarterPreference,
  BarterType,
  CompanyIndustry,
  CompanySize,
  CompanyType,
  CompensationType,
  ContactChannel,
  Country,
  Currency,
  FollowerRange,
  Gender,
  Platform,
  ReportReason,
  ReportStatus,
  RequestStatus,
  ServiceType,
  UsageRights,
} from "./taxonomy";

/**
 * App-level row types. Mirror supabase/migrations — regenerate the full
 * typed client later with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type UserRole = "influencer" | "company" | "admin";
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
  verified_at: string | null;
  terms_accepted_at: string | null;
  marketing_opt_in: boolean;
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
  /** Translation key under `notifications.templates.*` (DB triggers). */
  template: string | null;
  data: Record<string, string | number | null>;
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

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */

export interface Company {
  profile_id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  registration_number: string | null;
  company_type: CompanyType;
  industry: CompanyIndustry;
  size: CompanySize | null;
  website: string | null;
  instagram: string | null;
  country: Country;
  city: string | null;
  description: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_role: string | null;
  interested_categories: string[];
  budget_min: number | null;
  budget_max: number | null;
  currency: Currency;
  created_at: string;
  updated_at: string;
}

export interface CompanyFull {
  profile: Profile;
  company: Company;
  contact: ContactPrefs | null;
}

/* ------------------------------------------------------------------ */
/* Public creator data (search + public profile)                       */
/* ------------------------------------------------------------------ */

/** One row returned by the `search_influencers` RPC. */
export interface CreatorCardData {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: Country | null;
  verified: boolean;
  socials: {
    platform: Platform;
    handle: string;
    follower_range: FollowerRange;
    engagement_rate: number | null;
    is_primary: boolean;
  }[];
  categories: string[];
  min_price_eur: number | null;
  barter: BarterPreference | null;
  rating: number | null;
  reviews_count: number;
}

export interface SearchResult {
  items: CreatorCardData[];
  total: number;
}

/** Public profile — never contains contact data (CLAUDE.md pravilo 6). */
export interface PublicCreator {
  profile: Pick<
    Profile,
    | "id"
    | "full_name"
    | "username"
    | "avatar_url"
    | "bio"
    | "country"
    | "city"
    | "content_languages"
    | "verified_at"
    | "created_at"
  >;
  socials: SocialAccount[];
  categories: string[];
  services: Service[];
  collaboration: CollaborationPrefs | null;
  reviews: PublicReview[];
}

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Collaboration requests + messages                                   */
/* ------------------------------------------------------------------ */

export interface CollaborationRequest {
  id: string;
  company_id: string;
  influencer_id: string;
  title: string;
  goal: string | null;
  brief: string;
  key_messages: string | null;
  restrictions: string | null;
  deliverables: ServiceType[];
  deliverable_counts: number[];
  compensation: CompensationType;
  budget_amount: number | null;
  currency: Currency;
  barter_description: string | null;
  barter_value: number | null;
  usage_rights: UsageRights;
  revisions: number;
  start_date: string | null;
  end_date: string | null;
  respond_by: string | null;
  ad_disclosure_ack: boolean;
  status: RequestStatus;
  viewed_at: string | null;
  decline_reason: string | null;
  responded_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Party {
  id: string;
  name: string;
  avatar_url: string | null;
  verified: boolean;
  /** Creator username (only for influencers) — links to public profile. */
  username?: string | null;
  /** Company extras for the request detail view. */
  industry?: CompanyIndustry | null;
  website?: string | null;
  city?: string | null;
  country?: Country | null;
  description?: string | null;
}

/** Row from `my_requests` RPC (inbox list). */
export interface InboxItem {
  id: string;
  title: string;
  status: RequestStatus;
  compensation: CompensationType;
  budget_amount: number | null;
  currency: Currency;
  deliverables: ServiceType[];
  respond_by: string | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string;
  company: { id: string; name: string; logo_url: string | null; verified: boolean };
  influencer: {
    id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    verified: boolean;
  };
  unread: number;
  last_message: { body: string; created_at: string; mine: boolean } | null;
}

export interface RequestDetail {
  request: CollaborationRequest;
  company: Party;
  influencer: Party;
  messages: Message[];
  myReview: Review | null;
  /** Revealed only after acceptance — see get_request_contact RPC. */
  contact: RequestContact | null;
}

export interface RequestContact {
  preferred_channel?: ContactChannel;
  channels: ContactChannel[];
  email?: string | null;
  phone?: string | null;
  instagram?: string | null;
}

export interface Review {
  id: string;
  request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_profile_id: string;
  request_id: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

/** Session context shared by headers and pages. */
export interface SessionContext {
  userId: string;
  email: string | null;
  profile: Profile;
  company: Company | null;
  unreadNotifications: number;
  unreadMessages: number;
  demo: boolean;
}
