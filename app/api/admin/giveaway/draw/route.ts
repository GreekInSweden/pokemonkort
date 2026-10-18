import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/shopStatus";
import { memberLabel } from "@/lib/memberLabel";

export const dynamic = "force-dynamic";

// Drar en slumpmässig vinnare bland deltagarna (kryptografiskt slumpat på
// servern) och startar den live-dragning som alla som tittar på sidan ser.
// Kan köras igen på en redan dragen giveaway ("dra om", t.ex. om vinnaren
// inte hör av sig) -- då utesluts den förra vinnaren.
export async function POST(req: NextRequest) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Bara admin." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const giveawayId = String(body.giveawayId ?? "");
  if (!giveawayId) {
    return NextResponse.json({ error: "Något saknas." }, { status: 400 });
  }

  const { data: g } = await supabaseAdmin
    .from("giveaways")
    .select("id, status, winner_member_id, draw_started_at")
    .eq("id", giveawayId)
    .maybeSingle();
  if (!g) {
    return NextResponse.json({ error: "Giveawayen finns inte." }, { status: 404 });
  }
  if (g.status === "draft") {
    return NextResponse.json({ error: "Publicera giveawayen först." }, { status: 409 });
  }

  const { data: entryRows } = await supabaseAdmin
    .from("giveaway_entries")
    .select("member_id")
    .eq("giveaway_id", giveawayId);
  let pool = ((entryRows as any[]) ?? []).map((r) => r.member_id as string);
  if (g.status === "drawn" && g.winner_member_id) {
    pool = pool.filter((id) => id !== g.winner_member_id);
  }
  if (pool.length === 0) {
    return NextResponse.json({ error: "Det finns inga deltagare att dra bland." }, { status: 400 });
  }

  const winnerId = pool[randomInt(pool.length)];

  // Villkorat så att två snabba klick inte drar två gånger: uppdateringen
  // går bara igenom om statusen/dragningen är som vi nyss läste den.
  let upd = supabaseAdmin
    .from("giveaways")
    .update({
      status: "drawn",
      winner_member_id: winnerId,
      draw_started_at: new Date().toISOString(),
      winner_notified: false,
    })
    .eq("id", giveawayId)
    .eq("status", g.status);
  upd = g.draw_started_at
    ? upd.eq("draw_started_at", g.draw_started_at)
    : upd.is("draw_started_at", null);
  const { data: done } = await upd.select("id").maybeSingle();
  if (!done) {
    return NextResponse.json({ error: "Dragningen ändrades just. Ladda om och försök igen." }, { status: 409 });
  }

  const { data: m } = await supabaseAdmin
    .from("members")
    .select("member_number, username")
    .eq("id", winnerId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    winner: memberLabel((m as any)?.member_number ?? null, (m as any)?.username),
    participants: pool.length,
  });
}
