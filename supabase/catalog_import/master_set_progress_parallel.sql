-- Lets Master Set track WHICH Topps-parallels of a card you personally
-- own, on top of the existing required checklist (base + reverse holo).
--
-- Parallels are deliberately NOT part of the 100%-total: for Grundsettet
-- ensamt finns ~39 parallels per kort, så att kräva "varje kort i varje
-- färg" för 100% hade gjort målet i praktiken omöjligt och tömt "100%"
-- på mening. Istället är parallel_tier_id en extra, valfri rad per kort
-- -- en bonus-logg av vilka färger du råkar äga, som inte räknas i
-- masterTotal/masterOwned. NULL (det normala fallet, och allt som redan
-- finns) betyder "det vanliga/kravsatta kortet", precis som innan.
--
-- RUN parallel_tiers.sql FIRST -- parallel_tier_id references that table.
--
-- Safe to run more than once.

alter table master_set_progress
  add column if not exists parallel_tier_id uuid references parallel_tiers(id) on delete cascade;

alter table master_set_progress drop constraint if exists master_set_progress_card_id_variant_key;

alter table master_set_progress
  add constraint master_set_progress_unique_key unique (card_id, variant, parallel_tier_id);

create index if not exists idx_master_set_progress_parallel_tier on master_set_progress(parallel_tier_id);
