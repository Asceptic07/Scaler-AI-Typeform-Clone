import type { Question } from "@/types/form";
import type {
  Answers,
  AnswerValue,
  PublicForm,
  ResponsePayload,
} from "@/types/respondent";

export function isEmpty(value: AnswerValue | undefined): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  );
}

export function validateAnswer(
  question: Question,
  value: AnswerValue | undefined,
): string | null {
  if (isEmpty(value))
    return question.required
      ? "Please answer this question to continue."
      : null;
  switch (question.type) {
    case "short_text":
    case "long_text": {
      if (typeof value !== "string") return "Please enter a text answer.";
      const limit = question.type === "short_text" ? 1000 : 20000;
      return Array.from(value).length > limit
        ? `Please keep your answer to ${limit.toLocaleString("en")} characters or fewer.`
        : null;
    }
    case "email":
      return typeof value === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) &&
        value.trim().length <= 254
        ? null
        : "Please enter a valid email address.";
    case "number": {
      if (
        typeof value !== "string" ||
        !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())
      )
        return "Please enter a valid number.";
      const number = Number(value);
      if (!Number.isFinite(number)) return "Please enter a finite number.";
      if (/^[+-]?\d+$/.test(value.trim())) {
        const integer = BigInt(value.trim());
        const limit = BigInt("9007199254740992");
        if (integer > limit || integer < -limit)
          return "That number is too large. Please choose a smaller value.";
      }
      if (Number.isInteger(number) && Math.abs(number) > 2 ** 53)
        return "That number is too large. Please choose a smaller value.";
      return null;
    }
    case "multiple_choice":
    case "dropdown":
      return typeof value === "number" &&
        question.options.some((option) => option.id === value)
        ? null
        : "Please choose one of the available options.";
    case "yes_no":
      return typeof value === "boolean" ? null : "Please choose Yes or No.";
    case "rating":
      return typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 5
        ? null
        : "Please choose a rating from 1 to 5.";
  }
}

export function createPayload(
  form: PublicForm,
  answers: Answers,
): ResponsePayload {
  return {
    answers: form.questions
      .filter((question) => !isEmpty(answers[question.id]))
      .map((question) => {
        const value = answers[question.id];
        return {
          question_id: question.id,
          value:
            question.type === "number"
              ? Number(value)
              : question.type === "email" && typeof value === "string"
                ? value.trim()
                : value,
        };
      }),
  };
}
