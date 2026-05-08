import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { isNativeApiEnabled, nativeApiRequest } from "./nativeApi";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  if (isNativeApiEnabled() && url.startsWith("/api/")) {
    const nativeRes = await nativeApiRequest(method, url, data);
    await throwIfResNotOk(nativeRes);
    return nativeRes;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

export async function apiJson<T = any>(
  method: string,
  url: string,
  data?: unknown,
): Promise<T> {
  const res = await apiRequest(method, url, data);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/");
    if (isNativeApiEnabled() && url.startsWith("/api/")) {
      const nativeRes = await nativeApiRequest("GET", url);
      if (unauthorizedBehavior === "returnNull" && nativeRes.status === 401) {
        return null;
      }
      await throwIfResNotOk(nativeRes);
      return await nativeRes.json();
    }

    const res = await fetch(`${API_BASE}${queryKey.join("/")}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
