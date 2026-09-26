-- Seed data for Topps UEFA Club Competitions 2025/26 > Ultimate Stage Chrome, 45 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..45) i den ordning insertet listas i
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'ultimate-stage-chrome-ucc-25-26', 'Ultimate Stage Chrome', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Virgil van Dijk (Liverpool)', 'insert'),
  (2, 'Mohamed Salah (Liverpool)', 'insert'),
  (3, 'Rio Ngumoha (Liverpool)', 'insert'),
  (4, 'Fernando Torres (Liverpool)', 'insert'),
  (5, 'Declan Rice (Arsenal)', 'insert'),
  (6, 'Martin Ødegaard (Arsenal)', 'insert'),
  (7, 'Ethan Nwaneri (Arsenal)', 'insert'),
  (8, 'Sandro Tonali (Newcastle United)', 'insert'),
  (9, 'Serhou Guirassy (Borussia Dortmund)', 'insert'),
  (10, 'Erling Haaland (Manchester City)', 'insert'),
  (11, 'Omar Marmoush (Manchester City)', 'insert'),
  (12, 'Divine Mukasa (Manchester City)', 'insert'),
  (13, 'Cole Palmer (Chelsea)', 'insert'),
  (14, 'Estêvão Willian (Chelsea)', 'insert'),
  (15, 'Dro (FC Barcelona)', 'insert'),
  (16, 'Liam Delap (Chelsea)', 'insert'),
  (17, 'Brennan Johnson (Tottenham Hotspur)', 'insert'),
  (18, 'Lucas Bergvall (Tottenham Hotspur)', 'insert'),
  (19, 'Gareth Bale (Tottenham Hotspur)', 'insert'),
  (20, 'Lamine Yamal (FC Barcelona)', 'insert'),
  (21, 'Franco Mastantuono (Real Madrid CF)', 'insert'),
  (22, 'Quim Junyent (FC Barcelona)', 'insert'),
  (23, 'Ronaldinho (FC Barcelona)', 'insert'),
  (24, 'Zinédine Zidane (Real Madrid CF)', 'insert'),
  (25, 'Kylian Mbappé (Real Madrid CF)', 'insert'),
  (26, 'Jude Bellingham (Real Madrid CF)', 'insert'),
  (27, 'Federico Valverde (Real Madrid CF)', 'insert'),
  (28, 'Antoine Griezmann (Atlético de Madrid)', 'insert'),
  (29, 'Julián Álvarez (Atlético de Madrid)', 'insert'),
  (30, 'Dan Burn (Newcastle United)', 'insert'),
  (31, 'Jamal Musiala (FC Bayern München)', 'insert'),
  (32, 'Alphonso Davies (FC Bayern München)', 'insert'),
  (33, 'Lennart Karl (FC Bayern München)', 'insert'),
  (34, 'Philipp Lahm (FC Bayern München)', 'insert'),
  (35, 'Karim Adeyemi (Borussia Dortmund)', 'insert'),
  (36, 'Lautaro Martínez (FC Internazionale Milano)', 'insert'),
  (37, 'Federico Dimarco (FC Internazionale Milano)', 'insert'),
  (38, 'Javier Zanetti (FC Internazionale Milano)', 'insert'),
  (39, 'Scott McTominay (SSC Napoli)', 'insert'),
  (40, 'Matteo Politano (SSC Napoli)', 'insert'),
  (41, 'Kenan Yıldız (Juventus)', 'insert'),
  (42, 'Weston McKennie (Juventus)', 'insert'),
  (43, 'Pavel Nedvěd (Juventus)', 'insert'),
  (44, 'Khvicha Kvaratskhelia (Paris Saint-Germain)', 'insert'),
  (45, 'Ousmane Dembélé (Paris Saint-Germain)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 25, 0
from inserted_cards ic;
