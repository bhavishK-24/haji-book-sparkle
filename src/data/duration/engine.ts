import { ADD_ON_DURATIONS, DURATION_MODELS } from "./calibration";
import { isKnown } from "./types";
import type { AddOnDurationModel, Crew, DurationModel, EstimateResult, Minutes } from "./types";

export * from "./types";
export { DURATION_MODELS, ADD_ON_DURATIONS };

/**
 * Duration estimation.
 *
 * The engine is complete; the numbers are not. Every figure it needs comes
 * from `calibration.ts`, and any figure still marked `tbd` causes the estimate
 * to fail with a precise list of what is missing rather than a plausible-
 * looking guess. That distinction matters: a wrong duration means a crew
 * double-booked or a customer waiting three hours past their slot.
 */

const MODEL_BY_SERVICE = new Map(DURATION_MODELS.map((m) => [m.serviceId, m]));
const ADDON_BY_ID = new Map(ADD_ON_DURATIONS.map((a) => [a.addOnId, a]));

export const getDurationModel = (serviceId: string): DurationModel | undefined =>
  MODEL_BY_SERVICE.get(serviceId);

export const getAddOnDuration = (addOnId: string): AddOnDurationModel | undefined =>
  ADDON_BY_ID.get(addOnId);

/** What the customer has told us, as far as they have told us. */
export type EstimateInput = {
  serviceId: string;
  /** e.g. "3 Bedroom Apartment" — must match a Variant_Attribute_1 value. */
  propertySize?: string | null;
  /** e.g. "Furnished". */
  furnishing?: string | null;
  /** Countable driver for per-unit services (seats, mattresses, panels…). */
  quantity?: number | null;
  /** Square metres for per-area services. */
  squareMetres?: number | null;
  /** Selected add-ons and how many of each, where they scale. */
  addOns?: Array<{ id: string; quantity?: number | null }>;
};

/**
 * True when every figure this service needs has been supplied.
 * Cheap enough to call in a render to decide whether to show an estimate.
 */
export function canEstimate(serviceId: string): boolean {
  const model = MODEL_BY_SERVICE.get(serviceId);
  if (!model) return false;
  return missingFor(model).length === 0;
}

/** The calibration gaps for one service, in plain language. */
export function missingFor(model: DurationModel): string[] {
  const gaps: string[] = [];
  const need = (label: string, m: { status: string; needs?: string }) => {
    if (m.status === "tbd") gaps.push(`${model.serviceId} · ${label}: ${m.needs ?? ""}`.trim());
  };

  // Per-size crew supersedes baseCrew where the size is known, so a missing
  // baseCrew is only a gap when there is no per-size figure either.
  if (Object.keys(model.perDriverCrew).length === 0) need("base crew", model.baseCrew);
  for (const [key, value] of Object.entries(model.perDriverCrew)) {
    need(`crew for "${key}"`, value);
  }
  need("base duration", model.baseMinutes);
  need("minimum duration", model.minMinutes);
  need("maximum duration", model.maxMinutes);
  need("tolerance", model.toleranceFraction);

  for (const [key, value] of Object.entries(model.perDriverMinutes)) {
    need(`duration for "${key}"`, value);
  }
  for (const [key, value] of Object.entries(model.secondaryMultiplier)) {
    need(`multiplier for "${key}"`, value);
  }
  if (model.basis === "per-unit" || model.basis === "per-area") {
    need("per-unit duration", model.perUnitMinutes);
  }
  return gaps;
}

/**
 * The gaps that block *this particular* estimate.
 *
 * Distinct from `missingFor`, which audits the whole model. A customer asking
 * about a studio should get an answer even though the 4-bedroom figure is
 * still outstanding — only the values this calculation actually reads matter.
 */
export function missingForInput(model: DurationModel, input: EstimateInput): string[] {
  const gaps: string[] = [];
  const need = (label: string, m: { status: string; needs?: string }) => {
    if (m.status === "tbd") gaps.push(`${model.serviceId} · ${label}: ${m.needs ?? ""}`.trim());
  };

  need("base duration", model.baseMinutes);
  need("minimum duration", model.minMinutes);
  need("maximum duration", model.maxMinutes);
  need("tolerance", model.toleranceFraction);

  // Crew: the per-size figure if there is one, otherwise the fallback.
  const sizeCrew = input.propertySize ? model.perDriverCrew[input.propertySize] : undefined;
  if (sizeCrew) need(`crew for "${input.propertySize}"`, sizeCrew);
  else need("base crew", model.baseCrew);

  // Only the selected size's duration is required.
  if (model.basis === "per-property") {
    if (!input.propertySize) {
      gaps.push(`${model.serviceId} · no property size supplied`);
    } else {
      const entry = model.perDriverMinutes[input.propertySize];
      if (!entry) gaps.push(`${model.serviceId} · no figure for "${input.propertySize}"`);
      else need(`duration for "${input.propertySize}"`, entry);
    }
  }

  if (input.furnishing) {
    const mult = model.secondaryMultiplier[input.furnishing];
    if (mult) need(`multiplier for "${input.furnishing}"`, mult);
  }

  if (model.basis === "per-unit" || model.basis === "per-area") {
    need("per-unit duration", model.perUnitMinutes);
  }
  return gaps;
}

/** Every gap across every modelled service and add-on. */
export function allMissing(): { services: string[]; addOns: string[] } {
  const services = DURATION_MODELS.flatMap(missingFor);
  const addOns: string[] = [];
  for (const a of ADD_ON_DURATIONS) {
    if (a.flatMinutes.status === "tbd") {
      addOns.push(`${a.addOnId} · minutes added: ${a.flatMinutes.needs}`);
    }
    if (a.scalesWith !== "none" && a.perUnitMinutes.status === "tbd") {
      addOns.push(`${a.addOnId} · per-unit minutes: ${a.perUnitMinutes.needs}`);
    }
    if (a.extraCrew.status === "tbd") {
      addOns.push(`${a.addOnId} · extra crew: ${a.extraCrew.needs}`);
    }
  }
  return { services, addOns };
}

/**
 * Round to a schedulable granularity. Quarter-hours for anything an hour or
 * longer; 5-minute steps below that, because rounding a 20-minute collection
 * visit to 15 misstates it by a quarter.
 */
const toSchedulable = (m: Minutes) => (m >= 60 ? Math.round(m / 15) * 15 : Math.round(m / 5) * 5);

/**
 * Estimate elapsed duration and crew.
 *
 * Returns `{ ok: false, missing }` whenever any required figure is still
 * `tbd`. It never falls back to a default, because a defaulted duration is
 * indistinguishable from a real one at the call site.
 */
export function estimateDuration(input: EstimateInput): EstimateResult {
  const model = MODEL_BY_SERVICE.get(input.serviceId);
  if (!model) {
    return { ok: false, missing: [`No duration model for ${input.serviceId}`] };
  }

  const missing = missingForInput(model, input);

  // Add-ons contribute too, so their gaps block the estimate as well.
  for (const selected of input.addOns ?? []) {
    const a = ADDON_BY_ID.get(selected.id);
    if (!a) continue;
    if (a.flatMinutes.status === "tbd") missing.push(`${a.addOnId} · ${a.flatMinutes.needs}`);
    if (a.scalesWith !== "none" && a.perUnitMinutes.status === "tbd") {
      missing.push(`${a.addOnId} · ${a.perUnitMinutes.needs}`);
    }
  }

  if (missing.length > 0) return { ok: false, missing };

  // Past this point every value is known, so the assertions are safe.
  const breakdown: Array<{ label: string; minutes: Minutes }> = [];
  let minutes = 0;

  if (isKnown(model.baseMinutes)) {
    minutes += model.baseMinutes.value;
    breakdown.push({ label: "Base visit", minutes: model.baseMinutes.value });
  }

  // Primary driver.
  if (model.basis === "per-property" && input.propertySize) {
    const entry = model.perDriverMinutes[input.propertySize];
    if (entry && isKnown(entry)) {
      minutes += entry.value;
      breakdown.push({ label: input.propertySize, minutes: entry.value });
    }
  } else if (model.basis === "per-unit" && input.quantity && isKnown(model.perUnitMinutes)) {
    // baseMinutes already covers the first unit, so only charge for extras.
    const extras = Math.max(0, input.quantity - 1);
    const add = model.perUnitMinutes.value * extras;
    minutes += add;
    if (add > 0) breakdown.push({ label: ` additional`, minutes: add });
  } else if (model.basis === "per-area" && input.squareMetres && isKnown(model.perUnitMinutes)) {
    const add = model.perUnitMinutes.value * input.squareMetres;
    minutes += add;
    breakdown.push({ label: `${input.squareMetres} m²`, minutes: add });
  }

  // Secondary driver is a multiplier on the work so far.
  if (input.furnishing) {
    const mult = model.secondaryMultiplier[input.furnishing];
    if (mult && isKnown(mult)) {
      const before = minutes;
      minutes *= mult.value;
      breakdown.push({ label: input.furnishing, minutes: minutes - before });
    }
  }

  // Add-ons.
  // Per-size crew wins over the fallback.
  const sizeCrew = input.propertySize ? model.perDriverCrew[input.propertySize] : undefined;
  let crew: Crew =
    sizeCrew && isKnown(sizeCrew)
      ? sizeCrew.value
      : isKnown(model.baseCrew)
        ? model.baseCrew.value
        : 1;
  for (const selected of input.addOns ?? []) {
    const a = ADDON_BY_ID.get(selected.id);
    if (!a) continue;
    let addMinutes = isKnown(a.flatMinutes) ? a.flatMinutes.value : 0;
    if (a.scalesWith !== "none" && selected.quantity && isKnown(a.perUnitMinutes)) {
      addMinutes += a.perUnitMinutes.value * selected.quantity;
    }
    if (addMinutes > 0) {
      minutes += addMinutes;
      breakdown.push({ label: a.addOnName, minutes: addMinutes });
    }
    if (isKnown(a.extraCrew)) crew += a.extraCrew.value;
  }

  // Floor only. The ceiling is NOT applied as a clamp: silently shortening a
  // ten-hour job to eight would double-book the crew and strand the customer.
  // It is reported instead, so the caller can route the job to a survey.
  if (isKnown(model.minMinutes)) minutes = Math.max(minutes, model.minMinutes.value);
  const ceilingValue = isKnown(model.maxMinutes) ? model.maxMinutes.value : Infinity;
  const exceedsOnlineBooking = minutes > ceilingValue;

  const tolerance = isKnown(model.toleranceFraction) ? model.toleranceFraction.value : 0;
  const point = toSchedulable(minutes);
  // Keep the quoted range inside the same floor and ceiling as the estimate —
  // a range whose low end sits under the minimum visit is not a real option.
  const floor = isKnown(model.minMinutes) ? model.minMinutes.value : 0;

  return {
    ok: true,
    minutes: point,
    exceedsOnlineBooking,
    lowMinutes: Math.max(floor, toSchedulable(point * (1 - tolerance))),
    highMinutes: toSchedulable(point * (1 + tolerance)),
    crew,
    breakdown,
  };
}

/** "3–4 hours", "2.5 hours", "45 minutes" — never a false precision. */
export function formatDurationRange(low: Minutes, high: Minutes): string {
  const asHours = (m: Minutes) => {
    const h = m / 60;
    return Number.isInteger(h) ? String(h) : h.toFixed(1).replace(/\.0$/, "");
  };
  if (high < 60) return low === high ? `${high} minutes` : `${low}–${high} minutes`;
  if (low === high) return `${asHours(low)} hours`;
  return `${asHours(low)}–${asHours(high)} hours`;
}
