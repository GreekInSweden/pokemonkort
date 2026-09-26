-- Seed data for Topps UEFA Club Competitions 2025/26 > Regency Chrome, 25 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..25) i den ordning insertet listas i
-- källan -- inte nödvändigtvis samma nummer som står tryckt på kortets
-- baksida.
--
-- Avsiktligt UTESLUTNA insert-/subsets från samma checklista eftersom de
-- inte är vanliga, återkommande kort med fast upplaga: "Hype" (bara 1
-- kort), "The Grail" (bara 1 kort), "Jigsaw" (samma 5 spelare styckade i
-- 9 pusselbitar var, inte fristående kort) och "UCL Sketch Cards"
-- (unika handritade 1/1-kort, inget fast checklistenummer).
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'regency-chrome-ucc-25-26', 'Regency Chrome', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Mohamed Salah (Liverpool)', 'insert'),
  (2, 'Bukayo Saka (Arsenal)', 'insert'),
  (3, 'Sandro Tonali (Newcastle United)', 'insert'),
  (4, 'Erling Haaland (Manchester City)', 'insert'),
  (5, 'Cole Palmer (Chelsea)', 'insert'),
  (6, 'Estêvão Willian (Chelsea)', 'insert'),
  (7, 'Morgan Rogers (Aston Villa)', 'insert'),
  (8, 'Omar Marmoush (Manchester City)', 'insert'),
  (9, 'Lamine Yamal (FC Barcelona)', 'insert'),
  (10, 'Florian Wirtz (Liverpool)', 'insert'),
  (11, 'Kylian Mbappé (Real Madrid CF)', 'insert'),
  (12, 'Jude Bellingham (Real Madrid CF)', 'insert'),
  (13, 'Antoine Griezmann (Atlético de Madrid)', 'insert'),
  (14, 'Harry Kane (FC Bayern München)', 'insert'),
  (15, 'Lennart Karl (FC Bayern München)', 'insert'),
  (16, 'Lautaro Martínez (FC Internazionale Milano)', 'insert'),
  (17, 'Scott McTominay (SSC Napoli)', 'insert'),
  (18, 'Kenan Yıldız (Juventus)', 'insert'),
  (19, 'Rodrigo Mora (FC Porto)', 'insert'),
  (20, 'Désiré Doué (Paris Saint-Germain)', 'insert'),
  (21, 'Geovany Quenda (Sporting Clube de Portugal)', 'insert'),
  (22, 'Daizen Maeda (Celtic FC)', 'insert'),
  (23, 'James Tavernier (Rangers FC)', 'insert'),
  (24, 'Ethan Nwaneri (Arsenal)', 'insert'),
  (25, 'Khvicha Kvaratskhelia (Paris Saint-Germain)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 25, 0
from inserted_cards ic;
