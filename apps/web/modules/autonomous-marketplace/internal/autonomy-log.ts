type Channel = "" | "[policy]" | "[execution]" | "[detector]" | "[signals]";

function line(channel: Channel, msg: string, payload?: Record<string, unknown>): void {
  const prefix = `[autonomous-marketplace]${channel}`;
  try {
    if (payload && Object.keys(payload).length > 0) {
      console.info(`${prefix} ${msg} ${JSON.stringify(payload)}`);
    } else {
      console.info(`${prefix} ${msg}`);
    }
  } catch {
    /* never throw */
  }
}

export const autonomyLog = {
  info: (msg: string, payload?: Record<string, unknown>) => line("", msg, payload),
  policy: (msg: string, payload?: Record<string, unknown>) => line("[policy]", msg, payload),
  execution: (msg: string, payload?: Record<string, unknown>) => line("[execution]", msg, payload),
  detector: (msg: string, payload?: Record<string, unknown>) => line("[detector]", msg, payload),
  signals: (msg: string, payload?: Record<string, unknown>) => line("[signals]", msg, payload),
};
