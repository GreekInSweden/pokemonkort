// Konstanter som både servern och webbläsaren behöver. Ligger i en egen
// fil utan serverimporter -- lib/giveaway.ts drar in service-role-klienten
// och får ALDRIG importeras från en klientkomponent (den kraschar då
// sidan i webbläsaren).

// Hur länge live-dragningen "snurrar" innan vinnaren avslöjas (ms).
export const GIVEAWAY_REVEAL_MS = 10_000;

// Hur länge en avslutad giveaway ligger kvar som aktuell (och länken i
// menyn syns) efter att vinnaren dragits.
export const GIVEAWAY_RECENT_DAYS = 14;
