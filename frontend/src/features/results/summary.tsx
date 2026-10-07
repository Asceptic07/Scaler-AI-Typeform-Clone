import type { FormStatistics } from "@/types/results";

export function ResultsSummary({ statistics }: { statistics: FormStatistics }) {
  return (
    <div className="results-summary">
      <p className="results-footnote summary-note">
        A closer look at your answers. Percentages are based on answered
        submissions for each question.
      </p>
      {statistics.questions.map((question, index) => {
        const average =
          question.type === "rating" && question.answered_count > 0
            ? question.distribution.reduce(
                (total, item) => total + Number(item.value) * item.count,
                0,
              ) / question.answered_count
            : null;
        return (
          <section
            className="question-summary"
            key={question.question_id}
            aria-labelledby={`summary-question-${question.question_id}`}
          >
            <div className="results-question-heading">
              <span className="results-question-number" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h2 id={`summary-question-${question.question_id}`}>
                  {question.title}
                </h2>
                <p>
                  {question.answered_count} of {statistics.total_response_count}{" "}
                  answered
                  {average !== null && (
                    <span className="rating-average">
                      Average:{" "}
                      {new Intl.NumberFormat(undefined, {
                        maximumFractionDigits: 1,
                      }).format(average)}{" "}
                      / 5
                    </span>
                  )}
                </p>
              </div>
            </div>
            {question.distribution.length > 0 && (
              <ul
                className="distribution-list"
                aria-label="Answer distribution"
              >
                {question.distribution.map((item) => {
                  const proportion =
                    question.answered_count === 0
                      ? 0
                      : item.count / question.answered_count;
                  const percent = new Intl.NumberFormat(undefined, {
                    style: "percent",
                    maximumFractionDigits: 1,
                  }).format(proportion);
                  return (
                    <li className="distribution-row" key={String(item.value)}>
                      <div className="distribution-label">
                        <span>{item.label}</span>
                        <span className="distribution-count">
                          {item.count} <span>· {percent}</span>
                        </span>
                      </div>
                      <div className="distribution-track" aria-hidden="true">
                        <div
                          className="distribution-bar"
                          style={{ width: `${proportion * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
