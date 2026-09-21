"use client";

import { useMemo, useState } from "react";

interface SetOption {
  id: string;
  slug: string;
  name: string;
  category_name: string;
}

export default function SetPicker({
  sets,
  selectedSlug,
  baseHref,
}: {
  sets: SetOption[];
  selectedSlug: string | undefined;
  baseHref: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sets;
    return sets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category_name.toLowerCase().includes(q)
    );
  }, [sets, query]);

  const categories = Array.from(new Set(filtered.map((s) => s.category_name)));

  return (
    <div className="mb-8">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Sök set eller era (t.ex. Base, XY, Scarlet & Violet)…"
        className="focus-ring w-full max-w-md mb-4 rounded-sm border border-line bg-panel px-3 py-2 text-sm text-paper placeholder:text-mute"
      />
      <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-1">
        {categories.map((cat) => (
          <div key={cat} className="w-full">
            <div className="text-xs uppercase tracking-wide text-mute mb-1 mt-2">
              {cat}
            </div>
            <div className="flex flex-wrap gap-2">
              {filtered
                .filter((s) => s.category_name === cat)
                .map((s) => (
                  <a
                    key={s.id}
                    href={`${baseHref}?set=${s.slug}`}
                    className={`focus-ring text-xs rounded-sm border px-3 py-1.5 ${
                      s.slug === selectedSlug
                        ? "border-gold text-gold bg-gold/10"
                        : "border-line text-mute hover:border-mute"
                    }`}
                  >
                    {s.name}
                  </a>
                ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-mute text-sm">Inga set matchar sökningen.</p>
        )}
      </div>
    </div>
  );
}
