import { FileQuestion, Loader2, WifiOff } from "lucide-react";

export function PublicState({
  state,
  onRetry,
}: {
  state: "loading" | "unavailable" | "network" | "empty";
  onRetry?: () => void;
}) {
  const Icon =
    state === "loading"
      ? Loader2
      : state === "network"
        ? WifiOff
        : FileQuestion;
  return (
    <div className="respondent-app">
      <main className="public-state" aria-live="polite">
        <span className="public-state-icon">
          <Icon
            size={29}
            strokeWidth={1.5}
            className={state === "loading" ? "spin" : ""}
          />
        </span>
        <h1>
          {state === "loading"
            ? "One moment…"
            : state === "unavailable"
              ? "This form isn’t available"
              : state === "empty"
                ? "Nothing to answer just yet"
                : "Let’s try that again"}
        </h1>
        <p>
          {state === "loading"
            ? "Getting your conversation ready."
            : state === "unavailable"
              ? "It may be unpublished or the link may have changed. Please check with the person who shared it."
              : state === "empty"
                ? "This form doesn’t have any questions yet. Please check back later."
                : "We couldn’t load this form. Check your connection and try again."}
        </p>
        {state === "network" && (
          <button className="public-primary" onClick={onRetry}>
            Try again
          </button>
        )}
      </main>
      <footer className="public-footer">
        <span className="public-brand">
          Made with <strong>Typeform Clone</strong>
        </span>
      </footer>
    </div>
  );
}
