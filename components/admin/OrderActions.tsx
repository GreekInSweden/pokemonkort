"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

interface OrderItemRef {
  cardVariantId: string | null;
  productId?: string | null;
  quantity: number;
}

export default function OrderActions({
  orderId,
  items,
  status = "pending_payment",
}: {
  orderId: string;
  status?: "pending_payment" | "paid";
  items: OrderItemRef[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"paid" | "shipped" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: "paid" | "shipped", tracking?: string) {
    setLoading(status);
    setError(null);
    const res = await fetch("/api/admin/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status, tracking }),
    });
    setLoading(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Kunde inte uppdatera ordern.");
      return;
    }
    router.refresh();
  }

  function handleMarkPaid() {
    setStatus("paid");
  }

  function handleMarkShipped() {
    const tracking = prompt("Spårningsnummer (valfritt, lämna tomt om inget):") ?? null;
    if (tracking === null) return;
    setStatus("shipped", tracking);
  }

  async function handleCancel() {
    if (
      !confirm(
        "Avbryta ordern och lägga tillbaka varorna i lager? Gör bara det här om du är säker på att kunden aldrig betalade."
      )
    ) {
      return;
    }
    setLoading("cancel");
    setError(null);
    const supabase = createBrowserSupabase();

    // Restore stock for every item in the order before cancelling it.
    for (const item of items) {
      if (item.productId) {
        const { data: prod, error: pErr } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.productId)
          .single();
        if (pErr || !prod) {
          setError(`Kunde inte återställa lager för en produkt: ${pErr?.message}`);
          setLoading(null);
          return;
        }
        const { error: pRestoreErr } = await supabase
          .from("products")
          .update({ stock: prod.stock + item.quantity })
          .eq("id", item.productId);
        if (pRestoreErr) {
          setError(`Kunde inte återställa lager: ${pRestoreErr.message}`);
          setLoading(null);
          return;
        }
        continue;
      }
      if (!item.cardVariantId) continue;
      const { data: variant, error: fetchError } = await supabase
        .from("card_variants")
        .select("stock")
        .eq("id", item.cardVariantId)
        .single();
      if (fetchError || !variant) {
        setError(`Kunde inte återställa lager för ett kort: ${fetchError?.message}`);
        setLoading(null);
        return;
      }
      const { error: restoreError } = await supabase
        .from("card_variants")
        .update({ stock: variant.stock + item.quantity })
        .eq("id", item.cardVariantId);
      if (restoreError) {
        setError(`Kunde inte återställa lager: ${restoreError.message}`);
        setLoading(null);
        return;
      }
    }

    const { error: cancelError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    setLoading(null);
    if (cancelError) {
      setError(cancelError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-2">
        {status === "pending_payment" && (
        <button
          onClick={handleMarkPaid}
          disabled={loading !== null}
          className="focus-ring text-xs rounded-sm bg-gold text-ink font-semibold px-3 py-1.5 disabled:opacity-50"
        >
          {loading === "paid" ? "Markerar…" : "Markera betald"}
        </button>
        )}
        <button
          onClick={handleMarkShipped}
          disabled={loading !== null}
          className="focus-ring text-xs rounded-sm border border-gold text-gold px-3 py-1.5 disabled:opacity-50"
        >
          {loading === "shipped" ? "Markerar…" : "Markera skickad"}
        </button>
        {status === "pending_payment" && (
        <button
          onClick={handleCancel}
          disabled={loading !== null}
          className="focus-ring text-xs rounded-sm border border-line text-paper px-3 py-1.5 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
        >
          {loading === "cancel" ? "Återställer lager…" : "Avbryt & lägg tillbaka i lager"}
        </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
