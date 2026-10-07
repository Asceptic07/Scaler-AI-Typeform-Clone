import { ApiError, request } from "@/lib/api/client";
import type {
  PublicForm,
  ResponsePayload,
  ResponseReceipt,
} from "@/types/respondent";

export class PublicApiError extends ApiError {
  constructor(
    status: number,
    message: string,
    public questionId?: number,
  ) {
    super(status, message);
  }
}

function validationQuestion(
  details: unknown,
  payload: ResponsePayload,
): number | undefined {
  if (typeof details === "string") {
    const match = /^Question (\d+):/.exec(details);
    return match ? Number(match[1]) : undefined;
  }
  if (Array.isArray(details)) {
    for (const item of details) {
      const location = item?.loc;
      if (!Array.isArray(location)) continue;
      const index = location.indexOf("answers");
      if (index >= 0 && typeof location[index + 1] === "number") {
        return payload.answers[location[index + 1]]?.question_id;
      }
    }
  }
}

export function getPublicForm(slug: string, signal?: AbortSignal) {
  return request<PublicForm>(`/api/public/forms/${encodeURIComponent(slug)}`, {
    signal,
  });
}

export async function submitPublicResponse(
  slug: string,
  payload: ResponsePayload,
): Promise<ResponseReceipt> {
  try {
    return await request<ResponseReceipt>(
      `/api/public/forms/${encodeURIComponent(slug)}/responses`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    if (!(error instanceof ApiError))
      throw new PublicApiError(
        0,
        "Your response wasn’t confirmed. Your answers are still here. Please try again.",
      );
    const messages: Record<number, string> = {
      0: "Your response wasn’t confirmed. Your answers are still here. Please try again.",
      404: "This form isn’t accepting responses right now. Your answers are still here. Please try again later.",
      422: "Please check this answer and try again.",
    };
    throw new PublicApiError(
      error.status,
      messages[error.status] ??
        "We couldn’t record your response. Your answers are still here. Please try again.",
      error.status === 422
        ? validationQuestion(error.details, payload)
        : undefined,
    );
  }
}
