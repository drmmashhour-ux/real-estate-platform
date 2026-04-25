export type ExecutionResult = {
  actionKey: string;
  ok: boolean;
  error?: string;
  data?: unknown;
};
