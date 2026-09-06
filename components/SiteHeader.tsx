"use client";

import Link from "next/link";
import { useCart } from "@/lib/CartContext";

export default function SiteHeader() {
  const { itemCount, subtotalSek } = useCart();

  return (
    <header className="border-b border-line sticky top-0 z-30 bg-ink/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-paper">
          Kortlagret
        </Link>
        <Link
          href="/kassa"
          className="focus-ring flex items-center gap-3 rounded-md border border-line px-4 py-2 hover:border-gold transition-colors"
        >
          <span className="font-mono text-sm text-mute">{itemCount} kort</span>
          <span className="font-mono text-sm font-medium text-gold">
            {subtotalSek} kr
          </span>
        </Link>
      </div>
    </header>
  );
}
