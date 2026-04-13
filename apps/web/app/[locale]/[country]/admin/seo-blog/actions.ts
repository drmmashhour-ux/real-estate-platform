"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function parsePublishedAt(raw: string | null): Date {
  if (!raw?.trim()) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export type SeoBlogActionState = { ok: boolean; error?: string; saved?: boolean };

export async function createSeoBlogPost(_prev: SeoBlogActionState | void, formData: FormData): Promise<SeoBlogActionState> {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return { ok: false, error: "Unauthorized" };
  }

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const keywordsRaw = String(formData.get("keywords") ?? "");
  const publishedAt = parsePublishedAt(String(formData.get("publishedAt") ?? ""));

  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: "Slug must be lowercase letters, numbers, and hyphens only." };
  }
  if (!title || !body) {
    return { ok: false, error: "Title and body are required." };
  }

  let createdId: string;
  try {
    const row = await prisma.seoBlogPost.create({
      data: {
        slug,
        title,
        body,
        excerpt,
        city,
        keywords: parseKeywords(keywordsRaw),
        publishedAt,
      },
      select: { id: true },
    });
    createdId = row.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create post.";
    return { ok: false, error: msg.includes("Unique") ? "That slug is already in use." : msg };
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  redirect(`/admin/seo-blog/${createdId}/edit?created=1`);
}

export async function updateSeoBlogPost(_prev: SeoBlogActionState | void, formData: FormData): Promise<SeoBlogActionState> {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return { ok: false, error: "Unauthorized" };
  }

  const id = String(formData.get("id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const keywordsRaw = String(formData.get("keywords") ?? "");
  const publishedAt = parsePublishedAt(String(formData.get("publishedAt") ?? ""));

  if (!id || !SLUG_RE.test(slug) || !title || !body) {
    return { ok: false, error: "Invalid form data." };
  }

  try {
    await prisma.seoBlogPost.update({
      where: { id },
      data: {
        slug,
        title,
        body,
        excerpt,
        city,
        keywords: parseKeywords(keywordsRaw),
        publishedAt,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update post.";
    return { ok: false, error: msg.includes("Unique") ? "That slug is already in use." : msg };
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  return { ok: true, saved: true };
}

export async function deleteSeoBlogPost(formData: FormData): Promise<void> {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  let slug = "";
  try {
    const row = await prisma.seoBlogPost.findUnique({ where: { id }, select: { slug: true } });
    slug = row?.slug ?? "";
    await prisma.seoBlogPost.delete({ where: { id } });
  } catch {
    return;
  }

  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  redirect("/admin/seo-blog");
}
