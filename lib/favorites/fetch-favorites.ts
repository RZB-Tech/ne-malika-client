import { favoritesControllerFindMine } from "@/lib/api/generated/endpoints/me-favorites/me-favorites";
import { getSessionVersion } from "@/lib/api/token-store";

export async function fetchAllFavorites(signal?: AbortSignal) {
  const session = getSessionVersion();
  const assertCurrent = () => {
    if (session !== getSessionVersion() || signal?.aborted) {
      throw new Error("Favorites request cancelled");
    }
  };
  assertCurrent();
  const first = await favoritesControllerFindMine({ page: 1, limit: 100 }, undefined, signal);
  assertCurrent();
  const data = [...first.data];
  for (let page = 2; page <= first.meta.totalPages; page++) {
    const next = await favoritesControllerFindMine({ page, limit: 100 }, undefined, signal);
    assertCurrent();
    data.push(...next.data);
  }
  return { ...first, data };
}
