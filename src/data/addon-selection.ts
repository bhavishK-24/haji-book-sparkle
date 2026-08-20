import type { ItemLine } from "./item-selection";
import { ADD_ON_DISCOUNTS, INTENSE_UPGRADE } from "./note-rules";
import {
  addOnRowsFor,
  resolveAddOnPrice,
  resolveDiscountedAddOn,
  resolveIntenseUpgrade,
  unitRowsFor,
  type ResolvedPrice,
} from "./pricing";
import type { AddOn } from "./types";

/**
 * What the customer chose on the extras step, and what it costs.
 *
 * The add-on prices were in the workbook and in `pricing.ts` the whole time —
 * `resolveAddOnPrice`, `resolveDiscountedAddOn` and `resolveIntenseUpgrade`
 * were written and never called. The extras page listed names with no figures,
 * asked for no quantity, and dropped the selection at the next step, so a
 * customer who added a fridge clean and two sofas was quoted for neither.
 *
 * This module is the missing half: it prices a selection, encodes it into the
 * URL alongside the rest of the booking state, and reads it back validated.
 *
 * Deliberately imports only from `pricing`, `note-rules` and `types`. Callers
 * pass in the offered add-ons rather than having this reach into `data/index`,
 * which already imports from `pricing` — routing it through here would close a
 * cycle.
 */

/** One add-on as chosen: which variant, and how many. */
export type AddOnChoice = {
  /** e.g. "Queen", "3 Seater". Null where the add-on has a single price. */
  variant: string | null;
  quantity: number;
};

/** Keyed by add-on id, e.g. "ADD-04". */
export type AddOnSelection = Record<string, AddOnChoice>;

/**
 * What an add-on may need to know about the booking it attaches to.
 *
 * Only the Intense upgrade uses it: the workbook prices that as the gap
 * between Deep and Intense for the customer's own property, so without the
 * property type there is no number to show.
 */
export type AddOnContext = {
  size?: string | null;
  furnishing?: string | null;
};

/** Most of one extra anyone can add before we would rather talk to them. */
export const MAX_PER_ADDON = 10;

/**
 * The variants an add-on is priced for.
 *
 * Two shapes in the workbook. Mattress shampooing carries its own four rows
 * (Single/Double/Queen/King). Sofa and carpet shampooing carry none, because
 * the sheet prices them as "the standalone service, 10 dhs lower" — so their
 * variants are the standalone service's own sizes.
 *
 * The `length > 1` test matters: a single-row add-on like the refrigerator
 * clean has a unit ("Per appliance") but not a choice, and treating that unit
 * as a variant would ask the customer to pick "Per appliance" from a list of
 * one.
 */
export function addOnVariantsFor(addOnId: string): string[] {
  const priced = addOnRowsFor(addOnId).filter((r) => r.priceExVat !== null && r.unit);
  if (priced.length > 1) return priced.map((r) => r.unit as string);

  const discount = ADD_ON_DISCOUNTS[addOnId];
  if (!discount) return [];
  return unitRowsFor(discount.fromServiceId)
    .filter((r) => r.priceExVat !== null)
    .map((r) => r.label);
}

/** Whether the customer should be asked how many. */
export const addOnTakesQuantity = (addOn: AddOn): boolean =>
  addOn.quantityInput !== null && addOnVariantsFor(addOn.id).length > 0;

/**
 * What one of an add-on costs, excluding VAT.
 *
 * Three pricing routes, in the order the workbook defines them: the Intense
 * upgrade is computed from the property, the discounted add-ons are derived
 * from their standalone service, and everything else has a row of its own.
 */
export function addOnUnitPrice(
  addOnId: string,
  variant: string | null,
  ctx: AddOnContext = {},
): ResolvedPrice | null {
  if (addOnId === INTENSE_UPGRADE.addOnId) {
    return ctx.size ? resolveIntenseUpgrade(ctx.size, ctx.furnishing ?? null) : null;
  }
  if (ADD_ON_DISCOUNTS[addOnId]) {
    return variant ? resolveDiscountedAddOn(addOnId, variant) : null;
  }
  return resolveAddOnPrice(addOnId, variant);
}

/** The cheapest variant, for the "from AED x" shown before anything is chosen. */
export function addOnFromPrice(addOnId: string, ctx: AddOnContext = {}): ResolvedPrice | null {
  const variants = addOnVariantsFor(addOnId);
  if (variants.length === 0) return addOnUnitPrice(addOnId, null, ctx);

  let cheapest: ResolvedPrice | null = null;
  for (const v of variants) {
    const p = addOnUnitPrice(addOnId, v, ctx);
    if (p && (!cheapest || p.exclusive < cheapest.exclusive)) cheapest = p;
  }
  return cheapest;
}

/** True where we list the add-on but cannot put a number on it. */
export const addOnIsQuoted = (addOnId: string, ctx: AddOnContext = {}): boolean =>
  addOnFromPrice(addOnId, ctx) === null;

// ── URL encoding ────────────────────────────────────────────────────────────

/*
 * `;` between add-ons and `:` between id, variant and quantity — the same
 * convention as the item basket, so a coordinator opening a booking link reads
 * one format rather than two.
 *
 * The decoder also accepts `,` because that is what the parameter used to hold
 * when it was a bare list of ids, and a link already sent to a customer should
 * not stop working.
 */
const ADDON_SEP = ";";
const FIELD_SEP = ":";

export function encodeAddOns(selection: AddOnSelection): string {
  return Object.entries(selection)
    .filter(([, c]) => c.quantity > 0)
    .map(([id, c]) =>
      /* Short form where there is nothing to say beyond "yes, this one". */
      c.variant === null && c.quantity === 1
        ? id
        : [id, c.variant ?? "", String(c.quantity)].join(FIELD_SEP),
    )
    .join(ADDON_SEP);
}

/**
 * Reads a selection back out of the URL, keeping only what this service offers.
 *
 * Everything is checked against the catalogue: unknown ids are dropped, an
 * unrecognised variant falls back to the first the workbook prices, and
 * quantities are bounded. A hand-edited link can produce a smaller booking,
 * never a price for something we do not sell.
 */
export function decodeAddOns(raw: string | undefined, offered: AddOn[]): AddOnSelection {
  if (!raw) return {};
  const byId = new Map(offered.map((a) => [a.id, a]));

  const out: AddOnSelection = {};
  for (const part of raw.split(/[;,]/)) {
    const [id, rawVariant, rawQty] = part.split(FIELD_SEP);
    if (!id) continue;
    const addOn = byId.get(id);
    if (!addOn) continue;

    const variants = addOnVariantsFor(id);
    const variant =
      variants.length === 0
        ? null
        : rawVariant && variants.includes(rawVariant)
          ? rawVariant
          : (variants[0] ?? null);

    let quantity = 1;
    if (addOnTakesQuantity(addOn) && rawQty) {
      const n = Number(rawQty);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_PER_ADDON) quantity = n;
    }

    out[id] = { variant, quantity };
  }
  return out;
}

// ── pricing a whole selection ───────────────────────────────────────────────

/**
 * One priced line per chosen extra, in the order the service offers them.
 *
 * Shares `ItemLine` with the item basket so the breakdown component renders
 * both without knowing which is which.
 */
export function addOnLines(
  offered: AddOn[],
  selection: AddOnSelection,
  ctx: AddOnContext = {},
): ItemLine[] {
  return offered.flatMap((addOn) => {
    const choice = selection[addOn.id];
    if (!choice) return [];
    const unit = addOnUnitPrice(addOn.id, choice.variant, ctx);
    if (!unit) return [];
    return [
      {
        label: choice.variant ? `${addOn.name} — ${choice.variant}` : addOn.name,
        quantity: choice.quantity,
        unitPrice: unit.exclusive,
        lineTotal: unit.exclusive * choice.quantity,
      },
    ];
  });
}

/** Total for the extras, excluding VAT. */
export const addOnsSubtotal = (
  offered: AddOn[],
  selection: AddOnSelection,
  ctx: AddOnContext = {},
): number => addOnLines(offered, selection, ctx).reduce((sum, l) => sum + l.lineTotal, 0);

/**
 * Chosen extras we cannot price — curtain cleaning is quoted per job.
 *
 * Returned rather than silently dropped: the total has to say that it does not
 * cover them, or the customer reads a figure that is about to change.
 */
export const unpricedAddOns = (
  offered: AddOn[],
  selection: AddOnSelection,
  ctx: AddOnContext = {},
): AddOn[] =>
  offered.filter(
    (a) => selection[a.id] && addOnUnitPrice(a.id, selection[a.id]?.variant ?? null, ctx) === null,
  );

/** "1 × Oven Interior Cleaning, 2 × Sofa Shampooing — 3 Seater" for the job sheet. */
export function addOnsSummary(
  offered: AddOn[],
  selection: AddOnSelection,
  ctx: AddOnContext = {},
): string | null {
  const named = offered
    .filter((a) => selection[a.id])
    .map((a) => {
      const choice = selection[a.id] as AddOnChoice;
      const label = choice.variant ? `${a.name} — ${choice.variant}` : a.name;
      return `${choice.quantity} × ${label}`;
    });
  return named.length > 0 ? named.join(", ") : null;
}
