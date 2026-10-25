"use client";

import { useMemo, useState } from "react";
import { DEX, GENERATION_NAMES, dexSpriteUrl } from "@/lib/pokedex";

type View = "all" | "missing" | "owned";

export default function PokedexGrid({
  auto,
  manual: initialManual,
  readOnly = false,
  isPublic: initialPublic = false,
  hasUsername = false,
  username = null,
}: {
  auto: number[];
  manual: number[];
  readOnly?: boolean;
  isPublic?: boolean;
  hasUsername?: boolean;
  username?: string | null;
}) {
  const autoSet = useMemo(() => new Set(auto), [auto]);
  const [manual, setManual] = useState<Set<number>>(new Set(initialManual));
  const [gen, setGen] = useState(0);
  const [view, setView] = useState<View>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(initialPublic);

  const owned = (n: number) => autoSet.has(n) || manual.has(n);
  const ownedCount = DEX.filter((d) => owned(d.n)).length;
  const pct = Math.round((ownedCount / DEX.length) * 100);

  const q = query.trim().toLowerCase();
  const shown = DEX.filter((d) => {
    if (gen && d.gen !== gen) return false;
    if (view === "missing" && owned(d.n)) return false;
    if (view === "owned" && !owned(d.n)) return false;
    if (q && !d.name.toLowerCase().includes(q) && String(d.n) !== q) return false;
    return true;
  });
  const sel = selected ? DEX.find((d) => d.n === selected) ?? null : null;

  async function post(body: object): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/member/pokedex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Något gick fel.");
        return false;
      }
      return true;
    } catch {
      setError("Kunde inte spara just nu.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function toggleManual(n: number) {
    const on = !manual.has(n);
    if (await post({ dex: n, on })) {
      setManual((prev) => {
        const next = new Set(prev);
        if (on) next.add(n);
        else next.delete(n);
        return next;
      });
    }
  }

  async function togglePublic() {
    const next = !isPublic;
    if (await post({ public: next })) setIsPublic(next);
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-baseline justify-between text-sm mb-1">
          <span className="text-paper font-semibold">
            {ownedCount} av {DEX.length} Pokémon
          </span>
          <span className="font-mono text-mute">{pct}%</span>
        </div>
        <div className="h-2 bg-line rounded overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök namn eller nummer"
          className="focus-ring bg-ink border border-line rounded px-3 py-2 text-sm text-paper flex-1 min-w-[10rem]"
          aria-label="Sök Pokémon"
        />
        <select
          value={gen}
          onChange={(e) => setGen(Number(e.target.value))}
          className="focus-ring bg-ink border border-line rounded px-3 py-2 text-sm text-paper"
          aria-label="Generation"
        >
          <option value={0}>Alla generationer</option>
          {Object.entries(GENERATION_NAMES).map(([g, name]) => (
            <option key={g} value={g}>
              Gen {g} – {name}
            </option>
          ))}
        </select>
        {(["all", "missing", "owned"] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`focus-ring px-3 py-2 text-sm rounded border ${
              view === v ? "border-gold text-gold" : "border-line text-mute hover:text-paper"
            }`}
          >
            {v === "all" ? "Alla" : v === "missing" ? "Saknas" : "Har"}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <ul className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {shown.map((d) => {
          const has = owned(d.n);
          return (
            <li key={d.n}>
              <button
                type="button"
                onClick={() => setSelected(d.n === selected ? null : d.n)}
                className={`focus-ring w-full rounded border p-1 text-center ${
                  has ? "border-gold bg-gold/10" : "border-line opacity-50 hover:opacity-90"
                } ${selected === d.n ? "ring-2 ring-gold" : ""}`}
                aria-label={`${d.name}, nummer ${d.n}, ${has ? "samlad" : "saknas"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dexSpriteUrl(d.n)}
                  alt=""
                  loading="lazy"
                  width={64}
                  height={64}
                  className={`mx-auto w-12 h-12 ${has ? "" : "grayscale"}`}
                />
                <div className="font-mono text-[10px] text-mute">#{String(d.n).padStart(4, "0")}</div>
                <div className="text-[11px] text-paper truncate">{d.name}</div>
              </button>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="text-mute text-sm mt-4">Inga Pokémon matchar.</p>}

      {sel && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-ink border-t border-line p-4">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <div className="font-semibold text-paper">
                #{String(sel.n).padStart(4, "0")} {sel.name}
              </div>
              <div className="text-xs text-mute">
                {autoSet.has(sel.n)
                  ? "Samlad via ditt kort i portföljen"
                  : manual.has(sel.n)
                  ? "Ikryssad för hand"
                  : "Saknas"}
              </div>
            </div>
            {!readOnly && !autoSet.has(sel.n) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => toggleManual(sel.n)}
                className="focus-ring px-3 py-2 text-sm rounded border border-gold text-gold hover:bg-gold/10 disabled:opacity-50"
              >
                {manual.has(sel.n) ? "Ta bort markering" : "Markera som samlad"}
              </button>
            )}
            {!readOnly && (
              <a
                href={`/hitta-kort?q=${encodeURIComponent(sel.name)}`}
                className="focus-ring px-3 py-2 text-sm rounded border border-line text-paper hover:text-gold"
              >
                Hitta kort →
              </a>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="focus-ring text-sm text-mute hover:text-paper"
            >
              Stäng
            </button>
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="mt-10 border-t border-line pt-6 text-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isPublic}
              disabled={busy || (!hasUsername && !isPublic)}
              onChange={togglePublic}
              className="mt-1"
            />
            <span>
              <span className="text-paper">Visa min Pokédex publikt</span>
              <span className="block text-mute text-xs mt-1">
                {hasUsername
                  ? "Alla med länken ser vilka Pokémon du samlat (bara det, inga kort, priser eller kontaktuppgifter)."
                  : "Du behöver ett användarnamn för att kunna dela. Lägg till det i din profil först."}
              </span>
              {isPublic && username && (
                <a href={`/pokedex/${encodeURIComponent(username)}`} className="text-gold hover:underline text-xs">
                  Din publika sida →
                </a>
              )}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
