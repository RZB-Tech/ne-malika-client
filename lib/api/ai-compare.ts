"use client";

import { useQuery } from "@tanstack/react-query";
import { aiCompareControllerCompare } from "@/lib/api/generated/endpoints/ai-compare/ai-compare";
import type { AiCompareResultDto } from "@/lib/api/generated/schemas";
import { useT } from "@/components/providers/i18n-provider";

/** Меньше двух товаров сравнивать нечем — столько же требует и бэкенд. */
export const AI_COMPARE_MIN = 2;

/**
 * ИИ-сравнение выбранных товаров.
 *
 * Запускается только по нажатию (`enabled`), а не при открытии страницы: каждый
 * непопавший в кэш запрос — это платный поход к модели, и открытая вкладка не
 * должна тратить деньги сама по себе.
 *
 * Язык входит в ключ запроса: ответ приходит на языке интерфейса, и после
 * переключения языка показывать прежний текст нельзя.
 *
 * Повторов нет намеренно: 502 от модели чаще всего повторится, а платим за
 * каждую попытку мы — человек нажмёт «ещё раз» сам, если захочет. По той же
 * причине долгий `staleTime`: ответ на тот же набор товаров бэкенд и так держит
 * сутки, и перезапрашивать его при возврате на вкладку незачем.
 */
export function useAiCompare(ids: number[], enabled: boolean) {
  const { locale } = useT();

  return useQuery<AiCompareResultDto>({
    queryKey: ["/api/v1/ai-compare", ids, locale] as const,
    queryFn: ({ signal }) =>
      aiCompareControllerCompare({ ids: ids.map(String) }, undefined, signal),
    enabled: enabled && ids.length >= AI_COMPARE_MIN,
    retry: false,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
