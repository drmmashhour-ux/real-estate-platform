/**
 * Rasterizes brand SVGs to PNG (transparent) for print / social / stores.
 * Requires: sharp (already a web-app dependency).
 *
 * Run from apps/web-app: node scripts/export-brand-logos.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const brandDir = path.join(__dirname, "../public/brand");

async function pngFromSvg(relSvg, outBase, width) {
  const input = path.join(brandDir, relSvg);
  const buf = await fs.promises.readFile(input);
  const out = path.join(brandDir, `${outBase}-${width}.png`);
  await sharp(buf)
    .resize(width, null, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(out);
  console.log("wrote", path.relative(process.cwd(), out));
}

async function main() {
  await pngFromSvg("lecipm-mark-on-dark.svg", "lecipm-mark-on-dark", 256);
  await pngFromSvg("lecipm-mark-on-dark.svg", "lecipm-mark-on-dark", 512);
  await pngFromSvg("lecipm-mark-on-dark.svg", "lecipm-mark-on-dark", 1024);
  await pngFromSvg("lecipm-mark-on-light.svg", "lecipm-mark-on-light", 256);
  await pngFromSvg("lecipm-mark-on-light.svg", "lecipm-mark-on-light", 512);
  await pngFromSvg("lecipm-mark-on-light.svg", "lecipm-mark-on-light", 1024);
  await pngFromSvg("lecipm-full-on-dark.svg", "lecipm-full-on-dark", 2048);
  await pngFromSvg("lecipm-full-on-dark.svg", "lecipm-full-on-dark", 1200);
  await pngFromSvg("lecipm-full-on-light.svg", "lecipm-full-on-light", 2048);
  await pngFromSvg("lecipm-full-on-light.svg", "lecipm-full-on-light", 1200);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
