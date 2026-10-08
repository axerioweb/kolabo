# Roadmap

## Faza 1 — MVP (urađeno u ovom projektu)

- [x] Landing stranica (sr/en) sa animacijama, SEO, JSON-LD, sitemap
- [x] Registracija/prijava (Supabase Auth, email + potvrda)
- [x] Onboarding u 5 koraka (profil, mreže+publika, kategorije, cene+barter, kontakt)
- [x] Influenser dashboard (pregled profila, popunjenost, obaveštenja)
- [x] Admin panel (KPI, grafikoni, tabela sa filterima)
- [x] Baza: šema + RLS + seed

## Faza 2 — Lansiranje

- [ ] Javni profili influensera (`/@username`) — najveći SEO dobitak
- [ ] Upload avatara (Supabase Storage + RLS na bucket)
- [ ] Email obaveštenja (Resend/Postmark preko Supabase Edge Functions ili webhooks)
- [ ] Verifikacija profila (admin odobrava, `verified_at`, bedž na profilu)
- [ ] Analitika (Vercel Analytics / Plausible — GDPR friendly)

## Faza 3 — Firme

- [ ] Uloga `company` + registracija firmi (PIB/matični broj za verifikaciju)
- [ ] Pretraga influensera za firme (filteri: kategorija, publika, budžet, barter)
- [ ] Upiti za saradnju kroz platformu (inbox nad postojećom `messages` tabelom)
- [ ] Realtime poruke (Supabase Realtime)

## Faza 4 — Naplata

- [ ] Model: pretplata za firme (mesečna, tiers) ili provizija po saradnji — odluka
- [ ] Stripe integracija (checkout + customer portal + webhooks)
- [ ] Escrow logika za plaćene saradnje (opciono, po uzoru na Collabstr)
- [ ] Fakturisanje za region (devizni računi / lokalni provajderi tipa LemonSqueezy kao alternativa)

## Ideje za kasnije

- Media kit PDF export profila
- Instagram/TikTok API konekcija za automatske metrike (umesto ručnog unosa)
- Ocene i recenzije nakon saradnje
- Kampanje: firma objavi brief, influenseri se prijavljuju
