-- Parallels (färgade/numrerade varianter av samma kort, typ "Gold /50")
-- för Topps-sportkort. Helt separat dimension från card_variants.variant
-- (normal/holo/reverse_holo, som bara gäller Pokémon) -- en Topps-parallel
-- är en egenskap hos SETET (vilka nivåer finns) snarare än en fast enum,
-- eftersom varje set/insert har sin egen unika lista.
--
-- En rad här = en (set, parallel-namn)-kombination. Vi lagrar INTE en rad
-- per kort×parallel i förväg -- se pokemon_type_and_reverse_holo.sql och
-- master_set_progress för samma princip: definiera byggstenarna, låt
-- medlemmarna skapa rader bara för det de faktiskt äger/vill ha (i
-- member_cards, se member_cards_parallel.sql).
create table if not exists parallel_tiers (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references sets(id) on delete cascade,
  name text not null,           -- t.ex. "Gold Rainbow Foil", "FoilFractor"
  channel text,                 -- 'hobby' | 'retail' | null (okänd/blandad)
  print_run int,                -- 50 för "/50". null = onumrerad (odds-baserad)
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (set_id, name)
);

alter table parallel_tiers enable row level security;
create policy "Public can read parallel_tiers" on parallel_tiers for select using (true);

create index if not exists idx_parallel_tiers_set_id on parallel_tiers(set_id);

-- Pilot: Grundsettet (Topps Premier League 2026/27, slug 'grundset') --
-- det enda vi hittills har en läsbar källa för. Källa: checklistinsider.com
-- 2026-27 Topps Flagship Premier League, hämtad via webbsökning den
-- 2026-09-24 -- INTE Topps eget material, så SIFFRORNA ÄR INTE VERIFIERADE
-- rad för rad. Några saker att flagga innan ni litar på det här:
--   - "Gold Sparkle Foil /50" OCH "/250" förekommer båda i källan -- kan
--     vara två olika kort (olika "hit"-nivå) eller ett extraktionsfel,
--     jag har inte kunnat avgöra vilket.
--   - "PL Parallel (1:4)" är vagt namngivet i källan, ingen känd färg.
--   - Strukturen SKILJER SIG mot föregående säsong (2025/26) -- kolla inte
--     upp fel års guide av misstag, det gjorde jag nästan själv.
-- Städa/rätta gärna mot en riktig box innan ni litar på det här fullt ut.
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  -- Retail
  ('PL Parallel (1:4)', 'retail', null, 1),
  ('Gold Rainbow Laser', 'retail', null, 2),
  ('Blue Voltage (Super Tin)', 'retail', null, 3),
  ('Green Voltage (Blaster)', 'retail', null, 4),
  ('Pink Voltage (Mega Tin)', 'retail', null, 5),
  ('Purple Voltage (Mega Multi-Pack)', 'retail', null, 6),
  ('Yellow Voltage (Eco Pack)', 'retail', null, 7),
  ('Aqua Sparkle Foil', 'retail', 499, 8),
  ('Pink Mini-Diamond Foil', 'retail', 399, 9),
  ('Pink Sparkle Foil', 'retail', 399, 10),
  ('Yellow Mini-Diamond Foil', 'retail', 299, 11),
  ('Yellow Sparkle Foil', 'retail', 299, 12),
  ('Gold Sparkle Foil', 'retail', 250, 13),
  ('Purple Mini-Diamond Foil', 'retail', 199, 14),
  ('Purple Sparkle Foil', 'retail', 199, 15),
  ('Blue Mini-Diamond Foil', 'retail', 150, 16),
  ('Blue Sparkle Foil', 'retail', 150, 17),
  ('Green Mini-Diamond Foil', 'retail', 99, 18),
  ('Green Sparkle Foil', 'retail', 99, 19),
  ('Black & White Mini-Diamond Foil', 'retail', 75, 20),
  ('Black & White Sparkle Foil', 'retail', 75, 21),
  ('Gold Mini-Diamond Foil', 'retail', 50, 22),
  ('Gold Sparkle Foil /50', 'retail', 50, 23),
  ('Orange Mini-Diamond Foil', 'retail', 25, 24),
  ('Orange Sparkle Foil', 'retail', 25, 25),
  ('Black Mini-Diamond Foil', 'retail', 10, 26),
  ('Black Sparkle Foil', 'retail', 10, 27),
  ('Red Mini-Diamond Foil', 'retail', 5, 28),
  ('Red Sparkle Foil', 'retail', 5, 29),
  ('FoilFractor (Retail)', 'retail', 1, 30),
  -- Hobby
  ('Blue Rainbow Foil', 'hobby', 150, 31),
  ('Green Rainbow Foil', 'hobby', 99, 32),
  ('Black & White Rainbow Foil', 'hobby', 75, 33),
  ('Gold Rainbow Foil', 'hobby', 50, 34),
  ('Netbuster', 'hobby', 38, 35),
  ('Orange Rainbow Foil', 'hobby', 25, 36),
  ('Black Rainbow Foil', 'hobby', 10, 37),
  ('Red Rainbow Foil', 'hobby', 5, 38),
  ('FoilFractor (Hobby)', 'hobby', 1, 39)
) as v(name, channel, print_run, sort_order)
where s.slug = 'grundset'
on conflict (set_id, name) do nothing;
