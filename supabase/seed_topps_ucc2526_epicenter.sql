-- Seed data for Topps UEFA Club Competitions 2025/26 > Epicenter, 25 cards.
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'epicenter-ucc-25-26', 'Epicenter', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Ryan Gravenberch (Liverpool)', 'insert'),
  (2, 'Martin Ødegaard (Arsenal)', 'insert'),
  (3, 'Ethan Nwaneri (Arsenal)', 'insert'),
  (4, 'Joelinton (Newcastle United)', 'insert'),
  (5, 'Erling Haaland (Manchester City)', 'insert'),
  (6, 'Cole Palmer (Chelsea)', 'insert'),
  (7, 'Lamine Yamal (FC Barcelona)', 'insert'),
  (8, 'Guille Fernández (FC Barcelona)', 'insert'),
  (9, 'Vini Jr. (Real Madrid CF)', 'insert'),
  (10, 'Joshua Kimmich (FC Bayern München)', 'insert'),
  (11, 'Lennart Karl (FC Bayern München)', 'insert'),
  (12, 'Karim Adeyemi (Borussia Dortmund)', 'insert'),
  (13, 'Ibrahim Maza (Bayer 04 Leverkusen)', 'insert'),
  (14, 'Nicolò Barella (FC Internazionale Milano)', 'insert'),
  (15, 'Romelu Lukaku (SSC Napoli)', 'insert'),
  (16, 'Dušan Vlahović (Juventus)', 'insert'),
  (17, 'Vitinha (Paris Saint-Germain)', 'insert'),
  (18, 'Kenneth Taylor (AFC Ajax)', 'insert'),
  (19, 'Kevin De Bruyne (SSC Napoli)', 'insert'),
  (20, 'Jota (Celtic FC)', 'insert'),
  (21, 'Alessandro Bastoni (FC Internazionale Milano)', 'insert'),
  (22, 'Konstantinos Karetsas (KRC Genk)', 'insert'),
  (23, 'Kang-in Lee (Paris Saint-Germain)', 'insert'),
  (24, 'Omar Marmoush (Manchester City)', 'insert'),
  (25, 'Divine Mukasa (Manchester City)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
