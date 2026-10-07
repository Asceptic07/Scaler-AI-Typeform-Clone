import Link from "next/link";
import { FileQuestion, Inbox, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

export function ResultsSkeleton({ detail = false }: { detail?: boolean }) {
  return (
    <div
      className="results-skeleton"
      role="status"
      aria-label={detail ? "Loading response" : "Loading results"}
    >
      <div className="skeleton skeleton-line" />
      {[1, 2, 3].map((item) => (
        <div key={item} className="results-skeleton-row" aria-hidden="true">
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export function ResultsError({
  error,
  subject,
  retry,
  backHref,
}: {
  error: unknown;
  subject: "form" | "response" | "responses" | "summary";
  retry: () => void;
  backHref?: string;
}) {
  const missing = error instanceof ApiError && error.status === 404;
  const Icon = missing ? FileQuestion : WifiOff;
  return (
    <div className="results-feedback" role="alert">
      <div className="feedback-icon">
        <Icon size={25} />
      </div>
      <h2>
        {missing
          ? `We can’t find that ${subject === "responses" || subject === "summary" ? "form" : subject}`
          : `We couldn’t load ${subject === "form" ? "this form" : subject === "summary" ? "the summary" : subject === "responses" ? "the responses" : "this response"}`}
      </h2>
      <p>
        {missing
          ? "It may have been removed, or the link may be incorrect."
          : "Check your connection and try again. Your saved answers are safe."}
      </p>
      {missing && backHref ? (
        <Link className="button button-secondary" href={backHref}>
          {subject === "form" ? "Back to workspace" : "Back to responses"}
        </Link>
      ) : (
        <Button variant="secondary" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyResults({
  published,
  action,
}: {
  published: boolean;
  action: React.ReactNode;
}) {
  return (
    <div className="results-feedback results-empty">
      <div className="feedback-icon">
        <Inbox size={27} />
      </div>
      <h2>No responses yet</h2>
      <p>
        {published
          ? "Your next conversation is a link away. Share your form to start collecting answers."
          : "Publish your form when you’re ready to start collecting answers."}
      </p>
      {action}
    </div>
  );
}
