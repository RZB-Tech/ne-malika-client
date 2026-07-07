import { Suspense } from "react";
import { CatalogView, type SortKey } from "@/components/catalog/catalog-view";
import type { Availability } from "@/lib/data";

export const metadata = { title: "Каталог" };

const SORTS: SortKey[] = ["popular", "priceAsc", "priceDesc", "newest"];
const AVAIL: Availability[] = ["in_stock", "out_of_stock", "on_order"];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const avail = str(sp.availability);
  const sort = str(sp.sort);

  return (
    <Suspense>
      <CatalogView
        initial={{
          q: str(sp.q) ?? "",
          category: str(sp.category) ?? null,
          subcategory: str(sp.subcategory) ?? null,
          brands: str(sp.brand) ? [str(sp.brand)!] : [],
          availability: avail && AVAIL.includes(avail as Availability) ? [avail as Availability] : [],
          isNew: str(sp.new) === "1",
          isPromo: str(sp.promo) === "1",
          sort: sort && SORTS.includes(sort as SortKey) ? (sort as SortKey) : undefined,
        }}
      />
    </Suspense>
  );
}
