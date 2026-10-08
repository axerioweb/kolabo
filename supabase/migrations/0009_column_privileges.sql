-- ============================================================
-- Kolabo — 0009_column_privileges.sql
-- Prava na nivou kolona: anon vidi samo javne kolone profila (bez
-- godine rođenja i pola); primalac poruke sme da menja samo read_at.
-- ============================================================

-- Javni profili kreatora: anon vidi samo bezbedne kolone (bez godine
-- rođenja i pola). Prijavljeni korisnici vide red po RLS polisi.
revoke select on public.profiles from anon;
grant select (
  id, role, status, full_name, username, avatar_url, bio, country, city,
  content_languages, onboarding_completed, verified_at, created_at
) on public.profiles to anon;

-- Primalac sme samo da označi poruku kao pročitanu, ne i da menja tekst
revoke update on public.messages from anon, authenticated;
grant update (read_at) on public.messages to authenticated;

-- current_user_role() više ne koristi nijedna polisa
revoke execute on function public.current_user_role() from public, anon;
