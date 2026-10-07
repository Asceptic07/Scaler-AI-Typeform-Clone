"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyShareLink } from "@/features/forms/dialogs";
import {
  EmptyResults,
  ResultsError,
  ResultsSkeleton,
} from "@/features/results/feedback";
import {
  answerText,
  responseCount,
  submittedTime,
} from "@/features/results/format";
import { ResponseList } from "@/features/results/response-list";
import { ResultsShell } from "@/features/results/results-shell";
import { ResultsSummary } from "@/features/results/summary";
import { useResults } from "@/features/results/use-results";
import { errorMessage } from "@/lib/api/client";
import { resultsApi } from "@/lib/api/results";

export function Results({ formId }: { formId: number }) {
  const { form, responses, statistics, refresh, setForm } = useResults(formId);
  const [tab, setTab] = useState<"responses" | "summary">("responses");
  const [exporting, setExporting] = useState(false);
  async function exportCsv() {
    setExporting(true);
    try {
      const { blob, filename } = await resultsApi.exportCsv(formId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(false);
    }
  }
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight" || event.key === "ArrowLeft"
        ? 1 - index
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? 1
            : null;
    if (next === null) return;
    event.preventDefault();
    setTab(next === 0 ? "responses" : "summary");
    tabRefs.current[next]?.focus();
  }
  if (form.state === "loading")
    return (
      <main className="results-main">
        <ResultsSkeleton />
      </main>
    );
  if (form.state === "error")
    return (
      <main className="results-main">
        <ResultsError
          error={form.error}
          subject="form"
          retry={refresh}
          backHref="/"
        />
      </main>
    );
  const count =
    responses.state === "ready"
      ? responses.data.length
      : statistics.state === "ready"
        ? statistics.data.total_response_count
        : form.data.response_count;
  const loading =
    responses.state === "loading" || statistics.state === "loading";
  // Never turn a failed response request into a misleading empty state.
  const empty =
    count === 0 &&
    (tab === "responses"
      ? responses.state === "ready"
      : statistics.state === "ready");
  const emptyAction =
    form.data.status === "published" && form.data.public_slug ? (
      <Button onClick={() => void copyShareLink(form.data.public_slug!)}>
        <Copy size={16} />
        Copy link
      </Button>
    ) : (
      <Link className="button button-secondary" href={`/forms/${formId}`}>
        Go to content
      </Link>
    );
  return (
    <ResultsShell
      form={form.data}
      onUpdate={(data) => setForm({ state: "ready", data })}
    >
      <div className="results-heading">
        <div>
          <p className="results-eyebrow">RESULTS</p>
          <h1>Your responses</h1>
          <p className="results-total" role="status">
            {responseCount(count)}
          </p>
        </div>
        <div className="results-actions">
          <Button
            variant="secondary"
            disabled={exporting}
            aria-busy={exporting}
            onClick={() => void exportCsv()}
          >
            {exporting ? (
              <Loader2 size={15} className="spin" />
            ) : (
              <Download size={15} />
            )}
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button variant="secondary" disabled={loading} onClick={refresh}>
            <RefreshCw size={15} />
            Refresh
          </Button>
        </div>
      </div>
      <div className="results-tabs" role="tablist" aria-label="Results views">
        {(["responses", "summary"] as const).map((name, index) => (
          <button
            key={name}
            id={`results-tab-${name}`}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={tab === name}
            aria-controls={`results-panel-${name}`}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => setTab(name)}
            onKeyDown={(event) => tabKey(event, index)}
          >
            {name === "responses" ? "Responses" : "Summary"}
            {name === "responses" && (
              <span className="results-tab-count">
                {new Intl.NumberFormat().format(count)}
              </span>
            )}
          </button>
        ))}
      </div>
      {(["responses", "summary"] as const).map((name) => (
        <div
          key={name}
          role="tabpanel"
          id={`results-panel-${name}`}
          aria-labelledby={`results-tab-${name}`}
          hidden={tab !== name}
          tabIndex={0}
          className="results-panel"
        >
          {tab === name &&
            (empty ? (
              <EmptyResults
                published={form.data.status === "published"}
                action={emptyAction}
              />
            ) : name === "responses" ? (
              responses.state === "loading" ? (
                <ResultsSkeleton />
              ) : responses.state === "error" ? (
                <ResultsError
                  error={responses.error}
                  subject="responses"
                  retry={refresh}
                />
              ) : (
                <ResponseList formId={formId} responses={responses.data} />
              )
            ) : statistics.state === "loading" ? (
              <ResultsSkeleton />
            ) : statistics.state === "error" ? (
              <ResultsError
                error={statistics.error}
                subject="summary"
                retry={refresh}
              />
            ) : (
              <ResultsSummary statistics={statistics.data} />
            ))}
        </div>
      ))}
    </ResultsShell>
  );
}

export function ResponseView({
  formId,
  responseId,
}: {
  formId: number;
  responseId: number;
}) {
  const { form, response, refresh, setForm } = useResults(formId, responseId);
  const backHref = `/forms/${formId}/results`;
  if (form.state === "loading")
    return (
      <main className="results-main">
        <ResultsSkeleton detail />
      </main>
    );
  if (form.state === "error")
    return (
      <main className="results-main">
        <ResultsError
          error={form.error}
          subject="form"
          retry={refresh}
          backHref="/"
        />
      </main>
    );
  const answers = new Map(
    response.state === "ready"
      ? response.data.answers.map((answer) => [answer.question_id, answer])
      : [],
  );
  return (
    <ResultsShell
      form={form.data}
      onUpdate={(data) => setForm({ state: "ready", data })}
    >
      <Link href={backHref} className="results-back">
        <ArrowLeft size={16} />
        Back to responses
      </Link>
      {response.state === "loading" ? (
        <ResultsSkeleton detail />
      ) : response.state === "error" ? (
        <ResultsError
          error={response.error}
          subject="response"
          retry={refresh}
          backHref={backHref}
        />
      ) : (
        <>
          <div className="results-heading response-detail-heading">
            <div>
              <p className="results-eyebrow">INDIVIDUAL RESPONSE</p>
              <h1>Response #{response.data.id}</h1>
              <p className="results-total">
                Submitted{" "}
                <time dateTime={response.data.submitted_at}>
                  {submittedTime(response.data.submitted_at)}
                </time>
              </p>
            </div>
          </div>
          <p className="results-footnote">
            Submitted answers in form order. Time shown in your local time zone.
          </p>
          <div className="response-answers">
            {[...form.data.questions]
              .sort((a, b) => a.position - b.position)
              .map((question, index) => {
                const answer = answers.get(question.id);
                return (
                  <section
                    className="response-answer"
                    key={question.id}
                    aria-labelledby={`answer-question-${question.id}`}
                  >
                    <div className="results-question-heading">
                      <span
                        className="results-question-number"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <h2 id={`answer-question-${question.id}`}>
                        {question.title}
                      </h2>
                    </div>
                    <p
                      className={`answer-value ${answer === undefined ? "answer-missing" : ""}`}
                    >
                      {answer === undefined
                        ? "Not answered"
                        : answerText(answer, question.rating_max ?? 5)}
                    </p>
                  </section>
                );
              })}
          </div>
        </>
      )}
    </ResultsShell>
  );
}
