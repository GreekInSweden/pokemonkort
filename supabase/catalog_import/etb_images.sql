-- Kör i Supabase SQL Editor efter seed_products.sql. Byter de ritade
-- ETB-bilderna mot riktiga produktbilder (Mega Evolution, Chaos Rising,
-- Pitch Black, Perfect Order) och lägger till Mega Evolution-ETB:n i
-- andra motivet (Lucario). Rör varken pris eller lager. Säker att köra
-- flera gånger.

update products set image_url = '/products/chaos-rising-etb.jpg'  where slug = 'chaos-rising-etb';
update products set image_url = '/products/pitch-black-etb.jpg'   where slug = 'pitch-black-etb';
update products set image_url = '/products/perfect-order-etb.jpg' where slug = 'perfect-order-etb';
update products set image_url = '/products/mega-evolution-etb.jpg',
                    name = 'Mega Evolution Elite Trainer Box (Mega Gardevoir)'
  where slug = 'mega-evolution-etb';

insert into products (slug, name, category, set_name, price_sek, stock, weight_g, image_url, sort_order)
values ('mega-evolution-etb-lucario', 'Mega Evolution Elite Trainer Box (Mega Lucario)', 'etb', 'Mega Evolution', 549, 0, 650, '/products/mega-evolution-etb-lucario.jpg', 31)
on conflict (slug) do nothing;
