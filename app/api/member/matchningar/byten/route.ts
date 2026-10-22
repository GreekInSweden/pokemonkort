import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/currentMember";
import { computeGroups } from "@/lib/swaps";

export const dynamic = "force-dynamic";

// Anonyma grupper: perfekta byten och samlade köp. Ingen identitet röjs --
// bara en nyckel som används för att avslöja kontakten via /byten/reveal.
export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }
  try {
    const groups = await computeGroups(member.id);
    return NextResponse.json({
      groups: groups.map(({ memberId: _omit, ...g }) => g),
    });
  } catch {
    return NextResponse.json({ groups: [] });
  }
}
