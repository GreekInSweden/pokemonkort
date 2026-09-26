-- Parallels för insert-seten i Topps Premier League 2025/26 (de 17 seten
-- från seed_topps_pl2526_*.sql).
--
-- Källa: Topps egen "Ultimate Guide to 2025/26 Topps Premier League
-- Insert Cards" (ripped.topps.com). Artikeln säger uttryckligen att
-- "parallels now apply to all insert types" -- dvs alla vanliga insert
-- (inte bara ett urval) får samma Sparkle/Mini-Diamond/Rainbow-struktur
-- som Grundsetet. Så här är det uppdelat:
--
--   16 set (alla utom Chrome King) får SAMMA 35-nivåers struktur som
--   Grundsetet (Pink #/399 upp till FoilFractor 1/1 i varje kanal, se
--   parallel_tiers_pl2526.sql). 8 av dem (Full Force, Generation Now,
--   Retro Threads, Pro Partnership, Tekker, Beast Mode, Pro Precision,
--   Headlines) namns EXPLICIT vid namn i Topps artikel som "common"/
--   "uncommon" inserts. De återstående 8 (Breakthrough Baller, Black
--   Edge Edition, Diamond Rookie, Festive Freeze, Gold Lion, Heat
--   Vision, Home Pitch Advantage, Perfect Storm) namns INTE var för sig,
--   men täcks av artikelns generella "all insert types"-mening -- så de
--   är MINDRE säkert källbelagda per-set än de första 8. Stäm av mot en
--   riktig box om ni kan innan ni litar helt på just de här 8.
--
--   Chrome King får SIN EGEN, mindre lista (Diamond #/25, Black Diamond
--   #/10, Ruby #/5) -- bekräftad separat i samma artikel som "chrome
--   inserts" med en annan tierstruktur än de vanliga insertet.
--
-- RUN parallel_tiers.sql FIRST, och alla seed_topps_pl2526_*.sql-filer
-- FIRST (skapar seten). Safe to run more than once.

-- 1) Standard-strukturen (samma som Grundsetets, se parallel_tiers_pl2526.sql)
--    för de 8 EXPLICIT namngivna seten.
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  -- Retail (Sparkle)
  ('Blue (1:2)', 'retail', null, 1),
  ('Yellow (1:4)', 'retail', null, 2),
  ('Green (1:8)', 'retail', null, 3),
  ('Aqua Sparkle', 'retail', 499, 4),
  ('Pink Sparkle', 'retail', 399, 5),
  ('Yellow Sparkle', 'retail', 299, 6),
  ('Purple Sparkle', 'retail', 199, 7),
  ('Blue Sparkle', 'retail', 150, 8),
  ('Green Sparkle', 'retail', 99, 9),
  ('Black & White Sparkle', 'retail', 75, 10),
  ('Gold Sparkle', 'retail', 50, 11),
  ('Orange Sparkle', 'retail', 25, 12),
  ('Black Sparkle', 'retail', 10, 13),
  ('Red Sparkle', 'retail', 5, 14),
  ('FoilFractor (Retail)', 'retail', 1, 15),
  -- Display Box (Mini-Diamond)
  ('Aqua Mini-Diamond', 'display-box', 499, 16),
  ('Pink Mini-Diamond', 'display-box', 399, 17),
  ('Yellow Mini-Diamond', 'display-box', 299, 18),
  ('Purple Mini-Diamond', 'display-box', 199, 19),
  ('Blue Mini-Diamond', 'display-box', 150, 20),
  ('Green Mini-Diamond', 'display-box', 99, 21),
  ('Black & White Mini-Diamond', 'display-box', 75, 22),
  ('Gold Mini-Diamond', 'display-box', 50, 23),
  ('Orange Mini-Diamond', 'display-box', 25, 24),
  ('Black Mini-Diamond', 'display-box', 10, 25),
  ('Red Mini-Diamond', 'display-box', 5, 26),
  ('FoilFractor (Display Box)', 'display-box', 1, 27),
  -- Hobby (Rainbow)
  ('Blue Rainbow', 'hobby', 150, 28),
  ('Green Rainbow', 'hobby', 99, 29),
  ('Black & White Rainbow', 'hobby', 75, 30),
  ('Gold Rainbow', 'hobby', 50, 31),
  ('Orange Rainbow', 'hobby', 25, 32),
  ('Black Rainbow', 'hobby', 10, 33),
  ('Red Rainbow', 'hobby', 5, 34),
  ('FoilFractor (Hobby)', 'hobby', 1, 35)
) as v(name, channel, print_run, sort_order)
where s.slug in (
  'full-force-25-26',
  'generation-now-25-26',
  'retro-threads-25-26',
  'pro-partnership-25-26',
  'tekker-25-26',
  'beast-mode-25-26',
  'pro-precision-25-26',
  'headlines-25-26'
)
on conflict (set_id, name) do nothing;

-- 2) Samma struktur för de återstående 8 seten (täcks av "all insert
--    types"-uttalandet, men inte namngivna var för sig i källan -- se
--    kommentar ovan om lägre källsäkerhet för just den här gruppen).
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  -- Retail (Sparkle)
  ('Blue (1:2)', 'retail', null, 1),
  ('Yellow (1:4)', 'retail', null, 2),
  ('Green (1:8)', 'retail', null, 3),
  ('Aqua Sparkle', 'retail', 499, 4),
  ('Pink Sparkle', 'retail', 399, 5),
  ('Yellow Sparkle', 'retail', 299, 6),
  ('Purple Sparkle', 'retail', 199, 7),
  ('Blue Sparkle', 'retail', 150, 8),
  ('Green Sparkle', 'retail', 99, 9),
  ('Black & White Sparkle', 'retail', 75, 10),
  ('Gold Sparkle', 'retail', 50, 11),
  ('Orange Sparkle', 'retail', 25, 12),
  ('Black Sparkle', 'retail', 10, 13),
  ('Red Sparkle', 'retail', 5, 14),
  ('FoilFractor (Retail)', 'retail', 1, 15),
  -- Display Box (Mini-Diamond)
  ('Aqua Mini-Diamond', 'display-box', 499, 16),
  ('Pink Mini-Diamond', 'display-box', 399, 17),
  ('Yellow Mini-Diamond', 'display-box', 299, 18),
  ('Purple Mini-Diamond', 'display-box', 199, 19),
  ('Blue Mini-Diamond', 'display-box', 150, 20),
  ('Green Mini-Diamond', 'display-box', 99, 21),
  ('Black & White Mini-Diamond', 'display-box', 75, 22),
  ('Gold Mini-Diamond', 'display-box', 50, 23),
  ('Orange Mini-Diamond', 'display-box', 25, 24),
  ('Black Mini-Diamond', 'display-box', 10, 25),
  ('Red Mini-Diamond', 'display-box', 5, 26),
  ('FoilFractor (Display Box)', 'display-box', 1, 27),
  -- Hobby (Rainbow)
  ('Blue Rainbow', 'hobby', 150, 28),
  ('Green Rainbow', 'hobby', 99, 29),
  ('Black & White Rainbow', 'hobby', 75, 30),
  ('Gold Rainbow', 'hobby', 50, 31),
  ('Orange Rainbow', 'hobby', 25, 32),
  ('Black Rainbow', 'hobby', 10, 33),
  ('Red Rainbow', 'hobby', 5, 34),
  ('FoilFractor (Hobby)', 'hobby', 1, 35)
) as v(name, channel, print_run, sort_order)
where s.slug in (
  'breakthrough-baller-25-26',
  'black-edge-25-26',
  'diamond-rookie-25-26',
  'festive-freeze-25-26',
  'gold-lion-25-26',
  'heat-vision-25-26',
  'home-pitch-advantage-25-26',
  'perfect-storm-25-26'
)
on conflict (set_id, name) do nothing;

-- 3) Chrome King -- egen, mindre lista.
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  ('Diamond', null, 25, 1),
  ('Black Diamond', null, 10, 2),
  ('Ruby', null, 5, 3)
) as v(name, channel, print_run, sort_order)
where s.slug = 'chrome-king-25-26'
on conflict (set_id, name) do nothing;
