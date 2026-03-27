export function maskEmail(email: string | undefined): string | null {
  if (!email) return null;
  const [a, domain] = email.split("@");
  if (!domain) return "***";
  if (a.length <= 2) return `**@${domain}`;
  return `${a[0]}***@${domain}`;
}
