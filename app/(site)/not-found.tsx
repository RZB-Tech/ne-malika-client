"use client";

import Link from "next/link";
import { SearchX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";

export default function SiteNotFound() {
  const { t } = useT();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
      <SearchX className="size-12 text-muted-foreground/50" />
      <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight">
        {t("product.notFound")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("product.notFoundText")}</p>
      <Button asChild className="mt-6">
        <Link href="/">{t("product.toCatalog")}</Link>
      </Button>
    </div>
  );
}
