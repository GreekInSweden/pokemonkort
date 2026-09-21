import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/currentMember";
import { createServerSupabase } from "@/lib/supabase/server";
import { Variant, Rarity } from "@/lib/types";
import PortfolioChecklist from "@/components/PortfolioChecklist";
import SetPicker from "@/components/SetPicker";

export const dynamic = "force-dynamic";

interface SetOption {
  id: string;
  slug: string;
  name: string;
  category_name: string;
}

interface VariantRow {
  id: string;
  variant: Variant;
}

interface CardRow {
  id: string;
  number: number;
  name: string;
  rarity: Rarity;
  image_url: string | null;
  card_variants: VariantRow[];
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: { set?: string };
}) {
  const member = await getCurrentMember();
  if (!member) {
    redirect("/konto/logga-in?next=/konto/portfolj");
  }

  const supabase = createServerSupabase();

  // Note: no is_visible filter here on purpose — the full historical
  // card catalog is imported with is_visible = false (it's not for sale,
  // just reference data), but members still need to be able to log cards
  // from any of it in their portfolio/wishlist.
  const { data: setsData } = await supabase
    .from("sets")
    .select("id, slug, name, category_name")
    .order("category_name")
    .order("name");
  const sets = (setsData as SetOption[]) ?? [];

  const selectedSlug = searchParams.set ?? sets[0]?.slug;
  const selectedSet = sets.find((s) => s.slug === selectedSlug) ?? null;

  let cards: CardRow[] = [];
  let ownEntries: { card_id: string; variant: Variant; status: "have" | "want" }[] = [];

  if (selectedSet) {
    const { data: cardsData } = await supabase
      .from("cards")
      .select("id, number, name, rarity, image_url, card_variants(id, variant)")
      .eq("set_id", selectedSet.id)
      .order("number");
    cards = (cardsData as unknown as CardRow[]) ?? [];

    const { data: entriesData } = await supabase
      .from("member_cards")
      .select("card_id, variant, status")
      .eq("member_id", member.id);
    ownEntries = (entriesData as any[]) ?? [];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl font-bold text-paper mb-1">
        Min portfölj
      </h1>
      <p className="text-mute mb-8 max-w-prose">
        Markera vilka kort du redan äger och vilka du söker. Andra
        medlemmar ser aldrig din lista direkt — bara aggregerade siffror
        på{" "}
        <a href="/mest-eftertraktade" className="text-gold hover:underline">
          Mest eftertraktade
        </a>
        , och en matchning på{" "}
        <a href="/konto/matchningar" className="text-gold hover:underline">
          Mina matchningar
        </a>{" "}
        om ni verkar kunna byta.
      </p>

      <SetPicker sets={sets} selectedSlug={selectedSlug} baseHref="/konto/portfolj" />

      {!selectedSet ? (
        <p className="text-mute">Inga set upplagda ännu.</p>
      ) : (
        <PortfolioChecklist
          setName={selectedSet.name}
          cards={cards}
          initialEntries={ownEntries}
        />
      )}
    </div>
  );
}
