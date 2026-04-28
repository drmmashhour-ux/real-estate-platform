import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sy8FeedExtraWhere } from "@/lib/sy8/sy8-feed-visibility";
import { SYRIA_FEED_API_S_MAXAGE_SECONDS } from "@/lib/syria/sybn104-performance";

const PAGE = 10;
const MAX_OFFSET = 500;

/**
 * Public feed: newest listings first (offset paginated for load more).
 * GET /api/feed?offset=0
 * ORDER SYBNB-129 — response ships **one** image URL per row + view counts (unique preferred).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("offset");
  const n = raw === null || raw === "" ? 0 : Number.parseInt(raw, 10);
  const offset = Number.isFinite(n) ? Math.max(0, Math.min(MAX_OFFSET, n)) : 0;

  try {
    const [rows, total] = await prisma.$transaction([
      prisma.syriaProperty.findMany({
        where: { status: "PUBLISHED", fraudFlag: false, ...sy8FeedExtraWhere },
        orderBy: [
          { owner: { verifiedAt: { sort: "desc", nulls: "last" } } },
          { plan: "desc" },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        take: PAGE,
        skip: offset,
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          area: true,
          districtAr: true,
          districtEn: true,
          city: true,
          cityAr: true,
          cityEn: true,
          state: true,
          governorate: true,
          price: true,
          currency: true,
          images: true,
          isDirect: true,
          type: true,
          plan: true,
          adCode: true,
          createdAt: true,
          views: true,
          uniqueViews: true,
        },
      }),
      prisma.syriaProperty.count({ where: { status: "PUBLISHED", fraudFlag: false, ...sy8FeedExtraWhere } }),
    ]);

    const items = rows.map((r) => {
      const rawImgs =
        Array.isArray(r.images) ?
          r.images.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
        : [];
      const first = rawImgs[0] ?? null;
      return {
        id: r.id,
        titleAr: r.titleAr,
        titleEn: r.titleEn,
        area: r.area,
        districtAr: r.districtAr,
        districtEn: r.districtEn,
        city: r.city,
        cityAr: r.cityAr,
        cityEn: r.cityEn,
        state: r.state,
        governorate: r.governorate,
        price: r.price,
        currency: r.currency,
        images: first ? [first] : [],
        isDirect: r.isDirect,
        type: r.type,
        plan: r.plan,
        adCode: r.adCode,
        createdAt: r.createdAt,
        views: typeof r.uniqueViews === "number" ? r.uniqueViews : r.views ?? 0,
      };
    });

    return NextResponse.json(
      { items, hasMore: offset + rows.length < total, nextOffset: offset + rows.length },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${SYRIA_FEED_API_S_MAXAGE_SECONDS}, stale-while-revalidate=${SYRIA_FEED_API_S_MAXAGE_SECONDS * 2}`,
        },
      },
    );
  } catch (e) {
    console.error("[api/feed]", e);
    return NextResponse.json({ error: "Feed failed." }, { status: 500 });
  }
}
