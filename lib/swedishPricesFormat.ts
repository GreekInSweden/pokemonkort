// Ren formatering -- inga serverimporter, kan användas i webbläsaren.
export interface SwedishPrice {
  shop?: number; // lägsta pris för ett kort i lager
  sold?: number; // senaste försäljningspris
  soldAt?: string; // ISO-datum
}

export function swedishPriceText(p?: SwedishPrice): string | null {
  if (!p) return null;
  const parts: string[] = [];
  if (p.shop !== undefined) parts.push(`Butik ${Math.round(p.shop)} kr`);
  if (p.sold !== undefined) parts.push(`Senast såld ${Math.round(p.sold)} kr`);
  return parts.length ? parts.join(" · ") : null;
}
