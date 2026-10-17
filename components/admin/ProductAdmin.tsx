"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { ProductCategory, ProductRow } from "@/lib/types";
import {
  defaultWeightG,
  productCategories,
  productCategoryLabel,
} from "@/lib/shop";

const inputCls =
  "focus-ring w-full bg-ink border border-line rounded-sm px-3 py-2 text-paper text-sm";

export default function ProductAdmin({ initialProducts }: { initialProducts: ProductRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // --- nytt-produkt-formulär ---
  const [form, setForm] = useState({
    name: "",
    category: "booster" as ProductCategory,
    set_name: "",
    description: "",
    price_sek: "",
    stock: "0",
    weight_g: String(defaultWeightG.booster),
  });
  const [adding, setAdding] = useState(false);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const price = Number(form.price_sek);
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
      setError("Fyll i namn och ett giltigt pris.");
      return;
    }
    setAdding(true);
    const supabase = createBrowserSupabase();
    const { error: e2 } = await supabase.from("products").insert({
      name: form.name.trim(),
      category: form.category,
      set_name: form.set_name.trim() || null,
      description: form.description.trim() || null,
      price_sek: price,
      stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
      weight_g: Math.max(0, Math.floor(Number(form.weight_g) || 0)),
    });
    setAdding(false);
    if (e2) {
      setError(`Kunde inte spara: ${e2.message}`);
      return;
    }
    setForm({ ...form, name: "", set_name: "", description: "", price_sek: "", stock: "0" });
    router.refresh();
  }

  async function patch(id: string, values: Partial<ProductRow>) {
    setBusy(id);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error: e2 } = await supabase.from("products").update(values).eq("id", id);
    setBusy(null);
    if (e2) {
      setError(`Kunde inte spara: ${e2.message}`);
      return;
    }
    router.refresh();
  }

  async function remove(p: ProductRow) {
    if (!confirm(`Ta bort "${p.name}"? Gamla ordrar som innehåller den påverkas inte, men raden i ordern kopplas loss.`)) return;
    setBusy(p.id);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error: e2 } = await supabase.from("products").delete().eq("id", p.id);
    setBusy(null);
    if (e2) {
      setError(
        `Kunde inte ta bort (finns den i en order? Dölj den i så fall): ${e2.message}`
      );
      return;
    }
    router.refresh();
  }

  async function uploadImage(p: ProductRow, file: File) {
    setBusy(p.id);
    setError(null);
    const supabase = createBrowserSupabase();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `product-${p.id}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("card-images")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setBusy(null);
      setError(`Kunde inte ladda upp: ${upErr.message}`);
      return;
    }
    const { data: pub } = supabase.storage.from("card-images").getPublicUrl(path);
    await patch(p.id, { image_url: `${pub.publicUrl}?t=${Date.now()}` });
  }

  return (
    <div>
      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

      <form onSubmit={addProduct} className="border border-line rounded-md p-4 bg-panel mb-8 space-y-3">
        <h2 className="font-display font-semibold text-paper">Ny produkt</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Namn</span>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="t.ex. Pitch Black Elite Trainer Box"
            />
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Typ</span>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => {
                const c = e.target.value as ProductCategory;
                setForm({ ...form, category: c, weight_g: String(defaultWeightG[c]) });
              }}
            >
              {productCategories.map((c) => (
                <option key={c} value={c}>
                  {productCategoryLabel[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Set (valfritt)</span>
            <input
              className={inputCls}
              value={form.set_name}
              onChange={(e) => setForm({ ...form, set_name: e.target.value })}
              placeholder="t.ex. Pitch Black"
            />
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Pris (kr)</span>
            <input
              className={inputCls}
              inputMode="decimal"
              value={form.price_sek}
              onChange={(e) => setForm({ ...form, price_sek: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Antal i lager</span>
            <input
              className={inputCls}
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Vikt (gram, styr frakten)</span>
            <input
              className={inputCls}
              inputMode="numeric"
              value={form.weight_g}
              onChange={(e) => setForm({ ...form, weight_g: e.target.value })}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-mute mb-1 block">Beskrivning (valfritt)</span>
          <textarea
            className={inputCls}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <button
          type="submit"
          disabled={adding}
          className="focus-ring text-sm rounded-sm bg-gold text-ink font-semibold px-4 py-2 disabled:opacity-50"
        >
          {adding ? "Sparar…" : "Lägg till produkt"}
        </button>
        <p className="text-xs text-mute">Bild laddar du upp på produkten när den är skapad.</p>
      </form>

      {initialProducts.length === 0 ? (
        <p className="text-mute text-sm">Inga produkter ännu.</p>
      ) : (
        <div className="space-y-3">
          {initialProducts.map((p) => (
            <ProductRowEditor
              key={p.id}
              product={p}
              busy={busy === p.id}
              onPatch={(v) => patch(p.id, v)}
              onDelete={() => remove(p)}
              onUpload={(f) => uploadImage(p, f)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRowEditor({
  product,
  busy,
  onPatch,
  onDelete,
  onUpload,
}: {
  product: ProductRow;
  busy: boolean;
  onPatch: (v: Partial<ProductRow>) => void;
  onDelete: () => void;
  onUpload: (f: File) => void;
}) {
  const [price, setPrice] = useState(String(Number(product.price_sek)));
  const [stock, setStock] = useState(String(product.stock));
  const [weight, setWeight] = useState(String(product.weight_g));

  const dirty =
    Number(price) !== Number(product.price_sek) ||
    Number(stock) !== product.stock ||
    Number(weight) !== product.weight_g;

  return (
    <div
      className={`border rounded-md p-3 bg-panel ${
        product.is_active ? "border-line" : "border-line opacity-60"
      }`}
    >
      <div className="flex gap-3">
        <label className="cursor-pointer shrink-0" title="Klicka för att byta bild">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="w-20 h-16 object-contain rounded-sm border border-line bg-ink"
            />
          ) : (
            <div className="w-20 h-16 rounded-sm border border-dashed border-amber-400/60 flex items-center justify-center text-[10px] text-amber-400/90 text-center px-1">
              Lägg till bild
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = "";
            }}
          />
        </label>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs text-mute">
            {productCategoryLabel[product.category]}
            {product.set_name && ` · ${product.set_name}`}
            {!product.is_active && " · DOLD"}
          </div>
          <div className="font-display font-semibold text-paper">{product.name}</div>
        </div>
      </div>

      <div className="flex items-end gap-3 flex-wrap mt-3">
        <label className="block">
          <span className="text-[10px] text-mute block">Pris (kr)</span>
          <input
            className="focus-ring w-20 bg-ink border border-line rounded-sm px-2 py-1 text-sm text-paper"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-mute block">Lager</span>
          <input
            className="focus-ring w-16 bg-ink border border-line rounded-sm px-2 py-1 text-sm text-paper"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-mute block">Vikt (g)</span>
          <input
            className="focus-ring w-16 bg-ink border border-line rounded-sm px-2 py-1 text-sm text-paper"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <button
          onClick={() =>
            onPatch({
              price_sek: Math.max(0, Number(price) || 0),
              stock: Math.max(0, Math.floor(Number(stock) || 0)),
              weight_g: Math.max(0, Math.floor(Number(weight) || 0)),
            })
          }
          disabled={busy || !dirty}
          className="focus-ring text-xs rounded-sm bg-gold text-ink font-semibold px-3 py-1.5 disabled:opacity-40"
        >
          Spara
        </button>
        <button
          onClick={() => onPatch({ is_active: !product.is_active })}
          disabled={busy}
          className="focus-ring text-xs rounded-sm border border-line px-3 py-1.5 text-paper hover:border-gold disabled:opacity-50"
        >
          {product.is_active ? "Dölj" : "Visa"}
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="focus-ring text-xs rounded-sm border border-line px-3 py-1.5 text-mute hover:text-red-400 disabled:opacity-50"
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}
