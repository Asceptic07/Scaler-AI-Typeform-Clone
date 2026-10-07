import type { Question } from "@/types/form";

export interface PublicForm {
  id: number;
  public_slug: string;
  title: string;
  questions: Question[];
}

export type AnswerValue = string | number | boolean | null;
export type Answers = Record<number, AnswerValue>;
export interface ResponsePayload {
  answers: { question_id: number; value: AnswerValue }[];
}
export interface ResponseReceipt {
  id: number;
  submitted_at: string;
}
