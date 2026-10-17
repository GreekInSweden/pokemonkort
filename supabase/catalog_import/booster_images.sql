-- Kör i Supabase SQL Editor. Byter de ritade booster-bilderna mot riktiga
-- produktbilder för Mega Evolution, Chaos Rising, Pitch Black, Perfect
-- Order och Ascended Heroes. Rör varken pris eller lager. Säker att köra
-- flera gånger.

update products set image_url = '/products/chaos-rising-booster.jpg'     where slug = 'chaos-rising-booster';
update products set image_url = '/products/pitch-black-booster.jpg'      where slug = 'pitch-black-booster';
update products set image_url = '/products/ascended-heroes-booster.jpg'  where slug = 'ascended-heroes-booster';
update products set image_url = '/products/perfect-order-booster.jpg'    where slug = 'perfect-order-booster';
update products set image_url = '/products/mega-evolution-booster.jpg'   where slug = 'mega-evolution-booster';
