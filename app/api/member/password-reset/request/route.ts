import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { randomBytes, createHash } from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmail, SITE_URL } from "@/lib/email";

export const dynamic = "force-dynamic";

// With RESEND_API_KEY set the link is e-mailed automatically. Without it
// (or if sending fails) the account is flagged in admin (Medlemmar) for the
// manual flow. A request never hands out a link by itself — that would let anyone "reset" any
// account just by knowing its email address. Instead this flags the
// account in the admin panel (Medlemmar), where the admin generates a
// one-time link and sends it to the member directly, the same manual way
// Swish payments are already confirmed in this project.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const withinIpLimit = await checkRateLimit(`pwreset:ip:${ip}`, 8, 60 * 60);
  if (!withinIpLimit) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen senare." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { email } = body as { email: string };
  if (!email?.trim()) {
    return NextResponse.json({ error: "Ange en e-postadress." }, { status: 400 });
  }

  const address = email.trim().toLowerCase();
  const withinEmailLimit = await checkRateLimit(`pwreset:email:${address}`, 3, 60 * 60);
  if (!withinEmailLimit) {
    return NextResponse.json({ ok: true });
  }

  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("email", address)
    .maybeSingle();

  // Deliberately the same response whether or not the account exists --
  // otherwise this endpoint could be used to check which e-mails are
  // registered. The link only ever goes to the address on the account.
  if (member) {
    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    const link = `${SITE_URL}/konto/aterstall-losenord?token=${token}`;
    const sent = await sendEmail({
      to: address,
      subject: "Återställ ditt lösenord på Kortmarknad",
      text: `Hej!\n\nKlicka på länken för att välja ett nytt lösenord (gäller i 1 timme):\n${link}\n\nOm det inte var du som begärde detta kan du ignorera mejlet.`,
      html: `<p>Hej!</p><p><a href="${link}">Klicka här för att välja ett nytt lösenord</a> (gäller i 1 timme).</p><p>Om det inte var du som begärde detta kan du ignorera mejlet.</p>`,
    });
    await supabaseAdmin
      .from("members")
      .update(
        sent
          ? {
              password_reset_token_hash: hash,
              password_reset_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              password_reset_requested_at: null,
            }
          : { password_reset_requested_at: new Date().toISOString() } // manuell rutin i admin
      )
      .eq("id", member.id);
  }

  return NextResponse.json({ ok: true });
}
