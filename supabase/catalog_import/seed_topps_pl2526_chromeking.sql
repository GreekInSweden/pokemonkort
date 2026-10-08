-- Seed data for Topps Premier League 2025/26 > Chrome King, 20 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'chrome-king-25-26', 'Chrome King', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Cesc Fàbregas (Arsenal)', 'insert'),
  (2, 'Dwight Yorke (Aston Villa)', 'insert'),
  (3, 'Adam Smith (AFC Bournemouth)', 'insert'),
  (4, 'Christian Nørgaard (Brentford)', 'insert'),
  (5, 'Lewis Dunk (Brighton & Hove Albion)', 'insert'),
  (6, 'Gianfranco Zola (Chelsea)', 'insert'),
  (7, 'Didier Drogba (Chelsea)', 'insert'),
  (8, 'Nathaniel Clyne (Crystal Palace)', 'insert'),
  (9, 'Séamus Coleman (Everton)', 'insert'),
  (10, 'Clint Dempsey (Fulham)', 'insert'),
  (11, 'Xabi Alonso (Liverpool)', 'insert'),
  (12, 'Steven Gerrard (Liverpool)', 'insert'),
  (13, 'David Silva (Manchester City)', 'insert'),
  (14, 'Sergio Agüero (Manchester City)', 'insert'),
  (15, 'Nemanja Vidić (Manchester United)', 'insert'),
  (16, 'Andy Cole (Newcastle United)', 'insert'),
  (17, 'Roy Keane (Nottingham Forest)', 'insert'),
  (18, 'Gareth Bale (Tottenham Hotspur)', 'insert'),
  (19, 'Bobby Zamora (West Ham United)', 'insert'),
  (20, 'Paul Ince (Wolverhampton Wanderers)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 30, 0
from inserted_cards ic;
