export function apiErrorMessage(
  error: unknown,
  t: (path: string) => string,
  fallbackKey: string,
): string {
  return error instanceof Error && error.message
    ? error.message
    : t(fallbackKey);
}
