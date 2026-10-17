"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function ShopToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !enabled;
    if (
      next &&
      !window.confirm(
        "Öppna butiken för besökare? Butik-länken syns då i menyn och alla kan beställa."
      )
    )
      return;
    setBusy(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error: e } = await supabase.from("site_settings").upsert({
      key: "shop_enabled",
      value: next ? "true" : "false",
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (e) {
      setError("Kunde inte spara inställningen.");
      return;
    }
    setEnabled(next);
    router.refresh();
  }

  return (
    <div
      className={`border rounded-md p-4 mb-8 flex items-center justify-between gap-4 flex-wrap ${
        enabled ? "border-gold bg-gold/5" : "border-line bg-panel"
      }`}
    >
      <div>
        <div className="font-display font-semibold text-paper">
          Butiken är {enabled ? "ÖPPEN" : "STÄNGD"} för besökare
        </div>
        <p className="text-xs text-mute">
          {enabled
            ? "Butik-länken syns i menyn och alla kan beställa."
            : "Osynlig för besökare (sidan ger 404). Du som admin kan förhandsgranska och testa."}
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href="/butik"
          className="focus-ring text-sm rounded-sm border border-line px-3 py-2 text-paper hover:border-gold"
        >
          Förhandsgranska
        </Link>
        <button
          onClick={toggle}
          disabled={busy}
          className="focus-ring text-sm rounded-sm bg-gold text-ink font-semibold px-4 py-2 disabled:opacity-50"
        >
          {enabled ? "Stäng butiken" : "Öppna butiken"}
        </button>
      </div>
    </div>
  );
}
