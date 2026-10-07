import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";

export const dynamic = "force-dynamic";

// Korta systembesked (just nu: "du har blivit överbjuden") -- se
// auction_max_bids.sql. Egen route istället för member_messages eftersom
// ett systembesked saknar avsändare och kort-sammanhang.
//
// GET: alla besked till den inloggade medlemmen, nyast först. Precis som
// med vanliga meddelanden räknas allt som hämtats som läst första gången
// sidan öppnas -- nav-badgen pollar /api/member/messages/unread-count,
// som är read-only och inte rör read_at.
export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("member_notifications")
    .select("id, auction_id, kind, body, created_at, read_at")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // Tabellen saknas (auction_max_bids.sql inte körd) ska inte välta
    // hela Meddelanden-sidan -- visa bara inga besked.
    return NextResponse.json({ notifications: [] });
  }

  const unreadIds = (data ?? []).filter((n: any) => !n.read_at).map((n: any) => n.id);
  if (unreadIds.length > 0) {
    await supabaseAdmin
      .from("member_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  return NextResponse.json({
    notifications: (data ?? []).map((n: any) => ({
      id: n.id,
      auctionId: n.auction_id,
      kind: n.kind,
      body: n.body,
      createdAt: n.created_at,
      wasUnread: unreadIds.includes(n.id),
    })),
  });
}

// DELETE: ta bort ett eget besked.
export async function DELETE(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const { id } = (await req.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "Något saknas." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("member_notifications")
    .delete()
    .eq("id", id)
    .eq("member_id", member.id);

  if (error) {
    return NextResponse.json({ error: "Kunde inte radera." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
