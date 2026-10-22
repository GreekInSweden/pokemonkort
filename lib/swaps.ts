import { createHmac } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Variant } from "@/lib/types";

// Per annan medlem: vilka av MINA önskade kort hen har tillgängliga ("youGet")
// och vilka av MINA kort till byte som hen söker ("youGive"). Ger två vyer:
//  - Perfekt byte: youGive finns OCH minst ett youGet går att byta.
//  - Samlat köp: samma medlem har flera av korten jag söker.
// Identiteten lämnas aldrig ut här -- bara en nyckel (HMAC) som gäller för
// just den som tittar. Kontakten avslöjas först via /byten/reveal.

export interface SwapItem {
  cardId: string;
  cardNumber: number;
  cardName: string;
  setName: string;
  variant: Variant;
  parallelTierId: string | null;
  parallelTierName: string | null;
  sellable?: boolean;
  tradeable?: boolean;
}

export interface SwapGroup {
  memberId: string; // internt -- skickas aldrig till webbläsaren
  key: string;
  youGet: SwapItem[];
  youGive: SwapItem[];
  isSwap: boolean;
}

export function groupKey(viewerId: string, otherId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-secret";
  return createHmac("sha256", secret).update(`${viewerId}:${otherId}`).digest("hex").slice(0, 24);
}

const k = (cardId: string, variant: string, tier: string | null) =>
  `${cardId}:${variant}:${tier ?? ""}`;

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export async function computeGroups(memberId: string): Promise<SwapGroup[]> {
  const { data: mine } = await supabaseAdmin
    .from("member_cards")
    .select("card_id, variant, status, sellable, tradeable, parallel_tier_id")
    .eq("member_id", memberId);
  const rows = (mine as any[]) ?? [];
  const wants = rows.filter((r) => r.status === "want");
  const tradeHaves = rows.filter((r) => r.status === "have" && r.tradeable);
  if (wants.length === 0) return [];

  const wantKeys = new Set(wants.map((r) => k(r.card_id, r.variant, r.parallel_tier_id)));
  const tradeKeys = new Set(tradeHaves.map((r) => k(r.card_id, r.variant, r.parallel_tier_id)));

  // Andras tillgängliga kort som jag söker.
  const othersHave: any[] = [];
  for (const ids of chunk(Array.from(new Set(wants.map((r) => r.card_id as string))), 100)) {
    const { data } = await supabaseAdmin
      .from("member_cards")
      .select("member_id, card_id, variant, sellable, tradeable, parallel_tier_id")
      .eq("status", "have")
      .or("sellable.eq.true,tradeable.eq.true")
      .neq("member_id", memberId)
      .in("card_id", ids);
    othersHave.push(...((data as any[]) ?? []));
  }

  // Andras önskade kort som jag kan byta bort.
  const othersWant: any[] = [];
  for (const ids of chunk(Array.from(new Set(tradeHaves.map((r) => r.card_id as string))), 100)) {
    const { data } = await supabaseAdmin
      .from("member_cards")
      .select("member_id, card_id, variant, parallel_tier_id")
      .eq("status", "want")
      .neq("member_id", memberId)
      .in("card_id", ids);
    othersWant.push(...((data as any[]) ?? []));
  }

  type Raw = { cardId: string; variant: Variant; tier: string | null; sellable?: boolean; tradeable?: boolean };
  const byMember = new Map<string, { get: Raw[]; give: Raw[] }>();
  const slot = (id: string) => {
    let s = byMember.get(id);
    if (!s) byMember.set(id, (s = { get: [], give: [] }));
    return s;
  };
  for (const r of othersHave) {
    if (!wantKeys.has(k(r.card_id, r.variant, r.parallel_tier_id))) continue;
    slot(r.member_id).get.push({
      cardId: r.card_id,
      variant: r.variant,
      tier: r.parallel_tier_id ?? null,
      sellable: !!r.sellable,
      tradeable: !!r.tradeable,
    });
  }
  for (const r of othersWant) {
    if (!tradeKeys.has(k(r.card_id, r.variant, r.parallel_tier_id))) continue;
    slot(r.member_id).give.push({
      cardId: r.card_id,
      variant: r.variant,
      tier: r.parallel_tier_id ?? null,
    });
  }

  // Bara medlemmar som har minst ett kort jag söker är intressanta.
  const candidates = Array.from(byMember.entries()).filter(([, v]) => v.get.length > 0);
  if (candidates.length === 0) return [];

  // Kortuppgifter + parallelnamn för allt som ska visas.
  const cardIds = new Set<string>();
  const tierIds = new Set<string>();
  for (const [, v] of candidates)
    for (const r of [...v.get, ...v.give]) {
      cardIds.add(r.cardId);
      if (r.tier) tierIds.add(r.tier);
    }
  const cardInfo = new Map<string, { number: number; name: string; setName: string }>();
  for (const ids of chunk(Array.from(cardIds), 100)) {
    const { data } = await supabaseAdmin
      .from("cards")
      .select("id, number, name, sets(name)")
      .in("id", ids);
    for (const c of (data as any[]) ?? [])
      cardInfo.set(c.id, { number: c.number, name: c.name, setName: c.sets?.name ?? "" });
  }
  const tierName = new Map<string, string>();
  if (tierIds.size > 0) {
    const { data } = await supabaseAdmin
      .from("parallel_tiers")
      .select("id, name")
      .in("id", Array.from(tierIds));
    for (const t of (data as any[]) ?? []) tierName.set(t.id, t.name);
  }

  const toItem = (r: Raw): SwapItem => {
    const c = cardInfo.get(r.cardId);
    return {
      cardId: r.cardId,
      cardNumber: c?.number ?? 0,
      cardName: c?.name ?? "Okänt kort",
      setName: c?.setName ?? "",
      variant: r.variant,
      parallelTierId: r.tier,
      parallelTierName: r.tier ? tierName.get(r.tier) ?? null : null,
      sellable: r.sellable,
      tradeable: r.tradeable,
    };
  };

  const groups: SwapGroup[] = candidates.map(([otherId, v]) => ({
    memberId: otherId,
    key: groupKey(memberId, otherId),
    youGet: v.get.map(toItem),
    youGive: v.give.map(toItem),
    isSwap: v.give.length > 0 && v.get.some((g) => g.tradeable),
  }));

  groups.sort((a, b) => {
    if (a.isSwap !== b.isSwap) return a.isSwap ? -1 : 1;
    const sa = a.isSwap ? Math.min(a.youGet.length, a.youGive.length) : a.youGet.length;
    const sb = b.isSwap ? Math.min(b.youGet.length, b.youGive.length) : b.youGet.length;
    return sb - sa || b.youGet.length - a.youGet.length;
  });
  return groups.slice(0, 30);
}
