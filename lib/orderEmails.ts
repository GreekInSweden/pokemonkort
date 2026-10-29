import { sendEmail, SITE_URL } from "@/lib/email";

export const ORDER_NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL || "order@atlasnetwork.se";

export interface MailOrder {
  order_number: string;
  customer_name: string;
  email: string;
  phone?: string | null;
  address: string;
  postal_code: string;
  city: string;
  subtotal_sek: number;
  shipping_sek: number;
  total_sek: number;
}
export interface MailItem {
  card_name: string;
  variant?: string | null;
  quantity: number;
  unit_price_sek: number;
}

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const kr = (n: number) => `${Math.round(Number(n))} kr`;

function itemLines(items: MailItem[]) {
  return items.map(
    (i) => `${i.quantity} x ${i.card_name}${i.variant === "holo" ? " (holo)" : ""} - ${kr(i.unit_price_sek * i.quantity)}`
  );
}
function itemsHtml(items: MailItem[]) {
  return `<ul>${itemLines(items).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
}
function addressText(o: MailOrder) {
  return `${o.customer_name}\n${o.address}\n${o.postal_code} ${o.city}`;
}

// Kundens bekräftelse + adminnotis när en order läggs. Fel här får aldrig
// stoppa ordern, så allt är try/catch.
export async function notifyNewOrder(order: MailOrder, items: MailItem[]) {
  try {
    const swish = (process.env.NEXT_PUBLIC_SWISH_NUMBER || "").trim();
    const lines = itemLines(items);
    const payText = swish
      ? `Betala ${kr(order.total_sek)} med Swish till ${swish} och skriv ${order.order_number} som meddelande.`
      : `Betala ${kr(order.total_sek)} med Swish och skriv ${order.order_number} som meddelande.`;
    await sendEmail({
      to: order.email,
      subject: `Orderbekräftelse ${order.order_number} - Kortmarknad`,
      text: `Hej ${order.customer_name}!\n\nTack för din beställning (${order.order_number}).\n\n${lines.join("\n")}\n\nVaror: ${kr(order.subtotal_sek)}\nFrakt: ${kr(order.shipping_sek)}\nTotalt: ${kr(order.total_sek)}\n\n${payText}\nNär betalningen kommit in skickar vi en bekräftelse och packar din order.\n\nLeveransadress:\n${addressText(order)}\n\n${SITE_URL}`,
      html: `<p>Hej ${esc(order.customer_name)}!</p><p>Tack för din beställning <strong>${esc(order.order_number)}</strong>.</p>${itemsHtml(items)}<p>Varor: ${kr(order.subtotal_sek)}<br>Frakt: ${kr(order.shipping_sek)}<br><strong>Totalt: ${kr(order.total_sek)}</strong></p><p><strong>${esc(payText)}</strong><br>När betalningen kommit in skickar vi en bekräftelse och packar din order.</p><p>Leveransadress:<br>${esc(addressText(order)).replace(/\n/g, "<br>")}</p><p><a href="${SITE_URL}">Kortmarknad</a></p>`,
    });
    await sendEmail({
      to: ORDER_NOTIFY_EMAIL,
      subject: `Ny order ${order.order_number} - ${kr(order.total_sek)}`,
      text: `Ny order ${order.order_number}\n\n${lines.join("\n")}\n\nTotalt: ${kr(order.total_sek)} (varav frakt ${kr(order.shipping_sek)})\n\nKund: ${order.customer_name}\n${order.email}\n${order.phone ?? ""}\n${order.address}, ${order.postal_code} ${order.city}\n\n${SITE_URL}/admin/bestallningar`,
      html: `<p>Ny order <strong>${esc(order.order_number)}</strong></p>${itemsHtml(items)}<p>Totalt: ${kr(order.total_sek)} (varav frakt ${kr(order.shipping_sek)})</p><p>${esc(order.customer_name)}<br>${esc(order.email)}<br>${esc(order.phone ?? "")}<br>${esc(order.address)}, ${esc(order.postal_code)} ${esc(order.city)}</p><p><a href="${SITE_URL}/admin/bestallningar">Öppna beställningar</a></p>`,
    });
  } catch {
    /* mejl är bonus, ordern är redan sparad */
  }
}

export async function notifyOrderStatus(
  order: MailOrder,
  status: "paid" | "shipped",
  tracking?: string
) {
  try {
    const t = tracking?.trim();
    const subject =
      status === "paid"
        ? `Betalning mottagen ${order.order_number} - Kortmarknad`
        : `Din order ${order.order_number} är skickad - Kortmarknad`;
    const body =
      status === "paid"
        ? `Vi har tagit emot din betalning på ${kr(order.total_sek)}. Vi packar din order och skickar den så snart vi kan.`
        : `Din order är nu skickad till ${order.address}, ${order.postal_code} ${order.city}.${t ? `\nSpårningsnummer: ${t}` : ""}`;
    await sendEmail({
      to: order.email,
      subject,
      text: `Hej ${order.customer_name}!\n\n${body}\n\nOrdernummer: ${order.order_number}\n\nTack för att du handlar hos oss!\n${SITE_URL}`,
      html: `<p>Hej ${esc(order.customer_name)}!</p><p>${esc(body).replace(/\n/g, "<br>")}</p><p>Ordernummer: ${esc(order.order_number)}</p><p>Tack för att du handlar hos oss!<br><a href="${SITE_URL}">Kortmarknad</a></p>`,
    });
  } catch {
    /* ignore */
  }
}
