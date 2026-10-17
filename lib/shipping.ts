// Shipping calculation based on number of cards ordered.
//
// UPDATE (2026-09): switched to DHL's small-parcel tier, which covers up
// to 1 kg for 73 kr — comfortably covers essentially any card order by
// weight, and DHL's parcel dimensions are more forgiving for rigid
// packaging (toploaders, cardboard) than PostNord's letter-format tiers
// were, which is what caused the earlier 107 kr surprise.
const FLAT_RATE_SEK = 73;

export function calculateShippingSek(totalCardCount: number): number {
  if (totalCardCount <= 0) return 0;
  return FLAT_RATE_SEK;
}

// Butiken (sealed-produkter) fraktas efter vikt. DHL:s småpaket upp till
// 1 kg kostar 73 kr (se ovan). PRISERNA ÖVER 1 KG NEDAN ÄR ANTAGANDEN --
// kontrollera mot DHL:s aktuella prislista och ändra siffrorna här
// innan du säljer tyngre paket (flera ETB eller bundles väger snabbt
// över 1 kg).
export const SHIPPING_TIERS: { maxGrams: number; sek: number }[] = [
  { maxGrams: 1000, sek: 73 },
  { maxGrams: 2000, sek: 99 },
  { maxGrams: 5000, sek: 129 },
  { maxGrams: 10000, sek: 179 },
];

export function calculateShippingForWeightSek(totalGrams: number): number {
  if (totalGrams <= 0) return calculateShippingSek(1);
  const tier = SHIPPING_TIERS.find((t) => totalGrams <= t.maxGrams);
  return (tier ?? SHIPPING_TIERS[SHIPPING_TIERS.length - 1]).sek;
}
