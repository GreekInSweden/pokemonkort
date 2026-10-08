-- Parallels för Panini Donruss Road to FIFA World Cup 26 > Grundset
-- (slug 'grundset-donruss-rtwc26', se seed_donruss_rtwc26_base.sql).
--
-- Källa: checklistinsider.com (de 27 "vanliga" parallellerna, med
-- bekräftade upplagor #/5 upp till 1/1) + Football Cartophilic Info
-- Exchange (Optic-parallellerna). INTE Topps/Panini eget material rad
-- för rad -- lägre säkerhet än de flesta av våra tidigare
-- parallel_tiers_*.sql-filer, se anmärkningarna nedan.
--
-- 1) DE 27 "VANLIGA" PARALLELLERNA -- print_run bekräftad för alla,
--    källan sorterade dem redan från vanligast till sällsyntast.
--
-- 2) OPTIC-PARALLELLERNA -- det finns minst 22 namngivna Optic-varianter
--    (en helt egen Chrome-liknande delserie), men bara TRE av dem har en
--    bekräftad upplaga i källorna jag hittade (Electricity #/75, Dragon
--    #/8, Black Pandora 1/1 -- den sistnämnda Hobby International-
--    exklusiv). Resten (Argyle, Holo, Ice, Plum Blossom, Velocity, Red,
--    Orange, Blue, Teal Mojo, Pink Ice, Purple Mojo, Gold, Green, Black,
--    Gold Vinyl m.fl. varianter/kombinationer) är bekräftat namngivna men
--    UTAN bekräftad upplaga -- de har print_run = null här, vilket alltså
--    betyder "okänd upplaga", INTE nödvändigtvis "onumrerad" (samma
--    null-konvention som i övriga parallel_tiers_*.sql-filer, se
--    parallel_tiers.sql). Fyll i rätt siffra i tabellen när/om ni ser den
--    på en riktig box.
--
-- RUN parallel_tiers.sql FIRST och seed_donruss_rtwc26_base.sql FIRST.
-- Safe to run more than once.

-- 1) Vanliga parallels
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  ('Bronze', null, null, 1),
  ('Cubic', null, null, 2),
  ('Diamond', null, null, 3),
  ('Maze', null, null, 4),
  ('Red & Blue Maze', null, null, 5),
  ('Red & Gold', null, null, 6),
  ('Red & Green', null, null, 7),
  ('Silver', null, null, 8),
  ('Blue Swirl', null, 399, 9),
  ('Green & Blue Maze', null, 270, 10),
  ('Blue Cubic', null, 205, 11),
  ('Teal', null, 199, 12),
  ('Orange', null, 99, 13),
  ('Blue Pyramids', null, 95, 14),
  ('Pink Swirl', null, 89, 15),
  ('Red Swirl', null, 79, 16),
  ('Red', null, 75, 17),
  ('Red Cubic', null, 50, 18),
  ('Blue', null, 49, 19),
  ('Pink Cubic', null, 45, 20),
  ('Pink Diamond', null, 25, 21),
  ('Purple', null, 25, 22),
  ('Red Pyramids', null, 20, 23),
  ('Gold', null, 10, 24),
  ('Gold Diamond', null, 10, 25),
  ('Green', null, 5, 26),
  ('Black', null, 1, 27)
) as v(name, channel, print_run, sort_order)
where s.slug = 'grundset-donruss-rtwc26'
on conflict (set_id, name) do nothing;

-- 2) Optic-parallels (egen Chrome-liknande delserie, se anmärkning ovan
--    om vilka som har bekräftad upplaga och vilka som inte har det).
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  ('Optic', null, null, 28),
  ('Optic Argyle', null, null, 29),
  ('Optic Holo', null, null, 30),
  ('Optic Ice', null, null, 31),
  ('Optic Plum Blossom', null, null, 32),
  ('Optic Velocity', null, null, 33),
  ('Optic Blue', null, null, 34),
  ('Optic Red', null, null, 35),
  ('Optic Orange', null, null, 36),
  ('Optic Orange Ice', null, null, 37),
  ('Optic Orange Velocity', null, null, 38),
  ('Optic Pink Ice', null, null, 39),
  ('Optic Pink Velocity', null, null, 40),
  ('Optic Teal Mojo', null, null, 41),
  ('Optic Purple Mojo', null, null, 42),
  ('Optic Gold', null, null, 43),
  ('Optic Gold Vinyl', null, null, 44),
  ('Optic Green', null, null, 45),
  ('Optic Black', null, null, 46),
  ('Optic Electricity', null, 75, 47),
  ('Optic Dragon', null, 8, 48),
  ('Optic Black Pandora', null, 1, 49)
) as v(name, channel, print_run, sort_order)
where s.slug = 'grundset-donruss-rtwc26'
on conflict (set_id, name) do nothing;
