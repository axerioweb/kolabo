# Arhitektura

## Pregled

```
Browser ──► Next.js 15 (App Router, RSC + Server Actions) ──► Supabase (Postgres + Auth + RLS + Storage + Realtime)
```

- **Server Components** čitaju podatke (`src/lib/queries.ts`), sesija se čita jednom
  po zahtevu kroz `getSession()` (`src/lib/session.ts`, React `cache`).
- **Server Actions** (`src/app/actions/`) pišu podatke — nikad direktan write iz klijenta.
- **RLS + trigeri u bazi** su poslednja linija odbrane: prelazi statusa upita,
  zaštita uloge/verifikacije, limiti upita i obaveštenja žive u bazi.
- **Javne stranice** (katalog, profil, kategorije, sitemap) koriste klijent bez
  kolačića (`src/lib/supabase/public.ts`) — rade kao `anon`, keširaju se 5 min sa
  tagom `public-creators`, a akcije koje menjaju javne podatke ga odmah poništavaju.

## Uloge

| Uloga | Šta radi |
|---|---|
| `influencer` | profil (5 koraka), javni profil, prima upite, poruke, isporuka, ocene |
| `company` | profil firme (PIB/MB), pretraga, sačuvani kreatori, šalje upite, poruke, ocene |
| `admin` | KPI i grafikoni, verifikacija i suspenzija, pregled upita, prijave |

Uloga se bira pri registraciji (`account_type` u metadata → trigger
`handle_new_user`). Admin se dodeljuje isključivo SQL-om.

## Model podataka

```
auth.users 1──1 profiles ──┬──< social_accounts      (mreža + publika)
                           ├──< profile_categories >── categories
                           ├──< services             (usluga + raspon cena)
                           ├──1 collaboration_prefs  (barter, min budžet)
                           ├──1 contact_prefs        (kontakt — samo vlasnik/admin)
                           ├──1 companies            (ako je role = company)
                           ├──< notifications        (template + data → prevod u UI)
                           └──< saved_influencers    (shortlista firme)

collaboration_requests (company_id, influencer_id, brief, isporuke, kompenzacija, status)
   ├──< messages   (recipient_id postavlja trigger)
   ├──< reviews    (posle completed, jedna po strani)
   └──< reports    (prijave zloupotrebe)
```

### Tok upita

```
pending ──(kreator)──► accepted ──(kreator)──► delivered ──(firma)──► completed
   │                       │                       │
   ├─(kreator)► declined   └─(oba)► cancelled      └─(firma)► accepted (izmene)
   └─(firma)──► cancelled
```

Prelaze proverava trigger `requests_guard_update`; obaveštenja pravi `requests_notify`.
Kontakt druge strane vraća RPC `get_request_contact` tek od `accepted`, i to samo
kanale iz `allowed_channels`.

### Ključne odluke

- **Rasponi umesto tačnih brojki** (`follower_range`) — lakši unos, dovoljni za filtere.
- **Kontakt tek posle prihvatanja** — štiti kreatore i podiže odziv (vidi docs/RESEARCH.md).
- **Poruke pripadaju upitu** — nema neželjenih DM-ova bez konkretne ponude.
- **Obaveštenja kao šabloni** (`template` + `data`) — prevode se na jezik korisnika.
- **Prava na nivou kolona** — `anon` ne vidi `birth_year`/`gender`; primalac poruke
  menja samo `read_at`.
- **Limit upita** — neverifikovana firma 5/dan, verifikovana 30/dan; jedan otvoren upit
  po paru firma–kreator.
- **Migracije bez DROP** — postojeće polise se menjaju kroz `ALTER POLICY`.

## RPC funkcije

| Funkcija | Svrha |
|---|---|
| `search_influencers(...)` | pretraga sa filterima + paginacija (security invoker) |
| `my_requests(status)` | inbox sa poslednjom porukom i brojem nepročitanih |
| `get_request_contact(rid)` | kontakt posle prihvatanja (security definer) |
| `delete_my_account()` | GDPR brisanje (migracija 0011, ručno) |

## i18n

- `sr` (bez prefiksa) i `en` (`/en`), lokalizovane putanje u `src/i18n/routing.ts`.
- `npm run i18n:check` proverava da svaki statički ključ iz koda postoji u oba fajla.

## SEO

- Javni profili `/kreatori/<username>` (ProfilePage + Person JSON-LD, ISR).
- Stranice po kategorijama `/kreatori/kategorija/<slug>` (CollectionPage, 30 × 2 jezika).
- `/za-brendove` (FAQPage), dinamički `sitemap.xml` sa javnim profilima.

## Privatnost i pravo

- Odvojeni pristanci pri registraciji (uslovi + 18+ obavezno, marketing opciono).
- Izvoz podataka (`/api/export`) i brisanje naloga u Podešavanjima.
- Obavezna potvrda označavanja reklame u svakom upitu (Zakon o oglašavanju čl. 13).
