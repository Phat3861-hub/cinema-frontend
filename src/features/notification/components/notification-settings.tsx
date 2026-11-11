"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { notificationApi } from "@/features/notification/api";
import type { NotificationPreferences, NotificationType, PreferencesUpdate } from "@/features/notification/types";
import { useApi } from "@/hooks/use-api";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

/**
 * Notification settings of the signed-in user: per type, whether it shows in the app and is emailed. Types the
 * backend marks as not optional (tickets, cancelled showtimes) are shown ticked and locked. Each change is saved at
 * once; a failed save puts the previous state back.
 */
export function NotificationSettings() {
  const t = useT();
  const toast = useToast();
  const settings = useApi("notifications:preferences", notificationApi.preferences);
  const [saving, setSaving] = useState(false);
  const data = settings.data;
  const text = t.notifications.settings;

  async function save(next: NotificationPreferences, update: PreferencesUpdate) {
    const previous = settings.data;
    settings.setData(() => next);
    setSaving(true);
    try {
      const saved = await notificationApi.updatePreferences(update);
      settings.setData(() => saved);
    } catch (error) {
      settings.setData(() => previous);
      toast.error(getErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  }

  function toggle(type: NotificationType, channel: "email" | "inApp", checked: boolean) {
    if (!data) return;
    const types = data.types.map((item) => (item.type === type ? { ...item, [channel]: checked } : item));
    const changed = types.find((item) => item.type === type)!;
    void save({ ...data, types }, { types: [{ type, email: changed.email, inApp: changed.inApp }] });
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6"
      aria-labelledby="notification-settings-title"
    >
      <div>
        <h2 id="notification-settings-title" className="text-h8 flex items-center gap-2">
          <Settings aria-hidden className="size-5" />
          {text.title}
        </h2>
        <p className="mt-1 text-sm font-medium text-fg-muted">{text.hint}</p>
      </div>
      {settings.error !== undefined && !data ? (
        <ErrorState error={settings.error} onRetry={settings.reload} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-line">
            {data.types.map((item) => (
              <li key={item.type} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{t.notifications.types[item.type].title}</p>
                  <p className="text-xs font-medium text-fg-muted">
                    {text.typeHint[item.type]}
                    {!item.optional && ` ${text.alwaysOn}`}
                  </p>
                </div>
                <div className="grid shrink-0 grid-cols-[9.5rem_5rem] gap-4">
                  <Checkbox
                    label={text.inApp}
                    checked={item.inApp}
                    disabled={!item.optional || saving}
                    onChange={(event) => toggle(item.type, "inApp", event.target.checked)}
                  />
                  {item.emailAvailable && (
                    <Checkbox
                      label={text.email}
                      checked={item.email && !(item.optional && data.emailUnsubscribed)}
                      disabled={!item.optional || saving || data.emailUnsubscribed}
                      onChange={(event) => toggle(item.type, "email", event.target.checked)}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-surface-2 p-4">
            <Checkbox
              label={text.unsubscribeAll}
              description={text.unsubscribeAllHint}
              checked={data.emailUnsubscribed}
              disabled={saving}
              onChange={(event) =>
                void save({ ...data, emailUnsubscribed: event.target.checked }, { emailUnsubscribed: event.target.checked })
              }
            />
          </div>
        </>
      )}
    </section>
  );
}
