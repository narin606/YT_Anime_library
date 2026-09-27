export interface ViewerAccount {
  id: string;
  email: string;
  profiles: Array<{ id: string; name: string; avatar: string | null }>;
}

function apiBase() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!value) throw new Error("The account service is not configured.");
  return value;
}

async function request(path: string, init?: RequestInit): Promise<ViewerAccount> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
  });
  const payload = await response.json().catch(() => null) as { account?: ViewerAccount; error?: { message?: string } } | null;
  if (!response.ok || !payload?.account) throw new Error(payload?.error?.message ?? "The request failed.");
  return payload.account;
}

export function register(input: { name: string; email: string; password: string }) {
  return request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(input) });
}
export function login(input: { email: string; password: string }) {
  return request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(input) });
}
export function getViewer() { return request("/api/v1/auth/me"); }
export async function logout() {
  await fetch(`${apiBase()}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
}
