import { ChevronDown, ChevronUp } from "lucide-react";

export function Navigation({
  current,
  total,
  disabled,
  last,
  onPrevious,
  onNext,
}: {
  current: number;
  total: number;
  disabled: boolean;
  last: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <footer className="public-footer">
      <span className="public-brand">
        Made with <strong>Typeform Clone</strong>
      </span>
      <div className="public-navigation" data-navigation>
        <span aria-live="polite">
          {current + 1} <span>of</span> {total}
        </span>
        <div>
          <button
            type="button"
            aria-label="Previous question"
            disabled={disabled || current === 0}
            onClick={onPrevious}
          >
            <ChevronUp size={21} />
          </button>
          <button
            type="button"
            aria-label="Next question"
            disabled={disabled || last}
            onClick={onNext}
          >
            <ChevronDown size={21} />
          </button>
        </div>
      </div>
    </footer>
  );
}
