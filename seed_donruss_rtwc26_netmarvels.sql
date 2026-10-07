-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Net Marvels, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'net-marvels-donruss-rtwc26', 'Net Marvels', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Jordan Pickford (England)', 'insert'),
  (2, 'Cristiano Ronaldo (Portugal)', 'insert'),
  (3, 'Moise Kean (Italy)', 'insert'),
  (4, 'Luis Diaz (Colombia)', 'insert'),
  (5, 'Rodrygo (Brazil)', 'insert'),
  (6, 'Inaki Williams (Ghana)', 'insert'),
  (7, 'Robert Lewandowski (Poland)', 'insert'),
  (8, 'Raul Jimenez (Mexico)', 'insert'),
  (9, 'Samu Aghehowa (Spain)', 'insert'),
  (10, 'Alexander Isak (Sweden)', 'insert'),
  (11, 'Ricardo Pepi (United States)', 'insert'),
  (12, 'Dominic Solanke (England)', 'insert'),
  (13, 'Youssef En-Nesyri (Morocco)', 'insert'),
  (14, 'Julian Alvarez (Argentina)', 'insert'),
  (15, 'Randal Kolo Muani (France)', 'insert'),
  (16, 'Federico Valverde (Uruguay)', 'insert'),
  (17, 'Mateo Retegui (Italy)', 'insert'),
  (18, 'Vini Jr. (Brazil)', 'insert'),
  (19, 'Alexander Sorloth (Norway)', 'insert'),
  (20, 'Victor Boniface (Nigeria)', 'insert'),
  (21, 'Lionel Messi (Argentina)', 'insert'),
  (22, 'Serge Gnabry (Germany)', 'insert'),
  (23, 'Ferran Torres (Spain)', 'insert'),
  (24, 'Viktor Gyokeres (Sweden)', 'insert'),
  (25, 'Rafael Leao (Portugal)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
