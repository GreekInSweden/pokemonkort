import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MEMBER_SESSION_COOKIE, verifyMemberSession } from "@/lib/memberSession";

export const dynamic = "force-dynamic";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|uptime|headless|lighthouse|curl|wget/i;

// Tar emot en "puls" från besökarens webbläsare (ca en gång i minuten medan
// fliken är synlig) och räknar den som online. Lagrar ingen IP-adress,
// bara en envägs-hash som byts varje dygn.
export async function POST(req: Request) {
  const h = headers();
  const ua = h.get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return NextResponse.json({ ok: true });

  let path = "/";
  try {
    const body = await req.json();
    if (typeof body?.path === "string") path = body.path.slice(0, 200);
  } catch {
    /* tom body är okej */
  }
  if (path.startsWith("/admin")) return NextResponse.json({ ok: true });

  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "okand";
  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
  const salt = process.env.STATS_SALT ?? "kortmarknad";
  const sessionId = createHash("sha256")
    .update(`${ip}|${ua}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);

  // Inloggad medlem? Bara cookien kontrolleras, ingen databasfråga.
  let memberId: string | null = null;
  const token = cookies().get(MEMBER_SESSION_COOKIE)?.value;
  if (token) {
    try {
      memberId = (await verifyMemberSession(token)) ?? null;
    } catch {
      memberId = null;
    }
  }

  await supabaseAdmin.from("site_presence").upsert(
    { session_id: sessionId, member_id: memberId, path, last_seen: new Date().toISOString() },
    { onConflict: "session_id" }
  );
  await supabaseAdmin
    .from("site_daily_visitors")
    .upsert(
      { day, session_id: sessionId, member_id: memberId },
      { onConflict: "day,session_id", ignoreDuplicates: false }
    );

  // Städning ibland: presence äldre än ett dygn, besökslogg äldre än 120 dagar.
  if (Math.random() < 0.02) {
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const old = new Date(Date.now() - 120 * 24 * 3600 * 1000).toLocaleDateString("sv-SE");
    await supabaseAdmin.from("site_presence").delete().lt("last_seen", dayAgo);
    await supabaseAdmin.from("site_daily_visitors").delete().lt("day", old);
  }

  return NextResponse.json({ ok: true });
}
