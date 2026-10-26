import { getSwedishPrices } from "@/lib/swedishPrices";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/currentMember";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Variant, Rarity, ParallelTier } from "@/lib/types";
import { MASTER_HOLD_MS, getMasterSetCount } from "@/lib/masterSets";
import PortfolioChecklist from "@/components/PortfolioChecklist";
import SetPicker from "@/components/SetPicker";
import {
  getMembershipState,
  canUseSet,
  FREE_SET_LIMIT,
  PRICE_MONTH_SEK,
  PRICE_YEAR_SEK,
} from "@/lib/membership";

export const dynamic = "force-dynamic";

interface SetOption {
  id: string;
  slug: string;
  name: string;
  category_name: string;
  product_line?: "pokemon" | "sportkort";
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
  searchParams: { set?: string; q?: string };
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
    .select("id, slug, name, category_name, product_line")
    .order("category_name")
    .order("name");
  const sets = (setsData as SetOption[]) ?? [];

  const selectedSlug = searchParams.set ?? sets[0]?.slug;
  const selectedSet = sets.find((s) => s.slug === selectedSlug) ?? null;

  // Betalnivå (av som standard -- slås på i Admin -> Medlemskap).
  const membership = await getMembershipState(member.id);
  const limited = membership.enabled && !membership.paid;
  const lockedSetIds = limited
    ? sets.filter((s) => !canUseSet(membership, s.id)).map((s) => s.id)
    : [];
  const selectedLocked = !!selectedSet && lockedSetIds.includes(selectedSet.id);
  const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || "";

  let cards: CardRow[] = [];
  let ownEntries: {
    card_id: string;
    variant: Variant;
    status: "have" | "want";
    sellable: boolean;
    tradeable: boolean;
    parallel_tier_id: string | null;
  }[] = [];
  let parallelTiers: ParallelTier[] = [];
  let swedishPrices: Record<string, import("@/lib/swedishPrices").SwedishPrice> = {};

  if (selectedSet) {
    const { data: cardsData } = await supabase
      .from("cards")
      .select("id, number, name, rarity, image_url, card_variants(id, variant)")
      .eq("set_id", selectedSet.id)
      .order("number");
    cards = (cardsData as unknown as CardRow[]) ?? [];
    swedishPrices = await getSwedishPrices({ setId: selectedSet.id });

    // Bara satt för Topps-set som faktiskt har definierade parallels (se
    // supabase/parallel_tiers.sql) — tom lista annars, då visar
    // PortfolioChecklist ingen parallel-väljare alls.
    const { data: tiersData } = await supabase
      .from("parallel_tiers")
      .select("id, set_id, name, channel, print_run, sort_order, image_url")
      .eq("set_id", selectedSet.id)
      .order("sort_order");
    parallelTiers = (tiersData as ParallelTier[]) ?? [];

    // member_cards is only readable by the admin login under RLS — a
    // member isn't a Supabase Auth user — so this has to go through the
    // service-role client, same as the /api/member/* routes, not the
    // anon-cookie client used for the public sets/cards above.
    const { data: entriesData } = await supabaseAdmin
      .from("member_cards")
      .select("card_id, variant, status, sellable, tradeable, parallel_tier_id")
      .eq("member_id", member.id);
    ownEntries = (entriesData as any[]) ?? [];
  }

  // Master Set-status för det valda setet (väggen: lib/masterSets.ts).
  let masterNote: { text: string; done: boolean } | null = null;
  if (selectedSet) {
    const { data: claims } = await supabaseAdmin
      .from("master_set_claims")
      .select("level, complete_since")
      .eq("member_id", member.id)
      .eq("set_id", selectedSet.id);
    const rows = (claims as any[]) ?? [];
    if (rows.length > 0) {
      const since = Math.min(...rows.map((r) => new Date(r.complete_since).getTime()));
      const left = Math.ceil((since + MASTER_HOLD_MS - Date.now()) / 60000);
      const grand = rows.some((r) => r.level === "grand");
      const label = grand ? "Grand Master Set" : "Master Set";
      if (left > 0) {
        masterNote = {
          done: false,
          text: `Du har alla kort i ${selectedSet.name}! Om cirka ${left} min hamnar du på Master Set-väggen (som ${label}), så länge setet förblir komplett.`,
        };
      } else if (!member.username) {
        masterNote = {
          done: false,
          text: `Du har ${label} i ${selectedSet.name}, men du syns inte på väggen förrän du har ett användarnamn.`,
        };
      } else {
        masterNote = { done: true, text: `🏆 Du står på Master Set-väggen för ${selectedSet.name} (${label}).` };
      }
    }
  }
  const masterCount = await getMasterSetCount();

  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl font-bold text-paper mb-1">
        Min portfölj
      </h1>
      <p className="text-mute mb-8 max-w-prose text-sm">
        Markera kort du äger och söker. Din lista är privat — andra ser
        bara aggregat på{" "}
        <a href="/mest-eftertraktade" className="text-gold hover:underline">
          Mest eftertraktade
        </a>{" "}
        och{" "}
        <a href="/konto/matchningar" className="text-gold hover:underline">
          Mina matchningar
        </a>
        .
      </p>

      <p className="text-xs text-mute mb-4">
        🏆 {masterCount} {masterCount === 1 ? "Master Set" : "Master Sets"} registrerade –{" "}
        <a href="/master-sets" className="text-gold hover:underline">
          se väggen
        </a>
      </p>
      {masterNote && (
        <div
          className={`mb-4 rounded border px-4 py-3 text-sm ${
            masterNote.done ? "border-gold bg-gold/10 text-gold" : "border-line text-paper"
          }`}
        >
          {masterNote.text}
        </div>
      )}

      {limited && (
        <p className="text-xs text-mute font-mono mb-3">
          Gratis: {membership.freeSetIds.length} av {FREE_SET_LIMIT} set använda
        </p>
      )}

      <SetPicker
        sets={sets}
        selectedSlug={selectedSlug}
        baseHref="/konto/portfolj"
        lockedSetIds={lockedSetIds}
      />

      {!selectedSet ? (
        <p className="text-mute">Inga set upplagda ännu.</p>
      ) : selectedLocked ? (
        <div className="border border-gold/40 bg-gold/5 rounded-md p-5 max-w-lg">
          <div className="font-display font-semibold text-paper mb-1">
            🔒 {selectedSet.name} kräver medlemskap
          </div>
          <p className="text-sm text-mute mb-3">
            Du har använt dina {FREE_SET_LIMIT} gratis set. Med medlemskap får du
            fri access till alla set: {PRICE_MONTH_SEK} kr/månad eller{" "}
            {PRICE_YEAR_SEK} kr/år.
          </p>
          <p className="text-sm text-paper">
            Swisha {PRICE_YEAR_SEK} kr till{" "}
            <span className="font-mono text-gold">
              {swishNumber || "[Swish-nummer]"}
            </span>{" "}
            och skriv ditt medlemsnummer (#{member.memberNumber}) i meddelandet.
            Din access aktiveras så snart betalningen har setts.
          </p>
        </div>
      ) : (
        <PortfolioChecklist
          setName={selectedSet.name}
          cards={cards}
          initialEntries={ownEntries}
          parallelTiers={parallelTiers}
          swedishPrices={swedishPrices}
          initialQuery={searchParams.q}
        />
      )}
    </div>
  );
}
