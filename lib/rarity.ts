import { Rarity } from "./types";

export const rarityLabel: Record<Rarity, string> = {
  common: "Vanligt",
  illustration_rare: "Illustration Rare",
  ultra_rare: "Ultra Rare",
  special_illustration_rare: "Special Illustration Rare",
  mega_hyper_rare: "Mega Hyper Rare",
};

// Tailwind classes for the thin rarity edge on each card tile.
export const rarityAccent: Record<Rarity, string> = {
  common: "border-l-rare-common",
  illustration_rare: "border-l-rare-illustration",
  ultra_rare: "border-l-rare-ultra",
  special_illustration_rare: "border-l-rare-special",
  mega_hyper_rare: "border-l-rare-gold",
};
