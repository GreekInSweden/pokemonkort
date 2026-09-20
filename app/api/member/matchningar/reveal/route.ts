import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";
import { Variant } from "@/lib/types";

export const dynamic = "force-dynamic";

// Reveals contact details for members who have the given card/variant —
// but only after re-checking, server-side, that the requester actually
// has a matching "vill ha" entry for it. That stops someone from just
// calling this for an arbitrary card to fish for other members' contact
// info; it only ever works for a genuine match. Only members who filled
// in at least one contact channel are returned — silence means they
// haven't opted in to being reached yet.
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const body = await req.json();
  const { cardId, variant } = body as { cardId: string; variant: Variant };
  if (!cardId || !variant) {
    return NextResponse.json({ error: "Något saknas." }, { status: 400 });
  }

  const { data: ownWant } = await supabaseAdmin
    .from("member_cards")
    .select("id")
    .eq("member_id", member.id)
    .eq("card_id", cardId)
    .eq("variant", variant)
    .eq("status", "want")
    .maybeSingle();

  if (!ownWant) {
    return NextResponse.json(
      { error: "Du har inte det här kortet i din önskelista." },
      { status: 403 }
    );
  }

  const { data: haves } = await supabaseAdmin
    .from("member_cards")
    .select("member_id, quantity, members(member_number, name, contact_messenger, contact_whatsapp, contact_other)")
    .eq("card_id", cardId)
    .eq("variant", variant)
    .eq("status", "have")
    .neq("member_id", member.id);

  const contacts = (haves ?? [])
    .map((h: any) => h.members)
    .filter(
      (m: any) => m && (m.contact_messenger || m.contact_whatsapp || m.contact_other)
    )
    .map((m: any) => ({
      memberNumber: m.member_number,
      name: m.name,
      contactMessenger: m.contact_messenger,
      contactWhatsapp: m.contact_whatsapp,
      contactOther: m.contact_other,
    }));

  return NextResponse.json({ contacts });
}
