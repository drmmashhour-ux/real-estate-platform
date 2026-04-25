import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { normalizeAnyPublicListingCode } from "@/lib/listing-code-public";

export const dynamic = "force-dynamic";

export type AdminLookupResult = { label: string; href: string };

/**
 * GET /api/admin/lookup?q=CODE — resolve USR-, LST-, INV-, BKG-, DEL-, DSP- to a navigation target.
 */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!raw) return NextResponse.json({ results: [] satisfies AdminLookupResult[] });

  const results: AdminLookupResult[] = [];
  const q = raw;
  const upper = q.toUpperCase();

  if (upper.startsWith("USR-")) {
    const user = await prisma.user.findFirst({
      where: { userCode: { equals: q, mode: "insensitive" } },
      select: { id: true, email: true, userCode: true },
    });
    if (user) {
      results.push({
        label: `User ${user.userCode ?? user.email}`,
        href: `/admin/users?q=${encodeURIComponent(user.email ?? "")}`,
      });
    }
  }

  const listingCanon = normalizeAnyPublicListingCode(q);
  if (listingCanon) {
    const [st, crm, fsbo] = await Promise.all([
      prisma.shortTermListing.findFirst({
        where: { listingCode: { equals: listingCanon, mode: "insensitive" } },
        select: { id: true, listingCode: true, title: true },
      }),
      prisma.listing.findFirst({
        where: { listingCode: { equals: listingCanon, mode: "insensitive" } },
        select: { id: true, listingCode: true, title: true },
      }),
      prisma.fsboListing.findFirst({
        where: { listingCode: { equals: listingCanon, mode: "insensitive" } },
        select: { id: true, listingCode: true, title: true },
      }),
    ]);
    if (st) {
      results.push({
        label: `BNHUB · ${st.listingCode} · ${st.title}`,
        href: `/bnhub/${st.id}`,
      });
    }
    if (crm) {
      results.push({
        label: `CRM · ${crm.listingCode} · ${crm.title}`,
        href: `/dashboard/listings/${crm.id}`,
      });
    }
    if (fsbo) {
      results.push({
        label: `FSBO · ${fsbo.listingCode ?? "?"} · ${fsbo.title}`,
        href: `/listings/${fsbo.id}`,
      });
    }
  }

  if (upper.startsWith("INV-")) {
    const inv = await prisma.platformInvoice.findFirst({
      where: { invoiceNumber: { equals: q, mode: "insensitive" } },
      select: { id: true, invoiceNumber: true },
    });
    if (inv) {
      results.push({
        label: `Invoice ${inv.invoiceNumber}`,
        href: `/admin/finance/invoices?q=${encodeURIComponent(inv.invoiceNumber)}`,
      });
    }
  }

  if (upper.startsWith("BKG-")) {
    const b = await prisma.booking.findFirst({
      where: { bookingCode: { equals: q, mode: "insensitive" } },
      select: { id: true, bookingCode: true },
    });
    if (b) {
      results.push({
        label: `Booking ${b.bookingCode}`,
        href: `/bnhub/booking/${b.id}`,
      });
    }
  }

  if (upper.startsWith("DEL-")) {
    const d = await prisma.deal.findFirst({
      where: { dealCode: { equals: q, mode: "insensitive" } },
      select: { id: true, dealCode: true },
    });
    if (d) {
      results.push({
        label: `Deal ${d.dealCode}`,
        href: `/admin/timeline`,
      });
    }
  }

  if (upper.startsWith("DSP-")) {
    const d = await prisma.platformLegalDispute.findFirst({
      where: { disputeCode: { equals: q, mode: "insensitive" } },
      select: { id: true, disputeCode: true },
    });
    if (d) {
      results.push({
        label: `Dispute ${d.disputeCode}`,
        href: `/admin/timeline`,
      });
    }
  }

  return NextResponse.json({ results });
}
