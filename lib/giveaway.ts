import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GIVEAWAY_RECENT_DAYS } from "@/lib/giveawayConfig";

export { GIVEAWAY_REVEAL_MS, GIVEAWAY_RECENT_DAYS } from "@/lib/giveawayConfig";

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
  member_goal: number | null;
  goal_reached_at: string | null;
  created_at: string;
}

export const GIVEAWAY_COLUMNS =
  "id, title, description, image_url, audience, draw_at, status, winner_member_id, draw_started_at, winner_notified, member_goal, goal_reached_at, created_at";

// Kan man gå med just nu? Status "open", medlemsmålet (om det finns) nått,
// OCH deadline (draw_at) inte passerad. Deadline stänger alltså anmälan
// automatiskt -- ingen behöver trycka "Stäng anmälan" -- och kan flyttas
// fram i admin för att öppna igen.
export function entriesOpen(
  g: {
    status: GiveawayStatus;
    draw_at: string | null;
    member_goal?: number | null;
    goal_reached_at?: string | null;
  },
  nowMs: number = Date.now()
): boolean {
  if (g.status !== "open") return false;
  if (g.member_goal && !g.goal_reached_at) return false;
  if (g.draw_at && new Date(g.draw_at).getTime() <= nowMs) return false;
  return true;
}

// Antal registrerade medlemmar (samma siffra som räknaren i headern).
export async function memberTotal(): Promise<number> {
  const { count } = await supabaseAdmin
    .from("members")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

// Har medlemsmålet nåtts? Första gången det gör det sparas tidpunkten
// (villkorat, så bara en förfrågan skriver den) och giveawayen öppnas
// därmed för anmälan.
export async function resolveGoal(g: GiveawayRow): Promise<GiveawayRow> {
  if (!g.member_goal || g.goal_reached_at) return g;
  if ((await memberTotal()) < g.member_goal) return g;
  const at = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("giveaways")
    .update({ goal_reached_at: at })
    .eq("id", g.id)
    .is("goal_reached_at", null)
    .select("goal_reached_at")
    .maybeSingle();
  return { ...g, goal_reached_at: (data as any)?.goal_reached_at ?? at };
}

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
