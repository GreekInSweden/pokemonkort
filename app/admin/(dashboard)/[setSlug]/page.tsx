import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import StockEditor from "@/components/admin/StockEditor";

export const dynamic = "force-dynamic";

export default async function AdminSetPage({
  params,
}: {
  params: { setSlug: string };
}) {
  const supabase = createServerSupabase();

  const { data: set } = await supabase
    .from("sets")
    .select("id, slug, name, category_name")
    .eq("slug", params.setSlug)
    .single();

  if (!set) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, number, name, rarity, image_url, card_variants(id, variant, price_sek, stock)")
    .eq("set_id", set.id)
    .order("number", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-sm text-mute font-mono mb-2">
        <Link href="/admin" className="hover:text-gold">
          Lager
        </Link>{" "}
        / {set.name}
      </div>
      <h1 className="font-display text-2xl font-bold text-paper mb-1">
        {set.name}
      </h1>
      <p className="text-mute mb-8">
        Fyll i hur många du har av varje kort och variant. Klicka i en ruta
        och skriv, eller använd +1 för snabb bulkinmatning. Glöm inte att
        spara.
      </p>

      <StockEditor cards={(cards as any) ?? []} />
    </div>
  );
}
