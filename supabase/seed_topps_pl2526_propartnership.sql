-- Seed data for Topps Premier League 2025/26 > Pro Partnership, 20 cards.
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'pro-partnership-25-26', 'Pro Partnership', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'William Saliba & Gabriel Magalhães (Arsenal)', 'insert'),
  (2, 'Amadou Onana & Youri Tielemans (Aston Villa)', 'insert'),
  (3, 'Antoine Semenyo & Dango Ouattara (AFC Bournemouth)', 'insert'),
  (4, 'Nathan Collins & Sepp van den Berg (Brentford)', 'insert'),
  (5, 'Kaoru Mitoma & Simon Adingra (Brighton & Hove Albion)', 'insert'),
  (6, 'Ricardo Carvalho & John Terry (Chelsea)', 'insert'),
  (7, 'Moisés Caicedo & Enzo Fernández (Chelsea)', 'insert'),
  (8, 'Daichi Kamada & Adam Wharton (Crystal Palace)', 'insert'),
  (9, 'James Tarkowski & Jarrad Branthwaite (Everton)', 'insert'),
  (10, 'Enzo Le Fée & Patrick Roberts (Sunderland)', 'insert'),
  (11, 'Ryan Gravenberch & Alexis Mac Allister (Liverpool)', 'insert'),
  (12, 'Phil Foden & Bernardo Silva (Manchester City)', 'insert'),
  (13, 'Bruno Fernandes & Rasmus Højlund (Manchester United)', 'insert'),
  (14, 'Bruno Guimarães & Joelinton (Newcastle United)', 'insert'),
  (15, 'Ola Aina & Callum Hudson-Odoi (Nottingham Forest)', 'insert'),
  (16, 'Brennan Johnson & Dejan Kulusevski (Tottenham Hotspur)', 'insert'),
  (17, 'Darren Anderton & Teddy Sheringham (Tottenham Hotspur)', 'insert'),
  (18, 'Gonçalo Guedes & Jørgen Strand Larsen (Wolverhampton Wanderers)', 'insert'),
  (19, 'Maxime Estève & Lucas Pires (Burnley)', 'insert'),
  (20, 'Joe Rodon & Ethan Ampadu (Leeds United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 20, 0
from inserted_cards ic;
