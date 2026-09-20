"use client";

import { useEffect, useState, useCallback } from "react";
import { AuctionListing } from "@/lib/types";
import { rarityLabel } from "@/lib/rarity";
import { variantLabel } from "@/lib/variant";
import CardImage from "@/components/CardImage";
import CountdownTimer from "@/components/CountdownTimer";

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
                    ({variantLabel[a.variant]})
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
                {!a.reserveMet && a.bidCount > 0 && (
                  <div className="text-xs text-amber-400/90 mt-1">
                    Minimipris ej uppnått ännu
                  </div>
                )}
                <div className="mt-1">
                  <CountdownTimer endsAt={a.endsAt} />
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
  const [showBack, setShowBack] = useState(false);
  const [endsAt, setEndsAt] = useState(auction.endsAt);
  const [extended, setExtended] = useState(false);

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
    if (data.extendedEndsAt) {
      setEndsAt(data.extendedEndsAt);
      setExtended(true);
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
        {(auction.imageUrl || auction.backImageUrl) && (
          <div className="mb-4">
            <CardImage
              src={showBack ? auction.backImageUrl : auction.imageUrl}
              alt={auction.cardName}
              number={auction.cardNumber}
              rarity={auction.rarity}
              className="w-full aspect-[3/4] rounded-sm mb-2"
            />
            {auction.backImageUrl && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBack(false)}
                  className={`focus-ring flex-1 text-xs rounded-sm border px-2 py-1 ${
                    !showBack
                      ? "border-gold text-gold"
                      : "border-line text-mute hover:border-mute"
                  }`}
                >
                  Framsida
                </button>
                <button
                  onClick={() => setShowBack(true)}
                  className={`focus-ring flex-1 text-xs rounded-sm border px-2 py-1 ${
                    showBack
                      ? "border-gold text-gold"
                      : "border-line text-mute hover:border-mute"
                  }`}
                >
                  Baksida
                </button>
              </div>
            )}
          </div>
        )}

        <div className="font-mono text-xs text-mute mb-1">
          #{String(auction.cardNumber).padStart(3, "0")}
        </div>
        <h2 className="font-display text-xl font-bold text-paper mb-1">
          {auction.cardName}
        </h2>
        <div className="mb-2">
          <CountdownTimer endsAt={endsAt} size="lg" />
        </div>
        <p className="text-sm text-mute mb-4">
          Högsta bud just nu: <span className="text-gold">{auction.currentHighSek} kr</span>{" "}
          · Minsta bud: {minBid} kr
        </p>
        {!auction.reserveMet && auction.bidCount > 0 && (
          <p className="text-xs text-amber-400/90 mb-4">
            Minimipris ej uppnått ännu — säljaren kan välja att inte sälja
            om inget högre bud kommer in innan sluttid.
          </p>
        )}
        {extended && (
          <p className="text-xs text-gold mb-4">
            Ditt bud kom in nära sluttid, så auktionen förlängdes med 3
            minuter.
          </p>
        )}
        <p className="text-xs text-mute mb-4">
          Bud inom sista 3 minuterna förlänger auktionen automatiskt med 3
          minuter.
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
