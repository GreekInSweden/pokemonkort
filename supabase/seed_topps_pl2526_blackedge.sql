-- Seed data for Topps Premier League 2025/26 > Black Edge Edition, 50 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg som transkriberat Topps egen checklista --
-- INTE maskinläsbart hämtat, så räkna med enstaka fel/missade byten.
-- Egen löpande numrering (1..50) i den ordning insertet listas i
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
  values ('topps-premier-league-25-26', 'Topps Premier League 2025/26', 'black-edge-25-26', 'Black Edge Edition', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Ethan Nwaneri (Arsenal)', 'insert'),
  (2, 'Kai Havertz (Arsenal)', 'insert'),
  (3, 'Thierry Henry (Arsenal)', 'insert'),
  (4, 'Ollie Watkins (Aston Villa)', 'insert'),
  (5, 'Donyell Malen (Aston Villa)', 'insert'),
  (6, 'Dion Dublin (Aston Villa)', 'insert'),
  (7, 'Justin Kluivert (AFC Bournemouth)', 'insert'),
  (8, 'Yoane Wissa (Brentford)', 'insert'),
  (9, 'Bryan Mbeumo (Brentford)', 'insert'),
  (10, 'Matt O''Riley (Brighton & Hove Albion)', 'insert'),
  (11, 'Danny Welbeck (Brighton & Hove Albion)', 'insert'),
  (12, 'Kendry Páez (Chelsea)', 'insert'),
  (13, 'Cole Palmer (Chelsea)', 'insert'),
  (14, 'Eden Hazard (Chelsea)', 'insert'),
  (15, 'Eberechi Eze (Crystal Palace)', 'insert'),
  (16, 'Eddie Nketiah (Crystal Palace)', 'insert'),
  (17, 'Jordan Pickford (Everton)', 'insert'),
  (18, 'Dwight McNeil (Everton)', 'insert'),
  (19, 'Antonee Robinson (Fulham)', 'insert'),
  (20, 'Clint Dempsey (Fulham)', 'insert'),
  (21, 'Andreas Pereira (Fulham)', 'insert'),
  (22, 'Fernando Torres (Liverpool)', 'insert'),
  (23, 'Rio Ngumoha (Liverpool)', 'insert'),
  (24, 'Mohamed Salah (Liverpool)', 'insert'),
  (25, 'Diogo Jota (Liverpool)', 'insert'),
  (26, 'Claudio Echeverri (Manchester City)', 'insert'),
  (27, 'Carlos Tevez (Manchester City)', 'insert'),
  (28, 'Erling Haaland (Manchester City)', 'insert'),
  (29, 'Omar Marmoush (Manchester City)', 'insert'),
  (30, 'Kobbie Mainoo (Manchester United)', 'insert'),
  (31, 'Alejandro Garnacho (Manchester United)', 'insert'),
  (32, 'Ruud van Nistelrooy (Manchester United)', 'insert'),
  (33, 'Bruno Guimarães (Newcastle United)', 'insert'),
  (34, 'Sandro Tonali (Newcastle United)', 'insert'),
  (35, 'Alan Shearer (Newcastle United)', 'insert'),
  (36, 'Morgan Gibbs-White (Nottingham Forest)', 'insert'),
  (37, 'Chris Wood (Nottingham Forest)', 'insert'),
  (38, 'Dejan Kulusevski (Tottenham Hotspur)', 'insert'),
  (39, 'Son Heung-Min (Tottenham Hotspur)', 'insert'),
  (40, 'Dimitar Berbatov (Tottenham Hotspur)', 'insert'),
  (41, 'Joe Cole (West Ham United)', 'insert'),
  (42, 'Luis Guilherme (West Ham United)', 'insert'),
  (43, 'André (Wolverhampton Wanderers)', 'insert'),
  (44, 'Paul Ince (Wolverhampton Wanderers)', 'insert'),
  (45, 'Matheus Cunha (Wolverhampton Wanderers)', 'insert'),
  (46, 'Josh Brownhill (Burnley)', 'insert'),
  (47, 'Marcus Edwards (Burnley)', 'insert'),
  (48, 'Wilfried Gnonto (Leeds United)', 'insert'),
  (49, 'Daniel James (Leeds United)', 'insert'),
  (50, 'Jimmy Floyd Hasselbaink (Leeds United)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 20, 0
from inserted_cards ic;
