// A random per-browser id, generated once and reused for every bid placed
// from that browser. It carries no personal information — it just lets
// the server recognize "this is the same bidder as before" so a winner
// can be matched up with their bids without asking for name/e-post/
// telefon on every single bid. Stored in localStorage, so it's tied to
// this browser only: clearing site data or switching device loses it,
// the same way any "remember me" cookie would.
const STORAGE_KEY = "kortlagret_bidder_token";

export function getBidderToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let token = window.localStorage.getItem(STORAGE_KEY);
    if (!token) {
      token =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(STORAGE_KEY, token);
    }
    return token;
  } catch {
    // Private browsing or storage blocked — bidding still works, it just
    // won't remember this visitor as the same bidder on their next visit.
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
