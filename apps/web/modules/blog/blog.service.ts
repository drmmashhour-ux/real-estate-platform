/**
 * Marketing System v2 — user blog (additive; does not replace SeoBlogPost / merged-blog).
 */
import { MarketingBlogPostStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type CreateMarketingBlogInput = {
  userId: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl?: string | null;
  tags?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: MarketingBlogPostStatus;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function ensureUniqueSlug(base: string): Promise<string> {
  let s = slugify(base) || "post";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? s : `${s}-${n}`;
    const exists = await prisma.marketingBlogPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    n += 1;
  }
}

export async function createMarketingBlogPost(input: CreateMarketingBlogInput) {
  const status = input.status ?? MarketingBlogPostStatus.DRAFT;
  const publishedAt = status === MarketingBlogPostStatus.PUBLISHED ? new Date() : null;
  return prisma.marketingBlogPost.create({
    data: {
      userId: input.userId,
      title: input.title,
      slug: input.slug,
      content: input.content,
      coverImageUrl: input.coverImageUrl ?? null,
      tags: input.tags ?? [],
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      status,
      publishedAt,
    },
  });
}

export async function updateMarketingBlogPost(
  id: string,
  userId: string,
  patch: Partial<{
    title: string;
    slug: string;
    content: string;
    coverImageUrl: string | null;
    tags: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    status: MarketingBlogPostStatus;
  }>
) {
  const existing = await prisma.marketingBlogPost.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.MarketingBlogPostUpdateInput = { ...patch };
  if (patch.status === MarketingBlogPostStatus.PUBLISHED && existing.status !== MarketingBlogPostStatus.PUBLISHED) {
    data.publishedAt = new Date();
  }
  return prisma.marketingBlogPost.update({ where: { id: existing.id }, data });
}

export async function deleteMarketingBlogPost(id: string, userId: string) {
  const existing = await prisma.marketingBlogPost.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.marketingBlogPost.delete({ where: { id: existing.id } });
  return true;
}

export async function getPublishedBySlug(slug: string) {
  return prisma.marketingBlogPost.findFirst({
    where: { slug, status: MarketingBlogPostStatus.PUBLISHED },
  });
}
