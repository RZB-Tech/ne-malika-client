/**
 * Кассы, доступные продавцу. Payme пока скрыт: касса проходит песочницу,
 * и до этого момента продавцы платят только через Click. Включается без
 * правок кода — NEXT_PUBLIC_PAYME_ENABLED=true.
 */
export const PAYME_ENABLED = process.env.NEXT_PUBLIC_PAYME_ENABLED === "true";
