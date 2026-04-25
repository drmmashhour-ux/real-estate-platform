import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";

const CSV_IMPORT_MAX_BYTES = 8 * 1024 * 1024;

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true as const };
}

function parseCsvLine(line: string): string[] {
  return line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
}

/** POST multipart/form-data — field "file" CSV with header row */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > CSV_IMPORT_MAX_BYTES) {
    return NextResponse.json({ error: "CSV file too large (max 8MB)" }, { status: 413 });
  }
  const scan = await scanBufferBeforeStorage({
    bytes: buf,
    mimeType: "text/csv",
    context: "admin_market_data_csv",
  });
  if (!scan.ok) {
    return NextResponse.json({ error: scan.userMessage }, { status: scan.status ?? 422 });
  }

  const text = buf.toString("utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must have header and at least one row" }, { status: 400 });
  }

  const header = parseCsvLine(lines[0]!).map((h) => h.replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, "_"));

  const idx = (...names: string[]) => {
    for (const name of names) {
      const i = header.indexOf(name);
      if (i >= 0) return i;
    }
    return -1;
  };

  const colCity = idx("city");
  const colType = idx("property_type", "propertytype", "type");
  const colPrice = idx("avgpricecents", "avg_price_cents", "avg_price");
  const colDate = idx("date");
  const colPostal = idx("postal_code", "postalcode");
  const colMed = idx("medianpricecents", "median_price_cents");
  const colRent = idx("avgrentcents", "avg_rent_cents");
  const colTx = idx("transactions");
  const colInv = idx("inventory");

  if (colCity < 0 || colType < 0 || colPrice < 0 || colDate < 0) {
    return NextResponse.json(
      {
        error:
          "CSV required columns: city, propertyType, avgPriceCents (or avg_price_cents), date (ISO yyyy-mm-dd)",
      },
      { status: 400 }
    );
  }

  let created = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const city = (cells[colCity] ?? "").trim();
    const propertyType = (cells[colType] ?? "").trim();
    const price = Number((cells[colPrice] ?? "").replace(/,/g, ""));
    const dateIso = (cells[colDate] ?? "").trim();
    if (!city || !propertyType || !Number.isFinite(price) || price <= 0 || !dateIso) {
      errors.push(`Row ${i + 1}: invalid`);
      continue;
    }
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) {
      errors.push(`Row ${i + 1}: bad date`);
      continue;
    }

    await prisma.marketDataPoint.create({
      data: {
        city,
        postalCode: colPostal >= 0 ? (cells[colPostal] ?? "").trim() || null : null,
        propertyType,
        avgPriceCents: Math.round(price),
        medianPriceCents:
          colMed >= 0 && cells[colMed]?.trim()
            ? Math.round(Number(String(cells[colMed]).replace(/,/g, "")))
            : null,
        avgRentCents:
          colRent >= 0 && cells[colRent]?.trim()
            ? Math.round(Number(String(cells[colRent]).replace(/,/g, "")))
            : null,
        transactions:
          colTx >= 0 && cells[colTx]?.trim() ? Math.round(Number(String(cells[colTx]).replace(/,/g, ""))) : null,
        inventory:
          colInv >= 0 && cells[colInv]?.trim() ? Math.round(Number(String(cells[colInv]).replace(/,/g, ""))) : null,
        date: d,
      },
    });
    created++;
  }

  return NextResponse.json({ ok: true, created, errors: errors.slice(0, 20), label: "estimate" });
}
