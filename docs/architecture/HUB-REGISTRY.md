# Hub registry

## API (`lib/hub/core/hub-registry.ts`)

| Function | Description |
|----------|-------------|
| `registerHub(def)` | Register a hub definition (used internally at init). |
| `getHubConfig(hubKey)` | Full `HubDefinition` or `undefined`. |
| `listRegisteredHubKeys()` | All keys. |
| `listEnabledHubs()` | Hubs with `status !== "disabled"`. |
| `listHubKeysForSwitcher()` | Theme keys in UX order for engine hubs that are enabled + `showInSwitcher`. |
| `resolveHubFromRoute(pathname)` | Best-effort hub from URL (BNHub, broker dashboard, `/hub/*`). |
| `resolveHubTheme(hubKey)` | Delegates to `getHubTheme(themeKey)`. |
| `resolveHubFeatures(hubKey)` | Feature flags from definition. |
| `parseHubRouteContext(pathname)` | `{ hubKey, pathname, segments }`. |

## Registered hubs (initial)

| Key | Status | Route base | Notes |
|-----|--------|------------|------|
| `bnhub` | enabled | `/bnhub` | Flagship stays — full feature set. |
| `broker` | enabled | `/dashboard/broker` | BrokerHub (CRM / transactions). |
| `carhub` | disabled unless env | `/hub/carhub` | Beta when `NEXT_PUBLIC_HUB_CAR_ENABLED=1`. |
| `servicehub` | disabled unless env | `/hub/servicehub` | Placeholder. |
| `investorhub` | disabled unless env | `/hub/investorhub` | Internal shell; page gated to ADMIN/INVESTOR. |

## Relationship to legal `config/hubs.ts`

- **Legal hub configs** (verification, contracts) stay in `config/hubs.ts`.
- **Product hub engine** registry describes UX, routing, and operational modes — complementary, not duplicate keys for the same concern.
