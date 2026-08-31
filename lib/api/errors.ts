export function apiErrorMessage(
  error: unknown,
  t: (path: string) => string,
  fallbackKey: string,
): string {
  return error instanceof Error && error.message ? error.message : t(fallbackKey);
}

/**
 * Тот же fallback, но статусы, у которых есть собственный переведённый текст,
 * разбираются до обращения к серверному сообщению: бэкенд отвечает по-русски
 * независимо от Accept-Language, и на узбекских локалях это видно.
 */
export function apiErrorMessageByStatus(
  error: unknown,
  t: (path: string) => string,
  byStatus: Record<number, string>,
  fallbackKey: string,
): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const key = status === undefined ? undefined : byStatus[status];
  return key ? t(key) : apiErrorMessage(error, t, fallbackKey);
}
