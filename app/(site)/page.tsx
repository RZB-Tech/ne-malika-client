import { Suspense } from "react";
import { CatalogView, type SortKey } from "@/components/catalog/catalog-view";

const SORTS: SortKey[] = ["latest", "oldest", "priceAsc", "priceDesc"];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const num = (v: string | string[] | undefined) => {
    const n = Number(str(v));
    return Number.isFinite(n) ? n : null;
  };

  const sort = str(sp.sort);

  return (
    <Suspense>
      <CatalogView
        initial={{
          q: str(sp.q) ?? "",
          priceMin: num(sp.priceMin),
          priceMax: num(sp.priceMax),
          sort: sort && SORTS.includes(sort as SortKey) ? (sort as SortKey) : undefined,
        }}
      />
    </Suspense>
  );
}
