-- Kör i Supabase SQL Editor efter master_set_duplicates.sql (kräver
-- att admin_settings.duplicate_seller_username redan är sparat via
-- Master Set-sidans "Dubbletter till salu"-ruta -- annars hittas inget
-- säljkonto och inget läggs in).
--
-- Bulk-import av Christos dubbletter för Topps Premier League 2026/27
-- (byteslista Topps_PL_26-27_Byteslista.xlsx, mottagen 2026-09-27):
--   * 175 kort från Grundsettet (Base + Future Stars)
--   * 43 kort fördelat på Nitro Boost, Stars of the PL,
--     Flying The Flag, Beast Mode, Retro Threads och Chrome Classics
-- = 218 rader totalt.
--
-- Enkel flagga, inte exakt antal (samma modell som Master Set-knappen) --
-- "Antal dubbletter"-kolumnen i excelfilen används inte här, bara vilka
-- kort som förekommer. Alla läggs upp som BÅDE säljbara och bytbara
-- (bekräftat i chatten). Alla kort i det här setet finns bara i variant
-- 'normal' (Topps fotbollskort har ingen holo-variant).
--
-- Säkert att köra flera gånger -- NOT EXISTS-villkoret hoppar över rader
-- som redan lagts in.

do $$
begin
  if not exists (
    select 1
    from admin_settings s
    join members m on lower(m.username) = lower(s.value)
    where s.key = 'duplicate_seller_username'
  ) then
    raise exception 'Inget säljkonto konfigurerat än -- spara användarnamnet i Master Set-sidans "Dubbletter till salu"-ruta först, kör sedan om den här filen.';
  end if;
end $$;

with seller as (
  select m.id as member_id
  from admin_settings s
  join members m on lower(m.username) = lower(s.value)
  where s.key = 'duplicate_seller_username'
),
targets(set_slug, card_number) as (
  values
    ('grundset', 1),
    ('grundset', 2),
    ('grundset', 3),
    ('grundset', 6),
    ('grundset', 10),
    ('grundset', 13),
    ('grundset', 16),
    ('grundset', 17),
    ('grundset', 18),
    ('grundset', 23),
    ('grundset', 24),
    ('grundset', 25),
    ('grundset', 26),
    ('grundset', 27),
    ('grundset', 28),
    ('grundset', 29),
    ('grundset', 31),
    ('grundset', 32),
    ('grundset', 33),
    ('grundset', 34),
    ('grundset', 35),
    ('grundset', 37),
    ('grundset', 38),
    ('grundset', 42),
    ('grundset', 43),
    ('grundset', 44),
    ('grundset', 46),
    ('grundset', 48),
    ('grundset', 49),
    ('grundset', 51),
    ('grundset', 52),
    ('grundset', 54),
    ('grundset', 55),
    ('grundset', 56),
    ('grundset', 58),
    ('grundset', 60),
    ('grundset', 61),
    ('grundset', 63),
    ('grundset', 64),
    ('grundset', 67),
    ('grundset', 69),
    ('grundset', 70),
    ('grundset', 71),
    ('grundset', 72),
    ('grundset', 73),
    ('grundset', 74),
    ('grundset', 75),
    ('grundset', 78),
    ('grundset', 82),
    ('grundset', 85),
    ('grundset', 86),
    ('grundset', 87),
    ('grundset', 88),
    ('grundset', 89),
    ('grundset', 91),
    ('grundset', 92),
    ('grundset', 93),
    ('grundset', 95),
    ('grundset', 96),
    ('grundset', 99),
    ('grundset', 100),
    ('grundset', 101),
    ('grundset', 102),
    ('grundset', 104),
    ('grundset', 110),
    ('grundset', 112),
    ('grundset', 113),
    ('grundset', 115),
    ('grundset', 116),
    ('grundset', 117),
    ('grundset', 119),
    ('grundset', 123),
    ('grundset', 124),
    ('grundset', 125),
    ('grundset', 127),
    ('grundset', 129),
    ('grundset', 130),
    ('grundset', 131),
    ('grundset', 133),
    ('grundset', 134),
    ('grundset', 135),
    ('grundset', 136),
    ('grundset', 138),
    ('grundset', 141),
    ('grundset', 142),
    ('grundset', 143),
    ('grundset', 144),
    ('grundset', 146),
    ('grundset', 150),
    ('grundset', 152),
    ('grundset', 153),
    ('grundset', 154),
    ('grundset', 156),
    ('grundset', 157),
    ('grundset', 159),
    ('grundset', 161),
    ('grundset', 162),
    ('grundset', 164),
    ('grundset', 167),
    ('grundset', 168),
    ('grundset', 170),
    ('grundset', 172),
    ('grundset', 173),
    ('grundset', 174),
    ('grundset', 176),
    ('grundset', 178),
    ('grundset', 180),
    ('grundset', 181),
    ('grundset', 186),
    ('grundset', 187),
    ('grundset', 188),
    ('grundset', 194),
    ('grundset', 196),
    ('grundset', 197),
    ('grundset', 199),
    ('grundset', 203),
    ('grundset', 204),
    ('grundset', 208),
    ('grundset', 209),
    ('grundset', 210),
    ('grundset', 212),
    ('grundset', 213),
    ('grundset', 214),
    ('grundset', 217),
    ('grundset', 218),
    ('grundset', 219),
    ('grundset', 220),
    ('grundset', 222),
    ('grundset', 225),
    ('grundset', 228),
    ('grundset', 230),
    ('grundset', 231),
    ('grundset', 234),
    ('grundset', 235),
    ('grundset', 238),
    ('grundset', 240),
    ('grundset', 241),
    ('grundset', 243),
    ('grundset', 247),
    ('grundset', 248),
    ('grundset', 249),
    ('grundset', 250),
    ('grundset', 251),
    ('grundset', 252),
    ('grundset', 253),
    ('grundset', 254),
    ('grundset', 255),
    ('grundset', 258),
    ('grundset', 260),
    ('grundset', 261),
    ('grundset', 262),
    ('grundset', 264),
    ('grundset', 265),
    ('grundset', 266),
    ('grundset', 267),
    ('grundset', 268),
    ('grundset', 270),
    ('grundset', 271),
    ('grundset', 273),
    ('grundset', 274),
    ('grundset', 275),
    ('grundset', 276),
    ('grundset', 277),
    ('grundset', 278),
    ('grundset', 280),
    ('grundset', 281),
    ('grundset', 282),
    ('grundset', 284),
    ('grundset', 285),
    ('grundset', 287),
    ('grundset', 289),
    ('grundset', 294),
    ('grundset', 295),
    ('grundset', 299),
    ('grundset', 300),
    ('nitro-boost', 1),
    ('nitro-boost', 6),
    ('nitro-boost', 11),
    ('nitro-boost', 12),
    ('nitro-boost', 13),
    ('nitro-boost', 15),
    ('nitro-boost', 21),
    ('nitro-boost', 23),
    ('nitro-boost', 25),
    ('stars-of-the-pl', 4),
    ('stars-of-the-pl', 5),
    ('stars-of-the-pl', 6),
    ('stars-of-the-pl', 10),
    ('stars-of-the-pl', 15),
    ('stars-of-the-pl', 17),
    ('stars-of-the-pl', 20),
    ('stars-of-the-pl', 21),
    ('stars-of-the-pl', 23),
    ('flying-the-flag', 1),
    ('flying-the-flag', 8),
    ('flying-the-flag', 9),
    ('flying-the-flag', 12),
    ('flying-the-flag', 13),
    ('flying-the-flag', 16),
    ('flying-the-flag', 17),
    ('flying-the-flag', 18),
    ('flying-the-flag', 20),
    ('flying-the-flag', 22),
    ('flying-the-flag', 25),
    ('beast-mode', 2),
    ('beast-mode', 4),
    ('beast-mode', 9),
    ('beast-mode', 10),
    ('beast-mode', 12),
    ('beast-mode', 14),
    ('beast-mode', 16),
    ('beast-mode', 17),
    ('beast-mode', 19),
    ('beast-mode', 20),
    ('beast-mode', 21),
    ('beast-mode', 22),
    ('retro-threads', 8),
    ('chrome-classics', 14)
)
insert into member_cards (member_id, card_id, variant, status, quantity, sellable, tradeable)
select seller.member_id, c.id, 'normal', 'have', 1, true, true
from targets
join sets st on st.slug = targets.set_slug
join cards c on c.set_id = st.id and c.number = targets.card_number
cross join seller
where not exists (
  select 1 from member_cards mc
  where mc.member_id = seller.member_id
    and mc.card_id = c.id
    and mc.variant = 'normal'
    and mc.status = 'have'
    and mc.parallel_tier_id is null
);
