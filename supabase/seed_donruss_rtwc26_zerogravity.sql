-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Zero Gravity, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'zero-gravity-donruss-rtwc26', 'Zero Gravity', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Isaac Price (Northern Ireland)', 'insert'),
  (2, 'Erling Haaland (Norway)', 'insert'),
  (3, 'Miguel Almiron (Paraguay)', 'insert'),
  (4, 'Piotr Zielinski (Poland)', 'insert'),
  (5, 'Diogo Costa (Portugal)', 'insert'),
  (6, 'Jake O''Brien (Republic of Ireland)', 'insert'),
  (7, 'Andy Robertson (Scotland)', 'insert'),
  (8, 'Assane Diao (Senegal)', 'insert'),
  (9, 'Ivan Ilic (Serbia)', 'insert'),
  (10, 'Lamine Yamal (Spain)', 'insert'),
  (11, 'Viktor Gyokeres (Sweden)', 'insert'),
  (12, 'Gregor Kobel (Switzerland)', 'insert'),
  (13, 'Brenden Aaronson (United States)', 'insert'),
  (14, 'Federico Valverde (Uruguay)', 'insert'),
  (15, 'Ethan Ampadu (Cymru)', 'insert'),
  (16, 'Theo Hernandez (France)', 'insert'),
  (17, 'Lautaro Martinez (Argentina)', 'insert'),
  (18, 'Jamie Leweling (Germany)', 'insert'),
  (19, 'Nicolo Barella (Italy)', 'insert'),
  (20, 'Cristiano Ronaldo (Portugal)', 'insert'),
  (21, 'Gabriel (Brazil)', 'insert'),
  (22, 'Daniel Munoz (Colombia)', 'insert'),
  (23, 'Mikel Merino (Spain)', 'insert'),
  (24, 'Nico Schlotterbeck (Germany)', 'insert'),
  (25, 'Levi Colwill (England)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
