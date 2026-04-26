/**
 * Rasterize SVG brand marks using sharp (devDependency).
 * Run from package root: node scripts/generate-brand-rasters.mjs
 */
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandDir = join(__dirname, "../public/brand");

async function main() {
  const iconSvg = join(brandDir, "darlink-icon.svg");
  const ogSvg = join(brandDir, "darlink-og.svg");

  const bufIcon = readFileSync(iconSvg);

  const png = async (size, name) => {
    await sharp(bufIcon).resize(size, size).png({ compressionLevel: 9 }).toFile(join(brandDir, name));
    console.warn("wrote", name);
  };

  await png(512, "darlink-icon.png");
  await png(192, "darlink-icon-192.png");
  await png(48, "darlink-icon-48.png");
  await png(180, "apple-touch-icon.png");

  await sharp(readFileSync(iconSvg)).resize(16, 16).png().toFile(join(brandDir, "favicon-16.png"));
  await sharp(readFileSync(iconSvg)).resize(32, 32).png().toFile(join(brandDir, "favicon-32.png"));

  const b16 = await sharp(readFileSync(iconSvg)).resize(16, 16).png().toBuffer();
  const b32 = await sharp(readFileSync(iconSvg)).resize(32, 32).png().toBuffer();
  const b48 = await sharp(readFileSync(iconSvg)).resize(48, 48).png().toBuffer();
  writeFileSync(join(brandDir, "darlink-favicon.ico"), await pngToIco([b16, b32, b48]));
  console.warn("wrote darlink-favicon.ico");

  await sharp(readFileSync(ogSvg)).resize(1200, 630).png({ compressionLevel: 9 }).toFile(join(brandDir, "og-default.png"));
  console.warn("wrote og-default.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
