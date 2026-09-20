import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/currentMember";
import { createServerSupabase } from "@/lib/supabase/server";
import { Variant, Rarity } from "@/lib/types";
import PortfolioChecklist from "@/components/PortfolioChecklist";

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

  const { data: setsData } = await supabase
    .from("sets")
    .select("id, slug, name, category_name")
    .eq("is_visible", true)
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

  // Grouped by category for the set picker, same pattern as the shop's
  // own category/set navigation.
  const categories = Array.from(new Set(sets.map((s) => s.category_name)));

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

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <div key={cat} className="flex flex-wrap gap-2">
            {sets
              .filter((s) => s.category_name === cat)
              .map((s) => (
                <a
                  key={s.id}
                  href={`/konto/portfolj?set=${s.slug}`}
                  className={`focus-ring text-xs rounded-sm border px-3 py-1.5 ${
                    s.slug === selectedSlug
                      ? "border-gold text-gold bg-gold/10"
                      : "border-line text-mute hover:border-mute"
                  }`}
                >
                  {s.name}
                </a>
              ))}
          </div>
        ))}
      </div>

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
