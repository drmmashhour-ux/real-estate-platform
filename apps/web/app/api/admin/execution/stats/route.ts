import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { field, increment = 1, notes } = await req.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validFields = ["callsMade", "dmsSent", "demosBooked", "demosDone", "loomsSent", "conversions"];
    if (field && !validFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const updateData: any = {};
    if (field) {
      updateData[field] = { increment };
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const stats = await prisma.outreachDailyStat.update({
      where: { date: today },
      data: updateData,
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("[EXECUTION_STATS]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
