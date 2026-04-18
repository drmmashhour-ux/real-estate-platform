/** Maps internal package keys to display labels only — does not alter official form identifiers. */
export function packageKeyToDisplayName(packageKey: string): string {
  return packageKey.replace(/_/g, " ");
}
