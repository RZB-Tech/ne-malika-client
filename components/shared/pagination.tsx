"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Переключение страниц списка. Ничего не рисует, пока страница одна —
 * чтобы на коротких списках не висел мёртвый элемент управления.
 */
export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  /** Общее число записей — показываем рядом, чтобы был масштаб. */
  total?: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">
        {total !== undefined && `Всего: ${total}`}
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="size-4" /> Назад
        </Button>
        <span className="tabular text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Вперёд <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
