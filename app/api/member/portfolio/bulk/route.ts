import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";
import { getMembershipState, canUseSet } from "@/lib/membership";
import { evaluateMasterSets } from "@/lib/masterSets";

export const dynamic = "force-dynamic";

// Massåtgärd för ett helt set i portföljen:
//   have_all   -> "Har" på alla riktiga varianter (de som finns i
//                 card_variants), och "Vill ha" tas bort på samma varianter
//                 -- man kan inte både ha och vilja ha samma kort.
//                 Redan markerade kort rörs inte (Sälja/Byta bevaras).
//   clear_have -> tar bort alla "Har" (standardkort, utan parallel).
// Bara standardkort utan parallel berörs.
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const { cardIds, action } = (await req.json()) as {
    cardIds: string[];
    action: "have_all" | "clear_have";
  };

  if (
    !Array.isArray(cardIds) ||
    cardIds.length === 0 ||
    cardIds.length > 1000 ||
    !cardIds.every((c) => typeof c === "string") ||
    (action !== "have_all" && action !== "clear_have")
  ) {
    return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  }

  if (action === "clear_have") {
    const { error } = await supabaseAdmin
      .from("member_cards")
      .delete()
      .eq("member_id", member.id)
      .eq("status", "have")
      .is("parallel_tier_id", null)
      .in("card_id", cardIds);
    if (error) {
      return NextResponse.json({ error: "Kunde inte rensa." }, { status: 500 });
    }
    await evaluateMasterSets(member.id, cardIds);
    return NextResponse.json({ ok: true });
  }

  // Betalnivå: "Har alla" i ett set man inte får använda nekas.
  const membership = await getMembershipState(member.id);
  if (membership.enabled && !membership.paid) {
    const { data: setRows } = await supabaseAdmin
      .from("cards")
      .select("set_id")
      .in("id", cardIds);
    const setIds = Array.from(new Set((setRows ?? []).map((r: any) => r.set_id)));
    if (setIds.some((id) => !canUseSet(membership, id))) {
      return NextResponse.json(
        {
          error: "Du har använt dina 3 gratis set. Bli medlem för att fylla i fler.",
          code: "paywall",
        },
        { status: 402 }
      );
    }
  }

  const { data: variants, error: vErr } = await supabaseAdmin
    .from("card_variants")
    .select("card_id, variant")
    .in("card_id", cardIds);
  if (vErr) {
    return NextResponse.json({ error: "Kunde inte hämta varianterna." }, { status: 500 });
  }

  const { data: existing, error: eErr } = await supabaseAdmin
    .from("member_cards")
    .select("card_id, variant")
    .eq("member_id", member.id)
    .eq("status", "have")
    .is("parallel_tier_id", null)
    .in("card_id", cardIds);
  if (eErr) {
    return NextResponse.json({ error: "Kunde inte läsa din portfölj." }, { status: 500 });
  }
  const have = new Set((existing ?? []).map((r: any) => `${r.card_id}:${r.variant}`));

  const toInsert = (variants ?? [])
    .filter((v: any) => !have.has(`${v.card_id}:${v.variant}`))
    .map((v: any) => ({
      member_id: member.id,
      card_id: v.card_id,
      variant: v.variant,
      status: "have",
      quantity: 1,
      sellable: false,
      tradeable: false,
      parallel_tier_id: null,
    }));

  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from("member_cards").insert(toInsert);
    if (error) {
      return NextResponse.json({ error: "Kunde inte spara." }, { status: 500 });
    }
  }

  const { error: wErr } = await supabaseAdmin
    .from("member_cards")
    .delete()
    .eq("member_id", member.id)
    .eq("status", "want")
    .is("parallel_tier_id", null)
    .in("card_id", cardIds);
  if (wErr) {
    return NextResponse.json({ error: "Sparade, men kunde inte ta bort Vill ha." }, { status: 500 });
  }

  await evaluateMasterSets(member.id, cardIds);
  return NextResponse.json({ ok: true });
}
