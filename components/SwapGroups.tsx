"use client";

import { useEffect, useState } from "react";
import { variantLabel } from "@/lib/variant";
import type { Variant } from "@/lib/types";

interface Item {
  cardId: string;
  cardNumber: number;
  cardName: string;
  setName: string;
  variant: Variant;
  parallelTierId: string | null;
  parallelTierName: string | null;
  sellable?: boolean;
  tradeable?: boolean;
}
interface Group {
  key: string;
  youGet: Item[];
  youGive: Item[];
  isSwap: boolean;
}
interface Contact {
  memberId: string;
  label: string;
  contactMessenger: string | null;
  contactWhatsapp: string | null;
  contactOther: string | null;
  cardId: string;
  variant: Variant;
  parallelTierId: string | null;
}

function itemLabel(i: Item) {
  return `${i.cardName} (${i.parallelTierName ?? variantLabel[i.variant]}) · ${i.setName} #${String(
    i.cardNumber
  ).padStart(3, "0")}`;
}

function waMeHref(rawNumber: string, prefill: string): string {
  const digits = rawNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`;
}

function ItemList({ title, items, showHow }: { title: string; items: Item[]; showHow?: boolean }) {
  return (
    <div>
      <div className="text-xs text-mute uppercase tracking-wide mb-1">{title}</div>
      <ul className="space-y-0.5">
        {items.map((i, idx) => (
          <li key={idx} className="text-sm text-paper">
            {itemLabel(i)}
            {showHow && (i.sellable || i.tradeable) && (
              <span className="text-xs text-mute">
                {" "}
                — {[i.sellable ? "säljer" : null, i.tradeable ? "byter" : null].filter(Boolean).join(" / ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SwapGroups() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [contacts, setContacts] = useState<Record<string, Contact | "loading" | "none">>({});
  const [composing, setComposing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/member/matchningar/byten")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => setGroups([]));
  }, []);

  async function reveal(g: Group) {
    setContacts((c) => ({ ...c, [g.key]: "loading" }));
    try {
      const res = await fetch("/api/member/matchningar/byten/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: g.key }),
      });
      const d = await res.json().catch(() => ({}));
      setContacts((c) => ({ ...c, [g.key]: d.contact ?? "none" }));
    } catch {
      setContacts((c) => ({ ...c, [g.key]: "none" }));
    }
  }

  function prefill(g: Group) {
    if (g.isSwap) {
      return `Hej! Vi har en perfekt matchning i Kortmarknad: jag är intresserad av ${g.youGet
        .map((i) => i.cardName)
        .join(", ")} och du söker ${g.youGive.map((i) => i.cardName).join(", ")} som jag har. Vill du byta?`;
    }
    return `Hej! Jag ser att du har ${g.youGet
      .map((i) => i.cardName)
      .join(", ")} i Kortmarknad – jag söker flera av dem. Kan vi göra en affär på alla?`;
  }

  async function send(g: Group, c: Contact) {
    if (!text.trim()) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/member/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toMemberId: c.memberId,
          cardId: c.cardId,
          variant: c.variant,
          parallelTierId: c.parallelTierId,
          body: text,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent((s) => new Set(s).add(g.key));
        setComposing(null);
        setText("");
      } else {
        setErr(d.error ?? "Kunde inte skicka meddelandet.");
      }
    } catch {
      setErr("Kunde inte skicka meddelandet.");
    } finally {
      setSending(false);
    }
  }

  if (!groups) return null;
  const swaps = groups.filter((g) => g.isSwap);
  const bundles = groups.filter((g) => !g.isSwap && g.youGet.length >= 2);
  if (swaps.length === 0 && bundles.length === 0) return null;

  function card(g: Group, kind: "swap" | "bundle") {
    const st = contacts[g.key];
    return (
      <div key={g.key} className="border border-gold/50 rounded-md p-4 bg-panel">
        <div className="text-xs text-gold mb-2">
          {kind === "swap"
            ? `Perfekt byte – du får ${g.youGet.length} · du ger ${g.youGive.length}`
            : `En medlem har ${g.youGet.length} av korten du söker`}
        </div>
        <div className={kind === "swap" ? "grid sm:grid-cols-2 gap-4" : ""}>
          <ItemList title="Du kan få" items={g.youGet} showHow />
          {kind === "swap" && <ItemList title="Du kan ge (söks av hen)" items={g.youGive} />}
        </div>

        {!st && (
          <button
            onClick={() => reveal(g)}
            className="focus-ring mt-3 text-xs rounded-sm bg-gold text-ink font-semibold px-3 py-1.5"
          >
            Visa kontakt
          </button>
        )}
        {st === "loading" && <p className="text-xs text-mute mt-3">Hämtar…</p>}
        {st === "none" && (
          <p className="text-xs text-mute mt-3">Matchningen finns inte kvar just nu.</p>
        )}
        {st && st !== "loading" && st !== "none" && (
          <div className="mt-3 border-t border-line pt-3 text-sm">
            <span className="text-gold font-medium">{st.label}</span>
            <div className="text-mute text-xs mt-0.5 space-y-0.5">
              {st.contactWhatsapp && (
                <div>
                  <a
                    href={waMeHref(st.contactWhatsapp, prefill(g))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring text-gold hover:underline"
                  >
                    Öppna WhatsApp →
                  </a>
                </div>
              )}
              {st.contactMessenger && <div>Messenger: {st.contactMessenger}</div>}
              {st.contactOther && <div>{st.contactOther}</div>}
            </div>
            <div className="mt-2">
              {sent.has(g.key) ? (
                <p className="text-xs text-gold">Meddelande skickat ✓</p>
              ) : composing === g.key ? (
                <div className="flex flex-col gap-1.5 max-w-sm">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    className="focus-ring text-xs bg-ink border border-line rounded-sm px-2 py-1.5 text-paper"
                  />
                  {err && <p className="text-xs text-red-400">{err}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => send(g, st)}
                      disabled={sending || !text.trim()}
                      className="focus-ring text-xs rounded-sm bg-gold text-ink font-semibold px-2 py-1 disabled:opacity-50"
                    >
                      {sending ? "Skickar…" : "Skicka"}
                    </button>
                    <button
                      onClick={() => {
                        setComposing(null);
                        setErr(null);
                      }}
                      className="focus-ring text-xs rounded-sm border border-line px-2 py-1 text-mute hover:text-paper"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setComposing(g.key);
                    setText(prefill(g));
                    setErr(null);
                  }}
                  className="focus-ring text-xs rounded-sm bg-gold text-ink font-semibold px-3 py-1.5"
                >
                  Skicka meddelande i Kortmarknad
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-10 space-y-6">
      {swaps.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-paper mb-1">Perfekta byten</h2>
          <p className="text-xs text-mute mb-3">
            Medlemmar som har något du söker och som själva söker något du har och kan byta.
          </p>
          <div className="space-y-3">{swaps.map((g) => card(g, "swap"))}</div>
        </section>
      )}
      {bundles.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-paper mb-1">Köp flera på en gång</h2>
          <p className="text-xs text-mute mb-3">
            Samma medlem har flera av korten du söker – smidigt att köpa ihop och dela på frakten.
          </p>
          <div className="space-y-3">{bundles.map((g) => card(g, "bundle"))}</div>
        </section>
      )}
    </div>
  );
}
