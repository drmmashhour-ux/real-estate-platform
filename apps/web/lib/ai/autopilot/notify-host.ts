import "server-only";

export async function notifyHostAutopilot(_input: {
  userId: string;
  locale: string;
  title: string;
  message: string;
}): Promise<void> {}
