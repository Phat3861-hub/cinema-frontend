"use client";

import { CircleAlert, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

/** Grey placeholder block shown while data loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-surface-3 motion-reduce:animate-none ${className}`} />;
}

export function LoadingState({ label }: { label?: string }) {
  const t = useT();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-fg-muted">
      <Spinner />
      <span className="text-sm font-medium">{label ?? t.common.loading}</span>
    </div>
  );
}

/** Empty list: icon + text + optional action (e.g. "create the first movie"). */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-surface-2">
        <Icon aria-hidden className="size-7 text-fg-muted" strokeWidth={1.5} />
      </div>
      <p className="text-h8">{title}</p>
      {description && <p className="max-w-md text-sm font-medium text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Failed load with the translated error and a retry button. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <CircleAlert aria-hidden className="size-10 text-danger" strokeWidth={1.5} />
      <p className="max-w-md text-sm font-medium text-fg-2">{getErrorMessage(error, t)}</p>
      {onRetry && (
        <Button variant="outline" size="md" onClick={onRetry}>
          {t.common.retry}
        </Button>
      )}
    </div>
  );
}
