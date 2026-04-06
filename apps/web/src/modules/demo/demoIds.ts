/** Stable ids for investor demo seed + data resolution (avoid collisions with random uuids). */
export const INVESTOR_DEMO_IDS = {
  HOST_USER: "inv-demo-usr-host-001",
  GUEST_USER: "inv-demo-usr-guest01",
  BNHUB_LISTING: "inv-demo-stay-001",
  FSBO_LISTING: "inv-demo-fsbo-001",
  CRM_LEAD: "inv-demo-lead-001",
  BOOKING: "inv-demo-bkg-001",
  BNHUB_LISTING_CODE: "LST-INVDEMO1",
  FSBO_LISTING_CODE: "LST-INVDEMO2",
} as const;

export const DEMO_PROPERTY_SLUGS = {
  bnhub: "bnhub",
  resale: "resale",
} as const;
