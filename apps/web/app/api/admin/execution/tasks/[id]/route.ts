import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { completed, progress } = await req.json();
    
    const task = await prisma.outreachDailyTask.update({
      where: { id: params.id },
      data: { 
        completed,
        progress: progress !== undefined ? progress : undefined
      },
    });

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
