import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren, ReactElement } from "react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export async function renderWithQuery(ui: ReactElement, client = createTestQueryClient()) {
  return { client, ...(await render(ui, { wrapper: wrapperFor(client) })) };
}

export async function renderHookWithQuery<Result, Props>(
  hook: (props: Props) => Result,
  options: { initialProps?: Props; client?: QueryClient } = {},
) {
  const client = options.client ?? createTestQueryClient();
  return {
    client,
    ...(await renderHook(hook, { wrapper: wrapperFor(client), initialProps: options.initialProps as Props })),
  };
}

/** A promise you resolve or reject from the test, to control response order. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
