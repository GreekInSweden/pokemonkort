-- Seed data for Topps Premier League 2025/26 > Pro Precision, 20 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'pro-precision-25-26', 'Pro Precision', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Kai Havertz (Arsenal)', 'insert'),
  (2, 'Ollie Watkins (Arsenal)', 'insert'),
  (3, 'Dango Ouattara (AFC Bournemouth)', 'insert'),
  (4, 'Mikkel Damsgaard (Brentford)', 'insert'),
  (5, 'Danny Welbeck (Brighton & Hove Albion)', 'insert'),
  (6, 'Nicolas Jackson (Chelsea)', 'insert'),
  (7, 'Eddie Nketiah (Crystal Palace)', 'insert'),
  (8, 'Beto (Everton)', 'insert'),
  (9, 'Robbie Fowler (Liverpool)', 'insert'),
  (10, 'Diogo Jota (Liverpool)', 'insert'),
  (11, 'Phil Foden (Manchester City)', 'insert'),
  (12, 'Bruno Fernandes (Manchester United)', 'insert'),
  (13, 'Wayne Rooney (Manchester United)', 'insert'),
  (14, 'Anthony Gordon (Newcastle United)', 'insert'),
  (15, 'Taiwo Awoniyi (Nottingham Forest)', 'insert'),
  (16, 'Brennan Johnson (Tottenham Hotspur)', 'insert'),
  (17, 'Mohammed Kudus (West Ham United)', 'insert'),
  (18, 'Jørgen Strand Larsen (Wolverhampton Wanderers)', 'insert'),
  (19, 'Josh Brownhill (Burnley)', 'insert'),
  (20, 'Patrick Bamford (Leeds United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
