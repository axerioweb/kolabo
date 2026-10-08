-- ============================================================
-- Kolabo — 0005_companies.sql
-- Faza 2+3, deo 1: enumi za tržište, verifikacija i pristanci na
-- profilu, šabloni obaveštenja, tabela firmi, registracija sa izborom
-- tipa naloga (influenser / firma).
-- ============================================================

-- ---------- ENUMS ----------

create type public.company_industry as enum (
  'fashion_beauty', 'food_drinks', 'hospitality_travel', 'health_fitness',
  'tech_electronics', 'retail_ecommerce', 'home_living', 'kids_family',
  'finance_services', 'automotive', 'entertainment_events', 'education',
  'agency', 'other'
);
create type public.company_size as enum ('solo', '2_10', '11_50', '51_200', '200_plus');
create type public.company_type as enum ('legal_entity', 'entrepreneur', 'agency');
-- pending → accepted → delivered → completed (+ declined / cancelled)
create type public.request_status as enum
  ('pending', 'accepted', 'delivered', 'declined', 'cancelled', 'completed');
create type public.compensation_type as enum ('paid', 'barter', 'paid_and_barter');
-- Prava korišćenja sadržaja koje firma traži u briefu
create type public.usage_rights as enum
  ('organic_only', 'repost', 'paid_ads_30d', 'paid_ads_90d', 'unlimited');
create type public.report_reason as enum
  ('spam', 'fake_profile', 'inappropriate', 'scam', 'hidden_advertising', 'other');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- ---------- PROFILES: verifikacija ----------

alter table public.profiles
  add column verified_at timestamptz,
  -- Izdvojeni pristanci (ZZPL čl. 15): uslovi su obavezni, marketing opcioni
  add column terms_accepted_at timestamptz,
  add column marketing_opt_in boolean not null default false;

-- Uloga, status i verifikaciju menja samo admin (ili SQL editor)
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.verified_at := old.verified_at;
    if old.status = 'suspended' then
      new.status := old.status;
    else
      new.status := case
        when new.onboarding_completed then 'active'::public.profile_status
        else 'pending'::public.profile_status
      end;
    end if;
  end if;
  return new;
end;
$$;

-- Da li je profil javno vidljiv kreator (security definer → bez ugnježdenog RLS-a)
create or replace function public.is_discoverable(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = pid
      and role = 'influencer'
      and status = 'active'
      and onboarding_completed
  );
$$;

-- Okvirna konverzija u EUR za filtriranje po budžetu (ne za naplatu)
create or replace function public.to_eur(amount int, cur public.currency)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case cur
    when 'EUR' then amount::numeric
    when 'RSD' then round(amount / 117.0, 2)
    when 'BAM' then round(amount / 1.95583, 2)
    when 'MKD' then round(amount / 61.5, 2)
  end;
$$;

-- ---------- Zaštita uloge, statusa i verifikacije ----------

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

revoke execute on function public.protect_profile_columns() from public, anon, authenticated;

-- ---------- NOTIFICATIONS: šabloni umesto hardkodovanog teksta ----------

-- template + data se prevode u UI-ju (messages/*.json → notifications.*);
-- title/body ostaju za ručno pisana admin obaveštenja.
alter table public.notifications
  add column template text check (template is null or char_length(template) <= 60),
  add column data jsonb not null default '{}';
alter table public.notifications alter column title set default '';

-- Interni helper za trigere (nije dostupan preko API-ja)
create or replace function public.notify(
  p_profile uuid,
  p_type public.notification_type,
  p_template text,
  p_data jsonb default '{}'
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (profile_id, type, template, data)
  values (p_profile, p_type, p_template, coalesce(p_data, '{}'));
$$;

revoke execute on function public.notify(uuid, public.notification_type, text, jsonb)
  from public, anon, authenticated;

-- ---------- COMPANIES ----------

create table public.companies (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  name text not null default ''
    constraint company_name_length check (char_length(name) <= 120),
  legal_name text check (legal_name is null or char_length(legal_name) <= 200),
  -- PIB (RS, 9 cifara), OIB (HR, 11), JIB (BA, 13), PIB (ME, 8), EDB (MK, 13)
  tax_id text check (tax_id is null or tax_id ~ '^[0-9A-Za-z-]{5,20}$'),
  registration_number text
    check (registration_number is null or registration_number ~ '^[0-9A-Za-z-]{5,20}$'),
  company_type public.company_type not null default 'legal_entity',
  industry public.company_industry not null default 'other',
  size public.company_size,
  website text check (website is null or char_length(website) <= 300),
  instagram text check (instagram is null or char_length(instagram) <= 100),
  country public.country_code not null default 'RS',
  city text check (city is null or char_length(city) <= 80),
  description text check (description is null or char_length(description) <= 600),
  logo_url text check (logo_url is null or char_length(logo_url) <= 500),
  contact_name text check (contact_name is null or char_length(contact_name) <= 100),
  contact_role text check (contact_role is null or char_length(contact_role) <= 100),
  interested_categories text[] not null default '{}'
    check (cardinality(interested_categories) <= 10),
  budget_min int check (budget_min is null or budget_min >= 0),
  budget_max int check (budget_max is null or budget_max >= 0),
  currency public.currency not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_budget_order check (
    budget_min is null or budget_max is null or budget_min <= budget_max
  )
);

comment on table public.companies is
  'Podaci o firmi/brendu (1:1 sa profiles gde je role=company). Kontakt podaci su u contact_prefs.';

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create index companies_industry_idx on public.companies (industry);

alter table public.companies enable row level security;

-- Prijavljeni korisnici vide firme koje nisu suspendovane (kreator mora
-- da zna ko mu šalje upit); kontakt podaci nisu u ovoj tabeli.
create policy "companies: select" on public.companies
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.profiles p
      where p.id = profile_id and p.status <> 'suspended'
    )
  );

create policy "companies: insert own" on public.companies
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'company'
    )
  );

create policy "companies: update own or admin" on public.companies
  for update to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

-- ---------- Registracija: uloga iz izbora tipa naloga ----------

-- account_type iz signUp metadata: 'company' → firma, sve ostalo → influenser.
-- Admin se NIKAD ne dodeljuje iz metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := case
    when new.raw_user_meta_data ->> 'account_type' = 'company'
      then 'company'::public.user_role
    else 'influencer'::public.user_role
  end;
begin
  insert into public.profiles (id, full_name, role, terms_accepted_at, marketing_opt_in)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100),
    v_role,
    case when new.raw_user_meta_data ->> 'accept_terms' = 'true' then now() end,
    coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', 'false') = 'true'
  );

  if v_role = 'company' then
    insert into public.companies (profile_id, name, contact_name)
    values (
      new.id,
      left(coalesce(new.raw_user_meta_data ->> 'company_name', ''), 120),
      nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100), '')
    );
  end if;

  perform public.notify(
    new.id,
    'system',
    case v_role when 'company' then 'welcome_company' else 'welcome_influencer' end
  );
  return new;
end;
$$;
