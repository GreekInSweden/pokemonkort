-- Ett exempelfoto per parallel (t.ex. ett foto av vilket kort som helst
-- i just "Gold Rainbow Foil"), så man kan se nyansen på riktigt istället
-- för att bara gissa utifrån namnet -- samma idé som kortbilderna för
-- Pokémon. EN bild per parallel räcker (samma foliefärg ser likadan ut
-- oavsett spelare), inte en bild per kort×parallel.
--
-- RUN parallel_tiers.sql FIRST.
--
-- Safe to run more than once.

alter table parallel_tiers
  add column if not exists image_url text;
