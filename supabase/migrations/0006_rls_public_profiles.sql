-- ============================================================
-- Kolabo — 0006_rls_public_profiles.sql
-- Optimizovane RLS polise (auth.uid()/is_admin() jednom po upitu),
-- javno čitanje profila kreatora, ograničenja dužine i indeksi.
-- Napomena: bez DROP naredbi — polise se menjaju kroz ALTER POLICY.
-- ============================================================

-- ---------- RLS polise: optimizacija + javno čitanje kreatora ----------

-- (select auth.uid()) / (select is_admin()) se računaju jednom po upitu
-- umesto za svaki red (Supabase advisor 0003). Polise su ograničene na
-- uloge kojima trebaju (anon ne evaluira privatne polise).

-- profiles
alter policy "profiles: own read" on public.profiles rename to "profiles: select";
alter policy "profiles: select" on public.profiles
  to anon, authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or (role = 'influencer' and status = 'active' and onboarding_completed)
    or (role = 'company' and status <> 'suspended' and (select auth.uid()) is not null)
  );

-- Zaštitu uloge sada radi trigger profiles_protect_columns
alter policy "profiles: own update" on public.profiles
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy "profiles: admin update" on public.profiles
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- current_user_role() više ne koristi nijedna polisa
alter function public.current_user_role() security invoker;

-- social_accounts
alter policy "socials: own all" on public.social_accounts
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
alter policy "socials: admin read" on public.social_accounts rename to "socials: public read";
alter policy "socials: public read" on public.social_accounts
  to anon, authenticated
  using ((select public.is_admin()) or public.is_discoverable(profile_id));

-- profile_categories
alter policy "profile_categories: own all" on public.profile_categories
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
alter policy "profile_categories: admin read" on public.profile_categories
  rename to "profile_categories: public read";
alter policy "profile_categories: public read" on public.profile_categories
  to anon, authenticated
  using ((select public.is_admin()) or public.is_discoverable(profile_id));

-- services
alter policy "services: own all" on public.services
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
alter policy "services: admin read" on public.services rename to "services: public read";
alter policy "services: public read" on public.services
  to anon, authenticated
  using ((select public.is_admin()) or public.is_discoverable(profile_id));

-- collaboration_prefs
alter policy "collab: own all" on public.collaboration_prefs
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
alter policy "collab: admin read" on public.collaboration_prefs rename to "collab: public read";
alter policy "collab: public read" on public.collaboration_prefs
  to anon, authenticated
  using ((select public.is_admin()) or public.is_discoverable(profile_id));

-- contact_prefs: namerno samo vlasnik + admin (CLAUDE.md pravilo 6)
alter policy "contact: own all" on public.contact_prefs
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
alter policy "contact: admin read" on public.contact_prefs
  to authenticated
  using ((select public.is_admin()));

-- categories
alter policy "categories: public read" on public.categories to anon, authenticated;

-- notifications
alter policy "notifications: own read" on public.notifications
  to authenticated
  using (profile_id = (select auth.uid()));
alter policy "notifications: own mark read" on public.notifications
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
alter policy "notifications: admin all" on public.notifications
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------- Integritet: ograničenja dužine ----------

alter table public.profiles
  add constraint full_name_length check (char_length(full_name) <= 100),
  add constraint city_length check (city is null or char_length(city) <= 80),
  add constraint avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 500),
  add constraint content_languages_count check (cardinality(content_languages) <= 5);

alter table public.social_accounts
  add constraint handle_length check (char_length(handle) between 1 and 100),
  add constraint profile_url_length check (profile_url is null or char_length(profile_url) <= 300),
  add constraint audience_countries_count check (cardinality(audience_countries) <= 10);

alter table public.contact_prefs
  add constraint contact_email_length check (contact_email is null or char_length(contact_email) <= 254),
  add constraint phone_length check (phone is null or char_length(phone) <= 30);

alter table public.notifications
  add constraint title_length check (char_length(title) <= 200),
  add constraint body_length check (body is null or char_length(body) <= 2000),
  add constraint link_length check (link is null or char_length(link) <= 500);

-- ---------- Indeksi ----------

create index profile_categories_category_idx on public.profile_categories (category_slug);
create index notifications_unread_idx on public.notifications (profile_id)
  where read_at is null;
create index profiles_discoverable_idx on public.profiles (country, created_at desc)
  where role = 'influencer' and status = 'active' and onboarding_completed;
create index social_accounts_search_idx on public.social_accounts (platform, follower_range);
create index services_search_idx on public.services (service_type, price_min);
