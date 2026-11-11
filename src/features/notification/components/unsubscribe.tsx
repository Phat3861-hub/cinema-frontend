"use client";

import { CircleX, MailCheck, MailX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/constants/routes";
import { notificationApi } from "@/features/notification/api";
import type { EmailSubscription } from "@/features/notification/types";
import { useT } from "@/i18n";
import { getErrorMessage } from "@/lib/error-messages";

type State = { kind: "working" } | { kind: "done"; result: EmailSubscription } | { kind: "error"; error?: unknown };

/**
 * Opens from the link in an email (`/unsubscribe?token=`): opts the address out of reminder emails at once (no
 * sign-in, repeating it is harmless) and offers to undo it.
 */
export function Unsubscribe({ token }: { token?: string }) {
  const t = useT();
  const text = t.notifications.unsubscribe;
  const [state, setState] = useState<State>(token ? { kind: "working" } : { kind: "error" });
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    notificationApi.unsubscribe(token).then(
      (result) => !cancelled && setState({ kind: "done", result }),
      (error: unknown) => !cancelled && setState({ kind: "error", error }),
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function change(action: "unsubscribe" | "resubscribe") {
    if (!token) return;
    setUndoing(true);
    try {
      setState({ kind: "done", result: await notificationApi[action](token) });
    } catch (error) {
      setState({ kind: "error", error });
    } finally {
      setUndoing(false);
    }
  }

  if (state.kind === "working") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-6 text-fg-2">
        <Spinner className="size-10 text-accent" />
        <p className="text-sm font-medium">{text.working}</p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <CircleX aria-hidden className="size-16 text-danger" strokeWidth={1.5} />
        <p role="alert" className="text-sm font-medium text-fg-2">
          {state.error === undefined ? t.errors.UNSUBSCRIBE_TOKEN_INVALID : getErrorMessage(state.error, t)}
        </p>
        <Link href={ROUTES.home} className={buttonClasses({ variant: "outline", fullWidth: true })}>
          {t.common.backHome}
        </Link>
      </div>
    );
  }

  const { email, unsubscribed } = state.result;
  const Icon = unsubscribed ? MailX : MailCheck;
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Icon aria-hidden className={`size-16 ${unsubscribed ? "text-fg-muted" : "text-success"}`} strokeWidth={1.5} />
      <div role="status" className="flex flex-col gap-2">
        <p className="text-sm font-bold">{unsubscribed ? text.done(email) : text.undone(email)}</p>
        <p className="text-sm font-medium text-fg-muted">{unsubscribed ? text.doneHint : text.undoneHint}</p>
      </div>
      <Button variant="outline" fullWidth loading={undoing} onClick={() => change(unsubscribed ? "resubscribe" : "unsubscribe")}>
        {unsubscribed ? text.undo : text.again}
      </Button>
      <Link href={ROUTES.home} className={buttonClasses({ fullWidth: true })}>
        {t.common.backHome}
      </Link>
    </div>
  );
}
