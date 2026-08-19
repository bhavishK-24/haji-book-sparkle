import { getService } from "./index";
import type { Service } from "./types";

/**
 * The commercial catalogue, exactly as the business defines it.
 *
 * An explicit ordered list rather than a `segment` filter. The workbook marks
 * several residential-only services as "Both" — kitchen, bathroom and balcony
 * deep cleaning among them — which meant the segment filter pulled room-level
 * home services onto the business page. This list is the source of truth for
 * what a commercial customer is shown, and in what order.
 */
export const BUSINESS_SERVICE_IDS = [
  // Commercial cleaning
  "SVC-117", // Commercial & Facility Deep Cleaning
  "SVC-118", // General / Regular Commercial Cleaning
  "SVC-114", // Kiosk & Stand Cleaning
  "SVC-116", // Glue Removal & Post-Handover Cleaning

  // Soft furnishing
  "SVC-107", // Sofa Deep Cleaning & Shampoo
  "SVC-108", // Carpet Deep Cleaning & Shampoo
  "SVC-109", // Mattress Deep Cleaning & Shampoo

  // Curtains & linen
  "SVC-110", // Curtain & Chiffon Cleaning
  "SVC-112", // On-Site Curtain Steam Ironing
  "SVC-111", // Household Laundry & Linen Service

  // Glass & floors
  "SVC-115", // Internal & External Window Cleaning
  "SVC-113", // Marble Polishing, Grinding & Crystallisation
  "SVC-402", // Tile & Flooring Work

  // Pest control & hygiene
  "SVC-201", // General Pest Control (Gel & Spray)
  "SVC-202", // Cockroach Treatment
  "SVC-203", // Ant Treatment
  "SVC-204", // Bed Bug Treatment
  "SVC-205", // Rodent Control
  "SVC-206", // Flying Insect Treatment
  "SVC-207", // External Perimeter Treatment
  "SVC-208", // Sanitisation & Disinfection

  // Water tanks
  "SVC-301", // Water Tank Cleaning & Disinfection

  // Maintenance trades
  "SVC-401", // Painting Services
  "SVC-403", // Plumbing Services
  "SVC-405", // Carpentry Services
  "SVC-407", // Curtain Supply, Stitching & Installation
  "SVC-408", // Annual Maintenance Contract (AMC)

  // Manpower
  "SVC-501", // Office Boy Supply
  "SVC-502", // Cleaner Supply
  "SVC-504", // Watchman Supply
] as const;

/**
 * Presentation groups for the business page.
 *
 * The workbook's `Parent_Category` puts window cleaning, marble and kiosk work
 * all under "Cleaning Services", which is true but useless as a page structure.
 * These headings match how a facilities buyer thinks about the work.
 */
export const BUSINESS_GROUPS = [
  {
    heading: "Commercial cleaning",
    blurb: "Recurring contracts and periodic deep cleans for any commercial premises.",
    ids: ["SVC-117", "SVC-118", "SVC-114", "SVC-116"],
  },
  {
    heading: "Upholstery & soft furnishing",
    blurb: "Hot-water extraction for seating, carpet and mattresses across a site.",
    ids: ["SVC-107", "SVC-108", "SVC-109"],
  },
  {
    heading: "Curtains & linen",
    blurb: "Take-down, laundering, on-site steam ironing and re-fixing.",
    ids: ["SVC-110", "SVC-112", "SVC-111"],
  },
  {
    heading: "Glass, marble & flooring",
    blurb: "Facade and internal glass, stone restoration and tiling works.",
    ids: ["SVC-115", "SVC-113", "SVC-402"],
  },
  {
    heading: "Pest control & hygiene",
    blurb: "Treatment programmes and municipality-approved disinfection.",
    ids: ["SVC-201", "SVC-202", "SVC-203", "SVC-204", "SVC-205", "SVC-206", "SVC-207", "SVC-208"],
  },
  {
    heading: "Water tanks",
    blurb: "Draining, cleaning and disinfection with before and after documentation.",
    ids: ["SVC-301"],
  },
  {
    heading: "Maintenance & technical",
    blurb: "Trades on call-out or wrapped into an annual contract.",
    ids: ["SVC-401", "SVC-403", "SVC-405", "SVC-407", "SVC-408"],
  },
  {
    heading: "Manpower supply",
    blurb: "Staff deployed to your site on daily, monthly or long-term terms.",
    ids: ["SVC-501", "SVC-502", "SVC-504"],
  },
] as const;

export type BusinessGroup = {
  heading: string;
  blurb: string;
  services: Service[];
};

/** Resolved groups, skipping any id the catalogue does not know. */
export const businessGroups = (): BusinessGroup[] =>
  BUSINESS_GROUPS.map((g) => ({
    heading: g.heading,
    blurb: g.blurb,
    services: g.ids.map((id) => getService(id)).filter((s): s is Service => Boolean(s)),
  })).filter((g) => g.services.length > 0);

/** Flat list, for counts and meta descriptions. */
export const businessServices = (): Service[] =>
  BUSINESS_SERVICE_IDS.map((id) => getService(id)).filter((s): s is Service => Boolean(s));
