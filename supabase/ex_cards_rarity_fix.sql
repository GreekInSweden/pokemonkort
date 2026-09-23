-- Answers "finns nr 4 i Pitch Black som reversed holo?" properly: NO —
-- #4 (Lurantis ex) is Double Rare in real life (confirmed against
-- pokecottage.com and cardrake.com's Pitch Black checklists), a single
-- print with no separate holo or reverse holo version at all. It was
-- already corrected for 9 of Pitch Black's 10 "ex" cards in
-- pitch_black_rarity_fix.sql — but #31 "Mega Slowbro ex" was missed in
-- that pass, and the exact same mistake (every "… ex" card seeded as
-- 'common' instead of 'double_rare') is still present, untouched, in
-- every OTHER set you've seeded: Mega Evolution (base-set), Perfect
-- Order, Ascended Heroes, Chaos Rising, Destined Rivals, Phantasmal
-- Flames and 30th Celebration.
--
-- Every Pokémon "ex" card, in every set since the mechanic's Scarlet &
-- Violet-era reboot, is guaranteed at least Double Rare — there's no
-- such thing as a Common "ex" print. That's how this fixes all of them
-- reliably: any card currently tagged 'common' whose name ends in
-- " ex" gets corrected to 'double_rare'.
--
-- Run this BEFORE backfill_reverse_holo_current_sets.sql (or re-run
-- that file afterwards) — otherwise these "ex" cards would wrongly
-- pick up a Reverse Holo row too, same mistake as #4 would have had.
--
-- Doesn't touch card_variants/prices, same as pitch_black_rarity_fix.sql
-- did — just the rarity tag. Safe to run more than once.

update cards
set rarity = 'double_rare'
from sets
where cards.set_id = sets.id
  and sets.slug = 'pitch-black'
  and cards.number = 31 -- Mega Slowbro ex, missed in the earlier fix
  and cards.rarity = 'common';

update cards
set rarity = 'double_rare'
from sets
where cards.set_id = sets.id
  and sets.slug in (
    'base-set',           -- Mega Evolution
    'perfect-order',
    'ascended-heroes',
    'chaos-rising',
    'destined-rivals',
    'phantasmal-flames',
    '30th-celebration'
  )
  and cards.rarity = 'common'
  and cards.name ~* ' ex$';
