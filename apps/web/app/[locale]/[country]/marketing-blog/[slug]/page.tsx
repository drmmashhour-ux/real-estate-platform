import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { engineFlags } from "@/config/feature-flags";
import { getPublishedBySlug } from "@/modules/blog/blog.service";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { BlogEngagementClient } from "@/components/marketing-blog/BlogEngagementClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, country, slug } = await params;
  if (!engineFlags.blogSystemV1) return { title: "Blog" };
  const post = await getPublishedBySlug(slug);
  if (!post) return { title: "Not found" };
  const title = post.seoTitle ?? post.title;
  const description = (post.seoDescription ?? post.title).slice(0, 320);
  const base = getSiteBaseUrl().replace(/\/$/, "");
  const url = `${base}/${locale}/${country}/marketing-blog/${encodeURIComponent(slug)}`;
  const ogImages = post.coverImageUrl ? [{ url: post.coverImageUrl, width: 1200, height: 630, alt: title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: ogImages,
    },
    twitter: {
      card: post.coverImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function MarketingBlogPublicPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
}) {
  const { locale, country, slug } = await params;
  if (!engineFlags.blogSystemV1) notFound();

  const post = await getPublishedBySlug(slug);
  if (!post) notFound();

  const base = getSiteBaseUrl().replace(/\/$/, "");
  const publicUrl = `${base}/${locale}/${country}/marketing-blog/${encodeURIComponent(slug)}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 text-white">
      {post.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImageUrl} alt="" className="mb-8 max-h-80 w-full rounded-xl object-cover" />
      ) : null}
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
      </p>
      <div className="mt-8 whitespace-pre-wrap leading-relaxed text-zinc-200">{post.content}</div>
      <BlogEngagementClient blogId={post.id} slug={post.slug} publicUrl={publicUrl} />
    </article>
  );
}
