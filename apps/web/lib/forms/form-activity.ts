export function formatFormActivityNote(actor: "Admin" | "Broker" | "Client" | "System", detail: string) {
  return `[${actor}] ${detail}`;
}
