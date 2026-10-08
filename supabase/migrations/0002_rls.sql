-- ============================================================
-- Kolabo — 0002_rls.sql
-- Row Level Security: influenser vidi/menja samo svoje podatke,
-- admin ima uvid u sve. Šifarnik kategorija je javan (read-only).
-- ============================================================

alter table public.profiles enable row level security;
alter table public.social_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.profile_categories enable row level security;
alter table public.services enable row level security;
alter table public.collaboration_prefs enable row level security;
alter table public.contact_prefs enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;

-- ---------- profiles ----------

-- Uloga trenutnog korisnika (security definer da ne dođe do RLS rekurzije)
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "profiles: own read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles: own update" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- korisnik ne može sam sebi da promeni ulogu
    and role = public.current_user_role()
  );

create policy "profiles: admin update" on public.profiles
  for update using (public.is_admin());

-- insert radi trigger (security definer); direktan insert nije dozvoljen

-- ---------- social_accounts ----------

create policy "socials: own all" on public.social_accounts
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "socials: admin read" on public.social_accounts
  for select using (public.is_admin());

-- ---------- categories (javni šifarnik) ----------

create policy "categories: public read" on public.categories
  for select using (true);

-- ---------- profile_categories ----------

create policy "profile_categories: own all" on public.profile_categories
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "profile_categories: admin read" on public.profile_categories
  for select using (public.is_admin());

-- ---------- services ----------

create policy "services: own all" on public.services
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "services: admin read" on public.services
  for select using (public.is_admin());

-- ---------- collaboration_prefs ----------

create policy "collab: own all" on public.collaboration_prefs
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "collab: admin read" on public.collaboration_prefs
  for select using (public.is_admin());

-- ---------- contact_prefs ----------

create policy "contact: own all" on public.contact_prefs
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "contact: admin read" on public.contact_prefs
  for select using (public.is_admin());

-- ---------- notifications ----------

create policy "notifications: own read" on public.notifications
  for select using (profile_id = auth.uid());

create policy "notifications: own mark read" on public.notifications
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "notifications: admin all" on public.notifications
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------- messages ----------

create policy "messages: participants read" on public.messages
  for select using (
    sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin()
  );

create policy "messages: send as self" on public.messages
  for insert with check (sender_id = auth.uid());

create policy "messages: recipient mark read" on public.messages
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
