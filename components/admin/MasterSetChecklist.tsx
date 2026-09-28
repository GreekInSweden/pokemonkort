"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { rarityLabel, reverseHoloEligibleRarities } from "@/lib/rarity";
import { variantShortLabel } from "@/lib/variant";
import { Rarity, Variant, ParallelTier } from "@/lib/types";
import CardZoomImage from "@/components/CardZoomImage";

interface ChecklistCard {
  id: string;
  number: number;
  name: string;
  rarity: Rarity;
  imageUrl: string | null;
  masterVariants: Variant[];
  ownedVariants: Variant[];
  ownedParallelTierIds: string[];
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

function ParallelGuideRow({
  tier,
  imageUrl,
  uploading,
  onUpload,
}: {
  tier: ParallelTier;
  imageUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-paper py-1 border-b border-line/50">
      <div className="flex items-center gap-2 min-w-0">
        <label className="shrink-0 cursor-pointer group relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={tier.name}
              className="w-8 h-11 object-cover rounded-sm border border-line"
            />
          ) : (
            <div className="w-8 h-11 rounded-sm border border-dashed border-line flex items-center justify-center text-mute text-sm">
              +
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-sm">
            <span className="text-[8px] text-paper text-center leading-tight px-0.5">
              {uploading ? "…" : imageUrl ? "Byt" : "Lägg till"}
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
        <span className="truncate">{tier.name}</span>
      </div>
      <span className="font-mono text-mute shrink-0">
        {tier.print_run ? `/${tier.print_run}` : "onumrerad"}
      </span>
    </div>
  );
}

// En parallel som en enda klickbar pill -- ägd (fylld, grön kant) eller
// inte (tunn kant) -- ett klick växlar direkt, inget mellansteg med
// dropdown+"Lägg till" längre.
function ParallelChip({
  tier,
  owned,
  pending,
  onClick,
}: {
  tier: ParallelTier;
  owned: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={tier.name}
      className={`focus-ring text-[10px] rounded-full border px-2 py-0.5 whitespace-nowrap disabled:opacity-50 transition-colors ${
        owned
          ? "bg-sport-pitch/20 text-sport-pitch border-sport-pitch/60"
          : "text-mute border-line hover:border-sport-pitch hover:text-sport-pitch"
      }`}
    >
      {owned ? "✓ " : ""}
      {tier.name}
      {tier.print_run ? ` /${tier.print_run}` : ""}
    </button>
  );
}

export default function MasterSetChecklist({
  setName,
  cards,
  masterProgress,
  parallelTiers = [],
}: {
  setName: string;
  cards: ChecklistCard[];
  masterProgress: Progress;
  parallelTiers?: ParallelTier[];
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

  // Parallels är ett fristående bonuslager -- vilka Topps-färger/tryck du
  // råkar äga av ett kort -- som INTE räknas in i masterVariants/liveMaster
  // ovan. Nyckel: card_id, värde: lista av ägda parallel_tier_id.
  const [ownedParallels, setOwnedParallels] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const c of cards) map[c.id] = c.ownedParallelTierIds;
    return map;
  });
  const [parallelPending, setParallelPending] = useState<string | null>(null);
  const [showParallelGuide, setShowParallelGuide] = useState(false);
  // Vilka kort som just nu har hela parallel-listan expanderad -- annars
  // visas bara de redan ägda som chips, så listan inte blir 39 knappar
  // långt per kort som standard.
  const [expandedParallels, setExpandedParallels] = useState<Set<string>>(new Set());

  // Ett exempelfoto per parallel (inte per kort — samma foliefärg ser
  // likadan ut oavsett spelare), så man faktiskt kan se nyansen istället
  // för att bara läsa namnet. Nyckel: parallel_tier_id.
  const [tierImages, setTierImages] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    for (const t of parallelTiers) map[t.id] = t.image_url;
    return map;
  });
  const [uploadingTierId, setUploadingTierId] = useState<string | null>(null);

  async function handleTierImageUpload(tierId: string, file: File) {
    setError(null);
    setUploadingTierId(tierId);
    const supabase = createBrowserSupabase();

    const ext = file.name.split(".").pop() || "jpg";
    const path = `parallel-${tierId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("card-images")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadErr) {
      setUploadingTierId(null);
      setError(`Kunde inte ladda upp bilden: ${uploadErr.message}`);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("card-images")
      .getPublicUrl(path);
    const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await supabase
      .from("parallel_tiers")
      .update({ image_url: freshUrl })
      .eq("id", tierId);

    setUploadingTierId(null);
    if (updateErr) {
      setError(`Bilden laddades upp men kunde inte sparas: ${updateErr.message}`);
      return;
    }
    setTierImages((prev) => ({ ...prev, [tierId]: freshUrl }));
  }

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
      .insert({ card_id: cardId, variant: "reverse_holo", price_sek: 4, stock: 0 });
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

  // Parallellerna skrivs till SAMMA tabell (master_set_progress) som det
  // kravsatta master-setet, men med parallel_tier_id satt istället för
  // null -- de kravsatta raderna ovan (toggle()) rör aldrig den kolumnen,
  // så de två listorna kan aldrig krocka eller påverka varandras räkning.
  // Variant sätts till setets bas-variant (masterVariants[0]) rent
  // bokföringsmässigt -- parallels är en färg/tryck-variant av kortet,
  // inte en egen "normal/holo/reverse_holo"-status.
  async function toggleParallel(card: ChecklistCard, tierId: string, isOwned: boolean) {
    const key = `${card.id}-${tierId}`;
    setParallelPending(key);
    setError(null);
    const supabase = createBrowserSupabase();

    if (isOwned) {
      const { error: delErr } = await supabase
        .from("master_set_progress")
        .delete()
        .eq("card_id", card.id)
        .eq("parallel_tier_id", tierId);
      setParallelPending(null);
      if (delErr) {
        setError(delErr.message);
        return;
      }
      setOwnedParallels((o) => ({
        ...o,
        [card.id]: (o[card.id] ?? []).filter((id) => id !== tierId),
      }));
    } else {
      const baseVariant: Variant = card.masterVariants[0] ?? "normal";
      const { error: insErr } = await supabase.from("master_set_progress").insert({
        card_id: card.id,
        variant: baseVariant,
        parallel_tier_id: tierId,
      });
      setParallelPending(null);
      if (insErr) {
        if (!insErr.message?.toLowerCase().includes("duplicate")) {
          setError(insErr.message);
          return;
        }
      }
      setOwnedParallels((o) => ({
        ...o,
        [card.id]: [...(o[card.id] ?? []), tierId],
      }));
    }
  }

  function toggleExpanded(cardId: string) {
    setExpandedParallels((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-paper mb-4">
        {setName}
      </h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <ProgressBar label="Master Set" progress={liveMaster} />
      </div>

      {parallelTiers.length > 0 && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowParallelGuide((v) => !v)}
            className="focus-ring text-xs text-mute hover:text-gold border border-line hover:border-gold rounded-sm px-3 py-1.5"
          >
            {showParallelGuide ? "Dölj" : "ⓘ Vad är parallels?"} ({parallelTiers.length} st)
          </button>
          {showParallelGuide && (
            <div className="mt-3 border border-line rounded-md p-4 bg-panel">
              <p className="text-xs text-mute mb-3 max-w-prose">
                Varje spelare finns i flera färgade/numrerade tryck utöver
                grundkortet. Namnet beskriver oftast färgen (t.ex. "Gold
                Rainbow Foil"), och siffran efter "/" är hur många exemplar
                som finns totalt av just den färgen — lägre siffra betyder
                mer sällsynt. Onumrerade rader nedan finns i en okänd,
                större upplaga. "Hobby" och "Retail" är bara vilken sorts
                paket kortet kommer från. Klicka på en ruta för att ladda
                upp ett foto av ett riktigt kort i den färgen — det räcker
                med ett kort per färg, oavsett spelare, så listan fylls på
                allt eftersom ni stöter på dem.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {/* Grupperat dynamiskt på vad som faktiskt finns i
                    channel-kolumnen, istället för en hårdkodad
                    hobby/retail-lista -- olika säsonger/set har olika
                    kanaler (t.ex. PL 2025/26 har en tredje "display-box"-
                    kanal utöver hobby/retail), och en hårdkodad lista
                    tappade tyst bort allt som inte var exakt "hobby"
                    eller "retail". "Övrigt" är reserverat för null. */}
                {Array.from(
                  new Set(parallelTiers.filter((t) => t.channel).map((t) => t.channel as string))
                ).map((ch) => {
                  const tiers = parallelTiers.filter((t) => t.channel === ch);
                  const chLabel =
                    ch === "hobby" ? "Hobby" : ch === "retail" ? "Retail" : ch === "display-box" ? "Display Box" : ch;
                  return (
                    <div key={ch} className="mb-2">
                      <div className="text-[10px] uppercase tracking-wide text-mute mb-1">
                        {chLabel}
                      </div>
                      {tiers.map((t) => (
                        <ParallelGuideRow
                          key={t.id}
                          tier={t}
                          imageUrl={tierImages[t.id] ?? null}
                          uploading={uploadingTierId === t.id}
                          onUpload={(file) => handleTierImageUpload(t.id, file)}
                        />
                      ))}
                    </div>
                  );
                })}
                {parallelTiers.some((t) => !t.channel) && (
                  <div className="mb-2">
                    <div className="text-[10px] uppercase tracking-wide text-mute mb-1">
                      Övrigt
                    </div>
                    {parallelTiers
                      .filter((t) => !t.channel)
                      .map((t) => (
                        <ParallelGuideRow
                          key={t.id}
                          tier={t}
                          imageUrl={tierImages[t.id] ?? null}
                          uploading={uploadingTierId === t.id}
                          onUpload={(file) => handleTierImageUpload(t.id, file)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
          const cardOwnedParallels = ownedParallels[c.id] ?? [];
          const isExpanded = expandedParallels.has(c.id);
          const unownedCount = parallelTiers.length - cardOwnedParallels.length;
          return (
            <div
              key={c.id}
              className="border border-line rounded-md p-3 bg-panel flex flex-col gap-3"
            >
              <div className="flex items-center gap-4">
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

              {parallelTiers.length > 0 && (
                <div className="pl-[6.5rem] border-t border-line pt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wide text-mute shrink-0 mr-1">
                      Parallels:
                    </span>
                    {cardOwnedParallels.length === 0 && !isExpanded && (
                      <span className="text-[10px] text-mute">Inga registrerade</span>
                    )}
                    {!isExpanded &&
                      cardOwnedParallels.map((tierId) => {
                        const tier = parallelTiers.find((t) => t.id === tierId);
                        if (!tier) return null;
                        const key = `${c.id}-${tierId}`;
                        return (
                          <ParallelChip
                            key={tierId}
                            tier={tier}
                            owned
                            pending={parallelPending === key}
                            onClick={() => toggleParallel(c, tierId, true)}
                          />
                        );
                      })}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(c.id)}
                      className="focus-ring text-[10px] text-mute hover:text-gold border border-line hover:border-gold rounded-sm px-2 py-0.5 whitespace-nowrap ml-auto"
                    >
                      {isExpanded
                        ? "Dölj"
                        : unownedCount > 0
                        ? `+ Visa alla (${unownedCount} kvar)`
                        : "Visa alla"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      {/* Grupperat på channel precis som infoboxen ovan --
                          håller varje rad kort istället för en vägg av
                          39 chips i en enda lång rad. */}
                      {Array.from(
                        new Set(parallelTiers.filter((t) => t.channel).map((t) => t.channel as string))
                      ).map((ch) => {
                        const tiers = parallelTiers.filter((t) => t.channel === ch);
                        const chLabel =
                          ch === "hobby"
                            ? "Hobby"
                            : ch === "retail"
                            ? "Retail"
                            : ch === "display-box"
                            ? "Display Box"
                            : ch;
                        return (
                          <div key={ch}>
                            <div className="text-[9px] uppercase tracking-wide text-mute mb-1">
                              {chLabel}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {tiers.map((t) => {
                                const key = `${c.id}-${t.id}`;
                                const isOwned = cardOwnedParallels.includes(t.id);
                                return (
                                  <ParallelChip
                                    key={t.id}
                                    tier={t}
                                    owned={isOwned}
                                    pending={parallelPending === key}
                                    onClick={() => toggleParallel(c, t.id, isOwned)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {parallelTiers.some((t) => !t.channel) && (
                        <div>
                          <div className="text-[9px] uppercase tracking-wide text-mute mb-1">
                            Övrigt
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {parallelTiers
                              .filter((t) => !t.channel)
                              .map((t) => {
                                const key = `${c.id}-${t.id}`;
                                const isOwned = cardOwnedParallels.includes(t.id);
                                return (
                                  <ParallelChip
                                    key={t.id}
                                    tier={t}
                                    owned={isOwned}
                                    pending={parallelPending === key}
                                    onClick={() => toggleParallel(c, t.id, isOwned)}
                                  />
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
