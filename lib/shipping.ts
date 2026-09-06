// Simple placeholder shipping calculation based on number of cards ordered.
// Loose cards in a rigid mailer are light, so this mirrors roughly what a
// PostNord/Bring "brev" service costs in Sweden as of 2026. Adjust the
// breakpoints and prices freely — this is meant to be a sensible starting
// point, not a live carrier-rate lookup (that would need a shipping API).
export function calculateShippingSek(totalCardCount: number): number {
  if (totalCardCount <= 0) return 0;
  if (totalCardCount <= 10) return 15;
  if (totalCardCount <= 30) return 29;
  return 49;
}
