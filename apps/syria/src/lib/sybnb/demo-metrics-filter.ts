import { Prisma } from "@/generated/prisma";

/** Matches investor-demo audit rows tagged in JSON metadata (append-only SYBNB audit). */
export function sybnbCoreAuditExcludeInvestorDemoWhere(): Prisma.SyriaSybnbCoreAuditWhereInput {
  return {
    OR: [
      { metadata: { equals: Prisma.DbNull } },
      {
        NOT: {
          metadata: {
            path: ["demo"],
            equals: true,
          },
        },
      },
    ],
  };
}

/** AND-clauses excluding seeded investor-demo bookings from anomaly / fraud aggregates. */
export function syriaBookingInvestorDemoExclusionClauses(): Prisma.SyriaBookingWhereInput[] {
  return [
    {
      NOT: {
        guest: {
          email: { startsWith: "DEMO_" },
        },
      },
    },
    {
      NOT: {
        guest: {
          email: { contains: "investor.sybnb.demo" },
        },
      },
    },
    {
      NOT: {
        property: {
          titleAr: { startsWith: "DEMO" },
        },
      },
    },
    {
      OR: [
        { demoMeta: { equals: Prisma.DbNull } },
        {
          NOT: {
            demoMeta: {
              path: ["demo"],
              equals: true,
            },
          },
        },
      ],
    },
  ];
}
