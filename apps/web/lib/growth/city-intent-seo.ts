import type { Metadata } from "next";
import type { GrowthCitySlug } from "@/lib/growth/geo-slugs";
import { growthCityDisplayName, growthCityRegion, growthCitySearchQuery } from "@/lib/growth/geo-slugs";

export type CityIntentKind = "buy" | "rent" | "mortgage";

export function buildCityIntentMetadata(
  intent: CityIntentKind,
  slug: GrowthCitySlug
): Metadata {
  const city = growthCityDisplayName(slug);
  const region = growthCityRegion(slug) === "US" ? "USA" : "Canada";
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || "https://lecipm.com";
  const path = `/${intent}/${slug}`;

  if (intent === "buy") {
    const title = `Buy a home in ${city} (${region}) | FSBO & listings | LECIPM`;
    const description = `Browse homes and FSBO listings in ${city}. Local market notes, FAQs, and a free consultation. Compare options in ${growthCitySearchQuery(slug)} on LECIPM.`;
    return {
      title,
      description,
      keywords: [`buy home ${city}`, `FSBO ${city}`, `real estate ${city}`, "LECIPM"],
      openGraph: {
        title,
        description,
        type: "website",
        url: `${base}${path}`,
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  if (intent === "rent") {
    const title = `Rent & short-term stays in ${city} | LECIPM BNHub`;
    const description = `Find verified stays and rentals in ${city}. Local benefits, traveler FAQs, and fast booking on LECIPM BNHub.`;
    return {
      title,
      description,
      keywords: [`rent ${city}`, `short term rental ${city}`, "BNHub", "LECIPM"],
      openGraph: {
        title,
        description,
        type: "website",
        url: `${base}${path}`,
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const title = `Mortgage broker & pre-approval in ${city} | LECIPM`;
  const description = `Get pre-approved, compare mortgage options, and talk to a verified expert serving ${city}. Free tools and local tips for ${region} buyers.`;
  return {
    title,
    description,
    keywords: [`mortgage ${city}`, `pre-approval ${city}`, "mortgage expert", "LECIPM"],
    openGraph: {
      title,
      description,
      type: "website",
      url: `${base}${path}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function intentBenefits(intent: CityIntentKind, slug: GrowthCitySlug): string[] {
  const city = growthCityDisplayName(slug);
  if (intent === "buy") {
    return [
      `Local FSBO and resale context for ${city}`,
      "Transparent process — speak with licensed professionals",
      "Free evaluation tools and fast response from our team",
    ];
  }
  if (intent === "rent") {
    return [
      `Curated stays and nightly rentals in ${city}`,
      "Verified BNHub hosts with clear pricing",
      "Guest protections and simple booking flow",
    ];
  }
  return [
    `Dedicated mortgage experts familiar with ${city}`,
    "Pre-approval guidance without pressure",
    "Platform tools + human support in one place",
  ];
}

export function intentFaqs(
  intent: CityIntentKind,
  slug: GrowthCitySlug
): Array<{ question: string; answer: string }> {
  const city = growthCityDisplayName(slug);
  if (intent === "buy") {
    return [
      {
        question: `How do I start buying in ${city}?`,
        answer: `Begin with a free property consultation or browse FSBO listings filtered for ${city}. Our team can connect you with local expertise when you're ready.`,
      },
      {
        question: "What is FSBO on LECIPM?",
        answer:
          "FSBO listings are offered directly by owners. You can explore homes, request info, and work with professionals for paperwork and negotiation.",
      },
      {
        question: "Is my consultation free?",
        answer:
          "Initial outreach and many platform tools are free. Any paid services are disclosed before you commit.",
      },
    ];
  }
  if (intent === "rent") {
    return [
      {
        question: `What can I rent in ${city}?`,
        answer: `BNHub offers short-term and travel stays in and near ${city}. Use filters for dates, guests, and neighbourhood preferences.`,
      },
      {
        question: "Are hosts verified?",
        answer:
          "We encourage verification and clear house rules. Always review listing details and cancellation policies before booking.",
      },
      {
        question: "Can I book for groups?",
        answer: "Many listings support multiple guests. Check the listing's guest limit and amenities.",
      },
    ];
  }
  return [
    {
      question: `How fast can I get pre-approved in ${city}?`,
      answer:
        "Many experts respond within one business day. Submit the mortgage inquiry form with your timeline for faster matching.",
    },
    {
      question: "Does LECIPM charge buyers for mortgage matching?",
      answer:
        "The platform provides tools and introductions; compensation to experts follows disclosed arrangements and regulations.",
    },
    {
      question: "What documents are typically needed?",
      answer:
        "Often income verification, identification, and asset summaries — your expert will provide a tailored checklist.",
    },
  ];
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
