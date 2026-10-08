---
name: supabase-pravila
description: Pravila za rad sa Supabase u Kolabo projektu — migracije, RLS polise, auth tokovi, enumi i sinhronizacija sa taxonomy.ts. Koristi pri svakoj promeni baze, auth logike ili dodavanju tabela.
---

# Supabase pravila (Kolabo)

## Klijenti — tri konteksta, tri fajla

| Kontekst | Import | Napomena |
|---|---|---|
| Client Component | `@/lib/supabase/client` | samo auth pozivi |
| Server Component / Action | `@/lib/supabase/server` | `await createClient()` |
| Middleware | `@/lib/supabase/middleware` | ne dirati bez razloga |

- `isSupabaseConfigured` iz `@/lib/supabase/config` čuva demo režim — svaka nova
  putanja koja čita bazu mora imati demo granu.
- **NIKAD** `service_role` ključ u repou, env-u sa `NEXT_PUBLIC_` prefiksom, ili kodu.

## Migracije

- Nova promena šeme = novi fajl `supabase/migrations/NNNN_opis.sql` (redni broj).
  Postojeće migracije se NE menjaju retroaktivno kada su jednom puštene.
- Svaka tabela u istoj migraciji dobija:
  1. `alter table ... enable row level security;`
  2. Polise: vlasnik (`profile_id = auth.uid()`) za select/insert/update/delete,
     admin read preko `public.is_admin()`.
  3. Check constrainte za dužine i opsege (vidi postojeće tabele kao šablon).
- Domenske vrednosti (nova kategorija, nova mreža, novi tip usluge):
  1. `alter type ... add value` ili insert u `categories` (kroz migraciju, ne ručno)
  2. ISTA vrednost u `src/lib/taxonomy.ts`
  3. Labele sr + en
- Funkcije koje čitaju `profiles` iz polisa MORAJU biti `security definer` +
  `set search_path = public` (izbegava RLS rekurziju) — vidi `is_admin()`.

## Auth tok

- Registracija: `signUp` sa `options.data.full_name` → trigger `handle_new_user`
  pravi red u `profiles` + welcome notifikaciju. NE praviti profil iz aplikacije.
- Email potvrda vodi na `/auth/callback` (route handler van `[locale]` — middleware
  ga preskače). Ne menjati matcher u `src/middleware.ts` bez provere ovog toka.
- Uloga se NIKAD ne menja iz aplikacije — samo SQL-om (admin) ili budućom admin akcijom
  sa proverom `is_admin()`.

## Šabloni upita

- Čitanje kompozitnog profila: `getInfluencerFull()` / `getAllInfluencers()` iz
  `src/lib/queries.ts` — proširuj njih umesto ad-hoc upita po stranicama.
- Zamena seta (mreže, kategorije, usluge): PRVO upsert, PA brisanje viška
  (vidi `saveOnboarding`) — neuspeh na pola nikad ne ostavlja prazan profil.
- Pretraga i inbox idu kroz RPC (`search_influencers`, `my_requests`); kontakt
  druge strane samo kroz `get_request_contact`.
- Javni podaci (anon) se čitaju eksplicitnim kolonama — `anon` nema pravo na
  `profiles.birth_year`/`gender` (0009), pa `select *` kao anon puca.
- Novi upit vraća tipove iz `src/lib/types.ts`; kada se uvedu generisani tipovi
  (`supabase gen types`), zameni ručne tipove jednim potezom.

## Bezbednosna kontrolna lista (pre svakog merge-a)

- [ ] Nova tabela ima RLS + polise?
- [ ] Server Action proverava `user` pre pisanja?
- [ ] Piše se samo `user.id` — nikad id iz request body-ja?
- [ ] Kontakt podaci se ne vraćaju korisnicima koji nisu vlasnik/admin?
- [ ] Nema `service_role` ključa nigde?
