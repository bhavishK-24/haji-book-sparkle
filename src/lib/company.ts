export const COMPANY = {
  name: "Haji Ahli Cleaning & Maintenance Services L.L.C.",
  shortName: "Haji Ahli",
  tagline: "Specialized in water tank cleaning — cleaning & maintenance across the UAE",
  phone: "+971 50 436 3875",
  altPhone: "+971 55 272 3023",
  landline: "+971 4 273 8611",
  whatsapp: "+971 50 436 3875",
  email: "enquiry@hajiahliclean.com",
  website: "www.hajiahliclean.com",
  address: "P.O. Box 79201, Dubai, U.A.E.",
  hours: "Saturday – Thursday, 8:00 – 20:00",
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
    summary:
      "Hot water extraction and shampooing for carpets, rugs, mattresses and sofas at home.",
    audience: "retail",
  },
  {
    slug: "sanitation-disinfection",
    name: "Sanitation, Disinfection & Sterilization",
    summary:
      "Approved fogging and surface disinfection for homes and small offices.",
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

export const TIME_SLOTS = [
  "08:00 – 10:00",
  "10:00 – 12:00",
  "12:00 – 14:00",
  "14:00 – 16:00",
  "16:00 – 18:00",
  "18:00 – 20:00",
] as const;

/** Headline proof points shown on the homepage — edit these to match reality. */
export const STATS = [
  { value: "15+", label: "Years operating in the UAE" },
  { value: "4,000+", label: "Jobs completed" },
  { value: "< 2 hrs", label: "Average quote response" },
  { value: "4.8 / 5", label: "Average client rating" },
] as const;

/** Sectors served. */
export const INDUSTRIES = [
  { name: "Hotels & hospitality", note: "Back-of-house, guest floors, tanks" },
  { name: "Offices & towers", note: "Nightly and scheduled contracts" },
  { name: "Healthcare & clinics", note: "Disinfection to approved protocols" },
  { name: "Schools & nurseries", note: "Term-break deep cleans" },
  { name: "Retail & F&B", note: "Kitchens, ducts, front of house" },
  { name: "Warehouses & industrial", note: "High-level and floor care" },
  { name: "Villas & residences", note: "Bookable online" },
  { name: "Government & community", note: "Municipality-standard reporting" },
] as const;

/**
 * Client wordmarks for the trust strip.
 * Replace with real client names/logos once approvals are in place.
 */
export const CLIENT_WORDMARKS = [
  "Hospitality Group",
  "Business Bay Tower",
  "Marina Residences",
  "Al Quoz Logistics",
  "Jumeirah Clinics",
  "Downtown Retail",
  "Emirates Schools",
  "Palm Villas",
] as const;
