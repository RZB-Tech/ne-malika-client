"use client";

import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useT } from "@/components/providers/i18n-provider";
import { categories, categoryProductCount } from "@/lib/data";

export default function AdminCategories() {
  const { t, locale } = useT();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{t("admin.nav.categories")}</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular">{categories.length}</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          {t("common.add")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Card key={c.slug} className="flex flex-row items-center gap-4 p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <CategoryIcon name={c.icon} className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{c.name[locale]}</h3>
                <Badge variant="secondary" className="tabular">{categoryProductCount(c.slug)}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {c.subcategories.map((s) => (
                  <span key={s.slug} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {s.name[locale]}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
