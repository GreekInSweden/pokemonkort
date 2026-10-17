import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { MEMBER_SESSION_COOKIE, verifyMemberSession } from "@/lib/memberSession";
import { calculateShippingForWeightSek } from "@/lib/shipping";
import { isShopEnabled, isAdminUser } from "@/lib/shopStatus";

interface CheckoutItem {
  kind?: "card" | "product";
  variantId: string; // för produkter: produktens id
  cardName: string;
  cardNumber: number;
  variant: "normal" | "holo";
  quantity: number;
  unitPriceSek: number;
}

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KL-${y}${m}${d}-${rand}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customer, items, subtotalSek, shippingSek, totalSek } = body as {
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
      postalCode: string;
      city: string;
    };
    items: CheckoutItem[];
    subtotalSek: number;
    shippingSek: number;
    totalSek: number;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Varukorgen är tom." }, { status: 400 });
  }
  if (!customer?.name || !customer?.email || !customer?.address) {
    return NextResponse.json(
      { error: "Fyll i alla obligatoriska fält." },
      { status: 400 }
    );
  }

  // Butiken (sealed-produkter): priser, lager och frakt räknas om här på
  // servern från databasen -- klientens belopp litas inte på.
  if (items.every((i) => i.kind === "product")) {
    if (!(await isShopEnabled()) && !(await isAdminUser())) {
      return NextResponse.json({ error: "Butiken är inte öppen än." }, { status: 403 });
    }
    return handleProductCheckout(req, customer, items);
  }

  // Re-check stock server-side before committing the order — the storefront
  // greys out sold-out cards, but two people could be checking out at once.
  for (const item of items) {
    const { data: variant, error } = await supabaseAdmin
      .from("card_variants")
      .select("stock")
      .eq("id", item.variantId)
      .single();

    if (error || !variant || variant.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `"${item.cardName}" (${item.variant}) finns inte längre i tillräckligt antal. Ladda om sidan och försök igen.`,
        },
        { status: 409 }
      );
    }
  }

  const orderNumber = generateOrderNumber();

  // Link the order to a member account if the buyer happens to be logged
  // in — purely for their own order history on /konto, guest checkout
  // (no account) still works exactly as before.
  const sessionToken = req.cookies.get(MEMBER_SESSION_COOKIE)?.value;
  const memberId = sessionToken ? await verifyMemberSession(sessionToken) : null;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      order_number: orderNumber,
      member_id: memberId,
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      postal_code: customer.postalCode,
      city: customer.city,
      subtotal_sek: subtotalSek,
      shipping_sek: shippingSek,
      total_sek: totalSek,
      status: "pending_payment",
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Kunde inte skapa ordern. Försök igen." },
      { status: 500 }
    );
  }

  const orderItemsPayload = items.map((item) => ({
    order_id: order.id,
    card_variant_id: item.variantId,
    card_name: item.cardName,
    card_number: item.cardNumber,
    variant: item.variant,
    quantity: item.quantity,
    unit_price_sek: item.unitPriceSek,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) {
    return NextResponse.json(
      { error: "Kunde inte spara kortraderna. Försök igen." },
      { status: 500 }
    );
  }

  // Decrement stock for each purchased variant.
  for (const item of items) {
    const { data: current } = await supabaseAdmin
      .from("card_variants")
      .select("stock")
      .eq("id", item.variantId)
      .single();
    const newStock = Math.max(0, (current?.stock ?? 0) - item.quantity);
    await supabaseAdmin
      .from("card_variants")
      .update({ stock: newStock })
      .eq("id", item.variantId);
  }

  return NextResponse.json({ orderNumber });
}


async function handleProductCheckout(
  req: NextRequest,
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
  },
  items: CheckoutItem[]
) {
  // Slå ihop dubbletter av samma produkt.
  const qtyById = new Map<string, number>();
  for (const i of items) {
    const q = Math.floor(Number(i.quantity));
    if (!i.variantId || !Number.isFinite(q) || q < 1 || q > 99) {
      return NextResponse.json({ error: "Ogiltigt antal i varukorgen." }, { status: 400 });
    }
    qtyById.set(i.variantId, (qtyById.get(i.variantId) ?? 0) + q);
  }

  const { data: products, error: pErr } = await supabaseAdmin
    .from("products")
    .select("id, name, category, price_sek, stock, weight_g, is_active")
    .in("id", Array.from(qtyById.keys()));
  if (pErr || !products) {
    return NextResponse.json({ error: "Kunde inte läsa produkterna." }, { status: 500 });
  }

  let subtotal = 0;
  let weight = 0;
  for (const [id, qty] of Array.from(qtyById.entries())) {
    const p = products.find((x: any) => x.id === id);
    if (!p || !p.is_active || p.stock < qty) {
      return NextResponse.json(
        {
          error: `"${p?.name ?? "En vara"}" finns inte längre i tillräckligt antal. Ladda om sidan och försök igen.`,
        },
        { status: 409 }
      );
    }
    subtotal += Number(p.price_sek) * qty;
    weight += Number(p.weight_g) * qty;
  }
  const shipping = calculateShippingForWeightSek(weight);
  const total = subtotal + shipping;

  const orderNumber = generateOrderNumber();
  const sessionToken = req.cookies.get(MEMBER_SESSION_COOKIE)?.value;
  const memberId = sessionToken ? await verifyMemberSession(sessionToken) : null;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      order_number: orderNumber,
      member_id: memberId,
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      postal_code: customer.postalCode,
      city: customer.city,
      subtotal_sek: subtotal,
      shipping_sek: shipping,
      total_sek: total,
      status: "pending_payment",
    })
    .select()
    .single();
  if (orderError || !order) {
    return NextResponse.json({ error: "Kunde inte skapa ordern. Försök igen." }, { status: 500 });
  }

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
    Array.from(qtyById.entries()).map(([id, qty]) => {
      const p = products.find((x: any) => x.id === id)!;
      return {
        order_id: order.id,
        product_id: id,
        card_variant_id: null,
        card_name: p.name,
        card_number: 0,
        variant: "normal",
        quantity: qty,
        unit_price_sek: Number(p.price_sek),
      };
    })
  );
  if (itemsError) {
    return NextResponse.json(
      { error: "Kunde inte spara orderraderna. Försök igen." },
      { status: 500 }
    );
  }

  for (const [id, qty] of Array.from(qtyById.entries())) {
    const p = products.find((x: any) => x.id === id)!;
    await supabaseAdmin
      .from("products")
      .update({ stock: Math.max(0, p.stock - qty) })
      .eq("id", id);
  }

  return NextResponse.json({ orderNumber, totalSek: total });
}
