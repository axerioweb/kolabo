# Arhitektura

## Pregled

```
Browser ──► Next.js 15 (App Router, RSC + Server Actions) ──► Supabase (Postgres + Auth + RLS)
```

- **Server Components** čitaju podatke direktno preko `src/lib/supabase/server.ts`
- **Server Actions** (`src/app/actions/`) pišu podatke — nikad direktan write iz klijenta
- **RLS u bazi** je poslednja linija odbrane: i da klijent zaobiđe UI, baza ne da tuđe redove
- **Middleware** radi dve stvari: i18n rutiranje (next-intl) + osvežavanje auth sesije

## i18n

- `sr` (podrazumevani, bez URL prefiksa — bolje za SEO na Balkanu) i `en` (pod `/en`)
- Lokalizovane putanje: `/registracija` ↔ `/en/signup` (mapa u `src/i18n/routing.ts`)
- UI stringovi u `src/messages/{sr,en}.json`; domenske vrednosti (kategorije, mreže,
  rasponi) nose svoje sr/en labele u `src/lib/taxonomy.ts`

## Model podataka

```
auth.users 1──1 profiles ──┬──< social_accounts   (mreža + metrike publike po mreži)
                           ├──< profile_categories >── categories (šifarnik, maks 5)
                           ├──< services            (tip usluge + raspon cena)
                           ├──1 collaboration_prefs (barter, min budžet)
                           ├──1 contact_prefs       (kanali kontakta, notifikacije)
                           ├──< notifications       (in-app obaveštenja)
                           └──< messages            (osnova budućeg inboxa)
```

Ključne odluke:

- **Rasponi umesto tačnih brojki** (`follower_range` enum) — lakši unos, iskren podatak,
  dovoljan za filtriranje; tačne brojke su opcione kolone.
- **Metrike publike žive na `social_accounts`** (pol, godište, zemlje publike po mreži),
  jer se publika razlikuje od mreže do mreže.
- **`taxonomy.ts` ↔ `categories` tabela**: frontend čita konstante (brzo, typesafe),
  baza drži šifarnik za integritet i buduću pretragu. Menjaš li jedno — menjaj i drugo.
- **Demo režim**: bez env promenljivih aplikacija radi sa `src/lib/demo-data.ts`,
  pa se dizajn može pregledati bez baze.

## Uloge i pristup

| Uloga | Pristup |
|---|---|
| `influencer` | svoj profil, svoje mreže/usluge/preference, svoja obaveštenja |
| `admin` | read sve (metrike, statistika, tabela), upravljanje notifikacijama |

Provera uloge: `public.is_admin()` (security definer) u RLS polisama;
u aplikaciji `profile.role === "admin"` posle server-side fetch-a.

## Spremno za sledeće faze

- **Naplata**: `services.currency` + rasponi cena su tu; dodaješ `subscriptions` /
  `orders` tabele i Stripe (ili lokalni provajder) bez menjanja postojećeg.
- **Nalozi za firme**: nova uloga `company` u `user_role` enumu + `companies` tabela;
  pretraga influensera već ima filtere u admin tabeli koje ćeš reciklirati.
- **Verifikacija**: `profiles.status` enum već ima `pending/active/suspended`;
  dodaš `verified_at` kolonu i admin akciju.
- **Poruke**: `messages` tabela + RLS su postavljeni; treba UI inbox + realtime kanal.
