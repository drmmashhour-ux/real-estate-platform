import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create daily stats
    let stats = await prisma.outreachDailyStat.findUnique({
      where: { date: new Date(today) },
    });

    if (!stats) {
      stats = await prisma.outreachDailyStat.create({
        data: { date: new Date(today) },
      });
    }

    // Find or create daily tasks
    let tasks = await prisma.outreachDailyTask.findMany({
      where: { date: new Date(today) },
    });

    if (tasks.length === 0) {
      const defaultTasks = [
        { label: "Call 10 brokers", quota: 10, category: "outreach" },
        { label: "Send 10 DMs", quota: 10, category: "outreach" },
        { label: "Book 3 demos", quota: 3, category: "outreach" },
        { label: "Send Loom to 5 leads", quota: 5, category: "outreach" },
        { label: "Follow up with 5 brokers", quota: 5, category: "follow_up" },
      ];

      await prisma.outreachDailyTask.createMany({
        data: defaultTasks.map(t => ({ ...t, date: new Date(today) })),
      });

      tasks = await prisma.outreachDailyTask.findMany({
        where: { date: new Date(today) },
      });
    }

    return NextResponse.json({ stats, tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const today = new Date().toISOString().split('T')[0];
    
    const stats = await prisma.outreachDailyStat.update({
      where: { date: new Date(today) },
      data: body,
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
