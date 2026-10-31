import { randomBytes, createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail, SITE_URL } from "@/lib/email";

// Skapar en engångslänk (giltig 24 h) och mejlar den. Returnerar false om
// mejlet inte kunde skickas eller kolumnerna saknas (SQL ej körd).
export async function sendVerificationEmail(memberId: string, email: string, name: string): Promise<boolean> {
  try {
    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    const { error } = await supabaseAdmin
      .from("members")
      .update({
        email_verify_token_hash: hash,
        email_verify_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", memberId);
    if (error) return false;
    const link = `${SITE_URL}/konto/verifiera-mejl?token=${token}`;
    return await sendEmail({
      to: email,
      subject: "Bekräfta din e-postadress - Kortmarknad",
      text: `Hej ${name}!\n\nBekräfta din e-postadress genom att klicka på länken (gäller i 24 timmar):\n${link}\n\nOm det inte var du som skapade kontot kan du ignorera mejlet.`,
      html: `<p>Hej ${name.replace(/[<>&"]/g, "")}!</p><p><a href="${link}">Klicka här för att bekräfta din e-postadress</a> (gäller i 24 timmar).</p><p>Om det inte var du som skapade kontot kan du ignorera mejlet.</p>`,
    });
  } catch {
    return false;
  }
}
