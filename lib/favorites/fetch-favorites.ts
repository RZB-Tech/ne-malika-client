import { favoritesControllerFindMine } from "@/lib/api/generated/endpoints/me-favorites/me-favorites";

export async function fetchAllFavorites(signal?: AbortSignal) {
  const first = await favoritesControllerFindMine({ page: 1, limit: 100 }, undefined, signal);
  const data = [...first.data];
  for (let page = 2; page <= first.meta.totalPages; page++) {
    const next = await favoritesControllerFindMine({ page, limit: 100 }, undefined, signal);
    data.push(...next.data);
  }
  return { ...first, data };
}
