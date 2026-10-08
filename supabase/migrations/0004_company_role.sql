-- ============================================================
-- Kolabo — 0004_company_role.sql
-- Nova uloga za firme/brendove. Odvojena migracija jer nova enum
-- vrednost ne sme da se koristi u istoj transakciji u kojoj je dodata.
-- ============================================================

alter type public.user_role add value if not exists 'company';
