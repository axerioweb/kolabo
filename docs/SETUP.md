# Podešavanje projekta

Supabase projekat `kolabo` (region Frankfurt, ref `ttbnifsemyhyhmbqqtgh`) je već
napravljen i sve migracije osim jedne su primenjene. Ovaj dokument opisuje stanje
i korake za novo okruženje.

## 1. Lokalno pokretanje

```bash
npm install
cp .env.example .env.local   # popuni URL i publishable ključ (vidi korak 3)
npm run dev                   # http://localhost:3000
```

Bez `.env.local` aplikacija radi u **demo režimu** (demo podaci, izbor uloge u
zaglavlju, auth isključen).

## 2. Migracije

Redosled (folder `supabase/migrations/`):

| Fajl | Sadržaj | Stanje |
|---|---|---|
| `0001_schema.sql` | enumi, tabele, trigeri | primenjeno |
| `0002_rls.sql` | RLS polise | primenjeno |
| `0003_harden_functions.sql` | search_path, EXECUTE | primenjeno |
| `0004_company_role.sql` | uloga `company` | primenjeno |
| `0005_companies.sql` | firme, verifikacija, pristanci, šabloni obaveštenja | primenjeno |
| `0006_rls_public_profiles.sql` | optimizovane polise, javni profili, indeksi | primenjeno |
| `0007_collaboration.sql` | upiti, poruke, sačuvani, ocene, prijave | primenjeno |
| `0008_rpc_and_storage.sql` | pretraga, inbox, kontakt, bucket `avatars` | primenjeno |
| `0009_column_privileges.sql` | anon ne vidi godište/pol | primenjeno |
| `0010_delete_policies.sql` | polise za brisanje | primenjeno |
| `0011_account_deletion.sql` | RPC `delete_my_account()` | **pokreni ručno** |
| `0012_revoke_anon_helpers.sql` | EXECUTE samo za prijavljene | primenjeno |
| `0013_extensions_enums.sql` | pg_trgm, pg_cron, pg_net, status `expired` | primenjeno |
| `0014_hardening.sql` | suspenzija, privatne kolone, limiti, pretraga, statistika odziva, isticanje upita, email | primenjeno |
| `0015_manual_reviews_fk.sql` | ocene preživljavaju brisanje naloga | **pokreni ručno** |
| `seed.sql` | šifarnik kategorija | primenjeno |

> **0011 i 0015 se pokreću ručno** u Supabase dashboardu → SQL Editor (nalepi
> sadržaj fajla i Run). Supabase konektor koji koristi Claude traži ručnu potvrdu
> za `DROP`/`DELETE`. Bez 0011 dugme „Obriši nalog” upućuje na podršku; bez 0015
> brisanje naloga firme briše i ocene koje je ostavila kreatorima.

## 2a. Email obaveštenja (Resend preko baze)

Obaveštenja se šalju emailom direktno iz baze (`pg_net` + Vault), bez posebnog
servera. Potrebno je:

1. Nalog na [resend.com](https://resend.com), verifikovan domen (npr. `kolabo.rs`)
   i API ključ.
2. U Supabase SQL editoru:

```sql
select vault.create_secret('re_xxxxxxxx', 'resend_api_key');
select vault.create_secret('Kolabo <obavestenja@kolabo.rs>', 'email_from');   -- opciono
select vault.create_secret('https://kolabo.rs', 'site_url');                  -- opciono
```

Dok ključ nije unet, emailovi se tiho preskaču, a in-app obaveštenja rade.
Šalju se: novi upit, prihvaćen/odbijen/otkazan, isporučeno, izmene, završeno,
istekao upit, podsetnik dan pre roka, nova poruka (jednom po razgovoru), ocena,
verifikacija, zahtev za dopunu firme. Korisnik ih gasi u onboardingu / kontakt
preferencama (`email_notifications`).

## 2b. Zakazani posao

`pg_cron` svakog dana u 06:15 UTC pokreće `expire_requests()`: upiti kojima je
prošao rok za odgovor prelaze u `expired` (firma dobija obaveštenje), a kreatori
dobijaju podsetnik dan pre roka. Pregled: `select * from cron.job;`

Na novom projektu: pokreni sve fajlove redom u SQL editoru (ili
`supabase link --project-ref <ref>` pa `supabase db push`), zatim `seed.sql`.

## 3. Ključevi (`.env.local`)

| Promenljiva | Odakle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → **publishable** ključ (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` lokalno, pravi domen u produkciji |
| `NEXT_PUBLIC_LEGAL_NAME`, `…_ADDRESS`, `…_MB`, `…_PIB`, `NEXT_PUBLIC_CONTACT_EMAIL` | podaci o pružaocu usluge (Zakon o e-trgovini) — prikazuju se u footeru i pravnim stranicama |

`service_role` ključ se NIGDE ne koristi.

## 4. Auth podešavanja (Supabase dashboard — ručno)

**Authentication → URL Configuration**
- Site URL: `http://localhost:3000` (kasnije produkcijski domen)
- Redirect URLs: `http://localhost:3000/**` i `https://<domen>/**`
  (potrebno za potvrdu emaila i reset lozinke kroz `/auth/callback`)

**Authentication → SMTP**: ugrađeni Supabase email šalje svega nekoliko poruka
na sat — za produkciju poveži Resend/Postmark (SMTP host, port, user, lozinka).

**Authentication → Providers → Email**: ostavi „Confirm email” uključeno.

## 5. Nalozi

| Uloga | Email | Napomena |
|---|---|---|
| admin | vlasnikov email | uloga dodeljena SQL-om |
| influenser (demo) | `influenser.demo@example.com` | kompletan profil `milica.demo` |
| firma (demo) | `firma.demo@example.com` | „Zdravo Organic”, nije verifikovana |

Lozinke nisu u repou. Promeni ih posle prve prijave (Podešavanja → Lozinka).

Novi admin:

```sql
update public.profiles set role = 'admin', status = 'active', onboarding_completed = true
where id = (select id from auth.users where email = 'neko@primer.rs');
```

## 6. Provere pre commita

```bash
npm run check   # i18n:check + lint + build
```

## 7. Deploy (Vercel)

1. Importuj GitHub repo u Vercel.
2. Dodaj iste env promenljive kao u `.env.local` (sa produkcijskim `NEXT_PUBLIC_SITE_URL`).
3. U Supabase dodaj produkcijski domen u Site URL i Redirect URLs.
