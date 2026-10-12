-- Kör i Supabase SQL Editor. Förbereder betalnivån (gratis: 3 set,
-- fri access: 19 kr/mån eller 199 kr/år). Allt är AVSTÄNGT tills du slår
-- på det i Admin -> Medlemskap, så sajten fungerar som förut tills dess.
-- Säker att köra flera gånger.

-- 1) Enkla inställningar (nyckel/värde). Flaggan är inte hemlig, så alla
--    får läsa den; bara inloggad admin får ändra.
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

insert into site_settings (key, value) values ('paywall_enabled', 'false')
on conflict (key) do nothing;

-- 2) "Betalt till" per medlem. Tomt = ingen betald access (gratisnivå).
alter table members add column if not exists paid_until timestamptz;

notify pgrst, 'reload schema';
