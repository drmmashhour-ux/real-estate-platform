/**
 * Platform Content & Usage License — canonical text and i18n keys.
 * Legal copy is informational; platform enforcement is via `ContentLicenseAcceptance` + policy version.
 */

export const CONTENT_LICENSE_VERSION = "1.1.0" as const;

export type ContentLicenseLocale = "en" | "fr";

export type ContentLicenseSectionIcon = "doc" | "shield" | "scale" | "users";

export type ContentLicenseSection = {
  title: string;
  body: string;
  icon: ContentLicenseSectionIcon;
};

export const contentLicenseSummary: Record<ContentLicenseLocale, string> = {
  en: "By accessing, using, or contributing Content, you agree to comply with our Platform Content License and Usage Terms. This summary is for clarity only — the full terms below are the binding agreement.",
  fr: "En accédant à la plateforme, en l’utilisant ou en y contribuant du contenu, vous acceptez de respecter notre licence et conditions d’usage relatives au contenu. Ce résumé vise à faciliter la compréhension ; les conditions complètes ci-dessous font foi.",
};

const SECTIONS_EN: ContentLicenseSection[] = [
  {
    icon: "doc",
    title: "Welcome and agreement",
    body: `Welcome to our platform.

Our platform is a collaborative real estate ecosystem where users, brokers, hosts, and clients share listings, images, descriptions, and other content (collectively referred to as “Content”).

By accessing, using, or contributing Content, you agree to comply with our Platform Content License and Usage Terms.

This summary is provided for clarity only. The full legal terms remain the binding agreement.`,
  },
  {
    icon: "users",
    title: "What you are allowed to do",
    body: `• Use content for browsing, searching, and evaluating real estate opportunities

• Use content within the platform for personal or professional decision-making

• Share listings through platform tools (links, saved items, etc.)

• Adapt or analyze content using platform tools (AI, comparisons, insights)`,
  },
  {
    icon: "shield",
    title: "What you are NOT allowed to do",
    body: `• You may not copy, sell, or redistribute content outside the platform as standalone material

• You may not reuse listing photos or descriptions for commercial purposes outside the platform

• You may not use content in a misleading, fraudulent, or deceptive manner

• You may not use content in violation of applicable laws or regulations

• You may not use platform content as part of branding, marketing, or resale without authorization`,
  },
  {
    icon: "scale",
    title: "Important notice",
    body: `Some content may be subject to additional rights such as:
• copyright
• trademarks
• privacy rights
• ownership rights

You are responsible for ensuring that your use complies with all applicable laws and permissions.`,
  },
  {
    icon: "doc",
    title: "Platform responsibility disclaimer",
    body: `The platform provides tools, structure, and guidance.

We do not guarantee:
• legal validity of user-provided content
• financial outcomes
• property condition accuracy

Users remain responsible for verification, due diligence, and professional consultation.`,
  },
  {
    icon: "shield",
    title: "Acknowledgment",
    body: `By using the platform, you confirm that:
• you understand how content can be used
• you agree to comply with platform rules
• you accept responsibility for your actions`,
  },
];

const SECTIONS_FR: ContentLicenseSection[] = [
  {
    icon: "doc",
    title: "Bienvenue et accord",
    body: `Bienvenue sur notre plateforme.

Notre plateforme est un écosystème immobilier collaboratif où utilisateurs, courtiers, hôtes et clients partagent des annonces, images, descriptions et autres contenus (désignés collectivement par « Contenu »).

En accédant à la plateforme, en l’utilisant ou en y contribuant du Contenu, vous acceptez de respecter notre licence et conditions d’usage relatives au Contenu.

Ce résumé est fourni pour faciliter la compréhension. Les conditions juridiques complètes demeurent l’accord faisant foi.`,
  },
  {
    icon: "users",
    title: "Ce que vous êtes autorisé à faire",
    body: `• Utiliser le contenu pour parcourir, rechercher et évaluer des opportunités immobilières

• Utiliser le contenu au sein de la plateforme pour des décisions personnelles ou professionnelles

• Partager des annonces via les outils de la plateforme (liens, favoris, etc.)

• Adapter ou analyser le contenu avec les outils de la plateforme (IA, comparaisons, analyses)`,
  },
  {
    icon: "shield",
    title: "Ce qui vous est interdit",
    body: `• Copier, vendre ou redistribuer le contenu hors plateforme comme matériel autonome

• Réutiliser des photos ou descriptions d’annonce à des fins commerciales hors plateforme

• Utiliser le contenu de manière trompeuse, frauduleuse ou mensongère

• Utiliser le contenu en violation des lois ou règlements applicables

• Utiliser le contenu de la plateforme dans le cadre d’image de marque, de marketing ou de revente sans autorisation`,
  },
  {
    icon: "scale",
    title: "Avis important",
    body: `Certains contenus peuvent être soumis à des droits supplémentaires, notamment :
• droits d’auteur
• marques de commerce
• droits à la vie privée
• droits de propriété

Vous êtes responsable de vous assurer que votre usage respecte les lois et autorisations applicables.`,
  },
  {
    icon: "doc",
    title: "Clause de responsabilité de la plateforme",
    body: `La plateforme fournit des outils, une structure et des orientations.

Nous ne garantissons pas :
• la validité juridique du contenu fourni par les utilisateurs
• les résultats financiers
• l’exactitude de l’état des biens

Les utilisateurs demeurent responsables de la vérification, de la diligence raisonnable et de la consultation de professionnels.`,
  },
  {
    icon: "shield",
    title: "Reconnaissance",
    body: `En utilisant la plateforme, vous confirmez que :
• vous comprenez comment le contenu peut être utilisé
• vous acceptez de respecter les règles de la plateforme
• vous acceptez la responsabilité de vos actions`,
  },
];

function sectionsToFullText(sections: ContentLicenseSection[]): string {
  return sections
    .map((s, i) => `${i + 1}. ${s.title}\n\n${s.body}`)
    .join("\n\n");
}

/** Full license — English first (primary). */
export const contentLicenseFullText: Record<ContentLicenseLocale, string> = {
  en: sectionsToFullText(SECTIONS_EN),
  fr: sectionsToFullText(SECTIONS_FR),
};

export function getContentLicenseSections(locale: ContentLicenseLocale = "en"): ContentLicenseSection[] {
  if (locale === "fr") return SECTIONS_FR;
  return SECTIONS_EN;
}
