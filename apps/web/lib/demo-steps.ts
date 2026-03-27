export {
  getDemoSteps,
  resolveDemoRoute,
  type DemoStep,
  type TourId,
  isTourId,
} from "@/lib/demo/demo-steps";

import { getDemoSteps } from "@/lib/demo/demo-steps";

/** Default tour steps for legacy imports (standard user). */
export const demoSteps = getDemoSteps("standard_user_tour");
