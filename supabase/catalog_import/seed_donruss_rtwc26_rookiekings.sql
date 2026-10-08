-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Rookie Kings, 25 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg -- INTE maskinläsbart hämtat, räkna med
-- enstaka fel/missade rader. Landslag inom parentes, precis som i
-- grundsetet (seed_donruss_rtwc26_base.sql) -- se den filens header för
-- samma osäkerhetsnivå-kommentar.
--
-- Numrering: egen löpande numrering (1..N) i den ordning insertet listas i källan -- inte nödvändigtvis samma nummer som på kortets baksida.
--
-- Run this once in the Supabase SQL editor after schema.sql AND
-- set_visibility.sql AND topps_rarity.sql AND sets_product_line.sql AND
-- seed_donruss_rtwc26_base.sql.
-- Stock defaults to 0 -- cards stay greyed out (and the set stays hidden)
-- until you set real stock in /admin. Price defaults to a flat placeholder.
-- Only a 'normal' variant is created (no holo).

with s as (
  insert into sets (category_slug, category_name, slug, name, is_visible, product_line)
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'rookie-kings-donruss-rtwc26', 'Rookie Kings', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Denzell Garcia (Mexico)', 'insert'),
  (2, 'Petar Sucic (Croatia)', 'insert'),
  (3, 'Osame Sahraoui (Morocco)', 'insert'),
  (4, 'Shea Charles (Northern Ireland)', 'insert'),
  (5, 'El Hadji Malick Diouf (Senegal)', 'insert'),
  (6, 'Sindre Walle Egeli (Norway)', 'insert'),
  (7, 'Troy Parrott (Republic of Ireland)', 'insert'),
  (8, 'Tolu Arokodare (Nigeria)', 'insert'),
  (9, 'Sebastian Nanasi (Sweden)', 'insert'),
  (10, 'Gilberto Mora (Mexico)', 'insert'),
  (11, 'Mihajlo Cvetkovic (Serbia)', 'insert'),
  (12, 'Dominik Marczuk (Poland)', 'insert'),
  (13, 'Justin Devenny (Northern Ireland)', 'insert'),
  (14, 'Alvyn Sanches (Switzerland)', 'insert'),
  (15, 'Jordan James (Cymru)', 'insert'),
  (16, 'Luciano Rodriguez (Uruguay)', 'insert'),
  (17, 'Luka Vuskovic (Croatia)', 'insert'),
  (18, 'Pierce Charles (Northern Ireland)', 'insert'),
  (19, 'Hugo Bolin (Sweden)', 'insert'),
  (20, 'Erik Lira (Mexico)', 'insert'),
  (21, 'Leonidas Stergiou (Switzerland)', 'insert'),
  (22, 'Tommy Conway (Scotland)', 'insert'),
  (23, 'Damion Downs (United States)', 'insert'),
  (24, 'Andrija Maksimovic (Serbia)', 'insert'),
  (25, 'Nick Woltemade (Germany)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
