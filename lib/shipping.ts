// Shipping calculation based on number of cards ordered, mapped to
// PostNord's actual TRACKED services (as of 2026 — PostNord phased out
// untracked letters for goods, so "Skicka Lätt" is now the cheapest
// tracked option):
//   - Skicka Lätt, letter format (up to 2 kg): 49 kr
//   - Skicka Lätt, parcel format (thicker/bulkier, still up to 2 kg): 69 kr
//   - Postpaket 1 kg (once it's too much for Skicka Lätt): 102 kr
// All three give a trackable ID via the PostNord app/website, so you can
// confirm delivery instead of just hoping it arrives.
// Adjust the breakpoints and prices freely if your actual packaging
// weighs in differently than assumed here.
export function calculateShippingSek(totalCardCount: number): number {
  if (totalCardCount <= 0) return 0;
  if (totalCardCount <= 10) return 49;
  if (totalCardCount <= 40) return 69;
  return 102;
}
