// Ren parsning av sökfrågan på "Hitta kort" (inga databasimporter, så den
// går att enhetstesta). Förstår:
//   "pikachu"          -> namn
//   "47/114"           -> nummer 47 i ett set med 114 kort (tryckt på kortet)
//   "charizard 4/102"  -> namn + nummer/total
//   "charizard 4"      -> namn + nummer
//   "rc29", "rc29/rc32", "pikachu tg12" -> särnummer (RC/TG/GG/SV/SH/H)
export interface ParsedQuery {
  words: string[];
  number: number | null;
  total: number | null;
  // Särnummer som RC29, TG12, GG05 (lagras som >= 500000, se displayNumber).
  code: string | null;
}

export function parseQuery(raw: string): ParsedQuery {
  let text = raw.toLowerCase().replace(/[’'´`.]/g, "").replace(/[%_,()]/g, " ");
  let number: number | null = null;
  let total: number | null = null;
  let code: string | null = null;

  // Särnummer först: "rc29", "rc 29", "rc29/rc32", "tg12/tg30".
  const special = text.match(
    /(?:^|\s)(rc|tg|gg|sv|sh|h)\s?(\d{1,3})(?:\s*\/\s*(?:rc|tg|gg|sv|sh|h)?\s?\d{1,3})?(?=\s|$)/
  );
  if (special) {
    code = `${special[1].toUpperCase()}${parseInt(special[2], 10)}`;
    text = text.replace(special[0], " ");
  }

  const slash = text.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
  if (slash) {
    number = parseInt(slash[1], 10);
    total = parseInt(slash[2], 10);
    text = text.replace(slash[0], " ");
  }
  const words: string[] = [];
  for (const t of text.split(/\s+/).filter(Boolean)) {
    if (/^\d{1,3}$/.test(t) && number === null) {
      number = parseInt(t, 10);
    } else {
      words.push(t);
    }
  }
  return { words: words.slice(0, 6), number, total, code };
}

// Originalnumret för kort med "särnummer" (H10, SH10, RC1...) lagras som
// >= 500000 i databasen; det riktiga står i bildens filnamn.
export function displayNumber(
  number: number,
  imageUrl: string | null,
  printedTotal: number | null
): string {
  if (number >= 500000) {
    const m = imageUrl?.match(/\/([A-Za-z]+\d+[a-z]?)_hires/);
    return m ? m[1].toUpperCase() : String(number);
  }
  const n = String(number).padStart(3, "0");
  return printedTotal ? `${n}/${String(printedTotal).padStart(3, "0")}` : n;
}

// Filnamnsmönster i bildens URL för ett särnummer (med och utan nollpadding).
export function codeImagePatterns(code: string): string[] {
  const m = code.match(/^([A-Z]+)(\d+)$/);
  if (!m) return [];
  const n = parseInt(m[2], 10);
  const pats = [`%/${m[1]}${n}_hires%`];
  if (n < 10) pats.push(`%/${m[1]}0${n}_hires%`);
  return pats;
}
