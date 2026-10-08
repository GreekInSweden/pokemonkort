-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Magicians, 25 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'magicians-donruss-rtwc26', 'Magicians', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Moise Kean (Italy)', 'insert'),
  (2, 'Marcus Thuram (France)', 'insert'),
  (3, 'Bernardo Silva (Portugal)', 'insert'),
  (4, 'Rodrygo (Brazil)', 'insert'),
  (5, 'Luka Modric (Croatia)', 'insert'),
  (6, 'Antonio Nusa (Norway)', 'insert'),
  (7, 'Alexis Mac Allister (Argentina)', 'insert'),
  (8, 'Marc Cucurella (Spain)', 'insert'),
  (9, 'Folarin Balogun (United States)', 'insert'),
  (10, 'Trent Alexander-Arnold (England)', 'insert'),
  (11, 'Riccardo Calafiori (Italy)', 'insert'),
  (12, 'Dan Ndoye (Switzerland)', 'insert'),
  (13, 'Endrick (Brazil)', 'insert'),
  (14, 'Victor Osimhen (Nigeria)', 'insert'),
  (15, 'Pascal Gross (Germany)', 'insert'),
  (16, 'Scott McTominay (Scotland)', 'insert'),
  (17, 'Heung-Min Son (Korea Republic)', 'insert'),
  (18, 'Pedro Neto (Portugal)', 'insert'),
  (19, 'Antoine Semenyo (Ghana)', 'insert'),
  (20, 'Maximiliano Araujo (Uruguay)', 'insert'),
  (21, 'Robin Koch (Germany)', 'insert'),
  (22, 'Robert Lewandowski (Poland)', 'insert'),
  (23, 'Eberechi Eze (England)', 'insert'),
  (24, 'Pedri (Spain)', 'insert'),
  (25, 'Nico Paz (Argentina)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
