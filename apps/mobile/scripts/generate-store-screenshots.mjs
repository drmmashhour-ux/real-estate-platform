/**
 * App Store / Play Store screenshots — black + gold, minimal copy + clean UI abstractions.
 * Outputs iPhone 6.7" (1290×2796) and Android phone portrait (1080×1920).
 * Replace with real UI captures when ready; these are on-brand marketing frames.
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outRoot = join(root, "assets", "store-screenshots");

const BG = "#000000";
const GOLD = "#D4AF37";
const MUTED = "rgba(212, 175, 55, 0.55)";
const PANEL = "#0C0C0C";
const STROKE = "rgba(212, 175, 55, 0.22)";

const SIZES = [
  { dir: "iphone-1290x2796", w: 1290, h: 2796 },
  { dir: "android-1080x1920", w: 1080, h: 1920 },
];

const SLIDES = [
  {
    file: "01-hero.png",
    variant: "hero",
    title: "Find the right property faster",
    sub: "AI-powered search for smarter decisions",
  },
  {
    file: "02-search.png",
    variant: "search",
    title: "Advanced property search",
    sub: "Filters, map, and smart results",
  },
  {
    file: "03-trust.png",
    variant: "trust",
    title: "Verified listings only",
    sub: "Direct contact with owners & brokers",
  },
  {
    file: "04-speed.png",
    variant: "speed",
    title: "Contact in seconds",
    sub: "No friction. No hidden fees",
  },
  {
    file: "05-ai.png",
    variant: "ai",
    title: "AI-powered insights",
    sub: "Make confident decisions",
  },
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {object} slide
 * @param {number} W
 * @param {number} H
 */
function slideSvg(slide, W, H) {
  const cx = W / 2;
  const padX = W * 0.065;
  const phoneW = W * 0.84;
  const phoneH = H * 0.5;
  const phoneX = (W - phoneW) / 2;
  const phoneY = H * 0.085;
  const rx = Math.round(phoneW * 0.045);
  const titleSize = Math.round(W * 0.046);
  const subSize = Math.round(W * 0.028);
  const copyTop = phoneY + phoneH + H * 0.06;
  const titleY = copyTop + titleSize * 0.85;
  const subY = titleY + titleSize * 0.55 + subSize * 1.15;

  const inner = (fn) => fn(phoneX, phoneY, phoneW, phoneH, rx);

  const mockup =
    slide.variant === "hero"
      ? inner(mockupHero)
      : slide.variant === "search"
        ? inner(mockupSearch)
        : slide.variant === "trust"
          ? inner(mockupTrust)
          : slide.variant === "speed"
            ? inner(mockupSpeed)
            : inner(mockupAi);

  const glow = `
  <defs>
    <radialGradient id="sg" cx="50%" cy="28%" r="65%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.09"/>
      <stop offset="55%" stop-color="${GOLD}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${BG}"/>
  <rect width="100%" height="100%" fill="url(#sg)"/>
  `;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  ${glow}
  ${mockup}
  <text x="${cx}" y="${titleY}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${titleSize}" font-weight="800" fill="${GOLD}" text-anchor="middle" letter-spacing="-0.02em">${escapeXml(slide.title)}</text>
  <text x="${cx}" y="${subY}" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${subSize}" fill="${MUTED}" text-anchor="middle" letter-spacing="0.02em">${escapeXml(slide.sub)}</text>
</svg>`;
}

/** @param {number} x @param {number} y @param {number} w @param {number} h @param {number} rx */
function mockupHero(x, y, w, h, rx) {
  const p = w * 0.055;
  const barH = h * 0.11;
  const cardY = y + h * 0.22;
  const cardH = h * 0.58;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${PANEL}" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="${Math.max(2, w * 0.002)}"/>
  <rect x="${x + p}" y="${y + h * 0.08}" width="${w - p * 2}" height="${barH}" rx="${rx * 0.35}" fill="#111" stroke="${STROKE}" stroke-width="1"/>
  <circle cx="${x + p + barH * 0.35}" cy="${y + h * 0.08 + barH / 2}" r="${barH * 0.22}" fill="none" stroke="${GOLD}" stroke-opacity="0.6" stroke-width="2"/>
  <line x1="${x + p + barH * 0.65}" y1="${y + h * 0.08 + barH * 0.38}" x2="${x + w - p - barH}" y2="${y + h * 0.08 + barH * 0.38}" stroke="#333" stroke-width="2" stroke-linecap="round"/>
  <rect x="${x + p}" y="${cardY}" width="${w - p * 2}" height="${cardH}" rx="${rx * 0.4}" fill="#080808" stroke="${STROKE}"/>
  <line x1="${x + p + w * 0.08}" y1="${cardY + cardH * 0.35}" x2="${x + w - p - w * 0.08}" y2="${cardY + cardH * 0.35}" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="2"/>
  <rect x="${x + p + w * 0.08}" y="${cardY + cardH * 0.48}" width="${(w - p * 2) * 0.35}" height="10" rx="4" fill="${GOLD}" fill-opacity="0.25"/>
  <rect x="${x + p + w * 0.08}" y="${cardY + cardH * 0.62}" width="${(w - p * 2) * 0.55}" height="8" rx="3" fill="#222"/>
  `;
}

function mockupSearch(x, y, w, h, rx) {
  const p = w * 0.055;
  const chipH = h * 0.065;
  const chipY = y + h * 0.1;
  const chipW = (w - p * 2 - 16) / 3;
  const mapY = chipY + chipH + h * 0.05;
  const mapH = h * 0.38;
  const listY = mapY + mapH + h * 0.04;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${PANEL}" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="${Math.max(2, w * 0.002)}"/>
  <rect x="${x + p}" y="${chipY}" width="${chipW}" height="${chipH}" rx="${chipH / 2}" fill="#151515" stroke="${STROKE}"/>
  <rect x="${x + p + chipW + 8}" y="${chipY}" width="${chipW}" height="${chipH}" rx="${chipH / 2}" fill="#151515" stroke="${GOLD}" stroke-opacity="0.45"/>
  <rect x="${x + p + (chipW + 8) * 2}" y="${chipY}" width="${chipW}" height="${chipH}" rx="${chipH / 2}" fill="#151515" stroke="${STROKE}"/>
  <rect x="${x + p}" y="${mapY}" width="${w - p * 2}" height="${mapH}" rx="${rx * 0.35}" fill="#0A0A0A" stroke="${STROKE}"/>
  <circle cx="${x + p + mapH * 0.45}" cy="${mapY + mapH * 0.48}" r="${mapH * 0.12}" fill="none" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="2"/>
  <path d="M ${x + p + mapH * 0.45} ${mapY + mapH * 0.48} L ${x + w - p - mapH * 0.2} ${mapY + mapH * 0.35}" stroke="#333" stroke-width="2" fill="none"/>
  <rect x="${x + p}" y="${listY}" width="${w - p * 2}" height="${h * 0.1}" rx="10" fill="#111" stroke="${STROKE}"/>
  <rect x="${x + p}" y="${listY + h * 0.115}" width="${w - p * 2}" height="${h * 0.1}" rx="10" fill="#111" stroke="${STROKE}"/>
  `;
}

function mockupTrust(x, y, w, h, rx) {
  const p = w * 0.055;
  const badge = h * 0.18;
  const bx = x + w / 2 - badge / 2;
  const by = y + h * 0.14;
  const rowY = by + badge + h * 0.08;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${PANEL}" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="${Math.max(2, w * 0.002)}"/>
  <circle cx="${x + w / 2}" cy="${by + badge / 2}" r="${badge * 0.42}" fill="none" stroke="${GOLD}" stroke-opacity="0.7" stroke-width="3"/>
  <path d="M ${x + w / 2 - badge * 0.12} ${by + badge * 0.48} L ${x + w / 2 - badge * 0.02} ${by + badge * 0.58} L ${x + w / 2 + badge * 0.18} ${by + badge * 0.38}" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="${x + p}" y="${rowY}" width="${w - p * 2}" height="${h * 0.12}" rx="12" fill="#111" stroke="${STROKE}"/>
  <circle cx="${x + p + 16}" cy="${rowY + h * 0.06}" r="5" fill="${GOLD}" fill-opacity="0.7"/>
  <rect x="${x + p + 32}" y="${rowY + h * 0.04}" width="${w * 0.45}" height="8" rx="3" fill="#333"/>
  <rect x="${x + p}" y="${rowY + h * 0.14}" width="${w - p * 2}" height="${h * 0.12}" rx="12" fill="#111" stroke="${STROKE}"/>
  <circle cx="${x + p + 16}" cy="${rowY + h * 0.14 + h * 0.06}" r="5" fill="${GOLD}" fill-opacity="0.7"/>
  <rect x="${x + p + 32}" y="${rowY + h * 0.14 + h * 0.04}" width="${w * 0.4}" height="8" rx="3" fill="#333"/>
  `;
}

function mockupSpeed(x, y, w, h, rx) {
  const p = w * 0.065;
  const b1w = w * 0.62;
  const b1h = h * 0.11;
  const b1y = y + h * 0.2;
  const b2y = b1y + b1h + h * 0.04;
  const send = h * 0.1;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${PANEL}" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="${Math.max(2, w * 0.002)}"/>
  <rect x="${x + p}" y="${b1y}" width="${b1w}" height="${b1h}" rx="${b1h / 2}" fill="#141414" stroke="${STROKE}"/>
  <rect x="${x + w - p - b1w * 0.75}" y="${b2y}" width="${b1w * 0.75}" height="${b1h}" rx="${b1h / 2}" fill="#101010" stroke="${GOLD}" stroke-opacity="0.25"/>
  <circle cx="${x + w - p - send / 2}" cy="${b2y + b1h + h * 0.08 + send / 2}" r="${send * 0.42}" fill="${GOLD}" fill-opacity="0.85"/>
  <path d="M ${x + w - p - send / 2 - 4} ${b2y + b1h + h * 0.08 + send / 2 - 8} L ${x + w - p - send / 2 + 10} ${b2y + b1h + h * 0.08 + send / 2} L ${x + w - p - send / 2 - 4} ${b2y + b1h + h * 0.08 + send / 2 + 8} Z" fill="#000"/>
  <line x1="${x + p}" y1="${y + h * 0.12}" x2="${x + w - p}" y2="${y + h * 0.12}" stroke="#222" stroke-width="2"/>
  `;
}

function mockupAi(x, y, w, h, rx) {
  const p = w * 0.055;
  const chartY = y + h * 0.18;
  const chartH = h * 0.45;
  const bw = (w - p * 2 - 36) / 4;
  const baseY = chartY + chartH;
  const heights = [0.35, 0.55, 0.42, 0.68];
  let bars = "";
  for (let i = 0; i < 4; i++) {
    const bx = x + p + i * (bw + 12);
    const bh = chartH * heights[i];
    bars += `<rect x="${bx}" y="${baseY - bh}" width="${bw}" height="${bh}" rx="6" fill="${GOLD}" fill-opacity="${0.25 + i * 0.12}"/>`;
  }
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${PANEL}" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="${Math.max(2, w * 0.002)}"/>
  <text x="${x + w / 2}" y="${y + h * 0.1}" font-family="system-ui, sans-serif" font-size="${Math.round(w * 0.032)}" fill="#444" text-anchor="middle">Insights</text>
  ${bars}
  <path d="M ${x + p} ${chartY + chartH * 0.35} Q ${x + w / 2} ${chartY} ${x + w - p} ${chartY + chartH * 0.25}" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="3" fill="none"/>
  `;
}

await mkdir(outRoot, { recursive: true });

for (const size of SIZES) {
  const dir = join(outRoot, size.dir);
  await mkdir(dir, { recursive: true });
  for (const slide of SLIDES) {
    const svg = slideSvg(slide, size.w, size.h);
    await sharp(Buffer.from(svg)).png().toFile(join(dir, slide.file));
  }
}

console.log(
  `Wrote ${SLIDES.length} screens × ${SIZES.length} sizes → assets/store-screenshots/{iphone-1290x2796,android-1080x1920}/`
);
