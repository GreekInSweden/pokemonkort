import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// PostgREST kapar svar vid 1000 rader -- hämta allt i omgångar.
async function fetchAll<T = any>(
  table: string,
  select: string,
  filter?: (q: any) => any
): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    let q: any = supabaseAdmin.from(table).select(select).range(from, from + page - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error || !data) break;
    out.push(...(data as T[]));
    if (data.length < page) break;
  }
  return out;
}

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

function Bar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 rounded-sm bg-line/60 overflow-hidden ${className}`}>
      <div className="h-full bg-gold" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-line rounded-md p-4 bg-panel">
      <div className="text-xs font-mono text-mute uppercase tracking-wide">{label}</div>
      <div className="font-display text-2xl font-bold text-paper mt-1">{value}</div>
      {sub && <div className="text-xs text-mute mt-1">{sub}</div>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-lg font-semibold text-paper">{title}</h2>
      {hint && <p className="text-mute text-sm mb-3">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

const VARIANT_LABEL: Record<string, string> = {
  normal: "Vanligt",
  holo: "Holo",
  reverse_holo: "Reverse Holo",
};

export default async function AdminStatistikPage() {
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const dayStr = (ms: number) =>
    new Date(ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });

  // ---------------------------------------------------------------
  // Besökare (kräver site_stats.sql)
  // ---------------------------------------------------------------
  const presenceRes = await supabaseAdmin
    .from("site_presence")
    .select("session_id, member_id, path, last_seen")
    .gte("last_seen", iso(now - 5 * 60 * 1000));
  const presenceMissing = !!presenceRes.error;
  const online = (presenceRes.data as any[]) ?? [];
  const onlineMembers = online.filter((p) => p.member_id).length;

  const pathCounts = new Map<string, number>();
  for (const p of online) pathCounts.set(p.path ?? "/", (pathCounts.get(p.path ?? "/") ?? 0) + 1);
  const topPaths = [...pathCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const visitRows = presenceMissing
    ? []
    : await fetchAll<{ day: string; session_id: string; member_id: string | null }>(
        "site_daily_visitors",
        "day, session_id, member_id",
        (q) => q.gte("day", dayStr(now - 29 * 24 * 3600 * 1000))
      );
  const perDay = new Map<string, { visitors: number; members: number }>();
  for (const r of visitRows) {
    const d = perDay.get(r.day) ?? { visitors: 0, members: 0 };
    d.visitors += 1;
    if (r.member_id) d.members += 1;
    perDay.set(r.day, d);
  }
  const days14: { day: string; visitors: number; members: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = dayStr(now - i * 24 * 3600 * 1000);
    days14.push({ day: d, ...(perDay.get(d) ?? { visitors: 0, members: 0 }) });
  }
  const maxVisitors = Math.max(1, ...days14.map((d) => d.visitors));
  const today = perDay.get(dayStr(now))?.visitors ?? 0;
  const last7 = days14.slice(-7).reduce((s, d) => s + d.visitors, 0);
  const last30 = [...perDay.values()].reduce((s, d) => s + d.visitors, 0);
  const peakDay = days14.reduce((best, d) => (d.visitors > best.visitors ? d : best), days14[0]);

  // ---------------------------------------------------------------
  // Katalog + medlemmar + portföljer
  // ---------------------------------------------------------------
  const [sets, cards, variants, members, memberCards] = await Promise.all([
    fetchAll<{ id: string; name: string; category_name: string }>("sets", "id, name, category_name"),
    fetchAll<{ id: string; set_id: string; number: number; name: string }>(
      "cards",
      "id, set_id, number, name"
    ),
    fetchAll<{ card_id: string; variant: string }>("card_variants", "card_id, variant"),
    fetchAll<{ id: string; member_number: number; username: string | null; name: string; created_at: string }>(
      "members",
      "id, member_number, username, name, created_at"
    ),
    fetchAll<{ member_id: string; card_id: string; variant: string; status: string; quantity: number }>(
      "member_cards",
      "member_id, card_id, variant, status, quantity"
    ),
  ]);

  const setById = new Map(sets.map((s) => [s.id, s]));
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const cardsPerSet = new Map<string, number>();
  for (const c of cards) cardsPerSet.set(c.set_id, (cardsPerSet.get(c.set_id) ?? 0) + 1);
  const variantsPerCard = new Map<string, number>();
  for (const v of variants) variantsPerCard.set(v.card_id, (variantsPerCard.get(v.card_id) ?? 0) + 1);

  // member -> card -> antal markerade tryck ("har")
  const haveMarks = new Map<string, Map<string, number>>();
  const wantCount = new Map<string, number>(); // member -> antal önskade
  const wantByCard = new Map<string, number>(); // kort -> hur många vill ha
  const haveByCard = new Map<string, number>();
  const haveByCardVariant = new Map<string, number>();
  const wantByCardVariant = new Map<string, number>();
  const haveMembersByCardVariant = new Map<string, Set<string>>();
  let haveTotal = 0;
  let wantTotal = 0;
  for (const r of memberCards) {
    const key = `${r.card_id}|${r.variant}`;
    if (r.status === "have") {
      haveTotal += 1;
      const m = haveMarks.get(r.member_id) ?? new Map<string, number>();
      m.set(r.card_id, (m.get(r.card_id) ?? 0) + 1);
      haveMarks.set(r.member_id, m);
      haveByCard.set(r.card_id, (haveByCard.get(r.card_id) ?? 0) + 1);
      haveByCardVariant.set(key, (haveByCardVariant.get(key) ?? 0) + (r.quantity || 1));
      const s = haveMembersByCardVariant.get(key) ?? new Set<string>();
      s.add(r.member_id);
      haveMembersByCardVariant.set(key, s);
    } else {
      wantTotal += 1;
      wantCount.set(r.member_id, (wantCount.get(r.member_id) ?? 0) + 1);
      wantByCard.set(r.card_id, (wantByCard.get(r.card_id) ?? 0) + 1);
      wantByCardVariant.set(key, (wantByCardVariant.get(key) ?? 0) + 1);
    }
  }

  // Ett kort räknas som "klart" först när alla dess tryck är markerade
  // (samma regel som i portföljen / Master Set).
  type SetProgress = { setId: string; done: number; total: number };
  const progressByMember = new Map<string, SetProgress[]>();
  for (const [memberId, marks] of haveMarks) {
    const doneBySet = new Map<string, number>();
    const startedSets = new Set<string>();
    for (const [cardId, n] of marks) {
      const card = cardById.get(cardId);
      if (!card) continue;
      startedSets.add(card.set_id);
      if (n >= (variantsPerCard.get(cardId) ?? 1)) {
        doneBySet.set(card.set_id, (doneBySet.get(card.set_id) ?? 0) + 1);
      }
    }
    const list: SetProgress[] = [...startedSets].map((setId) => ({
      setId,
      done: doneBySet.get(setId) ?? 0,
      total: cardsPerSet.get(setId) ?? 0,
    }));
    list.sort((a, b) => pct(b.done, b.total) - pct(a.done, a.total));
    progressByMember.set(memberId, list);
  }

  const memberRows = members.map((m) => {
    const prog = progressByMember.get(m.id) ?? [];
    const marks = [...(haveMarks.get(m.id)?.values() ?? [])].reduce((s, n) => s + n, 0);
    return {
      ...m,
      marks,
      wants: wantCount.get(m.id) ?? 0,
      prog,
      best: prog.length ? pct(prog[0].done, prog[0].total) : 0,
    };
  });
  memberRows.sort((a, b) => b.marks - a.marks);
  const activeMembers = memberRows.filter((m) => m.marks > 0 || m.wants > 0).length;
  const newLast7 = members.filter((m) => now - new Date(m.created_at).getTime() < 7 * 24 * 3600 * 1000).length;
  const newLast30 = members.filter((m) => now - new Date(m.created_at).getTime() < 30 * 24 * 3600 * 1000).length;

  // Per set
  const setRows = sets
    .map((s) => {
      const entries = [...progressByMember.values()]
        .map((list) => list.find((p) => p.setId === s.id))
        .filter(Boolean) as SetProgress[];
      const total = cardsPerSet.get(s.id) ?? 0;
      const avg = entries.length
        ? Math.round(entries.reduce((sum, e) => sum + pct(e.done, e.total), 0) / entries.length)
        : 0;
      const best = entries.length ? Math.max(...entries.map((e) => pct(e.done, e.total))) : 0;
      return { id: s.id, name: s.name, era: s.category_name, total, started: entries.length, avg, best };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.started - a.started || b.avg - a.avg);

  // Roliga listor
  const cardLabel = (cardId: string) => {
    const c = cardById.get(cardId);
    if (!c) return "Okänt kort";
    return `${c.name} #${c.number} (${setById.get(c.set_id)?.name ?? "?"})`;
  };
  const topWanted = [...wantByCardVariant.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topOwned = [...haveByCardVariant.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Matchningar: önskningar som minst en ANNAN medlem har
  let matchable = 0;
  const matchedMembers = new Set<string>();
  for (const r of memberCards) {
    if (r.status !== "want") continue;
    const owners = haveMembersByCardVariant.get(`${r.card_id}|${r.variant}`);
    if (owners && [...owners].some((id) => id !== r.member_id)) {
      matchable += 1;
      matchedMembers.add(r.member_id);
    }
  }

  const biggest = memberRows[0];
  const mostWishful = [...memberRows].sort((a, b) => b.wants - a.wants)[0];
  const mostPopularSet = setRows[0];
  const rareHaves = [...haveByCard.entries()].filter(([, n]) => n === 1).length;

  // Auktioner & beställningar
  const [auctionsRes, bidsRes, ordersRes] = await Promise.all([
    supabaseAdmin.from("auctions").select("id, status"),
    supabaseAdmin.from("bids").select("amount_sek, auction_id"),
    supabaseAdmin.from("orders").select("total_sek, status"),
  ]);
  const auctions = (auctionsRes.data as any[]) ?? [];
  const bids = (bidsRes.data as any[]) ?? [];
  const orders = (ordersRes.data as any[]) ?? [];
  const highBid = bids.reduce((m, b) => Math.max(m, Number(b.amount_sek) || 0), 0);
  const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "shipped");
  const paidSum = paidOrders.reduce((s, o) => s + (Number(o.total_sek) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-paper mb-1">Statistik</h1>
      <p className="text-mute text-sm mb-8">
        Uppdateras varje gång du laddar om sidan. Besökare räknas anonymt (ingen cookie, ingen IP
        sparas) och bottar filtreras bort.
      </p>

      {/* ---------------- Besökare ---------------- */}
      <Section title="Besökare" hint="Online = aktiv de senaste 5 minuterna med fliken synlig.">
        {presenceMissing ? (
          <div className="border border-line rounded-md p-4 bg-panel text-sm text-mute">
            Besöksstatistiken är inte påslagen ännu. Kör <span className="font-mono text-paper">site_stats.sql</span>{" "}
            i Supabase SQL Editor och lägg in <span className="font-mono text-paper">PresencePing</span> i layouten
            (se instruktionen). Resten av sidan fungerar redan.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label="Online nu" value={online.length} sub={`${onlineMembers} inloggade medlemmar`} />
              <Stat label="Idag" value={today} sub="unika besökare" />
              <Stat label="Senaste 7 dagarna" value={last7} sub="besökardagar" />
              <Stat label="Senaste 30 dagarna" value={last30} sub="besökardagar" />
            </div>
            <div className="border border-line rounded-md p-4 bg-panel mb-4">
              <div className="text-xs font-mono text-mute mb-3">
                Unika besökare per dag (14 dagar) · mörkare del = inloggade medlemmar
              </div>
              <div className="flex items-end gap-1 h-32">
                {days14.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.day}: ${d.visitors} besökare, varav ${d.members} medlemmar`}>
                    <div className="text-[10px] text-mute mb-1">{d.visitors || ""}</div>
                    <div className="w-full bg-gold/40 rounded-t-sm relative" style={{ height: `${(d.visitors / maxVisitors) * 100}%`, minHeight: d.visitors ? 2 : 0 }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-gold rounded-t-sm" style={{ height: d.visitors ? `${(d.members / d.visitors) * 100}%` : 0 }} />
                    </div>
                    <div className="text-[10px] text-mute mt-1">{d.day.slice(8)}</div>
                  </div>
                ))}
              </div>
              {peakDay.visitors > 0 && (
                <div className="text-xs text-mute mt-3">
                  Starkaste dagen: {peakDay.day} med {peakDay.visitors} besökare.
                </div>
              )}
            </div>
            {topPaths.length > 0 && (
              <div className="border border-line rounded-md p-4 bg-panel">
                <div className="text-xs font-mono text-mute mb-2">Var är folk just nu?</div>
                <ul className="text-sm text-paper space-y-1">
                  {topPaths.map(([p, n]) => (
                    <li key={p} className="flex justify-between gap-3">
                      <span className="font-mono truncate">{p}</span>
                      <span className="text-mute">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Section>

      {/* ---------------- Medlemmar ---------------- */}
      <Section title="Medlemmar och aktivitet" hint="Aktiv = har markerat minst ett kort som Har eller Vill ha.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Medlemmar" value={members.length} sub={`+${newLast7} senaste 7 dagarna · +${newLast30} på 30 dagar`} />
          <Stat label="Aktiva medlemmar" value={`${activeMembers} (${pct(activeMembers, members.length)}%)`} />
          <Stat label="Markerade kort" value={haveTotal} sub={`${wantTotal} önskade`} />
          <Stat
            label="Snitt per aktiv"
            value={activeMembers ? Math.round((haveTotal + wantTotal) / activeMembers) : 0}
            sub="markeringar"
          />
        </div>
      </Section>

      {/* ---------------- Per set ---------------- */}
      <Section
        title="Set: hur många har börjat och hur långt har de kommit?"
        hint="Procent = andel av setets kort där ALLA tryck är markerade som Har. Snitt räknas bara bland dem som börjat på setet."
      >
        <div className="border border-line rounded-md bg-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-mono text-mute border-b border-line">
                <th className="p-3">Set</th>
                <th className="p-3">Kort</th>
                <th className="p-3">Börjat</th>
                <th className="p-3 w-40">Snitt</th>
                <th className="p-3">Bäst</th>
              </tr>
            </thead>
            <tbody>
              {setRows.map((s) => (
                <tr key={s.id} className="border-b border-line/50 last:border-0">
                  <td className="p-3 text-paper">
                    {s.name} <span className="text-mute text-xs">· {s.era}</span>
                  </td>
                  <td className="p-3 text-mute">{s.total}</td>
                  <td className="p-3 text-paper">
                    {s.started} <span className="text-mute text-xs">({pct(s.started, members.length)}% av alla)</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Bar value={s.avg} className="w-24" />
                      <span className="text-xs text-mute">{s.avg}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-paper">{s.best}%</td>
                </tr>
              ))}
              {setRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-mute">Inga set ännu.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ---------------- Per medlem ---------------- */}
      <Section title="Per medlem" hint="Klicka på en medlem för att se procent per set. Sorterat på antal markerade kort.">
        <div className="space-y-2">
          {memberRows.map((m) => (
            <details key={m.id} className="border border-line rounded-md bg-panel">
              <summary className="cursor-pointer p-3 flex items-center justify-between gap-3">
                <span className="text-paper">
                  <span className="font-mono text-xs text-gold">#{m.member_number}</span>{" "}
                  {m.username ?? m.name}
                </span>
                <span className="text-xs text-mute text-right">
                  {m.marks} har · {m.wants} vill ha · {m.prog.length} set · bäst {m.best}%
                </span>
              </summary>
              <div className="px-3 pb-3 space-y-2">
                {m.prog.length === 0 && <div className="text-sm text-mute">Har inte markerat något ännu.</div>}
                {m.prog.map((p) => (
                  <div key={p.setId} className="flex items-center gap-3 text-sm">
                    <span className="w-56 truncate text-paper">{setById.get(p.setId)?.name ?? "?"}</span>
                    <Bar value={pct(p.done, p.total)} className="flex-1" />
                    <span className="w-24 text-right text-xs text-mute">
                      {pct(p.done, p.total)}% ({p.done}/{p.total})
                    </span>
                  </div>
                ))}
              </div>
            </details>
          ))}
          {memberRows.length === 0 && <p className="text-mute text-sm">Inga medlemmar ännu.</p>}
        </div>
      </Section>

      {/* ---------------- Roliga siffror ---------------- */}
      <Section title="Roliga siffror">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <Stat
            label="Störst samling"
            value={biggest && biggest.marks ? `${biggest.username ?? biggest.name}` : "–"}
            sub={biggest && biggest.marks ? `${biggest.marks} markerade tryck` : undefined}
          />
          <Stat
            label="Längst önskelista"
            value={mostWishful && mostWishful.wants ? `${mostWishful.username ?? mostWishful.name}` : "–"}
            sub={mostWishful && mostWishful.wants ? `${mostWishful.wants} önskade kort` : undefined}
          />
          <Stat
            label="Populäraste setet"
            value={mostPopularSet && mostPopularSet.started ? mostPopularSet.name : "–"}
            sub={mostPopularSet && mostPopularSet.started ? `${mostPopularSet.started} medlemmar har börjat` : undefined}
          />
          <Stat
            label="Möjliga matchningar"
            value={matchable}
            sub={`önskningar som någon annan medlem har · ${matchedMembers.size} medlemmar berörda`}
          />
          <Stat label="Unika kort" value={rareHaves} sub="kort som exakt en medlem äger" />
          <Stat
            label="Auktioner"
            value={auctions.length}
            sub={`${auctions.filter((a) => a.status === "open").length} öppna · ${bids.length} bud · högsta ${Math.round(highBid)} kr`}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-line rounded-md p-4 bg-panel">
            <div className="text-xs font-mono text-mute mb-2">Mest önskade kort</div>
            {topWanted.length === 0 ? (
              <p className="text-sm text-mute">Inga önskningar ännu.</p>
            ) : (
              <ol className="text-sm space-y-1">
                {topWanted.map(([key, n]) => {
                  const [cardId, variant] = key.split("|");
                  return (
                    <li key={key} className="flex justify-between gap-3">
                      <span className="text-paper truncate">
                        {cardLabel(cardId)} <span className="text-mute text-xs">· {VARIANT_LABEL[variant] ?? variant}</span>
                      </span>
                      <span className="text-mute">{n}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <div className="border border-line rounded-md p-4 bg-panel">
            <div className="text-xs font-mono text-mute mb-2">Mest ägda kort</div>
            {topOwned.length === 0 ? (
              <p className="text-sm text-mute">Inga markerade kort ännu.</p>
            ) : (
              <ol className="text-sm space-y-1">
                {topOwned.map(([key, n]) => {
                  const [cardId, variant] = key.split("|");
                  return (
                    <li key={key} className="flex justify-between gap-3">
                      <span className="text-paper truncate">
                        {cardLabel(cardId)} <span className="text-mute text-xs">· {VARIANT_LABEL[variant] ?? variant}</span>
                      </span>
                      <span className="text-mute">{n} st</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {orders.length > 0 && (
          <p className="text-xs text-mute mt-4">
            Beställningar: {orders.length} totalt, {paidOrders.length} betalda/skickade ({Math.round(paidSum)} kr).
          </p>
        )}
      </Section>
    </div>
  );
}
