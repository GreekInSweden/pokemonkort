// Länk till PriceCharting för ett kort -- där syns nuvarande värde för
// graderade kort (PSA 10, PSA 9, BGS 10 m.fl.). Bara en länk, inga priser
// hämtas (PriceChartings data får inte visas i tjänster för andra utan licens).
//
// Verifierade adresser:
//   /game/pokemon-base-set/charizard-4
//   /game/pokemon-surging-sparks/..., /game/pokemon-paldea-evolved/...
// Mönster: pokemon-<setnamn med bindestreck>/<kortnamn med bindestreck>-<nummer>.
// Övriga set är härledda på samma sätt (kan behöva rättas, se SET_SLUGS).
// Ren logik utan importer -- fungerar i både webbläsare och server.

// Bara kort på Illustration Rare eller högre.
const GRADED_RARITIES = new Set([
  "illustration_rare",
  "ultra_rare",
  "special_illustration_rare",
  "mega_hyper_rare",
]);

// Äldre set (WotC-eran m.fl.) där även vanliga "rare"-kort (holos) är
// värda att graderas -- där finns ingen IR-nivå, så Rare räknas med.
const VINTAGE_SETS = new Set([
  "base", "jungle", "fossil", "base set 2", "team rocket", "gym heroes",
  "gym challenge", "neo genesis", "neo discovery", "neo revelation",
  "neo destiny", "legendary collection", "expedition base set",
  "aquapolis", "skyridge", "wizards black star promos",
]);

export function hasGradedPrice(
  rarity: string | null | undefined,
  setName?: string | null
): boolean {
  if (!rarity) return false;
  if (GRADED_RARITIES.has(rarity)) return true;
  return (
    rarity === "rare" && !!setName && VINTAGE_SETS.has(setName.toLowerCase())
  );
}

// Setnamn hos oss (gemener) -> PriceChartings setadress, där den inte är
// "pokemon-" + setnamnet.
const SET_SLUGS: Record<string, string> = {
  base: "pokemon-base-set",
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`´.]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface PriceChartingLink {
  url: string;
  exact: boolean;
}

export function pricechartingLink(
  setName: string,
  card: { name: string; number: number }
): PriceChartingLink {
  // Obs: #full-prices på PriceChartings sida är en knapp som deras egna script
  // hanterar -- den går inte att öppna via adressen (testat), så ingen #-del.
  const search = `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(
    `${card.name} ${setName}`
  )}`;
  if (!setName.trim() || card.number >= 500000) return { url: search, exact: false };
  const setSlug = SET_SLUGS[setName.trim().toLowerCase()] ?? `pokemon-${slugify(setName)}`;
  return {
    url: `https://www.pricecharting.com/game/${setSlug}/${slugify(card.name)}-${card.number}`,
    exact: true,
  };
}
