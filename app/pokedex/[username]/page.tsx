import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDexOwnership } from "@/lib/pokedexData";
import PokedexGrid from "@/components/PokedexGrid";

export const dynamic = "force-dynamic";

// Publik, skrivskyddad Pokédex för medlemmar som valt att dela den.
// Visar bara vilka Pokémon som är samlade -- inga kort, priser eller
// kontaktuppgifter.
export default async function PublicPokedex({ params }: { params: { username: string } }) {
  const name = decodeURIComponent(params.username).slice(0, 60);
  const { data } = await supabaseAdmin
    .from("members")
    .select("id, username, dex_public")
    .ilike("username", name.replace(/[\\%_]/g, "\\$&"))
    .eq("dex_public", true)
    .limit(2);
  const rows = (data as any[]) ?? [];
  if (rows.length !== 1) notFound();

  const { auto, manual } = await getDexOwnership(rows[0].id);
  return (
    <div className="max-w-4xl mx-auto px-4 py-14 pb-32">
      <h1 className="font-display text-3xl font-bold text-paper mb-1">
        {rows[0].username}s Pokédex
      </h1>
      <p className="text-mute mb-8 text-sm">
        Minst ett kort av varje Pokémon.{" "}
        <a href="/konto/pokedex" className="text-gold hover:underline">
          Starta din egen →
        </a>
      </p>
      <PokedexGrid auto={auto} manual={manual} readOnly />
    </div>
  );
}
