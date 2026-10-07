-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Kit Series, 50 cards.
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
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'kit-series-donruss-rtwc26', 'Kit Series', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Lautaro Martinez (Argentina)', 'insert'),
  (2, 'Julian Alvarez (Argentina)', 'insert'),
  (3, 'Vini Jr. (Brazil)', 'insert'),
  (4, 'Gabriel Martinelli (Brazil)', 'insert'),
  (5, 'Bruno Guimaraes (Brazil)', 'insert'),
  (6, 'Jhon Duran (Colombia)', 'insert'),
  (7, 'James Rodriguez (Colombia)', 'insert'),
  (8, 'Ante Budimir (Croatia)', 'insert'),
  (9, 'Andrej Kramaric (Croatia)', 'insert'),
  (10, 'Curtis Jones (England)', 'insert'),
  (11, 'Ezri Konsa (England)', 'insert'),
  (12, 'Reece James (England)', 'insert'),
  (13, 'Matteo Guendouzi (France)', 'insert'),
  (14, 'Jules Kounde (France)', 'insert'),
  (15, 'Aurelien Tchouameni (France)', 'insert'),
  (16, 'Michael Olise (France)', 'insert'),
  (17, 'Jamal Musiala (Germany)', 'insert'),
  (18, 'Angelo Stiller (Germany)', 'insert'),
  (19, 'Florian Wirtz (Germany)', 'insert'),
  (20, 'Antonio Rudiger (Germany)', 'insert'),
  (21, 'Mateo Retegui (Italy)', 'insert'),
  (22, 'Nicolo Rovella (Italy)', 'insert'),
  (23, 'Moise Kean (Italy)', 'insert'),
  (24, 'Min-Hyuk Yang (Korea Republic)', 'insert'),
  (25, 'Jun-Ho Bae (Korea Republic)', 'insert'),
  (26, 'Roberto Alvarado (Mexico)', 'insert'),
  (27, 'Santiago Gimenez (Mexico)', 'insert'),
  (28, 'Eliesse Ben Seghir (Morocco)', 'insert'),
  (29, 'Bilal El Khannouss (Morocco)', 'insert'),
  (30, 'Martin Odegaard (Norway)', 'insert'),
  (31, 'Sindre Walle Egeli (Norway)', 'insert'),
  (32, 'Renato Veiga (Portugal)', 'insert'),
  (33, 'Bruno Fernandes (Portugal)', 'insert'),
  (34, 'Seamus Coleman (Republic of Ireland)', 'insert'),
  (35, 'Sadio Mane (Senegal)', 'insert'),
  (36, 'Nicolas Jackson (Senegal)', 'insert'),
  (37, 'Mihajlo Cvetkovic (Serbia)', 'insert'),
  (38, 'Dusan Vlahovic (Serbia)', 'insert'),
  (39, 'Pau Cubarsi (Spain)', 'insert'),
  (40, 'Samu Aghehowa (Spain)', 'insert'),
  (41, 'Nico Williams (Spain)', 'insert'),
  (42, 'Viktor Gyokeres (Sweden)', 'insert'),
  (43, 'Lucas Bergvall (Sweden)', 'insert'),
  (44, 'Benjamin Cremaschi (United States)', 'insert'),
  (45, 'Diego Luna (United States)', 'insert'),
  (46, 'Christian Pulisic (United States)', 'insert'),
  (47, 'Darwin Nunez (Uruguay)', 'insert'),
  (48, 'Mathias Olivera (Uruguay)', 'insert'),
  (49, 'Neco Williams (Cymru)', 'insert'),
  (50, 'Daniel James (Cymru)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 10, 0
from inserted_cards ic;
