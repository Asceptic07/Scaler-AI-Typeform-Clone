import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { answerText, submittedTime } from "@/features/results/format";
import type { ResponseSummary } from "@/types/results";

export function ResponseList({
  responses,
  formId,
}: {
  responses: ResponseSummary[];
  formId: number;
}) {
  return (
    <div className="response-list">
      <div className="response-list-heading" aria-hidden="true">
        <span>Response</span>
        <span>Submitted</span>
        <span>Answer preview</span>
        <span />
      </div>
      <ul aria-label="Submitted responses">
        {responses.map((response) => {
          const preview = response.answers
            .slice(0, 2)
            .map((answer) => answerText(answer))
            .join(" · ");
          return (
            <li key={response.id}>
              <Link
                className="response-row"
                href={`/forms/${formId}/results/${response.id}`}
                aria-label={`Open response #${response.id}, ${submittedTime(response.submitted_at)}`}
              >
                <span className="response-name">Response #{response.id}</span>
                <time dateTime={response.submitted_at}>
                  {submittedTime(response.submitted_at)}
                </time>
                <span className="response-preview" title={preview}>
                  {preview || "No answers submitted"}
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="results-footnote">
        Newest responses first. Times shown in your local time zone.
      </p>
    </div>
  );
}
