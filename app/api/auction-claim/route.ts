import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { winId, name, email, phone } = body as {
    winId: string;
    name: string;
    email: string;
    phone: string;
  };

  if (!winId || !name?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Fyll i alla fält." }, { status: 400 });
  }

  const { data: win, error: winError } = await supabaseAdmin
    .from("auction_wins")
    .select("id, status, claim_deadline")
    .eq("id", winId)
    .single();

  if (winError || !win) {
    return NextResponse.json({ error: "Hittade ingen vinst med det id:t." }, { status: 404 });
  }
  if (win.status === "expired" || new Date(win.claim_deadline) < new Date()) {
    return NextResponse.json(
      { error: "Tiden för att hämta ut den här vinsten har gått ut." },
      { status: 409 }
    );
  }
  if (win.status === "paid") {
    return NextResponse.json({ error: "Den här vinsten är redan betald." }, { status: 409 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("auction_wins")
    .update({
      buyer_name: name.trim(),
      buyer_email: email.trim(),
      buyer_phone: phone.trim(),
      status: "claimed",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", winId);

  if (updateError) {
    return NextResponse.json({ error: "Kunde inte spara uppgifterna." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
