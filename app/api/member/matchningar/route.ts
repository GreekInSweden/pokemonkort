import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";
import { cardmarketLink, CardRef } from "@/lib/cardmarket";

export const dynamic = "force-dynamic";

// Lists the logged-in member's own "vill ha" cards that at least one
// other member currently has. Deliberately anonymous at this stage —
// just the card and how many other members have it — nobody's identity
// or contact details are returned here. Use
// POST /api/member/matchningar/reveal to actually see who, one card at
// a time, once the member decides they want to reach out.
export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const { data: wants } = await supabaseAdmin
    .from("member_cards")
    .select(
      "card_id, variant, parallel_tier_id, cards(number, name, set_id, sets(name)), parallel_tiers(name)"
    )
    .eq("member_id", member.id)
    .eq("status", "want");

  if (!wants || wants.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  // Syskonkort per set (för Cardmarkets V1/V2-numrering), hämtas en gång per set.
  const siblingsBySet = new Map<string, CardRef[]>();
  async function siblingsFor(setId: string | undefined): Promise<CardRef[]> {
    if (!setId) return [];
    const cached = siblingsBySet.get(setId);
    if (cached) return cached;
    const { data } = await supabaseAdmin
      .from("cards")
      .select("name, number")
      .eq("set_id", setId);
    const list = ((data as CardRef[]) ?? []).map((c) => ({
      name: c.name,
      number: c.number,
    }));
    siblingsBySet.set(setId, list);
    return list;
  }

  const matches = [];
  for (const w of wants as any[]) {
    // Only count "have" rows the other member actually opted in to
    // selling or trading — someone just cataloguing their own collection
    // shouldn't show up as a match. A want for a specific Topps-parallel
    // (t.ex. "Gold Rainbow Foil /50") only matches a have of EXACTLY that
    // parallel — not the plain card, and not a different parallel.
    let havesQuery = supabaseAdmin
      .from("member_cards")
      .select("sellable, tradeable")
      .eq("card_id", w.card_id)
      .eq("variant", w.variant)
      .eq("status", "have")
      .or("sellable.eq.true,tradeable.eq.true")
      .neq("member_id", member.id);
    havesQuery = w.parallel_tier_id
      ? havesQuery.eq("parallel_tier_id", w.parallel_tier_id)
      : havesQuery.is("parallel_tier_id", null);
    const { data: haves } = await havesQuery;

    const matchCount = haves?.length ?? 0;
    if (matchCount > 0) {
      const cardName = w.cards?.name ?? "Okänt kort";
      const cardNumber = w.cards?.number ?? 0;
      const setName = w.cards?.sets?.name ?? "";
      const cm = w.cards
        ? cardmarketLink(
            setName,
            { name: cardName, number: cardNumber },
            await siblingsFor(w.cards.set_id),
            { reverseHolo: w.variant === "reverse_holo" }
          )
        : null;
      matches.push({
        cardmarketUrl: cm?.url ?? null,
        cardmarketListUrl: cm?.listUrl ?? null,
        cardId: w.card_id,
        cardNumber: w.cards?.number ?? 0,
        cardName: w.cards?.name ?? "Okänt kort",
        setName: w.cards?.sets?.name ?? "",
        variant: w.variant,
        parallelTierId: w.parallel_tier_id ?? null,
        parallelTierName: w.parallel_tiers?.name ?? null,
        matchCount,
        sellCount: haves!.filter((h: any) => h.sellable).length,
        tradeCount: haves!.filter((h: any) => h.tradeable).length,
      });
    }
  }

  return NextResponse.json({ matches });
}
