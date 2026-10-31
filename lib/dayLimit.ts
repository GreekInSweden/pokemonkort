// Dygnsgräns i svensk tid: "idag" börjar 00:00 Europe/Stockholm (hanterar sommartid).
const TZ = "Europe/Stockholm";

function offsetMs(at: Date): number {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

export function startOfStockholmDay(now: Date = new Date()): Date {
  const local = new Date(now.getTime() + offsetMs(now));
  const midnightLocalAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  let guess = new Date(midnightLocalAsUtc - offsetMs(now));
  guess = new Date(midnightLocalAsUtc - offsetMs(guess)); // andra passet vid sommartidsbyte
  return guess;
}

export const normPhone = (s?: string | null) => (s ?? "").replace(/\D/g, "").replace(/^(0046|46)/, "0").replace(/^0+/, "").slice(-9);
export const normAddress = (a?: string | null, zip?: string | null) =>
  `${(a ?? "").toLowerCase().replace(/[^a-z0-9åäö]/g, "")}|${(zip ?? "").replace(/\D/g, "")}`;
export const normEmail = (s?: string | null) => (s ?? "").trim().toLowerCase();
