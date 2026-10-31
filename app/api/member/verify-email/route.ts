import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentMember } from "@/lib/currentMember";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/emailVerify";

export const dynamic = "force-dynamic";

// GET: är mejlet verifierat? POST: skicka ny bekräftelselänk.
export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  const { data } = await supabaseAdmin
    .from("members")
    .select("email_verified_at")
    .eq("id", member.id)
    .maybeSingle();
  return NextResponse.json({ verified: !!data?.email_verified_at });
}

export async function POST() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  if (!(await checkRateLimit(`verify-mail:${member.id}`, 3, 60 * 60))) {
    return NextResponse.json({ error: "För många försök. Vänta en stund." }, { status: 429 });
  }
  const { data } = await supabaseAdmin
    .from("members")
    .select("email_verified_at")
    .eq("id", member.id)
    .maybeSingle();
  if (data?.email_verified_at) return NextResponse.json({ ok: true, verified: true });
  const sent = await sendVerificationEmail(member.id, member.email, member.name);
  if (!sent) {
    return NextResponse.json({ error: "Kunde inte skicka mejlet just nu." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
