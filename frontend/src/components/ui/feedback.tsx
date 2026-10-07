import { FileQuestion, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  notFound = false,
  retry,
}: {
  notFound?: boolean;
  retry: () => void;
}) {
  const Icon = notFound ? FileQuestion : WifiOff;
  return (
    <div className="feedback-state" role="alert">
      <div className="feedback-icon">
        <Icon size={26} />
      </div>
      <h2>{notFound ? "We can’t find that form" : "Let’s try that again"}</h2>
      <p>
        {notFound
          ? "It may have been deleted. You can still find your other forms in your workspace."
            : "We couldn’t reach your forms right now. Check your connection and try again."}
      </p>
      <Button variant="secondary" onClick={retry}>
        {notFound ? "Back to workspace" : "Try again"}
      </Button>
    </div>
  );
}

export function Skeleton({ builder = false }: { builder?: boolean }) {
  return (
    <div
      className={builder ? "builder-skeleton" : "forms-grid"}
      role="status"
      aria-label="Loading forms"
    >
      {[1, 2, 3].map((id) => (
        <div key={id} className="skeleton-card">
          <div className="skeleton skeleton-large" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
