-- ============================================================
-- Kolabo — 0015_manual_reviews_fk.sql
-- RUČNO POKRETANJE (sadrži DROP CONSTRAINT, konektor traži potvrdu).
-- Ocene preživljavaju brisanje naloga ocenjivača ili upita: kreator ne
-- sme da izgubi ocene zato što je firma obrisala nalog (GDPR brisanje).
-- ============================================================

alter table public.reviews alter column reviewer_id drop not null;

alter table public.reviews drop constraint reviews_reviewer_id_fkey;
alter table public.reviews
  add constraint reviews_reviewer_id_fkey
  foreign key (reviewer_id) references public.profiles (id) on delete set null;

alter table public.reviews drop constraint reviews_request_id_fkey;
alter table public.reviews
  add constraint reviews_request_id_fkey
  foreign key (request_id) references public.collaboration_requests (id) on delete set null;
