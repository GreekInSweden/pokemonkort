-- Seed data for Topps Premier League 2025/26 > Breakthrough Baller, 10 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..10) i den ordning insertet listas i
-- källan -- inte nödvändigtvis samma nummer som står tryckt på kortets
-- baksida (samma konvention som seed_topps_pl_beastmode.sql m.fl. för
-- 2026/27-setet).
--
-- Run this once in the Supabase SQL editor after schema.sql AND
-- set_visibility.sql AND topps_rarity.sql AND sets_product_line.sql.
-- Stock defaults to 0 -- cards stay greyed out (and the set stays hidden)
-- until you set real stock in /admin. Price defaults to a flat placeholder
-- -- edit per card once you know actual values.
-- Only a 'normal' variant is created (no holo) since Topps football cards
-- don't use that concept.

with s as (
  insert into sets (category_slug, category_name, slug, name, is_visible, product_line)
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'breakthrough-baller-25-26', 'Breakthrough Baller', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Myles Lewis-Skelly (Arsenal)', 'insert'),
  (2, 'Josh King (Fulham)', 'insert'),
  (3, 'Patrick Dorgu (Manchester United)', 'insert'),
  (4, 'Lewis Miley (Newcastle United)', 'insert'),
  (5, 'Archie Gray (Tottenham Hotspur)', 'insert'),
  (6, 'Luis Guilherme (West Ham United)', 'insert'),
  (7, 'André (Wolverhampton Wanderers)', 'insert'),
  (8, 'Luca Koleosho (Burnley)', 'insert'),
  (9, 'Harry Gray (Leeds United)', 'insert'),
  (10, 'Chris Rigg (Sunderland)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
