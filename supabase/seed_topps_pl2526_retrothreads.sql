-- Seed data for Topps Premier League 2025/26 > Retro Threads, 20 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'retro-threads-25-26', 'Retro Threads', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Ian Wright (Arsenal)', 'insert'),
  (2, 'Stiliyan Petrov (Arsenal)', 'insert'),
  (3, 'Simon Francis (AFC Bournemouth)', 'insert'),
  (4, 'Eric Cantona (Manchester City)', 'insert'),
  (5, 'Christian Nørgaard (Brentford)', 'insert'),
  (6, 'Glenn Murray (Brighton & Hove Albion)', 'insert'),
  (7, 'Frank Lampard (Chelsea)', 'insert'),
  (8, 'Andrew Johnson (Crystal Palace)', 'insert'),
  (9, 'Joleon Lescott (Everton)', 'insert'),
  (10, 'Louis Saha (Fulham)', 'insert'),
  (11, 'Jamie Carragher (Liverpool)', 'insert'),
  (12, 'Micah Richards (Manchester City)', 'insert'),
  (13, 'Gary Neville (Manchester United)', 'insert'),
  (14, 'Faustino Asprilla (Newcastle United)', 'insert'),
  (15, 'Stan Collymore (Nottingham Forest)', 'insert'),
  (16, 'Robbie Keane (Tottenham Hotspur)', 'insert'),
  (17, 'Mark Noble (West Ham United)', 'insert'),
  (18, 'Kevin Doyle (Wolverhampton Wanderers)', 'insert'),
  (19, 'Aaron Lennon (Burnley)', 'insert'),
  (20, 'Jimmy Floyd Hasselbaink (Leeds United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 20, 0
from inserted_cards ic;
