import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Vilka Pokémon (nationellt Pokédex-nr) en medlem samlat:
//  auto   = har minst ett kort av den i portföljen (status "have")
//  manual = ikryssade för hand i Pokédex-samlingen
// Bara serversidan (använder service-role).
export async function getDexOwnership(
  memberId: string
): Promise<{ auto: number[]; manual: number[] }> {
  const auto = new Set<number>();
  const { data: have } = await supabaseAdmin
    .from("member_cards")
    .select("cards(dex_numbers)")
    .eq("member_id", memberId)
    .eq("status", "have")
    .limit(20000);
  for (const row of (have as any[]) ?? []) {
    const card = Array.isArray(row.cards) ? row.cards[0] : row.cards;
    for (const n of card?.dex_numbers ?? []) auto.add(n);
  }

  const { data: man } = await supabaseAdmin
    .from("member_dex")
    .select("dex_number")
    .eq("member_id", memberId);
  const manual = ((man as any[]) ?? []).map((r) => r.dex_number as number);
  return { auto: Array.from(auto), manual };
}
