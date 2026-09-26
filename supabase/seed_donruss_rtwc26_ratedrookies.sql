-- Seed data for Panini Donruss Road to FIFA World Cup 26 > Rated Rookies, 50 cards.
-- Källa: Football Cartophilic Info Exchange (cartophilic-info-exch.blogspot.com),
-- en tredjeparts-hobbyblogg -- INTE maskinläsbart hämtat, räkna med
-- enstaka fel/missade rader. Landslag inom parentes, precis som i
-- grundsetet (seed_donruss_rtwc26_base.sql) -- se den filens header för
-- samma osäkerhetsnivå-kommentar.
--
-- Numrering: egna, TRYCKTA numren från källan (201-250, en fortsättning på grundsetets 1-200) -- inte omnumrerat.
--
-- Run this once in the Supabase SQL editor after schema.sql AND
-- set_visibility.sql AND topps_rarity.sql AND sets_product_line.sql AND
-- seed_donruss_rtwc26_base.sql.
-- Stock defaults to 0 -- cards stay greyed out (and the set stays hidden)
-- until you set real stock in /admin. Price defaults to a flat placeholder.
-- Only a 'normal' variant is created (no holo).

with s as (
  insert into sets (category_slug, category_name, slug, name, is_visible, product_line)
  values ('panini-donruss-rtwc26', 'Panini Donruss Road to FIFA World Cup 26', 'rated-rookies-donruss-rtwc26', 'Rated Rookies', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (201, 'Damion Downs (United States)', 'insert'),
  (202, 'Alex Freeman (United States)', 'insert'),
  (203, 'Jaminton Campaz (Colombia)', 'insert'),
  (204, 'Franjo Ivanovic (Croatia)', 'insert'),
  (205, 'Petar Sucic (Croatia)', 'insert'),
  (206, 'Jordan James (Cymru)', 'insert'),
  (207, 'Lewis Koumas (Cymru)', 'insert'),
  (208, 'Nick Woltemade (Germany)', 'insert'),
  (209, 'Lawrence Agyekum (Ghana)', 'insert'),
  (210, 'Ebenezer Annan (Ghana)', 'insert'),
  (211, 'Denzell Garcia (Mexico)', 'insert'),
  (212, 'Erik Lira (Mexico)', 'insert'),
  (213, 'Pablo Monroy (Mexico)', 'insert'),
  (214, 'Gilberto Mora (Mexico)', 'insert'),
  (215, 'Luka Vuskovic (Croatia)', 'insert'),
  (216, 'Osame Sahraoui (Morocco)', 'insert'),
  (217, 'Oussama Targhalline (Morocco)', 'insert'),
  (218, 'Tolu Arokodare (Nigeria)', 'insert'),
  (219, 'Isaac Price (Northern Ireland)', 'insert'),
  (220, 'Justin Devenny (Northern Ireland)', 'insert'),
  (221, 'Pierce Charles (Northern Ireland)', 'insert'),
  (222, 'Shea Charles (Northern Ireland)', 'insert'),
  (223, 'Sindre Walle Egeli (Norway)', 'insert'),
  (224, 'Thelo Aasgaard (Norway)', 'insert'),
  (225, 'Damian Bobadilla (Paraguay)', 'insert'),
  (226, 'Matias Galarza Fonda (Paraguay)', 'insert'),
  (227, 'Antoni Kozubal (Poland)', 'insert'),
  (228, 'Przemyslaw Wisniewski (Poland)', 'insert'),
  (229, 'Andrew Moran (Republic of Ireland)', 'insert'),
  (230, 'Rocco Vata (Republic of Ireland)', 'insert'),
  (231, 'Troy Parrott (Republic of Ireland)', 'insert'),
  (232, 'James Wilson (Scotland)', 'insert'),
  (233, 'Max Johnston (Scotland)', 'insert'),
  (234, 'Tommy Conway (Scotland)', 'insert'),
  (235, 'Antoine Mendy (Senegal)', 'insert'),
  (236, 'El Hadji Malick Diouf (Senegal)', 'insert'),
  (237, 'Ilay Camara (Senegal)', 'insert'),
  (238, 'Andrija Maksimovic (Serbia)', 'insert'),
  (239, 'Mihailo Ivanovic (Serbia)', 'insert'),
  (240, 'Mihajlo Cvetkovic (Serbia)', 'insert'),
  (241, 'Ognjen Mimovic (Serbia)', 'insert'),
  (242, 'Besfort Zeneli (Sweden)', 'insert'),
  (243, 'Hugo Bolin (Sweden)', 'insert'),
  (244, 'Nils Zatterstrom (Sweden)', 'insert'),
  (245, 'Sebastian Nanasi (Sweden)', 'insert'),
  (246, 'Noahkai Banks (United States)', 'insert'),
  (247, 'Alvyn Sanches (Switzerland)', 'insert'),
  (248, 'Aurele Amenda (Switzerland)', 'insert'),
  (249, 'Leonidas Stergiou (Switzerland)', 'insert'),
  (250, 'Johan Manzambi (Switzerland)', 'insert')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 20, 0
from inserted_cards ic;
