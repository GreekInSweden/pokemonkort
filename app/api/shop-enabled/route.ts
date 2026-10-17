import { NextResponse } from "next/server";
import { isShopEnabled } from "@/lib/shopStatus";

export const dynamic = "force-dynamic";

// Används av menyn för att veta om Butik-länken ska visas.
export async function GET() {
  return NextResponse.json({ enabled: await isShopEnabled() });
}
