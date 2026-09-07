"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { rarityLabel } from "@/lib/rarity";
import { Rarity } from "@/lib/types";
import CardImage from "@/components/CardImage";

interface VariantRow {
  id: string;
  variant: "normal" | "holo";
  price_sek: number;
  stock: number;
}

interface CardRow {
  id: string;
  number: number;
  name: string;
  rarity: Rarity;
  image_url: string | null;
  card_variants: VariantRow[];
}

export default function StockEditor({ cards }: { cards: CardRow[] }) {
  // Local editable copy: variantId -> current stock value shown in the input.
  const initial = useMemo(() => {
    const map: Record<string, number> = {};
    for (const card of cards) {
      for (const v of card.card_variants) map[v.id] = v.stock;
    }
    return map;
  }, [cards]);

  const [values, setValues] = useState<Record<string, number>>(initial);
  const initialPrices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const card of cards) {
      for (const v of card.card_variants) map[v.id] = v.price_sek;
    }
    return map;
  }, [cards]);
  const [prices, setPrices] = useState<Record<string, number>>(initialPrices);
  const [images, setImages] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    for (const card of cards) map[card.id] = card.image_url;
    return map;
  });
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dirtyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of Object.keys(values)) {
      if (values[id] !== (initial[id] ?? 0)) ids.add(id);
    }
    for (const id of Object.keys(prices)) {
      if (prices[id] !== (initialPrices[id] ?? 0)) ids.add(id);
    }
    return Array.from(ids);
  }, [values, initial, prices, initialPrices]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.number).padStart(3, "0").includes(q)
    );
  }, [cards, query]);

  function setValue(variantId: string, value: number) {
    setValues((v) => ({ ...v, [variantId]: Math.max(0, value) }));
  }

  function setPrice(variantId: string, value: number) {
    setPrices((p) => ({ ...p, [variantId]: Math.max(0, value) }));
  }

  function bump(variantId: string, delta: number) {
    setValues((v) => ({
      ...v,
      [variantId]: Math.max(0, (v[variantId] ?? 0) + delta),
    }));
  }

  async function handleSave() {
    if (dirtyIds.length === 0) return;
    setSaving(true);
    setErrorMsg(null);
    const supabase = createBrowserSupabase();

    const results = await Promise.all(
      dirtyIds.map((id) =>
        supabase
          .from("card_variants")
          .update({ stock: values[id] ?? 0, price_sek: prices[id] ?? 0 })
          .eq("id", id)
      )
    );
    const failed = results.find((r) => r.error);

    setSaving(false);
    if (failed) {
      setErrorMsg(
        "Något gick fel när ändringarna skulle sparas. Kontrollera att du är inloggad och försök igen."
      );
      return;
    }
    // Treat the saved values as the new baseline.
    Object.assign(initial, values);
    Object.assign(initialPrices, prices);
    setSavedAt(Date.now());
  }

  async function handleImageUpload(cardId: string, file: File) {
    setUploadError(null);
    setUploadingId(cardId);
    const supabase = createBrowserSupabase();

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${cardId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("card-images")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadErr) {
      setUploadError(
        `Kunde inte ladda upp bilden: ${uploadErr.message}. Har du kört supabase/image_support.sql?`
      );
      setUploadingId(null);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("card-images")
      .getPublicUrl(path);
    // Cache-bust so a replaced photo shows immediately instead of the old
    // cached version.
    const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await supabase
      .from("cards")
      .update({ image_url: freshUrl })
      .eq("id", cardId);

    setUploadingId(null);
    if (updateErr) {
      setUploadError(`Bilden laddades upp men kunde inte sparas: ${updateErr.message}`);
      return;
    }
    setImages((prev) => ({ ...prev, [cardId]: freshUrl }));
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-ink py-3 -mx-4 px-4 mb-4 border-b border-line flex items-center gap-3">
        <input
          type="text"
          placeholder="Sök kort efter namn eller nummer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="focus-ring flex-1 bg-panel border border-line rounded-sm px-3 py-2 text-paper text-sm"
        />
        <button
          onClick={handleSave}
          disabled={dirtyIds.length === 0 || saving}
          className="focus-ring shrink-0 rounded-sm bg-gold text-ink font-semibold px-4 py-2 text-sm disabled:opacity-40"
        >
          {saving
            ? "Sparar…"
            : dirtyIds.length > 0
            ? `Spara ${dirtyIds.length} ändring${dirtyIds.length === 1 ? "" : "ar"}`
            : "Inga ändringar"}
        </button>
      </div>

      {savedAt && dirtyIds.length === 0 && (
        <p className="text-sm text-gold mb-4">Sparat ✓</p>
      )}
      {errorMsg && <p className="text-sm text-red-400 mb-4">{errorMsg}</p>}
      {uploadError && <p className="text-sm text-red-400 mb-4">{uploadError}</p>}

      <div className="space-y-2">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="border border-line rounded-md p-3 bg-panel flex flex-wrap items-center gap-4"
          >
            <label className="shrink-0 cursor-pointer group relative">
              <CardImage
                src={images[card.id] ?? null}
                alt={card.name}
                number={card.number}
                rarity={card.rarity}
                className="w-12 h-16 rounded-sm"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-sm">
                <span className="text-[10px] text-paper text-center leading-tight px-1">
                  {uploadingId === card.id ? "Laddar…" : "Byt bild"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingId === card.id}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(card.id, file);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="w-16 shrink-0 font-mono text-xs text-mute">
              #{String(card.number).padStart(3, "0")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm font-medium text-paper truncate">
                {card.name}
              </div>
              <div className="text-xs text-mute">{rarityLabel[card.rarity]}</div>
            </div>
            {(["normal", "holo"] as const).map((variantType) => {
              const variant = card.card_variants.find(
                (v) => v.variant === variantType
              );
              if (!variant) return null;
              const isStockDirty = values[variant.id] !== (initial[variant.id] ?? 0);
              const isPriceDirty = prices[variant.id] !== (initialPrices[variant.id] ?? 0);
              return (
                <div key={variant.id} className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-mute w-10">
                    {variantType === "holo" ? "Holo" : "Van."}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number"
                      min={0}
                      value={prices[variant.id] ?? 0}
                      onChange={(e) => setPrice(variant.id, Number(e.target.value))}
                      title="Pris (kr)"
                      className={`focus-ring w-14 bg-ink border rounded-sm px-1 py-1 text-center font-mono text-sm text-paper ${
                        isPriceDirty ? "border-gold" : "border-line"
                      }`}
                    />
                    <span className="text-xs text-mute">kr</span>
                  </div>
                  <button
                    onClick={() => bump(variant.id, -1)}
                    className="focus-ring w-7 h-7 rounded-sm border border-line text-paper hover:border-gold text-sm"
                    aria-label={`Minska ${variantType}`}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={values[variant.id] ?? 0}
                    onChange={(e) =>
                      setValue(variant.id, Number(e.target.value))
                    }
                    title="Antal i lager"
                    className={`focus-ring w-14 bg-ink border rounded-sm px-1 py-1 text-center font-mono text-sm text-paper ${
                      isStockDirty ? "border-gold" : "border-line"
                    }`}
                  />
                  <button
                    onClick={() => bump(variant.id, 1)}
                    className="focus-ring w-7 h-7 rounded-sm border border-line text-paper hover:border-gold text-sm"
                    aria-label={`Öka ${variantType}`}
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
