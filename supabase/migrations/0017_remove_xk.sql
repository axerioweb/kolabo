-- ============================================================
-- Kolabo — 0017_remove_xk.sql
-- Uklanjanje vrednosti 'XK' iz ponude zemalja. Postgres ne dozvoljava
-- uklanjanje vrednosti iz enuma bez DROP, pa vrednost ostaje u tipu,
-- ali: postojeći redovi se prebacuju na 'other', a CHECK ograničenja
-- sprečavaju ponovni upis. taxonomy.ts više ne nudi 'XK'.
-- ============================================================

update public.profiles
   set country = 'other'
 where country = 'XK';

update public.companies
   set country = 'other'
 where country = 'XK';

update public.social_accounts
   set audience_countries = array_remove(audience_countries, 'XK'::public.country_code)
 where 'XK'::public.country_code = any (audience_countries);

alter table public.profiles
  add constraint profiles_country_not_xk check (country is distinct from 'XK');

alter table public.companies
  add constraint companies_country_not_xk check (country <> 'XK');

alter table public.social_accounts
  add constraint social_accounts_audience_not_xk
  check (not ('XK'::public.country_code = any (audience_countries)));
