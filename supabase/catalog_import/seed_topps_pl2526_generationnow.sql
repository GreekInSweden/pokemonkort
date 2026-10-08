-- Seed data for Topps Premier League 2025/26 > Generation Now, 20 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'generation-now-25-26', 'Generation Now', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Gabriel Martinelli (Arsenal)', 'insert'),
  (2, 'Boubacar Kamara (Aston Villa)', 'insert'),
  (3, 'Milos Kerkez (AFC Bournemouth)', 'insert'),
  (4, 'Fábio Carvalho (Brentford)', 'insert'),
  (5, 'Matt O''Riley (Brighton & Hove Albion)', 'insert'),
  (6, 'Levi Colwill (Chelsea)', 'insert'),
  (7, 'Marc Guéhi (Crystal Palace)', 'insert'),
  (8, 'Iliman Ndiaye (Everton)', 'insert'),
  (9, 'Rodrigo Muniz (Fulham)', 'insert'),
  (10, 'Dominik Szoboszlai (Liverpool)', 'insert'),
  (11, 'Jérémy Doku (Manchester City)', 'insert'),
  (12, 'Kobbie Mainoo (Manchester United)', 'insert'),
  (13, 'Tino Livramento (Newcastle United)', 'insert'),
  (14, 'Murillo (Nottingham Forest)', 'insert'),
  (15, 'Lucas Bergvall (Tottenham Hotspur)', 'insert'),
  (16, 'Crysencio Summerville (West Ham United)', 'insert'),
  (17, 'João Gomes (Wolverhampton Wanderers)', 'insert'),
  (18, 'Lucas Pires (Burnley)', 'insert'),
  (19, 'Mateo Joseph (Leeds United)', 'insert'),
  (20, 'Jobe Bellingham (Sunderland)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
