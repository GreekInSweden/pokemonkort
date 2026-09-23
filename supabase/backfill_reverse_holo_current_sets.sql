-- Backfill: add the missing Reverse Holo variant row for every Common-
-- rarity card in the sets you're currently selling.
--
-- WHY THIS EXISTS
-- ----------------
-- Reverse Holo wasn't an allowed value in card_variants.variant until
-- pokemon_type_and_reverse_holo.sql widened the check constraint. Every
-- set you'd already seeded before that point (Mega Evolution base set,
-- Pitch Black, Perfect Order, Ascended Heroes, Chaos Rising, Destined
-- Rivals, Phantasmal Flames, 30th Celebration) was inserted with ONLY
-- 'normal' and 'holo' rows per card — see the "cross join (values
-- ('normal'), ('holo'))" line at the bottom of each seed_*.sql file.
-- Reverse Holo was never added retroactively, for any of them.
--
-- So it's not that specific cards were only ever produced in Reverse
-- Holo — that's a real thing for RARE-tier cards in the pre-2003 Base/
-- Jungle/Fossil/Neo era (see supabase/catalog_import/README.md), but it
-- doesn't apply to any of these modern Scarlet & Violet-era sets. In
-- reality every Common-rarity card in a modern main set is guaranteed
-- printed in BOTH a normal and a Reverse Holo version. What you were
-- actually seeing was just an inconsistent gap: some cards had a
-- Reverse Holo row because an admin happened to add it by hand via the
-- "+ Rev. Holo" button in Master Set, or the "Lägg till saknad variant"
-- button in lagret, while most never got one at all.
--
-- MEP Black Star Promos is deliberately left out — those are rarity
-- 'promo', and promo cards are genuinely single-print, no Reverse Holo
-- exists for them in real life either.
--
-- Price defaults to 2 kr (matching the "vanligt Common"-pris the seed
-- files already use), stock 0 — same as every other newly added
-- variant row, greyed out until you set real numbers. Safe to run more
-- than once: "on conflict do nothing" skips any row that's already
-- there (e.g. ones added by hand earlier).

insert into card_variants (card_id, variant, price_sek, stock)
select c.id, 'reverse_holo', 2, 0
from cards c
join sets s on s.id = c.set_id
where c.rarity = 'common'
  and s.slug in (
    'base-set',          -- Mega Evolution (bas-settet)
    'pitch-black',
    'perfect-order',
    'ascended-heroes',
    'chaos-rising',
    'destined-rivals',
    'phantasmal-flames',
    '30th-celebration'
  )
on conflict (card_id, variant) do nothing;
