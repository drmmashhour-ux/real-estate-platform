/**
 * Regenerates PNGs derived from vector branding (production-safe paths).
 * Run from apps/web: node scripts/generate-brand-png-assets.mjs
 *
 * Outputs:
 * - public/icon.png (192×192, PWA / apple-touch)
 * - public/logo.png (invoice PDFs via @react-pdf/renderer)
 * - public/templates/*.png (Canva admin preview placeholders)
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pub = path.join(root, "public");

async function main() {
  const iconSvg = path.join(pub, "branding", "logo-icon.svg");
  const logoSvg = path.join(pub, "branding", "logo-dark.svg");
  if (!fs.existsSync(iconSvg) || !fs.existsSync(logoSvg)) {
    console.error("Missing branding SVGs under public/branding/");
    process.exit(1);
  }

  await sharp(iconSvg)
    .resize(192, 192, { fit: "contain", background: { r: 11, g: 11, b: 11, alpha: 1 } })
    .png()
    .toFile(path.join(pub, "icon.png"));

  await sharp(logoSvg)
    .resize(400, 80, { fit: "inside", background: { r: 250, g: 250, b: 250, alpha: 0 } })
    .png()
    .toFile(path.join(pub, "logo.png"));

  const tplDir = path.join(pub, "templates");
  fs.mkdirSync(tplDir, { recursive: true });
  const base = sharp({
    create: { width: 640, height: 400, channels: 3, background: { r: 11, g: 11, b: 11 } },
  }).png();
  for (const name of ["real-estate-poster-1", "instagram-property-1", "property-brochure-1"]) {
    await base.clone().toFile(path.join(tplDir, `${name}.png`));
  }

  console.log("OK: public/icon.png, public/logo.png, public/templates/*.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
