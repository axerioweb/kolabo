# Roadmap

## Faza 1 — MVP ✅

- [x] Landing (sr/en), SEO, JSON-LD, sitemap
- [x] Registracija/prijava, onboarding influensera u 5 koraka
- [x] Influenser panel, admin panel, šema + RLS + seed

## Faza 2 — Lansiranje ✅

- [x] Javni profili kreatora `/kreatori/<username>` (ISR, JSON-LD)
- [x] SEO stranice po kategorijama
- [x] Upload avatara i logotipa (Storage + RLS)
- [x] Verifikacija profila (admin) i suspenzija
- [x] Zaboravljena lozinka, podešavanja, izvoz podataka, brisanje naloga
- [x] Pravne stranice (nacrt — čeka pravnika)
- [x] Email obaveštenja (Resend kroz pg_net + Vault; ključ unosi vlasnik)
- [x] Isticanje upita i podsetnici (pg_cron), statistika odziva kreatora
- [x] OG slike, loading/error stanja, lista zadataka za profil, upozorenja o uklapanju ponude
- [ ] Analitika (Plausible / Vercel Analytics — bez kolačića)

## Faza 3 — Firme ✅

- [x] Uloga `company`, registracija i profil firme (PIB/MB sa proverom kontrolne cifre)
- [x] Pretraga kreatora sa filterima i paginacijom
- [x] Upiti za saradnju (brief, isporuke, barter sa vrednošću, prava korišćenja, rokovi)
- [x] Poruke po upitu u realnom vremenu (Supabase Realtime)
- [x] Sačuvani kreatori, ocene posle saradnje, prijave zloupotrebe

## Sledeće (pre javnog lansiranja)

- [ ] Pokrenuti migracije `0011_account_deletion.sql` i `0015_manual_reviews_fk.sql` u SQL editoru
- [ ] Resend nalog + `vault.create_secret('re_…', 'resend_api_key')` (docs/SETUP.md 2a)
- [ ] Pravni pregled uslova i politike privatnosti, popuniti podatke o firmi
- [ ] Produkcijski domen, Vercel deploy, Supabase redirect URL-ovi
- [ ] OG slika i favicon set, pravi tekstovi i fotografije za landing
- [ ] Generisani tipovi (`supabase gen types`) umesto ručnih

## Faza 4 — Naplata (van trenutnog opsega)

- [ ] Model: pretplata za firme ili provizija po saradnji
- [ ] Stripe / lokalni provajder, escrow za plaćene saradnje
- [ ] Fakturisanje za region

## Ideje

- Kampanje: firma objavi brief, kreatori se prijavljuju
- Media kit PDF export profila
- Instagram/TikTok API za automatske metrike
- Zahtev za verifikaciju kreatora (screenshot statistike → admin red)
- Strukturisani razlozi odbijanja (budžet / barter / termin / nije fit) + saveti firmi
