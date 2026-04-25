import type {
  CityPlaybook,
  LaunchIntegrationSnapshot,
  LaunchPhaseId,
  LaunchStep,
} from "./city-launch.types";

export function stepId(territoryId: string, slug: string): string {
  return `${territoryId}:${slug}`;
}

type StepDef = Omit<LaunchStep, "id"> & { slug: string };

function mk(
  territoryId: string,
  phaseId: LaunchPhaseId,
  slug: string,
  rest: Omit<StepDef, "slug" | "phaseId">
): LaunchStep {
  return {
    id: stepId(territoryId, slug),
    phaseId,
    ...rest,
  };
}

/** Canonical executable steps — tuned per playbook priority hubs where relevant. */
export function buildLaunchStepsForPlaybook(
  playbook: CityPlaybook,
  integration: LaunchIntegrationSnapshot
): LaunchStep[] {
  const { territoryId } = playbook;
  const hubOrder = playbook.priorityHubs.length ? playbook.priorityHubs : integration.dominantHubs;
  const leadHub = hubOrder[0] ?? "BROKER";
  const secondHub = hubOrder[1] ?? "BNHUB";

  const pre: LaunchStep[] = [
    mk(territoryId, "PRE_LAUNCH", "broker-top-50", {
      title: "Identify top 50 broker prospects",
      description:
        "Build a ranked list from MLS visibility, sphere overlap, and referral likelihood. Assign owners in CRM.",
      category: "SALES",
      assignedHub: "BROKER",
      priority: "P0",
      estimatedEffort: "M",
      expectedImpact: "HIGH",
      dependencies: [],
      successMetric: "Target list approved + first contact dates logged",
      linkedGrowthThemes: ["OUTREACH_PRIORITY"],
    }),
    mk(territoryId, "PRE_LAUNCH", "localized-landing", {
      title: "Publish localized launch landing page",
      description:
        "Single URL with proof, routing CTAs to BNHub / buyer / seller flows. Validate core Web Vitals.",
      category: "MARKETING",
      assignedHub: leadHub === "BNHUB" ? "BNHUB" : "BUYER",
      priority: "P0",
      estimatedEffort: "M",
      expectedImpact: "HIGH",
      dependencies: [],
      successMetric: "Page live + primary CTA events firing in analytics",
      linkedGrowthThemes: ["GENERATE_CONTENT"],
    }),
    mk(territoryId, "PRE_LAUNCH", "content-7-day", {
      title: "Ship 7-day localized content sprint",
      description:
        "Short-form + one long guide mapped to intent clusters; schedule in marketing engine calendar.",
      category: "MARKETING",
      assignedHub: "SELLER",
      priority: "P1",
      estimatedEffort: "L",
      expectedImpact: "MEDIUM",
      dependencies: [stepId(territoryId, "localized-landing")],
      successMetric: "7 assets scheduled/published with UTM discipline",
      linkedGrowthThemes: ["QUEUE_CONTENT_DRAFT"],
    }),
    mk(territoryId, "PRE_LAUNCH", "supply-audit", {
      title: "Audit supply readiness (listings + stays)",
      description:
        "Inventory pipeline vs demand proxy; flag BNHub activation blockers and residence bundle options.",
      category: "SUPPLY",
      assignedHub: secondHub,
      priority: "P1",
      estimatedEffort: "S",
      expectedImpact: "MEDIUM",
      dependencies: [],
      successMetric: "Written audit + top 10 supply gaps with owners",
    }),
    mk(territoryId, "PRE_LAUNCH", "ops-routing", {
      title: "Define ops routing & escalation matrix",
      description:
        "Who owns broker onboarding, BNHub disputes, investor diligence — aligned to Lead Engine queues.",
      category: "OPS",
      assignedHub: "BROKER",
      priority: "P2",
      estimatedEffort: "S",
      expectedImpact: "MEDIUM",
      dependencies: [],
      successMetric: "SLA doc approved; routing live in CRM",
    }),
  ];

  const launch: LaunchStep[] = [
    mk(territoryId, "LAUNCH", "brokers-first-5", {
      title: "Onboard first 5 brokers",
      description:
        "Contracts signed, product training done, lead routing tested with live shadowing.",
      category: "SALES",
      assignedHub: "BROKER",
      priority: "P0",
      estimatedEffort: "L",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "broker-top-50")],
      successMetric: "5 active broker seats with weekly activity",
    }),
    mk(territoryId, "LAUNCH", "listings-10", {
      title: "Publish 10 quality listings",
      description:
        "Media + disclosure completeness; moderation queue cleared; seller onboarding checklist complete.",
      category: "SUPPLY",
      assignedHub: "SELLER",
      priority: "P0",
      estimatedEffort: "M",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "supply-audit")],
      successMetric: "10 live listings meeting quality bar",
    }),
    mk(territoryId, "LAUNCH", "targeted-content-campaign", {
      title: "Run targeted launch content campaign",
      description:
        "Paid/organic burst tied to landing + segments; coordinate with Growth Brain priority actions.",
      category: "MARKETING",
      assignedHub: leadHub,
      priority: "P1",
      estimatedEffort: "M",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "content-7-day")],
      successMetric: "Reach + engagement baselines captured; CPL directionally known",
      linkedGrowthThemes: ["ACTIVATE_CAMPAIGN"],
    }),
    mk(territoryId, "LAUNCH", "lead-engine-live", {
      title: "Activate Lead Engine capture + routing",
      description:
        "Forms, chat, and listing CTAs routed with attribution; nightly review of drops.",
      category: "PRODUCT",
      assignedHub: "BUYER",
      priority: "P0",
      estimatedEffort: "S",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "ops-routing")],
      successMetric: "Zero orphan leads in pilot cohort for 5 business days",
      linkedGrowthThemes: ["ROUTE_LEAD_PRIORITY"],
    }),
  ];

  const traction: LaunchStep[] = [
    mk(territoryId, "EARLY_TRACTION", "leads-50", {
      title: "Generate 50 qualified leads",
      description:
        "Blend inbound + broker-sourced; define qualification rubric shared with AI Sales Manager cadences.",
      category: "SALES",
      assignedHub: "BUYER",
      priority: "P0",
      estimatedEffort: "L",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "lead-engine-live")],
      successMetric: "50 SQLs logged with source + next step",
    }),
    mk(territoryId, "EARLY_TRACTION", "deals-3", {
      title: "Close first 3 deals",
      description:
        "Use Revenue Predictor risk view to prioritize winnable stages; weekly deal review.",
      category: "SALES",
      assignedHub: "BROKER",
      priority: "P0",
      estimatedEffort: "XL",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "brokers-first-5")],
      successMetric: "3 accepted offers or signed stays with margin guardrails",
    }),
    mk(territoryId, "EARLY_TRACTION", "testimonials", {
      title: "Collect 3 testimonials / case snippets",
      description:
        "Video or written — approved for landing + social proof strip; store in DAM with usage rights.",
      category: "MARKETING",
      assignedHub: "SELLER",
      priority: "P2",
      estimatedEffort: "S",
      expectedImpact: "MEDIUM",
      dependencies: [],
      successMetric: "3 published proof points linked from launch page",
    }),
    mk(territoryId, "EARLY_TRACTION", "bnhub-early", {
      title: "Light up early BNHub inventory & promos",
      description:
        "Minimum viable stays with pricing experiments; sync with bookings metric target.",
      category: "SUPPLY",
      assignedHub: "BNHUB",
      priority: "P1",
      estimatedEffort: "M",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "listings-10")],
      successMetric: "Nightly booking pipeline visible; first paid stay",
    }),
  ];

  const scale: LaunchStep[] = [
    mk(territoryId, "SCALE", "broker-network", {
      title: "Expand broker network (wave 2)",
      description:
        "Partner referrals + recruiting sprints; enable co-marketing kits from marketing engine.",
      category: "SALES",
      assignedHub: "BROKER",
      priority: "P1",
      estimatedEffort: "L",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "deals-3")],
      successMetric: "+15 active brokers vs launch baseline",
    }),
    mk(territoryId, "SCALE", "bnhub-inventory", {
      title: "Increase BNHub inventory depth",
      description:
        "Host incentives + onboarding playbooks; monitor occupancy vs demand signals from Domination dashboard.",
      category: "SUPPLY",
      assignedHub: "BNHUB",
      priority: "P0",
      estimatedEffort: "L",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "bnhub-early")],
      successMetric: "Inventory count + booking volume up vs prior 4 weeks",
    }),
    mk(territoryId, "SCALE", "investor-content", {
      title: "Activate investor content & deal room",
      description:
        "Webinars + diligence templates; route investor leads with AI Sales Manager scripts.",
      category: "MARKETING",
      assignedHub: "INVESTOR",
      priority: "P2",
      estimatedEffort: "M",
      expectedImpact: "MEDIUM",
      dependencies: [],
      successMetric: "Investor pipeline stages populated with SLAs",
    }),
  ];

  const domination: LaunchStep[] = [
    mk(territoryId, "DOMINATION", "cro-program", {
      title: "Conversion optimization program",
      description:
        "A/B landing + funnel fixes; weekly experiment log with kill criteria.",
      category: "PRODUCT",
      assignedHub: "BUYER",
      priority: "P1",
      estimatedEffort: "M",
      expectedImpact: "HIGH",
      dependencies: [stepId(territoryId, "leads-50")],
      successMetric: "Lift in qualified lead → tour/showing rate vs baseline",
    }),
    mk(territoryId, "DOMINATION", "seo-region", {
      title: "Regional SEO dominance sprint",
      description:
        "Topic clusters + technical fixes; coordinate with SEO growth module for canonical cities.",
      category: "MARKETING",
      assignedHub: "SELLER",
      priority: "P2",
      estimatedEffort: "XL",
      expectedImpact: "HIGH",
      dependencies: [],
      successMetric: "Share of voice uplift on tracked head terms (directional)",
    }),
    mk(territoryId, "DOMINATION", "retention-loop", {
      title: "Retention & repeat usage loops",
      description:
        "Lifecycle messaging for buyers/hosts/investors; monitor churn and repeat bookings.",
      category: "OPS",
      assignedHub: "BUYER",
      priority: "P2",
      estimatedEffort: "M",
      expectedImpact: "MEDIUM",
      dependencies: [],
      successMetric: "Repeat event rate + NPS sample improving week-on-week",
    }),
  ];

  return [...pre, ...launch, ...traction, ...scale, ...domination];
}
