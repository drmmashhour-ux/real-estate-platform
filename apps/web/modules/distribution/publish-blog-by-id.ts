import { prisma } from "@/lib/db";
import { publishBlogDistribution, type BlogDistributionPack } from "./publish-blog-distribution";

/**
 * Loads a user-owned blog post and builds the distribution pack (COPY + share links).
 * Does not post to external APIs.
 */
export async function publishBlogDistributionByBlogId(
  blogId: string,
  userId: string,
  origin: string,
): Promise<BlogDistributionPack | null> {
  const post = await prisma.marketingBlogPost.findFirst({
    where: { id: blogId.trim(), userId },
  });
  if (!post) return null;
  const publicUrl = `${origin.replace(/\/$/, "")}/marketing-blog/${post.slug}`;
  return publishBlogDistribution(post, {
    publicUrl,
    city: "Montréal",
  });
}
