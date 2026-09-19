"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { pageHref } from "@/lib/catalog-seo";

export function PaginationLinks({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Страницы каталога"
      className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm"
    >
      {page > 1 && (
        <Link
          prefetch={false}
          href={pageHref(pathname, page - 1, params.toString())}
          className="text-primary hover:underline"
        >
          ← Предыдущая
        </Link>
      )}
      <span className="text-muted-foreground">
        Страница {page} из {totalPages}
      </span>
      {page < totalPages && (
        <Link
          prefetch={false}
          href={pageHref(pathname, page + 1, params.toString())}
          className="text-primary hover:underline"
        >
          Следующая →
        </Link>
      )}
    </nav>
  );
}
