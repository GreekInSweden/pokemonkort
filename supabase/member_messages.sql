-- Run after member_portfolio.sql (needs members) and parallel_tiers.sql
-- (needs parallel_tiers, for the card-context reference).
--
-- Ett enkelt meddelande-system MELLAN medlemmar -- INTE en realtidschatt.
-- Tanken: chansen att två medlemmar är inloggade samtidigt är liten, så
-- istället för websockets/polling är det här bara ett vanligt
-- brevlåde-mönster -- skriv ett meddelande, det dyker upp nästa gång
-- mottagaren laddar om sin sida. Ingen "skriver..."-indikator, ingen
-- läst-kvitto i realtid, bara en enkel lista.
--
-- Ett meddelande hör ALLTID ihop med ett kort (card_id/variant/
-- parallel_tier_id) -- det finns ingen fri "skriv till vem som helst"-
-- funktion, meddelanden skickas i kontexten av en matchning, samma
-- säkerhetsmodell som /api/member/matchningar/reveal (går bara att nå
-- via en genuin matchning, kollas server-side i API-routen).

create table if not exists member_messages (
  id uuid primary key default gen_random_uuid(),
  from_member_id uuid not null references members(id) on delete cascade,
  to_member_id uuid not null references members(id) on delete cascade,
  card_id uuid references cards(id) on delete set null,
  variant text,
  parallel_tier_id uuid references parallel_tiers(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_member_messages_to on member_messages(to_member_id, created_at desc);
create index if not exists idx_member_messages_from on member_messages(from_member_id, created_at desc);

alter table member_messages enable row level security;
drop policy if exists "Admin can read member_messages" on member_messages;
create policy "Admin can read member_messages" on member_messages for select using (auth.role() = 'authenticated');
drop policy if exists "Admin can delete member_messages" on member_messages;
create policy "Admin can delete member_messages" on member_messages for delete using (auth.role() = 'authenticated');
-- Ingen insert/select-policy för webbläsaren -- allt går genom
-- /api/member/messages med service-role-nyckeln, samma mönster som
-- member_reports och alla andra medlems-skrivningar i projektet.

notify pgrst, 'reload schema';
