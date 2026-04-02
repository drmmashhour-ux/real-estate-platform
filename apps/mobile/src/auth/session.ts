import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "bnhub_mobile_session_token";

export async function getStoredSessionToken() {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function setStoredSessionToken(token: string) {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearStoredSessionToken() {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}
