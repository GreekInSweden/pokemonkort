// Länkar till Cardmarket för ett kort, med engelska kort i minst Near Mint
// förvalt. Ren logik utan importer, så den fungerar både i webbläsaren och
// på servern.
//
// Cardmarkets adress till ett kort ser ut så här (verifierat mot riktiga
// adresser):
//   /en/Pokemon/Products/Singles/<Set>/<Namn>[-V<n>]-<KOD><nummer med 3 siffror>
//   ?language=1&minCondition=2
// - <Set> och <KOD> är Cardmarkets eget setnamn/kod (se CARDMARKET_SETS).
// - Namnet skrivs med bindestreck: accenter tas bort (Poké -> Poke) och
//   apostrofer försvinner utan bindestreck (Lillie's -> Lillies).
// - V<n> sätts bara när samma kortnamn finns i flera versioner i setet:
//   V1 = lägsta kortnumret, V2 = nästa, osv. (verifierat på Mega Darkrai ex
//   i Pitch Black: 048=V1, 101=V2, 116=V3, 120=V4). Kort som bara finns i en
//   version har ingen V-siffra.
// - Undantag: 30th Celebration använder aldrig V (alla Pikachu heter bara
//   Pikachu-30C0xx).

export interface CardmarketSet {
  slug: string; // setets del av adressen
  code: string; // t.ex. PBL
  versioned: boolean; // sätter Cardmarket V-siffra i det här setet?
  withList?: boolean; // visa även "Alla utgåvor"-länk (äldre set)
  pad?: number; // antal siffror i kortnumret (standard 3; 0 = ingen nollfyllnad)
}

// Nyckel: setets namn hos oss, med gemener.
export const CARDMARKET_SETS: Record<string, CardmarketSet> = {
  "mega evolution": { slug: "Mega-Evolution", code: "MEG", versioned: true },
  "phantasmal flames": { slug: "Phantasmal-Flames", code: "PFL", versioned: true },
  "ascended heroes": { slug: "Ascended-Heroes", code: "ASC", versioned: true },
  "perfect order": { slug: "Perfect-Order", code: "POR", versioned: true },
  "chaos rising": { slug: "Chaos-Rising", code: "CRI", versioned: true },
  "pitch black": { slug: "Pitch-Black", code: "PBL", versioned: true },
  "astral radiance": { slug: "Astral-Radiance", code: "ASR", versioned: true },
  "151": { slug: "151", code: "MEW", versioned: true },
  "paldea evolved": { slug: "Paldea-Evolved", code: "PAL", versioned: true },
  "obsidian flames": { slug: "Obsidian-Flames", code: "OBF", versioned: true },
  "paradox rift": { slug: "Paradox-Rift", code: "PAR", versioned: true },
  "paldean fates": { slug: "Paldean-Fates", code: "PAF", versioned: true },
  "temporal forces": { slug: "Temporal-Forces", code: "TEF", versioned: true },
  "twilight masquerade": { slug: "Twilight-Masquerade", code: "TWM", versioned: true },
  "shrouded fable": { slug: "Shrouded-Fable", code: "SFA", versioned: true },
  "stellar crown": { slug: "Stellar-Crown", code: "SCR", versioned: true },
  "surging sparks": { slug: "Surging-Sparks", code: "SSP", versioned: true },
  "prismatic evolutions": { slug: "Prismatic-Evolutions", code: "PRE", versioned: true },
  "journey together": { slug: "Journey-Together", code: "JTG", versioned: true },
  "destined rivals": { slug: "Destined-Rivals", code: "DRI", versioned: true },
  "black bolt": { slug: "Black-Bolt", code: "BLK", versioned: true },
  "white flare": { slug: "White-Flare", code: "WHT", versioned: true },
  "scarlet & violet": { slug: "Scarlet-Violet", code: "SVI", versioned: true },
  "brilliant stars": { slug: "Brilliant-Stars", code: "BRS", versioned: true },
  "lost origin": { slug: "Lost-Origin", code: "LOR", versioned: true },
  "silver tempest": { slug: "Silver-Tempest", code: "SIT", versioned: true },
  "crown zenith": { slug: "Crown-Zenith", code: "CRZ", versioned: true },
  "evolving skies": { slug: "Evolving-Skies", code: "EVS", versioned: true },
  "chilling reign": { slug: "Chilling-Reign", code: "CRE", versioned: true },
  "battle styles": { slug: "Battle-Styles", code: "BST", versioned: true },
  "vivid voltage": { slug: "Vivid-Voltage", code: "VIV", versioned: true },
  "darkness ablaze": { slug: "Darkness-Ablaze", code: "DAA", versioned: true, pad: 0 },
  "rebel clash": { slug: "Rebel-Clash", code: "RCL", versioned: true },
  "sword & shield": { slug: "Sword-Shield", code: "SSH", versioned: true },
  "fusion strike": { slug: "Fusion-Strike", code: "FST", versioned: true },
  "celebrations": { slug: "Celebrations", code: "CEL", versioned: true },
  // Expedition: V räknas efter kortnummer (Alakazam 1 = V1, 33 = V2)
  "expedition base set": { slug: "Expedition-Base-Set", code: "EX", versioned: true, pad: 0, withList: true },
  "30th celebration": { slug: "30th-Celebration", code: "30C", versioned: false },
};

// Set vars Cardmarket-slug inte är samma som vårt setnamn.
const SET_SLUG_OVERRIDES: Record<string, string> = {
  base: "Base-Set",
  // Classic Collection ligger under huvudsetet på Cardmarket, med kod efter
  // ursprungssetet (t.ex. Charizard-30CBS-4 = Base Set) -- därför sökning.
  "30th celebration: classic collection": "30th-Celebration",
  "celebrations: classic collection": "Celebrations",
};

// Äldre set: kortnummer utan nollfyllnad, och vi länkar till V1 (den vanliga
// utgåvan). Verifierat: Base-Set/Alakazam-V1-BS1, Charizard-V1-BS4,
// Jungle/Clefable-V1-JU1, Fossil/Aerodactyl-V1-FO1, Black-White/Snivy-V1-BLW1.
const LEGACY_SETS: Record<string, { slug: string; code: string; noV?: boolean }> = {
  base: { slug: "Base-Set", code: "BS" },
  jungle: { slug: "Jungle", code: "JU" },
  fossil: { slug: "Fossil", code: "FO" },
  // Team Rocket har ingen V-siffra (en utgåva per kort): Dark-Charizard-TR4
  "team rocket": { slug: "Team-Rocket", code: "TR", noV: true },
  "neo genesis": { slug: "Neo-Genesis", code: "NG", noV: true },
  "neo destiny": { slug: "Neo-Destiny", code: "NDE", noV: true },
  "neo discovery": { slug: "Neo-Discovery", code: "NDI", noV: true },
  "neo revelation": { slug: "Neo-Revelation", code: "NR", noV: true },
  "ruby & sapphire": { slug: "EX-Ruby-Sapphire", code: "RS", noV: true },
  aquapolis: { slug: "Aquapolis", code: "AQH" },
  skyridge: { slug: "Skyridge", code: "SK", noV: true },
  "black & white": { slug: "Black-White", code: "BLW" },
};

// EX-seten heter "EX-<namn>" hos Cardmarket (verifierat: EX-Ruby-Sapphire).
// Övriga namn är antaget efter samma mönster -- rapportera om något ger fel.
const EX_ERA_SETS = new Set([
  "sandstorm", "dragon", "team magma vs team aqua", "hidden legends",
  "firered & leafgreen", "team rocket returns", "deoxys", "emerald",
  "unseen forces", "delta species", "legend maker", "holon phantoms",
  "crystal guardians", "dragon frontiers", "power keepers",
]);

const BASE = "https://www.cardmarket.com/en/Pokemon/Products";
const FILTERS = "language=1&minCondition=2"; // engelska, minst Near Mint

// "Lillie's Determination" -> "Lillies-Determination", "Poké Pad" -> "Poke-Pad"
export function cardmarketNameSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accenter
    .replace(/['’`´.]/g, "") // apostrofer och punkter försvinner (Pokégear 3.0 -> Pokegear-30)
    .replace(/[^A-Za-z0-9]+/g, "-") // allt annat blir bindestreck
    .replace(/^-+|-+$/g, "");
}

export interface CardRef {
  name: string;
  number: number;
}

export interface CardmarketLink {
  url: string;
  // true = direktlänk till kortets sida, false = sökning (reservväg)
  exact: boolean;
  // Bara äldre set: sökning på setsidan som visar ALLA utgåvor
  // (reservväg om direktlänken till V1 inte finns).
  listUrl?: string;
}

// siblings = ALLA kort i samma set (med namn + nummer) -- behövs för att
// räkna ut V-siffran.
export function cardmarketLink(
  setName: string,
  card: CardRef,
  siblings: CardRef[],
  opts: { reverseHolo?: boolean } = {}
): CardmarketLink {
  const r = cardmarketLinkBase(setName, card, siblings);
  if (!opts.reverseHolo) return r;
  // Cardmarkets filter för reverse holo (verifierat: isReverseHolo=Y).
  return {
    ...r,
    url: `${r.url}&isReverseHolo=Y`,
    listUrl: r.listUrl ? `${r.listUrl}&isReverseHolo=Y` : undefined,
  };
}

function cardmarketLinkBase(
  setName: string,
  card: CardRef,
  siblings: CardRef[]
): CardmarketLink {
  const set = CARDMARKET_SETS[setName.trim().toLowerCase()];
  if (!set) {
    // Övriga set: sök på kortnamnet INOM setets egen sida (verifierat på
    // Base-Set). Visar alla utgåvor (t.ex. Shadowless) så man väljer själv.
    const key = setName.trim().toLowerCase();
    const legacy = LEGACY_SETS[key];
    if (legacy) {
      return {
        url: `${BASE}/Singles/${legacy.slug}/${cardmarketNameSlug(card.name)}${legacy.noV ? "-" : "-V1-"}${legacy.code}${card.number}?${FILTERS}`,
        exact: true,
        listUrl: `${BASE}/Singles/${legacy.slug}?searchString=${encodeURIComponent(card.name)}&${FILTERS}`,
      };
    }
    if (!key) {
      return { url: searchUrl(card.name), exact: false };
    }
    const slug =
      SET_SLUG_OVERRIDES[key] ??
      (EX_ERA_SETS.has(key) ? "EX-" : "") + cardmarketNameSlug(setName);
    return {
      url: `${BASE}/Singles/${slug}?searchString=${encodeURIComponent(card.name)}&${FILTERS}`,
      exact: false,
    };
  }

  let version = "";
  if (set.versioned) {
    const sameName = siblings
      .filter((c) => c.name.trim().toLowerCase() === card.name.trim().toLowerCase())
      .map((c) => c.number)
      .sort((a, b) => a - b);
    // Hittas kortet inte bland syskonen vet vi inte säkert -> sökning.
    if (!sameName.includes(card.number)) {
      return { url: searchUrl(`${card.name} ${set.code}`), exact: false };
    }
    if (sameName.length > 1) version = `V${sameName.indexOf(card.number) + 1}-`;
  }

  const num = String(card.number).padStart(set.pad ?? 3, "0");
  const slug = `${cardmarketNameSlug(card.name)}-${version}${set.code}${num}`;
  return {
    url: `${BASE}/Singles/${set.slug}/${slug}?${FILTERS}`,
    exact: true,
    listUrl: set.withList
      ? `${BASE}/Singles/${set.slug}?searchString=${encodeURIComponent(card.name)}&${FILTERS}`
      : undefined,
  };
}

function searchUrl(query: string): string {
  return `${BASE}/Search?searchString=${encodeURIComponent(query)}&${FILTERS}`;
}
