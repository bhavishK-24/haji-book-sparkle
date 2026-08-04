export const COMPANY = {
  name: "Haji Ahli Cleaning & Maintenance",
  shortName: "Haji Ahli",
  tagline: "Dubai Municipality approved cleaning & maintenance across the UAE",
  phone: "+971 50 000 0000",
  whatsapp: "+971 50 000 0000",
  email: "info@hajiahli.ae",
  hours: "Saturday – Thursday, 8:00 – 20:00",
} as const;

export type Service = {
  slug: string;
  name: string;
  summary: string;
  approved?: boolean;
};

export const SERVICES: Service[] = [
  {
    slug: "deep-cleaning",
    name: "Deep Cleaning",
    summary:
      "Offices, flats, villas, warehouses and labour accommodation cleaned top to bottom by trained crews.",
  },
  {
    slug: "glue-removal-polishing",
    name: "Glue Removal & Polishing",
    summary:
      "Post-handover adhesive, paint and cement residue removal followed by a restorative polish.",
  },
  {
    slug: "window-cleaning",
    name: "Internal & External Window Cleaning",
    summary:
      "Streak-free glass, frames and tracks, including safe access for high-rise external facades.",
  },
  {
    slug: "ac-service",
    name: "AC Service & Maintenance",
    summary:
      "Coil and duct cleaning, filter replacement, gas top-up and scheduled preventive maintenance.",
  },
  {
    slug: "water-tank-cleaning",
    name: "Water Tank Cleaning",
    summary:
      "Draining, scrubbing, disinfection and reporting to municipality standards for potable water tanks.",
    approved: true,
  },
  {
    slug: "sanitation-disinfection",
    name: "Sanitation, Disinfection & Sterilization",
    summary:
      "Approved fogging and surface disinfection for offices, clinics, schools and residences.",
    approved: true,
  },
  {
    slug: "marble-grinding",
    name: "Marble Grinding & Polishing",
    summary:
      "Diamond grinding, honing and crystallisation to bring dull marble floors back to a mirror finish.",
  },
  {
    slug: "manpower-supply",
    name: "Monthly Manpower Supply",
    summary:
      "Helpers, cleaners, office boys and watchmen supplied on flexible monthly contracts.",
  },
  {
    slug: "carpet-shampooing",
    name: "Carpet Shampooing",
    summary:
      "Hot water extraction and shampooing for carpets, rugs, sofas and office upholstery.",
  },
  {
    slug: "pest-control",
    name: "Pest Control Services",
    summary:
      "Targeted treatment for cockroaches, bed bugs, ants, rodents and termites with follow-up visits.",
  },
];

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
  "Office",
  "Retail / Shop",
  "Warehouse",
  "Labour Accommodation",
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
