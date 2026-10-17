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

  const [onlyStocked, setOnlyStocked] = useState(false);
  const shown = onlyStocked ? initialProducts.filter((p) => p.stock > 0) : initialProducts;
  const totalUnits = initialProducts.reduce((n, p) => n + p.stock, 0);

  // Gruppera per set i den ordning produkterna kommer (sort_order).
  const groups: { name: string; items: ProductRow[] }[] = [];
  for (const p of shown) {
    const name = p.set_name || "Övrigt";
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, items: [] }));
    g.items.push(p);
  }

  return (
    <div>
      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <p className="text-sm text-mute">
          <span className="text-paper font-mono">{totalUnits}</span> st i lager totalt
          {" · "}produkter med lager 0 syns inte i butiken.
        </p>
        <label className="flex items-center gap-2 text-xs text-mute cursor-pointer">
          <input
            type="checkbox"
            checked={onlyStocked}
            onChange={(e) => setOnlyStocked(e.target.checked)}
          />
          Visa bara produkter med lager
        </label>
      </div>

      {groups.length === 0 ? (
        <p className="text-mute text-sm mb-8">
          {onlyStocked
            ? "Inga produkter har lager ännu."
            : "Inga produkter ännu. Kör seed_products.sql i Supabase för att få färdiga produkter."}
        </p>
      ) : (
        <div className="space-y-6 mb-10">
          {groups.map((g) => (
            <section key={g.name}>
              <h2 className="font-display font-semibold text-paper text-sm mb-2">{g.name}</h2>
              <div className="border border-line rounded-md bg-panel divide-y divide-line">
                {g.items.map((p) => (
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
            </section>
          ))}
        </div>
      )}

      <details className="border border-line rounded-md p-4 bg-panel">
        <summary className="cursor-pointer font-display font-semibold text-paper text-sm">
          Lägg till en annan produkt (tin, box, annat set …)
        </summary>
        <form onSubmit={addProduct} className="space-y-3 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-mute mb-1 block">Namn</span>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="t.ex. Pitch Black Tin"
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
          <button
            type="submit"
            disabled={adding}
            className="focus-ring text-sm rounded-sm bg-gold text-ink font-semibold px-4 py-2 disabled:opacity-50"
          >
            {adding ? "Sparar…" : "Lägg till produkt"}
          </button>
          <p className="text-xs text-mute">Bild laddar du upp genom att klicka på bilden efteråt.</p>
        </form>
      </details>
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
  const [more, setMore] = useState(false);

  const smallInput =
    "focus-ring bg-ink border border-line rounded-sm px-2 py-1 text-sm text-paper text-center";

  function saveStock(n: number) {
    const v = Math.max(0, Math.floor(n) || 0);
    setStock(String(v));
    if (v !== product.stock) onPatch({ stock: v });
  }
  function savePrice() {
    const v = Math.max(0, Number(price) || 0);
    setPrice(String(v));
    if (v !== Number(product.price_sek)) onPatch({ price_sek: v });
  }
  function saveWeight() {
    const v = Math.max(0, Math.floor(Number(weight) || 0));
    setWeight(String(v));
    if (v !== product.weight_g) onPatch({ weight_g: v });
  }

  return (
    <div className={`p-3 ${product.is_active ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="cursor-pointer shrink-0" title="Klicka för att byta bild">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="w-16 h-12 object-cover rounded-sm border border-line bg-ink"
            />
          ) : (
            <div className="w-16 h-12 rounded-sm border border-dashed border-amber-400/60 flex items-center justify-center text-[10px] text-amber-400/90 text-center px-1">
              Bild
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

        <div className="min-w-0 flex-1 basis-40">
          <div className="font-display font-semibold text-paper text-sm">{product.name}</div>
          <div className="font-mono text-[11px] text-mute">
            {productCategoryLabel[product.category]}
            {!product.is_active && " · DOLD"}
            {product.stock === 0 && product.is_active && " · syns ej (lager 0)"}
          </div>
        </div>

        <label className="block">
          <span className="text-[10px] text-mute block">Pris (kr)</span>
          <input
            className={`${smallInput} w-20`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={savePrice}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            inputMode="decimal"
            disabled={busy}
          />
        </label>

        <div>
          <span className="text-[10px] text-mute block">Antal i lager</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => saveStock(Number(stock) - 1)}
              disabled={busy || Number(stock) <= 0}
              className="focus-ring w-8 h-8 rounded-sm border border-line text-paper hover:border-gold disabled:opacity-30"
              aria-label="Minska"
            >
              −
            </button>
            <input
              className={`${smallInput} w-14`}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              onBlur={() => saveStock(Number(stock))}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              inputMode="numeric"
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => saveStock(Number(stock) + 1)}
              disabled={busy}
              className="focus-ring w-8 h-8 rounded-sm border border-line text-paper hover:border-gold disabled:opacity-30"
              aria-label="Öka"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => saveStock(Number(stock) + 10)}
              disabled={busy}
              className="focus-ring h-8 px-2 rounded-sm border border-line text-xs text-mute hover:text-paper hover:border-gold disabled:opacity-30"
            >
              +10
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMore((m) => !m)}
          className="focus-ring text-xs text-mute hover:text-paper px-1"
        >
          {more ? "Mindre" : "Mer"}
        </button>
      </div>

      {more && (
        <div className="flex items-end gap-3 flex-wrap mt-3 pt-3 border-t border-line">
          <label className="block">
            <span className="text-[10px] text-mute block">Vikt (g, styr frakten)</span>
            <input
              className={`${smallInput} w-20`}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={saveWeight}
              inputMode="numeric"
              disabled={busy}
            />
          </label>
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
      )}
    </div>
  );
}
