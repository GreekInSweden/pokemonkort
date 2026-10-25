import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/currentMember";
import { getDexOwnership } from "@/lib/pokedexData";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PokedexGrid from "@/components/PokedexGrid";

export const dynamic = "force-dynamic";

export default async function PokedexPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/konto/logga-in?next=/konto/pokedex");

  const { auto, manual } = await getDexOwnership(member.id);
  const { data } = await supabaseAdmin
    .from("members")
    .select("dex_public")
    .eq("id", member.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto px-4 py-14 pb-32">
      <h1 className="font-display text-3xl font-bold text-paper mb-1">Min Pokédex</h1>
      <p className="text-mute mb-8 max-w-prose text-sm">
        Samla minst ett kort av varje Pokémon. Alla Pokémon du har kort av i
        din portfölj tänds automatiskt. Har du kort som inte ligger i
        portföljen kan du kryssa i dem för hand. Klicka på en Pokémon för
        mer.
      </p>
      <PokedexGrid
        auto={auto}
        manual={manual}
        isPublic={!!(data as any)?.dex_public}
        hasUsername={!!member.username}
        username={member.username}
      />
    </div>
  );
}
