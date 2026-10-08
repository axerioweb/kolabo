# Kolabo

**Platforma koja spaja mikro influensere i brendove na Balkanu.**

Next.js 15 (App Router) + Supabase + Tailwind CSS v4 + next-intl (sr/en) + Framer Motion.

## Brzi start

```bash
npm install
npm run dev        # http://localhost:3000
```

Bez podešenog Supabase-a aplikacija radi u **demo režimu**: landing, onboarding,
dashboard i admin panel se prikazuju sa demo podacima, a registracija/prijava su
isključene. Za pravi rad prati [docs/SETUP.md](docs/SETUP.md).

## Struktura

| Putanja | Šta je |
|---|---|
| `src/app/[locale]/` | Sve stranice (sr bez prefiksa, en pod `/en`) |
| `src/components/` | UI komponente (landing, onboarding, dashboard, admin, ui) |
| `src/lib/taxonomy.ts` | **Jedini izvor istine** za kategorije, mreže, raspone, usluge |
| `src/lib/supabase/` | Supabase klijenti (browser, server, middleware) |
| `src/app/actions/` | Server Actions (onboarding, auth, notifikacije) |
| `src/messages/` | Prevodi (sr.json, en.json) |
| `supabase/migrations/` | SQL šema + RLS polise |
| `supabase/seed.sql` | Šifarnik kategorija |
| `docs/` | Setup, arhitektura, roadmap |
| `CLAUDE.md` + `.claude/skills/` | Pravila i skilovi za rad sa Claude Code |

## Uloge

- **Influenser** — registruje se, prolazi onboarding u 5 koraka (osnovni podaci,
  mreže i publika, kategorije, cene i barter, kontakt), dobija dashboard sa
  pregledom profila i obaveštenjima.
- **Admin** — vidi sve metrike i statistiku (KPI, grafikoni, tabela sa filterima).
  Admin postaješ tako što u bazi postaviš `role = 'admin'` na svom profilu
  (vidi docs/SETUP.md).

## Komande

```bash
npm run dev      # razvoj
npm run build    # produkcijski build
npm run lint     # eslint
```
