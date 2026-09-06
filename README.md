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

## 2. Sätt upp admin-inloggningen

Adminpanelen (`/admin`) är den snabbaste vägen att fylla i lager och lägga
upp bilder — sökbar lista med +/− knappar och ett fält per kort/variant,
mycket smidigare än att klicka runt i Supabase när ni just öppnat en hög
paket.

1. Kör `supabase/admin_policies.sql` i Supabase SQL Editor (efter
   `schema.sql` och `seed_pitch_black.sql`). Det ger inloggade användare
   rätt att uppdatera lagersaldo — utan den här filen går det inte att
   spara ändringar i adminpanelen.
2. Kör därefter `supabase/image_support.sql` — den lägger till bildstöd
   (kolumnen `image_url` samt en publik lagringsplats för foton).
3. Gå till **Authentication → Users** i Supabase, klicka **Add user**,
   fyll i din e-post och ett lösenord. Bocka gärna i "Auto Confirm User"
   så slipper du bekräfta via mejl. Det här kontot är ditt admin-login —
   det finns inget separat registreringsformulär i appen, med flit.
4. Gå till `dinsida.vercel.app/admin`, logga in med kontot du skapade.

## 3. Lägg in lager och bilder

**Snabbast — adminpanelen:** Logga in på `/admin`, välj ett set, sök fram
kortet, klicka +/− eller skriv siffran direkt i rutan för Vanligt/Holo,
klicka **Spara ändringar**. Perfekt när du suttit och sorterat en hög
nyöppnade paket och ska mata in allt på en gång.

**Bilder:** Klicka på den lilla bildrutan längst till vänster på ett kort i
adminlistan för att ladda upp ett foto av det faktiska kortet — det ersätter
platshållaren (kortnumret på en färgad ruta) både i adminlistan och ute i
butiken. En bild per kort räcker (inte en per exemplar), eftersom flera
likadana kort ser identiska ut.

Ni behöver **inte** fotografera alla 120 kort på en gång — lägg bara upp
bilder efter hand, i den takt ni ändå går igenom korten för att fylla i
lager. Kort utan bild visar en enkel färgad platshållare istället, helt
fungerande men mindre snyggt.

**Alternativet — direkt i Supabase:** Table Editor → `card_variants` för
lager, eller `cards` för att klistra in en bild-URL direkt i kolumnen
`image_url` om ni redan har bilder liggande någon annanstans.

Oavsett metod: kort med `stock = 0` visas gråa och går inte att klicka på i
butiken — så fort saldot är över 0 dyker kortet upp som köpbart, automatiskt.

## 4. Kör lokalt

```bash
npm install
cp .env.local.example .env.local
# fyll i dina Supabase-nycklar och ditt Swish-nummer i .env.local
npm run dev
```

Öppna http://localhost:3000

## 5. Lägg upp på GitHub

```bash
git init
git add .
git commit -m "Första versionen av Kortlagret"
git branch -M main
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/kortlagret.git
git push -u origin main
```

## 6. Deploya på Vercel

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
  admin/login/page.tsx          Adminlogin
  admin/(dashboard)/page.tsx    Adminstartsida — välj set
  admin/(dashboard)/[setSlug]/page.tsx   Lagerredigering för ett set
components/
  CardGrid.tsx / CardModal.tsx  Interaktivt kortval
  SiteHeader.tsx                Header med varukorgsindikator
  admin/StockEditor.tsx          Sökbar lagerredigerare med snabbknappar
  admin/LogoutButton.tsx         Loggar ut ur adminpanelen
lib/
  CartContext.tsx               Varukorg (localStorage)
  supabaseClient.ts              Publik klient (läsning, butik)
  supabaseAdmin.ts                Service-role-klient (endast i API-routes)
  supabase/server.ts              Inloggad admin-klient (Server Components)
  supabase/browser.ts             Inloggad admin-klient (webbläsaren)
middleware.ts                    Skyddar /admin — kräver inloggning
supabase/
  schema.sql                     Databastabeller + policys
  seed_pitch_black.sql           Pitch Black, alla 120 kort
  admin_policies.sql              Ger inloggad admin rätt att spara lager
  image_support.sql               Bildkolumn + lagringsplats för kortfoton
```
