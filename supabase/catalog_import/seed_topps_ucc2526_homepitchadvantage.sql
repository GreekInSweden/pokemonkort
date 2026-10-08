-- Seed data for Topps UEFA Club Competitions 2025/26 > Home Pitch Advantage, 30 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..30) i den ordning insertet listas i
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'home-pitch-advantage-ucc-25-26', 'Home Pitch Advantage', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Quim Junyent (FC Barcelona)', 'insert'),
  (2, 'Raphinha (FC Barcelona)', 'insert'),
  (3, 'Ronaldinho (FC Barcelona)', 'insert'),
  (4, 'Vini Jr. (Real Madrid CF)', 'insert'),
  (5, 'Kylian Mbappé (Real Madrid CF)', 'insert'),
  (6, 'Zinédine Zidane (Real Madrid CF)', 'insert'),
  (7, 'Antoine Griezmann (Atlético de Madrid)', 'insert'),
  (8, 'Mohamed Salah (Liverpool)', 'insert'),
  (9, 'Rio Ngumoha (Liverpool)', 'insert'),
  (10, 'Bukayo Saka (Arsenal)', 'insert'),
  (11, 'Thierry Henry (Arsenal)', 'insert'),
  (12, 'Cole Palmer (Chelsea)', 'insert'),
  (13, 'Désiré Doué (Paris Saint-Germain)', 'insert'),
  (14, 'Phil Foden (Manchester City)', 'insert'),
  (15, 'Reigan Heskey (Manchester City)', 'insert'),
  (16, 'Harry Kane (FC Bayern München)', 'insert'),
  (17, 'Philipp Lahm (FC Bayern München)', 'insert'),
  (18, 'Michael Ballack (Bayer 04 Leverkusen)', 'insert'),
  (19, 'Ousmane Dembélé (Paris Saint-Germain)', 'insert'),
  (20, 'Bruno Guimaraes (Newcastle United)', 'insert'),
  (21, 'Karim Adeyemi (Borussia Dortmund)', 'insert'),
  (22, 'Nicolò Barella (FC Internazionale Milano)', 'insert'),
  (23, 'Francesco Pio Esposito (FC Internazionale Milano)', 'insert'),
  (24, 'Scott McTominay (SSC Napoli)', 'insert'),
  (25, 'Kenan Yıldız (Juventus)', 'insert'),
  (26, 'Alessandro Del Piero (Juventus)', 'insert'),
  (27, 'Daizen Maeda (Celtic FC)', 'insert'),
  (28, 'Don-Angelo Konadu (AFC Ajax)', 'insert'),
  (29, 'Dominic Solanke (Tottenham Hotspur)', 'insert'),
  (30, 'Jobe Bellingham (Borussia Dortmund)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 20, 0
from inserted_cards ic;
