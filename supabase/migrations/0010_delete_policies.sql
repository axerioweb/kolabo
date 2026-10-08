-- ============================================================
-- Kolabo — 0010_delete_policies.sql
-- Polise za brisanje: firma uklanja kreatora iz shortliste, admin
-- briše ocene, vlasnik briše svoj avatar.
-- ============================================================

create policy "saved: delete own" on public.saved_influencers
  for delete to authenticated
  using (company_id = (select auth.uid()));

create policy "reviews: admin delete" on public.reviews
  for delete to authenticated
  using ((select public.is_admin()));

create policy "avatars: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
