import Link from "next/link";
import { getMasterSetHall, countHall, HallSet } from "@/lib/masterSets";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Master Set-väggen – Kortmarknad",
  description: "Medlemmar som har samlat alla kort i ett helt set.",
};

export default async function MasterSetsPage() {
  const hall = await getMasterSetHall().catch(() => [] as HallSet[]);
  const total = countHall(hall);

  // Era -> set, nyast först (senaste släppet bestämmer eraordningen).
  const eras = new Map<string, HallSet[]>();
  for (const s of hall) {
    if (!eras.has(s.era)) eras.set(s.era, []);
    eras.get(s.era)!.push(s);
  }
  const date = (s: HallSet) => s.releaseDate ?? "";
  const orderedEras = Array.from(eras.entries())
    .map(([era, sets]) => ({
      era,
      sets: sets.sort((a, b) => date(b).localeCompare(date(a)) || a.setName.localeCompare(b.setName)),
    }))
    .sort((a, b) => date(b.sets[0]).localeCompare(date(a.sets[0])));

  return (
    <div className="max-w-5xl mx-auto px-4 py-14">
      <div className="text-center mb-12">
        <div className="text-gold font-mono text-xs tracking-widest uppercase mb-3">
          Master Set-väggen
        </div>
        <div className="font-display text-6xl sm:text-7xl font-bold text-gold leading-none">
          {total}
        </div>
        <h1 className="font-display text-xl sm:text-2xl text-paper mt-3">
          {total === 1 ? "Master Set registrerat" : "Master Sets registrerade"}
        </h1>
        <p className="text-mute text-sm max-w-prose mx-auto mt-4">
          Här hamnar medlemmar som har samlat <em>alla</em> kort i ett helt
          set. Du hamnar här automatiskt när alla kort i ditt set är
          markerade som "Har" och det varit så i minst en timme.{" "}
          <span className="text-gold">✦ Grand Master</span> betyder att du
          även har varje reverse holo.
        </p>
        <Link
          href="/konto/portfolj"
          className="focus-ring inline-block mt-6 rounded-md border border-gold text-gold px-5 py-2 text-sm hover:bg-gold/10"
        >
          Starta din Master Set →
        </Link>
      </div>

      {orderedEras.length === 0 ? (
        <div className="text-center border border-dashed border-line rounded-lg py-16 text-mute">
          <div className="text-4xl mb-3">🏆</div>
          Väggen är tom än så länge. Bli den första!
        </div>
      ) : (
        <div className="space-y-12">
          {orderedEras.map(({ era, sets }) => (
            <section key={era}>
              <h2 className="font-display text-sm uppercase tracking-widest text-mute border-b border-line pb-2 mb-5">
                {era}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {sets.map((s) => (
                  <li
                    key={s.setId}
                    className="rounded-lg border border-line bg-ink/60 p-5 hover:border-gold/60 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <h3 className="font-display text-lg font-semibold text-paper">
                        {s.setName}
                      </h3>
                      <span className="font-mono text-xs text-mute shrink-0">
                        {s.members.length} {s.members.length === 1 ? "medlem" : "medlemmar"}
                      </span>
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {s.members.map((m) => (
                        <li
                          key={m.username}
                          className={`rounded-full px-3 py-1 text-sm border ${
                            m.level === "grand"
                              ? "border-gold text-gold bg-gold/10"
                              : "border-line text-paper"
                          }`}
                          title={m.level === "grand" ? "Grand Master Set (inkl. reverse holo)" : "Master Set"}
                        >
                          {m.level === "grand" && "✦ "}
                          {m.username}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
