/** True when client asked to persist this generation as a draft row. */
export function shouldSaveGeneration(body: { save?: boolean; saveDraft?: boolean }): boolean {
  return body.save === true || body.saveDraft === true;
}
