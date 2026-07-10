"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccessToken } from "@/lib/api/token-store";
import type { ProductStats } from "@/app/api/metrika/product-stats/route";

async function fetchStats(productId: number, shopId: number): Promise<ProductStats> {
  const token = getAccessToken();
  const res = await fetch(
    `/api/metrika/product-stats?productId=${productId}&shopId=${shopId}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  if (!res.ok) throw new Error(`Статистика недоступна (${res.status})`);
  return res.json() as Promise<ProductStats>;
}

export function ProductStatsCard({
  productId,
  shopId,
}: {
  productId: number;
  shopId: number;
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["product-stats", productId, shopId],
    queryFn: () => fetchStats(productId, shopId),
    // Ответ Метрики всё равно кэшируется на 5 минут — не дёргаем чаще.
    // В деве не кэшируем: после клика по кнопке цифры должны меняться сразу.
    staleTime: process.env.NODE_ENV === "development" ? 0 : 5 * 60_000,
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (isError || !data) {
    // Молча прятать блок нельзя: отличить «нет статистики» от «роут отдал 403» станет невозможно.
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Статистика просмотров временно недоступна
        {error instanceof Error ? `: ${error.message}` : ""}
      </Card>
    );
  }

  const empty = data.pageviews30d === 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="size-4 text-muted-foreground" />
        Просмотры карточки
      </div>

      {empty ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Пока никто не открывал эту карточку. Данные появятся в течение часа
          после первого просмотра.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
            <Stat label="за 30 дней" value={data.pageviews30d} />
            <Stat label="за 7 дней" value={data.pageviews7d} />
            <Stat label="уникальных посетителей" value={data.users30d} />
            <Sparkline points={data.daily.map((d) => d.pageviews)} />
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-4 border-t pt-5">
            <Stat label="показов телефона" value={data.contacts.phone.clicks} />
            <Stat label="переходов в Telegram" value={data.contacts.telegram.clicks} />
            <Conversion
              contacts={data.contacts.phone.users + data.contacts.telegram.users}
              views={data.users30d}
            />
          </div>
        </>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="tabular text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

/**
 * Доля посетителей, дошедших до контакта с продавцом. Единственное число здесь,
 * которое отвечает на вопрос «работает ли объявление», а не «сколько заходов».
 *
 * Считаем по людям, а не по кликам: один человек может и раскрыть телефон, и
 * уйти в Telegram, поэтому сумма контактов способна обогнать число посетителей.
 */
function Conversion({ contacts, views }: { contacts: number; views: number }) {
  if (views === 0) return null;
  const percent = Math.min(100, Math.round((contacts / views) * 100));
  return (
    <div>
      <div className="tabular text-2xl font-semibold">{percent}%</div>
      <div className="text-xs text-muted-foreground">посетителей дошли до контакта</div>
    </div>
  );
}

/** Полоски по дням: высота относительно самого активного дня периода. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  if (max === 0) return null;

  return (
    <div className="ml-auto flex h-10 items-end gap-0.5" aria-hidden>
      {points.map((value, i) => (
        <div
          key={i}
          className="w-1 rounded-t-sm bg-primary/25"
          style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
