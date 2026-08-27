export function randomCatalogSeed(): string {
  return `${Math.random().toString(36).slice(2)}00000000`.slice(0, 8);
}
