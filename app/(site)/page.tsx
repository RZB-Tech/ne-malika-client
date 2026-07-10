import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";

export default function HomePage() {
  return (
    <Suspense>
      <CatalogView />
    </Suspense>
  );
}
