"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AuctionListing, AuctionWin, Member } from "@/lib/types";
import { memberLabel } from "@/lib/memberLabel";
import { rarityLabel } from "@/lib/rarity";
import { variantLabel } from "@/lib/variant";
import CardImage from "@/components/CardImage";
import CountdownTimer from "@/components/CountdownTimer";

export default function AuktionerPage() {
  const [auctions, setAuctions] = useState<AuctionListing[]>([]);
  const [loading, setLoading] = useState(true);
  // Id istället för en hel kopia av auktionen -- då följer den öppna
  // budrutan med när sidan hämtar ny data var 20:e sekund (nytt högsta bud,
  // "du har blivit överbjuden" osv) istället för att visa gammal data.
  const [activeAuctionId, setActiveAuctionId] = useState<string | null>(null);
  const [win, setWin] = useState<AuctionWin | null>(null);
  const [member, setMember] = useState<Member | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auctions");
      const data = await res.json();
      if (data.auctions) setAuctions(data.auctions);
    } catch {
      // Transient network hiccup on a 20s poll — just try again next tick.
    } finally {
      setLoading(false);
    }
  }, []);

  const checkWin = useCallback(async () => {
    try {
      const res = await fetch("/api/auction-win");
      const data = await res.json();
      setWin(data.win ?? null);
    } catch {
      // Ignore — next poll will retry.
    }
  }, []);

  const loadMember = useCallback(async () => {
    try {
      const res = await fetch("/api/member/me");
      const data = await res.json();
      setMember(data.member ?? null);
    } catch {
      setMember(null);
    }
  }, []);

  useEffect(() => {
    load();
    checkWin();
    loadMember();
    const interval = setInterval(() => {
      load();
      checkWin();
    }, 20000); // poll every 20s for near-live updates
    return () => clearInterval(interval);
  }, [load, checkWin, loadMember]);

  const activeAuction = auctions.find((a) => a.auctionId === activeAuctionId) ?? null;
  const outbidAuctions = auctions.filter((a) => a.viewerStatus === "outbid");

  return (
    <div className="max-w-6xl mx-auto px-4 py-14">
      <h1 className="font-display text-4xl font-bold text-paper mb-2">
        Auktioner
      </h1>
      <p className="text-mute mb-6 max-w-prose">
        Buda på våra mest värdefulla kort. Högsta bud vid sluttid vinner —
        vinner du dyker en betalsida upp här automatiskt.{" "}
        {member === null && (
          <>
            Du behöver vara{" "}
            <Link href="/konto/logga-in?next=/auktioner" className="text-gold hover:underline">
              inloggad
            </Link>{" "}
            för att buda.
          </>
        )}
      </p>

      {win && (
        <Link
          href={`/auktioner/vinst?win=${win.winId}`}
          className="focus-ring block border border-gold rounded-md p-4 bg-gold/10 mb-8 hover:bg-gold/15 transition-colors"
        >
          <p className="font-display font-semibold text-gold mb-1">
            🎉 Du vann auktionen för {win.cardName}!
          </p>
          <p className="text-sm text-paper">
            Klicka här för att betala — {win.amountSek} kr.
          </p>
        </Link>
      )}

      {outbidAuctions.length > 0 && (
        <div className="border border-amber-400/60 rounded-md p-4 bg-amber-400/10 mb-8">
          <p className="font-display font-semibold text-amber-400 mb-1">
            Du har blivit överbjuden på {outbidAuctions.length}{" "}
            {outbidAuctions.length === 1 ? "auktion" : "auktioner"}
          </p>
          <p className="text-sm text-paper">
            {outbidAuctions.map((a) => a.cardName).join(", ")}. Klicka på
            kortet och lägg ett högre maxbud om du vill ta tillbaka
            ledningen.
          </p>
        </div>
      )}

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
              onClick={() => setActiveAuctionId(a.auctionId)}
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
                {a.viewerStatus === "leading" ? (
                  <div className="text-xs font-semibold text-gold mt-1">
                    ✓ Du leder
                  </div>
                ) : a.viewerStatus === "outbid" ? (
                  <div className="text-xs font-semibold text-amber-400 mt-1">
                    ⚠ Du har blivit överbjuden
                  </div>
                ) : (
                  a.leadingMemberNumber !== null && (
                    <div className="text-xs text-mute mt-1">
                      Leder: {memberLabel(a.leadingMemberNumber, a.leadingUsername)}
                    </div>
                  )
                )}
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
          member={member ?? null}
          onClose={() => setActiveAuctionId(null)}
          onBidPlaced={() => {
            load();
            checkWin();
          }}
        />
      )}
    </div>
  );
}

function BidModal({
  auction,
  member,
  onClose,
  onBidPlaced,
}: {
  auction: AuctionListing;
  member: Member | null;
  onClose: () => void;
  onBidPlaced: () => void;
}) {
  const isLeading = auction.viewerStatus === "leading";
  const isOutbid = auction.viewerStatus === "outbid";
  // Utan bud än är första budet exakt startpriset (inte ett steg över).
  // Leder man själv gäller istället att man bara kan HÖJA sitt maxbud.
  const minBid = isLeading
    ? Math.max(auction.viewerMaxSek ?? 0, auction.currentHighSek) + 1
    : auction.bidCount === 0
    ? auction.startingPriceSek
    : auction.currentHighSek + auction.minIncrementSek;
  const [amount, setAmount] = useState(minBid);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    { outcome: "leading" | "outbid" | "raised"; yourMaxSek: number; currentHighSek: number } | null
  >(null);
  const [showBack, setShowBack] = useState(false);
  const [endsAt, setEndsAt] = useState(auction.endsAt);
  const [extended, setExtended] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId: auction.auctionId,
          amountSek: amount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (!res.ok) {
        setError(data.error ?? `Något gick fel (${res.status}).`);
        return;
      }
      if (data.extendedEndsAt) {
        setEndsAt(data.extendedEndsAt);
        setExtended(true);
      }
      setResult({
        outcome: data.outcome,
        yourMaxSek: data.yourMaxSek ?? amount,
        currentHighSek: data.currentHighSek ?? auction.currentHighSek,
      });
      onBidPlaced();
      // Lyckat bud stänger rutan efter en stund. Blir man direkt
      // överbjuden lämnas den öppen så beskedet hinner läsas.
      if (data.outcome !== "outbid") setTimeout(onClose, 2500);
    } catch {
      setSubmitting(false);
      setError("Kunde inte nå servern. Kontrollera internetuppkopplingen och försök igen.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-line rounded-md max-w-sm w-full max-h-[90vh] overflow-y-auto p-6"
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
        <p className="text-sm text-mute mb-3">
          Högsta bud just nu: <span className="text-gold">{auction.currentHighSek} kr</span>
          {!isLeading && (
            <>
              {" "}
              · Lägsta maxbud: {minBid} kr
            </>
          )}
        </p>

        {isLeading && (
          <p className="text-sm text-gold border border-gold/50 bg-gold/10 rounded-md p-3 mb-4">
            ✓ Du leder just nu
            {auction.viewerMaxSek ? <> · Ditt högsta bud: {auction.viewerMaxSek} kr</> : null}
          </p>
        )}
        {isOutbid && (
          <p className="text-sm text-amber-400 border border-amber-400/50 bg-amber-400/10 rounded-md p-3 mb-4">
            ⚠ Du har blivit överbjuden. Lägg ett högre maxbud nedan om du
            vill ta tillbaka ledningen.
          </p>
        )}

        {auction.bidHistory.length > 0 && (
          <div className="border border-line rounded-md mb-4 max-h-32 overflow-y-auto divide-y divide-line">
            {auction.bidHistory.map((b, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-1.5 text-xs ${
                  i === 0 ? "bg-gold/10 text-gold font-medium" : "text-mute"
                }`}
              >
                <span>
                  {i === 0 && "🏆 "}
                  {memberLabel(b.memberNumber, b.username)}
                </span>
                <span className="font-mono">{b.amountSek} kr</span>
              </div>
            ))}
          </div>
        )}

        {!auction.reserveMet && auction.bidCount > 0 && (
          <p className="text-xs text-amber-400/90 mb-4">
            Det här kortet har ett dolt lägsta pris som ännu inte är
            uppnått. Om inget bud når upp till det innan auktionen slutar
            säljs kortet inte, och vi kan välja att lägga upp det igen.
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

        {result ? (
          result.outcome === "outbid" ? (
            <div>
              <p className="text-sm text-amber-400 mb-3">
                Någon har redan ett högre maxbud, så du blev överbjuden
                direkt. Högsta bud är nu {result.currentHighSek} kr. Lägg
                ett högre maxbud om du vill ha kortet.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAmount(result.currentHighSek + auction.minIncrementSek);
                }}
                className="focus-ring w-full rounded-sm bg-gold text-ink font-semibold py-3"
              >
                Buda igen
              </button>
            </div>
          ) : result.outcome === "raised" ? (
            <p className="text-gold">
              Ditt högsta bud är höjt till {result.yourMaxSek} kr. Du leder
              fortfarande.
            </p>
          ) : (
            <p className="text-gold">
              Du leder med {result.currentHighSek} kr! Vi bjuder åt dig
              automatiskt upp till {result.yourMaxSek} kr om någon bjuder
              över.
            </p>
          )
        ) : !member ? (
          <div className="text-center">
            <p className="text-sm text-mute mb-3">
              Logga in på ditt medlemskonto för att buda.
            </p>
            <Link
              href={`/konto/logga-in?next=/auktioner`}
              className="focus-ring inline-block w-full rounded-sm bg-gold text-ink font-semibold py-3"
            >
              Logga in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-mute mb-1 block">
                {isLeading ? "Höj ditt högsta bud (kr)" : "Ditt högsta bud (kr)"}
              </span>
              <input
                type="number"
                min={minBid}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="focus-ring w-full bg-ink border border-line rounded-sm px-3 py-2 text-paper"
              />
            </label>
            <p className="text-xs text-mute">
              Ange det högsta du är beredd att betala. Vi bjuder åt dig
              automatiskt, {auction.minIncrementSek} kr i taget, bara så
              mycket som behövs för att du ska leda — upp till ditt högsta
              bud. Det beloppet syns aldrig för andra.
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring w-full rounded-sm bg-gold text-ink font-semibold py-3 disabled:opacity-50"
            >
              {submitting
                ? "Skickar…"
                : isLeading
                ? "Höj mitt högsta bud"
                : `Buda som ${memberLabel(member.memberNumber, member.username)}`}
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
