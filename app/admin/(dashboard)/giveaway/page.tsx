import { createServerSupabase } from "@/lib/supabase/server";
import GiveawayAdmin, { AdminGiveaway } from "@/components/admin/GiveawayAdmin";
import { memberLabel } from "@/lib/memberLabel";

export const dynamic = "force-dynamic";

export default async function AdminGiveawayPage() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("giveaways")
    .select(
      "id, title, description, image_url, audience, draw_at, status, winner_member_id, draw_started_at, member_goal, goal_reached_at, created_at, giveaway_entries(count)"
    )
    .order("created_at", { ascending: false });

  const rows = (data as any[]) ?? [];
  const { count: memberCount } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true });
  const members = memberCount ?? 0;
  const winnerIds = rows.map((r) => r.winner_member_id).filter(Boolean) as string[];
  const labels = new Map<string, string>();
  if (winnerIds.length) {
    const { data: ms } = await supabase
      .from("members")
      .select("id, member_number, username")
      .in("id", winnerIds);
    for (const m of (ms as any[]) ?? []) labels.set(m.id, memberLabel(m.member_number, m.username));
  }

  const giveaways: AdminGiveaway[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    image_url: r.image_url,
    audience: r.audience,
    draw_at: r.draw_at,
    status: r.status,
    winnerLabel: r.winner_member_id ? labels.get(r.winner_member_id) ?? "Okänd medlem" : null,
    entryCount: r.giveaway_entries?.[0]?.count ?? 0,
    member_goal: r.member_goal ?? null,
    goalReached: !r.member_goal || !!r.goal_reached_at || members >= r.member_goal,
    memberCount: members,
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-paper mb-1">Giveaway</h1>
      <p className="text-mute text-sm mb-8">
        Lägg upp bild och text, publicera, och dra en vinnare som alla som tittar på{" "}
        <a href="/giveaway" className="underline text-paper">/giveaway</a> ser live. Ett utkast syns inte
        för någon. Sidan visar alltid den senast skapade giveawayen som inte är ett utkast.
      </p>
      {error ? (
        <p className="text-sm text-amber-400/90">
          Kör först <span className="font-mono">giveaways.sql</span> i Supabase och ladda om sidan.
        </p>
      ) : (
        <GiveawayAdmin initial={giveaways} />
      )}
    </div>
  );
}
