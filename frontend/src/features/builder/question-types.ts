import {
  AlignLeft,
  ChevronDown,
  Hash,
  ListChecks,
  Mail,
  Star,
  ToggleLeft,
  Type,
} from "lucide-react";
import type { QuestionType } from "@/types/form";

export const questionTypes = [
  {
    type: "short_text",
    label: "Short text",
    description: "A few words can say a lot",
    Icon: Type,
    color: "blue",
  },
  {
    type: "long_text",
    label: "Long text",
    description: "Give your answers room to breathe",
    Icon: AlignLeft,
    color: "blue",
  },
  {
    type: "multiple_choice",
    label: "Multiple choice",
    description: "A simple choice of options",
    Icon: ListChecks,
    color: "sage",
  },
  {
    type: "dropdown",
    label: "Dropdown",
    description: "All your options in one tidy list",
    Icon: ChevronDown,
    color: "sage",
  },
  {
    type: "email",
    label: "Email",
    description: "Keep the conversation going",
    Icon: Mail,
    color: "peach",
  },
  {
    type: "number",
    label: "Number",
    description: "When the numbers matter",
    Icon: Hash,
    color: "peach",
  },
  {
    type: "yes_no",
    label: "Yes / No",
    description: "One question. Two possibilities",
    Icon: ToggleLeft,
    color: "lavender",
  },
  {
    type: "rating",
    label: "Rating",
    description: "Let them give you a little feedback",
    Icon: Star,
    color: "yellow",
  },
] satisfies {
  type: QuestionType;
  label: string;
  description: string;
  Icon: typeof Type;
  color: string;
}[];

export function typeInfo(type: QuestionType) {
  return questionTypes.find((item) => item.type === type)!;
}
export function isChoice(type: QuestionType) {
  return type === "multiple_choice" || type === "dropdown";
}
