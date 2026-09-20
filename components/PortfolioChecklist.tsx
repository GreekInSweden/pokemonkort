"use client";

import { useMemo, useState } from "react";
import { Rarity, Variant } from "@/lib/types";
import { rarityAccent, rarityLabel } from "@/lib/rarity";
import { variantLabel } from "@/lib/variant";
import CardImage from "@/components/CardImage";

interface VariantRow {
  id: string;
  variant: Variant;
}

interface CardRow {
  id: string;
  number: number;
  name: string;
  rarity: Rarity;
  image_url: string | null;
  card_variants: VariantRow[];
}

type Status = "have" | "want";
type EntryKey = string; // `${cardId}:${variant}:${status}`

function key(cardId: string, variant: Variant, status: Status): EntryKey {
  return `${cardId}:${variant}:${status}`;
}

export default function PortfolioChecklist({
  setName,
  cards,
  initialEntries,
}: {
  setName: string;
  cards: CardRow[];
  initialEntries: { card_id: string; variant: Variant; status: Status }[];
}) {
  const [entries, setEntries] = useState<Set<EntryKey>>(
    () => new Set(initialEntries.map((e) => key(e.card_id, e.variant, e.status)))
  );
  const [pending, setPending] = useState<Set<EntryKey>>(new Set());
  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.number).padStart(3, "0").includes(q)
    );
  }, [cards, query]);

  const haveCount = Array.from(entries).filter((k) => k.endsWith(":have")).length;
  const wantCount = Array.from(entries).filter((k) => k.endsWith(":want")).length;

  async function toggle(cardId: string, variant: Variant, status: Status) {
    const k = key(cardId, variant, status);
    const isActive = entries.has(k);
    setPending((p) => new Set(p).add(k));

    if (isActive) {
      await fetch("/api/member/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, variant, status }),
      });
      setEntries((e) => {
        const next = new Set(e);
        next.delete(k);
        return next;
      });
    } else {
      await fetch("/api/member/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, variant, status }),
      });
      setEntries((e) => new Set(e).add(k));
    }

    setPending((p) => {
      const next = new Set(p);
      next.delete(k);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-lg font-semibold text-paper">
          {setName}
        </h2>
        <p className="text-xs text-mute font-mono">
          {haveCount} har · {wantCount} vill ha
        </p>
      </div>

      <input
        type="text"
        placeholder="Sök kort efter namn eller nummer…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="focus-ring w-full bg-panel border border-line rounded-sm px-3 py-2 text-paper text-sm mb-4"
      />

      <div className="space-y-2">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className={`border-l-4 ${rarityAccent[card.rarity]} border-y border-r border-line rounded-sm bg-panel p-3 flex items-center gap-3`}
          >
            <CardImage
              src={card.image_url}
              alt={card.name}
              number={card.number}
              rarity={card.rarity}
              className="w-12 aspect-[3/4] rounded-sm shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs text-mute">
                #{String(card.number).padStart(3, "0")} · {rarityLabel[card.rarity]}
              </div>
              <div className="font-display text-sm font-medium text-paper truncate">
                {card.name}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {card.card_variants.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-1 border border-line rounded-sm px-2 py-1"
                  >
                    <span className="text-xs text-mute mr-1">
                      {variantLabel[v.variant]}
                    </span>
                    <button
                      onClick={() => toggle(card.id, v.variant, "have")}
                      disabled={pending.has(key(card.id, v.variant, "have"))}
                      className={`focus-ring text-xs rounded-sm px-2 py-0.5 disabled:opacity-50 ${
                        entries.has(key(card.id, v.variant, "have"))
                          ? "bg-gold text-ink font-semibold"
                          : "border border-line text-mute hover:border-gold"
                      }`}
                    >
                      Har
                    </button>
                    <button
                      onClick={() => toggle(card.id, v.variant, "want")}
                      disabled={pending.has(key(card.id, v.variant, "want"))}
                      className={`focus-ring text-xs rounded-sm px-2 py-0.5 disabled:opacity-50 ${
                        entries.has(key(card.id, v.variant, "want"))
                          ? "bg-gold/20 text-gold font-semibold border border-gold"
                          : "border border-line text-mute hover:border-gold"
                      }`}
                    >
                      ★ Vill ha
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
