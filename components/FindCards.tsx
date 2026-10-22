"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Rarity } from "@/lib/types";
import { rarityLabel } from "@/lib/rarity";

interface Result {
  id: string;
  name: string;
  rarity: Rarity;
  image_url: string | null;
  numberText: string;
  setName: string;
  setSlug: string;
  era: string;
  releaseDate: string | null;
  cardmarketUrl: string;
  pricechartingUrl: string | null;
}

export default function FindCards() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [era, setEra] = useState("");
  const [rarity, setRarity] = useState("");
  const seq = useRef(0);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setResults(null);
      setHint(null);
      setError(null);
      return;
    }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hitta-kort?q=${encodeURIComponent(text)}`);
        const json = await res.json();
        if (mine !== seq.current) return;
        if (!res.ok) {
          setError(json.error ?? "Något gick fel.");
          setResults(null);
        } else {
          setError(null);
          setResults(json.results);
          setTruncated(!!json.truncated);
          setHint(json.hint ?? null);
          setEra("");
          setRarity("");
        }
      } catch {
        if (mine === seq.current) setError("Kunde inte söka just nu.");
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const eras = useMemo(
    () => Array.from(new Set((results ?? []).map((r) => r.era))).sort(),
    [results]
  );
  const rarities = useMemo(
    () => Array.from(new Set((results ?? []).map((r) => r.rarity))),
    [results]
  );
  const shown = (results ?? []).filter(
    (r) => (!era || r.era === era) && (!rarity || r.rarity === rarity)
  );

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Kortnamn eller numret på kortet, t.ex. "Charizard" eller "4/102"'
        className="focus-ring w-full bg-ink border border-line rounded px-4 py-3 text-paper"
        aria-label="Sök kort"
        autoFocus
      />
      <p className="text-xs text-mute mt-2">
        Nere till vänster eller höger på kortet står två siffror, t.ex.{" "}
        <span className="font-mono">47/114</span>. Skriv dem så hittar vi
        vilket set kortet tillhör. Du kan kombinera med namn:{" "}
        <span className="font-mono">pikachu 58/102</span>.
      </p>

      {loading && <p className="text-mute text-sm mt-6">Söker…</p>}
      {error && <p className="text-red-400 text-sm mt-6">{error}</p>}
      {hint === "number_needs_total" && (
        <p className="text-mute text-sm mt-6">
          Skriv hela numret (t.ex. 47/114) eller lägg till ett namn.
        </p>
      )}

      {results && !loading && results.length === 0 && !hint && (
        <p className="text-mute text-sm mt-6">
          Inga kort hittades. Prova ett kortare namn (på engelska) eller bara
          numret med totalen.
        </p>
      )}

      {results && results.length > 0 && (
        <>
          {(eras.length > 1 || rarities.length > 1) && (
            <div className="flex flex-wrap gap-2 mt-6">
              {eras.length > 1 && (
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  className="focus-ring bg-ink border border-line rounded px-3 py-2 text-sm text-paper"
                  aria-label="Filtrera på era"
                >
                  <option value="">Alla eror</option>
                  {eras.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              )}
              {rarities.length > 1 && (
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className="focus-ring bg-ink border border-line rounded px-3 py-2 text-sm text-paper"
                  aria-label="Filtrera på sällsynthet"
                >
                  <option value="">Alla sällsynthetsgrader</option>
                  {rarities.map((x) => (
                    <option key={x} value={x}>{rarityLabel[x] ?? x}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <p className="text-xs text-mute font-mono mt-4">
            {shown.length} kort{truncated ? " (visar de första – förfina sökningen)" : ""}
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {shown.map((r) => (
              <li key={r.id} className="flex gap-3 border border-line rounded p-3 bg-ink/50">
                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image_url}
                    alt={r.name}
                    loading="lazy"
                    className="w-20 h-auto rounded self-start"
                  />
                ) : (
                  <div className="w-20 h-28 bg-line rounded" />
                )}
                <div className="min-w-0 text-sm">
                  <div className="font-semibold text-paper">{r.name}</div>
                  <div className="text-mute">{r.setName}</div>
                  <div className="text-mute font-mono text-xs">
                    {r.numberText} · {rarityLabel[r.rarity] ?? r.rarity}
                  </div>
                  <div className="mt-2 flex flex-col gap-1">
                    <a href={r.cardmarketUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      Se pris på Cardmarket ↗
                    </a>
                    {r.pricechartingUrl && (
                      <a href={r.pricechartingUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                        Graderat pris ↗
                      </a>
                    )}
                    <a
                      href={`/konto/portfolj?set=${encodeURIComponent(r.setSlug)}&q=${encodeURIComponent(r.name)}`}
                      className="text-gold hover:underline"
                    >
                      Lägg i min portfölj →
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
