import { createServerSupabase } from "@/lib/supabase/server";
import { Variant } from "@/lib/types";
import PackageCompleteness, {
  SetPackageSummary,
} from "@/components/admin/PackageCompleteness";

export const dynamic = "force-dynamic";

interface VariantRow {
  variant: Variant;
  price_sek: number;
  stock: number;
}

interface CardRow {
  id: string;
  number: number;
  name: string;
  card_variants: VariantRow[];
}

interface SetRow {
  id: string;
  slug: string;
  name: string;
  category_name: string;
  cards: CardRow[];
}

const VARIANTS: Variant[] = ["normal", "holo", "reverse_holo"];

export default async function PaketPage() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("sets")
    .select(
      "id, slug, name, category_name, cards(id, number, name, card_variants(variant, price_sek, stock))"
    )
    .order("category_name")
    .order("name");

  const sets = (data as unknown as SetRow[]) ?? [];

  const summaries: SetPackageSummary[] = sets
    .map((set) => {
      const totalCards = set.cards.length;

      const perVariant = VARIANTS.map((variant) => {
        // Only count cards that were ever given this variant — a set where
        // only rares get a holo print shouldn't be judged against cards
        // that never had one.
        const cardsWithVariant = set.cards.filter((c) =>
          c.card_variants.some((v) => v.variant === variant)
        );
        const inStock = cardsWithVariant.filter((c) =>
          c.card_variants.some((v) => v.variant === variant && v.stock > 0)
        );
        const missing = cardsWithVariant
          .filter(
            (c) => !c.card_variants.some((v) => v.variant === variant && v.stock > 0)
          )
          .map((c) => ({ number: c.number, name: c.name }))
          .sort((a, b) => a.number - b.number);
        const packagePriceSek = inStock.reduce((sum, c) => {
          const v = c.card_variants.find((vv) => vv.variant === variant);
          return sum + (v?.price_sek ?? 0);
        }, 0);

        return {
          variant,
          definedCount: cardsWithVariant.length,
          inStockCount: inStock.length,
          missing,
          packagePriceSek,
          isComplete:
            cardsWithVariant.length > 0 && inStock.length === cardsWithVariant.length,
        };
      }).filter((v) => v.definedCount > 0);

      return {
        setId: set.id,
        setSlug: set.slug,
        setName: set.name,
        categoryName: set.category_name,
        totalCards,
        variants: perVariant,
      };
    })
    // Only show sets where at least one variant type is actually used.
    .filter((s) => s.variants.length > 0 && s.totalCards > 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-paper mb-1">
        Paket
      </h1>
      <p className="text-mute mb-8">
        Hur nära varje set är att kunna säljas komplett som paket — per
        variant (vanlig/holo/reverse holo). Bara varianter som faktiskt
        finns upplagda på minst ett kort i setet räknas med.
      </p>

      {error ? (
        <p className="text-red-400 text-sm">Kunde inte hämta setdata.</p>
      ) : summaries.length === 0 ? (
        <p className="text-mute">Inga set med kort ännu.</p>
      ) : (
        <PackageCompleteness sets={summaries} />
      )}
    </div>
  );
}
