"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GIVEAWAY_REVEAL_MS } from "@/lib/giveawayConfig";

interface GiveawayData {
  serverNow: string;
  active: boolean;
  giveaway: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    audience: "all" | "paid";
    drawAt: string | null;
    status: "open" | "closed" | "drawn";
    entryCount: number;
    entriesOpen: boolean;
    memberGoal: number | null;
    goalReached: boolean;
    memberCount: number | null;
  } | null;
  me?: { loggedIn: boolean; joined: boolean; eligible: boolean; reason: string | null };
  drawing?: { startedAt: string; revealAt: string; names: string[] } | null;
  winnerLabel?: string | null;
  iWon?: boolean;
  previousWinners?: { title: string; label: string; drawnAt: string }[];
}

function formatLeft(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const CONFETTI_COLORS = ["#E8B33D", "#4FC1E9", "#F2994A", "#B26FD1", "#4FBF9F", "#F2F1ED"];

export default function GiveawayView() {
  const [data, setData] = useState<GiveawayData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const offsetRef = useRef(0); // serverklocka minus klientklocka
  const sawDrawingRef = useRef(false);
  const dataRef = useRef<GiveawayData | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/giveaway", { cache: "no-store" });
      const json: GiveawayData = await res.json();
      offsetRef.current = Date.parse(json.serverNow) - Date.now();
      if (json.drawing) sawDrawingRef.current = true;
      if (json.winnerLabel && sawDrawingRef.current) {
        setConfetti(true);
        sawDrawingRef.current = false;
        setTimeout(() => setConfetti(false), 7000);
      }
      dataRef.current = json;
      setData(json);
    } catch {
      /* behåll senaste data, försök igen vid nästa poll */
    }
  }, []);

  // Pollar tätare ju närmare dragningen vi är, så alla ser den ungefär
  // samtidigt. Själva animationen styrs av serverns starttid, så även den
  // som kommer in mitt i dragningen ser resten av den.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      if (!document.hidden) await load();
      if (stopped) return;
      const d = dataRef.current;
      let delay = 15000;
      if (d?.drawing) delay = 1000;
      else if (d?.giveaway) {
        const g = d.giveaway;
        if (g.status === "drawn") delay = d.winnerLabel ? 30000 : 1500;
        else if (g.memberGoal && !g.goalReached) delay = 8000;
        else {
          const toDraw = g.drawAt ? Date.parse(g.drawAt) - (Date.now() + offsetRef.current) : null;
          delay = toDraw === null || toDraw < 15 * 60_000 ? 3000 : 15000;
        }
      }
      timer = setTimeout(loop, delay);
    };
    loop();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [load]);

  // Sekundtick för nedräkningen.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  async function act(action: "join" | "leave") {
    if (!data?.giveaway) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/giveaway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giveawayId: data.giveaway.id, action }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Något gick fel.");
    }
    await load();
    setBusy(false);
  }

  if (!data) {
    return <p className="text-mute">Laddar…</p>;
  }
  if (!data.active || !data.giveaway) {
    return (
      <div>
        <h1 className="font-display text-4xl font-bold text-paper mb-2">Giveaway</h1>
        <p className="text-mute">Ingen giveaway just nu. Kom tillbaka snart!</p>
      </div>
    );
  }

  const g = data.giveaway;
  const me = data.me;
  const serverNow = Date.now() + offsetRef.current;
  const toDraw = g.drawAt ? Date.parse(g.drawAt) - serverNow : null;
  void tick;
  // Deadline stänger anmälan -- räknas om varje sekund, så knappen
  // försvinner i samma ögonblick nedräkningen når noll.
  const teaser = g.status === "open" && !!g.memberGoal && !g.goalReached;
  const entriesOpen = g.status === "open" && !teaser && (toDraw === null || toDraw > 0);

  return (
    <div>
      {confetti && <Confetti />}
      <h1 className="font-display text-4xl font-bold text-paper mb-2">{g.title}</h1>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="font-mono text-xs border border-line rounded-sm px-2 py-1 text-mute">
          {data.drawing ? "Dragning pågår" : g.status === "drawn" ? "Avslutad" : teaser ? "Öppnar vid målet" : g.status === "closed" || !entriesOpen ? "Anmälan stängd" : "Pågår"}
        </span>
        {g.audience === "paid" && (
          <span className="font-mono text-xs border border-gold/50 rounded-sm px-2 py-1 text-gold">
            Bara betalande medlemmar
          </span>
        )}
      </div>

      {g.imageUrl && (
        <div className="rounded-md border border-line bg-panel overflow-hidden mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.imageUrl} alt={g.title} className="w-full max-h-[420px] object-contain bg-ink" />
        </div>
      )}

      {g.description && (
        <p className="text-paper/90 whitespace-pre-line mb-6">{g.description}</p>
      )}

      {teaser && g.memberGoal && (
        <GoalProgress
          current={g.memberCount ?? 0}
          goal={g.memberGoal}
          loggedIn={!!me?.loggedIn}
        />
      )}
      {!teaser && g.memberGoal && g.status === "open" && (
        <p className="text-gold text-sm mb-4">
          🎉 Målet på {g.memberGoal} medlemmar är nått — nu är anmälan öppen!
        </p>
      )}

      {!teaser && (
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="border border-line rounded-md bg-panel p-4">
          <div className="font-mono text-3xl text-gold">{g.entryCount}</div>
          <div className="text-xs text-mute">{g.entryCount === 1 ? "deltagare" : "deltagare"}</div>
        </div>
        <div className="border border-line rounded-md bg-panel p-4">
          {g.status === "drawn" ? (
            <>
              <div className="font-mono text-3xl text-paper">{data.drawing ? "Live!" : "Dragen"}</div>
              <div className="text-xs text-mute">{data.drawing ? "dragningen pågår nu" : "vinnare utsedd"}</div>
            </>
          ) : toDraw !== null ? (
            <>
              <div className="font-mono text-3xl text-paper">
                {toDraw > 0 ? formatLeft(toDraw) : "Stängd"}
              </div>
              <div className="text-xs text-mute">
                {toDraw > 0 ? "kvar att anmäla sig" : "anmälan stängd, dragning snart"}
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-3xl text-paper">—</div>
              <div className="text-xs text-mute">dragningstid meddelas</div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Live-dragning / vinnare */}
      {data.drawing && (
        <Roulette
          names={data.drawing.names}
          startedAt={Date.parse(data.drawing.startedAt)}
          offset={offsetRef.current}
        />
      )}
      {!data.drawing && data.winnerLabel && (
        <div className="border border-gold rounded-md bg-gold/10 p-6 text-center mb-6">
          <div className="text-xs font-mono text-gold mb-2">VINNARE</div>
          <div className="font-display text-3xl font-bold text-paper">{data.winnerLabel}</div>
          {data.iWon && (
            <p className="text-gold mt-3">
              Grattis, det är du! Vi hör av oss. Du hittar också ett meddelande under{" "}
              <Link href="/konto/meddelanden" className="underline">
                Meddelanden
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {/* Delta-knappen */}
      {g.status === "open" && entriesOpen && !data.drawing && (
        <div className="mb-6">
          {!me?.loggedIn ? (
            <Link
              href="/konto/logga-in?next=/giveaway"
              className="focus-ring inline-block rounded-sm bg-gold text-ink font-semibold px-6 py-3"
            >
              Logga in för att delta
            </Link>
          ) : !me.eligible ? (
            <p className="text-sm text-amber-400/90">{me.reason}</p>
          ) : me.joined ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rounded-sm border border-gold text-gold px-4 py-2 font-semibold">
                ✓ Du är med
              </span>
              <button
                onClick={() => act("leave")}
                disabled={busy}
                className="focus-ring text-xs text-mute hover:text-paper underline disabled:opacity-50"
              >
                Dra mig ur
              </button>
            </div>
          ) : (
            <button
              onClick={() => act("join")}
              disabled={busy}
              className="focus-ring rounded-sm bg-gold text-ink font-semibold px-8 py-3 text-lg disabled:opacity-50"
            >
              {busy ? "Anmäler…" : "Delta i giveawayen"}
            </button>
          )}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      )}
      {((g.status === "open" && !entriesOpen && !teaser) || g.status === "closed") && !data.drawing && (
        <p className="text-mute mb-6">
          Anmälan är stängd. Dragningen kommer snart — håll sidan öppen så ser du den live!
        </p>
      )}

      {!!data.previousWinners?.length && (
        <div className="mt-10">
          <h2 className="font-display font-semibold text-paper mb-3">Tidigare vinnare</h2>
          <div className="border border-line rounded-md bg-panel divide-y divide-line">
            {data.previousWinners.map((w, i) => (
              <div key={i} className="px-4 py-2 flex justify-between gap-3 text-sm">
                <span className="text-mute truncate">{w.title}</span>
                <span className="text-paper font-mono">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Slot-maskinen: byter namn allt långsammare och landar när servern
// skickat vinnaren. Hastigheten styrs av tiden sedan serverns starttid.
function Roulette({
  names,
  startedAt,
  offset,
}: {
  names: string[];
  startedAt: number;
  offset: number;
}) {
  const [current, setCurrent] = useState(names[0] ?? "…");
  const lastRef = useRef("");
  // names är en ny array vid varje poll -- starta inte om animationen då,
  // bara när listan faktiskt ändrats.
  const namesRef = useRef(names);
  namesRef.current = names;
  const namesKey = names.join("|");

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (stopped) return;
      const elapsed = Date.now() + offset - startedAt;
      const p = Math.min(1, Math.max(0, elapsed / GIVEAWAY_REVEAL_MS));
      const list = namesRef.current;
      if (list.length > 0) {
        let next = list[Math.floor(Math.random() * list.length)];
        if (list.length > 1 && next === lastRef.current) {
          next = list[(list.indexOf(next) + 1) % list.length];
        }
        lastRef.current = next;
        setCurrent(next);
      }
      timer = setTimeout(step, 60 + 380 * p * p);
    };
    step();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [namesKey, startedAt, offset]);

  return (
    <div className="border border-gold rounded-md bg-ink p-8 text-center mb-6 giveaway-glow">
      <div className="text-xs font-mono text-gold mb-3 tracking-widest">DRAGNING PÅGÅR…</div>
      <div className="font-display text-4xl font-bold text-paper min-h-[3rem] break-all">
        {current}
      </div>
      <style>{`
        .giveaway-glow { animation: giveawayGlow 1.2s ease-in-out infinite alternate; }
        @keyframes giveawayGlow { from { box-shadow: 0 0 0 rgba(232,179,61,0); } to { box-shadow: 0 0 28px rgba(232,179,61,.45); } }
      `}</style>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 3 + Math.random() * 3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-20px",
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall ${p.duration}s ${p.delay}s linear forwards`,
          }}
        />
      ))}
      <style>{`@keyframes confettiFall { to { transform: translateY(110vh) rotate(720deg); opacity: .9; } }`}</style>
    </div>
  );
}

function GoalProgress({
  current,
  goal,
  loggedIn,
}: {
  current: number;
  goal: number;
  loggedIn: boolean;
}) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const left = Math.max(0, goal - current);
  return (
    <div className="border border-gold/60 rounded-md bg-panel p-5 mb-6">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <div className="font-mono text-3xl text-gold">
            {current} <span className="text-mute text-lg">av {goal}</span>
          </div>
          <div className="text-xs text-mute">registrerade medlemmar</div>
        </div>
        <div className="font-mono text-sm text-paper">{pct}%</div>
      </div>
      <div className="h-3 rounded-full bg-ink border border-line overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-paper/90 mt-4">
        Giveawayen öppnar när vi är <strong>{goal} medlemmar</strong>
        {left > 0 ? ` — bara ${left} till!` : "!"} Tipsa dina vänner om Kortmarknad.
      </p>
      {!loggedIn && (
        <Link
          href="/konto/registrera"
          className="focus-ring inline-block mt-4 rounded-sm bg-gold text-ink font-semibold px-5 py-2"
        >
          Bli medlem
        </Link>
      )}
    </div>
  );
}
