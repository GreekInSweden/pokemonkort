-- Parallels för Topps UEFA Club Competitions (UCC) 2025/26 > Grundset
-- (slug 'grundset-ucc-2025-26', se seed_topps_ucc_25_26_base.sql).
--
-- Källa: checklistinsider.com "2025-26 Topps UEFA Club Competitions"
-- (hämtad via webbsökning 2026-09-25) -- INTE Topps eget material rad
-- för rad, samma osäkerhetsnivå som övriga parallel_tiers_*.sql-filer.
--
-- STRUKTUREN SKILJER SIG FRÅN PL-SETTEN: UCC har fyra olika "finish"
-- (Foil / Raindrops / Holo / Inferno Holo) inom SAMMA färg/upplaga,
-- istället för en enda namngiven nivå per upplaga som i PL. T.ex. finns
-- "Blue Foil /150", "Blue Raindrops /150", "Blue Holo /150" OCH "Blue
-- Inferno Holo /150" som fyra separata parallels, inte en.
--
-- De onumrerade (odds-baserade) nivåerna dras dessutom ur FLERA olika
-- paket-typer samtidigt med olika odds (t.ex. "1:24 Hobby; 1:24 London
-- Store") -- går inte att sortera in i en enda hobby/retail-kanal utan
-- att bli missvisande, så channel lämnas null (= "okänd/blandad", se
-- kommentaren i parallel_tiers.sql) och oddsen står i namnet istället.
--
-- "Spring Tin"-parallellerna (en egen säsongsprodukt: Spring/Egg/
-- Rabbits/Flowers/Umbrella/Watering Can/Birds) är MEDVETET uteslutna
-- här -- de hör till en separat produkt, inte till Grundsettets vanliga
-- paket, och är utanför den här omgångens scope.
--
-- RUN parallel_tiers.sql FIRST och seed_topps_ucc_25_26_base.sql FIRST.
--
-- Safe to run more than once.

insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  -- Onumrerade, odds-baserade (blandade paket-typer, se kommentar ovan)
  ('Diamante (2:1 Hanger)', null, null, 1),
  ('Holo Foil (1:10 Blaster/Hanger)', null, null, 2),
  ('Pink Diamante (1:10 Hanger)', null, null, 3),
  ('Raindrops (1:4 Hobby/London Store)', null, null, 4),
  ('Pink Holo Foil (1:19 Blaster; 1:5 Hanger)', null, null, 5),
  ('Neon Yellow FlowFractor (1:24 Hobby/London Store)', null, null, 6),
  ('Neon Pink FlowFractor (1:48 Hobby/London Store)', null, null, 7),
  ('Neon Blue FlowFractor (1:72 Hobby/London Store)', null, null, 8),
  ('Neon Purple FlowFractor (1:192 Hobby/London Store)', null, null, 9),
  ('Neon Green FlowFractor (1:384 Hobby/London Store)', null, null, 10),
  ('Aqua Holo Foil (1:500 Blaster/Hanger)', null, null, 11),
  ('Aqua Foil (1:500 Hobby/London Store)', null, null, 12),
  -- Numrerade, per färg (fyra "finish" per upplaga: Foil/Raindrops/Holo/Inferno Holo)
  ('Yellow Holo', null, 299, 13),
  ('Yellow Inferno Holo', null, 299, 14),
  ('Purple Foil', null, 250, 15),
  ('Purple Raindrops', null, 250, 16),
  ('Purple Holo', null, 250, 17),
  ('Purple Inferno Holo', null, 250, 18),
  ('Blue Foil', null, 150, 19),
  ('Blue Raindrops', null, 150, 20),
  ('Blue Holo', null, 150, 21),
  ('Blue Inferno Holo', null, 150, 22),
  ('Green Foil', null, 99, 23),
  ('Green Raindrops', null, 99, 24),
  ('Green Holo', null, 99, 25),
  ('Green Inferno Holo', null, 99, 26),
  ('Black & White Foil', null, 75, 27),
  ('Black & White Raindrops', null, 75, 28),
  ('Black & White Holo', null, 75, 29),
  ('Gold Foil', null, 50, 30),
  ('Gold Raindrops', null, 50, 31),
  ('Gold Holo', null, 50, 32),
  ('Gold Inferno Holo', null, 50, 33),
  ('Orange Foil', null, 25, 34),
  ('Orange Raindrops', null, 25, 35),
  ('Orange Holo', null, 25, 36),
  ('Orange Inferno Holo', null, 25, 37),
  ('Black Foil', null, 10, 38),
  ('Black Raindrops', null, 10, 39),
  ('Black Holo', null, 10, 40),
  ('Black Inferno Holo', null, 10, 41),
  ('Red Foil', null, 5, 42),
  ('Red Raindrops', null, 5, 43),
  ('Red Holo', null, 5, 44),
  ('Red Inferno Holo', null, 5, 45),
  -- 1/1
  ('First Card', null, 1, 46),
  ('FoilFractor', null, 1, 47),
  ('Printing Plates', null, 1, 48),
  ('Platinum Holo', null, 1, 49)
) as v(name, channel, print_run, sort_order)
where s.slug = 'grundset-ucc-2025-26'
on conflict (set_id, name) do nothing;
