-- ============================================================
-- Kolabo — 0012_revoke_anon_helpers.sql
-- Pomoćne funkcije za poruke koriste samo polise za prijavljene
-- korisnike; anon ih ne treba.
-- ============================================================

revoke execute on function public.can_message(uuid) from public, anon;
revoke execute on function public.is_request_participant(uuid) from public, anon;
grant execute on function public.can_message(uuid) to authenticated;
grant execute on function public.is_request_participant(uuid) to authenticated;
