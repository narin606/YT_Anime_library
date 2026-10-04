export function safeNextPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function loginPath(next: string, reason = "signin_required") {
  const params = new URLSearchParams({ next: safeNextPath(next), reason });
  return `/login?${params.toString()}`;
}

export function registerPath(next: string) {
  const params = new URLSearchParams({ next: safeNextPath(next) });
  return `/register?${params.toString()}`;
}
