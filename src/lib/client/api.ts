"use client";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      headers: json !== undefined ? { "content-type": "application/json", ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "Sem conexão. Verifique a internet e tente de novo.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/entrar")) {
      // Outside React (shared fetch helper), so a hard navigation is the right tool here.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      location.href = `/entrar?next=${encodeURIComponent(location.pathname)}`;
    }
    throw new ApiError(res.status, (data as { error?: string }).error ?? "Algo deu errado. Tente de novo.");
  }
  return data as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado.");
