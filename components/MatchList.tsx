"use client";

import { useEffect, useState } from "react";
import { Variant } from "@/lib/types";
import { variantLabel } from "@/lib/variant";

interface Match {
  cardId: string;
  cardNumber: number;
  cardName: string;
  setName: string;
  variant: Variant;
  matchCount: number;
}

interface Contact {
  memberNumber: number;
  name: string;
  contactMessenger: string | null;
  contactWhatsapp: string | null;
  contactOther: string | null;
}

export default function MatchList() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [revealed, setRevealed] = useState<Record<string, Contact[] | "loading" | "none">>({});

  useEffect(() => {
    fetch("/api/member/matchningar")
      .then((res) => res.json())
      .then((data) => setMatches(data.matches ?? []));
  }, []);

  async function handleReveal(m: Match) {
    const k = `${m.cardId}:${m.variant}`;
    setRevealed((r) => ({ ...r, [k]: "loading" }));
    const res = await fetch("/api/member/matchningar/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: m.cardId, variant: m.variant }),
    });
    const data = await res.json();
    setRevealed((r) => ({
      ...r,
      [k]: data.contacts && data.contacts.length > 0 ? data.contacts : "none",
    }));
  }

  if (matches === null) {
    return <p className="text-mute text-sm">Laddar…</p>;
  }

  if (matches.length === 0) {
    return (
      <p className="text-mute text-sm">
        Inga matchningar just nu. Lägg till kort i din önskelista på{" "}
        <a href="/konto/portfolj" className="text-gold hover:underline">
          Min portfölj
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const k = `${m.cardId}:${m.variant}`;
        const state = revealed[k];
        return (
          <div key={k} className="border border-line rounded-md p-4 bg-panel">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-mono text-xs text-mute">
                  #{String(m.cardNumber).padStart(3, "0")} · {m.setName}
                </div>
                <div className="font-display font-semibold text-paper">
                  {m.cardName}{" "}
                  <span className="text-mute text-sm font-body">
                    ({variantLabel[m.variant]})
                  </span>
                </div>
                <div className="text-xs text-gold mt-1">
                  {m.matchCount} {m.matchCount === 1 ? "medlem har" : "medlemmar har"} det
                  här kortet
                </div>
              </div>
              {!state && (
                <button
                  onClick={() => handleReveal(m)}
                  className="focus-ring text-xs rounded-sm bg-gold text-ink font-semibold px-3 py-1.5 shrink-0"
                >
                  Visa kontakt
                </button>
              )}
            </div>

            {state === "loading" && (
              <p className="text-xs text-mute mt-3">Hämtar…</p>
            )}
            {state === "none" && (
              <p className="text-xs text-mute mt-3">
                De som har kortet har inte fyllt i någon kontaktväg än.
              </p>
            )}
            {Array.isArray(state) && (
              <div className="mt-3 space-y-2 border-t border-line pt-3">
                {state.map((c, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-gold font-medium">
                      Medlem #{c.memberNumber} ({c.name})
                    </span>
                    <div className="text-mute text-xs mt-0.5 space-y-0.5">
                      {c.contactMessenger && <div>Messenger: {c.contactMessenger}</div>}
                      {c.contactWhatsapp && <div>WhatsApp: {c.contactWhatsapp}</div>}
                      {c.contactOther && <div>{c.contactOther}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
