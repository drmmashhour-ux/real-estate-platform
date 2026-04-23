/**
 * Upserts OACIQ standardized clauses into `clauses_library`.
 * Run: cd apps/web && npx tsx scripts/seed-oaciq-clauses-library.ts
 */
import { PrismaClient, OaciqClauseLibraryCategory, OaciqClauseFormVersion } from "@prisma/client";

const prisma = new PrismaClient();

type Row = {
  code: string;
  category: OaciqClauseLibraryCategory;
  title: string;
  description: string;
  templateText: string;
  requiresActor?: boolean;
  requiresDeadline?: boolean;
  requiresNotice?: boolean;
  requiresConsequence?: boolean;
  enforcementKey?: string | null;
};

const ROWS: Row[] = [
  {
    code: "BC-1.1",
    category: OaciqClauseLibraryCategory.brokerage_contract,
    title: "Rémunération réduite",
    description: "Clause de rémunération réduite ou modifiée.",
    templateText:
      "{{actor}} s'engage à {{action}}. Délai : {{deadline}}. Avis : {{notice}}. Sanction / effet : {{consequence}}.",
  },
  {
    code: "BC-2.1",
    category: OaciqClauseLibraryCategory.brokerage_contract,
    title: "Exclusion de garantie",
    description: "Exclusion de garantie des qualités.",
    templateText:
      "{{actor}} exclut expressément {{action}}. Échéance : {{deadline}}. Avis : {{notice}}. Conséquence : {{consequence}}.",
  },
  {
    code: "BC-3.1",
    category: OaciqClauseLibraryCategory.brokerage_contract,
    title: "Limitation de garantie légale",
    description: "Limitation de la garantie légale.",
    templateText:
      "{{actor}} limite {{action}}. Délai : {{deadline}}. Avis : {{notice}}. Recours : {{consequence}}.",
  },
  {
    code: "BC-4.1",
    category: OaciqClauseLibraryCategory.brokerage_contract,
    title: "Exclusion d'acheteur désigné",
    description: "Exclusion de personnes ou acheteurs désignés.",
    templateText:
      "{{actor}} exclut {{action}}. Jusqu'au : {{deadline}}. Avis : {{notice}}. Effet : {{consequence}}.",
  },
  {
    code: "BC-4.2",
    category: OaciqClauseLibraryCategory.brokerage_contract,
    title: "Entente de présentation par le vendeur",
    description: "Engagement du vendeur relativement à une offre d'achat.",
    templateText:
      "{{actor}} accepte de {{action}}. Date limite : {{deadline}}. Avis : {{notice}}. Effet : {{consequence}}.",
  },
  {
    code: "BC-5.1",
    category: OaciqClauseLibraryCategory.brokerage_contract,
    title: "Avis de résiliation",
    description: "Modalités de résiliation du contrat de courtage.",
    templateText:
      "{{actor}} peut résilier moyennant {{action}}. Préavis / délai : {{deadline}}. Forme d'avis : {{notice}}. Effets : {{consequence}}.",
  },
  {
    code: "BC-6.1",
    category: OaciqClauseLibraryCategory.brokerage_contract,
    title: "Avertissement — double représentation",
    description: "Divulgation et consentement — double représentation.",
    templateText:
      "{{actor}} reconnaît {{action}}. Échéance d'information : {{deadline}}. Divulgation : {{notice}}. Conséquences : {{consequence}}.",
    enforcementKey: "dual_representation",
  },
  {
    code: "AM-2.1",
    category: OaciqClauseLibraryCategory.amendment,
    title: "Avenant — inscription hors marché",
    description: "Suspend la visibilité publique; le contrat de courtage demeure.",
    templateText:
      "{{actor}} mandate {{action}}. Entrée en vigueur : {{deadline}}. Avis : {{notice}}. Effet : {{consequence}}.",
    enforcementKey: "off_market",
  },
  {
    code: "PP-1.1",
    category: OaciqClauseLibraryCategory.promise_to_purchase,
    title: "Dépôt de bonne foi",
    description: "Acompte ou dépôt lié à la promesse d'achat.",
    templateText:
      "{{actor}} verse {{action}} au plus tard le {{deadline}}. Confirmation : {{notice}}. Défaut : {{consequence}}.",
  },
  {
    code: "PP-2.1",
    category: OaciqClauseLibraryCategory.promise_to_purchase,
    title: "Condition d'inspection",
    description: "Inspection préachat.",
    templateText:
      "{{actor}} doit {{action}} avant le {{deadline}}. Avis : {{notice}}. Effet : {{consequence}}.",
  },
  {
    code: "PP-3.1",
    category: OaciqClauseLibraryCategory.promise_to_purchase,
    title: "Engagement d'assurance",
    description: "Preuve ou souscription d'assurance.",
    templateText:
      "{{actor}} fournit {{action}} pour {{deadline}}. Preuve : {{notice}}. Défaut : {{consequence}}.",
  },
  {
    code: "PP-4.1",
    category: OaciqClauseLibraryCategory.promise_to_purchase,
    title: "Vérification de zonage",
    description: "Conformité municipale / zonage.",
    templateText:
      "{{actor}} valide {{action}} avant le {{deadline}}. Transmission : {{notice}}. Si défavorable : {{consequence}}.",
  },
  {
    code: "PP-5.1",
    category: OaciqClauseLibraryCategory.promise_to_purchase,
    title: "Certificat de localisation",
    description: "Certificat de localisation à jour.",
    templateText:
      "{{actor}} obtient ou accepte {{action}} pour le {{deadline}}. Remise : {{notice}}. Sinon : {{consequence}}.",
  },
  {
    code: "PP-6.1",
    category: OaciqClauseLibraryCategory.promise_to_purchase,
    title: "Droits de visite",
    description: "Visites avant la signature chez le notaire.",
    templateText:
      "{{actor}} permet {{action}} selon : {{deadline}}. Coordination : {{notice}}. Manquement : {{consequence}}.",
  },
  {
    code: "PP-7.1",
    category: OaciqClauseLibraryCategory.promise_to_purchase,
    title: "Conditions d'acceptation",
    description: "Conditions suspensives ou résolutoires claires.",
    templateText:
      "{{actor}} est lié si {{action}} au plus tard le {{deadline}}. Preuve : {{notice}}. Sinon : {{consequence}}.",
  },
  {
    code: "OC-5.1",
    category: OaciqClauseLibraryCategory.other,
    title: "Dépôt de garantie — fidéicommis",
    description: "Fonds détenus en fidéicommis; conditions de libération.",
    templateText:
      "Le fiduciaire {{actor}} détient {{action}} jusqu'au {{deadline}}. Avis : {{notice}}. Libération : {{consequence}}.",
    enforcementKey: "security_deposit_trust",
  },
  {
    code: "ES-1.1",
    category: OaciqClauseLibraryCategory.enterprise_sale,
    title: "Cession d'entreprise — actifs",
    description: "Périmètre d'actifs; vente combinée immeuble + fonds.",
    templateText:
      "{{actor}} définit l'actif : {{action}}. Clôture cible : {{deadline}}. Due diligence : {{notice}}. Défaut : {{consequence}}.",
    enforcementKey: "enterprise_sale",
  },
];

async function main() {
  for (const r of ROWS) {
    await prisma.clausesLibrary.upsert({
      where: { code: r.code },
      create: {
        category: r.category,
        code: r.code,
        title: r.title,
        description: r.description,
        templateText: r.templateText,
        requiresActor: r.requiresActor ?? true,
        requiresDeadline: r.requiresDeadline ?? true,
        requiresNotice: r.requiresNotice ?? true,
        requiresConsequence: r.requiresConsequence ?? true,
        formVersion: OaciqClauseFormVersion.forms_2022_mandatory,
        active: true,
        enforcementKey: r.enforcementKey ?? null,
      },
      update: {
        category: r.category,
        title: r.title,
        description: r.description,
        templateText: r.templateText,
        requiresActor: r.requiresActor ?? true,
        requiresDeadline: r.requiresDeadline ?? true,
        requiresNotice: r.requiresNotice ?? true,
        requiresConsequence: r.requiresConsequence ?? true,
        formVersion: OaciqClauseFormVersion.forms_2022_mandatory,
        active: true,
        enforcementKey: r.enforcementKey ?? null,
      },
    });
  }
  console.log(`Upserted ${ROWS.length} clauses_library rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
