import Link from "next/link";
import { notFound } from "next/navigation";
import { isShopEnabled, isAdminUser } from "@/lib/shopStatus";
import { supabase } from "@/lib/supabaseClient";
import { ProductCategory, ProductRow } from "@/lib/types";
import {
  productCategories,
  productCategoryLabel,
  productCategoryPlural,
} from "@/lib/shop";
import AddToCartButton from "@/components/shop/AddToCartButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ButikPage({
  searchParams,
}: {
  searchParams: { kategori?: string };
}) {
  // Butiken är osynlig (404) för besökare tills den slås på i admin.
  const enabled = await isShopEnabled();
  const adminPreview = !enabled && (await isAdminUser());
  if (!enabled && !adminPreview) notFound();

  const active = productCategories.find((c) => c === searchParams.kategori) ?? null;

  let query = supabase
    .from("products")
    .select(
      "id, name, category, set_name, description, price_sek, stock, weight_g, image_url, is_active, sort_order"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (active) query = query.eq("category", active);

  const { data, error } = await query;
  const products = (data as ProductRow[]) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-14">
      {adminPreview && (
        <div className="border border-amber-400/50 bg-amber-400/5 rounded-md p-3 mb-6 text-sm text-amber-400/90">
          Förhandsgranskning: butiken är avstängd för besökare. Bara du som
          admin ser den här sidan. Slå på den under Admin → Produkter.
        </div>
      )}
      <h1 className="font-display text-4xl font-bold text-paper mb-2">Butik</h1>
      <p className="text-mute mb-8 max-w-prose">
        Boosters, bundles, Elite Trainer Boxes och mer. Lägg i varukorgen,
        beställ och betala med Swish — vi skickar när betalningen kommit in.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        <FilterChip href="/butik" label="Alla" selected={!active} />
        {productCategories.map((c) => (
          <FilterChip
            key={c}
            href={`/butik?kategori=${c}`}
            label={productCategoryPlural[c]}
            selected={active === c}
          />
        ))}
      </div>

      {error ? (
        <div className="border border-line rounded-md p-8 text-mute max-w-xl">
          Butiken är inte klar än. Kör <span className="font-mono">products.sql</span>{" "}
          i Supabase så fungerar den.
        </div>
      ) : products.length === 0 ? (
        <div className="border border-line rounded-md p-8 text-mute max-w-xl">
          Inga produkter i den här kategorin just nu. Kom tillbaka snart!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  selected,
}: {
  href: string;
  label: string;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      className={`focus-ring text-sm rounded-sm border px-3 py-1.5 transition-colors ${
        selected
          ? "border-gold text-gold bg-gold/10"
          : "border-line text-mute hover:text-paper hover:border-mute"
      }`}
    >
      {label}
    </Link>
  );
}

function ProductCard({ product }: { product: ProductRow }) {
  const soldOut = product.stock <= 0;
  return (
    <div
      className={`border border-line rounded-md bg-panel overflow-hidden flex flex-col ${
        soldOut ? "opacity-70" : ""
      }`}
    >
      <div className="aspect-[4/3] bg-ink flex items-center justify-center">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs text-mute font-mono">Bild kommer</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="font-mono text-xs text-mute mb-1">
          {productCategoryLabel[product.category as ProductCategory]}
          {product.set_name && ` · ${product.set_name}`}
        </div>
        <div className="font-display font-semibold text-paper mb-1">{product.name}</div>
        {product.description && (
          <p className="text-sm text-mute mb-3 line-clamp-3">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div>
            <div className="font-mono text-lg text-gold">{Number(product.price_sek)} kr</div>
            <div className="text-xs text-mute font-mono">
              {soldOut
                ? "Slutsåld"
                : product.stock <= 3
                ? `Bara ${product.stock} kvar`
                : "I lager"}
            </div>
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
