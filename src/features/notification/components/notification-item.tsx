"use client";

import { AlarmClock, CalendarX2, EyeOff, Heart, Ticket, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { notificationApi } from "@/features/notification/api";
import { announceNotificationsChanged } from "@/features/notification/hooks/use-unread-count";
import { notificationHref, notificationText, relativeTime } from "@/features/notification/text";
import type { AppNotification, NotificationType } from "@/features/notification/types";
import { useLocale, useT } from "@/i18n";

const ICONS: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  BOOKING_CONFIRMED: { icon: Ticket, tone: "bg-success/15 text-success" },
  SHOWTIME_CANCELLED: { icon: CalendarX2, tone: "bg-danger/15 text-danger" },
  SHOWTIME_REMINDER: { icon: AlarmClock, tone: "bg-accent/15 text-accent" },
  REVIEW_HIDDEN: { icon: EyeOff, tone: "bg-warning/15 text-warning" },
  MOVIE_ON_SALE: { icon: Heart, tone: "bg-danger/15 text-danger" },
};

/** Marks an unread notification read in the background (the click navigates right away). */
export function markOpened(notification: AppNotification) {
  if (notification.read) return;
  notificationApi.markRead(notification.id).then(announceNotificationsChanged, () => undefined);
}

/** One notification row: type icon, translated title + text, relative time, unread dot; links to its booking / movie. */
export function NotificationItem({
  notification,
  now,
  compact = false,
  onOpen,
}: {
  notification: AppNotification;
  now: number;
  compact?: boolean;
  onOpen?: () => void;
}) {
  const t = useT();
  const { intlLocale } = useLocale();
  const { title, body } = notificationText(notification, t, intlLocale);
  const { icon: Icon, tone } = ICONS[notification.type];
  const unread = !notification.read;

  return (
    <Link
      href={notificationHref(notification)}
      onClick={() => {
        markOpened(notification);
        onOpen?.();
      }}
      className={`flex gap-3 rounded-lg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent ${
        compact ? "p-2.5" : "p-4"
      } ${unread ? "bg-accent/5" : ""}`}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-start gap-2">
          <span className={`flex-1 text-sm ${unread ? "font-bold text-fg" : "font-semibold text-fg-2"}`}>{title}</span>
          {unread && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent">
              <span className="sr-only">{t.notifications.unread}</span>
            </span>
          )}
        </span>
        <span className={`text-sm font-medium text-fg-muted ${compact ? "line-clamp-2" : ""}`}>{body}</span>
        <time dateTime={notification.createdAt} className="text-xs font-medium text-fg-subtle">
          {relativeTime(notification.createdAt, now, intlLocale, t.notifications.justNow)}
        </time>
      </span>
    </Link>
  );
}
