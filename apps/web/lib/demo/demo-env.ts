/** Guided tour + demo analytics — staging or explicit demo flag only. */
export function isDemoTourRuntimeEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENV === "staging" || process.env.NEXT_PUBLIC_DEMO_TOUR === "1"
  );
}
