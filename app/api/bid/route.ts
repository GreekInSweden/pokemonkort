import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MEMBER_SESSION_COOKIE, verifyMemberSession } from "@/lib/memberSession";
import { planChallengerBid } from "@/lib/auctionBidding";

// Anti-snipe: a bid placed inside this window before the deadline pushes
// the deadline out to "now + this window" again, so a last-second bid
// always leaves everyone else the same amount of time to respond instead
// of ending the auction on the spot.
const SNIPE_WINDOW_MS = 3 * 60 * 1000;

// Skyddsräcke mot tangentbordsmiss (t.ex. en extra nolla) -- ett maxbud är
// ett bindande löfte, så ett orimligt stort belopp stoppas här.
const MAX_BID_SEK = 1_000_000;

export const dynamic = "force-dynamic";

// Maxbud ("proxy bidding"): beloppet som skickas hit är medlemmens HÖGSTA
// pris, inte nödvändigtvis det bud som läggs. Sidan bjuder lägsta
// nödvändiga belopp åt hen, och höjer sedan automatiskt ett steg
// (auktionens min_increment_sek) varje gång någon bjuder över, tills
// maxbudet är slut. Alla budsteg -- även de automatiska -- sparas som
// vanliga rader i "bids", så budhistorik, "leder" och vinstberäkningen
// fungerar som förut. Själva maxbudet ligger i auction_max_bids och
// skickas aldrig till någon webbläsare.
//
// Vid lika belopp vinner den som lade sitt maxbud först -- det är därför
// alla "vem leder"-frågor sorterar på belopp OCH created_at (senaste raden
// vid lika belopp är den som leder).
//
// OBS: ingen databastransaktion -- två bud som landar exakt samtidigt kan
// i teorin korsa varandra. Vid den här sidans skala är det en acceptabel
// risk; det värsta som händer är att nästa bud rättar till ordningen.
export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(MEMBER_SESSION_COOKIE)?.value;
  const memberId = sessionToken ? await verifyMemberSession(sessionToken) : null;
  if (!memberId) {
    return NextResponse.json(
      { error: "Logga in på ditt medlemskonto för att buda." },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { auctionId, amountSek } = body as {
    auctionId: string;
    amountSek: number; // = medlemmens högsta bud (maxbud)
  };

  if (!auctionId || !amountSek) {
    return NextResponse.json({ error: "Något saknas i budet." }, { status: 400 });
  }
  if (!Number.isInteger(amountSek) || amountSek <= 0) {
    return NextResponse.json(
      { error: "Ange ett helt belopp i kronor." },
      { status: 400 }
    );
  }
  if (amountSek > MAX_BID_SEK) {
    return NextResponse.json(
      { error: `Högsta tillåtna bud är ${MAX_BID_SEK} kr.` },
      { status: 400 }
    );
  }

  const { data: auction, error: auctionError } = await supabaseAdmin
    .from("auctions")
    .select(
      "id, starting_price_sek, min_increment_sek, ends_at, status, card_variants(cards(number, name))"
    )
    .eq("id", auctionId)
    .single();

  if (auctionError || !auction) {
    return NextResponse.json({ error: "Auktionen hittades inte." }, { status: 404 });
  }
  if (auction.status !== "open" || new Date(auction.ends_at) < new Date()) {
    return NextResponse.json({ error: "Auktionen är avslutad." }, { status: 409 });
  }

  const inc = Number(auction.min_increment_sek);
  const start = Number(auction.starting_price_sek);
  const cardName: string = (auction as any).card_variants?.cards?.name ?? "kortet";

  const { data: topRows } = await supabaseAdmin
    .from("bids")
    .select("amount_sek, member_id")
    .eq("auction_id", auctionId)
    .order("amount_sek", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  const top = topRows && topRows.length > 0 ? topRows[0] : null;
  const hasBids = top !== null;
  // Samma konvention som förut: utan bud är "nuvarande högsta" ett steg
  // under startpriset, så att första budet får vara exakt startpriset.
  const currentHigh = top ? Number(top.amount_sek) : start - inc;
  // Gamla bud lagda som gäst (före medlemskonton) saknar member_id.
  const leaderMemberId: string | null = top?.member_id ?? null;

  const idsToLookUp = [memberId, ...(leaderMemberId && leaderMemberId !== memberId ? [leaderMemberId] : [])];
  const { data: maxRows, error: maxErr } = await supabaseAdmin
    .from("auction_max_bids")
    .select("member_id, max_amount_sek")
    .eq("auction_id", auctionId)
    .in("member_id", idsToLookUp);

  if (maxErr) {
    console.error("auction_max_bids lookup failed:", maxErr.message);
    return NextResponse.json(
      {
        error:
          "Kunde inte lägga budet just nu. Har databasfilen auction_max_bids.sql körts i Supabase?",
      },
      { status: 500 }
    );
  }

  const storedMax = (id: string) =>
    Number((maxRows ?? []).find((r: any) => r.member_id === id)?.max_amount_sek ?? 0);

  async function saveMax(amount: number) {
    return supabaseAdmin.from("auction_max_bids").upsert(
      {
        auction_id: auctionId,
        member_id: memberId,
        max_amount_sek: amount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "auction_id,member_id" }
    );
  }

  // --- Fall A: medlemmen leder redan och vill bara höja sitt maxbud. ---
  // Priset ändras inte, ingen ny budrad, ingen förlängning av sluttiden.
  if (leaderMemberId === memberId) {
    const myMax = Math.max(storedMax(memberId), currentHigh);
    if (amountSek <= myMax) {
      return NextResponse.json(
        {
          error: `Ditt högsta bud är redan ${myMax} kr. Ange ett högre belopp om du vill höja det.`,
        },
        { status: 409 }
      );
    }
    const { error: saveErr } = await saveMax(amountSek);
    if (saveErr) {
      return NextResponse.json({ error: "Kunde inte spara ditt maxbud." }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      outcome: "raised",
      currentHighSek: currentHigh,
      yourMaxSek: amountSek,
      extendedEndsAt: null,
    });
  }

  // --- Fall B: någon annan leder (eller inga bud än). ---
  const minRequired = currentHigh + inc;
  if (amountSek < minRequired) {
    return NextResponse.json(
      { error: `Ditt högsta bud måste vara minst ${minRequired} kr.` },
      { status: 409 }
    );
  }

  // Ledarens verkliga tak: dolt maxbud, eller (för bud lagda innan
  // maxbud fanns / som gäst) bara det bud som redan ligger.
  const leaderMax = leaderMemberId
    ? Math.max(storedMax(leaderMemberId), currentHigh)
    : currentHigh;

  const { error: maxSaveErr } = await saveMax(amountSek);
  if (maxSaveErr) {
    return NextResponse.json({ error: "Kunde inte spara ditt maxbud." }, { status: 500 });
  }

  // Vad som ska hända (vilka budrader, vem som leder efteråt) beräknas i
  // en ren funktion -- se lib/auctionBidding.ts för reglerna.
  const { plan, outcome, newHigh } = planChallengerBid({
    startingPrice: start,
    increment: inc,
    currentHigh,
    hasBids,
    leaderMemberId,
    leaderMax,
    memberId,
    amountSek,
  });

  // created_at sätts uttryckligen (1 ms isär) så att ordningen är entydig
  // även när två rader får samma belopp.
  const baseTime = Date.now();
  const { error: insertError } = await supabaseAdmin.from("bids").insert(
    plan.map((p, i) => ({
      auction_id: auctionId,
      member_id: p.memberId,
      amount_sek: p.amount,
      created_at: new Date(baseTime + i).toISOString(),
    }))
  );

  if (insertError) {
    return NextResponse.json({ error: "Kunde inte spara budet." }, { status: 500 });
  }

  // Tidigare ledare har precis blivit överbjuden -> lägg ett besked i
  // deras Meddelanden. Icke-kritiskt: om tabellen saknas eller något
  // krånglar ska själva budet ändå gå igenom.
  if (outcome === "leading" && hasBids && leaderMemberId && leaderMemberId !== memberId) {
    try {
      const { error: notifErr } = await supabaseAdmin.from("member_notifications").insert({
        member_id: leaderMemberId,
        auction_id: auctionId,
        kind: "outbid",
        body: `Du har blivit överbjuden på ${cardName}. Högsta bud är nu ${newHigh} kr. Lägg ett högre maxbud om du vill ta tillbaka ledningen.`,
      });
      if (notifErr) console.error("outbid notification failed:", notifErr.message);
    } catch (e) {
      console.error("outbid notification threw:", e);
    }
  }

  // If this bid landed inside the last SNIPE_WINDOW_MS before the deadline,
  // push the deadline out so it always ends at least that far in the future.
  const now = Date.now();
  const currentEndsAt = new Date(auction.ends_at).getTime();
  let newEndsAt: string | null = null;
  if (currentEndsAt - now < SNIPE_WINDOW_MS) {
    newEndsAt = new Date(now + SNIPE_WINDOW_MS).toISOString();
    await supabaseAdmin
      .from("auctions")
      .update({ ends_at: newEndsAt })
      .eq("id", auctionId);
  }

  return NextResponse.json({
    ok: true,
    outcome,
    currentHighSek: newHigh,
    yourMaxSek: amountSek,
    extendedEndsAt: newEndsAt,
  });
}
