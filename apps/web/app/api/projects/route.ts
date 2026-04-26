import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DEMO_PROJECTS } from "@/lib/data/demo-projects";
import { getTrialEndDate } from "@/lib/projects-pricing";
import { isFeaturedEffective, sortProjectsByFeaturedAndPremium } from "@/lib/projects-featured";
import { logError } from "@/lib/logger";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const status = searchParams.get("status");
    const deliveryYear = searchParams.get("deliveryYear");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const category = searchParams.get("category")?.trim() || undefined;   // residential | commercial
    const listingType = searchParams.get("listingType")?.trim() || undefined; // for-sale | for-rent
    const featuredOnly = searchParams.get("featuredOnly") === "true";
    const unitType = searchParams.get("unitType")?.trim() || undefined;
    const bedroomsMin = searchParams.get("bedroomsMin");
    const bathroomsMin = searchParams.get("bathroomsMin");
    const garageCount = searchParams.get("garageCount");
    const parkingOutside = searchParams.get("parkingOutside");
    const storageUnit = searchParams.get("storageUnit") === "true";
    const pool = searchParams.get("pool") === "true";
    const elevator = searchParams.get("elevator") === "true";
    const adaptedMobility = searchParams.get("adaptedMobility") === "true";
    const waterfront = searchParams.get("waterfront") === "true";
    const waterAccess = searchParams.get("waterAccess") === "true";
    const navigableWater = searchParams.get("navigableWater") === "true";
    const resort = searchParams.get("resort") === "true";
    const petsAllowed = searchParams.get("petsAllowed") === "true";
    const smokingAllowed = searchParams.get("smokingAllowed") === "true";
    const livingAreaMin = searchParams.get("livingAreaMin");
    const livingAreaMax = searchParams.get("livingAreaMax");
    const constructionYearMin = searchParams.get("constructionYearMin");
    const constructionYearMax = searchParams.get("constructionYearMax");
    const newConstruction = searchParams.get("newConstruction") === "true";
    const centuryHistoric = searchParams.get("centuryHistoric") === "true";
    const bungalow = searchParams.get("bungalow") === "true";
    const multiStorey = searchParams.get("multiStorey") === "true";
    const splitLevel = searchParams.get("splitLevel") === "true";
    const detached = searchParams.get("detached") === "true";
    const semiDetached = searchParams.get("semiDetached") === "true";
    const attached = searchParams.get("attached") === "true";
    const plexType = searchParams.get("plexType")?.trim() || undefined;
    const landAreaMin = searchParams.get("landAreaMin");
    const landAreaMax = searchParams.get("landAreaMax");
    const newSince = searchParams.get("newSince")?.trim() || undefined;
    const moveInDate = searchParams.get("moveInDate")?.trim() || undefined;
    const openHouses = searchParams.get("openHouses") === "true";
    const repossession = searchParams.get("repossession") === "true";
    const pedestrianFriendly = searchParams.get("pedestrianFriendly") === "true";
    const transitFriendly = searchParams.get("transitFriendly") === "true";
    const carFriendly = searchParams.get("carFriendly") === "true";
    const groceryNearby = searchParams.get("groceryNearby") === "true";
    const primarySchoolsNearby = searchParams.get("primarySchoolsNearby") === "true";
    const secondarySchoolsNearby = searchParams.get("secondarySchoolsNearby") === "true";
    const daycaresNearby = searchParams.get("daycaresNearby") === "true";
    const restaurantsNearby = searchParams.get("restaurantsNearby") === "true";
    const cafesNearby = searchParams.get("cafesNearby") === "true";
    const nightlifeNearby = searchParams.get("nightlifeNearby") === "true";
    const shoppingNearby = searchParams.get("shoppingNearby") === "true";
    const quiet = searchParams.get("quiet") === "true";
    const vibrant = searchParams.get("vibrant") === "true";
    const q = searchParams.get("q")?.trim();
    const sort = searchParams.get("sort") === "priceAsc" || searchParams.get("sort") === "priceDesc"
      ? searchParams.get("sort")
      : "newest";

    const orderBy =
      sort === "priceAsc"
        ? [{ startingPrice: "asc" as const }]
        : sort === "priceDesc"
          ? [{ startingPrice: "desc" as const }]
          : [{ createdAt: "desc" as const }];

    const projects = await prisma.project.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
                { developer: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
        ...(category === "commercial"
          ? { category: { equals: "commercial", mode: "insensitive" } }
          : category === "residential"
            ? { OR: [{ category: { equals: "residential", mode: "insensitive" } }, { category: null }] }
            : {}),
        ...(listingType === "for-rent"
          ? { listingType: { equals: "for-rent", mode: "insensitive" } }
          : listingType === "for-sale"
            ? { OR: [{ listingType: { equals: "for-sale", mode: "insensitive" } }, { listingType: null }] }
            : {}),
        ...(searchParams.get("propertyType")?.trim()
          ? { propertyType: { equals: searchParams.get("propertyType")!.trim(), mode: "insensitive" } }
          : {}),
        ...(status ? { status } : {}),
        ...(deliveryYear
          ? {
              deliveryDate: {
                gte: new Date(`${deliveryYear}-01-01`),
                lt: new Date(`${Number(deliveryYear) + 1}-01-01`),
              },
            }
          : {}),
        ...(priceMin != null && priceMin !== "" && (priceMax == null || priceMax === "")
          ? { startingPrice: { gte: Number(priceMin) } }
          : {}),
        ...(priceMax != null && priceMax !== "" && (priceMin == null || priceMin === "")
          ? { startingPrice: { lte: Number(priceMax) } }
          : {}),
        ...(priceMin != null && priceMin !== "" && priceMax != null && priceMax !== ""
          ? { startingPrice: { gte: Number(priceMin), lte: Number(priceMax) } }
          : {}),
        ...(unitType
          ? { units: { some: { type: { equals: unitType, mode: "insensitive" } } } }
          : {}),
        ...(bedroomsMin != null && bedroomsMin !== "" ? { bedroomsMin: { gte: Number(bedroomsMin) } } : {}),
        ...(bathroomsMin != null && bathroomsMin !== "" ? { bathroomsMin: { gte: Number(bathroomsMin) } } : {}),
        ...(garageCount != null && garageCount !== "" ? { garageCount: { gte: Number(garageCount) } } : {}),
        ...(parkingOutside != null && parkingOutside !== "" ? { parkingOutside: { gte: Number(parkingOutside) } } : {}),
        ...(storageUnit ? { storageUnit: true } : {}),
        ...(pool ? { pool: true } : {}),
        ...(elevator ? { elevator: true } : {}),
        ...(adaptedMobility ? { adaptedMobility: true } : {}),
        ...(waterfront ? { waterfront: true } : {}),
        ...(waterAccess ? { waterAccess: true } : {}),
        ...(navigableWater ? { navigableWater: true } : {}),
        ...(resort ? { resort: true } : {}),
        ...(petsAllowed ? { petsAllowed: true } : {}),
        ...(smokingAllowed ? { smokingAllowed: true } : {}),
        ...(livingAreaMin != null && livingAreaMin !== "" ? { livingAreaMax: { gte: Number(livingAreaMin) } } : {}),
        ...(livingAreaMax != null && livingAreaMax !== "" ? { livingAreaMin: { lte: Number(livingAreaMax) } } : {}),
        ...(constructionYearMin != null && constructionYearMin !== "" ? { constructionYearMax: { gte: Number(constructionYearMin) } } : {}),
        ...(constructionYearMax != null && constructionYearMax !== "" ? { constructionYearMin: { lte: Number(constructionYearMax) } } : {}),
        ...(newConstruction ? { newConstruction: true } : {}),
        ...(centuryHistoric ? { centuryHistoric: true } : {}),
        ...(bungalow ? { bungalow: true } : {}),
        ...(multiStorey ? { multiStorey: true } : {}),
        ...(splitLevel ? { splitLevel: true } : {}),
        ...(detached ? { detached: true } : {}),
        ...(semiDetached ? { semiDetached: true } : {}),
        ...(attached ? { attached: true } : {}),
        ...(plexType ? { plexType: { equals: plexType, mode: "insensitive" } } : {}),
        ...(landAreaMin != null && landAreaMin !== "" ? { landAreaMax: { gte: Number(landAreaMin) } } : {}),
        ...(landAreaMax != null && landAreaMax !== "" ? { landAreaMin: { lte: Number(landAreaMax) } } : {}),
        ...(newSince ? { newSince: { gte: new Date(newSince) } } : {}),
        ...(moveInDate ? { moveInDate: { gte: new Date(moveInDate) } } : {}),
        ...(openHouses ? { openHouses: true } : {}),
        ...(repossession ? { repossession: true } : {}),
        ...(pedestrianFriendly ? { pedestrianFriendly: true } : {}),
        ...(transitFriendly ? { transitFriendly: true } : {}),
        ...(carFriendly ? { carFriendly: true } : {}),
        ...(groceryNearby ? { groceryNearby: true } : {}),
        ...(primarySchoolsNearby ? { primarySchoolsNearby: true } : {}),
        ...(secondarySchoolsNearby ? { secondarySchoolsNearby: true } : {}),
        ...(daycaresNearby ? { daycaresNearby: true } : {}),
        ...(restaurantsNearby ? { restaurantsNearby: true } : {}),
        ...(cafesNearby ? { cafesNearby: true } : {}),
        ...(nightlifeNearby ? { nightlifeNearby: true } : {}),
        ...(shoppingNearby ? { shoppingNearby: true } : {}),
        ...(quiet ? { quiet: true } : {}),
        ...(vibrant ? { vibrant: true } : {}),
      },
      include: {
        units: true,
        subscription: true,
      },
      orderBy,
    });

    let result = projects;
    if (result.length === 0) {
      result = DEMO_PROJECTS as unknown as typeof projects;
    }

    if (featuredOnly) {
      result = result.filter((p) => isFeaturedEffective(p));
    }
    result = sortProjectsByFeaturedAndPremium(result);

    if (process.env.NEXT_PUBLIC_ENV === "staging") {
      const filters = Object.fromEntries(
        [...searchParams.entries()].filter(([k, v]) => v !== "" && k !== "sort")
      );
      const resultsCount = result.length;
      if (q) {
        void trackDemoEvent(DemoEvents.SEARCH, { query: q, filters, resultsCount }, undefined);
      } else if (Object.keys(filters).length > 0) {
        void trackDemoEvent(DemoEvents.FILTER, { filters, resultsCount }, undefined);
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    logError("GET /api/projects", e);
    return NextResponse.json(DEMO_PROJECTS, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      name,
      description,
      city,
      address,
      developer,
      deliveryDate,
      startingPrice,
      status = "upcoming",
      propertyType,
      category,
      listingType,
      heroImage,
      bedroomsMin,
      bathroomsMin,
      garageCount,
      parkingOutside,
      storageUnit,
      pool,
      elevator,
      adaptedMobility,
      waterfront,
      waterAccess,
      navigableWater,
      resort,
      petsAllowed,
      smokingAllowed,
      livingAreaMin,
      livingAreaMax,
      constructionYearMin,
      constructionYearMax,
      newConstruction,
      centuryHistoric,
      bungalow,
      multiStorey,
      splitLevel,
      detached,
      semiDetached,
      attached,
      plexType,
      landAreaMin,
      landAreaMax,
      newSince,
      moveInDate,
      openHouses,
      repossession,
      pedestrianFriendly,
      transitFriendly,
      carFriendly,
      groceryNearby,
      primarySchoolsNearby,
      secondarySchoolsNearby,
      daycaresNearby,
      restaurantsNearby,
      cafesNearby,
      nightlifeNearby,
      shoppingNearby,
      quiet,
      vibrant,
    } = body;
    if (!name || !city || !address || !developer) {
      return NextResponse.json(
        { error: "Missing required fields: name, city, address, developer" },
        { status: 400 }
      );
    }
    const trialEnd = getTrialEndDate();
    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? "",
        city,
        address,
        developer,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        startingPrice: typeof startingPrice === "number" ? startingPrice : 0,
        status: status || "upcoming",
        propertyType: propertyType && /^[a-z0-9-]+$/.test(propertyType) ? propertyType : null,
        category: category && (category === "residential" || category === "commercial") ? category : null,
        listingType: listingType && (listingType === "for-sale" || listingType === "for-rent") ? listingType : null,
        heroImage: heroImage ?? null,
        bedroomsMin: bedroomsMin != null && Number.isInteger(Number(bedroomsMin)) ? Number(bedroomsMin) : null,
        bathroomsMin: bathroomsMin != null && Number.isInteger(Number(bathroomsMin)) ? Number(bathroomsMin) : null,
        garageCount: garageCount != null && Number.isInteger(Number(garageCount)) ? Number(garageCount) : null,
        parkingOutside: parkingOutside != null && Number.isInteger(Number(parkingOutside)) ? Number(parkingOutside) : null,
        storageUnit: storageUnit === true || storageUnit === "true" ? true : null,
        pool: pool === true || pool === "true" ? true : null,
        elevator: elevator === true || elevator === "true" ? true : null,
        adaptedMobility: adaptedMobility === true || adaptedMobility === "true" ? true : null,
        waterfront: waterfront === true || waterfront === "true" ? true : null,
        waterAccess: waterAccess === true || waterAccess === "true" ? true : null,
        navigableWater: navigableWater === true || navigableWater === "true" ? true : null,
        resort: resort === true || resort === "true" ? true : null,
        petsAllowed: petsAllowed === true || petsAllowed === "true" ? true : null,
        smokingAllowed: smokingAllowed === true || smokingAllowed === "true" ? true : null,
        livingAreaMin: livingAreaMin != null && Number.isInteger(Number(livingAreaMin)) ? Number(livingAreaMin) : null,
        livingAreaMax: livingAreaMax != null && Number.isInteger(Number(livingAreaMax)) ? Number(livingAreaMax) : null,
        constructionYearMin: constructionYearMin != null && Number.isInteger(Number(constructionYearMin)) ? Number(constructionYearMin) : null,
        constructionYearMax: constructionYearMax != null && Number.isInteger(Number(constructionYearMax)) ? Number(constructionYearMax) : null,
        newConstruction: newConstruction === true || newConstruction === "true" ? true : null,
        centuryHistoric: centuryHistoric === true || centuryHistoric === "true" ? true : null,
        bungalow: bungalow === true || bungalow === "true" ? true : null,
        multiStorey: multiStorey === true || multiStorey === "true" ? true : null,
        splitLevel: splitLevel === true || splitLevel === "true" ? true : null,
        detached: detached === true || detached === "true" ? true : null,
        semiDetached: semiDetached === true || semiDetached === "true" ? true : null,
        attached: attached === true || attached === "true" ? true : null,
        plexType: plexType && ["duplex", "triplex", "quadruplex", "quintuplex"].includes(String(plexType).toLowerCase()) ? String(plexType).toLowerCase() : null,
        landAreaMin: landAreaMin != null && Number.isInteger(Number(landAreaMin)) ? Number(landAreaMin) : null,
        landAreaMax: landAreaMax != null && Number.isInteger(Number(landAreaMax)) ? Number(landAreaMax) : null,
        newSince: newSince ? new Date(newSince) : null,
        moveInDate: moveInDate ? new Date(moveInDate) : null,
        openHouses: openHouses === true || openHouses === "true" ? true : null,
        repossession: repossession === true || repossession === "true" ? true : null,
        pedestrianFriendly: pedestrianFriendly === true || pedestrianFriendly === "true" ? true : null,
        transitFriendly: transitFriendly === true || transitFriendly === "true" ? true : null,
        carFriendly: carFriendly === true || carFriendly === "true" ? true : null,
        groceryNearby: groceryNearby === true || groceryNearby === "true" ? true : null,
        primarySchoolsNearby: primarySchoolsNearby === true || primarySchoolsNearby === "true" ? true : null,
        secondarySchoolsNearby: secondarySchoolsNearby === true || secondarySchoolsNearby === "true" ? true : null,
        daycaresNearby: daycaresNearby === true || daycaresNearby === "true" ? true : null,
        restaurantsNearby: restaurantsNearby === true || restaurantsNearby === "true" ? true : null,
        cafesNearby: cafesNearby === true || cafesNearby === "true" ? true : null,
        nightlifeNearby: nightlifeNearby === true || nightlifeNearby === "true" ? true : null,
        shoppingNearby: shoppingNearby === true || shoppingNearby === "true" ? true : null,
        quiet: quiet === true || quiet === "true" ? true : null,
        vibrant: vibrant === true || vibrant === "true" ? true : null,
        subscription: {
          create: {
            isTrial: true,
            trialEnd,
            plan: "free",
            isActive: true,
          },
        },
      },
      include: {
        units: true,
        subscription: true,
      },
    });
    return NextResponse.json(project);
  } catch (e) {
    logError("POST /api/projects", e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
