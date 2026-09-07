"use client";

import { useEffect, useState, useCallback } from "react";
import { AuctionListing } from "@/lib/types";
import { rarityLabel } from "@/lib/rarity";
import CardImage from "@/components/CardImage";

function timeLeftLabel(endsAt: string): string {
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (diffMs <= 0) return "Avslutad";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h kvar`;
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  if (hours > 0) return `${hours}h ${minutes}m kvar`;
  return `${minutes}m kvar`;
}

export default function AuktionerPage() {
  const [auctions, setAuctions] = useState<AuctionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAuction, setActiveAuction] = useState<AuctionListing | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auctions");
    const data = await res.json();
    if (data.auctions) setAuctions(data.auctions);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000); // poll every 20s for near-live updates
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-14">
      <h1 className="font-display text-4xl font-bold text-paper mb-2">
        Auktioner
      </h1>
      <p className="text-mute mb-10 max-w-prose">
        Buda på våra mest värdefulla kort. Högsta bud vid sluttid vinner —
        vi hör av oss för betalning via Swish.
      </p>

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : auctions.length === 0 ? (
        <div className="border border-line rounded-md p-8 text-mute max-w-xl">
          Inga pågående auktioner just nu.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions.map((a) => (
            <button
              key={a.auctionId}
              onClick={() => setActiveAuction(a)}
              className="focus-ring text-left border border-line rounded-md overflow-hidden bg-panel hover:border-gold transition-colors"
            >
              <CardImage
                src={a.imageUrl}
                alt={a.cardName}
                number={a.cardNumber}
                rarity={a.rarity}
                className="w-full aspect-[3/4]"
              />
              <div className="p-4">
                <div className="font-mono text-xs text-mute mb-1">
                  #{String(a.cardNumber).padStart(3, "0")} ·{" "}
                  {rarityLabel[a.rarity]}
                </div>
                <div className="font-display font-semibold text-paper mb-2">
                  {a.cardName}{" "}
                  <span className="text-mute text-sm font-body">
                    ({a.variant === "holo" ? "Holo" : "Vanligt"})
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-gold font-semibold">
                    {a.currentHighSek} kr
                  </span>
                  <span className="text-xs text-mute">
                    {a.bidCount} bud
                  </span>
                </div>
                <div className="text-xs text-mute mt-1 font-mono">
                  {timeLeftLabel(a.endsAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeAuction && (
        <BidModal
          auction={activeAuction}
          onClose={() => setActiveAuction(null)}
          onBidPlaced={load}
        />
      )}
    </div>
  );
}

function BidModal({
  auction,
  onClose,
  onBidPlaced,
}: {
  auction: AuctionListing;
  onClose: () => void;
  onBidPlaced: () => void;
}) {
  const minBid = auction.currentHighSek + auction.minIncrementSek;
  const [amount, setAmount] = useState(minBid);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auctionId: auction.auctionId,
        bidderName: name,
        email,
        phone,
        amountSek: amount,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Något gick fel.");
      return;
    }
    setSuccess(true);
    onBidPlaced();
    setTimeout(onClose, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-line rounded-md max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-xs text-mute mb-1">
          #{String(auction.cardNumber).padStart(3, "0")}
        </div>
        <h2 className="font-display text-xl font-bold text-paper mb-1">
          {auction.cardName}
        </h2>
        <p className="text-sm text-mute mb-4">
          Högsta bud just nu: <span className="text-gold">{auction.currentHighSek} kr</span>{" "}
          · Minsta bud: {minBid} kr
        </p>

        {success ? (
          <p className="text-gold">Bud lagt! Vi hör av oss om du vinner.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-mute mb-1 block">Ditt bud (kr)</span>
              <input
                type="number"
                min={minBid}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="focus-ring w-full bg-ink border border-line rounded-sm px-3 py-2 text-paper"
              />
            </label>
            <label className="block">
              <span className="text-sm text-mute mb-1 block">Namn</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="focus-ring w-full bg-ink border border-line rounded-sm px-3 py-2 text-paper"
              />
            </label>
            <label className="block">
              <span className="text-sm text-mute mb-1 block">E-post</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring w-full bg-ink border border-line rounded-sm px-3 py-2 text-paper"
              />
            </label>
            <label className="block">
              <span className="text-sm text-mute mb-1 block">Telefon</span>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="focus-ring w-full bg-ink border border-line rounded-sm px-3 py-2 text-paper"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring w-full rounded-sm bg-gold text-ink font-semibold py-3 disabled:opacity-50"
            >
              {submitting ? "Skickar…" : "Lägg bud"}
            </button>
          </form>
        )}
        <button
          onClick={onClose}
          className="focus-ring w-full text-center text-sm text-mute hover:text-paper mt-3"
        >
          Stäng
        </button>
      </div>
    </div>
  );
}
