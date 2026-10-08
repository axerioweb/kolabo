-- ============================================================
-- Kolabo — 0001_schema.sql
-- Osnova baze: enumi, tabele, trigeri.
-- Pokreni u Supabase SQL editoru ili preko `supabase db push`.
-- ============================================================

-- ---------- ENUMS ----------

create type public.user_role as enum ('influencer', 'admin');
create type public.profile_status as enum ('pending', 'active', 'suspended');
create type public.platform as enum ('instagram', 'tiktok', 'youtube', 'facebook', 'linkedin');
create type public.follower_range as enum
  ('lt_1k', '1k_5k', '5k_10k', '10k_25k', '25k_50k', '50k_100k', '100k_250k', 'gt_250k');
create type public.gender as enum ('female', 'male', 'other', 'prefer_not');
create type public.audience_gender as enum ('mostly_female', 'mostly_male', 'mixed');
create type public.age_range as enum ('13_17', '18_24', '25_34', '35_44', '45_plus');
create type public.country_code as enum
  ('RS', 'HR', 'BA', 'ME', 'MK', 'SI', 'AL', 'XK', 'diaspora', 'other');
create type public.service_type as enum
  ('ig_post', 'ig_story', 'ig_reel', 'tiktok_video', 'yt_video', 'yt_short',
   'fb_post', 'li_post', 'ugc_video', 'event_appearance', 'brand_ambassador');
create type public.currency as enum ('EUR', 'RSD', 'BAM', 'MKD');
create type public.barter_preference as enum ('yes', 'no', 'depends');
create type public.barter_type as enum ('products', 'services', 'travel', 'events', 'discounts');
create type public.contact_channel as enum
  ('platform', 'email', 'phone', 'whatsapp', 'viber', 'instagram_dm');
create type public.notification_type as enum ('system', 'collaboration', 'message', 'reminder');

-- ---------- TABLES ----------

-- Profil korisnika (1:1 sa auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'influencer',
  status public.profile_status not null default 'pending',
  full_name text not null default '',
  username text unique
    constraint username_format check (
      username is null or username ~ '^[a-z0-9._-]{3,30}$'
    ),
  avatar_url text,
  bio text
    constraint bio_length check (bio is null or char_length(bio) <= 400),
  birth_year int
    constraint birth_year_range check (
      birth_year is null or birth_year between 1930 and 2015
    ),
  gender public.gender,
  country public.country_code,
  city text,
  content_languages text[] not null default '{sr}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Prošireni profil korisnika. role=admin daje pristup admin panelu i uvid u sve.';

-- Društvene mreže + metrike publike
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform public.platform not null,
  handle text not null,
  profile_url text,
  follower_range public.follower_range not null,
  followers_exact int check (followers_exact is null or followers_exact >= 0),
  engagement_rate numeric(5, 2)
    check (engagement_rate is null or engagement_rate between 0 and 100),
  avg_views int check (avg_views is null or avg_views >= 0),
  audience_gender public.audience_gender,
  audience_top_age public.age_range,
  audience_countries public.country_code[] not null default '{}',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_id, platform)
);

-- Šifarnik kategorija sadržaja (punjeno iz seed.sql)
create table public.categories (
  slug text primary key,
  group_slug text not null,
  name_sr text not null,
  name_en text not null,
  emoji text not null default '',
  sort int not null default 0
);

-- Izabrane kategorije po profilu (maks. 5 — trigger ispod)
create table public.profile_categories (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  category_slug text not null references public.categories (slug) on delete cascade,
  primary key (profile_id, category_slug)
);

-- Usluge sa rasponima cena
create table public.services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  service_type public.service_type not null,
  price_min int check (price_min is null or price_min >= 0),
  price_max int check (price_max is null or price_max >= 0),
  currency public.currency not null default 'EUR',
  constraint price_order check (
    price_min is null or price_max is null or price_min <= price_max
  ),
  unique (profile_id, service_type)
);

-- Uslovi saradnje (barter, minimalni budžet)
create table public.collaboration_prefs (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  barter public.barter_preference not null default 'depends',
  barter_types public.barter_type[] not null default '{}',
  barter_min_value int check (barter_min_value is null or barter_min_value >= 0),
  min_budget int check (min_budget is null or min_budget >= 0),
  currency public.currency not null default 'EUR',
  open_to_travel boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 300)
);

-- Kontakt preference
create table public.contact_prefs (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  contact_email text,
  phone text,
  preferred_channel public.contact_channel not null default 'platform',
  allowed_channels public.contact_channel[] not null default '{platform,email}',
  allow_platform_messages boolean not null default true,
  email_notifications boolean not null default true
);

-- In-app obaveštenja
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null default 'system',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_profile_created_idx
  on public.notifications (profile_id, created_at desc);

-- Poruke preko platforme (osnova za budući inbox)
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_recipient_idx on public.messages (recipient_id, created_at desc);

-- ---------- FUNCTIONS & TRIGGERS ----------

-- Da li je trenutni korisnik admin? (security definer da RLS ne pravi rekurziju)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Automatsko kreiranje profila pri registraciji
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  insert into public.notifications (profile_id, type, title, body)
  values (
    new.id,
    'system',
    'Dobrodošao/la na Kolabo 🎉',
    'Popuni svoj profil da bi te brendovi pronašli. Kompletni profili dobijaju najviše upita.'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at održavanje
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Maksimalno 5 kategorija po profilu
create or replace function public.enforce_max_categories()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from public.profile_categories
    where profile_id = new.profile_id
  ) >= 5 then
    raise exception 'Maksimalno 5 kategorija po profilu';
  end if;
  return new;
end;
$$;

create trigger max_categories_check
  before insert on public.profile_categories
  for each row execute function public.enforce_max_categories();

-- Samo jedna glavna mreža po profilu
create unique index one_primary_social_per_profile
  on public.social_accounts (profile_id)
  where is_primary;
