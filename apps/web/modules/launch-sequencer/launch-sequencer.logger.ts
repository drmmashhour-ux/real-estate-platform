type Meta = Record<string, unknown> | undefined;

/**
 * Structured logs for launch sequencer (ops visibility). Never throws.
 */
export const launchSequencerLog = {
  info(event: string, meta?: Meta) {
    try {
      // eslint-disable-next-line no-console
      console.info("[launch-sequencer]", event, meta ?? "");
    } catch {
      /* noop */
    }
  },
  warn(event: string, meta?: Meta) {
    try {
      // eslint-disable-next-line no-console
      console.warn("[launch-sequencer]", event, meta ?? "");
    } catch {
      /* noop */
    }
  },
};
