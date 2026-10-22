import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";
import { computeGroups } from "@/lib/swaps";
import { memberLabel } from "@/lib/memberLabel";

export const dynamic = "force-dynamic";

// Avslöjar kontakten för EN grupp -- men bara efter att gruppen räknats om
// serverside för den inloggade (nyckeln går inte att gissa eller återanvända
// av någon annan), så det inte går att fiska kontaktuppgifter.
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }
  const { key } = (await req.json().catch(() => ({}))) as { key?: string };
  if (!key) {
    return NextResponse.json({ error: "Något saknas." }, { status: 400 });
  }

  const groups = await computeGroups(member.id);
  const group = groups.find((g) => g.key === key);
  if (!group) {
    return NextResponse.json({ contact: null });
  }

  const { data: m } = await supabaseAdmin
    .from("members")
    .select("member_number, username, contact_messenger, contact_whatsapp, contact_other")
    .eq("id", group.memberId)
    .maybeSingle();
  if (!m) {
    return NextResponse.json({ contact: null });
  }

  // Ett kort att hänga meddelandet på (matchningskontrollen i /messages
  // kräver ett genuint kort-par).
  const ctx = group.youGet[0];
  return NextResponse.json({
    contact: {
      memberId: group.memberId,
      label: memberLabel((m as any).member_number, (m as any).username),
      contactMessenger: (m as any).contact_messenger,
      contactWhatsapp: (m as any).contact_whatsapp,
      contactOther: (m as any).contact_other,
      cardId: ctx.cardId,
      variant: ctx.variant,
      parallelTierId: ctx.parallelTierId,
    },
  });
}
