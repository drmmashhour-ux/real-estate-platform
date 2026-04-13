import { ContentMachinePieceStatus } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { contentMachineFilePath, ensureContentMachineDir } from "@/lib/content-machine/storage";

const W = 1080;
const H = 1920;

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("/") && !url.startsWith("//")) {
      const abs = path.join(process.cwd(), "public", url.replace(/^\//, ""));
      const b = await fs.readFile(abs).catch(() => null);
      return b;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build a 9:16 JPEG card: blurred full-bleed bg + inset photo + hook overlay.
 * Stores file on disk; returns public API path for admin preview.
 */
export async function renderVerticalListingCard(opts: {
  contentId: string;
  imageUrl: string;
  hook: string;
}): Promise<{ filePath: string; publicPath: string }> {
  await ensureContentMachineDir();
  const outPath = contentMachineFilePath(opts.contentId, "jpg");

  const raw = await fetchImageBuffer(opts.imageUrl);
  if (!raw) {
    throw new Error("Could not load listing image for video frame");
  }

  const bg = await sharp(raw).resize(W, H, { fit: "cover", position: "center" }).blur(12).toBuffer();

  const insetW = W - 72;
  const insetH = Math.floor(H * 0.42);
  const fg = await sharp(raw)
    .resize(insetW, insetH, { fit: "cover", position: "center" })
    .toBuffer();

  const hookLines = opts.hook.replace(/\s+/g, " ").trim().slice(0, 140);
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="rgba(0,0,0,0.4)"/>
  <text x="48" y="120" fill="#ffffff" font-family="system-ui,sans-serif" font-size="44" font-weight="800">${escapeXml(
    hookLines
  )}</text>
</svg>`;

  const overlay = Buffer.from(svg);

  await sharp(bg)
    .composite([
      { input: fg, top: 420, left: 36 },
      { input: overlay, top: 0, left: 0 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outPath);

  const publicPath = `/api/admin/content-machine/asset/${encodeURIComponent(opts.contentId)}`;
  return { filePath: outPath, publicPath };
}

/**
 * Produce a vertical 9:16 asset (high-res JPEG card: photo + hook overlay) for Shorts/Reels/TikTok uploads.
 * Swap for true MP4 (e.g. FFmpeg) when a video encoder is wired — pipeline stores `videoUrl` the same way.
 */
export async function createVideoForContentPiece(contentId: string): Promise<{ videoUrl: string } | { error: string }> {
  const row = await prisma.machineGeneratedContent.findUnique({
    where: { id: contentId },
    include: {
      listing: {
        include: {
          listingPhotos: { orderBy: { sortOrder: "asc" }, take: 6, select: { url: true } },
        },
      },
    },
  });

  if (!row) return { error: "not_found" };

  const photos = row.listing.listingPhotos.map((p) => p.url).filter(Boolean);
  const jsonPhotos = row.listing.photos;
  const legacy =
    Array.isArray(jsonPhotos) ? jsonPhotos.filter((x): x is string => typeof x === "string") : [];
  const imageUrl = photos[0] ?? legacy[0];
  if (!imageUrl) {
    await prisma.machineGeneratedContent.update({
      where: { id: contentId },
      data: {
        status: ContentMachinePieceStatus.failed,
        errorMessage: "No listing images for vertical render",
      },
    });
    return { error: "no_images" };
  }

  try {
    const { publicPath } = await renderVerticalListingCard({
      contentId,
      imageUrl,
      hook: row.hook,
    });
    await prisma.machineGeneratedContent.update({
      where: { id: contentId },
      data: {
        videoUrl: publicPath,
        status: ContentMachinePieceStatus.video_created,
        errorMessage: null,
      },
    });
    return { videoUrl: publicPath };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "render_failed";
    await prisma.machineGeneratedContent.update({
      where: { id: contentId },
      data: {
        status: ContentMachinePieceStatus.failed,
        errorMessage: msg.slice(0, 2000),
      },
    });
    return { error: msg };
  }
}
