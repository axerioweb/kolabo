-- ============================================================
-- Kolabo — 0013_extensions_enums.sql
-- Ekstenzije (pretraga, zakazani poslovi, HTTP iz baze) i nova
-- vrednost statusa. Odvojeno od 0014 jer se nova enum vrednost ne
-- sme koristiti u istoj transakciji u kojoj je dodata.
-- ============================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Upit kome je istekao rok za odgovor (postavlja ga zakazani posao)
alter type public.request_status add value if not exists 'expired';
