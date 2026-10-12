"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

interface MemberRow {
  id: string;
  member_number: number;
  username: string | null;
  name: string;
  email: string;
  paid_until: string | null;
}

function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function MembershipAdmin({
  initialEnabled,
  members,
}: {
  initialEnabled: boolean;
  members: MemberRow[];
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleEnabled() {
    const next = !enabled;
    if (
      next &&
      !window.confirm(
        "Slå PÅ betalnivån? Medlemmar utan betald access får då bara fylla i sina första 3 set."
      )
    )
      return;
    setBusy("toggle");
    setError(null);
    const supabase = createBrowserSupabase();
    const { error: e } = await supabase
      .from("site_settings")
      .upsert({ key: "paywall_enabled", value: next ? "true" : "false", updated_at: new Date().toISOString() });
    setBusy(null);
    if (e) {
      setError("Kunde inte spara inställningen.");
      return;
    }
    setEnabled(next);
    router.refresh();
  }

  async function setPaidUntil(m: MemberRow, months: number | null) {
    setBusy(m.id);
    setError(null);
    let value: string | null = null;
    if (months !== null) {
      // Förläng från nuvarande slutdatum om det ligger i framtiden.
      const base =
        m.paid_until && new Date(m.paid_until) > new Date() ? new Date(m.paid_until) : new Date();
      value = addMonths(base, months).toISOString();
    }
    const supabase = createBrowserSupabase();
    const { error: e } = await supabase.from("members").update({ paid_until: value }).eq("id", m.id);
    setBusy(null);
    if (e) {
      setError("Kunde inte uppdatera medlemmen.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div
        className={`border rounded-md p-4 mb-8 flex items-center justify-between gap-4 ${
          enabled ? "border-gold bg-gold/5" : "border-line bg-panel"
        }`}
      >
        <div>
          <div className="font-display font-semibold text-paper">
            Betalnivå är {enabled ? "PÅ" : "AV"}
          </div>
          <p className="text-xs text-mute">
            {enabled
              ? "Gratis medlemmar får fylla i 3 set. Resten kräver betalt medlemskap."
              : "Alla har fri access."}
          </p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={busy === "toggle"}
          className="focus-ring text-sm rounded-sm bg-gold text-ink font-semibold px-4 py-2 disabled:opacity-50 shrink-0"
        >
          {enabled ? "Stäng av" : "Slå på"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <h2 className="font-display text-lg font-semibold text-paper mb-3">Betald access</h2>
      {members.length === 0 ? (
        <p className="text-mute text-sm">Inga medlemmar ännu.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const active = !!m.paid_until && new Date(m.paid_until) > new Date();
            return (
              <div key={m.id} className="border border-line rounded-md p-3 bg-panel">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-mono text-xs text-gold">
                      Medlem #{m.member_number}
                      {m.username && ` · ${m.username}`}
                    </div>
                    <div className="text-sm text-paper">{m.name}</div>
                  </div>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-sm ${
                      active ? "bg-gold/10 text-gold" : "bg-line text-mute"
                    }`}
                  >
                    {active
                      ? `Betald till ${new Date(m.paid_until!).toLocaleDateString("sv-SE")}`
                      : m.paid_until
                      ? `Utgick ${new Date(m.paid_until).toLocaleDateString("sv-SE")}`
                      : "Gratis"}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  <button
                    onClick={() => setPaidUntil(m, 12)}
                    disabled={busy === m.id}
                    className="focus-ring text-xs rounded-sm border border-line px-3 py-1.5 text-paper hover:border-gold disabled:opacity-50"
                  >
                    +12 mån (199 kr)
                  </button>
                  <button
                    onClick={() => setPaidUntil(m, 1)}
                    disabled={busy === m.id}
                    className="focus-ring text-xs rounded-sm border border-line px-3 py-1.5 text-paper hover:border-gold disabled:opacity-50"
                  >
                    +1 mån (19 kr)
                  </button>
                  {m.paid_until && (
                    <button
                      onClick={() => setPaidUntil(m, null)}
                      disabled={busy === m.id}
                      className="focus-ring text-xs rounded-sm border border-line px-3 py-1.5 text-mute hover:text-red-400 disabled:opacity-50"
                    >
                      Ta bort
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
