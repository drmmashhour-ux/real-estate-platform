import { Prisma } from "@/generated/prisma";

/** Exclude investor-seeded listings from traction / investor KPI aggregates. */
export function syriaPropertyExcludeInvestorDemoWhere(): Prisma.SyriaPropertyWhereInput {
  return {
    AND: [
      {
        NOT: { titleAr: { startsWith: "DEMO" } },
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
    ],
  };
}

/**
 * Exclude investor-demo tagged rows / listings from DR.BRAIN fraud & payment aggregates (SYBNB-137).
 *
 * Align with raw SQL in {@link getDrBrainMetrics}: hourly `syria_payment_audit_log` buckets JOIN
 * `syria_properties` and exclude `title_ar LIKE 'DEMO%'` and `demo_meta.demo === true`.
 */
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
