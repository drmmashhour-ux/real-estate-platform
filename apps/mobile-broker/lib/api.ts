const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.lecipm.com";

export async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  return res.json();
}
