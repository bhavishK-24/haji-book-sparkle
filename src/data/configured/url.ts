import { emptyBathroomSelection, emptyKitchenSelection } from "./engine";
import type {
  BathroomSelection,
  CleanRecency,
  DoorBand,
  KitchenSelection,
  ScaleLevel,
} from "./types";

/**
 * Room selections carried in the URL.
 *
 * The booking flow already passes property size and furnishing as search
 * params, so the room answers travel the same way: the next step can price the
 * job itself instead of trusting a number handed to it, a refresh does not lose
 * the customer's answers, and the coordinator opening the link sees exactly
 * what the customer saw.
 *
 * Encoded as a short delimited string rather than JSON because it ends up in a
 * URL a customer may read, and `k:B,oven+hood,never` is legible where an
 * encoded JSON blob is not.
 */

const SEP = ",";
const LIST = "+";

export function encodeRoomSelection(
  serviceId: string,
  kitchen: KitchenSelection,
  bathroom: BathroomSelection,
): string {
  if (serviceId === "SVC-104") {
    return [
      "k",
      kitchen.doorBand ?? "",
      kitchen.appliances.join(LIST),
      kitchen.lastCleaned ?? "",
    ].join(SEP);
  }
  return [
    "b",
    String(bathroom.bathrooms ?? ""),
    String(bathroom.bathtubs),
    String(bathroom.glassEnclosures),
    bathroom.scale ?? "",
  ].join(SEP);
}

/** Bounded parse of a count from the URL — anything odd falls back to the default. */
const count = (raw: string | undefined, fallback: number, max = 6): number => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > max) return fallback;
  return n;
};

const DOOR_BANDS: DoorBand[] = ["A", "B", "C", "D"];
const RECENCY: CleanRecency[] = ["never", "over-12-months", "6-12-months", "under-6-months"];
const SCALES: ScaleLevel[] = ["none", "light", "moderate", "heavy", "not-sure"];

/**
 * Reads a room selection back out of the URL.
 *
 * Every field is validated against the values the model actually accepts. A
 * hand-edited or truncated link degrades to "not answered yet", which the
 * pricing engine already handles by asking the question again — it can never
 * produce a selection that prices differently from what the customer chose.
 */
export function decodeKitchenSelection(raw: string | undefined): KitchenSelection {
  const base = emptyKitchenSelection();
  if (!raw) return base;
  const [kind, band, appliances, lastCleaned] = raw.split(SEP);
  if (kind !== "k") return base;

  return {
    doorBand: DOOR_BANDS.includes(band as DoorBand) ? (band as DoorBand) : null,
    appliances: (appliances ?? "").split(LIST).filter(Boolean),
    lastCleaned: RECENCY.includes(lastCleaned as CleanRecency)
      ? (lastCleaned as CleanRecency)
      : null,
  };
}

export function decodeBathroomSelection(raw: string | undefined): BathroomSelection {
  const base = emptyBathroomSelection();
  if (!raw) return base;
  const [kind, bathrooms, bathtubs, enclosures, scale] = raw.split(SEP);
  if (kind !== "b") return base;

  const rooms = count(bathrooms, 1);
  return {
    bathrooms: rooms < 1 ? 1 : rooms,
    bathtubs: Math.min(count(bathtubs, 0), rooms),
    glassEnclosures: Math.min(count(enclosures, 0), rooms),
    scale: SCALES.includes(scale as ScaleLevel) ? (scale as ScaleLevel) : null,
  };
}
