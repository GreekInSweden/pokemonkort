-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Dominators, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'dominators-donruss-rtwc26', 'Dominators', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Leroy Sane (Germany)', 'insert'),
  (2, 'Gianluigi Donnarumma (Italy)', 'insert'),
  (3, 'Lionel Messi (Argentina)', 'insert'),
  (4, 'Francisco Conceicao (Portugal)', 'insert'),
  (5, 'Kalidou Koulibaly (Senegal)', 'insert'),
  (6, 'Declan Rice (England)', 'insert'),
  (7, 'Nico Williams (Spain)', 'insert'),
  (8, 'Mohammed Kudus (Ghana)', 'insert'),
  (9, 'Alisson Becker (Brazil)', 'insert'),
  (10, 'Josko Gvardiol (Croatia)', 'insert'),
  (11, 'David Raum (Germany)', 'insert'),
  (12, 'Alexander Isak (Sweden)', 'insert'),
  (13, 'Yassine Bounou (Morocco)', 'insert'),
  (14, 'Morgan Rogers (England)', 'insert'),
  (15, 'Mateo Retegui (Italy)', 'insert'),
  (16, 'Nuno Mendes (Portugal)', 'insert'),
  (17, 'Emiliano Martinez (Argentina)', 'insert'),
  (18, 'Antonee Robinson (United States)', 'insert'),
  (19, 'Mikel Oyarzabal (Spain)', 'insert'),
  (20, 'Dusan Vlahovic (Serbia)', 'insert'),
  (21, 'Vini Jr. (Brazil)', 'insert'),
  (22, 'Martin Odegaard (Norway)', 'insert'),
  (23, 'Diego Maradona (Argentina)', 'insert'),
  (24, 'Franz Beckenbauer (Germany)', 'insert'),
  (25, 'Pele (Brazil)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
