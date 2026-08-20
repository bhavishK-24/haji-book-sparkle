/**
 * Email templates for the notification outbox.
 *
 * Separated from delivery so the wording can change without touching the
 * transport, and so a second channel (WhatsApp Business Platform) can render
 * the same events differently without either knowing about the other.
 *
 * Every template receives the payload frozen at enqueue time — never the live
 * booking. A customer who was promised AED 809 must be emailed AED 809 even if
 * the office has since corrected the row.
 */

export type NotificationPayload = {
  reference: string | null;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  serviceName: string | null;
  serviceId: string | null;
  serviceCategory: string | null;
  propertyType: string | null;
  propertySize: string | null;
  furnishing: string | null;
  emirate: string | null;
  address: string | null;
  date: string | null;
  timeSlot: string | null;
  requestedStart: string | null;
  estimatedMinutes: number | null;
  addOns: Array<{ id?: string; name?: string; quantity?: number | null }>;
  priceAmount: number | null;
  priceCurrency: string | null;
  status: string | null;
  notes: string | null;
  previousStatus?: string | null;
};

export type Rendered = { subject: string; html: string; text: string };

const COMPANY = {
  name: "Haji Ahli Cleaning & Maintenance Services L.L.C.",
  legalName: "Haji Ahli Building Cleaning Services LLC",
  phone: "+971 50 436 3875",
  email: "enquiry@hajiahliclean.com",
  trn: "100321015800003",
  cancelHours: 5,
  rescheduleHours: 4,
};

const VAT_RATE = 0.05;

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const prettyDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

/** Prices are stored VAT-exclusive; customers are always shown the inclusive figure. */
const money = (amount: number | null, currency: string | null): string | null => {
  if (amount === null || amount === undefined) return null;
  const inc = Math.round(amount * (1 + VAT_RATE) * 100) / 100;
  const fmt = (n: number) =>
    `${currency ?? "AED"} ${n.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;
  return `${fmt(inc)} (incl. ${VAT_RATE * 100}% VAT · ${fmt(amount)} before VAT)`;
};

const addOnList = (addOns: NotificationPayload["addOns"]): string | null => {
  if (!Array.isArray(addOns) || addOns.length === 0) return null;
  return addOns
    .map((a) => (a?.quantity ? `${a.name} ×${a.quantity}` : a?.name))
    .filter(Boolean)
    .join(", ");
};

/** Label/value rows, skipping anything we do not actually know. */
function rows(pairs: Array<[string, string | null]>): { html: string; text: string } {
  const present = pairs.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return {
    html: present
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#5b6b60;font-size:14px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:#12211a">${esc(v)}</td></tr>`,
      )
      .join(""),
    text: present.map(([k, v]) => `${k}: ${v}`).join("\n"),
  };
}

function shell(heading: string, lead: string, body: string, footNote?: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f2ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ed;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#0f2c1e;padding:28px 32px">
    <div style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:-0.01em">${esc(heading)}</div>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#12211a">${lead}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${body}</table>
    ${footNote ? `<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#5b6b60">${footNote}</p>` : ""}
  </td></tr>
  <tr><td style="padding:20px 32px;border-top:1px solid #e6e3dc;font-size:12px;line-height:1.6;color:#78877c">
    ${esc(COMPANY.name)}<br>
    ${esc(COMPANY.phone)} · ${esc(COMPANY.email)}<br>
    TRN ${esc(COMPANY.trn)}
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

const footer = `\n\n—\n${COMPANY.name}\n${COMPANY.phone} · ${COMPANY.email}\nTRN ${COMPANY.trn}`;

/** Booking detail shared by every customer-facing template. */
function bookingRows(p: NotificationPayload) {
  return rows([
    ["Reference", p.reference],
    ["Service", p.serviceName],
    ["Date", prettyDate(p.date)],
    ["Arrival", p.requestedStart ? p.requestedStart.slice(0, 5) : p.timeSlot],
    /*
     * No estimated duration or crew size. The figures behind them are still
     * being reconciled — the pricing sheet and the duration calibration
     * disagree about the same job — and a customer who is emailed "about 3
     * hours" will hold us to it. The arrival window is the commitment we make;
     * how long the visit runs is confirmed on the day.
     */
    ["Property", [p.propertySize, p.furnishing].filter(Boolean).join(" · ") || p.propertyType],
    ["Extras", addOnList(p.addOns)],
    ["Price", money(p.priceAmount, p.priceCurrency)],
  ]);
}

/**
 * Renders one outbox row, or null when this channel has no template for the
 * event/audience pair — the drainer marks those 'skipped' rather than failing.
 */
export function render(event: string, audience: string, p: NotificationPayload): Rendered | null {
  const ref = p.reference ?? "—";
  const name = (p.customerName ?? "there").split(" ")[0];

  // ── staff: a new booking has come in ────────────────────────────────────
  if (event === "booking_created" && audience === "staff") {
    const r = rows([
      ["Reference", p.reference],
      ["Customer", p.customerName],
      ["Phone", p.phone],
      ["Email", p.email],
      ["Service", p.serviceName],
      ["Service ID", p.serviceId],
      ["Property", [p.propertySize, p.furnishing].filter(Boolean).join(" · ") || p.propertyType],
      ["Emirate", p.emirate],
      ["Address", p.address],
      ["Date", prettyDate(p.date)],
      ["Arrival", p.requestedStart ? p.requestedStart.slice(0, 5) : p.timeSlot],
      ["Extras", addOnList(p.addOns)],
      ["Price", money(p.priceAmount, p.priceCurrency)],
      ["Notes", p.notes],
    ]);
    return {
      subject: `New booking ${ref} — ${p.serviceName ?? "service"} on ${prettyDate(p.date)}`,
      html: shell(
        `New booking · ${esc(ref)}`,
        "A new booking request came in through the website. Confirm it in the dashboard — that emails the customer their confirmation and releases the job to the crew.",
        r.html,
        "Open the dashboard to confirm or cancel this booking.",
      ),
      text: `New booking ${ref}\n\nConfirm it in the dashboard — that emails the customer their confirmation and releases the job to the crew.\n\n${r.text}${footer}`,
    };
  }

  // ── customer: we have confirmed the visit ───────────────────────────────
  if (event === "booking_confirmed" && audience === "customer") {
    const r = bookingRows(p);
    return {
      subject: `Booking confirmed — ${ref}`,
      html: shell(
        "Your booking is confirmed",
        `Thanks ${esc(name)} — your visit is booked and our crew is scheduled. Here are the details.`,
        r.html,
        `Need to change it? Call or WhatsApp <strong>${esc(COMPANY.phone)}</strong> quoting ${esc(ref)}. Free cancellation up to ${COMPANY.cancelHours} hours before, free rescheduling up to ${COMPANY.rescheduleHours} hours before.`,
      ),
      text: `Your booking is confirmed\n\nThanks ${name} — your visit is booked.\n\n${r.text}\n\nNeed to change it? Call or WhatsApp ${COMPANY.phone} quoting ${ref}. Free cancellation up to ${COMPANY.cancelHours} hours before, free rescheduling up to ${COMPANY.rescheduleHours} hours before.${footer}`,
    };
  }

  // ── customer: the job is done ───────────────────────────────────────────
  if (event === "booking_status_changed" && audience === "customer" && p.status === "completed") {
    const r = rows([
      ["Reference", p.reference],
      ["Service", p.serviceName],
      ["Date", prettyDate(p.date)],
      ["Extras", addOnList(p.addOns)],
      ["Price", money(p.priceAmount, p.priceCurrency)],
    ]);
    return {
      subject: `Work completed — ${ref}`,
      html: shell(
        "Thank you",
        `Thanks ${esc(name)} — the work is complete. Here is a summary for your records.`,
        r.html,
        `If anything is not right, tell us within 24 hours on <strong>${esc(COMPANY.phone)}</strong> and we will come back and put it right at no charge. Pest treatments are covered for three months.`,
      ),
      text: `Thank you\n\nThanks ${name} — the work is complete.\n\n${r.text}\n\nIf anything is not right, tell us within 24 hours on ${COMPANY.phone} and we will put it right at no charge.${footer}`,
    };
  }

  // ── cancellation ────────────────────────────────────────────────────────
  if (event === "booking_cancelled") {
    const r = rows([
      ["Reference", p.reference],
      ["Service", p.serviceName],
      ["Was scheduled", prettyDate(p.date)],
      ...(audience === "staff"
        ? ([
            ["Customer", p.customerName],
            ["Phone", p.phone],
          ] as Array<[string, string | null]>)
        : []),
    ]);

    if (audience === "staff") {
      return {
        subject: `Booking cancelled — ${ref}`,
        html: shell(`Booking cancelled · ${esc(ref)}`, "A booking has been cancelled.", r.html),
        text: `Booking cancelled ${ref}\n\n${r.text}${footer}`,
      };
    }

    return {
      subject: `Booking cancelled — ${ref}`,
      html: shell(
        "Your booking has been cancelled",
        `${esc(name)}, your booking has been cancelled and no crew will attend. Nothing further is owed unless we have already told you otherwise.`,
        r.html,
        `Booked by mistake, or want another date? Call or WhatsApp <strong>${esc(COMPANY.phone)}</strong> and we will sort it out.`,
      ),
      text: `Your booking has been cancelled\n\n${name}, your booking has been cancelled and no crew will attend.\n\n${r.text}\n\nWant another date? Call or WhatsApp ${COMPANY.phone}.${footer}`,
    };
  }

  return null;
}
