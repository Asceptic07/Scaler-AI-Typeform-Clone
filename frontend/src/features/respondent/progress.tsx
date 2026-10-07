import { motion } from "framer-motion";

export function Progress({
  title,
  current,
  total,
  reducedMotion,
}: {
  title: string;
  current: number;
  total: number;
  reducedMotion: boolean;
}) {
  return (
    <>
      <header className="public-header">
        <span>{title}</span>
        <span className="public-header-hint">
          A little of your time. A lot of insight.
        </span>
      </header>
      <div
        className="public-progress"
        role="progressbar"
        aria-label="Question progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-valuetext={`Question ${current + 1} of ${total}`}
      >
        <motion.div
          initial={false}
          animate={{ scaleX: (current + 1) / total }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        />
      </div>
    </>
  );
}
