import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await checkRateLimit(`verify-confirm:${getClientIp(req)}`, 20, 60 * 60))) {
    return NextResponse.json({ error: "För många försök." }, { status: 429 });
  }
  const { token } = (await req.json()) as { token?: string };
  if (!token) return NextResponse.json({ error: "Länken saknas." }, { status: 400 });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id, email_verify_expires_at")
    .eq("email_verify_token_hash", hash)
    .maybeSingle();
  if (!member || !member.email_verify_expires_at || new Date(member.email_verify_expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Länken är ogiltig eller har gått ut. Begär en ny under Mitt konto." },
      { status: 400 }
    );
  }
  await supabaseAdmin
    .from("members")
    .update({
      email_verified_at: new Date().toISOString(),
      email_verify_token_hash: null,
      email_verify_expires_at: null,
    })
    .eq("id", member.id);
  return NextResponse.json({ ok: true });
}
