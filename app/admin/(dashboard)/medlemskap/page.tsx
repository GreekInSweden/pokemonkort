import { createServerSupabase } from "@/lib/supabase/server";
import MembershipAdmin from "@/components/admin/MembershipAdmin";
import { FREE_SET_LIMIT, PRICE_MONTH_SEK, PRICE_YEAR_SEK } from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function AdminMedlemskapPage() {
  const supabase = createServerSupabase();

  const { data: setting, error: settingError } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "paywall_enabled")
    .maybeSingle();

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, member_number, username, name, email, paid_until")
    .order("member_number", { ascending: true });

  const sqlMissing = !!settingError || !!membersError;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-paper mb-1">Medlemskap</h1>
      <p className="text-mute text-sm mb-6">
        Betalnivå: {FREE_SET_LIMIT} gratis set, sedan {PRICE_MONTH_SEK} kr/mån
        eller {PRICE_YEAR_SEK} kr/år för fri access. Är den avstängd har alla fri
        access som vanligt.
      </p>

      {sqlMissing ? (
        <p className="text-sm text-amber-400/90">
          Kör först <span className="font-mono">membership_tiers.sql</span> i
          Supabase, ladda sedan om sidan.
        </p>
      ) : (
        <MembershipAdmin
          initialEnabled={setting?.value === "true"}
          members={(members as any[]) ?? []}
        />
      )}
    </div>
  );
}
