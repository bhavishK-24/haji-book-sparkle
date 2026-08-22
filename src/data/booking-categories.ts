import { isOnlineBookable } from "./index";
import { priceFrom } from "./pricing";
import { ALL_PHOTOS, type PhotoKey } from "./media";
import { SERVICES } from "./service-catalogue.generated";
import type { Service } from "./types";

/**
 * Booking categories — the first choice a customer makes.
 *
 * Rather than presenting 35 services at once, the flow is:
 *   choose a category  ->  choose the service within it  ->  pick a date
 *
 * That keeps the decision small at each step. Categories are ordered by how
 * much of the business they represent, and each owns its own booking page at
 * `/book/$category`.
 */
export type BookingCategory = {
  slug: string;
  name: string;
  /** One line, shown on the chooser card. */
  tagline: string;
  /** Fuller explanation, shown at the top of the category booking page. */
  intro: string;
  photo: PhotoKey;
  /** Service IDs, in the order they should be offered. */
  serviceIds: string[];
  /**
   * Copy that explains how the options differ, shown above the picker.
   * Null where the category has a single obvious option.
   */
  chooseHint: string | null;
  /**
   * Search-facing title and description for this category page.
   *
   * Required, not optional: a new category must not ship with the generic
   * "Book <name>" title, which leads with our verb rather than the service the
   * customer searched for and carries no location.
   *
   * Written from the services the category actually contains — nothing here
   * claims work that is not in `serviceIds`.
   */
  seoTitle: string;
  seoDescription: string;
  /**
   * Whether the services here form a ladder — each tier containing the one
   * below — so a side-by-side table and "everything in X, plus…" make sense.
   *
   * Only whole-home cleaning does. Kitchen, bathroom and balcony are three
   * different rooms, not three grades of the same job; comparing them in a
   * table implied a bathroom clean contains a kitchen clean, and the page
   * literally read "Everything in Kitchen Intense Deep, plus…" above a list
   * of bathroom fittings. Those get full bullet points instead.
   */
  tiered?: boolean;
};

export const BOOKING_CATEGORIES: BookingCategory[] = [
  {
    slug: "home-cleaning",
    seoTitle: "Deep Cleaning Services in Dubai | Haji Ahli",
    seoDescription:
      "Whole-home deep and intense deep cleaning for apartments and villas in Dubai. Kitchen, bathrooms and balcony included, with equipment and materials supplied.",
    name: "Home cleaning",
    tagline: "Deep and intense packages for the whole property.",
    intro:
      "Two levels of whole-home cleaning. Both cover the same kitchen, bathroom and balcony work — Intense goes further on the surfaces that need machinery.",
    photo: "villaConsoleDetail",
    // Deliberately ordered deep -> intense so the ladder is legible.
    serviceIds: ["SVC-102", "SVC-103"],
    chooseHint:
      "Intense adds four things to Deep: wall cleaning, grease and oil removal, the floor buffing machine, and cabinet interiors as well as exteriors. Everything else is identical.",
    tiered: true,
  },
  {
    slug: "room-cleaning",
    seoTitle: "Kitchen & Bathroom Deep Cleaning in Dubai | Haji Ahli",
    seoDescription:
      "Intense deep cleaning for a single kitchen, bathroom or balcony in Dubai. Send a short video and we confirm a fixed price before we come.",
    name: "Single rooms",
    tagline: "Kitchen, bathroom or balcony taken on their own.",
    intro:
      "When the whole property does not need doing, we take one room to the same intensive standard.",
    photo: "kitchenCleaning",
    serviceIds: ["SVC-104", "SVC-105", "SVC-106"],
    chooseHint:
      "Three separate services — pick the room you need. Each is a complete reset of that room, priced on its own.",
  },
  {
    slug: "soft-furnishing",
    seoTitle: "Sofa, Carpet & Mattress Cleaning in Dubai | Haji Ahli",
    seoDescription:
      "Hot-water extraction shampooing for sofas, carpets and mattresses in Dubai. Book several pieces in one visit, with prices per item.",
    name: "Sofas, carpets & mattresses",
    tagline: "Hot-water extraction for upholstery and floors.",
    intro:
      "Deep cleaning and shampooing of soft furnishings using professional extraction equipment, in your home or across a commercial floor.",
    photo: "sofaExtraction",
    serviceIds: ["SVC-107", "SVC-108", "SVC-109"],
    chooseHint: null,
  },
  {
    slug: "curtains-linen",
    seoTitle: "Curtain Cleaning & Steam Ironing in Dubai | Haji Ahli",
    seoDescription:
      "Curtains taken down, laundered and re-fixed, on-site steam ironing, hotel laundry and linen, and curtain supply and stitching across Dubai.",
    name: "Curtains & linen",
    tagline: "Taken down, laundered, steam ironed and re-fixed.",
    intro:
      "The whole cycle handled for you — including the bulky items a domestic machine cannot take.",
    photo: "curtainSteamService",
    serviceIds: ["SVC-110", "SVC-111", "SVC-112", "SVC-407"],
    chooseHint:
      "Curtain cleaning is the full take-down and launder cycle. Steam ironing is done on site with no downtime.",
  },
  {
    slug: "pest-control",
    seoTitle: "Pest Control Services in Dubai | Haji Ahli",
    seoDescription:
      "Treatment for cockroaches, ants, bed bugs, rodents and flying insects in Dubai, plus external perimeter and disinfection. Covered by a three-month warranty.",
    name: "Pest control",
    tagline: "One package covering five pest types, or a single treatment.",
    intro:
      "Our full package treats cockroaches, ants, bed bugs, rodents and flying insects, plus the external perimeter, with three months of follow-up. Individual treatments are also available.",
    photo: "pestControlSpray",
    serviceIds: [
      "SVC-201",
      "SVC-202",
      "SVC-203",
      "SVC-204",
      "SVC-205",
      "SVC-206",
      "SVC-207",
      "SVC-208",
    ],
    chooseHint:
      "Most customers choose the full package — the individual treatments are already inside it, and are listed here for anyone who needs only one.",
  },
  {
    slug: "windows-glass",
    seoTitle: "Window & Glass Cleaning in Dubai | Haji Ahli",
    seoDescription:
      "Internal and external window cleaning for homes and commercial buildings in Dubai, including frames, tracks and high-level facade glazing.",
    name: "Windows & glass",
    tagline: "Internal and external glass, frames and tracks.",
    intro:
      "Streak-free glass for homes and commercial buildings, including high-level and facade glazing using pole and ladder access.",
    photo: "facadeGlassPole",
    serviceIds: ["SVC-115"],
    chooseHint: null,
  },
  {
    slug: "floor-care",
    seoTitle: "Marble Polishing & Floor Restoration in Dubai | Haji Ahli",
    seoDescription:
      "Marble and natural stone restoration in Dubai — grinding, honing, polishing and crystallisation, from a refresh through to full resurfacing.",
    name: "Marble & floor care",
    tagline: "Grinding, honing, polishing and crystallisation.",
    intro:
      "Restoration of marble and natural stone floors — from a crystallisation refresh through to full grinding where the surface is damaged.",
    photo: "marbleFloorPolish",
    serviceIds: ["SVC-113"],
    chooseHint: null,
  },
  {
    slug: "water-tank",
    seoTitle: "Water Tank Cleaning & Disinfection in Dubai | Haji Ahli",
    seoDescription:
      "Draining, cleaning and disinfection of water storage tanks in Dubai, rooftop or underground, with before and after documentation.",
    name: "Water tank cleaning",
    tagline: "Draining, cleaning and disinfection, with documentation.",
    intro:
      "Complete draining, cleaning and disinfection of water storage tanks, with before and after documentation.",
    photo: "waterTankPlantroom",
    serviceIds: ["SVC-301"],
    chooseHint: null,
  },
  {
    slug: "maintenance",
    seoTitle: "Painting, Plumbing & Maintenance Services in Dubai | Haji Ahli",
    seoDescription:
      "Painting, tiling and flooring, plumbing, carpentry and annual maintenance contracts for homes and commercial premises in Dubai. Scoped on site.",
    name: "Maintenance & repairs",
    tagline: "Painting, tiling, plumbing and carpentry.",
    intro:
      "Technical trades for homes and commercial premises. These are scoped on site, so we arrange an inspection rather than a fixed slot.",
    photo: "plumbingService",
    serviceIds: ["SVC-401", "SVC-402", "SVC-403", "SVC-405", "SVC-408"],
    chooseHint: null,
  },
];

const BY_SLUG = new Map(BOOKING_CATEGORIES.map((c) => [c.slug, c]));
const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]));

export const getBookingCategory = (slug: string) => BY_SLUG.get(slug);

export const getCategoryPhoto = (category: BookingCategory) => ALL_PHOTOS[category.photo];

/** Services in a category, in the category's declared order, skipping unknowns. */
export const servicesInCategory = (category: BookingCategory): Service[] =>
  category.serviceIds.map((id) => SERVICE_BY_ID.get(id)).filter((s): s is Service => Boolean(s));

/**
 * Services in the category a customer can actually self-book.
 *
 * `Booking_Type` is authoritative: quote-, inspection- and subscription-based
 * services are scoped on site and must not be offered as a date-pick. Carpet
 * cleaning is the notable case — it sits in a bookable category but is priced
 * per square metre and so is Quote Required.
 */
export const bookableInCategory = (category: BookingCategory): Service[] =>
  servicesInCategory(category).filter(isOnlineBookable);

/** The remainder, which route to an enquiry rather than the calendar. */
export const quotedInCategory = (category: BookingCategory): Service[] =>
  servicesInCategory(category).filter((s) => !isOnlineBookable(s));

/**
 * True when nothing in the category can be self-booked, so the page must show
 * an enquiry panel rather than an empty picker. Maintenance is entirely of
 * this kind — every trade in it is scoped by inspection.
 */
export const isEnquiryCategory = (category: BookingCategory): boolean =>
  bookableInCategory(category).length === 0;

/**
 * The lowest advertised price anywhere in a category, for "from AED x".
 *
 * Null where nothing in the category carries a figure — maintenance and
 * marble are scoped on site, and a category card there has to say so rather
 * than show a number borrowed from a neighbour.
 */
export const categoryFromPrice = (category: BookingCategory) => {
  const prices = servicesInCategory(category)
    .map((s) => priceFrom(s.id))
    .filter((p): p is NonNullable<typeof p> => p !== null);
  if (prices.length === 0) return null;
  return prices.reduce((a, b) => (b.exclusive < a.exclusive ? b : a));
};

/** The category a given service belongs to, if any. */
export const categoryForService = (serviceId: string): BookingCategory | undefined =>
  BOOKING_CATEGORIES.find((c) => c.serviceIds.includes(serviceId));
