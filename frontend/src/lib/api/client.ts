import { API_BASE_URL } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: options.signal ?? AbortSignal.timeout(10000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      0,
      "We couldn’t connect. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const messages: Record<number, string> = {
      400: "Add at least one question before publishing your form.",
      404: "This form or question is no longer available.",
      409: "Questions can’t be changed while published or after receiving responses. Unpublish or duplicate this form to edit it.",
      422: "Check your text and choices. Titles and choices can’t be blank, and choice labels must be unique.",
    };
    throw new ApiError(
      response.status,
      messages[response.status] ?? "That didn’t work. Please try again.",
      body?.detail,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}
