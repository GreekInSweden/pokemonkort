export type Rarity =
  | "common"
  | "illustration_rare"
  | "ultra_rare"
  | "special_illustration_rare"
  | "mega_hyper_rare"
  | "promo";

export type Variant = "normal" | "holo";

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
