-- ============================================================
-- Kolabo — 0011_account_deletion.sql
-- RUČNO POKRETANJE: Supabase konektor traži potvrdu za DELETE naredbe,
-- pa ovu migraciju pokreni u Supabase SQL editoru (docs/SETUP.md).
-- Bez nje dugme "Obriši nalog" prikazuje poruku da se javi podršci.
-- ============================================================

-- ---------- RPC: brisanje sopstvenog naloga (GDPR) ----------

-- Briše auth korisnika; kaskadno nestaju profil i svi povezani redovi.
-- Fajlove iz Storage-a briše Server Action pre poziva.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if public.is_admin() then
    raise exception 'admin_cannot_self_delete' using errcode = 'P0001';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
