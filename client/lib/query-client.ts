import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 60 seconds — avoids redundant refetches
        // when the user navigates between pages quickly.
        staleTime: 60 * 1000,
        // Keep inactive query data in cache for 5 minutes.
        gcTime: 5 * 60 * 1000,
        // Retry once on failure (e.g. flaky network), then give up.
        retry: 1,
        // Refetch when the user returns to the tab.
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Server: always create a fresh client (no shared state between requests).
// Client: reuse a singleton so the cache persists across navigations.
let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
