-- Run this in the Supabase SQL editor after master_set_wants.sql and
-- parallel_tiers.sql.
--
-- Lägger till samma parallel-dimension på önskelistan som redan finns på
-- ägande (master_set_progress_parallel.sql): nu går det att önska en
-- SPECIFIK parallel-färg av ett kort (t.ex. "PL Parallel (1:4)"), inte
-- bara grundvarianten. NULL parallel_tier_id (allt som redan finns)
-- betyder precis som innan "grundvarianten (normal/holo/reverse holo)",
-- så inget befintligt beteende ändras.
--
-- Safe to run more than once.

alter table master_set_wants
  add column if not exists parallel_tier_id uuid references parallel_tiers(id) on delete cascade;

alter table master_set_wants drop constraint if exists master_set_wants_card_id_variant_key;

alter table master_set_wants
  add constraint master_set_wants_unique_key unique (card_id, variant, parallel_tier_id);

create index if not exists idx_master_set_wants_parallel_tier on master_set_wants(parallel_tier_id);
