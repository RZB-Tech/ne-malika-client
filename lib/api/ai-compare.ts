"use client";

import { useQuery } from "@tanstack/react-query";
import { aiCompareControllerCompare } from "@/lib/api/generated/endpoints/ai-compare/ai-compare";
import type { AiCompareResultDto } from "@/lib/api/generated/schemas";
import { useT } from "@/components/providers/i18n-provider";

export const AI_COMPARE_MIN = 2;

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
