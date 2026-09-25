-- Höjer priset på befintliga Reverse Holo-kort från 2 kr till 4 kr.
--
-- Träffar bara rader som fortfarande står på just 2 kr -- så ett kort du
-- redan prissatt om för hand (till t.ex. 15 kr) rörs inte, bara de som
-- fortfarande har schablonpriset från backfill_reverse_holo_current_sets.sql
-- eller "+ Rev. Holo"-knappen i Master Set.
--
-- Safe to run more than once.

update card_variants
set price_sek = 4
where variant = 'reverse_holo'
  and price_sek = 2;
