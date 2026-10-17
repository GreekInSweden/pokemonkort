import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createServerSupabase } from "@/lib/supabase/server";

// Butiken är avstängd (osynlig för besökare) tills du slår på den i
// Admin -> Produkter. Saknas tabellen eller något krånglar räknas den som
// AVSTÄNGD (fail closed), så den aldrig öppnas av misstag.
export async function isShopEnabled(): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "shop_enabled")
    .maybeSingle();
  if (error) return false;
  return data?.value === "true";
}

// Inloggad admin får förhandsgranska och testa butiken även när den är
// avstängd för besökare.
export async function isAdminUser(): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}
