"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getSessionVersion, subscribe } from "@/lib/api/token-store";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          const status = isAxiosError(error) ? error.response?.status : undefined;
          if (status && status >= 400 && status < 500 && status !== 408 && status !== 429)
            return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSessionVersion, () => 0);
  const [client] = useState(makeQueryClient);

  useEffect(() => {
    client.clear();
  }, [client, session]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
