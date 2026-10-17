"use client";

import { useState } from "react";
import { useCart } from "@/lib/CartContext";
import { ProductRow } from "@/lib/types";
import { productCategoryLabel } from "@/lib/shop";

export default function AddToCartButton({ product }: { product: ProductRow }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const inCart = items.find((i) => i.variantId === product.id)?.quantity ?? 0;
  const remaining = product.stock - inCart;

  if (product.stock <= 0) {
    return (
      <span className="text-xs font-mono text-mute border border-line rounded-sm px-3 py-2 inline-block">
        Slutsåld
      </span>
    );
  }

  function handleAdd() {
    if (remaining <= 0) return;
    addItem({
      variantId: product.id,
      cardId: product.id,
      cardNumber: 0,
      cardName: product.name,
      variant: "normal",
      unitPriceSek: Number(product.price_sek),
      quantity: 1,
      setSlug: "butik",
      setName: product.set_name || productCategoryLabel[product.category],
      kind: "product",
      imageUrl: product.image_url,
      weightG: product.weight_g,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={remaining <= 0}
      className="focus-ring text-sm rounded-sm bg-gold text-ink font-semibold px-4 py-2 disabled:opacity-50 hover:bg-gold/90 transition-colors"
    >
      {remaining <= 0 ? "Max i varukorgen" : added ? "Tillagd ✓" : "Lägg i varukorgen"}
    </button>
  );
}
