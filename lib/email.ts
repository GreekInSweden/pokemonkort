// Utgående mejl via Resend (https://resend.com). Inget paket behövs, bara ett
// HTTP-anrop. Utan RESEND_API_KEY skickas inget (returnerar false) och sidan
// faller tillbaka på den manuella rutinen i admin.
export const SITE_URL = (process.env.SITE_URL || "https://www.kortmarknad.se").replace(/\/$/, "");

export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM || "Kortmarknad <noreply@kortmarknad.se>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
