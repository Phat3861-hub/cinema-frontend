"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const WIDTHS = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

/** Modal built on the native <dialog>: focus trap, Esc to close and the backdrop come from the browser. */
export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: DialogProps) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the ::backdrop targets the dialog element itself.
        if (event.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${WIDTHS[size]} rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-h8">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm font-medium text-fg-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="-mr-2 flex size-9 cursor-pointer items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {children && <div className="overflow-y-auto px-6 py-5">{children}</div>}
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** Yes / no dialog for destructive actions (delete, lock user, remove role). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = "danger",
  loading = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <Dialog
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button variant={tone} size="md" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
