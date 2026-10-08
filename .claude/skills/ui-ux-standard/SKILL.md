---
name: ui-ux-standard
description: Dizajn sistem i UI/UX standard Kolabo platforme — tokeni boja, tipografija, animacije, komponente i pristupačnost. Koristi pri izradi ili izmeni bilo koje komponente ili stranice.
---

# UI/UX standard (Kolabo)

## Identitet

- Brend: **kolabo** — energičan, mlad, kreatorski; gradijent ljubičasta → roze → ćilibar.
- Ton copy-ja: direktno obraćanje na "ti", kratke rečenice, bez korporativnog žargona.

## Tokeni (globals.css — NE uvoditi nove hex vrednosti po komponentama)

| Token | Upotreba |
|---|---|
| `brand-50..900` | primarna ljubičasta skala (interakcije: `brand-500/600`) |
| `accent-400..600` | roze akcenat (gradijenti, highlights) |
| `ink` / `ink-soft` / `muted` | tekst: naslovi / telo / sekundarno |
| `line`, `surface`, `surface-soft`, `bg` | ivice i pozadine |
| `.card` | standardna kartica (border + radius + senka) |
| `.text-gradient` | SAMO za hero naslove i velike brojke |
| `shadow-soft` / `shadow-lift` | mirno / podignuto (hover) |

- Tipografija: `font-display` (Space Grotesk) za naslove i brojke,
  `font-sans` (Manrope) za sve ostalo. Font subseti moraju uključiti `latin-ext`.
- Radius: kartice `rounded-*` preko `.card`; dugmad i chipovi `rounded-full`;
  inputi `rounded-xl`.

## Animacije

- Ulazak sekcija: `Reveal` / `StaggerGroup` + `StaggerItem` iz `@/components/motion` —
  ne pisati nove whileInView varijante po komponentama.
- Dekorativno plutanje: klase `animate-float-slow` / `animate-float-slower`.
- Trajanja: mikrointerakcije 150–200ms, ulasci 600–800ms; easing `[0.22,1,0.36,1]`.
- SVE animacije poštuju `prefers-reduced-motion` (motion.tsx i globals.css to već rade —
  nove animacije moraju isto).
- Hover na karticama: `hover:-translate-y-1` ili `-0.5` + `hover:shadow-lift`. Ništa agresivnije.

## Komponente

- Prvo pogledaj `src/components/ui/` (Button, Badge, Field/Input/Select/Textarea,
  ChipToggle, Toggle) — novu varijantu dodaj tamo, ne pravi paralelnu komponentu.
- Forme: svako polje kroz `Field` (label + hint + optional oznaka); opciona polja
  označiti `optional={tc("optional")}`.
- Ikonice: `lucide-react`; mreže kroz `SocialIcon` (TikTok je custom SVG).
- Grafikoni (admin): komponente iz `admin/charts.tsx`. Pravila: jedna nijansa za
  količinu (brand-500), kategorijalna paleta SAMO validirana (`#7C3AED, #EC4899, #B45309`),
  vrednosti kao direktne labele u ink boji, nikad dual-axis, nikad rainbow.

## Pristupačnost

- Interaktivni elementi: vidljiv `focus-visible` ring (Button ga već ima), `aria-pressed`
  na toggle chipovima, `role="switch"` na prekidačima, `aria-expanded` na akordeonima.
- Kontrast teksta minimum AA; `muted` ne koristiti za tekst manji od 12px.
- Touch mete ≥ 40px; mobile-first — svaka nova sekcija se prvo proverava na 375px širine.
- Emoji u kategorijama su dekoracija: `aria-hidden` + tekstualna labela pored.
