import type { QuestionType } from "@/types/form";
import type { ResponseReceipt } from "@/types/respondent";

export interface AnswerDetail {
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  value: string | number | boolean;
  option_id: number | null;
  option_label: string | null;
}

// The list endpoint includes full answers, just like the detail endpoint.
export interface ResponseDetail extends ResponseReceipt {
  answers: AnswerDetail[];
}
export type ResponseSummary = ResponseDetail;

export interface DistributionItem {
  value: number | boolean;
  label: string;
  count: number;
}
export interface QuestionStatistics {
  question_id: number;
  title: string;
  type: QuestionType;
  answered_count: number;
  distribution: DistributionItem[];
}
export interface FormStatistics {
  form_id: number;
  total_response_count: number;
  questions: QuestionStatistics[];
}
