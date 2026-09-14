// Shipping calculation based on number of cards ordered.
//
// IMPORTANT CONTEXT (2026-09): the tiered model below this comment used to
// assume light letter-format shipping would cover most orders cheaply.
// Real-world data proved that wrong — an order of ~30 cards with cardboard
// packaging, only 100g total, still needed PostNord Skicka Lätt in PARCEL
// format and cost 107 kr to actually send, because rigid packaging makes
// the parcel too thick for the cheaper letter-format tiers regardless of
// how little it weighs. The old tiers charged only 69 kr for that order —
// a real loss.
//
// Until there's more real shipping-receipt data to calibrate proper tiers
// again, this uses one flat rate set safely above the worst real cost seen
// so far (107 kr), so a repeat of that loss doesn't happen while we
// gather more data points.
const FLAT_RATE_SEK = 129;

export function calculateShippingSek(totalCardCount: number): number {
  if (totalCardCount <= 0) return 0;
  return FLAT_RATE_SEK;
}
