"use client";

import { useRef, useState } from "react";
import { Rarity } from "@/lib/types";
import { rarityLabel } from "@/lib/rarity";

interface Result {
  id: string;
  name: string;
  rarity: Rarity;
  image_url: string | null;
  numberText: string;
  setName: string;
  era: string;
  cardmarketUrl: string;
  pricechartingUrl: string | null;
}
interface Price {
  lowEur: number | null;
  trendEur: number | null;
  avg30Eur: number | null;
  lowSek: number | null;
  trendSek: number | null;
  updatedAt: string | null;
}

const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

function loadTesseract(): Promise<any> {
  const w = window as any;
  if (w.Tesseract) return Promise.resolve(w.Tesseract);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TESSERACT_URL;
    s.onload = () => resolve((window as any).Tesseract);
    s.onerror = () => reject(new Error("Kunde inte ladda läsmotorn. Kontrollera uppkopplingen."));
    document.head.appendChild(s);
  });
}

// Ritar ut en del av bilden (i andelar av höjden) på en egen canvas, i
// gråskala med lite extra kontrast -- det gör liten tryckt text lättare att läsa.
function cropCanvas(
  img: ImageBitmap,
  fromY: number,
  toY: number,
  maxW: number
): HTMLCanvasElement {
  const sy = Math.round(img.height * fromY);
  const sh = Math.round(img.height * (toY - fromY));
  const scale = Math.min(2, maxW / img.width);
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(sh * scale);
  const ctx = c.getContext("2d")!;
  ctx.filter = "grayscale(1) contrast(1.5)";
  ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, c.width, c.height);
  return c;
}

// Plockar ut kortnumret ur OCR-text, t.ex. "029/191" eller särnummer som
// "RC29/RC32" och "GG30/GG70".
function parseNumber(text: string): { query: string; label: string } | null {
  const t = text
    .toUpperCase()
    .replace(/O(?=\d)/g, "0")
    .replace(/(\d)O/g, "$10")
    .replace(/[IL|](?=\d)/g, "1")
    .replace(/(\d)[IL|]/g, "$11");
  const code = t.match(/\b(RC|TG|GG|SV|SH|H)\s?(\d{1,3})\s*\/\s*(?:RC|TG|GG|SV|SH|H)?\s?\d{1,3}\b/);
  if (code) {
    const q = `${code[1]}${parseInt(code[2], 10)}`;
    return { query: q, label: q };
  }
  const re = /(\d{1,3})\s*\/\s*(\d{1,3})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const n = parseInt(m[1], 10);
    const total = parseInt(m[2], 10);
    if (n >= 1 && total >= 10 && total <= 400 && n <= total + 150) {
      return { query: `${n}/${total}`, label: `${String(n).padStart(3, "0")}/${String(total).padStart(3, "0")}` };
    }
  }
  return null;
}

// Gissar namnet från översta raden på kortet.
function parseName(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/[^A-Za-zÀ-ÿ'’\s-]/g, " ").replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 3);
  const cleaned = lines
    .map((l) =>
      l
        .replace(/\b(basic|stage\s*[12]?|vstar|vmax|hp|trainer|supporter|item|pokemon|pokémon|tool)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((l) => l.length >= 3);
  if (cleaned.length === 0) return "";
  const best = cleaned.sort((a, b) => b.length - a.length)[0];
  return best.split(" ").slice(0, 3).join(" ");
}

const sek = (n: number | null) => (n === null ? "–" : `${n.toLocaleString("sv-SE")} kr`);

export default function SkannaPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [read, setRead] = useState<{ number: string; name: string } | null>(null);
  const [manual, setManual] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [prices, setPrices] = useState<Record<string, Price | null>>({});
  const [eurSek, setEurSek] = useState<number | null>(null);

  async function search(q: string, nameHint = "") {
    setBusy("Söker kortet…");
    setError(null);
    setResults(null);
    setPrices({});
    try {
      const r = await fetch(`/api/hitta-kort?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Sökningen misslyckades.");
      let list: Result[] = (j.results ?? []).slice(0, 12);
      if (nameHint) {
        const words = nameHint.toLowerCase().split(" ").filter((w) => w.length >= 3);
        const score = (c: Result) => words.filter((w) => c.name.toLowerCase().includes(w)).length;
        list = [...list].sort((a, b) => score(b) - score(a));
      }
      setResults(list);
      if (list.length > 0) {
        setBusy("Hämtar värde…");
        const pr = await fetch(`/api/kortvarde?ids=${list.map((c) => c.id).join(",")}`);
        if (pr.ok) {
          const pj = await pr.json();
          setPrices(pj.prices ?? {});
          setEurSek(pj.eurSek ?? null);
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Något gick fel.");
    } finally {
      setBusy(null);
    }
  }

  async function onFile(file: File) {
    setError(null);
    setResults(null);
    setRead(null);
    setPrices({});
    setPreview(URL.createObjectURL(file));
    try {
      setBusy("Laddar läsmotorn (första gången tar det en stund)…");
      const Tesseract = await loadTesseract();
      const img = await createImageBitmap(file);
      const worker = await Tesseract.createWorker("eng");

      setBusy("Läser kortnumret…");
      await worker.setParameters({
        tessedit_pageseg_mode: "11",
        tessedit_char_whitelist: "0123456789/ABCDEFGHIJKLMNOPQRSTUVWXYZ ",
      });
      // Numret sitter längst ned på kortet.
      let numRes = parseNumber((await worker.recognize(cropCanvas(img, 0.75, 1, 2200))).data.text);
      if (!numRes) numRes = parseNumber((await worker.recognize(cropCanvas(img, 0.6, 1, 2200))).data.text);

      setBusy("Läser namnet…");
      await worker.setParameters({
        tessedit_pageseg_mode: "6",
        tessedit_char_whitelist: "",
      });
      const name = parseName((await worker.recognize(cropCanvas(img, 0, 0.2, 1800))).data.text);
      await worker.terminate();

      setRead({ number: numRes?.label ?? "", name });
      setManual(numRes?.query ?? name);

      if (numRes) {
        await search(numRes.query, name);
      } else if (name) {
        await search(name);
      } else {
        setBusy(null);
        setError("Kunde inte läsa kortet. Ta ett närmare foto rakt ovanifrån, eller skriv numret nedan.");
      }
    } catch (e: any) {
      setBusy(null);
      setError(e.message ?? "Kunde inte läsa bilden.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-paper mb-1">Skanna kort</h1>
      <p className="text-mute text-sm mb-6">
        Ta ett foto på kortet så läser vi numret och visar ungefärligt värde. Bilden stannar i din
        telefon och skickas inte till oss.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={!!busy}
        className="focus-ring w-full sm:w-auto bg-gold text-ink font-semibold rounded-md px-6 py-3 disabled:opacity-60"
      >
        {busy ? "Arbetar…" : "📷 Fotografera kort"}
      </button>
      <p className="text-xs text-mute mt-2">
        Tips: lägg kortet platt mot ett enfärgat underlag, fyll bilden med kortet och undvik
        reflexer. Numret sitter längst ned på kortet (t.ex. 029/191).
      </p>

      {busy && <p className="mt-4 text-sm text-gold">{busy}</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {(preview || read) && (
        <div className="mt-6 flex gap-4 items-start">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Ditt foto" className="w-24 rounded-sm border border-line" />
          )}
          <div className="text-sm flex-1">
            {read && (
              <p className="text-paper mb-2">
                Läste: <span className="font-mono text-gold">{read.number || "inget nummer"}</span>
                {read.name && <span className="text-mute"> · namn: {read.name}</span>}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manual.trim()) search(manual.trim());
              }}
              className="flex gap-2"
            >
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="t.ex. 29/191 eller pikachu rc29"
                className="focus-ring flex-1 min-w-0 bg-panel border border-line rounded-md px-3 py-2 text-paper"
              />
              <button type="submit" className="focus-ring border border-line rounded-md px-3 py-2 text-paper hover:border-gold">
                Sök
              </button>
            </form>
            <p className="text-xs text-mute mt-1">Fel nummer? Rätta det här och sök igen.</p>
          </div>
        </div>
      )}

      {results && (
        <div className="mt-8">
          {results.length === 0 ? (
            <p className="text-mute text-sm">Hittade inget kort med det numret. Prova att rätta numret ovan.</p>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-paper mb-1">
                {results.length === 1 ? "Det här kortet" : "Vilket av dessa är ditt kort?"}
              </h2>
              <p className="text-xs text-mute mb-3">
                Samma nummer kan finnas i flera set. Jämför bilden och setnamnet.
              </p>
              <div className="space-y-3">
                {results.map((c) => {
                  const p = prices[c.id];
                  return (
                    <div key={c.id} className="border border-line rounded-md bg-panel p-3 flex gap-3">
                      {c.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image_url} alt={c.name} className="w-20 rounded-sm shrink-0 self-start" loading="lazy" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-paper font-semibold">{c.name}</div>
                        <div className="text-xs text-mute">
                          {c.setName} · {c.numberText} · {rarityLabel[c.rarity] ?? c.rarity}
                        </div>
                        <div className="mt-2">
                          {p ? (
                            <>
                              <div className="font-display text-xl font-bold text-gold">
                                ≈ {sek(p.trendSek)}
                              </div>
                              <div className="text-xs text-mute">
                                Cardmarket-trend (ogradat) · lägsta annons {sek(p.lowSek)}
                                {p.trendEur !== null && ` · ${p.trendEur.toFixed(2)} €`}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-mute">
                              {busy === "Hämtar värde…" ? "Hämtar värde…" : "Inget pris tillgängligt för det här kortet."}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <a href={c.cardmarketUrl} target="_blank" rel="noopener noreferrer" className="focus-ring border border-line rounded px-2 py-1 text-paper hover:border-gold">
                            Cardmarket ↗
                          </a>
                          {c.pricechartingUrl && (
                            <a href={c.pricechartingUrl} target="_blank" rel="noopener noreferrer" className="focus-ring border border-line rounded px-2 py-1 text-paper hover:border-gold">
                              Gradat värde (PriceCharting) ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-mute mt-4">
                Priserna är ungefärliga referensvärden för kort i bra skick, omräknade från euro
                {eurSek ? ` (1 € ≈ ${eurSek.toLocaleString("sv-SE")} kr)` : ""}. Ett verkligt pris beror på
                skick, språk och tryck.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
