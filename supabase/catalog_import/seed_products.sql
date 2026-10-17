-- Kör i Supabase SQL Editor (efter products.sql). Lägger in 21 färdiga
-- produkter (7 set x booster / booster bundle / ETB) med bild, vikt och ett
-- STARTPRIS. Allt har lager 0 och syns därför inte i butiken förrän du
-- fyller i antal under Admin -> Produkter. Säker att köra flera gånger:
-- redan inlagda produkter (och dina egna priser/lager) rörs inte.
--
-- OBS: priserna nedan är platshållare -- kontrollera dem innan du fyller i lager.

alter table products add column if not exists slug text;
create unique index if not exists products_slug_key on products(slug);

insert into products (slug, name, category, set_name, price_sek, stock, weight_g, image_url, sort_order)
values
  ('mega-evolution-booster', 'Mega Evolution Booster', 'booster', 'Mega Evolution', 59, 0, 15, '/products/mega-evolution-booster.svg', 10),
  ('mega-evolution-booster-bundle', 'Mega Evolution Booster Bundle', 'booster_bundle', 'Mega Evolution', 329, 0, 200, '/products/mega-evolution-booster-bundle.svg', 20),
  ('mega-evolution-etb', 'Mega Evolution Elite Trainer Box', 'etb', 'Mega Evolution', 549, 0, 650, '/products/mega-evolution-etb.svg', 30),
  ('phantasmal-flames-booster', 'Phantasmal Flames Booster', 'booster', 'Phantasmal Flames', 59, 0, 15, '/products/phantasmal-flames-booster.svg', 40),
  ('phantasmal-flames-booster-bundle', 'Phantasmal Flames Booster Bundle', 'booster_bundle', 'Phantasmal Flames', 329, 0, 200, '/products/phantasmal-flames-booster-bundle.svg', 50),
  ('phantasmal-flames-etb', 'Phantasmal Flames Elite Trainer Box', 'etb', 'Phantasmal Flames', 549, 0, 650, '/products/phantasmal-flames-etb.svg', 60),
  ('ascended-heroes-booster', 'Ascended Heroes Booster', 'booster', 'Ascended Heroes', 59, 0, 15, '/products/ascended-heroes-booster.svg', 70),
  ('ascended-heroes-booster-bundle', 'Ascended Heroes Booster Bundle', 'booster_bundle', 'Ascended Heroes', 329, 0, 200, '/products/ascended-heroes-booster-bundle.svg', 80),
  ('ascended-heroes-etb', 'Ascended Heroes Elite Trainer Box', 'etb', 'Ascended Heroes', 549, 0, 650, '/products/ascended-heroes-etb.svg', 90),
  ('perfect-order-booster', 'Perfect Order Booster', 'booster', 'Perfect Order', 59, 0, 15, '/products/perfect-order-booster.svg', 100),
  ('perfect-order-booster-bundle', 'Perfect Order Booster Bundle', 'booster_bundle', 'Perfect Order', 329, 0, 200, '/products/perfect-order-booster-bundle.svg', 110),
  ('perfect-order-etb', 'Perfect Order Elite Trainer Box', 'etb', 'Perfect Order', 549, 0, 650, '/products/perfect-order-etb.svg', 120),
  ('chaos-rising-booster', 'Chaos Rising Booster', 'booster', 'Chaos Rising', 59, 0, 15, '/products/chaos-rising-booster.svg', 130),
  ('chaos-rising-booster-bundle', 'Chaos Rising Booster Bundle', 'booster_bundle', 'Chaos Rising', 329, 0, 200, '/products/chaos-rising-booster-bundle.svg', 140),
  ('chaos-rising-etb', 'Chaos Rising Elite Trainer Box', 'etb', 'Chaos Rising', 549, 0, 650, '/products/chaos-rising-etb.svg', 150),
  ('pitch-black-booster', 'Pitch Black Booster', 'booster', 'Pitch Black', 59, 0, 15, '/products/pitch-black-booster.svg', 160),
  ('pitch-black-booster-bundle', 'Pitch Black Booster Bundle', 'booster_bundle', 'Pitch Black', 329, 0, 200, '/products/pitch-black-booster-bundle.svg', 170),
  ('pitch-black-etb', 'Pitch Black Elite Trainer Box', 'etb', 'Pitch Black', 549, 0, 650, '/products/pitch-black-etb.svg', 180),
  ('30th-celebration-booster', '30th Celebration Booster', 'booster', '30th Celebration', 59, 0, 15, '/products/30th-celebration-booster.svg', 190),
  ('30th-celebration-booster-bundle', '30th Celebration Booster Bundle', 'booster_bundle', '30th Celebration', 329, 0, 200, '/products/30th-celebration-booster-bundle.svg', 200),
  ('30th-celebration-etb', '30th Celebration Elite Trainer Box', 'etb', '30th Celebration', 549, 0, 650, '/products/30th-celebration-etb.svg', 210)
on conflict (slug) do nothing;
