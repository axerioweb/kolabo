# Podešavanje Supabase projekta

## 1. Kreiraj projekat

1. Idi na [supabase.com](https://supabase.com) → **New project**
2. Naziv: `kolabo` (ili po želji), region: **Frankfurt (eu-central-1)** — najbliži Balkanu
3. Sačuvaj database lozinku na sigurno mesto

## 2. Pokreni migracije

U Supabase dashboardu otvori **SQL Editor** i pokreni redom:

1. `supabase/migrations/0001_schema.sql` — enumi, tabele, trigeri
2. `supabase/migrations/0002_rls.sql` — Row Level Security polise
3. `supabase/seed.sql` — šifarnik kategorija

> Alternativa preko CLI: `supabase link --project-ref <ref>` pa `supabase db push`,
> zatim seed kroz SQL editor.

## 3. Poveži aplikaciju

```bash
cp .env.example .env.local
```

U **Project Settings → API** nađi:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` ključ → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Restartuj `npm run dev` — demo režim se automatski gasi.

## 4. Auth podešavanja

U **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (kasnije produkcijski domen)
- Redirect URLs: dodaj `http://localhost:3000/auth/callback`

U **Authentication → Providers → Email**: uključen je podrazumevano
(email + lozinka, sa potvrdom preko emaila).

## 5. Napravi sebi admin nalog

1. Registruj se normalno kroz aplikaciju (`/registracija`)
2. U SQL editoru pokreni:

```sql
update public.profiles
set role = 'admin', status = 'active', onboarding_completed = true
where id = (select id from auth.users where email = 'tvoj@email.com');
```

3. Nakon ponovne prijave imaš pristup `/admin`

## 6. (Opciono) Regeneriši TypeScript tipove

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```

Trenutno aplikacija koristi ručno pisane tipove u `src/lib/types.ts` —
kada uvedeš generisane tipove, prebaci klijente na `createClient<Database>()`.

## Bezbednosne napomene

- **RLS je uključen na svim tabelama** — influenser vidi/menja samo svoje redove,
  admin ima read pristup svemu preko `is_admin()` security definer funkcije.
- Korisnik **ne može sam sebi da promeni ulogu** (polisa na `profiles`).
- `service_role` ključ NIKAD ne ide u `NEXT_PUBLIC_*` promenljive niti u klijentski kod.
- Trigger `handle_new_user` automatski pravi profil i welcome notifikaciju.
