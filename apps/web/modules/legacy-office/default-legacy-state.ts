import type { LegacyOfficeState } from "./entity.types";

/** Illustrative graph for demos — replace with your own structure. */
export function createDefaultLegacyOfficeState(): LegacyOfficeState {
  return {
    entities: [
      {
        id: "fo-1",
        name: "Example Family Office LLC (info)",
        entityType: "FAMILY_OFFICE",
        parentEntityId: null,
        jurisdiction: "Delaware (example)",
        ownershipNotes: "Illustrative only.",
        governanceNotes: "Coordination entity for reporting — not legal characterization.",
        informationalParentHeldFraction: null,
      },
      {
        id: "hold-1",
        name: "Example Top HoldCo Inc.",
        entityType: "HOLDING",
        parentEntityId: "fo-1",
        jurisdiction: "Delaware (example)",
        ownershipNotes: "Parent holds 100% of HoldCo in this demo.",
        governanceNotes: "",
        informationalParentHeldFraction: 1,
      },
      {
        id: "op-1",
        name: "Example Operating Co.",
        entityType: "OPERATING",
        parentEntityId: "hold-1",
        jurisdiction: "Delaware (example)",
        ownershipNotes: "Core operating business (example).",
        governanceNotes: "Founder CEO — key person for operations (informational note).",
        informationalParentHeldFraction: 1,
      },
      {
        id: "iv-1",
        name: "Example PE / VC Feeder LP",
        entityType: "INVESTMENT_VEHICLE",
        parentEntityId: "hold-1",
        jurisdiction: "Delaware (example)",
        ownershipNotes: "",
        governanceNotes: "",
        informationalParentHeldFraction: 0.85,
      },
      {
        id: "tl-1",
        name: "Example Trust-like block (info)",
        entityType: "TRUST_LIKE_INFO",
        parentEntityId: "hold-1",
        jurisdiction: null,
        ownershipNotes: "Informational placeholder — not a trust document.",
        governanceNotes: "",
        informationalParentHeldFraction: null,
      },
    ],
    trustLikeProfiles: [
      {
        id: "tlp-1",
        entityId: "tl-1",
        informationalOnly: true,
        summaryNotes: "Describe fiduciary roles and distribution policy in your own records (not here).",
        trusteeOrFiduciaryNotes: "",
        beneficiaryClassNotes: "",
        amendmentOrTerminationNotes: "",
      },
    ],
  };
}
