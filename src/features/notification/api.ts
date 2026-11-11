import type { AppNotification } from "@/features/notification/types";
import { apiFetch } from "@/lib/api-client";
import type { PageResponse } from "@/types/api";

type Id = string | number;

/** `/api/v1/notifications` (signed in): the current user's own notifications, newest first. */
export const notificationApi = {
  mine: (query: { unreadOnly?: boolean; page?: number; size?: number }) =>
    apiFetch<PageResponse<AppNotification>>("/notifications/me", { query }),
  unreadCount: () => apiFetch<{ count: number }>("/notifications/me/unread-count"),
  markRead: (id: Id) => apiFetch<AppNotification>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => apiFetch<{ updated: number }>("/notifications/me/read-all", { method: "PATCH" }),
};
