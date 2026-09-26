-- Seed data for Topps Premier League 2025/26 > Festive Freeze, 24 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..24) i den ordning insertet listas i
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'festive-freeze-25-26', 'Festive Freeze', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Jordan Pickford (Everton)', 'insert'),
  (2, 'Tariq Lamptey (Brighton & Hove Albion)', 'insert'),
  (3, 'Leighton Baines (Everton)', 'insert'),
  (4, 'Virgil van Dijk (Liverpool)', 'insert'),
  (5, 'Maxime Estève (Burnley)', 'insert'),
  (6, 'Marc Guéhi (Crystal Palace)', 'insert'),
  (7, 'Bukayo Saka (Arsenal)', 'insert'),
  (8, 'Steven Gerrard (Liverpool)', 'insert'),
  (9, 'Erling Haaland (Manchester City)', 'insert'),
  (10, 'Sergio Agüero (Manchester City)', 'insert'),
  (11, 'Yoane Wissa (Brentford)', 'insert'),
  (12, 'Tyler Adams (AFC Bournemouth)', 'insert'),
  (13, 'Michael Ballack (Chelsea)', 'insert'),
  (14, 'Alexander Isak (Newcastle United)', 'insert'),
  (15, 'Nemanja Vidić (Manchester United)', 'insert'),
  (16, 'Amad (Manchester United)', 'insert'),
  (17, 'Yankuba Minteh (Brighton & Hove Albion)', 'insert'),
  (18, 'Emile Heskey (Liverpool)', 'insert'),
  (19, 'Dominic Solanke (Tottenham Hotspur)', 'insert'),
  (20, 'Jarrod Bowen (West Ham United)', 'insert'),
  (21, 'Anthony Elanga (Nottingham Forest)', 'insert'),
  (22, 'Nélson Semedo (Wolverhampton Wanderers)', 'insert'),
  (23, 'Emiliano Martínez (Aston Villa)', 'insert'),
  (24, 'Reece James (Chelsea)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 25, 0
from inserted_cards ic;
