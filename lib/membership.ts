import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Hur många set en gratismedlem får fylla i. Ändra här om det ska bli
// fler/färre.
export const FREE_SET_LIMIT = 3;

export const PRICE_MONTH_SEK = 19;
export const PRICE_YEAR_SEK = 199;

export interface MembershipState {
  // Är betalnivån påslagen i Admin -> Medlemskap?
  enabled: boolean;
  // Har medlemmen fri access (betalt till ett framtida datum)?
  paid: boolean;
  paidUntil: string | null;
  // set-id:n som medlemmen "använt" som gratis (första FREE_SET_LIMIT
  // seten hen lagt in kort i, i den ordning hen gjorde det).
  freeSetIds: string[];
}

export async function isPaywallEnabled(): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "paywall_enabled")
    .maybeSingle();
  // Saknas tabellen (SQL inte körd) eller något krånglar: fail open --
  // hellre fri access än att låsa ute alla av misstag.
  if (error) return false;
  return data?.value === "true";
}

export async function getMembershipState(memberId: string): Promise<MembershipState> {
  const enabled = await isPaywallEnabled();
  if (!enabled) {
    return { enabled: false, paid: true, paidUntil: null, freeSetIds: [] };
  }

  const { data: member } = await supabaseAdmin
    .from("members")
    .select("paid_until")
    .eq("id", memberId)
    .maybeSingle();
  const paidUntil: string | null = (member as any)?.paid_until ?? null;
  const paid = !!paidUntil && new Date(paidUntil) > new Date();

  const { data: rows } = await supabaseAdmin
    .from("member_cards")
    .select("created_at, cards(set_id)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: true });

  const seen: string[] = [];
  for (const r of (rows as any[]) ?? []) {
    const setId = r.cards?.set_id;
    if (setId && !seen.includes(setId)) seen.push(setId);
  }

  return { enabled, paid, paidUntil, freeSetIds: seen.slice(0, FREE_SET_LIMIT) };
}

// Får medlemmen lägga in kort i det här setet?
export function canUseSet(state: MembershipState, setId: string): boolean {
  if (!state.enabled || state.paid) return true;
  if (state.freeSetIds.includes(setId)) return true;
  return state.freeSetIds.length < FREE_SET_LIMIT;
}
