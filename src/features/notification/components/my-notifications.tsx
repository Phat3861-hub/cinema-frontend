"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { notificationApi } from "@/features/notification/api";
import { NotificationItem } from "@/features/notification/components/notification-item";
import {
  announceNotificationsChanged,
  useNotificationsChanged,
  useUnreadCount,
} from "@/features/notification/hooks/use-unread-count";
import { useApi } from "@/hooks/use-api";
import { useNow } from "@/hooks/use-now";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

type Tab = "all" | "unread";

const PAGE_SIZE = 10;

/** `/notifications` (SYS-02): every notification of the signed-in user, tabs All / Unread, newest first, paged. */
export function MyNotifications() {
  const t = useT();
  const toast = useToast();
  const now = useNow();
  const unread = useUnreadCount(true);
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);
  const [marking, setMarking] = useState(false);
  const list = useApi(`notifications:me:${tab}:${page}`, () =>
    notificationApi.mine({ unreadOnly: tab === "unread", page, size: PAGE_SIZE }),
  );
  // Reading a notification here or in the bell changes this list too.
  useNotificationsChanged(list.reload);

  async function markAllRead() {
    setMarking(true);
    try {
      await notificationApi.markAllRead();
      toast.success(t.notifications.allMarked);
      // The unread tab empties; its later pages are gone.
      if (tab === "unread") setPage(0);
      announceNotificationsChanged();
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setMarking(false);
    }
  }

  const data = list.data;

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6" aria-labelledby="notifications-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="notifications-title" className="text-h6">
          {t.notifications.title}
        </h1>
        <Button variant="outline" size="md" onClick={markAllRead} loading={marking} disabled={unread === 0}>
          <CheckCheck aria-hidden className="size-4" />
          {t.notifications.markAllRead}
        </Button>
      </div>
      <Tabs
        label={t.notifications.tabs}
        value={tab}
        onChange={(value) => {
          setTab(value);
          setPage(0);
        }}
        items={[
          { value: "all", label: t.notifications.tabAll },
          { value: "unread", label: t.notifications.tabUnread, count: unread || undefined },
        ]}
      />
      {list.error !== undefined && !data ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !data ? (
        <LoadingState />
      ) : data.content.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={tab === "unread" ? t.notifications.emptyUnread : t.notifications.empty}
          description={t.notifications.emptyHint}
        />
      ) : (
        <ul className={`flex flex-col gap-1 transition-opacity ${list.loading ? "opacity-60" : ""}`}>
          {data.content.map((notification) => (
            <li key={notification.id}>
              <NotificationItem notification={notification} now={now} />
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </section>
  );
}
