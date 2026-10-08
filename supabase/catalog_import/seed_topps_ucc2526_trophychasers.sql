-- Seed data for Topps UEFA Club Competitions 2025/26 > Trophy Chasers, 35 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..35) i den ordning insertet listas i
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'trophy-chasers-ucc-25-26', 'Trophy Chasers', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Cody Gakpo (Liverpool)', 'insert'),
  (2, 'Kai Havertz (Arsenal)', 'insert'),
  (3, 'Dan Burn (Newcastle United)', 'insert'),
  (4, 'Joško Gvardiol (Manchester City)', 'insert'),
  (5, 'Andrey Santos (Chelsea)', 'insert'),
  (6, 'Youri Tielemans (Aston Villa)', 'insert'),
  (7, 'James Maddison (Tottenham Hotspur)', 'insert'),
  (8, 'Chris Wood (Nottingham Forest)', 'insert'),
  (9, 'Raphinha (FC Barcelona)', 'insert'),
  (10, 'Endrick (Real Madrid CF)', 'insert'),
  (11, 'Conor Gallagher (Atlético de Madrid)', 'insert'),
  (12, 'Cucho (Real Betis Balompié)', 'insert'),
  (13, 'Alphonso Davies (FC Bayern München)', 'insert'),
  (14, 'Nico Schlotterbeck (Borussia Dortmund)', 'insert'),
  (15, 'Patrik Schick (Bayer 04 Leverkusen)', 'insert'),
  (16, 'Hugo Larsson (Eintracht Frankfurt)', 'insert'),
  (17, 'Federico Dimarco (FC Internazionale Milano)', 'insert'),
  (18, 'Giovanni Di Lorenzo (SSC Napoli)', 'insert'),
  (19, 'Weston McKennie (Juventus)', 'insert'),
  (20, 'Shumaira Mheuka (Chelsea)', 'insert'),
  (21, 'Emanuel Emegha (RC Strasbourg Alsace)', 'insert'),
  (22, 'Ousmane Diomande (Sporting Clube de Portugal)', 'insert'),
  (23, 'Andreas Schjelderup (SL Benfica)', 'insert'),
  (24, 'Alistair Johnston (Celtic FC)', 'insert'),
  (25, 'Andy Robertson (Liverpool)', 'insert'),
  (26, 'Myles Lewis-Skelly (Arsenal)', 'insert'),
  (27, 'Rodrigo Mora (FC Porto)', 'insert'),
  (28, 'Reigan Heskey (Manchester City)', 'insert'),
  (29, 'Quim Junyent (FC Barcelona)', 'insert'),
  (30, 'Vini Jr. (Real Madrid CF)', 'insert'),
  (31, 'Luis Díaz (FC Bayern München)', 'insert'),
  (32, 'Ange-Yoan Bonny (FC Internazionale Milano)', 'insert'),
  (33, 'Vitinha (Paris Saint-Germain)', 'insert'),
  (34, 'Kenneth Taylor (AFC Ajax)', 'insert'),
  (35, 'Pablo Garcia (Real Betis Balompié)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 15, 0
from inserted_cards ic;
