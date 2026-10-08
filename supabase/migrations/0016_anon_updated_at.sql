-- ============================================================
-- Kolabo — 0016_anon_updated_at.sql
-- Sitemap (anon) čita updated_at javnih profila za <lastmod>.
-- ============================================================

grant select (updated_at) on public.profiles to anon;
