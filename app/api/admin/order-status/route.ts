import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminUser } from "@/lib/shopStatus";
import { notifyOrderStatus } from "@/lib/orderEmails";

export const dynamic = "force-dynamic";

// Admin markerar en order som betald/skickad -> status sparas och kunden
// får ett mejl (spårningsnummer valfritt vid "shipped").
export async function POST(req: NextRequest) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }
  const { orderId, status, tracking } = (await req.json()) as {
    orderId: string;
    status: "paid" | "shipped";
    tracking?: string;
  };
  if (!orderId || (status !== "paid" && status !== "shipped")) {
    return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  }
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select(
      "order_number, customer_name, email, phone, address, postal_code, city, subtotal_sek, shipping_sek, total_sek"
    )
    .single();
  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Ordern hittades inte." }, { status: 500 });
  }
  await notifyOrderStatus(order as any, status, tracking);
  return NextResponse.json({ ok: true });
}
