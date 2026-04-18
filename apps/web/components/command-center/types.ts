import type { buildCommandCenterPayload } from "@/modules/command-center/command-center.service";

export type CommandCenterPayload = Awaited<ReturnType<typeof buildCommandCenterPayload>>;
