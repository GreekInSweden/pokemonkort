import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Publik, endast antalet registrerade medlemmar -- inga personuppgifter.
export async function GET() {
  const { count, error } = await supabaseAdmin
    .from("members")
    .select("id", { count: "exact", head: true });

  if (error || count === null) {
    return NextResponse.json({ count: null });
  }
  return NextResponse.json({ count });
}
