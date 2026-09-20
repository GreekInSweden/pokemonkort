import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Two ways to look a win up:
//   ?token=<bidder token>  — "does this browser have a pending win?" —
//     used by the storefront to decide whether to show the "you won!"
//     banner at all. Only ever returns a *pending* win, never someone
//     else's already-claimed one.
//   ?id=<win id>           — "show me this specific win" — used by the
//     claim page itself once the visitor has followed the banner's link,
//     so refreshing or reopening that link keeps working even after
//     they've submitted their details.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const id = req.nextUrl.searchParams.get("id");

  if (!token && !id) {
    return NextResponse.json({ error: "Ange token eller id." }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("auction_wins")
    .select(
      "id, status, amount_sek, claim_deadline, buyer_name, buyer_email, buyer_phone, auctions(front_image_url, back_image_url, card_variants(variant, cards(number, name, rarity)))"
    );

  query = id ? query.eq("id", id) : query.eq("bidder_token", token!).eq("status", "pending");

  const { data, error } = await query.limit(1).maybeSingle();

  if (error || !data) {
    return NextResponse.json({ win: null });
  }

  const auction = (data as any).auctions;
  const card = auction?.card_variants?.cards;

  return NextResponse.json({
    win: {
      winId: data.id,
      status: data.status,
      amountSek: Number(data.amount_sek),
      claimDeadline: data.claim_deadline,
      cardName: card?.name ?? "Okänt kort",
      cardNumber: card?.number ?? 0,
      variant: auction?.card_variants?.variant ?? "normal",
      rarity: card?.rarity ?? "common",
      imageUrl: auction?.front_image_url ?? null,
      backImageUrl: auction?.back_image_url ?? null,
      // Only handed back once the win has actually been claimed — no
      // point leaking a stranger's name/e-post/telefon from a bare id.
      buyerName: data.status !== "pending" ? data.buyer_name : null,
    },
  });
}
