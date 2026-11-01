"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useT } from "@/i18n";

/** Side panel on the native <dialog> (mobile navigation): focus trap + Esc + backdrop click. */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: ReactNode;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === ref.current && onClose()}
      className={
        "fixed inset-y-0 m-0 h-dvh max-h-none w-[min(20rem,85vw)] max-w-none border-line bg-surface p-0 text-fg " +
        "backdrop:bg-black/60 " +
        (side === "right" ? "right-0 left-auto border-l" : "left-0 border-r")
      }
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-h8">{title}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="flex size-10 cursor-pointer items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
