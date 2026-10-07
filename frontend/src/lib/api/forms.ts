import { request } from "@/lib/api/client";
import type { Form, FormSummary } from "@/types/form";

export const formsApi = {
  list: (signal?: AbortSignal) =>
    request<FormSummary[]>("/api/forms", { signal }),
  get: (id: number, signal?: AbortSignal) =>
    request<Form>(`/api/forms/${id}`, { signal }),
  create: (title: string) =>
    request<Form>("/api/forms", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  rename: (id: number, title: string) =>
    request<Form>(`/api/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),
  duplicate: (id: number) =>
    request<Form>(`/api/forms/${id}/duplicate`, { method: "POST" }),
  remove: (id: number) =>
    request<void>(`/api/forms/${id}`, { method: "DELETE" }),
  publish: (id: number) =>
    request<Form>(`/api/forms/${id}/publish`, { method: "POST" }),
  unpublish: (id: number) =>
    request<Form>(`/api/forms/${id}/unpublish`, { method: "POST" }),
};
