import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Pris för ett eller flera kort (max 12). Priserna kommer från
// pokemontcg.io (som i sin tur hämtar Cardmarkets prisstatistik) och räknas
// om från euro till kronor. Bara referensdata, inget privat.
//
// Valfria miljövariabler i Vercel:
//   POKEMONTCG_API_KEY  -- gratis nyckel från dev.pokemontcg.io (högre gräns)
//   EUR_SEK_FALLBACK    -- kurs om växelkurstjänsten inte svarar (standard 11)

type Price = {
  id: string;
  lowEur: number | null;
  trendEur: number | null;
  avg30Eur: number | null;
  lowSek: number | null;
  trendSek: number | null;
  updatedAt: string | null;
} | null;

function tcgId(imageUrl: string | null): string | null {
  const m = imageUrl?.match(/images\.pokemontcg\.io\/([^/]+)\/([^_/]+)_hires/);
  return m ? `${m[1]}-${m[2]}` : null;
}

async function eurToSek(): Promise<number> {
  const fallback = Number(process.env.EUR_SEK_FALLBACK) || 11;
  try {
    const r = await fetch("https://api.frankfurter.app/latest?from=EUR&to=SEK", {
      next: { revalidate: 43200 },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return fallback;
    const j = await r.json();
    const rate = Number(j?.rates?.SEK);
    return rate > 5 && rate < 20 ? rate : fallback;
  } catch {
    return fallback;
  }
}

async function fetchPrice(tcg: string, rate: number): Promise<Price> {
  try {
    const headers: Record<string, string> = {};
    if (process.env.POKEMONTCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
    const r = await fetch(
      `https://api.pokemontcg.io/v2/cards/${encodeURIComponent(tcg)}?select=id,cardmarket`,
      { headers, next: { revalidate: 21600 }, signal: AbortSignal.timeout(7000) }
    );
    if (!r.ok) return null;
    const j = await r.json();
    const cm = j?.data?.cardmarket;
    const p = cm?.prices;
    if (!p) return null;
    const num = (v: any) => (typeof v === "number" && v > 0 ? v : null);
    const low = num(p.lowPrice);
    const trend = num(p.trendPrice) ?? num(p.averageSellPrice);
    const avg30 = num(p.avg30);
    if (low === null && trend === null) return null;
    const sek = (e: number | null) => (e === null ? null : Math.max(1, Math.round(e * rate)));
    return {
      id: tcg,
      lowEur: low,
      trendEur: trend,
      avg30Eur: avg30,
      lowSek: sek(low),
      trendSek: sek(trend),
      updatedAt: cm?.updatedAt ?? null,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`kortvarde:${ip}`, 30, 60))) {
    return NextResponse.json({ error: "För många förfrågningar, vänta en minut." }, { status: 429 });
  }
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s))
    .slice(0, 12);
  if (ids.length === 0) return NextResponse.json({ prices: {} });

  const { data } = await supabaseAdmin.from("cards").select("id, image_url").in("id", ids);
  const rate = await eurToSek();
  const prices: Record<string, Price> = {};
  await Promise.all(
    ((data as any[]) ?? []).map(async (c) => {
      const tcg = tcgId(c.image_url);
      prices[c.id] = tcg ? await fetchPrice(tcg, rate) : null;
    })
  );
  return NextResponse.json({ prices, eurSek: Math.round(rate * 100) / 100 });
}
