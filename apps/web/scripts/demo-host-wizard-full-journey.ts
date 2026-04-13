/**
 * Demo: mirrors `/host/listings/new` HostSevenStepWizard data path (steps 1→7) using the same
 * server primitives as the API routes — no browser, no card data (PCI).
 *
 * Important:
 * - Creating/publishing a listing does NOT charge Stripe; BNHUB guest booking checkout does.
 * - Publish may roll back to DRAFT if mandatory verification / host agreement gates fail (expected on partial seeds).
 *
 * Run from apps/web (requires DATABASE_URL):
 *   pnpm run demo:host-wizard
 *
 * Then validate Stripe booking payment plumbing (test mode + signed webhook, no PAN):
 *   pnpm run validate:bnhub-stripe
 *
 * Or both:
 *   pnpm run demo:host-wizard:all
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { ListingStatus } from "@prisma/client";
import { prisma } from "../lib/db";
import { createListing, updateListing, type CreateListingData } from "../lib/bnhub/listings";
import { postCreateShortTermListingFlow } from "../lib/bnhub/post-create-short-term-listing";

config({ path: resolve(process.cwd(), ".env"), override: true });

const runId = `wiz-${Date.now()}`;
const DEMO_EMAIL = process.env.DEMO_HOST_WIZARD_EMAIL?.trim() || "host@demo.com";

function log(step: string, detail?: string) {
  console.log(`[demo] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  log("start", `runId=${runId} user=${DEMO_EMAIL}`);

  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, name: true },
  });
  if (!user?.id) {
    console.error(`No user with email ${DEMO_EMAIL}. Seed the DB or set DEMO_HOST_WIZARD_EMAIL.`);
    process.exit(1);
  }

  const title = `Demo wizard ${runId}`;
  const city = "Montreal";
  const address = "1 Demo St, Montreal, QC, Canada";

  log("step 1", "draft / basics (createListing)");
  const createPayload: CreateListingData = {
    ownerId: user.id,
    title,
    description: "",
    address,
    city,
    region: "QC",
    country: "CA",
    currency: "CAD",
    nightPriceCents: 13_900,
    propertyType: "Apartment",
    roomType: "Entire place",
    beds: 2,
    bedrooms: 2,
    baths: 1.5,
    maxGuests: 4,
    photos: [],
    amenities: [],
    listingStatus: "DRAFT",
    listingAuthorityType: "OWNER",
  };

  let listing = await createListing(createPayload, { skipHostAgreement: true });
  log("draft created", listing.id);

  log("step 2", "space (patch — same fields as wizard step 2)");
  listing = await updateListing(listing.id, {
    maxGuests: 5,
    bedrooms: 2,
    beds: 2,
    baths: 2,
  });
  log("space ok", `maxGuests=${listing.maxGuests}`);

  log("step 3", "photos (seed one BnhubListingPhoto — matches “has images” gate)");
  await prisma.bnhubListingPhoto.deleteMany({ where: { listingId: listing.id } });
  await prisma.bnhubListingPhoto.create({
    data: {
      listingId: listing.id,
      url: `https://picsum.photos/seed/${encodeURIComponent(runId)}/1200/800`,
      sortOrder: 0,
      isCover: true,
    },
  });
  log("photo row ok", "1 cover image");

  log("step 4", "amenities");
  listing = await updateListing(listing.id, {
    amenities: ["WiFi", "Kitchen", "Parking"],
  });
  log("amenities ok", JSON.stringify(listing.amenities));

  log("step 5", "price");
  listing = await updateListing(listing.id, {
    nightPriceCents: 199_00,
  });
  log("price ok", `$${(listing.nightPriceCents / 100).toFixed(2)}/night`);

  log("step 6", "description");
  const description =
    "Demo stay description for wizard journey — at least twenty chars for typical validation rules.";
  listing = await updateListing(listing.id, { description });
  log("description ok", `${description.length} chars`);

  log("step 7", "publish (same as POST /api/host/listings/:id/publish)");
  await updateListing(listing.id, { listingStatus: ListingStatus.PUBLISHED });
  listing = await prisma.shortTermListing.findUniqueOrThrow({ where: { id: listing.id } });

  const flow = await postCreateShortTermListingFlow({
    listing,
    ownerId: user.id,
    address: listing.address,
    city: listing.city,
    region: listing.region,
    country: listing.country,
    cadastreNumber: listing.cadastreNumber,
    municipality: listing.municipality,
    province: listing.province,
    latitude: listing.latitude,
    longitude: listing.longitude,
    propertyType: listing.propertyType,
    source: "demo_host_wizard_script",
  });

  listing = flow.listing;
  if (flow.publishError) {
    log("publish gate", `rolled back or blocked: ${flow.publishError}`);
    if (flow.publishReasons?.length) {
      log("reasons", flow.publishReasons.join(" | "));
    }
  } else {
    log("publish ok", `status=${listing.listingStatus}`);
  }

  log("done", `wizard data path exercised (listing id=${listing.id})`);
  if (process.env.DEMO_WIZARD_CLEANUP === "1") {
    log("cleanup", "DEMO_WIZARD_CLEANUP=1 — remove listing after engine settles (~5s)");
    await new Promise((r) => setTimeout(r, 5000));
    await prisma.shortTermListing.delete({ where: { id: listing.id } }).catch(() => {});
    log("cleanup", "removed (best-effort)");
  } else {
    console.log(
      "\nTip: demo listing left in DB (async BNHUB engines may still touch it). Set DEMO_WIZARD_CLEANUP=1 to delete after a delay, or remove the row in admin.",
    );
  }

  console.log("\n---");
  console.log("Next: BNHUB Stripe (booking payment in test mode, no PAN in this repo):");
  console.log("  pnpm run validate:bnhub-stripe");
  console.log("Requires STRIPE_SECRET_KEY=sk_test_* and STRIPE_WEBHOOK_SECRET=whsec_* and Next on BNHUB_STRIPE_E2E_BASE_URL (default http://127.0.0.1:3001).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
