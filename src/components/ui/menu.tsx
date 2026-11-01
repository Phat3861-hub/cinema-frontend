"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type MenuItem =
  | { kind: "link"; href: string; label: ReactNode; icon?: ReactNode }
  | { kind: "button"; onSelect: () => void; label: ReactNode; icon?: ReactNode; danger?: boolean }
  | { kind: "separator" };

const ITEM =
  "flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2 text-left text-sm font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-accent";

/** Disclosure dropdown (avatar menu, row actions): closes on outside click, Esc and item selection. */
export function Menu({
  trigger,
  triggerLabel,
  items,
  align = "end",
  header,
}: {
  trigger: ReactNode;
  triggerLabel: string;
  items: MenuItem[];
  align?: "start" | "end";
  header?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          className={`absolute top-full z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-xl ${align === "end" ? "right-0" : "left-0"}`}
        >
          {header && <div className="border-b border-line px-3 pt-2 pb-3">{header}</div>}
          <ul className="flex flex-col gap-0.5 pt-1">
            {items.map((item, index) => {
              if (item.kind === "separator") return <li key={index} aria-hidden className="my-1 h-px bg-line" />;
              const tone =
                item.kind === "button" && item.danger
                  ? "text-danger hover:bg-danger/10"
                  : "text-fg-2 hover:bg-surface-2 hover:text-fg";
              return (
                <li key={index}>
                  {item.kind === "link" ? (
                    <Link href={item.href} className={`${ITEM} ${tone}`} onClick={() => setOpen(false)}>
                      {item.icon}
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`${ITEM} ${tone}`}
                      onClick={() => {
                        setOpen(false);
                        item.onSelect();
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
