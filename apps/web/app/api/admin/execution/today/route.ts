import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get or create daily stats
    let stats = await prisma.outreachDailyStat.findUnique({
      where: { date: today },
    });

    if (!stats) {
      stats = await prisma.outreachDailyStat.create({
        data: { date: today },
      });
    }

    // 2. Get or create daily tasks
    let tasks = await prisma.outreachDailyTask.findMany({
      where: { date: today },
    });

    if (tasks.length === 0) {
      const defaultTasks = [
        { label: "Call 10 brokers", category: "outreach", quota: 10 },
        { label: "Send 10 DMs", category: "outreach", quota: 10 },
        { label: "Book 3 demos", category: "outreach", quota: 3 },
        { label: "Send Loom to 5 leads", category: "outreach", quota: 5 },
        { label: "Follow up with 5 brokers", category: "follow_up", quota: 5 },
      ];

      await prisma.outreachDailyTask.createMany({
        data: defaultTasks.map(t => ({
          ...t,
          date: today,
        })),
      });

      tasks = await prisma.outreachDailyTask.findMany({
        where: { date: today },
      });
    }

    // 3. Get leads for today
    const followUpLeads = await prisma.brokerOnboardingLead.findMany({
      where: {
        nextFollowUpAt: {
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { notIn: ["onboarded", "rejected"] }
      },
      orderBy: { nextFollowUpAt: "asc" },
      limit: 10
    });

    const newLeads = await prisma.brokerOnboardingLead.findMany({
      where: { status: "new" },
      orderBy: { createdAt: "desc" },
      limit: 10
    });

    return NextResponse.json({
      stats,
      tasks,
      leads: {
        followUp: followUpLeads,
        new: newLeads
      }
    });
  } catch (error: any) {
    console.error("[EXECUTION_TODAY]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
