import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { auctionId, bidderName, email, phone, amountSek } = body as {
    auctionId: string;
    bidderName: string;
    email: string;
    phone: string;
    amountSek: number;
  };

  if (!auctionId || !bidderName || !email || !phone || !amountSek) {
    return NextResponse.json({ error: "Fyll i alla fält." }, { status: 400 });
  }

  const { data: auction, error: auctionError } = await supabaseAdmin
    .from("auctions")
    .select("id, starting_price_sek, min_increment_sek, ends_at, status")
    .eq("id", auctionId)
    .single();

  if (auctionError || !auction) {
    return NextResponse.json({ error: "Auktionen hittades inte." }, { status: 404 });
  }
  if (auction.status !== "open" || new Date(auction.ends_at) < new Date()) {
    return NextResponse.json({ error: "Auktionen är avslutad." }, { status: 409 });
  }

  const { data: topBid } = await supabaseAdmin
    .from("bids")
    .select("amount_sek")
    .eq("auction_id", auctionId)
    .order("amount_sek", { ascending: false })
    .limit(1);

  const currentHigh =
    topBid && topBid.length > 0
      ? Number(topBid[0].amount_sek)
      : Number(auction.starting_price_sek) - Number(auction.min_increment_sek);
  const minRequired = currentHigh + Number(auction.min_increment_sek);

  if (amountSek < minRequired) {
    return NextResponse.json(
      { error: `Budet måste vara minst ${minRequired} kr.` },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabaseAdmin.from("bids").insert({
    auction_id: auctionId,
    bidder_name: bidderName,
    email,
    phone,
    amount_sek: amountSek,
  });

  if (insertError) {
    return NextResponse.json({ error: "Kunde inte spara budet." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, amountSek });
}
