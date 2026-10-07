-- Kör i Supabase SQL Editor efter auctions.sql / auction_wins.sql.
--
-- Två nya tabeller:
--
-- 1) auction_max_bids -- varje medlems DOLDA maxbud per auktion. Köparen
--    anger sitt högsta pris; sidan bjuder automatiskt åt hen, ett steg i
--    taget (auktionens min_increment_sek), tills någon går förbi maxbudet.
--    De automatiska buden sparas som vanliga rader i "bids", så
--    budhistorik, "leder" och vinstberäkning fungerar precis som förut.
--    Maxbudet själv exponeras aldrig för andra -- bara via service-role
--    i API-routen, ingen policy för webbläsaren.
--
-- 2) member_notifications -- korta systembesked till en medlem (just nu:
--    "du har blivit överbjuden"). Egen tabell eftersom member_messages
--    kräver en avsändare och ett kort-sammanhang. Visas överst i
--    Meddelanden och räknas in i samma olästa-siffra i menyn.
--
-- Säker att köra flera gånger.

create table if not exists auction_max_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references auctions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  max_amount_sek numeric(10, 2) not null check (max_amount_sek > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auction_id, member_id)
);

create index if not exists idx_auction_max_bids_auction on auction_max_bids(auction_id);

alter table auction_max_bids enable row level security;
-- Medvetet ingen policy alls: maxbud ska inte kunna läsas av någon
-- webbläsare, inte ens admin-inloggningen. Allt går via service-role.

create table if not exists member_notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  auction_id uuid references auctions(id) on delete cascade,
  kind text not null default 'outbid',
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_member_notifications_member
  on member_notifications(member_id, created_at desc);

alter table member_notifications enable row level security;
-- Ingen policy för webbläsaren -- läses/skrivs via API-routerna.

notify pgrst, 'reload schema';
