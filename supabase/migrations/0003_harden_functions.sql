-- ============================================================
-- Kolabo — 0003_harden_functions.sql
-- Fiksni search_path za trigger funkcije (Supabase advisor 0011) i
-- uklonjen EXECUTE za handle_new_user (poziva ga samo trigger).
-- ============================================================

alter function public.set_updated_at() set search_path = public;
alter function public.enforce_max_categories() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
