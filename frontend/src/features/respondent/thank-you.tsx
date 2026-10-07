"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function ThankYou({
  title,
  reducedMotion,
}: {
  title: string;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="respondent-app public-complete">
      <header className="public-header">
        <span>{title}</span>
      </header>
      <motion.main
        className="thank-you"
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.25 }}
      >
        <div className="thank-you-mark">
          <Check size={37} strokeWidth={1.5} />
        </div>
        <span className="public-eyebrow">A conversation well spent</span>
        <h1 ref={ref} tabIndex={-1}>
          Thanks for sharing!
        </h1>
        <p>
          Your response has been recorded.
          <br />
          Your perspective makes a difference.
        </p>
        <div className="thank-you-line" />
      </motion.main>
      <footer className="public-footer">
        <span className="public-brand">
          Made with <strong>Typeform Clone</strong>
        </span>
        <span className="public-done">
          All done. You can close this window.
        </span>
      </footer>
    </div>
  );
}
