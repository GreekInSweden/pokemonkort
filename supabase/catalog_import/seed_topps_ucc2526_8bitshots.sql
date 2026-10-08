-- Seed data for Topps UEFA Club Competitions 2025/26 > 8Bit Shots, 20 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..20) i den ordning insertet listas i
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', '8bit-shots-ucc-25-26', '8Bit Shots', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'David Alaba (Real Madrid CF)', 'insert'),
  (2, 'Gareth Bale (Real Madrid CF)', 'insert'),
  (3, 'Jude Bellingham (Real Madrid CF)', 'insert'),
  (4, 'Steven Gerrard (Liverpool)', 'insert'),
  (5, 'Erling Haaland (Borussia Dortmund)', 'insert'),
  (6, 'Neymar Jr (Paris Saint-Germain)', 'insert'),
  (7, 'Antonio Rüdiger (Real Madrid CF)', 'insert'),
  (8, 'Zinédine Zidane (Real Madrid CF)', 'insert'),
  (9, 'Lautaro Martínez (FC Internazionale Milano)', 'insert'),
  (10, 'Vaunted Trio (Arsenal)', 'insert'),
  (11, 'Didier Drogba (Chelsea)', 'insert'),
  (12, 'Lars Ricken (Borussia Dortmund)', 'insert'),
  (13, 'Robert Lewandowski (FC Barcelona)', 'insert'),
  (14, 'José Mourinho (FC Porto)', 'insert'),
  (15, 'Oliver Kahn (FC Bayern München)', 'insert'),
  (16, 'Ronaldinho (FC Barcelona)', 'insert'),
  (17, 'Lamine Yamal (FC Barcelona)', 'insert'),
  (18, 'Bukayo Saka (Arsenal)', 'insert'),
  (19, 'Mohamed Salah (Liverpool)', 'insert'),
  (20, 'Robert Lewandowski (FC Bayern München)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
