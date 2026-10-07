import { ApiError, request } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/config";
import type {
  FormStatistics,
  ResponseDetail,
  ResponseSummary,
} from "@/types/results";

export const resultsApi = {
  exportCsv: async (formId: number): Promise<{ blob: Blob; filename: string }> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/forms/${formId}/responses/export.csv`,
        { cache: "no-store", signal: AbortSignal.timeout(10000) },
      );
      if (!response.ok)
        throw new ApiError(
          response.status,
          "Could not export responses. Please try again.",
        );
      const filename = response.headers
        .get("Content-Disposition")
        ?.match(/filename="([^"]+)"/i)?.[1];
      return {
        blob: await response.blob(),
        filename:
          filename?.replace(/[^a-zA-Z0-9._-]/g, "_") ||
          `form-${formId}-responses.csv`,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        "Could not download responses. Check your connection and try again.",
      );
    }
  },
  getResponses: (formId: number, signal?: AbortSignal) =>
    request<ResponseSummary[]>(`/api/forms/${formId}/responses`, { signal }),
  getResponse: (formId: number, responseId: number, signal?: AbortSignal) =>
    request<ResponseDetail>(`/api/forms/${formId}/responses/${responseId}`, {
      signal,
    }),
  getStatistics: (formId: number, signal?: AbortSignal) =>
    request<FormStatistics>(`/api/forms/${formId}/statistics`, { signal }),
};
