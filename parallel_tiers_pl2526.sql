-- Parallels (färgade/numrerade tryck) för Topps Premier League 2025/26 >
-- Grundset (slug 'grundset-2025-26', se seed_topps_pl_25_26_base.sql --
-- OBS: den filen döptes om från 'grundset' till 'grundset-2025-26' i en
-- rättning 2026-09-25 eftersom sets.slug är globalt unikt och 'grundset'
-- redan ägs av 2026/27-setet. Kör den uppdaterade base-filen INNAN den
-- här, annars hittas inget set och inget läggs till).
--
-- Källa: checklistinsider.com "2025-26 Topps Premier League" (hämtad via
-- webbsökning 2026-09-25), korsverifierad mot Topps eget
-- ripped.topps.com "Ultimate Guide to 2025/26 Topps Premier League
-- Parallel Cards" -- de två stämmer överens på ändpunkterna för varje
-- kanal (t.ex. "Aqua Sparkle /499 → Foilfractor 1/1" för Retail Sparkles,
-- "Blue Rainbow /150 → Foilfractor 1/1" för Hobby Rainbows), men Topps
-- egen artikel listar inte alla mellanliggande nivåer, så den fullständiga
-- listan nedan kommer bara från aggregatorn. INTE dubbelkollad rad för
-- rad mot en riktig box.
--
-- OBS strukturen skiljer sig från 2026/27-sättet (parallel_tiers.sql):
--   - Ingen "Netbuster"-nivå den här säsongen.
--   - Tre kanaler istället för två: Retail (Sparkle-namn), "Display Box"
--     (Mini-Diamond-namn, en egen produkt/kanal) och Hobby (Rainbow-namn).
--   - Retail har tre onumrerade odds-baserade nivåer (Blue 1:2, Yellow
--     1:4, Green 1:8) istället för en enda "PL Parallel"-rad.
-- "FoilFractor" finns i alla tre kanaler med samma namn -- döpta om per
-- kanal här (t.ex. "FoilFractor (Retail)") eftersom (set_id, name) måste
-- vara unikt.
--
-- RUN parallel_tiers.sql FIRST (skapar tabellen) och
-- seed_topps_pl_25_26_base.sql FIRST (skapar setet 'grundset' under
-- 'topps-premier-league-25-26').
--
-- Safe to run more than once.

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
where s.slug = 'grundset-2025-26'
on conflict (set_id, name) do nothing;
