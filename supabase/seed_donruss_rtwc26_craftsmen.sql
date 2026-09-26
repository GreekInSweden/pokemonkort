-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Craftsmen, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'craftsmen-donruss-rtwc26', 'Craftsmen', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Cristian Romero (Argentina)', 'insert'),
  (2, 'Gabriel Martinelli (Brazil)', 'insert'),
  (3, 'Chris Richards (United States)', 'insert'),
  (4, 'James Rodriguez (Colombia)', 'insert'),
  (5, 'Ivan Perisic (Croatia)', 'insert'),
  (6, 'Ollie Watkins (England)', 'insert'),
  (7, 'Eduardo Camavinga (France)', 'insert'),
  (8, 'Joshua Kimmich (Germany)', 'insert'),
  (9, 'Mohammed Salisu (Ghana)', 'insert'),
  (10, 'Deybi Flores (Honduras)', 'insert'),
  (11, 'Sandro Tonali (Italy)', 'insert'),
  (12, 'In-Beom Hwang (Korea Republic)', 'insert'),
  (13, 'Santiago Gimenez (Mexico)', 'insert'),
  (14, 'Noussair Mazraoui (Morocco)', 'insert'),
  (15, 'Ademola Lookman (Nigeria)', 'insert'),
  (16, 'Enzo Fernandez (Argentina)', 'insert'),
  (17, 'Bruno Guimaraes (Brazil)', 'insert'),
  (18, 'Marcus Rashford (England)', 'insert'),
  (19, 'Alessandro Bastoni (Italy)', 'insert'),
  (20, 'Goncalo Ramos (Portugal)', 'insert'),
  (21, 'Dani Olmo (Spain)', 'insert'),
  (22, 'Ruben Vargas (Switzerland)', 'insert'),
  (23, 'Joao Neves (Portugal)', 'insert'),
  (24, 'Jakub Moder (Poland)', 'insert'),
  (25, 'Fabian Ruiz (Spain)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
