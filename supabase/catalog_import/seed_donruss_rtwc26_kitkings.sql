-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Kit Kings, 50 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg -- INTE maskinläsbart hämtat, räkna med
-- enstaka fel/missade rader. Landslag inom parentes, precis som i
-- grundsetet (seed_donruss_rtwc26_base.sql) -- se den filens header för
-- samma osäkerhetsnivå-kommentar.
--
-- Numrering: egen löpande numrering (1..N) i den ordning insertet listas i källan -- inte nödvändigtvis samma nummer som på kortets baksida.
--
-- Run this once in the Supabase SQL editor after schema.sql AND
-- set_visibility.sql AND topps_rarity.sql AND sets_product_line.sql AND
-- seed_donruss_rtwc26_base.sql.
-- Stock defaults to 0 -- cards stay greyed out (and the set stays hidden)
-- until you set real stock in /admin. Price defaults to a flat placeholder.
-- Only a 'normal' variant is created (no holo).

with s as (
  insert into sets (category_slug, category_name, slug, name, is_visible, product_line)
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'kit-kings-donruss-rtwc26', 'Kit Kings', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Ethan Ampadu (Cymru)', 'insert'),
  (2, 'Brennan Johnson (Cymru)', 'insert'),
  (3, 'Maximiliano Araujo (Uruguay)', 'insert'),
  (4, 'Federico Valverde (Uruguay)', 'insert'),
  (5, 'Josh Sargent (United States)', 'insert'),
  (6, 'Giovanni Reyna (United States)', 'insert'),
  (7, 'Weston McKennie (United States)', 'insert'),
  (8, 'Alexander Isak (Sweden)', 'insert'),
  (9, 'Dejan Kulusevski (Sweden)', 'insert'),
  (10, 'Pedri (Spain)', 'insert'),
  (11, 'Dean Huijsen (Spain)', 'insert'),
  (12, 'Lamine Yamal (Spain)', 'insert'),
  (13, 'Strahinja Pavlovic (Serbia)', 'insert'),
  (14, 'Andrija Maksimovic (Serbia)', 'insert'),
  (15, 'Ismaila Sarr (Senegal)', 'insert'),
  (16, 'Lamine Camara (Senegal)', 'insert'),
  (17, 'Cristiano Ronaldo (Portugal)', 'insert'),
  (18, 'Rafael Leao (Portugal)', 'insert'),
  (19, 'Omar Alderete (Paraguay)', 'insert'),
  (20, 'Alexander Sorloth (Norway)', 'insert'),
  (21, 'Erling Haaland (Norway)', 'insert'),
  (22, 'Achraf Hakimi (Morocco)', 'insert'),
  (23, 'Ismael Saibari (Morocco)', 'insert'),
  (24, 'Luis Malagon (Mexico)', 'insert'),
  (25, 'Raul Jimenez (Mexico)', 'insert'),
  (26, 'Min-jae Kim (Korea Republic)', 'insert'),
  (27, 'Heung-Min Son (Korea Republic)', 'insert'),
  (28, 'Nicolo Barella (Italy)', 'insert'),
  (29, 'Gianluigi Donnarumma (Italy)', 'insert'),
  (30, 'Samuele Ricci (Italy)', 'insert'),
  (31, 'Tom Bischof (Germany)', 'insert'),
  (32, 'Nick Woltemade (Germany)', 'insert'),
  (33, 'Kai Havertz (Germany)', 'insert'),
  (34, 'Jonathan Tah (Germany)', 'insert'),
  (35, 'William Saliba (France)', 'insert'),
  (36, 'Manu Kone (France)', 'insert'),
  (37, 'Ousmane Dembele (France)', 'insert'),
  (38, 'Desire Doue (France)', 'insert'),
  (39, 'Anthony Gordon (England)', 'insert'),
  (40, 'Kyle Walker (England)', 'insert'),
  (41, 'Jarrod Bowen (England)', 'insert'),
  (42, 'Ivan Perisic (Croatia)', 'insert'),
  (43, 'Luka Modric (Croatia)', 'insert'),
  (44, 'Luis Diaz (Colombia)', 'insert'),
  (45, 'Jefferson Lerma (Colombia)', 'insert'),
  (46, 'Endrick (Brazil)', 'insert'),
  (47, 'Savinho (Brazil)', 'insert'),
  (48, 'Rodrygo (Brazil)', 'insert'),
  (49, 'Nico Paz (Argentina)', 'insert'),
  (50, 'Lionel Messi (Argentina)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
