"use client";

import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import {
  Check,
  CircleAlert,
  Minus,
  Sparkles,
  TriangleAlert,
  Trophy,
  Wallet,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/providers/i18n-provider";
import { useCompare } from "@/lib/compare/use-compare";
import { AI_COMPARE_MIN, useAiCompare } from "@/lib/api/ai-compare";
import { apiErrorMessage } from "@/lib/api/errors";
import type {
  AiCompareProductDto,
  AiCompareResultDto,
} from "@/lib/api/generated/schemas";
import { cn } from "@/lib/utils";

/**
 * ИИ-сравнение выбранных товаров: разбор по составляющим, плюсы и минусы,
 * итог.
 *
 * Живёт под обычной таблицей и не подменяет её. Таблица показывает то, что
 * написал продавец, слово в слово, — здесь же начинается толкование, и путать
 * одно с другим нельзя: в таблице ошибиться может только продавец, а тут ещё и
 * модель.
 *
 * Запускается по нажатию. Автоматический запрос при открытии страницы означал
 * бы поход к платной модели каждый раз, когда кто-то заглянул в сравнение.
 *
 * Смена списка сравнения сбрасывает нажатие: прежний разбор относится к другим
 * столбцам. Сброс идёт во время рендера, а не в эффекте, — иначе один кадр
 * показывал бы разбор товаров, которых на странице уже нет.
 */
export function AiComparePanel() {
  const { t } = useT();
  const { items, ids } = useCompare();

  const [asked, setAsked] = useState(false);

  const key = ids.join(",");
  const [askedFor, setAskedFor] = useState(key);
  if (askedFor !== key) {
    setAskedFor(key);
    setAsked(false);
  }

  const { data, isFetching, isError, error, refetch } = useAiCompare(ids, asked);

  if (items.length === 0) return null;

  const enough = items.length >= AI_COMPARE_MIN;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Sparkles className="size-5 text-primary" />
          {t("aiCompare.title")}
        </h2>
        <Badge variant="secondary">{t("aiCompare.free")}</Badge>
      </div>

      <p className="mt-1.5 text-sm text-muted-foreground">
        {enough ? t("aiCompare.lead") : t("aiCompare.needMore")}
      </p>

      {isError && !isFetching && (
        <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {errorText(error, t)}
        </p>
      )}

      {!data && !isFetching && (
        <Button
          type="button"
          disabled={!enough}
          onClick={() => {
            if (asked) void refetch();
            setAsked(true);
          }}
          className="mt-4 gap-2"
        >
          <Sparkles />
          {isError ? t("aiCompare.retry") : t("aiCompare.run")}
        </Button>
      )}

      {isFetching && <Loading text={t("aiCompare.loading")} />}

      {data && !isFetching && <Result result={data} />}
    </section>
  );
}

/**
 * Текст ошибки. Бэкенд объясняет отказ по-человечески, и перехватчик кладёт это
 * объяснение в message — кроме лимита частоты: там наружу летит «ThrottlerException:
 * Too Many Requests», и вместо него нужна своя фраза.
 */
function errorText(error: unknown, t: (path: string) => string): string {
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    return t("aiCompare.tooOften");
  }
  return apiErrorMessage(error, t, "aiCompare.failed");
}

function Loading({ text }: { text: string }) {
  return (
    <div className="mt-4 space-y-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-4 animate-pulse text-primary" />
        {text}
      </p>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

function Result({ result }: { result: AiCompareResultDto }) {
  const { t } = useT();

  return (
    <div className="mt-5 space-y-6">
      {result.summary && <p className="text-sm leading-relaxed">{result.summary}</p>}

      {!result.comparable && (
        <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {t("aiCompare.notComparable")}
        </p>
      )}

      {result.rows.length > 0 && <SpecTable result={result} />}

      {result.products.some(hasNotes) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {result.products.map((product) => (
            <ProductNotes key={product.id} product={product} />
          ))}
        </div>
      )}

      <Verdict result={result} />

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
        {t("aiCompare.disclaimer")}
      </p>
    </div>
  );
}

function hasNotes(product: AiCompareProductDto): boolean {
  return (
    product.pros.length > 0 || product.cons.length > 0 || Boolean(product.bestFor)
  );
}

/**
 * Таблица по составляющим. Устроена как обычная таблица сравнения: подписи в
 * липком левом столбце, товары — колонками, поэтому взгляд не переучивается при
 * переходе от одной к другой.
 */
function SpecTable({ result }: { result: AiCompareResultDto }) {
  const { t } = useT();

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
        {t("aiCompare.specs")}
      </h3>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-24 border-r border-border bg-card p-3 text-left align-top sm:w-40" />
              {result.products.map((product) => (
                <th
                  key={product.id}
                  className="min-w-[140px] border-l border-border p-3 text-left align-top text-sm font-medium sm:min-w-[180px]"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="line-clamp-2 hover:text-primary"
                  >
                    {product.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {result.rows.map((row, i) => (
              <tr key={`${row.component}-${i}`} className="border-t border-border">
                <th
                  scope="row"
                  className="sticky left-0 z-20 border-r border-border bg-card p-3 text-left align-top font-medium"
                >
                  {row.component}
                  {row.note && (
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {row.note}
                    </span>
                  )}
                </th>

                {result.products.map((product, j) => {
                  const best = row.bestId === product.id;
                  return (
                    <td
                      key={product.id}
                      className={cn(
                        "border-l border-border p-3 align-top",
                        i % 2 === 0 && "bg-muted/30",
                        best && "bg-primary/10 font-medium",
                      )}
                    >
                      <span className="flex items-start gap-1.5">
                        {best && (
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-label={t("aiCompare.best")}
                          />
                        )}
                        {row.values[j] ?? "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductNotes({ product }: { product: AiCompareProductDto }) {
  const { t } = useT();

  return (
    <div className="rounded-xl border border-border p-4">
      <Link
        href={`/product/${product.id}`}
        className="line-clamp-2 font-medium hover:text-primary"
      >
        {product.name}
      </Link>

      {product.pros.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {product.pros.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {product.cons.length > 0 && (
        <ul className="mt-2 space-y-1.5 text-sm">
          {product.cons.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-muted-foreground">
              <Minus className="mt-0.5 size-4 shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {product.bestFor && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {t("aiCompare.bestFor")}:{" "}
          </span>
          {product.bestFor}
        </p>
      )}
    </div>
  );
}

function Verdict({ result }: { result: AiCompareResultDto }) {
  const { t } = useT();

  const nameOf = (id: number | null) =>
    id === null ? null : (result.products.find((p) => p.id === id)?.name ?? null);

  const best = nameOf(result.verdict.bestId);
  const value = nameOf(result.verdict.valueId);

  if (!best && !value && !result.verdict.text) return null;

  return (
    <div className="rounded-xl bg-primary/5 p-4">
      <h3 className="text-sm font-medium">{t("aiCompare.verdict")}</h3>

      {(best || value) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {best && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-xs">
              <Trophy className="size-3.5 text-primary" />
              <span className="text-muted-foreground">
                {t("aiCompare.strongest")}:
              </span>
              <span className="font-medium">{best}</span>
            </span>
          )}
          {value && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-xs">
              <Wallet className="size-3.5 text-primary" />
              <span className="text-muted-foreground">
                {t("aiCompare.value")}:
              </span>
              <span className="font-medium">{value}</span>
            </span>
          )}
        </div>
      )}

      {result.verdict.text && (
        <p className="mt-2.5 text-sm leading-relaxed">{result.verdict.text}</p>
      )}
    </div>
  );
}
