"use client";

import { useState } from "react";
import { CardRow } from "@/lib/types";
import { rarityAccent } from "@/lib/rarity";
import CardModal from "@/components/CardModal";
import CardImage from "@/components/CardImage";

export default function CardGrid({
  cards,
  setSlug,
  setName,
}: {
  cards: CardRow[];
  setSlug: string;
  setName: string;
}) {
  const [activeCard, setActiveCard] = useState<CardRow | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const inStock = card.variants.some((v) => v.stock > 0);
          return (
            <button
              key={card.id}
              disabled={!inStock}
              onClick={() => setActiveCard(card)}
              className={`focus-ring text-left border-l-4 ${rarityAccent[card.rarity]} border-y border-r border-line rounded-sm overflow-hidden transition-colors ${
                inStock
                  ? "bg-panel hover:bg-panelLight cursor-pointer"
                  : "bg-ink/60 opacity-40 cursor-not-allowed grayscale"
              }`}
            >
              <CardImage
                src={card.image_url}
                alt={card.name}
                number={card.number}
                rarity={card.rarity}
                className="w-full aspect-[3/4]"
              />
              <div className="p-3">
                <div className="font-mono text-xs text-mute mb-1">
                  #{String(card.number).padStart(3, "0")}
                </div>
                <div className="font-display text-sm font-medium text-paper leading-snug">
                  {card.name}
                </div>
                <div className="mt-2 text-xs font-mono">
                  {inStock ? (
                    <span className="text-gold">I lager</span>
                  ) : (
                    <span className="text-mute">Slut i lager</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeCard && (
        <CardModal
          card={activeCard}
          setSlug={setSlug}
          setName={setName}
          onClose={() => setActiveCard(null)}
        />
      )}
    </>
  );
}
