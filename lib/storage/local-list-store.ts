"use client";

// Общая механика личных списков покупателя: история просмотров, избранное,
// сравнение. Все трое живут в localStorage, читаются через useSyncExternalStore
// и переживают перезагрузку страницы — различаются только ключом, правилами
// добавления и тем, уезжают ли они потом на бэкенд.
//
// Фабрика намеренно ничего не знает про эти правила: сортировку, потолок и
// семантику повторного добавления задаёт вызывающий код.

export interface StoredItem {
  id: number;
}

export interface LocalListStore<T extends StoredItem> {
  get: () => T[];
  /** Стабильная пустая ссылка для серверного снапшота useSyncExternalStore. */
  getEmpty: () => T[];
  subscribe: (listener: () => void) => () => void;
  has: (id: number) => boolean;
  /** Заменяет список результатом функции и сохраняет его. */
  update: (next: (items: T[]) => T[]) => void;
  remove: (id: number) => void;
  clear: () => void;
}

export function createLocalListStore<T extends StoredItem>({
  storageKey,
  isValid,
}: {
  storageKey: string;
  /** Отсеивает чужие и устаревшие записи под тем же ключом. */
  isValid: (value: unknown) => value is T;
}): LocalListStore<T> {
  // Пустой массив — константа: useSyncExternalStore сравнивает снапшоты по
  // ссылке и уходит в бесконечный рендер, если каждый раз возвращать новый [].
  const EMPTY: T[] = [];

  let items: T[] = EMPTY;
  const listeners = new Set<() => void>();

  function read() {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      items = Array.isArray(parsed) ? parsed.filter(isValid) : EMPTY;
    } catch {
      // Испорченная запись под тем же ключом — не повод падать при старте
      // приложения; начинаем список заново.
      items = EMPTY;
    }
  }

  // Синхронно при загрузке модуля в браузере — как в token-store.
  read();

  function persist(next: T[]) {
    items = next.length > 0 ? next : EMPTY;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(items));
      } catch {
        // Приватный режим или переполненное хранилище: список — не то, ради
        // чего стоит ронять страницу товара.
      }
    }
    listeners.forEach((l) => l());
  }

  return {
    get: () => items,
    getEmpty: () => EMPTY,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    has: (id) => items.some((i) => i.id === id),
    update(next) {
      persist(next(items));
    },
    remove(id) {
      const next = items.filter((i) => i.id !== id);
      if (next.length !== items.length) persist(next);
    },
    clear() {
      if (items.length > 0) persist(EMPTY);
    },
  };
}
