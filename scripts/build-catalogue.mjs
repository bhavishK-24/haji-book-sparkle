/**
 * Generates `src/data/service-catalogue.generated.ts` from the Service Master
 * workbook.
 *
 *   node scripts/build-catalogue.mjs <path-to.xlsx>
 *
 * The workbook is the source of truth. This script's job is to translate it
 * faithfully AND to strip the internal commentary it carries — the scope
 * columns are working documents that contain "PROPOSED SCOPE", "Requires
 * Business Decision", DEC-nn references and raw SVC codes, none of which may
 * ever reach a customer.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const XLSX = process.argv[2];
const OUT = process.argv[3] ?? "src/data/service-catalogue.generated.ts";

// ── minimal xlsx reader ─────────────────────────────────────────────────────
const dir = mkdtempSync(path.join(tmpdir(), "xlsx-"));
execFileSync("unzip", ["-o", XLSX, "-d", dir], { stdio: "ignore" });

const decode = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, "&");

const ssXml = readFileSync(`${dir}/xl/sharedStrings.xml`, "utf8");
const shared = [];
for (const m of ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
  let t = "";
  for (const x of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) t += x[1];
  shared.push(decode(t));
}

const colIndex = (ref) => {
  const letters = ref.match(/^[A-Z]+/)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

function readSheet(file) {
  const xml = readFileSync(`${dir}/xl/worksheets/${file}`, "utf8");
  const rows = [];
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    // Self-closing <c/> must be matched, or an empty cell swallows the next one.
    for (const cm of rm[1].matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = cm[1].match(/r="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = cm[1].match(/t="([^"]+)"/)?.[1];
      const body = cm[2] ?? "";
      let value = "";
      if (type === "inlineStr") {
        for (const t of body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) value += t[1];
        value = decode(value);
      } else {
        const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        if (v !== undefined) value = type === "s" ? (shared[+v] ?? "") : decode(v);
      }
      cells[colIndex(ref)] = value;
    }
    rows.push(cells);
  }
  const width = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => Array.from({ length: width }, (_, i) => (r[i] ?? "").toString().trim()));
}

// Resolve sheet name -> file via the workbook relationships.
const wb = readFileSync(`${dir}/xl/workbook.xml`, "utf8");
const rels = readFileSync(`${dir}/xl/_rels/workbook.xml.rels`, "utf8");
const relTarget = new Map(
  [...rels.matchAll(/Id="([^"]+)"[^>]*Target="worksheets\/([^"]+)"/g)].map((m) => [m[1], m[2]]),
);
const sheets = new Map(
  [...wb.matchAll(/name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((m) => [m[1], relTarget.get(m[2])]),
);
const sheet = (name) => readSheet(sheets.get(name));

const MASTER = sheet("Service_Master");
const DEF = sheet("Service_Def");
const VARIANTS = sheet("Variant_Pricing");
const METRICS = sheet("Package_Metrics");
const ADDONS = sheet("Add-on Master");

// ── value helpers ───────────────────────────────────────────────────────────
const NA = new Set(["", "N/A", "Not Applicable", "Requires Business Decision", "Not Recorded"]);
const clean = (v) => (v && !NA.has(v.trim()) ? v.trim() : null);
const list = (v) =>
  clean(v)
    ? v
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s && !NA.has(s))
    : [];
const q = (s) => (s === null || s === undefined ? "null" : JSON.stringify(s));

// ── scope sanitisation ──────────────────────────────────────────────────────
/** A whole clause that is an internal note rather than customer scope. */
const INTERNAL_CLAUSE =
  /^(PROPOSED SCOPE|SCOPE CONFIRMED|VERIFY|Requires Business Decision|CRITICAL|NOTE:|Phase \d)/i;
/** Inline markers that must be stripped but whose clause is still valid. */
const INLINE_NOISE = [
  /\s*\((?:Requires Business Decision|DEC-\d+)[^)]*\)/gi,
  /\s*\(available as SVC-[^)]*\)/gi,
  /\s*\(see DEC-\d+\)/gi,
  /\s*-\s*see DEC-\d+/gi,
];

/**
 * Scrubs a single free-text value that will be shown to a customer.
 *
 * Applied to every customer-facing string, not just scope: property-type
 * lists and variant attributes carry the same inline "(Requires Business
 * Decision)" markers, and a variant label reading "Fabric (leather Requires
 * Business Decision)" would otherwise appear in the booking UI.
 *
 * Returns null when nothing publishable survives.
 */
function scrub(value) {
  if (!value) return null;
  let t = value;
  for (const re of INLINE_NOISE) t = t.replace(re, "");
  t = t
    .replace(/\s*\((?:[^)]*\b(?:Requires Business Decision|DEC-\d+)\b[^)]*)\)/gi, "")
    .replace(/\s*-\s*see DEC-\d+/gi, "")
    .replace(/\bSVC-\d+\b/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,])/g, "$1")
    .trim();
  if (!t || INTERNAL_CLAUSE.test(t)) return null;
  if (/Requires Business Decision|DEC-\d+|PROPOSED SCOPE|VERIFY before/i.test(t)) return null;
  return t;
}

/**
 * Turns a raw scope cell into customer-safe bullet points.
 * Clauses that are purely internal are dropped; inline internal markers are
 * removed from clauses that otherwise describe real scope.
 */
function sanitiseScope(raw) {
  if (!raw) return [];
  return (
    raw
      .split(";")
      .map((s) => {
        let t = s.trim();
        for (const re of INLINE_NOISE) t = t.replace(re, "");
        return t
          .replace(/\s{2,}/g, " ")
          .replace(/\s+([.,])/g, "$1")
          .trim();
      })
      .filter((t) => t && !INTERNAL_CLAUSE.test(t))
      // Any residual internal marker anywhere means the clause is not safe.
      .filter((t) => !/Requires Business Decision|DEC-\d+|PROPOSED SCOPE|VERIFY before/i.test(t))
      // Replace bare service codes with neutral wording.
      .map((t) =>
        t
          .replace(/\bSVC-\d+\b/g, "")
          .replace(/\(\s*\)/g, "")
          .trim(),
      )
      .map((t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t))
      .filter(Boolean)
  );
}

// ── enums ───────────────────────────────────────────────────────────────────
const BOOKING = {
  "Instant Booking": "instant",
  Scheduled: "scheduled",
  "Quote Required": "quote-required",
  "Inspection Required": "inspection-required",
  Subscription: "subscription",
};
const SEGMENT = { Residential: "residential", Commercial: "commercial", Both: "both" };
const NEXTDAY = { Available: "available", "On qoute": "on-quote", "On quote": "on-quote" };
const PRICING = {
  "Fixed Price": "fixed",
  "Per Unit": "per-unit",
  "Per Sq M": "per-sqm",
  "Per Employee": "per-employee",
  "Custom Quote": "custom-quote",
  Subscription: "subscription",
};
const PRIORITY = {
  "Tier 1 - Core Revenue": "core",
  "Tier 2 - Supporting": "supporting",
  "Tier 3 - Development": "development",
};

function mapEnum(table, raw, field, id) {
  const v = clean(raw);
  if (v === null) return null;
  if (!(v in table)) throw new Error(`Unmapped ${field} "${v}" on ${id}`);
  return table[v];
}
function statusOf(raw) {
  const v = (clean(raw) ?? "").toLowerCase();
  if (v === "active") return "active";
  if (v.includes("requires pricing")) return "draft-requires-pricing";
  if (v.includes("requires definition") || v.includes("requires business decision"))
    return "draft-requires-definition";
  throw new Error(`Unmapped status "${raw}"`);
}

/**
 * Business-authorised corrections layered over the workbook.
 * Kept here so they survive regeneration.
 */
const OVERRIDES = {
  // Renamed: these are now sold as add-ons to a whole-home package, so the
  // name has to say what they add over the cleaning already included.
  "SVC-111": {
    name: "Hotel Laundry & Linen Service",
    slug: "hotel-laundry-linen-dubai",
    shortDescription:
      "Linen, towels and soft furnishings collected, laundered and returned the next day. Supplied to hotels and serviced apartments.",
  },
  // The company holds a watchman licence, not a security-guard licence.
  /*
   * The Service_Def prose for both whole-home tiers was written against the
   * old three-tier ladder, where Intense was the only package carrying the
   * kitchen, bathroom and balcony scope. It opens "Everything in Light
   * Cleaning" (a retired package) and tells a customer that Deep excludes
   * work it now includes. Rewritten here to match SCOPE_OVERRIDES — the
   * prose and the comparison table are shown on the same page, so any drift
   * between them is a contradiction the customer sees.
   */
  "SVC-102": {
    shortDescription:
      "A full deep clean of the whole property — kitchen, bathrooms and balcony included — with grease removal, cabinet exteriors and detailed work on lights, switches and skirting.",
    included: [
      "Dusting, internal and external glass, mirrors and floor mopping throughout",
      "Ceiling, light fittings, switches, sockets and skirting board cleaning",
      "Full kitchen clean: grease and oil removal, cabinet exteriors, gas stove and hob",
      "Full bathroom clean for every bathroom: storage units, disinfection of bowls, commodes and bidets, mirrors and stainless steel fittings, basins, watermark and soap deposit removal, toilet seats and drain covers",
      "Full balcony clean: ceiling, walls, and internal and external glass",
      "Detailed toilet and pantry cleaning",
    ],
    excluded: [
      "Wall cleaning (included in Intense Deep Cleaning)",
      "Heavy-duty machine floor scrubbing (included in Intense Deep Cleaning)",
      "Interior cabinet cleaning (available as an add-on, or included in Intense Deep Cleaning)",
      "Refrigerator and oven interiors (available as add-ons)",
      "Sofa, carpet, mattress and curtain shampooing (available as add-ons or as standalone services)",
      "Exterior windows above ground floor",
      "Wall painting or repair",
      "Pest treatment",
      "Post-construction debris, paint or cement residue",
      "Moving furniture or items over 20 kg",
    ],
  },
  "SVC-103": {
    shortDescription:
      "Everything in Deep Cleaning, plus wall cleaning, heavy-duty machine floor scrubbing and cabinet interiors.",
    included: [
      "Everything in Deep Cleaning",
      "Plus wall cleaning throughout",
      "Plus heavy-duty machine scrubbing of all hard floors, including balconies",
      "Plus cabinet interiors as well as exteriors",
    ],
    excluded: [
      "Refrigerator and oven interiors (available as add-ons)",
      "Sofa, carpet, mattress and curtain shampooing (available as add-ons or as standalone services)",
      "Exterior windows above ground floor",
      "Wall painting or repair",
      "Pest treatment",
      "Post-construction debris, paint or cement residue",
      "Moving furniture or items over 20 kg",
    ],
  },
  /*
   * The single-room services are sold as the *intense* standard — the same
   * depth as Intense Deep Cleaning, applied to one room. The Pricing
   * Calculator names them this way; the Service Master predates the rename.
   */
  "SVC-104": { name: "Kitchen Intense Deep Cleaning" },
  "SVC-105": { name: "Bathroom Intense Deep Cleaning" },
  "SVC-106": { name: "Balcony Intense Deep Cleaning" },

  /* Both treatments are applied on every visit, so the name says so. */
  "SVC-202": { name: "Cockroach Treatment (Spray & Gel)" },

  "SVC-504": {
    name: "Watchman Supply",
    slug: "watchman-supply-dubai",
    shortDescription:
      "Trained watchmen supplied on a daily, monthly or long-term basis for building and site access control.",
    licenceNote: "Licensed for watchman supply. Not offered as licensed security-guard services.",
  },
};

/**
 * Services withdrawn from the website.
 *
 * Only Light Cleaning is retired: the whole-home range is two tiers, Deep and
 * Intense. Kitchen, Bathroom and Balcony deep cleaning are standalone
 * single-room services in their own right — someone who only wants the kitchen
 * done should be able to buy exactly that.
 */
const WITHDRAWN = new Set([
  "SVC-101", // Residential Light Cleaning — range reduced to two tiers
]);

/**
 * Customer-facing descriptions supplied by the business for the commercial
 * catalogue. These supersede the workbook's `Short_Description`, which was
 * written earlier and reads more like an internal scope note.
 */
const DESCRIPTION_OVERRIDES = {
  "SVC-117":
    "Periodic deep cleaning for offices, hotels, schools, warehouses and other commercial premises, scheduled around your operating hours.",
  "SVC-114":
    "Cleaning of retail kiosks, display stands and exhibition units — glass, counters, fixtures and signage — scheduled around your trading hours.",
  "SVC-116":
    "Removal of protective film, glue, cement and paint residue from newly built or newly fitted-out property, taken from builder-finish to move-in condition.",
  "SVC-115":
    "Streak-free cleaning of glass, frames, tracks and sills — inside and out, priced per panel.",
  "SVC-208":
    "Professional sanitisation and disinfection of premises using municipality-approved products, with treatment of high-touch surfaces throughout.",
  "SVC-402":
    "Tile laying, replacement, regrouting and flooring works for residential and commercial properties.",
};

/**
 * Services the business offers that are not yet rows in the workbook.
 * Flagged so they are distinguishable and can be folded in when the sheet
 * catches up.
 */
const SUPPLEMENTARY = [
  {
    id: "SVC-118",
    slug: "regular-commercial-cleaning-dubai",
    name: "General / Regular Commercial Cleaning",
    shortDescription:
      "Routine, recurring cleaning of commercial premises on a daily, weekly or scheduled cycle — the day-to-day maintenance clean, as opposed to the periodic deep clean.",
    category: "Cleaning Services",
    subcategory: "Commercial & Retail Cleaning",
    segment: "commercial",
    nextDay: "on-quote",
    bookingType: "quote-required",
    pricingModel: "custom-quote",
    pricingUnit: null,
    priority: "core",
    displayOrder: 18,
  },
];

// ── service definitions ─────────────────────────────────────────────────────
const defById = new Map();
for (const r of DEF.slice(1)) {
  if (!r[0]) continue;
  defById.set(r[0], {
    short: clean(r[2]),
    definition: clean(r[3]),
    included: sanitiseScope(clean(r[8])),
    excluded: sanitiseScope(clean(r[9])),
  });
}

// ── variants ────────────────────────────────────────────────────────────────
const variantsById = new Map();
for (const r of VARIANTS.slice(1)) {
  if (!r[0]) continue;
  const price = clean(r[6]);
  if (!variantsById.has(r[1])) variantsById.set(r[1], []);
  variantsById.get(r[1]).push({
    id: r[0],
    label: scrub(clean(r[3])),
    a1: scrub(clean(r[4])),
    a2: scrub(clean(r[5])),
    price: price === null ? null : Number(price),
    status: statusOf(r[12]),
  });
}

// ── add-ons ─────────────────────────────────────────────────────────────────
/** Pricing unit -> the quantity the booking flow must capture. */
const UNIT_INPUT = {
  "Per Appliance": null,
  "Per Mattress": "mattresses",
  "Per Seat": "seats",
  "Per Sq M": "squareMetres",
  "Per Property": null,
  "Per Kitchen": null,
  "Per Bathroom": "bathrooms",
  "Per Balcony": "balconies",
  "Per Panel": "panels",
};

/**
 * Add-on corrections, applied for the same reason as SCOPE_OVERRIDES.
 *
 * The workbook assumed Intense bundled the kitchen, bathroom and balcony
 * scope. It does not — both tiers carry it — so:
 *
 *  - fridge and oven interiors attach to BOTH tiers, not just Deep;
 *  - interior cabinets become a real, visible add-on for Deep only (Intense
 *    already includes them);
 *  - the Kitchen/Bathroom/Balcony "add-ons" are withdrawn, because selling a
 *    scope the package already contains is selling the same work twice. Those
 *    remain purchasable on their own as SVC-104 / SVC-105 / SVC-106.
 *
 * SVC-101 is retired, so it is stripped from every applicability list.
 */
const ADDON_OVERRIDES = {
  "ADD-01": { applicableTo: ["SVC-102", "SVC-103"] },
  "ADD-02": { applicableTo: ["SVC-102", "SVC-103"] },
  "ADD-06": {
    applicableTo: ["SVC-102"],
    description:
      "Upgrades a Deep Cleaning booking to the full Intense standard in the same visit: wall cleaning, heavy-duty machine floor scrubbing and cabinet interiors.",
  },
  "ADD-07": {
    applicableTo: ["SVC-102"],
    visible: true,
    description:
      "Cleaning of kitchen and wardrobe cabinet interiors — included as standard in Intense Deep Cleaning.",
  },
  "ADD-08": { visible: false },
  "ADD-09": { visible: false },
  "ADD-10": { visible: false },
};

/** Service-side half of the ADDON_OVERRIDES above. See `declared` below. */
const EXTRA_ADD_ONS = {
  "SVC-103": ["ADD-01", "ADD-02"],
};

const addOns = [];
for (const r of ADDONS.slice(1)) {
  if (!r[0]) continue;
  const visibility = clean(r[9]) ?? "";
  const unit = clean(r[6]);
  addOns.push({
    id: r[0],
    name: r[1],
    // The description's trailing rationale is internal reasoning; keep the
    // first sentence, which is the customer-facing definition.
    description: scrub((clean(r[2]) ?? "").split(/(?<=\.)\s+/)[0]),
    applicableTo: list(r[3]).filter((s) => /^SVC-\d+$/.test(s)),
    pricingModel: mapEnum(PRICING, r[5], "addon pricingModel", r[0]),
    pricingUnit: unit,
    quantityInput: unit && unit in UNIT_INPUT ? UNIT_INPUT[unit] : null,
    standaloneServiceId: (clean(r[8]) ?? "").match(/SVC-\d+/)?.[0] ?? null,
    // Only "Visible" reaches the site unless ADDON_OVERRIDES says otherwise.
    visible: /^visible$/i.test(visibility),
    status: statusOf(r[10]),
    ...(ADDON_OVERRIDES[r[0]] ?? {}),
  });
}

// SVC-101 is retired; no add-on may still point at it.
for (const a of addOns) {
  a.applicableTo = a.applicableTo.filter((id) => !WITHDRAWN.has(id));
}

/**
 * Mutual-exclusion rules, read from the Eligibility_Rules prose.
 * Kitchen Deep Cleaning already contains the fridge and oven interiors, so
 * selecting it must hide those two rather than let a customer pay twice.
 */
const SUPPRESSES = { "ADD-08": ["ADD-01", "ADD-02"] };

const addOnIds = new Set(addOns.map((a) => a.id));

// ── package scope matrix ────────────────────────────────────────────────────
const SCOPE = {
  Included: "included",
  "Not included": "excluded",
  "Core of this service": "core",
  "Available as add-on": "addon",
};
const DEEP = "Residential Deep Cleaning";
const INTENSE = "Residential Intense Deep Cleaning";

/**
 * Business correction to the Deep vs Intense split.
 *
 * The workbook was drafted when Intense was the only tier carrying the
 * kitchen, bathroom and balcony scope, which made 14 of the 28 rows differ.
 * That is not how the two packages are actually sold. Both include the same
 * kitchen, bathroom and balcony work; Intense is separated by exactly three
 * things:
 *
 *   1. Wall cleaning
 *   2. Heavy-duty machine floor scrubbing (the buffing machine)
 *   3. Interior cabinet cleaning — Deep does exteriors only, and can take
 *      interiors as a paid add-on (ADD-07)
 *
 * Refrigerator and oven interiors are add-ons to BOTH tiers rather than being
 * bundled into Intense.
 *
 * Only these two columns are touched. The single-room columns (Kitchen,
 * Bathroom, Balcony) stay exactly as the workbook records them.
 */
const SCOPE_OVERRIDES = {
  "Wall cleaning": { [DEEP]: "excluded", [INTENSE]: "included" },
  "Interior cabinet cleaning": { [DEEP]: "addon", [INTENSE]: "included" },
  /* Both tiers bring the scrubber; only Intense also brings the buffer. */
  "Heavy-duty machine floor scrubbing": { [DEEP]: "included", [INTENSE]: "included" },
  "Grease and oil removal": { [DEEP]: "excluded", [INTENSE]: "included" },

  // Same in both from here down.
  "Exterior cabinet cleaning": { [DEEP]: "included", [INTENSE]: "included" },
  "Refrigerator interior cleaning": { [DEEP]: "addon", [INTENSE]: "addon" },
  "Oven interior cleaning": { [DEEP]: "addon", [INTENSE]: "addon" },
  "Gas stove and hob cleaning": { [DEEP]: "included", [INTENSE]: "included" },
  "Bathroom storage unit cleaning": { [DEEP]: "included", [INTENSE]: "included" },
  "Disinfection of WC bowls, commodes and bidets": { [DEEP]: "included", [INTENSE]: "included" },
  "Stainless steel fittings and mirrors": { [DEEP]: "included", [INTENSE]: "included" },
  "Basins, watermark and soap deposit removal": { [DEEP]: "included", [INTENSE]: "included" },
  "Toilet seat cleaning and drain cover debris removal": {
    [DEEP]: "included",
    [INTENSE]: "included",
  },
  "Balcony ceiling and wall cleaning": { [DEEP]: "included", [INTENSE]: "included" },
  "Balcony glass cleaning (internal and external)": { [DEEP]: "included", [INTENSE]: "included" },

  /* Both tiers carry the scrubber, so balcony floors are machine-scrubbed on both. */
  "Balcony floor machine scrubbing": { [DEEP]: "included", [INTENSE]: "included" },
};

/**
 * Rows the business sells that the workbook's Package_Metrics sheet does not
 * carry yet. Appended to the matrix so the comparison table tells the whole
 * story; fold them into the sheet when it next changes.
 */
const SCOPE_ADDITIONS = [
  {
    item: "Cleaning intensity",
    group: "General",
    values: { [DEEP]: "medium", [INTENSE]: "intense" },
  },
  {
    /*
     * The differentiator customers actually ask about. Both tiers bring the
     * heavy-duty scrubber; only Intense also brings the buffing machine, which
     * is what lifts and polishes hard floors rather than just washing them.
     */
    item: "Floor buffing and polishing machine",
    group: "General",
    values: { [DEEP]: "excluded", [INTENSE]: "included" },
  },
];

const packageColumns = METRICS[0].slice(2).filter(Boolean);
const scopeRows = [];
for (const r of METRICS.slice(1)) {
  if (!r[0]) continue;
  const values = {};
  packageColumns.forEach((name, i) => {
    const raw = clean(r[2 + i]);
    if (raw && raw in SCOPE) values[name] = SCOPE[raw];
  });
  Object.assign(values, SCOPE_OVERRIDES[r[0]] ?? {});
  scopeRows.push({ item: r[0], group: clean(r[1]), values });
}
scopeRows.push(...SCOPE_ADDITIONS);

/*
 * Guard the correction above. If a workbook edit renames a scope row, the
 * override silently stops applying and the comparison table quietly grows a
 * dozen false differences again. Fail the build instead.
 */
{
  const items = new Set(scopeRows.map((r) => r.item));
  const orphans = Object.keys(SCOPE_OVERRIDES).filter((k) => !items.has(k));
  if (orphans.length) {
    throw new Error(`SCOPE_OVERRIDES no longer match any scope row: ${orphans.join(", ")}`);
  }
  const differing = scopeRows.filter((r) => r.values[DEEP] !== r.values[INTENSE]);
  if (differing.length !== 5) {
    throw new Error(
      `Deep vs Intense should differ on exactly 5 rows, found ${differing.length}: ` +
        differing.map((r) => r.item).join(" | "),
    );
  }
}

// ── services ────────────────────────────────────────────────────────────────
const services = [];
for (const r of MASTER.slice(1)) {
  if (!r[0]) continue;
  const id = r[0];
  if (WITHDRAWN.has(id)) continue;
  const o = OVERRIDES[id] ?? {};
  const d = defById.get(id) ?? {};
  /*
   * An add-on is only offered when the service declares it AND the add-on
   * declares the service. The workbook never listed the fridge and oven
   * interiors against Intense, because at the time Intense bundled them; now
   * that they are add-ons to both tiers, the service side has to say so too
   * or the two-sided gate silently drops them.
   */
  const declared = [
    ...list(r[20]).filter((s) => /^ADD-\d+$/.test(s)),
    ...(EXTRA_ADD_ONS[id] ?? []),
  ];

  services.push({
    id,
    slug: o.slug ?? clean(r[2]),
    name: o.name ?? r[1],
    /*
     * Which Package_Metrics column describes this service's scope.
     *
     * Matched against the workbook's ORIGINAL name, not the display name, so
     * renaming a service for the website cannot silently detach it from its
     * own scope matrix. That is exactly what happened when the single-room
     * services were renamed to "… Intense Deep Cleaning": the comparison
     * table joined on the display name and quietly disappeared.
     */
    scopeColumn: packageColumns.includes(r[1]) ? r[1] : null,
    shortDescription: DESCRIPTION_OVERRIDES[id] ?? o.shortDescription ?? scrub(d.short) ?? null,
    // `Service_Definition` is an internal working note — it carries DEC-nn
    // references and cross-service reasoning, so it is not emitted at all.
    included: o.included ?? d.included ?? [],
    excluded: o.excluded ?? d.excluded ?? [],
    licenceNote: o.licenceNote ?? null,
    category: clean(r[3]),
    subcategory: clean(r[4]),
    segment: mapEnum(SEGMENT, r[5], "segment", id),
    nextDay: mapEnum(NEXTDAY, r[6], "nextDay", id),
    bookingType: mapEnum(BOOKING, r[9], "bookingType", id),
    pricingModel: mapEnum(PRICING, r[10], "pricingModel", id),
    pricingUnit: clean(r[11]),
    suitablePropertyTypes: list(r[7]).map(scrub).filter(Boolean),
    serviceAreas: list(r[17]),
    bundleEligible: clean(r[18]) === "Yes",
    availableAsAddOn: clean(r[19]) === "Yes",
    // Drop references to add-ons that do not exist in the Add-on Master.
    addOnIds: declared.filter((a) => addOnIds.has(a)),
    danglingAddOnIds: declared.filter((a) => !addOnIds.has(a)),
    crossSellIds: list(r[21]).filter((s) => /^SVC-\d+$/.test(s)),
    priority: mapEnum(PRIORITY, r[22], "priority", id),
    displayOrder: clean(r[23]) ? Number(r[23]) : null,
    status: statusOf(r[24]),
    certificateIssued: clean(r[26]) === "Yes",
    variants: variantsById.get(id) ?? [],
  });
}

for (const s of SUPPLEMENTARY) {
  services.push({
    ...s,
    definition: null,
    included: [],
    excluded: [],
    licenceNote: null,
    suitablePropertyTypes: [],
    serviceAreas: ["Dubai", "Sharjah", "Ajman"],
    bundleEligible: false,
    availableAsAddOn: false,
    addOnIds: [],
    danglingAddOnIds: [],
    crossSellIds: [],
    status: "draft-requires-pricing",
    certificateIssued: false,
    variants: [],
  });
}

const categories = [...new Set(services.map((s) => s.category))];

// ── emit ────────────────────────────────────────────────────────────────────
const L = [];
L.push(`// ⚠️ GENERATED FILE — DO NOT EDIT BY HAND.`);
L.push(`//`);
L.push(`// Source: ${path.basename(XLSX)}`);
L.push(`// Sheets: Service_Master, Service_Def, Variant_Pricing, Package_Metrics, Add-on Master`);
L.push(`// Regenerate: node scripts/build-catalogue.mjs "<workbook>.xlsx"`);
L.push(`//`);
L.push(`// Scope text has been sanitised: internal clauses ("PROPOSED SCOPE",`);
L.push(`// "Requires Business Decision", DEC-nn references, raw SVC codes) are`);
L.push(`// stripped by the generator and never reach the site.`);
L.push(``);
L.push(`import type { AddOn, PackageScopeRow, Service } from "./types";`);
L.push(``);
L.push(`export const SERVICE_CATEGORIES = ${JSON.stringify(categories, null, 2)} as const;`);
L.push(``);
L.push(`export const ADD_ONS: AddOn[] = [`);
for (const a of addOns) {
  L.push(`  {`);
  L.push(`    id: ${q(a.id)},`);
  L.push(`    name: ${q(a.name)},`);
  L.push(`    description: ${q(a.description)},`);
  L.push(`    applicableTo: ${JSON.stringify(a.applicableTo)},`);
  L.push(`    pricingModel: ${q(a.pricingModel)},`);
  L.push(`    pricingUnit: ${q(a.pricingUnit)},`);
  L.push(`    quantityInput: ${q(a.quantityInput)},`);
  L.push(`    standaloneServiceId: ${q(a.standaloneServiceId)},`);
  L.push(`    visible: ${a.visible},`);
  L.push(`    status: ${q(a.status)},`);
  L.push(`    price: null,`);
  L.push(`    durationMinutes: null,`);
  L.push(`  },`);
}
L.push(`];`);
L.push(``);
L.push(`/** Selecting the key add-on hides the listed ones — they are already inside it. */`);
L.push(
  `export const ADD_ON_SUPPRESSES: Record<string, string[]> = ${JSON.stringify(SUPPRESSES, null, 2)};`,
);
L.push(``);
L.push(`export const SERVICES: Service[] = [`);
for (const s of services) {
  L.push(`  {`);
  for (const [k, v] of [
    ["id", q(s.id)],
    ["slug", q(s.slug)],
    ["name", q(s.name)],
    ["shortDescription", q(s.shortDescription)],

    ["included", JSON.stringify(s.included)],
    ["excluded", JSON.stringify(s.excluded)],
    ["licenceNote", q(s.licenceNote)],
    ["category", q(s.category)],
    ["subcategory", q(s.subcategory)],
    ["segment", q(s.segment)],
    ["nextDay", q(s.nextDay)],
    ["bookingType", q(s.bookingType)],
    ["pricingModel", q(s.pricingModel)],
    ["pricingUnit", q(s.pricingUnit)],
    ["priority", q(s.priority)],
    ["displayOrder", String(s.displayOrder)],
    ["status", q(s.status)],
    ["scopeColumn", q(s.scopeColumn)],
    ["suitablePropertyTypes", JSON.stringify(s.suitablePropertyTypes)],
    ["serviceAreas", JSON.stringify(s.serviceAreas)],
    ["bundleEligible", String(s.bundleEligible)],
    ["availableAsAddOn", String(s.availableAsAddOn)],
    ["addOnIds", JSON.stringify(s.addOnIds)],
    ["crossSellIds", JSON.stringify(s.crossSellIds)],
    ["certificateIssued", String(s.certificateIssued)],
    ["duration", "null"],
    ["media", "null"],
  ]) {
    L.push(`    ${k}: ${v},`);
  }
  if (s.variants.length === 0) {
    L.push(`    variants: [],`);
  } else {
    L.push(`    variants: [`);
    for (const v of s.variants) {
      L.push(
        `      { id: ${q(v.id)}, label: ${q(v.label)}, attribute1: ${q(v.a1)}, attribute2: ${q(v.a2)}, price: ${v.price ?? "null"}, status: ${q(v.status)} },`,
      );
    }
    L.push(`    ],`);
  }
  L.push(`  },`);
}
L.push(`];`);
L.push(``);
L.push(`export const PACKAGE_SCOPE_COLUMNS = ${JSON.stringify(packageColumns, null, 2)} as const;`);
L.push(``);
L.push(`export const PACKAGE_SCOPE: PackageScopeRow[] = [`);
for (const r of scopeRows) {
  L.push(`  { item: ${q(r.item)}, group: ${q(r.group)}, values: ${JSON.stringify(r.values)} },`);
}
L.push(`];`);
L.push(``);

writeFileSync(OUT, L.join("\n"), "utf8");

// ── summary ─────────────────────────────────────────────────────────────────
const dangling = services.flatMap((s) => s.danglingAddOnIds.map((a) => `${s.id}->${a}`));
console.log(`services            ${services.length}`);
console.log(
  `add-ons             ${addOns.length} (${addOns.filter((a) => a.visible).length} visible)`,
);
console.log(
  `hidden add-ons      ${
    addOns
      .filter((a) => !a.visible)
      .map((a) => a.id)
      .join(", ") || "none"
  }`,
);
console.log(`dangling add-on refs ${dangling.join(", ") || "none"}`);
console.log(
  `priced variants     ${services.flatMap((s) => s.variants).filter((v) => v.price !== null).length}`,
);
console.log(
  `scope clauses kept  ${services.reduce((n, s) => n + s.included.length + s.excluded.length, 0)}`,
);
