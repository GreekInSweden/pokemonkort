// Ren formatering -- inga serverimporter, kan användas i webbläsaren.
export interface SwedishPrice {
  shop?: number; // lägsta pris för ett kort i lager
  sold?: number; // senaste försäljningspris
  soldAt?: string; // ISO-datum
}

export function swedishPriceText(p?: SwedishPrice): string | null {
  if (!p) return null;
  // "Senast såld" visas inte längre (för få försäljningar för att vara rättvisande).
  const parts: string[] = [];
  if (p.shop !== undefined) parts.push(`Butik ${Math.round(p.shop)} kr`);
  return parts.length ? parts.join(" · ") : null;
}
