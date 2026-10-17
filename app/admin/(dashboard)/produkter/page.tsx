import { createServerSupabase } from "@/lib/supabase/server";
import ProductAdmin from "@/components/admin/ProductAdmin";
import ShopToggle from "@/components/admin/ShopToggle";
import { ProductRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProdukterPage() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, category, set_name, description, price_sek, stock, weight_g, image_url, is_active, sort_order"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "shop_enabled")
    .maybeSingle();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-paper mb-1">Produkter</h1>
      <p className="text-mute text-sm mb-8">
        Det som säljs i Butiken: boosters, bundles, ETB och tins/boxar. Dolda
        produkter syns inte för besökare. Lager minskar automatiskt vid beställning.
      </p>
      {!error && <ShopToggle initialEnabled={setting?.value === "true"} />}
      {error ? (
        <p className="text-sm text-amber-400/90">
          Kör först <span className="font-mono">products.sql</span> i Supabase och ladda om sidan.
        </p>
      ) : (
        <ProductAdmin initialProducts={(data as ProductRow[]) ?? []} />
      )}
    </div>
  );
}
