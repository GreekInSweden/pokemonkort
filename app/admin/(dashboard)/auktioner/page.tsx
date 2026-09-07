import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import CloseAuctionButton from "@/components/admin/CloseAuctionButton";

export const dynamic = "force-dynamic";

export default async function AdminAuktionerPage() {
  const supabase = createServerSupabase();

  const { data: auctions } = await supabase
    .from("auctions")
    .select(
      "id, starting_price_sek, min_increment_sek, ends_at, status, card_variants(variant, cards(number, name))"
    )
    .order("created_at", { ascending: false });

  const withBids = await Promise.all(
    (auctions ?? []).map(async (a: any) => {
      const { data: bids } = await supabase
        .from("bids")
        .select("bidder_name, email, phone, amount_sek, created_at")
        .eq("auction_id", a.id)
        .order("amount_sek", { ascending: false });
      return { ...a, bids: bids ?? [] };
    })
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-paper mb-1">
            Auktioner
          </h1>
          <p className="text-mute text-sm">
            Se bud och kontaktuppgifter, avsluta när du kontaktat vinnaren.
          </p>
        </div>
        <Link
          href="/admin/auktioner/ny"
          className="focus-ring rounded-sm bg-gold text-ink font-semibold px-4 py-2 text-sm shrink-0"
        >
          + Ny auktion
        </Link>
      </div>

      {withBids.length === 0 ? (
        <p className="text-mute">Inga auktioner ännu.</p>
      ) : (
        <div className="space-y-4">
          {withBids.map((a: any) => {
            const card = a.card_variants?.cards;
            const topBid = a.bids[0];
            const ended = new Date(a.ends_at) < new Date();
            return (
              <div
                key={a.id}
                className="border border-line rounded-md p-4 bg-panel"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-mono text-xs text-mute">
                      #{String(card?.number ?? 0).padStart(3, "0")} ·{" "}
                      {a.card_variants?.variant === "holo" ? "Holo" : "Vanligt"}
                    </div>
                    <div className="font-display font-semibold text-paper">
                      {card?.name ?? "Okänt kort"}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-sm ${
                      a.status === "open" && !ended
                        ? "bg-gold/10 text-gold"
                        : "bg-line text-mute"
                    }`}
                  >
                    {a.status === "open" && !ended ? "Pågår" : "Avslutad"}
                  </span>
                </div>

                <p className="text-xs text-mute mb-3">
                  Utrop: {a.starting_price_sek} kr · Slutar:{" "}
                  {new Date(a.ends_at).toLocaleString("sv-SE")}
                </p>

                {a.bids.length === 0 ? (
                  <p className="text-sm text-mute">Inga bud ännu.</p>
                ) : (
                  <div className="space-y-1">
                    {a.bids.map((b: any, i: number) => (
                      <div
                        key={i}
                        className={`text-sm flex items-center justify-between px-2 py-1 rounded-sm ${
                          i === 0 ? "bg-gold/10" : ""
                        }`}
                      >
                        <span className={i === 0 ? "text-gold font-medium" : "text-paper"}>
                          {i === 0 && "🏆 "}
                          {b.bidder_name} — {b.email} · {b.phone}
                        </span>
                        <span className="font-mono">{b.amount_sek} kr</span>
                      </div>
                    ))}
                  </div>
                )}

                {a.status === "open" && (
                  <div className="mt-3">
                    <CloseAuctionButton auctionId={a.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
