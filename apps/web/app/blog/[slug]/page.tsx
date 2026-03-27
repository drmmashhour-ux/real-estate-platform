import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BLOG_POSTS, getBlogPost, type BlogPost } from "@/lib/content/blog-posts";
import { cityToSlug } from "@/lib/market/slug";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/modules/seo/infrastructure/jsonLd";

export const revalidate = 600;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

async function resolvePost(slug: string) {
  try {
    const db = await prisma.seoBlogPost.findUnique({
      where: { slug },
    });
    if (db && db.publishedAt <= new Date()) {
      return { kind: "db" as const, db };
    }
  } catch {
    // Table may not exist pre-migration; fall through to static posts.
  }
  const st = getBlogPost(slug);
  if (st) return { kind: "static" as const, st };
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePost(slug);
  if (!resolved) return { title: "Blog" };

  const base = getSiteBaseUrl();
  const url = `${base}/blog/${slug}`;

  if (resolved.kind === "db") {
    const p = resolved.db;
    const desc = p.excerpt ?? p.title;
    return {
      title: p.title,
      description: desc,
      keywords: p.keywords,
      alternates: { canonical: url },
      robots: { index: true, follow: true },
      openGraph: {
        title: p.title,
        description: desc,
        type: "article",
        publishedTime: p.publishedAt.toISOString(),
        url,
      },
      twitter: { card: "summary_large_image", title: p.title, description: desc },
    };
  }

  const post = resolved.st;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedIso,
      url,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

function renderDbBody(body: string) {
  const blocks = body.split(/\n\n+/);
  return (
    <div className="prose-invert mt-10 space-y-6 prose-p:text-white/80">
      {blocks.map((block, i) => (
        <p key={i} className="leading-relaxed">
          {block.trim()}
        </p>
      ))}
    </div>
  );
}

function renderStaticPost(post: BlogPost) {
  return (
    <div className="prose-invert mt-10 space-y-10 prose-headings:text-white prose-p:text-white/80 prose-a:text-[#C9A646]">
      {post.sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-2xl font-bold text-[#C9A646]">{s.heading}</h2>
          {s.paragraphs.map((para, i) => (
            <p key={`${s.heading}-${i}`} className="mt-3 leading-relaxed">
              {para}
            </p>
          ))}
          {s.links && s.links.length > 0 ? (
            <ul className="mt-4 list-inside list-disc space-y-2 text-[#C9A646]">
              {s.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await resolvePost(slug);
  if (!resolved) notFound();

  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: "Article", path: `/blog/${slug}` },
  ]);

  if (resolved.kind === "db") {
    const post = resolved.db;
    const articleLd = blogPostingJsonLd({
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      publishedAt: post.publishedAt,
    });

    return (
      <article className="min-h-screen bg-[#0B0B0B] text-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
        <div className="mx-auto max-w-3xl px-4 py-14">
          <Link href="/blog" className="text-sm text-[#C9A646] hover:underline">
            ← Blog
          </Link>
          <header className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A646]">LECIPM Insights</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight">{post.title}</h1>
            <time dateTime={post.publishedAt.toISOString()} className="mt-2 block text-sm text-white/50">
              {post.publishedAt.toISOString().slice(0, 10)}
            </time>
            {post.city ? (
              <p className="mt-2 text-sm text-white/50">
                City focus:{" "}
                <Link href={`/market/${cityToSlug(post.city)}`} className="text-[#C9A646] hover:underline">
                  {post.city}
                </Link>
              </p>
            ) : null}
            {post.excerpt ? <p className="mt-4 text-lg text-white/80">{post.excerpt}</p> : null}
          </header>
          {renderDbBody(post.body)}
          <footer className="mt-14 rounded-2xl border border-white/10 bg-[#111] p-6">
            <p className="text-sm font-semibold text-white">Explore tools</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href="/tools/roi-calculator" className="text-[#C9A646] hover:underline">
                ROI calculator
              </Link>
              <Link href="/tools/deal-analyzer" className="text-[#C9A646] hover:underline">
                Deal analyzer
              </Link>
              <Link href="/market" className="text-[#C9A646] hover:underline">
                Markets
              </Link>
            </div>
          </footer>
        </div>
      </article>
    );
  }

  const post = resolved.st;
  const published = new Date(`${post.publishedIso}T12:00:00Z`);
  const articleLd = blogPostingJsonLd({
    title: post.title,
    excerpt: post.description,
    slug: post.slug,
    publishedAt: published,
  });

  return (
    <article className="min-h-screen bg-[#0B0B0B] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <Link href="/blog" className="text-sm text-[#C9A646] hover:underline">
          ← Blog
        </Link>
        <header className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A646]">{post.author}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">{post.title}</h1>
          <time dateTime={post.publishedIso} className="mt-2 block text-sm text-white/50">
            {post.publishedIso}
          </time>
          <p className="mt-4 text-lg text-white/80">{post.description}</p>
        </header>

        {renderStaticPost(post)}

        <footer className="mt-14 rounded-2xl border border-white/10 bg-[#111] p-6">
          <p className="text-sm font-semibold text-white">Explore city hubs</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/buy/montreal" className="text-[#C9A646] hover:underline">
              Buy Montréal
            </Link>
            <Link href="/rent/laval" className="text-[#C9A646] hover:underline">
              Rent Laval
            </Link>
            <Link href="/mortgage/quebec" className="text-[#C9A646] hover:underline">
              Mortgage Québec
            </Link>
            <Link href="/tools/roi-calculator" className="text-[#C9A646] hover:underline">
              ROI calculator
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}
