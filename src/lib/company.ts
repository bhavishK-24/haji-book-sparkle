export const COMPANY = {
  /**
   * Trading name, used everywhere a customer reads the company's name.
   *
   * `legalName` is the registered entity and is what must appear on invoices,
   * terms and the VAT record. The two differ, so both are kept — printing the
   * trading name on a tax invoice would make the invoice non-compliant.
   */
  name: "Haji Ahli Cleaning & Maintenance Services L.L.C.",
  legalName: "Haji Ahli Building Cleaning Services LLC",
  shortName: "Haji Ahli",
  tagline: "Cleaning and maintenance for residential and commercial properties across the UAE",
  established: 2006,
  phone: "+971 50 436 3875",
  altPhone: "+971 55 272 3023",
  landline: "+971 4 273 8611",
  whatsapp: "+971 50 436 3875",
  email: "enquiry@hajiahliclean.com",
  website: "www.hajiahliclean.com",
  /** Registered address, as it appears on the trade licence. */
  address:
    "201 - Saeed Juma Khalifa Al Mehairi Building, Street 14A, Frij Al Murar, Deira, Dubai, U.A.E.",
  emirate: "Dubai",
  /**
   * VAT registration number.
   *
   * UAE Federal Tax Authority rules require a registered business to show its
   * TRN on tax invoices and on any document quoting VAT-inclusive prices, so
   * it appears in the footer and on the legal pages.
   */
  trn: "100321015800003",
  /**
   * Stated to match the arrival slots we actually offer.
   *
   * ARRIVAL_TIMES ends at 19:00, so advertising 20:00 promised an hour nobody
   * could book. The last slot a customer can pick is 19:00.
   */
  hours: "Every day, 8:00 – 19:00",
} as const;

/**
 * Cancellation and rescheduling terms, as supplied by the business.
 *
 * Kept as data rather than prose in a page so the same figures drive the
 * customer-facing policy page, the checkout notice and any future email — a
 * cancellation window that disagrees with itself across three screens is worse
 * than one that is merely strict.
 */
export const CANCELLATION_POLICY = {
  freeCancellationHours: 5,
  freeRescheduleHours: 4,
  lateCancellationFee: 50,
  /** Charged when nobody is there or the crew cannot get in. */
  noAccessFee: 50,
  maxReschedules: 2,
  currency: "AED",
  /** Wrong property or service details mean the job is re-quoted, not charged. */
  incorrectInformation: "requote",
  /** What happens when the cancellation is ours, or the weather's. */
  companyCancellation: "Full refund if already paid, or free rescheduling at your convenience.",
  forceMajeure: "Full refund.",
  /** Commercial and quote-based work is governed by its own contract. */
  commercialSeparateTerms: true,
} as const;

export type Audience = "retail" | "business";

export type Service = {
  slug: string;
  name: string;
  summary: string;
  audience: Audience;
  approved?: boolean;
};

export const SERVICES: Service[] = [
  {
    slug: "deep-cleaning",
    name: "Deep Cleaning",
    summary:
      "Flats, villas and homes cleaned top to bottom by trained crews — kitchens, bathrooms, bedrooms and balconies.",
    audience: "retail",
  },
  {
    slug: "window-cleaning",
    name: "Internal & External Window Cleaning",
    summary:
      "Streak-free glass, frames and tracks for apartments and villas, including reachable external faces.",
    audience: "retail",
  },
  {
    slug: "ac-service",
    name: "AC Service & Maintenance",
    summary:
      "Coil and filter cleaning, gas top-up and preventive servicing for home split and ducted units.",
    audience: "retail",
  },
  {
    slug: "carpet-shampooing",
    name: "Carpet & Sofa Shampooing",
    summary: "Hot water extraction and shampooing for carpets, rugs, mattresses and sofas at home.",
    audience: "retail",
  },
  {
    slug: "sanitation-disinfection",
    name: "Sanitation, Disinfection & Sterilization",
    summary: "Approved fogging and surface disinfection for homes and small offices.",
    audience: "retail",
    approved: true,
  },
  {
    slug: "pest-control",
    name: "Pest Control Services",
    summary:
      "Targeted treatment for cockroaches, bed bugs, ants, rodents and termites with a follow-up visit.",
    audience: "retail",
  },
  {
    slug: "marble-grinding",
    name: "Marble Grinding & Polishing",
    summary:
      "Diamond grinding, honing and crystallisation to bring dull marble floors back to a mirror finish.",
    audience: "retail",
  },
  {
    slug: "water-tank-cleaning",
    name: "Water Tank Cleaning",
    summary:
      "Draining, scrubbing, disinfection and municipality-standard reporting for building and community potable water tanks.",
    audience: "business",
    approved: true,
  },
  {
    slug: "glue-removal-polishing",
    name: "Glue Removal & Post-Handover Cleaning",
    summary:
      "Adhesive, paint and cement residue removal plus restorative polishing for contractors and developers after handover.",
    audience: "business",
  },
  {
    slug: "commercial-deep-cleaning",
    name: "Commercial & Facility Deep Cleaning",
    summary:
      "Offices, retail units, warehouses, schools and labour accommodation on scheduled or one-off contracts.",
    audience: "business",
  },
  {
    slug: "manpower-supply",
    name: "Monthly Manpower Supply",
    summary:
      "Helpers, cleaners, office boys and watchmen supplied on flexible monthly contracts with supervision.",
    audience: "business",
  },
];

export const RETAIL_SERVICES = SERVICES.filter((s) => s.audience === "retail");
export const BUSINESS_SERVICES = SERVICES.filter((s) => s.audience === "business");
export const BOOKABLE_SERVICE_NAMES = RETAIL_SERVICES.map((s) => s.name);

export const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export const PROPERTY_TYPES = [
  "Apartment / Flat",
  "Villa",
  "Townhouse",
  "Studio",
  "Other",
] as const;

/**
 * Preferred arrival times.
 *
 * These are START times, not fixed appointment windows. Services in the
 * catalogue range from a single-room clean to a six-bedroom intense deep
 * clean, so a uniform two-hour slot would be wrong for almost all of them.
 * The customer picks when they would like the crew to arrive; the coordinator
 * confirms how long the visit will take when they call.
 */
export const ARRIVAL_TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
] as const;

/**
 * What the crew brings. Stated once, globally, rather than repeated inside
 * every package's inclusion list — repeating it would re-bloat exactly the
 * lists that were trimmed to show real differences.
 */
export const MATERIALS_POLICY = {
  headline: "Everything we need, we bring",
  detail:
    "Equipment, machinery, chemicals and consumables are all supplied and included. You don't need to provide anything.",
  byoNote: "Prefer we use your own products? Tell us when we call and we'll use them instead.",
} as const;

/**
 * The guarantee on pest treatments.
 *
 * Pest work is the one service where the customer cannot judge the result on
 * the day — success is measured by what does not come back. A warranty is what
 * makes it buyable, so it is stated on the service rather than left to terms.
 */
export const PEST_WARRANTY = {
  heading: "Three-month warranty",
  body: "Every pest treatment is covered for three months. If the problem returns within that time we come back and re-treat at no charge.",
} as const;

/** Coarser preference for customers who are flexible. */
export const ARRIVAL_PREFERENCES = [
  { value: "morning", label: "Morning", detail: "08:00 – 12:00" },
  { value: "afternoon", label: "Afternoon", detail: "12:00 – 16:00" },
  { value: "evening", label: "Evening", detail: "16:00 – 20:00" },
] as const;

/**
 * Headline proof points. Every figure here must be defensible — these are
 * public claims, so nothing goes in that the company cannot evidence.
 */
export const STATS = [
  { value: "2006", label: "Operating in the UAE since" },
  { value: "6,000+", label: "Jobs completed" },
  { value: "400+", label: "Corporate accounts served" },
  { value: "In-house", label: "Crews, never subcontracted" },
] as const;

/**
 * Total corporate accounts served, supplied by the business.
 * The client marquee shows a selected subset, not the full list.
 */
export const CORPORATE_ACCOUNTS = "400+";

/**
 * Sectors served, ordered by how much of the business they represent.
 * Residential and commercial property lead; hospitality sits further down.
 */
export const INDUSTRIES = [
  { name: "Property developers", note: "Handover and post-construction cleaning" },
  { name: "Construction & contracting", note: "Site, fit-out and snagging support" },
  { name: "Villas & residences", note: "Bookable online, next-day slots" },
  { name: "Offices & commercial", note: "Scheduled and nightly contracts" },
  { name: "Interior fit-out", note: "Glue, cement and paint residue removal" },
  { name: "Retail & F&B", note: "Front of house, kitchens and ducts" },
  { name: "Warehouses & industrial", note: "High-level access and floor care" },
  { name: "Hotels & holiday homes", note: "Turnover cleans and back-of-house" },
] as const;

/**
 * Real corporate clients, supplied by the company (2026 client list).
 *
 * A deliberately selected subset — the company has served 400+ corporate
 * accounts, so this list is illustrative, not exhaustive. Do not add names
 * that have not been supplied by the business.
 *
 * Rendered as typographic wordmarks: these are the clients' own trademarks,
 * so use the registered name only unless written logo permission is on file.
 */
export const CLIENT_WORDMARKS = [
  "DAMAC Properties",
  "Danube Properties",
  "Sobha",
  "Shapoorji Pallonji",
  "Binghatti Developers",
  "Al Masood",
  "China State Construction",
  "China Nuclear Industry 22",
  "China Tiesiju Civil Engineering",
  "Falcon Contracting",
  "KOJ Interiors",
  "Panache Interiors",
  "Urban Space Décor",
  "Lloyds Design Fitouts",
  "Valmont Middle East",
  "TFG Real Estate",
  "Dream Inn Holiday Homes",
  "Pro Fit Interior Design",
] as const;
