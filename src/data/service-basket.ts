import type { BookingCategory } from "./booking-categories";
import { servicesInCategory } from "./booking-categories";
import { isVideoQuoted } from "./configured/engine";
import { allowsMultipleItems, type ItemLine } from "./item-selection";
import { minimumBookingValueFor } from "./note-rules";
import { resolveUnitPrice, unitRowsFor, VAT_RATE, type ResolvedPrice } from "./pricing";
import type { Service } from "./types";

/**
 * Several services in one visit.
 *
 * The flow could only ever hold one service. A customer wanting a kitchen and
 * a bathroom, or a sofa and a mattress, had to book twice — two references,
 * two arrival windows, two crews dispatched to the same address on different
 * days, and the minimum booking value charged twice.
 *
 * The basket is a flat list of lines. A line is a service, the variant chosen
 * within it, and how many. That is deliberately the same shape the item basket
 * and the add-on selection already use, so the breakdown component renders all
 * three without knowing which is which.
 *
 * Not every category should offer this, and which ones do is derived rather
 * than listed — see `supportsMultiService`.
 */

export type BasketLine = {
  serviceId: string;
  /** e.g. "3 Seater", "Queen". Null for services quoted per room from a video. */
  variant: string | null;
  quantity: number;
};

/** Ordered, because one service can appear more than once at different sizes. */
export type ServiceBasket = BasketLine[];

/** Most of any one line before we would rather talk to the customer. */
export const MAX_PER_LINE = 10;

/** A ceiling on the whole basket, so a hand-edited URL cannot build a novel. */
export const MAX_LINES = 20;

// ── which services and categories qualify ───────────────────────────────────

/**
 * Whether a service can sit in a basket alongside others.
 *
 * Two shapes qualify, and both describe a countable thing rather than a whole
 * job. Services sold by the piece — sofas, carpets, mattresses — and services
 * quoted per room from a video, where the count is how many kitchens,
 * bathrooms or balconies.
 *
 * Band-priced services are excluded on purpose. Window cleaning is sold as
 * "1–3 windows" and marble as a job; two of those bands together means
 * nothing, so they stay a single choice.
 */
export const isBasketable = (serviceId: string): boolean =>
  allowsMultipleItems(serviceId) || isVideoQuoted(serviceId);

/**
 * Whether a category should offer a basket instead of one service at a time.
 *
 * Derived from the catalogue, not from a list of slugs: a category qualifies
 * when at least two of its services are individually countable. That picks up
 * single rooms (kitchen, bathroom, balcony) and soft furnishings (sofa,
 * carpet, mattress) without either being named here, and a new service that
 * belongs in a basket joins one without a code change.
 *
 * Tiered categories are excluded whatever else is true. Deep and Intense are
 * two grades of the same clean — a customer picks one, and offering "add both"
 * would sell the same work twice. Intense is already reachable from Deep as
 * an add-on, which is the honest way to express an upgrade.
 */
export function supportsMultiService(category: BookingCategory): boolean {
  if (category.tiered) return false;
  return servicesInCategory(category).filter((s) => isBasketable(s.id)).length > 1;
}

/** The services in a category that can go in its basket, in catalogue order. */
export const basketableServices = (category: BookingCategory): Service[] =>
  servicesInCategory(category).filter((s) => isBasketable(s.id));

/**
 * The sizes a basketable service is sold in.
 *
 * Empty for a per-room video quote: there is nothing to choose, only a count.
 * The test is on the video quote itself, not on whether the workbook happens
 * to list rows — balcony carries a single priced row, and offering it as a
 * one-item size list asked the customer to choose between one option.
 */
export const variantsFor = (serviceId: string): string[] =>
  isVideoQuoted(serviceId)
    ? []
    : unitRowsFor(serviceId)
        .filter((r) => r.priceExVat !== null)
        .map((r) => r.label);

// ── URL encoding ────────────────────────────────────────────────────────────

/*
 * `;` between lines and `:` between service, variant and quantity — the same
 * convention as the item basket and the add-on selection, so a coordinator
 * opening a booking link reads one format rather than three.
 *
 * A line with no variant encodes its empty middle field ("SVC-104::1") rather
 * than collapsing, because the parser reads by position.
 */
const LINE_SEP = ";";
const FIELD_SEP = ":";

export function encodeBasket(basket: ServiceBasket): string {
  return basket
    .filter((l) => l.quantity > 0)
    .map((l) => [l.serviceId, l.variant ?? "", String(l.quantity)].join(FIELD_SEP))
    .join(LINE_SEP);
}

/**
 * Reads a basket back out of the URL, keeping only what this category sells.
 *
 * Every service id is checked against the category, every variant against the
 * workbook rows for that service, and every quantity is bounded. A line whose
 * variant is unrecognised is dropped rather than repaired: unlike an add-on,
 * where falling back to the first size is harmless, silently changing which
 * sofa someone booked would be worse than losing the line.
 */
export function decodeBasket(raw: string | undefined, services: Service[]): ServiceBasket {
  if (!raw) return [];
  const allowed = new Set(services.filter((s) => isBasketable(s.id)).map((s) => s.id));

  const out: ServiceBasket = [];
  for (const part of raw.split(LINE_SEP)) {
    if (out.length >= MAX_LINES) break;
    const [serviceId, rawVariant, rawQty] = part.split(FIELD_SEP);
    if (!serviceId || !allowed.has(serviceId)) continue;

    const variants = variantsFor(serviceId);
    let variant: string | null = null;
    if (variants.length > 0) {
      if (!rawVariant || !variants.includes(rawVariant)) continue;
      variant = rawVariant;
    }

    const qty = Number(rawQty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_PER_LINE) continue;

    /* Same service and size twice in one URL is one line, not two. */
    const existing = out.find((l) => l.serviceId === serviceId && l.variant === variant);
    if (existing) existing.quantity = Math.min(existing.quantity + qty, MAX_PER_LINE);
    else out.push({ serviceId, variant, quantity: qty });
  }
  return out;
}

// ── reading a basket ────────────────────────────────────────────────────────

/** How many pieces are in the basket, across every service. */
export const basketCount = (basket: ServiceBasket): number =>
  basket.reduce((n, l) => n + (l.quantity > 0 ? l.quantity : 0), 0);

/** The quantity currently held for one service and size. */
export const quantityOf = (
  basket: ServiceBasket,
  serviceId: string,
  variant: string | null,
): number => basket.find((l) => l.serviceId === serviceId && l.variant === variant)?.quantity ?? 0;

/**
 * Sets a quantity, adding, updating or removing the line as needed.
 *
 * Returns a new basket — the callers are React state setters.
 */
export function setQuantity(
  basket: ServiceBasket,
  serviceId: string,
  variant: string | null,
  quantity: number,
): ServiceBasket {
  const clamped = Math.max(0, Math.min(quantity, MAX_PER_LINE));
  const without = basket.filter((l) => !(l.serviceId === serviceId && l.variant === variant));
  if (clamped === 0) return without;

  const existing = basket.find((l) => l.serviceId === serviceId && l.variant === variant);
  const line: BasketLine = { serviceId, variant, quantity: clamped };
  /* Keep an existing line where it was; a new one goes on the end. */
  return existing
    ? basket.map((l) => (l.serviceId === serviceId && l.variant === variant ? line : l))
    : [...without, line];
}

// ── pricing ─────────────────────────────────────────────────────────────────

/** Lines we can put a figure on, in basket order. */
export function pricedLines(basket: ServiceBasket, services: Service[]): ItemLine[] {
  const byId = new Map(services.map((s) => [s.id, s]));
  return basket.flatMap((line) => {
    if (!line.variant) return [];
    const unit = resolveUnitPrice(line.serviceId, line.variant);
    if (!unit) return [];
    const service = byId.get(line.serviceId);
    return [
      {
        label: `${service?.name ?? line.serviceId} — ${line.variant}`,
        quantity: line.quantity,
        unitPrice: unit.exclusive,
        lineTotal: unit.exclusive * line.quantity,
      },
    ];
  });
}

/**
 * Lines that have to be quoted rather than priced — the rooms we price from a
 * video. Returned rather than dropped, so the total can say what it excludes.
 */
export const quotedBasketLines = (basket: ServiceBasket): ServiceBasket =>
  basket.filter((l) => isVideoQuoted(l.serviceId));

/** True where nothing in the basket can be given a firm price online. */
export const basketNeedsQuote = (basket: ServiceBasket): boolean =>
  quotedBasketLines(basket).length > 0;

/** Total of the priced lines, excluding VAT and before the minimum. */
export const basketSubtotal = (basket: ServiceBasket, services: Service[]): number =>
  pricedLines(basket, services).reduce((sum, l) => sum + l.lineTotal, 0);

/**
 * The minimum booking value for a mixed basket.
 *
 * The workbook sets one floor per service — 149 generally, 129 for sofa work.
 * With several services in one visit the lowest of them applies: the floor
 * exists to make a call-out worth sending a crew for, and a customer who has
 * qualified for the lower one by including sofa work should not lose it by
 * adding a mattress to the same visit.
 */
export function basketMinimum(basket: ServiceBasket): number {
  const floors = [...new Set(basket.map((l) => l.serviceId))].map(minimumBookingValueFor);
  return floors.length > 0 ? Math.min(...floors) : minimumBookingValueFor(null);
}

/**
 * What the basket costs, with VAT and the minimum booking value applied once
 * to the whole order.
 *
 * Null when nothing in it is priced — a basket of rooms awaiting a video quote
 * has a real total, but not one this site can state.
 */
export function basketPrice(basket: ServiceBasket, services: Service[]): ResolvedPrice | null {
  const subtotal = basketSubtotal(basket, services);
  if (subtotal <= 0) return null;

  const floor = basketMinimum(basket);
  const lifted = subtotal < floor;
  const exclusive = lifted ? floor : subtotal;
  const vat = Math.round(exclusive * VAT_RATE * 100) / 100;
  return {
    exclusive,
    vat,
    inclusive: Math.round((exclusive + vat) * 100) / 100,
    currency: "AED",
    variantId: basket.map((l) => [l.serviceId, l.variant, l.quantity].join("/")).join("+"),
    isTotal: true,
    unitLabel: null,
    liftedToMinimum: lifted,
  };
}

/**
 * One line of prose for the booking record and the crew's job sheet.
 *
 * "2 × 3 Seater (Sofa Deep Cleaning & Shampoo), 1 × Kitchen Intense Deep
 * Cleaning" tells a supervisor what to load the van with; a total does not.
 */
export function basketSummary(basket: ServiceBasket, services: Service[]): string | null {
  if (basket.length === 0) return null;
  const byId = new Map(services.map((s) => [s.id, s]));
  return basket
    .map((l) => {
      const name = byId.get(l.serviceId)?.name ?? l.serviceId;
      return l.variant ? `${l.quantity} × ${l.variant} (${name})` : `${l.quantity} × ${name}`;
    })
    .join(", ");
}

/** The service a multi-service booking is filed under: the largest line. */
export function primaryService(basket: ServiceBasket, services: Service[]): Service | null {
  if (basket.length === 0) return null;
  const byId = new Map(services.map((s) => [s.id, s]));
  let best: { id: string; value: number } | null = null;
  for (const line of basket) {
    const unit = line.variant ? resolveUnitPrice(line.serviceId, line.variant) : null;
    const value = (unit?.exclusive ?? 0) * line.quantity;
    if (!best || value > best.value) best = { id: line.serviceId, value };
  }
  return (best && byId.get(best.id)) ?? byId.get(basket[0]?.serviceId ?? "") ?? null;
}
