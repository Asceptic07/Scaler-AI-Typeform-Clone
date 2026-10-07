import { request } from "@/lib/api/client";
import type {
  FormStatistics,
  ResponseDetail,
  ResponseSummary,
} from "@/types/results";

export const resultsApi = {
  getResponses: (formId: number, signal?: AbortSignal) =>
    request<ResponseSummary[]>(`/api/forms/${formId}/responses`, { signal }),
  getResponse: (formId: number, responseId: number, signal?: AbortSignal) =>
    request<ResponseDetail>(`/api/forms/${formId}/responses/${responseId}`, {
      signal,
    }),
  getStatistics: (formId: number, signal?: AbortSignal) =>
    request<FormStatistics>(`/api/forms/${formId}/statistics`, { signal }),
};
