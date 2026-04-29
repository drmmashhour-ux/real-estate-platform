import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // In a real app, get userId from session
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let activation = await prisma.brokerActivation.findUnique({
      where: { brokerId: userId },
    });

    if (!activation) {
      activation = await prisma.brokerActivation.create({
        data: { brokerId: userId },
      });
    }

    return NextResponse.json(activation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...updates } = body;
    
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activation = await prisma.brokerActivation.update({
      where: { brokerId: userId },
      data: updates,
    });

    return NextResponse.json(activation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
