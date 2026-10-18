"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { memberLabel } from "@/lib/memberLabel";

export interface AdminGiveaway {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  audience: "all" | "paid";
  draw_at: string | null;
  status: "draft" | "open" | "closed" | "drawn";
  winnerLabel: string | null;
  entryCount: number;
}

const inputCls =
  "focus-ring w-full bg-ink border border-line rounded-sm px-3 py-2 text-paper text-sm";

const statusLabel: Record<AdminGiveaway["status"], string> = {
  draft: "Utkast (syns inte)",
  open: "Pågår",
  closed: "Anmälan stängd",
  drawn: "Dragen",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

async function uploadImage(id: string, file: File): Promise<string> {
  const supabase = createBrowserSupabase();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `giveaway-${id}.${ext}`;
  const { error } = await supabase.storage
    .from("card-images")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("card-images").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export default function GiveawayAdmin({ initial }: { initial: AdminGiveaway[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    audience: "all" as "all" | "paid",
    draw_at: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  async function create(publish: boolean) {
    setError(null);
    setInfo(null);
    if (!form.title.trim()) {
      setError("Skriv en rubrik.");
      return;
    }
    setCreating(true);
    try {
      const id = crypto.randomUUID();
      const image_url = file ? await uploadImage(id, file) : null;
      const supabase = createBrowserSupabase();
      const { error: e } = await supabase.from("giveaways").insert({
        id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        image_url,
        audience: form.audience,
        draw_at: fromLocalInput(form.draw_at),
        status: publish ? "open" : "draft",
      });
      if (e) throw new Error(e.message);
      setForm({ title: "", description: "", audience: "all", draw_at: "" });
      setFile(null);
      router.refresh();
    } catch (e: any) {
      setError(`Kunde inte spara: ${e.message}`);
    }
    setCreating(false);
  }

  return (
    <div>
      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
      {info && <p className="text-sm text-gold mb-4">{info}</p>}

      <div className="border border-line rounded-md p-4 bg-panel mb-8 space-y-3">
        <h2 className="font-display font-semibold text-paper">Ny giveaway</h2>
        <label className="block">
          <span className="text-xs text-mute mb-1 block">Rubrik</span>
          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="t.ex. Vinn en Pitch Black Elite Trainer Box"
          />
        </label>
        <label className="block">
          <span className="text-xs text-mute mb-1 block">
            Text (vad man vinner, regler, när dragningen sker)
          </span>
          <textarea
            className={inputCls}
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Vem får delta</span>
            <select
              className={inputCls}
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value as "all" | "paid" })}
            >
              <option value="all">Alla medlemmar</option>
              <option value="paid">Bara betalande medlemmar</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Planerad dragning (valfritt, visas som nedräkning)</span>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.draw_at}
              onChange={(e) => setForm({ ...form, draw_at: e.target.value })}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-mute mb-1 block">Bild (valfritt)</span>
          <input
            type="file"
            accept="image/*"
            className="text-xs text-mute"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => create(true)}
            disabled={creating}
            className="focus-ring text-sm rounded-sm bg-gold text-ink font-semibold px-4 py-2 disabled:opacity-50"
          >
            {creating ? "Sparar…" : "Publicera direkt"}
          </button>
          <button
            onClick={() => create(false)}
            disabled={creating}
            className="focus-ring text-sm rounded-sm border border-line text-paper px-4 py-2 hover:border-gold disabled:opacity-50"
          >
            Spara som utkast
          </button>
        </div>
        {form.audience === "paid" && (
          <p className="text-xs text-mute">
            Obs: kräver man betalt medlemskap för att delta kan det i vissa fall räknas som lotteri
            enligt lotterilagen. Kolla gärna med Spelinspektionen innan du kör en betalande-giveaway.
          </p>
        )}
      </div>

      {initial.length === 0 ? (
        <p className="text-mute text-sm">Inga giveaways ännu.</p>
      ) : (
        <div className="space-y-4">
          {initial.map((g) => (
            <GiveawayCard key={g.id} g={g} onError={setError} onInfo={setInfo} />
          ))}
        </div>
      )}
    </div>
  );
}

function GiveawayCard({
  g,
  onError,
  onInfo,
}: {
  g: AdminGiveaway;
  onError: (m: string | null) => void;
  onInfo: (m: string | null) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(g.title);
  const [description, setDescription] = useState(g.description ?? "");
  const [audience, setAudience] = useState(g.audience);
  const [drawAt, setDrawAt] = useState(toLocalInput(g.draw_at));
  const [entries, setEntries] = useState<{ member_id: string; label: string }[] | null>(null);

  async function patch(values: Record<string, unknown>) {
    setBusy(true);
    onError(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("giveaways").update(values).eq("id", g.id);
    setBusy(false);
    if (error) {
      onError(`Kunde inte spara: ${error.message}`);
      return false;
    }
    router.refresh();
    return true;
  }

  async function saveEdit() {
    if (!title.trim()) {
      onError("Rubriken får inte vara tom.");
      return;
    }
    const ok = await patch({
      title: title.trim(),
      description: description.trim() || null,
      audience,
      draw_at: fromLocalInput(drawAt),
    });
    if (ok) setEdit(false);
  }

  async function changeImage(file: File) {
    setBusy(true);
    onError(null);
    try {
      const url = await uploadImage(g.id, file);
      await patch({ image_url: url });
    } catch (e: any) {
      onError(`Kunde inte ladda upp: ${e.message}`);
    }
    setBusy(false);
  }

  async function draw() {
    const redo = g.status === "drawn";
    const msg = redo
      ? "Dra en NY vinnare? Den förra vinnaren utesluts och alla som tittar ser en ny dragning."
      : `Starta live-dragningen nu? Alla som har /giveaway öppen ser den direkt. ${g.entryCount} deltagare.`;
    if (!confirm(msg)) return;
    setBusy(true);
    onError(null);
    onInfo(null);
    const res = await fetch("/api/admin/giveaway/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giveawayId: g.id }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      onError(j.error ?? "Dragningen misslyckades.");
      return;
    }
    onInfo(`Dragningen är igång (visas live i ~10 sek). Vinnare: ${j.winner} — dold för publiken tills avslöjandet.`);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Ta bort "${g.title}" och alla anmälningar? Det går inte att ångra.`)) return;
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("giveaways").delete().eq("id", g.id);
    setBusy(false);
    if (error) onError(`Kunde inte ta bort: ${error.message}`);
    else router.refresh();
  }

  async function toggleEntries() {
    if (entries) {
      setEntries(null);
      return;
    }
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("giveaway_entries")
      .select("member_id, created_at, members(member_number, username)")
      .eq("giveaway_id", g.id)
      .order("created_at", { ascending: true });
    if (error) {
      onError(`Kunde inte hämta deltagare: ${error.message}`);
      return;
    }
    setEntries(
      ((data as any[]) ?? []).map((r) => ({
        member_id: r.member_id,
        label: memberLabel(r.members?.member_number ?? null, r.members?.username),
      }))
    );
  }

  async function removeEntry(memberId: string) {
    if (!confirm("Stryk den här deltagaren?")) return;
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from("giveaway_entries")
      .delete()
      .eq("giveaway_id", g.id)
      .eq("member_id", memberId);
    if (error) {
      onError(`Kunde inte stryka: ${error.message}`);
      return;
    }
    setEntries((list) => (list ? list.filter((e) => e.member_id !== memberId) : list));
    router.refresh();
  }

  const btn =
    "focus-ring text-xs rounded-sm border border-line px-3 py-1.5 text-paper hover:border-gold disabled:opacity-50";

  return (
    <div className="border border-line rounded-md p-4 bg-panel">
      <div className="flex gap-3">
        <label className="cursor-pointer shrink-0" title="Klicka för att byta bild">
          {g.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.image_url} alt={g.title} className="w-24 h-16 object-cover rounded-sm border border-line bg-ink" />
          ) : (
            <div className="w-24 h-16 rounded-sm border border-dashed border-amber-400/60 flex items-center justify-center text-[10px] text-amber-400/90 text-center px-1">
              Lägg till bild
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) changeImage(f);
              e.target.value = "";
            }}
          />
        </label>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs text-mute">
            {statusLabel[g.status]} · {g.audience === "paid" ? "bara betalande" : "alla medlemmar"} ·{" "}
            {g.entryCount} deltagare
          </div>
          <div className="font-display font-semibold text-paper">{g.title}</div>
          {g.draw_at && (
            <div className="text-xs text-mute">
              Planerad dragning: {new Date(g.draw_at).toLocaleString("sv-SE")}
            </div>
          )}
          {g.winnerLabel && (
            <div className="text-sm text-gold mt-1">Vinnare: {g.winnerLabel}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {g.status === "draft" && (
          <button className={btn} disabled={busy} onClick={() => patch({ status: "open" })}>
            Publicera
          </button>
        )}
        {g.status === "open" && (
          <button className={btn} disabled={busy} onClick={() => patch({ status: "closed" })}>
            Stäng anmälan
          </button>
        )}
        {g.status === "closed" && (
          <button className={btn} disabled={busy} onClick={() => patch({ status: "open" })}>
            Öppna igen
          </button>
        )}
        {(g.status === "open" || g.status === "closed") && (
          <button
            className="focus-ring text-xs rounded-sm bg-gold text-ink font-semibold px-3 py-1.5 disabled:opacity-50"
            disabled={busy || g.entryCount === 0}
            onClick={draw}
          >
            Dra vinnare live
          </button>
        )}
        {g.status === "drawn" && (
          <button className={btn} disabled={busy} onClick={draw}>
            Dra ny vinnare
          </button>
        )}
        <button className={btn} onClick={() => setEdit((e) => !e)}>
          {edit ? "Stäng redigering" : "Ändra"}
        </button>
        <button className={btn} onClick={toggleEntries}>
          {entries ? "Dölj deltagare" : "Visa deltagare"}
        </button>
        <button
          className="focus-ring text-xs rounded-sm border border-line px-3 py-1.5 text-mute hover:text-red-400 disabled:opacity-50"
          disabled={busy}
          onClick={remove}
        >
          Ta bort
        </button>
      </div>

      {edit && (
        <div className="mt-4 pt-4 border-t border-line space-y-3">
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Rubrik</span>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1 block">Text</span>
            <textarea
              className={inputCls}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-mute mb-1 block">Vem får delta</span>
              <select
                className={inputCls}
                value={audience}
                onChange={(e) => setAudience(e.target.value as "all" | "paid")}
              >
                <option value="all">Alla medlemmar</option>
                <option value="paid">Bara betalande medlemmar</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-mute mb-1 block">Planerad dragning</span>
              <input
                type="datetime-local"
                className={inputCls}
                value={drawAt}
                onChange={(e) => setDrawAt(e.target.value)}
              />
            </label>
          </div>
          <button
            onClick={saveEdit}
            disabled={busy}
            className="focus-ring text-sm rounded-sm bg-gold text-ink font-semibold px-4 py-2 disabled:opacity-50"
          >
            Spara
          </button>
        </div>
      )}

      {entries && (
        <div className="mt-4 pt-4 border-t border-line">
          {entries.length === 0 ? (
            <p className="text-xs text-mute">Inga deltagare ännu.</p>
          ) : (
            <ul className="space-y-1">
              {entries.map((e) => (
                <li key={e.member_id} className="flex items-center justify-between text-sm">
                  <span className="text-paper font-mono">{e.label}</span>
                  <button
                    onClick={() => removeEntry(e.member_id)}
                    className="focus-ring text-xs text-mute hover:text-red-400"
                  >
                    Stryk
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
