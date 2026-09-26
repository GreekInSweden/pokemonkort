-- Seed data for Topps Premier League 2025/26 > Home Pitch Advantage, 21 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..21) i den ordning insertet listas i
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'home-pitch-advantage-25-26', 'Home Pitch Advantage', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Hwang Hee-Chan (Wolverhampton Wanderers)', 'insert'),
  (2, 'Martin Ødegaard (Arsenal)', 'insert'),
  (3, 'Morgan Rogers (Aston Villa)', 'insert'),
  (4, 'Antoine Semenyo (AFC Bournemouth)', 'insert'),
  (5, 'Bryan Mbeumo (Brentford)', 'insert'),
  (6, 'João Pedro (Brighton & Hove Albion)', 'insert'),
  (7, 'Estêvão (Chelsea)', 'insert'),
  (8, 'Didier Drogba (Chelsea)', 'insert'),
  (9, 'Eberechi Eze (Crystal Palace)', 'insert'),
  (10, 'Beto (Everton)', 'insert'),
  (11, 'Steven Gerrard (Liverpool)', 'insert'),
  (12, 'Rio Ngumoha (Liverpool)', 'insert'),
  (13, 'Yaya Touré (Manchester City)', 'insert'),
  (14, 'Erling Haaland (Manchester City)', 'insert'),
  (15, 'Bruno Fernandes (Manchester United)', 'insert'),
  (16, 'Zlatan Ibrahimović (Manchester United)', 'insert'),
  (17, 'Anthony Gordon (Newcastle United)', 'insert'),
  (18, 'Morgan Gibbs-White (Nottingham Forest)', 'insert'),
  (19, 'Son Heung-Min (Tottenham Hotspur)', 'insert'),
  (20, 'Gareth Bale (Tottenham Hotspur)', 'insert'),
  (21, 'Jarrod Bowen (West Ham United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 25, 0
from inserted_cards ic;
