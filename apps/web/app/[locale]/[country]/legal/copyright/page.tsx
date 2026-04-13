import Link from "next/link";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_LEGAL_DISPLAY,
  PLATFORM_NAME,
  PLATFORM_OPERATOR,
} from "@/lib/brand/platform";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Copyright & legal ownership",
  description: `Copyright, trademark, and ownership of ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}) platform assets — ${PLATFORM_OPERATOR}.`,
};

export default function CopyrightPage() {
  return (
    <LegalPageLayout title="Copyright & legal ownership" backHref="/legal">
      <p className="lead text-lg text-[#D4D4D4]">
        <strong className="text-premium-gold">Platform name:</strong> {PLATFORM_LEGAL_DISPLAY}, operated by {PLATFORM_OPERATOR}.{" "}
        <strong className="text-white">All rights reserved.</strong>
      </p>

      <h2>Exclusive property</h2>
      <p>
        All content, design, branding, software, source and object code, databases, APIs, algorithms,
        documentation, and platform functionality are the{" "}
        <strong>
          exclusive property of {PLATFORM_CARREFOUR_NAME} / {PLATFORM_OPERATOR}
        </strong>{" "}
        and its
        licensors unless
        otherwise stated in writing.
      </p>

      <h2>What this covers</h2>
      <ul>
        <li>
          <strong>UI/UX:</strong> layouts, flows, components, and visual design of the platform.
        </li>
        <li>
          <strong>Databases &amp; data structures:</strong> schemas, indexes, and aggregated platform datasets
          (excluding user-owned listing content — see{" "}
          <Link href="/legal/terms">Terms of Service</Link>, user content license).
        </li>
        <li>
          <strong>AI tools:</strong> prompts, models integration layers, scoring logic, and automation built
          into the product (subject to third-party model providers’ terms).
        </li>
        <li>
          <strong>Listings structure:</strong> taxonomy, fields, LEC-style codes, verification workflows, and
          marketplace mechanics as implemented on {PLATFORM_CARREFOUR_NAME}.
        </li>
        <li>
          <strong>Branding:</strong> the names <strong>{PLATFORM_CARREFOUR_NAME}</strong>,{" "}
          <strong>{PLATFORM_NAME}</strong> (abbreviation), and <strong>{PLATFORM_OPERATOR}</strong>, logos, color systems
          (including black + gold trade dress), and marketing assets.
        </li>
      </ul>

      <h2>Restrictions</h2>
      <p>
        No right or license is granted except as expressly allowed by {PLATFORM_CARREFOUR_NAME} in
        writing or by law. You may not
        copy, scrape, reverse engineer, frame, or misrepresent the platform or its branding.{" "}
        <strong>Unauthorized use of branding, logos, or identity is strictly prohibited.</strong>
      </p>

      <h2>User content</h2>
      <p>
        Users retain ownership of their own listings, photos, and text. By using the platform they grant{" "}
        {PLATFORM_CARREFOUR_NAME} a license to display and promote that content as described in the{" "}
        <Link href="/legal/terms">Terms of Service</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Rights inquiries: <a href="mailto:info@lecipm.com">info@lecipm.com</a>
      </p>
    </LegalPageLayout>
  );
}
