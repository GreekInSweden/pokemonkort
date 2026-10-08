-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Night Moves, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'night-moves-donruss-rtwc26', 'Night Moves', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Christian Pulisic (United States)', 'insert'),
  (2, 'Harry Kane (England)', 'insert'),
  (3, 'Rodrygo (Brazil)', 'insert'),
  (4, 'Endrick (Brazil)', 'insert'),
  (5, 'Lionel Messi (Argentina)', 'insert'),
  (6, 'Cristiano Ronaldo (Portugal)', 'insert'),
  (7, 'Phil Foden (England)', 'insert'),
  (8, 'Cole Palmer (England)', 'insert'),
  (9, 'Nico Williams (Spain)', 'insert'),
  (10, 'Erling Haaland (Norway)', 'insert'),
  (11, 'Jamal Musiala (Germany)', 'insert'),
  (12, 'Bradley Barcola (France)', 'insert'),
  (13, 'Mateo Retegui (Italy)', 'insert'),
  (14, 'Viktor Gyokeres (Sweden)', 'insert'),
  (15, 'Julian Alvarez (Argentina)', 'insert'),
  (16, 'Luis Suarez (Uruguay)', 'insert'),
  (17, 'Kaka (Brazil)', 'insert'),
  (18, 'Carlos Tevez (Argentina)', 'insert'),
  (19, 'Lothar Matthaus (Germany)', 'insert'),
  (20, 'Pele (Brazil)', 'insert'),
  (21, 'Steven Gerrard (England)', 'insert'),
  (22, 'Neymar Jr (Brazil)', 'insert'),
  (23, 'Diego Maradona (Argentina)', 'insert'),
  (24, 'Paolo Maldini (Italy)', 'insert'),
  (25, 'Franz Beckenbauer (Germany)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
