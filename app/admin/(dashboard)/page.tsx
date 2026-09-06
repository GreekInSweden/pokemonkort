import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = createServerSupabase();
  const { data: sets } = await supabase
    .from("sets")
    .select("slug, name, category_name")
    .order("category_name")
    .order("name");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-paper mb-1">
        Lager
      </h1>
      <p className="text-mute mb-8">Välj ett set för att fylla i antal.</p>

      {!sets || sets.length === 0 ? (
        <p className="text-mute">Inga set upplagda ännu.</p>
      ) : (
        <div className="space-y-2">
          {sets.map((s) => (
            <Link
              key={s.slug}
              href={`/admin/${s.slug}`}
              className="focus-ring block border border-line rounded-md p-4 hover:border-gold transition-colors bg-panel"
            >
              <div className="text-xs text-mute font-mono">
                {s.category_name}
              </div>
              <div className="font-display font-medium text-paper">
                {s.name}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
