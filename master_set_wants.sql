-- Run this in the Supabase SQL editor after master_set.sql (and
-- master_set_progress_parallel.sql, if you've run that too).
--
-- "VILL HA" -- ett eget önskelisteläge för Master Set-checklistan,
-- helt separat från master_set_progress (som bara betyder "jag äger
-- det här"). En rad här betyder "jag letar aktivt efter det här
-- kortet/varianten till min samling" -- rent för egen bokföring, ingen
-- koppling till medlemmarnas portfölj/matchning-system.
--
-- Samma modell som master_set_progress: card_id + variant, en rad per
-- sak du vill ha. Ingen parallel_tier_id här -- önskelistan gäller
-- grundvarianten (normal/holo/reverse holo), inte enskilda
-- parallel-färger.
--
-- Safe to run more than once.

create table if not exists master_set_wants (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  variant text not null check (variant in ('normal', 'holo', 'reverse_holo')),
  wanted_at timestamptz not null default now(),
  unique (card_id, variant)
);

create index if not exists idx_master_set_wants_card_id on master_set_wants(card_id);

alter table master_set_wants enable row level security;

-- Admin-only, samma mönster som master_set_progress.
create policy "Authenticated can read master set wants"
  on master_set_wants for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can insert master set wants"
  on master_set_wants for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can delete master set wants"
  on master_set_wants for delete
  using (auth.role() = 'authenticated');
