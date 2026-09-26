-- Seed data for Topps Premier League 2025/26 > Perfect Storm, 20 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'perfect-storm-25-26', 'Perfect Storm', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Martin Ødegaard (Arsenal)', 'insert'),
  (2, 'Morgan Rogers (Aston Villa)', 'insert'),
  (3, 'Tyler Adams (AFC Bournemouth)', 'insert'),
  (4, 'Bryan Mbeumo (Brentford)', 'insert'),
  (5, 'João Pedro (Brighton & Hove Albion)', 'insert'),
  (6, 'Estêvão (Chelsea)', 'insert'),
  (7, 'Eberechi Eze (Crystal Palace)', 'insert'),
  (8, 'Dwight McNeil (Everton)', 'insert'),
  (9, 'Darwin Núñez (Liverpool)', 'insert'),
  (10, 'Mohamed Salah (Liverpool)', 'insert'),
  (11, 'Luis Suárez (Liverpool)', 'insert'),
  (12, 'Erling Haaland (Manchester City)', 'insert'),
  (13, 'Amad (Manchester United)', 'insert'),
  (14, 'Alexander Isak (Newcastle United)', 'insert'),
  (15, 'Anthony Elanga (Nottingham Forest)', 'insert'),
  (16, 'Dominic Solanke (Tottenham Hotspur)', 'insert'),
  (17, 'Mohammed Kudus (West Ham United)', 'insert'),
  (18, 'João Gomes (Wolverhampton Wanderers)', 'insert'),
  (19, 'Luca Koleosho (Burnley)', 'insert'),
  (20, 'Brenden Aaronson (Leeds United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 25, 0
from inserted_cards ic;
