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
- [ ] Email obaveštenja (Resend preko SMTP-a ili Edge Function nad `notifications`)
- [ ] Analitika (Plausible / Vercel Analytics — bez kolačića)

## Faza 3 — Firme ✅

- [x] Uloga `company`, registracija i profil firme (PIB/MB sa proverom kontrolne cifre)
- [x] Pretraga kreatora sa filterima i paginacijom
- [x] Upiti za saradnju (brief, isporuke, barter sa vrednošću, prava korišćenja, rokovi)
- [x] Poruke po upitu u realnom vremenu (Supabase Realtime)
- [x] Sačuvani kreatori, ocene posle saradnje, prijave zloupotrebe

## Sledeće (pre javnog lansiranja)

- [ ] Pokrenuti migraciju `0011_account_deletion.sql` u SQL editoru
- [ ] SMTP provajder (Resend/Postmark) + email šabloni na srpskom
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
- Status „isteklo” za upite posle roka za odgovor (pg_cron)
