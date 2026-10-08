-- Seed data for Topps UEFA Club Competitions 2025/26 > Roots, 20 cards.
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'roots-ucc-25-26', 'Roots', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Virgil van Dijk (Celtic FC)', 'insert'),
  (2, 'Luis Díaz (FC Porto)', 'insert'),
  (3, 'Alexander Isak (Borussia Dortmund)', 'insert'),
  (4, 'Erling Haaland (Borussia Dortmund)', 'insert'),
  (5, 'Bernardo Silva (AS Monaco)', 'insert'),
  (6, 'Heung-Min Son (Bayer 04 Leverkusen)', 'insert'),
  (7, 'Frenkie de Jong (AFC Ajax)', 'insert'),
  (8, 'Ronaldo (PSV Eindhoven)', 'insert'),
  (9, 'Jordan Henderson (Liverpool)', 'insert'),
  (10, 'Ángel Di María (SL Benfica)', 'insert'),
  (11, 'Phil Foden (Manchester City)', 'insert'),
  (12, 'Jamal Musiala (FC Bayern München)', 'insert'),
  (13, 'Harry Kane (Tottenham Hotspur)', 'insert'),
  (14, 'Steven Gerrard (Liverpool)', 'insert'),
  (15, 'Lionel Messi (FC Barcelona)', 'insert'),
  (16, 'Ronaldinho (Paris Saint-Germain)', 'insert'),
  (17, 'Marco van Basten (AFC Ajax)', 'insert'),
  (18, 'Thierry Henry (AS Monaco)', 'insert'),
  (19, 'Bastian Schweinsteiger (FC Bayern München)', 'insert'),
  (20, 'Javier Zanetti (FC Internazionale Milano)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 20, 0
from inserted_cards ic;
