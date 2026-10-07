import { request } from "@/lib/api/client";
import type { Form, Question, QuestionInput, LogicRuleInput } from "@/types/form";

export const questionsApi = {
  saveLogic: (formId: number, id: number, rules: LogicRuleInput[]) =>
    request<Question>(`/api/forms/${formId}/questions/${id}/logic`, {
      method: "PUT", body: JSON.stringify({ rules }),
    }),
  create: (formId: number, data: QuestionInput) =>
    request<Question>(`/api/forms/${formId}/questions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (formId: number, id: number, data: Partial<QuestionInput>) =>
    request<Question>(`/api/forms/${formId}/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (formId: number, id: number) =>
    request<void>(`/api/forms/${formId}/questions/${id}`, { method: "DELETE" }),
  reorder: (formId: number, question_ids: number[]) =>
    request<Form>(`/api/forms/${formId}/questions/reorder`, {
      method: "PUT",
      body: JSON.stringify({ question_ids }),
    }),
};
