"use client";

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
      items = EMPTY;
    }
  }

  read();

  function persist(next: T[]) {
    items = next.length > 0 ? next : EMPTY;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(items));
      } catch {
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
