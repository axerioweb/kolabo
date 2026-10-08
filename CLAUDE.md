# Kolabo — pravila projekta

Platforma koja spaja mikro influensere i brendove na Balkanu.
Stack: Next.js 15 (App Router) + Supabase + Tailwind v4 + next-intl + Framer Motion.

## Zlatna pravila

1. **`src/lib/taxonomy.ts` je jedini izvor istine** za kategorije, mreže, raspone
   pratilaca, tipove usluga, barter opcije i kanale kontakta. Nova domenska vrednost
   se dodaje TU + u odgovarajući enum/seed u `supabase/` — nikad hardkodovana u komponenti.
2. **Svaki novi UI string ide u OBA fajla prevoda** (`src/messages/sr.json` i `en.json`),
   sa istim ključem. Nedostajući ključ ruši dev server — to je namerno.
3. **Pisanje u bazu samo kroz Server Actions** (`src/app/actions/`). Klijentske
   komponente nikad ne zovu `supabase.from(...).insert/update/delete` direktno
   (izuzetak: auth pozivi u `auth-form.tsx`).
4. **Nova tabela = nova migracija + RLS polise u istom PR-u.** Tabela bez RLS ne sme
   da postoji. Šablon: vlasnik `profile_id = auth.uid()`, admin preko `public.is_admin()`.
5. **Demo režim mora nastaviti da radi**: svaka stranica koja čita iz Supabase mora
   imati granu za `!isSupabaseConfigured` (koristi `src/lib/demo-data.ts`).
6. **Ne razotkrivaj kontakt podatke**: `contact_prefs` se prikazuju samo vlasniku i
   adminu; na budućim javnim profilima samo kanali iz `allowed_channels`.

## Konvencije

- Jezik koda i komentara: engleski za identifikatore, srpski dozvoljen u komentarima
  i SQL komentarima. UI tekst NIKAD hardkodovan — uvek kroz `next-intl`.
- Rute se dodaju u `src/i18n/routing.ts` (`pathnames`) sa sr/en varijantom putanje.
- Server Component je podrazumevani izbor; `"use client"` samo kad treba state,
  browser API ili framer-motion.
- Stranice sa auth podacima: `export const dynamic = "force-dynamic"` + `robots: { index: false }`.
- Stil: Tailwind klase + tokeni iz `globals.css` (`brand-*`, `ink`, `muted`, `card`,
  `text-gradient`). Ne uvodi nove hex boje po komponentama.
- Animacije: primitivi iz `src/components/motion.tsx` (`Reveal`, `StaggerGroup`);
  svaka animacija poštuje `prefers-reduced-motion`.

## Komande

```bash
npm run dev      # razvoj (demo režim bez .env.local)
npm run build    # OBAVEZNO prolazi pre svakog commita
npm run lint
```

## Skilovi

Detaljna uputstva su u `.claude/skills/`:

- `nextjs-pravila` — App Router, i18n, Server Actions, performanse
- `supabase-pravila` — migracije, RLS, auth tokovi, tipovi
- `ui-ux-standard` — dizajn sistem, animacije, pristupačnost
- `seo-standard` — metadata, JSON-LD, sitemap, balkanski SEO

## Šta NE raditi

- Ne dodavati nove npm zavisnosti bez potrebe (posebno UI kit-ove — imamo svoj).
- Ne koristiti `service_role` ključ bilo gde u ovom repou.
- Ne menjati `follower_range` / kategorije bez migracije koja čuva postojeće podatke.
- Ne uklanjati demo režim niti `isSupabaseConfigured` grane.
