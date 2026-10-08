-- Adds the parallel-tier dimension to member_cards (have/want), on top
-- of parallel_tiers.sql. NULL parallel_tier_id means "the plain/standard
-- card, no parallel" -- exactly what every existing row already means,
-- so nothing breaks for Pokémon members or anyone who's already used the
-- portfolio before this migration.
--
-- RUN parallel_tiers.sql FIRST -- this file's parallel_tier_id column
-- references that table, so it will fail if parallel_tiers doesn't
-- exist yet.
--
-- Safe to run more than once.

alter table member_cards
  add column if not exists parallel_tier_id uuid references parallel_tiers(id) on delete cascade;

-- The old unique constraint (member_id, card_id, variant, status) gets
-- parallel_tier_id appended. Note: Postgres treats every NULL as distinct
-- from every other NULL in a unique constraint, so this does NOT by
-- itself stop a member from getting two "standard card, no parallel" rows
-- for the same card+status (both parallel_tier_id = NULL, so the
-- constraint doesn't see them as conflicting). The API route
-- (app/api/member/portfolio/route.ts) handles that case explicitly with a
-- select-then-insert/update instead of a plain upsert. This constraint
-- still does its job for every row that DOES have a specific parallel —
-- the common case.
alter table member_cards drop constraint if exists member_cards_member_id_card_id_variant_status_key;

alter table member_cards
  add constraint member_cards_unique_key unique (member_id, card_id, variant, status, parallel_tier_id);

create index if not exists idx_member_cards_parallel_tier on member_cards(parallel_tier_id);
