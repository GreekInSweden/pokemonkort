"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuctionWin } from "@/lib/types";
import { rarityLabel } from "@/lib/rarity";
import { variantLabel } from "@/lib/variant";
import CardImage from "@/components/CardImage";

export default function AuctionWinPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-20 text-mute">Laddar…</div>}>
      <AuctionWinContent />
    </Suspense>
  );
}

function AuctionWinContent() {
  const searchParams = useSearchParams();
  const winId = searchParams.get("win");

  const [win, setWin] = useState<AuctionWin | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!winId) {
      setLoading(false);
      return;
    }
    fetch(`/api/auction-win?id=${encodeURIComponent(winId)}`)
      .then((res) => res.json())
      .then((data) => setWin(data.win ?? null))
      .finally(() => setLoading(false));
  }, [winId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!winId) return;
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auction-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winId, name, email, phone }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Något gick fel.");
      return;
    }
    setWin((w) => (w ? { ...w, status: "claimed" } : w));
  }

  if (loading) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-mute">Laddar…</div>;
  }

  if (!win) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-paper mb-3">
          Hittade ingen vinst
        </h1>
        <p className="text-mute mb-6">
          Länken saknas eller är felaktig. Om du precis vann en auktion,
          gå tillbaka till auktionssidan — en ruta för din vinst dyker upp
          där automatiskt.
        </p>
        <Link
          href="/auktioner"
          className="focus-ring inline-block rounded-sm border border-line px-6 py-3 text-paper hover:border-gold"
        >
          Till auktionerna
        </Link>
      </div>
    );
  }

  if (win.status === "expired") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-paper mb-3">
          Tiden gick ut
        </h1>
        <p className="text-mute mb-6">
          Vinsten för {win.cardName} hämtades inte ut inom en vecka och
          kortet läggs ut igen.
        </p>
        <Link
          href="/auktioner"
          className="focus-ring inline-block rounded-sm border border-line px-6 py-3 text-paper hover:border-gold"
        >
          Till auktionerna
        </Link>
      </div>
    );
  }

  const reference = `AUK-${win.winId.slice(0, 8).toUpperCase()}`;
  const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || "[fyll i ditt Swish-nummer]";

  return (
    <div className="max-w-xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl font-bold text-paper mb-2">
        🎉 Grattis, du vann!
      </h1>
      <p className="text-mute mb-8">
        Sista steget är att fylla i dina uppgifter och betala via Swish.
      </p>

      <div className="border border-line rounded-md p-4 bg-panel mb-8 flex gap-4">
        {win.imageUrl && (
          <CardImage
            src={win.imageUrl}
            alt={win.cardName}
            number={win.cardNumber}
            rarity={win.rarity}
            className="w-20 aspect-[3/4] rounded-sm shrink-0"
          />
        )}
        <div>
          <div className="font-mono text-xs text-mute mb-1">
            #{String(win.cardNumber).padStart(3, "0")} · {rarityLabel[win.rarity]}
          </div>
          <div className="font-display font-semibold text-paper mb-1">
            {win.cardName}{" "}
            <span className="text-mute text-sm font-body">
              ({variantLabel[win.variant]})
            </span>
          </div>
          <div className="font-mono text-gold font-semibold">{win.amountSek} kr</div>
        </div>
      </div>

      {win.status === "pending" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-paper">
            Dina uppgifter
          </h2>
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
            {submitting ? "Sparar…" : "Spara & visa Swish-betalning"}
          </button>
        </form>
      ) : (
        <div className="border border-gold rounded-md p-6 bg-gold/5">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-3 rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/swish-qr?amount=${win.amountSek}&message=${encodeURIComponent(reference)}`}
                alt="Swish QR-kod"
                width={220}
                height={220}
              />
            </div>
          </div>
          <div className="text-sm text-mute mb-1">Swisha</div>
          <div className="font-mono text-3xl font-bold text-gold mb-4">
            {win.amountSek} kr
          </div>
          <div className="text-sm text-mute mb-1">Till</div>
          <div className="font-mono text-xl text-paper mb-4">{swishNumber}</div>
          <div className="text-sm text-mute mb-1">Meddelande (viktigt!)</div>
          <div className="font-mono text-xl text-paper mb-4">{reference}</div>
          <p className="text-xs text-mute">
            Scanna QR-koden för att öppna Swish med belopp och meddelande
            ifyllt. Vi skickar kortet så snart betalningen kommit in.
          </p>
        </div>
      )}
    </div>
  );
}
