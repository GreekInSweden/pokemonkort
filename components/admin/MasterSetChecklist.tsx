"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { rarityLabel, reverseHoloEligibleRarities } from "@/lib/rarity";
import { variantShortLabel } from "@/lib/variant";
import { Rarity, Variant } from "@/lib/types";
import CardZoomImage from "@/components/CardZoomImage";

interface ChecklistCard {
  id: string;
  number: number;
  name: string;
  rarity: Rarity;
  imageUrl: string | null;
  masterVariants: Variant[];
  ownedVariants: Variant[];
}

interface Progress {
  owned: number;
  total: number;
}

function ProgressBar({ label, progress }: { label: string; progress: Progress }) {
  const pct = progress.total === 0 ? 0 : Math.round((progress.owned / progress.total) * 100);
  const complete = progress.total > 0 && progress.owned === progress.total;
  return (
    <div className="border border-line rounded-md p-4 bg-panel flex-1 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${complete ? "text-gold" : "text-paper"}`}>
          {label}
          {complete && " ✓"}
        </span>
        <span className="text-xs font-mono text-mute">
          {progress.owned}/{progress.total} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-line rounded-full overflow-hidden">
        <div
          className={`h-full ${complete ? "bg-gold" : "bg-mute"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MasterSetChecklist({
  setName,
  cards,
  masterProgress,
}: {
  setName: string;
  cards: ChecklistCard[];
  masterProgress: Progress;
}) {
  const [owned, setOwned] = useState<Record<string, Variant[]>>(() => {
    const map: Record<string, Variant[]> = {};
    for (const c of cards) map[c.id] = c.ownedVariants;
    return map;
  });
  const [pending, setPending] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hideComplete, setHideComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cards were seeded before reverse holo tracking existed, or an admin
  // simply never checked "reverse holo" when uploading — so many cards
  // have no reverse_holo row in card_variants yet, and masterVariants
  // (computed server-side from what actually exists) won't include it.
  // Rather than sending people off to the stock editor to add a missing
  // variant one card at a time, this set tracks which cards we've just
  // created a reverse_holo row for right here, and folds that into the
  // effective master-set list below until the page next reloads.
  const [addedReverseHolo, setAddedReverseHolo] = useState<Set<string>>(new Set());
  const [addingReverseHolo, setAddingReverseHolo] = useState<string | null>(null);

  function effectiveMasterVariants(c: ChecklistCard): Variant[] {
    if (
      addedReverseHolo.has(c.id) &&
      reverseHoloEligibleRarities.includes(c.rarity) &&
      !c.masterVariants.includes("reverse_holo")
    ) {
      return [...c.masterVariants, "reverse_holo"];
    }
    return c.masterVariants;
  }

  // Local, live-recomputed progress so the bars move instantly as you
  // check things off, instead of waiting for a page refresh.
  const liveMaster = useMemo(() => {
    let ownedN = 0;
    let totalN = 0;
    for (const c of cards) {
      const need = effectiveMasterVariants(c);
      totalN += need.length;
      ownedN += need.filter((v) => owned[c.id]?.includes(v)).length;
    }
    return { owned: ownedN, total: totalN };
  }, [cards, owned, addedReverseHolo]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = cards;
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          String(c.number).padStart(3, "0").includes(q)
      );
    }
    if (hideComplete) {
      list = list.filter((c) => {
        const need = effectiveMasterVariants(c);
        return !need.every((v) => owned[c.id]?.includes(v));
      });
    }
    return list;
  }, [cards, query, hideComplete, owned, addedReverseHolo]);

  async function addReverseHolo(cardId: string) {
    setAddingReverseHolo(cardId);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error: insErr } = await supabase
      .from("card_variants")
      .insert({ card_id: cardId, variant: "reverse_holo", price_sek: 0, stock: 0 });
    setAddingReverseHolo(null);
    if (insErr) {
      // Redan tillagd (t.ex. i en annan flik) räknas inte som ett fel.
      if (!insErr.message?.toLowerCase().includes("duplicate")) {
        setError(insErr.message);
        return;
      }
    }
    setAddedReverseHolo((prev) => new Set(prev).add(cardId));
  }

  async function toggle(cardId: string, variant: Variant, isOwned: boolean) {
    const key = `${cardId}-${variant}`;
    setPending(key);
    setError(null);
    const supabase = createBrowserSupabase();

    if (isOwned) {
      const { error: delErr } = await supabase
        .from("master_set_progress")
        .delete()
        .eq("card_id", cardId)
        .eq("variant", variant);
      setPending(null);
      if (delErr) {
        setError(delErr.message);
        return;
      }
      setOwned((o) => ({
        ...o,
        [cardId]: (o[cardId] ?? []).filter((v) => v !== variant),
      }));
    } else {
      const { error: insErr } = await supabase
        .from("master_set_progress")
        .insert({ card_id: cardId, variant });
      setPending(null);
      if (insErr) {
        setError(insErr.message);
        return;
      }
      setOwned((o) => ({
        ...o,
        [cardId]: [...(o[cardId] ?? []), variant],
      }));
    }
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-paper mb-4">
        {setName}
      </h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <ProgressBar label="Master Set" progress={liveMaster} />
      </div>

      <div className="sticky top-0 z-10 bg-ink py-3 -mx-4 px-4 mb-4 border-b border-line flex items-center gap-3">
        <input
          type="text"
          placeholder="Sök kort efter namn eller nummer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="focus-ring flex-1 bg-panel border border-line rounded-sm px-3 py-2 text-paper text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-mute shrink-0">
          <input
            type="checkbox"
            checked={hideComplete}
            onChange={(e) => setHideComplete(e.target.checked)}
            className="focus-ring accent-gold w-4 h-4"
          />
          Dölj klara
        </label>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="space-y-2">
        {filteredCards.map((c) => {
          const cardOwned = owned[c.id] ?? [];
          const needVariants = effectiveMasterVariants(c);
          const canAddReverseHolo =
            reverseHoloEligibleRarities.includes(c.rarity) &&
            !needVariants.includes("reverse_holo");
          return (
            <div
              key={c.id}
              className="border border-line rounded-md p-3 bg-panel flex items-center gap-4"
            >
              <CardZoomImage
                src={c.imageUrl}
                alt={c.name}
                number={c.number}
                rarity={c.rarity}
                className="w-12 h-16 rounded-sm shrink-0"
              />
              <div className="w-16 shrink-0 font-mono text-xs text-mute">
                #{String(c.number).padStart(3, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-medium text-paper truncate">
                  {c.name}
                </div>
                <div className="text-xs text-mute">{rarityLabel[c.rarity]}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {needVariants.map((v) => {
                  const isOwned = cardOwned.includes(v);
                  const key = `${c.id}-${v}`;
                  const isPending = pending === key;
                  return (
                    <label
                      key={v}
                      className="flex flex-col items-center gap-1 text-[10px] text-mute cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isOwned}
                        disabled={isPending}
                        onChange={() => toggle(c.id, v, isOwned)}
                        className="focus-ring accent-gold w-4 h-4"
                      />
                      {variantShortLabel[v]}
                    </label>
                  );
                })}
                {canAddReverseHolo && (
                  <button
                    type="button"
                    onClick={() => addReverseHolo(c.id)}
                    disabled={addingReverseHolo === c.id}
                    className="focus-ring text-[10px] text-mute hover:text-gold border border-line hover:border-gold rounded-sm px-2 py-1 disabled:opacity-50 whitespace-nowrap"
                    title="Lägg till reverse holo-variant för det här kortet"
                  >
                    {addingReverseHolo === c.id ? "Lägger till…" : "+ Rev. Holo"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
