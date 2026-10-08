-- Parallels för insert-seten i Topps UEFA Club Competitions 2025/26 (de
-- 11 seten från seed_topps_ucc2526_*.sql).
--
-- Källa: waxcomp.com:s checklista för produkten (tredjeparts-aggregator,
-- INTE Topps eget material) -- till skillnad från Premier League-setet
-- finns ingen egen "Ultimate Guide"-artikel från Topps om UCC-insertens
-- parallels, så det här är en enda källa utan korsverifiering. Stäm av
-- mot en riktig box innan ni litar helt på siffrorna.
--
-- Mindgame, Murals och Regency Chrome saknar helt parallelluppgifter i
-- källan -- INTE inlagda här, snarare än att gissa.
--
-- RUN parallel_tiers.sql FIRST, och alla seed_topps_ucc2526_*.sql-filer
-- FIRST (skapar seten). Safe to run more than once.

-- 1) Standard 6-nivåers Foil-struktur (Green/Gold/Orange/Black/Red Foil
--    + Foilfractor 1/1) -- delas av 5 set.
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  ('Green Foil', null, 99, 1),
  ('Gold Foil', null, 50, 2),
  ('Orange Foil', null, 25, 3),
  ('Black Foil', null, 10, 4),
  ('Red Foil', null, 5, 5),
  ('Foilfractor', null, 1, 6)
) as v(name, channel, print_run, sort_order)
where s.slug in (
  'born-champ-ucc-25-26',
  'trophy-chasers-ucc-25-26',
  'roots-ucc-25-26',
  'best-of-the-best-ucc-25-26',
  '8bit-shots-ucc-25-26'
)
on conflict (set_id, name) do nothing;

-- 2) Home Pitch Advantage -- bara två nivåer.
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  ('Red Foil', null, 5, 1),
  ('Foilfractor', null, 1, 2)
) as v(name, channel, print_run, sort_order)
where s.slug = 'home-pitch-advantage-ucc-25-26'
on conflict (set_id, name) do nothing;

-- 3) Ultimate Stage Chrome -- egen Refractor-stege.
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  ('Aqua Refractor', null, 199, 1),
  ('Blue Refractor', null, 150, 2),
  ('Green Refractor', null, 99, 3),
  ('Purple Refractor', null, 75, 4),
  ('Gold Refractor', null, 50, 5),
  ('Orange Refractor', null, 25, 6),
  ('Black Refractor', null, 10, 7),
  ('Red Refractor', null, 5, 8),
  ('Superfractor', null, 1, 9)
) as v(name, channel, print_run, sort_order)
where s.slug = 'ultimate-stage-chrome-ucc-25-26'
on conflict (set_id, name) do nothing;

-- 4) Epicenter -- bara 1/1-nivån.
insert into parallel_tiers (set_id, name, channel, print_run, sort_order)
select s.id, v.name, v.channel, v.print_run, v.sort_order
from sets s, (values
  ('Foilfractor', null, 1, 1)
) as v(name, channel, print_run, sort_order)
where s.slug = 'epicenter-ucc-25-26'
on conflict (set_id, name) do nothing;
