-- Seed data for Topps Premier League 2025/26 > Beast Mode, 20 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'beast-mode-25-26', 'Beast Mode', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Declan Rice (Arsenal)', 'insert'),
  (2, 'Morgan Rogers (Arsenal)', 'insert'),
  (3, 'Evanilson (AFC Bournemouth)', 'insert'),
  (4, 'Yoane Wissa (Brentford)', 'insert'),
  (5, 'Georginio Rutter (Brighton & Hove Albion)', 'insert'),
  (6, 'Enzo Fernández (Chelsea)', 'insert'),
  (7, 'Jean-Philippe Mateta (Crystal Palace)', 'insert'),
  (8, 'Beto (Everton)', 'insert'),
  (9, 'Ibrahima Konaté (Liverpool)', 'insert'),
  (10, 'Virgil van Dijk (Liverpool)', 'insert'),
  (11, 'Rodri (Manchester City)', 'insert'),
  (12, 'Alejandro Garnacho (Manchester United)', 'insert'),
  (13, 'Sandro Tonali (Newcastle United)', 'insert'),
  (14, 'Chris Wood (Nottingham Forest)', 'insert'),
  (15, 'Ledley King (Tottenham Hotspur)', 'insert'),
  (16, 'Dominic Solanke (Tottenham Hotspur)', 'insert'),
  (17, 'Emerson Palmieri (West Ham United)', 'insert'),
  (18, 'Hwang Hee-chan (Wolverhampton Wanderers)', 'insert'),
  (19, 'Hannibal (Burnley)', 'insert'),
  (20, 'Daniel James (Leeds United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
