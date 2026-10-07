-- Städar bort medlemsmarkeringar (har/vill ha/sälj/byte) på tryck som inte
-- finns -- t.ex. "Holo" på en common, eller "Vanligt" på ett rare-kort --
-- efter att fix_variants_real_prints.sql tagit bort de variantraderna.
--
-- Utan det här blir sådana markeringar osynliga i portföljen (rutan finns
-- inte längre) men fortsätter räknas i Mina matchningar, Mest
-- eftertraktade och Kortsök, och går inte att ta bort själv.
--
-- member_cards sparar variant som vanlig text (ingen främmande nyckel mot
-- card_variants), så det här är en ren städning -- inget annat påverkas.
--
-- Rör bara de 8 handseedade seten (samma lista som i
-- fix_variants_real_prints.sql). Parallels (Topps) berörs inte.
--
-- Kör fix_variants_real_prints.sql FÖRST. Säker att köra flera gånger.

delete from member_cards mc
using cards c, sets s
where mc.card_id = c.id
  and c.set_id = s.id
  and s.slug in (
    'base-set',
    'pitch-black',
    'perfect-order',
    'ascended-heroes',
    'chaos-rising',
    'destined-rivals',
    'phantasmal-flames',
    '30th-celebration'
  )
  and mc.parallel_tier_id is null
  and not exists (
    select 1
    from card_variants cv
    where cv.card_id = mc.card_id
      and cv.variant = mc.variant
  );
