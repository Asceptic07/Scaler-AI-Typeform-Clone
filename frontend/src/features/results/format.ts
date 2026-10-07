import type { AnswerDetail } from "@/types/results";

export function responseCount(count: number) {
  return `${new Intl.NumberFormat().format(count)} ${count === 1 ? "response" : "responses"}`;
}

export function submittedTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function answerText(answer: AnswerDetail, ratingMax = 5): string {
  switch (answer.question_type) {
    case "multiple_choice":
    case "dropdown":
      return answer.option_label ?? "Choice unavailable";
    case "yes_no":
      return answer.value === true ? "Yes" : "No";
    case "rating":
      return `${answer.value} / ${ratingMax}`;
    case "number":
      return new Intl.NumberFormat(undefined, {
        maximumSignificantDigits: 16,
      }).format(Number(answer.value));
    default:
      return String(answer.value);
  }
}
