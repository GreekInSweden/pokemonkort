-- Seed data for Topps Premier League 2025/26 > Full Force, 20 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'full-force-25-26', 'Full Force', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Jurriën Timber (Arsenal)', 'insert'),
  (2, 'John McGinn (Aston Villa)', 'insert'),
  (3, 'Illia Zabarnyi (AFC Bournemouth)', 'insert'),
  (4, 'Gustavo Nunes (Brentford)', 'insert'),
  (5, 'Carlos Baleba (Brighton & Hove Albion)', 'insert'),
  (6, 'Marc Cucurella (Chelsea)', 'insert'),
  (7, 'Tyrick Mitchell (Crystal Palace)', 'insert'),
  (8, 'Vitalii Mykolenko (Everton)', 'insert'),
  (9, 'Calvin Bassey (Fulham)', 'insert'),
  (10, 'Darwin Núñez (Liverpool)', 'insert'),
  (11, 'Joško Gvardiol (Manchester City)', 'insert'),
  (12, 'Manuel Ugarte (Manchester United)', 'insert'),
  (13, 'Joelinton (Newcastle United)', 'insert'),
  (14, 'Ola Aina (Nottingham Forest)', 'insert'),
  (15, 'Mikey Moore (Tottenham Hotspur)', 'insert'),
  (16, 'Aaron Wan-Bissaka (West Ham United)', 'insert'),
  (17, 'Nasser Djiga (Wolverhampton Wanderers)', 'insert'),
  (18, 'Josh Cullen (Burnley)', 'insert'),
  (19, 'Pascal Struijk (Leeds United)', 'insert'),
  (20, 'Wilson Isidor (Sunderland)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
