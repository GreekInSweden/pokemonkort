import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Publik, endast antalet registrerade medlemmar -- inga personuppgifter.
export async function GET() {
  const { count, error } = await supabaseAdmin
    .from("members")
    .select("id", { count: "exact", head: true });

  if (error || count === null) {
    return NextResponse.json({ count: null });
  }
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
