/**
 * Photography manifest.
 *
 * Every entry describes what is genuinely visible in the frame — each photo
 * was opened and inspected rather than matched from its filename, and the
 * `alt` text is written from the contents of the image.
 *
 * Derivatives are produced by `scripts/prepare-assets.mjs` from the originals
 * in `haji_ahli_assets/`. Re-run that script after adding or replacing a photo.
 */
export type Photo = {
  key: string;
  /** Largest WebP, used as the `src` fallback. */
  src: string;
  /** JPEG of the same size, for browsers without WebP. */
  fallback: string;
  /** Pre-built `srcSet` string across the generated widths. */
  srcSet: string;
  alt: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  /**
   * CSS `object-position`. These are tall phone photos, so cropping one into a
   * wide frame throws away most of the height — without a focal point the crop
   * lands mid-torso and cuts heads off. Set it to wherever the subject sits.
   * Defaults to "center" when omitted.
   */
  focal?: string;
};

const set = (entries: Array<[string, number]>) =>
  entries.map(([url, w]) => `${url} ${w}w`).join(", ");

import carpet400 from "@/assets/photos/carpet-extraction-400.webp";
import carpet640 from "@/assets/photos/carpet-extraction-640.webp";
import carpet960 from "@/assets/photos/carpet-extraction-960.webp";
import carpetJpg from "@/assets/photos/carpet-extraction-960.jpg";
import facade400 from "@/assets/photos/facade-glass-pole-400.webp";
import facade640 from "@/assets/photos/facade-glass-pole-640.webp";
import facade900 from "@/assets/photos/facade-glass-pole-900.webp";
import facadeJpg from "@/assets/photos/facade-glass-pole-900.jpg";
import hospitality400 from "@/assets/photos/hospitality-floor-detail-400.webp";
import hospitality640 from "@/assets/photos/hospitality-floor-detail-640.webp";
import hospitality900 from "@/assets/photos/hospitality-floor-detail-900.webp";
import hospitalityJpg from "@/assets/photos/hospitality-floor-detail-900.jpg";
import interiorGlass400 from "@/assets/photos/interior-glass-pole-400.webp";
import interiorGlass640 from "@/assets/photos/interior-glass-pole-640.webp";
import interiorGlass900 from "@/assets/photos/interior-glass-pole-900.webp";
import interiorGlassJpg from "@/assets/photos/interior-glass-pole-900.jpg";
import ladder400 from "@/assets/photos/ladder-high-level-access-400.webp";
import ladder640 from "@/assets/photos/ladder-high-level-access-640.webp";
import ladder900 from "@/assets/photos/ladder-high-level-access-900.webp";
import ladderJpg from "@/assets/photos/ladder-high-level-access-900.jpg";
import villaConsole400 from "@/assets/photos/villa-console-detail-400.webp";
import villaConsole640 from "@/assets/photos/villa-console-detail-640.webp";
import villaConsole900 from "@/assets/photos/villa-console-detail-900.webp";
import villaConsoleJpg from "@/assets/photos/villa-console-detail-900.jpg";
import villaExterior400 from "@/assets/photos/villa-exterior-windows-400.webp";
import villaExterior640 from "@/assets/photos/villa-exterior-windows-640.webp";
import villaExterior960 from "@/assets/photos/villa-exterior-windows-960.webp";
import villaExteriorJpg from "@/assets/photos/villa-exterior-windows-960.jpg";
import tank400 from "@/assets/photos/water-tank-plantroom-400.webp";
import tank640 from "@/assets/photos/water-tank-plantroom-640.webp";
import tank780 from "@/assets/photos/water-tank-plantroom-780.webp";
import tankJpg from "@/assets/photos/water-tank-plantroom-780.jpg";
import curtain400 from "@/assets/photos/curtain-steam-clean-400.webp";
import curtain640 from "@/assets/photos/curtain-steam-clean-640.webp";
import curtain780 from "@/assets/photos/curtain-steam-clean-780.webp";
import curtainJpg from "@/assets/photos/curtain-steam-clean-780.jpg";
import rug400 from "@/assets/photos/carpet-shampoo-residence-400.webp";
import rug640 from "@/assets/photos/carpet-shampoo-residence-640.webp";
import rug780 from "@/assets/photos/carpet-shampoo-residence-780.webp";
import rugJpg from "@/assets/photos/carpet-shampoo-residence-780.jpg";
import bedroom400 from "@/assets/photos/carpet-shampoo-bedroom-400.webp";
import bedroom640 from "@/assets/photos/carpet-shampoo-bedroom-640.webp";
import bedroom960 from "@/assets/photos/carpet-shampoo-bedroom-960.webp";
import bedroomJpg from "@/assets/photos/carpet-shampoo-bedroom-960.jpg";
import marble400 from "@/assets/photos/marble-floor-polish-400.webp";
import marble640 from "@/assets/photos/marble-floor-polish-640.webp";
import marble960 from "@/assets/photos/marble-floor-polish-960.webp";
import marbleJpg from "@/assets/photos/marble-floor-polish-960.jpg";
import construction400 from "@/assets/photos/post-construction-vacuum-400.webp";
import construction640 from "@/assets/photos/post-construction-vacuum-640.webp";
import construction900 from "@/assets/photos/post-construction-vacuum-900.webp";
import constructionJpg from "@/assets/photos/post-construction-vacuum-900.jpg";

export const PHOTOS = {
  /** Exterior facade glass cleaning with an extension pole. */
  facadeGlassPole: {
    key: "facadeGlassPole",
    src: facade900,
    fallback: facadeJpg,
    srcSet: set([
      [facade400, 400],
      [facade640, 640],
      [facade900, 900],
    ]),
    alt: "Haji Ahli technician in company uniform cleaning high-level exterior glass on a commercial building using a long extension pole",
    width: 900,
    height: 1600,
    orientation: "portrait",
    focal: "center 55%",
  },

  /** Hotel/office lounge — surface detailing over polished marble. */
  hospitalityFloorDetail: {
    key: "hospitalityFloorDetail",
    src: hospitality900,
    fallback: hospitalityJpg,
    srcSet: set([
      [hospitality400, 400],
      [hospitality640, 640],
      [hospitality900, 900],
    ]),
    alt: "Haji Ahli cleaner wiping down tables in a hotel lounge with polished marble floors and floor-to-ceiling glazing",
    width: 900,
    height: 1600,
    orientation: "portrait",
    focal: "center 38%",
  },

  /** Luxury villa interior detailing. */
  villaConsoleDetail: {
    key: "villaConsoleDetail",
    src: villaConsole900,
    fallback: villaConsoleJpg,
    srcSet: set([
      [villaConsole400, 400],
      [villaConsole640, 640],
      [villaConsole900, 900],
    ]),
    alt: "Haji Ahli cleaner in uniform, mask and gloves detailing a marble console table in a luxury villa living room",
    width: 900,
    height: 1600,
    orientation: "portrait",
    focal: "center 45%",
  },

  /** Ladder access at height, hard hat and hi-vis. */
  ladderHighLevelAccess: {
    key: "ladderHighLevelAccess",
    src: ladder900,
    fallback: ladderJpg,
    srcSet: set([
      [ladder400, 400],
      [ladder640, 640],
      [ladder900, 900],
    ]),
    alt: "Technician in a hard hat and hi-vis vest working from an extension ladder to clean high-level glazing, with a second crew member footing the ladder",
    width: 900,
    height: 1600,
    orientation: "portrait",
    focal: "center 32%",
  },

  /** Internal full-height glass cleaning. */
  interiorGlassPole: {
    key: "interiorGlassPole",
    src: interiorGlass900,
    fallback: interiorGlassJpg,
    srcSet: set([
      [interiorGlass400, 400],
      [interiorGlass640, 640],
      [interiorGlass900, 900],
    ]),
    alt: "Haji Ahli cleaner using a microfibre pole to clean floor-to-ceiling interior glazing in a marble-floored villa",
    width: 900,
    height: 1600,
    orientation: "portrait",
    focal: "center 42%",
  },

  /** Machine carpet extraction — the only such photo in the set. */
  carpetExtraction: {
    key: "carpetExtraction",
    src: carpet960,
    fallback: carpetJpg,
    srcSet: set([
      [carpet400, 400],
      [carpet640, 640],
      [carpet960, 960],
    ]),
    alt: "Three Haji Ahli crew members shampooing commercial carpet with a rotary floor scrubber and industrial wet extraction vacuum",
    width: 960,
    height: 1280,
    orientation: "landscape",
    focal: "center 30%",
  },

  /** Villa exterior windows. Watermark strip cropped in the asset pipeline. */
  villaExteriorWindows: {
    key: "villaExteriorWindows",
    src: villaExterior960,
    fallback: villaExteriorJpg,
    srcSet: set([
      [villaExterior400, 400],
      [villaExterior640, 640],
      [villaExterior960, 960],
    ]),
    alt: "Two Haji Ahli cleaners washing the upper-floor exterior windows of a two-storey villa, one from a balcony and one from a ladder",
    width: 960,
    height: 1130,
    orientation: "landscape",
    focal: "center 35%",
  },
} satisfies Record<string, Photo>;

/** Second batch of company photography. */
const PHOTOS_2 = {
  /** Two technicians in PPE opening a potable water tank in a plant room. */
  waterTankPlantroom: {
    key: "waterTankPlantroom",
    src: tank780,
    fallback: tankJpg,
    srcSet: set([
      [tank400, 400],
      [tank640, 640],
      [tank780, 780],
    ]),
    alt: "Two Haji Ahli technicians in hairnets, masks and gloves opening the access hatch of a water storage tank in a plant room",
    width: 780,
    height: 1040,
    orientation: "portrait",
    focal: "center 42%",
  },

  /** Curtain cleaning in situ — ladder access plus a steam pole. */
  curtainSteamClean: {
    key: "curtainSteamClean",
    src: curtain780,
    fallback: curtainJpg,
    srcSet: set([
      [curtain400, 400],
      [curtain640, 640],
      [curtain780, 780],
    ]),
    alt: "Two Haji Ahli cleaners servicing full-height curtains in a residence, one working from a ladder and one using a steam pole",
    width: 780,
    height: 1040,
    orientation: "portrait",
    focal: "center 40%",
  },

  /** Rotary carpet machine on a large rug in a private residence. */
  carpetShampooResidence: {
    key: "carpetShampooResidence",
    src: rug780,
    fallback: rugJpg,
    srcSet: set([
      [rug400, 400],
      [rug640, 640],
      [rug780, 780],
    ]),
    alt: "Haji Ahli cleaner running a rotary shampoo machine across a large patterned rug in a private residence",
    width: 780,
    height: 1040,
    orientation: "portrait",
    focal: "center 45%",
  },

  /**
   * Fitted carpet treated in a private bedroom.
   * NOTE: framed family photographs are visible in the background — crop or
   * obtain the homeowner's permission before using this prominently.
   */
  carpetShampooBedroom: {
    key: "carpetShampooBedroom",
    src: bedroom960,
    fallback: bedroomJpg,
    srcSet: set([
      [bedroom400, 400],
      [bedroom640, 640],
      [bedroom960, 960],
    ]),
    alt: "Two Haji Ahli cleaners treating fitted carpet in a private bedroom",
    width: 960,
    height: 1280,
    orientation: "portrait",
    focal: "center 45%",
  },
} satisfies Record<string, Photo>;

/** Third batch. */
const PHOTOS_3 = {
  /** Rotary scrubber on wet stone paving outside a villa. */
  marbleFloorPolish: {
    key: "marbleFloorPolish",
    src: marble960,
    fallback: marbleJpg,
    srcSet: set([
      [marble400, 400],
      [marble640, 640],
      [marble960, 960],
    ]),
    alt: "Haji Ahli technician running a rotary floor scrubber across wet stone paving outside a villa",
    width: 960,
    height: 1150,
    orientation: "portrait",
    focal: "center 40%",
  },

  /** Construction dust vacuumed from a floor during fit-out. */
  postConstructionVacuum: {
    key: "postConstructionVacuum",
    src: construction900,
    fallback: constructionJpg,
    srcSet: set([
      [construction400, 400],
      [construction640, 640],
      [construction900, 900],
    ]),
    alt: "Cleaner vacuuming construction dust and debris from a timber floor in a building under fit-out, with a glazed atrium behind",
    width: 900,
    height: 1600,
    orientation: "portrait",
    focal: "center 48%",
  },
} satisfies Record<string, Photo>;

import balconyCleaning400 from "@/assets/photos/balcony-cleaning-400.webp";
import balconyCleaning640 from "@/assets/photos/balcony-cleaning-640.webp";
import balconyCleaning960 from "@/assets/photos/balcony-cleaning-960.webp";
import balconyCleaningJpg from "@/assets/photos/balcony-cleaning-960.jpg";
import bathroomCleaning400 from "@/assets/photos/bathroom-cleaning-400.webp";
import bathroomCleaning640 from "@/assets/photos/bathroom-cleaning-640.webp";
import bathroomCleaning960 from "@/assets/photos/bathroom-cleaning-960.webp";
import bathroomCleaningJpg from "@/assets/photos/bathroom-cleaning-960.jpg";
import kitchenCleaning400 from "@/assets/photos/kitchen-cleaning-400.webp";
import kitchenCleaning640 from "@/assets/photos/kitchen-cleaning-640.webp";
import kitchenCleaning960 from "@/assets/photos/kitchen-cleaning-960.webp";
import kitchenCleaningJpg from "@/assets/photos/kitchen-cleaning-960.jpg";
import paintingService400 from "@/assets/photos/painting-service-400.webp";
import paintingService640 from "@/assets/photos/painting-service-640.webp";
import paintingService960 from "@/assets/photos/painting-service-960.webp";
import paintingServiceJpg from "@/assets/photos/painting-service-960.jpg";
import tilingService400 from "@/assets/photos/tiling-service-400.webp";
import tilingService640 from "@/assets/photos/tiling-service-640.webp";
import tilingService960 from "@/assets/photos/tiling-service-960.webp";
import tilingServiceJpg from "@/assets/photos/tiling-service-960.jpg";
import plumbingService400 from "@/assets/photos/plumbing-service-400.webp";
import plumbingService640 from "@/assets/photos/plumbing-service-640.webp";
import plumbingService960 from "@/assets/photos/plumbing-service-960.webp";
import plumbingServiceJpg from "@/assets/photos/plumbing-service-960.jpg";
import carpentryService400 from "@/assets/photos/carpentry-service-400.webp";
import carpentryService640 from "@/assets/photos/carpentry-service-640.webp";
import carpentryService960 from "@/assets/photos/carpentry-service-960.webp";
import carpentryServiceJpg from "@/assets/photos/carpentry-service-960.jpg";
import sofaExtraction400 from "@/assets/photos/sofa-extraction-400.webp";
import sofaExtraction640 from "@/assets/photos/sofa-extraction-640.webp";
import sofaExtraction960 from "@/assets/photos/sofa-extraction-960.webp";
import sofaExtractionJpg from "@/assets/photos/sofa-extraction-960.jpg";
import officeWasteRound400 from "@/assets/photos/office-waste-round-400.webp";
import officeWasteRound640 from "@/assets/photos/office-waste-round-640.webp";
import officeWasteRound960 from "@/assets/photos/office-waste-round-960.webp";
import officeWasteRoundJpg from "@/assets/photos/office-waste-round-960.jpg";
import officeGlassDoor400 from "@/assets/photos/office-glass-door-400.webp";
import officeGlassDoor640 from "@/assets/photos/office-glass-door-640.webp";
import officeGlassDoor960 from "@/assets/photos/office-glass-door-960.webp";
import officeGlassDoorJpg from "@/assets/photos/office-glass-door-960.jpg";

/** Commissioned imagery for services with no usable photograph. */
const PHOTOS_4 = {
  balconyCleaning: {
    key: "balconyCleaning",
    src: balconyCleaning960,
    fallback: balconyCleaningJpg,
    srcSet: set([
      [balconyCleaning400, 400],
      [balconyCleaning640, 640],
      [balconyCleaning960, 960],
    ]),
    alt: "Haji Ahli cleaner scrubbing a balcony floor with a long-handled brush beside a glass balustrade",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 45%",
  },

  bathroomCleaning: {
    key: "bathroomCleaning",
    src: bathroomCleaning960,
    fallback: bathroomCleaningJpg,
    srcSet: set([
      [bathroomCleaning400, 400],
      [bathroomCleaning640, 640],
      [bathroomCleaning960, 960],
    ]),
    alt: "Haji Ahli cleaner in mask and gloves cleaning shower glass and tiling in a modern bathroom",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 45%",
  },

  kitchenCleaning: {
    key: "kitchenCleaning",
    src: kitchenCleaning960,
    fallback: kitchenCleaningJpg,
    srcSet: set([
      [kitchenCleaning400, 400],
      [kitchenCleaning640, 640],
      [kitchenCleaning960, 960],
    ]),
    alt: "Haji Ahli cleaner degreasing a gas hob and worktop in a fitted kitchen",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 45%",
  },

  paintingService: {
    key: "paintingService",
    src: paintingService960,
    fallback: paintingServiceJpg,
    srcSet: set([
      [paintingService400, 400],
      [paintingService640, 640],
      [paintingService960, 960],
    ]),
    alt: "Haji Ahli painter rolling emulsion onto an interior wall beside a stepladder and dust sheet",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 42%",
  },

  tilingService: {
    key: "tilingService",
    src: tilingService960,
    fallback: tilingServiceJpg,
    srcSet: set([
      [tilingService400, 400],
      [tilingService640, 640],
      [tilingService960, 960],
    ]),
    alt: "Haji Ahli tiler setting large-format wall tiles to a spirit level",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 45%",
  },

  plumbingService: {
    key: "plumbingService",
    src: plumbingService960,
    fallback: plumbingServiceJpg,
    srcSet: set([
      [plumbingService400, 400],
      [plumbingService640, 640],
      [plumbingService960, 960],
    ]),
    alt: "Haji Ahli plumber working on the waste trap under a kitchen sink with an open tool bag",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 45%",
  },

  carpentryService: {
    key: "carpentryService",
    src: carpentryService960,
    fallback: carpentryServiceJpg,
    srcSet: set([
      [carpentryService400, 400],
      [carpentryService640, 640],
      [carpentryService960, 960],
    ]),
    alt: "Haji Ahli carpenter fitting drawer runners inside a built-in oak wardrobe",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 45%",
  },

  sofaExtraction: {
    key: "sofaExtraction",
    src: sofaExtraction960,
    fallback: sofaExtractionJpg,
    srcSet: set([
      [sofaExtraction400, 400],
      [sofaExtraction640, 640],
      [sofaExtraction960, 960],
    ]),
    alt: "Haji Ahli cleaner running a hot-water extraction head across an upholstered sofa in a bedroom",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 45%",
  },

  officeWasteRound: {
    key: "officeWasteRound",
    src: officeWasteRound960,
    fallback: officeWasteRoundJpg,
    srcSet: set([
      [officeWasteRound400, 400],
      [officeWasteRound640, 640],
      [officeWasteRound960, 960],
    ]),
    alt: "Haji Ahli cleaner changing a bin liner in an office pantry",
    width: 960,
    height: 768,
    orientation: "landscape",
    focal: "center 40%",
  },

  officeGlassDoor: {
    key: "officeGlassDoor",
    src: officeGlassDoor960,
    fallback: officeGlassDoorJpg,
    srcSet: set([
      [officeGlassDoor400, 400],
      [officeGlassDoor640, 640],
      [officeGlassDoor960, 960],
    ]),
    alt: "Haji Ahli cleaner polishing a glass entrance door in an office lobby beside a janitorial cart",
    width: 960,
    height: 768,
    orientation: "landscape",
    focal: "center 40%",
  },
} satisfies Record<string, Photo>;

import pestControlSpray400 from "@/assets/photos/pest-control-spray-400.webp";
import pestControlSpray640 from "@/assets/photos/pest-control-spray-640.webp";
import pestControlSpray960 from "@/assets/photos/pest-control-spray-960.webp";
import pestControlSprayJpg from "@/assets/photos/pest-control-spray-960.jpg";
import curtainSteamService400 from "@/assets/photos/curtain-steam-service-400.webp";
import curtainSteamService640 from "@/assets/photos/curtain-steam-service-640.webp";
import curtainSteamService960 from "@/assets/photos/curtain-steam-service-960.webp";
import curtainSteamServiceJpg from "@/assets/photos/curtain-steam-service-960.jpg";

/** Latest commissioned set. */
const PHOTOS_5 = {
  pestControlSpray: {
    key: "pestControlSpray",
    src: pestControlSpray960,
    fallback: pestControlSprayJpg,
    srcSet: set([
      [pestControlSpray400, 400],
      [pestControlSpray640, 640],
      [pestControlSpray960, 960],
    ]),
    alt: "Haji Ahli technician applying a residual pest treatment along the skirting of a residential hallway with a pressure sprayer",
    width: 960,
    height: 1279,
    orientation: "portrait",
    focal: "center 48%",
  },

  curtainSteamService: {
    key: "curtainSteamService",
    src: curtainSteamService960,
    fallback: curtainSteamServiceJpg,
    srcSet: set([
      [curtainSteamService400, 400],
      [curtainSteamService640, 640],
      [curtainSteamService960, 960],
    ]),
    alt: "Haji Ahli technician steam-cleaning full-height curtains in situ with a professional steam unit",
    width: 960,
    height: 768,
    orientation: "landscape",
    focal: "center 42%",
  },
} satisfies Record<string, Photo>;

export const ALL_PHOTOS = { ...PHOTOS, ...PHOTOS_2, ...PHOTOS_3, ...PHOTOS_4, ...PHOTOS_5 };
export type PhotoKey = keyof typeof ALL_PHOTOS;

export const getPhoto = (key: string | null): Photo | null =>
  key && key in ALL_PHOTOS ? ((ALL_PHOTOS as Record<string, Photo>)[key] ?? null) : null;
