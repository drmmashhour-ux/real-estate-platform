export function subscribeOnline(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  return () => window.removeEventListener("online", callback);
}

export function subscribeOffline(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("offline", callback);
  return () => window.removeEventListener("offline", callback);
}

export function isNavigatorOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}
