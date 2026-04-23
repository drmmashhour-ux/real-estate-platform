import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, category, description, transactionId } = await req.json();

    if (!email || !category || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Set response due date (30 days from now as per QC law)
    const responseDueAt = new Date();
    responseDueAt.setDate(responseDueAt.getDate() + 30);

    const complaint = await prisma.privacyComplaint.create({
      data: {
        submittedBy: `${name} <${email}>`,
        transactionId: transactionId || null,
        category,
        description,
        status: "PENDING",
        responseDueAt,
      },
    });

    // Log the audit event
    await prisma.privacyAuditLog.create({
      data: {
        action: "COMPLAINT_SUBMITTED",
        entityType: "PrivacyComplaint",
        entityId: complaint.id,
        metadata: { category, email },
      },
    });

    return NextResponse.json({ success: true, id: complaint.id });
  } catch (error) {
    console.error("Complaint submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
