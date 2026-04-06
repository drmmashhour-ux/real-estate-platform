import { NextResponse } from "next/server";
import {
  ListingAcquisitionSourceType,
  ListingAcquisitionPermissionStatus,
  ListingAcquisitionIntakeStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { normalizeListingDescription } from "@/lib/listings/normalize-listing-description";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/listing-acquisition/import-csv
 * Restricted: each row must represent data the submitter owns or has permission to share.
 * Body: { csvText: string } — header row required.
 * Columns: contactName, contactEmail, city, propertyCategory, sourceType (OWNER|BROKER|HOST|MANUAL),
 * optional: contactPhone, description, amenitiesText, priceCents, bedrooms, bathrooms, sourcePlatformText, permissionConfirmed (true/false/yes/no)
 */
export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { csvText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const csvText = typeof body.csvText === "string" ? body.csvText.trim() : "";
  if (!csvText) {
    return NextResponse.json({ error: "csvText required" }, { status: 400 });
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must include header + at least one row" }, { status: 400 });
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const required = ["contactname", "contactemail", "city", "propertycategory", "sourcetype"];
  for (const r of required) {
    if (idx(r) < 0) {
      return NextResponse.json({ error: `Missing column: ${r}` }, { status: 400 });
    }
  }

  function parseRow(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        q = !q;
      } else if ((c === "," && !q) || (c === "\n" && !q)) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    out.push(cur.trim());
    return out;
  }

  let created = 0;
  const errors: string[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = parseRow(lines[r]);
    const get = (h: string) => {
      const i = idx(h);
      return i >= 0 ? (cells[i] ?? "").trim() : "";
    };

    const contactName = get("contactname");
    const contactEmail = get("contactemail").toLowerCase();
    const city = get("city");
    const propertyCategory = get("propertycategory");
    const st = get("sourcetype").toUpperCase();
    const sourceType =
      st === "OWNER"
        ? ListingAcquisitionSourceType.OWNER
        : st === "BROKER"
          ? ListingAcquisitionSourceType.BROKER
          : st === "HOST"
            ? ListingAcquisitionSourceType.HOST
            : st === "MANUAL"
              ? ListingAcquisitionSourceType.MANUAL
              : null;

    if (!contactName || !contactEmail || !city || !propertyCategory || !sourceType) {
      errors.push(`Row ${r + 1}: missing required fields`);
      continue;
    }

    const permRaw = get("permissionconfirmed").toLowerCase();
    const permissionGranted = permRaw === "true" || permRaw === "yes" || permRaw === "1";
    const permissionStatus = permissionGranted
      ? ListingAcquisitionPermissionStatus.GRANTED
      : ListingAcquisitionPermissionStatus.UNKNOWN;

    const descRaw = get("description");
    const { text: description } = normalizeListingDescription(descRaw);

    const priceStr = get("pricecents");
    const priceCents = priceStr ? parseInt(priceStr, 10) : NaN;

    try {
      await prisma.listingAcquisitionLead.create({
        data: {
          sourceType,
          contactName,
          contactEmail,
          contactPhone: get("contactphone") || null,
          city,
          propertyCategory,
          sourcePlatformText: get("sourceplatformtext") || null,
          permissionStatus,
          intakeStatus: ListingAcquisitionIntakeStatus.NEW,
          notes: "Imported via CSV — verify permission before publish.",
          description: description || null,
          amenitiesText: get("amenitiestext") || null,
          priceCents: Number.isFinite(priceCents) && priceCents > 0 ? priceCents : null,
          bedrooms: parseInt(get("bedrooms"), 10) || null,
          bathrooms: parseFloat(get("bathrooms")) || null,
          permissionConfirmedAt: permissionGranted ? new Date() : null,
        },
      });
      created += 1;
    } catch (e) {
      errors.push(`Row ${r + 1}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({ ok: true, created, errors });
}
