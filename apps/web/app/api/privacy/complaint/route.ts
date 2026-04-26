import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export async function POST(req: Request) {
  try {
    const { name, email, category, description } = await req.json();

    if (!email || !category || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const responseDueAt = new Date();
    responseDueAt.setDate(responseDueAt.getDate() + 30); // 30 day response window

    const complaint = await prisma.privacyComplaint.create({
      data: {
        submittedBy: `${name} <${email}>`,
        category,
        description,
        status: "PENDING",
        responseDueAt,
      },
    });

    // Log the event in AuditLog
    await prisma.auditLog.create({
      data: {
        action: "COMPLAINT_SUBMITTED",
        entityType: "PrivacyComplaint",
        entityId: complaint.id,
        purpose: "COMPLIANCE",
        metadata: {
          category,
          email,
        },
      },
    });

    return NextResponse.json({ success: true, id: complaint.id });
  } catch (error: any) {
    console.error("Complaint submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
