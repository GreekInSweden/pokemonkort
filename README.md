# Kortlagret

En enkel butik för att sälja lösa Pokémonkort styckvis. Kunder väljer
kategori (t.ex. "Mega Evolution") → set (t.ex. "Pitch Black") → klickar på
enskilda kort → väljer variant (vanligt/holo) och antal → går till kassan →
betalar manuellt via Swish.

Byggt med **Next.js** (Vercel), **Supabase** (databas) och vanlig **Swish**
(inget företagsavtal krävs för att börja — kunden swishar manuellt och du
bekräftar).

## 1. Sätt upp Supabase

1. Skapa ett nytt projekt på [supabase.com](https://supabase.com).
2. Gå till **SQL Editor** → **New query**, klistra in innehållet i
   `supabase/schema.sql` och kör det. Det skapar alla tabeller.
3. Kör därefter `supabase/seed_pitch_black.sql` i en ny query — det lägger in
   Pitch Black-setet och alla 120 kort (både vanlig och holo-variant), med
   **stock = 0** på allihop.
4. Gå till **Project Settings → API** och notera:
   - `Project URL` → blir `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → blir `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → blir `SUPABASE_SERVICE_ROLE_KEY` (håll hemlig!)

## 2. Lägg in lager (vilka kort som finns att köpa)

Öppna **Table Editor → card_variants** i Supabase. Varje kort har två rader
(normal + holo). Sätt `stock` till hur många ni faktiskt har, och justera
`price_sek` om ni vill ändra priset. Kort med `stock = 0` visas gråa och
går inte att klicka på i butiken — så fort ni sätter ett stock-tal >0 dyker
kortet upp som köpbart, helt automatiskt.

Det finns ingen admin-sida i den här första versionen — Supabase Table
Editor *är* admin-panelen. Enklast sättet att jobba: filtrera tabellen på
kort ni vill uppdatera, ändra `stock` direkt i cellen.

## 3. Kör lokalt

```bash
npm install
cp .env.local.example .env.local
# fyll i dina Supabase-nycklar och ditt Swish-nummer i .env.local
npm run dev
```

Öppna http://localhost:3000

## 4. Lägg upp på GitHub

```bash
git init
git add .
git commit -m "Första versionen av Kortlagret"
git branch -M main
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/kortlagret.git
git push -u origin main
```

## 5. Deploya på Vercel

1. Gå till [vercel.com/new](https://vercel.com/new), importera GitHub-repot.
2. Under **Environment Variables**, lägg in samma fyra variabler som i
   `.env.local` (URL, anon key, service role key, Swish-nummer).
3. Klicka **Deploy**. Klart — sidan är live.

## Hur beställningar hanteras just nu (Swish manuellt)

1. Kund lägger kort i varukorgen och fyller i sina uppgifter i kassan.
2. En order skapas i Supabase (`orders`-tabellen) med status
   `pending_payment`, och lagersaldot för de köpta korten minskas direkt.
3. Kunden ser ett ordernummer och ditt Swish-nummer, och ombeds skriva
   ordernumret som meddelande i Swish-appen.
4. Du kollar Swish-appen, matchar betalningen mot ordernumret, och ändrar
   ordern till `status = 'paid'` i Supabase Table Editor (tabell `orders`).
5. Du packar och skickar.

Vill ni längre fram automatisera steg 3–4 med riktig Swish-integration krävs
ett Swish-handelsavtal via en betalväxel (t.ex. Swedbank Pay eller Trustly)
— hör av er så bygger vi på med det när ni är redo för det steget.

## Bygga på med fler set

Varje nytt set är bara nya rader i Supabase:

1. Lägg till en rad i `sets` (category_slug, category_name, slug, name).
2. Lägg till kortens rader i `cards` (kopplade till setets `id`).
3. Lägg till en `normal`- och `holo`-rad per kort i `card_variants`.

Sidan plockar upp nya kategorier/set automatiskt — ingen kodändring behövs.
Vill ni ha ett skript liknande `seed_pitch_black.sql` för ett annat set,
hör bara av er så genererar vi ett.

## Struktur

```
app/
  page.tsx                    Startsida — kategorier
  [category]/page.tsx         Set-lista inom en kategori
  [category]/[setSlug]/page.tsx   Kortgrid (5 per rad) för ett set
  kassa/page.tsx               Varukorg + kundformulär
  order-confirmed/page.tsx     Swish-instruktioner
  api/checkout/route.ts        Skapar order + drar av lager (server-side)
components/
  CardGrid.tsx / CardModal.tsx  Interaktivt kortval
  SiteHeader.tsx                Header med varukorgsindikator
lib/
  CartContext.tsx               Varukorg (localStorage)
  supabaseClient.ts              Publik klient (läsning)
  supabaseAdmin.ts                Service-role-klient (endast i API-routes)
supabase/
  schema.sql                     Databastabeller + policys
  seed_pitch_black.sql           Pitch Black, alla 120 kort
```
