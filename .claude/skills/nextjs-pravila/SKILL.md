---
name: nextjs-pravila
description: Pravila za rad sa Next.js 15 App Routerom u Kolabo projektu — rutiranje sa next-intl, Server Components vs Client, Server Actions, keširanje i performanse. Koristi pri dodavanju stranica, ruta, akcija ili refaktorisanju.
---

# Next.js pravila (Kolabo)

## Rutiranje + i18n

- Sve stranice žive pod `src/app/[locale]/`. Nova ruta:
  1. Dodaj mapiranje u `src/i18n/routing.ts` → `pathnames` (sr i en putanja).
  2. Napravi folder po **internom ključu** (npr. `/dashboard/profile` →
     `src/app/[locale]/dashboard/profile/page.tsx`) — middleware prevodi
     lokalizovane URL-ove (`/panel/profil`) na taj fajl.
  3. Javna stranica? Dodaj je u `src/app/sitemap.ts` (`publicPaths`).
- Linkovi i redirekti ISKLJUČIVO iz `@/i18n/navigation` (`Link`, `redirect`,
  `useRouter`, `usePathname`) — nikad iz `next/navigation` (osim `notFound`).
- U svakoj `page.tsx`: `const { locale } = await params; setRequestLocale(locale);`
  (omogućava statičko renderovanje javnih stranica).
- Prevodi: server → `getTranslations()`, klijent → `useTranslations()`.
  Ključ dodaješ u OBA `src/messages/*.json` fajla.

## Server vs Client

- Podrazumevano: Server Component. `"use client"` samo za state, event handlere,
  framer-motion, browser API.
- Podatke čitaj u Server Componenti (helperi u `src/lib/queries.ts`) i prosleđuj
  klijentu kao serializable props (bez funkcija, bez klasa).
- Mutacije: Server Action u `src/app/actions/*.ts` sa `"use server"` na vrhu fajla.
  Šablon akcije:
  1. `if (!isSupabaseConfigured) return { ok: true, demo: true };`
  2. `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();`
  3. `if (!user) return { ok: false, error: "not_authenticated" };`
  4. Piši SAMO redove sa `user.id` (RLS je druga linija, ne prva).
  5. `revalidatePath(...)` na kraju.

## Keširanje i renderovanje

- Auth stranice (`dashboard`, `admin`, `onboarding`): `export const dynamic = "force-dynamic"`
  + `robots: { index: false }` u metadata.
- Javne stranice: statičke (ne koristi `cookies()`/`headers()` u njima).
- Ne koristi `unstable_cache` bez dogovora; za sada je sve ili statičko ili dinamičko.

## Performanse

- `next/font/google` sa `subsets: ["latin", "latin-ext"]` (š, đ, ž, č, ć!).
- Slike kroz `next/image`; remote hostovi se dodaju u `next.config.ts`.
- framer-motion samo u list komponentama koje ga trebaju — ne uvoziti u server fajlove.
- Novi paket = obrazloženje u PR opisu. Prvo proveri da li postojeće rešava problem.

## Provera pre commita

```bash
npm run build && npm run lint
```

Build mora proći bez grešaka i bez novih warninga.
