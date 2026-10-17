-- Kör i Supabase SQL Editor. Skapar Butiken: sealed-produkter (boosters,
-- booster bundles, ETB, tins/boxar) som säljs istället för lösa kort ur
-- lagret. Säker att köra flera gånger. Inga exempelprodukter läggs in --
-- lägg upp dem själv i Admin -> Produkter.

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (
    category in ('booster', 'booster_bundle', 'etb', 'tin_box', 'other')
  ),
  set_name text,                       -- t.ex. "Pitch Black" (fritext)
  description text,
  price_sek numeric(10, 2) not null check (price_sek >= 0),
  stock integer not null default 0 check (stock >= 0),
  weight_g integer not null default 0 check (weight_g >= 0), -- för frakt
  image_url text,
  is_active boolean not null default true,  -- dold i butiken när false
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category);

alter table products enable row level security;

drop policy if exists "Public can read active products" on products;
create policy "Public can read active products" on products
  for select using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Admin can write products" on products;
create policy "Admin can write products" on products
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- På/av-flagga för hela butiken (AV från start = osynlig för besökare).
-- Samma inställningstabell som betalnivån använder; skapas här om den
-- inte redan finns.
create table if not exists site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;

drop policy if exists "Anyone can read site_settings" on site_settings;
create policy "Anyone can read site_settings" on site_settings
  for select using (true);

drop policy if exists "Admin can write site_settings" on site_settings;
create policy "Admin can write site_settings" on site_settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

insert into site_settings (key, value) values ('shop_enabled', 'false')
on conflict (key) do nothing;

-- Ordrar kan nu innehålla produkter (inte bara kortvarianter).
alter table order_items add column if not exists product_id uuid references products(id);
alter table order_items alter column card_variant_id drop not null;

notify pgrst, 'reload schema';
