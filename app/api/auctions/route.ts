import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CLAIM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 1 week to claim a win

// Auctions close themselves the moment someone loads this route after
// their end time has passed — there's no cron job in this project, so
// this is the one place guaranteed to run often (the storefront polls it
// every 20s). For each newly-expired auction: work out the winning bid,
// and if the reserve (if any) was met, create the "outbox" entry that
// lets that member recognize (next time they're logged in) that they
// won and claim it. Auctions with no bids, or that missed reserve, are
// just closed with no winner.
async function closeExpiredAuctions() {
  const { data: expired } = await supabaseAdmin
    .from("auctions")
    .select("id, starting_price_sek, reserve_price_sek")
    .eq("status", "open")
    .lt("ends_at", new Date().toISOString());

  for (const a of expired ?? []) {
    const { data: topBid } = await supabaseAdmin
      .from("bids")
      .select("amount_sek, member_id")
      .eq("auction_id", a.id)
      .order("amount_sek", { ascending: false })
      // Vid lika belopp (maxbud som slår exakt lika) leder den senast
      // lagda raden -- se /api/bid.
      .order("created_at", { ascending: false })
      .limit(1);

    const reservePrice =
      a.reserve_price_sek !== null ? Number(a.reserve_price_sek) : null;

    if (topBid && topBid.length > 0 && topBid[0].member_id) {
      const amount = Number(topBid[0].amount_sek);
      const reserveMet = reservePrice === null || amount >= reservePrice;
      if (reserveMet) {
        // onConflict on the unique auction_id index — never create a
        // second win row for the same auction if this races itself.
        await supabaseAdmin.from("auction_wins").upsert(
          {
            auction_id: a.id,
            member_id: topBid[0].member_id,
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

  // Vem tittar? Används bara för att markera "Du leder" / "Du har blivit
  // överbjuden" på just den här besökarens auktioner -- aldrig för att
  // exponera något om andra. Utloggad = ingen markering.
  let viewerId: string | null = null;
  try {
    viewerId = (await getCurrentMember())?.id ?? null;
  } catch {
    viewerId = null;
  }

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

    // Member number + their own chosen username only — never anything
    // else about a bidder — so the public listing can show "vem som
    // leder" without exposing any real identity or contact details.
    const { data: bidRows } = await supabaseAdmin
      .from("bids")
      .select("amount_sek, created_at, member_id, members(member_number, username)")
      .eq("auction_id", a.id)
      .order("amount_sek", { ascending: false })
      .order("created_at", { ascending: false });

    const bidHistory = (bidRows ?? []).map((b: any) => ({
      memberNumber: b.members?.member_number ?? null,
      username: b.members?.username ?? null,
      amountSek: Number(b.amount_sek),
    }));

    // Besökarens egen status på den här auktionen: leder, har blivit
    // överbjuden (har lagt bud men leder inte), eller ingenting.
    let viewerStatus: "leading" | "outbid" | "none" = "none";
    let viewerMaxSek: number | null = null;
    if (viewerId) {
      const leaderId = (bidRows ?? [])[0]?.member_id ?? null;
      const hasBid = (bidRows ?? []).some((b: any) => b.member_id === viewerId);
      if (leaderId === viewerId) viewerStatus = "leading";
      else if (hasBid) viewerStatus = "outbid";

      // Det egna dolda maxbudet visas bara för medlemmen själv, och bara
      // medan hen leder (då är det relevant att kunna höja det).
      if (viewerStatus === "leading") {
        const { data: myMax } = await supabaseAdmin
          .from("auction_max_bids")
          .select("max_amount_sek")
          .eq("auction_id", a.id)
          .eq("member_id", viewerId)
          .maybeSingle();
        viewerMaxSek = myMax ? Number(myMax.max_amount_sek) : null;
      }
    }

    const card = a.card_variants?.cards;
    const reservePrice = a.reserve_price_sek !== null ? Number(a.reserve_price_sek) : null;
    const currentHighSek = bidHistory.length > 0 ? bidHistory[0].amountSek : Number(a.starting_price_sek);

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
      bidCount: bidHistory.length,
      bidHistory,
      leadingMemberNumber: bidHistory[0]?.memberNumber ?? null,
      leadingUsername: bidHistory[0]?.username ?? null,
      endsAt: a.ends_at,
      status: a.status,
      // Never send the actual reserve_price_sek to the client — only
      // whether it's been reached, so the number itself stays private.
      reserveMet: reservePrice === null || currentHighSek >= reservePrice,
      viewerStatus,
      viewerMaxSek,
    });
  }

  return NextResponse.json({ auctions: results });
}
