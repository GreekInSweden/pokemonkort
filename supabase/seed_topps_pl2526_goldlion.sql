-- Seed data for Topps Premier League 2025/26 > Gold Lion, 20 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..20) i den ordning insertet listas i
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'gold-lion-25-26', 'Gold Lion', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Bukayo Saka (Arsenal)', 'insert'),
  (2, 'Ollie Watkins (Arsenal)', 'insert'),
  (3, 'Evanilson (AFC Bournemouth)', 'insert'),
  (4, 'Bryan Mbeumo (Brentford)', 'insert'),
  (5, 'Kaoru Mitoma (Brighton & Hove Albion)', 'insert'),
  (6, 'Cole Palmer (Chelsea)', 'insert'),
  (7, 'Eden Hazard (Chelsea)', 'insert'),
  (8, 'Eberechi Eze (Crystal Palace)', 'insert'),
  (9, 'Iliman Ndiaye (Everton)', 'insert'),
  (10, 'Amad (Manchester United)', 'insert'),
  (11, 'Mohamed Salah (Liverpool)', 'insert'),
  (12, 'Erling Haaland (Manchester City)', 'insert'),
  (13, 'Alejandro Garnacho (Manchester United)', 'insert'),
  (14, 'Alexander Isak (Newcastle United)', 'insert'),
  (15, 'Morgan Gibbs-White (Nottingham Forest)', 'insert'),
  (16, 'Son Heung-Min (Tottenham Hotspur)', 'insert'),
  (17, 'Jarrod Bowen (West Ham United)', 'insert'),
  (18, 'Matheus Cunha (Wolverhampton Wanderers)', 'insert'),
  (19, 'Josh Brownhill (Burnley)', 'insert'),
  (20, 'Ao Tanaka (Leeds United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 30, 0
from inserted_cards ic;
