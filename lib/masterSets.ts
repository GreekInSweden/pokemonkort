import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Master Set-väggen. En medlem hamnar där när ALLA kort i ett set är
// markerade som "Har" och det varit så i minst MASTER_HOLD_MS (en timme).
//   master = alla varianter förutom reverse holo (normal, holo)
//   grand  = master + även varje reverse holo (bara set som har sådana)
// Kravet på en timme gör att man inte hamnar där av en snabb knapptryckning.
// Servern kollar efter varje ändring i portföljen (evaluateMasterSets) och
// väggen visar bara poster som varit kompletta tillräckligt länge, så ingen
// schemalagd körning behövs.
export const MASTER_HOLD_MS = 60 * 60 * 1000;

export type MasterLevel = "master" | "grand";

// PostgREST returnerar högst 1000 rader per anrop -- hämta alla sidor.
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: any; error: any }>
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw error;
    const rows = (data as T[]) ?? [];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

// Anropas efter att en medlems "Har"-kort ändrats. Best-effort: ett fel här
// får aldrig stoppa själva portföljsparningen.
export async function evaluateMasterSets(memberId: string, cardIds: string[]): Promise<void> {
  try {
    if (cardIds.length === 0) return;
    const { data: cardSets } = await supabaseAdmin
      .from("cards")
      .select("set_id, sets!inner(product_line)")
      .in("id", cardIds.slice(0, 1000));
    const setIds = Array.from(
      new Set(
        ((cardSets as any[]) ?? [])
          .filter((r) => (Array.isArray(r.sets) ? r.sets[0] : r.sets)?.product_line === "pokemon")
          .map((r) => r.set_id as string)
      )
    );
    for (const setId of setIds) await evaluateSet(memberId, setId);
  } catch {
    /* best-effort */
  }
}

async function evaluateSet(memberId: string, setId: string) {
  const required = await fetchAll<{ card_id: string; variant: string }>((a, b) =>
    supabaseAdmin
      .from("card_variants")
      .select("card_id, variant, cards!inner(set_id)")
      .eq("cards.set_id", setId)
      .order("card_id")
      .order("variant")
      .range(a, b)
  );
  const have = await fetchAll<{ card_id: string; variant: string }>((a, b) =>
    supabaseAdmin
      .from("member_cards")
      .select("card_id, variant, cards!inner(set_id)")
      .eq("member_id", memberId)
      .eq("status", "have")
      .is("parallel_tier_id", null)
      .eq("cards.set_id", setId)
      .order("card_id")
      .order("variant")
      .range(a, b)
  );
  const haveSet = new Set(have.map((r) => `${r.card_id}:${r.variant}`));
  const masterReq = required.filter((r) => r.variant !== "reverse_holo");
  const hasReverse = required.some((r) => r.variant === "reverse_holo");

  const complete: Record<MasterLevel, boolean> = {
    master: masterReq.length > 0 && masterReq.every((r) => haveSet.has(`${r.card_id}:${r.variant}`)),
    grand:
      hasReverse &&
      required.length > 0 &&
      required.every((r) => haveSet.has(`${r.card_id}:${r.variant}`)),
  };

  const holdLimit = new Date(Date.now() - MASTER_HOLD_MS).toISOString();
  for (const level of ["master", "grand"] as MasterLevel[]) {
    if (complete[level]) {
      // ignoreDuplicates: behåll ursprunglig complete_since så timern inte nollas.
      await supabaseAdmin
        .from("master_set_claims")
        .upsert(
          { member_id: memberId, set_id: setId, level },
          { onConflict: "member_id,set_id,level", ignoreDuplicates: true }
        );
    } else {
      // Inte komplett längre: poster som ännu inte hunnit synas (timern)
      // nollställs. Poster som redan hamnat på väggen ligger kvar.
      await supabaseAdmin
        .from("master_set_claims")
        .delete()
        .eq("member_id", memberId)
        .eq("set_id", setId)
        .eq("level", level)
        .gt("complete_since", holdLimit);
    }
  }
}

export interface HallEntry {
  username: string;
  level: MasterLevel;
  since: string;
}
export interface HallSet {
  setId: string;
  setName: string;
  slug: string;
  era: string;
  releaseDate: string | null;
  members: HallEntry[];
}

// Alla poster som hunnit synas, grupperade per set (ett namn en gång per
// set -- grand slår master).
export async function getMasterSetHall(): Promise<HallSet[]> {
  const limit = new Date(Date.now() - MASTER_HOLD_MS).toISOString();
  const rows = await fetchAll<any>((a, b) =>
    supabaseAdmin
      .from("master_set_claims")
      .select(
        "level, complete_since, member_id, members!inner(username), sets!inner(id, name, slug, category_name, release_date)"
      )
      .lte("complete_since", limit)
      .not("members.username", "is", null)
      .order("complete_since")
      .range(a, b)
  );
  const bySet = new Map<string, HallSet>();
  for (const r of rows) {
    const m = Array.isArray(r.members) ? r.members[0] : r.members;
    const s = Array.isArray(r.sets) ? r.sets[0] : r.sets;
    if (!m?.username || !s) continue;
    let hs = bySet.get(s.id);
    if (!hs) {
      hs = {
        setId: s.id,
        setName: s.name,
        slug: s.slug,
        era: s.category_name,
        releaseDate: s.release_date ?? null,
        members: [],
      };
      bySet.set(s.id, hs);
    }
    const existing = hs.members.find((x) => x.username === m.username);
    if (existing) {
      if (r.level === "grand") existing.level = "grand";
    } else {
      hs.members.push({ username: m.username, level: r.level, since: r.complete_since });
    }
  }
  return Array.from(bySet.values());
}

export function countHall(hall: HallSet[]): number {
  return hall.reduce((n, s) => n + s.members.length, 0);
}

export async function getMasterSetCount(): Promise<number> {
  try {
    return countHall(await getMasterSetHall());
  } catch {
    return 0;
  }
}
