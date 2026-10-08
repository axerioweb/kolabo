# Kolabo

**Platforma koja spaja mikro influensere i brendove na Balkanu.**

Next.js 15 (App Router) + Supabase (Postgres, Auth, RLS, Storage, Realtime) +
Tailwind CSS v4 + next-intl (sr/en) + Framer Motion.

## Brzi start

```bash
npm install
cp .env.example .env.local   # Supabase URL + publishable ključ
npm run dev                   # http://localhost:3000
```

Bez `.env.local` aplikacija radi u **demo režimu**: sve stranice se prikazuju sa
demo podacima, a u zaglavlju možeš da biraš ulogu (kreator / firma / admin).
Podešavanje baze, auth-a i naloga: [docs/SETUP.md](docs/SETUP.md).

## Šta platforma radi

| Uloga | Mogućnosti |
|---|---|
| **Kreator** | profil u 5 koraka, javni profil `/kreatori/<username>`, prima upite, poruke u realnom vremenu, isporuka, ocene |
| **Firma** | profil firme sa PIB/MB proverom, pretraga kreatora sa filterima, sačuvani kreatori, upiti sa briefom i barterom, ocene |
| **Admin** | KPI i grafikoni, verifikacija i suspenzija profila, pregled upita, prijave zloupotrebe |

Kontakt kreatora vidi se tek kada prihvati upit. Svaki upit uključuje potvrdu
označavanja reklame (Zakon o oglašavanju). Plaćanje je van platforme u ovoj fazi.

## Struktura

| Putanja | Šta je |
|---|---|
| `src/app/[locale]/` | Sve stranice (sr bez prefiksa, en pod `/en`) |
| `src/app/actions/` | Server Actions — jedini put za upis u bazu |
| `src/components/` | UI (landing, creators, requests, company, dashboard, admin, settings, ui) |
| `src/lib/taxonomy.ts` | **Jedini izvor istine** za domenske vrednosti |
| `src/lib/queries.ts` | Čitanje podataka (embed upiti, RPC) |
| `src/lib/session.ts` | Sesija po zahtevu + guard za uloge |
| `src/lib/supabase/` | Klijenti: browser, server, middleware, javni (anon + keš) |
| `src/messages/` | Prevodi (sr.json, en.json) |
| `supabase/migrations/` | Šema, RLS, trigeri, RPC (0001–0012) |
| `scripts/check-i18n.mjs` | Provera prevoda |
| `docs/` | Setup, arhitektura, roadmap, istraživanje tržišta |

## Komande

```bash
npm run dev          # razvoj
npm run build        # produkcijski build
npm run lint         # eslint
npm run i18n:check   # svi ključevi postoje u sr.json i en.json
npm run check        # sve tri provere — OBAVEZNO pre commita
```

## Dokumentacija

- [docs/SETUP.md](docs/SETUP.md) — Supabase, auth, nalozi, deploy
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — model podataka, tok upita, bezbednost
- [docs/RESEARCH.md](docs/RESEARCH.md) — tržište, konkurencija, pravni okvir, UX
- [docs/ROADMAP.md](docs/ROADMAP.md) — urađeno i sledeći koraci
