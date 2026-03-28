/**
 * Verify static assets under apps/web/public required for launch UI / PDFs.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = resolve(root, "apps/web/public");

const REQUIRED: string[] = [
  "logo.png",
  "icon.png",
  "branding/logo-dark.svg",
  "branding/logo-light.svg",
  "branding/logo-icon.svg",
  "brand/lecipm-full-on-dark.svg",
  "flags/canada.svg",
  "flags/quebec.svg",
  "images/broker.jpg",
  "templates/instagram-property-1.png",
  "templates/property-brochure-1.png",
  "templates/real-estate-poster-1.png",
];

let failed = false;
for (const rel of REQUIRED) {
  const abs = resolve(pub, rel);
  if (!existsSync(abs)) {
    console.error(`❌ Missing asset: public/${rel}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`✔ All ${REQUIRED.length} checked assets exist under apps/web/public`);
