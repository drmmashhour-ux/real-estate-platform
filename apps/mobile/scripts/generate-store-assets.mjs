/**
 * LECIPM store assets — abstract gold mark on black (#D4AF37 / #000000), no wordmark on icons.
 * Icons: ~17% safe inset (15–20% padding) for App Store / Play.
 * Splash: 1024×1024 — #000 + subtle radial gold glow, centered stack (icon · LECIPM · one-line slogan).
 * Requires: sharp (devDependency).
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const assets = join(root, "assets");
const iconExports = join(assets, "icon-exports");

await mkdir(assets, { recursive: true });
await mkdir(iconExports, { recursive: true });

const BG = "#000000";
const GOLD = "#D4AF37";

/** Subtle gold halo behind mark (high contrast on black; no indigo). */
function svgMark({ size, safeInsetRatio }) {
  const inset = size * safeInsetRatio;
  const w = size - inset * 2;
  const x0 = inset;
  const y0 = inset;
  const t = w * 0.22;
  const r = t * 0.45;
  const stemH = w * 0.82;
  const footW = w * 0.72;
  const stemLeft = x0 + w * 0.12;
  const stemTop = y0 + w * 0.09;
  const x1 = stemLeft;
  const y1 = stemTop;
  const x2 = stemLeft + t;
  const y2 = stemTop + stemH;
  const x3 = stemLeft + footW;
  const y3 = y2;
  const x4 = x3;
  const y4 = y2 - t;
  const x5 = stemLeft + t;
  const y5 = y4;
  const x6 = x5;
  const y6 = stemTop + r;
  const x7 = stemLeft + r;
  const y7 = stemTop;
  const d = [
    `M ${x7} ${y7}`,
    `L ${x2 - r} ${y1}`,
    `Q ${x2} ${y1} ${x2} ${y1 + r}`,
    `L ${x2} ${y5 - r}`,
    `Q ${x2} ${y5} ${x2 + r} ${y5}`,
    `L ${x4 - r} ${y5}`,
    `Q ${x4} ${y5} ${x4} ${y5 + r}`,
    `L ${x4} ${y3}`,
    `Q ${x4} ${y3} ${x4 - r} ${y3}`,
    `L ${x2 + r} ${y3}`,
    `Q ${x2} ${y3} ${x2} ${y3 - r}`,
    `L ${x2} ${y6}`,
    `Q ${x2} ${y6 - r} ${x2 - r} ${y6 - r}`,
    `L ${x1 + r} ${y6 - r}`,
    `Q ${x1} ${y6 - r} ${x1} ${y6 - r - r}`,
    `L ${x1} ${y1 + r}`,
    `Q ${x1} ${y1} ${x1 + r} ${y1}`,
    "Z",
  ].join(" ");

  const cx = size / 2;
  const cy = size / 2;
  const glowR = size * 0.42;

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="48%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.14"/>
      <stop offset="55%" stop-color="${GOLD}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${size * 0.008}"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${BG}"/>
  <circle cx="${cx}" cy="${cy}" r="${glowR}" fill="url(#g)"/>
  <path d="${d}" fill="${GOLD}" filter="url(#soft)"/>
</svg>`;
}

/** Master launcher / App Store source — 15–20% padding (use 17%). */
const ICON_INSET = 0.17;
await sharp(Buffer.from(svgMark({ size: 1024, safeInsetRatio: ICON_INSET })))
  .png()
  .toFile(join(assets, "icon.png"));

/** Android adaptive foreground — ~18% inset for round/squircle masks. */
await sharp(Buffer.from(svgMark({ size: 1024, safeInsetRatio: 0.18 })))
  .png()
  .toFile(join(assets, "adaptive-icon.png"));

const iconMaster = sharp(join(assets, "icon.png"));
await iconMaster.clone().resize(512, 512, { fit: "cover", position: "centre" }).png().toFile(join(iconExports, "icon-512.png"));
await iconMaster.clone().resize(192, 192, { fit: "cover", position: "centre" }).png().toFile(join(iconExports, "icon-192.png"));
await iconMaster.clone().resize(180, 180, { fit: "cover", position: "centre" }).png().toFile(join(iconExports, "icon-180.png"));
await iconMaster.clone().png().toFile(join(iconExports, "icon-1024.png"));

/** Splash artboard: square, safe-centered stack (Expo scales with resizeMode + black letterboxing). */
const SPLASH = 1024;
const SPLASH_MARK_PX = 136;
const splashMarkBuf = await sharp(Buffer.from(svgMark({ size: SPLASH_MARK_PX, safeInsetRatio: 0.12 })))
  .png()
  .toBuffer();

const iconB64 = splashMarkBuf.toString("base64");

const cx = SPLASH / 2;
const iconX = (SPLASH - SPLASH_MARK_PX) / 2;
/** Balanced vertical stack around optical center */
const iconY = 362;
const titleBaseline = iconY + SPLASH_MARK_PX + 40;
const sloganBaseline = titleBaseline + 58 + 26;

const splashSvg = `<svg width="${SPLASH}" height="${SPLASH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <radialGradient id="splashGoldGlow" cx="50%" cy="38%" r="56%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.13"/>
      <stop offset="50%" stop-color="${GOLD}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#000000"/>
  <rect width="100%" height="100%" fill="url(#splashGoldGlow)"/>
  <image href="data:image/png;base64,${iconB64}" width="${SPLASH_MARK_PX}" height="${SPLASH_MARK_PX}" x="${iconX}" y="${iconY}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${cx}" y="${titleBaseline}" text-anchor="middle" font-family="Georgia, 'Times New Roman', 'Noto Serif', serif" font-size="48" font-weight="600" fill="${GOLD}" letter-spacing="0.12em">LECIPM</text>
  <text x="${cx}" y="${sloganBaseline}" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="17" fill="${GOLD}" fill-opacity="0.85" letter-spacing="0.2em">Find the right property faster, with confidence</text>
</svg>`;

await sharp(Buffer.from(splashSvg)).png().toFile(join(assets, "splash.png"));

/** Android notification: white abstract mark on transparent (no house glyph). */
const notif = `<svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
  <path d="M 28 18 L 28 78 L 40 78 L 40 52 L 72 52 L 72 40 L 40 40 L 40 18 Z" fill="#FFFFFF"/>
</svg>`;
await sharp(Buffer.from(notif)).png().toFile(join(assets, "notification-icon.png"));

console.log(
  "Wrote assets/icon.png, adaptive-icon.png, splash.png (1024×1024), notification-icon.png; icon-exports: icon-1024.png, icon-512.png, icon-192.png, icon-180.png."
);
