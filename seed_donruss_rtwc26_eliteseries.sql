-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Elite Series, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'elite-series-donruss-rtwc26', 'Elite Series', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Brennan Johnson (Cymru)', 'insert'),
  (2, 'Idrissa Gueye (Senegal)', 'insert'),
  (3, 'Christian Pulisic (United States)', 'insert'),
  (4, 'Martin Baturina (Croatia)', 'insert'),
  (5, 'Paddy McNair (Northern Ireland)', 'insert'),
  (6, 'Jose Maria Gimenez (Uruguay)', 'insert'),
  (7, 'Lazar Samardzic (Serbia)', 'insert'),
  (8, 'Aleksandar Pavlovic (Germany)', 'insert'),
  (9, 'Gianluigi Donnarumma (Italy)', 'insert'),
  (10, 'Anthony Elanga (Sweden)', 'insert'),
  (11, 'Vanderson (Brazil)', 'insert'),
  (12, 'Jae-sung Lee (Korea Republic)', 'insert'),
  (13, 'Denil Maldonado (Honduras)', 'insert'),
  (14, 'Vitinha (Portugal)', 'insert'),
  (15, 'Ezri Konsa (England)', 'insert'),
  (16, 'Che Adams (Scotland)', 'insert'),
  (17, 'Antonio Sanabria (Paraguay)', 'insert'),
  (18, 'Erling Haaland (Norway)', 'insert'),
  (19, 'Evan Ferguson (Republic of Ireland)', 'insert'),
  (20, 'Ousmane Dembele (France)', 'insert'),
  (21, 'Nicolas Otamendi (Argentina)', 'insert'),
  (22, 'Karol Swiderski (Poland)', 'insert'),
  (23, 'Zeki Amdouni (Switzerland)', 'insert'),
  (24, 'Mateo Kovacic (Croatia)', 'insert'),
  (25, 'Lamine Yamal (Spain)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
