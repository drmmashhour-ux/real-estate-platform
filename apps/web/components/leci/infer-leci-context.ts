/**
 * Best-effort hints from URL for LECI — no PII; complements optional `LeciPlatformContext`.
 */
export function inferHintsFromPathname(pathname: string): string[] {
  const p = pathname.toLowerCase();
  const hints: string[] = [];
  if (/garantie|warranty|exclusion/.test(p)) hints.push("Contexte probable: garantie légale / exclusions de garantie.");
  if (/turbo|draft|brouillon|promise|offre/.test(p)) hints.push("Contexte probable: rédaction d’offre ou brouillon guidé.");
  if (/listing|annonce|property|propriété/.test(p)) hints.push("Contexte probable: fiche propriété ou inscription.");
  if (/sign|signature/.test(p)) hints.push("Contexte probable: signature ou porte de signature.");
  if (/compliance|conformit|trust|risk|risque/.test(p)) hints.push("Contexte probable: conformité, risques ou trust hub.");
  if (/marketing\/demo|\/demo/.test(p)) hints.push("Contexte probable: démo ou formation présentateur.");
  if (/marketing\/objections/.test(p)) hints.push("Contexte probable: objections courtiers — préparer des réponses.");
  if (/deal|dossier/.test(p)) hints.push("Contexte probable: dossier / transaction.");
  return hints;
}
