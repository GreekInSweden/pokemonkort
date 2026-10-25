import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";

export const dynamic = "force-dynamic";

// Pokédex-samlingen: kryssa i/ur en Pokémon för hand, eller slå på/av
// publik profil.
//   { dex: 25, on: true }   -> kryssa i
//   { dex: 25, on: false }  -> ta bort ikryssningen
//   { public: true }        -> publik profil (kräver användarnamn)
export async function POST(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  if (typeof body.public === "boolean") {
    if (body.public && !member.username) {
      return NextResponse.json(
        { error: "Du behöver ett användarnamn för en publik profil. Lägg till det under din profil." },
        { status: 400 }
      );
    }
    const { error } = await supabaseAdmin
      .from("members")
      .update({ dex_public: body.public })
      .eq("id", member.id);
    if (error) return NextResponse.json({ error: "Kunde inte spara." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const dex = Number(body.dex);
  if (!Number.isInteger(dex) || dex < 1 || dex > 2000 || typeof body.on !== "boolean") {
    return NextResponse.json({ error: "Ogiltig begäran." }, { status: 400 });
  }
  if (body.on) {
    const { error } = await supabaseAdmin
      .from("member_dex")
      .upsert({ member_id: member.id, dex_number: dex }, { onConflict: "member_id,dex_number" });
    if (error) return NextResponse.json({ error: "Kunde inte spara." }, { status: 500 });
  } else {
    const { error } = await supabaseAdmin
      .from("member_dex")
      .delete()
      .eq("member_id", member.id)
      .eq("dex_number", dex);
    if (error) return NextResponse.json({ error: "Kunde inte spara." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
