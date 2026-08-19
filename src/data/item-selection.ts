import { formatAed, resolveUnitPrice, unitRowsFor } from "./pricing";

/**
 * Multi-item selection for services sold by the piece.
 *
 * A customer with a two-seater and a four-seater is booking one visit for two
 * sofas, not two visits. The same is true of carpets, mattresses and water
 * tanks. Forcing a single choice meant they either booked twice or picked the
 * nearest size and argued about it on the day.
 *
 * Not every unit-priced service works this way. Window cleaning and curtain
 * steaming are priced in *bands* — "1–3 windows", "3 Bedroom Villa" — where the
 * variant describes the whole job and picking two would be meaningless.
 */

/** label -> quantity. Absent or zero means not selected. */
export type ItemSelection = Record<string, number>;

/**
 * Units that describe a countable object rather than a band covering the job.
 *
 * Read off the workbook's own unit column, so adding a service priced "Per
 * sofa" picks up multi-select without a code change.
 */
const COUNTABLE_UNITS = ["per sofa", "per mattress", "per tank", "per sq.m", "per balcony"];

/** Whether this service is sold by the piece, so several may be chosen. */
export function allowsMultipleItems(serviceId: string): boolean {
  const rows = unitRowsFor(serviceId).filter((r) => r.priceExVat !== null);
  if (rows.length === 0) return false;
  const unit = (rows[0]?.unit ?? "").trim().toLowerCase();
  return COUNTABLE_UNITS.includes(unit);
}

/** Most anyone can add of one size before we would rather talk to them. */
export const MAX_PER_ITEM = 10;

// ── URL encoding ────────────────────────────────────────────────────────────

/*
 * `;` between items and `:` between label and quantity.
 *
 * Comma is unusable as a separator: one real variant is "1,000 gal - Rooftop".
 * Neither `;` nor `:` appears in any label in the workbook, and both survive
 * URL encoding legibly, so the parameter stays readable to a coordinator
 * opening the link.
 */
const ITEM_SEP = ";";
const QTY_SEP = ":";

export function encodeItems(items: ItemSelection): string {
  return Object.entries(items)
    .filter(([, qty]) => qty > 0)
    .map(([label, qty]) => `${label}${QTY_SEP}${qty}`)
    .join(ITEM_SEP);
}

/**
 * Reads a selection back out of the URL, keeping only what the service really
 * sells.
 *
 * Every label is checked against the catalogue and every quantity is bounded.
 * A hand-edited link degrades to fewer items or none, never to a price for
 * something we do not offer.
 */
export function decodeItems(raw: string | undefined, serviceId: string): ItemSelection {
  if (!raw) return {};
  const valid = new Set(
    unitRowsFor(serviceId)
      .filter((r) => r.priceExVat !== null)
      .map((r) => r.label),
  );

  const out: ItemSelection = {};
  for (const part of raw.split(ITEM_SEP)) {
    const at = part.lastIndexOf(QTY_SEP);
    if (at < 1) continue;
    const label = part.slice(0, at);
    const qty = Number(part.slice(at + 1));
    if (!valid.has(label)) continue;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_PER_ITEM) continue;
    out[label] = qty;
  }
  return out;
}

// ── pricing ─────────────────────────────────────────────────────────────────

export type ItemLine = {
  label: string;
  quantity: number;
  /** AED excluding VAT, for one of them. */
  unitPrice: number;
  /** AED excluding VAT, for the quantity chosen. */
  lineTotal: number;
};

/** One line per chosen size, in the order the catalogue lists them. */
export function itemLines(serviceId: string, items: ItemSelection): ItemLine[] {
  return unitRowsFor(serviceId)
    .filter((r) => r.priceExVat !== null && (items[r.label] ?? 0) > 0)
    .map((r) => {
      const quantity = items[r.label] as number;
      const unitPrice = resolveUnitPrice(serviceId, r.label)?.exclusive ?? 0;
      return { label: r.label, quantity, unitPrice, lineTotal: unitPrice * quantity };
    });
}

/** Total excluding VAT, before the minimum booking value is applied. */
export function itemsSubtotal(serviceId: string, items: ItemSelection): number {
  return itemLines(serviceId, items).reduce((sum, l) => sum + l.lineTotal, 0);
}

/** How many pieces are in the basket, across all sizes. */
export const itemCount = (items: ItemSelection): number =>
  Object.values(items).reduce((n, q) => n + (q > 0 ? q : 0), 0);

/**
 * One line of prose for the booking record and the crew's job sheet.
 *
 * "2 × 3 Seater, 1 × Recliner" tells a supervisor what to load the van with;
 * a total does not.
 */
export function itemsSummary(serviceId: string, items: ItemSelection): string | null {
  const lines = itemLines(serviceId, items);
  if (lines.length === 0) return null;
  return lines.map((l) => `${l.quantity} × ${l.label}`).join(", ");
}

/** "2 × 3 Seater — AED 298" for display next to a line. */
export const formatItemLine = (line: ItemLine): string =>
  `${line.quantity} × ${line.label} — ${formatAed(line.lineTotal)}`;
