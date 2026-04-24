/**
 * LECIPM Contract Brain — central registry of injectable legal notices (OACIQ-style).
 */

export const LIMITED_ROLE_NOTICE_KEY = "LIMITED_ROLE_NOTICE" as const;

export type ContractBrainNoticeKey = typeof LIMITED_ROLE_NOTICE_KEY;

export type ContractBrainNoticeCategory = "REPRESENTATION_AND_FAIR_TREATMENT";

export type ContractBrainNoticeDefinition = {
  key: ContractBrainNoticeKey;
  version: string;
  title: string;
  /** Full French body as shown to the user and stored in audit snapshots */
  bodyFr: string;
  /**
   * When the interacting party is not represented and deals with the other party’s broker
   * (e.g. seller’s or landlord’s broker).
   */
  requiredWhen: "user_not_represented_interacting_with_other_party_broker";
  category: ContractBrainNoticeCategory;
};

const LIMITED_ROLE_BODY_FR = `Si vous n'êtes pas représenté par un courtier, le courtier avec qui vous interagissez représente les intérêts de son client, par exemple le vendeur ou le locateur.

Dans ce contexte, son rôle est limité :
- il ne peut pas vous conseiller comme votre représentant;
- il ne peut pas défendre vos intérêts personnels;
- il doit vous offrir un traitement équitable;
- il doit vous informer clairement de son rôle;
- il doit vous recommander de faire appel à votre propre courtier pour être représenté, si vous le souhaitez.

Vous pouvez consulter les guides de l'acheteur et du vendeur disponibles sur le site de l'OACIQ, ou contacter Info OACIQ pour mieux comprendre vos droits et obligations.`;

export const CONTRACT_BRAIN_NOTICE_DEFINITIONS: Record<ContractBrainNoticeKey, ContractBrainNoticeDefinition> = {
  LIMITED_ROLE_NOTICE: {
    key: LIMITED_ROLE_NOTICE_KEY,
    version: "1.0.0",
    title: "Avis important – Rôle limité du courtier",
    bodyFr: LIMITED_ROLE_BODY_FR,
    requiredWhen: "user_not_represented_interacting_with_other_party_broker",
    category: "REPRESENTATION_AND_FAIR_TREATMENT",
  },
};

export function getContractBrainNoticeDefinition(key: string): ContractBrainNoticeDefinition | null {
  if (key === LIMITED_ROLE_NOTICE_KEY) return CONTRACT_BRAIN_NOTICE_DEFINITIONS.LIMITED_ROLE_NOTICE;
  return null;
}

export function formatNoticeSnapshotBody(def: ContractBrainNoticeDefinition): string {
  return `${def.title}\n\n${def.bodyFr}`;
}
