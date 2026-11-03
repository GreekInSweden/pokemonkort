// Vem som säljer i butiken. Styrs av miljövariabler i Vercel, så du kan byta
// från privatperson till bolag utan att ladda upp några filer:
//   NEXT_PUBLIC_SELLER_TYPE = "private" (standard) eller "company"
//   NEXT_PUBLIC_SELLER_NAME = namnet som visas för privatperson (t.ex. "Christos Efternamn")
// Efter ändring av en miljövariabel måste sajten byggas om (Redeploy).
export const SELLER_IS_COMPANY = process.env.NEXT_PUBLIC_SELLER_TYPE === "company";
export const SELLER_NAME = SELLER_IS_COMPANY
  ? "Atlas Network Structure AB"
  : process.env.NEXT_PUBLIC_SELLER_NAME || "[fyll i ditt namn]";

// Används i giveawayens regler. Utan namn i miljövariabeln visas "en privatperson".
export const SELLER_SHORT = SELLER_IS_COMPANY
  ? "Atlas Network Structure AB"
  : process.env.NEXT_PUBLIC_SELLER_NAME
    ? `${process.env.NEXT_PUBLIC_SELLER_NAME} (privatperson)`
    : "en privatperson";

// Text som visas i butik, kassa och orderbekräftelse.
export const SELLER_NOTICE = SELLER_IS_COMPANY
  ? `Säljare: ${SELLER_NAME}.`
  : `Säljare: ${SELLER_NAME}, som privatperson. Köp från en privatperson omfattas inte av konsumentköplagens regler om ångerrätt vid distansköp. Reklamation och återbetalning hanteras enligt vanlig köplag.`;
