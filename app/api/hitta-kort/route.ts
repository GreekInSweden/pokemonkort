import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { parseQuery, displayNumber } from "@/lib/findCards";
import { cardmarketLink, CardRef } from "@/lib/cardmarket";
import { hasGradedPrice, pricechartingLink } from "@/lib/pricecharting";

export const dynamic = "force-dynamic";

const LIMIT = 100;
const FETCH_LIMIT = 600;

// Publik sökning över alla Pokémon-kort (referensdata, inget privat).
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`hitta-kort:${ip}`, 40, 60))) {
    return NextResponse.json({ error: "För många sökningar, vänta en minut." }, { status: 429 });
  }

  const q = new URL(req.url).searchParams.get("q") ?? "";
  const parsed = parseQuery(q.slice(0, 80));
  if (parsed.words.length === 0 && parsed.number === null) {
    return NextResponse.json({ results: [], truncated: false });
  }
  // Bara ett nummer utan total/namn blir för brett.
  if (parsed.words.length === 0 && parsed.total === null) {
    return NextResponse.json({ results: [], truncated: false, hint: "number_needs_total" });
  }

  const sp = new URL(req.url).searchParams;
  const eraFilter = sp.get("era") ?? "";
  const rarityFilter = sp.get("rarity") ?? "";

  // Gemensamma sökvillkor (namn, nummer, total).
  function applyBase(query: any) {
    query = query.eq("sets.product_line", "pokemon");
    for (const w of parsed.words) {
      // Namn som Farfetch'd / N's Zorua skrivs ofta utan apostrof.
      if (w.length >= 3) {
        const alt = `${w.slice(0, -1)}'${w.slice(-1)}`;
        query = query.or(`name.ilike.%${w}%,name.ilike.%${alt}%`);
      } else {
        query = query.ilike("name", `%${w}%`);
      }
    }
    if (parsed.number !== null) query = query.eq("number", parsed.number);
    if (parsed.total !== null) query = query.eq("sets.printed_total", parsed.total);
    return query;
  }

  // Filtermenyer (eror/rariteter) räknas på ALLA träffar, inte bara de
  // första visade -- annars försvinner t.ex. "Other" när ett namn som
  // Pikachu har hundratals träffar.
  const { data: facetRows } = await applyBase(
    supabaseAdmin.from("cards").select("rarity, sets!inner(category_name, product_line)")
  ).limit(5000);
  const eraCount: Record<string, number> = {};
  const rarityCount: Record<string, number> = {};
  for (const r of (facetRows as any[]) ?? []) {
    const set = Array.isArray(r.sets) ? r.sets[0] : r.sets;
    eraCount[set.category_name] = (eraCount[set.category_name] ?? 0) + 1;
    rarityCount[r.rarity] = (rarityCount[r.rarity] ?? 0) + 1;
  }

  let query = applyBase(
    supabaseAdmin
      .from("cards")
      .select(
        "id, set_id, number, name, rarity, image_url, sets!inner(name, slug, category_name, printed_total, release_date, product_line)"
      )
  );
  if (eraFilter) query = query.eq("sets.category_name", eraFilter);
  if (rarityFilter) query = query.eq("rarity", rarityFilter);

  // Hämta fler än vi visar och rangordna själva -- annars hamnar träffarna
  // i databasens slumpmässiga ordning och kort kan försvinna när ett namn
  // har många träffar (t.ex. "Meowth" bland alla Alolan/Galarian/ex-kort).
  const { data, error } = await query.limit(FETCH_LIMIT);
  if (error) {
    return NextResponse.json({ error: "Sökningen misslyckades." }, { status: 500 });
  }
  const wanted = parsed.words.join(" ");
  const rank = (r: any) => {
    const n = String(r.name).toLowerCase().replace(/[’'´`.]/g, "");
    return n === wanted ? 0 : n.startsWith(wanted) ? 1 : 2;
  };
  const rows = ((data as any[]) ?? []).sort(
    (a, b) => rank(a) - rank(b) || String(a.name).length - String(b.name).length
  );
  const truncated = rows.length > LIMIT;
  const slice = rows.slice(0, LIMIT);

  // Syskonkort per set för Cardmarkets V-numrering.
  const siblingsBySet = new Map<string, CardRef[]>();
  const setIds = Array.from(new Set(slice.map((r) => r.set_id as string))).slice(0, 25);
  for (const id of setIds) {
    const { data: sib } = await supabaseAdmin
      .from("cards")
      .select("name, number, image_url, rarity")
      .eq("set_id", id);
    siblingsBySet.set(id, (sib as CardRef[]) ?? []);
  }

  const results = slice.map((r) => {
    const set = Array.isArray(r.sets) ? r.sets[0] : r.sets;
    const ref: CardRef = {
      name: r.name,
      number: r.number,
      image_url: r.image_url,
      rarity: r.rarity,
    };
    const cm = cardmarketLink(set.name, ref, siblingsBySet.get(r.set_id) ?? [ref]);
    return {
      id: r.id,
      name: r.name,
      rarity: r.rarity,
      image_url: r.image_url,
      numberText: displayNumber(r.number, r.image_url, set.printed_total ?? null),
      setName: set.name,
      setSlug: set.slug,
      era: set.category_name,
      releaseDate: set.release_date ?? null,
      cardmarketUrl: cm.url,
      pricechartingUrl: hasGradedPrice(r.rarity, set.name)
        ? pricechartingLink(set.name, { name: r.name, number: r.number }).url
        : null,
    };
  });

  // Nyast först, sedan namn.
  results.sort(
    (a, b) =>
      (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "") ||
      a.name.localeCompare(b.name)
  );

  return NextResponse.json({ results, truncated, eras: eraCount, rarities: rarityCount });
}
