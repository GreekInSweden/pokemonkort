-- Rättar vilka varianter (Vanligt / Holo / Reverse Holo) som erbjuds per
-- kort, så både medlemsportföljen och Master Set bara visar de tryck som
-- faktiskt finns -- ingen kan längre kryssa i något som inte existerar.
--
-- BAKGRUND
-- --------
-- De handseedade seten (Pitch Black m.fl.) fick ursprungligen "Vanligt" +
-- "Holo" på ALLA kort, och Reverse Holo lades bara till på 'common'
-- (backfill_reverse_holo_current_sets.sql). Det gav fel:
--   * ex-kort och alla högre rariteter (Illustration Rare, Ultra Rare,
--     Special Illustration Rare, Hyper Rare) har BARA ETT tryck, men
--     visade både Vanligt och Holo.
--   * 'common' visade ett "Holo"-alternativ som inte finns (en common
--     finns som Vanligt + Reverse Holo).
--   * 'rare' (t.ex. Pitch Black #12 Armarouge) visade "Vanligt" som inte
--     finns, och saknade Reverse Holo helt -- så kortet föll bort ur
--     Master Set tills man lade till det för hand.
--
-- DEL A -- alla 8 handseedade set: ex (double_rare) och uppåt får bara
--          sitt enda tryck ("Vanligt"). Holo/Reverse Holo-raderna tas bort.
-- DEL B -- bara Pitch Black (där rare-korten är rättade i
--          pitch_black_rarity_fix.sql): common = Vanligt + Reverse Holo,
--          rare = Holo + Reverse Holo.
--
-- De övriga sju seten (Mega Evolution-basen, Perfect Order, Ascended
-- Heroes, Chaos Rising, Destined Rivals, Phantasmal Flames, 30th
-- Celebration) rörs bara i del A. Deras rare-kort är fortfarande taggade
-- som 'common' i databasen, så de går inte att rätta automatiskt --
-- skicka mig kortnumren för deras rare-kort (som för Pitch Black) så
-- gör jag samma sak där.
--
-- SÄKERHET: en variantrad tas bara bort om den har stock = 0 OCH inte
-- används av någon beställning eller auktion. Rader som används (eller
-- har lagersaldo) lämnas orörda. Sista SELECT:en visar vilka som i så
-- fall är kvar. Kör gärna om filen -- den är säker att köra flera gånger.
--
-- Kör ev. cleanup_invalid_member_entries.sql EFTER den här filen, för att
-- städa bort medlemmars markeringar på tryck som inte finns.

-- ---------------------------------------------------------------------
-- DEL A: ex och högre rariteter -- bara ett tryck
-- ---------------------------------------------------------------------
delete from card_variants cv
using cards c, sets s
where cv.card_id = c.id
  and c.set_id = s.id
  and s.slug in (
    'base-set',          -- Mega Evolution (bas-settet)
    'pitch-black',
    'perfect-order',
    'ascended-heroes',
    'chaos-rising',
    'destined-rivals',
    'phantasmal-flames',
    '30th-celebration'
  )
  and c.rarity in (
    'double_rare', 'illustration_rare', 'ultra_rare',
    'special_illustration_rare', 'mega_hyper_rare'
  )
  and cv.variant in ('holo', 'reverse_holo')
  and cv.stock = 0
  and not exists (select 1 from order_items oi where oi.card_variant_id = cv.id)
  and not exists (select 1 from auctions a where a.card_variant_id = cv.id);

-- ---------------------------------------------------------------------
-- DEL B: Pitch Black -- common och rare
-- ---------------------------------------------------------------------

-- Rare-korten behöver sitt Reverse Holo-tryck (saknades), före vi tar
-- bort deras "Vanligt".
insert into card_variants (card_id, variant, price_sek, stock)
select c.id, 'reverse_holo', 4, 0
from cards c
join sets s on s.id = c.set_id
where s.slug = 'pitch-black'
  and c.rarity = 'rare'
on conflict (card_id, variant) do nothing;

-- Common: ingen Holo-variant finns.
delete from card_variants cv
using cards c, sets s
where cv.card_id = c.id
  and c.set_id = s.id
  and s.slug = 'pitch-black'
  and c.rarity = 'common'
  and cv.variant = 'holo'
  and cv.stock = 0
  and not exists (select 1 from order_items oi where oi.card_variant_id = cv.id)
  and not exists (select 1 from auctions a where a.card_variant_id = cv.id);

-- Rare: ingen vanlig (icke-holo) variant finns -- holo ÄR grundtrycket.
delete from card_variants cv
using cards c, sets s
where cv.card_id = c.id
  and c.set_id = s.id
  and s.slug = 'pitch-black'
  and c.rarity = 'rare'
  and cv.variant = 'normal'
  and cv.stock = 0
  and not exists (select 1 from order_items oi where oi.card_variant_id = cv.id)
  and not exists (select 1 from auctions a where a.card_variant_id = cv.id);

-- ---------------------------------------------------------------------
-- Kontroll: Pitch Black -- hur många kort av varje rarity har exakt
-- rätt uppsättning varianter? Förväntat:
--   common      -> normal + reverse_holo
--   rare        -> holo + reverse_holo
--   alla andra  -> bara normal
-- Kolumnen "avvikande" ska vara 0 för alla rader.
-- ---------------------------------------------------------------------
with per_card as (
  select
    c.id,
    c.number,
    c.rarity,
    string_agg(cv.variant, ' + ' order by cv.variant) as have
  from cards c
  join sets s on s.id = c.set_id
  left join card_variants cv on cv.card_id = c.id
  where s.slug = 'pitch-black'
  group by c.id, c.number, c.rarity
)
select
  rarity,
  count(*) as antal_kort,
  count(*) filter (
    where have is distinct from case
      when rarity = 'common' then 'normal + reverse_holo'
      when rarity = 'rare' then 'holo + reverse_holo'
      else 'normal'
    end
  ) as avvikande
from per_card
group by rarity
order by rarity;
