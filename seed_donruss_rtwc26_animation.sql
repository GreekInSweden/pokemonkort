-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Animation, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'animation-donruss-rtwc26', 'Animation', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Lamine Yamal (Spain)', 'insert'),
  (2, 'Erling Haaland (Norway)', 'insert'),
  (3, 'Nico Williams (Spain)', 'insert'),
  (4, 'Lionel Messi (Argentina)', 'insert'),
  (5, 'Cristiano Ronaldo (Portugal)', 'insert'),
  (6, 'Kylian Mbappe (France)', 'insert'),
  (7, 'Viktor Gyokeres (Sweden)', 'insert'),
  (8, 'Florian Wirtz (Germany)', 'insert'),
  (9, 'Vini Jr. (Brazil)', 'insert'),
  (10, 'Robert Lewandowski (Poland)', 'insert'),
  (11, 'Luka Modric (Croatia)', 'insert'),
  (12, 'Alexander Isak (Sweden)', 'insert'),
  (13, 'Pedri (Spain)', 'insert'),
  (14, 'Jude Bellingham (England)', 'insert'),
  (15, 'Kaka (Brazil)', 'insert'),
  (16, 'Gabriel Batistuta (Argentina)', 'insert'),
  (17, 'Gianluigi Buffon (Italy)', 'insert'),
  (18, 'Luis Suarez (Uruguay)', 'insert'),
  (19, 'Ronaldo (Brazil)', 'insert'),
  (20, 'Edinson Cavani (Uruguay)', 'insert'),
  (21, 'Neymar Jr (Brazil)', 'insert'),
  (22, 'Manuel Neuer (Germany)', 'insert'),
  (23, 'Pele (Brazil)', 'insert'),
  (24, 'Diego Maradona (Argentina)', 'insert'),
  (25, 'Franz Beckenbauer (Germany)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
