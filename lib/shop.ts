import { ProductCategory } from "@/lib/types";

export const productCategoryLabel: Record<ProductCategory, string> = {
  booster: "Booster",
  booster_bundle: "Booster bundle",
  etb: "Elite Trainer Box",
  tin_box: "Tin / box",
  other: "Övrigt",
};

export const productCategoryPlural: Record<ProductCategory, string> = {
  booster: "Boosters",
  booster_bundle: "Booster bundles",
  etb: "Elite Trainer Boxes",
  tin_box: "Tins & boxar",
  other: "Övrigt",
};

export const productCategories: ProductCategory[] = [
  "booster",
  "booster_bundle",
  "etb",
  "tin_box",
  "other",
];

// Förslag på vikt (gram) per kategori i admin-formuläret. Ungefärliga
// värden -- väg gärna din egen produkt och skriv över.
export const defaultWeightG: Record<ProductCategory, number> = {
  booster: 15,
  booster_bundle: 450,
  etb: 650,
  tin_box: 500,
  other: 200,
};
