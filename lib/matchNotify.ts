import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { variantLabel } from "@/lib/variant";
import { Variant } from "@/lib/types";

// När en medlem gör ett kort tillgängligt (Har + Säljer/Byter) får alla andra
// medlemmar som söker EXAKT samma kort (samma variant och parallel) en notis
// i Meddelanden. Ingen identitet röjs -- det avslöjas som förut först via
// Mina matchningar. Samma notis skickas högst en gång per medlem och kort
// inom 7 dagar, så att av/på-klickande inte spammar.
export async function notifyWanters(opts: {
  ownerId: string;
  cardId: string;
  variant: Variant;
  parallelTierId: string | null;
}) {
  try {
    let q = supabaseAdmin
      .from("member_cards")
      .select("member_id")
      .eq("card_id", opts.cardId)
      .eq("variant", opts.variant)
      .eq("status", "want")
      .neq("member_id", opts.ownerId);
    q = opts.parallelTierId
      ? q.eq("parallel_tier_id", opts.parallelTierId)
      : q.is("parallel_tier_id", null);
    const { data: wanters } = await q;
    const memberIds = Array.from(
      new Set((wanters ?? []).map((w: any) => w.member_id as string))
    );
    if (memberIds.length === 0) return;

    const { data: card } = await supabaseAdmin
      .from("cards")
      .select("name, number, sets(name)")
      .eq("id", opts.cardId)
      .maybeSingle();
    if (!card) return;
    const setName = (card as any).sets?.name ?? "";

    let tierName: string | null = null;
    if (opts.parallelTierId) {
      const { data: tier } = await supabaseAdmin
        .from("parallel_tiers")
        .select("name")
        .eq("id", opts.parallelTierId)
        .maybeSingle();
      tierName = (tier as any)?.name ?? null;
    }

    const body = `Nytt kort att köpa eller byta: ${card.name} (${
      tierName ?? variantLabel[opts.variant]
    })${setName ? ` i ${setName}` : ""}. Det står på din lista över kort du söker – se Mina matchningar.`;

    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: already } = await supabaseAdmin
      .from("member_notifications")
      .select("member_id")
      .eq("kind", "match")
      .eq("body", body)
      .gte("created_at", since)
      .in("member_id", memberIds);
    const skip = new Set((already ?? []).map((r: any) => r.member_id as string));

    const rows = memberIds
      .filter((id) => !skip.has(id))
      .map((id) => ({ member_id: id, kind: "match", body }));
    if (rows.length > 0) {
      await supabaseAdmin.from("member_notifications").insert(rows);
    }
  } catch {
    // En misslyckad notis ska aldrig stoppa själva sparandet.
  }
}
