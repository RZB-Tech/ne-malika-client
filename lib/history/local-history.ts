"use client";

// История просмотров устройства.
//
// Пишется всегда, в том числе анониму: покупатель на витрине не обязан входить,
// а увидеть «что я недавно смотрел» должен. После входа накопленное уезжает на
// бэкенд (POST /me/product-views/sync) и дальше история читается оттуда — но
// локальную копию мы не стираем, иначе выход из аккаунта обнулял бы её на ровном
// месте.
//
// Снимок карточки храним целиком, а не один id: список в кабинете должен
// рисоваться сразу, без похода в API за названиями и ценами.

/** Товар в локальной истории — минимум полей для карточки на витрине. */
export interface ViewedProduct {
  id: number;
  shopId: number;
  shopName: string;
  name: string;
  /** numeric с бэкенда приходит строкой — храним как есть. */
  price: string;
  /** Ключ файла в S3, не готовый URL: адрес прокси может измениться. */
  photo: string | null;
  state: "new" | "old";
  /** ISO-дата последнего просмотра. */
  viewedAt: string;
}

const STORAGE_KEY = "nemalika.viewHistory";

/** Потолок совпадает с ArrayMaxSize на бэкенде: всю историю шлём одним запросом. */
export const MAX_LOCAL_HISTORY = 100;

// Пустой массив — константа: useSyncExternalStore сравнивает снапшоты по
// ссылке и уходит в бесконечный рендер, если каждый раз возвращать новый [].
const EMPTY: ViewedProduct[] = [];

let history: ViewedProduct[] = EMPTY;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function isViewedProduct(value: unknown): value is ViewedProduct {
  const v = value as Partial<ViewedProduct> | null;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.id === "number" &&
    typeof v.name === "string" &&
    typeof v.viewedAt === "string"
  );
}

function readStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    history = Array.isArray(parsed) ? parsed.filter(isViewedProduct) : EMPTY;
  } catch {
    // Чужая или испорченная запись под тем же ключом — не повод падать при
    // старте приложения; просто начинаем историю заново.
    history = EMPTY;
  }
}

// Синхронно при загрузке модуля в браузере — как в token-store.
readStorage();

function persist(next: ViewedProduct[]) {
  history = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Приватный режим или переполненное хранилище: история — не та вещь,
      // ради которой стоит ронять просмотр товара.
    }
  }
  emit();
}

export function getLocalHistory(): ViewedProduct[] {
  return history;
}

/** Стабильная ссылка для серверного снапшота useSyncExternalStore. */
export function getEmptyHistory(): ViewedProduct[] {
  return EMPTY;
}

/**
 * Записывает просмотр. Повторный заход поднимает товар наверх, а не добавляет
 * второй такой же — история отвечает на вопрос «что я смотрел», а не «сколько раз».
 */
export function recordLocalView(
  product: Omit<ViewedProduct, "viewedAt">,
  viewedAt = new Date().toISOString(),
) {
  const next = [
    { ...product, viewedAt },
    ...history.filter((p) => p.id !== product.id),
  ].slice(0, MAX_LOCAL_HISTORY);
  persist(next);
}

export function removeLocalView(id: number) {
  const next = history.filter((p) => p.id !== id);
  if (next.length !== history.length) persist(next);
}

export function clearLocalHistory() {
  if (history.length > 0) persist(EMPTY);
}

export function subscribeLocalHistory(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
