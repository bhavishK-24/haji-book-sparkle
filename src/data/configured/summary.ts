import { APPLIANCE_OPTIONS, KITCHEN_QUESTIONS } from "./kitchen";
import { BATHROOM_QUESTIONS } from "./bathroom";
import type { BathroomSelection, KitchenSelection } from "./types";

/**
 * The customer's room answers, written out for the crew and the coordinator.
 *
 * The price alone is not enough to run the job: "AED 599" does not tell a
 * supervisor to send someone expecting a year of baked-on grease on a standard
 * kitchen with an oven and hood. This is the operational half of the booking.
 *
 * Uses the customer-facing wording rather than internal band letters, so the
 * office and the customer are describing the same job in the same words if
 * there is ever a dispute about what was booked.
 */

const labelOf = (questionId: string, optionId: string | null): string | null => {
  if (!optionId) return null;
  const all = [...KITCHEN_QUESTIONS, ...BATHROOM_QUESTIONS];
  const question = all.find((q) => q.id === questionId);
  return question?.options.find((o) => o.id === optionId)?.label ?? null;
};

export function kitchenSummary(s: KitchenSelection): string | null {
  if (!s.doorBand && s.appliances.length === 0 && !s.lastCleaned) return null;

  const size = labelOf("doors", s.doorBand);
  const appliances = s.appliances
    .filter((a) => a !== "none")
    .map((a) => APPLIANCE_OPTIONS.find((o) => o.id === a)?.label ?? a);
  const recency = labelOf("lastCleaned", s.lastCleaned);

  return [
    size ? `Kitchen: ${size.toLowerCase()}` : null,
    appliances.length ? `appliance interiors: ${appliances.join(", ")}` : "no appliance interiors",
    recency ? `oven and hood last cleaned: ${recency.toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export function bathroomSummary(s: BathroomSelection): string | null {
  if (!s.bathrooms && !s.scale) return null;

  const scale = labelOf("scale", s.scale);
  return [
    s.bathrooms ? `${s.bathrooms} bathroom${s.bathrooms === 1 ? "" : "s"}` : null,
    `${s.bathtubs} with a bathtub`,
    `${s.glassEnclosures} with a glass enclosure`,
    scale ? `limescale: ${scale.toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join("; ");
}

/** Whichever summary applies to the service. */
export function roomSummaryFor(
  serviceId: string,
  kitchen: KitchenSelection,
  bathroom: BathroomSelection,
): string | null {
  if (serviceId === "SVC-104") return kitchenSummary(kitchen);
  if (serviceId === "SVC-105") return bathroomSummary(bathroom);
  return null;
}
