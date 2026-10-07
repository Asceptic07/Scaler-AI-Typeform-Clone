export type FormStatus = "draft" | "published";
export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export interface QuestionOption {
  id: number;
  label: string;
  position: number;
}
export interface Question {
  id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  options: QuestionOption[];
  rating_min: number | null;
  rating_max: number | null;
}
export interface FormSummary {
  id: number;
  title: string;
  status: FormStatus;
  public_slug: string | null;
  response_count: number;
  created_at: string;
  updated_at: string;
}
export interface Form extends FormSummary {
  questions: Question[];
}
export interface QuestionInput {
  type: QuestionType;
  title: string;
  description?: string | null;
  required?: boolean;
  options?: { label: string }[];
}
