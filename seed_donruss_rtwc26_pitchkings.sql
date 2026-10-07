-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Pitch Kings, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'pitch-kings-donruss-rtwc26', 'Pitch Kings', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Savinho (Brazil)', 'insert'),
  (2, 'Bruno Fernandes (Portugal)', 'insert'),
  (3, 'Tom Bischof (Germany)', 'insert'),
  (4, 'Matt Turner (United States)', 'insert'),
  (5, 'Reece James (England)', 'insert'),
  (6, 'Nico Williams (Spain)', 'insert'),
  (7, 'Davide Frattesi (Italy)', 'insert'),
  (8, 'Kevin Castano (Colombia)', 'insert'),
  (9, 'Lautaro Martinez (Argentina)', 'insert'),
  (10, 'Ruben Dias (Portugal)', 'insert'),
  (11, 'Martin Odegaard (Norway)', 'insert'),
  (12, 'Pedri (Spain)', 'insert'),
  (13, 'Endrick (Brazil)', 'insert'),
  (14, 'Rodrigo de Paul (Argentina)', 'insert'),
  (15, 'Luka Modric (Croatia)', 'insert'),
  (16, 'Achraf Hakimi (Morocco)', 'insert'),
  (17, 'Maximilian Mittelstadt (Germany)', 'insert'),
  (18, 'Curtis Jones (England)', 'insert'),
  (19, 'Mike Maignan (France)', 'insert'),
  (20, 'Darwin Nunez (Uruguay)', 'insert'),
  (21, 'Giovanni Di Lorenzo (Italy)', 'insert'),
  (22, 'Hugo Larsson (Sweden)', 'insert'),
  (23, 'Pele (Brazil)', 'insert'),
  (24, 'Diego Maradona (Argentina)', 'insert'),
  (25, 'Franz Beckenbauer (Germany)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
