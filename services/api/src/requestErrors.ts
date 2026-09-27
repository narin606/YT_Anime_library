export function isMalformedJsonError(error: unknown): boolean {
  if (!(error instanceof SyntaxError)) return false;
  const parsed = error as SyntaxError & { status?: number; type?: string };
  return parsed.status === 400 && parsed.type === "entity.parse.failed";
}
