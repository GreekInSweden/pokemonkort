"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Variant } from "@/lib/types";
import { variantLabel } from "@/lib/variant";

export interface SetPackageSummary {
  setId: string;
  setSlug: string;
  setName: string;
  categoryName: string;
  totalCards: number;
  variants: {
    variant: Variant;
    definedCount: number;
    inStockCount: number;
    missing: { number: number; name: string }[];
    packagePriceSek: number;
    isComplete: boolean;
  }[];
}

export default function PackageCompleteness({
  sets,
}: {
  sets: SetPackageSummary[];
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sets;
    return sets.filter(
      (s) =>
        s.setName.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q)
    );
  }, [sets, query]);

  const sorted = useMemo(() => {
    // Sets with a complete package first, then by how close the best
    // variant is to complete.
    return [...filtered].sort((a, b) => {
      const bestA = Math.max(
        0,
        ...a.variants.map((v) => v.inStockCount / v.definedCount)
      );
      const bestB = Math.max(
        0,
        ...b.variants.map((v) => v.inStockCount / v.definedCount)
      );
      return bestB - bestA;
    });
  }, [filtered]);

  function toggle(key: string) {
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Sök set eller kategori…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="focus-ring w-full bg-panel border border-line rounded-sm px-3 py-2 text-paper text-sm mb-6"
      />

      {sorted.length === 0 ? (
        <p className="text-mute">Inga set matchar sökningen.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((s) => (
            <div
              key={s.setId}
              className="border border-line rounded-md p-4 bg-panel"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-mute font-mono">
                    {s.categoryName}
                  </div>
                  <Link
                    href={`/admin/${s.setSlug}`}
                    className="focus-ring font-display font-medium text-paper hover:text-gold"
                  >
                    {s.setName}
                  </Link>
                </div>
                <div className="text-xs text-mute font-mono shrink-0">
                  {s.totalCards} kort totalt
                </div>
              </div>

              <div className="space-y-2">
                {s.variants.map((v) => {
                  const pct = Math.round(
                    (v.inStockCount / v.definedCount) * 100
                  );
                  const key = `${s.setId}-${v.variant}`;
                  const isExpanded = expanded[key] ?? false;
                  return (
                    <div
                      key={v.variant}
                      className="border border-line rounded-sm p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-sm font-medium shrink-0 ${
                              v.isComplete ? "text-gold" : "text-paper"
                            }`}
                          >
                            {variantLabel[v.variant]}
                          </span>
                          {v.isComplete && (
                            <span className="text-xs text-gold shrink-0">
                              Komplett ✓
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-mute shrink-0">
                          {v.inStockCount}/{v.definedCount} ({pct}%)
                        </div>
                      </div>

                      <div className="h-1.5 bg-line rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            v.isComplete ? "bg-gold" : "bg-mute"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-mute font-mono">
                          {v.isComplete
                            ? "Föreslaget paketpris"
                            : "Summa om kompletterat till fulla priset"}
                          : <span className="text-paper">{v.packagePriceSek.toLocaleString("sv-SE")} kr</span>
                        </div>
                        {v.missing.length > 0 && (
                          <button
                            onClick={() => toggle(key)}
                            className="focus-ring text-xs text-mute hover:text-gold shrink-0"
                          >
                            {isExpanded
                              ? "Dölj saknade"
                              : `Visa ${v.missing.length} saknade`}
                          </button>
                        )}
                      </div>

                      {isExpanded && v.missing.length > 0 && (
                        <div className="mt-2 text-xs text-mute font-mono flex flex-wrap gap-x-3 gap-y-1">
                          {v.missing.map((m) => (
                            <span key={m.number}>
                              #{String(m.number).padStart(3, "0")} {m.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
