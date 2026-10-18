import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Hur länge live-dragningen "snurrar" innan vinnaren avslöjas (ms).
export const GIVEAWAY_REVEAL_MS = 10_000;

// Hur länge en avslutad giveaway ligger kvar som aktuell (och länken i
// menyn syns) efter att vinnaren dragits.
export const GIVEAWAY_RECENT_DAYS = 14;

export type GiveawayStatus = "draft" | "open" | "closed" | "drawn";
export type GiveawayAudience = "all" | "paid";

export interface GiveawayRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  audience: GiveawayAudience;
  draw_at: string | null;
  status: GiveawayStatus;
  winner_member_id: string | null;
  draw_started_at: string | null;
  winner_notified: boolean;
  created_at: string;
}

export const GIVEAWAY_COLUMNS =
  "id, title, description, image_url, audience, draw_at, status, winner_member_id, draw_started_at, winner_notified, created_at";

// Har medlemmen betalt medlemskap just nu? Oberoende av om betalnivån är
// påslagen i övrigt -- en giveaway för betalande ska bara gälla de som
// faktiskt har betalt.
export async function isPaidMember(memberId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("members")
    .select("paid_until")
    .eq("id", memberId)
    .maybeSingle();
  const paidUntil: string | null = (data as any)?.paid_until ?? null;
  return !!paidUntil && new Date(paidUntil) > new Date();
}

// Den giveaway som just nu ska visas: den senast skapade som inte är ett
// utkast, och som antingen pågår eller dragits nyligen.
export async function getCurrentGiveaway(): Promise<GiveawayRow | null> {
  const { data, error } = await supabaseAdmin
    .from("giveaways")
    .select(GIVEAWAY_COLUMNS)
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const g = data as GiveawayRow;
  if (g.status === "drawn" && g.draw_started_at) {
    const ageMs = Date.now() - new Date(g.draw_started_at).getTime();
    if (ageMs > GIVEAWAY_RECENT_DAYS * 86_400_000) return null;
  }
  return g;
}
