import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

import { getErrorStatus } from "@/lib/errors";

export default function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            // Retry transient failures only. A 4xx (bad input, not found, expired session)
            // will fail the same way again, so retrying just delays the error.
            retry: (failureCount, error) => {
              const status = getErrorStatus(error);
              if (status !== undefined && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            // On mobile "focus" means returning to the foreground (see QueryAppState).
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
