-- Seed data for Topps UEFA Club Competitions (UCC) 2025/26 > Grundset.
--
-- IMPORTANT — samma osäkerhetsnivå som PL-filerna: det finns inget
-- maskinläsbart dataset för Topps fotbollskort, så den här listan är
-- hopsatt genom webbsökning mot en tredjeparts-aggregator
-- (checklistinsider.com), INTE Topps eget material rad för rad.
--
-- Setet har 200 kortnummer totalt, men källan täckte bara ~177 av dem —
-- resten (t.ex. några "Future Stars"/rookie-rader som inte fanns med i
-- källans lag-för-lag-lista) saknas helt här. De numren finns alltså
-- inte i databasen förrän någon kompletterar dem manuellt.
--
-- Två kända dubbletter i källan rensades bort innan den här listan
-- skrevs (samma nummer angivet två gånger med olika spelare):
--   - #68 "Lewis Hall" stod under BÅDE Liverpool och Newcastle — bara
--     Newcastle-raden behölls (han spelar där numera).
--   - #76 stod som både en oidentifierad Liverpool-rad och "Romelu
--     Lukaku (Napoli)" — bara Lukaku-raden behölls.
--
-- Taggar som "(RC)" (Rookie Card) och "(UCL Team of the Season)" från
-- källan är INTE med i namnen nedan -- de är parallell-/delsets-taggar,
-- inte del av det tryckta kortnamnet. "(Future Stars)" är dock sparat
-- som en " FS"-suffix på lagnamnet, samma konvention som redan används
-- för Premier League-grundsetten (se seed_topps_pl_base.sql).
--
-- Stämmer av mot korten ni faktiskt har i handen innan ni litar helt på
-- den här listan -- särskilt stavningen på ett par ovanliga namn (t.ex.
-- "Shumaira Mheuka" för Chelsea #32) som kan vara en OCR/sökmotor-miss.
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
  values ('topps-ucc-25-26', 'Topps UEFA Club Competitions 2025/26', 'grundset-ucc-2025-26', 'Grundset', false, 'sportkort')
  returning id
),
inserted_cards as (
  insert into cards (set_id, number, name, rarity)
  select s.id, v.number, v.name, v.rarity
  from s, (values
  (1, 'Rayan Cherki (Manchester City)', 'base'),
  (2, 'Bernardo Silva (Manchester City)', 'base'),
  (3, 'Ousmane Dembélé (PSG)', 'base'),
  (4, 'Michael Olise (Bayern München)', 'base'),
  (5, 'Jobe Bellingham (Borussia Dortmund)', 'base'),
  (6, 'Jeremie Frimpong (Liverpool)', 'base'),
  (7, 'Matteo Politano (Napoli)', 'base'),
  (8, 'Youri Tielemans (Aston Villa)', 'base'),
  (9, 'Axel Tapé (Bayer Leverkusen)', 'base'),
  (10, 'Lamine Yamal (FC Barcelona)', 'base'),
  (11, 'Stanislav Lobotka (Napoli)', 'base'),
  (12, 'Bukayo Saka (Arsenal)', 'base'),
  (13, 'Antony (Real Betis)', 'base'),
  (14, 'João Neves (PSG)', 'base'),
  (15, 'Weston McKennie (Juventus)', 'base'),
  (16, 'Richard Ríos (SL Benfica)', 'base'),
  (17, 'Jonathan David (Juventus)', 'base'),
  (18, 'Brennan Johnson (Tottenham Hotspur)', 'base'),
  (19, 'Gabriel Martinelli (Arsenal)', 'base'),
  (20, 'Iñaki Williams (Athletic Club)', 'base'),
  (21, 'Ethan Nwaneri (Arsenal FS)', 'base'),
  (23, 'Joelinton (Newcastle United)', 'base'),
  (24, 'Malik Tillman (Bayer Leverkusen)', 'base'),
  (25, 'Julien Duranville (Borussia Dortmund)', 'base'),
  (26, 'Robin Mirisola (KRC Genk)', 'base'),
  (27, 'Andreas Schjelderup (SL Benfica)', 'base'),
  (29, 'Kendry Páez (RC Strasbourg Alsace)', 'base'),
  (30, 'Jota (Celtic FC)', 'base'),
  (31, 'Eduardo Camavinga (Real Madrid C.F.)', 'base'),
  (32, 'Shumaira Mheuka (Chelsea FC)', 'base'),
  (33, 'Savinho (Manchester City)', 'base'),
  (34, 'Vangelis Pavlidis (SL Benfica)', 'base'),
  (35, 'Isco (Real Betis)', 'base'),
  (36, 'Hugo Larsson (Eintracht Frankfurt)', 'base'),
  (37, 'Federico Dimarco (FC Internazionale Milano)', 'base'),
  (38, 'Nico Williams (Athletic Club)', 'base'),
  (39, 'Dean Huijsen (Real Madrid C.F.)', 'base'),
  (40, 'Reo Hatate (Celtic FC)', 'base'),
  (41, 'Scott McTominay (Napoli)', 'base'),
  (42, 'Viktor Gyökeres (Arsenal)', 'base'),
  (43, 'Sean Steur (AFC Ajax)', 'base'),
  (44, 'Alejo Sarco (Bayer Leverkusen)', 'base'),
  (45, 'Mohamed Diomandé (Rangers F.C.)', 'base'),
  (46, 'Vitinha (PSG)', 'base'),
  (47, 'Jérémy Doku (Manchester City)', 'base'),
  (48, 'Marcus Thuram (FC Internazionale Milano)', 'base'),
  (49, 'Divine Mukasa (Manchester City)', 'base'),
  (50, 'William Gomes (FC Porto)', 'base'),
  (51, 'Cucho (Real Betis)', 'base'),
  (52, 'Myles Lewis-Skelly (Arsenal FS)', 'base'),
  (53, 'Morgan Gibbs-White (Nottingham Forest)', 'base'),
  (54, 'Robert Lewandowski (FC Barcelona)', 'base'),
  (55, 'Joshua Kimmich (Bayern München)', 'base'),
  (56, 'Mikey Moore (Rangers FS)', 'base'),
  (57, 'Henrikh Mkhitaryan (FC Internazionale Milano)', 'base'),
  (58, 'Tyrique George (Chelsea FS)', 'base'),
  (59, 'Serhou Guirassy (Borussia Dortmund)', 'base'),
  (61, 'Elye Wahi (Eintracht Frankfurt)', 'base'),
  (62, 'Martim Fernandes (FC Porto)', 'base'),
  (63, 'Bradley Barcola (PSG)', 'base'),
  (64, 'Jude Bellingham (Real Madrid C.F.)', 'base'),
  (65, 'Federico Valverde (Real Madrid C.F.)', 'base'),
  (66, 'Estêvão Willian (Chelsea FC)', 'base'),
  (68, 'Lewis Hall (Newcastle United)', 'base'),
  (69, 'Nuno Mendes (PSG)', 'base'),
  (70, 'Reece James (Chelsea FC)', 'base'),
  (71, 'Khéphren Thuram (Juventus)', 'base'),
  (72, 'Ibrahim Maza (Bayer Leverkusen)', 'base'),
  (73, 'Andy Robertson (Liverpool)', 'base'),
  (74, 'Florian Wirtz (Liverpool)', 'base'),
  (75, 'Emiliano Martínez (Aston Villa)', 'base'),
  (76, 'Romelu Lukaku (Napoli)', 'base'),
  (77, 'Giovanni Di Lorenzo (Napoli)', 'base'),
  (79, 'Virgil van Dijk (Liverpool)', 'base'),
  (80, 'Omar Marmoush (Manchester City)', 'base'),
  (81, 'Julian Brandt (Borussia Dortmund)', 'base'),
  (82, 'Antoine Griezmann (Atlético de Madrid)', 'base'),
  (83, 'Rodrigo Mora (FC Porto FS)', 'base'),
  (84, 'Claudio Echeverri (Bayer Leverkusen)', 'base'),
  (86, 'Endrick (Real Madrid C.F. FS)', 'base'),
  (87, 'Gabri Veiga (FC Porto)', 'base'),
  (88, 'Murillo (Nottingham Forest)', 'base'),
  (89, '2024-25 Title Winners (Tottenham Hotspur)', 'base'),
  (90, 'Alphonso Davies (Bayern München)', 'base'),
  (91, 'Dan Burn (Newcastle United)', 'base'),
  (92, 'Marquinhos (PSG)', 'base'),
  (95, 'Geovany Quenda (Sporting Clube de Portugal FS)', 'base'),
  (96, 'Elliot Anderson (Nottingham Forest)', 'base'),
  (97, 'Raphinha (FC Barcelona)', 'base'),
  (98, 'Daizen Maeda (Celtic FC)', 'base'),
  (99, 'Nico Schlotterbeck (Borussia Dortmund)', 'base'),
  (100, 'Giuliano Simeone (Atlético de Madrid)', 'base'),
  (101, 'Minjae Kim (Bayern München)', 'base'),
  (102, 'Rodrygo (Real Madrid C.F.)', 'base'),
  (103, 'Phil Foden (Manchester City)', 'base'),
  (104, 'Ousmane Diomande (Sporting Clube de Portugal)', 'base'),
  (105, 'Maroan Sannadi (Athletic Club)', 'base'),
  (107, 'Andrey Santos (Chelsea FC)', 'base'),
  (108, 'Nicolò Barella (FC Internazionale Milano)', 'base'),
  (109, 'Sandro Tonali (Newcastle United)', 'base'),
  (110, 'Emanuel Emegha (RC Strasbourg Alsace)', 'base'),
  (111, 'Dro (FC Barcelona)', 'base'),
  (112, 'Kylian Mbappé (Real Madrid C.F.)', 'base'),
  (113, 'William Saliba (Arsenal)', 'base'),
  (114, 'Abdoul Ouattara (RC Strasbourg Alsace)', 'base'),
  (115, 'Vini Jr. (Real Madrid C.F.)', 'base'),
  (116, 'Ange-Yoan Bonny (FC Internazionale Milano)', 'base'),
  (118, 'Cole Palmer (Chelsea FC)', 'base'),
  (119, 'Arthur Theate (Eintracht Frankfurt)', 'base'),
  (120, 'Ousmane Diallo (Borussia Dortmund)', 'base'),
  (121, 'Lucas Bergvall (Tottenham Hotspur)', 'base'),
  (122, 'Noah Adedeji-Sternberg (KRC Genk)', 'base'),
  (123, 'Takumi Minamino (AS Monaco)', 'base'),
  (124, 'Ollie Watkins (Aston Villa)', 'base'),
  (125, 'Ben Parkinson (Newcastle United)', 'base'),
  (126, 'Jarne Steuckers (KRC Genk)', 'base'),
  (127, 'Kenneth Taylor (AFC Ajax)', 'base'),
  (128, 'Karim Adeyemi (Borussia Dortmund)', 'base'),
  (129, 'George Ilenikhena (AS Monaco FS)', 'base'),
  (130, 'Jamal Musiala (Bayern München)', 'base'),
  (131, 'Luis Henrique (FC Internazionale Milano)', 'base'),
  (132, 'Gavi (FC Barcelona)', 'base'),
  (134, 'Callum Olusesi (Tottenham Hotspur)', 'base'),
  (135, 'Frenkie de Jong (FC Barcelona)', 'base'),
  (136, 'Mohamed Salah (Liverpool)', 'base'),
  (138, 'Ferran Torres (FC Barcelona)', 'base'),
  (139, 'Ivan Perišić (PSV Eindhoven)', 'base'),
  (141, 'Trent Alexander-Arnold (Real Madrid C.F.)', 'base'),
  (144, 'Dominic Solanke (Tottenham Hotspur)', 'base'),
  (145, 'Denzel Dumfries (FC Internazionale Milano)', 'base'),
  (147, 'Kenan Yildiz (Juventus)', 'base'),
  (148, 'Alistair Johnston (Celtic FC)', 'base'),
  (149, 'Abde Ezzalzouli (Real Betis)', 'base'),
  (150, 'Konstantinos Karetsas (KRC Genk)', 'base'),
  (151, 'Mika Godts (AFC Ajax)', 'base'),
  (152, 'Gleison Bremer (Juventus)', 'base'),
  (153, 'Patrik Schick (Bayer Leverkusen)', 'base'),
  (154, 'Julián Alvarez (Atlético de Madrid)', 'base'),
  (155, 'Nico O''Reilly (Manchester City)', 'base'),
  (156, 'Lautaro Martínez (FC Internazionale Milano)', 'base'),
  (157, 'Martin Ødegaard (Arsenal)', 'base'),
  (158, 'Ibrahim Mbaye (PSG FS)', 'base'),
  (159, 'Anthony Gordon (Newcastle United)', 'base'),
  (162, 'Mario Götze (Eintracht Frankfurt)', 'base'),
  (163, 'Francesco Pio Esposito (FC Internazionale Milano)', 'base'),
  (164, 'Declan Rice (Arsenal)', 'base'),
  (165, 'Archie Gray (Tottenham Hotspur)', 'base'),
  (166, '2024-25 Title Winners (PSG)', 'base'),
  (167, 'Khvicha Kvaratskhelia (PSG)', 'base'),
  (169, 'Sergiño Dest (PSV Eindhoven)', 'base'),
  (170, 'Warren Zaïre-Emery (PSG)', 'base'),
  (171, 'Alessandro Buongiorno (Napoli)', 'base'),
  (172, 'Franco Mastantuono (Real Madrid C.F.)', 'base'),
  (175, 'Dušan Vlahović (Juventus)', 'base'),
  (176, 'Hugo Ekitike (Liverpool)', 'base'),
  (177, 'Mathis Amougou (RC Strasbourg Alsace)', 'base'),
  (178, 'Mika Biereth (AS Monaco)', 'base'),
  (179, '2024-25 Title Winners (Chelsea)', 'base'),
  (180, 'Guela Doué (RC Strasbourg Alsace)', 'base'),
  (181, 'Erling Haaland (Manchester City)', 'base'),
  (182, 'Harry Kane (Bayern München)', 'base'),
  (183, 'Pau Cubarsí (FC Barcelona)', 'base'),
  (184, 'João Pedro (Chelsea FC)', 'base'),
  (185, 'Kang-in Lee (PSG)', 'base'),
  (186, 'Chris Wood (Nottingham Forest)', 'base'),
  (187, 'Lennart Karl (Bayern München)', 'base'),
  (188, 'James Tavernier (Rangers F.C.)', 'base'),
  (189, 'Conor Gallagher (Atlético de Madrid)', 'base'),
  (191, 'Rio Ngumoha (Liverpool)', 'base'),
  (192, 'Liam Delap (Chelsea FC)', 'base'),
  (193, 'Ryan Gravenberch (Liverpool)', 'base'),
  (194, 'Levi Colwill (Chelsea FC)', 'base'),
  (195, 'Oihan Sancet (Athletic Club)', 'base'),
  (196, 'Pedri (FC Barcelona)', 'base'),
  (197, 'Morgan Rogers (Aston Villa)', 'base'),
  (198, 'Désiré Doué (PSG)', 'base'),
  (199, 'Morten Hjulmand (Sporting Clube de Portugal)', 'base'),
  (200, 'Kevin De Bruyne (Napoli)', 'base')
  ) as v(number, name, rarity)
  returning id
)
insert into card_variants (card_id, variant, price_sek, stock)
select ic.id, 'normal', 3, 0
from inserted_cards ic;
