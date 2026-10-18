import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";
import { memberLabel } from "@/lib/memberLabel";
import {
  GIVEAWAY_COLUMNS,
  GIVEAWAY_REVEAL_MS,
  GiveawayRow,
  getCurrentGiveaway,
  isPaidMember,
} from "@/lib/giveaway";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function labelsFor(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const { data } = await supabaseAdmin
    .from("members")
    .select("id, member_number, username")
    .in("id", ids);
  for (const m of (data as any[]) ?? []) {
    map.set(m.id, memberLabel(m.member_number, m.username));
  }
  return map;
}

// Publikt: den aktuella giveawayen, antal deltagare och (när det är dags)
// vinnaren. Vinnaren lämnas ALDRIG ut före avslöjandet -- under själva
// dragningen får webbläsaren bara deltagarnamnen att snurra bland.
//   ?nav=1  ->  bara { active } för menylänken, inga extra frågor.
export async function GET(req: NextRequest) {
  const giveaway = await getCurrentGiveaway();

  if (req.nextUrl.searchParams.get("nav")) {
    return NextResponse.json({ active: !!giveaway });
  }

  const now = Date.now();
  const base = { serverNow: new Date(now).toISOString() };

  if (!giveaway) {
    return NextResponse.json({ ...base, active: false, giveaway: null });
  }

  const { count } = await supabaseAdmin
    .from("giveaway_entries")
    .select("member_id", { count: "exact", head: true })
    .eq("giveaway_id", giveaway.id);

  // --- vem tittar? ---
  const member = await getCurrentMember();
  let me: { loggedIn: boolean; joined: boolean; eligible: boolean; reason: string | null } = {
    loggedIn: !!member,
    joined: false,
    eligible: false,
    reason: member ? null : "Logga in för att delta.",
  };
  if (member) {
    const { data: mine } = await supabaseAdmin
      .from("giveaway_entries")
      .select("member_id")
      .eq("giveaway_id", giveaway.id)
      .eq("member_id", member.id)
      .maybeSingle();
    me.joined = !!mine;
    if (giveaway.audience === "paid" && !(await isPaidMember(member.id))) {
      me.eligible = false;
      me.reason = "Den här giveawayen är bara för betalande medlemmar.";
    } else {
      me.eligible = true;
    }
  }

  // --- dragning / vinnare ---
  let drawing: { startedAt: string; revealAt: string; names: string[] } | null = null;
  let winnerLabel: string | null = null;
  let iWon = false;

  if (giveaway.status === "drawn" && giveaway.draw_started_at) {
    const startedMs = new Date(giveaway.draw_started_at).getTime();
    const revealMs = startedMs + GIVEAWAY_REVEAL_MS;

    if (now < revealMs) {
      // Mitt i dragningen: skicka deltagarnamn att snurra bland (max 300).
      const { data: entryRows } = await supabaseAdmin
        .from("giveaway_entries")
        .select("member_id")
        .eq("giveaway_id", giveaway.id)
        .limit(300);
      const labels = await labelsFor(((entryRows as any[]) ?? []).map((r) => r.member_id));
      drawing = {
        startedAt: giveaway.draw_started_at,
        revealAt: new Date(revealMs).toISOString(),
        names: Array.from(labels.values()),
      };
    } else if (giveaway.winner_member_id) {
      const labels = await labelsFor([giveaway.winner_member_id]);
      winnerLabel = labels.get(giveaway.winner_member_id) ?? "Okänd medlem";
      iWon = !!member && member.id === giveaway.winner_member_id;

      // Skicka vinnarnotisen först NÄR avslöjandet är över, så ingen får
      // veta i förväg via notis-märket. Det villkorade update:t gör att
      // bara en av alla som pollar skickar den.
      if (!giveaway.winner_notified) {
        const { data: claimed } = await supabaseAdmin
          .from("giveaways")
          .update({ winner_notified: true })
          .eq("id", giveaway.id)
          .eq("winner_notified", false)
          .select("id")
          .maybeSingle();
        if (claimed) {
          await supabaseAdmin.from("member_notifications").insert({
            member_id: giveaway.winner_member_id,
            kind: "giveaway_win",
            body: `Grattis! Du vann giveawayen "${giveaway.title}". Vi hör av oss till dig med hur du får din vinst.`,
          });
        }
      }
    }
  }

  // --- tidigare vinnare (bara redan avslöjade, inte den aktuella) ---
  const { data: pastRows } = await supabaseAdmin
    .from("giveaways")
    .select("id, title, winner_member_id, draw_started_at")
    .eq("status", "drawn")
    .neq("id", giveaway.id)
    .not("winner_member_id", "is", null)
    .order("draw_started_at", { ascending: false })
    .limit(10);
  const past = ((pastRows as any[]) ?? []).filter(
    (r) => r.draw_started_at && new Date(r.draw_started_at).getTime() + GIVEAWAY_REVEAL_MS <= now
  );
  const pastLabels = await labelsFor(past.map((r) => r.winner_member_id));

  return NextResponse.json({
    ...base,
    active: true,
    giveaway: {
      id: giveaway.id,
      title: giveaway.title,
      description: giveaway.description,
      imageUrl: giveaway.image_url,
      audience: giveaway.audience,
      drawAt: giveaway.draw_at,
      status: giveaway.status,
      entryCount: count ?? 0,
    },
    me,
    drawing,
    winnerLabel,
    iWon,
    previousWinners: past.map((r) => ({
      title: r.title,
      label: pastLabels.get(r.winner_member_id) ?? "Okänd medlem",
      drawnAt: r.draw_started_at,
    })),
  });
}

// Medlem går med eller drar sig ur (så länge giveawayen pågår).
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Logga in för att delta." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const giveawayId = String(body.giveawayId ?? "");
  const action = body.action === "leave" ? "leave" : "join";
  if (!giveawayId) {
    return NextResponse.json({ error: "Något saknas." }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from("giveaways")
    .select(GIVEAWAY_COLUMNS)
    .eq("id", giveawayId)
    .maybeSingle();
  const giveaway = data as GiveawayRow | null;
  if (!giveaway || giveaway.status === "draft") {
    return NextResponse.json({ error: "Giveawayen finns inte." }, { status: 404 });
  }
  if (giveaway.status !== "open") {
    return NextResponse.json({ error: "Giveawayen är stängd för nya deltagare." }, { status: 409 });
  }

  if (action === "leave") {
    await supabaseAdmin
      .from("giveaway_entries")
      .delete()
      .eq("giveaway_id", giveaway.id)
      .eq("member_id", member.id);
    return NextResponse.json({ ok: true });
  }

  if (giveaway.audience === "paid" && !(await isPaidMember(member.id))) {
    return NextResponse.json(
      { error: "Den här giveawayen är bara för betalande medlemmar." },
      { status: 403 }
    );
  }

  // Primärnyckeln (giveaway_id, member_id) hindrar dubbletter; ignorera
  // "finns redan" så ett dubbelklick inte ger fel.
  const { error } = await supabaseAdmin
    .from("giveaway_entries")
    .upsert(
      { giveaway_id: giveaway.id, member_id: member.id },
      { onConflict: "giveaway_id,member_id", ignoreDuplicates: true }
    );
  if (error) {
    return NextResponse.json({ error: "Kunde inte anmäla dig. Försök igen." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
