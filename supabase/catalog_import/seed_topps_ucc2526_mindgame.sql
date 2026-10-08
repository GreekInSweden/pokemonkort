-- Seed data for Topps UEFA Club Competitions 2025/26 > Mindgame, 15 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..15) i den ordning insertet listas i
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'mindgame-ucc-25-26', 'Mindgame', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Pedri (FC Barcelona)', 'insert'),
  (2, 'Franco Mastantuono (Real Madrid CF)', 'insert'),
  (3, 'Julián Álvarez (Atlético de Madrid)', 'insert'),
  (4, 'Virgil van Dijk (Liverpool)', 'insert'),
  (5, 'Martin Ødegaard (Arsenal)', 'insert'),
  (6, 'Estêvão Willian (Chelsea)', 'insert'),
  (7, 'Michael Olise (FC Bayern München)', 'insert'),
  (8, 'Jude Bellingham (Real Madrid CF)', 'insert'),
  (9, 'Désiré Doué (Paris Saint-Germain)', 'insert'),
  (10, 'Bruno Guimaraes (Newcastle United)', 'insert'),
  (11, 'Jamal Musiala (FC Bayern München)', 'insert'),
  (12, 'Lautaro Martínez (FC Internazionale Milano)', 'insert'),
  (13, 'Florian Wirtz (Liverpool)', 'insert'),
  (14, 'Weston McKennie (Juventus)', 'insert'),
  (15, 'Ousmane Diallo (Borussia Dortmund)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
