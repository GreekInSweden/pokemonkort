-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Kaboom, 24 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg -- INTE maskinläsbart hämtat, räkna med
-- enstaka fel/missade rader. Landslag inom parentes, precis som i
-- grundsetet (seed_donruss_rtwc26_base.sql) -- se den filens header för
-- samma osäkerhetsnivå-kommentar.
--
-- Numrering: egna löpande numrering i den ordning insertet listas i källan. OBS: källan hoppar från #21 till #23 -- #22 saknas helt, inte ett fel från min sida.
--
-- Run this once in the Supabase SQL editor after schema.sql AND
-- set_visibility.sql AND topps_rarity.sql AND sets_product_line.sql AND
-- seed_donruss_rtwc26_base.sql.
-- Stock defaults to 0 -- cards stay greyed out (and the set stays hidden)
-- until you set real stock in /admin. Price defaults to a flat placeholder.
-- Only a 'normal' variant is created (no holo).

with s as (
  insert into sets (category_slug, category_name, slug, name, is_visible, product_line)
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'kaboom-donruss-rtwc26', 'Kaboom', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Lionel Messi (Argentina)', 'insert'),
  (2, 'Cristiano Ronaldo (Portugal)', 'insert'),
  (3, 'Heung-Min Son (Korea Republic)', 'insert'),
  (4, 'Jude Bellingham (England)', 'insert'),
  (5, 'Bukayo Saka (England)', 'insert'),
  (6, 'Vini Jr. (Brazil)', 'insert'),
  (7, 'Martin Odegaard (Norway)', 'insert'),
  (8, 'Luka Modric (Croatia)', 'insert'),
  (9, 'Moise Kean (Italy)', 'insert'),
  (10, 'Kai Havertz (Germany)', 'insert'),
  (11, 'Alexander Isak (Sweden)', 'insert'),
  (12, 'Lamine Yamal (Spain)', 'insert'),
  (13, 'Pedri (Spain)', 'insert'),
  (14, 'Michael Olise (France)', 'insert'),
  (15, 'Robert Lewandowski (Poland)', 'insert'),
  (16, 'Edinson Cavani (Uruguay)', 'insert'),
  (17, 'Angel Di Maria (Argentina)', 'insert'),
  (18, 'Thierry Henry (France)', 'insert'),
  (19, 'Mesut Ozil (Germany)', 'insert'),
  (20, 'Ronaldo (Brazil)', 'insert'),
  (21, 'Sergio Aguero (Argentina)', 'insert'),
  (23, 'Pele (Brazil)', 'insert'),
  (24, 'Diego Maradona (Argentina)', 'insert'),
  (25, 'Franz Beckenbauer (Germany)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
