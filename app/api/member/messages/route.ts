import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { Variant } from "@/lib/types";

export const dynamic = "force-dynamic";

// Ett enkelt brevlåde-system, inte en chatt -- se member_messages.sql.
// GET: alla meddelanden till/från den inloggade medlemmen, nyast först.
export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("member_messages")
    .select(
      "id, from_member_id, to_member_id, card_id, variant, parallel_tier_id, body, front_image_url, back_image_url, created_at, read_at, " +
        "from_member:members!member_messages_from_member_id_fkey(member_number, name), " +
        "to_member:members!member_messages_to_member_id_fkey(member_number, name), " +
        "cards(number, name, image_url), parallel_tiers(name)"
    )
    .or(`from_member_id.eq.${member.id},to_member_id.eq.${member.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Kunde inte hämta meddelanden." }, { status: 500 });
  }

  // Läst-markering görs tyst här -- första gången mottagaren hämtar sin
  // brevlåda räknas allt som redan hämtats som läst. Ingen realtid, bara
  // en enkel "har du sett det" nästa gång sidan laddas.
  const unreadIds = (data ?? [])
    .filter((m: any) => m.to_member_id === member.id && !m.read_at)
    .map((m: any) => m.id);
  if (unreadIds.length > 0) {
    await supabaseAdmin
      .from("member_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  const messages = (data ?? []).map((m: any) => ({
    id: m.id,
    fromMemberId: m.from_member_id,
    toMemberId: m.to_member_id,
    outgoing: m.from_member_id === member.id,
    otherMemberNumber:
      m.from_member_id === member.id ? m.to_member?.member_number : m.from_member?.member_number,
    otherMemberName: m.from_member_id === member.id ? m.to_member?.name : m.from_member?.name,
    cardId: m.card_id,
    cardNumber: m.cards?.number ?? null,
    cardName: m.cards?.name ?? null,
    cardImageUrl: m.cards?.image_url ?? null,
    variant: m.variant,
    parallelTierName: m.parallel_tiers?.name ?? null,
    body: m.body,
    frontImageUrl: m.front_image_url ?? null,
    backImageUrl: m.back_image_url ?? null,
    createdAt: m.created_at,
    wasUnread: unreadIds.includes(m.id),
  }));

  return NextResponse.json({ messages });
}

// POST: skicka ett nytt meddelande. Precis som /reveal går det bara att
// nå i kontexten av en genuin matchning -- kollas här på samma sätt
// (avsändaren måste ha kortet i sin önskelista, mottagaren måste ha det
// till salu/byte), så det här inte blir en fri "skriv till vem som
// helst"-kanal för spam.
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const withinLimit = await checkRateLimit(`message:member:${member.id}`, 30, 60 * 60);
  const withinIpLimit = await checkRateLimit(`message:ip:${ip}`, 60, 60 * 60);
  if (!withinLimit || !withinIpLimit) {
    return NextResponse.json(
      { error: "För många meddelanden. Försök igen senare." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const {
    toMemberId,
    cardId,
    variant,
    parallelTierId,
    body: text,
    frontImageUrl,
    backImageUrl,
  } = body as {
    toMemberId: string;
    cardId: string;
    variant: Variant;
    parallelTierId?: string | null;
    body: string;
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
  };

  if (!toMemberId || !cardId || !variant || !text?.trim()) {
    return NextResponse.json({ error: "Något saknas." }, { status: 400 });
  }
  if (toMemberId === member.id) {
    return NextResponse.json({ error: "Du kan inte skicka till dig själv." }, { status: 400 });
  }

  // Bilder måste komma från vår egen uppladdningsroute (och den bucketen
  // specifikt) -- annars skulle fältet kunna missbrukas som en gratis
  // "visa vilken bild-URL som helst"-kanal.
  const imageUrlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/member-message-images/`;
  for (const url of [frontImageUrl, backImageUrl]) {
    if (url && !url.startsWith(imageUrlPrefix)) {
      return NextResponse.json({ error: "Ogiltig bild-URL." }, { status: 400 });
    }
  }

  // Genuin matchning krävs i NÅGON riktning -- annars skulle den som
  // fick ett meddelande (säljaren/bytaren) inte kunna svara, eftersom
  // det är den som SÖKER kortet som har det i sin önskelista, inte den
  // som har det. Så: antingen (jag vill ha + mottagaren har till salu/
  // byte) eller (jag har till salu/byte + mottagaren vill ha) -- exakt
  // samma par av rader som /matchningar/reveal redan kollar, bara i
  // valfri riktning.
  async function hasRow(memberId: string, status: "want" | "have", requireSellOrTrade: boolean) {
    let q = supabaseAdmin
      .from("member_cards")
      .select("id")
      .eq("member_id", memberId)
      .eq("card_id", cardId)
      .eq("variant", variant)
      .eq("status", status);
    if (requireSellOrTrade) q = q.or("sellable.eq.true,tradeable.eq.true");
    q = parallelTierId ? q.eq("parallel_tier_id", parallelTierId) : q.is("parallel_tier_id", null);
    const { data } = await q.maybeSingle();
    return !!data;
  }

  const [iWant, theyHave, iHave, theyWant] = await Promise.all([
    hasRow(member.id, "want", false),
    hasRow(toMemberId, "have", true),
    hasRow(member.id, "have", true),
    hasRow(toMemberId, "want", false),
  ]);
  const genuineMatch = (iWant && theyHave) || (iHave && theyWant);
  if (!genuineMatch) {
    return NextResponse.json(
      { error: "Ingen genuin matchning hittades för det här kortet." },
      { status: 403 }
    );
  }

  const { error } = await supabaseAdmin.from("member_messages").insert({
    from_member_id: member.id,
    to_member_id: toMemberId,
    card_id: cardId,
    variant,
    parallel_tier_id: parallelTierId ?? null,
    body: text.trim().slice(0, 2000),
    front_image_url: frontImageUrl ?? null,
    back_image_url: backImageUrl ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Kunde inte skicka meddelandet." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
