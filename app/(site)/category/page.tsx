import Link from "next/link";
import { connection } from "next/server";
import { getPublicCategories } from "@/lib/api/server";
import { categoryEntries, catalogMetadata } from "@/lib/catalog-seo";
import { PageContainer } from "@/components/layout/page-container";

export const metadata = catalogMetadata(
  "Каталог техники и IT-услуг в Ташкенте",
  "Категории neMalika: ноутбуки, компьютеры, комплектующие, периферия и IT-услуги. Предложения магазинов рынка Малика.",
  "/category",
);

export default async function CategoryDirectory() {
  await connection();
  const roots = await getPublicCategories();
  const entries = categoryEntries(roots);
  return (
    <PageContainer className="py-8">
      <h1 className="font-heading text-3xl font-bold">Каталог техники и IT-услуг</h1>
      <p className="mt-3 text-muted-foreground">
        Выберите категорию, чтобы посмотреть предложения магазинов рынка Малика в Ташкенте.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roots.map((root) => (
          <section key={root.id} className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold">
              <Link
                href={`/category/${encodeURIComponent(root.slug)}`}
                className="hover:text-primary"
              >
                {root.name.ru}
              </Link>
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {entries
                .filter((e) => e.root.id === root.id && e.path.length > 1)
                .map((entry) => (
                  <li key={entry.category.id}>
                    <Link prefetch={false} href={entry.href} className="hover:text-primary">
                      {entry.category.name.ru}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
