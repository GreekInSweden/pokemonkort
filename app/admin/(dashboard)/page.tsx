import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import ToggleSetVisibilityButton from "@/components/admin/ToggleSetVisibilityButton";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = createServerSupabase();
  const { data: sets } = await supabase
    .from("sets")
    .select("id, slug, name, category_name, is_visible")
    .order("category_name")
    .order("name");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-paper">Lager</h1>
        <Link
          href="/admin/nytt-set"
          className="focus-ring text-sm rounded-sm border border-line px-3 py-1.5 text-paper hover:border-gold"
        >
          + Nytt set
        </Link>
      </div>
      <p className="text-mute mb-8">
        Välj ett set för att fylla i antal. Dolda set syns bara här, aldrig
        i butiken.
      </p>

      {!sets || sets.length === 0 ? (
        <p className="text-mute">Inga set upplagda ännu.</p>
      ) : (
        <div className="space-y-2">
          {sets.map((s) => (
            <div
              key={s.slug}
              className="flex items-center gap-2 border border-line rounded-md p-4 bg-panel"
            >
              <Link
                href={`/admin/${s.slug}`}
                className="focus-ring flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="text-xs text-mute font-mono">
                  {s.category_name}
                </div>
                <div className="font-display font-medium text-paper">
                  {s.name}
                </div>
              </Link>
              <ToggleSetVisibilityButton
                setId={s.id}
                isVisible={s.is_visible}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

