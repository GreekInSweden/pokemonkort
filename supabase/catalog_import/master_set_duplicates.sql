-- Run this in the Supabase SQL editor after member_portfolio.sql,
-- member_cards_intent.sql and member_cards_parallel.sql.
--
-- Lets the Master Set checklist flag "jag äger en dubblett av det här
-- kortet, en av dem är till salu" -- och ha det faktiskt synas för
-- medlemmar via det vanliga matchningssystemet, precis som om en medlem
-- själv hade kryssat i "har" + "till salu" på kortet i sin portfölj.
--
-- Modellen: dubbletterna skrivs till EXAKT samma tabell (member_cards)
-- som portföljen redan använder, kopplade till ett dedikerat
-- medlemskonto som admin pekar ut (se admin_settings nedan) -- inget nytt
-- matchnings- eller meddelande-system behövs, allt befintligt (Mina
-- matchningar, Skicka meddelande, Anmäl medlem) fungerar automatiskt.
--
-- Master Set-sidan skriver till member_cards direkt från admins
-- inloggade webbläsare (samma mönster som master_set_progress redan
-- använder), så authenticated (adminrollen) behöver insert/update på
-- member_cards -- den hade tidigare bara läsrättighet (delete-policyn
-- finns redan sedan member_delete.sql).
--
-- Safe to run more than once.

drop policy if exists "Admin can insert member_cards" on member_cards;
create policy "Admin can insert member_cards"
  on member_cards for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Admin can update member_cards" on member_cards;
create policy "Admin can update member_cards"
  on member_cards for update
  using (auth.role() = 'authenticated');

drop policy if exists "Admin can delete member_cards" on member_cards;
create policy "Admin can delete member_cards"
  on member_cards for delete
  using (auth.role() = 'authenticated');

-- Generisk nyckel/värde-tabell för små admin-inställningar -- just nu
-- bara vilket medlemskonto (användarnamn) dubbletterna ska säljas
-- genom, men kan återanvändas för fler inställningar framöver.
create table if not exists admin_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table admin_settings enable row level security;

drop policy if exists "Admin can manage admin_settings" on admin_settings;
create policy "Admin can manage admin_settings"
  on admin_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

notify pgrst, 'reload schema';
