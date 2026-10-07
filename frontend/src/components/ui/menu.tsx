"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

export interface MenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
}
export function Menu({
  label,
  items,
  disabled,
}: {
  label: string;
  items: MenuItem[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div
      ref={ref}
      className="menu-wrap"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }
        if (
          open &&
          ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
        ) {
          event.preventDefault();
          const buttons = Array.from(
            ref.current?.querySelectorAll<HTMLButtonElement>(
              "[role=menuitem]",
            ) ?? [],
          );
          const current = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (current +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    buttons.length) %
                  buttons.length;
          buttons[next]?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="icon-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div role="menu" aria-label={label} className="dropdown-menu">
          {items.map((item) => (
            <button
              role="menuitem"
              key={item.label}
              className={item.danger ? "danger-text" : ""}
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
                item.onClick();
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
