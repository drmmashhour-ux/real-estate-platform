import { NextResponse } from "next/server";
import { listPublicApprovedTestimonials } from "@/modules/growth/broker-testimonial.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listPublicApprovedTestimonials(12);
  return NextResponse.json({ testimonials: rows });
}
