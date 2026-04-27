/**
 * Merges prisma/enums.prisma + prisma/models.prisma into prisma/schema.prisma
 * and strips relation fields to models not in this module (e.g. User, Tenant, Lead, …)
 * and drops [] reverse fields when the child model is missing.
 * Appends marketplace `Booking` + `MarketplacePaymentLedger` and patches CRM `Listing`
 * (@@map + bookings relation).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const prismaDir = path.join(root, "prisma");

const SCALAR = new Set([
  "String",
  "Int",
  "BigInt",
  "Float",
  "Boolean",
  "DateTime",
  "Json",
  "Decimal",
  "Bytes",
]);

function isScalarType(b) {
  if (SCALAR.has(b)) return true;
  if (b.startsWith("Unsupported")) return true;
  return false;
}

function baseTypeName(typeToken) {
  if (!typeToken) return "";
  return typeToken
    .replace(/\[\]$/g, "")
    .replace(/\?$/g, "")
    .replace(/@.*/g, "")
    .trim();
}

function isModelishRefTypeToken(typeToken) {
  const b = baseTypeName(typeToken);
  if (!b || !/^[A-Z]/.test(b)) return false;
  if (isScalarType(b)) return false;
  return true;
}

function readEnumNames(text) {
  const out = new Set();
  for (const line of text.split("\n")) {
    const m = line.match(/^enum\s+(\S+)\s*\{?\s*$/);
    if (m) out.add(m[1]);
  }
  return out;
}

function readModelNames(text) {
  const out = new Set();
  for (const line of text.split(/\n/)) {
    const m = line.match(/^model\s+(\S+)\s*\{?\s*$/);
    if (m) out.add(m[1]);
  }
  return out;
}

/**
 * @param {string} line
 * @param {Set<string>} localModelNames
 * @param {Set<string>} enumNames
 */
function shouldDropFieldLine(line, localModelNames, enumNames) {
  const t = line.trim();
  if (t.startsWith("@@") || t.startsWith("///") || t.startsWith("//")) return false;
  if (!t) return false;
  if (t === "}") return false;

  if (line.includes("@relation(")) {
    const m = line.match(/^\s+\S+\s+(\S+?)(?:\s+@relation\()/);
    if (!m) return false;
    const b = baseTypeName(m[1]);
    if (b === "User") return true;
    if (isModelishRefTypeToken(m[1]) && !localModelNames.has(b)) return true;
    return false;
  }

  if (line.includes("[]") && !line.includes("@relation")) {
    const m2 = line.match(/^\s+\S+\s+(\S+)/);
    if (!m2) return false;
    const typeTok = m2[1];
    if (isModelishRefTypeToken(typeTok)) {
      const b = baseTypeName(typeTok);
      if (!localModelNames.has(b) && !enumNames.has(b) && !isScalarType(b)) return true;
    }
    return false;
  }

  // 1:1 optional side, no @relation: `  a GreenProject?` or `  a GreenProject?  @map(...)`
  if (!line.includes("@relation") && !line.includes("[]")) {
    const m3 = line.match(/^\s+\S+\s+([A-Z][A-Za-z0-9_]*\?)(?:\s|@|\/\/|$)(.*)/);
    if (m3) {
      const typeTok = m3[1];
      const b = baseTypeName(typeTok);
      if (isModelishRefTypeToken(typeTok) && !localModelNames.has(b) && !enumNames.has(b) && !isScalarType(b)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * @param {string} modelsText
 */
function patchListingModel(modelsText) {
  const start = modelsText.indexOf("model Listing {");
  if (start === -1) {
    throw new Error("model Listing { not found in merged models");
  }
  const open = start + "model Listing {".length;
  let depth = 1;
  let end = -1;
  for (let j = open; j < modelsText.length; j += 1) {
    if (modelsText[j] === "{") depth += 1;
    if (modelsText[j] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = j;
        break;
      }
    }
  }
  if (end === -1) throw new Error("unclosed model Listing");
  const before = modelsText.slice(0, start);
  const after = modelsText.slice(end + 1);
  let body = modelsText.slice(open, end);
  if (!/\bbookings\s+Booking\[\]/.test(body)) {
    const repl = body.replace(
      /\n  @@index\(\[ownerId\]\)/,
      '\n  bookings        Booking[]\n\n  @@map("listings")\n  @@index([ownerId])',
    );
    if (repl !== body) {
      body = repl;
    } else {
      body = body.replace(
        /(\n)(\s*@@index\()/,
        "\n  bookings        Booking[]\n\n  @@map(\"listings\")$1$2",
      );
    }
  } else if (!body.includes('@@map("listings")')) {
    body = body.replace(
      /\n  @@index\(\[ownerId\]\)/,
      '\n  @@map("listings")\n  @@index([ownerId])',
    );
  }
  return before + "model Listing {" + body + "}" + after;
}

function build() {
  const modelsPath = path.join(prismaDir, "models.prisma");
  const enumsPath = path.join(prismaDir, "enums.prisma");
  const outPath = path.join(prismaDir, "schema.prisma");

  const modelsText = fs.readFileSync(modelsPath, "utf8");
  const enumsText = fs.readFileSync(enumsPath, "utf8");

  // Shard only — do not pre-register `Booking` so `ShortTermListing.bookings Booking[]` (BNHub) is stripped.
  const localModelNames = new Set(readModelNames(modelsText));

  const enumNames = readEnumNames(enumsText);

  const appends = `
// --- Appended: residential marketplace (same tables as @repo/db-marketplace) ---
// Relation-safe: no User; FK via userId only.
// @domain: marketplace
model Booking {
  id        String   @id @default(cuid())
  listingId String   @map("listing_id")
  /// FK to \`users.id\` — no \`User\` relation (cross-client).
  userId    String   @map("user_id")
  startDate DateTime @db.Date @map("start_date")
  endDate   DateTime @db.Date @map("end_date")
  status     String    @default("pending")
  expiresAt  DateTime? @map("expires_at")
  cancelledAt            DateTime? @map("cancelled_at")
  /// Order 59.1: none | pending | completed | failed
  refundStatus            String   @default("none") @map("refund_status")
  /// Cumulative Stripe refunds in minor units (partial cancel-safe).
  refundedAmountCents     Int      @default(0) @map("refunded_amount_cents")
  /// Order 65 — snapshot at checkout/confirm: stay subtotal, 10% platform fee, final charge, night count.
  subtotalCents  Int?     @map("subtotal_cents")
  feeCents       Int?     @map("fee_cents")
  finalCents     Int?     @map("final_cents")
  nights         Int?     @map("nights")
  /// Order 61 — audit trail: nightly prices + reasons (JSON).
  pricingSnapshot Json?   @map("pricing_snapshot")
  stripePaymentIntentId  String?   @map("stripe_payment_intent_id")
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  listing Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId, startDate, endDate], map: "bookings_user_listing_stay_unique")
  @@index([listingId])
  @@index([listingId, startDate, endDate])
  @@index([status, expiresAt])
  @@map("bookings")
}

/// Order 67 — append-only row per successful Stripe Checkout session
model MarketplacePaymentLedger {
  id                      String   @id @default(cuid())
  listingId               String?  @map("listing_id")
  bookingId               String?  @map("booking_id")
  amountCents             Int      @map("amount_cents")
  applicationFeeCents     Int      @default(0) @map("application_fee_cents")
  stripePaymentIntentId  String?   @map("stripe_payment_intent_id")
  stripeCheckoutSessionId String  @unique @map("stripe_checkout_session_id")
  destinationAccountId    String?  @map("destination_account_id")
  createdAt               DateTime @default(now()) @map("created_at")

  @@index([bookingId])
  @@index([listingId])
  @@map("marketplace_payment_ledger")
}
`.trim();

  const outLines = [];
  for (const line of modelsText.split(/\n/)) {
    if (shouldDropFieldLine(line, localModelNames, enumNames)) {
      continue;
    }
    outLines.push(line);
  }

  let mergedModels = outLines.join("\n");
  mergedModels = patchListingModel(mergedModels);
  mergedModels = mergedModels.trim() + "\n\n" + appends + "\n";

  const enumsBlock = enumsText
    .split("\n")
    .filter((line) => {
      if (line.includes("AUTO-GENERATED") && line.trim().startsWith("//")) return false;
      if (line.includes("Prisma has no include") && line.trim().startsWith("//")) return false;
      return true;
    })
    .join("\n")
    .trim();

  const header = `// Built by scripts/build-schema.mjs — do not hand-edit; run \`node scripts/build-schema.mjs\`
generator client {
  provider   = "prisma-client-js"
  engineType = "binary"
  output     = "../generated/client"
}

datasource db {
  provider = "postgresql"
}

`;

  const final =
    header +
    "\n" +
    enumsBlock +
    "\n\n" +
    mergedModels +
    "\n";

  fs.writeFileSync(outPath, final, "utf8");
  console.log("Wrote", outPath, `(${Math.round(final.length / 1024)} KB)`);
}

build();
