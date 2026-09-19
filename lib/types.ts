export type Rarity =
  | "common"
  | "illustration_rare"
  | "ultra_rare"
  | "special_illustration_rare"
  | "mega_hyper_rare"
  | "promo"
  | "base"
  | "insert";

export type Variant = "normal" | "holo" | "reverse_holo";

// Energityp/"färg" på Pokémon-korten — används för att kunna söka i admin
// på samma sätt korten sorteras fysiskt innan de läggs i fack. Sätts inte
// på Topps-kort (null där).
export type PokemonType =
  | "grass"
  | "fire"
  | "water"
  | "lightning"
  | "psychic"
  | "fighting"
  | "darkness"
  | "metal"
  | "fairy"
  | "dragon"
  | "colorless";

export interface SetRow {
  id: string;
  category_slug: string;
  category_name: string;
  slug: string;
  name: string;
}

export interface CardVariantRow {
  id: string;
  card_id: string;
  variant: Variant;
  price_sek: number;
  stock: number;
}

export interface CardRow {
  id: string;
  set_id: string;
  number: number;
  name: string;
  rarity: Rarity;
  image_url: string | null;
  pokemon_type: PokemonType | null;
  variants: CardVariantRow[];
}

export interface CartItem {
  variantId: string;
  cardId: string;
  cardNumber: number;
  cardName: string;
  variant: Variant;
  unitPriceSek: number;
  quantity: number;
  setSlug: string;
  setName: string;
}

export interface AuctionListing {
  auctionId: string;
  cardName: string;
  cardNumber: number;
  variant: Variant;
  rarity: Rarity;
  imageUrl: string | null;
  startingPriceSek: number;
  minIncrementSek: number;
  currentHighSek: number;
  bidCount: number;
  endsAt: string;
  status: "open" | "closed";
  reserveMet: boolean;
}
