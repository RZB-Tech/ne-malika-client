export interface SpecPair {
  key: string;
  value: string;
}

export function cleanSpecs(specs: SpecPair[]): SpecPair[] {
  return specs
    .filter((s) => s.key.trim() && s.value.trim())
    .map((s) => ({ key: s.key.trim(), value: s.value.trim() }));
}

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
  photos: string[];
  price: number | null;
  state: "new" | "old";
  categoryId: number | null;
  specs: SpecPair[];
}

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
