import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CLAIM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 1 week to claim a win

// Auctions close themselves the moment someone loads this route after
// their end time has passed — there's no cron job in this project, so
// this is the one place guaranteed to run often (the storefront polls it
// every 20s). For each newly-expired auction: work out the winning bid,
// and if the reserve (if any) was met, create the "outbox" entry that
// lets that bidder's browser recognize it won and claim it. Auctions
// with no bids, or that missed reserve, are just closed with no winner.
async function closeExpiredAuctions() {
  const { data: expired } = await supabaseAdmin
    .from("auctions")
    .select("id, starting_price_sek, reserve_price_sek")
    .eq("status", "open")
    .lt("ends_at", new Date().toISOString());

  for (const a of expired ?? []) {
    const { data: topBid } = await supabaseAdmin
      .from("bids")
      .select("amount_sek, bidder_token")
      .eq("auction_id", a.id)
      .order("amount_sek", { ascending: false })
      .limit(1);

    const reservePrice =
      a.reserve_price_sek !== null ? Number(a.reserve_price_sek) : null;

    if (topBid && topBid.length > 0 && topBid[0].bidder_token) {
      const amount = Number(topBid[0].amount_sek);
      const reserveMet = reservePrice === null || amount >= reservePrice;
      if (reserveMet) {
        // onConflict on the unique auction_id index — never create a
        // second win row for the same auction if this races itself.
        await supabaseAdmin.from("auction_wins").upsert(
          {
            auction_id: a.id,
            bidder_token: topBid[0].bidder_token,
            amount_sek: amount,
            status: "pending",
            claim_deadline: new Date(Date.now() + CLAIM_WINDOW_MS).toISOString(),
          },
          { onConflict: "auction_id", ignoreDuplicates: true }
        );
      }
    }

    await supabaseAdmin.from("auctions").update({ status: "closed" }).eq("id", a.id);
  }

  // Wins nobody came back to claim in time — leave them as 'expired' so
  // the admin auctions page shows clearly that the card is free to
  // re-list, rather than looking like it's still waiting on someone.
  await supabaseAdmin
    .from("auction_wins")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("claim_deadline", new Date().toISOString());
}

export async function GET() {
  await closeExpiredAuctions();

  const { data: auctions, error } = await supabaseAdmin
    .from("auctions")
    .select(
      "id, starting_price_sek, min_increment_sek, reserve_price_sek, ends_at, status, front_image_url, back_image_url, card_variants(id, variant, card_id, cards(number, name, rarity, image_url))"
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
    const reservePrice = a.reserve_price_sek !== null ? Number(a.reserve_price_sek) : null;
    const currentHighSek = highest ?? Number(a.starting_price_sek);

    results.push({
      auctionId: a.id,
      cardName: card?.name ?? "Okänt kort",
      cardNumber: card?.number ?? 0,
      variant: a.card_variants?.variant ?? "normal",
      rarity: card?.rarity ?? "common",
      // Deliberately NOT falling back to the card's regular shop image —
      // an auction sells one specific physical copy, and showing the
      // generic stock photo would misrepresent its actual condition.
      imageUrl: a.front_image_url ?? null,
      backImageUrl: a.back_image_url ?? null,
      startingPriceSek: Number(a.starting_price_sek),
      minIncrementSek: Number(a.min_increment_sek),
      currentHighSek,
      bidCount: count ?? 0,
      endsAt: a.ends_at,
      status: a.status,
      // Never send the actual reserve_price_sek to the client — only
      // whether it's been reached, so the number itself stays private.
      reserveMet: reservePrice === null || currentHighSek >= reservePrice,
    });
  }

  return NextResponse.json({ auctions: results });
}
