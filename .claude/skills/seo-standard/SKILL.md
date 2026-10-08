---
name: seo-standard
description: SEO standard Kolabo platforme — metadata, hreflang, JSON-LD, sitemap i strategija za balkansko tržište. Koristi pri dodavanju javnih stranica ili izmeni meta podataka.
---

# SEO standard (Kolabo)

## Tehnički SEO (već postavljeno — održavaj)

- `metadataBase` + title template u `src/app/[locale]/layout.tsx`.
- Hreflang: `alternates.languages` (sr = bez prefiksa, en = `/en`, x-default = sr).
  Srpski je podrazumevani jer je tržište balkansko.
- `sitemap.ts` — SVAKA nova javna stranica se dodaje u `publicPaths` (dobija
  automatski obe jezičke varijante). Privatne rute idu u `robots.ts` disallow +
  `robots: { index: false }` u metadata stranice.
- JSON-LD na landing stranici: Organization + WebSite + FAQPage. Novi tip sadržaja =
  odgovarajuća schema (npr. budući javni profili → `Person` + `ProfilePage`).

## Nova javna stranica — kontrolna lista

- [ ] `generateMetadata` sa title + description iz prevoda (oba jezika)
- [ ] Dodata u `sitemap.ts` → `publicPaths`
- [ ] Jedan `<h1>`, logična hijerarhija h2/h3
- [ ] `setRequestLocale(locale)` (statičko renderovanje)
- [ ] Alt tekst na slikama, semantički HTML (`<main>`, `<section>`, `<nav>`)

## Strategija za balkansko tržište

- Ključne fraze (sr): "mikro influenseri", "saradnja sa brendovima", "influencer
  marketing Srbija/Balkan", "kako postati influenser", "barter saradnja".
- Sadržaj pisati latinicom (šire razumljivo u regionu SR/HR/BA/ME).
- Najveći budući SEO dobitak: **javni profili influensera** (`/@username`) i
  landing stranice po kategorijama ("fitnes influenseri u Srbiji") — programmatic SEO
  nad postojećom taksonomijom.
- Blog (faza 2): vodiči za influensere ("kako napraviti media kit", "koliko naplatiti
  objavu") — targetira long-tail upite koje mikroinfluenseri stvarno guglaju.

## Performanse = SEO

- LCP: hero bez velikih slika (SVG + gradijenti), font `display: swap`.
- CLS: rezerviši prostor za slike (`next/image` sa dimenzijama).
- Ne dodavati klijentske skripte trećih strana bez preke potrebe.
