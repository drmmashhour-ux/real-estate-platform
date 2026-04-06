/**
 * Optional: export resized buckets for manual Xcode / Android Studio workflows.
 * EAS / Expo prebuild already derives native icons from assets/icon.png + adaptive-icon.png.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const assets = join(root, "assets");
const outRoot = join(assets, "icon-exports");

const iconPath = join(assets, "icon.png");
const adaptivePath = join(assets, "adaptive-icon.png");

/** @type {{ idiom: string; sizePt: number; scale: number; filename: string }[]} */
const iosSlots = [
  { idiom: "iphone", sizePt: 20, scale: 2, filename: "Icon-App-20x20@2x.png" },
  { idiom: "iphone", sizePt: 20, scale: 3, filename: "Icon-App-20x20@3x.png" },
  { idiom: "iphone", sizePt: 29, scale: 2, filename: "Icon-App-29x29@2x.png" },
  { idiom: "iphone", sizePt: 29, scale: 3, filename: "Icon-App-29x29@3x.png" },
  { idiom: "iphone", sizePt: 40, scale: 2, filename: "Icon-App-40x40@2x.png" },
  { idiom: "iphone", sizePt: 40, scale: 3, filename: "Icon-App-40x40@3x.png" },
  { idiom: "iphone", sizePt: 60, scale: 2, filename: "Icon-App-60x60@2x.png" },
  { idiom: "iphone", sizePt: 60, scale: 3, filename: "Icon-App-60x60@3x.png" },
  { idiom: "ipad", sizePt: 20, scale: 1, filename: "Icon-App-20x20~ipad.png" },
  { idiom: "ipad", sizePt: 20, scale: 2, filename: "Icon-App-20x20@2x~ipad.png" },
  { idiom: "ipad", sizePt: 29, scale: 1, filename: "Icon-App-29x29~ipad.png" },
  { idiom: "ipad", sizePt: 29, scale: 2, filename: "Icon-App-29x29@2x~ipad.png" },
  { idiom: "ipad", sizePt: 40, scale: 1, filename: "Icon-App-40x40~ipad.png" },
  { idiom: "ipad", sizePt: 40, scale: 2, filename: "Icon-App-40x40@2x~ipad.png" },
  { idiom: "ipad", sizePt: 76, scale: 1, filename: "Icon-App-76x76~ipad.png" },
  { idiom: "ipad", sizePt: 76, scale: 2, filename: "Icon-App-76x76@2x~ipad.png" },
  { idiom: "ipad", sizePt: 83.5, scale: 2, filename: "Icon-App-83.5x83.5@2x~ipad.png" },
  { idiom: "ios-marketing", sizePt: 1024, scale: 1, filename: "Icon-App-1024x1024.png" },
];

async function ensurePng(path) {
  try {
    await sharp(path).metadata();
  } catch {
    throw new Error(`Missing ${path}. Run pnpm run assets:generate first.`);
  }
}

await ensurePng(iconPath);
await ensurePng(adaptivePath);

const iosSet = join(outRoot, "ios", "AppIcon.appiconset");
await mkdir(iosSet, { recursive: true });

const iconInput = sharp(iconPath);

for (const slot of iosSlots) {
  const px = Math.round(slot.sizePt * slot.scale);
  await iconInput
    .clone()
    .resize(px, px, { fit: "cover", position: "centre" })
    .png()
    .toFile(join(iosSet, slot.filename));
}

const imagesJson = iosSlots.map((s) => {
  if (s.idiom === "ios-marketing") {
    return {
      filename: s.filename,
      idiom: "ios-marketing",
      scale: "1x",
      size: "1024x1024",
    };
  }
  const sizeStr = `${s.sizePt}x${s.sizePt}`;
  return {
    filename: s.filename,
    idiom: s.idiom,
    scale: `${s.scale}x`,
    size: sizeStr,
  };
});

await writeFile(
  join(iosSet, "Contents.json"),
  JSON.stringify(
    {
      images: imagesJson,
      info: { author: "lecipm-export", version: 1 },
    },
    null,
    2
  ),
  "utf8"
);

/** Classic launcher mipmaps (square icon); adaptive layers use Expo’s adaptive-icon.png at prebuild. */
const androidDensities = [
  { folder: "mipmap-mdpi", px: 48 },
  { folder: "mipmap-hdpi", px: 72 },
  { folder: "mipmap-xhdpi", px: 96 },
  { folder: "mipmap-xxhdpi", px: 144 },
  { folder: "mipmap-xxxhdpi", px: 192 },
];

for (const { folder, px } of androidDensities) {
  const dir = join(outRoot, "android", folder);
  await mkdir(dir, { recursive: true });
  await iconInput
    .clone()
    .resize(px, px, { fit: "cover", position: "centre" })
    .png()
    .toFile(join(dir, "ic_launcher.png"));
}

/** Foreground-sized layers for reference (108dp @ density ≈ common adaptive artboard). */
const androidForeground = [
  { folder: "mipmap-mdpi", px: 162 },
  { folder: "mipmap-hdpi", px: 243 },
  { folder: "mipmap-xhdpi", px: 324 },
  { folder: "mipmap-xxhdpi", px: 486 },
  { folder: "mipmap-xxxhdpi", px: 648 },
];

const adaptiveInput = sharp(adaptivePath);
for (const { folder, px } of androidForeground) {
  const dir = join(outRoot, "android-adaptive-foreground", folder);
  await mkdir(dir, { recursive: true });
  await adaptiveInput
    .clone()
    .resize(px, px, { fit: "cover", position: "centre" })
    .png()
    .toFile(join(dir, "ic_launcher_foreground.png"));
}

console.log(
  `Wrote ${outRoot}/ios/AppIcon.appiconset and android mipmaps + android-adaptive-foreground (reference layers).`
);
