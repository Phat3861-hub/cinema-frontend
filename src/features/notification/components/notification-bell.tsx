"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useSession } from "@/features/auth/components/session-provider";
import { notificationApi } from "@/features/notification/api";
import { NotificationItem } from "@/features/notification/components/notification-item";
import { useNotificationStream } from "@/features/notification/hooks/use-notification-stream";
import { announceNotificationsChanged, useUnreadCount } from "@/features/notification/hooks/use-unread-count";
import { useApi } from "@/hooks/use-api";
import { useNow } from "@/hooks/use-now";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

const RECENT_SIZE = 8;
const PANEL_WIDTH = 384;
const GUTTER = 16;

/**
 * Viewport position under the bell, kept on screen. The panel is portalled to <body> because the header's
 * backdrop-blur would otherwise become the containing block of a fixed panel.
 */
function panelPosition(button: HTMLElement) {
  const rect = button.getBoundingClientRect();
  const width = Math.min(PANEL_WIDTH, window.innerWidth - 2 * GUTTER);
  const right = Math.max(GUTTER, Math.min(window.innerWidth - rect.right, window.innerWidth - GUTTER - width));
  return { top: rect.bottom + 8, right, width };
}

/**
 * Bell with the unread badge (customer header + admin topbar); the dropdown loads the latest notifications each time
 * it opens, with "mark all read" and a link to the full list. Renders nothing while signed out.
 */
export function NotificationBell() {
  const t = useT();
  const toast = useToast();
  const now = useNow();
  const { user } = useSession();
  const count = useUnreadCount(Boolean(user));
  // The bell is on every signed-in page exactly once, so it owns the live connection.
  useNotificationStream(user?.id ?? null);
  const [position, setPosition] = useState<ReturnType<typeof panelPosition> | null>(null);
  const open = position !== null;
  const [marking, setMarking] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const recent = useApi(open ? "notifications:recent" : null, () => notificationApi.mine({ size: RECENT_SIZE }));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setPosition(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPosition(null);
        buttonRef.current?.focus();
      }
    }
    function onResize() {
      if (buttonRef.current) setPosition(panelPosition(buttonRef.current));
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  if (!user) return null;

  async function markAllRead() {
    setMarking(true);
    try {
      await notificationApi.markAllRead();
      recent.setData((page) => page && { ...page, content: page.content.map((n) => ({ ...n, read: true })) });
      announceNotificationsChanged();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setMarking(false);
    }
  }

  const items = recent.data?.content ?? [];
  const close = () => setPosition(null);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t.notifications.bell(count)}
        title={t.notifications.title}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => setPosition(open ? null : panelPosition(event.currentTarget))}
        className="relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Bell aria-hidden className="size-5" />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] leading-none font-bold text-white"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {position &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="region"
            aria-label={t.notifications.recent}
            style={{
              top: position.top,
              right: position.right,
              width: position.width,
              maxHeight: `min(32rem, calc(100dvh - ${position.top + GUTTER}px))`,
            }}
            className="fixed z-50 flex flex-col rounded-xl border border-line bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <p className="font-bold">{t.notifications.title}</p>
              <button
                type="button"
                onClick={markAllRead}
                disabled={marking || count === 0}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-accent hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCheck aria-hidden className="size-4" />
                {t.notifications.markAllRead}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {recent.error !== undefined && items.length === 0 ? (
                <ErrorState error={recent.error} onRetry={recent.reload} />
              ) : recent.loading && items.length === 0 ? (
                <LoadingState />
              ) : items.length === 0 ? (
                <EmptyState icon={Bell} title={t.notifications.empty} description={t.notifications.emptyHint} />
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {items.map((notification) => (
                    <li key={notification.id}>
                      <NotificationItem notification={notification} now={now} compact onOpen={close} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link
              href={ROUTES.notifications}
              onClick={close}
              className="rounded-b-xl border-t border-line px-4 py-3 text-center text-sm font-semibold text-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
            >
              {t.notifications.viewAll}
            </Link>
          </div>,
          document.body,
        )}
    </div>
  );
}
