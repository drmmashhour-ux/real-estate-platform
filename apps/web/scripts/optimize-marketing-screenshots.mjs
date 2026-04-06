/**
 * Create WebP variants for marketing screenshots (lighter for web; keep PNG for stores).
 * Target: each file < 1MB.
 */
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const root = join(process.cwd(), "public", "marketing", "screenshots");
const files = await readdir(root);
const pngs = files.filter((f) => f.startsWith("screen-") && f.endsWith(".png"));

for (const name of pngs) {
  const input = join(root, name);
  const base = name.replace(/\.png$/i, "");
  const outWebp = join(root, `${base}.webp`);
  await sharp(input)
    .webp({ quality: 82, effort: 4 })
    .toFile(outWebp);
  const st = await stat(outWebp);
  const sizeKb = Math.round(st.size / 1024);
  console.log(`${base}.webp ~${sizeKb}KB`);
}

console.log("Done. PNGs unchanged (store); WebP for web.");
