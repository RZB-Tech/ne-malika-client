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
