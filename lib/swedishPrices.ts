import { supabaseAdmin } from "@/lib/supabaseAdmin";

// "Svenskt pris": vad kortet kostar i vår egen butik just nu och vad det senast
// såldes för hos oss (betalda/skickade beställningar och betalda/avhämtade
// auktioner). Ett eget prisunderlag bredvid Cardmarket. Allt är best-effort:
// saknas tabeller eller data blir det helt enkelt inget pris -- sidan ska
// aldrig gå sönder av det.
import type { SwedishPrice } from "@/lib/swedishPricesFormat";
export type { SwedishPrice };

type Filter = { setId: string } | { cardIds: string[] };

export async function getSwedishPrices(f: Filter): Promise<Record<string, SwedishPrice>> {
  const out: Record<string, SwedishPrice> = {};
  const bump = (cardId: string) => (out[cardId] ??= {});

  // Varianter (butikspris + koppling variant -> kort).
  const variantCard = new Map<string, string>();
  try {
    let q = supabaseAdmin
      .from("card_variants")
      .select("id, card_id, price_sek, stock, cards!inner(set_id)");
    q = "setId" in f ? q.eq("cards.set_id", f.setId) : q.in("card_id", f.cardIds);
    const { data } = await q;
    for (const v of (data as any[]) ?? []) {
      variantCard.set(v.id, v.card_id);
      const price = Number(v.price_sek);
      if (v.stock > 0 && price > 0) {
        const o = bump(v.card_id);
        o.shop = o.shop === undefined ? price : Math.min(o.shop, price);
      }
    }
  } catch {
    // inget butikspris
  }
  if (variantCard.size === 0) return out;

  const sold: { cardId: string; price: number; at: string }[] = [];

  // Beställningar (betalda/skickade).
  try {
    let q = supabaseAdmin
      .from("order_items")
      .select(
        "card_variant_id, unit_price_sek, orders!inner(status, created_at), card_variants!inner(cards!inner(set_id))"
      )
      .in("orders.status", ["paid", "shipped"]);
    q =
      "setId" in f
        ? q.eq("card_variants.cards.set_id", f.setId)
        : q.in("card_variant_id", Array.from(variantCard.keys()));
    const { data } = await q;
    for (const r of (data as any[]) ?? []) {
      const cardId = variantCard.get(r.card_variant_id);
      const price = Number(r.unit_price_sek);
      if (cardId && price > 0) sold.push({ cardId, price, at: r.orders?.created_at ?? "" });
    }
  } catch {
    // hoppa över
  }

  // Auktioner (betalda / avhämtade vinster).
  try {
    let q = supabaseAdmin
      .from("auction_wins")
      .select(
        "amount_sek, created_at, status, auctions!inner(card_variant_id, card_variants!inner(cards!inner(set_id)))"
      )
      .in("status", ["claimed", "paid"]);
    if ("setId" in f) q = q.eq("auctions.card_variants.cards.set_id", f.setId);
    const { data } = await q;
    for (const r of (data as any[]) ?? []) {
      const cardId = variantCard.get(r.auctions?.card_variant_id);
      const price = Number(r.amount_sek);
      if (cardId && price > 0) sold.push({ cardId, price, at: r.created_at ?? "" });
    }
  } catch {
    // hoppa över
  }

  for (const s of sold) {
    const o = bump(s.cardId);
    if (!o.soldAt || s.at > o.soldAt) {
      o.sold = s.price;
      o.soldAt = s.at;
    }
  }
  return out;
}
