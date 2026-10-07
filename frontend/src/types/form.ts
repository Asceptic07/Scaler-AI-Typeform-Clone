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
export interface LogicRuleInput {
  condition_option_id?: number | null;
  condition_boolean_value?: boolean | null;
  condition_rating_value?: number | null;
  target_question_id: number | null;
}
export interface LogicRule extends LogicRuleInput {
  id: number;
}
export interface Question {
  id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  options: QuestionOption[];
  logic_rules: LogicRule[];
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
