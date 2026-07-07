"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/shared/section-header";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useT } from "@/components/providers/i18n-provider";
import { categories, categoryProductCount } from "@/lib/data";

export function CategoriesSection() {
  const { t, locale } = useT();
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeader
        title={t("home.categoriesTitle")}
        subtitle={t("home.categoriesSubtitle")}
        href="/catalog"
        linkLabel={t("home.viewAll")}
        className="mb-7"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/catalog?category=${c.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <CategoryIcon name={c.icon} className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium leading-tight text-foreground">
                {c.name[locale]}
              </span>
              <span className="text-xs text-muted-foreground tabular">
                {categoryProductCount(c.slug)} {t("common.goods")}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
