import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data: auctions, error } = await supabaseAdmin
    .from("auctions")
    .select(
      "id, starting_price_sek, min_increment_sek, ends_at, status, card_variants(id, variant, card_id, cards(number, name, rarity, image_url))"
    )
    .order("ends_at", { ascending: true });

  if (error || !auctions) {
    return NextResponse.json({ error: "Kunde inte hämta auktioner." }, { status: 500 });
  }

  const results = [];
  for (const a of auctions as any[]) {
    if (a.status !== "open") continue;

    const { data: bids } = await supabaseAdmin
      .from("bids")
      .select("amount_sek")
      .eq("auction_id", a.id)
      .order("amount_sek", { ascending: false })
      .limit(1);

    const { count } = await supabaseAdmin
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("auction_id", a.id);

    const highest = bids && bids.length > 0 ? Number(bids[0].amount_sek) : null;
    const card = a.card_variants?.cards;

    results.push({
      auctionId: a.id,
      cardName: card?.name ?? "Okänt kort",
      cardNumber: card?.number ?? 0,
      variant: a.card_variants?.variant ?? "normal",
      rarity: card?.rarity ?? "common",
      imageUrl: card?.image_url ?? null,
      startingPriceSek: Number(a.starting_price_sek),
      minIncrementSek: Number(a.min_increment_sek),
      currentHighSek: highest ?? Number(a.starting_price_sek),
      bidCount: count ?? 0,
      endsAt: a.ends_at,
      status: a.status,
    });
  }

  return NextResponse.json({ auctions: results });
}
