/** Пара «характеристика — значение» так, как её ждёт бэкенд товара. */
export interface SpecPair {
  key: string;
  value: string;
}

/** Только заполненные строки, без пробелов по краям. */
export function cleanSpecs(specs: SpecPair[]): SpecPair[] {
  return specs
    .filter((s) => s.key.trim() && s.value.trim())
    .map((s) => ({ key: s.key.trim(), value: s.value.trim() }));
}

/**
 * Бренд и модель из отдельных полей уходят в карточку первыми строками списка
 * характеристик. Модель ИИ иначе сочтёт бренд неизвестным и перепишет уже
 * заполненное продавцом.
 */
export function withBrandModel(
  brand: string | null | undefined,
  model: string | null | undefined,
  specs: SpecPair[],
): SpecPair[] {
  return [
    ...(brand?.trim() ? [{ key: "Бренд", value: brand.trim() }] : []),
    ...(model?.trim() ? [{ key: "Модель", value: model.trim() }] : []),
    ...specs,
  ];
}

export interface ProductFormValues {
  name: string;
  description: string;
  /** S3-ключи уже сохранённых фото. */
  photos: string[];
  /** null — «договорная». */
  price: number | null;
  state: "new" | "old";
  categoryId: number | null;
  specs: SpecPair[];
}

/**
 * Тело запроса создания/правки товара — общее для всех трёх форм (создание у
 * продавца, диалог у администратора, правка в кабинете). Раньше каждый блок
 * собирался отдельно и уже разошёлся деталями: кто-то триммировал значения
 * характеристик, кто-то нет.
 */
export function buildProductPayload(values: ProductFormValues): {
  name: string;
  description: string | undefined;
  photos: string[];
  price: number | null;
  state: "new" | "old";
  categoryId: number | undefined;
  characteristics: SpecPair[];
} {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    photos: values.photos,
    price: values.price,
    state: values.state,
    categoryId: values.categoryId ?? undefined,
    characteristics: cleanSpecs(values.specs),
  };
}
