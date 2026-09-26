-- Seed data for Topps UEFA Club Competitions 2025/26 > Born Champ, 15 cards.
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'born-champ-ucc-25-26', 'Born Champ', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Bukayo Saka (Arsenal)', 'insert'),
  (2, 'Divine Mukasa (Manchester City)', 'insert'),
  (3, 'Joao Pedro (Chelsea)', 'insert'),
  (4, 'Pedri (FC Barcelona)', 'insert'),
  (5, 'Trent Alexander-Arnold (Real Madrid CF)', 'insert'),
  (6, 'Harry Kane (FC Bayern München)', 'insert'),
  (7, 'Lautaro Martínez (FC Internazionale Milano)', 'insert'),
  (8, 'Romelu Lukaku (SSC Napoli)', 'insert'),
  (9, 'Désiré Doué (Paris Saint-Germain)', 'insert'),
  (10, 'Samu Aghehowa (FC Porto)', 'insert'),
  (11, 'Dušan Vlahović (Juventus)', 'insert'),
  (12, 'Takumi Minamino (AS Monaco)', 'insert'),
  (13, 'Richard Rios (SL Benfica)', 'insert'),
  (14, 'Reo Hatate (Celtic FC)', 'insert'),
  (15, 'James Tavernier (Rangers FC)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
