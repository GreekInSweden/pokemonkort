-- Seed data for Topps Premier League 2025/26 > Diamond Rookie, 10 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'diamond-rookie-25-26', 'Diamond Rookie', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Julio Soler (AFC Bournemouth)', 'insert'),
  (2, 'Stefanos Tzimas (Brighton & Hove Albion)', 'insert'),
  (3, 'Kendry Páez (Chelsea)', 'insert'),
  (4, 'Estêvão (Chelsea)', 'insert'),
  (5, 'Romain Esse (Crystal Palace)', 'insert'),
  (6, 'Rio Ngumoha (Liverpool)', 'insert'),
  (7, 'Claudio Echeverri (Manchester City)', 'insert'),
  (8, 'Reigan Heskey (Manchester City)', 'insert'),
  (9, 'Sékou Koné (Manchester United)', 'insert'),
  (10, 'Shea Lacey (Manchester United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 40, 0
from inserted_cards ic;
