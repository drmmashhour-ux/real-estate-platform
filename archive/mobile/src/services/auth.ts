import * as SecureStore from "expo-secure-store";

const JWT_KEY = "lecipm_mobile_jwt";

/** Persists the Supabase access token (JWT) for axios and offline-first header reads. */
export async function persistAccessToken(token: string | null): Promise<void> {
  try {
    if (!token) {
      await SecureStore.deleteItemAsync(JWT_KEY);
      return;
    }
    await SecureStore.setItemAsync(JWT_KEY, token);
  } catch {
    /* simulator / keychain edge cases */
  }
}

export async function getStoredAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(JWT_KEY);
  } catch {
    return null;
  }
}

export async function clearStoredAccessToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(JWT_KEY);
  } catch {
    /* ignore */
  }
}
