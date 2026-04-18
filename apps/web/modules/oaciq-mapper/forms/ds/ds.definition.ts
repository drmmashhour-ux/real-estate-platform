import type { FormDefinition } from "../../form-definition.types";

const yesNoDetail = (base: string, label: string, path: string) => [
  {
    fieldKey: `${base}.yesNo`,
    label: `${label} — yes/no`,
    fieldType: "boolean" as const,
    required: false,
    sourcePaths: [`${path}.yesNo`],
    displayGroup: base,
    validationRuleRefs: ["ds.yesno_detail"],
  },
  {
    fieldKey: `${base}.detail`,
    label: `${label} — detail`,
    fieldType: "textarea" as const,
    required: false,
    sourcePaths: [`${path}.detail`],
    displayGroup: base,
    validationRuleRefs: ["ds.yesno_detail"],
  },
];

export const dsDefinition: FormDefinition = {
  formKey: "DS",
  officialCode: "DS",
  title: "Seller's declaration — specimen mapping",
  mandatoryOrRecommended: "mandatory",
  versionLabel: "mapper-v1",
  principalOrRelated: "related",
  baseWorkflow: "residential_sale_disclosure",
  sections: [
    {
      sectionKey: "ds.d1",
      sectionLabel: "DS.D1 Identification of immovable",
      order: 1,
      fields: [
        {
          fieldKey: "ds.d1.address",
          label: "Immovable address",
          fieldType: "textarea",
          required: true,
          sourcePaths: ["deal.immovable.addressLine", "deal.immovable.fullAddress"],
          displayGroup: "immovable",
          validationRuleRefs: [],
        },
        {
          fieldKey: "ds.d1.cadastral",
          label: "Cadastral description",
          fieldType: "textarea",
          required: false,
          sourcePaths: ["deal.immovable.cadastralDescription"],
          displayGroup: "immovable",
          validationRuleRefs: [],
        },
      ],
    },
    {
      sectionKey: "ds.d2",
      sectionLabel: "DS.D2 General information",
      order: 2,
      fields: [
        { fieldKey: "ds.d2.acquisitionYear", label: "Year of acquisition", fieldType: "number", required: false, sourcePaths: ["deal.disclosures.acquisitionYear"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.constructionYear", label: "Year of construction", fieldType: "number", required: false, sourcePaths: ["deal.disclosures.constructionYear"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.occupancyBySeller", label: "Occupancy by seller", fieldType: "boolean", required: false, sourcePaths: ["deal.disclosures.occupancyBySeller"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.leasingStatus", label: "Leasing status", fieldType: "text", required: false, sourcePaths: ["deal.disclosures.leasingStatus"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.shortTermRental", label: "Short-term rental", fieldType: "boolean", required: false, sourcePaths: ["deal.disclosures.shortTermRental"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.housingComplex", label: "Housing complex", fieldType: "boolean", required: false, sourcePaths: ["deal.disclosures.housingComplex"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.chargesHypothecs", label: "Charges / hypothecs / servitudes", fieldType: "textarea", required: false, sourcePaths: ["deal.disclosures.chargesHypothecs"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.publicLawRestrictions", label: "Public law restrictions", fieldType: "boolean", required: false, sourcePaths: ["deal.disclosures.publicLawRestrictions"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.locationCertificateChanges", label: "Location / certificate-related changes", fieldType: "boolean", required: false, sourcePaths: ["deal.disclosures.locationCertificateChanges"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.nonComplianceNotices", label: "Notices of non-compliance", fieldType: "boolean", required: false, sourcePaths: ["deal.disclosures.nonComplianceNotices"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.insuranceRefusal", label: "Insurance refusal", fieldType: "boolean", required: false, sourcePaths: ["deal.disclosures.insuranceRefusal"], displayGroup: "general", validationRuleRefs: [] },
        { fieldKey: "ds.d2.environmentalIssues", label: "Environmental issues", fieldType: "boolean", required: false, sourcePaths: ["deal.disclosures.environmentalIssues"], displayGroup: "general", validationRuleRefs: [] },
      ],
    },
    {
      sectionKey: "ds.d3",
      sectionLabel: "DS.D3 Land / soil",
      order: 3,
      fields: yesNoDetail("ds.d3.land", "Land / soil", "deal.disclosures.issues.land"),
    },
    {
      sectionKey: "ds.d4",
      sectionLabel: "DS.D4 Water damage",
      order: 4,
      fields: yesNoDetail("ds.d4.water", "Water damage", "deal.disclosures.issues.waterDamage"),
    },
    {
      sectionKey: "ds.d5",
      sectionLabel: "DS.D5 Basement / foundation",
      order: 5,
      fields: yesNoDetail("ds.d5.basement", "Basement / foundation", "deal.disclosures.issues.basement"),
    },
    {
      sectionKey: "ds.d6",
      sectionLabel: "DS.D6 Undesirable animals / pests",
      order: 6,
      fields: yesNoDetail("ds.d6.pests", "Undesirable animals", "deal.disclosures.issues.pests"),
    },
    {
      sectionKey: "ds.d15",
      sectionLabel: "DS.D15 Details / supporting documents",
      order: 15,
      fields: [
        {
          fieldKey: "ds.d15.detailNotes",
          label: "Structured detail notes",
          fieldType: "textarea",
          required: false,
          sourcePaths: ["deal.disclosures.detailNotes"],
          displayGroup: "details",
          validationRuleRefs: [],
        },
        {
          fieldKey: "ds.d15.supportingDocs",
          label: "Supporting documents checklist / references",
          fieldType: "textarea",
          required: false,
          sourcePaths: ["deal.supportingDocs.references"],
          displayGroup: "details",
          validationRuleRefs: [],
        },
      ],
    },
  ],
  dependencies: [
    { ruleId: "ds.linked_residential", description: "Strongly linked to residential sale workflows", dependsOnFormKeys: ["PP"] },
  ],
  validationRules: [
    { ruleId: "ds.yesno_detail", description: "If yes/no indicates issue, detail should be reviewed" },
  ],
  previewOrder: ["ds.d1", "ds.d2", "ds.d3", "ds.d4", "ds.d5", "ds.d6", "ds.d15"],
};
