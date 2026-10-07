// Ren beräkning av vad som händer när någon lägger ett högsta bud (maxbud)
// på en auktion -- ingen databas, inga biverkningar, så logiken går att
// testa för sig. /api/bid använder den och skriver sedan resultatet till
// databasen.
//
// Regler (som på de flesta auktionssajter):
//  * Utan bud än: första budet är exakt startpriset, resten av maxbudet
//    hålls dolt.
//  * Är ledarens tak lika högt eller högre än det nya maxbudet: den nya
//    budgivaren blir direkt överbjuden. Hens bud registreras på maxbeloppet
//    och ledaren svarar automatiskt ett steg över -- dock aldrig över sitt
//    eget tak. Vid exakt lika tak vinner ledaren (hen var först).
//  * Är det nya maxbudet högre: ledaren bjuder upp till sitt eget tak, och
//    den nya går ett steg över det (eller exakt sitt maxbud om det är
//    mindre än ett helt steg över).

export interface PlannedBid {
  memberId: string;
  amount: number;
}

export interface BidPlan {
  plan: PlannedBid[];
  outcome: "leading" | "outbid";
  newHigh: number;
}

export function planChallengerBid(input: {
  startingPrice: number;
  increment: number;
  currentHigh: number;
  hasBids: boolean;
  leaderMemberId: string | null;
  // Ledarens verkliga tak: dolt maxbud, men aldrig lägre än budet som redan ligger.
  leaderMax: number;
  memberId: string;
  amountSek: number;
}): BidPlan {
  const { startingPrice, increment, currentHigh, hasBids, leaderMemberId, leaderMax, memberId, amountSek } =
    input;

  if (!hasBids) {
    return {
      plan: [{ memberId, amount: startingPrice }],
      outcome: "leading",
      newHigh: startingPrice,
    };
  }

  if (leaderMax >= amountSek && leaderMemberId) {
    const counter = Math.min(amountSek + increment, leaderMax);
    return {
      plan: [
        { memberId, amount: amountSek },
        { memberId: leaderMemberId, amount: counter },
      ],
      outcome: "outbid",
      newHigh: counter,
    };
  }

  const plan: PlannedBid[] = [];
  if (leaderMemberId && leaderMax > currentHigh) {
    plan.push({ memberId: leaderMemberId, amount: leaderMax });
  }
  const mine = Math.min(leaderMax + increment, amountSek);
  plan.push({ memberId, amount: mine });
  return { plan, outcome: "leading", newHigh: mine };
}
